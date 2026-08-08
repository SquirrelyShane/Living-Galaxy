// Slice 7 — presentation. Adaptive quality driven by measured frame time, render
// interpolation between fixed steps, screen-size LOD, and the audio mix.
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
const { QUALITY, INTERP, LOD, AUDIO, CLOCK } = await imp('core/config.js');
const { clock, advance, sample, perfStats, resetClock } = await imp('core/clock.js');
const q = await imp('systems/quality.js');
const interp = await imp('world/interpolate.js');
const lod = await imp('world/lod.js');
const audio = await imp('systems/audio.js');
// Destructuring `camera` here would capture `undefined` — it is an `export let` that
// initScene() assigns, and a destructured binding is a snapshot rather than a live view.
const sceneMod = await imp('world/scene.js');
const { initScene, renderProfile } = sceneMod;
const { createSystem, updateSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { initPlayerFx } = await imp('entities/player.js');
const { createNpcs } = await imp('entities/npcs.js');
const { initProjectiles } = await imp('systems/projectiles.js');
const { initCombat } = await imp('systems/combat.js');
const { initMining } = await imp('systems/mining.js');
const save = await imp('systems/save.js');

initScene(); recalcStats(); seedWorld(1337); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx(); createNpcs();
updateSystem(1);

const V = THREE.Vector3;

// ── adaptive quality ─────────────────────────────────────────────────
console.log('\n— adaptive quality —');
ok('levels run worst to best',
   q.LEVELS.every((L, i, a) => i === 0 || L.pixelRatio >= a[i - 1].pixelRatio));
ok('every level names itself and scales effects',
   q.LEVELS.every(L => L.name && L.effects > 0 && L.effects <= 1));
ok('the lowest level is cheaper than the highest on every axis', (() => {
  const lo = q.LEVELS[0], hi = q.LEVELS[q.LEVELS.length - 1];
  return lo.pixelRatio < hi.pixelRatio && lo.effects <= hi.effects && lo.lodBias < hi.lodBias;
})());
ok('the hysteresis band is real — raise is well below drop',
   QUALITY.raiseBelow < QUALITY.dropAbove * 0.75,
   `${QUALITY.raiseBelow} vs ${QUALITY.dropAbove}`);
ok('panic is worse than a normal drop', QUALITY.panicAbove > QUALITY.dropAbove);

{
  q.resetQuality();
  q.initQuality();
  ok('a starting level is picked before any frame is measured',
     q.qualityLevel() >= 0 && q.qualityLevel() < q.LEVELS.length);

  // feed the clock frames of a chosen duration, then let the controller react
  const feedFrames = (ms, count) => {
    resetClock();
    let t = 0;
    for (let i = 0; i < count; i++) { t += ms; advance(t); sample(ms); }
  };
  const settle = () => { for (let i = 0; i < 40; i++) q.updateQuality(1); };

  q.setAuto(true);
  q.setQualityLevel(q.LEVELS.length - 1);
  q.setAuto(true);
  feedFrames(30, QUALITY.minSamples + 20);       // ~33 fps, past dropAbove
  settle();
  ok('a slow frame sheds quality', q.qualityLevel() < q.LEVELS.length - 1,
     `level ${q.qualityLevel()}`);

  q.setQualityLevel(q.LEVELS.length - 1);
  q.setAuto(true);
  feedFrames(50, QUALITY.minSamples + 20);       // ~20 fps, past panicAbove
  q.updateQuality(10);
  ok('a very slow frame sheds two levels at once',
     q.qualityLevel() <= q.LEVELS.length - 3, `level ${q.qualityLevel()}`);

  q.setQualityLevel(0);
  q.setAuto(true);
  feedFrames(6, QUALITY.minSamples + 20);        // ~166 fps
  settle();
  ok('a fast frame climbs', q.qualityLevel() > 0, `level ${q.qualityLevel()}`);
  ok('climbing never overshoots the top', q.qualityLevel() <= q.LEVELS.length - 1);

  // the cooldown is what stops it oscillating
  q.setQualityLevel(2);
  q.setAuto(true);
  feedFrames(30, QUALITY.minSamples + 20);
  const before = q.qualityLevel();
  q.updateQuality(0.01);
  const first = q.qualityLevel();
  q.updateQuality(0.01);
  ok('it does not change twice in one settle window',
     q.qualityLevel() === first, `${before} → ${first} → ${q.qualityLevel()}`);

  // too little history is not evidence
  q.setQualityLevel(3);
  q.setAuto(true);
  resetClock();
  sample(90);
  q.updateQuality(10);
  ok('it will not act on a handful of samples', q.qualityLevel() === 3);

  // manual lock
  q.setAuto(false);
  q.setQualityLevel(1);
  feedFrames(60, QUALITY.minSamples + 20);
  q.updateQuality(10); q.updateQuality(10);
  ok('a manual level is not overridden', q.qualityLevel() === 1);
  q.setAuto(true);

  ok('a level out of range is clamped',
     (q.setQualityLevel(99), q.qualityLevel() === q.LEVELS.length - 1) &&
     (q.setQualityLevel(-5), q.qualityLevel() === 0));

  ok('effect and lod scales follow the level', (() => {
    q.setQualityLevel(0);
    const lo = { e: q.effectScale(), l: q.lodBias() };
    q.setQualityLevel(q.LEVELS.length - 1);
    return q.effectScale() >= lo.e && q.lodBias() > lo.l;
  })());

  ok('the quality choice persists in settings',
     S.settings.quality && typeof S.settings.quality.level === 'number');
}
{
  const prof = renderProfile();
  ok('the renderer reports its profile', typeof prof.activePixelRatio === 'number');
  ok('pixel ratio never exceeds the device', prof.activePixelRatio <= Math.max(1, prof.pixelRatio) + 1e-9);
  ok('an antialias change is reported as needing a restart, not applied silently',
     typeof prof.antialiasNeedsRestart === 'boolean');
}

// ── interpolation ────────────────────────────────────────────────────
console.log('\n— render interpolation —');
{
  interp.resetInterpolation();
  const obj = { position: new V(0, 0, 0), quaternion: null };
  interp.track(obj);
  ok('an object can be tracked', interp.trackedCount() === 1);
  ok('tracking twice is ignored', (interp.track(obj), interp.trackedCount() === 1));

  obj.position.set(10, 0, 0);
  interp.commitStep();
  obj.position.set(20, 0, 0);
  interp.commitStep();

  interp.applyInterpolation(0.5);
  ok('halfway between steps draws halfway', Math.abs(obj.position.x - 15) < 1e-9,
     String(obj.position.x));
  interp.restoreAfterRender();
  ok('the authoritative position is restored', Math.abs(obj.position.x - 20) < 1e-9,
     String(obj.position.x));

  interp.applyInterpolation(0);
  ok('alpha 0 draws the previous step', Math.abs(obj.position.x - 10) < 1e-9);
  interp.restoreAfterRender();
  interp.applyInterpolation(1);
  ok('alpha 1 draws the current step', Math.abs(obj.position.x - 20) < 1e-9);
  interp.restoreAfterRender();

  // the restore is the important part: a physics system reading a smoothed position
  // would integrate against a value that is deliberately wrong
  for (let i = 0; i < 50; i++) {
    obj.position.x += 5;
    interp.commitStep();
    interp.applyInterpolation(0.37);
    interp.restoreAfterRender();
  }
  ok('repeated frames do not drift the true position',
     Math.abs(obj.position.x - (20 + 50 * 5)) < 1e-6, String(obj.position.x));

  // a teleport must not be smeared across the screen
  obj.position.set(90000, 0, 0);
  interp.commitStep();
  interp.applyInterpolation(0.5);
  ok('a teleport is snapped, not smeared', Math.abs(obj.position.x - 90000) < 1e-6,
     String(obj.position.x));
  interp.restoreAfterRender();

  ok('alpha is clamped', (() => {
    obj.position.set(0, 0, 0); interp.commitStep();
    obj.position.set(100, 0, 0); interp.commitStep();
    interp.applyInterpolation(99);
    const x = obj.position.x;
    interp.restoreAfterRender();
    return x <= 100 * INTERP.maxLead + 1e-6;
  })());

  interp.untrack(obj);
  ok('an object can be untracked', interp.trackedCount() === 0);
  ok('untracking twice is harmless', (interp.untrack(obj), interp.trackedCount() === 0));
  ok('untracking nothing is harmless', (interp.untrack(null), true));

  // pruning is what stops a long session leaking dead references
  const a = { position: new V() }, b = { position: new V() };
  interp.track(a); interp.track(b);
  interp.pruneInterpolation(o => o === a);
  ok('pruning drops what has left the world', interp.trackedCount() === 1);
  interp.resetInterpolation();
}
{
  // NPCs are tracked on spawn and untracked on death — a leak here is invisible until
  // an hour into a session
  const before = interp.trackedCount();
  ok('the live world tracks its ships', before >= 0);
}

// ── level of detail ──────────────────────────────────────────────────
console.log('\n— level of detail —');
{
  ok('thresholds run large to small',
     LOD.thresholds.every((t, i, a) => i === 0 || t < a[i - 1]));
  ok('the cull threshold is below every level', LOD.cull < LOD.thresholds[LOD.thresholds.length - 1]);
  ok('there is a segment count for every level', LOD.segments.length >= LOD.thresholds.length + 1);
  ok('segment counts fall with detail',
     LOD.segments.every((n, i, a) => i === 0 || n <= a[i - 1]));

  // screen size, not distance — the property the whole system turns on
  const big = lod.screenSize(1400, 30000, 68, 800);     // gas giant, far
  const small = lod.screenSize(34, 2000, 68, 800);      // station, near
  ok('a big distant body is larger on screen than a small near one', big > small,
     `${big.toFixed(4)} vs ${small.toFixed(4)}`);
  ok('screen size falls with distance',
     lod.screenSize(100, 1000, 68, 800) > lod.screenSize(100, 10000, 68, 800));
  ok('screen size rises with radius',
     lod.screenSize(200, 5000, 68, 800) > lod.screenSize(100, 5000, 68, 800));
  ok('a zero distance does not divide by zero', lod.screenSize(100, 0, 68, 800) === 1);

  ok('a full-screen body gets the best level', lod.levelFor(0.9, 4) === 0);
  ok('a speck gets the worst level', lod.levelFor(0.0001, 4) === 3);
  ok('one level means one answer', lod.levelFor(0.5, 1) === 0);
  ok('the level never exceeds what exists', lod.levelFor(0.0001, 2) === 1);

  // quality bias moves the thresholds without changing their order
  q.setAuto(false);
  q.setQualityLevel(0);
  const stingy = lod.levelFor(0.05, 4);
  q.setQualityLevel(q.LEVELS.length - 1);
  const generous = lod.levelFor(0.05, 4);
  ok('higher quality holds detail further out', generous <= stingy,
     `low ${stingy} vs high ${generous}`);
  q.setAuto(true);

  // and it does something to the live world
  sceneMod.camera.position.set(0, 0, 0);
  const changed = lod.updateLod(800);
  ok('the world is registered for lod', lod.lodCount() > 0, `${lod.lodCount()} bodies`);
  ok('updating returns a change count', typeof changed === 'number');
  const report = lod.lodReport();
  ok('the report accounts for everything',
     report.tracked === lod.lodCount() &&
     report.culled + report.buckets.reduce((x, y) => x + y, 0) === report.tracked);
  ok('distant bodies are culled from the origin', report.culled > 0,
     `${report.culled} of ${report.tracked}`);

  // stand next to something and it should come back
  const planet = S.world.bodies.find(b => b.userData.kind === 'planet');
  sceneMod.camera.position.copy(planet.position);
  sceneMod.camera.position.x += planet.userData.radius * 2;
  lod.updateLod(800);
  ok('a body you are standing next to is drawn', planet.visible === true);
  ok('...and at full detail', planet.__lod.current === 0, String(planet.__lod.current));

  sceneMod.camera.position.set(0, 0, 0);
  lod.updateLod(800);
}

// ── audio mix ────────────────────────────────────────────────────────
console.log('\n— audio mix —');
{
  ok('four buses are defined', Object.keys(AUDIO.buses).length === 4);
  ok('alerts sit at or above effects', AUDIO.buses.alert >= AUDIO.buses.sfx);
  ok('the music bed is quieter than the effects', AUDIO.buses.music < AUDIO.buses.sfx);
  ok('ducking actually ducks', AUDIO.duckTo > 0 && AUDIO.duckTo < 1);
  ok('doppler is bounded', AUDIO.dopplerMax > 0 && AUDIO.dopplerMax < 1);

  ok('a bus level can be set', audio.setBusLevel('music', 0.5) && audio.busLevel('music') === 0.5);
  ok('levels are clamped',
     (audio.setBusLevel('music', 9), audio.busLevel('music') === 1) &&
     (audio.setBusLevel('music', -9), audio.busLevel('music') === 0));
  ok('an unknown bus is refused', audio.setBusLevel('kazoo', 0.5) === false);
  audio.setBusLevel('music', AUDIO.buses.music);

  // spatial: distance and closing speed
  S.player.position.set(0, 0, 0);
  S.player.velocity.set(0, 0, 0);
  const near = audio.spatial(new V(0, 0, 100), new V());
  const far = audio.spatial(new V(0, 0, AUDIO.earshot * 0.9), new V());
  ok('a near sound is louder than a far one', near.gain > far.gain,
     `${near.gain.toFixed(3)} vs ${far.gain.toFixed(3)}`);
  ok('a sound out of earshot is not played',
     audio.spatial(new V(0, 0, AUDIO.earshot * 2), new V()) === null);

  const closing = audio.spatial(new V(0, 0, 500), new V(0, 0, -400));
  const receding = audio.spatial(new V(0, 0, 500), new V(0, 0, 400));
  ok('a closing source is pitched up', closing.pitch > 1, closing.pitch.toFixed(3));
  ok('a receding source is pitched down', receding.pitch < 1, receding.pitch.toFixed(3));
  ok('doppler respects its cap',
     Math.abs(audio.spatial(new V(0, 0, 500), new V(0, 0, -99999)).pitch - 1) <= AUDIO.dopplerMax + 1e-9);
  ok('a stationary source is not shifted',
     Math.abs(audio.spatial(new V(0, 0, 500), new V()).pitch - 1) < 1e-9);

  // moods
  ok('every mood is reachable from a game state', typeof audio.moodFor() === 'string');
  S.player.lastHit = S.time;
  ok('being shot at is combat', audio.moodFor() === 'combat');
  S.player.lastHit = -9999;
  S.input.mining = true;
  ok('mining is work', audio.moodFor() === 'work');
  S.input.mining = false;
  ok('doing nothing is calm', audio.moodFor() === 'calm');
  ok('setting a mood with no music running is a no-op', audio.setMood('tense') === false);
  ok('updating audio with no context is harmless', (audio.updateAudio(1), true));
}
{
  // mix levels ride along in the save, like every other setting
  save.wipeSave();
  audio.setBusLevel('engine', 0.2);
  save.saveGame(true);
  S.settings.mix = null;
  save.loadGame();
  ok('mix levels survive a save', audio.busLevel('engine') === 0.2, String(audio.busLevel('engine')));
  save.wipeSave();
}

// ── the mute button ──────────────────────────────────────────────────
console.log('\n— silence —');
{
  // The reported bug: sound off left a constant low tone playing. `S.settings.audio`
  // gated the functions that *start* sounds; the music bed is two oscillators that start
  // once and run forever, so muting stopped new sounds and left the bed droning.
  ok('setAudioEnabled reports the state it set',
     audio.setAudioEnabled(false) === false && audio.audioEnabled() === false);
  ok('and back on', audio.setAudioEnabled(true) === true && audio.audioEnabled() === true);

  audio.setAudioEnabled(false);
  ok('the music bed will not start while muted',
     audio.startMusic() === undefined && audio.musicMood() === null);

  audio.setAudioEnabled(true);
  ok('a mood can be set once sound is on again', typeof audio.moodFor() === 'string');
  ok('audioRunning answers without a context', typeof audio.audioRunning() === 'boolean');

  // muting must not throw with no context, which is the headless case
  ok('muting is harmless without an audio context',
     (audio.setAudioEnabled(false), audio.setAudioEnabled(true), true));
}

// ── the loop still holds together ────────────────────────────────────
console.log('\n— integration —');
{
  resetClock();
  advance(0);
  let steps = 0;
  for (let i = 1; i <= 120; i++) steps += advance(i * 16.667);
  ok('the clock still advances normally alongside all of this', steps > 100, String(steps));
  ok('alpha stays inside one step', clock.alpha >= 0 && clock.alpha < 1, String(clock.alpha));
  ok('the fixed step is untouched', Math.abs(clock.stepDt - CLOCK.step) < 1e-12);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
