// Tool, not a suite: does the fee the freight board quotes actually get taken?
//
// Written for v1.01.98 because `suggestMargin` carried the comment "so a post usually lands"
// and nobody had ever counted. It is not in all.mjs — it reports a rate, it does not assert
// one, and a percentage that moves with tuning is not a pass/fail line.
//
//   node test/fee-probe.mjs
import { installGlobals } from './stub.mjs';
const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);
const imp = p => import(new URL('src/' + p, ROOT).href);

const { S, recalcStats } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');
const { initScene } = await imp('world/scene.js');
const { createSystem } = await imp('world/system.js');
<<<<<<< HEAD
const { initMarket } = await imp('systems/trade/market.js');
const { spawnNpc } = await imp('entities/npcs.js');
const { COMMODITIES, DEALS } = await imp('core/config.js');
const D = await imp('systems/trade/deals.js');
=======
const { initMarket } = await imp('systems/market.js');
const { spawnNpc } = await imp('entities/npcs.js');
const { COMMODITIES, DEALS } = await imp('core/config.js');
const D = await imp('systems/deals.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

initScene();
recalcStats();
seedWorld(20260808);
createSystem();
initMarket();

let uid = 0;
function trial(nHaulers, commodity) {
  S.world.npcs.length = 0;
  S.deals = { open: [], done: 0, failed: 0 };
  S.brains = { personas: {} };
  S.npcComms = { pairs: {}, exchanges: 0 };
  S.credits = 5e6;
  S.time = 1000;
  for (let i = 0; i < nHaulers; i++) {
    const n = spawnNpc('hauler', ++uid);
    n.position.set(8000 + i * 40, 0, 0);
  }
  const dest = S.world.stations[1].userData.name;
  const fee = D.suggestedFee(commodity, 1000, dest);
  const bars = S.world.npcs.map(n => D.acceptanceBar({ name: 'player' }, n.userData));
  const deal = D.postPlayerJob({ commodity, kg: 1000, pay: fee, dest });
  return { fee, took: !!deal, bestBar: Math.min(...bars) };
}

console.log(`static quote would be baseBar × suggestMargin = ` +
            `${(DEALS.baseBar * DEALS.suggestMargin).toFixed(3)} of cargo worth\n`);

for (const commodity of Object.keys(COMMODITIES)) {
  for (const n of [1, 2, 4]) {
    let took = 0, feeSum = 0, barSum = 0;
    const runs = 120;
    for (let i = 0; i < runs; i++) {
      const r = trial(n, commodity);
      if (r.took) took++;
      feeSum += r.fee;
      barSum += r.bestBar;
    }
    console.log(`${commodity.padEnd(8)} ${n} hauler(s): taken ${String(took).padStart(3)}/${runs} ` +
                `(${String(Math.round(took / runs * 100)).padStart(3)}%) · mean fee ` +
                `${String(Math.round(feeSum / runs)).padStart(6)} cr · mean best bar ` +
                `${(barSum / runs).toFixed(3)}`);
  }
}
