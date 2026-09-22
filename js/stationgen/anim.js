/* Animation registry. collectInto(reg, root) indexes every marker the
 * builder wrote into userData; tick(reg, dt, t) drives them:
 *
 *   spin     { axis, speed }                        rings, drums, radar bars, radomes
 *   gimbal   { amp, speed }                         dishes, turrets, solar yokes
 *   pulse    { speed, amp, phase }                  radiator glow, reactor throat
 *   door     { axis, base, amp, speed, phase }      bay door leaves drifting
 *   lamp     { mode, period, phase, base, color }   a single beacon mesh: steady | blink | double | strobe | pulse
 *   lamps    { items: [{ color, mode, period, phase, base }] }  the same, as one instanced batch (the builder's default)
 *   chase    { items, beads, inCol, outCol, speed } instanced lane beads: a runner per way,
 *                                                   inward on entry ways, outward on exit ways
 *   traffic  { way, phase, period, y } | { axis, amp, speed, phase }
 *                                                   shuttles running the ways; cranes on rails
 *   turret   { amp, speed, phase }                  gun mounts: traverse and elevate together
 *   drone    { x, y, z0, reach, r, period, phase }  drones: out of the tube, a sortie loop, back in
 *   shield   { phase, base }                        shield petals and the station shell: opacity breathes
 *
 * ---- brightness ----------------------------------------------------------
 *
 * `tick` takes a LIGHT LEVEL `k` (0..1) that scales everything emissive:
 * gate lamps, roof floods, chase beads, lane strips, the mouth glow. The
 * engine drives it off range, so a port's lighting reads exactly as it did
 * when you are on the approach and is gone from a hundred kilometres out.
 *
 * It exists because the old arrangement had three separate faults that all
 * pushed the same way, and the result was a wall of white dots readable from
 * four thousand kilometres:
 *
 *   - lamp batches were baked at FULL brightness at build time and only
 *     animated inside 45 km, so past that every lamp sat pinned at 100 % and
 *     never blinked — brighter far away than close up;
 *   - chase beads carried no build-time colour at all, so until the animation
 *     first ran they rendered as raw `mats.bead`: pure white, `toneMapped:
 *     false`, the brightest value the renderer can produce;
 *   - and nothing anywhere attenuated any of it with distance.
 *
 * `bake(reg)` fixes the first two by writing the dim state into the instance
 * colours as soon as the station is built, and `k` fixes the third.
 */
import * as THREE from "three";

export function newRegistry() { return { spins: [], gimbals: [], pulses: [], doors: [], lamps: [], lampBatches: [], chases: [], traffic: [], turrets: [], drones: [], shields: [], emis: [], dark: false, level: 1 }; }

export function collectInto(reg, root) {
  for (const k of Object.keys(reg)) if (Array.isArray(reg[k])) reg[k].length = 0;
  reg.dark = false;
  reg.level = 1;
  /* Every emissive material this station owns, with the brightness it was
   * authored at. The builder makes a fresh material set per station, so
   * scaling these dims one port without touching any other — which is what
   * makes a range falloff possible at all. Deduped: one material is shared by
   * many meshes of the same hull. */
  const seen = new Set();
  root.traverse((o) => {
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) {
      if (!m || seen.has(m)) continue;
      seen.add(m);
      if (m.emissive && m.emissiveIntensity > 0) reg.emis.push({ m, base: m.emissiveIntensity });
    }
  });
  root.traverse((o) => {
    const d = o.userData;
    if (!d) return;
    if (d.spin) reg.spins.push(o);
    if (d.gimbal) { d.gimbal.baseX = o.rotation.x; d.gimbal.baseY = o.rotation.y; reg.gimbals.push(o); }
    if (d.pulse) { if (o.material && !o.material.userData.cloned) { o.material = o.material.clone(); o.material.userData.cloned = true; } d.pulse.base = o.material?.emissiveIntensity ?? 1; reg.pulses.push(o); }
    if (d.door) reg.doors.push(o);
    if (d.lamp) { if (o.material && !o.material.userData.cloned) { o.material = o.material.clone(); o.material.userData.cloned = true; } reg.lamps.push(o); }
    if (d.chase) reg.chases.push(o);
    if (d.lamps) reg.lampBatches.push(o);
    if (d.traffic) { d.traffic.base = o.position.clone(); reg.traffic.push(o); }
    if (d.turret) { d.turret.baseX = o.rotation.x; d.turret.baseY = o.rotation.y; reg.turrets.push(o); }
    if (d.drone) reg.drones.push(o);
    if (d.shield) { if (o.material && !o.material.userData.cloned) { o.material = o.material.clone(); o.material.userData.cloned = true; } reg.shields.push(o); }
  });
  return reg;
}

const _c = new THREE.Color();

/**
 * Write the resting state of every instanced light into its instance colour.
 * Called once when a station is built, so a port that has never been close
 * enough to animate is dark rather than blazing.
 */
export function bake(reg) {
  for (const im of reg.lampBatches) {
    const items = im.userData.lamps.items;
    for (let i = 0; i < items.length; i++) { _c.copy(items[i].color).multiplyScalar(0.06); im.setColorAt(i, _c); }
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }
  for (const im of reg.chases) {
    const c = im.userData.chase;
    for (let i = 0; i < c.items.length; i++) {
      _c.copy(c.items[i].entry ? c.inCol : c.outCol).multiplyScalar(c.dim);
      im.setColorAt(i, _c);
    }
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }
  return reg;
}

function lampK(l, t) {
  const ph = ((t + l.phase) % l.period) / l.period;
  if (l.mode === "blink") return ph < 0.12 ? 1 : 0.06;
  if (l.mode === "double") return ph < 0.08 || (ph > 0.16 && ph < 0.24) ? 1 : 0.06;
  if (l.mode === "strobe") return ph < 0.04 ? 1.6 : 0.03;
  if (l.mode === "pulse") return 0.55 + 0.45 * Math.sin(ph * Math.PI * 2);
  return 1;
}
/**
 * `k` is the light level, 0..1 — how brightly this station's own lighting
 * should read from where it is being looked at. At 0 the emissive work is
 * skipped entirely and every light is written black once, which is both the
 * correct picture and the cheap path for a port on the far side of the system.
 */
export function tick(reg, dt, t, k = 1) {
  const lit = k > 0.002;
  if (!lit && reg.dark) return;               // already dark and staying dark: nothing to write
  /* the authored brightness, scaled by range. Written once per level change
   * rather than every frame, because a material write is not free and the
   * level only moves when the camera does. */
  if (Math.abs(k - reg.level) > 0.004 || (!lit && !reg.dark)) {
    for (const e of reg.emis) e.m.emissiveIntensity = e.base * k;
    reg.level = k;
  }
  reg.dark = !lit;
  if (!lit) {
    /* write every instanced light out once, then stop: a port on the far side
     * of the system costs nothing per frame */
    for (const im of reg.lampBatches) {
      const items = im.userData.lamps.items;
      for (let i = 0; i < items.length; i++) { _c.setRGB(0, 0, 0); im.setColorAt(i, _c); }
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
    for (const im of reg.chases) {
      for (let i = 0; i < im.userData.chase.items.length; i++) { _c.setRGB(0, 0, 0); im.setColorAt(i, _c); }
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
    return;
  }
  for (const o of reg.spins) o.rotation[o.userData.spin.axis] += o.userData.spin.speed * dt;
  for (const o of reg.gimbals) { const g = o.userData.gimbal; o.rotation.x = g.baseX + Math.sin(t * g.speed) * g.amp; o.rotation.y = g.baseY + Math.cos(t * g.speed * 0.7) * g.amp; }
  /* pulses and single lamps own their material outright (collectInto clones
   * them), so these writes are the authority for those and carry `k` themselves */
  for (const o of reg.pulses) { const p = o.userData.pulse; if (o.material) o.material.emissiveIntensity = k * p.base * (1 + Math.sin(t * p.speed + p.phase) * p.amp); }
  for (const o of reg.doors) { const d = o.userData.door; o.position[d.axis] = d.base + d.sign * Math.max(0, Math.sin(t * d.speed + d.phase)) * d.amp; }
  for (const o of reg.lamps) { const l = o.userData.lamp; if (o.material) o.material.emissiveIntensity = k * l.base * lampK(l, t); }
  for (const im of reg.lampBatches) {
    const items = im.userData.lamps.items;
    for (let i = 0; i < items.length; i++) { const l = items[i]; _c.copy(l.color).multiplyScalar(k * (0.25 + 0.55 * l.base * lampK(l, t))); im.setColorAt(i, _c); }
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }
  for (const im of reg.chases) {
    const c = im.userData.chase;
    const n = c.beads;
    const run = ((t * c.speed) % 1 + 1) % 1;
    for (let i = 0; i < c.items.length; i++) {
      const it = c.items[i];
      /* runner index: outward on exit ways, inward on entry ways */
      const r = Math.floor(run * n);
      const idx = it.entry ? n - 1 - it.i : it.i;
      const behind = r - idx;
      const w = behind >= 0 && behind <= 3 ? 1 - behind / 4 : 0;
      const col = it.entry ? c.inCol : c.outCol;
      _c.copy(col).multiplyScalar(k * (c.dim + (1.6 - c.dim) * w));
      im.setColorAt(i, _c);
    }
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }
  for (const o of reg.turrets) {
    const g = o.userData.turret;
    const s = Math.sin(t * g.speed + g.phase);
    o.rotation.y = g.baseY + s * g.amp;
    o.rotation.x = g.baseX - Math.abs(Math.sin(t * g.speed * 0.6 + g.phase)) * g.amp * 0.5;
  }
  for (const o of reg.drones) {
    const d = o.userData.drone;
    const u = ((t / d.period + d.phase) % 1 + 1) % 1;
    if (u < 0.1) {                       /* launch: straight out of the tube */
      const k = u / 0.1;
      o.position.set(d.x, d.y, d.z0 + d.reach * k * k);
      o.rotation.set(0, 0, 0);
      o.visible = k > 0.05;
    } else if (u < 0.9) {                /* the sortie: a tilted loop out past the mouth */
      const k = (u - 0.1) / 0.8;
      const a = k * Math.PI * 2;
      const cx = d.x, cz = d.z0 + d.reach + d.r;
      o.position.set(cx + Math.sin(a) * d.r * 1.4, d.y + Math.sin(a * 2) * d.r * 0.25 * d.tilt, cz - Math.cos(a) * d.r);
      o.rotation.set(-Math.cos(a * 2) * 0.2 * d.tilt, Math.atan2(Math.cos(a) * 1.4, Math.sin(a)), Math.sin(a) * 0.4);
      o.visible = true;
    } else {                             /* recovery: back into the tube */
      const k = (u - 0.9) / 0.1;
      o.position.set(d.x, d.y, d.z0 + d.reach * (1 - k) * (1 - k));
      o.rotation.set(0, 0, 0);
      o.visible = k < 0.95;
    }
  }
  for (const o of reg.shields) {
    const s = o.userData.shield;
    if (o.material) o.material.opacity = k * s.base * (0.7 + 0.3 * Math.sin(t * 1.3 + s.phase)) * (0.85 + 0.15 * Math.sin(t * 7.1 + s.phase * 3));
  }
  for (const o of reg.traffic) {
    const tr = o.userData.traffic;
    if (tr.way) {
      const u = ((t / tr.period + tr.phase) % 1 + 1) % 1;
      /* ease in, dwell inside, ease out — in the way's direction of flow */
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const from = tr.way.entry ? tr.way.z0 : tr.way.z1, to = tr.way.entry ? tr.way.z1 : tr.way.z0;
      o.position.z = from + (to - from) * e;
      o.position.y = tr.y + Math.sin(u * Math.PI) * 2;
      o.position.x = tr.way.x + Math.sin(t * 0.9 + tr.phase * 6) * 1.2;
      o.rotation.y = tr.way.entry ? Math.PI : 0;
      o.visible = u > 0.02 && u < 0.98;
    } else {
      o.position[tr.axis] = tr.base[tr.axis] + Math.sin(t * tr.speed + tr.phase) * tr.amp;
    }
  }
}

/** Free the per-station clones the registry made. */
export function disposeAnim(root) {
  root.traverse((o) => { if (o.material?.userData?.cloned) o.material.dispose(); });
}
