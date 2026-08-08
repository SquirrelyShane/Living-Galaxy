// Living Galaxy — the mind overlay.
//
// Tap a speaker's name in the comms log and see who they actually are: the six axes, the
// words those axes add up to, and every memory they hold about you.
//
// This started as a debug view for tuning the trait weights and stayed because it turned
// out to be the feature. The NPC_Avatar tiers do a lot of work that is invisible by
// design — a miner says a slightly different thing because their sociability is 0.3 and
// they watched you kill someone last week — and a player who cannot see any of that just
// experiences mild variety. Being able to open somebody's head and read "grasping,
// withdrawn — saw you destroy Vann" turns the machinery into something you can play
// against, and makes the difference between an NPC being random and an NPC having a
// reason.
//
// Deliberately read-only. Nothing here changes a persona; it is a window, not a console.

import { $, el } from '../core/utils.js';
import { AXES } from '../npc-avatar/core/traits.js';
import { personaReport } from '../systems/npc-brain.js';
import { sfx } from '../systems/audio.js';

let overlay, body, nameEl;

// How a memory type reads to a player. Anything unmapped falls back to its raw type,
// which is the honest behaviour for a debug-descended view — an unfamiliar tag showing
// up means a new hook was added and forgotten here, and that should be visible.
const MEMORY_TEXT = {
  'contract':        'took a contract on you',
  'trespass':        'warned you out of a claim',
  'distress':        'called for help on your band',
  'traded':          'has done business with you',
  'claim-jumped':    'watched you cut a rock they were working',
  'saw-kill-ours':   'saw you destroy one of theirs',
  'saw-kill-theirs': 'saw you destroy one of their rivals'
};

export function initMind() {
  overlay = $('mind-overlay');
  body = $('mind-body');
  nameEl = $('mind-name');
  if (!overlay) return;
  const close = $('mind-close');
  if (close) close.addEventListener('click', () => overlay.classList.add('hidden'));
}

export const mindOpen = () => overlay && !overlay.classList.contains('hidden');
export function closeMind() { if (overlay) overlay.classList.add('hidden'); }

/**
 * Open the overlay on one character. Returns false if there is nothing to show — a
 * speaker with no persona (an unnamed ship, a system message) simply does not respond to
 * the tap rather than opening an empty panel.
 */
export function openMind(name) {
  if (!overlay || !body || !name) return false;
  const r = personaReport(name);
  if (!r) return false;

  if (nameEl) nameEl.textContent = r.name;
  body.innerHTML = '';

  body.appendChild(el('div', 'mind-arch', `${r.archetype} · ${r.faction}`));
  body.appendChild(el('div', 'mind-desc',
    r.descriptors.length
      ? cap(r.descriptors.join(', '))
      : 'Nothing much stands out about them.'));

  for (const axis of AXES) {
    const v = r.traits[axis];
    if (v == null) continue;
    const row = el('div', 'mind-axis');
    row.appendChild(el('span', 'lbl', axis));
    const track = el('div', 'track');
    const fill = el('div', 'fill');
    fill.style.width = Math.round(v * 100) + '%';
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(el('span', 'val', String(Math.round(v * 100))));
    body.appendChild(row);
  }

  const head = el('div', 'sec-head', r.recent.length ? 'What they remember' : 'They do not know you');
  head.style.marginTop = '14px';
  body.appendChild(head);

  if (!r.recent.length) {
    body.appendChild(el('div', 'mind-mem', 'You have never given them a reason to think about you.'));
  } else {
    for (const m of r.recent) {
      const line = el('div', 'mind-mem');
      const what = MEMORY_TEXT[m.type] || m.type;
      const extra = m.meta && m.meta.victim ? ` (${m.meta.victim})`
                  : m.meta && m.meta.value ? ` (${m.meta.value} cr)` : '';
      line.innerHTML = `<b>·</b> ${what}${extra}`;
      body.appendChild(line);
    }
  }

  overlay.classList.remove('hidden');
  sfx.ui();
  return true;
}

const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
