// Living Galaxy — the economic branch.
//
// Industry makes things; this branch decides what they are worth and who knows about
// them. It is the branch that turns a site from a supply of materials into a *market*,
// and the one that pays in credits rather than in tonnes.
//
// Its facilities mostly modify the price book and the contract board rather than producing
// cargo, which makes it the hardest branch to evaluate at a glance and the strongest one
// on a world that already has industry next door.

export const ECONOMIC = {
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
