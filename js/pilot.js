/* LIVING GALAXY — the pilot.
 *
 * Who you are, what you trained as, and who you fly for. Race traits land on
 * the ship at launch; the career ladder from js/careers advances off what you
 * actually do out there, not off a menu.
 */

import {
  COMPLEXES,
  COMPLEX_IDS,
  SKILLS,
  createCharacter,
  displayTitle,
  enroll,
  getComplex,
  promote,
  promotionCheck,
  specialize,
  specializationCheck,
  tickCycle,
  trainSkill,
  transferEligibility,
} from "./careers/index.js";
import { SPEC_EFFECTS, composeMods, effectLines } from "./careers/effects.js";
import { RACES, raceById, traitsOf } from "./races.js";
import { corpById, corps, setStandingMods } from "./corps.js";

export const pilot = {
  name: "Pilot",
  raceId: "terran",
  complexId: "mining",
  corpId: null,
  character: null,
  /* skill drip accumulators, so a second of mining is not a whole point */
  drip: {},
  cyclePool: 0,
  lastPromotion: null,
  /* composed race × specialisation multipliers — the sim reads this every tick */
  mods: composeMods(null, null, null),
  /* did any work() land this cycle? idle cycles do not train */
  busy: false,
  /* scrip earned by the ladder and not yet paid into the ship's account */
  payout: 0,
  /* probationary: enrolled under the rank A bar; cleared on first promotion */
  probation: false,
  /* true when this pilot came back from the record rather than the creation screen */
  restored: false,
  record: null,
  /* something worth writing changed (skill, rank, cert, hull) — the sim's 30 s writer reads it */
  dirty: false,
  /* 0.3.48: what the Directorate holds against you (js/seclevel.js). Rides the
   * pilot record, so a reload is not an amnesty */
  secHeat: 0,
};

let crewBag = null;
let upgradeBag = null;

/** The crew's contribution (from npc/crewfx.js). Multiplies into the composed bag. */
export function setCrewMods(bag) {
  crewBag = bag;
  refreshMods();
}

/** The refit's contribution (from upgrades.js). Multiplies into the composed bag like the crew's. */
export function setUpgradeMods(bag) {
  upgradeBag = bag;
  refreshMods();
}

function refreshMods() {
  const spec = pilot.character?.careers?.[pilot.complexId]?.specialization ?? null;
  const m = composeMods(traitsOf(pilot.raceId), pilot.raceId, spec);
  if (crewBag) for (const [k, v] of Object.entries(crewBag)) if (k in m) m[k] *= v;
  if (upgradeBag) for (const [k, v] of Object.entries(upgradeBag)) if (k in m) m[k] *= v;
  pilot.mods = m;
  setStandingMods(pilot.mods);
  return pilot.mods;
}

/** Everything the creation screen needs to describe a career. */
export function careerCatalog() {
  return COMPLEX_IDS.map((id) => {
    const c = getComplex(id);
    return {
      id,
      name: c.name ?? id,
      blurb: c.blurb ?? c.summary ?? c.setting ?? "",
      primary: (c.primarySkills ?? []).map((s) => SKILLS[s]?.name ?? s),
      primaryIds: c.primarySkills ?? [],
      related: c.related ?? [],
      entry: c.ranks?.[0],
      ladder: (c.ranks ?? []).map((r) => `${r.letter} ${r.title}`),
      specs: (c.specializations ?? []).map((s) => `${s.name} (${s.fromRank})`),
    };
  });
}

export function makePilot(name, raceId, complexId, corpId) {
  const race = raceById(raceId);
  let ch = createCharacter(name || "Pilot");
  /* Racial affinity is a head start, not a rank — and it counts at the door. */
  for (const [skill, amount] of Object.entries(race.affinity ?? {})) {
    ch = trainSkill(ch, skill, amount).character;
  }
  let res = enroll(ch, complexId);
  pilot.probation = !res.ok;
  if (!res.ok) res = enroll(ch, complexId, { force: true }); // taken on as a probationary aide
  ch = res.character;
  pilot.name = name || "Pilot";
  pilot.secHeat = 0;
  pilot.raceId = raceId;
  pilot.complexId = complexId;
  pilot.corpId = corpId ?? null;
  pilot.character = ch;
  pilot.drip = {};
  pilot.cyclePool = 0;
  pilot.lastPromotion = null;
  pilot.busy = false;
  pilot.payout = 0;
  pilot.restored = false;
  pilot.record = null;
  pilot.dirty = true;
  refreshMods();
  return pilot;
}

/* ---- the pilot record: what "fly on as the same pilot" needs ---------------
 *
 * 0.3.42. Until now nothing here was written anywhere: race, career, rank,
 * skills, certs, the specialisation — every launch was makePilot() from the
 * creation screen, which is a NEW run (js/profile.js sweeps the old one). So
 * a returning player was a new character in a new corp with the starting
 * purse, whatever the save beside it said. The record below is a RUN key: it
 * goes with the pilot, travels with the account, and is swept by a new one.
 * The hulls the pilot bought and the cover written on them ride in it too —
 * they were reset at launch with everything else. */
export const PILOT_KEY = "lgaa.pilot.v1";
export const PILOT_RECORD_VERSION = 1;

const store = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };

/** The record, as JSON-safe data. `extra` is what the sim owns (hulls, cover). */
export function serializePilot(extra = {}) {
  return {
    v: PILOT_RECORD_VERSION,
    name: pilot.name,
    raceId: pilot.raceId,
    complexId: pilot.complexId,
    corpId: pilot.corpId ?? null,
    character: pilot.character,
    probation: Boolean(pilot.probation),
    lastPromotion: pilot.lastPromotion ?? null,
    payout: Number(pilot.payout) || 0,
    cyclePool: Number(pilot.cyclePool) || 0,
    secHeat: Math.round((Number(pilot.secHeat) || 0) * 100) / 100,
    ...extra,
  };
}

/** Put a record back on `pilot`. Returns false (and touches nothing) for a bad one. */
export function restorePilot(rec) {
  if (!rec || rec.v !== PILOT_RECORD_VERSION || !rec.character?.careers || !rec.complexId || !RACES.some((r) => r.id === rec.raceId)) return false;
  pilot.name = String(rec.name || "Pilot");
  pilot.raceId = rec.raceId;
  pilot.complexId = rec.complexId;
  pilot.corpId = rec.corpId ?? null;
  pilot.character = rec.character;
  pilot.probation = Boolean(rec.probation);
  pilot.lastPromotion = rec.lastPromotion ?? null;
  pilot.payout = Number(rec.payout) || 0;
  pilot.cyclePool = Number(rec.cyclePool) || 0;
  pilot.secHeat = Math.max(0, Number(rec.secHeat) || 0);
  pilot.drip = {};
  pilot.busy = false;
  pilot.restored = true;
  pilot.record = rec;      // the sim reads hulls and cover off it at launch
  pilot.dirty = false;
  refreshMods();
  return true;
}

export function savePilot(extra = {}) {
  try { store()?.setItem(PILOT_KEY, JSON.stringify(serializePilot(extra))); return true; } catch { return false; }
}

/** The record on this device, or null. Does not touch `pilot`. */
export function loadPilot() {
  try {
    const rec = JSON.parse(store()?.getItem(PILOT_KEY) ?? "null");
    return rec && rec.v === PILOT_RECORD_VERSION && rec.character?.careers ? rec : null;
  } catch { return null; }
}

/** Applies race traits to a fresh ship. Called once, at launch. */
export function applyRaceToShip(ship) {
  const t = traitsOf(pilot.raceId);
  applyRaceTune(ship, t);
  ship.baseCargo = ship.cargoCap;
  ship.cargoCap = Math.round(ship.baseCargo * t.hold * pilot.mods.cargo);
  ship.credits += t.credits;
  ship.mods = refreshMods();
  return ship;
}

/** Called by the sim each tick: keeps the hull's modifier bag and hold in step with the pilot. */
export function syncMods(ship) {
  if (ship.mods !== pilot.mods) {
    ship.mods = pilot.mods;
    const t = traitsOf(pilot.raceId);
    ship.cargoCap = Math.round((ship.baseCargo ?? ship.cargoCap) * t.hold * pilot.mods.cargo * (ship.hullTune?.cargo ?? 1));
  }
  return ship.mods;
}

/** Re-applies the race's tune multipliers to a fresh `ship.tune` (used by RESET ALL). */
export function applyRaceTune(ship, t = traitsOf(pilot.raceId)) {
  ship.tune.rcsGain *= t.rcs;
  ship.tune.reactorTrim *= t.reactor;
  return ship;
}

export function raceTraits() {
  return traitsOf(pilot.raceId);
}

/* ---- skill drip ---------------------------------------------------------- */

/**
 * Awards fractional skill for doing the work. Whole points only land when the
 * accumulator crosses one, so a long shift pays and a tap does not.
 */
export function work(skillId, amount) {
  if (!pilot.character || !amount) return;
  const acc = (pilot.drip[skillId] ?? 0) + amount;
  const whole = Math.floor(acc);
  pilot.drip[skillId] = acc - whole;
  pilot.busy = true;
  if (whole > 0) {
    const r = trainSkill(pilot.character, skillId, whole);
    if (r.character) pilot.character = r.character;
    pilot.dirty = true;
  }
}

/* The ladder's rate is the complex's book rate; the pilot's share of it lands
 * in the ship's account every cycle. The rest is the complex's cut — berth,
 * feed, insurance. Crew wages (crew.js) are 0.2 of the same book rate, so a
 * two-hand crew costs most of a rank-A pilot's take: hire for the work, not
 * the company. Probationary aides draw a reduced share until first promotion. */
export const PAY_SHARE = 0.5;
export const PROBATION_SHARE = 0.6;

/**
 * Time in grade. Ranks want cycles as well as skill. A cycle only trains if
 * you did something in it — or you are docked, where a port is a classroom at
 * half pace. Idling in the dark serves time and pays, and teaches nothing.
 */
export function serveTime(seconds, { docked = false } = {}) {
  if (!pilot.character) return;
  pilot.cyclePool += seconds;
  while (pilot.cyclePool >= 90) {
    pilot.cyclePool -= 90;
    pilot.dirty = true;          // a cycle ticked: scrip, maybe a skill — worth writing; the seconds between are not
    const before = pilot.character.scrip ?? 0;
    const train = pilot.busy ? 0.35 : docked ? 0.18 : 0;
    const r = tickCycle(pilot.character, { train: train > 0, trainChance: train, trainAmount: 1 });
    if (r.character) pilot.character = r.character;
    const earned = (pilot.character.scrip ?? 0) - before;
    pilot.payout += earned * PAY_SHARE * (pilot.probation ? PROBATION_SHARE : 1);
    pilot.busy = false;
  }
}

/** Drains earned scrip; the sim credits it to the ship. */
export function takePayout() {
  const p = Math.round(pilot.payout);
  if (p) pilot.dirty = true;   // paid something: the record moved (and so did the wallet)
  pilot.payout -= p;
  return p;
}

/* ---- rank ---------------------------------------------------------------- */

export function rankStatus() {
  if (!pilot.character) return null;
  const check = promotionCheck(pilot.character, pilot.complexId);
  const c = getComplex(pilot.complexId);
  const cur = pilot.character.careers?.[pilot.complexId];
  const rank = (c.ranks ?? []).find((r) => r.letter === cur?.rank);
  return {
    complex: c.name ?? pilot.complexId,
    letter: cur?.rank ?? "A",
    title: rank?.title ?? "—",
    duties: rank?.duties ?? "",
    pay: rank?.pay ?? 0,
    take: Math.round((rank?.pay ?? 0) * PAY_SHARE * (pilot.probation ? PROBATION_SHARE : 1)),
    cycles: cur?.cyclesInComplex ?? cur?.cycles ?? 0,
    ready: Boolean(check.ok),
    probation: pilot.probation,
    missing: check.missing ?? check.reason ?? null,
    next: rank?.next ?? null,
    unlocks: rank?.unlocks ?? [],
  };
}

export function tryPromote() {
  pilot.dirty = true;
  if (!pilot.character) return { ok: false, reason: "no pilot" };
  const r = promote(pilot.character, pilot.complexId);
  if (r.ok) {
    pilot.character = r.character;
    pilot.lastPromotion = displayTitle(pilot.character, pilot.complexId);
    pilot.probation = false;
  }
  return r;
}

/** Lateral transfer to another complex: cycles kept, ladder restarts at A (B if related and senior). */
export function transferOptions() {
  if (!pilot.character) return [];
  return COMPLEX_IDS.filter((id) => id !== pilot.complexId).map((id) => {
    const c = getComplex(id);
    const held = pilot.character.careers?.[id];
    if (held) return { id, name: c.name ?? id, related: true, start: held.rank, note: "resume where you left it", ok: true, resume: true };
    const e = transferEligibility(pilot.character, pilot.complexId, id);
    return { id, name: c.name ?? id, related: Boolean(e.related), start: e.recommendedStart ?? "A", note: e.note ?? e.error ?? "", ok: Boolean(e.ok), resume: false };
  });
}

export function tryTransfer(toId) {
  pilot.dirty = true;
  if (!pilot.character) return { ok: false, error: "no pilot" };
  if (!getComplex(toId) || toId === pilot.complexId) return { ok: false, error: "Already in that complex" };
  let e = { ok: true, recommendedStart: pilot.character.careers?.[toId]?.rank, related: true };
  if (!pilot.character.careers?.[toId]) {
    /* a ladder you have never climbed: enrol fresh */
    e = transferEligibility(pilot.character, pilot.complexId, toId);
    if (!e.ok) return e;
    const r = enroll(pilot.character, toId, { force: true, startLetter: e.recommendedStart });
    if (!r.ok) return r;
    pilot.character = r.character;
  }
  pilot.character.activeComplex = toId;
  pilot.complexId = toId;
  pilot.probation = false;
  pilot.drip = {};
  refreshMods();
  return { ok: true, start: e.recommendedStart, related: e.related };
}

export function specOptions() {
  const c = getComplex(pilot.complexId);
  return (c.specializations ?? []).map((s) => ({
    ...s,
    effects: effectLines(SPEC_EFFECTS[s.id]),
    check: specializationCheck(pilot.character, pilot.complexId, s.id),
  }));
}

export function trySpecialize(specId) {
  pilot.dirty = true;
  const r = specialize(pilot.character, pilot.complexId, specId);
  if (r.ok) {
    pilot.character = r.character;
    refreshMods();
  }
  return r;
}

/** "Mining yield +15%" lines for a specialisation id (or the current one). */
export function specEffectLines(specId = pilot.character?.careers?.[pilot.complexId]?.specialization) {
  return effectLines(specId ? SPEC_EFFECTS[specId] : null);
}

/** Certificates held — the record of the climb, not a gate. */
export function certSheet() {
  return (pilot.character?.certs ?? []).map((id) => ({ id, name: certName(id) }));
}

export function title() {
  if (!pilot.character) return pilot.name;
  return displayTitle(pilot.character, pilot.complexId);
}

/** Skills sorted by value, for the terminal. */
export function skillSheet() {
  if (!pilot.character) return [];
  const s = pilot.character.skills ?? {};
  return Object.keys(s)
    .filter((k) => s[k] > 0)
    .sort((a, b) => s[b] - s[a])
    .map((k) => ({ id: k, name: SKILLS[k]?.name ?? k, domain: SKILLS[k]?.domain ?? "", value: Math.round(s[k]) }));
}

export function corp() {
  return pilot.corpId ? corpById(pilot.corpId) : null;
}

export function standingSheet() {
  return corps.map((c) => ({ id: c.id, name: c.name, tier: c.tier, sector: c.sectorName, standing: Math.round(c.standing) }));
}

export { COMPLEXES, COMPLEX_IDS };

/* ---- certificate names -------------------------------------------------- */

const CERT_WORDS = {
  eva: "EVA", qc: "QC", lv: "LV", pi: "PI", qm: "QM", emt: "EMT",
  ops: "Ops", conn: "Conn", astro: "Astro", agri: "Agri", arch: "Architect",
  writ: "Writ", seal: "Seal", card: "Card", badge: "Badge", mark: "Mark",
  ticket: "Ticket", license: "License", charter: "Charter",
};

export function certName(id) {
  if (!id) return "Certificate";
  return String(id)
    .split("_")
    .map((w) => CERT_WORDS[w] ?? (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}
