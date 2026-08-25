// Living Galaxy — the five branches a planetary site can be built around.
//
// They are the same five words as the career paths, deliberately. A pilot who chose
// Prospector and then lands on a world should find "Industrial" waiting for them rather than
// a fresh vocabulary to learn; the ground and the career are the same idea at two scales.
//
// ## One file, since v1.02.45
//
// This was six files — a barrel and one per branch — on the stated reasoning that "each branch
// will grow at different rates and by different hands. Adding a facility should touch one
// file." Neither half held up. They are 52 to 59 lines each, none has grown since it was
// written, there is one pair of hands, and the barrel that joined them was longer than the
// difference. What the split actually bought was six files to open to answer one question and
// five imports that only ever resolved to one table.
//
// The rule this is applied under: **a file earns its own existence by having a boundary
// somebody has to respect.** `world/particle-shader.js` is 46 lines and earns it, because
// importing nothing is what lets `tools/shader-check.html` compile GLSL without three.js.
// These five had no boundary — the barrel re-exported all of them, so every consumer already
// saw the whole set.

// Living Galaxy — the military branch.
//
// A site with something worth taking will eventually be visited by people who want it.
// This branch is what makes a claim hold: detection, denial, and the ability to put armed
// hulls in the air without flying them in from somewhere else.
//
// Nothing here produces materials. That is the trade the branch represents — slots spent
// on guns are slots not spent on smelters, and a world can only carry so many.

const MILITARY = {
  name: 'Military',
  icon: '⚔',
  desc: 'Defence, detection and hulls. Holds a claim that industry makes worth holding.',
  facilities: [
    { id: 'mil-sensor', name: 'Deep Sensor Array', tier: 1, slots: 1, power: 60,
      build: { 'REF-001': 200, 'REF-004': 80, 'CMP-001': 14, 'CMP-003': 6 }, hours: 30,
      effect: { detection: 2400 },
      desc: 'Sees a raid forming rather than arriving. Extends the site\u2019s own detection ' +
            'envelope, and feeds it to any friendly hull in range.' },

    { id: 'mil-battery', name: 'Surface Battery', tier: 2, slots: 1, power: 120,
      requires: ['solid'],
      build: { 'REF-001': 700, 'REF-002': 220, 'CMP-004': 16, 'CMP-001': 20 }, hours: 72,
      effect: { defence: 40, range: 1800 },
      desc: 'Hardened emplacements on the approach lanes. Cheap, immobile, and very ' +
            'unpleasant to overfly.' },

    { id: 'mil-shield', name: 'Site Shield Generator', tier: 3, slots: 2, power: 340,
      build: { 'REF-002': 1200, 'REF-011': 600, 'CMP-005': 50, 'CMP-009': 20 }, hours: 200,
      effect: { shield: 2600 },
      desc: 'A dome over the whole complex. Absorbs an orbital bombardment for as long as ' +
            'the reactors hold \u2014 which is why power is the first thing a raider tries ' +
            'to knock out.' },

    { id: 'mil-hangar', name: 'Patrol Hangar', tier: 2, slots: 2, power: 190,
      build: { 'REF-001': 1000, 'REF-002': 300, 'CMP-001': 44, 'CMP-005': 16 }, hours: 140,
      effect: { patrols: 2 },
      desc: 'Berths, fuel and a strip. Launches and rearms a standing patrol over the ' +
            'site rather than waiting for the Coalition to notice.' },

    { id: 'mil-garrison', name: 'Garrison Barracks', tier: 2, slots: 1, power: 80,
      build: { 'REF-001': 600, 'BIO-001': 200, 'CMP-001': 18 }, hours: 90,
      effect: { boarding: 3, crewRest: 1.5 },
      desc: 'Troops against boarding, and bunks that let a ship\u2019s crew take real shore ' +
            'leave without flying to a station for it.' },

    { id: 'mil-yard', name: 'Defence Yard', tier: 3, slots: 3, power: 420,
      build: { 'REF-001': 3000, 'REF-002': 1100, 'CMP-001': 160, 'CMP-005': 70, 'CMP-013': 10 },
      hours: 300, manufactures: ['weapon'], speed: 1.2,
      desc: 'Builds ship weapons on site and refits the hulls flying from the hangar. The ' +
            'military branch\u2019s only manufacturing, and deliberately narrow.' }
  ]
};

// Living Galaxy — the industrial branch.
//
// Digging, smelting and fabricating: the branch that turns a world into the front of the
// crafting tree. Everything else in the game buys its materials; this is where they come
// from in the first place.
//
// A facility declares what it *needs from the ground* rather than a list of planet types.
// A smelter that says "solid surface, 60 power" keeps working when someone adds the
// twenty-first planet type; one that lists fifteen world names by hand quietly stops.

const INDUSTRIAL = {
  name: 'Industrial',
  icon: '⛏',
  desc: 'Extraction, refining and fabrication. Feeds every other branch and every shipyard.',
  facilities: [
    { id: 'ind-drill', name: 'Core Drill', tier: 1, slots: 1, power: 45, requires: ['solid'],
      build: { 'REF-001': 260, 'REF-002': 60, 'CMP-001': 8 }, hours: 24,
      extracts: 'ore', rate: 22,
      desc: 'Sinks a shaft and pulls whatever the crust holds. Rate scales with the ' +
            'world\u2019s richness in each material, so the same drill is worth three times ' +
            'as much on an iron core as on a carbon world.' },

    { id: 'ind-scoop', name: 'Atmospheric Scoop', tier: 2, slots: 1, power: 90, requires: ['gas'],
      build: { 'REF-002': 340, 'REF-011': 120, 'CMP-001': 14, 'CMP-005': 4 }, hours: 40,
      extracts: 'gas', rate: 30,
      desc: 'Ram intakes and a cryo separator. The only way to get helium-3 and deuterium ' +
            'out of a giant rather than buying them.' },

    { id: 'ind-brine', name: 'Brine Extractor', tier: 2, slots: 1, power: 70, requires: ['water'],
      build: { 'REF-001': 220, 'REF-009': 90, 'CMP-001': 10 }, hours: 30,
      extracts: 'liquid', rate: 26,
      desc: 'Evaporation cascades working a liquid column for salts, lithium and water.' },

    { id: 'ind-smelter', name: 'Smelter', tier: 2, slots: 2, power: 140, requires: ['solid'],
      build: { 'REF-001': 900, 'REF-002': 240, 'REF-011': 120, 'CMP-001': 30 }, hours: 96,
      refines: 1, throughput: 40,
      desc: 'Turns ore into refined metal on site. Shipping ore is shipping rock \u2014 a ' +
            'smelter at the pit head is the single biggest saving a supply chain can make.' },

    { id: 'ind-fab', name: 'Component Fabricator', tier: 3, slots: 2, power: 260,
      build: { 'REF-001': 1600, 'REF-004': 500, 'CMP-001': 90, 'CMP-005': 30 }, hours: 168,
      refines: 2, throughput: 22,
      desc: 'Clean rooms and lithography. Makes circuitry, actuators and optics \u2014 the ' +
            'intermediate components every blueprint above tier 1 assumes you can buy.' },

    { id: 'ind-assembly', name: 'Module Assembly Line', tier: 3, slots: 3, power: 380,
      build: { 'REF-001': 2600, 'REF-002': 800, 'CMP-001': 140, 'CMP-005': 60, 'CMP-009': 14 },
      hours: 260, manufactures: ['module', 'weapon'], speed: 1.0,
      desc: 'A full works. Builds ship modules and weapons from the catalogue, which is ' +
            'the point of the whole branch \u2014 a PIC with one of these makes you ' +
            'independent of every shipyard in the system.' },

    { id: 'ind-munitions', name: 'Munitions Plant', tier: 2, slots: 2, power: 180,
      build: { 'REF-001': 1100, 'REF-004': 260, 'CMP-001': 40, 'CMP-004': 12 }, hours: 120,
      manufactures: ['ammo'], speed: 1.4,
      desc: 'Ammunition by the stack. Cheaper per round than anything a station will sell ' +
            'you, and the reason a war is easier to fight from a planet than from a hold.' }
  ]
};

// Living Galaxy — the logistics branch.
//
// Making a thing on a planet and getting it off the planet are separate problems, and the
// second one is the harder of the two. This branch is storage, lift and routing: without
// it a productive site simply fills up and stops.
//
// It is the branch most players will underrate on their first complex, which is why the
// warehouse is tier 1 and cheap. Discovering that your smelter has been idle for an hour
// because the silo is full should cost you an hour, not a complex.

const LOGISTIC = {
  name: 'Logistic',
  icon: '\u25a4',
  desc: 'Storage, lift and routing. The difference between a site that produces and a ' +
        'site that delivers.',
  facilities: [
    { id: 'log-silo', name: 'Bulk Silo', tier: 1, slots: 1, power: 20,
      build: { 'REF-001': 240, 'CMP-001': 4 }, hours: 20,
      effect: { storage: 40000 },
      desc: 'Sealed bulk storage. Unglamorous and the first thing you will wish you had ' +
            'built two of.' },

    { id: 'log-pad', name: 'Landing Pad', tier: 1, slots: 1, power: 35,
      build: { 'REF-001': 320, 'REF-002': 60, 'CMP-001': 8 }, hours: 26,
      effect: { dockable: true, transfer: 900 },
      desc: 'Lets you set down and load directly. Without a pad a site can only be worked ' +
            'from orbit, at a fraction of the transfer rate.' },

    { id: 'log-lift', name: 'Orbital Mass Lift', tier: 3, slots: 2, power: 300,
      requires: ['solid'],
      build: { 'REF-002': 1800, 'REF-009': 700, 'CMP-005': 60, 'CMP-009': 24 }, hours: 280,
      effect: { transfer: 9000, autoLift: true },
      desc: 'A tether and a climber. Moves cargo to orbit continuously and without a hull ' +
            'in the loop \u2014 the facility that turns a complex into a supplier rather ' +
            'than a place you visit.' },

    { id: 'log-depot', name: 'Freight Depot', tier: 2, slots: 1, power: 70,
      build: { 'REF-001': 700, 'CMP-001': 22, 'CMP-003': 6 }, hours: 80,
      effect: { storage: 90000, contracts: 2 },
      desc: 'Sorting, manifests and a standing contract desk. Posts haulage work for its ' +
            'own surplus, which is how a site starts paying for itself.' },

    { id: 'log-route', name: 'Route Control', tier: 3, slots: 1, power: 160,
      build: { 'REF-004': 400, 'CMP-001': 90, 'CMP-003': 24, 'CMP-009': 8 }, hours: 150,
      effect: { routes: 3, tradeBonus: 0.06 },
      desc: 'Automates standing shipments between your own sites. Three routes running ' +
            'unattended is the point at which a scattering of outposts becomes a network.' },

    { id: 'log-cryo', name: 'Cryogenic Store', tier: 2, slots: 1, power: 120,
      build: { 'REF-002': 400, 'REF-011': 200, 'CMP-005': 14 }, hours: 90,
      effect: { storage: 30000, volatiles: true },
      desc: 'Holds gases and ices that a bulk silo would simply lose. Required if you ' +
            'intend to keep anything a scoop pulls out of a giant.' }
  ]
};

// Living Galaxy — the economic branch.
//
// Industry makes things; this branch decides what they are worth and who knows about
// them. It is the branch that turns a site from a supply of materials into a *market*,
// and the one that pays in credits rather than in tonnes.
//
// Its facilities mostly modify the price book and the contract board rather than producing
// cargo, which makes it the hardest branch to evaluate at a glance and the strongest one
// on a world that already has industry next door.

const ECONOMIC = {
  name: 'Economic',
  icon: '\u2696',
  desc: 'Markets, assay and finance. Turns production into price, and price into income.',
  facilities: [
    { id: 'eco-assay', name: 'Assay Office', tier: 1, slots: 1, power: 30,
      build: { 'REF-001': 180, 'CMP-001': 10, 'CMP-003': 4 }, hours: 24,
      effect: { surveyDepth: 1, priceInfo: true },
      desc: 'Certifies what the site is actually producing. Unlocks the full assay on ' +
            'everything the world yields, and the honest price for it.' },

    { id: 'eco-market', name: 'Commodity Exchange', tier: 2, slots: 2, power: 110,
      build: { 'REF-001': 800, 'REF-004': 200, 'CMP-001': 40, 'CMP-003': 12 }, hours: 120,
      effect: { market: true, spread: -0.04 },
      desc: 'A real book on the surface. Buys and sells at better rates than a passing ' +
            'hauler will offer, and lets the site trade while you are elsewhere.' },

    { id: 'eco-bank', name: 'Clearing House', tier: 3, slots: 1, power: 140,
      build: { 'REF-004': 500, 'CMP-001': 110, 'CMP-003': 30, 'CMP-009': 10 }, hours: 200,
      effect: { financing: true, upkeepCut: 0.18 },
      desc: 'Credit against the site\u2019s own output. Cuts upkeep across the complex and ' +
            'finances construction you could not otherwise front.' },

    { id: 'eco-bonded', name: 'Bonded Warehouse', tier: 2, slots: 1, power: 60,
      build: { 'REF-001': 520, 'CMP-001': 20 }, hours: 70,
      effect: { storage: 50000, tariffCut: 0.5 },
      desc: 'Goods held out of customs until sold. Halves the tariff on anything moving ' +
            'through, which on a Coalition world is most of the margin.' },

    { id: 'eco-broker', name: 'Contract Brokerage', tier: 2, slots: 1, power: 80,
      build: { 'REF-004': 260, 'CMP-001': 44, 'CMP-003': 10 }, hours: 96,
      effect: { contracts: 3, contractPay: 0.12 },
      desc: 'Posts work on the site\u2019s behalf and takes a cut. More contracts on the ' +
            'board here, and better fees on them.' },

    { id: 'eco-mint', name: 'Refinery Mint', tier: 3, slots: 2, power: 220,
      build: { 'REF-020': 200, 'REF-004': 600, 'CMP-001': 80, 'CMP-009': 16 }, hours: 240,
      effect: { valueAdd: 0.22 },
      desc: 'Turns precious-metal ore into certified bullion on site. Adds a fifth to the ' +
            'value of everything the world digs out of that category.' }
  ]
};

// Living Galaxy — the civilian branch.
//
// People. Every other branch assumes a workforce and none of them provide one, which is
// the gap this fills: habitation raises the site's effective output, farms feed it, and
// medical and research facilities pay back in crew condition and in unlocks rather than
// in cargo.
//
// It is also the only branch that produces biological materials, which the crafting tree
// needs for medical items, bio-polymers and half the personal kit catalogue. A galaxy with
// no farms cannot make a medkit.

const CIVILIAN = {
  name: 'Civilian',
  icon: '\u2302',
  desc: 'Population, agriculture, medicine and research. The workforce every other branch ' +
        'assumes it already has.',
  facilities: [
    { id: 'civ-hab', name: 'Habitation Block', tier: 1, slots: 1, power: 50,
      build: { 'REF-001': 300, 'BIO-001': 80, 'CMP-001': 10 }, hours: 40,
      effect: { population: 400, outputBonus: 0.08 },
      desc: 'Somewhere for the workforce to live. Every block raises what the whole site ' +
            'produces \u2014 facilities run better when they are fully crewed.' },

    { id: 'civ-farm', name: 'Hydroponics Farm', tier: 1, slots: 1, power: 60,
      requires: ['solid'],
      build: { 'REF-001': 260, 'REF-011': 60, 'CMP-001': 12 }, hours: 36,
      extracts: 'bio', rate: 14,
      desc: 'Racked hydroponics under lamps. Produces biomass and algal culture, and feeds ' +
            'the habitation blocks that everything else depends on.' },

    { id: 'civ-bioreactor', name: 'Bioreactor Suite', tier: 2, slots: 2, power: 150,
      build: { 'REF-002': 500, 'REF-011': 200, 'CMP-001': 36, 'CMP-005': 12 }, hours: 130,
      refines: 1, throughput: 18, bio: true,
      desc: 'Cultures bacteria, mycelium and nanite precursors. The only source of the ' +
            'biological components the medical and personal-kit catalogues are built from.' },

    { id: 'civ-medical', name: 'Medical Centre', tier: 2, slots: 1, power: 90,
      build: { 'REF-001': 400, 'BIO-005': 40, 'CMP-001': 30, 'CMP-003': 8 }, hours: 100,
      effect: { crewHeal: 3.0, morale: 0.06 },
      desc: 'A real infirmary. Treats a ship\u2019s crew far faster than a station will, and ' +
            'lifts morale across the site.' },

    { id: 'civ-research', name: 'Research Campus', tier: 3, slots: 2, power: 280,
      build: { 'REF-002': 900, 'REF-004': 400, 'CMP-001': 120, 'CMP-003': 40, 'CMP-009': 18 },
      hours: 320, effect: { research: 1, blueprintTier: 1 },
      desc: 'Raises the tier of blueprint the whole complex can build. The only way to ' +
            'manufacture the top of the catalogue without buying the design first.' },

    { id: 'civ-workshop', name: 'Artisan Workshop', tier: 2, slots: 1, power: 70,
      build: { 'REF-001': 380, 'CMP-001': 26, 'CMP-004': 8 }, hours: 84,
      manufactures: ['personal'], speed: 1.0,
      desc: 'Small-batch personal kit \u2014 suits, sidearms, tools, medical. Nothing a ' +
            'fleet needs and everything a person does.' }
  ]
};

export const BRANCHES = {
  military: MILITARY,
  industrial: INDUSTRIAL,
  logistic: LOGISTIC,
  economic: ECONOMIC,
  civilian: CIVILIAN
};
export const BRANCH_KEYS = Object.keys(BRANCHES);

/** Career path to the branch a pilot of that career will feel at home in. */
export const BRANCH_FOR_CAREER = {
  enforcer: 'military', prospector: 'industrial', hauler: 'logistic',
  broker: 'economic', pathfinder: 'civilian',
  // An executive's *default* branch, not a limit: their company charter decides which
  // branch runs at a bonus, and the charter is chosen at incorporation.
  executive: 'economic'
};

export { MILITARY, INDUSTRIAL, LOGISTIC, ECONOMIC, CIVILIAN };
