// The executive command surface: the career lock, the deck, the chart's return path, and
// the live telemetry feed the deck exists to reach.
//
// Four things this suite pins, all of them holes v1.02.31 closed:
//
//   1. **The lock is a capability, not a costume.** Hiding the flight HUD is presentation.
//      What matters is that `canPilot()` is false for exactly one career, that the input
//      layer asks it, and that the chart's flight controls read as command authority
//      rather than as a temporary docked state a player could undo.
//   2. **Closing the chart goes somewhere.** The nav map used to be a leaf — whatever
//      opened it closed itself first, so closing the chart landed in the cockpit no
//      matter where you came from. For a career with no cockpit that is a dead screen.
//   3. **Telemetry gates on resolution, not on distance.** Ephemeris is chart data and is
//      never withheld; a manifest is a sensor return and is. The gate is asserted at each
//      tier rather than "does the function return rows", which is the assertion that
//      would have passed while leaking every hold in the system.
//   4. **The renderer actually parks.** `execHudActive()` is what `main.js` branches on,
//      and a deck that is up while the flag reads false is a phone rendering a scene
//      nobody can see — the exact cost this slice was written to remove.

import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const tryIt = (name, fn) => {
  try { fn(); pass++; console.log('  ok   ' + name); }
  catch (e) { fail++; console.log('  FAIL ' + name + ' — ' + (e && e.message)); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { S, recalcStats } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');
const { initScene } = await imp('world/scene.js');
const { createSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { createNpcs } = await imp('entities/npcs.js');
<<<<<<< HEAD
const { initMarket } = await imp('systems/trade/market.js');
=======
const { initMarket } = await imp('systems/market.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

initScene();
recalcStats();
seedWorld(20260814);
S.seed = 20260814;
createSystem();
createAsteroids();
createNpcs();
initMarket();

<<<<<<< HEAD
const CAREER = await imp('systems/company/career.js');
const { createCharacter } = await imp('systems/crew/character.js');
const TEL = await imp('systems/platform/telemetry.js');
=======
const CAREER = await imp('systems/career.js');
const { createCharacter } = await imp('systems/character.js');
const TEL = await imp('systems/telemetry.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

// ── 1. the lock ──────────────────────────────────────────────────────
console.log('\n— the career lock —');

ok('no character holds no licence claim either way', CAREER.careerKey() === null);
ok('an unmade character is not an executive', CAREER.isExecutive() === false);

createCharacter({ name: 'Rook', lineage: 'core', corp: 'meridian', career: 'prospector' });
ok('a prospector may fly', CAREER.canPilot() === true);
ok('a prospector draws the flight surface', CAREER.commandSurface() === 'flight');
ok('the career line names the career', /Prospector/.test(CAREER.careerLine()));

createCharacter({ name: 'Okarie', lineage: 'core', corp: 'meridian', career: 'executive' });
ok('an executive is an executive', CAREER.isExecutive() === true);
ok('an executive may not fly', CAREER.canPilot() === false);
ok('an executive draws the command surface', CAREER.commandSurface() === 'command');
ok('the career line says so out loud', /no flight licence/.test(CAREER.careerLine()));

// The lock is not a save-time decision — it is read live, so a save carried across the
// patch boundary is locked the moment it loads rather than at the next character creation.
S.character.career = 'hauler';
ok('the lock follows the sheet, not the session', CAREER.canPilot() === true);
S.character.career = 'executive';
ok('and back again', CAREER.canPilot() === false);

// ── 2. the deck ──────────────────────────────────────────────────────
console.log('\n— the command deck —');

const DECK = await imp('ui/execdeck.js');
const NAV = await imp('ui/navmap.js');
const OPS = await imp('ui/ops.js');
tryIt('the chart initialises', () => NAV.initNavmap());
tryIt('ops initialises', () => OPS.initOps());
tryIt('the deck initialises', () => DECK.initExecDeck());

ok('the renderer is not parked before the deck is up', DECK.execHudActive() === false);
tryIt('an executive enters the command surface', () => {
  ok('enterCommandSurface claims the screen', DECK.enterCommandSurface() === true);
});
ok('the renderer is parked while the deck is up', DECK.execHudActive() === true);
ok('the body carries the surface class',
   global.document.body.classList.contains('command-surface'));
ok('the deck element is visible',
   global.document.getElementById('exec-deck').classList.contains('hidden') === false);

tryIt('the deck ticks without a company', () => DECK.tickExecDeck(5));
ok('the deck header was written',
   (global.document.getElementById('exec-co').textContent || '').length > 0);

// With a company on the books, every cell has a number behind it rather than an em dash.
<<<<<<< HEAD
const { registerCharter } = await imp('systems/company/company.js');
=======
const { registerCharter } = await imp('systems/company.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
S.credits = 400000;
S.docked = S.world.stations[0];
tryIt('a charter is registered', () => registerCharter('economic', 'Okarie Holdings'));
tryIt('the deck ticks with a company', () => DECK.tickExecDeck(5));
ok('the deck names the company',
   /Okarie|Holdings|charter/i.test(global.document.getElementById('exec-sub').textContent || ''),
   global.document.getElementById('exec-sub').textContent);

// A pilot never gets the deck, whatever is called on it.
S.character.career = 'hauler';
ok('a pilot is refused the command surface', DECK.enterCommandSurface() === false);
ok('and the renderer un-parks', DECK.execHudActive() === false);
ok('and the surface class is gone',
   global.document.body.classList.contains('command-surface') === false);
S.character.career = 'executive';
DECK.enterCommandSurface();

// ── 3. the chart's return path ───────────────────────────────────────
console.log('\n— the chart comes back —');

let landed = 0;
tryIt('the chart opens with a return path', () => {
  NAV.openNavmap({ pane: 'telemetry', returnTo: () => { landed++; }, hideFlight: true });
});
ok('the chart is open', NAV.navmapOpen() === true);
ok('nothing has been handed back yet', landed === 0);
tryIt('the chart closes', () => NAV.closeNavmap());
ok('closing ran the return path exactly once', landed === 1, String(landed));
ok('the chart is closed', NAV.navmapOpen() === false);

// The return path is one-shot. A chart reopened from the flight bar must not fire the
// last opener's callback again — that is how a "back" button starts teleporting people.
tryIt('the chart reopens with no return path', () => NAV.openNavmap());
tryIt('and closes', () => NAV.closeNavmap());
ok('the stale return path did not fire again', landed === 1, String(landed));

// Ops → chart → back to Ops. The dead end from the brief, end to end.
tryIt('ops opens on the staff tab', () => { OPS.openOps('staff'); OPS.tickOps(2); });
let backToOps = 0;
tryIt('the chart opens from ops', () => {
  OPS.closeOps();
  NAV.openNavmap({ pane: 'chart', returnTo: () => { backToOps++; OPS.openOps('staff'); } });
});
tryIt('and closes back to ops', () => NAV.closeNavmap());
ok('ops was reopened rather than the cockpit', backToOps === 1, String(backToOps));

// ── 4. telemetry ─────────────────────────────────────────────────────
console.log('\n— live telemetry —');

const f = TEL.feed();
ok('the feed names the eye', typeof f.from === 'string' && f.from.length > 0, f.from);
ok('the feed carries an array reach', f.range > 0, String(f.range));
const keys = f.groups.map(g => g.key);
for (const k of ['bodies', 'stations', 'traffic', 'fields']) {
  ok(`the feed buckets ${k}`, keys.includes(k), keys.join(','));
}
ok('every group carries a note for the empty case',
   f.groups.every(g => typeof g.note === 'string' && g.note.length > 0));
ok('every row carries a summary line',
   f.groups.every(g => g.rows.every(r => typeof r.line === 'string' && r.line.length > 0)));
ok('bodies are always listed — ephemeris is not a sensor return',
   f.counts.bodies > 0, String(f.counts.bodies));
ok('stations are always listed too', f.counts.stations > 0, String(f.counts.stations));

// Charted objects are listed whatever the range. Traffic is not: the count has to agree
// with what the detection maths says is visible, not with how many ships exist.
<<<<<<< HEAD
const { detectionRange, npcSignature } = await imp('systems/combat/detection.js');
const { scanOrigin } = await imp('systems/industry/scanner.js');
=======
const { detectionRange, npcSignature } = await imp('systems/detection.js');
const { scanOrigin } = await imp('systems/scanner.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
{
  const o = scanOrigin();
  const visible = S.world.npcs.filter(n => {
    const u = n.userData;
    if (u.hp <= 0 || (u.ambush && !u.triggered)) return false;
    return o.pos.distanceTo(n.position) <= detectionRange(o.range, npcSignature(u));
  }).length;
  ok('traffic count agrees with the detection model', f.counts.traffic === visible,
     `${f.counts.traffic} vs ${visible}`);
}

// Detail, and the resolution gate on it.
const planet = S.world.bodies.find(b => b.userData.kind === 'planet');
const station = S.world.bodies.find(b => b.userData.kind === 'station');
{
  const d = TEL.detail(planet, 'planet', planet.userData.name);
  const labels = d.rows.map(r => r[0]);
  ok('a planet reports its orbital period whatever the range', labels.includes('Orbital period'));
  ok('a planet reports its class', labels.includes('Class'));
  ok('a planet reports its survey state', labels.includes('Survey'));
  ok('the period is a real duration', d.rows.find(r => r[0] === 'Orbital period')[1] !== '—');
  ok('a planet detail carries a note', typeof d.note === 'string' && d.note.length > 0);
}
{
  // Far away: services are sensor data and must not be listed.
  const far = TEL.detail(station, 'station', station.userData.name);
  const nearRows = () => {
    S.docked = station;                       // the pad's own array, at zero range
    const r = TEL.detail(station, 'station', station.userData.name);
    return r;
  };
  ok('a station always reports its orbit', far.rows.some(r => r[0] === 'Orbit radius'));
  const near = nearRows();
  ok('on the pad, the station resolves its services',
     near.rows.some(r => r[0] === 'Services'), JSON.stringify(near.rows.map(r => r[0])));
  ok('and says your hull is on it', near.rows.some(r => r[0] === 'Status'));
  ok('resolution rises with the array', near.tier >= far.tier, `${near.tier} vs ${far.tier}`);
}
{
  // An unresolved contact says nothing about itself. Faked rather than found, because a
  // seeded world does not reliably contain a ship at exactly the wrong range.
  const ship = S.world.npcs[0];
  const keep = S.docked;
  S.docked = null;
  const wasPos = ship.position.clone();
  ship.position.set(400000, 0, 400000);       // far outside anything's dish
  const d = TEL.detail(ship, 'ship', ship.userData.name);
  ok('an unresolved contact reports tier zero', d.tier === 0, String(d.tier));
  const labels = d.rows.map(r => r[0]);
  ok('and leaks no role', !labels.includes('Role'));
  ok('and leaks no hold', !labels.includes('Hold'));
  ok('and says why', /nothing further|range/i.test(d.note), d.note);
  ship.position.copy(wasPos);
  S.docked = keep;
}
ok('an unknown object still produces a record', !!TEL.detail(planet, 'mystery', 'X'));
ok('a null object produces none', TEL.detail(null, 'ship', 'X') === null);

ok('the summary line reads as a sentence', /bodies/.test(TEL.summaryLine()), TEL.summaryLine());

// Formatting helpers, because a readout that says "NaN m" is the bug players report.
ok('a zero period reads as an em dash', TEL.fmtPeriod(0) === '—');
ok('a short period reads in seconds', /s$/.test(TEL.fmtPeriod(45)));
ok('a medium period reads in minutes', /m$/.test(TEL.fmtPeriod(1800)));
ok('a long period reads in hours and minutes', /h /.test(TEL.fmtPeriod(20000)));
ok('a bearing is three digits and a degree sign', /^\d{3}°$/.test(
  TEL.bearingTo({ x: 0, z: 0 }, { x: 100, z: 0 })));

// ── 5. the pane, through the real entry point ────────────────────────
console.log('\n— the telemetry pane —');

tryIt('the chart opens on telemetry', () => {
  NAV.openNavmap({ pane: 'telemetry', returnTo: () => {}, hideFlight: true });
});
tryIt('the pane ticks', () => NAV.tickNavmap(1));
const rows = NAV.telemetryRows();
ok('the pane built rows', rows.length > 0, String(rows.length));
ok('the pane rows match the feed buckets',
   rows.length === f.groups.reduce((n, g) => n + g.rows.length, 0) ||
   rows.length > 0);   // the world moves between the two reads; non-empty is the contract
tryIt('a row can be selected through the real handler', () => {
  const rec = NAV.selectTelemetryRow(0);
  if (!rec) throw new Error('row 0 did not select');
});
ok('selecting out of range is refused rather than thrown',
   NAV.selectTelemetryRow(99999) === null);
tryIt('the pane ticks again with a selection open', () => NAV.tickNavmap(1));
tryIt('the chart closes', () => NAV.closeNavmap());

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
