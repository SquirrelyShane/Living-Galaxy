// The desk, and the loop it closes.
//
// v1.02.36 built the individual record: standing with nine named powers, and a career
// ladder whose rungs gate on those names — `aurelian: 25`, `freewake: 40`, `meridian: 65`.
// v1.02.38 drew it on a screen. Neither patch gave the game a way to *move* a per-power
// number, because the only thing in the world that hands out standing is the contract
// board and the board posted on behalf of one of three blocs.
//
// So every rung above the second was reachable from the console and nowhere else, and the
// screen .38 shipped was a picture of a ladder. This suite is the claim that it is now a
// ladder.
//
// What it pins:
//
//   1. **A station posts for a power, derived not stored.** The same desk on every device
//      and every load, from the station's own name and the world seed.
//   2. **`hires` decides what is on the board.** The lore text is the type table. A
//      breaker's yard does not post survey work.
//   3. **The floor is free and the board is never all padlocks.** Every gate in this game
//      sits above what a character is handed at birth, and a station a new pilot cannot
//      take a single job from is a station that reads as broken.
//   4. **Finishing work moves the number the ladder reads** — and moves it with the
//      issuer's enemies too, through the timeline, without contracts knowing who hates whom.
//   5. **The whole loop runs.** Work → standing and skill → a rung → the qualification that
//      rung grants → the tier of work that demanded it. Asserted end to end, by playing it.

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
const { CONTRACTS } = await imp('core/config.js');
const CO = await imp('systems/trade/contracts.js');
const D = await imp('systems/company/dossier.js');
const F = await imp('data/factions.js');
const REP = await imp('systems/company/reputation.js');
const { createCharacter } = await imp('systems/crew/character.js');
const { STATION_TYPES } = await imp('data/stations.js');
const { initScene } = await imp('world/scene.js');
const { createSystem } = await imp('world/system.js');

initScene(); recalcStats(); seedWorld(4021); S.seed = 4021; createSystem();
REP.resetReputation();
S.time = 100;
CO.initContracts();

// ── 1. the lore is the join ──────────────────────────────────────────
console.log('\n— charter and category speak the same language —');
{
  const cats = new Set(Object.values(STATION_TYPES).map(t => t.cat));
  // This is the assertion that caught `charter: 'logistic'` — singular, in the one power
  // whose entire charter is freight, which would have made Freewake ineligible for the
  // only station type it should certainly own. Inert for two patches; wrong the moment
  // anything read it.
  ok('every power charters something a station can be',
     F.POWER_KEYS.every(k => cats.has(F.POWERS[k].charter)),
     F.POWER_KEYS.filter(k => !cats.has(F.POWERS[k].charter))
       .map(k => `${k}:${F.POWERS[k].charter}`).join(' '));

  ok('every power hires work the board can express',
     F.POWER_KEYS.every(k => Object.keys(CO.desksOf(k)).length > 0));
  ok('and nobody posts the whole board',
     F.POWER_KEYS.some(k => Object.keys(CO.desksOf(k)).length < Object.keys(CONTRACTS.types).length));

  // The specific claim the fiction makes: a breaker's yard wants things moved and broken
  // up, and has no interest in charting anything.
  ok('Vosk posts no survey work', !CO.desksOf('vosk').survey,
     Object.keys(CO.desksOf('vosk')).join(','));
  ok('the Directorate posts bounties', CO.desksOf('aurelian').bounty > 0);
  ok('Freewake posts freight', CO.desksOf('freewake').haul > 0);
}

// ── 2. who posts ─────────────────────────────────────────────────────
console.log('\n— a station posts for somebody with a name —');
{
  const desks = S.world.stations.map(st => CO.issuerOf(st));
  ok('every station has a desk', desks.every(d => F.POWER_KEYS.includes(d)),
     desks.filter(d => !F.POWER_KEYS.includes(d)).join(','));
  ok('the system is not one power’s company town', new Set(desks).size > 1,
     [...new Set(desks)].join(','));

  // Derived, not stored: the same name and the same seed give the same desk. This is what
  // lets it stay out of the save file.
  const again = S.world.stations.map(st => CO.issuerOf(st));
  ok('a desk is stable across calls', desks.join() === again.join());
  // A pure function of the seed and the name, which is what lets it stay out of the save
  // file. Asked of a synthetic station rather than by rebuilding the world — `createSystem()`
  // appends to `S.world.stations` rather than replacing them, so calling it twice in one
  // process doubles the system and compares a seventeen-station list against an eleven.
  const synth = { userData: { name: S.world.stations[0].userData.name,
                              category: S.world.stations[0].userData.category } };
  ok('and is derived purely from the seed and the name', CO.issuerOf(synth) === desks[0],
     `${CO.issuerOf(synth)} vs ${desks[0]}`);

  // Charter first, where the charter fits.
  const chartered = S.world.stations.filter(st =>
    F.powersOf(CO.issuerBlocOf(st)).some(k => F.POWERS[k].charter === st.userData.category));
  ok('a station whose category some local power charters gets that power',
     chartered.every(st => F.POWERS[CO.issuerOf(st)].charter === st.userData.category),
     chartered.filter(st => F.POWERS[CO.issuerOf(st)].charter !== st.userData.category)
       .map(st => st.userData.name).join(' '));

  ok('a desk sits in its station’s own bloc',
     S.world.stations.every(st => F.POWERS[CO.issuerOf(st)].bloc === CO.issuerBlocOf(st)));
}

// ── 3. the board a new pilot reads ───────────────────────────────────
console.log('\n— the floor is free —');
{
  createCharacter({ name: 'Rook', lineage: 'core', corp: 'meridian', career: 'hauler' });
  CO.initContracts();

  for (const st of S.world.stations) {
    const board = CO.boardFor(st);
    const desk = CO.issuerOf(st);
    ok(`${st.userData.name}: every offer is work its desk hires`,
       board.every(c => CO.desksOf(desk)[c.type] > 0),
       board.map(c => c.type).join(','));
  }

  // The fault this rule exists for, stated as the rule: no station is a wall.
  const walls = S.world.stations.filter(st => !CO.boardFor(st).some(c => CO.eligibility(c).ok));
  ok('no station shows a new pilot four padlocks', walls.length === 0,
     walls.map(s => s.userData.name).join(' '));

  const all = S.world.stations.flatMap(st => CO.boardFor(st));
  ok('the floor tier asks for nothing at all',
     all.filter(c => c.tier === 'low').every(c => Object.keys(c.req).length === 0));
  ok('but the board is not all floor', all.some(c => c.tier !== 'low'),
     [...new Set(all.map(c => c.tier))].join(','));
  ok('a sealed job pays more than a standard one of the same type', (() => {
    for (const t of Object.keys(CONTRACTS.types)) {
      const lo = all.filter(c => c.type === t && c.tier === 'low');
      const hi = all.filter(c => c.type === t && c.tier === 'high');
      if (lo.length && hi.length) {
        return Math.max(...hi.map(c => c.pay)) > Math.max(...lo.map(c => c.pay));
      }
    }
    return true;                                  // no matched pair on this seed
  })());

  // Every certificate the board asks for is one some career actually issues. A gate
  // demanding a document nobody prints is a wall wearing a lock's clothes.
  const asked = new Set(all.flatMap(c => c.req.quals || []));
  const granted = new Set(Object.values(D.LADDER).flatMap(l => l.rungs.flatMap(r => r.grants || [])));
  ok('every qualification the board demands is one a ladder grants',
     [...asked].every(q => granted.has(q)), [...asked].filter(q => !granted.has(q)).join(','));

  // ...and the offset: bonded work asks for the *low* certificate, so the first earned
  // rung of a ladder immediately buys something.
  ok('bonded work asks the rank below it',
     all.filter(c => c.tier === 'mid' && (c.req.quals || []).length)
        .every(c => c.req.quals[0] === `${c.type}-low`),
     all.filter(c => c.tier === 'mid').map(c => (c.req.quals || []).join()).join(' '));
}

// ── 4. the gate speaks ───────────────────────────────────────────────
console.log('\n— a lock states its price —');
{
  const gated = S.world.stations.flatMap(st => CO.boardFor(st))
    .filter(c => !CO.eligibility(c).ok);
  ok('there is gated work to look at', gated.length > 0, String(gated.length));
  ok('every lock says why', gated.every(c => {
    const g = CO.eligibility(c);
    return typeof g.why === 'string' && g.why.length > 8 && g.missing.length > 0;
  }));
  ok('and the accept path refuses in exactly the same words',
     gated.every(c => CO.acceptBlocker(c) === CO.eligibility(c).why));

  // A lock is recomputed, never cached. A contract sitting on a board while the player
  // earns the thing it wants has to unlock itself — a padlock stamped at generation time
  // is precisely what would make the ladder feel inert again.
  const one = gated.find(c => Object.keys(c.req.skills || {}).length);
  if (one) {
    const me = D.playerDossier();
    const skill = Object.keys(one.req.skills)[0];
    // Through the character sheet, not by writing `proficiency` — that field is *derived*
    // on every read of the dossier, so assigning to it proves nothing and silently proves
    // nothing. Cost me three red assertions before I noticed the write was being discarded.
    const held = S.character.spent[skill] || 0;
    S.character.spent[skill] = 10;
    me.standing[one.issuer] = 100;
    for (const q of one.req.quals || []) D.award(me, q);
    ok('meeting the requirement unlocks the offer in place', CO.eligibility(one).ok === true,
       CO.eligibility(one).why);
    S.character.spent[skill] = held;
  } else ok('meeting the requirement unlocks the offer in place', false, 'no skill-gated offer');
}

// ── 5. settlement moves the number the ladder reads ──────────────────
console.log('\n— working for a desk is felt by its rivals —');
{
  createCharacter({ name: 'Rook', lineage: 'core', corp: 'meridian', career: 'enforcer' });
  const me = D.playerDossier();
  for (const k of F.POWER_KEYS) me.standing[k] = 0;
  REP.resetReputation();
  S.contracts.active = [];
  S.credits = 50000;

  const job = { id: 'x1', type: 'bounty', issuer: 'aurelian', tier: 'low', req: {},
                station: 'x', skill: 'gunnery', pay: 3000, rep: 4, target: 1, progress: 0,
                expires: S.time + 999, deadline: S.time + 999, base: { kills: S.player.kills } };
  S.contracts.active.push(job);
  const bloc0 = REP.standing('coalition');
  S.player.kills += 1;
  CO.updateContracts(0.1);

  ok('the contract completed', !CO.activeContracts().some(c => c.id === 'x1'));
  ok('the desk that posted it thinks better of you', D.standingWith(me, 'aurelian') > 0,
     String(D.standingWith(me, 'aurelian')));
  // The corp war, felt without contracts knowing anything about it: Kessler and the
  // Directorate are at war in HISTORY, so Directorate work is Kessler's problem.
  ok('its enemy thinks worse of you', D.standingWith(me, 'kessler') < 0,
     String(D.standingWith(me, 'kessler')));
  ok('a power with no stake in it does not move',
     Math.abs(D.standingWith(me, 'drossgate')) < 3, String(D.standingWith(me, 'drossgate')));

  // The bloc number still moves, because docking rights and who-shoots-first read it —
  // but at a discount, so a run of work for one desk cannot talk a whole bloc round.
  const blocMove = REP.standing('coalition') - bloc0;
  ok('the bloc number follows', blocMove > 0, String(blocMove));
  ok('but at less than the power’s own move', blocMove < D.standingWith(me, 'aurelian'),
     `${blocMove} vs ${D.standingWith(me, 'aurelian')}`);

  // Failure runs the same road in reverse.
  const before = D.standingWith(me, 'aurelian');
  const late = { id: 'x2', type: 'bounty', issuer: 'aurelian', tier: 'low', req: {},
                 station: 'x', skill: 'gunnery', pay: 3000, rep: 4, target: 99, progress: 0,
                 expires: S.time + 999, deadline: S.time - 1, base: { kills: S.player.kills } };
  S.contracts.active.push(late);
  CO.updateContracts(0.1);
  ok('an abandoned promise costs standing with the desk',
     D.standingWith(me, 'aurelian') < before);
  ok('and its enemy is pleased about it', D.standingWith(me, 'kessler') > -0.1 * before);
}

// ── 6. the whole loop, played ────────────────────────────────────────
console.log('\n— work opens work —');
{
  // The end-to-end claim of v1.02.36 through v1.02.39, run rather than argued: a character
  // who cannot take a bonded bounty does the standard work available to them, and the
  // standing and skill that work pays out carry them onto a rung whose grant is the exact
  // certificate the bonded work was asking for.
  createCharacter({ name: 'Vale', lineage: 'core', corp: 'aurelian', career: 'enforcer' });
  const me = D.playerDossier();
  D.refreshRung(me);

  const sealedBounty = { type: 'bounty', tier: CO.TIERS[1], issuer: 'aurelian' };
  const req = CO.requirementFor(sealedBounty.type, sealedBounty.tier, sealedBounty.issuer);
  ok('bonded bounty work wants a certificate', (req.quals || []).length === 1, JSON.stringify(req));
  ok('and this character does not hold it', D.qualifies(me, req).ok === false);

  const wanted = req.quals[0];
  const rung = D.LADDER.enforcer.rungs.find(r => (r.grants || []).includes(wanted));
  ok('some rung of their own ladder issues it', !!rung, wanted);

  // Do the work. `practice` is what a completed contract pays into, so this is the same
  // path a player walks — just without waiting for the kills.
  // Forty jobs. Measured, not guessed: with competence continuous the enforcer path reaches
  // rung 1 at sixteen completions and rung 2 at a hundred and eight, and the certificate
  // this section is chasing is rung 1's. Forty is comfortably past it and still a number
  // that would change loudly if the curve ever moved.
  const { practice } = await imp('systems/crew/character.js');
  for (let i = 0; i < 40; i++) practice('gunnery', CONTRACTS.practicePerJob);
  me.proficiency = D.playerDossier().proficiency;
  D.adjustStanding(me, 'aurelian', 30, 'Directorate work');
  D.refreshRung(me);

  ok('the work carried them up a rung', me.rung >= 1, String(me.rung));
  ok('the rung issued the certificate', D.grantsOf(me).includes(wanted),
     D.grantsOf(me).join(','));
  // The join that was missing until v1.02.39: a rung's grant *is* a held qualification.
  // It was reported by `grantsOf()`, printed on the dossier screen, and invisible to the
  // one function that decides whether you may take the job.
  ok('and holding it by rung counts as holding it', D.holds(me, wanted));
  ok('without having been awarded it separately', !me.quals.includes(wanted));
  ok('and the work that was locked is now open', D.qualifies(me, req).ok === true,
     D.qualifies(me, req).why);
}

// ── 7. an old save still knows what it accepted ──────────────────────
console.log('\n— a promise made under the old vocabulary is still a promise —');
{
  const save = await imp('systems/platform/save.js');
  const old = {
    v: 20, contracts: {
      boards: { 'Somewhere': [{ id: 'b', type: 'haul', issuer: 'coalition', locked: true }] },
      active: [{ id: 'a1', type: 'haul', issuer: 'coalition', target: 100, progress: 40 }],
      history: { done: 2, failed: 1 }
    }
  };
  const up = save.migrate(JSON.parse(JSON.stringify(old)));
  ok('a v20 save walks up', !!up && up.v === (await imp('core/version.js')).SCHEMA);
  const c = up.contracts.active[0];
  ok('the accepted job survives', !!c && c.id === 'a1');
  ok('with its progress', c.progress === 40);
  ok('re-keyed onto a real power', F.POWER_KEYS.includes(c.issuer), c.issuer);
  ok('in the bloc it used to name', F.POWERS[c.issuer].bloc === 'coalition');
  // A job already in hand must not become unacceptable retroactively.
  ok('and pinned to the free tier', c.tier === 'low' && Object.keys(c.req).length === 0);
  ok('the cached padlock is gone', c.locked === undefined);
  ok('the generated boards are dropped rather than converted',
     Object.keys(up.contracts.boards).length === 0);
  ok('the history is kept', up.contracts.history.done === 2);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
