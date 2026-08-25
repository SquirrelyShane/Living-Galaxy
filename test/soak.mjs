// Soak — a long session, compressed. The 60-second endurance run in run.mjs proves the
// simulation does not throw. This proves it does not *grow*.
//
// Those are different failures and they fail differently. A crash announces itself; a leak
// is invisible for an hour and then the phone is warm, the frame rate has halved, and
// nobody can say when it started. Every system added since slice 1 keeps a list of
// something — interpolation entries, contract boards, NPC ghosts, decoy buoys, captured
// faults, price books — and the question this file asks of each of them is: after two
// simulated hours of continuous play, is it the same size as it was after two minutes?
//
// Compressed rather than real-time: the fixed step means N steps of simulation are N steps
// whether they take an hour or a minute, so this runs ~2 hours of game time in seconds.
// What it cannot catch is anything that depends on real elapsed time — which is why the
// wall-clock parts of the audio and quality systems are exercised separately.

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
const { DIAG, POP } = await imp('core/config.js');
const { diagnostics } = await imp('core/diagnostics.js');
const { initScene } = await imp('world/scene.js');
const { createSystem, updateSystem } = await imp('world/system.js');
const { createAsteroids, updateAsteroids } = await imp('world/asteroids.js');
const { initPlayerFx, updatePlayer } = await imp('entities/player.js');
const { createNpcs, updateNpcs } = await imp('entities/npcs.js');
<<<<<<< HEAD
const { initProjectiles, updateProjectiles, activeProjectiles } = await imp('systems/combat/projectiles.js');
const { initCombat, updateCombat } = await imp('systems/combat/combat.js');
const { updateWeapons } = await imp('systems/combat/weapons.js');
const { initMining, updateMining } = await imp('systems/industry/mining.js');
const { initWorldSim, updateWorldSim } = await imp('systems/platform/worldsim.js');
const { initMarket, updateMarket, bookFor } = await imp('systems/trade/market.js');
const { initContracts, updateContracts, boardFor, activeContracts } = await imp('systems/trade/contracts.js');
const { resetReputation, standing } = await imp('systems/company/reputation.js');
const { initCrew, updateCrew } = await imp('systems/crew/crew.js');
const { createCharacter, skill } = await imp('systems/crew/character.js');
const { beginAgentChain, updateMissions } = await imp('systems/trade/missions.js');
const { updateScan } = await imp('systems/industry/scanner.js');
const { updateWarp } = await imp('systems/flight/warp.js');
const { updateTargeting } = await imp('systems/flight/targeting.js');
const { updateDocking } = await imp('systems/trade/economy.js');
const { trackedCount, commitStep } = await imp('world/interpolate.js');
const { lodCount, updateLod } = await imp('world/lod.js');
const { updateQuality } = await imp('world/quality.js');
const { updateAudio } = await imp('systems/platform/audio.js');
const hud = await imp('ui/hud.js');
const save = await imp('systems/platform/save.js');
=======
const { initProjectiles, updateProjectiles, activeProjectiles } = await imp('systems/projectiles.js');
const { initCombat, updateCombat } = await imp('systems/combat.js');
const { updateWeapons } = await imp('systems/weapons.js');
const { initMining, updateMining } = await imp('systems/mining.js');
const { initWorldSim, updateWorldSim } = await imp('systems/worldsim.js');
const { initMarket, updateMarket, bookFor } = await imp('systems/market.js');
const { initContracts, updateContracts, boardFor, activeContracts } = await imp('systems/contracts.js');
const { resetReputation, standing } = await imp('systems/reputation.js');
const { initCrew, updateCrew } = await imp('systems/crew.js');
const { createCharacter, skill } = await imp('systems/character.js');
const { beginAgentChain, updateMissions } = await imp('systems/missions.js');
const { updateScan } = await imp('systems/scanner.js');
const { updateWarp } = await imp('systems/warp.js');
const { updateTargeting } = await imp('systems/targeting.js');
const { updateDocking } = await imp('systems/economy.js');
const { trackedCount, commitStep } = await imp('world/interpolate.js');
const { lodCount, updateLod } = await imp('world/lod.js');
const { updateQuality } = await imp('systems/quality.js');
const { updateAudio } = await imp('systems/audio.js');
const hud = await imp('ui/hud.js');
const save = await imp('systems/save.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

initScene(); recalcStats(); seedWorld(1337); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx(); createNpcs();
resetReputation(); initWorldSim(); initMarket(); initContracts(); initCrew();
<<<<<<< HEAD
createCharacter({ name: 'Soak', lineage: 'belter', corp: 'freewake', career: 'prospector' });
=======
createCharacter({ name: 'Soak', lineage: 'belter', corp: 'meridian-collective', career: 'prospector' });
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
beginAgentChain();
hud.initHud();
S.running = true;

const DT = 1 / 60;

/**
 * One full frame — every phase main.js runs, in the order it runs them. Running a subset
 * would soak a game that does not exist.
 */
function frame() {
  S.time += DT; S.playtime += DT;
  updateWarp(DT); updatePlayer(DT); updateWeapons(DT); updateMining(DT);
  updateSystem(DT); updateAsteroids(DT); updateNpcs(DT);
  updateProjectiles(DT); updateCombat(DT);
  updateWorldSim(DT); updateMarket(DT); updateCrew(DT);
  updateMissions(); updateContracts(DT); updateScan(DT);
  updateDocking(); updateTargeting();
  commitStep();
  updateQuality(DT); updateLod(800); updateAudio(DT);
  hud.updateHud(DT);
}

/** Fly a while, doing the sorts of things a pilot does. */
function play(seconds, opts = {}) {
  const n = Math.round(seconds * 60);
  for (let i = 0; i < n; i++) {
    // Wander, shoot, and occasionally take damage, so the systems that only grow under
    // load actually get some.
    S.player.throttle = Math.sin(S.time * 0.03) * 0.8;
    S.input.firing = opts.firing !== false && (Math.floor(S.time) % 7 < 2);
    S.input.mining = opts.mining !== false && (Math.floor(S.time) % 11 < 3);
    if (i % 900 === 0) S.player.lastHit = S.time;
    if (i % 1800 === 0) { S.player.hull = S.stats.hullMax; S.player.shield = S.stats.shieldMax; }
    S.player.energy = S.stats.energyCap;
    frame();
  }
  S.input.firing = false; S.input.mining = false;
}

const sample = () => ({
  npcs: S.world.npcs.length,
  projectiles: activeProjectiles(),
  decoys: S.world.decoys.length,
  interp: trackedCount(),
  lod: lodCount(),
  faults: diagnostics().log.length,
  boards: Object.keys(S.contracts.boards).length,
  offers: Object.values(S.contracts.boards).reduce((a, b) => a + b.length, 0),
  active: activeContracts().length,
  sites: S.sim.sites.length,
  claims: S.sim.claims.length,
  scans: Object.keys(S.scans || {}).length,
  loot: S.world.loot.length,
  crew: (S.crew || []).length,
  beams: (S.sim.beams || []).length
});

const fmt = o => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(' ');

// ── warm up, then measure ────────────────────────────────────────────
console.log('\n— soak —');
console.log('  warming up (2 min of game time)…');
play(120);
const early = sample();
console.log('  ' + fmt(early));

console.log('  soaking (60 min of game time)…');
const t0 = Date.now();
play(3600);
const mid = sample();
console.log('  ' + fmt(mid));

console.log('  soaking (60 more)…');
play(3600);
const late = sample();
console.log(`  ${fmt(late)}`);
console.log(`  2 hours of game time in ${((Date.now() - t0) / 1000).toFixed(1)}s wall clock`);

// ── the lists must not grow ──────────────────────────────────────────
console.log('\n— bounded lists —');

const bounded = (name, key, ceiling) =>
  ok(`${name} stays bounded`, late[key] <= ceiling,
     `${early[key]} → ${mid[key]} → ${late[key]}, ceiling ${ceiling}`);

bounded('the NPC roster', 'npcs', POP.bounds.pirate[1] + POP.bounds.drone[1] +
        POP.bounds.patrol[1] + POP.bounds.miner[1] + POP.bounds.merc[1] +
        POP.bounds.builderC[1] + POP.bounds.builderP[1] + POP.bounds.command[1] + 4);
bounded('the projectile pool', 'projectiles', 420);
bounded('decoy buoys', 'decoys', 8);
bounded('the fault log', 'faults', DIAG.maxLog);
bounded('contract boards', 'boards', S.world.stations.length + 1);
bounded('posted offers', 'offers', S.world.stations.length * 8);
bounded('accepted contracts', 'active', 3);
bounded('construction sites', 'sites', 12);
bounded('territory claims', 'claims', 8);
bounded('loot drops', 'loot', 200);
bounded('mining beams', 'beams', 64);

// The interpolation registry is the one most likely to leak: it is fed on every NPC
// spawn and drained only on despawn, and there have been two despawn paths since 0.5.
ok('the interpolation registry tracks the roster, not the history',
   late.interp <= late.npcs + 8,
   `${late.interp} entries for ${late.npcs} ships (was ${early.interp}/${early.npcs})`);
ok('the interpolation registry did not grow with the session',
   late.interp <= Math.max(early.interp, mid.interp) + 8,
   `${early.interp} → ${mid.interp} → ${late.interp}`);

// LOD is registered at world build and never during play, so any growth at all is a bug.
ok('the LOD registry is fixed at world build', late.lod === early.lod,
   `${early.lod} → ${late.lod}`);
ok('crew does not multiply', late.crew === early.crew, `${early.crew} → ${late.crew}`);

// ── nothing has gone numerically wrong ───────────────────────────────
console.log('\n— numerical health —');
const finite = v => Number.isFinite(v);
ok('the player position is finite',
   finite(S.player.position.x) && finite(S.player.position.y) && finite(S.player.position.z),
   `${S.player.position.x}`);
ok('the player velocity is finite', finite(S.player.velocity.x));
ok('speed is within the cap', S.player.velocity.length() <= S.stats.maxSpeed * 1.3,
   S.player.velocity.length().toFixed(2));
ok('every NPC position is finite',
   S.world.npcs.every(n => finite(n.position.x) && finite(n.position.y) && finite(n.position.z)));
ok('no NPC has negative health', S.world.npcs.every(n => n.userData.hp > 0));
ok('credits are finite and non-negative', finite(S.credits) && S.credits >= 0, String(S.credits));
ok('cargo never goes negative',
   S.cargo.ore >= 0 && S.cargo.salvage >= 0 && S.cargo.data >= 0);
ok('cargo never exceeds the hold',
   S.cargo.ore + S.cargo.salvage + S.cargo.data <= S.stats.cargoCap * 1.01,
   `${(S.cargo.ore + S.cargo.salvage + S.cargo.data).toFixed(0)} of ${S.stats.cargoCap}`);
ok('hull stays inside its bounds',
   S.player.hull >= 0 && S.player.hull <= S.stats.hullMax + 1e-6);
ok('standing stays inside its bounds',
   ['coalition', 'pirate', 'independent'].every(f => standing(f) >= -100 && standing(f) <= 100),
   ['coalition', 'pirate', 'independent'].map(f => `${f}:${standing(f)}`).join(' '));
ok('skills stay inside their bounds',
   ['gunnery', 'extraction', 'commerce'].every(k => skill(k) >= 0 && skill(k) <= 10));
ok('playtime accumulated', S.playtime > 7000, S.playtime.toFixed(0));

// prices must stay sane — a market with a runaway feedback loop is a slow-motion crash
{
  let worst = 0, lowest = Infinity;
  for (const st of S.world.stations) {
    const b = bookFor(st);
    for (const k of ['ore', 'salvage', 'data']) {
      const p = b.prices[k];
      if (!finite(p)) worst = Infinity;
      worst = Math.max(worst, p);
      lowest = Math.min(lowest, p);
    }
  }
  ok('prices stay finite', finite(worst), String(worst));
  ok('prices do not run away', worst < 100000, worst.toFixed(0));
  ok('prices do not collapse to zero', lowest >= 1, lowest.toFixed(2));
}
{
  let ok2 = true;
  for (const st of S.world.stations) {
    const b = bookFor(st);
    for (const k of ['ore', 'salvage', 'data']) {
      const v = b.stock[k];
      if (!finite(v) || v < 0 || v > (b.capacity || 12000) + 1) ok2 = false;
    }
  }
  ok('station stockpiles stay inside their bounds', ok2);
}

// ── no faults, and the loop is still cheap ───────────────────────────
console.log('\n— quiet running —');
{
  const diag = diagnostics();
  ok('nothing threw during the soak', diag.log.length === 0,
     diag.log.slice(0, 3).map(e => `${e.where}: ${e.message}`).join(' · '));
  ok('no phase was parked', diag.parked.length === 0, diag.parked.join(','));
}
{
  hud.resetHudStats();
  play(30);
  const h = hud.hudStats();
  ok('the HUD write budget holds after two hours', h.perFrame < 4,
     `${h.perFrame} writes/frame, ${Math.round(h.hitRate * 100)}% skipped`);
}

// ── and it still saves ───────────────────────────────────────────────
console.log('\n— persistence after a long session —');
{
  save.wipeSave();
  const text = save.exportSave();
  ok('a two-hour flight exports', typeof text === 'string' && text.length > 200);
  // The payload has to stay small enough for a phone's localStorage, which is where the
  // belt-as-deltas and claims-as-places decisions earn their keep.
  ok('the save stays small', text.length < 400000, `${Math.round(text.length / 1024)} kB`);

  const credits = S.credits;
  save.saveGame(true);
  S.credits = 0;
  ok('it reloads', save.loadGame() === true);
  ok('and it is the same flight', S.credits === credits);
  save.wipeSave();
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
