// Living Galaxy — tuning: what is out there — NPC types, celestial bodies, Lagrange points, the galaxy.
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

// ── NPCs ─────────────────────────────────────────────────────────────
// speed in units/s, sensor/range in units, pcool in seconds
// Hull points were roughly 2.5x lower before the 1.0 pass, which put a raider at about
// a second of fire from a starting military hull — three gauss drivers on a fresh pilot
// is 55 damage per second, and a 60-point ship simply evaporates. A fight you win before
// you have finished turning is not a fight; these give a raider three to four seconds,
// long enough to manoeuvre, lose shields, and decide whether to stay.
export const NPC_TYPES = {
  pirate:  {name:'Pirate Raider',   faction:'hostile',  count:18, hp:150,  speed:0.62, turn:1.1, sensor:1500, range:520,
            dmg:7,  pspeed:520, pcool:1.05, color:0xff4422, size:9,  bounty:260,  salvage:60,  spawn:[4000,24000],
            dtype:'kinetic', armorProfile:'armor',  profile:'skirmish', weaponClass:'standard'},
  drone:   {name:'Nexis Drone',     faction:'hostile',  count:18, hp:85,  speed:0.95, turn:1.9, sensor:1800, range:430,
            dmg:5,  pspeed:600, pcool:0.75, color:0xaa22ff, size:6,  bounty:175,  salvage:35,  spawn:[6000,30000],
            dtype:'em',      armorProfile:'shield', profile:'drone',    weaponClass:'drone'},
  command: {name:'Nexis Command',   faction:'hostile',  count:1,  hp:1200, speed:0.18, turn:0.5, sensor:3000, range:1050,
            dmg:17, pspeed:700, pcool:1.60, color:0xff00aa, size:18, bounty:2600, salvage:420, spawn:[18000,20000],
            dtype:'em',      armorProfile:'shield', profile:'standoff', weaponClass:'seeker'},
  patrol:  {name:'Coalition Patrol',faction:'friendly', count:12, hp:240,  speed:0.68, turn:1.2, sensor:1900, range:560,
            dmg:9,  pspeed:640, pcool:0.90, color:0x66ccff, size:11, bounty:0,    salvage:0,   spawn:[3000,20000],
            dtype:'thermal', armorProfile:'armor',  profile:'skirmish', weaponClass:'fleet'},
  merc:    {name:'Mercenary',       faction:'merc',     count:3,  hp:330, speed:0.88, turn:1.6, sensor:2600, range:520,
            dmg:6,  pspeed:640, pcool:0.50, color:0xffee55, size:10, bounty:400,  salvage:90,  spawn:[5000,22000],
            dtype:'em',      armorProfile:'shield', profile:'brawler',  weaponClass:'standard'},
  miner:   {name:'Belt Miner',      faction:'worker',   count:6,  hp:70,  speed:0.85, turn:0.9, sensor:900,  range:0,
            dmg:0,  pspeed:0,   pcool:9.0,  color:0x88bb66, size:9,  bounty:0,    salvage:120, spawn:[10700,12900]},   // inside the Meridian main belt
  // Haulers. Added in v1.01.00 because the trade layer needed somebody to be in it: two of
  // the seven conversation topics shipped in v1.00.90 required a `haul` role, and no ship in
  // the game had one, so they could never fire. A table of declared requirements needs
  // somebody who meets them.
  hauler:  {name:'Bulk Hauler',     faction:'worker',   count:4,  hp:130, speed:0.80, turn:0.55, sensor:1100, range:0,
            dmg:0,  pspeed:0,   pcool:9.0,  color:0xc8b478, size:14, bounty:0,    salvage:220, spawn:[6000,14000]},
  builderC:{name:'Coalition Builder',faction:'worker',  count:3,  hp:85,  speed:0.75, turn:1.0, sensor:900,  range:0,
            dmg:0,  pspeed:0,   pcool:9.0,  color:0x66aaff, size:9,  bounty:0,    salvage:80,  spawn:[8000,10000]},
  builderP:{name:'Pirate Builder',  faction:'hostile',  count:2,  hp:90,  speed:0.80, turn:1.0, sensor:900,  range:0,
            dmg:0,  pspeed:0,   pcool:9.0,  color:0xcc6644, size:9,  bounty:150,  salvage:90,  spawn:[24000,28000]},
  fort:    {name:'Pirate Bastion',  faction:'hostile',  count:0,  hp:1650, speed:0,    turn:0.6, sensor:2600, range:1150,
            dmg:14, pspeed:700, pcool:1.10, color:0xff2266, size:26, bounty:2600, salvage:500, spawn:[0,0],
            dtype:'kinetic', armorProfile:'armor',  profile:'standoff', weaponClass:'seeker'}
};
export const NPC_RESPAWN_INTERVAL = 9;      // seconds between population top-ups

// ── NPC tactics (v1.00.80) ───────────────────────────────────────────
//
// Two budgets and a nerve model. The budgets close an asymmetry three slices old: the
// player has had a magazine and a thermal cutout since v1.00.60 and NPCs had neither, so an
// NPC gun platform could hold a trigger down forever and a long fight was decided purely by
// who had more hull.
//
// They are deliberately coarser than the player's — one magazine rather than per-feed, one
// heat pool rather than per-group — because an NPC has no fitting screen, and simulating
// what you cannot show is detail nobody can see.
export const NPCAI = {
  // A magazine holds this many seconds of continuous fire, scaled by the hull's own rate.
  // Tying it to `pcool` rather than declaring it per type means a new NPC gets a sane
  // magazine without anybody remembering to add one.
  magazineSeconds: 26,
  heatPerShot: 1.0, heatCap: 22, heatVent: 3.4, heatResume: 0.72,

  // How often a ship is allowed to change its mind. A ship that re-appraises every frame
  // never commits to anything, and commitment is what reads as having decided.
  appraiseEvery: 1.8,

  // Nerve: the hull fraction a ship will fight down to before it breaks off.
  // `fleeHull` is the timid baseline; courage pushes it lower.
  fleeHull: 0.55, courageScale: 0.62,
  baseNerve: 0.25, nerveFromAggression: 0.5, nerveFromLoyalty: 0.25,
  nervePerAlly: 0.09, supportCap: 4,

  // Conserving. Below this share of the magazine a ship stops trading shots up close and
  // holds at reach to make what is left count.
  conserveMagazine: 0.25,

  // Grudges, read off the persona memory in systems/npc-brain.js.
  memoryHalfLife: 2400,
  warinessPerKill: 0.34, warinessPerFavour: 0.18,
  grudgeThreshold: 0.5,
  // A character that remembers you killing its own will not walk into your guns alone.
  // With this many friends in call range, the grudge is the reason it comes at all.
  grudgeSupport: 1,

  // Calling for help. The cheapest thing in the tactics file and probably the most felt:
  // the difference between picking off a patrol and having a patrol arrive.
  callRange: 4200, callCooldown: 6, maxAnswerCall: 4,

  // Stance multipliers on the hull's ENGAGE band. `press` is 1, so a ship that has decided
  // nothing flies exactly the profile it flew before.
  bandScale: { press: 1, hold: 1.45, regroup: 1.9, flee: 1 }
};

export const ENGAGE = {
  brawler:  { hold: 0.32, orbit: 0.85 },   // gets inside and stays there
  skirmish: { hold: 0.62, orbit: 0.70 },   // the old default
  standoff: { hold: 0.92, orbit: 0.35 },   // holds the edge of its optimal
  drone:    { hold: 0.28, orbit: 0.95 }    // shoals get inside and never stop moving
};

// ── population pressure ──────────────────────────────────────────────
// Fixed per-type counts meant the world had a shape it always returned to. Population is
// driven by pressure now: pirates grow where there is undefended traffic to prey on, and
// patrols are dispatched in response to pirates. Both are bounded, because a simulation
// that can run away is a simulation that will.
export const POP = {
  interval: 9,            // seconds between population reviews
  // Tuned so the resting roster lands where the fixed counts used to (~63 ships) with the
  // default 9 workers in the field. The point of the change is not a different headcount,
  // it is that the headcount is now a consequence of what is happening.
  piratePerWorker: 4.0,   // raiders wanted per worker in the field
  patrolPerPirate: 0.28,  // patrols dispatched per raider at large
  patrolBase: 2,          // standing Coalition presence regardless of threat
  claimPressure: 6,       // extra raiders a standing bastion supports
  bounds: {
    pirate: [8, 26], drone: [8, 26], patrol: [6, 22],
    miner: [3, 9], hauler: [2, 8], merc: [1, 5], builderC: [1, 5], builderP: [1, 4], command: [0, 1]
  },
  decayChance: 0.35       // chance an over-quota ship leaves rather than lingering
};

// ── small-body masses ────────────────────────────────────────────────
// In Earth masses, the unit `core/units.js` establishes.
//
// These are a **dynamics abstraction**, not a survey figure, and the distinction matters
// enough that `radiusInBand()` exists to keep them apart. A belt rock's mass here is tuned
// so mining yields and collision momentum behave; running it through the honest
// mass → density → radius chain would report a "pebble" a thousand kilometres across. So
// mass drives the physics and the catalogue's declared size band drives the survey report,
// and neither is asked to do the other's job.
//
// The ladder must stay ordered: the largest huge asteroid has to stay lighter than the
// smallest planet, or a named rock outweighs a world and every mass-ranked list in the game
// reads backwards.
export const BODY_MASS = {
  asteroid:     [3.33e-4, 3.75e-3],
  hugeAsteroid: [4.16e-3, 1.67e-2],
  comet:        [8.33e-4, 5.00e-3]
};

export const RENDER_RANGE = {
  station: 900,     // a berth resolves at roughly the range you would begin an approach
  ship:    2600     // a hull is small but it is the thing you most need to see coming
};

// ── celestial bodies (v1.00.40) ──────────────────────────────────────
// Atmosphere, surface features, and the numbers behind both.
export const CELESTIAL = {
  // How hard a world's air fights the dish. Effective sensor strength is divided by
  // (1 + atmoScan x density), where density runs 0 for an airless moon to ~0.6 for a
  // gas giant or a toxic greenhouse. At 1.2 a giant needs roughly 40% of the standoff
  // a bare rock does for the same resolution — which is why a giant is a body you
  // *probe* rather than one you resolve from a survey ring.
  atmoScan: 1.2,
  // A discovered feature can clear some of that, or make it worse. Bounded so no stack
  // of findings ever turns a greenhouse into vacuum or a clear world into a fog bank.
  featureScanCap: 0.6,

  // Feature counts. Rolled once per world against these cumulative thresholds, so most
  // worlds have one thing worth knowing and a few have three.
  featureNone: 0.18, featureOne: 0.62, featureTwo: 0.90,

  // Feature assay bonuses feed the same permanent per-world figure a survey crew raises.
  // Capped jointly with it so a well-surveyed world with three findings is very good and
  // not free money.
  maxFeatureAssay: 0.55
};

// ── Lagrange points & deep-space anomalies (v1.00.50) ────────────────
export const LAGRANGE = {
  // Mass floor for holding trojans, in the same proxy `wellRadius()` uses (g x r^2).
  // Moons are excluded by kind rather than by this number — a 7 km moonlet posting two
  // more places on the nav map would make the outer system a list rather than a
  // destination, and the largest moon in Solaris (499) outweighs the smallest planet
  // (Aether, 517) closely enough that a mass test alone could not separate them. The
  // floor is the guard for a future planet small enough not to hold anything.
  massFloor: 400,
  occupied: 0.72,     // chance a point holds anything at all
  chartTier: 2,       // scan resolution that resolves what is on station
  workRange: 1400     // how close you must be to work the site
};

// Orbit insertion bands, as multiples of the body's own radius.
export const ORBIT_BANDS = [
  { key: 'low',    name: 'Low orbit',     mult: 1.7,  note: 'tight — best scan resolution' },
  { key: 'std',    name: 'Standard',      mult: 2.8,  note: 'stable parking orbit' },
  { key: 'high',   name: 'High orbit',    mult: 4.6,  note: 'safe from surface batteries' },
  { key: 'survey', name: 'Survey ring',   mult: 8.0,  note: 'wide baseline for probes' }
];

// ── NPC holds (v1.01.70) ─────────────────────────────────────────────
// Until this slice a hauler's cargo was notional: a deal named a commodity and a mass, and
// both appeared at the destination on settlement. Nothing was ever *aboard* anything, so a
// laden hauler could not be intercepted for what it was carrying — you could shoot one, but
// only for the salvage every wreck drops, which is the same reward as shooting an empty one.
//
// Capacity is per NPC type rather than derived from hull size, for the reason SHIP_CLASSES
// declares heat capacity: how much a ship carries is a design property of the ship, and
// deriving it from a display radius would make the bastion the best freighter in the game.
export const HOLD = {
  // kg by NPC type. A type absent from this table has no hold and cannot be laden — which
  // is the honest answer for a drone, and it keeps the spill path from inventing cargo on
  // ships that were never carrying any.
  cap: { hauler: 9000, miner: 2600, pirate: 900, merc: 700, builderC: 1200, builderP: 1200 },

  // What a wreck spills, as a fraction of what was aboard. Never all of it: a ship that
  // comes apart at closing speed scatters more than a pilot can chase down, and a full
  // recovery would make interception strictly better than trading.
  spillFraction: 0.55,
  // Below this the spill is not worth a container — it rounds to nothing rather than
  // littering the belt with 3 kg motes.
  spillFloor: 25,
  // Containers a single wreck can produce, so a fat hauler does not shed one per commodity
  // plus salvage and blow the loot cap on its own.
  spillMax: 3,

  // Miners work until the hold is this full, then run it to a station and sell. That sale
  // moves the station's book the same way a player's does — an NPC economy that does not
  // touch a price is a story about an economy.
  minerRunAt: 0.9,
  minerRate: 34,          // kg/s at the rock — a shift, not an instant fill
  sellRange: 300,         // km from the berth at which a load is handed over
  // Pirates and mercs keep what they scoop, up to their hold, which is what makes a raider
  // that has been working the lane a richer kill than one that just spawned.
  scoopFraction: 0.5
};

// ── the galaxy ───────────────────────────────────────────────────────
// An *index* over `world/genesis.js`, not a second generator. A node is a position, a
// designation and a seed; asking what is in it is one call to `generateSystem(seed)`. So a
// fifty-thousand-star galaxy costs exactly one integer in the save file.
export const GALAXY = {
  count: 50000,
  radius: 52000,          // light-years, in the same arbitrary unit the chart draws
  arms: 4,
  twist: 0.00021,         // radians of spiral per unit of radius
  armSpread: 0.30,        // angular scatter at the core
  armFray: 0.000012,      // ...and how much it widens per unit of radius
  coreBias: 0.72,         // <1 pulls stars inward: the core is denser than the rim
  thickness: 2600,

  // Where a new pilot starts. Out on an arm, not in the core — the core is where the traffic
  // and the trouble are, and a first flight should be quiet.
  homeBand: [0.58, 0.82],
  homeClasses: ['G', 'K', 'F'],

  // Jumping. Superlinear on purpose, so a long hop is a decision rather than a slow short one.
  // ── the chart (v1.02.47) ───────────────────────────────────────────
  // How much of the galaxy is actually drawn. All fifty thousand is one draw call a desktop
  // does not notice and a phone does; the sample is a *stride*, so the arms, the density
  // gradient and the class mix survive it intact.
  chartStars: 9000,
  chartStarSize: 7,
  chartCore: 2600,        // the bright bulge every spiral has
  chartCoreSize: 46,
  chartDust: 5200,        // haze on the arms — what makes it a galaxy and not a point cloud
  chartDustSize: 120,
  chartTapRadius: 26,     // screen pixels

  jumpRange: 3400,
  fuelPerLy: 0.0042,
  fuelQuad: 0.0000009
};

// ── how much galaxy to make ──────────────────────────────────────────
//
// Two knobs, and they are not the same knob, which is why the main menu offers both.
//
// `depth` is how many systems are **pregenerated and archived** at boot. It costs time once
// and disk forever, and what it buys is a galaxy that is already there — a chart you can
// read before you have flown anywhere, powers that hold territory rather than being rolled
// when you arrive, and a trade picture with a shape. Nothing is lost at a low depth; a
// system that is not in the archive is generated on arrival exactly as it always was. The
// archive is a cache with opinions, not a source of truth.
//
// `density` is how much is **in** each system: worlds, berths, fields. It is a multiplier on
// the counts the generator draws, applied after the draw, so density 1.0 reproduces every
// seed exactly as v1.02.54 made it. That property is load-bearing — a save records its seed
// and not its density, so a world generated at 1.0 has to come back at 1.0.
//
// Defaults are deliberately large. The complaint that produced this was that the galaxy felt
// thin, and a default that has to be found in a menu is a default nobody has.
export const GEN = {
  depth:   { min: 32,  max: 4096, step: 32,  default: 640 },
  density: { min: 0.5, max: 2.2,  step: 0.1, default: 1.4 },
  // Pregeneration runs in chunks between frames. Both numbers are about the *loading
  // screen*, not about throughput: a chunk that overruns is a frame the art stutters on,
  // and a loading screen that stutters reads as a game that has hung.
  chunk: 32,
  budgetMs: 9,
  // What the archive is keyed by. Bump when the archived shape changes and every stored
  // system is rebuilt on the next boot rather than read back in a format nobody expects.
  archiveVersion: 1
};

// ── the shoal (v1.02.57) ─────────────────────────────────────────────
//
// Sixty-seven ships is a *cast*. A system with commerce in it, lanes worth raiding and
// patrols worth avoiding is a thousand, and a thousand fully simulated hulls is not a
// budget any phone has: each one is a cloned mesh, an LOD registration, an interpolation
// slot, a broadphase entry and an AI appraisal.
//
// So the population is two tiers, and the split is the same one `world/asteroids.js` makes
// between rocks and gravel — **presence is cheap, presence with consequences is not**.
//
//   - **Live** hulls are what exists today: mesh, tactics, persona, guns, a name you can
//     shoot at. Capped, and the cap is a frame budget rather than a fiction.
//   - **Shoal** records are position, heading, faction and role, and nothing else. They
//     move on rails, they are stepped a few times a second, and they cost about as much
//     each as one asteroid does.
//
// A record **promotes** into a live hull before it could possibly be seen, and a live hull
// **demotes** back when it is far enough away that nothing about it can matter. The
// hysteresis between the two is what stops a ship on the boundary flickering between a
// mesh and a number, which is both ugly and the most expensive thing either tier can do.
//
// The honest limitation, stated rather than hidden: a shoal record cannot be shot, hailed
// or hired, because it is not there. Everything that can happen to a ship happens inside
// `promoteAt`, which is comfortably outside sensor range — so from the cockpit the
// distinction is unobservable, and from the chart it is *reported* rather than faked. See
// `systems/npc/shoal.js`.
export const SHOAL = {
  enabled: true,
  count: 950,             // records; with the authored roster this is a ~1,000-hull system
  // How many hulls may be live at once, the authored cast included. 150 is roughly twice
  // the population the game shipped with and was measured against the same frame budget.
  liveCap: 150,
  // Promotion happens well outside `RENDER_RANGE.ship` (2,600) and outside every hull's
  // sensor (4,200–5,200), so a ship is never seen to appear. Demotion is further out again.
  promoteAt: 7000,
  demoteAt: 9800,
  stepHz: 6,              // record movement updates per second — they are on rails
  promotePerTick: 3,      // at most this many mesh builds per tick, so arrival never spikes
  // What the shoal is made of. Weights, not counts — the mix is what makes a system read
  // as an economy rather than as a battlefield: mostly people working, some people
  // watching them, and enough raiders to make the watching worthwhile.
  mix: [
    ['hauler', 26], ['miner', 22], ['patrol', 14], ['pirate', 13],
    ['builderC', 7], ['drone', 6], ['merc', 4], ['builderP', 3], ['command', 0.4]
  ],
  // Lane traffic: a hauler runs between two orbital radii rather than circling. This is
  // what makes the inner system look like it has trade in it.
  laneShare: 0.55,        // of haulers
  laneSeconds: [240, 900] // how long a one-way leg takes
};
