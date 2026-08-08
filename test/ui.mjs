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
const { dock } = await imp('systems/economy.js');
const { setTarget } = await imp('systems/targeting.js');
const { toggleWarp } = await imp('systems/warp.js');

ok('LG debug handle exposed', !!global.window.LG && !!global.window.LG.S);
ok('world deferred until power-up', S.world.npcs.length === 0);

console.log('\n— boot overlay —');
tryIt('power-up button responds', () => nodes.get('boot-start').dispatch('click'));
// A fresh flight now stops at character creation rather than launching straight into the
// world — a ship with nobody in it is not a game state we want to be able to reach.
ok('creation opens for a pilotless flight', S.running === false);

console.log('\n— character creation —');
const { hasCharacter } = await imp('systems/character.js');
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
const { openHail, hailOpen, updateApproach } = await imp('systems/approach.js');
setTarget(S.world.asteroids[3], 'asteroid', S.world.asteroids[3].name, 'rock');
tryIt('approach button responds', () => nodes.get('target-approach').dispatch('click'));
tryIt('match button responds', () => nodes.get('target-match').dispatch('click'));
tryIt('expand drawer toggles', () => { nodes.get('target-expand').dispatch('click'); updateHud(0.2, true); });
tryIt('scan/probe respond (denied out of orbit)', () => {
  setTarget(S.world.bodies.find(b => b.userData.name === 'Gaia'), 'planet', 'Gaia', 'neutral');
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
const { initCrew } = await imp('systems/crew.js');
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
const { ask, modelReady } = await imp('systems/assistant.js');
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
  ok('answers belt with a name and a distance', /belt/i.test(belt) && /out/i.test(belt), belt);
  const threat = await ask('any pirates around?');
  ok('answers threats', /hostile|ambush|sensor|running|nothing/i.test(threat), threat);
  const empty = await ask('');
  ok('empty question is safe', typeof empty === 'string');
}
tryIt('send box wires up', () => { nodes.get('aria-input').value = 'help'; nodes.get('aria-send').dispatch('click'); });
tryIt('aria closes', () => nodes.get('aria-close').dispatch('click'));

console.log('\n— controls —');
const canvas = nodes.get('game-canvas');
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
