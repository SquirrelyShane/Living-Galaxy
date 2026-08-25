// The executive layer end to end: getting in, signing hulls, binding objectives to them,
// and the loop that feeds what happened back to ARIA.
//
// Three things this suite exists to pin, all of them holes v1.01.80 closed:
//
//   1. **The way in.** `foundCompany()` used to be reachable from exactly one place —
//      character creation, on one career — so a single choice permanently decided whether
//      a save could reach any of this, and every save written before v1.01.72 was locked
//      out. `registerCharter()` is the door; the gate around it is what stops it being a
//      free company.
//   2. **Objectives bind to real ships.** They used to bind to `wing-mil-patrol-30`: a
//      name, a role, and nothing in the world. A contract points at an NPC that can die,
//      despawn, or not exist yet, and every one of those has to reconcile rather than
//      leave a dangling pointer.
//   3. **The loop closes.** Diagnostics are recorded, persisted, harvested into few-shot
//      examples, and the harvested ones never outrank the hand-written ones.

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
const { createNpcs } = await imp('entities/npcs.js');
<<<<<<< HEAD
const { initMarket } = await imp('systems/trade/market.js');
const { COMPANY } = await imp('core/config.js');
const { SCHEMA } = await imp('core/version.js');
const CO = await imp('systems/company/company.js');
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
const { COMPANY } = await imp('core/config.js');
const { SCHEMA } = await imp('core/version.js');
const CO = await imp('systems/company.js');
const FL = await imp('systems/fleet.js');
const CMD = await imp('systems/command.js');
const { fleetOrderReport, updateFleetOrders, FLEET_ORDER_TYPES } = await imp('systems/orders.js');
const { createCharacter } = await imp('systems/character.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
const KB = await imp('data/npc-kb/index.js');

initScene();
recalcStats();
seedWorld(20260809);
createSystem();
createNpcs();
initMarket();

const anyStation = () => (S.world.stations || [])[0];
const dockAt = st => { S.docked = st || anyStation(); return S.docked; };

function freshPilot(career = 'broker') {
  S.company = null;
  S.fleetOrders = [];
  KB.resetDiagnostics();
  createCharacter({ name: 'Vale', lineage: 'core', corp: 'meridian', career });
  S.time = 1000;
}

// ── the way in ───────────────────────────────────────────────────────
console.log('\n— registering a charter —');
{
  freshPilot('broker');
  S.docked = null;
  ok('a pilot career starts with no company', !CO.hasCompany());

  let gate = CO.canRegisterCharter();
  ok('undocked, the registrar is closed', gate.ok === false);
  ok('and the reason says to dock', /dock/i.test(gate.reason));

  dockAt();
  S.credits = 100;
  gate = CO.canRegisterCharter();
  ok('broke, the registrar is closed', gate.ok === false);
  ok('and the reason names the fee', gate.reason.includes(String(COMPANY.registerFee).slice(0, 2)));

  S.credits = COMPANY.registerFee + 500;
  ok('funded and docked, it is open', CO.canRegisterCharter().ok === true);

  const brief = CO.registrarBrief();
  ok('the desk lists every charter', brief.charters.length > 0);
  ok('every charter has a name and a description',
     brief.charters.every(c => c.key && c.name && c.desc));
  ok('the desk names the station', !!brief.station);

  const before = S.credits;
  const r = CO.registerCharter('industrial');
  ok('registration goes through', r.ok === true);
  ok('it charges the pilot, not the treasury', S.credits === before - COMPANY.registerFee);
  ok('the treasury is capitalised', S.company.treasury === COMPANY.registerTreasury);
  ok('the charter is the one asked for', S.company.charter === 'industrial');
  ok('a late founder holds less than a career founder',
     S.company.held / S.company.shares < COMPANY.founderShares / COMPANY.startingShares);
  ok('the office is the station you signed at', S.company.hqStation === S.docked.userData.name);
  ok('the company knows it registered late', S.company.registeredLate === true);
  ok('and it opens the executive layer', CO.hasCompany() === true);

  ok('you cannot register twice', CO.registerCharter('economic').ok === false);
  ok('the second attempt changed nothing', S.company.charter === 'industrial');

  // A pirate bastion has no registrar. The check exists so the panel can say why rather
  // than offering a button that fails.
  const bastion = (S.world.stations || []).find(s => s.userData && s.userData.stype === 'bastion');
  if (bastion) {
    S.company = null;
    dockAt(bastion);
    const g = CO.canRegisterCharter();
    ok('pirates keep no companies register', g.ok === false);
    ok('and say so', /pirate|registrar/i.test(g.reason));
  } else {
    ok('pirates keep no companies register', true, 'no bastion on this seed');
    ok('and say so', true, 'no bastion on this seed');
  }
}

// ── signing hulls ────────────────────────────────────────────────────
console.log('\n— hulls under contract —');
{
  freshPilot('executive');
  S.time = 1000;
  ok('an executive career still incorporates at creation', CO.hasCompany());
  ok('and starts with an empty roster', FL.fleetRoster().length === 0);

  const open = FL.hullsAvailable(50);
  ok('there are hulls in range willing to sign', open.length > 0, `${open.length}`);
  ok('no hostile is on the list', open.every(c => c.faction !== 'hostile' && c.faction !== 'pirate'),
     open.filter(c => c.faction === 'hostile').map(c => c.npcName).join(', '));
  ok('every candidate carries a role', open.every(c => !!c.role));
  ok('every candidate is inside hire range', open.every(c => c.dist <= COMPANY.hireRange));
  ok('candidates are sorted by distance',
     open.every((c, i) => i === 0 || c.dist >= open[i - 1].dist));

  const target = open[0];
  const treasuryBefore = S.company.treasury;
  const r = FL.hireHull(target.npcName);
  ok('the hull signs', r.ok === true, r.reason);
  // Signing is booked against the charter, so the in-charter discount applies — the fee
  // costs less inside your own branch than outside it. That is the whole point of the
  // charter bonus, and until v1.01.80 it was applied backwards for spending.
  const spent = treasuryBefore - S.company.treasury;
  ok('the fee comes out of the treasury', spent > 0);
  ok('and the in-charter discount made it cheaper, not dearer', spent < COMPANY.hireFee,
     `${Math.round(spent)} vs ${COMPANY.hireFee}`);
  ok('the roster has one hull', FL.fleetRoster().length === 1);
  ok('the contract carries the role', r.contract.role === target.role);
  ok('the contract starts idle', r.contract.orderId === null);
  ok('the contract id is seeded, not wall-clock', /^hull-[0-9a-z]+-[0-9a-z]{2}$/.test(r.contract.id),
     r.contract.id);

  ok('the ship is marked as spoken for',
     FL.hullShip(r.contract).userData.contracted === r.contract.id);
  ok('a signed hull leaves the candidate list',
     !FL.hullsAvailable(50).some(c => c.npcName === target.npcName));
  ok('signing the same hull twice is refused', FL.hireHull(target.npcName).ok === false);

  // The cap is the same six as the objective board, so a full roster and a full board
  // cannot disagree about what the fleet is.
  for (const c of FL.hullsAvailable(50)) {
    if (FL.fleetRoster().length >= COMPANY.fleetCap) break;
    FL.hireHull(c.npcName);
  }
  ok('the roster caps', FL.fleetRoster().length === COMPANY.fleetCap,
     String(FL.fleetRoster().length));
  const over = FL.hireHull((FL.hullsAvailable(50)[0] || {}).npcName || 'nobody');
  ok('signing past the cap is refused, not thrown', over.ok === false);

  const first = FL.fleetRoster()[0];
  const rel = FL.releaseHull(first.id);
  ok('releasing works', rel.ok === true);
  ok('the roster shrinks', FL.fleetRoster().length === COMPANY.fleetCap - 1);
  ok('releasing an unknown contract is refused', FL.releaseHull('hull-nope').ok === false);
}

// ── objectives bind to real hulls ────────────────────────────────────
console.log('\n— an objective is flown by a ship —');
{
  freshPilot('executive');
  S.fleetOrders = [];
  const combat = FL.hullsAvailable(50).find(c => c.role === 'combat');
  const miner = FL.hullsAvailable(50).find(c => c.role === 'mine');

  ok('a combat hull is available to sign', !!combat);
  if (combat) FL.hireHull(combat.npcName);

  const r = CMD.commandFromText('patrol the sector');
  ok('the dispatch goes through', r.ok === true, r.text);
  ok('the objective names the real ship', r.order.assetName === combat.npcName,
     r.order.assetName);
  ok('and carries the contract id', !!r.order.contractId);
  ok('the order id is seeded, not wall-clock', /^fo-[0-9a-z]+-[0-9a-z]{2}$/.test(r.order.id),
     r.order.id);

  const bound = FL.fleetRoster().find(h => h.name === combat.npcName);
  ok('the hull is marked busy', bound.busy === true);
  ok('and points at the objective', bound.orderId === r.order.id);

  // One hull, one objective. With a roster of one and that one busy, the next dispatch
  // must refuse rather than invent a synthetic wing.
  const second = CMD.commandFromText('patrol the sector');
  ok('a busy roster refuses the next dispatch', second.ok === false);
  ok('and explains that the hulls are out', /objective|hull/i.test(second.text));
  ok('nothing extra was dispatched', fleetOrderReport().length === 1);

  // Role gating: an extract order wants a mining hull, and saying so beats silently
  // dispatching a gunship to a rock face.
  if (miner) {
    const wrong = CMD.commandById(
      CMD.intentFromUtterance('send a cutter to extract ore').node.id,
      { contractId: bound.id });
    ok('a combat hull is refused a mining order', wrong.ok === false);
    ok('and the refusal names the class', /mine|hull/i.test(wrong.text));

    FL.hireHull(miner.npcName);
    const right = CMD.commandFromText('send a cutter to extract ore');
    ok('a mining hull takes the mining order', right.ok === true, right.text);
    ok('and it is the miner that flew it', right.order.assetName === miner.npcName);
  } else {
    ok('a combat hull is refused a mining order', true, 'no mine hull on this seed');
    ok('and the refusal names the class', true, 'no mine hull on this seed');
    ok('a mining hull takes the mining order', true, 'no mine hull on this seed');
    ok('and it is the miner that flew it', true, 'no mine hull on this seed');
  }

  // Recall frees the hull. Before v1.01.80 the contract stayed marked busy forever and
  // the roster silently filled with ships that could not be given anything.
  CMD.commandRecall(combat.npcName);
  ok('recall frees the hull',
     FL.fleetRoster().find(h => h.name === combat.npcName).busy === false);

  // So does running out the clock.
  const again = CMD.commandFromText('patrol the sector');
  ok('the freed hull can be dispatched again', again.ok === true, again.text);
  updateFleetOrders(10000);
  ok('an expired objective frees its hull',
     FL.fleetRoster().every(h => !h.busy), 
     FL.fleetRoster().filter(h => h.busy).map(h => h.name).join(', '));
}

// ── per-hull mode ────────────────────────────────────────────────────
console.log('\n— a hull holds its own standing mode —');
{
  freshPilot('executive');
  S.fleetOrders = [];
  const c = FL.hullsAvailable(50).find(x => x.role === 'combat');
  FL.hireHull(c.npcName);
  const h = FL.fleetRoster()[0];

  ok('a new contract defaults to active', h.mode === 'active');
  ok('the mode can be set', CMD.commandHullMode(h.id, 'passive').ok === true);
  ok('and it sticks', FL.fleetRoster()[0].mode === 'passive');
  ok('an unknown hull is refused', CMD.commandHullMode('hull-nope', 'active').ok === false);
  ok('garbage falls back to active', (CMD.commandHullMode(h.id, 'sideways'), FL.fleetRoster()[0].mode === 'active'));
}

// ── reconciliation ───────────────────────────────────────────────────
console.log('\n— a contract survives what happens to the ship —');
{
  freshPilot('executive');
  S.fleetOrders = [];
  const c = FL.hullsAvailable(50).find(x => x.role === 'combat');
  FL.hireHull(c.npcName);
  const contract = S.company.fleet[0];

  FL.updateFleet(1);
  ok('a live hull keeps its contract', FL.fleetRoster().length === 1);
  ok('and its missing clock stays at zero', !contract.missingFor);

  // Kill it. A contract whose ship is gone is held briefly, not dropped on the first
  // frame — otherwise a load order that restores the company before the world would
  // quietly cancel the whole fleet.
  const ship = FL.hullShip(contract);
  ship.userData.hp = 0;
  FL.updateFleet(5);
  ok('a dead hull is not dropped immediately', FL.fleetRoster().length === 1);
  ok('but the clock is running', contract.missingFor > 0);

  FL.updateFleet(40);
  ok('and it closes once the grace period passes', FL.fleetRoster().length === 0);

  // The other direction: a company restored before the world exists.
  freshPilot('executive');
  const c2 = FL.hullsAvailable(50)[0];
  FL.hireHull(c2.npcName);
  const saved = S.world.npcs;
  S.world.npcs = [];
  FL.updateFleet(120);
  ok('an empty world does not cancel contracts', FL.fleetRoster().length === 1);
  S.world.npcs = saved;
}

// ── upkeep ───────────────────────────────────────────────────────────
console.log('\n— upkeep —');
{
  freshPilot('executive');
  const c = FL.hullsAvailable(50)[0];
  FL.hireHull(c.npcName);
  const before = S.company.treasury;

  FL.updateFleet(COMPANY.upkeepInterval - 1);
  ok('nothing is billed before the interval', S.company.treasury === before);

  FL.updateFleet(2);
  const billed = before - S.company.treasury;
  ok('the interval bills once', billed > 0);
  // Upkeep is booked against the charter too, so one hull inside the charter costs the
  // discounted rate rather than the list rate.
  ok('and it bills for the hull it has',
     Math.abs(billed - COMPANY.hireUpkeep * (1 - COMPANY.charterBonus)) < 0.01,
     `${billed.toFixed(2)}`);

  // A fleet that quietly bankrupts you is worse than a fleet that shrinks — the board's
  // solvency seat is the one that ends a company.
  S.company.treasury = 1;
  FL.updateFleet(COMPANY.upkeepInterval + 1);
  ok('an unpayable fleet sheds a hull instead of going negative',
     S.company.treasury >= 0 && FL.fleetRoster().length === 0);
}

// ── persistence ──────────────────────────────────────────────────────
console.log('\n— it all survives a save —');
{
  ok('the schema moved for this slice', SCHEMA >= 17, String(SCHEMA));

  freshPilot('executive');
  S.fleetOrders = [];
  const c = FL.hullsAvailable(50).find(x => x.role === 'combat');
  FL.hireHull(c.npcName);
  const dispatched = CMD.commandFromText('patrol the sector');
  ok('there is something to save', dispatched.ok && FL.fleetRoster().length === 1);

<<<<<<< HEAD
  const { serializeOrders, restoreOrders } = await imp('systems/company/orders.js');
=======
  const { serializeOrders, restoreOrders } = await imp('systems/orders.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  const orderSnap = JSON.parse(JSON.stringify(serializeOrders()));
  ok('the fleet board is in the orders payload', Array.isArray(orderSnap.fleet));
  ok('and it has the objective in it', orderSnap.fleet.length === 1);

  const coSnap = JSON.parse(JSON.stringify(CO.serializeCompany()));
  ok('the roster rides with the company', Array.isArray(coSnap.fleet) && coSnap.fleet.length === 1);

  const kbSnap = JSON.parse(JSON.stringify(KB.serializeDiagnostics()));
  ok('the diagnostic log serialises', Array.isArray(kbSnap.events));
  ok('and it recorded the hire and the dispatch', kbSnap.events.length >= 2,
     String(kbSnap.events.length));

  // Wipe and restore.
  S.fleetOrders = [];
  S.company = null;
  KB.resetDiagnostics();
  ok('the wipe took', FL.fleetRoster().length === 0 && KB.recentDiagnostics(50).length === 0);

  CO.restoreCompany(coSnap);
  restoreOrders(orderSnap);
  KB.restoreDiagnostics(kbSnap);

  ok('the company comes back', CO.hasCompany());
  ok('the roster comes back', FL.fleetRoster().length === 1);
  ok('the objective comes back', fleetOrderReport().length === 1);
  ok('and the hull is still bound to it',
     FL.fleetRoster()[0].orderId === fleetOrderReport()[0].id);
  ok('the diagnostic log comes back', KB.recentDiagnostics(50).length >= 2);
  ok('restored diagnostics are indexed by subject',
     KB.diagnosticsFor(FL.fleetRoster()[0].id).length >= 1);

  // A v16 company has no roster key at all — reading co.fleet.length would throw.
  CO.restoreCompany(Object.assign({}, coSnap, { fleet: undefined }));
  ok('a company saved before hulls existed restores', CO.hasCompany());
  ok('and gets an empty roster rather than a crash', FL.fleetRoster().length === 0);
}

// ── the self-training loop ───────────────────────────────────────────
console.log('\n— the loop closes —');
{
  freshPilot('executive');
  S.fleetOrders = [];

  ok('an empty log harvests nothing', KB.harvest().length === 0);

  const status0 = KB.trainingStatus();
  ok('the written corpus is there from the start', status0.seeds > 0);
  ok('and nothing is harvested yet', status0.harvested === 0);

  const c = FL.hullsAvailable(50).find(x => x.role === 'combat');
  FL.hireHull(c.npcName);
  CMD.commandFromText('patrol the sector');

  const harvested = KB.harvest();
  ok('activity produces examples', harvested.length > 0, String(harvested.length));
  ok('every harvested example is marked as such', harvested.every(e => e.harvested === true));
  ok('every harvested example names a purpose the schema knows',
     harvested.every(e => KB.TRAINING_PURPOSES.includes(e.purpose)));
  ok('every harvested example carries something to say',
     harvested.every(e => e.expected && e.expected.example));

  // The rule that stops the loop poisoning itself.
  ok('harvested quality is capped',
     harvested.every(e => e.quality <= KB.HARVEST_QUALITY_CAP),
     String(Math.max(...harvested.map(e => e.quality))));
  const seedFloor = Math.min(...KB.TRAINING_SEED.map(e => e.quality));
  ok('and every written example outranks every harvested one',
     seedFloor > KB.HARVEST_QUALITY_CAP,
     `seed floor ${seedFloor} vs cap ${KB.HARVEST_QUALITY_CAP}`);

  // Twenty identical dispatches must not become twenty identical examples.
  for (let i = 0; i < 20; i++) {
    KB.recordDiagnostic({
      subjectId: 'dupe', t: i, kind: 'order', situation: 'fleet:patrol',
      summary: 'Kestrel dispatched: Patrol (30s)', salience: 0.7
    });
  }
  const deduped = KB.harvest();
  ok('identical events collapse to one example',
     deduped.filter(e => e.expected.example === 'Kestrel dispatched: Patrol (30s)').length === 1);

  // An event with nothing to learn from produces nothing rather than an empty example.
  ok('an event with no situation makes no example',
     KB.exampleFrom({ id: 'x', kind: 'order', summary: 'something' }) === null);
  ok('an unknown kind makes no example',
     KB.exampleFrom({ id: 'x', kind: 'weather', situation: 's', summary: 'y' }) === null);

  const batch = KB.buildBatch('command', { size: 6 });
  ok('a batch comes back', batch.examples.length > 0);
  ok('it is capped at the size asked for', batch.examples.length <= 6);
  ok('written examples come first',
     batch.examples.findIndex(e => e.harvested) === -1 ||
     batch.examples.findIndex(e => e.harvested) >= batch.seeds);
  ok('the batch says what it is made of', batch.seeds + batch.harvested === batch.examples.length);

  const block = KB.fewShotBlock('command');
  ok('the block renders as text', typeof block === 'string' && block.length > 0);
  ok('it is plain lines, not JSON', !block.includes('{') && !block.includes('```'));
  ok('every line is bounded', block.split('\n').every(l => l.length <= 200));

  // A purpose with no harvest still produces a usable block from seeds alone.
  const dlg = KB.buildBatch('dialogue', { size: 4 });
  ok('a purpose with no activity still fills from seeds', dlg.examples.length > 0);

  ok('the status report counts both sides', (() => {
    const t = KB.trainingStatus();
    return t.seeds > 0 && t.harvested > 0 && t.events > 0;
  })());
  ok('the brief is a sentence', /examples/.test(KB.trainingBrief()));
}

// ── the surfaces agree ───────────────────────────────────────────────
console.log('\n— Ops and ARIA see the same fleet —');
{
  freshPilot('executive');
  S.fleetOrders = [];
  const c = FL.hullsAvailable(50).find(x => x.role === 'combat');
  FL.hireHull(c.npcName);
  CMD.commandFromText('patrol the sector');

  const cat = CMD.commandCatalogue();
  ok('the catalogue carries the roster', Array.isArray(cat.hulls) && cat.hulls.length === 1);
  ok('and the active board', cat.active.length === 1);
  ok('the roster it carries is the real one',
     cat.hulls[0].id === FL.fleetRoster()[0].id);

<<<<<<< HEAD
  const tools = await imp('systems/platform/tools.js');
=======
  const tools = await imp('systems/tools.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  const roster = tools.callTool('fleet_roster');
  ok('ARIA can read the roster', roster.text.includes(c.npcName), roster.text);

  const cands = tools.callTool('fleet_candidates');
  ok('ARIA can list who would sign', typeof cands.text === 'string' && cands.text.length > 0);

  // The safety split: ARIA reports the spend, Ops commits it.
  ok('no tool signs a hull', !tools.TOOL_KEYS.some(k => /hire|register/.test(k)),
     tools.TOOL_KEYS.join(','));
  ok('no tool releases one', !tools.TOOL_KEYS.some(k => /release|dismiss/.test(k)));

  const treasuryBefore = S.company.treasury;
  const creditsBefore = S.credits;
  for (const k of tools.TOOL_KEYS) tools.callTool(k, ['ore']);
  ok('running every tool spends nothing from the treasury', S.company.treasury === treasuryBefore);
  ok('and nothing from the wallet', S.credits === creditsBefore);

  ok('ARIA can still set a mode', tools.callTool('fleet_mode', [c.npcName, 'passive']).text.length > 0);
  ok('and it took', FL.fleetRoster()[0].mode === 'passive');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
