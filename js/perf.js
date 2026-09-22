/* LIVING GALAXY — the frame budget.
 *
 * The sky got busier: hulls that really cross open space instead of
 * teleporting through a lane, security that answers a distress call, rogue
 * drones that come in waves. All of that is work per frame, and the device
 * this is played on is a phone under Termux, not a desk.
 *
 * So nothing here is a fixed number. The budget measures what a frame
 * actually costs and hands out a TIER; every busy system asks the tier how
 * much it may do this frame and trims the far field first. The player's
 * immediate surroundings are never what gets cut — a hull inside sensor
 * range is stepped in full at every tier, because that is the one the
 * player is looking at and shooting at.
 *
 *   tier 3  rich     everything, full far-field cadence
 *   tier 2  normal   far field on a slower cadence
 *   tier 1  lean     far field coarse, waves smaller
 *   tier 0  survival — near field only, far field on a crawl
 *
 * The measurement is a long median, not an average: one 400 ms hitch while
 * the browser builds a station mesh must not drop the whole sky a tier, and
 * a median over 90 frames rides straight over it. Coming back UP is slower
 * than going down (a tier must hold for RECOVER_S before it is handed back),
 * so the sky does not oscillate between two tiers on a marginal device.
 */

export const TIERS = 4;

const WINDOW = 90;            // frames in the median window (~1.5 s at 60fps)
const DROP_MS = [0, 15.5, 19.5, 26.0];  // median frame cost that forces a drop TO index-1
const RECOVER_S = 6;          // a better median must hold this long before the tier is handed back
const SETTLE_S = 2.5;         // grace after a sky change before any of this bites

export const perf = {
  tier: 3,
  ms: 0,                      // the current median frame cost
  worst: 0,                   // worst frame in the window
  fps: 60,
  frames: 0,
  since: 0,                   // seconds the measurement has wanted a different tier
  settle: SETTLE_S,
  locked: null,               // set a number to pin the tier (the console's override)
  /* what the tier bought, for the console readout */
  budget: { farStride: 1, farHulls: 9999, waveMax: 12, tracerK: 1 },
};

const ring = new Float32Array(WINDOW);
let ringN = 0;
let ringAt = 0;
const sorted = new Float32Array(WINDOW);

/** Call once per sky change: give the device a moment before judging it. */
export function resetPerf() {
  ringN = 0;
  ringAt = 0;
  perf.frames = 0;
  perf.since = 0;
  perf.settle = SETTLE_S;
  perf.tier = perf.locked ?? 3;
  applyTier();
}

function median() {
  if (ringN === 0) return 0;
  sorted.set(ring.subarray(0, ringN));
  const view = sorted.subarray(0, ringN);
  view.sort();
  return view[ringN >> 1];
}

function applyTier() {
  const t = perf.tier;
  /* farStride: a far-field hull is fully stepped one frame in N, and coasts
   * on its own velocity the rest. tracerK scales cosmetic rounds. */
  perf.budget.farStride = t >= 3 ? 1 : t === 2 ? 2 : t === 1 ? 4 : 8;
  perf.budget.farHulls = t >= 3 ? 9999 : t === 2 ? 140 : t === 1 ? 90 : 55;
  perf.budget.waveMax = t >= 3 ? 12 : t === 2 ? 9 : t === 1 ? 6 : 3;
  perf.budget.tracerK = t >= 3 ? 1 : t === 2 ? 0.8 : t === 1 ? 0.5 : 0.25;
}

/**
 * One frame's wall cost in milliseconds. Call from the render loop with the
 * real elapsed time, before the sim tick — `dt * 1000` is exactly right.
 */
export function notePerf(ms, dt) {
  if (!(ms > 0) || !Number.isFinite(ms)) return perf.tier;
  /* a paused tab hands back a two-second frame; that is not the GPU's fault */
  if (ms > 250) return perf.tier;
  ring[ringAt] = ms;
  ringAt = (ringAt + 1) % WINDOW;
  if (ringN < WINDOW) ringN++;
  perf.frames++;

  if (perf.settle > 0) { perf.settle -= dt; return perf.tier; }
  if (ringN < 20) return perf.tier;

  perf.ms = median();
  perf.fps = perf.ms > 0 ? 1000 / perf.ms : 60;
  if (perf.locked != null) { perf.tier = perf.locked; applyTier(); return perf.tier; }

  /* down is immediate — a device that is already stuttering should not be
   * asked to stutter for another six seconds to prove it */
  const floorFor = (tier) => DROP_MS[tier] ?? 0;
  if (perf.tier > 0 && perf.ms > floorFor(perf.tier)) {
    perf.tier--;
    perf.since = 0;
    applyTier();
    return perf.tier;
  }
  /* up is earned: the next tier's own budget must be comfortably met */
  if (perf.tier < 3 && perf.ms < floorFor(perf.tier + 1) * 0.8) {
    perf.since += dt;
    if (perf.since > RECOVER_S) {
      perf.tier++;
      perf.since = 0;
      applyTier();
    }
  } else perf.since = 0;
  return perf.tier;
}

/**
 * How many hulls the far field may fully step this frame, and the stride to
 * walk them with. `n` is the far-field population.
 */
export function farBudget(n) {
  const b = perf.budget;
  const cap = Math.min(n, b.farHulls);
  return { stride: b.farStride, cap };
}

/** Rogue waves and response wings scale with the budget. */
export function waveCap(want) {
  return Math.max(2, Math.min(want, perf.budget.waveMax));
}

/** Cosmetic-tracer gate: NPC theatre thins out before anything that matters does. */
export function tracerGate() {
  return perf.budget.tracerK;
}

/** The console's PERF row. */
export function perfReport() {
  return {
    tier: perf.tier,
    label: ["SURVIVAL", "LEAN", "NORMAL", "RICH"][perf.tier] ?? "?",
    ms: Math.round(perf.ms * 10) / 10,
    fps: Math.round(perf.fps),
    locked: perf.locked != null,
    ...perf.budget,
  };
}

/** Pin or release the tier (the console override). `null` returns to adaptive. */
export function lockPerfTier(t) {
  perf.locked = t == null ? null : Math.max(0, Math.min(3, Math.round(t)));
  if (perf.locked != null) { perf.tier = perf.locked; applyTier(); }
  return perf.locked;
}

applyTier();
