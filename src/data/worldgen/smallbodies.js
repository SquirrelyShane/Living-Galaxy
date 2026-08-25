/**
 * SMALL-BODY & REMNANT DATABASE
 *
 * Asteroids, comets, and the things left over when a star or a world
 * stops being one. Same contract as worlds.js: every class declares the
 * conditions under which it can exist, and the classifier picks only from
 * classes whose envelope actually contains the body's situation.
 *
 * ASTEROIDS follow the condensation sequence outward, and real belts are
 * radially sorted because of it: metal and refractory types dominate the
 * inner belt, carbonaceous types the middle, and ice-bearing types the
 * outer edge and beyond. That sorting is a genuine observation about the
 * solar system, and reproducing it costs nothing but honouring the
 * temperature band each class already carries.
 *
 * COMETS are classified by where they came from and how much of them is
 * left. A comet that has passed perihelion a thousand times is not the
 * same object as one falling in for the first time — it has a lag crust,
 * a weaker tail, and eventually no volatiles at all, at which point it is
 * an asteroid that happens to be on a silly orbit. `passes` drives that.
 *
 * REMNANTS — white dwarfs, neutron stars, black holes — are sized by
 * physics, not by taste. A black hole's Schwarzschild radius follows from
 * its mass and nothing else, and it is small: a stellar-mass hole is a few
 * kilometres across. The interesting radii are the ones that are not the
 * horizon — the ISCO, the photon sphere, the tidal-disruption distance —
 * so those are computed here too.
 *
 * Pure data + pure functions. No DOM, no three.js.
 */

/* ══ ASTEROID CLASSES ═════════════════════════════════════════════ */

export const ASTEROID_CLASSES = [

{ id: 'c_type', label: 'C-type Carbonaceous', spectral: 'C',
  T: [120, 500], density: 1.4, albedo: 0.06, radiusKm: [0.2, 480],
  ores: ['silicate', 'organic', 'hydrothermal', 'carbon'], weight: 3.6,
  color: 0x3a352e,
  blurb: 'Dark, primitive, and up to a fifth water by mass. The commonest thing in any belt.' },

{ id: 's_type', label: 'S-type Silicaceous', spectral: 'S',
  T: [200, 900], density: 2.7, albedo: 0.20, radiusKm: [0.2, 270],
  ores: ['silicate', 'siderophile', 'lithophile'], weight: 2.8,
  color: 0x8a7a5a,
  blurb: 'Stony, moderately bright, and partly differentiated. Ordinary chondrite made visible.' },

{ id: 'm_type', label: 'M-type Metallic', spectral: 'M',
  T: [200, 1400], density: 5.3, albedo: 0.16, radiusKm: [0.3, 130],
  ores: ['siderophile', 'refractory', 'chalcophile'], weight: 1.1,
  color: 0xa89888,
  blurb: 'The exposed core of a shattered protoplanet. More metal than a planetary crust holds.' },

{ id: 'v_type', label: 'V-type Basaltic', spectral: 'V',
  T: [180, 800], density: 3.1, albedo: 0.35, radiusKm: [0.1, 60],
  ores: ['silicate', 'lithophile'], weight: 0.7,
  color: 0xc0a878,
  blurb: 'Chipped off a differentiated body that had a real crust before something hit it.' },

{ id: 'p_type', label: 'P-type Primitive', spectral: 'P',
  T: [80, 300], density: 1.8, albedo: 0.04, radiusKm: [0.5, 200],
  ores: ['organic', 'carbon', 'volatile_ice'], weight: 1.2,
  color: 0x2a2622,
  blurb: 'Redder and darker than a C-type, and even older. Never warmed enough to change.' },

{ id: 'd_type', label: 'D-type Organic', spectral: 'D',
  T: [50, 260], density: 1.5, albedo: 0.045, radiusKm: [0.5, 220],
  ores: ['organic', 'volatile_ice', 'carbon'], weight: 1.0,
  color: 0x3a2418,
  blurb: 'Tholin-rich and very red. These formed far out and were scattered inward later.' },

{ id: 'g_type', label: 'G-type Hydrated', spectral: 'G',
  T: [150, 400], density: 2.1, albedo: 0.09, radiusKm: [0.3, 470],
  ores: ['hydrothermal', 'organic', 'evaporite', 'silicate'], weight: 0.9,
  color: 0x4a4a3a,
  blurb: 'Aqueously altered clay. Water flowed inside this rock once, and left salts behind.' },

{ id: 'e_type', label: 'E-type Enstatite', spectral: 'E',
  T: [400, 1200], density: 2.9, albedo: 0.52, radiusKm: [0.1, 40],
  ores: ['silicate', 'refractory', 'chalcophile'], weight: 0.5,
  color: 0xe0dcd0,
  blurb: 'Startlingly bright, and formed in conditions so reducing that even iron stayed unoxidised.' },

{ id: 'a_type', label: 'A-type Olivine', spectral: 'A',
  T: [200, 1000], density: 3.4, albedo: 0.28, radiusKm: [0.1, 30],
  ores: ['silicate', 'lithophile', 'siderophile'], weight: 0.35,
  color: 0xb08a4a,
  blurb: 'Nearly pure olivine — the mantle of a world whose crust and core both went elsewhere.' },

{ id: 'q_type', label: 'Q-type Fresh Chondrite', spectral: 'Q',
  T: [200, 900], density: 3.3, albedo: 0.29, radiusKm: [0.05, 20],
  ores: ['silicate', 'siderophile', 'chalcophile'], weight: 0.6,
  color: 0xc8b090,
  blurb: 'Unweathered surface, so it was resurfaced recently — a close pass shook the dust off.' },

{ id: 'k_type', label: 'K-type Transitional', spectral: 'K',
  T: [150, 600], density: 2.4, albedo: 0.12, radiusKm: [0.2, 100],
  ores: ['silicate', 'carbon', 'organic'], weight: 0.6,
  color: 0x6a5a4a,
  blurb: 'Sits between the stony and carbonaceous families and settles the argument for neither.' },

{ id: 'x_metal_rich', label: 'X-type Ambiguous', spectral: 'X',
  T: [150, 1000], density: 4.2, albedo: 0.14, radiusKm: [0.2, 150],
  ores: ['siderophile', 'chalcophile', 'refractory'], weight: 0.8,
  color: 0x9a8878,
  blurb: 'Spectrally featureless. Could be metal, could be enstatite — you have to go and look.' },

{ id: 'rubble_pile', label: 'Rubble Pile', spectral: '—',
  T: [50, 900], density: 1.2, albedo: 0.10, radiusKm: [0.05, 15],
  ores: ['silicate', 'siderophile'], weight: 1.6, fragile: true,
  color: 0x6a6258,
  blurb: 'Forty percent void by volume. A gentle nudge disassembles it entirely.' },

{ id: 'contact_binary', label: 'Contact Binary', spectral: '—',
  T: [50, 700], density: 1.6, albedo: 0.09, radiusKm: [0.1, 20],
  ores: ['silicate', 'organic', 'volatile_ice'], weight: 0.5, fragile: true,
  color: 0x5a5248,
  blurb: 'Two bodies that drifted together slowly enough to touch instead of shatter.' },

{ id: 'ice_asteroid', label: 'Icy Asteroid', spectral: 'B',
  T: [0, 180], density: 1.1, albedo: 0.30, radiusKm: [0.2, 90],
  ores: ['volatile_ice', 'organic', 'silicate'], weight: 1.3,
  color: 0xa8c8d8,
  blurb: 'Outer-belt body that kept its ice because it never once crossed the frost line.' },

{ id: 'metal_monolith', label: 'Metal Monolith', spectral: 'M',
  T: [150, 1600], density: 7.4, albedo: 0.19, radiusKm: [0.05, 12],
  ores: ['siderophile', 'refractory', 'exotic'], weight: 0.25,
  color: 0xb8b0a0,
  blurb: 'A single crystal of nickel-iron kilometres across. It rings when struck, for hours.' },

{ id: 'vitrified', label: 'Vitrified Fragment', spectral: '—',
  T: [200, 1800], density: 2.8, albedo: 0.03, radiusKm: [0.02, 8],
  ores: ['silicate', 'exotic', 'refractory'], weight: 0.3,
  color: 0x1a1a20,
  blurb: 'Melted through by an impact and frozen as glass. Blacker than anything else in the belt.' },

{ id: 'radiogenic_rock', label: 'Radiogenic Rock', spectral: 'X',
  T: [100, 900], density: 5.8, albedo: 0.08, radiusKm: [0.05, 25],
  ores: ['radiogenic', 'siderophile', 'exotic'], weight: 0.2,
  color: 0x5a7a5a,
  blurb: 'Still warm from its own decay chain, four billion years after it should have cooled.' },

{ id: 'presolar_relic', label: 'Presolar Relic', spectral: 'D',
  T: [0, 200], density: 2.0, albedo: 0.02, radiusKm: [0.05, 30],
  ores: ['exotic', 'organic', 'refractory'], weight: 0.12,
  color: 0x2a1a2a,
  blurb: 'Isotopically wrong for this system. It was here before the star was.' }

];

/* ══ COMET CLASSES ════════════════════════════════════════════════ */

export const COMET_CLASSES = [

{ id: 'long_period', label: 'Long-Period Comet',
  e: [0.90, 0.999], density: 0.5, albedo: 0.04, radiusKm: [0.5, 30],
  volatiles: [0.7, 1.0], tailStrength: 1.0,
  ores: ['volatile_ice', 'organic', 'silicate'], weight: 2.0,
  color: 0xaaddff,
  blurb: 'Falling in from the halo for the first time in a million years, and fully loaded.' },

{ id: 'short_period', label: 'Short-Period Comet',
  e: [0.4, 0.85], density: 0.6, albedo: 0.035, radiusKm: [0.3, 12],
  volatiles: [0.25, 0.7], tailStrength: 0.6,
  ores: ['volatile_ice', 'organic', 'carbon'], weight: 2.4,
  color: 0x9ac8e8,
  blurb: 'Captured into the inner system and losing a little more of itself every pass.' },

{ id: 'sungrazer', label: 'Sungrazer',
  e: [0.98, 0.9999], density: 0.4, albedo: 0.05, radiusKm: [0.05, 5],
  volatiles: [0.5, 1.0], tailStrength: 2.2, doomed: true,
  ores: ['volatile_ice', 'organic', 'refractory'], weight: 0.5,
  color: 0xffe8b0,
  blurb: 'Perihelion inside the corona. Most do not come back out the other side.' },

{ id: 'dormant', label: 'Dormant Comet',
  e: [0.3, 0.8], density: 0.9, albedo: 0.02, radiusKm: [0.3, 15],
  volatiles: [0.02, 0.20], tailStrength: 0.05,
  ores: ['organic', 'carbon', 'silicate'], weight: 1.0,
  color: 0x3a3830,
  blurb: 'Sealed under its own lag crust. Indistinguishable from an asteroid until it cracks.' },

{ id: 'extinct', label: 'Extinct Comet',
  e: [0.2, 0.75], density: 1.3, albedo: 0.03, radiusKm: [0.2, 10],
  volatiles: [0, 0.03], tailStrength: 0,
  ores: ['carbon', 'organic', 'silicate'], weight: 0.8,
  color: 0x2a2824,
  blurb: 'Everything volatile is gone. What remains is a very dark rock on a very odd orbit.' },

{ id: 'hyperbolic', label: 'Interstellar Visitor',
  e: [1.0, 3.5], density: 0.6, albedo: 0.06, radiusKm: [0.05, 3],
  volatiles: [0.3, 1.0], tailStrength: 0.8, unbound: true,
  ores: ['exotic', 'volatile_ice', 'organic'], weight: 0.15,
  color: 0xd8b0ff,
  blurb: 'Unbound. It formed around another star, and it will never orbit this one.' },

{ id: 'fragmenting', label: 'Fragmenting Comet',
  e: [0.6, 0.99], density: 0.35, albedo: 0.07, radiusKm: [0.1, 8],
  volatiles: [0.4, 0.9], tailStrength: 1.6, fragile: true,
  ores: ['volatile_ice', 'organic'], weight: 0.6,
  color: 0xc8e8ff,
  blurb: 'Coming apart along old fracture lines. Where there was one, there are now nine.' },

{ id: 'hyperactive', label: 'Hyperactive Comet',
  e: [0.5, 0.97], density: 0.45, albedo: 0.05, radiusKm: [0.2, 9],
  volatiles: [0.6, 1.0], tailStrength: 2.6,
  ores: ['volatile_ice', 'organic', 'exotic'], weight: 0.4,
  color: 0xb0f0e8,
  blurb: 'Outgassing far more than its surface area allows. Icy chunks in the coma do the rest.' },

{ id: 'main_belt_comet', label: 'Main-Belt Comet',
  e: [0.05, 0.35], density: 1.4, albedo: 0.05, radiusKm: [0.2, 6],
  volatiles: [0.15, 0.5], tailStrength: 0.25,
  ores: ['volatile_ice', 'hydrothermal', 'silicate'], weight: 0.5,
  color: 0x88a8a0,
  blurb: 'An asteroid on an asteroid orbit that nonetheless grows a tail. Buried ice, freshly exposed.' },

{ id: 'ammonia_comet', label: 'Ammonia-Rich Comet',
  e: [0.6, 0.99], density: 0.55, albedo: 0.045, radiusKm: [0.3, 14],
  volatiles: [0.6, 1.0], tailStrength: 1.2,
  ores: ['volatile_ice', 'organic', 'evaporite'], weight: 0.6,
  color: 0xc0e8c0,
  blurb: 'Its coma glows green from diatomic carbon and ammonia fragments in the sunlight.' },

{ id: 'deuterium_comet', label: 'Deuterium-Rich Comet',
  e: [0.75, 0.999], density: 0.6, albedo: 0.04, radiusKm: [0.3, 12],
  volatiles: [0.6, 1.0], tailStrength: 1.0,
  ores: ['volatile_ice', 'exotic'], weight: 0.25,
  color: 0x88c0ff,
  blurb: 'Heavy-water ratio far above the system average. Worth more than its mass in most things.' }

];

/* ══ REMNANT & EXOTIC CLASSES ═════════════════════════════════════ */

export const REMNANT_CLASSES = [

{ id: 'stellar_bh', label: 'Stellar-Mass Black Hole', kind: 'black_hole',
  massSol: [3, 60], spin: [0, 0.98],
  color: 0x220044, accretionColor: 0x4a2a88,
  blurb: 'The collapsed core of a massive star. A few kilometres across, and it eats.' },

{ id: 'intermediate_bh', label: 'Intermediate Black Hole', kind: 'black_hole',
  massSol: [100, 100000], spin: [0, 0.99],
  color: 0x1a0033, accretionColor: 0x6a3aa8,
  blurb: 'Too heavy for one star to have made it. Something merged, repeatedly, to build this.' },

{ id: 'primordial_bh', label: 'Primordial Black Hole', kind: 'black_hole',
  massSol: [1e-6, 1], spin: [0, 0.5], hawking: true,
  color: 0x2a0a3a, accretionColor: 0x8a5ac8,
  blurb: 'Older than any star. Small enough that it is measurably evaporating as you watch.' },

{ id: 'kerr_bh', label: 'Kerr Black Hole', kind: 'black_hole',
  massSol: [5, 400], spin: [0.9, 0.999],
  color: 0x14002a, accretionColor: 0x9a4ad8,
  blurb: 'Spinning so near the limit that it drags spacetime around with it, and you can see the drag.' },

{ id: 'white_dwarf', label: 'White Dwarf', kind: 'remnant',
  massSol: [0.17, 1.4], radiusKm: [3000, 20000], density: 1e6,
  color: 0xdde6ff,
  blurb: 'An Earth-sized ball of degenerate carbon, cooling toward the temperature of space.' },

{ id: 'neutron_star', label: 'Neutron Star', kind: 'remnant',
  massSol: [1.1, 2.4], radiusKm: [10, 14], density: 4e14,
  color: 0xeef4ff,
  blurb: 'A city-sized nucleus. One teaspoon of it outweighs a mountain range.' },

{ id: 'magnetar', label: 'Magnetar', kind: 'remnant',
  massSol: [1.2, 2.3], radiusKm: [10, 13], density: 4e14,
  color: 0xc8d8ff,
  blurb: 'A magnetic field strong enough to distort atoms at a thousand kilometres. It kills at range.' },

{ id: 'brown_dwarf', label: 'Brown Dwarf', kind: 'substellar',
  massSol: [0.012, 0.075], radiusKm: [60000, 80000], density: 60,
  color: 0x8a3a5a,
  blurb: 'Too heavy to be a planet, too light to burn hydrogen. It has been fading since it formed.' },

{ id: 'rogue_core', label: 'Rogue Planetary Core', kind: 'substellar',
  massSol: [1e-5, 3e-4], radiusKm: [3000, 25000], density: 9,
  color: 0x4a3a3a,
  blurb: 'Stripped, ejected, and cold. It is passing through and will not be captured.' }

];

/* ══ derived physics ══════════════════════════════════════════════ */

const G_SI = 6.67430e-11;
const C = 299792458;
const SOLAR_MASS_KG = 1.98892e30;

/** Schwarzschild radius in km, from mass in solar masses. */
export function schwarzschildKm(massSol) {
  return (2 * G_SI * massSol * SOLAR_MASS_KG) / (C * C) / 1000;
}

/**
 * Innermost stable circular orbit, in km. This is the radius that
 * actually matters for an accretion disc: inside it there is no orbit to
 * hold, only a plunge. For a non-spinning hole it is 3 Rs; maximal
 * prograde spin drags it in to 0.5 Rs.
 */
export function iscoKm(massSol, spin = 0) {
  const rs = schwarzschildKm(massSol);
  const a = Math.max(0, Math.min(0.999, spin));
  // Bardeen-Press-Teukolsky, prograde
  const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const z2 = Math.sqrt(3 * a * a + z1 * z1);
  const rIsco = 3 + z2 - Math.sqrt((3 - z1) * (3 + z1 + 2 * z2));
  return (rs / 2) * rIsco;
}

/** Photon sphere in km — the radius where light itself orbits. */
export function photonSphereKm(massSol) {
  return 1.5 * schwarzschildKm(massSol);
}

/**
 * Tidal disruption radius in km: how close a body of the given bulk
 * density can come before the hole pulls it apart. For a stellar-mass
 * hole this sits OUTSIDE the horizon, which is why such holes shred
 * things visibly instead of swallowing them whole.
 */
export function tidalDisruptionKm(massSol, bodyDensityGcc = 3) {
  const mKg = massSol * SOLAR_MASS_KG;
  const rho = Math.max(0.05, bodyDensityGcc) * 1000;
  return Math.cbrt(mKg / rho) * 1.26 / 1000;
}

/** Hawking temperature in kelvin — only meaningful for tiny holes. */
export function hawkingTempK(massSol) {
  return 6.169e-8 / Math.max(1e-12, massSol);
}

/** Surface gravity of a remnant, in Earth g. */
export function remnantGravityG(massSol, radiusKmValue) {
  const r = Math.max(0.001, radiusKmValue) * 1000;
  return (G_SI * massSol * SOLAR_MASS_KG) / (r * r) / 9.80665;
}

/* ── lookups ─────────────────────────────────────────────────────── */

export const ASTEROID = Object.fromEntries(ASTEROID_CLASSES.map(a => [a.id, a]));
export const COMET = Object.fromEntries(COMET_CLASSES.map(c => [c.id, c]));
export const REMNANT = Object.fromEntries(REMNANT_CLASSES.map(r => [r.id, r]));

/** Asteroid classes that can form at this temperature. */
export function asteroidsAt(tempK) {
  return ASTEROID_CLASSES.filter(a => tempK >= a.T[0] && tempK <= a.T[1]);
}

/** Comet classes consistent with an eccentricity and remaining volatiles. */
export function cometsFor(e, volatiles) {
  return COMET_CLASSES.filter(c => {
    if (e < c.e[0] || e > c.e[1]) return false;
    if (volatiles !== undefined && (volatiles < c.volatiles[0] || volatiles > c.volatiles[1])) return false;
    return true;
  });
}
