// Living Galaxy — the simulation clock.
//
// Before 0.2 the frame loop fed raw dt straight into every system, clamped at 50 ms.
// That makes the simulation frame-rate dependent: a 120 Hz device integrates flight
// twice as finely as a 30 Hz one, swept collision resolves at different granularity,
// and a hitch large enough to clamp silently loses time. Now real time accumulates and
// the sim runs in fixed slices; rendering still happens once per frame.
//
// `alpha` is the leftover fraction of a step. Nothing interpolates on it yet — that is
// a render-slice job (v0.8) — but it is computed here so the hook exists.

import { CLOCK as C } from './config.js';

const samples = new Float32Array(C.perfSamples);
let sIdx = 0, sCount = 0;

let primed = false;

export const clock = {
  last: 0,        // previous frame timestamp, seconds
  accum: 0,       // unsimulated real time, seconds
  alpha: 0,       // accum / step at the end of the last advance
  dt: 0,          // clamped real frame time
  raw: 0,         // unclamped real frame time
  stepDt: C.step,
  frames: 0,
  steps: 0,
  stalls: 0,      // frames where catch-up was abandoned
  fps: 0
};

/**
 * Fold a rAF timestamp into the clock.
 * @returns {number} how many fixed steps to run this frame (0 is normal at high fps).
 */
export function advance(nowMs) {
  const t = nowMs * 0.001;
  const raw = primed ? t - clock.last : C.step;   // a timestamp of 0 is still a timestamp
  primed = true;
  clock.last = t;
  clock.raw = raw;
  clock.frames++;

  const dt = raw < 0 ? 0 : Math.min(raw, C.maxFrame);
  clock.dt = dt;
  clock.fps = raw > 0 ? clock.fps * 0.9 + (1 / raw) * 0.1 : clock.fps;

  if (!C.fixedStep) {           // legacy path — one variable step, as 0.1 behaved
    clock.stepDt = dt;
    clock.steps++;
    return 1;
  }

  clock.stepDt = C.step;
  clock.accum += dt;
  let n = 0;
  while (clock.accum >= C.step && n < C.maxSteps) { clock.accum -= C.step; n++; }
  if (clock.accum >= C.step) { clock.accum = 0; clock.stalls++; }   // drop the backlog
  clock.alpha = clock.accum / C.step;
  clock.steps += n;
  return n;
}

/** Record a completed frame's wall cost in ms. */
export function sample(ms) {
  samples[sIdx] = ms;
  sIdx = (sIdx + 1) % samples.length;
  if (sCount < samples.length) sCount++;
}

/** Rolling frame-time picture: avg / p95 / worst in ms, plus smoothed fps. */
export function perfStats() {
  if (!sCount) return { fps: Math.round(clock.fps), avg: 0, p95: 0, worst: 0, samples: 0 };
  const a = Array.prototype.slice.call(samples, 0, sCount).sort((x, y) => x - y);
  const mean = a.reduce((s, v) => s + v, 0) / a.length;
  return {
    fps: Math.round(clock.fps),
    avg: +mean.toFixed(2),
    p95: +a[Math.min(a.length - 1, Math.floor(a.length * 0.95))].toFixed(2),
    worst: +a[a.length - 1].toFixed(2),
    samples: a.length,
    steps: clock.steps,
    stalls: clock.stalls
  };
}

/** Monotonic milliseconds, whatever the host provides. */
export const nowMs = () =>
  (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

export function resetClock() {
  primed = false;
  clock.last = 0; clock.accum = 0; clock.alpha = 0;
  clock.frames = 0; clock.steps = 0; clock.stalls = 0; clock.fps = 0;
  sIdx = 0; sCount = 0;
}
