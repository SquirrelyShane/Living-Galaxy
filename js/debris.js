/* LIVING GALAXY — debris.
 *
 * Everything that comes apart ends up here: chunks blown off a world by an
 * impact, the rubble of something that shattered outright, wreckage from a
 * kill. Chunks fall under the same gravity the ship does, so a burst thrown
 * off a planet either rains back down, settles into a ring, or leaves.
 */

import { BODIES, bodyById, bodyPosition } from "./bodies.js";

const MAX = 900;
export const chunks = [];

/* Scratch */
const _bp = { x: 0, y: 0, z: 0 };

let seq = 1;

export function resetDebris() {
  chunks.length = 0;
  seq = 1;
}

/**
 * Throws `count` chunks outward from a point. `spread` is the cone half-angle
 * in radians around `nx,ny,nz`; pass no normal for a spherical burst.
 */
export function burst(opts) {
  const {
    x, y, z,
    vx = 0, vy = 0, vz = 0,
    count = 20,
    speed = 60,
    size = 20,
    spread = Math.PI,
    nx = 0, ny = 1, nz = 0,
    tint = 0,
    parent = null,
    life = 0,
    good = "iron_ore",
  } = opts;

  for (let i = 0; i < count; i++) {
    if (chunks.length >= MAX) dropOldest();
    /* random direction, biased into the cone around the normal */
    let dx = Math.random() * 2 - 1;
    let dy = Math.random() * 2 - 1;
    let dz = Math.random() * 2 - 1;
    const m = Math.hypot(dx, dy, dz) || 1;
    dx /= m;
    dy /= m;
    dz /= m;
    if (spread < Math.PI) {
      const k = 1 - spread / Math.PI;
      dx = dx * (1 - k) + nx * k;
      dy = dy * (1 - k) + ny * k;
      dz = dz * (1 - k) + nz * k;
      const n = Math.hypot(dx, dy, dz) || 1;
      dx /= n;
      dy /= n;
      dz /= n;
    }
    const sp = speed * (0.35 + Math.random() * 0.9);
    chunks.push({
      id: `d${seq++}`,
      x, y, z,
      vx: vx + dx * sp,
      vy: vy + dy * sp,
      vz: vz + dz * sp,
      r: size * (0.25 + Math.random() * 1.1),
      spin: (Math.random() - 0.5) * 0.9,
      seed: Math.random(),
      tint,
      parent,
      good,
      life,          // 0 = never expires
      age: 0,
    });
  }
}

/** A rubble ring — what is left when a world stops being one. It arrives as a
 * thick, inclined torus and flattens into the equatorial plane over the next
 * few minutes, the way inelastic collisions really do damp a debris cloud:
 * out-of-plane motion dies far faster than the radial spread. */
export function rubbleRing(body, count, radius) {
  bodyPosition(body.id, sim0.time, _bp);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = radius * (0.75 + Math.random() * 0.6);
    const y = (Math.random() - 0.5) * radius * 0.28;
    if (chunks.length >= MAX) dropOldest();
    chunks.push({
      id: `d${seq++}`,
      x: _bp.x + Math.cos(a) * r,
      y: _bp.y + y,
      z: _bp.z + Math.sin(a) * r,
      vx: 0, vy: 0, vz: 0,
      r: body.radius * (0.02 + Math.random() * 0.09),
      spin: (Math.random() - 0.5) * 0.5,
      seed: Math.random(),
      tint: 1,
      good: body.oreId ?? "iron_ore",
      parent: body.id,
      orbitA: a,
      orbitR: r,
      orbitY: y,
      orbitInc: Math.asin(Math.max(-1, Math.min(1, y / (r || 1)))),
      settle: 0,
      hot: 0.7,
      life: 0,
      age: 0,
    });
  }
}

/* sim is injected to avoid an import cycle */
let sim0 = { time: 0 };
export function bindDebris(sim) {
  sim0 = sim;
}

/* Per-step body table: every body placed once per step, not once per chunk.
 * gravityAt takes a position lookup, so it reads the table too. */
const _tab = [];                 // { b, x, y, z, r2 } per body, reused across steps
const _tabById = new Map();
function tableBodyPosition(id, time, out) {
  const e = _tabById.get(id);
  if (e) { out.x = e.x; out.y = e.y; out.z = e.z; return out; }
  return bodyPosition(id, time, out);
}

/**
 * Chunks orbiting a shattered world ride its rails; free chunks integrate
 * under the local well and get absorbed if they fall back in.
 */
export function stepDebris(dt, gravityAt, gOut) {
  if (!chunks.length) return;
  _tabById.clear();
  _tab.length = BODIES.length;
  for (let k = 0; k < BODIES.length; k++) {
    const b = BODIES[k];
    bodyPosition(b.id, sim0.time, _bp);
    const e = _tab[k] ?? (_tab[k] = { b: null, x: 0, y: 0, z: 0, r2: 0 });
    e.b = b; e.x = _bp.x; e.y = _bp.y; e.z = _bp.z; e.r2 = (b.radius * 0.985) ** 2;
    _tabById.set(b.id, e);
  }
  for (let i = chunks.length - 1; i >= 0; i--) {
    const c = chunks[i];
    c.age += dt;
    if (c.life > 0 && c.age > c.life) {
      c.dead = true;
      chunks.splice(i, 1);
      continue;
    }
    /* a piece still inside an impact's rigid-body run (js/impacts.js) is
     * placed by that run, not by this integrator, until the run lets it go */
    if (c.driven) continue;

    if (c.orbitR != null && c.parent) {
      /* rubble ring: on rails around whatever is left. Keplerian-ish shear —
       * the inside laps the outside, so a fresh torus visibly smears into a
       * ring instead of turning like a painted disc. */
      tableBodyPosition(c.parent, sim0.time, _bp);
      const shear = Math.pow(Math.max(1, c.orbitR) / Math.max(1, c.ringRef ?? c.orbitR), -1.5);
      c.orbitA += dt * (0.04 + c.seed * 0.05) * shear;
      if (c.orbitInc != null) {
        /* vertical damping: fast at first, asymptotic after */
        c.settle = Math.min(1, (c.settle ?? 0) + dt / 240);
        const flat = 1 - c.settle;
        c.orbitY = Math.sin(c.orbitInc) * c.orbitR * flat
          + Math.sin(c.orbitA * 3.1 + c.seed * 6.28) * c.orbitR * 0.006 * c.settle;
      }
      if (c.hot > 0) c.hot = Math.max(0, c.hot - dt / 200);
      c.x = _bp.x + Math.cos(c.orbitA) * c.orbitR;
      c.y = _bp.y + c.orbitY;
      c.z = _bp.z + Math.sin(c.orbitA) * c.orbitR;
      continue;
    }

    gravityAt(c, sim0.time, tableBodyPosition, gOut);
    c.vx += gOut.x * dt;
    c.vy += gOut.y * dt;
    c.vz += gOut.z * dt;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.z += c.vz * dt;

    /* Re-absorbed only once it is genuinely back under the surface — a burst
     * thrown off a crater has to be allowed to leave first. */
    for (const e of _tab) {
      if (e.b.shattered || e.b.collapsed) continue; // a collapsed star's surface is not there to land on
      const dx = c.x - e.x, dy = c.y - e.y, dz = c.z - e.z;
      if (dx * dx + dy * dy + dz * dz < e.r2) {
        c.dead = true;
        chunks.splice(i, 1);
        break;
      }
    }
  }
}

/** Chunks within `range` of a point, nearest first. Used by the salvage tractor. */
export function nearDebris(pos, range) {
  const out = [];
  for (const c of chunks) {
    const d = Math.hypot(c.x - pos.x, c.y - pos.y, c.z - pos.z);
    if (d < range) out.push({ c, d });
  }
  out.sort((a, b) => a.d - b.d);
  return out;
}

export function removeChunk(c) {
  c.dead = true;
  const i = chunks.indexOf(c);
  if (i >= 0) chunks.splice(i, 1);
}

/* The oldest chunk goes when the cap is hit — marked, because an impact run
 * may still be holding it (js/impacts.js checks `dead`). */
function dropOldest() {
  const c = chunks.shift();
  if (c) c.dead = true;
}

/** Add one chunk as built by the caller (impacts hand over their pieces this way). */
export function addChunk(c) {
  if (chunks.length >= MAX) dropOldest();
  c.id ??= `d${seq++}`;
  c.age ??= 0;
  c.life ??= 0;
  c.spin ??= (Math.random() - 0.5) * 0.9;
  c.seed ??= Math.random();
  chunks.push(c);
  return c;
}

/** Rough tonnage, so salvage pays by volume rather than by count. */
export function chunkMass(c) {
  return Math.max(1, Math.round(Math.pow(c.r, 1.6) * 0.05));
}

export function debrisCount() {
  return chunks.length;
}

export { bodyById };
