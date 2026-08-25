// Living Galaxy — the warp button, as a decision rather than a switch.
//
// ## What it replaces
//
// One button that toggled the core. It laid no course of its own, it had no opinion about
// where the jump should stop, and every jump dropped out at `WARP.arriveRadius` — 240 km,
// unconditionally, for a berth with no gravity at all. So the shape of every trip was: two
// seconds of warp, then a four-minute quarter-throttle crawl at the end of it. Which is
// exactly what "she is just approaching, not warping" describes from the cockpit.
//
// ## The two things a pilot actually wants
//
// **WARP TO** — put me alongside it. A few kilometres off the hull, close enough that the
// run-in is seconds and the docking reach is a nudge away.
//
// **WARP WITHIN** — put me *near* it, and let me choose how near. Coming out on top of a
// contact you have not identified is a good way to arrive inside somebody's firing solution,
// and standing off at half a megametre to look first is a real tactic. The slider runs
// 150 km to 1 Mm because that is the band where the choice means something: closer than
// 150 km and you may as well have said WARP TO, further than 1 Mm and you are not really
// going there.
//
// **HAIL** is on the same menu, and that is deliberate rather than tidy. "Get near that
// thing" and "talk to that thing" are the same intention at two ranges, and putting them
// two taps apart on a phone is how a player ends up never using the second one.
//
// ## Why a menu and not more buttons
//
// The dock is full. Six action buttons is already the most a thumb can find without looking,
// and this is a phone-first game — see the throttle rebuild in `controls.js` for the same
// argument made about a different control. A menu costs one extra tap and buys unlimited
// room; a seventh button costs nothing and makes the other six harder to hit.

import { $, el, fmtKm } from '../core/utils.js';
import { S } from '../core/state.js';
import { WARP } from '../core/config.js';
import { toggleWarp, setCourse, clearCourse } from '../systems/flight/warp.js';
import { canWarp } from '../systems/platform/preflight.js';
import { openContact, contactable } from './contact.js';
import { sfx } from '../systems/platform/audio.js';
import { toast } from './toast.js';

let menu = null, standoff = WARP.standoffDefault;

/** What the jump is aimed at: the locked target, or the course already laid. */
function subject() {
  if (S.target && S.target.obj) return { obj: S.target.obj, name: S.target.name, kind: S.target.kind };
  if (S.warp.dest && S.warp.dest.obj) {
    return { obj: S.warp.dest.obj, name: S.warp.dest.name, kind: 'course' };
  }
  return null;
}

export const warpMenuOpen = () => !!menu && !menu.classList.contains('hidden');

export function initWarpMenu() {
  menu = $('warp-menu');
  if (!menu) return;
  $('warp-menu-close').addEventListener('click', closeWarpMenu);
  // Tapping the backdrop is the same as closing it. On a phone the backdrop is most of the
  // screen and is the target a thumb reaches for first.
  menu.addEventListener('click', e => { if (e.target === menu) closeWarpMenu(); });
}

/**
 * Open the menu, or — mid-flight — just drop out.
 *
 * A core that is already running has exactly one thing you want from this button, and
 * making somebody read a menu to find it is the wrong answer at the one moment they are
 * probably in a hurry.
 */
export function warpButton() {
  if (S.warp.state === 'spooling' || S.warp.state === 'warping') { toggleWarp(); return; }
  openWarpMenu();
}

export function openWarpMenu() {
  if (!menu) { toggleWarp(); return; }
  const t = subject();
  render(t);
  menu.classList.remove('hidden');
  sfx.ui();
}

export function closeWarpMenu() {
  if (menu) menu.classList.add('hidden');
}

function render(t) {
  const body = $('warp-menu-body');
  body.innerHTML = '';
  $('warp-menu-name').textContent = t ? t.name : 'No target';

  if (!t) {
    body.appendChild(el('div', 'wm-note',
      'Nothing locked. Pick a contact, a body or a berth first — the chart and the contact ' +
      'list both lock what you tap.'));
    body.appendChild(row('Spool anyway', 'Blind jump — burns the core with nowhere to go', () => {
      closeWarpMenu(); toggleWarp();
    }, 'ghost'));
    return;
  }

  const gap = Math.max(0, t.obj.position.distanceTo(S.player.position) -
                          ((t.obj.userData && t.obj.userData.radius) || 0));
  body.appendChild(el('div', 'wm-note', `${fmtKm(gap)} out.`));

  // The refusal, up front and with its reason, rather than after a tap that does nothing.
  const clear = canWarp();
  if (!clear.ok) body.appendChild(el('div', 'wm-warn', clear.reason));

  body.appendChild(row('Warp to', `Arrive alongside — about ${fmtKm(WARP.closeArrive)} off the hull`,
    () => jump(t, null), 'go'));

  // ── the slider ──
  const wrap = el('div', 'wm-slider');
  const head = el('div', 'wm-slider-head');
  head.appendChild(el('span', '', 'Warp within'));
  const val = el('span', 'wm-slider-val', fmtKm(standoff));
  head.appendChild(val);
  wrap.appendChild(head);

  const bar = document.createElement('input');
  bar.type = 'range';
  bar.min = String(WARP.standoffMin);
  bar.max = String(WARP.standoffMax);
  bar.step = '10';
  bar.value = String(standoff);
  bar.className = 'wm-range';
  bar.addEventListener('input', () => {
    standoff = Number(bar.value) || WARP.standoffDefault;
    val.textContent = fmtKm(standoff);
  });
  wrap.appendChild(bar);

  const ends = el('div', 'wm-slider-ends');
  ends.appendChild(el('span', '', fmtKm(WARP.standoffMin)));
  ends.appendChild(el('span', '', fmtKm(WARP.standoffMax)));
  wrap.appendChild(ends);
  body.appendChild(wrap);

  body.appendChild(row('Warp within', 'Hold at the distance above', () => jump(t, standoff), 'go'));

  // ── hail ──
  if (contactable(t.obj)) {
    body.appendChild(row('Open a channel', 'Talk to them — services, terms, or an ultimatum',
      () => { closeWarpMenu(); openContact(t.obj); }));
  }

  if (S.warp.dest) {
    body.appendChild(row('Clear the course', 'Forget where we were going',
      () => { clearCourse(); closeWarpMenu(); toast('Course cleared'); }, 'ghost'));
  }
}

function row(label, sub, onTap, cls) {
  const b = el('button', 'wm-row ' + (cls || ''));
  b.appendChild(el('div', 'wm-row-label', label));
  if (sub) b.appendChild(el('div', 'wm-row-sub', sub));
  b.addEventListener('click', onTap);
  return b;
}

function jump(t, gap) {
  closeWarpMenu();
  setCourse(t.obj, t.name, gap);
  toggleWarp();
}

/** For the suite: what the slider currently says, in units. */
export const warpStandoffChoice = () => standoff;
export function setWarpStandoffChoice(v) {
  standoff = Math.max(WARP.standoffMin, Math.min(WARP.standoffMax, Number(v) || WARP.standoffDefault));
  return standoff;
}
