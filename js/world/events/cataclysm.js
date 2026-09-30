export function kelvinRGB(k) {
  const t = Math.max(1000, Math.min(20000, k)) / 100;
  let r, g, b;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const c = (v) => Math.max(0, Math.min(1, v / 255));
  return { r: c(r), g: c(g), b: c(b) };
}

export function kelvinHex(k) {
  const { r, g, b } = kelvinRGB(k);
  return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
}

function hash3(seed, i, j, k) {
  let h = (seed >>> 0) ^ 0x9e3779b9;
  h = Math.imul(h ^ (i + 8192), 2654435761) >>> 0;
  h = Math.imul(h ^ (j + 8192), 1597334677) >>> 0;
  h = Math.imul(h ^ (k + 8192), 2246822519) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t) => t * t * (3 - 2 * t);

export function dirNoise(seed, nx, ny, nz, freq = 6) {
  const x = nx * freq, y = ny * freq, z = nz * freq;
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const fx = smooth(x - xi), fy = smooth(y - yi), fz = smooth(z - zi);
  let acc = 0;
  for (let dz = 0; dz < 2; dz++) {
    const wz = dz ? fz : 1 - fz;
    for (let dy = 0; dy < 2; dy++) {
      const wy = dy ? fy : 1 - fy;
      for (let dx = 0; dx < 2; dx++) {
        const wx = dx ? fx : 1 - fx;
        acc += hash3(seed, xi + dx, yi + dy, zi + dz) * wx * wy * wz;
      }
    }
  }
  return acc - 0.5;
}

export function dirFbm(seed, nx, ny, nz, freq = 5) {
  return dirNoise(seed, nx, ny, nz, freq) + dirNoise(seed + 101, nx, ny, nz, freq * 2.3) * 0.45;
}

export const OUTCOME = {
  SCAR: "scar",
  BASIN: "basin",
  RESURFACE: "resurface",
  DISRUPT: "disrupt",
  SHATTER: "shatter",
};

export function outcomeOf(sev, integrityLeft = 1) {
  if (integrityLeft <= 0) return OUTCOME.SHATTER;
  if (sev >= 0.85) return OUTCOME.SHATTER;
  if (sev >= 0.42) return OUTCOME.DISRUPT;
  if (sev >= 0.18) return OUTCOME.RESURFACE;
  if (sev >= 0.05) return OUTCOME.BASIN;
  return OUTCOME.SCAR;
}

export function isCataclysmic(outcome) {
  return outcome === OUTCOME.RESURFACE || outcome === OUTCOME.DISRUPT || outcome === OUTCOME.SHATTER;
}

export const PHASES = [
  { id: "contact", dur: 0.4, k0: 15000, k1: 9000 },
  { id: "plume", dur: 5, k0: 9000, k1: 4200 },
  { id: "curtain", dur: 16, k0: 4200, k1: 2400 },
  { id: "magma", dur: 165, k0: 2000, k1: 1300 },
  { id: "crust", dur: 430, k0: 1300, k1: 800 },
  { id: "settle", dur: 1100, k0: 800, k1: 0 },
];

export function eventDuration(sev = 0.5) {
  const s = 0.75 + Math.min(1.4, sev) * 0.8;
  return PHASES.reduce((a, p) => a + p.dur * s, 0);
}

const lerp = (a, b, u) => a + (b - a) * u;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function cataclysmState(t, sev = 0.5) {
  const scale = 0.75 + Math.min(1.4, sev) * 0.8;
  let acc = 0;
  let phase = PHASES[PHASES.length - 1];
  let u = 1;
  for (const p of PHASES) {
    const d = p.dur * scale;
    if (t < acc + d) {
      phase = p;
      u = clamp01((t - acc) / d);
      break;
    }
    acc += d;
  }
  const total = eventDuration(sev);
  const g = clamp01(t / total);
  const kelvin = lerp(phase.k0, phase.k1, u);

  const attack = clamp01(t / (0.18 * scale));
  const rise = 1 - Math.pow(1 - attack, 5);
  const decay = Math.exp(-t / (26 * scale));
  const emberFloor = Math.max(0, 0.16 * (1 - g) * Math.min(1, sev * 2));
  const lum = clamp01(rise * (decay * (0.5 + Math.min(1, sev)) + emberFloor));

  const shellT = clamp01(t / (22 * scale));
  const shell = 1 - Math.pow(1 - shellT, 3);

  const settle = 1 - Math.exp(-t / (240 * scale));

  const molten = clamp01(Math.exp(-t / (210 * scale)) * Math.min(1, sev * 2.4));

  return { phase: phase.id, u, t, kelvin, lum, shell, settle, molten, done: t >= total };
}

export const SN_PHASES = [
  { id: "breakout", dur: 1.2, k0: 40000, k1: 16000 },
  { id: "rise", dur: 7, k0: 16000, k1: 8000 },
  { id: "plateau", dur: 66, k0: 6000, k1: 5200 },
  { id: "drop", dur: 20, k0: 5200, k1: 4000 },
  { id: "tail", dur: 240, k0: 4000, k1: 2600 },
];

export function supernovaDuration() {
  return SN_PHASES.reduce((a, p) => a + p.dur, 0);
}

export function supernovaState(t) {
  let acc = 0;
  let phase = SN_PHASES[SN_PHASES.length - 1];
  let u = 1;
  for (const p of SN_PHASES) {
    if (t < acc + p.dur) {
      phase = p;
      u = clamp01((t - acc) / p.dur);
      break;
    }
    acc += p.dur;
  }
  const kelvin = lerp(phase.k0, phase.k1, u);

  let lum;
  if (phase.id === "breakout") lum = 1 - Math.pow(1 - clamp01(t / 0.35), 4);
  else if (phase.id === "rise") lum = lerp(0.98, 0.86, u);
  else if (phase.id === "plateau") lum = lerp(0.86, 0.8, u);
  else if (phase.id === "drop") lum = lerp(0.8, 0.22, u * u);
  else lum = 0.22 * Math.exp(-(t - (SN_PHASES[0].dur + SN_PHASES[1].dur + SN_PHASES[2].dur + SN_PHASES[3].dur)) / 90);

  const shell = t * 0.9;
  const pulse = (t * 0.55) % 1;
  return { phase: phase.id, u, t, kelvin, lum: clamp01(lum), shell, pulse, done: t >= supernovaDuration() };
}

export function rocheLimit(bodyRadius, densityRatio = 1) {
  return 2.44 * bodyRadius * Math.cbrt(densityRatio);
}

export function ringPlan(bodyRadius, sev, shattered = false) {
  const roche = rocheLimit(bodyRadius);
  const s = Math.min(1.4, Math.max(0, sev));
  const inner = bodyRadius * (shattered ? 1.5 : 1.25);
  const outer = Math.max(inner * 1.35, roche * (0.72 + s * 0.5));
  const count = Math.round(shattered ? 150 : 30 + s * 150);
  const moonlets = outer > roche ? Math.min(3, Math.floor(s * 2.2)) : 0;
  return { inner, outer, roche, count, moonlets, tilt: 0.28 + s * 0.5 };
}

export function relaxCraters(body, dt, molten) {
  const craters = body.craters;
  if (!craters?.length || molten <= 0.01) return false;
  const k = Math.pow(0.5, (dt * molten) / 40);
  let changed = false;
  for (const c of craters) {
    const floor = Math.min(0.09, (c.depth0 ?? c.depth) * 0.35);
    if (c.depth > floor + 1e-4) {
      c.depth = floor + (c.depth - floor) * k;
      c.r = Math.min(body.radius * 0.62, c.r * (1 + (1 - k) * 0.5));
      c.rough = (c.rough ?? 1) * k;
      changed = true;
    }
  }
  return changed;
}

export function glowFalloff(dist, ref) {
  const d = Math.max(1, dist / Math.max(1, ref));
  return 1 / (d * d);
}

export function apparentGlow(lum, radius, dist) {
  return Math.max(0, Math.min(1, lum * glowFalloff(dist, radius * 9)));
}
