// The log, and the crew's memory of itself.
//
// Two things get asserted hard here, because both are the kind of thing that is fine in a
// short test and ruinous in a four-hour session:
//
//   **it is bounded** — every buffer has a cap and the cap is enforced, not aspirational
//   **it attributes** — a recorded change names its cause, because a log that says morale
//     moved is nearly worthless and one that says the galley ran dry is the whole feature
//
// The third is subtler and is the reason `crewDiagnosis` exists at all: the sum of the
// attributed causes has to match the change that was actually observed. A diagnosis that
// adds up to more than what happened is a diagnosis that lies, and clamping at the morale
// floor is exactly where that goes wrong.

import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { S, recalcStats } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');
const L = await imp('core/log.js');
<<<<<<< HEAD
const CL = await imp('systems/crew/crew-log.js');
const { initCrew, updateCrew, retrain, crewEvent, makeCrew } = await imp('systems/crew/crew.js');
const { CREWLOG, CREW } = await imp('core/config.js');
const { callTool, TOOL_KEYS } = await imp('systems/platform/tools.js');
=======
const CL = await imp('systems/crew-log.js');
const { initCrew, updateCrew, retrain, crewEvent, makeCrew } = await imp('systems/crew.js');
const { CREWLOG, CREW } = await imp('core/config.js');
const { callTool, TOOL_KEYS } = await imp('systems/tools.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

recalcStats();
seedWorld(20260808);

const reset = () => {
  S.log = null; S.crewLog = null; S.time = 1000;
  L.setLogLevel('info');
};

/**
 * The starting roster is two people. Several checks below need somebody on watch *and*
 * somebody off it, or three distinct cases to sort — so pad rather than assume, which is
 * the mistake that made the first run of this suite read `S.crew[1]` as undefined.
 */
const roster = (n = 4) => {
  initCrew();
  while (S.crew.length < n) S.crew.push(makeCrew(null, null, 1));
  return S.crew;
};

// ── the log ──────────────────────────────────────────────────────────
console.log('\n— the log —');
{
  reset();
  ok('a fresh log is empty', L.logEntries().length === 0);
  const e = L.logInfo('test', 'hello', { id: 7 });
  ok('an entry is returned', !!e && e.msg === 'hello');
  ok('it carries the time', e.t === S.time);
  ok('it carries structured data', e.data.id === 7);
  ok('it lands in the buffer', L.logEntries().length === 1);

  // Levels gate, and the cheap path is the default one.
  ok('debug is off by default', L.logDebug('test', 'noise') === null);
  L.setLogLevel('debug');
  ok('and can be turned on', !!L.logDebug('test', 'noise'));
  L.setLogLevel('warn');
  ok('a raised threshold drops info', L.logInfo('test', 'quiet') === null);
  ok('but not warnings', !!L.logWarn('test', 'loud'));
  ok('a nonsense level is refused', L.setLogLevel('shouting') === false);
  L.setLogLevel('info');

  // The cap is the point. A tab open for hours cannot hold every event ever recorded.
  reset();
  for (let i = 0; i < L.LOG_CAP + 250; i++) L.logInfo('flood', 'e' + i);
  ok('the buffer is capped', L.logEntries().length === L.LOG_CAP, `${L.logEntries().length}`);
  ok('the oldest fell off', L.logEntries()[0].msg !== 'e0');
  ok('the newest is kept', L.logEntries()[L.logEntries().length - 1].msg === 'e' + (L.LOG_CAP + 249));
  // And it says so, rather than implying the log is complete.
<<<<<<< HEAD
  ok('dropped entries are counted', L.logDiagnostics().dropped === 250, `${L.logDiagnostics().dropped}`);
=======
  ok('dropped entries are counted', L.diagnostics().dropped === 250, `${L.diagnostics().dropped}`);
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
}

console.log('\n— querying —');
{
  reset();
  L.logInfo('a', 'one', { id: 1 });
  S.time += 10;
  L.logWarn('b', 'two', { id: 2 });
  S.time += 10;
  L.logError('a', 'three', { id: 1 });

  ok('newest first', L.logQuery({})[0].msg === 'three');
  ok('filter by channel', L.logQuery({ channel: 'a' }).length === 2);
  ok('filter by level', L.logQuery({ level: 'warn' }).length === 2);
  ok('filter by subject', L.logQuery({ subject: 1 }).length === 2);
  ok('filter by time', L.logQuery({ since: S.time - 5 }).length === 1);
  ok('filters compose', L.logQuery({ channel: 'a', level: 'error' }).length === 1);
  ok('a limit is respected', L.logQuery({ limit: 1 }).length === 1);
  ok('an unmatched filter returns nothing', L.logQuery({ channel: 'nope' }).length === 0);

<<<<<<< HEAD
  const d = L.logDiagnostics();
=======
  const d = L.diagnostics();
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  ok('diagnostics count by level', d.byLevel.error === 1 && d.byLevel.warn === 1);
  ok('diagnostics count by channel', d.byChannel.a === 2);
  ok('diagnostics surface problems', d.problems.length === 2);
  ok('diagnostics report the span', d.span && d.span.to > d.span.from);
  L.clearLog();
  ok('the log can be cleared', L.logEntries().length === 0);
}

// ── crew telemetry ───────────────────────────────────────────────────
console.log('\n— the crew remembers itself —');
{
  reset();
  roster();
  ok('there is a crew to watch', (S.crew || []).length > 0);

  ok('sampling takes the whole roster', CL.sampleCrew(true) === S.crew.length);
  const id = S.crew[0].id;
  ok('a series starts', CL.crewSeries(id).length === 1);
  ok('the sample carries every tracked axis',
     CL.TRACKED.every(k => typeof CL.crewSeries(id)[0][k] === 'number'));

  // Cadence: the reason keeping a history is affordable at all.
  const before = CL.crewSeries(id).length;
  CL.sampleCrew();
  ok('an immediate second sample is skipped', CL.crewSeries(id).length === before);
  S.time += CREWLOG.sampleEvery + 1;
  CL.sampleCrew();
  ok('and taken once the cadence has passed', CL.crewSeries(id).length === before + 1);

  // Bounded per person, and pruned when somebody leaves.
  for (let i = 0; i < CREWLOG.samplesPerCrew + 50; i++) { S.time += CREWLOG.sampleEvery + 1; CL.sampleCrew(); }
  ok('a series is capped', CL.crewSeries(id).length === CREWLOG.samplesPerCrew,
     `${CL.crewSeries(id).length}`);
  const gone = S.crew.pop();
  CL.sampleCrew(true);
  ok('a departed crewman stops being tracked', CL.crewSeries(gone.id).length === 0);
}

console.log('\n— trends —');
{
  reset();
  roster();
  const c = S.crew[0];

  c.morale = 0.5; CL.sampleCrew(true);
  S.time += CREWLOG.trendWindow;
  c.morale = 0.8; CL.sampleCrew(true);
  const up = CL.crewTrend(c.id, 'morale');
  ok('a rise reads as rising', up.direction === 'rising', up.direction);
  ok('the delta is signed', up.delta > 0);
  ok('it reports where it is now', up.now === 0.8);

  c.morale = 0.2; CL.sampleCrew(true);
  ok('a fall reads as falling', CL.crewTrend(c.id, 'morale').direction === 'falling');

  // The dead band: a number technically moving must not read as a trend, or the panel
  // flickers and the player learns to ignore it.
  reset();
  roster();
  const d = S.crew[0];
  d.morale = 0.5; CL.sampleCrew(true);
  S.time += CREWLOG.trendWindow;
  d.morale = 0.5 + CREWLOG.deadBand * 0.4; CL.sampleCrew(true);
  ok('a negligible change reads as steady', CL.crewTrend(d.id, 'morale').direction === 'steady',
     `${CL.crewTrend(d.id, 'morale').delta}`);
  ok('somebody never sampled reports unknown', CL.crewTrend(99999).direction === 'unknown');
}

// ── attribution ──────────────────────────────────────────────────────
console.log('\n— every change names its cause —');
{
  reset();
  roster();
  const c = S.crew[0];
  const before = c.morale;
  retrain(c.id, c.role === 'gunner' ? 'engineer' : 'gunner');
  ok('retraining costs morale', c.morale < before);
  const hist = CL.crewHistory(c.id);
  ok('and it is recorded', hist.length > 0);
  ok('against the person', hist[0].data.id === c.id);
  ok('with a cause', hist[0].data.cause === 'retraining');
  ok('and a signed delta', hist[0].data.delta < 0);
  ok('the delta matches what happened',
     Math.abs(hist[0].data.delta - (c.morale - before)) < 1e-6);

  // A win lifts the watch, and says so.
  reset();
  roster();
  for (const x of S.crew) { x.morale = 0.5; x.onDuty = true; }
  S.crew[0].onDuty = false;
  crewEvent('kill', 'gunner');
  ok('a kill lifts the watch', S.crew[1].morale > 0.5);
  ok('and not the off-watch', S.crew[0].morale === 0.5);
  ok('the lift is attributed',
     CL.crewHistory(S.crew[1].id).some(e => e.data.cause === 'a kill on their watch'));
  ok('nothing is filed for somebody it did not touch',
     CL.crewHistory(S.crew[0].id).every(e => e.data.cause !== 'a kill on their watch'));
}

console.log('\n— diagnosis —');
{
  reset();
  roster();
  const c = S.crew[0];

  // The payroll pass is where most morale actually moves, so drive it directly: unpaid,
  // hungry, and posted off speciality is a crewman with three separate complaints.
  S.credits = 0;
  c.hunger = 1; c.thirst = 1;
  c.post = c.role === 'gunner' ? 'engineer' : 'gunner';
  c.morale = 0.9;
  S.crewPayT = 0;
  for (let i = 0; i < 400 && c.morale > 0.55; i++) { S.time += 1; updateCrew(1); }

  const d = CL.crewDiagnosis(c.id, 'morale');
  ok('a diagnosis finds causes', d.worst.length > 0, JSON.stringify(d.worst));
  ok('the causes are ranked worst first',
     d.worst.every((w, i) => i === 0 || d.worst[i - 1].delta <= w.delta));
  ok('missed wages is among them', d.worst.some(w => /wages/.test(w.cause)));
  ok('short rations is among them', d.worst.some(w => /rations/.test(w.cause)));
  ok('being posted off speciality is among them', d.worst.some(w => /speciality/.test(w.cause)));
  ok('the trend agrees with the diagnosis', d.trend.direction !== 'rising');

  // The one that is easy to get wrong: at the floor, the terms are notional. A diagnosis
  // that sums to more than the observed change is a diagnosis that lies.
  reset();
  roster();
  const f = S.crew[0];
  S.credits = 0;
  f.morale = CREW.moraleFloor + 0.001;
  const at = f.morale;
  S.crewPayT = 0;
  for (let i = 0; i < 200; i++) { S.time += 1; updateCrew(1); }
  const sum = CL.crewHistory(f.id, 200)
    .filter(e => e.data && e.data.stat === 'morale')
    .reduce((a, e) => a + e.data.delta, 0);
  ok('morale stopped at the floor', f.morale >= CREW.moraleFloor - 1e-9);
  ok('the attributed total does not exceed the real fall',
     Math.abs(sum) <= Math.abs(f.morale - at) + 1e-6,
     `attributed ${sum.toFixed(4)} vs actual ${(f.morale - at).toFixed(4)}`);
}

console.log('\n— the roster at a glance —');
{
  reset();
  roster();
  for (const c of S.crew) { c.morale = 0.9; c.fatigue = 0.1; c.injury = 0; }
  CL.sampleCrew(true);
  const calm = CL.crewVitals();
  ok('vitals count the roster', calm.count === S.crew.length);
  ok('a happy ship has nobody at risk', calm.atRisk === 0, `${calm.atRisk}`);

  const victim = S.crew[2];
  victim.morale = 0.2; victim.fatigue = 0.95; victim.injury = 0.6;
  CL.sampleCrew(true);
  const rows = CL.watchReport();
  ok('the worst case sorts first', rows[0].id === victim.id);
  ok('and is flagged at risk', CL.crewVitals().atRisk >= 1);
  ok('the report carries the post', typeof rows[0].post === 'string');
  ok('and both trends', !!rows[0].moraleTrend && !!rows[0].fatigueTrend);
  ok('vitals name the worst case', CL.crewVitals().worst.id === victim.id);

  // Falling weighs more than merely low — somebody at 0.4 climbing is being handled.
  reset();
  roster();
  const a = S.crew[0], b = S.crew[1];
  for (const c of S.crew) { c.morale = 0.9; c.fatigue = 0; c.injury = 0; }
  a.morale = 0.55; b.morale = 0.6;
  CL.sampleCrew(true);
  S.time += CREWLOG.trendWindow + 1;
  a.morale = 0.62;   // low but recovering
  b.morale = 0.42;   // higher a moment ago, now falling
  CL.sampleCrew(true);
  const order = CL.watchReport();
  ok('the one in freefall outranks the one recovering',
     order.findIndex(r => r.id === b.id) < order.findIndex(r => r.id === a.id));
}

console.log('\n— ARIA can answer for the crew —');
{
  reset();
  roster();
  ok('the tools are registered',
     ['crew_watch', 'crew_why', 'diagnostics'].every(k => TOOL_KEYS.includes(k)));

  for (const c of S.crew) { c.morale = 0.9; c.fatigue = 0.1; }
  CL.sampleCrew(true);
  const w = callTool('crew_watch');
  ok('crew_watch answers in words', typeof w.text === 'string' && w.text.length > 20);
  ok('and carries the data', w.data && w.data.count === S.crew.length);

  const target = S.crew[0];
  target.morale = 0.4;
  CL.noteCrew(target, 'short rations', { stat: 'morale', delta: -0.2 });
  const why = callTool('crew_why', [target.name.split(' ')[0]]);
  ok('crew_why finds somebody by name', why.data !== null, why.text);
  ok('and names the cause', /rations/.test(why.text), why.text);
  ok('an unknown name is handled', callTool('crew_why', ['Nobody At All']).data === null);

  L.logWarn('test', 'something went wrong');
  const dg = callTool('diagnostics');
  ok('diagnostics answers', /entries held|entries of/.test(dg.text), dg.text);
  ok('and surfaces the problem', dg.data.problems.length > 0);

  reset();
  S.crew = [];
  ok('an empty ship is handled', /No crew/.test(callTool('crew_watch').text));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
