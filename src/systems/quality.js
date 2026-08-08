// Living Galaxy — adaptive render quality.
//
// Slice 1 built a frame-time ring buffer and nothing has ever read it. This does. The
// renderer was configured once at boot for a device it knew nothing about: pixel ratio
// capped at 2, antialiasing always on, every effect always drawn. A flagship phone
// wasted headroom it had; a three-year-old one hitched and there was no way out of it
// except closing the game.
//
// The controller watches **p95 frame time, not average**. On a phone the average is
// almost always fine — it is the 95th percentile that the player actually feels as a
// stutter, and a controller tuned on the mean will happily sit at a quality level that
// stutters twice a second while reporting that everything is well.
//
// Three rules keep it from becoming its own problem:
//
//   1. It drops fast and climbs slowly. A pilot in a firefight needs the frame back now;
//      nobody has ever needed slightly sharper shadows urgently.
//   2. It waits after every change. Changing quality *costs* a frame — resizing a render
//      target is not free — so reacting to the frame you just disturbed is a feedback
//      loop that oscillates forever.
//   3. It has hysteresis. The threshold to climb is well clear of the threshold to drop,
//      so a device sitting exactly on a boundary settles rather than flapping between
//      two levels for the whole session.

import { S } from '../core/state.js';
import { QUALITY } from '../core/config.js';
import { perfStats } from '../core/clock.js';
import { renderer, applyQuality as applyToRenderer } from '../world/scene.js';

/** Levels, worst to best. Index into this is the quality number everything else uses. */
export const LEVELS = [
  { name: 'Minimum',  pixelRatio: 0.65, antialias: false, effects: 0.25, starfield: 0.35, lodBias: 0.55 },
  { name: 'Low',      pixelRatio: 0.85, antialias: false, effects: 0.50, starfield: 0.55, lodBias: 0.75 },
  { name: 'Medium',   pixelRatio: 1.00, antialias: false, effects: 0.75, starfield: 0.80, lodBias: 1.00 },
  { name: 'High',     pixelRatio: 1.50, antialias: true,  effects: 1.00, starfield: 1.00, lodBias: 1.25 },
  { name: 'Ultra',    pixelRatio: 2.00, antialias: true,  effects: 1.00, starfield: 1.00, lodBias: 1.60 }
];

const state = {
  level: 3,
  auto: true,
  cooldown: 0,
  drops: 0,
  climbs: 0,
  lastReason: 'boot'
};

export const quality = () => LEVELS[state.level];
export const qualityLevel = () => state.level;
export const qualityState = () => Object.assign({}, state, { name: LEVELS[state.level].name });

/** Effect budget, 0..1. Particle systems multiply their counts by this. */
export const effectScale = () => LEVELS[state.level].effects;
export const starfieldScale = () => LEVELS[state.level].starfield;
export const lodBias = () => LEVELS[state.level].lodBias;

/**
 * Pick a sensible starting level before a single frame has been measured. Guessing from
 * the device beats starting at Ultra and hitching for two seconds while the controller
 * works out that this is a phone.
 */
export function initQuality() {
  const dpr = (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1);
  const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
  const touch = typeof navigator !== 'undefined' &&
    (navigator.maxTouchPoints > 0 || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || ''));

  let guess = 3;
  if (touch) guess = cores >= 8 ? 2 : 1;
  else if (cores <= 2) guess = 1;
  else if (cores >= 8 && dpr >= 2) guess = 4;

  if (S.settings.quality && S.settings.quality.level != null && S.settings.quality.auto === false) {
    state.auto = false;
    state.level = clampLevel(S.settings.quality.level);
  } else {
    state.auto = !S.settings.quality || S.settings.quality.auto !== false;
    state.level = clampLevel(guess);
  }
  state.cooldown = QUALITY.settle;
  state.lastReason = 'device profile';
  apply();
  return state;
}

const clampLevel = n => Math.max(0, Math.min(LEVELS.length - 1, n | 0));

function apply() {
  const q = LEVELS[state.level];
  applyToRenderer(q);
  if (!S.settings.quality) S.settings.quality = {};
  S.settings.quality.level = state.level;
  S.settings.quality.auto = state.auto;
}

export function setQualityLevel(n) {
  const next = clampLevel(n);
  if (next === state.level) return state.level;
  state.level = next;
  state.cooldown = QUALITY.settle;
  state.lastReason = 'manual';
  apply();
  return state.level;
}

export function setAuto(on) {
  state.auto = !!on;
  if (!S.settings.quality) S.settings.quality = {};
  S.settings.quality.auto = state.auto;
  state.cooldown = QUALITY.settle;
  return state.auto;
}

/**
 * Called once per rendered frame. Cheap: reads the ring buffer the clock is already
 * filling and does arithmetic on three numbers.
 */
export function updateQuality(dt) {
  if (!state.auto) return state.level;

  state.cooldown -= dt;
  if (state.cooldown > 0) return state.level;

  const perf = perfStats();
  if (perf.samples < QUALITY.minSamples) return state.level;

  // A frame the simulation had to abandon catch-up on is a stall, and no amount of
  // render quality caused it — reacting to one would drop quality for a reason quality
  // cannot fix. Treated as a signal to wait rather than as evidence.
  if (perf.stalls > state.stalls) {
    state.stalls = perf.stalls;
    state.cooldown = QUALITY.settle;
    return state.level;
  }
  state.stalls = perf.stalls;

  if (perf.p95 > QUALITY.dropAbove && state.level > 0) {
    // Fall by two levels at once when the frame is very bad. Stepping down one at a time
    // from Ultra on a device that needs Minimum means several seconds of unplayable
    // frames while the controller politely works its way down.
    const step = perf.p95 > QUALITY.panicAbove ? 2 : 1;
    state.level = clampLevel(state.level - step);
    state.drops++;
    state.cooldown = QUALITY.settle;
    state.lastReason = `p95 ${perf.p95}ms`;
    apply();
    return state.level;
  }

  if (perf.p95 < QUALITY.raiseBelow && state.level < LEVELS.length - 1) {
    state.level = clampLevel(state.level + 1);
    state.climbs++;
    // A long wait after climbing, deliberately: the cost of a wrong climb is a visible
    // stutter, and the cost of climbing late is a slightly softer image nobody notices.
    state.cooldown = QUALITY.climbSettle;
    state.lastReason = `p95 ${perf.p95}ms`;
    apply();
    return state.level;
  }

  return state.level;
}

export function resetQuality() {
  state.level = 3; state.auto = true; state.cooldown = 0;
  state.drops = 0; state.climbs = 0; state.stalls = 0;
  state.lastReason = 'reset';
}
