export const UNIT_M = 10;
export const SHIP_LENGTH = 2.4;

export const WORLD_SCALE = 3.2;
export const RADIUS_FLOOR = 90 * WORLD_SCALE;
export const RADIUS_K = 340 * WORLD_SCALE;
export const RADIUS_P = 1.5;

export const ORBIT_K = 2600 * 2.2;
export const ORBIT_P = 1.25;

export const PERIOD_K = 1080;

export function scaleRadius(r) {
  return RADIUS_FLOOR + RADIUS_K * Math.pow(Math.max(r, 0.01), RADIUS_P);
}

export function scaleOrbit(o) {
  return o <= 0 ? 0 : ORBIT_K * Math.pow(o, ORBIT_P);
}

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

export const G_K = 0.0456 / WORLD_SCALE;

export const EARTH_R = 548 * WORLD_SCALE;

export function density(kind) {
  return DENSITY[kind] ?? 1;
}

export function surfaceGravity(b) {
  return G_K * b.radius * density(b.kind);
}

export function mu(b) {
  return surfaceGravity(b) * b.radius * b.radius;
}

export function massIndex(b) {
  return density(b.kind) * Math.pow(b.radius / EARTH_R, 3);
}

export function escapeVelocity(b) {
  return Math.sqrt(2 * surfaceGravity(b) * b.radius);
}

export function orbitalVelocity(b, r) {
  return Math.sqrt(mu(b) / Math.max(r, b.radius));
}

export function remnantRadius(b) {
  return (b?.radius ?? 0) * (b?.shattered ? 0.4 : 1);
}

export function wellRadius(b) {
  const base = remnantRadius(b) * (90 / WORLD_SCALE);
  return b?.shattered ? base * Math.sqrt(SHATTERED_MU) : base;
}

export const SHATTERED_MU = 0.35;

export function sphereOfInfluence(orbit, m, M) {
  if (!orbit || !M) return Infinity;
  return orbit * Math.pow(Math.max(m, 1e-9) / M, 0.4);
}

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
    yieldRate: 4 + rich * 9,
    deposits: deposits.slice(0, Math.min(deposits.length, 2 + tier)),
  };
}

export function scanRange(b) {
  return b.radius * 2.4 + 1400;
}
