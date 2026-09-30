import * as THREE from "three";

export function slot(kind, pos, normal, along, zone, extra = {}) {
  const n = normal.clone().normalize();
  let a = along.clone();
  a.sub(n.clone().multiplyScalar(a.dot(n))).normalize();
  if (!Number.isFinite(a.x) || a.lengthSq() < 1e-6) a = Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0).cross(n).normalize() : new THREE.Vector3(1, 0, 0).cross(n).normalize();
  return { kind, pos: pos.clone(), normal: n, along: a, zone, taken: false, width: 30, ...extra };
}

const _x = new THREE.Vector3(), _m = new THREE.Matrix4();
export function frameMatrix(s, out = new THREE.Matrix4()) {
  _x.crossVectors(s.normal, s.along).normalize();
  out.makeBasis(_x, s.normal, s.along);
  out.setPosition(s.pos);
  return out;
}

export function slotBox(s, size, lift = 0, zShift = 0) {
  const [w, h, d] = size;
  frameMatrix(s, _m);
  const box = new THREE.Box3();
  const c = new THREE.Vector3();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const sy of [0, 1]) {
    c.set((sx * w) / 2, lift + sy * h, zShift + (sz * d) / 2).applyMatrix4(_m);
    box.expandByPoint(c);
  }
  return box;
}

export function slotBoxes(s, size, lift = 0, cell = 45, zShift = 0) {
  const [w, h, d] = size;
  frameMatrix(s, _m);
  const nx = Math.min(3, Math.max(1, Math.ceil(w / cell))), ny = Math.min(3, Math.max(1, Math.ceil(h / cell))), nz = Math.min(3, Math.max(1, Math.ceil(d / cell)));
  const out = [];
  const c = new THREE.Vector3();
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
    const box = new THREE.Box3();
    for (const sx of [i, i + 1]) for (const sy of [j, j + 1]) for (const sz of [k, k + 1]) {
      c.set(-w / 2 + (w * sx) / nx, lift + (h * sy) / ny, zShift - d / 2 + (d * sz) / nz).applyMatrix4(_m);
      box.expandByPoint(c);
    }
    out.push(box);
  }
  return out;
}

export function sunDot(s, sun) { return s.normal.dot(sun); }
