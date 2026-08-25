// Living Galaxy — pointing ARIA at a career.
//
// The sheet that opens when you hand her the ship. Not a settings screen: the moment you
// flip AP on is the moment the question "what should this ship be doing with its life"
// actually has an answer you care about, and asking it anywhere else means it gets set once
// and never revisited.
//
// It opens on engage, once, and after that it is a chip next to the switch — because the
// second time you turn the autopilot on you already know what you want and a modal in the
// way is an obstacle rather than a prompt. `S.settings.doctrineAsk` is what remembers that.

import { $, el } from '../core/utils.js';
import { S } from '../core/state.js';
import { DOCTRINES, DOCTRINE_KEYS } from '../data/doctrine.js';
import { doctrine, setDoctrine, autopilotOn } from '../systems/npc/autopilot.js';
import { sfx } from '../systems/platform/audio.js';

let sheet = null, chip = null;

export function initDoctrine() {
  sheet = $('doctrine-sheet');
  chip = $('ap-doctrine');
  if (!sheet) return;
  $('doctrine-close').addEventListener('click', close);
  sheet.addEventListener('click', e => { if (e.target === sheet) close(); });
  if (chip) chip.addEventListener('click', () => openDoctrine(true));
  paintChip();
}

/**
 * Open it.
 *
 * @param {boolean} [force] true when the player asked; false when the autopilot did, in
 *   which case it defers to their having already answered once.
 */
export function openDoctrine(force) {
  if (!sheet) return false;
  if (!force && S.settings.doctrineAsk === false) return false;
  render();
  sheet.classList.remove('hidden');
  sfx.ui();
  return true;
}

export function close() {
  if (sheet) sheet.classList.add('hidden');
  paintChip();
}

export const doctrineOpen = () => !!sheet && !sheet.classList.contains('hidden');

/** Called when the switch goes on. The first time, it asks; after that it does not. */
export function doctrinePrompt() {
  if (S.settings.doctrineAsk === false) { paintChip(); return false; }
  S.settings.doctrineAsk = false;
  return openDoctrine(true);
}

function paintChip() {
  if (!chip) return;
  const d = DOCTRINES[doctrine()];
  chip.textContent = `${d.icon} ${d.name}`;
  chip.classList.toggle('hidden', !autopilotOn());
}

function render() {
  const body = $('doctrine-body');
  body.innerHTML = '';
  body.appendChild(el('div', 'wm-note',
    'What is this ship for? She will still repair a hurt hull and sell a full hold whatever ' +
    'you pick — this decides what she goes looking for when nothing is urgent.'));

  const now = doctrine();
  for (const k of DOCTRINE_KEYS) {
    const d = DOCTRINES[k];
    const row = el('button', 'doc-row' + (k === now ? ' on' : ''));
    const head = el('div', 'doc-head');
    head.appendChild(el('span', 'doc-icon', d.icon));
    head.appendChild(el('span', 'doc-name', d.name));
    if (k === now) head.appendChild(el('span', 'doc-now', 'current'));
    row.appendChild(head);
    row.appendChild(el('div', 'doc-blurb', d.blurb));
    row.appendChild(el('div', 'doc-detail', d.detail));
    row.addEventListener('click', () => { setDoctrine(k); close(); });
    body.appendChild(row);
  }
}

/** Repaint after the autopilot switch moves. Called by the HUD. */
export const refreshDoctrineChip = paintChip;
