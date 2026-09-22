/* LIVING GALAXY — cataclysm.
 *
 * What a world actually does when something big enough hits it, and what a
 * star does when it stops being one. Everything here is pure maths on plain
 * numbers so the tests can run it headless; the renderer reads these curves
 * and draws them.
 *
 * The physics it is modelled on (compressed, but the SHAPE is real):
 *
 *   Contact/jetting  — seconds. Shock-melted spray, 10,000–15,000 K,
 *                      blue-white. The brightest moment of the whole event.
 *   Vapour plume     — minutes–hours. ~7,800 K rock vapour balloons out,
 *                      opaque then optically thin, white going yellow.
 *   Ejecta curtain   — minutes–hours. Ballistic fan, not a uniform shell.
 *                      Some falls back, some orbits, some leaves.
 *   Magma ocean      — the body is not a sphere any more and it is glowing.
 *                      1,300–2,000 K, orange. Craters SLUMP while it is
 *                      molten — this is why a hit world must not stay spiky.
 *   Crust            — 800–1,300 K, cherry red, fading to nothing.
 *   Settle           — the debris torus is thick and clumpy on crossing
 *                      orbits; inelastic collisions damp out-of-plane motion
 *                      far faster than radial, so it flattens to a thin
 *                      equatorial ring long before it circularises.
 *
 * Inside the Roche limit tides beat self-gravity and material stays a ring.
 * Outside it, the same debris accretes into moonlets. One event gives both.
 */

/* ---- blackbody ----------------------------------------------------------
 * A single temperature scalar drives every glow colour in the game, so a
 * cooling body walks blue-white → white → yellow → orange → red → dark for
 * free instead of hand-authored colour keys. */

/** Kelvin → linear RGB (0..1). Helland's fit, clamped to a usable range. */
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

/** Kelvin → 0xRRGGBB, for three.js material colours. */
export function kelvinHex(k) {
  const { r, g, b } = kelvinRGB(k);
  return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
}

/* ---- smooth direction noise ---------------------------------------------
 * The old surface jag hashed each vertex independently, so neighbouring
 * vertices got uncorrelated values and every damaged world grew a coat of
 * spikes. This is lattice value noise on the direction vector with a
 * smoothstep blend: neighbouring directions get NEIGHBOURING values, so a
 * crater rim is rough, not hairy. Seam-safe because it is a function of the
 * unit normal only — duplicated UV-seam vertices sit at the same direction
 * and therefore get the same displacement.
 */

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

/** Value noise in [-0.5, 0.5] over a direction, at `freq` cells per unit. */
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

/** Two octaves, still smooth — used for crater rims and shattered cores. */
export function dirFbm(seed, nx, ny, nz, freq = 5) {
  return dirNoise(seed, nx, ny, nz, freq) + dirNoise(seed + 101, nx, ny, nz, freq * 2.3) * 0.45;
}

/* ---- what a strike does -------------------------------------------------- */

export const OUTCOME = {
  SCAR: "scar",             // a mark, nothing structural
  BASIN: "basin",           // a real crater, ejecta, a bruise on the limb
  RESURFACE: "resurface",   // magma ocean, atmosphere stripped, the world glows
  DISRUPT: "disrupt",       // partly torn away — a debris ring, a smaller world
  SHATTER: "shatter",       // it stops being a world
};

/** Severity (see impactSeverity) → what actually happens to the body. */
export function outcomeOf(sev, integrityLeft = 1) {
  if (integrityLeft <= 0) return OUTCOME.SHATTER;
  if (sev >= 0.85) return OUTCOME.SHATTER;
  if (sev >= 0.42) return OUTCOME.DISRUPT;
  if (sev >= 0.18) return OUTCOME.RESURFACE;
  if (sev >= 0.05) return OUTCOME.BASIN;
  return OUTCOME.SCAR;
}

/** Outcomes at or past this point run the full staged cataclysm. */
export function isCataclysmic(outcome) {
  return outcome === OUTCOME.RESURFACE || outcome === OUTCOME.DISRUPT || outcome === OUTCOME.SHATTER;
}

/* ---- the staged event ----------------------------------------------------
 * Real timescales run from seconds to centuries. These are compressed, but
 * the ratios are kept: the flash is violent and brief, the glow lingers, the
 * settle is long and quiet. Durations scale a little with severity so a
 * world-ender takes visibly longer to finish than a bad afternoon. */

export const PHASES = [
  { id: "contact", dur: 0.4, k0: 15000, k1: 9000 },
  { id: "plume", dur: 5, k0: 9000, k1: 4200 },
  { id: "curtain", dur: 16, k0: 4200, k1: 2400 },
  { id: "magma", dur: 165, k0: 2000, k1: 1300 },
  { id: "crust", dur: 430, k0: 1300, k1: 800 },
  { id: "settle", dur: 1100, k0: 800, k1: 0 },
];

/** Total seconds an event of this severity runs for. */
export function eventDuration(sev = 0.5) {
  const s = 0.75 + Math.min(1.4, sev) * 0.8;
  return PHASES.reduce((a, p) => a + p.dur * s, 0);
}

const lerp = (a, b, u) => a + (b - a) * u;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * The whole event as a function of elapsed seconds.
 *
 *   phase     which stage it is in
 *   u         0..1 through that stage
 *   kelvin    the driving temperature — colour comes from this
 *   lum       0..1 apparent brightness (this is what lights the sky)
 *   shell     0..1 how far the blast shell has expanded
 *   settle    0..1 debris torus → flat equatorial ring
 *   molten    0..1 how liquid the surface is (craters slump while > 0)
 */
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

  /* Light curve: ease-out-expo attack over the contact phase, then an
   * exponential decay with a long radioactive-looking tail. */
  const attack = clamp01(t / (0.18 * scale));
  const rise = 1 - Math.pow(1 - attack, 5);
  const decay = Math.exp(-t / (26 * scale));
  const emberFloor = Math.max(0, 0.16 * (1 - g) * Math.min(1, sev * 2));
  const lum = clamp01(rise * (decay * (0.5 + Math.min(1, sev)) + emberFloor));

  const shellT = clamp01(t / (22 * scale));
  const shell = 1 - Math.pow(1 - shellT, 3);

  /* the torus flattens long before it circularises — quick at first, then
   * asymptotic, exactly the way collisional damping actually behaves */
  const settle = 1 - Math.exp(-t / (240 * scale));

  const molten = clamp01(Math.exp(-t / (210 * scale)) * Math.min(1, sev * 2.4));

  return { phase: phase.id, u, t, kelvin, lum, shell, settle, molten, done: t >= total };
}

/* ---- supernova ----------------------------------------------------------
 * Shock breakout is a genuinely brief UV/X-ray transient; the optical light
 * curve rises over days, plateaus for ~100 while hydrogen recombination pins
 * the photosphere near 5,500 K, drops over ~30, then decays on the cobalt-56
 * tail for years. Compressed to a couple of minutes, with the shape intact.
 */

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

/**
 * A supernova as a function of elapsed seconds.
 *   lum    0..1, breakout spike then plateau then tail
 *   shell  photosphere radius multiple (homologous — roughly linear in t)
 *   pulse  0..1, the shock pulses the renderer draws as expanding rings
 */
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

  /* homologous expansion: constant velocity, so radius is linear in time */
  const shell = t * 0.9;
  /* successive shock pulses walk out of the photosphere */
  const pulse = (t * 0.55) % 1;
  return { phase: phase.id, u, t, kelvin, lum: clamp01(lum), shell, pulse, done: t >= supernovaDuration() };
}

/* ---- rings ---------------------------------------------------------------
 * Debris inside the Roche limit cannot clump: tides shear it faster than
 * self-gravity gathers it, so it stays a ring. Outside it, the same debris
 * accretes into moonlets. A big enough strike puts material on both sides of
 * that line and you get a ring AND a new moon out of one event.
 */

/** Fluid Roche limit, in the same units as `bodyRadius`. */
export function rocheLimit(bodyRadius, densityRatio = 1) {
  return 2.44 * bodyRadius * Math.cbrt(densityRatio);
}

/**
 * What ring an event of this severity leaves around a body.
 *   inner/outer   radii (world units)
 *   count         debris chunks to place
 *   moonlets      how many clumps form outside the Roche limit
 *   tilt          initial torus inclination, radians — decays to the
 *                 equatorial plane as `settle` runs to 1
 */
export function ringPlan(bodyRadius, sev, shattered = false) {
  const roche = rocheLimit(bodyRadius);
  const s = Math.min(1.4, Math.max(0, sev));
  const inner = bodyRadius * (shattered ? 1.5 : 1.25);
  const outer = Math.max(inner * 1.35, roche * (0.72 + s * 0.5));
  const count = Math.round(shattered ? 150 : 30 + s * 150);
  const moonlets = outer > roche ? Math.min(3, Math.floor(s * 2.2)) : 0;
  return { inner, outer, roche, count, moonlets, tilt: 0.28 + s * 0.5 };
}

/* ---- crater relaxation ---------------------------------------------------
 * The bug this exists to kill: a world took a big hit, grew a bite out of its
 * limb, and kept it forever. A body hot enough to be resurfaced is a body
 * whose surface FLOWS — basins slump and widen, rims collapse, and what is
 * left after it cools is a shallow basin, not a spike. Small craters on a
 * cold world are untouched, which is correct: the Moon still has its.
 */

/** Ease a body's craters toward their relaxed shape. Mutates in place. */
export function relaxCraters(body, dt, molten) {
  const craters = body.craters;
  if (!craters?.length || molten <= 0.01) return false;
  /* how fast the surface flows — fully molten halves a rim in ~40 s */
  const k = Math.pow(0.5, (dt * molten) / 40);
  let changed = false;
  for (const c of craters) {
    const floor = Math.min(0.09, (c.depth0 ?? c.depth) * 0.35);
    if (c.depth > floor + 1e-4) {
      c.depth = floor + (c.depth - floor) * k;
      /* a slumping basin widens as it fills */
      c.r = Math.min(body.radius * 0.62, c.r * (1 + (1 - k) * 0.5));
      c.rough = (c.rough ?? 1) * k;
      changed = true;
    }
  }
  return changed;
}

/* ---- the sky glow bus ----------------------------------------------------
 * "You should be able to see things get a little brighter behind you." A live
 * event publishes a light source into sim.skyGlow; the renderer turns each
 * one into a real light (so hulls rim-light from the correct side even when
 * the source is off-screen), an exposure bump and a bloom pulse.
 */

/** Inverse-square falloff normalised so `ref` distance reads as 1. */
export function glowFalloff(dist, ref) {
  const d = Math.max(1, dist / Math.max(1, ref));
  return 1 / (d * d);
}

/**
 * Apparent brightness of an event at the ship, 0..1.
 * `radius` is the emitting body's radius — a struck moon 2,000 u away is
 * nothing; a star going off at the same range is everything.
 */
export function apparentGlow(lum, radius, dist) {
  return Math.max(0, Math.min(1, lum * glowFalloff(dist, radius * 9)));
}
