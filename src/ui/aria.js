// Living Galaxy — ARIA panel. Thin view over systems/assistant.js. All the heavy
// work is in the worker; this just renders the chat and the load/status line.

import { $, el } from '../core/utils.js';
<<<<<<< HEAD
import { initAssistant, loadModel, ask, modelReady, modelLoading } from '../systems/npc/assistant.js';
import { sfx } from '../systems/platform/audio.js';
import { type as typeLine, voiceOf, finishAll } from './typewriter.js';

let overlay, log, input, statusEl, loadBtn, greeted = false;
let msgSeq = 1;
=======
import { initAssistant, loadModel, ask, modelReady, modelLoading } from '../systems/assistant.js';
import { sfx } from '../systems/audio.js';

let overlay, log, input, statusEl, loadBtn, greeted = false;
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

export function initAria() {
  overlay = $('aria-overlay'); log = $('aria-log'); input = $('aria-input');
  statusEl = $('aria-status'); loadBtn = $('aria-load');

  initAssistant(onStatus);
<<<<<<< HEAD
  $('aria-close').addEventListener('click', () => { finishAll(); overlay.classList.add('hidden'); });
  // Tapping the transcript skips ahead, exactly like the comms log.
  log.addEventListener('click', () => finishAll());
=======
  $('aria-close').addEventListener('click', () => overlay.classList.add('hidden'));
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  $('aria-send').addEventListener('click', send);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  loadBtn.addEventListener('click', () => { loadModel(); loadBtn.disabled = true; loadBtn.textContent = 'Loading…'; });
}

export function openAria() {
  overlay.classList.remove('hidden');
  sfx.ui();
  if (!greeted) {
    greeted = true;
<<<<<<< HEAD
    add('ai', 'ARIA online. Ask about the ship, the belt, threats, or where to sell — or say \u201Ctake the conn\u201D and I will fly her. I answer from live telemetry either way.');
=======
    add('ai', 'ARIA online. Ask about the ship, the belt, threats, or where to sell. I answer from live telemetry — load the local model if you want freeform conversation.');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  }
  setTimeout(() => input.focus && input.focus(), 50);
}

function send() {
  const q = (input.value || '').trim();
  if (!q) return;
  input.value = '';
  add('you', q);
  const thinking = add('ai think', modelReady() ? 'ARIA is thinking…' : '…');
<<<<<<< HEAD
  ask(q).then(txt => {
    thinking.classList.remove('think');
    // ARIA speaks rather than printing. Keyed per message so a re-render cannot restart it,
    // and on her own voice number so she is consistent across a session.
    typeLine(thinking, txt, { key: 'aria:' + (msgSeq++), kind: 'aria', voice: voiceOf('ARIA'),
                              onDone: scroll });
    scroll();
  });
=======
  ask(q).then(txt => { thinking.textContent = txt; thinking.classList.remove('think'); scroll(); });
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
}

function add(cls, text) {
  const n = el('div', 'aria-msg ' + cls, '');
  n.textContent = text;
  log.appendChild(n);
  scroll();
  return n;
}
function scroll() { log.scrollTop = log.scrollHeight; }

function onStatus(s) {
  if (s.kind === 'loading') { statusEl.className = ''; statusEl.textContent = `Loading model… ${s.pct || 0}%${s.file ? ' · ' + s.file : ''}`; }
  else if (s.kind === 'ready') {
    statusEl.className = 'ready';
    statusEl.textContent = `Local model ready (${s.device}). Answers now run through SmolLM2, off the render thread.`;
    loadBtn.classList.add('hidden');
    add('ai', 'Model online. I can talk freely now — still reading your live telemetry.');
  } else if (s.kind === 'error') {
    statusEl.className = 'err';
    statusEl.textContent = `Model unavailable (${s.msg}). Staying in rule-based mode — every answer still works.`;
    loadBtn.disabled = false; loadBtn.textContent = 'Retry model load';
  } else if (s.kind === 'nofallback') {
    statusEl.className = 'err';
    statusEl.textContent = 'This browser has no Web Worker support — rule-based mode only.';
    loadBtn.classList.add('hidden');
  }
}
