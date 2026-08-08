// Living Galaxy — surface features.
//
// Before this, every world of a given type was the same world. Two barren rocks had
// identical resources, identical scans and identical reasons to visit, so once you had
// seen one you had seen the class — and a survey was a formality you performed to unlock
// the site rather than something you did to *find* anything.
//
// A feature is a specific thing on a specific body, seeded from the world name, that you
// only learn about by resolving the body properly. It is the reason to go back to a planet
// you have already scanned, and the reason two `barren` worlds are worth different amounts.
//
// Three deliberate constraints:
//
//   **Requirements are declared, not whitelisted.** A feature says "solid ground, no
//   atmosphere, cold" — it does not list the eleven planet types that currently satisfy
//   that. The planet table has grown twice already and a whitelist silently stops covering
//   it. (Same lesson as the facilities table in v1.00.20.)
//
//   **Effects land in systems that already exist.** `assay` feeds the same permanent
//   per-world bonus a survey crew raises, which planetary extraction already pays on.
//   `probe` scales probe telemetry. `scan` offsets atmospheric interference. Nothing here
//   invents a currency.
//
//   **Discovery is derived, not stored.** Which features you know about is a function of
//   the resolution you have achieved on that body and whether you have put a probe down —
//   both already persisted. No new save field, and a save from v1.00.34 knows everything
//   it has earned the moment it loads.

/**
 * `needs` is checked against a world descriptor built in systems/survey.js from the
 * existing trait derivation. Every key is optional; all present keys must hold.
 *
 *   solid / liquid / gas / water / atmo / temperate — booleans from traits()
 *   tempMax / tempMin — the body's own temperature, °C
 *   gravityMin / gravityMax — the body's gravity
 *   moon — true: moons only. false: never on a moon.
 *   rings — ringed bodies only
 *
 * `tier` is the scan resolution at which the feature becomes visible. 4 means a full
 * survey will find it from orbit; `probe: true` means only telemetry from the ground will.
 */
export const FEATURES = {
  // ── solid ground ───────────────────────────────────────────────────
  impactBasin: {
    name: 'Ancient impact basin', icon: '◍', tier: 3,
    needs: { solid: true },
    assay: 0.10, probe: 1.15,
    desc: 'Something very large arrived a long time ago and turned the mantle inside out. ' +
          'Deep-crust metals are lying on the surface.'
  },
  riftCanyon: {
    name: 'Rift canyon system', icon: '⋀', tier: 3,
    needs: { solid: true },
    assay: 0.08, probe: 1.10,
    desc: 'Kilometres of exposed strata. A survey team can read the whole geological ' +
          'history off the wall instead of drilling for it.'
  },
  metallicVein: {
    name: 'Exposed metallic veins', icon: '≣', tier: 4,
    needs: { solid: true, atmo: false },
    assay: 0.16,
    desc: 'No weather to bury them and no water to leach them. The veins are where they ' +
          'cooled, and they run.'
  },
  cryoVents: {
    name: 'Cryovolcanic vents', icon: '⁂', tier: 3,
    needs: { solid: true, tempMax: -80 },
    assay: 0.14, probe: 1.20,
    desc: 'Volatiles under pressure, venting to the surface. Whatever is down there comes ' +
          'up to meet the cutter.'
  },
  lavaTubes: {
    name: 'Stable lava tubes', icon: '⌒', tier: 4, probe: true,
    needs: { solid: true, tempMin: 100 },
    assay: 0.09, site: 0.12,
    desc: 'Kilometres of pre-dug, radiation-shielded, pressure-holding void. Half a ' +
          'habitat that somebody else already excavated.'
  },
  glassPlains: {
    name: 'Vitrified plains', icon: '▨', tier: 4,
    needs: { solid: true },
    assay: 0.11,
    desc: 'Shock-melted silica frozen flat to the horizon. Optical-grade quartz you can ' +
          'lift off the ground in sheets.'
  },
  saltFlats: {
    name: 'Evaporite flats', icon: '▤', tier: 3,
    needs: { solid: true, atmo: true, tempMin: -40 },
    assay: 0.12,
    desc: 'A sea that dried out and left its lithium and its brines behind in bands you ' +
          'can walk along.'
  },

  // ── water and liquid ───────────────────────────────────────────────
  hydroVents: {
    name: 'Hydrothermal vent field', icon: '❋', tier: 4, probe: true,
    needs: { water: true },
    assay: 0.15, probe: 1.35, anomaly: true,
    desc: 'Chemistry running on heat instead of light, at the bottom of a column nobody ' +
          'has been to. This is where the interesting samples come from.'
  },
  brineChannels: {
    name: 'Subsurface brine channels', icon: '≋', tier: 4, probe: true,
    needs: { water: true, tempMax: 20 },
    assay: 0.13, probe: 1.15,
    desc: 'Liquid moving under the shell, salty enough not to freeze. It maps like a river ' +
          'system and it carries everything dissolved in it.'
  },

  // ── biology ────────────────────────────────────────────────────────
  microbialMat: {
    name: 'Extremophile mats', icon: '❖', tier: 4, probe: true,
    needs: { solid: true },
    assay: 0.10, probe: 1.40, anomaly: true,
    desc: 'Living, and living somewhere it has no business living. Sample value is in the ' +
          'genetics, not the biomass.'
  },
  forestBelt: {
    name: 'Continental biome belt', icon: '✦', tier: 3,
    needs: { temperate: true, atmo: true },
    assay: 0.14, probe: 1.25,
    desc: 'Standing biomass across a whole latitude band. A hydroponics facility here is ' +
          'topping up rather than starting from nothing.'
  },

  // ── atmosphere and giants ──────────────────────────────────────────
  polarVortex: {
    name: 'Stable polar vortex', icon: '◉', tier: 3,
    needs: { gas: true },
    assay: 0.10, scan: 0.35,
    desc: 'A permanent hole in the cloud deck. A skyhook parked over it looks straight ' +
          'down into the atmosphere, and so does your dish.'
  },
  heliumBand: {
    name: 'Helium-3 enriched band', icon: '≡', tier: 4, probe: true,
    needs: { gas: true },
    assay: 0.18,
    desc: 'A latitude where the isotope fraction runs far above the planetary average. ' +
          'The difference between a skyhook that pays and one that does not.'
  },
  stormAnchor: {
    name: 'Anchored megastorm', icon: '@', tier: 3,
    needs: { atmo: true },
    scan: -0.25, probe: 1.10,
    desc: 'A cyclone the size of a moon that has been in the same place for centuries. ' +
          'It plays havoc with a return, and it is a landmark you can navigate by.'
  },

  // ── moons ──────────────────────────────────────────────────────────
  tidalHeating: {
    name: 'Tidal heat anomaly', icon: '◑', tier: 3,
    needs: { moon: true },
    assay: 0.16, probe: 1.15,
    desc: 'The primary is doing the work a star would have to do. Warm ground on a body ' +
          'that has no right to any.'
  },
  regolithIce: {
    name: 'Shadowed crater ice', icon: '☾', tier: 4,
    needs: { moon: true, atmo: false },
    assay: 0.12,
    desc: 'Crater floors that have not seen the star since they formed, with water sitting ' +
          'in them. The cheapest volatiles in the system, if you can land in the dark.'
  },

  // ── rings ──────────────────────────────────────────────────────────
  shepherdGap: {
    name: 'Shepherd-moon gap', icon: '◎', tier: 3,
    needs: { rings: true },
    assay: 0.08, scan: 0.20,
    desc: 'A swept lane through the ring where a small moon has cleared its own path. The ' +
          'quiet corridor everybody parks in.'
  },

  // ── the unexplained ────────────────────────────────────────────────
  magneticAnomaly: {
    name: 'Crustal magnetic anomaly', icon: '⌖', tier: 4, probe: true,
    needs: { solid: true },
    assay: 0.09, probe: 1.30, anomaly: true, scan: -0.30,
    desc: 'A field where there should be no field, over a region where there should be no ' +
          'region. Instruments disagree with each other above it.'
  },
  derelictSignal: {
    name: 'Repeating surface signal', icon: '☍', tier: 4, probe: true,
    needs: {},
    probe: 1.50, anomaly: true,
    desc: 'Narrowband, periodic, and older than the charts. Nobody has claimed it and ' +
          'nobody at any station will discuss it on an open channel.'
  }
};

export const FEATURE_KEYS = Object.keys(FEATURES);

/**
 * Does this world satisfy a feature's requirements?
 * `w` is the descriptor built by systems/survey.js: traits plus the body's own numbers.
 *
 * Note the `atmo: false` handling. `needs.atmo === false` must mean "airless only", not
 * "don't care" — an undeclared key is don't-care and a declared false is a requirement.
 * Testing `if (needs.atmo)` would have collapsed the two and put exposed metallic veins on
 * every toxic greenhouse in the system.
 */
export function featureFits(def, w) {
  const n = def.needs || {};
  for (const k of ['solid', 'liquid', 'gas', 'water', 'atmo', 'temperate', 'moon', 'rings']) {
    if (k in n && !!w[k] !== !!n[k]) return false;
  }
  if ('tempMax' in n && !(w.tempC <= n.tempMax)) return false;
  if ('tempMin' in n && !(w.tempC >= n.tempMin)) return false;
  if ('gravityMin' in n && !(w.gravity >= n.gravityMin)) return false;
  if ('gravityMax' in n && !(w.gravity <= n.gravityMax)) return false;
  return true;
}

/** Every feature this world could physically have, in table order. */
export const eligibleFeatures = w => FEATURE_KEYS.filter(k => featureFits(FEATURES[k], w));
