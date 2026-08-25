// Slice 8 — the networking maths, tested without a socket. Clock synchronisation,
// the snapshot buffer, and delta encoding.
import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { NET } = await imp('core/config.js');
const ns = await imp('systems/platform/netsync.js');

// ── clock sync ───────────────────────────────────────────────────────
console.log('\n— clock synchronisation —');
{
  const sync = ns.makeClockSync();
  ok('a fresh sync is unsynced', sync.synced === false && sync.offset === 0);
  ok('an unsynced clock is the identity', ns.toServerTime(sync, 100) === 100);

  // Server clock runs 50 s ahead of ours. A 100 ms round trip, symmetric.
  ns.addSample(sync, 10.0, 60.05, 10.1);
  ok('one clean sample syncs', sync.synced === true);
  ok('the offset is recovered', Math.abs(sync.offset - 50) < 0.01, sync.offset.toFixed(4));
  ok('local converts to server time', Math.abs(ns.toServerTime(sync, 20) - 70) < 0.01);
  ok('server converts back to local', Math.abs(ns.toLocalTime(sync, 70) - 20) < 0.01);
}
{
  // The selection rule is the whole design: keep the *fastest* round trip, not the mean.
  // A slow packet was delayed asymmetrically by an unknown amount, so its offset estimate
  // is biased — and averaging biased noise does not cancel the bias.
  const sync = ns.makeClockSync();
  ns.addSample(sync, 0, 50.0, 1.0);          // 1000 ms round trip, badly skewed
  const skewed = sync.offset;
  ns.addSample(sync, 10, 60.005, 10.01);     // 10 ms round trip, near-perfect
  ok('a fast sample displaces a slow one', Math.abs(sync.offset - 50) < Math.abs(skewed - 50),
     `${skewed.toFixed(3)} → ${sync.offset.toFixed(3)}`);
  ok('the fast sample is essentially exact', Math.abs(sync.offset - 50) < 0.01,
     sync.offset.toFixed(4));

  const before = sync.offset;
  ns.addSample(sync, 20, 70.4, 20.8);        // another slow one
  ok('a later slow sample does not pull it back', sync.offset === before);
  ok('the round trip estimate still tracks', sync.rtt > 0);
}
{
  const sync = ns.makeClockSync();
  ns.addSample(sync, 5, 100, 4);             // arrived before it was sent
  ok('a negative round trip is discarded', sync.samples === 0 && !sync.synced);
  ns.addSample(sync, 0, 100, NET.maxRtt + 5);
  ok('an absurd round trip is discarded', sync.samples === 0);
}
{
  // The best-sample bar has to decay, or one lucky packet in the first second pins the
  // estimate for the whole session while the network changes underneath it.
  const sync = ns.makeClockSync();
  ns.addSample(sync, 0, 50.001, 0.002);      // 2 ms — very lucky
  const pinned = sync.bestRtt;
  for (let i = 0; i < 40; i++) ns.addSample(sync, i, 50 + i + 0.05, i + 0.1);
  ok('the best-sample bar decays', sync.bestRtt > pinned, `${pinned} → ${sync.bestRtt.toFixed(4)}`);
  ok('it eventually accepts a new sample', sync.samples > 1);
}

// ── snapshot buffer ──────────────────────────────────────────────────
console.log('\n— snapshot buffer —');
{
  const buf = ns.makeBuffer();
  ok('an empty buffer samples to nothing', ns.sampleAt(buf, 100) === null);

  ns.pushFrame(buf, 10, { p: [0, 0, 0] });
  const one = ns.sampleAt(buf, 10);
  ok('a single frame is held', one && one.mode === 'single');

  ns.pushFrame(buf, 11, { p: [100, 0, 0] });
  const mid = ns.sampleAt(buf, 10.5);
  ok('between two frames it interpolates', mid.mode === 'interp');
  ok('halfway is halfway', Math.abs(mid.t - 0.5) < 1e-9, String(mid.t));
  ok('the endpoints are the right frames', mid.a.p[0] === 0 && mid.b.p[0] === 100);

  ok('exactly on a frame is exact', ns.sampleAt(buf, 11).t === 1);
  ok('before everything held shows the oldest', ns.sampleAt(buf, 5).mode === 'behind');
}
{
  // Out-of-order arrivals must be inserted, not appended. A TCP WebSocket makes this rare
  // but a delayed relay can still deliver a burst out of sequence, and an unsorted buffer
  // produces a stutter that is very hard to attribute after the fact.
  const buf = ns.makeBuffer();
  ns.pushFrame(buf, 10, { p: [0, 0, 0] });
  ns.pushFrame(buf, 12, { p: [200, 0, 0] });
  ns.pushFrame(buf, 11, { p: [100, 0, 0] });     // late arrival
  const s = ns.sampleAt(buf, 11.5);
  ok('a late frame is inserted in order', s.a.p[0] === 100 && s.b.p[0] === 200,
     `${s.a.p[0]} → ${s.b.p[0]}`);
  ok('the buffer stays sorted', ns.bufferSpan(buf) === 2);

  const depth = ns.bufferDepth(buf);
  ns.pushFrame(buf, 11, { p: [999, 0, 0] });     // duplicate timestamp
  ok('a duplicate timestamp is dropped', ns.bufferDepth(buf) === depth);
  ok('the drop is counted', buf.dropped > 0);
}
{
  const buf = ns.makeBuffer();
  for (let i = 0; i < NET.bufferFrames + 30; i++) ns.pushFrame(buf, i, { p: [i, 0, 0] });
  ok('the buffer is bounded', ns.bufferDepth(buf) === NET.bufferFrames,
     String(ns.bufferDepth(buf)));
  ok('it keeps the newest frames',
     buf.frames[buf.frames.length - 1].state.p[0] === NET.bufferFrames + 29);
}
{
  // Running past the newest frame: extrapolate briefly, then hold. Extrapolating forever
  // sends a disconnected pilot flying off in a straight line, which looks far worse in a
  // fight than a ship that simply stops.
  const buf = ns.makeBuffer();
  ns.pushFrame(buf, 10, { p: [0, 0, 0] });
  ns.pushFrame(buf, 11, { p: [100, 0, 0] });

  const soon = ns.sampleAt(buf, 11.2);
  ok('a small gap extrapolates', soon.mode === 'extrapolate');
  ok('extrapolation continues the motion', soon.t > 1, String(soon.t));
  ok('extrapolation is counted', buf.extrapolated > 0);

  const late = ns.sampleAt(buf, 11 + NET.maxExtrapolate + 1);
  ok('a long gap holds position instead', late.mode === 'stale');
  ok('holding uses the last known state', late.a.p[0] === 100 && late.t === 0);
  ok('the gap is counted', buf.gaps > 0);
}

// ── delta encoding ───────────────────────────────────────────────────
console.log('\n— delta encoding —');
{
  const full = ns.encodeFull({ p: [1.234, 2.345, 3.456], yaw: 0.123456, pitch: -0.5,
                               cls: 'military', hull: 88.7 });
  ok('a full snapshot carries every field',
     full.p && full.yaw !== undefined && full.cls === 'military');
  ok('positions are rounded', full.p[0] === 1.2, String(full.p[0]));
  ok('angles keep three places', full.yaw === 0.123, String(full.yaw));
  ok('hull is a whole number', full.hull === 89, String(full.hull));

  ok('an unchanged state encodes to nothing', ns.encodeDelta(full, full) === null);

  const moved = Object.assign({}, full, { p: [9.9, 2.345, 3.456] });
  const d = ns.encodeDelta(moved, full);
  ok('only the changed field is sent', d && d.p && d.yaw === undefined && d.cls === undefined,
     JSON.stringify(d));

  const turned = Object.assign({}, full, { yaw: 1.5 });
  const d2 = ns.encodeDelta(turned, full);
  ok('a turn sends only the angle', d2.yaw === 1.5 && d2.p === undefined);

  // sub-precision movement is not movement
  const nudged = Object.assign({}, full, { p: [1.234001, 2.345, 3.456] });
  ok('a change below the rounding is not sent', ns.encodeDelta(ns.encodeFull(nudged), full) === null);

  ok('the first packet has no baseline and sends everything',
     Object.keys(ns.encodeDelta(full, null)).length === Object.keys(full).length);
}
{
  const base = { p: [1, 2, 3], yaw: 0.5, pitch: 0, cls: 'civilian', hull: 100 };
  const merged = ns.applyDelta(base, { p: [9, 9, 9] });
  ok('applying a delta keeps absent fields', merged.yaw === 0.5 && merged.cls === 'civilian');
  ok('applying a delta takes present fields', merged.p[0] === 9);
  ok('transport keys are not merged in',
     ns.applyDelta(base, { t: 'state', id: 5, seq: 2 }).t === undefined);
  ok('applying to nothing still produces a state', ns.applyDelta(null, { p: [1, 1, 1] }).p[0] === 1);
  ok('the base is not mutated', base.p[0] === 1);
}
{
  // The round trip is the thing that has to hold: encode a sequence of deltas against a
  // running baseline, apply them in order, and land on the same state.
  const states = [];
  for (let i = 0; i < 40; i++) {
    states.push(ns.encodeFull({
      p: [i * 1.7, 0, -i * 0.3],
      yaw: (i % 7) * 0.1, pitch: 0,
      cls: i > 20 ? 'military' : 'civilian',
      hull: 100 - i
    }));
  }
  let sentBaseline = null, received = null, packets = 0, fields = 0;
  for (const s of states) {
    const d = ns.encodeDelta(s, sentBaseline);
    if (d) { packets++; fields += Object.keys(d).length; sentBaseline = s; received = ns.applyDelta(received, d); }
  }
  ok('the delta stream reconstructs the final state',
     JSON.stringify(received) === JSON.stringify(states[states.length - 1]),
     JSON.stringify(received));
  const fullFields = packets * Object.keys(states[0]).length;
  ok('deltas send materially less than full packets', fields < fullFields * 0.75,
     `${fields} fields vs ${fullFields} full`);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
