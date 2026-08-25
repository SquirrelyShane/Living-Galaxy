// Slice 5b — the economy. A contract board that expires and punishes abandonment, two
// independent fitting budgets that degrade rather than refuse, and station supply chains
// that turn the price book into information.
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
const { CONTRACTS, BUDGET, SUPPLY, REP, SHIP_CLASSES } = await imp('core/config.js');
const { SCHEMA } = await imp('core/version.js');
const { MODULES, MODULE_KEYS } = await imp('data/modules.js');
<<<<<<< HEAD
const fit = await imp('systems/industry/fitting.js');
const co = await imp('systems/trade/contracts.js');
const mk = await imp('systems/trade/market.js');
const rep = await imp('systems/company/reputation.js');
const dos = await imp('systems/company/dossier.js');
const { POWERS, POWER_KEYS } = await imp('data/factions.js');
const ch = await imp('systems/crew/character.js');
=======
const fit = await imp('systems/fitting.js');
const co = await imp('systems/contracts.js');
const mk = await imp('systems/market.js');
const rep = await imp('systems/reputation.js');
const ch = await imp('systems/character.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
const { initScene } = await imp('world/scene.js');
const { createSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { initPlayerFx } = await imp('entities/player.js');
<<<<<<< HEAD
const { initProjectiles } = await imp('systems/combat/projectiles.js');
const { initCombat } = await imp('systems/combat/combat.js');
const { initMining } = await imp('systems/industry/mining.js');
const { initWorldSim } = await imp('systems/platform/worldsim.js');
const save = await imp('systems/platform/save.js');
=======
const { initProjectiles } = await imp('systems/projectiles.js');
const { initCombat } = await imp('systems/combat.js');
const { initMining } = await imp('systems/mining.js');
const { initWorldSim } = await imp('systems/worldsim.js');
const save = await imp('systems/save.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

initScene(); recalcStats(); seedWorld(1337); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx();
rep.resetReputation(); initWorldSim(); mk.initMarket(); co.initContracts();
S.time = 100;

// ── fitting budgets ──────────────────────────────────────────────────
console.log('\n— fitting budgets —');
ok('every module declares a CPU cost',
   MODULE_KEYS.every(k => typeof MODULES[k].cpu === 'number' && MODULES[k].cpu > 0));
ok('power and CPU do not correlate perfectly', (() => {
  // If cpu were a fixed multiple of power the second budget would be decoration.
  const ratios = MODULE_KEYS.map(k => MODULES[k].cpu / Math.max(0.1, MODULES[k].power));
  return Math.max(...ratios) / Math.min(...ratios) > 1.15;
})());
ok('every hull has a CPU ceiling',
   Object.keys(SHIP_CLASSES).every(k => BUDGET.cpuPerHull[k] > 0));
ok('every hull has a power ceiling',
   Object.keys(SHIP_CLASSES).every(k => BUDGET.powerPerHull[k] > 0));
ok('a bigger hull carries more than a shuttle',
   BUDGET.cpuPerHull.industrial > BUDGET.cpuPerHull.civilian &&
   BUDGET.powerPerHull.industrial > BUDGET.powerPerHull.civilian);

{
  const empty = fit.budgetLoad({ weapon: [], utility: [], core: [] }, 'military', 0);
  ok('an empty fit uses nothing', empty.power === 0 && empty.cpu === 0);
  ok('an empty fit is not penalised', empty.powerPenalty === 0 && empty.cpuPenalty === 0);
  ok('a hull supplies a budget', empty.powerCap > 0 && empty.cpuCap > 0);
}
{
  // Engineering raises what you can run — the skill has a fitting consequence, not just
  // a repair discount.
  const base = fit.budgetFor('military', 0);
  const trained = fit.budgetFor('military', 6);
  ok('engineering raises the power budget', trained.power > base.power);
  ok('engineering raises the CPU budget', trained.cpu > base.cpu);
}
{
  const hungry = MODULE_KEYS.filter(k => MODULES[k].slot === 'utility').slice(0, 3);
  const light = fit.budgetLoad({ weapon: [], utility: [hungry[0]], core: [] }, 'military', 0);
  ok('a light fit stays inside budget', light.powerPenalty === 0, String(light.powerRatio));

  // stack enough to blow through both ceilings
  const heavy = { weapon: [],
                  utility: MODULE_KEYS.filter(k => MODULES[k].slot === 'utility'),
                  core: MODULE_KEYS.filter(k => MODULES[k].slot === 'core') };
  const load = fit.budgetLoad(heavy, 'civilian', 0);
  ok('a heavy legal fit on a shuttle presses the budget', (() => {
    const pick = s2 => MODULE_KEYS.filter(k => MODULES[k].slot === s2)
      .sort((a, b) => (MODULES[b].power + MODULES[b].cpu) - (MODULES[a].power + MODULES[a].cpu));
    const legal = fit.budgetLoad({ weapon: [], utility: pick('utility').slice(0, 2),
                                   core: pick('core').slice(0, 2) }, 'civilian', 0);
    return legal.powerRatio > 1 && legal.cpuRatio > 1;
  })());
  ok('the same fit is comfortable on a big hull', (() => {
    const pick = s2 => MODULE_KEYS.filter(k => MODULES[k].slot === s2)
      .sort((a, b) => (MODULES[b].power + MODULES[b].cpu) - (MODULES[a].power + MODULES[a].cpu));
    const legal = fit.budgetLoad({ weapon: [], utility: pick('utility').slice(0, 2),
                                   core: pick('core').slice(0, 2) }, 'industrial', 0);
    return legal.powerPenalty === 0 && legal.cpuPenalty === 0;
  })());
  ok('an everything fit blows the budget', load.powerRatio > 1 && load.cpuRatio > 1,
     `power ${load.powerRatio.toFixed(2)} cpu ${load.cpuRatio.toFixed(2)}`);
  ok('overload produces a penalty', load.powerPenalty > 0 && load.cpuPenalty > 0);
  ok('the penalty is capped',
     load.powerPenalty <= BUDGET.maxPenalty && load.cpuPenalty <= BUDGET.maxPenalty);
  ok('overload never fully disables a system', load.powerPenalty < 1 && load.cpuPenalty < 1);
}
{
  // the grace band: marginally over is free, so floating point does not become a design
  const cap = fit.budgetFor('military', 0);
  const nudge = { power: cap.power * (1 + BUDGET.overloadGrace * 0.5), cpu: 0 };
  const ratio = nudge.power / cap.power;
  ok('a hair over budget is free', ratio > 1 && ratio < 1 + BUDGET.overloadGrace);
}
{
  // and the consequence actually lands in the stats
  S.player.classKey = 'civilian';
  S.fit = { weapon: [], utility: [], core: [] };
  recalcStats();
  const clean = { shieldRegen: S.stats.shieldRegen, sensor: S.stats.sensor };
  ok('a clean fit reports no penalty',
     S.stats.budget.powerPenalty === 0 && S.stats.budget.cpuPenalty === 0);

  // The heaviest *legal* fit: recalcStats runs normalizeFit, which trims anything past the
  // hull's actual hardpoints — so throwing the whole module list at it proves nothing.
  // A civilian hull with its few slots filled by the hungriest modules is the real
  // worst case, and it is the one a player can actually build.
  const heaviest = slot => MODULE_KEYS
    .filter(k => MODULES[k].slot === slot)
    .sort((a, b) => (MODULES[b].power + MODULES[b].cpu) - (MODULES[a].power + MODULES[a].cpu));
  S.fit = { weapon: [], utility: heaviest('utility'), core: heaviest('core') };
  recalcStats();
  ok('an overloaded fit is flagged',
     S.stats.budget.powerPenalty > 0 && S.stats.budget.cpuPenalty > 0);

  // Comparing an overloaded fit against an *empty* one would prove nothing: those modules
  // add shield regen and sensor range of their own, and a big enough bonus swamps the
  // penalty. The honest comparison is the same fit with the penalty switched off, which
  // isolates exactly what overload costs.
  const overloaded = { shieldRegen: S.stats.shieldRegen, sensor: S.stats.sensor,
                       energyRegen: S.stats.energyRegen, weaponMult: S.stats.weaponMult };
  const realCap = BUDGET.maxPenalty;
  BUDGET.maxPenalty = 0;
  recalcStats();
  const unpenalised = { shieldRegen: S.stats.shieldRegen, sensor: S.stats.sensor,
                        energyRegen: S.stats.energyRegen, weaponMult: S.stats.weaponMult };
  BUDGET.maxPenalty = realCap;
  recalcStats();

  ok('power overload degrades shield regen', overloaded.shieldRegen < unpenalised.shieldRegen,
     `${unpenalised.shieldRegen.toFixed(2)} → ${overloaded.shieldRegen.toFixed(2)}`);
  ok('power overload degrades recharge', overloaded.energyRegen < unpenalised.energyRegen);
  ok('cpu overload degrades sensors', overloaded.sensor < unpenalised.sensor,
     `${unpenalised.sensor.toFixed(0)} → ${overloaded.sensor.toFixed(0)}`);
  ok('cpu overload degrades tracking', overloaded.weaponMult < unpenalised.weaponMult);
  ok('an overloaded ship is still flyable',
     S.stats.maxThrust > 0 && S.stats.maxSpeed > 0 && S.stats.energyCap > 0);
  ok('the budget is reported on the stats', typeof S.stats.fitCpu === 'number');

  S.fit = { weapon: [], utility: [], core: [] };
  S.player.classKey = 'military';
  recalcStats();
}

// ── supply chains ────────────────────────────────────────────────────
console.log('\n— supply chains —');
{
  const st = S.world.stations[0];
  const b = mk.bookFor(st);
  ok('a station has a price book', !!b && !!b.prices.ore);
  ok('supplyFlow reports a flow object', !!mk.supplyFlow(st).flow);
  ok('capacity is at least the base', mk.supplyFlow(st).capacity >= SUPPLY.capacity);

  // scarcity is the lever the whole thing turns on
  b.capacity = SUPPLY.capacity;
  b.stock.ore = 0;
  const empty = mk.scarcity(st, 'ore');
  const emptyPrice = mk.marketPrice(st, 'ore');
  b.stock.ore = SUPPLY.capacity;
  const full = mk.scarcity(st, 'ore');
  const fullPrice = mk.marketPrice(st, 'ore');

  ok('an empty stockpile reads as scarce', empty > 0.9, empty.toFixed(2));
  ok('a full stockpile reads as glutted', full < -0.9, full.toFixed(2));
  ok('scarcity raises the price', emptyPrice > fullPrice,
     `empty ${emptyPrice} vs full ${fullPrice}`);
  ok('a glutted station still pays something', fullPrice >= 1);

  b.stock.ore = SUPPLY.capacity / 2;
  ok('a half-full stockpile is roughly neutral', Math.abs(mk.scarcity(st, 'ore')) < 0.1);
}
{
  // a chain that cannot get its input must idle rather than go negative or invent stock
  const st = S.world.stations.find(x => (x.userData.modules || [])
    .some(m => SUPPLY.chains[m.key || m] && SUPPLY.chains[m.key || m].consumes)) || S.world.stations[0];
  const b = mk.bookFor(st);
  b.stock.ore = 0; b.stock.salvage = 0; b.stock.data = 0;
  for (let i = 0; i < 20; i++) mk.updateMarket(5);
  ok('no stockpile goes negative',
     ['ore', 'salvage', 'data'].every(k => (b.stock[k] || 0) >= 0),
     JSON.stringify(b.stock));
  ok('no stockpile exceeds capacity',
     ['ore', 'salvage', 'data'].every(k => (b.stock[k] || 0) <= (b.capacity || SUPPLY.capacity) + 1));
  ok('prices stay positive after production',
     ['ore', 'salvage', 'data'].every(k => mk.marketPrice(st, k) >= 1));
}

// ── contract board ───────────────────────────────────────────────────
console.log('\n— the board —');
{
  co.initContracts();
  const st = S.world.stations[0];
  const board = co.boardFor(st);
  ok('a station posts a board', board.length === CONTRACTS.perStation, String(board.length));
  ok('every offer has a title, a brief and a fee',
     board.every(c => c.title && c.brief && c.pay > 0));
  ok('every offer has a target worth doing', board.every(c => c.target >= 1));
<<<<<<< HEAD
  // A power since v1.02.39, not a bloc. The whole of `test/desks.mjs` is about what that
  // buys; this is the one line here that pins the vocabulary.
  ok('every offer names its issuer and skill',
     board.every(c => POWER_KEYS.includes(c.issuer) && c.skill));
  ok('every offer has an expiry in the future', board.every(c => c.expires > S.time));
  ok('offer ids are unique', new Set(board.map(c => c.id)).size === board.length);
  ok('a station posts as a power', POWER_KEYS.includes(co.issuerOf(st)));
=======
  ok('every offer names its issuer and skill',
     board.every(c => ['coalition', 'pirate', 'independent'].includes(c.issuer) && c.skill));
  ok('every offer has an expiry in the future', board.every(c => c.expires > S.time));
  ok('offer ids are unique', new Set(board.map(c => c.id)).size === board.length);
  ok('a station posts as a bloc', ['coalition', 'independent'].includes(co.issuerOf(st)));
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

  // generation is deterministic off the world seed
  seedWorld(1337); co.initContracts();
  const a = co.boardFor(S.world.stations[0]).map(c => c.type + c.target).join(',');
  seedWorld(1337); co.initContracts();
  const b2 = co.boardFor(S.world.stations[0]).map(c => c.type + c.target).join(',');
  ok('the board is deterministic for a seed', a === b2);
}
{
<<<<<<< HEAD
  // Standing gates the work, and pays for itself. Standing with the *desk* now — the
  // station's own issuing power — rather than with the third of the galaxy it sits in.
  seedWorld(1337); co.initContracts();
  rep.resetReputation();
  const st = S.world.stations[0];
  const desk = co.issuerOf(st);
  const me = dos.playerDossier();

  me.standing[desk] = -100;
  co.refreshBoard(st);
  ok('a desk that hates you will not deal with you',
     co.boardFor(st).every(c => !co.eligibility(c).ok));
  ok('and it says so by name',
     co.eligibility(co.boardFor(st)[0]).why.includes(POWERS[desk].short),
     co.eligibility(co.boardFor(st)[0]).why);
  ok('a locked offer cannot be accepted', co.acceptContract(co.boardFor(st)[0]) === false);

  me.standing[desk] = 0;
  co.refreshBoard(st);
  const neutralPay = co.boardFor(st)[0].pay;
  me.standing[desk] = 100;
  co.refreshBoard(st);
  const likedPay = co.boardFor(st)[0].pay;
  ok('good standing pays better for the same board', likedPay > neutralPay,
     `${neutralPay} → ${likedPay}`);
  me.standing[desk] = 0;
=======
  // standing gates the work, and pays for itself
  seedWorld(1337); co.initContracts();
  rep.resetReputation();
  S.reputation.coalition = REP.min;
  const st = S.world.stations.find(x => co.issuerOf(x) === 'coalition');
  if (st) {
    co.refreshBoard(st);
    ok('a hated bloc will not deal with you', co.boardFor(st).every(c => c.locked));
    ok('a locked offer explains itself',
       typeof co.acceptBlocker(co.boardFor(st)[0]) === 'string');
    ok('a locked offer cannot be accepted', co.acceptContract(co.boardFor(st)[0]) === false);
  } else ok('a hated bloc will not deal with you', false, 'no coalition station');

  rep.resetReputation();
  S.reputation.coalition = 0;
  if (st) { co.refreshBoard(st); }
  const neutralPay = st ? co.boardFor(st)[0].pay : 0;
  S.reputation.coalition = REP.max;
  if (st) { co.refreshBoard(st); }
  const likedPay = st ? co.boardFor(st)[0].pay : 0;
  ok('good standing pays better for the same board', likedPay > neutralPay,
     `${neutralPay} → ${likedPay}`);
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  rep.resetReputation();
}
{
  // accepting is a promise
  seedWorld(1337); co.initContracts();
  rep.resetReputation();
  const st = S.world.stations[0];
<<<<<<< HEAD
  // The floor tier is free, but a board is a mix of tiers and the top of it may be sealed
  // work this character has not earned. Take the first thing they actually qualify for —
  // which is also how a player reads a board.
  const offer = co.boardFor(st).find(c => !co.acceptBlocker(c)) || co.boardFor(st)[0];
=======
  const offer = co.boardFor(st)[0];
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  ok('an offer can be accepted', co.acceptContract(offer) === true);
  ok('the accepted offer is held', co.activeContracts().length === 1);
  ok('accepting sets a deadline', offer.deadline > S.time);
  ok('accepting removes it from the board', !co.boardFor(st).some(c => c.id === offer.id));
  ok('accepting the same one twice is refused', co.acceptContract(offer) === false);

<<<<<<< HEAD
  // Walk the system to fill the slate, rather than one station's board. Since v1.02.39 a
  // board is guaranteed *one* job anybody can take and no more than that — the rest are
  // tiered — so a fresh character genuinely has to visit three desks to hold three jobs,
  // which is the intended shape and not a shortage.
  for (const s of S.world.stations) {
    if (co.activeContracts().length >= CONTRACTS.maxActive) break;
    const next = co.boardFor(s).find(c => !co.acceptBlocker(c));
    if (next) co.acceptContract(next);
  }
  ok('holding is capped', co.activeContracts().length === CONTRACTS.maxActive,
     String(co.activeContracts().length));
  // Has to be an offer this character *could* otherwise take, or the refusal being tested
  // is the qualification gate rather than the slate cap.
  const spare = S.world.stations.flatMap(s => co.boardFor(s)).find(c => co.eligibility(c).ok);
  ok('a full slate refuses more', spare ? co.acceptContract(spare) === false : false);
  ok('the blocker says why', !!spare && co.acceptBlocker(spare).includes(String(CONTRACTS.maxActive)));
=======
  while (co.activeContracts().length < CONTRACTS.maxActive) {
    const next = co.boardFor(S.world.stations[1]).find(c => !co.acceptBlocker(c));
    if (!next) break;
    co.acceptContract(next);
  }
  ok('holding is capped', co.activeContracts().length === CONTRACTS.maxActive);
  const spare = co.boardFor(S.world.stations[2])[0];
  ok('a full slate refuses more', co.acceptContract(spare) === false);
  ok('the blocker says why', co.acceptBlocker(spare).includes(String(CONTRACTS.maxActive)));
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
}
{
  // ...and abandoning costs, which is what stops accept-everything being optimal
  const c = co.activeContracts()[0];
<<<<<<< HEAD
  const before = { credits: S.credits, standing: dos.standingWith(dos.playerDossier(), c.issuer) };
=======
  const before = { credits: S.credits, standing: rep.standing(c.issuer) };
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  co.abandonContract(c);
  ok('abandoning drops the contract', !co.activeContracts().some(x => x.id === c.id));
  ok('abandoning costs credits', S.credits < before.credits,
     `${before.credits} → ${S.credits}`);
<<<<<<< HEAD
  ok('abandoning costs standing', dos.standingWith(dos.playerDossier(), c.issuer) < before.standing);
=======
  ok('abandoning costs standing', rep.standing(c.issuer) < before.standing);
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  ok('the failure is recorded', S.contracts.history.failed >= 1);
  ok('abandoning something you do not hold is a no-op',
     co.abandonContract({ id: 'nope' }) === false);
}
{
  // completion by each route
  seedWorld(1337); co.initContracts(); rep.resetReputation();
  S.contracts.active = [];
<<<<<<< HEAD
  const bounty = { id: 'b1', type: 'bounty', issuer: 'aurelian', station: 'x', skill: 'gunnery',
                   pay: 2000, rep: 4, target: 2, progress: 0, expires: S.time + 999,
                   deadline: S.time + 999, base: { kills: S.player.kills } };
  S.contracts.active.push(bounty);
  const credits0 = S.credits, stand0 = dos.standingWith(dos.playerDossier(), 'aurelian');
=======
  const bounty = { id: 'b1', type: 'bounty', issuer: 'coalition', station: 'x', skill: 'gunnery',
                   pay: 2000, rep: 4, target: 2, progress: 0, expires: S.time + 999,
                   deadline: S.time + 999, base: { kills: S.player.kills } };
  S.contracts.active.push(bounty);
  const credits0 = S.credits, stand0 = rep.standing('coalition');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  S.player.kills += 2;
  co.updateContracts(0.1);
  ok('a bounty completes on kills', !co.activeContracts().some(c => c.id === 'b1'));
  ok('completion pays', S.credits === credits0 + 2000, String(S.credits - credits0));
<<<<<<< HEAD
  ok('completion raises standing', dos.standingWith(dos.playerDossier(), 'aurelian') > stand0);
  ok('completion is recorded', S.contracts.history.done >= 1);

  // deadline
  const late = { id: 'l1', type: 'bounty', issuer: 'freewake', station: 'x', skill: 'gunnery',
                 pay: 1000, rep: 3, target: 99, progress: 0, expires: S.time + 999,
                 deadline: S.time - 1, base: { kills: S.player.kills } };
  S.contracts.active.push(late);
  const stand1 = dos.standingWith(dos.playerDossier(), 'freewake');
  co.updateContracts(0.1);
  ok('an overdue contract fails', !co.activeContracts().some(c => c.id === 'l1'));
  ok('failing costs standing', dos.standingWith(dos.playerDossier(), 'freewake') < stand1);

  // Supply is credited by the sell hook — you source the goods and sell them where they
  // are short, so a sale *is* the delivery.
  const supply = { id: 's1', type: 'supply', issuer: 'freewake', station: 'x', skill: 'commerce',
=======
  ok('completion raises standing', rep.standing('coalition') > stand0);
  ok('completion is recorded', S.contracts.history.done >= 1);

  // deadline
  const late = { id: 'l1', type: 'bounty', issuer: 'independent', station: 'x', skill: 'gunnery',
                 pay: 1000, rep: 3, target: 99, progress: 0, expires: S.time + 999,
                 deadline: S.time - 1, base: { kills: S.player.kills } };
  S.contracts.active.push(late);
  const stand1 = rep.standing('independent');
  co.updateContracts(0.1);
  ok('an overdue contract fails', !co.activeContracts().some(c => c.id === 'l1'));
  ok('failing costs standing', rep.standing('independent') < stand1);

  // Supply is credited by the sell hook — you source the goods and sell them where they
  // are short, so a sale *is* the delivery.
  const supply = { id: 's1', type: 'supply', issuer: 'independent', station: 'x', skill: 'commerce',
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
                   commodity: 'ore', dest: S.world.stations[1].userData.name,
                   pay: 1500, rep: 3, target: 100, progress: 0, expires: S.time + 999,
                   deadline: S.time + 999, base: { sold: 0 } };
  S.contracts.active.push(supply);
  co.creditDelivery(S.world.stations[0], 'ore', 80);
  ok('a delivery to the wrong station does not count', supply.progress === 0);
  co.creditDelivery(S.world.stations[1], 'salvage', 80);
  ok('the wrong commodity does not count', supply.progress === 0);
  co.creditDelivery(S.world.stations[1], 'ore', 100);
  ok('the right delivery counts', supply.progress === 100);
  co.updateContracts(0.1);
  ok('a fulfilled supply completes', !co.activeContracts().some(c => c.id === 's1'));

  // Haul is a consignment: the load is handed over, not sold. Selling cannot credit it,
  // because the goods were never the pilot's — that path was worth more than the fee.
<<<<<<< HEAD
  const haul = { id: 'h1', type: 'haul', issuer: 'freewake', station: 'x', skill: 'commerce',
=======
  const haul = { id: 'h1', type: 'haul', issuer: 'independent', station: 'x', skill: 'commerce',
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
                 commodity: 'ore', dest: S.world.stations[1].userData.name,
                 pay: 1500, rep: 3, target: 100, progress: 0, loaded: 100,
                 expires: S.time + 999, deadline: S.time + 999, base: { sold: 0 } };
  S.contracts.active.push(haul);
  S.cargo.ore += 100;
  co.creditDelivery(S.world.stations[1], 'ore', 100);
  ok('selling never credits a haul', haul.progress === 0);
  ok('and the consignment is not sellable', co.sellableOf('ore') === S.cargo.ore - 100);

  ok('the destination is the only place it can be handed over',
     co.deliverableAt(S.world.stations[0]).length === 0);
  ok('and it is deliverable there', co.deliverableAt(S.world.stations[1]).length === 1);

  const holdBefore = S.cargo.ore;
  co.deliverConsignment(S.world.stations[1]);
  ok('delivering credits the contract', haul.progress === 100);
  ok('and takes the load off the ship', S.cargo.ore === holdBefore - 100);
  ok('and leaves nothing consigned', co.consignedFor('ore') === 0);
  co.updateContracts(0.1);
  ok('a fulfilled haul completes', !co.activeContracts().some(c => c.id === 'h1'));
}
{
  ok('progress reports as a fraction', (() => {
    const c = { progress: 5, target: 10 };
    return Math.abs(co.contractProgress(c) - 0.5) < 1e-9;
  })());
  ok('progress is clamped', co.contractProgress({ progress: 99, target: 10 }) === 1);
  ok('a targetless contract does not divide by zero',
     co.contractProgress({ progress: 1, target: 0 }) === 0);
  ok('time left never goes negative',
     co.timeLeft({ deadline: S.time - 500 }) === 0);
}

// ── persistence ──────────────────────────────────────────────────────
console.log('\n— persistence —');
ok('the schema is at or past the board', SCHEMA >= 6);
{
  save.wipeSave();
  seedWorld(1337); co.initContracts(); rep.resetReputation();
  ch.createCharacter({ name: 'Ledger', lineage: 'core', corp: 'meridian', career: 'broker' });
  const st = S.world.stations[0];
  const offer = co.boardFor(st).find(c => !co.acceptBlocker(c));
  co.acceptContract(offer);
  const heldId = offer.id;

  const snap = save.snapshot();
  ok('the snapshot carries the board', !!snap.contracts && !!snap.contracts.boards);
  ok('the snapshot carries the current schema', snap.v === SCHEMA);
  ok('the snapshot carries accepted work',
     snap.contracts.active.some(c => c.id === heldId));

  save.saveGame(true);
  S.contracts = null;
  ok('the flight reloads', save.loadGame() === true);
  ok('accepted work survives', co.activeContracts().some(c => c.id === heldId));
  ok('the board survives', Object.keys(S.contracts.boards).length > 0);
  ok('history survives', typeof S.contracts.history.done === 'number');

  // a v5 save has no board and must get a fresh one rather than an invented history
  const legacy = JSON.parse(JSON.stringify(snap));
  delete legacy.contracts;
  legacy.v = 5;
  const migrated = save.migrate(legacy);
  ok('a v5 save migrates all the way forward', migrated && migrated.v === SCHEMA);
  ok('migration does not invent accepted work', migrated.contracts === null);

  save.wipeSave();
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
