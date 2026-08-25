// v1.00.31 — interlocks, onboarding, comms, companies and the experimental managers.
//
// The headline case is the first block: a ship with nothing bolted on must not shoot.
// That was a real bug in 1.00.30 and it survived eighteen suites, because every suite
// that fired a weapon relied on the same fallback that caused it.
import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { S, recalcStats, seatWeapon, defaultWeaponKey } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');
const { initScene } = await imp('world/scene.js');
const { createSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { createNpcs } = await imp('entities/npcs.js');
const { initAudio } = await imp('systems/platform/audio.js');
const { initHud } = await imp('ui/hud.js');
const { updateWeapons } = await imp('systems/combat/weapons.js');
const { activeProjectiles, initProjectiles } = await imp('systems/combat/projectiles.js');
const { initCombat } = await imp('systems/combat/combat.js');
const { initMining } = await imp('systems/industry/mining.js');
const { initPlayerFx } = await imp('entities/player.js');
const PF = await imp('systems/platform/preflight.js');
const TU = await imp('systems/platform/tutorial.js');
const CM = await imp('systems/npc/comms.js');
const CO = await imp('systems/company/company.js');
const MG = await imp('systems/company/managers.js');
const WS = await imp('systems/platform/worldsim.js');
const PL = await imp('systems/industry/planetary.js');
const CH = await imp('systems/crew/character.js');
const O = await imp('data/origins.js');
const { MANAGER_ARCHETYPES, MANAGER_KEYS } = await imp('data/npc-kb/managers.js');
const { BRANCH_KEYS, BRANCH_FOR_CAREER } = await imp('data/planetary/branches.js');
const { TUTORIAL, COMMS, MANAGERS } = await imp('core/config.js');
const { SCHEMA } = await imp('core/version.js');
const save = await imp('systems/platform/save.js');
const CR = await imp('systems/industry/crafting.js');

initScene();
seedWorld(20260806);
recalcStats();
initProjectiles();
initCombat();
initMining();
initPlayerFx();
createSystem();
createAsteroids();
createNpcs();
initAudio();
initHud();
initWorld();
function initWorld() { WS.initWorldSim(); CM.initCommsSystem(); }
S.running = true;

// ── interlocks ───────────────────────────────────────────────────────
console.log('\n— the gun that was not there —');
{
  S.player.classKey = 'military';
  S.fit = { weapon: [null, null, null], utility: [], core: [] };
  S.weapon = 'pulse';                 // owned, deliberately not mounted
  recalcStats();

  ok('an empty rack reports no mounts', (S.stats.mounts || []).length === 0);
  ok('weaponDef is null rather than an invented gun', S.stats.weaponDef === null,
     String(S.stats.weaponDef));
  ok('preflight refuses with a nameable code', PF.canFire().code === 'nofit');
  ok('armed() is false', PF.armed() === false);

  const before = activeProjectiles();
  S.input.firing = true;
  S.player.energy = 100;
  S.time += 5;
  for (let i = 0; i < 40; i++) { S.time += 1 / 60; updateWeapons(1 / 60); }
  S.input.firing = false;
  ok('holding the trigger on an empty rack spawns nothing',
     activeProjectiles() === before, `${before} → ${activeProjectiles()}`);

  ok('seatWeapon installs into the first free hardpoint', seatWeapon('pulse') === 0);
  ok('the fit now reports one mount', S.stats.mounts.length === 1);
  ok('weaponDef follows hardpoint one', S.stats.weaponDef.name === 'Pulse laser');
  ok('preflight clears the trigger', PF.canFire().ok === true, PF.canFire().code);

  S.input.firing = true;
  S.player.energy = 100;
  for (let i = 0; i < 40; i++) { S.time += 1 / 60; updateWeapons(1 / 60); }
  S.input.firing = false;
  ok('an armed ship does fire', activeProjectiles() > before,
     `${before} → ${activeProjectiles()}`);
}

console.log('\n— every critical action has a gate —');
{
  ok('defaultWeaponKey resolves for every hull',
     ['military', 'industrial', 'logistics', 'economic', 'civilian']
       .every(k => !!defaultWeaponKey(k)));

  S.docked = { userData: { name: 'test' } };
  ok('docked blocks firing', PF.canFire().code === 'docked');
  ok('docked blocks mining', PF.canMine().code === 'docked');
  ok('docked blocks warp', PF.canWarp().code === 'docked');
  S.docked = null;

  S.sim.disabled = { t: 0 };
  const r = PF.interlockReport();
  ok('a disabled ship fails every interlock at once',
     !r.fire.ok && !r.mine.ok && !r.warp.ok && !r.dock.ok,
     [r.fire.code, r.mine.code, r.warp.code, r.dock.code].join(','));
  ok('interlockLine names what is offline', PF.interlockLine().length > 0, PF.interlockLine());
  S.sim.disabled = null;

  const hullWas = S.player.hull;
  S.player.hull = S.stats.hullMax * 0.05;
  ok('a wrecked hull locks the cutter out', PF.canMine().code === 'hull', PF.canMine().code);
  S.player.hull = hullWas;

  const eWas = S.player.energy;
  S.player.energy = 0;
  ok('flat batteries block warp', PF.canWarp().code === 'energy');
  ok('flat batteries block the cutter', PF.canMine().code === 'energy');
  S.player.energy = eWas;

  S.probes = 0;
  ok('no probes blocks a probe drop', PF.canProbe().code === 'noprobes');
  S.probes = 2;

  ok('scan needs a target', PF.canScan(null).code === 'notarget');

  // a launcher-only fit with no lock
  S.fit = { weapon: ['torpedo', null, null], utility: [], core: [] };
  recalcStats();
  S.target = null;
  const v = PF.canFire();
  ok('a launcher-only fit with no lock says so', !v.ok && v.code === 'nolock', v.code);
  S.fit = { weapon: ['pulse', null, null], utility: [], core: [] };
  recalcStats();
}

console.log('\n— refusals do not spam —');
{
  PF.resetAnnounce();
  S.time = 1000;
  const v = { ok: false, code: 'nofit', reason: 'No weapon fitted' };
  ok('the first refusal speaks', PF.announce(v) === true);
  ok('an immediate repeat is swallowed', PF.announce(v) === false);
  S.time += TUTORIAL ? 5 : 5;
  ok('it speaks again once the window passes', PF.announce(v) === true);
}

// ── onboarding ───────────────────────────────────────────────────────
console.log('\n— training —');
{
  S.tutorial = null;
  TU.startTutorial();
  const s0 = TU.tutorialState();
  ok('training starts at stage one', s0.active && s0.index === 0);
  ok('stage one is about arming the ship', s0.id === 'arm');
  ok('there are stages to run', TU.stageCount() >= 5, String(TU.stageCount()));

  // the ship is already armed from the block above, so stage one closes on the next check
  TU.updateTutorial(TUTORIAL.checkInterval + 0.1);
  ok('an already-satisfied stage closes immediately', TU.tutorialState().index === 1,
     String(TU.tutorialState().index));

  // walk it to the end by satisfying nothing and forcing stages
  let guard = 0;
  while (!TU.tutorialDone() && guard++ < 40) {
    const st = TU.tutorialState();
    if (st.id === 'fly') S.player.position.x += 4000;
    if (st.id === 'lock') S.target = { obj: { position: S.player.position }, kind: 'ship', name: 'x' };
    if (st.id === 'mine') S.cargo.ore += 500;
    if (st.id === 'sell') S.credits += 5000;
    if (st.id === 'crew') TU.tutorialEvent('crew');
    if (st.id === 'threat') TU.tutorialEvent('comms');
    TU.updateTutorial(TUTORIAL.checkInterval + 0.1);
  }
  ok('training completes', TU.tutorialDone(), `after ${guard} passes`);
  ok('completion asks a question rather than just ending', TU.awaitingChoice() === true);
  ok('continuing is an answer', TU.finish('continue').outcome === 'continue');
  ok('the question is closed once answered', TU.awaitingChoice() === false);

  S.tutorial = null;
  TU.startTutorial();
  ok('a new-game answer is reported to the caller', (TU.finish('newgame')).outcome === 'newgame');

  S.tutorial = null;
  TU.startTutorial();
  TU.skipTutorial();
  ok('skipping ends it for good', TU.tutorialDone() && !TU.tutorialActive());
}

// ── the contract on you ──────────────────────────────────────────────
console.log('\n— nobody hunts a nobody —');
{
  S.sim.playerContract = null;
  S.sim.trespass = 0;
  S.player.kills = 0;
  S.playtime = 30;
  S.credits = 50000;                  // the old rule fired on this alone
  S.tutorial = { active: false, done: true };
  ok('a rich but harmless pilot is not worth hunting', WS.playerEligible() === false);

  S.playtime = TUTORIAL.graceContract + 10;
  ok('time alone is not enough without a record', WS.playerEligible() === false);

  S.sim.trespass = TUTORIAL.minNotoriety;
  ok('time plus a record makes you eligible', WS.playerEligible() === true);

  S.playtime = 5;
  S.sim.trespass = 0;
  S.player.kills = TUTORIAL.graceKills;
  ok('kills short-circuit the clock', WS.playerEligible() === true);

  S.tutorial = { active: true, done: false };
  ok('training is a hard shield', WS.playerEligible() === false);
  S.tutorial = { active: false, done: true };

  S.sim.playerContract = { merc: null };
  ok('you cannot be double-booked', WS.playerEligible() === false);
  S.sim.playerContract = null;
  S.player.kills = 0;
}

// ── comms ────────────────────────────────────────────────────────────
console.log('\n— the radio —');
{
  CM.initCommsSystem();
  ok('the log starts empty', CM.commsLog().length === 0);

  CM.transmit({ from: 'Test', faction: 'neutral', text: 'anyone on this band' });
  ok('a transmission lands', CM.commsLog().length === 1);
  ok('it counts as unread', CM.unread() === 1);
  CM.markRead();
  ok('reading clears the badge', CM.unread() === 0);

  for (let i = 0; i < COMMS.maxLog + 40; i++) CM.transmit({ from: 'x', text: 'line ' + i });
  ok('the log is bounded', CM.commsLog().length <= COMMS.maxLog, String(CM.commsLog().length));

  const before = { ...S.reputation };
  const h = CM.hail({
    from: 'Merc', faction: 'hostile', text: 'stop your engines', key: 'k1',
    options: [{ label: 'Refuse', say: 'no', effect: { standing: { independent: 3 }, answer: 'figured' } }]
  });
  ok('a hail opens a reply window', !!h && !!CM.pending());
  ok('a second hail from the same source is on cooldown',
     CM.hail({ from: 'Merc', text: 'again', key: 'k1', options: [] }) === null);
  CM.reply(0);
  ok('replying closes the window', CM.pending() === null);
  ok('a reply moves standing', S.reputation.independent !== before.independent,
     `${before.independent} → ${S.reputation.independent}`);
  const tail = CM.commsLog().slice(-2);
  ok('both sides are in the log', tail.some(e => e.kind === 'you') && tail.some(e => e.kind === 'reply'));

  CM.hail({ from: 'Other', text: 'well?', key: 'k2', options: [{ label: 'a', say: 'a' }] });
  ok('silence is always an option', CM.reply(-1) === true && CM.pending() === null);

  CM.hail({ from: 'Third', text: 'hello?', key: 'k3', options: [{ label: 'a', say: 'a' }] });
  S.time += COMMS.replyWindow + 5;
  CM.updateComms(0.5);
  ok('a reply window expires', CM.pending() === null);

  ok('ships within range are countable', typeof CM.commsReport().inRange === 'number');
  // The canned hails moved to systems/npc-brain.js in v1.00.32 — they are built from a
  // persona now rather than from a fixed string. Covered properly in test/avatar.mjs.
}

// ── companies ────────────────────────────────────────────────────────
console.log('\n— the executive start —');
{
  ok('executive is a career', !!O.CAREERS.executive);
  ok('it has an agent', !!O.AGENTS[O.CAREERS.executive.agent]);
  ok('it maps to a branch', BRANCH_KEYS.includes(BRANCH_FOR_CAREER.executive));
  ok('the branch count is unchanged', BRANCH_KEYS.length === 5);

  const c = CH.createCharacter({ name: 'Founder', lineage: 'core', corp: 'meridian', career: 'executive' });
  ok('an executive pilot is created', !!c && c.career === 'executive');
  ok('creation seats the career weapon', PF.armed() === true,
     (S.stats.mounts || []).map(w => w.name).join(','));
  ok('a company exists', CO.hasCompany() === true);

  const r0 = CO.companyReport();
  ok('the treasury is not the wallet', r0.treasury > 0 && r0.treasury !== S.credits);
  ok('the founder does not hold all of it', r0.ownership > 0.5 && r0.ownership < 1);
  ok('there is a board', r0.board.length === 3);

  const t0 = r0.treasury;
  CO.book(4000, r0.charterKey);
  ok('in-charter revenue books at a premium', CO.companyReport().treasury > t0 + 4000);
  CO.book(-1000);
  ok('spend comes off the treasury', CO.companyReport().spend >= 1000);

  S.credits = 10000;
  ok('capital can be put in', CO.transfer(5000) === true && S.credits === 5000);
  ok('an oversized draw is refused', CO.transfer(-9e9) === false);
  ok('funding fails when short', CO.fund(9e9) === false);
  ok('confidence is bounded', CO.confidence() >= 0 && CO.confidence() <= 1);
}

// ── managers ─────────────────────────────────────────────────────────
console.log('\n— automated subsystems (experimental) —');
{
  ok('there is one archetype per branch', MANAGER_KEYS.length === BRANCH_KEYS.length);
  ok('every branch has an archetype', BRANCH_KEYS.every(b => !!MANAGER_ARCHETYPES[b]));
  ok('no two archetypes share an objective',
     new Set(MANAGER_KEYS.map(k => MANAGER_ARCHETYPES[k].objective)).size === MANAGER_KEYS.length);
  ok('no two archetypes share a policy order',
     new Set(MANAGER_KEYS.map(k => MANAGER_ARCHETYPES[k].policies.join('>'))).size === MANAGER_KEYS.length);
  ok('every archetype weights its own objective highest',
     MANAGER_KEYS.every(k => {
       const w = MANAGER_ARCHETYPES[k].weights;
       const max = Math.max(...Object.values(w));
       return Object.values(w).filter(v => v === max).length === 1;
     }));

  ok('the branch is off by default', MG.enabled() === false);
  ok('installing while off is refused', MG.installManager(1, 'industrial') === null);

  MG.setExperimental(true);
  ok('the flag turns on', MG.enabled() === true && S.settings.experimental === true);

  // a real site to manage
  S.sites = [];
  const body = { userData: { kind: 'planet', name: 'Testworld', ptype: 'barren' } };
  CR.restoreCrafting(null);
  for (const m of ['REF-001', 'REF-002', 'REF-003', 'REF-004', 'REF-009', 'REF-011',
                   'CMP-001', 'CMP-002', 'CMP-003', 'CMP-004', 'CMP-005', 'CMP-009'])
    CR.addMaterial(m, 50000);
  const { COMMAND_CENTRES } = await imp('data/planetary/centres.js');
  const centreKey = Object.keys(COMMAND_CENTRES)
    .find(k => COMMAND_CENTRES[k].worlds.includes('barren'));
  const site = PL.foundSite(body, centreKey);
  ok('a site exists to manage', !!site);

  if (site) {
    site.buildRemaining = 0;
    const aud = MG.auditions(site.id);
    ok('every archetype auditions', aud.length === MANAGER_KEYS.length);
    ok('auditions carry a first move', aud.every(a => typeof a.firstMove === 'string'));
    ok('archetypes disagree about the same site',
       new Set(aud.map(a => a.score.toFixed(4))).size > 1,
       aud.map(a => `${a.name} ${a.score.toFixed(2)}`).join(' · '));

    S.credits = 100000;
    const m = MG.installManager(site.id, 'industrial');
    ok('a manager can be hired', !!m && MG.managerCount() === 1);
    ok('hiring costs credits', S.credits === 100000 - MANAGERS.hireCost);
    ok('a second manager on the same site is refused', MG.installManager(site.id, 'economic') === null);

    MG.setAutonomy(site.id, 0);
    ok('autonomy can be lowered to advisory', MG.managerReport(site.id).autonomy === 0);

    for (let i = 0; i < MANAGERS.optimiseEvery + 2; i++) MG.updateManagers(MANAGERS.tickHours + 0.01);
    const rep = MG.managerReport(site.id);
    ok('the manager runs passes', rep.passes > 0, String(rep.passes));
    ok('every logged action carries the policy that caused it',
       rep.actions.every(a => !!a.why));
    ok('an advisory manager only advises',
       rep.actions.every(a => a.advisory || !a.applied) || rep.actions.length === 0);

    MG.setAutonomy(site.id, 3);
    for (let i = 0; i < 3; i++) MG.updateManagers(MANAGERS.tickHours + 0.01);
    ok('a full-autonomy manager is allowed to act', MG.managerReport(site.id).autonomy === 3);

    ok('dismissal works', MG.dismissManager(site.id) === true && MG.managerCount() === 0);
  }

  MG.setExperimental(false);
  ok('an inert manager table costs nothing', (MG.updateManagers(10), true));
}

// ── persistence ──────────────────────────────────────────────────────
console.log('\n— it all survives a save —');
{
  ok('the schema is current', SCHEMA >= 16);

  MG.setExperimental(true);
  S.tutorial = null;
  TU.startTutorial();
  CM.initCommsSystem();
  CM.transmit({ from: 'Archive', text: 'this should still be here' });

  const snap = save.snapshot();
  ok('the payload carries training', !!snap.tutorial);
  ok('the payload carries the log', !!snap.comms && snap.comms.log.length > 0);
  ok('the payload carries the company', !!snap.company);

  ok('training restores', TU.restoreTutorial(snap.tutorial) === true && TU.tutorialActive());
  ok('the log restores', CM.restoreComms(snap.comms) === true &&
     CM.commsLog().some(e => e.text === 'this should still be here'));
  ok('a pending hail is deliberately not restored', CM.pending() === null);
  ok('the company restores', CO.restoreCompany(snap.company) === true && CO.hasCompany());

  // a v7 save has none of this and must not be handed a tutorial mid-career
  const legacy = JSON.parse(JSON.stringify(snap));
  delete legacy.tutorial; delete legacy.comms; delete legacy.company; delete legacy.managers;
  delete legacy.brains;
  legacy.v = 7;
  const up = save.migrate(legacy);
  ok('a v7 save migrates to current', up && up.v === SCHEMA);
  ok('an existing pilot is not made to sit through training',
     up.tutorial.done === true && up.tutorial.active === false);
  ok('migration invents no company or log', up.company === null && up.comms === null);

  MG.restoreManagers({ 99: { siteId: 99, branch: 'industrial', autonomy: 1 } });
  S.sites = [];
  MG.reconcileManagers();
  ok('a manager whose site is gone is dropped', MG.managerCount() === 0);

  MG.restoreManagers({ 1: { siteId: 1, branch: 'not-a-branch' } });
  ok('a manager with an unknown archetype is dropped', MG.managerCount() === 0);

  MG.setExperimental(false);
}

// ── the panels boot ──────────────────────────────────────────────────
// Neither of the new views is exercised by any other suite, and an initialiser that
// throws on a missing element takes the whole boot with it.
console.log('\n— the new panels come up —');
{
  const CUI = await imp('ui/comms.js');
  const TUI = await imp('ui/tutorial.js');
  let threw = null;
  try {
    CUI.initComms();
    TUI.initTutorial(() => {});
  } catch (e) { threw = e; }
  ok('both panels initialise without throwing', threw === null, threw && threw.message);

  threw = null;
  try {
    CM.transmit({ from: 'Panel', text: 'render me' });
    CUI.openComms();
    CUI.render();
    CUI.tickComms();
    CM.hail({ from: 'Panel', text: 'answer me', key: 'panel',
              options: [{ label: 'sure', say: 'sure' }] });
    CUI.render();
    CUI.tickComms();
    CUI.closeComms();
  } catch (e) { threw = e; }
  ok('the comms panel renders a log and a reply row', threw === null, threw && threw.message);
  ok('opening comms marks the training stage seen', !!(S.tutorial && S.tutorial.sawComms));

  threw = null;
  try {
    S.tutorial = null;
    TUI.offerTutorial();
    TUI.render();
    TUI.reopenTutorial();
  } catch (e) { threw = e; }
  ok('the training card renders', threw === null, threw && threw.message);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
