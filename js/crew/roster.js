import { crew } from "./ledger.js";
import { sim, currentShipId } from "../sim/sim.js";
import { shipById } from "../ships/shipdb.js";
import { hullPlan, stationRoomFor } from "../interior/deckplan.js";
import { shiftPhase } from "../npc/crewfx.js";
import { cradle } from "../npc/cradle.js";
import { tiesOf } from "./bonds.js";
import { trustOf } from "./family.js";

export const ROSTER_SORTS = ["name", "career", "station", "morale", "trust", "wage", "kind"];
export const ROSTER_FILTERS = ["all", "human", "robot", "on", "off", "unsettled"];

export const KIND_LABEL = {
  eng: "Engineering", sensor: "Sensors", sec: "Security", med: "Medbay", cargo: "Cargo", office: "Office",
  bridge: "Bridge", agri: "Agri", lab: "Lab", works: "Works", industry: "Works",
};
const NOT_A_POST = new Set(["quarters", "mess", "airlock", "captain", "brig"]);

let planCache = { key: "", plan: null };

export function currentPlan() {
  const id = currentShipId?.() ?? "general_b";
  const seed = sim.callsign || "sol";
  const key = `${id}:${seed}`;
  if (planCache.key !== key || !planCache.plan) planCache = { key, plan: hullPlan(shipById(id) ?? shipById("general_b"), seed) };
  return planCache.plan;
}

export function dutyOf(m, plan = currentPlan()) {
  if (!m || !plan) return null;
  return stationRoomFor(plan, m);
}

export function postKind(room) {
  if (!room) return null;
  return room.industrial && !KIND_LABEL[room.kind] ? "industry" : room.kind;
}

export function dutyOptions(plan = currentPlan()) {
  const seen = new Map();
  for (const r of plan?.rooms ?? []) {
    if (NOT_A_POST.has(r.kind) || seen.has(r.kind)) continue;
    seen.set(r.kind, { kind: r.kind, label: KIND_LABEL[r.kind] ?? r.name });
  }
  return [...seen.values()];
}

export function setDuty(memberId, roomKind = null) {
  const m = crew.aboard.find((x) => x.id === memberId);
  if (!m) return "Not aboard";
  if (roomKind && !dutyOptions().some((o) => o.kind === roomKind)) return `No ${KIND_LABEL[roomKind] ?? roomKind} on this hull`;
  m.duty = roomKind || null;
  const rec = cradle.get(m.id);
  if (rec) { rec.duty = m.duty; cradle.put(rec); }
  return null;
}

function unsettled(m) {
  if (m.robot) return (m.condition ?? 100) < 30 || Boolean(m.idle);
  return (m.morale ?? 70) < 40 || trustOf(m) < 20;
}

function normFilter(filter) {
  if (typeof filter === "string") {
    return { kind: filter === "human" || filter === "robot" ? filter : "all", shift: filter === "on" || filter === "off" ? filter : null, unsettled: filter === "unsettled" };
  }
  return { kind: filter?.kind ?? "all", shift: filter?.shift ?? null, unsettled: Boolean(filter?.unsettled) };
}

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const SORTERS = {
  name: (a, b) => cmp(a.m.name, b.m.name),
  career: (a, b) => cmp(a.m.complexName ?? "", b.m.complexName ?? "") || cmp(a.m.letter ?? "", b.m.letter ?? ""),
  station: (a, b) => cmp(a.station?.name ?? "", b.station?.name ?? "") || a.phase - b.phase,
  morale: (a, b) => (b.robot ? b.m.condition ?? 100 : b.m.morale) - (a.robot ? a.m.condition ?? 100 : a.m.morale),
  trust: (a, b) => trustOf(b.m) - trustOf(a.m),
  wage: (a, b) => (b.robot ? 0 : b.m.wage) - (a.robot ? 0 : a.m.wage),
  kind: (a, b) => Number(a.robot) - Number(b.robot),
};

export function roster({ sort = "name", filter = {}, time = sim.time ?? 0 } = {}) {
  const plan = currentPlan();
  const f = normFilter(filter);
  const rows = [];
  for (const m of crew.aboard) {
    const robot = Boolean(m.robot);
    if (f.kind === "human" && robot) continue;
    if (f.kind === "robot" && !robot) continue;
    const phase = robot ? 0 : shiftPhase(m.id, time);
    if (f.shift === "on" && phase !== 0) continue;
    if (f.shift === "off" && phase === 0) continue;
    if (f.unsettled && !unsettled(m)) continue;
    const station = dutyOf(m, plan);
    rows.push({ m, station, phase, duty: m.duty ? station : null, ties: tiesOf(m), robot });
  }
  const sorter = SORTERS[sort] ?? SORTERS.name;
  rows.sort((a, b) => sorter(a, b) || cmp(a.m.name, b.m.name) || cmp(a.m.id, b.m.id));
  return rows;
}

export const PHASE_LABEL = ["on watch", "mess", "quarters"];
