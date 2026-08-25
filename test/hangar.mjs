// The extraction flight cycle, the hangar, and who owns a ship.
//
// The report behind this suite, in the reporter's words: *"it seems like it auto appears at
// the belt"*, and *"right now without a target, its ore hold is filling up"*. Both were
// true, and both came from the same place — v1.01.92's `extractStep` flew the hull to the
// seam and then handed the rest of the job to `minerStep()` in entities/npcs.js by setting
// a flag and a berth.
//
// That handoff only works while the world is stepping the NPC, which it does near the
// player. A company miner 11 Mm from its owner stopped being stepped the moment the owner
// left, which is the screenshot exactly: hold 2,344 / 2,600 kg, **full**, "running in to
// Trade Platform", and 0 runs, 0 kg, 0 cr — permanently, because nothing was moving it.
//
// A ship the company pays upkeep on has to work whether or not anyone is watching. So the
// whole cycle lives in fleet-work.js now, owns its own movement, and this suite walks it.

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
const { SHIP_PRICE } = await imp('core/config.js');
const { seedWorld } = await imp('core/rng.js');
const { initScene } = await imp('world/scene.js');
const { createSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { createNpcs, updateNpcs } = await imp('entities/npcs.js');
const { initMarket } = await imp('systems/trade/market.js');
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

initScene(); recalcStats(); seedWorld(21);
createSystem(); createAsteroids(); createNpcs(); initMarket();

function exec() {
  S.company = null; S.fleetOrders = [];
  createCharacter({ name: 'V', lineage: 'core', corp: 'meridian', career: 'executive' });
  S.company.treasury = 400000;
  S.docked = S.world.stations[0];
  S.time = 400;
}

/** Run the cycle, collecting every phase it passes through. */
function fly(ticks = 40000) {
  const phases = new Set();
  const legs = new Set();
  for (let i = 0; i < ticks; i++) {
    S.time += 0.25;
    updateFleetOrders(0.25);
    FL.updateFleet(0.25);
    const o = S.fleetOrders[0];
    if (o) { if (o.phase) phases.add(o.phase); if (o.leg) legs.add(o.leg.split(' ·')[0]); }
  }
  return { phases, legs };
}

// ── the hangar ───────────────────────────────────────────────────────
console.log('\n— a ship you just bought is on a pad —');
{
  exec();
  const r = FL.commissionHull('mine');
  ok('the order goes through', r.ok === true, r.reason);

  const row = FL.fleetRoster()[0];
  ok('it is docked, not floating alongside', row.docked === true);
  ok('and the roster says where', !!row.dockedAt, String(row.dockedAt));
  ok('it is parked at the station it was ordered from',
     row.dockedAt === S.docked.userData.name, `${row.dockedAt} vs ${S.docked.userData.name}`);

  const ship = FL.hullShip(S.company.fleet[0]);
  ok('the hull sits at the station', ship.position.distanceTo(S.docked.position) < 1);

  // spawnNpc() already adds to the scene, tracks interpolation and pushes to S.world.npcs.
  // Pushing again put the same object in the array twice — it drew once and mapped once,
  // because both draw the one object, but every list that walked the array showed it twice,
  // and the world stepped it twice per frame.
  const entries = S.world.npcs.filter(n => n === ship).length;
  ok('a commissioned hull is registered exactly once', entries === 1, String(entries));
  ok('and appears once by name',
     S.world.npcs.filter(n => n.userData && n.userData.name === ship.userData.name).length === 1);
  ok('and is not drawn in open space', ship.visible === false);
  ok('a docked hull holds no target', !ship.userData.target && !ship.userData.rock);

  // A hull on a pad is inside a station: it must not manoeuvre or be acquired.
  const before = { x: ship.position.x, y: ship.position.y, z: ship.position.z };
  S.player.position.copy(ship.position);
  for (let i = 0; i < 200; i++) updateNpcs(0.25);
  ok('the world does not fly a docked hull around',
     ship.position.x === before.x && ship.position.z === before.z);
}

// ── the cycle ────────────────────────────────────────────────────────
console.log('\n— it leaves the pad and flies the whole run —');
{
  exec();
  FL.commissionHull('mine');
  const c = S.company.fleet[0];
  const ship = FL.hullShip(c);

  const d = CMD.commandFromText('passive extract');
  ok('the objective dispatches', d.ok === true, d.text);

  const treasury = S.company.treasury;
  const { phases } = fly();

  // The sequence as specified in the report, with nothing skipped.
  const wanted = ['undock', 'outbound', 'approach-rock', 'mining',
                  'homebound', 'match', 'docking', 'transfer'];
  for (const p of wanted) {
    ok(`the cycle passes through ${p}`, phases.has(p), [...phases].join(','));
  }
  ok('and it ends up back on a pad', phases.has('docked'));

  const o = fleetOrderReport()[0];
  ok('the objective is still running — passive repeats', !!o);
  ok('it completed more than one round trip', o && o.returns >= 2, o ? String(o.returns) : '—');
  ok('ore was actually delivered', o && o.delivered > 0, o ? `${o.delivered} kg` : '—');

  // The bug this whole patch exists for: it used to run seven complete trips and deliver
  // sixty kilograms between them, because the pay cycle was spent in transit.
  ok('a round trip carries a real load', o && o.delivered / Math.max(1, o.returns) > 500,
     o ? `${Math.round(o.delivered / Math.max(1, o.returns))} kg per run` : '—');
  ok('and the company is better off for it', S.company.treasury > treasury,
     `${Math.round(S.company.treasury - treasury)}`);
  ok('upkeep did not outrun the cargo', S.company.treasury - treasury > 0);

  ok('the hold does not sit full and idle', holdMass(ship.userData) < holdCap(ship.userData));
}

// ── the pay cycle is time at the face ────────────────────────────────
console.log('\n— the clock only runs while cutting —');
{
  exec();
  FL.commissionHull('mine');
  CMD.commandFromText('passive extract');

  // Undock and transit alone must not spend the cycle. If they do, the hull arrives with an
  // expired clock, cuts for one frame and turns straight round — which is exactly what it
  // did, seven times, for sixty kilograms.
  for (let i = 0; i < 60; i++) { S.time += 0.25; updateFleetOrders(0.25); }
  const o = S.fleetOrders[0];
  ok('the hull is still on its way out',
     ['undock', 'outbound', 'approach-rock'].includes(o.phase), String(o.phase));
  ok('and the pay cycle is untouched', Math.abs(o.payT - FW.WORK.payCycle) < 0.01,
     `${o.payT} of ${FW.WORK.payCycle}`);
}

// ── stopping ─────────────────────────────────────────────────────────
console.log('\n— an active objective stands down, a passive one turns around —');
{
  exec();
  const made = FL.commissionHull('mine');
  const before = FL.fleetRoster()[0];
  ok('it starts docked', !!(made.ok && before && before.docked === true),
     made.ok ? JSON.stringify({ docked: before && before.docked }) : made.reason);

  CMD.commandById('ind-extract-single');
  const { phases } = fly(40000);
  ok('a single-load run does the trip', phases.has('transfer'));
  const still = fleetOrderReport()[0];
  ok('and then leaves the board or parks', !still || still.phase === 'docked',
     still ? still.phase : 'gone');
  ok('the hull is free again', FL.fleetRoster()[0].busy === false || !still);
}

// ── ownership ────────────────────────────────────────────────────────
console.log('\n— who owns the ship —');
{
  exec();
  FL.commissionHull('mine');
  const h = FL.fleetRoster()[0];

  ok('a hull bought through Ops belongs to the company', h.owner === 'company');
  ok('and the roster says so', FL.ownerOf(S.company.fleet[0]) === FL.OWNER.COMPANY);

  // v1.02.00: the pilot cannot take a company hull. It used to be a two-way transfer, which
  // made the treasury a personal wallet with an extra step — commission a ship on company
  // money, move it across, and the board has funded a private fleet it cannot recall. A
  // founder who wants a ship of their own buys it at a yard with their own credits.
  const t = CMD.commandTransfer(h.id, 'player');
  ok('the pilot cannot take a company hull', t.ok === false, t.text);
  ok('the reason says where to get one instead', /yard/i.test(t.text || ''), t.text);
  ok('the roster is unchanged', FL.fleetRoster()[0].owner === 'company');
  ok('the ship in the world agrees', FL.hullShip(S.company.fleet[0]).userData.owner === 'company');
  ok('and it is still dispatchable', FL.freeHulls().length === 1);

  ok('transferring to where it already is is refused',
     CMD.commandTransfer(h.id, 'company').ok === false);
  ok('an unknown hull is refused', CMD.commandTransfer('hull-nope', 'player').ok === false);

  // The other direction is still needed and still works: a pilot may sign their own ship
  // over to the company. Set up by hand, because nothing hands a hull to the pilot now.
  // `fleetRoster()` returns summaries, not the contracts — writing to one changes nothing,
  // which is worth knowing before the next test reaches for it.
  S.company.fleet[0].owner = FL.OWNER.PLAYER;
  const world = FL.hullShip(S.company.fleet[0]);
  if (world && world.userData) world.userData.owner = FL.OWNER.PLAYER;
  ok('the company cannot dispatch a ship it does not own', FL.freeHulls().length === 0);
  const back = CMD.commandTransfer(h.id, 'company');
  ok('a pilot can sign their ship over to the company', back.ok === true, back.text);
  ok('and it becomes dispatchable', FL.freeHulls().length === 1);
}

// ── the founder starts with nothing to fly ───────────────────────────
console.log('\n— a founder owns no hull —');
{
  exec();
  ok('the executive start grants no hull', Object.keys(S.ownedHulls || {}).length === 0,
     Object.keys(S.ownedHulls || {}).join(','));
  ok('but the licence is still theirs', !!(S.licences && S.licences.economic));

  // The path a founder actually has to walk, end to end. Asserted because reasoning about
  // it got it wrong: the first version of this change left them certified for a freighter
  // they could not afford, holding no hull, unable to undock, with no legal way out.
  const EC = await imp('systems/trade/economy.js');
  ok('a founder cannot undock with no hull of their own', !EC.ownsCurrentHull());
  ok('the shuttle is free', (SHIP_PRICE.civilian || 0) === 0);
  ok('and they are licensed for it', !!(S.licences && S.licences.civilian));
  ok('claiming it works', EC.buyHull('civilian') === true);
  ok('they now own a hull', EC.ownsCurrentHull(), S.player.classKey);
  ok('and it is the one they are flying', S.player.classKey === 'civilian');
}

// ── nothing regressed ────────────────────────────────────────────────
console.log('\n— the commands still dispatch —');
{
  exec();
  const { FLEET_ORDER_TYPES } = await imp('systems/company/orders.js');
  const need = new Set();
  for (const k of Object.keys(FLEET_ORDER_TYPES)) {
    for (const r of FLEET_ORDER_TYPES[k].requires || []) need.add(r);
  }
  for (const r of need) if (FL.fleetRoster().length < 6) FL.commissionHull(r);

  // Whatever else changes, a fleet of six must be six entries in the world, not twelve.
  const ids = new Set();
  let dupes = 0;
  for (const n of S.world.npcs) { if (ids.has(n)) dupes++; ids.add(n); }
  ok('no ship is registered in the world twice', dupes === 0, String(dupes));

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
