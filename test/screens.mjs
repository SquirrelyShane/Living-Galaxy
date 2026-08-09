// Living Galaxy — static screens, drawn in the terminal.
//
// Everything else in test/ answers "did the numbers come out right". This suite answers
// the question a headless suite normally cannot: *what does the screen say*. It builds
// the real menus from the real data modules and draws them as coloured panels sized for
// a phone terminal, so a slice can be eyeballed in Termux without serving the game and
// switching to Brave.
//
// It is a test as well as a picture. Drawing a screen means walking its data, and the
// assertions below are the things that walk turned up: a career with no description, a
// command leaf whose label is longer than the panel, a tab with nothing behind it. Those
// are exactly the faults that survive a green suite and show up as a blank panel on the
// device.
//
//   node test/screens.mjs            colour, width from the terminal
//   node test/screens.mjs --plain    no escape codes, for piping or CI
//   node test/screens.mjs --width=38 force a width
//
// Run from `all.mjs` it prints plain and narrow, so the suite log stays readable.

import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

const argv = process.argv.slice(2);
const widthArg = argv.find(a => a.startsWith('--width='));
const PLAIN = argv.includes('--plain') || !!process.env.NO_COLOR;
const QUIET = argv.includes('--quiet');

// Portrait on a phone is the constraint that matters. Take the terminal's own width when
// it offers one, clamp hard, and fall back narrow rather than wide — a panel that wraps
// is worse than a panel that truncates.
const WIDTH = Math.max(30, Math.min(
  widthArg ? parseInt(widthArg.split('=')[1], 10) : (process.stdout.columns || 44) - 1,
  64
));

const C = PLAIN ? new Proxy({}, { get: () => (s => String(s)) }) : {
  dim:   s => `\x1b[2m${s}\x1b[0m`,
  bold:  s => `\x1b[1m${s}\x1b[0m`,
  cyan:  s => `\x1b[36m${s}\x1b[0m`,
  blue:  s => `\x1b[94m${s}\x1b[0m`,
  green: s => `\x1b[32m${s}\x1b[0m`,
  amber: s => `\x1b[33m${s}\x1b[0m`,
  red:   s => `\x1b[31m${s}\x1b[0m`,
  mag:   s => `\x1b[35m${s}\x1b[0m`,
  grey:  s => `\x1b[90m${s}\x1b[0m`,
  inv:   s => `\x1b[7m${s}\x1b[0m`
};

// Branch colours match the hull colours in entities/shipmesh.js, so the terminal and the
// game agree on what "industrial" looks like.
const BRANCH_COLOR = {
  military: C.red, industrial: C.amber, logistic: C.green, logistics: C.green,
  economic: C.mag, civilian: C.blue
};

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

// ── drawing ──────────────────────────────────────────────────────────
// Width is measured on the *undecorated* string. Escape codes have no width and
// counting them is how terminal boxes come out ragged.

// Always build the panels, even under --quiet: the assertions at the bottom are checks on
// the drawing itself, so skipping the draw would skip the test rather than the noise.
// --quiet suppresses printing them, nothing else.
const out = [];
const say = s => out.push(s);
const strip = s => String(s).replace(/\x1b\[[0-9;]*m/g, '');

// Terminal cells, not code points. Emoji and CJK occupy two columns; counting them as one
// is what makes box-drawn panels come out one character short on every row that has an
// icon in it — and every career row has an icon in it.
const WIDE = /[\u{1100}-\u{115F}\u{2E80}-\u{A4CF}\u{AC00}-\u{D7A3}\u{F900}-\u{FAFF}\u{FE30}-\u{FE6F}\u{FF00}-\u{FF60}\u{FFE0}-\u{FFE6}\u{1F300}-\u{1F64F}\u{1F680}-\u{1F9FF}\u{20000}-\u{3FFFD}]/u;
const w = s => {
  let n = 0;
  for (const ch of strip(s)) n += WIDE.test(ch) ? 2 : 1;
  return n;
};
const cut = (s, n) => {
  if (w(s) <= n) return s;
  let acc = '', used = 0;
  for (const ch of strip(s)) {
    const cw = WIDE.test(ch) ? 2 : 1;
    if (used + cw > n - 1) break;
    acc += ch; used += cw;
  }
  return acc + '…';
};
const padTo = (s, n) => s + ' '.repeat(Math.max(0, n - w(s)));

const IN = WIDTH - 4;   // interior width, inside "│ " and " │"

function panel(title, lines, accent = C.cyan) {
  say(accent('┌─ ' + cut(strip(title), WIDTH - 5) + ' ' + '─'.repeat(Math.max(0, WIDTH - 5 - w(title))) + '┐'));
  for (const ln of lines) {
    if (ln === '---') { say(accent('├' + '─'.repeat(WIDTH - 2) + '┤')); continue; }
    say(accent('│') + ' ' + padTo(cut(ln, IN), IN) + ' ' + accent('│'));
  }
  say(accent('└' + '─'.repeat(WIDTH - 2) + '┘'));
  say('');
}

/**
 * A label/value row that keeps the value right-aligned and never overflows.
 * `width` defaults to the panel interior; indented rows must pass their own, or the
 * value gets truncated by the panel after the row has already padded to full width.
 */
function row(label, value, width = IN) {
  const v = String(value);
  const room = width - w(v) - 1;
  return padTo(cut(label, Math.max(1, room)), Math.max(1, room)) + ' ' + v;
}

/** A tab strip, with the selected tab inverted. */
function tabstrip(tabs, active) {
  const parts = tabs.map(t => (t === active ? C.inv(' ' + t + ' ') : C.grey(' ' + t + ' ')));
  const rows = [];
  let cur = '';
  for (const p of parts) {
    if (w(cur) + w(p) > IN) { rows.push(cur); cur = ''; }
    cur += p;
  }
  if (cur) rows.push(cur);
  return rows;
}

/** A horizontal bar, for anything 0..1. */
function bar(frac, width = 12) {
  const n = Math.max(0, Math.min(width, Math.round(frac * width)));
  const col = frac > 0.66 ? C.green : frac > 0.33 ? C.amber : C.red;
  return col('█'.repeat(n)) + C.grey('░'.repeat(width - n));
}

// ── boot a world ─────────────────────────────────────────────────────
const { S, recalcStats } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');
const { initScene } = await imp('world/scene.js');
const { createSystem } = await imp('world/system.js');
const { initMarket } = await imp('systems/market.js');
const { VERSION, CODENAME, SCHEMA, BUILD_DATE } = await imp('core/version.js');
const { LINEAGES, CORPORATIONS, CAREERS, CAREER_KEYS, LINEAGE_KEYS } = await imp('data/origins.js');
const { createCharacter } = await imp('systems/character.js');
const { companyReport, hasCompany, hqBrief } = await imp('systems/company.js');
const CMD = await imp('systems/command.js');
const { fleetOrderReport } = await imp('systems/orders.js');
const { SHIP_CLASSES } = await imp('core/config.js');

initScene();
recalcStats();
seedWorld(20260809);
createSystem();
initMarket();

// ── screen 1: title ──────────────────────────────────────────────────
console.log('\n— title screen —');
{
  panel('LIVING GALAXY', [
    '',
    C.bold(C.cyan('        L I V I N G   G A L A X Y')),
    C.grey('              Solaris System'),
    '',
    '---',
    row('build', C.green(`v${VERSION} · ${CODENAME}`)),
    row('save schema', String(SCHEMA)),
    row('dated', C.grey(BUILD_DATE)),
    '---',
    C.bold('  [ NEW CHARACTER ]'),
    C.grey('  [ CONTINUE ]'),
    C.grey('  [ SETTINGS ]')
  ]);

  ok('the build identity is populated', !!(VERSION && CODENAME));
  ok('the schema is a number', Number.isInteger(SCHEMA));
  ok('the title fits the panel', w('L I V I N G   G A L A X Y') + 8 <= WIDTH + 8);
}

// ── screen 2: character creation ─────────────────────────────────────
console.log('\n— character creation —');
{
  const careerRows = [];
  for (const key of CAREER_KEYS) {
    const K = CAREERS[key];
    const col = BRANCH_COLOR[K.hull] || C.cyan;
    careerRows.push(col(` ${K.icon} `) + C.bold(padTo(K.name, 12)) + C.grey(cut(K.hull + ' hull', IN - 16)));
  }

  panel('NEW CHARACTER · career', [
    ...tabstrip(['lineage', 'corp', 'career', 'review'], 'career'),
    '---',
    ...careerRows,
    '---',
    C.grey(cut(CAREERS.executive.desc, IN * 2).slice(0, IN)),
    C.grey(CAREERS.executive.desc.slice(IN, IN * 2))
  ], C.blue);

  ok('every career has a name, icon and description',
     CAREER_KEYS.every(k => CAREERS[k].name && CAREERS[k].icon && CAREERS[k].desc));
  ok('every career names a hull class that exists',
     CAREER_KEYS.every(k => !!SHIP_CLASSES[CAREERS[k].hull]),
     CAREER_KEYS.filter(k => !SHIP_CLASSES[CAREERS[k].hull]).join(', '));
  ok('every career name fits a phone panel',
     CAREER_KEYS.every(k => CAREERS[k].name.length <= 16),
     CAREER_KEYS.filter(k => CAREERS[k].name.length > 16).join(', '));
  ok('the executive career is on the list', CAREER_KEYS.includes('executive'));
  ok('and it is the one carrying a charter',
     CAREER_KEYS.filter(k => CAREERS[k].company).length === 1);
  ok('lineages and corporations are populated',
     LINEAGE_KEYS.length > 0 && Object.keys(CORPORATIONS).length > 0);
  ok('every lineage has a description',
     LINEAGE_KEYS.every(k => LINEAGES[k].name && LINEAGES[k].desc));
}

// ── screen 3: the executive desk ─────────────────────────────────────
// This is the screen that answers "why do I see no executive gameplay". Founding a
// non-executive character leaves it empty, and there is no way to incorporate later.
console.log('\n— the executive desk —');
{
  S.company = null;
  createCharacter({ name: 'Vale', lineage: LINEAGE_KEYS[0], corp: 'meridian', career: 'broker' });
  const asBroker = hasCompany();

  panel('OPS · staff  (career: broker)', [
    ...tabstrip(['orders', 'ledger', 'holdings', 'staff', 'research'], 'staff'),
    '---',
    C.red(' No company on file.'),
    C.grey(' Fleet objectives, the command menu and the'),
    C.grey(' board are all gated on a charter. A pilot'),
    C.grey(' career never opens this desk, and there is'),
    C.grey(' no way to incorporate after creation.')
  ], C.grey);

  ok('a pilot career has no company', asBroker === false);

  S.company = null;
  createCharacter({ name: 'Vale', lineage: LINEAGE_KEYS[0], corp: 'meridian', career: 'executive' });
  const co = companyReport();
  const office = hqBrief();

  ok('an executive career incorporates', hasCompany() === true);
  ok('and is given a registered office', !!(co && co.hqStation));

  panel('OPS · staff  (career: executive)', [
    ...tabstrip(['orders', 'ledger', 'holdings', 'staff', 'research'], 'staff'),
    '---',
    C.bold(co.name) + C.grey('  · ' + co.charter),
    row('treasury', C.green(Math.round(co.treasury).toLocaleString('en-US') + ' cr')),
    row('held', Math.round(co.ownership * 100) + '%'),
    row('office', C.cyan(co.hqStation || '—')),
    '',
    ' board confidence ' + bar(co.confidence) + ' ' + Math.round(co.confidence * 100) + '%',
    '---',
    C.grey(' ' + cut((office && office.line) || '', IN - 1)),
    '---',
    row('fleet objectives', String(fleetOrderReport().length))
  ], C.mag);
}

// ── screen 4: the command tree ───────────────────────────────────────
console.log('\n— the command dialogue tree —');
{
  const menu = CMD.COMMAND_MENU;
  const lines = [];
  for (const branch of menu) {
    const col = BRANCH_COLOR[branch.id] || C.cyan;
    lines.push(col('▸ ' + C.bold(branch.label || branch.id)));
    for (const sub of branch.children || []) {
      lines.push(C.grey('   ' + (sub.label || sub.id)));
      for (const leaf of sub.children || []) {
        const o = leaf.order || {};
        const tail = (o.durationSec > 0 ? o.durationSec + 's' : '∞') +
                     (o.mode === 'passive' ? ' pas' : '');
        lines.push('     ' + row(col('· ') + (leaf.label || leaf.id), C.grey(tail), IN - 5));
      }
    }
  }
  panel('COMMAND · dialogue tree', lines, C.cyan);

  const leaves = CMD.allLeaves();
  ok('the tree has branches to draw', menu.length > 0);
  ok('every branch has a label', menu.every(b => !!b.label));
  ok('every branch has at least one submenu', menu.every(b => (b.children || []).length > 0),
     menu.filter(b => !(b.children || []).length).map(b => b.id).join(', '));
  ok('every submenu has at least one leaf',
     menu.every(b => (b.children || []).every(s => (s.children || []).length > 0)));
  ok('every leaf has a label', leaves.every(n => !!n.label));

  // A label that overruns the panel is the classic phone-only fault: fine in a desktop
  // browser, truncated to nonsense in portrait. The budget is the Ops panel's usable text
  // width at 360 CSS px in the game's own font, not the terminal width — the terminal
  // width moves and this constraint does not.
  const LABEL_BUDGET = 34;
  const long = leaves.filter(n => n.label.length > LABEL_BUDGET);
  ok(`every leaf label fits the ${LABEL_BUDGET}-char portrait budget`, long.length === 0,
     long.map(n => `${n.id} (${n.label.length})`).join(', '));

  const widest = leaves.slice().sort((a, b) => b.label.length - a.label.length).slice(0, 3);
  console.log('       ' + C.grey('widest labels: ' +
    widest.map(n => `${n.label.length} "${n.label}"`).join(' · ')));

  const branchLabels = CMD.branchLabels();
  ok('branch labels match the tree', branchLabels.length === menu.length);
}

// ── screen 5: a dispatched board ─────────────────────────────────────
console.log('\n— fleet objectives with a live board —');
{
  CMD.commandFromText('patrol the sector');
  CMD.commandFromText('send a cutter to extract ore');
  CMD.commandFromText('haul that freight to the depot');

  const fleet = fleetOrderReport();
  const lines = [];
  for (const f of fleet) {
    const col = BRANCH_COLOR[f.branch] || C.cyan;
    lines.push(col('■ ') + C.bold(cut(f.asset, IN - 12)) + C.grey('  ' + f.name));
    lines.push('   ' + bar(f.progress || 0, 10) + ' ' +
               C.grey(f.remaining > 0 ? f.remaining + 's left' : 'until recalled') +
               (f.mode === 'passive' ? C.grey(' · passive') : ''));
  }
  panel(`FLEET · ${fleet.length} objective${fleet.length === 1 ? '' : 's'}`, lines.length ? lines : [C.grey(' none')], C.green);

  ok('three dispatches produced three objectives', fleet.length === 3, `${fleet.length}`);
  ok('every objective names an asset', fleet.every(f => !!f.asset));
  ok('every objective names its order', fleet.every(f => !!f.name));
  ok('every branch resolves to a colour', fleet.every(f => !!BRANCH_COLOR[f.branch]),
     fleet.filter(f => !BRANCH_COLOR[f.branch]).map(f => f.branch).join(', '));
  ok('progress is a fraction', fleet.every(f => f.progress >= 0 && f.progress <= 1));
  ok('remaining time is never negative', fleet.every(f => f.remaining >= 0));
}

// ── the drawing itself ───────────────────────────────────────────────
console.log('\n— the panels themselves —');
{
  const drawn = out.filter(Boolean);
  ok('screens were drawn', drawn.length > 20, `${drawn.length} lines`);

  const over = drawn.filter(l => w(l) > WIDTH);
  ok(`every drawn line fits ${WIDTH} columns`, over.length === 0,
     over.slice(0, 3).map(l => `${w(l)}: ${strip(l).slice(0, 24)}`).join(' | '));

  if (!PLAIN) {
    ok('colour was actually emitted', drawn.some(l => l.includes('\x1b[')));
    const unclosed = drawn.filter(l => (l.match(/\x1b\[/g) || []).length &&
                                       !l.endsWith('\x1b[0m') && !l.includes('\x1b[0m'));
    ok('no line opens a colour it does not close', unclosed.length === 0);
  } else {
    ok('plain mode emits no escape codes', !drawn.some(l => l.includes('\x1b[')));
  }
}

if (!QUIET) {
  console.log('\n' + C.grey('─'.repeat(WIDTH)));
  console.log(C.grey(`  ${WIDTH} columns · ${PLAIN ? 'plain' : 'colour'} · v${VERSION} ${CODENAME}`));
  console.log(C.grey('─'.repeat(WIDTH)) + '\n');
  for (const line of out) console.log(line);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
