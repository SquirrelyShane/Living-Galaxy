import * as THREE from 'three';
import { ORES, ASTEROID_CLASSES, hexToRgb } from './ores.js';
import { RNG, hashString, fbm, ridged, valueNoise3, powerLaw, unitVec } from './rng.js';
import { makeRockGeometry, computeNormals } from './debris.js';

export const GENERATOR_VERSION = '1.1.0';

/** Cube-sphere subdivisions per face edge. Triangles = 12 · n². */
const DETAIL_MAP = {
  low: 56, // ~38k tris
  medium: 80, // ~77k
  high: 113, // ~153k
  ultra: 158, // ~300k
};

const SHAPE_TABLE = [
  ['spheroid', 0.14],
  ['ellipsoid', 0.18],
  ['elongate', 0.14],
  ['contact-binary', 0.12],
  ['fragment', 0.16],
  ['rubble-pile', 0.13],
  ['top', 0.13],
];

export const SHAPE_KINDS = SHAPE_TABLE.map(([k]) => k);

export const SHAPE_LABELS = {
  spheroid: 'Spheroid',
  ellipsoid: 'Ellipsoid',
  elongate: 'Elongate',
  'contact-binary': 'Contact binary',
  fragment: 'Faceted fragment',
  'rubble-pile': 'Rubble pile',
  top: 'Spinning top',
  angular: 'Angular',
};

/* ------------------------------------------------------------ helpers */

function smoothstep(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function smax(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
}

function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

function tangentBasis(n) {
  const up = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let tx = n[1] * up[2] - n[2] * up[1];
  let ty = n[2] * up[0] - n[0] * up[2];
  let tz = n[0] * up[1] - n[1] * up[0];
  const tl = Math.hypot(tx, ty, tz);
  tx /= tl; ty /= tl; tz /= tl;
  const bx = n[1] * tz - n[2] * ty;
  const by = n[2] * tx - n[0] * tz;
  const bz = n[0] * ty - n[1] * tx;
  return { t: [tx, ty, tz], b: [bx, by, bz] };
}

/** Random orthonormal frame (rows e1, e2, e3). */
function randomFrame(rng) {
  const u1 = rng.next();
  const u2 = rng.next() * Math.PI * 2;
  const u3 = rng.next() * Math.PI * 2;
  const a = Math.sqrt(1 - u1), b = Math.sqrt(u1);
  const x = a * Math.sin(u2), y = a * Math.cos(u2), z = b * Math.sin(u3), w = b * Math.cos(u3);
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w)],
    [2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w)],
    [2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y)],
  ];
}

function makeEllipsoid(rng, A, B, C, cx = 0, cy = 0, cz = 0) {
  const e = randomFrame(rng);
  return { e, R: [A, B, C], c: [cx, cy, cz] };
}

/** Radial distance of an origin-centred ellipsoid along unit dir. */
function ellipsoidR(E, x, y, z) {
  const a = (x * E.e[0][0] + y * E.e[0][1] + z * E.e[0][2]) / E.R[0];
  const b = (x * E.e[1][0] + y * E.e[1][1] + z * E.e[1][2]) / E.R[1];
  const c = (x * E.e[2][0] + y * E.e[2][1] + z * E.e[2][2]) / E.R[2];
  return 1 / Math.sqrt(a * a + b * b + c * c);
}

/** Far intersection of a ray from the origin with an offset ellipsoid (0 on miss). */
function rayEllipsoid(E, x, y, z) {
  let a = 0, b = 0, c = -1;
  for (let k = 0; k < 3; k++) {
    const ek = E.e[k];
    const o = -(E.c[0] * ek[0] + E.c[1] * ek[1] + E.c[2] * ek[2]) / E.R[k];
    const d = (x * ek[0] + y * ek[1] + z * ek[2]) / E.R[k];
    a += d * d;
    b += 2 * o * d;
    c += o * o;
  }
  const disc = b * b - 4 * a * c;
  if (disc < 0) return 0;
  const t = (-b + Math.sqrt(disc)) / (2 * a);
  return t > 0 ? t : 0;
}

/**
 * Indexed cube-sphere with exactly shared seam vertices (lattice keys) and an
 * equi-angular warp, so triangles stay near-uniform with no pole pinching.
 */
export function buildCubeSphere(n) {
  const N1 = n + 1;
  const keyToId = new Map();
  const dirs = [];
  const T = Math.PI / 4;
  const warp = (i) => (i === 0 ? -1 : i === n ? 1 : Math.tan((2 * i / n - 1) * T));
  const vid = (c) => {
    const key = (c[0] * N1 + c[1]) * N1 + c[2];
    let id = keyToId.get(key);
    if (id === undefined) {
      const px = warp(c[0]), py = warp(c[1]), pz = warp(c[2]);
      const l = Math.hypot(px, py, pz);
      id = dirs.length / 3;
      dirs.push(px / l, py / l, pz / l);
      keyToId.set(key, id);
    }
    return id;
  };
  const tris = [];
  const c = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    const u = (k + 1) % 3;
    const v = (k + 2) % 3;
    for (const side of [0, n]) {
      const grid = new Int32Array(N1 * N1);
      for (let j = 0; j <= n; j++) {
        for (let i = 0; i <= n; i++) {
          c[k] = side; c[u] = i; c[v] = j;
          grid[j * N1 + i] = vid(c);
        }
      }
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const a = grid[j * N1 + i];
          const b = grid[j * N1 + i + 1];
          const cc = grid[(j + 1) * N1 + i + 1];
          const d = grid[(j + 1) * N1 + i];
          if (side === n) tris.push(a, b, cc, a, cc, d);
          else tris.push(a, cc, b, a, d, cc);
        }
      }
    }
  }
  return { dirs: new Float32Array(dirs), index: new Uint32Array(tris) };
}

/** CSR vertex adjacency from a triangle index (edges counted per triangle). */
function buildAdjacency(count, index) {
  const deg = new Uint32Array(count + 1);
  for (let t = 0; t < index.length; t += 3) {
    deg[index[t]] += 2;
    deg[index[t + 1]] += 2;
    deg[index[t + 2]] += 2;
  }
  const off = new Uint32Array(count + 1);
  for (let i = 0; i < count; i++) off[i + 1] = off[i] + deg[i];
  const fill = off.slice(0, count);
  const nb = new Uint32Array(off[count]);
  for (let t = 0; t < index.length; t += 3) {
    const a = index[t], b = index[t + 1], c = index[t + 2];
    nb[fill[a]++] = b; nb[fill[a]++] = c;
    nb[fill[b]++] = a; nb[fill[b]++] = c;
    nb[fill[c]++] = a; nb[fill[c]++] = b;
  }
  return { off, nb };
}

function smoothField(field, adj, iters) {
  let src = field;
  let dst = new Float32Array(field.length);
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < src.length; i++) {
      const s = adj.off[i], e = adj.off[i + 1];
      let sum = 0;
      for (let k = s; k < e; k++) sum += src[adj.nb[k]];
      dst[i] = (src[i] + sum / (e - s)) * 0.5;
    }
    const tmp = src === field ? new Float32Array(field.length) : src;
    src = dst;
    dst = tmp;
  }
  return src;
}

function shadeShift(rgb, t) {
  const lift = 0.55 + t * 0.7;
  return { r: Math.min(1, rgb.r * lift), g: Math.min(1, rgb.g * lift), b: Math.min(1, rgb.b * lift) };
}

function mixRgb(a, b, t) {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}

/* ------------------------------------------------------------ craters */

/**
 * Crater population in unit-sphere chord space. Power-law sizes, degradation
 * by age (old = shallow, soft rims, regolith-ponded floors), fresh rayed craters,
 * obliques, secondaries, and a small-crater saturation layer.
 */
function populateCraters(rng, density) {
  const list = [];
  const make = (dir, D, age, simple, extra = {}) => {
    const { t, b } = tangentBasis(dir);
    const oblique = rng.next() < 0.16;
    const yaw = rng.range(0, Math.PI);
    const degr = 0.42 + 0.58 * age;
    const fresh = age > 0.86 ? (age - 0.86) / 0.14 : 0;
    const reach = fresh > 0 ? 4 : 2.4;
    const radius = D * 0.5;
    return {
      dx: dir[0], dy: dir[1], dz: dir[2],
      tx: t[0], ty: t[1], tz: t[2],
      bx: b[0], by: b[1], bz: b[2],
      ca: Math.cos(yaw), sa: Math.sin(yaw),
      aspect: oblique ? rng.range(0.62, 0.88) : 1,
      radius,
      depth: D * (simple ? rng.range(0.16, 0.22) : rng.range(0.1, 0.15)) * degr,
      rim: D * rng.range(0.03, 0.05) * (0.3 + 0.7 * age),
      ejecta: D * rng.range(0.01, 0.02) * (0.2 + 0.8 * age),
      floor: simple ? 0.08 : rng.range(0.28, 0.42),
      peak: simple ? 0 : D * rng.range(0.04, 0.08) * degr,
      pond: age < 0.5 && rng.next() < 0.6 ? rng.range(0.35, 0.72) : 0,
      fresh,
      rays: rng.int(7, 15),
      rayPh: rng.range(0, 6.28),
      reach,
      cosCut: 1 - Math.pow(Math.min(2, reach * radius), 2) / 2,
      age,
      ...extra,
    };
  };

  const nPrimary = Math.round(10 + density * 30);
  for (let i = 0; i < nPrimary; i++) {
    const D = powerLaw(rng, 0.05, 0.6, 2.2);
    const dir = unitVec(rng);
    const age = rng.next();
    const c = make(dir, D, age, D < 0.24);
    list.push(c);
    if (D > 0.2 && age > 0.35 && rng.next() < 0.55) {
      const nSec = rng.int(3, 8);
      const yaw = rng.range(0, Math.PI * 2);
      for (let s = 0; s < nSec; s++) {
        const ang = yaw + rng.range(-0.8, 0.8);
        const dist = rng.range(0.7, 1.8) * D;
        const sx = dir[0] + (c.tx * Math.cos(ang) + c.bx * Math.sin(ang)) * dist;
        const sy = dir[1] + (c.ty * Math.cos(ang) + c.by * Math.sin(ang)) * dist;
        const sz = dir[2] + (c.tz * Math.cos(ang) + c.bz * Math.sin(ang)) * dist;
        const l = Math.hypot(sx, sy, sz);
        list.push(make([sx / l, sy / l, sz / l], D * rng.range(0.08, 0.2), Math.min(0.85, age + 0.01 * s), true));
      }
    }
  }
  // giant old basins that bite into the silhouette
  const nBasin = rng.int(0, 2) + (density > 0.45 ? 1 : 0);
  for (let i = 0; i < nBasin; i++) {
    const D = rng.range(0.5, 0.95);
    const age = rng.range(0, 0.55);
    list.push(make(unitVec(rng), D, age, false, {
      depth: D * rng.range(0.07, 0.11),
      rim: D * rng.range(0.008, 0.018),
      ejecta: 0,
      floor: rng.range(0.45, 0.6),
      peak: 0,
    }));
  }
  const nSmall = Math.round(density * 70);
  for (let i = 0; i < nSmall; i++) {
    const D = powerLaw(rng, 0.018, 0.075, 2.6);
    list.push(make(unitVec(rng), D, rng.next(), true));
  }
  list.sort((a, b) => a.age - b.age);
  return list;
}

const CR = { pond: 0, fresh: 0, cav: 0 };

function craterEval(x, y, z, c) {
  const rx = x - c.dx, ry = y - c.dy, rz = z - c.dz;
  const u = rx * c.tx + ry * c.ty + rz * c.tz;
  const v = rx * c.bx + ry * c.by + rz * c.bz;
  const X = u * c.ca + v * c.sa;
  const Y = (-u * c.sa + v * c.ca) / c.aspect;
  const rho = Math.sqrt(X * X + Y * Y) / (c.radius + 1e-6);
  if (rho > c.reach) return 0;

  if (c.fresh > 0) {
    const halo = smoothstep(1.6, 0.7, rho);
    const ray = Math.pow(Math.abs(Math.cos(Math.atan2(Y, X) * c.rays * 0.5 + c.rayPh)), 8) * smoothstep(c.reach, 1.1, rho);
    CR.fresh = Math.max(CR.fresh, c.fresh * Math.max(halo, ray * 0.8));
  }
  if (rho > 2.4) return 0;

  let dR = 0;
  const rimG = Math.exp(-Math.pow((rho - 1) * 5.5, 2));
  if (rho <= 1) {
    if (rho < c.floor) {
      dR -= c.depth * (1 - c.floor * c.floor) * 0.92;
      if (c.peak > 0) {
        const pr = rho / Math.max(0.08, c.floor * 0.55);
        dR += c.peak * Math.max(0, 1 - pr * pr);
      }
    } else {
      dR -= c.depth * (1 - rho * rho);
    }
    if (c.pond > 0) {
      const lvl = -c.depth * (1 - c.pond);
      if (dR < lvl) {
        dR = lvl + (dR - lvl) * 0.06;
        CR.pond = Math.max(CR.pond, c.pond * smoothstep(1, 0.72, rho));
      }
    }
    dR += c.rim * rimG;
    if (dR < 0) CR.cav -= dR;
  } else {
    dR += c.ejecta * Math.pow(rho, -3) * smoothstep(2.4, 1.05, rho) + c.rim * rimG;
  }
  return dR;
}

/* ---------------------------------------------------------- grooves */

function populateGrooves(rng, roughness) {
  const list = [];
  if (rng.next() > 0.28 + roughness * 0.6) return list;
  const families = rng.int(1, 2);
  for (let f = 0; f < families; f++) {
    const g = unitVec(rng);
    const { t, b } = tangentBasis(g);
    const lines = rng.int(3, 7);
    const spacing = rng.range(0.05, 0.11);
    const o0 = rng.range(-0.35, 0.35);
    const a0 = rng.range(0, Math.PI * 2);
    const span = rng.range(1.2, 3.4);
    const w = rng.range(0.011, 0.022);
    const depth = rng.range(0.008, 0.018);
    const freq = rng.range(10, 28);
    for (let l = 0; l < lines; l++) {
      list.push({
        g, t, b,
        off: o0 + (l - lines / 2) * spacing,
        a0: a0 + rng.signed() * 0.2,
        span: span * rng.range(0.6, 1),
        w: w * rng.range(0.8, 1.2),
        depth: depth * rng.range(0.6, 1.2),
        freq,
        ph: rng.range(0, 6.28),
      });
    }
  }
  return list;
}

function grooveEval(x, y, z, G) {
  const s = x * G.g[0] + y * G.g[1] + z * G.g[2];
  const dd = Math.abs(s - G.off);
  if (dd >= G.w) return 0;
  let ang = Math.atan2(x * G.b[0] + y * G.b[1] + z * G.b[2], x * G.t[0] + y * G.t[1] + z * G.t[2]) - G.a0;
  ang = ((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (ang > G.span) return 0;
  const ends = smoothstep(0, 0.25, ang) * smoothstep(G.span, G.span - 0.25, ang);
  const prof = 1 - (dd / G.w) * (dd / G.w);
  const beads = 0.5 + 0.5 * Math.sin(ang * G.freq + G.ph);
  const d = G.depth * prof * ends * (0.45 + 0.55 * beads);
  CR.cav += d;
  return -d;
}

/* ------------------------------------------------------------ main */

export function generateAsteroid(params) {
  const seedStr = params.seed || 'Psyche-7749';
  const seed = hashString(seedStr);
  const rng = new RNG(seed);

  const classId =
    params.classId && ASTEROID_CLASSES[params.classId]
      ? params.classId
      : rng.pick(Object.keys(ASTEROID_CLASSES));
  const klass = ASTEROID_CLASSES[classId];

  const radiusM = params.radiusM ?? rng.range(40, 420);
  const roughness = params.roughness ?? rng.range(0.18, 0.48);
  const craterDensity = params.craterDensity ?? rng.range(0.35, 1);
  const richness = params.richness ?? rng.range(0.45, 1.15);
  const n = typeof params.detail === "number" ? Math.max(2, Math.round(params.detail)) : DETAIL_MAP[params.detail] ?? DETAIL_MAP.high;

  const meshRadius = 1.65;
  const { dirs, index } = buildCubeSphere(n);
  const count = dirs.length / 3;

  /* ---- shape kind (always consume the roll so overrides keep other rolls stable) */
  let roll = rng.next();
  let shapeKind = SHAPE_TABLE[0][0];
  for (const [k, w] of SHAPE_TABLE) {
    if ((roll -= w) <= 0) {
      shapeKind = k;
      break;
    }
  }
  if (params.shapeKind && SHAPE_LABELS[params.shapeKind] && params.shapeKind !== 'angular') shapeKind = params.shapeKind;

  const craters = populateCraters(rng, craterDensity);
  const grooves = populateGrooves(rng, roughness);

  const shapeSeed = seed + 17;
  const ridgeSeed = seed + 91;
  const warpSeed = seed + 311;
  const gritSeed = seed + 523;

  /* ---- base body: triaxial ellipsoid, ratios by kind */
  const axisRanges = {
    spheroid: [[0.9, 1], [0.84, 0.97]],
    ellipsoid: [[0.72, 0.92], [0.55, 0.8]],
    elongate: [[0.5, 0.72], [0.38, 0.6]],
    'contact-binary': [[0.8, 0.95], [0.7, 0.9]],
    fragment: [[0.62, 0.9], [0.45, 0.72]],
    'rubble-pile': [[0.78, 0.95], [0.65, 0.88]],
    top: [[0.95, 1], [0.86, 0.95]],
  }[shapeKind];
  const bRatio = rng.range(axisRanges[0][0], axisRanges[0][1]);
  const cRatio = Math.min(bRatio, rng.range(axisRanges[1][0], axisRanges[1][1]));
  const body = makeEllipsoid(rng, 1, bRatio, cRatio);
  const spinAxis = body.e[2]; // short axis = max-inertia spin axis

  const lobes = [];
  if (shapeKind === 'contact-binary') {
    const dir = body.e[0];
    const sep = rng.range(0.36, 0.5);
    const ra = rng.range(0.56, 0.72);
    const rb = ra * rng.range(0.72, 0.95);
    lobes.push(makeEllipsoid(rng, ra * rng.range(1, 1.2), ra * rng.range(0.85, 1), ra * rng.range(0.75, 0.95), dir[0] * sep, dir[1] * sep, dir[2] * sep));
    const lb = makeEllipsoid(rng, rb * rng.range(1, 1.15), rb * rng.range(0.85, 1), rb * rng.range(0.75, 0.95), -dir[0] * sep, -dir[1] * sep, -dir[2] * sep);
    lobes.push(lb);
    // ensure origin is inside both lobes along the separation axis
    for (const L of lobes) L.R = L.R.map((r) => Math.max(r, sep + 0.1));
  } else if (shapeKind === 'rubble-pile') {
    lobes.push(makeEllipsoid(rng, rng.range(0.66, 0.78), rng.range(0.6, 0.72), rng.range(0.52, 0.66)));
    const nb = rng.int(8, 14);
    for (let k = 0; k < nb; k++) {
      const d = unitVec(rng);
      const off = rng.range(0.3, 0.55);
      const r = rng.range(0.2, 0.46);
      lobes.push(makeEllipsoid(rng, r, r * rng.range(0.7, 1), r * rng.range(0.55, 0.9), d[0] * off, d[1] * off, d[2] * off));
    }
  }

  const cuts = [];
  const nCuts = shapeKind === 'fragment' ? rng.int(5, 9) : rng.next() < 0.5 ? rng.int(1, 3) : 0;
  for (let k = 0; k < nCuts; k++) {
    const nrm = unitVec(rng);
    const h = shapeKind === 'fragment' ? rng.range(0.6, 0.86) : rng.range(0.8, 0.95);
    cuts.push({ n: nrm, h: h * ellipsoidR(body, nrm[0], nrm[1], nrm[2]), k: shapeKind === 'fragment' ? 0.05 : 0.09 });
  }

  const knobs = [];
  const knobCount = rng.int(3, 7);
  for (let k = 0; k < knobCount; k++) {
    const d = unitVec(rng);
    knobs.push({ d, radius: rng.range(0.14, 0.34), height: rng.range(0.02, 0.07) });
  }

  const topRidge = rng.range(0.04, 0.08);
  const aLow = roughness * (shapeKind === 'fragment' ? 0.6 : shapeKind === 'rubble-pile' ? 0.45 : 1.05);
  const aRidge = roughness * 0.3;
  const aGrit = roughness * 0.1;
  const aMicro = roughness * 0.04;

  const radius = new Float32Array(count);
  const rBaseArr = new Float32Array(count);
  const pondArr = new Float32Array(count);
  const freshArr = new Float32Array(count);
  const cavArr = new Float32Array(count);
  const facetArr = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const x = dirs[i * 3], y = dirs[i * 3 + 1], z = dirs[i * 3 + 2];

    let rs;
    if (shapeKind === 'contact-binary') {
      rs = smax(rayEllipsoid(lobes[0], x, y, z), rayEllipsoid(lobes[1], x, y, z), 0.22);
    } else if (shapeKind === 'rubble-pile') {
      rs = rayEllipsoid(lobes[0], x, y, z);
      for (let k = 1; k < lobes.length; k++) rs = smax(rs, rayEllipsoid(lobes[k], x, y, z), 0.06);
    } else {
      rs = ellipsoidR(body, x, y, z);
      if (shapeKind === 'top') {
        const s = Math.abs(x * spinAxis[0] + y * spinAxis[1] + z * spinAxis[2]);
        const eq = Math.sqrt(Math.max(0, 1 - s * s));
        const diamond = 1 / (s * 1.22 + eq * 0.9);
        rs *= 0.55 + 0.45 * diamond;
        rs += topRidge * Math.exp(-(s * s) / 0.012);
      }
    }
    const rsUncut = rs;
    for (const cut of cuts) {
      const den = x * cut.n[0] + y * cut.n[1] + z * cut.n[2];
      if (den > 0.02) rs = smin(rs, cut.h / den, cut.k);
    }
    // fracture faces stay planar: damp relief where a cut is active
    const facet = cuts.length ? smoothstep(0.0, 0.03, rsUncut - rs) : 0;

    const px = x * rs, py = y * rs, pz = z * rs;
    const wx = fbm(px * 0.8, py * 0.8, pz * 0.8, warpSeed, 2);
    const wy = fbm(px * 0.8, py * 0.8, pz * 0.8, warpSeed + 1, 2);
    const wz = fbm(px * 0.8, py * 0.8, pz * 0.8, warpSeed + 2, 2);
    const low = fbm(px * 0.9 + wx * 0.7, py * 0.9 + wy * 0.7, pz * 0.9 + wz * 0.7, shapeSeed, 4, 2.05, 0.52);
    const rid = ridged(px * 1.5, py * 1.5, pz * 1.5, ridgeSeed, 4) - 0.55;
    const rBase = rs * (1 + (low * aLow + rid * aRidge) * (1 - 0.8 * facet));

    CR.pond = 0;
    CR.fresh = 0;
    CR.cav = 0;
    let dr = 0;
    for (let k = 0; k < craters.length; k++) {
      const c = craters[k];
      if (x * c.dx + y * c.dy + z * c.dz < c.cosCut) continue;
      dr += craterEval(x, y, z, c);
    }
    for (let k = 0; k < grooves.length; k++) dr += grooveEval(x, y, z, grooves[k]);
    for (let k = 0; k < knobs.length; k++) {
      const kn = knobs[k];
      const d = Math.hypot(x - kn.d[0], y - kn.d[1], z - kn.d[2]);
      if (d < kn.radius) {
        const w = 1 - d / kn.radius;
        dr += kn.height * w * w;
      }
    }

    const grit = fbm(px * 4.2, py * 4.2, pz * 4.2, gritSeed, 3, 2.2, 0.48);
    const micro = fbm(px * 11, py * 11, pz * 11, gritSeed + 19, 2, 2.3, 0.45);
    const damp = 1 - CR.pond * 0.85;
    radius[i] = Math.max(rBase + (grit * aGrit + micro * aMicro) * damp * (1 - 0.4 * facet) + dr * Math.max(0.6, rs) * (1 - 0.45 * facet), 0.3);
    rBaseArr[i] = rBase;
    pondArr[i] = CR.pond;
    freshArr[i] = CR.fresh;
    cavArr[i] = CR.cav;
    facetArr[i] = facet;
  }

  // normalise to unit mean radius so every shape frames the same
  let mean = 0;
  for (let i = 0; i < count; i++) mean += radius[i];
  mean /= count;
  for (let i = 0; i < count; i++) {
    radius[i] /= mean;
    rBaseArr[i] /= mean;
  }

  /* ---- ore features (direction space) */
  const oreKeys = Object.keys(klass.ores).filter((k) => ORES[k]);
  const oreSeeds = {};
  const composition = { _rock: 0 };
  oreKeys.forEach((k, i) => {
    oreSeeds[k] = seed + 1000 + i * 7919;
    composition[k] = 0;
  });
  const ranked = oreKeys.slice().sort((a, b) => klass.ores[b] - klass.ores[a]);

  const walkPath = (start, steps, stepLen) => {
    const pts = [start.slice()];
    const r0 = unitVec(rng);
    let h = [start[1] * r0[2] - start[2] * r0[1], start[2] * r0[0] - start[0] * r0[2], start[0] * r0[1] - start[1] * r0[0]];
    let hl = Math.hypot(h[0], h[1], h[2]);
    if (hl < 1e-6) h = [1, 0, 0];
    else h = h.map((v) => v / hl);
    for (let s = 0; s < steps; s++) {
      const last = pts[pts.length - 1];
      // Rodrigues rotation of heading about the current surface normal
      const th = rng.range(-0.7, 0.7);
      const ct = Math.cos(th), st = Math.sin(th);
      const kd = last[0] * h[0] + last[1] * h[1] + last[2] * h[2];
      const cx = last[1] * h[2] - last[2] * h[1];
      const cy = last[2] * h[0] - last[0] * h[2];
      const cz = last[0] * h[1] - last[1] * h[0];
      const hx = h[0] * ct + cx * st + last[0] * kd * (1 - ct);
      const hy = h[1] * ct + cy * st + last[1] * kd * (1 - ct);
      const hz = h[2] * ct + cz * st + last[2] * kd * (1 - ct);
      const dp = hx * last[0] + hy * last[1] + hz * last[2];
      h = [hx - last[0] * dp, hy - last[1] * dp, hz - last[2] * dp];
      hl = Math.hypot(h[0], h[1], h[2]);
      if (hl < 1e-6) h = unitVec(rng);
      else h = h.map((v) => v / hl);
      const nx = last[0] + h[0] * stepLen, ny = last[1] + h[1] * stepLen, nz = last[2] + h[2] * stepLen;
      const nl = Math.hypot(nx, ny, nz);
      pts.push([nx / nl, ny / nl, nz / nl]);
    }
    return pts;
  };

  /* LIVING GALAXY: seams are sized for the mesh they land on. The generator's
   * own widths are drawn for a 56–158-cell survey mesh; a game body is 7–18
   * cells, where a 0.04-chord vein falls between vertices and the rock reads
   * as bare. featureScale widens what is drawn; featureDensity multiplies the
   * class weight that decides how many nets and spots each ore gets. Both
   * default to 1, which is the generator exactly as shipped. */
  const featureScale = params.featureScale ?? 1;
  const featureDensity = params.featureDensity ?? 1;
  const features = [];
  for (const k of ranked) {
    const spec = ORES[k];
    const weight = klass.ores[k] * featureDensity;
    const nNets = Math.max(0, Math.round(weight * richness * 2.2));
    for (let v = 0; v < nNets; v++) {
      const root = unitVec(rng);
      const main = walkPath(root, rng.int(5, 11), rng.range(0.09, 0.16));
      const paths = [main];
      const branches = rng.int(2, 5);
      for (let b = 0; b < branches; b++) {
        const fork = main[rng.int(2, main.length - 2)] || root;
        paths.push(walkPath(fork, rng.int(3, 7), rng.range(0.07, 0.12)));
      }
      const width = rng.range(0.028, 0.055) * featureScale;
      const segs = [];
      let cx = 0, cy = 0, cz = 0, np = 0;
      for (const path of paths) {
        for (let s = 1; s < path.length; s++) segs.push(path[s - 1], path[s]);
        for (const p of path) { cx += p[0]; cy += p[1]; cz += p[2]; np++; }
      }
      const cl = Math.hypot(cx, cy, cz) || 1;
      const ctr = [cx / cl, cy / cl, cz / cl];
      let reach = 0;
      for (const path of paths) for (const p of path) reach = Math.max(reach, Math.hypot(p[0] - ctr[0], p[1] - ctr[1], p[2] - ctr[2]));
      features.push({ kind: 'vein', id: k, segs, ctr, reach2: Math.pow(reach + width, 2), width, strength: rng.range(0.62, 0.95) });
    }
    const nSmall = Math.max(0, Math.round(weight * richness * 4 + (1 - spec.rarity) * 0.6));
    for (let v = 0; v < nSmall; v++) {
      features.push({ kind: 'spot', id: k, dir: unitVec(rng), radius: rng.range(0.03, 0.07) * featureScale, strength: rng.range(0.5, 0.9) });
    }
    const nLarge = Math.max(0, Math.round(weight * richness * 0.9));
    for (let v = 0; v < nLarge; v++) {
      features.push({ kind: 'spot', id: k, dir: unitVec(rng), radius: rng.range(0.08, 0.14) * featureScale, strength: rng.range(0.45, 0.78) });
    }
  }

  const oreAtVertex = new Array(count);
  const oreScore = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const x = dirs[i * 3], y = dirs[i * 3 + 1], z = dirs[i * 3 + 2];
    let bestId = null;
    let bestScore = 0.38;
    for (let f = 0; f < features.length; f++) {
      const F = features[f];
      let fall = 0;
      if (F.kind === 'vein') {
        const ex = x - F.ctr[0], ey = y - F.ctr[1], ez = z - F.ctr[2];
        if (ex * ex + ey * ey + ez * ez > F.reach2) continue;
        let dmin = 10;
        const S = F.segs;
        for (let s = 0; s < S.length; s += 2) {
          const a = S[s], b = S[s + 1];
          const abx = b[0] - a[0], aby = b[1] - a[1], abz = b[2] - a[2];
          const ab2 = abx * abx + aby * aby + abz * abz + 1e-8;
          let t = ((x - a[0]) * abx + (y - a[1]) * aby + (z - a[2]) * abz) / ab2;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const dx = x - (a[0] + abx * t), dy = y - (a[1] + aby * t), dz = z - (a[2] + abz * t);
          const d = dx * dx + dy * dy + dz * dz;
          if (d < dmin) dmin = d;
        }
        fall = Math.max(0, 1 - Math.sqrt(dmin) / F.width);
      } else {
        const dx = x - F.dir[0], dy = y - F.dir[1], dz = z - F.dir[2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 >= F.radius * F.radius) continue;
        fall = 1 - Math.sqrt(d2) / F.radius;
      }
      fall *= fall;
      if (fall <= 0) continue;
      const score = fall * F.strength;
      if (score > bestScore) {
        bestScore = score;
        bestId = F.id;
      }
    }
    oreScore[i] = bestId ? bestScore : 0;
    oreAtVertex[i] = bestId;
    if (bestId) {
      const spec = ORES[bestId];
      const ridge = smoothstep(0.28, 0.8, bestScore);
      const sign = spec.metalness > 0.5 || spec.category === 'PGE' || spec.category === 'native metal' ? 1 : -0.35;
      radius[i] += sign * ridge * 0.045;
    }
  }

  /* ---- positions, normals, cavity */
  const positions = new Float32Array(count * 3);
  let maxR = 0;
  for (let i = 0; i < count; i++) {
    const r = radius[i] * meshRadius;
    positions[i * 3] = dirs[i * 3] * r;
    positions[i * 3 + 1] = dirs[i * 3 + 1] * r;
    positions[i * 3 + 2] = dirs[i * 3 + 2] * r;
    if (r > maxR) maxR = r;
  }
  const normals = computeNormals(positions, index);
  const adj = buildAdjacency(count, index);
  const smoothR = smoothField(radius, adj, 3);
  const lap = new Float32Array(count);
  let lapScale = 0;
  {
    const sample = [];
    for (let i = 0; i < count; i++) {
      lap[i] = smoothR[i] - radius[i];
      if (lap[i] > 0 && i % 7 === 0) sample.push(lap[i]);
    }
    sample.sort((a, b) => a - b);
    lapScale = sample.length ? sample[Math.floor(sample.length * 0.95)] || 1e-4 : 1e-4;
  }

  /* ---- colours / PBR attributes */
  const colors = new Float32Array(count * 3);
  const metals = new Float32Array(count);
  const roughs = new Float32Array(count);
  const emits = new Float32Array(count * 3);
  const base = hexToRgb(klass.baseColor);
  const accent = hexToRgb(klass.accent);

  let iceWeight = 0;
  for (const k of oreKeys) if (ORES[k].category === 'ice' || k === 'ice' || k === 'water_ice') iceWeight += klass.ores[k];
  const iceAffinity = Math.min(1, iceWeight * 3);
  const frostRgb = { r: 0.74, g: 0.84, b: 0.92 };
  const pondRgb = mixRgb(base, accent, 0.6);
  let frostVerts = 0;

  for (let i = 0; i < count; i++) {
    const x = dirs[i * 3], y = dirs[i * 3 + 1], z = dirs[i * 3 + 2];
    const bestId = oreAtVertex[i];
    const bestScore = oreScore[i];

    const ndir = normals[i * 3] * x + normals[i * 3 + 1] * y + normals[i * 3 + 2] * z;
    const exposed = Math.max(smoothstep(0.9, 0.55, ndir), freshArr[i] * 0.9, facetArr[i] * 0.55);
    const lapC = Math.max(-1, Math.min(1, lap[i] / lapScale));
    const cavity = Math.min(1, Math.max(0, cavArr[i] * 5 + Math.max(0, lapC) * 0.55 + (rBaseArr[i] - radius[i]) * 2.5));
    const convex = Math.max(0, -lapC);
    const pond = pondArr[i];

    const mottling = 0.5 + 0.5 * valueNoise3(x * 3.4, y * 3.4, z * 3.4, seed + 5);
    const dust = fbm(x * 7.5, y * 7.5, z * 7.5, seed + 21, 3);
    let rock = mixRgb(base, accent, mottling * 0.38);
    const dj = 0.86 + dust * 0.2;
    rock.r *= dj; rock.g *= dj; rock.b *= dj;

    // bedrock on scarps / fresh ejecta is brighter & less space-weathered
    rock = mixRgb(rock, { r: accent.r * 1.3, g: accent.g * 1.3, b: accent.b * 1.3 }, exposed * 0.45);
    const lift = 1 + freshArr[i] * 0.4 + convex * 0.08;
    // ponded fine regolith
    rock = mixRgb(rock, { r: pondRgb.r * 1.08, g: pondRgb.g * 1.08, b: pondRgb.b * 1.06 }, pond * 0.7);
    const ao = 1 - 0.42 * cavity;
    rock.r *= lift * ao; rock.g *= lift * ao; rock.b *= lift * ao;

    let rough = Math.min(0.94, klass.roughness * (0.92 + mottling * 0.12) + pond * 0.06 - exposed * 0.05);
    let metal = klass.metalness * (0.85 + dust * 0.2);
    let er = 0, eg = 0, eb = 0;

    // frost in cold traps (crater floors, grooves, high latitude)
    if (iceAffinity > 0) {
      const lat = Math.abs(x * spinAxis[0] + y * spinAxis[1] + z * spinAxis[2]);
      const trap = cavity * 0.9 + pond * 0.4 + smoothstep(0.8, 0.97, lat) * 0.6;
      const breakup = 0.5 + 0.5 * valueNoise3(x * 6.2, y * 6.2, z * 6.2, seed + 77);
      const frost = iceAffinity * smoothstep(0.35, 0.85, trap * (0.6 + breakup * 0.7));
      if (frost > 0.01) {
        rock = mixRgb(rock, frostRgb, frost * 0.82);
        rough += (0.28 - rough) * frost;
        metal *= 1 - frost;
        er += 0.02 * frost; eg += 0.035 * frost; eb += 0.05 * frost;
        if (frost > 0.4) frostVerts++;
      }
    }

    let albedo = rock;
    if (bestId) {
      const spec = ORES[bestId];
      const oc = hexToRgb(spec.color);
      const shadeN = 0.5 + 0.5 * valueNoise3(x * 9.2, y * 9.2, z * 9.2, oreSeeds[bestId] + 44);
      const oreCol = shadeShift(oc, spec.metalness > 0.55 ? shadeN * 0.45 + 0.12 : shadeN);
      const grainMix = 0.12 * valueNoise3(x * 18, y * 18, z * 18, oreSeeds[bestId] + 70);
      oreCol.r = Math.min(1, oreCol.r * (1 - grainMix) + oc.r * grainMix);
      oreCol.g = Math.min(1, oreCol.g * (1 - grainMix) + oc.g * grainMix);
      oreCol.b = Math.min(1, oreCol.b * (1 - grainMix) + oc.b * grainMix);
      const oao = 1 - 0.25 * cavity;
      oreCol.r *= oao; oreCol.g *= oao; oreCol.b *= oao;

      const blend = smoothstep(0.42, 0.95, bestScore) * 0.78;
      albedo = mixRgb(rock, oreCol, blend);
      metal += (spec.metalness - metal) * blend;
      rough += (spec.roughness - rough) * blend;
      if (spec.glow > 0) {
        const em = hexToRgb(spec.emissive || spec.color);
        const gi = spec.glow * blend;
        er = em.r * gi; eg = em.g * gi; eb = em.b * gi;
      }
      composition[bestId]++;
    } else {
      composition._rock++;
    }

    colors[i * 3] = Math.min(1, albedo.r);
    colors[i * 3 + 1] = Math.min(1, albedo.g);
    colors[i * 3 + 2] = Math.min(1, albedo.b);
    metals[i] = metal;
    roughs[i] = Math.max(0.05, Math.min(0.96, rough));
    emits[i * 3] = er;
    emits[i * 3 + 1] = eg;
    emits[i * 3 + 2] = eb;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aMetal', new THREE.BufferAttribute(metals, 1));
  geo.setAttribute('aRough', new THREE.BufferAttribute(roughs, 1));
  geo.setAttribute('aEmit', new THREE.BufferAttribute(emits, 3));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  geo.computeBoundingSphere();

  const triCount = index.length / 3;
  const totalVerts = count;
  const compositionPct = {};
  let oreMassFrac = 0;
  for (const k of Object.keys(composition)) {
    const pct = (composition[k] / totalVerts) * 100;
    compositionPct[k] = pct;
    if (k !== '_rock') oreMassFrac += pct / 100;
  }

  const volumeM3 = (4 / 3) * Math.PI * Math.pow(radiusM, 3);
  const massKg = volumeM3 * klass.density;
  let valueUsd = 0;
  const valueBreakdown = [];
  for (const k of oreKeys) {
    const spec = ORES[k];
    const frac = (composition[k] || 0) / totalVerts;
    const recoverable = frac * 0.35 * richness * (spec.yield ?? 1);
    const kg = massKg * recoverable;
    const unit = spec.refinedValue && spec.refine ? spec.refinedValue * spec.refine.per : spec.value;
    const usd = kg * unit;
    if (kg > 0.01) {
      valueBreakdown.push({ id: k, name: spec.name, kg, usd, pct: compositionPct[k] });
      valueUsd += usd;
    }
  }
  valueBreakdown.sort((a, b) => b.usd - a.usd);

  return {
    geometry: geo,
    oreAtVertex,
    classId,
    klass,
    seed: seedStr,
    seedNum: seed,
    radiusM,
    roughness,
    craterDensity,
    richness,
    composition,
    compositionPct,
    oreMassFrac,
    massKg,
    volumeM3,
    valueUsd,
    valueBreakdown,
    meshRadius,
    maxRadius: maxR,
    spinAxis,
    iceAffinity,
    frostPct: (frostVerts / count) * 100,
    craterCount: craters.length,
    grooveCount: grooves.length,
    vertexCount: count,
    triangleCount: triCount,
    shapeKind,
    version: GENERATOR_VERSION,
    params: { classId, radiusM, roughness, craterDensity, richness, detail: params.detail || 'high', shapeKind },
  };
}

/**
 * Near-surface rubble: meshed boulders seated on the regolith plus a lofted
 * halo of chips and specks. Rock variants come from debris.js.
 */
export function buildRubbleField(asteroid, seedStr) {
  const rng = new RNG(hashString(String(seedStr) + ':rubble'));
  const group = new THREE.Group();
  group.name = 'rubble';
  const geo = asteroid.geometry;
  const pos = geo.attributes.position;
  const col = geo.attributes.color;
  const nrm = geo.attributes.normal;
  if (!pos || !col) return group;

  const variants = [];
  for (let v = 0; v < 4; v++) variants.push({ geo: makeRockGeometry(rng, { detail: v === 0 ? 1 : 2 }), items: [] });
  const N = asteroid.shapeKind === 'rubble-pile' ? 280 : 120;
  const iceAff = asteroid.iceAffinity || 0;
  for (let i = 0; i < N; i++) {
    let vi = Math.floor(rng.next() * pos.count);
    const seated = rng.next() < (asteroid.shapeKind === 'rubble-pile' ? 0.82 : 0.62);
    let nx = nrm.getX(vi), ny = nrm.getY(vi), nz = nrm.getZ(vi);
    const px = pos.getX(vi), py = pos.getY(vi), pz = pos.getZ(vi);
    const pl = Math.hypot(px, py, pz) || 1;
    // boulders prefer level ground; retry once on steep slopes
    if (seated && (nx * px + ny * py + nz * pz) / pl < 0.8) {
      vi = Math.floor(rng.next() * pos.count);
      nx = nrm.getX(vi); ny = nrm.getY(vi); nz = nrm.getZ(vi);
    }
    const qx = pos.getX(vi), qy = pos.getY(vi), qz = pos.getZ(vi);
    const s = seated
      ? (rng.next() < 0.12 ? rng.range(0.06, 0.12) : powerLaw(rng, 0.014, 0.06, 2.2))
      : (rng.next() < 0.18 ? rng.range(0.05, 0.1) : rng.range(0.012, 0.036));
    let ox, oy, oz;
    if (seated) {
      ox = qx + nx * s * 0.35; oy = qy + ny * s * 0.35; oz = qz + nz * s * 0.35;
    } else {
      const t = unitVec(rng);
      const loft = rng.range(0.05, 0.24);
      const orbit = rng.range(0.15, 1.3);
      ox = qx + nx * loft + t[0] * orbit; oy = qy + ny * loft + t[1] * orbit; oz = qz + nz * loft + t[2] * orbit;
    }
    const j = rng.range(0.85, 1.2);
    const frost = iceAff * rng.next();
    const c = [col.getX(vi) * j, col.getY(vi) * j, col.getZ(vi) * j].map((v, k) => Math.min(1, v + frost * ([0.62, 0.72, 0.82][k] - v) * 0.5));
    variants[Math.floor(rng.next() * variants.length)].items.push({
      p: [ox, oy, oz], s,
      stretch: [rng.range(0.8, 1.3), rng.range(0.6, 1), rng.range(0.8, 1.2)],
      rot: [rng.range(0, Math.PI), rng.range(0, Math.PI), rng.range(0, Math.PI)],
      c,
    });
  }

  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0.1, flatShading: true });
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  for (const v of variants) {
    if (!v.items.length) {
      v.geo.dispose();
      continue;
    }
    const mesh = new THREE.InstancedMesh(v.geo, mat, v.items.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    v.items.forEach((it, i) => {
      dummy.position.set(it.p[0], it.p[1], it.p[2]);
      dummy.rotation.set(it.rot[0], it.rot[1], it.rot[2]);
      dummy.scale.set(it.s * it.stretch[0], it.s * it.stretch[1], it.s * it.stretch[2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.setRGB(it.c[0], it.c[1], it.c[2]);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    group.add(mesh);
  }

  const specks = 420;
  const sp = new Float32Array(specks * 3);
  const sc = new Float32Array(specks * 3);
  for (let i = 0; i < specks; i++) {
    const vi = Math.floor(rng.next() * pos.count);
    const px = pos.getX(vi), py = pos.getY(vi), pz = pos.getZ(vi);
    const l = Math.hypot(px, py, pz) || 1;
    const t = unitVec(rng);
    const up = rng.range(0.02, 0.55);
    const side = rng.range(0.05, 1.1);
    sp[i * 3] = px + (px / l) * up + t[0] * side;
    sp[i * 3 + 1] = py + (py / l) * up + t[1] * side;
    sp[i * 3 + 2] = pz + (pz / l) * up + t[2] * side;
    const j = 0.82 + rng.next() * 0.25;
    sc[i * 3] = Math.min(1, col.getX(vi) * j);
    sc[i * 3 + 1] = Math.min(1, col.getY(vi) * j);
    sc[i * 3 + 2] = Math.min(1, col.getZ(vi) * j);
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  pg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  group.add(
    new THREE.Points(
      pg,
      new THREE.PointsMaterial({ size: 0.028, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, sizeAttenuation: true })
    )
  );
  return group;
}

export function makeRockMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.35,
    roughness: 0.55,
    flatShading: false,
    envMapIntensity: 0.48,
    color: 0xffffff,
    emissive: 0x000000,
    emissiveIntensity: 1,
  });

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aMetal;
attribute float aRough;
attribute vec3 aEmit;
varying float vMetalA;
varying float vRoughA;
varying vec3 vEmitA;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vMetalA = aMetal;
vRoughA = aRough;
vEmitA = aEmit;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying float vMetalA;
varying float vRoughA;
varying vec3 vEmitA;`
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
metalnessFactor = vMetalA;`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
roughnessFactor = vRoughA;`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
totalEmissiveRadiance = vEmitA;`
      );
  };

  mat.customProgramCacheKey = () => 'asteroid-terrain-pbr-v2';
  return mat;
}
