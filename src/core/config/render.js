// Living Galaxy — tuning: display, adaptive quality, interpolation, level of detail, lights, audio, particles.
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

// ── acquisition range ────────────────────────────────────────────────
// How far away a thing is drawn *at all*, in world units, regardless of how many pixels it
// covers. Zero means no limit.
//
// This exists because screen size turned out to be the wrong question for built objects. A
// habitat ring is 96 units across; at 1,900 units out it still covers about five percent of
// the screen, so the LOD culler kept it — correctly, by its own rule — and the player could
// sit at the edge of a system watching a station rotate. Nothing was miscomputed. The rule
// was simply answering "is it big enough to see" when the interesting question was "should
// it be resolvable from here".
//
// Planets are deliberately absent from this table. A gas giant IS visible across a system,
// and capping it would be a lie in the other direction — the LOD culler already handles the
// distant ones by size, which for a natural body is the honest measure.
//
// These are visual only. Contacts, the scanner, the target list and the nav chart all keep
// reporting a station at any distance; hiding the mesh does not hide the object.
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
  dopplerMax: 0.35,       // never shift more than this, or a pass sounds like a cartoon

  // The drive. There has been an `engine` bus in the table above since the mix was written
  // and nothing was ever connected to it — what everyone heard as "constant engine hum" was
  // the music bed's root note. These are the numbers the real one runs on.
  //
  // The band is deliberately narrow and low. A drive that sweeps an octave sounds like a
  // car, and the frequencies that survive a phone speaker at all are the ones with a
  // harmonic above them — which is why there is a harmonic layer rather than a louder
  // fundamental.
  engine: {
    idleHz: 44,           // barely-there idle: a powered hull is never silent
    fullHz: 68,           // about a fifth above idle at full throttle
    airMinHz: 260,        // lowpass on the noise layer at idle...
    airMaxHz: 1350,       // ...and wide open under power
    idleGain: 0.22        // how much of the layer is audible with the lever closed
  }
};

// ── particles ────────────────────────────────────────────────────────
// One pool for the whole game (`world/particles.js`), and one place to tune it.
//
// `capacity` is the allocation, made once at boot and never grown. The *live* ceiling is this
// times `effectScale()`, so Minimum quality runs a quarter of the particles without a second
// buffer and without a reallocation mid-fight. 2,400 × 8 floats × 4 bytes is ~77 KB of typed
// array — cheap enough that sizing it for the worst case is the right call, and the worst case
// is a two-hostile fight over a rock the player is cutting.
export const PARTICLES = {
  capacity: 2400,
  drag: 1.8,              // default exponential velocity decay, per second

  impactMin: 5,           // sparks on the smallest hit...
  impactMax: 26,          // ...and the ceiling, so a big hit is legible without being a wall
  impactPerDamage: 0.35,
  impactSpeed: 46,

  debrisMin: 2,           // a poor seam
  debrisMax: 9,           // a rich one — the count *is* the assay readout
  debrisSpeed: 22,

  bloomCount: 26,
  bloomSpeed: 40,

  plumeRate: 3,           // particles per frame at full throttle
  plumeSpeed: 30,

  warpCount: 22,
  warpSpeed: 60
};

// ── the held point layer ─────────────────────────────────────────────
// Static geometry drawn as points: gravity-well shells, and belts too far away to be worth
// their meshes. Separate allocation from `PARTICLES.capacity` on purpose — a well shell that
// held slots in the transient pool would mean a firefight beside a gas giant had no sparks
// left in it, which is the budget spent on exactly the wrong thing.
export const FIELD = { capacity: 6000 };

// ── gravity wells, drawn ─────────────────────────────────────────────
// Real since v1.02.34 and invisible until v1.02.42. Every number here is presentation; the
// radius itself comes from `wellRadius()` in systems/warp.js, which is the function the course
// planner reads. Two sources for that would be a picture that lies about where the obstacles
// are, which is worse than no picture.
export const WELLS = {
  show: true,
  refresh: 1.5,           // seconds between shell rebuilds as bodies orbit
  minRadius: 260,         // below this a shell is a smudge on the hull — skip it
  refRadius: 1800,        // the radius `basePoints` is calibrated against
  strongRadius: 9000,     // a well this big is "hot" — the top of the colour ramp
  basePoints: 190,
  minPoints: 90,
  maxPoints: 900,
  pointSize: 3.4,
  alpha: 0.30,
  // Cold cyan for a well you cross under power, warm amber for one that will hold you.
  // Deliberately outside the six reserved particle hues — a well is not a damage type and
  // must not be mistaken for one.
  cool: [0.34, 0.72, 0.86],
  hot:  [0.95, 0.62, 0.30]
};

// ── the LOD point tier ───────────────────────────────────────────────
// Below the cheapest mesh. A belt beyond this range is one additive band instead of four
// hundred low-poly rocks, and it reads as a *more* continuous ring than the meshes do —
// individual rocks cull one at a time, so a belt used to thin out to nothing at distance.
export const BANDS = {
  show: true,
  enterAt: 5200,          // metres from the belt's mid-radius at which meshes give way
  hysteresis: 900,        // and the extra distance before they come back — no flicker
  points: 420,
  pointSize: 2.6,
  alpha: 0.42,
  color: [0.62, 0.56, 0.45]
};

// ── the clutter tier ─────────────────────────────────────────────────
//
// The tier *above* the meshes, and the one the belt was missing.
//
// A belt in this game is honest about scale: the main field is a band ~2,600 units wide
// running 66,000 units around the star, holding a few hundred mineable rocks. Divide the
// one by the other and the rocks sit roughly 700 units apart — which is what a real belt
// is like, and which means flying into one shows you black sky and, if you are lucky, a
// six-pixel lump.
//
// The instinct is to add mineable rocks until it looks busy. That is the wrong lever: it
// inflates the ore economy, it multiplies the instance count that every miner, the cutter
// and the broadphase walk, and it changes what a save has to store. A belt does not look
// full because it is full of *ore* — it looks full because there is gravel everywhere.
//
// So: gravel. A few hundred sub-metre chips that live in a shell around the ship, drawn
// only inside a field, recycled from behind to in front as you move. They carry no ore, no
// record and no index; they are scenery, and nothing in the simulation can see them.
export const CLUTTER = {
  show: true,
  count: 340,             // instances, one draw call
  inner: 90,              // no closer than this — chips through the canopy read as damage
  outer: 1400,            // recycled once past this
  size: [0.35, 2.6],
  // How far into a field's own band the ship has to be before there is gravel around it.
  // A shade wider than the band itself so the transition happens before you can see it.
  bandPad: 260,
  color: [0.55, 0.50, 0.42],
  // Chips are lit by the same star as everything else, and past the frost line that is
  // very little light. A floor keeps an outer field from being a shell of black dots.
  emissive: 0.055
};
