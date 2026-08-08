// Living Galaxy — the two pieces of networking that are pure maths.
//
// Kept out of net.js deliberately: everything here is a function of numbers in and
// numbers out, with no socket, no scene and no game state, which means it can be tested
// exhaustively without standing a server up. The parts that genuinely need a socket stay
// in net.js and are a good deal smaller for it.
//
// Two problems solved here.
//
// **Clocks disagree.** Two phones on the same relay have wall clocks that differ by
// seconds and drift at different rates. Anything timestamped by the sender is therefore
// meaningless to the receiver until it is translated, and "when did this happen" is the
// question every remaining networking feature depends on.
//
// **Packets arrive unevenly.** At 8 Hz with jitter, snapshots land in clumps and
// occasionally out of order. v0.9 smoothed this with an exponential damp toward the last
// known position, which has two bad properties: it never actually arrives, and it treats
// a packet that is 30 ms late identically to one that is 300 ms late. A buffer that
// renders slightly in the past instead has neither.

import { NET } from '../core/config.js';

// ── clock synchronisation ────────────────────────────────────────────

/**
 * Fold one ping round-trip into a clock estimate.
 *
 * The selection rule is the important part: **keep the sample with the lowest round
 * trip**, not the average of all of them. A packet that took a long time took it
 * asymmetrically — queued in one direction and not the other — so its offset estimate is
 * skewed by an unknown amount. The fastest round trip in a batch is the one least likely
 * to have been delayed unevenly, so it is the only one worth believing. Averaging noise
 * that is biased does not cancel the bias.
 */
export function makeClockSync() {
  return { offset: 0, rtt: 0, bestRtt: Infinity, samples: 0, synced: false, drift: 0 };
}

export function addSample(sync, sentAt, serverTime, receivedAt) {
  const rtt = receivedAt - sentAt;
  if (!(rtt >= 0) || rtt > NET.maxRtt) return sync;      // absurd sample, discard

  sync.samples++;
  sync.rtt = sync.rtt ? sync.rtt * 0.8 + rtt * 0.2 : rtt;

  // Assume symmetry only for the fastest sample, where it is least wrong.
  if (rtt <= sync.bestRtt) {
    const estimate = serverTime + rtt / 2 - receivedAt;
    if (sync.synced) sync.drift = estimate - sync.offset;
    sync.bestRtt = rtt;
    sync.offset = estimate;
    sync.synced = true;
  } else {
    // Let the best sample decay slowly, so a single lucky packet early in the session
    // does not pin the estimate for an hour while the network changes underneath it.
    sync.bestRtt = Math.min(NET.maxRtt, sync.bestRtt * NET.rttDecay);
  }
  return sync;
}

/** Local time → the server's clock. */
export const toServerTime = (sync, local) => local + (sync ? sync.offset : 0);

/** The server's clock → local time. */
export const toLocalTime = (sync, server) => server - (sync ? sync.offset : 0);

// ── snapshot buffer ──────────────────────────────────────────────────

/**
 * A ring of timestamped states for one remote entity, rendered `NET.interpDelay` behind
 * the estimated server clock.
 *
 * Rendering in the past is what makes this smooth. Rendering at "now" means the newest
 * packet is always the target and every gap between packets is a guess; rendering 120 ms
 * behind means the two snapshots being blended have *both already arrived*, so the motion
 * between them is known rather than predicted. The cost is 120 ms of latency on other
 * players' positions, which is invisible, and the benefit is that nothing ever snaps.
 */
export function makeBuffer() {
  return { frames: [], last: null, extrapolated: 0, dropped: 0, gaps: 0 };
}

/**
 * Add a snapshot. Out-of-order arrivals are inserted in the right place rather than
 * appended — UDP-style reordering is rare over a TCP WebSocket but a delayed relay can
 * still deliver a burst out of sequence, and an unsorted buffer produces a visible
 * stutter that is very hard to attribute later.
 */
export function pushFrame(buf, time, state) {
  const f = { time, state };

  if (!buf.frames.length || time >= buf.frames[buf.frames.length - 1].time) {
    buf.frames.push(f);
  } else {
    let i = buf.frames.length - 1;
    while (i >= 0 && buf.frames[i].time > time) i--;
    if (i >= 0 && buf.frames[i].time === time) { buf.dropped++; return buf; }  // duplicate
    buf.frames.splice(i + 1, 0, f);
  }

  while (buf.frames.length > NET.bufferFrames) { buf.frames.shift(); buf.dropped++; }
  buf.last = f;
  return buf;
}

/**
 * The state to draw at `renderTime` (already in server-clock terms).
 *
 * @returns {{a:object, b:object, t:number, mode:string}|null}
 *   `a`/`b` are the two states to blend and `t` is the blend factor.
 */
export function sampleAt(buf, renderTime) {
  const f = buf.frames;
  if (!f.length) return null;
  if (f.length === 1) return { a: f[0].state, b: f[0].state, t: 0, mode: 'single' };

  for (let i = f.length - 1; i > 0; i--) {
    if (f[i - 1].time <= renderTime && renderTime <= f[i].time) {
      const span = f[i].time - f[i - 1].time;
      const t = span > 1e-6 ? (renderTime - f[i - 1].time) / span : 0;
      return { a: f[i - 1].state, b: f[i].state, t, mode: 'interp' };
    }
  }

  // Behind everything we hold: the buffer has not filled yet, or the render clock ran
  // backwards. Show the oldest thing we have rather than guessing.
  if (renderTime < f[0].time) return { a: f[0].state, b: f[0].state, t: 0, mode: 'behind' };

  // Ahead of everything we hold: packets have stopped arriving. Extrapolate briefly from
  // the last two, then give up and hold position. Extrapolating indefinitely sends a
  // disconnected pilot flying off in a straight line forever, which looks far worse — and
  // is far more confusing in a fight — than a ship that simply stops.
  const last = f[f.length - 1], prev = f[f.length - 2];
  const over = renderTime - last.time;
  if (over > NET.maxExtrapolate) {
    buf.gaps++;
    return { a: last.state, b: last.state, t: 0, mode: 'stale' };
  }
  const span = last.time - prev.time;
  if (span <= 1e-6) return { a: last.state, b: last.state, t: 0, mode: 'stale' };
  buf.extrapolated++;
  return { a: prev.state, b: last.state, t: 1 + over / span, mode: 'extrapolate' };
}

export const bufferDepth = buf => buf.frames.length;
export const bufferSpan = buf =>
  buf.frames.length > 1 ? buf.frames[buf.frames.length - 1].time - buf.frames[0].time : 0;

// ── delta encoding ───────────────────────────────────────────────────
// A state packet was the full record every time: position, yaw, pitch and hull class at
// 8 Hz, whether or not any of it had changed. Hull class changes perhaps twice an hour.
// Sending only what moved cuts a typical packet by roughly half, and matters most on the
// mobile connections this game is actually played over.

/** Fields worth diffing, with the precision each is rounded to before comparison. */
export const FIELDS = {
  p: { round: 1, vector: true },
  yaw: { round: 3 },
  pitch: { round: 3 },
  cls: { exact: true },
  hull: { round: 0 }
};

const q = (v, places) => {
  const m = Math.pow(10, places);
  return Math.round(v * m) / m;
};

/**
 * Build a packet containing only fields that differ from `prev`. Returns null when
 * nothing has changed at all — the caller should send nothing rather than an empty
 * packet, because an empty packet still costs a frame header and a wakeup.
 */
export function encodeDelta(state, prev) {
  const out = {};
  let changed = false;

  for (const key in FIELDS) {
    const spec = FIELDS[key];
    const value = state[key];
    if (value === undefined) continue;

    if (spec.vector) {
      const rounded = value.map(v => q(v, spec.round));
      const before = prev && prev[key];
      if (!before || rounded.some((v, i) => v !== before[i])) { out[key] = rounded; changed = true; }
      continue;
    }
    const rounded = spec.exact ? value : q(value, spec.round);
    if (!prev || prev[key] !== rounded) { out[key] = rounded; changed = true; }
  }

  return changed ? out : null;
}

/**
 * Apply a delta onto the last known full state. Absent fields keep their previous value,
 * which is the whole point — and is also why the *first* packet after a join has to be a
 * full one, since there is nothing to keep.
 */
export function applyDelta(base, delta) {
  const out = Object.assign({}, base || {});
  for (const key in delta) {
    if (key === 't' || key === 'id' || key === 'seq') continue;
    out[key] = delta[key];
  }
  return out;
}

/** A full snapshot, for a join or a resume. */
export function encodeFull(state) {
  const out = {};
  for (const key in FIELDS) {
    if (state[key] === undefined) continue;
    const spec = FIELDS[key];
    out[key] = spec.vector ? state[key].map(v => q(v, spec.round))
             : spec.exact ? state[key] : q(state[key], spec.round);
  }
  return out;
}
