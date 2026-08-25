// The galaxy — an index over the system generator, not a second one.
//
// `world/genesis.js` has turned a seed into a complete system since v1.02.33: star class from a
// weighted draw, luminosity, habitable zone, planet bands, berths, belts, names. It is
// deterministic, versioned and tested. A galaxy module that generated its own planets would be
// a second source of truth for what a system *is*, and the first thing in this codebase to
// drift — the v1.02.37 employer/power key collision is what that looks like when it happens.
//
// So a node here is a position, a designation and a **seed**. Asking what is actually in a
// system is one call to `generateSystem(node.seed)`. What this suite pins:
//
//   1. **Nothing is stored.** Every node is a pure function of `(galaxySeed, index)`, so fifty
//      thousand systems cost one integer in the save file.
//   2. **The chart and the arrival agree.** The class drawn on the map is the class you find
//      when you get there — asserted against `generateSystem()` itself, not against a copy of
//      its logic. If genesis ever changes its draw order this is what fails, loudly, instead of
//      the chart quietly lying.
//   3. **The shape is a galaxy**, not a ball or a uniform disc: arms, a denser core, a thin
//      disc, and no correlated star classes down an arm.
//   4. **A new pilot lands somewhere sensible**, deterministically.

import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { GALAXY } = await imp('core/config.js');
const G = await imp('world/galaxy.js');
const { generateSystem, STAR_CLASSES, GENESIS_VERSION } = await imp('world/genesis.js');

const SEED = 20260816;

// ── 1. derived, never stored ─────────────────────────────────────────
console.log('\n— fifty thousand systems, one integer —');
{
  const a = G.nodeAt(SEED, 100);
  const b = G.nodeAt(SEED, 100);
  ok('a node is the same node every time', JSON.stringify(a) === JSON.stringify(b));
  ok('and a different seed is a different galaxy',
     JSON.stringify(G.nodeAt(SEED + 1, 100)) !== JSON.stringify(a));
  ok('a node carries a system seed', Number.isInteger(a.seed) && a.seed >= 0, String(a.seed));
  ok('every index in range produces one',
     [0, 1, 7, 999, GALAXY.count - 1].every(i => {
       const n = G.nodeAt(SEED, i);
       return Number.isFinite(n.x) && Number.isFinite(n.y) && Number.isFinite(n.z);
     }));

  // The failure this mixing function exists to prevent. `galaxySeed + index` would leave
  // neighbouring nodes sharing low bits, and `generateSystem()` derives its four streams by
  // XOR-ing fixed masks into the seed — so an arm would come out visibly all one star class,
  // which looks like a bug because it is one.
  const seeds = new Set();
  for (let i = 0; i < 4000; i++) seeds.add(G.systemSeed(SEED, i));
  ok('consecutive indices do not collide', seeds.size === 4000, String(seeds.size));
  const lowBits = new Set();
  for (let i = 0; i < 64; i++) lowBits.add(G.systemSeed(SEED, i) & 0xff);
  ok('and neighbouring seeds do not share low bits', lowBits.size > 40, String(lowBits.size));
}

// ── 2. the chart does not lie ────────────────────────────────────────
console.log('\n— what the map says is what you arrive at —');
{
  // The assertion that matters most in this file. `classFor()` reproduces the first draw
  // `generateSystem()` makes; if the two ever disagree, the chart is telling the player
  // something false about where they are going.
  let checked = 0, wrong = [];
  for (let i = 0; i < 300; i++) {
    const n = G.nodeAt(SEED, i * 37);
    const sys = generateSystem(n.seed);
    checked++;
    // `star.class`, not `star.cls`. The first version of this looked up the wrong field, got
    // `undefined` for all three hundred, and reported a total mismatch — a test that fails
    // loudly for the wrong reason, which is still better than one that passes for the wrong one.
    if (sys.star.class !== n.cls) wrong.push(`${i}: chart ${n.cls} vs system ${sys.star.class}`);
  }
  ok('every charted class matches the generated system', wrong.length === 0,
     `${wrong.length}/${checked} — ${wrong.slice(0, 3).join(' | ')}`);

  // ...and the system it points at is a real one, all the way down.
  const n = G.nodeAt(SEED, 4242);
  const sys = generateSystem(n.seed);
  ok('a node resolves to a whole system', !!sys && !!sys.star && sys.planets.length > 0,
     sys ? `${sys.planets.length} planets` : 'none');
  ok('with berths', (sys.stations || []).length > 0, String((sys.stations || []).length));
  ok('and it is the same system on every visit',
     JSON.stringify(generateSystem(n.seed)) === JSON.stringify(sys));

  const rep = G.nodeReport(SEED, 4242);
  ok('the report names the class in words', !!rep.className && rep.classKey === n.cls);
  ok('and carries both generator versions',
     rep.genesis === GENESIS_VERSION && rep.galaxy === G.GALAXY_VERSION);
}

// ── 3. it is shaped like a galaxy ────────────────────────────────────
console.log('\n— arms, a core, and a disc —');
{
  const N = 6000;
  const nodes = [];
  for (let i = 0; i < N; i++) nodes.push(G.nodeAt(SEED, i));

  ok('everything is inside the radius',
     nodes.every(n => n.r <= GALAXY.radius + 1),
     String(Math.max(...nodes.map(n => n.r)).toFixed(0)));

  // A disc, not a ball. Height falls off with radius, so the rim is thinner than the core.
  const maxH = Math.max(...nodes.map(n => Math.abs(n.y)));
  ok('it is a disc, not a sphere', maxH < GALAXY.radius * 0.1,
     `${maxH.toFixed(0)} vs ${GALAXY.radius}`);
  const core = nodes.filter(n => n.r < GALAXY.radius * 0.3);
  const rim = nodes.filter(n => n.r > GALAXY.radius * 0.8);
  const spread = a => a.reduce((s, n) => s + Math.abs(n.y), 0) / Math.max(1, a.length);
  ok('and the rim is thinner than the core', spread(rim) < spread(core),
     `${spread(rim).toFixed(0)} vs ${spread(core).toFixed(0)}`);

  // Denser toward the middle. Compare stars-per-unit-area, not raw counts, or the answer is
  // just "the outer annulus is bigger".
  const density = (lo, hi) => {
    const c = nodes.filter(n => n.r >= lo && n.r < hi).length;
    return c / (Math.PI * (hi * hi - lo * lo));
  };
  ok('the core is denser than the rim',
     density(0, GALAXY.radius * 0.3) > density(GALAXY.radius * 0.7, GALAXY.radius),
     `${density(0, GALAXY.radius * 0.3).toExponential(2)} vs ${density(GALAXY.radius * 0.7, GALAXY.radius).toExponential(2)}`);

  // Arms: every one is used, and roughly evenly.
  const perArm = new Array(GALAXY.arms).fill(0);
  for (const n of nodes) perArm[n.arm]++;
  ok('every arm has stars in it', perArm.every(c => c > 0), perArm.join(','));
  ok('and they are roughly even',
     Math.max(...perArm) / Math.min(...perArm) < 1.35, perArm.join(','));

  // The correlation failure, checked directly: an arm must not be all one star class.
  let worstArm = 0, worstName = '';
  for (let a = 0; a < GALAXY.arms; a++) {
    const inArm = nodes.filter(n => n.arm === a);
    const counts = {};
    for (const n of inArm) counts[n.cls] = (counts[n.cls] || 0) + 1;
    const top = Math.max(...Object.values(counts)) / inArm.length;
    if (top > worstArm) { worstArm = top; worstName = `arm ${a}`; }
  }
  // The weight table's most common class is M at 34%, so anything near that is the table
  // showing through and anything well above it is correlation.
  ok('no arm is one star class', worstArm < 0.45, `${worstName} ${(worstArm * 100).toFixed(0)}%`);

  // The class mix follows the weight table rather than being uniform.
  const counts = {};
  for (const n of nodes) counts[n.cls] = (counts[n.cls] || 0) + 1;
  ok('every star class appears', STAR_CLASSES.every(c => counts[c.key] > 0),
     STAR_CLASSES.filter(c => !counts[c.key]).map(c => c.key).join(','));
  const m = counts.M / N, o = (counts.O || 0) / N;
  ok('and rare classes are rarer than common ones', m > o * 3, `M ${(m * 100).toFixed(0)}% O ${(o * 100).toFixed(1)}%`);
}

// ── 4. queries ───────────────────────────────────────────────────────
console.log('\n— asking the galaxy questions —');
{
  const home = G.homeNode(SEED);
  ok('there is a home node', !!home);
  ok('it is out on an arm rather than in the core',
     home.r > GALAXY.radius * GALAXY.homeBand[0] - 1 &&
     home.r < GALAXY.radius * GALAXY.homeBand[1] + 1,
     `${home.r.toFixed(0)} of ${GALAXY.radius}`);
  ok('around a star a new pilot can work with',
     GALAXY.homeClasses.includes(home.cls), home.cls);
  ok('and it is the same home every time', G.homeNode(SEED).i === home.i);
  ok('a different galaxy has a different home', G.homeNode(SEED + 7).i !== home.i);

  const near = G.nodesNear(SEED, home.x, home.y, home.z, GALAXY.jumpRange);
  ok('a home has neighbours in jump range', near.length > 1, String(near.length));
  ok('they are sorted by distance', near.every((n, i) => i === 0 || n.dist >= near[i - 1].dist));
  ok('and every one is genuinely in range', near.every(n => n.dist <= GALAXY.jumpRange + 1));
  ok('the limit is respected',
     G.nodesNear(SEED, 0, 0, 0, GALAXY.radius, 25).length === 25);

  const nearest = G.nodeNearest(SEED, home.x, home.y, home.z);
  ok('the nearest node to a node is itself', nearest.i === home.i);

  // Jump cost is superlinear, so a long hop is a decision rather than a slow short one.
  const a = G.nodeAt(SEED, 1), b = G.nodeAt(SEED, 2);
  ok('a jump costs something', G.jumpCost(a, b) > 0);
  // Superlinear means the *rate* rises with distance — cost per unit travelled is higher for a
  // long hop than a short one. Two earlier versions of this failed for reasons that were about
  // the assertion rather than the curve: `cost(2d) > 2·cost(d)` loses to `Math.ceil` on the
  // short hop, and sampling at 300 units puts the whole measurement inside the rounding error.
  // Measured between a routine hop and the range limit, where the quadratic term is 42% of the
  // bill and the claim is actually about something.
  ok('and cost per unit rises with distance', (() => {
    const rate = d => G.jumpCost(a, { x: a.x + d, y: a.y, z: a.z }) / d;
    return rate(GALAXY.jumpRange) > rate(1000) * 1.15;
  })(), (() => {
    const rate = d => G.jumpCost(a, { x: a.x + d, y: a.y, z: a.z }) / d;
    return `${rate(1000).toFixed(4)} → ${rate(GALAXY.jumpRange).toFixed(4)}`;
  })());

  // Designations carry locality — two stars near each other share a prefix, or the chart is a
  // list of random strings and reading it is pointless.
  const cluster = G.nodesNear(SEED, home.x, home.y, home.z, GALAXY.jumpRange * 0.3, 20);
  if (cluster.length >= 3) {
    const prefixes = new Set(cluster.map(n => G.designation(n).split('-')[0]));
    ok('nearby systems share a sector prefix', prefixes.size <= 3,
       [...prefixes].join(','));
  } else ok('nearby systems share a sector prefix', true, 'sparse neighbourhood');
  ok('a designation is readable', /^[A-Z]{2}-\d·\d{3}$/.test(G.designation(home)),
     G.designation(home));
  ok('the galaxy describes itself', G.galaxyLine(SEED).includes('systems'));
}

// ── 5. it costs what it claims to cost ───────────────────────────────
console.log('\n— generated in slices, not instantiated —');
{
  // The reason `nodesNear` exists: building fifty thousand records to draw two hundred is
  // invisible on a desktop and a stall on a phone. This is a budget, not a benchmark — it
  // fails if somebody makes node generation an order of magnitude more expensive.
  const t0 = Date.now();
  G.nodesNear(SEED, 0, 0, 0, GALAXY.radius * 0.1, 200);
  const ms = Date.now() - t0;
  ok('a neighbourhood query is affordable', ms < 900, `${ms}ms over ${GALAXY.count}`);

  // And nothing was retained.
  ok('the module holds no galaxy', (() => {
    const before = G.nodeAt(SEED, 5);
    G.nodesNear(SEED + 99, 0, 0, 0, 1000, 10);
    const after = G.nodeAt(SEED, 5);
    return JSON.stringify(before) === JSON.stringify(after);
  })());
}

// ── 6. the galaxy is load-bearing ────────────────────────────────────
//
// The point of v1.02.44, and the reason .43 was not finished. A galaxy that nothing reads is a
// system that does not exist by this project's own rule — the same fault as `hires` in .38,
// `order.params` in .39 and the whole dossier record in .37. The system the game renders must
// *be* a node.
console.log('\n— the rendered system is a node on the chart —');
{
  const fs = await import('node:fs');
  const src = p => fs.readFileSync(new URL('src/' + p, ROOT).pathname, 'utf8');
  const m = src('main.js');

  ok('boot picks a home node', /homeNode\(gseed\)/.test(m));
  ok('and derives the system seed from it', /seed = home\.seed/.test(m));
  ok('a resumed flight keeps its own placement', /savedGalaxy\(\)/.test(m));
  ok('the placement is persisted', /galaxy: \{ seed:/.test(src('systems/platform/save.js')));
  ok('and the state carries it', /galaxy: \{ seed: WORLD_SEED/.test(src('core/state.js')));
  // At least 22, not exactly 22. This asserted the literal for two patches and then failed
  // the moment schema 23 shipped for an unrelated field — which is the assertion testing the
  // *number* rather than the property. What has to be true is that placement landed in a
  // schema at or after the one that introduced it, and that its migration is still in the
  // chain; the line below checks the second half.
  {
    const m22 = /SCHEMA = (\d+)/.exec(src('core/version.js'));
    ok('the schema moved for it', !!m22 && Number(m22[1]) >= 22, m22 && m22[1]);
  }
  ok('with a migration', /21\(d\) \{[\s\S]{0,900}d\.v = 22/.test(src('systems/platform/save.js')));

  // The designation reaches the player rather than sitting in a module.
  ok('the system line says where the system is', /plan\.designation/.test(src('world/genesis.js')));
  ok('and the boot path attaches it', /systemPlan\.designation = designation/.test(m));

  // The arrow points one way: genesis must not import the galaxy, or "what a system is" and
  // "where it is" become mutually dependent and the layering is gone.
  ok('genesis does not depend on the galaxy',
     !/from '\.\/galaxy\.js'/.test(src('world/genesis.js')));
}

// ── 7. an old flight is placed, not moved ────────────────────────────
console.log('\n— a returning pilot keeps their system and gains a position —');
{
  const save = await imp('systems/platform/save.js');
  const { SCHEMA } = await imp('core/version.js');
  const OLD = 987654321;
  const old = { v: 21, seed: OLD, layout: 'procedural', genesis: 2 };
  const up = save.migrate(JSON.parse(JSON.stringify(old)));

  ok('a v21 save walks up', !!up && up.v === SCHEMA);
  // The v17 rule again: everything a save remembers is keyed by name, so regenerating the
  // world underneath a returning pilot dangles all of it at once.
  ok('the system seed is untouched', up.seed === OLD, String(up.seed));
  ok('and it gained a placement', !!up.galaxy && Number.isInteger(up.galaxy.node));

  // The chart may not lie: the node it was placed at must be the class it is actually orbiting.
  const actual = generateSystem(OLD).star.class;
  const placed = G.nodeAt(up.galaxy.seed, up.galaxy.node);
  ok('the marker matches the sky', placed.cls === actual, `${placed.cls} vs ${actual}`);
  ok('it is out on an arm, like a home', placed.r > GALAXY.radius * GALAXY.homeBand[0] - 1);

  // Placed once, placed for ever — a system that wanders the map between sessions is worse
  // than no map, which is why the migration writes the node instead of resolving it at boot.
  const again = save.migrate(JSON.parse(JSON.stringify(old)));
  ok('and the placement is stable', again.galaxy.node === up.galaxy.node);
}

// ── 8. a new pilot has somewhere to go ───────────────────────────────
console.log('\n— neighbours, from the first minute —');
{
  const home = G.homeNode(SEED);
  const reach = G.nodesNear(SEED, home.x, home.y, home.z, GALAXY.jumpRange)
    .filter(n => n.i !== home.i);
  ok('the home system has reachable neighbours', reach.length >= 1, String(reach.length));
  // A jump you cannot afford at the start is a jump that does not exist yet, so at least one
  // neighbour has to be inside the fuel a pilot actually launches with.
  const cheapest = Math.min(...reach.map(n => G.jumpCost(home, n)));
  ok('and at least one is affordable on a full tank', cheapest <= 100, String(cheapest));
  ok('every neighbour resolves to a real system',
     reach.slice(0, 5).every(n => {
       const sys = generateSystem(n.seed);
       return sys && sys.planets.length > 0;
     }));
}

// ── 9. a load moves you, and an autosave does not undo it ────────────
//
// The bug this section exists for, found by asking which keys `snapshot()` writes that
// `loadGame()` never reads. Of 51, five came back — and four were correct: `build` and
// `savedAt` are metadata, `layout` and `genesis` decide how the world is *generated*, which has
// already happened by the time a load runs.
//
// `galaxy` was the odd one out and it was a real defect. `savedGalaxy()` covers boot, but
// `importSave()` and `restoreBackup()` both call `loadGame()` mid-session with no reload — so
// the placement stayed on the *previous* flight, and because `snapshot()` writes `S.galaxy`
// back out, the autosave thirty seconds later would stamp the old coordinates onto the imported
// save and move it on the chart permanently. Silent, and it corrupts data rather than a display.
console.log('\n— loading a save moves you to where that save is —');
{
  const save = await imp('systems/platform/save.js');
  const { S } = await imp('core/state.js');
  const { planFor } = await imp('world/genesis.js');

  const A = { seed: 1234, node: 11 };
  const B = { seed: 8899, node: 77 };

  S.galaxy = { ...A };
  S.systemPlan = planFor(G.nodeAt(A.seed, A.node).seed, 'procedural');
  S.systemPlan.designation = G.designation(G.nodeAt(A.seed, A.node));
  const beforeName = S.systemPlan.designation;

  // A payload that says it is somewhere else entirely — an imported flight.
  const wire = save.migrate({ v: 22, seed: G.nodeAt(B.seed, B.node).seed, classKey: 'civilian',
                              layout: 'procedural', genesis: 2, galaxy: { ...B } });
  ok('the imported payload keeps its own placement',
     wire.galaxy.seed === B.seed && wire.galaxy.node === B.node);

  // Apply it the way `loadGame` does, through the real function.
  save.applyPayload ? save.applyPayload(wire) : null;
  // `loadGame` reads storage, so drive it through the exported import path instead.
  const okImport = save.importSave(JSON.stringify(wire));
  ok('the save imports', okImport === true, String(okImport));
  ok('and the placement followed it',
     S.galaxy.seed === B.seed && S.galaxy.node === B.node,
     `${S.galaxy.seed}/${S.galaxy.node} — wanted ${B.seed}/${B.node}`);
  ok('the printed designation followed too',
     S.systemPlan.designation === G.designation(G.nodeAt(B.seed, B.node)),
     `${S.systemPlan.designation} (was ${beforeName})`);

  // And the round trip is stable: saving now must write B, not A.
  const snap = save.snapshot();
  ok('the next save writes the new placement, not the old',
     snap.galaxy.seed === B.seed && snap.galaxy.node === B.node,
     `${snap.galaxy.seed}/${snap.galaxy.node}`);

  // A payload with no placement at all must not wipe a good one.
  const held = { ...S.galaxy };
  save.importSave(JSON.stringify({ v: 22, seed: 5, classKey: 'civilian', layout: 'procedural' }));
  ok('a payload with no placement leaves the current one alone',
     S.galaxy.seed === held.seed && S.galaxy.node === held.node,
     JSON.stringify(S.galaxy));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
