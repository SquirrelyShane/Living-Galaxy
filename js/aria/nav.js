/* LIVING GALAXY — ARIA navigating the way a pilot does.
 *
 * 0.3.25. The bot used to hand a destination to the mission executor and hope.
 * That works right up until the leg is one the core will not take: a world
 * across the corridor, a well she is sitting inside, a port on the far side of
 * the star. The executor's own answer to those is to keep trying, which is why
 * a run could spend twenty minutes at "cruise · 387 km" and then get dropped
 * for being stuck.
 *
 * So she flies it the way you do:
 *
 *   1. LOCK the thing (selectBody — P-LOCK). The lock is what the warp core,
 *      the cutter and the turrets all read, so a bot that never locks is a bot
 *      whose guns are pointed at whatever happened to be nearest.
 *   2. MARK it on the chart, so a human watching the same sky can see where
 *      she thinks she is going.
 *   3. Check the corridor. A body inside `losMargin` radii of the line is a
 *      leg the core refuses; she picks a DOGLEG — a point out to the side of
 *      the blocker, far enough that both halves are clear — and flies two legs
 *      instead of failing one.
 *   4. Climb out of a well before spooling, which the autopilot already does,
 *      but which has to be in the TIME ESTIMATE or every job looks cheap.
 *
 * `legSeconds` is the honest cost of a leg: undock, climb, spool, the jump
 * itself at the sim's own rate, the sublight fall at the end, and the berth.
 * The old estimate divided distance by a flat cruise number and came out with
 * 3.6 seconds for a leg that takes four minutes, which is why she would take a
 * 400 km mining job over a job at the port she was standing in.
 */

import { sim, selectBody, addWaypointAt, losBlocker, wellEdge, warpNodeById, WARP, spoolTime } from "../sim.js";
import { BODIES, bodyPosition, dist3 } from "../bodies.js";
import { stationById } from "../stations.js";

export const NAV = {
  warpRate: 55000,     // u per second in the run, matching sim.js requestJump
  warpMin: 3,
  warpMax: 45,
  sublight: 2200,      // u/s: the honest average of a fall with braking room priced in
  climb: 1.25,         // seconds per 1000 u of well to get clear of before a jump
  undock: 18,          // clamps off, the push out, the lane
  berth: 42,           // the lane in, the gate, the tractor, the clamps
  legOverhead: 8,      // align, settle, the core's cooldown between hops
  clear: 1.25,         // a dogleg stands this many blocker-radii off the line
};

const _p = { x: 0, y: 0, z: 0 };
const _q = { x: 0, y: 0, z: 0 };

/** Where a thing is right now, whatever kind of thing it is. */
export function placeOf(target) {
  if (!target) return null;
  if (typeof target === "string") {
    const st = stationById(target);
    if (st) return { x: st.x, y: st.y, z: st.z, name: st.name, id: st.id, kind: "station" };
    /* bodyPosition answers for an id it has never heard of, so the register is
     * what decides whether a name is a place */
    const b = BODIES.find((x) => x.id === target);
    if (b && bodyPosition(target, sim.time, _p)) return { x: _p.x, y: _p.y, z: _p.z, name: b.name ?? target, id: target, kind: "body" };
    return null;
  }
  if (typeof target.x === "number") return { x: target.x, y: target.y, z: target.z, name: target.name ?? "the mark", id: target.id ?? null, kind: target.kind ?? "point" };
  return null;
}

/* ---- the corridor ------------------------------------------------------------------ */

/** The body sitting across a leg, or null. Same test the core uses. */
export function corridorBlocker(from, to, ignoreId = null) {
  return losBlocker(from, to, ignoreId);
}

/**
 * A point to fly to first so BOTH halves of the trip are clear of `b`.
 * Perpendicular to the leg, out past the blocker's own corridor margin.
 */
export function doglegAround(from, to, b) {
  if (!bodyPosition(b.id, sim.time, _p)) return null;
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const len = Math.hypot(dx, dy, dz) || 1;
  const ux = dx / len, uy = dy / len, uz = dz / len;
  /* the blocker's offset from the line, which is the direction to step away in */
  const rx = _p.x - from.x, ry = _p.y - from.y, rz = _p.z - from.z;
  const along = rx * ux + ry * uy + rz * uz;
  let ox = rx - along * ux, oy = ry - along * uy, oz = rz - along * uz;
  let on = Math.hypot(ox, oy, oz);
  if (on < 1) {
    /* dead ahead through the middle of it: step "up" out of the ecliptic */
    ox = -uz; oy = 0; oz = ux;
    on = Math.hypot(ox, oy, oz) || 1;
  }
  const stand = b.radius * WARP.losMargin * NAV.clear + b.radius;
  /* away from the body, not toward it */
  const s = -stand / on;
  for (const k of [1, 1.8, 3, 5]) {
    const q = { x: _p.x + ox * s * k, y: _p.y + oy * s * k, z: _p.z + oz * s * k, name: `clear of ${b.name}`, kind: "point" };
    if (!losBlocker(from, q, null) && !losBlocker(q, to, null)) return q;
  }
  return null;
}

/**
 * How to get from here to there.
 *   → { legs: [{ x, y, z, name, kind, id? }], blocked, why, secs }
 * One leg when the corridor is clear, two when something is across it, and
 * `blocked` when nothing clears it — which is an answer, not a failure: the
 * caller picks different work instead of flying at a planet for ten minutes.
 */
export function planRoute(to, from = sim.ship.pos) {
  const dest = placeOf(to);
  if (!dest) return { legs: [], blocked: true, why: "no such place", secs: 0 };
  const b = corridorBlocker(from, dest, dest.kind === "body" ? dest.id : null);
  if (!b) return { legs: [dest], blocked: false, why: "", secs: legSeconds(from, dest) };
  const mid = doglegAround(from, dest, b);
  if (!mid) return { legs: [], blocked: true, why: `${b.name} is across the corridor and there is no way round it from here`, secs: 0 };
  return { legs: [mid, dest], blocked: false, why: `round ${b.name}`, secs: legSeconds(from, mid) + legSeconds(mid, dest) };
}

/* ---- what a leg really costs -------------------------------------------------------- */

/** The well the hull has to climb out of before the core will hold, in units. */
export function climbOut(from = sim.ship.pos) {
  const dom = sim.dominant;
  if (!dom || dom.kind === "star") return 0;
  const edge = wellEdge(dom);
  return Math.max(0, edge - (sim.domDist ?? dist3(from, dom)));
}

/**
 * Seconds for one leg, honestly: the climb out of whatever is holding you, the
 * spool, the run at the sim's own rate, and the sublight fall at the far end.
 * `opts.undock` and `opts.berth` add a port call at either end.
 */
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
    /* short enough that the core is not worth spooling */
    s += d / NAV.sublight;
    return Math.round(s);
  }
  s += climbOut(a) / 1000 * NAV.climb;
  s += spoolTime ? spoolTime() : WARP.spool;
  /* the jump lands short of the mark and the rest is flown */
  const fall = Math.min(d * 0.12, 18000);
  s += Math.max(NAV.warpMin, Math.min(NAV.warpMax, (d - fall) / NAV.warpRate));
  s += fall / NAV.sublight;
  return Math.round(s);
}

/** A whole trip, port call included. */
export function tripSeconds(to, from = sim.ship.pos, opts = {}) {
  const r = planRoute(to, from);
  if (r.blocked) return Infinity;
  let s = 0, p = from;
  for (const leg of r.legs) { s += legSeconds(p, leg, { undock: p === from && opts.undock, berth: false }); p = leg; }
  return s + (opts.berth ? NAV.berth : 0);
}

/* ---- the instruments ----------------------------------------------------------------- */

/** P-LOCK: the core, the cutter and the turrets all read this. */
export function lockOn(id) {
  if (!id) return false;
  selectBody(id);
  return sim.selected === id;
}

/** Put it on the chart, so a human in the same sky can see where she is going. */
export function markPlace(name, p) {
  const q = placeOf(p);
  if (!q) return null;
  return addWaypointAt(name ?? q.name ?? "ARIA", q.x, q.y, q.z);
}

/** Lock what can be locked and mark the rest — what a pilot does before a leg. */
export function aimAt(target, label = null) {
  const q = placeOf(target);
  if (!q) return null;
  if (q.id && warpNodeById(q.id)) lockOn(q.id);
  else markPlace(label ?? q.name, q);
  return q;
}

/** For a screen: "round Jupiter, 2 legs, ~4 min". */
export function routeLine(r) {
  if (!r || r.blocked) return r?.why ? `blocked — ${r.why}` : "blocked";
  return `${r.legs.length} leg${r.legs.length === 1 ? "" : "s"}${r.why ? ` (${r.why})` : ""} · ~${Math.max(1, Math.round(r.secs / 60))} min`;
}

void _q;
