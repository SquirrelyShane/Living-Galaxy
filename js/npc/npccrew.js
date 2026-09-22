/* Living Galaxy — crews for the other hundred and sixty hulls.
 *
 * an earlier patch gave the player's watch a genome, a decision graph and a journal. Every
 * other ship in the sky was a transponder with a captain's name on it. This
 * puts a crew behind each of them — the same 64 nodes, the same nine needs,
 * the same records — and lets what those crews decide reach the sim: a hauler
 * whose engineer has stopped caring wears out faster, a pirate crew that has
 * not been paid turns on its captain, and the hand who walks off a trader at
 * Foundry Hold is in the hiring hall when you dock there.
 *
 * Three things keep it affordable on a phone:
 *
 *   1. Crews are BUILT LAZILY, nearest first. A vessel forty thousand units
 *      away that you have never scanned has no crew until it needs one.
 *   2. Crews are NOT FILED. They are grown from a deterministic seed and kept
 *      in memory; only somebody who *does* something — deserts, mutinies, gets
 *      hired — is promoted into CRADLE. A ledger of 600 provisional strangers
 *      would be a megabyte of localStorage nobody asked for.
 *   3. A fixed WORK BUDGET per cycle. A round-robin slice of the sky stands a
 *      real watch through the graph; everyone else drifts on a cheap model
 *      that moves the same numbers without walking 64 nodes to do it.
 *
 */

import { traffic, trafficDown, markVesselDown } from "./traffic.js";
import { engagementOf } from "./battles.js";
import { flow } from "./flow.js";
import { cradle, generateNPC } from "./cradle.js";
import { shipById } from "../shipdb.js";
import { sim, logEvent } from "../sim.js";
import { crew, crewHooks, CYCLE_SECONDS } from "../crew.js";
import { vesselHull } from "../crew/hull.js";
import { stepWatch, needsOf, forgetBody } from "../crew/deckmind.js";
import { journal } from "../crew/journal.js";

/** Full graph steps per cycle, across the whole sky. The hard ceiling. */
export const WORK_BUDGET = 18;
/** Vessels whose crews may be built in one cycle. */
export const BUILD_BUDGET = 3;
/** Inside this range a vessel's crew is worth simulating properly. */
export const NEAR_U = 60000;
/** Below this mean morale a hand walks at the next port. */
export const DESERT_AT = 28;
/** Below this the watch stops working the ship. */
export const STRIKE_AT = 18;
/** Below this a pirate crew stops taking orders from its captain. */
export const MUTINY_AT = 14;

export const npcCrews = {
  enabled: true,
  built: 0,            // vessels with a crew
  people: 0,           // hands alive in memory
  stepped: 0,          // full graph steps last cycle
  drifted: 0,          // cheap steps last cycle
  events: [],          // { t, vesselId, kind, text }
  cursor: 0,
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/* ---- building a crew ------------------------------------------------------ */

/** Berths on this hull, from the ship class table, bounded to something a watch fits in. */
export function crewSizeOf(v) {
  const berths = shipById(v.ship)?.crew ?? 2;
  const byRole = { pirate: 1.3, security: 1.2, patrol: 1.1, hauler: 1, trader: 1, miner: 1 }[v.role] ?? 1;
  return clamp(Math.round(berths * byRole), 1, 7);
}

/** The complexes a vessel of this role actually signs on. */
const ROLE_TRADES = {
  miner: ["mining", "engineering", "geology"],
  trader: ["commerce", "logistics", "engineering"],
  hauler: ["logistics", "engineering", "mining"],
  patrol: ["security", "navigation", "engineering"],
  security: ["security", "medical", "engineering"],
  pirate: ["security", "salvage", "engineering"],
};

/**
 * A vessel's crew, grown from its own id. Deterministic: the same hauler in
 * the same sky always carries the same people, on this device and any other.
 */
export function crewOf(v) {
  if (v.crewList) return v.crewList;
  const n = crewSizeOf(v);
  const trades = ROLE_TRADES[v.role] ?? ["logistics", "engineering"];
  const list = [];
  for (let i = 0; i < n; i++) {
    const rec = generateNPC(`${sim.skySeed || "sol"}:npccrew:${v.id}:${i}`, { sky: sim.skySeed });
    list.push({
      id: rec.id,
      seed: rec.seed,
      name: rec.name,
      raceId: rec.raceId,
      robot: false,
      synthetic: rec.synthetic,
      gender: rec.gender,
      pronouns: rec.pronouns,
      attractedTo: rec.attractedTo,
      complexId: rec.complexId,
      complexName: rec.complexName,
      letter: rec.letter,
      title: rec.title,
      traits: rec.traits,
      skills: rec.skills,
      aptitude: rec.aptitude,
      tells: rec.tells,
      genome: rec.genome,
      genomeType: rec.genomeType,
      fingerprint: rec.fingerprint,
      ageCycles: rec.ageCycles,
      wage: 0,
      morale: 62 + ((i * 7) % 17),
      cyclesAboard: 0,
      bonds: {},
      partner: null,
      hullId: v.id,
      /* the vessel's trade decides the post, not a deck plan it does not have */
      duty: null,
    });
    /* keep the unfiled record's own trade sensible for the run it is on */
    const want = trades[i % trades.length];
    if (want && !String(list[i].complexId ?? "").includes(want)) list[i].duty = null;
  }
  Object.defineProperty(v, "crewList", { value: list, enumerable: false, configurable: true, writable: true });
  v.wear ??= 0;
  v.hullPct ??= 100;
  npcCrews.built++;
  npcCrews.people += list.length;
  return list;
}

/** Mean morale of a vessel's watch, 0..100. Null when nobody has been built yet. */
export function moodOf(v) {
  const list = v.crewList;
  if (!list?.length) return null;
  let s = 0;
  for (const m of list) s += m.morale ?? 62;
  return Math.round(s / list.length);
}

/* ---- promotion ------------------------------------------------------------
 * A provisional hand becomes a real ledger entry the moment they do something
 * that ought to outlive the run: walk off, mutiny, or get hired by the player.
 */
export function promote(m, note) {
  if (cradle.get(m.id)) return cradle.get(m.id);
  const rec = generateNPC(m.seed ?? m.id, { sky: sim.skySeed });
  rec.id = m.id;
  rec.name = m.name;
  rec.status = "pool";
  rec.employer = null;
  rec.traits = m.traits;
  rec.skills = m.skills;
  rec.cyclesServed = m.cyclesAboard ?? 0;
  cradle.put(rec);
  if (note) cradle.note(rec.id, note);
  /* the cached body was keyed on the same id, and is still the same body */
  return rec;
}

/* ---- what a soured watch does --------------------------------------------- */

function event(v, kind, text) {
  npcCrews.events.unshift({ t: sim.time ?? 0, vesselId: v.id, kind, text });
  npcCrews.events.length = Math.min(npcCrews.events.length, 24);
  /* close enough to overhear */
  const d = distanceTo(v);
  if (d != null && d < NEAR_U) logEvent(text, kind === "mutiny" ? "combat" : "crew");
}

function distanceTo(v) {
  const p = sim.ship?.pos;
  if (!p || v.x == null) return null;
  return Math.hypot(v.x - p.x, v.y - p.y, v.z - p.z);
}

/**
 * What the run is like to be on. A hull that is off its route is not earning,
 * and a hull that is not earning is not paying — which is a grievance the deck
 * graph already knows what to do with. Nothing here is circular: a vessel that
 * is down because its own watch struck does not also count as unpaid.
 */
export function readRun(v) {
  const t = sim.time ?? 0;
  const downUntil = trafficDown[v.id] ?? 0;
  const down = downUntil > t;
  /* An NPC hull earns by running. A miner cutting rock, a trader three hours
   * into a burn and a patrol on its arc are all working; a hull that is off
   * the board is not. Cycles off the board is the whole wage model, and it
   * does not care why — shot at, told to wait, or struck by its own watch, the
   * wage slip reads the same. */
  const working = v.job && v.job !== "down" && v.job !== "hold";
  v.legsSince = working ? 0 : (v.legsSince ?? 0) + 1;
  v.payShort = (v.legsSince ?? 0) > 6;
  v.stranded = down;
  let fight = null;
  try { fight = engagementOf(v, t); } catch { fight = null; }
  v.underAttack = Boolean(fight && fight.end > t && (fight.victimId === v.id || fight.wing?.includes(v.id) || fight.responders?.includes(v.id)));
  return v;
}

/**
 * The consequences a crew's mood has on the ship it is standing on. This is
 * the part the rest of the sim can feel: caution on a jump, willingness in a
 * fight, a hull that wears faster because nobody is working the backlog.
 */
export function applyMood(v) {
  const mood = moodOf(v);
  if (mood == null) return;
  v.mood = mood;
  /* a happy watch is a careful one; a sour watch cuts corners */
  v.crewCaution = clamp(0.25 + (mood / 100) * 0.55, 0.1, 0.9);
  v.crewFight = clamp((mood - 20) / 80, 0, 1);
  v.wear = clamp((v.wear ?? 0) + (mood < 45 ? 0.012 : -0.004), 0, 1);
  if ((v.wear ?? 0) > 0.75) v.hullPct = Math.max(20, (v.hullPct ?? 100) - 0.4);
  /* one short string the map and the SHIPS directory can read without
   * knowing anything about crews */
  v.crewTag = v.derelict ? "derelict"
    : v.mutinied ? "flying under its own crew"
    : v.strike ? "watch on strike"
    : mood < DESERT_AT ? `${v.crewList.length} aboard, sour`
    : (v.wear ?? 0) > 0.6 ? `${v.crewList.length} aboard, hull overdue`
    : `${v.crewList.length} aboard`;

  const docked = v.job === "docked" || v.job === "loading" || v.job === "berthed";

  if (mood < MUTINY_AT && v.role === "pirate" && !v.mutinied) {
    v.mutinied = true;
    v.role = "hauler";
    v.crewFight = 0.1;
    for (const m of v.crewList) { m.morale = Math.min(100, (m.morale ?? 40) + 25); promote(m, `Took part in the mutiny aboard ${v.name}`); }
    event(v, "mutiny", `${v.name} has put its own captain in the hold. The flag is down.`);
    return;
  }
  /* Strike, with hysteresis and a cooling-off period, so a watch on the edge
   * does not flicker on and off the board every cycle. */
  if (v.strikeCool > 0) v.strikeCool--;
  if (mood < STRIKE_AT && !v.strike && !v.strikeCool) {
    v.strike = true;
    v.strikeFor = 0;
    markVesselDown(v.id, sim.time ?? 0);
    event(v, "strike", `${v.name} is not answering the board — the watch has stopped working.`);
    return;
  }
  if (v.strike) {
    v.strikeFor = (v.strikeFor ?? 0) + 1;
    if (mood >= STRIKE_AT + 14) {
      v.strike = false;
      v.strikeCool = 6;
      event(v, "back", `${v.name} is back on its route.`);
    }
  }

  /* A hand walks at the next port — or, if the hull has been sitting off its
   * route long enough that there is no next port, on whatever shuttle is
   * going. Either way they end up in a hiring hall, and the hiring hall is
   * where you meet them. */
  const stranded = (v.strikeFor ?? 0) > 8 || (v.legsSince ?? 0) > 16;
  if (mood < DESERT_AT && (docked || stranded) && v.crewList.length === 1 && mood < 20) {
    const last = v.crewList[0];
    v.crewList.length = 0;
    npcCrews.people--;
    promote(last, `Last off ${v.name} — left it where it lay`);
    v.derelict = true;
    markVesselDown(v.id, (sim.time ?? 0) + 3600);
    event(v, "derelict", `${v.name} is a hulk. ${last.name} was the last one off.`);
    return;
  }
  if (mood < DESERT_AT && (docked || stranded) && v.crewList.length > 1) {
    const worst = v.crewList.reduce((a, b) => ((a.morale ?? 62) <= (b.morale ?? 62) ? a : b));
    v.crewList.splice(v.crewList.indexOf(worst), 1);
    npcCrews.people--;
    const where = v.toName || v.to || "a port";
    promote(worst, `Walked off ${v.name}${docked ? ` at ${where}` : " while it sat out a strike"}`);
    event(v, "desert", `${worst.name} has walked off ${v.name}. The hall at ${where} has ${worst.pronouns?.obj ?? "them"} now.`);
    v.strikeFor = 0;
  }
}

/* ---- the cheap model ------------------------------------------------------
 * For the hands not in this cycle's budget: the needs still rise, morale still
 * follows what the ship is like to be on, but nothing walks the graph. Over a
 * long run the two models agree on where a crew ends up; only the near ones
 * get a reason on file for how they got there.
 */
function drift(v) {
  const rough = (v.wear ?? 0) > 0.6 || (v.hullPct ?? 100) < 55;
  const paid = !v.payShort;
  for (const m of v.crewList) {
    const n = needsOf(m);
    for (const k of ["fatigue", "hunger", "social", "play", "purpose"]) n[k] = clamp(n[k] + 0.1 * (1 - n[k]), 0, 1);
    const target = (paid ? 68 : 34) - (rough ? 14 : 0) + ((m.traits?.loyalty ?? 0.5) - 0.5) * 20;
    m.morale = clamp((m.morale ?? 62) + (target - (m.morale ?? 62)) * 0.18, 1, 100);
    m.cyclesAboard = (m.cyclesAboard ?? 0) + 1;
    npcCrews.drifted++;
  }
}

/* ---- the cycle ------------------------------------------------------------ */

/** Vessels worth attention, nearest first, with the flow boats behind them. */
function candidates() {
  const list = [];
  for (const v of traffic) { if (v.visible !== false || v.crewList) list.push(v); }
  for (const v of flow) { if (v.crewList) list.push(v); }
  const p = sim.ship?.pos;
  if (!p) return list;
  return list
    .map((v) => ({ v, d: v.x == null ? Infinity : Math.hypot(v.x - p.x, v.y - p.y, v.z - p.z) }))
    .sort((a, b) => a.d - b.d)
    .map((e) => e.v);
}

/**
 * One cycle of deck life across the sky, inside the budget. Hooked onto the
 * same `crewHooks.cycle` the player's watch runs on, after it.
 */
export function tickNpcCrews() {
  if (!npcCrews.enabled) return npcCrews;
  const list = candidates();
  if (!list.length) return npcCrews;

  npcCrews.stepped = 0;
  npcCrews.drifted = 0;

  for (const v of list) if (v.crewList) readRun(v);

  /* build a few crews, nearest first, so the ships you can actually see are
   * the ones with people on them */
  let built = 0;
  for (const v of list) {
    if (built >= BUILD_BUDGET) break;
    if (v.crewList) continue;
    crewOf(v);
    built++;
  }

  /* spend the work budget round-robin, so nobody is permanently abstract */
  const withCrew = list.filter((v) => v.crewList?.length);
  if (!withCrew.length) return npcCrews;
  let spent = 0;
  const start = npcCrews.cursor % withCrew.length;
  const done = new Set();
  for (let i = 0; i < withCrew.length && spent < WORK_BUDGET; i++) {
    const v = withCrew[(start + i) % withCrew.length];
    const n = v.crewList.length;
    if (spent + n > WORK_BUDGET && spent > 0) continue;
    stepWatch(v.crewList, vesselHull(v));
    spent += n;
    npcCrews.stepped += n;
    done.add(v.id);
    npcCrews.cursor = (start + i + 1) % withCrew.length;
  }
  for (const v of withCrew) if (!done.has(v.id)) drift(v);
  for (const v of withCrew) applyMood(v);

  return npcCrews;
}

/** [{ name, role, mood, crew, wear }] — the SHIPS directory's crew column. */
export function crewCensus(list = traffic) {
  return list
    .filter((v) => v.crewList?.length)
    .map((v) => ({ id: v.id, name: v.name, role: v.role, mood: v.mood ?? moodOf(v), crew: v.crewList.length, wear: Math.round((v.wear ?? 0) * 100), strike: Boolean(v.strike), mutinied: Boolean(v.mutinied) }));
}

/** The decision records filed for one vessel's watch this session. */
export function vesselJournal(v, n = 12) {
  const ids = new Set((v.crewList ?? []).map((m) => m.id));
  return journal.all().filter((r) => ids.has(r.agent.id)).slice(-n).reverse();
}

/** Drop every provisional crew — a new sky is new people. */
export function resetNpcCrews() {
  for (const v of [...traffic, ...flow]) {
    if (v.crewList) for (const m of v.crewList) forgetBody(m.id);
    delete v.crewList;
    delete v._hull;
    delete v.mood;
    delete v.strike;
    delete v.strikeFor;
    delete v.strikeCool;
    delete v.mutinied;
    delete v.payShort;
    delete v.underAttack;
    delete v.crewTag;
    delete v.derelict;
    delete v.legsSince;
  }
  npcCrews.built = 0;
  npcCrews.people = 0;
  npcCrews.stepped = 0;
  npcCrews.drifted = 0;
  npcCrews.events.length = 0;
  npcCrews.cursor = 0;
  pool = 0;
}

/* Its own clock, on `always`, so the sky keeps its crews whether or not the
 * player has a single hand aboard. The pool is the same 90-second cycle the
 * payroll runs on, so a watch out there and a watch in here are the same
 * length of time. */
let pool = 0;
export function tickSky(seconds) {
  if (!npcCrews.enabled) return;
  pool += Math.max(0, Math.min(600, Number(seconds) || 0));
  let guard = 0;
  while (pool >= CYCLE_SECONDS && guard++ < 4) { pool -= CYCLE_SECONDS; tickNpcCrews(); }
  if (pool > CYCLE_SECONDS * 4) pool = 0;   /* a long pause is not four hundred watches */
}

if (!crewHooks.always.includes(tickSky)) crewHooks.always.push(tickSky);
if (!crewHooks.reset.includes(resetNpcCrews)) crewHooks.reset.push(resetNpcCrews);
