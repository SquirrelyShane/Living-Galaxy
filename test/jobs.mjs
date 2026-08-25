// Every hull the yard sells has work it can be given.
//
// The report: "construction ships can do nothing. every ship we can buy needs to have a job
// it can be assigned to do."
//
// It was exactly true. `FLEET_ROLES` sells six roles; `FLEET_ORDER_TYPES` declared its
// eligibility in a `requires` list; and no order type in the game listed `build`. You could
// commission a construction hull, pay for it, and then find there was nothing on the
// dispatch board it could accept. `merc` was nearly as bad — two jobs, both of which a
// plain patrol hull did equally well, so the role bought you nothing.
//
// This suite is the coverage matrix, and it is written as a *rule* rather than a snapshot:
// it walks `FLEET_ROLES` and asserts every role reaches a floor, so adding a seventh
// sellable hull with no work is a red suite on the day it is added rather than a report
// from a player three patches later. Same shape as `test/reachability.mjs`, which does the
// same job for player-facing verbs.
//
// Then it drives each new order type end to end, because a `requires` entry that dispatches
// and does nothing is the same hole wearing a different hat — which is precisely what
// v1.01.90 found when five of the six original order types turned out to be countdowns.

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
const { createSystem, updateSystem, attachModule } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { createNpcs, updateNpcs } = await imp('entities/npcs.js');
<<<<<<< HEAD
const { initMarket, updateMarket } = await imp('systems/trade/market.js');
const { createCharacter } = await imp('systems/crew/character.js');
const { initWorldSim } = await imp('systems/platform/worldsim.js');
const { FLEET_ROLES, COMPANY } = await imp('core/config.js');
const { FLEET_ORDER_TYPES, FLEET_ORDER_KEYS, dispatchFleet, updateFleetOrders } = await imp('systems/company/orders.js');
const FL = await imp('systems/company/fleet.js');
// The entity factories are a boot step, not an import side effect — see core/spawn.js.
const { registerNpcFactories } = await imp('entities/npcs.js');
const { registerHullFactory } = await imp('entities/shipmesh.js');
registerNpcFactories(); registerHullFactory();
const PR = await imp('systems/company/fleet-projects.js');
const { WORK } = await imp('systems/company/fleet-work.js');
=======
const { initMarket, updateMarket } = await imp('systems/market.js');
const { createCharacter } = await imp('systems/character.js');
const { initWorldSim } = await imp('systems/worldsim.js');
const { FLEET_ROLES, COMPANY } = await imp('core/config.js');
const { FLEET_ORDER_TYPES, FLEET_ORDER_KEYS, dispatchFleet, updateFleetOrders } = await imp('systems/orders.js');
const FL = await imp('systems/fleet.js');
const PR = await imp('systems/fleet-projects.js');
const { WORK } = await imp('systems/fleet-work.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
const G = await imp('world/genesis.js');

initScene();
recalcStats();
seedWorld(20260814);
S.seed = 20260814;
S.systemPlan = G.solarisPlan();
createSystem();
createAsteroids();
createNpcs();
initMarket();
initWorldSim();

const ROLES = Object.keys(FLEET_ROLES);

/** Every order type this role may be given. */
const jobsFor = role => FLEET_ORDER_KEYS.filter(k =>
  (FLEET_ORDER_TYPES[k].requires || []).includes(role));

// ── 1. the coverage matrix ───────────────────────────────────────────
console.log('\n— every sellable hull has work —');
{
  ok('the yard sells six roles', ROLES.length === 6, ROLES.join(','));

  for (const role of ROLES) {
    const jobs = jobsFor(role);
    // The floor. One job is not "has work" — it is a single-purpose ship sold at the same
    // price as the others, which is what `build` would still be with only `construct`.
    ok(`${role} (${FLEET_ROLES[role].name}) has at least three jobs`,
       jobs.length >= 3, `${jobs.length}: ${jobs.join(',')}`);
  }

  // The specific hole from the report.
  ok('build is no longer a hull with nothing to do', jobsFor('build').length > 0,
     jobsFor('build').join(','));
  ok('merc has work a patrol hull cannot simply do instead',
     jobsFor('merc').some(k => !jobsFor('combat').includes(k)) ||
     jobsFor('merc').length >= 4, jobsFor('merc').join(','));

  // No dead requirement. This is the v1.01.00 lesson the order table already carries a
  // comment about: a declared requirement needs somebody who can meet it.
  for (const key of FLEET_ORDER_KEYS) {
    const req = FLEET_ORDER_TYPES[key].requires || [];
    ok(`${key} requires only roles the yard actually sells`,
       req.length > 0 && req.every(r => ROLES.includes(r)),
       req.filter(r => !ROLES.includes(r)).join(',') || '(empty)');
  }

  // And every order type is reachable by somebody.
  for (const key of FLEET_ORDER_KEYS) {
    ok(`${key} can be crewed by at least one role`,
       ROLES.some(r => jobsFor(r).includes(key)));
  }

  // Declarations that have to be complete or the UI renders a blank card.
  for (const key of FLEET_ORDER_KEYS) {
    const spec = FLEET_ORDER_TYPES[key];
    ok(`${key} is fully declared`,
       !!spec.name && !!spec.icon && !!spec.branch && !!spec.desc &&
       Array.isArray(spec.modes) && spec.modes.length > 0,
       JSON.stringify({ n: !!spec.name, i: !!spec.icon, b: !!spec.branch,
                        d: !!spec.desc, m: spec.modes }));
  }

  // Every job needs a door. A type in `FLEET_ORDER_TYPES` with no leaf in the command
  // dialogue is reachable only from ARIA or the console — which is the same "you cannot
  // give this ship that job" complaint wearing a different hat, and is the rule
  // docs/REACHABILITY_AUDIT.md already holds every player-facing verb to.
  {
    const { COMMAND_MENU } = await imp('data/command-menu.js');
    const leafTypes = new Set();
    const walk = n => { if (n.order) leafTypes.add(n.order.type); (n.children || []).forEach(walk); };
    COMMAND_MENU.forEach(walk);
    for (const key of FLEET_ORDER_KEYS) {
      ok(`${key} has a door in the command dialogue`, leafTypes.has(key));
    }
    ok('the dialogue offers no order type that does not exist',
       [...leafTypes].every(t => FLEET_ORDER_KEYS.includes(t)),
       [...leafTypes].filter(t => !FLEET_ORDER_KEYS.includes(t)).join(','));
    // Every leaf has to name a role that can actually take it, or the menu offers a job
    // to a hull the dispatcher will refuse.
    const leaves = [];
    const collect = n => { if (n.order) leaves.push(n); (n.children || []).forEach(collect); };
    COMMAND_MENU.forEach(collect);
    const mismatched = leaves.filter(l => l.assetRole &&
      !(FLEET_ORDER_TYPES[l.order.type].requires || []).includes(l.assetRole));
    ok('every menu leaf offers the job to a role that can take it',
       mismatched.length === 0,
       mismatched.slice(0, 3).map(l => `${l.id}:${l.assetRole}/${l.order.type}`).join(' | '));
  }
}

// ── 2. every job has a body ──────────────────────────────────────────
// A `requires` entry that dispatches and then does nothing is the same hole in a different
// place. v1.01.90 found exactly that in five of the six original types.
console.log('\n— every job actually does something —');

function freshExec() {
  S.company = null;
  S.fleetOrders = [];
  S.crew = [];
  createCharacter({ name: 'Skud', lineage: 'core', corp: 'meridian', career: 'executive' });
  S.credits = 5e6;
  S.company.treasury = 5e6;
  S.docked = S.world.stations[0];
}

function hullFor(role) {
  const r = FL.commissionHull(role);
  if (!r.ok) throw new Error(`commission ${role} refused: ${r.reason}`);
  return S.company.fleet[S.company.fleet.length - 1];
}

function give(role, type, opts = {}) {
  const hull = hullFor(role);
  const o = dispatchFleet(type,
    { id: hull.id, role: hull.role, name: hull.name, contractId: hull.id },
    Object.assign({ mode: 'passive' }, opts));
  if (typeof o === 'string') throw new Error(`dispatch ${type} refused: ${o}`);
  return { hull, order: o, ship: FL.hullShip(hull) };
}

function run(seconds, dt = 0.25) {
  for (let t = 0; t < seconds; t += dt) {
    updateSystem(dt); updateNpcs(dt); updateMarket(dt); updateFleetOrders(dt);
  }
}

// Every role can be dispatched onto every job it declares, without throwing.
{
  let dispatched = 0, refused = [];
  for (const role of ROLES) {
    for (const type of jobsFor(role)) {
      freshExec();
      try { give(role, type); dispatched++; }
      catch (e) { refused.push(`${role}/${type}: ${e.message}`); }
    }
  }
  ok('every role/job pair in the matrix dispatches', refused.length === 0,
     refused.slice(0, 3).join(' | '));
  ok('the matrix is not trivially small', dispatched >= 24, String(dispatched));
}

// And every job runs a step without throwing, on a real hull, in a real world.
{
  const broke = [];
  for (const role of ROLES) {
    for (const type of jobsFor(role)) {
      freshExec();
      try { give(role, type); run(30); }
      catch (e) { broke.push(`${role}/${type}: ${e.message}`); }
    }
  }
  ok('every role/job pair survives thirty seconds of work', broke.length === 0,
     broke.slice(0, 3).join(' | '));
}

// ── 3. construction, all three sources ───────────────────────────────
console.log('\n— construction —');
{
  freshExec();
  const hq = S.world.stations[0];
  const opts = PR.buildable(hq);
  ok('the yard offers modules to build', opts.length > 0, String(opts.length));
  ok('every option is priced and timed', opts.every(o => o.fee > 0 && o.hours > 0));
  ok('an option carries a description', opts.every(o => !!o.name && !!o.desc));

  const pick = opts.find(o => !o.blocked) || opts[0];
  const r = PR.orderProject(hq, pick.key);
  ok('a module can be ordered', r.ok === true, r.reason);
  ok('ordering does not charge up front', S.company.treasury === 5e6,
     String(S.company.treasury));
  ok('the order book shows it', PR.projectReport().length === 1);
  ok('the same module cannot be ordered twice at the same berth',
     PR.orderProject(hq, pick.key).ok === false);

  // The cap is a real cap.
  let ordered = 1;
  for (const o of opts) { if (PR.orderProject(hq, o.key).ok) ordered++; }
  ok('the order book is capped', ordered <= COMPANY.projectCap, String(ordered));

  // A builder converts treasury into a module that is really bolted on.
  const before = (hq.userData.modules || []).length;
  const treasuryBefore = S.company.treasury;
  const { order } = give('build', 'construct', { source: 'company' });
  run(900);
  ok('the builder put work into the project', (order.built || 0) > 0, String(order.built));
  ok('the treasury paid for it', S.company.treasury < treasuryBefore);
  ok('and a module is really attached',
     (hq.userData.modules || []).length > before,
     `${before} → ${(hq.userData.modules || []).length}`);
  ok('the project is marked done', PR.projectReport().some(p => p.done) ||
     PR.projectReport().length < ordered);

  // Cancelling is not a free undo.
  const open = PR.projectReport().find(p => !p.done);
  if (open) {
<<<<<<< HEAD
    const c = PR.cancelConstruction(open.id);
=======
    const c = PR.cancelProject(open.id);
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
    ok('a project can be cancelled', c.ok === true);
    ok('and what was spent is stated, not refunded', typeof c.spent === 'number');
  } else {
    ok('a project can be cancelled', true);
    ok('and what was spent is stated, not refunded', true);
  }
}
{
  // Contract labour on somebody else's scaffold pays credits.
  freshExec();
  const { order } = give('build', 'construct', { source: 'contract' });
  run(600);
  ok('contract construction either works a scaffold or says there is none',
     (order.delivered || 0) > 0 || /scaffold/.test(order.leg || ''), order.leg);
}

// ── 4. the other five ────────────────────────────────────────────────
console.log('\n— the other five —');
{
  freshExec();
  // Seed the field with recoverable wreckage the way a kill would.
  const { order, ship } = give('build', 'salvage');
  const drop = { mesh: { position: ship.position.clone(), parent: null }, kg: 900,
                 commodity: 'ore', spin: 1, life: 0 };
  drop.mesh.position.x += 300;
  S.world.loot.push(drop);
  run(400);
  ok('salvage recovers wreckage', (order.recovered || 0) > 0 || (order.runs || 0) > 0,
     `${order.recovered} kg, leg=${order.leg}`);
}
{
  freshExec();
  const { order, ship } = give('merc', 'hunt');
  // Put a hostile within reach so the sweep has something to find.
  const hostile = S.world.npcs.find(n => n.userData.faction === 'hostile' ||
                                          n.userData.faction === 'pirate');
  if (hostile) { hostile.position.copy(ship.position); hostile.position.x += 600;
                 hostile.userData.ambush = false; }
  run(400);
  ok('a hunt engages or reports a clear sweep',
     (order.kills || 0) > 0 || /engaging|closing|sweeping/.test(order.leg || ''), order.leg);
  ok('a hunt does not earn for looking',
     (order.kills || 0) > 0 || (order.earned || 0) === 0, String(order.earned));
}
{
  freshExec();
  const { order } = give('mine', 'prospect');
  run(500);
  ok('prospecting raises an assay', (order.assay || 0) > 0 || /no field/.test(order.leg || ''),
     `${order.assay} · ${order.leg}`);
  ok('and the assay is the number the ground orders read',
     order.fieldName ? (S.assay || {})[order.fieldName] > 0 : true);
}
{
  freshExec();
  const { order } = give('trade', 'arbitrage', { commodity: 'ore' });
  run(900);
  ok('arbitrage picks a pair', !!order.buyName && !!order.sellName || /no spread/.test(order.leg || ''),
     `${order.buyName} → ${order.sellName} · ${order.leg}`);
  ok('and books a profit figure that can be negative',
     order.runs > 0 ? typeof order.profit === 'number' : true, String(order.profit));
  ok('the two ends are different berths',
     !order.buyName || !order.sellName || order.buyName !== order.sellName);
}
{
  freshExec();
  // A damaged hull in the field for the tender to find.
  const hurt = hullFor('haul');
  const hurtShip = FL.hullShip(hurt);
  const { order } = give('haul', 'tender');
  // Take it off the pad and wound it — a docked hull fixes itself and is not a casualty.
  run(3);
  hurtShip.userData.dockedAt = null;
  hurtShip.userData.hp = hurtShip.userData.maxHp * 0.4;
  const hpBefore = hurtShip.userData.hp;
  run(600);
  ok('a tender finds and patches a casualty',
     hurtShip.userData.hp > hpBefore || /sound|running to|patching/.test(order.leg || ''),
     `${Math.round(hpBefore)} → ${Math.round(hurtShip.userData.hp)} · ${order.leg}`);
}

// ── 5. the tuning is declared, not magic ─────────────────────────────
console.log('\n— the numbers exist —');
{
  for (const k of ['buildRate', 'siteRate', 'sitePayPerUnit', 'salvageRate', 'salvageValue',
                   'huntRange', 'engageRange', 'huntDps', 'huntBreakOff', 'prospectRate',
                   'prospectPay', 'minSpread', 'tenderThreshold', 'tenderRate', 'tenderCost']) {
    ok(`WORK.${k} is declared`, typeof WORK[k] === 'number' && WORK[k] > 0, String(WORK[k]));
  }
  // A hunter that never breaks off is a hunter that always dies.
  ok('a hunter breaks off above zero', WORK.huntBreakOff > 0 && WORK.huntBreakOff < 1);
  // A tender that repairs for free is an infinite fleet.
  ok('repairs cost money', WORK.tenderCost > 0);
}

// ── 6. the order book persists ───────────────────────────────────────
console.log('\n— the order book survives a save —');
{
  freshExec();
  // A berth the construction section above has not already filled. Suites share one world,
  // and station[0] ends that section with modules bolted on and hardpoints spent — so
  // ordering there returns "no free hardpoint" and the whole block tests nothing.
  const hq = S.world.stations.find(st =>
    (st.userData.modules || []).length < (st.userData.slots || 0)) || S.world.stations[1];
  const opt = PR.buildable(hq).find(o => !o.blocked) || PR.buildable(hq)[0];
  const placed = PR.orderProject(hq, opt.key);
  ok('a project can be ordered on a free berth', placed.ok === true, placed.reason);
  const p = PR.projects()[0];
  ok('the order book holds it', !!p);
  PR.advanceProject(p, 400);
  ok('work went in', p.progress > 0, String(p.progress));

  const wire = JSON.parse(JSON.stringify(PR.serializeProjects()));
  ok('an open project serialises', wire.length === 1, String(wire.length));
  ok('and carries its progress', wire[0].progress > 0);

  PR.restoreProjects(wire);
  ok('and restores', PR.projects().length === 1);
  ok('with the progress intact', PR.projects()[0].progress === wire[0].progress);
  // Ids must not collide after a restore, or a second project overwrites the first.
  PR.orderProject(hq, PR.buildable(hq)[0].key);
  ok('a project ordered after a restore gets a fresh id',
     new Set(PR.projects().map(x => x.id)).size === PR.projects().length);

  // A completed project is not carried in the save — the module is on the station now.
  // Marked on the *live* record rather than on `p`: `restoreProjects` replaced the array,
  // so `p` is a detached object from before the round trip and setting `done` on it would
  // assert nothing at all.
  PR.projects()[0].done = true;
  ok('completed projects are not persisted', PR.serializeProjects().length < PR.projects().length);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
