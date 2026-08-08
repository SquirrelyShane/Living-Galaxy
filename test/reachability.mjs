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
  'src/systems/deals.js':     ['postPlayerJob', 'suggestedFee'],
  'src/systems/lagrange.js':  ['investigate'],
  // Grew by three in v1.01.20. `installFacility`, `toggleFacility` and `removeFacility` were
  // unwired the whole time and the hand-written registry did not list them, so nothing was
  // checking. That is the honest limit of a hand-maintained list, and the reason to widen it
  // whenever a module is worked on rather than only when something breaks.
  'src/systems/planetary.js': ['foundSite', 'upgradeCentre', 'abandonSite',
                               'collectFrom', 'deliverTo', 'manufactureAt',
                               'installFacility', 'toggleFacility', 'removeFacility'],
  // `toggleDuty`, not `setDuty`. The registry must name the *outermost* verb — the one a
  // panel actually calls — or it reports a gap that is not one: `setDuty` has no direct
  // caller because `toggleDuty` wraps it inside the same module, and the crew panel has had
  // an ON WATCH button the whole time. The v1.01.10 audit got this wrong in both crew
  // entries and listed them as gaps for a slice.
  'src/systems/crew.js':      ['hire', 'dismiss', 'retrain', 'toggleDuty', 'persuade',
                               'promote', 'demote', 'assignPost'],
  'src/systems/welfare.js':   ['upgradeComfort', 'startShoreLeave', 'recallShore',
                               'startTraining', 'cancelTraining'],
  'src/systems/crafting.js':  ['queueJob', 'cancelJob'],
  'src/systems/display.js':   ['setDisplay'],
  'src/systems/magazine.js':  ['chamber'],
  'src/systems/groups.js':    ['cycleGroup', 'cycleActive'],
  'src/systems/survey.js':    ['scanPlanet', 'probePlanet'],
  'src/systems/economy.js':   ['buyAmmo', 'buyProbe', 'buyWeapon', 'fitSlot']
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
const BACKLOG = {};

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
      const re = new RegExp(`export\\s+(?:async\\s+)?(?:function\\s+${v}\\b|const\\s+${v}\\b)`);
      if (!re.test(s)) missing.push(`${owner}:${v}`);
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
     callersOf('src/systems/lagrange.js', 'investigate').includes('src/ui/hud.js'));
  ok('a job can be posted from a dock',
     callersOf('src/systems/deals.js', 'postPlayerJob').includes('src/ui/dock.js'));
  ok('and the fee is quoted before posting',
     callersOf('src/systems/deals.js', 'suggestedFee').includes('src/ui/dock.js'));

  // The planetary layer, end to end: found it, run it, change it, leave it.
  const planetary = v => callersOf('src/systems/planetary.js', v);
  for (const v of ['foundSite', 'collectFrom', 'deliverTo', 'manufactureAt',
                   'installFacility', 'toggleFacility', 'removeFacility',
                   'upgradeCentre', 'abandonSite']) {
    ok(`${v} is reachable from the ops panel`, planetary(v).includes('src/ui/ops.js'),
       planetary(v).join(' ') || 'nowhere');
  }
  ok('the blockers are read by the panel too',
     callersOf('src/systems/planetary.js', 'installBlocker').includes('src/ui/ops.js') &&
     callersOf('src/systems/planetary.js', 'upgradeBlocker').includes('src/ui/ops.js'));
}

console.log('\n— config that nothing reads —');
{
  // A tuning knob nobody reads is a decision that is not being made. This does not fail the
  // suite — several are genuinely inert and tracked in the audit — but it prints, so the
  // list cannot grow unnoticed.
  const cfg = read(path.join(ROOT, 'src/core/config.js'));
  const rest = srcFiles.filter(f => rel(f) !== 'src/core/config.js').map(read).join('\n');
  const blocks = [...cfg.matchAll(/^export const (\w+) = \{([\s\S]*?)^\};/gm)];
  const inert = [];
  for (const [, name, body] of blocks) {
    for (const m of body.matchAll(/^\s{2}(\w+)\s*:/gm)) {
      const k = m[1];
      if (!new RegExp(`\\b${name}\\.${k}\\b|['"]${k}['"]|\\b${k}\\b`).test(rest)) inert.push(`${name}.${k}`);
    }
  }
  console.log('       inert config keys: ' + (inert.join(' ') || 'none'));
  ok('inert config is not growing', inert.length <= 8, `${inert.length}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
