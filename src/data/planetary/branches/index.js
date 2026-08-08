// Living Galaxy — the five branches a planetary site can be built around.
//
// They are the same five words as the career paths, deliberately. A pilot who chose
// Prospector and then lands on a world should find "Industrial" waiting for them rather
// than a fresh vocabulary to learn; the ground and the career are the same idea at two
// scales.
//
// Each branch is its own file because they will grow at different rates and by different
// hands. Adding a facility should touch one file.

import { MILITARY } from './military.js';
import { INDUSTRIAL } from './industrial.js';
import { LOGISTIC } from './logistic.js';
import { ECONOMIC } from './economic.js';
import { CIVILIAN } from './civilian.js';

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
