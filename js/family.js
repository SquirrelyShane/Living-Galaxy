/* LIVING GALAXY — the people aboard: talk, ties, families, and where they go.
 *
 * crew.js keeps the ledger (wages, morale, who is with whom). This is the
 * layer above it:
 *
 *   talk      — a dialogue tree per hand, with outcomes: praise, a bonus, a
 *               dressing-down, a question about themselves, their partner,
 *               their kids. Every choice moves trust (theirs, toward you) and
 *               morale, and the lines are theirs — pronouns, temperament,
 *               what they are drawn to.
 *   settings  — YOUR identity (gender, pronouns, who you are drawn to) and the
 *               two switches: romance (off / crew only / including you) and
 *               family (whether anyone conceives aboard). Gender-specific by
 *               design: a hand who is not drawn to your gender declines,
 *               kindly; a pair who cannot conceive together do not.
 *   family    — partners aboard (or a hand and you) may conceive: a pregnancy
 *               runs six cycles, a child is a CRADLE record with both parents'
 *               race, blended traits and a berth. Children grow by the cycle
 *               and, in time, walk into a hiring hall as adults.
 *   room      — a berth holds one hand or two children. When the household
 *               outgrows the hull you SETTLE a family at a port: on the
 *               company's books as staff (they earn the company a wage share
 *               every cycle) or paid off and recorded (company.js keeps the
 *               address, the hall will show them again).
 */

import { crew, crewHooks, rapportBetween } from "./crew.js";
import { cradle, drawnTo, generateNPC, genomeOf, looksLine, GENDERS, PRONOUNS, TRAIT_AXES } from "./npc/cradle.js";
import { childFamily, nameRng } from "./names.js";
import { breed, packGenome, fingerprint, genomeTraits, genomeIdentity, genomePulse, genomeTells, skillAptitude, SPACER, kinship } from "./genome/spacer.js";
import { heritageFor, applyHeritage, heritageLine, startingLetter } from "./crew/heritage.js";
import { COMPLEXES } from "./careers/complexes.js";
import { comeOfAge } from "./crew/children.js";
import { carryPregnancyAshore } from "./stationlife.js";
import { line as voiceLine, wrap as voiceWrap } from "./crew/voice.js";
import { company, hasCompany, settleAsStaff, payOffAndRecord } from "./company.js";
import { logEvent, sim } from "./sim.js";
import { pilot } from "./pilot.js";
import { RACES } from "./races.js";
import { stationById } from "./stations.js";

/* ---- settings ------------------------------------------------------------- */

export const social = {
  gender: "man",
  attractedTo: ["woman"],
  romance: "all",        // off | crew | all — crew: hands pair off with each other only; all: you too
  family: true,          // conceptions aboard
  /* The adult switch adds one rung to the ladder — a couple with a berth to
   * themselves get a night off-screen, and a conception can come from it
   * rather than from a per-cycle die roll. It changes what is SIMULATED, not
   * what is shown: nothing in the game depicts anything. Off by default, and
   * with it off the crew still pair off, still bond and still have children
   * the way they always did. */
  adult: false,
  contraception: true,   // a couple who are not trying
  name: "",              // what the crew call you
};
const SAVE_KEY = "lgaa-social";
let loaded = false;
export function loadSocial() {
  if (loaded) return;
  loaded = true;
  try { const raw = globalThis.localStorage?.getItem(SAVE_KEY); if (raw) Object.assign(social, JSON.parse(raw)); } catch { /* none */ }
}
function saveSocial() {
  try { globalThis.localStorage?.setItem(SAVE_KEY, JSON.stringify(social)); } catch { /* none */ }
}
export function setSocial(patch) {
  loadSocial();
  Object.assign(social, patch);
  if (!GENDERS.includes(social.gender)) social.gender = "nonbinary";
  social.attractedTo = (social.attractedTo ?? []).filter((g) => GENDERS.includes(g));
  social.adult = Boolean(social.adult);
  social.contraception = Boolean(social.contraception);
  if (social.romance === "off") social.adult = false;   /* no ladder, no rung */
  saveSocial();
  return social;
}
export const playerPronouns = () => PRONOUNS[social.gender] ?? PRONOUNS.nonbinary;
/** You, as the ledger sees you: enough for drawnTo() and a child's parentage. */
export function playerAsPerson() {
  loadSocial();
  return { id: "player", name: social.name || pilot.name || "the captain", gender: social.gender, pronouns: playerPronouns(), attractedTo: social.attractedTo, raceId: pilot.raceId ?? "terran", traits: { grit: 0.6, caution: 0.5, greed: 0.4, loyalty: 0.6, curiosity: 0.6 }, morale: 70 };
}

/* ---- household ------------------------------------------------------------ */

/** Children aboard: CRADLE records with status "child", living on the ship. */
export const household = {
  children: [],          // { id, name, age (cycles), parents: [ids], raceId, gender }
  pregnancies: [],       // { carrier, sire, cycles, due }
  bonds: {},             // "bond:<child id>" → 0..100, what the captain has put in
  log: [],
};
const PREGNANCY_CYCLES = 6;
const ADULT_CYCLES = 24;
const CONCEIVE_CHANCE = 0.05;   // per partnered pair per cycle when family is on and both are settled in

export function note(msg) {
  household.log.unshift({ t: Date.now(), msg });
  household.log.length = Math.min(household.log.length, 30);
  crew.log.unshift({ t: Date.now(), msg });
  crew.log.length = Math.min(crew.log.length, 30);
}

/** Berths: a hand is one, two children share one. */
export function berthsUsed() {
  return crew.aboard.length + Math.ceil(household.children.length / 2);
}
export function overBerths(capacity) {
  return berthsUsed() > capacity;
}

export function personById(id) {
  if (id === "player") return playerAsPerson();
  return crew.aboard.find((m) => m.id === id) ?? null;
}

/** Whether these two could conceive: one carries, one sires. Nonbinary hands roll it from their seed. */
export function canConceive(a, b) {
  if (!a || !b || a.id === b.id) return false;
  const role = (p) => {
    if (p.synthetic) return null;
    if (p.gender === "woman") return "carry";
    if (p.gender === "man") return "sire";
    const rec = cradle.get(p.id);
    const seed = String(rec?.seed ?? p.id ?? "x");
    let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return h % 2 ? "carry" : "sire";
  };
  const ra = role(a), rb = role(b);
  return Boolean(ra && rb && ra !== rb);
}

function partnerOf(m) {
  return m.partner ? personById(m.partner) : null;
}

/**
 * A child of two people — real heredity, not an average.
 *
 * The genome engine's crossover copies in blocks, lets a dominant allele win
 * where the parents' DOMINANCE_MOD says it should, and mutates on a gaussian
 * scaled by the parents' own mutation genes. So a child is recognisably
 * theirs, occasionally carries something neither of them shows, and has their
 * grandmother's eyes about as often as a person does. The five trait axes,
 * the pulse, the identity and the visible tells are all read off the result
 * rather than blended by hand — which means a child's caution is inherited
 * because the genes for it were, not because the number was averaged.
 *
 * The player has no genome (there is no gene for being the captain), so where
 * one parent is the player the child is crossed with a body grown from the
 * pilot's own race and callsign — stable, and theirs.
 */
function genomeForParent(p) {
  if (!p) return null;
  const rec = cradle.get(p.id);
  if (rec) return genomeOf(rec);
  /* the player, or somebody who left no record: a body from who they are */
  const stand = generateNPC(`parent:${p.id}:${p.raceId ?? "terran"}`, { raceId: p.raceId ?? "terran" });
  return genomeOf(stand);
}

export function conceive(carrier, sire) {
  const seed = `${carrier.id}:${sire.id}:${sim.time.toFixed(0)}:${household.children.length}`;
  const raceId = (seed.length % 2 ? carrier : sire).raceId ?? carrier.raceId;
  const gA = genomeForParent(carrier), gB = genomeForParent(sire);
  const genome = gA && gB ? breed(gA, gB, seed, SPACER) : null;
  const child = generateNPC(`child:${seed}`, { raceId, letter: "F", genome: genome ?? undefined, parents: [carrier.id, sire.id], newborn: true });
  child.parents = [carrier.id, sire.id];
  child.status = "child";
  child.age = 0;
  child.title = "Child";
  child.complexName = "—";
  child.letter = "—";
  if (genome) {
    child.genome = packGenome(genome, SPACER);
    child.genomeType = SPACER;
    child.fingerprint = fingerprint(genome, SPACER);
    child.traits = genomeTraits(genome);
    child.aptitude = skillAptitude(genome);
    child.tells = genomeTells(genome);
    child.pulse = genomePulse(genome);
    const ident = genomeIdentity(genome);
    child.gender = ident.gender;
    child.pronouns = PRONOUNS[ident.gender];
    child.attractedTo = ident.attractedTo;
    child.kinship = { toCarrier: Math.round(kinship(genome, gA) * 100) / 100, toSire: Math.round(kinship(genome, gB) * 100) / 100 };
  } else {
    /* no genomes on file (an imported save mid-migration): the old blend */
    const t = {};
    for (const a of TRAIT_AXES) {
      const pa = carrier.traits?.[a] ?? 0.5, pb = sire.traits?.[a] ?? 0.5;
      t[a] = Math.round(Math.max(0, Math.min(1, (pa + pb) / 2 + ((child.traits?.[a] ?? 0.5) - 0.5) * 0.4)) * 100) / 100;
    }
    child.traits = t;
  }
  /* What the house does, as well as what the bodies do. Two hands in the same
   * trade raise the next generation of it: the child is born into the complex,
   * comes of age already carrying a share of what their parents knew, and
   * learns the rest of that trade faster than anybody who came to it cold.
   * Every complex works this way, not just the drills. */
  const heritage = heritageFor(carrier, sire, { aptitude: child.aptitude ?? skillAptitude(genome ?? genomeOf(child)), seed });
  if (heritage) applyHeritage(child, heritage);

  /* A family name from one parent — but which part of a name is the family
   * part depends on the tongue. "Noil of the Sind" does not hand down "Sind",
   * a Brann hands down their own given name with a suffix on it, and a Veyd
   * has nothing to hand down at all. childFamily knows the difference. */
  const surname = childFamily(sire, carrier, child.gender, child.raceId ?? raceId, nameRng(`name:${seed}`));
  child.name = surname ? `${child.name.split(" ")[0]} ${surname}` : child.name.split(" ")[0];
  cradle.put(child);
  cradle.note(child.id, `Born aboard ${crew.employer ?? "a ship"} to ${carrier.name} and ${sire.name}`);
  const look = looksLine(child);
  if (look) cradle.note(child.id, `On the record at birth: ${look}`);
  if (heritage) cradle.note(child.id, heritageLine(child));
  return child;
}

/** Every cycle, from tickCrew's hook: pregnancies advance, children grow, pairs may conceive. */
export function tickHousehold() {
  loadSocial();
  /* pregnancies */
  for (const p of [...household.pregnancies]) {
    p.cycles++;
    const carrier = personById(p.carrier);
    const sire = personById(p.sire) ?? { id: p.sire, name: p.sireName, raceId: p.sireRace, traits: {} };
    if (!carrier) { household.pregnancies.splice(household.pregnancies.indexOf(p), 1); continue; }
    if (p.cycles >= PREGNANCY_CYCLES) {
      household.pregnancies.splice(household.pregnancies.indexOf(p), 1);
      if (p.twins) {
        /* a second child, crossed from the same two people with its own seed —
         * fraternal, so it is genuinely a sibling and not a copy */
        const twin = conceive(carrier, sire);
        household.children.push({ id: twin.id, name: twin.name, age: 0, parents: twin.parents, raceId: twin.raceId, gender: twin.gender, pronouns: twin.pronouns, traits: twin.traits });
        note(`${twin.name} was the first of two.`);
      }
      const child = conceive(carrier, sire);
      household.children.push({ id: child.id, name: child.name, age: 0, parents: child.parents, raceId: child.raceId, gender: child.gender, pronouns: child.pronouns, traits: child.traits });
      for (const q of [carrier, sire]) if (q.morale != null) q.morale = Math.min(100, q.morale + 10);
      note(`${child.name} was born aboard — ${carrier.name} and ${sire.name}'s. ${berthsRoom()}`);
      logEvent(`${child.name} born aboard to ${carrier.name} and ${sire.name}`, "crew");
      if (carrier.id !== "player") { const rec = cradle.get(carrier.id); if (rec) cradle.note(rec.id, `Had ${child.name} aboard ${crew.employer ?? "a ship"}`); }
      if (sire.id !== "player") { const rec = cradle.get(sire.id); if (rec) cradle.note(rec.id, `${child.name} born — ${sire.pronouns?.pos ?? "their"} child with ${carrier.name}`); }
    }
  }
  /* children grow */
  for (const c of [...household.children]) {
    c.age++;
    if (c.age >= ADULT_CYCLES) {
      const rec = cradle.get(c.id);
      if (rec) {
        rec.status = "pool"; rec.age = c.age; rec.ageCycles = 200;
        /* a child of the trade does not walk into a hall as a stranger */
        const h = rec.heritage;
        rec.letter = h ? startingLetter(h) : "F";
        const cx = h ? COMPLEXES[h.complexId] : null;
        rec.title = cx?.ranks?.find((r) => r.letter === rec.letter)?.title ?? "Hand"; cradle.note(rec.id, `Came of age aboard ${crew.employer ?? "a ship"} — looking for a berth of ${rec.pronouns?.pos ?? "their"} own`); }
      const raised = comeOfAge(c);
      household.children.splice(household.children.indexOf(c), 1);
      if (raised?.welcome) {
        note(`${c.name} is grown — and says the berth they want is this one. The halls will list ${c.pronouns?.obj ?? "them"}, but ${c.pronouns?.subj ?? "they"} would sign here on a word.`);
        logEvent(`${c.name} came of age aboard — raised by you`, "crew");
      } else note(`${c.name} is grown. ${c.pronouns?.subj === "they" ? "They have" : `${c.pronouns?.subj[0].toUpperCase()}${c.pronouns?.subj.slice(1)} has`} gone to find a berth — the halls will have ${c.pronouns?.obj ?? "them"}.`);
    }
  }
  /* Conceptions. With the adult layer on, a child comes from a couple who had
   * a berth to themselves and were not being careful (crew/romance.js) — the
   * blanket per-cycle roll would double-count it, so it stands down. */
  if (!social.family || social.adult) return;
  const seen = new Set();
  const pairs = [];
  for (const m of crew.aboard) {
    if (!m.partner || seen.has(m.id) || m.robot) continue;
    const p = partnerOf(m);
    if (!p || p.robot) continue;
    seen.add(m.id); seen.add(p.id);
    pairs.push([m, p]);
  }
  for (const [a, b] of pairs) {
    if (household.pregnancies.some((p) => p.carrier === a.id || p.carrier === b.id)) continue;
    if ((a.morale ?? 70) < 55 || (b.morale ?? 70) < 55) continue;
    if (!canConceive(a, b)) continue;
    const roll = hashRoll(`${a.id}:${b.id}:${a.cyclesAboard ?? 0}:${sim.time.toFixed(0)}`);
    if (roll < CONCEIVE_CHANCE) {
      const carrier = a.gender === "woman" || (a.gender === "nonbinary" && b.gender !== "woman") ? a : b;
      const sire = carrier === a ? b : a;
      household.pregnancies.push({ carrier: carrier.id, sire: sire.id, sireName: sire.name, sireRace: sire.raceId, cycles: 0, due: PREGNANCY_CYCLES });
      note(`${carrier.name} is expecting — ${sire.id === "player" ? "yours" : `${sire.name}'s`}. Six cycles.`);
      logEvent(`${carrier.name} is expecting a child with ${sire.name}`, "crew");
      if (carrier.id !== "player") { const rec = cradle.get(carrier.id); if (rec) cradle.note(rec.id, `Expecting, with ${sire.name}`); }
    }
  }
}

function hashRoll(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

function berthsRoom() {
  const cap = sim.crewCapacity ?? 2;
  return overBerths(cap) ? `The hull is over its berths (${berthsUsed()}/${cap}) — settle a family at a port.` : `Berths ${berthsUsed()}/${cap}.`;
}

/** The people who go with this hand if they leave: partner (if crew) and their children. */
export function familyOf(m) {
  const kids = household.children.filter((c) => c.parents?.includes(m.id));
  const partner = m.partner && m.partner !== "player" ? crew.aboard.find((x) => x.id === m.partner) : null;
  return { partner, children: kids };
}

/**
 * Settle a hand and theirs at the docked port. mode: "staff" (company books)
 * or "payoff" (severance, recorded). Returns null or the reason it failed.
 */
export function settleFamily(id, mode = "staff") {
  const m = crew.aboard.find((x) => x.id === id);
  if (!m) return "Not aboard";
  const st = stationById(sim.ship.dockedAt);
  if (!st) return "Dock at a port first";
  const fam = familyOf(m);
  const going = [m, ...(fam.partner ? [fam.partner] : [])];
  const kids = fam.children;
  const family = [...(fam.partner ? [fam.partner] : []), ...kids];
  const err = mode === "staff" ? settleAsStaff(m, family, st) : payOffAndRecord(m, family, mode === "payoff" ? "paid off and released" : "settled", st);
  if (err) return err;
  /* they leave the roster without a departure penalty on whoever stays: this was the plan */
  for (const g of going) {
    const i = crew.aboard.indexOf(g);
    if (i >= 0) crew.aboard.splice(i, 1);
    if (g.partner === "player") g.partner = null;
    const rec = cradle.get(g.id);
    if (rec) { rec.station = st.id; }
  }
  for (const k of kids) {
    const i = household.children.indexOf(k);
    if (i >= 0) household.children.splice(i, 1);
    const rec = cradle.get(k.id);
    if (rec) { rec.status = "dependant"; rec.station = st.id; cradle.put(rec); }
  }
  /* A pregnancy does not stop because its carrier took a berth ashore. It
   * goes with them: js/stationlife.js carries it the rest of the way and the
   * child is born at the port, on the company's books, where it grows up and
   * eventually goes on the rolls as family rather than as a hire. */
  for (const p of [...household.pregnancies]) {
    if (!going.some((g) => g.id === p.carrier)) continue;
    household.pregnancies.splice(household.pregnancies.indexOf(p), 1);
    if (mode === "staff") {
      const msg = carryPregnancyAshore(p.carrier, p.sire, Math.max(1, (p.due ?? 6) - (p.cycles ?? 0)), st.id);
      if (msg) note(msg);
    }
  }
  const who = going.map((g) => g.name).join(" and ");
  note(mode === "staff"
    ? `${who}${kids.length ? ` and ${kids.length} ${kids.length === 1 ? "child" : "children"}` : ""} settled at ${st.name} — on ${company.name}'s books.`
    : `${who}${kids.length ? ` and ${kids.length} ${kids.length === 1 ? "child" : "children"}` : ""} paid off at ${st.name}. Address kept.`);
  return null;
}

/* ---- talk ------------------------------------------------------------------ */

const first = (m) => m.name.split(" ")[0];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

export function trustOf(m) { return m.trust ?? 40; }
/** Move a hand's trust in you / morale, clamped. A robot's morale never moves (it has none). */
export function adjustTrust(m, d) { m.trust = Math.max(0, Math.min(100, trustOf(m) + d)); return m.trust; }
export function adjustMorale(m, d) { if (m.robot) return m.morale; m.morale = Math.max(1, Math.min(100, (m.morale ?? 70) + d)); return m.morale; }
/* the old names, kept as aliases */
export const bumpTrust = adjustTrust;
export const bumpMorale = adjustMorale;

/** Whether this hand would take you up on it: the switch, their interest, yours. */
/**
 * The captain and a hand become a couple. One place does it, because there are
 * two ways in now — the TALK topic and the staged dinner act (crew/beats.js) —
 * and the beat used to set `m.partner` on its own, leaving the ledger with no
 * record and the crew log with nothing in it.
 */
export function pairWithPlayer(m) {
  if (!m || m.robot) return { ok: false, why: "not somebody you can" };
  const can = couldCourt(m);
  if (!can.ok) return can;
  m.partner = "player";
  bumpMorale(m, 10);
  bumpTrust(m, 10);
  const rec = cradle.get(m.id);
  if (rec) { rec.partner = "player"; cradle.put(rec); cradle.note(rec.id, `Together with ${playerAsPerson().name}, the captain`); }
  note(`${m.name} and the captain have been taking the same mess shift. It's official aboard.`);
  return { ok: true };
}

export function couldCourt(m) {
  loadSocial();
  if (m.robot) return { ok: false, why: "it is a machine" };
  if (social.romance !== "all") return { ok: false, why: "romance is set to crew-only" };
  if (m.partner) return { ok: false, why: `${first(m)} is with someone` };
  const me = playerAsPerson();
  if (!drawnTo(m, me)) return { ok: false, why: `${first(m)} is not drawn to ${me.gender === "nonbinary" ? "people like you" : `${me.gender === "woman" ? "women" : "men"}`}` };
  if (!drawnTo(me, m)) return { ok: false, why: `you are not drawn to ${m.gender === "nonbinary" ? "them" : `${m.gender === "woman" ? "women" : "men"}`}` };
  if (trustOf(m) < 55) return { ok: false, why: "not yet — earn more of their trust" };
  return { ok: true };
}

/**
 * The dialogue tree for a hand: [{ id, label, cls?, run() → line }]. The
 * interior panel renders it; the tests read it. Lines are first-person theirs.
 */
export function crewTopics(m, ctx = {}) {
  loadSocial();
  const f = first(m);
  const t = m.traits ?? {};
  const pr = m.pronouns ?? PRONOUNS.nonbinary;
  const fam = familyOf(m);
  const partner = partnerOf(m);
  const docked = Boolean(sim.ship.dockedAt);
  const topics = [];

  topics.push({ id: "watch", label: "How's the watch?", run: () => {
    if ((m.morale ?? 70) >= 70) return `${f}: "Quiet. Pay's on time. I'd sail with this crew again."`;
    if ((m.morale ?? 70) >= 40) return `${f}: "Holding. The mess could use a cook."`;
    return `${f}: "You want the honest answer? People are talking about the payroll."`;
  } });

  topics.push({ id: "about", label: "Tell me about yourself", run: () => {
    const rec = cradle.get(m.id);
    const race = RACES.find((r) => r.id === m.raceId)?.name ?? "";
    const drawn = !m.attractedTo?.length ? "I don't go in for any of that" : m.attractedTo.length === 3 ? "anyone who's kind, honestly" : m.attractedTo.map((g) => g === "woman" ? "women" : g === "man" ? "men" : "people outside all that").join(" and ");
    bumpTrust(m, 2);
    return `${f}: "${race ? `${race}, ` : ""}${rec?.origin ? `from ${rec.origin}. ` : ""}${cap(pr.subj)}/${pr.obj}, if you're asking. I'm drawn to ${drawn}. ${voiceLine("about", `${m.id}:about:${Math.round(sim.time ?? 0)}`)}"`;
  } });

  topics.push({ id: "praise", label: "Good work out there", run: () => {
    if (t.greed > 0.7) { bumpTrust(m, 1); bumpMorale(m, 2); return `${voiceWrap(f, voiceLine("praise_ok", `${m.id}:p:${Math.round(sim.time ?? 0)}`))} (${pr.subj} means it)`; }
    bumpTrust(m, 4); bumpMorale(m, 5);
    return `${voiceWrap(f, voiceLine("praise_ok", `${m.id}:p2:${Math.round(sim.time ?? 0)}`))} (trust up)`;
  } });

  topics.push({ id: "bonus", label: "Bonus — 100 cr", run: () => {
    if (sim.ship.credits < 100) return `${f}: "…with what, captain?"`;
    sim.ship.credits -= 100;
    bumpTrust(m, 6); bumpMorale(m, 8);
    logEvent(`Bonus of 100 cr to ${m.name}`, "crew");
    return `${voiceWrap(f, voiceLine("wage_yes", `${m.id}:bon:${Math.round(sim.time ?? 0)}`))} (trust and morale up)`;
  } });

  topics.push({ id: "chew", label: "Sharpen up", cls: "danger", run: () => {
    if (t.grit > 0.6) { bumpTrust(m, -2); bumpMorale(m, -3); return `${voiceWrap(f, voiceLine("chew", `${m.id}:c1:${Math.round(sim.time ?? 0)}`))} (${pr.subj} takes it square)`; }
    bumpTrust(m, -8); bumpMorale(m, -10);
    if (partner && partner.id !== "player") bumpMorale(partner, -4);
    return `${voiceWrap(f, voiceLine("chew", `${m.id}:c2:${Math.round(sim.time ?? 0)}`))} (${pr.subj} goes quiet${partner && partner.id !== "player" ? `; ${first(partner)} noticed` : ""})`;
  } });

  if (partner) {
    topics.push({ id: "partner", label: `About ${partner.id === "player" ? "us" : first(partner)}`, run: () => {
      if (partner.id === "player") return `${f}: "${t.caution > 0.6 ? "I keep it off the deck. Doesn't mean it isn't there." : "You know where I sleep, captain."}"`;
      const r = rapportBetween(m, partner);
      return `${f}: "${first(partner)}? ${r > 80 ? `${cap(partner.pronouns?.subj ?? "they")}'s the reason I stay.` : "We're good. Mostly."}${fam.children.length ? ` The kid${fam.children.length > 1 ? "s" : ""} keep us honest.` : ""}"`;
    } });
  }
  if (fam.children.length) {
    topics.push({ id: "kids", label: "The children", run: () => {
      const k = fam.children.map((c) => `${c.name.split(" ")[0]} (${c.age} cycles)`).join(", ");
      return `${f}: "${k}. ${overBerths(sim.crewCapacity ?? 2) ? "We're stacked three to a berth, captain. They need a deck that doesn't move." : "Growing faster than the hull."}"`;
    } });
  }
  const preg = household.pregnancies.find((p) => p.carrier === m.id);
  if (preg) topics.push({ id: "expecting", label: "How are you feeling?", run: () => `${f}: "${preg.due - preg.cycles} cycles to go. ${t.caution > 0.6 ? "I'd take a quiet run, if you're offering." : "Don't fuss."}"` });

  if (!partner) {
    const c = couldCourt(m);
    topics.push({ id: "court", label: "Ask them to dinner", cls: c.ok ? "accent" : "", run: () => {
      if (!c.ok) {
        bumpTrust(m, social.romance === "all" ? -1 : 0);
        return social.romance !== "all" ? `(Romance with the crew is switched off in HOUSE.)` : voiceWrap(f, voiceLine("court_block", `${m.id}:nob:${c.why}`, "That's kind. No."));
      }
      const roll = hashRoll(`${m.id}:court:${sim.time.toFixed(0)}`);
      if (roll < 0.35 + trustOf(m) / 200) {
        pairWithPlayer(m);
        return `${voiceWrap(f, voiceLine("court_yes", `${m.id}:yes:${Math.round(sim.time ?? 0)}`, "Yes."))} (${pr.subj} doesn't look away)`;
      }
      bumpTrust(m, -3);
      return `${voiceWrap(f, voiceLine("court_no", `${m.id}:no:${Math.round(sim.time ?? 0)}`, "Not tonight."))} (${pr.subj} doesn't close the door on it)`;
    } });
  } else if (partner.id === "player") {
    topics.push({ id: "breakup", label: "End it", cls: "danger", run: () => {
      m.partner = null; bumpMorale(m, -20); bumpTrust(m, -15);
      const rec = cradle.get(m.id); if (rec) { rec.partner = null; cradle.note(rec.id, "The captain ended it"); }
      note(`${m.name} and the captain have called it off. The mess is quiet.`);
      return `${f}: "Understood." (${pr.subj} leaves the room)`;
    } });
  }

  if (docked) {
    topics.push({ id: "leave", label: "Shore leave — 60 cr", run: () => {
      if (sim.ship.credits < 60) return `${f}: "Leave's cheap, captain. Not free."`;
      sim.ship.credits -= 60; bumpMorale(m, 12); bumpTrust(m, 2);
      return `${f}: "Back by the next watch." (morale up)`;
    } });
    topics.push({ id: "settleStaff", label: hasCompany() ? `Settle here — ${company.name} staff` : "Settle here (needs a company)", cls: hasCompany() ? "accent" : "", run: () => {
      const e = settleFamily(m.id, "staff");
      return e ? `(${e})` : `${f}: "A deck that doesn't move. We'll keep the books straight for you." (settled — passive income to ${company.name})`;
    } });
    topics.push({ id: "settlePay", label: "Pay off and release", cls: "danger", run: () => {
      const e = settleFamily(m.id, "payoff");
      return e ? `(${e})` : `${f}: "No hard feelings, captain. You know where to find us." (paid off — address kept)`;
    } });
  }
  return topics;
}

/**
 * A greeting that knows who is talking.
 *
 * The seed moves once a cycle rather than once a frame, so a hand does not
 * recite a new line every time the panel repaints — but come back after a
 * watch and they greet you differently. Ninety-nine bags of these arrived from
 * Shane's own voice bank (js/crew/voice-bank.js, 2,848 lines); this picks the
 * bag and the bank picks the line.
 */
export function greetLine(m) {
  const f = first(m);
  const t = m.traits ?? {};
  const seed = `${m.id}:greet:${Math.round((sim.time ?? 0) / 90)}`;
  if (m.robot) return `${f}: "Captain. Unit ${m.designation ?? m.id} at ${Math.round(m.condition ?? 100)}% condition. Awaiting directive."`;
  if ((m.morale ?? 70) < 35) return `${voiceWrap(f, voiceLine("greet_low", seed, "Captain."))} (does not look up)`;
  if (m.partner === "player") return voiceWrap(f, voiceLine("greet_partner", seed, "Captain."));
  if (trustOf(m) >= 75) return voiceWrap(f, voiceLine("greet_trust", seed, "Captain. Say the word."));
  const bag = t.curiosity > 0.7 ? "greet_curiosity" : t.grit > 0.7 ? "greet_grit" : t.caution > 0.7 ? "greet_caution"
    : t.greed > 0.7 ? "greet_greed" : t.loyalty > 0.7 ? "greet_loyalty" : "greet_base";
  return voiceWrap(f, voiceLine(bag, seed, "Captain."));
}

/* the ledger's cycle is the household's cycle */
crewHooks.onCycle = tickHousehold;

export function resetHousehold() {
  household.children.length = 0;
  household.pregnancies.length = 0;
  household.log.length = 0;
}

export function wireFamily() {
  if (globalThis.window?.__lg) window.__lg.family = { social, setSocial, household, crewTopics, couldCourt, settleFamily, familyOf, tickHousehold, canConceive, berthsUsed, overBerths };
}
