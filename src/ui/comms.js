// Living Galaxy — the comms panel.
//
// A radio log with channel filters and, when someone is waiting on you, a row of reply
// buttons under it. The buttons are the whole reason this is a panel rather than a toast
// stream: a message you can only read is a notification, and a message you can answer is
// a conversation.
//
// Rendering is full-redraw on change rather than incremental. The log is capped at
// COMMS.maxLog, the panel is only open when the player is looking at it, and a diffing
// renderer for a hundred lines of text would be more code than it saved.

import { $, el } from '../core/utils.js';
import { COMMS } from '../core/config.js';
import { commsLog, unread, pending, reply, markRead, setChannel, onComms } from '../systems/comms.js';
import { S } from '../core/state.js';
import { tutorialEvent } from '../systems/tutorial.js';
import { sfx } from '../systems/audio.js';
import { openMind } from './mind.js';

let overlay, logEl, chanEl, replyEl, badge;

const FACTION_CLASS = {
  hostile: 'f-hostile', friendly: 'f-friendly', neutral: 'f-neutral',
  player: 'f-you', coalition: 'f-friendly', pirate: 'f-hostile'
};

export function initComms() {
  overlay = $('comms-overlay');
  logEl = $('comms-log');
  chanEl = $('comms-channels');
  replyEl = $('comms-replies');
  badge = $('comms-badge');
  if (!overlay) return;

  const close = $('comms-close');
  if (close) close.addEventListener('click', () => overlay.classList.add('hidden'));

  const btn = $('btn-comms');
  if (btn) btn.addEventListener('click', () => toggle());

  if (chanEl) {
    for (const ch of ['all'].concat(COMMS.channels)) {
      const b = el('button', 'chip' + (ch === 'all' ? ' on' : ''), ch);
      b.dataset.chan = ch;
      b.addEventListener('click', () => {
        sfx.ui();
        for (const kid of chanEl.children) kid.classList.toggle('on', kid === b);
        setChannel(ch === 'all' ? 'local' : ch);
        filter = ch;
        render();
      });
      chanEl.appendChild(b);
    }
  }

  onComms(() => { renderBadge(); if (isOpen()) render(); });
  renderBadge();
}

let filter = 'all';

const isOpen = () => overlay && !overlay.classList.contains('hidden');

export function openComms() {
  if (!overlay) return;
  overlay.classList.remove('hidden');
  markRead();
  tutorialEvent('comms');
  sfx.ui();
  render();
}

export function closeComms() { if (overlay) overlay.classList.add('hidden'); }
function toggle() { isOpen() ? closeComms() : openComms(); }

function renderBadge() {
  if (!badge) return;
  const n = unread();
  badge.textContent = n > 9 ? '9+' : String(n);
  badge.classList.toggle('hidden', n <= 0);
}

export function render() {
  if (!logEl) return;
  logEl.innerHTML = '';
  const rows = commsLog().filter(e => filter === 'all' || e.channel === filter);
  if (!rows.length) {
    logEl.appendChild(el('div', 'comms-empty', 'Band is quiet. Get closer to somebody.'));
  }
  for (const e of rows.slice(-60)) {
    const row = el('div', 'comms-row ' + (FACTION_CLASS[e.faction] || 'f-neutral') +
                          (e.kind === 'hail' ? ' hail' : '') + (e.kind === 'you' ? ' you' : ''));
    const who = el('span', 'comms-who', '');
    who.textContent = e.from;
    // Tapping a speaker opens their mind. `speaker` is the persona key rather than the
    // display name, and its absence is how a system message or an unnamed ship silently
    // declines the tap instead of opening an empty panel.
    if (e.speaker) {
      who.addEventListener('click', ev => { ev.stopPropagation(); openMind(e.speaker); });
    } else {
      who.style.cursor = 'default';
      who.style.textDecoration = 'none';
    }
    const ch = el('span', 'comms-chan', '');
    ch.textContent = e.channel;
    const txt = el('div', 'comms-text', '');
    txt.textContent = e.text;
    const head = el('div', 'comms-head', '');
    head.appendChild(who);
    head.appendChild(ch);
    row.appendChild(head);
    row.appendChild(txt);
    logEl.appendChild(row);
  }
  logEl.scrollTop = logEl.scrollHeight;
  renderReplies();
  renderBadge();
}

function renderReplies() {
  if (!replyEl) return;
  replyEl.innerHTML = '';
  const p = pending();
  if (!p) {
    replyEl.classList.add('hidden');
    return;
  }
  replyEl.classList.remove('hidden');
  const left = Math.max(0, Math.round(COMMS.replyWindow - (S.time - p.opened)));
  const head = el('div', 'comms-prompt', '');
  head.textContent = `${p.from} is waiting — ${left}s`;
  replyEl.appendChild(head);

  for (const o of p.options) {
    const b = el('button', 'wide-btn ghost', '');
    b.textContent = o.label;
    b.addEventListener('click', () => { sfx.ui(); reply(o.i); render(); });
    replyEl.appendChild(b);
  }
  const quiet = el('button', 'wide-btn ghost', '');
  quiet.textContent = 'Say nothing';
  quiet.addEventListener('click', () => { sfx.ui(); reply(-1); render(); });
  replyEl.appendChild(quiet);
}

/** Cheap per-frame work: only the countdown moves, and only while the panel is open. */
export function tickComms() {
  if (!isOpen()) return;
  const p = pending();
  if (!p || !replyEl || replyEl.classList.contains('hidden')) return;
  const head = replyEl.firstChild;
  if (!head) return;
  const left = Math.max(0, Math.round(COMMS.replyWindow - (S.time - p.opened)));
  head.textContent = `${p.from} is waiting — ${left}s`;
}
