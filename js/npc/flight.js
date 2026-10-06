import { shipById } from "../ships/shipdb.js";
import { POOL } from "../flight/defence.js";

export const CROSS_MIN = 42;
export const CROSS_MAX = 96;
const CROSS_PER_U = 1 / 620;

export const LANE_MIN_U = 60000;
export const RUN_OUT_U = 9000;
export const RUN_IN_U = 16000;
export const LANE_SPOOL_S = 8;
const LANE_T_MIN = 15;
const LANE_T_MAX = 75;
const LANE_PER_U = 1 / 60000;

const ACCEL = { trader: 62, hauler: 48, miner: 55, patrol: 96, security: 92, pirate: 104, supply: 52, rogue: 120 };
const TURN = { trader: 0.55, hauler: 0.40, miner: 0.50, patrol: 1.05, security: 1.0, pirate: 1.25, supply: 0.45, rogue: 1.6 };

const TOUGH = {
  trader:   { hp: 150, shield: 60,  radius: 7,  gun: { dmg: 5,  rate: 1.6, range: 780,  speed: 560 } },
  hauler:   { hp: 260, shield: 90,  radius: 10, gun: { dmg: 4,  rate: 2.2, range: 700,  speed: 540 } },
  supply:   { hp: 210, shield: 75,  radius: 9,  gun: { dmg: 4,  rate: 2.0, range: 720,  speed: 540 } },
  miner:    { hp: 190, shield: 50,  radius: 8,  gun: { dmg: 3,  rate: 2.4, range: 620,  speed: 520 } },
  patrol:   { hp: 220, shield: 130, radius: 6,  gun: { dmg: 10, rate: 0.9, range: 1250, speed: 820 } },
  security: { hp: 280, shield: 170, radius: 7,  gun: { dmg: 12, rate: 0.8, range: 1400, speed: 880 } },
  pirate:   { hp: 170, shield: 70,  radius: 6,  gun: { dmg: 8,  rate: 1.1, range: 1000, speed: 620 } },
  rogue:    { hp: 90,  shield: 20,  radius: 5,  gun: { dmg: 3,  rate: 2.2, range: 1100, speed: 520 } },
};
const DEFAULT_TOUGH = { hp: 160, shield: 60, radius: 6, gun: { dmg: 6, rate: 1.4, range: 900, speed: 600 } };

const REF_MASS = 60, REF_KW = 230;

export function hullPerf(n) {
  const role = n.role ?? "trader";
  const stats = shipById(n.ship)?.stats ?? null;
  const massT = stats?.massT ?? 40;
  const massK = Math.max(0.45, Math.min(1.6, 60 / Math.max(12, massT)));
  const base = ACCEL[role] ?? 60;
  const t = TOUGH[role] ?? DEFAULT_TOUGH;

  const bulk = (Math.max(4, massT) / REF_MASS) ** POOL.hullPow;
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

export function legCruise(L, a) {
  const T = Math.max(CROSS_MIN, Math.min(CROSS_MAX, L * CROSS_PER_U));
  const disc = a * a * T * T - 4 * a * L;
  if (disc <= 0) return Math.sqrt(a * L);
  const v = (a * T - Math.sqrt(disc)) / 2;
  return Math.max(40, Math.min(v, 2200));
}

export function usesLane(L) { return L > LANE_MIN_U; }

export function laneProfile(L) {
  const mid = Math.max(0, L - RUN_OUT_U - RUN_IN_U);
  if (mid <= 0) return { mid: 0, top: 0, time: 0 };
  const T = Math.max(LANE_T_MIN, Math.min(LANE_T_MAX, mid * LANE_PER_U));
  const flat = Math.max(1, T - LANE_SPOOL_S);
  const top = mid / flat;
  return { mid, top, time: T, accel: top / LANE_SPOOL_S };
}

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

  const brake = Math.sqrt(Math.max(0, 2 * accel * Math.abs(rem))) * 0.92;
  const want = Math.min(top, brake) * Math.sign(rem || 1);

  let wvx = ux * want + mvx, wvy = uy * want + mvy, wvz = uz * want + mvz;

  if (opts.evade) {
    f.jink += f.jinkW * dt;
    const s = Math.sin(f.jink), c = Math.cos(f.jink);
    let px = -uz, py = 0, pz = ux;
    const pl = Math.hypot(px, py, pz) || 1;
    px /= pl; pz /= pl;
    const qx = uy * pz - uz * py, qy = uz * px - ux * pz, qz = ux * py - uy * px;
    const amp = top * 0.45 * opts.evade;
    wvx += (px * s + qx * c) * amp;
    wvy += (py * s + qy * c) * amp;
    wvz += (pz * s + qz * c) * amp;
  }

  let ex = wvx - n.vx, ey = wvy - n.vy, ez = wvz - n.vz;
  const el = Math.hypot(ex, ey, ez);
  if (el > 1e-6) {
    const step = Math.min(el, accel * dt);
    n.vx += (ex / el) * step;
    n.vy += (ey / el) * step;
    n.vz += (ez / el) * step;
  }
  const sp = Math.hypot(n.vx, n.vy, n.vz);
  const cap = top + Math.hypot(mvx, mvy, mvz) + 1;
  if (sp > cap) { const k = cap / sp; n.vx *= k; n.vy *= k; n.vz *= k; }

  n.x += n.vx * dt;
  n.y += n.vy * dt;
  n.z += n.vz * dt;
  n.speed = sp > cap ? Math.hypot(n.vx, n.vy, n.vz) : sp;
  faceVelocity(n, dt, opts.faceGoal ? { x: ux, y: uy, z: uz } : null);
  return Math.max(0, rem);
}

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

export function faceAt(n, dt, tx, ty, tz) {
  faceVelocity(n, dt, { x: tx - n.x, y: ty - n.y, z: tz - n.z });
}

export function placeAt(n, x, y, z, vx = 0, vy = 0, vz = 0) {
  n.x = x; n.y = y; n.z = z;
  n.vx = vx; n.vy = vy; n.vz = vz;
  n.speed = Math.hypot(vx, vy, vz);
}

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
