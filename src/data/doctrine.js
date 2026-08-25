// Living Galaxy — telling ARIA what kind of ship this is.
//
// ## The gap this fills
//
// The autopilot decides what the ship *needs*: a hurt hull wants a yard, a full hold wants a
// market, an empty account wants something to sell. That is a good model and it has one blind
// spot, and it is a big one — it has no idea what the *player* wants.
//
// Two pilots with identical hulls in identical systems get identical behaviour, because the
// needs model cannot tell the difference between somebody running a mining operation and
// somebody running a war. Which makes the idle layer a machine that plays one game, rather
// than a machine that plays *your* game while you are not looking.
//
// A doctrine is the missing input. It does not override the needs model — a hull at 20% still
// goes to a yard whatever you told it — it *weights* it, so the same ship in the same place
// makes a different living depending on what you pointed it at.
//
// ## Why weights and not scripts
//
// The obvious version is a mode switch: "mining mode does mining". That throws away
// everything the needs model knows and puts you back to a macro that flies past the repair
// bay. Weights compose instead: a war doctrine still sells a full hold, it just never chooses
// to go and fill one, and it takes a fight it would otherwise have declined.
//
// `bias` multiplies a task's score. `floor` is a *minimum* score for a task the scorer has
// already found, which is what stops a doctrine's own speciality being edged out by a
// higher-scoring distraction. `refuse` is the short list a doctrine will not do at all.
//
// Note what `floor` deliberately is not: it cannot conjure a task out of nothing. A mining
// doctrine in a system with no rock in sensor range has nothing to weight, because a task
// without a target is not something the ship can be sent to do — the scorer resolves
// *which rock*, and no amount of preference produces one where there is none. A doctrine
// changes what she reaches for; it does not change what is in reach.

export const DOCTRINES = {
  balanced: {
    name: 'Balanced',
    icon: '◈',
    blurb: 'Whatever the ship needs next. The needs model, unweighted.',
    detail: 'No preference. She reads the hull, the hold and the sky and picks the most ' +
            'useful thing available — which is the right answer when you have no particular ' +
            'plan and a bad one when you do.',
    bias: {},
    floor: {},
    refuse: []
  },

  mining: {
    name: 'Prospecting',
    icon: '⛏',
    blurb: 'Cut rock, sell rock, buy a bigger cutter.',
    detail: 'Fills the hold, empties it at the best berth in reach, and treats a fight as ' +
            'something to leave rather than something to win. The steadiest income in the ' +
            'game and the slowest.',
    bias: { mine: 1.9, sell: 1.3, service: 1.0, hunt: 0.15 },
    floor: { mine: 26 },
    refuse: []
  },

  trade: {
    name: 'Commercial',
    icon: '⚖',
    blurb: 'Freight, consignments, and the spread between two berths.',
    detail: 'Takes work off boards, runs it, and reads prices on the way. Wants cargo space ' +
            'and standing more than it wants guns — a hull flying this should be fitted for ' +
            'volume, not for trouble.',
    bias: { deliver: 2.0, service: 1.5, sell: 1.4, mine: 0.7, hunt: 0.1 },
    floor: { service: 18 },
    refuse: []
  },

  war: {
    name: 'Letters of Marque',
    icon: '✦',
    blurb: 'Find what is hostile. Make it stop being hostile.',
    detail: 'Hunts, takes bounties, and rearms before it does anything else. Expensive, ' +
            'dangerous, and the only doctrine that treats an armed contact as an opportunity ' +
            'rather than a problem. It will still break off a fight it is losing.',
    bias: { hunt: 2.4, service: 1.2, mine: 0.25, deliver: 0.6 },
    floor: { hunt: 34 },
    refuse: []
  },

  bounty: {
    name: 'Bounty Work',
    icon: '⌖',
    blurb: 'Only the ones with a price on them.',
    detail: 'War with paperwork. Hunts marks that pay and leaves the rest alone, which keeps ' +
            'standing intact while the guns earn — the difference between a privateer and a ' +
            'pirate is entirely in whose list you are working from.',
    bias: { hunt: 2.0, service: 1.3, deliver: 0.9, mine: 0.4 },
    floor: { hunt: 22 },
    refuse: [],
    // Bounty work is fussy about targets in a way plain war is not: no price, no interest.
    bountyOnly: true
  },

  salvage: {
    name: 'Reclamation',
    icon: '⌗',
    blurb: 'Somebody else already paid for this hull. It is scrap now.',
    detail: 'Works wrecks and graveyards, sells what comes out, and avoids the living. ' +
            'Salvage is contraband inside Coalition space, which makes this the doctrine ' +
            'most likely to have an interesting conversation at a clearance scan.',
    bias: { salvage: 2.2, sell: 1.3, mine: 0.8, hunt: 0.2 },
    floor: { salvage: 24 },
    refuse: []
  },

  construction: {
    name: 'Works',
    icon: '⌸',
    blurb: 'Feed the sites. Build the thing.',
    detail: 'Runs materials to your own planetary sites and company works, mines what they ' +
            'are short of, and treats selling as what you do with the surplus rather than ' +
            'the point. Only worth flying once you own something that needs feeding.',
    bias: { deliver: 1.8, mine: 1.4, service: 1.1, hunt: 0.2 },
    floor: {},
    refuse: []
  },

  hold: {
    name: 'Station Keeping',
    icon: '⏸',
    blurb: 'Stay put. Keep the ship alive. Do nothing else.',
    detail: 'She flies nothing and starts nothing — repairs, vents, charges on the arrays and ' +
            'holds. For when you want the ship safe and idle rather than earning, which is a ' +
            'real thing to want and had no way to be asked for.',
    bias: {},
    floor: {},
    refuse: ['mine', 'hunt', 'deliver', 'service', 'sell', 'salvage']
  }
};

export const DOCTRINE_KEYS = Object.keys(DOCTRINES);
export const DEFAULT_DOCTRINE = 'balanced';

/** The multiplier a doctrine puts on one task. 1 when it has no opinion. */
export function biasFor(key, task) {
  const d = DOCTRINES[key] || DOCTRINES[DEFAULT_DOCTRINE];
  if (d.refuse.includes(task)) return 0;
  const b = d.bias[task];
  return typeof b === 'number' ? b : 1;
}

/** The score a doctrine gives a task for existing. 0 when it has no opinion. */
export function floorFor(key, task) {
  const d = DOCTRINES[key] || DOCTRINES[DEFAULT_DOCTRINE];
  if (d.refuse.includes(task)) return 0;
  return d.floor[task] || 0;
}

export const refuses = (key, task) =>
  (DOCTRINES[key] || DOCTRINES[DEFAULT_DOCTRINE]).refuse.includes(task);
