/**
 * WORLD CLASS DATABASE
 *
 * The catalogue of everything a planet or moon can BE, and — more
 * importantly — the conditions under which it can be that thing.
 *
 * THE BUG THIS EXISTS TO KILL
 *
 * The old generator picked a world's kind with a uniform random draw from
 * a flat list of names. Nothing connected the name to the orbit, so an
 * "Ice" world could and did land in the inferno zone, hundreds of degrees
 * past the point where water ice can exist. The label and the physics were
 * two unrelated systems that happened to be printed next to each other.
 *
 * So this catalogue is not a list of names. Every entry declares the
 * envelope of conditions in which it is PHYSICALLY POSSIBLE:
 *
 *   S       insolation band, in solar constants
 *   mass    mass band, in Earth masses
 *   Tsurf   equilibrium-temperature band, in kelvin
 *
 * and the classifier in taxonomy.js selects only from classes whose
 * envelope contains the world's actual, computed conditions. A frozen
 * world in the inferno zone is now not merely unlikely — it is
 * unrepresentable, because no class with `S: [0, 0.16]` will ever match
 * an orbit where S is 60.
 *
 * The S bands deliberately share their boundaries with `surfaceState()`
 * in stellar.js (30 / 4 / 1.5 / 0.35 / 0.12). The classifier and the
 * surface-evolution engine must never be able to disagree about what a
 * temperature means, so they read the same numbers. Bands overlap at the
 * edges on purpose — a world near a boundary could plausibly be either
 * class, and the overlap is what keeps generation from looking banded.
 *
 * FIELDS
 *   id, label, category, blurb
 *   S            [min, max] insolation in solar constants
 *   mass         [min, max] Earth masses
 *   Tsurf        [min, max] equilibrium temperature, kelvin
 *   density      bulk density g/cm^3 (drives physical radius, hence gravity)
 *   albedo       bond albedo
 *   atmosphere   candidate archetype ids, best-fit first; the retention
 *                check in taxonomy.js walks this list and takes the first
 *                the world can actually hold
 *   volatiles    [min, max] starting inventory 0..1
 *   surfaces     SURFACE states this class is consistent with
 *   ores         mineral formation tags this class offers (see minerals.js)
 *   color        render tint
 *   weight       relative draw weight among valid candidates
 *   giant        follows the degenerate mass-radius relation, not the cube root
 *   tidal        heated from inside by its primary rather than by the star
 *
 * Pure data. No DOM, no three.js.
 */

const W = [

/* ══ INFERNO: S > 30. Rock is liquid or gas. ══════════════════════ */

{ id: 'lava', label: 'Lava World', category: 'terrestrial',
  S: [30, 800], mass: [0.05, 5], Tsurf: [1200, 3000], density: 4.4, albedo: 0.07,
  atmosphere: ['rock_vapour', 'metal_vapour', 'exosphere'], volatiles: [0, 0.02],
  surfaces: ['molten'], ores: ['refractory', 'siderophile', 'silicate', 'chalcophile'],
  color: 0xd94418, weight: 1.4,
  blurb: 'A permanent magma ocean on the day side. The terminator is a coastline of stone.' },

{ id: 'magma_ocean', label: 'Magma Ocean World', category: 'terrestrial',
  S: [80, 1e6], mass: [0.6, 12], Tsurf: [1800, 3500], density: 5.0, albedo: 0.05,
  atmosphere: ['metal_vapour', 'rock_vapour'], volatiles: [0, 0.01],
  surfaces: ['molten'], ores: ['refractory', 'siderophile', 'exotic'],
  color: 0xff5a20, weight: 1.0,
  blurb: 'Molten to depth and convecting like a star. Its own glow outshines reflected light.' },

{ id: 'chthonian', label: 'Chthonian Core', category: 'terrestrial',
  S: [60, 1e6], mass: [1, 40], Tsurf: [1400, 3000], density: 8.2, albedo: 0.06,
  atmosphere: ['metal_vapour', 'exosphere'], volatiles: [0, 0.005],
  surfaces: ['molten', 'scorched'], ores: ['siderophile', 'refractory', 'exotic', 'radiogenic'],
  color: 0x9a4030, weight: 0.55,
  blurb: 'The stripped metal heart of a gas giant whose envelope the star took away.' },

{ id: 'ablating', label: 'Ablating World', category: 'terrestrial',
  // Open-ended at the top on purpose. A red giant can push an inner world
  // past S = 10,000, and there has to be a class that covers it — a world
  // receiving that much flux genuinely IS ablating, which is precisely
  // what this class describes. A ceiling here would leave the classifier
  // with nothing valid to choose at the hottest moment of a star's death.
  S: [150, 1e7], mass: [0.02, 0.9], Tsurf: [1500, 3200], density: 4.0, albedo: 0.05,
  atmosphere: ['sodium_tail', 'rock_vapour'], volatiles: [0, 0.005],
  surfaces: ['molten'], ores: ['refractory', 'siderophile'],
  color: 0xffa040, weight: 0.5,
  blurb: 'Losing mass fast enough to trail a visible tail. It will not survive the epoch.' },

{ id: 'carbon_furnace', label: 'Carbon Furnace', category: 'terrestrial',
  S: [30, 400], mass: [0.3, 8], Tsurf: [1100, 2400], density: 4.8, albedo: 0.04,
  atmosphere: ['h2_soot', 'rock_vapour'], volatiles: [0, 0.02],
  surfaces: ['molten', 'scorched'], ores: ['carbon', 'refractory', 'exotic'],
  color: 0x2a1a16, weight: 0.45,
  blurb: 'Carbon-rich to the core. A graphite crust over a mantle of diamond.' },

/* ══ SCORCHED: 4 < S < 30. Nothing volatile survives. ═════════════ */

{ id: 'scorched_rock', label: 'Scorched Rock', category: 'terrestrial',
  S: [4, 1e6], mass: [0.02, 4], Tsurf: [600, 1300], density: 4.6, albedo: 0.09,
  atmosphere: ['exosphere', 'co2_thin', 'none'], volatiles: [0, 0.05],
  surfaces: ['scorched'], ores: ['siderophile', 'refractory', 'silicate'],
  color: 0xb35a35, weight: 1.5,
  blurb: 'Airless, cratered, and hot enough at noon to soften lead.' },

{ id: 'venusian', label: 'Venusian', category: 'terrestrial',
  S: [1.4, 12], mass: [0.4, 6], Tsurf: [500, 900], density: 5.2, albedo: 0.76,
  atmosphere: ['sulphuric', 'co2_thick'], volatiles: [0.05, 0.30],
  surfaces: ['scorched', 'arid'], ores: ['chalcophile', 'sulphur', 'silicate'],
  color: 0xd8b45a, weight: 1.2,
  blurb: 'A runaway greenhouse under unbroken acid cloud. Hotter than the world inside it.' },

{ id: 'sulphur_hell', label: 'Sulphur Hell', category: 'terrestrial',
  S: [3, 25], mass: [0.1, 3], Tsurf: [450, 850], density: 4.1, albedo: 0.40,
  atmosphere: ['so2_volcanic', 'sulphuric'], volatiles: [0.02, 0.18],
  surfaces: ['scorched'], ores: ['sulphur', 'chalcophile', 'exotic'],
  color: 0xe8c24a, weight: 0.7,
  blurb: 'Continuous volcanism paints the entire crust in sulphur allotropes.' },

{ id: 'halogen_world', label: 'Halogen World', category: 'terrestrial',
  S: [1.2, 14], mass: [0.3, 5], Tsurf: [380, 800], density: 4.7, albedo: 0.26,
  atmosphere: ['halogen', 'co2_thick'], volatiles: [0.03, 0.22],
  surfaces: ['scorched', 'arid'], ores: ['halide', 'chalcophile', 'exotic'],
  color: 0x9ac83a, weight: 0.5,
  blurb: 'Chlorine seas and fluorine frost. Every exposed alloy fails within days.' },

{ id: 'steam_world', label: 'Steam World', category: 'terrestrial',
  S: [1.8, 20], mass: [0.5, 9], Tsurf: [400, 1000], density: 3.4, albedo: 0.62,
  atmosphere: ['steam', 'supercritical_water'], volatiles: [0.35, 0.95],
  surfaces: ['scorched', 'arid'], ores: ['hydrothermal', 'silicate', 'halide'],
  color: 0xe8f0f4, weight: 0.8,
  blurb: 'Its whole ocean is airborne. The cloud tops are the only surface you can see.' },

{ id: 'cinder', label: 'Cinder World', category: 'terrestrial',
  S: [4, 60], mass: [0.01, 0.6], Tsurf: [600, 1400], density: 3.2, albedo: 0.05,
  atmosphere: ['none', 'exosphere'], volatiles: [0, 0.01],
  surfaces: ['scorched', 'barren'], ores: ['carbon', 'silicate', 'refractory'],
  color: 0x3a2e28, weight: 0.6,
  blurb: 'Burnt to slag long ago and never resurfaced. Reflects almost nothing.' },

/* ══ ARID: 1.5 < S < 4. Warm, dry, mostly survivable. ═════════════ */

{ id: 'desert', label: 'Desert World', category: 'terrestrial',
  S: [1.1, 5], mass: [0.15, 5], Tsurf: [280, 460], density: 4.5, albedo: 0.32,
  atmosphere: ['co2_temperate', 'n2_thin', 'co2_thin'], volatiles: [0.05, 0.35],
  surfaces: ['arid', 'barren'], ores: ['silicate', 'evaporite', 'siderophile', 'halide'],
  color: 0xd4a05a, weight: 1.6,
  blurb: 'Water only at the poles, and only underground. Wind does all the erosion.' },

{ id: 'dune_sea', label: 'Dune Sea', category: 'terrestrial',
  S: [1.2, 4.5], mass: [0.3, 6], Tsurf: [290, 440], density: 4.2, albedo: 0.36,
  atmosphere: ['co2_temperate', 'n2_o2', 'n2_thin'], volatiles: [0.08, 0.30],
  surfaces: ['arid'], ores: ['silicate', 'evaporite', 'halide', 'exotic'],
  color: 0xe0b878, weight: 0.9,
  blurb: 'Continent-scale dune fields that migrate measurably within a human lifetime.' },

{ id: 'savannah', label: 'Savannah World', category: 'terrestrial',
  S: [0.9, 2.2], mass: [0.4, 4], Tsurf: [280, 340], density: 5.3, albedo: 0.29,
  atmosphere: ['n2_o2', 'n2_o2_rich', 'co2_temperate'], volatiles: [0.25, 0.60],
  surfaces: ['arid', 'temperate'], ores: ['lithophile', 'silicate', 'siderophile', 'biogenic'],
  color: 0xc8b45a, weight: 0.8,
  blurb: 'Seasonal rains, vast grasslands, shallow inland seas that come and go.' },

{ id: 'greenhouse_temperate', label: 'Greenhouse World', category: 'terrestrial',
  S: [0.6, 3], mass: [0.5, 8], Tsurf: [300, 420], density: 5.0, albedo: 0.34,
  atmosphere: ['co2_temperate', 'phosphine_reducing', 'steam'], volatiles: [0.30, 0.75],
  surfaces: ['arid', 'temperate'], ores: ['carbon', 'hydrothermal', 'lithophile'],
  color: 0xb8a068, weight: 0.7,
  blurb: 'Heavy air holds heat the orbit alone would not justify. Permanently humid.' },

/* ══ TEMPERATE: 0.35 < S < 1.5. The narrow band. ══════════════════ */

{ id: 'terran', label: 'Terran', category: 'terrestrial',
  S: [0.36, 1.6], mass: [0.4, 3], Tsurf: [250, 330], density: 5.5, albedo: 0.30,
  atmosphere: ['n2_o2', 'n2_o2_rich', 'co2_temperate'], volatiles: [0.35, 0.80],
  surfaces: ['temperate'], ores: ['lithophile', 'siderophile', 'biogenic', 'hydrothermal', 'silicate'],
  color: 0x3f8f5f, weight: 1.5,
  blurb: 'Oceans, continents and a working carbon cycle. The improbable middle case.' },

{ id: 'ocean', label: 'Ocean World', category: 'terrestrial',
  S: [0.3, 1.8], mass: [0.5, 9], Tsurf: [250, 340], density: 3.6, albedo: 0.28,
  atmosphere: ['n2_o2', 'co2_temperate', 'steam'], volatiles: [0.70, 1.0],
  surfaces: ['temperate'], ores: ['hydrothermal', 'evaporite', 'biogenic', 'halide'],
  color: 0x3388cc, weight: 1.3,
  blurb: 'No land above the waterline anywhere. The seafloor is under kilometres of pressure.' },

{ id: 'archipelago', label: 'Archipelago World', category: 'terrestrial',
  S: [0.4, 1.5], mass: [0.4, 4], Tsurf: [255, 325], density: 5.1, albedo: 0.27,
  atmosphere: ['n2_o2', 'n2_o2_rich'], volatiles: [0.55, 0.90],
  surfaces: ['temperate'], ores: ['hydrothermal', 'biogenic', 'chalcophile', 'lithophile'],
  color: 0x2f9f8f, weight: 0.9,
  blurb: 'Volcanic chains breaking a global ocean. Land, but never very much of it.' },

{ id: 'jungle', label: 'Jungle World', category: 'terrestrial',
  S: [0.5, 1.7], mass: [0.5, 4], Tsurf: [285, 340], density: 5.2, albedo: 0.22,
  atmosphere: ['n2_o2_rich', 'n2_o2', 'co2_temperate'], volatiles: [0.55, 0.95],
  surfaces: ['temperate'], ores: ['biogenic', 'carbon', 'lithophile', 'hydrothermal'],
  color: 0x2f7a3a, weight: 0.8,
  blurb: 'Biomass dense enough to drive its own weather. Nothing here stays uncolonised.' },

{ id: 'terran_dry', label: 'Steppe World', category: 'terrestrial',
  S: [0.45, 1.5], mass: [0.3, 3], Tsurf: [250, 320], density: 5.4, albedo: 0.31,
  atmosphere: ['n2_o2', 'n2_thin', 'co2_temperate'], volatiles: [0.20, 0.50],
  surfaces: ['temperate', 'arid'], ores: ['lithophile', 'evaporite', 'siderophile', 'silicate'],
  color: 0x8a9a5a, weight: 0.9,
  blurb: 'Enough water for weather, not enough for oceans. Salt flats where seas used to be.' },

{ id: 'terminator', label: 'Terminator World', category: 'terrestrial',
  S: [0.5, 6], mass: [0.3, 5], Tsurf: [180, 600], density: 5.3, albedo: 0.25,
  atmosphere: ['n2_o2', 'co2_temperate', 'n2_thin'], volatiles: [0.15, 0.55],
  surfaces: ['temperate', 'arid', 'scorched'], ores: ['evaporite', 'lithophile', 'silicate', 'halide'],
  color: 0x9a7a8a, weight: 0.5, tidalLocked: true,
  blurb: 'Tidally locked: a burning face, a frozen face, and one habitable ring between them.' },

/* ══ TUNDRA: 0.12 < S < 0.35. Cold but not dead. ══════════════════ */

{ id: 'tundra', label: 'Tundra World', category: 'terrestrial',
  S: [0.10, 0.42], mass: [0.2, 4], Tsurf: [190, 260], density: 4.9, albedo: 0.42,
  atmosphere: ['n2_thin', 'co2_thin', 'n2_o2'], volatiles: [0.30, 0.75],
  surfaces: ['tundra'], ores: ['lithophile', 'silicate', 'volatile_ice', 'siderophile'],
  color: 0x8fb6a8, weight: 1.3,
  blurb: 'Permafrost to depth. Liquid water only in summer, and only at the equator.' },

{ id: 'taiga', label: 'Taiga World', category: 'terrestrial',
  S: [0.15, 0.45], mass: [0.4, 3.5], Tsurf: [210, 275], density: 5.2, albedo: 0.35,
  atmosphere: ['n2_o2', 'co2_temperate', 'n2_thin'], volatiles: [0.40, 0.85],
  surfaces: ['tundra', 'temperate'], ores: ['biogenic', 'lithophile', 'volatile_ice', 'carbon'],
  color: 0x4a7a68, weight: 0.7,
  blurb: 'Cold, forested and cloudy. A long winter most of the biosphere sleeps through.' },

{ id: 'haze_world', label: 'Haze World', category: 'terrestrial',
  S: [0.05, 0.40], mass: [0.05, 2], Tsurf: [70, 220], density: 2.4, albedo: 0.22,
  atmosphere: ['n2_organic_haze', 'methane_frost'], volatiles: [0.45, 0.95],
  surfaces: ['tundra', 'frozen'], ores: ['organic', 'volatile_ice', 'carbon'],
  color: 0xd9a24e, weight: 0.8,
  blurb: 'Orange smog raining hydrocarbons into methane lakes. Prebiotic chemistry, frozen mid-step.' },

{ id: 'ammonia_world', label: 'Ammonia World', category: 'terrestrial',
  S: [0.08, 0.40], mass: [0.3, 5], Tsurf: [180, 260], density: 3.0, albedo: 0.38,
  atmosphere: ['ammonia_ocean_vapour', 'n2_thin'], volatiles: [0.50, 0.95],
  surfaces: ['tundra', 'frozen'], ores: ['volatile_ice', 'organic', 'evaporite'],
  color: 0xc8d8b8, weight: 0.5,
  blurb: 'Ammonia-water seas that stay liquid at temperatures water alone could not.' },

/* ══ FROZEN: S < 0.12. Volatiles are bedrock. ═════════════════════ */

{ id: 'ice', label: 'Ice World', category: 'terrestrial',
  S: [0, 0.16], mass: [0.05, 5], Tsurf: [30, 200], density: 1.9, albedo: 0.62,
  atmosphere: ['n2_thin', 'methane_frost', 'none'], volatiles: [0.60, 1.0],
  surfaces: ['frozen'], ores: ['volatile_ice', 'silicate', 'organic'],
  color: 0xbfe3f5, weight: 1.5,
  blurb: 'Water ice as hard as granite at this temperature. Bedrock you could melt.' },

{ id: 'glacier', label: 'Glacier World', category: 'terrestrial',
  S: [0, 0.20], mass: [0.2, 6], Tsurf: [40, 210], density: 2.2, albedo: 0.70,
  atmosphere: ['nitrogen_glacier', 'n2_thin', 'methane_frost'], volatiles: [0.70, 1.0],
  surfaces: ['frozen'], ores: ['volatile_ice', 'organic', 'evaporite'],
  color: 0xdff2ff, weight: 1.0,
  blurb: 'Nitrogen ice flows across the surface on geological timescales, resurfacing it.' },

{ id: 'subsurface_ocean', label: 'Subsurface Ocean World', category: 'terrestrial',
  S: [0, 0.30], mass: [0.05, 4], Tsurf: [50, 220], density: 2.1, albedo: 0.66,
  atmosphere: ['n2_thin', 'none', 'exosphere'], volatiles: [0.75, 1.0],
  surfaces: ['frozen'], ores: ['hydrothermal', 'volatile_ice', 'biogenic', 'evaporite'],
  color: 0xaadcf0, weight: 0.9, tidal: true,
  blurb: 'Ice shell over liquid water, kept warm by tides. The likeliest place for life out here.' },

{ id: 'cryovolcanic', label: 'Cryovolcanic World', category: 'terrestrial',
  S: [0, 0.35], mass: [0.02, 3], Tsurf: [40, 230], density: 2.0, albedo: 0.58,
  atmosphere: ['ammonia_ocean_vapour', 'n2_thin', 'methane_frost'], volatiles: [0.65, 1.0],
  surfaces: ['frozen', 'tundra'], ores: ['volatile_ice', 'organic', 'evaporite', 'hydrothermal'],
  color: 0xa8d8e8, weight: 0.7, tidal: true,
  blurb: 'Erupts water and ammonia slush that freezes in flight and falls back as snow.' },

{ id: 'dark_ice', label: 'Dark Ice World', category: 'terrestrial',
  S: [0, 0.10], mass: [0.05, 4], Tsurf: [25, 160], density: 2.3, albedo: 0.06,
  atmosphere: ['none', 'methane_frost', 'exosphere'], volatiles: [0.55, 0.95],
  surfaces: ['frozen'], ores: ['organic', 'volatile_ice', 'carbon'],
  color: 0x2a2e38, weight: 0.6,
  blurb: 'Ice buried under aeons of irradiated tholin. Blacker than asphalt, and ancient.' },

{ id: 'nitrogen_world', label: 'Nitrogen Ice World', category: 'terrestrial',
  S: [0, 0.05], mass: [0.02, 2], Tsurf: [15, 80], density: 1.6, albedo: 0.75,
  atmosphere: ['nitrogen_glacier', 'neon_frost'], volatiles: [0.80, 1.0],
  surfaces: ['frozen'], ores: ['volatile_ice', 'exotic'],
  color: 0xf0f6ff, weight: 0.5,
  blurb: 'Cold enough that nitrogen is a rock and neon is a frost.' },

/* ══ BARREN: volatile-poor at any temperature. ════════════════════ */

{ id: 'barren', label: 'Barren World', category: 'terrestrial',
  // Mass band deliberately spans the whole terrestrial range. Barren is
  // defined by what a world has LOST, not by how heavy it is, and it is
  // the class every cooked or stripped world has to be able to fall back
  // to. If its band excluded some masses, a heavy world that lost
  // everything would have nowhere valid to land and the classifier would
  // be forced down to a relaxed tier — which is exactly how a body ends
  // up wearing a label its own surface contradicts.
  S: [0, 60], mass: [0.005, 40], Tsurf: [20, 900], density: 4.4, albedo: 0.14,
  atmosphere: ['none', 'exosphere', 'co2_thin'], volatiles: [0, 0.10],
  surfaces: ['barren'], ores: ['siderophile', 'silicate', 'refractory'],
  color: 0x8a8378, weight: 1.2, requiresBarren: true,
  blurb: 'Whatever it once had, it lost. Regolith, craters, and nothing else.' },

{ id: 'iron_world', label: 'Iron World', category: 'terrestrial',
  S: [0, 60], mass: [0.02, 20], Tsurf: [20, 1200], density: 7.9, albedo: 0.10,
  atmosphere: ['none', 'exosphere'], volatiles: [0, 0.06],
  surfaces: ['barren', 'scorched', 'frozen'], ores: ['siderophile', 'refractory', 'exotic'],
  color: 0x8a6a5a, weight: 0.7,
  blurb: 'Almost pure metal — a differentiated core whose mantle was blasted away.' },

{ id: 'shattered', label: 'Shattered World', category: 'terrestrial',
  S: [0, 60], mass: [0.005, 8], Tsurf: [20, 1000], density: 3.3, albedo: 0.13,
  atmosphere: ['none', 'exosphere'], volatiles: [0, 0.08],
  surfaces: ['barren'], ores: ['silicate', 'siderophile', 'chalcophile'],
  color: 0x6a6058, weight: 0.5,
  blurb: 'Reaccreted rubble from a giant impact, held together by gravity and not much else.' },

{ id: 'radiogenic', label: 'Radiogenic World', category: 'terrestrial',
  S: [0, 20], mass: [0.05, 12], Tsurf: [80, 700], density: 6.2, albedo: 0.11,
  atmosphere: ['radon_hot', 'noble_dense', 'exosphere'], volatiles: [0, 0.25],
  surfaces: ['barren', 'arid', 'tundra'], ores: ['radiogenic', 'siderophile', 'exotic', 'refractory'],
  color: 0x6a9a7a, weight: 0.4,
  blurb: 'Warmed from within by a crust absurdly rich in actinides. Lethal to stand on.' },

/* ══ GIANTS: hydrogen envelopes, degenerate mass-radius. ══════════ */

{ id: 'gas_giant', label: 'Gas Giant', category: 'giant', giant: true,
  S: [0, 4], mass: [50, 4000], Tsurf: [50, 300], density: 1.3, albedo: 0.52,
  atmosphere: ['h2_ammonia_cloud', 'h2_primordial'], volatiles: [0.9, 1.0],
  surfaces: [], ores: ['volatile_ice', 'exotic', 'organic'],
  color: 0xcc8844, weight: 1.6,
  blurb: 'Banded ammonia cloud decks over a hydrogen ocean with no surface beneath it.' },

{ id: 'ice_giant', label: 'Ice Giant', category: 'giant', giant: true,
  S: [0, 1.2], mass: [8, 100], Tsurf: [40, 160], density: 1.6, albedo: 0.44,
  atmosphere: ['h2_methane_blue', 'h2_primordial'], volatiles: [0.9, 1.0],
  surfaces: [], ores: ['volatile_ice', 'organic', 'exotic'],
  color: 0x4fa8d8, weight: 1.3,
  blurb: 'Water, ammonia and methane ices under a thin hydrogen skin. Deep blue and very cold.' },

{ id: 'hot_jupiter', label: 'Hot Jupiter', category: 'giant', giant: true,
  S: [80, 1e7], mass: [80, 4000], Tsurf: [1000, 2600], density: 0.9, albedo: 0.06,
  atmosphere: ['h2_hot_silicate', 'h2_soot'], volatiles: [0.7, 1.0],
  surfaces: [], ores: ['refractory', 'exotic'],
  color: 0x8a3a28, weight: 0.8,
  blurb: 'Tidally locked and inflated, with a supersonic jet dragging heat to the night side.' },

{ id: 'warm_neptune', label: 'Warm Neptune', category: 'giant', giant: true,
  S: [4, 1e6], mass: [8, 120], Tsurf: [400, 1100], density: 1.5, albedo: 0.20,
  atmosphere: ['h2_thin_puffy', 'h2_helium_stripped', 'steam'], volatiles: [0.4, 0.9],
  surfaces: [], ores: ['volatile_ice', 'exotic'],
  color: 0xa87ac8, weight: 0.7,
  blurb: 'Close enough that its envelope is visibly evaporating into a trailing plume.' },

{ id: 'sub_neptune', label: 'Sub-Neptune', category: 'giant', giant: true,
  S: [0.2, 40], mass: [2, 20], Tsurf: [200, 900], density: 2.2, albedo: 0.25,
  atmosphere: ['h2_thin_puffy', 'steam', 'supercritical_water'], volatiles: [0.5, 1.0],
  surfaces: [], ores: ['volatile_ice', 'hydrothermal', 'exotic'],
  color: 0x7ab8c8, weight: 1.1,
  blurb: 'The commonest world in the galaxy and the one least understood. Rock, water, gas — no clear boundary.' },

{ id: 'puffball', label: 'Puffball Giant', category: 'giant', giant: true,
  S: [10, 1e6], mass: [20, 300], Tsurf: [700, 1600], density: 0.20, albedo: 0.12,
  atmosphere: ['h2_thin_puffy', 'h2_helium_stripped'], volatiles: [0.5, 1.0],
  surfaces: [], ores: ['exotic'],
  color: 0xd8a8c8, weight: 0.35,
  blurb: 'Less dense than cork, and barely holding itself together against the star.' },

{ id: 'helium_giant', label: 'Helium Giant', category: 'giant', giant: true,
  S: [1, 1e6], mass: [20, 800], Tsurf: [300, 1400], density: 2.0, albedo: 0.28,
  atmosphere: ['h2_helium_stripped'], volatiles: [0.3, 0.8],
  surfaces: [], ores: ['exotic', 'refractory'],
  color: 0xd9d0c4, weight: 0.3,
  blurb: 'Hydrogen long since escaped. What remains is dense, inert and slowly contracting.' },

{ id: 'ringed_giant', label: 'Ringed Giant', category: 'giant', giant: true,
  S: [0, 2], mass: [40, 2000], Tsurf: [50, 250], density: 0.7, albedo: 0.50,
  atmosphere: ['h2_ammonia_cloud', 'h2_primordial'], volatiles: [0.9, 1.0],
  surfaces: [], ores: ['volatile_ice', 'silicate'],
  color: 0xe0c088, weight: 0.6, rings: true,
  blurb: 'A shepherded ring system wider than the world it orbits, and a fraction as old.' }

];

/* ── moon-specific classes ─────────────────────────────────────────
 * Moons reuse most terrestrial classes, but a handful only make sense as
 * satellites, because the heat source is the primary rather than the star.
 */
const MOONS = [

{ id: 'tidal_forge', label: 'Tidal Forge Moon', category: 'moon', moonOnly: true,
  S: [0, 6], mass: [0.005, 0.5], Tsurf: [100, 700], density: 3.5, albedo: 0.30,
  atmosphere: ['so2_volcanic', 'exosphere'], volatiles: [0, 0.20],
  surfaces: ['molten', 'scorched', 'barren'], ores: ['sulphur', 'chalcophile', 'silicate', 'refractory'],
  color: 0xe8c24a, weight: 1.0, tidal: true,
  blurb: 'Flexed to melting by its primary. The most volcanically active body in any system.' },

{ id: 'ice_moon', label: 'Ice Moon', category: 'moon', moonOnly: true,
  S: [0, 1.2], mass: [0.002, 0.4], Tsurf: [50, 250], density: 1.9, albedo: 0.68,
  atmosphere: ['none', 'exosphere', 'n2_thin'], volatiles: [0.5, 1.0],
  surfaces: ['frozen'], ores: ['volatile_ice', 'silicate', 'hydrothermal'],
  color: 0xd8eef8, weight: 1.6,
  blurb: 'Fractured ice crust scored by tidal stress. Brighter than fresh snow.' },

{ id: 'ocean_moon', label: 'Ocean Moon', category: 'moon', moonOnly: true,
  S: [0, 1.5], mass: [0.005, 0.5], Tsurf: [60, 260], density: 2.0, albedo: 0.64,
  atmosphere: ['n2_thin', 'exosphere', 'none'], volatiles: [0.7, 1.0],
  surfaces: ['frozen'], ores: ['hydrothermal', 'volatile_ice', 'biogenic', 'evaporite'],
  color: 0x9ad8f0, weight: 0.9, tidal: true,
  blurb: 'Salt water under ice, venting into space through cracks at the south pole.' },

{ id: 'captured_rock', label: 'Captured Rock', category: 'moon', moonOnly: true,
  S: [0, 40], mass: [0.0005, 0.05], Tsurf: [30, 900], density: 2.7, albedo: 0.07,
  atmosphere: ['none'], volatiles: [0, 0.15],
  surfaces: ['barren'], ores: ['silicate', 'carbon', 'siderophile'],
  color: 0x5a5048, weight: 1.2,
  blurb: 'Irregular, dark, and on a retrograde orbit — this did not form here.' },

{ id: 'regolith_moon', label: 'Regolith Moon', category: 'moon', moonOnly: true,
  S: [0, 40], mass: [0.001, 0.3], Tsurf: [40, 700], density: 3.3, albedo: 0.12,
  atmosphere: ['none', 'exosphere'], volatiles: [0, 0.08],
  surfaces: ['barren'], ores: ['silicate', 'siderophile', 'refractory'],
  color: 0xaaaaaa, weight: 1.8,
  blurb: 'Airless grey dust over anorthosite, churned to powder by four billion years of impacts.' },

{ id: 'shepherd_moon', label: 'Shepherd Moon', category: 'moon', moonOnly: true,
  S: [0, 6], mass: [0.0001, 0.01], Tsurf: [40, 400], density: 1.5, albedo: 0.45,
  atmosphere: ['none'], volatiles: [0.2, 0.8],
  surfaces: ['frozen', 'barren'], ores: ['volatile_ice', 'silicate'],
  color: 0xcfc8b8, weight: 0.6,
  blurb: 'Small, close in, and holding a ring gap open by its own gravity alone.' }

];

/* ── derived temperature gates ─────────────────────────────────────
 *
 * The hand-authored `Tsurf` on each entry says what the class MEANS: a
 * Lava World is molten, a Tundra World is near freezing. That is useful
 * documentation and it belongs in the file.
 *
 * It is not, however, a safe gate. A temperature band typed by hand and an
 * insolation band typed by hand are two numbers that have to agree, and
 * sooner or later they will not — which is precisely the failure mode this
 * whole database exists to eliminate. Two independent sources of truth is
 * how an Ice world ended up in the inferno zone in the first place.
 *
 * So the gate is DERIVED. Each class's actual temperature envelope is
 * computed from the insolation band it already declares, its albedo, and
 * the strongest greenhouse among the atmospheres it can wear:
 *
 *   T = 278.6 * (S * (1 - A))^(1/4) * greenhouse
 *
 * evaluated at both band edges. The authored band is preserved as
 * `Tnominal` for the dossier to quote, and it can only ever WIDEN the
 * derived gate, never narrow it — and only for classes heated from inside
 * by tides, where internal heat genuinely decouples surface temperature
 * from the star. Everywhere else the star is the only heat source, so the
 * insolation band is the temperature band, restated.
 */
import { ATMOSPHERE } from './atmospheres.js';

const TEQ_REF = 278.6;

function teq(S, albedo, greenhouse) {
  const absorbed = Math.max(1e-9, S * (1 - Math.max(0, Math.min(1, albedo))));
  return TEQ_REF * Math.pow(absorbed, 0.25) * greenhouse;
}

function deriveTsurf(cls) {
  let gmax = 1, amax = cls.albedo;
  for (const id of cls.atmosphere || []) {
    const atm = ATMOSPHERE[id];
    if (!atm) continue;
    gmax = Math.max(gmax, atm.greenhouse || 1);
    amax = Math.max(amax, atm.albedo ?? 0);
  }
  // cold edge: bare, most reflective case, with margin
  // hot edge:  full greenhouse, least reflective case, with margin
  const lo = Math.max(2.7, teq(cls.S[0], amax, 1) * 0.85);
  const hi = teq(cls.S[1], cls.albedo, gmax) * 1.15;

  const authored = cls.Tnominal;
  if ((cls.tidal || cls.moonOnly) && authored) {
    return [Math.min(lo, authored[0]), Math.max(hi, authored[1])];
  }
  return [lo, hi];
}

/**
 * The same argument applies to `surfaces`.
 *
 * `surfaceState()` in stellar.js decides a world's surface from its
 * insolation and its remaining volatiles, using thresholds at
 * 30 / 4 / 1.5 / 0.35 / 0.12. A hand-typed `surfaces` list on a class is a
 * second opinion about the same question, and the two drift apart at every
 * band edge — an Ocean World spanning S 0.3 to 1.8 straddles the 0.35
 * temperate/tundra boundary, so it legitimately reads 'tundra' at its cold
 * end while a hand-typed list says 'temperate' only.
 *
 * So the reachable set is COMPUTED by evaluating the real surface function
 * across the class's own insolation and volatile bands. There is exactly
 * one definition of what a surface state means, and it lives in
 * stellar.js. The authored list survives as `surfacesNominal` — what the
 * class is *characteristically* — which is what prose should quote.
 */
import { surfaceState } from '../../world/stellar.js';

function deriveSurfaces(cls) {
  if (cls.giant) return [];                       // giants have no surface
  const out = new Set();
  const [s0, s1] = cls.S;
  const [v0, v1] = cls.volatiles;
  const STEPS = 12;
  for (let i = 0; i <= STEPS; i++) {
    // log-spaced across the insolation band, which spans decades
    const f = i / STEPS;
    // Log-spaced. A linear sweep of a band spanning decades (Radiogenic
    // is S 0 to 20) never samples the low end at all, so states that are
    // genuinely reachable there get left out of the gate and the audit
    // then flags a body that was correctly classified.
    const lo = s0 > 0 ? s0 : Math.min(1e-3, s1 / 1000);
    const S = lo * Math.pow(s1 / lo, f);
    for (let j = 0; j <= 4; j++) {
      out.add(surfaceState(S, v0 + (v1 - v0) * (j / 4)));
    }
  }
  return [...out];
}

for (const cls of W.concat(MOONS)) {
  cls.Tnominal = cls.Tsurf;                // what the class means, for prose
  cls.Tsurf = deriveTsurf(cls);            // what it can actually be, for gating
  cls.surfacesNominal = cls.surfaces;      // characteristic surface, for prose
  cls.surfaces = deriveSurfaces(cls);      // every reachable surface, for gating
}

export const WORLD_CLASSES = W.concat(MOONS);
export const WORLD = Object.fromEntries(WORLD_CLASSES.map(w => [w.id, w]));

export const TERRESTRIAL = WORLD_CLASSES.filter(w => w.category === 'terrestrial');
export const GIANTS = WORLD_CLASSES.filter(w => w.category === 'giant');
export const MOON_CLASSES = WORLD_CLASSES.filter(w => w.category === 'moon');

export function worldById(id) { return WORLD[id] || null; }

/** Does this class permit the given insolation? */
export function fitsInsolation(cls, S) {
  return S >= cls.S[0] && S <= cls.S[1];
}

/** Does this class permit the given mass, in Earth masses? */
export function fitsMass(cls, massEarth) {
  return massEarth >= cls.mass[0] && massEarth <= cls.mass[1];
}

/** Full envelope test. Temperature is checked only when supplied. */
export function fitsConditions(cls, { S, massEarth, tempK }) {
  if (S !== undefined && !fitsInsolation(cls, S)) return false;
  if (massEarth !== undefined && !fitsMass(cls, massEarth)) return false;
  if (tempK !== undefined && cls.Tsurf && (tempK < cls.Tsurf[0] || tempK > cls.Tsurf[1])) return false;
  return true;
}

/**
 * Legacy kind names the old flat PLANET_KINDS list used, mapped onto the
 * classes that replaced them. Saved GD records predate this database and
 * still say "Ocean" or "Ice", so anything reading an archive can resolve
 * the old label without a migration pass.
 */
export const LEGACY_KIND = {
  'Rocky': 'barren', 'Desert': 'desert', 'Ocean': 'ocean', 'Ice': 'ice',
  'Gas Giant': 'gas_giant', 'Volcanic': 'lava', 'Toxic': 'venusian',
  'Barren': 'barren', 'Moon': 'regolith_moon'
};
