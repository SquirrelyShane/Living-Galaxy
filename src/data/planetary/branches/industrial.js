// Living Galaxy — the industrial branch.
//
// Digging, smelting and fabricating: the branch that turns a world into the front of the
// crafting tree. Everything else in the game buys its materials; this is where they come
// from in the first place.
//
// A facility declares what it *needs from the ground* rather than a list of planet types.
// A smelter that says "solid surface, 60 power" keeps working when someone adds the
// twenty-first planet type; one that lists fifteen world names by hand quietly stops.

export const INDUSTRIAL = {
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
