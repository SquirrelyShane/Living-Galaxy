/* Shared unit geometries (cached), material factory and the addMesh placement helper. */
import * as THREE from "three";

const geoCache = new Map();
function cached(key, factory) {
  if (!geoCache.has(key)) { const g = factory(); g.userData.shared = true; geoCache.set(key, g); }
  return geoCache.get(key);
}
/* free everything a throwaway ship owns: per-build materials and any geometry that is not a shared unit primitive */
export function disposeDeep(root) {
  const mats = new Set();
  root.traverse((o) => {
    if (o.geometry && !(o.geometry.userData && o.geometry.userData.shared)) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m));
  });
  for (const m of mats) { if (m.map) m.map.dispose(); m.dispose(); }
  return mats.size;
}
export const G = {
  box: () => cached("box", () => new THREE.BoxGeometry(1, 1, 1)),
  sphere: () => cached("sph", () => new THREE.SphereGeometry(1, 18, 14)),
  dome: () => cached("dome", () => new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5)),
  cyl: (seg = 14) => cached("cyl" + seg, () => new THREE.CylinderGeometry(1, 1, 1, seg, 1, false)),
  tube: (seg = 14) => cached("tube" + seg, () => new THREE.CylinderGeometry(1, 1, 1, seg, 1, true)),
  taper: (r, seg = 14) => cached(`tp:${r}:${seg}`, () => new THREE.CylinderGeometry(1, r, 1, seg, 1, false)),
  cone: (seg = 12) => cached("cone" + seg, () => new THREE.ConeGeometry(1, 1, seg)),
  coneOpen: (seg = 14) => cached("coneO" + seg, () => new THREE.ConeGeometry(1, 1, seg, 1, true)),
  torus: (t = 0.24) => cached("tor" + t, () => new THREE.TorusGeometry(1, t, 10, 28)),
  ring: () => cached("ringf", () => new THREE.RingGeometry(0.55, 1, 24)),
  // exhaust cone with its base on the origin so it grows out of the nozzle instead of about its centre
  plume: (seg = 16) => cached("plume" + seg, () => new THREE.ConeGeometry(1, 1, seg, 1, true).translate(0, 0.5, 0)),
  disc: () => cached("disc", () => new THREE.CircleGeometry(1, 20))
};

/* finish presets applied on top of the base material recipe */
export const FINISHES = {
  brushed: {},
  matte:  { metalness: 0.15, roughness: 0.85 },
  chrome: { metalness: 1.0, roughness: 0.06, envMapIntensity: 1.6 },
  pearl:  { physical: true, metalness: 0.55, roughness: 0.22, clearcoat: 1.0, clearcoatRoughness: 0.08, iridescence: 0.65, iridescenceIOR: 1.35, sheen: 0.4, sheenColor: "#ffffff" },
  neon:   { physical: true, metalness: 0.7, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2, emissiveBoost: 0.18 }
};
export function makeMat(color, extras = {}) {
  if (extras.physical) {
    return new THREE.MeshPhysicalMaterial({
      color, metalness: extras.metalness ?? 0.55, roughness: extras.roughness ?? 0.44,
      emissive: extras.emissive ?? 0x000000, emissiveIntensity: extras.emissiveIntensity ?? 0,
      transparent: extras.transparent ?? false, opacity: extras.opacity ?? 1, side: extras.side ?? THREE.FrontSide,
      clearcoat: extras.clearcoat ?? 0, clearcoatRoughness: extras.clearcoatRoughness ?? 0.1,
      iridescence: extras.iridescence ?? 0, iridescenceIOR: extras.iridescenceIOR ?? 1.3,
      sheen: extras.sheen ?? 0, sheenColor: extras.sheenColor ?? "#ffffff", envMapIntensity: extras.envMapIntensity ?? 1.05
    });
  }
  return new THREE.MeshStandardMaterial({
    color,
    metalness: extras.metalness ?? 0.55,
    roughness: extras.roughness ?? 0.44,
    emissive: extras.emissive ?? 0x000000,
    emissiveIntensity: extras.emissiveIntensity ?? 0,
    flatShading: extras.flat ?? false,
    transparent: extras.transparent ?? false,
    opacity: extras.opacity ?? 1,
    side: extras.side ?? THREE.FrontSide,
    envMapIntensity: extras.envMapIntensity ?? 1.05
  });
}

export function addMesh(parent, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

export function wingShape(span, rootChord, tipChord, sweep, thickness) {
  const sh = new THREE.Shape();
  sh.moveTo(0, 0);
  sh.lineTo(span, -sweep);
  sh.lineTo(span, -sweep - tipChord);
  sh.lineTo(0, -rootChord);
  sh.closePath();
  return new THREE.ExtrudeGeometry(sh, {
    depth: thickness, bevelEnabled: true,
    bevelThickness: thickness * 0.15, bevelSize: thickness * 0.12, bevelSegments: 1
  });
}
