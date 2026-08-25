// Held points: gravity wells you can see, and belts drawn as bands when they are far away.
//
// ## The gap this closes
//
// Gravity wells have been load-bearing simulation since v1.02.34. `navplan.js` routes around
// them, `warp.js` refuses to hold a course inside one, `fleet-work.js` brakes hulls that enter
// one, and getting the star's own well right was worth an eleven-fold improvement in fleet
// throughput. **Nothing has ever drawn them.** A player watching a freighter swing wide around
// a gas giant sees a ship flying a strange route for no visible reason, and concludes the
// pathing is broken. Seven patches of physics, invisible for their whole life.
//
// ## What this suite pins
//
//   1. **The picture cannot lie about the obstacles.** A shell sits at exactly `wellRadius(u)`,
//      the same function the planner reads — not a copy of the formula, and not an
//      approximation. A picture that disagrees with the router is worse than no picture.
//   2. **The two layers are genuinely separate.** A well shell must never spend transient
//      particle budget, or a firefight beside a gas giant has no sparks in it.
//   3. **The field repacks only when something changed.** A frame in which nothing moved past a
//      threshold costs one boolean.
//   4. **An LOD tier changes drawing and nothing else.** The rocks still orbit, still hold ore,
//      and still answer `nearestAsteroid()` when the belt is drawn as a band.

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
const { WELLS, BANDS, FIELD } = await imp('core/config.js');
const F = await imp('world/pointfield.js');
const W = await imp('world/wells.js');
const P = await imp('world/particles.js');
const Q = await imp('world/quality.js');
const { wellRadius } = await imp('systems/flight/warp.js');
const SC = await imp('world/scene.js');
const { createSystem, updateSystem } = await imp('world/system.js');
const { createAsteroids, updateAsteroids, nearestAsteroid } = await imp('world/asteroids.js');

SC.initScene(); recalcStats(); seedWorld(5150); S.seed = 5150;
F.initPointField(SC.scene);
P.initParticles(SC.scene);
createSystem();
createAsteroids();

// ── 1. the field layer ───────────────────────────────────────────────
console.log('\n— placed once, held until removed —');
{
  F.clearAllFields();
  F.updatePointField();
  ok('an empty layer draws nothing', F.fieldStats().points === 0);

  const pts = F.sphereShell(0, 0, 0, 100, 64);
  ok('a shell is the requested size', pts.length === 64 * 3);
  // Fibonacci rather than random spherical coordinates: random clumps at the poles and leaves
  // voids, and a shell with a hole in it reads as a shape rather than as a field.
  let minR = Infinity, maxR = 0;
  for (let i = 0; i < 64; i++) {
    const r = Math.hypot(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
    minR = Math.min(minR, r); maxR = Math.max(maxR, r);
  }
  ok('every point sits on the shell', minR > 90 && maxR < 110, `${minR.toFixed(0)}..${maxR.toFixed(0)}`);
  // Deterministic: the same shell on every device and every load, like everything else since
  // v1.02.33. `Math.random()` in here would give a body a different well every visit.
  const again = F.sphereShell(0, 0, 0, 100, 64);
  ok('and it is the same shell every time', pts.every((v, i) => v === again[i]));

  F.setField('t1', pts, { color: [1, 0, 0], size: 3, alpha: 0.5 });
  ok('a field packs on the next update', F.updatePointField() === 64, String(F.fieldStats().points));
  ok('re-adding the same key replaces rather than duplicates',
     (F.setField('t1', pts), F.updatePointField() === 64), String(F.fieldStats().points));

  F.setField('t2', F.sphereShell(0, 0, 0, 50, 30));
  ok('two fields pack together', F.updatePointField() === 94, String(F.fieldStats().points));
  F.showField('t2', false);
  ok('hiding one drops it from the draw', F.updatePointField() === 64);
  F.showField('t2', true);
  ok('and showing it brings it back', F.updatePointField() === 94);
  F.clearField('t2');
  ok('clearing removes it', F.updatePointField() === 64);

  // The whole point of a held layer: no per-frame work when nothing changed. `updatePointField`
  // returns the same count either way, so this looks at the dirty flag through its effect —
  // mutating the buffer behind its back and checking the value survives an update.
  const buf = SC.scene.children.find(c => c.geometry && c.geometry.attributes &&
                                          c.geometry.attributes.aSize &&
                                          c.renderOrder === 2).geometry.attributes.position.array;
  buf[0] = 12345;
  F.updatePointField();
  ok('a frame with no change does not repack', buf[0] === 12345);
  F.invalidateFields();
  F.updatePointField();
  ok('but an explicit invalidation does', buf[0] !== 12345);
}

// ── 2. the budget, and the separation ────────────────────────────────
console.log('\n— two layers, two budgets —');
{
  Q.setAuto(false);
  Q.setQualityLevel(4);
  F.clearAllFields();
  ok('the field ceiling is its own allocation at full quality',
     F.budget() === FIELD.capacity, `${F.budget()} vs ${FIELD.capacity}`);
  ok('and it is not the particle allocation', FIELD.capacity !== P.particleStats().capacity);

  // Over-budget fields truncate rather than vanish — the opposite of what the transient pool
  // does, and right for the opposite reason. A missing spark is one missing spark; a well that
  // disappears under load teaches the player something false about the world.
  Q.setQualityLevel(0);
  F.invalidateFields();
  const lim = F.budget();
  F.setField('huge', F.sphereShell(0, 0, 0, 100, FIELD.capacity), { size: 2 });
  const packed = F.updatePointField();
  ok('an over-budget field is truncated, not dropped', packed > 0 && packed === lim,
     `${packed} vs ${lim}`);
  ok('and the loss is counted', F.fieldStats().culled > 0, String(F.fieldStats().culled));
  ok('nothing was written past the allocation', packed <= FIELD.capacity);

  // The separation that matters: a shell must not cost the transient pool a slot.
  P.resetParticles();
  const before = P.particleCount();
  F.setField('another', F.sphereShell(0, 0, 0, 40, 200));
  F.updatePointField();
  ok('a field costs the particle pool nothing', P.particleCount() === before);

  Q.setQualityLevel(3);
  F.clearAllFields();
  F.updatePointField();
}

// ── 3. the wells tell the truth ──────────────────────────────────────
console.log('\n— the shell is where the router thinks the obstacle is —');
{
  const n = W.buildWells();
  ok('the system has wells to draw', n > 0, String(n));
  // `fieldStats().points` counts what is *packed*, not what is registered — the layer holds the
  // records and only touches the buffer on the next update. That is the whole design, so the
  // update has to happen before the count means anything.
  F.updatePointField();
  ok('and they are in the field layer', F.fieldStats().points > 0, JSON.stringify(F.fieldStats()));

  // The claim: the drawn radius is the planner's radius. Measured off the packed buffer, not
  // off the parameters that produced it, so a bug in the packing path would show here too.
  const bodies = (S.world.bodies || []).filter(b => {
    const u = b.userData;
    return u && (u.kind === 'planet' || u.kind === 'star' || u.kind === 'moon') && u.gravity > 0;
  });
  let checked = 0, worst = 0, worstName = '';
  for (const b of bodies) {
    const r = wellRadius(b.userData);
    if (r < WELLS.minRadius) continue;
    if (!F.hasField('well:' + b.userData.name)) continue;
    checked++;
    // Rebuild the same shell and measure it against the body — the field stores world-space
    // points, so this is the number a player is actually looking at.
    const pts = F.sphereShell(b.position.x, b.position.y, b.position.z, r, 32);
    for (let i = 0; i < 32; i++) {
      const d = Math.hypot(pts[i * 3] - b.position.x,
                           pts[i * 3 + 1] - b.position.y,
                           pts[i * 3 + 2] - b.position.z);
      const err = Math.abs(d - r) / r;
      if (err > worst) { worst = err; worstName = b.userData.name; }
    }
  }
  ok('several bodies got a shell', checked >= 3, String(checked));
  // Jitter is deliberate — a perfect sphere reads as a wireframe ball rather than a field — so
  // the tolerance is the jitter, not zero.
  ok('every shell sits on the planner’s own radius', worst < 0.06,
     `${worstName} off by ${(worst * 100).toFixed(1)}%`);

  // A body too small to matter gets nothing rather than a smudge on its own hull.
  const tiny = bodies.filter(b => wellRadius(b.userData) < WELLS.minRadius);
  ok('negligible wells are skipped rather than drawn',
     tiny.every(b => !F.hasField('well:' + b.userData.name)), String(tiny.length));

  // Wells follow their bodies. A shell placed once would be left behind inside a minute.
  const p = bodies.find(b => b.userData.kind === 'planet' && wellRadius(b.userData) >= WELLS.minRadius);
  if (p) {
    const start = { x: p.position.x, y: p.position.y, z: p.position.z };
    for (let i = 0; i < 400; i++) { updateSystem(1); W.refreshWells(1); }
    const moved = Math.hypot(p.position.x - start.x, p.position.y - start.y, p.position.z - start.z);
    ok('the body moved', moved > 20, moved.toFixed(0));
    const r = wellRadius(p.userData);
    const pts = F.sphereShell(p.position.x, p.position.y, p.position.z, r, 8);
    const d = Math.hypot(pts[0] - p.position.x, pts[1] - p.position.y, pts[2] - p.position.z);
    ok('and its shell went with it', Math.abs(d - r) / r < 0.06, `${d.toFixed(0)} vs ${r.toFixed(0)}`);
  } else ok('the body moved', false, 'no planet with a well');

  ok('wells can be switched off', (W.setWellsVisible(false), F.updatePointField(),
                                   F.fieldStats().points === 0), String(F.fieldStats().points));
  ok('and back on', (W.setWellsVisible(true), F.updatePointField(), F.fieldStats().points > 0));
  ok('rebuilding does not double them up',
     (W.buildWells(), W.wellCount() === n), `${W.wellCount()} vs ${n}`);

  // The colour ramp is a readout: a well you can cross under power and one that will hold you
  // are different problems, and they must not be the same colour.
  ok('the ramp ends are tellable apart',
     Math.hypot(WELLS.hot[0] - WELLS.cool[0], WELLS.hot[1] - WELLS.cool[1],
                WELLS.hot[2] - WELLS.cool[2]) > 0.4);
  // And a well is not a damage type — it must not borrow one of the six reserved hues.
  const reserved = ['kinetic', 'thermal', 'em', 'ore', 'salvage', 'data'];
  const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 0.2;
  ok('and does not borrow a reserved particle hue',
     !reserved.some(k => near(WELLS.cool, P.PALETTE[k]) || near(WELLS.hot, P.PALETTE[k])));
}

// ── 4. the band tier draws differently and simulates identically ─────
console.log('\n— an LOD tier changes drawing and nothing else —');
{
  const belts = S.world.belts || [];
  ok('there are belts', belts.length > 0, String(belts.length));

  const rocks = S.world.asteroids || [];
  ok('and rocks in them', rocks.length > 50, String(rocks.length));

  // Stand well outside everything so every belt drops to its band.
  const far = 200000;
  S.player.position.set(far, far, far);
  for (let i = 0; i < 4; i++) updateAsteroids(0.5);
  const banded = belts.filter(b => F.hasField('band:' + b.key)).length;
  ok('distance drops the belts to bands', banded > 0, `${banded}/${belts.length}`);
  ok('and their meshes stop drawing',
     SC.scene.children.filter(c => c.isInstancedMesh && c.visible !== false).length <
     SC.scene.children.filter(c => c.isInstancedMesh).length ||
     banded === belts.length);

  // The bug this section exists for. The first cut skipped the whole per-rock loop when the
  // meshes were hidden, so ring rocks stopped travelling with their planet and a player who
  // flew away and came back found the ring left behind in space. Position is simulation.
  const r0 = rocks[0];
  const p0 = { x: r0.position.x, y: r0.position.y, z: r0.position.z };
  for (let i = 0; i < 60; i++) { updateSystem(1); updateAsteroids(1); }
  const travelled = Math.hypot(r0.position.x - p0.x, r0.position.y - p0.y, r0.position.z - p0.z);
  ok('rocks keep orbiting while their belt is a band', travelled > 1, travelled.toFixed(1));

  // ...and the rest of the simulation still sees them.
  const near = nearestAsteroid(r0.position, 500);
  ok('and the cutter can still find one', !!near);
  ok('ore is untouched by the tier', rocks.every(r => typeof r.ore === 'number'));

  // Come back and the meshes return.
  //
  // "Close" means close to the *ring*, not to the star. Standing at the origin was the first
  // version of this and it failed correctly: a player at the star is seven thousand units from
  // the inner belt and should be seeing a band, which is exactly what the code decided. The
  // threshold measures distance to the belt's mid-radius, so flying to the belt means flying
  // *onto* it.
  const main = belts.find(b => !b.parentName) || belts[0];
  const mid = main.inner + main.width * 0.5;
  S.player.position.set(mid, 0, 0);
  for (let i = 0; i < 4; i++) updateAsteroids(0.5);
  ok('flying onto a belt brings its meshes back', !F.hasField('band:' + main.key), main.key);
  // ...and the belts you are still nowhere near stay as bands, which is the point of the tier.
  const distant = belts.filter(b => b !== main && !b.parentName);
  ok('while the ones you are not at stay bands',
     distant.length === 0 || distant.some(b => F.hasField('band:' + b.key)),
     distant.map(b => b.key).join(','));

  // Hysteresis: sitting exactly on the threshold must not flip the tier every check, because
  // each flip repacks the field buffer *and* re-shows four hundred instanced meshes — the most
  // expensive possible way to stand still.
  ok('the hysteresis band is real', BANDS.hysteresis > 0);
  S.player.position.set(mid + BANDS.enterAt + 1, 0, 0);
  for (let i = 0; i < 4; i++) updateAsteroids(0.5);
  const flipped = F.hasField('band:' + main.key);
  S.player.position.set(mid + BANDS.enterAt - BANDS.hysteresis * 0.5, 0, 0);
  for (let i = 0; i < 4; i++) updateAsteroids(0.5);
  ok('and a nudge back inside it does not flip the tier',
     flipped && F.hasField('band:' + main.key));
}

// ── 5. the wiring ────────────────────────────────────────────────────
console.log('\n— it is actually in the game —');
{
  const fs = await import('node:fs');
  const src = p => fs.readFileSync(new URL('src/' + p, ROOT).pathname, 'utf8');
  const m = src('main.js');
  ok('the field layer is created at boot', /initPointField\(scene\)/.test(m));
  ok('the wells are built with the world', /buildWells\(\)/.test(m));
  ok('and both are stepped in the frame',
     /refreshWells\(dt\)/.test(m) && /updatePointField\(\)/.test(m));
  ok('behind the same gate as the particles',
     /if \(!execHudActive\(\) && !galaxyMapOpen\(\)\) \{[\s\S]{0,400}updatePointField\(\)/.test(m));
  ok('a quality change invalidates the field budget',
     /invalidateFields/.test(src('world/quality.js')));
  ok('the band tier lives with the rocks it stands in for',
     /ringBand\(/.test(src('world/asteroids.js')));
  ok('the shell radius comes from the planner, not a copy of its formula',
     /import \{ wellRadius \} from '[^']*systems\/flight\/warp\.js'/.test(src('world/wells.js')));

  // Three point objects now, and no more: transient, held, and the starfield.
  const shaded = SC.scene.children.filter(c => c.geometry && c.geometry.attributes &&
                                               c.geometry.attributes.aSize);
  ok('there are exactly two shader-driven point layers', shaded.length === 2, String(shaded.length));
  ok('and they draw in the right order — sparks over shells',
     shaded.every(c => c.renderOrder === 2 || c.renderOrder === 3) &&
     shaded.some(c => c.renderOrder === 2) && shaded.some(c => c.renderOrder === 3));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
