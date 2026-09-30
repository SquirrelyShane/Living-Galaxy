import { sim, selectBody, addWaypointAt, losBlocker, wellEdge, warpNodeById, WARP, spoolTime } from "../sim/sim.js";
import { BODIES, bodyPosition, dist3 } from "../world/bodies.js";
import { stationById } from "../station/stations.js";

export const NAV = {
  warpRate: 55000,
  warpMin: 3,
  warpMax: 45,
  sublight: 2200,
  climb: 1.25,
  undock: 18,
  berth: 42,
  legOverhead: 8,
  clear: 1.25,
};

const _p = { x: 0, y: 0, z: 0 };
const _q = { x: 0, y: 0, z: 0 };

export function placeOf(target) {
  if (!target) return null;
  if (typeof target === "string") {
    const st = stationById(target);
    if (st) return { x: st.x, y: st.y, z: st.z, name: st.name, id: st.id, kind: "station" };
    const b = BODIES.find((x) => x.id === target);
    if (b && bodyPosition(target, sim.time, _p)) return { x: _p.x, y: _p.y, z: _p.z, name: b.name ?? target, id: target, kind: "body" };
    return null;
  }
  if (typeof target.x === "number") return { x: target.x, y: target.y, z: target.z, name: target.name ?? "the mark", id: target.id ?? null, kind: target.kind ?? "point" };
  return null;
}

export function corridorBlocker(from, to, ignoreId = null) {
  return losBlocker(from, to, ignoreId);
}

export function doglegAround(from, to, b) {
  if (!bodyPosition(b.id, sim.time, _p)) return null;
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const len = Math.hypot(dx, dy, dz) || 1;
  const ux = dx / len, uy = dy / len, uz = dz / len;
  const rx = _p.x - from.x, ry = _p.y - from.y, rz = _p.z - from.z;
  const along = rx * ux + ry * uy + rz * uz;
  let ox = rx - along * ux, oy = ry - along * uy, oz = rz - along * uz;
  let on = Math.hypot(ox, oy, oz);
  if (on < 1) {
    ox = -uz; oy = 0; oz = ux;
    on = Math.hypot(ox, oy, oz) || 1;
  }
  const stand = b.radius * WARP.losMargin * NAV.clear + b.radius;
  const s = -stand / on;
  for (const k of [1, 1.8, 3, 5]) {
    const q = { x: _p.x + ox * s * k, y: _p.y + oy * s * k, z: _p.z + oz * s * k, name: `clear of ${b.name}`, kind: "point" };
    if (!losBlocker(from, q, null) && !losBlocker(q, to, null)) return q;
  }
  return null;
}

export function planRoute(to, from = sim.ship.pos) {
  const dest = placeOf(to);
  if (!dest) return { legs: [], blocked: true, why: "no such place", secs: 0 };
  const b = corridorBlocker(from, dest, dest.kind === "body" ? dest.id : null);
  if (!b) return { legs: [dest], blocked: false, why: "", secs: legSeconds(from, dest) };
  const mid = doglegAround(from, dest, b);
  if (!mid) return { legs: [], blocked: true, why: `${b.name} is across the corridor and there is no way round it from here`, secs: 0 };
  return { legs: [mid, dest], blocked: false, why: `round ${b.name}`, secs: legSeconds(from, mid) + legSeconds(mid, dest) };
}

export function climbOut(from = sim.ship.pos) {
  const dom = sim.dominant;
  if (!dom || dom.kind === "star") return 0;
  const edge = wellEdge(dom);
  return Math.max(0, edge - (sim.domDist ?? dist3(from, dom)));
}

export function legSeconds(from, to, opts = {}) {
  const a = placeOf(from) ?? from;
  const b = placeOf(to);
  if (!a || !b) return 0;
  const d = dist3(a, b);
  if (d < 1) return 0;
  let s = NAV.legOverhead;
  if (opts.undock) s += NAV.undock;
  if (opts.berth) s += NAV.berth;
  if (d < 25000) {
    s += d / NAV.sublight;
    return Math.round(s);
  }
  s += climbOut(a) / 1000 * NAV.climb;
  s += spoolTime ? spoolTime() : WARP.spool;
  const fall = Math.min(d * 0.12, 18000);
  s += Math.max(NAV.warpMin, Math.min(NAV.warpMax, (d - fall) / NAV.warpRate));
  s += fall / NAV.sublight;
  return Math.round(s);
}

export function tripSeconds(to, from = sim.ship.pos, opts = {}) {
  const r = planRoute(to, from);
  if (r.blocked) return Infinity;
  let s = 0, p = from;
  for (const leg of r.legs) { s += legSeconds(p, leg, { undock: p === from && opts.undock, berth: false }); p = leg; }
  return s + (opts.berth ? NAV.berth : 0);
}

export function lockOn(id) {
  if (!id) return false;
  selectBody(id);
  return sim.selected === id;
}

export function markPlace(name, p) {
  const q = placeOf(p);
  if (!q) return null;
  return addWaypointAt(name ?? q.name ?? "ARIA", q.x, q.y, q.z);
}

export function aimAt(target, label = null) {
  const q = placeOf(target);
  if (!q) return null;
  if (q.id && warpNodeById(q.id)) lockOn(q.id);
  else markPlace(label ?? q.name, q);
  return q;
}

export function routeLine(r) {
  if (!r || r.blocked) return r?.why ? `blocked — ${r.why}` : "blocked";
  return `${r.legs.length} leg${r.legs.length === 1 ? "" : "s"}${r.why ? ` (${r.why})` : ""} · ~${Math.max(1, Math.round(r.secs / 60))} min`;
}

void _q;
