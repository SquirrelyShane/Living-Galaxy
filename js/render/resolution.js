const RATIOS = [1, 1.25, 1.5, 2];
const capFor = dpr => Math.min(2, Math.max(0.5, Number(dpr) || 1));

export function createResolutionController(deviceRatio = 1) {
  let cap = capFor(deviceRatio), ratio = cap, pending = ratio, elapsed = 0;
  return {
    get ratio() { return ratio; },
    update(tier, dt, dpr = deviceRatio) {
      cap = capFor(dpr);
      if (ratio > cap) ratio = cap;
      const desired = Math.min(cap, RATIOS[Math.max(0, Math.min(3, Math.round(tier)))] ?? 2);
      if (desired !== pending) { pending = desired; elapsed = 0; }
      if (desired === ratio) { elapsed = 0; return ratio; }
      elapsed += Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.1)) : 0;
      const delay = desired < ratio ? 1 : 8;
      if (elapsed + 1e-9 >= delay) { ratio = desired; elapsed = 0; }
      return ratio;
    },
  };
}
