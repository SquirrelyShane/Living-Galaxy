// Living Galaxy — planetary command centres.
//
// The first thing you plant on a world, and the thing everything else hangs off. It is
// typed to the world because the engineering genuinely is: you cannot anchor a crust
// platform in an ocean, and a skyhook floating in a gas giant has nothing to anchor *to*.
//
// A centre gives the site three things: how many facility slots it supports, how much
// power it generates before anything else is built, and a tier ceiling on what can be
// installed. Upgrading a centre is the gate on a site's whole development — which makes
// it the decision worth making carefully rather than a formality you click past.
//
// Every centre is buildable from the same crafting tree as everything else. Nothing here
// costs "influence" or "colony points"; it costs steel, circuitry and hours, which is what
// keeps the planetary layer connected to the mining and manufacturing the player already
// does rather than being a parallel currency stapled on beside it.

const SOLID = ['lava', 'molten', 'barren', 'ironCore', 'carbon', 'terrestrial', 'desert',
               'tundra', 'ice', 'methaneIce', 'sulfur', 'toxic', 'radioactive',
               'crystalline', 'superEarth'];
const LIQUID = ['ocean', 'methaneSea'];
const GAS = ['gasGiant', 'heliumGiant', 'methaneGiant'];

export const COMMAND_CENTRES = {
  // ── tier 1 — a foothold ──────────────────────────────────────────
  outpost: {
    name: 'Survey Outpost', tier: 1, icon: '⌂',
    worlds: [...SOLID, ...LIQUID, ...GAS],
    slots: 2, power: 40, upkeep: 120,
    build: { 'REF-001': 400, 'REF-004': 60, 'CMP-001': 12, 'CMP-003': 4 },
    hours: 36,
    desc: 'Prefab shelter, a mast and a fabricator the size of a van. Enough to prove a ' +
          'claim and run two facilities; not enough to run an industry.'
  },

  // ── tier 2 — typed to the ground ─────────────────────────────────
  crustAnchor: {
    name: 'Crust Anchor', tier: 2, icon: '⛰',
    worlds: SOLID,
    slots: 5, power: 220, upkeep: 640,
    build: { 'REF-001': 2400, 'REF-002': 400, 'REF-004': 300, 'CMP-001': 60,
             'CMP-005': 20, 'REF-011': 180 },
    hours: 180,
    desc: 'Piles driven into bedrock and a hardened core. The standard solid-world site — ' +
          'stable, unglamorous, and the cheapest route to a real complex.'
  },
  seaPlatform: {
    name: 'Sea Platform', tier: 2, icon: '≈',
    worlds: LIQUID,
    slots: 4, power: 200, upkeep: 720,
    build: { 'REF-001': 2000, 'REF-002': 600, 'REF-009': 200, 'CMP-001': 55,
             'CMP-005': 18, 'REF-012': 120 },
    hours: 200,
    desc: 'A moored platform with a keel down into the column. Fewer slots than an anchor ' +
          'and a worse upkeep, but it is the only way to work a liquid world at all.'
  },
  skyhook: {
    name: 'Atmospheric Skyhook', tier: 2, icon: '◇',
    worlds: GAS,
    slots: 4, power: 260, upkeep: 900,
    build: { 'REF-002': 1400, 'REF-009': 500, 'REF-011': 300, 'CMP-001': 70,
             'CMP-005': 30, 'CMP-009': 10 },
    hours: 240,
    desc: 'A lifting body holding station in the upper atmosphere with intakes trailing ' +
          'below. Expensive to keep aloft; the only thing that can drink from a gas giant.'
  },

  // ── tier 3 — a real industry ─────────────────────────────────────
  industrialComplex: {
    name: 'Planetary Industrial Complex', tier: 3, icon: '⬢',
    worlds: [...SOLID, ...LIQUID, ...GAS],
    slots: 10, power: 900, upkeep: 2600,
    build: { 'REF-001': 9000, 'REF-002': 2200, 'REF-004': 1400, 'REF-011': 900,
             'CMP-001': 260, 'CMP-005': 90, 'CMP-009': 40, 'CMP-013': 20 },
    hours: 720,
    requires: { centre: ['crustAnchor', 'seaPlatform', 'skyhook'] },
    desc: 'The PIC. A ten-slot works with its own reactor farm, rail spine and orbital ' +
          'lift. It is built *from* a tier-2 site rather than beside one — you upgrade ' +
          'into it, which is why the first one takes a month and the second takes a week.'
  }
};

export const CENTRE_KEYS = Object.keys(COMMAND_CENTRES);

/** Which centres can be planted on a given world, cheapest tier first. */
export const centreFor = planetType =>
  CENTRE_KEYS.filter(k => COMMAND_CENTRES[k].worlds.includes(planetType))
             .sort((a, b) => COMMAND_CENTRES[a].tier - COMMAND_CENTRES[b].tier);

/**
 * The upgrade path from a centre. A PIC is reached *through* a tier-2 site, never
 * directly from an outpost: the sequence is the progression, and skipping it would make
 * the tier-2 centres a tax rather than a stage.
 */
export function upgradesFrom(centreKey, planetType) {
  const here = COMMAND_CENTRES[centreKey];
  if (!here) return [];
  return centreFor(planetType).filter(k => {
    const c = COMMAND_CENTRES[k];
    if (c.tier <= here.tier) return false;
    if (c.requires && c.requires.centre) return c.requires.centre.includes(centreKey);
    return c.tier === here.tier + 1;
  });
}
