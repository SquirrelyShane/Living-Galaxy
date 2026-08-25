<<<<<<< HEAD
// Living Galaxy — the tuning barrel.
//
// Every number that balances the game, in one import, as it always has been. The contents
// moved into `core/config/` at v1.02.52 — twelve files mirroring the `systems/` domains —
// and this re-exports all of them so nothing that imports `core/config.js` had to change.
//
// Which is the point: a 1,727-line module is not improved by making four hundred call sites
// edit their import line. Reach for `core/config/combat.js` when you want one domain and
// know where it lives; keep importing this when you want three values from three domains.

export * from './config/base.js';
export * from './config/ships.js';
export * from './config/combat.js';
export * from './config/flight.js';
export * from './config/trade.js';
export * from './config/industry.js';
export * from './config/company.js';
export * from './config/crew.js';
export * from './config/world.js';
export * from './config/npc.js';
export * from './config/render.js';
export * from './config/sim.js';
=======
// Living Galaxy — every tuning number lives here. Balance the game by editing this file only.

export const UNIT_M = 1000;                 // 1 world unit = 1 km
export const G0 = 9.81;
export const WORLD_RADIUS = 55000;          // charted space, in units
export const MAX_PITCH = Math.PI * 0.48;
export const SAVE_KEY = 'livinggalaxy.save.v2';
// Every client seeded the same generates the identical Solaris. Single-player uses
// this (or the seed stored in the save); multiplayer takes the server's seed instead.
export const WORLD_SEED = 1337;
export const NET = {
  sendHz: 8,              // state packets per second

  // ── clock sync (0.10) ────────────────────────────────────────────
  pingHz: 0.5,            // one round trip every two seconds is plenty
  maxRtt: 3.0,            // seconds — anything slower is a broken sample, not a slow one
  rttDecay: 1.04,         // let the best-sample bar rise slowly so it can re-measure

  // ── snapshot buffer ──────────────────────────────────────────────
  // Render this far behind the server clock. Two packet intervals plus a margin, so the
  // two snapshots being blended have both already arrived and the motion between them is
  // known rather than predicted.
  interpDelay: 0.28,
  bufferFrames: 24,
  maxExtrapolate: 0.45,   // guess ahead this long before holding position instead

  // ── host authority ───────────────────────────────────────────────
  // The relay is a stdlib Python socket server with no game logic in it, so the NPCs have
  // to be simulated by *someone's* client. The oldest connected pilot is the host; if they
  // leave, the next oldest takes over. Hosting is a handful of extra sends per second, not
  // a different build.
  npcHz: 5,               // host broadcasts of NPC state per second
  npcMax: 48,             // ships per broadcast — the nearest ones to the host
  hostGrace: 6.0,         // seconds without an NPC packet before assuming the host is gone
  resumeWindow: 90        // seconds a disconnected pilot's slot is held for a reconnect
};

// Spawn clear of the star's corona (radius 320, shells out to 780) and near the
// inner station ring, so the first thing on screen is somewhere to fly to.
/**
 * How far apart the system sits.
 *
 * Every orbit in data/planets.js, data/stations.js and data/belts.js is a *nominal* radius;
 * the world multiplies it by this on the way in. One number rather than editing three data
 * files, so the spacing can be tuned against how the game actually plays.
 *
 * At 1.0 the inner system was unplayably crowded and it took a Contacts panel to see why: a
 * hull's sensor reaches 4,200–5,200 km, and five planets plus four stations sat inside
 * 6,800 km of the star. Standing at a station you could see most of the inner system at
 * once, which makes a sensor rating meaningless and a chart pointless — everything is
 * already on it.
 *
 * **Held at 1.0.** Everything reads this value, so widening Solaris is one edit — and
 * v1.02.30 spent the slice finding out what else has to move with it. Fixed along the way,
 * because each was wrong at any scale:
 *
 *   - `entities/npcs.js` had a bare `FAR = 9000` simulation cull. It scales now.
 *   - Warp speed is per-hull and absolute, so a wider system meant proportionally more
 *     hops. It scales now: a hop is energy-limited, so one charge should buy the same
 *     *fraction of the system* whatever size the system is. The spacing is meant to change
 *     what you can see from one place, not how long the game takes.
 *   - `test/warp-nav.mjs` used literal world coordinates for its start points, so a wider
 *     system silently moved them into the inner system. They scale now.
 *
 * Still open at 2.0, which is why it is not 2.0:
 *
 *   - **Obscura becomes unreachable, and here is how far the diagnosis got.** Hop one
 *     covers 61,733 of the 70,750 km and drops out 9,017 km short. Hop two spools, warps
 *     for 38 s, and ends at 9,017 km — the same distance to the unit, which is a closed arc
 *     at constant range, not a failed approach. `collectObstacles()` from that point
 *     returns exactly one obstacle: **Obscura IV**, a moon of the destination, 1,249 km
 *     from its parent with a 159 km well against the destination's 731 km. It is not
 *     covered by any of the four exemptions in `collectObstacles` — it sits about 335 km
 *     outside the destination's arrival sphere, so it is "avoidable" on paper — and
 *     routing around it produces a waypoint the ship can fly to without ever getting
 *     closer to Obscura. The stall watchdog then re-plots three times and abandons.
 *     Same family as the sibling-moon dead band the planner already handles, one level
 *     out: an obstacle near the *goal* rather than near another obstacle.
 *     Reproduce: set this to 2.0, `node test/warp-nav.mjs`, or trace hop by hop.
 *     An exemption mirroring the warp core's own lock rule was tried and does **not**
 *     cover it — the moon is outside that band too. The fix is in the ring geometry, not
 *     in another exemption.
 *   - **Ambush geometry.** A lurker is snapped to its hide every frame; widen the system
 *     and a close pass no longer springs it.
 *   - **NPC miners stop filling holds** inside the window `test/run.mjs` allows, which may
 *     be the cull, may be the belt distance, and has not been separated.
 *
 * Set it to 2.0 to see the wider system. Three things will be wrong and they are named
 * above, which is a better place to start from than the last time this was tried.
 */
export const ORBIT_SCALE = 1.0;

export const SPAWN = { x: 0, y: 80, z: 3400 * ORBIT_SCALE };
// Sublight approach to the star cooks the hull. Warp already drops out on mass shadow.
export const STAR = { radius: 320, corona: 780, dangerRadius: 1100, dps: 18 };

// ── hulls ────────────────────────────────────────────────────────────
// maxSpeed / warpSpeed are units per second. cargoCap is kg.
export const SHIP_CLASSES = {
  military:   {name:'Military',   icon:'⚔', heatCap:130, dryMass:8500,  maxThrust:2.8e6, cargoCap:1200,  turnRate:1.40, pitchRate:1.20,
               energyCap:100, energyDrainThrust:18, energyDrainTurn:4.0, energyRegen:7.0,
               shieldMax:120, shieldRegen:5.5, armorMax:90,  hullMax:100, maxSpeed:2.9, warpSpeed:1500,
               weapon:'gauss',   weaponMult:1.30, miningMult:0.45, sensor:4600},
  industrial: {name:'Industrial', icon:'⚙', heatCap:95, dryMass:18500, maxThrust:3.2e6, cargoCap:18000, turnRate:0.70, pitchRate:0.65,
               energyCap:140, energyDrainThrust:22, energyDrainTurn:6.0, energyRegen:9.0,
               shieldMax:80,  shieldRegen:3.0, armorMax:140, hullMax:130, maxSpeed:2.1, warpSpeed:1100,
               weapon:'scatter', weaponMult:0.80, miningMult:1.60, sensor:5200},
  logistics:  {name:'Logistics',  icon:'📦', heatCap:100, dryMass:14000, maxThrust:2.6e6, cargoCap:22000, turnRate:0.85, pitchRate:0.80,
               energyCap:120, energyDrainThrust:16, energyDrainTurn:5.0, energyRegen:8.0,
               shieldMax:90,  shieldRegen:4.0, armorMax:110, hullMax:110, maxSpeed:2.4, warpSpeed:1800,
               weapon:'pulse',   weaponMult:0.90, miningMult:0.85, sensor:4800},
  economic:   {name:'Economic',   icon:'💰', heatCap:105, dryMass:9500,  maxThrust:2.4e6, cargoCap:6000,  turnRate:1.10, pitchRate:1.05,
               energyCap:110, energyDrainThrust:14, energyDrainTurn:3.5, energyRegen:8.5,
               shieldMax:100, shieldRegen:4.5, armorMax:85,  hullMax:95,  maxSpeed:2.6, warpSpeed:1400,
               weapon:'pulse',   weaponMult:1.00, miningMult:0.70, sensor:5000},
  civilian:   {name:'Civilian',   icon:'🛰', heatCap:80, dryMass:7200,  maxThrust:1.6e6, cargoCap:2500,  turnRate:1.15, pitchRate:1.10,
               energyCap:90,  energyDrainThrust:11, energyDrainTurn:3.0, energyRegen:6.5,
               shieldMax:70,  shieldRegen:4.0, armorMax:70,  hullMax:85,  maxSpeed:2.5, warpSpeed:1300,
               weapon:'scatter', weaponMult:0.70, miningMult:0.60, sensor:4200}
};
export const CLASS_ORDER = ['military','industrial','logistics','economic','civilian'];

// You start in a civilian hull. Every other career path is a hull you must BUY at a
// shipyard (any station's Refit tab). Owned hulls can be swapped between for free.
// Hull prices tripled in the 1.0 pass. Together with the commodity cut they put a hull
// at roughly one good haul rather than a fraction of one: an 18-tonne industrial run is
// about 70,000 credits and a military hull with its licence is about 73,000. Before the
// pass a single load bought every ship in the game twice over, which is why none of the
// tiers below meant anything.
export const SHIP_PRICE = {
  civilian: 0, economic: 12600, logistics: 20400, industrial: 28500, military: 42000
};
export const START_CLASS = 'civilian';

// ── weapons ──────────────────────────────────────────────────────────
export const WEAPONS = {
  pulse:   {name:'Pulse Laser',  damage:10, speed:760,  life:1.20, cooldown:0.19, energy:3.0, color:0x66ddff},
  gauss:   {name:'Gauss Driver', damage:24, speed:1100, life:1.00, cooldown:0.62, energy:7.5, color:0xffd070},
  scatter: {name:'Scatter Beam', damage:6,  speed:620,  life:0.95, cooldown:0.11, energy:1.9, color:0xaaffcc}
};

// ── mining ───────────────────────────────────────────────────────────
export const MINING = {range:260, rate:14, energy:9, oreScale:1.0};  // kg/s at mult 1

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

// ── flight / warp feel ───────────────────────────────────────────────
// The cockpit camera sits at the ship's origin, so exhaust particles land on top of the
// near plane and mobile GPUs blow the sprites up instead of clipping them. Keep them off
// until there's a chase camera to see them from.

export const FLIGHT = {
  assistAlign: 1.8,       // how fast lateral drift is nulled, with authority to spare
  assistBrake: 0.55,      // idle deceleration with assist on
  reverseCap: 0.40,       // reverse speed as fraction of maxSpeed
  fovCruise: 68, fovWarp: 96,

  // ── chase camera framing (1.01.76) ───────────────────────────────
  // The chase cam used to be the cockpit camera translated backward and 13 units up
  // in *world* Y, with the cockpit's own orientation kept unchanged. It therefore
  // never looked at the ship: it looked straight past it, so the hull and its plume
  // sat low in the frame and the view was, to a pilot, the forward view with a
  // thruster in it. These three numbers frame it deliberately instead.
  chaseBack: 42,          // distance behind the ship, along the nose axis
  chaseUp: 13,            // offset along the ship's own up, not world up
  chaseLead: 18,          // aim point ahead of the ship — keeps the hull low-centre
                          // and the space you are flying into still on screen

  // ── assist authority (0.3) ───────────────────────────────────────
  // Assist is a *powered* system now, not a rule that edits velocity for free.
  // Its two jobs are separated because they are different pieces of hardware:
  // RCS quads kill sideways drift, the main engine runs retrograde to slow down.
  // Each is capped as a multiple of the hull's own rated acceleration, so a heavy
  // or damaged ship has correspondingly less of it.
  rcsAuthority: 6.0,      // lateral correction, x rated accel
  brakeAuthority: 5.0,    // retrograde braking, x rated accel
  assistDrain: 2.6,       // MW while the RCS is actually firing
  assistFloor: 0.25,      // authority retained at zero energy (cold-gas reserve)

  // Terminal velocity is approached, not collided with. Past the cap the excess
  // bleeds off exponentially instead of being scaled away in one frame, which is
  // what made boosts and drop-outs feel like hitting a wall.
  capBleed: 3.0,
  capHard: 1.25,          // absolute ceiling, x maxSpeed — the backstop
  slipStall: 0.55         // cos(angle) below which the HUD calls it a slip
};
export const WARP = {
  // a full-system crossing should cost most of the bank, not all of it
  spoolTime: 2.2, drainSpool: 12, drainCruise: 2.4, cooldown: 2.4,
  // The floor on where a warp core drops out, for a body whose own well is smaller than
  // this. It was 900 when a barren rock projected a 725 km shadow, so it never bound on
  // anything. With the well formula below it binds on *everything except the star* — every
  // arrival in the game was at exactly 900 km regardless of what you were arriving at,
  // which meant shrinking the wells changed nothing a pilot could feel and left a
  // five-minute sublight burn at the end of every hop to a small world.
  //
  // 240 is roughly a low orbit band on a mid-sized planet, so arrivals now scale with the
  // body: the star still drops you 1,467 km out and a moonlet drops you 240.
  arriveRadius: 240, massShadow: 900, alignRate: 1.6,

  // ── the gravity well ─────────────────────────────────────────────
  // These numbers were hardcoded inside `wellRadius()` in systems/warp.js, which is the
  // one thing this file exists to prevent: "balance the game by editing this file only"
  // is not true if the most geometrically consequential formula in the game lives
  // somewhere else.
  //
  //   raw  = scale x (sqrt(gravity) x radius / refR) ^ exp + radius x size
  //   well = clamp(raw, min, max)
  //
  // The old formula read `gravity` as if it were mass. It is not — it is *surface*
  // gravity, and surface gravity barely falls off as a body gets smaller: a 7 km moonlet
  // at 0.18 g and a 151 km gas giant at 2.6 g are only a factor of four apart in sqrt(g),
  // so the moonlet projected a 557 km shadow, thirty-seven times its own radius. That is
  // what made gravel behave like a wall, forced the planner to detour around it, and
  // dropped a warp out embarrassingly far from anywhere.
  //
  // What actually sets the reach of a well is mass, and mass goes as gravity x radius^2.
  // `sqrt(g) x radius` is that, square-rooted — so the well now grows with the body
  // rather than with a constant. The exponent keeps the star from swallowing the inner
  // system without needing a cap to save it.
  //
  //   Solaris Prime  2,478 -> 1,596     Titanus (gas giant)  1,325 -> 668
  //   Gaia            930 ->   361      Aether (barren)        725 -> 155
  //   Gaia I (moon)   561 ->    90      Aether I (moonlet)     554 ->  45
  //
  // A well is now something you can see out of the cockpit, and a well radius sits
  // between four and ten body radii instead of thirty-seven.
  well: { refR: 80, scale: 250, exp: 0.6, size: 1.2, min: 40, max: 2400 },
  // Fraction of the destination's well at which the core actually drops out. The planner
  // reads the same number (systems/navplan.js) so a course is judged against the point the
  // ship really stops at rather than a centre it never reaches.
  arriveFactor: 0.92,

  // ── 0.3 ──────────────────────────────────────────────────────────
  // Holding a warp bubble around more mass costs more. A loaded hauler pays for
  // its cargo on every crossing, which is the trade the freight routes are about.
  massDrain: 0.55,        // extra cruise drain at 2x dry mass
  // Weapons fire destabilises a spooling core. A hit knocks charge back rather
  // than aborting outright, so a pilot under light fire can still get away.
  hitCharge: 34,          // charge lost per hit taken while spooling
  hitGrace: 0.35,         // seconds a hit keeps knocking charge back
  // Course keeping
  replanInterval: 2.0,    // seconds between route re-plans
  waypointRadius: 700,    // how close counts as reaching a waypoint
  stallWindow: 6.0,       // seconds of no progress before the route is suspect
  stallProgress: 0.02,    // fraction of remaining distance that counts as progress
  stallLimit: 3           // re-plots before the course is abandoned
};

// ── course planner ───────────────────────────────────────────────────
// Waypoints are placed at `clear` well-radii and blockage is tested at the
// tighter `test` radius. Without that hysteresis a leg that starts exactly on
// the clearance sphere still reads as blocked and the planner loops forever.
export const NAV = {
  clear: 1.45,            // place bypass nodes this many well-radii out
  test: 1.12,             // treat a leg as blocked inside this many well-radii
  // Absolute floor on the gap between the two, in units.
  //
  // A planned course is a polyline; the ship is not. It steers at `WARP.alignRate` while
  // moving at up to 1,800 units/s, so it cuts every corner by a distance set by its own
  // handling — not by the size of whatever it is going around. The proportional margin
  // was 419 units at the old well sizes and 163 at the new ones, which is less than a
  // warp ship's tracking error: courses were planned clear, flown slightly inside, and
  // dropped out on a body they had been routed around. Vulcan on an oblique approach took
  // three hops and fifty-six minutes of flight because of it.
  margin: 350,
  rings: 6,               // bypass nodes generated around each obstacle
  maxObstacles: 8,        // obstacles considered per plan, nearest first
  maxNodes: 64,           // hard ceiling on graph size
  maxWaypoints: 8         // legs in a returned course
};

// ── damage model ─────────────────────────────────────────────────────
// Three damage types against three layers. The multipliers are the whole point of
// the system: no weapon is best against everything, so a loadout is a decision about
// what you expect to fight rather than a search for the biggest number.
//
//   EM      shreds shields, struggles against plating   — anti-shield
//   kinetic punches armour, shields shrug much of it off — anti-armour
//   thermal burns structure, plating soaks it well       — anti-hull
//
// A layer's multiplier applies to the damage arriving at that layer, so a round that
// overpenetrates one layer is re-scaled on the way into the next.
export const DAMAGE = {
  types: ['kinetic', 'thermal', 'em'],
  fallback: 'kinetic',
  resist: {
    kinetic: { shield: 0.72, armor: 1.30, hull: 1.00 },
    thermal: { shield: 1.00, armor: 0.70, hull: 1.25 },
    em:      { shield: 1.40, armor: 0.80, hull: 0.85 }
  },
  // Carried over from the original cascade so the feel of a hit is unchanged when a
  // weapon has no type: plating soaks a share, structure takes less than it is dealt.
  armorSoak: 0.85,
  hullSoak: 0.70,
  // Range falloff. Inside `optimal` a weapon does full damage; past it, damage decays
  // over `falloff` units to a floor. Weapons without an optimal never fall off.
  falloffFloor: 0.25
};

// ── point defence ────────────────────────────────────────────────────
// v0.3 rolled a dice inside damagePlayer(), which meant "point defence" was an
// invisible damage reduction that fired after the round had already arrived. It is an
// interception now: real rounds are shot down in flight, in front of you, and each
// round is only ever judged once.
export const POINTDEF = {
  range: 260,          // interception envelope, units
  burst: 6             // sparks drawn on a successful intercept
};
// `perRound` used to live here as `true`. It was never read, because it was never a lever:
// each round is judged exactly once on entry to the envelope, and the alternative — rolling
// every frame — makes the grid strictly better the slower the round and ties the hit rate to
// frame rate. A constant that only ever has one correct value is documentation wearing a
// config key's clothes, and it belongs in the comment on the code that does the thing.

// ── missiles ─────────────────────────────────────────────────────────
// A missile now carries its own lock rather than steering at whatever the player
// happens to have selected mid-flight, and it can lose that lock.
export const SEEKER = {
  cone: 0.62,          // cos of the half-angle the seeker can still see through
  reacquire: false,    // a lost lock stays lost — it flies on ballistically
  lead: 1.15,          // how hard it leads the intercept point
  decoyRange: 420,     // a buoy inside this radius can pull a seeker
  decoyChance: 0.55,   // per-missile chance a buoy in range takes the lock
  armTime: 0.15        // seconds before the seeker starts steering
};
export const DECOY = { life: 14, radius: 8, max: 6 };

// ── engagement envelopes ─────────────────────────────────────────────
// Every NPC used to fly the same profile: close to 80% of range, orbit, shoot. A
// gauss boat and a scatter boat should not want the same distance.
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

// ── reputation ───────────────────────────────────────────────────────
// Three blocs. The matrix is what stops reputation being three independent counters you
// can max out in parallel: helping the Coalition costs you with the pirates at 0.8 of the
// gain, so there is no route to being everyone's friend. Independents care about both,
// weakly, because they have to live with whoever wins.
export const REP = {
  min: -100, max: 100,
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

// ── detection ────────────────────────────────────────────────────────
// Being seen used to be a fixed radius: cross AMBUSH.trigger of a lurker's sensor and it
// woke up, whatever you were doing. Detection is a contest now — their sensor against
// your signature — so how you fly decides how close you can get.
export const DETECT = {
  baseSignature: 1.0,
  massRef: 12000,         // a hull this heavy has a signature of 1
  massWeight: 0.45,       // how much mass swells the signature
  throttleWeight: 0.75,   // burning hard is loud
  firingBoost: 1.9,       // shooting is the loudest thing you can do
  warpBoost: 2.4,         // a warp bubble is not subtle
  silentFloor: 0.35,      // coasting cold, this is as quiet as a hull gets
  ambushFactor: 0.55      // lurkers wake at this fraction of their detection range
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

  // Standing needed to be offered work at all, per issuing bloc, and the bonus a good
  // reputation adds to the fee.
  minStanding: -30,
  payPerStanding: 0.004,  // +0.4% per point of standing with the issuer

  // Abandoning or timing out costs standing with whoever posted it. Deliberately more
  // than a single completion pays, so the board rewards reading before accepting.
  failStanding: -6,
  failCredits: 0.15,      // fraction of the fee charged as a penalty

  // Per-type generation bands. `pay` is before standing and difficulty scaling.
  types: {
    haul:   { weight: 34, pay: [3200, 12000], kg: [400, 2600], skill: 'commerce',   rep: 3 },
    bounty: { weight: 26, pay: [4000, 14500], kills: [2, 6],   skill: 'gunnery',    rep: 4 },
    survey: { weight: 22, pay: [2800, 9600],  targets: [1, 3], skill: 'sensors',    rep: 3 },
    supply: { weight: 18, pay: [3600, 13000], kg: [300, 1800], skill: 'extraction', rep: 4 }
  },
  practicePerJob: 26      // skill practice awarded on completion
};

// ── fitting budgets ──────────────────────────────────────────────────
// Until 0.7 a fit was a shopping list: the only limit was the number of hardpoints and
// whether you could afford the parts, so the optimal fit was "the most expensive thing
// that fits in each slot" and there was no decision in it. Two budgets fix that.
//
//   Power  is generated by the hull and drawn by every fitted module.
//   CPU    is bandwidth, not energy — how much the flight computer can actually run.
//
// Going over either does not simply stop you. It degrades, progressively, so an
// over-tight fit is a gamble rather than an error message.
export const BUDGET = {
  // Tuned against the heaviest *legal* fit — every hardpoint filled with the hungriest
  // module that fits it, which for the current table is 7.0 MW and 24.3 tf. A big hull
  // carries that comfortably; a civilian shuttle is about 20% over on both and has to
  // choose. A budget the game cannot exceed is decoration, which is precisely the
  // criticism this system exists to answer.
  powerPerHull: { military: 7.4, industrial: 9.0, logistics: 8.0, economic: 7.6, civilian: 5.8 },
  cpuPerHull: { military: 26, industrial: 30, logistics: 28, economic: 27, civilian: 20 },
  cpuPerRank: 1.6,        // Engineering rank raises what you can run
  powerPerRank: 0.9,      // ...and what you can feed
  overloadGrace: 0.05,    // 5% over is free — floating-point slack, not a build strategy
  // Past the grace, every 10% of overload costs this much of the offending resource's
  // dependent systems.
  powerPenalty: 0.55,     // shield regen, energy recharge
  cpuPenalty: 0.45,       // sensors, scan rate, tracking
  maxPenalty: 0.75        // never fully disable a ship — a soft-lock is not a tradeoff
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

// ── display ──────────────────────────────────────────────────────────
export const DISPLAY = {
  baseFont: 13,           // px at scale 1 — everything else is in rem off this
  minScale: 0.85,
  maxScale: 1.6
};

// ── adaptive quality ─────────────────────────────────────────────────
// Thresholds are in milliseconds of p95 frame time — the 95th percentile, not the mean,
// because the mean on a phone is nearly always fine and the p95 is what the player feels.
// The gap between raiseBelow and dropAbove is the hysteresis band: a device sitting on a
// boundary settles there instead of flapping between two levels all session.
export const QUALITY = {
  dropAbove: 22,          // ~45 fps — start shedding work
  panicAbove: 38,         // ~26 fps — shed two levels at once
  raiseBelow: 11,         // ~90 fps sustained before asking for more
  settle: 1.5,            // seconds to wait after any change
  climbSettle: 6.0,       // ...and much longer after climbing
  minSamples: 45          // frames of history before believing the numbers
};

// ── render interpolation ─────────────────────────────────────────────
// The fixed step from slice 1 means the world is only correct at step boundaries. At
// 120 Hz that is every other frame; the ones in between were showing a stale position.
export const INTERP = {
  enabled: true,
  maxLead: 1.2,           // never extrapolate further than this many steps
  snapDistance: 400       // a jump bigger than this is a teleport, not motion — do not smear it
};

// ── level of detail ──────────────────────────────────────────────────
// Thresholds are fractions of screen height, best-first. A body covering more than 12%
// of the screen gets full geometry; below 0.15% it is smaller than a pixel and is culled
// outright. Screen size rather than distance, because a gas giant far away is bigger on
// screen than a station close up, and the one that is bigger on screen is the one whose
// detail you can actually see.
export const LOD = {
  thresholds: [0.12, 0.035, 0.008],
  cull: 0.0015,
  segments: [48, 24, 12, 8]      // sphere tessellation per level
};

// ── light budget ─────────────────────────────────────────────────────
// See `world/lightrig.js`. `pool` is the number of point lights the scene contains for
// ships, hulls and stations combined — a hard ceiling, not a target, because the count is
// compiled into every lit material's shader and changing it recompiles the world.
//
// Six is chosen from what is actually on screen at once: the ship you are fighting, the
// two nearest to it, the station you are approaching and a little slack. Raising it is
// safe correctness-wise and expensive per fragment; lowering it to 3 or 4 is the first
// thing to try on a device that still struggles. It is not tied to the quality level on
// purpose — a mid-flight quality drop would otherwise stall on a shader rebuild, which is
// exactly the stutter the controller was trying to fix.
export const LIGHTS = {
  pool: 6,
  range: 160,        // pool default falloff; each emitter overrides with its own
  reach: 1.15,       // an emitter further than range × reach is treated as absent
  interval: 0.1      // seconds between re-selections — lights still track hosts per frame
};

// ── audio mix ────────────────────────────────────────────────────────
// Four buses because these are the four things that need balancing against each other.
// Alerts duck the rest rather than out-shouting them: a warning that has to win a
// shouting match is a warning the player misses.
export const AUDIO = {
  master: 0.16,
  buses: { sfx: 1.0, alert: 1.0, engine: 0.55, music: 0.35 },
  duckTo: 0.32,           // everything else falls to this fraction during an alert
  duckMs: 420,
  earshot: 2600,          // beyond this a sound is not played at all
  soundSpeed: 620,        // notional, in game units/s — tuned for audibility, not realism
  dopplerMax: 0.35        // never shift more than this, or a pass sounds like a cartoon
};

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

// ── locking ──────────────────────────────────────────────────────────
// Three ranges, and they are three different things. Before v1.00.30 there were two, and
// one of them was not checked at all:
//
//   **Sensor**  — can I see you exist. The signature contest from 0.5.
//   **Lock**    — can I hold a firing solution on you. Much shorter, takes time to build,
//                 and breaks if you get outside it.
//   **Hit**     — how far a shot can actually reach. Shorter again for most hulls;
//                 longer than lock only for standoff platforms with their own seekers.
//
// The old code reported "locked on" from `target && target.isPlayer` with no distance test
// whatsoever, so once a raider had noticed you on the far side of the system it stayed
// locked forever — which is exactly what it felt like.
export const LOCK = {
  lockFactor: 0.55,       // lock range as a fraction of sensor range
  breakFactor: 1.35,      // ...and how far past it a held lock survives before breaking
  lockTime: 1.8,          // seconds inside lock range before the solution is good
  decay: 2.2,             // how fast a partial lock falls apart once you are outside
  // Weapon reach as a multiple of the hull's own engagement range. A gunship cannot shoot
  // past what it can lock; a missile boat, a drone shoal and a fleet element can, because
  // the round does its own terminal guidance.
  hitFactor: { standard: 1.0, seeker: 2.4, drone: 1.9, fleet: 2.1 },
  hitCeiling: 9000,       // nothing reaches past this, whatever the arithmetic says

  // An absolute ceiling on lock range, and the reason it has to exist.
  //
  // `lockRange()` is a fraction of *detection* range, and detection is sensor × signature
  // with nothing bounding the signature. A laden industrial hull burning hard, firing and
  // warping stacks mass × throttle × firing × warp to a signature near 10; a Nexis Command
  // with a 3,000-unit sensor then detects at ~31,800 and locks at ~17,500 — seventeen
  // megametres, most of the way across charted space. The lock alarm fired on ships the
  // pilot could not see and that could not have shot at them.
  //
  // The number is `hitCeiling`, deliberately: nothing should be able to hold a firing
  // solution further out than the furthest anything can actually shoot.
  rangeCeiling: 9000
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
// data/planetary/branches/index.js, the objective durations are per-type in the same order
// table, and the active cap is ORDERS.maxActive. A second copy of a number nobody reads is
// worse than no copy: it looks like the lever.

export const ADVANCED = {
  pointDefChance: 0.28,     // per level: fraction of incoming rounds intercepted
  naniteArmorPerSec: 1.4,   // per level, out of combat
  naniteHullPerSec: 0.6,
  outOfCombat: 6            // seconds since last hit before nanites/PD-idle kick in
};

export const DOCK = {range: 280, maxSpeed: 0.30};

// Approach autopilot. hailMeters is the extra standoff past the geometry-safe
// distance — the "500 m" on the station controller's board.
export const APPROACH = {
  steer: 2.2, speedGain: 0.6, arriveSpeed: 0.3,
  stationStandoff: 1.6, hailMeters: 500,
  planetGravityMult: 2.6, starMult: 4.2, asteroidHoldMult: 0.8, shipHold: 240,
  orbitOmega: 0.012
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

// ── simulation clock ─────────────────────────────────────────────────
// The frame loop runs the simulation on a fixed step and renders once per frame,
// so physics is identical at 30, 60 or 120 fps and a stutter can no longer teleport
// a projectile through a hull. `maxSteps` caps catch-up: after a long background
// tab the remainder is dropped rather than simulated in one lurch.
export const CLOCK = {
  fixedStep: true,
  step: 1 / 60,          // seconds of simulation per step
  maxFrame: 0.25,        // longest real frame we will account for at all
  maxSteps: 5,           // steps per frame before we give up catching up
  perfSamples: 120       // frame-time ring buffer length
};

// ── diagnostics ──────────────────────────────────────────────────────
// A throwing subsystem should cost you that subsystem for a frame, not the game.
export const DIAG = {
  guard: true,           // wrap frame phases in error guards
  maxLog: 40,            // ring buffer of captured errors
  maxRepeats: 12         // repeated failures in one phase before it is parked
};

// ── fitting ──────────────────────────────────────────────────────────
// Every hull has three kinds of hardpoint. Weapon slots take guns/launchers,
// utility slots take active kit, core slots take permanent subsystems.
// Refits (UPGRADES above) still apply on top — slots are about *arrangement*.
export const HULL_SLOTS = {
  military:   { weapon: 3, utility: 2, core: 2 },
  industrial: { weapon: 1, utility: 3, core: 3 },
  logistics:  { weapon: 1, utility: 4, core: 2 },
  economic:   { weapon: 2, utility: 3, core: 2 },
  civilian:   { weapon: 1, utility: 2, core: 2 }
};
// Firing every mounted gun at once would trivialise a 3-slot military hull, so
// each extra barrel past the first contributes at a falloff.
export const MULTI_GUN_FALLOFF = 0.78;

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
    casualty: 160             // a shipmate hurt — the hardest lesson there is
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

// ── progressive scanning ─────────────────────────────────────────────
// Resolution is a function of range over sensor strength. Far away you get a
// spectrometry band; up close you get the whole assay.
export const SCAN = {
  bands: [1.60, 0.75, 0.32, 0.12],   // ratio thresholds for tier 1,2,3,4
  chargeTime: 1.6                    // seconds the dish needs per sweep
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

// ── ordnance: magazines and heat (v1.00.60) ──────────────────────────
//
// Two budgets sit beside the energy bank, and they fail differently on purpose. Running
// dry is a *supply* problem you solve before you undock; overheating is a *tempo* problem
// you solve inside the fight by easing off the trigger. A weapon system with only one
// limiter has only one decision in it.
export const ORDNANCE = {
  // Rounds a magazine holds per unit of the blueprint's own stack size. Buying one
  // AMMO-001 stack is 200 slugs, which the catalogue already says; this is here so a
  // future balance pass has a lever that does not mean editing forty blueprints.
  stackScale: 1.0,
  // A round is worth this much of the weapon's damage even at the bottom tier. Yield
  // scaling lives in systems/ordnance.js, derived from the round's tier.
  minYield: 1.0,
  // Armour-piercing rounds give up yield for penetration: the target's armour resistance
  // is cut by this fraction. Paired with the shallow tier curve, this is what makes the
  // *type* of round the decision rather than its price.
  apPenetration: 0.45, apYield: 0.88,
  // Missiles and torpedoes fire one round per shot. A burst weapon would eat a 200-slug
  // stack in half a minute at one round per trigger frame, so a high-rate feed draws a
  // fraction and the remainder is carried on the stock — the visible count still only
  // ever moves by whole rounds.
  roundsPerShot: { autocannon: 0.34, rail: 1, missile: 1, torpedo: 1 },
  // Station price is the catalogue's unit cost times the stack, plus a markup — you pay
  // for somebody else having made it, which is the whole reason the manufacturing tree
  // is worth standing up.
  stationMarkup: 1.35,
  // What an ordinary station can stock without a tech rating of its own. Tier 3+ rounds
  // stay a manufacturing problem rather than a shopping trip, deliberately: the ammunition
  // tree has existed in the crafting database since v1.00.20 with nothing at the far end
  // of it, and the far end should not be a shop counter.
  baseStationTier: 2,
  // What a new pilot undocks with. A gauss driver is standard issue on the starting fit,
  // and a standard-issue gun that cannot fire is not a design decision — it is a bug with
  // a rationale attached.
  startingRounds: { 'AMMO-001': 400, 'AMMO-002': 120 }
};

export const HEAT = {
  // Capacity is declared per hull in SHIP_CLASSES rather than derived from mass. Mass was
  // the obvious proxy and it is the wrong one: it made the industrial hauler the best gun
  // platform in the game and the military hull the worst, because a freighter is heavy.
  // How much fire a ship can sustain is a design property of the ship — radiators, not
  // tonnage — so it is a number a hull carries.
  capFloor: 40,
  // Radiated per second, as a fraction of capacity. A ship sheds a full heat load in
  // roughly twenty seconds of not shooting.
  ventRate: 0.05,
  // Heat per shot, as a multiple of the shot's energy draw. Energy weapons run hot
  // because they dump their draw straight into the emitter; a projectile weapon's heat is
  // mostly the barrel, so it scales with damage instead.
  perEnergy: 0.62, perDamage: 0.055,
  // Hysteresis, and the direction matters: the guns cut out at `cutout` and do not come
  // back until `resume`, which is lower. Equal thresholds would chatter the trigger on
  // and off every frame at the boundary — the same failure the lock ranges had in
  // v1.00.30, and worth naming again because it is easy to write by accident.
  cutout: 1.0, resume: 0.82,
  // Above this fraction the HUD says so, before anything has actually stopped working.
  warn: 0.7
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

// ── interlocks ───────────────────────────────────────────────────────
// The numbers behind systems/preflight.js. Kept here rather than inline so a hull that
// locks its cutter out too eagerly is a tuning change, not a code change.
export const INTERLOCK = {
  repeat: 1.4,               // s before the same refusal is spoken again
  cutterHullFloor: 0.18,     // fraction of hull below which the cutter arm will not run
  cutterEnergyMargin: 2.0,   // multiples of the per-second draw needed to strike an arc
  warpEnergy: 25             // matches the old inline constant in warp.js
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

// ── comms ────────────────────────────────────────────────────────────
// The log is a place people talk, not a place the game prints at you. Traffic is
// generated from what is actually happening within earshot; replies cost standing.
// ── research (v1.01.50) ──────────────────────────────────────────────
// Survey data had exactly one sink — selling it — and blueprints had no gate at all. These
// are the thresholds that decide what a world *teaches*, and they are temperatures rather
// than a list of planet names on purpose: the planet table has grown twice, and a whitelist
// would have quietly stopped covering it.
export const RESEARCH = {
  hotAbove: 120,    // °C at or above which a body files a thermal finding
  coldBelow: -80    // ...and at or below which it files a cryogenic one
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

// ── NPC-to-NPC communication (v1.00.90) ──────────────────────────────
// The exchange layer under everything social. Bounded on purpose: with sixty ships aboard
// there are seventeen hundred pairs, and a social system that costs O(n^2) per frame is a
// social system that gets deleted the first time somebody profiles the game on a phone.
export const NPCCOMMS = {
  range: 5200,             // km — how far two ships can hold a conversation
  overhearRange: 9000,     // km — how close the player must be to pick it up (COMMS.range)
  sweepEvery: 3.5,         // s between attempts to start an exchange anywhere in the system
  attemptsPerSweep: 3,     // pairs sampled per sweep
  maxPerSweep: 2,          // exchanges actually run per sweep
  scanCap: 24,             // ships examined when looking for a partner, from a random offset
  memoryHalfLife: 2400,    // s — matches NPCAI so a relationship and a grudge fade together
  // How wary a character must be of the player before it starts passing the warning on.
  // This is what makes reputation travel at the speed of conversation rather than
  // teleporting into a global number.
  gossipThreshold: 0.34
};

export const COMMS = {
  range: 9000,               // km — beyond this a ship is out of voice range
  maxLog: 120,               // entries retained; older ones roll off
  idleChatter: [26, 70],     // s between ambient exchanges, randomised in this band
  hailCooldown: 45,          // s before the same ship hails you again
  replyWindow: 40,           // s a reply option stays live
  channels: ['local', 'trade', 'distress', 'company']
};

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

// ── NPC brains ───────────────────────────────────────────────────────
// The NPC_Avatar tiers. Tiers 1–2 (traits, memory, grammar) are always on and cost
// nothing worth measuring. Tier 3 — an actual language model in a worker — is `enabled`
// but does not download anything until the player asks for it in Settings → Lab, because
// a several-hundred-megabyte fetch is an opt-in, not a boot step.
export const AVATAR = {
  enabled: true,             // Tier 3 permitted at all (the model still loads on request)
  model: 'smollm2-360m',     // key into src/npc-avatar/llm/models.js
  maxConcurrent: 1,          // one generation in flight. Do not raise this on a phone.
  cooldown: 25,              // s before the same character is asked to think again
  timeoutMs: 5000,           // a reply that misses this is abandoned, not waited on
  maxTokens: 44,             // NPC one-liners, not conversation
  temperature: 0.75,
  maxChars: 200,             // hard cap after sanitising, matched to the comms panel
  memoryCap: 12,             // episodic facts per character
  maxPersonas: 160,          // bound on the persona table across a long session
  witnessRange: 6000,        // km — close enough to have actually seen what you did
  maxWitnesses: 5,           // ships that file a memory per event, newest-nearest first
  claimRange: 900            // km — close enough to a rock that a miner calls it theirs
};

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

// ── module wear (v1.01.70) ───────────────────────────────────────────
// The third item deferred out of v1.00.20, and the last one. Ammunition and heat landed in
// v1.00.60; condition never did.
//
// The design constraint, and the reason this is not a clock: **wear must be a consequence of
// what you did, not a tax on having played.** A module that degrades on a timer is rent —
// you pay it whether you fought or docked, and the only decision it creates is a chore. So
// every channel below is an event the pilot chose: a shot fired, a hit taken, a cruise
// flown, a beam held on a rock.
//
// The effect reuses the budget system rather than inventing a second penalty. A worn module
// gives less *and* draws more, which pushes a fit that was comfortable toward the overload
// curve v0.7 already built. A pilot who has been ignoring maintenance does not get a new
// error message; they find their existing one arriving sooner.
export const WEAR = {
  // Condition runs 1 (yard-fresh) down to 0 (worn out). Nothing is ever destroyed — a dead
  // module is a soft-lock at the worst possible moment, and "degrade rather than refuse" is
  // the rule the fitting budgets already follow.
  floor: 0.55,            // effectiveness of a module at zero condition
  drawAtZero: 0.35,       // extra power/CPU draw at zero condition, as a fraction

  // Per-channel rates, all per event rather than per second unless stated.
  //
  // These are the second set. The first was written by feel and measured afterwards, and it
  // was wrong by roughly an order of magnitude in every channel: 24 seconds of continuous
  // fire to reach the warning threshold, 2.2 minutes of mining, 2.7 minutes of cruise. That
  // is not wear, it is a chore on a two-minute timer — and it fails the test this whole
  // block is written against, because a bill that arrives every few minutes is rent whether
  // or not the clock driving it is called an event.
  //
  // Calibrated instead against a *session*: roughly half an hour of doing the thing before
  // the fitting screen says anything, and about an hour before it is worth a detour. The
  // figures below are what a measurement script reports, not what they look like.
  perShot: 0.00025,       // per round out of a barrel, on that hardpoint only
  perHullHit: 0.0012,     // per hit that reaches structure, spread across core and utility
  perArmorHit: 0.00035,   // armour absorbs; it is gentler on the ship's systems
  perWarpSecond: 0.00015, // core subsystems, while actually cruising
  // Mining is gentler per second than anything else here, because it is the only channel a
  // pilot runs *continuously* — a fight is seconds of trigger inside minutes of manoeuvre,
  // and a cruise ends when you arrive, but a belt session is an unbroken half hour of beam.
  // At the same rate as the others it was warning after two hold-fills.
  perMineSecond: 0.00009, // utility, while the beam is on a rock

  // Heat multiplies everything. Running a rack at the cutout is how a gun gets destroyed in
  // every navy that has ever had one, and it gives the thermal budget a second consequence
  // beyond the tempo one v1.00.60 built.
  heatMult: 1.9,          // at full heat; scales linearly from 1 at cold
  // An engineer on watch slows it. This is the crew tie-in that makes the speciality worth
  // posting outside a fight.
  engineerRelief: 0.35,   // fraction of wear an on-watch engineer prevents

  // Servicing, at a station. Priced against the module's own value so a cheap module is
  // cheap to keep and a capital-grade core is a commitment.
  serviceFraction: 0.22,  // of list price, to take a module from 0 to 1
  serviceMin: 45,         // nobody opens a panel for less
  // Below this the fitting screen says so and preflight mentions it once. Above it, wear is
  // real and invisible, which is correct: a 3% loss is not news.
  warnAt: 0.72,
  badAt: 0.40
};
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
