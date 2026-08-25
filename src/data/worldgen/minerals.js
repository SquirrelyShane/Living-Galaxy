/**
 * ORE & MINERAL DATABASE
 *
 * What a system is made of, and — the part that matters — WHERE each thing
 * can form. A mineral is not sprinkled at random over the bodies of a
 * system; it condenses, precipitates or differentiates under specific
 * conditions, and those conditions are exactly the ones the rest of the
 * sim already computes.
 *
 * THE CONDENSATION SEQUENCE
 *
 * The organising physical idea is the condensation sequence: as a
 * protoplanetary disc cools outward from its star, different compounds
 * freeze out of the gas at different temperatures, in a fixed order.
 *
 *   > 1600 K   refractory oxides — corundum, perovskite, hibonite
 *   ~ 1400 K   metallic iron-nickel, then silicates
 *   ~ 700 K    sulphides (troilite) — sulphur binds to the iron
 *   ~ 400 K    hydrated silicates — the first water-bearing rock
 *   ~ 180 K    water ice — the frost line, and the biggest jump in
 *              available solid mass anywhere in the disc
 *   ~ 80 K     ammonia and methane ices
 *   ~ 20 K     nitrogen, carbon monoxide, argon
 *
 * So every entry carries a formation temperature band `T`, and the roller
 * in `db/index.js` compares it against the body's ACTUAL equilibrium
 * temperature. That single rule does most of the work: it is why you find
 * iridium in the inferno zone and clathrate ice in the halo, and why you
 * cannot find them the other way round no matter what the seed rolls.
 *
 * Two further gates:
 *
 *   `tags`   the formation environments a mineral needs — matched against
 *            the `ores` list every world class declares. Hydrothermal ores
 *            require circulating water; biogenic ores require a biosphere.
 *
 *   `hosts`  the body types it can occur in at all.
 *
 * FIELDS
 *   id, name, symbol, category, blurb
 *   tags       formation environments (must intersect the host's)
 *   hosts      body types: planet, moon, asteroid, comet, giant, core
 *   T          [min, max] formation temperature band, kelvin
 *   density    g/cm^3
 *   rarity     0..1, probability weight — LOW means rare
 *   value      relative worth per tonne; 1 = common industrial rock
 *   hardness   Mohs, or the nearest sensible analogue
 *   color      render / UI tint
 *   uses       what it is actually good for
 *
 * Pure data. No DOM, no three.js.
 */

/** Formation environments. A mineral needs at least one the host offers. */
export const TAGS = {
  refractory:   'condensed above 1600 K, before anything else was solid',
  siderophile:  'iron-loving; sank into the core during differentiation',
  chalcophile:  'sulphur-loving; concentrated in sulphide melts',
  lithophile:   'rock-loving; stayed in the silicate crust',
  silicate:     'ordinary rock-forming minerals',
  carbon:       'carbon-rich reducing chemistry',
  sulphur:      'volcanic sulphur systems',
  halide:       'halogen chemistry — chlorides, fluorides',
  evaporite:    'precipitated from a drying sea or brine',
  hydrothermal: 'deposited by circulating hot water',
  biogenic:     'requires, or was made by, a biosphere',
  volatile_ice: 'ices stable only beyond the frost line',
  organic:      'complex carbon chemistry, irradiated or aqueous',
  radiogenic:   'actinide-rich; heats its own host from within',
  exotic:       'formed only under conditions that barely occur'
};

const M = [

/* ══ REFRACTORY — the first solids, inferno zone and core material ══ */

{ id: 'hibonite', name: 'Hibonite', symbol: 'Hbn', category: 'ore',
  tags: ['refractory'], hosts: ['planet', 'asteroid', 'core'], T: [1600, 4000],
  density: 3.84, rarity: 0.22, value: 34, hardness: 7.5, color: 0x4a6fa8,
  uses: 'Ablative shielding for close-stellar hulls; survives re-entry unchanged.',
  blurb: 'Among the oldest solids that exist anywhere. Older than the planets by millions of years.' },

{ id: 'corundum_ore', name: 'Corundum Mass', symbol: 'Crn', category: 'gem',
  tags: ['refractory', 'lithophile'], hosts: ['planet', 'asteroid', 'moon'], T: [900, 3000],
  density: 4.02, rarity: 0.35, value: 18, hardness: 9, color: 0xc84a5a,
  uses: 'Abrasives, bearing faces, optical windows for furnace instrumentation.',
  blurb: 'Aluminium oxide grown in the heat. Where trace chromium enters, it is ruby.' },

{ id: 'perovskite_melt', name: 'Perovskite Melt', symbol: 'Pvk', category: 'ore',
  tags: ['refractory'], hosts: ['planet', 'core'], T: [1400, 3200],
  density: 4.05, rarity: 0.30, value: 26, hardness: 5.5, color: 0x6a5a4a,
  uses: 'High-temperature piezoelectrics; the standard mantle-probe transducer.',
  blurb: 'The dominant mineral of every rocky mantle, and almost never seen at a surface.' },

{ id: 'osmiridium', name: 'Osmiridium', symbol: 'OsIr', category: 'metal',
  tags: ['refractory', 'siderophile'], hosts: ['asteroid', 'core', 'planet'], T: [1200, 3000],
  density: 22.6, rarity: 0.06, value: 940, hardness: 7, color: 0xb8c0cc,
  uses: 'Electrical contacts that never pit; the densest structural alloy available.',
  blurb: 'The two densest elements in nature, alloyed. A fist-sized lump is a two-hand lift.' },

{ id: 'iridium_nodule', name: 'Iridium Nodule', symbol: 'Ir', category: 'metal',
  tags: ['refractory', 'siderophile'], hosts: ['asteroid', 'core', 'planet'], T: [1000, 2800],
  density: 22.5, rarity: 0.09, value: 780, hardness: 6.5, color: 0xd0d6dc,
  uses: 'Crucibles for melting anything else; catalytic beds; radiothermal cladding.',
  blurb: 'Vanishingly rare in crusts, common in cores. Its presence in a crust dates an impact.' },

{ id: 'zirconia_glass', name: 'Zirconia Glass', symbol: 'ZrO', category: 'industrial',
  tags: ['refractory', 'lithophile'], hosts: ['planet', 'moon', 'asteroid'], T: [800, 2600],
  density: 5.68, rarity: 0.40, value: 12, hardness: 8.5, color: 0xf0ece0,
  uses: 'Thermal-barrier coatings; the inner liner of every fusion containment ring.',
  blurb: 'Conducts heat so poorly you can hold one face while the other glows white.' },

{ id: 'tantalum_carbide', name: 'Tantalum Carbide', symbol: 'TaC', category: 'industrial',
  tags: ['refractory', 'carbon'], hosts: ['planet', 'asteroid', 'core'], T: [1100, 3800],
  density: 14.3, rarity: 0.14, value: 210, hardness: 9.5, color: 0xa89878,
  uses: 'Cutting tools that machine hull plate cold; rocket throat inserts.',
  blurb: 'One of the highest melting points known. It is still solid where iron is a gas.' },

{ id: 'pyrostone', name: 'Pyrostone', symbol: 'Pyx', category: 'exotic',
  tags: ['refractory', 'exotic'], hosts: ['planet', 'core'], T: [2000, 4500],
  density: 9.4, rarity: 0.04, value: 1600, hardness: 8, color: 0xff7a30,
  uses: 'Stores thermal energy at densities no battery approaches. Releases it on command.',
  blurb: 'A metastable lattice that only forms in a magma ocean and remembers being one.' },

{ id: 'vaporised_quartz', name: 'Vapour-Grown Quartz', symbol: 'vSi', category: 'crystal',
  tags: ['refractory', 'silicate'], hosts: ['planet'], T: [1600, 3000],
  density: 2.65, rarity: 0.28, value: 44, hardness: 7, color: 0xe8f0f8,
  uses: 'Flawless optical blanks — telescope primaries are cast nowhere else.',
  blurb: 'Condensed straight from rock vapour onto the night side. It snows this, in sheets.' },

/* ══ SIDEROPHILE — iron-loving, core and metal asteroids ══════════ */

{ id: 'kamacite', name: 'Kamacite', symbol: 'FeNi', category: 'metal',
  tags: ['siderophile'], hosts: ['asteroid', 'core', 'planet', 'moon'], T: [200, 1600],
  density: 7.9, rarity: 0.85, value: 3, hardness: 4, color: 0x9a9088,
  uses: 'Bulk structural feedstock. The metal every station is actually built from.',
  blurb: 'Nickel-iron that cooled over a million years, growing crystals metres across.' },

{ id: 'taenite', name: 'Taenite', symbol: 'γFeNi', category: 'metal',
  tags: ['siderophile'], hosts: ['asteroid', 'core'], T: [200, 1500],
  density: 8.1, rarity: 0.72, value: 5, hardness: 5, color: 0xb0a89c,
  uses: 'High-nickel alloying stock; corrosion-resistant plate.',
  blurb: 'Kamacite\'s twin, interleaved with it in bands you can read like tree rings.' },

{ id: 'platinum_group', name: 'Platinum Group Metals', symbol: 'PGM', category: 'metal',
  tags: ['siderophile'], hosts: ['asteroid', 'core', 'planet'], T: [400, 2200],
  density: 19.8, rarity: 0.11, value: 620, hardness: 4.5, color: 0xdce2e8,
  uses: 'Catalysis, fuel-cell membranes, and every hydrogen cracker in the system.',
  blurb: 'One metal-type asteroid holds more of it than a planetary crust ever will.' },

{ id: 'cohenite', name: 'Cohenite', symbol: 'Fe3C', category: 'ore',
  tags: ['siderophile', 'carbon'], hosts: ['asteroid', 'core'], T: [300, 1400],
  density: 7.7, rarity: 0.45, value: 16, hardness: 6, color: 0x786858,
  uses: 'Direct-reduction carbon steel feedstock; no separate carburising step.',
  blurb: 'Iron carbide — steel that formed itself, in space, without anyone smelting anything.' },

{ id: 'schreibersite', name: 'Schreibersite', symbol: 'FeNiP', category: 'ore',
  tags: ['siderophile', 'exotic'], hosts: ['asteroid', 'core'], T: [250, 1300],
  density: 7.2, rarity: 0.38, value: 48, hardness: 6.5, color: 0x8a8a6a,
  uses: 'The only bulk phosphorus source off a planet. Fertiliser, and every solid propellant.',
  blurb: 'Reacts with water to make the phosphites life needs. Possibly how life started at all.' },

{ id: 'awaruite', name: 'Awaruite', symbol: 'Ni3Fe', category: 'metal',
  tags: ['siderophile', 'hydrothermal'], hosts: ['moon', 'planet', 'asteroid'], T: [200, 700],
  density: 8.3, rarity: 0.33, value: 38, hardness: 5, color: 0xc0b8a8,
  uses: 'Native nickel — smelts at a fraction of the energy ore refining takes.',
  blurb: 'Forms where water meets olivine. Wherever you find it, there was once a warm sea.' },

{ id: 'goldsphere', name: 'Gold Spherules', symbol: 'Au', category: 'metal',
  tags: ['siderophile', 'hydrothermal'], hosts: ['planet', 'asteroid', 'moon'], T: [300, 1300],
  density: 19.3, rarity: 0.13, value: 480, hardness: 2.5, color: 0xffd24a,
  uses: 'Corrosion-proof interconnects; radiation shielding for optics.',
  blurb: 'Condensed as free droplets and never oxidised since. Still mirror-bright after aeons.' },

{ id: 'rheniate', name: 'Rheniate Crust', symbol: 'Re', category: 'metal',
  tags: ['siderophile', 'refractory'], hosts: ['planet', 'asteroid'], T: [900, 2800],
  density: 21.0, rarity: 0.07, value: 870, hardness: 7, color: 0xa0a8b0,
  uses: 'Superalloy turbine blades; the hottest-running components anyone builds.',
  blurb: 'Concentrates in the fume above volcanoes and plates out on the vent walls.' },

{ id: 'ferrovolt', name: 'Ferrovolt', symbol: 'Fvt', category: 'exotic',
  tags: ['siderophile', 'exotic', 'radiogenic'], hosts: ['core', 'planet'], T: [800, 2500],
  density: 11.2, rarity: 0.03, value: 2400, hardness: 6, color: 0x5a8ad8,
  uses: 'Generates current under mechanical strain at absurd efficiency. Powers passive sensors indefinitely.',
  blurb: 'A magnetically frustrated iron lattice that only sets under core pressures.' },

/* ══ CHALCOPHILE & SULPHUR ═══════════════════════════════════════ */

{ id: 'troilite', name: 'Troilite', symbol: 'FeS', category: 'ore',
  tags: ['chalcophile'], hosts: ['asteroid', 'planet', 'moon'], T: [400, 1000],
  density: 4.67, rarity: 0.80, value: 4, hardness: 4, color: 0x8a7a5a,
  uses: 'Sulphur feedstock; roasted for acid, which everything downstream needs.',
  blurb: 'Iron sulphide, condensed the moment the disc cooled enough for sulphur to bind.' },

{ id: 'chalcopyrite', name: 'Chalcopyrite', symbol: 'CuFeS2', category: 'ore',
  tags: ['chalcophile', 'hydrothermal'], hosts: ['planet', 'moon'], T: [350, 900],
  density: 4.2, rarity: 0.62, value: 22, hardness: 3.5, color: 0xd8b83a,
  uses: 'The principal copper ore. Wire, windings, and heat exchangers.',
  blurb: 'Brassy enough that prospectors have mistaken it for gold on every world it occurs.' },

{ id: 'cinnabar', name: 'Cinnabar', symbol: 'HgS', category: 'ore',
  tags: ['chalcophile', 'hydrothermal', 'sulphur'], hosts: ['planet', 'moon'], T: [300, 700],
  density: 8.1, rarity: 0.30, value: 74, hardness: 2.5, color: 0xd02a2a,
  uses: 'Mercury for diffusion pumps, switching, and dense working fluids.',
  blurb: 'Vivid scarlet, and quietly poisoning every mining crew that ever worked it unmasked.' },

{ id: 'sphalerite', name: 'Sphalerite', symbol: 'ZnS', category: 'ore',
  tags: ['chalcophile', 'hydrothermal'], hosts: ['planet', 'moon'], T: [300, 800],
  density: 4.05, rarity: 0.58, value: 15, hardness: 3.8, color: 0x8a5a3a,
  uses: 'Zinc for galvanising and for the anodes of every hull-protection system.',
  blurb: 'Fluoresces orange under ultraviolet, which is how survey drones find it from altitude.' },

{ id: 'molybdenite', name: 'Molybdenite', symbol: 'MoS2', category: 'ore',
  tags: ['chalcophile', 'refractory'], hosts: ['planet', 'asteroid'], T: [500, 1400],
  density: 5.06, rarity: 0.34, value: 96, hardness: 1.2, color: 0x6a7078,
  uses: 'Dry lubricant that works in vacuum, where every oil boils off.',
  blurb: 'So soft it marks paper, and it is the only thing keeping vacuum bearings turning.' },

{ id: 'brimstone_cake', name: 'Brimstone Cake', symbol: 'S8', category: 'industrial',
  tags: ['sulphur'], hosts: ['moon', 'planet'], T: [150, 600],
  density: 2.07, rarity: 0.75, value: 6, hardness: 2, color: 0xf0d84a,
  uses: 'Sulphuric acid at scale; vulcanising agent; propellant oxidiser filler.',
  blurb: 'Native sulphur in metre-thick plates around every vent on a tidally forged moon.' },

{ id: 'thiosalt', name: 'Thiosalt Bloom', symbol: 'Tsb', category: 'exotic',
  tags: ['sulphur', 'exotic', 'hydrothermal'], hosts: ['moon', 'planet'], T: [200, 500],
  density: 3.1, rarity: 0.12, value: 340, hardness: 3, color: 0xc8e04a,
  uses: 'Ambient-temperature superconducting film. Fragile, irreplaceable, worth the trouble.',
  blurb: 'Grows as feathery crusts where sulphur-rich brine meets vacuum and freezes instantly.' },

{ id: 'pentlandite', name: 'Pentlandite', symbol: '(FeNi)9S8', category: 'ore',
  tags: ['chalcophile', 'siderophile'], hosts: ['planet', 'asteroid', 'moon'], T: [400, 1100],
  density: 4.8, rarity: 0.52, value: 30, hardness: 3.8, color: 0xc0a068,
  uses: 'The primary nickel ore, and it carries the platinum group along with it.',
  blurb: 'Wherever a magma body settled out sulphides, this is what settled deepest.' },

/* ══ LITHOPHILE & SILICATE — the ordinary crust ══════════════════ */

{ id: 'olivine', name: 'Olivine', symbol: '(MgFe)2SiO4', category: 'ore',
  tags: ['silicate', 'lithophile'], hosts: ['planet', 'moon', 'asteroid'], T: [200, 1900],
  density: 3.32, rarity: 0.92, value: 1, hardness: 6.8, color: 0x8ac04a,
  uses: 'Refractory sand; carbon sequestration feedstock; bulk radiation mass.',
  blurb: 'The commonest mineral in any rocky body. Gem-clear crystals of it are peridot.' },

{ id: 'pyroxene', name: 'Pyroxene', symbol: 'XYSi2O6', category: 'ore',
  tags: ['silicate', 'lithophile'], hosts: ['planet', 'moon', 'asteroid'], T: [200, 1800],
  density: 3.4, rarity: 0.90, value: 1, hardness: 6, color: 0x6a7a5a,
  uses: 'Aggregate, mineral wool, cast basalt pipe that outlasts steel.',
  blurb: 'The other half of every basalt. Between it and olivine, most solid surfaces are accounted for.' },

{ id: 'anorthite', name: 'Anorthite', symbol: 'CaAl2Si2O8', category: 'ore',
  tags: ['silicate', 'lithophile'], hosts: ['moon', 'planet'], T: [150, 1600],
  density: 2.73, rarity: 0.78, value: 4, hardness: 6.2, color: 0xe8e4d8,
  uses: 'Aluminium and calcium without a bauxite deposit anywhere in the system.',
  blurb: 'Floated to the top of a magma ocean and froze there. It is why moons are pale.' },

{ id: 'ilmenite', name: 'Ilmenite', symbol: 'FeTiO3', category: 'ore',
  tags: ['silicate', 'lithophile', 'siderophile'], hosts: ['moon', 'planet', 'asteroid'], T: [200, 1500],
  density: 4.72, rarity: 0.60, value: 26, hardness: 5.5, color: 0x3a3a42,
  uses: 'Titanium for airframes, and oxygen — hydrogen reduction gives you both.',
  blurb: 'Black sand that is simultaneously a structural metal ore and a breathable-air source.' },

{ id: 'spinel', name: 'Spinel', symbol: 'MgAl2O4', category: 'gem',
  tags: ['silicate', 'refractory'], hosts: ['planet', 'asteroid', 'moon'], T: [700, 2100],
  density: 3.6, rarity: 0.44, value: 40, hardness: 8, color: 0xd04a7a,
  uses: 'Transparent armour — it stops fragments and you can still see through it.',
  blurb: 'Grown in contact zones where an intrusion cooked the rock it pushed through.' },

{ id: 'rare_earth_carbonatite', name: 'Carbonatite REE', symbol: 'REE', category: 'ore',
  tags: ['lithophile', 'exotic'], hosts: ['planet'], T: [250, 900],
  density: 4.4, rarity: 0.16, value: 300, hardness: 4, color: 0xc8a8d8,
  uses: 'Permanent magnets, phosphors, laser gain media. No substitutes for any of it.',
  blurb: 'A carbonate magma — molten limestone — that scavenged every rare earth on its way up.' },

{ id: 'lithium_pegmatite', name: 'Lithium Pegmatite', symbol: 'LiAlSi2O6', category: 'ore',
  tags: ['lithophile', 'hydrothermal'], hosts: ['planet', 'moon'], T: [280, 800],
  density: 3.1, rarity: 0.40, value: 88, hardness: 6.5, color: 0xe0c8f0,
  uses: 'Cells, ceramics, and the tritium-breeding blanket of every fusion plant.',
  blurb: 'The last dregs of a granite, where crystals grow to the size of a person.' },

{ id: 'zircon_sand', name: 'Zircon Sand', symbol: 'ZrSiO4', category: 'crystal',
  tags: ['silicate', 'radiogenic'], hosts: ['planet', 'moon'], T: [200, 1600],
  density: 4.65, rarity: 0.55, value: 34, hardness: 7.5, color: 0xd8c8a8,
  uses: 'Foundry sand, and the standard reference clock for dating a crust.',
  blurb: 'Traps uranium and rejects lead, so each grain records its own age exactly.' },

{ id: 'obsidian_field', name: 'Obsidian Field', symbol: 'Obs', category: 'industrial',
  tags: ['silicate'], hosts: ['planet', 'moon'], T: [150, 1200],
  density: 2.4, rarity: 0.66, value: 3, hardness: 5.5, color: 0x1a1a20,
  uses: 'Cast into blade stock and pressure glazing. Cheap, and sharper than any steel.',
  blurb: 'Lava that cooled too fast to organise itself. Fractures to an edge one atom wide.' },

{ id: 'garnet_sand', name: 'Garnet Sand', symbol: 'Grt', category: 'gem',
  tags: ['silicate', 'lithophile'], hosts: ['planet', 'moon', 'asteroid'], T: [300, 1400],
  density: 3.9, rarity: 0.58, value: 14, hardness: 7.5, color: 0x9a2a3a,
  uses: 'Waterjet abrasive; the only thing that cuts composite hull cleanly.',
  blurb: 'Survives weathering when everything around it has turned to clay, so it piles up in beds.' },

/* ══ HALIDE & EVAPORITE — dry seas and brines ════════════════════ */

{ id: 'halite', name: 'Halite', symbol: 'NaCl', category: 'industrial',
  tags: ['evaporite', 'halide'], hosts: ['planet', 'moon'], T: [180, 800],
  density: 2.17, rarity: 0.82, value: 2, hardness: 2.5, color: 0xf4f0e8,
  uses: 'Chlorine, sodium, and the electrolyte of every closed-loop life system.',
  blurb: 'Kilometre-deep beds mark where an ocean used to be. They are the ocean\'s headstone.' },

{ id: 'sylvite', name: 'Sylvite', symbol: 'KCl', category: 'industrial',
  tags: ['evaporite', 'halide'], hosts: ['planet'], T: [180, 700],
  density: 1.99, rarity: 0.56, value: 9, hardness: 2, color: 0xf0d8b8,
  uses: 'Potassium for agriculture. Without it, no closed habitat grows food twice.',
  blurb: 'The last salt to precipitate, so it always caps the bed. Bitter, and faintly radioactive.' },

{ id: 'fluorite', name: 'Fluorite', symbol: 'CaF2', category: 'crystal',
  tags: ['halide', 'hydrothermal'], hosts: ['planet', 'moon'], T: [200, 700],
  density: 3.18, rarity: 0.48, value: 36, hardness: 4, color: 0x6ad8c8,
  uses: 'Ultraviolet optics and the flux that makes smelting anything else practical.',
  blurb: 'Glows under ultraviolet — the word fluorescence was named after this rock.' },

{ id: 'cryolite', name: 'Cryolite', symbol: 'Na3AlF6', category: 'industrial',
  tags: ['halide', 'exotic'], hosts: ['planet'], T: [200, 1300],
  density: 2.95, rarity: 0.20, value: 120, hardness: 2.5, color: 0xe8f0f0,
  uses: 'The only practical solvent for aluminium oxide. Aluminium smelting stops without it.',
  blurb: 'So close to water\'s refractive index that a crystal dropped in water vanishes.' },

{ id: 'borate_pan', name: 'Borate Pan', symbol: 'Bor', category: 'industrial',
  tags: ['evaporite'], hosts: ['planet'], T: [220, 500],
  density: 1.73, rarity: 0.42, value: 52, hardness: 2.5, color: 0xf0e8c8,
  uses: 'Neutron-absorbing shielding, borosilicate glass, high-temperature seals.',
  blurb: 'Crusts out white across a dry lakebed. From orbit the pans look like spilled paint.' },

{ id: 'perchlorate_crust', name: 'Perchlorate Crust', symbol: 'ClO4', category: 'industrial',
  tags: ['evaporite', 'halide'], hosts: ['planet', 'moon'], T: [150, 400],
  density: 2.5, rarity: 0.64, value: 11, hardness: 2, color: 0xd8c8b0,
  uses: 'Solid-rocket oxidiser, and a source of breathable oxygen if you can bear the toxicity.',
  blurb: 'Sterilises the soil it saturates. A serious problem for anyone hoping to farm there.' },

{ id: 'nitratine', name: 'Nitratine', symbol: 'NaNO3', category: 'industrial',
  tags: ['evaporite'], hosts: ['planet'], T: [200, 450],
  density: 2.26, rarity: 0.38, value: 28, hardness: 1.8, color: 0xe8e0c0,
  uses: 'Fixed nitrogen for agriculture and explosives, without any energy cost to fix it.',
  blurb: 'Only survives where it has not rained in ten million years. Rare, and worth a war.' },

{ id: 'brinesalt', name: 'Deep Brine Salt', symbol: 'Dbs', category: 'exotic',
  tags: ['evaporite', 'hydrothermal', 'exotic'], hosts: ['moon', 'planet'], T: [180, 380],
  density: 2.8, rarity: 0.18, value: 260, hardness: 3, color: 0x8ac8d8,
  uses: 'Ion-selective membranes; the working salt of every high-density thermal store.',
  blurb: 'Precipitated from an ocean that has been sealed under ice since the system formed.' },

/* ══ HYDROTHERMAL — needs circulating water ══════════════════════ */

{ id: 'chimney_sulphide', name: 'Chimney Sulphide', symbol: 'Chm', category: 'ore',
  tags: ['hydrothermal', 'chalcophile'], hosts: ['planet', 'moon'], T: [270, 700],
  density: 4.6, rarity: 0.50, value: 68, hardness: 3.5, color: 0x6a4a3a,
  uses: 'Polymetallic concentrate — copper, zinc, silver and gold in one pull.',
  blurb: 'Black smokers build these towers metres a year, then abandon them and build elsewhere.' },

{ id: 'manganese_nodule', name: 'Manganese Nodule', symbol: 'Mn', category: 'ore',
  tags: ['hydrothermal'], hosts: ['planet', 'moon'], T: [265, 350],
  density: 2.4, rarity: 0.70, value: 19, hardness: 3, color: 0x2a2a2a,
  uses: 'Manganese, cobalt, nickel and rare earths — a whole supply chain in one lump.',
  blurb: 'Grows a few millimetres per million years, lying loose on an abyssal plain. Nobody hurries.' },

{ id: 'silica_sinter', name: 'Silica Sinter', symbol: 'Snt', category: 'industrial',
  tags: ['hydrothermal', 'silicate'], hosts: ['planet', 'moon'], T: [270, 500],
  density: 2.1, rarity: 0.60, value: 8, hardness: 5, color: 0xe0dcd0,
  uses: 'Insulating aerogel precursor; filtration media that survives anything.',
  blurb: 'Terraced white aprons around every hot spring, growing outward one film at a time.' },

{ id: 'serpentine_mass', name: 'Serpentinite', symbol: 'Srp', category: 'ore',
  tags: ['hydrothermal', 'silicate'], hosts: ['planet', 'moon'], T: [270, 600],
  density: 2.6, rarity: 0.68, value: 12, hardness: 3.5, color: 0x3a6a4a,
  uses: 'Releases hydrogen when it forms — a fuel source you mine rather than manufacture.',
  blurb: 'Rock that drank seawater and swelled. It makes hydrogen and heat as a side effect of existing.' },

{ id: 'jasperoid', name: 'Jasperoid', symbol: 'Jsp', category: 'ore',
  tags: ['hydrothermal', 'silicate'], hosts: ['planet'], T: [280, 650],
  density: 2.7, rarity: 0.46, value: 58, hardness: 7, color: 0xa04a3a,
  uses: 'Carries invisible gold in solid solution. Assay it — you cannot see the metal.',
  blurb: 'Replaced limestone atom by atom in a hot fluid. Looks like nothing; assays like a fortune.' },

/* ══ CARBON & ORGANIC ════════════════════════════════════════════ */

{ id: 'graphite_seam', name: 'Graphite Seam', symbol: 'C', category: 'industrial',
  tags: ['carbon'], hosts: ['planet', 'moon', 'asteroid'], T: [100, 2000],
  density: 2.26, rarity: 0.72, value: 7, hardness: 1.5, color: 0x2a2a2e,
  uses: 'Electrodes, moderators, and every fibre composite anyone lays up.',
  blurb: 'Carbon that had time to organise itself into sheets. Slippery, black and endlessly useful.' },

{ id: 'diamond_layer', name: 'Diamond Layer', symbol: 'Cdia', category: 'gem',
  tags: ['carbon', 'exotic'], hosts: ['planet', 'core', 'giant'], T: [300, 3000],
  density: 3.52, rarity: 0.10, value: 420, hardness: 10, color: 0xe8f4ff,
  uses: 'Thermal spreaders, pressure anvils, optical windows for anything corrosive.',
  blurb: 'On a carbon world this is not a gemstone, it is a stratum. Kilometres of it.' },

{ id: 'lonsdaleite', name: 'Lonsdaleite', symbol: 'hC', category: 'exotic',
  tags: ['carbon', 'exotic'], hosts: ['asteroid', 'planet'], T: [200, 2000],
  density: 3.51, rarity: 0.05, value: 1900, hardness: 11, color: 0xf0f8ff,
  uses: 'Harder than diamond. Used where diamond tooling fails, which is not often.',
  blurb: 'Hexagonal carbon, made only by a graphite-bearing body hitting something at speed.' },

{ id: 'kerogen_shale', name: 'Kerogen Shale', symbol: 'Krg', category: 'fuel',
  tags: ['organic', 'carbon'], hosts: ['planet', 'moon', 'comet'], T: [80, 500],
  density: 2.2, rarity: 0.74, value: 5, hardness: 3, color: 0x4a3a2a,
  uses: 'Cracked for hydrocarbons; the cheapest carbon feedstock in any system.',
  blurb: 'Organic matter buried and cooked, but never quite enough to become oil.' },

{ id: 'tholin_crust', name: 'Tholin Crust', symbol: 'Tho', category: 'organic',
  tags: ['organic'], hosts: ['moon', 'planet', 'comet'], T: [40, 250],
  density: 1.4, rarity: 0.80, value: 16, hardness: 2, color: 0xc07a3a,
  uses: 'Nitrogen-rich feedstock for biopolymer synthesis. Also a passable radiation shield.',
  blurb: 'Ultraviolet light working on methane for a billion years, producing orange sludge.' },

{ id: 'amino_ice', name: 'Amino Ice', symbol: 'Ami', category: 'organic',
  tags: ['organic', 'volatile_ice'], hosts: ['comet', 'moon', 'asteroid'], T: [20, 200],
  density: 1.2, rarity: 0.36, value: 190, hardness: 1.5, color: 0xd8e8c8,
  uses: 'Pre-formed amino acids — a shortcut past the hardest step of synthetic biology.',
  blurb: 'Comets carry the building blocks of proteins, already assembled, for free.' },

{ id: 'pao_resin', name: 'Palaeo-Resin', symbol: 'Prs', category: 'biogenic',
  tags: ['biogenic', 'organic'], hosts: ['planet'], T: [250, 350],
  density: 1.08, rarity: 0.24, value: 240, hardness: 2.2, color: 0xd8a03a,
  uses: 'Sealed specimens intact for a hundred million years. Priceless to xenobiology.',
  blurb: 'Fossil sap from a forest nobody catalogued before the star started dying.' },

{ id: 'biocarbonate', name: 'Biogenic Carbonate', symbol: 'bCa', category: 'biogenic',
  tags: ['biogenic'], hosts: ['planet'], T: [265, 320],
  density: 2.71, rarity: 0.70, value: 6, hardness: 3, color: 0xf0ead8,
  uses: 'Cement, and the calcium every closed-loop habitat quietly runs short of.',
  blurb: 'Built shell by shell over aeons. Whole mountain ranges of it, all of it once alive.' },

{ id: 'chitinite', name: 'Chitinite', symbol: 'Chi', category: 'biogenic',
  tags: ['biogenic', 'organic'], hosts: ['planet'], T: [250, 340],
  density: 1.4, rarity: 0.28, value: 130, hardness: 2.5, color: 0x8a6a3a,
  uses: 'Self-assembling structural polymer; medical scaffolds that the body accepts.',
  blurb: 'Compressed exoskeletons in beds tens of metres thick. Something here was very numerous.' },

{ id: 'stromatolite_core', name: 'Stromatolite Core', symbol: 'Str', category: 'biogenic',
  tags: ['biogenic', 'hydrothermal'], hosts: ['planet'], T: [270, 340],
  density: 2.6, rarity: 0.22, value: 310, hardness: 3.5, color: 0x6a7a5a,
  uses: 'Not mined for material — mined for the record. Each lamina is one year of a biosphere.',
  blurb: 'Layered microbial mats. The oldest evidence a world ever had that it was not alone.' },

/* ══ VOLATILE ICE — beyond the frost line ════════════════════════ */

{ id: 'water_ice', name: 'Water Ice', symbol: 'H2O', category: 'ice',
  tags: ['volatile_ice'], hosts: ['comet', 'moon', 'asteroid', 'planet'], T: [0, 273],
  density: 0.92, rarity: 0.95, value: 2, hardness: 2, color: 0xd8f0ff,
  uses: 'Drinking water, radiation mass, and hydrogen-oxygen propellant. The reason to go out there at all.',
  blurb: 'The single most valuable common substance in space, and the frost line is covered in it.' },

{ id: 'clathrate', name: 'Methane Clathrate', symbol: 'CH4·H2O', category: 'fuel',
  tags: ['volatile_ice'], hosts: ['comet', 'moon', 'planet'], T: [0, 200],
  density: 0.9, rarity: 0.66, value: 24, hardness: 2, color: 0xc8e8e0,
  uses: 'Methane locked in an ice cage — fuel and water from the same scoop.',
  blurb: 'Burns while it melts. A handful of it will light and drip at the same time.' },

{ id: 'ammonia_ice', name: 'Ammonia Ice', symbol: 'NH3', category: 'ice',
  tags: ['volatile_ice'], hosts: ['comet', 'moon', 'giant'], T: [0, 195],
  density: 0.82, rarity: 0.70, value: 20, hardness: 1.8, color: 0xd0e8c8,
  uses: 'Nitrogen source, refrigerant, and the antifreeze of every cryo-mining rig.',
  blurb: 'Lowers water\'s freezing point enough to keep an ocean liquid where there should be none.' },

{ id: 'co2_ice', name: 'Carbon Dioxide Ice', symbol: 'CO2s', category: 'ice',
  tags: ['volatile_ice'], hosts: ['comet', 'planet', 'moon'], T: [0, 195],
  density: 1.56, rarity: 0.78, value: 5, hardness: 1.5, color: 0xe8f0f4,
  uses: 'Carbon feedstock for every synthesis loop; cheap cold-gas thruster propellant.',
  blurb: 'Sublimates without melting. On a cold enough world it falls as snow every winter.' },

{ id: 'nitrogen_ice', name: 'Nitrogen Ice', symbol: 'N2s', category: 'ice',
  tags: ['volatile_ice'], hosts: ['comet', 'moon', 'planet'], T: [0, 63],
  density: 1.03, rarity: 0.44, value: 26, hardness: 1, color: 0xf0f8ff,
  uses: 'Buffer gas for habitat air. You cannot breathe pure oxygen for long and survive it.',
  blurb: 'So soft at these temperatures it flows downhill. Glaciers of it, moving visibly.' },

{ id: 'co_frost', name: 'Carbon Monoxide Frost', symbol: 'COs', category: 'ice',
  tags: ['volatile_ice'], hosts: ['comet', 'moon'], T: [0, 68],
  density: 0.8, rarity: 0.40, value: 30, hardness: 1, color: 0xe0e8f8,
  uses: 'Carbonyl-process metal refining — separates nickel at room temperature.',
  blurb: 'Only stable in the deep halo. Its presence proves a body has never been near the star.' },

{ id: 'deuterium_ice', name: 'Deuterated Ice', symbol: 'D2O', category: 'fuel',
  tags: ['volatile_ice', 'exotic'], hosts: ['comet', 'moon'], T: [0, 250],
  density: 1.11, rarity: 0.15, value: 620, hardness: 2, color: 0xa8d8f8,
  uses: 'Fusion fuel, straight out of the ground, no isotope separation plant required.',
  blurb: 'Cold chemistry in the disc concentrated deuterium here far above the stellar average.' },

{ id: 'helium3_regolith', name: 'Helium-3 Regolith', symbol: 'He3', category: 'fuel',
  tags: ['volatile_ice', 'exotic'], hosts: ['moon', 'asteroid'], T: [0, 400],
  density: 1.8, rarity: 0.12, value: 1500, hardness: 2, color: 0xf0e0a8,
  uses: 'Aneutronic fusion fuel. One tonne runs a habitat for a decade with no shielding problem.',
  blurb: 'Implanted grain by grain by four billion years of stellar wind on an airless surface.' },

{ id: 'amorphous_ice', name: 'Amorphous Ice', symbol: 'aH2O', category: 'exotic',
  tags: ['volatile_ice', 'exotic'], hosts: ['comet'], T: [0, 130],
  density: 0.94, rarity: 0.20, value: 280, hardness: 2, color: 0xc0e0f0,
  uses: 'Traps other gases in its disordered lattice; releases them all at once when warmed.',
  blurb: 'Froze too fast to crystallise. Warm it past 130 K and it snaps into order, violently.' },

/* ══ RADIOGENIC ══════════════════════════════════════════════════ */

{ id: 'uraninite', name: 'Uraninite', symbol: 'UO2', category: 'fuel',
  tags: ['radiogenic', 'hydrothermal'], hosts: ['planet', 'asteroid', 'moon'], T: [200, 900],
  density: 10.9, rarity: 0.26, value: 260, hardness: 5.5, color: 0x2a3a2a,
  uses: 'Fission fuel and radiothermal generators for anything past the frost line.',
  blurb: 'Warm to the touch in bulk. Miners work it in short shifts and count them carefully.' },

{ id: 'thorianite', name: 'Thorianite', symbol: 'ThO2', category: 'fuel',
  tags: ['radiogenic', 'lithophile'], hosts: ['planet', 'asteroid'], T: [250, 1200],
  density: 9.9, rarity: 0.30, value: 180, hardness: 6.5, color: 0x3a3a2a,
  uses: 'Breeder fuel — four times as abundant as uranium and far harder to weaponise.',
  blurb: 'Comes up with the rare earths, always, whether the operator wanted it or not.' },

{ id: 'monazite', name: 'Monazite Sand', symbol: 'Mnz', category: 'ore',
  tags: ['radiogenic', 'lithophile'], hosts: ['planet', 'moon'], T: [200, 1000],
  density: 5.15, rarity: 0.48, value: 150, hardness: 5.2, color: 0xc8a05a,
  uses: 'Rare earths and thorium together. Concentrates itself in beach placers, free of charge.',
  blurb: 'Heavy enough that moving water sorts it out and stacks it up for you.' },

{ id: 'curium_salt', name: 'Curium Salt', symbol: 'Cms', category: 'exotic',
  tags: ['radiogenic', 'exotic'], hosts: ['planet', 'core'], T: [300, 1400],
  density: 13.5, rarity: 0.02, value: 4800, hardness: 4, color: 0xc8a8ff,
  uses: 'Power density no chemical source approaches. Glows violet without any external light.',
  blurb: 'Should not exist at all this long after formation. Something here keeps making more.' },

{ id: 'promethite', name: 'Promethite', symbol: 'Pmt', category: 'exotic',
  tags: ['radiogenic', 'exotic'], hosts: ['planet', 'asteroid'], T: [200, 1100],
  density: 7.3, rarity: 0.03, value: 3600, hardness: 5, color: 0x8affc8,
  uses: 'Betavoltaic cells with a twenty-year output curve flat enough to calibrate against.',
  blurb: 'Every atom of it decays inside a human lifetime, so a deposit means recent nucleosynthesis.' },

/* ══ EXOTIC — conditions that barely occur ═══════════════════════ */

{ id: 'metallic_hydrogen', name: 'Metallic Hydrogen', symbol: 'mH', category: 'exotic',
  tags: ['exotic'], hosts: ['giant', 'core'], T: [1000, 20000],
  density: 0.7, rarity: 0.02, value: 9000, hardness: 0, color: 0xc8d8ff,
  uses: 'Metastable, and the most energetic chemical propellant physically possible.',
  blurb: 'A giant\'s core crushes hydrogen into a metal. Getting a sample out is the hard part.' },

{ id: 'superionic_ice', name: 'Superionic Ice', symbol: 'sIce', category: 'exotic',
  tags: ['exotic', 'volatile_ice'], hosts: ['giant', 'core'], T: [1000, 5000],
  density: 3.9, rarity: 0.03, value: 5200, hardness: 8, color: 0x7ac8ff,
  uses: 'Conducts ions like a liquid while staying solid. The dream solid electrolyte.',
  blurb: 'Oxygen locked in a crystal while the hydrogen flows through it freely. Black, and hot.' },

{ id: 'quark_slag', name: 'Quark Slag', symbol: 'Qsl', category: 'exotic',
  tags: ['exotic'], hosts: ['core'], T: [1000, 100000],
  density: 400, rarity: 0.005, value: 90000, hardness: 0, color: 0xff4a8a,
  uses: 'Inertial ballast and gravitational reference mass. A gram is worth a station.',
  blurb: 'Scraped from where something very dense passed too close. It should not be stable. It is.' },

{ id: 'chronite', name: 'Chronite', symbol: 'Crt', category: 'exotic',
  tags: ['exotic', 'refractory'], hosts: ['planet', 'asteroid', 'core'], T: [600, 3000],
  density: 12.8, rarity: 0.01, value: 26000, hardness: 9, color: 0x9a5aff,
  uses: 'Its lattice vibrations run measurably slow in a gravity well. The best clocks are cut from it.',
  blurb: 'Found only in bodies that have spent time deep inside a singularity\'s sphere of influence.' },

{ id: 'voidglass', name: 'Voidglass', symbol: 'Vgl', category: 'exotic',
  tags: ['exotic'], hosts: ['asteroid', 'planet', 'moon'], T: [0, 400],
  density: 2.9, rarity: 0.04, value: 3100, hardness: 7, color: 0x1a0a2a,
  uses: 'Absorbs across the whole spectrum. Sensor baffles and stealth cladding, nothing else.',
  blurb: 'Impact glass annealed in hard vacuum for aeons. Reflects nothing back, at any wavelength.' },

{ id: 'aurorite', name: 'Aurorite', symbol: 'Aur', category: 'exotic',
  tags: ['exotic', 'lithophile'], hosts: ['planet', 'moon'], T: [50, 400],
  density: 4.2, rarity: 0.06, value: 2200, hardness: 6, color: 0x4affd8,
  uses: 'Stores charge from a magnetosphere and releases it on demand. A geological battery.',
  blurb: 'Forms only under a strong magnetic field at a pole. It glows faintly during storms.' },

{ id: 'tidalite', name: 'Tidalite', symbol: 'Tdl', category: 'exotic',
  tags: ['exotic', 'silicate'], hosts: ['moon'], T: [200, 900],
  density: 5.1, rarity: 0.07, value: 1400, hardness: 7, color: 0xff8ac8,
  uses: 'Piezoelectric to an absurd degree — it was flexed every orbit for a billion years.',
  blurb: 'Only forms in a moon locked in resonance. The rock remembers the rhythm of its orbit.' },

{ id: 'starfall_alloy', name: 'Starfall Alloy', symbol: 'Sfa', category: 'exotic',
  tags: ['exotic', 'siderophile', 'refractory'], hosts: ['asteroid', 'planet'], T: [400, 2600],
  density: 16.4, rarity: 0.03, value: 7400, hardness: 8.5, color: 0xffd8a0,
  uses: 'Self-healing at temperature — a cracked component welds itself if you keep it hot.',
  blurb: 'Condensed in a supernova shockwave and swept up whole by whatever formed next.' },

{ id: 'nullstone', name: 'Nullstone', symbol: 'Nul', category: 'exotic',
  tags: ['exotic'], hosts: ['asteroid', 'core', 'planet'], T: [0, 2000],
  density: 0.02, rarity: 0.015, value: 12000, hardness: 3, color: 0x2a2a3a,
  uses: 'Very nearly massless and mechanically rigid. Every long-baseline truss is built of it.',
  blurb: 'Density a fiftieth of water and it does not compress. Nobody has explained it satisfactorily.' },

{ id: 'gravitite', name: 'Gravitite', symbol: 'Gvt', category: 'exotic',
  tags: ['exotic', 'siderophile'], hosts: ['core', 'planet'], T: [1000, 6000],
  density: 34.0, rarity: 0.008, value: 41000, hardness: 9, color: 0x3a2a5a,
  uses: 'Denser than any element. Used as reaction mass where volume is the binding constraint.',
  blurb: 'A degenerate lattice held by pressures only a core can supply. It cools without expanding.' },

{ id: 'emberglass', name: 'Emberglass', symbol: 'Emb', category: 'exotic',
  tags: ['exotic', 'refractory', 'silicate'], hosts: ['planet'], T: [1200, 3000],
  density: 3.3, rarity: 0.09, value: 900, hardness: 6.5, color: 0xff6a2a,
  uses: 'Retains and slowly re-emits heat for decades. Habitat thermal mass, on cold worlds.',
  blurb: 'Quenched from a lava ocean by a night side cold enough to freeze it mid-splash.' },

{ id: 'spindrift_crystal', name: 'Spindrift Crystal', symbol: 'Spd', category: 'crystal',
  tags: ['exotic', 'volatile_ice'], hosts: ['comet'], T: [0, 90],
  density: 1.1, rarity: 0.11, value: 760, hardness: 3, color: 0xb0f0ff,
  uses: 'Grows in one direction only, in freefall. Perfect optical fibre, kilometres at a time.',
  blurb: 'Only forms in a coma under no gravity at all. It cannot be manufactured, only harvested.' },

{ id: 'halovein', name: 'Halo Vein', symbol: 'Hvn', category: 'exotic',
  tags: ['exotic', 'volatile_ice', 'organic'], hosts: ['comet', 'asteroid'], T: [0, 120],
  density: 1.6, rarity: 0.13, value: 540, hardness: 4, color: 0x8ab0ff,
  uses: 'Interstellar grains never processed by any star. The only pristine matter available.',
  blurb: 'Older than this system. It drifted in from somewhere else and got caught.' },

/* ══ COMMON INDUSTRIAL — the boring, essential bulk ══════════════ */

{ id: 'regolith_fines', name: 'Regolith Fines', symbol: 'Reg', category: 'industrial',
  tags: ['silicate'], hosts: ['moon', 'asteroid', 'planet'], T: [0, 900],
  density: 1.5, rarity: 1.0, value: 0.5, hardness: 3, color: 0x9a9288,
  uses: 'Sintered shielding, printed structure, and ballast. Free, everywhere, endlessly.',
  blurb: 'Rock ground to abrasive powder by micrometeorites. It gets into every seal you own.' },

{ id: 'basalt_flow', name: 'Basalt Flow', symbol: 'Bas', category: 'industrial',
  tags: ['silicate'], hosts: ['planet', 'moon'], T: [100, 1500],
  density: 3.0, rarity: 0.95, value: 0.8, hardness: 6, color: 0x3a3a3e,
  uses: 'Cast basalt, rock wool, continuous fibre. The universal cheap structural material.',
  blurb: 'The default surface of every solid body that has ever been volcanically active.' },

{ id: 'breccia', name: 'Impact Breccia', symbol: 'Brc', category: 'industrial',
  tags: ['silicate', 'siderophile'], hosts: ['moon', 'planet', 'asteroid'], T: [0, 1200],
  density: 2.8, rarity: 0.88, value: 2, hardness: 5, color: 0x7a7068,
  uses: 'Aggregate, and a free sample of everything within a thousand kilometres of the crater.',
  blurb: 'Shattered rock welded back together by the same impact that shattered it.' },

{ id: 'phyllosilicate', name: 'Phyllosilicate Clay', symbol: 'Phy', category: 'ore',
  tags: ['silicate', 'hydrothermal'], hosts: ['asteroid', 'planet', 'moon'], T: [150, 500],
  density: 2.3, rarity: 0.76, value: 9, hardness: 2.5, color: 0x6a6a4a,
  uses: 'Bound water you can bake out — the cheapest water in the inner system.',
  blurb: 'Proof that this rock met liquid water once. On a C-type it is a fifth of the mass.' },

{ id: 'anhydrite', name: 'Anhydrite', symbol: 'CaSO4', category: 'industrial',
  tags: ['evaporite', 'sulphur'], hosts: ['planet', 'moon'], T: [200, 700],
  density: 2.98, rarity: 0.64, value: 3, hardness: 3.5, color: 0xe0dcd0,
  uses: 'Plaster, cement retarder, and sulphur when nothing better is in reach.',
  blurb: 'Gypsum with the water driven off. Add water and it sets hard again within the hour.' },

{ id: 'magnetite_band', name: 'Magnetite Band', symbol: 'Fe3O4', category: 'ore',
  tags: ['siderophile', 'hydrothermal'], hosts: ['planet', 'moon', 'asteroid'], T: [150, 1300],
  density: 5.15, rarity: 0.80, value: 4, hardness: 6, color: 0x2a2a30,
  uses: 'Iron ore that a magnet sorts for you. Also the core of every ferrite component.',
  blurb: 'Banded formations kilometres thick, laid down when a world\'s ocean first met free oxygen.' },

{ id: 'bauxite_cap', name: 'Bauxite Cap', symbol: 'Bxt', category: 'ore',
  tags: ['lithophile', 'biogenic'], hosts: ['planet'], T: [280, 340],
  density: 2.5, rarity: 0.40, value: 13, hardness: 3, color: 0xc86a3a,
  uses: 'Aluminium at a tenth the energy cost of extracting it from ordinary rock.',
  blurb: 'What is left after a hundred million years of tropical rain leaches everything else out.' },

{ id: 'apatite_bed', name: 'Apatite Bed', symbol: 'Apt', category: 'ore',
  tags: ['biogenic', 'lithophile'], hosts: ['planet'], T: [250, 900],
  density: 3.2, rarity: 0.54, value: 21, hardness: 5, color: 0xa8c8b8,
  uses: 'Phosphate for agriculture. Every closed food loop is limited by it, eventually.',
  blurb: 'Bone and tooth, compressed into rock. A biosphere leaves its skeleton in the strata.' },

{ id: 'silver_vein', name: 'Silver Vein', symbol: 'Ag', category: 'metal',
  tags: ['hydrothermal', 'chalcophile'], hosts: ['planet', 'moon'], T: [280, 800],
  density: 10.5, rarity: 0.32, value: 190, hardness: 2.7, color: 0xe8ecf0,
  uses: 'The best electrical and thermal conductor there is; contacts, brazing, mirror coatings.',
  blurb: 'Native metal in wire-like growths, filling cracks a hot fluid opened and then sealed.' },

{ id: 'tungsten_skarn', name: 'Tungsten Skarn', symbol: 'W', category: 'ore',
  tags: ['refractory', 'hydrothermal'], hosts: ['planet'], T: [400, 1300],
  density: 6.1, rarity: 0.36, value: 145, hardness: 5, color: 0xa8a098,
  uses: 'Highest melting point of any metal. Filaments, penetrators, reactor first-wall tiles.',
  blurb: 'Forms where a granite intrusion cooks a limestone and the two chemistries argue.' },

{ id: 'cobaltite', name: 'Cobaltite', symbol: 'CoAsS', category: 'ore',
  tags: ['chalcophile', 'siderophile'], hosts: ['planet', 'asteroid'], T: [300, 900],
  density: 6.3, rarity: 0.44, value: 110, hardness: 5.5, color: 0xb8c0c8,
  uses: 'Superalloys and cell cathodes. Also arsenic, which nobody wants but everybody gets.',
  blurb: 'Named for the goblins miners blamed when the ore poisoned them instead of yielding copper.' },

{ id: 'chromite_seam', name: 'Chromite Seam', symbol: 'FeCr2O4', category: 'ore',
  tags: ['siderophile', 'refractory'], hosts: ['planet', 'asteroid', 'moon'], T: [400, 1800],
  density: 4.8, rarity: 0.56, value: 32, hardness: 5.5, color: 0x2a2a2a,
  uses: 'Stainless steel, and refractory brick for anything that has to hold a melt.',
  blurb: 'Settles out of a cooling magma in sheets centimetres thick and kilometres across.' },

{ id: 'vanadinite', name: 'Vanadinite', symbol: 'Vnd', category: 'ore',
  tags: ['chalcophile', 'halide'], hosts: ['planet'], T: [250, 600],
  density: 6.8, rarity: 0.30, value: 84, hardness: 3, color: 0xd85a2a,
  uses: 'Vanadium for high-strength steel and for flow batteries at grid scale.',
  blurb: 'Brilliant red hexagonal prisms in the oxidised cap above a lead deposit.' },

{ id: 'beryl_pocket', name: 'Beryl Pocket', symbol: 'Be3Al2Si6O18', category: 'gem',
  tags: ['lithophile', 'hydrothermal'], hosts: ['planet', 'moon'], T: [280, 800],
  density: 2.7, rarity: 0.26, value: 175, hardness: 7.8, color: 0x4ad8a8,
  uses: 'Beryllium — transparent to x-rays, stiffer than steel at a fifth the mass.',
  blurb: 'Where it grows clear and green it is emerald, and worth more as a gem than as metal.' },

{ id: 'scandium_residue', name: 'Scandium Residue', symbol: 'Sc', category: 'ore',
  tags: ['lithophile', 'exotic'], hosts: ['planet', 'asteroid'], T: [300, 1200],
  density: 3.0, rarity: 0.18, value: 520, hardness: 4, color: 0xd8d8e8,
  uses: 'Aluminium-scandium alloy: weldable, age-hardening, and the best mass fraction going.',
  blurb: 'Never concentrated anywhere by ordinary geology. Recovered as a by-product or not at all.' },

{ id: 'gallium_pool', name: 'Gallium Pool', symbol: 'Ga', category: 'metal',
  tags: ['chalcophile', 'exotic'], hosts: ['planet', 'moon'], T: [250, 700],
  density: 5.9, rarity: 0.22, value: 380, hardness: 1.5, color: 0xc8d0e0,
  uses: 'Semiconductors, and a liquid metal coolant that stays liquid at habitat temperature.',
  blurb: 'Melts in your glove. On a warm world it pools in the low ground like mercury.' },

{ id: 'tellurite', name: 'Tellurite', symbol: 'TeO2', category: 'ore',
  tags: ['chalcophile', 'hydrothermal'], hosts: ['planet', 'asteroid'], T: [300, 800],
  density: 5.9, rarity: 0.20, value: 290, hardness: 2, color: 0xe8e0a8,
  uses: 'Thin-film photovoltaics and acousto-optic modulators. Rarer than platinum in a crust.',
  blurb: 'Anyone who works it sweats garlic for a week afterwards. There is no avoiding it.' },

{ id: 'antimonite', name: 'Stibnite', symbol: 'Sb2S3', category: 'ore',
  tags: ['chalcophile', 'hydrothermal'], hosts: ['planet'], T: [280, 650],
  density: 4.6, rarity: 0.38, value: 66, hardness: 2, color: 0x6a7078,
  uses: 'Flame retardants, hardening alloy for soft metals, and infrared optics.',
  blurb: 'Grows in sprays of steel-grey blades a metre long that shatter if you look at them wrong.' },

{ id: 'realgar', name: 'Realgar', symbol: 'AsS', category: 'ore',
  tags: ['chalcophile', 'sulphur', 'hydrothermal'], hosts: ['planet', 'moon'], T: [250, 550],
  density: 3.6, rarity: 0.34, value: 42, hardness: 1.8, color: 0xd8582a,
  uses: 'Arsenic for semiconductor doping and for alloys that must not corrode in brine.',
  blurb: 'Ruby-red until sunlight touches it, then it crumbles to orange powder within weeks.' },

{ id: 'opal_field', name: 'Hydrous Opal Field', symbol: 'Opl', category: 'gem',
  tags: ['hydrothermal', 'evaporite'], hosts: ['planet', 'moon'], T: [250, 400],
  density: 2.1, rarity: 0.30, value: 96, hardness: 5.5, color: 0xa8e8f0,
  uses: 'Water bound in silica — and where the spheres stack evenly, a natural photonic crystal.',
  blurb: 'Diffracts light into colour by structure alone. It contains no pigment whatsoever.' },

{ id: 'geothermal_scale', name: 'Geothermal Scale', symbol: 'Gsc', category: 'ore',
  tags: ['hydrothermal', 'evaporite'], hosts: ['planet', 'moon'], T: [280, 600],
  density: 3.4, rarity: 0.52, value: 40, hardness: 4, color: 0xc8b09a,
  uses: 'Concentrates lithium, caesium and rubidium from brine at no pumping cost.',
  blurb: 'Clogs every pipe on a geothermal field, and every operator mines it back out at a profit.' },

{ id: 'caesium_brine', name: 'Caesium Brine', symbol: 'Cs', category: 'exotic',
  tags: ['evaporite', 'exotic'], hosts: ['planet'], T: [250, 450],
  density: 2.4, rarity: 0.14, value: 640, hardness: 1, color: 0xf0d858,
  uses: 'Atomic clocks and ion-drive propellant. The system\'s time standard runs on it.',
  blurb: 'The densest liquid that stays liquid at habitat temperature. Steel floats in it.' },

{ id: 'ferrofluid_seep', name: 'Ferrofluid Seep', symbol: 'Ffs', category: 'exotic',
  tags: ['exotic', 'siderophile', 'hydrothermal'], hosts: ['moon', 'planet'], T: [200, 500],
  density: 3.8, rarity: 0.10, value: 880, hardness: 0, color: 0x2a2a4a,
  uses: 'Seals rotating shafts against vacuum with no contact and no wear at all.',
  blurb: 'A magnetite colloid that stands up in spikes when a field crosses it. It seeps, naturally.' },

{ id: 'permafrost_hydrate', name: 'Permafrost Hydrate', symbol: 'Pfh', category: 'fuel',
  tags: ['volatile_ice', 'organic'], hosts: ['planet', 'moon'], T: [100, 273],
  density: 1.0, rarity: 0.72, value: 14, hardness: 2, color: 0xc8dce8,
  uses: 'Water, methane and nitrogen from a single bore. The standard outpost supply well.',
  blurb: 'Ground frozen since the world formed, holding everything that ever tried to escape it.' },

{ id: 'sublimate_crust', name: 'Sublimate Crust', symbol: 'Sbl', category: 'industrial',
  tags: ['volatile_ice', 'evaporite'], hosts: ['comet', 'moon'], T: [0, 200],
  density: 1.3, rarity: 0.60, value: 18, hardness: 2.5, color: 0xd0c8b8,
  uses: 'The mineral residue a comet leaves behind, pre-concentrated by the ice that left.',
  blurb: 'A dark lag deposit that eventually seals the comet\'s own surface and quiets its tail.' },

{ id: 'stardust_grain', name: 'Presolar Grains', symbol: 'Psg', category: 'exotic',
  tags: ['exotic', 'refractory'], hosts: ['comet', 'asteroid'], T: [0, 1600],
  density: 3.2, rarity: 0.08, value: 2600, hardness: 9, color: 0xd8c8f0,
  uses: 'Isotopically alien. Each grain records the death of a star that predates this one.',
  blurb: 'Silicon carbide dust from another star, swept up unmelted when this system condensed.' }

];

export const MINERALS = M;
export const MINERAL = Object.fromEntries(M.map(m => [m.id, m]));
export function mineralById(id) { return MINERAL[id] || null; }

export const CATEGORIES = [...new Set(M.map(m => m.category))].sort();

/** Every mineral that can form at this temperature. */
export function mineralsAtTemp(tempK) {
  return M.filter(m => tempK >= m.T[0] && tempK <= m.T[1]);
}

/**
 * Candidates for a body: the mineral must be able to form at the body's
 * temperature, must occur in that body type, and must share at least one
 * formation tag with what the host's world class actually offers.
 */
export function candidatesFor({ tempK, hostType, tags }) {
  const want = new Set(tags || []);
  return M.filter(m => {
    if (tempK !== undefined && (tempK < m.T[0] || tempK > m.T[1])) return false;
    if (hostType && !m.hosts.includes(hostType)) return false;
    if (want.size && !m.tags.some(t => want.has(t))) return false;
    return true;
  });
}

/** Coarse tier for UI colouring and for pricing bands. */
export function rarityTier(m) {
  if (m.rarity >= 0.7) return 'common';
  if (m.rarity >= 0.4) return 'uncommon';
  if (m.rarity >= 0.15) return 'rare';
  if (m.rarity >= 0.05) return 'very rare';
  return 'exceptional';
}
