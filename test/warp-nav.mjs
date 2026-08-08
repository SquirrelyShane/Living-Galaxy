// Warp navigation: can the autopilot reach a destination on the far side of the star?
import { installGlobals } from './stub.mjs';
const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);
const imp = p => import(new URL('src/' + p, ROOT).href);
const { S, recalcStats } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');
const { initScene } = await imp('world/scene.js');
const { createSystem, updateSystem } = await imp('world/system.js');
const { createAsteroids, updateAsteroids } = await imp('world/asteroids.js');
const { initPlayerFx, updatePlayer } = await imp('entities/player.js');
const { createNpcs, updateNpcs } = await imp('entities/npcs.js');
const { initProjectiles, updateProjectiles } = await imp('systems/projectiles.js');
const { initCombat, updateCombat } = await imp('systems/combat.js');
const { updateWeapons } = await imp('systems/weapons.js');
const { initMining, updateMining } = await imp('systems/mining.js');
const { updateWarp, toggleWarp, setCourse, wellRadius } = await imp('systems/warp.js');
const { updateTargeting } = await imp('systems/targeting.js');
const { updateDocking } = await imp('systems/economy.js');
initScene(); recalcStats(); seedWorld(20260728); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx(); createNpcs(); S.running = true;
const step = dt => { S.time += dt; updateWarp(dt); updatePlayer(dt); updateWeapons(dt); updateMining(dt);
  updateSystem(dt); updateAsteroids(dt); updateNpcs(dt); updateProjectiles(dt);
  updateCombat(dt); updateDocking(); updateTargeting(); };

let pass = 0, fail = 0;
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ok   ' + n)) : (fail++, console.log('  FAIL ' + n + ' — ' + e)); };

function trip(destName, startPos, label) {
  const dest = S.world.bodies.find(b => b.userData.name === destName);
  S.player.classKey = 'military'; recalcStats();
  S.player.position.copy(startPos); S.player.velocity.set(0, 0, 0);
  S.warp.state = 'idle'; S.warp.charge = 0; S.warp.dest = null;
  S.player.throttle = 0; S.input.firing = false;
  let hops = 0, frames = 0;
  while (hops < 6) {
    S.player.energy = S.stats.energyCap;              // recharge between hops
    setCourse(dest, destName); toggleWarp(); hops++;
    let g = 0;
    while (g++ < 200000 && S.warp.state !== 'cooldown') { step(1 / 60); frames++; }
    while (S.warp.state !== 'idle') { step(1 / 60); frames++; }
    if (S.player.position.distanceTo(dest.position) < arriveBand(dest)) break;
  }
  const d = S.player.position.distanceTo(dest.position);
  // Warp now drops at the destination's gravity-well edge — that IS arrival for a
  // warp core. Closing the last stretch is the approach autopilot's job.
  ok(`${label} — reached the well`, d < arriveBand(dest),
     `${d.toFixed(0)} km out, well edge ${arriveBand(dest).toFixed(0)} km, ${hops} hops`);
  console.log(`       ${hops} hop(s), ${(frames / 60).toFixed(1)} s of flight, ${d.toFixed(0)} km out`);
}

function arriveBand(dest) {
  const u = dest.userData;
  return u.radius + wellRadius(u) * 1.25 + 1200;
}

// ── seed sweep ───────────────────────────────────────────────────────
// v0.2's planner scored 5/5 on the tuned seeds and 3/5 elsewhere, so passing on one
// seed proved nothing. This plans (not flies — flying 100 trips would take minutes)
// across many seeds and asserts every returned course is geometrically clear.
async function sweep(seeds) {
  const { planCourse, wellRadius: wr } = await imp('systems/warp.js');
  const { routeClear } = await imp('systems/navplan.js');
  let plans = 0, clear = 0, direct = 0;
  const worst = [];
  for (const seed of seeds) {
    S.world.bodies.length = 0;
    seedWorld(seed); createSystem();
    const targets = S.world.bodies.filter(b => b.userData.kind === 'planet');
    for (const dest of targets) {
      for (const start of SWEEP_STARTS) {
        plans++;
        const wp = planCourse(start, dest);
        if (!wp.length) direct++;
        if (routeClear(start, wp, dest.position, S.world.bodies, wr, dest)) clear++;
        else worst.push(`seed ${seed} → ${dest.userData.name} from ${start.z.toFixed(0)}`);
      }
    }
  }
  return { plans, clear, direct, worst };
}

console.log('\n— warp navigation —');
const V = THREE.Vector3;
// Aether orbits at 2,800 — close enough to the star that a naive straight line
// from the far side flies through it.
trip('Aether',  new V(0, 0, 33000),      'far side of the star');
trip('Aether',  new V(0, 0, -33000),     'far side, opposite approach');
trip('Vulcan',  new V(28000, 0, 14000),  'inner planet, oblique approach');
// must start clear of the star's own gravity well — you cannot spool inside one
trip('Obscura', new V(0, 0, 4200),       'outward from the core');
trip('Gaia',    new V(-24000, 0, -9000), 'mid system, diagonal');

console.log('\n— planner seed sweep —');
const SWEEP_STARTS = [new V(0, 0, 42000), new V(0, 0, -42000), new V(38000, 0, 12000),
                      new V(-30000, 2000, -22000), new V(0, 0, 5200)];
const seeds = [];
for (let i = 0; i < 20; i++) seeds.push(1337 + i * 7919);
const sw = await sweep(seeds);
ok(`every plotted course is clear (${sw.clear}/${sw.plans} over ${seeds.length} seeds)`,
   sw.clear === sw.plans, sw.worst.slice(0, 4).join(' · '));
ok('the planner is not just returning straight lines',
   sw.direct < sw.plans * 0.9, `${sw.direct}/${sw.plans} direct`);
console.log(`       ${sw.plans} courses, ${sw.plans - sw.direct} needed waypoints`);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
