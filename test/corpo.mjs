// Extraction assignment, the pay cycle, the fleet alarm, and lock range.
//
// Everything here comes from one session's report, and the four items are more related
// than they look: each is a case of the game knowing something it never said out loud.
// The miner knew which rock it was cutting and the objective said `Target belt`. The hull
// knew it had 2,344 kg aboard and the roster showed structure and upkeep. A contracted
// ship knew it was being shot and the owner found out when the contract closed. And a
// raider seventeen megametres away knew it had a lock, which the pilot's alarm dutifully
// reported on a ship that could not have shot them.

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
const { createNpcs } = await imp('entities/npcs.js');
<<<<<<< HEAD
const { initMarket } = await imp('systems/trade/market.js');
const { LOCK, HOLD, DETECT } = await imp('core/config.js');
const { lockRange } = await imp('entities/npcs.js');
const { detectionRange } = await imp('systems/combat/detection.js');
const { holdCap, holdMass, loadHold } = await imp('systems/trade/holds.js');
const FL = await imp('systems/company/fleet.js');
// The entity factories are a boot step, not an import side effect — see core/spawn.js.
const { registerNpcFactories } = await imp('entities/npcs.js');
const { registerHullFactory } = await imp('entities/shipmesh.js');
registerNpcFactories(); registerHullFactory();
const FW = await imp('systems/company/fleet-work.js');
const CMD = await imp('systems/company/command.js');
const { fleetOrderReport, updateFleetOrders } = await imp('systems/company/orders.js');
const { createCharacter } = await imp('systems/crew/character.js');
const { channelLog } = await imp('systems/npc/comms.js').then(m => ({ channelLog: m.commsLog || m.channelLog || (() => []) }));
=======
const { initMarket } = await imp('systems/market.js');
const { LOCK, HOLD, DETECT } = await imp('core/config.js');
const { lockRange } = await imp('entities/npcs.js');
const { detectionRange } = await imp('systems/detection.js');
const { holdCap, holdMass, loadHold } = await imp('systems/holds.js');
const FL = await imp('systems/fleet.js');
const FW = await imp('systems/fleet-work.js');
const CMD = await imp('systems/command.js');
const { fleetOrderReport, updateFleetOrders } = await imp('systems/orders.js');
const { createCharacter } = await imp('systems/character.js');
const { channelLog } = await imp('systems/comms.js').then(m => ({ channelLog: m.commsLog || m.channelLog || (() => []) }));
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

initScene(); recalcStats(); seedWorld(21);
createSystem(); createAsteroids(); createNpcs(); initMarket();

function exec() {
  S.company = null; S.fleetOrders = [];
  createCharacter({ name: 'V', lineage: 'core', corp: 'meridian', career: 'executive' });
  S.company.treasury = 300000;
  S.docked = S.world.stations[0];
  S.time = 400;
}

// ── lock range ───────────────────────────────────────────────────────
console.log('\n— nothing locks on from across the system —');
{
  ok('there is a ceiling at all', LOCK.rangeCeiling > 0);
  ok('it is not further than anything can shoot', LOCK.rangeCeiling <= LOCK.hitCeiling);

  // The reported case: a big, loud signature against a heavy sensor.
  const command = { sensor: 3000, weaponClass: 'seeker' };
  const loudSig = 10;
  const raw = detectionRange(command.sensor, loudSig) * LOCK.lockFactor;
  ok('the unbounded arithmetic really would reach across the system', raw > 15000,
     String(Math.round(raw)));
  ok('but the capped range does not',
     lockRange(command, detectionRange(command.sensor, loudSig)) <= LOCK.rangeCeiling,
     String(Math.round(lockRange(command, detectionRange(command.sensor, loudSig)))));

  // The cap must not change ordinary engagements, only silly ones.
  const raider = { sensor: 1500, weaponClass: 'standard' };
  const quiet = detectionRange(raider.sensor, 1.0);
  ok('a normal contact is unaffected by the cap',
     Math.abs(lockRange(raider, quiet) - quiet * LOCK.lockFactor) < 1e-9);
  ok('a quiet hull is still harder to lock than a loud one',
     lockRange(raider, detectionRange(raider.sensor, DETECT.silentFloor)) <
     lockRange(raider, detectionRange(raider.sensor, 2)));
  ok('the cap holds for every sensor in the game',
     [900, 1500, 1900, 2600, 3000].every(sn =>
       lockRange({ sensor: sn }, detectionRange(sn, 12)) <= LOCK.rangeCeiling));
}

// ── belt assignment ──────────────────────────────────────────────────
console.log('\n— a mining objective picks a seam and says so —');
{
  exec();
  FL.commissionHull('mine');
  const c = S.company.fleet[0];
  const ship = FL.hullShip(c);
  ok('there is a hull to send', !!ship);

  const belt = FW.pickBelt(ship.position);
  ok('a belt can be chosen', !!belt);
  ok('it has a name rather than being the word "belt"',
     belt && belt.name && belt.name !== 'belt', belt && belt.name);

  const d = CMD.commandFromText('passive extract');
  ok('the objective dispatches', d.ok === true, d.text);
  let o = fleetOrderReport()[0];
  ok('it starts with the placeholder target from the menu leaf',
     o.target === 'belt' || !o.target, String(o.target));

  updateFleetOrders(0.25);
  o = fleetOrderReport()[0];
  ok('one tick assigns a real seam', o.target && o.target !== 'belt', String(o.target));
  ok('and the objective knows how far it is', typeof o.work === 'string' && o.work.length > 0);

  const raw = S.fleetOrders[0];
  ok('a waypoint was set', !!(raw.waypoint && Number.isFinite(raw.waypoint.x)));
  ok('the belt key was recorded', !!raw.beltKey);
  ok('the assignment does not thrash between seams', (() => {
    const first = raw.target;
    for (let i = 0; i < 40; i++) updateFleetOrders(0.25);
    return S.fleetOrders[0] && S.fleetOrders[0].target === first;
  })());
}

// ── transit ──────────────────────────────────────────────────────────
console.log('\n— the hull actually goes there —');
{
  exec();
  FL.commissionHull('mine');
  const ship = FL.hullShip(S.company.fleet[0]);
  CMD.commandFromText('passive extract');
  updateFleetOrders(0.25);

  const wp = S.fleetOrders[0].waypoint;
  // Commissioned hulls start on a pad now, so the first thing the cycle does is undock.
  for (let i = 0; i < 200; i++) { S.time += 0.25; updateFleetOrders(0.25); }
  const before = Math.hypot(ship.position.x - wp.x, ship.position.y - wp.y, ship.position.z - wp.z);
  ok('it starts away from the seam', before > FW.WORK.beltArrive, String(Math.round(before)));

  for (let i = 0; i < 800; i++) { S.time += 0.25; updateFleetOrders(0.25); }
  const after = Math.hypot(ship.position.x - wp.x, ship.position.y - wp.y, ship.position.z - wp.z);
  ok('and closes on it', after < before, `${Math.round(before)} → ${Math.round(after)}`);
  // The leg is a sentence now, not a keyword — it names the phase and the distance, which
  // is the whole point of the v1.01.93 state machine.
  ok('the leg is reported', typeof S.fleetOrders[0].leg === 'string' && S.fleetOrders[0].leg.length > 0,
     String(S.fleetOrders[0].leg));
  ok('and names a phase the machine knows',
     ['docked', 'undock', 'outbound', 'approach-rock', 'mining', 'homebound', 'match', 'docking', 'transfer']
       .includes(S.fleetOrders[0].phase), String(S.fleetOrders[0].phase));
}

// ── the return rule ──────────────────────────────────────────────────
console.log('\n— full hold beats the clock —');
{
  exec();
  FL.commissionHull('mine');
  const c = S.company.fleet[0];
  const u = FL.hullShip(c).userData;
  const order = { payT: FW.WORK.payCycle, assetName: c.name };

  ok('an empty hold with time left is not due', FW.extractionDue(order, u) === null);

  loadHold(u, 'ore', holdCap(u) * (HOLD.minerRunAt * 0.5));
  ok('a half hold with time left keeps cutting', FW.extractionDue(order, u) === null,
     `${Math.round(holdMass(u))} of ${holdCap(u)}`);

  loadHold(u, 'ore', holdCap(u));
  ok('a full hold comes home even with time left', FW.extractionDue(order, u) === 'full');

  // And the other trigger: time up, part-loaded.
  const u2 = FL.hullShip(c).userData;
  u2.hold = {};
  loadHold(u2, 'ore', 200);
  ok('a part load with time left keeps cutting',
     FW.extractionDue({ payT: 50 }, u2) === null);
  ok('a part load out of time comes home',
     FW.extractionDue({ payT: 0 }, u2) === 'payday');
  ok('an empty hold out of time does not bother',
     (u2.hold = {}, FW.extractionDue({ payT: 0 }, u2) === null));
}

// ── the roster tells you what is aboard ──────────────────────────────
console.log('\n— the Executive screen shows the cargo —');
{
  exec();
  FL.commissionHull('mine');
  const c = S.company.fleet[0];
  const u = FL.hullShip(c).userData;

  let row = FL.fleetRoster()[0];
  ok('the roster reports a hold capacity', row.holdCap > 0, String(row.holdCap));
  ok('an empty hull reports an empty hold', Math.round(row.hold) === 0);

  loadHold(u, 'ore', 2344);
  row = FL.fleetRoster()[0];
  ok('cargo aboard is reported', Math.round(row.hold) === 2344, String(Math.round(row.hold)));
  ok('as a fraction too', row.holdPct > 0 && row.holdPct <= 1);
  ok('and the manifest names the commodity', Math.round(row.manifest.ore || 0) === 2344);
  ok('the roster says whether it is running in', row.runningIn === false);
}

// ── the alarm ────────────────────────────────────────────────────────
console.log('\n— being shot at is reported to the owner —');
{
  exec();
  FL.commissionHull('combat');
  const c = S.company.fleet[0];
  const ship = FL.hullShip(c);

  FL.updateFleet(0.25);
  ok('an untouched hull raises nothing', FL.fleetUnderFire() === null);

  ship.userData.hp -= 20;
  FL.updateFleet(0.25);
  const hit = FL.fleetUnderFire();
  ok('losing structure raises the alarm', !!hit);
  ok('and it names the hull', hit && hit.name === c.name);
  ok('and carries how bad it is', hit && hit.hullFrac > 0 && hit.hullFrac < 1);
  ok('the roster flags it too', FL.fleetRoster()[0].underFire === true);

  // It clears on its own once the shooting stops.
  for (let i = 0; i < 40; i++) FL.updateFleet(0.25);
  ok('the alarm clears when the damage stops', FL.fleetUnderFire() === null);
  ok('and the roster flag clears with it', FL.fleetRoster()[0].underFire === false);

  // Escalation: nearly dead reads differently from scratched.
  ship.userData.hp = ship.userData.maxHp * 0.2;
  FL.updateFleet(0.25);
  const bad = FL.fleetUnderFire();
  ok('a nearly-lost hull reports critically', bad && bad.hullFrac < 0.35);

  // Repair is not an attack.
  for (let i = 0; i < 40; i++) FL.updateFleet(0.25);
  ship.userData.hp = ship.userData.maxHp;
  FL.updateFleet(0.25);
  ok('healing does not raise the alarm', FL.fleetUnderFire() === null);
}

// ── nothing regressed ────────────────────────────────────────────────
console.log('\n— the commands still dispatch —');
{
  exec();
<<<<<<< HEAD
  const { FLEET_ORDER_TYPES } = await imp('systems/company/orders.js');
=======
  const { FLEET_ORDER_TYPES } = await imp('systems/orders.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  const need = new Set();
  for (const k of Object.keys(FLEET_ORDER_TYPES)) {
    for (const r of FLEET_ORDER_TYPES[k].requires || []) need.add(r);
  }
  for (const r of need) if (FL.fleetRoster().length < 6) FL.commissionHull(r);

  const broken = [];
  for (const leaf of CMD.allLeaves()) {
    S.fleetOrders = [];
    for (const con of S.company.fleet) con.orderId = null;
    const r = CMD.commandById(leaf.id);
    if (!r.ok) broken.push(`${leaf.id}: ${r.text}`);
  }
  ok('every menu leaf still dispatches', broken.length === 0, broken.join(' | '));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
