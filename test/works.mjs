// Refit, commissioning, and extraction that actually extracts.
//
// The reports behind this slice: a conscripted patrol ship could never be told to mine, and
// an extraction objective was a countdown with nothing behind it. Both were true, and the
// second was the deeper one — `minerStep()` in entities/npcs.js had run the whole loop
// since long before the fleet layer existed (cut a rock, fill, run it in to a berth, sell,
// go again) and nothing connected it to an objective or paid the company a credit for it.
//
// What this suite pins is the join: a role can be changed, a hull can be bought rather than
// found, and ore that a company hull cuts turns into money in the company's treasury and
// progress on the objective that sent it out.

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
const { createNpcs, updateNpcs } = await imp('entities/npcs.js');
<<<<<<< HEAD
const { initMarket } = await imp('systems/trade/market.js');
const { COMPANY, FLEET_ROLES } = await imp('core/config.js');
const FL = await imp('systems/company/fleet.js');
// The entity factories are a boot step, not an import side effect — see core/spawn.js.
const { registerNpcFactories } = await imp('entities/npcs.js');
const { registerHullFactory } = await imp('entities/shipmesh.js');
registerNpcFactories(); registerHullFactory();
const CMD = await imp('systems/company/command.js');
const { fleetOrderReport, updateFleetOrders, FLEET_ORDER_TYPES } = await imp('systems/company/orders.js');
const { createCharacter } = await imp('systems/crew/character.js');
=======
const { initMarket } = await imp('systems/market.js');
const { COMPANY, FLEET_ROLES } = await imp('core/config.js');
const FL = await imp('systems/fleet.js');
const CMD = await imp('systems/command.js');
const { fleetOrderReport, updateFleetOrders, FLEET_ORDER_TYPES } = await imp('systems/orders.js');
const { createCharacter } = await imp('systems/character.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

initScene(); recalcStats(); seedWorld(9);
createSystem(); createAsteroids(); createNpcs(); initMarket();

function freshExec() {
  S.company = null;
  S.fleetOrders = [];
  createCharacter({ name: 'V', lineage: 'core', corp: 'meridian', career: 'executive' });
  S.company.treasury = 200000;
  S.time = 100;
}

// ── the role table ───────────────────────────────────────────────────
console.log('\n— the roles a yard can fit —');
{
  const roles = Object.keys(FLEET_ROLES);
  ok('there are roles to convert between', roles.length > 1);
  ok('every role names a hull type', roles.every(r => !!FLEET_ROLES[r].hull));
  ok('every role names a branch', roles.every(r => !!FLEET_ROLES[r].branch));

  // The point of the table: every role a fleet order can ask for must be one a yard can
  // actually fit, or that order is undispatchable no matter what the treasury holds.
  const required = new Set();
  for (const k of Object.keys(FLEET_ORDER_TYPES)) {
    for (const r of FLEET_ORDER_TYPES[k].requires || []) required.add(r);
  }
  const unbuildable = [...required].filter(r => !FLEET_ROLES[r]);
  ok('every role an order requires can be fitted', unbuildable.length === 0,
     unbuildable.join(', '));
}

// ── refit ────────────────────────────────────────────────────────────
console.log('\n— converting a hull —');
{
  freshExec();
  const combat = FL.hullsAvailable(80).find(h => h.role === 'combat');
  ok('a combat hull is available to conscript', !!combat);
  FL.hireHull(combat.npcName);
  const h = FL.fleetRoster()[0];

  // The reported bug, stated as a test.
  const before = CMD.commandFromText('send a cutter to extract ore');
  ok('a patrol hull cannot be told to mine', before.ok === false);
  ok('and the refusal says why', /hull|class/i.test(before.text), before.text);

  const opts = FL.refitOptions(h.id);
  ok('the yard offers conversions', opts.length > 0);
  ok('it does not offer the role it already has', !opts.some(o => o.role === h.role));
  ok('every option is priced', opts.every(o => o.fee > 0));
  ok('in-charter conversion is cheaper than cross-charter', (() => {
    const inC = opts.find(o => o.branch === S.company.charter);
    const outC = opts.find(o => o.branch !== S.company.charter);
    return !inC || !outC || inC.fee < outC.fee;
  })());

  const treasury = S.company.treasury;
  const r = FL.refitHull(h.id, 'mine');
  ok('the refit is ordered', r.ok === true, r.reason);
  ok('the treasury paid for it', S.company.treasury < treasury);
  ok('the hull is in the yard', FL.fleetRoster()[0].refitting > 0);
  ok('and is not dispatchable while it is', FL.freeHulls().length === 0);
  ok('a second refit is refused', FL.refitHull(h.id, 'haul').ok === false);

  FL.updateFleet(COMPANY.refitSeconds + 1);
  ok('the yard finishes', FL.fleetRoster()[0].refitting === 0);
  ok('the contract has the new role', FL.fleetRoster()[0].role === 'mine');
  ok('the ship in the world agrees', FL.hullShip(S.company.fleet[0]).userData.role === 'mine');
  ok('and its hull type changed with it',
     FL.hullShip(S.company.fleet[0]).userData.type === FLEET_ROLES.mine.hull);

  const after = CMD.commandFromText('send a cutter to extract ore');
  ok('and now it can be told to mine', after.ok === true, after.text);

  // A hull on an objective must be recalled before it can be converted.
  ok('a busy hull cannot be refitted', FL.refitHull(FL.fleetRoster()[0].id, 'haul').ok === false);
}

// ── commissioning ────────────────────────────────────────────────────
console.log('\n— buying a hull instead of finding one —');
{
  freshExec();
  ok('the fleet starts empty', FL.fleetRoster().length === 0);
  ok('ordering undocked is refused', CO_undocked());
  function CO_undocked() { S.docked = null; return FL.canCommission('mine').ok === false; }

  S.docked = S.world.stations[0];
  const opts = FL.commissionOptions();
  ok('the yard lists what it builds', opts.length > 0);
  ok('a mining hull is on the list', opts.some(o => o.role === 'mine'));
  ok('every hull is priced', opts.every(o => o.fee > 0));

  const treasury = S.company.treasury;
  const r = FL.commissionHull('mine');
  ok('the order goes through', r.ok === true, r.reason);
  ok('the treasury paid', S.company.treasury < treasury);
  ok('the hull is on the roster', FL.fleetRoster().length === 1);
  ok('fitted for the trade it was ordered as', FL.fleetRoster()[0].role === 'mine');
  ok('it is marked as bought rather than conscripted', FL.fleetRoster()[0].commissioned === true);

  const ship = FL.hullShip(S.company.fleet[0]);
  ok('the ship exists in the world', !!ship);
  ok('and is delivered alongside the station',
     ship.position.distanceTo(S.docked.position) < 1000);
  ok('it knows who it belongs to', ship.userData.contracted === FL.fleetRoster()[0].id);

  // This is the whole point: it can be given the objective straight away.
  const d = CMD.commandFromText('send a cutter to extract ore');
  ok('a commissioned miner takes a mining order immediately', d.ok === true, d.text);

  S.company.treasury = 10;
  ok('an order beyond the treasury is refused', FL.canCommission('mine').ok === false);
}

// ── extraction that extracts ─────────────────────────────────────────
console.log('\n— the ore actually arrives —');
{
  freshExec();
  S.docked = S.world.stations[0];
  FL.commissionHull('mine');
  const c = S.company.fleet[0];

  // v1.01.93: a commissioned hull is parked on a pad and the objective flies the whole
  // cycle itself. Nothing here primes a hold or places a ship on a rock any more — that
  // was propping up the old handoff to minerStep(), which only ran near the player and is
  // exactly why a hull could sit full and idle 11 Mm away forever.
  ok('a newly commissioned hull is on a pad', FL.fleetRoster()[0].docked === true);

  const d = CMD.commandFromText('passive extract');
  ok('the passive objective dispatches', d.ok === true, d.text);
  const o0 = fleetOrderReport()[0];
  ok('passive sets no quota', o0.quotaKg === 0);
  ok('and no countdown', o0.remaining === 0);

  const treasury = S.company.treasury;
  const phases = new Set();
  for (let i = 0; i < 40000; i++) {
    S.time += 0.25;
    updateFleetOrders(0.25);
    FL.updateFleet(0.25);
    const raw = S.fleetOrders[0];
    if (raw && raw.phase) phases.add(raw.phase);
  }

  // The sequence the report asked for, in order, with nothing skipped.
  for (const phase of ['undock', 'outbound', 'approach-rock', 'mining',
                       'homebound', 'match', 'docking', 'transfer']) {
    ok(`the cycle passes through ${phase}`, phases.has(phase), [...phases].join(','));
  }

  const perf = FL.hullPerformance(c.id);
  ok('the hull ran ore in', perf && perf.delivered > 0, perf ? `${perf.delivered} kg` : 'no contract');
  ok('the company was paid for it', perf && perf.earned > 0, perf ? `${perf.earned} cr` : '—');
  ok('the treasury actually rose', S.company.treasury > treasury,
     `${Math.round(S.company.treasury - treasury)}`);
  ok('a full round trip beats its own upkeep', S.company.treasury - treasury > 0);

  const o = fleetOrderReport()[0];
  ok('the objective is still running — passive repeats', !!o);
  ok('and it counted the delivery', o && o.delivered > 0, o ? `${o.delivered} kg` : '—');
  ok('and counted more than one run', o && o.returns >= 2, o ? `${o.returns}` : '—');
}

// ── quotas complete ──────────────────────────────────────────────────
console.log('\n— an active quota finishes —');
{
  freshExec();
  S.docked = S.world.stations[0];
  FL.commissionHull('mine');
  const c = S.company.fleet[0];

  const d = CMD.commandById('ind-extract-2k');
  ok('the quota objective dispatches', d.ok === true, d.text);
  const o = fleetOrderReport()[0];
  ok('the quota travelled from the menu leaf', o.quotaKg === 2000, String(o.quotaKg));
  ok('it does not also carry a countdown', o.remaining === 0);

<<<<<<< HEAD
  const { creditFleetProgress } = await imp('systems/company/orders.js');
=======
  const { creditFleetProgress } = await imp('systems/orders.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  creditFleetProgress(o.id, 900);
  updateFleetOrders(0.1);
  ok('partial delivery does not complete it', fleetOrderReport().length === 1);
  ok('but it moves the bar', fleetOrderReport()[0].progress > 0.4);

  creditFleetProgress(o.id, 1200);
  updateFleetOrders(0.1);
  ok('filling the quota completes it', fleetOrderReport().length === 0);
  ok('and frees the hull', FL.fleetRoster()[0].busy === false);
}

// ── nothing else broke ───────────────────────────────────────────────
console.log('\n— every other command still dispatches —');
{
  freshExec();
  S.docked = S.world.stations[0];

  // One hull of every role a fleet order can ask for, so no dispatch fails merely for
  // want of a suitable ship.
  const need = new Set();
  for (const k of Object.keys(FLEET_ORDER_TYPES)) {
    for (const r of FLEET_ORDER_TYPES[k].requires || []) need.add(r);
  }
  for (const r of need) {
    if (FL.fleetRoster().length >= COMPANY.fleetCap) break;
    FL.commissionHull(r);
  }
  ok('the fleet has hulls of several classes', new Set(FL.fleetRoster().map(h => h.role)).size > 1);

  const results = [];
  for (const leaf of CMD.allLeaves()) {
    S.fleetOrders = [];
    for (const h of FL.fleetRoster()) h.orderId = null;
    for (const con of S.company.fleet) con.orderId = null;
    const r = CMD.commandById(leaf.id);
    results.push({ id: leaf.id, ok: r.ok, text: r.text });
  }
  const broken = results.filter(r => !r.ok);
  ok('every menu leaf dispatches against a full roster', broken.length === 0,
     broken.map(r => `${r.id}: ${r.text}`).join(' | '));

  // And the spoken forms still land where they did before the quota change.
  const phrases = [
    ['patrol the sector', 'patrol'],
    ['escort the convoy', 'escort'],
    ['send a cutter to extract ore', 'extract'],
    ['haul that freight to the depot', 'logistics'],
    ['run a survey pass', 'survey_pass'],
    ['hold position on picket', 'station_keep']
  ];
  for (const [text, type] of phrases) {
    S.fleetOrders = [];
    for (const con of S.company.fleet) con.orderId = null;
    const r = CMD.commandFromText(text);
    ok(`"${text}" still dispatches`, r.ok === true && r.order.type === type,
       r.ok ? r.order.type : r.text);
  }

  // Recall still frees the hull it was flying.
  S.fleetOrders = [];
  for (const con of S.company.fleet) con.orderId = null;
  const p = CMD.commandFromText('patrol the sector');
  ok('a dispatch binds a hull', FL.fleetRoster().some(h => h.busy));
  CMD.commandRecall('last');
  ok('recall still frees it', FL.fleetRoster().every(h => !h.busy));
  ok('and clears the board', fleetOrderReport().length === 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
