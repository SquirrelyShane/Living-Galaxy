/* LIVING GALAXY — scale, mass, gravity and resource model.
 *
 * One world unit = 10 metres. The ship is ~2.4 units (24 m) long.
 * Celestial radii and orbits are re-mapped through power curves so that
 * bigger things get *disproportionately* bigger: a gas giant does not just
 * out-mass a moon, it dwarfs it, and it dwarfs you absolutely.
 */

export const UNIT_M = 10;
/* The hull is a speck. That is the point — everything out there should
 * read as geology, not scenery. Keep in step with SHIP_LENGTH_U in shipdb.js
 * (tier B dims) and the engine.js comment. */
export const SHIP_LENGTH = 2.4;

/* radius_new = RADIUS_FLOOR + RADIUS_K * radius_old ^ RADIUS_P
 * Super-linear, so the gap between a moon and a gas giant blows open, with a
 * floor so no "moon" ends up smaller than a city block. */
/* One knob for how big the sky is. Worlds are geology, not props: the whole
 * radius curve and the impactors that hit it scale together, so severity
 * (rock ÷ world) is unchanged. */
export const WORLD_SCALE = 3.2;
export const RADIUS_FLOOR = 90 * WORLD_SCALE;
export const RADIUS_K = 340 * WORLD_SCALE;
export const RADIUS_P = 1.5;

/* orbit_new = ORBIT_K * orbit_old ^ ORBIT_P  (real distances, real transit times) */
export const ORBIT_K = 2600 * 2.2; // real distances: another world is a voyage, not a hop
export const ORBIT_P = 1.25;

/* Orbital periods stretch with the orbits. A world should not visibly cross
 * its own orbit while you watch — Earth takes about a day of play. */
export const PERIOD_K = 1080;

export function scaleRadius(r) {
  return RADIUS_FLOOR + RADIUS_K * Math.pow(Math.max(r, 0.01), RADIUS_P);
}

export function scaleOrbit(o) {
  return o <= 0 ? 0 : ORBIT_K * Math.pow(o, ORBIT_P);
}

/* Bulk density relative to a rocky world. Gas giants are puffy. */
export const DENSITY = {
  star: 1.15,
  rocky: 1.0,
  terra: 1.0,
  cloud: 0.94,
  gas: 0.42,
  ice: 0.52,
  moon: 0.76,
  dwarf: 0.62,
};

/* Tuned so an Earth-analog (r=229u) pulls 25 u/s^2 at the surface, against
 * a main-engine authority of ~88 u/s^2. Jupiter-class worlds pull ~59 and
 * demand a sustained full burn to climb out of. */
export const G_K = 0.0456 / WORLD_SCALE; // bigger worlds, same felt gravity — the flight model is tuned to it

/* Reference radius for "one Earth" in the stat readouts. */
export const EARTH_R = 548 * WORLD_SCALE;

export function density(kind) {
  return DENSITY[kind] ?? 1;
}

/** Surface gravity in u/s^2. Constant density => g scales with radius. */
export function surfaceGravity(b) {
  return G_K * b.radius * density(b.kind);
}

/** Standard gravitational parameter mu = g_surf * R^2. */
export function mu(b) {
  return surfaceGravity(b) * b.radius * b.radius;
}

/** Mass in Earth-analog units. */
export function massIndex(b) {
  return density(b.kind) * Math.pow(b.radius / EARTH_R, 3);
}

export function escapeVelocity(b) {
  return Math.sqrt(2 * surfaceGravity(b) * b.radius);
}

export function orbitalVelocity(b, r) {
  return Math.sqrt(mu(b) / Math.max(r, b.radius));
}

/**
 * What is actually still there. A shattered world is a core in a cloud of its
 * own rubble, not a ball — the engine has always DRAWN it at 0.4 of its old
 * radius, and everything that measures the body should agree with what the
 * canopy shows. One definition, here, rather than 0.4 written out in four
 * files that can drift apart.
 */
export function remnantRadius(b) {
  return (b?.radius ?? 0) * (b?.shattered ? 0.4 : 1);
}

/**
 * Gravity well cutoff — beyond this the pull is negligible and skipped.
 *
 * A world that has lost most of its mass has lost most of its reach with it.
 * `mu` is already cut for a shattered body (bodies.js), and the radius at
 * which a fixed acceleration is reached goes as the square root of mu, so the
 * well shrinks by that much again on top of the smaller remnant. A broken
 * planet stops holding the core a long way sooner than a whole one.
 */
export function wellRadius(b) {
  /* wells did not grow with the WORLD_SCALE re-map — climbing out of one at
   * sublight should take minutes, not a sitting */
  const base = remnantRadius(b) * (90 / WORLD_SCALE);
  return b?.shattered ? base * Math.sqrt(SHATTERED_MU) : base;
}

/** What is left of a shattered world's gravitational parameter. bodies.js applies it. */
export const SHATTERED_MU = 0.35;

/** Patched-conic sphere of influence: r = a (m/M)^(2/5). */
export function sphereOfInfluence(orbit, m, M) {
  if (!orbit || !M) return Infinity;
  return orbit * Math.pow(Math.max(m, 1e-9) / M, 0.4);
}

/* ---- resources ---------------------------------------------------------- */

const KIND_YIELD = {
  star: 0.35,
  rocky: 1.0,
  terra: 1.25,
  cloud: 0.85,
  gas: 1.55,
  ice: 1.15,
  moon: 0.7,
  dwarf: 0.6,
};

const DEPOSITS = {
  star: ["Plasma", "Helium", "Heavy ions"],
  rocky: ["Iron", "Nickel", "Silicates", "Platinum"],
  terra: ["Water", "Biomass", "Rare earths", "Iridium"],
  cloud: ["Sulfur", "Carbon", "Phosphates"],
  gas: ["Hydrogen", "Helium-3", "Ammonia", "Metallic H"],
  ice: ["Methane clathrate", "Deuterium", "Nitrogen ice"],
  moon: ["Regolith", "Titanium", "Water ice"],
  dwarf: ["Cobalt", "Water ice", "Tholins"],
};

export const TIERS = ["Common", "Uncommon", "Rare", "Exotic", "Singular"];

/** Richness grows super-linearly with radius: bigger world, exponentially more. */
export function richness(b) {
  return Math.pow(b.radius / 490, 1.65) * (KIND_YIELD[b.kind] ?? 1);
}

export function tierOf(rich) {
  if (rich < 0.4) return 0;
  if (rich < 1.6) return 1;
  if (rich < 6) return 2;
  if (rich < 20) return 3;
  return 4;
}

/** Everything the survey log and cockpit want to know about a world. */
export function bodyStats(b) {
  const g = surfaceGravity(b);
  const rich = richness(b);
  const tier = tierOf(rich);
  const deposits = DEPOSITS[b.kind] ?? DEPOSITS.rocky;
  return {
    radiusU: b.radius,
    radiusKm: (b.radius * UNIT_M) / 1000,
    shipLengths: b.radius / SHIP_LENGTH,
    mass: massIndex(b),
    gravity: g,
    gEarth: g / (G_K * EARTH_R),
    escape: escapeVelocity(b),
    lowOrbit: orbitalVelocity(b, b.radius * 1.12),
    richness: rich,
    tier,
    tierName: TIERS[tier],
    /* ore units recoverable per mining cycle */
    yieldRate: 4 + rich * 9,
    deposits: deposits.slice(0, Math.min(deposits.length, 2 + tier)),
  };
}

/** Scan range has to grow with the body or you could never lock a giant. */
export function scanRange(b) {
  return b.radius * 2.4 + 1400;
}
