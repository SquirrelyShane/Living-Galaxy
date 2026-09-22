/* LIVING GALAXY — the ship forge.
 *
 * Grows a hull from a registry def (shipdb.js) and a seed, using the ship
 * generator in js/shipgen/ (the NEWSHIPGEN extraction of ORBITAL YARD). The
 * def is translated into a generator class and a catalogue parts list by
 * hullspec.js; this file is the thin layer that builds it, normalizes it to
 * the engine's conventions and hands back the contract the rest of LIVING GALAXY
 * already reads.
 *
 * Same def + same seed is the same ship, every time, on every client — the
 * generator is deterministic for a (seed, config), so multiplayer peers agree
 * on what a hull looks like without shipping meshes around.
 *
 * Conventions match the engine: nose toward -Z, +Y up, the returned group is
 * centred on origin and its length is exactly def.dims[0] world units
 * (1 u = 10 m). On the group:
 *
 *   userData.def, .seed, .parts       as before
 *   userData.plumes / .glow           exhaust cones (glow = the first one)
 *   userData.gen                      { builder, cfg, anim, stats } from the
 *                                     generator — anim feeds tickHull()
 */

import * as THREE from "../vendor/three.module.min.js";
import { buildShip, releaseShip } from "./shipgen/generate.js";
import { tick, newRegistry, collectInto } from "./shipgen/anim.js";
import { genConfig, hullSpec } from "./hullspec.js";

/** Forge a hull. `opts`: primary / secondary / accent / engine livery colours,
 * `finish`, `detail` ("full" | "lite" — lite drops greeble, windows, lamps
 * and the sub-metre fittings for traffic and remote hulls), `analyze` (run
 * the flight + BOM pass; off by default, the yard turns it on). */
export function forgeShip(def, seed, opts = {}) {
  const cfg = genConfig(def, typeof seed === "object" ? seed?.seed ?? "sol" : seed, opts);
  const built = buildShip(cfg);
  const inner = built.root;

  /* Shared unit geometry lives for the life of the page: flag it so the
   * engine's disposal pass leaves it alone (its own GEO uses the same flag). */
  inner.traverse((o) => { if (o.geometry?.userData?.shared) o.geometry.userData.keep = true; });

  /* The generator lights its drives with point lights. Every light in the
   * scene costs every material a shader path, so a dozen traffic hulls would
   * grind the whole frame — the engine lights hulls with its own sun. */
  if (!opts.pointLights) {
    const lights = [];
    inner.traverse((o) => { if (o.isLight) lights.push(o); });
    for (const l of lights) l.parent?.remove(l);
  }

  /* A generated hull is 400–2000 meshes. Merge everything that never moves
   * into one mesh per material; only the animated nodes stay live. */
  const lite = opts.detail === "lite";
  /* Unit primitives come from the generator at yard resolution — an 18×14
   * sphere for every lamp bead. Swap in coarser unit geometry before the
   * merge: lamps always, the rest of the round stock on lite hulls. */
  lodSwap(inner, lite ? "lite" : "full");
  if (opts.merge !== false) {
    if (lite) shareLampMaterials(inner);
    mergeStatic(inner, lite ? LITE_LIVE : FULL_LIVE);
    /* Lite hulls animate nothing but the plumes: re-index what survived. */
    if (lite) built.anim = collectInto(newRegistry(), inner);
  }

  /* Normalize: centre on origin, exact length = def.dims[0]. Measured after
   * the LOD swap and the merge, so what is on screen is what is scaled. */
  _box.setFromObject(inner);
  _box.getSize(_size);
  _box.getCenter(_centre);
  inner.position.sub(_centre);
  const s = def.dims[0] / Math.max(_size.z, 1e-6);
  const root = new THREE.Group();
  root.name = `ship:${def.id}`;
  root.add(inner);
  root.scale.setScalar(s);

  const plumes = built.anim.plumes.slice();
  root.userData.def = def;
  root.userData.seed = seed;
  root.userData.parts = built.builder.partCount;
  root.userData.plumes = plumes;
  root.userData.glow = plumes[0] ?? null;
  root.userData.gen = { builder: built.builder, cfg: built.cfg, anim: built.anim, stats: built.stats, spec: hullSpec(def) };
  root.userData.hullScale = s;
  return root;
}

/* ---- level of detail -----------------------------------------------------
 * Replacement unit geometries, cached per (shape, resolution) and flagged
 * shared/keep like the generator's own, so a swap is free and the engine's
 * disposal pass leaves them alone. A phone's budget is triangles as much as
 * draws: a lamp bead does not need 500 of them. */

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _centre = new THREE.Vector3();
const LOD_CACHE = new Map();
function lodGeo(key, make) {
  let g = LOD_CACHE.get(key);
  if (!g) { g = make(); g.userData.shared = true; g.userData.keep = true; LOD_CACHE.set(key, g); }
  return g;
}

/* segment counts by level: [lamp sphere, sphere, cylinder, torus radial, torus tubular] */
const LOD = {
  full: { lampW: 6, lampH: 4, sphW: 12, sphH: 9, cyl: 10, torR: 7, torT: 18 },
  lite: { lampW: 5, lampH: 3, sphW: 8, sphH: 6, cyl: 8, torR: 6, torT: 12 },
};

function lodSwap(inner, level) {
  const L = LOD[level] ?? LOD.full;
  inner.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry;
    const p = g?.parameters;
    if (!p) return;
    const lamp = !!o.userData.lamp;
    if (g.type === "SphereGeometry") {
      const w = lamp ? L.lampW : L.sphW, h = lamp ? L.lampH : L.sphH;
      if (p.widthSegments <= w) return;
      const partial = p.thetaLength < Math.PI - 1e-6 || p.phiLength < Math.PI * 2 - 1e-6;
      o.geometry = lodGeo(`sph:${w}:${h}:${partial ? p.thetaLength.toFixed(3) : "f"}`,
        () => new THREE.SphereGeometry(p.radius, w, h, p.phiStart, p.phiLength, p.thetaStart, p.thetaLength));
    } else if (g.type === "CylinderGeometry" && level === "lite") {
      if (p.radialSegments <= L.cyl) return;
      o.geometry = lodGeo(`cyl:${p.radiusTop}:${p.radiusBottom}:${L.cyl}:${p.openEnded ? 1 : 0}`,
        () => new THREE.CylinderGeometry(p.radiusTop, p.radiusBottom, p.height, L.cyl, 1, p.openEnded));
    } else if (g.type === "TorusGeometry") {
      if (p.radialSegments <= L.torR) return;
      o.geometry = lodGeo(`tor:${p.tube}:${L.torR}:${L.torT}`, () => new THREE.TorusGeometry(p.radius, p.tube, L.torR, L.torT));
    }
  });
}

/* ---- static merge --------------------------------------------------------
 * Draw calls are the budget on a phone. Everything the animation registry
 * does not touch (see shipgen/anim.js markers) is baked, per material, into
 * a single non-indexed BufferGeometry in the hull's own frame. Animated nodes
 * — plumes, lamps, spinning drums, sweeping sensors, patrolling turrets — and
 * everything under them are left as they are. */

const FULL_LIVE = ["plume", "spin", "pulse", "gimbal", "coil", "lamp", "scan", "patrol"];
const LITE_LIVE = ["plume"];
const _inv = new THREE.Matrix4();

/* Lite hulls: every lamp of one colour shares one material, so the merge can
 * fold hundreds of beads into a handful of draws. Steady glow, no blink. */
function shareLampMaterials(inner) {
  const pool = new Map();
  inner.traverse((o) => {
    if (!o.isMesh || !o.userData.lamp || Array.isArray(o.material)) return;
    const m = o.material;
    const key = `${m.color?.getHex()}:${m.emissive?.getHex()}`;
    if (!pool.has(key)) { pool.set(key, m); return; }
    const shared = pool.get(key);
    if (shared !== m) { m.dispose(); o.material = shared; }
  });
}

function mergeStatic(inner, liveKeys) {
  const isAnimated = (o) => liveKeys.some((k) => o.userData?.[k]);
  inner.updateMatrixWorld(true);
  _inv.copy(inner.matrixWorld).invert();
  const buckets = new Map(); // material → [{ geo, matrix }]
  const doomed = [];
  const walk = (o, live) => {
    const anim = live || isAnimated(o);
    if (o.isMesh && !anim && !o.children.length && !Array.isArray(o.material) && o.geometry?.attributes?.position) {
      if (!buckets.has(o.material)) buckets.set(o.material, []);
      buckets.get(o.material).push({ geo: o.geometry, matrix: new THREE.Matrix4().multiplyMatrices(_inv, o.matrixWorld) });
      doomed.push(o);
      return;
    }
    for (const c of o.children) walk(c, anim);
  };
  for (const c of inner.children) walk(c, false);

  for (const [mat, list] of buckets) {
    if (list.length < 2) continue; // nothing to gain
    const merged = mergeList(list);
    if (!merged) continue;
    const m = new THREE.Mesh(merged, mat);
    m.name = "merged";
    m.frustumCulled = true;
    inner.add(m);
    for (const e of list) e.merged = true;
  }
  for (const o of doomed) {
    const entry = buckets.get(o.material);
    if (!entry?.some((e) => e.merged)) continue; // singletons stay where they were
    o.parent?.remove(o);
    if (!o.geometry.userData?.shared) o.geometry.dispose();
  }
}

function mergeList(list) {
  let verts = 0;
  const prepped = [];
  for (const { geo, matrix } of list) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(matrix);
    verts += g.attributes.position.count;
    prepped.push(g);
  }
  if (!verts) return null;
  const pos = new Float32Array(verts * 3);
  const nor = new Float32Array(verts * 3);
  const uv = new Float32Array(verts * 2);
  let off = 0;
  for (const g of prepped) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array.subarray(0, n * 3), off * 3);
    nor.set(g.attributes.normal.array.subarray(0, n * 3), off * 3);
    if (g.attributes.uv && g.attributes.uv.itemSize === 2) uv.set(g.attributes.uv.array.subarray(0, n * 2), off * 2);
    off += n;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  out.computeBoundingSphere();
  return out;
}

/** Drop-in for engine.js: forge a hull, uniformly scaled so its length is
 * `targetLen` world units (defaults to the def's own registry length). */
export function forgeShipScaled(def, seed, opts = {}, targetLen = null) {
  const g = forgeShip(def, seed, opts);
  if (targetLen) g.scale.multiplyScalar(targetLen / def.dims[0]);
  return g;
}

/** Drive the hull's idle animation: plumes follow `throttle` (0–1), lamps
 * blink, sensors sweep, turrets patrol or slew onto `aim` (a world Vector3). */
export function tickHull(group, dt, t, ctx = {}) {
  const gen = group?.userData?.gen;
  if (!gen) return;
  tick(gen.anim, dt, t, ctx);
}

/** Free what a forged hull owns that the scene-level disposer cannot see:
 * the materials the generator cloned per build. Geometry is handled by the
 * caller's own disposal pass (shared primitives are flagged `keep`). */
export function releaseHull(group) {
  const gen = group?.userData?.gen;
  if (!gen) return;
  releaseShip(group);
  group.userData.gen = null;
}
