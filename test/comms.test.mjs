// node test/comms.test.mjs — headless check of the comms state machine
import assert from 'node:assert/strict';
import { CallSession, CallState, TranscriptLine } from '../js/comms/call-session.js';
import { undockScript, pirateScript, chatterExchange } from '../js/comms/call-scripts.js';

// a stand-in port and the consequences a script can pull
const ST = { id: 'st1', name: 'Zerze Ring', sector: 'logistic', x: 0, y: 0, z: 0 };
const fx = () => { const log = []; return { log, range: () => 213, flagged: () => false, wants: () => ['Iron ore'], credits: () => 500, pay: (n, w) => log.push(['pay', n, w]), undock: () => log.push(['undock']), standing: (d, w) => log.push(['standing', d, w]), cargoValue: () => 1000, provoke: () => log.push(['provoke']), truce: () => log.push(['truce']) }; };
const ZERZE_UNDOCK = undockScript(ST, fx());

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.log(`FAIL  ${name}\n      ${e.message}`); fail++; }
};
const run = (s, ms, step = 16) => { for (let i = 0; i < ms; i += step) s.tick(step); };
const mk = (o = {}) => new CallSession({ peerName: 'ZERZE', rangeU: 213, script: ZERZE_UNDOCK, ...o });

t('idle by default', () => assert.equal(mk().state, CallState.IDLE));

t('incoming hail rings, then misses on timeout', () => {
  const s = mk({ ringTimeoutMs: 3000 });
  s.hail({ incoming: true });
  assert.equal(s.state, CallState.RINGING_IN);
  run(s, 3200);
  assert.equal(s.state, CallState.MISSED);
});

t('reject closes without transcript', () => {
  const s = mk(); s.hail(); s.reject();
  assert.equal(s.state, CallState.REJECTED);
  assert.equal(s.lines.length, 0);
});

t('accept connects after light-lag and speaks node 0', () => {
  const s = mk(); s.hail(); s.accept();
  assert.equal(s.state, CallState.CONNECTING);
  run(s, 700);
  assert.equal(s.state, CallState.ACTIVE);
  assert.equal(s.lines.length, 1);
  assert.equal(s.lines[0].speaker, 'peer');
});

t('options unlock only after the line finishes revealing', () => {
  const s = mk(); s.hail(); s.accept(); run(s, 700);
  assert.equal(s.options.length, 0, 'options must not appear mid-reveal');
  run(s, 8000);
  assert.equal(s.options.length, 3);
  assert.equal(s.lines[0].done, true);
});

t('skipReveal fast-forwards and releases options', () => {
  const s = mk(); s.hail(); s.accept(); run(s, 700);
  s.skipReveal();
  assert.equal(s.options.length, 3);
});

t('choosing a reply echoes the player line then advances', () => {
  const s = mk(); s.hail(); s.accept(); run(s, 9000);
  const id = s.options[0].id;
  assert.equal(s.choose(id), true);
  assert.equal(s.lines[1].speaker, 'self');
  run(s, 12000);
  assert.equal(s.lines[2].speaker, 'peer');
  assert.match(s.lines[2].text, /clearance logged/i);
});

t('terminal node ends the call', () => {
  const s = mk(); s.hail(); s.accept(); run(s, 9000);
  s.choose(s.options.find(o => /HOLD/.test(o.label)).id);
  run(s, 2000);
  assert.equal(s.state, CallState.CLOSED);
});

t('outgoing hail is answered by the peer', () => {
  const s = mk(); s.hail({ incoming: false });
  assert.equal(s.state, CallState.RINGING_OUT);
  run(s, 3000);
  assert.equal(s.state, CallState.ACTIVE);
});

t('light-lag scales with range', () => {
  assert.equal(mk({ rangeU: 213 }).lagMs, 426);
  assert.equal(mk({ rangeU: 0 }).lagMs, 0);
});

t('weak signal garbles characters but preserves length and spaces', () => {
  const src = 'cut thrust and open the cargo bay';
  const m = TranscriptLine.mask(src, 0.5, 7);
  assert.equal(m.length, src.length);
  for (let i = 0; i < src.length; i++) if (src[i] === ' ') assert.equal(m[i], ' ');
  assert.notEqual(m, src);
  assert.equal(TranscriptLine.mask(src, 1, 7), null, 'clean signal = no mask');
});

t('mask is deterministic for a given seed', () => {
  assert.equal(TranscriptLine.mask('holding at ring', 0.6, 42), TranscriptLine.mask('holding at ring', 0.6, 42));
});

t('tick is the only clock — no wall time', () => {
  const s = mk(); s.hail(); s.accept();
  const before = s.state;
  assert.equal(before, CallState.CONNECTING);
  s.tick(0);
  assert.equal(s.state, CallState.CONNECTING, 'zero dt must not advance');
});

t('time compression: 4x reaches active in a quarter of the ticks', () => {
  const a = mk(); a.hail(); a.accept(); a.tick(160); a.tick(160); a.tick(160); a.tick(160);
  assert.equal(a.state, CallState.ACTIVE);
});

t('provider failure falls back to the scripted line', async () => {
  const s = mk({ provider: () => Promise.reject(new Error('offline')), providerTimeoutMs: 200 });
  s.hail(); s.accept(); run(s, 700);
  await new Promise(r => setTimeout(r, 20));
  run(s, 400);
  assert.equal(s.lines.length, 1);
  assert.equal(s.lines[0].text, ZERZE_UNDOCK.nodes.greet.text);
});

/* ---- additions for the LIVING GALAXY integration ---- */

t('node effect fires when the node is entered (clearance opens the clamps)', () => {
  const ctx = fx();
  const s = mk({ script: undockScript(ST, ctx) }); s.hail(); s.accept(); run(s, 9000);
  const fired = [];
  s.on('node', (n) => { if (typeof n.effect === 'function') n.effect(s); fired.push(n.id); });
  s.choose(s.options.find(o => /REQUEST UNDOCK/.test(o.label)).id);
  run(s, 2000);
  assert.deepEqual(fired, ['queue']);
  assert.deepEqual(ctx.log, [['undock']]);
});

t('priority release pays the surcharge then undocks; refusing a scan costs standing', () => {
  const ctx = fx();
  const s = mk({ script: undockScript(ST, ctx) }); s.hail(); s.accept(); run(s, 9000);
  s.on('node', (n) => n.effect && n.effect(s));
  s.choose(s.options.find(o => /PRIORITY/.test(o.label)).id); run(s, 12000);
  s.choose(s.options.find(o => /PAY IT/.test(o.label)).id); run(s, 12000);
  assert.deepEqual(ctx.log, [['pay', 80, 'priority release'], ['undock']]);
  const c2 = fx();
  const s2 = mk({ script: undockScript(ST, c2) }); s2.hail(); s2.accept(); run(s2, 9000);
  s2.on('node', (n) => n.effect && n.effect(s2));
  s2.choose(s2.options.find(o => /PRIORITY/.test(o.label)).id); run(s2, 12000);
  s2.choose(s2.options.find(o => /REFUSE SCAN/.test(o.label)).id); run(s2, 12000);
  assert.equal(c2.log[0][0], 'standing');
  assert.equal(s2.state, CallState.CLOSED);
});

t('pirate toll: paying buys a truce, refusing provokes the guns', () => {
  const ctx = fx();
  const s = mk({ script: pirateScript({ ...ST, sector: 'pirate', name: 'Hookfall Hold' }, ctx) }); s.hail(); s.accept(); run(s, 9000);
  s.on('node', (n) => n.effect && n.effect(s));
  s.choose(s.options.find(o => /^PAY/.test(o.label)).id); run(s, 9000);
  assert.deepEqual(ctx.log.map(x => x[0]), ['pay', 'truce']);
  assert.equal(ctx.log[0][1], 350, '35% of hold value');
});

t('outgoing hail to something with no radio ends UNREACHABLE', () => {
  const s = mk({ answerMs: Infinity, ringTimeoutMs: 3000, script: { start: null, nodes: {} } });
  s.hail({ incoming: false });
  run(s, 3200);
  assert.equal(s.state, CallState.UNREACHABLE);
});

t('live call: nothing auto-answers, connect() opens the carrier, receive/say carry lines', () => {
  const s = new CallSession({ peerName: 'KEPLER-42', live: true, rangeU: 500, msPerUnit: 0.02, ringTimeoutMs: 20000 });
  s.hail({ incoming: false });
  run(s, 6000);
  assert.equal(s.state, CallState.RINGING_OUT, 'no scripted pickup on a live call');
  s.connect();
  assert.equal(s.state, CallState.ACTIVE);
  const sent = [];
  s.on('say', (t) => sent.push(t));
  assert.equal(s.say('  '), false, 'blank lines are not transmitted');
  assert.equal(s.say('Reading you five by five.'), true);
  assert.deepEqual(sent, ['Reading you five by five.']);
  const l = s.receive('Copy. Form on my wing.', 'KEPLER-42');
  assert.equal(l.speaker, 'peer');
  run(s, 3000);
  assert.equal(s.lines.length, 2);
  assert.equal(s.lines[1].done, true);
  assert.equal(s.options.length, 0, 'live calls have no scripted options');
});

t('live incoming hail accepted moves through CONNECTING to ACTIVE with no script', () => {
  const s = new CallSession({ peerName: 'PILOT', live: true });
  s.hail({ incoming: true });
  assert.equal(s.accept(), true);
  assert.equal(s.state, CallState.CONNECTING);
  run(s, 500);
  assert.equal(s.state, CallState.ACTIVE);
  assert.equal(s.lines.length, 0);
});

t('chatter exchange alternates speakers and fills in names', () => {
  let n = 0;
  const rnd = () => ((n++ * 0.37) % 1);
  const a = { name: 'Forge Works', sector: 'industrial' };
  const b = { name: 'Haven Ring', sector: 'civilian' };
  const ex = chatterExchange(a, b, rnd);
  assert.ok(ex.length >= 2);
  assert.equal(ex[0].from, a); assert.equal(ex[0].to, b);
  assert.equal(ex[1].from, b); assert.equal(ex[1].to, a);
  for (const l of ex) assert.doesNotMatch(l.text, /\{[AB]\}/);
});

setTimeout(() => {
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}, 120);
