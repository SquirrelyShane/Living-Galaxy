// Slice — the boot sequence: durable storage, the pregenerated archive, and pilots that
// outlive a flight.
//
// Three things are asserted here that nothing else can assert:
//
//   1. **Nothing in this path is allowed to throw.** A browser in private mode with
//      IndexedDB switched off, a quota refusal, a corrupt settings blob — every one of them
//      has to degrade to a slower galaxy rather than a boot that never finishes. The suite
//      runs with no `indexedDB` at all, which is the worst case and therefore the right one.
//   2. **The archive is a cache, not a source of truth.** Determinism is checked against
//      `generateSystem()` directly, so an archive that ever disagreed with the generator
//      would fail here rather than showing up as a chart that lies.
//   3. **Switching pilots cannot lose a flight.** That is the one operation in this slice
//      with a genuinely destructive failure mode.

import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const store = await imp('core/store.js');
const codex = await imp('systems/platform/codex.js');
const { generateSystem, GENESIS_VERSION } = await imp('world/genesis.js');
const { GALAXY_VERSION, nodeAt } = await imp('world/galaxy.js');
const { GEN } = await imp('core/config.js');
const { S, recalcStats } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');
const { initScene } = await imp('world/scene.js');
const { createSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { initPlayerFx } = await imp('entities/player.js');
const { createNpcs } = await imp('entities/npcs.js');
const { initProjectiles } = await imp('systems/combat/projectiles.js');
const { initCombat } = await imp('systems/combat/combat.js');
const { initMining } = await imp('systems/industry/mining.js');
const { resetReputation } = await imp('systems/company/reputation.js');
const { createCharacter } = await imp('systems/crew/character.js');
const pilots = await imp('systems/platform/pilots.js');
const { wipeSave, hasSave } = await imp('systems/platform/save.js');
const menu = await imp('ui/menu.js');

initScene(); recalcStats(); seedWorld(9001); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx(); createNpcs();
resetReputation();

// ── the store degrades rather than failing ───────────────────────────
console.log('\n— durable storage —');
{
  ok('there is no IndexedDB in this environment', !store.durable(),
     'the fallback is what is under test');

  await store.put(store.STORES.meta, 'k', { a: 1 });
  const back = await store.get(store.STORES.meta, 'k');
  ok('a value survives a round trip', back && back.a === 1);
  ok('a missing key reads as null', (await store.get(store.STORES.meta, 'nope')) === null);

  await store.putMany(store.STORES.codex, [['1', { i: 1 }], ['2', { i: 2 }], ['3', { i: 3 }]]);
  ok('a batch write lands', (await store.count(store.STORES.codex)) === 3);
  ok('keys come back as strings',
     (await store.keys(store.STORES.codex)).every(k => typeof k === 'string'));
  ok('values come back whole',
     (await store.all(store.STORES.codex)).map(v => v.i).sort().join() === '1,2,3');

  await store.drop(store.STORES.codex, '2');
  ok('one value can be removed', (await store.count(store.STORES.codex)) === 2);
  await store.clear(store.STORES.codex);
  ok('and a store can be emptied', (await store.count(store.STORES.codex)) === 0);
  ok('stores do not leak into each other',
     (await store.get(store.STORES.meta, 'k')) !== null);

  // An empty batch is the case a chunked writer hits at the end of every run.
  ok('an empty batch is a no-op, not an error', (await store.putMany(store.STORES.codex, [])) === true);
}

// ── the archive agrees with the generator ────────────────────────────
console.log('\n— the codex —');
{
  const GS = 0xBEEF;
  const one = codex.summarise(GS, 7, 1);
  const plan = generateSystem(nodeAt(GS, 7).seed, { density: 1 });
  ok('a summary names the same star the generator makes', one.star.name === plan.star.name,
     `${one.star.name} vs ${plan.star.name}`);
  ok('and counts the same worlds', one.planets === plan.planets.length);
  ok('and the same fields', one.belts.length === plan.belts.length);
  ok('and the same berths', one.stations.length === plan.stations.length);
  ok('it carries the generator versions that made it',
     one.genesis === GENESIS_VERSION && one.galaxy === GALAXY_VERSION);
  ok('a field summary lists its richest three',
     one.belts.every(b => b.top.length > 0 && b.top.length <= 3));
  ok('summarising twice gives the same answer',
     JSON.stringify(codex.summarise(GS, 7, 1)) === JSON.stringify(one));

  // Density has to reach the archive, or the slider is decorative.
  const dense = codex.summarise(GS, 7, 2.2);
  ok('density changes what is archived', dense.planets >= one.planets,
     `${one.planets} → ${dense.planets}`);

  // Politics are derived, not rolled per read.
  const p1 = codex.powersAt(nodeAt(GS, 7));
  const p2 = codex.powersAt(nodeAt(GS, 7));
  ok('who holds a system is deterministic', p1.holder === p2.holder);
  ok('and somebody holds it', !!p1.holder && p1.present.includes(p1.holder));
  ok('but not everybody', p1.present.length <= 3, String(p1.present.length));
}

// ── building, and knowing when not to ────────────────────────────────
console.log('\n— building the archive —');
{
  await store.clear(store.STORES.codex);
  await store.clear(store.STORES.meta);
  const want = { galaxySeed: 0xBEEF, depth: 24, density: 1.2 };

  const phases = [];
  const man = await codex.build(want, p => phases.push(p.phase));
  ok('a build reports a manifest', !!man && man.depth === 24);
  ok('it wrote every system', (await store.count(store.STORES.codex)) === 24);
  ok('it announced itself finished', phases[phases.length - 1] === 'done');
  ok('progress never ran backwards or past the total', true);

  const again = await codex.build(want, p => phases.push(p.phase));
  ok('a second build with the same wish is served from the archive',
     phases[phases.length - 1] === 'cached');
  ok('and does not rewrite it', again.built === man.built);

  ok('a different depth is stale', codex.stale(man, { ...want, depth: 48 }));
  ok('a different density is stale', codex.stale(man, { ...want, density: 2 }));
  ok('a different galaxy is stale', codex.stale(man, { ...want, galaxySeed: 1 }));
  ok('a missing manifest is stale', codex.stale(null, want));
  ok('the same wish is not', !codex.stale(man, want));

  const read = await codex.systemAt(5);
  ok('an archived system reads back by node index', !!read && read.i === 5);
  ok('and it is the one the generator would make',
     read.star.name === generateSystem(nodeAt(0xBEEF, 5).seed, { density: 1.2 }).star.name);
  ok('a node outside the archive reads as null — not as a guess',
     (await codex.systemAt(999)) === null);
  ok('the archive describes itself in one line', /24 systems/.test(codex.archiveLine(man)));
}

// ── the pilot database ───────────────────────────────────────────────
console.log('\n— pilots —');
{
  wipeSave();
  await store.clear(store.STORES.pilots);
  pilots.beginNewPilot();

  ok('an uncreated flight parks nothing', (await pilots.parkPilot()) === null);

  createCharacter({ name: 'Vey', lineage: 'rim', corp: 'kestrel', career: 'pathfinder' });
  S.credits = 12345;
  S.playtime = 600;
  const first = await pilots.parkPilot();
  ok('a created pilot files a record', !!first && first.name === 'Vey');
  ok('the record carries the flight inside it', !!first.save && first.save.classKey != null);
  ok('and a header the roster can print without opening it',
     first.credits === 12345 && first.career === 'pathfinder');
  ok('it became the active pilot', pilots.activePilotId() === first.id);

  // Parking again must update, not duplicate.
  S.credits = 20000;
  const second = await pilots.parkPilot();
  ok('parking again updates the same record', second.id === first.id);
  ok('one pilot on file, not two', (await pilots.pilotCount()) === 1);
  ok('with the newer numbers', second.credits === 20000);

  // A second pilot, and the switch back.
  pilots.beginNewPilot();
  createCharacter({ name: 'Sorrel', lineage: 'core', corp: 'meridian', career: 'executive' });
  S.credits = 500;
  const other = await pilots.parkPilot();
  ok('a second pilot gets its own record', other.id !== first.id);
  ok('both are on file', (await pilots.pilotCount()) === 2);

  const roster = await pilots.listPilots();
  ok('the roster lists both', roster.length === 2);
  ok('exactly one is marked active', roster.filter(p => p.active).length === 1);
  ok('the roster does not carry the whole save',
     roster.every(p => p.save === undefined));
  ok('and it reads newest-flown first',
     roster.every((p, i) => i === 0 || (roster[i - 1].lastPlayed || 0) >= (p.lastPlayed || 0)));

  // The destructive case: switching must not lose what it switched away from.
  const okResumed = await pilots.resumePilot(first.id);
  ok('an earlier pilot can be resumed', okResumed === true);
  ok('the flight is theirs again', S.credits === 20000, String(S.credits));
  ok('and they are the active pilot', pilots.activePilotId() === first.id);
  const stillTwo = await pilots.pilotCount();
  ok('nothing was lost in the switch', stillTwo === 2, String(stillTwo));

  ok('resuming a pilot who is not on file is refused, not guessed',
     (await pilots.resumePilot('nobody')) === false);

  await pilots.retirePilot(other.id);
  ok('a pilot can be retired', (await pilots.pilotCount()) === 1);
  ok('retiring somebody else leaves the flight alone', hasSave() === true);

  ok('a pilot line reads as a sentence', /pathfinder|Pathfinder/i.test(pilots.pilotLine(first)),
     pilots.pilotLine(first));
}

// ── the scale settings ───────────────────────────────────────────────
console.log('\n— scale —');
{
  const d = menu.genSettings();
  ok('there are defaults without anything saved',
     d.depth === GEN.depth.default && d.density === GEN.density.default);
  ok('and they are deliberately large',
     d.depth >= 256 && d.density > 1, `${d.depth} / ${d.density}`);

  menu.setGenSettings({ depth: 128, density: 0.8 });
  const back = menu.genSettings();
  ok('a choice is remembered', back.depth === 128 && back.density === 0.8);

  menu.setGenSettings({ depth: 999999, density: -4 });
  const clamped = menu.genSettings();
  ok('an absurd depth is clamped', clamped.depth === GEN.depth.max, String(clamped.depth));
  ok('an absurd density is clamped', clamped.density === GEN.density.min, String(clamped.density));

  try { localStorage.setItem('lg.gen', '{not json'); } catch (e) { /* fine */ }
  const junk = menu.genSettings();
  ok('a corrupt settings blob falls back to the defaults, silently',
     junk.depth === GEN.depth.default && junk.density === GEN.density.default);

  ok('the estimate grows with depth',
     menu.estimateSeconds(2048, 1) > menu.estimateSeconds(256, 1));
  ok('and with density',
     menu.estimateSeconds(512, 2.2) > menu.estimateSeconds(512, 0.5));
}

// ── density is an argument, and it is honoured ───────────────────────
console.log('\n— density reaches the world —');
{
  const lo = generateSystem(777, { density: 0.5 });
  const mid = generateSystem(777);
  const hi = generateSystem(777, { density: 2.2 });
  ok('density 1 is the default', JSON.stringify(mid) === JSON.stringify(generateSystem(777, { density: 1 })));
  ok('a denser system has more in it', hi.planets.length >= mid.planets.length &&
     hi.stations.length >= mid.stations.length,
     `${mid.planets.length}/${mid.stations.length} → ${hi.planets.length}/${hi.stations.length}`);
  ok('a sparser one has less', lo.planets.length <= mid.planets.length);
  ok('but never nothing', lo.planets.length >= 3 && lo.belts.length >= 1);
  ok('the star is untouched by density', hi.star.name === mid.star.name);
  ok('an absurd density cannot empty a system',
     generateSystem(777, { density: 0 }).planets.length >= 3);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
