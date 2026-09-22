// robotgen/src/build.js — turns a spec (src/spec.js) into a THREE hierarchy.
// THREE is injected, so this file runs against real three.js in the browser and
// against the test stub in Node. No DOM access here (textures come in via opts).

import { LEGGED, FLYING } from './spec.js';
import { makeKit, put, group } from './parts.js';
import { buildAttachments, buildLimbEnd, applyFinish } from './attach.js';
import { buildRotor, buildPlane, animateFlight } from './fly.js';
import { computeMassModel, centreOfMass, resolveSeparation, gravityProfile, EARTH_G } from './physics.js';

const D2R = Math.PI / 180;

/* a coarse box per part: used to keep limbs out of each other, and exposed on
   the rig so a game can reuse the same volumes for hits and spacing */
function collide(rig, node, half, offset, name, group) {
  rig.colliders.push({ node, half, offset: offset || { x: 0, y: 0, z: 0 }, name, group });
}

/* ---------- torso ---------- */
function buildTorso(THREE, K, spec, rig, horizontal) {
  const T = spec.torso;
  const w = T.width, h = horizontal ? T.height * 0.8 : T.height, d = horizontal ? T.width * 1.65 : T.depth;
  const g = group(THREE, null, 'torso');

  let shell;
  if (T.shape === 'box') shell = put(THREE, g, K.box(w, h, d), K.base, 0, 0, 0, 0, 0, 0, 'torso_shell');
  else if (T.shape === 'barrel') shell = put(THREE, g, K.cyl(w * 0.5, w * 0.5, h, 14), K.base, 0, 0, 0, 0, 0, 0, 'torso_shell');
  else if (T.shape === 'hexplate') shell = put(THREE, g, K.cyl(w * 0.55, w * 0.55, h, 6), K.base, 0, 0, 0, 0, 0, 0, 'torso_shell');
  else if (T.shape === 'pod') {
    // an airframe pod: a capsule lying along the direction of travel
    shell = put(THREE, g, K.sph(w * 0.5, 14), K.base, 0, 0, 0, 0, 0, 0, 'torso_shell');
    shell.scale.set(1, h / w, d / w);
    put(THREE, g, K.cyl(w * 0.46, w * 0.46, Math.min(h, d) * 0.5, 12), K.second, 0, 0, 0, Math.PI / 2, 0, 0, 'pod_barrel');
  }
  else if (T.shape === 'capsule') {
    // caps sit inside the stated torso height, or a wide chassis hangs below the hips
    const cr = Math.min(w * 0.46, h * 0.45);
    const barrel = Math.max(h * 0.1, h - 2 * cr);
    shell = put(THREE, g, K.cyl(cr, cr, barrel, 14), K.base, 0, 0, 0, 0, 0, 0, 'torso_shell');
    put(THREE, g, K.sph(cr, 12), K.base, 0, h * 0.5 - cr, 0);
    put(THREE, g, K.sph(cr, 12), K.base, 0, -(h * 0.5 - cr), 0);
  } else if (T.shape === 'segmented') {
    shell = put(THREE, g, K.box(w * 0.94, h * 0.34, d * 0.94), K.base, 0, h * 0.3, 0, 0, 0, 0, 'torso_shell');
    put(THREE, g, K.cyl(w * 0.3, w * 0.3, h * 0.26, 10), K.trim, 0, h * 0.06, 0, 0, 0, 0, 'waist_ring');
    put(THREE, g, K.box(w * 0.86, h * 0.36, d * 0.9), K.base, 0, -h * 0.22, 0);
  } else if (T.shape === 'cage') {
    shell = put(THREE, g, K.cyl(w * 0.3, w * 0.3, h * 0.9, 8), K.second, 0, 0, 0, 0, 0, 0, 'torso_shell');
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      put(THREE, g, K.box(w * 0.09, h * 0.95, w * 0.09), K.base, Math.cos(a) * w * 0.44, 0, Math.sin(a) * d * 0.44, 0, -a, 0, 'spar' + i);
    }
    put(THREE, g, K.torus(w * 0.46, w * 0.05, 6, 14), K.trim, 0, h * 0.4, 0, Math.PI / 2, 0, 0);
    put(THREE, g, K.torus(w * 0.46, w * 0.05, 6, 14), K.trim, 0, -h * 0.4, 0, Math.PI / 2, 0, 0);
  } else shell = put(THREE, g, K.cyl(w * 0.38, w * 0.55, h, 10), K.base, 0, 0, 0, 0, 0, 0, 'torso_shell');
  if (T.shape !== 'box' && T.shape !== 'pod' && T.shape !== 'segmented' && horizontal) shell.scale.set(1, 1, d / w);
  if (T.sealed) {   // dust and pressure seals: gaskets over every torso seam
    put(THREE, g, K.torus(w * 0.52, h * 0.035, 6, 16), K.rubber, 0, h * 0.3, 0, Math.PI / 2, 0, 0, 'seal_top');
    put(THREE, g, K.torus(w * 0.52, h * 0.035, 6, 16), K.rubber, 0, -h * 0.3, 0, Math.PI / 2, 0, 0, 'seal_low');
  }

  // chest plate
  if (T.chestPlate) {
    const pw = w * 0.72, ph = h * 0.55, pd = Math.max(0.015, d * 0.12);
    put(THREE, g, K.box(pw, ph, pd), K.second, 0, h * 0.08, d * 0.5, 0, 0, 0, 'chest_plate');
    if (T.armorTier > 1) {
      put(THREE, g, K.box(pw * 1.05, ph * 0.28, pd * 0.8), K.trim, 0, -h * 0.22, d * 0.52, 0, 0, 0, 'chest_belly');
      put(THREE, g, K.box(w * 0.28, h * 0.7, pd), K.second, -w * 0.52, 0, d * 0.18, 0, 0, 0, 'pauldron_l');
      put(THREE, g, K.box(w * 0.28, h * 0.7, pd), K.second, w * 0.52, 0, d * 0.18, 0, 0, 0, 'pauldron_r');
    }
  }
  // core lamp
  if (T.coreLamp) {
    const gm = K.glow(spec.palette.accent, 1.2);
    const cz = d * 0.52 + 0.01;
    if (T.coreShape === 'disc') put(THREE, g, K.cyl(h * 0.13, h * 0.13, 0.02, 12), gm, 0, h * 0.05, cz, Math.PI / 2, 0, 0, 'core');
    else if (T.coreShape === 'slot') put(THREE, g, K.box(w * 0.42, h * 0.07, 0.02), gm, 0, h * 0.05, cz, 0, 0, 0, 'core');
    else {
      put(THREE, g, K.box(w * 0.34, h * 0.06, 0.02), gm, 0, h * 0.05, cz, 0, 0, 0, 'core');
      put(THREE, g, K.box(w * 0.06, h * 0.34, 0.02), gm, 0, h * 0.05, cz, 0, 0, 0, 'core_b');
    }
    g.traverse((o) => { if (o.name && o.name.startsWith('core')) rig.lamps.push(o); });
  }
  // vents + ribs
  for (let i = 0; i < T.vents; i++) {
    const y = h * (0.32 - i * 0.16);
    put(THREE, g, K.box(w * 0.5, h * 0.035, 0.012), K.trim, 0, y, -d * 0.5 - 0.006, 0, 0, 0, 'vent' + i);
  }
  for (let i = 0; i < T.ribs; i++) {
    const y = h * (-0.3 + i * 0.22);
    put(THREE, g, K.box(w * 1.03, h * 0.05, d * 1.03), K.trim, 0, y, 0, 0, 0, 0, 'rib' + i);
  }
  // backpack
  const bz = -d * 0.5;
  if (T.backpack === 'tank') {
    put(THREE, g, K.cyl(w * 0.16, w * 0.16, h * 0.8, 10), K.second, -w * 0.2, 0, bz - w * 0.16);
    put(THREE, g, K.cyl(w * 0.16, w * 0.16, h * 0.8, 10), K.second, w * 0.2, 0, bz - w * 0.16);
  } else if (T.backpack === 'rack') {
    put(THREE, g, K.box(w * 0.8, h * 0.6, w * 0.22), K.second, 0, h * 0.05, bz - w * 0.11);
    put(THREE, g, K.box(w * 0.84, h * 0.06, w * 0.26), K.trim, 0, h * 0.3, bz - w * 0.11);
  } else if (T.backpack === 'reactor') {
    put(THREE, g, K.box(w * 0.6, h * 0.55, w * 0.25), K.second, 0, h * 0.02, bz - w * 0.13);
    const lamp = put(THREE, g, K.cyl(h * 0.09, h * 0.09, 0.02, 10), K.glow(spec.palette.accent, 1.0), 0, h * 0.02, bz - w * 0.26, Math.PI / 2, 0, 0, 'reactor_lamp');
    rig.lamps.push(lamp);
  } else if (T.backpack === 'drum') {
    put(THREE, g, K.cyl(w * 0.28, w * 0.28, w * 0.34, 12), K.second, 0, h * 0.05, bz - w * 0.18, Math.PI / 2, 0, 0);
  }
  // decal
  if (T.decal !== 'none') {
    const dm = K.mat('decal', spec.palette.accent, { emissive: spec.palette.accent, emissiveIntensity: 0.12, roughness: 0.6 });
    if (T.decal === 'stripe') put(THREE, g, K.box(w * 0.1, h * 0.9, 0.008), dm, w * 0.3, 0, d * 0.52 + 0.012);
    else if (T.decal === 'chevron') {
      put(THREE, g, K.box(w * 0.42, h * 0.07, 0.008), dm, -w * 0.1, h * 0.2, d * 0.52 + 0.012, 0, 0, 0.5);
      put(THREE, g, K.box(w * 0.42, h * 0.07, 0.008), dm, w * 0.1, h * 0.2, d * 0.52 + 0.012, 0, 0, -0.5);
    } else if (T.decal === 'block') put(THREE, g, K.box(w * 0.3, h * 0.22, 0.008), dm, -w * 0.25, -h * 0.25, d * 0.52 + 0.012);
    else put(THREE, g, K.box(w * 0.2, h * 0.2, 0.008), dm, w * 0.28, -h * 0.22, d * 0.52 + 0.012);
  }
  // hip skirt
  if (T.hipSkirt) {
    put(THREE, g, K.box(w * 0.42, h * 0.35, d * 0.3), K.second, -w * 0.3, -h * 0.55, d * 0.1);
    put(THREE, g, K.box(w * 0.42, h * 0.35, d * 0.3), K.second, w * 0.3, -h * 0.55, d * 0.1);
  }
  if (T.shoulderYoke) put(THREE, g, K.box(w * 1.12, h * 0.16, d * 0.7), K.second, 0, h * 0.48, 0, 0, 0, 0, 'yoke');

  g.userData.dims = { w, h, d };
  return g;
}

/* ---------- head ---------- */
function buildHead(THREE, K, spec, rig) {
  const H = spec.head, s = H.size;
  const head = group(THREE, null, 'head');
  let front = s * 0.5;

  let halfH = s * 0.4;
  if (H.type === 'dome') {
    put(THREE, head, K.sph(s * 0.5, 14), K.base, 0, s * 0.08, 0);
    put(THREE, head, K.cyl(s * 0.46, s * 0.5, s * 0.3, 12), K.second, 0, -s * 0.18, 0);
    front = s * 0.46; halfH = s * 0.33;
  } else if (H.type === 'box') {
    put(THREE, head, K.box(s * 0.9, s * 0.8, s * 0.85), K.base, 0, 0, 0);
    put(THREE, head, K.box(s * 0.94, s * 0.12, s * 0.9), K.trim, 0, s * 0.44, 0);
    front = s * 0.43; halfH = s * 0.4;
  } else if (H.type === 'visor') {
    put(THREE, head, K.box(s * 1.05, s * 0.62, s * 0.7), K.base, 0, 0, 0);
    put(THREE, head, K.box(s * 1.0, s * 0.26, s * 0.06), K.dark, 0, s * 0.05, s * 0.36);
    front = s * 0.38; halfH = s * 0.31;
  } else if (H.type === 'cluster') {
    put(THREE, head, K.box(s * 0.8, s * 0.7, s * 0.7), K.base, 0, 0, 0);
    put(THREE, head, K.cyl(s * 0.16, s * 0.16, s * 0.5, 8), K.second, -s * 0.34, s * 0.2, s * 0.2, Math.PI / 2, 0, 0);
    put(THREE, head, K.cyl(s * 0.13, s * 0.13, s * 0.44, 8), K.second, s * 0.36, -s * 0.05, s * 0.2, Math.PI / 2, 0, 0);
    front = s * 0.36; halfH = s * 0.35;
  } else if (H.type === 'insect') {
    const b = put(THREE, head, K.sph(s * 0.5, 12), K.base, 0, 0, 0);
    b.scale.set(1.0, 0.72, 1.25);
    front = s * 0.5; halfH = s * 0.36;
  } else if (H.type === 'turret') {
    put(THREE, head, K.cyl(s * 0.62, s * 0.7, s * 0.5, 12), K.base, 0, 0, 0);
    put(THREE, head, K.cyl(s * 0.5, s * 0.62, s * 0.16, 12), K.second, 0, s * 0.32, 0);
    front = s * 0.6; halfH = s * 0.25;
  } else if (H.type === 'mandible') {
    put(THREE, head, K.box(s * 0.78, s * 0.6, s * 0.8), K.base, 0, 0, 0);
    for (const sx of [-1, 1]) {
      const jaw = group(THREE, head, 'mandible' + (sx < 0 ? 'L' : 'R'), sx * s * 0.3, -s * 0.24, s * 0.24);
      jaw.rotation.z = sx * 0.3;
      put(THREE, jaw, K.cone(s * 0.12, s * 0.62, 6), K.second, 0, -s * 0.24, 0, Math.PI * 0.92, 0, 0, 'tusk');
      rig.fingers.push(jaw);
    }
    front = s * 0.4; halfH = s * 0.42;
  } else if (H.type === 'crown') {
    put(THREE, head, K.cyl(s * 0.44, s * 0.5, s * 0.6, 10), K.base, 0, 0, 0);
    for (let i = 0; i < 5; i++) {
      const a = -0.9 + i * 0.45;
      put(THREE, head, K.box(s * 0.07, s * 0.42, s * 0.16), K.second, Math.sin(a) * s * 0.42, s * 0.42, Math.cos(a) * s * 0.28, 0, -a, Math.sin(a) * 0.4, 'crown_spine' + i);
    }
    front = s * 0.44; halfH = s * 0.52;
  } else if (H.type === 'skull') {
    const cr = put(THREE, head, K.sph(s * 0.44, 12), K.base, 0, s * 0.06, -s * 0.04);
    cr.scale.set(1, 0.92, 1.12);
    put(THREE, head, K.box(s * 0.5, s * 0.24, s * 0.4), K.second, 0, -s * 0.3, s * 0.18, 0.18, 0, 0, 'jawplate');
    for (const sx of [-1, 1]) put(THREE, head, K.box(s * 0.1, s * 0.34, s * 0.34), K.trim, sx * s * 0.4, -s * 0.02, s * 0.06, 0, 0, 0, 'cheek');
    front = s * 0.44; halfH = s * 0.45;
  } else if (H.type === 'array') {
    put(THREE, head, K.box(s * 1.0, s * 0.42, s * 0.42), K.base, 0, 0, 0);
    for (let i = 0; i < 4; i++) {
      const x = (-0.5 + i / 3) * s * 0.8;
      put(THREE, head, K.cyl(s * 0.09, s * 0.09, s * 0.4, 8), K.second, x, s * 0.3, 0, 0, 0, 0, 'array_can' + i);
      put(THREE, head, K.sph(s * 0.07, 8), K.glow(H.optics.color, 1.1), x, s * 0.5, 0);
    }
    front = s * 0.22; halfH = s * 0.34;
  } else if (H.type === 'ball') {
    // gimbal ball: a sensor turret that rolls inside its yoke
    put(THREE, head, K.cyl(s * 0.5, s * 0.54, s * 0.22, 12), K.second, 0, s * 0.38, 0, 0, 0, 0, 'ball_yoke');
    for (const sx of [-1, 1]) put(THREE, head, K.box(s * 0.1, s * 0.42, s * 0.18), K.second, sx * s * 0.46, s * 0.14, 0);
    const b = put(THREE, head, K.sph(s * 0.46, 14), K.base, 0, -s * 0.06, 0, 0, 0, 0, 'ball_shell');
    b.scale.set(1, 0.94, 1);
    front = s * 0.46; halfH = s * 0.42;
  } else if (H.type === 'wedge') {
    // low-profile faceted head — what a stealth airframe carries
    const b = put(THREE, head, K.cyl(s * 0.22, s * 0.62, s * 0.5, 6), K.base, 0, 0, 0, 0, 0, 0, 'wedge_shell');
    b.scale.set(1, 1, 1.35);
    put(THREE, head, K.box(s * 0.9, s * 0.07, s * 0.7), K.trim, 0, s * 0.24, 0, 0, 0, 0, 'wedge_cap');
    front = s * 0.44; halfH = s * 0.28;
  } else { // periscope
    put(THREE, head, K.box(s * 0.55, s * 0.5, s * 0.5), K.base, 0, 0, 0);
    put(THREE, head, K.box(s * 0.2, s * 0.36, s * 0.1), K.dark, 0, s * 0.08, s * 0.28);
    front = s * 0.26; halfH = s * 0.25;
  }

  if (H.grill) put(THREE, head, K.box(s * 0.45, s * 0.12, 0.01), K.trim, 0, -s * 0.26, front + 0.004, 0, 0, 0, 'grill');
  if (H.earPods) {
    put(THREE, head, K.cyl(s * 0.13, s * 0.13, s * 0.12, 10), K.second, -s * 0.5, s * 0.02, 0, 0, 0, Math.PI / 2, 'ear_l');
    put(THREE, head, K.cyl(s * 0.13, s * 0.13, s * 0.12, 10), K.second, s * 0.5, s * 0.02, 0, 0, 0, Math.PI / 2, 'ear_r');
  }
  if (H.crest) put(THREE, head, K.box(s * 0.07, s * 0.22, s * 0.8), K.second, 0, s * 0.46, -s * 0.05, 0, 0, 0, 'crest');

  /* optics */
  const O = H.optics, r = O.radius, lens = K.glow(O.color, 1.5);
  const socket = K.dark;
  const eyeY = s * 0.06;
  const pos = [];
  if (O.layout === 'cyclops') pos.push([0, eyeY, r]);
  else if (O.layout === 'stereo') { pos.push([-s * 0.2, eyeY, r]); pos.push([s * 0.2, eyeY, r]); }
  else if (O.layout === 'triad') { pos.push([0, eyeY + s * 0.16, r]); pos.push([-s * 0.22, eyeY - s * 0.08, r]); pos.push([s * 0.22, eyeY - s * 0.08, r]); }
  else if (O.layout === 'band') {
    for (let i = 0; i < O.count; i++) pos.push([(-0.5 + i / Math.max(1, O.count - 1)) * s * 0.66, eyeY, r * 0.9]);
  } else {
    for (let i = 0; i < O.count; i++) {
      const a = (i / O.count) * Math.PI * 2;
      pos.push([Math.cos(a) * s * 0.22, eyeY + Math.sin(a) * s * 0.18, r * (0.8 + 0.2 * Math.cos(a))]);
    }
  }
  while (pos.length < O.count) pos.push([(pos.length % 2 ? 1 : -1) * s * 0.28, eyeY - s * 0.2, r * 0.8]);
  pos.length = O.count;

  for (let i = 0; i < pos.length; i++) {
    const [x, y, zr] = pos[i];
    const eye = group(THREE, head, 'optic' + i, x, y, front - r * 0.35);
    put(THREE, eye, K.cyl(r * 1.35, r * 1.35, r * 0.5, 10), socket, 0, 0, 0, Math.PI / 2, 0, 0, 'socket');
    const lensMesh = put(THREE, eye, K.sph(r, 10), lens, 0, 0, r * 0.32, 0, 0, 0, 'lens');
    if (O.shutter) put(THREE, eye, K.box(r * 2.4, r * 0.5, r * 0.2), K.second, 0, r * 1.05, r * 0.2, 0, 0, 0, 'shutter');
    rig.optics.push({ node: eye, lens: lensMesh, phase: i * 0.7 });
  }
  if (O.scanBar) {
    const bar = put(THREE, head, K.box(s * 0.9, s * 0.05, 0.012), K.glow(O.color, 1.1), 0, eyeY, front + 0.006, 0, 0, 0, 'scanbar');
    rig.lamps.push(bar);
  }

  /* comm antenna */
  const A = H.antenna, aLen = A.length;
  const mountPos = A.mount === 'top' ? [0, s * 0.5, -s * 0.1]
    : A.mount === 'left' ? [-s * 0.42, s * 0.32, -s * 0.1]
    : A.mount === 'right' ? [s * 0.42, s * 0.32, -s * 0.1]
    : [0, s * 0.3, -s * 0.45];
  const ant = group(THREE, head, 'antenna', mountPos[0], mountPos[1], mountPos[2]);
  ant.rotation.z = (A.mount === 'left' ? 0.35 : A.mount === 'right' ? -0.35 : 0);
  ant.rotation.x = (A.mount === 'back' ? -0.45 : 0);
  const stalkR = Math.max(0.004, s * 0.035);
  put(THREE, ant, K.cyl(stalkR * 1.6, stalkR * 2.2, s * 0.12, 8), K.trim, 0, s * 0.05, 0, 0, 0, 0, 'ant_base');

  if (A.type === 'whip' || A.type === 'twin' || A.type === 'stub') {
    const n = A.type === 'twin' ? 2 : 1;
    const len = A.type === 'stub' ? aLen * 0.35 : aLen;
    for (let i = 0; i < n; i++) {
      const sub = group(THREE, ant, 'whip' + i, (n === 2 ? (i ? 1 : -1) * s * 0.12 : 0), s * 0.1, 0);
      sub.rotation.z = (n === 2 ? (i ? -0.18 : 0.18) : 0);
      put(THREE, sub, K.cyl(stalkR * 0.5, stalkR, len, 6), K.trim, 0, len * 0.5, 0);
      if (A.beacon) rig.beacons.push(put(THREE, sub, K.sph(stalkR * 2.2, 8), K.glow(A.beaconColor, 1.6), 0, len, 0, 0, 0, 0, 'beacon' + i));
      rig.antennas.push({ node: sub, len, phase: i * 1.3 });
    }
  } else if (A.type === 'dish') {
    const sub = group(THREE, ant, 'dishmount', 0, s * 0.1, 0);
    put(THREE, sub, K.cyl(stalkR * 0.7, stalkR, aLen * 0.5, 6), K.trim, 0, aLen * 0.25, 0);
    const dish = group(THREE, sub, 'dish', 0, aLen * 0.5, 0);
    const cup = put(THREE, dish, K.cone(aLen * 0.34, aLen * 0.26, 12), K.second, 0, 0, 0, Math.PI * 0.62, 0, 0, 'dish_cup');
    cup.scale.set(1, 0.5, 1);
    put(THREE, dish, K.cyl(stalkR * 0.4, stalkR * 0.4, aLen * 0.2, 6), K.trim, 0, 0, aLen * 0.12, Math.PI / 2, 0, 0, 'feedhorn');
    if (A.beacon) rig.beacons.push(put(THREE, dish, K.sph(stalkR * 1.8, 8), K.glow(A.beaconColor, 1.4), 0, 0, aLen * 0.22));
    rig.dish = dish;
    rig.antennas.push({ node: sub, len: aLen, phase: 0.4 });
  } else if (A.type === 'blade') {
    const sub = group(THREE, ant, 'blade', 0, s * 0.1, 0);
    const b = put(THREE, sub, K.box(stalkR * 1.2, aLen * 0.9, aLen * 0.28), K.second, 0, aLen * 0.45, -aLen * 0.06);
    b.name = 'blade_fin';
    if (A.beacon) rig.beacons.push(put(THREE, sub, K.sph(stalkR * 2, 8), K.glow(A.beaconColor, 1.5), 0, aLen * 0.92, 0));
    rig.antennas.push({ node: sub, len: aLen, phase: 0.9 });
  } else { // ring
    const sub = group(THREE, ant, 'ringmount', 0, s * 0.1, 0);
    put(THREE, sub, K.cyl(stalkR * 0.7, stalkR, aLen * 0.6, 6), K.trim, 0, aLen * 0.3, 0);
    put(THREE, sub, K.torus(aLen * 0.26, stalkR * 0.8, 6, 14), K.second, 0, aLen * 0.62 + aLen * 0.24, 0, Math.PI / 2, 0, 0);
    if (A.beacon) rig.beacons.push(put(THREE, sub, K.sph(stalkR * 1.8, 8), K.glow(A.beaconColor, 1.5), 0, aLen * 0.62, 0));
    rig.antennas.push({ node: sub, len: aLen, phase: 1.7 });
  }
  head.userData.front = front;
  head.userData.halfH = halfH;
  return head;
}

/* ---------- arms ---------- */
function buildArm(THREE, K, spec, rig, side, mountY, mountX, mountZ, lenScale = 1, limbOverride) {
  const A = spec.arms;
  const th = A.thickness * (0.62 + 0.38 * lenScale), len = A.length * lenScale;
  const seg = A.segments;
  const upper = len * (seg === 3 ? 0.4 : 0.5);
  const fore = len * (seg === 3 ? 0.34 : 0.5);
  const wristLen = seg === 3 ? len * 0.26 : 0;

  const shoulder = group(THREE, null, `shoulder_${side}`, mountX, mountY, mountZ);
  put(THREE, shoulder, K.sph(th * 0.75, 10), K.second, 0, 0, 0, 0, 0, 0, 'shoulder_ball');
  const upperG = group(THREE, shoulder, `upper_${side}`, 0, 0, 0);
  put(THREE, upperG, K.cyl(th * 0.42, th * 0.5, upper, 8), K.base, 0, -upper * 0.5, 0, 0, 0, 0, 'upperarm');
  if (A.piston) put(THREE, upperG, K.cyl(th * 0.14, th * 0.14, upper * 0.7, 6), K.trim, th * 0.4, -upper * 0.45, -th * 0.2);

  const elbow = group(THREE, upperG, `elbow_${side}`, 0, -upper, 0);
  put(THREE, elbow, K.cyl(th * 0.42, th * 0.42, th * 0.6, 8), K.second, 0, 0, 0, 0, 0, Math.PI / 2, 'elbow_pin');
  const foreG = group(THREE, elbow, `fore_${side}`, 0, 0, 0);
  put(THREE, foreG, K.cyl(th * 0.34, th * 0.44, fore, 8), K.base, 0, -fore * 0.5, 0, 0, 0, 0, 'forearm');

  let wristParent = foreG, wristY = -fore;
  if (seg === 3) {
    const w2 = group(THREE, foreG, `fore2_${side}`, 0, -fore, 0);
    put(THREE, w2, K.cyl(th * 0.28, th * 0.34, wristLen, 8), K.second, 0, -wristLen * 0.5, 0);
    wristParent = w2; wristY = -wristLen;
  }
  const wrist = group(THREE, wristParent, `wrist_${side}`, 0, wristY, 0);
  // pronation: palms face the body, as on a humanoid arm at rest
  wrist.rotation.y = (side.charAt(0) === 'L' ? 1 : -1) * 0.2;
  shoulder.rotation.x = -0.05;
  elbow.rotation.x = -0.18;                 // elbows sit slightly flexed, never locked

  const limbType = limbOverride || ((spec.attachments && spec.attachments.limbs)
    ? spec.attachments.limbs[side.charAt(0)] : 'stock');
  const replaced = buildLimbEnd(THREE, K, spec, rig, wrist, th, limbType, side);

  const hand = replaced ? 'none' : A.hand;
  if (hand === 'gripper') {
    put(THREE, wrist, K.box(th * 0.8, th * 0.5, th * 0.7), K.second, 0, -th * 0.25, 0, 0, 0, 0, 'palm');
    for (let i = 0; i < 3; i++) {
      const f = group(THREE, wrist, 'finger' + i, (i - 1) * th * 0.28, -th * 0.5, 0);
      f.rotation.x = 0.25 * (i === 1 ? -1 : 1);
      put(THREE, f, K.box(th * 0.2, th * 0.55, th * 0.2), K.trim, 0, -th * 0.28, 0);
      rig.fingers.push(f);
    }
  } else if (hand === 'claw') {
    put(THREE, wrist, K.cyl(th * 0.4, th * 0.34, th * 0.4, 8), K.second, 0, -th * 0.2, 0);
    for (let i = 0; i < 2; i++) {
      const f = group(THREE, wrist, 'claw' + i, 0, -th * 0.4, 0);
      f.rotation.z = i ? 0.35 : -0.35;
      put(THREE, f, K.box(th * 0.24, th * 0.8, th * 0.3), K.trim, 0, -th * 0.4, 0);
      rig.fingers.push(f);
    }
  } else if (hand === 'tool') {
    put(THREE, wrist, K.cyl(th * 0.36, th * 0.36, th * 0.5, 8), K.second, 0, -th * 0.25, 0);
    const bit = put(THREE, wrist, K.cone(th * 0.3, th * 0.9, 8), K.trim, 0, -th * 0.95, 0, Math.PI, 0, 0, 'tool_bit');
    rig.spinners.push({ node: bit, axis: 'y', rate: 6 });
  } else if (hand === 'manipulator') {
    put(THREE, wrist, K.box(th * 0.6, th * 0.4, th * 0.6), K.second, 0, -th * 0.2, 0);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const f = group(THREE, wrist, 'digit' + i, Math.cos(a) * th * 0.22, -th * 0.4, Math.sin(a) * th * 0.22);
      f.rotation.x = Math.sin(a) * 0.3; f.rotation.z = -Math.cos(a) * 0.3;
      put(THREE, f, K.cyl(th * 0.07, th * 0.09, th * 0.6, 6), K.trim, 0, -th * 0.3, 0);
      rig.fingers.push(f);
    }
  } else if (hand === 'weapon') {
    const hg = group(THREE, wrist, `handgun_${side}`, 0, 0, 0);
    put(THREE, hg, K.cyl(th * 0.42, th * 0.42, th * 1.4, 10), K.dark, 0, -th * 0.7, 0);
    rig.muzzles.push(put(THREE, hg, K.cyl(th * 0.2, th * 0.2, th * 0.2, 8), K.glow(spec.palette.accent, 0.4), 0, -th * 1.45, 0, 0, 0, 0, 'muzzle'));
    rig.weapons.push({ node: hg, length: th * 1.5, scale: th * 0.55, side });
  } else if (!replaced) {
    put(THREE, wrist, K.box(th * 0.7, th * 0.25, th * 0.7), K.second, 0, -th * 0.15, 0, 0, 0, 0, 'pad');
  }

  // hardpoint for props / tools (figure-rig style socket)
  const hp = group(THREE, wrist, `hp_hand_${side}`, 0, -th * 0.6, 0);
  rig.hardpoints.push(hp);

  const armRec = {
    side, shoulder, upper: upperG, elbow, fore: foreG, wrist,
    len: upper + fore + wristLen, radius: th * 0.32, abduct: 0
  };
  rig.arms.push(armRec);
  collide(rig, upperG, [th * 0.55, upper * 0.5, th * 0.55], { x: 0, y: -upper * 0.5, z: 0 }, 'upper_' + side, 'arm');
  collide(rig, foreG, [th * 0.48, fore * 0.5, th * 0.48], { x: 0, y: -fore * 0.5, z: 0 }, 'fore_' + side, 'arm');
  collide(rig, wrist, [th * 0.6, th * 0.6, th * 0.6], { x: 0, y: -th * 0.5, z: 0 }, 'hand_' + side, 'arm');

  // underslung weapon
  if (A.weapon && A.weapon.side === side) {
    const W = A.weapon, wl = W.length;
    const wg = group(THREE, foreG, `weapon_${side}`, 0, -fore * 0.55, th * 0.5);
    rig.weapons.push({ node: wg, length: wl, scale: th * 0.62, side });
    if (W.type === 'barrel') {
      put(THREE, wg, K.cyl(th * 0.3, th * 0.34, wl, 10), K.dark, 0, -wl * 0.3, 0, 0, 0, 0, 'barrel');
      rig.muzzles.push(put(THREE, wg, K.cyl(th * 0.16, th * 0.16, wl * 0.1, 8), K.glow(spec.palette.accent, 0.35), 0, -wl * 0.82, 0));
    } else if (W.type === 'launcher') {
      put(THREE, wg, K.box(th * 0.9, wl * 0.5, th * 0.9), K.dark, 0, -wl * 0.25, 0);
      for (let i = 0; i < 4; i++) put(THREE, wg, K.cyl(th * 0.16, th * 0.16, wl * 0.52, 6), K.trim, (i % 2 ? 1 : -1) * th * 0.22, -wl * 0.25, (i < 2 ? 1 : -1) * th * 0.22);
    } else if (W.type === 'emitter') {
      put(THREE, wg, K.cyl(th * 0.36, th * 0.2, wl * 0.7, 8), K.second, 0, -wl * 0.3, 0);
      rig.muzzles.push(put(THREE, wg, K.sph(th * 0.24, 10), K.glow(spec.palette.accent, 1.1), 0, -wl * 0.66, 0));
    } else {
      const disc = put(THREE, wg, K.cyl(wl * 0.3, wl * 0.3, th * 0.12, 14), K.second, 0, -wl * 0.45, 0, 0, 0, Math.PI / 2, 'cutter');
      rig.spinners.push({ node: disc, axis: 'y', rate: 14 });
    }
  }
  return shoulder;
}

/* ---------- legs ---------- */
function buildLeg(THREE, K, spec, rig, name, x, z, yaw) {
  const L = spec.locomotion;
  const th = L.thickness, len = L.legLength;
  const thigh = len * (L.style === 'digitigrade' ? 0.42 : 0.5);
  const shin = len * (L.style === 'digitigrade' ? 0.36 : 0.5);
  const ankleLen = L.style === 'digitigrade' ? len * 0.22 : 0;
  const footH = Math.max(0.03, th * 0.5);

  const hip = group(THREE, null, `hip_${name}`, x, 0, z);
  hip.rotation.y = yaw || 0;
  put(THREE, hip, K.sph(th * 0.8, 10), K.second, 0, 0, 0, 0, 0, 0, 'hip_ball');
  // +rotation.z swings a hanging leg toward +x, so the LEFT hip needs a negative
  // angle to splay outward. This was inverted and folded every walker's feet
  // together under its belly.
  if (L.splay && (L.type !== 'biped')) hip.rotation.z = (x < 0 ? -1 : 1) * L.splay;

  const thighG = group(THREE, hip, `thigh_${name}`);
  put(THREE, thighG, K.cyl(th * 0.5, th * 0.62, thigh, 8), K.base, 0, -thigh * 0.5, 0, 0, 0, 0, 'thigh');
  if (L.style === 'piston') put(THREE, thighG, K.cyl(th * 0.16, th * 0.16, thigh * 0.8, 6), K.trim, 0, -thigh * 0.45, -th * 0.45);

  const knee = group(THREE, thighG, `knee_${name}`, 0, -thigh, 0);
  put(THREE, knee, K.cyl(th * 0.44, th * 0.44, th * 0.7, 8), K.second, 0, 0, 0, 0, 0, Math.PI / 2, 'knee_pin');
  const shinG = group(THREE, knee, `shin_${name}`);
  put(THREE, shinG, K.cyl(th * 0.36, th * 0.5, shin, 8), K.base, 0, -shin * 0.5, 0, 0, 0, 0, 'shin');

  let ankleParent = shinG, ankleY = -shin;
  if (ankleLen > 0) {
    const pastern = group(THREE, shinG, `pastern_${name}`, 0, -shin, 0);
    put(THREE, pastern, K.cyl(th * 0.28, th * 0.34, ankleLen, 8), K.second, 0, -ankleLen * 0.5, 0);
    ankleParent = pastern; ankleY = -ankleLen;
  }
  const ankle = group(THREE, ankleParent, `ankle_${name}`, 0, ankleY, 0);

  if (L.footType === 'flat') {
    put(THREE, ankle, K.box(th * 1.3, footH, th * 2.4), K.second, 0, -footH * 0.5, th * 0.35, 0, 0, 0, 'foot');
    put(THREE, ankle, K.box(th * 1.2, footH * 0.5, th * 0.8), K.rubber, 0, -footH, th * 1.1);
  } else if (L.footType === 'claw') {
    put(THREE, ankle, K.box(th * 0.9, footH, th * 0.9), K.second, 0, -footH * 0.5, 0, 0, 0, 0, 'foot');
    for (let i = 0; i < 3; i++) {
      const a = -0.5 + i * 0.5;
      const t = put(THREE, ankle, K.cone(th * 0.2, th * 1.0, 6), K.trim, Math.sin(a) * th * 0.5, -footH * 0.7, th * 0.55 + Math.cos(a) * th * 0.2, Math.PI * 0.55, a, 0);
      t.name = 'talon' + i;
    }
  } else if (L.footType === 'hoof') {
    put(THREE, ankle, K.cyl(th * 0.5, th * 0.7, footH * 1.6, 8), K.trim, 0, -footH * 0.8, 0, 0, 0, 0, 'foot');
  } else {
    put(THREE, ankle, K.sph(th * 0.75, 10), K.rubber, 0, -footH * 0.5, 0, 0, 0, 0, 'foot');
  }

  // how far the lowest bit of the foot actually hangs below the ankle
  const footDrop = L.footType === 'flat' ? footH * 1.25
    : L.footType === 'hoof' ? footH * 1.6
    : L.footType === 'claw' ? footH * 0.85
    : footH * 0.5;
  const splay = hip.rotation.z || 0;
  const splayCos = Math.cos(splay);
  // a splayed leg tips the sole, so its outer corner is the real contact point
  const footHalf = L.footType === 'flat' ? th * 0.65 : L.footType === 'claw' ? th * 0.45
    : L.footType === 'hoof' ? th * 0.35 : 0;
  // round pads keep their radius under the ankle whatever the tilt
  const footExtra = L.footType === 'pad' ? th * 0.75 : 0;   // a round sole keeps its radius under the ankle
  // and a sole with LENGTH digs its heel or toe in as the ankle pitches — that
  // term was missing, which is why a splayed foot could sink into the floor
  const footLong = L.footType === 'flat' ? th * 1.25 : L.footType === 'claw' ? th * 0.6
    : L.footType === 'hoof' ? th * 0.4 : 0;
  const lateral = footHalf * Math.abs(Math.sin(splay)) + footExtra;
  const stand = (thigh + shin + ankleLen + footDrop) * splayCos + lateral;

  const legRec = {
    name, hip, thigh: thighG, knee, shin: shinG, ankle, len,
    seg: { thigh, shin, ankle: ankleLen, foot: footDrop },
    splayCos, lateral, footHalf, footExtra, footLong, radius: th * 0.7, splay0: splay, hipBase: splay,
    // armour bolted to a limb hangs somewhere the sole is not; each plate records
    // its own lowest corner so the ground solve can measure it too
    plates: [],
    hipLocalY: 0, phase: 0, kneeSign: 1,
    footY: -stand
  };
  rig.legs.push(legRec);
  collide(rig, thighG, [th * 0.62, thigh * 0.5, th * 0.62], { x: 0, y: -thigh * 0.5, z: 0 }, 'thigh_' + name, 'leg');
  collide(rig, shinG, [th * 0.55, shin * 0.5, th * 0.55], { x: 0, y: -shin * 0.5, z: 0 }, 'shin_' + name, 'leg');
  collide(rig, ankle, [th * 0.75, footH, th * 1.3], { x: 0, y: -footH * 0.5, z: th * 0.3 }, 'foot_' + name, 'leg');
  return { hip, drop: stand };
}

/* ---------- tracks / wheels / hover ---------- */
/* closed track path in the y/z plane: top run, front arc, bottom run, rear arc.
   s grows in the direction the belt travels when the unit drives forward. */
export function trackPoint(loop, s) {
  const L = loop.L, r = loop.r, per = loop.perimeter;
  let d = (((s % 1) + 1) % 1) * per;
  const arc = Math.PI * r;
  if (d < L) return { y: r, z: -L / 2 + d, a: 0 };
  d -= L;
  if (d < arc) { const th = d / r; return { y: r * Math.cos(th), z: L / 2 + r * Math.sin(th), a: th }; }
  d -= arc;
  if (d < L) return { y: -r, z: L / 2 - d, a: Math.PI };
  d -= L;
  const th = Math.PI + d / r;
  return { y: r * Math.cos(th), z: -L / 2 + r * Math.sin(th), a: th };
}
export function placeTrackLinks(loop, offset) {
  loop.offset = offset;
  for (const lk of loop.links) {
    const p = trackPoint(loop, lk.s + offset);
    lk.node.position.set(0, p.y, p.z);
    lk.node.rotation.x = p.a;
  }
}

function buildTracks(THREE, K, spec, rig, opts) {
  const L = spec.locomotion;
  const g = group(THREE, null, 'drive_tracks');
  const r = L.height * 0.5, len = L.length, w = L.width;
  const sideX = (spec.torso.width * 0.5 + w * 0.5) * 0.95;
  const pairs = L.tracks === 4 ? [[-sideX, len * 0.32], [sideX, len * 0.32], [-sideX, -len * 0.32], [sideX, -len * 0.32]] : [[-sideX, 0], [sideX, 0]];
  const unitLen = L.tracks === 4 ? len * 0.55 : len;

  for (let i = 0; i < pairs.length; i++) {
    const [x, z] = pairs[i];
    const t = group(THREE, g, 'track' + i, x, r, z);
    const beltMat = K.mat('belt', '#17181b', { metalness: 0.2, roughness: 0.95 });
    if (opts && opts.trackTexture) {
      const tex = opts.trackTexture(L);
      if (tex) { beltMat.map = tex; rig.trackMaps.push(tex); }
    }
    put(THREE, t, K.box(w, r * 2, unitLen), beltMat, 0, 0, 0, 0, 0, 0, 'belt');
    put(THREE, t, K.cyl(r, r, w * 1.02, 12), beltMat, 0, 0, unitLen * 0.5, 0, 0, Math.PI / 2, 'idler_f');
    put(THREE, t, K.cyl(r, r, w * 1.02, 12), beltMat, 0, 0, -unitLen * 0.5, 0, 0, Math.PI / 2, 'idler_r');
    // sprockets spin
    const sf = put(THREE, t, K.cyl(r * 0.55, r * 0.55, w * 1.1, 8), K.second, 0, 0, unitLen * 0.5, 0, 0, Math.PI / 2, 'sprocket_f');
    const sr = put(THREE, t, K.cyl(r * 0.55, r * 0.55, w * 1.1, 8), K.second, 0, 0, -unitLen * 0.5, 0, 0, Math.PI / 2, 'sprocket_r');
    rig.spinners.push({ node: sf, driven: true, ratio: -1 / 0.55 }, { node: sr, driven: true, ratio: -1 / 0.55 });
    for (let k = 0; k < L.roadWheels; k++) {
      const zz = -unitLen * 0.42 + (unitLen * 0.84) * (k / Math.max(1, L.roadWheels - 1));
      const rw = put(THREE, t, K.cyl(r * 0.42, r * 0.42, w * 1.06, 8), K.trim, 0, -r * 0.35, zz, 0, 0, Math.PI / 2, 'roadwheel' + k);
      rig.spinners.push({ node: rw, driven: true, ratio: -1 / 0.42 });
    }
    if (L.skirt) put(THREE, t, K.box(w * 0.35, r * 1.1, unitLen * 0.95), K.second, (x < 0 ? -1 : 1) * w * 0.6, r * 0.35, 0, 0, 0, 0, 'skirt');

    // the belt itself: track links riding a closed stadium path, so the plates
    // travel around the hull instead of the end sprockets spinning on their own
    const perimeter = 2 * unitLen + Math.PI * 2 * r;
    const count = Math.max(12, Math.min(30, Math.round(perimeter / (r * 0.42))));
    const pitch = perimeter / count;
    const loop = { links: [], L: unitLen, r, perimeter, offset: 0, radius: r };
    for (let k = 0; k < count; k++) {
      const link = put(THREE, t, K.box(w * 1.12, r * 0.11, pitch * 0.82), K.trim, 0, 0, 0, 0, 0, 0, 'link' + k);
      loop.links.push({ node: link, s: k / count });
    }
    placeTrackLinks(loop, 0);
    rig.trackLoops.push(loop);
    collide(rig, t, [w * 0.6, r, unitLen * 0.5 + r], null, 'track' + i, 'drive');
  }
  return { node: g, drop: L.height };
}

function buildWheels(THREE, K, spec, rig) {
  const L = spec.locomotion;
  const g = group(THREE, null, 'drive_wheels');
  const R = L.radius, w = L.width;
  const halfW = spec.torso.width * 0.5 + w * 0.35;
  const wheelbase = spec.torso.depth * 1.15 + R;
  let slots = [];
  if (L.wheels === 2) slots = [[-halfW, 0], [halfW, 0]];
  else if (L.wheels === 3) slots = [[0, wheelbase * 0.55], [-halfW, -wheelbase * 0.4], [halfW, -wheelbase * 0.4]];
  else if (L.wheels === 4) slots = [[-halfW, wheelbase * 0.45], [halfW, wheelbase * 0.45], [-halfW, -wheelbase * 0.45], [halfW, -wheelbase * 0.45]];
  else slots = [[-halfW, wheelbase * 0.5], [halfW, wheelbase * 0.5], [-halfW, 0], [halfW, 0], [-halfW, -wheelbase * 0.5], [halfW, -wheelbase * 0.5]];

  for (let i = 0; i < slots.length; i++) {
    const [x, z] = slots[i];
    const mount = group(THREE, g, 'wheelmount' + i, x, R, z);
    // suspension
    if (L.suspension === 'strut') put(THREE, mount, K.cyl(R * 0.16, R * 0.16, R * 0.9, 6), K.second, -Math.sign(x || 1) * R * 0.1, R * 0.5, 0, 0.2, 0, 0);
    else if (L.suspension === 'arm') put(THREE, mount, K.box(R * 0.22, R * 0.22, R * 1.2), K.second, -Math.sign(x || 1) * R * 0.15, R * 0.35, -z * 0.25);
    else {
      put(THREE, mount, K.cyl(R * 0.1, R * 0.1, R * 1.1, 6), K.second, 0, R * 0.5, w * 0.5);
      put(THREE, mount, K.cyl(R * 0.1, R * 0.1, R * 1.1, 6), K.second, 0, R * 0.5, -w * 0.5);
    }
    const wheel = group(THREE, mount, 'wheel' + i);
    put(THREE, wheel, K.cyl(R, R, w, 14), K.rubber, 0, 0, 0, 0, 0, Math.PI / 2, 'tyre');
    put(THREE, wheel, K.cyl(R * 0.55, R * 0.55, w * 1.04, 12), K.second, 0, 0, 0, 0, 0, Math.PI / 2, 'rim');
    for (let s = 0; s < L.spokes; s++) {
      const a = (s / L.spokes) * Math.PI * 2;
      put(THREE, wheel, K.box(R * 0.12, R * 1.0, w * 0.5), K.trim, Math.sign(x || 1) * 0, 0, 0, 0, 0, a);
    }
    if (L.hubLamp) rig.lamps.push(put(THREE, wheel, K.cyl(R * 0.2, R * 0.2, w * 1.1, 10), K.glow(spec.palette.accent, 0.9), 0, 0, 0, 0, 0, Math.PI / 2, 'hub'));
    rig.wheels.push({ node: wheel, radius: R });
    collide(rig, mount, [w * 0.6, R, R], null, 'wheel' + i, 'drive');
  }
  if (L.gyro) put(THREE, g, K.cyl(R * 0.5, R * 0.5, spec.torso.width * 0.5, 10), K.second, 0, R, 0, 0, 0, Math.PI / 2, 'gyro');
  return { node: g, drop: R * 2 };
}

function buildHover(THREE, K, spec, rig) {
  const L = spec.locomotion;
  const g = group(THREE, null, 'drive_hover');
  const w = spec.torso.width;
  if (L.skirt === 'ring') put(THREE, g, K.torus(w * 0.62, w * 0.14, 8, 18), K.second, 0, w * 0.16, 0, Math.PI / 2, 0, 0, 'skirt');
  else if (L.skirt === 'plate') put(THREE, g, K.cyl(w * 0.72, w * 0.58, w * 0.16, 12), K.second, 0, w * 0.14, 0, 0, 0, 0, 'skirt');
  for (let i = 0; i < L.thrusters; i++) {
    const a = (i / L.thrusters) * Math.PI * 2;
    const px = Math.cos(a) * w * 0.5, pz = Math.sin(a) * w * 0.5;
    put(THREE, g, K.cyl(w * 0.12, w * 0.16, w * 0.2, 8), K.second, px, w * 0.16, pz);
    const plume = put(THREE, g, K.cone(w * 0.1, w * 0.26, 8), K.mat('plume', L.plumeColor, { emissive: L.plumeColor, emissiveIntensity: 1.5, transparent: true, opacity: 0.55 }), px, w * 0.0, pz, Math.PI, 0, 0, 'plume' + i);
    rig.plumes.push(plume);
  }
  if (L.fins) {
    put(THREE, g, K.box(w * 0.08, w * 0.3, w * 0.5), K.second, -w * 0.55, w * 0.3, -w * 0.2);
    put(THREE, g, K.box(w * 0.08, w * 0.3, w * 0.5), K.second, w * 0.55, w * 0.3, -w * 0.2);
  }
  return { node: g, drop: L.hoverHeight + w * 0.28 };
}


/* ---------- measurement ----------
   Every geometry the kit makes records its half-extents, so the builder can
   measure what it just built without a THREE.Box3 and without the DOM — the
   same numbers in the browser and in the node stub. Used to sit a flyer on its
   lowest point, because on an airframe the tallest thing is a rotor, not the head. */
function composeM(p, r, sc) {
  const cx = Math.cos(r.x), sx = Math.sin(r.x);
  const cy = Math.cos(r.y), sy = Math.sin(r.y);
  const cz = Math.cos(r.z), sz = Math.sin(r.z);
  const m = [
    cy * cz, -cy * sz, sy,
    sx * sy * cz + cx * sz, -sx * sy * sz + cx * cz, -sx * cy,
    -cx * sy * cz + sx * sz, cx * sy * sz + sx * cz, cx * cy
  ];
  return [
    m[0] * sc.x, m[1] * sc.y, m[2] * sc.z, p.x,
    m[3] * sc.x, m[4] * sc.y, m[5] * sc.z, p.y,
    m[6] * sc.x, m[7] * sc.y, m[8] * sc.z, p.z
  ];
}
function mulM(a, b) {
  const o = new Array(12);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    let v = 0;
    for (let k = 0; k < 3; k++) v += a[r * 4 + k] * b[k * 4 + c];
    o[r * 4 + c] = v + (c === 3 ? a[r * 4 + 3] : 0);
  }
  return o;
}
export function measureNode(node) {
  const out = { minY: Infinity, maxY: -Infinity, radius: 0, meshes: 0 };
  const walk = (o, m) => {
    const local = composeM(o.position, o.rotation, o.scale);
    const world = m ? mulM(m, local) : local;
    const half = o.geometry && o.geometry.userData && o.geometry.userData.half;
    if (half) {
      out.meshes++;
      for (let i = 0; i < 8; i++) {
        const x = (i & 1 ? half[0] : -half[0]), y = (i & 2 ? half[1] : -half[1]), z = (i & 4 ? half[2] : -half[2]);
        const py = world[4] * x + world[5] * y + world[6] * z + world[7];
        const px = world[0] * x + world[1] * y + world[2] * z + world[3];
        const pz = world[8] * x + world[9] * y + world[10] * z + world[11];
        if (!Number.isFinite(py)) continue;
        if (py < out.minY) out.minY = py;
        if (py > out.maxY) out.maxY = py;
        const rr = Math.hypot(px, pz);
        if (rr > out.radius) out.radius = rr;
      }
    }
    for (const c of o.children) walk(c, world);
  };
  walk(node, null);
  if (!isFinite(out.minY)) { out.minY = 0; out.maxY = 1; }
  return out;
}

/* ---------- assembly ---------- */
export function buildRobot(THREE, spec, opts = {}) {
  const K = makeKit(THREE, spec, opts);
  const rig = {
    spec, optics: [], antennas: [], beacons: [], lamps: [], arms: [], legs: [],
    wheels: [], spinners: [], plumes: [], fingers: [], muzzles: [], hardpoints: [],
    trackMaps: [], trackLoops: [], turrets: [], lasers: [], panels: [], shields: [],
    weapons: [], colliders: [],
    // damage model + deployables
    hovering: [], rams: [], fields: [], destroyed: [], debrisPieces: [], sparkPool: [], sparkSeed: 7919,
    // flight + career kit
    rotors: [], tilts: [], surfaces: [], wings: [], navLights: [], beams: [], pulses: [],
    hatches: [], screens: [], armsAux: [], pods: [], trays: [],
    lean: { roll: 0, pitch: 0 }, stance: { x: 0, z: 0 }, gaitPhase: 0, walkPhase: 0, gait: 0
  };

  const root = new THREE.Group();
  root.name = 'robot_' + spec.designation;
  const body = group(THREE, root, 'body');

  const L = spec.locomotion;
  const horizontal = (L.type === 'quadruped' || L.type === 'hexapod' || L.type === 'octoped');
  const torso = buildTorso(THREE, K, spec, rig, horizontal);
  const dims = torso.userData.dims;

  /* drive + torso height */
  let drop = 0;
  if (LEGGED.has(L.type)) {
    // gait phases: biped alternates, quadruped trots on diagonals,
    // hexapod uses the alternating tripod, tripod steps in thirds
    const PHASES = {
      biped: [0, 0.5],
      quadruped: [0, 0.5, 0.5, 0],
      hexapod: [0, 0.5, 0.5, 0, 0, 0.5],
      octoped: [0, 0.5, 0.5, 0, 0, 0.5, 0.5, 0],
      tripod: [0, 1 / 3, 2 / 3]
    };
    const phases = PHASES[L.type];
    const hipY = 0; // legs hang from torso bottom
    const hipW = L.hipWidth || dims.w * 0.6;
    const zs = L.type === 'biped' ? [0]
      : L.type === 'tripod' ? [dims.d * 0.4, -dims.d * 0.4]
      : L.type === 'quadruped' ? [dims.d * 0.42, -dims.d * 0.42]
      : L.type === 'octoped' ? [dims.d * 0.46, dims.d * 0.16, -dims.d * 0.16, -dims.d * 0.46]
      : [dims.d * 0.42, 0, -dims.d * 0.42];
    let made = 0;
    if (L.type === 'tripod') {
      const specs = [[0, dims.d * 0.45, 0], [-hipW * 0.5, -dims.d * 0.35, 0], [hipW * 0.5, -dims.d * 0.35, 0]];
      for (const [x, z] of specs) {
        const r = buildLeg(THREE, K, spec, rig, 'l' + made, x, z, 0);
        torso.add(r.hip); r.hip.position.y = -dims.h * 0.5 + hipY;
        const rec = rig.legs[rig.legs.length - 1];
        rec.hipLocalY = r.hip.position.y; rec.phase = phases[made] || 0;
        drop = r.drop; made++;
      }
    } else {
      for (const z of zs) {
        for (const sx of [-1, 1]) {
          const r = buildLeg(THREE, K, spec, rig, (sx < 0 ? 'L' : 'R') + made, sx * hipW * 0.5, z, 0);
          torso.add(r.hip);
          r.hip.position.y = -dims.h * 0.5 + hipY;
          const rec = rig.legs[rig.legs.length - 1];
          rec.hipLocalY = r.hip.position.y;
          rec.phase = phases[made] || 0;
          // front limbs of a walker bend the other way — elbow, not knee
          rec.kneeSign = (L.type !== 'biped' && z > 0.001) ? -1 : 1;
          drop = r.drop; made++;
        }
      }
    }
    body.add(torso);
    torso.position.y = drop + dims.h * 0.5;
  } else {
    let d;
    if (L.type === 'tracked') d = buildTracks(THREE, K, spec, rig, opts);
    else if (L.type === 'wheeled') d = buildWheels(THREE, K, spec, rig);
    else if (L.type === 'rotor') d = buildRotor(THREE, K, spec, rig);
    else if (L.type === 'plane') d = buildPlane(THREE, K, spec, rig);
    else d = buildHover(THREE, K, spec, rig);
    body.add(d.node);
    body.add(torso);
    const lift = L.type === 'hover' ? L.hoverHeight : 0;
    d.node.position.y = lift;
    // a flyer parks on its gear: the drive node already sits at the gear height,
    // so the pod goes straight on top of it and altitude is animation only
    const seat = FLYING.has(L.type) ? d.drop
      : lift + d.drop * (L.type === 'wheeled' ? 0.62 : 0.75) + dims.h * 0.5;
    torso.position.y = seat;
    drop = torso.position.y - dims.h * 0.5;
    rig.hoverBaseY = lift;
    rig.driveNode = d.node;
    if (FLYING.has(L.type)) {
      d.node.position.y = d.drop;                  // booms and wings ride with the pod
      rig.flightHeight = L.flightHeight || spec.height * 0.4;
    }
  }
  rig.torso = torso;
  rig.body = body;
  rig.torsoBaseY = torso.position.y;
  rig.hull = { half: [dims.w * 0.5, dims.h * 0.5, dims.d * 0.5], offset: { x: 0, y: 0, z: 0 } };
  collide(rig, torso, rig.hull.half, rig.hull.offset, 'torso', 'torso');

  /* head + neck — the column always spans the gap, so the head can't float */
  const head = buildHead(THREE, K, spec, rig);
  const H = spec.head;
  const neck = group(THREE, torso, 'neck', 0, dims.h * 0.5, horizontal ? dims.d * 0.34 : 0);
  const gap = H.neck.type === 'none' ? 0
    : H.neck.type === 'ball' ? Math.min(H.neck.length, H.size * 0.3)
    : H.neck.length;
  if (gap > 0.005) {
    const nr = H.neck.type === 'stalk' ? H.size * 0.13 : H.size * 0.26;
    put(THREE, neck, K.cyl(nr * 0.9, nr, gap + H.size * 0.12, 10), K.trim, 0, gap * 0.5, 0, 0, 0, 0, 'neck_column');
    if (H.neck.type === 'ball') put(THREE, neck, K.sph(nr * 1.05, 10), K.second, 0, gap, 0, 0, 0, 0, 'neck_ball');
  }
  head.position.y = gap + head.userData.halfH;
  neck.add(head);
  rig.head = head;
  rig.neck = neck;
  rig.headTop = dims.h * 0.5 + gap + head.userData.halfH * 2;
  collide(rig, head, [H.size * 0.5, head.userData.halfH, H.size * 0.5], null, 'head', 'head');

  /* arms */
  if (spec.arms.count > 0) {
    const mountY = dims.h * (spec.arms.mount === 'high' ? 0.42 : spec.arms.mount === 'side' ? 0.12 : 0.32);
    const mountX = dims.w * 0.5 + spec.arms.thickness * 0.35;
    const lowY = Math.max(mountY - dims.h * 0.42, -dims.h * 0.42);
    const pairs = spec.arms.count >= 4 ? [[mountY, 0], [lowY, dims.d * 0.05]] : [[mountY, 0]];
    for (let p = 0; p < pairs.length; p++) {
      const [my, mz] = pairs[p];
      // keep the hand off the floor: reach is capped by clearance under the mount
      const clearance = torso.position.y + my;
      const mods = spec.attachments && spec.attachments.weaponMods;
      const extra = mods ? spec.arms.thickness * (mods.laser ? 2.6 : 1.2) : 0;
      const limb = spec.attachments && spec.attachments.limbs
        && (spec.attachments.limbs.L === 'blade' || spec.attachments.limbs.R === 'blade'
          || spec.attachments.limbs.L === 'drill' || spec.attachments.limbs.R === 'drill')
        ? spec.arms.thickness * 4.8 : 0;
      const reach = spec.arms.length + spec.arms.thickness * 3.2 + extra + limb;
      const lenScale = reach > clearance * 0.82 ? Math.max(0.3, (clearance * 0.82) / reach) : 1;
      // a low mount on a wheeled or tracked chassis has no room for a blade or
      // a drill, so that pair keeps stock hands rather than digging into the floor
      const roomy = clearance * 0.82 > spec.arms.length * lenScale + spec.arms.thickness * 7;
      const over = roomy ? undefined : 'stock';
      if (spec.arms.count === 1) {
        torso.add(buildArm(THREE, K, spec, rig, 'R', my, mountX, mz, lenScale, over));
      } else {
        torso.add(buildArm(THREE, K, spec, rig, 'L' + (p || ''), my, -mountX, mz, lenScale, over));
        torso.add(buildArm(THREE, K, spec, rig, 'R' + (p || ''), my, mountX, mz, lenScale, over));
      }
    }
  }

  /* bolt-on hardware: shoulder mounts, armor panels, weapon mods, back units */
  buildAttachments(THREE, K, spec, rig, { torso, dims, head, body });
  applyFinish(THREE, K, spec, rig, { torso, dims, head, body });

  /* normalise. A walker is normalised off its head-top, which is what the gait
     and framing suites were tuned against. An airframe is normalised off what it
     MEASURES, because the top of a flyer is a rotor disc or a fin, and the
     bottom is a belly pod as often as it is the gear. */
  let scale, topY;
  if (FLYING.has(L.type)) {
    const m = measureNode(body);
    const span = Math.max(0.05, m.maxY - m.minY);
    scale = spec.height / span;
    body.scale.set(scale, scale, scale);
    body.position.y = -m.minY * scale;
    rig.measured = m;
    topY = m.maxY;
    drop = Math.max(0, -m.minY);
  } else {
    topY = torso.position.y + rig.headTop;
    scale = spec.height / Math.max(0.05, topY);
    body.scale.set(scale, scale, scale);
  }
  root.userData.spec = spec;
  root.userData.rig = rig;
  rig.root = root;
  rig.scale = scale;
  rig.standY = drop * scale;

  // a reusable pool of spark motes for the damage drills — parented to the root,
  // hidden until something is hit, and outside the mass model on purpose
  const sparkG = group(THREE, root, 'sparks');
  rig.sparkPool = [];
  const sparkMat = K.glow('#ffd08a', 2.4);
  for (let i = 0; i < 14; i++) {
    const m = put(THREE, sparkG, K.box(0.018, 0.018, 0.018), sparkMat, 0, 0.02, 0, 0, 0, 0, 'spark' + i);
    m.visible = false;
    m.userData.spark = true;
    rig.sparkPool.push({ node: m, life: 0, pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 } });
  }

  rig.massModel = computeMassModel(body);
  rig.massKg = Math.round(rig.massModel.totalKg * Math.pow(scale, 3) * 1000) / 1000;
  rig.com = centreOfMass(rig.massModel, torso);

  rig.dispose = () => {
    for (const g of K.geos) g.dispose && g.dispose();
    for (const m of K.mats) m.dispose && m.dispose();
  };
  return { root, rig, dispose: rig.dispose };
}

/* ---------- animation ---------- */
/* Gait model: hip is a sinusoid, knee gets a loading-response bump plus a big
   swing flexion, and the ankle is solved so the foot stays flat through stance
   and rolls off the toe. Body height is then solved from the legs each frame
   (lowest foot defines the ground) instead of a canned bob, which is what stops
   feet skating or sinking. Signs: +rotation.x swings a limb backwards, so hip
   flexion is negative and knee flexion is positive. */
const GAIT = {
  biped:     { freq: 0.95, hip: 0.42, knee: 1.10, stance: 0.62, lean: 0.06 },
  quadruped: { freq: 1.30, hip: 0.34, knee: 0.85, stance: 0.58, lean: 0.02 },
  hexapod:   { freq: 1.45, hip: 0.26, knee: 0.70, stance: 0.55, lean: 0.01 },
  octoped:   { freq: 1.50, hip: 0.22, knee: 0.62, stance: 0.55, lean: 0.01 },
  tripod:    { freq: 0.80, hip: 0.30, knee: 0.80, stance: 0.60, lean: 0.02 }
};
function bump(p, c, w) { let d = p - c; d -= Math.round(d); return Math.exp(-(d * d) / (2 * w * w)); }
export function gaitAngles(p, cfg) {
  p = ((p % 1) + 1) % 1;
  const hip = cfg.hip * (Math.cos(2 * Math.PI * p) - 0.12);
  const load = cfg.knee * 0.16 * bump(p, 0.13, 0.09);      // knee yields as weight arrives
  const swing = cfg.knee * bump(p, 0.76, 0.12);            // and folds to clear the ground
  const foot = 0.32 * bump(p, 0.58, 0.07) - (p > cfg.stance ? 0.14 : 0);
  return { hip, knee: load + swing + 0.05, load, swing, foot };
}

export function animateRobot(rig, t, dt, opts = {}) {
  if (!rig) return;
  const moving = opts.moving !== false;
  const speed = opts.speed === undefined ? 1 : opts.speed;
  const L = rig.spec.locomotion;
  const g = moving ? Math.max(0, Math.min(1.5, speed)) : 0;
  const legged = LEGGED.has(L.type);
  const cfg = GAIT[L.type] || GAIT.biped;
  const prof = gravityProfile(opts.gravity === undefined ? EARTH_G : opts.gravity);
  const balance = opts.balance !== false;

  rig.gaitPhase = (rig.gaitPhase || 0) + dt * g * cfg.freq * prof.freq;
  rig.walkPhase = rig.gaitPhase * Math.PI * 2;
  const ph = rig.walkPhase;

  /* legs + ground solve */
  if (legged && rig.legs.length) {
    const lean = rig.lean;
    let supX = 0, supZ = 0, stance = 0;

    /* 1. pose the legs */
    for (const leg of rig.legs) {
      const p = ((rig.gaitPhase + leg.phase) % 1 + 1) % 1;
      const a = gaitAngles(rig.gaitPhase + leg.phase, cfg);
      // gravity: deeper crouch the heavier the pull, floatier swing the lighter
      // the crouch follows the limb's own bend direction, so a front limb that
      // hinges the other way still shortens by the same amount
      const a1 = -a.hip * g - leg.kneeSign * prof.crouch * 0.55 - rig.stance.z;
      // only the swing fold is floatier in low gravity — the stance knee is
      // carrying weight, so scaling it there would make the robot squat on the Moon
      const a2 = leg.kneeSign * ((a.load + 0.05 + a.swing * prof.swing) * g + prof.crouch);
      const a3 = a.foot * g - a1 - a2;
      leg.thigh.rotation.x = a1;
      leg.knee.rotation.x = a2;
      leg.ankle.rotation.x = a3;
      // balance moves where the feet are PLANTED — tilting the torso alone can
      // never bring the centre of mass over the feet, because the legs hang off it
      leg.hipBase = leg.splay0 + rig.stance.x;
      leg.hip.rotation.z = leg.hipBase;
      leg.pose = { a1, a2, a3, stance: p < cfg.stance };
    }

    /* 2. push limbs apart — this can add hip splay, so it runs before the
          ground solve rather than after it */
    rig.separation = resolveSeparation(rig, dt);

    /* 3. solve body height from the legs as they finally sit. The torso lean is
          applied first, because tilting the body lifts one hip and drops the other. */
    if (rig.torso) {
      rig.torso.rotation.x = -cfg.lean * g + lean.pitch;
      rig.torso.rotation.z = Math.sin(ph) * 0.02 * g * prof.sway + lean.roll;
    }
    const rx = rig.torso ? rig.torso.rotation.x : 0, rz = rig.torso ? rig.torso.rotation.z : 0;
    const sx = Math.sin(rx), cx = Math.cos(rx), sz = Math.sin(rz), cz2 = Math.cos(rz);
    let lowest = Infinity;
    for (const leg of rig.legs) {
      const { a1, a2, a3 } = leg.pose;
      const s = leg.seg;
      const hz = leg.hip.rotation.z || 0;
      const chain = s.thigh * Math.cos(a1) + s.shin * Math.cos(a1 + a2) + (s.ankle + s.foot) * Math.cos(a1 + a2 + a3);
      const reach = -(s.thigh * Math.sin(a1) + s.shin * Math.sin(a1 + a2) + (s.ankle + s.foot) * Math.sin(a1 + a2 + a3));
      const vx = leg.hip.position.x + chain * Math.sin(hz);
      const pitch = a1 + a2 + a3;
      let drop = chain * Math.cos(hz) + leg.footHalf * Math.abs(Math.sin(hz))
        + leg.footExtra + (leg.footLong || 0) * Math.abs(Math.sin(pitch));
      // a limb plate can reach below the sole once the segment pitches; measure
      // each plate's lowest corner and let the deepest thing define the ground
      for (let pi = 0; pi < leg.plates.length; pi++) {
        const pl = leg.plates[pi];
        const A = pl.seg === 'thigh' ? a1 : a1 + a2;
        const base = pl.seg === 'thigh' ? 0 : s.thigh * Math.cos(a1);
        const d = base + (-pl.py) * Math.cos(A) + pl.pz * Math.abs(Math.sin(A));
        const dy = d * Math.cos(hz) + pl.half * Math.abs(Math.sin(hz));
        if (dy > drop) drop = dy;
      }
      const vy = leg.hipLocalY - drop;
      const vz = leg.hip.position.z + reach;
      const footY = rig.torsoBaseY + cx * sz * vx + cx * cz2 * vy - sx * vz;
      if (footY < lowest) lowest = footY;
      if (leg.pose.stance) { supX += vx; supZ += vz; stance++; }
    }
    if (rig.torso && isFinite(lowest)) rig.torso.position.y = rig.torsoBaseY - lowest;

    /* 4. balance: bring the measured centre of mass over the feet. An off-centre
          load — a shoulder cannon, a one-sided blade — widens the stance toward
          the load and tilts the body away from it, like carrying a heavy bag. */
    if (rig.massModel && stance > 0) {
      const com = centreOfMass(rig.massModel, rig.torso);
      rig.com = com;
      const chain = Math.max(0.15, rig.legs[0].len * 0.95);
      const dx = com.x - supX / stance, dz = com.z - supZ / stance;
      rig.comOffset = { x: dx, z: dz };          // reported whether or not we correct
      rig.balanceError = Math.hypot(dx, dz);
      if (balance) {
        const k = Math.min(1, dt * prof.settle);
        rig.stance.x = Math.max(-0.4, Math.min(0.4, rig.stance.x + (dx / chain) * k));
        rig.stance.z = Math.max(-0.3, Math.min(0.3, rig.stance.z + (dz / chain) * k));
        lean.roll = -0.45 * rig.stance.x;    // the body tilts away from the load
        lean.pitch = 0.35 * rig.stance.z;
      }
    }
  } else if (rig.torso) {
    rig.torso.position.y = rig.torsoBaseY;
    if (balance && rig.massModel) {
      const com = centreOfMass(rig.massModel, rig.torso);
      rig.com = com;
      const w = Math.max(0.1, rig.hull ? rig.hull.half[0] * 2 : 1);
      const rollT = Math.max(-0.08, Math.min(0.08, com.x / w * 0.5));
      const k = Math.min(1, dt * prof.settle);
      rig.lean.roll += (rollT - rig.lean.roll) * k;
      rig.balanceError = Math.abs(com.x);
    }
    rig.torso.rotation.x = 0;
    rig.torso.rotation.z = Math.sin(t * 0.8) * 0.004 * prof.sway + rig.lean.roll;
    rig.separation = resolveSeparation(rig, dt);
  }

  /* flight: rotors spin up, the airframe climbs off its gear and banks */
  if (FLYING.has(L.type)) animateFlight(rig, t, dt, g, prof, L);

  /* hover float */
  if (L.type === 'hover' && rig.body) {
    if (rig.body.userData.baseY === undefined) rig.body.userData.baseY = rig.body.position.y;
    rig.body.position.y = rig.body.userData.baseY + Math.sin(t * 1.7 * prof.freq) * L.hoverHeight * 0.18 * prof.sway;
    rig.body.rotation.z = Math.sin(t * 1.1) * 0.02;
  }

  /* tracks: the belt travels, the sprockets and road wheels follow it */
  let trackOmega = 0;
  for (const loop of rig.trackLoops) {
    const laps = dt * g * 0.28;                       // loops per second at full speed
    placeTrackLinks(loop, loop.offset + laps);
    trackOmega = (0.28 * loop.perimeter) / loop.radius * g;
  }

  /* arms — a human arm swings opposite the leg on the same side and the elbow
     folds the hand FORWARD, so shoulder pitch and elbow flexion have opposite
     signs. Elbow flexion stays negative: it can never hinge backwards. */
  for (let i = 0; i < rig.arms.length; i++) {
    const a = rig.arms[i];
    const sgn = a.side.charAt(0) === 'L' ? 1 : -1;
    let swing, fold;
    if (opts.aim) {
      a.upper.rotation.x = -1.32;
      a.upper.rotation.z = sgn * 0.2;
      a.elbow.rotation.x = -0.28;
      continue;
    }
    if (legged) {
      const gaitOf = gaitAngles(rig.gaitPhase + (sgn > 0 ? 0.5 : 0), cfg);
      swing = gaitOf.hip * 0.62 * g;              // opposite the same-side leg
      fold = 0.22 + Math.max(0, gaitOf.hip) * 0.5 * g;
    } else {
      swing = Math.sin(t * 0.9 + i) * 0.05;
      fold = 0.26 + Math.sin(t * 0.7 + i) * 0.04;
    }
    a.upper.rotation.x = swing;
    // negative for the left arm, positive for the right: elbows out, not into the chest
    a.upper.rotation.z = -sgn * (0.12 + 0.03 * Math.sin(t * 0.7 + i));  // shoulder.rotation.z is the solver's
    a.elbow.rotation.x = -fold;
  }

  /* shoulder mounts scan, laser sights flicker. While aiming, the idle scan is
     off — whoever is aiming owns those joints. */
  for (let i = 0; i < rig.turrets.length && !opts.aim; i++) {
    const tu = rig.turrets[i];
    if (!tu.tracking) continue;
    const range = tu.range === undefined ? 0.3 : tu.range;
    tu.node.rotation.y = Math.sin(t * 0.45 + tu.phase) * range;
    tu.node.rotation.x = -0.05 + Math.sin(t * 0.3 + tu.phase) * 0.06;
  }
  for (let i = 0; i < rig.lasers.length; i++) {
    const l = rig.lasers[i];
    const stretch = opts.aim ? 9 : 1;
    l.beam.scale.y = stretch;
    l.beam.position.y = l.y0 - l.baseLen * stretch * 0.5;
    const k = 0.24 + 0.12 * Math.sin(t * 11 + i * 2.3);
    if (l.beam.material) l.beam.material.opacity = k;
    if (l.dot.material) l.dot.material.emissiveIntensity = 1.6 + Math.sin(t * 9 + i) * 0.5;
  }

  /* wheels and other spinners */
  for (const w of rig.wheels) w.node.rotation.x += dt * g * 1.4 / Math.max(0.05, w.radius);
  for (const s of rig.spinners) {
    const rate = s.driven ? trackOmega * s.ratio : s.rate * (s.rate > 8 ? 1 : g || 0.15);
    s.node.rotation[s.axis || 'y'] += dt * rate;
  }

  /* bay drones bob, hydraulic rams strike, energy fields flicker */
  for (let i = 0; i < rig.hovering.length; i++) {
    const d = rig.hovering[i];
    d.node.position.y = d.baseY + Math.sin(t * 2.2 + d.phase) * d.amp;
    d.node.rotation.y = Math.sin(t * 0.8 + d.phase) * 0.5;
  }
  for (let i = 0; i < rig.rams.length; i++) {
    const r = rig.rams[i];
    const strike = Math.max(0, Math.sin(t * 2.6 + r.phase));
    r.node.position.y = r.base - strike * strike * r.throw * (0.3 + g * 0.7);
  }
  for (let i = 0; i < rig.fields.length; i++) {
    const m = rig.fields[i].material;
    if (m) m.opacity = 0.16 + 0.12 * (0.5 + 0.5 * Math.sin(t * 3.1 + i * 1.3));
  }

  /* career kit: bay doors, emitters, work beams, screens, tool arms, trays */
  for (const h of rig.hatches) {
    const open = 0.5 + 0.5 * Math.sin(t * 0.5 + h.phase);
    h.node.rotation[h.axis === 'z' ? 'x' : 'z'] = -h.range * open * (0.2 + 0.8 * g);
  }
  for (let i = 0; i < rig.pulses.length; i++) {
    const p = rig.pulses[i];
    if (p.node.material) p.node.material.emissiveIntensity = 0.5 + 1.4 * Math.abs(Math.sin(t * p.rate + i));
  }
  for (let i = 0; i < rig.beams.length; i++) {
    const b = rig.beams[i];
    if (b.node.material) b.node.material.opacity = b.base * (0.7 + 0.5 * Math.sin(t * 1.7 + i));
  }
  for (let i = 0; i < rig.screens.length; i++) {
    const m = rig.screens[i].material;
    if (m) m.emissiveIntensity = 0.7 + 0.25 * Math.sin(t * 3.1 + i * 1.7);
  }
  for (const a of rig.armsAux) {
    const sw = Math.sin(t * 0.7 + a.phase);
    if (a.upper) a.upper.rotation.x = 0.5 + sw * 0.12;
    if (a.fore) a.fore.rotation.x = -1.1 + Math.cos(t * 0.55 + a.phase) * 0.16;
    if (!a.upper && a.base) a.base.rotation.x = 0.6 + sw * 0.1;
  }
  // a service tray stays level however the body leans — that is the whole point of it
  for (const tray of rig.trays) {
    const roll = (rig.body ? rig.body.rotation.z : 0) + (rig.torso ? rig.torso.rotation.z : 0);
    const pitch = (rig.body ? rig.body.rotation.x : 0) + (rig.torso ? rig.torso.rotation.x : 0);
    tray.rotation.z = -roll; tray.rotation.x = -pitch;
  }
  for (const m of rig.trackMaps) if (m.offset) m.offset.y = (m.offset.y - dt * g * 0.8) % 1;

  /* head scan, optics, antennas, beacons, plumes */
  if (rig.head && !opts.aim) {
    const sw = rig.spec.head.optics.sweep;
    rig.head.rotation.y = Math.sin(t * 0.6 * sw) * 0.35 * sw;
    rig.head.rotation.x = Math.sin(t * 0.31) * 0.06;
  }
  for (const o of rig.optics) {
    const m = o.lens.material;
    if (m) m.emissiveIntensity = 1.1 + Math.sin(t * 2.2 + o.phase) * 0.45;
  }
  for (const a of rig.antennas) {
    a.node.rotation.z = (Math.sin(t * 1.6 * prof.freq + a.phase) * 0.06 + Math.sin(ph) * 0.05 * g) * prof.sway;
    a.node.rotation.x = Math.cos(t * 1.2 * prof.freq + a.phase) * 0.05 * prof.sway;
  }
  if (rig.dish) rig.dish.rotation.y += dt * 0.4;
  for (let i = 0; i < rig.beacons.length; i++) {
    const b = rig.beacons[i].material;
    if (b) b.emissiveIntensity = (Math.sin(t * 4 + i * 1.9) > 0.4) ? 2.2 : 0.15;
  }
  for (let i = 0; i < rig.plumes.length; i++) {
    const p = rig.plumes[i];
    const k = 0.8 + Math.sin(t * 9 + i * 2.1) * 0.25 + g * 0.3;
    p.scale.set(1, k, 1);
    if (p.material) p.material.opacity = 0.35 + 0.3 * Math.sin(t * 7 + i);
  }
}

export { computeMassModel, centreOfMass, colliderBoxes, boxesOverlap, gravityProfile, weightN, EARTH_G } from './physics.js';

export const BUILD_VERSION = '1.0.0';
export { D2R };
