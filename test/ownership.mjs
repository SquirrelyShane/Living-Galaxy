// Slice — whose hull is that, how far can you see it, and can you shoot it.
//
// Three changes that arrived together in v1.02.57 and are tested together because they are
// one decision: hulls have owners, the sensor that shows them is bought rather than free,
// and a round hits whatever it hits. Each one is only safe because of the other two — free
// fire without ownership is a screen you cannot read before pulling the trigger, and
// ownership on a sensor that reaches a quarter of the system is a list nobody scrolls.

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
const P = await imp('systems/combat/projectiles.js');
const { initCombat, damageNpc } = await imp('systems/combat/combat.js');
const { initMining } = await imp('systems/industry/mining.js');
const { initWorldSim } = await imp('systems/platform/worldsim.js');
const { initMarket } = await imp('systems/trade/market.js');
const { initContracts } = await imp('systems/trade/contracts.js');
const { resetReputation, standing, blocOf } = await imp('systems/company/reputation.js');
const { createCharacter } = await imp('systems/crew/character.js');
const O = await imp('systems/company/ownership.js');
const C = await imp('systems/flight/contacts.js');
const { SCAN, SHIP_CLASSES, REP } = await imp('core/config.js');
const { POWERS } = await imp('data/factions.js');

initScene(); recalcStats(); seedWorld(9001); createSystem(); createAsteroids();
P.initProjectiles(); initCombat(); initMining(); initPlayerFx(); createNpcs();
resetReputation(); initWorldSim(); initMarket(); initContracts();
createCharacter({ name: 'Ward', lineage: 'rim', corp: 'kestrel', career: 'pathfinder' });
updateSystem(1);
S.running = true;

const anyNpc = f => S.world.npcs.find(n => n.userData.faction === f && n.userData.hp > 0);

// ── the array is bought, not free ────────────────────────────────────
console.log('\n— how far the sensor reaches —');
{
  S.fit = {};
  recalcStats();
  const bare = S.stats.sensor;
  const rated = S.stats.sensorRated;
  ok('the hull still reports what it is rated for', rated === SHIP_CLASSES[S.player.classKey].sensor,
     `${rated}`);
  ok('an empty sensor bay does not reach the rated figure', bare < rated, `${Math.round(bare)} / ${rated}`);
  ok('...but is well clear of the floor', bare > SCAN.reachFloor, `${Math.round(bare)}`);
  // Within a few percent rather than exact: a pilot's lineage and employer carry small
  // `sensorMult` bonuses, and those are supposed to apply on top of the tier scaling rather
  // than being flattened by it.
  ok('tier 0 is what a bare hull gets, give or take the pilot',
     Math.abs(bare - rated * SCAN.tierReach[0]) / rated < 0.06,
     `${Math.round(bare)} vs ${Math.round(rated * SCAN.tierReach[0])}`);

  // The whole point: a sensor module has to be visible on the instruments.
  S.stats.scanTier = 0;
  const before = S.stats.sensor;
  S.fit = { core: ['sensorcore'] };
  recalcStats();
  ok('fitting a sensor core raises the scanner tier', (S.stats.scanTier || 0) >= 1,
     String(S.stats.scanTier));
  ok('and visibly extends the array', S.stats.sensor > before * 1.3,
     `${Math.round(before)} → ${Math.round(S.stats.sensor)}`);
  ok('the reach table is monotonic',
     SCAN.tierReach.every((v, i) => i === 0 || v > SCAN.tierReach[i - 1]));
  ok('and never reaches zero', SCAN.tierReach[0] > 0 && SCAN.reachFloor > 0);

  S.fit = {};
  recalcStats();
}

// ── ownership is derived and stable ──────────────────────────────────
console.log('\n— whose hull is that —');
{
  const npc = anyNpc('worker') || anyNpc('friendly');
  ok('there is a hull to ask about', !!npc);
  const own = O.ownerOfHull(npc);
  ok('it has an operator', own.kind === O.OWN.CORP, own.kind);
  ok('the operator is a real power', !!POWERS[own.key], String(own.key));
  ok('and it is named for the screen', !!own.label, String(own.label));
  ok('asking twice gives the same answer', O.ownerOfHull(npc).key === own.key);

  // A hostile flies for an Outer power and never for the Coalition — the bloc decides the
  // pool, which is the property that stops a Coalition Patrol working for pirates.
  const raider = anyNpc('hostile');
  if (raider) {
    const rop = O.operatorFor(raider.userData);
    ok('a raider flies for its own bloc', POWERS[rop] && POWERS[rop].bloc === blocOf('hostile'),
       `${rop} → ${rop && POWERS[rop].bloc}`);
  } else ok('a raider flies for its own bloc', true, 'no raider in this seed');

  const patrol = anyNpc('friendly');
  if (patrol) {
    const pop = O.operatorFor(patrol.userData);
    ok('a patrol flies for the Coalition', POWERS[pop] && POWERS[pop].bloc === 'coalition',
       `${pop} → ${pop && POWERS[pop].bloc}`);
  } else ok('a patrol flies for the Coalition', true, 'no patrol in this seed');

  ok('a rock has no owner', O.ownerOfHull(S.world.asteroids[0]).kind === O.OWN.NONE);
  ok('nothing at all has no owner', O.ownerOfHull(null).kind === O.OWN.NONE);
}

// ── the contact list carries it ──────────────────────────────────────
console.log('\n— the list can say so —');
{
  const npc = anyNpc('hostile') || anyNpc('worker');
  S.player.position.copy(npc.position).add(new THREE.Vector3(200, 0, 0));
  C.resetContacts();
  const list = C.contacts(true);
  const row = list.find(c => c.obj === npc);
  ok('the hull is in range', !!row, String(list.length));
  ok('and the row names its operator', !!row && !!row.owner, row && row.owner);
  ok('and carries a colour the renderers share', !!row && !!row.ownColour);
  ok('owned contacts can be listed on their own', C.ownedContacts().length > 0,
     String(C.ownedContacts().length));
}

// ── free fire ────────────────────────────────────────────────────────
console.log('\n— a round hits what it hits —');
{
  // A neutral worker. Before v1.02.57 a player round passed straight through one.
  const worker = anyNpc('worker');
  ok('there is a neutral hull to shoot at', !!worker);
  if (worker) {
    const bloc = blocOf(worker.userData.faction);
    const repBefore = standing(bloc);
    const hpBefore = worker.userData.hp;

    S.player.position.copy(worker.position).add(new THREE.Vector3(0, 0, 260));
    const dir = new THREE.Vector3().copy(worker.position).sub(S.player.position).normalize();
    P.fire(S.player.position.clone(), dir, 900, 12, 'player', 0xffffff);
    for (let i = 0; i < 30 && worker.userData.hp === hpBefore; i++) P.updateProjectiles(0.02);

    ok('a player round damages a neutral hull', worker.userData.hp < hpBefore,
       `${hpBefore} → ${worker.userData.hp}`);
    ok('the hull is marked as provoked', worker.userData.provoked === true);
    ok('and it costs standing with their bloc', standing(bloc) < repBefore,
       `${repBefore} → ${standing(bloc)}`);
    ok('the charge is the configured one',
       Math.abs((repBefore - standing(bloc)) - REP.unprovokedFire) < REP.unprovokedFire,
       `${repBefore - standing(bloc)} vs ${REP.unprovokedFire}`);

    // Charged once per hull, not once per round — the reason it is charged in `damageNpc`
    // and gated on `provoked` rather than counted per pellet.
    const repAfterFirst = standing(bloc);
    const hp2 = worker.userData.hp;
    P.fire(S.player.position.clone(), dir, 900, 12, 'player', 0xffffff);
    for (let i = 0; i < 30 && worker.userData.hp === hp2; i++) P.updateProjectiles(0.02);
    ok('the second round still lands', worker.userData.hp < hp2);
    ok('but is not charged again', standing(bloc) === repAfterFirst,
       `${repAfterFirst} → ${standing(bloc)}`);
  }

  // A hostile is free. Shooting a raider was never an offence and must not become one.
  const raider = anyNpc('hostile');
  if (raider) {
    raider.userData.ambush = false;
    const bloc = blocOf('hostile');
    const before = standing(bloc);
    ok('a hostile is not innocent', O.isInnocent(raider.userData) === false);
    const hp = raider.userData.hp;
    S.player.position.copy(raider.position).add(new THREE.Vector3(0, 0, 240));
    const dir = new THREE.Vector3().copy(raider.position).sub(S.player.position).normalize();
    P.fire(S.player.position.clone(), dir, 900, 9, 'player', 0xffffff);
    for (let i = 0; i < 30 && raider.userData.hp === hp; i++) P.updateProjectiles(0.02);
    ok('and shooting one still lands', raider.userData.hp < hp);
    ok('with no standing penalty for it', standing(bloc) >= before);
  }
}

// ── remote pilots are reachable ──────────────────────────────────────
console.log('\n— and so is another pilot —');
{
  // The two ports that carry it, exercised without a link. See the note in
  // `combat/projectiles.js` for why this is registration rather than an import.
  const at = new THREE.Vector3(4000, 0, 4000);
  let told = null;
  P.registerRemoteTargets(() => [{ id: 7, position: at }]);
  P.registerRemoteHit((id, dmg, dtype) => { told = { id, dmg, dtype }; });

  S.player.position.copy(at).add(new THREE.Vector3(0, 0, 300));
  const dir = new THREE.Vector3().copy(at).sub(S.player.position).normalize();
  P.fire(S.player.position.clone(), dir, 900, 14, 'player', 0xffffff);
  for (let i = 0; i < 40 && !told; i++) P.updateProjectiles(0.02);

  ok('a round on another pilot is reported', !!told, JSON.stringify(told));
  ok('to the right pilot', told && told.id === 7);
  ok('with the damage it carried', told && told.dmg === 14, told && String(told.dmg));

  // Unregistered, remote fire simply does not resolve — a headless run and a solo flight.
  P.registerRemoteTargets(null);
  P.registerRemoteHit(null);
  told = null;
  P.fire(S.player.position.clone(), dir, 900, 14, 'player', 0xffffff);
  for (let i = 0; i < 40; i++) P.updateProjectiles(0.02);
  ok('and nothing is reported when nobody is listening', told === null);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
