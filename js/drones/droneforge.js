import * as THREE from "../../vendor/three.module.min.js";
import { buildRobot } from "../robotgen/build.js";

import { DRONE_KINDS, droneSpec } from "./dronespec.js";

export { DRONE_KINDS, droneSpec, droneSummary } from "./dronespec.js";

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _centre = new THREE.Vector3();
const _inv = new THREE.Matrix4();
const _m = new THREE.Matrix4();

const emis = (m) => (m.emissive ? (m.emissive.r + m.emissive.g + m.emissive.b) * (m.emissiveIntensity ?? 1) : 0);
const _c = new THREE.Color();
const DARK_FLOOR = new THREE.Color(0.06, 0.065, 0.078);
function tint(m, lamp) {
  if (lamp) return _c.copy(m.emissive).multiplyScalar(Math.min(2.2, m.emissiveIntensity ?? 1)).clone();
  const c = m.color.clone();
  if (m.emissive && emis(m) > 0.02) c.add(_c.copy(m.emissive).multiplyScalar((m.emissiveIntensity ?? 1) * 0.6));
  const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  if (lum < 0.05) c.lerp(DARK_FLOOR, 0.55 * (1 - lum / 0.05));
  return c;
}

export function forgeDrone(kind, seed, sector = null) {
  const K = DRONE_KINDS[kind] ?? DRONE_KINDS.guard;
  const spec = droneSpec(kind, seed, sector);
  const built = buildRobot(THREE, spec);
  const robot = built.root;
  robot.updateMatrixWorld(true);
  _inv.copy(robot.matrixWorld).invert();

  const solid = [], lamps = [];
  const clear = new Map();
  robot.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material) || !o.geometry?.attributes?.position) return;
    for (let p = o; p; p = p.parent) if (!p.visible) return;
    const m = o.material;
    if (m.transparent && (m.opacity ?? 1) < 0.02) return;
    const matrix = _m.clone().multiplyMatrices(_inv, o.matrixWorld);
    if (m.transparent) { if (!clear.has(m)) clear.set(m, []); clear.get(m).push({ geo: o.geometry, matrix }); return; }
    const lamp = (m.emissiveIntensity ?? 0) >= 0.9 && emis(m) > 0.3;
    (lamp ? lamps : solid).push({ geo: o.geometry, matrix, color: tint(m, lamp) });
  });

  const inner = new THREE.Group();
  inner.name = "drone:inner";
  const P = spec.palette ?? {};
  const owned = { geos: [], mats: [] };
  if (solid.length) {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: Math.min(0.3, P.metalness ?? 0.3), roughness: Math.max(0.45, P.roughness ?? 0.5) });
    mat.name = "drone:solid";
    const g = mergeList(solid, true);
    inner.add(new THREE.Mesh(g, mat));
    owned.geos.push(g); owned.mats.push(mat);
  }
  if (lamps.length) {
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true });
    mat.name = "drone:lamps";
    const g = mergeList(lamps, true);
    inner.add(new THREE.Mesh(g, mat));
    owned.geos.push(g); owned.mats.push(mat);
  }
  for (const [src, list] of clear) {
    const mat = src.clone();
    mat.name = `drone:${src.name || "clear"}`;
    mat.depthWrite = false;
    const g = mergeList(list, false);
    inner.add(new THREE.Mesh(g, mat));
    owned.geos.push(g); owned.mats.push(mat);
  }
  built.dispose?.();

  inner.rotation.y = Math.PI;
  inner.updateMatrixWorld(true);
  _box.setFromObject(inner);
  _box.getSize(_size);
  _box.getCenter(_centre);
  inner.position.sub(_centre);
  const s = K.len / Math.max(_size.x, _size.y, _size.z, 1e-6);
  const root = new THREE.Group();
  root.name = `drone:${kind}:${spec.designation}`;
  root.add(inner);
  root.scale.setScalar(s);

  for (const g of owned.geos) g.userData.keep = true;
  for (const m of owned.mats) m.userData.keep = true;
  root.userData.drone = {
    kind, seed, designation: spec.designation, career: spec.career?.label ?? K.label,
    massKg: Math.round(spec.stats?.massKg ?? 0), parts: spec.stats?.partCount ?? 0,
    draws: inner.children.length, owned,
  };
  root.userData.spec = spec;
  return root;
}

function mergeList(list, withColor) {
  let verts = 0;
  const prepped = [];
  for (const { geo, matrix, color } of list) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(matrix);
    verts += g.attributes.position.count;
    prepped.push({ g, color });
  }
  const pos = new Float32Array(verts * 3);
  const nor = new Float32Array(verts * 3);
  const col = withColor ? new Float32Array(verts * 3) : null;
  let off = 0;
  for (const { g, color } of prepped) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array.subarray(0, n * 3), off * 3);
    nor.set(g.attributes.normal.array.subarray(0, n * 3), off * 3);
    if (col) for (let i = 0; i < n; i++) { const k = (off + i) * 3; col[k] = color.r; col[k + 1] = color.g; col[k + 2] = color.b; }
    off += n;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  if (col) out.setAttribute("color", new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}

const templates = new Map();
let budget = 1;

export function droneBudget(n = 1) { budget = n; }

export function droneFor(kind, seed, sector = null) {
  const key = `${kind}|${seed}|${sector ?? ""}`;
  let t = templates.get(key);
  if (!t) {
    if (budget <= 0) return null;
    budget--;
    t = forgeDrone(kind, seed, sector);
    templates.set(key, t);
  }
  const inst = t.clone();
  inst.userData = { drone: t.userData.drone, template: key };
  return inst;
}

export function droneTemplateCount() { return templates.size; }

export function releaseDrone(key) {
  const t = templates.get(key);
  if (!t) return false;
  const o = t.userData.drone?.owned;
  for (const g of o?.geos ?? []) g.dispose();
  for (const m of o?.mats ?? []) m.dispose();
  templates.delete(key);
  return true;
}

export function releaseDrones() {
  for (const t of templates.values()) {
    const o = t.userData.drone?.owned;
    for (const g of o?.geos ?? []) g.dispose();
    for (const m of o?.mats ?? []) m.dispose();
  }
  templates.clear();
}
