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
  'src/systems/planetary.js': ['foundSite', 'upgradeCentre', 'abandonSite',
                               'collectFrom', 'deliverTo', 'manufactureAt'],
  'src/systems/crew.js':      ['hire', 'dismiss', 'retrain', 'setDuty', 'rotateWatch',
                               'influenceAttempt'],
  'src/systems/crafting.js':  ['queueJob', 'cancelJob'],
  'src/systems/display.js':   ['cyclePalette'],
  'src/systems/magazine.js':  ['chamber'],
  'src/systems/groups.js':    ['cycleGroup', 'cycleActive'],
  'src/systems/survey.js':    ['scanPlanet', 'probePlanet'],
  'src/systems/economy.js':   ['buyAmmo', 'buyProbe', 'buyWeapon', 'fitSlot']
};

/**
 * Known gaps, each with the audit section that tracks it. Removing a line here is how a
 * gap gets closed; adding one is a deliberate act with a paper trail.
 */
const BACKLOG = {
  'upgradeCentre':    'REACHABILITY_AUDIT — planetary operating layer',
  'abandonSite':      'REACHABILITY_AUDIT — planetary operating layer',
  'collectFrom':      'REACHABILITY_AUDIT — planetary operating layer',
  'deliverTo':        'REACHABILITY_AUDIT — planetary operating layer',
  'manufactureAt':    'REACHABILITY_AUDIT — planetary operating layer',
  'setDuty':          'REACHABILITY_AUDIT — crew management verbs',
  'rotateWatch':      'REACHABILITY_AUDIT — crew management verbs',
  'influenceAttempt': 'REACHABILITY_AUDIT — crew management verbs',
  'cancelJob':        'REACHABILITY_AUDIT — smaller ones',
  'cyclePalette':     'REACHABILITY_AUDIT — smaller ones'
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
      } else {
        gaps.push(`${v} has no caller and is not on the backlog`);
        ok(`${v} is reachable`, false, 'no caller in src/ and no backlog entry');
      }
    }
  }
  ok('the backlog matches reality', gaps.length === 0, gaps.join(' · '));
}

console.log('\n— the two closed this slice —');
{
  // Named explicitly rather than left to the loop above, because these are the ones the
  // audit was written about and a regression on either should say so by name.
  ok('deep-space anomalies can be worked from the target panel',
     callersOf('src/systems/lagrange.js', 'investigate').includes('src/ui/hud.js'));
  ok('a job can be posted from a dock',
     callersOf('src/systems/deals.js', 'postPlayerJob').includes('src/ui/dock.js'));
  ok('and the fee is quoted before posting',
     callersOf('src/systems/deals.js', 'suggestedFee').includes('src/ui/dock.js'));
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
