// Profile — where the frame actually goes.
//
// Not a test. `soak.mjs` proves the world does not grow; this asks the next question,
// which is what it *costs*. It boots the same world soak does, runs the same frame in
// the same order, and times every phase individually so an optimisation pass starts
// from a measurement instead of a hunch.
//
//   node test/profile.mjs            2400 frames (40 s of game time)
//   node test/profile.mjs 6000       longer sample
//   node test/profile.mjs 2400 json  machine-readable, for before/after diffing
//
// The absolute numbers are Node's, not the phone's — a Samsung mid-range under a
// software rasteriser is a different machine. What carries across is the *shape*:
// which phase owns the frame, and whether a change moved it.

import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

const imp = p => import(new URL('src/' + p, ROOT).href);

const FRAMES = Number(process.argv[2]) || 2400;
const JSON_OUT = process.argv.includes('json');

const { S, recalcStats } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');
const { initScene } = await imp('world/scene.js');
const { createSystem, updateSystem } = await imp('world/system.js');
const { createAsteroids, updateAsteroids } = await imp('world/asteroids.js');
const { initPlayerFx, updatePlayer } = await imp('entities/player.js');
const { createNpcs, updateNpcs } = await imp('entities/npcs.js');
const { initProjectiles, updateProjectiles } = await imp('systems/combat/projectiles.js');
const { initCombat, updateCombat } = await imp('systems/combat/combat.js');
const { updateWeapons } = await imp('systems/combat/weapons.js');
const { initMining, updateMining } = await imp('systems/industry/mining.js');
const { initWorldSim, updateWorldSim } = await imp('systems/platform/worldsim.js');
const { initMarket, updateMarket } = await imp('systems/trade/market.js');
const { initContracts, updateContracts } = await imp('systems/trade/contracts.js');
const { resetReputation } = await imp('systems/company/reputation.js');
const { initCrew, updateCrew } = await imp('systems/crew/crew.js');
const { createCharacter } = await imp('systems/crew/character.js');
const { beginAgentChain, updateMissions } = await imp('systems/trade/missions.js');
const { updateScan } = await imp('systems/industry/scanner.js');
const { updateWarp } = await imp('systems/flight/warp.js');
const { updateTargeting } = await imp('systems/flight/targeting.js');
const { updateDocking } = await imp('systems/trade/economy.js');
const { commitStep } = await imp('world/interpolate.js');
const { updateLod } = await imp('world/lod.js');
const { updateQuality } = await imp('world/quality.js');
const { updateAudio } = await imp('systems/platform/audio.js');
const hud = await imp('ui/hud.js');
const { initLightRig, updateLightRig } = await imp('world/lightrig.js');
const { lodReport } = await imp('world/lod.js');

initScene(); initLightRig(); recalcStats(); seedWorld(1337); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx(); createNpcs();
resetReputation(); initWorldSim(); initMarket(); initContracts(); initCrew();
createCharacter({ name: 'Probe', lineage: 'belter', corp: 'freewake', career: 'prospector' });
beginAgentChain();
hud.initHud();
S.running = true;

const DT = 1 / 60;

// Phase table — name, function, and how often main.js actually calls it. Sim phases run
// per fixed step; presentation phases run once per rendered frame. At 60 Hz with no
// catch-up those are the same count, which is the case being measured.
const phases = [
  ['warp', () => updateWarp(DT)],
  ['player', () => updatePlayer(DT)],
  ['weapons', () => updateWeapons(DT)],
  ['mining', () => updateMining(DT)],
  ['system', () => updateSystem(DT)],
  ['asteroids', () => updateAsteroids(DT)],
  ['npcs', () => updateNpcs(DT)],
  ['projectiles', () => updateProjectiles(DT)],
  ['combat', () => updateCombat(DT)],
  ['worldsim', () => updateWorldSim(DT)],
  ['market', () => updateMarket(DT)],
  ['crew', () => updateCrew(DT)],
  ['missions', () => updateMissions()],
  ['contracts', () => updateContracts(DT)],
  ['scan', () => updateScan(DT)],
  ['docking', () => updateDocking()],
  ['targeting', () => updateTargeting()],
  ['interp', () => commitStep()],
  ['quality', () => updateQuality(DT)],
  ['lod', () => updateLod(800)],
  ['lights', () => updateLightRig(DT)],
  ['audio', () => updateAudio(DT)],
  ['hud', () => hud.updateHud(DT)]
];

const total = new Float64Array(phases.length);
const worst = new Float64Array(phases.length);
const hrt = () => Number(process.hrtime.bigint()) / 1e6;

function drive(i) {
  S.player.throttle = Math.sin(S.time * 0.03) * 0.8;
  S.input.firing = Math.floor(S.time) % 7 < 2;
  S.input.mining = Math.floor(S.time) % 11 < 3;
  if (i % 900 === 0) S.player.lastHit = S.time;
  if (i % 1800 === 0) { S.player.hull = S.stats.hullMax; S.player.shield = S.stats.shieldMax; }
  S.player.energy = S.stats.energyCap;
}

// Warm up first — 20 s of game time so the JIT has seen every path and the world has a
// population, a market and a contract board rather than the empty state at frame zero.
for (let i = 0; i < 1200; i++) {
  S.time += DT; S.playtime += DT; drive(i);
  for (const [, fn] of phases) fn();
}

const t0 = hrt();
for (let i = 0; i < FRAMES; i++) {
  S.time += DT; S.playtime += DT; drive(i);
  for (let p = 0; p < phases.length; p++) {
    const a = hrt();
    phases[p][1]();
    const d = hrt() - a;
    total[p] += d;
    if (d > worst[p]) worst[p] = d;
  }
}
const wall = hrt() - t0;

const rows = phases.map(([name], p) => ({
  phase: name,
  msPerFrame: total[p] / FRAMES,
  worstMs: worst[p],
  share: total[p] / (wall || 1)
})).sort((a, b) => b.msPerFrame - a.msPerFrame);

const budget = 1000 / 60;

// ── scene census ─────────────────────────────────────────────────────
// The frame timings above are Node's CPU only — there is no renderer here. What actually
// decides the frame on a phone is the shape of the scene, and that *is* measurable
// headlessly: how many things get drawn, how many distinct materials and buffers the GPU
// has to hold, and above all how many point lights every lit shader compiles a loop over.
// Track these across a change and a regression shows up as a number rather than a
// complaint about the game feeling worse.
function census() {
  const mats = new Set(), geos = new Set();
  let nodes = 0, drawables = 0, pointLights = 0, visible = 0;
  // Visibility is inherited, and counting it per node would miss the entire point of the
  // cull: LOD hides a *group*, and three.js stops descending there — the child meshes are
  // still flagged visible and still never drawn. A census that read their own flag would
  // report no saving at all from the thing that saves the most.
  (function walk(o, shown) {
    nodes++;
    const on = shown && o.visible !== false;
    if (o.isPointLight || o.type === 'PointLight') pointLights++;
    if (o.material) {
      drawables++;
      if (on) visible++;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m));
    }
    if (o.geometry) geos.add(o.geometry);
    for (const c of o.children) walk(c, on);
  })(scene, true);
  return { nodes, drawables, visible, pointLights, materials: mats.size, geometries: geos.size };
}

const sceneMod = await imp('world/scene.js');
const scene = sceneMod.scene;
// The census is a view-dependent measurement, so it needs a viewpoint the player would
// actually have. Left at the origin it reports the scene as seen from inside the star.
sceneMod.camera.position.copy(S.player.position);
updateLod(800);
updateLightRig(1);
const shape = census();

const summary = {
  frames: FRAMES,
  wallMs: wall,
  msPerFrame: wall / FRAMES,
  budgetPct: (wall / FRAMES) / budget * 100,
  npcs: S.world.npcs.length,
  heapMb: process.memoryUsage().heapUsed / 1048576,
  lod: lodReport()
};

if (JSON_OUT) {
  console.log(JSON.stringify({ summary, shape, rows }, null, 2));
} else {
  console.log('\n— profile —');
  console.log(`  ${FRAMES} frames · ${summary.npcs} npcs · heap ${summary.heapMb.toFixed(1)} MB`);
  console.log(`  ${summary.msPerFrame.toFixed(3)} ms/frame measured `
    + `(${summary.budgetPct.toFixed(1)}% of a 16.7 ms budget, Node, no renderer)\n`);
  console.log(`  scene: ${shape.nodes} nodes · ${shape.drawables} drawables `
    + `(${shape.visible} visible) · ${shape.materials} materials · ${shape.geometries} geometries`);
  console.log(`  LOD: ${summary.lod.tracked} tracked · ${summary.lod.culled} culled`);
  console.log(`  point lights: ${shape.pointLights}   `
    + `— every lit fragment loops over all of them, and the count is a shader key\n`);
  console.log('  phase          ms/frame    share   worst');
  for (const r of rows) {
    if (r.msPerFrame < 0.0005 && r.share < 0.005) continue;
    console.log(`  ${r.phase.padEnd(13)} ${r.msPerFrame.toFixed(4).padStart(8)}`
      + `  ${(r.share * 100).toFixed(1).padStart(6)}%`
      + `  ${r.worstMs.toFixed(2).padStart(6)} ms`);
  }
  const shown = rows.filter(r => r.msPerFrame >= 0.0005 || r.share >= 0.005).length;
  if (shown < rows.length) console.log(`  (${rows.length - shown} phases below noise floor omitted)`);
  console.log('');
}

// Cull breakdown — how much of the saving is hulls rather than distant moons. Printed
// last because it is a one-off diagnostic for the slice that introduced NPC culling, and
// the numbers above are the ones worth watching over time.
if (!JSON_OUT) {
  const npcs = S.world.npcs;
  let npcCulled = 0, npcDrawn = 0;
  for (const n of npcs) (n.visible === false ? npcCulled++ : npcDrawn++);
  console.log(`  hulls: ${npcDrawn} drawn · ${npcCulled} culled `
    + `(${(npcCulled / (npcs.length || 1) * 100).toFixed(0)}% of the population)\n`);
}
