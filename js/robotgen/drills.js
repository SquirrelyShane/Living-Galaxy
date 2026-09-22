// robotgen/src/drills.js — a training sequence: put a machine through its paces
// so you can see the frame work. Movement, appendage range, attachment deploy,
// weapon tracking and firing, then progressive damage — parts destroyed, parts
// blown off and falling under the world's own gravity.
//
// Pure transform maths on top of animateRobot, so the whole sequence runs in the
// browser and headless in `node test/drills.js`.
import { animateRobot } from './build.js';
import { computeMassModel, matrixIn, EARTH_G } from './physics.js';

export const DRILLS = [
  { id: 'wake', label: 'Power up', seconds: 3 },
  { id: 'walk', label: 'Walk cycle', seconds: 6 },
  { id: 'gaitload', label: 'Gait under load', seconds: 6 },
  { id: 'turn', label: 'Turn in place', seconds: 4 },
  { id: 'reach', label: 'Appendage range', seconds: 6 },
  { id: 'grip', label: 'Grip and tool', seconds: 4 },
  { id: 'deploy', label: 'Attachment deploy', seconds: 5 },
  { id: 'track', label: 'Target tracking', seconds: 6 },
  { id: 'fire', label: 'Live fire', seconds: 5 },
  { id: 'shed', label: 'Panel loss', seconds: 4 },
  { id: 'mountloss', label: 'Mount destroyed', seconds: 5 },
  { id: 'limbloss', label: 'Limb severed', seconds: 6 },
  { id: 'compensate', label: 'Compensating', seconds: 6 },
  { id: 'rebuild', label: 'Refit', seconds: 3 }
];
export const DRILL_SECONDS = DRILLS.reduce((a, d) => a + d.seconds, 0);

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const ease = (u) => u * u * (3 - 2 * u);
const wrapPi = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

/* ---------- damage ---------- */
function worldOf(node, root) {
  const m = matrixIn(node, root, new Map());
  return { x: m[3], y: m[7], z: m[11] };
}

/**
 * Knock a part out: its lights die and it stops tracking, aiming or spinning,
 * but the hull stays on the frame. Detach it separately if it should fall off.
 */
export function destroyPart(rig, node, opts = {}) {
  if (!node || node.userData.destroyed) return false;
  node.userData.destroyed = true;
  const dead = (list, get) => {
    if (!list) return;
    for (let i = list.length - 1; i >= 0; i--) {
      const n = get ? get(list[i]) : list[i];
      if (!n) continue;
      if (isUnder(n, node)) list.splice(i, 1);
    }
  };
  // anything emissive in there goes dark
  for (const list of [rig.lamps, rig.beacons, rig.muzzles]) {
    for (let i = list.length - 1; i >= 0; i--) {
      if (isUnder(list[i], node)) { list[i].visible = false; list.splice(i, 1); }
    }
  }
  for (let i = rig.fields.length - 1; i >= 0; i--) {
    if (isUnder(rig.fields[i], node)) { rig.fields[i].visible = false; rig.fields.splice(i, 1); }
  }
  for (let i = rig.lasers.length - 1; i >= 0; i--) {
    if (isUnder(rig.lasers[i].beam, node)) { rig.lasers[i].beam.visible = false; rig.lasers[i].dot.visible = false; rig.lasers.splice(i, 1); }
  }
  dead(rig.turrets, x => x.node);
  dead(rig.spinners, x => x.node);
  dead(rig.hovering, x => x.node);
  dead(rig.rams, x => x.node);
  dead(rig.weapons, x => x.node);
  // flight and career kit stop working when the thing that carried them is gone:
  // a shot-out rotor stops turning, a severed pod stops pulsing
  dead(rig.rotors, x => x.node);
  dead(rig.tilts, x => x.node);
  dead(rig.surfaces, x => x.node);
  dead(rig.pods, x => x.node);
  dead(rig.hatches, x => x.node);
  dead(rig.armsAux, x => x.base);
  for (const list of [rig.beams, rig.pulses]) if (list) for (let i = list.length - 1; i >= 0; i--) {
    if (isUnder(list[i].node, node)) { list[i].node.visible = false; list.splice(i, 1); }
  }
  if (rig.navLights) for (let i = rig.navLights.length - 1; i >= 0; i--) {
    if (isUnder(rig.navLights[i].node, node)) { rig.navLights[i].node.visible = false; rig.navLights.splice(i, 1); }
  }
  if (rig.trays) for (let i = rig.trays.length - 1; i >= 0; i--) if (isUnder(rig.trays[i], node)) rig.trays.splice(i, 1);
  rig.colliders = rig.colliders.filter(c => !isUnder(c.node, node));
  rig.destroyed.push(node);
  if (opts.hide) node.visible = false;
  if (opts.spark !== false) addSparks(rig, node, worldOf(node, rig.root));
  return true;
}

/** Cut a subtree loose. It keeps its world pose, then falls under gravity. */
export function detachPart(rig, node, opts = {}) {
  if (!node || !node.parent || node.userData.detached) return null;
  const root = rig.root;
  const w = worldOf(node, root);
  const parent = node.parent;
  parent.remove(node);
  node.userData.detached = true;
  node.position.set(w.x, w.y, w.z);
  node.rotation.set(node.rotation.x, node.rotation.y, node.rotation.z);
  if (!rig.debris) rig.debris = root;
  rig.debris.add(node);
  rig.colliders = rig.colliders.filter(c => !isUnder(c.node, node));

  const kick = opts.kick === undefined ? 1 : opts.kick;
  const piece = {
    node,
    vel: {
      x: (opts.vx === undefined ? (w.x >= 0 ? 1 : -1) * 0.6 : opts.vx) * kick,
      y: (opts.vy === undefined ? 1.4 : opts.vy) * kick,
      z: (opts.vz === undefined ? 0.5 : opts.vz) * kick
    },
    spin: { x: 2.6 * kick, y: 1.7 * kick, z: 3.1 * kick },
    restY: opts.restY === undefined ? 0.04 : opts.restY,
    settled: false
  };
  rig.debrisPieces.push(piece);
  if (opts.spark !== false) addSparks(rig, parent, w);
  refreshMass(rig);
  return piece;
}

function isUnder(node, frame) {
  for (let n = node; n; n = n.parent) if (n === frame) return true;
  return false;
}
function refreshMass(rig) {
  // debris lives outside the frame, so the model drops the mass it lost
  rig.massModel = computeMassModel(rig.body);
  rig.massKg = Math.round(rig.massModel.totalKg * Math.pow(rig.scale || 1, 3) * 1000) / 1000;
}
function rand(rig) {
  rig.sparkSeed = (rig.sparkSeed * 9301 + 49297) % 233280;
  return rig.sparkSeed / 233280;
}
function addSparks(rig, host, at) {
  const pool = rig.sparkPool;
  if (!pool || !pool.length) return;
  const from = at || worldOf(host, rig.root);
  let budget = 6;
  for (const s of pool) {
    if (budget <= 0) break;
    if (s.life > 0) continue;
    budget--;
    s.life = 0.5 + rand(rig) * 0.9;
    s.node.visible = true;
    s.pos = { x: from.x, y: from.y, z: from.z };
    s.vel = { x: (rand(rig) - 0.5) * 1.4, y: 0.9 + rand(rig) * 1.1, z: (rand(rig) - 0.5) * 1.4 };
  }
}

/* ---------- the runner ---------- */
export function createDrillRunner(rig, opts = {}) {
  const gravity = opts.gravity === undefined ? EARTH_G : opts.gravity;
  const target = { x: 0, y: rig.spec.height * 0.75, z: 3, phase: 0 };
  const state = {
    index: 0, elapsed: 0, total: 0, loops: 0, drill: DRILLS[0], label: DRILLS[0].label,
    target, gravity, fired: 0, events: []
  };

  // a small pool of spark motes, parented to the root and reused
  rig.debris = rig.debris || makeGroup(rig, 'debris');

  // what this frame has to lose. An airframe carries no shoulder mount and often
  // no arm, so the drills take a rotor and a payload pod instead — the sequence
  // is about watching THIS machine come apart, not a generic one.
  const flying = rig.rotors && rig.rotors.length > 0;
  const picks = {
    panel: rig.panels[0] || (rig.pods && rig.pods[0] ? rig.pods[0].node : null),
    mount: findMount(rig) || (flying ? { node: rig.rotors[rig.rotors.length - 1].node.parent, inner: null } : null),
    arm: rig.arms.length ? rig.arms[rig.arms.length - 1] : null,
    rotor: flying ? rig.rotors[0] : null
  };

  function reset() {
    state.loops++; state.fired = 0; state.events.length = 0;
    rig.root.rotation.y = 0;              // the turn drill left it facing somewhere else
    for (const n of rig.destroyed) { n.visible = true; n.userData.destroyed = false; }
    rig.destroyed.length = 0;
    for (const p of rig.debrisPieces) if (p.node.parent) p.node.parent.remove(p.node);
    rig.debrisPieces.length = 0;
    refreshMass(rig);
  }

  function update(t, dt) {
    state.elapsed += dt;
    state.total += dt;
    let d = DRILLS[state.index];
    while (state.elapsed > d.seconds) {
      state.elapsed -= d.seconds;
      state.index = (state.index + 1) % DRILLS.length;
      if (state.index === 0) reset();
      d = DRILLS[state.index];
      state.events.push(d.id);
    }
    state.drill = d;
    state.label = d.label;
    const u = clamp(state.elapsed / d.seconds, 0, 1);

    // what the base animation should be doing during this drill
    const anim = { moving: false, speed: 1, gravity, aim: false };
    if (d.id === 'walk') { anim.moving = true; anim.speed = ease(clamp(u * 2, 0, 1)); }
    else if (d.id === 'gaitload') { anim.moving = true; anim.speed = 1; anim.gravity = gravity * (0.2 + u * 2.6); }
    else if (d.id === 'turn') { anim.moving = true; anim.speed = 0.55; }
    else if (d.id === 'track' || d.id === 'fire') { anim.aim = true; }
    else if (d.id === 'compensate') { anim.moving = true; anim.speed = 0.8; }
    else if (d.id === 'limbloss' || d.id === 'mountloss' || d.id === 'shed') { anim.moving = u > 0.5; anim.speed = 0.5; }
    animateRobot(rig, t, dt, anim);

    // then the drill's own overrides, applied on top of the pose
    if (d.id === 'wake') wake(rig, u);
    if (d.id === 'turn') rig.root.rotation.y += dt * 0.9;
    if (d.id === 'reach') reach(rig, u);
    if (d.id === 'grip') grip(rig, u, t);
    if (d.id === 'deploy') deploy(rig, u, t);
    if (d.id === 'track' || d.id === 'fire') {
      target.phase += dt * 0.8;
      target.x = Math.sin(target.phase) * rig.spec.height * 1.6;
      target.y = rig.spec.height * (0.55 + 0.35 * Math.sin(target.phase * 0.7));
      target.z = 2.2 + Math.cos(target.phase) * 0.8;
      aimAt(rig, target, dt);
    }
    if (d.id === 'fire') state.fired += fire(rig, u, t, dt);
    if (d.id === 'shed' && u > 0.35 && picks.panel) {
      if (detachPart(rig, picks.panel, { kick: 0.8 })) state.events.push('panel-off');
      picks.panel = null;
    }
    // two beats: the mount is knocked out (lights die, it stops tracking), then
    // the wreck falls off the shoulder
    if (d.id === 'mountloss' && u > 0.3 && picks.mount && !picks.mount.node.userData.destroyed) {
      destroyPart(rig, picks.mount.node);
      state.events.push('mount-dead');
    }
    if (d.id === 'mountloss' && u > 0.65 && picks.mount) {
      if (detachPart(rig, picks.mount.node, { kick: 1.2 })) state.events.push('mount-off');
      picks.mount = null;
    }
    // no arm to sever: an airframe loses a rotor and has to fly on what is left
    if (d.id === 'limbloss' && u > 0.35 && !picks.arm && picks.rotor) {
      const host = picks.rotor.node.parent || picks.rotor.node;
      destroyPart(rig, host);
      if (detachPart(rig, host, { kick: 1.1 })) state.events.push('rotor-off');
      picks.rotor = null;
    }
    if (d.id === 'limbloss' && u > 0.35 && picks.arm) {
      if (detachPart(rig, picks.arm.fore, { kick: 1.4 })) state.events.push('limb-off');
      const idx = rig.arms.indexOf(picks.arm);
      if (idx >= 0) rig.arms.splice(idx, 1);
      picks.arm = null;
    }
    if (d.id === 'rebuild') reset();

    stepDebris(rig, dt, gravity);
    stepSparks(rig, dt, gravity);
    return state;
  }

  return { state, update, reset, drills: DRILLS, seconds: DRILL_SECONDS };
}

function makeGroup(rig, name) {
  const g = Object.create(Object.getPrototypeOf(rig.root));
  // build a real node of the same class as the root, whatever THREE build made it
  const G = rig.root.constructor;
  const node = new G();
  node.name = name;
  rig.root.add(node);
  return node;
}
function findMount(rig) {
  let found = null;
  rig.root.traverse((o) => {
    if (found || !o.name || !o.name.startsWith('shoulder_mount_')) return;
    found = { node: o, inner: o.children[0] || o };
  });
  return found;
}

/* ---------- drill bodies ---------- */
function wake(rig, u) {
  const k = ease(u);
  for (const o of rig.optics) if (o.lens.material) o.lens.material.emissiveIntensity = k * 1.5;
  for (const l of rig.lamps) if (l.material) l.material.emissiveIntensity = (l.material.emissiveIntensity || 1) * k;
  if (rig.head) rig.head.rotation.x = (1 - k) * 0.35;
}
function reach(rig, u) {
  // sweep every arm joint through its usable range, one axis at a time
  const seg = u * 4;
  for (let i = 0; i < rig.arms.length; i++) {
    const a = rig.arms[i];
    const sgn = a.side.charAt(0) === 'L' ? 1 : -1;
    const p = clamp(seg - Math.floor(seg), 0, 1);
    const s = Math.sin(p * Math.PI);
    if (seg < 1) { a.upper.rotation.x = -s * 1.5; a.elbow.rotation.x = -0.2; }
    else if (seg < 2) { a.upper.rotation.z = -sgn * s * 1.1; a.upper.rotation.x = -0.2; }
    else if (seg < 3) { a.elbow.rotation.x = -s * 2.0; a.upper.rotation.x = -0.6; }
    else { a.wrist.rotation.y = sgn * (0.2 + s * 1.6); a.elbow.rotation.x = -0.9; a.upper.rotation.x = -0.8; }
  }
}
function grip(rig, u, t) {
  const close = 0.5 - 0.5 * Math.cos(u * Math.PI * 4);
  for (const f of rig.fingers) f.rotation.x = (f.userData.gripBase === undefined
    ? (f.userData.gripBase = f.rotation.x) : f.userData.gripBase) + close * 0.7;
  for (const s of rig.spinners) s.node.rotation.y += close * 0.25;
}
function deploy(rig, u, t) {
  const k = ease(clamp(u * 1.5, 0, 1));
  for (let i = 0; i < rig.turrets.length; i++) {
    const tu = rig.turrets[i];
    tu.node.rotation.x = -k * 0.5;
    tu.node.rotation.y = Math.sin(t * 1.6 + i) * 0.5 * k;
  }
  for (const p of rig.panels) p.rotation.x = -k * 0.35;
  for (const h of rig.hovering) h.node.position.y = h.baseY + k * h.amp * 4;
  for (const f of rig.fields) if (f.material) f.material.opacity = 0.1 + k * 0.3;
}

/** Point every turret, weapon arm and laser at a world-space target. */
export function aimAt(rig, target, dt) {
  const root = rig.root;
  for (let i = 0; i < rig.turrets.length; i++) {
    const tu = rig.turrets[i];
    const o = worldOf(tu.node, root);
    const yaw = Math.atan2(target.x - o.x, target.z - o.z);
    const flat = Math.hypot(target.x - o.x, target.z - o.z);
    const pitch = -Math.atan2(target.y - o.y, Math.max(0.05, flat));
    const wantLocal = clamp(wrapPi(yaw - parentYaw(tu.node, root)), -1.4, 1.4);
    tu.node.rotation.y = approach(tu.node.rotation.y, wantLocal, dt * 8);
    tu.node.rotation.x = approach(tu.node.rotation.x, clamp(pitch, -0.9, 0.9), dt * 8);
    tu.aimWant = wantLocal;
    tu.aimError = Math.abs(wrapPi(tu.node.rotation.y - wantLocal));
  }
  for (const arm of rig.arms) {
    const o = worldOf(arm.shoulder, root);
    const flat = Math.hypot(target.x - o.x, target.z - o.z);
    const pitch = -Math.atan2(target.y - o.y, Math.max(0.05, flat)) - Math.PI / 2;
    arm.upper.rotation.x = approach(arm.upper.rotation.x, clamp(pitch, -2.4, 0.4), dt * 4);
    const yaw = wrapPi(Math.atan2(target.x - o.x, target.z - o.z) - parentYaw(arm.shoulder, root));
    arm.shoulder.rotation.y = approach(arm.shoulder.rotation.y || 0, clamp(yaw, -1.1, 1.1), dt * 4);
    arm.elbow.rotation.x = approach(arm.elbow.rotation.x, -0.25, dt * 4);
  }
  for (const l of rig.lasers) {
    l.beam.scale.y = 9;
    l.beam.position.y = l.y0 - l.baseLen * 4.5;
  }
  if (rig.head) {
    const o = worldOf(rig.head, root);
    const hy = wrapPi(Math.atan2(target.x - o.x, target.z - o.z) - parentYaw(rig.head, root));
    rig.head.rotation.y = approach(rig.head.rotation.y, clamp(hy, -1.2, 1.2), dt * 3);
  }
}
function approach(v, want, k) { return v + (want - v) * clamp(k, 0, 1); }
/* a node's yaw in root space, so a local rotation can be aimed at a world point
   even when the whole robot has turned around */
function parentYaw(node, root) {
  if (!node.parent || node.parent === root) return 0;
  const m = matrixIn(node.parent, root, new Map());
  return Math.atan2(m[2], m[10]);      // uniform scale cancels in the ratio
}

function fire(rig, u, t, dt) {
  // 4 Hz burst: muzzles flash, weapons recoil, fields flare
  const beat = (t * 4) % 1;
  const wrapped = rig.lastBeat !== undefined && beat < rig.lastBeat;
  rig.lastBeat = beat;
  const flash = beat < 0.25 ? 1 - beat * 4 : 0;
  let shots = 0;
  for (const m of rig.muzzles) {
    if (m.material) m.material.emissiveIntensity = 0.35 + flash * 5;
    m.scale.setScalar(1 + flash * 0.9);
  }
  for (const w of rig.weapons) {
    if (w.recoil0 === undefined) w.recoil0 = w.node.position.y;
    w.node.position.y = w.recoil0 + flash * w.length * 0.12;
  }
  if (wrapped) shots = 1;                 // count the burst, not the frame it landed on
  for (const f of rig.fields) if (f.material) f.material.opacity = 0.16 + flash * 0.3;
  return shots;
}

/* ---------- debris and sparks ---------- */
export function stepDebris(rig, dt, gravity) {
  for (const p of rig.debrisPieces) {
    if (p.settled) continue;
    p.vel.y -= gravity * dt;
    p.node.position.x += p.vel.x * dt;
    p.node.position.y += p.vel.y * dt;
    p.node.position.z += p.vel.z * dt;
    p.node.rotation.x += p.spin.x * dt;
    p.node.rotation.y += p.spin.y * dt;
    p.node.rotation.z += p.spin.z * dt;
    if (p.node.position.y <= p.restY) {
      p.node.position.y = p.restY;
      if (Math.abs(p.vel.y) < 0.55) {
        p.vel.x = p.vel.y = p.vel.z = 0;
        p.spin.x = p.spin.y = p.spin.z = 0;
        p.settled = true;
      } else {
        p.vel.y = -p.vel.y * 0.34;      // bounce
        p.vel.x *= 0.6; p.vel.z *= 0.6;
        p.spin.x *= 0.5; p.spin.y *= 0.5; p.spin.z *= 0.5;
      }
    }
  }
}
function stepSparks(rig, dt, gravity) {
  const pool = rig.sparkPool;
  if (!pool) return;
  for (const s of pool) {
    if (s.life <= 0) { if (s.node.visible) s.node.visible = false; continue; }
    s.life -= dt;
    s.vel.y -= gravity * dt * 0.6;
    s.pos.x += s.vel.x * dt; s.pos.y += s.vel.y * dt; s.pos.z += s.vel.z * dt;
    if (s.pos.y < 0.01) { s.pos.y = 0.01; s.vel.y = Math.abs(s.vel.y) * 0.3; s.vel.x *= 0.5; s.vel.z *= 0.5; }
    s.node.position.set(s.pos.x, s.pos.y, s.pos.z);
    if (s.node.material) s.node.material.emissiveIntensity = Math.max(0, s.life) * 3;
    if (s.life <= 0) s.node.visible = false;
  }
}
