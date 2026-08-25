// Slice — the sensor picture, and the hull ARIA can fly.
//
// The bug this suite is written against: the nav chart plotted rocks out to full sensor
// range and the contact list refused to carry them past 900 units, so the field on the map
// had nothing lockable in it. That is not a bug you can catch by reading either file —
// each one was internally consistent — so the assertions here are all of the form "these
// two surfaces agree", which is the only shape that would have caught it.

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
const { createAsteroids, updateAsteroids, clutterReport } = await imp('world/asteroids.js');
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
const C = await imp('systems/flight/contacts.js');
const { generateSystem } = await imp('world/genesis.js');
const { APPROACH } = await imp('core/config.js');
const { updateApproach } = await imp('systems/flight/approach.js');
const tools = await imp('systems/platform/tools.js');
const { registerScreen, resetScreens } = await imp('core/screens.js');

initScene(); recalcStats(); seedWorld(4242); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx(); createNpcs();
resetReputation(); initWorldSim(); initMarket(); initContracts();
createCharacter({ name: 'Kestrel', lineage: 'rim', corp: 'kestrel', career: 'pathfinder' });
updateSystem(1);
S.running = true;

/** Park the ship in the middle of the first heliocentric belt. */
function intoTheBelt() {
  const belt = (S.world.belts || []).find(b => !b.parentName);
  const mid = belt.inner + belt.width * 0.5;
  S.player.position.set(mid, 0, 0);
  S.player.velocity.set(0, 0, 0);
  updateAsteroids(0.016);
  C.resetContacts();
  return belt;
}

// ── the two surfaces agree ───────────────────────────────────────────
console.log('\n— what the sensor can see —');
{
  const belt = intoTheBelt();
  const list = C.contacts(true);
  ok('the belt exists to fly into', !!belt, belt && belt.name);

  const rocks = list.filter(c => c.kind === 'asteroid');
  ok('sitting in a field puts rock on the contact list', rocks.length > 0, String(rocks.length));

  // The regression itself: nothing may be filtered at a range tighter than the sensor.
  const far = rocks.filter(r => r.d > 900);
  ok('rocks beyond 900 units are contacts too — the old cap is gone',
     far.length > 0, `${far.length} of ${rocks.length} past 900`);

  const sensor = S.stats.sensor;
  ok('and nothing is listed beyond the array',
     rocks.every(r => r.d <= sensor + 1), String(sensor));

  // What the chart draws for the same eye. The chart's own filter is `ore > 0` inside
  // sensor range, so every rock it would plot has to be reachable from this list.
  const plotted = S.world.asteroids.filter(a =>
    a.ore > 0 && a.position.distanceTo(S.player.position) <= sensor);
  const listed = new Set(rocks.map(r => r.obj));
  const nearest = plotted
    .map(a => ({ a, d: a.position.distanceTo(S.player.position) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, C.ROCK_CAP);
  ok('every rock the chart plots nearest-first is on the list',
     nearest.every(x => listed.has(x.a)), `${nearest.length} checked`);

  ok('the list is sorted by range', list.every((c, i) => i === 0 || c.d >= list[i - 1].d));
  ok('the rock budget is respected', rocks.length <= C.ROCK_CAP, String(rocks.length));
}

// ── mineable is a different question from near ───────────────────────
console.log('\n— mineable rock —');
{
  intoTheBelt();
  const mineable = C.mineableContacts();
  ok('there is something to cut', mineable.length > 0, String(mineable.length));
  ok('everything offered still has ore', mineable.every(m => m.ore > 0));
  ok('the nearest mineable is the first of them',
     C.nearestMineable() === mineable[0]);

  // Empty the nearest rock and it must stop being offered — but stay a contact.
  const first = C.nearestMineable();
  first.obj.ore = 0;
  C.resetContacts();
  const after = C.mineableContacts();
  ok('a worked-out rock drops off the mineable list',
     !after.some(m => m.obj === first.obj));
  ok('but is still a contact', C.contacts().some(c => c.obj === first.obj));
  first.obj.ore = first.obj.oreMax;
  C.resetContacts();
}

// ── the clutter tier is scenery and nothing else ─────────────────────
console.log('\n— the clutter tier —');
{
  intoTheBelt();
  const before = S.world.asteroids.length;
  updateAsteroids(0.016);
  const rep = clutterReport();
  ok('gravel is drawn inside a field', rep.drawn > 0, String(rep.drawn));
  ok('and it names the field it is in', !!rep.field, String(rep.field));
  ok('it adds no records to the world', S.world.asteroids.length === before);

  // Well outside every field.
  S.player.position.set(300, 0, 0);
  updateAsteroids(0.016);
  ok('and there is none in open space', clutterReport().drawn === 0);
}

// ── ARIA has hands ───────────────────────────────────────────────────
console.log('\n— the hull, from the assistant —');
{
  intoTheBelt();
  S.docked = null;
  S.warp.state = 'idle';

  const t = tools.callTool('throttle', ['15']);
  ok('a throttle order is obeyed exactly', Math.round(S.player.throttle * 100) === 15,
     String(S.player.throttle));
  ok('and it says what it did', /15/.test(t.text));

  tools.callTool('throttle', ['400']);
  ok('an absurd throttle is clamped, not refused', S.player.throttle === 1);

  tools.callTool('allStop', []);
  ok('all stop closes the throttle', S.player.throttle === 0);
  ok('and drops the autopilot', !S.approach && !S.orbit && !S.follow);

  // The compound. The chart port is registered here rather than mocked away, because
  // "the chart opens on the rock it chose" is half of what the tool is for.
  let opened = null;
  resetScreens();
  registerScreen('navmap', opts => { opened = opts; });

  const r = tools.callTool('mineRun', []);
  ok('the mining run reports a rock', r.ok === true && !!r.data && !!r.data.name, r.text);
  ok('it locked that rock', !!S.target && S.target.kind === 'asteroid');
  ok('it asked for the chart', !!opened);
  ok('filtered to fields', opened && opened.only === 'belt');
  ok('and centred on the same rock it locked',
     opened && opened.focus && opened.focus.obj === S.target.obj);

  ok('an approach is running', !!S.approach && S.approach.active === true);
  ok('at crawl power', S.approach && S.approach.power === APPROACH.crawlPower);
  ok('which is inside the 5–10% a slow approach means',
     APPROACH.crawlPower >= 0.05 && APPROACH.crawlPower <= 0.10,
     String(APPROACH.crawlPower));

  // Fly it. The throttle must never exceed the ceiling that was asked for.
  let peak = 0;
  for (let i = 0; i < 240; i++) {
    updateApproach(0.05);
    peak = Math.max(peak, S.player.throttle);
    if (!S.approach) break;
  }
  ok('the autopilot honours the power ceiling', peak <= APPROACH.crawlPower + 1e-6,
     peak.toFixed(3));
  ok('and it is well under the ordinary cap', peak < APPROACH.powerCap);
}

// ── the matcher reaches all of it without a model ────────────────────
console.log('\n— said out loud —');
{
  const m = q => (tools.matchTool(q) || {}).tool;
  ok('"warp to the closest asteroid" is a mining run', m('warp to the closest asteroid') === 'mineRun',
     String(m('warp to the closest asteroid')));
  ok('so is "take us to the nearest rock"', m('take us to the nearest rock') === 'mineRun',
     String(m('take us to the nearest rock')));
  ok('"throttle to 15" sets the throttle', m('throttle to 15') === 'throttle');
  ok('"all stop" stops', m('all stop') === 'allStop');
  ok('"warp to Exchange Nexus" is still a course', m('warp to Exchange Nexus') === 'warpTo',
     String(m('warp to Exchange Nexus')));
  ok('"where is the belt" is still the belt', m('where is the belt') === 'findBelt',
     String(m('where is the belt')));
  ok('every new tool is in the manifest',
     ['throttle', 'allStop', 'warpTo', 'approachNamed', 'mineRun']
       .every(k => tools.TOOL_KEYS.includes(k)));
}

// ── a berth on every field ───────────────────────────────────────────
console.log('\n— berths on the belts —');
{
  let checked = 0, withBerth = 0, sorted = true;
  for (let seed = 1; seed <= 24; seed++) {
    const plan = generateSystem(seed * 7919);
    for (const belt of plan.belts) {
      checked++;
      if (plan.stations.some(st => st.belt === belt.key)) withBerth++;
    }
    sorted = sorted && plan.stations.every((s, i) => i === 0 || s.orbit >= plan.stations[i - 1].orbit);
  }
  ok('appending berths leaves the roster sorted by orbit in every system', sorted);
  ok('every field in every system has a berth on it', withBerth === checked,
     `${withBerth}/${checked}`);

  const plan = generateSystem(20260824);
  const berths = plan.stations.filter(s => s.belt);
  ok('a berth is named after the field it works',
     berths.every(b => {
       const belt = plan.belts.find(x => x.key === b.belt);
       return belt && b.name.split(' ')[0] === belt.name.split(' ')[0];
     }), berths.map(b => b.name).join(', '));
  ok('and it sits inside that field',
     berths.every(b => {
       const belt = plan.belts.find(x => x.key === b.belt);
       return b.orbit >= belt.inner && b.orbit <= belt.inner + belt.width;
     }));
  ok('an ice field gets a store, not a smelter',
     berths.every(b => {
       const belt = plan.belts.find(x => x.key === b.belt);
       return (belt.mix.volatiles || 0) > 25 ? b.type === 'depot'
                                             : b.type === 'refinery' || b.type === 'foundry';
     }));
  ok('the same seed places the same berths',
     JSON.stringify(generateSystem(20260824).stations) === JSON.stringify(plan.stations));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
