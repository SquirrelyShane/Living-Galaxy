// Living Galaxy — tuning: the constants everything reads: units, the world seed, the network handshake.
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
 * Every orbit in data/planetary/planets.js, data/stations.js and data/belts.js is a *nominal* radius;
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
