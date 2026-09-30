import { crew } from "../crew/ledger.js";
import { hullPlan, stationRoomFor } from "../interior/deckplan.js";
import { shipById } from "../ships/shipdb.js";
import { setCrewMods } from "../flight/pilot.js";
import { MOD_KEYS, defaultMods } from "../careers/effects.js";
import { bondFactor } from "../crew/bonds.js";
import { duties, tickDuties, dutyBag } from "../crew/duties.js";

export const ROTA = 270;

function hash(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (Math.imul(h, 31) + String(s).charCodeAt(i)) | 0;
  return h;
}

export function shiftPhase(memberId, time) {
  const offset = (Math.abs(hash(memberId)) % (ROTA * 3));
  return Math.floor(((time + offset) / ROTA) % 3);
}

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

function strengthOf(m) {
  const v = m.robot ? (m.condition ?? 100) : (m.morale ?? 70);
  return 0.5 + Math.max(0, Math.min(100, v)) / 200;
}

export function crewEffects(hullId, seed, time) {
  if (time === lastAt && lastBag) return lastBag;
  lastAt = time;
  const key = `${hullId}:${seed}`;
  if (planCache.key !== key) planCache = { key, plan: hullPlan(shipById(hullId) ?? shipById("general_b"), seed || "sol") };
  const plan = planCache.plan;
  const bag = defaultMods();
  const manned = new Map();
  const mannedIds = new Map();
  const posts = [];
  for (const m of crew.aboard) {
    if (m.idle) continue;
    if (!m.robot && shiftPhase(m.id, time) !== 0) continue;
    const room = stationRoomFor(plan, m);
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
  if (crew.aboard.length > 0 && !manned.has("eng") && plan.rooms.some((r) => r.kind === "eng")) {
    for (const [k, v] of Object.entries(UNMANNED_ENG)) bag[k] *= v;
  }
  lastBag = { bag, manned, mannedIds, plan };
  return lastBag;
}

export function updateCrewMods(hullId, seed, time) {
  const { bag } = crewEffects(hullId, seed, time);
  const dt = duties.lastAt < 0 ? 0 : Math.max(0, time - duties.lastAt);
  tickDuties(dt, time);
  const out = { ...bag };
  for (const [k, v] of Object.entries(dutyBag())) if (k in out) out[k] *= v;
  setCrewMods(out);
}
