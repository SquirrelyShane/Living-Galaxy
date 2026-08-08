// Slice 4 — the living world. Reputation as a matrix rather than three counters,
// detection as a contest you can influence, population as an outcome rather than a
// constant, and a world that survives being saved.
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
const { seedWorld, stream } = await imp('core/rng.js');
const { REP, DETECT, POP, SIM } = await imp('core/config.js');
const { SCHEMA } = await imp('core/version.js');
const rep = await imp('systems/reputation.js');
const det = await imp('systems/detection.js');
const { initScene } = await imp('world/scene.js');
const { createSystem, updateSystem } = await imp('world/system.js');
const { createAsteroids, mineAsteroid, nearestAsteroid, serializeBelt, restoreBelt } = await imp('world/asteroids.js');
const { initPlayerFx } = await imp('entities/player.js');
const { createNpcs, updateNpcs, spawnNpc, populationTargets } = await imp('entities/npcs.js');
const { initProjectiles } = await imp('systems/projectiles.js');
const { initCombat, damageNpc } = await imp('systems/combat.js');
const { initMining } = await imp('systems/mining.js');
const { initWorldSim, updateWorldSim, deliverToSite, inClaimedSpace,
        serializeSim, restoreSim } = await imp('systems/worldsim.js');
const { initMarket } = await imp('systems/market.js');
const { dock } = await imp('systems/economy.js');
const save = await imp('systems/save.js');

initScene(); recalcStats(); seedWorld(1337); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx(); createNpcs();
rep.resetReputation(); initWorldSim(); initMarket();
S.running = true;
updateSystem(1);

const V = THREE.Vector3;
const p = S.player;

// ── reputation ───────────────────────────────────────────────────────
console.log('\n— reputation —');
rep.resetReputation();
ok('three blocs exist', rep.FACTIONS.length === 3);
ok('starting standing comes from config',
   rep.standing('coalition') === REP.start.coalition && rep.standing('pirate') === REP.start.pirate);
ok('NPC faction tags map onto blocs',
   rep.blocOf('friendly') === 'coalition' && rep.blocOf('hostile') === 'pirate' &&
   rep.blocOf('worker') === 'independent');
ok('an unknown tag resolves rather than throwing', rep.blocOf('nobody') === 'independent');

// the matrix is the whole point: you cannot please everyone
{
  rep.resetReputation();
  const c0 = rep.standing('coalition'), p0 = rep.standing('pirate');
  rep.adjust('coalition', 20);
  ok('helping a bloc raises its standing', rep.standing('coalition') > c0);
  ok('helping a bloc costs you with its enemy', rep.standing('pirate') < p0,
     `${p0} → ${rep.standing('pirate')}`);
  ok('the cost is proportional, not total',
     Math.abs(rep.standing('pirate') - p0) < 20,
     String(Math.abs(rep.standing('pirate') - p0)));
}
{
  // there is no sequence of moves that maxes out two opposed blocs
  rep.resetReputation();
  for (let i = 0; i < 40; i++) { rep.adjust('coalition', 25); rep.adjust('pirate', 25); }
  ok('opposed blocs cannot both be maxed',
     !(rep.standing('coalition') >= REP.max && rep.standing('pirate') >= REP.max),
     `coalition ${rep.standing('coalition')}, pirate ${rep.standing('pirate')}`);
}
{
  rep.resetReputation();
  for (let i = 0; i < 200; i++) rep.adjust('coalition', 50);
  ok('standing is clamped at the ceiling', rep.standing('coalition') === REP.max);
  for (let i = 0; i < 400; i++) rep.adjust('coalition', -50);
  ok('standing is clamped at the floor', rep.standing('coalition') === REP.min);
}

// bands
ok('every standing resolves to a band',
   [-100, -70, -35, -10, 0, 10, 35, 70, 100].every(v => typeof rep.standingLabel(v) === 'string'));
ok('the ceiling and floor read differently',
   rep.standingLabel(REP.max) !== rep.standingLabel(REP.min));
ok('bands are ordered high to low', REP.bands.every((b, i, a) => i === 0 || a[i - 1].min > b.min));

// consequences
{
  rep.resetReputation();
  S.reputation.coalition = REP.max;
  ok('a friendly bloc pays better bounties', rep.bountyScale('coalition') > 1,
     rep.bountyScale('coalition').toFixed(2));
  ok('a friendly bloc trades better', rep.tradeScale('coalition') > 1);
  ok('a friendly bloc is not hostile', !rep.isHostileTo('coalition'));
  ok('a friendly bloc allows docking', rep.dockingAllowed('coalition'));

  S.reputation.coalition = REP.min;
  ok('a hated bloc opens fire', rep.isHostileTo('coalition'));
  ok('a hated bloc refuses the pad', !rep.dockingAllowed('coalition'));
  ok('a hated bloc pays no bonus', rep.bountyScale('coalition') === 1);
  ok('a hated bloc charges more', rep.tradeScale('coalition') < 1);

  S.reputation.coalition = 0;
  ok('neutral standing is neither hostile nor barred',
     !rep.isHostileTo('coalition') && rep.dockingAllowed('coalition'));
}

// docking is really gated, not just reported
{
  rep.resetReputation();
  S.reputation.coalition = REP.min;
  S.docked = null;
  const st = S.world.stations[1];
  p.position.copy(st.position); p.position.x += 100;
  p.velocity.set(0, 0, 0);
  ok('a wanted pilot is refused the pad', dock(st) === false && S.docked === null);
  S.reputation.coalition = 20;
  ok('a tolerated pilot is let in', dock(st) === true);
  S.docked = null;
  rep.resetReputation();
}

// kills move standing in the right direction
{
  rep.resetReputation();
  const c0 = rep.standing('coalition');
  rep.creditKill('hostile');
  ok('killing a pirate improves Coalition standing', rep.standing('coalition') > c0,
     `${c0} → ${rep.standing('coalition')}`);
  const c1 = rep.standing('coalition');
  rep.creditKill('friendly');
  ok('killing a patrol costs Coalition standing', rep.standing('coalition') < c1,
     `${c1} → ${rep.standing('coalition')}`);
  const i0 = rep.standing('independent');
  rep.creditKill('worker');
  ok('killing an unarmed worker costs you with independents', rep.standing('independent') < i0,
     `${i0} → ${rep.standing('independent')}`);
  rep.resetReputation();
}

// the report the UI reads
{
  const r = rep.reputationReport();
  ok('the report covers every bloc', r.length === rep.FACTIONS.length);
  ok('the report carries labels and flags',
     r.every(x => typeof x.label === 'string' && typeof x.hostile === 'boolean'));
}

// ── detection ────────────────────────────────────────────────────────
console.log('\n— detection —');
{
  const quiet = () => {
    p.throttle = 0; p.lastShot = -999;
    S.warp.state = 'idle';
    S.cargo.ore = 0; S.cargo.salvage = 0; S.cargo.data = 0;
    recalcStats();
    return det.playerSignature();
  };

  const base = quiet();
  ok('a coasting hull has a modest signature', base > 0 && base < 2, base.toFixed(2));

  p.throttle = 1;
  const burning = det.playerSignature();
  ok('burning hard is louder than coasting', burning > base,
     `${base.toFixed(2)} → ${burning.toFixed(2)}`);

  quiet();
  p.lastShot = S.time;
  ok('shooting is louder than coasting', det.playerSignature() > base);

  quiet();
  S.warp.state = 'warping';
  ok('a warp bubble is louder than coasting', det.playerSignature() > base);
  S.warp.state = 'idle';

  quiet();
  S.cargo.ore = S.stats.cargoCap * 0.9;
  ok('a full hold is louder than an empty one', det.playerSignature() > base,
     `${base.toFixed(2)} → ${det.playerSignature().toFixed(2)}`);
  S.cargo.ore = 0; recalcStats();

  quiet();
  ok('signature never falls below the floor', det.playerSignature() >= DETECT.silentFloor);
  p.throttle = 1; p.lastShot = S.time; S.warp.state = 'warping';
  const loud = det.playerSignature();
  S.warp.state = 'idle'; quiet();
  ok('the loudest state is much louder than the quietest', loud > base * 2,
     `${base.toFixed(2)} vs ${loud.toFixed(2)}`);

  // the thing that actually matters: how you fly changes how close you can get
  const sensor = 1500;
  ok('a quiet ship is seen later than a loud one',
     det.detectionRange(sensor, base) < det.detectionRange(sensor, loud));
  ok('an ambusher commits later than it detects',
     det.ambushRange(sensor, base) < det.detectionRange(sensor, base));
  ok('detection scales linearly with signature',
     Math.abs(det.detectionRange(sensor, 2) - det.detectionRange(sensor, 1) * 2) < 1e-9);
  ok('playerDetected agrees with detectionRange',
     det.playerDetected(sensor, det.detectionRange(sensor, base) - 1, base) &&
     !det.playerDetected(sensor, det.detectionRange(sensor, base) + 1, base));
  ok('signature has a readable label', typeof det.signatureLabel(base) === 'string');
  ok('quiet and loud read differently', det.signatureLabel(0.4) !== det.signatureLabel(3));
}

// ── population pressure ──────────────────────────────────────────────
console.log('\n— population —');
{
  const t = populationTargets();
  ok('targets are produced for every managed type',
     ['pirate', 'drone', 'patrol', 'miner', 'merc'].every(k => typeof t.want[k] === 'number'));
  ok('every target respects its bounds',
     Object.keys(t.want).every(k => !POP.bounds[k] ||
       (t.want[k] >= POP.bounds[k][0] && t.want[k] <= POP.bounds[k][1])),
     JSON.stringify(t.want));

  const total = Object.values(t.want).reduce((a, b) => a + b, 0);
  ok('the resting roster is close to the old fixed one', total > 50 && total < 80, String(total));

  // pressure actually responds
  const before = populationTargets().want.patrol;
  const raiders = [];
  for (let i = 0; i < 6; i++) raiders.push(spawnNpc('pirate'));
  const after = populationTargets().want.patrol;
  ok('more raiders draw more patrols', after >= before, `${before} → ${after}`);
  for (const r of raiders) {
    const i = S.world.npcs.indexOf(r);
    if (i >= 0) S.world.npcs.splice(i, 1);
  }

  // a bastion claim raises the raider ceiling
  const noClaim = populationTargets().want.pirate;
  const fakeFort = spawnNpc('fort');
  S.sim.claims.push({ fort: fakeFort, r: SIM.claimR });
  const withClaim = populationTargets().want.pirate;
  ok('a standing bastion supports more raiders', withClaim >= noClaim,
     `${noClaim} → ${withClaim}`);
  ok('claimed space is detected', inClaimedSpace(fakeFort.position));
  ok('space away from a claim is clear', !inClaimedSpace(new V(0, 0, 50000)));
  S.sim.claims.length = 0;
  const fi = S.world.npcs.indexOf(fakeFort);
  if (fi >= 0) S.world.npcs.splice(fi, 1);
}

// ── belt persistence ─────────────────────────────────────────────────
console.log('\n— belt state —');
{
  ok('an untouched belt serialises to nothing', serializeBelt().length === 0,
     String(serializeBelt().length));

  const rock = nearestAsteroid(new V(0, 0, 0), 1e9);
  const before = rock.ore;
  mineAsteroid(rock, Math.min(200, before));
  ok('mining lowers the rock', rock.ore < before);

  const blob = serializeBelt();
  ok('only worked rocks are stored', blob.length > 0 && blob.length < S.world.asteroids.length,
     `${blob.length} of ${S.world.asteroids.length}`);

  const mined = rock.ore;
  rock.ore = rock.oreMax;
  restoreBelt(blob);
  ok('restoring puts the depletion back', Math.abs(rock.ore - mined) < 1, `${rock.ore} vs ${mined}`);

  ok('a stale index is ignored rather than throwing',
     restoreBelt([[999999, 10]]) === 0);
  ok('junk is ignored', restoreBelt(null) === 0 && restoreBelt('nope') === 0);

  restoreBelt(blob.map(([i]) => [i, S.world.asteroids[i].oreMax]));
}

// ── world persistence ────────────────────────────────────────────────
console.log('\n— world persistence —');
ok('the schema is at or past the one that added persistence', SCHEMA >= 4);
{
  const blob = serializeSim();
  ok('sites are serialised', Array.isArray(blob.sites));
  ok('unfinished sites are captured', blob.sites.length > 0, `${blob.sites.length} sites`);
  ok('a site carries its progress',
     blob.sites.every(s => typeof s.progress === 'number' && typeof s.orbitR === 'number'));

  // advance one site, round-trip, confirm it comes back advanced
  const site = S.sim.sites.find(s => !s.done);
  deliverToSite(site, site.need * 0.5);
  const advanced = serializeSim();
  const progress = advanced.sites.find(s => s.kind === site.kind).progress;
  ok('progress survives serialisation', progress >= site.need * 0.5, String(progress));

  restoreSim(advanced);
  const back = S.sim.sites.find(s => s.kind === site.kind && !s.done);
  ok('a restored site keeps its progress', back && Math.abs(back.progress - progress) < 1,
     back ? String(back.progress) : 'missing');
  ok('restoring does not duplicate sites', S.sim.sites.length === advanced.sites.length,
     `${S.sim.sites.length} vs ${advanced.sites.length}`);

  // claims round-trip as places, and respawn their bastion
  const fort = spawnNpc('fort');
  fort.position.set(1000, 0, 26000);
  S.sim.claims.push({ fort, r: SIM.claimR });
  const withClaim = serializeSim();
  ok('a claim is stored as a place, not a reference',
     withClaim.claims.length === 1 && typeof withClaim.claims[0].x === 'number');
  restoreSim(withClaim);
  ok('a restored claim has a live bastion',
     S.sim.claims.length === 1 && S.world.npcs.indexOf(S.sim.claims[0].fort) >= 0);
  ok('the restored bastion is in the right place',
     S.sim.claims[0].fort.position.distanceTo(new V(1000, 0, 26000)) < 1);
  ok('the restored claim still claims', inClaimedSpace(new V(1000, 0, 26000)));

  restoreSim({ sites: [], claims: [], built: [] });
  ok('an empty world restores cleanly', S.sim.sites.length === 0 && S.sim.claims.length === 0);
  ok('restoring nothing is refused, not guessed', restoreSim(null) === false);
}

// ── the save round-trip ──────────────────────────────────────────────
console.log('\n— save round-trip —');
{
  save.wipeSave();
  initWorldSim();              // the previous block deliberately emptied the world
  rep.resetReputation();
  S.reputation.coalition = 55;
  S.reputation.pirate = -80;
  const rock = nearestAsteroid(new V(0, 0, 0), 1e9);
  mineAsteroid(rock, 150);
  const oreLeft = rock.ore;
  deliverToSite(S.sim.sites[0], 30);

  const snap = save.snapshot();
  ok('the snapshot carries the current schema', snap.v === SCHEMA);
  ok('the snapshot carries reputation', snap.reputation.coalition === 55);
  ok('the snapshot carries the sim', !!snap.sim && Array.isArray(snap.sim.sites));
  ok('the snapshot carries belt deltas', Array.isArray(snap.belt) && snap.belt.length > 0);

  save.saveGame(true);
  S.reputation.coalition = 0;
  S.reputation.pirate = 0;
  rock.ore = rock.oreMax;
  ok('the flight reloads', save.loadGame() === true);
  ok('reputation is restored', rep.standing('coalition') === 55 && rep.standing('pirate') === -80);
  ok('belt depletion is restored', Math.abs(rock.ore - oreLeft) < 1,
     `${rock.ore} vs ${oreLeft}`);
  ok('restored reputation is clamped to the legal range',
     rep.FACTIONS.every(f => rep.standing(f) >= REP.min && rep.standing(f) <= REP.max));

  // a v3 save — everything before this patch — must still load
  const legacy = JSON.parse(JSON.stringify(snap));
  delete legacy.reputation; delete legacy.sim; delete legacy.belt;
  legacy.v = 3;
  const migrated = save.migrate(legacy);
  ok('a v3 save migrates all the way forward', migrated && migrated.v === SCHEMA);
  ok('a migrated save gets the default standings',
     migrated.reputation.coalition === REP.start.coalition);
  ok('a migrated save has no world of its own', migrated.sim === null && migrated.belt === null);

  save.wipeSave();
  rep.resetReputation();
}

// ── determinism ──────────────────────────────────────────────────────
console.log('\n— streams —');
{
  seedWorld(1337);
  const a = stream('worldsim').next();
  seedWorld(1337);
  stream('population').next(); stream('population').next();
  ok('worldsim draws are not disturbed by population draws', stream('worldsim').next() === a);
  seedWorld(4242);
  ok('a different seed gives a different world sim', stream('worldsim').next() !== a);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
