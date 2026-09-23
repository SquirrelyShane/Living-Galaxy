/* LIVING GALAXY — how an NPC hull actually flies.
 *
 * It used to not. A hull's position was a pure function of (seed, skyTime):
 * it burned 500 units out of the hangar mouth over 36 seconds, went
 * `visible:false` for the length of a warp lane, and reappeared 700 units
 * off the far port. That is why a supply ship popped up outside a station
 * and was gone again before you could turn toward it — it never went
 * anywhere. There was nothing in between to intercept.
 *
 * Now there is. A hull carries real velocity and real thrust, and a leg
 * between two ports is flown: a burn out of the exit lane, a long cruise
 * across open space where anyone can come and meet it, and a braked
 * approach down the entry lane at the far end. It is on the board, and
 * shootable, for the whole crossing.
 *
 * The cost of that is the old determinism — `poseAt` was pure, so two
 * clients in a room agreed about every hull without anyone being in charge.
 * They no longer can, so the host holds the sky (worldsync.js) and mirrors
 * take its word for where a hull is. That is the trade the feature needs:
 * you cannot intercept something whose position is a closed-form function
 * of the clock, because nothing you do to it can change where it will be.
 *
 * ---- the speed question -------------------------------------------------
 *
 * A leg between two inner ports is 40,000 units. A leg between two worlds in
 * Sol is four MILLION. Flown at one speed, either the short hops take all day
 * or the long ones are over before you see them — and a hull that crosses
 * four million units under thrust alone spends ten minutes doing it, which
 * starves every port it was carrying for.
 *
 * So a long leg is flown in three parts, the same way the player flies one:
 *
 *   RUN-OUT    sublight, out of the lane and clear of the port. Real minutes
 *              at a speed you can match, right where the traffic is thickest.
 *              This is where a supply run is most easily taken.
 *   LANE       the drive lit. Fast — faster than you can chase — but NOT
 *              gone: the hull stays on the board the whole way, with its name
 *              and its light, because a contact you can see crossing the
 *              system is a contact you can warp ahead of and be waiting for.
 *   RUN-IN     the drive drops a long way short of the destination and the
 *              hull comes in sublight again, slow and heavy and committed.
 *
 * A leg shorter than LANE_MIN_U never lights the drive at all.
 *
 * Within a sublight part the speed is solved from a target crossing time. For
 * a trapezoidal profile (accelerate at `a`, hold `v`, brake at `a`) covering
 * distance `L` in time `T`:
 *
 *     T = v/a + L/v          →     v² − aTv + aL = 0
 *
 * and the smaller root is the one that spends most of the run at cruise
 * rather than most of it under thrust. If the discriminant is negative the
 * hull cannot cover L in T, and it flies bang-bang instead: accelerate to the
 * midpoint, brake from it, arriving as fast as it can.
 */

import { shipById } from "../shipdb.js";
import { POOL } from "../defence.js";

/* Sublight crossing-time band, seconds. */
export const CROSS_MIN = 42;
export const CROSS_MAX = 96;
const CROSS_PER_U = 1 / 620;        // seconds of crossing per unit of leg

/* The lane drive. A leg shorter than LANE_MIN_U is flown entirely sublight;
 * anything longer lights the drive for the middle of it, dropping back to
 * sublight RUN_IN_U short of the far end so the arrival is always something
 * you could have been waiting at. */
export const LANE_MIN_U = 60000;
export const RUN_OUT_U = 9000;      // sublight out of the port before the drive lights
export const RUN_IN_U = 16000;      // and the drive drops this far short of the destination
export const LANE_SPOOL_S = 8;      // seconds to light or shed the drive
const LANE_T_MIN = 15;              // the lane part of a leg takes this long at the least
const LANE_T_MAX = 75;              // and this long at the most
const LANE_PER_U = 1 / 60000;

/* Thrust bands by hull role. u/s². A laden hauler is a barge; a picket is not. */
const ACCEL = { trader: 62, hauler: 48, miner: 55, patrol: 96, security: 92, pirate: 104, supply: 52, rogue: 120 };
const TURN = { trader: 0.55, hauler: 0.40, miner: 0.50, patrol: 1.05, security: 1.0, pirate: 1.25, supply: 0.45, rogue: 1.6 };

/* Combat weight. Everything used to be hp 120 / shield 40 regardless of what
 * it was; a picket and a laden ore barge are not the same problem. */
/* Toughness per role, at the REFERENCE frame — `hullPerf` scales these by the
 * hull actually being flown. Every role that exists has an entry: `supply`
 * and `rogue` were in ACCEL and TURN above but not here, so both fell through
 * to DEFAULT_TOUGH and a nest drone was quietly as tough as a generic hull.
 * That is the same shape as the gun bug fixed in 0.3.35 — a default catching
 * things nobody remembered to list. */
const TOUGH = {
  trader:   { hp: 150, shield: 60,  radius: 7,  gun: { dmg: 5,  rate: 1.6, range: 780,  speed: 560 } },
  hauler:   { hp: 260, shield: 90,  radius: 10, gun: { dmg: 4,  rate: 2.2, range: 700,  speed: 540 } },
  supply:   { hp: 210, shield: 75,  radius: 9,  gun: { dmg: 4,  rate: 2.0, range: 720,  speed: 540 } },
  miner:    { hp: 190, shield: 50,  radius: 8,  gun: { dmg: 3,  rate: 2.4, range: 620,  speed: 520 } },
  patrol:   { hp: 220, shield: 130, radius: 6,  gun: { dmg: 10, rate: 0.9, range: 1250, speed: 820 } },
  security: { hp: 280, shield: 170, radius: 7,  gun: { dmg: 12, rate: 0.8, range: 1400, speed: 880 } },
  pirate:   { hp: 170, shield: 70,  radius: 6,  gun: { dmg: 8,  rate: 1.1, range: 1000, speed: 620 } },
  /* A nest drone is scrap welded round a gun: it dies easily and carries no
   * screen worth the name. The wave is the threat, not the unit. */
  rogue:    { hp: 90,  shield: 20,  radius: 5,  gun: { dmg: 3,  rate: 2.2, range: 1100, speed: 520 } },
};
const DEFAULT_TOUGH = { hp: 160, shield: 60, radius: 6, gun: { dmg: 6, rate: 1.4, range: 900, speed: 600 } };

/**
 * Flight and combat characteristics for a hull, off its role and its registry
 * entry. Mass moves thrust and toughness in opposite directions, which is the
 * whole reason a hauler is worth escorting and a picket is worth avoiding.
 */
/* The reference frame the TOUGH table is written against: a 60 t hull with a
 * 230 kW plant, which is the middle of the registry. */
const REF_MASS = 60, REF_KW = 230;

export function hullPerf(n) {
  const role = n.role ?? "trader";
  const stats = shipById(n.ship)?.stats ?? null;
  const massT = stats?.massT ?? 40;
  /* a 30 t courier and a 400 t barge should not share an acceleration */
  const massK = Math.max(0.45, Math.min(1.6, 60 / Math.max(12, massT)));
  const base = ACCEL[role] ?? 60;
  const t = TOUGH[role] ?? DEFAULT_TOUGH;

  /* HOW MUCH HULL THE FRAME IS WORTH.
   *
   * This was `clamp(massT / 60, 0.6, 2.4)` — linear, and clamped. Mass runs
   * from 9 t to 7,500 t across the registry, and that curve SATURATES AT
   * 144 t: a D-tier barge at 260 t, an E at 700, an F at 2,200 and a G at
   * 7,500 all came out at exactly 624 hp and 139 shield. Four tiers,
   * indistinguishable. The bottom was truncated too — a 12 t skiff and a 34 t
   * courier were both 156.
   *
   * It is the same power curve the player's pools use now (POOL.hullPow in
   * js/defence.js), off the same exponent, so both sides of a fight are
   * measured the same way. Spread across the registry: 4.0x before, and about
   * 8x after, against the player's 9.2x. */
  const bulk = (Math.max(4, massT) / REF_MASS) ** POOL.hullPow;
  /* and the screen comes off the plant, as the player's does */
  const plant = (Math.max(30, stats?.reactor ?? REF_KW) / REF_KW) ** POOL.shieldPow;
  return {
    accel: base * massK * (stats?.thrust ?? 1),
    turn: (TURN[role] ?? 0.6) * (stats?.turn ?? 1) * Math.max(0.5, massK),
    hp: Math.round(t.hp * bulk),
    shield: Math.round(t.shield * plant),
    radius: Math.max(4, Math.round(t.radius * Math.cbrt(bulk))),
    gun: { ...t.gun, mounts: stats?.turrets ?? (role === "security" || role === "patrol" || role === "pirate" ? 2 : 1) },
  };
}

/**
 * Sublight cruise speed for a run of length `L` at thrust `a`: the trapezoid
 * that covers it in the target crossing time, or the fastest bang-bang
 * profile if that time is out of reach.
 */
export function legCruise(L, a) {
  const T = Math.max(CROSS_MIN, Math.min(CROSS_MAX, L * CROSS_PER_U));
  const disc = a * a * T * T - 4 * a * L;
  if (disc <= 0) return Math.sqrt(a * L);        // cannot be done in T: go as fast as the distance allows
  const v = (a * T - Math.sqrt(disc)) / 2;
  return Math.max(40, Math.min(v, 2200));        // sublight has a ceiling; past it the drive is the answer
}

/** Does a leg of this length light the drive at all? */
export function usesLane(L) { return L > LANE_MIN_U; }

/**
 * The drive's cruise speed and the distance it covers, for a leg of length
 * `L`. The lane part is whatever is left after the two sublight runs.
 */
export function laneProfile(L) {
  const mid = Math.max(0, L - RUN_OUT_U - RUN_IN_U);
  if (mid <= 0) return { mid: 0, top: 0, time: 0 };
  const T = Math.max(LANE_T_MIN, Math.min(LANE_T_MAX, mid * LANE_PER_U));
  /* spool and shed are ramps, so the flat part carries the rest */
  const flat = Math.max(1, T - LANE_SPOOL_S);
  const top = mid / flat;
  return { mid, top, time: T, accel: top / LANE_SPOOL_S };
}

/** How long a leg of length `L` will take at thrust `a` — for the timetable. */
export function legTime(L, a) {
  if (!usesLane(L)) {
    const v = legCruise(L, a);
    return v / a + L / v;
  }
  const out = legCruise(RUN_OUT_U, a);
  const inn = legCruise(RUN_IN_U, a);
  const lane = laneProfile(L);
  return (out / a + RUN_OUT_U / out) + lane.time + (inn / a + RUN_IN_U / inn);
}

/** Give a hull its flight state. Idempotent: re-arming keeps the velocity it had. */
export function armFlight(n) {
  if (n.fly) return n.fly;
  const p = hullPerf(n);
  n.fly = {
    accel: p.accel,
    turn: p.turn,
    top: 400,
    mode: "hold",
    goal: null,
    jink: Math.random() * Math.PI * 2,
    jinkW: 0.5 + Math.random() * 0.8,
  };
  n.hpMax = n.hpMax ?? p.hp;
  n.hp = n.hp ?? p.hp;
  n.shieldMax = n.shieldMax ?? p.shield;
  n.shield = n.shield ?? p.shield;
  n.radius = n.radius ?? p.radius;
  n.gun = n.gun ?? { ...p.gun, cool: Math.random() * p.gun.rate };
  n.vx = n.vx ?? 0; n.vy = n.vy ?? 0; n.vz = n.vz ?? 0;
  return n.fly;
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/**
 * One step of powered flight toward a point.
 *
 *   standoff   hold this far off the goal instead of reaching it
 *   match      { vx, vy, vz } the goal's own velocity, so a standoff is
 *              station-keeping rather than a stern chase
 *   evade      lateral weave amplitude as a fraction of thrust (a hull being
 *              shot at does not fly a straight line)
 *   top        override the cruise ceiling for this step
 *
 * Returns the remaining distance to the standoff ring, so a caller can ask
 * "am I there yet" without measuring twice.
 */
export function flyStep(n, dt, gx, gy, gz, opts = {}) {
  const f = n.fly ?? armFlight(n);
  const top = opts.top ?? f.top;
  const accel = opts.accel ?? f.accel;
  const standoff = opts.standoff ?? 0;
  const mvx = opts.match?.vx ?? 0, mvy = opts.match?.vy ?? 0, mvz = opts.match?.vz ?? 0;

  let dx = gx - n.x, dy = gy - n.y, dz = gz - n.z;
  const d = Math.hypot(dx, dy, dz) || 1e-6;
  const ux = dx / d, uy = dy / d, uz = dz / d;
  const rem = d - standoff;

  /* Desired speed along the line: the braking curve, so the hull arrives
   * stopped instead of overshooting and yo-yoing. 0.92 keeps a little margin
   * for the fact that thrust is also being spent on turning. */
  const brake = Math.sqrt(Math.max(0, 2 * accel * Math.abs(rem))) * 0.92;
  const want = Math.min(top, brake) * Math.sign(rem || 1);

  let wvx = ux * want + mvx, wvy = uy * want + mvy, wvz = uz * want + mvz;

  /* Evasion: a lateral component that swings, so rounds led at the hull miss. */
  if (opts.evade) {
    f.jink += f.jinkW * dt;
    const s = Math.sin(f.jink), c = Math.cos(f.jink);
    /* any two vectors perpendicular to the line of flight */
    let px = -uz, py = 0, pz = ux;
    const pl = Math.hypot(px, py, pz) || 1;
    px /= pl; pz /= pl;
    const qx = uy * pz - uz * py, qy = uz * px - ux * pz, qz = ux * py - uy * px;
    const amp = top * 0.45 * opts.evade;
    wvx += (px * s + qx * c) * amp;
    wvy += (py * s + qy * c) * amp;
    wvz += (pz * s + qz * c) * amp;
  }

  /* Thrust toward the desired velocity, acceleration-limited. */
  let ex = wvx - n.vx, ey = wvy - n.vy, ez = wvz - n.vz;
  const el = Math.hypot(ex, ey, ez);
  if (el > 1e-6) {
    const step = Math.min(el, accel * dt);
    n.vx += (ex / el) * step;
    n.vy += (ey / el) * step;
    n.vz += (ez / el) * step;
  }
  /* Never let numerical noise push a hull past its own ceiling. */
  const sp = Math.hypot(n.vx, n.vy, n.vz);
  const cap = top + Math.hypot(mvx, mvy, mvz) + 1;
  if (sp > cap) { const k = cap / sp; n.vx *= k; n.vy *= k; n.vz *= k; }

  n.x += n.vx * dt;
  n.y += n.vy * dt;
  n.z += n.vz * dt;
  n.speed = Math.hypot(n.vx, n.vy, n.vz);
  faceVelocity(n, dt, opts.faceGoal ? { x: ux, y: uy, z: uz } : null);
  return Math.max(0, rem);
}

/** Coast: no thrust, just momentum. The far field's cheap step. */
export function coastStep(n, dt) {
  n.x += n.vx * dt;
  n.y += n.vy * dt;
  n.z += n.vz * dt;
  n.speed = Math.hypot(n.vx, n.vy, n.vz);
}

const TAU = Math.PI * 2;
function angleTo(from, to, maxStep) {
  let d = ((to - from + Math.PI) % TAU + TAU) % TAU - Math.PI;
  if (d > maxStep) d = maxStep;
  else if (d < -maxStep) d = -maxStep;
  return from + d;
}

/** Slew the hull's nose toward where it is going (or toward `dir` if given). */
export function faceVelocity(n, dt, dir = null) {
  const f = n.fly;
  const vx = dir ? dir.x : n.vx, vy = dir ? dir.y : n.vy, vz = dir ? dir.z : n.vz;
  const flat = Math.hypot(vx, vz);
  if (flat < 0.4 && Math.abs(vy) < 0.4) return;
  const wantYaw = Math.atan2(-vx, -vz);
  const wantPitch = Math.atan2(vy, flat) * 0.7;
  const step = (f?.turn ?? 0.6) * dt * TAU * 0.25;
  n.yaw = angleTo(n.yaw ?? wantYaw, wantYaw, step);
  n.pitch = angleTo(n.pitch ?? wantPitch, wantPitch, step);
}

/** Point the nose at a world position without changing course (guns track separately). */
export function faceAt(n, dt, tx, ty, tz) {
  faceVelocity(n, dt, { x: tx - n.x, y: ty - n.y, z: tz - n.z });
}

/** Drop the hull onto a point with a given velocity — undock, or a mirror correction. */
export function placeAt(n, x, y, z, vx = 0, vy = 0, vz = 0) {
  n.x = x; n.y = y; n.z = z;
  n.vx = vx; n.vy = vy; n.vz = vz;
  n.speed = Math.hypot(vx, vy, vz);
}

/** Bleed velocity toward a target's, for holding formation without a goal point. */
export function matchStep(n, dt, vx, vy, vz) {
  const f = n.fly ?? armFlight(n);
  let ex = vx - n.vx, ey = vy - n.vy, ez = vz - n.vz;
  const el = Math.hypot(ex, ey, ez);
  if (el > 1e-6) {
    const step = Math.min(el, f.accel * dt);
    n.vx += (ex / el) * step; n.vy += (ey / el) * step; n.vz += (ez / el) * step;
  }
  coastStep(n, dt);
}
