// Living Galaxy — real units, and the two constants that anchor them.
//
// LG has always run on its own numbers. An orbit is a world-unit radius; a planet's
// `radius` is a *drawing* radius chosen so a world is more than a pixel on a phone. Those
// are the right numbers for the jobs they do — Kepler does not care what a unit means, and
// a renderer cares only that the picture reads.
//
// They are useless the moment anything wants to say how heavy a world feels underfoot, how
// thick its air is, or whether it could hold nitrogen. The world catalogue in
// `data/worldgen/` asks all three, because that is how it decides what a world can *be*.
// So this module is the bridge, and it is deliberately only two constants wide:
//
//   MASS_UNIT_PER_SOL   how many mass units are in one solar mass
//   AU_IN_UNITS         how many world units are in one astronomical unit
//
// Everything else is derived from those and from real SI constants.
//
// ## The two choices, and why they are these
//
// **One mass unit is one Earth mass.** Nothing in LG had a mass scale for celestial bodies
// at all before this, so there was no existing convention to honour and the unit was free.
// Earth masses is the scale the catalogue's `mass` bands are already authored in, which
// means the catalogue's numbers can be read as written instead of through a conversion that
// somebody eventually gets backwards.
//
// **9,000 world units is one AU.** This one was *not* free — it is forced, and that is the
// point. `genesis.js` has always placed the habitable zone at `9000 * sqrt(lum)` world
// units, and `stellar.js` puts it at `0.95..1.37 * sqrt(lum)` AU. Setting the conversion to
// anything else would give the game two disagreeing opinions about where liquid water sits:
// the generator would place a world in its habitable zone and the classifier would compute
// an insolation saying otherwise. Deriving the constant from the formula LG already used
// means the old placement rule and the new physics are the same statement.
//
// ## The drawn-radius trap
//
// `planet.radius` is inflated so the picture works. Computing surface gravity from it gives
// a world you could jump off. So a classified body carries `radiusKm` alongside, derived
// the honest way from mass and the bulk density of its class:
//
//   R = (3M / 4πρ)^(1/3)
//
// `radius` keeps drawing the picture. `radiusKm` is what the physics of standing on it uses.
// They are never the same number and nothing should ever confuse them.
//
// Pure module: no DOM, no three.js, no imports beyond ORBIT_SCALE.

import { ORBIT_SCALE } from './config.js';

// ── SI anchors ───────────────────────────────────────────────────────

export const SOLAR_MASS_KG     = 1.98892e30;
export const EARTH_MASS_KG     = 5.97219e24;
export const JUPITER_MASS_KG   = 1.89813e27;
export const EARTH_RADIUS_KM   = 6371;
export const JUPITER_RADIUS_KM = 69911;
export const AU_KM             = 1.495978707e8;
export const G_SI              = 6.67430e-11;        // m³ kg⁻¹ s⁻²
export const EARTH_G           = 9.80665;            // m/s²

// ── the two anchors ──────────────────────────────────────────────────

/** One mass unit is one Earth mass, so the catalogue's bands read as authored. */
export const MASS_UNIT_PER_SOL = SOLAR_MASS_KG / EARTH_MASS_KG;   // ≈ 332,946

/**
 * World units per AU.
 *
 * Forced by `genesis.js`, which places the habitable zone at `9000 * sqrt(lum)` world units
 * — the same place `habitableZone()` puts it in AU. Change one and this must change with it
 * or the generator and the classifier will disagree about where water is liquid.
 */
export const HABITABLE_UNITS = 9000;
export const AU_IN_UNITS = HABITABLE_UNITS * ORBIT_SCALE;

// ── unit ↔ SI ────────────────────────────────────────────────────────

/** Mass units to kilograms. */
export const massKg = m => (m / MASS_UNIT_PER_SOL) * SOLAR_MASS_KG;

/** Mass units to Earth masses. Identity by construction, and named so callers can say why. */
export const massEarths = m => massKg(m) / EARTH_MASS_KG;

/** Mass units to Jupiter masses — the readable scale for giants. */
export const massJupiters = m => massKg(m) / JUPITER_MASS_KG;

/** World units to kilometres of real distance. */
export const lengthKm = u => (u / AU_IN_UNITS) * AU_KM;

/** World units to AU. This is the one the classifier lives on. */
export const lengthAU = u => u / AU_IN_UNITS;

/** AU back to world units, for placing something the physics decided the position of. */
export const auToUnits = au => au * AU_IN_UNITS;

// ── derived body properties ──────────────────────────────────────────

/**
 * Physical radius in km from mass and bulk density (g/cm³).
 *
 * This is the number that makes gravity mean something, and it is deliberately NOT the
 * drawn radius — see the module header.
 */
export function physicalRadiusKm(simMass, densityGcc) {
  const kg = massKg(simMass);
  const rhoKgM3 = Math.max(0.05, densityGcc) * 1000;
  const volumeM3 = kg / rhoKgM3;
  return Math.cbrt((3 * volumeM3) / (4 * Math.PI)) / 1000;
}

/**
 * Giants do not follow the constant-density rule. Electron degeneracy flattens the
 * mass–radius relation, so a three-Jupiter world is barely larger than a one-Jupiter one.
 * Above ~0.3 Mj the radius plateaus near 1 Rj; below it the rocky cube-root still holds.
 */
export function giantRadiusKm(simMass) {
  const mj = massJupiters(simMass);
  if (mj < 0.02) return physicalRadiusKm(simMass, 1.6);
  if (mj < 0.3) return JUPITER_RADIUS_KM * Math.pow(mj / 0.3, 0.55) * 0.92;
  return JUPITER_RADIUS_KM * (0.92 + 0.10 * Math.log10(1 + mj / 0.3));
}

/**
 * Small bodies are sized from the catalogue, not from mass.
 *
 * For a planet the chain mass → density → radius → gravity is honest, because a planet's
 * mass is a real number. An asteroid's is not: LG's rock masses are tuned so the mining and
 * collision code behaves, which is a dynamics abstraction, and running one through the
 * cube-root gives a "pebble" a thousand kilometres across.
 *
 * So for rocks the catalogue's declared `radiusKm` band is authoritative. The body's
 * position within its own mass range picks a size within its class's real size range, and
 * gravity is derived from *that*. Each number is used for the job it is good at.
 *
 * `sub` selects a slice of the class's range, because a class like C-type spans 0.2 km to
 * 480 km — both an anonymous belt pebble and a Ceres. Which end applies is a property of the
 * body's role, not its class, so the caller picks: belt particles take the bottom, named
 * large rocks the top. Without it a "huge asteroid" can come out smaller than the gravel
 * around it.
 */
export function radiusInBand(simMass, massRange, radiusRange, sub = [0, 1]) {
  const [m0, m1] = massRange;
  let [r0, r1] = radiusRange;

  const span = r1 - r0;
  const lo = r0 + span * Math.max(0, Math.min(1, sub[0]));
  const hi = r0 + span * Math.max(0, Math.min(1, sub[1]));
  r0 = Math.min(lo, hi); r1 = Math.max(lo, hi);

  const f = m1 > m0 ? Math.max(0, Math.min(1, (simMass - m0) / (m1 - m0))) : 0.5;
  // Cube-root interpolation: mass scales as r³, so a linear sweep in mass must not sweep
  // linearly in radius.
  return Math.cbrt(r0 * r0 * r0 + f * (r1 * r1 * r1 - r0 * r0 * r0));
}

/** Mass in kg implied by a physical radius and bulk density. */
export function massFromRadiusKg(radiusKmValue, densityGcc) {
  const rM = Math.max(1, radiusKmValue) * 1000;
  return (4 / 3) * Math.PI * rM * rM * rM * Math.max(0.05, densityGcc) * 1000;
}

/** Surface gravity in Earth g, from a physical radius and bulk density. */
export function gravityGFromRadius(radiusKmValue, densityGcc) {
  const r = Math.max(1, radiusKmValue) * 1000;
  return (G_SI * massFromRadiusKg(radiusKmValue, densityGcc)) / (r * r) / EARTH_G;
}

/** Escape velocity in km/s, from a physical radius and bulk density. */
export function escapeKmsFromRadius(radiusKmValue, densityGcc) {
  const r = Math.max(1, radiusKmValue) * 1000;
  return Math.sqrt((2 * G_SI * massFromRadiusKg(radiusKmValue, densityGcc)) / r) / 1000;
}

/** Surface gravity in m/s² from mass and physical radius. */
export function surfaceGravity(simMass, radiusKmValue) {
  const r = Math.max(1, radiusKmValue) * 1000;
  return (G_SI * massKg(simMass)) / (r * r);
}

/** Surface gravity in Earth g — the readable form. */
export const gravityG = (simMass, radiusKmValue) => surfaceGravity(simMass, radiusKmValue) / EARTH_G;

/** Escape velocity in km/s. */
export function escapeVelocityKms(simMass, radiusKmValue) {
  const r = Math.max(1, radiusKmValue) * 1000;
  return Math.sqrt((2 * G_SI * massKg(simMass)) / r) / 1000;
}

/**
 * Equilibrium temperature in kelvin from insolation in solar constants.
 * S = 1 at Earth's orbit gives 278.6 K for a zero-albedo body.
 *
 *   T = 278.6 · (S(1 − A))^(1/4) · greenhouse
 */
export function equilibriumTempK(S, albedo = 0.3, greenhouse = 1) {
  const absorbed = Math.max(1e-9, S * (1 - clamp01(albedo)));
  return 278.6 * Math.pow(absorbed, 0.25) * Math.max(0.5, greenhouse);
}

/**
 * Can this world hold that gas?
 *
 * Jeans escape in its useful shorthand: a gas is retained when the escape velocity is at
 * least ~6× the thermal velocity of its molecules. Returns the ratio rather than a boolean
 * so callers can rank atmospheres instead of only accepting or rejecting them. `molarMass`
 * is g/mol — H₂ = 2, He = 4, N₂ = 28, CO₂ = 44.
 */
export function retentionRatio(escapeKms, tempK, molarMassGmol) {
  const R = 8.314;
  const vThermalKms = Math.sqrt((3 * R * Math.max(1, tempK)) / (molarMassGmol / 1000)) / 1000;
  return escapeKms / Math.max(1e-6, vThermalKms);
}

/** A world retains a gas when the ratio clears this. */
export const RETENTION_THRESHOLD = 6;

export const retainsGas = (escapeKms, tempK, molarMassGmol) =>
  retentionRatio(escapeKms, tempK, molarMassGmol) >= RETENTION_THRESHOLD;

/**
 * Surface pressure in bar. Scales with the retained volatile inventory, the world's gravity
 * and its surface area — a heavy world holding the same mass of gas over a smaller area
 * sits under a thicker sky.
 */
export function surfacePressureBar(columnScale, volatiles, gravityInG, radiusKmValue) {
  if (columnScale <= 0) return 0;
  const areaRatio = Math.pow(EARTH_RADIUS_KM / Math.max(1, radiusKmValue), 2);
  return columnScale * Math.max(0, volatiles) * Math.max(0.05, gravityInG) * areaRatio;
}

// ── formatting ───────────────────────────────────────────────────────

export function fmtBodyMass(simMass) {
  const me = massEarths(simMass);
  if (me >= 50) return massJupiters(simMass).toFixed(2) + ' Mj';
  if (me >= 0.01) return me.toFixed(2) + ' M⊕';
  return (me * 1e3).toFixed(2) + ' mM⊕';
}

export function fmtRadiusKm(km) {
  if (km >= 1e4) return (km / EARTH_RADIUS_KM).toFixed(2) + ' R⊕';
  if (km >= 100) return Math.round(km).toLocaleString('en-US') + ' km';
  return km.toFixed(1) + ' km';
}

export function fmtPressure(bar) {
  if (bar <= 0) return 'vacuum';
  if (bar < 1e-6) return 'trace';
  if (bar < 1e-3) return (bar * 1e6).toFixed(0) + ' µbar';
  if (bar < 1) return (bar * 1e3).toFixed(0) + ' mbar';
  if (bar < 1000) return bar.toFixed(2) + ' bar';
  return (bar / 1000).toFixed(1) + ' kbar';
}

export const fmtTempK = k => Math.round(k) + ' K / ' + Math.round(k - 273.15) + ' °C';

export const fmtGravity = g => g.toFixed(2) + ' g';

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
