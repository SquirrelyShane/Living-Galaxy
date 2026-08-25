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

export const CIVILIAN = {
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
