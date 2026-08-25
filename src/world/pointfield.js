// Living Galaxy — held points. The static half of the particle layer.
//
// v1.02.41 built a pool for particles that are *born, move and die*: sparks, debris, plume,
// smoke. Every slot in it carries a lifetime, and the whole design turns on that — the step
// integrates, the sync writes an age-driven size and alpha, and a particle with no lifetime
// would sit at age zero for ever and never be reclaimed.
//
// This is the other kind. A **field** is geometry that is placed once, holds still, and stays
// until something removes it: the shell around a gravity well, a belt drawn as a band when it
// is too far away to be worth four hundred meshes. It shares the shader with the transient
// pool and it is one more draw call, but it shares nothing else, because the lifecycles have
// nothing in common.
//
// ## Why not just make particles immortal
//
// It was the first thing tried. A `life: Infinity` particle survives the step, but everything
// downstream assumes age: `sync` computes `1 - life/span`, which is NaN; the budget is a
// *live count* meant to be spent on the busiest second of a fight, and a well shell holding
// 800 of those slots permanently would mean a firefight next to a gas giant has no sparks in
// it. Two buffers, two budgets, and the transient one stays free to do its job.
//
// ## Rebuild, not update
//
// A field changes rarely — a well appears when a system is built, a belt's LOD tier flips when
// the player crosses a distance threshold. So there is no per-frame write at all: fields are
// stored as small records, and the buffer is repacked only when one is added or removed. A
// frame in which nothing changed costs nothing but the draw.

import { FIELD } from '../core/config.js';
import { effectScale } from './quality.js';
import { PARTICLE_VERT as VERT, PARTICLE_FRAG as FRAG, particleUniforms } from './particle-shader.js';

const CAP = FIELD.capacity;

// key -> { pts: Float32Array(n*3), col: [r,g,b] | Float32Array, size, alpha, n, visible }
const fields = new Map();

let points = null, aPos = null, aCol = null, aSize = null;
let packed = 0;
let dirty = false;
let culled = 0;             // points dropped at the last repack for want of room

export const fieldStats = () => ({
  fields: fields.size,
  points: packed,
  capacity: CAP,
  budget: budget(),
  culled
});

/** Quality scales the field layer exactly as it scales the transient one. */
export const budget = () => Math.max(64, Math.floor(CAP * effectScale()));

export function initPointField(scene) {
  if (!scene || points) return points;
  const geo = new THREE.BufferGeometry();
  aPos = new THREE.BufferAttribute(new Float32Array(CAP * 3), 3);
  aCol = new THREE.BufferAttribute(new Float32Array(CAP * 3), 3);
  aSize = new THREE.BufferAttribute(new Float32Array(CAP * 2), 2);
  if (aPos.setUsage) {
    aPos.setUsage(THREE.DynamicDrawUsage);
    aCol.setUsage(THREE.DynamicDrawUsage);
    aSize.setUsage(THREE.DynamicDrawUsage);
  }
  geo.setAttribute('position', aPos);
  geo.setAttribute('color', aCol);
  geo.setAttribute('aSize', aSize);
  geo.setDrawRange(0, 0);

  points = new THREE.Points(geo, new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: particleUniforms(),          // world scale — see particle-shader.js
    transparent: true, depthWrite: false, vertexColors: true,
    blending: THREE.AdditiveBlending, fog: false
  }));
  points.frustumCulled = false;
  // Behind the transient pool. A spark should read over a well shell, not under it.
  points.renderOrder = 2;
  scene.add(points);
  return points;
}

/**
 * Place or replace a field.
 *
 * @param key   stable identity — re-adding the same key replaces rather than duplicates,
 *              which is what makes this safe to call from a rebuild path.
 * @param pts   flat xyz triples
 * @param o     { color:[r,g,b], size, alpha }
 */
export function setField(key, pts, o = {}) {
  if (!pts || !pts.length) { return clearField(key); }
  fields.set(key, {
    pts,
    n: Math.floor(pts.length / 3),
    col: o.color || [1, 1, 1],
    size: o.size != null ? o.size : 5,
    alpha: o.alpha != null ? o.alpha : 0.5,
    visible: o.visible !== false
  });
  dirty = true;
}

export function clearField(key) {
  if (fields.delete(key)) dirty = true;
}

/** Hide without discarding — the LOD path flips this every time a tier changes. */
export function showField(key, on) {
  const f = fields.get(key);
  if (!f || f.visible === !!on) return;
  f.visible = !!on;
  dirty = true;
}

export const hasField = key => fields.has(key);

export function clearAllFields() {
  fields.clear();
  packed = 0;
  dirty = true;
}

/** Force a repack — quality changed under us, so the budget moved. */
export function invalidateFields() { dirty = true; }

/**
 * Repack if anything changed. Called once a frame; free when nothing has.
 *
 * Over-budget fields are **truncated rather than dropped**, which is the opposite of what the
 * transient pool does and is right for the same reason it is wrong there. A refused spark is
 * one missing spark; a refused well shell is a well that vanishes, and a field that disappears
 * entirely under load teaches the player the wrong thing about the world. Half a shell still
 * says "there is a well here".
 */
export function updatePointField() {
  if (!dirty || !points) return packed;
  dirty = false;

  const lim = Math.min(CAP, budget());
  const pa = aPos.array, ca = aCol.array, sa = aSize.array;
  let w = 0;
  culled = 0;

  for (const f of fields.values()) {
    if (!f.visible) continue;
    const room = lim - w;
    if (room <= 0) { culled += f.n; continue; }
    const take = Math.min(f.n, room);
    culled += f.n - take;
    for (let i = 0; i < take; i++) {
      pa[w * 3] = f.pts[i * 3];
      pa[w * 3 + 1] = f.pts[i * 3 + 1];
      pa[w * 3 + 2] = f.pts[i * 3 + 2];
      ca[w * 3] = f.col[0]; ca[w * 3 + 1] = f.col[1]; ca[w * 3 + 2] = f.col[2];
      sa[w * 2] = f.size;
      sa[w * 2 + 1] = f.alpha;
      w++;
    }
  }

  packed = w;
  aPos.needsUpdate = aCol.needsUpdate = aSize.needsUpdate = true;
  points.geometry.setDrawRange(0, packed);
  return packed;
}

// ── shapes ───────────────────────────────────────────────────────────

/**
 * Points on a sphere, evenly.
 *
 * Fibonacci rather than random spherical coordinates. Random looks clumped — it bunches at the
 * poles unless you take the arccos, and even then it leaves visible voids at these counts, and
 * a well shell with a hole in it reads as a shape rather than as a field. The golden-angle
 * spiral is the same cost and has no gaps.
 */
export function sphereShell(cx, cy, cz, radius, count, jitter = 0.04) {
  const out = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = golden * i;
    // A touch of radial jitter so the shell reads as a field rather than as a wireframe ball.
    // Deterministic in `i`, not random, so a shell is the same shell on every device.
    const j = 1 + (Math.sin(i * 12.9898) * 0.5) * jitter * 2;
    out[i * 3] = cx + Math.cos(t) * r * radius * j;
    out[i * 3 + 1] = cy + y * radius * j;
    out[i * 3 + 2] = cz + Math.sin(t) * r * radius * j;
  }
  return out;
}

/** A flat band — a belt seen from far enough away that individual rocks are not the point. */
export function ringBand(cx, cy, cz, inner, width, count, thickness, seedFn) {
  const out = new Float32Array(count * 3);
  const rnd = seedFn || (i => (Math.sin(i * 78.233) * 43758.5453) % 1);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.abs(rnd(i)) * 0.35;
    const rr = inner + Math.abs(rnd(i + 1000)) * width;
    out[i * 3] = cx + Math.cos(a) * rr;
    out[i * 3 + 1] = cy + (Math.abs(rnd(i + 2000)) - 0.5) * thickness;
    out[i * 3 + 2] = cz + Math.sin(a) * rr;
  }
  return out;
}
