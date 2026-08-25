// Living Galaxy — the military branch.
//
// A site with something worth taking will eventually be visited by people who want it.
// This branch is what makes a claim hold: detection, denial, and the ability to put armed
// hulls in the air without flying them in from somewhere else.
//
// Nothing here produces materials. That is the trade the branch represents — slots spent
// on guns are slots not spent on smelters, and a world can only carry so many.

export const MILITARY = {
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
