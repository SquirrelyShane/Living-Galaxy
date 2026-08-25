import { installGlobals } from './stub.mjs';
const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);
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
function boot(seed){
  S.world.npcs.length=0;S.world.bodies.length=0;S.world.stations.length=0;
  S.world.asteroids.length=0;S.world.belts.length=0;S.systemPlan=null;
  initScene();recalcStats();seedWorld(seed);createSystem();createAsteroids();
  initProjectiles();initCombat();initMining();initPlayerFx();
  npcs.registerNpcFactories();npcs.createNpcs();resetReputation();updateSystem(1);
}
boot(31337);
const a=S.world.npcs.map(n=>`${n.userData.name}@${Math.round(n.position.x)},${Math.round(n.position.z)}`);
boot(31337);
const b=S.world.npcs.map(n=>`${n.userData.name}@${Math.round(n.position.x)},${Math.round(n.position.z)}`);
console.log('len', a.length, b.length);
for(let i=0;i<Math.min(a.length,b.length);i++) if(a[i]!==b[i]) { console.log(i, a[i], '||', b[i]); }
