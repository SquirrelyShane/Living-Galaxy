// Cargo that is actually aboard something.
//
// v1.01.00 shipped the ledger and named this hole in its own patch note: a hauler's cargo was
// notional, so a laden ship and an empty one were the same target. This suite is mostly about
// the consequences of that no longer being true — what a wreck gives up, what a raided hauler
// delivers, and where a miner's ore ends up — rather than about the bookkeeping, which is the
// easy half.
//
// The property worth stating up front, because two checks below exist only to hold it: **a
// spill is never the whole hold.** If interception recovered everything, hauling would be
// strictly worse than raiding and the trade layer would collapse into a shooting gallery.

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
const { createSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { spawnNpc } = await imp('entities/npcs.js');
const { initCombat, damageNpc } = await imp('systems/combat.js');
const { initProjectiles } = await imp('systems/projectiles.js');
const H = await imp('systems/holds.js');
const D = await imp('systems/deals.js');
const { initMarket, bookFor } = await imp('systems/market.js');
const { scanReport } = await imp('systems/scanner.js');
const { HOLD, COMMODITIES } = await imp('core/config.js');
const { SCHEMA } = await imp('core/version.js');

initScene();
recalcStats();
seedWorld(20260809);
createSystem();
createAsteroids();
initProjectiles();
initCombat();
initMarket();

let uid = 400;
const ship = (kind, x = 300000) => {
  const n = spawnNpc(kind, ++uid);
  n.position.set(x, 0, 0);
  n.userData.hold = null;
  return n;
};
const reset = () => {
  for (const n of S.world.npcs) n.userData.hp = 0;
  S.world.npcs.length = 0;
  for (const l of S.world.loot) if (l.mesh) l.mesh.parent && l.mesh.parent.remove(l.mesh);
  S.world.loot.length = 0;
  S.deals = { open: [], done: 0, failed: 0 };
  S.brains = { personas: {} };
  S.time = 2000;
};

console.log('\n— a hold is a property of the ship, not of the paperwork —');
{
  reset();
  const hauler = ship('hauler').userData;
  const drone = ship('drone').userData;

  ok('a hauler has capacity', H.holdCap(hauler) > 0);
  // A drone with no declared capacity cannot be laden at all. That is the honest answer for
  // a machine with no hold, and it is what stops the spill path inventing cargo on ships
  // that were never carrying any.
  ok('a drone has none', H.holdCap(drone) === 0);
  ok('and cannot be loaded', H.loadHold(drone, 'ore', 500) === 0 && H.holdMass(drone) === 0);

  ok('loading returns what fitted', H.loadHold(hauler, 'ore', 1200) === 1200);
  ok('mass reads back', H.holdMass(hauler) === 1200);
  ok('free space fell', H.holdFree(hauler) === H.holdCap(hauler) - 1200);

  // Overfilling is capped rather than refused — the caller has to cope with a partial load,
  // which is the same contract the player's own hold has had since the 0.1 line.
  const over = H.loadHold(hauler, 'salvage', H.holdCap(hauler) * 2);
  ok('an overweight load is trimmed, not rejected', over > 0 && H.holdMass(hauler) <= H.holdCap(hauler) + 0.001,
     `${H.holdMass(hauler)} of ${H.holdCap(hauler)}`);

  ok('unloading returns what was there', H.unloadHold(hauler, 'ore', 5000) === 1200);
  ok('and the key goes away when empty', !((hauler.hold || {}).ore));
  ok('an unknown commodity does not load', H.loadHold(hauler, 'antimatter', 100) === 0);
}

console.log('\n— what a wreck gives up —');
{
  reset();
  const u = ship('hauler').userData;
  H.loadHold(u, 'ore', 4000);
  const lots = H.spillOf(u);
  const spilled = lots.reduce((t, l) => t + l.kg, 0);

  ok('a laden wreck spills something', spilled > 0);
  // The design decision in the whole slice. Recovering everything would make interception
  // strictly better than trading.
  ok('but never all of it', spilled < 4000, `${Math.round(spilled)} of 4000 kg`);
  ok('and the fraction is the configured one',
     Math.abs(spilled - 4000 * HOLD.spillFraction) < 1);
  ok('the lot carries its commodity', lots[0] && lots[0].commodity === 'ore');

  // A wreck cannot flood the bounded loot list on its own.
  const fat = ship('hauler').userData;
  for (const k of Object.keys(COMMODITIES)) H.loadHold(fat, k, 1500);
  ok('a spill is capped at HOLD.spillMax lots', H.spillOf(fat).length <= HOLD.spillMax);
  ok('and the biggest lots are the ones kept',
     H.spillOf(fat).every((l, i, a) => i === 0 || a[i - 1].kg >= l.kg));

  // Below the floor is nothing rather than litter.
  const trace = ship('hauler').userData;
  H.loadHold(trace, 'ore', HOLD.spillFloor * 0.5);
  ok('a trace load is not worth a container', H.spillOf(trace).length === 0);
  ok('and laden() agrees with it', !H.laden(trace));
}

console.log('\n— the loot a kill actually drops —');
{
  reset();
  const victim = ship('hauler', 200000);
  H.loadHold(victim.userData, 'ore', 4000);
  S.player.position.set(500000, 0, 0);      // far enough not to scoop it ourselves

  damageNpc(victim, 99999, true, 'kinetic');
  const kinds = S.world.loot.map(l => l.commodity);
  ok('the wreck dropped containers', S.world.loot.length > 0);
  ok('one of them is the cargo it was carrying', kinds.includes('ore'));
  ok('and one is the usual salvage', kinds.includes('salvage'));
  // The hold is emptied on death, so a despawned ship cannot be spilled twice by anything
  // that happens to hold a reference to it.
  ok('the hold does not survive the ship', !victim.userData.hold);
}

console.log('\n— somebody standing over the wreck helps themselves —');
{
  reset();
  const victim = ship('hauler', 100000);
  const raider = ship('pirate', 100000 + 200);
  H.loadHold(victim.userData, 'ore', 4000);
  S.player.position.set(900000, 0, 0);

  damageNpc(victim, 99999, false, 'kinetic');   // not the player's kill
  ok('the raider took a share', H.holdMass(raider.userData) > 0,
     `${Math.round(H.holdMass(raider.userData))} kg`);
  ok('but only a share', H.holdMass(raider.userData) < 4000);
  // This is the point of the mechanic: a pirate who has been working the lane is a richer
  // kill than one that just spawned, so the loot on a hostile is no longer a fixed number.
  ok('which makes the raider itself worth taking', H.laden(raider.userData));
}

console.log('\n— a raided hauler delivers what it has left —');
{
  reset();
  const client = ship('patrol').userData;
  const hauler = ship('hauler').userData;
  const dest = S.world.stations[0].userData.name;
  const deal = D.propose(client, hauler, { commodity: 'ore', kg: 2000, pay: 9000, dest })
            || D.propose(client, hauler, { commodity: 'ore', kg: 2000, pay: 90000, dest });
  ok('a deal was struck', !!deal);

  if (deal) {
    H.loadHold(hauler, 'ore', 2000);
    H.unloadHold(hauler, 'ore', 1400);        // somebody took most of it off them
    const before = (bookFor(S.world.stations[0]).stock.ore || 0);
    D.settle(deal);
    const after = (bookFor(S.world.stations[0]).stock.ore || 0);

    // The deal still discharges. They flew the run; what is missing is the cargo, which is
    // exactly the thing the raider has.
    ok('the deal still settles', deal.state === 'done');
    ok('and records what actually landed', Math.abs(deal.landed - 600) < 1, String(deal.landed));
    ok('the station received the short load, not the paper one',
       Math.abs((after - before) - 600) < 1, `${Math.round(after - before)} kg`);
    ok('and the hauler is empty afterwards', H.holdMass(hauler) < 1);
  }
}

console.log('\n— what a scan can see —');
{
  reset();
  const u = ship('hauler', S.player.position.x + 120).userData;
  H.loadHold(u, 'ore', 3000);
  ok('a manifest reads back', /ore|Raw ore/i.test(H.manifestOf(u) || ''));
  ok('an empty hold has no manifest', H.manifestOf({ type: 'hauler', hold: {} }) === null);

  // Mass resolves a deck earlier than the manifest does, and the split is the decision a
  // raider actually makes at range: is that one worth closing on at all. So the check is
  // that a load shows up at a lower tier than a manifest, not merely that both exist.
  const obj = { userData: u, position: S.player.position.clone() };
  const rowsAt = n => {
    obj.position.copy(S.player.position);
    obj.position.x += n;
    return scanReport(obj, 'ship', 'X').rows.map(r => r[0]);
  };
  const near = rowsAt(40);
  ok('a close scan reports the manifest', near.includes('Manifest'));
  ok('and the load beside it', near.includes('Load'));

  const empty = { type: 'hauler', hold: {} };
  const emptyRows = scanReport({ userData: empty, position: obj.position }, 'ship', 'Y').rows;
  ok('an empty hauler reads as running empty',
     emptyRows.some(r => r[0] === 'Load' && /empty/.test(String(r[1]))));
  // A ship with no hold at all says nothing about cargo rather than saying "0 kg", which
  // would imply a hold it does not have.
  const dr = scanReport({ userData: { type: 'drone' }, position: obj.position }, 'ship', 'Z').rows;
  ok('a ship with no hold reports no load', !dr.some(r => r[0] === 'Load'));
}

console.log('\n— holds are deliberately not persisted —');
{
  // NPCs are not saved: serializeSim() persists *places* and respawns ships around them.
  // A hold rides on a ship, so it lives and dies with one. What survives a reload is what
  // the cargo did — the station stock a miner sold into, and the ledger record.
  const snap = JSON.stringify(await imp('systems/save.js').then(m => m.snapshot()));
  ok('the save carries no NPC holds', !/"hold"/.test(snap));
  ok('the schema moved for the slice', SCHEMA === 16);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
