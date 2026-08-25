// Living Galaxy — tuning: the simulation clock and the diagnostics buffer.
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
