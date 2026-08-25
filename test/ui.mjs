// UI integration: boot main.js exactly as the browser would, then drive every panel.
import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
const { nodes } = installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const tryIt = (name, fn) => { try { fn(); ok(name, true); } catch (e) { ok(name, false, e.message + '\n' + e.stack.split('\n').slice(1,4).join('\n')); } };

const imp = p => import(new URL('src/' + p, ROOT).href);

console.log('\n— boot via main.js —');
let bootErr = null;
try { await imp('main.js'); } catch (e) { bootErr = e; }
ok('main.js boots without throwing', !bootErr, bootErr && bootErr.stack);

const { S } = await imp('core/state.js');
const { updateHud, setThreat, markShipButtons } = await imp('ui/hud.js');
const { openNavmap, closeNavmap, tickNavmap } = await imp('ui/navmap.js');
const { openDock, closeDock } = await imp('ui/dock.js');
const { dock } = await imp('systems/trade/economy.js');
const { setTarget } = await imp('systems/flight/targeting.js');
const { toggleWarp } = await imp('systems/flight/warp.js');

ok('LG debug handle exposed', !!global.window.LG && !!global.window.LG.S);
ok('world deferred until power-up', S.world.npcs.length === 0);

console.log('\n— boot overlay —');
tryIt('power-up button responds', () => nodes.get('boot-start').dispatch('click'));
// A fresh flight now stops at character creation rather than launching straight into the
// world — a ship with nobody in it is not a game state we want to be able to reach.
ok('creation opens for a pilotless flight', S.running === false);

console.log('\n— character creation —');
const { hasCharacter } = await imp('systems/crew/character.js');
// The creation cards are built at runtime rather than declared in index.html, so they
// are found by walking the body node the way a player's thumb would find them on screen.
const cards = () => (nodes.get('create-body').children || [])
  .filter(c => c.classList && c.classList.contains('ccard'));
const pick = (label) => {
  const hit = cards().find(c => (c.innerHTML || '').includes(label));
  if (!hit) throw new Error(`no card matching ${label} among ${cards().length}`);
  hit.dispatch('click');
};
tryIt('lineage cards render', () => { if (!cards().length) throw new Error('no cards'); });
tryIt('a lineage can be chosen', () => pick('Belt-born'));
tryIt('continue advances to corporations', () => nodes.get('create-next').dispatch('click'));
tryIt('a corporation can be chosen', () => pick('Collective'));
tryIt('continue advances to careers', () => nodes.get('create-next').dispatch('click'));
tryIt('a career can be chosen', () => pick('Prospector'));
tryIt('continue advances to the agent', () => nodes.get('create-next').dispatch('click'));
tryIt('launch creates the pilot', () => nodes.get('create-next').dispatch('click'));
ok('a pilot exists', hasCharacter());
ok('the career hull was issued', S.player.classKey === 'industrial');
ok('simulation running after creation', S.running === true);
// Both counts derived from the tables that declare them, so adding a ship class or a belt
// is not a red suite. See the same change in test/run.mjs.
{
  const { NPC_TYPES } = await import(new URL('src/core/config.js', ROOT).href);
  const wantNpcs = Object.keys(NPC_TYPES).reduce((n, k) => n + (NPC_TYPES[k].count || 0), 0);
  ok('world generated on power-up', S.world.npcs.length === wantNpcs &&
     S.world.asteroids.length === (S.world.belts || []).reduce((n, f) => n + f.count, 0),
     `${S.world.npcs.length}/${wantNpcs} npcs, ${S.world.asteroids.length} rocks`);
}
ok('seed recorded in state', typeof S.seed === 'number');

console.log('\n— hud —');
tryIt('hud updates from a cold state', () => updateHud(0.2, true));
S.player.throttle = -0.2;
S.player.pitch = -0.6;
tryIt('hud handles reverse throttle and negative pitch', () => updateHud(0.2, true));
tryIt('threat banner toggles', () => { setThreat(true); setThreat(false); });
tryIt('ship buttons re-mark', () => markShipButtons());

setTarget(S.world.npcs[0], 'ship', S.world.npcs[0].userData.name, 'hostile');
tryIt('hud renders a ship lock', () => updateHud(0.2, true));
setTarget(S.world.asteroids[0], 'asteroid', S.world.asteroids[0].name, 'rock');
tryIt('hud renders an asteroid lock', () => updateHud(0.2, true));
setTarget(S.world.stations[0], 'station', S.world.stations[0].userData.name, 'neutral');
tryIt('hud renders a station lock', () => updateHud(0.2, true));

console.log('\n— warp visuals —');
S.player.energy = 100;
tryIt('warp engages and paints its overlay', () => { toggleWarp(); updateHud(0.2, true); });
tryIt('warp disengages cleanly', () => { toggleWarp(); updateHud(0.2, true); });

// ── the chart as an observation instrument ──────────────────────────
// It refused to open while docked until v1.02.20, which left a founder who never undocks
// with no way to look at the system they are giving orders about.
console.log('\n— observation chart —');
{
  const SC = await imp('systems/industry/scanner.js');
  const wasDocked = S.docked;

  S.docked = S.world.stations[0];
  tryIt('the chart opens on the pad', () => { openNavmap(); tickNavmap(0.5); });
  ok('the eye is the station, not the ship',
     SC.scanOrigin().from === S.world.stations[0].userData.name, SC.scanOrigin().from);
  ok('the station array reaches further than the hull',
     SC.scanOrigin().range >= 1800, String(SC.scanOrigin().range));
  ok('warp is refused from a pad', nodes.get('navmap-course').disabled === true);
  ok('scanning is not', nodes.get('navmap-scanbtn').disabled !== undefined);
  tryIt('selecting a contact from the pad works', () => {
    nodes.get('navmap-canvas').dispatch('pointerdown', { clientX: 150, clientY: 100 });
  });
  closeNavmap();

  S.docked = null;
  ok('undocked, the eye is the ship again', SC.scanOrigin().from === 'ship');
  S.docked = wasDocked;
}

// ── the executive Ops panel ─────────────────────────────────────────
// Nothing rendered ops.js in any suite before v1.02.10, which is how a fleet list could be
// restructured with only `node --check` behind it. This does not assert layout — it asserts
// that every path through the panel runs, including the disclosure the restructure added.
console.log('\n— ops panel —');
{
  const { openOps, closeOps, tickOps } = await imp('ui/ops.js');
  const FL = await imp('systems/company/fleet.js');
  const { createCharacter } = await imp('systems/crew/character.js');

  tryIt('ops opens on staff with no company at all', () => { openOps('staff'); tickOps(2); });

  tryIt('a founder with a fleet renders', () => {
    createCharacter({ name: 'V', lineage: 'core', corp: 'meridian', career: 'executive' });
    S.company.treasury = 400000;
    S.docked = S.world.stations[0];
    FL.commissionHull('mine');
    openOps('staff');
    tickOps(2);
  });

  tryIt('the details disclosure opens and closes', () => {
    const btns = [...global.document.querySelectorAll('#ops-body button')]
      .filter(b => /DETAILS/.test(b.textContent || ''));
    if (!btns.length) throw new Error('no disclosure button on a fleet of one');
    btns[0].dispatch('click');
    const open = [...global.document.querySelectorAll('#ops-body button')]
      .filter(b => /DETAILS/.test(b.textContent || ''));
    open[0].dispatch('click');
  });

  tryIt('the chart button reaches the nav map', () => {
    openOps('staff');
    const b = [...global.document.querySelectorAll('#ops-body button')]
      .find(x => /SYSTEM CHART/.test(x.textContent || ''));
    if (!b) throw new Error('no chart button on the fleet list');
    b.dispatch('click');
    tickNavmap(0.5);
  });

  tryIt('every ops tab renders', () => {
    for (const t of ['orders', 'ledger', 'staff', 'research']) { openOps(t); tickOps(2); }
    closeOps();
  });

  // Put the pilot back. Creating a founder wipes `ownedHulls` — that is the whole point of
  // the shipless start — and every docking check further down this file undocks a ship.
  // A test block that leaves the world in a state the next block cannot use is a test that
  // fails somebody else's assertion, which is the worst kind to debug.
  S.ownedHulls = { civilian: true, economic: true };
  S.player.classKey = 'civilian';
}

console.log('\n— nav map —');
tryIt('nav map opens and draws', () => { openNavmap(); tickNavmap(0.5); });
tryIt('tapping the chart selects a body', () => {
  nodes.get('navmap-canvas').dispatch('pointerdown', { clientX: 150, clientY: 100 });
});
tryIt('set-course button responds', () => nodes.get('navmap-course').dispatch('click'));
tryIt('nav map reopens for tooling', () => { openNavmap(); tickNavmap(0.5); });
tryIt('filter chips toggle', () => {
  for (const c of global.document.querySelectorAll('#navmap-tools .chip[data-filter]')) c.dispatch('click');
});
tryIt('chart redraws with everything filtered out', () => tickNavmap(0.5));
tryIt('filters restore', () => {
  for (const c of global.document.querySelectorAll('#navmap-tools .chip[data-filter]')) c.dispatch('click');
});
// v1.02.10: the chart is two panes now. A canvas has no size while its pane is hidden, so
// the failure mode this guards is a chart that comes back blank after a trip to Detail —
// which looks like a dead map rather than a layout bug and would be reported as one.
tryIt('the detail pane opens', () => {
  for (const t of global.document.querySelectorAll('#navmap-tabs .tab'))
    if (t.dataset.pane === 'detail') t.dispatch('click');
});
tryIt('ticking while the chart is hidden draws nothing and throws nothing', () => tickNavmap(0.5));
tryIt('the chart pane comes back and redraws', () => {
  for (const t of global.document.querySelectorAll('#navmap-tabs .tab'))
    if (t.dataset.pane === 'chart') t.dispatch('click');
  tickNavmap(0.5);
});
tryIt('the key toggles on and off', () => {
  nodes.get('navmap-legendbtn').dispatch('click');
  nodes.get('navmap-legendbtn').dispatch('click');
});

tryIt('zoom controls respond', () => {
  nodes.get('navmap-zoom-in').dispatch('click');
  nodes.get('navmap-zoom-in').dispatch('click');
  nodes.get('navmap-zoom-out').dispatch('click');
  nodes.get('navmap-recenter').dispatch('click');
});
tryIt('drag pans the chart', () => {
  const c = nodes.get('navmap-canvas');
  c.dispatch('pointerdown', { pointerId: 11, clientX: 40, clientY: 40 });
  c.dispatch('pointermove', { pointerId: 11, clientX: 90, clientY: 70 });
  c.dispatch('pointerup', { pointerId: 11, clientX: 90, clientY: 70 });
});
tryIt('pinch zooms the chart', () => {
  const c = nodes.get('navmap-canvas');
  c.dispatch('pointerdown', { pointerId: 12, clientX: 60, clientY: 60 });
  c.dispatch('pointerdown', { pointerId: 13, clientX: 120, clientY: 120 });
  c.dispatch('pointermove', { pointerId: 13, clientX: 200, clientY: 200 });
  c.dispatch('pointerup', { pointerId: 13 });
  c.dispatch('pointerup', { pointerId: 12 });
});
tryIt('tap selects again after panning', () => {
  const c = nodes.get('navmap-canvas');
  c.dispatch('pointerdown', { pointerId: 14, clientX: 150, clientY: 100 });
  c.dispatch('pointerup', { pointerId: 14, clientX: 150, clientY: 100 });
});
tryIt('scan button responds', () => nodes.get('navmap-scanbtn').dispatch('click'));
tryIt('orbit menu opens and closes', () => {
  nodes.get('navmap-orbit').dispatch('click');
  nodes.get('navmap-orbit').dispatch('click');
});
tryIt('nav map closes', () => closeNavmap());

console.log('\n— target actions & hail —');
const { openHail, hailOpen, updateApproach } = await imp('systems/flight/approach.js');
setTarget(S.world.asteroids[3], 'asteroid', S.world.asteroids[3].name, 'rock');
tryIt('approach button responds', () => nodes.get('target-approach').dispatch('click'));
tryIt('match button responds', () => nodes.get('target-match').dispatch('click'));
tryIt('expand drawer toggles', () => { nodes.get('target-expand').dispatch('click'); updateHud(0.2, true); });
tryIt('scan/probe respond (denied out of orbit)', () => {
  // Any planet, not a named one. As of v1.02.33 this suite boots main.js the way the
  // browser does, which means it lands in a *generated* system — there is no Gaia in it,
  // and a `find` by name was quietly passing `undefined` into setTarget.
  const anyPlanet = S.world.bodies.find(b => b.userData.kind === 'planet');
  setTarget(anyPlanet, 'planet', anyPlanet.userData.name, 'neutral');
  nodes.get('target-scan').dispatch('click');
  nodes.get('target-probe').dispatch('click');
});
const hailSt = S.world.stations[1];
tryIt('hail overlay opens', () => openHail(hailSt));
ok('hail state tracks', hailOpen() === true);
tryIt('break-off closes the hail', () => nodes.get('hail-break').dispatch('click'));
ok('hail closed', hailOpen() === false);
tryIt('docking clearance starts the tractor', () => {
  openHail(hailSt);
  nodes.get('hail-dock').dispatch('click');
});
ok('tractor engaged', !!S.docking);
tryIt('tractor completes into dock', () => { for (let i = 0; i < 80; i++) updateApproach(0.1); });
ok('docked via tractor', S.docked === hailSt);
tryIt('undock from tractor dock', () => nodes.get('dock-undock').dispatch('click'));
ok('clear of station', S.docked === null);

console.log('\n— station ui —');
S.cargo.ore = 400; S.cargo.salvage = 120; S.credits = 20000;
S.player.hull = 20; S.player.armor = 10;
dock(S.world.stations[3]);
tryIt('dock panel opens on the trade tab', () => openDock());
for (const t of global.document.querySelectorAll('#dock-tabs .tab')) {
  tryIt(`${t.dataset.tab} tab renders`, () => t.dispatch('click'));
}
tryIt('undock button responds', () => nodes.get('dock-undock').dispatch('click'));
ok('undocked', S.docked === null);
closeDock();

console.log('\n— contact tabs —');
{
  const tabs = global.document.querySelectorAll('#contact-tabs .ctab');
  ok('five contact buckets exist', tabs.length === 5, String(tabs.length));
  for (const t of tabs) tryIt(`${t.dataset.cat} bucket renders`, () => { t.dispatch('click'); updateHud(0.3, true); });
  tryIt('back to the combined view', () => tabs[0].dispatch('click'));
}

console.log('\n— ship fit —');
const { openFit, closeFit, fitOpen } = await imp('ui/fitting.js');
{
  S.credits = 90000;
  tryIt('fit overlay opens', () => nodes.get('btn-fit').dispatch('click'));
  ok('fit overlay tracks state', fitOpen() === true);
  for (const t of global.document.querySelectorAll('#fit-tabs .tab'))
    tryIt(`${t.dataset.fittab} tab renders`, () => t.dispatch('click'));
  tryIt('back to hardpoints', () => global.document.querySelectorAll('#fit-tabs .tab')[0].dispatch('click'));
  tryIt('fit overlay closes', () => nodes.get('fit-close').dispatch('click'));
  ok('fit overlay closed', fitOpen() === false);
}

console.log('\n— crew quarters —');
const { openCrew, crewOpen } = await imp('ui/crew.js');
const { initCrew } = await imp('systems/crew/crew.js');
{
  initCrew();
  tryIt('crew overlay opens', () => nodes.get('btn-crew').dispatch('click'));
  ok('crew overlay tracks state', crewOpen() === true);
  for (const t of global.document.querySelectorAll('#crew-tabs .tab'))
    tryIt(`${t.dataset.crewtab} tab renders`, () => t.dispatch('click'));
  tryIt('crew overlay closes', () => nodes.get('crew-close').dispatch('click'));
  ok('crew overlay closed', crewOpen() === false);
}

console.log('\n— ARIA assistant —');
const { ask, modelReady } = await imp('systems/npc/assistant.js');
ok('starts in rule-based mode (no model)', modelReady() === false);
tryIt('aria opens', () => nodes.get('btn-aria').dispatch('click'));
{
  S.player.hull = 40; S.credits = 3210; S.cargo.ore = 250;
  // As of 0.10 this routes through the status *tool* rather than the phrase matcher, so
  // it reports a percentage of maximum rather than the raw number — which is the more
  // useful answer, and the reason tools run before the model.
  const hull = await ask('how is my hull?');
  ok('answers hull with a real number', /\d+%/.test(hull) && hull.length > 10, hull);
  ok('the hull answer is the status instrument', /shields?/i.test(hull), hull);
  const money = await ask('how much money do I have?');
  ok('answers credits', /3,?210/.test(money), money);
  const sell = await ask('where should I sell?');
  ok('answers trade with a station', /station|hub|nav/i.test(sell), sell);
  const belt = await ask('tell me about the belt');
  // Routed through the findBelt instrument as of 0.10: it names the field and its range
  // and targets it, rather than describing rocks in prose.
  // Names a real field and gives a range. It used to match /belt/, which only worked while
  // every field in the game was called "… Belt" — a generated system's fields are Reaches
  // and Rimes, and a planetary ring never was a Belt in the first place.
  const fieldNames = (S.world.belts || []).map(b => b.name);
  ok('answers belt with a name and a distance',
     fieldNames.some(n => belt.includes(n)) && /out/i.test(belt), belt);
  const threat = await ask('any pirates around?');
  ok('answers threats', /hostile|ambush|sensor|running|nothing/i.test(threat), threat);
  const empty = await ask('');
  ok('empty question is safe', typeof empty === 'string');
}
tryIt('send box wires up', () => { nodes.get('aria-input').value = 'help'; nodes.get('aria-send').dispatch('click'); });
tryIt('aria closes', () => nodes.get('aria-close').dispatch('click'));

console.log('\n— controls —');
const canvas = nodes.get('game-canvas');

// The ops section above left an *executive* on the character sheet, and as of v1.02.31
// that is a character who cannot fly. The order is deliberate: assert the lock while it
// is still in force, then put a pilot back for the flight-control checks below. Before
// the lock existed this suite was silently steering a founder's non-existent hull.
{
  const { canPilot, isExecutive } = await imp('systems/company/career.js');
  ok('the founder left by the ops section is an executive', isExecutive());
  ok('an executive holds no flight licence', canPilot() === false);

  const lockYaw = S.player.yaw, lockPitch = S.player.pitch;
  tryIt('a drag on the canopy is refused for an executive', () => {
    canvas.dispatch('pointerdown', { pointerId: 91, clientX: 100, clientY: 100 });
    canvas.dispatch('pointermove', { pointerId: 91, clientX: 220, clientY: 220 });
    canvas.dispatch('pointerup', { pointerId: 91 });
  });
  ok('the executive drag moved nothing',
     S.player.yaw === lockYaw && S.player.pitch === lockPitch);
  ok('and left no drag flag behind', S.input.dragging === false);

  const { createCharacter } = await imp('systems/crew/character.js');
  createCharacter({ name: 'V', lineage: 'core', corp: 'meridian', career: 'prospector' });
  ok('a prospector is licensed to fly', canPilot() === true);
}

const yaw0 = S.player.yaw;
tryIt('drag steers the ship', () => {
  canvas.dispatch('pointerdown', { pointerId: 1, clientX: 100, clientY: 100 });
  canvas.dispatch('pointermove', { pointerId: 1, clientX: 160, clientY: 130 });
  canvas.dispatch('pointerup', { pointerId: 1 });
});
ok('yaw changed from the drag', S.player.yaw !== yaw0);
ok('drag flag released', S.input.dragging === false);

tryIt('fire button holds and releases', () => {
  const b = nodes.get('btn-fire');
  b.dispatch('pointerdown', { pointerId: 2 });
  b.dispatch('pointerup', { pointerId: 2 });
});
ok('fire flag released', S.input.firing === false);

tryIt('throttle slider drags', () => {
  const t = nodes.get('speed-track');
  t.dispatch('pointerdown', { pointerId: 3, clientX: 300, clientY: 10 });
  t.dispatch('pointerup', { pointerId: 3 });
});
ok('throttle went to full from a right-edge drag', S.player.throttle > 0.9, String(S.player.throttle));

// The pitch slider is gone — pitch is drag-only, read out beside the crosshair.
S.player.pitch = 0;
tryIt('vertical drag pitches the nose', () => {
  canvas.dispatch('pointerdown', { pointerId: 4, clientX: 100, clientY: 300 });
  canvas.dispatch('pointermove', { pointerId: 4, clientX: 100, clientY: 100 });
  canvas.dispatch('pointerup', { pointerId: 4 });
});
ok('drag up raised the nose', S.player.pitch > 0, S.player.pitch.toFixed(2));
// A target the HUD can actually draw. This caught a double-wrapped descriptor from the
// ARIA belt instrument, which failed silently here and loudly three panels later.
ok('the belt target has a position', !!(S.target && S.target.obj && S.target.obj.position));
tryIt('pitch readout updates', () => updateHud(0.2, true));
ok('pitch readout carries a sign', /[+-]/.test(nodes.get('pitch-num').textContent),
   nodes.get('pitch-num').textContent);

tryIt('assist toggle responds', () => nodes.get('btn-assist').dispatch('click'));
ok('assist flipped off', S.settings.assist === false);
tryIt('sound toggle responds', () => nodes.get('btn-audio').dispatch('click'));
tryIt('save button responds', () => nodes.get('btn-save').dispatch('click'));
tryIt('cycle-target button responds', () => nodes.get('btn-cycle').dispatch('click'));
tryIt('chase cam toggle responds', () => nodes.get('btn-cam').dispatch('click'));
ok('chase mode flipped on', S.settings.chase === true);
tryIt('player updates in chase mode', async () => {
  const { updatePlayer } = await imp('entities/player.js');
  updatePlayer(1 / 60);
});
nodes.get('btn-cam').dispatch('click');
tryIt('level button responds', () => nodes.get('btn-level').dispatch('click'));
ok('level requested', S.player.autoLevel === true);
tryIt('preset buttons respond', () => {
  for (const b of global.document.querySelectorAll('.preset-btn')) b.dispatch('click');
});
ok('last preset set full throttle', S.player.throttle === 1, String(S.player.throttle));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
