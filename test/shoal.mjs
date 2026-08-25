// Slice — a thousand ships, in two tiers.
//
// The three properties that make the second tier safe, each asserted directly:
//
//   1. **It is additive.** The shoal draws from its own RNG stream, so the authored roster
//      and every other seeded decision in the world are byte-identical to what they were
//      before it existed. This is the one that would be catastrophic and silent to get
//      wrong — belt counts were reverted in v1.02.54 for exactly this reason.
//   2. **Promotion is invisible.** It happens outside every sensor and well outside the
//      range a hull mesh is drawn at, so no instrument can ever observe a ship arriving.
//   3. **Nothing that matters is demoted.** A hull that is hired, contracted, fleeing,
//      docked or dead stays real however far it drifts.

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
const { initScene } = await imp('world/scene.js');
const { createSystem, updateSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { initPlayerFx } = await imp('entities/player.js');
const npcs = await imp('entities/npcs.js');
const { initProjectiles } = await imp('systems/combat/projectiles.js');
const { initCombat } = await imp('systems/combat/combat.js');
const { initMining } = await imp('systems/industry/mining.js');
const { resetReputation } = await imp('systems/company/reputation.js');
const shoal = await imp('systems/npc/shoal.js');
const { SHOAL, NPC_TYPES, RENDER_RANGE, SHIP_CLASSES } = await imp('core/config.js');
const { resetFactories } = await imp('core/spawn.js');

/**
 * A clean world.
 *
 * `createSystem` appends rather than replacing — it is called once per session in the game,
 * and `systems/flight/jump.js` has its own teardown for the one case that re-enters. A suite
 * that boots five times has to do the same clearing, or the second boot has two stars, twice
 * the berths and therefore different lanes, and every determinism assertion below fails for
 * a reason that has nothing to do with what it is testing.
 */
function boot(seed) {
  S.world.npcs.length = 0;
  S.world.bodies.length = 0;
  S.world.stations.length = 0;
  S.world.asteroids.length = 0;
  S.world.belts.length = 0;
  S.systemPlan = null;
  shoal.resetShoal();
  initScene(); recalcStats(); seedWorld(seed);
  createSystem(); createAsteroids();
  initProjectiles(); initCombat(); initMining(); initPlayerFx();
  npcs.registerNpcFactories();
  npcs.createNpcs();
  resetReputation();
  updateSystem(1);
  S.running = true;
}

// ── additive, not disruptive ─────────────────────────────────────────
console.log('\n— the shoal is additive —');
{
  boot(31337);
  const before = S.world.npcs.map(n => `${n.userData.name}@${Math.round(n.position.x)},${Math.round(n.position.z)}`);
  const beltBefore = S.world.asteroids.slice(0, 40).map(a => Math.round(a.orbitRadius));

  const n = shoal.createShoal();
  ok('a shoal is built', n === SHOAL.count, String(n));

  // The authored cast must not have moved. Rebuild the world from the same seed and check
  // it comes out the same — if `createShoal` had touched `wrand`, it would not.
  boot(31337);
  shoal.createShoal();
  const after = S.world.npcs.map(n2 => `${n2.userData.name}@${Math.round(n2.position.x)},${Math.round(n2.position.z)}`);
  ok('the authored roster is unchanged', before.join('|') === after.join('|'));
  ok('and so is the belt',
     beltBefore.join(',') === S.world.asteroids.slice(0, 40).map(a => Math.round(a.orbitRadius)).join(','));

  // Determinism of the shoal itself.
  const a1 = shoal.shoalRecords().map(r => `${r.key}:${Math.round(r.orbitR)}`).join('|');
  boot(31337);
  shoal.createShoal();
  const a2 = shoal.shoalRecords().map(r => `${r.key}:${Math.round(r.orbitR)}`).join('|');
  ok('the same seed makes the same shoal', a1 === a2);

  boot(99);
  shoal.createShoal();
  const a3 = shoal.shoalRecords().map(r => `${r.key}:${Math.round(r.orbitR)}`).join('|');
  ok('a different seed makes a different one', a3 !== a1);
}

// ── what it is made of ───────────────────────────────────────────────
console.log('\n— the population —');
{
  boot(4242);
  shoal.createShoal();
  const recs = shoal.shoalRecords();
  const rep = shoal.shoalReport();

  ok('a thousand-hull system', rep.total >= 950, String(rep.total));
  ok('every record has a position', recs.every(r => r.position && isFinite(r.position.x)));
  ok('every record has a real type', recs.every(r => !!NPC_TYPES[r.key]));
  ok('names cannot collide with the authored roster', (() => {
    const authored = new Set(S.world.npcs.map(n => n.userData.name));
    return recs.every(r => !authored.has(r.name));
  })());

  // The mix is what makes it an economy rather than a battlefield.
  const workers = (rep.byRole.haul || 0) + (rep.byRole.mine || 0) + (rep.byRole.build || 0);
  ok('most of it is people working', workers > rep.total * 0.5,
     `${workers} of ${rep.total}`);
  ok('and enough raiders to matter', (rep.byFaction.hostile || 0) > 40,
     String(rep.byFaction.hostile));
  ok('there is lane traffic', rep.lanes > 30, String(rep.lanes));
  ok('nothing is promoted yet', rep.promoted === 0);
}

// ── promotion happens where nobody can see it ────────────────────────
console.log('\n— the seam —');
{
  ok('promotion is outside every sensor',
     SHOAL.promoteAt > Math.max(...Object.values(NPC_TYPES).map(t => t.sensor)),
     String(SHOAL.promoteAt));
  ok('and outside the player\'s own',
     SHOAL.promoteAt > Math.max(...Object.values(SHIP_CLASSES).map(c => c.sensor)));
  ok('and well outside where a hull is drawn',
     SHOAL.promoteAt > RENDER_RANGE.ship * 2, String(RENDER_RANGE.ship));
  ok('demotion is further out than promotion — hysteresis',
     SHOAL.demoteAt > SHOAL.promoteAt, `${SHOAL.promoteAt} / ${SHOAL.demoteAt}`);
  ok('by a real margin, not a pixel', SHOAL.demoteAt - SHOAL.promoteAt > 1500,
     String(SHOAL.demoteAt - SHOAL.promoteAt));

  boot(4242);
  shoal.createShoal();
  const rec = shoal.shoalRecords()[0];
  // Put the player on top of it and step.
  S.player.position.copy(rec.position);
  const liveBefore = S.world.npcs.length;
  shoal.updateShoal(1);
  ok('a record next to the player becomes a hull', S.world.npcs.length > liveBefore,
     `${liveBefore} → ${S.world.npcs.length}`);

  const live = S.world.npcs.find(n => n.userData.shoalId != null);
  ok('the hull is marked as belonging to a record', !!live);
  ok('it kept the record\'s name', live && live.userData.name === (shoal.shoalRecords()
     .find(r => r.id === live.userData.shoalId) || {}).name);
  ok('it has hit points', live && live.userData.hp > 0);
  ok('it is in the scene roster', S.world.npcs.indexOf(live) >= 0);

  // Arrival is rate-limited so flying into traffic cannot spike a frame with mesh builds.
  ok('no more than the per-tick promotion budget arrived at once',
     S.world.npcs.length - liveBefore <= SHOAL.promotePerTick,
     String(S.world.npcs.length - liveBefore));

  // Damage it, take the player away, and check the state comes back with the record.
  const id = live.userData.shoalId;
  live.userData.hp = 12;
  S.player.position.set(0, 0, 0);
  live.position.set(SHOAL.demoteAt + 4000, 0, 0);
  shoal.updateShoal(1);
  const back = shoal.shoalRecords().find(r => r.id === id);
  ok('a hull that drifts far enough goes back to being a record',
     S.world.npcs.indexOf(live) < 0);
  ok('and the record remembers the damage', back && back.hp === 12, back && String(back.hp));
  ok('and where it was', back && Math.round(back.orbitR) === SHOAL.demoteAt + 4000,
     back && String(Math.round(back.orbitR)));
  ok('the record is free to promote again', back && back.live === null);
}

// ── what is never taken back ─────────────────────────────────────────
console.log('\n— the exemptions —');
{
  boot(4242);
  shoal.createShoal();
  const rec = shoal.shoalRecords()[3];
  S.player.position.copy(rec.position);
  shoal.updateShoal(1);
  const live = S.world.npcs.find(n => n.userData.shoalId != null);
  ok('something is live to test with', !!live);

  const far = () => { live.position.set(SHOAL.demoteAt + 9000, 0, 0); S.player.position.set(0, 0, 0); };

  for (const [label, apply, undo] of [
    ['a hull under contract', () => { live.userData.contract = { kind: 'player' }; },
     () => { live.userData.contract = null; }],
    ['a company hull', () => { live.userData.contractId = 'c1'; }, () => { live.userData.contractId = null; }],
    ['one that is running', () => { live.userData.stance = 'flee'; }, () => { live.userData.stance = null; }],
    ['one parked at a berth', () => { live.userData.dockedAt = {}; }, () => { live.userData.dockedAt = null; }],
    ['a dead one', () => { live.userData.hp = 0; }, () => { live.userData.hp = 50; }]
  ]) {
    apply();
    far();
    shoal.updateShoal(1);
    ok(`${label} is never demoted`, S.world.npcs.indexOf(live) >= 0);
    undo();
  }

  // And with none of them set, it goes.
  far();
  shoal.updateShoal(1);
  ok('an ordinary hull far from anything does go', S.world.npcs.indexOf(live) < 0);
}

// ── the authored cast is never touched ───────────────────────────────
console.log('\n— the cast stays —');
{
  boot(4242);
  shoal.createShoal();
  const authored = S.world.npcs.slice();
  ok('there is an authored cast', authored.length > 20, String(authored.length));
  ok('none of them carry a record id',
     authored.every(n => n.userData.shoalId == null));
  for (const n of authored) n.position.set(SHOAL.demoteAt + 20000, 0, 0);
  S.player.position.set(0, 0, 0);
  for (let i = 0; i < 5; i++) shoal.updateShoal(1);
  ok('and none of them are demoted however far they go',
     authored.every(n => S.world.npcs.indexOf(n) >= 0));
}

// ── the cap holds ────────────────────────────────────────────────────
console.log('\n— the live cap —');
{
  boot(4242);
  shoal.createShoal();
  // Drag the player along the shoal's own orbit so it meets a lot of them.
  for (let i = 0; i < 400; i++) {
    const rec = shoal.shoalRecords()[i % shoal.shoalRecords().length];
    S.player.position.copy(rec.position);
    shoal.updateShoal(0.2);
  }
  ok('the live roster never exceeded the cap', S.world.npcs.length <= SHOAL.liveCap,
     `${S.world.npcs.length} / ${SHOAL.liveCap}`);
  const rep = shoal.shoalReport();
  ok('the total is conserved across both tiers', rep.total >= SHOAL.count,
     `${rep.total} vs ${SHOAL.count}`);
  ok('the traffic line names real numbers', /hulls under way/.test(shoal.trafficLine(3)));
}

// ── it degrades without an entity layer ──────────────────────────────
console.log('\n— headless —');
{
  boot(4242);
  shoal.createShoal();
  resetFactories();                       // no way to build a hull at all
  const rec = shoal.shoalRecords()[0];
  S.player.position.copy(rec.position);
  let threw = false;
  try { shoal.updateShoal(1); } catch (e) { threw = true; }
  ok('stepping without a factory does not throw', !threw);
  ok('and simply promotes nothing', rec.live === null);
  npcs.registerNpcFactories();
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
