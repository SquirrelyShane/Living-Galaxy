/**
 * Fracture: split a body mesh into Voronoi chunks and animate them on the GPU.
 *
 * fractureGeometry() tags every vertex with a chunk id (aChunk) and a crack
 * proximity (aCrack, 1 on a cell border) using a noise-warped 3D Voronoi, so
 * crack lines wander like real fractures.
 *
 * v1.8: detached chunks are driven from the CPU (tidal.js / impact-sim.js run the
 * physics). Per chunk the shader gets its centre and orientation in the mesh's
 * local frame plus heat, visibility and a spaghettification stretch; it only
 * places, stretches (along the direction to the hole, uBHLocal), morphs and
 * shades. The attached remainder rides the mesh with a strain bulge.
 *
 * Heat maps to an incandescence ramp (dull red → orange → yellow-white →
 * compressed blue-white).
 *
 * Chunks are solid: every crack edge of a chunk's surface patch is walled down
 * through a rough inner ring to an apex inside the body (closed, consistently
 * wound). Inner faces carry aInner = depth (crust → mantle → core), so fresh
 * fracture faces read as rock that glows molten toward the core when hot.
 * uVeins lights wandering molten veins across the surface (noise iso-lines +
 * crack seams) — planets once their atmosphere is gone, strained asteroids,
 * impact survivors.
 *
 * Re-forming (FRACTURE_MORPH): every chunk also gets a rounded target shape —
 * a volume-matched ellipsoid fitted to the piece (PCA), lumpy, with a few
 * small craters — as aMorph / aMorphN. After its reform delay (uChunkC.w) a
 * detached piece relaxes from jagged wedge into a new small asteroid, keeping
 * its original surface and fresh-rock fracture patches. Planet pieces skip it
 * and stay visibly broken.
 *
 */
import * as THREE from 'three';
import { RNG, hashString, unitVec, valueNoise3 } from './rng.js';

export const FRACTURE_MAX = 32;

/* ------------------------------------------------------------------ CPU */

/**
 * @param {THREE.BufferGeometry} geometry  indexed or not; needs position (+ optional color)
 * @returns {{ count, centroids: number[][], counts: number[], colors: number[][], radius: number, seeds: number[][] }}
 */
export function fractureGeometry(geometry, { chunks = 24, seed = 1, jitter = 0.16, crust = null, mantle = null, apexDepth = 0.3, morph = false } = {}) {
  const pos = geometry.attributes.position.array;
  const col = geometry.attributes.color?.array;
  const V = pos.length / 3;
  const n = Math.max(1, Math.min(FRACTURE_MAX, Math.round(chunks)));
  const rng = new RNG(hashString(String(seed) + ':fracture'));
  const nseed = hashString(String(seed) + ':crack');

  let radius = 0;
  for (let i = 0; i < V; i++) radius = Math.max(radius, Math.hypot(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]));

  const seeds = [];
  for (let k = 0; k < n; k++) {
    const d = unitVec(rng);
    const rr = radius * (n === 1 ? 0 : rng.range(0.5, 0.95));
    seeds.push([d[0] * rr, d[1] * rr, d[2] * rr]);
  }

  const aChunk = new Float32Array(V);
  const aCrack = new Float32Array(V);
  const sums = Array.from({ length: n }, () => [0, 0, 0]);
  const csum = Array.from({ length: n }, () => [0, 0, 0]);
  const counts = new Array(n).fill(0);
  const band = 0.07 * radius;
  const w = jitter * radius;
  const f = 2.2 / radius;
  for (let i = 0; i < V; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const qx = x + w * valueNoise3(x * f, y * f, z * f, nseed);
    const qy = y + w * valueNoise3(x * f, y * f, z * f, nseed + 11);
    const qz = z + w * valueNoise3(x * f, y * f, z * f, nseed + 23);
    let b1 = Infinity, b2 = Infinity, id = 0;
    for (let k = 0; k < n; k++) {
      const s = seeds[k];
      const d = (qx - s[0]) ** 2 + (qy - s[1]) ** 2 + (qz - s[2]) ** 2;
      if (d < b1) {
        b2 = b1;
        b1 = d;
        id = k;
      } else if (d < b2) {
        b2 = d;
      }
    }
    aChunk[i] = id;
    const gap = n === 1 ? Infinity : Math.sqrt(b2) - Math.sqrt(b1);
    const t = Math.max(0, Math.min(1, gap / band));
    aCrack[i] = 1 - t * t * (3 - 2 * t);
    counts[id]++;
    sums[id][0] += x;
    sums[id][1] += y;
    sums[id][2] += z;
    if (col) {
      csum[id][0] += col[i * 3];
      csum[id][1] += col[i * 3 + 1];
      csum[id][2] += col[i * 3 + 2];
    }
  }
  geometry.setAttribute('aChunk', new THREE.BufferAttribute(aChunk, 1));
  geometry.setAttribute('aCrack', new THREE.BufferAttribute(aCrack, 1));
  const split = splitAlongCracks(geometry, aChunk);
  const centroids = sums.map((s, k) => (counts[k] ? [s[0] / counts[k], s[1] / counts[k], s[2] / counts[k]] : seeds[k].slice()));
  const colors = csum.map((s, k) => (counts[k] && col ? [s[0] / counts[k], s[1] / counts[k], s[2] / counts[k]] : [0.4, 0.37, 0.33]));
  const info = { count: n, centroids, counts, colors, radius, seeds, vertexCount: V, splitVertices: split };
  info.interiorTriangles = solidifyChunks(geometry, info, { seed: nseed, crust, mantle, apexDepth });
  if (morph) info.morph = computeMorphTargets(geometry, info, nseed);
  return info;
}

/** Jacobi eigen-decomposition of a symmetric 3×3 → { values[3], vectors[3][3] (columns as rows) }. */
export function eigen3(m) {
  const a = [m[0].slice(), m[1].slice(), m[2].slice()];
  const v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let sweep = 0; sweep < 24; sweep++) {
    let off = Math.abs(a[0][1]) + Math.abs(a[0][2]) + Math.abs(a[1][2]);
    if (off < 1e-12) break;
    for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) {
      if (Math.abs(a[p][q]) < 1e-14) continue;
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < 3; k++) {
        const akp = a[k][p], akq = a[k][q];
        a[k][p] = c * akp - s * akq;
        a[k][q] = s * akp + c * akq;
      }
      for (let k = 0; k < 3; k++) {
        const apk = a[p][k], aqk = a[q][k];
        a[p][k] = c * apk - s * aqk;
        a[q][k] = s * apk + c * aqk;
      }
      for (let k = 0; k < 3; k++) {
        const vkp = v[k][p], vkq = v[k][q];
        v[k][p] = c * vkp - s * vkq;
        v[k][q] = s * vkp + c * vkq;
      }
    }
  }
  return { values: [a[0][0], a[1][1], a[2][2]], vectors: [0, 1, 2].map((j) => [v[0][j], v[1][j], v[2][j]]) };
}

/**
 * Rounded "new asteroid" target for every vertex of every chunk: star-shaped
 * projection from the chunk's volume centroid onto a fitted, volume-matched,
 * lumpy, cratered ellipsoid. Adds aMorph + aMorphN. Returns per-chunk shape info.
 */
function computeMorphTargets(geometry, info, seed) {
  const pos = geometry.attributes.position.array;
  const nrm = geometry.attributes.normal?.array;
  const ch = geometry.attributes.aChunk.array;
  const idx = geometry.index.array;
  const V = pos.length / 3;
  const n = info.count;
  // volume + volume centroid per chunk (closed meshes, origin tetrahedra)
  const vol = new Float64Array(n);
  const cen = Array.from({ length: n }, () => [0, 0, 0]);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const k = ch[idx[t]];
    const v6 = pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1]) - pos[a + 1] * (pos[b] * pos[c + 2] - pos[b + 2] * pos[c]) + pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c]);
    vol[k] += v6 / 6;
    for (let j = 0; j < 3; j++) cen[k][j] += (v6 / 6) * (pos[a + j] + pos[b + j] + pos[c + j]) / 4;
  }
  const shapes = [];
  const cov = Array.from({ length: n }, () => [[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
  const cnt = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    if (vol[k] > 1e-9) cen[k] = cen[k].map((v) => v / vol[k]);
    else cen[k] = info.centroids[k].slice();
  }
  for (let i = 0; i < V; i++) {
    const k = ch[i];
    const d = [pos[i * 3] - cen[k][0], pos[i * 3 + 1] - cen[k][1], pos[i * 3 + 2] - cen[k][2]];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cov[k][r][c] += d[r] * d[c];
    cnt[k]++;
  }
  const R = info.radius;
  for (let k = 0; k < n; k++) {
    const m = cov[k].map((row) => row.map((v) => v / Math.max(1, cnt[k])));
    const { values, vectors } = eigen3(m);
    let ax = values.map((l) => Math.sqrt(Math.max(1e-8, 3 * l)));
    const amax = Math.max(...ax);
    ax = ax.map((a) => Math.max(a, amax * 0.55)); // rubble re-accretes rounder than the shard
    const V0 = Math.max(1e-6, vol[k]);
    const s = Math.cbrt(V0 / ((4 / 3) * Math.PI * ax[0] * ax[1] * ax[2]));
    ax = ax.map((a) => a * s);
    const rng = new RNG(seed + 977 * (k + 1));
    const craters = [];
    const nc = rng.int(2, 5);
    for (let c = 0; c < nc; c++) craters.push({ d: unitVec(rng), r: rng.range(0.28, 0.55), depth: rng.range(0.06, 0.14) });
    shapes.push({ center: cen[k], axes: ax, basis: vectors, craters, lump: seed + 131 * (k + 1), volume: V0 });
  }
  const morph = new Float32Array(V * 3);
  const target = (i) => {
    const k = ch[i];
    const sh = shapes[k];
    let dx = pos[i * 3] - sh.center[0], dy = pos[i * 3 + 1] - sh.center[1], dz = pos[i * 3 + 2] - sh.center[2];
    let l = Math.hypot(dx, dy, dz);
    if (l < 1e-6 * R) {
      dx = nrm ? nrm[i * 3] : 0; dy = nrm ? nrm[i * 3 + 1] : 1; dz = nrm ? nrm[i * 3 + 2] : 0;
      l = Math.hypot(dx, dy, dz) || 1;
    }
    dx /= l; dy /= l; dz /= l;
    let q = 0;
    for (let j = 0; j < 3; j++) {
      const e = sh.basis[j];
      const u = (dx * e[0] + dy * e[1] + dz * e[2]) / sh.axes[j];
      q += u * u;
    }
    let r = 1 / Math.sqrt(q);
    const f = 1.7, g = 4.3;
    r *= 1 + 0.16 * valueNoise3(dx * f, dy * f, dz * f, sh.lump) + 0.05 * valueNoise3(dx * g, dy * g, dz * g, sh.lump + 7);
    for (const c of sh.craters) {
      const chord = Math.hypot(dx - c.d[0], dy - c.d[1], dz - c.d[2]) / c.r;
      if (chord < 1.4) r *= 1 - c.depth * (chord < 1 ? 1 - chord * chord : 0) + (chord >= 0.85 ? c.depth * 0.35 * Math.exp(-(((chord - 1) * 6) ** 2)) : 0);
    }
    return [sh.center[0] + dx * r, sh.center[1] + dy * r, sh.center[2] + dz * r];
  };
  for (let i = 0; i < V; i++) morph.set(target(i), i * 3);
  // star projection + craters lose volume: rescale each target about its centre to the shard's volume
  const vol1 = new Float64Array(n);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const k = ch[idx[t]], o = shapes[k].center;
    const ax = morph[a] - o[0], ay = morph[a + 1] - o[1], az = morph[a + 2] - o[2];
    const bx = morph[b] - o[0], by = morph[b + 1] - o[1], bz = morph[b + 2] - o[2];
    const cx = morph[c] - o[0], cy = morph[c + 1] - o[1], cz = morph[c + 2] - o[2];
    vol1[k] += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
  }
  for (let k = 0; k < n; k++) shapes[k].scale = vol1[k] > 1e-9 ? Math.max(0.8, Math.min(1.6, Math.cbrt(shapes[k].volume / vol1[k]))) : 1;
  for (let i = 0; i < V; i++) {
    const sh = shapes[ch[i]];
    for (let j = 0; j < 3; j++) morph[i * 3 + j] = sh.center[j] + (morph[i * 3 + j] - sh.center[j]) * sh.scale;
  }

  // smooth target normals shared by coincident target positions inside a chunk
  const acc = new Map();
  const key = (i) => `${ch[i]}|${Math.round(morph[i * 3] * 4e3)}|${Math.round(morph[i * 3 + 1] * 4e3)}|${Math.round(morph[i * 3 + 2] * 4e3)}`;
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t], b = idx[t + 1], c = idx[t + 2];
    const ux = morph[b * 3] - morph[a * 3], uy = morph[b * 3 + 1] - morph[a * 3 + 1], uz = morph[b * 3 + 2] - morph[a * 3 + 2];
    const vx = morph[c * 3] - morph[a * 3], vy = morph[c * 3 + 1] - morph[a * 3 + 1], vz = morph[c * 3 + 2] - morph[a * 3 + 2];
    const fn = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    for (const v of [a, b, c]) {
      const kk = key(v);
      const e = acc.get(kk) || [0, 0, 0];
      e[0] += fn[0]; e[1] += fn[1]; e[2] += fn[2];
      acc.set(kk, e);
    }
  }
  const morphN = new Float32Array(V * 3);
  for (let i = 0; i < V; i++) {
    const e = acc.get(key(i)) || [0, 1, 0];
    const l = Math.hypot(e[0], e[1], e[2]) || 1;
    morphN.set([e[0] / l, e[1] / l, e[2] / l], i * 3);
  }
  geometry.setAttribute('aMorph', new THREE.BufferAttribute(morph, 3));
  geometry.setAttribute('aMorphN', new THREE.BufferAttribute(morphN, 3));
  return shapes;
}

/**
 * Close every chunk into a solid: for each crack (boundary) edge a→b of a chunk's
 * surface patch add a wall strip b→a → inner ring → apex. The inner ring is
 * noise-displaced so fracture faces are rough. Adds flat-shaded, non-indexed
 * triangles appended to the index. Returns the number of triangles added.
 */
function solidifyChunks(geometry, info, { seed, crust, mantle, apexDepth }) {
  const index = geometry.index;
  if (!index) return 0;
  const idx = index.array;
  const pos = geometry.attributes.position.array;
  const chunkAttr = geometry.attributes.aChunk.array;
  const V = pos.length / 3;

  // boundary edges appear exactly once (crack split gave each chunk its own vertices)
  const edgeCount = new Map();
  const key = (a, b) => (a < b ? a * 4294967296 + b : b * 4294967296 + a);
  for (let t = 0; t < idx.length; t += 3) {
    for (let j = 0; j < 3; j++) {
      const k = key(idx[t + j], idx[t + (j + 1) % 3]);
      edgeCount.set(k, (edgeCount.get(k) || 0) + 1);
    }
  }
  const R = info.radius;
  const apex = info.centroids.map((c) => [c[0] * apexDepth, c[1] * apexDepth, c[2] * apexDepth]);

  // The crack boundary zig-zags along triangle edges; walling straight down from it folds
  // the inner ring over itself. Smooth each boundary loop first (neighbours along the loop).
  const loopNb = new Map(); // boundary vertex → [prev, next]
  for (let t = 0; t < idx.length; t += 3) {
    for (let j = 0; j < 3; j++) {
      const a = idx[t + j], b = idx[t + (j + 1) % 3];
      if (edgeCount.get(key(a, b)) !== 1) continue;
      (loopNb.get(a) || loopNb.set(a, [-1, -1]).get(a))[1] = b;
      (loopNb.get(b) || loopNb.set(b, [-1, -1]).get(b))[0] = a;
    }
  }
  let smooth = new Map();
  for (const v of loopNb.keys()) smooth.set(v, [pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]]);
  for (let it = 0; it < 6; it++) {
    const nextS = new Map();
    for (const [v, nb] of loopNb) {
      const c = smooth.get(v);
      const pa = smooth.get(nb[0]) || c, pb = smooth.get(nb[1]) || c;
      nextS.set(v, [(pa[0] + 2 * c[0] + pb[0]) / 4, (pa[1] + 2 * c[1] + pb[1]) / 4, (pa[2] + 2 * c[2] + pb[2]) / 4]);
    }
    smooth = nextS;
  }
  const ringCache = new Map();
  const ring = (v, k) => {
    const rk = v * 64 + k;
    let p = ringCache.get(rk);
    if (!p) {
      const [x, y, z] = smooth.get(v);
      const a = apex[k];
      const f = 2.4 / R;
      const j = 0.03 * R;
      p = [
        x + (a[0] - x) * 0.5 + j * valueNoise3(x * f, y * f, z * f, seed + 101),
        y + (a[1] - y) * 0.5 + j * valueNoise3(x * f, y * f, z * f, seed + 131),
        z + (a[2] - z) * 0.5 + j * valueNoise3(x * f, y * f, z * f, seed + 151),
      ];
      ringCache.set(rk, p);
    }
    return p;
  };

  const tris = []; // [p0, p1, p2, depth0, depth1, depth2, chunk, srcVertex]
  for (let t = 0; t < idx.length; t += 3) {
    for (let j = 0; j < 3; j++) {
      const a = idx[t + j], b = idx[t + (j + 1) % 3];
      if (edgeCount.get(key(a, b)) !== 1) continue;
      const k = chunkAttr[a];
      const pa = [pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2]];
      const pb = [pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2]];
      const ra = ring(a, k), rb = ring(b, k);
      const sa = smooth.get(a), sb = smooth.get(b);
      // shading normals come from the smoothed loop so the jagged crack edge does not stripe
      const t1 = [pb, pa, ra, 0.05, 0.05, 0.5, k, a]; t1.ns = [sb, sa, ra];
      const t2 = [pb, ra, rb, 0.05, 0.5, 0.5, k, b]; t2.ns = [sb, ra, rb];
      const t3 = [rb, ra, apex[k], 0.5, 0.5, 1, k, a]; t3.ns = [rb, ra, apex[k]];
      tris.push(t1, t2, t3);
    }
  }
  if (!tris.length) return 0;

  const N = tris.length * 3;
  const total = V + N;
  const next = {};
  for (const [name, attr] of Object.entries(geometry.attributes)) {
    const dst = new attr.array.constructor(total * attr.itemSize);
    dst.set(attr.array);
    next[name] = dst;
  }
  const inner = new Float32Array(total);
  const col = next.color;
  const rngC = new RNG(seed + 7);
  const chunkShade = info.colors.map((c) => {
    const j = rngC.range(0.85, 1.1);
    return { crust: mixc(c, crust || c.map((v) => v * 0.55), crust ? 0.75 : 1).map((v) => v * j), mantle: mantle || c.map((v) => v * 0.3) };
  });
  // smooth normals across each chunk's fracture walls (positions shared per chunk), so the
  // fan of thin wall triangles shades as one rough surface instead of stripes
  const nAcc = new Map();
  const pk = (p, k) => `${k}|${Math.round(p[0] * 2e3)}|${Math.round(p[1] * 2e3)}|${Math.round(p[2] * 2e3)}`;
  for (const tr of tris) {
    const [p0, p1, p2] = tr.ns;
    const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2];
    const vx = p2[0] - p0[0], vy = p2[1] - p0[1], vz = p2[2] - p0[2];
    const fn = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    tr.fn = fn;
    for (let c = 0; c < 3; c++) {
      const key2 = pk(tr[c], tr[6]);
      const a = nAcc.get(key2) || [0, 0, 0];
      // accumulate at the real vertex key so both jagged and smoothed corners share it
      a[0] += fn[0]; a[1] += fn[1]; a[2] += fn[2];
      nAcc.set(key2, a);
    }
  }
  let o = V;
  const newIdx = new Uint32Array(idx.length + N);
  newIdx.set(idx);
  let io = idx.length;
  for (const tr of tris) {
    const k = tr[6];
    for (let c = 0; c < 3; c++) {
      const p = tr[c];
      next.position.set(p, o * 3);
      if (next.normal) {
        const a = c < 2 || tr[5] !== 1 ? nAcc.get(pk(p, k)) : tr.fn; // apex keeps its own face normal
        const l = Math.hypot(a[0], a[1], a[2]) || 1;
        next.normal.set([a[0] / l, a[1] / l, a[2] / l], o * 3);
      }
      const d = tr[3 + c];
      inner[o] = d;
      if (next.aChunk) next.aChunk[o] = k;
      if (next.aCrack) next.aCrack[o] = 1 - d;
      if (col) {
        const sh = chunkShade[k];
        // low-frequency tint from the smoothed loop only (per-vertex high frequencies smear into radial stripes);
        // fine grain is added per pixel in the shader
        const ps = tr.ns[c];
        const grain = 0.8 + 0.4 * (0.5 + 0.5 * valueNoise3(ps[0] * 3.5 / R, ps[1] * 3.5 / R, ps[2] * 3.5 / R, seed + 211));
        const m = mixc(sh.crust, sh.mantle, Math.min(1, d * 1.1));
        col.set([m[0] * grain, m[1] * grain, m[2] * grain].map((v) => Math.min(1, v)), o * 3);
      }
      if (next.aRough) next.aRough[o] = 0.95;
      if (next.aMetal) next.aMetal[o] = 0.04;
      // aEmit and any other attributes stay zero on fracture faces
      newIdx[io++] = o;
      o++;
    }
  }
  for (const [name, dst] of Object.entries(next)) geometry.setAttribute(name, new THREE.BufferAttribute(dst, geometry.attributes[name].itemSize));
  geometry.setAttribute('aInner', new THREE.BufferAttribute(inner, 1));
  geometry.setIndex(new THREE.BufferAttribute(newIdx, 1));
  return tris.length;
}

function mixc(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * Give every triangle exactly one owning chunk (majority of its corners) and
 * duplicate corner vertices that belong to another chunk, so separating chunks
 * never stretch a triangle across the gap. Extends every vertex attribute.
 * @returns {number} vertices added
 */
function splitAlongCracks(geometry, aChunk) {
  const index = geometry.index;
  if (!index) return 0;
  const idx = index.array;
  const V = aChunk.length;
  const extra = [];
  const dupKey = new Map();
  const out = new Uint32Array(idx.length);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t], b = idx[t + 1], c = idx[t + 2];
    const ca = aChunk[a], cb = aChunk[b], cc = aChunk[c];
    const own = ca === cb || ca === cc ? ca : cb === cc ? cb : ca;
    for (let j = 0; j < 3; j++) {
      const v = idx[t + j];
      if (aChunk[v] === own) {
        out[t + j] = v;
        continue;
      }
      const key = v * 64 + own;
      let nv = dupKey.get(key);
      if (nv === undefined) {
        nv = V + extra.length;
        extra.push([v, own]);
        dupKey.set(key, nv);
      }
      out[t + j] = nv;
    }
  }
  if (!extra.length) return 0;
  for (const [name, attr] of Object.entries(geometry.attributes)) {
    const size = attr.itemSize;
    const src = attr.array;
    const dst = new src.constructor((V + extra.length) * size);
    dst.set(src.subarray(0, V * size));
    for (let e = 0; e < extra.length; e++) {
      const [v, own] = extra[e];
      for (let k = 0; k < size; k++) dst[(V + e) * size + k] = src[v * size + k];
      if (name === 'aChunk') dst[V + e] = own;
      if (name === 'aCrack') dst[V + e] = 1;
    }
    geometry.setAttribute(name, new THREE.BufferAttribute(dst, size));
  }
  geometry.setIndex(new THREE.BufferAttribute(out, 1));
  return extra.length;
}

/** Shared uniform objects for one fractured body. */
export function createFractureUniforms() {
  const A = new Float32Array(FRACTURE_MAX * 4);
  const C = new Float32Array(FRACTURE_MAX * 4);
  const D = new Float32Array(FRACTURE_MAX * 4);
  for (let k = 0; k < FRACTURE_MAX; k++) {
    A[k * 4 + 3] = -1; // all attached
    C[k * 4 + 1] = 1; // visible
    C[k * 4 + 2] = 1; // no stretch
    D[k * 4 + 3] = 1; // identity orientation
  }
  return {
    uTime: { value: 0 },
    uChunkA: { value: A },
    uChunkB: { value: new Float32Array(FRACTURE_MAX * 4) },
    uChunkC: { value: C },
    uChunkD: { value: D },
    uBHLocal: { value: [0, 0, 0] },
    uStress: { value: 0 },
    uStressDir: { value: [1, 0, 0] },
    uCoreHeat: { value: 0 },
    uVeins: { value: 0 },
    uVeinScale: { value: 1.3 },
  };
}

/** Reset one chunk slot to attached. */
export function resetFractureChunk(u, k) {
  u.uChunkA.value.set([0, 0, 0, -1], k * 4);
  u.uChunkB.value.set([0, 0, 0, 0], k * 4);
  u.uChunkC.value.set([0, 1, 1, 0], k * 4);
  u.uChunkD.value.set([0, 0, 0, 1], k * 4);
}

/* ----------------------------------------------------------------- GLSL */

export const FRACTURE_GLSL = {
  vertexPars: /* glsl */ `
uniform float uTime;
uniform vec4 uChunkA[FRACTURE_MAX];  // centroid.xyz (local), detach time (< 0 = attached)
uniform vec4 uChunkB[FRACTURE_MAX];  // centre now (local) · w = seed
uniform vec4 uChunkC[FRACTURE_MAX];  // heat, visibility, stretch (1 = none), reform delay (s after detach, 0 = never)
uniform vec4 uChunkD[FRACTURE_MAX];  // orientation quaternion (local frame)
uniform vec3 uBHLocal;               // hole in the mesh's local frame (stretch axis)
uniform float uStress;
uniform vec3 uStressDir;
attribute float aChunk;
attribute float aCrack;
attribute float aInner;
#ifdef FRACTURE_MORPH
attribute vec3 aMorph;
attribute vec3 aMorphN;
#endif
vec3 gFracNormal;
varying float vFracHeat;
varying float vFracCrack;
varying float vFracInner;
varying vec3 vFracPos;
mat3 fracQuat(vec4 q) {
  float x = q.x, y = q.y, z = q.z, w = q.w;
  return mat3(
    1.0 - 2.0 * (y * y + z * z), 2.0 * (x * y + z * w),       2.0 * (x * z - y * w),
    2.0 * (x * y - z * w),       1.0 - 2.0 * (x * x + z * z), 2.0 * (y * z + x * w),
    2.0 * (x * z + y * w),       2.0 * (y * z - x * w),       1.0 - 2.0 * (x * x + y * y));
}
vec3 fractureVertex(vec3 pos, out mat3 R, out float heat) {
  int id = int(aChunk + 0.5);
  vec4 A = uChunkA[id];
  vec4 B = uChunkB[id];
  vec4 C = uChunkC[id];
  R = mat3(1.0);
  vFracInner = aInner;
  vFracPos = pos;
  gFracNormal = normal;
  if (A.w < 0.0) {
    // still attached: tidal bulge toward/away from the hole, cracks glow under strain
    float along = dot(pos, uStressDir);
    heat = uStress * (0.06 + 0.85 * aCrack * aCrack);
    return pos + uStressDir * along * uStress * 0.12;
  }
  float tau = max(0.0, uTime - A.w);
  vec3 c = A.xyz;
  R = fracQuat(uChunkD[id]);
  vec3 base = pos;
#ifdef FRACTURE_MORPH
  // re-form into a new small asteroid after the reform delay (C.w > 0)
  float mT = smoothstep(C.w, C.w + 2.4, tau) * step(0.001, C.w);
  base = mix(pos, aMorph, mT);
  gFracNormal = normalize(mix(normal, aMorphN, mT));
  vFracPos = base;
  vFracInner = aInner * (1.0 - 0.6 * mT);
#endif
  vec3 o = R * (base - c);
  float S = C.z;
  if (S > 1.001) {
    // spaghettification: stretch along the line to the hole, squeeze across it (volume kept)
    vec3 er = uBHLocal - B.xyz;
    er /= max(length(er), 1e-4);
    float al = dot(o, er);
    o = er * (al * S) + (o - er * al) / sqrt(S);
  }
  heat = C.x;
  return B.xyz + o * C.y;
}
`,
  fragmentPars: /* glsl */ `
uniform float uTime;
uniform float uCoreHeat;
uniform float uVeins;
uniform float uVeinScale;
varying float vFracHeat;
varying float vFracCrack;
varying float vFracInner;
varying vec3 vFracPos;
vec3 fracHeatColor(float h) {
  vec3 c = mix(vec3(0.0), vec3(0.45, 0.03, 0.0), smoothstep(0.0, 0.25, h));
  c = mix(c, vec3(1.0, 0.32, 0.04), smoothstep(0.2, 0.5, h));
  c = mix(c, vec3(1.0, 0.82, 0.5), smoothstep(0.45, 0.8, h));
  c = mix(c, vec3(0.78, 0.88, 1.0), smoothstep(0.8, 1.2, h));
  return c * (0.4 + 2.2 * h);
}
float fracHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float fracNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(fracHash(i), fracHash(i + vec3(1.0, 0.0, 0.0)), f.x),
                 mix(fracHash(i + vec3(0.0, 1.0, 0.0)), fracHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(fracHash(i + vec3(0.0, 0.0, 1.0)), fracHash(i + vec3(1.0, 0.0, 1.0)), f.x),
                 mix(fracHash(i + vec3(0.0, 1.0, 1.0)), fracHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
}
// thin wandering molten lines: iso-contour of two-octave noise, plus the crack seams
float fracVeins(vec3 p) {
  float n = fracNoise(p * uVeinScale) * 0.65 + fracNoise(p * uVeinScale * 2.3 + 7.1) * 0.35;
  float line = 1.0 - smoothstep(0.0, 0.03, abs(n - 0.5));
  float branch = 1.0 - smoothstep(0.0, 0.02, abs(fracNoise(p * uVeinScale * 3.7 + 3.3) - 0.5));
  return max(line, branch * 0.6 * smoothstep(0.4, 0.8, uVeins));
}
`,
  // expects vec4 diffuseColor, vec3 totalEmissiveRadiance in scope
  fragmentApply: /* glsl */ `
{
  float fh = vFracHeat;
  float innerFace = step(0.001, vFracInner);
  diffuseColor.rgb *= 1.0 - 0.75 * clamp(fh, 0.0, 1.0);
  totalEmissiveRadiance += fracHeatColor(fh) * smoothstep(0.04, 0.45, fh);
  // fracture faces: rock that turns molten toward the core while the body is hot
  float core = max(uCoreHeat, fh) * innerFace * smoothstep(0.2, 1.0, vFracInner);
  // rough rock grain on fracture faces, per pixel
  float rockGrain = fracNoise(vFracPos * uVeinScale * 7.0) * 0.6 + fracNoise(vFracPos * uVeinScale * 19.0) * 0.4;
  diffuseColor.rgb *= mix(1.0, 0.62 + 0.7 * rockGrain, innerFace);
  totalEmissiveRadiance += fracHeatColor(0.25 + 0.65 * core) * smoothstep(0.05, 0.35, core) * 0.9;
  // molten veins breaking through the surface
  if (uVeins > 0.001) {
    float flick = 0.75 + 0.25 * sin(uTime * 2.3 + dot(vFracPos, vec3(3.1, 2.7, 1.9)));
    float seam = pow(vFracCrack, 6.0) * 0.55;
    float v = max(fracVeins(vFracPos), seam) * (1.0 - innerFace) * uVeins;
    diffuseColor.rgb *= 1.0 - 0.55 * v;
    // fire colours: deep red rims, orange cores, yellow only where the vein is fully open
    vec3 fire = mix(vec3(0.55, 0.05, 0.0), vec3(1.0, 0.36, 0.04), smoothstep(0.2, 0.7, v * flick));
    fire = mix(fire, vec3(1.0, 0.72, 0.25), smoothstep(0.75, 1.0, v * flick) * uVeins);
    totalEmissiveRadiance += fire * v * (0.9 + 0.8 * uVeins);
  }
  // shell back faces seen through a hole read as shadowed; fracture faces carry smooth
  // normals and ignore facing (a few wall triangles fold along the jagged crack edge)
  if (!gl_FrontFacing) diffuseColor.rgb *= mix(0.35, 1.0, innerFace);
}
`,
  // MeshStandard only: undo three's DoubleSide normal flip on folded fracture faces
  normalFix: /* glsl */ `
if (!gl_FrontFacing && vFracInner > 0.0) {
  normal = -normal;
}
`,
};

/**
 * Inject fracture animation into a MeshStandardMaterial (keeps any existing
 * onBeforeCompile, e.g. the rock PBR attributes).
 */
export function applyFracture(material, uniforms, { morph = false } = {}) {
  const prev = material.onBeforeCompile;
  const prevKey = material.customProgramCacheKey ? material.customProgramCacheKey() : '';
  material.defines = { ...(material.defines || {}), FRACTURE_MAX };
  if (morph) material.defines.FRACTURE_MORPH = '';
  material.side = THREE.DoubleSide;
  material.onBeforeCompile = (shader, renderer) => {
    if (prev) prev.call(material, shader, renderer);
    for (const k of Object.keys(uniforms)) shader.uniforms[k] = uniforms[k];
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${FRACTURE_GLSL.vertexPars}`)
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
mat3 fracR;
float fracHeat;
vec3 fracP = fractureVertex(position, fracR, fracHeat);
objectNormal = fracR * gFracNormal;
vFracHeat = fracHeat;
vFracCrack = aCrack;`
      )
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = fracP;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRACTURE_GLSL.fragmentPars}`)
      .replace('#include <lights_physical_fragment>', `${FRACTURE_GLSL.normalFix}\n${FRACTURE_GLSL.fragmentApply}\n#include <lights_physical_fragment>`);
  };
  material.customProgramCacheKey = () => `${prevKey}|fracture${morph ? '-morph' : ''}-v3`;
  material.needsUpdate = true;
  return material;
}

/** Depth material running the same fracture animation (correct shadows). */
export function makeFractureDepthMaterial(uniforms, { morph = false } = {}) {
  const mat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
  mat.name = 'fracture-depth';
  mat.defines = { FRACTURE_MAX };
  if (morph) mat.defines.FRACTURE_MORPH = '';
  mat.onBeforeCompile = (shader) => {
    for (const k of Object.keys(uniforms)) shader.uniforms[k] = uniforms[k];
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${FRACTURE_GLSL.vertexPars}`)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
mat3 fracR;
float fracHeat;
transformed = fractureVertex(position, fracR, fracHeat);`
      );
  };
  mat.customProgramCacheKey = () => `fracture-depth${morph ? '-morph' : ''}-v3`;
  return mat;
}

/** Heat ramp mirror for CPU-side colouring (particles). */
export function heatColor(h) {
  const ss = (a, b, x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  let c = mix([0, 0, 0], [0.45, 0.03, 0], ss(0, 0.25, h));
  c = mix(c, [1, 0.32, 0.04], ss(0.2, 0.5, h));
  c = mix(c, [1, 0.82, 0.5], ss(0.45, 0.8, h));
  c = mix(c, [0.78, 0.88, 1], ss(0.8, 1.2, h));
  return c.map((v) => v * (0.4 + 2.2 * h));
}
