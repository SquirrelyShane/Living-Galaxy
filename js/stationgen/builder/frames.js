/* Slot frames: where a module may be mounted, and how it is oriented there.
 *
 * A slot is a point on the structure with an outward normal, a direction
 * along the structure (the module's own long axis), a mount kind, the
 * station zone it sits in (0 command end → 1 power end) and how much of
 * the sun it sees. Modules are built in a local frame with +Y out of the
 * hull and +Z along the structure; `frameMatrix` turns a slot into that. */
import * as THREE from "three";

export function slot(kind, pos, normal, along, zone, extra = {}) {
  const n = normal.clone().normalize();
  let a = along.clone();
  a.sub(n.clone().multiplyScalar(a.dot(n))).normalize();   // make `along` tangent
  if (!Number.isFinite(a.x) || a.lengthSq() < 1e-6) a = Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0).cross(n).normalize() : new THREE.Vector3(1, 0, 0).cross(n).normalize();
  return { kind, pos: pos.clone(), normal: n, along: a, zone, taken: false, width: 30, ...extra };
}

const _x = new THREE.Vector3(), _m = new THREE.Matrix4();
/** Basis for a slot: X = normal × along, Y = normal, Z = along. */
export function frameMatrix(s, out = new THREE.Matrix4()) {
  _x.crossVectors(s.normal, s.along).normalize();
  out.makeBasis(_x, s.normal, s.along);
  out.setPosition(s.pos);
  return out;
}

/** World-space AABB of a module box [w, h, d] sitting on a slot (base on the surface). */
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

/** The same footprint as a set of tighter AABBs: the frame box is split into cells
 * (≤ 3 per axis, ~45 m each) so a big box on a tilted slot does not fence off
 * the whole neighbourhood the way one world-aligned box round it would. */
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

/** Sun exposure of a slot: +1 facing the sun, −1 in its own shadow, 0 edge-on. */
export function sunDot(s, sun) { return s.normal.dot(sun); }
