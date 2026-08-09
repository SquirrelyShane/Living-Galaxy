// Living Galaxy — entry point. Boot happens in two phases: everything seed-independent
// comes up immediately; the world itself is generated only when the pilot powers up,
// because in multiplayer the server hands us the seed and the system's age first.

import { S, recalcStats } from './core/state.js';
import { WORLD_SEED } from './core/config.js';
import { seedWorld, stream } from './core/rng.js';
import { VERSION, BUILD, versionString } from './core/version.js';
import { clock, advance, sample, perfStats, nowMs, resetClock } from './core/clock.js';
import { guard, diagnostics, unpark, setFaultHandler, installGlobalHandlers,
         downloadLog, formatLog, logFilePath } from './core/diagnostics.js';
import { initScene, render, camera } from './world/scene.js';
import { createStarfield, updateStarfield, createSkybox, createDust } from './world/starfield.js';
import { createSystem, updateSystem } from './world/system.js';
import { createAsteroids, updateAsteroids } from './world/asteroids.js';
import { initPlayerFx, updatePlayer } from './entities/player.js';
import { createNpcs, updateNpcs } from './entities/npcs.js';
import { initProjectiles, updateProjectiles } from './systems/projectiles.js';
import { initCombat, updateCombat } from './systems/combat.js';
import { updateWeapons } from './systems/weapons.js';
import { initMining, updateMining } from './systems/mining.js';
import { updateWarp } from './systems/warp.js';
import { updateApproach, initHail } from './systems/approach.js';
import { updateTargeting } from './systems/targeting.js';
import { updateDocking } from './systems/economy.js';
import { loadGame, hasSave, wipeSave, autosave, saveGame, savedSeed,
         saveInfo, exportSave, importSave, restoreBackup } from './systems/save.js';
import { connectNet, updateNet } from './systems/net.js';
import { initWorldSim, updateWorldSim } from './systems/worldsim.js';
import { updateMissions, agentBriefing, beginAgentChain } from './systems/missions.js';
import { initContracts, updateContracts, activeContracts } from './systems/contracts.js';
import { netReport } from './systems/net.js';
import { callTool, toolManifest } from './systems/tools.js';
import { updateJobs, craftingReport, queueJob, blueprintDetail, buildableNow } from './systems/crafting.js';
import { updateSites, empireReport, siteReport, foundSite, sites } from './systems/planetary.js';
import { updateOrders, orderReport, dispatch, ORDER_TYPES,
         updateFleetOrders, fleetOrderReport, dispatchFleet, FLEET_ORDER_TYPES } from './systems/orders.js';
import { CRAFT } from './core/config.js';
import { characterSheet, spendPoint, buyLicence, hasCharacter } from './systems/character.js';
import { initCreation, openCreation } from './ui/creation.js';
import { initSettings, tickSettings, openSettings, diagnosticReport } from './ui/settings.js';
import { initOps, tickOps, openOps } from './ui/ops.js';
import { applyDisplay, display, setDisplay } from './systems/display.js';
import { initQuality, updateQuality, qualityState, setQualityLevel, setAuto,
         LEVELS as QUALITY_LEVELS } from './systems/quality.js';
import { commitStep, applyInterpolation, restoreAfterRender, track,
         trackedCount } from './world/interpolate.js';
import { updateLod, lodReport } from './world/lod.js';
import { startMusic, stopMusic, updateAudio, setBusLevel, busLevel, applyMix,
         setAudioEnabled, audioRunning } from './systems/audio.js';
import { resetReputation, reputationReport } from './systems/reputation.js';
import { initMarket, updateMarket } from './systems/market.js';
import { initAssistant } from './systems/assistant.js';
import { initCrew, updateCrew } from './systems/crew.js';
import { updateScan } from './systems/scanner.js';
import { initAudio, resumeAudio } from './systems/audio.js';
import { initHud, updateHud, setThreat, markShipButtons, hudStats, invalidateHud } from './ui/hud.js';
import { initControls, keyPoll } from './ui/controls.js';
import { initNavmap, tickNavmap } from './ui/navmap.js';
import { initDock, openDock } from './ui/dock.js';
import { initAria } from './ui/aria.js';
import { initFit } from './ui/fitting.js';
import { initCrewUi } from './ui/crew.js';
import { initComms as initCommsUi, tickComms, openComms } from './ui/comms.js';
import { initMind, openMind } from './ui/mind.js';
import { initTutorial, offerTutorial, reopenTutorial } from './ui/tutorial.js';
import { initComms, updateComms, commsReport, transmit } from './systems/comms.js';
import { updateNpcComms } from './systems/npc-comms.js';
import { sweepDeals } from './systems/deals.js';
import { updateResearch } from './systems/research.js';
import { updateTutorial, tutorialReport, startTutorial, skipTutorial } from './systems/tutorial.js';
import { updateCompany, companyReport, hasCompany } from './systems/company.js';
import { updateFleet } from './systems/fleet.js';
import { resetDiagnostics } from './data/npc-kb/index.js';
import { updateManagers, managersReport, auditions, installManager, setExperimental,
         enabled as experimentalOn } from './systems/managers.js';
import { interlockReport, interlockLine, resetAnnounce } from './systems/preflight.js';
import { initBrains, loadBrainModel, setBrainsEnabled, brainsReport, personaReport,
         knownPersonas } from './systems/npc-brain.js';
import { status, toast } from './ui/toast.js';
import { $ } from './core/utils.js';

let booted = false;

boot();

function boot() {
  if (typeof THREE === 'undefined') {
    document.body.innerHTML =
      '<div style="padding:24px;font:13px monospace;color:#8fd4ff">' +
      'three.js failed to load. Check the network, or drop three.min.js into vendor/ ' +
      'and point the script tag in index.html at it.</div>';
    return;
  }

  // faults first: everything below this line is now allowed to fail loudly but survivably
  setFaultHandler(msg => toast(msg, 3600));
  installGlobalHandlers(window);
  initCreation();
  initSettings();
  initOps();
  applyDisplay();
  initQuality();      // before the world is built, so the first frame is already sized

  // phase 1 — seed-independent
  initScene();
  recalcStats();
  initProjectiles();
  initCombat();
  initMining();
  initPlayerFx();
  initAudio();
  initHud();
  initControls();
  initNavmap();
  initDock();
  initFit();
  initCrewUi();
  initHail();
  initAria();
  initCommsUi();
  initMind();
  initTutorial(restartForNewGame);
  initAssistant();

  const start = $('boot-start');
  start.textContent = hasSave() ? 'Resume flight' : 'Power up';

  const info = saveInfo();
  const stamp = $('boot-version');
  if (stamp) {
    stamp.textContent = info
      ? `${versionString()} · save ${info.build} · ${Math.round(info.playtime / 60)} min flown`
      : versionString();
  }

  start.addEventListener('click', () => {
    if (booted) return;
    resumeAudio();
    start.textContent = 'Powering up…';
    const name = ($('mp-name') && $('mp-name').value || '').trim();
    const url = ($('mp-url') && $('mp-url').value || '').trim();

    if (url) {
      connectNet(url, name).then(res => {
        if (res) finishBoot(res.seed, res.age, true);
        else finishBoot(savedSeed() ?? WORLD_SEED, 0, false);   // solo fallback, told via toast
      });
    } else {
      finishBoot(savedSeed() ?? WORLD_SEED, 0, false);
    }
  });

  $('boot-wipe').addEventListener('click', () => {
    wipeSave();
    location.reload();
  });

  addEventListener('visibilitychange', () => {
    if (document.hidden && S.running) saveGame(true);
  });

  requestAnimationFrame(frame);
}

function finishBoot(seed, age, online) {
  if (booted) return;
  booted = true;

  // phase 2 — the world itself
  S.seed = seed >>> 0;
  seedWorld(S.seed);
  createSkybox();
  createStarfield();
  createDust();
  createSystem();
  createAsteroids();
  createNpcs();
  resetReputation();       // defaults; a save overwrites them below
  // The diagnostic log is world state, not application state. Before schema 17 it lived
  // on globalThis and a new game inherited the previous one's record of who did what.
  resetDiagnostics();
  initWorldSim();
  initMarket();
  initContracts();
  initComms();
  // Tiers 1–2 of the NPC brains come up with the world; the language-model tier is
  // permitted but downloads nothing until the player asks for it in Settings → Lab.
  initBrains();
  // The experimental branch is opt-in and remembered, but a save that had it on must not
  // silently turn it on again for a player who has since thought better of it — the flag
  // is read from settings after the load, below, not here.
  setExperimental(false);
  if (age > 0) {              // orbital motion is linear in dt, so one big step catches up
    updateSystem(age);
    updateAsteroids(age);
  }

  const restored = hasSave() && loadGame();
  if (S.settings.experimental) setExperimental(true);
  resetAnnounce();
  initCrew();          // after the save so a restored roster wins over the default one
  recalcStats();
  applyDisplay();       // a loaded save may carry different display settings
  invalidateHud();      // ...and the HUD cache is stale after a load either way
  markShipButtons();
  $('btn-assist').classList.toggle('on', S.settings.assist);
  $('btn-audio').classList.toggle('on', S.settings.audio);
  $('btn-cam').classList.toggle('on', S.settings.chase);

  $('boot-overlay').classList.add('hidden');

  // A flight with no pilot on it needs one before it starts. That is either a genuinely
  // new game, or a save from before 0.6 whose migration deliberately left `character`
  // null rather than inventing a lineage the player never chose.
  if (!hasCharacter()) {
    const preset = ($('mp-name') && $('mp-name').value || '').trim();
    openCreation(preset, () => {
      S.running = true;
      setAudioEnabled(S.settings.audio);
      startMusic();
      // Executive founders start docked at the registered office — open the station
      // surface so the first frame is the headquarters, not empty space.
      if (S.docked) openDock();
      saveGame(true);
    });
    return;
  }

  S.running = true;
  // Honour a saved mute: startMusic() refuses while muted, and setAudioEnabled puts the
  // master and the context into the state the flag claims they are in.
  setAudioEnabled(S.settings.audio);
  startMusic();
  status(online ? 'Linked — shared system' : restored ? 'Flight restored' : 'Navigation core online');
  // A brand new pilot gets the checklist. A restored one does not — they have already
  // demonstrated they can fly, and offering training to somebody mid-career is noise.
  if (!restored) offerTutorial();
  setTimeout(() => { const h = $('touch-hint'); if (h) h.style.opacity = '0'; }, 7000);
}

/**
 * "Start a new game" from the end of training.
 *
 * Deliberately a reload rather than an in-place teardown. Half the world — the belt, the
 * claims, the station roster, the NPC population, twelve modules' worth of module-level
 * caches — is built once at boot from a seed, and unbuilding all of it correctly is a
 * much larger and much more fragile job than starting the process again. The save is
 * wiped first so the reboot lands on the creation screen with a clean slate, and the
 * backup slot is left alone so an accidental fresh start is still recoverable.
 */
function restartForNewGame() {
  saveGame(true);          // flush the old flight into the backup slot before wiping
  wipeSave();
  toast('Starting fresh — pick a new life', 2600);
  setTimeout(() => location.reload(), 700);
}

// Frame phases. Each runs inside an error guard, so a fault costs that phase for one
// frame instead of stopping the loop. Order is still the contract: warp can override
// flight, flight moves the ship, everything else reacts to where it ended up.
let threat = { threat: false, lockedOn: false };

function phaseFlight(dt) {
  S.input.turning = S.input.dragging;
  keyPoll(dt);
  updateWarp(dt);
  updateApproach(dt);
  updatePlayer(dt);
  updateWeapons(dt);
  updateMining(dt);
}

function phaseWorld(dt) {
  updateSystem(dt);
  updateAsteroids(dt);
  updateStarfield(dt);
  threat = updateNpcs(dt) || threat;
}

function phaseCombat(dt) {
  updateProjectiles(dt);
  updateCombat(dt);
}

function phaseSim(dt) {
  updateWorldSim(dt);
  updateMarket(dt);
  updateComms(dt);
  // NPCs talking to each other, whether or not anyone is listening. See
  // systems/npc-comms.js — the player only ever overhears what happens near them.
  updateNpcComms(dt);
  // Obligations expire and parties die. See systems/deals.js — every deal can fail.
  sweepDeals(dt);
  // The lab runs on game hours, like the fabricator and the galley.
  updateResearch(dt);
  updateTutorial(dt);
  updateCompany(dt);
  // Contracted hulls: upkeep, and reconciliation against ships that died or despawned.
  updateFleet(dt);
  updateCrew(dt);
  updateMissions();
  updateContracts(dt);
  // Industry runs on game hours. One conversion, here, so nothing downstream has to know
  // the rate — the factory thinks in shifts and the frame loop thinks in seconds.
  const gh = dt * CRAFT.gameHoursPerSecond;
  updateJobs(gh);
  updateSites(gh);
  updateOrders(gh);
  updateFleetOrders(dt);
  updateManagers(gh);
  updateScan(dt);
  updateDocking(dt);
  updateTargeting();
}

function phaseNet(dt) { updateNet(dt); }

function phaseUi(dt) {
  setThreat(!!threat.threat, !!threat.lockedOn);
  updateHud(dt);
  tickNavmap(dt);
}

/** One fixed slice of simulation. Rendering deliberately stays outside it. */
function step(dt) {
  S.time += dt;
  S.playtime += dt;
  guard('flight', phaseFlight, dt);
  guard('world', phaseWorld, dt);
  guard('combat', phaseCombat, dt);
  guard('sim', phaseSim, dt);
  guard('net', phaseNet, dt);
  // Last thing in the step: record where everything ended up, so the frames drawn
  // between this step and the next have two endpoints to blend between.
  guard('interp', commitStep);
}

function frame(now) {
  requestAnimationFrame(frame);
  const t0 = nowMs();
  const steps = advance(now);

  if (!S.running) { render(); sample(nowMs() - t0); return; }

  for (let i = 0; i < steps; i++) step(clock.stepDt);

  // Presentation runs once per rendered frame, not once per sim step: the HUD has
  // nothing to gain from being rebuilt five times while the sim catches up.
  const frameDt = clock.dt;
  guard('ui', phaseUi, frameDt);
  guard('settings', tickSettings, frameDt);
  guard('ops', tickOps, frameDt);
  guard('comms', tickComms, frameDt);
  guard('save', autosave, frameDt);

  // Presentation, in order. Quality decides how much work the frame is allowed, LOD
  // decides which meshes take part, interpolation decides where they are drawn — and
  // then the authoritative transforms go straight back, so nothing downstream ever
  // reads a smoothed position as truth.
  guard('quality', updateQuality, frameDt);
  guard('lod', () => updateLod(innerHeight));
  guard('audio', updateAudio, frameDt);

  applyInterpolation(clock.alpha);
  render();
  restoreAfterRender();

  sample(nowMs() - t0);
}

// Handy while tuning from the console: LG.S, LG.camera, LG.perf(), LG.diagnostics()
window.LG = {
  S, camera, openDock, saveGame,
  build: BUILD, version: VERSION,
  clock, perf: perfStats, resetClock, hudStats, invalidateHud,
  quality: qualityState, setQuality: setQualityLevel, autoQuality: setAuto,
  qualityLevels: QUALITY_LEVELS, lod: lodReport, interpolated: trackedCount,
  music: { start: startMusic, stop: stopMusic }, mix: { set: setBusLevel, get: busLevel },
  audio: { enable: setAudioEnabled, running: audioRunning },
  diagnostics, unpark, report: diagnosticReport, downloadLog, formatLog, logFilePath,
  settings: openSettings, display, setDisplay,
  rng: stream,
  reputation: reputationReport,
  character: characterSheet, agent: agentBriefing,
  spendPoint, buyLicence, beginAgentChain,
  contracts: activeContracts,
  net: netReport, tools: callTool, toolList: toolManifest,
  craft: craftingReport, queueJob, blueprint: blueprintDetail, buildable: buildableNow,
  industry: empireReport, site: siteReport, foundSite, sites,
  orders: orderReport, dispatch, orderTypes: ORDER_TYPES, openOps,
  interlocks: interlockReport, interlockLine,
  brains: brainsReport, persona: personaReport, personas: knownPersonas, openMind,
  loadBrainModel, setBrainsEnabled,
  comms: commsReport, transmit, openComms,
  tutorial: tutorialReport, startTutorial, skipTutorial, reopenTutorial,
  company: companyReport, hasCompany,
  managers: managersReport, auditions, installManager,
  experimental: setExperimental, experimentalOn,
  save: { info: saveInfo, export: exportSave, import: importSave, restore: restoreBackup, wipe: wipeSave }
};
