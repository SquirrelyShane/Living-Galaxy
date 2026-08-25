// Slice — the tactical picture, the fact table, the decision tree, and the ship's own
// installations.
//
// ## Why this suite exists at all
//
// `reasoner.js` is data. A rule is `['heat.pct', '>=', 80]`, and a rule against a fact that
// does not exist reads `null`, compares false, and *never fires*. That is the right runtime
// behaviour — a typo must not crash a flight — but it means a mistyped key is a rule that
// silently does nothing, forever, and nobody notices because the tree still returns a
// perfectly reasonable answer from some other branch.
//
// So the first assertion here is the one the whole design leans on: **every fact every rule
// mentions exists**. That single check is what buys the tree the right to fail soft.
//
// The rest is the same principle applied outward. A directive vocabulary that drifts from
// what `autopilot.js` consumes is a decision nobody acts on; a deployment lock that can be
// beaten by writing throttle directly is not a lock; a farm that grows into a private number
// is a second opinion about whether the crew has eaten. Each of those is one assertion here.

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
const { createSystem, updateSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { initPlayerFx } = await imp('entities/player.js');
const { createNpcs } = await imp('entities/npcs.js');
const { initProjectiles } = await imp('systems/combat/projectiles.js');
const { initCombat } = await imp('systems/combat/combat.js');
const { initMining } = await imp('systems/industry/mining.js');
const { initWorldSim } = await imp('systems/platform/worldsim.js');
const { initMarket } = await imp('systems/trade/market.js');
const { initContracts } = await imp('systems/trade/contracts.js');
const { resetReputation } = await imp('systems/company/reputation.js');
const { createCharacter } = await imp('systems/crew/character.js');
const { initCommsSystem } = await imp('systems/npc/comms.js');
const { addMaterial, held } = await imp('systems/industry/crafting.js');

const SW = await imp('systems/npc/sweep.js');
const F = await imp('systems/npc/facts.js');
const R = await imp('systems/npc/reasoner.js');
const ADV = await imp('systems/npc/advisor.js');
const H = await imp('systems/industry/habitat.js');
const { HABITAT, ADVISOR, SWEEP } = await imp('core/config.js');

initScene(); recalcStats(); seedWorld(24601); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx(); createNpcs();
resetReputation(); initWorldSim(); initMarket(); initContracts(); initCommsSystem();
createCharacter({ name: 'Vane', lineage: 'rim', corp: 'kestrel', career: 'prospector' });
updateSystem(1);
S.running = true;
S.credits = 40000;

const FOOD = 'BIO-008', WATER = 'RAW-011';

/* Every test that touches the ship starts from the same hull. Cheaper than a reset path and
   it means a failure is about the thing under test rather than about what ran before it. */
function baseline() {
  SW.resetSweep(); ADV.resetAdvisor(); H.resetHabitat();
  S.sim.disabled = null;
  S.player.throttle = 0;
  if (S.player.velocity) S.player.velocity.set(0, 0, 0);
  S.warp.state = 'idle';
  S.player.energy = S.stats.energyCap;
  S.player.hull = S.stats.hullMax;
  S.player.expend = 0;
  S.docked = null;
  S.settings.advisories = true;
  S.time += 10000;                 // past every cooldown from the previous block
}

// ── the fact table ───────────────────────────────────────────────────
console.log('\n— the dictionary —');
{
  baseline();
  const all = F.readAll();

  ok('every fact is readable', F.FACT_KEYS.every(k => k in all));
  ok('nothing in the table throws',
    F.FACT_KEYS.every(k => { try { F.read(k); return true; } catch (e) { return false; } }));

  // A fact may legitimately be Infinity (nothing in range) but never NaN: NaN compares false
  // against every operator, so a NaN fact is an invisible dead rule.
  const nan = F.FACT_KEYS.filter(k => typeof all[k] === 'number' && Number.isNaN(all[k]));
  ok('no fact reads NaN', nan.length === 0, nan.join(', '));

  ok('an unknown key reads null', F.read('there.is.no.such.thing') === null);
  ok('percentages are percentages, not fractions',
    all['hull.pct'] > 1 && all['hull.pct'] <= 100);
  ok('the table is worth having', F.FACT_KEYS.length >= 60, String(F.FACT_KEYS.length));
}

// ── the guard the whole design leans on ──────────────────────────────
console.log('\n— every rule points at something —');
{
  const referenced = [...R.referencedFacts()];
  const missing = referenced.filter(k => !(k in F.FACTS));
  ok('every fact a rule mentions exists', missing.length === 0,
    missing.length ? 'unknown: ' + missing.join(', ') : '');

  // The inverse is not an error — a fact may exist for ARIA's readout without any rule
  // caring yet — but it is worth seeing, because a table growing far past the tree is a
  // table nobody is using.
  console.log(`       ${referenced.length} of ${F.FACT_KEYS.length} facts are load-bearing`);

  const ids = R.nodeIds();
  ok('node ids are unique', new Set(ids).size === ids.length);
  ok('every node has an id', ids.every(i => typeof i === 'string' && i.length));

  // Every rule is a well-formed tuple with a known operator, checked structurally rather
  // than by hoping evaluation happens to reach it.
  const bad = [];
  (function walk(nodes, path) {
    for (const n of nodes) {
      for (const r of (n.when || [])) {
        if (!Array.isArray(r) || r.length !== 3) bad.push(`${n.id}: not a triple`);
        else if (!R.OP_KEYS.includes(r[1])) bad.push(`${n.id}: operator "${r[1]}"`);
        else if (r[1] === 'between' && !Array.isArray(r[2])) bad.push(`${n.id}: between wants a pair`);
      }
      if (n.then) walk(n.then, path.concat(n.id));
      if (!n.then && !n.set) bad.push(`${n.id}: decides nothing`);
    }
  })(R.TREE, []);
  ok('every rule is well formed', bad.length === 0, bad.join('; '));

  // A leaf with an empty `when` is the catch-all for its level. Anything below one is
  // unreachable, which is the tree equivalent of dead code.
  const shadowed = [];
  (function walk(nodes) {
    let caught = null;
    for (const n of nodes) {
      if (caught) shadowed.push(`${n.id} sits under catch-all ${caught}`);
      if (!n.when || !n.when.length) caught = n.id;
      if (n.then) walk(n.then);
    }
  })(R.TREE);
  ok('no node sits below a catch-all', shadowed.length === 0, shadowed.join('; '));

  const rep = R.treeReport();
  ok('the tree is big enough to be worth the machinery', rep.nodes >= 25, String(rep.nodes));
  console.log(`       ${rep.nodes} nodes · ${rep.facts} facts · ${rep.operators} operators`);
}

// ── the comparators ──────────────────────────────────────────────────
console.log('\n— the language —');
{
  const O = R.OPS;
  ok('>  ', O['>'](3, 2) && !O['>'](2, 2));
  ok('>= ', O['>='](2, 2) && !O['>='](1, 2));
  ok('<  ', O['<'](1, 2) && !O['<'](2, 2));
  ok('<= ', O['<='](2, 2) && !O['<='](3, 2));
  ok('== ', O['=='](2, 2) && !O['=='](2, 3));
  ok('!= ', O['!='](2, 3) && !O['!='](2, 2));
  ok('between is inclusive at both ends',
    O.between(40, [40, 80]) && O.between(80, [40, 80]) && !O.between(81, [40, 80]));
  ok('between refuses a non-pair', O.between(5, 5) === false);
  ok('== is strict', O['=='](0, false) === false);
  ok('Infinity behaves', O['>'](Infinity, 9e9) && !O['<'](Infinity, 9e9));
}

// ── walking it ───────────────────────────────────────────────────────
console.log('\n— the walk —');
{
  baseline();

  // A tiny tree over real facts, so this tests evaluation rather than the shipped rules.
  const T = [
    { id: 'never', when: [['hull.pct', '<', 0]], set: { reason: 'impossible' } },
    { id: 'always', when: [['hull.pct', '>=', 0]],
      set: { posture: 'cruise', reason: 'parent' },
      then: [
        { id: 'always.deep', when: [['hull.pct', '<=', 100]], set: { reason: 'child' } }
      ] },
    { id: 'unreached', when: [], set: { reason: 'should never be seen' } }
  ];
  const d = R.decide(T);
  ok('the first matching sibling wins', d.path[0] === 'always');
  ok('a false node contributes nothing', !d.path.includes('never'));
  ok('depth wins over breadth', d.reason === 'child');
  ok('a parent still applies', d.posture === 'cruise');
  ok('siblings after a match are not evaluated', !d.path.includes('unreached'));
  ok('the trace carries the values it saw', d.trace.every(t => typeof t.got === 'number'));
  ok('the trace only holds clauses that fired', d.trace.every(t => t.ok));
  ok('facts are memoised per decision', Object.keys(d.facts).length === 1);

  // The point of the whole exercise: a sentence with its evidence in it.
  const why = R.explain(d);
  ok('explain names the reason', why.startsWith('child'));
  ok('explain shows the number', /hull\.pct \d/.test(why), why);

  const unknown = R.decide([{ id: 'typo', when: [['hul.pct', '>', 0]], set: { reason: 'no' } }]);
  ok('a rule against an unknown fact declines rather than throwing', unknown.path.length === 0);
  ok('...and falls through to the blank decision', unknown.reason === 'no opinion');
}

// ── the branches that matter ─────────────────────────────────────────
console.log('\n— the shipped tree —');
{
  baseline();
  S.sim.disabled = { t: 4 };
  const d = R.decide();
  ok('a disabled hull is the first thing checked', d.path[0] === 'disabled');
  ok('...and it does not try to fly', d.posture === 'adrift' && d.task === null);
}
{
  baseline();
  S.fit = { weapon: [], utility: ['solararray', 'solararray'], core: [] };
  S.habitat.panels.state = 'deployed';
  S.habitat.panels.pct = 100;
  S.player.energy = S.stats.energyCap * 0.4;
  const d = R.decide();
  ok('arrays out is decided before anything about the fight', d.path[0] === 'pinned');
  ok('...and pins the throttle at zero', d.throttleCap === 0);
  ok('a part-charged bank keeps charging',
    d.path.includes('pinned.charging') && d.task === 'charge');

  S.player.energy = S.stats.energyCap;
  const full = R.decide();
  ok('a full bank stows them again', full.stowPanels === true, full.path.join('>'));
}
{
  baseline();
  S.fit = { weapon: [], utility: [], core: [] };
  const d = R.decide();
  ok('a quiet sky reaches the quiet branch', d.path[0] === 'quiet', d.path.join('>'));
  ok('...and always decides something', d.posture !== null && d.reason !== 'no opinion');
  ok('a decision is always complete',
    ['posture', 'task', 'holdFire', 'vent', 'urgent', 'throttleCap',
     'deployPanels', 'stowPanels', 'advise', 'reason'].every(k => k in d));
}

// ── money is a fact ──────────────────────────────────────────────────
//
// The bug this pins, in one sentence: a hull with a hole in it and no credits was sent to a
// yard, walked a checklist where every line was a purchase, left, and — because nothing
// about the hull had changed — turned round and did it again.
//
// "The hull needs work" and "we can pay to have the hull worked on" are two facts. The tree
// only knew the first one.
console.log('\n— an empty account —');
{
  baseline();
  S.fit = { weapon: [], utility: [], core: [] };
  S.player.hull = S.stats.hullMax * 0.4;      // a real reason to want a yard
  S.credits = 60000;

  ok('a solvent hull is not broke', F.read('broke') === 0);
  ok('...and can pay for the repair', F.read('repair.affordable') === 1);
  ok('the repair has a price', F.read('repair.cost') > 0, String(F.read('repair.cost')));
  const rich = R.decide();
  ok('so the yard is the answer', rich.task === 'service',
     `${rich.path.join('>')} — ${rich.reason}`);

  S.credits = 120;
  ok('an empty account is broke', F.read('broke') === 1);
  ok('...and cannot pay for the repair', F.read('repair.affordable') === 0);

  const poor = R.decide();
  ok('a broke hull is not sent to a yard for a repair it cannot buy',
     !/needs a yard/.test(poor.reason), `${poor.path.join('>')} — ${poor.reason}`);
  ok('...it is sent to earn instead',
     ['mine', 'hunt', 'service', 'deliver', 'sell', 'salvage'].includes(poor.task),
     `${poor.path.join('>')} — ${poor.task}`);
  ok('...and the money is what it says so',
     poor.trace.some(t => t.key === 'broke'), poor.trace.map(t => t.key).join(','));

  // The specific branch, with the conditions it needs actually true.
  ok('rock in range and room in the hold means mining',
     poor.path.includes('quiet.broke.mine') || F.read('field.nearest') >= 40000 ||
     F.read('cargo.free') <= 50,
     `${poor.path.join('>')} · field ${Math.round(F.read('field.nearest'))} · ` +
     `free ${Math.round(F.read('cargo.free'))}`);

  // ...and a berth still earns its keep when there is something to hand over, because
  // selling and delivering are the two lines on the checklist that pay *us*.
  S.player.hull = S.stats.hullMax;
  const withWork = R.decide();
  ok('a whole hull with no money still finds something to do',
     withWork.task !== null, withWork.path.join('>'));

  S.credits = 40000;
  S.player.hull = S.stats.hullMax;
}
{
  // The directive vocabulary is a contract with `autopilot.js`. If the tree starts emitting
  // a directive nothing consumes, the decision is made and then dropped on the floor.
  const KNOWN = new Set(['posture', 'task', 'holdFire', 'vent', 'urgent', 'throttleCap',
                         'deployPanels', 'stowPanels', 'advise', 'reason']);
  const strays = [];
  (function walk(nodes) {
    for (const n of nodes) {
      for (const k in (n.set || {})) if (!KNOWN.has(k)) strays.push(`${n.id}.${k}`);
      if (n.then) walk(n.then);
    }
  })(R.TREE);
  ok('no node emits a directive nobody reads', strays.length === 0, strays.join(', '));

  // ...and every advisory the tree can ask for has a case to raise.
  const asks = [];
  (function walk(nodes) {
    for (const n of nodes) {
      if (n.set && n.set.advise) asks.push(n.set.advise);
      if (n.then) walk(n.then);
    }
  })(R.TREE);
  const orphan = asks.filter(a => !ADV.CASE_KEYS.includes(a));
  ok('every advisory the tree asks for has a case', orphan.length === 0, orphan.join(', '));
  ok('the tree can ask for several different ones', new Set(asks).size >= 4);
}

// ── the picture ──────────────────────────────────────────────────────
console.log('\n— the sweep —');
{
  baseline();
  const s = SW.sweep(true);
  ok('the sweep returns a picture', s && Array.isArray(s.rows));
  ok('every row is classified', s.rows.every(r => Object.values(SW.CLASS).includes(r.cls)));
  ok('rows come back nearest first',
    s.rows.every((r, i) => i === 0 || r.d >= s.rows[i - 1].d));
  ok('the aggregates agree with the rows', s.threatCount === s.hostiles.length);
  ok('pressing is a subset of the threat count', s.pressingCount <= s.threatCount);
  ok('nothing hostile means no time to contact',
    s.threatCount > 0 || s.timeToContact === Infinity);
  ok('it says something out loud', typeof SW.sweepLine(s) === 'string' && SW.sweepLine(s).length > 10);

  const again = SW.sweep();
  ok('a second ask inside the interval is the same object', again === s);
  S.time += SWEEP.interval * 2;
  ok('...and a later one is not', SW.sweep() !== s);

  SW.resetSweep();
  ok('reset drops the cache', SW.sweep() !== s);
}

// ── the installations ────────────────────────────────────────────────
console.log('\n— arrays out —');
{
  baseline();
  S.fit = { weapon: [], utility: ['solararray', 'solararray'], core: [] };
  ok('arrays are counted off the fit', H.arrays() === 2);

  S.player.throttle = 0.6;
  ok('it refuses to deploy under way', H.deployPanels() === false);

  S.player.throttle = 0;
  ok('and agrees once stopped', H.deployPanels() === true);
  ok('the bar starts at zero', H.panelPct() === 0);
  ok('the bar reads to two places', /^\d+\.\d\d%$/.test(H.panelPctText()), H.panelPctText());

  H.updateHabitat(0.2);
  ok('the bar moves', H.panelPct() > 0 && H.panelPct() < 100);
  ok('...and the drive is locked the moment it does', H.throttleLocked() === true);
  ok('the warp core refuses with a reason', typeof H.warpBlocked() === 'string');

  // The lock is enforced, not advertised: something writes throttle anyway, and the next
  // tick puts it back. This is the assertion that stops the mechanic being cosmetic.
  S.player.throttle = 0.8;
  H.updateHabitat(0.2);
  ok('a direct write to the throttle is undone', S.player.throttle === 0);

  const before = H.panelPct();
  for (let t = 0; t < HABITAT.deploySeconds + 2; t += 0.5) H.updateHabitat(0.5);
  ok('it reaches full deployment', H.panelPct() === 100 && H.panelState() === 'deployed');
  ok('it took real time to get there', before < 100);

  S.player.energy = S.stats.energyCap * 0.5;
  const e0 = S.player.energy;
  H.updateHabitat(1);
  ok('deployed arrays charge the bank', S.player.energy > e0);
  ok('the report says what they are making', H.habitatReport().output > 0);

  // Stowing is faster than deploying, and the trade only works if it is not instant.
  const stowTicks = (() => {
    H.stowPanels();
    let n = 0;
    while (H.panelPct() > 0 && n < 2000) { H.updateHabitat(0.1); n++; }
    return n;
  })();
  ok('it stows all the way home', H.panelPct() === 0 && H.panelState() === 'stowed');
  ok('stowing is quicker than deploying', stowTicks * 0.1 < HABITAT.deploySeconds);
  ok('...but not instant', stowTicks * 0.1 > HABITAT.deploySeconds * 0.4);
  ok('the drive is released', H.throttleLocked() === false && H.warpBlocked() === null);

  // A fit that loses its arrays mid-deployment must not leave the ship pinned by hardware
  // it no longer carries.
  H.deployPanels();
  H.updateHabitat(1);
  S.fit = { weapon: [], utility: [], core: [] };
  for (let t = 0; t < 40; t += 0.5) H.updateHabitat(0.5);
  ok('losing the arrays retracts them', H.panelPct() === 0 && H.throttleLocked() === false);
}

console.log('\n— the farm —');
{
  baseline();
  S.fit = { weapon: [], utility: ['hydrobed', 'hydrobed'], core: [] };
  ok('beds are counted off the fit', H.beds() === 2);

  S.crew = S.crew || [];
  if (!S.crew.length) S.crew.push({ name: 'Ades', morale: 1, post: 'engineer' });

  addMaterial(WATER, 200);
  const food0 = held(FOOD);
  for (let t = 0; t < 300; t++) H.updateHabitat(0.5);

  ok('the farm grows into the material stock', held(FOOD) > food0,
    `${food0} -> ${held(FOOD)}`);
  ok('...and the report agrees it has grown something', H.habitatReport().grown > 0);
  ok('the farm drinks', held(WATER) < 200);
  ok('a running farm is not dry or browned out',
    H.habitatReport().dry === false && H.habitatReport().brownout === false);

  // Two beds against one mouth: the net is what says whether this ship can stay out.
  ok('net production is reported', typeof H.habitatReport().net === 'number');
  ok('two beds outgrow one crewman', H.habitatReport().selfSufficient === true);

  const dry = (() => { const w = held(WATER); return w; })();
  ok('water is drawn from the same stock everything else uses', dry >= 0);

  // The low-stores threshold is one number, and all three readers use it.
  S.habitat.farm.days = HABITAT.warnDays - 1;
  ok('a thin galley reads low', H.storesLow() === true);
  ok('...and the fact agrees', F.read('farm.low') === 1);
  ok('...and the line says so', /days of stores/.test(H.habitatLine()));
  S.habitat.farm.days = HABITAT.warnDays + 10;
  ok('a full galley does not', H.storesLow() === false && F.read('farm.low') === 0);

  // A ship with nobody aboard is never hungry.
  const crew = S.crew; S.crew = [];
  S.habitat.farm.days = 0;
  ok('an empty ship is never low on stores', H.storesLow() === false);
  S.crew = crew;
}

console.log('\n— the galley counter —');
{
  baseline();
  S.docked = null;
  ok('you cannot buy stores in open space', H.buyStores(10) === 0);

  S.docked = { name: 'Test Berth', type: 'depot' };
  const c0 = S.credits, f0 = held(FOOD);
  const got = H.buyStores(20);
  ok('a berth sells provisions', got > 0 && held(FOOD) > f0);
  ok('...and charges for them', S.credits < c0);
  ok('the quote matches what was charged', c0 - S.credits === H.storeQuote(got));

  S.credits = 1;
  ok('an empty account buys nothing', H.buyStores(50) === 0);
  S.credits = 40000;

  const room = HABITAT.storeCap - held(FOOD);
  H.buyStores(room + 500);
  ok('the galley does not overfill', held(FOOD) <= HABITAT.storeCap + 0.001);
  S.docked = null;
}

// ── save and restore ─────────────────────────────────────────────────
console.log('\n— it survives a save —');
{
  baseline();
  S.fit = { weapon: [], utility: ['solararray'], core: [] };
  H.deployPanels();
  H.updateHabitat(3);
  const mid = H.panelPct();
  const blob = JSON.parse(JSON.stringify(H.serializeHabitat()));

  H.resetHabitat();
  ok('reset clears it', H.panelPct() === 0 && H.panelState() === 'stowed');

  H.restoreHabitat(blob);
  ok('a save written mid-deployment comes back mid-deployment',
    Math.abs(H.panelPct() - mid) < 0.001 && H.panelState() === 'deploying');
  ok('...and the lock comes back with it', H.throttleLocked() === true);

  // Never restore into a state the machine cannot leave.
  H.restoreHabitat({ panels: { state: 'banana', pct: 40 }, farm: {} });
  ok('an unknown state restores as stowed', H.panelState() === 'stowed');
  ok('restore refuses nothing gracefully', H.restoreHabitat(null) === false);
}

// ── the advisor ──────────────────────────────────────────────────────
console.log('\n— raising a case —');
{
  baseline();
  ok('every case has the parts a panel needs',
    ADV.CASE_KEYS.every(k => {
      const c = ADV.CASES[k];
      return c.title && c.urgency && c.kind && typeof c.make === 'function';
    }));
  ok('every case can build its body',
    ADV.CASE_KEYS.every(k => typeof ADV.CASES[k].make() === 'string'));

  const a = ADV.raise('sensors', [{ key: 'sensor.tier', op: '==', want: 0, got: 0 }]);
  ok('a case is raised', a && a.key === 'sensors');
  ok('...and carries its evidence', a.evidence.length === 1 && a.evidence[0].fact === 'sensor.tier');
  ok('...and offers something to buy', Array.isArray(a.options));
  ok('...and says whether we can afford it',
    a.options.every(o => typeof o.afford === 'boolean'));
  ok('options come cheapest first',
    a.options.every((o, i) => i === 0 || o.price >= a.options[i - 1].price));
  ok('it is filed for the panel', ADV.advisories()[0] === a);

  ok('the same case does not repeat immediately', ADV.raise('sensors') === null);
  ok('a different one still gets through', ADV.raise('cargo') !== null);
  S.time += ADVISOR.cooldown + 1;
  ok('...and it comes back after the cooldown', ADV.raise('sensors') !== null);

  ok('an unknown case is refused', ADV.canRaise('nonsense') === false);

  S.settings.advisories = false;
  S.time += ADVISOR.cooldown + 1;
  ok('the player can turn the channel off', ADV.raise('power') === null);
  S.settings.advisories = true;

  // The file is bounded, or a long session grows a list nobody ever reads to the end of.
  for (let i = 0; i < ADVISOR.keep + 6; i++) {
    S.time += ADVISOR.cooldown + 1;
    ADV.raise(ADV.CASE_KEYS[i % ADV.CASE_KEYS.length]);
  }
  ok('the file is bounded', ADV.advisories().length <= ADVISOR.keep,
    String(ADV.advisories().length));

  ADV.resetAdvisor();
  ok('reset empties it', ADV.advisorReport().filed === 0);
  ok('...and forgets the cooldowns', ADV.canRaise('sensors') === true);
}

console.log(`\n${pass} passed, ${fail} problems`);
process.exit(fail ? 1 : 0);
