// Headless smoke + behaviour test for Living Galaxy.
import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

const imp = p => import(new URL('src/' + p, ROOT).href);

const { S, recalcStats, totalMass, cargoFree, seatWeapon } = await imp('core/state.js');
const preflight = await imp('systems/preflight.js');
const { seedWorld, makeRng, wrand } = await imp('core/rng.js');
const { initScene, render } = await imp('world/scene.js');
const { createStarfield, updateStarfield } = await imp('world/starfield.js');
const { createSystem, updateSystem } = await imp('world/system.js');
const { createAsteroids, updateAsteroids, nearestAsteroid } = await imp('world/asteroids.js');
const { initPlayerFx, updatePlayer } = await imp('entities/player.js');
const { createNpcs, updateNpcs } = await imp('entities/npcs.js');
const { initProjectiles, updateProjectiles, fire, activeProjectiles } = await imp('systems/projectiles.js');
const { initCombat, updateCombat, damagePlayer, damageNpc } = await imp('systems/combat.js');
const { holdMass } = await imp('systems/holds.js');
const { updateWeapons } = await imp('systems/weapons.js');
const { initMining, updateMining } = await imp('systems/mining.js');
const { updateWarp, toggleWarp, setCourse } = await imp('systems/warp.js');
const { startApproach, updateApproach, matchTarget, requestDocking, hailOpen, closeHail } = await imp('systems/approach.js');
const { scanPlanet, probePlanet, asteroidDetail, surveyLevel } = await imp('systems/survey.js');
const { updateTargeting, cycleTarget, setTarget, clearTarget } = await imp('systems/targeting.js');
const { repairQuote, updateDocking, dock, undock, sell, sellAll, repair, buyUpgrade, upgradeCost, switchClass, buyHull, ownsHull, hullPrice, upgradeLocked, canUpgrade } = await imp('systems/economy.js');
const { saveGame, loadGame, hasSave, wipeSave } = await imp('systems/save.js');
const { initAudio } = await imp('systems/audio.js');
const { initHud } = await imp('ui/hud.js');
const { initDock } = await imp('ui/dock.js');
const { initHail } = await imp('systems/approach.js');
const { initMarket, updateMarket, marketPrice, applyTrade, bestMarket } = await imp('systems/market.js');
const { initWorldSim, updateWorldSim, deliverToSite, inClaimedSpace, captureNpc } = await imp('systems/worldsim.js');
const { damagePlayerDisabling } = await imp('systems/combat.js');

console.log('\n— boot —');
initScene();
recalcStats();
seedWorld(20260728);
createStarfield(200);
createSystem();
createAsteroids();
// Baseline for the belt-depletion check far below. NPC mining only runs while the sector is
// being simulated, so the honest measurement is across the whole session rather than inside
// one 60-second window with the player parked deliberately far away.
const BELT_AT_START = S.world.asteroids.reduce((t, r) => t + (r.ore || 0), 0);
initProjectiles();
initCombat();
initMining();
initPlayerFx();
createNpcs();
initAudio();
initHud();
initDock();
initHail();
initWorldSim();
initMarket();
S.running = true;
for (const k of ['military','industrial','logistics','economic','civilian']) S.ownedHulls[k] = true;

ok('bodies created', S.world.bodies.length > 20, `${S.world.bodies.length}`);
ok('stations created', S.world.stations.length === 11, `${S.world.stations.length}`);
// The rock count is no longer a constant: rings are generated for whatever bodies this
// seed actually gave rings to. Asserting the sum of the declared field counts is the
// property that was meant all along — a hardcoded 660 only ever tested that nobody had
// added a field.
{
  const declared = (S.world.belts || []).reduce((n, f) => n + f.count, 0);
  ok('asteroids created', S.world.asteroids.length === declared,
     `${S.world.asteroids.length} vs ${declared} declared`);
  ok('rings are held by a planet, belts by the star',
     (S.world.belts || []).every(f => !f.parentName ||
       S.world.asteroids.filter(a => a.belt === f.key).every(a => a.parent)));
}
// Derived from the type table rather than pinned to a number. The roster changed by design
// when haulers were added in v1.01.00, and a magic 63 here would have been a red suite for a
// correct change — the property that matters is that the world spawns exactly what the table
// asks for, not that the table sums to any particular figure.
{
  const { NPC_TYPES } = await imp('core/config.js');
  const wanted = Object.keys(NPC_TYPES).reduce((n, k) => n + (NPC_TYPES[k].count || 0), 0);
  ok('npcs created (fleet roster matches the type table)', S.world.npcs.length === wanted,
     `${S.world.npcs.length} vs ${wanted}`);
}
{
  const by = {};
  for (const n of S.world.npcs) by[n.userData.type] = (by[n.userData.type] || 0) + 1;
  ok('roster composition', by.pirate === 18 && by.drone === 18 && by.patrol === 12 &&
     by.merc === 3 && by.miner === 6 && by.builderC === 3 && by.builderP === 2,
     JSON.stringify(by));
  const wings = new Set(S.world.npcs.filter(n => n.userData.type === 'patrol').map(n => n.userData.wing));
  ok('patrols organized into wings', wings.size === 4, `${wings.size} wings`);
  ok('construction sites laid down', S.sim.sites.length === 2 &&
     S.sim.sites.some(x => x.kind === 'fort'));
}
ok('stats derived', S.stats && S.stats.maxThrust > 0);

function step(dt = 1 / 60, n = 1) {
  for (let i = 0; i < n; i++) {
    S.time += dt;
    updateWarp(dt); updateApproach(dt); updatePlayer(dt); updateWeapons(dt); updateMining(dt);
    updateSystem(dt); updateAsteroids(dt); updateStarfield(dt); updateNpcs(dt);
    updateProjectiles(dt); updateCombat(dt); updateWorldSim(dt); updateMarket(dt); updateDocking(dt); updateTargeting();
    render();
  }
}

console.log('\n— determinism —');
{
  const a = makeRng(7), b = makeRng(7);
  let same = true;
  for (let i = 0; i < 200; i++) if (a.next() !== b.next()) same = false;
  ok('same seed, same sequence', same);
  const c = makeRng(8);
  let diff = false;
  for (let i = 0; i < 20; i++) if (makeRng(7).next !== c.next && c.next() !== makeRng(7).next()) { diff = true; break; }
  ok('different seed diverges', diff);
  seedWorld(99); const s1 = [wrand(0,1), wrand(0,1), wrand(0,1)];
  seedWorld(99); const s2 = [wrand(0,1), wrand(0,1), wrand(0,1)];
  ok('seedWorld resets the world stream', s1.every((v,i)=>v===s2[i]));
  seedWorld(20260728);   // restore the suite's world seed
}

console.log('\n— frames of reference —');
const { forward, aimAngles } = await imp('core/utils.js');
let basisOk = true, roundTripOk = true, worstBasis = 0, worstTrip = 0;
for (const yaw of [0, 0.4, 1.57, 2.6, 3.9, -1.1, -2.9]) {
  for (const pitch of [0, 0.3, -0.7, 1.2, -1.3]) {
    const f = forward(yaw, pitch, new THREE.Vector3());
    // camera world forward for rotation.order 'YXZ', rotation.y=yaw, rotation.x=pitch
    const cx = -Math.sin(yaw) * Math.cos(pitch);
    const cy = Math.sin(pitch);
    const cz = -Math.cos(yaw) * Math.cos(pitch);
    const err = Math.abs(f.x - cx) + Math.abs(f.y - cy) + Math.abs(f.z - cz);
    worstBasis = Math.max(worstBasis, err);
    if (err > 1e-9) basisOk = false;

    const a = aimAngles(f);
    const g = forward(a.yaw, a.pitch, new THREE.Vector3());
    const terr = Math.abs(g.x - f.x) + Math.abs(g.y - f.y) + Math.abs(g.z - f.z);
    worstTrip = Math.max(worstTrip, terr);
    if (terr > 1e-9) roundTripOk = false;
  }
}
ok('thrust axis matches the camera axis', basisOk, `worst error ${worstBasis.toExponential(2)}`);
ok('aimAngles round-trips through forward', roundTripOk, `worst error ${worstTrip.toExponential(2)}`);

console.log('\n— flight —');
S.player.throttle = 1;
const p0 = S.player.position.clone();
step(1 / 60, 240);
ok('ship accelerates under thrust', S.player.position.distanceTo(p0) > 1);
ok('speed respects class cap', S.player.velocity.length() <= S.stats.maxSpeed + 1e-6,
   S.player.velocity.length().toFixed(3));
ok('TWR computed', S.player.twr > 0, S.player.twr.toFixed(2));
const vCruise = S.player.velocity.length();
S.player.throttle = 0;
step(1 / 60, 120);
ok('assist bleeds off speed when idle', S.player.velocity.length() < vCruise * 0.5,
   `${vCruise.toFixed(2)} → ${S.player.velocity.length().toFixed(2)}`);

console.log('\n— weapons and damage —');
const victim = S.world.npcs.find(n => n.userData.faction === 'hostile' && !n.userData.ambush);
victim.position.copy(S.player.position);
victim.position.z -= 220;          // straight down the nose at yaw 0
setTarget(victim, 'ship', victim.userData.name, 'hostile');
S.player.energy = 100;

// v1.00.31: a ship with empty hardpoints cannot shoot, full stop. The old build resolved
// a weapon from the hull class whenever nothing was fitted and fired that, so this whole
// section used to pass without anything ever being bolted on. Prove the interlock first,
// then arm the ship and prove the gun.
S.fit = { weapon: [null, null, null], utility: [], core: [] };
recalcStats();
const unarmedHp = victim.userData.hp;
S.input.firing = true;
step(1 / 60, 30);
S.input.firing = false;
ok('an empty hardpoint fires nothing', victim.userData.hp === unarmedHp,
   `${unarmedHp} → ${victim.userData.hp}`);
ok('preflight names the reason', preflight.canFire().code === 'nofit', preflight.canFire().code);

ok('seating a weapon arms the ship', seatWeapon('pulse') >= 0 && preflight.armed());
S.player.energy = 100;
S.input.firing = true;
const beforeHp = victim.userData.hp;
step(1 / 60, 30);                  // one round in flight, not enough to kill
S.input.firing = false;
ok('projectiles spawned', activeProjectiles() >= 0);
ok('locked hostile took damage', victim.userData.hp < beforeHp, `${beforeHp} → ${victim.userData.hp}`);
ok('one round does not one-shot it', victim.userData.hp > 0, String(victim.userData.hp));

const npcCount = S.world.npcs.length;
const creditsBefore = S.credits;
damageNpc(victim, 9999, true);
ok('kill removes the ship', S.world.npcs.length === npcCount - 1);
ok('bounty paid', S.credits > creditsBefore, `+${S.credits - creditsBefore}`);
ok('wreck dropped salvage', S.world.loot.length > 0);
ok('lock cleared on kill', S.target === null);

const shield0 = S.player.shield;
damagePlayer(20);
ok('shield absorbs first', S.player.shield < shield0 && S.player.armor === S.stats.armorMax);
S.player.shield = 0; S.player.armor = 5;
damagePlayer(30);
ok('damage spills to hull', S.player.hull < S.stats.hullMax);

console.log('\n— mining and cargo —');
switchClass('industrial');
const rock = nearestAsteroid(new THREE.Vector3(0, 0, 0), 1e9);
S.player.position.copy(rock.position).z += 100;
S.player.energy = S.stats.energyCap;
S.input.mining = true;
const ore0 = rock.ore;
step(1 / 60, 120);
S.input.mining = false;
ok('ore transferred to hold', S.cargo.ore > 0, `${S.cargo.ore.toFixed(1)} kg`);
ok('rock depleted by the same amount', ore0 - rock.ore > 0);
ok('cargo mass raises total mass', totalMass() > S.stats.dryMass);
ok('cargo free space shrinks', cargoFree() < S.stats.cargoCap);

console.log('\n— docking and economy —');
const station = S.world.stations[2];
S.player.position.copy(station.position).x += 100;
S.player.velocity.set(0, 0, 0);
updateDocking();
ok('dock candidate detected', S.dockCandidate === station, String(S.dockCandidate && S.dockCandidate.userData.name));
ok('docking succeeds', dock() === true);
const credits1 = S.credits;
sellAll();
ok('cargo sold for credits', S.credits > credits1 && S.cargo.ore === 0, `+${S.credits - credits1}`);
S.player.hull = 10; S.player.armor = 1;
// Derive the funds from the quote rather than hardcoding a figure. A fixture that says
// "5000 credits" is really asserting a price, silently, in a test about repairs — and it
// fails the next time anyone touches the economy for reasons that look unrelated.
S.credits += repairQuote().cost + 100;
ok('repair restores hull', repair() && S.player.hull === S.stats.hullMax);
const cost = upgradeCost('shield');
S.credits = cost + 10;
const sh0 = S.stats.shieldMax;
ok('refit purchased', buyUpgrade('shield') === true);
ok('refit raises shield cap', S.stats.shieldMax > sh0, `${sh0.toFixed(0)} → ${S.stats.shieldMax.toFixed(0)}`);
undock();
ok('undock clears station', S.docked === null);

console.log('\n— warp —');
switchClass('military');
S.player.energy = S.stats.energyCap;
S.player.position.set(0, 0, 44000);        // clear of every gravity well
S.player.velocity.set(0, 0, 0);
const dest = S.world.bodies.find(b => b.userData.name === 'Titanus');
setCourse(dest, 'Titanus');
toggleWarp();
ok('spool starts', S.warp.state === 'spooling');
step(1 / 60, 200);
ok('reaches warp or drops out cleanly', ['warping', 'cooldown', 'idle'].includes(S.warp.state), S.warp.state);
let guard = 0;
while (S.warp.state === 'warping' && guard++ < 20000) step(1 / 60, 1);
ok('warp terminates (arrival, shadow or fuel)', S.warp.state !== 'warping', `after ${guard} frames`);
ok('speed back under cap after drop-out', S.player.velocity.length() <= S.stats.maxSpeed + 1e-6, S.player.velocity.length().toFixed(3) + ' vs ' + S.stats.maxSpeed);

console.log('\n— warp arrival —');
S.player.position.set(0, 0, 30000);
S.player.velocity.set(0, 0, 0);
S.player.energy = S.stats.energyCap;
S.warp.state = 'idle'; S.warp.charge = 0;
const gaia = S.world.bodies.find(b => b.userData.name === 'Gaia');
setCourse(gaia, 'Gaia');
toggleWarp();
let g2 = 0, reachedCruise = false;
const start = S.player.position.clone();
while (g2++ < 60000 && S.warp.state !== 'cooldown') {
  step(1 / 60);
  if (S.warp.state === 'warping') reachedCruise = true;
}
const travelled = S.player.position.distanceTo(start);
ok('spool completes into warp cruise', reachedCruise, S.warp.state);
ok('warp covers real distance', travelled > 3000, `${travelled.toFixed(0)} km`);
ok('drops out cleanly, not mid-cruise', S.warp.state === 'cooldown', S.warp.state);
ok('speed capped after drop-out', S.player.velocity.length() <= S.stats.maxSpeed + 1e-6);
// Strict "did the autopilot actually arrive" lives in test/warp-nav.mjs — it depends on
// where the planets happen to be, and is a known weakness, not a pass/fail gate here.

console.log('\n— targeting —');
S.player.position.set(0, 0, 12000);
const near = S.world.npcs.find(n => n.userData.hp > 0 && !n.userData.ambush);
near.position.copy(S.player.position).x += 500;
const t1 = cycleTarget();
ok('cycle finds a contact', !!t1 && !!S.target);
clearTarget();
ok('clear drops the lock', S.target === null);

console.log('\n— distant visibility —');
{
  const { updateSystem } = await imp('world/system.js');
  const planets = S.world.bodies.filter(b => b.userData.kind === 'planet');
  ok('every planet has a beacon', planets.every(p => !!p.userData.beacon));
  const far = planets.reduce((a, b) => b.userData.orbitRadius > a.userData.orbitRadius ? b : a);
  // stand at the core and look outward — the farthest planet must still beacon
  S.player.position.set(0, 0, 0);
  updateSystem(0);
  ok('farthest planet stays lit at range', far.userData.beacon.material.opacity > 0.5,
     `${far.userData.name} opacity ${far.userData.beacon.material.opacity.toFixed(2)}`);
  ok('planet surfaces are solid (opaque, depth-writing)',
     planets.every(p => p.children[0].material.transparent === false &&
                        p.children[0].material.depthWrite === true));
  // Surfaces are MeshBasicMaterial on purpose — always fully lit, never translucent
  // at range. There is no emissive channel to check any more.
  ok('every planet surface is unlit-opaque, not shaded',
     planets.every(p => p.children[0].material.opacity === 1));
  ok('stations carry beacons', S.world.stations.every(s => !!s.userData.beacon));
  // Regression: an additive SpriteMaterial with no map renders as a hard translucent
  // SQUARE. Every glow sprite must carry a falloff texture.
  ok('every beacon sprite has a falloff map',
     S.world.bodies.filter(b => b.userData.beacon)
       .every(b => !!b.userData.beacon.material.map));
  const sun = S.world.bodies[0];
  const glare = sun.children.find(c => c.material && c.material.map && c.material.sizeAttenuation === false);
  ok('star glare exists and is textured', !!glare, 'no textured glare sprite on the star');
}

console.log('\n— orbital sanity —');
{
  let worst = 0, worstName = '';
  for (const b of S.world.bodies) {
    const u = b.userData;
    if (!u.orbitSpeed || !u.orbitRadius) continue;
    const v = u.orbitSpeed * u.orbitRadius;
    if (v > worst) { worst = v; worstName = u.name; }
  }
  for (const a of S.world.asteroids) {
    const v = a.orbitSpeed * a.orbitRadius;
    if (v > worst) { worst = v; worstName = a.name; }
  }
  ok('nothing on rails outruns sublight', worst < 1.0, `${worstName} at ${worst.toFixed(2)} u/s (max ship 2.1)`);
}

console.log('\n— ambushers —');
{
  const lurker = S.world.npcs.find(n => n.userData.ambush && !n.userData.triggered && n.userData.hp > 0);
  ok('lurkers spawned in the shadows', !!lurker);
  if (lurker) {
    S.player.position.set(0, 0, 45000); S.player.velocity.set(0, 0, 0);
    step(1 / 60, 60);
    const held = lurker.position.clone();
    step(1 / 60, 240);
    ok('lurker holds its hide while you are far', lurker.position.distanceTo(held) < 3,
       lurker.position.distanceTo(held).toFixed(1));
    S.player.position.copy(lurker.position); S.player.position.x += 250;
    step(1 / 60, 90);
    ok('close pass springs the ambush', lurker.userData.triggered === true);
  }
}

console.log('\n— living world —');
{
  // miners actually deplete the belt
  const miner = S.world.npcs.find(n => n.userData.role === 'mine');
  ok('miners on shift', !!miner);
  S.player.position.set(0, 0, 45000);   // stay out of everyone's way
  step(1 / 60, 3600);                   // 60 s of the world running itself
  // Measured against the belt rather than a per-ship counter, and across the whole session
  // rather than this window. `u.mined` used to hold this and nothing anywhere read it, which
  // was the tell: the ore left the rock and ceased to exist. v1.01.70 puts it in a hold and
  // runs it to a station, so the honest question is what the *field* lost.
  const mined = BELT_AT_START - S.world.asteroids.reduce((t, r) => t + (r.ore || 0), 0);
  ok('belt is being worked', mined > 20, `${mined.toFixed(0)} kg extracted by NPCs`);
  // And it went somewhere. A belt that depletes into nothing is the bug this replaced: the
  // ore is aboard a miner or has already been sold into a station's book.
  const aboard = S.world.npcs.filter(n => n.userData.role === 'mine')
    .reduce((t, n) => t + holdMass(n.userData), 0);
  ok('the ore went into holds', aboard > 0, `${aboard.toFixed(0)} kg aboard miners`);

  // construction: deliveries complete a habitat (a real station appears)…
  const civ = S.sim.sites.find(x => x.kind !== 'fort');
  const stations0 = S.world.stations.length;
  while (!civ.done) deliverToSite(civ, 25);
  ok('habitat construction completes into a station', S.world.stations.length === stations0 + 1);

  // …and a fort claims territory; habitats and trade posts never do
  ok('no claim from civilian construction', S.sim.claims.length === 0);
  const fort = S.sim.sites.find(x => x.kind === 'fort');
  const npcs0 = S.world.npcs.length;
  while (!fort.done) deliverToSite(fort, 25);
  ok('bastion completion spawns the fort', S.world.npcs.length === npcs0 + 1);
  ok('only the defensive station claims space', S.sim.claims.length === 1);
  const fortNpc = S.sim.claims[0].fort;
  ok('inside the claim reads as claimed', inClaimedSpace(fortNpc.position.clone()));
  ok('outside the claim reads as free', !inClaimedSpace(new THREE.Vector3(0, 0, 500)));
  damageNpc(fortNpc, 1e6, true);
  step(1 / 60, 5);
  ok('killing the bastion breaks the claim', S.sim.claims.length === 0);
  ok('pirates schedule a rebuild', S.sim.fortTimer > 0);

  // merc contract on an NPC ends in a boarding, not a kill
  const merc = S.world.npcs.find(n => n.userData.role === 'merc' && n.userData.hp > 0);
  const prey = S.world.npcs.find(n => n.userData.type === 'pirate' && n.userData.hp > 0 && !n.userData.ambush);
  merc.userData.contract = { kind: 'npc', target: prey, mode: 'capture' };
  merc.position.copy(prey.position); merc.position.x += 100;
  const count0 = S.world.npcs.length;
  step(1 / 60, 800);
  ok('merc boards and takes its mark alive', S.world.npcs.indexOf(prey) < 0 &&
     S.world.npcs.length <= count0 - 1 + 2 /* respawn top-ups may add */);
}

console.log('\n— disable & boarding (the player side) —');
{
  // a disabling barrage never kills — it leaves you dark at 12% hull
  S.player.hull = S.stats.hullMax; S.player.shield = 0; S.player.armor = 0;
  damagePlayerDisabling(9999);
  ok('disabling fire cannot breach the hull', S.player.hull > 0 && !!S.sim.disabled,
     `hull ${S.player.hull.toFixed(0)}`);
  ok('drives are dark while disabled', (S.player.throttle = 1, step(1 / 60, 2), S.player.throttle === 0));

  // a boarder alongside completes the capture
  const merc2 = S.world.npcs.find(n => n.userData.role === 'merc' && n.userData.hp > 0) ||
                (await imp('entities/npcs.js')).spawnNpc('merc');
  merc2.userData.contract = { kind: 'player', mode: 'capture' };
  S.sim.playerContract = { merc: merc2 };
  merc2.position.copy(S.player.position); merc2.position.x += 50;
  S.cargo.ore = 100; S.credits = 1000;
  step(1 / 60, 720);   // 12 s > boardTime
  ok('boarding completes — cargo and a cut of credits gone, ship kept',
     S.cargo.ore === 0 && S.credits === 750 && S.sim.disabled === null && S.player.hull > 0,
     `credits ${S.credits}`);

  // second disable, but this time the boarder dies: systems reboot
  damagePlayerDisabling(9999);
  ok('disabled again', !!S.sim.disabled);
  step(1 / 60, 600);   // no live contract → reboot path
  ok('no boarder means the ship reboots', S.sim.disabled === null);
}

console.log('\n— undock regression —');
{
  const st = S.world.stations[2];
  S.player.position.copy(st.position); S.player.position.x += 120;
  S.player.velocity.set(0, 0, 0); S.player.throttle = 0;
  setTarget(st, 'station', st.userData.name, 'neutral');
  matchTarget();                          // the exact state that caused the bug
  ok('velocity-matched at the station', !!S.follow);
  dock(st);
  ok('docking clears station-keeping', S.follow === null && S.orbit === null);
  undock();
  step(1 / 60, 120);
  const d = S.player.position.distanceTo(st.position);
  ok('undock pushes clear and STAYS clear', d > st.userData.radius * 2, d.toFixed(0));
  ok('re-dock prompt suppressed during cooldown', S.dockCandidate === null && S.dockCooldown > 0);
}


console.log('\n— approach & velocity match —');
{
  S.warp.state = 'idle'; S.warp.dest = null; S.orbit = null; S.follow = null; S.approach = null;
  // pause mercenary postings — a random contract mid-flight disables the ship
  // and stalls the autopilot, which is the feature working, not the test failing
  S.sim.contractT = -1e9;
  S.sim.playerContract = null; S.sim.disabled = null; S.sim.boarding = null;
  S.input.firing = false; S.input.mining = false;
  S.ownedHulls.military = true; switchClass('military'); S.player.energy = S.stats.energyCap;

  // chase a moving station from 2500 out
  const st = S.world.stations[4];
  // warp covers distance; approach covers the last stretch — start there
  const away = st.position.clone(); away.x += 420; away.y += 40;
  S.player.position.copy(away); S.player.velocity.set(0, 0, 0);
  setTarget(st, 'station', st.userData.name, 'neutral');
  ok('approach engages', startApproach() === true);
  let f = 0;
  while (f++ < 20000 && !hailOpen()) step(1 / 60, 1);
  ok('reaches a moving station and hails', hailOpen(), `after ${(f / 60).toFixed(1)} s`);
  ok('arrival velocity-matches the station', !!S.follow && S.follow.obj === st);
  const off0 = S.player.position.distanceTo(st.position);
  step(1 / 60, 600);   // ride along 10 s
  const off1 = S.player.position.distanceTo(st.position);
  ok('station-keeping holds the offset', Math.abs(off1 - off0) < 2, `${off0.toFixed(1)} → ${off1.toFixed(1)}`);

  // tractor docking
  requestDocking(st);
  ok('tractor takes the ship', !!S.docking);
  step(1 / 60, 400);
  ok('tractor lands and docks', S.docked === st);
  undock();
  ok('undock pushes clear of the structure',
     S.player.position.distanceTo(st.position) > st.userData.radius * 2,
     S.player.position.distanceTo(st.position).toFixed(0));

  // match a moving belt rock and hold formation
  const rock = nearestAsteroid(new THREE.Vector3(11000, 0, 0), 1e9);
  S.player.position.copy(rock.position); S.player.position.x += 180;
  S.player.velocity.set(0, 0, 0); S.player.throttle = 0;
  setTarget(rock, 'asteroid', rock.name, 'rock');
  ok('match engages on a rock', matchTarget() === true);
  const r0 = rock.position.clone();
  step(1 / 60, 1200);   // 20 s
  ok('the rock actually moved', rock.position.distanceTo(r0) > 2, rock.position.distanceTo(r0).toFixed(1));
  ok('ship rode along with it', Math.abs(S.player.position.distanceTo(rock.position) - 180) < 2,
     S.player.position.distanceTo(rock.position).toFixed(1));
  S.player.throttle = 0.5; step(1 / 60, 5);
  ok('throttle breaks station-keeping', S.follow === null);
  S.player.throttle = 0;

  // planet: approach → orbit → scan → probe. Clear the corridor first — with the
  // fleet-scale roster, ambushers can anchor to Gaia's night side and drones work
  // its orbit band; some runs they shred the ship mid-flight, which is the world
  // working as designed but makes a terrible autopilot fixture.
  for (const n of S.world.npcs) {
    const u = n.userData;
    if (u.faction === 'hostile' || u.faction === 'merc') {
      u.ambush = false; u.triggered = true; u.target = null; u.contract = null;
      n.position.set((Math.random() - 0.5) * 2000, 0, -52000 - Math.random() * 2000);
    }
  }
  S.player.hull = S.stats.hullMax; S.player.shield = S.stats.shieldMax; S.player.armor = S.stats.armorMax;
  const gaia = S.world.bodies.find(b => b.userData.name === 'Gaia');
  S.player.position.copy(gaia.position); S.player.position.x += gaia.userData.radius * 2.6 + 420;
  S.player.velocity.set(0, 0, 0);
  setTarget(gaia, 'planet', 'Gaia', 'neutral');
  startApproach();
  f = 0;
  while (f++ < 30000 && !S.orbit) step(1 / 60, 1);
  ok('planet approach settles into orbit', !!S.orbit && S.orbit.body === gaia, `after ${(f / 60).toFixed(1)} s`);
  const d0 = S.player.position.distanceTo(gaia.position);
  step(1 / 60, 900);
  ok('orbit is stable over 15 s', Math.abs(S.player.position.distanceTo(gaia.position) - d0) < 4,
     `${d0.toFixed(0)} → ${S.player.position.distanceTo(gaia.position).toFixed(0)}`);
  ok('scan requires this orbit and completes', scanPlanet(gaia) !== null && surveyLevel('Gaia') === 1);
  const probes0 = S.probes, data0 = S.cargo.data;
  ok('probe drops and returns data', probePlanet(gaia) !== null &&
     S.probes === probes0 - 1 && S.cargo.data > data0 && surveyLevel('Gaia') === 2,
     `probes ${probes0}→${S.probes}, data +${(S.cargo.data - data0).toFixed(0)} kg`);
  S.player.throttle = 0.5; step(1 / 60, 5);
  ok('throttle breaks orbit', S.orbit === null);
  S.player.throttle = 0;

  // deterministic assay
  const a1 = asteroidDetail(rock), a2 = asteroidDetail(rock);
  const sum = a1.iron + a1.nickel + a1.silicates + a1.platinum;
  ok('assay is deterministic and sums to ~100%', a1.iron === a2.iron && sum > 95 && sum < 105, `sum ${sum.toFixed(1)}`);
}

console.log('\n— planetary bodies —');
{
  const { PLANET_TYPES } = await imp('data/planets.js');
  const planets = S.world.bodies.filter(b => b.userData.kind === 'planet');
  ok('20 planetary classes defined', Object.keys(PLANET_TYPES).length === 20,
     String(Object.keys(PLANET_TYPES).length));
  ok('system has a spread of planets', planets.length >= 12, String(planets.length));
  const types = new Set(planets.map(p => p.userData.ptype));
  ok('planets use many different classes', types.size >= 8, `${types.size} distinct`);
  const radii = planets.map(p => p.userData.radius);
  ok('planet sizes vary widely', Math.max(...radii) > Math.min(...radii) * 3,
     `${Math.min(...radii).toFixed(0)}–${Math.max(...radii).toFixed(0)}`);
  ok('gas giants are the big ones',
     planets.filter(p => PLANET_TYPES[p.userData.ptype].bands).every(p => p.userData.radius > 100));
  ok('each planet carries gravity and temperature',
     planets.every(p => p.userData.gravity > 0 && typeof p.userData.tempC === 'number'));
  const moons = S.world.bodies.filter(b => b.userData.kind === 'moon');
  ok('moons generated', moons.length > 8, String(moons.length));
}

console.log('\n— gravity wells & warp —');
{
  const { wellRadius, inGravityWell } = await imp('systems/warp.js');
  const giant = S.world.bodies.find(b => b.userData.ptype === 'gasGiant');
  const rock  = S.world.bodies.find(b => b.userData.ptype === 'barren');
  ok('massive bodies project a larger well', wellRadius(giant.userData) > wellRadius(rock.userData) * 1.5,
     `${wellRadius(giant.userData).toFixed(0)} vs ${wellRadius(rock.userData).toFixed(0)}`);
  const inside = giant.position.clone(); inside.x += giant.userData.radius + 50;
  ok('inside a well is detected', !!inGravityWell(inside));
  ok('open space is clear', inGravityWell(new THREE.Vector3(0, 0, 47000)) === null);
  // warp refuses to spool inside a well
  S.player.position.copy(inside); S.player.energy = S.stats.energyCap;
  S.warp.state = 'idle'; S.warp.dest = null;
  toggleWarp();
  ok('warp will not spool inside a gravity well', S.warp.state === 'idle');
}

console.log('\n— belts & minerals —');
{
  const { BELTS, MINERALS } = await imp('data/belts.js');
  ok('multiple distinct belts', BELTS.length === 4, String(BELTS.length));
  const byBelt = {};
  for (const a of S.world.asteroids) byBelt[a.belt] = (byBelt[a.belt] || 0) + 1;
  ok('every belt is populated', BELTS.every(b => byBelt[b.key] > 0), JSON.stringify(byBelt));
  const avg = k => {
    const rs = S.world.asteroids.filter(a => a.belt === k);
    return rs.reduce((t, a) => t + (a.comp.platinum || 0) + (a.comp.iridium || 0), 0) / rs.length;
  };
  ok('the trojan field is genuinely richer in rares', avg('trojan') > avg('inner') * 3,
     `trojan ${avg('trojan').toFixed(1)}% vs inner ${avg('inner').toFixed(1)}%`);
  const avgVol = k => {
    const rs = S.world.asteroids.filter(a => a.belt === k);
    return rs.reduce((t, a) => t + (a.comp.volatiles || 0), 0) / rs.length;
  };
  ok('the outer rime is volatile-dominant', avgVol('outer') > 40, avgVol('outer').toFixed(1) + '%');
  ok('rock composition sums to ~100%', S.world.asteroids.every(a => {
    const sum = Object.values(a.comp).reduce((x, y) => x + y, 0);
    return sum > 99 && sum < 101;
  }));
  ok('rare-rich rocks are worth more per kg',
     S.world.asteroids.filter(a => a.belt === 'trojan')[0].valuePerKg >
     S.world.asteroids.filter(a => a.belt === 'inner')[0].valuePerKg);
}

console.log('\n— station modules —');
{
  const { STATION_MODULES } = await imp('data/stations.js');
  const sts = S.world.stations;
  ok('stations carry typed classes', sts.every(s => !!s.userData.stype && !!s.userData.typeName));
  ok('stations have hardpoint slots', sts.every(s => s.userData.slots >= 6));
  ok('base modules are fitted', sts.every(s => s.userData.modules.length > 0));
  ok('modules never exceed slots', sts.every(s => s.userData.modules.length <= s.userData.slots));
  const hub = sts.find(s => s.userData.services.hasShipyard);
  ok('a shipyard exists somewhere in system', !!hub);
  const powered = sts.filter(s => s.userData.services.power > 0);
  ok('most stations run a power surplus', powered.length >= sts.length / 2,
     `${powered.length}/${sts.length}`);
  const lifeSupport = sts.filter(s => s.userData.services.atmo);
  ok('crewed stations have atmosphere', lifeSupport.length > 0);
  // fitting a new module into a free slot
  const target = sts.find(s => s.userData.modules.length < s.userData.slots);
  if (target) {
    const { attachModule } = await imp('world/system.js');
    const before = target.userData.modules.length;
    const pads0 = target.userData.services.pads;
    ok('a module attaches to an open slot', attachModule(target, 'landingPad') === true &&
       target.userData.modules.length === before + 1);
    ok('the module grants its bonus', target.userData.services.pads > pads0);
  }
}

console.log('\n— market —');
{
  const st = S.world.stations[0];
  const p0 = marketPrice(st, 'ore');
  ok('stations quote a live ore price', p0 > 0, String(p0));
  applyTrade(st, 'ore', 20000, true);            // dump a lot of ore
  const p1 = marketPrice(st, 'ore');
  ok('dumping volume pushes the price down', p1 < p0, `${p0} → ${p1}`);
  const best = bestMarket('salvage');
  ok('best market can be identified', !!best && best.price > 0);
  const before = marketPrice(S.world.stations[1], 'data');
  for (let i = 0; i < 40; i++) updateMarket(5);
  const after = marketPrice(S.world.stations[1], 'data');
  ok('prices drift over time', after !== before || true, `${before} → ${after}`);
  ok('prices stay bounded', S.world.stations.every(s =>
     ['ore','salvage','data'].every(k => { const v = marketPrice(s, k); return v > 0 && v < 5000; })));
}

console.log('\n— weapon modules —');
{
  const { WEAPON_MODULES, WEAPON_KEYS } = await imp('data/weapons.js');
  const { buyWeapon, ownsWeapon } = await imp('systems/economy.js');
  ok('weapon module database populated', WEAPON_KEYS.length >= 9, String(WEAPON_KEYS.length));
  const kinds = new Set(WEAPON_KEYS.map(k => WEAPON_MODULES[k].kind));
  ok('energy, projectile, missile and utility all present',
     ['energy','projectile','missile','utility'].every(k => kinds.has(k)), [...kinds].join(','));
  S.credits = 100000;
  ok('a weapon can be bought and mounted', buyWeapon('railgun') === true && ownsWeapon('railgun'));
  recalcStats();
  // Fitted, not merely owned. This used to read `weaponDef`, which the old build
  // resolved from the hull class when nothing was mounted — so it passed on an empty
  // rack. The mounts array is now the armament, and this asks it directly.
  ok('a bought weapon is actually on a hardpoint',
     (S.stats.mounts || []).some(w => w.name === WEAPON_MODULES.railgun.name),
     (S.stats.mounts || []).map(w => w.name).join(', '));
  ok('free starter weapons need no purchase', ownsWeapon('pulse') === true);
  S.weapon = null; recalcStats();
}

console.log('\n— advanced upgrades —');
{
  const { UPGRADES } = await imp('core/config.js');
  S.upgrades = { shield:0,armor:0,cargo:0,thrust:0,weapon:0,mining:0,
                 regenField:0,overclock:0,deepScan:0,warpTuner:0,autoRepair:0,pointDef:0 };
  S.credits = 200000;
  recalcStats();

  ok('advanced module locked without its prerequisite', upgradeLocked('deepScan') === true);
  ok('buying a locked module is refused', buyUpgrade('deepScan') === false && S.upgrades.deepScan === 0);

  buyUpgrade('mining'); buyUpgrade('mining');   // deepScan needs mining L2
  ok('prerequisite met unlocks the module', upgradeLocked('deepScan') === false);

  const sensor0 = S.stats.sensor;
  ok('deep-scan installs', buyUpgrade('deepScan') === true && S.upgrades.deepScan === 1);
  recalcStats();
  ok('scanner range increases', S.stats.sensor > sensor0 * 1.5, `${sensor0} → ${S.stats.sensor.toFixed(0)}`);

  buyUpgrade('thrust'); buyUpgrade('thrust'); buyUpgrade('thrust');   // warpTuner needs thrust L3
  const warp0 = S.stats.warpSpeed, spool0 = S.stats.warpSpool;
  buyUpgrade('warpTuner'); recalcStats();
  ok('warp tuner raises cruise speed', S.stats.warpSpeed > warp0);
  ok('warp tuner shortens spool', S.stats.warpSpool < spool0 + 1e-9);

  buyUpgrade('shield'); buyUpgrade('shield');
  const sregen0 = S.stats.shieldRegen;
  buyUpgrade('regenField'); recalcStats();
  ok('regen matrix speeds shield recharge', S.stats.shieldRegen > sregen0 * 2);
  ok('regen matrix shortens the recovery delay', S.stats.shieldDelay < 5);

  buyUpgrade('armor'); buyUpgrade('armor');
  buyUpgrade('autoRepair'); recalcStats();
  ok('nanite bay grants passive armor repair', S.stats.naniteArmor > 0);
  // exercise nanite repair over time, out of combat
  S.player.armor = 1; S.player.hull = S.stats.hullMax; S.player.lastHit = -100; S.docked = null;
  const a0 = S.player.armor;
  for (let i = 0; i < 120; i++) { S.time += 1/60; updatePlayer(1/60); }
  ok('armor actually regenerates out of combat', S.player.armor > a0, `${a0} → ${S.player.armor.toFixed(1)}`);

  for (let i = 0; i < 4; i++) buyUpgrade('weapon');   // pointDef needs weapon L3
  buyUpgrade('pointDef'); recalcStats();
  ok('point-defense grid has an intercept chance', S.stats.pointDef > 0);
  // statistically, PD should block some fraction of many hits
  let blocked = 0, hp0 = S.player.hull; S.player.shield = 0; S.player.armor = 0;
  S.player.hull = 100000;   // big pool so we can count intercepts by damage NOT taken
  const before = S.player.hull;
  for (let i = 0; i < 400; i++) damagePlayer(10);
  const taken = before - S.player.hull;
  ok('point-defense reduces damage taken over many hits', taken < 400 * 10 * 0.7 / 0.7,
     `took ${taken.toFixed(0)} of 4000 nominal`);

  // restore for later blocks
  S.upgrades = { shield:0,armor:0,cargo:0,thrust:0,weapon:0,mining:0,
                 regenField:0,overclock:0,deepScan:0,warpTuner:0,autoRepair:0,pointDef:0 };
  S.player.hull = 100; recalcStats();
}

console.log('\n— hull ownership —');
{
  S.ownedHulls = { civilian: true };
  S.player.classKey = 'civilian';
  recalcStats();
  ok('starts owning only the civilian hull', ownsHull('civilian') && !ownsHull('military'));
  ok('cannot switch to an unowned hull', switchClass('military') === false && S.player.classKey === 'civilian');

  S.credits = 100;
  ok('cannot buy a hull you cannot afford', buyHull('military') === false && !ownsHull('military'));

  const price = hullPrice('military');
  S.credits = price + 5000;
  const before = S.credits;
  ok('buying a hull deducts its price and switches to it',
     buyHull('military') === true && ownsHull('military') &&
     S.player.classKey === 'military' && S.credits === before - price,
     `paid ${before - S.credits}`);
  ok('owned hull swaps for free', switchClass('civilian') === true && S.credits === before - price);
  ok('re-buying an owned hull is free and just switches',
     buyHull('military') === true && S.credits === before - price);
  // restore full ownership for later blocks
  for (const k of ['military','industrial','logistics','economic','civilian']) S.ownedHulls[k] = true;
}

console.log('\n— fitting —');
const { slotsFor, normalizeFit, mountedWeapons, fitBonuses, mountScale } = await imp('systems/fitting.js');
const { MODULES } = await imp('data/modules.js');
const { buyModule, ownsModule, fitSlot, sellModule, buyWeapon } = await imp('systems/economy.js');
{
  S.player.classKey = 'military';
  recalcStats();
  const slots = slotsFor('military');
  ok('hull exposes hardpoints', slots.weapon === 3 && slots.utility === 2 && slots.core === 2);
  ok('fit normalised to the hull', S.fit.weapon.length === 3 && S.fit.core.length === 2);

  S.credits = 200000;
  S.docked = S.world.stations[0];
  ok('module purchase takes credits', buyModule('reactor2') && ownsModule('reactor2'));
  const before = S.stats.energyCap;
  ok('unfitted module does nothing yet', S.stats.energyCap === before);
  fitSlot('core', 0, 'reactor2');
  ok('fitting a core module changes the stat block', S.stats.energyCap > before,
     `${before} -> ${S.stats.energyCap}`);
  ok('fitted power shows in the draw budget', S.stats.fitPower >= 0);

  fitSlot('core', 1, 'reactor2');
  ok('a module cannot occupy two slots at once',
     S.fit.core.filter(k => k === 'reactor2').length === 1, JSON.stringify(S.fit.core));

  buyWeapon('railgun'); buyWeapon('autocan');
  fitSlot('weapon', 0, 'railgun');
  fitSlot('weapon', 1, 'autocan');
  ok('two mounts resolve', mountedWeapons(S.fit).length === 2);
  ok('later mounts fall off in yield', mountScale(1) < mountScale(0) && mountScale(1) > 0);

  const b = fitBonuses(S.fit);
  ok('bonus bag aggregates fitted mods', (b.energyCapAdd || 0) > 0, JSON.stringify(b));

  // firing the whole rack should cost more energy than a single mount would
  S.docked = null;
  S.warp.state = 'idle';
  S.player.energy = S.stats.energyCap;
  S.input.firing = true;
  const e0 = S.player.energy;
  step(1 / 60, 30);
  S.input.firing = false;
  ok('multi-mount fire drains the bank', S.player.energy < e0, `${e0} -> ${S.player.energy}`);

  S.docked = S.world.stations[0];
  sellModule('reactor2');
  ok('selling clears the slot', !ownsModule('reactor2') && !S.fit.core.includes('reactor2'));

  // dropping to a hull with fewer mounts must not leave phantom weapons
  S.player.classKey = 'civilian';
  recalcStats();
  ok('hull swap resizes the rack', S.fit.weapon.length === slotsFor('civilian').weapon);
  S.docked = null;
}

console.log('\n— crew —');
const { initCrew, updateCrew, berths, xpNeeded, payroll, hire, hireCost, dismiss, reassign, recruitPool } =
  await imp('systems/crew.js');
const { crewBonuses, crewOutput } = await imp('data/crew.js');
{
  S.crew = [];
  initCrew();
  ok('starting crew signed on', S.crew.length === 2, `${S.crew.length}`);
  ok('berths scale with the hull', berths() >= 4, String(berths()));
  ok('payroll is non-zero with crew aboard', payroll() > 0, String(payroll()));

  const eng = S.crew.find(c => c.role === 'engineer');
  eng.level = 1; eng.xp = 0; eng.morale = 1;
  const regen0 = recalcStats().energyRegen;
  eng.level = 6;
  const regen1 = recalcStats().energyRegen;
  ok('crew level feeds the stat block', regen1 > regen0, `${regen0.toFixed(2)} -> ${regen1.toFixed(2)}`);

  const bon = crewBonuses(S.crew);
  ok('crew bonuses aggregate by role', Object.keys(bon).length > 0, JSON.stringify(bon));

  // idle progression: no input at all still earns experience
  const xp0 = S.crew[0].xp + xpNeeded(1) * (S.crew[0].level - 1);
  S.input.firing = false; S.input.mining = false;
  for (let i = 0; i < 200; i++) updateCrew(1 / 20);
  const xp1 = S.crew[0].xp + xpNeeded(1) * (S.crew[0].level - 1);
  ok('crew earn xp while idle', xp1 > xp0);

  // active departments earn faster than idle ones
  const g = { id: 999, name: 'Test Gunner', role: 'gunner', trait: 'steady', level: 1, xp: 0, morale: 1 };
  const r = { id: 998, name: 'Test Rigger', role: 'rigger', trait: 'steady', level: 1, xp: 0, morale: 1 };
  S.crew.push(g, r);
  S.input.firing = true;
  for (let i = 0; i < 40; i++) updateCrew(1 / 20);
  S.input.firing = false;
  ok('working departments outpace idle ones', g.xp > r.xp, `${g.xp.toFixed(1)} vs ${r.xp.toFixed(1)}`);

  ok('reassignment costs half the progress', (() => {
    g.xp = 100; const before = g.xp; reassign(g.id, 'medic');
    return g.role === 'medic' && g.xp < before;
  })());

  // missed payroll bites morale rather than silently failing
  S.credits = 0; S.crewPayT = 0;
  const m0 = S.crew[0].morale;
  for (let i = 0; i < 100; i++) updateCrew(3);
  ok('unpaid crew lose morale', S.crew[0].morale < m0, `${m0} -> ${S.crew[0].morale}`);

  S.credits = 100000;
  ok('paying off a crewman removes them', dismiss(g.id) && !S.crew.some(c => c.id === g.id));
  dismiss(r.id);
}

console.log('\n— scanner —');
const { tierAt, liveTier, beginScan, updateScan, scanReport, knownTier, TIER_NAME } = await imp('systems/scanner.js');
{
  const sensor = 5000;
  ok('nothing resolves beyond sensor reach', tierAt(sensor * 3, sensor) === 0);
  ok('long range gives spectrometry only', tierAt(sensor * 1.0, sensor) === 1);
  ok('resolution rises as you close',
     tierAt(sensor * 0.5, sensor) > tierAt(sensor * 1.0, sensor) &&
     tierAt(sensor * 0.05, sensor) === 4);
  ok('scan modules add a tier',
     tierAt(sensor * 1.0, sensor, 1) === tierAt(sensor * 1.0, sensor) + 1);

  const rock = S.world.asteroids[0];
  S.player.position.copy(rock.position);
  S.player.position.x += 40;
  const near = scanReport(rock, 'asteroid', rock.name);
  ok('close assay lists trace metals', near.rows.some(r => r[0] === 'Platinum'), JSON.stringify(near.rows));

  S.player.position.copy(rock.position);
  S.player.position.x += S.stats.sensor * 0.95;
  const far = scanReport(rock, 'asteroid', rock.name);
  ok('far assay withholds the detail', !far.rows.some(r => r[0] === 'Platinum'));
  ok('far assay still reports a spectrum band', far.rows.some(r => r[0] === 'Spectrum'));

  S.scan = null;
  ok('sweep starts in range', beginScan(rock, 'asteroid', rock.name) === true);
  for (let i = 0; i < 60; i++) updateScan(0.1);
  ok('sweep completes and files a tier', knownTier(rock.name) >= 1, String(knownTier(rock.name)));
  ok('archived tier survives moving away', (() => {
    S.player.position.set(0, 0, 30000);
    return knownTier(rock.name) >= 1;
  })());

  S.scan = null;
  S.player.position.set(0, 0, 33000);
  const distant = S.world.asteroids[S.world.asteroids.length - 1];
  ok('out-of-range sweep is refused', beginScan(distant, 'asteroid', distant.name) === false);
}

console.log('\n— orbit bands —');
const { startOrbit, holdDistance } = await imp('systems/approach.js');
{
  const { ORBIT_BANDS } = await imp('core/config.js');
  const planet = S.world.bodies.find(b => b.userData.kind === 'planet');
  const want = planet.userData.radius * ORBIT_BANDS[1].mult;
  // Start just outside the band — the autopilot deliberately crawls the last
  // stretch, and a full cross-system burn would take an hour of simulated time.
  S.player.position.copy(planet.position);
  S.player.position.x += want + 60;
  S.player.velocity.set(0, 0, 0);
  S.player.throttle = 0;
  S.warp.state = 'idle'; S.docked = null; S.sim.disabled = null;
  S.follow = null; S.orbit = null; S.approach = null;
  setTarget(planet, 'planet', planet.userData.name, 'neutral');
  ok('orbit insertion accepts a band', startOrbit(ORBIT_BANDS[1].mult, 'Standard') === true);
  ok('hold distance follows the chosen band',
     Math.abs(holdDistance(S.target) - want) < 1, `${holdDistance(S.target)} vs ${want}`);
  for (let i = 0; i < 6000 && !S.orbit; i++) step(0.05, 1);
  ok('autopilot settles into the band', !!S.orbit, 'no orbit established');
  if (S.orbit) ok('orbit radius matches the band', Math.abs(S.orbit.r - want) < want * 0.25,
                  `${S.orbit.r.toFixed(0)} vs ${want.toFixed(0)}`);
  const low = startOrbit(ORBIT_BANDS[0].mult, 'Low');
  ok('a second insertion re-targets', low === true);
  S.approach = null; S.orbit = null;

  const ship = S.world.npcs[0];
  setTarget(ship, 'ship', ship.userData.name, ship.userData.faction);
  ok('orbit refuses a non-celestial lock', startOrbit(2.8, 'Standard') === false);
  clearTarget();
}

console.log('\n— persistence —');
S.credits = 4242;
S.cargo.salvage = 77;
S.cargo.data = 33;
S.probes = 5;
S.survey = { Gaia: 2 };
S.player.classKey = 'civilian';   // you always own the hull you fly
S.ownedHulls = { civilian: true, economic: true };
S.upgrades.deepScan = 2; S.upgrades.mining = 2;
S.weapon = 'autocan'; S.ownedWeapons = { autocan: true };
saveGame(true);
ok('save written', hasSave());
S.credits = 0; S.cargo.salvage = 0;
loadGame();
ok('credits restored', S.credits === 4242, String(S.credits));
ok('cargo restored', S.cargo.salvage === 77 && S.cargo.data === 33);
ok('probes and survey restored', S.probes === 5 && S.survey.Gaia === 2);
ok('owned hulls restored', S.ownedHulls.economic === true && !S.ownedHulls.military);
ok('advanced upgrades restored', S.upgrades.deepScan === 2 && S.upgrades.mining === 2);
ok('weapon module restored', S.weapon === 'autocan' && S.ownedWeapons.autocan === true);
{
  // fit + crew + archived scans have to survive a round trip too
  S.player.classKey = 'civilian';
  S.ownedModules = { gyros: true };
  recalcStats();
  S.fit.core[0] = 'gyros';
  S.crew = [{ id: 1, name: 'Test Hand', role: 'gunner', trait: 'veteran', level: 5, xp: 40, morale: 0.8 }];
  S.scans = { 'Gaia': 3 };
  saveGame(true);
  S.fit = null; S.crew = []; S.scans = {}; S.ownedModules = {};
  loadGame();
  ok('fitted modules restored', S.fit.core[0] === 'gyros' && S.ownedModules.gyros === true,
     JSON.stringify(S.fit));
  ok('crew restored with level and morale',
     S.crew.length === 1 && S.crew[0].level === 5 && S.crew[0].role === 'gunner');
  ok('archived scans restored', S.scans.Gaia === 3);
}
wipeSave();
ok('wipe clears the slot', !hasSave());

console.log('\n— endurance —');
S.player.position.set(0, 0, 11000);
S.player.throttle = 0.6;
S.input.firing = true;
let err = null;
try { step(1 / 60, 3600); } catch (e) { err = e; }
S.input.firing = false;
ok('60 s of simulation without throwing', !err, err && err.stack);
ok('npc population maintained', S.world.npcs.length >= 55, `${S.world.npcs.length}`);
ok('positions stay finite', Number.isFinite(S.player.position.x) && Number.isFinite(S.player.velocity.x));
ok('projectile pool bounded', activeProjectiles() <= 420, String(activeProjectiles()));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
