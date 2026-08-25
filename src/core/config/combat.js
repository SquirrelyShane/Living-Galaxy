// Living Galaxy — tuning: weapons, damage, point defence, seekers, locking, ordnance and detection.
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

// ── weapons ──────────────────────────────────────────────────────────
export const WEAPONS = {
  pulse:   {name:'Pulse Laser',  damage:10, speed:760,  life:1.20, cooldown:0.19, energy:3.0, color:0x66ddff},
  gauss:   {name:'Gauss Driver', damage:24, speed:1100, life:1.00, cooldown:0.62, energy:7.5, color:0xffd070},
  scatter: {name:'Scatter Beam', damage:6,  speed:620,  life:0.95, cooldown:0.11, energy:1.9, color:0xaaffcc}
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
