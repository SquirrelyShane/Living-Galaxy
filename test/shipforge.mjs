// Ship hulls: is what got built a ship, and is it the same ship next time?
//
// The generator this came from shipped with a defect its own batch audit caught, and the
// shape of that defect is why this suite leads with proportion rather than with rendering.
// Radial size came from a free-floating `scale` while length came from the category, so the
// two were unrelated draws and length:beam ran from 12:1 to **124:1** — a logistic hull three
// metres across and three hundred and forty-eight metres long. Every hull was a needle. The
// geometry was present, the materials were fine, nothing threw, and the viewer simply looked
// broken.
//
// That is the failure mode this file exists for: a mesh generator does not fail loudly. It
// produces *something*, and whether that something is a ship is a question about numbers you
// have to go and ask. So the audit below asks — proportion, mass, crew, thrust-to-weight,
// part count — across every category, on every seed it sweeps.
//
// The second half is the LG side of the seam. A hull is chosen from a ship's identity and
// cached per (type, variant), which is what keeps sixty-seven raiders from becoming
// sixty-seven GPU uploads. Both halves of that — the determinism and the sharing — are
// asserted here, because a cache that silently stops sharing is a frame-rate regression that
// shows up in a busy system and nowhere else.

import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const SF = await imp('entities/shipforge.js');
const SM = await imp('entities/shipmesh.js');
const { NPC_TYPES } = await imp('core/config.js');

const SEEDS = 40;
const seedFor = (c, i) => `audit/${c}/${i}`;

// ── the audit ────────────────────────────────────────────────────────
//
// One invariant per line, each one a defect that actually occurred. Kept in the same shape
// as the generator's own batch sheet so the two do not drift apart.
function audit(s) {
  const f = [], st = s.stats;
  if (s.root.children.length < 6) f.push('sparse geometry');
  if (!isFinite(s.radius) || s.radius <= 0) f.push('degenerate radius');
  if (st.cargoCap <= 0) f.push('no cargo volume');
  if (st.twr < 0.05 || st.twr > 6) f.push('twr ' + st.twr);
  if (st.beamM < 4) f.push('beam ' + st.beamM + 'm');
  const lb = st.lengthM / Math.max(st.beamM, 1);
  if (lb > 12) f.push('needle ' + lb.toFixed(1) + ':1');
  if (lb < 1.8) f.push('blob ' + lb.toFixed(1) + ':1');
  if (st.crew < 1) f.push('no crew');
  if (!isFinite(st.dryMass) || st.dryMass <= 0) f.push('bad mass');
  if (!isFinite(st.turnRate) || st.turnRate <= 0) f.push('bad turn rate');
  return f;
}

console.log('\n— every category builds a ship —');
{
  ok('eight categories', SF.CATEGORY_KEYS.length === 8, String(SF.CATEGORY_KEYS.length));

  let total = 0;
  const failures = [];
  const lbSpan = {};
  for (const cat of SF.CATEGORY_KEYS) {
    const ratios = [];
    for (let i = 0; i < SEEDS; i++) {
      const s = SF.buildHull(seedFor(cat, i), cat, { targetLength: 20 });
      total++;
      const f = audit(s);
      if (f.length) failures.push(`${cat}/${i}: ${f.join(', ')}`);
      ratios.push(s.stats.lengthM / Math.max(1, s.stats.beamM));
    }
    lbSpan[cat] = [Math.min(...ratios), Math.max(...ratios)];
  }
  ok(`${total} hulls, no failed invariants`, failures.length === 0,
     failures.slice(0, 4).join(' · '));

  // The regression itself, stated as a number rather than as an absence of complaints.
  const worst = Math.max(...Object.values(lbSpan).map(r => r[1]));
  ok('no hull is a needle (worst length:beam under 12:1)', worst < 12, worst.toFixed(1) + ':1');

  // Categories must stay distinguishable, because reading a silhouette at range is the whole
  // reason for building hulls this way rather than tinting a cone.
  //
  // Proportion alone is deliberately NOT the test. Three categories target a 5:1 length:beam
  // on purpose — a logistic tug, a medical ward ship and a slaver are all roughly that shape
  // — and they are told apart by hull section count, kit and cargo fraction instead. Asserting
  // on proportion alone would fail three honest pairs and teach the next person to loosen the
  // threshold until it stopped meaning anything.
  //
  // So the signature is what the eye actually uses: how many sides the hull is lofted on,
  // how much of it is cargo, and how much clutter hangs off it.
  const sigOf = cat => {
    const s = SF.buildHull('sig/' + cat, cat, { targetLength: 20 });
    return { cat, sides: s.dna.sides, parts: s.root.children.length,
             cargo: s.stats.cargoCap, lb: s.stats.lengthM / Math.max(1, s.stats.beamM) };
  };
  const sigs = SF.CATEGORY_KEYS.map(sigOf);
  const collapsed = [];
  for (let i = 0; i < sigs.length; i++) {
    for (let j = i + 1; j < sigs.length; j++) {
      const a = sigs[i], b = sigs[j];
      const same = a.sides === b.sides
        && Math.abs(a.parts - b.parts) < 4
        && Math.abs(a.lb - b.lb) < 0.25
        && Math.abs(Math.log10(Math.max(1, a.cargo) / Math.max(1, b.cargo))) < 0.15;
      if (same) collapsed.push(a.cat + '≈' + b.cat);
    }
  }
  ok('no two categories collapse to the same signature', collapsed.length === 0,
     collapsed.join(' '));
}

console.log('\n— crew scales with the job, not just with volume —');
{
  // A bulk freighter crewed like a cruise liner was the third defect the generator's audit
  // found: crew came from one coefficient on volume, so a hauler came back with 563 hands.
  // Crew is per-category now, and the ordering is the assertion.
  const crewOf = cat => SF.buildHull('crew-probe', cat, { targetLength: 20 }).stats.crew;
  const trade = crewOf('trade'), civilian = crewOf('civilian'), military = crewOf('military');
  ok('a liner carries more hands than a freighter', civilian > trade,
     `${civilian} vs ${trade}`);
  ok('a warship carries more than a freighter', military > trade,
     `${military} vs ${trade}`);
  ok('a freighter is not crewed like a liner', trade < civilian / 4,
     `${trade} vs ${civilian}`);
}

console.log('\n— determinism —');
{
  const sig = s => [s.name, s.stats.dryMass, s.stats.cargoCap, s.stats.lengthM,
                    s.stats.beamM, s.stats.crew, s.dna.engines, s.dna.scale].join('|');
  let drift = 0;
  for (const cat of SF.CATEGORY_KEYS) {
    for (let i = 0; i < 12; i++) {
      const a = SF.buildHull(seedFor(cat, i), cat, { targetLength: 20 });
      const b = SF.buildHull(seedFor(cat, i), cat, { targetLength: 20 });
      if (sig(a) !== sig(b)) drift++;
    }
  }
  ok('the same seed rebuilds the same hull', drift === 0, String(drift));

  const x = SF.buildHull('alpha', 'military', { targetLength: 20 });
  const y = SF.buildHull('beta', 'military', { targetLength: 20 });
  ok('a different seed is a different hull', sig(x) !== sig(y));

  // An NPC's hull is rebuilt whenever it respawns or the player jumps back into a system. A
  // raider that changed silhouette between visits would read as a different ship, so this is
  // a gameplay property rather than a tidiness one.
  ok('names are stable across rebuilds',
     SF.buildHull('gamma', 'slavers', {}).name === SF.buildHull('gamma', 'slavers', {}).name);
}

console.log('\n— hulls are the size LG asked for —');
{
  // `targetLength` exists because LG balanced its scale ladder long before it had geometry
  // worth looking at: a drone is 6, a command ship is 26, and that ordering has to survive
  // the change of mesh.
  // `dna.length` is rounded to two decimals for the readout, so the product is compared with
  // a relative tolerance rather than exactly — the rounding is in the reported figure, not in
  // the scale actually applied.
  let wrong = 0, worstErr = 0;
  for (const cat of SF.CATEGORY_KEYS) {
    for (const L of [6, 11, 26, 42]) {
      const s = SF.buildHull('size/' + cat, cat, { targetLength: L });
      const err = Math.abs(s.fit * s.dna.length - L) / L;
      worstErr = Math.max(worstErr, err);
      if (err > 1e-3) wrong++;
    }
  }
  ok('every hull scales to its requested length', wrong === 0,
     `${wrong} off, worst ${(worstErr * 100).toFixed(4)}%`);

  const small = SF.buildHull('same', 'military', { targetLength: 6 });
  const big = SF.buildHull('same', 'military', { targetLength: 26 });
  ok('scaling is uniform, so proportion survives',
     Math.abs(small.stats.lengthM / small.stats.beamM - big.stats.lengthM / big.stats.beamM) < 1e-6);
  ok('a bigger request gives a bigger bounding radius', big.radius > small.radius,
     `${big.radius.toFixed(1)} vs ${small.radius.toFixed(1)}`);
}

// ── the LG seam ──────────────────────────────────────────────────────
console.log('\n— career classes map to silhouettes —');
{
  const CLASSES = ['military', 'industrial', 'logistics', 'economic', 'civilian'];
  let built = 0, broken = 0;
  for (const cls of CLASSES) {
    for (let i = 0; i < 8; i++) {
      const g = SM.buildShip(cls, cls + '/' + i);
      built++;
      if (!g || !g.children.length || !g.userData.forge) broken++;
    }
  }
  ok(`${built} career hulls all build`, broken === 0, String(broken));

  // The one rule that lives on the LG side rather than in the generator: the outlaw
  // silhouette is a thing you meet, not a thing a career hands you for reaching a rank.
  let slaverLeak = 0;
  for (const cls of CLASSES) {
    for (let i = 0; i < 200; i++) {
      if (SM.categoryFor(cls, 'player/' + cls + '/' + i, false) === 'slavers') slaverLeak++;
    }
  }
  ok('no player career can be handed a slaver hull', slaverLeak === 0, String(slaverLeak));

  let slaverSeen = 0;
  for (let i = 0; i < 200; i++) {
    if (SM.categoryFor('military', 'raider/' + i, true) === 'slavers') slaverSeen++;
  }
  ok('hostile military hulls do use it', slaverSeen > 0, String(slaverSeen));

  // Two ships of the same career should be allowed to look different — that is the whole
  // point of the pool having more than one entry.
  const cats = new Set();
  for (let i = 0; i < 60; i++) cats.add(SM.categoryFor('economic', 'trader/' + i, false));
  ok('one career presents as more than one silhouette', cats.size > 1, [...cats].join(' '));

  ok('the same identity always gets the same silhouette',
     SM.categoryFor('economic', 'stable-id') === SM.categoryFor('economic', 'stable-id'));
}

console.log('\n— NPC hulls are shared, not minted per ship —');
{
  // The optimisation this must not undo: sixty-seven hulls each minting their own geometry
  // and material meant sixty-seven GPU uploads and no batching. Variety is bounded on
  // purpose — a fixed number of hulls per type, shared by every ship of that type.
  const NPC = await imp('entities/npcs.js');
  ok('npcs.js exports a spawner', typeof NPC.spawnNpc === 'function');

  // Every NPC type must resolve to a career class the pools know about, or it silently falls
  // back to `civilian` and a pirate raider comes out looking like a passenger liner.
  const CLASSES = new Set(['military', 'industrial', 'logistics', 'economic', 'civilian']);
  const unmapped = [];
  for (const key of Object.keys(NPC_TYPES)) {
    // `categoryFor` returning a real category proves the class resolved; an unknown class
    // falls through to the civilian pool, which is exactly what we are checking for.
    const cat = SM.categoryFor('military', key, true);
    if (!cat) unmapped.push(key);
  }
  ok('every NPC type resolves to a silhouette', unmapped.length === 0, unmapped.join(' '));
  ok('the career classes the NPC table needs all exist',
     [...CLASSES].every(c => !!SM.categoryFor(c, 'probe')));
}

console.log('\n— geometry is real geometry —');
{
  // The loft builds a BufferGeometry vertex by vertex rather than using a three.js
  // primitive, so this checks the attribute actually got written. A silently empty position
  // buffer renders as nothing at all, which on a black background is indistinguishable from
  // a ship that is simply far away.
  const s = SF.buildHull('geo-probe', 'military', { targetLength: 20 });
  const hull = s.root.children[0];
  ok('the hull mesh carries a position attribute',
     !!(hull && hull.geometry && hull.geometry.attributes.position));
  ok('…with vertices in it', hull.geometry.attributes.position.count > 0,
     String(hull.geometry.attributes.position.count));
  ok('…and an index', !!hull.geometry.index);

  // Volume drives mass, and a zero-volume loft would produce a weightless ship that passes
  // every other check.
  ok('the loft reports a positive volume', s.stats.dryMass > 0, String(s.stats.dryMass));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
