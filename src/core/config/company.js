// Living Galaxy — tuning: reputation, standing orders, companies and the manager branch.
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

// ── reputation ───────────────────────────────────────────────────────
// Three blocs. The matrix is what stops reputation being three independent counters you
// can max out in parallel: helping the Coalition costs you with the pirates at 0.8 of the
// gain, so there is no route to being everyone's friend. Independents care about both,
// weakly, because they have to live with whoever wins.
export const REP = {
  min: -100, max: 100,
  // What opening fire on somebody who has not fired on you costs, with their bloc. Charged
  // once per hull rather than once per round — see `damageNpc` in `combat/combat.js` for
  // why that distinction is the whole design. Small on purpose: one mistaken burst should
  // be recoverable, a career of piracy should not be.
  unprovokedFire: 6,
  // Everybody starts at zero with everybody.
  //
  // This was `{ coalition: 10, pirate: -20, independent: 0 }` — a stance nobody had taken,
  // applied to a character before they had done anything, and it meant every pilot in the
  // game began the story already disliked by a third of it for no reason they could point
  // at. The only thing that moves standing at creation now is the lineage and corporation
  // the player actually chose, and those are bonuses to *named powers* rather than to a
  // whole bloc. See systems/dossier.js.
  start: { coalition: 0, pirate: 0, independent: 0 },
  matrix: {
    coalition:   { pirate: -0.8, independent:  0.15 },
    pirate:      { coalition: -0.9, independent: -0.25 },
    independent: { coalition: 0.2, pirate: -0.1 }
  },
  // What a kill moves. The number is applied to the *victim's* bloc as a loss, and the
  // matrix converts that into gains with its enemies.
  killValue: { coalition: 4, pirate: 3, independent: 5 },
  bands: [
    { min:  70, name: 'Trusted' },
    { min:  35, name: 'Friendly' },
    { min:  10, name: 'Cordial' },
    { min: -10, name: 'Neutral' },
    { min: -35, name: 'Disliked' },
    { min: -70, name: 'Wanted' },
    { min: -101, name: 'Kill on sight' }
  ],
  hostileBelow: -60,      // ships of this bloc open fire on sight
  dockingBelow: -45,      // stations refuse the pad
  bountyBonus: 0.45,      // extra bounty at maximum standing
  tradeBonus: 0.12        // better prices at maximum standing
};

// ── standing orders ──────────────────────────────────────────────────
// Work you delegate. The numbers here are deliberately modest: an order should be worth
// giving and never worth waiting for. If the best play is to sit docked cycling scouts,
// the rates are wrong.
export const ORDERS = {
  maxActive: 3,
  recallMorale: 0.08,
  fatalShare: 0.3,          // of the risk roll, how often "went wrong" means "did not come back"
  salvagePool: ['REF-001', 'REF-002', 'REF-004', 'RAW-001', 'RAW-006'],
  salvageBase: 26,
  scoutPool: ['RAW-005', 'RAW-011', 'RAW-006', 'CMP-001'],
  scoutBase: 18,
  scoutStanding: 2,
  assayStep: 0.08,          // permanent extraction bonus a survey adds to a world
  maxAssay: 0.4
};

// Executive fleet objectives — idle command from HQ / ops.
// Distinct from crew standing orders: these target *owned or contracted ships*
// and carry visible timers + auto-return. Designed so ARIA and the command menu
// emit the same structured objects.
// The `FLEET` block that used to sit here was deleted at v1.01.98. Nothing ever imported
// it, and every value in it was already declared somewhere that *is* read: order modes are
// on each order type in systems/orders.js, branches are BRANCH_KEYS in
// data/planetary/branches.js, the objective durations are per-type in the same order
// table, and the active cap is ORDERS.maxActive. A second copy of a number nobody reads is
// worse than no copy: it looks like the lever.

export const ADVANCED = {
  pointDefChance: 0.28,     // per level: fraction of incoming rounds intercepted
  naniteArmorPerSec: 1.4,   // per level, out of combat
  naniteHullPerSec: 0.6,
  outOfCombat: 6            // seconds since last hit before nanites/PD-idle kick in
};

// Docking, measured **from the hull**, not from the station's centre.
//
// It used to be 280 units of centre distance, which on a 30-unit berth meant the pad opened
// two hundred and fifty kilometres out — you could dock from a distance at which the station
// was a dot. `reach` is the gap between your hull and theirs, in units (1 unit = 1 km), so
// 0.5 is five hundred metres and means what it says at every berth size. See
// `updateDocking` in systems/trade/economy.js, its only consumer.
export const DOCK = {reach: 0.5, maxSpeed: 0.30};

// Approach autopilot. hailMeters is the extra standoff past the geometry-safe
// distance — the "500 m" on the station controller's board.
//
// The standoff was 1.6× the berth's radius plus half a kilometre, which parked the ship
// eighteen kilometres off a 30-unit hull: comfortably outside the docking reach above, so
// an approach ran to completion and then sat there with nothing to show for it. 1.0 is the
// hull itself, and 300 m past it is inside the reach — the approach now *finishes* at a
// berth rather than stopping near one.
export const APPROACH = {
  steer: 2.2, speedGain: 0.6, arriveSpeed: 0.3,
  stationStandoff: 1.0, hailMeters: 300,
  planetGravityMult: 2.6, starMult: 4.2, asteroidHoldMult: 0.8, shipHold: 240,
  orbitOmega: 0.012,
  // How much throttle the autopilot may ask for. Capped because braking in this flight
  // model is drag rather than reverse thrust, so a full-power run at a rock overshoots it
  // and then has to come round again — and because a continuous max burn drains the bank.
  powerCap: 0.25,
  // What a *slow* approach means. ARIA's mining run flies at this: it is the difference
  // between arriving at a rock and arriving through it, and it is low enough that the
  // pilot has time to look at what they are flying into.
  crawlPower: 0.07
};
export const TRACTOR = { dur: 4.5 };
export const PROBE = { cost: 450, start: 2 };
export const AMBUSH = { fraction: 0.45, trigger: 0.55 };

// The living-world layer: mercenary contracts, boarding, construction, claims.
export const SIM = {
  contractInterval: 40,       // s between contract postings
  // A contract on the player used to be possible from the first minute, on the strength
  // of starting credits alone — a pilot who had done nothing but undock could be hunted
  // before they had a gun fitted. Eligibility is now earned: see TUTORIAL.grace* below,
  // and worldsim.playerEligible() for how the two combine.
  playerContractChance: 0.25,
  boardTime: 10, boardRange: 90, rebootTime: 8,
  deliverAmt: 12, siteNeed: 100,
  claimR: 2600, fortRebuild: 180
};

// Shipboard AI. Model runs in a Web Worker (never blocks the game); the server
// option talks to the llama.cpp instance already running in Termux.
// The `AI` block that used to sit here was deleted at v1.01.98. It named a model
// (`onnx-community/SmolLM2-360M-Instruct`) that was not the one being loaded and a local
// inference endpoint (`http://127.0.0.1:8089`) that nothing connected to. The single source
// for which model runs is src/npc-avatar/llm/models.js; `AVATAR.model` keys into it. If a
// server-backed tier is wanted later it belongs in that registry beside the others, where
// the code that would use it already looks.

// Nothing on rails may outrun the ship. Orbital speeds are set as tangential
// velocity (units/s) divided by orbit radius; sublight max is 2.1–2.9.
export const ORBITAL_V = { planet: 0.45, station: [0.22, 0.4], asteroid: [0.15, 0.5], moon: [0.4, 0.8] };
export const AUTOSAVE_INTERVAL = 30;

// ── automated subsystems (experimental) ──────────────────────────────
// Per-branch site managers. Off by default: this is the experimental branch, and the
// whole point of the flag is that a save made with it on still loads with it off.
export const MANAGERS = {
  enabled: false,            // flipped by settings / LG.experimental(true)
  tickHours: 1,              // game hours between manager passes
  hireCost: 6500,            // credits to install a manager on a site
  upkeep: 340,               // credits per payroll cycle, per manager
  maxAutonomy: 3,            // 0 advisory · 1 balance · 2 build · 3 full
  reserveFloor: 0.15,        // fraction of storage a manager keeps free
  brownoutTarget: 0.92,      // power satisfaction a manager steers toward
  optimiseEvery: 6           // manager passes between full re-optimisations
};

// ── companies ────────────────────────────────────────────────────────
// The executive start. A company is a second balance sheet with its own charter, and
// the reason the manager subsystems have somebody to report to.
export const COMPANY = {
  // How many construction projects the company will carry at once. A cap rather than a
  // cost: an order book with fifty open modules on it is a to-do list, not a decision.
  projectCap: 5,
  startingTreasury: 24000,
  startingShares: 1000,
  founderShares: 620,        // you keep control, but not all of it
  reportInterval: 900,       // s between board reports
  dividendRate: 0.08,        // fraction of retained profit paid out per report
  charterBonus: 0.15,        // in-charter operations run this much better

  // ── late incorporation (1.01.80) ─────────────────────────────────
  // Registering a charter after character creation. It costs the pilot's own credits,
  // not the treasury — there is no treasury until the registration goes through — and
  // it is deliberately more than the executive career's head start is worth, so the
  // career is still the cheap way in rather than a trap.
  registerFee: 18000,        // cr from the pilot's wallet
  registerTreasury: 12000,   // cr the fee capitalises into the new treasury
  registerShares: 1000,
  registerFounderShares: 540, // less than a career founder's 620 — you bought in late

  // ── contracted hulls (1.01.80) ───────────────────────────────────
  // Fleet objectives used to run on synthetic `wing-<leafid>` assets: a name and a role,
  // no ship. A contracted hull is a real NPC in the world that has agreed to fly for the
  // company, and it is the thing an objective is now bound to.
  fleetCap: 6,               // hulls under contract at once. Matches the objective cap
  hireFee: 2400,             // one-off, from the treasury
  hireUpkeep: 14,            // cr per hull per upkeep tick
  upkeepInterval: 120,       // s between upkeep charges
  hireRange: 90000,          // km — a hull has to be inside company sensor range to sign

  // ── refit and commission (1.01.90) ───────────────────────────────
  // A conscripted patrol ship is a patrol ship forever unless something can change what
  // it is for. Refit is that something: the company pays a yard to convert a hull from one
  // trade to another, and the ship's behaviour follows its new role because npcs.js
  // dispatches on `role` and nothing else.
  //
  // Priced off the signing fee rather than as a flat number, so converting a hull is a
  // real decision against simply signing a second one that already does the job.
  refitFee: 3600,            // base cr from the treasury
  refitCrossBranch: 1.6,     // multiplier when the new role is outside the company charter
  refitSeconds: 45,          // yard time — the hull is unavailable while it converts
  refitRange: 60000,         // km — a hull must be this close to a station to be refitted

  // Commissioning buys a hull outright rather than conscripting one that already exists.
  // The markup over the yard price is what you pay for not having to find a willing ship.
  commissionMarkup: 1.35,
  commissionRange: 400,      // km — you have to be docked to place an order

  // A contracted hull is maintained, crewed and pushed harder than an ambient worker.
  //
  // This exists because of a measurement, not a hunch. The belt sits 10,700–12,900 units
  // out; a `miner` cruises at 0.85 units/s. The run in to a berth is therefore about three
  // *hours* of game time, which is invisible to an ambient miner nobody is watching and
  // useless for a fleet objective the player dispatched thirty seconds ago and is waiting
  // on. At 4x the same leg is roughly forty-five minutes, and a passive extraction cycle
  // becomes something you can watch happen.
  fleetSpeed: 4.0
};

/**
 * What a contracted hull can be converted into, and what it costs to get there.
 *
 * Keyed by the role a fleet order asks for, not by hull type — the question a player has
 * is "I need this ship to mine", and the answer should not require knowing that a miner is
 * `NPC_TYPES.miner`. `hull` is the type the yard fits it out as.
 */
export const FLEET_ROLES = {
  combat: { name: 'Patrol',     hull: 'merc',     branch: 'military',   desc: 'Guns and sensors. Patrol, escort, picket.' },
  merc:   { name: 'Mercenary',  hull: 'merc',     branch: 'military',   desc: 'Heavier guns, contract work, boarding.' },
  mine:   { name: 'Extraction', hull: 'miner',    branch: 'industrial', desc: 'Cutting head and ore hold. Works the belt and runs it in.' },
  haul:   { name: 'Freight',    hull: 'hauler',   branch: 'logistic',   desc: 'Large hold, no teeth. Moves cargo between berths.' },
  build:  { name: 'Construction', hull: 'builderC', branch: 'industrial', desc: 'Fabrication gear for stations and site works.' },
  trade:  { name: 'Trade',      hull: 'hauler',   branch: 'economic',   desc: 'Hold plus a purser. Survey passes and market runs.' }
};
