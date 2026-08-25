/**
 * ATMOSPHERE ARCHETYPES
 *
 * An atmosphere is not a label, it is a composition. Every entry lists the
 * gases and their mole fractions, and the mean molar mass is DERIVED from
 * that list rather than typed in — so a composition can be edited without
 * anyone remembering to update a second number that has to agree with it.
 *
 * Mean molar mass is the whole point. It is what decides, through Jeans
 * escape in units.js, whether a given world can actually keep this air:
 *
 *   - a hydrogen envelope (M = 2) needs a giant's escape velocity
 *   - nitrogen-oxygen (M ~ 29) is holdable by an Earth
 *   - a hot Mars loses even CO2
 *
 * So `worlds.js` may PROPOSE an atmosphere for a class, but the retention
 * check in taxonomy.js can VETO it and fall back down the list to
 * something heavier. That is why each world class carries a candidate
 * list, ordered thickest-and-lightest first: the physics picks from it.
 *
 * FIELDS
 *   composition   [{ gas, frac }] — mole fractions, should sum to ~1
 *   columnScale   intrinsic thickness, in Earth-atmosphere columns, before
 *                 gravity and volatile inventory scale it (see units.js)
 *   greenhouse    multiplier on equilibrium temperature
 *   albedo        bond albedo contributed by the air and its clouds
 *   T             [min, max] kelvin band in which this air is stable
 *   haze          render tint for the limb / halo shader
 *   opacity       0 clear .. 1 fully opaque from orbit
 *   breathable    true only for the handful a human could survive
 *   corrosive     eats hulls; drives station siting and mining cost
 *
 * Pure data + pure functions. No DOM, no three.js.
 */

/** Molar masses in g/mol. The one place a chemical constant is written. */
export const MOLAR = {
  H2: 2.016,   He: 4.003,   CH4: 16.04,  NH3: 17.03,  H2O: 18.015,
  Ne: 20.18,   HF: 20.01,   Na: 22.99,   CO: 28.01,   N2: 28.013,
  C2H6: 30.07, O2: 31.999,  H2S: 34.08,  PH3: 34.00,  HCl: 36.46,
  Ar: 39.95,   K: 39.10,    O3: 48.00,   CO2: 44.01,  N2O: 44.01,
  SiO: 44.08,  HCN: 27.03,  Fe: 55.85,   OCS: 60.08,  TiO: 63.87,
  SO2: 64.07,  VO: 66.94,   Cl2: 70.90,  CS2: 76.13,  Kr: 83.80,
  H2SO4: 98.08, MgSiO3: 100.39, Xe: 131.29, Rn: 222.0, S8: 256.5
};

/** Human-readable gas names, for dossier prose. */
export const GAS_NAME = {
  H2: 'hydrogen', He: 'helium', CH4: 'methane', NH3: 'ammonia',
  H2O: 'water vapour', Ne: 'neon', HF: 'hydrogen fluoride', Na: 'sodium vapour',
  CO: 'carbon monoxide', N2: 'nitrogen', C2H6: 'ethane', O2: 'oxygen',
  H2S: 'hydrogen sulphide', PH3: 'phosphine', HCl: 'hydrogen chloride',
  Ar: 'argon', K: 'potassium vapour', O3: 'ozone', CO2: 'carbon dioxide',
  N2O: 'nitrous oxide', SiO: 'silicon monoxide', HCN: 'hydrogen cyanide',
  Fe: 'iron vapour', OCS: 'carbonyl sulphide', TiO: 'titanium oxide',
  SO2: 'sulphur dioxide', VO: 'vanadium oxide', Cl2: 'chlorine',
  CS2: 'carbon disulphide', Kr: 'krypton', H2SO4: 'sulphuric acid',
  MgSiO3: 'enstatite vapour', Xe: 'xenon', Rn: 'radon', S8: 'sulphur vapour'
};

const A = [

/* ── none ─────────────────────────────────────────────────────────── */
{ id: 'none', label: 'Vacuum', composition: [], columnScale: 0,
  greenhouse: 1.0, albedo: 0.12, T: [0, 6000], haze: 0x000000, opacity: 0,
  blurb: 'No measurable envelope. Surface exposed directly to space.' },

// `unbound` marks an envelope that is NOT gravitationally retained and is
// not supposed to be: an exosphere is a steady state between sputtering
// and escape, so applying the Jeans retention test to it asks the wrong
// question and always fails. The classifier and the audit both skip it.
{ id: 'exosphere', label: 'Exospheric Trace', columnScale: 1e-9, unbound: true,
  composition: [{ gas: 'He', frac: 0.4 }, { gas: 'Na', frac: 0.3 }, { gas: 'O2', frac: 0.3 }],
  greenhouse: 1.0, albedo: 0.11, T: [50, 1200], haze: 0x554433, opacity: 0.02,
  blurb: 'Sputtered atoms, never dense enough to collide with each other.' },

/* ── hydrogen-dominated: giants and sub-Neptunes ──────────────────── */
{ id: 'h2_primordial', label: 'Primordial Hydrogen', columnScale: 24000,
  composition: [{ gas: 'H2', frac: 0.88 }, { gas: 'He', frac: 0.115 }, { gas: 'CH4', frac: 0.005 }],
  greenhouse: 1.0, albedo: 0.50, T: [30, 900], haze: 0xd8c3a0, opacity: 1,
  blurb: 'Nebular gas captured whole and never lost. Banded, tenacious, deep.' },

{ id: 'h2_ammonia_cloud', label: 'Ammonia Cloud Deck', columnScale: 21000,
  composition: [{ gas: 'H2', frac: 0.86 }, { gas: 'He', frac: 0.12 }, { gas: 'NH3', frac: 0.015 }, { gas: 'CH4', frac: 0.005 }],
  greenhouse: 1.0, albedo: 0.55, T: [60, 200], haze: 0xe8d9b8, opacity: 1,
  blurb: 'White ammonia-ice cirrus over a hydrogen ocean. The classic banded giant.' },

{ id: 'h2_methane_blue', label: 'Methane Blue', columnScale: 12000,
  composition: [{ gas: 'H2', frac: 0.80 }, { gas: 'He', frac: 0.17 }, { gas: 'CH4', frac: 0.03 }],
  greenhouse: 1.0, albedo: 0.42, T: [30, 130], haze: 0x4fa8d8, opacity: 1,
  blurb: 'Methane absorbs the red and leaves the world a deep, cold blue.' },

{ id: 'h2_hot_silicate', label: 'Silicate Cloud Furnace', columnScale: 18000,
  composition: [{ gas: 'H2', frac: 0.82 }, { gas: 'He', frac: 0.14 }, { gas: 'SiO', frac: 0.02 }, { gas: 'Na', frac: 0.01 }, { gas: 'K', frac: 0.01 }],
  greenhouse: 1.0, albedo: 0.06, T: [1200, 3000], haze: 0x774433, opacity: 1,
  blurb: 'Rock condenses into clouds and rains molten. Sodium lines burn in the limb.' },

{ id: 'h2_soot', label: 'Sooty Hydrogen', columnScale: 16000,
  composition: [{ gas: 'H2', frac: 0.84 }, { gas: 'He', frac: 0.13 }, { gas: 'C2H6', frac: 0.02 }, { gas: 'HCN', frac: 0.01 }],
  greenhouse: 1.0, albedo: 0.03, T: [700, 1600], haze: 0x140f0c, opacity: 1,
  blurb: 'Photochemical soot makes this world darker than charcoal.' },

{ id: 'h2_helium_stripped', label: 'Helium-Stripped Envelope', columnScale: 3000,
  composition: [{ gas: 'He', frac: 0.93 }, { gas: 'H2', frac: 0.04 }, { gas: 'CO', frac: 0.03 }],
  greenhouse: 1.0, albedo: 0.30, T: [400, 2000], haze: 0xd9d0c4, opacity: 0.9,
  blurb: 'Hydrogen boiled off first; what is left is heavy, inert and shrinking.' },

{ id: 'h2_thin_puffy', label: 'Puffed Envelope', columnScale: 900,
  composition: [{ gas: 'H2', frac: 0.72 }, { gas: 'He', frac: 0.20 }, { gas: 'H2O', frac: 0.08 }],
  greenhouse: 1.6, albedo: 0.28, T: [300, 1100], haze: 0xc9b7d8, opacity: 0.8,
  blurb: 'An envelope so inflated by heat it is barely gravitationally bound.' },

/* ── volatile / steam / ice worlds ────────────────────────────────── */
{ id: 'steam', label: 'Steam Envelope', columnScale: 260,
  composition: [{ gas: 'H2O', frac: 0.93 }, { gas: 'CO2', frac: 0.05 }, { gas: 'N2', frac: 0.02 }],
  greenhouse: 2.4, albedo: 0.60, T: [370, 1400], haze: 0xf0f4f8, opacity: 0.95,
  blurb: 'An entire ocean in the air. Total cloud cover, runaway from below.' },

{ id: 'supercritical_water', label: 'Supercritical Hydrosphere', columnScale: 1400,
  composition: [{ gas: 'H2O', frac: 0.97 }, { gas: 'CO2', frac: 0.03 }],
  greenhouse: 3.1, albedo: 0.45, T: [647, 2200], haze: 0xbfe0e8, opacity: 1,
  blurb: 'No surface, no sky — water past its critical point, graded all the way down.' },

{ id: 'n2_o2', label: 'Nitrogen-Oxygen', columnScale: 1.0,
  composition: [{ gas: 'N2', frac: 0.77 }, { gas: 'O2', frac: 0.21 }, { gas: 'Ar', frac: 0.009 }, { gas: 'CO2', frac: 0.001 }, { gas: 'H2O', frac: 0.01 }],
  greenhouse: 1.13, albedo: 0.30, T: [230, 340], haze: 0x9ec8f0, opacity: 0.25,
  breathable: true,
  blurb: 'Free oxygen out of chemical equilibrium — something down there is making it.' },

{ id: 'n2_o2_rich', label: 'Oxygen-Rich', columnScale: 1.6,
  composition: [{ gas: 'N2', frac: 0.62 }, { gas: 'O2', frac: 0.35 }, { gas: 'Ar', frac: 0.02 }, { gas: 'CO2', frac: 0.01 }],
  greenhouse: 1.10, albedo: 0.31, T: [240, 330], haze: 0xbfe4ff, opacity: 0.3,
  breathable: true,
  blurb: 'Thick and oxygen-heavy. Fires here are hard to stop once started.' },

{ id: 'n2_thin', label: 'Thin Nitrogen', columnScale: 0.012,
  composition: [{ gas: 'N2', frac: 0.95 }, { gas: 'CH4', frac: 0.04 }, { gas: 'CO', frac: 0.01 }],
  greenhouse: 1.02, albedo: 0.22, T: [60, 200], haze: 0xd0dce8, opacity: 0.08,
  blurb: 'Barely enough air to raise dust, and it freezes out every winter.' },

{ id: 'n2_organic_haze', label: 'Organic Haze', columnScale: 1.45,
  composition: [{ gas: 'N2', frac: 0.94 }, { gas: 'CH4', frac: 0.05 }, { gas: 'C2H6', frac: 0.006 }, { gas: 'HCN', frac: 0.004 }],
  greenhouse: 1.21, albedo: 0.22, T: [70, 210], haze: 0xd9a24e, opacity: 0.9,
  blurb: 'Sunlight cracks the methane and the fragments fall as orange tholin snow.' },

{ id: 'co2_thick', label: 'Dense Carbon Dioxide', columnScale: 90,
  composition: [{ gas: 'CO2', frac: 0.965 }, { gas: 'N2', frac: 0.03 }, { gas: 'SO2', frac: 0.005 }],
  greenhouse: 2.9, albedo: 0.75, T: [400, 900], haze: 0xe8d9a8, opacity: 1,
  corrosive: true,
  blurb: 'A runaway that never stopped. The ground is hot enough to glow in the dark.' },

{ id: 'co2_thin', label: 'Thin Carbon Dioxide', columnScale: 0.006,
  composition: [{ gas: 'CO2', frac: 0.95 }, { gas: 'N2', frac: 0.03 }, { gas: 'Ar', frac: 0.02 }],
  greenhouse: 1.05, albedo: 0.25, T: [130, 300], haze: 0xd8a882, opacity: 0.15,
  blurb: 'What is left after a magnetic field died and the solar wind did the rest.' },

{ id: 'co2_temperate', label: 'Carbonate Greenhouse', columnScale: 3.2,
  composition: [{ gas: 'CO2', frac: 0.70 }, { gas: 'N2', frac: 0.28 }, { gas: 'H2O', frac: 0.02 }],
  greenhouse: 1.7, albedo: 0.35, T: [250, 360], haze: 0xd6c39a, opacity: 0.45,
  blurb: 'Warm, wet and heavy. A carbon cycle that has not yet found its balance.' },

/* ── sulphur, acid, halogen: the hostile middle ───────────────────── */
{ id: 'sulphuric', label: 'Sulphuric Acid Cloud', columnScale: 92,
  composition: [{ gas: 'CO2', frac: 0.94 }, { gas: 'N2', frac: 0.035 }, { gas: 'SO2', frac: 0.015 }, { gas: 'H2SO4', frac: 0.01 }],
  greenhouse: 3.4, albedo: 0.77, T: [420, 780], haze: 0xf2e2a0, opacity: 1,
  corrosive: true,
  blurb: 'It rains acid that boils away before it lands. Nothing metal lasts a season.' },

{ id: 'so2_volcanic', label: 'Volcanic Sulphur', columnScale: 0.9,
  composition: [{ gas: 'SO2', frac: 0.72 }, { gas: 'H2S', frac: 0.14 }, { gas: 'CO2', frac: 0.10 }, { gas: 'S8', frac: 0.04 }],
  greenhouse: 1.9, albedo: 0.42, T: [200, 700], haze: 0xe8c24a, opacity: 0.7,
  corrosive: true,
  blurb: 'Resupplied continuously from below. Yellow frost rings every vent.' },

{ id: 'halogen', label: 'Halogen Burn', columnScale: 4.5,
  composition: [{ gas: 'Cl2', frac: 0.42 }, { gas: 'HCl', frac: 0.30 }, { gas: 'HF', frac: 0.16 }, { gas: 'CO2', frac: 0.12 }],
  greenhouse: 1.8, albedo: 0.28, T: [280, 800], haze: 0xa8d84a, opacity: 0.8,
  corrosive: true,
  blurb: 'Green, dense and violently reactive. Etches ceramic, let alone flesh.' },

{ id: 'cyanide_smog', label: 'Cyanide Smog', columnScale: 2.1,
  composition: [{ gas: 'N2', frac: 0.55 }, { gas: 'HCN', frac: 0.25 }, { gas: 'CO', frac: 0.14 }, { gas: 'CH4', frac: 0.06 }],
  greenhouse: 1.5, albedo: 0.20, T: [220, 450], haze: 0x8a9a3a, opacity: 0.85,
  corrosive: true,
  blurb: 'Prebiotic chemistry that took a wrong turn and kept going.' },

{ id: 'phosphine_reducing', label: 'Reducing Phosphine', columnScale: 6.0,
  composition: [{ gas: 'N2', frac: 0.50 }, { gas: 'CH4', frac: 0.25 }, { gas: 'NH3', frac: 0.15 }, { gas: 'PH3', frac: 0.10 }],
  greenhouse: 2.1, albedo: 0.26, T: [240, 420], haze: 0xb08a5a, opacity: 0.75,
  corrosive: true,
  blurb: 'Deeply reducing, faintly luminous at night, and instantly fatal.' },

{ id: 'carbon_monoxide', label: 'Carbon Monoxide Shroud', columnScale: 1.8,
  composition: [{ gas: 'CO', frac: 0.78 }, { gas: 'CO2', frac: 0.14 }, { gas: 'N2', frac: 0.08 }],
  greenhouse: 1.3, albedo: 0.24, T: [150, 500], haze: 0x9a8878, opacity: 0.4,
  blurb: 'Odourless, colourless, and it kills without any warning at all.' },

/* ── rock vapour: the inferno zone ────────────────────────────────── */
{ id: 'rock_vapour', label: 'Silicate Vapour', columnScale: 0.35,
  composition: [{ gas: 'SiO', frac: 0.52 }, { gas: 'Na', frac: 0.20 }, { gas: 'O2', frac: 0.16 }, { gas: 'MgSiO3', frac: 0.12 }],
  greenhouse: 1.25, albedo: 0.08, T: [1600, 4000], haze: 0xff9a5a, opacity: 0.6,
  blurb: 'The crust itself, boiled into the sky. It snows glass on the night side.' },

{ id: 'metal_vapour', label: 'Metal Vapour', columnScale: 0.5,
  composition: [{ gas: 'Fe', frac: 0.46 }, { gas: 'Na', frac: 0.22 }, { gas: 'SiO', frac: 0.18 }, { gas: 'TiO', frac: 0.08 }, { gas: 'VO', frac: 0.06 }],
  greenhouse: 1.4, albedo: 0.04, T: [2200, 5000], haze: 0xffb060, opacity: 0.7,
  blurb: 'Iron rain condenses on the terminator and falls back into the magma.' },

{ id: 'sodium_tail', label: 'Sodium Comet Tail', columnScale: 0.02,
  composition: [{ gas: 'Na', frac: 0.58 }, { gas: 'K', frac: 0.22 }, { gas: 'SiO', frac: 0.20 }],
  greenhouse: 1.0, albedo: 0.05, T: [1500, 3500], haze: 0xffd070, opacity: 0.3,
  blurb: 'Ablating so fast the escaping vapour trails behind it like a comet.' },

/* ── frozen outer / exotic ────────────────────────────────────────── */
{ id: 'methane_frost', label: 'Methane Frost Layer', columnScale: 0.0002,
  composition: [{ gas: 'CH4', frac: 0.62 }, { gas: 'N2', frac: 0.32 }, { gas: 'CO', frac: 0.06 }],
  greenhouse: 1.01, albedo: 0.55, T: [25, 90], haze: 0xe0e8f0, opacity: 0.05,
  blurb: 'Sublimates at perihelion, snows back out at aphelion. A breathing world.' },

{ id: 'nitrogen_glacier', label: 'Nitrogen Glacier Vapour', columnScale: 0.00001,
  composition: [{ gas: 'N2', frac: 0.98 }, { gas: 'CH4', frac: 0.015 }, { gas: 'CO', frac: 0.005 }],
  greenhouse: 1.0, albedo: 0.72, T: [20, 70], haze: 0xf4f8ff, opacity: 0.03,
  blurb: 'Nitrogen ice flows like a glacier and exhales a whisper of air above it.' },

{ id: 'neon_frost', label: 'Neon Exosphere', columnScale: 1e-6,
  composition: [{ gas: 'Ne', frac: 0.71 }, { gas: 'He', frac: 0.20 }, { gas: 'Ar', frac: 0.09 }],
  greenhouse: 1.0, albedo: 0.60, T: [5, 45], haze: 0xffb0d0, opacity: 0.02,
  blurb: 'Cold enough that even neon condenses. Glows faintly under stellar wind.' },

{ id: 'noble_dense', label: 'Dense Noble Blanket', columnScale: 14,
  composition: [{ gas: 'Ar', frac: 0.52 }, { gas: 'Kr', frac: 0.26 }, { gas: 'Xe', frac: 0.14 }, { gas: 'N2', frac: 0.08 }],
  greenhouse: 1.15, albedo: 0.18, T: [90, 400], haze: 0xc0c8d8, opacity: 0.35,
  blurb: 'Chemically dead and unusually heavy — an outgassed radiogenic remnant.' },

{ id: 'radon_hot', label: 'Radiogenic Haze', columnScale: 0.8,
  composition: [{ gas: 'Rn', frac: 0.34 }, { gas: 'He', frac: 0.36 }, { gas: 'CO2', frac: 0.30 }],
  greenhouse: 1.2, albedo: 0.14, T: [180, 600], haze: 0x7fd8b0, opacity: 0.45,
  corrosive: true,
  blurb: 'The decay chain of a crust too rich in heavy elements. Ionising, always.' },

{ id: 'ammonia_ocean_vapour', label: 'Ammonia Vapour', columnScale: 2.6,
  composition: [{ gas: 'NH3', frac: 0.58 }, { gas: 'N2', frac: 0.30 }, { gas: 'H2O', frac: 0.08 }, { gas: 'CH4', frac: 0.04 }],
  greenhouse: 1.55, albedo: 0.40, T: [180, 300], haze: 0xc8d8b8, opacity: 0.55,
  corrosive: true,
  blurb: 'Ammonia-water eutectic stays liquid far colder than water alone can.' }

];

/** Mean molar mass in g/mol, derived from the composition. */
export function meanMolarMass(atm) {
  if (!atm || !atm.composition || !atm.composition.length) return 28.97;
  let total = 0, frac = 0;
  for (const c of atm.composition) {
    const m = MOLAR[c.gas];
    if (m === undefined) continue;
    total += m * c.frac;
    frac += c.frac;
  }
  return frac > 0 ? total / frac : 28.97;
}

/** The lightest gas present — the one that escapes first. */
export function lightestGas(atm) {
  if (!atm || !atm.composition || !atm.composition.length) return null;
  let best = null;
  for (const c of atm.composition) {
    const m = MOLAR[c.gas];
    if (m === undefined) continue;
    if (!best || m < best.molar) best = { gas: c.gas, molar: m, frac: c.frac };
  }
  return best;
}

/** Short prose description of what the air is made of. */
export function describeComposition(atm, top = 3) {
  if (!atm || !atm.composition.length) return 'no envelope';
  return atm.composition
    .slice()
    .sort((a, b) => b.frac - a.frac)
    .slice(0, top)
    .map(c => `${GAS_NAME[c.gas] || c.gas} ${(c.frac * 100).toFixed(c.frac < 0.01 ? 2 : 0)}%`)
    .join(', ');
}

/* Freeze derived values onto every entry once, at module load. */
for (const atm of A) {
  atm.molarMass = meanMolarMass(atm);
  atm.lightest = lightestGas(atm);
  atm.breathable = !!atm.breathable;
  atm.corrosive = !!atm.corrosive;
}

export const ATMOSPHERES = A;
export const ATMOSPHERE = Object.fromEntries(A.map(a => [a.id, a]));
export function atmosphereById(id) { return ATMOSPHERE[id] || ATMOSPHERE.none; }
