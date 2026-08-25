// One pool, and particles that mean something.
//
// There were three particle systems before v1.02.41 and they had nothing to do with each
// other: 720 sparks in `systems/combat.js`, 120 thruster points in `entities/player.js`, and
// a mining beam that emitted no debris at all. Three buffers, three draw calls, three ideas of
// how big a particle is — and **not one of them read `effectScale()`**, so the quality system
// that has existed since v1.00.95 could not turn any of them down on the device where that
// matters. A Minimum-quality phone ran exactly as many sparks as an Ultra desktop.
//
// What this suite pins, in the order it matters:
//
//   1. **The budget is real.** Live particles never exceed the quality ceiling, the ceiling
//      moves when quality moves, and an over-budget emission is refused rather than growing
//      the buffer or overwriting something on screen.
//   2. **Nothing leaks and nothing allocates.** The pool is a fixed allocation; particles die
//      on schedule; the live set stays contiguous so the draw range is one range.
//   3. **The palette is exclusive.** Damage types and commodities own six hues between them,
//      and no decorative preset borrows one — which is the whole reason a colour can be read
//      as a fact rather than as a mood.
//   4. **Count is magnitude.** A bigger hit throws more sparks; a richer seam throws more
//      chips. That is the claim that makes these particles a readout.

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
const { PARTICLES } = await imp('core/config.js');
const P = await imp('world/particles.js');
const Q = await imp('world/quality.js');
// The namespace object, not a destructure: `scene` is a live binding that is undefined until
// `initScene()` runs, and destructuring captures the undefined.
const SC = await imp('world/scene.js');

SC.initScene(); recalcStats();
P.initParticles(SC.scene);
const O = { x: 0, y: 0, z: 0 };
const V = { x: 1, y: 0, z: 0 };

// ── 1. the budget ────────────────────────────────────────────────────
console.log('\n— the quality budget is not advisory —');
{
  Q.setAuto(false);
  Q.setQualityLevel(4);                       // Ultra
  P.resetParticles();
  const full = P.budget();
  ok('the ceiling is the allocation at full quality', full === PARTICLES.capacity,
     `${full} vs ${PARTICLES.capacity}`);

  Q.setQualityLevel(0);                       // Minimum
  const low = P.budget();
  ok('and it drops with quality', low < full, `${full} → ${low}`);
  ok('but never to nothing', low >= 24, String(low));

  // Emit far past the ceiling and check what actually happened.
  P.resetParticles();
  let taken = 0;
  for (let i = 0; i < PARTICLES.capacity * 2; i++) if (P.emit(O, V, P.PALETTE.kinetic)) taken++;
  ok('emission stops at the ceiling', P.particleCount() === low, String(P.particleCount()));
  ok('the refused ones are refused, not squeezed in', taken === low, String(taken));
  ok('and the refusal is counted rather than silent', P.particleStats().dropped > 0,
     String(P.particleStats().dropped));

  // The important negative: nothing wrote past the end of the allocation.
  ok('nothing exceeded the allocation', P.particleCount() <= PARTICLES.capacity);

  Q.setQualityLevel(3);
}

// ── 2. lifetime and the live set ─────────────────────────────────────
console.log('\n— born, moved, dead, and no holes left behind —');
{
  P.resetParticles();
  P.emit(O, { x: 10, y: 0, z: 0 }, P.PALETTE.ore, { life: 1.0, drag: 0 });
  P.emit(O, { x: 0, y: 10, z: 0 }, P.PALETTE.ore, { life: 0.2, drag: 0 });
  P.emit(O, { x: 0, y: 0, z: 10 }, P.PALETTE.ore, { life: 2.0, drag: 0 });
  ok('three are alive', P.particleCount() === 3);

  P.stepParticles(0.5);
  ok('the short-lived one is gone', P.particleCount() === 2, String(P.particleCount()));
  P.stepParticles(0.6);
  ok('then the next', P.particleCount() === 1, String(P.particleCount()));
  P.stepParticles(2.0);
  ok('and eventually all of them', P.particleCount() === 0);

  // Contiguity. The dead-particle-with-zero-alpha approach the combat system used meant
  // paying for 720 vertices to see nine sparks; this asserts the draw range is honest.
  P.resetParticles();
  for (let i = 0; i < 40; i++) {
    P.emit(O, V, P.PALETTE.em, { life: i % 2 === 0 ? 0.1 : 5, drag: 0 });
  }
  P.stepParticles(0.2);
  ok('half of them died', P.particleCount() === 20, String(P.particleCount()));
  const drawn = P.syncParticles();
  ok('and the draw range is exactly the survivors', drawn === 20, String(drawn));
  ok('the geometry agrees',
     SC.scene.children.some(c => c.geometry && c.geometry.drawRange &&
                              c.geometry.drawRange.count === 20));

  // A zero or negative step must not resurrect, reorder or advance anything.
  const before = P.particleCount();
  P.stepParticles(0);
  P.stepParticles(-1);
  ok('a zero or negative frame changes nothing', P.particleCount() === before);
}

// ── 3. drag and motion ───────────────────────────────────────────────
console.log('\n— a spark slows the way a struck thing does —');
{
  P.resetParticles();
  P.emit(O, { x: 100, y: 0, z: 0 }, P.PALETTE.kinetic, { life: 9, drag: 3 });
  const step = (n, dt) => { for (let i = 0; i < n; i++) P.stepParticles(dt); };

  // Frame-rate independence: the same elapsed second must land in the same place whether it
  // arrived as one frame or sixty. Linear drag — `v *= 1 - k*dt`, which is what the old
  // combat pool used — fails this, and fails it worst on the slow device it matters on.
  step(1, 1.0);
  const far = P.syncParticles() >= 0 ? posX(0) : 0;
  P.resetParticles();
  P.emit(O, { x: 100, y: 0, z: 0 }, P.PALETTE.kinetic, { life: 9, drag: 3 });
  step(60, 1 / 60);
  const near = posX(0);
  ok('one second is one second at any frame rate', Math.abs(far - near) < 1.0,
     `${far.toFixed(2)} vs ${near.toFixed(2)}`);
  ok('and it did travel', near > 5, String(near));
  ok('but shed most of its speed', near < 40, String(near));
}

function posX(i) {
  const pts = SC.scene.children.find(c => c.geometry && c.geometry.attributes &&
                                       c.geometry.attributes.aSize);
  P.syncParticles();
  return pts.geometry.attributes.position.array[i * 3];
}

// ── 4. the palette is a contract ─────────────────────────────────────
console.log('\n— colour is a fact, not a mood —');
{
  const { DAMAGE } = await imp('core/config.js');
  // `DAMAGE.types` is a list, not a map — the keys of it are 0,1,2, which is what the first
  // version of this assertion cheerfully looked up in the palette and found missing.
  const types = Array.isArray(DAMAGE.types) ? DAMAGE.types : Object.keys(DAMAGE.types);
  ok('every damage type has a colour', types.every(t => !!P.PALETTE[t]), types.join(','));

  const { COMMODITIES } = await imp('core/config.js');
  ok('every commodity has one too',
     Object.keys(COMMODITIES).every(k => !!P.PALETTE[k]),
     Object.keys(COMMODITIES).filter(k => !P.PALETTE[k]).join(','));

  // Exclusivity: the six reserved hues must be distinct from each other, or "amber means
  // thermal" is not a rule anybody can use.
  const reserved = ['kinetic', 'thermal', 'em', 'ore', 'salvage', 'data'];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  let worst = 9, pair = '';
  for (let i = 0; i < reserved.length; i++) {
    for (let j = i + 1; j < reserved.length; j++) {
      const d = dist(P.PALETTE[reserved[i]], P.PALETTE[reserved[j]]);
      if (d < worst) { worst = d; pair = `${reserved[i]}/${reserved[j]}`; }
    }
  }
  ok('the reserved hues are all tellable apart', worst > 0.25, `${pair} at ${worst.toFixed(2)}`);
  ok('every colour channel is in range',
     Object.values(P.PALETTE).every(c => c.every(v => v >= 0 && v <= 1)));
}

// ── 5. count is magnitude ────────────────────────────────────────────
console.log('\n— you can read the size of a thing by looking at it —');
{
  Q.setQualityLevel(4);

  P.resetParticles(); P.impact(O, V, 'kinetic', 2);
  const small = P.particleCount();
  P.resetParticles(); P.impact(O, V, 'kinetic', 60);
  const big = P.particleCount();
  ok('a bigger hit throws more', big > small, `${small} → ${big}`);
  ok('but it is capped', big <= PARTICLES.impactMax, String(big));
  ok('and the smallest hit still shows something', small >= PARTICLES.impactMin, String(small));

  P.resetParticles(); P.debris(O, V, 'ore', 0.05);
  const poor = P.particleCount();
  P.resetParticles(); P.debris(O, V, 'ore', 1);
  const rich = P.particleCount();
  ok('a rich seam throws more than a poor one', rich > poor, `${poor} → ${rich}`);

  // Thermal is distinguishable after the flash: it leaves smoke, kinetic does not.
  P.resetParticles(); P.impact(O, V, 'kinetic', 20);
  const kin = P.particleCount();
  P.resetParticles(); P.impact(O, V, 'thermal', 20);
  const therm = P.particleCount();
  ok('thermal leaves something behind that kinetic does not', therm > kin, `${kin} vs ${therm}`);

  // Shield versus hull: same event size, visibly different behaviour. The shield splash is
  // slower and wider, so it spreads across a surface instead of coming off it.
  P.resetParticles(); P.shieldSplash(O, V, 20);
  ok('a shield hit produces its own effect', P.particleCount() > 0);

  // Throttle gates the plume: an idling ship does not emit one.
  P.resetParticles(); P.plume(O, V, 0, 0);
  ok('an idle drive emits nothing', P.particleCount() === 0);
  P.resetParticles(); P.plume(O, V, 1, 0);
  const cold = P.particleCount();
  ok('a running one does', cold > 0);

  // Heat shifts the plume toward the hot end of the ramp — the readout claim.
  P.resetParticles(); P.plume(O, V, 1, 0);
  const coldR = channel(0);
  P.resetParticles(); P.plume(O, V, 1, 1);
  const hotR = channel(0);
  ok('and a hot drive burns redder than a cold one', hotR > coldR,
     `${coldR.toFixed(2)} → ${hotR.toFixed(2)}`);

  Q.setQualityLevel(3);
}

function channel(i) {
  const pts = SC.scene.children.find(c => c.geometry && c.geometry.attributes &&
                                       c.geometry.attributes.aSize);
  P.syncParticles();
  return pts.geometry.attributes.color.array[i * 3];
}

// ── 6. one pool, one draw call ───────────────────────────────────────
console.log('\n— the systems it replaced are actually gone —');
{
  const fs = await import('node:fs');
  const src = p => fs.readFileSync(new URL('src/' + p, ROOT).pathname, 'utf8');

  ok('combat no longer keeps its own points buffer',
     !/new THREE\.Points\(/.test(src('systems/combat/combat.js')));
  ok('nor its own particle array', !/MAX_PARTICLES/.test(src('systems/combat/combat.js')));
  ok('the player no longer keeps a thruster buffer',
     !/THRUSTER_COUNT/.test(src('entities/player.js')));
  ok('mining emits debris', /debris\(/.test(src('systems/industry/mining.js')));
  ok('the pool is stepped from the frame loop', /updateParticles\(dt\)/.test(src('main.js')));
  // And it is skipped with the render for a career that is not looking at the world — the
  // v1.02.31 rule, applied to the system most likely to forget it.
  // The gate grew a second condition at v1.02.47: the chart draws its own scene into the
  // same renderer, so the world must not also draw. One scene per frame, never two.
  ok('and skipped when nobody is looking at the world',
     /if \(!execHudActive\(\) && !galaxyMapOpen\(\)\) \{\s*\n\s*updateParticles\(dt\);/.test(src('main.js')));

  // Exactly one Points object in the scene: the pool.
  const pts = SC.scene.children.filter(c => c.geometry && c.geometry.attributes &&
                                         c.geometry.attributes.aSize);
  ok('there is exactly one particle object in the scene', pts.length === 1, String(pts.length));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
