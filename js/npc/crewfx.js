/* LIVING GALAXY experimental — the crew trims the hull.
 *
 * The deck plan already knows where everyone works. This turns that into
 * numbers: a hand at their station during their shift multiplies into
 * `ship.mods` through the same bag race and specialisation use, scaled by
 * morale (a sour hand at a console is barely a hand). The rota is the deck's
 * — station → mess → quarters, 270 s a phase — so the trim breathes with the
 * watch: the night shift is real.
 *
 * An empty Engineering while anyone at all is on the payroll is a penalty,
 * not a zero — clamps and coolant do not tend themselves.
 *
 * What a manned station does (at 100 morale):
 *   eng        warp ×0.90, hull ×1.05
 *   sensor     scan ×1.10, lock ×1.06
 *   sec        turret ×1.10, menace ×0.92
 *   med        life ×0.90
 *   cargo      cargo ×1.06
 *   office     sell ×1.03, buy ×0.97
 *   bridge     lock ×1.05
 *   the hull's own industry, manned by its own trade:
 *              mine ×1.12 (extraction hulls) or sell ×1.04 (the rest)
 *   agri/lab   life ×0.95 / scan ×1.04
 *
 * Robots (m.robot) stand every watch at 0.5 + condition/200 and drop out when
 * idle; bonds.bondFactor scales a hand by who shares the post; duties.js runs
 * the wear model and its bag is multiplied in before setCrewMods.
 */

import { crew } from "../crew.js";
import { hullPlan, stationRoomFor } from "../interior/deckplan.js";
import { shipById } from "../shipdb.js";
import { setCrewMods } from "../pilot.js";
import { MOD_KEYS, defaultMods } from "../careers/effects.js";
import { bondFactor } from "../crew/bonds.js";
import { duties, tickDuties, dutyBag } from "../crew/duties.js";

export const ROTA = 270; // keep in step with interior.js

function hash(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (Math.imul(h, 31) + String(s).charCodeAt(i)) | 0;
  return h;
}

/** Which shift phase a member is in at `time`: 0 station, 1 mess, 2 quarters. Deterministic — the deck's walkers use it too. */
export function shiftPhase(memberId, time) {
  const offset = (Math.abs(hash(memberId)) % (ROTA * 3));
  return Math.floor(((time + offset) / ROTA) % 3);
}

/* station-kind → effect at full morale */
const STATION_FX = {
  eng: { warp: 0.9, hull: 1.05 },
  sensor: { scan: 1.1, lock: 1.06 },
  sec: { turret: 1.1, menace: 0.92 },
  med: { life: 0.9 },
  cargo: { cargo: 1.06 },
  office: { sell: 1.03, buy: 0.97 },
  bridge: { lock: 1.05 },
  agri: { life: 0.95 },
  lab: { scan: 1.04 },
};
const EXTRACTION = new Set(["mining", "salvage", "agriculture"]);
const UNMANNED_ENG = { warp: 1.1, hull: 0.96 };

let planCache = { key: "", plan: null };
let lastBag = null;
let lastAt = -1;

/** How much of a hand is at the console: morale for people, condition for machines. 0.5 … 1.0 */
function strengthOf(m) {
  const v = m.robot ? (m.condition ?? 100) : (m.morale ?? 70);
  return 0.5 + Math.max(0, Math.min(100, v)) / 200;
}

/**
 * The composed crew bag, plus a manning report for the deck rail. Cached ~2 s.
 * Two passes: first collect who is at which post (kind → first names, and
 * kind → ids for bonds.bondFactor), then price each hand knowing who stands
 * beside them — a friend on the same watch is worth more, a rival less.
 */
export function crewEffects(hullId, seed, time) {
  if (time === lastAt && lastBag) return lastBag;
  lastAt = time;
  const key = `${hullId}:${seed}`;
  if (planCache.key !== key) planCache = { key, plan: hullPlan(shipById(hullId) ?? shipById("general_b"), seed || "sol") };
  const plan = planCache.plan;
  const bag = defaultMods();
  const manned = new Map();    // kind → [first names]
  const mannedIds = new Map(); // kind → [member ids]
  const posts = [];
  for (const m of crew.aboard) {
    if (m.idle) continue;                                   // a robot below service condition
    if (!m.robot && shiftPhase(m.id, time) !== 0) continue; // machines stand every watch
    const room = stationRoomFor(plan, m);
    /* an industrial room still IS its kind — a manned Reactor Hall is a manned Engineering */
    const kind = STATION_FX[room.kind] ? room.kind : room.industrial ? "industry" : room.kind;
    if (!manned.has(kind)) { manned.set(kind, []); mannedIds.set(kind, []); }
    manned.get(kind).push(m.name.split(" ")[0]);
    mannedIds.get(kind).push(m.id);
    posts.push({ m, room });
  }
  for (const { m, room } of posts) {
    const strength = strengthOf(m) * bondFactor(m, mannedIds);
    const fx = { ...(STATION_FX[room.kind] ?? {}) };
    if (room.industrial) {
      const bonus = EXTRACTION.has(plan.complex) ? { mine: 1.12 } : { sell: 1.04 };
      for (const [k, v] of Object.entries(bonus)) fx[k] = (fx[k] ?? 1) * v;
    }
    for (const [k, v] of Object.entries(fx)) {
      if (!MOD_KEYS.includes(k)) continue;
      bag[k] *= 1 + (v - 1) * strength;
    }
  }
  /* nobody minding the reactor while a crew is aboard */
  if (crew.aboard.length > 0 && !manned.has("eng") && plan.rooms.some((r) => r.kind === "eng")) {
    for (const [k, v] of Object.entries(UNMANNED_ENG)) bag[k] *= v;
  }
  lastBag = { bag, manned, mannedIds, plan };
  return lastBag;
}

/**
 * Called from the sim's career step (~every 2 s). Runs the duty model, then
 * pushes the crew bag × the duty bag into pilot.mods via pilot.setCrewMods.
 */
export function updateCrewMods(hullId, seed, time) {
  const { bag } = crewEffects(hullId, seed, time);
  const dt = duties.lastAt < 0 ? 0 : Math.max(0, time - duties.lastAt);
  tickDuties(dt, time);
  const out = { ...bag };
  for (const [k, v] of Object.entries(dutyBag())) if (k in out) out[k] *= v;
  setCrewMods(out);
}
