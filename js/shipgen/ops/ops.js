/* Live systems layer: throttle, fire control, mining, docking, deployables, sensor sweeps, RCS.
 * opsBind() indexes a freshly built ship into `rig`; opsUpdate() runs every frame. */
import * as THREE from "three";
import { host, fxScene } from "./host.js";
import { rig } from "./rig.js";
export { rig };
import { RNG } from "../core/rng.js";
import { FXG, fxMat, fxFlash, fxBeam, fxTracer, fxMissile, fxPuff, fxSparks, fxChunk, fxRing, fxUpdate, fxCasing, fxBurst, fxNuke, fxEmp, fxChaff, fxMine } from "./fx.js";

export const ops = { throttle: 0.62, firing: false, fireEnd: 0, mining: false, deploy: 1, deployT: 1,
              docked: false, dockT: 0, rcs: true, nextPuff: 0, scanUntil: 0, showColliders: false, lastThrottle: 0.62 };
export let targetDrone = null, rock = null, colliderGroup = null, miningBeams = [];


const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/* ctx lets the part inspector bind a lone module: { size, U, occ, accent } */
export function opsBind(root, ctx = {}) {
  for (const k of Object.keys(rig)) if (Array.isArray(rig[k])) rig[k].length = 0;
  rig.root = root;
  rig.builder = ctx.builder || rig.builder;
  rig.size = ctx.size || (rig.builder && rig.builder.size);
  rig.U = ctx.U || rig.U;
  rig.accent = ctx.accent || rig.accent;
  rig.occ = ctx.occ || (rig.builder ? rig.builder.occ : []);
  root.traverse((o) => {
    const d = o.userData;
    if (d.turret) { o.rotation.order = "YXZ"; d.turret.next = 0; rig.turrets.push(o); }
    if (d.launcher) { d.launcher.next = 0; d.launcher.i = 0; rig.launchers.push(o); }
    if (d.drill) rig.drills.push(o);
    if (d.intake) rig.intakes.push(o);
    if (d.rcs) rig.rcs.push(o);
    if (d.deploy) { d.deploy.kind = d.deploy.kind || "rot"; rig.deployables.push(o); }
    if (d.dock) {
      d.dock.orig = d.dock.status ? { mode: d.dock.status.userData.lamp.mode, color: d.dock.status.material.emissive.getHex() } : null;
      rig.docks.push(o);
    }
    if (d.sensor) rig.sensors.push(o);
    if (d.srb) rig.srbPlumes.push(o);
    if (o.isPointLight) { o.userData.baseI = o.intensity; rig.engineLights.push(o); }
  });
  // target drone off the bow, mining rock at the drill tips
  if (targetDrone) fxScene().remove(targetDrone);
  if (rock) fxScene().remove(rock);
  const size = rig.size;
  targetDrone = makeTargetDrone(Math.max(size.x, size.y) * 0.12);
  targetDrone.position.set(size.x * 0.55, size.y * 0.55, -size.z * 1.35);
  targetDrone.visible = false; fxScene().add(targetDrone);
  root.updateMatrixWorld(true);
  rock = makeRock(Math.max(size.y, size.x) * 0.32);
  placeRock(root);
  rock.visible = false; fxScene().add(rock);
  // collision boxes
  if (colliderGroup) colliderGroup.parent?.remove(colliderGroup);
  colliderGroup = new THREE.Group(); colliderGroup.name = "colliders";
  for (const o of rig.occ) {
    const isHull = o.tag === "hull" || ["nose", "drives", "wings", "structure", "bridge", "viewport"].includes(o.tag);
    const h = new THREE.Box3Helper(o.box, o.tag === "workzone" ? 0xff5a2a : isHull ? 0x3a6f8f : 0xffb03a);
    h.material.transparent = true; h.material.opacity = isHull ? 0.25 : o.tag === "workzone" ? 0.5 : 0.85;
    colliderGroup.add(h);
  }
  colliderGroup.visible = ops.showColliders;
  root.add(colliderGroup);
  // reset transient state
  for (const b of miningBeams) fxScene().remove(b); miningBeams = [];
  for (const o of rig.turrets) if (o.userData.turret.beam) { fxScene().remove(o.userData.turret.beam); o.userData.turret.beam = null; }
  ops.firing = false;
  if (ops.mining) startMining();
}
export function makeTargetDrone(r) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(r, 0), new THREE.MeshStandardMaterial({ color: "#3a4452", metalness: 0.7, roughness: 0.35, flatShading: true }));
  g.add(core);
  const ring = new THREE.Mesh(FXG.ring, fxMat("#ff4a5a", 0.9)); ring.scale.set(r * 2.2, r * 2.2, 1); g.add(ring);
  const ring2 = ring.clone(); ring2.rotation.x = Math.PI / 2; g.add(ring2);
  const lamp = new THREE.Mesh(FXG.sphere, fxMat("#ff4a5a", 1)); lamp.scale.set(r * 0.2, r * 0.2, r * 0.2); lamp.position.y = r * 1.1; g.add(lamp);
  g.userData.drone = { core, rings: [ring, ring2], lamp, hp: 1 };
  return g;
}
export function makeRock(R) {
  const geo = new THREE.IcosahedronGeometry(R, 2);
  const pos = geo.attributes.position; const rr = new RNG("rock");
  for (let i = 0; i < pos.count; i++) {
    const v = _v1.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    const n = 1 + (Math.sin(v.x * 1.7) * Math.cos(v.z * 2.3) * 0.12) + (rr.next() - 0.5) * 0.14;
    v.multiplyScalar(n); pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: "#6e655c", roughness: 0.96, metalness: 0.08, flatShading: true }));
  m.castShadow = true; m.receiveShadow = true; m.userData.R = R;
  // ore veins
  for (let i = 0; i < 6; i++) {
    const vein = new THREE.Mesh(FXG.chunk, new THREE.MeshStandardMaterial({ color: "#c98a3a", emissive: "#7a4a12", emissiveIntensity: 0.6, roughness: 0.5, metalness: 0.7, flatShading: true }));
    const dir = new THREE.Vector3(rr.range(-1, 1), rr.range(-1, 1), rr.range(-1, 1)).normalize();
    vein.position.copy(dir).multiplyScalar(R * 0.95); vein.scale.setScalar(R * rr.range(0.08, 0.16)); m.add(vein);
  }
  return m;
}
export function placeRock(root) {
  const R = rock.userData.R;
  if (rig.drills.length) {
    const c = new THREE.Vector3(), n = new THREE.Vector3();
    for (const d of rig.drills) {
      const node = d.userData.drill.node || d;
      const tip = node.localToWorld(new THREE.Vector3(...d.userData.drill.tip));
      const base = node.localToWorld(new THREE.Vector3(0, 0, 0));
      c.add(tip); n.add(tip.sub(base).normalize());
    }
    c.divideScalar(rig.drills.length); n.normalize();
    rock.position.copy(c).addScaledVector(n, R * 0.72);
    // never let the ore body sit inside modules mounted ahead of the drills: clear the hull's forward extent
    const bb = new THREE.Box3().setFromObject(root);
    if (Math.abs(n.z) > 0.6 && !bb.isEmpty()) {
      const front = n.z < 0 ? bb.min.z - R * 0.85 : bb.max.z + R * 0.85;
      if (n.z < 0 ? rock.position.z > front : rock.position.z < front) rock.position.z = front;
    }
  } else {
    rock.position.set(0, -rig.size.y * 0.1, -rig.size.z * 0.55 - R * 1.1);
  }
}
/* how far each telescoping boom must extend for its tip to touch the ore body */
function aimDrills() {
  if (!rock) return;
  const R = rock.userData.R;
  for (const d of rig.drills) {
    const dd = d.userData.drill, node = dd.node || d;
    const tip = node.localToWorld(new THREE.Vector3(0, dd.tipBase, 0));
    const axis = node.localToWorld(new THREE.Vector3(0, dd.tipBase + 1, 0)).sub(tip).normalize();
    const toRock = _v1.subVectors(rock.position, tip);
    const along = toRock.dot(axis);
    const perp2 = Math.max(0, toRock.lengthSq() - along * along);
    const reach = along - Math.sqrt(Math.max(0, R * R - perp2)) + rig.U * 0.15;
    dd.extTarget = THREE.MathUtils.clamp(reach, 0, dd.extMax);
  }
}

/* ---- world-space helpers ---------------------------------------- */
export function aimAngles(o, target) {
  const p = o.parent.worldToLocal(_v1.copy(target));
  const d = p.sub(o.position);
  return [Math.atan2(-d.x, -d.z), Math.atan2(d.y, Math.hypot(d.x, d.z))];
}
export function wrapAngle(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
export function muzzleWorld(o) { const mz = o.userData.turret.muzzle; return o.localToWorld(new THREE.Vector3(mz[0], mz[1], mz[2])); }

export function fireShot(o, t) {
  const T = o.userData.turret, tgt = targetDrone.getWorldPosition(_v2.clone());
  const from = muzzleWorld(o);
  const spread = rig.U * 0.25;
  const to = tgt.clone().add(new THREE.Vector3((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread));
  const U = rig.U;
  switch (T.kind) {
    case "beam":
      fxBeam(from, to, rig.accent, U * 0.06, 0.32); fxFlash(to, rig.accent, U * 0.5, 0.3); hitDrone(); break;
    case "rail":
      fxFlash(from, "#ffffff", U * 0.5, 0.18);
      fxTracer(from, to, "#ffffff", U * 140, U * 0.09, (p) => { fxFlash(p, "#ffe2a8", U * 1.1, 0.4); fxSparks(p, _v3.subVectors(from, p).normalize(), "#ffd27a", 20); hitDrone(); }); break;
    case "coil":
      fxFlash(from, "#7de9ff", U * 0.4, 0.15); fxRing(from, U * 0.8, "#5fd0ff", 0.25).quaternion.copy(o.getWorldQuaternion(new THREE.Quaternion()));
      fxTracer(from, to, "#9fe8ff", U * 170, U * 0.08, (p) => { fxFlash(p, "#bfe4ff", U * 1.0, 0.35); fxSparks(p, _v3.subVectors(from, p).normalize(), "#9fe8ff", 18); hitDrone(); }); break;
    case "plasma":
      fxTracer(from, to, "#cf8bff", U * 60, U * 0.22, (p) => { fxFlash(p, "#cf8bff", U * 1.0, 0.45); hitDrone(); }); break;
    case "pdc":
      fxTracer(from, to, "#ffd27a", U * 110, U * 0.045, (p) => { fxFlash(p, "#ffd27a", U * 0.25, 0.15); }); break;
    case "auto": {
      // three-round burst with brass ejected from the breech
      const side = o.localToWorld(new THREE.Vector3(1, 0, 0)).sub(o.getWorldPosition(new THREE.Vector3())).normalize();
      for (let i = 0; i < 3; i++) setTimeout(() => {
        const tt = to.clone().add(new THREE.Vector3((Math.random() - 0.5) * U, (Math.random() - 0.5) * U, 0));
        fxFlash(from, "#ffe2a8", U * 0.3, 0.1);
        fxTracer(from, tt, "#ffc86a", U * 120, U * 0.06, (p) => { fxFlash(p, "#ffc86a", U * 0.4, 0.2); hitDrone(); });
        fxCasing(from.clone().addScaledVector(side, U * 0.3), side);
      }, i * 70);
      break; }
    case "flak": {
      // proximity fuse: shell detonates short of the target in a fragment cloud
      const dist = from.distanceTo(to); const burstAt = from.clone().lerp(to, 0.82 + Math.random() * 0.12);
      fxFlash(from, "#ffe2a8", U * 0.35, 0.12);
      fxTracer(from, burstAt, "#ffb03a", U * 90, U * 0.07, (p) => { fxBurst(p, "#ffb03a", U * 0.9); if (dist > 0) hitDrone(); });
      break; }
    case "lance":
      // continuous: a persistent beam is kept while firing (see opsUpdate); here only the muzzle bloom
      fxFlash(from, "#cf8bff", U * 0.5, 0.2); break;
    case "particle":
      for (let i = 0; i < 3; i++) { const jit = to.clone().add(new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).multiplyScalar(U * 0.35));
        fxBeam(from, jit, i ? "#bfe4ff" : "#ffffff", U * (i ? 0.02 : 0.05), 0.22); }
      fxFlash(to, "#bfe4ff", U * 0.8, 0.35); fxSparks(to, _v3.subVectors(from, to).normalize(), "#bfe4ff", 12); hitDrone(); break;
    case "ciws":
      fxBeam(from, to, "#7dffbe", U * 0.03, 0.08); if (Math.random() < 0.3) fxFlash(to, "#7dffbe", U * 0.3, 0.12); break;
  }
}
export function fireLauncher(o, t) {
  const Lc = o.userData.launcher;
  const cell = Lc.cells[Lc.i % Lc.cells.length]; Lc.i++;
  const from = o.localToWorld(new THREE.Vector3(cell[0], cell[1], cell[2]));
  const up = o.localToWorld(new THREE.Vector3(cell[0] + Lc.up[0], cell[1] + Lc.up[1], cell[2] + Lc.up[2])).sub(from).normalize();
  const tgt = targetDrone.getWorldPosition(new THREE.Vector3());
  const U = rig.U;
  switch (Lc.kind === "missile" ? (Lc.ammo || "he") : Lc.kind) {
    case "torpedo":
      fxPuff(from, up, U * 0.6, "#ffe6c0", 0.5); fxMissile(from, tgt, up, "#7dffbe", { life: 2.2 }); setTimeout(hitDrone, 2200); break;
    case "kkv":
      fxFlash(from, "#9fe8ff", U * 0.3, 0.15); fxMissile(from, tgt, up, "#9fe8ff", { straight: true, life: 0.55, small: true }); setTimeout(hitDrone, 550); break;
    case "nuke":
      fxPuff(from, up, U * 0.7, "#ffe6c0", 0.6); fxMissile(from, tgt, up, "#fff1d0", { life: 1.8, onArrive: (p) => { fxNuke(p); hitDrone(); if (targetDrone) targetDrone.userData.drone.hit = 1.2; } }); break;
    case "emp":
      fxPuff(from, up, U * 0.5, "#cfe9ff", 0.5); fxMissile(from, tgt, up, "#5fd0ff", { life: 1.4, onArrive: (p) => { fxEmp(p); hitDrone(); if (targetDrone) targetDrone.userData.drone.emp = 2.5; } }); break;
    case "cluster":
      fxPuff(from, up, U * 0.5, "#ffe6c0", 0.5); fxMissile(from, tgt, up, "#ffb03a", { life: 1.5, split: true }); setTimeout(hitDrone, 1500); break;
    case "chaff":
      fxPuff(from, up, U * 0.4, "#ffffff", 0.3); fxChaff(from, up); break;
    case "mine":
      fxPuff(from, up, U * 0.4, "#cfd8e6", 0.4); fxMine(from.clone().addScaledVector(up, U * 0.5), up); break;
    default:
      fxPuff(from, up, U * 0.5, "#ffe6c0", 0.5); fxMissile(from, tgt, up, "#ff8a2a"); setTimeout(hitDrone, 1500);
  }
}
export function hitDrone() { if (targetDrone) targetDrone.userData.drone.hit = 0.25; }

/* ---- mining ------------------------------------------------------- */
export function startMining() {
  if (!rock || !rig.root) return;
  rig.root.updateMatrixWorld(true);
  placeRock(rig.root);
  aimDrills();
  rock.visible = true;
  for (const b of miningBeams) fxScene().remove(b); miningBeams = [];
  for (const d of rig.drills) {
    const beam = new THREE.Mesh(FXG.cyl, fxMat("#ff8a2a", 0.7));
    const core = new THREE.Mesh(FXG.cyl, fxMat("#fff1d0", 0.9)); core.scale.set(0.3, 1, 0.3); beam.add(core);
    beam.userData.drill = d; fxScene().add(beam); miningBeams.push(beam);
  }
  if (!rig.drills.length) host.toast(rig.root && rig.root.name === "inspect" ? "THIS PART CANNOT MINE — TRY A DRILL BOOM" : "NO DRILL BOOMS MOUNTED — ADD FROM CATALOG 17");
}
export function stopMining() {
  if (rock) rock.visible = false;
  for (const d of rig.drills) d.userData.drill.extTarget = 0;
  for (const b of miningBeams) fxScene().remove(b); miningBeams = [];
}

/* ---- per-frame ops update --------------------------------------- */
let sparkClock = 0, chunkClock = 0;
export function opsUpdate(dt, t) {
  if (!rig.root) return;
  const thr = ops.throttle;
  /* telescoping drill booms ease toward their extension target */
  for (const d of rig.drills) {
    const dd = d.userData.drill;
    if (dd.inner && Math.abs(dd.extTarget - dd.ext) > 1e-4) {
      dd.ext += (dd.extTarget - dd.ext) * Math.min(1, dt * 1.4);
      dd.inner.position.y = dd.innerBaseY + dd.ext / 2;
      dd.inner.scale.y = dd.innerBaseScale + dd.ext;
      dd.head.position.y = dd.headBaseY + dd.ext;
      dd.tip[1] = dd.tipBase + dd.ext;
    }
  }
  /* drive output follows the throttle */
  for (const l of rig.engineLights) l.intensity = l.userData.baseI * (0.12 + 0.88 * thr);
  const bmats = rig.builder && rig.builder.mats;
  if (bmats) {
    bmats.glow.emissiveIntensity = 3.2 * (0.3 + 0.7 * thr);
    bmats.hot.emissiveIntensity = 4.0 * (0.35 + 0.65 * thr);
  }
  const boost = Math.max(0, (thr - 0.85) / 0.15);
  for (const o of rig.srbPlumes) { const d = o.userData.srb; o.visible = boost > 0.01; o.scale.y = d.baseY * boost * (1 + Math.sin(t * 15 + o.id) * 0.2); o.material.opacity = d.op * boost; }
  /* RCS station-keeping puffs — busier while the throttle is being moved */
  if (ops.rcs && rig.rcs.length && t > ops.nextPuff) {
    const moving = Math.abs(thr - ops.lastThrottle) > 0.002;
    ops.nextPuff = t + (moving ? 0.12 : 0.6 + Math.random() * 1.4);
    const blk = rig.rcs[Math.floor(Math.random() * rig.rcs.length)];
    const nz = blk.userData.rcs.nozzles[Math.floor(Math.random() * blk.userData.rcs.nozzles.length)];
    const p = blk.localToWorld(new THREE.Vector3(...nz.pos));
    const dir = blk.localToWorld(new THREE.Vector3(nz.pos[0] + nz.dir[0], nz.pos[1] + nz.dir[1], nz.pos[2] + nz.dir[2])).sub(p).normalize();
    fxPuff(p, dir, rig.U * 0.22, "#eaf4ff", 0.3);
  }
  ops.lastThrottle += (thr - ops.lastThrottle) * Math.min(1, dt * 4);
  /* deployables ease between stowed and deployed */
  ops.deployT += ((ops.deploy ? 1 : 0) - ops.deployT) * Math.min(1, dt * 1.6);
  for (const o of rig.deployables) {
    const d = o.userData.deploy, v = d.from + (d.to - d.from) * ops.deployT;
    if (d.kind === "pos") o.position[d.axis] = v; else o.rotation[d.axis] = v;
  }
  /* docking: latches swing out, approach blinkers go steady green */
  ops.dockT += ((ops.docked ? 1 : 0) - ops.dockT) * Math.min(1, dt * 2.2);
  for (const o of rig.docks) {
    const d = o.userData.dock;
    for (const arm of d.arms) arm.rotation.x = 0.7 * ops.dockT;
    if (d.status) {
      d.status.userData.lamp.mode = ops.dockT > 0.5 ? "steady" : d.orig.mode;
      d.status.material.emissive.setHex(ops.dockT > 0.5 ? 0x2fff72 : d.orig.color);
      d.status.material.color.setHex(ops.dockT > 0.5 ? 0x2fff72 : d.orig.color);
    }
    for (const b of d.blinkers) b.userData.lamp.mode = ops.dockT > 0.5 ? "steady" : "blink";
    if (d.iris && bmats) d.iris.material = ops.dockT > 0.5 ? bmats.winLit : bmats.glassDark;
  }
  /* weapons */
  if (ops.firing && t > ops.fireEnd) { ops.firing = false; }
  if (targetDrone) {
    const D = targetDrone.userData.drone;
    targetDrone.visible = ops.firing || (D.fade > 0);
    D.fade = ops.firing ? 1 : Math.max(0, (D.fade || 0) - dt * 0.8);
    targetDrone.position.x += Math.sin(t * 0.6) * dt * rig.size.x * 0.05;
    targetDrone.position.y += Math.cos(t * 0.45) * dt * rig.size.y * 0.05;
    D.core.rotation.y += dt * 0.8; D.core.rotation.x += dt * 0.3;
    D.rings[0].rotation.z += dt * 1.2; D.rings[1].rotation.y -= dt * 0.9;
    D.hit = Math.max(0, (D.hit || 0) - dt);
    const flash = D.hit > 0 ? 1 : 0;
    D.core.material.emissive = D.core.material.emissive || new THREE.Color();
    D.core.material.emissive.setRGB(flash, flash * 0.3, flash * 0.2);
    for (const r of D.rings) r.material.opacity = (0.5 + 0.4 * Math.sin(t * 5)) * D.fade;
    D.lamp.material.opacity = D.fade;
    if (ops.firing) {
      for (const o of rig.turrets) { const T = o.userData.turret; if (t > T.next) { T.next = t + T.rate * (0.8 + Math.random() * 0.4); fireShot(o, t); } }
      for (const o of rig.launchers) { const Lc = o.userData.launcher; if (t > Lc.next) { Lc.next = t + Lc.rate; fireLauncher(o, t); } }
    }
  }
  /* mining */
  if (ops.mining && rock) {
    rock.rotation.y += dt * 0.08; rock.rotation.x += dt * 0.03;
    sparkClock += dt; chunkClock += dt;
    const rockW = rock.position;
    for (const b of miningBeams) {
      const d = b.userData.drill, dd = d.userData.drill, node = dd.node || d;
      const em = node.localToWorld(new THREE.Vector3(...dd.emitter));
      const tip = node.localToWorld(new THREE.Vector3(...dd.tip));
      // beam runs from the boom emitter to the rock face just past the tip
      const contact = _v1.copy(tip).addScaledVector(_v2.subVectors(rockW, tip).normalize(), rig.U * 0.25);
      const dir = _v3.subVectors(contact, em); const len = dir.length();
      b.position.copy(em).addScaledVector(dir, 0.5);
      b.quaternion.setFromUnitVectors(Y_AXIS, dir.normalize());
      const w = rig.U * 0.035 * (1 + Math.sin(t * 30 + d.id) * 0.3);
      b.scale.set(w, len, w);
      dd.head.userData.spin.speed = dd.baseSpin * 3.2;
      if (sparkClock > 0.07) fxSparks(contact, _v2.subVectors(tip, rockW).normalize(), Math.random() < 0.3 ? "#fff1d0" : "#ffb03a", 10);
      if (chunkClock > 0.32) {
        const it = rig.intakes.length ? rig.intakes[Math.floor(Math.random() * rig.intakes.length)] : null;
        const dest = it ? it.localToWorld(new THREE.Vector3(...it.userData.intake.mouth))
                        : rig.root.localToWorld(new THREE.Vector3(0, -rig.size.y * 0.45, 0));
        fxChunk(contact.clone(), dest);
      }
    }
    if (sparkClock > 0.07) sparkClock = 0;
    if (chunkClock > 0.32) chunkClock = 0;
  } else {
    for (const d of rig.drills) d.userData.drill.head.userData.spin.speed = d.userData.drill.baseSpin;
  }
  /* sensor sweep: dishes and pods spin up while a scan is live */
  const scanning = t < ops.scanUntil;
  for (const o of rig.sensors) if (o.userData.spin) o.userData.spin.boost = scanning ? 4 : 1;
  fxUpdate(dt);
}
export function doScan(t) {
  ops.scanUntil = t + 1.8;
  rig.root.updateMatrixWorld(true);
  const R = Math.max(rig.size.x, rig.size.z) * 1.1;
  let i = 0;
  for (const o of rig.sensors) {
    const p = o.getWorldPosition(new THREE.Vector3());
    const col = o.userData.sensor.kind === "radome" ? "#ff4a5a" : o.userData.sensor.kind === "pod" ? "#7dffbe" : "#5fd0ff";
    setTimeout(() => fxRing(p, R, col, 1.8), i * 90); i++;
  }
  if (!rig.sensors.length) host.toast("NO SENSOR HARDWARE MOUNTED");
}
