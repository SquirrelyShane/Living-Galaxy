// Slice 5a — the pilot. Creation from lineage/corp/career, two progression tracks that
// answer different questions, licences as a soft gate that hardens, and the agent chain.
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
const { CHAR, REP, SHIP_CLASSES } = await imp('core/config.js');
const { SCHEMA } = await imp('core/version.js');
const O = await imp('data/origins.js');
const F = await imp('data/factions.js');

// The bonus keys `characterBonuses()` actually sums *and* something downstream spends.
// v1.02.37 found two employers whose entire perk was a key nothing consumed — declared,
// summed, and dropped on the floor. A perk that changes no number is worse than no perk,
// because the card in the creation screen promises something.
const LIVE_BONUS = new Set(['weaponMult', 'miningMult', 'energyRegenAdd', 'warpSpeedMult',
  'sensorMult', 'scanRate', 'tradeBonus', 'signatureMult', 'cargoPct',
  'repairDiscount', 'upgradeDiscount', 'dockDiscount']);
const ch = await imp('systems/crew/character.js');
const mi = await imp('systems/trade/missions.js');
const rep = await imp('systems/company/reputation.js');
const det = await imp('systems/combat/detection.js');
const { initScene } = await imp('world/scene.js');
const { createSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { initPlayerFx } = await imp('entities/player.js');
const { initProjectiles } = await imp('systems/combat/projectiles.js');
const { initCombat } = await imp('systems/combat/combat.js');
const { initMining } = await imp('systems/industry/mining.js');
const { initWorldSim } = await imp('systems/platform/worldsim.js');
const { switchClass } = await imp('systems/trade/economy.js');
const save = await imp('systems/platform/save.js');

initScene(); recalcStats(); seedWorld(1337); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx();
rep.resetReputation(); initWorldSim();

const make = (over = {}) => ch.createCharacter(Object.assign(
  { name: 'Test', lineage: 'belter', corp: 'freewake', career: 'prospector' }, over));

// ── data integrity ───────────────────────────────────────────────────
console.log('\n— origins data —');
ok('four lineages', O.LINEAGE_KEYS.length === 4);
ok('exactly one is machine-descended',
   O.LINEAGE_KEYS.filter(k => O.LINEAGES[k].machine).length === 1);
ok('every lineage offers corporations',
   O.LINEAGE_KEYS.every(k => O.corpsFor(k).length >= 2));
ok('every offered corporation exists',
   O.LINEAGE_KEYS.every(k => O.LINEAGES[k].corps.every(c => !!O.CORPORATIONS[c])));
ok('every career maps to a real hull',
   O.CAREER_KEYS.every(k => !!SHIP_CLASSES[O.CAREERS[k].hull]));
ok('every career has an agent', O.CAREER_KEYS.every(k => !!O.AGENTS[O.CAREERS[k].agent]));
ok('every agent greets every lineage',
   O.AGENT_KEYS.every(a => O.LINEAGE_KEYS.every(l => !!O.AGENTS[a].greet[l])));
ok('every career grants a licence that exists',
   O.CAREER_KEYS.every(k => !!CHAR.licences[O.CAREERS[k].licence]));

// no lineage is strictly better than another — the property that makes the choice a choice
{
  let dominated = null;
  for (const a of O.LINEAGE_KEYS) {
    for (const b of O.LINEAGE_KEYS) {
      if (a === b) continue;
      const A = O.LINEAGES[a], B = O.LINEAGES[b];
      const everyStartAtLeast = O.SKILL_KEYS.every(k => (A.start[k] || 0) >= (B.start[k] || 0));
      const everyAffAtLeast = O.SKILL_KEYS.every(k => (A.affinity[k] || 1) >= (B.affinity[k] || 1));
      const strictlyMore = O.SKILL_KEYS.some(k =>
        (A.start[k] || 0) > (B.start[k] || 0) || (A.affinity[k] || 1) > (B.affinity[k] || 1));
      if (everyStartAtLeast && everyAffAtLeast && strictlyMore) dominated = `${a} dominates ${b}`;
    }
  }
  ok('no lineage dominates another on skills', !dominated, dominated || '');
}
ok('every lineage is worse than average at something',
   O.LINEAGE_KEYS.every(k => O.SKILL_KEYS.some(s => (O.LINEAGES[k].affinity[s] || 1) < 1)));

// ── creation ─────────────────────────────────────────────────────────
console.log('\n— creation —');
{
  const c = make();
  ok('a pilot is created', !!c && ch.hasCharacter());
  ok('the name is kept', c.name === 'Test');
  ok('starting skills combine lineage and career',
     c.skills.extraction === (O.LINEAGES.belter.start.extraction + O.CAREERS.prospector.start.extraction),
     String(c.skills.extraction));
  ok('the career hull is issued and owned',
     S.player.classKey === 'industrial' && S.ownedHulls.industrial === true);
  ok('the career licence is issued', ch.hasLicence('industrial'));
  ok('no other licence is issued', Object.keys(S.licences).length === 1);
  ok('credits combine lineage and corporation',
     S.credits === O.LINEAGES.belter.credits + O.CORPORATIONS['freewake'].credits,
     String(S.credits));
  ok('standing combines lineage and corporation',
     rep.standing('independent') ===
       (O.LINEAGES.belter.standing.independent + O.CORPORATIONS['freewake'].standing.independent),
     String(rep.standing('independent')));
  ok('starting points are granted', c.points === CHAR.startingPoints);
}
// Core-born may now come out of Meridian, the Directorate or Severance — the employer
// table is the nine powers as of v1.02.37 — so the refusal has to name one that really is
// outside the list. A Core-born pilot did not crew for the Kessler Compact.
ok('a corporation outside the lineage is refused',
   make({ lineage: 'core', corp: 'kessler' }) === null);

// ── retired employers still load (v1.02.37) ─────────────────────────
// `character.corp` is persisted, so a save can carry a key the table no longer has. An
// unresolved one makes `createCharacter` return null, which on a load path is a character
// that silently fails to rebuild — the worst shape a migration bug can take.
{
  const legacy = make({ lineage: 'belter', corp: 'meridian-collective', career: 'prospector' });
  ok('a retired employer still produces a pilot', !!legacy);
  ok('and resolves onto a real one', legacy && legacy.corp === 'freewake', legacy && legacy.corp);
  ok('the alias table only points at employers that exist',
     Object.values(O.CORP_ALIASES).every(k => !!O.CORPORATIONS[k]),
     Object.values(O.CORP_ALIASES).filter(k => !O.CORPORATIONS[k]).join(','));
  ok('and never points at another alias',
     Object.values(O.CORP_ALIASES).every(k => !O.CORP_ALIASES[k]));
  ok('resolveCorp leaves a live key alone', O.resolveCorp('freewake') === 'freewake');
  ok('and passes an unknown one straight through', O.resolveCorp('nobody') === 'nobody');

  // A migrated employer is allowed to sit outside the lineage's current option list — the
  // list is what creation offers today, not a claim about who ever employed anybody.
  const cross = make({ lineage: 'nexis', corp: 'long-dark', career: 'pathfinder' });
  ok('a migrated employer outside the modern list still loads', !!cross, cross && cross.corp);

  // Every employer is a power, which is the whole point of the rewrite.
  ok('every employer is one of the nine powers',
     O.CORP_KEYS.every(k => !!F.POWERS[k]),
     O.CORP_KEYS.filter(k => !F.POWERS[k]).join(','));
  ok('every lineage offers at least three employers',
     O.LINEAGE_KEYS.every(l => O.LINEAGES[l].corps.length >= 3),
     O.LINEAGE_KEYS.filter(l => O.LINEAGES[l].corps.length < 3).join(','));
  ok('every offered employer exists',
     O.LINEAGE_KEYS.every(l => O.LINEAGES[l].corps.every(c => !!O.CORPORATIONS[c])));
  ok('CORP_POWERS names every employer',
     O.CORP_KEYS.every(k => !!O.CORP_POWERS[k]),
     O.CORP_KEYS.filter(k => !O.CORP_POWERS[k]).join(','));
  ok('an employer stands best with its own power',
     O.CORP_KEYS.every(k => {
       const t = O.CORP_POWERS[k];
       return Object.keys(t).every(p => t[k] >= t[p]);
     }),
     O.CORP_KEYS.filter(k => {
       const t = O.CORP_POWERS[k];
       return !Object.keys(t).every(p => t[k] >= t[p]);
     }).join(','));
  ok('every perk uses a bonus key the game consumes',
     O.CORP_KEYS.every(k => Object.keys(O.CORPORATIONS[k].bonus || {}).every(b => LIVE_BONUS.has(b))),
     O.CORP_KEYS.flatMap(k => Object.keys(O.CORPORATIONS[k].bonus || {}))
       .filter(b => !LIVE_BONUS.has(b)).join(','));
}
ok('an unknown lineage is refused', make({ lineage: 'martian' }) === null);
ok('an unknown career is refused', make({ career: 'poet' }) === null);
ok('a blank name still produces a pilot', (() => {
  const c = make({ name: '   ' });
  return c && c.name.length > 0;
})());

// Each career launches you in its own hull — except a founding one, which launches you in
// none. A `shipless` career grants the licence for its charter hull and not the hull, so it
// starts in the civilian shuttle it is also licensed for. Pointing `classKey` at a freighter
// nobody owns was the visible half of that bug: the HUD read out a 6,000 kg hold and the
// yard called it IN USE.
for (const key of O.CAREER_KEYS) {
  const K = O.CAREERS[key];
  const c = make({ lineage: 'rim', corp: 'freewake', career: key });
  const wanted = K.shipless ? 'civilian' : K.hull;
  ok(`${key} launches in the ${wanted} hull`, !!c && S.player.classKey === wanted);
  ok(`${key} owns what it is flying`, !!(S.ownedHulls || {})[S.player.classKey] === !K.shipless,
     `${Object.keys(S.ownedHulls || {}).join(',') || 'nothing'}`);
}

// the agent line changes with the lineage — the cheapest way the choice feels like a person
{
  const a1 = O.agentFor('enforcer', 'nexis');
  const a2 = O.agentFor('enforcer', 'core');
  ok('the same agent greets two lineages differently', a1.line !== a2.line);
  ok('the agent is the same person', a1.key === a2.key);
  ok('an unknown career has no agent', O.agentFor('poet', 'core') === null);
}

// ── skills from use ──────────────────────────────────────────────────
console.log('\n— practice —');
{
  make({ lineage: 'belter', corp: 'freewake', career: 'prospector' });
  const before = ch.skill('extraction');
  // 1.0 slowed progression considerably, so a fixture that ranked up in 200 small calls
  // no longer does. The assertion is "work raises the skill", not "one rank per 1000
  // practice units", so the loop is sized against the live rank cost rather than a
  // number someone typed in 0.6.
  const need = ch.rankCost(before) / (CHAR.practiceRate * ch.affinity('extraction'));
  for (let i = 0; i < Math.ceil(need / 5) + 40; i++) ch.practice('extraction', 5);
  ok('doing the work raises the skill', ch.skill('extraction') > before,
     `${before} → ${ch.skill('extraction')}`);
  ok('practice also earns levels', S.character.level > 1, String(S.character.level));
  ok('levelling grants points', S.character.points > CHAR.startingPoints);
}
{
  // affinity: the same practice goes further for the lineage built for it
  make({ lineage: 'belter', corp: 'freewake', career: 'prospector' });
  for (let i = 0; i < 400; i++) ch.practice('extraction', 5);
  const belterRank = ch.skill('extraction');
  make({ lineage: 'core', corp: 'meridian', career: 'prospector' });
  for (let i = 0; i < 400; i++) ch.practice('extraction', 5);
  const coreRank = ch.skill('extraction');
  ok('lineage affinity changes how fast a skill climbs', belterRank >= coreRank,
     `belter ${belterRank} vs core ${coreRank}`);
  ok('affinity is reported', ch.affinity('extraction') !== 1);
}
{
  make();
  ok('practice on an unknown skill is ignored', ch.practice('cooking', 100) === 0);
  ok('zero practice does nothing', ch.practice('gunnery', 0) === 0);
  ok('negative practice does nothing', ch.practice('gunnery', -50) === 0);
  const r0 = ch.skill('gunnery');
  ch.practice('gunnery', 1);
  ok('a tiny amount does not immediately rank up', ch.skill('gunnery') === r0);
  ok('rank progress is reported as a fraction',
     ch.rankProgress('gunnery') > 0 && ch.rankProgress('gunnery') < 1);
}
{
  make();
  for (let i = 0; i < 4000; i++) ch.practice('gunnery', 40);
  ok('skills cap at the maximum rank', ch.skill('gunnery') === CHAR.maxRank, String(ch.skill('gunnery')));
  ok('practice at the cap is refused', ch.practice('gunnery', 100) === 0);
  ok('each rank costs more than the last', ch.rankCost(5) > ch.rankCost(1));
}

// ── points ───────────────────────────────────────────────────────────
console.log('\n— points —');
{
  make();
  const key = 'commerce';
  const before = ch.skill(key), pts = S.character.points;
  ok('a point can be spent', ch.spendPoint(key) === true);
  ok('the rank went up', ch.skill(key) === before + 1);
  ok('the point was consumed', S.character.points === pts - 1);
  while (S.character.points > 0) ch.spendPoint(key);
  ok('spending with no points left is refused', ch.spendPoint(key) === false);
  ok('spending on an unknown skill is refused', ch.spendPoint('cooking') === false);
  ok('pointsSpent tracks the investment', ch.pointsSpent() === CHAR.startingPoints);
}
{
  // the two tracks stack rather than replacing each other — the whole reason for both
  make();
  const fromUse = () => S.character.skills.gunnery;
  for (let i = 0; i < 600; i++) ch.practice('gunnery', 5);
  const used = fromUse();
  ch.spendPoint('gunnery');
  ok('a spent point adds on top of earned ranks', ch.skill('gunnery') === used + 1,
     `${used} earned + 1 spent = ${ch.skill('gunnery')}`);
}

// ── derived effects ──────────────────────────────────────────────────
console.log('\n— what a rank is worth —');
{
  make({ lineage: 'core', corp: 'meridian', career: 'enforcer' });
  recalcStats();
  const weak = S.stats.weaponMult;
  for (let i = 0; i < 400; i++) ch.practice('gunnery', 10);
  recalcStats();
  ok('gunnery raises weapon output', S.stats.weaponMult > weak,
     `${weak.toFixed(3)} → ${S.stats.weaponMult.toFixed(3)}`);

  make({ lineage: 'belter', corp: 'freewake', career: 'prospector' });
  recalcStats();
  const dull = S.stats.miningMult;
  for (let i = 0; i < 400; i++) ch.practice('extraction', 10);
  recalcStats();
  ok('extraction raises mining yield', S.stats.miningMult > dull);

  make({ lineage: 'rim', corp: 'kestrel', career: 'pathfinder' });
  recalcStats();
  const near = S.stats.sensor;
  for (let i = 0; i < 400; i++) ch.practice('sensors', 10);
  recalcStats();
  ok('sensors extend detection range', S.stats.sensor > near);
}
{
  // signature: lineage, corporation and skill all pull the same lever
  make({ lineage: 'core', corp: 'meridian', career: 'broker' });
  recalcStats();
  const loud = det.playerSignature();
  make({ lineage: 'nexis', corp: 'severance', career: 'broker' });
  recalcStats();
  const quiet = det.playerSignature();
  ok('a machine-descended Severance pilot runs quieter', quiet < loud,
     `${loud.toFixed(3)} vs ${quiet.toFixed(3)}`);
  for (let i = 0; i < 600; i++) ch.practice('sensors', 10);
  recalcStats();
  ok('sensor training makes you quieter still', det.playerSignature() < quiet);
  ok('nothing makes a hull invisible', ch.signatureScale() >= CHAR.signatureFloor);
}
ok('a pilotless flight has neutral bonuses', (() => {
  S.character = null;
  const b = ch.characterBonuses();
  return Object.values(b).every(v => v === 0);
})());
S.character = null;
ok('skill of a pilotless flight is zero', ch.skill('gunnery') === 0);

// ── licences ─────────────────────────────────────────────────────────
console.log('\n— licences —');
{
  make({ lineage: 'core', corp: 'meridian', career: 'broker' });
  ok('you launch licensed for your own hull', ch.hasLicence('economic'));
  ok('and for nothing else', !ch.hasLicence('military'));
  ok('an unlicensed hull cannot be flown even if owned', (() => {
    S.ownedHulls.military = true;
    return switchClass('military') === false && S.player.classKey === 'economic';
  })());
  ok('a blocked licence explains itself',
     typeof ch.licenceBlocker('military') === 'string');
  ok('the blocker names the missing skill',
     ch.licenceBlocker('military').includes('gunnery'));

  for (let i = 0; i < 500; i++) ch.practice('gunnery', 10);
  S.credits = 500;
  ok('skill alone is not enough', ch.licenceBlocker('military') === 'Insufficient credits');
  S.credits = 999999;
  ok('skill plus credits certifies you', ch.buyLicence('military') === true);
  ok('the licence is held', ch.hasLicence('military'));
  ok('a licensed hull can now be flown', switchClass('military') === true);
  ok('buying it twice is refused', ch.buyLicence('military') === false);

  // skill past the requirement discounts the fee
  make({ lineage: 'core', corp: 'meridian', career: 'broker' });
  for (let i = 0; i < 300; i++) ch.practice('gunnery', 10);
  const atReq = ch.licencePrice('military');
  for (let i = 0; i < 900; i++) ch.practice('gunnery', 10);
  ok('being over-qualified costs less', ch.licencePrice('military') < atReq,
     `${atReq} → ${ch.licencePrice('military')}`);
  ok('the discount is bounded',
     ch.licencePrice('military') >= CHAR.licences.military.price * (1 - CHAR.licenceMaxCut) * 0.8);
  ok('an unknown hull has no licence', ch.licenceReq('dreadnought') === null);
}

// ── agent chain ──────────────────────────────────────────────────────
console.log('\n— agent chain —');
{
  make({ lineage: 'core', corp: 'solaris-authority', career: 'enforcer' });
  const first = mi.beginAgentChain();
  ok('a chain begins', !!first && first.index === 1);
  ok('the chain knows its length', first.total === mi.chainFor('enforcer').length);
  ok('the briefing names the agent', (() => {
    const b = mi.agentBriefing();
    return b && b.agent && b.agent.name && b.mission;
  })());

  const before = S.credits;
  S.player.kills += 1;
  mi.updateMissions();
  ok('a completed step advances the chain', mi.currentMission().index === 2);
  ok('the step paid out', S.credits > before, `+${S.credits - before}`);
  ok('completed steps are recorded', S.missions.done.length === 1);

  S.player.kills += 3;
  mi.updateMissions();
  ok('the second step completes on its own terms', mi.currentMission().index === 3);

  S.credits += 100000;
  mi.updateMissions();
  ok('the chain finishes', mi.missionsComplete() && mi.currentMission() === null);
  ok('a finished chain reports complete', mi.agentBriefing().complete === true);
  ok('polling a finished chain is harmless', (() => { mi.updateMissions(); return true; })());

  // every career's chain is well formed
  ok('every career has a chain', O.CAREER_KEYS.every(k => (mi.chainFor(k) || []).length >= 3));
  ok('every step has a brief, a check and a reward',
     O.CAREER_KEYS.every(k => mi.chainFor(k).every(s =>
       s.title && s.brief && typeof s.check === 'function' && s.reward)));
  ok('every step id is unique', (() => {
    const ids = O.CAREER_KEYS.flatMap(k => mi.chainFor(k).map(s => s.id));
    return new Set(ids).size === ids.length;
  })());

  // a step whose check throws must not take the frame loop down
  S.missions = { chain: 'enforcer', step: 0, base: null, done: [] };
  const chain = mi.chainFor('enforcer');
  const good = chain[0].check;
  chain[0].check = () => { throw new Error('bad step'); };
  ok('a throwing step is contained', (() => { mi.updateMissions(); return S.missions.step === 0; })());
  chain[0].check = good;
}

// ── persistence ──────────────────────────────────────────────────────
console.log('\n— persistence —');
ok('the schema is at or past the pilot', SCHEMA >= 5);
{
  save.wipeSave();
  make({ lineage: 'nexis', corp: 'severance', career: 'pathfinder' });
  mi.beginAgentChain();
  for (let i = 0; i < 260; i++) ch.practice('sensors', 5);
  ch.spendPoint('navigation');
  S.credits = 42000;

  const rank = ch.skill('sensors');
  const level = S.character.level;
  const snap = save.snapshot();
  ok('the snapshot carries the pilot', !!snap.character && snap.character.lineage === 'nexis');
  ok('the snapshot carries licences', !!snap.licences.civilian);
  ok('the snapshot carries mission progress', !!snap.missions);

  save.saveGame(true);
  S.character = null; S.licences = {}; S.missions = null;
  ok('the flight reloads', save.loadGame() === true);
  ok('the pilot comes back', ch.hasCharacter() && S.character.lineage === 'nexis');
  ok('earned ranks survive', ch.skill('sensors') === rank, `${rank} vs ${ch.skill('sensors')}`);
  ok('spent points survive', S.character.spent.navigation === 1);
  ok('the level survives', S.character.level === level);
  ok('licences survive', ch.hasLicence('civilian'));
  ok('the agent chain survives', !!mi.currentMission() || mi.missionsComplete());
  ok('saveInfo reports the pilot', (() => {
    const i = save.saveInfo();
    return i && i.pilot && i.pilot.lineage === 'nexis';
  })());

  // a v4 save — everything before this patch — has no pilot and must not be given one
  const legacy = JSON.parse(JSON.stringify(snap));
  delete legacy.character; delete legacy.licences; delete legacy.missions;
  legacy.v = 4;
  legacy.ownedHulls = { military: true, economic: true };
  legacy.classKey = 'military';
  const migrated = save.migrate(legacy);
  ok('a v4 save migrates all the way forward', migrated && migrated.v === SCHEMA);
  ok('migration does not invent a pilot', migrated.character === null);
  ok('migration grandfathers every owned hull',
     migrated.licences.military === true && migrated.licences.economic === true);

  save.wipeSave();
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
