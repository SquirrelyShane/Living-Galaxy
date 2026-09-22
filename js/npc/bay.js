/* LIVING GALAXY — the hangar bay, flown.
 *
 * 0.3.15. Until now the only hull that ever flew INSIDE a hangar was yours:
 * the tractor pulls you in by the entry door to the clamps and pushes you out
 * by the exit door (stationworks.js). Everything else — the named captains,
 * the port's flow boats, work drones, corporate drones — vanished at the
 * mouth (or at 1.2 station radii) and reappeared at the station's centre
 * when it left. To hide that, the station generator dressed every bay with
 * box "shuttles" on a loop, a parked box "tug" and little sortie drones in
 * the drone bays: scenery pretending to be traffic.
 *
 * The scenery is gone (stationgen/builder/hangar.js, prefabs/modules.js) and
 * this is what replaces it: one path through the bay, in the same frame the
 * tractor uses (st.hangars[0] — the port frame the lanes grow from), that
 * every real hull flies at the end of an arrival and the start of a
 * departure.
 *
 *   in   entry door → inside the bay on the arrivals half → the arrivals clamps
 *   out  the departures clamps → inside the bay on the departures half → exit door
 *
 * Each lane-way (0..2) gets its own line through the bay, spread across its
 * half of the aperture, so three boats arriving together do not stack. The
 * path ends on the doors the lanes start from (lanePoint(st, which, 0, k)),
 * so a hull leaving the bay is already ON its lane-way and one arriving by
 * its lane-way is already at the start of its bay line — no pop either side.
 *
 * Pure data, no three.js. A port with no built hangar (test fixtures) has no
 * bay: callers keep the old behaviour there.
 */

import { lanePoint, SUBLANES } from "./lanes.js";

export const BAY_IN_S = 9;       // entry door to the clamps
export const BAY_OUT_S = 7;      // the clamps to the exit door

export function hasBay(st) {
  return !!(st && st.port && st.port.berth && st.port.back && st.port.dir);
}

const _p = { x: 0, y: 0, z: 0 };

/* the three station-local control points of the path for lane-way k */
function controls(st, which, k, P) {
  const m = st.port;
  const kk = k == null ? (SUBLANES - 1) / 2 : k;
  const spread = (kk - (SUBLANES - 1) / 2) * (m.wayGap ?? 2) * 0.55;
  const q = (m.w ?? 15) / 4;
  /* the door: the lane's own mouth point on this way (world → station-local) */
  lanePoint(st, which === "in" ? "entry" : "exit", 0, _p, kk);
  const door = { x: _p.x - st.x, y: _p.y - st.y, z: _p.z - st.z };
  /* the clamps: the arrivals set on the port half, the departures set mirrored onto the starboard half */
  const sgn = which === "in" ? -1 : 1;
  const clamp = {
    x: m.back.x + m.side.x * (q * 0.5 * sgn + spread * 0.5),
    y: m.back.y + m.side.y * (q * 0.5 * sgn + spread * 0.5),
    z: m.back.z + m.side.z * (q * 0.5 * sgn + spread * 0.5),
  };
  /* a point a third of the way into the bay, on the door's line: the hull comes in straight, then drifts to the clamps */
  const depth = (m.d ?? 20) * 0.35;
  const mid = { x: door.x - m.dir.x * depth, y: door.y - m.dir.y * depth, z: door.z - m.dir.z * depth };
  if (which === "in") { P[0] = door; P[1] = mid; P[2] = clamp; }
  else { P[0] = clamp; P[1] = mid; P[2] = door; }
  return P;
}

const smooth = (s) => s * s * (3 - 2 * s);
const smoothD = (s) => 6 * s * (1 - s);
const _P = [null, null, null];

/**
 * Where a hull is on its bay path. `which` is "in" | "out", `s` 0..1 of the
 * transit, `k` its lane-way. Writes world x/y/z, the world velocity (the
 * port's own velocity plus the path's), and yaw/pitch facing the motion, into
 * `out`. The path is eased at both ends: a hull drifts off the clamps and
 * settles onto them.
 */
export function bayPose(st, which, s, k, out = {}, off = null) {
  controls(st, which, k, _P);
  const [A, B, C] = _P;
  const u = Math.max(0, Math.min(1, s));
  const L1 = Math.hypot(B.x - A.x, B.y - A.y, B.z - A.z), L2 = Math.hypot(C.x - B.x, C.y - B.y, C.z - B.z);
  const L = Math.max(1e-6, L1 + L2);
  const e = smooth(u);
  const dist = e * L;
  let x, y, z, tx, ty, tz;
  if (dist <= L1) { const f = L1 > 0 ? dist / L1 : 1; x = A.x + (B.x - A.x) * f; y = A.y + (B.y - A.y) * f; z = A.z + (B.z - A.z) * f; tx = B.x - A.x; ty = B.y - A.y; tz = B.z - A.z; }
  else { const f = L2 > 0 ? (dist - L1) / L2 : 1; x = B.x + (C.x - B.x) * f; y = B.y + (C.y - B.y) * f; z = B.z + (C.z - B.z) * f; tx = C.x - B.x; ty = C.y - B.y; tz = C.z - B.z; }
  const tl = Math.hypot(tx, ty, tz) || 1;
  tx /= tl; ty /= tl; tz /= tl;
  const T = which === "in" ? BAY_IN_S : BAY_OUT_S;
  const sp = (smoothD(u) * L) / T;
  out.x = st.x + x; out.y = st.y + y; out.z = st.z + z;
  /* a hull that reached the door a little off its line (a coarse tick, the
   * capture radius) starts from where it actually is and blends onto the
   * path over the first stretch — no snap */
  if (off) { const w = 1 - smooth(Math.min(1, u / 0.4)); out.x += off.x * w; out.y += off.y * w; out.z += off.z * w; }
  out.vx = (st.vx ?? 0) + tx * sp; out.vy = (st.vy ?? 0) + ty * sp; out.vz = (st.vz ?? 0) + tz * sp;
  out.speed = sp;
  /* face the way the hull is going; on the clamps (sp → 0) keep facing along the path, nose to the door on the way out */
  out.yaw = Math.atan2(-tx, -tz);
  out.pitch = Math.atan2(ty, Math.hypot(tx, tz)) * 0.7;
  return out;
}

/** Where the bay path starts relative to `p`: the blend offset for a run beginning at `p` (see bayPose). */
export function bayOffset(st, which, k, p) {
  const o = bayPose(st, which, 0, k, {});
  return { x: p.x - o.x, y: p.y - o.y, z: p.z - o.z };
}

/** The world point a hull aims for to start its bay run in: the entry door on its lane-way. */
export function entryDoor(st, k, out = {}) {
  return lanePoint(st, "entry", 0, out, k == null ? (SUBLANES - 1) / 2 : k);
}

/** Is a world point inside the hangar (behind the aperture plane and within its box)? */
export function insideBay(st, p) {
  if (!hasBay(st)) return false;
  const m = st.port;
  const px = p.x - st.x - m.x, py = p.y - st.y - m.y, pz = p.z - st.z - m.z;
  const along = px * m.dir.x + py * m.dir.y + pz * m.dir.z;
  const lat = px * m.side.x + py * m.side.y + pz * m.side.z;
  const vert = px * m.up.x + py * m.up.y + pz * m.up.z;
  return along <= 0.5 && along >= -(m.d ?? 20) * 1.05 && Math.abs(lat) <= (m.w ?? 15) * 0.55 && Math.abs(vert) <= (m.h ?? 10) * 0.7;
}

/* ---- drones --------------------------------------------------------------
 * Work drones (drones/ops.js) and corporate drones (drones/npcdrones.js)
 * dock by the same doors. A drone's transit rides on the unit as
 * `u.bay = { which, s, st }` while it is filed as docked (so every rule
 * about a docked drone — stash, repair, recall — still applies the moment it
 * reaches the door); the renderer draws a docked drone only while it has one.
 */
const _dp = {};

/** The goal a homing drone flies to: its port's entry door, moving with the port. */
export function droneDoorGoal(st, u, out = {}) {
  if (!hasBay(st)) { out.x = st.x; out.y = st.y; out.z = st.z; out.vx = st.vx ?? 0; out.vy = st.vy ?? 0; out.vz = st.vz ?? 0; out.r = (st.radius ?? 100) * 1.2; return out; }
  entryDoor(st, droneWay(u), out);
  out.vx = st.vx ?? 0; out.vy = st.vy ?? 0; out.vz = st.vz ?? 0;
  /* the port moves between one sim step and the next; the capture ring covers that, and bayOffset blends the rest */
  out.r = 6 + Math.hypot(out.vx, out.vy, out.vz) * 0.6;
  return out;
}

export function droneWay(u) {
  let n = 0;
  const s = String(u.id ?? "");
  for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0;
  return n % SUBLANES;
}

/** Start a drone's run through the bay: "in" on docking, "out" on leaving. False if the port has no bay. */
export function startDroneBay(u, st, which) {
  if (!hasBay(st)) { u.bay = null; return false; }
  u.bay = { which, s: 0, st: st.id, off: bayOffset(st, which, droneWay(u), u) };
  poseDrone(u, st);
  return true;
}

/** Advance a drone's bay run. Returns true while the run is still going. */
export function stepDroneBay(u, st, dt) {
  const b = u.bay;
  if (!b) return false;
  if (!st || !hasBay(st)) { u.bay = null; return false; }
  /* drones are small and quick: two thirds of a hull's time */
  b.s = Math.min(1, b.s + dt / ((b.which === "in" ? BAY_IN_S : BAY_OUT_S) * 0.66));
  poseDrone(u, st);
  if (b.s >= 1) { u.bay = null; return false; }
  return true;
}

function poseDrone(u, st) {
  bayPose(st, u.bay.which, u.bay.s, droneWay(u), _dp, u.bay.off);
  u.x = _dp.x; u.y = _dp.y; u.z = _dp.z;
  u.yaw = _dp.yaw; u.pitch = _dp.pitch;
}
