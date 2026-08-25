// Layout arithmetic.
//
// A CSS regression that hides a control is invisible to every other suite in this
// project — they all assert behaviour, and a button that works perfectly while sitting
// underneath the throttle dock passes all of them. This suite does the one thing those
// cannot: it reads the real numbers out of the stylesheets and checks that eleven tool
// buttons actually fit in the space the layout reserves for them.
//
// It is deliberately arithmetic on the declared values rather than a rendered-DOM
// measurement. There is no browser here, and a jsdom that does not do layout would
// report zero for everything and pass silently — which is worse than not testing at all.

import { readFileSync } from 'fs';

const ROOT = new URL('../', import.meta.url);
const css = ['base', 'hud', 'panels', 'overlays']
  .map(f => { try { return readFileSync(new URL(`css/${f}.css`, ROOT), 'utf8'); } catch (e) { return ''; } })
  .join('\n');
const html = readFileSync(new URL('index.html', ROOT), 'utf8');

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

/** Pull a numeric px value for `prop` out of the rule block for `selector`. */
function px(selector, prop, scope = css) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = new RegExp(esc + '\\s*\\{([^}]*)\\}').exec(scope);
  if (!rule) return null;
  const m = new RegExp('(?:^|;|\\s)' + prop + '\\s*:\\s*(-?[\\d.]+)px').exec(rule[1]);
  return m ? parseFloat(m[1]) : null;
}

/** The body of an `@media (max-height:N)` block, for checking the tightened values. */
function mediaBlock(maxHeight) {
  const re = new RegExp('@media\\s*\\(max-height:\\s*' + maxHeight + 'px\\)\\s*\\{([\\s\\S]*?)\\n\\}', 'm');
  const m = re.exec(css);
  return m ? m[1] : '';
}

function rootVar(name, scope = css) {
  const m = new RegExp('--' + name + '\\s*:\\s*(-?[\\d.]+)px').exec(scope);
  return m ? parseFloat(m[1]) : null;
}

console.log('\n— layout —');

// ── the dock reserve is one number, not three guesses ────────────────
{
  const dock = rootVar('dock-h');
  ok('the dock reserve is declared as a variable', dock != null, String(dock));
  ok('it is a plausible height for a throttle plus an action row',
     dock > 90 && dock < 200, String(dock));

  const hardcoded = css.match(/bottom:\s*calc\(1\d\dpx\s*\+\s*var\(--safe-b\)\)/g) || [];
  ok('no panel still hardcodes its own guess at the dock height',
     hardcoded.length === 0, hardcoded.join(' | '));

  ok('the left stack references the shared reserve',
     /#left-stack\{[^}]*bottom:calc\(var\(--dock-h\)/.test(css));
  ok('the tool column references it too',
     /#tool-column\{[^}]*bottom:calc\(var\(--dock-h\)/.test(css));
}

// ── the tool column is bounded, and its buttons cannot squash ────────
{
  ok('the tool column is anchored at the bottom, not left to grow',
     /#tool-column\{[^}]*bottom:/.test(css));
  ok('it can scroll rather than clip if it ever runs out of room',
     /#tool-column\{[^}]*overflow-y:auto/.test(css));
  ok('its buttons do not flex-shrink into slivers',
     /\.tool-btn\{[^}]*flex:0 0 auto/.test(css));
}

// ── thirteen buttons actually fit ────────────────────────────────────
const buttons = (html.match(/<div id="tool-column">([\s\S]*?)<\/div>/) || ['', ''])[1]
  .match(/<button/g) || [];

function fits(label, viewportH, scope) {
  const dock = rootVar('dock-h', scope) ?? rootVar('dock-h');
  const top = px('#tool-column', 'top', scope) ?? px('#tool-column', 'top');
  const h = px('.tool-btn', 'height', scope) ?? px('.tool-btn', 'height');
  const gap = px('#tool-column', 'gap', scope) ?? px('#tool-column', 'gap');
  const need = buttons.length * h + (buttons.length - 1) * gap;
  const have = viewportH - top - dock;
  ok(`${label}: all ${buttons.length} tool buttons fit without scrolling`,
     need <= have, `need ${need}px, have ${Math.round(have)}px`);
  return { need, have };
}

// Thirteen since v1.02.47, when FILE joined the column. The number is pinned on purpose,
// and it is *not* the check that the column fits — `fits()` does that arithmetically at
// three viewport heights, and it stayed green when the twelfth button landed. This one
// exists so a thirteenth is a decision somebody makes here rather than a silent drift
// that `fits()` only fails on a phone nobody in the room owns.
ok('the tool column has the expected number of buttons', buttons.length === 13, String(buttons.length));
ok('the dossier button is one of them', /id="btn-file"/.test(html));
ok('the chart button is one of them', /id="btn-chart"/.test(html));
ok('the ARIA button is one of them', /id="btn-aria"/.test(html));
ok('the comms button is one of them', /id="btn-comms"/.test(html));

// A Samsung in portrait in Brave: ~1560 device px tall at DPR 2.625 is ~594 CSS px of
// viewport once browser chrome and the system nav bar are taken out. That is the case
// that was actually broken, so it is the case that has to pass.
fits('tall phone (860 CSS px)', 860, mediaBlock(860));
fits('short phone (740 CSS px)', 740, mediaBlock(740));
fits('very short (620 CSS px)', 620, mediaBlock(640));

// ── the throttle is a target, not a hairline ─────────────────────────
//
// This block used to assert the *opposite*: that the track had been trimmed to 14px or
// less, from an original 18. That was a reclaiming-canopy-space exercise and it worked —
// and it went one step too far, because it was measuring pixels rather than what those
// pixels had to do.
//
// A 13px absolute slider spanning -25%..100% puts one percent of throttle about a pixel
// and a half apart. A thumb's contact patch is roughly ten millimetres; aiming at 15%
// reliably produced 0 or 28. The control was small AND it was absolute, and the two
// together made low throttle settings unreachable on the device most of this game is
// played on.
//
// So the floor moved, and it moved for a stated reason: 20px is about 3mm on a modern
// phone, which is the low end of a real drag target. The precision problem itself is
// fixed in `ui/controls.js` — detents, a relative thumb drag, and steppers — because no
// amount of height makes an absolute slider hit 15%.
{
  const track = px('#speed-track-wrap', 'height');
  ok('the throttle track is big enough to be a drag target', track != null && track >= 20,
     String(track));
  ok('and not so tall it eats the canopy', track != null && track <= 30, String(track));
  ok('the track carries a thumb to grab', /id="speed-thumb"/.test(html));
  ok('and steppers either side of it',
     /id="thr-down"/.test(html) && /id="thr-up"/.test(html));
  const shortTrack = px('#speed-track-wrap', 'height', mediaBlock(740));
  ok('and trimmed further on short screens', shortTrack != null && shortTrack < track,
     `${track} → ${shortTrack}`);
  ok('the dock reserve tightens on short screens too',
     rootVar('dock-h', mediaBlock(740)) < rootVar('dock-h'),
     `${rootVar('dock-h')} → ${rootVar('dock-h', mediaBlock(740))}`);
  ok('the track is still big enough to drag with a thumb', track >= 10, String(track));
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
