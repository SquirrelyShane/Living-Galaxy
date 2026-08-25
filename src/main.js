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
import { initScene, render, camera, scene } from './world/scene.js';
import { createStarfield, updateStarfield, createSkybox, createDust } from './world/starfield.js';
import { createSystem, updateSystem } from './world/system.js';
import { createAsteroids, updateAsteroids } from './world/asteroids.js';
import { initPlayerFx, updatePlayer } from './entities/player.js';
import { createNpcs, updateNpcs, registerNpcFactories } from './entities/npcs.js';
import { createShoal, updateShoal, resetShoal, shoalReport } from './systems/npc/shoal.js';
import { registerHullFactory } from './entities/shipmesh.js';
import { initProjectiles, updateProjectiles, registerRemoteTargets, registerRemoteHit } from './systems/combat/projectiles.js';
import { initCombat, updateCombat, damagePlayer } from './systems/combat/combat.js';
import { updateWeapons } from './systems/combat/weapons.js';
import { initMining, updateMining } from './systems/industry/mining.js';
import { updateWarp } from './systems/flight/warp.js';
import { updateApproach, initHail } from './systems/flight/approach.js';
import { updateTargeting } from './systems/flight/targeting.js';
import { updateDocking } from './systems/trade/economy.js';
import { loadGame, hasSave, wipeSave, autosave, saveGame, savedSeed, savedLayout,
         savedDensity, saveInfo, exportSave, importSave, restoreBackup, genesisWarning,
         savedGalaxy } from './systems/platform/save.js';
import { planFor, systemLine, generateSystem, solarisPlan, GENESIS_VERSION } from './world/genesis.js';
import { homeNode, nodeAt, designation, galaxyLine } from './world/galaxy.js';
import { connectNet, updateNet, registerNetHit, remoteTargets, sendHit } from './systems/platform/net.js';
import { initWorldSim, updateWorldSim } from './systems/platform/worldsim.js';
import { updateMissions, agentBriefing, beginAgentChain } from './systems/trade/missions.js';
import { initContracts, updateContracts, activeContracts } from './systems/trade/contracts.js';
import { updateBoardroom } from './systems/company/boardroom.js';
import { netReport } from './systems/platform/net.js';
import { callTool, toolManifest, tickTools } from './systems/platform/tools.js';
import { updateAutopilot, autopilotReport, setAutopilot, resetAutopilot } from './systems/npc/autopilot.js';
import { updateGroupwork, groupworkReport, resetGroupwork } from './systems/crew/groupwork.js';
import { updateJobs, craftingReport, queueJob, blueprintDetail, buildableNow } from './systems/industry/crafting.js';
import { updateSites, empireReport, siteReport, foundSite, sites } from './systems/industry/planetary.js';
import { updateOrders, orderReport, dispatch, ORDER_TYPES,
         updateFleetOrders, fleetOrderReport, dispatchFleet, FLEET_ORDER_TYPES } from './systems/company/orders.js';
import { CRAFT } from './core/config.js';
import { characterSheet, spendPoint, buyLicence, hasCharacter } from './systems/crew/character.js';
import { initCreation, openCreation } from './ui/creation.js';
import { initSettings, tickSettings, openSettings, diagnosticReport } from './ui/settings.js';
import { initOps, tickOps, openOps } from './ui/ops.js';
import { applyDisplay, display, setDisplay } from './systems/platform/display.js';
import { initQuality, updateQuality, qualityState, setQualityLevel, setAuto,
         LEVELS as QUALITY_LEVELS } from './world/quality.js';
import { commitStep, applyInterpolation, restoreAfterRender, track,
         trackedCount } from './world/interpolate.js';
import { updateLod, lodReport } from './world/lod.js';
import { initLightRig, updateLightRig, lightRigReport } from './world/lightrig.js';
import { startMusic, stopMusic, updateAudio, setBusLevel, busLevel, applyMix,
         setAudioEnabled, audioRunning } from './systems/platform/audio.js';
import { resetReputation, reputationReport } from './systems/company/reputation.js';
import { initMarket, updateMarket } from './systems/trade/market.js';
import { initAssistant } from './systems/npc/assistant.js';
import { initCrew, updateCrew } from './systems/crew/crew.js';
import { updateScan } from './systems/industry/scanner.js';
import { updateHabitat, resetHabitat } from './systems/industry/habitat.js';
import { resetSweep } from './systems/npc/sweep.js';
import { initAdvisory, openAdvisory } from './ui/advisory.js';
import { initContact, openContact } from './ui/contact.js';
import { initWarpMenu } from './ui/warpmenu.js';
import { initDoctrine } from './ui/doctrine.js';
import { resetParley } from './systems/npc/parley.js';
import { resetAdvisor } from './systems/npc/advisor.js';
import { updateCrewTalk, resetCrewTalk } from './systems/crew/crew-talk.js';
import { initAudio, resumeAudio } from './systems/platform/audio.js';
import { initHud, updateHud, setThreat, setFleetAlert, markShipButtons, hudStats, invalidateHud,
         refreshSystemName } from './ui/hud.js';
import { initControls, keyPoll } from './ui/controls.js';
import { initNavmap, tickNavmap, navmapOpen, openNavmap } from './ui/navmap.js';
import { initMarkers, updateMarkers } from './ui/markers.js';
import { initConn, tickConn, abortConn, connActive } from './ui/conn.js';
import { initExecDeck, tickExecDeck, enterCommandSurface, showDeck, hideDeck,
         execHudActive } from './ui/execdeck.js';
import { initDossier, tickDossier } from './ui/dossier.js';
import { initGalaxyMap, tickGalaxyMap, galaxyMapOpen } from './ui/galaxymap.js';
import { updateParticles, warpFlash, particleStats } from './world/particles.js';
import { initPointField, updatePointField, fieldStats } from './world/pointfield.js';
import { buildWells, refreshWells } from './world/wells.js';
import { initBoardroom, tickBoardroom } from './ui/boardroom.js';
import { isExecutive, canPilot, careerLine } from './systems/company/career.js';
import { initDock, openDock } from './ui/dock.js';
import { initAria } from './ui/aria.js';
import { initLoading, note, tick, setProgress, setHeadline, finishLoading } from './ui/loading.js';
import { initMenu, genSettings, refreshRoster, setArchiveLine } from './ui/menu.js';
import { build as buildCodex, manifest as codexManifest, archiveLine } from './systems/platform/codex.js';
import { parkPilot, resumePilot, beginNewPilot, listPilots } from './systems/platform/pilots.js';
import { loadModel } from './systems/npc/assistant.js';
import { AVATAR } from './core/config.js';
import { durable } from './core/store.js';
import { initFit } from './ui/fitting.js';
import { initCrewUi } from './ui/crew.js';
import { initComms as initCommsUi, tickComms, openComms } from './ui/comms.js';
import { initMind, openMind } from './ui/mind.js';
import { initTutorial, offerTutorial, reopenTutorial } from './ui/tutorial.js';
import { initCommsSystem, updateComms, commsReport, transmit } from './systems/npc/comms.js';
import { updateNpcComms } from './systems/npc/npc-comms.js';
import { sweepDeals } from './systems/trade/deals.js';
import { updateResearch } from './systems/industry/research.js';
import { updateTutorial, tutorialReport, startTutorial, skipTutorial } from './systems/platform/tutorial.js';
import { updateCompany, companyReport, hasCompany } from './systems/company/company.js';
import { updateFleet, fleetUnderFire } from './systems/company/fleet.js';
import { resetDiagnostics } from './data/npc-kb/index.js';
import { resetGrammarMemory } from './data/npc-kb/grammar.js';
import { updateManagers, managersReport, auditions, installManager, setExperimental,
         enabled as experimentalOn } from './systems/company/managers.js';
import { interlockReport, interlockLine, resetAnnounce } from './systems/platform/preflight.js';
import { initBrains, loadBrainModel, setBrainsEnabled, brainsReport, personaReport,
         knownPersonas } from './systems/npc/npc-brain.js';
import { status, toast, initToast } from './ui/toast.js';
import { registerScreen } from './core/screens.js';
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
  // Before anything that emits: the pool has to exist when the first hull registers, and
  // it is created once for the life of the page so the light count never moves.
  initLightRig();
  recalcStats();
  initProjectiles();
  initCombat();
  initMining();
  initPlayerFx();
  initPointField(scene);
  initAudio();
  initHud();
  initControls();
  initNavmap();
  // Contact brackets on the canopy. After the controls, because the canopy's tap handler
  // asks the marker overlay what is under the finger — see ui/markers.js.
  initMarkers();
  // The autopilot handoff overlay. Pure presentation — see ui/conn.js.
  initConn();
  // After the chart: the deck's primary control opens it, and binding a handler that
  // calls into an uninitialised module is the kind of ordering bug that only shows up on
  // the one career nobody tests by hand.
  initExecDeck();
  initDossier();
  initGalaxyMap();
  initBoardroom();
  initDock();
  // The two ports that let the simulation speak without importing the interface. Registered
  // here, at boot, next to the screens they belong to — see `core/notify.js` and
  // `core/screens.js` for why the arrow points this way.
  initToast();
  registerScreen('dock', openDock);
  // Another pilot's round landing on this hull. Registered rather than imported by the link
  // layer — see `registerNetHit` in systems/platform/net.js.
  registerNetHit((dmg, type) => damagePlayer(dmg, type));
  // ...and the other direction: where the other pilots are, and how to tell one it was hit.
  registerRemoteTargets(remoteTargets);
  registerRemoteHit(sendHit);
  // The chart, as a port. ARIA's mining run opens it filtered and centred on the rock it
  // chose, and ARIA lives in `systems/` — which may not import `ui/`. The simulation names
  // the screen; this line is what that means on this build.
  registerScreen('navmap', opts => openNavmap(opts));
  // ...and the same shape for ARIA's recommendations: `systems/npc/advisor.js` decides the
  // ship is short of something, this line is what that looks like on this build.
  initAdvisory();
  registerScreen('advisory', adv => openAdvisory(adv));
  // What the simulation may bring into being. Registered here so the set is visible in one
  // place rather than being a property of which modules happened to get imported.
  registerNpcFactories();
  registerHullFactory();
  initFit();
  initCrewUi();
  initHail();
  // The channel, and the warp menu that can open it. Both are interface over
  // `systems/npc/parley.js` and `systems/flight/warp.js` respectively.
  initContact();
  initWarpMenu();
  initDoctrine();
  registerScreen('contact', obj => openContact(obj));
  initAria();
  initCommsUi();
  initMind();
  initTutorial(restartForNewGame);
  initAssistant();

  const start = $('boot-start');
  start.textContent = hasSave() ? 'Resume flight' : 'Power up';

  // ── the loading sequence ──────────────────────────────────────────
  //
  // Everything above this line is instrument wiring: modules finding their DOM nodes and
  // registering handlers, all of it microseconds. Everything below is *work* — an archive to
  // build, a model to fetch, a roster to read — and it is the reason there is a screen to
  // watch. See `ui/loading.js` for the three promises that screen makes.
  //
  // The world itself is still built in `finishBoot`, when the player commits. That has not
  // moved and should not: the galaxy is pregenerated, the *system you are standing in* is
  // built from the seed the menu hands over.
  initLoading();
  initMenu({
    rebuild: want => runArchive(want, true),
    resume: id => resumeFromRoster(id),
    newPilot: () => { beginNewPilot(); refreshRoster(); status0('New pilot — power up to create them.'); }
  });
  runLoadSequence();

  const info = saveInfo();
  const stamp = $('boot-version');
  if (stamp) {
    // "save 1.01.70" read as though the build had changed. It is the build that *wrote*
    // the save, which is worth showing — a save carried forward through ten migrations is
    // exactly the thing you want to know about before reporting a bug — but it has to say
    // so, and it only earns the space when it disagrees with what is running.
    stamp.textContent = info
      ? `${versionString()}` +
        (info.build && info.build !== VERSION ? ` · save from v${info.build}` : '') +
        ` · ${Math.round(info.playtime / 60)} min flown`
      : versionString();
  }

  // The boot screen knows its own galaxy (v1.04): reached over the web, the server
  // field prefills with the host that served the page — or the one web/config.js
  // names, when the static build lives on a CDN and the galaxy behind a tunnel.
  // Prefilled, never forced: a typed address always wins, and file:// sees nothing.
  const mpUrl = $('mp-url');
  if (mpUrl && !mpUrl.value && typeof location !== 'undefined' && /^https?:$/.test(location.protocol || '')) {
    const cfg = (typeof window !== 'undefined' && window.GALAXY && window.GALAXY.host) || '';
    if (cfg) mpUrl.value = 'wss://' + String(cfg).replace(/^[a-z]+:\/\//, '').replace(/\/.*$/, '');
    else if (location.host) mpUrl.value = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host;
  }

  start.addEventListener('click', () => {
    if (booted) return;
    resumeAudio();
    start.textContent = 'Powering up…';
    const name = ($('mp-name') && $('mp-name').value || '').trim();
    const url = ($('mp-url') && $('mp-url').value || '').trim();
    const pass = ($('mp-pass') && $('mp-pass').value || '').trim();

    if (url) {
      connectNet(url, name, pass).then(res => {
        if (res) finishBoot(res.seed, res.age, true, res.density);
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
    if (document.hidden && S.running) { saveGame(true); parkPilot(); }
  });

  requestAnimationFrame(frame);
}

/** A line on the menu, without dragging the toast system into the boot path. */
function status0(text) {
  const n = $('gen-archive');
  if (n) n.textContent = text;
}

/**
 * Build (or confirm) the archive, reporting into the loading feed.
 *
 * `interactive` means the player pressed APPLY on the menu rather than this being the boot
 * pass — the loading screen comes back for the duration, because a rebuild at depth 4096 is
 * a wait and a menu that simply freezes for forty seconds is the failure this whole screen
 * exists to prevent.
 */
async function runArchive(want, interactive) {
  const overlay = $('load-overlay');
  if (interactive && overlay) {
    overlay.classList.remove('hidden', 'done');
    initLoading();
    setProgress(0);
    setHeadline('Rebuilding the archive', `${want.depth} systems at density ${want.density.toFixed(1)}`);
  }
  note(`Charting ${want.depth} systems…`);
  let last = 0;
  const man = await buildCodex(
    { galaxySeed: WORLD_SEED >>> 0, depth: want.depth, density: want.density },
    p => {
      if (p.phase === 'cached') {
        tick(`Archive read from disk — ${p.total} systems`, 'ok');
        setProgress(interactive ? 1 : 0.82);
        return;
      }
      setProgress((interactive ? 0.02 : 0.12) + (p.done / p.total) * (interactive ? 0.96 : 0.7));
      // Every chunk names the system it just finished. It is the cheapest possible way to
      // make a progress bar feel like it is doing something specific rather than counting.
      if (p.system && p.done - last >= 16) {
        last = p.done;
        tick(`Charting ${p.done}/${p.total} — ${p.system.name} · ${p.system.star.className}` +
             `, ${p.system.planets} worlds, ${p.system.belts.length} fields`);
      }
    });
  if (man) tick(`${man.depth} systems charted · density ${man.density.toFixed(1)}`, 'ok');
  setArchiveLine(archiveLine(man));
  if (interactive) { setProgress(1); finishLoading(); }
  return man;
}

/** The boot pass: archive, model, roster — in that order, none of them fatal. */
async function runLoadSequence() {
  const want = genSettings();
  setHeadline('Waking the navigation core', versionString());
  note('Instrument bus online', 'ok');
  setProgress(0.06);

  const d = $('load-durable');
  if (d) d.textContent = durable() ? 'archive: on disk' : 'archive: memory only';
  if (!durable()) note('No durable storage — the archive will not survive this session.', 'warn');

  // The model, started first and awaited never. A hundred megabytes on a first visit must
  // not be between the player and the menu; see `AVATAR.bootModel` for why it is the 135M.
  if (AVATAR.autoLoad) {
    initAssistant(onModelStatus);
    note(`Reaching for the ${AVATAR.bootModel.replace('smollm2-', '').toUpperCase()} model…`);
    try { loadModel(AVATAR.bootModel); } catch (e) { note('Model unavailable — rule-based ARIA.', 'warn'); }
  }

  try {
    await runArchive(want, false);
  } catch (e) {
    // A failed archive is a slower galaxy, not a broken one — systems are still generated
    // on arrival exactly as they were before this feature existed.
    note('Archive failed — systems will be generated on arrival.', 'warn');
  }
  setProgress(0.86);

  note('Reading the pilot roster…');
  let pilots = [];
  try { pilots = await refreshRoster(); } catch (e) { pilots = []; }
  tick(pilots && pilots.length
    ? `${pilots.length} pilot${pilots.length === 1 ? '' : 's'} on file`
    : 'No pilots on file — a new one at power-up', 'ok');

  setProgress(1);
  setHeadline('Ready', 'Choose a pilot, or power up');
  note('Ready.', 'ok');
  finishLoading();
}

/** Model progress, into the same feed everything else reports to. */
let lastModelPct = -1;
function onModelStatus(s) {
  if (!s) return;
  if (s.kind === 'loading') {
    const pct = s.pct || 0;
    if (pct === lastModelPct) return;
    lastModelPct = pct;
    note(`Model ${pct}%${s.file ? ' · ' + s.file : ''}`);
  } else if (s.kind === 'ready') {
    note(`Model online (${s.device}${s.params ? ', ' + s.params : ''}) — ARIA is thinking for herself.`, 'ok');
  } else if (s.kind === 'error') {
    note(`Model unavailable (${s.msg}) — ARIA stays rule-based, which answers everything.`, 'warn');
  } else if (s.kind === 'nofallback') {
    note('No worker support — ARIA stays rule-based.', 'warn');
  }
}

/** A row on the roster was tapped: make that pilot the flight and start it. */
function resumeFromRoster(id) {
  if (booted) return;
  resumePilot(id).then(okLoaded => {
    if (!okLoaded) { status0('That pilot could not be resumed.'); return; }
    refreshRoster();
    resumeAudio();
    // The pilot's own galaxy placement is in the save that was just restored, so the boot
    // path takes the resumed-flight branch and reopens the system they were in.
    finishBoot(savedSeed() ?? WORLD_SEED, 0, false);
  });
}

function finishBoot(seed, age, online, serverDensity) {
  if (booted) return;
  booted = true;

  // phase 2 — the world itself
  //
  // **Where in the galaxy this is.** Since v1.02.44 the rendered system is a node on a real
  // chart rather than an unplaced seed — the galaxy stopped being a library and became a fact
  // about the world, which is the only honest way to have one.
  //
  // A resumed flight uses the placement it was saved with, and its own system seed, untouched.
  // A new game picks a home node and *derives* the seed from it, so the very first system a
  // player sees is somewhere on the map with a designation and neighbours in jump range.
  // **Online, the server's galaxy is law.** The first real two-device session found the
  // hole: a resumed save kept its OWN galaxy seed, so two pilots on one server flew two
  // different galaxies — same node numbers, different skies — and "we don't show up for
  // each other" had no visible cause. A save made in another galaxy is now *relocated*:
  // everything aboard is kept (the ship, the hold, the account are the save's), but the
  // placement is re-derived in the server's galaxy, starting at its home node, and the
  // player is told in words. Solo play is untouched.
  const placed = savedGalaxy();
  if (placed && online && (placed.seed >>> 0) !== (seed >>> 0)) {
    const gseed = seed >>> 0;
    const home = homeNode(gseed);
    S.galaxy = { seed: gseed, node: home.i };
    S.seed = home.seed;
    toast(`This flight was made in another galaxy — relocated to ${designation(home)}. Everything aboard came with you.`, 9000);
  } else if (placed) {
    S.galaxy = placed;
    S.seed = seed >>> 0;                       // the system this save has always been in
  } else {
    const gseed = seed >>> 0;
    const home = homeNode(gseed);
    S.galaxy = { seed: gseed, node: home.i };
    seed = home.seed;                          // the system seed is now derived, not given
    S.seed = home.seed;
  }
  S.seed = S.seed >>> 0;
  seedWorld(S.seed);
  // The system itself, before anything is built out of it.
  //
  // A resumed flight keeps the layout it was written in — a save from before v1.02.33 says
  // 'solaris' and gets the authored twelve worlds, because everything it remembers about
  // the world is keyed by name. A new game generates. `planFor` is deterministic, so the
  // same seed produces the same system on every device and on every load, which is also
  // what makes a shared galaxy agree with itself.
  // Density is an *argument* to generation, so a resumed flight uses the one it was written
  // with and a new one uses whatever the menu is set to. Getting this backwards would move
  // the worlds under a returning player the first time they touched the slider — the same
  // failure the layout field was added to prevent in v1.02.33, one field along.
  // Online, density and layout are server law for the same reason the seed is: they are
  // generation *inputs*, and two pilots in one system with different inputs stand in
  // different worlds while the room believes they share one. Solo keeps the old rules.
  const density = online
    ? (serverDensity ?? 1.4)
    : (hasSave() && savedDensity() != null ? savedDensity() : genSettings().density);
  const layout = online ? 'procedural' : (savedLayout() || 'procedural');
  S.systemPlan = planFor(S.seed, layout, { density });
  S.systemPlan.density = density;
  // The mismatch is now acted on rather than merely recorded. Schema 18 has stored the
  // generator version since v1.02.33 precisely so this could be detected, and for nine patches
  // nothing looked at it — a detection mechanism nobody read is the same as no mechanism.
  const gw = genesisWarning(GENESIS_VERSION);
  if (gw) toast(gw, 7000);
  // The designation is attached to the plan rather than recomputed wherever it is printed —
  // one place that knows where this system is, so the HUD, the chart header and the telemetry
  // cannot disagree about it.
  S.systemPlan.designation = designation(nodeAt(S.galaxy.seed, S.galaxy.node));
  createSkybox();
  createStarfield();
  createDust();
  createSystem();
  createAsteroids();
  // After the bodies exist and before anything flies: a shell is built from `wellRadius()` of
  // a body that has to be there to have a radius. No teardown is needed on the new-game path
  // because `restartForNewGame()` reloads the page, and `buildWells()` clears its own shells
  // before rebuilding them, so a re-entered system does not double up.
  buildWells();
  createNpcs();
  // The other nine hundred and fifty. After the authored cast and after the stations,
  // because lanes are drawn between berths that have to exist to be drawn between — and
  // from its own RNG stream, so the roster above is byte-identical to what it was.
  resetShoal();
  createShoal();
  resetReputation();       // defaults; a save overwrites them below
  // The diagnostic log is world state, not application state. Before schema 17 it lived
  // on globalThis and a new game inherited the previous one's record of who did what.
  resetDiagnostics();
  // The radio's anti-repetition memory is world state too — a new game should not start
  // mid-way through the previous one's rotation of phrasings.
  resetGrammarMemory();
  resetAutopilot();
  resetGroupwork();
  // ARIA's tactical picture holds a derivative map keyed by hull, and her advisory file
  // holds cases raised against a fit that no longer exists. Both are per-flight state, and
  // both are the kind of thing that would otherwise leak one game into the next.
  resetSweep();
  resetAdvisor();
  resetHabitat();
  resetCrewTalk();
  // Who we have spoken to is per-flight: a new game should not open a channel to a stranger
  // and be greeted as an old friend.
  resetParley();
  abortConn(true);
  initWorldSim();
  initMarket();
  initContracts();
  initCommsSystem();
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
  refreshSystemName();  // the top bar names whatever system the plan actually built
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
      // An executive gets the command deck, not a cockpit and not the station shop. They
      // have no hull to fit, no throttle to push and nothing to look at through a canopy;
      // the first thing they should see is the company they just registered.
      if (enterCommandSurface()) status(careerLine());
      else if (S.docked) openDock();
      saveGame(true);
      // File the new character. Until this runs they are a flight with a name on it; after
      // it they are a record that survives the next new game — which is the whole point of
      // `systems/platform/pilots.js`.
      parkPilot();
    });
    return;
  }

  S.running = true;
  // A restored save takes the same fork. The career is on the character, so a founder who
  // saved on the office deck two builds ago comes back to the deck rather than to a
  // cockpit reading a shuttle they never owned.
  enterCommandSurface();
  // Honour a saved mute: startMusic() refuses while muted, and setAudioEnabled puts the
  // master and the context into the state the flag claims they are in.
  setAudioEnabled(S.settings.audio);
  startMusic();
  status(online ? 'Linked — shared system' : restored ? 'Flight restored' : 'Navigation core online');
  // Name the system on arrival. On a generated one this is the only place the player finds
  // out what they are looking at, and on a restored Solaris flight it reads as the header
  // it has always implicitly been.
  if (!restored) setTimeout(() => status(systemLine(S.systemPlan)), 2600);
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
  // Before the live roster steps, not after. `updateShoal` is what promotes a record into a
  // hull, and a hull promoted after `updateNpcs` has run spends its first frame in the world
  // without having been given a chance to think — which is one frame of a ship sitting
  // perfectly still with its nose pointed nowhere, right at the moment it comes into view.
  updateShoal(dt);
  threat = updateNpcs(dt) || threat;
}

function phaseCombat(dt) {
  updateProjectiles(dt);
  updateCombat(dt);
  // Particles step with the simulation and are *written* to the GPU here, once, for every
  // emitter in the game. Inside the sim phase rather than the render phase deliberately: an
  // executive's render is skipped entirely (see the gate below) and a spark that kept
  // integrating while nothing drew it would burn CPU to produce nothing. `updateParticles`
  // does both halves, and when the deck is up the whole call is skipped with the render.
  if (!execHudActive() && !galaxyMapOpen()) {
    updateParticles(dt);
    // Wells chase their bodies on a slow cadence and the field buffer repacks only when
    // something actually changed — a frame in which nothing moved past a threshold costs
    // one boolean. Same gate as the particles: nobody is looking at the world from the deck.
    refreshWells(dt);
    updatePointField();
  }
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
  // One walk of the roster per frame, not three.
  const hit = fleetUnderFire();
  setFleetAlert(hit ? hit.name : null, hit ? hit.hullFrac : null);
  updateCrew(dt);
  // ...and the people aboard saying something about all of it. One decision per frame and
  // a rate limiter in front of it; see systems/crew/crew-talk.js.
  updateCrewTalk(dt);
  updateMissions();
  // Before `updateContracts`, and the order matters. The boardroom copies what a company
  // hull has actually delivered onto the contract that hired it; `updateContracts` is what
  // then completes and pays it. Reversed, every tendered contract would settle one frame
  // late — invisible, but the kind of off-by-one that turns into a real bug the first time
  // something else depends on the ordering.
  updateBoardroom();
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
  // Arrays and hydroponics. Before the autopilot, because the drive lock the arrays impose
  // is an input to what ARIA is allowed to decide this frame rather than a consequence of
  // it — see systems/industry/habitat.js.
  updateHabitat(dt);
  // A mining run that had to warp first finishes here, when the drive drops out. One
  // integer compare when nothing is pending, which is almost always.
  tickTools(dt);
  // ARIA at the stick. Before `updateTargeting` so a lock she just took is drawn this frame
  // rather than next — a reticle one frame behind the decision reads as a stutter.
  updateAutopilot(dt);
  // Who is working near whom. On its own timer inside; this is one add and a compare.
  updateGroupwork(dt);
  updateTargeting();
}

function phaseNet(dt) { updateNet(dt); }

function phaseUi(dt) {
  setThreat(!!threat.threat, !!threat.lockedOn);
  // The command surface has no flight HUD to update. `updateHud` would otherwise spend
  // its whole write budget every frame diffing seventy fields against elements that are
  // `display:none` — correct, invisible, and the single largest per-frame cost left on
  // the screen an executive actually looks at.
  if (execHudActive()) tickExecDeck(dt);
  else updateHud(dt);
  // Before the chart, and cheap when suppressed: the overlay clears itself and returns as
  // soon as there is no canopy to draw on (docked, warping, on the command deck).
  updateMarkers(dt);
  // The handoff, if one is playing. It aborts itself the moment the
  // autopilot stops, so nothing here has to know why she stopped.
  tickConn(dt);
  tickNavmap(dt);
  // Cheap when the file is shut — one boolean — and it only re-derives the player's own
  // record, at 1.5 s, so a screen left open while the fleet earns does not go stale.
  tickDossier(dt);
  tickBoardroom(dt);
  // The chart draws its own scene into the shared renderer, and the world render is skipped
  // while it is up — see the gate below. Exactly one scene is drawn per frame, never two.
  tickGalaxyMap(dt);
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

let parkT = 0;

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
  // The pilot database is a *copy* of the flight slot, refreshed on a slow cadence — see
  // the header of `systems/platform/pilots.js` for why the flight slot stays the master.
  // Two minutes rather than thirty seconds because this one is an IndexedDB write and a
  // full snapshot, and nothing is lost by it being behind: the flight slot is what a crash
  // comes back to.
  parkT += frameDt;
  if (parkT >= 120) { parkT = 0; if (S.running) parkPilot(); }

  guard('audio', updateAudio, frameDt);

  // The render gate.
  //
  // An executive is not in a ship and is not looking through a canopy, so there is no
  // camera view worth producing: the command deck is DOM, and the chart is its own 2D
  // canvas that draws itself in `tickNavmap`. Drawing the 3D scene behind either of them
  // is work whose entire output is discarded by a `display:none`.
  //
  // The simulation is untouched — the world above this line has already stepped. Only
  // *presentation* is skipped, which is the whole of what "detached from the main game"
  // has to mean for it to be safe: the galaxy keeps living, nobody is rendering it.
  if (!execHudActive() && !galaxyMapOpen()) {
    // Presentation, in order. Quality decides how much work the frame is allowed, LOD
    // decides which meshes take part, interpolation decides where they are drawn — and
    // then the authoritative transforms go straight back, so nothing downstream ever
    // reads a smoothed position as truth.
    guard('quality', updateQuality, frameDt);
    guard('lod', () => updateLod(innerHeight));
    guard('lights', updateLightRig, frameDt);

    applyInterpolation(clock.alpha);
    render();
    restoreAfterRender();
  }

  sample(nowMs() - t0);
}

// Handy while tuning from the console: LG.S, LG.camera, LG.perf(), LG.diagnostics()
window.LG = {
  S, camera, openDock, saveGame,
  build: BUILD, version: VERSION,
  clock, perf: perfStats, resetClock, hudStats, invalidateHud,
  quality: qualityState, setQuality: setQualityLevel, autoQuality: setAuto,
  lights: lightRigReport,
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
  // The system, from the console. `LG.system.plan()` is the whole generated description;
  // `LG.system.preview(n)` generates a seed's system *without* building it, which is how
  // you look at a hundred seeds without loading a hundred games.
  system: { plan: () => S.systemPlan, line: () => systemLine(S.systemPlan),
            preview: n => generateSystem(n >>> 0), solaris: solarisPlan },
  // The executive surface, from the console: LG.exec.active() answers "is the renderer
  // parked", which is otherwise invisible and is exactly what you want to check first
  // when a founder reports a black screen.
  exec: { active: execHudActive, show: showDeck, hide: hideDeck,
          isExecutive, canPilot, line: careerLine, chartOpen: navmapOpen },
  managers: managersReport, auditions, installManager,
  experimental: setExperimental, experimentalOn,
  save: { info: saveInfo, export: exportSave, import: importSave, restore: restoreBackup, wipe: wipeSave }
};
