// Living Galaxy — the logistics branch.
//
// Making a thing on a planet and getting it off the planet are separate problems, and the
// second one is the harder of the two. This branch is storage, lift and routing: without
// it a productive site simply fills up and stops.
//
// It is the branch most players will underrate on their first complex, which is why the
// warehouse is tier 1 and cheap. Discovering that your smelter has been idle for an hour
// because the silo is full should cost you an hour, not a complex.

export const LOGISTIC = {
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
