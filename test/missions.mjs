// The mission board: is a job a place, or a sentence with a number in it?
//
// The complaint this suite exists to keep fixed was "the same ones over and over", and the
// cause was structural rather than a tuning problem. The board had four types. Two of them
// named no location whatsoever — a bounty said "Raiders in the lanes. Destroy them; the
// board does not care where" and a survey said "Resolve detail on bodies nobody has bothered
// to look at properly" — so every bounty in the galaxy was the same bounty. Four offers per
// station refreshing every ninety seconds, drawn from four templates: a player saw the whole
// board inside two minutes.
//
// The fix borrows the world catalogue's rule. A template declares the kind of *place* it
// needs, `world/landmarks.js` says what places exist, and only templates the live system can
// satisfy are offered. So the assertions below are mostly about that gate holding — a search
// job in a system with no debris field is not unlikely, it is unrepresentable — and about
// the board being made of the system it is posted in.
//
// The second half is the graveyards. They are the reason `search` exists as a verb, and the
// property worth pinning is depletion: a field yields less each time it is worked and then
// it is genuinely finished. That is what makes it a place with a history rather than a
// vending machine (a belt) or a locked box (an anomaly).

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
const G = await imp('world/genesis.js');
const sys = await imp('world/system.js');
const ast = await imp('world/asteroids.js');
const L = await imp('world/landmarks.js');
const SV = await imp('systems/industry/salvage.js');
const CO = await imp('systems/trade/contracts.js');
const B = await imp('data/worldgen/battles.js');
const T = await imp('data/missions/templates.js');

function boot(seed) {
  S.seed = seed;
  seedWorld(seed);
  S.systemPlan = G.generateSystem(seed);
  S.graves = {}; S.graveSweeps = 0;
  // The world is rebuilt, not added to. `createSystem` appends into `S.world`, so a suite
  // that boots eight seeds in a row and forgets this ends up asserting against a hundred and
  // thirty stations from eight different systems — which is how "528 offers" happened.
  S.world.bodies = []; S.world.stations = []; S.world.asteroids = [];
  S.world.npcs = []; S.world.loot = []; S.world.belts = []; S.world.decoys = [];
  initScene(); recalcStats();
  sys.createSystem(S.systemPlan);
  ast.createAsteroids(S.systemPlan);
  L.resetLandmarks();
  CO.initContracts();
}

boot(20260814);

// ── the catalogue ────────────────────────────────────────────────────
console.log('\n— battles are possible where they are placed —');
{
  ok('there are battle kinds', B.BATTLE_KEYS.length >= 6, String(B.BATTLE_KEYS.length));
  ok('and things to find in a field', B.FIND_KEYS.length >= 4, String(B.FIND_KEYS.length));

  // The envelope gate, which is the same rule the world catalogue runs on. A boarding
  // action in empty space is not unlikely, it is nonsense, and the point of declaring the
  // conditions is that the generator never has to decide how nonsensical is too nonsensical.
  const deep = { nearStation: false, nearBelt: false, deepSpace: true, ageYears: 300 };
  const berth = { nearStation: true, nearBelt: false, deepSpace: false, ageYears: 20 };

  ok('a boarding action needs something to board',
     !B.battleFits(B.BATTLE_KINDS.boarding, deep));
  ok('a siege needs something to besiege',
     !B.battleFits(B.BATTLE_KINDS.siege, deep));
  ok('a lost expedition happens where nobody was going',
     !B.battleFits(B.BATTLE_KINDS.lostExpedition, berth));
  ok('a claim war needs rock to claim',
     !B.battleFits(B.BATTLE_KINDS.beltSkirmish, deep));

  // Age is a gate too: a fight nobody alive remembers cannot be last year's blockade run.
  ok('a lost expedition is never recent',
     !B.battleFits(B.BATTLE_KINDS.lostExpedition,
       { deepSpace: true, nearStation: false, nearBelt: false, ageYears: 3 }));

  // Every plausible site must admit at least one kind, or a system silently generates fewer
  // fields than its seed asked for and nobody notices.
  const sites = [];
  for (const nearStation of [true, false]) {
    for (const nearBelt of [true, false]) {
      for (const deepSpace of [true, false]) {
        for (const ageYears of [2, 15, 90, 300, 800]) {
          if (nearStation && deepSpace) continue;      // not a real combination
          sites.push({ nearStation, nearBelt, deepSpace, ageYears });
        }
      }
    }
  }
  const barren = sites.filter(x => B.candidateBattles(x).length === 0);
  ok(`every plausible site admits a battle kind (${sites.length} checked)`,
     barren.length === 0, JSON.stringify(barren[0] || {}));
}

// ── landmarks ────────────────────────────────────────────────────────
console.log('\n— the system knows what is in it —');
{
  const marks = L.landmarks();
  const kinds = {};
  for (const m of marks) kinds[m.kind] = (kinds[m.kind] || 0) + 1;

  ok('landmarks cover every kind of place', Object.keys(kinds).length >= 4, JSON.stringify(kinds));
  ok('every landmark has an id, a name and a position',
     marks.every(m => m.id && m.name && typeof m.at === 'function'));
  ok('ids are unique', new Set(marks.map(m => m.id)).size === marks.length);
  ok('every landmark carries tags', marks.every(m => m.tags && m.tags.size > 0));

  // The tag that leaked, and the reason tags are a claim about what a place *is* rather than
  // what it is near: a debris field sited inside a belt was tagged `belt`, and the extraction
  // templates started posting "Ore quota — Widow Litter" against a graveyard.
  const graves = marks.filter(m => m.kind === 'graveyard');
  ok('a graveyard is never tagged as a belt', graves.every(g => !g.tags.has('belt')),
     graves.filter(g => g.tags.has('belt')).map(g => g.name).join(' '));
  ok('…even when it sits in one',
     graves.every(g => !g.grave.nearBelt || g.tags.has('in-belt')));

  ok('positions are live, not cached',
     marks.every(m => { const a = m.at({}); return isFinite(a.x) && isFinite(a.y) && isFinite(a.z); }));
}

console.log('\n— every system has a past —');
{
  let total = 0, systems = 0, kinds = new Set();
  for (const seed of [1, 7, 42, 1337, 20260814, 99991, 424242, 5150]) {
    boot(seed);
    const g = L.graveyards();
    total += g.length; systems++;
    for (const x of g) kinds.add(x.kindKey);

    // The siting rule that makes the history readable, checked rather than assumed.
    for (const x of g) {
      if (!B.battleFits(B.BATTLE_KINDS[x.kindKey], x)) {
        ok(`${x.name} suits its site`, false, `${x.kindKey} at ${JSON.stringify({
          nearStation: x.nearStation, nearBelt: x.nearBelt, deepSpace: x.deepSpace, ageYears: x.ageYears })}`);
      }
    }
  }
  ok(`every system has at least one field (${systems} checked)`, total >= systems, String(total));
  ok('and more than one kind of fight occurs', kinds.size >= 4, [...kinds].join(' '));

  boot(20260814);
  const g = L.graveyards();
  ok('a field names who fought', g.every(x => x.belligerentNames.length === 2));
  ok('…and they are two different powers', g.every(x => x.belligerents[0] !== x.belligerents[1]));
  ok('fields do not overlap each other',
     g.every((a, i) => g.every((b, j) => i === j ||
       Math.abs(a.orbit - b.orbit) >= L.GRAVEYARD.minSeparation)));

  // Derived, never stored — the same trade the anomaly layer makes.
  L.resetLandmarks();
  const again = L.graveyards();
  ok('the same seed derives the same fields',
     JSON.stringify(g.map(x => x.key + x.name + x.orbit)) ===
     JSON.stringify(again.map(x => x.key + x.name + x.orbit)));
}

// ── searching ────────────────────────────────────────────────────────
console.log('\n— a field runs out —');
{
  boot(20260814);
  const g = L.graveyards()[0];
  ok('there is a field to work', !!g);

  ok('an untouched field is full', SV.remaining(g.key) === 1);
  ok('…and reads as undisturbed', SV.fieldState(g) === 'undisturbed');

  // Range is a real gate: you have to be in the field.
  const far = SV.search(g);
  ok('a field cannot be worked from across the system', !far.ok && far.reason === 'out of range');

  // Work it to the bottom. `ignoreRange` is the fleet-layer entry point, and it is what lets
  // this run without flying anything.
  let sweeps = 0, credits = 0, mass = 0, relics = 0, last = 1;
  const seenKinds = new Set();
  while (sweeps < 80) {
    const r = SV.search(g, { ignoreRange: true });
    if (!r.ok) break;
    sweeps++;
    seenKinds.add(r.kind);
    credits += r.credits; mass += r.taken || 0;
    if (r.kind === 'relic') relics++;
    ok(`sweep ${sweeps} leaves less than it found`, r.left < last, `${last} → ${r.left}`) &&
      (last = r.left);
    last = r.left;
    if (sweeps > 4) break;      // four is enough to prove monotonicity; the loop below finishes it
  }
  while (SV.search(g, { ignoreRange: true }).ok && sweeps < 200) sweeps++;

  ok('a field can be worked to exhaustion', SV.isExhausted(g.key),
     String(SV.remaining(g.key)));
  ok('…and then reports itself picked over', SV.fieldState(g) === 'picked over');
  ok('a picked-over field pays nothing further',
     SV.search(g, { ignoreRange: true }).ok === false);
  ok('it took real work to strip it', sweeps >= 8, `${sweeps} sweeps`);
  ok('the sweep counter tracks it', SV.searchCount() === sweeps,
     `${SV.searchCount()} vs ${sweeps}`);

  // Only the depletion is stored — the field's identity, history and contents are derived.
  const saved = SV.serializeGraves();
  ok('a save carries one number per worked field',
     Object.keys(saved).length === 1 && typeof saved[g.key] === 'number');
  SV.restoreGraves(saved);
  ok('…and restores', SV.isExhausted(g.key));
}

console.log('\n— what a field gives up —');
{
  boot(99991);
  const fields = L.graveyards();
  const found = {};
  for (const g of fields) {
    for (let i = 0; i < 60; i++) {
      const r = SV.search(g, { ignoreRange: true });
      if (!r.ok) break;
      found[r.kind] = (found[r.kind] || 0) + 1;
    }
  }
  ok('a field gives up more than one kind of thing', Object.keys(found).length >= 2,
     JSON.stringify(found));
  ok('salvage is the common find', (found.salvage || 0) > 0, JSON.stringify(found));

  // Rare finds are weighted against what is left, which is the mechanic's whole point: a
  // relic is at the bottom of a field, not scattered evenly through it.
  const { makeRng } = await imp('core/rng.js');
  const g = fields[0];
  const mk = () => makeRng(99);      // rollFind takes an rng object, not a function
  let shallow = 0, deep = 0;
  for (let i = 0; i < 400; i++) {
    if (B.FIND_KINDS[SV.rollFind(g, mk(), 0.95)].rare) shallow++;
    if (B.FIND_KINDS[SV.rollFind(g, mk(), 0.10)].rare) deep++;
  }
  ok('relics are likelier deeper into a field', deep >= shallow, `${shallow} shallow vs ${deep} deep`);
}

// ── the board ────────────────────────────────────────────────────────
console.log('\n— the board is made of this system —');
{
  boot(20260814);
  const marks = L.landmarks();

  const all = [];
  for (const st of S.world.stations) all.push(...CO.boardFor(st));
  ok('the board is not empty', all.length > 0, String(all.length));

  const templated = all.filter(c => c.template);
  ok('most offers come from a template', templated.length > all.length * 0.6,
     `${templated.length}/${all.length}`);

  const used = new Set(all.map(c => c.template || c.type));
  ok('a system posts many different kinds of job', used.size >= 8, String(used.size));

  // The headline. Four templates could not produce this and that was the complaint.
  const titles = new Set(all.map(c => c.title));
  ok('and many different jobs', titles.size >= all.length * 0.5,
     `${titles.size} distinct titles in ${all.length} offers`);

  // Every sited job points at somewhere that exists.
  const ids = new Set(marks.map(m => m.id));
  const orphan = templated.filter(c => c.site && !ids.has(c.site));
  ok('every sited job names a place that exists', orphan.length === 0,
     orphan.map(c => c.title).join(' · '));

  // And a station does not post the same job twice — the variety has to be on the board,
  // not merely in the catalogue.
  let dupes = 0;
  for (const st of S.world.stations) {
    const seen = new Set();
    for (const c of CO.boardFor(st)) {
      const k = (c.template || c.type) + '@' + (c.site || '-');
      if (seen.has(k)) dupes++;
      seen.add(k);
    }
  }
  ok('no desk posts the same job twice', dupes === 0, String(dupes));

  // The guarantees.
  //
  // The tier floor is per-station: every desk must offer something a new pilot can take, or
  // that station is four padlocks and a conclusion that the game is broken.
  const padlocked = S.world.stations.filter(st => !CO.boardFor(st).some(c => c.tier === 'low'));
  ok('every board offers work anybody can take', padlocked.length === 0,
     padlocked.map(st => st.userData.name).join(' '));

  // Freight is deliberately *system*-wide instead. A desk only posts work it hires and a
  // refinery does not hire couriers — forcing freight onto every station would flatten the
  // per-power charter back into "every desk posts everything". What must hold is that the
  // system has one somewhere, because freight is how a new pilot earns.
  const anyFreight = S.world.stations.some(st => CO.boardFor(st).some(c => c.type === 'haul'));
  ok('somewhere in the system a consignment is available', anyFreight);

  // A desk only posts work it hires — the property the template path broke on its first pass
  // and `test/desks.mjs` caught immediately.
  let offCharter = 0;
  for (const st of S.world.stations) {
    for (const c of CO.boardFor(st)) if (!CO.desksOf(c.issuer)[c.type]) offCharter++;
  }
  ok('no desk posts work outside its charter', offCharter === 0, String(offCharter));
}

console.log('\n— a job cannot ask for what is not there —');
{
  // The gate, stated directly. With no landmarks at all, every place-requiring template is
  // ineligible and only the siteless ones survive.
  const none = T.eligible([], 'low');
  ok('no landmarks means only siteless templates', none.every(e => e.tpl.needs === null),
     none.map(e => e.key).join(' '));
  ok('…and there is still something to post', none.length > 0);

  // With graveyards removed, no search job can be offered.
  boot(20260814);
  const marks = L.landmarks().filter(m => m.kind !== 'graveyard');
  const noGraves = T.eligible(marks, 'low');
  ok('no debris field means no search job',
     noGraves.every(e => e.tpl.verb !== 'search'),
     noGraves.filter(e => e.tpl.verb === 'search').map(e => e.key).join(' '));

  // And with them present, there is.
  const withGraves = T.eligible(L.landmarks(), 'low');
  ok('a system with a field can post search work',
     withGraves.some(e => e.tpl.verb === 'search'));

  // Every template must name a verb the contract layer knows how to judge, or it generates a
  // job that can never complete.
  const bad = T.TEMPLATE_KEYS.filter(k => !T.VERBS.includes(T.MISSION_TEMPLATES[k].verb));
  ok('every template names a verb the board can judge', bad.length === 0, bad.join(' '));

  // Text is a function of the place, which is what stops twenty templates reading like
  // twenty templates.
  const noText = T.TEMPLATE_KEYS.filter(k => {
    const t = T.MISSION_TEMPLATES[k];
    return typeof t.title !== 'function' || typeof t.brief !== 'function';
  });
  ok('every template writes its own title and brief', noText.length === 0, noText.join(' '));
}

console.log('\n— the board is a function of where and when —');
{
  boot(1337);
  const st = S.world.stations[0];
  const a = CO.refreshBoard(st, 100).map(c => c.title).join('|');
  const b = CO.refreshBoard(st, 100).map(c => c.title).join('|');
  ok('the same station at the same moment gives the same board', a === b);

  const later = CO.refreshBoard(st, 100000).map(c => c.title).join('|');
  ok('a different moment gives a different board', a !== later);

  const other = CO.refreshBoard(S.world.stations[1], 100).map(c => c.title).join('|');
  ok('a different station gives a different board', a !== other);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
