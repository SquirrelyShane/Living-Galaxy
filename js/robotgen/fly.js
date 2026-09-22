// robotgen/src/fly.js — flying chassis: multirotor scouts and small fixed-wing
// scout planes. Same contract as the ground drives in build.js: return
// { node, drop } and register animatable parts on the rig.
//
// The airframe sits on its gear when parked; altitude is an ANIMATION offset
// (rig.flight), so a parked scout is still on the ground for framing, bounds
// and physics, and only leaves it while the drive is running.
import { put, group } from './parts.js';

const TAU = Math.PI * 2;

function collide(rig, node, half, offset, name, groupName) {
  rig.colliders.push({ node, half, offset: offset || { x: 0, y: 0, z: 0 }, name, group: groupName });
}

/* ---------- shared bits ---------- */
function rotorAssembly(THREE, K, spec, rig, parent, r, name, dir, ducted, guard) {
  const g = group(THREE, parent, name, 0, 0, 0);
  put(THREE, g, K.cyl(r * 0.16, r * 0.2, r * 0.22, 8), K.second, 0, 0, 0, 0, 0, 0, name + '_motor');
  const spin = group(THREE, g, name + '_spin', 0, r * 0.15, 0);
  put(THREE, spin, K.cyl(r * 0.1, r * 0.12, r * 0.08, 8), K.trim, 0, 0, 0, 0, 0, 0, name + '_hub');
  const blades = spec.locomotion.coaxial ? 4 : 2 + (ducted ? 1 : 0);
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * TAU;
    const b = put(THREE, spin, K.box(r * 1.9, r * 0.03, r * 0.16), K.dark, 0, 0, 0, 0, a, 0.06, name + '_blade' + i);
    b.position.set(Math.cos(a) * r * 0.0, 0, 0);
  }
  // the disc you actually see once it is turning
  const disc = put(THREE, spin, K.cyl(r, r, r * 0.012, 18), K.mat('rotordisc', spec.palette.accent, {
    emissive: spec.palette.accent, emissiveIntensity: 0.35, transparent: true, opacity: 0.0, roughness: 0.6
  }), 0, r * 0.04, 0, 0, 0, 0, name + '_disc');
  rig.rotors.push({ node: spin, disc, radius: r, dir, rate: 42 });
  if (ducted) {
    put(THREE, g, K.cyl(r * 1.12, r * 1.12, r * 0.5, 14, true), K.second, 0, r * 0.12, 0, 0, 0, 0, name + '_duct');
    put(THREE, g, K.torus(r * 1.12, r * 0.05, 6, 16), K.trim, 0, r * 0.36, 0, Math.PI / 2, 0, 0, name + '_lip');
  } else if (guard) {
    put(THREE, g, K.torus(r * 1.08, r * 0.028, 5, 16), K.trim, 0, r * 0.16, 0, Math.PI / 2, 0, 0, name + '_guard');
  }
  collide(rig, g, [r * 1.1, r * 0.3, r * 1.1], null, name, 'drive');
  return g;
}

function navLight(THREE, K, rig, parent, x, y, z, color, name) {
  const m = put(THREE, parent, K.sph(Math.max(0.006, Math.abs(x) * 0.035 + 0.008), 8), K.glow(color, 1.6), x, y, z, 0, 0, 0, name);
  rig.navLights.push({ node: m, color });
  return m;
}

function skidGear(THREE, K, spec, rig, g, w, d, drop, kind) {
  if (kind === 'none') return 0;
  if (kind === 'legs') {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const leg = group(THREE, g, 'gearleg', sx * w * 0.42, 0, sz * d * 0.36);
      put(THREE, leg, K.cyl(w * 0.035, w * 0.03, drop, 6), K.trim, sx * drop * 0.18, -drop * 0.5, sz * drop * 0.12, sz * 0.2, 0, -sx * 0.28);
      put(THREE, leg, K.sph(w * 0.05, 8), K.rubber, sx * drop * 0.36, -drop, sz * drop * 0.24);
    }
    return drop;
  }
  if (kind === 'tricycle') {
    for (const [x, z] of [[0, d * 0.42], [-w * 0.38, -d * 0.28], [w * 0.38, -d * 0.28]]) {
      put(THREE, g, K.cyl(w * 0.03, w * 0.03, drop, 6), K.trim, x, -drop * 0.5, z);
      put(THREE, g, K.cyl(drop * 0.2, drop * 0.2, w * 0.06, 10), K.rubber, x, -drop, z, 0, 0, Math.PI / 2);
    }
    return drop;
  }
  for (const sx of [-1, 1]) {                                   // skid rails
    put(THREE, g, K.box(w * 0.06, w * 0.05, d * 1.05), K.trim, sx * w * 0.4, -drop, 0, 0, 0, 0, 'skid');
    for (const sz of [-1, 1]) put(THREE, g, K.cyl(w * 0.03, w * 0.03, drop, 6), K.second, sx * w * 0.4, -drop * 0.5, sz * d * 0.34, 0, 0, -sx * 0.16);
  }
  return drop;
}

/* ---------- multirotor ---------- */
export function buildRotor(THREE, K, spec, rig) {
  const L = spec.locomotion;
  const g = group(THREE, null, 'drive_rotor');
  const w = spec.torso.width, d = spec.torso.depth;
  const r = L.rotorRadius;
  // discs must not overlap: for n rotors on a circle of radius R the gap between
  // neighbours is 2R·sin(π/n), so R has to clear the disc radius by that factor
  const minSep = (r * 1.12) / Math.sin(Math.PI / L.rotors);
  const boom = Math.max(L.boom, w * 0.55 + r * 0.9, minSep);

  const deck = group(THREE, g, 'rotor_deck', 0, spec.torso.height * 0.28, 0);
  put(THREE, deck, K.box(w * 0.9, w * 0.1, d * 0.9), K.second, 0, 0, 0, 0, 0, 0, 'rotor_plate');

  for (let i = 0; i < L.rotors; i++) {
    const a = (i / L.rotors) * TAU + Math.PI / L.rotors;
    const px = Math.cos(a) * boom, pz = Math.sin(a) * boom;
    const arm = group(THREE, deck, 'boom' + i, 0, 0, 0);
    // boom out to the hub, raked up or down so the discs clear the body
    const len = Math.hypot(px, pz);
    const armMesh = put(THREE, arm, K.box(w * 0.07, w * 0.06, len), K.second, px * 0.5, L.boomRake * len * 0.5, pz * 0.5, 0, Math.atan2(px, pz), 0, 'boom_arm' + i);
    armMesh.rotation.x = -Math.atan2(L.boomRake * len, len);
    const nac = group(THREE, arm, 'nacelle' + i, px, L.boomRake * len, pz);
    if (L.tilt) rig.tilts.push({ node: nac, phase: i * 0.7 });
    rotorAssembly(THREE, K, spec, rig, nac, r, 'rotor' + i, i % 2 ? 1 : -1, L.ducted, L.guard);
    if (L.coaxial) {
      const lower = group(THREE, nac, 'coax' + i, 0, -r * 0.28, 0);
      rotorAssembly(THREE, K, spec, rig, lower, r * 0.92, 'rotor' + i + 'b', i % 2 ? -1 : 1, false, false);
    }
    if (L.navLights) navLight(THREE, K, rig, nac, 0, -r * 0.12, 0, i === 0 ? '#8fe36a' : i === 1 ? '#ff3b30' : '#ffffff', 'nav' + i);
    if (L.foldable) put(THREE, arm, K.cyl(w * 0.05, w * 0.05, w * 0.09, 8), K.trim, px * 0.16, L.boomRake * len * 0.16, pz * 0.16, 0, 0, Math.PI / 2, 'fold_hinge' + i);
  }

  // gear hangs off the underside of the pod; everything else is built around the
  // pod centre, so the drive node can be dropped straight onto the torso origin
  const hy = spec.torso.height * 0.5;
  const gear = group(THREE, g, 'gear', 0, -hy, 0);
  const drop = skidGear(THREE, K, spec, rig, gear, w, d, L.gearDrop, L.gear);
  collide(rig, deck, [w * 0.5, w * 0.1, d * 0.5], null, 'deck', 'drive');
  return { node: g, drop: hy + (drop || w * 0.08) };
}

/* ---------- fixed wing ---------- */
export function buildPlane(THREE, K, spec, rig) {
  const L = spec.locomotion;
  const g = group(THREE, null, 'drive_wing');
  const w = spec.torso.width, d = spec.torso.depth;
  const half = L.span * 0.5;
  // a wing has to read as a wing: too thin a chord and the model looks like a rod
  const chord = Math.max(L.chord, w * 0.85);
  const finH = Math.max(w * 0.55, half * 0.2);        // tail height, not half the span
  const wingMat = K.second, skin = K.base;

  /* nose and tail boom grow out of the fuselage the torso already made */
  put(THREE, g, K.cone(w * 0.42, d * 0.28, 10), skin, 0, 0, d * 0.62, Math.PI / 2, 0, 0, 'nose');
  const tailZ = -d * (L.tail === 'twin' ? 0.42 : 0.62);
  if (L.tail !== 'none') put(THREE, g, K.cyl(w * 0.12, w * 0.2, d * 0.5, 8), skin, 0, 0, -d * 0.55, Math.PI / 2, 0, 0, 'tailboom');

  /* wing — one panel per side, swept or angled to taste */
  const sweep = L.wing === 'swept' ? 0.42 : L.wing === 'delta' ? 0.75 : L.wing === 'canard' ? 0.18 : 0.06;
  const rootChord = chord * (L.wing === 'delta' || L.wing === 'blended' ? 1.9 : 1.15);
  if (L.wing === 'blended') put(THREE, g, K.box(w * 1.5, w * 0.34, rootChord * 1.1), skin, 0, -w * 0.05, d * 0.02, 0, 0, 0, 'wing_root_fairing');
  for (const sx of [-1, 1]) {
    const wing = group(THREE, g, sx < 0 ? 'wingL' : 'wingR', sx * w * 0.42, w * 0.05, d * 0.02);
    wing.rotation.z = -sx * L.dihedral;
    wing.rotation.y = sx * sweep * 0.5;
    const panel = put(THREE, wing, K.box(half, w * 0.09, chord), wingMat, sx * half * 0.5, 0, -sweep * half * 0.22, 0, 0, 0, 'wing_panel');
    if (L.wing === 'delta') panel.scale.set(1, 1, 1.25);
    put(THREE, wing, K.box(half * 0.98, w * 0.03, chord * 0.24), K.trim, sx * half * 0.52, w * 0.03, -sweep * half * 0.22 - chord * 0.42, 0, 0, 0, 'wing_leading');
    // aileron
    const ail = group(THREE, wing, 'aileron', sx * half * 0.74, 0, -sweep * half * 0.22 + chord * 0.42);
    put(THREE, ail, K.box(half * 0.34, w * 0.05, chord * 0.26), K.trim, 0, 0, chord * 0.12, 0, 0, 0, 'aileron_face');
    rig.surfaces.push({ node: ail, axis: 'x', gain: sx, range: 0.28 });
    if (L.winglets) put(THREE, wing, K.box(w * 0.05, w * 0.3, chord * 0.6), wingMat, sx * half, w * 0.16, -sweep * half * 0.22, 0, 0, sx * 0.12, 'winglet');
    if (L.navLights) navLight(THREE, K, rig, wing, sx * half * 1.0, w * 0.02, -sweep * half * 0.22, sx < 0 ? '#ff3b30' : '#8fe36a', 'navtip');
    rig.wings.push({ node: wing, side: sx < 0 ? 'L' : 'R', span: half, chord });
    collide(rig, wing, [half * 0.5, w * 0.08, chord * 0.6], { x: sx * half * 0.5, y: 0, z: 0 }, sx < 0 ? 'wingL' : 'wingR', 'wing');
  }
  if (L.wing === 'canard') for (const sx of [-1, 1]) {
    const c = group(THREE, g, 'canard', sx * w * 0.36, w * 0.14, d * 0.46);
    put(THREE, c, K.box(half * 0.34, w * 0.06, chord * 0.5), wingMat, sx * half * 0.17, 0, 0, 0, 0, 0, 'canard_panel');
    rig.surfaces.push({ node: c, axis: 'x', gain: 1, range: 0.2 });
  }

  /* tail group */
  if (L.tail === 'v') {
    for (const sx of [-1, 1]) {
      const f = group(THREE, g, 'vtail', sx * w * 0.12, w * 0.05, tailZ);
      f.rotation.z = -sx * 0.62;
      put(THREE, f, K.box(w * 0.05, finH, chord * 0.72), wingMat, 0, finH * 0.5, 0, 0, 0, 0, 'vtail_panel');
      const rud = group(THREE, f, 'ruddervator', 0, finH * 0.72, chord * 0.3);
      put(THREE, rud, K.box(w * 0.045, finH * 0.7, chord * 0.24), K.trim, 0, 0, chord * 0.1);
      rig.surfaces.push({ node: rud, axis: 'x', gain: sx, range: 0.24 });
    }
  } else if (L.tail === 'twin') {
    for (const sx of [-1, 1]) {
      const boom = group(THREE, g, 'tailboom', sx * half * 0.42, w * 0.05, 0);
      put(THREE, boom, K.cyl(w * 0.06, w * 0.06, d * 0.9, 8), K.second, 0, 0, -d * 0.42, Math.PI / 2, 0, 0, 'boom');
      put(THREE, boom, K.box(w * 0.05, finH * 0.9, chord * 0.6), wingMat, 0, finH * 0.45, -d * 0.82, 0, 0, 0, 'fin');
      const rud = group(THREE, boom, 'rudder', 0, finH * 0.45, -d * 0.82 + chord * 0.3);
      put(THREE, rud, K.box(w * 0.045, finH * 0.8, chord * 0.2), K.trim, 0, 0, chord * 0.08);
      rig.surfaces.push({ node: rud, axis: 'y', gain: 1, range: 0.22 });
    }
    put(THREE, g, K.box(half * 0.9, w * 0.06, chord * 0.6), wingMat, 0, finH * 0.9, -d * 0.86, 0, 0, 0, 'tailplane');
  } else if (L.tail === 'conventional') {
    put(THREE, g, K.box(half * 0.62, w * 0.06, chord * 0.62), wingMat, 0, w * 0.06, tailZ, 0, 0, 0, 'tailplane');
    const elev = group(THREE, g, 'elevator', 0, w * 0.06, tailZ + chord * 0.34);
    put(THREE, elev, K.box(half * 0.6, w * 0.05, chord * 0.24), K.trim, 0, 0, chord * 0.1);
    rig.surfaces.push({ node: elev, axis: 'x', gain: 1, range: 0.26 });
    put(THREE, g, K.box(w * 0.05, finH, chord * 0.7), wingMat, 0, finH * 0.5 + w * 0.06, tailZ, 0, 0, 0, 'fin');
    const rud = group(THREE, g, 'rudder', 0, finH * 0.7, tailZ + chord * 0.34);
    put(THREE, rud, K.box(w * 0.045, finH * 0.75, chord * 0.22), K.trim, 0, 0, chord * 0.08);
    rig.surfaces.push({ node: rud, axis: 'y', gain: 1, range: 0.22 });
  }

  /* propulsion */
  const propZ = L.pusher ? -d * 0.78 : d * 0.78;
  const rr = Math.min(Math.max(w * 0.55, half * 0.16), w * 0.95);
  if (L.propulsion === 'jet') {
    for (let i = 0; i < L.motors; i++) {
      const sx = L.motors === 1 ? 0 : (i ? 1 : -1);
      const pod = group(THREE, g, 'jetpod' + i, sx * half * 0.34, -w * 0.12, -d * 0.1);
      put(THREE, pod, K.cyl(w * 0.2, w * 0.22, d * 0.6, 12, true), K.second, 0, 0, 0, Math.PI / 2, 0, 0, 'nacelle');
      put(THREE, pod, K.cyl(w * 0.17, w * 0.17, d * 0.05, 12), K.dark, 0, 0, d * 0.28, Math.PI / 2, 0, 0, 'intake');
      const plume = put(THREE, pod, K.cone(w * 0.15, d * 0.4, 10), K.mat('jetplume', L.plumeColor, {
        emissive: L.plumeColor, emissiveIntensity: 1.5, transparent: true, opacity: 0.42
      }), 0, 0, -d * 0.48, Math.PI / 2, 0, 0, 'plume');
      rig.plumes.push(plume);
    }
  } else {
    for (let i = 0; i < L.motors; i++) {
      const sx = L.motors === 1 ? 0 : (i ? 1 : -1);
      const mount = group(THREE, g, 'propmount' + i, sx * half * 0.32, L.motors === 1 ? 0 : -w * 0.02, L.motors === 1 ? propZ : d * 0.12);
      put(THREE, mount, K.cyl(w * 0.16, w * 0.13, w * 0.3, 10), K.second, 0, 0, 0, Math.PI / 2, 0, 0, 'motor');
      const spin = group(THREE, mount, 'prop' + i, 0, 0, (L.pusher && L.motors === 1 ? -1 : 1) * w * 0.2);
      put(THREE, spin, K.cone(w * 0.09, w * 0.16, 8), K.trim, 0, 0, w * 0.04, Math.PI / 2, 0, 0, 'spinner');
      for (let b = 0; b < 2; b++) put(THREE, spin, K.box(rr * 1.7, rr * 0.14, w * 0.03), K.dark, 0, 0, 0, 0, 0, b * Math.PI / 2, 'prop_blade' + b);
      const disc = put(THREE, spin, K.cyl(rr * 0.85, rr * 0.85, w * 0.01, 18), K.mat('propdisc', spec.palette.accent, {
        emissive: spec.palette.accent, emissiveIntensity: 0.3, transparent: true, opacity: 0.0, roughness: 0.6
      }), 0, 0, w * 0.01, Math.PI / 2, 0, 0, 'prop_disc');
      rig.rotors.push({ node: spin, disc, radius: rr * 0.85, dir: i % 2 ? -1 : 1, rate: 56, axis: 'z' });
      if (L.ducted) put(THREE, mount, K.cyl(rr * 0.95, rr * 0.95, w * 0.42, 14, true), K.second, 0, 0, w * 0.16, Math.PI / 2, 0, 0, 'prop_duct');
    }
  }

  /* VTOL lift rotors on the wing, so it can take off without a runway */
  if (L.vtol) {
    const n = L.liftRotors || 4;
    for (let i = 0; i < n; i++) {
      const sx = i % 2 ? 1 : -1, fwd = i < 2 ? 1 : -1;
      const nac = group(THREE, g, 'lift' + i, sx * half * 0.5, w * 0.02, fwd * d * 0.34);
      put(THREE, nac, K.box(w * 0.12, w * 0.1, d * 0.3), K.second, 0, 0, 0, 0, 0, 0, 'lift_nacelle');
      rotorAssembly(THREE, K, spec, rig, nac, Math.min(Math.max(w * 0.42, half * 0.14), w * 0.8), 'lift' + i, i % 2 ? 1 : -1, L.ducted, false);
    }
  }

  /* chin sensor ball — the thing a scout plane actually looks through */
  if (L.sensorBall) {
    const ball = group(THREE, g, 'sensor_ball', 0, -w * 0.34, d * 0.42);
    put(THREE, ball, K.sph(w * 0.24, 12), K.second, 0, 0, 0, 0, 0, 0, 'ball_shell');
    const eye = group(THREE, ball, 'ball_eye', 0, 0, 0);
    rig.lamps.push(put(THREE, eye, K.cyl(w * 0.13, w * 0.13, w * 0.06, 12), K.glow(spec.head.optics.color, 1.1), 0, -w * 0.02, w * 0.2, Math.PI / 2, 0, 0, 'ball_lens'));
    rig.spinners.push({ node: eye, rate: 0.6 });
    collide(rig, ball, [w * 0.25, w * 0.25, w * 0.25], null, 'sensorball', 'sensor');
  }
  if (L.chute) put(THREE, g, K.cyl(w * 0.2, w * 0.2, w * 0.3, 10), K.trim, 0, w * 0.3, -d * 0.3, 0, 0, 0, 'chute_can');
  if (L.navLights) navLight(THREE, K, rig, g, 0, w * 0.28, tailZ, '#ffffff', 'nav_tail');

  const hy = spec.torso.height * 0.5;
  const gear = group(THREE, g, 'gear', 0, -hy, 0);
  const drop = skidGear(THREE, K, spec, rig, gear, Math.max(w, half * 0.5), d, L.gearDrop, L.gear);
  return { node: g, drop: hy + (drop || w * 0.12) };
}

/* ---------- flight animation ----------
   Called from animateRobot for rotor and plane drives: spin the discs, ride the
   air, and deflect the surfaces the way the bank asks them to. */
export function animateFlight(rig, t, dt, g, prof, L) {
  const idle = 0.12;
  const spool = Math.max(idle, g);
  for (const r of rig.rotors) {
    const rate = r.rate * spool * r.dir;
    if (r.axis === 'z') r.node.rotation.z += dt * rate;
    else r.node.rotation.y += dt * rate;
    if (r.disc && r.disc.material) r.disc.material.opacity = Math.min(0.32, spool * 0.3);
  }
  for (const ti of rig.tilts) ti.node.rotation.x = -g * 0.35 + Math.sin(t * 0.8 + ti.phase) * 0.04;

  const flight = rig.flightHeight || 0;
  const bob = Math.sin(t * 1.9 * prof.freq) * flight * 0.06 * prof.sway;
  const bank = Math.sin(t * 0.42) * 0.16 * g;
  const pitch = -g * 0.10 + Math.sin(t * 0.63) * 0.03;
  if (rig.body) {
    if (rig.body.userData.baseY === undefined) rig.body.userData.baseY = rig.body.position.y;
    rig.altitude = flight * g;
    rig.body.position.y = rig.body.userData.baseY + rig.altitude + bob * g;
    rig.body.rotation.z = bank;
    rig.body.rotation.x = L.type === 'plane' ? pitch : -g * 0.16 + Math.sin(t * 0.7) * 0.02;
    rig.body.rotation.y = Math.sin(t * 0.23) * 0.12 * g;
  }
  for (const s of rig.surfaces) {
    const d = (s.axis === 'x' ? bank * s.gain * 1.6 : bank * 0.8) + Math.sin(t * 1.3 + s.gain) * 0.05 * g;
    s.node.rotation[s.axis] = Math.max(-s.range, Math.min(s.range, d));
  }
  for (const w of rig.wings) w.node.rotation.x = Math.sin(t * 1.7 + (w.side === 'L' ? 0 : 1)) * 0.012 * g;
}
