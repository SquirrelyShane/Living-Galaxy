/* Living Galaxy — how two people on a hull get from strangers to a family.
 *
 * an earlier build had one rung: rapport crossed 55, both were drawn to each other, a die
 * came up, and they were "official aboard". Everything before that was a
 * number going up, and everything after it was a 5% conception roll per pay
 * cycle. This is the ladder that was missing.
 *
 *   strangers → noticed → interested → courting → together → bonded
 *
 * Every rung is earned by something that actually happened on the deck and is
 * on the record for it (deckmind writes the journal entry either way): a
 * watch stood side by side, a walk out at a port, a gift, something said in
 * confidence, an argument mended. Each rung needs BOTH people to want it —
 * mutual attraction is a hard gate at every step, not a coin flip at the end
 * — and close kin never start the climb at all.
 *
 * Private evenings are fade-to-black in core. An optional addon may listen
 * on hooks.onPrivateNight; core never imports that pack.
 *
 */

import { crew, crewNote, firstName, rapportBetween } from "../crew.js";
import { cradle, drawnTo } from "../npc/cradle.js";
import { social, loadSocial, adjustMorale, household } from "../family.js";
import { adjustRapport, tieBetween } from "./bonds.js";
import { genomeCompat, kinship, unpackGenome, KIN_BLOCK, GENE } from "../genome/spacer.js";
import { sim } from "../sim.js";
import { runHooks } from "./hooks.js";

/* Genomes come off the member rather than out of deckmind, so this module
 * serves a provisional NPC hand (who is not on the ledger) exactly as well as
 * one of yours — and so nothing here has to import the loop that calls it. */
const _g = new Map();
function genomeFor(m) {
  if (!m?.id) return null;
  if (_g.has(m.id)) return _g.get(m.id);
  let g = null;
  const packed = m.genome ?? cradle.get(m.id)?.genome ?? null;
  if (packed) { try { g = unpackGenome(packed).genome; } catch { g = null; } }
  _g.set(m.id, g);
  return g;
}
export function forgetRomanceGenome(id) { if (id) _g.delete(id); else _g.clear(); }

/** Coefficient of relationship between two hands, from whatever genomes they carry. */
export function kinBetween(a, b) {
  const ga = genomeFor(a), gb = genomeFor(b);
  return ga && gb ? kinship(ga, gb) : 0;
}

/** The rungs, in order. A pair is always on exactly one of them. */
export const STAGES = ["strangers", "noticed", "interested", "courting", "together", "bonded"];
export const STAGE_LABEL = {
  strangers: "have not really met",
  noticed: "have noticed each other",
  interested: "are interested",
  courting: "are courting",
  together: "are together",
  bonded: "are bonded",
};

/** Spark needed to reach each rung, and the trust the player needs for their own. */
export const RUNG = { noticed: 8, interested: 26, courting: 52, together: 80, bonded: 130 };
/** Below this attraction the climb stops wherever it is. */
export const MIN_ATTRACTION = 0.25;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const r2 = (v) => Math.round(v * 100) / 100;

/* ---- the book ------------------------------------------------------------- */

function book(m) {
  m.romance ??= {};
  return m.romance;
}

/** The pair's state: { stage, spark, since, moments, privateNights, ended }. */
export function pairOf(a, b) {
  if (!a || !b || a.id === b.id) return null;
  const A = book(a);
  A[b.id] ??= { stage: "strangers", spark: 0, since: null, moments: [], privateNights: 0, ended: false };
  return A[b.id];
}

function bothWays(a, b, fn) {
  const p = pairOf(a, b), q = pairOf(b, a);
  if (!p || !q) return null;
  fn(p); fn(q);
  return p;
}

export const stageIndex = (s) => Math.max(0, STAGES.indexOf(s));
export function stageOf(a, b) {
  if (!a || !b) return "strangers";
  if (a.partner === b.id) return pairOf(a, b).stage === "bonded" ? "bonded" : "together";
  return pairOf(a, b)?.stage ?? "strangers";
}

/* ---- attraction ----------------------------------------------------------- */

/**
 * 0..1, and 0 is a wall. Mutual interest is required — it is not a number that
 * can be outweighed by rapport — and so is not being family. Above that floor
 * it is what the two genomes make of each other, what their watches have
 * built, and whether either of them is in any state to want anything.
 */
export function attraction(a, b) {
  if (!a || !b || a.id === b.id) return 0;
  if (a.robot || b.robot) return 0;
  if (!drawnTo(a, b) || !drawnTo(b, a)) return 0;
  if (kinBetween(a, b) >= KIN_BLOCK) return 0;
  const ga = genomeFor(a), gb = genomeFor(b);
  const fit = ga && gb ? (genomeCompat(ga, gb) + 5) / 10 : 0.5;
  const known = clamp01(rapportBetween(a, b) / 90);
  const spare = clamp01(((a.morale ?? 70) + (b.morale ?? 70)) / 200);
  /* courtship display is what makes somebody noticeable rather than merely present */
  const show = ga && gb ? ((ga[GENE.COURTSHIP_DISPLAY] ?? 0.5) + (gb[GENE.COURTSHIP_DISPLAY] ?? 0.5)) / 2 : 0.5;
  return r2(clamp01(fit * 0.42 + known * 0.3 + spare * 0.14 + show * 0.14));
}

/** Everyone aboard this hull who could, in principle, be somebody to them. */
export function prospectsFor(m, roster = crew.aboard) {
  const out = [];
  for (const o of roster) {
    if (o.id === m.id || o.robot) continue;
    const a = attraction(m, o);
    if (a < MIN_ATTRACTION) continue;
    out.push({ m: o, id: o.id, name: o.name, attraction: a, stage: stageOf(m, o), spark: pairOf(m, o).spark });
  }
  return out.sort((x, y) => stageIndex(y.stage) - stageIndex(x.stage) || y.attraction - x.attraction);
}

/** The one they are closest to getting somewhere with, or null. */
export function courtingTarget(m, roster = crew.aboard) {
  if (m.partner) return prospectsFor(m, roster).find((p) => p.id === m.partner) ?? null;
  return prospectsFor(m, roster)[0] ?? null;
}

/* ---- moments -------------------------------------------------------------- */

/**
 * Spark per kind of thing that passed between them. These are the interactions
 * the deck graph can actually reach; everything else moves rapport and leaves
 * the ladder alone.
 */
export const MOMENT = {
  watch: 1.5,        // stood the same post
  talk: 2,
  meal: 3,
  cards: 2.5,
  vent: 4,           // told them something
  notice: 5,
  flirt: 7,
  gift: 9,
  walkout: 12,       // shore leave together at a port
  confide: 10,
  mend: 6,           // made it up after a row
  propose: 18,
  privateNight: 14,
  row: -14,
  jealousy: -9,
  refused: -6,
};

/**
 * Something happened between two people. Returns { stage, advanced, line } —
 * `advanced` is the rung they just reached, if any.
 */
export function moment(a, b, kind, scale = 1) {
  if (!a || !b || a.id === b.id) return null;
  const att = attraction(a, b);
  const d = (MOMENT[kind] ?? 1) * scale * (d0 => d0)(1);
  const gain = d > 0 ? d * (0.5 + att) : d;
  const p = bothWays(a, b, (x) => {
    x.spark = Math.max(-20, Math.min(200, x.spark + gain));
    x.moments.push({ t: Math.round(sim.time ?? 0), kind });
    if (x.moments.length > 20) x.moments.splice(0, x.moments.length - 20);
  });
  if (!p) return null;
  const advanced = reconsider(a, b, att);
  return { stage: p.stage, spark: r2(p.spark), advanced, attraction: att };
}

/** Has this pair earned the next rung — or lost the one they were on? */
function reconsider(a, b, att = attraction(a, b)) {
  const p = pairOf(a, b);
  const here = stageIndex(p.stage);

  /* the climb stops dead without mutual interest, wherever it had got to */
  if (att < MIN_ATTRACTION) {
    if (here > 0 && here < 4) { setStage(a, b, "strangers"); return null; }
    return null;
  }

  /* falling back down: a row can undo a rung, but never a partnership — that
   * takes a break-off, which is its own decision */
  if (here > 0 && here < 4) {
    const below = STAGES[here - 1];
    if (p.spark < (RUNG[STAGES[here]] ?? 0) - 12) { setStage(a, b, below); return null; }
  }

  const next = STAGES[here + 1];
  if (!next) return null;
  const need = RUNG[next];
  if (need == null || p.spark < need) return null;

  /* the last two rungs are decisions, not thresholds — COURT and BOND make them */
  if (next === "together" || next === "bonded") return null;
  setStage(a, b, next);
  return next;
}

export function setStage(a, b, stage) {
  bothWays(a, b, (x) => { x.stage = stage; x.since = Math.round(sim.time ?? 0); });
  const line = LINES[stage]?.(a, b);
  if (line) crewNote(line);
  for (const [x, y] of [[a, b], [b, a]]) {
    const rec = cradle.get(x.id);
    if (rec && (stage === "together" || stage === "bonded")) cradle.note(rec.id, `${stage === "bonded" ? "Bonded with" : "Together with"} ${y.name}`);
  }
  return stage;
}

const LINES = {
  noticed: (a, b) => `${firstName(a)} looks up when ${firstName(b)} comes through, and pretends it was the board.`,
  interested: (a, b) => `${firstName(a)} and ${firstName(b)} keep taking the same break. Nobody believes the excuse.`,
  courting: (a, b) => `${firstName(a)} and ${firstName(b)} are walking out. The mess has decided not to comment. Mostly.`,
  together: (a, b) => `${firstName(a)} and ${firstName(b)} are together. Official, aboard, and not a secret.`,
  bonded: (a, b) => `${firstName(a)} and ${firstName(b)} made it permanent. The whole watch stood for it.`,
};

/* ---- the two decisions ---------------------------------------------------- */

/** Ask. Needs the rung, mutual interest and nerve; returns { ok, why }. */
export function canPropose(a, b) {
  if (!a || !b) return { ok: false, why: "nobody to ask" };
  if (a.partner || b.partner) return { ok: false, why: "one of them is already with somebody" };
  const att = attraction(a, b);
  if (att < MIN_ATTRACTION) return { ok: false, why: "it is not mutual" };
  if (kinBetween(a, b) >= KIN_BLOCK) return { ok: false, why: "they are family" };
  const p = pairOf(a, b);
  if (stageIndex(p.stage) < STAGES.indexOf("courting")) return { ok: false, why: "too soon — they are only " + STAGE_LABEL[p.stage] };
  if (p.spark < RUNG.together) return { ok: false, why: "not there yet" };
  return { ok: true, att };
}

/** They asked and were not refused. */
export function makePartners(a, b) {
  const can = canPropose(a, b);
  if (!can.ok) return can;
  a.partner = b.id; b.partner = a.id;
  setStage(a, b, "together");
  moment(a, b, "propose");
  adjustMorale(a, 9); adjustMorale(b, 9);
  adjustRapport(a, b, 12);
  return { ok: true };
}

/** The permanent rung. Needs time together and a port to do it at. */
export function canBond(a, b, { docked = Boolean(sim.ship?.dockedAt) } = {}) {
  if (!a || !b || a.partner !== b.id) return { ok: false, why: "they are not together" };
  const p = pairOf(a, b);
  if (p.stage === "bonded") return { ok: false, why: "already bonded" };
  if (p.spark < RUNG.bonded) return { ok: false, why: "not yet" };
  if (!docked) return { ok: false, why: "it is done at a port, with witnesses" };
  return { ok: true };
}

export function bond(a, b, opts = {}) {
  const can = canBond(a, b, opts);
  if (!can.ok) return can;
  setStage(a, b, "bonded");
  moment(a, b, "propose");
  adjustMorale(a, 12); adjustMorale(b, 12);
  for (const m of crew.aboard) if (m.id !== a.id && m.id !== b.id) adjustMorale(m, 3);
  return { ok: true };
}

/** It ended. Rapport takes it, and so do they. */
export function breakOff(a, b, why = "") {
  if (!a || !b) return null;
  a.partner = null; b.partner = null;
  bothWays(a, b, (x) => { x.stage = "interested"; x.spark = Math.min(x.spark, RUNG.interested - 4); x.ended = true; });
  adjustMorale(a, -14); adjustMorale(b, -14);
  adjustRapport(a, b, -22);
  crewNote(`${firstName(a)} and ${firstName(b)} have called it off.${why ? ` ${why}` : ""} The mess is quiet.`);
  for (const [x, y] of [[a, b], [b, a]]) { const r = cradle.get(x.id); if (r) { r.partner = null; cradle.note(r.id, `Split up with ${y.name}`); } }
  return true;
}

/* ---- somebody else -------------------------------------------------------- */

/**
 * Who is carrying a torch for a hand who is already with someone. Jealousy is
 * not a flag on a person; it is the shape of a triangle, and the graph reads
 * it to decide whether to do anything about it.
 */
export function triangleFor(m, roster = crew.aboard) {
  if (!m?.partner) return null;
  for (const o of roster) {
    if (o.id === m.id || o.id === m.partner || o.robot) continue;
    const att = attraction(o, m);
    if (att < 0.45) continue;
    const p = pairOf(o, m);
    if (p.spark < RUNG.interested) continue;
    return { other: o, attraction: att, spark: p.spark };
  }
  return null;
}

/** A hand acts on it. Costs everyone something; occasionally it works. */
export function actOnJealousy(m, rival, partner) {
  if (!m || !rival) return null;
  moment(m, rival, "jealousy");
  adjustRapport(m, rival, -10);
  adjustMorale(m, -3);
  if (partner) adjustMorale(partner, -2);
  crewNote(`${firstName(m)} had words with ${firstName(rival)} about ${firstName(partner ?? rival)}.`);
  return true;
}

/* ---- privacy, and what it is for ------------------------------------------
 * The adult switch does not change what anything looks like — nothing here
 * depicts anything. It gates whether a couple get a step that needs a door
 * that shuts, and whether a conception can come from it. With the switch off
 * the crew still pair off, still bond, and still have children through the
 * ordinary household path; they simply do it off-screen the way they always
 * did.
 */

/** Berths with a door: crew quarters and the captain's. The refit matters here. */
export function privacyAboard() {
  const cap = sim.crewCapacity ?? 2;
  const heads = crew.aboard.length + Math.ceil(household.children.length / 2);
  return { berths: cap, used: heads, spare: Math.max(0, cap - heads), private: heads < cap };
}

/** Can this couple have a night to themselves? { ok, why } */
export function canHavePrivacy(a, b) {
  loadSocial();
  if (!social.adult) return { ok: false, why: "switched off in house rules" };
  if (!a || !b || a.partner !== b.id) return { ok: false, why: "they are not together" };
  if (a.robot || b.robot) return { ok: false, why: "one of them is a machine" };
  const p = privacyAboard();
  if (!p.private) return { ok: false, why: `no berth with a door to spare (${p.used}/${p.berths})` };
  if ((a.morale ?? 70) < 35 || (b.morale ?? 70) < 35) return { ok: false, why: "neither of them is in the mood for anything" };
  return { ok: true };
}

/**
 * A night to themselves. Core is fade-to-black: numbers move, a child may
 * start, nothing is depicted. Addons may rewrite the log via onPrivateNight.
 */
export function privateNight(a, b, rng = Math.random) {
  const can = canHavePrivacy(a, b);
  if (!can.ok) return { ok: false, why: can.why };
  bothWays(a, b, (x) => { x.privateNights++; });
  moment(a, b, "privateNight");
  adjustMorale(a, 7); adjustMorale(b, 7);
  adjustRapport(a, b, 6);
  const con = tryConceive(a, b, rng);
  const res = { ok: true, conceived: con.conceived, chance: con.chance, carrier: con.carrier, sire: con.sire };
  runHooks("onPrivateNight", a, b, res);
  return res;
}

/* ---- fertility ------------------------------------------------------------ */

/** 0..1 for one person: the genes for it, and where they are in a life. */
export function fertilityOf(m) {
  if (!m || m.robot || m.synthetic) return 0;
  const g = genomeFor(m);
  if (!g) return 0.3;
  const base = (g[GENE.FERTILITY] ?? 0.5) * 0.6 + (g[GENE.GAMETE_QUALITY] ?? 0.5) * 0.4;
  const rec = cradle.get(m.id);
  const age = (rec?.ageCycles ?? m.ageCycles ?? 320) / 900;
  /* a curve, not a cliff: best through the prime years, tailing either side */
  const window = age < 0.22 ? 0 : age < 0.3 ? (age - 0.22) / 0.08 : age < 0.6 ? 1 : Math.max(0, 1 - (age - 0.6) / 0.28);
  const health = clamp01((m.morale ?? 70) / 100) * 0.4 + 0.6;
  return r2(clamp01(base * window * health));
}

/** The pair's chance per private night, and who would carry. */
export function conceptionOdds(a, b) {
  loadSocial();
  if (!social.family) return { chance: 0, why: "families are switched off" };
  if (social.contraception) return { chance: 0, why: "they are being careful" };
  const roles = carrierAndSire(a, b);
  if (!roles) return { chance: 0, why: "not between these two" };
  const fa = fertilityOf(roles.carrier), fb = fertilityOf(roles.sire);
  if (!fa || !fb) return { chance: 0, why: "one of them cannot", carrier: roles.carrier, sire: roles.sire };
  const already = household.pregnancies.some((p) => p.carrier === roles.carrier.id);
  if (already) return { chance: 0, why: "already expecting", ...roles };
  return { chance: r2(clamp01(Math.sqrt(fa * fb) * 0.45)), ...roles };
}

/** Who carries and who sires. Nonbinary hands roll it from their own seed, once. */
export function carrierAndSire(a, b) {
  const role = (p) => {
    if (!p || p.robot || p.synthetic) return null;
    if (p.gender === "woman") return "carry";
    if (p.gender === "man") return "sire";
    const seed = String(cradle.get(p.id)?.seed ?? p.id);
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return h % 2 ? "carry" : "sire";
  };
  const ra = role(a), rb = role(b);
  if (!ra || !rb || ra === rb) return null;
  return ra === "carry" ? { carrier: a, sire: b } : { carrier: b, sire: a };
}

/**
 * Roll it. On a hit this files the pregnancy on `household` exactly the way
 * the old per-cycle path did, so gestation, birth, heredity and the crèche
 * are all unchanged — only the way it starts is different.
 */
export function tryConceive(a, b, rng = Math.random) {
  const odds = conceptionOdds(a, b);
  if (!odds.chance) return { conceived: false, chance: 0, why: odds.why };
  if (rng() >= odds.chance) return { conceived: false, chance: odds.chance, ...odds };
  const twins = twinRoll(odds.carrier, odds.sire, rng);
  household.pregnancies.push({
    carrier: odds.carrier.id, sire: odds.sire.id, sireName: odds.sire.name, sireRace: odds.sire.raceId,
    cycles: 0, due: 6, twins,
  });
  crewNote(`${odds.carrier.name} is expecting${twins ? " — twins, by the scan" : ""}. ${odds.sire.name}'s.`);
  const rec = cradle.get(odds.carrier.id);
  if (rec) cradle.note(rec.id, `Expecting, with ${odds.sire.name}`);
  return { conceived: true, chance: odds.chance, twins, ...odds };
}

function twinRoll(carrier, sire, rng) {
  const g = genomeFor(carrier), h = genomeFor(sire);
  const litter = ((g?.[GENE.LITTER_SIZE] ?? 0.3) + (h?.[GENE.LITTER_SIZE] ?? 0.3)) / 2;
  return rng() < Math.max(0, (litter - 0.55)) * 0.4;
}

/* ---- reading it back ------------------------------------------------------ */

/** [{ a, b, stage, spark, attraction, kin }] — every pair with anything between them. */
export function ladderReport(roster = crew.aboard) {
  const out = [];
  for (let i = 0; i < roster.length; i++) {
    for (let j = i + 1; j < roster.length; j++) {
      const a = roster[i], b = roster[j];
      const p = pairOf(a, b);
      const att = attraction(a, b);
      /* A pair with real spark and no draw between them belongs on this list
       * too — two people who spend every watch together and were never going
       * to be anything else is the commonest thing on a ship, and a panel that
       * hides it reads as a panel that is not working. */
      if (!p || (p.stage === "strangers" && att < MIN_ATTRACTION && p.spark < 20)) continue;
      out.push({ a, b, stage: stageOf(a, b), spark: r2(p.spark), attraction: att, tie: tieBetween(a, b), nights: p.privateNights, platonic: att < MIN_ATTRACTION });
    }
  }
  const order = (s) => -stageIndex(s);
  return out.sort((x, y) => order(x.stage) - order(y.stage) || y.spark - x.spark);
}

/** One line about where a pair stand. */
export function ladderLine(a, b) {
  const stage = stageOf(a, b);
  const p = pairOf(a, b);
  if (!p) return "";
  const att = attraction(a, b);
  if (att < MIN_ATTRACTION) {
    if (kinBetween(a, b) >= KIN_BLOCK) return `${firstName(a)} and ${firstName(b)} are family`;
    if (p.spark >= 20) return `${firstName(a)} and ${firstName(b)} are close, and it was never going to be anything else · ${Math.round(p.spark)}`;
    return "nothing there";
  }
  return `${firstName(a)} and ${firstName(b)} ${STAGE_LABEL[stage]} · spark ${Math.round(p.spark)} · draw ${Math.round(att * 100)}%`;
}

/** Clear every ladder — a new sky is new people. */
export function resetRomance() {
  for (const m of crew.aboard) delete m.romance;
  _g.clear();
}
