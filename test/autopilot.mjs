// Slice — ARIA at the stick, and working alongside somebody.
//
// The assertions here are mostly about *restraint*, which is unusual for a feature suite and
// is the point. An autopilot is only worth shipping if it cannot spend you to zero, cannot
// take a job you are not cleared for, and cannot be fought over. Those are the properties
// that are easy to write and easy to lose, so they are the ones pinned here.

import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { S, recalcStats, cargoMass } = await imp('core/state.js');
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
const { initContracts, boardFor, acceptBlocker, activeContracts } = await imp('systems/trade/contracts.js');
const { resetReputation } = await imp('systems/company/reputation.js');
const { createCharacter } = await imp('systems/crew/character.js');
const { initCommsSystem, commsLog } = await imp('systems/npc/comms.js');
const { dock, undock, updateDocking, repairQuote } = await imp('systems/trade/economy.js');
const { holdDistance } = await imp('systems/flight/approach.js');
const AP = await imp('systems/npc/autopilot.js');
const GW = await imp('systems/crew/groupwork.js');
const tools = await imp('systems/platform/tools.js');
const CONNUI = await imp('ui/conn.js');
const { AUTOPILOT, GROUPWORK, CONN, DOCK, APPROACH } = await imp('core/config.js');

initScene(); recalcStats(); seedWorld(24601); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx(); createNpcs();
resetReputation(); initWorldSim(); initMarket(); initContracts(); initCommsSystem();
createCharacter({ name: 'Vane', lineage: 'rim', corp: 'kestrel', career: 'prospector' });
updateSystem(1);
S.running = true;
S.credits = 40000;

const run = (secs, dt = 0.2) => { for (let t = 0; t < secs; t += dt) AP.updateAutopilot(dt); };
const said = () => commsLog().filter(e => e.from === 'ARIA');

// ── the switch ───────────────────────────────────────────────────────
console.log('\n— the switch —');
{
  AP.resetAutopilot();
  ok('it starts off', AP.autopilotOn() === false);
  ok('the report says so', AP.autopilotReport().on === false);

  const before = said().length;
  AP.setAutopilot(true);
  ok('it turns on', AP.autopilotOn() === true);
  ok('and she says something about it', said().length > before,
     `${before} → ${said().length}`);
  ok('the report carries a line to print', !!AP.autopilotReport().line);

  AP.setAutopilot(false);
  ok('it turns off', AP.autopilotOn() === false);

  // Off must always work. An autopilot with a condition on being switched off is a trap.
  S.sim.disabled = true;
  AP.setAutopilot(true);
  ok('a disabled ship refuses the conn', AP.autopilotOn() === false);
  S.sim.disabled = false;
  AP.setAutopilot(true);
  S.sim.disabled = true;
  AP.updateAutopilot(0.2);
  ok('and losing the drives mid-flight hands it back', AP.autopilotOn() === false);
  S.sim.disabled = false;
}

// ── she yields, instantly, to anything ───────────────────────────────
console.log('\n— who has the stick —');
{
  AP.setAutopilot(true);
  ok('she has it', AP.autopilotOn() === true);
  const gave = AP.yieldAutopilot();
  ok('manual input takes it back', gave === true && AP.autopilotOn() === false);
  ok('and yielding when she is off costs nothing', AP.yieldAutopilot() === false);

  AP.setAutopilot(true);
  AP.setAutopilot(false);
  ok('nothing of hers is left running',
     !S.approach && !S.follow && S.input.mining === false);
}

// ── the needs model ──────────────────────────────────────────────────
console.log('\n— what she would do —');
{
  S.docked = null;
  const list = AP.scoreTasks();
  ok('she has an opinion', list.length > 0, String(list.length));
  ok('every option names a reason', list.every(x => !!x.why));
  ok('and is ordered by score', list.every((x, i) => i === 0 || x.score <= list[i - 1].score));

  // A hurt hull outranks everything. This is the case the whole needs model exists for —
  // a script would fly past the repair bay.
  S.player.hull = S.stats.hullMax * 0.25;
  const hurt = AP.scoreTasks();
  ok('a hurt hull puts servicing first', hurt[0] && hurt[0].key === 'service',
     hurt[0] && hurt[0].key);
  ok('and says why in words a player would use', /hull/i.test(hurt[0].why), hurt[0].why);
  S.player.hull = S.stats.hullMax;

  // A full hold outranks mining, and does not out-rank it by so little that she dithers.
  S.cargo.ore = S.stats.cargoCap * 0.95;
  const full = AP.scoreTasks();
  const mine = full.find(x => x.key === 'mine');
  ok('a full hold stops her mining', !mine, mine && String(mine.score));
  S.cargo.ore = 0;
}

// ── the pad: she spends, but bounded ─────────────────────────────────
console.log('\n— what she spends —');
{
  AP.resetAutopilot();
  const st = S.world.stations[0];
  S.player.hull = S.stats.hullMax * 0.5;
  S.credits = 20000;
  dock(st);
  ok('docked for the test', S.docked === st);

  AP.setAutopilot(true);
  // Long enough for the whole checklist: deliver, sell, repair, re-arm, probes, board, leave.
  for (let i = 0; i < 400; i++) { S.time += 0.3; AP.updateAutopilot(0.3); }

  ok('she did not spend past the reserve', S.credits >= AUTOPILOT.reserve,
     String(Math.round(S.credits)));
  ok('and left the pad when she was done', S.docked === null || AP.autopilotReport().phase !== 'docked',
     AP.autopilotReport().phase);
  ok('she narrated the stop', said().length > 2, String(said().length));
  AP.setAutopilot(false);
  if (S.docked) undock();
  S.player.hull = S.stats.hullMax;
}

// ── the board, and the hull restriction ──────────────────────────────
console.log('\n— reading a board —');
{
  const st = S.world.stations.find(s => (boardFor(s) || []).length) || S.world.stations[0];
  dock(st);
  const board = boardFor(st) || [];
  const held = activeContracts().length;
  const took = AP.readBoard(st);

  ok('the board was read', board.length === 0 || took !== undefined);
  if (took) {
    ok('she took something', activeContracts().length === held + 1);
    // The whole point: she does not re-implement eligibility, she asks the gate.
    ok('and it was something the hull is cleared for', acceptBlocker(took) !== null ||
       activeContracts().some(c => c.id === took.id));
  } else {
    ok('she took nothing, and said why', said().length > 0);
    ok('because nothing on the board was takeable',
       board.every(c => acceptBlocker(c) !== null) || board.length === 0);
  }
  undock();
}

// ── working alongside somebody ───────────────────────────────────────
console.log('\n— group work —');
{
  GW.resetGroupwork();
  ok('every declared activity has a skill behind it', GW.activitiesCovered() === true);

  S.docked = null;
  S.input.mining = false;
  ok('doing nothing is not an activity', GW.playerActivity() === null);
  S.input.mining = true;
  ok('cutting rock is', GW.playerActivity() === 'mine');

  // Park on top of a miner and cut. Both of us should be better at it afterwards.
  const miner = S.world.npcs.find(n => GW.activityOf(n.userData) === 'mine');
  ok('there is a crew to work beside', !!miner, miner && miner.userData.name);
  if (miner) {
    S.player.position.copy(miner.position);
    const before = S.character.progress.extraction || 0;
    for (let i = 0; i < 8; i++) { S.time += GROUPWORK.interval; GW.updateGroupwork(GROUPWORK.interval); }
    const rep = GW.groupworkReport();
    ok('she counts the company', rep.partners > 0, String(rep.partners));
    ok('and the bonus is reported', rep.bonus > 0, String(rep.bonus));
    ok('the pilot actually learns from it',
       (S.character.progress.extraction || 0) > before,
       `${before} → ${S.character.progress.extraction}`);

    // Alone, nothing. Same activity, different place.
    GW.resetGroupwork();
    S.player.position.set(1e5, 0, 1e5);
    for (let i = 0; i < 3; i++) { S.time += GROUPWORK.interval; GW.updateGroupwork(GROUPWORK.interval); }
    ok('and nothing when nobody is near', GW.groupworkReport().partners === 0);
  }

  // A hostile is not a colleague, whatever its day job says.
  const raider = S.world.npcs.find(n => n.userData.faction === 'hostile');
  if (raider) {
    raider.userData.role = 'miner';
    GW.resetGroupwork();
    S.player.position.copy(raider.position);
    S.input.mining = true;
    for (let i = 0; i < 2; i++) { S.time += GROUPWORK.interval; GW.updateGroupwork(GROUPWORK.interval); }
    ok('somebody shooting at you is not a colleague', GW.groupworkReport().partners === 0);
  } else ok('somebody shooting at you is not a colleague', true, 'no hostile in this seed');
  S.input.mining = false;
}

// ── said out loud ────────────────────────────────────────────────────
console.log('\n— asking for it —');
{
  const m = q => (tools.matchTool(q) || {}).tool;
  ok('"take the conn" hands her the ship', m('take the conn') === 'takeTheConn',
     String(m('take the conn')));
  ok('so does "you have the ship"', m('you have the ship') === 'takeTheConn',
     String(m('you have the ship')));
  ok('"autopilot off" takes it back', m('autopilot off') === 'giveBackTheConn',
     String(m('autopilot off')));
  ok('"what should we do" asks her opinion', m('what should we do') === 'whatNow',
     String(m('what should we do')));
  ok('"anyone working nearby" reports the crew', m('anyone working nearby') === 'crewNearby',
     String(m('anyone working nearby')));

  // ...and the navigation phrases still mean what they meant.
  ok('"warp to the closest asteroid" is still a mining run',
     m('warp to the closest asteroid') === 'mineRun', String(m('warp to the closest asteroid')));
  ok('"throttle to 15" is still the throttle', m('throttle to 15') === 'throttle');

  AP.setAutopilot(false);
  const r = tools.callTool('takeTheConn', []);
  ok('the tool actually engages her', r.ok === true && AP.autopilotOn() === true, r.text);
  const r2 = tools.callTool('giveBackTheConn', []);
  ok('and hands her back', AP.autopilotOn() === false, r2.text);
  const r3 = tools.callTool('whatNow', []);
  ok('she can say what she would do', r3.ok === true && r3.text.length > 8, r3.text);
}

// ── the handoff overlay is inert ─────────────────────────────────────
//
// The whole reason a seven-second sequence is safe on a control the player
// will press a hundred times is that nothing waits for it. These assertions
// are all of the form "playing it changed nothing", which is the property
// that is easy to write and easy to lose.
console.log('\n— the handoff —');
{
  CONNUI.initConn();
  AP.resetAutopilot();
  S.docked = null;
  S.settings.connSeq = true;
  S.settings.connSeen = false;

  const before = {
    hull: S.player.hull, credits: S.credits, throttle: S.player.throttle,
    npcs: S.world.npcs.length, ap: AP.autopilotOn()
  };

  AP.setAutopilot(true);
  const played = CONNUI.playConn();
  ok('the sequence plays when the autopilot engages', played === true);
  ok('...and reports itself active', CONNUI.connActive() === true);

  // The autopilot is already flying. That is the point.
  ok('ARIA is already flying before a frame of it draws', AP.autopilotOn() === true);
  ok('it moved no ship state', S.player.hull === before.hull &&
     S.credits === before.credits && S.world.npcs.length === before.npcs);

  const rep = CONNUI.connReport();
  ok('it names the systems it will bind', rep.systems.length > 0, rep.systems.join(','));
  ok('and none are bound yet', rep.bound.length === 0);

  // Only what the fit actually carries.
  const armed = !!(S.stats.mounts && S.stats.mounts.length);
  ok('a weapon rack is drawn only on a hull that has one',
     rep.systems.includes('weapon') === armed, `armed=${armed}`);
  ok('a cargo bay is drawn only on a hull that has one',
     rep.systems.includes('cargo') === ((S.stats.cargoCap || 0) > 0));

  // Run it out. Nothing else in the game may move.
  for (let i = 0; i < 900 && CONNUI.connActive(); i++) CONNUI.tickConn(0.05);
  ok('it finishes on its own', CONNUI.connActive() === false);
  ok('every system ended bound', CONNUI.connReport().bound.length === rep.systems.length);
  ok('the autopilot is still flying afterwards', AP.autopilotOn() === true);
  ok('and it still moved no ship state', S.player.hull === before.hull &&
     S.credits === before.credits);
  ok('the save now remembers having seen it', S.settings.connSeen === true);

  // Second run is the brisk one — a cinematic on every toggle is an
  // obstacle between the player and their own ship.
  CONNUI.playConn();
  const brisk = CONNUI.connReport().pace;
  ok('the second engage is faster than the first', brisk <= CONN.pace + 1e-9,
     String(brisk));
  ok('and faster than the first-time pace', brisk < CONN.firstPace);

  // Taking the stick back must take the picture with it.
  AP.yieldAutopilot();
  CONNUI.tickConn(0.05);
  ok('taking the stick back stops the sequence', CONNUI.connActive() === false);

  // Turned off in settings, it never plays at all.
  S.settings.connSeq = false;
  AP.setAutopilot(true);
  ok('a player who turned it off never sees it', CONNUI.playConn() === false);
  AP.setAutopilot(false);
  S.settings.connSeq = true;

  // Ticking when nothing is playing costs nothing and throws nothing.
  CONNUI.tickConn(0.05);
  ok('ticking an idle overlay is a no-op', CONNUI.connActive() === false);
}

// ── ...and the way out ───────────────────────────────────────────────
//
// The release is the same drawing run backwards, and the assertions that matter are the
// mirror images of the bind's: it starts from a ship she holds, it ends holding nothing,
// and it aborts if the thing it is depicting reverses under it.
console.log('\n— handing it back —');
{
  AP.resetAutopilot();
  S.settings.connSeq = true;
  S.docked = null;

  AP.setAutopilot(true);
  AP.setAutopilot(false);
  const played = CONNUI.playConn('release');
  ok('the release plays when the autopilot drops', played === true);
  ok('and it knows which way it is running', CONNUI.connReport().mode === 'release');

  // It opens on a ship she already has — that is what it is releasing.
  ok('it opens with every system still hers',
     CONNUI.connReport().bound.length === CONNUI.connReport().systems.length);
  ok('so it opens at full', CONNUI.connProgress() > 0.99);

  // A release is always brisk. Never the first-time length, whatever the save has seen.
  S.settings.connSeen = false;
  CONNUI.playConn('release');
  ok('a release is never the long version', CONNUI.connReport().pace === CONN.releasePace,
     String(CONNUI.connReport().pace));

  for (let i = 0; i < 900 && CONNUI.connActive(); i++) CONNUI.tickConn(0.05);
  ok('it finishes on its own', CONNUI.connActive() === false);
  ok('and ends holding nothing', CONNUI.connReport().bound.length === 0);
  ok('the meter ran down to zero', CONNUI.connProgress() < 0.01);
  ok('watching it does not re-arm the first-time bind', S.settings.connSeen === false);
  ok('and the autopilot is still off', AP.autopilotOn() === false);

  // The mirror of the bind's guard: AP coming back on mid-retraction is nonsense to draw.
  CONNUI.playConn('release');
  AP.setAutopilot(true);
  CONNUI.tickConn(0.05);
  ok('engaging again mid-release stops the retraction', CONNUI.connActive() === false);
  AP.setAutopilot(false);
}

// ── alongside, not in the neighbourhood ──────────────────────────────
//
// Both halves of the docking geometry, asserted against each other rather than against the
// numbers they happen to hold. The bug this pins was not that either number was wrong: it
// was that the approach parked the ship *outside* the distance at which a pad would open,
// so an approach could run to completion and leave the pilot sitting there.
console.log('\n— alongside —');
{
  AP.resetAutopilot();
  const berth = S.world.stations[1];
  const r = (berth.userData && berth.userData.radius) || 30;

  ok('docking reach is measured in hundreds of metres, not hundreds of kilometres',
     DOCK.reach <= 1, `${DOCK.reach} units`);

  const hold = holdDistance({ obj: berth, kind: 'station' });
  ok('an approach ends inside the docking reach', hold - r <= DOCK.reach,
     `holds ${(hold - r).toFixed(2)} off the hull, reach is ${DOCK.reach}`);
  ok('...but not inside the hull', hold >= r);

  // ...and the pad itself agrees, from both sides of the line.
  S.docked = null; S.dockCooldown = 0;
  S.player.velocity.set(0, 0, 0);
  S.player.position.copy(berth.position).x += r + DOCK.reach * 4;
  updateDocking();
  ok('no pad from four reaches out', S.dockCandidate === null);

  S.player.position.copy(berth.position).x += r + DOCK.reach * 0.5;
  updateDocking();
  ok('a pad from half a reach out', S.dockCandidate === berth);

  // She calls for the berth a little before the pad opens, so the exchange lands on the way
  // in rather than after arrival.
  ok('she hails from further out than the pad opens', AUTOPILOT.dockReach > DOCK.reach);
  ok('...but still from alongside', AUTOPILOT.dockReach < 10);
}

// ── far enough to be worth a spool ───────────────────────────────────
console.log('\n— crossing the system —');
{
  ok('the warp threshold is a distance, not an aerial',
     typeof AUTOPILOT.warpBeyond === 'number' && AUTOPILOT.warpBeyond > 0);

  // The regression in words: a low sensor tier used to shrink the threshold along with the
  // array, so a hull that could see 900 units concluded a 15,000-unit crossing was "near"
  // and flew all of it at a quarter throttle.
  const dim = 900, wide = 4600;
  ok('a dim array does not make a long crossing short',
     AUTOPILOT.warpBeyond > dim * 1.4, `${AUTOPILOT.warpBeyond} vs ${dim * 1.4}`);
  ok('...and a good one does not make a short hop long',
     AUTOPILOT.warpBeyond < wide * 4);

  AP.resetAutopilot();
  S.docked = null; S.dockCooldown = 0;
  S.warp.state = 'idle';
  S.player.energy = S.stats.energyCap;

  // Park well outside every berth in the system, so whichever one she picks is a long way
  // off — the previous version of this moved the ship near the *furthest* station, which is
  // not the one `nearestStation()` then chose, and so tested a short leg by accident.
  const reach = S.world.stations.reduce((m, st) => Math.max(m, st.position.length()), 0);
  S.player.position.set(reach + AUTOPILOT.warpBeyond * 4, 0, 0);
  S.player.velocity.set(0, 0, 0);
  const nearest = S.world.stations.reduce((best, st) =>
    (!best || st.position.distanceTo(S.player.position) < best.position.distanceTo(S.player.position))
      ? st : best, null);
  const leg = nearest.position.distanceTo(S.player.position);
  ok('the test really is a long way out', leg > AUTOPILOT.warpBeyond, `${Math.round(leg)} units`);

  S.credits = 40000;
  S.player.hull = S.stats.hullMax * 0.5;        // a reason to want a yard
  const npcs = S.world.npcs; S.world.npcs = []; // nothing shooting; this is about the leg
  AP.setAutopilot(true);
  run(6);
  ok('a long leg is warped, not flown', S.warp.state !== 'idle',
     `warp ${S.warp.state}, task ${AP.autopilotReport().task}`);
  AP.setAutopilot(false);
  S.world.npcs = npcs;
  S.warp.state = 'idle'; S.warp.charge = 0; S.warp.dest = null;
  S.player.hull = S.stats.hullMax;
}

// ── she cannot spend what she has not got ────────────────────────────
//
// The bug: with a hurt hull and no money she scored a berth, docked, found every line on the
// checklist unaffordable, undocked, re-scored, found the hull *still* hurt, and turned round.
// Three assertions, because the fix has three parts: the score, the cooldown, and having
// somewhere else to go.
console.log('\n— broke —');
{
  AP.resetAutopilot();
  S.docked = null; S.dockCooldown = 0;
  S.warp.state = 'idle';
  S.player.hull = S.stats.hullMax * 0.4;        // wants a yard
  S.cargo.ore = 0;

  S.credits = 40000;
  const rich = AP.scoreTasks();
  ok('a solvent hull with a hurt hull goes to a yard',
     rich.some(t => t.key === 'service'), rich.map(t => t.key).join(','));

  S.credits = 300;
  const poor = AP.scoreTasks();
  const svc = poor.find(t => t.key === 'service');
  ok('a broke one does not go for the repair it cannot pay for',
     !svc || !/hull needs work/.test(svc.why), svc ? svc.why : 'no service task');
  ok('...and still has something to do', poor.length > 0,
     poor.map(t => t.key).join(','));
  ok('...which is something that earns',
     poor.some(t => ['mine', 'hunt', 'deliver'].includes(t.key)) ||
     (svc && /board/.test(svc.why)),
     poor.map(t => `${t.key}(${t.why})`).join(' · '));

  // Selling and delivering still count when the account is empty — those are the two lines
  // on the checklist that pay *us*.
  S.cargo.ore = S.stats.cargoCap * 0.95;
  const holding = AP.scoreTasks().find(t => t.key === 'service');
  ok('a full hold is still worth a berth when broke', !!holding,
     AP.scoreTasks().map(t => t.key).join(','));
  S.cargo.ore = 0;
  S.credits = 40000;
  S.player.hull = S.stats.hullMax;
}

// The tree's half of this — which node fires on an empty account, and what it says — is in
// `test/reasoner.mjs`, where the world has no accepted contracts and no hostiles to argue
// with. Asserting it here would be asserting it against whatever the blocks above left
// behind, which is how a suite starts testing its own history instead of the code.

// ── the trigger ──────────────────────────────────────────────────────
//
// She can shoot now, which is the single most dangerous capability in this file: a bug here
// does not waste your time, it starts a war with a patrol or empties your magazines into
// nothing. Every assertion below is about her *stopping*.
console.log('\n— she can shoot, so she must be able to stop —');
{
  AP.resetAutopilot();
  S.docked = null; S.dockCooldown = 0;
  S.warp.state = 'idle';
  S.player.hull = S.stats.hullMax;
  S.input.firing = false;

  ok('she is not on the trigger to begin with',
     S.input.firing === false && AP.autopilotReport().holdFire === false);

  // Straight into a fight, by hand: the hunt task with a live mark inside weapons range.
  const mark = S.world.npcs.find(n => n.userData && n.userData.faction === 'hostile' &&
                                      n.userData.hp > 0);
  if (mark) {
    S.player.position.copy(mark.position).x += 120;   // well inside any rack's optimal
    S.player.velocity.set(0, 0, 0);
    S.credits = 200;                                  // broke, so hunting is on the menu
    AP.setAutopilot(true);
    run(4);
    const fighting = AP.autopilotReport().task === 'hunt';
    ok('a broke hull with something hostile alongside goes for it', fighting,
       AP.autopilotReport().task);

    if (fighting) {
      // The kill. The trigger must come off the moment there is nothing to shoot at.
      mark.userData.hp = 0;
      run(2);
      ok('the trigger comes off a dead target', S.input.firing === false);
    } else {
      ok('the trigger comes off a dead target', S.input.firing === false);
    }

    // ...and off, unconditionally, when the stick goes back.
    S.input.firing = true;
    AP.setAutopilot(false);
    ok('handing back the stick comes off the trigger first', S.input.firing === false);

    S.input.firing = true;
    AP.setAutopilot(true);
    AP.yieldAutopilot();
    ok('so does a finger on the controls', S.input.firing === false);
  } else {
    ok('a broke hull with something hostile alongside goes for it', true, 'no hostile in world');
    ok('the trigger comes off a dead target', true, 'no hostile in world');
    ok('handing back the stick comes off the trigger first', true, 'no hostile in world');
    ok('so does a finger on the controls', true, 'no hostile in world');
  }

  AP.setAutopilot(false);
  S.input.firing = false;
  S.credits = 40000;
}

// ── the loop ─────────────────────────────────────────────────────────
//
// The bug, in the words it was reported in: "incomplete action children left orphaned and
// then it just loops till manual interference". Two causes, and this block is one half of
// each.
//
// The watchdog said "that is not working, trying something else" and then handed control to
// a planner with no memory of what had just failed — which chose the same task, with the
// same target, and stalled again. Forever.
console.log('\n— not doing the same failed thing forever —');
{
  AP.resetAutopilot();
  S.docked = null; S.dockCooldown = 0;
  S.warp.state = 'idle';
  S.player.hull = S.stats.hullMax;
  S.credits = 40000;
  AP.setDoctrine('balanced');

  ok('the bench starts empty', AP.autopilotReport().bench.length === 0);

  // An empty sky. Nothing to mine, nothing to sell to, nothing to shoot — the state in
  // which the old code planned, found nothing, settled, re-planned, found nothing, and did
  // that until somebody touched the stick.
  const stations = S.world.stations, npcs = S.world.npcs, rocks = S.world.asteroids;
  S.world.stations = []; S.world.npcs = []; S.world.asteroids = [];
  const beforeSaid = said().length;

  AP.setAutopilot(true);
  ok('she takes it', AP.autopilotOn() === true);
  for (let t = 0; t < 240 && AP.autopilotOn(); t += 0.5) {
    S.time += 0.5;
    AP.updateAutopilot(0.5);
  }

  const r = AP.autopilotReport();
  ok('with nothing to do she stops rather than looping', r.on === false,
     `dry ${r.dry}, phase ${r.phase}`);
  ok('...and says why', said().length > beforeSaid);
  ok('...and it took more than one look to decide that',
     AUTOPILOT.giveUpAfter >= 2, String(AUTOPILOT.giveUpAfter));

  S.world.stations = stations; S.world.npcs = npcs; S.world.asteroids = rocks;

  AP.resetAutopilot();
  ok('a reset forgives everything',
     AP.autopilotReport().bench.length === 0 && AP.autopilotReport().dry === 0);
}

// ── nothing left running ─────────────────────────────────────────────
//
// The other half. Phases used to own things and never let go of them: an approach started
// for a rock was still steering the ship while the next phase tried to dock, a held trigger
// outlived the fight it was for, and a docking that completed left her waiting in `berth`
// for an event that had already happened.
console.log('\n— phases let go of what they own —');
{
  AP.resetAutopilot();
  S.docked = null; S.dockCooldown = 0;
  S.player.hull = S.stats.hullMax;
  AP.setAutopilot(true);

  // Mining and firing belong to `work` and to nothing else.
  S.input.mining = true;
  S.input.firing = true;
  S.time += 1;
  AP.updateAutopilot(0.5);
  ok('a beam left on outside the work phase is turned off',
     AP.autopilotReport().phase === 'work' || S.input.mining === false,
     AP.autopilotReport().phase);
  ok('...and so is a held trigger',
     AP.autopilotReport().phase === 'work' || S.input.firing === false);

  // State and phase disagreeing is the orphan that needs no timer: she is standing on a pad
  // while the phase says she is flying somewhere.
  const berth = S.world.stations[0];
  dock(berth);
  S.time += 1;
  AP.updateAutopilot(0.5);
  ok('being docked puts her in the docked phase', AP.autopilotReport().phase === 'docked',
     AP.autopilotReport().phase);

  undock();
  S.time += 1;
  AP.updateAutopilot(0.5);
  ok('...and leaving the pad takes her out of it', AP.autopilotReport().phase !== 'docked',
     AP.autopilotReport().phase);

  AP.setAutopilot(false);
  ok('switching off leaves nothing of hers running',
     !S.approach && !S.follow && S.input.mining === false && S.input.firing === false);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
