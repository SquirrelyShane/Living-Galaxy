// Living Galaxy — tuning: commodities, prices, contracts, station supply and the deal ledger.
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

// ── economy ──────────────────────────────────────────────────────────
// Prices are per kilogram, and the 1.0 pass cut them by six.
//
// They had never been checked against the *hold*: an 18-tonne industrial load sold for
// roughly 378,000 credits against a most-expensive-hull-plus-licence of 28,000. One trip
// to the belt bought everything in the game twice over, which meant every price, every
// upgrade tier and every licence requirement downstream was decoration. At a sixth, a
// full industrial run is about 27,000 — one good haul buys one significant thing, which
// is the pacing the rest of the economy was designed around and never received.
export const COMMODITIES = {
  ore:     {name:'Raw ore',     base:1.5, desc:'Mined from belt rock'},
  salvage: {name:'Salvage',     base:2.9, desc:'Recovered from wrecks'},
  data:    {name:'Survey data', base:7.5, desc:'Planetary probe telemetry'}
};
// per-station-category price multipliers
export const TRADE_MULT = {
  military:   {ore:0.85, salvage:1.30, data:1.25},
  industrial: {ore:1.40, salvage:0.90, data:0.80},
  logistics:  {ore:1.15, salvage:1.10, data:1.00},
  economic:   {ore:1.10, salvage:1.40, data:1.50},
  civilian:   {ore:0.95, salvage:1.00, data:1.10}
};
export const REPAIR_COST = {armor:18, hull:48};

// Two tiers. Tier 1 = incremental stat boosts (buy repeatedly). Tier 2 = advanced
// capability modules that each require a tier-1 prerequisite at some level and change
// how the ship plays, not just its numbers. `req` = [tier1 key, min level].
export const UPGRADES = {
  // ── tier 1 · core refits ──
  shield: {tier:1, name:'Shield capacitor',  desc:'+20% shield capacity',   base:2700,  scale:1.75, max:4, step:0.20},
  armor:  {tier:1, name:'Ablative plating',  desc:'+20% armor capacity',    base:2250,  scale:1.70, max:4, step:0.20},
  cargo:  {tier:1, name:'Cargo expander',    desc:'+50% cargo hold',        base:3300, scale:1.80, max:3, step:0.50},
  thrust: {tier:1, name:'Thruster tune',     desc:'+15% max thrust',        base:3900, scale:1.85, max:4, step:0.15},
  weapon: {tier:1, name:'Weapon coupler',    desc:'+18% weapon damage',     base:4500, scale:1.90, max:4, step:0.18},
  mining: {tier:1, name:'Mining beam focus', desc:'+35% extraction rate',   base:2400,  scale:1.65, max:4, step:0.35},

  // ── tier 2 · advanced modules ──
  regenField: {tier:2, req:['shield',2], name:'Regenerative shield matrix',
    desc:'Shields recharge 2.4× faster and start recovering sooner after a hit',
    base:15600, scale:1.9, max:2, step:1.0},
  overclock:  {tier:2, req:['thrust',2], name:'Reactor overclock',
    desc:'+25% energy bank and +40% recharge — sustains guns, warp and mining longer',
    base:18000, scale:1.9, max:2, step:1.0},
  deepScan:   {tier:2, req:['mining',2], name:'Deep-field sensor array',
    desc:'+60% scanner range — resolve rocks, contacts and ambushes far sooner',
    base:13200, scale:1.85, max:2, step:1.0},
  warpTuner:  {tier:2, req:['thrust',3], name:'Warp field tuner',
    desc:'+35% warp cruise speed and a faster spool — cross the system in less time',
    base:21000, scale:1.9, max:2, step:1.0},
  autoRepair: {tier:2, req:['armor',2],  name:'Nanite repair bay',
    desc:'Slowly regenerates armor and hull while out of combat',
    base:20400, scale:1.9, max:2, step:1.0},
  pointDef:   {tier:2, req:['weapon',3], name:'Point-defense grid',
    desc:'Auto-intercepts a share of incoming fire before it reaches your hull',
    base:24000, scale:1.9, max:2, step:1.0}
};
export const UPGRADE_ORDER = ['shield','armor','cargo','thrust','weapon','mining',
  'regenField','overclock','deepScan','warpTuner','autoRepair','pointDef'];

// ── contracts ────────────────────────────────────────────────────────
// The agent chain in 0.6 is five hand-written stories. This is the other thing: a live
// board of generated offers that expire whether or not you look at them. They are gated
// on reputation, they pay into skills, and refusing one silently is free while accepting
// and abandoning one is not — otherwise "accept everything and see what sticks" is the
// dominant strategy and the board stops being a decision.
export const CONTRACTS = {
  perStation: 4,          // offers visible at any one station
  maxActive: 3,           // how many you may hold at once
  refresh: 90,            // seconds between board refreshes
  life: [420, 900],       // an offer's shelf life, seconds
  deadline: [300, 780],   // time allowed once accepted, seconds

  // Standing needed to be offered work at all — with the issuing *power* since v1.02.39,
  // not the bloc — and the bonus a good reputation adds to the fee.
  minStanding: -30,
  payPerStanding: 0.004,  // +0.4% per point of standing with the issuer

  // How much of a settled contract's standing reaches the issuer's whole bloc.
  //
  // Not 1.0, and the reason is the point of v1.02.39: three bloc numbers stand in for nine
  // powers, so paying the full move into the coarse number lets a run of work for one desk
  // talk its entire bloc into liking you — including the desk's rivals inside that bloc,
  // which is exactly the collapse the per-power record was built to undo. A third is
  // enough for docking rights to follow a career, and little enough that the powers still
  // disagree with each other.
  blocShare: 0.34,

  // Abandoning or timing out costs standing with whoever posted it. Deliberately more
  // than a single completion pays, so the board rewards reading before accepting.
  failStanding: -6,
  failCredits: 0.15,      // fraction of the fee charged as a penalty

  // Per-type generation bands. `pay` is before standing and difficulty scaling.
  types: {
    haul:    { weight: 34, pay: [3200, 12000], kg: [400, 2600], skill: 'commerce',   rep: 3 },
    bounty:  { weight: 26, pay: [4000, 14500], kills: [2, 6],   skill: 'gunnery',    rep: 4 },
    survey:  { weight: 22, pay: [2800, 9600],  targets: [1, 3], skill: 'sensors',    rep: 3 },
    supply:  { weight: 18, pay: [3600, 13000], kg: [300, 1800], skill: 'extraction', rep: 4 },
    // v1.02.50. Working a debris field is its own kind of work — it is not a survey (nothing
    // is being resolved) and not extraction (the field runs out). It gets a type because
    // `type` is what the board filters and sorts on, and folding it into an existing one
    // would make the filter lie about what the job is.
    salvage: { weight: 20, pay: [5200, 17000], sweeps: [2, 5], skill: 'extraction', rep: 4 }
  },
  practicePerJob: 26      // skill practice awarded on completion
};

// ── station supply ───────────────────────────────────────────────────
// Station modules were pure bonuses: a refinery raised the ore premium and that was the
// whole model. Now they consume and produce, so a refinery that has run dry genuinely
// bids the ore price up and one that is choking on stock stops paying well.
export const SUPPLY = {
  interval: 6,            // seconds between production ticks
  capacity: 12000,        // per-commodity stockpile ceiling
  // module -> { consumes, produces } in kg per tick
  chains: {
    refinery:   { consumes: { ore: 90 },     produces: { salvage: 26 } },
    droneBay:   { produces: { ore: 55 } },
    market:     { produces: { data: 8 } },
    shipyard:   { consumes: { salvage: 42 } },
    cargo:      { store: 4000 }
  },
  scarcity: 0.55,         // how hard an empty stockpile lifts the price
  glut: 0.35              // how hard a full one pushes it down
};

// ── the deal ledger (v1.01.00) ───────────────────────────────────────
// An obligation between two named characters. The numbers here are all about one question:
// what does an offer have to be worth before somebody takes it, and what does breaking one
// cost you afterwards.
export const DEALS = {
  life: 240,               // s an unaccepted offer stands
  deliveryTime: 300,       // s to discharge an accepted deal before it defaults
  sweepEvery: 4,           // s between ledger reviews
  maxPerCharacter: 2,      // obligations one character will carry at once

  // Acceptance. `offer` is pay divided by what the cargo is worth, so 1.0 is paying exactly
  // market. The bar starts below that — a hauler makes money on volume, not margin — and
  // then moves with who is asking.
  baseBar: 0.34,
  barPerGreed: 0.30,       // a greedy character wants a better rate
  barPerSociability: 0.12, // a sociable one will do a favour at a worse one
  barPerTrust: 0.18,       // and trust is worth real money
  warmthWeight: 0.15,
  suggestMargin: 1.25,     // fallback headroom when there is no hauler to quote against
  quoteMargin: 1.04,       // headroom over the best live bar, for rounding and price drift

  // Reliability, read out of memory the way wariness() is. A default costs several
  // deliveries on purpose: a reputation for keeping your word should be slow to build and
  // quick to lose, or keeping it is not worth anything.
  memoryHalfLife: 2400,
  trustPerDelivery: 0.18, trustPerDefault: 0.55, trustPerFavour: 0.10
};
