// Living Galaxy — tuning: crafting, mining, planetary works, research and scanning.
//
// One of twelve files under `core/config/`. `config.js` was a single 1,727-line module and
// the most-imported file in the project, which made it the place every tuning value went and
// no place in particular — a new block landed wherever the last one ended.
//
// The split mirrors `src/systems/`: a number that tunes `systems/combat/` lives in
// `config/combat.js`. `core/config.js` re-exports all twelve, so every existing import is
// untouched and a caller that wants one domain can reach for it directly.
//
// Pure data. No imports, no behaviour.

// ── mining ───────────────────────────────────────────────────────────
export const MINING = {range:260, rate:14, energy:9, oreScale:1.0};  // kg/s at mult 1

// ── crafting ─────────────────────────────────────────────────────────
// Manufacturing runs on game *hours*, not frames. GAME_HOURS_PER_SECOND is the single
// conversion between the two, so nothing else has to know the rate — and changing the
// pace of the whole industrial layer is one number rather than a search.
export const CRAFT = {
  gameHoursPerSecond: 0.05,   // 1 real minute = 3 game hours
  minHours: 0.25,             // a build time that trends to zero is an inventory screen
  hoursPerRank: 0.035,        // Engineering cuts build time
  maxSkillCut: 0.35,
  maxJobs: 8,
  cancelRefund: 0.6           // of the *unspent* portion — scrap is not stock
};

// ── planetary industry ───────────────────────────────────────────────
export const PLANETARY = {
  maxSites: 12,
  baseStorage: 20000,
  teardownRefund: 0.45,
  brownoutFloor: 0.25,        // a starved site slows down; it never silently stops
  yieldScale: 0.6,
  // Workforce is square-rooted and capped, so the answer to a site is never "all
  // habitation blocks" — the second one is worth much less than the first.
  workforceRef: 1200, workforceScale: 0.35, maxWorkforceBonus: 0.8,

  // Refining chains, applied one per facility per tick. Ore in, metal out.
  refineChain: [
    ['RAW-001', 'REF-001', 0.55],   // iron ore      → structural steel
    ['RAW-002', 'REF-002', 0.42],   // titanium ore  → titanium alloy
    ['RAW-003', 'REF-004', 0.48],   // copper ore    → copper conductors
    ['RAW-004', 'REF-003', 0.46],   // bauxite       → aluminium
    ['RAW-005', 'REF-005', 0.30],   // regolith      → silicon wafers
    ['RAW-010', 'REF-011', 0.18],   // uranium ore   → reactor fuel
    ['RAW-020', 'REF-020', 0.12]    // precious ore  → bullion
  ],
  bioChain: [
    ['BIO-001', 'BIO-006', 0.40],   // biomass       → bio-polymer precursor
    ['BIO-002', 'BIO-008', 0.45],   // algae         → nutrient concentrate
    ['BIO-003', 'BIO-011', 0.30]    // mycelium      → industrial enzymes
  ]
};

// ── progressive scanning ─────────────────────────────────────────────
// Resolution is a function of range over sensor strength. Far away you get a
// spectrometry band; up close you get the whole assay.
export const SCAN = {
  bands: [1.60, 0.75, 0.32, 0.12],   // ratio thresholds for tier 1,2,3,4
  chargeTime: 1.6,                   // seconds the dish needs per sweep

  // ── how far the array actually reaches (v1.02.57) ──────────────────
  //
  // `SHIP_CLASSES[x].sensor` is the number a hull is *rated* for — 4,200 to 5,200 units,
  // which is a quarter of the way across the inner system. Until now every hull got all of
  // it the moment it undocked, with no equipment at all, and the consequence was visible on
  // the chart: a bare shuttle parked at the edge of a belt drew a sensor ring that swallowed
  // the whole field and reported twenty-eight rocks it had no instrument to see.
  //
  // That is a rating, not a capability. The rated figure is what the hull can do with its
  // sensor bays populated; what you get with empty bays is the bare hull's own short-range
  // array. So the rated number is now scaled by the scanner tier the fit actually carries —
  // `scanTierAdd`, which comes from the survey suite and the deep sensor core, the two
  // modules that have always claimed to be about sensors.
  //
  // The point of the change is that fitting a sensor module now *does something you can
  // see*. Bolt a deep sensor core on and the ring on the nav chart visibly grows, the
  // contact list lengthens, and rocks you could not resolve become things you can lock.
  // Before this, `sensorMult` moved a number that was already large enough to make its own
  // increase invisible.
  //
  // One index per tier; anything past the end takes the last entry. Tier 0 is deliberately
  // under half: it has to be short enough that the difference is obvious.
  tierReach: [0.40, 0.62, 0.82, 1.00, 1.15],
  // Never below this, whatever the fit or the CPU penalty. You can always see what is close
  // enough to hit you, and a sensor range that can reach zero is a soft-lock: nothing on the
  // contact list means nothing to lock, which means nothing to approach or dock with.
  reachFloor: 900
};

// ── research (v1.01.50) ──────────────────────────────────────────────
// Survey data had exactly one sink — selling it — and blueprints had no gate at all. These
// are the thresholds that decide what a world *teaches*, and they are temperatures rather
// than a list of planet names on purpose: the planet table has grown twice, and a whitelist
// would have quietly stopped covering it.
export const RESEARCH = {
  hotAbove: 120,    // °C at or above which a body files a thermal finding
  coldBelow: -80    // ...and at or below which it files a cryogenic one
};

// ── the ship's own installations (v1.02.60) ──────────────────────────
//
// Two things a long-haul hull carries that a fighter does not, and both of them are
// *decisions with a cost* rather than passive bonuses — which is the only reason they are
// worth simulating.
//
// **Solar arrays** trade mobility for power. Deployed, they fill the bank from the star for
// nothing; deployed, the ship cannot move at all. That is the entire mechanic and it is
// enough: choosing to spend four minutes pinned in open space to save a warp charge is a
// real decision, and it becomes a much sharper one the moment something appears on the
// array. The deploy runs on a bar because the interesting part is the middle — the twenty
// seconds where you have committed and cannot yet move.
//
// **Hydroponics** is the crew's food. Without a farm, stores run down and have to be bought;
// with enough beds the ship feeds itself indefinitely. The threshold is deliberately
// reachable but not free — it costs slots, power and water, so a self-sufficient ship is a
// ship that gave something up to be one.
export const HABITAT = {
  // ── solar ──
  // Seconds from stowed to fully deployed, and back. Long enough to be a commitment,
  // short enough that the pilot is not reading a book. The bar is the point of the wait.
  deploySeconds: 22,
  // ...and stowing is faster than deploying, because panic-retracting is a thing that
  // should be survivable. Not *much* faster: the whole tension is that it is not instant.
  stowScale: 0.72,
  // Power per array at one AU-equivalent, in the same MW the reactor is measured in.
  outputPerArray: 3.4,
  // Insolation falls off with the square of distance, like light does. Clamped at the top
  // so a hull parked on a star's corona is not an infinite generator.
  maxInsolation: 4.0,
  // The drive is locked out above this deployment fraction. Not zero: a hair of travel on
  // a bar that has only just started moving is not worth a special case, and a hard zero
  // makes the throttle stutter as the bar leaves the stop.
  lockAbove: 0.5,

  // ── hydroponics ──
  //
  // What the crew *eat* is not here: `CREW.needs.foodPerHour` already says, `crew.js` already
  // draws it, and a second number for the same appetite is the two-sources-of-truth bug this
  // project keeps writing comments about. The farm only knows how to grow.
  //
  // Kilograms and game hours throughout — see CRAFT.gameHoursPerSecond for the conversion,
  // which is the same clock the fabricator and the galley already run on.
  //
  // What one bed grows per game hour at full power and full water.
  perBed: 0.55,
  // Water drawn per bed per game hour. A farm is mostly plumbing.
  waterPerBed: 0.18,
  // Power drawn per bed, continuously, in MW.
  powerPerBed: 0.35,
  // How much the ship can hold. Beyond this the farm idles rather than overflowing.
  storeCap: 420,
  // Below this many days of stores the galley counts as low: `habitat.storesLow()`, the
  // `farm.low` fact, and the rule that has ARIA put a berth on the list before anybody is
  // actually hungry. One threshold, three readers.
  warnDays: 3,
  // What a station charges per kg of stores.
  storePrice: 4
};
