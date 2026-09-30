import * as THREE from "../../vendor/three.module.min.js";
import { buildShip, releaseShip } from "../shipgen/generate.js";
import { tick, newRegistry, collectInto } from "../shipgen/anim.js";
import { genConfig, hullSpec } from "./hullspec.js";

export function forgeShip(def, seed, opts = {}) {
  const cfg = genConfig(def, typeof seed === "object" ? seed?.seed ?? "sol" : seed, opts);
  const built = buildShip(cfg);
  const inner = built.root;

  inner.traverse((o) => { if (o.geometry?.userData?.shared) o.geometry.userData.keep = true; });

  if (!opts.pointLights) {
    const lights = [];
    inner.traverse((o) => { if (o.isLight) lights.push(o); });
    for (const l of lights) l.parent?.remove(l);
  }

  const lite = opts.detail === "lite";
  lodSwap(inner, lite ? "lite" : "full");
  if (opts.merge !== false) {
    if (lite) shareLampMaterials(inner);
    mergeStatic(inner, lite ? LITE_LIVE : FULL_LIVE);
    if (lite) built.anim = collectInto(newRegistry(), inner);
  }

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

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _centre = new THREE.Vector3();
const LOD_CACHE = new Map();
function lodGeo(key, make) {
  let g = LOD_CACHE.get(key);
  if (!g) { g = make(); g.userData.shared = true; g.userData.keep = true; LOD_CACHE.set(key, g); }
  return g;
}

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

const FULL_LIVE = ["plume", "spin", "pulse", "gimbal", "coil", "lamp", "scan", "patrol"];
const LITE_LIVE = ["plume"];
const _inv = new THREE.Matrix4();

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
  const buckets = new Map();
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
    if (list.length < 2) continue;
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
    if (!entry?.some((e) => e.merged)) continue;
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

export function forgeShipScaled(def, seed, opts = {}, targetLen = null) {
  const g = forgeShip(def, seed, opts);
  if (targetLen) g.scale.multiplyScalar(targetLen / def.dims[0]);
  return g;
}

export function tickHull(group, dt, t, ctx = {}) {
  const gen = group?.userData?.gen;
  if (!gen) return;
  tick(gen.anim, dt, t, ctx);
}

export function releaseHull(group) {
  const gen = group?.userData?.gen;
  if (!gen) return;
  releaseShip(group);
  group.userData.gen = null;
}
