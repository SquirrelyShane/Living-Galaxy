// Living Galaxy — tuning: how a ship moves, and how warp feels.
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

  // ── how close a jump puts you (v1.02.62) ─────────────────────────
  //
  // `arriveRadius` is the *floor* the geometry insists on. What the pilot actually asked
  // for is a separate thing, and until now there was no way to ask: every jump dropped at
  // 240 km whatever it was aimed at, which on a station meant a two-hundred-and-forty
  // kilometre sublight crawl at the end of every single hop. That crawl is the thing that
  // reads as "she is just approaching, not warping".
  //
  // `closeArrive` is what WARP TO now means: a few kilometres off the hull, close enough
  // that the run-in is seconds rather than minutes. `standoffMin`/`standoffMax` are the
  // ends of the WARP WITHIN slider, in units — 150 km to 1 Mm — for when arriving on top
  // of something is exactly what you do not want.
  //
  // A body's own well still wins over all of it. You cannot ask to arrive six kilometres
  // from a star.
  closeArrive: 6,
  standoffMin: 150,
  standoffMax: 1000,
  standoffDefault: 150,

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
