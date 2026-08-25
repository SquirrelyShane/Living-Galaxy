// Living Galaxy — site managers, one archetype per branch. **Experimental branch.**
//
// A manager is a person you install on a planetary site who runs it while you are three
// systems away. The interesting design constraint is that they must not all be the same
// person with a different hat: a Foreman and a Factor looking at the same brownout should
// reach *different* conclusions, and both should be defensible.
//
// So each archetype declares:
//
//   **objective** — the single number it is trying to move. This is the whole personality.
//   **weights** — how it scores a decision. A Foreman values throughput and forgives a
//     brownout; a Quartermaster will idle a line rather than let the store overflow.
//   **policies** — ordered. The manager walks them in order and applies the first that
//     fires, which makes behaviour readable in a log rather than emergent and unexplainable.
//   **optimise** — a periodic pass that re-tunes the site as a whole rather than reacting
//     to one condition. This is where the per-branch difference actually shows.
//
// Autonomy is a separate axis (0 advise, 1 balance, 2 build, 3 full) so a player can take
// a manager whose judgement they like and still keep the chequebook.

export const MANAGER_ARCHETYPES = {
  industrial: {
    key: 'industrial',
    name: 'Foreman',
    icon: '⛏',
    objective: 'throughput',
    blurb: 'Keeps the pit head running. Will accept a brownout to keep a smelter fed, and ' +
           'considers an idle drill a personal insult.',
    weights: { throughput: 1.00, power: 0.45, storage: 0.55, upkeep: 0.30 },
    // A Foreman will run the site hot: it tolerates satisfaction well under nominal.
    tolerance: { power: 0.72, storage: 0.94 },
    policies: ['feedRefiners', 'shedNonEssential', 'raisePower', 'expandExtraction'],
    optimise: 'maximiseExtraction'
  },

  military: {
    key: 'military',
    name: 'Garrison Officer',
    icon: '⚔',
    objective: 'readiness',
    blurb: 'Treats the site as a position to be held. Keeps munitions stocked and power ' +
           'in reserve, and would rather produce less than be caught cold.',
    weights: { throughput: 0.55, power: 1.00, storage: 0.40, upkeep: 0.35 },
    tolerance: { power: 0.95, storage: 0.85 },
    policies: ['reservePower', 'stockMunitions', 'shedNonEssential', 'raisePower'],
    optimise: 'holdReserve'
  },

  logistic: {
    key: 'logistic',
    name: 'Quartermaster',
    icon: '📦',
    objective: 'flow',
    blurb: 'Hates a full store more than an idle line. Optimises for material leaving the ' +
           'site on schedule, and will throttle extraction to stop a jam.',
    weights: { throughput: 0.70, power: 0.55, storage: 1.00, upkeep: 0.45 },
    tolerance: { power: 0.88, storage: 0.78 },
    policies: ['preventJam', 'feedRefiners', 'shedNonEssential', 'raisePower'],
    optimise: 'levelStores'
  },

  economic: {
    key: 'economic',
    name: 'Factor',
    icon: '💰',
    objective: 'margin',
    blurb: 'Runs the site as a balance sheet. Idles anything whose upkeep outruns what it ' +
           'produces, and will happily leave slots empty if the numbers say so.',
    weights: { throughput: 0.60, power: 0.60, storage: 0.60, upkeep: 1.00 },
    tolerance: { power: 0.90, storage: 0.88 },
    policies: ['cullUneconomic', 'preventJam', 'shedNonEssential', 'raisePower'],
    optimise: 'maximiseMargin'
  },

  civilian: {
    key: 'civilian',
    name: 'Administrator',
    icon: '◐',
    objective: 'stability',
    blurb: 'Optimises for the people on the ground. Protects habitation and life support ' +
           'first, accepts lower output, and produces the most durable site of the five.',
    weights: { throughput: 0.45, power: 0.75, storage: 0.55, upkeep: 0.50, workforce: 1.00 },
    tolerance: { power: 0.97, storage: 0.90 },
    policies: ['protectHabitation', 'reservePower', 'preventJam', 'raisePower'],
    optimise: 'growWorkforce'
  }
};

export const MANAGER_KEYS = Object.keys(MANAGER_ARCHETYPES);

/** Autonomy rungs, in the order the UI shows them. */
export const AUTONOMY = [
  { level: 0, name: 'Advisory',  desc: 'Reports what it would do. Changes nothing.' },
  { level: 1, name: 'Balance',   desc: 'May switch facilities on and off to hold the site stable.' },
  { level: 2, name: 'Build',     desc: 'May also spend stored materials on new facilities.' },
  { level: 3, name: 'Full',      desc: 'May also draw on the company treasury and dismantle.' }
];

export const archetypeFor = branch => MANAGER_ARCHETYPES[branch] || MANAGER_ARCHETYPES.industrial;
