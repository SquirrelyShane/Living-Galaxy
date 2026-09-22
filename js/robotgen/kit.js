// robotgen/src/kit.js — career hardware. Everything a unit carries BECAUSE OF
// THE JOB rather than because of the frame: payload pods on a flyer, chest and
// hip modules on a ground unit, head modules, and the extra shoulder mounts the
// bigger catalogue added. Kept out of attach.js so the catalogue can keep
// growing without the frame builder growing with it.
import { put, group } from './parts.js';

/* ---------- extra shoulder mounts ---------- */
function gatling(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.3 * m.size;
  const yoke = group(THREE, g, 'gatling_yoke', 0, s * 0.4, 0);
  put(THREE, yoke, K.box(s * 0.8, s * 0.6, s * 0.8), K.second, 0, 0, -s * 0.2, 0, 0, 0, 'gatling_body');
  const barrels = group(THREE, yoke, 'gatling_barrels', 0, 0, s * 0.5);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    put(THREE, barrels, K.cyl(s * 0.07, s * 0.07, s * 1.3, 6), K.dark, Math.cos(a) * s * 0.16, Math.sin(a) * s * 0.16, s * 0.55, Math.PI / 2, 0, 0, 'barrel' + i);
  }
  put(THREE, barrels, K.cyl(s * 0.26, s * 0.26, s * 0.14, 10), K.trim, 0, 0, s * 1.15, Math.PI / 2, 0, 0, 'clamp');
  rig.spinners.push({ node: barrels, rate: 9, axis: 'z' });
  rig.muzzles.push(put(THREE, yoke, K.sph(s * 0.1, 8), K.glow(m.color, 0.4), 0, 0, s * 1.3, 0, 0, 0, 'gatling_muzzle'));
  rig.turrets.push({ node: yoke, tracking: m.tracking, phase: rig.turrets.length * 1.4 });
}
function mortar(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.3 * m.size;
  const base = group(THREE, g, 'mortar_base', 0, s * 0.25, 0);
  put(THREE, base, K.box(s * 0.7, s * 0.2, s * 0.7), K.second, 0, 0, 0);
  for (let i = 0; i < Math.max(1, m.tubes); i++) {
    const x = (i - (Math.max(1, m.tubes) - 1) / 2) * s * 0.42;
    const tube = group(THREE, base, 'mortar_tube' + i, x, s * 0.1, 0);
    tube.rotation.x = -0.5;
    put(THREE, tube, K.cyl(s * 0.17, s * 0.19, s * 1.5, 10), K.dark, 0, s * 0.7, 0, 0, 0, 0, 'tube');
    put(THREE, tube, K.torus(s * 0.2, s * 0.04, 6, 12), K.trim, 0, s * 1.3, 0, Math.PI / 2, 0, 0);
  }
  rig.turrets.push({ node: base, tracking: m.tracking, phase: rig.turrets.length * 1.1, range: 0.14 });
}
function grenadeLauncher(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.28 * m.size;
  const yoke = group(THREE, g, 'gl_yoke', 0, s * 0.4, 0);
  put(THREE, yoke, K.box(s * 0.66, s * 0.6, s * 1.1), K.second, 0, 0, s * 0.1, 0, 0, 0, 'gl_body');
  put(THREE, yoke, K.cyl(s * 0.22, s * 0.22, s * 1.0, 10), K.dark, 0, s * 0.06, s * 0.85, Math.PI / 2, 0, 0, 'gl_barrel');
  put(THREE, yoke, K.cyl(s * 0.44, s * 0.44, s * 0.36, 12), K.trim, 0, -s * 0.25, -s * 0.1, 0, 0, Math.PI / 2, 'gl_drum');
  rig.muzzles.push(put(THREE, yoke, K.cyl(s * 0.15, s * 0.15, s * 0.08, 8), K.glow(m.color, 0.4), 0, s * 0.06, s * 1.35, Math.PI / 2, 0, 0, 'gl_muzzle'));
  rig.turrets.push({ node: yoke, tracking: m.tracking, phase: rig.turrets.length * 1.4 });
}
function radarMount(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.3 * m.size;
  put(THREE, g, K.cyl(s * 0.2, s * 0.24, s * 0.5, 8), K.trim, 0, s * 0.25, 0, 0, 0, 0, 'radar_post');
  const spin = group(THREE, g, 'radar_spin', 0, s * 0.55, 0);
  put(THREE, spin, K.box(s * 1.5, s * 0.5, s * 0.09), K.second, 0, 0, 0, 0, 0, 0.12, 'radar_face');
  put(THREE, spin, K.box(s * 1.55, s * 0.1, s * 0.14), K.trim, 0, s * 0.28, 0);
  rig.spinners.push({ node: spin, rate: 2.4 });
  rig.beacons.push(put(THREE, spin, K.sph(s * 0.08, 8), K.glow(m.color, 1.4), 0, -s * 0.3, 0, 0, 0, 0, 'radar_lamp'));
}
function spotlight(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.26 * m.size;
  const head = group(THREE, g, 'spot_head', 0, s * 0.5, 0);
  put(THREE, g, K.cyl(s * 0.12, s * 0.14, s * 0.5, 8), K.trim, 0, s * 0.25, 0, 0, 0, 0, 'spot_post');
  put(THREE, head, K.cyl(s * 0.42, s * 0.46, s * 0.5, 12, true), K.second, 0, 0, s * 0.1, Math.PI / 2, 0, 0, 'spot_can');
  rig.lamps.push(put(THREE, head, K.cyl(s * 0.38, s * 0.38, s * 0.06, 12), K.glow('#ffffff', 1.9), 0, 0, s * 0.36, Math.PI / 2, 0, 0, 'spot_lens'));
  const cone = put(THREE, head, K.cone(s * 0.7, s * 2.4, 12), K.mat('spotbeam', '#fff6d0', {
    emissive: '#fff6d0', emissiveIntensity: 1.1, transparent: true, opacity: 0.12
  }), 0, 0, s * 1.6, -Math.PI / 2, 0, 0, 'spot_beam');
  rig.beams.push({ node: cone, base: 0.12 });
  rig.turrets.push({ node: head, tracking: m.tracking, phase: rig.turrets.length * 0.9, range: 0.5 });
}
function jammerPod(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.28 * m.size;
  const pod = group(THREE, g, 'jammer', 0, s * 0.4, 0);
  put(THREE, pod, K.box(s * 0.6, s * 0.9, s * 0.5), K.second, 0, 0, 0, 0, 0, 0, 'jam_body');
  for (let i = 0; i < 3; i++) put(THREE, pod, K.box(s * 0.5, s * 0.05, s * 0.44), K.trim, 0, s * (0.3 - i * 0.28), s * 0.28);
  const em = put(THREE, pod, K.sph(s * 0.16, 10), K.glow(m.color, 1.5), 0, s * 0.55, 0, 0, 0, 0, 'jam_emitter');
  rig.lamps.push(em);
  rig.pulses.push({ node: em, rate: 3.2 });
}
function netGun(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.27 * m.size;
  const yoke = group(THREE, g, 'netgun', 0, s * 0.4, 0);
  put(THREE, yoke, K.box(s * 0.7, s * 0.5, s * 0.8), K.second, 0, 0, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    put(THREE, yoke, K.cyl(s * 0.13, s * 0.14, s * 0.6, 8), K.dark, Math.cos(a) * s * 0.2, Math.sin(a) * s * 0.2, s * 0.6, Math.PI / 2, 0, 0, 'net_tube' + i);
  }
  rig.turrets.push({ node: yoke, tracking: m.tracking, phase: rig.turrets.length * 1.2, range: 0.22 });
}
function taserMount(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.24 * m.size;
  const yoke = group(THREE, g, 'taser', 0, s * 0.4, 0);
  put(THREE, yoke, K.box(s * 0.6, s * 0.5, s * 0.9), K.second, 0, 0, 0);
  for (const sx of [-1, 1]) {
    put(THREE, yoke, K.cyl(s * 0.09, s * 0.09, s * 0.7, 8), K.trim, sx * s * 0.18, 0, s * 0.55, Math.PI / 2, 0, 0, 'prong' + sx);
    rig.lamps.push(put(THREE, yoke, K.sph(s * 0.08, 8), K.glow('#8fd3ff', 1.7), sx * s * 0.18, 0, s * 0.92, 0, 0, 0, 'arc' + sx));
  }
  rig.turrets.push({ node: yoke, tracking: m.tracking, phase: rig.turrets.length * 1.2, range: 0.24 });
}
function grappleMount(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.28 * m.size;
  const yoke = group(THREE, g, 'grapple', 0, s * 0.4, 0);
  put(THREE, yoke, K.cyl(s * 0.32, s * 0.32, s * 0.7, 10), K.second, 0, 0, 0, 0, 0, Math.PI / 2, 'spool');
  put(THREE, yoke, K.cyl(s * 0.36, s * 0.36, s * 0.06, 12), K.trim, s * 0.36, 0, 0, 0, 0, Math.PI / 2);
  put(THREE, yoke, K.cyl(s * 0.16, s * 0.2, s * 0.8, 8), K.dark, 0, 0, s * 0.55, Math.PI / 2, 0, 0, 'launch_tube');
  for (let i = 0; i < 3; i++) put(THREE, yoke, K.box(s * 0.07, s * 0.28, s * 0.1), K.trim, 0, s * 0.1, s * 0.95, 0.5, i * 2.1, 0, 'fluke' + i);
  rig.spinners.push({ node: yoke, rate: 0 });
}
function toolArm(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.3 * m.size;
  const base = group(THREE, g, 'toolarm', 0, s * 0.3, 0);
  put(THREE, base, K.cyl(s * 0.24, s * 0.28, s * 0.3, 10), K.second, 0, 0, 0);
  const upper = group(THREE, base, 'toolarm_upper', 0, s * 0.15, 0);
  upper.rotation.x = 0.5;
  put(THREE, upper, K.box(s * 0.18, s * 0.9, s * 0.18), K.second, 0, s * 0.45, 0);
  const fore = group(THREE, upper, 'toolarm_fore', 0, s * 0.9, 0);
  fore.rotation.x = -1.1;
  put(THREE, fore, K.box(s * 0.15, s * 0.8, s * 0.15), K.second, 0, s * 0.4, 0);
  const tool = group(THREE, fore, 'toolarm_head', 0, s * 0.8, 0);
  put(THREE, tool, K.cyl(s * 0.16, s * 0.12, s * 0.3, 8), K.trim, 0, s * 0.12, 0);
  rig.lamps.push(put(THREE, tool, K.sph(s * 0.09, 8), K.glow(spec.palette.accent, 1.2), 0, s * 0.3, 0, 0, 0, 0, 'tool_tip'));
  rig.armsAux.push({ base, upper, fore, phase: rig.armsAux.length * 1.3 });
}
function ammoPack(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.3 * m.size;
  put(THREE, g, K.box(s * 0.8, s * 0.9, s * 0.6), K.second, 0, s * 0.4, -s * 0.1, 0, 0, 0, 'ammo_box');
  for (let i = 0; i < 4; i++) put(THREE, g, K.box(s * 0.84, s * 0.05, s * 0.64), K.trim, 0, s * (0.1 + i * 0.2), -s * 0.1);
  for (let i = 0; i < 5; i++) put(THREE, g, K.box(s * 0.3, s * 0.12, s * 0.16), K.trim, 0, s * 0.05 - i * s * 0.1, s * 0.28 + i * s * 0.06, 0.22 * i, 0, 0, 'feed' + i);
}
function relayMast(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.26 * m.size;
  const mast = group(THREE, g, 'relay_mast', 0, s * 0.2, 0);
  for (let i = 0; i < 3; i++) put(THREE, mast, K.cyl(s * (0.11 - i * 0.02), s * (0.12 - i * 0.02), s * 0.9, 8), K.trim, 0, s * (0.45 + i * 0.8), 0, 0, 0, 0, 'mast_seg' + i);
  const head = group(THREE, mast, 'relay_head', 0, s * 2.6, 0);
  put(THREE, head, K.box(s * 0.5, s * 0.3, s * 0.16), K.second, 0, 0, 0, 0, 0, 0, 'relay_panel');
  for (const sx of [-1, 1]) put(THREE, head, K.cyl(s * 0.02, s * 0.02, s * 0.7, 5), K.trim, sx * s * 0.22, s * 0.45, 0);
  rig.beacons.push(put(THREE, head, K.sph(s * 0.08, 8), K.glow(m.color, 1.5), 0, s * 0.2, 0, 0, 0, 0, 'relay_beacon'));
  rig.antennas.push({ node: mast, phase: rig.antennas.length * 0.8 });
}
function hailer(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.26 * m.size;
  const head = group(THREE, g, 'hailer', 0, s * 0.45, 0);
  put(THREE, head, K.cyl(s * 0.18, s * 0.42, s * 0.55, 12, true), K.second, 0, 0, s * 0.3, -Math.PI / 2, 0, 0, 'horn');
  put(THREE, head, K.cyl(s * 0.2, s * 0.2, s * 0.2, 10), K.trim, 0, 0, -s * 0.02, Math.PI / 2, 0, 0, 'driver');
  rig.pulses.push({ node: put(THREE, head, K.torus(s * 0.3, s * 0.03, 5, 14), K.glow(m.color, 1.2), 0, 0, s * 0.6, Math.PI / 2, 0, 0, 'hail_ring'), rate: 4.5 });
  rig.turrets.push({ node: head, tracking: m.tracking, phase: rig.turrets.length, range: 0.4 });
}

export const EXTRA_MOUNTS = {
  gatling, mortar, grenade: grenadeLauncher, radar: radarMount, spotlight,
  jammer: jammerPod, netgun: netGun, taser: taserMount,
  grapple: grappleMount, toolarm: toolArm, ammo: ammoPack, relay: relayMast, hailer,
};

/* ---------- flyer payload pods ---------- */
function podShell(THREE, K, spec, rig, parent, w, h, d, name) {
  put(THREE, parent, K.cyl(w * 0.5, w * 0.5, d, 10), K.second, 0, 0, 0, Math.PI / 2, 0, 0, name + '_body');
  put(THREE, parent, K.cone(w * 0.5, d * 0.35, 10), K.second, 0, 0, d * 0.6, Math.PI / 2, 0, 0, name + '_nose');
}
const PODS = {
  camera: (THREE, K, spec, rig, g, s) => {
    put(THREE, g, K.cyl(s * 0.35, s * 0.4, s * 0.3, 10), K.second, 0, 0, 0, 0, 0, 0, 'gimbal_yoke');
    const ball = group(THREE, g, 'gimbal_ball', 0, -s * 0.42, 0);
    put(THREE, ball, K.sph(s * 0.42, 12), K.dark, 0, 0, 0, 0, 0, 0, 'ball');
    rig.lamps.push(put(THREE, ball, K.cyl(s * 0.22, s * 0.22, s * 0.08, 12), K.glow(spec.head.optics.color, 1.2), 0, -s * 0.05, s * 0.36, Math.PI / 2, 0, 0, 'ball_lens'));
    rig.spinners.push({ node: ball, rate: 0.8 });
  },
  mapping: (THREE, K, spec, rig, g, s) => {
    put(THREE, g, K.box(s * 0.8, s * 0.5, s * 1.1), K.second, 0, -s * 0.25, 0, 0, 0, 0, 'survey_pod');
    const scan = group(THREE, g, 'survey_scan', 0, -s * 0.58, 0);
    put(THREE, scan, K.cyl(s * 0.3, s * 0.3, s * 0.24, 12), K.dark, 0, 0, 0);
    rig.lamps.push(put(THREE, scan, K.box(s * 0.62, s * 0.05, s * 0.08), K.glow('#a0ffe0', 1.4), 0, 0, 0));
    rig.spinners.push({ node: scan, rate: 5.5 });
    put(THREE, g, K.box(s * 0.5, s * 0.06, s * 0.5), K.trim, 0, s * 0.12, -s * 0.3, 0, 0, 0, 'gnss_patch');
  },
  thermal: (THREE, K, spec, rig, g, s) => {
    put(THREE, g, K.box(s * 0.55, s * 0.5, s * 0.8), K.second, 0, -s * 0.25, 0, 0, 0, 0, 'thermal_pod');
    rig.lamps.push(put(THREE, g, K.cyl(s * 0.2, s * 0.2, s * 0.06, 12), K.glow('#ff8a3d', 1.1), 0, -s * 0.25, s * 0.42, Math.PI / 2, 0, 0, 'thermal_lens'));
  },
  relay: (THREE, K, spec, rig, g, s) => {
    put(THREE, g, K.box(s * 0.5, s * 0.4, s * 0.7), K.second, 0, -s * 0.2, 0, 0, 0, 0, 'relay_pod');
    for (const sx of [-1, 1]) put(THREE, g, K.cyl(s * 0.02, s * 0.02, s * 1.3, 5), K.trim, sx * s * 0.18, -s * 0.85, 0);
    rig.beacons.push(put(THREE, g, K.sph(s * 0.08, 8), K.glow('#4d8cff', 1.6), 0, -s * 0.42, s * 0.3, 0, 0, 0, 'relay_lamp'));
  },
  tank: (THREE, K, spec, rig, g, s) => {
    podShell(THREE, K, spec, rig, g, s * 0.7, s * 0.7, s * 1.4, 'tank');
    for (const sx of [-1, 1]) put(THREE, g, K.box(s * 0.9, s * 0.05, s * 0.1), K.trim, sx * s * 0.5, -s * 0.28, -s * 0.3, 0, 0, 0, 'spray_boom');
    for (let i = 0; i < 4; i++) put(THREE, g, K.cone(s * 0.06, s * 0.12, 6), K.trim, (i - 1.5) * s * 0.28, -s * 0.36, -s * 0.3, Math.PI, 0, 0, 'nozzle' + i);
  },
  cargo: (THREE, K, spec, rig, g, s) => {
    put(THREE, g, K.box(s * 0.9, s * 0.7, s * 0.9), K.second, 0, -s * 0.4, 0, 0, 0, 0, 'cargo_box');
    put(THREE, g, K.box(s * 0.94, s * 0.06, s * 0.94), K.trim, 0, -s * 0.06, 0);
    put(THREE, g, K.torus(s * 0.14, s * 0.03, 5, 12), K.trim, 0, -s * 0.8, 0, Math.PI / 2, 0, 0, 'hook');
  },
  munition: (THREE, K, spec, rig, g, s, p) => {
    put(THREE, g, K.box(s * 0.5, s * 0.24, s * 1.1), K.second, 0, -s * 0.14, 0, 0, 0, 0, 'rail');
    for (let i = 0; i < Math.max(1, p.tubes); i++) {
      const x = (i - (Math.max(1, p.tubes) - 1) / 2) * s * 0.3;
      put(THREE, g, K.cyl(s * 0.11, s * 0.11, s * 1.0, 8), K.dark, x, -s * 0.34, 0, Math.PI / 2, 0, 0, 'store' + i);
      put(THREE, g, K.cone(s * 0.11, s * 0.22, 8), K.trim, x, -s * 0.34, s * 0.6, Math.PI / 2, 0, 0, 'store_nose' + i);
    }
  },
  hailer: (THREE, K, spec, rig, g, s) => {
    put(THREE, g, K.cyl(s * 0.16, s * 0.4, s * 0.5, 12, true), K.second, 0, -s * 0.3, 0, Math.PI, 0, 0, 'horn');
    rig.pulses.push({ node: put(THREE, g, K.torus(s * 0.3, s * 0.03, 5, 12), K.glow('#ffb200', 1.2), 0, -s * 0.56, 0, 0, 0, 0, 'hail_ring'), rate: 4.5 });
  },
  chute: (THREE, K, spec, rig, g, s) => {
    put(THREE, g, K.cyl(s * 0.3, s * 0.3, s * 0.5, 10), K.trim, 0, s * 0.2, 0, 0, 0, 0, 'chute_can');
    put(THREE, g, K.cyl(s * 0.31, s * 0.31, s * 0.06, 10), K.second, 0, s * 0.46, 0, 0, 0, 0, 'chute_lid');
  },
  sampler: (THREE, K, spec, rig, g, s) => {
    put(THREE, g, K.box(s * 0.5, s * 0.4, s * 0.6), K.second, 0, -s * 0.2, 0, 0, 0, 0, 'sample_bay');
    const arm = group(THREE, g, 'sample_arm', 0, -s * 0.4, s * 0.2);
    arm.rotation.x = 0.6;
    put(THREE, arm, K.cyl(s * 0.05, s * 0.05, s * 0.8, 6), K.trim, 0, -s * 0.4, 0);
    put(THREE, arm, K.box(s * 0.22, s * 0.12, s * 0.26), K.second, 0, -s * 0.85, 0, 0, 0, 0, 'scoop');
    rig.armsAux.push({ base: arm, upper: null, fore: null, phase: rig.armsAux.length * 1.1 });
  },
  chem: (THREE, K, spec, rig, g, s) => {
    put(THREE, g, K.cyl(s * 0.26, s * 0.26, s * 0.7, 10), K.second, 0, -s * 0.35, 0, 0, 0, 0, 'sniffer');
    rig.lamps.push(put(THREE, g, K.sph(s * 0.1, 8), K.glow('#8fe36a', 1.3), 0, -s * 0.72, 0, 0, 0, 0, 'sniff_tip'));
    for (let i = 0; i < 3; i++) put(THREE, g, K.torus(s * 0.28, s * 0.03, 5, 12), K.trim, 0, -s * (0.15 + i * 0.2), 0, Math.PI / 2, 0, 0);
  },
  rad: (THREE, K, spec, rig, g, s) => {
    put(THREE, g, K.box(s * 0.4, s * 0.5, s * 0.4), K.second, 0, -s * 0.25, 0, 0, 0, 0, 'rad_body');
    put(THREE, g, K.cyl(s * 0.12, s * 0.12, s * 0.5, 8), K.dark, 0, -s * 0.62, 0, 0, 0, 0, 'probe');
    rig.beacons.push(put(THREE, g, K.sph(s * 0.07, 8), K.glow('#ffd400', 1.7), 0, -s * 0.05, s * 0.22, 0, 0, 0, 'rad_lamp'));
  },
  gpr: (THREE, K, spec, rig, g, s) => {
    put(THREE, g, K.box(s * 1.3, s * 0.14, s * 0.7), K.second, 0, -s * 0.3, 0, 0, 0, 0, 'gpr_array');
    for (let i = 0; i < 4; i++) put(THREE, g, K.box(s * 0.22, s * 0.06, s * 0.6), K.trim, (i - 1.5) * s * 0.3, -s * 0.4, 0, 0, 0, 0, 'gpr_tile' + i);
  },
  jammer: (THREE, K, spec, rig, g, s) => {
    put(THREE, g, K.box(s * 0.42, s * 0.9, s * 0.42), K.second, 0, -s * 0.4, 0, 0, 0, 0, 'jam_pod');
    const em = put(THREE, g, K.sph(s * 0.14, 10), K.glow('#c46bff', 1.5), 0, -s * 0.9, 0, 0, 0, 0, 'jam_tip');
    rig.lamps.push(em); rig.pulses.push({ node: em, rate: 3.0 });
  },
  dronebay: (THREE, K, spec, rig, g, s) => {
    put(THREE, g, K.box(s * 0.8, s * 0.4, s * 0.8), K.second, 0, -s * 0.22, 0, 0, 0, 0, 'micro_bay');
    const door = group(THREE, g, 'micro_door', 0, -s * 0.44, 0);
    put(THREE, door, K.box(s * 0.76, s * 0.05, s * 0.76), K.trim, 0, 0, 0);
    rig.hatches.push({ node: door, axis: 'z', range: 0.8, phase: rig.hatches.length * 1.3 });
  },
  spotlight: (THREE, K, spec, rig, g, s) => {
    put(THREE, g, K.cyl(s * 0.3, s * 0.34, s * 0.4, 12, true), K.second, 0, -s * 0.3, 0, 0, 0, 0, 'lamp_can');
    rig.lamps.push(put(THREE, g, K.cyl(s * 0.28, s * 0.28, s * 0.05, 12), K.glow('#ffffff', 2.0), 0, -s * 0.5, 0, 0, 0, 0, 'lamp_lens'));
    const cone = put(THREE, g, K.cone(s * 0.7, s * 2.0, 12), K.mat('spotbeam', '#fff6d0', {
      emissive: '#fff6d0', emissiveIntensity: 1.0, transparent: true, opacity: 0.1
    }), 0, -s * 1.5, 0, Math.PI, 0, 0, 'lamp_beam');
    rig.beams.push({ node: cone, base: 0.1 });
  },
};

/* ---------- chest, hip and head modules ---------- */
function buildChest(THREE, K, spec, rig, ctx) {
  const kind = spec.attachments.chest;
  if (!kind || kind === 'none') return;
  const { torso, dims } = ctx, w = dims.w, h = dims.h, d = dims.d;
  const g = group(THREE, torso, 'chest_module', 0, -h * 0.12, d * 0.5);
  if (kind === 'winch') {
    put(THREE, g, K.cyl(w * 0.16, w * 0.16, w * 0.42, 10), K.second, 0, 0, w * 0.1, 0, 0, Math.PI / 2, 'winch_drum');
    for (const sx of [-1, 1]) put(THREE, g, K.box(w * 0.06, w * 0.3, w * 0.12), K.trim, sx * w * 0.24, 0, w * 0.1);
    put(THREE, g, K.cyl(w * 0.012, w * 0.012, h * 0.3, 5), K.dark, 0, -h * 0.16, w * 0.16, 0, 0, 0, 'cable');
  } else if (kind === 'tooltray') {
    put(THREE, g, K.box(w * 0.7, h * 0.12, w * 0.26), K.second, 0, 0, w * 0.12, 0.18, 0, 0, 'tray');
    for (let i = 0; i < 4; i++) put(THREE, g, K.box(w * 0.07, h * 0.16, w * 0.07), K.trim, (i - 1.5) * w * 0.15, h * 0.08, w * 0.14, 0.18, 0, 0, 'tool' + i);
  } else if (kind === 'screen') {
    put(THREE, g, K.box(w * 0.56, h * 0.3, w * 0.05), K.dark, 0, 0, w * 0.04, 0, 0, 0, 'screen_body');
    rig.screens.push(put(THREE, g, K.box(w * 0.48, h * 0.24, w * 0.02), K.glow(spec.palette.accent, 0.9), 0, 0, w * 0.07, 0, 0, 0, 'screen_face'));
  } else if (kind === 'sirenbar') {
    const bar = group(THREE, torso, 'sirenbar', 0, h * 0.52, 0);
    put(THREE, bar, K.box(w * 0.9, h * 0.07, d * 0.3), K.trim, 0, 0, 0, 0, 0, 0, 'bar');
    for (const [i, sx] of [-1, 1].entries()) rig.beacons.push(put(THREE, bar, K.box(w * 0.3, h * 0.06, d * 0.26),
      K.glow(i ? '#4d8cff' : '#ff3b30', 1.8), sx * w * 0.24, h * 0.03, 0, 0, 0, 0, 'siren' + i));
  } else if (kind === 'hatch') {
    put(THREE, g, K.box(w * 0.4, h * 0.3, w * 0.04), K.second, 0, 0, w * 0.03, 0, 0, 0, 'hatch_door');
    put(THREE, g, K.cyl(w * 0.05, w * 0.05, w * 0.05, 8), K.trim, w * 0.14, 0, w * 0.06, Math.PI / 2, 0, 0, 'hatch_latch');
  } else if (kind === 'refill') {
    for (const sx of [-1, 1]) {
      put(THREE, g, K.cyl(w * 0.08, w * 0.08, w * 0.16, 8), K.trim, sx * w * 0.18, 0, w * 0.08, Math.PI / 2, 0, 0, 'port' + sx);
      rig.lamps.push(put(THREE, g, K.torus(w * 0.09, w * 0.02, 5, 10), K.glow(spec.palette.accent, 1.0), sx * w * 0.18, 0, w * 0.16, 0, 0, 0));
    }
  } else {
    put(THREE, g, K.box(w * 0.66, h * 0.1, w * 0.4), K.second, 0, -h * 0.06, w * 0.16, 0, 0, 0, 'cradle_floor');
    for (const sx of [-1, 1]) put(THREE, g, K.box(w * 0.05, h * 0.2, w * 0.4), K.trim, sx * w * 0.32, h * 0.03, w * 0.16);
  }
}

function buildHips(THREE, K, spec, rig, ctx) {
  const list = spec.attachments.hip || [];
  if (!list.length) return;
  const { torso, dims } = ctx, w = dims.w, h = dims.h, d = dims.d;
  list.forEach((kind, i) => {
    const sx = i % 2 ? 1 : -1;
    const g = group(THREE, torso, 'hip_' + kind + i, sx * w * 0.52, -h * 0.4, d * 0.06);
    if (kind === 'holster') {
      put(THREE, g, K.box(w * 0.14, h * 0.26, w * 0.12), K.trim, 0, 0, 0, 0, 0, 0, 'holster');
      put(THREE, g, K.box(w * 0.1, h * 0.12, w * 0.08), K.dark, 0, h * 0.12, 0);
    } else if (kind === 'pouch') {
      put(THREE, g, K.box(w * 0.2, h * 0.16, w * 0.14), K.second, 0, 0, 0, 0, 0, 0, 'pouch');
      put(THREE, g, K.box(w * 0.22, h * 0.04, w * 0.16), K.trim, 0, h * 0.08, 0);
    } else if (kind === 'rail') {
      put(THREE, g, K.box(w * 0.06, h * 0.3, w * 0.06), K.trim, 0, 0, 0, 0, 0, 0, 'rail');
      for (let k = 0; k < 3; k++) put(THREE, g, K.box(w * 0.1, h * 0.03, w * 0.1), K.second, 0, h * (0.1 - k * 0.1), 0);
    } else if (kind === 'canister') {
      put(THREE, g, K.cyl(w * 0.09, w * 0.09, h * 0.28, 8), K.second, 0, 0, 0, 0, 0, 0, 'canister');
      rig.lamps.push(put(THREE, g, K.torus(w * 0.1, w * 0.015, 5, 10), K.glow(spec.palette.accent, 0.9), 0, h * 0.1, 0, Math.PI / 2, 0, 0));
    } else {
      put(THREE, g, K.torus(w * 0.14, w * 0.035, 6, 12), K.trim, 0, 0, 0, 0, 0, 0, 'coil');
      put(THREE, g, K.cyl(w * 0.02, w * 0.02, h * 0.2, 5), K.dark, w * 0.1, -h * 0.1, 0, 0, 0, 0.3);
    }
  });
}

function buildHeadModules(THREE, K, spec, rig) {
  const M = spec.head.modules;
  if (!M || !rig.head) return;
  const s = spec.head.size, head = rig.head;
  if (M.lamp) for (const sx of [-1, 1]) rig.lamps.push(put(THREE, head, K.cyl(s * 0.1, s * 0.1, s * 0.08, 10),
    K.glow('#ffffff', 1.5), sx * s * 0.32, s * 0.18, s * 0.42, Math.PI / 2, 0, 0, 'head_lamp'));
  if (M.thermalPod) {
    const pod = group(THREE, head, 'head_thermal', s * 0.3, s * 0.34, s * 0.2);
    put(THREE, pod, K.box(s * 0.22, s * 0.18, s * 0.3), K.dark, 0, 0, 0);
    rig.lamps.push(put(THREE, pod, K.cyl(s * 0.07, s * 0.07, s * 0.04, 10), K.glow('#ff8a3d', 1.2), 0, 0, s * 0.17, Math.PI / 2, 0, 0));
  }
  if (M.scannerRing) {
    const ring = group(THREE, head, 'head_scanring', 0, s * 0.1, 0);
    put(THREE, ring, K.torus(s * 0.56, s * 0.035, 6, 16), K.trim, 0, 0, 0, Math.PI / 2, 0, 0);
    rig.lamps.push(put(THREE, ring, K.sph(s * 0.07, 8), K.glow('#a0ffe0', 1.5), s * 0.56, 0, 0, 0, 0, 0, 'scan_node'));
    rig.spinners.push({ node: ring, rate: 3.0 });
  }
  if (M.dustCover) {
    put(THREE, head, K.box(s * 0.9, s * 0.08, s * 0.5), K.second, 0, s * 0.44, s * 0.16, -0.25, 0, 0, 'head_visor');
    put(THREE, head, K.box(s * 0.92, s * 0.05, s * 0.12), K.trim, 0, s * 0.5, s * 0.36, -0.25, 0, 0);
  }
}

/* ---------- entry point ---------- */
export function buildKit(THREE, K, spec, rig, ctx) {
  const A = spec.attachments;
  if (!A) return;
  buildHeadModules(THREE, K, spec, rig);
  if (!spec.flying) { buildChest(THREE, K, spec, rig, ctx); buildHips(THREE, K, spec, rig, ctx); }

  /* flyer stores, hung off the station the spec asked for */
  const dims = ctx.dims;
  for (const p of (A.payload || [])) {
    const fn = PODS[p.type];
    if (!fn) continue;
    let parent = ctx.torso, x = 0, y = -dims.h * 0.52, z = dims.d * 0.12;
    if (p.station === 'dorsal') { y = dims.h * 0.5; z = -dims.d * 0.1; }
    if (p.station === 'wingL' || p.station === 'wingR') {
      const wing = rig.wings.find(w => w.side === (p.station === 'wingL' ? 'L' : 'R'));
      if (wing) { parent = wing.node; x = (p.station === 'wingL' ? -1 : 1) * wing.span * 0.55; y = -dims.h * 0.12; z = 0; }
      else { x = (p.station === 'wingL' ? -1 : 1) * dims.w * 0.55; }
    }
    const g = group(THREE, parent, 'pod_' + p.type + '_' + p.station, x, y, z);
    const s = Math.max(0.04, dims.w * 0.62 * p.size);
    fn(THREE, K, spec, rig, g, s, p);
    rig.pods.push({ node: g, type: p.type, station: p.station });
    rig.colliders.push({ node: g, half: [s * 0.6, s * 0.6, s * 0.7], offset: { x: 0, y: 0, z: 0 }, name: 'pod_' + p.type, group: 'pod' });
  }
}
