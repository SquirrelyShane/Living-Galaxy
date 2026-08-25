// Living Galaxy — tuning: the pilot, the crew, fatigue, welfare, telemetry and onboarding.
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

// ── the pilot ────────────────────────────────────────────────────────
// Two progression tracks. `practiceRate` and the rank curve govern the honest one —
// skills that rise from doing the thing — and the level curve governs the one you get to
// spend. They are tuned so a session of focused work moves one skill visibly, and so the
// last few ranks of anything are a real commitment rather than a formality.
export const CHAR = {
  maxRank: 10,
  maxLevel: 40,
  startingPoints: 2,
  pointsPerLevel: 1,

  // Use-based ranks. The 0.6 numbers put gunnery at rank 3 — a licence requirement —
  // after two minutes of sustained fire, and rank 10 after twenty-eight. A skill ceiling
  // reachable in half an hour is not a ceiling. These give roughly eight minutes to
  // rank 3 and a couple of hours to rank 10 of *continuous* relevant activity, which in
  // real play is a long campaign rather than an afternoon.
  practiceRate: 0.35,
  rankBase: 100,          // practice units for rank 0 → 1
  rankGrowth: 1.42,       // each rank costs 42% more than the last

  // levels, fed from the same practice
  xpPerPractice: 0.55,
  levelBase: 160,
  levelGrowth: 1.28,

  // What one rank is worth, per skill.
  perRank: {
    gunnery: 0.035, engineering: 0.030, extraction: 0.045,
    navigation: 0.030, commerce: 0.022, sensors: 0.035
  },
  perRankDefault: 0.03,
  engineeringRegen: 0.35,   // MW/s of bank recovery per rank
  sensorQuieting: 0.022,    // signature reduction per rank of Sensors
  signatureFloor: 0.45,     // nothing makes a hull invisible

  // Licences. Career grants one free; the rest are earned and bought.
  // Licence fees are ~75% of the hull they certify. The 0.6 table was written before the
  // hull prices were next to it, and it showed: an economic hull cost 4,200 credits and
  // its licence cost 13,000, so the paperwork was three times the ship. Every licence
  // costing roughly the same made the cheap hulls the *expensive* ones to get into,
  // which is exactly backwards for the hulls a new pilot should be moving between.
  licences: {
    military:   { skill: 'gunnery',    rank: 3, price: 31500 },
    industrial: { skill: 'extraction', rank: 3, price: 21000 },
    logistics:  { skill: 'navigation', rank: 3, price: 15000 },
    economic:   { skill: 'commerce',   rank: 2, price: 9500 },
    civilian:   { skill: 'sensors',    rank: 1, price: 3600 }
  },
  licenceCutPerRank: 0.06,  // price cut per rank above the requirement
  licenceMaxCut: 0.35
};

// ── crew ─────────────────────────────────────────────────────────────
// ── fatigue ──────────────────────────────────────────────────────────
// A department that has been working flat out for an hour is not the department it was
// at the start of it. Fatigue is what makes *posting* a crewman a decision rather than a
// permanent assignment: everyone cannot be at full output forever, and a long haul with
// the same two people on shift genuinely degrades what they produce.
export const FATIGUE = {
  rate: 0.016,          // accrued per second while the department is working
  recover: 0.026,       // shed per second while it is not
  dockedRecover: 0.09,  // ...and much faster with a station's facilities
  floor: 0.55,          // output multiplier at maximum fatigue — tired, not useless
  warnAt: 0.75          // tell the pilot once past this
};

export const CREW = {
  maxBase: 4,                 // berths on a civilian hull
  berthPerSlot: 0.5,          // + half a berth per core slot, rounded down
  wageInterval: 90,           // seconds between payroll runs
  // Experience. v1.00.30 cut the idle rate by twenty and moved the weight onto *events*,
  // because the old numbers levelled a crew to the cap while the ship sat docked doing
  // nothing. Sitting in a chair should not make you a better gunner; being shot at should.
  xpIdle: 0.045,              // xp/sec just for being aboard — a trickle, not a career
  xpActive: 1.1,              // xp/sec while their department is actually working
  xpCurve: 118, xpScale: 1.34,
  levelMax: 10,
  moraleFloor: 0.30, moraleDrift: 0.07, moraleUnpaid: 0.11,   // per payroll run, not per second
  hireBase: 2700, hirePerLevel: 1860,

  // ── posts (v1.00.10) ─────────────────────────────────────────────
  // Specialty and post used to be the same field. A crewman *was* their department, and
  // moving them cost half their accumulated progress — which meant the answer to "I need
  // a second gunner for this fight" was always "no". They are two things now:
  //
  //   specialty  what they trained as. Permanent, expensive to change, what they level.
  //   post       where they are standing right now. Free to change, changes every fight.
  //
  // A crewman posted off their specialty still works, at crossPenalty, and learns their
  // own specialty more slowly while they do. That makes covering a gap a real decision
  // rather than a free reshuffle or an impossible one.
  crossPenalty: 0.45,         // output when posted away from your specialty
  crossLearn: 0.35,           // ...and how much of your own xp you still earn
  retrainCost: 0.55,          // fraction of accumulated xp lost when specialty changes
  retrainMorale: 0.12,

  // ── shifts ───────────────────────────────────────────────────────
  // Off-duty crew contribute nothing and recover fatigue at the docked rate. Before this
  // the only cure for a tired crew was to stop playing and dock, which is a strange thing
  // for a game to ask for. A watch rotation is the answer a ship would actually use.
  offDutyRecover: 2.6,        // multiplier on the resting recovery rate
  rotateAt: 0.72,             // auto-rotation swaps a crewman out past this fatigue
  rotateBackAt: 0.22,         // ...and back in below this
  minOnDuty: 1,               // never rotate the last body out of a department

  // ── morale ───────────────────────────────────────────────────────
  // Pay was the only driver. A crew that has been on shift for six hours, watched two of
  // their number die and been posted to a job they were not trained for should not be as
  // cheerful as one that has not.
  moraleTired: 0.05,          // per payroll, if the crew is averaging high fatigue
  moraleCross: 0.03,          // per payroll, per crewman posted off-specialty
  moraleDeath: 0.22,          // one-off, everyone aboard, when a crewman dies
  moraleShore: 0.10,          // per payroll while docked — shore leave
  moraleWin: 0.015,           // per kill, capped by the drift ceiling

  // ── injury ───────────────────────────────────────────────────────
  // Hull breaches hurt people. Injury scales output down and heals over time — fastest
  // docked, faster with damage control posted. Death is possible but deliberately rare:
  // losing a level-8 veteran to one unlucky frame would be a story, and losing them to
  // every third fight would be an accounting exercise.
  injuryHullFrac: 0.18,       // a hit taking this fraction of max hull risks a casualty
  injuryChance: 0.35,
  injuryAmount: [0.2, 0.6],
  injuryOutput: 0.7,          // output lost at full injury
  healRate: 0.008,            // per second under way
  healDocked: 0.05,
  healMedic: 2.2,             // multiplier with damage control posted and on duty
  deathAbove: 0.92,           // only a crewman already this injured can be killed
  deathChance: 0.25,

  // ── event experience ─────────────────────────────────────────────
  // The bulk of a crewman's progression. Each of these fires on something that actually
  // happened, and lands on the department that did it — a gunner learns from the shot
  // that connected, not from the hour of quiet either side of it.
  xpEvent: {
    kill: 130,                // a hostile destroyed
    hitTaken: 22,             // your hull was breached — everyone learns from that
    hitDealt: 6,              // damage landed
    oreLoad: 40,              // a hold filled
    trade: 55,                // a sale closed
    scan: 90,                 // a body resolved
    warp: 35,                 // a crossing completed
    contract: 240,            // a contract delivered
    repair: 45,               // damage control did its job
    casualty: 160,            // a shipmate hurt — the hardest lesson there is
    // Working a shift beside another crew (v1.02.58). Small per tick and awarded every few
    // seconds rather than per event, so the number here is a *rate* where the rest of this
    // table is a lump — see `systems/crew/groupwork.js`, which scales it by how many other
    // crews are actually in the seam.
    teamwork: 18,
    // Not experience — a penalty routed through the same table so the crew system stays the
    // only thing that knows about watches and traits. See `systems/industry/habitat.js`;
    // it is negative because an empty galley teaches nobody anything.
    hungry: -260
  },
  xpEventFocus: 0.7,          // share of an event that goes to the department involved
  xpEventSpread: 0.3,         // ...and the share split across everyone else aboard

  // ── needs ────────────────────────────────────────────────────────
  // People eat, drink and sleep. A ship that has been out for three weeks with no
  // provisions is not a ship with a morale penalty; it is a ship with a mutiny.
  needs: {
    foodPerHour: 0.9,         // kg of provisions per crewman per game hour
    waterPerHour: 1.4,
    powerPerCrew: 0.35,       // MW of life support per crewman
    hungerRate: 0.012,        // per second unfed
    thirstRate: 0.018,
    hungerMorale: 0.09,       // morale lost per payroll while hungry
    hungerOutput: 0.45,       // output lost at maximum hunger
    warnAt: 0.6
  },
  // Breaks. Distinct from a watch rotation: a break is short, taken on watch, and
  // restores a little of everything. A rotation is a shift change.
  breakInterval: 900,         // seconds of duty before someone needs one
  breakLength: 120,
  breakRecover: 0.25,

  // ── personality ──────────────────────────────────────────────────
  // Willpower decides who can be talked into something. High-willpower crew are steady and
  // hard to move; low-willpower crew are pliable, which cuts both ways — easy for *you* to
  // persuade, and equally easy for a boarding party's negotiator or a Nexis illusion net.
  willpower: [0.2, 0.95],
  persuadeBase: 0.55,         // chance before willpower and rapport
  persuadeMoraleCost: 0.10,   // pushing someone against their nature costs standing
  illusionBase: 0.4,          // an enemy influence attempt, before willpower

  // ── promotion ────────────────────────────────────────────────────
  // One overseer per ship. They stop contributing at a post and instead lift everyone.
  overseerMinLevel: 5,
  overseerBonus: 0.14,        // to every other crewman's output
  overseerNeeds: 0.15,        // ...and cuts consumption, by running the ship properly
  overseerXp: 0.25,           // crew learn faster under someone who knows the job

  // ── recruiting ───────────────────────────────────────────────────
  recruitRefresh: 420,        // seconds before a station's board turns over
  recruitMin: 2, recruitMax: 5
};

// ── onboarding ───────────────────────────────────────────────────────
// The tutorial is a sequence of *observations*, not a script: each stage names a
// condition it is waiting for, the world is checked once a second, and nothing is ever
// forced on the pilot. A player who happens to already be mining skips the mining stage
// on the same tick it opens.
export const TUTORIAL = {
  checkInterval: 0.75,       // s between condition checks
  hintDelay: 22,             // s on a stage before the nudge line appears
  graceContract: 420,        // s of playtime before anyone may put a contract on you
  graceKills: 2,             // ...or this many kills, whichever comes first
  minNotoriety: 1            // kills or claim trespasses needed before the board bites
};

// ── crew welfare (v1.01.40) ──────────────────────────────────────────
// What you spend on people instead of on the ship. Every number here is chosen so that no
// recovery is both fast and free: the obvious version of "let the player rest the crew" is
// a button that removes fatigue, and that deletes the watch rotation fatigue exists to
// force. Each of the three costs something different.
export const WELFARE = {
  maxLevel: 3,
  // Fittings: money up front, and upkeep forever. The standing answer — cheaper than
  // replacing people, and they never stop billing.
  fitBase: 9000, fitScale: 2.1, upkeepPerLevel: 140,
  quartersRest: 0.45,     // + this per level on off-watch recovery
  galleyRelief: 0.30,     // + this per level off the short-rations morale hit
  galleyMorale: 0.008,    // ...and a small standing lift per payroll
  infirmaryHeal: 0.55,    // + this per level on healing rate

  // Shore leave: the cost is *time docked*. You cannot buy your way out of the clock.
  shoreHours: 8, shoreCostPerHead: 420,
  shoreMorale: 0.45, shoreFatigue: 0.85,
  // Undocking early cuts it short. Keeping a fraction rather than nothing means a player who
  // has to run is not punished into never trying it again — but it is a poor deal, and the
  // log says it was cut short so they can find out why it did not help.
  shoreEarlyKeep: 0.45,

  // Training: the cost is a body off the watch bill. On a four-berth hull that is a quarter
  // of the ship, which is the whole price.
  trainBase: 3200, trainScale: 1.55, trainHours: 6, trainXp: 90
};

// ── crew telemetry (v1.01.30) ────────────────────────────────────────
// The crew simulation has been detailed and opaque since v1.00.30. These are the bounds on
// giving it a memory of itself — every one is a cap rather than a target, because this runs
// in a browser tab that may be open for hours and a diagnostic that leaks memory is a bug
// with a nice UI.
export const CREWLOG = {
  sampleEvery: 6,        // s between roster samples. A trend, not a recording.
  samplesPerCrew: 240,   // ~24 minutes of history each, then the oldest falls off
  trendWindow: 180,      // s a trend looks back over
  diagWindow: 600,       // s a diagnosis attributes causes over
  // A number technically rising by 0.0001 must read as steady, or the readout flickers
  // between "improving" and "falling" and the player learns to ignore it.
  deadBand: 0.02,

  // How the "who needs attention" ordering is built. Falling counts for more than low:
  // somebody at 0.4 and climbing is being handled; somebody at 0.6 in freefall is the one
  // about to become a problem.
  weightMorale: 1.0, weightFatigue: 0.8, weightInjury: 1.2, weightFalling: 0.35,
  riskAt: 0.75           // concern score at which somebody counts as at risk
};

// ── the crew talking (v1.02.60) ──────────────────────────────────────
//
// The whole feature is a rate limiter with a corpus attached. Every number here exists to
// stop a ship with six people on it becoming six people who never stop talking — which is
// the failure mode this lands in if it is tuned by anyone who has just written the lines
// and is pleased with them.
export const CREW_TALK = {
  // Seconds between any two crew utterances, whatever the situation. The per-situation
  // `gap` in data/crew-dialogue.js is on top of this, not instead of it.
  floor: 22,
  // ...and the same again, randomised, so the ship does not tick like a metronome.
  jitter: 18,
  // A two-hander waits this long before the answer comes. Long enough to read the opener,
  // short enough that it still reads as a reply rather than a coincidence.
  replyDelay: [2.4, 4.2],
  // How often an exchange is chosen over a single line, when one is available.
  exchangeShare: 0.42,
  // Morale bands. Below `lowMood` the low-mood lines unlock, above `highMood` the good ones.
  lowMood: 0.42,
  highMood: 0.78,
  // A situation has to hold for this long before anybody remarks on it, so a threat that
  // crosses the sensor edge for half a second does not get a line about it.
  settle: 1.6,
  // Nothing is said at all while docked and the player is off the ship, or in the first
  // seconds of a new game — a crew introducing themselves to an empty cockpit is worse
  // than silence.
  bootQuiet: 12,
  // Seconds off a station before the crew start noticing how long it has been. Real time,
  // not game hours: this is about the player's sense of a long trip, and a number tuned in
  // game hours would fire on a hop across a system.
  longHaulAfter: 900
};
