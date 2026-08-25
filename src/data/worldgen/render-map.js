// Living Galaxy — how a world class gets drawn.
//
// The catalogue knows 49 classes. `data/planetary/planets.js` knows 20 ways to draw a
// planet — a colour, a glow, an emissive strength, an atmosphere shell and a gravity figure
// that the warp-well code reads. Those two numbers are different on purpose and neither is
// wrong: the catalogue is cut by *physics*, and a Dune Sea and a Steppe World are genuinely
// different places with genuinely different ores. The render table is cut by *appearance*,
// and from orbit both of them are a dry brown ball.
//
// So this is the join, and it is a separate file for two reasons.
//
// **The catalogue stays pristine.** `worlds.js`, `atmospheres.js`, `minerals.js` and
// `smallbodies.js` are byte-identical to the generator they came from. When that generator
// gains a class or retunes a band, the update is a copy rather than a merge. Every LG-side
// opinion about the catalogue lives in this file instead of being sprinkled through it.
//
// **Completeness is testable.** A class with no mapping would silently fall back to a
// default and draw as the wrong thing — the exact failure mode of a hand-kept list, and one
// that shows up as "why is that ice world brown" three weeks later. `test/worldgen.mjs`
// asserts this map covers every class in the catalogue and names no render type that
// `PLANET_TYPES` does not define, so both halves fail loudly rather than drifting.
//
// Several classes share a render type, and a couple of LG's render types are unreachable
// from here — `crystalline` and `superEarth` are authored Solaris worlds with no catalogue
// equivalent. Both are fine. This is a projection, not a bijection, and the test asserts
// coverage in the direction that matters: every class can be drawn.

/** Catalogue class id → `PLANET_TYPES` key. */
export const RENDER_TYPE = {
  // ── inferno ────────────────────────────────────────────────────────
  lava:                 'lava',
  magma_ocean:          'molten',
  chthonian:            'ironCore',      // a stripped giant core: dense, metallic, dead
  ablating:             'molten',
  carbon_furnace:       'carbon',

  // ── hot ────────────────────────────────────────────────────────────
  scorched_rock:        'barren',
  venusian:             'toxic',
  sulphur_hell:         'sulfur',
  halogen_world:        'toxic',
  steam_world:          'ocean',         // it is an ocean, and it is boiling
  cinder:               'barren',

  // ── warm and dry ───────────────────────────────────────────────────
  desert:               'desert',
  dune_sea:             'desert',
  terran_dry:           'desert',
  savannah:             'terrestrial',
  greenhouse_temperate: 'toxic',        // shrouded and running away; not a green world

  // ── temperate ──────────────────────────────────────────────────────
  terran:               'terrestrial',
  ocean:                'ocean',
  archipelago:          'ocean',
  jungle:               'terrestrial',
  terminator:           'barren',        // tidally locked: one face burnt, one frozen
  tundra:               'tundra',
  taiga:                'terrestrial',

  // ── cold and volatile-rich ─────────────────────────────────────────
  haze_world:           'methaneSea',    // Titan: orange smog over liquid hydrocarbon
  ammonia_world:        'methaneSea',
  ice:                  'ice',
  glacier:              'ice',
  subsurface_ocean:     'ice',           // the ocean is under the shell; the shell is what shows
  cryovolcanic:         'methaneIce',
  dark_ice:             'methaneIce',
  nitrogen_world:       'methaneIce',

  // ── dead ───────────────────────────────────────────────────────────
  barren:               'barren',
  iron_world:           'ironCore',
  shattered:            'barren',
  radiogenic:           'radioactive',

  // ── giants ─────────────────────────────────────────────────────────
  gas_giant:            'gasGiant',
  ice_giant:            'methaneGiant',
  hot_jupiter:          'gasGiant',
  warm_neptune:         'methaneGiant',
  sub_neptune:          'methaneGiant',
  puffball:             'gasGiant',
  helium_giant:         'heliumGiant',
  ringed_giant:         'gasGiant',

  // ── moons ──────────────────────────────────────────────────────────
  tidal_forge:          'lava',          // Io: heated from inside, not by the star
  ice_moon:             'ice',
  ocean_moon:           'ocean',
  captured_rock:        'barren',
  regolith_moon:        'barren',
  shepherd_moon:        'barren'
};

/**
 * The render type for a class id.
 *
 * Falls back to `barren` rather than throwing, because a missing mapping should not be able
 * to black-screen a system mid-flight — but the test above is what makes sure the fallback
 * is never actually reached, so this is a seatbelt and not a strategy.
 */
export const renderTypeFor = classId => RENDER_TYPE[classId] || 'barren';
