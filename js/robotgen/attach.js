// robotgen/src/attach.js — bolt-on hardware. Kept separate from build.js so the
// catalogue can grow without touching the frame builder. Everything here is
// driven by spec.attachments, so it is deterministic per seed.
import { put, group } from './parts.js';
import { EXTRA_MOUNTS, buildKit } from './kit.js';

/* ---------- shoulder mounts ---------- */
function shoulderCannon(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.34 * m.size;
  put(THREE, g, K.box(s * 0.7, s * 0.6, s * 0.9), K.second, 0, 0, 0, 0, 0, 0, 'cannon_breech');
  const yoke = group(THREE, g, 'cannon_yoke', 0, s * 0.45, 0);
  put(THREE, yoke, K.cyl(s * 0.26, s * 0.3, s * 1.6, 10), K.dark, 0, 0, s * 0.7, Math.PI / 2, 0, 0, 'cannon_barrel');
  put(THREE, yoke, K.cyl(s * 0.34, s * 0.34, s * 0.22, 10), K.trim, 0, 0, s * 1.35, Math.PI / 2, 0, 0, 'cannon_brake');
  rig.muzzles.push(put(THREE, yoke, K.cyl(s * 0.17, s * 0.17, s * 0.1, 8), K.glow(m.color, 0.5), 0, 0, s * 1.5, Math.PI / 2, 0, 0, 'cannon_muzzle'));
  put(THREE, yoke, K.box(s * 0.5, s * 0.16, s * 0.5), K.trim, 0, s * 0.3, -s * 0.1);
  rig.turrets.push({ node: yoke, tracking: m.tracking, phase: rig.turrets.length * 1.4 });
}
function missilePod(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.3 * m.size;
  const rows = 2, cols = Math.max(2, Math.ceil(m.tubes / 2));
  const pod = group(THREE, g, 'missile_pod', 0, s * 0.3, 0);
  put(THREE, pod, K.box(s * cols * 0.42, s * rows * 0.42, s * 1.0), K.second, 0, 0, 0, 0, 0, 0, 'pod_body');
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (c - (cols - 1) / 2) * s * 0.4, y = (r - (rows - 1) / 2) * s * 0.4;
    put(THREE, pod, K.cyl(s * 0.15, s * 0.15, s * 0.12, 8), K.dark, x, y, s * 0.5, Math.PI / 2, 0, 0, 'tube');
  }
  put(THREE, pod, K.box(s * cols * 0.44, s * 0.1, s * 1.02), K.trim, 0, s * rows * 0.23, 0);
  rig.turrets.push({ node: pod, tracking: m.tracking, phase: rig.turrets.length * 1.4, range: 0.18 });
}
function beamProjector(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.3 * m.size;
  const arm = group(THREE, g, 'beam_arm', 0, s * 0.4, 0);
  put(THREE, arm, K.cyl(s * 0.22, s * 0.26, s * 1.2, 10), K.second, 0, 0, s * 0.5, Math.PI / 2, 0, 0, 'beam_tube');
  for (let i = 0; i < 3; i++) put(THREE, arm, K.torus(s * 0.3, s * 0.06, 6, 12), K.trim, 0, 0, s * (0.1 + i * 0.35), 0, 0, 0, 'coil' + i);
  const lens = put(THREE, arm, K.sph(s * 0.24, 10), K.glow(m.color, 1.6), 0, 0, s * 1.12, 0, 0, 0, 'beam_lens');
  rig.lamps.push(lens);
  rig.turrets.push({ node: arm, tracking: m.tracking, phase: rig.turrets.length * 1.4 });
}
function sensorMast(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.26 * m.size;
  const mast = group(THREE, g, 'sensor_mast', 0, s * 0.2, 0);
  put(THREE, mast, K.cyl(s * 0.1, s * 0.14, s * 1.6, 8), K.trim, 0, s * 0.8, 0);
  const headG = group(THREE, mast, 'sensor_head', 0, s * 1.7, 0);
  put(THREE, headG, K.cyl(s * 0.36, s * 0.36, s * 0.3, 10), K.second, 0, 0, 0);
  put(THREE, headG, K.box(s * 0.16, s * 0.2, s * 0.5), K.dark, 0, 0, s * 0.3);
  rig.beacons.push(put(THREE, headG, K.sph(s * 0.13, 8), K.glow(m.color, 1.5), 0, s * 0.24, 0, 0, 0, 0, 'mast_beacon'));
  rig.spinners.push({ node: headG, rate: 1.2 });
}
function smokeBank(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.22 * m.size;
  const bank = group(THREE, g, 'smoke_bank', 0, s * 0.2, 0);
  put(THREE, bank, K.box(s * m.tubes * 0.36, s * 0.3, s * 0.4), K.second, 0, 0, 0);
  for (let i = 0; i < m.tubes; i++) {
    const x = (i - (m.tubes - 1) / 2) * s * 0.34;
    put(THREE, bank, K.cyl(s * 0.13, s * 0.13, s * 0.6, 8), K.dark, x, s * 0.32, -s * 0.05, -0.35, 0, 0, 'smoke_tube' + i);
  }
}
function riotShield(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * m.size;
  const arm2 = group(THREE, g, 'shield_arm', 0, 0, 0);
  put(THREE, arm2, K.box(s * 0.1, s * 0.5, s * 0.1), K.trim, 0, 0, s * 0.12);
  const panel = group(THREE, arm2, 'shield_panel', 0, -dims.h * 0.05, s * 0.3);
  put(THREE, panel, K.box(s * 0.62, dims.h * 0.95, s * 0.06), K.second, 0, 0, 0, 0, 0, 0, 'shield_face');
  put(THREE, panel, K.box(s * 0.66, dims.h * 0.1, s * 0.08), K.trim, 0, dims.h * 0.42, 0);
  put(THREE, panel, K.box(s * 0.5, dims.h * 0.06, s * 0.09), K.mat('hazard', spec.palette.accent, { emissive: spec.palette.accent, emissiveIntensity: 0.25 }), 0, -dims.h * 0.3, 0.001);
  rig.shields.push(panel);
}

function railgun(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.34 * m.size;
  put(THREE, g, K.box(s * 0.66, s * 0.6, s * 0.8), K.second, 0, 0, 0, 0, 0, 0, 'rail_breech');
  const arm = group(THREE, g, 'rail_arm', 0, s * 0.5, 0);
  for (const sx of [-1, 1]) put(THREE, arm, K.box(s * 0.16, s * 0.16, s * 2.2), K.dark, sx * s * 0.22, 0, s * 0.9, 0, 0, 0, 'rail');
  for (let i = 0; i < 5; i++) {
    const z = s * (0.15 + i * 0.42);
    put(THREE, arm, K.torus(s * 0.3, s * 0.06, 6, 12), K.trim, 0, 0, z, 0, 0, 0, 'coil' + i);
    rig.lamps.push(put(THREE, arm, K.box(s * 0.5, s * 0.05, s * 0.06), K.glow(m.color, 0.9 - i * 0.12), 0, s * 0.26, z));
  }
  rig.muzzles.push(put(THREE, arm, K.box(s * 0.42, s * 0.42, s * 0.08), K.glow(m.color, 0.6), 0, 0, s * 2.0));
  rig.turrets.push({ node: arm, tracking: m.tracking, phase: rig.turrets.length * 1.4, range: 0.22 });
}
function droneBay(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.3 * m.size;
  const bay = group(THREE, g, 'drone_bay', 0, s * 0.3, 0);
  put(THREE, bay, K.box(s * 1.0, s * 0.5, s * 1.1), K.second, 0, 0, 0, 0, 0, 0, 'bay_body');
  const hatch = group(THREE, bay, 'bay_hatch', 0, s * 0.26, s * 0.1);
  put(THREE, hatch, K.box(s * 0.96, s * 0.07, s * 0.9), K.trim, 0, 0, 0);
  hatch.rotation.x = -0.5;
  for (let i = 0; i < 2; i++) {
    const d = group(THREE, bay, 'drone' + i, (i ? 1 : -1) * s * 0.24, s * 0.36, 0);
    put(THREE, d, K.box(s * 0.26, s * 0.1, s * 0.26), K.base, 0, 0, 0, 0, 0, 0, 'drone_body');
    for (const sx of [-1, 1]) put(THREE, d, K.cyl(s * 0.13, s * 0.13, s * 0.03, 8), K.trim, sx * s * 0.2, s * 0.05, 0);
    rig.lamps.push(put(THREE, d, K.sph(s * 0.05, 8), K.glow(m.color, 1.5), 0, -s * 0.06, s * 0.1));
    rig.hovering.push({ node: d, baseY: s * 0.36, amp: s * 0.12, phase: i * 2.1 });
  }
}
function winch(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.26 * m.size;
  put(THREE, g, K.box(s * 0.8, s * 0.5, s * 0.7), K.second, 0, 0, 0, 0, 0, 0, 'winch_frame');
  const drum = put(THREE, g, K.cyl(s * 0.34, s * 0.34, s * 0.62, 10), K.trim, 0, 0, 0, 0, 0, Math.PI / 2, 'winch_drum');
  rig.spinners.push({ node: drum, rate: 2.6 });
  put(THREE, g, K.cyl(s * 0.05, s * 0.05, s * 1.4, 6), K.dark, 0, -s * 0.7, s * 0.3, 0.2, 0, 0, 'cable');
  put(THREE, g, K.box(s * 0.3, s * 0.3, s * 0.16), K.second, 0, -s * 1.35, s * 0.42, 0, 0, 0, 'hook');
}
function floodlight(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.24 * m.size;
  const head = group(THREE, g, 'flood_head', 0, s * 0.4, 0);
  put(THREE, g, K.cyl(s * 0.14, s * 0.16, s * 0.5, 8), K.trim, 0, s * 0.15, 0, 0, 0, 0, 'flood_post');
  put(THREE, head, K.box(s * 1.0, s * 0.5, s * 0.3), K.second, 0, 0, 0, 0, 0, 0, 'flood_housing');
  for (let i = 0; i < 3; i++) rig.lamps.push(put(THREE, head, K.cyl(s * 0.15, s * 0.15, s * 0.06, 10),
    K.glow('#fff3d6', 1.5), (i - 1) * s * 0.3, 0, s * 0.17, Math.PI / 2, 0, 0, 'flood_lens' + i));
  rig.turrets.push({ node: head, tracking: m.tracking, phase: rig.turrets.length * 1.1, range: 0.5 });
}
function repairArm(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.24 * m.size;
  const base = group(THREE, g, 'repair_base', 0, s * 0.2, 0);
  put(THREE, base, K.cyl(s * 0.3, s * 0.34, s * 0.3, 10), K.second, 0, 0, 0);
  const seg1 = group(THREE, base, 'repair_seg1', 0, s * 0.2, 0);
  put(THREE, seg1, K.cyl(s * 0.14, s * 0.16, s * 1.1, 8), K.base, 0, s * 0.55, 0);
  const seg2 = group(THREE, seg1, 'repair_seg2', 0, s * 1.1, 0);
  seg2.rotation.x = 0.9;
  put(THREE, seg2, K.cyl(s * 0.11, s * 0.13, s * 0.9, 8), K.base, 0, s * 0.45, 0);
  const tip = group(THREE, seg2, 'repair_tip', 0, s * 0.9, 0);
  put(THREE, tip, K.cone(s * 0.16, s * 0.34, 8), K.trim, 0, s * 0.1, 0);
  rig.lamps.push(put(THREE, tip, K.sph(s * 0.09, 8), K.glow('#7fe3ff', 1.9), 0, s * 0.26, 0, 0, 0, 0, 'welder_arc'));
  rig.turrets.push({ node: seg1, tracking: true, phase: rig.turrets.length * 0.9, range: 0.6 });
}
function flareRack(THREE, K, spec, rig, g, m, dims) {
  const s = dims.w * 0.22 * m.size;
  const rack = group(THREE, g, 'flare_rack', 0, s * 0.25, 0);
  put(THREE, rack, K.box(s * 1.1, s * 0.26, s * 0.5), K.second, 0, 0, 0);
  for (let i = 0; i < 6; i++) {
    const x = (-0.5 + i / 5) * s * 0.9;
    put(THREE, rack, K.cyl(s * 0.1, s * 0.1, s * 0.3, 6), K.dark, x, s * 0.2, 0, -0.25, 0, 0, 'flare_tube' + i);
    if (i % 2 === 0) rig.beacons.push(put(THREE, rack, K.sph(s * 0.05, 6), K.glow(m.color, 1.4), x, s * 0.36, s * 0.06));
  }
}


const MOUNTS = {
  cannon: shoulderCannon, missiles: missilePod, beam: beamProjector, sensor: sensorMast,
  smoke: smokeBank, shield: riotShield, railgun, dronebay: droneBay, winch,
  floodlight, repairarm: repairArm, flare: flareRack,
  ...EXTRA_MOUNTS
};

/* ---------- additive armor panels ---------- */
function panelMat(K, spec, style) {
  if (style === 'ablative') return K.mat('ablative', spec.palette.trim, { metalness: 0.15, roughness: 0.95 });
  if (style === 'composite') return K.mat('composite', spec.palette.secondary, { metalness: 0.3, roughness: 0.6 });
  if (style === 'riot') return K.mat('riot', '#2b2f36', { metalness: 0.2, roughness: 0.5 });
  if (style === 'segmented') return K.mat('segmented', spec.palette.base, { metalness: 0.55, roughness: 0.45 });
  if (style === 'mesh') return K.mat('mesh', spec.palette.trim, { metalness: 0.6, roughness: 0.35 });
  if (style === 'reactive') return K.mat('reactive', spec.palette.trim, { metalness: 0.45, roughness: 0.4 });
  if (style === 'carapace') return K.mat('carapace', spec.palette.base, { metalness: 0.55, roughness: 0.3 });
  if (style === 'fieldemitter') return K.mat('composite', spec.palette.secondary, { metalness: 0.4, roughness: 0.35 });
  return K.second;
}
function addPanel(THREE, K, spec, rig, parent, w, h, d, x, y, z, style, stripe, name, limb) {
  if (!parent) return;
  // limb panels stay flush: projected fields would sweep the ground and stacked
  // reactive bricks would hang past the foot
  if (limb && (style === 'fieldemitter' || style === 'reactive' || style === 'carapace')) style = 'composite';
  const g = group(THREE, parent, name, x, y, z);
  put(THREE, g, K.box(w, h, d), panelMat(K, spec, style), 0, 0, 0, 0, 0, 0, name + '_face');
  put(THREE, g, K.box(w * 1.02, h * 0.12, d * 1.05), K.trim, 0, h * 0.42, 0);
  if (style === 'riot') for (let i = 0; i < 3; i++) put(THREE, g, K.box(w * 0.9, h * 0.05, d * 1.1), K.trim, 0, h * (0.2 - i * 0.2), 0);
  // overlapping plates, kept inside the panel envelope: a segment that stands
  // proud of the panel swings below the sole as soon as the limb pitches
  if (style === 'segmented') for (let i = 0; i < 3; i++)
    put(THREE, g, K.box(w * 0.94, h * 0.2, d * 0.6), K.second, 0, h * (0.22 - i * 0.22), d * 0.28, 0, 0, 0, 'seg' + i);
  if (style === 'mesh') for (let i = 0; i < 4; i++) put(THREE, g, K.box(w * 0.08, h * 0.98, d * 1.06), K.second, w * (0.3 - i * 0.2), 0, 0, 0, 0, 0, 'weave' + i);
  // scorched sacrificial layer — torso panels only: on a shin panel the extra
  // slab hangs past the sole and the foot reads as sunk into the ground
  if (style === 'reactive') for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++)
    put(THREE, g, K.box(w * 0.26, h * 0.38, d * 0.9), K.trim, (c - 1) * w * 0.3, (r - 0.5) * h * 0.42, d * 0.6, 0, 0, 0, 'brick');
  if (style === 'carapace') {
    const ridge = put(THREE, g, K.sph(Math.min(w, h) * 0.5, 10), panelMat(K, spec, style), 0, 0, d * 0.4);
    ridge.scale.set(w / Math.min(w, h) * 0.9, h / Math.min(w, h) * 0.85, 0.5);
  }
  if (style === 'fieldemitter') {
    for (const sx of [-1, 1]) put(THREE, g, K.cyl(w * 0.07, w * 0.07, h * 0.9, 6), K.trim, sx * w * 0.46, 0, d * 0.6);
    rig.fields.push(put(THREE, g, K.box(w * 1.15, h * 1.05, d * 0.12),
      K.mat('field', spec.palette.accent, { emissive: spec.palette.accent, emissiveIntensity: 1.2, transparent: true, opacity: 0.18 }),
      0, 0, d * 1.5, 0, 0, 0, 'panel_field'));
  }
  if (style === 'ablative' && /chest|back|pauldron|collar|flank/.test(name))
    put(THREE, g, K.box(w * 0.86, h * 0.8, d * 0.5), K.mat('scorch', '#2a2320', { metalness: 0.05, roughness: 1.0 }), 0, -h * 0.06, d * 0.5, 0, 0, 0, name + '_scorch');
  if (stripe) put(THREE, g, K.box(w * 0.22, h * 0.9, d * 1.08),
    K.mat('stripe', spec.palette.accent, { emissive: spec.palette.accent, emissiveIntensity: 0.15, roughness: 0.5 }), w * 0.3, 0, 0);
  rig.panels.push(g);
}
function buildArmor(THREE, K, spec, rig, ctx) {
  const dims = ctx.dims, torso = ctx.torso;
  for (const p of spec.attachments.armor) {
    const t = Math.max(0.012, dims.d * p.thickness * 12);
    if (p.slot === 'chest') addPanel(THREE, K, spec, rig, torso, dims.w * 0.66, dims.h * 0.5, t, 0, dims.h * 0.06, dims.d * 0.5 + t, p.style, p.stripe, 'panel_chest');
    else if (p.slot === 'back') addPanel(THREE, K, spec, rig, torso, dims.w * 0.7, dims.h * 0.55, t, 0, 0, -dims.d * 0.5 - t, p.style, p.stripe, 'panel_back');
    else if (p.slot === 'pauldronL' || p.slot === 'pauldronR') {
      const side = p.slot.endsWith('L') ? 'L' : 'R';
      const arm = rig.arms.find(a => a.side.charAt(0) === side);
      if (arm) addPanel(THREE, K, spec, rig, arm.shoulder, dims.w * 0.3, dims.h * 0.34, dims.d * 0.55,
        (side === 'L' ? -1 : 1) * dims.w * 0.1, dims.h * 0.06, 0, p.style, p.stripe, 'panel_pauldron_' + side);
    } else if (p.slot === 'thigh' || p.slot === 'shin') {
      for (const leg of rig.legs) {
        const node = p.slot === 'thigh' ? leg.thigh : leg.shin;
        const L = p.slot === 'thigh' ? leg.seg.thigh : leg.seg.shin;
        // a limb plate hugs the limb. Wider than the sole and a splayed leg puts
        // the plate's outer corner below the foot, which the analytic ground
        // solve measures at the sole — the robot then reads as sunk into the floor.
        // ...and it stays inside the limb's swept envelope: standing proud in +z
        // dips the plate below the sole as soon as the segment pitches forward
        // panel thickness is drawn off the TORSO, which on a limb produces a slab
        // thicker than the limb it is bolted to — cap it against the limb itself
        const wide = Math.min(L * 0.42, leg.radius * 1.7);
        const tl = Math.min(t * 1.2, leg.radius * 0.7);
        const ph = L * 0.5, py = -L * 0.42, pz = L * 0.12, pd = tl;
        addPanel(THREE, K, spec, rig, node, wide, ph, pd, 0, py, pz, p.style, false, 'panel_' + p.slot, true);
        leg.plates.push({ seg: p.slot, py: py - ph * 0.5, pz: Math.abs(pz) + pd * 0.6, half: wide * 0.55 });
      }
    } else if (p.slot === 'forearm') {
      for (const arm of rig.arms) addPanel(THREE, K, spec, rig, arm.fore, arm.len * 0.16, arm.len * 0.3,
        Math.min(t * 1.2, arm.radius ? arm.radius * 0.7 : t * 1.2), 0, -arm.len * 0.22, arm.len * 0.09, p.style, false, 'panel_forearm', true);
    } else if (p.slot === 'knee') {
      for (const leg of rig.legs) {
        const kw = Math.min(leg.seg.shin * 0.5, leg.radius * 1.7), kh = leg.seg.shin * 0.34, kz = leg.seg.shin * 0.16;
        const kt = Math.min(t * 1.2, leg.radius * 0.7);
        addPanel(THREE, K, spec, rig, leg.knee, kw, kh, kt, 0, 0, kz, p.style, false, 'panel_knee', true);
        leg.plates.push({ seg: 'shin', py: -kh * 0.5, pz: kz + kt * 0.6, half: kw * 0.55 });
      }
    } else if (p.slot === 'spine') {
      for (let i = 0; i < 3; i++) addPanel(THREE, K, spec, rig, torso, dims.w * 0.16, dims.h * 0.2, t * 1.6,
        0, dims.h * (0.24 - i * 0.24), -dims.d * 0.52 - t, p.style, false, 'panel_spine' + i);
    } else if (p.slot === 'collar') {
      addPanel(THREE, K, spec, rig, torso, dims.w * 0.8, dims.h * 0.16, dims.d * 0.9, 0, dims.h * 0.46, 0, p.style, p.stripe, 'panel_collar');
    } else if (p.slot === 'flank') {
      for (const [i, sx] of [-1, 1].entries()) addPanel(THREE, K, spec, rig, torso, t * 1.4, dims.h * 0.6, dims.d * 0.7,
        sx * (dims.w * 0.5 + t), 0, 0, p.style, p.stripe, 'panel_flank' + i);
    } else if (p.slot === 'skirt') {
      for (const [i, sx] of [-1, 1].entries()) addPanel(THREE, K, spec, rig, torso, dims.w * 0.36, dims.h * 0.32, t * 1.4,
        sx * dims.w * 0.32, -dims.h * 0.52, dims.d * 0.16, p.style, p.stripe, 'panel_skirt' + i);
    }
  }
}

/* ---------- weapon attachments ---------- */
function buildWeaponMods(THREE, K, spec, rig) {
  const W = spec.attachments.weaponMods;
  if (!W) return;
  for (const gun of rig.weapons) {
    const s = gun.scale, node = gun.node, fwd = -gun.length;   // barrels run down -y from the mount
    if (W.sight !== 'none') {
      const rail = group(THREE, node, 'sight', 0, fwd * 0.35, s * 0.55);
      put(THREE, rail, K.box(s * 0.5, s * 0.55, s * 0.5), K.dark, 0, 0, 0, 0, 0, 0, 'sight_body');
      if (W.sight === 'scope') {
        put(THREE, rail, K.cyl(s * 0.24, s * 0.24, s * 1.5, 10), K.dark, 0, 0, 0, Math.PI / 2, 0, 0, 'scope_tube');
        rig.lamps.push(put(THREE, rail, K.cyl(s * 0.2, s * 0.2, s * 0.05, 10), K.glow('#3ad1ff', 0.7), 0, 0, s * 0.75, Math.PI / 2, 0, 0, 'scope_lens'));
      } else if (W.sight === 'holo') {
        put(THREE, rail, K.box(s * 0.55, s * 0.08, s * 0.5), K.trim, 0, -s * 0.2, 0);
        rig.fields.push(put(THREE, rail, K.box(s * 0.5, s * 0.5, s * 0.02),
          K.mat('field', '#7fe3ff', { emissive: '#7fe3ff', emissiveIntensity: 1.4, transparent: true, opacity: 0.3 }),
          0, s * 0.25, 0, 0, 0, 0, 'holo_pane'));
      } else if (W.sight === 'painter') {
        put(THREE, rail, K.cyl(s * 0.18, s * 0.2, s * 0.9, 8), K.dark, 0, 0, 0, Math.PI / 2, 0, 0, 'painter_tube');
        rig.lamps.push(put(THREE, rail, K.sph(s * 0.14, 8), K.glow('#ffb200', 1.7), 0, 0, s * 0.46, 0, 0, 0, 'painter_lens'));
      } else {
        rig.lamps.push(put(THREE, rail, K.box(s * 0.42, s * 0.4, s * 0.04),
          K.glow(W.sight === 'thermal' ? '#ff8a3d' : '#8fe36a', 0.9), 0, s * 0.1, s * 0.26, 0, 0, 0, 'sight_glass'));
      }
    }
    if (W.laser) {
      const em = group(THREE, node, 'laser', s * 0.42, fwd * 0.6, s * 0.1);
      put(THREE, em, K.box(s * 0.3, s * 0.4, s * 0.35), K.dark, 0, 0, 0);
      const dot = put(THREE, em, K.sph(s * 0.11, 8), K.glow(W.laserColor, 2.0), 0, -s * 0.24, 0, 0, 0, 0, 'laser_emitter');
      // short stub at rest so it never spears the floor; stretched when aiming
      const baseLen = s * 3.5, y0 = -s * 0.24;
      const beam = put(THREE, em, K.cyl(s * 0.028, s * 0.028, baseLen, 6),
        K.mat('beam', W.laserColor, { emissive: W.laserColor, emissiveIntensity: 1.8, transparent: true, opacity: 0.32 }),
        0, y0 - baseLen * 0.5, 0, 0, 0, 0, 'laser_beam');
      rig.lasers.push({ dot, beam, baseLen, y0 });
    }
    if (W.muzzle === 'coil' || W.muzzle === 'plasma') {
      const len = gun.length * 0.5;
      if (W.muzzle === 'coil') {
        for (let i = 0; i < 4; i++) {
          put(THREE, node, K.torus(s * 0.4, s * 0.08, 6, 12), K.trim, 0, fwd - len * (0.15 + i * 0.22), 0, Math.PI / 2, 0, 0, 'coil' + i);
          rig.lamps.push(put(THREE, node, K.sph(s * 0.08, 6), K.glow(spec.palette.accent, 1.3 - i * 0.2), s * 0.34, fwd - len * (0.15 + i * 0.22), 0));
        }
      } else {
        put(THREE, node, K.cyl(s * 0.46, s * 0.3, len * 0.6, 10), K.second, 0, fwd - len * 0.3, 0, 0, 0, 0, 'plasma_bell');
        rig.lamps.push(put(THREE, node, K.sph(s * 0.26, 10), K.glow('#c46bff', 1.8), 0, fwd - len * 0.6, 0, 0, 0, 0, 'plasma_core'));
      }
    } else if (W.muzzle !== 'none') {
      const mz = W.muzzle === 'suppressor' ? { r: s * 0.34, l: gun.length * 0.45 }
        : W.muzzle === 'brake' ? { r: s * 0.4, l: gun.length * 0.14 } : { r: s * 0.44, l: gun.length * 0.1 };
      put(THREE, node, K.cyl(mz.r, mz.r * 0.95, mz.l, 10), K.dark, 0, fwd - mz.l * 0.4, 0, 0, 0, 0, 'muzzle_' + W.muzzle);
      if (W.muzzle === 'flash') for (let i = 0; i < 3; i++) put(THREE, node, K.box(s * 0.1, mz.l * 1.1, s * 0.5), K.trim, 0, fwd - mz.l * 0.4, 0, 0, i * 1.05, 0);
    }
    if (W.magazine !== 'none') {
      if (W.magazine === 'drum') put(THREE, node, K.cyl(s * 0.75, s * 0.75, s * 0.42, 12), K.second, 0, fwd * 0.18, -s * 0.7, 0, 0, Math.PI / 2, 'mag_drum');
      else if (W.magazine === 'cell') {
        const cell = put(THREE, node, K.box(s * 0.6, gun.length * 0.3, s * 0.5), K.second, 0, fwd * 0.2, -s * 0.6, 0, 0, 0, 'mag_cell');
        rig.lamps.push(put(THREE, node, K.box(s * 0.1, gun.length * 0.22, s * 0.52), K.glow(spec.palette.accent, 1.0), s * 0.3, fwd * 0.2, -s * 0.6, 0, 0, 0, 'cell_glow'));
      } else if (W.magazine === 'hopper') {
        put(THREE, node, K.cyl(s * 0.8, s * 0.4, gun.length * 0.36, 8), K.second, 0, fwd * 0.16, -s * 0.75, Math.PI, 0, 0, 'mag_hopper');
        put(THREE, node, K.box(s * 0.3, gun.length * 0.2, s * 0.3), K.trim, 0, fwd * 0.3, -s * 0.5);
      } else if (W.magazine === 'coilpack') {
        for (let i = 0; i < 3; i++) {
          put(THREE, node, K.cyl(s * 0.2, s * 0.2, gun.length * 0.3, 8), K.second, (i - 1) * s * 0.32, fwd * 0.22, -s * 0.55);
          rig.lamps.push(put(THREE, node, K.cyl(s * 0.13, s * 0.13, gun.length * 0.06, 8), K.glow(spec.palette.accent, 1.2), (i - 1) * s * 0.32, fwd * 0.05, -s * 0.55));
        }
      } else if (W.magazine === 'belt') {
        for (let i = 0; i < 6; i++) put(THREE, node, K.box(s * 0.34, s * 0.16, s * 0.22), K.trim, 0, fwd * 0.16 - i * s * 0.17, -s * 0.5 - i * s * 0.06, 0.2 * i, 0, 0, 'belt' + i);
      } else put(THREE, node, K.box(s * 0.55, gun.length * 0.34, s * 0.42), K.second, 0, fwd * 0.2, -s * 0.55, -0.18, 0, 0, 'mag_box');
    }
    if (W.underbarrel !== 'none') {
      if (W.underbarrel === 'grenade') put(THREE, node, K.cyl(s * 0.42, s * 0.42, gun.length * 0.45, 10), K.dark, 0, fwd * 0.55, s * 0.62, 0, 0, 0, 'ub_grenade');
      else if (W.underbarrel === 'grip') put(THREE, node, K.box(s * 0.28, gun.length * 0.28, s * 0.3), K.trim, 0, fwd * 0.5, s * 0.6, -0.25, 0, 0, 'ub_grip');
      else if (W.underbarrel === 'bayonet') {
        put(THREE, node, K.box(s * 0.12, gun.length * 0.75, s * 0.34), K.mat('blade', '#c7ced6', { metalness: 0.9, roughness: 0.2 }), 0, fwd * 0.95, s * 0.5, 0, 0, 0, 'bayonet');
        rig.lamps.push(put(THREE, node, K.box(s * 0.05, gun.length * 0.6, s * 0.08), K.glow(spec.palette.accent, 1.0), s * 0.08, fwd * 0.95, s * 0.5));
      } else if (W.underbarrel === 'shieldrail') {
        put(THREE, node, K.box(s * 0.16, gun.length * 0.5, s * 0.16), K.trim, 0, fwd * 0.5, s * 0.55);
        rig.fields.push(put(THREE, node, K.box(s * 1.6, gun.length * 0.8, s * 0.03),
          K.mat('field', spec.palette.accent, { emissive: spec.palette.accent, emissiveIntensity: 1.1, transparent: true, opacity: 0.2 }),
          0, fwd * 0.5, s * 0.75, 0, 0, 0, 'shield_rail'));
      } else rig.lamps.push(put(THREE, node, K.cyl(s * 0.26, s * 0.26, s * 0.4, 10), K.glow('#ffffff', 0.8), 0, fwd * 0.55, s * 0.6, Math.PI / 2, 0, 0, 'ub_lamp'));
    }
  }
}

/* ---------- limb replacements ----------
   Called by build.js instead of the stock hand when the spec asks for one. */
export function buildLimbEnd(THREE, K, spec, rig, wrist, th, type, side) {
  if (!type || type === 'stock') return false;
  const acc = spec.palette.accent;
  if (type === 'heavy') {
    put(THREE, wrist, K.box(th * 1.15, th * 0.9, th * 1.0), K.second, 0, -th * 0.45, 0, 0, 0, 0, 'heavy_fist');
    for (let i = 0; i < 3; i++) put(THREE, wrist, K.box(th * 0.28, th * 0.5, th * 0.28), K.trim, (i - 1) * th * 0.34, -th * 0.95, th * 0.2);
    put(THREE, wrist, K.cyl(th * 0.2, th * 0.2, th * 0.7, 6), K.trim, 0, -th * 0.2, -th * 0.5);
  } else if (type === 'industrial') {
    put(THREE, wrist, K.cyl(th * 0.5, th * 0.42, th * 0.6, 8), K.second, 0, -th * 0.3, 0, 0, 0, 0, 'clamp_hub');
    for (const sx of [-1, 1]) {
      const jaw = group(THREE, wrist, 'clamp_jaw', sx * th * 0.24, -th * 0.55, 0);
      jaw.rotation.z = sx * 0.28;
      put(THREE, jaw, K.box(th * 0.26, th * 0.95, th * 0.6), K.second, 0, -th * 0.45, 0);
      put(THREE, jaw, K.box(th * 0.3, th * 0.16, th * 0.64), K.trim, 0, -th * 0.85, 0);
      rig.fingers.push(jaw);
    }
    put(THREE, wrist, K.cyl(th * 0.14, th * 0.14, th * 0.8, 6), K.trim, th * 0.42, -th * 0.35, 0);
  } else if (type === 'blade') {
    put(THREE, wrist, K.box(th * 0.7, th * 0.4, th * 0.7), K.second, 0, -th * 0.2, 0, 0, 0, 0, 'blade_mount');
    const blade = put(THREE, wrist, K.box(th * 0.14, th * 3.2, th * 0.62), K.mat('blade', '#c7ced6', { metalness: 0.9, roughness: 0.18 }), 0, -th * 2.0, th * 0.1, 0, 0, 0, 'blade');
    rig.lamps.push(put(THREE, wrist, K.box(th * 0.05, th * 2.6, th * 0.1), K.glow(acc, 1.2), th * 0.09, -th * 2.0, th * 0.1, 0, 0, 0, 'blade_edge'));
  } else if (type === 'drill') {
    put(THREE, wrist, K.cyl(th * 0.52, th * 0.46, th * 0.55, 10), K.second, 0, -th * 0.28, 0, 0, 0, 0, 'drill_housing');
    const bit = group(THREE, wrist, 'drill_bit', 0, -th * 0.55, 0);
    put(THREE, bit, K.cone(th * 0.46, th * 1.7, 8), K.trim, 0, -th * 0.85, 0, Math.PI, 0, 0, 'drill_cone');
    for (let i = 0; i < 3; i++) put(THREE, bit, K.box(th * 0.12, th * 1.4, th * 0.5), K.second, 0, -th * 0.8, 0, 0, i * 1.05, 0.12);
    rig.spinners.push({ node: bit, rate: 16 });
  } else if (type === 'beamfist') {
    put(THREE, wrist, K.cyl(th * 0.46, th * 0.5, th * 0.75, 10), K.second, 0, -th * 0.38, 0, 0, 0, 0, 'projector');
    for (let i = 0; i < 2; i++) put(THREE, wrist, K.torus(th * 0.42, th * 0.08, 6, 12), K.trim, 0, -th * (0.5 + i * 0.3), 0, Math.PI / 2, 0, 0);
    const core = put(THREE, wrist, K.sph(th * 0.34, 10), K.glow(acc, 1.8), 0, -th * 1.05, 0, 0, 0, 0, 'beam_core');
    rig.lamps.push(core);
  } else if (type === 'welder') {
    put(THREE, wrist, K.box(th * 0.7, th * 0.5, th * 0.7), K.second, 0, -th * 0.25, 0, 0, 0, 0, 'welder_body');
    put(THREE, wrist, K.cyl(th * 0.16, th * 0.1, th * 1.1, 8), K.trim, 0, -th * 0.95, th * 0.05, 0, 0, 0, 'torch');
    rig.lamps.push(put(THREE, wrist, K.cone(th * 0.14, th * 0.4, 8), K.glow('#a8d8ff', 2.0), 0, -th * 1.6, th * 0.05, Math.PI, 0, 0, 'arc'));
    put(THREE, wrist, K.cyl(th * 0.2, th * 0.2, th * 0.5, 8), K.dark, -th * 0.4, -th * 0.3, -th * 0.2, 0.3, 0, 0, 'gas_line');
  } else if (type === 'saw') {
    put(THREE, wrist, K.box(th * 0.6, th * 0.5, th * 0.5), K.second, 0, -th * 0.25, 0, 0, 0, 0, 'saw_body');
    const disc = group(THREE, wrist, 'saw_disc', 0, -th * 0.95, th * 0.15);
    put(THREE, disc, K.cyl(th * 1.05, th * 1.05, th * 0.05, 16), K.mat('sawblade', '#c7ced6', { metalness: 0.9, roughness: 0.2 }), 0, 0, 0, 0, 0, Math.PI / 2, 'blade');
    for (let i = 0; i < 10; i++) put(THREE, disc, K.box(th * 0.1, th * 0.1, th * 0.06), K.trim, Math.cos(i / 10 * 6.28) * th, Math.sin(i / 10 * 6.28) * th, 0);
    rig.spinners.push({ node: disc, rate: 22, axis: 'z' });
    put(THREE, wrist, K.box(th * 0.7, th * 0.6, th * 0.1), K.trim, 0, -th * 0.75, -th * 0.12, 0, 0, 0, 'saw_guard');
  } else if (type === 'spray') {
    put(THREE, wrist, K.cyl(th * 0.32, th * 0.3, th * 0.7, 8), K.second, 0, -th * 0.4, 0, 0, 0, 0, 'spray_body');
    put(THREE, wrist, K.box(th * 1.5, th * 0.12, th * 0.12), K.trim, 0, -th * 0.85, 0, 0, 0, 0, 'boom');
    for (let i = 0; i < 4; i++) put(THREE, wrist, K.cone(th * 0.09, th * 0.18, 6), K.trim, (i - 1.5) * th * 0.42, -th * 0.98, 0, Math.PI, 0, 0, 'nozzle' + i);
    rig.lamps.push(put(THREE, wrist, K.box(th * 1.4, th * 0.04, th * 0.05), K.glow(acc, 0.7), 0, -th * 1.12, 0, 0, 0, 0, 'spray_fan'));
  } else if (type === 'vac') {
    put(THREE, wrist, K.cyl(th * 0.34, th * 0.5, th * 0.9, 10, true), K.second, 0, -th * 0.55, 0, 0, 0, 0, 'vac_horn');
    put(THREE, wrist, K.torus(th * 0.5, th * 0.06, 6, 14), K.trim, 0, -th * 1.0, 0, Math.PI / 2, 0, 0);
    const fan = group(THREE, wrist, 'vac_fan', 0, -th * 0.35, 0);
    for (let i = 0; i < 4; i++) put(THREE, fan, K.box(th * 0.5, th * 0.03, th * 0.16), K.trim, 0, 0, 0, 0, i * 0.78, 0);
    rig.spinners.push({ node: fan, rate: 14 });
  } else if (type === 'sampler') {
    put(THREE, wrist, K.box(th * 0.5, th * 0.4, th * 0.5), K.second, 0, -th * 0.2, 0, 0, 0, 0, 'sampler_body');
    put(THREE, wrist, K.cyl(th * 0.35, th * 0.28, th * 0.5, 8), K.trim, 0, -th * 0.7, th * 0.12, 0.3, 0, 0, 'scoop');
    for (let i = 0; i < 3; i++) put(THREE, wrist, K.cyl(th * 0.09, th * 0.09, th * 0.34, 8), K.mat('vial', '#cfe8f5', { transparent: true, opacity: 0.5, metalness: 0.1, roughness: 0.2 }), (i - 1) * th * 0.24, -th * 0.28, -th * 0.3, 0, 0, 0, 'vial' + i);
  } else if (type === 'auger') {
    put(THREE, wrist, K.cyl(th * 0.36, th * 0.3, th * 0.5, 8), K.second, 0, -th * 0.25, 0, 0, 0, 0, 'auger_head');
    const bit = group(THREE, wrist, 'auger_bit', 0, -th * 0.5, 0);
    put(THREE, bit, K.cyl(th * 0.12, th * 0.12, th * 2.2, 8), K.trim, 0, -th * 1.1, 0, 0, 0, 0, 'auger_shaft');
    for (let i = 0; i < 7; i++) put(THREE, bit, K.box(th * 0.5, th * 0.05, th * 0.2), K.second, 0, -th * (0.25 + i * 0.28), 0, 0, i * 0.9, 0.1);
    rig.spinners.push({ node: bit, rate: 9 });
  } else if (type === 'medkit') {
    put(THREE, wrist, K.box(th * 0.8, th * 0.6, th * 0.5), K.mat('medcase', '#e8eef0', { metalness: 0.1, roughness: 0.5 }), 0, -th * 0.35, 0, 0, 0, 0, 'medkit');
    put(THREE, wrist, K.box(th * 0.4, th * 0.1, th * 0.52), K.glow('#ff4d4d', 0.8), 0, -th * 0.35, th * 0.02);
    put(THREE, wrist, K.box(th * 0.1, th * 0.4, th * 0.52), K.glow('#ff4d4d', 0.8), 0, -th * 0.35, th * 0.02);
    put(THREE, wrist, K.cyl(th * 0.07, th * 0.07, th * 0.6, 6), K.trim, th * 0.3, -th * 0.75, 0, 0, 0, 0.25, 'applicator');
  } else if (type === 'tray') {
    put(THREE, wrist, K.cyl(th * 0.2, th * 0.24, th * 0.3, 8), K.second, 0, -th * 0.2, 0, 0, 0, 0, 'tray_gimbal');
    const tray = group(THREE, wrist, 'tray_top', 0, -th * 0.4, th * 0.12);
    put(THREE, tray, K.cyl(th * 1.1, th * 1.05, th * 0.06, 14), K.mat('tray', '#dfe3e8', { metalness: 0.4, roughness: 0.35 }), 0, 0, 0, 0, 0, 0, 'tray_face');
    put(THREE, tray, K.torus(th * 1.1, th * 0.04, 5, 16), K.trim, 0, th * 0.03, 0, Math.PI / 2, 0, 0);
    rig.trays.push(tray);
  } else if (type === 'disruptor') {
    put(THREE, wrist, K.box(th * 0.6, th * 0.5, th * 0.9), K.second, 0, -th * 0.25, th * 0.1, 0, 0, 0, 'disruptor_body');
    put(THREE, wrist, K.cyl(th * 0.22, th * 0.24, th * 1.1, 10), K.dark, 0, -th * 0.3, th * 0.75, Math.PI / 2, 0, 0, 'disruptor_tube');
    rig.muzzles.push(put(THREE, wrist, K.cyl(th * 0.16, th * 0.16, th * 0.06, 8), K.glow('#ffb200', 0.7), 0, -th * 0.3, th * 1.32, Math.PI / 2, 0, 0, 'disruptor_muzzle'));
    put(THREE, wrist, K.box(th * 0.5, th * 0.14, th * 0.5), K.trim, 0, -th * 0.6, th * 0.1, 0, 0, 0, 'stand');
  } else if (type === 'harpoon') {
    put(THREE, wrist, K.box(th * 0.7, th * 1.5, th * 0.7), K.second, 0, -th * 0.7, 0, 0, 0, 0, 'harpoon_tube');
    put(THREE, wrist, K.cone(th * 0.22, th * 0.8, 8), K.trim, 0, -th * 1.7, 0, Math.PI, 0, 0, 'harpoon_head');
    put(THREE, wrist, K.cyl(th * 0.3, th * 0.3, th * 0.4, 10), K.dark, 0, -th * 0.5, -th * 0.5, 0, 0, Math.PI / 2, 'line_spool');
    rig.lamps.push(put(THREE, wrist, K.box(th * 0.1, th * 0.5, th * 0.1), K.glow(acc, 0.8), th * 0.36, -th * 0.7, 0));
  } else if (type === 'multitool') {
    put(THREE, wrist, K.cyl(th * 0.48, th * 0.44, th * 0.55, 10), K.second, 0, -th * 0.28, 0, 0, 0, 0, 'tool_hub');
    const wheelG = group(THREE, wrist, 'tool_wheel', 0, -th * 0.62, 0);
    const bits = ['cone', 'box', 'cyl', 'claw'];
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      const px = Math.cos(ang) * th * 0.3, pz = Math.sin(ang) * th * 0.3;
      if (bits[i] === 'cone') put(THREE, wheelG, K.cone(th * 0.13, th * 0.6, 6), K.trim, px, -th * 0.3, pz, Math.PI, 0, 0);
      else if (bits[i] === 'box') put(THREE, wheelG, K.box(th * 0.16, th * 0.5, th * 0.16), K.trim, px, -th * 0.25, pz);
      else if (bits[i] === 'cyl') put(THREE, wheelG, K.cyl(th * 0.1, th * 0.1, th * 0.55, 6), K.second, px, -th * 0.28, pz);
      else for (const sx of [-1, 1]) put(THREE, wheelG, K.box(th * 0.08, th * 0.42, th * 0.1), K.trim, px + sx * th * 0.07, -th * 0.22, pz, sx * 0.2, 0, 0);
    }
    rig.spinners.push({ node: wheelG, rate: 1.4 });
  } else if (type === 'ram') {
    put(THREE, wrist, K.box(th * 0.9, th * 0.7, th * 0.9), K.second, 0, -th * 0.35, 0, 0, 0, 0, 'ram_housing');
    for (const sx of [-1, 1]) put(THREE, wrist, K.cyl(th * 0.12, th * 0.12, th * 1.0, 6), K.trim, sx * th * 0.3, -th * 0.75, 0);
    const head = group(THREE, wrist, 'ram_head', 0, -th * 1.15, 0);
    put(THREE, head, K.cyl(th * 0.52, th * 0.58, th * 0.5, 10), K.second, 0, 0, 0, 0, 0, 0, 'ram_face');
    put(THREE, head, K.torus(th * 0.5, th * 0.09, 6, 12), K.trim, 0, -th * 0.2, 0, Math.PI / 2, 0, 0);
    rig.rams.push({ node: head, base: -th * 1.15, throw: th * 0.5, phase: rig.rams.length * 1.7 });
  } else if (type === 'shieldemitter') {
    put(THREE, wrist, K.cyl(th * 0.44, th * 0.5, th * 0.5, 10), K.second, 0, -th * 0.28, 0, 0, 0, 0, 'emitter_hub');
    for (let i = 0; i < 3; i++) {
      const ang = i * 2.1;
      put(THREE, wrist, K.box(th * 0.1, th * 0.75, th * 0.24), K.trim, Math.cos(ang) * th * 0.34, -th * 0.7, Math.sin(ang) * th * 0.34, 0, -ang, Math.cos(ang) * 0.25, 'prong' + i);
    }
    const disc = put(THREE, wrist, K.cyl(th * 1.5, th * 1.5, th * 0.05, 16),
      K.mat('field', acc, { emissive: acc, emissiveIntensity: 1.2, transparent: true, opacity: 0.22 }),
      0, -th * 1.25, th * 0.1, 0.25, 0, 0, 'shield_field');
    rig.fields.push(disc);
  } else if (type === 'winch') {
    put(THREE, wrist, K.cyl(th * 0.4, th * 0.4, th * 0.6, 10), K.second, 0, -th * 0.35, 0, 0, 0, Math.PI / 2, 'winch_drum');
    for (const sx of [-1, 1]) put(THREE, wrist, K.cyl(th * 0.44, th * 0.44, th * 0.06, 12), K.trim, sx * th * 0.32, -th * 0.35, 0, 0, 0, Math.PI / 2);
    put(THREE, wrist, K.cyl(th * 0.02, th * 0.02, th * 1.4, 5), K.dark, 0, -th * 1.05, th * 0.1, 0, 0, 0, 'cable');
    put(THREE, wrist, K.torus(th * 0.14, th * 0.04, 5, 12), K.trim, 0, -th * 1.7, th * 0.1, Math.PI / 2, 0, 0, 'hook');
  } else return false;
  return true;
}

/* ---------- back mounts ---------- */
function buildBack(THREE, K, spec, rig, ctx) {
  const kind = spec.attachments.back;
  if (!kind || kind === 'none') return;
  const dims = ctx.dims, torso = ctx.torso;
  const g = group(THREE, torso, 'backmount', 0, dims.h * 0.06, -dims.d * 0.55);
  const w = dims.w;
  if (kind === 'jetpack') {
    put(THREE, g, K.box(w * 0.62, dims.h * 0.5, w * 0.22), K.second, 0, 0, -w * 0.1);
    for (const sx of [-1, 1]) {
      put(THREE, g, K.cyl(w * 0.13, w * 0.16, dims.h * 0.3, 10), K.trim, sx * w * 0.3, -dims.h * 0.2, -w * 0.12, 0.35, 0, 0);
      const plume = put(THREE, g, K.cone(w * 0.1, dims.h * 0.22, 8),
        K.mat('jet', spec.palette.accent, { emissive: spec.palette.accent, emissiveIntensity: 1.4, transparent: true, opacity: 0.4 }),
        sx * w * 0.3, -dims.h * 0.42, -w * 0.2, Math.PI - 0.35, 0, 0, 'jet_plume');
      rig.plumes.push(plume);
    }
  } else if (kind === 'coolant') {
    for (const sx of [-1, 1]) put(THREE, g, K.cyl(w * 0.15, w * 0.15, dims.h * 0.6, 10), K.second, sx * w * 0.22, 0, -w * 0.12);
    put(THREE, g, K.box(w * 0.5, dims.h * 0.1, w * 0.2), K.trim, 0, dims.h * 0.28, -w * 0.12);
    rig.lamps.push(put(THREE, g, K.box(w * 0.35, dims.h * 0.05, w * 0.22), K.glow('#3ad1ff', 0.9), 0, -dims.h * 0.2, -w * 0.13));
  } else if (kind === 'cargo') {
    put(THREE, g, K.box(w * 0.8, dims.h * 0.45, w * 0.3), K.second, 0, -dims.h * 0.02, -w * 0.16);
    for (let i = 0; i < 3; i++) put(THREE, g, K.box(w * 0.84, dims.h * 0.04, w * 0.34), K.trim, 0, dims.h * (0.18 - i * 0.16), -w * 0.16);
  } else if (kind === 'dronebay') {
    put(THREE, g, K.box(w * 0.8, dims.h * 0.5, w * 0.34), K.second, 0, 0, -w * 0.18, 0, 0, 0, 'bay');
    const door = group(THREE, g, 'bay_door', 0, dims.h * 0.26, -w * 0.18);
    put(THREE, g, K.box(w * 0.82, dims.h * 0.05, w * 0.36), K.trim, 0, -dims.h * 0.26, -w * 0.18);
    put(THREE, door, K.box(w * 0.78, dims.h * 0.05, w * 0.34), K.trim, 0, 0, 0);
    rig.hatches.push({ node: door, axis: 'z', range: 0.8, phase: 0.4 });
    rig.beacons.push(put(THREE, g, K.sph(w * 0.05, 8), K.glow(spec.palette.accent, 1.5), w * 0.3, dims.h * 0.2, -w * 0.36));
  } else if (kind === 'hosecoil') {
    const coil = group(THREE, g, 'hose_coil', 0, 0, -w * 0.22);
    for (let i = 0; i < 4; i++) put(THREE, coil, K.torus(w * 0.3 - i * w * 0.045, w * 0.045, 6, 16), K.mat('hose', '#1b1b1e', { roughness: 0.9, metalness: 0.05 }), 0, 0, i * w * 0.03, 0, 0, 0, 'coil' + i);
    put(THREE, g, K.cyl(w * 0.06, w * 0.06, dims.h * 0.5, 8), K.trim, w * 0.34, 0, -w * 0.2, 0, 0, 0.2, 'standpipe');
    rig.spinners.push({ node: coil, rate: 0.4, axis: 'z' });
  } else if (kind === 'hopper') {
    put(THREE, g, K.cyl(w * 0.42, w * 0.16, dims.h * 0.6, 8), K.second, 0, 0, -w * 0.24, 0, 0, 0, 'hopper');
    put(THREE, g, K.cyl(w * 0.44, w * 0.44, dims.h * 0.05, 10), K.trim, 0, dims.h * 0.3, -w * 0.24);
    put(THREE, g, K.box(w * 0.5, dims.h * 0.06, w * 0.1), K.trim, 0, -dims.h * 0.32, -w * 0.24, 0, 0, 0, 'spreader');
  } else if (kind === 'samples') {
    put(THREE, g, K.box(w * 0.7, dims.h * 0.5, w * 0.28), K.second, 0, 0, -w * 0.15, 0, 0, 0, 'rack');
    for (let i = 0; i < 6; i++) put(THREE, g, K.cyl(w * 0.06, w * 0.06, dims.h * 0.16, 8),
      K.mat('vial', '#cfe8f5', { transparent: true, opacity: 0.55, metalness: 0.1, roughness: 0.2 }),
      (i % 3 - 1) * w * 0.2, (i < 3 ? 1 : -1) * dims.h * 0.12, -w * 0.02, 0, 0, 0, 'vial' + i);
  } else if (kind === 'solarwing') {
    for (const sx of [-1, 1]) {
      const wing = group(THREE, g, 'solar_wing', sx * w * 0.2, dims.h * 0.1, -w * 0.12);
      wing.rotation.z = -sx * 0.35;
      put(THREE, wing, K.box(w * 0.7, dims.h * 0.02, w * 0.5), K.mat('solar', '#1b2a4a', { metalness: 0.4, roughness: 0.35 }), sx * w * 0.36, 0, 0, 0, 0, 0, 'cells');
      put(THREE, wing, K.box(w * 0.74, dims.h * 0.03, w * 0.06), K.trim, sx * w * 0.36, 0, w * 0.26);
    }
  } else if (kind === 'mast') {
    for (let i = 0; i < 3; i++) put(THREE, g, K.cyl(w * (0.07 - i * 0.012), w * (0.08 - i * 0.012), dims.h * 0.5, 8), K.trim, 0, dims.h * (0.3 + i * 0.45), -w * 0.16, 0, 0, 0, 'mast' + i);
    const dish = group(THREE, g, 'mast_dish', 0, dims.h * 1.6, -w * 0.16);
    put(THREE, dish, K.cyl(w * 0.3, w * 0.06, w * 0.16, 12, true), K.second, 0, 0, 0, Math.PI / 2.4, 0, 0, 'dish');
    rig.spinners.push({ node: dish, rate: 0.7 });
    rig.beacons.push(put(THREE, g, K.sph(w * 0.05, 8), K.glow('#ff3b30', 1.6), 0, dims.h * 1.75, -w * 0.16));
  } else if (kind === 'tank') {
    for (const sx of [-1, 1]) {
      put(THREE, g, K.cyl(w * 0.19, w * 0.19, dims.h * 0.72, 12), K.second, sx * w * 0.22, 0, -w * 0.2, 0, 0, 0, 'tank' + sx);
      put(THREE, g, K.torus(w * 0.2, w * 0.03, 5, 12), K.trim, sx * w * 0.22, dims.h * 0.3, -w * 0.2, Math.PI / 2, 0, 0);
    }
    put(THREE, g, K.box(w * 0.5, dims.h * 0.08, w * 0.08), K.trim, 0, dims.h * 0.18, -w * 0.2);
  } else if (kind === 'generator') {
    put(THREE, g, K.box(w * 0.66, dims.h * 0.44, w * 0.3), K.second, 0, 0, -w * 0.17, 0, 0, 0, 'genset');
    for (let i = 0; i < 3; i++) put(THREE, g, K.box(w * 0.68, dims.h * 0.04, w * 0.32), K.trim, 0, dims.h * (0.16 - i * 0.16), -w * 0.17);
    put(THREE, g, K.cyl(w * 0.06, w * 0.06, dims.h * 0.3, 8), K.dark, w * 0.24, dims.h * 0.34, -w * 0.17, 0, 0, 0, 'exhaust');
    rig.lamps.push(put(THREE, g, K.sph(w * 0.05, 8), K.glow('#ffb200', 1.2), -w * 0.24, dims.h * 0.2, -w * 0.33));
  } else if (kind === 'radiator') {
    for (const sx of [-1, 1]) {
      const fin = group(THREE, g, 'rad_fin', sx * w * 0.18, 0, -w * 0.16);
      fin.rotation.y = sx * 0.5;
      put(THREE, fin, K.box(w * 0.04, dims.h * 0.62, w * 0.5), K.mat('radiator', '#9aa3ab', { metalness: 0.7, roughness: 0.4 }), 0, 0, 0, 0, 0, 0, 'fin');
      for (let i = 0; i < 4; i++) put(THREE, fin, K.box(w * 0.06, dims.h * 0.03, w * 0.52), K.trim, 0, dims.h * (0.24 - i * 0.16), 0);
    }
  } else if (kind === 'powerspine') {
    put(THREE, g, K.box(w * 0.3, dims.h * 0.62, w * 0.22), K.second, 0, 0, -w * 0.11);
    for (let i = 0; i < 4; i++) {
      const y = dims.h * (0.24 - i * 0.16);
      put(THREE, g, K.torus(w * 0.17, w * 0.035, 6, 12), K.trim, 0, y, -w * 0.11, Math.PI / 2, 0, 0);
      rig.lamps.push(put(THREE, g, K.sph(w * 0.05, 8), K.glow(spec.palette.accent, 1.2 - i * 0.2), 0, y, -w * 0.26));
    }
    for (const sx of [-1, 1]) put(THREE, g, K.cyl(w * 0.035, w * 0.035, dims.h * 0.55, 6), K.dark, sx * w * 0.19, 0, -w * 0.16, 0.12 * sx, 0, 0, 'conduit');
  } else if (kind === 'satdish') {
    put(THREE, g, K.box(w * 0.4, dims.h * 0.3, w * 0.2), K.second, 0, -dims.h * 0.05, -w * 0.1);
    const mast = group(THREE, g, 'satdish_mast', 0, dims.h * 0.16, -w * 0.14);
    put(THREE, mast, K.cyl(w * 0.05, w * 0.06, dims.h * 0.34, 8), K.trim, 0, dims.h * 0.17, 0);
    const dish = group(THREE, mast, 'satdish_head', 0, dims.h * 0.36, 0);
    const cup = put(THREE, dish, K.cone(w * 0.3, w * 0.22, 14), K.second, 0, 0, 0, Math.PI * 0.6, 0, 0, 'satdish_cup');
    cup.scale.set(1, 0.45, 1);
    put(THREE, dish, K.cyl(w * 0.025, w * 0.025, w * 0.24, 6), K.trim, 0, 0, w * 0.12, Math.PI / 2, 0, 0);
    rig.spinners.push({ node: dish, rate: 0.7 });
    rig.dish = rig.dish || dish;
  } else if (kind === 'dronerack') {
    put(THREE, g, K.box(w * 0.7, dims.h * 0.34, w * 0.24), K.second, 0, 0, -w * 0.13);
    for (let i = 0; i < 3; i++) {
      const d = group(THREE, g, 'rack_drone' + i, (i - 1) * w * 0.26, dims.h * 0.22, -w * 0.16);
      put(THREE, d, K.box(w * 0.18, w * 0.06, w * 0.18), K.base, 0, 0, 0);
      for (const sx of [-1, 1]) put(THREE, d, K.cyl(w * 0.08, w * 0.08, w * 0.02, 8), K.trim, sx * w * 0.13, w * 0.03, 0);
      rig.lamps.push(put(THREE, d, K.sph(w * 0.03, 6), K.glow(spec.palette.accent, 1.4), 0, -w * 0.04, w * 0.07));
      rig.hovering.push({ node: d, baseY: dims.h * 0.22, amp: w * 0.06, phase: i * 1.7 });
    }
  } else if (kind === 'chute') {
    put(THREE, g, K.cyl(w * 0.24, w * 0.24, dims.h * 0.36, 10), K.second, 0, 0, -w * 0.16, 0, 0, 0, 'chute_can');
    put(THREE, g, K.cyl(w * 0.25, w * 0.25, dims.h * 0.04, 10), K.trim, 0, dims.h * 0.2, -w * 0.16);
  } else {
    put(THREE, g, K.box(w * 0.44, dims.h * 0.42, w * 0.24), K.second, 0, 0, -w * 0.12);
    const ring = group(THREE, g, 'shieldgen_ring', 0, dims.h * 0.05, -w * 0.26);
    put(THREE, ring, K.torus(w * 0.26, w * 0.05, 6, 14), K.trim, 0, 0, 0);
    rig.lamps.push(put(THREE, ring, K.sph(w * 0.1, 10), K.glow(spec.palette.accent, 1.6), 0, 0, 0));
    rig.spinners.push({ node: ring, rate: 2.2 });
  }
  if (spec.attachments.hazardLights) {
    for (const sx of [-1, 1]) rig.beacons.push(put(THREE, torso, K.sph(dims.w * 0.05, 8),
      K.glow('#ffb200', 1.6), sx * dims.w * 0.44, dims.h * 0.5, -dims.d * 0.3, 0, 0, 0, 'hazard'));
  }
}

/* ---------- finish ----------
   Surface treatment: glow seams in the joint gaps, panel lines, a unit insignia,
   scorch, and an iridescent sheen. Cheap geometry, most of the sci-fi read. */
export function applyFinish(THREE, K, spec, rig, ctx) {
  const F = spec.finish;
  if (!F) return;
  const dims = ctx.dims, torso = ctx.torso, acc = spec.palette.accent;

  if (F.iridescent) {
    for (const m of K.materialList) {
      if (m.name === 'base' || m.name === 'second') {
        m.metalness = Math.min(0.95, m.metalness + 0.25);
        m.roughness = Math.max(0.08, m.roughness - 0.2);
        if (m.emissive) { m.emissive.set(acc); m.emissiveIntensity = 0.06; }
      }
    }
  }

  if (F.glowSeams) {
    const seam = K.mat('glow', F.seamColor, { emissive: F.seamColor, emissiveIntensity: F.seamGlow });
    const ring = (node, r, th) => rig.lamps.push(put(THREE, node, K.torus(r, th, 5, 12), seam, 0, 0, 0, Math.PI / 2, 0, 0, 'seam'));
    for (const arm of rig.arms) { ring(arm.shoulder, arm.radius * 1.5, arm.radius * 0.16); ring(arm.elbow, arm.radius * 1.2, arm.radius * 0.14); }
    for (const leg of rig.legs) { ring(leg.hip, leg.radius * 1.3, leg.radius * 0.16); ring(leg.knee, leg.radius * 1.1, leg.radius * 0.14); }
    rig.lamps.push(put(THREE, torso, K.box(dims.w * 0.9, dims.h * 0.02, dims.d * 0.9), seam, 0, dims.h * 0.18, 0, 0, 0, 0, 'seam_belt'));
  }

  if (F.panelLines) {
    const line = K.mat('trim', spec.palette.trim, { metalness: 0.4, roughness: 0.8 });
    for (let i = 0; i < 3; i++) put(THREE, torso, K.box(dims.w * 0.02, dims.h * 0.8, dims.d * 1.01), line, dims.w * (-0.25 + i * 0.25), 0, 0, 0, 0, 0, 'panel_line' + i);
    put(THREE, torso, K.box(dims.w * 1.01, dims.h * 0.015, dims.d * 1.01), line, 0, -dims.h * 0.16, 0);
  }

  if (F.insignia !== 'none') {
    const host = F.insigniaOn === 'back' ? torso : F.insigniaOn === 'pauldron' && rig.arms[0] ? rig.arms[0].shoulder : torso;
    const zf = F.insigniaOn === 'back' ? -dims.d * 0.53 : dims.d * 0.54;
    const s = dims.h * 0.16;
    const mk = K.mat('decal', acc, { emissive: acc, emissiveIntensity: 0.5, roughness: 0.4 });
    const gI = group(THREE, host, 'insignia', dims.w * 0.22, dims.h * 0.16, zf);
    if (F.insignia === 'ring') put(THREE, gI, K.torus(s * 0.5, s * 0.11, 5, 14), mk, 0, 0, 0);
    else if (F.insignia === 'triangle') put(THREE, gI, K.cone(s * 0.55, s * 0.06, 3), mk, 0, 0, 0, Math.PI / 2, 0, 0);
    else if (F.insignia === 'bars') for (let i = 0; i < 3; i++) put(THREE, gI, K.box(s * 0.8, s * 0.13, s * 0.05), mk, 0, (i - 1) * s * 0.24, 0);
    else for (let i = 0; i < 2; i++) {
      put(THREE, gI, K.box(s * 0.6, s * 0.12, s * 0.05), mk, -s * 0.16, (i - 0.5) * s * 0.3, 0, 0, 0, 0.6);
      put(THREE, gI, K.box(s * 0.6, s * 0.12, s * 0.05), mk, s * 0.16, (i - 0.5) * s * 0.3, 0, 0, 0, -0.6);
    }
  }

  if (F.scorch > 0.15) {
    const soot = K.mat('dark', '#0d0d0f', { metalness: 0.1, roughness: 1 });
    const n = Math.round(F.scorch * 5);
    for (let i = 0; i < n; i++) {
      const ang = i * 2.4;
      const p = put(THREE, torso, K.box(dims.w * 0.3, dims.h * 0.22, 0.006), soot,
        Math.cos(ang) * dims.w * 0.3, Math.sin(ang) * dims.h * 0.25, dims.d * 0.52, 0, 0, ang, 'scorch' + i);
      p.scale.set(1, 0.6 + 0.5 * ((i % 3) / 3), 1);
    }
  }
}

/* ---------- entry point ---------- */
export function buildAttachments(THREE, K, spec, rig, ctx) {
  const A = spec.attachments;
  if (!A) return;
  const dims = ctx.dims, torso = ctx.torso;
  for (const side of ['L', 'R']) {
    const m = A.shoulder[side];
    if (!m) continue;
    const fn = MOUNTS[m.type];
    if (!fn) continue;
    const g = group(THREE, torso, 'shoulder_mount_' + side,
      (side === 'L' ? -1 : 1) * dims.w * 0.56, dims.h * 0.42, -dims.d * 0.06);
    fn(THREE, K, spec, rig, g, m, dims);
  }
  buildArmor(THREE, K, spec, rig, ctx);
  buildWeaponMods(THREE, K, spec, rig);
  buildBack(THREE, K, spec, rig, ctx);
  buildKit(THREE, K, spec, rig, ctx);
}
