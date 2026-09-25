/* Living Galaxy — DECKMIND: the loop that runs a hand's own life.
 *
 * Once a pay cycle, every person aboard observes the hull, weighs what they
 * need against what they are for, walks the deck graph to a decision, and
 * lives with the result. Nothing here is narrated after the fact: the record
 * is written FROM the decision — the trace the graph left, the deltas that
 * were actually applied, the diff of the hull before and after — so the
 * journal cannot drift from what happened.
 *
 * What the crew system already had stays exactly where it was. duties.js
 * still moves wear every two seconds, crew.js still steps rapport and pays
 * wages, bonds.js still rolls rivalries. Deckmind sits on the same cycle hook
 * and adds the part that was missing: a person choosing, for reasons, and
 * that choice mattering to the hull and to the people in the room.
 *
 */

import { decide, explainTrace } from "../genome/behavior-graph.js";
import { deckGraph, ACTION_META } from "./deckgraph.js";
import { SPACER, SYNTH, createSpacer, packGenome, unpackGenome, fingerprint, capabilities, phenotype, createContext, genomeTraits, skillAptitude, expectedLifespan } from "../genome/spacer.js";
import { crew, crewHooks, rapportBetween } from "../crew.js";
import { cradle, drawnTo } from "../npc/cradle.js";
import { adjustMorale, trustOf, social, loadSocial, household } from "../family.js";
import { tieBetween } from "./bonds.js";
import { sim } from "../sim.js";
import { captain } from "../npc/captain.js";
import { playerHull } from "./hull.js";
import { fileRecord, diffOf, r3, writeSummary } from "./journal.js";
import { learnFromRecord, forgetBrain } from "./learn.js";
import {
  courtingTarget, stageOf, pairOf, attraction, canPropose, canBond,
  canHavePrivacy, triangleFor, forgetRomanceGenome, resetRomance, moment,
} from "./romance.js";
import { ACTIONS, NEED_KEYS, applyAction } from "./deckacts.js";

export const deckmind = {
  enabled: true,
  cycle: 0,
  lastRun: 0,
  lastRecords: [],
};

/* ---- genomes ------------------------------------------------------------- */

/* ledger id → { genome, typeId, caps, apt }. A decoded body is about a
 * kilobyte; with a crew on every hull in the sky that is worth a ceiling.
 * Insertion order is eviction order — the crews that were stepped most
 * recently are the ones at the end of the map. */
const cache = new Map();
const BODY_CACHE_MAX = 320;

/** Everything about a person's body, built once and kept. */
export function bodyOf(who) {
  const id = who?.id;
  if (!id) return null;
  const hit = cache.get(id);
  if (hit) return hit;
  const rec = cradle.get(id);
  const typeId = who.robot || rec?.genomeType === SYNTH ? SYNTH : SPACER;
  let genome = null;
  if (rec?.genome) {
    try { genome = unpackGenome(rec.genome).genome; } catch { genome = null; }
  }
  if (!genome) {
    genome = createSpacer(rec?.seed ?? who.seed ?? id, who.raceId ?? rec?.raceId ?? "terran", typeId);
    if (rec) {
      rec.genome = packGenome(genome, typeId);
      rec.genomeType = typeId;
      rec.fingerprint = fingerprint(genome, typeId);
      cradle.put(rec);
    }
  }
  const body = { genome, typeId, caps: capabilities(genome, typeId), apt: skillAptitude(genome), traits: genomeTraits(genome) };
  if (cache.size >= BODY_CACHE_MAX) {
    let drop = Math.ceil(BODY_CACHE_MAX / 4);
    for (const k of cache.keys()) { if (drop-- <= 0) break; cache.delete(k); }
  }
  cache.set(id, body);
  return body;
}

/** Forget a cached body — call after a genome is replaced (breeding, import). */
export function forgetBody(id) { cache.delete(id); forgetBrain(id); forgetRomanceGenome(id); }
export function clearBodies() { cache.clear(); forgetBrain(); forgetRomanceGenome(); }

/* ---- needs ---------------------------------------------------------------
 * Nine numbers, 0..1, high = pressing. They rise on their own and come down
 * when something is done about them. They live on the member so the roster
 * and the talk trees can read them without going through here.
 */
const RISE = {
  fatigue: 0.16, hunger: 0.2, social: 0.13, stress: 0.07,
  intimacy: 0.09, play: 0.1, grievance: 0, purpose: 0.08, upkeep: 0,
};

export function needsOf(m) {
  if (!m.need) {
    m.need = {};
    for (const k of NEED_KEYS) m.need[k] = 0.25;
  }
  return m.need;
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/* 0.3.53: a captain who sat down and HEARD a grievance buys this many watches
 * of it counting for less — the cause is still there, and it comes back. */
export const HEARD = { cycles: 5, relief: 0.35 };

/** The two needs that are read off the world, not drifted: grievance and upkeep. */
export function computedNeeds(m, st) {
  /* a grievance is not a mood — it is owed wages, a rival on the same watch,
   * or a hull nobody is maintaining. It is computed, not drifted. */
  let grief = 0;
  if (st?.shortfall) grief += 0.6;   /* unpaid wages are a grievance on their own */
  if ((m.morale ?? 70) < 35) grief += 0.2;
  if ((st?.wear ?? 0) > 0.6) grief += 0.15;
  if ((m.ties ?? []).some((t) => t.kind === "rival")) grief += 0.2;
  if (m.heardAt != null && deckmind.cycle - m.heardAt < HEARD.cycles) grief = Math.max(0, grief - HEARD.relief);
  return { grievance: clamp01(grief), upkeep: clamp01(st?.wear ?? 0) };
}

/** Needs drift up before the decision; genes set how fast for each person. */
function driftNeeds(m, body, st) {
  const n = needsOf(m);
  const g = body.genome;
  const rate = {
    fatigue: RISE.fatigue * (1.35 - (g[138] ?? 0.5) * 0.7),        // FATIGUE_RESIST
    hunger: RISE.hunger * (0.7 + (g[15] ?? 0.5) * 0.6),            // METAB_A
    social: RISE.social * (0.5 + (g[20] ?? 0.5) * 1.1),            // SOCIAL
    stress: RISE.stress * (0.6 + (g[66] ?? 0.5) * 0.9),            // CORTISOL
    intimacy: RISE.intimacy * (0.4 + (g[70] ?? 0.5) * 1.2),        // OXYTOCIN
    play: RISE.play * (0.5 + (g[174] ?? 0.5) * 1.1),               // PLAY_DRIVE
    purpose: RISE.purpose * (0.5 + (g[19] ?? 0.5) * 1.1) * (m.trainFocus ? 0.7 : 1),   // CURIOSITY; a goal slows it (0.3.53)
  };
  /* Saturating rise. A need that nothing is being done about climbs toward 1
   * and never quite reaches it, which keeps a gradient for the graph to weigh
   * — a pinned need is a need that can no longer lose an argument. */
  for (const k of NEED_KEYS) {
    const r = rate[k] ?? 0;
    if (r) n[k] = clamp01((n[k] ?? 0.25) + r * (1 - (n[k] ?? 0.25)));
  }
  Object.assign(n, computedNeeds(m, st));
  if (m.robot) { n.hunger = 0; n.intimacy = 0; n.fatigue = clamp01(1 - (m.condition ?? 100) / 100); }
  /* A need nobody can meet is not free. Someone with no one to be close to,
   * or nothing worth doing, comes off the watch a little worse each cycle —
   * this is what makes a full berth list and a dull run show up in morale
   * before it shows up in a walkout. */
  let starved = 0;
  for (const k of ["intimacy", "social", "purpose", "play"]) if (n[k] > 0.85) starved++;
  if (starved && !m.robot) adjustMorale(m, -0.5 * starved);
  return n;
}

/* ---- the decision context ------------------------------------------------ */

/**
 * The context the graph reads. One object, built fresh, never mutated by a
 * node. `hull` is whatever the watch is being stood on — the player's ship by
 * default, or an NPC vessel's (js/crew/hull.js), which is what lets the same
 * 63 nodes run for every crew in the sky.
 */
export function buildContext(m, opts = {}) {
  const hull = opts.hull ?? playerHull();
  const time = opts.time ?? sim.time ?? 0;
  const ship = opts.ship ?? hull.state();
  const body = bodyOf(m);
  /* 0.3.53: `peek` reads a hand without living a watch. Building a context
   * used to drift every need a step, and the GENOME sheet built one on every
   * repaint — keyed on tiredness, so an open sheet tired a seasoned hand out
   * in a handful of frames. A peek only refreshes the two computed needs. */
  const needs = opts.peek ? Object.assign(needsOf(m), m.robot ? {} : computedNeeds(m, ship)) : driftNeeds(m, body, ship);
  const phase = hull.phaseOf(m, time);
  const post = hull.postOf(m);
  const kind = post?.kind ?? null;
  const rec = cradle.get(m.id);
  const roster = hull.roster;

  /* age and wear feed the contextual expression: the same genome reads
   * differently at fifty, tired, on the wrong end of the rota. */
  const gctx = createContext({
    ageTicks: (rec?.ageCycles ?? m.ageCycles ?? 320) + (rec?.cyclesServed ?? 0) + (m.cyclesAboard ?? 0),
    lifespanTicks: expectedLifespan(body.genome, 900),
    injury: clamp01(1 - (m.robot ? (m.condition ?? 100) : 100) / 100),
    fatigue: needs.fatigue,
    malnutrition: needs.hunger * 0.6,
    biome: ship.docked ? "urban" : "void",
    temp: clamp01(ship.heat) * 0.8 - 0.1,
    timeOfDay: ((time % 270) / 270) % 1,
    ambientMana: 0,
    stressLoad: needs.stress,
  });
  const pheno = phenotype(body.genome, body.typeId, gctx);

  /* who else is in earshot: on the same post this watch, or in the mess */
  const others = [];
  for (const o of roster) {
    if (o.id === m.id) continue;
    const oPhase = hull.phaseOf(o, time);
    const oPost = hull.postOf(o);
    const together = oPhase === phase && (phase !== 0 || oPost?.id === post?.id);
    if (!together) continue;
    others.push({
      id: o.id, name: o.name, m: o,
      tie: tieBetween(m, o), rapport: rapportBetween(m, o),
      samePost: oPost?.id === post?.id,
      junior: (o.cyclesAboard ?? 0) < 3,
      drawn: !m.robot && !o.robot && drawnTo(m, o) && drawnTo(o, m),
    });
  }

  const isPlayerHull = hull.kind === "player";
  if (isPlayerHull) loadSocial();
  const romanceAllowed = hull.romance && !m.robot;
  const partnerAboard = Boolean(m.partner && others.some((o) => o.id === m.partner));

  /* Where this hand stands with whoever is actually in the room. The ladder
   * lives in crew/romance.js; this is the rung the graph reads. Only people
   * who are present count — you cannot walk out at a port with somebody who
   * is asleep two decks up. */
  const present = others.map((o) => o.m);
  const prospect = romanceAllowed ? courtingTarget(m, present) : null;
  const target = prospect?.m ?? null;
  const romance = target
    ? {
      target,
      targetName: target.name,
      stage: stageOf(m, target),
      spark: pairOf(m, target)?.spark ?? 0,
      attraction: attraction(m, target),
      canPropose: canPropose(m, target).ok,
      canBond: canBond(m, target, { docked: ship.docked }).ok,
      canPrivate: isPlayerHull ? canHavePrivacy(m, target).ok : false,
      triangle: triangleFor(m, present),
    }
    : { target: null, targetName: null, stage: "strangers", spark: 0, attraction: 0, canPropose: false, canBond: false, canPrivate: false, triangle: romanceAllowed ? triangleFor(m, present) : null };

  const shortHanded = roster.some((o) => o.id !== m.id && !o.robot
    && hull.phaseOf(o, time) === 0 && (o.morale ?? 70) < 40);

  const ctx = {
    m, rec, body, needs, phase, hull,
    postKind: kind, postName: post?.name ?? null, room: post,
    caps: body.caps,
    traits: body.traits,
    pheno,
    vitals: {
      health: m.robot ? (m.condition ?? 100) : (m.morale ?? 70),
      energy: r3(1 - needs.fatigue),
      integrity: r3(ship.hull / 100),
    },
    ship,
    others,
    romanceAllowed,
    partnerAboard,
    romance,
    drawnToSomeone: Boolean(target) && !m.partner,
    drawnToKin: false,
    hasKin: Boolean(rec?.parents?.length || (isPlayerHull && household.children.some((c) => c.parents?.includes(m.id)))),
    juniorAboard: others.some((o) => o.junior),
    shortHanded,
    fitForPost: m.robot ? (m.condition ?? 100) >= 30 && !m.idle : (m.morale ?? 70) >= 40 && needs.fatigue < 0.9,
    /* only the player's crew can bring something to the player — and only
     * while the player still has the conn (captain.holder is "player" by
     * default, and a crew id once command has been handed over) */
    captainIsPlayer: isPlayerHull && (!captain.holder || captain.holder === "player"),
  };

  /* who is on this person's mind, and what the graph should do about it */
  const pull = socialPull(ctx);
  ctx.socialPull = pull.kind;
  ctx.focus = pull.who;
  ctx.focusName = pull.who?.name ?? null;
  return ctx;
}

function socialPull(ctx) {
  const { m, others, needs } = ctx;
  /* A grievance goes to whoever can do anything about it. On the player's
   * hull that is the captain, and CONFRONT is what raises the flag the TALK
   * tree reads; on an NPC hull it is said to whoever is in the room. */
  if (needs.grievance > 0.55) {
    return ctx.captainIsPlayer || !others.length ? { kind: "grievance", who: null } : { kind: "grievance", who: others[0] };
  }
  const partner = others.find((o) => o.id === m.partner);
  if (partner && needs.intimacy > 0.35) return { kind: "partner", who: partner };
  const rival = others.find((o) => o.tie === "rival");
  if (rival && (needs.stress > 0.4 || ctx.traits.grit > 0.6)) return { kind: "rival", who: rival };
  const friend = others.find((o) => o.tie === "friend" || o.tie === "couple");
  if (friend) return { kind: "friend", who: friend };
  if (others.length) return { kind: "stranger", who: others[0] };
  return { kind: "idle", who: null };
}

/* ---- one decision -------------------------------------------------------- */

function seededRng(seedStr) {
  let n = 0;
  for (let i = 0; i < seedStr.length; i++) n = Math.imul(n ^ seedStr.charCodeAt(i), 2654435761) >>> 0;
  let s = n || 7;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PHASE_ROOM = ["the deck", "the mess", "their quarters"];

/**
 * Observe, decide, live with it. Returns the journal record, already filed.
 * `stepHand` is deterministic for a given (hand, cycle, hull state).
 */
export function stepHand(m, opts = {}) {
  const ctx = opts.ctx ?? buildContext(m, opts);
  const hull = ctx.hull;
  const rng = opts.rng ?? seededRng(`${m.id}:${deckmind.cycle}:${sim.skySeed ?? ""}`);

  /* ── observe ── */
  const before = {
    needs: { ...ctx.needs },
    vitals: { ...ctx.vitals },
    holdings: holdingsOf(m, ctx),
    ship: { hull: ctx.ship.hull, wear: ctx.ship.wear },
  };

  /* ── decide ── */
  let out;
  try {
    /* 0.3.53: an order from the captain (js/crew/orders.js) is the decision —
     * the graph is not asked, but everything after this is the same watch */
    out = opts.order
      ? { action: opts.order.action, node: "order", trace: [{ node: "root", reason: opts.order.why ?? "the captain's orders" }], path: ["root", "order"], depth: 1 }
      : decide(deckGraph, ctx, { rng });
  } catch (e) {
    out = { action: "STAND_WATCH", node: "act.standWatch", trace: [{ node: "root", reason: `the decision could not be completed (${e.code ?? "error"}), so I fell back to my post` }], path: ["root", "act.standWatch"], depth: 1 };
  }
  const spec = ACTIONS[out.action] ?? ACTIONS.STAND_WATCH;
  const meta = ACTION_META[out.action] ?? { label: out.action.toLowerCase(), kind: "idle" };
  const efficacy = clamp01((spec.eff?.(ctx) ?? 0.5) * (0.55 + ctx.vitals.energy * 0.45));

  /* ── apply ── */
  const applied = applyAction(ctx, out.action, spec, efficacy, rng, deckmind.cycle);

  /* ── record ── */
  const nowState = hull.state();
  const after = {
    needs: { ...ctx.needs },
    vitals: {
      health: m.robot ? (m.condition ?? 100) : (m.morale ?? 70),
      energy: r3(1 - ctx.needs.fatigue),
      integrity: r3(nowState.hull / 100),
    },
    holdings: holdingsOf(m, ctx),
    ship: { hull: nowState.hull, wear: nowState.wear },
  };

  const stressor = ctx.pheno.modifiers ? dominantLimit(ctx.pheno) : null;
  const drive = dominantDrive(ctx.needs);
  const shipDiff = diffOf(before.ship, after.ship, 0.001);

  const rec = {
    v: 1,
    cycle: deckmind.cycle,
    at: Date.now(),
    simTime: r3(sim.time ?? 0),
    sky: sim.skySeed ?? "",
    hull: { id: hull.id, kind: hull.kind, callsign: hull.name, employer: hull.employer },
    agent: { id: m.id, name: m.name, species: m.raceId ?? "terran", stage: ctx.pheno.stage, genome: ctx.rec?.fingerprint ?? fingerprint(ctx.body.genome, ctx.body.typeId) },

    observedSurroundings: {
      /* on watch they are at their post; off it they are where the rota puts them */
      room: ctx.phase === 0 ? (ctx.postName ?? PHASE_ROOM[0]) : PHASE_ROOM[ctx.phase],
      roomKind: ctx.postKind ?? null,
      docked: ctx.ship.docked,
      port: ctx.ship.port,
      underway: ctx.ship.underway,
      alarm: ctx.ship.alarm,
      hullState: { hull: ctx.ship.hull, wear: ctx.ship.wear, heat: ctx.ship.heat },
      present: ctx.others.map((o) => o.name),
      crewCount: hull.roster.length,
      perceptionClarity: r3(clamp01(ctx.pheno.perception * 0.6 + ctx.pheno.alertness * 0.4)),
    },

    observedSelf: {
      vitals: { health: r3(before.vitals.health), energy: before.vitals.energy, integrity: before.vitals.integrity },
      needs: Object.fromEntries(NEED_KEYS.map((k) => [k, r3(before.needs[k])])),
      phenotype: {
        strength: r3(ctx.pheno.strength), endurance: r3(ctx.pheno.endurance), agility: r3(ctx.pheno.agility),
        intellect: r3(ctx.pheno.intellect), perception: r3(ctx.pheno.perception),
        sociability: r3(ctx.pheno.sociability), dominanceRank: r3(ctx.pheno.dominanceRank),
        temperament: r3(ctx.pheno.temperament),
      },
      tier: ctx.caps.tier,
      holdings: before.holdings,
      stage: ctx.pheno.stage,
      age: r3(ctx.pheno.ageNormalised),
      alertness: r3(ctx.pheno.alertness),
      comfort: r3(ctx.pheno.comfort),
      limitingFactor: stressor?.label ?? null,
      dominantDrive: drive.key,
      driveStrength: r3(drive.v),
      phase: ["on watch", "mess", "quarters"][ctx.phase] ?? "on watch",
      threat: { level: r3(ctx.ship.alarm ? 0.8 : clamp01((100 - ctx.ship.hull) / 140)), kind: ctx.ship.alarm ?? null },
    },

    action: {
      id: out.action,
      label: meta.label,
      kind: meta.kind,
      node: out.node,
      efficacy: r3(efficacy),
      blocked: applied.blocked,
      blockedReason: applied.blockedReason,
      target: ctx.focus?.id ?? null,
      targetName: applied.targetName ?? null,
    },

    whatMadeMeActThis: {
      path: out.path,
      reasoning: explainTrace(out.trace),
      decisionDepth: out.depth ?? out.path.length - 1,
      crossLinksUsed: out.trace.filter((t) => t.type === "link" || t.outcome === "revisit-break").map((t) => t.node),
      alternativesConsidered: out.trace
        .filter((t) => t.considered)
        .flatMap((t) => t.considered.map((o) => ({ option: o.to, probability: o.p, rationale: o.why ?? null }))),
    },

    effectOnSelf: mergeDiffs(diffOf(before.needs, after.needs), diffOf(before.vitals, after.vitals)),
    effectOnHoldings: diffOf(before.holdings, after.holdings, 0.5),
    affectedOthers: applied.others.length > 0,
    effectOnOthers: applied.others.length ? applied.others : null,
    affectedShip: Boolean(shipDiff || applied.mark),
    effectOnShip: shipDiff || applied.mark
      ? { changes: shipDiff ?? {}, interpretation: applied.mark ? [applied.mark] : ["no change worth reading off the board"] }
      : null,
  };
  rec.summary = writeSummary(rec);

  if (applied.note) hull.note(applied.note);
  fileRecord(rec);
  /* the record is the training pair: what was observed, what was done, and
   * the deltas that were actually applied. Learn from it while it is warm. */
  rec.reward = learnFromRecord(ctx, rec);
  return rec;
}

function mergeDiffs(a, b) {
  if (!a && !b) return null;
  return { ...(a ?? {}), ...(b ?? {}) };
}

function holdingsOf(m, ctx) {
  const skills = m.skills ?? {};
  let know = 0;
  for (const v of Object.values(skills)) know += v;
  return {
    wageOwed: Math.round((m.wage ?? 0) * (ctx?.ship?.shortfall ? 1 : 0)),
    knowHow: Math.round(know),
    watchesStood: m.cyclesAboard ?? 0,
    standing: Math.round(ctx ? trustOf(m) : 40),
  };
}

function dominantDrive(needs) {
  let key = "purpose", v = -1;
  for (const k of NEED_KEYS) if ((needs[k] ?? 0) > v) { v = needs[k]; key = k; }
  return { key, v };
}

function dominantLimit(pheno) {
  const mo = pheno.modifiers ?? {};
  const list = [
    { key: "fatigue", severity: mo.fatiguePenalty ?? 0, label: "running on empty" },
    { key: "hunger", severity: mo.hungerPenalty ?? 0, label: "under-fed" },
    { key: "injury", severity: mo.injuryPenalty ?? 0, label: "carrying damage" },
    { key: "stress", severity: mo.stressPenalty ?? 0, label: "wound too tight" },
    { key: "clock", severity: 1 - (mo.alertness ?? 1), label: "on the wrong end of the rota" },
    { key: "thermal", severity: 1 - (mo.thermalComfort ?? 1), label: "too hot to think straight" },
  ];
  list.sort((a, b) => b.severity - a.severity);
  return list[0].severity > 0.25 ? list[0] : null;
}

/* ---- the cycle ----------------------------------------------------------- */

/** Every hand takes their turn. Hooked onto crewHooks.cycle. */
export function runDeckCycle() {
  if (!deckmind.enabled || !crew.aboard.length) return [];
  deckmind.cycle++;
  deckmind.lastRun = sim.time ?? 0;
  const out = stepWatch(crew.aboard, playerHull());
  deckmind.lastRecords = out;
  return out;
}

/**
 * One watch on one hull. Shared by the player's pay cycle and the NPC crew
 * budget (js/npc/npccrew.js), so a hand on a hauler two systems out decides
 * exactly the way a hand in your engine room does.
 */
export function stepWatch(roster, hull, opts = {}) {
  if (!roster?.length) return [];
  const ship = hull.state();
  const out = [];
  for (const m of [...roster]) {
    try { out.push(stepHand(m, { ...opts, hull, ship })); }
    catch (e) { globalThis.console?.warn?.("deckmind", m.name, e); }
  }
  /* Keeping the same hours is the commonest way two people end up anywhere
   * near each other, and a hull is small. Two hands on the same watch see
   * each other all shift; two on the same watch at different posts still pass
   * in the passage. Once per cycle per pair, not once per hand, so it counts
   * the watch and not the paperwork. */
  const time = opts.time ?? sim.time ?? 0;
  for (let i = 0; i < roster.length; i++) {
    const a = roster[i];
    if (a.robot) continue;
    const pa = hull.phaseOf(a, time), ra = hull.postOf(a);
    for (let j = i + 1; j < roster.length; j++) {
      const b = roster[j];
      if (b.robot || hull.phaseOf(b, time) !== pa) continue;
      const together = pa !== 0 || hull.postOf(b)?.id === ra?.id;
      try { moment(a, b, "watch", together ? 1 : 0.45); } catch { /* a pair that cannot be read is not a pair */ }
    }
  }
  return out;
}

/** What the whole deck did this cycle, as counts by action kind. */
export function deckReport(records = deckmind.lastRecords) {
  const kinds = new Map();
  for (const r of records) kinds.set(r.action.kind, (kinds.get(r.action.kind) ?? 0) + 1);
  return [...kinds.entries()].map(([kind, n]) => ({ kind, n })).sort((a, b) => b.n - a.n);
}

const reset = () => { deckmind.cycle = 0; deckmind.lastRecords = []; cache.clear(); forgetBrain(); forgetRomanceGenome(); resetRomance(); };

if (!crewHooks.cycle.includes(runDeckCycle)) crewHooks.cycle.push(runDeckCycle);
if (!crewHooks.reset.includes(reset)) crewHooks.reset.push(reset);

export { ACTIONS, NEED_KEYS, applyAction } from "./deckacts.js";
