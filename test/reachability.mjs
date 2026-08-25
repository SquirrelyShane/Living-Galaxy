// Reachability: can a player actually ask for this?
//
// Every other suite in this project measures whether the code does the thing. None of them
// measured whether anything *asks* it to — and a test importing a function is exactly the
// false positive that let four shipped features sit unreachable for months. Deep-space
// anomalies had six types, a reward table, a one-shot rule and a schema migration, and
// `investigate()` was called by nothing outside `test/celestial.mjs`.
//
// So this suite reads the source rather than running it. For every module that exposes
// *player-facing verbs* — things a pilot decides to do — it asserts that some other file
// under `src/` imports and calls each one.
//
// ── the backlog is part of the test ──────────────────────────────────
// Some gaps are known and are a slice of work rather than a button. Those are listed in
// `BACKLOG` with the audit entry that tracks them. The check is not "everything is wired"
// — it is **"every verb is either wired or on a list somebody wrote down"**, which is the
// strongest thing that can be true today and still fails loudly the moment a new verb is
// added with neither.
//
// The backlog is also asserted to be *accurate*: an entry that has since been wired must be
// removed, so the list cannot rot into a permanent excuse.

import fs from 'fs';
import path from 'path';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

const ROOT = path.resolve(new URL('../', import.meta.url).pathname);
const collect = d => {
  const out = [];
  (function walk(x) {
    for (const e of fs.readdirSync(x, { withFileTypes: true })) {
      const p = path.join(x, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.js')) out.push(p);
    }
  })(d);
  return out;
};

const srcFiles = collect(path.join(ROOT, 'src'));
const read = f => fs.readFileSync(f, 'utf8');
const rel = f => path.relative(ROOT, f).replace(/\\/g, '/');

/**
 * Player-facing verbs, by the module that owns them. A verb is something a pilot *decides*
 * to do — not a query, not a report, not a tick. Adding one here is the cheap way to make
 * sure a new feature cannot ship without a door.
 */
const VERBS = {
<<<<<<< HEAD
  'src/systems/trade/deals.js':     ['postPlayerJob', 'suggestedFee'],
  'src/systems/flight/lagrange.js':  ['investigate'],
=======
  'src/systems/deals.js':     ['postPlayerJob', 'suggestedFee'],
  // v1.01.99: the whole editing surface, so the six unreachable ones are checked against
  // BACKLOG every run rather than being remembered. The five above them are wired — by the
  // generator, not by a panel, which is exactly the distinction this file exists to make.
  // v1.01.99. Outermost verbs only, per the `toggleDuty`/`setDuty` lesson above:
  // `ensureBerths`, `attachPoints`, `canPlace`, `placeModule` and `refreshLayout` are all
  // called by `generateLayout` inside this module, so listing them would report gaps that
  // are not gaps.
  'src/world/station-forge.js': ['generateLayout', 'layoutForStation',
                                 'moveModule', 'removeModule', 'cycleModulePort',
                                 'fittingKeys', 'snapshotGraph', 'restoreGraph'],
  'src/systems/lagrange.js':  ['investigate'],
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  // Grew by three in v1.01.20. `installFacility`, `toggleFacility` and `removeFacility` were
  // unwired the whole time and the hand-written registry did not list them, so nothing was
  // checking. That is the honest limit of a hand-maintained list, and the reason to widen it
  // whenever a module is worked on rather than only when something breaks.
<<<<<<< HEAD
  'src/systems/industry/planetary.js': ['foundSite', 'upgradeCentre', 'abandonSite',
=======
  'src/systems/planetary.js': ['foundSite', 'upgradeCentre', 'abandonSite',
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
                               'collectFrom', 'deliverTo', 'manufactureAt',
                               'installFacility', 'toggleFacility', 'removeFacility'],
  // `toggleDuty`, not `setDuty`. The registry must name the *outermost* verb — the one a
  // panel actually calls — or it reports a gap that is not one: `setDuty` has no direct
  // caller because `toggleDuty` wraps it inside the same module, and the crew panel has had
  // an ON WATCH button the whole time. The v1.01.10 audit got this wrong in both crew
  // entries and listed them as gaps for a slice.
<<<<<<< HEAD
  'src/systems/crew/crew.js':      ['hire', 'dismiss', 'retrain', 'toggleDuty', 'persuade',
                               'promote', 'demote', 'assignPost'],
  'src/systems/industry/research.js':  ['startProject', 'cancelProject'],
  'src/systems/crew/welfare.js':   ['upgradeComfort', 'startShoreLeave', 'recallShore',
                               'startTraining', 'cancelTraining'],
  'src/systems/industry/crafting.js':  ['queueJob', 'cancelJob'],
  'src/systems/platform/display.js':   ['setDisplay'],
  'src/systems/combat/magazine.js':  ['chamber'],
  'src/systems/combat/groups.js':    ['cycleGroup', 'cycleActive'],
  'src/systems/industry/survey.js':    ['scanPlanet', 'probePlanet'],
  'src/systems/trade/economy.js':   ['buyAmmo', 'buyProbe', 'buyWeapon', 'fitSlot'],
=======
  'src/systems/crew.js':      ['hire', 'dismiss', 'retrain', 'toggleDuty', 'persuade',
                               'promote', 'demote', 'assignPost'],
  'src/systems/research.js':  ['startProject', 'cancelProject'],
  'src/systems/welfare.js':   ['upgradeComfort', 'startShoreLeave', 'recallShore',
                               'startTraining', 'cancelTraining'],
  'src/systems/crafting.js':  ['queueJob', 'cancelJob'],
  'src/systems/display.js':   ['setDisplay'],
  'src/systems/magazine.js':  ['chamber'],
  'src/systems/groups.js':    ['cycleGroup', 'cycleActive'],
  'src/systems/survey.js':    ['scanPlanet', 'probePlanet'],
  'src/systems/economy.js':   ['buyAmmo', 'buyProbe', 'buyWeapon', 'fitSlot'],
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  // v1.01.70. Both are wired twice on purpose — per-hardpoint in the fitting screen for the
  // pilot who can afford one thing and has to choose, and as one row on the dock's service
  // tab beside armour and hull, because a pilot who docks to repair should not have to know
  // that a second, differently-named kind of damage lives on another screen.
<<<<<<< HEAD
  'src/systems/combat/wear.js':      ['serviceModule', 'serviceAll']
=======
  'src/systems/wear.js':      ['serviceModule', 'serviceAll']
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
};

/**
 * Known gaps, each with the audit section that tracks it. Removing a line here is how a
 * gap gets closed; adding one is a deliberate act with a paper trail.
 *
 * Empty is the goal and, as of v1.01.20, the state. Every entry that was here at v1.01.10
 * turned out to be one of three things, and only one of them was a real gap:
 *
 *   **genuinely unreachable** — `cancelJob`. A queued job could be started and never
 *     stopped, with a refund curve nobody could collect. Wired.
 *   **reachable under another name** — `setDuty`, `rotateWatch`. The registry named an inner
 *     function; the panel calls a wrapper. That is a registry bug reported as a product bug.
 *   **not a player verb at all** — `cyclePalette` was a helper nothing needed, since the
 *     settings panel sets palettes directly; `influenceAttempt` is a hazard applied *to* the
 *     player, tracked in UNTRIGGERED below rather than here.
 *
 * The distinction matters because two of the five entries in the v1.01.10 audit were
 * overstated, and an audit that cries wolf gets ignored exactly like a flaky test does.
 */
const BACKLOG = {
<<<<<<< HEAD
  // Empty, and that is the point: the backlog is asserted to be accurate, so an entry that
  // has since been wired must be removed or this suite fails. The Station Forge entries
  // lived here for eight patch levels describing an editor with no panel; the module was
  // reaped in 1.02.49 rather than carried further, and the list went with it.
=======
  // v1.01.99. The Station Forge port brought a working layout editor with it. Half of it is
  // not idle — `generateLayout` reaches `ensureBerths`, `attachPoints`, `canPlace`,
  // `placeModule` and `refreshLayout` on every station it grows, which is how a station is
  // guaranteed its docking arms. The six below are the *player's* half, and nothing can
  // reach them: there is no panel that lets you extend a station you own.
  //
  // Deliberately kept rather than deleted, and deliberately listed rather than left quiet.
  // Reconstructing them later out of the generator's internals would be harder than keeping
  // them beside it. Before any of them gets a button: an edited layout is no longer
  // derivable from its seed, so it becomes save state and the schema moves.
  // The generator itself. Nothing in src/ imports world/station-forge.js yet — v1.01.99
  // brought the module in, unified its rng with core/rng.js and put a test around it, and
  // deliberately did not wire it. `world/system.js` still builds stations from boxes. The
  // slice that swaps the geometry in ("Landfall") is what removes these two lines, and this
  // check is what will fail if it forgets to.
  'generateLayout':   'station-forge.js — the module is not imported yet; Landfall wires it.',
  'layoutForStation': 'station-forge.js — the world-gen seam, waiting on Landfall.',
  'moveModule':      'station-forge.js — the player-side station editor has no panel.',
  'removeModule':    'station-forge.js — the player-side station editor has no panel.',
  'cycleModulePort': 'station-forge.js — the player-side station editor has no panel.',
  'fittingKeys':     'station-forge.js — the player-side station editor has no panel.',
  'snapshotGraph':   'station-forge.js — undo for an editor that has no panel.',
  'restoreGraph':    'station-forge.js — undo for an editor that has no panel.'
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
};

/**
 * Declared behaviour that nothing ever invokes — a different failure from an unreachable
 * verb, and one the caller-based check cannot see, because the missing caller is not a
 * button. Nobody is *supposed* to press these; something in the world is supposed to cause
 * them, and nothing does.
 */
const UNTRIGGERED = {
  'influenceAttempt': 'crew.js — an influence net that degrades your crew. No hostile ' +
                      'system triggers it, so the hazard exists and cannot happen.'
};

/**
 * Config keys that exist and control nothing — bucket D of `docs/OPEN_ITEMS.md`, and the
 * exact set the scan at the bottom of this file must find. Adding a key here is a decision
 * to leave a knob dead on purpose; removing one is what you do after wiring it — or after
 * deleting it, which is what v1.01.98 did to nine of the fifteen this list started with.
 *
 * Gone at v1.01.98: the whole `FLEET` block (nothing imported it, and every value in it was
 * already declared somewhere that is read), the whole `AI` block (it named a model that was
 * not the one loaded and a server nothing connected to — `npc-avatar/llm/models.js` is the
 * registry now, including from inside the assistant worker), and `NET.interp`, whose own
 * comment called it legacy.
 *
<<<<<<< HEAD
 * The ones left are decisions rather than deletions: each names a behaviour somebody wanted
 * and would have to be *wired* to keep, not just tidied away.
 *
 * `COMPANY.commissionRange` came off at v1.02.43. It had been declared since v1.00.31 and the
 * `S.docked` check in `canCommission()` was doing all the work, so the range was a
 * plausible-looking knob that changed nothing. It now refuses an order placed while drifting
 * away from the berth the hull is to be laid down at — the case the docked check misses.
 *
 * Worth recording how this failed: wiring it turned this suite red, because the list is
 * asserted as an exact set **in both directions**. A key that quietly became live is as much a
 * drift as one that quietly went dead, and the only correct way to close an item is to close it
 * here at the same time.
=======
 * The six left are decisions rather than deletions: each names a behaviour somebody wanted
 * and would have to be *wired* to keep, not just tidied away.
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
 */
const INERT = [
  'POP.interval',
  'SUPPLY.interval',
  'ADVANCED.outOfCombat',
  'ORDNANCE.stackScale',
<<<<<<< HEAD
  'MANAGERS.upkeep'
=======
  'MANAGERS.upkeep',
  'COMPANY.commissionRange'
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
];
// `services.sensorRange` came off this list at v1.02.20. It had sat on every station since
// the service table was written, with the `sensor` module upgrading it by +2,200 and
// nothing reading it — so a station could be fitted with a better array and see exactly as
// far as before. It is now what the chart, the contact list and the scanner see through
// while you are docked, which is also what made an observation chart worth opening.


/**
 * Does any file other than the owner both import this name and call it?
 *
 * Both halves matter. A bare text match finds the word in a comment — which is how an
 * earlier hand-rolled version of this check reported `reassign` as wired because two
 * unrelated files happened to use the word in prose.
 */
function callersOf(owner, verb) {
  const importRe = new RegExp(`import\\s*\\{[^}]*\\b${verb}\\b[^}]*\\}\\s*from`);
  const callRe = new RegExp(`\\b${verb}\\s*\\(`);
  return srcFiles
    .filter(f => rel(f) !== owner)
    .filter(f => { const s = read(f); return importRe.test(s) && callRe.test(s); })
    .map(rel);
}

console.log('\n— the registry is honest —');
{
  for (const owner of Object.keys(VERBS)) {
    ok(`${owner} exists`, fs.existsSync(path.join(ROOT, owner)));
  }
  // A verb listed here that the module does not actually export is a stale registry, which
  // would quietly stop checking something.
  let missing = [];
  for (const [owner, verbs] of Object.entries(VERBS)) {
    const s = read(path.join(ROOT, owner));
    for (const v of verbs) {
      // Three forms, not one. The original pattern only knew `export function` and
      // `export const`, so a module using a trailing `export { a, b, c }` list read as
      // exporting nothing and every verb in it looked stale. Found at v1.01.99 by
      // registering the first module in the project written that way.
      const decl = new RegExp(`export\\s+(?:async\\s+)?(?:function\\s+${v}\\b|const\\s+${v}\\b)`);
      const listed = [...s.matchAll(/export\s*\{([^}]*)\}\s*;/g)]
        .some(m => m[1].split(',').some(t => t.trim().split(/\s+as\s+/)[0].trim() === v));
      if (!decl.test(s) && !listed) missing.push(`${owner}:${v}`);
    }
  }
  ok('every registered verb is actually exported', missing.length === 0, missing.join(' '));
}

console.log('\n— every player-facing verb has a door —');
{
  const gaps = [];
  for (const [owner, verbs] of Object.entries(VERBS)) {
    for (const v of verbs) {
      const callers = callersOf(owner, v);
      if (callers.length) {
        ok(`${v} is reachable`, true);
        // And the backlog must not claim otherwise.
        if (BACKLOG[v]) gaps.push(`${v} is wired but still listed in BACKLOG`);
      } else if (BACKLOG[v]) {
        ok(`${v} is a known gap (${BACKLOG[v]})`, true);
      } else if (UNTRIGGERED[v]) {
        ok(`${v} is declared but nothing triggers it`, true);
      } else {
        gaps.push(`${v} has no caller and is not on the backlog`);
        ok(`${v} is reachable`, false, 'no caller in src/ and no backlog entry');
      }
    }
  }
  ok('the backlog matches reality', gaps.length === 0, gaps.join(' · '));
}

console.log('\n— the ones the audit was written about —');
{
  // Named explicitly rather than left to the loop above, because a regression on any of
  // these should say which feature went dark rather than which identifier did.
  ok('deep-space anomalies can be worked from the target panel',
<<<<<<< HEAD
     callersOf('src/systems/flight/lagrange.js', 'investigate').includes('src/ui/hud.js'));
  ok('a job can be posted from a dock',
     callersOf('src/systems/trade/deals.js', 'postPlayerJob').includes('src/ui/dock.js'));
  ok('and the fee is quoted before posting',
     callersOf('src/systems/trade/deals.js', 'suggestedFee').includes('src/ui/dock.js'));

  // The planetary layer, end to end: found it, run it, change it, leave it.
  const planetary = v => callersOf('src/systems/industry/planetary.js', v);
=======
     callersOf('src/systems/lagrange.js', 'investigate').includes('src/ui/hud.js'));
  ok('a job can be posted from a dock',
     callersOf('src/systems/deals.js', 'postPlayerJob').includes('src/ui/dock.js'));
  ok('and the fee is quoted before posting',
     callersOf('src/systems/deals.js', 'suggestedFee').includes('src/ui/dock.js'));

  // The planetary layer, end to end: found it, run it, change it, leave it.
  const planetary = v => callersOf('src/systems/planetary.js', v);
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  for (const v of ['foundSite', 'collectFrom', 'deliverTo', 'manufactureAt',
                   'installFacility', 'toggleFacility', 'removeFacility',
                   'upgradeCentre', 'abandonSite']) {
    ok(`${v} is reachable from the ops panel`, planetary(v).includes('src/ui/ops.js'),
       planetary(v).join(' ') || 'nowhere');
  }
  ok('the blockers are read by the panel too',
<<<<<<< HEAD
     callersOf('src/systems/industry/planetary.js', 'installBlocker').includes('src/ui/ops.js') &&
     callersOf('src/systems/industry/planetary.js', 'upgradeBlocker').includes('src/ui/ops.js'));
=======
     callersOf('src/systems/planetary.js', 'installBlocker').includes('src/ui/ops.js') &&
     callersOf('src/systems/planetary.js', 'upgradeBlocker').includes('src/ui/ops.js'));
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
}

console.log('\n— config that nothing reads —');
{
  // A tuning knob nobody reads is a decision that is not being made.
  //
  // The first version of this scan under-reported, which is the direction that lets rot
  // hide. Three faults, all found by the v1.01.97 doc audit:
  //
  //   1. The block pattern `^export const (\w+) = \{([\s\S]*?)^\};` also matched a
  //      one-line block (`export const DOCK = {range: 280, maxSpeed: 0.30};`) and then ran
  //      on to the *next* `^};`, filing the following block's keys under the wrong name.
  //      `CLOCK.step` was printed as `ORBITAL_V.step`. Five blocks were mis-named this way.
  //   2. The reference test fell back to a bare `\bkey\b` match anywhere in src/, so a key
  //      was cleared by any other block, local variable or string sharing its name.
  //      `POP.interval` and `SUPPLY.interval` were tracked as inert in the audit and both
  //      disappeared from this output the moment `LIGHTS.interval` was added — not because
  //      anything started reading them, but because the *word* appeared.
  //   3. Two legitimate access routes were not modelled, so removing the fallback alone
  //      would have over-reported instead: `import { CLOCK as C }` and computed access
  //      (`UPGRADES[key]`, `ENGAGE[u.profile]`). Both are real reads.
  //
  // And the assertion is an exact set rather than a ceiling, the same way BACKLOG is: a
  // newly inert key fails, and so does a listed key that something has since started
  // reading. A ceiling only ever catches half of the rot.
<<<<<<< HEAD
  // Config is a directory since v1.02.52 — twelve files under `core/config/` mirroring the
  // `systems/` domains, with `config.js` reduced to a barrel that re-exports them. Reading
  // only the barrel found no blocks at all, which made every key on the INERT list look as
  // though something had started reading it. The check is about config keys, so it reads
  // wherever config keys live.
  const cfgFiles = srcFiles.filter(f => /^src\/core\/config(\/|\.js$)/.test(rel(f)));
  const cfg = cfgFiles.map(read).join('\n');
  const rest = srcFiles.filter(f => !/^src\/core\/config(\/|\.js$)/.test(rel(f))).map(read).join('\n');
=======
  const cfg = read(path.join(ROOT, 'src/core/config.js'));
  const rest = srcFiles.filter(f => rel(f) !== 'src/core/config.js').map(read).join('\n');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  const lines = cfg.split('\n');
  const inert = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^export const (\w+) = \{\s*$/);   // multi-line blocks only
    if (!m) continue;
    const name = m[1];
    // A block read by computed key or walked wholesale is reachable in whole; no per-key
    // claim can honestly be made about it.
    if (new RegExp(`\\b${name}\\s*\\[|Object\\.(keys|values|entries)\\(\\s*${name}\\s*\\)`).test(rest)) continue;
    const aliases = [name];
    for (const a of rest.matchAll(new RegExp(`\\b${name}\\s+as\\s+(\\w+)`, 'g'))) aliases.push(a[1]);
    for (let j = i + 1; j < lines.length && !/^\};/.test(lines[j]); j++) {
      const km = lines[j].match(/^ {2}(\w+)\s*:/);
      if (!km) continue;
      const k = km[1];
      if (!aliases.some(a => new RegExp(`\\b${a}\\.${k}\\b`).test(rest))) inert.push(`${name}.${k}`);
    }
  }
  console.log('       inert config keys: ' + (inert.join(' ') || 'none'));

  const added = inert.filter(k => !INERT.includes(k));
  const wired = INERT.filter(k => !inert.includes(k));
  ok('no new inert config', added.length === 0, added.join(' '));
  ok('nothing on the inert list has quietly been wired', wired.length === 0, wired.join(' '));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
