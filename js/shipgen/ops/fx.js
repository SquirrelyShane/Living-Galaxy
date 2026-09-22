/* Transient effects: beams, tracers, missiles, sparks, ore chunks, scan rings, RCS puffs.
 * fxAdd() registers a mesh with a tick(o, k, done, dt); fxUpdate() runs them each frame. */
import * as THREE from "three";
import { fxScene } from "./host.js";
import { rig } from "./rig.js";

export const fx = [];
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
const Y_AXIS = new THREE.Vector3(0, 1, 0);

export const FXG = {
  sphere: new THREE.SphereGeometry(1, 10, 8),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 8, 1, true),
  box: new THREE.BoxGeometry(1, 1, 1),
  ring: new THREE.TorusGeometry(1, 0.03, 6, 48),
  chunk: new THREE.DodecahedronGeometry(1, 0),
  missile: new THREE.CylinderGeometry(0.35, 0.5, 4, 8)
};
export function fxMat(color, opacity = 1, blending = THREE.AdditiveBlending) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending, depthWrite: false, toneMapped: false });
}
export function fxAdd(mesh, life, tick) {
  mesh.userData.fx = { life, age: 0, tick };
  fxScene().add(mesh); fx.push(mesh); return mesh;
}
export function fxFlash(p, color, r, life = 0.25) {
  const m = new THREE.Mesh(FXG.sphere, fxMat(color, 0.9));
  m.position.copy(p);
  return fxAdd(m, life, (o, k) => { const s = r * (0.3 + k * 1.4); o.scale.set(s, s, s); o.material.opacity = 0.9 * (1 - k); });
}
export function fxBeam(a, b, color, radius, life = 0.28) {
  const m = new THREE.Mesh(FXG.cyl, fxMat(color, 0.85));
  const dir = _v1.subVectors(b, a); const len = dir.length();
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(Y_AXIS, dir.normalize());
  m.scale.set(radius, len, radius);
  const core = new THREE.Mesh(FXG.cyl, fxMat("#ffffff", 0.9)); core.scale.set(0.35, 1, 0.35); m.add(core);
  return fxAdd(m, life, (o, k) => { const w = 1 + Math.sin(k * 40) * 0.25; o.scale.x = o.scale.z = radius * w * (1 - k * 0.6); o.material.opacity = 0.85 * (1 - k); });
}
export function fxTracer(a, b, color, speed, size, onHit) {
  const m = new THREE.Mesh(FXG.box, fxMat(color, 1));
  const dir = new THREE.Vector3().subVectors(b, a); const dist = dir.length(); dir.normalize();
  m.quaternion.setFromUnitVectors(Y_AXIS, dir);
  m.scale.set(size, size * 6, size);
  m.position.copy(a);
  const life = dist / speed;
  return fxAdd(m, life, (o, k, done) => { o.position.copy(a).addScaledVector(dir, k * dist); if (done && onHit) onHit(b); });
}
/* ammunition variants ------------------------------------------------------------------ */
export function fxCasing(p, dir) {
  const m = new THREE.Mesh(FXG.box, new THREE.MeshStandardMaterial({ color: "#d9b26a", metalness: 0.9, roughness: 0.3 }));
  const s = rig.U * 0.05; m.scale.set(s, s * 2.5, s); m.position.copy(p);
  const v = dir.clone().multiplyScalar(rig.U * 4).add(new THREE.Vector3((Math.random() - 0.5) * rig.U, (Math.random() - 0.5) * rig.U, (Math.random() - 0.5) * rig.U));
  const rot = new THREE.Vector3(Math.random() * 12, Math.random() * 12, Math.random() * 12);
  return fxAdd(m, 1.4, (o, k, done, dt) => { o.position.addScaledVector(v, dt); o.rotation.x += rot.x * dt; o.rotation.z += rot.z * dt; if (k > 0.7) o.material.opacity = 1 - (k - 0.7) / 0.3; o.material.transparent = true; });
}
export function fxBurst(p, color, r) {
  fxFlash(p, color, r, 0.35);
  fxRing(p, r * 3, color, 0.5);
  fxSparks(p, new THREE.Vector3(0, 0, 0), color, 26);
}
export function fxNuke(p) {
  fxFlash(p, "#ffffff", rig.U * 6, 0.9);
  fxFlash(p, "#ffb03a", rig.U * 3.5, 1.6);
  fxRing(p, rig.U * 24, "#fff1d0", 1.8);
  const r2 = fxRing(p, rig.U * 16, "#ff8a2a", 2.4); r2.rotation.x = Math.PI / 2 + 0.8;
  fxSparks(p, new THREE.Vector3(0, 0, 0), "#fff1d0", 60);
}
export function fxEmp(p) {
  fxFlash(p, "#7de9ff", rig.U * 2.2, 0.5);
  for (let i = 0; i < 3; i++) { const r = fxRing(p, rig.U * (8 + i * 4), "#5fd0ff", 1.2 + i * 0.3); r.rotation.set(Math.random() * 3, Math.random() * 3, 0); }
  // crackling arcs around the point of detonation
  const arcs = fxAdd(new THREE.Group(), 0.9, (o, k, done, dt) => {
    if (Math.random() < 0.5) { const a = p.clone().add(new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).multiplyScalar(rig.U * 3));
      const b = p.clone().add(new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).multiplyScalar(rig.U * 3));
      fxBeam(a, b, "#bfe4ff", rig.U * 0.02, 0.08); }
  });
  return arcs;
}
export function fxChaff(p, dir) {
  const n = 120, pos = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++) { pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
    vel.push(dir.clone().multiplyScalar(rig.U * 1.5).add(new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).multiplyScalar(rig.U * 2.5))); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: "#eaf4ff", size: rig.U * 0.07, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  return fxAdd(pts, 4.5, (o, k, done, dt) => {
    const a = o.geometry.attributes.position;
    for (let i = 0; i < n; i++) { a.array[i * 3] += vel[i].x * dt; a.array[i * 3 + 1] += vel[i].y * dt; a.array[i * 3 + 2] += vel[i].z * dt; vel[i].multiplyScalar(0.985); }
    a.needsUpdate = true; o.material.opacity = (0.5 + 0.5 * Math.sin(k * 60)) * (1 - k);
    if (done) o.geometry.dispose();
  });
}
export function fxMine(p, dir) {
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: "#3a4452", metalness: 0.7, roughness: 0.4, flatShading: true }));
  const s = rig.U * 0.3; m.scale.set(s, s, s); m.position.copy(p);
  const lamp = new THREE.Mesh(FXG.sphere, fxMat("#ff4a5a", 1)); lamp.scale.set(0.25, 0.25, 0.25); lamp.position.y = 1.1; m.add(lamp);
  const v = dir.clone().multiplyScalar(rig.U * 1.2);
  return fxAdd(m, 9, (o, k, done, dt) => { o.position.addScaledVector(v, dt); v.multiplyScalar(0.995); o.rotation.y += dt * 0.8; lamp.material.opacity = (Math.sin(k * 90) > 0.6) ? 1 : 0.05; if (done) fxBurst(o.position, "#ff8a2a", rig.U * 1.2); });
}
export function fxMissile(a, b, up, color, opts = {}) {
  const m = new THREE.Mesh(FXG.missile, new THREE.MeshStandardMaterial({ color: "#d9e2ee", metalness: 0.6, roughness: 0.4 }));
  const glow = new THREE.Mesh(FXG.sphere, fxMat(color, 0.9)); glow.position.y = -2.3; glow.scale.set(0.7, 1.4, 0.7); m.add(glow);
  const s = rig.U * 0.12; m.scale.set(s, s, s);
  m.position.copy(a);
  const mid = new THREE.Vector3().lerpVectors(a, b, 0.4).addScaledVector(up, a.distanceTo(b) * 0.35);
  const life = 1.4 + Math.random() * 0.4; let lastPuff = 0;
  const prev = new THREE.Vector3().copy(a);
  return fxAdd(m, life, (o, k, done) => {
    const kk = k * k * (3 - 2 * k);
    const p1 = _v1.lerpVectors(a, mid, kk), p2 = _v2.lerpVectors(mid, b, kk);
    o.position.lerpVectors(p1, p2, kk);
    const d = _v3.subVectors(o.position, prev); if (d.lengthSq() > 1e-6) o.quaternion.setFromUnitVectors(Y_AXIS, d.normalize());
    prev.copy(o.position);
    if (k - lastPuff > 0.06) { lastPuff = k; fxPuff(o.position, _v3.set(0, 0, 0), s * 2.2, "#cfd8e6", 0.5); }
    if (done) fxFlash(b, color, rig.U * 0.9, 0.45);
  });
}
export function fxPuff(p, dir, r, color = "#e8f2ff", life = 0.35) {
  const m = new THREE.Mesh(FXG.sphere, fxMat(color, 0.55, THREE.NormalBlending));
  m.position.copy(p); const d = dir.clone();
  return fxAdd(m, life, (o, k) => { const s = r * (0.3 + k * 1.6); o.scale.set(s, s, s); o.position.addScaledVector(d, r * 0.25); o.material.opacity = 0.55 * (1 - k); });
}
export function fxSparks(p, dir, color = "#ffb03a", n = 14) {
  const pos = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++) {
    pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
    vel.push(new THREE.Vector3(dir.x + (Math.random() - 0.5) * 1.6, dir.y + (Math.random() - 0.5) * 1.6, dir.z + (Math.random() - 0.5) * 1.6).multiplyScalar(rig.U * (2 + Math.random() * 6)));
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: rig.U * 0.12, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, sizeAttenuation: true }));
  return fxAdd(pts, 0.55, (o, k, done, dt) => {
    const a = o.geometry.attributes.position;
    for (let i = 0; i < n; i++) { a.array[i * 3] += vel[i].x * dt; a.array[i * 3 + 1] += vel[i].y * dt; a.array[i * 3 + 2] += vel[i].z * dt; vel[i].multiplyScalar(0.93); }
    a.needsUpdate = true; o.material.opacity = 1 - k;
    if (done) o.geometry.dispose();
  });
}
export function fxChunk(a, b) {
  const m = new THREE.Mesh(FXG.chunk, new THREE.MeshStandardMaterial({ color: "#8a7f72", roughness: 0.95, metalness: 0.05, flatShading: true }));
  const s = rig.U * (0.06 + Math.random() * 0.08); m.scale.set(s, s * 0.8, s * 1.2);
  const rot = new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(4);
  const sway = new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).multiplyScalar(rig.U * 0.6);
  return fxAdd(m, 1.3, (o, k, done, dt) => {
    o.position.lerpVectors(a, b, k).addScaledVector(sway, Math.sin(k * Math.PI));
    o.rotation.x += rot.x * dt; o.rotation.y += rot.y * dt;
    if (done) fxFlash(b, "#ffb03a", rig.U * 0.25, 0.2);
  });
}
export function fxRing(p, rMax, color, life = 1.6) {
  const m = new THREE.Mesh(FXG.ring, fxMat(color, 0.8));
  m.position.copy(p); m.rotation.x = Math.PI / 2;
  return fxAdd(m, life, (o, k) => { const r = 0.2 + rMax * k; o.scale.set(r, r, 1); o.material.opacity = 0.8 * (1 - k) * (1 - k); });
}
export function fxUpdate(dt) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const o = fx[i], d = o.userData.fx; d.age += dt;
    const k = Math.min(1, d.age / d.life), done = d.age >= d.life;
    d.tick(o, k, done, dt);
    if (done) { fxScene().remove(o); if (o.material?.dispose) o.material.dispose(); fx.splice(i, 1); }
  }
}

/* ---- bind a freshly built ship to the rig ------------------------- */
