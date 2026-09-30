export const KINDS = ["kinetic", "thermal", "em"];

export const POOL = {
  hullBase: 100, hullRefMass: 9, hullPow: 0.33, hullCap: 1400,
  shieldBase: 100, shieldRefKw: 80, shieldPow: 0.35, shieldCap: 400,
};

const TIERS = "ABCDEFG";

export function hullPoolFor(def) {
  const m = def?.stats?.massT;
  if (!(m > 0)) return POOL.hullBase;
  return Math.min(POOL.hullCap, Math.round(POOL.hullBase * (m / POOL.hullRefMass) ** POOL.hullPow));
}

export function shieldPoolFor(def) {
  const r = def?.stats?.reactor;
  if (!(r > 0)) return POOL.shieldBase;
  return Math.min(POOL.shieldCap, Math.round(POOL.shieldBase * (r / POOL.shieldRefKw) ** POOL.shieldPow));
}

export const SHIELD_RESIST = { kinetic: 0.00, thermal: 0.18, em: 0.32 };

const ARMOUR_BY_TIER = (i) => ({
  kinetic: 0.04 + 0.035 * i,
  thermal: 0.02 + 0.025 * i,
  em: 0.015 * i,
});

const COMPLEX_BIAS = {
  security: { kinetic: 0.06, thermal: 0.01, em: 0.00 },
  shipyard: { kinetic: 0.05, thermal: 0.02, em: 0.00 },
  mining: { kinetic: 0.01, thermal: 0.06, em: 0.00 },
  construction: { kinetic: 0.02, thermal: 0.05, em: 0.00 },
  salvage: { kinetic: 0.01, thermal: 0.06, em: 0.01 },
  manufacturing: { kinetic: 0.01, thermal: 0.05, em: 0.01 },
  terraforming: { kinetic: 0.00, thermal: 0.06, em: 0.01 },
  energy: { kinetic: 0.00, thermal: 0.02, em: 0.06 },
  research: { kinetic: 0.00, thermal: 0.01, em: 0.06 },
  communications: { kinetic: 0.00, thermal: 0.00, em: 0.07 },
  navigation: { kinetic: 0.01, thermal: 0.01, em: 0.05 },
};

export const RESIST_CAP = 0.62;

const clampResist = (v) => Math.max(-0.25, Math.min(RESIST_CAP, v));

export function resistsFor(def, mods = null) {
  const i = Math.max(0, TIERS.indexOf(def?.tier ?? "A"));
  const base = ARMOUR_BY_TIER(i);
  const bias = COMPLEX_BIAS[def?.complex] ?? { kinetic: 0, thermal: 0, em: 0 };
  const fit = mods?.resist ?? {};
  const hull = {};
  for (const k of KINDS) hull[k] = clampResist((base[k] ?? 0) + (bias[k] ?? 0) + (fit[k] ?? 0));
  const shield = {};
  for (const k of KINDS) shield[k] = clampResist(SHIELD_RESIST[k] + (fit[`shield_${k}`] ?? 0));
  return { hull, shield };
}

export function defenceReport(def, mods = null) {
  const r = resistsFor(def, mods);
  const pct = (v) => Math.round(v * 100);
  return {
    hullMax: Math.round(hullPoolFor(def) * (mods?.hull ?? 1)),
    shieldMax: shieldPoolFor(def),
    hull: Object.fromEntries(KINDS.map((k) => [k, pct(r.hull[k])])),
    shield: Object.fromEntries(KINDS.map((k) => [k, pct(r.shield[k])])),
    tier: def?.tier ?? "A",
    complex: def?.complex ?? "general",
  };
}

export function throughShield(amount, kind, resists) {
  return amount * (1 - (resists?.shield?.[kind] ?? 0));
}

export function throughArmour(amount, kind, resists) {
  return amount * (1 - (resists?.hull?.[kind] ?? 0));
}
