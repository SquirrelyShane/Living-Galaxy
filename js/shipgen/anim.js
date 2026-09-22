/* Animation registry shared by the yard and the traffic demo.
 * collectInto(reg, root) indexes everything a built ship animates; tick(reg, dt, t, ctx) drives it.
 * ctx: { throttle 0–1, aim: world Vector3 | null (turrets slew onto it), aimAngles(o, target) } */
export function newRegistry() { return { plumes: [], spins: [], pulses: [], gimbals: [], coils: [], lamps: [], scans: [], patrols: [] }; }

export function collectInto(reg, root) {
  for (const k of Object.keys(reg)) reg[k].length = 0;
  root.traverse((o) => {
    const d = o.userData;
    if (!d) return;
    if (d.plume) { d.plume.baseY = o.scale.y; d.plume.baseX = o.scale.x; reg.plumes.push(o); }
    if (d.spin) reg.spins.push(o);
    if (d.pulse) {
      d.pulse.baseScale = o.scale.clone();
      o.material = o.material.clone();
      o.material.userData.cloned = true;
      d.pulse.baseEmissive = o.material.emissiveIntensity || 1;
      reg.pulses.push(o);
    }
    if (d.gimbal) reg.gimbals.push(o);
    if (d.coil) reg.coils.push(o);
    if (d.lamp) reg.lamps.push(o);
    if (d.scan) { d.scan.baseX = o.rotation.x; reg.scans.push(o); }
    if (d.patrol) { d.patrol.base = o.position[d.patrol.axis]; reg.patrols.push(o); }
  });
  return reg;
}

export function disposeShip(obj) {
  obj.traverse((o) => { if (o.isMesh && o.material && o.material.userData && o.material.userData.cloned) o.material.dispose(); });
}

const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function tick(reg, dt, t, ctx = {}) {
  const thrN = ctx.throttle ?? 0.6, thrLen = 0.04 + 0.96 * thrN;
  for (const o of reg.plumes) {
    const d = o.userData.plume;
    let f;
    if (d.type === "ion" || d.type === "hall" || d.type === "micro") f = 1 + Math.sin(t * 2.2 + o.id) * 0.05;
    else if (d.type === "pulse") f = 0.55 + Math.abs(Math.sin(t * 7 + o.id)) * 0.8;
    else if (d.type === "antimatter") f = 1 + Math.sin(t * 17 + o.id) * 0.09;
    else if (d.type === "plasma") f = 1 + Math.sin(t * 13 + o.id) * 0.14;
    else f = 1 + Math.sin(t * 11 + o.id) * d.amp + Math.sin(t * 37 + o.id * 1.7) * d.amp * 0.4;
    if (d.layer === "disc") { const s = d.baseX * (0.6 + 0.4 * thrN) * (1 + Math.sin(t * 21 + o.id) * 0.08); o.scale.x = o.scale.y = s; o.material.opacity = d.op * (0.2 + 0.8 * thrN); continue; }
    if (d.layer === "diamond") {
      o.position.z = d.baseZ + d.len * thrLen * d.frac * f;
      const s = 0.5 + 0.5 * Math.sin(t * 30 + o.id); o.scale.x = d.baseX * (0.7 + 0.5 * s) * thrN; o.scale.y = d.baseX * (0.7 + 0.5 * s) * thrN;
      o.material.opacity = d.op * thrN * (0.4 + 0.6 * s); continue;
    }
    const core = d.layer === "core";
    o.scale.y = d.baseY * f * thrLen * (core ? (0.9 + Math.sin(t * 43 + o.id) * 0.1) : 1);
    o.scale.x = o.scale.z = d.baseX * (core ? (0.6 + 0.4 * thrN) : (0.5 + 0.5 * thrN)) * (1 + Math.sin(t * 19 + o.id) * 0.06);
    o.material.opacity = d.op * (0.72 + Math.sin(t * 9 + o.id) * 0.28) * (core ? thrN : (0.15 + 0.85 * thrN));
  }
  for (const o of reg.spins) { const s = o.userData.spin; o.rotation[s.axis] += s.speed * (s.boost || 1) * dt; }
  for (const o of reg.patrols) { const p = o.userData.patrol; o.position[p.axis] = p.base + Math.sin(t * p.speed + p.phase) * p.amp; }
  for (const o of reg.pulses) {
    const p = o.userData.pulse;
    const f = 1 + Math.sin(t * p.speed + (p.phase || 0)) * p.amp;
    o.scale.set(p.baseScale.x * f, p.baseScale.y * f, p.baseScale.z);
    o.material.emissiveIntensity = (p.baseEmissive || 1) * (1.4 + Math.sin(t * p.speed + (p.phase || 0)) * 0.9);
  }
  for (const o of reg.gimbals) { o.rotation.x = Math.sin(t * 0.7) * o.userData.gimbal.amp; o.rotation.y = Math.cos(t * 0.5) * o.userData.gimbal.amp; }
  /* turret + sensor sweep: idle patrol arc, or slew onto the aim point */
  for (const o of reg.scans) {
    const d = o.userData.scan;
    let ty, tx, k;
    if (ctx.aim && o.userData.turret && ctx.aimAngles) { [ty, tx] = ctx.aimAngles(o, ctx.aim); k = Math.min(1, dt * 7); }
    else {
      ty = d.spin ? d.base + t * d.yawSpeed * 1.6 : d.base + Math.sin(t * d.yawSpeed + d.phase) * d.yawAmp;
      tx = (d.baseX || 0) + Math.sin(t * d.pitchSpeed + d.phase * 0.7) * d.pitchAmp;
      k = Math.min(1, dt * (d.spin ? 12 : 3));
    }
    o.rotation.y += wrapAngle(ty - o.rotation.y) * k;
    o.rotation.x += wrapAngle(tx - o.rotation.x) * k;
  }
  /* cosmetic lamps — steady, breathing, blinking, strobing, chasing */
  for (const o of reg.lamps) {
    const d = o.userData.lamp;
    const tt = ((t / d.period) + d.phase) % 1;
    let k;
    switch (d.mode) {
      case "pulse":  k = 0.40 + 0.60 * (0.5 + 0.5 * Math.sin(tt * Math.PI * 2)); break;
      case "blink":  k = tt < d.duty ? 1 : 0.05; break;
      case "strobe": k = tt < 0.07 ? 1.6 : 0.03; break;
      case "double": k = (tt < 0.05 || (tt > 0.13 && tt < 0.18)) ? 1.7 : 0.03; break;
      case "chase":  k = (Math.floor(tt * d.count) === d.i) ? 1.5 : 0.06; break;
      default:       k = 1;
    }
    o.material.emissiveIntensity = d.base * k;
  }
}
