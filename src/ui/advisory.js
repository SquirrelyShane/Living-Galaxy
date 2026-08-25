// Living Galaxy — ARIA's recommendation, as a panel you can argue with.
//
// ## Why a screen and not a toast
//
// `advisor.js` decides the ship is short of something — a rack that cooks itself, a bank
// that cannot feed the guns it is fitted with, a hold that fills before the field runs out.
// That conclusion is worth more than a line of radio chatter, because it comes with the
// readings that produced it and with a list of what would fix it and what that costs.
//
// A toast can carry the claim. It cannot carry the *case*, and the case is the part that
// makes this a recommendation rather than a nag: "we are short of heat capacity" is an
// opinion, and "we are short of heat capacity, here is the four seconds of fire this rack
// sustains, here are the two sinks that would change it and what they cost against what you
// have spare" is an argument. The player is free to disagree — that is why "Not now" is a
// button and not a delay.
//
// ## What it does not do
//
// It does not buy anything. Every option names where it is sold and whether it is
// affordable, and then hands off to the fitting bay. An assistant that spends your money
// from a panel you opened by accident is an assistant you turn off.

import { $, el, fmtCr } from '../core/utils.js';
import { sfx } from '../systems/platform/audio.js';
import { openFit } from './fitting.js';

let overlay, titleEl, bodyEl, evEl, optsEl, current = null;

export function initAdvisory() {
  overlay = $('advisory-overlay');
  titleEl = $('advisory-title');
  bodyEl = $('advisory-body');
  evEl = $('advisory-evidence');
  optsEl = $('advisory-options');
  if (!overlay) return;
  $('advisory-close').addEventListener('click', close);
  $('advisory-dismiss').addEventListener('click', close);
  $('advisory-fit').addEventListener('click', () => { close(); openFit(); });
}

/** What the reasoner saw, in the words it used. */
function evidenceRow(e) {
  const want = Array.isArray(e.want) ? `${fmt(e.want[0])}–${fmt(e.want[1])}` : fmt(e.want);
  const row = el('div', 'adv-ev', '');
  row.appendChild(el('span', '', e.fact));
  const val = el('span', '', '');
  val.innerHTML = `<b>${fmt(e.got)}</b> ${escape(e.op)} ${want}`;
  row.appendChild(val);
  return row;
}

const fmt = v => {
  if (v === Infinity) return '∞';
  if (typeof v !== 'number') return String(v);
  return Math.abs(v) >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10);
};
const escape = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function optionRow(o) {
  const row = el('div', 'adv-opt' + (o.afford ? ' afford' : ' no'), '');
  const left = el('div', '', '');
  left.appendChild(el('span', '', o.name));
  if (o.where) left.appendChild(el('span', 'where', o.where));
  row.appendChild(left);
  row.appendChild(el('span', 'price', o.price ? fmtCr(o.price) : '—'));
  return row;
}

/**
 * Open on one advisory. Registered as the `advisory` screen in main.js, so `advisor.js`
 * can ask for it without `systems/` ever importing `ui/`.
 */
export function openAdvisory(adv) {
  if (!overlay || !adv) return;
  current = adv;
  titleEl.textContent = adv.title;
  bodyEl.textContent = adv.body;
  overlay.classList.toggle('urgent', adv.urgency === 'high');

  evEl.innerHTML = '';
  for (const e of (adv.evidence || [])) evEl.appendChild(evidenceRow(e));

  optsEl.innerHTML = '';
  if (!(adv.options || []).length) {
    optsEl.appendChild(el('div', 'adv-opt no', 'Nothing on this hull fixes it — this one is a yard job.'));
  } else {
    for (const o of adv.options) optsEl.appendChild(optionRow(o));
    // What she is actually working with. Spare, not total: the reserve is money she has
    // already decided is not hers to spend, and quoting the full balance would be a lie
    // by omission every time it mattered.
    optsEl.appendChild(el('div', 'adv-ev', `spare after reserve  ${fmtCr(adv.spare || 0)}`));
  }

  overlay.classList.remove('hidden');
  sfx.ui();
}

function close() {
  if (!overlay) return;
  overlay.classList.add('hidden');
  current = null;
  sfx.ui();
}

/** For the suite: what the panel is currently making the case for. */
export const advisoryOpen = () => (overlay && !overlay.classList.contains('hidden') ? current : null);
