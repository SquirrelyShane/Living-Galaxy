// The shape of the project, asserted.
//
// Every other suite here checks what the code *does*. This one checks how it is *arranged*,
// because arrangement is the thing that decays without anybody deciding to decay it. Nobody
// ever sits down and writes an inversion on purpose; they need a toast in a system file, the
// import is one line, and eighteen months later thirty-five files under `systems/` depend on
// the interface layer and every one of them needs a DOM to run.
//
// That is not hypothetical — it is exactly what this project had at v1.02.51, and the fix
// (`core/notify.js`) is only permanent if something notices the next one.
//
// ## The contract
//
// Six layers, and dependencies run **downhill only**:
//
//     main.js          the boot sequence — may reach anything
//        │
//        ├── ui/       screens and panels. Reads everything, is read by nothing.
//        │
//        ├── entities/ the things in the world that act: the player, NPCs, hulls
//        │
//        ├── systems/  the simulation. Rules, economy, combat, crew, contracts.
//        │
//        ├── world/    the scene: geometry, generation, rendering, level of detail
//        │
//        ├── data/     catalogues. Facts about worlds, ships, minerals, missions, powers.
//        │
//        └── core/     state, config, maths, rng, clock, and the ports. Depends on nothing.
//
// A layer may import from any layer *below* it and never from one above. `npc-avatar/` sits
// beside the stack as a self-contained engine with its own tests; anything may use it and it
// uses nothing here.
//
// ## Ports, and why they exist
//
// A simulation genuinely does need to tell the pilot things and occasionally ask for a
// screen. Both used to be direct imports upward. Both are now ports in `core/`:
// `notify.js` for messages, `screens.js` for panels. The simulation names what should
// happen; the interface registers what that looks like; with nothing registered the calls
// are silent, which is what makes a headless run work.
//
// ## EXCEPTIONS is the honest part
//
// Some upward edges are correct and removing them would make the code worse. Those live in
// `EXCEPTIONS` with a reason, and the list is asserted to be **accurate** — an entry that has
// since been removed must be deleted or this suite fails. It cannot rot into a permanent
// excuse, which is the same discipline `test/reachability.mjs` applies to its backlog.

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(new URL('../', import.meta.url).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

// ── the contract ─────────────────────────────────────────────────────

/** Layers, deepest first. A layer may import from anything after it in this list. */
const LAYERS = ['ui', 'entities', 'systems', 'world', 'data', 'core'];

/** Beside the stack: self-contained, depends on nothing here, anything may use it. */
const FREE = ['npc-avatar'];

const rank = l => LAYERS.indexOf(l);

/**
 * Upward edges that are correct.
 *
 * Each is `'from -> to': 'why'`. Deleting the underlying import means deleting the entry —
 * the accuracy check below fails otherwise.
 */
const EXCEPTIONS = {
  'src/core/state.js -> src/systems/industry/fitting.js':
    'recalcStats() is the hub every stat flows through, and a fit is one of its inputs. ' +
    'Inverting this would mean state.js publishing a hook that fitting.js registers into, ' +
    'which is a port for one caller — more machinery than the edge costs.',

  'src/core/state.js -> src/data/weapons.js':
    'The same hub needs the weapon table to compute mounted damage. `data/` is a catalogue ' +
    'of facts with no behaviour; reading one from core is a lookup, not a dependency on logic.',

  'src/core/state.js -> src/data/crew.js':
    'crewBonuses() is documented in data/crew.js as deliberately pure precisely so state.js ' +
    'can call it without the module graph knotting. The edge is the design working.',

  'src/data/worldgen/worlds.js -> src/world/stellar.js':
    'The world catalogue derives every class reachable surface states by running the real ' +
    'surfaceState(). There is exactly one definition of what a surface state means and both ' +
    'halves read it — duplicating the five thresholds into the catalogue is how the original ' +
    'classification bug happened.',

  'src/world/genesis.js -> src/systems/flight/warp.js':
    'wellRadius() is a pure function of {gravity, radius}. genesis.js imports it so the ' +
    'generator and the warp rules cannot disagree about how big a star is — its own comment ' +
    'says so. Copying the formula is the alternative and it is worse.',

  'src/world/wells.js -> src/systems/flight/warp.js':
    'Same function, same reason: the mesh that draws a well and the rule that enforces it ' +
    'must be one formula.',

  'src/world/landmarks.js -> src/systems/flight/lagrange.js':
    'Landmarks need the libration-point geometry. lagrange.js is genuinely two modules in ' +
    'one — orbital geometry, which belongs in world/, and an investigate() reward flow, ' +
    'which belongs in systems/. Splitting it is the real fix and is not this patch.'
};

// ── read the tree ────────────────────────────────────────────────────

const walk = (d, out = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'test') walk(p, out); }
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
};

const files = walk(path.join(ROOT, 'src'));
const rel = f => path.relative(ROOT, f);
const layerOf = f => {
  const m = rel(f).match(/^src\/([^/]+)/);
  if (!m) return null;                                   // src/main.js
  return m[1].endsWith('.js') ? null : m[1];
};

const resolve = (f, spec) => {
  let r = path.resolve(path.dirname(f), spec);
  if (fs.existsSync(r) && fs.statSync(r).isDirectory()) r = path.join(r, 'index.js');
  return r;
};

const importsOf = f => {
  const src = fs.readFileSync(f, 'utf8');
  const out = new Set();
  for (const m of src.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) out.add(resolve(f, m[1]));
  for (const m of src.matchAll(/import\s*\(\s*['"](\.[^'"]+)['"]/g)) out.add(resolve(f, m[1]));
  return [...out].filter(x => fs.existsSync(x));
};

// ── the layers exist and are what we think ───────────────────────────
console.log('\n— the layers —');
{
  const dirs = fs.readdirSync(path.join(ROOT, 'src'), { withFileTypes: true })
    .filter(e => e.isDirectory()).map(e => e.name).sort();
  const known = [...LAYERS, ...FREE].sort();
  const surprise = dirs.filter(d => !known.includes(d));
  ok('every directory under src/ is a declared layer', surprise.length === 0,
     surprise.join(' ') + ' — add it to LAYERS or FREE and say where it sits');

  const missing = LAYERS.filter(l => !dirs.includes(l));
  ok('every declared layer exists', missing.length === 0, missing.join(' '));

  ok('main.js is the only file at the root of src/',
     fs.readdirSync(path.join(ROOT, 'src')).filter(f => f.endsWith('.js')).join(' ') === 'main.js');
}

// ── the contract holds ───────────────────────────────────────────────
console.log('\n— dependencies run downhill —');
{
  const violations = [];
  const used = new Set();

  for (const f of files) {
    const from = layerOf(f);
    if (from === null || FREE.includes(from)) continue;   // main.js may reach anything
    for (const i of importsOf(f)) {
      const to = layerOf(i);
      if (to === null || to === from || FREE.includes(to)) continue;
      if (rank(to) > rank(from)) continue;                // downhill: fine
      const key = `${rel(f)} -> ${rel(i)}`;
      if (EXCEPTIONS[key]) { used.add(key); continue; }
      violations.push(`${key}   (${from} -> ${to})`);
    }
  }

  ok('no layer imports from a layer above it', violations.length === 0,
     '\n         ' + violations.join('\n         '));

  // The list cannot become a permanent excuse. An entry whose import is gone must go too.
  const stale = Object.keys(EXCEPTIONS).filter(k => !used.has(k));
  ok('every exception is still a real edge', stale.length === 0,
     stale.join(' · ') + ' — the import is gone; delete the entry');

  ok('every exception carries a reason',
     Object.values(EXCEPTIONS).every(v => typeof v === 'string' && v.length > 40));
}

// ── core depends on almost nothing ───────────────────────────────────
console.log('\n— core is the floor —');
{
  const coreFiles = files.filter(f => layerOf(f) === 'core');
  ok('there is a core', coreFiles.length > 0);

  // The ports are the reason the layers above can stay below the interface. If either grew a
  // dependency on the thing it exists to decouple from, it would have stopped being a port.
  for (const port of ['notify.js', 'screens.js']) {
    const p = path.join(ROOT, 'src/core', port);
    ok(`core/${port} exists`, fs.existsSync(p));
    if (fs.existsSync(p)) {
      ok(`core/${port} imports nothing`, importsOf(p).length === 0,
         importsOf(p).map(rel).join(' '));
    }
  }
}

// ── the inversion that started this ──────────────────────────────────
console.log('\n— the simulation does not reach into the interface —');
{
  const offenders = [];
  for (const f of files) {
    const L = layerOf(f);
    if (L !== 'systems' && L !== 'entities' && L !== 'world' && L !== 'data') continue;
    const src = fs.readFileSync(f, 'utf8');
    if (/from\s+['"][^'"]*\/ui\//.test(src)) offenders.push(rel(f));
  }
  ok('nothing below ui/ imports from ui/', offenders.length === 0, offenders.join(' '));

  // Both ports must actually be wired, or the calls are silent in the *game* rather than
  // only in tests — which is a much worse bug than the one they replaced, and an invisible one.
  const main = fs.readFileSync(path.join(ROOT, 'src/main.js'), 'utf8');
  ok('the notify sink is installed at boot', /initToast\(\)/.test(main));
  ok('the dock screen is registered at boot', /registerScreen\(\s*'dock'/.test(main));
}

// ── cycles ───────────────────────────────────────────────────────────
console.log('\n— cycles are counted, not ignored —');
{
  // ES modules tolerate cycles and this project has real ones that are load-bearing —
  // `crafting/index.js` and `crafting/derived.js` genuinely need each other. So the check is
  // not "zero"; it is "no *more* than we have accounted for", which is the only honest
  // assertion available and still fails the moment somebody adds one.
  const graph = new Map(files.map(f => [f, importsOf(f)]));
  const state = new Map();
  const found = new Set();

  const visit = (n, stack) => {
    const st = state.get(n);
    if (st === 'done') return;
    if (st === 'open') {
      const i = stack.indexOf(n);
      if (i >= 0) found.add(stack.slice(i).concat([n]).map(rel).join(' -> '));
      return;
    }
    state.set(n, 'open');
    for (const m of (graph.get(n) || [])) visit(m, stack.concat([n]));
    state.set(n, 'done');
  };
  for (const f of files) visit(f, []);

  // Measured at v1.02.52. Lower is better; this exists so the number cannot quietly climb.
  const BUDGET = 17;
  ok(`import cycles are within budget (${found.size} of ${BUDGET})`, found.size <= BUDGET,
     [...found].slice(0, 3).join('  ·  '));
  if (process.argv.includes('--cycles')) for (const c of [...found].sort()) console.log('    ' + c);

  // No slack. A budget with headroom is a budget that silently absorbs the next three.
  ok('the budget is not slack', BUDGET - found.size <= 2,
     `${BUDGET - found.size} spare — lower BUDGET to ${found.size}`);
}

// ── size ─────────────────────────────────────────────────────────────
console.log('\n— no layer is a junk drawer —');
{
  const counts = {};
  for (const f of files) {
    const L = layerOf(f) || 'main';
    counts[L] = (counts[L] || 0) + 1;
  }
  console.log('        ' + Object.entries(counts).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${v}`).join('  '));

  // `systems/` is the layer that grows, because new gameplay is a system. A flat directory of
  // sixty-odd files has no obvious home for the next one, which is how a junk drawer forms —
  // so it is grouped into domains and this is the check that keeps it grouped.
  const sysRoot = fs.readdirSync(path.join(ROOT, 'src/systems'), { withFileTypes: true });
  const loose = sysRoot.filter(e => e.isFile() && e.name.endsWith('.js')).length;
  ok(`systems/ has few loose files (${loose})`, loose <= 12,
     `${loose} at the top level — group the next one into a domain folder`);

  // A single enormous module is the other shape of junk drawer.
  const big = files.map(f => ({ f: rel(f), n: fs.readFileSync(f, 'utf8').split('\n').length }))
    .filter(x => x.n > 1600).sort((a, b) => b.n - a.n);
  ok('no module is past 1,600 lines', big.length === 0,
     big.map(x => `${x.f} (${x.n})`).join(' '));

  // Config is a directory too, for the same reason and mirroring the same domains, so a
  // tuning value has one obvious home instead of landing wherever the last block ended.
  const cfgDir = path.join(ROOT, 'src/core/config');
  ok('config is split by domain', fs.existsSync(cfgDir) && fs.statSync(cfgDir).isDirectory());
  if (fs.existsSync(cfgDir)) {
    const parts = fs.readdirSync(cfgDir).filter(f => f.endsWith('.js'));
    ok(`config has a file per domain (${parts.length})`, parts.length >= 8);
    const fat = parts.filter(f =>
      fs.readFileSync(path.join(cfgDir, f), 'utf8').split('\n').length > 400);
    ok('no config domain is oversized', fat.length === 0, fat.join(' '));
    // The barrel is what keeps four hundred call sites from having to change.
    const barrel = fs.readFileSync(path.join(ROOT, 'src/core/config.js'), 'utf8');
    ok('config.js re-exports every domain',
       parts.every(f => barrel.includes(`./config/${f}`)),
       parts.filter(f => !barrel.includes(`./config/${f}`)).join(' '));
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
