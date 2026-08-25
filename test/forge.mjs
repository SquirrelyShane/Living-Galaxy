// v1.01.99 — Station Forge. The layout generator ported in from the Orbital Forge
// prototype: does it build a valid, connected, dockable station for every archetype and
// size the game can ask for, does the same seed always build the same one, and does it do
// it inside a budget the boot sequence can actually pay?
//
// The golden signatures at the bottom are the point of this file. A layout is pure data
// derived from a seed, which means a refactor can change every station in the galaxy
// without changing a single test that checks *properties*. The signatures pin the actual
// output, so an accidental change to draw order, table order or the rng fails loudly and a
// deliberate one has to be re-recorded on purpose.
import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { seedWorld } = await imp('core/rng.js');
const { STATION_TYPES, SYSTEM_STATIONS } = await imp('data/stations.js');
const F = await imp('world/station-forge.js');

seedWorld(20260808);

const ARCH = Object.keys(F.ARCHETYPES);
const SIZES = [1, 2, 3, 4, 5];

// ── every archetype the game can ask for exists ──────────────────────
console.log('\n— the mapping is complete —');
{
  const missing = [];
  for (const [key, t] of Object.entries(STATION_TYPES)) {
    if (!t.forge) missing.push(key + ' has no forge archetype');
    else if (!F.ARCHETYPES[t.forge]) missing.push(`${key} maps to unknown archetype '${t.forge}'`);
    if (t.forgeSize == null || t.forgeSize < 1 || t.forgeSize > 5) missing.push(key + ' has no usable forgeSize');
  }
  ok('every station class names an archetype the forge has', missing.length === 0, missing.join(' · '));

  // Not every archetype needs a station class — `derelict` has no class yet and that is a
  // gap in the roster, not in the mapping. Named so it is a decision rather than a surprise.
  const unused = ARCH.filter(a => !Object.values(STATION_TYPES).some(t => t.forge === a));
  ok('the unused archetypes are the ones expected', unused.join(',') === 'derelict', unused.join(','));
}

// ── a station is a station, whatever it was grown from ───────────────
console.log('\n— every layout is habitable —');
{
  const bad = { invalid: [], noBerth: [], noRoom: [], noDeck: [], orphan: [] };
  for (const type of ARCH) {
    for (const size of SIZES) {
      const L = F.generateLayout({ seed: 'suite', type, size });
      const tag = `${type}/${size}`;
      if (!L.validation.ok) bad.invalid.push(tag);
      if (!L.modules.some(m => m.key === 'dock-arm')) bad.noBerth.push(tag);
      if (L.rooms.length < 4) bad.noRoom.push(tag);
      if (!L.decks.length) bad.noDeck.push(tag);
      // Growth is a walk over open ports, so the graph is connected by construction. This
      // asserts the construction, not the intent: a module with no link at all could only
      // arrive by a code path that bypassed the assembler.
      if (L.modules.some(m => m.kind !== 'cap' && !m.links.some(x => x != null))) bad.orphan.push(tag);
    }
  }
  ok('every archetype × size validates', bad.invalid.length === 0, bad.invalid.join(' '));
  ok('every station has somewhere to dock', bad.noBerth.length === 0, bad.noBerth.join(' '));
  ok('every station has compartments', bad.noRoom.length === 0, bad.noRoom.join(' '));
  ok('every station has decks', bad.noDeck.length === 0, bad.noDeck.join(' '));
  ok('nothing floats free of the graph', bad.orphan.length === 0, bad.orphan.join(' '));
}

// ── the roster builds ────────────────────────────────────────────────
console.log('\n— the real roster —');
{
  const built = SYSTEM_STATIONS.map(st => F.layoutForStation(st, STATION_TYPES[st.type]));
  ok('every station in Solaris grows a layout', built.every(L => L.validation.ok));
  ok('each keeps its own name', built.every((L, i) => L.name === SYSTEM_STATIONS[i].name));
  ok('two stations of the same class are still different',
     new Set(built.filter(L => L.typeKey === 'trade').map(L => L.modules.length)).size > 1 ||
     new Set(built.map(L => Math.round(L.bounds.r))).size > 4);
  // Bigger classes should read as bigger places. Not a tight bound — the generator is
  // allowed variety — but a relay must not out-sprawl a habitat ring.
  const relay = built.find(L => L.name === 'Rime Relay');
  const hab = built.find(L => L.name === 'Habitat Ring-7');
  ok('a sensor relay is smaller than a habitat ring', relay.totalArea < hab.totalArea,
     `${relay.totalArea} vs ${hab.totalArea}`);
}

// ── determinism, which is what multiplayer rests on ──────────────────
console.log('\n— the same seed builds the same station —');
{
  const sig = L => L.modules.map(m =>
    [m.id, m.key, m.deck, m.x.toFixed(6), m.z.toFixed(6), m.rot.toFixed(6), m.links.join('/')].join(',')).join('|');

  const a = F.generateLayout({ seed: 'twice', type: 'trade', size: 3 });
  const b = F.generateLayout({ seed: 'twice', type: 'trade', size: 3 });
  ok('two calls with one seed agree', sig(a) === sig(b));

  const c = F.generateLayout({ seed: 'other', type: 'trade', size: 3 });
  ok('a different seed builds a different station', sig(a) !== sig(c));

  // The property that lets a client join without downloading the system: the layout depends
  // on the world seed and the station's name, and on nothing about draw order. Generating
  // ten other stations in between must not move it.
  const st = SYSTEM_STATIONS[0], type = STATION_TYPES[st.type];
  const first = F.layoutForStation(st, type);
  for (const other of SYSTEM_STATIONS.slice(1)) F.layoutForStation(other, STATION_TYPES[other.type]);
  const again = F.layoutForStation(st, type);
  ok('generating other stations does not move this one', sig(first) === sig(again));
}

// ── the budget ───────────────────────────────────────────────────────
console.log('\n— what it costs —');
{
  // Deliberately loose. This is a floor against a regression of the order the v1.01.99
  // caches removed — hulls recomputed 56,860 times per layout — not a performance
  // assertion, which does not belong in a suite that runs on whatever box is free.
  for (let i = 0; i < 3; i++) F.generateLayout({ seed: 'warm' + i, type: 'trade', size: 3 });
  const t0 = performance.now();
  const N = 12;
  for (let i = 0; i < N; i++) F.generateLayout({ seed: 'cost' + i, type: 'trade', size: 3 });
  const per = (performance.now() - t0) / N;
  ok('a layout costs well under a fifth of a second', per < 200, per.toFixed(1) + ' ms');
  console.log(`       ${per.toFixed(1)} ms per layout · ${(per * SYSTEM_STATIONS.length).toFixed(0)} ms for the roster`);
}

// ── golden signatures ────────────────────────────────────────────────
console.log('\n— the output is pinned —');
{
  // Recorded at v1.01.99 against the core/rng.js generator. If one of these fails and you
  // did not mean to change the generator, something reordered a draw. If you did mean to,
  // re-record — and say so in the patch note, because every station in every save that was
  // ever screenshotted just changed shape.
  const GOLDEN = {
    'military/3': '127/34/147',
    'trade/3':    '76/23/142',
    'research/1': '31/10/153',
    'mining/4':   '72/21/171',
    'habitat/4':  '68/18/152',
    'pirate/2':   '49/18/147',
    'derelict/3': '111/33/164'
  };
  const now = {};
  for (const k of Object.keys(GOLDEN)) {
    const [type, size] = k.split('/');
    const L = F.generateLayout({ seed: 'golden', type, size: +size });
    now[k] = `${L.modules.length}/${L.rooms.length}/${Math.round(L.bounds.r)}`;
  }
  const drift = Object.keys(GOLDEN).filter(k => GOLDEN[k] !== now[k]);
  ok('every recorded layout still comes out the same', drift.length === 0,
     drift.map(k => `${k}: ${GOLDEN[k]} -> ${now[k]}`).join(' · '));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
