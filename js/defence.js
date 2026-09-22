/* LIVING GALAXY — what a hull can take, and what takes it.
 *
 * 0.3.34. Reported: rogue drones kill you quickly, and there is nothing to be
 * done about it. Both true, and the second was the reason for the first.
 *
 * WHAT WAS MEASURED, before:
 *
 *   Every hull in the game had exactly 100 hull and 100 shield. Not as a
 *   balance choice — `hullMaxOf()` returned `ship.hullMax ?? 100` and NOTHING
 *   ever set `hullMax`, so a 468,000 cr World Frame at 7,500 tonnes was as
 *   fragile as a 4,400 cr Buoy Skiff at nine. Tier bought you thrust, cargo
 *   and reactor, and not one point of survivability.
 *
 *   Mitigation was shields soaking at 1.6:1, then a flat divisor. Against
 *   seven drones: dead in 8.5 seconds, shields gone at 3.2. The best armour
 *   upgrade in the game bought 0.9 extra seconds. A full 0.3.30 surge of
 *   fifteen killed a stock hull in 3.6 seconds — less time than it takes to
 *   read this sentence, and since 0.3.33 that is the hull gone for good.
 *
 * So there are three things here, and they are meant to be read together:
 *
 *   POOLS come from the hull, off data that already existed on all 121 of
 *   them. Hull integrity follows mass, shield capacity follows reactor. Mass
 *   spans 833x across the tiers, so the curve is a cube root rather than a
 *   line — a G-frame is about nine times the hull of an A, not eight hundred.
 *
 *   RESISTANCES are the part that was missing entirely. Damage has a KIND,
 *   and shields and armour are good at opposite things: a screen bleeds off
 *   energy and is poor at stopping mass, while plate is the reverse. That is
 *   what makes a refit a decision instead of a number going up.
 *
 *   DRONE DAMAGE comes down, because after all of the above a rogue swarm was
 *   still the fastest way to lose a hull you had just paid to insure.
 *
 * Resists are deliberately modest — a few percent to about a third — because
 * they are supposed to flavour a fight, not decide it before it starts. The
 * pools do the heavy lifting.
 */

/** The three ways something hurts. Everything that deals damage names one. */
export const KINDS = ["kinetic", "thermal", "em"];

export const POOL = {
  hullBase: 100, hullRefMass: 9, hullPow: 0.33, hullCap: 1400,
  shieldBase: 100, shieldRefKw: 80, shieldPow: 0.35, shieldCap: 400,
};

const TIERS = "ABCDEFG";

/**
 * Hull integrity for a registry def. Follows mass, because the thing that
 * makes a hull hard to kill is how much of it there is.
 */
export function hullPoolFor(def) {
  const m = def?.stats?.massT;
  if (!(m > 0)) return POOL.hullBase;
  return Math.min(POOL.hullCap, Math.round(POOL.hullBase * (m / POOL.hullRefMass) ** POOL.hullPow));
}

/**
 * Shield capacity. Follows the reactor: a screen is a power budget you are
 * holding in front of you, and a bigger plant holds a bigger one.
 */
export function shieldPoolFor(def) {
  const r = def?.stats?.reactor;
  if (!(r > 0)) return POOL.shieldBase;
  return Math.min(POOL.shieldCap, Math.round(POOL.shieldBase * (r / POOL.shieldRefKw) ** POOL.shieldPow));
}

/* ---- resistances ---------------------------------------------------------
 *
 * Two profiles, and they are near-opposites on purpose.
 *
 * A SHIELD is a field. It bleeds off energy well — that is what it is for —
 * and it is poor at stopping something with mass behind it, which is why a
 * drone's mass driver goes through a screen that shrugs off a laser.
 *
 * ARMOUR is plate. It is excellent against mass and merely adequate against
 * heat, and it does almost nothing about an induced current, which is what
 * makes EM the answer to a heavily plated hull.
 *
 * Neither is ever a wall. The caps below keep total mitigation well short of
 * immunity, because a fight nobody can lose is not a fight.
 */
export const SHIELD_RESIST = { kinetic: 0.00, thermal: 0.18, em: 0.32 };

/** Plate scales with the tier — there is simply more of it on a bigger frame. */
const ARMOUR_BY_TIER = (i) => ({
  kinetic: 0.04 + 0.035 * i,
  thermal: 0.02 + 0.025 * i,
  em: 0.015 * i,
});

/* What a yard building for this trade puts on a hull. A security frame is
 * plated against being shot; a smelter or a cutter lives beside furnaces and
 * is lagged against heat; an energy or comms hull is built around a plant and
 * is shielded against its own induction before anybody else's. */
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

export const RESIST_CAP = 0.62;      // nothing is ever immune to anything

const clampResist = (v) => Math.max(-0.25, Math.min(RESIST_CAP, v));

/**
 * The resist profile for a hull: what its plate turns away, and what its
 * screen does. `mods` is the ship's fitted modifiers — an upgrade can carry a
 * `resist: { kinetic, thermal, em }` block and it is added here.
 */
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

/**
 * Everything a pilot should be able to read off their own hull, for the refit
 * yard and the console. Percentages, rounded, no trailing arithmetic.
 */
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

/**
 * How much of `amount` of `kind` gets through a shield, and how much gets
 * through plate. Returned separately because the caller spends the shield
 * first and only then touches the hull.
 */
export function throughShield(amount, kind, resists) {
  return amount * (1 - (resists?.shield?.[kind] ?? 0));
}

export function throughArmour(amount, kind, resists) {
  return amount * (1 - (resists?.hull?.[kind] ?? 0));
}
