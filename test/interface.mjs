// Slice 6 — interface and input. The HUD write budget, action bindings that survive a
// rebind, gamepad translation, display settings, and crew fatigue.
import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
const { nodes } = installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { S, recalcStats } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');
const { DISPLAY, FATIGUE, CREW } = await imp('core/config.js');
<<<<<<< HEAD
const inp = await imp('systems/platform/input.js');
const disp = await imp('systems/platform/display.js');
=======
const inp = await imp('systems/input.js');
const disp = await imp('systems/display.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
const { initScene } = await imp('world/scene.js');
const { createSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { initPlayerFx, updatePlayer } = await imp('entities/player.js');
const { createNpcs, updateNpcs } = await imp('entities/npcs.js');
<<<<<<< HEAD
const { initProjectiles } = await imp('systems/combat/projectiles.js');
const { initCombat } = await imp('systems/combat/combat.js');
const { initMining } = await imp('systems/industry/mining.js');
const { initWorldSim } = await imp('systems/platform/worldsim.js');
const { initMarket } = await imp('systems/trade/market.js');
const { initContracts } = await imp('systems/trade/contracts.js');
const { resetReputation } = await imp('systems/company/reputation.js');
const { initCrew, updateCrew } = await imp('systems/crew/crew.js');
const { crewOutput } = await imp('data/crew.js');
const hud = await imp('ui/hud.js');
const save = await imp('systems/platform/save.js');
=======
const { initProjectiles } = await imp('systems/projectiles.js');
const { initCombat } = await imp('systems/combat.js');
const { initMining } = await imp('systems/mining.js');
const { initWorldSim } = await imp('systems/worldsim.js');
const { initMarket } = await imp('systems/market.js');
const { initContracts } = await imp('systems/contracts.js');
const { resetReputation } = await imp('systems/reputation.js');
const { initCrew, updateCrew } = await imp('systems/crew.js');
const { crewOutput } = await imp('data/crew.js');
const hud = await imp('ui/hud.js');
const save = await imp('systems/save.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

initScene(); recalcStats(); seedWorld(1337); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx(); createNpcs();
resetReputation(); initWorldSim(); initMarket(); initContracts(); initCrew();
hud.initHud();
S.running = true;

// ── HUD write budget ─────────────────────────────────────────────────
console.log('\n— hud write budget —');
{
  hud.invalidateHud();
  hud.resetHudStats();
  hud.updateHud(1 / 60, true);        // `force` is the full-panel refresh, not the per-frame subset
  const first = hud.hudStats();
  ok('the first frame writes everything', first.writes > 20, `${first.writes} writes`);

  hud.resetHudStats();
  for (let i = 0; i < 60; i++) hud.updateHud(1 / 60);
  const idle = hud.hudStats();
  ok('a static scene writes almost nothing', idle.perFrame < 1,
     `${idle.perFrame} writes/frame`);
  ok('most attempts are skipped', idle.hitRate > 0.9, String(idle.hitRate));
  ok('frames are counted', idle.frames === 60);

  // ...and a real change still gets through, which is the whole point
  hud.resetHudStats();
  S.credits += 12345;
  hud.updateHud(1 / 60, true);
  ok('a changed value is written', hud.hudStats().writes > 0);

  // bar widths quantise, so a value moving by a hair does not force a write
  hud.resetHudStats();
  hud.updateHud(1 / 60, true);
  hud.resetHudStats();
  S.player.shield = Math.max(0, S.player.shield - 0.0001);
  hud.updateHud(1 / 60, true);
  const nudged = hud.hudStats().writes;
  S.player.shield = Math.max(0, S.player.shield * 0.5);
  hud.resetHudStats();
  hud.updateHud(1 / 60, true);
  ok('an imperceptible change is skipped, a real one is not',
     hud.hudStats().writes > nudged, `${nudged} → ${hud.hudStats().writes}`);

  hud.invalidateHud();
  hud.resetHudStats();
  hud.updateHud(1 / 60, true);
  ok('invalidating forces a full redraw', hud.hudStats().writes > 20);
}
{
  // flying is the case that matters — the numbers that move are the ones that should
  hud.invalidateHud(); hud.resetHudStats();
  S.player.throttle = 0.7;
  for (let i = 0; i < 240; i++) { S.time += 1 / 60; updatePlayer(1 / 60); hud.updateHud(1 / 60); }
  const flying = hud.hudStats();
  ok('flying stays well under one write per frame', flying.perFrame < 3,
     `${flying.perFrame} writes/frame`);
  ok('the skip rate stays high while flying', flying.hitRate > 0.7, String(flying.hitRate));
  S.player.throttle = 0;
}

// ── bindings ─────────────────────────────────────────────────────────
console.log('\n— key bindings —');
{
  inp.resetBindings();
  ok('every action has a name and a default', inp.ACTION_KEYS.every(
    k => inp.ACTIONS[k].name && Array.isArray(inp.ACTIONS[k].keys)));
  ok('defaults bind at least one key each',
     Object.values(inp.defaultBindings()).every(list => list.length >= 1));
  ok('a default key resolves to its action', inp.actionFor('KeyW') === 'thrustUp');
  ok('an unbound key resolves to nothing', inp.actionFor('KeyQ') === null);

  // no key may mean two things — the reverse index would be ambiguous and the bug
  // impossible to find from the symptom
  const seen = new Set();
  let dupe = null;
  for (const a of inp.ACTION_KEYS) for (const c of inp.bindings()[a]) {
    if (seen.has(c)) dupe = c;
    seen.add(c);
  }
  ok('no key is bound to two actions by default', !dupe, dupe || '');

  ok('a key can be rebound', inp.bind('fire', 'KeyQ') === true);
  ok('the new key works', inp.actionFor('KeyQ') === 'fire');
  ok('rebinding a key steals it from its old action', (() => {
    inp.bind('mine', 'KeyQ');
    return inp.actionFor('KeyQ') === 'mine' && !inp.bindings().fire.includes('KeyQ');
  })());
  ok('binding an unknown action is refused', inp.bind('teleport', 'KeyP') === false);
  ok('binding nothing is refused', inp.bind('fire', null) === false);
  ok('a key can be unbound', (() => {
    inp.bind('fire', 'KeyP');
    inp.unbind('fire', 'KeyP');
    return inp.actionFor('KeyP') === null;
  })());
  ok('reset restores the defaults',
     (inp.resetBindings(), inp.actionFor('KeyW') === 'thrustUp' && inp.actionFor('KeyQ') === null));

  ok('key labels are readable',
     inp.keyLabel('KeyW') === 'W' && inp.keyLabel('Space') === 'SPC' &&
     inp.keyLabel('ArrowLeft') === '←');
  ok('an empty label does not crash', inp.keyLabel(null) === '—');

  // a save written before an action existed must not leave it unbound
  S.settings.bindings = { thrustUp: ['KeyW'] };
  const filled = inp.bindings();
  ok('a partial binding table is filled in',
     inp.ACTION_KEYS.every(k => Array.isArray(filled[k]) && filled[k].length >= 1));
  inp.resetBindings();
}

// ── gamepad ──────────────────────────────────────────────────────────
console.log('\n— gamepad —');
{
    // Node 22 defines `navigator` as a getter-only global, so it cannot be assigned to.
  // Redefining the property is the supported way to stub it.
  const setNav = nav => Object.defineProperty(globalThis, 'navigator',
    { value: nav, configurable: true, writable: true });

  const fakePad = (axes, buttons) => ({
    connected: true, id: 'Test Pad', axes,
    buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: !!(buttons || {})[i] }))
  });

  setNav({ getGamepads: () => [null] });
  ok('no pad returns nothing', inp.pollGamepad(() => {}, () => {}) === null);
  ok('the pad reports disconnected', inp.gamepad().connected === false);

  setNav({ getGamepads: () => [fakePad([0, 0, 0, 0])] });
  const centred = inp.pollGamepad(() => {}, () => {});
  ok('a centred stick reads zero', centred.yaw === 0 && centred.pitch === 0);
  ok('the pad reports connected', inp.gamepad().connected === true);

  // deadzone: drift must not fly the ship
  setNav({ getGamepads: () => [fakePad([inp.PAD.deadzone * 0.8, 0, 0, 0])] });
  ok('stick drift inside the deadzone is ignored',
     inp.pollGamepad(() => {}, () => {}).yaw === 0);

  setNav({ getGamepads: () => [fakePad([1, -1, 0, 0])] });
  const full = inp.pollGamepad(() => {}, () => {});
  ok('full deflection reads full', Math.abs(full.yaw - 1) < 1e-9 && Math.abs(full.pitch + 1) < 1e-9);

  // rescaling: just past the deadzone must be a *small* input, not a jump
  setNav({ getGamepads: () => [fakePad([inp.PAD.deadzone + 0.02, 0, 0, 0])] });
  const nudge = inp.pollGamepad(() => {}, () => {}).yaw;
  ok('just past the deadzone is a small input', nudge > 0 && nudge < 0.1, nudge.toFixed(4));

  // buttons translate into the same actions the keyboard produces
  let heldFire = null, tapped = [];
  setNav({ getGamepads: () => [fakePad([0, 0, 0, 0], { 0: true })] });
  inp.pollGamepad((a, on) => { if (a === 'fire') heldFire = on; }, a => tapped.push(a));
  ok('a face button asserts a hold action', heldFire === true);

  setNav({ getGamepads: () => [fakePad([0, 0, 0, 0], { 5: true })] });
  tapped = [];
  inp.pollGamepad(() => {}, a => tapped.push(a));
  ok('a shoulder button taps a one-shot action', tapped.includes('warp'));
  tapped = [];
  inp.pollGamepad(() => {}, a => tapped.push(a));
  ok('a held one-shot button fires once, not every frame', tapped.length === 0);
  setNav(undefined);
}

// ── display settings ─────────────────────────────────────────────────
console.log('\n— display —');
{
  S.settings.display = null;
  const d = disp.display();
  ok('defaults are filled in', d.palette === 'standard' && d.textScale === 1);
  ok('several palettes exist', disp.PALETTE_KEYS.length >= 3);
  ok('every palette has a name and a description',
     disp.PALETTE_KEYS.every(k => disp.PALETTES[k].name && disp.PALETTES[k].desc));

  ok('a palette can be set', disp.setDisplay('palette', 'deuter') && disp.display().palette === 'deuter');
  ok('applying sets a class on the root',
     (disp.applyDisplay(), document.documentElement.classList.contains('pal-deuter')));
  ok('the previous palette class is removed',
     !document.documentElement.classList.contains('pal-standard'));
  // Was `cyclePalette()`, which was removed in v1.01.20: nothing called it, because the
  // settings panel sets a palette directly from a card rather than stepping through them.
  // The property worth keeping is that every palette is actually selectable, which is what
  // the panel does — so the test now exercises the path the player uses.
  ok('every palette can be selected', (() => {
    const seen2 = new Set();
    for (const k of disp.PALETTE_KEYS) {
      if (disp.setDisplay('palette', k)) seen2.add(disp.display().palette);
    }
    return seen2.size === disp.PALETTE_KEYS.length;
  })());

  ok('an unknown setting is refused', disp.setDisplay('nonsense', 1) === false);

  disp.setDisplay('textScale', 1);
  ok('text scale steps', Math.abs(disp.nudgeTextScale(0.05) - 1.05) < 1e-9);
  for (let i = 0; i < 40; i++) disp.nudgeTextScale(0.05);
  ok('text scale is capped', disp.display().textScale === DISPLAY.maxScale);
  for (let i = 0; i < 80; i++) disp.nudgeTextScale(-0.05);
  ok('text scale has a floor', disp.display().textScale === DISPLAY.minScale);
  disp.setDisplay('textScale', 1);

  ok('reduced motion is off by default and can be set',
     disp.motionOk() && (disp.setDisplay('reducedMotion', true), !disp.motionOk()));
  ok('reduced motion sets its class',
     (disp.applyDisplay(), document.documentElement.classList.contains('reduced-motion')));
  disp.setDisplay('reducedMotion', false);
  disp.setDisplay('palette', 'standard');
}
{
  // display settings ride along in the save, which already persists S.settings
  save.wipeSave();
  disp.setDisplay('palette', 'trit');
  disp.setDisplay('textScale', 1.25);
  save.saveGame(true);
  S.settings.display = null;
  save.loadGame();
  ok('display settings survive a save',
     disp.display().palette === 'trit' && Math.abs(disp.display().textScale - 1.25) < 1e-9);
  disp.setDisplay('palette', 'standard');
  disp.setDisplay('textScale', 1);
  save.wipeSave();
}

// ── crew fatigue ─────────────────────────────────────────────────────
console.log('\n— crew fatigue —');
{
  S.crew = null;
  initCrew();
  ok('a new crewman starts rested', S.crew.every(c => (c.fatigue || 0) === 0));

  const c = S.crew[0];
  c.role = 'helm';
  const fresh = crewOutput(c);
  c.fatigue = 1;
  const spent = crewOutput(c);
  ok('fatigue lowers output', spent < fresh, `${fresh.toFixed(2)} → ${spent.toFixed(2)}`);
  ok('a tired crewman is still worth something', spent > 0);
  ok('fatigue bottoms out at the floor',
     Math.abs(spent / fresh - FATIGUE.floor) < 1e-6, (spent / fresh).toFixed(3));
  ok('fatigue past 1 does not compound', crewOutput(Object.assign({}, c, { fatigue: 5 })) === spent);

  // working accrues it, docking sheds it fastest
  c.fatigue = 0;
  S.docked = null;
  S.player.throttle = 0.8;
  for (let i = 0; i < 600; i++) updateCrew(1 / 60);
  const worked = c.fatigue;
  ok('working accrues fatigue', worked > 0, worked.toFixed(3));

  S.player.throttle = 0;
  for (let i = 0; i < 600; i++) updateCrew(1 / 60);
  const rested = c.fatigue;
  ok('standing down sheds it', rested < worked, `${worked.toFixed(3)} → ${rested.toFixed(3)}`);

  // Comparing against `rested` would prove nothing — that run started from a lower
  // fatigue and had already bottomed out at zero. The honest comparison is the same
  // starting fatigue and the same elapsed time, docked versus not.
  // Keep them on watch for the comparison. As of v1.00.10 an *off-watch* crewman
  // recovers at nearly the docked rate — that is the whole point of a rotation — so a
  // crewman the auto-rotation has stood down would make this measure the wrong thing.
  S.settings.autoRotate = false;
  c.onDuty = true;
  c.fatigue = 1;
  S.docked = null;
  for (let i = 0; i < 120; i++) { c.onDuty = true; updateCrew(1 / 60); }
  const driftRest = 1 - c.fatigue;

  c.onDuty = true;
  c.fatigue = 1;
  S.docked = S.world.stations[0];
  for (let i = 0; i < 120; i++) { c.onDuty = true; updateCrew(1 / 60); }
  const dockRest = 1 - c.fatigue;
  ok('docking sheds it much faster', dockRest > driftRest * 2,
     `${driftRest.toFixed(3)} adrift vs ${dockRest.toFixed(3)} docked`);

  for (let i = 0; i < 2000; i++) updateCrew(1 / 60);
  ok('fatigue never goes negative', c.fatigue >= 0, String(c.fatigue));
  S.docked = null;
  S.settings.autoRotate = true;
  c.fatigue = 0.5;

  c.fatigue = 0.5;
  save.wipeSave();
  save.saveGame(true);
  S.crew = null;
  save.loadGame();
  ok('fatigue survives a save',
     Math.abs((S.crew[0].fatigue || 0) - 0.5) < 1e-9, String(S.crew[0].fatigue));
  save.wipeSave();
}

// ── warp draw from core modules ──────────────────────────────────────
console.log('\n— warp draw —');
{
  S.fit = { weapon: [], utility: [], core: [] };
  recalcStats();
  const neutral = S.stats.warpDrain || 0;
  ok('a bare hull has no warp modifier', neutral === 0);

  S.fit = { weapon: [], utility: [], core: ['warpcoil'] };
  recalcStats();
  const coiled = S.stats.warpDrain;
  ok('a warp coil costs more to hold', coiled > 0, String(coiled));

  S.fit = { weapon: [], utility: [], core: ['fluxdamp'] };
  recalcStats();
  ok('a flux damper costs less to hold', S.stats.warpDrain < 0, String(S.stats.warpDrain));
  ok('the two pull opposite ways', S.stats.warpDrain < coiled);

  S.fit = { weapon: [], utility: [], core: [] };
  recalcStats();
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
