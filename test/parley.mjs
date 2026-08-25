// Slice — opening a channel, choosing how close to arrive, and telling ARIA what she is for.
//
// Three features that all have the same failure mode and so get the same kind of test: they
// are *menus over rules*, and the way a menu over rules goes wrong is by offering something
// the rules will refuse, or by hiding something the rules would allow. So most of what is
// asserted here is which doors are open, to whom, and why — not what the dialogue says.
//
// The one exception is persuasion, which can fail. That gets tested the way anything with a
// dice roll in it should be: that the odds are visible before you commit, that they move for
// the right reasons, and that reloading does not reroll them.

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
const { initProjectiles } = await imp('systems/combat/projectiles.js');
const { initCombat } = await imp('systems/combat/combat.js');
const { initMining } = await imp('systems/industry/mining.js');
const { initWorldSim } = await imp('systems/platform/worldsim.js');
const { initMarket } = await imp('systems/trade/market.js');
const { initContracts } = await imp('systems/trade/contracts.js');
const { resetReputation, adjust, standing } = await imp('systems/company/reputation.js');
const { createCharacter } = await imp('systems/crew/character.js');
const { initCommsSystem, commsLog } = await imp('systems/npc/comms.js');

const P = await imp('systems/npc/parley.js');
const D = await imp('data/dialogue.js');
const DOC = await imp('data/doctrine.js');
const AP = await imp('systems/npc/autopilot.js');
const { arrivalRadius, setCourse, clearCourse, warpStandoff } = await imp('systems/flight/warp.js');
const { WARP, PARLEY } = await imp('core/config.js');
const { FRAMES, FRAME_KEYS, DEFAULT_FRAME } = await imp('data/origins.js');

initScene(); recalcStats(); seedWorld(24601); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx(); createNpcs();
resetReputation(); initWorldSim(); initMarket(); initContracts(); initCommsSystem();
createCharacter({ name: 'Vane', lineage: 'rim', corp: 'kestrel', career: 'prospector' });
updateSystem(1);
S.running = true;
S.credits = 40000;

const berth = S.world.stations[0];
const ship = S.world.npcs.find(n => n.userData && n.userData.hp > 0);

/** Put standing where a test needs it, whatever it was before. */
function setStanding(faction, want) {
  adjust(faction, want - standing(faction), 'test');
}

/* Whose berth this actually is. Guessing "coalition" and setting standing there is how the
   first draft of this suite tested nothing at all: the station belonged to somebody else and
   every disposition assertion passed for the wrong reason. */
const berthFaction = (berth.userData && berth.userData.faction) || 'independent';

// ── the corpus ───────────────────────────────────────────────────────
console.log('\n— what there is to say —');
{
  const dispositions = D.DISPOSITION;
  ok('every disposition has a station opener',
     dispositions.every(d => D.OPENERS.station.first[d] && D.OPENERS.station.known[d]),
     dispositions.filter(d => !D.OPENERS.station.first[d]).join(','));
  ok('every disposition has a ship opener',
     dispositions.every(d => D.OPENERS.ship.first[d] && D.OPENERS.ship.known[d]));

  ok('every conversation line covers every disposition',
     Object.keys(D.CONVERSATION).every(k =>
       dispositions.every(d => D.CONVERSATION[k].lines[d])),
     Object.keys(D.CONVERSATION).filter(k =>
       !dispositions.every(d => D.CONVERSATION[k].lines[d])).join(','));

  ok('every persuasion names what it is for and what it costs',
     Object.keys(D.PERSUASION).every(k => {
       const p = D.PERSUASION[k];
       return p.label && p.ask && p.win && p.lose &&
              p.difficulty > 0 && p.difficulty < 1 &&
              ['ship', 'station'].includes(p.subject);
     }));

  ok('war has a way out that is not shooting',
     Object.keys(D.WAR).some(k => k !== 'declare'));

  // Same rule as the crew corpus: a line that quotes a figure goes stale the moment the
  // figure moves, and every figure in this game moves.
  const lines = [];
  for (const k in D.CONVERSATION) lines.push(...Object.values(D.CONVERSATION[k].lines));
  for (const k in D.WAR) lines.push(...Object.values(D.WAR[k].lines));
  for (const k in D.PERSUASION) lines.push(D.PERSUASION[k].ask, D.PERSUASION[k].win, D.PERSUASION[k].lose);
  ok('no line quotes a figure', lines.every(l => !/\d/.test(l)),
     lines.filter(l => /\d/.test(l)).slice(0, 2).join(' | '));
  for (const kind of ['station', 'ship']) {
    for (const when of ['first', 'known']) {
      for (const d of Object.keys(D.OPENERS[kind][when])) {
        lines.push(D.OPENERS[kind][when][d]('X'));
      }
    }
  }
  ok('the corpus is worth having', lines.length >= 60, String(lines.length));
}

// ── who answers ──────────────────────────────────────────────────────
console.log('\n— who will take a call —');
{
  P.resetParley();
  ok('a berth answers', P.contactable(berth) === true);
  ok('a ship answers', P.contactable(ship) === true);
  ok('a rock does not', P.contactable({ userData: { name: 'LX-4', kind: 'asteroid' } }) === false);
  ok('a planet does not', P.contactable({ userData: { name: 'Kolm', kind: 'planet' } }) === false);
  ok('a nameless thing does not', P.contactable({ userData: {} }) === false);

  ok('a berth is read as a station', P.subjectKind(berth) === 'station');
  ok('a live hull is read as a ship', P.subjectKind(ship) === 'ship');
}

// ── how they feel about you ──────────────────────────────────────────
console.log('\n— disposition —');
{
  setStanding('coalition', 90);
  ok('a friend is allied', P.dispositionOf({ userData: { name: 'x', faction: 'coalition' } }) === 'allied');
  setStanding('coalition', 45);
  ok('a good customer is warm', P.dispositionOf({ userData: { name: 'x', faction: 'coalition' } }) === 'warm');
  setStanding('coalition', 0);
  ok('a stranger is neutral', P.dispositionOf({ userData: { name: 'x', faction: 'coalition' } }) === 'neutral');
  setStanding('coalition', -30);
  ok('a bad record is cold', P.dispositionOf({ userData: { name: 'x', faction: 'coalition' } }) === 'cold');
  setStanding('coalition', -80);
  ok('a very bad one is hostile', P.dispositionOf({ userData: { name: 'x', faction: 'coalition' } }) === 'hostile');
  setStanding('coalition', 0);

  // Paperwork does not outrank being shot at.
  ok('an openly hostile faction is hostile whatever the paperwork says',
     P.dispositionOf({ userData: { name: 'x', faction: 'pirate' } }) === 'hostile' ||
     standing('pirate') > PARLEY.hostileBelow);
}

// ── first contact ────────────────────────────────────────────────────
console.log('\n— the first call, and the second —');
{
  P.resetParley();
  setStanding('coalition', 0);
  const s1 = P.openParley(berth);
  ok('the channel opens', !!s1);
  ok('...and it is a first contact', s1.first === true);
  ok('...and somebody said something', P.parleyLog().length === 1);
  ok('...on the radio too', commsLog().some(e => e.from === berth.userData.name) ||
     P.parleyLog().length === 1);

  const introduced = P.branchesFor(s1).find(b => b.id === 'conversation')
    .options.some(o => o.id === 'introduce');
  ok('you can introduce yourself the first time', introduced === true);
  P.closeParley();

  const s2 = P.openParley(berth);
  ok('the second call knows you', s2.first === false);
  ok('...and does not offer introductions again',
     !P.branchesFor(s2).find(b => b.id === 'conversation').options.some(o => o.id === 'introduce'));
  P.closeParley();
}

// ── the doors ────────────────────────────────────────────────────────
console.log('\n— which doors are open —');
{
  P.resetParley();
  setStanding('coalition', 0);
  const s = P.openParley(berth);
  const ids = P.branchesFor(s).map(b => b.id);
  ok('a neutral berth offers conversation', ids.includes('conversation'));
  ok('...and services', ids.includes('services'));
  ok('...and does not offer war', !ids.includes('war'));
  ok('station persuasions are station persuasions',
     P.branchesFor(s).find(b => b.id === 'persuasion').options
       .every(o => D.PERSUASION[o.id].subject === 'station'));
  P.closeParley();

  // Hostile: war first, and that ordering is the assertion — a menu whose first item is
  // "exchange pleasantries" while somebody has a lock on you is a menu nobody will use.
  setStanding(berthFaction, -90);
  const h = P.openParley(berth);
  const hids = P.branchesFor(h).map(b => b.id);
  ok('a hostile berth opens the war branch', hids.includes('war'));
  ok('...and puts it first', hids[0] === 'war');
  ok('...and still lets you talk', hids.includes('conversation'));
  P.closeParley();
  setStanding(berthFaction, 0);
}

// ── the odds ─────────────────────────────────────────────────────────
console.log('\n— talking somebody round —');
{
  P.resetParley();
  setStanding('coalition', 0);
  const s = P.openParley(berth);

  const base = P.chanceOf('discount', s);
  ok('the odds are a probability', base > 0 && base < 1, String(base));
  ok('...and are never certain', base <= PARLEY.ceiling);

  // Standing moves them, which is the entire reason to care about standing.
  P.closeParley();
  setStanding('coalition', 80);
  const warm = P.openParley(berth);
  ok('a friend is easier to persuade', P.chanceOf('discount', warm) > base,
     `${base.toFixed(2)} → ${P.chanceOf('discount', warm).toFixed(2)}`);
  P.closeParley();

  setStanding('coalition', -50);
  const cold = P.openParley(berth);
  ok('somebody who dislikes you is harder', P.chanceOf('discount', cold) < base);
  ok('...but never impossible', P.chanceOf('discount', cold) >= PARLEY.floor);
  P.closeParley();
  setStanding('coalition', 0);

  // A harder attempt is harder. Trivially true and worth pinning, because the difficulty
  // field is the only thing distinguishing these entries and a refactor could drop it.
  const s2 = P.openParley(berth);
  ok('a hard ask is longer odds than an easy one',
     P.chanceOf('passage', s2) < P.chanceOf('discount', s2));

  // The roll is seeded on who and what, so reloading a save cannot reroll it.
  const before = P.chanceOf('passage', s2);
  const r1 = P.choose('persuasion', 'passage');
  ok('an attempt returns a verdict', r1 && ['won', 'lost'].includes(r1.kind));
  ok('...and reports the odds it was taken at', Math.abs(r1.chance - before) < 0.001);
  P.closeParley();

  const s3 = P.openParley(berth);
  const r2 = P.choose('persuasion', 'passage');
  ok('the same question at the same moment gets the same answer', r2.kind === r1.kind);
  P.closeParley();
}

// ── what a berth checks ──────────────────────────────────────────────
console.log('\n— the clearance scan —');
{
  P.resetParley();
  setStanding('coalition', 20);
  S.cargo.ore = 0; S.cargo.salvage = 0; S.cargo.data = 0;

  const s = P.openParley(berth);
  const clean = P.runScan(s);
  ok('a clean hull passes all three checks',
     clean.identOk && clean.recordOk && !clean.contraband && clean.ok,
     JSON.stringify(clean));

  // Contraband is relative to the berth's bloc, which is the whole point of it.
  S.cargo.salvage = D.CONTRABAND_FLOOR * 3;
  const dirty = P.runScan(s);
  const bans = D.CONTRABAND[s.bloc] || [];
  if (bans.includes('salvage')) {
    ok('a hold full of the wrong thing fails the scan', dirty.contraband === true);
    ok('...and the refusal names it', dirty.banned.includes('salvage'));
    ok('...and the other two checks still passed', dirty.identOk && dirty.recordOk);
    ok('...so the pilot can tell which problem they have', dirty.ok === false);
  } else {
    ok('a hold full of the wrong thing fails the scan', dirty.contraband === false,
       `${s.bloc} does not ban salvage`);
    ok('...and the refusal names it', true, 'not applicable at this berth');
    ok('...and the other two checks still passed', dirty.identOk && dirty.recordOk);
    ok('...so the pilot can tell which problem they have', dirty.ok === true);
  }

  // A small load is overlooked. Smuggling that begins at one kilogram is not smuggling.
  S.cargo.salvage = 1;
  ok('a token amount is not smuggling', P.runScan(s).contraband === false);
  S.cargo.salvage = 0;
  P.closeParley();

  // A record bad enough closes the berth whatever is in the hold.
  setStanding(berthFaction, -95);
  const bad = P.openParley(berth);
  const v = P.runScan(bad);
  ok('a hostile transponder fails before the hold is even opened', v.identOk === false);
  ok('...and the berth is closed', v.ok === false);
  P.closeParley();
  setStanding(berthFaction, 0);
}

// ── being shaken down ────────────────────────────────────────────────
console.log('\n— paying them off —');
{
  P.resetParley();
  setStanding(berthFaction, -90);
  S.cargo.ore = 200;
  const s = P.openParley(berth);
  const price = P.tributePrice(s);
  ok('a shakedown has a price', price > 0);
  ok('...and it scales with what they can see in the hold',
     price > PARLEY.tributeFloor, `${price} vs floor ${PARLEY.tributeFloor}`);

  S.credits = 10;
  const broke = P.choose('war', 'tribute');
  ok('you cannot pay what you have not got', broke.ok === false);

  S.credits = price + 5000;
  const before = S.credits;
  const paid = P.choose('war', 'tribute');
  ok('paying works', paid.ok === true);
  ok('...and costs exactly the quote', before - S.credits === price);
  ok('...and closes the channel', P.parleyOpen() === false);
  S.cargo.ore = 0;
  S.credits = 40000;
  setStanding(berthFaction, 0);
}

// ── how close a jump stops ───────────────────────────────────────────
console.log('\n— how close to arrive —');
{
  clearCourse();
  ok('the default is close', warpStandoff() === WARP.closeArrive, String(warpStandoff()));
  ok('a berth has no well to keep you out of',
     arrivalRadius({ radius: 40 }) === WARP.closeArrive);
  ok('...so WARP TO really does mean alongside',
     arrivalRadius({ radius: 40 }) < 20, String(arrivalRadius({ radius: 40 })));

  setCourse(berth, berth.userData.name, 600);
  ok('asking for a standoff is remembered', warpStandoff() === 600);
  ok('...and the arrival honours it', arrivalRadius({ radius: 40 }) === 600);

  setCourse(berth, berth.userData.name);
  ok('asking for nothing goes back to close', warpStandoff() === WARP.closeArrive);

  // The one thing the pilot may not override.
  ok('a star still keeps you out at arm’s length',
     arrivalRadius({ gravity: true, radius: 320 }, 5) > 5);
  ok('...and the slider band is a real band',
     WARP.standoffMin < WARP.standoffMax && WARP.standoffMin >= WARP.closeArrive);
  clearCourse();
}

// ── standing orders ──────────────────────────────────────────────────
console.log('\n— what the ship is for —');
{
  ok('every doctrine is described',
     DOC.DOCTRINE_KEYS.every(k => {
       const d = DOC.DOCTRINES[k];
       return d.name && d.icon && d.blurb && d.detail && d.bias && d.floor && d.refuse;
     }));
  ok('the default exists', DOC.DOCTRINES[DOC.DEFAULT_DOCTRINE]);
  ok('balanced has no opinion',
     Object.keys(DOC.DOCTRINES.balanced.bias).length === 0 &&
     DOC.DOCTRINES.balanced.refuse.length === 0);

  // Every task a doctrine mentions has to be a task the scorer can actually produce, or the
  // weight is a preference for something that never happens.
  const TASKS = new Set(['mine', 'service', 'deliver', 'hunt', 'sell', 'salvage']);
  const strays = [];
  for (const k of DOC.DOCTRINE_KEYS) {
    const d = DOC.DOCTRINES[k];
    for (const t of Object.keys(d.bias)) if (!TASKS.has(t)) strays.push(`${k}.bias.${t}`);
    for (const t of Object.keys(d.floor)) if (!TASKS.has(t)) strays.push(`${k}.floor.${t}`);
    for (const t of d.refuse) if (!TASKS.has(t)) strays.push(`${k}.refuse.${t}`);
  }
  ok('no doctrine weights a task that does not exist', strays.length === 0, strays.join(', '));

  AP.resetAutopilot();
  S.docked = null;
  S.player.hull = S.stats.hullMax;
  S.cargo.ore = 0;

  AP.setDoctrine('balanced');
  ok('the doctrine is remembered', AP.doctrine() === 'balanced');

  // The arithmetic, first and separately. A doctrine cannot conjure a task out of nothing —
  // see data/doctrine.js — so an integration check alone would pass or fail on whether this
  // seed happens to put a rock in range, which is not what it is meant to be measuring.
  ok('a preference is a multiplier', DOC.biasFor('mining', 'mine') > 1);
  ok('...and indifference is 1', DOC.biasFor('balanced', 'mine') === 1);
  ok('...and a refusal is 0', DOC.biasFor('hold', 'mine') === 0);
  ok('a floor is a floor', DOC.floorFor('mining', 'mine') > 0 &&
     DOC.floorFor('balanced', 'mine') === 0);

  const even = AP.scoreTasks();
  AP.setDoctrine('mining');
  const mining = AP.scoreTasks();
  const mineEven = (even.find(t => t.key === 'mine') || {}).score || 0;
  const mineBias = (mining.find(t => t.key === 'mine') || {}).score || 0;
  if (mineEven > 0) {
    ok('a prospecting doctrine wants to mine more than a balanced one',
       mineBias > mineEven, `${mineEven} → ${mineBias}`);
  } else {
    // Nothing to cut from here, which is the case the note in data/doctrine.js is about.
    ok('a prospecting doctrine wants to mine more than a balanced one',
       mineBias === 0, 'no rock in range — a doctrine cannot invent one');
  }

  AP.setDoctrine('hold');
  ok('station keeping refuses everything', AP.scoreTasks().length === 0,
     AP.scoreTasks().map(t => t.key).join(','));

  AP.setDoctrine('war');
  const war = AP.scoreTasks();
  ok('a war doctrine still sells a full hold when there is one to sell',
     !DOC.DOCTRINES.war.refuse.includes('sell'));
  ok('...and still lets her repair', !DOC.DOCTRINES.war.refuse.includes('service'));

  AP.setDoctrine('nonsense');
  ok('an unknown doctrine is refused, not adopted', AP.doctrine() === 'war');
  AP.setDoctrine('balanced');
  ok('the report carries it', AP.autopilotReport().doctrine === 'balanced');
}

// ── who you are ──────────────────────────────────────────────────────
console.log('\n— frames —');
{
  ok('every frame has a name and a full pronoun set',
     FRAME_KEYS.every(k => {
       const f = FRAMES[k];
       return f.name && f.short && f.desc &&
              f.pronouns.subj && f.pronouns.obj && f.pronouns.poss && f.pronouns.refl;
     }));
  ok('there is a default', !!FRAMES[DEFAULT_FRAME]);
  ok('there are four of them', FRAME_KEYS.length === 4, FRAME_KEYS.join(','));

  // The assertion that matters: a frame is presentation, never capability. If one of these
  // ever grows a skill table, this is what says so out loud.
  const statty = FRAME_KEYS.filter(k => {
    const f = FRAMES[k];
    return f.start || f.skills || f.affinity || f.standing || f.bonus;
  });
  ok('no frame carries a stat', statty.length === 0, statty.join(', '));

  const ch = createCharacter({ name: 'Test', lineage: 'rim', corp: 'kestrel',
                               career: 'prospector', frame: 'synth' });
  ok('creation takes a frame', !!ch && S.character.frame === 'synth');
  const bad = createCharacter({ name: 'Test', lineage: 'rim', corp: 'kestrel',
                                career: 'prospector', frame: 'nonsense' });
  ok('...and refuses one it does not have', !!bad && S.character.frame === DEFAULT_FRAME);
}

console.log(`\n${pass} passed, ${fail} problems`);
process.exit(fail ? 1 : 0);
