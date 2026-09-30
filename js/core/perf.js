export const TIERS = 4;

const WINDOW = 90;
const DROP_MS = [0, 15.5, 19.5, 26.0];
const RECOVER_S = 6;
const SETTLE_S = 2.5;

export const perf = {
  tier: 3,
  ms: 0,
  worst: 0,
  fps: 60,
  frames: 0,
  since: 0,
  settle: SETTLE_S,
  locked: null,
  budget: { farStride: 1, farHulls: 9999, waveMax: 12, tracerK: 1 },
};

const ring = new Float32Array(WINDOW);
let ringN = 0;
let ringAt = 0;
const sorted = new Float32Array(WINDOW);

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
  perf.budget.farStride = t >= 3 ? 1 : t === 2 ? 2 : t === 1 ? 4 : 8;
  perf.budget.farHulls = t >= 3 ? 9999 : t === 2 ? 140 : t === 1 ? 90 : 55;
  perf.budget.waveMax = t >= 3 ? 12 : t === 2 ? 9 : t === 1 ? 6 : 3;
  perf.budget.tracerK = t >= 3 ? 1 : t === 2 ? 0.8 : t === 1 ? 0.5 : 0.25;
}

export function notePerf(ms, dt) {
  if (!(ms > 0) || !Number.isFinite(ms)) return perf.tier;
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

  const floorFor = (tier) => DROP_MS[tier] ?? 0;
  if (perf.tier > 0 && perf.ms > floorFor(perf.tier)) {
    perf.tier--;
    perf.since = 0;
    applyTier();
    return perf.tier;
  }
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

export function farBudget(n) {
  const b = perf.budget;
  const cap = Math.min(n, b.farHulls);
  return { stride: b.farStride, cap };
}

export function waveCap(want) {
  return Math.max(2, Math.min(want, perf.budget.waveMax));
}

export function tracerGate() {
  return perf.budget.tracerK;
}

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

export function lockPerfTier(t) {
  perf.locked = t == null ? null : Math.max(0, Math.min(3, Math.round(t)));
  if (perf.locked != null) { perf.tier = perf.locked; applyTier(); }
  return perf.locked;
}

applyTier();
