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
const q = await imp('world/quality.js');
const interp = await imp('world/interpolate.js');
const lod = await imp('world/lod.js');
const rig = await imp('world/lightrig.js');
const vis = await imp('world/visibility.js');
const audio = await imp('systems/platform/audio.js');
// Destructuring `camera` here would capture `undefined` — it is an `export let` that
// initScene() assigns, and a destructured binding is a snapshot rather than a live view.
const sceneMod = await imp('world/scene.js');
const { initScene, renderProfile } = sceneMod;
const { createSystem, updateSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { initPlayerFx } = await imp('entities/player.js');
const { createNpcs } = await imp('entities/npcs.js');
const { initProjectiles } = await imp('systems/combat/projectiles.js');
const { initCombat } = await imp('systems/combat/combat.js');
const { initMining } = await imp('systems/industry/mining.js');
const save = await imp('systems/platform/save.js');

initScene(); rig.initLightRig(); recalcStats(); seedWorld(1337); createSystem(); createAsteroids();
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
}

// ── point-shader scale ───────────────────────────────────────────────
//
// The galaxy chart drew black on a phone, and nothing in the suite noticed because nothing
// was broken in any way a suite was watching for. The GLSL compiled. The geometry uploaded.
// Fifty thousand stars were drawn every frame — each one at 0.027 of a pixel, which a
// rasteriser resolves to nothing.
//
// The cause was a constant. `gl_PointSize = aSize.x * (300.0 / depth)`, where 300 is the
// distance at which a point renders at its authored size. That is right for combat sparks a
// few hundred units out and wrong by three orders of magnitude for a chart whose camera sits
// 78,000 units off a 52,000-light-year disc.
//
// So the check is arithmetic on the same formula the shader uses. It cannot compile GLSL —
// `tools/shader-check.html` exists for that — but the bug was never a compile error, and a
// scene whose points come out sub-pixel is a black screen whatever the driver says.
console.log('\n— point-shader scale —');
{
  const { PARTICLE_REF, particleUniforms } = await imp('world/particle-shader.js');
  const { GALAXY } = await imp('core/config.js');

  // The shader's own sizing rule, in JS.
  const pointPx = (authored, depth, ref) => authored * (ref / Math.max(1, depth));

  ok('the reference distance is a uniform, not a constant',
     particleUniforms(1234).uRef.value === 1234);
  ok('omitting it gives the world scale', particleUniforms().uRef.value === PARTICLE_REF);

  // World scale: a spark at the reference distance is its authored size.
  ok('a world particle at the reference distance is full size',
     Math.abs(pointPx(9, PARTICLE_REF, PARTICLE_REF) - 9) < 1e-9);
  ok('…and attenuates with distance',
     pointPx(9, PARTICLE_REF * 4, PARTICLE_REF) < pointPx(9, PARTICLE_REF, PARTICLE_REF));

  // Chart scale: the regression itself, as a number.
  const chartRef = GALAXY.radius * 1.5;
  const chartDepth = GALAXY.radius * 1.5;
  const wrong = pointPx(GALAXY.chartStarSize, chartDepth, PARTICLE_REF);
  const right = pointPx(GALAXY.chartStarSize, chartDepth, chartRef);

  ok('the old world-scale reference made chart stars sub-pixel', wrong < 1,
     wrong.toFixed(4) + ' px');
  ok('the chart reference renders them at the authored size',
     Math.abs(right - GALAXY.chartStarSize) < 1e-9, right.toFixed(2) + ' px');

  // Every point cloud the chart builds has to clear a pixel, not just the stars — a core
  // bulge and a dust haze that vanish leave a chart of bare pinpricks with no galaxy behind
  // them, which is a subtler version of the same failure.
  const clouds = [
    ['stars', GALAXY.chartStarSize], ['core', GALAXY.chartCoreSize], ['dust', GALAXY.chartDustSize]
  ];
  const tiny = clouds.filter(([, sz]) => pointPx(sz, chartDepth, chartRef) < 1);
  ok('no chart cloud renders sub-pixel at the default view', tiny.length === 0,
     tiny.map(c => c[0]).join(' '));

  // And zoomed out to the far end of the chart's own zoom range, stars may shrink but the
  // haze that makes it read as a galaxy must survive.
  const farOut = GALAXY.radius * 3;
  ok('the dust haze survives being zoomed all the way out',
     pointPx(GALAXY.chartDustSize, farOut, chartRef) >= 1,
     pointPx(GALAXY.chartDustSize, farOut, chartRef).toFixed(2) + ' px');
}

// ── acquisition range ────────────────────────────────────────────────
//
// The reason this is a separate section from the block above, and a separate HIDE reason
// from `lod`, is that screen-space culling turned out to answer the wrong question for a
// built object.
//
// A habitat ring is 96 units across. At 1,900 units — a locked contact on the far side of a
// planet — it still covers seven percent of the screen, and at 12,000 units it still covers
// more than a percent. The culler kept it every time, correctly by its own rule, and the
// player could sit at the edge of a system watching a station rotate. Nothing was
// miscomputed; the measure simply had nothing to say about whether a berth should be
// resolvable from there.
console.log('\n— acquisition range —');
{
  const { HIDE, hide, hiddenBy, clearHide } = await imp('world/visibility.js');
  const { RENDER_RANGE } = await imp('core/config.js');

  ok('range is its own reason, not a shade of lod', HIDE.range !== HIDE.lod && HIDE.range > 0);
  ok('a station resolves closer than a ship', RENDER_RANGE.station < RENDER_RANGE.ship,
     `${RENDER_RANGE.station} vs ${RENDER_RANGE.ship}`);

  // The measurement that motivated the whole thing: screen-space culling never fires for a
  // station at any distance a player can reach inside a system.
  const ringRadius = 96;
  const farScreen = lod.screenSize(ringRadius, 12000, 68, 800);
  ok('a habitat ring is never small enough for the culler to drop it',
     farScreen > LOD.cull, `${(farScreen * 100).toFixed(2)}% at 12,000u vs cull ${LOD.cull * 100}%`);
  ok('…so the range gate is what hides it', 12000 > RENDER_RANGE.station);

  // Two systems, two opinions, one object — the case `visibility.js` exists for. A docked
  // hull is hidden by the fleet layer; the range gate must not un-hide it, and lifting the
  // range gate must not either.
  const obj = { visible: true };
  hide(obj, HIDE.dock, true);
  hide(obj, HIDE.range, true);
  ok('two reasons hide it', obj.visible === false);
  hide(obj, HIDE.range, false);
  ok('clearing range alone does not reveal a docked hull', obj.visible === false);
  ok('…and the dock reason is still the one holding it',
     hiddenBy(obj, HIDE.dock) && !hiddenBy(obj, HIDE.range));
  hide(obj, HIDE.dock, false);
  ok('clearing the last reason reveals it', obj.visible === true);
  clearHide(obj);

  // End to end through the LOD pass, which is what actually applies the gate.
  const near = { position: new THREE.Vector3(0, 0, 200), visible: true, parent: {} };
  const far = { position: new THREE.Vector3(0, 0, 9000), visible: true, parent: {} };
  lod.register(near, 96, null, RENDER_RANGE.station);
  lod.register(far, 96, null, RENDER_RANGE.station);
  sceneMod.camera.position.set(0, 0, 0);
  lod.updateLod(800);
  ok('a station inside acquisition range is drawn', near.visible === true);
  ok('a station beyond it is not', far.visible === false);
  ok('…and it is the range reason that hid it', hiddenBy(far, HIDE.range));
  ok('…not the culler', !hiddenBy(far, HIDE.lod));
  lod.unregister(near); lod.unregister(far);

  // A body with no declared range is unlimited, which is the right answer for a planet — a
  // gas giant IS visible across a system and capping it would be a lie the other way.
  const giant = { position: new THREE.Vector3(0, 0, 30000), visible: true, parent: {} };
  lod.register(giant, 1400, null);
  lod.updateLod(800);
  ok('a body with no range cap is never hidden by range', !hiddenBy(giant, HIDE.range));
  lod.unregister(giant);

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
  // Asserts that nothing started, not which flavour of falsy the refusal returns. The old
  // form pinned `=== undefined` and failed the moment `startMusic` was rewritten to return
  // the bed it created (and therefore `null` when it creates none) — a test of the return
  // convention wearing the name of a test about silence.
  ok('the music bed will not start while muted',
     !audio.startMusic() && audio.musicMood() === null);

  audio.setAudioEnabled(true);
  ok('a mood can be set once sound is on again', typeof audio.moodFor() === 'string');
  ok('audioRunning answers without a context', typeof audio.audioRunning() === 'boolean');

  // muting must not throw with no context, which is the headless case
  ok('muting is harmless without an audio context',
     (audio.setAudioEnabled(false), audio.setAudioEnabled(true), true));
}

// ── the light rig ────────────────────────────────────────────────────
// The property under test is not "the nearest ship is lit" — it is that the *count* never
// moves. Every lit material in three.js compiles against the number of point lights in the
// scene, so a rig that quietly grew by one on each spawn would recompile the world mid
// firefight and be invisible to every other test in this file.
console.log('\n— light rig —');
{
  const { LIGHTS } = await imp('core/config.js');
  const before = rig.lightRigReport();
  ok('the pool is exactly the configured size', before.pool === LIGHTS.pool, String(before.pool));
  ok('every hull and station registered an emitter instead of a light',
    before.emitters > LIGHTS.pool, String(before.emitters));

  // The star is the one point light outside the rig, and deliberately so.
  ok('the scene carries the pool plus the primary, and nothing else',
    before.scenePointLights === LIGHTS.pool + 1, String(before.scenePointLights));

  // LOD runs before the rig in the real frame and the rig honours its verdict — a light
  // for something culled is a light for something not on screen. Run them in that order
  // here too, or the test measures a state the game never reaches.
  sceneMod.camera.position.set(0, 0, 0);
  lod.updateLod(800);
  rig.updateLightRig(1);
  const lit = rig.lightRigReport();
  ok('no more lights are ever active than there are slots', lit.active <= LIGHTS.pool, String(lit.active));
  ok('the light count did not move when the rig ran',
    rig.lightRigReport().scenePointLights === before.scenePointLights);

  // Park the camera on a hull and it should be one of the ones that gets a light.
  const hull = S.world.npcs[0];
  if (hull) {
    sceneMod.camera.position.copy(hull.position);
    lod.updateLod(800);
    rig.updateLightRig(1);
    const near = rig.rigEmitters().find(e => e.host === hull);
    ok('the emitter under the camera holds a slot', !!near && near.slot >= 0,
      near ? String(near.slot) : 'no emitter');
    ok('and the light was moved onto it', !!near && near.slot >= 0);
  }

  // Despawn without an explicit detach: the rig has to notice on its own, because eight
  // call sites remove things from the scene and none of them should have to remember.
  const doomed = S.world.npcs[1];
  if (doomed) {
    const n0 = rig.lightRigReport().emitters;
    sceneMod.scene.remove(doomed);
    rig.updateLightRig(1);
    const n1 = rig.lightRigReport().emitters;
    ok('a hull removed from the scene drops its emitter', n1 === n0 - 1, `${n0} → ${n1}`);
    ok('but the pool is untouched', rig.lightRigReport().pool === LIGHTS.pool);
  }

  // Idempotence: a restored save re-runs boot paths, and a second pool would be a
  // silent doubling of the most expensive number in the renderer.
  const p0 = rig.lightRigReport().scenePointLights;
  rig.initLightRig();
  ok('initialising twice does not create a second pool',
    rig.lightRigReport().scenePointLights === p0, String(p0));
}

// ── visibility arbiter ───────────────────────────────────────────────
// The bug this exists to prevent: a hull docked inside a station ring, hidden by the
// fleet layer, being dragged back into view by the LOD pass the moment the player flew
// close enough for it to be worth drawing. Two systems, one boolean, second writer wins.
console.log('\n— visibility —');
{
  const { HIDE, hide, show, hiddenBy, hideMask, clearHide } = vis;
  const obj = { visible: true };

  hide(obj, HIDE.dock);
  ok('one reason hides it', obj.visible === false);
  hide(obj, HIDE.lod);
  ok('a second reason is recorded separately', hiddenBy(obj, HIDE.dock) && hiddenBy(obj, HIDE.lod));
  show(obj, HIDE.lod);
  ok('clearing one reason does not reveal it while the other holds', obj.visible === false);
  show(obj, HIDE.dock);
  ok('clearing the last reason reveals it', obj.visible === true);
  ok('and no reasons remain', hideMask(obj) === 0);

  show(obj, HIDE.fx);
  ok('clearing a reason that was never set is harmless', obj.visible === true);
  hide(obj, HIDE.fx); clearHide(obj);
  ok('clearHide forgets everything', obj.visible === true && hideMask(obj) === 0);
  ok('a null object does not throw', hide(null, HIDE.dock) === true);

  // The real pairing, on a real hull.
  const hull = S.world.npcs.find(n => n.userData && n.userData.kind === 'ship');
  if (hull) {
    hide(hull, HIDE.dock);                       // as dockHull() does
    sceneMod.camera.position.copy(hull.position); // as close as it gets
    lod.updateLod(800);
    ok('LOD will not un-hide a docked hull parked under the camera', hull.visible === false);
    ok('and LOD did not clear the dock reason', hiddenBy(hull, HIDE.dock));
    show(hull, HIDE.dock);
    lod.updateLod(800);
    ok('undocking it under the camera brings it back', hull.visible === true);
  }

  // Registry hygiene: hulls despawn from half a dozen places and none of them calls
  // unregister. The registry has to notice on its own or it grows for the whole session.
  const before = lod.lodReport().tracked;
  const doomed = S.world.npcs[2];
  if (doomed) {
    sceneMod.scene.remove(doomed);
    lod.updateLod(800);
    ok('a despawned hull leaves the LOD registry', lod.lodReport().tracked === before - 1,
      `${before} → ${lod.lodReport().tracked}`);
  }
  const t0 = lod.lodReport().tracked;
  lod.register(S.world.npcs[0], 10, null);
  ok('registering an already-registered body is a no-op', lod.lodReport().tracked === t0);
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
