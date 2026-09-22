/**
 * Icy crystalline debris clouds + small meshed rocks.
 *
 * Everything is instanced and animated on the GPU (tumble, Keplerian orbit,
 * drift, glints, gravity-well inspiral, shatter burst), so the CPU cost per
 * frame is one uniform write.
 * Draw calls: ≤10 crystal meshes + ≤6 rock meshes + 2 point sprites.
 */
import * as THREE from 'three';
import { RNG, hashString, fbm, powerLaw, gauss, unitVec } from './rng.js';
import { ORES } from './ores.js';

const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ math */

function smoothstep(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

/** Random unit quaternion [x, y, z, w] (Shoemake). */
function randQuat(rng) {
  const u1 = rng.next();
  const u2 = rng.next() * TAU;
  const u3 = rng.next() * TAU;
  const a = Math.sqrt(1 - u1);
  const b = Math.sqrt(u1);
  return [a * Math.sin(u2), a * Math.cos(u2), b * Math.sin(u3), b * Math.cos(u3)];
}

/** Column-major TRS compose (uniform scale) into a Float32Array. */
function composeInto(te, o, px, py, pz, q, s) {
  const [x, y, z, w] = q;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  te[o] = (1 - (yy + zz)) * s; te[o + 1] = (xy + wz) * s; te[o + 2] = (xz - wy) * s; te[o + 3] = 0;
  te[o + 4] = (xy - wz) * s; te[o + 5] = (1 - (xx + zz)) * s; te[o + 6] = (yz + wx) * s; te[o + 7] = 0;
  te[o + 8] = (xz + wy) * s; te[o + 9] = (yz - wx) * s; te[o + 10] = (1 - (xx + yy)) * s; te[o + 11] = 0;
  te[o + 12] = px; te[o + 13] = py; te[o + 14] = pz; te[o + 15] = 1;
}

/** Flip triangles whose normal faces the reference centre (convex-ish parts). */
function fixWinding(pos, idx, start, end, cx, cy, cz) {
  for (let t = start; t < end; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const mx = (pos[a] + pos[b] + pos[c]) / 3 - cx;
    const my = (pos[a + 1] + pos[b + 1] + pos[c + 1]) / 3 - cy;
    const mz = (pos[a + 2] + pos[b + 2] + pos[c + 2]) / 3 - cz;
    if (nx * mx + ny * my + nz * mz < 0) {
      const tmp = idx[t + 1];
      idx[t + 1] = idx[t + 2];
      idx[t + 2] = tmp;
    }
  }
}

/** Area-weighted vertex normals for an indexed triangle list. */
export function computeNormals(pos, idx) {
  const nrm = new Float32Array(pos.length);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    nrm[a] += nx; nrm[a + 1] += ny; nrm[a + 2] += nz;
    nrm[b] += nx; nrm[b + 1] += ny; nrm[b + 2] += nz;
    nrm[c] += nx; nrm[c + 1] += ny; nrm[c + 2] += nz;
  }
  for (let i = 0; i < nrm.length; i += 3) {
    const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]) || 1;
    nrm[i] /= l; nrm[i + 1] /= l; nrm[i + 2] /= l;
  }
  return nrm;
}

/* ------------------------------------------------------------- geometry */

/** Indexed icosphere on the unit sphere. */
function icosphere(detail) {
  const t = (1 + Math.sqrt(5)) / 2;
  const verts = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t],
    [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map((v) => {
    const l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
  });
  let faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4],
    [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8],
    [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  for (let d = 0; d < detail; d++) {
    const cache = new Map();
    const mid = (a, b) => {
      const key = a < b ? a * 65536 + b : b * 65536 + a;
      let id = cache.get(key);
      if (id === undefined) {
        const A = verts[a], B = verts[b];
        const x = A[0] + B[0], y = A[1] + B[1], z = A[2] + B[2];
        const l = Math.hypot(x, y, z);
        id = verts.length;
        verts.push([x / l, y / l, z / l]);
        cache.set(key, id);
      }
      return id;
    };
    const next = [];
    for (const [a, b, c] of faces) {
      const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = next;
  }
  return { verts, faces };
}

/**
 * Small meshed asteroid rock: triaxial body, fbm relief, 1–4 fracture planes.
 * Unit max extent. Attributes: position, normal, aColor (grey shade), aFrost.
 */
export function makeRockGeometry(rng, opts = {}) {
  const { verts, faces } = icosphere(opts.detail ?? 2);
  const seed = Math.floor(rng.next() * 1e9);
  const q = randQuat(rng);
  const e = [];
  {
    const [x, y, z, w] = q;
    e.push([1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w)]);
    e.push([2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w)]);
    e.push([2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y)]);
  }
  const R = [1, rng.range(0.62, 0.95), rng.range(0.42, 0.8)];
  const cuts = [];
  const nCuts = opts.cuts ?? rng.int(1, 4);
  for (let c = 0; c < nCuts; c++) {
    const n = unitVec(rng);
    cuts.push({ n, h: rng.range(0.5, 0.82) });
  }

  const V = verts.length;
  const pos = new Float32Array(V * 3);
  const col = new Float32Array(V * 3);
  const frost = new Float32Array(V);
  let maxR = 0;
  for (let i = 0; i < V; i++) {
    const [x, y, z] = verts[i];
    const a = (x * e[0][0] + y * e[0][1] + z * e[0][2]) / R[0];
    const b = (x * e[1][0] + y * e[1][1] + z * e[1][2]) / R[1];
    const c = (x * e[2][0] + y * e[2][1] + z * e[2][2]) / R[2];
    let r = 1 / Math.sqrt(a * a + b * b + c * c);
    for (const cut of cuts) {
      const den = x * cut.n[0] + y * cut.n[1] + z * cut.n[2];
      if (den > 0.02) r = smin(r, cut.h / den, 0.09);
    }
    const n1 = fbm(x * 1.7, y * 1.7, z * 1.7, seed, 3);
    const n2 = fbm(x * 4.3, y * 4.3, z * 4.3, seed + 7, 2);
    r *= 1 + n1 * 0.34 + n2 * 0.1;
    r = Math.max(r, 0.22);
    pos[i * 3] = x * r;
    pos[i * 3 + 1] = y * r;
    pos[i * 3 + 2] = z * r;
    if (r > maxR) maxR = r;
    const shade = 0.8 + fbm(x * 3.1, y * 3.1, z * 3.1, seed + 13, 2) * 0.55 + (r - 0.7) * 0.25;
    const warm = fbm(x * 2.2, y * 2.2, z * 2.2, seed + 29, 2) * 0.12;
    col[i * 3] = Math.max(0.35, shade + warm);
    col[i * 3 + 1] = Math.max(0.35, shade);
    col[i * 3 + 2] = Math.max(0.35, shade - warm * 0.6);
    frost[i] = smoothstep(-0.12, 0.3, fbm(x * 2.4, y * 2.4, z * 2.4, seed + 41, 3) + y * 0.22);
  }
  for (let i = 0; i < pos.length; i++) pos[i] /= maxR;

  const idx = new Uint32Array(faces.length * 3);
  faces.forEach((f, k) => {
    idx[k * 3] = f[0];
    idx[k * 3 + 1] = f[1];
    idx[k * 3 + 2] = f[2];
  });
  fixWinding(pos, idx, 0, idx.length, 0, 0, 0);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(computeNormals(pos, idx), 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aFrost', new THREE.BufferAttribute(frost, 1));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return geo;
}

/** Irregular bipyramidal column, axis +Y, centred. Pushes into shared arrays. */
function pushBipyramid(rng, out, p) {
  const base = out.pos.length / 3;
  const sides = p.sides;
  const half = p.len * 0.5;
  const tipOff = () => [rng.signed() * p.rad * p.skew, rng.signed() * p.rad * p.skew];
  const verts = [];
  const [bx, bz] = tipOff();
  verts.push([bx, -half - p.tipB, bz]);
  const twist = rng.range(0, TAU);
  for (let ring = 0; ring < 2; ring++) {
    const y = ring === 0 ? -half : half;
    for (let s = 0; s < sides; s++) {
      const a = twist + (s / sides) * TAU + rng.signed() * p.jitter * 0.4;
      const rr = p.rad * (1 + rng.signed() * p.jitter) * (ring === 0 ? p.taperB : 1);
      verts.push([Math.cos(a) * rr, y + rng.signed() * p.len * p.jitter * 0.15, Math.sin(a) * rr]);
    }
  }
  const [tx, tz] = tipOff();
  verts.push([tx, half + p.tipT, tz]);

  const minY = -half - p.tipB;
  const span = p.len + p.tipB + p.tipT;
  for (const v of verts) {
    const w = p.xf(v);
    out.pos.push(w[0], w[1], w[2]);
    out.tip.push((v[1] - minY) / span);
  }
  const start = out.idx.length;
  const bot = base;
  const top = base + 1 + sides * 2;
  for (let s = 0; s < sides; s++) {
    const s1 = (s + 1) % sides;
    const r0a = base + 1 + s, r0b = base + 1 + s1;
    const r1a = base + 1 + sides + s, r1b = base + 1 + sides + s1;
    out.idx.push(bot, r0a, r0b);
    out.idx.push(r0a, r1a, r1b, r0a, r1b, r0b);
    out.idx.push(top, r1b, r1a);
  }
  const c = p.xf([0, (p.tipT - p.tipB) * 0.5, 0]);
  return { start, end: out.idx.length, c };
}

const CRYSTAL_KINDS = ['prism', 'shard', 'needle', 'plate', 'druse'];

/** Ice crystal geometry of a given habit. Unit max extent. Attributes: position, aTip. */
export function makeCrystalGeometry(kind, rng) {
  const out = { pos: [], tip: [], idx: [] };
  const parts = [];
  const ident = (v) => v;
  const defaults = { sides: 6, jitter: 0.12, skew: 0.15, taperB: 1, xf: ident };
  if (kind === 'prism') {
    parts.push(pushBipyramid(rng, out, { ...defaults, len: rng.range(0.9, 1.4), rad: rng.range(0.18, 0.27), tipT: rng.range(0.25, 0.45), tipB: rng.range(0.1, 0.3) }));
  } else if (kind === 'needle') {
    parts.push(pushBipyramid(rng, out, { ...defaults, len: rng.range(1.5, 2.1), rad: rng.range(0.06, 0.1), tipT: rng.range(0.25, 0.4), tipB: rng.range(0.25, 0.4), jitter: 0.08 }));
  } else if (kind === 'shard') {
    parts.push(pushBipyramid(rng, out, { ...defaults, sides: rng.int(4, 5), len: rng.range(0.1, 0.3), rad: rng.range(0.3, 0.42), tipT: rng.range(0.55, 0.85), tipB: rng.range(0.35, 0.6), jitter: 0.28, skew: 0.5 }));
  } else if (kind === 'plate') {
    parts.push(pushBipyramid(rng, out, { ...defaults, len: rng.range(0.07, 0.12), rad: rng.range(0.5, 0.62), tipT: 0.015, tipB: 0.015, jitter: 0.07, skew: 0.05 }));
  } else {
    // druse: a fan of columns rooted near the origin
    const n = rng.int(4, 7);
    for (let k = 0; k < n; k++) {
      const lean = k === 0 ? rng.range(0, 0.15) : rng.range(0.35, 0.95);
      const yaw = rng.range(0, TAU);
      const len = rng.range(0.5, 1.1) * (k === 0 ? 1.2 : 1);
      const cl = Math.cos(lean), sl = Math.sin(lean), cy = Math.cos(yaw), sy = Math.sin(yaw);
      const lift = len * 0.5 + 0.05;
      const xf = (v) => {
        const y = v[1] + lift;
        // tilt about Z by lean, then yaw about Y
        const x1 = v[0] * cl - y * sl;
        const y1 = v[0] * sl + y * cl;
        return [x1 * cy + v[2] * sy, y1 - 0.45, -x1 * sy + v[2] * cy];
      };
      parts.push(pushBipyramid(rng, out, { ...defaults, len, rad: rng.range(0.07, 0.13), tipT: rng.range(0.15, 0.3), tipB: 0.02, taperB: 0.8, xf }));
    }
  }

  const pos = new Float32Array(out.pos);
  const idx = new Uint32Array(out.idx);
  for (const part of parts) fixWinding(pos, idx, part.start, part.end, part.c[0], part.c[1], part.c[2]);
  let maxR = 0;
  for (let i = 0; i < pos.length; i += 3) maxR = Math.max(maxR, Math.hypot(pos[i], pos[i + 1], pos[i + 2]));
  for (let i = 0; i < pos.length; i++) pos[i] /= maxR;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(computeNormals(pos, idx), 3));
  geo.setAttribute('aTip', new THREE.BufferAttribute(new Float32Array(out.tip), 1));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return geo;
}

/* -------------------------------------------------------------- shaders */

/**
 * Shared animation GLSL. Every pass (colour, shadow depth, sprites) calls the
 * same functions so shadows and sprites stay locked to the visible geometry.
 *
 * Orbit:  near-Keplerian angle ω = K / r^1.5 about the field's local Y.
 * Star:   gravitational inspiral r(τ) = sqrt(R² − 2·rate·τ) with a soft ramp
 *         τ = t − 2(1 − e^(−t/2)). Orbit phase uses the closed-form integral
 *         of K / r^1.5 over that path, so there is no phase jump or spin-up glitch.
 * Black hole (v1.8): loose debris is the first thing the hole eats. The hole may
 *         sit away from (and move relative to) the field (uWellCenter, field-local).
 *         Instances are captured as uCapture rises (fast: seconds), then spiral in
 *         r(τ) = √(r0² − 2·a·τ) (a varies per instance) with the closed-form phase of
 *         K / r^1.5, flattening toward the disk plane. On the way in rocks heat up
 *         (∝ how far they have fallen), spaghettify along the line to the hole and
 *         burn away across the burn band just outside the core. accretion() mirrors
 *         the burn per clump so ring brightness tracks what has fallen in.
 * Burst:  shatter fields expand from 20 % radius with an exponential ease.
 */
const GLSL_ANIM = /* glsl */ `
uniform float uTime;
uniform float uOrbitK;
uniform float uWell;       // 0 none · 1 black hole · 2 star
uniform float uWellStart;
uniform float uWellRate;
uniform float uWellCore;   // capture / sublimation radius
uniform float uWellFade;   // fade band outside the core
uniform float uBurst;      // 1 = shatter field expanding
uniform float uBurstStart;
uniform float uDiskScale;  // black hole: rd = clamp(R * scale, min, max)
uniform float uDiskMin;
uniform float uDiskMax;
uniform vec3 uHeatColor;
uniform vec3 uWellCenter;  // black hole position in field-local space (now)
uniform vec3 uWellCenter0; // … when the well started (fixes each clump's starting offset)
uniform float uCapture;    // 0..1 how far the hole has captured this field
float gVis;
float gHeat;
float gStretch;
mat3 rotAxis(vec3 a, float ang) {
  float s = sin(ang);
  float c = cos(ang);
  float oc = 1.0 - c;
  return mat3(
    oc * a.x * a.x + c,       oc * a.x * a.y + a.z * s, oc * a.z * a.x - a.y * s,
    oc * a.x * a.y - a.z * s, oc * a.y * a.y + c,       oc * a.y * a.z + a.x * s,
    oc * a.z * a.x + a.y * s, oc * a.y * a.z - a.x * s, oc * a.z * a.z + c);
}
vec3 rotY(vec3 v, float ang) {
  float s = sin(ang);
  float c = cos(ang);
  return vec3(c * v.x - s * v.z, v.y, s * v.x + c * v.z);
}
float bhRadius(float r0, float rd, float k, float t) {
  return rd + (r0 - rd) * exp(-k * t);
}
float wellTauG(float age) {
  return age - 2.0 * (1.0 - exp(-age * 0.5));
}
// Final (orbit-rotated) clump centre. Sets gVis, gHeat; returns offset rotation via ang.
// Black hole: the clump starts on its orbit about the field origin (the asteroid), is
// captured per-instance as uCapture rises, then circularises around uWellCenter
// (the hole, in field-local space) and dissolves into the disk.
vec3 wellCenter(vec3 c0, float R, float seed, out float ang) {
  vec3 c = c0;
  if (uBurst > 0.5) {
    float bt = max(0.0, uTime - uBurstStart);
    c *= mix(0.2, 1.0, 1.0 - exp(-bt * 1.2));
  }
  float rEff = max(mix(R, length(c.xz), 0.25), 0.6);
  float k15 = pow(rEff, 1.5);
  ang = uTime * uOrbitK / k15;
  gVis = 1.0;
  gHeat = 0.0;
  gStretch = 1.0;
  if (uWell > 0.5 && uWell < 1.5) {
    // pA: still bound to the asteroid · pB: falling into the hole from where it sat relative to
    // the hole when the well started · blend by per-instance capture
    vec3 pA = rotY(c, ang);
    float cap = smoothstep(seed * 0.55, seed * 0.55 + 0.45, uCapture);
    float tau = wellTauG(max(0.0, uTime - uWellStart)) * cap;
    float a = uWellRate * (0.7 + 0.6 * seed);
    vec3 rel = rotY(c, uWellStart * uOrbitK / k15) - uWellCenter0;
    float r0 = max(length(rel), 0.6);
    float r2 = r0 * r0 - 2.0 * a * tau;
    float r = sqrt(max(r2, 1e-4));
    float rc = max(r, uWellCore * 0.5);
    float sweep = uOrbitK * (2.0 / a) * (sqrt(r0) - sqrt(rc));
    float phi = atan(rel.z, rel.x) + sweep;
    float y = rel.y * (r / r0) * (r / r0);
    float rxz = sqrt(max(r * r - y * y, 0.0));
    vec3 pB = uWellCenter + vec3(cos(phi) * rxz, y, sin(phi) * rxz);
    ang += sweep * cap;
    float fallen = clamp(1.0 - (r - uWellCore) / max(r0 - uWellCore, 0.1), 0.0, 1.0);
    gHeat = cap * pow(fallen, 1.6);
    // burns across [core, core + fade] — but never before it has really started falling (debris born close in)
    gVis = r2 <= 0.0 ? 0.0 : max(smoothstep(uWellCore, uWellCore + uWellFade, r), 1.0 - smoothstep(0.35, 0.7, fallen));
    gStretch = 1.0 + 5.0 * gHeat * gHeat;
    return mix(pA, pB, cap);
  } else if (uWell > 1.5) {
    float tau = wellTauG(max(0.0, uTime - uWellStart));
    float r2 = rEff * rEff - 2.0 * uWellRate * tau;
    float r = sqrt(max(r2, 1e-4));
    float rc = max(r, uWellCore * 0.5);
    ang = uOrbitK * (uTime / k15 + (2.0 / uWellRate) * (sqrt(rEff) - sqrt(rc)) - tau / k15);
    c *= rc / rEff;
    gVis = r2 <= 0.0 ? 0.0 : smoothstep(uWellCore, uWellCore + uWellFade, r);
    gHeat = 1.0 - smoothstep(uWellCore, uWellCore + uWellFade + 1.0, r);
  }
  return rotY(c, ang);
}
vec3 drift(float seed) {
  return 0.025 * gVis * vec3(
    sin(uTime * 0.41 + seed * 17.0),
    cos(uTime * 0.33 + seed * 23.0),
    sin(uTime * 0.29 + seed * 31.0));
}
// Full instance animation: tumble → instance transform → well/burst → orbit.
vec3 animateInstance(vec3 localPos, mat4 im, vec4 spin, vec4 orbit, float sublimate) {
  vec3 p = rotAxis(spin.xyz, uTime * spin.w + orbit.y * 6.2831853) * localPos;
  vec3 c0 = im[3].xyz;
  vec3 offset = mat3(im) * p;
  float ang;
  vec3 c1 = wellCenter(c0, orbit.x, orbit.w, ang);
  float vis = gVis * (1.0 - gHeat * sublimate);
  vec3 o = rotY(offset * vis, ang);
  if (gStretch > 1.001) {
    // spaghettified along the line to the hole
    vec3 er = normalize(c1 - uWellCenter + vec3(1e-5));
    float al = dot(o, er);
    o = er * (al * gStretch) + (o - er * al) / sqrt(gStretch);
  }
  return c1 + o + drift(orbit.w);
}
`;

const GLSL_LIGHT_UNIFORMS = /* glsl */ `
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uAmbient;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uHeatColor;
`;

export const SHADERS = {
  anim: GLSL_ANIM,
  solidVertex: /* glsl */ `
${GLSL_ANIM}
attribute vec4 aSpin;
attribute vec4 aOrbit;
#ifdef ICE
attribute float aTip;
#else
attribute vec3 aColor;
attribute float aFrost;
#endif
varying vec3 vWorld;
varying vec3 vCol;
varying float vDepth;
varying float vA;
varying float vB;
varying float vHeat;
void main() {
  #ifdef ICE
  float sublimate = uWell > 1.5 ? 1.0 : 0.0;
  #else
  float sublimate = 0.0;
  #endif
  vec3 op = animateInstance(position, instanceMatrix, aSpin, aOrbit, sublimate);
  vec4 wp = modelMatrix * vec4(op, 1.0);
  vWorld = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
  vHeat = gHeat;
  vec3 ic = vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
  ic = instanceColor;
  #endif
  #ifdef ICE
  vCol = ic;
  vA = aTip;
  float g = fract(sin(aOrbit.w * 91.7) * 43758.5453);
  vB = step(0.55, g) * pow(max(0.0, sin(uTime * (0.6 + g * 2.2) + g * 60.0)), 40.0);
  #else
  vCol = ic * aColor;
  vA = aFrost * aOrbit.z * (1.0 - gHeat);
  vB = 0.0;
  #endif
}
`,
  iceFragment: /* glsl */ `
${GLSL_LIGHT_UNIFORMS}
varying vec3 vWorld;
varying vec3 vCol;
varying float vDepth;
varying float vA;
varying float vB;
varying float vHeat;
void main() {
  vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  vec3 V = normalize(cameraPosition - vWorld);
  if (dot(n, V) < 0.0) n = -n;
  float ndv = clamp(dot(n, V), 0.0, 1.0);
  float ndl = dot(n, uSunDir);
  float wrap = clamp((ndl + 0.45) / 1.45, 0.0, 1.0);
  vec3 H = normalize(uSunDir + V);
  float spec = pow(max(dot(n, H), 0.0), 80.0);
  float fres = pow(1.0 - ndv, 3.0);
  float back = pow(max(0.0, dot(-V, uSunDir)), 5.0);
  vec3 deep = vec3(0.05, 0.16, 0.30);
  vec3 tint = mix(deep, vCol, 0.45 + 0.55 * vA);
  vec3 col = tint * (uAmbient * 2.2 + uSunColor * wrap);
  col += mix(vec3(0.40, 0.75, 1.0), vec3(0.78, 0.62, 1.0), fres) * fres * 0.75;
  col += uSunColor * spec * 2.4;
  col += vCol * uSunColor * back * (0.5 + 0.9 * vA);
  col += vec3(0.75, 0.92, 1.0) * vB * 2.2;
  col += uHeatColor * vHeat * vHeat * 1.6;
  float f = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
  col = mix(col, uFogColor, f);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`,
  rockFragment: /* glsl */ `
${GLSL_LIGHT_UNIFORMS}
varying vec3 vWorld;
varying vec3 vCol;
varying float vDepth;
varying float vA;
varying float vB;
varying float vHeat;
void main() {
  vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  vec3 V = normalize(cameraPosition - vWorld);
  if (dot(n, V) < 0.0) n = -n;
  float ndv = clamp(dot(n, V), 0.0, 1.0);
  float ndl = max(dot(n, uSunDir), 0.0);
  float frost = smoothstep(0.2, 0.7, vA);
  vec3 alb = mix(vCol, vec3(0.74, 0.86, 0.96), frost);
  vec3 H = normalize(uSunDir + V);
  float spec = pow(max(dot(n, H), 0.0), mix(14.0, 64.0, frost)) * mix(0.06, 0.9, frost);
  float fres = pow(1.0 - ndv, 4.0);
  vec3 col = alb * (uAmbient * 1.6 + uSunColor * ndl);
  col += uSunColor * spec;
  col += vec3(0.35, 0.55, 0.85) * fres * (0.05 + 0.3 * frost);
  // tidal / radiant heating near a well: glowing rims first, then the whole rock (colour per well)
  float heat = vHeat * vHeat;
  col += uHeatColor * heat * (0.4 + 1.8 * fres) * 1.4;
  float f = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
  col = mix(col, uFogColor, f);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`,
  pointsVertex: /* glsl */ `
${GLSL_ANIM}
uniform float uPx;
attribute float aSize;
attribute vec4 aColor;
attribute vec4 aOrbit;
varying vec4 vC;
varying float vDepth;
varying float vTw;
void main() {
  float ang;
  vec3 op = wellCenter(position, aOrbit.x, aOrbit.w, ang) + drift(aOrbit.w);
  vec4 mv = modelViewMatrix * vec4(op, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
  float px = aSize * uPx / max(0.05, vDepth);
  #ifdef GLINT
  float tw = pow(0.5 + 0.5 * sin(uTime * aOrbit.z + aOrbit.y * 6.2831853), 10.0);
  vTw = tw;
  px *= 0.5 + 1.5 * tw;
  #else
  vTw = 1.0;
  #endif
  gl_PointSize = clamp(px * (0.35 + 0.65 * gVis), 1.0, 96.0);
  vC = vec4(mix(aColor.rgb, uHeatColor, gHeat * 0.85), aColor.a * gVis * (1.0 + gHeat * 1.5));
}
`,
  pointsFragment: /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogDensity;
varying vec4 vC;
varying float vDepth;
varying float vTw;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  if (d > 1.0) discard;
  #ifdef GLINT
  float core = exp(-d * d * 16.0);
  float rays = exp(-abs(c.x) * 70.0) * exp(-abs(c.y) * 4.0) + exp(-abs(c.y) * 70.0) * exp(-abs(c.x) * 4.0);
  float a = (core + rays * 0.7) * vTw;
  #else
  float a = 1.0 - d;
  a *= a;
  #endif
  float fog = exp(-uFogDensity * uFogDensity * vDepth * vDepth);
  float nearFade = smoothstep(0.5, 1.8, vDepth);
  gl_FragColor = vec4(vC.rgb, clamp(a * vC.a * fog * nearFade, 0.0, 1.0));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`,
};

/**
 * MeshDepthMaterial that runs the same instance animation, so debris rocks cast
 * correct shadows. Uses three's own depth packing (onBeforeCompile) to stay
 * compatible with whatever shadow-map format the renderer uses.
 */
export function makeDebrisDepthMaterial(uniforms) {
  const mat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  mat.name = 'debris-rock-depth';
  mat.onBeforeCompile = (shader) => {
    for (const k of Object.keys(uniforms)) shader.uniforms[k] = uniforms[k];
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${GLSL_ANIM}\nattribute vec4 aSpin;\nattribute vec4 aOrbit;`)
      .replace(
        '#include <project_vertex>',
        `vec3 debrisPos = animateInstance(transformed, instanceMatrix, aSpin, aOrbit, 0.0);
vec4 mvPosition = modelViewMatrix * vec4(debrisPos, 1.0);
gl_Position = projectionMatrix * mvPosition;`
      );
  };
  mat.customProgramCacheKey = () => 'debris-rock-depth-v1';
  return mat;
}

/* --------------------------------------------------------------- field */

const ICE_TINTS = {
  water: [[0.82, 0.93, 1.0], [0.7, 0.88, 1.0], [0.9, 0.97, 1.0], [0.62, 0.82, 0.96]],
  volatile: [[0.78, 0.76, 1.0], [0.66, 0.92, 0.9], [0.84, 0.8, 0.98]],
  tholin: [[0.98, 0.86, 0.7], [0.92, 0.78, 0.62]],
};

function classIceProfile(klass) {
  let water = 0, volatile = 0, organic = 0;
  for (const [k, w] of Object.entries(klass?.ores || {})) {
    const spec = ORES[k];
    if (!spec) continue;
    if (k === 'water_ice' || k === 'ice') water += w;
    else if (spec.category === 'ice' || spec.category === 'volatile') volatile += w;
    else if (spec.category === 'organic') organic += w;
  }
  return {
    ice: Math.min(1, (water + volatile) * 3),
    volatile: Math.min(1, volatile * 4),
    organic: Math.min(1, organic * 2),
  };
}

function pickTint(rng, profile) {
  const r = rng.next();
  if (r < profile.organic * 0.22) return rng.pick(ICE_TINTS.tholin);
  if (r < profile.organic * 0.22 + 0.15 + profile.volatile * 0.35) return rng.pick(ICE_TINTS.volatile);
  return rng.pick(ICE_TINTS.water);
}

/**
 * Build an orbiting debris field around a generated asteroid.
 * @param {object} asteroid  result of generateAsteroid
 * @param {object} opts
 *   density 0..1.6, ice 0..1
 *   kind    'clouds' (default) | 'shatter' (dense rocky burst from the body's own colours)
 *   shadows true → debris rocks cast shadows via an animated depth material
 *   burstStart  shader time the shatter expansion starts at
 */
/** Schwarzschild radius of the fx black hole in world units (shared with blackhole.js). */
export const BH_RS = 0.22;

export const WELL_PRESETS = {
  // v1.8 debris goes first: captured within seconds, spirals in r² = r0² − 2aτ (a = rate·(0.7–1.3)),
  // heats, stretches and burns away across [core, core + fade] — a cloud ~8 u out is mostly eaten within ~25 s
  bh: { mode: 1, rate: 2.2, core: 0.45, fade: 0.9, diskScale: 0.42, diskMin: 0.85, diskMax: 2.5, heat: [0.62, 0.8, 1.0], level: 0.12, captureSeconds: 8 },
  star: { mode: 2, rate: 0.1, core: 0.75, fade: 1.2, heat: [1.0, 0.45, 0.15] },
};

/** JS mirror of the shader's soft ramp and black-hole dissolve (keep in sync with GLSL_ANIM). */
export function wellTau(age) {
  const a = Math.max(0, age);
  return a - 2 * (1 - Math.exp(-a * 0.5));
}
/** Burned-away share of an instance that started r0 from the hole, after effective infall time tauEff. */
export function bhDissolve(seed, tauEff, r0, p = WELL_PRESETS.bh) {
  const a = p.rate * (0.7 + 0.6 * seed);
  const r = Math.sqrt(Math.max(r0 * r0 - 2 * a * tauEff, 1e-4));
  if (r0 * r0 - 2 * a * tauEff <= 0) return 1;
  const sm = (a0, b0, v) => {
    const k = Math.max(0, Math.min(1, (v - a0) / (b0 - a0)));
    return k * k * (3 - 2 * k);
  };
  const fallen = Math.max(0, Math.min(1, 1 - (r - p.core) / Math.max(r0 - p.core, 0.1)));
  return 1 - Math.max(sm(p.core, p.core + p.fade, r), 1 - sm(0.35, 0.7, fallen));
}
/** Per-instance capture weight (mirror of the shader smoothstep). */
export function captureWeight(seed, capture) {
  const x = Math.max(0, Math.min(1, (capture - seed * 0.55) / 0.45));
  return x * x * (3 - 2 * x);
}

/** World-direction vector → field-local, for a group with Euler XYZ rotation and no scale. */
export function worldToFieldLocal(v, rot) {
  // three Euler 'XYZ': world = Rx·Ry·Rz·local  →  local = Rzᵀ·Ryᵀ·Rxᵀ·world
  let [x, y, z] = v;
  let c = Math.cos(-(rot.x || 0)), s = Math.sin(-(rot.x || 0));
  [y, z] = [c * y - s * z, s * y + c * z];
  c = Math.cos(-(rot.y || 0)); s = Math.sin(-(rot.y || 0));
  [x, z] = [c * x + s * z, -s * x + c * z];
  c = Math.cos(-(rot.z || 0)); s = Math.sin(-(rot.z || 0));
  [x, y] = [c * x - s * y, s * x + c * y];
  return [x, y, z];
}

export function bhDiskRadius(R, p = WELL_PRESETS.bh) {
  return Math.max(p.diskMin, Math.min(p.diskMax, R * p.diskScale));
}

export function buildDebrisField(asteroid, opts = {}) {
  const shatter = opts.kind === 'shatter';
  const density = Math.max(0, opts.density ?? 0.8);
  const iceKnob = Math.max(0, Math.min(1, opts.ice ?? 0.65));
  const group = new THREE.Group();
  group.name = shatter ? 'shatter-debris' : 'debris';

  const shared = {
    uTime: { value: 0 },
    uOrbitK: { value: 0.45 },
    uSunDir: { value: [0.72, 0.54, 0.42] },
    uSunColor: { value: [0.9, 0.85, 0.75] },
    uAmbient: { value: [0.06, 0.07, 0.09] },
    uFogColor: { value: [0.02, 0.027, 0.055] },
    uFogDensity: { value: 0.018 },
    uPx: { value: 600 },
    uWell: { value: 0 },
    uWellStart: { value: 0 },
    uWellRate: { value: 0.3 },
    uWellCore: { value: 0.42 },
    uWellFade: { value: 0.45 },
    uBurst: { value: shatter ? 1 : 0 },
    uBurstStart: { value: opts.burstStart ?? 0 },
    uDiskScale: { value: WELL_PRESETS.bh.diskScale },
    uDiskMin: { value: WELL_PRESETS.bh.diskMin },
    uDiskMax: { value: WELL_PRESETS.bh.diskMax },
    uHeatColor: { value: [1.0, 0.45, 0.15] },
    uWellCenter: { value: [0, 0, 0] },
    uWellCenter0: { value: [0, 0, 0] },
    uCapture: { value: 1 },
  };
  const clouds = []; // accretion bookkeeping: { R, m: [], seed: [] }
  let levelFrom = null;
  let centreLocked = false;
  const stats = { clouds: 0, crystals: 0, rocks: 0, motes: 0, glints: 0 };
  const api = {
    stats,
    uniforms: shared,
    /**
     * @param {number} t shader time
     * @param {object} [env] black hole only: { bh: [x,y,z] world, origin: [x,y,z] field parent position,
     *   capture: 0..1 } — capture only ever rises
     */
    update(t, env) {
      shared.uTime.value = t;
      // black hole: level the orbital plane into the disk plane (world XZ)
      if (api.well === 'bh' && levelFrom) {
        const f = Math.exp(-Math.max(0, t - shared.uWellStart.value) * WELL_PRESETS.bh.level);
        group.rotation.set(levelFrom.x * f, levelFrom.y, levelFrom.z * f);
      }
      if (api.well === 'bh' && env) {
        if (env.bh) {
          const o = env.origin || [0, 0, 0];
          shared.uWellCenter.value = worldToFieldLocal([env.bh[0] - o[0], env.bh[1] - o[1], env.bh[2] - o[2]], group.rotation);
          if (!centreLocked) {
            shared.uWellCenter0.value = shared.uWellCenter.value;
            centreLocked = true;
          }
        }
        if (env.capture != null) shared.uCapture.value = Math.max(shared.uCapture.value, Math.min(1, env.capture));
      }
    },
    /**
     * Mass that has dissolved into the black-hole disk, per clump.
     * @returns {Array<{ r: number, mass: number, total: number }>} r = world disk radius
     */
    accretion(t = shared.uTime.value) {
      if (api.well !== 'bh') return [];
      const tau = wellTau(t - shared.uWellStart.value);
      const capture = shared.uCapture.value;
      const K = shared.uOrbitK.value, t0 = shared.uWellStart.value, c0 = shared.uWellCenter0.value;
      return clouds.map((c) => {
        let mass = 0, total = 0;
        // clump-level start distance (instances in a clump sit within a few tenths of it)
        const ang = (t0 * K) / Math.pow(Math.max(c.R, 0.6), 1.5);
        const cs = Math.cos(ang), sn = Math.sin(ang);
        const r0 = Math.max(0.6, Math.hypot(cs * c.c[0] - sn * c.c[2] - c0[0], c.c[1] - c0[1], sn * c.c[0] + cs * c.c[2] - c0[2]));
        for (let i = 0; i < c.m.length; i++) {
          total += c.m[i];
          mass += c.m[i] * bhDissolve(c.seed[i], tau * captureWeight(c.seed[i], capture), r0);
        }
        return { r: bhDiskRadius(c.R), mass, total };
      });
    },
    setLighting({ sunDir, sunColor, ambient } = {}) {
      if (sunDir) shared.uSunDir.value = sunDir;
      if (sunColor) shared.uSunColor.value = sunColor;
      if (ambient) shared.uAmbient.value = ambient;
    },
    setFog(color, densityFog) {
      if (color) shared.uFogColor.value = color;
      if (densityFog != null) shared.uFogDensity.value = densityFog;
    },
    setPixelScale(px) {
      shared.uPx.value = px;
    },
    /** Start (or clear) a gravity well: 'bh' | 'star' | null, at shader time t. */
    setWell(kind, t = shared.uTime.value, opts = {}) {
      const cfg = WELL_PRESETS[kind];
      api.well = cfg ? kind : null;
      if (!cfg) {
        shared.uWell.value = 0;
        return;
      }
      shared.uWell.value = cfg.mode;
      shared.uWellStart.value = t;
      shared.uWellRate.value = cfg.rate;
      shared.uWellCore.value = cfg.core;
      shared.uWellFade.value = cfg.fade;
      shared.uHeatColor.value = cfg.heat;
      // a hole at the field origin captures immediately (v1.3 behaviour); offset holes pass env.capture
      shared.uCapture.value = opts.capture ?? 1;
      shared.uWellCenter.value = opts.center ?? [0, 0, 0];
      shared.uWellCenter0.value = shared.uWellCenter.value;
      centreLocked = opts.center != null;
      if (kind === 'bh') levelFrom = { x: group.rotation.x || 0, y: group.rotation.y || 0, z: group.rotation.z || 0 };
    },
    setBurst(t) {
      shared.uBurst.value = 1;
      shared.uBurstStart.value = t;
    },
    well: null,
  };
  group.userData.debris = api;
  if (density <= 0.001) return group;

  const rng = new RNG(hashString(String(asteroid.seed) + (shatter ? ':shatter' : ':debris')));
  const profile = classIceProfile(asteroid.klass);
  const bodyR = asteroid.maxRadius || asteroid.meshRadius * 1.3 || 2.2;

  // tilted orbital plane
  group.rotation.set(rng.range(-0.42, 0.42), rng.range(0, TAU), rng.range(-0.25, 0.25));

  const crystalGeos = [];
  for (const kind of CRYSTAL_KINDS) {
    for (let v = 0; v < 2; v++) crystalGeos.push({ kind, geo: makeCrystalGeometry(kind, rng), items: [] });
  }
  const kindWeights = { prism: 0.3, shard: 0.24, needle: 0.14, plate: 0.12, druse: 0.2 };
  const rockGeos = [];
  for (let v = 0; v < 6; v++) rockGeos.push({ geo: makeRockGeometry(rng, { detail: v < 2 ? 1 : 2 }), items: [] });

  const col = asteroid.geometry.attributes.color;
  const sampleRock = () => {
    const vi = Math.floor(rng.next() * col.count);
    const j = rng.range(0.85, 1.15) * (shatter ? 1.12 : 1.35);
    return [
      Math.min(1, Math.max(0.05, col.getX(vi) * j)),
      Math.min(1, Math.max(0.05, col.getY(vi) * j)),
      Math.min(1, Math.max(0.05, col.getZ(vi) * j)),
    ];
  };

  const motes = [];
  const glints = [];
  const nClouds = shatter ? Math.round(7 + density * 4) : Math.max(2, Math.round(2 + density * 5));
  const CAP_CRYSTAL = 1800;
  const CAP_ROCK = shatter ? 1100 : 700;
  const bodyIce = asteroid.iceAffinity ?? profile.ice;
  const phiBase = rng.range(0, TAU);

  for (let ci = 0; ci < nClouds; ci++) {
    // shatter: puffy clumps packed around the old body; clouds: thin arcs further out
    const R = bodyR * (shatter ? rng.range(0.45, 1.6) : rng.range(1.35, 2.3));
    const phi = phiBase + (ci / nClouds) * TAU + rng.signed() * 0.6;
    const yc = rng.signed() * (shatter ? bodyR * 0.5 : 0.3);
    const L = rng.range(0.6, 1.6) * (R / (shatter ? 2.2 : 3.2));
    const W = shatter ? rng.range(0.4, 0.9) : rng.range(0.22, 0.5);
    const Hh = shatter ? rng.range(0.35, 0.9) : rng.range(0.1, 0.32);
    const iceFrac = shatter
      ? Math.max(0.02, Math.min(0.7, bodyIce * 0.55 + rng.signed() * 0.1))
      : Math.max(0.05, Math.min(1, iceKnob * 0.8 + profile.ice * 0.3 + rng.signed() * 0.18));
    rng.next(); // keeps the v1.1.0 cloud layout stream stable
    const meta = { R, m: [], seed: [], c: [Math.cos(phi) * R, yc, Math.sin(phi) * R] };
    clouds.push(meta);
    const track = (bucket, mass) => {
      const it = bucket.items[bucket.items.length - 1];
      meta.m.push(mass);
      meta.seed.push(it.orbit[3]);
    };

    const place = (spread) => {
      const gx = gauss(rng) * spread;
      const gy = gauss(rng) * spread;
      const gz = gauss(rng) * spread;
      const ang = phi + (gx * L * 0.5) / R;
      const rad = R + gy * W * 0.5;
      const core = Math.exp(-(gx * gx + gy * gy + gz * gz) * 0.5);
      return { x: Math.cos(ang) * rad, y: yc + gz * Hh * 0.5, z: Math.sin(ang) * rad, core };
    };
    const orbit = (frost) => [R, rng.next(), frost, rng.next()];
    const spin = () => {
      const a = unitVec(rng);
      return [a[0], a[1], a[2], rng.range(0.15, 1.6) * (rng.next() < 0.5 ? -1 : 1)];
    };

    const nCrystal = Math.round((40 + 95 * density) * iceFrac * rng.range(0.7, 1.3) * (shatter ? 0.6 : 1));
    for (let k = 0; k < nCrystal && stats.crystals < CAP_CRYSTAL; k++) {
      const p = place(1);
      let roll = rng.next();
      let kind = 'prism';
      for (const [kk, w] of Object.entries(kindWeights)) {
        if ((roll -= w) <= 0) {
          kind = kk;
          break;
        }
      }
      const variants = crystalGeos.filter((g) => g.kind === kind);
      const bucket = variants[Math.floor(rng.next() * variants.length)];
      let s = powerLaw(rng, 0.012, 0.075, 2.0) * (1 + 0.5 * p.core);
      if (rng.next() < 0.03) s = rng.range(0.08, 0.13);
      if (kind === 'druse') s *= 1.5;
      if (kind === 'plate') s *= 0.8;
      const t = pickTint(rng, profile);
      const b = rng.range(0.8, 1.1);
      bucket.items.push({ p, s, q: randQuat(rng), color: [t[0] * b, t[1] * b, t[2] * b], spin: spin(), orbit: orbit(0) });
      track(bucket, s * s * s * 0.35);
      stats.crystals++;
    }

    const nRock = shatter
      ? Math.round((45 + 70 * density) * rng.range(0.8, 1.2))
      : Math.round((14 + 32 * density) * (1.1 - iceFrac * 0.7) * rng.range(0.7, 1.3));
    for (let k = 0; k < nRock && stats.rocks < CAP_ROCK; k++) {
      const p = place(0.9);
      let s = shatter ? powerLaw(rng, 0.02, 0.2, 1.8) * (1 + 0.5 * p.core) : powerLaw(rng, 0.014, 0.12, 2.1) * (1 + 0.4 * p.core);
      if (rng.next() < (shatter ? 0.03 : 0.025)) s = shatter ? rng.range(0.2, 0.32) : rng.range(0.12, 0.2);
      const bucket = rockGeos[Math.floor(rng.next() * rockGeos.length)];
      const frost = shatter
        ? Math.max(0, Math.min(1, bodyIce * 0.9 + rng.signed() * 0.2))
        : Math.max(0, Math.min(1, iceFrac * 1.25 - 0.15 + rng.signed() * 0.2));
      const sp = spin();
      sp[3] *= shatter ? 0.9 : 0.5;
      bucket.items.push({ p, s, q: randQuat(rng), color: sampleRock(), spin: sp, orbit: orbit(frost) });
      track(bucket, s * s * s);
      stats.rocks++;
    }

    // icy haze + dust
    const nMote = Math.round((70 + 110 * density) * rng.range(0.8, 1.2));
    const dust = sampleRock();
    for (let k = 0; k < nMote; k++) {
      const p = place(1.35);
      const icy = rng.next() < iceFrac;
      const d = shatter ? sampleRock() : dust;
      const c = icy ? [0.55 + rng.range(0, 0.2), 0.78 + rng.range(0, 0.12), 1.0] : [d[0] * 2.2, d[1] * 2.2, d[2] * 2.2];
      const a = rng.range(0.03, 0.09) * (icy ? 1 : shatter ? 1.1 : 0.7);
      motes.push({ x: p.x, y: p.y, z: p.z, size: rng.range(0.14, 0.55), c, a, R, seed: rng.next() });
    }
    // trailing stream behind the clump
    const nStream = Math.round((30 + 60 * density) * rng.range(0.7, 1.2));
    for (let k = 0; k < nStream; k++) {
      const back = -Math.pow(rng.next(), 0.7) * rng.range(0.4, 1.1);
      const ang = phi + back;
      const rad = R + gauss(rng) * W * 0.3 + back * 0.08;
      const icy = rng.next() < iceFrac;
      motes.push({
        x: Math.cos(ang) * rad,
        y: yc + gauss(rng) * Hh * 0.35,
        z: Math.sin(ang) * rad,
        size: rng.range(0.05, 0.16),
        c: icy ? [0.7, 0.88, 1.0] : [dust[0] * 2.4, dust[1] * 2.4, dust[2] * 2.4],
        a: rng.range(0.05, 0.14) * (1 + back * 0.5),
        R,
        seed: rng.next(),
      });
    }
    const nGlint = Math.round((10 + 34 * density) * iceFrac * (shatter ? 0.5 : 1));
    for (let k = 0; k < nGlint; k++) {
      const p = place(1);
      glints.push({ x: p.x, y: p.y, z: p.z, size: rng.range(0.03, 0.08), c: [0.85, 0.95, 1.0], a: rng.range(0.6, 1), R, seed: rng.next(), tw: rng.range(0.6, 2.4) });
    }
    stats.clouds++;
  }
  stats.motes = motes.length;
  stats.glints = glints.length;

  const iceMat = new THREE.ShaderMaterial({
    name: 'debris-ice',
    uniforms: shared,
    vertexShader: SHADERS.solidVertex,
    fragmentShader: SHADERS.iceFragment,
    defines: { ICE: '' },
  });
  const rockMat = new THREE.ShaderMaterial({
    name: 'debris-rock',
    uniforms: shared,
    vertexShader: SHADERS.solidVertex,
    fragmentShader: SHADERS.rockFragment,
  });

  const depthMat = opts.shadows ? makeDebrisDepthMaterial(shared) : null;

  const buildInstanced = (bucket, mat) => {
    const n = bucket.items.length;
    if (!n) {
      bucket.geo.dispose();
      return;
    }
    const mesh = new THREE.InstancedMesh(bucket.geo, mat, n);
    const m = mesh.instanceMatrix.array;
    const colors = new Float32Array(n * 3);
    const spin = new Float32Array(n * 4);
    const orb = new Float32Array(n * 4);
    bucket.items.forEach((it, i) => {
      composeInto(m, i * 16, it.p.x, it.p.y, it.p.z, it.q, it.s);
      colors.set(it.color, i * 3);
      spin.set(it.spin, i * 4);
      orb.set(it.orbit, i * 4);
    });
    mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    bucket.geo.setAttribute('aSpin', new THREE.InstancedBufferAttribute(spin, 4));
    bucket.geo.setAttribute('aOrbit', new THREE.InstancedBufferAttribute(orb, 4));
    mesh.frustumCulled = false;
    mesh.castShadow = !!depthMat && mat === rockMat;
    mesh.receiveShadow = false;
    if (mesh.castShadow) mesh.customDepthMaterial = depthMat;
    mesh.name = mat.name;
    group.add(mesh);
  };
  crystalGeos.forEach((b) => buildInstanced(b, iceMat));
  rockGeos.forEach((b) => buildInstanced(b, rockMat));

  const buildPoints = (list, glint) => {
    if (!list.length) return;
    const n = list.length;
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const color = new Float32Array(n * 4);
    const orb = new Float32Array(n * 4);
    list.forEach((m, i) => {
      pos[i * 3] = m.x;
      pos[i * 3 + 1] = m.y;
      pos[i * 3 + 2] = m.z;
      size[i] = m.size;
      color[i * 4] = Math.min(1, m.c[0]);
      color[i * 4 + 1] = Math.min(1, m.c[1]);
      color[i * 4 + 2] = Math.min(1, m.c[2]);
      color[i * 4 + 3] = m.a;
      orb[i * 4] = m.R;
      orb[i * 4 + 1] = m.seed;
      orb[i * 4 + 2] = m.tw || 0;
      orb[i * 4 + 3] = m.seed;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(color, 4));
    geo.setAttribute('aOrbit', new THREE.BufferAttribute(orb, 4));
    const mat = new THREE.ShaderMaterial({
      name: glint ? 'debris-glint' : 'debris-haze',
      uniforms: shared,
      vertexShader: SHADERS.pointsVertex,
      fragmentShader: SHADERS.pointsFragment,
      defines: glint ? { GLINT: '' } : {},
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.name = mat.name;
    pts.renderOrder = glint ? 3 : 2;
    group.add(pts);
  };
  buildPoints(motes, false);
  buildPoints(glints, true);

  return group;
}

/**
 * Bake instanced debris / rubble into static meshes for glTF export.
 * Snapshot at t = 0 (no orbit, no tumble), vertex colours carry instance
 * tint and frost. Crystals are split per face for crisp facets; rocks stay
 * indexed with smooth normals to keep GLBs small. Sprites are skipped.
 * @returns {THREE.Group}  { 'debris-rocks', 'debris-ice' } meshes, same rotation as the source
 */
export function bakeForExport(source, name = source.name) {
  const out = new THREE.Group();
  out.name = name;
  out.rotation.set(source.rotation.x || 0, source.rotation.y || 0, source.rotation.z || 0);
  const rock = { pos: [], col: [], idx: [] };
  const ice = { pos: [], col: [] };
  const FROST = [0.74, 0.86, 0.96];
  const DEEP = [0.05, 0.16, 0.3];

  for (const child of source.children) {
    if (!child.instanceMatrix || !child.geometry?.index) continue;
    const g = child.geometry;
    const P = g.attributes.position.array;
    const I = g.index.array;
    const M = child.instanceMatrix.array;
    const IC = child.instanceColor?.array;
    const isIce = child.material?.name === 'debris-ice';
    const aColor = g.attributes.aColor?.array;
    const aFrost = g.attributes.aFrost?.array;
    const aTip = g.attributes.aTip?.array;
    const aOrbit = g.attributes.aOrbit?.array;
    const V = P.length / 3;
    const tp = new Float32Array(P.length);
    for (let n = 0; n < child.count; n++) {
      const o = n * 16;
      for (let v = 0; v < V; v++) {
        const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
        tp[v * 3] = M[o] * x + M[o + 4] * y + M[o + 8] * z + M[o + 12];
        tp[v * 3 + 1] = M[o + 1] * x + M[o + 5] * y + M[o + 9] * z + M[o + 13];
        tp[v * 3 + 2] = M[o + 2] * x + M[o + 6] * y + M[o + 10] * z + M[o + 14];
      }
      const ic = IC ? [IC[n * 3], IC[n * 3 + 1], IC[n * 3 + 2]] : [1, 1, 1];
      if (isIce) {
        for (let t = 0; t < I.length; t++) {
          const v = I[t];
          ice.pos.push(tp[v * 3], tp[v * 3 + 1], tp[v * 3 + 2]);
          const k = 0.45 + 0.55 * (aTip ? aTip[v] : 1);
          for (let c = 0; c < 3; c++) ice.col.push(Math.min(1, DEEP[c] + (ic[c] - DEEP[c]) * k));
        }
      } else {
        const base = rock.pos.length / 3;
        const frostAmt = aOrbit ? aOrbit[n * 4 + 2] : 0;
        for (let v = 0; v < V; v++) {
          rock.pos.push(tp[v * 3], tp[v * 3 + 1], tp[v * 3 + 2]);
          const f = Math.max(0, Math.min(1, ((aFrost ? aFrost[v] : 0) * frostAmt - 0.2) / 0.5));
          for (let c = 0; c < 3; c++) {
            const albedo = Math.min(1, ic[c] * (aColor ? aColor[v * 3 + c] : 1));
            rock.col.push(Math.min(1, albedo + (FROST[c] - albedo) * f));
          }
        }
        for (let t = 0; t < I.length; t++) rock.idx.push(base + I[t]);
      }
    }
  }

  if (rock.idx.length) {
    const pos = new Float32Array(rock.pos);
    const idx = new Uint32Array(rock.idx);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(computeNormals(pos, idx), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(rock.col), 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ name: 'debris-rock', vertexColors: true, roughness: 0.86, metalness: 0.06 }));
    mesh.name = `${name}-rocks`;
    out.add(mesh);
  }
  if (ice.pos.length) {
    const pos = new Float32Array(ice.pos);
    const nrm = new Float32Array(pos.length);
    for (let t = 0; t < pos.length; t += 9) {
      const ux = pos[t + 3] - pos[t], uy = pos[t + 4] - pos[t + 1], uz = pos[t + 5] - pos[t + 2];
      const vx = pos[t + 6] - pos[t], vy = pos[t + 7] - pos[t + 1], vz = pos[t + 8] - pos[t + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      for (let k = 0; k < 9; k += 3) {
        nrm[t + k] = nx; nrm[t + k + 1] = ny; nrm[t + k + 2] = nz;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ice.col), 3));
    const mat = new THREE.MeshPhysicalMaterial({
      name: 'debris-ice',
      vertexColors: true,
      roughness: 0.08,
      metalness: 0,
      transmission: 0.55,
      thickness: 0.15,
      ior: 1.31,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      emissive: 0x0a2030,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = `${name}-ice`;
    out.add(mesh);
  }
  return out;
}
