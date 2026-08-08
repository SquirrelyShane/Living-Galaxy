// Living Galaxy — ARIA panel. Thin view over systems/assistant.js. All the heavy
// work is in the worker; this just renders the chat and the load/status line.

import { $, el } from '../core/utils.js';
import { initAssistant, loadModel, ask, modelReady, modelLoading } from '../systems/assistant.js';
import { sfx } from '../systems/audio.js';

let overlay, log, input, statusEl, loadBtn, greeted = false;

export function initAria() {
  overlay = $('aria-overlay'); log = $('aria-log'); input = $('aria-input');
  statusEl = $('aria-status'); loadBtn = $('aria-load');

  initAssistant(onStatus);
  $('aria-close').addEventListener('click', () => overlay.classList.add('hidden'));
  $('aria-send').addEventListener('click', send);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  loadBtn.addEventListener('click', () => { loadModel(); loadBtn.disabled = true; loadBtn.textContent = 'Loading…'; });
}

export function openAria() {
  overlay.classList.remove('hidden');
  sfx.ui();
  if (!greeted) {
    greeted = true;
    add('ai', 'ARIA online. Ask about the ship, the belt, threats, or where to sell. I answer from live telemetry — load the local model if you want freeform conversation.');
  }
  setTimeout(() => input.focus && input.focus(), 50);
}

function send() {
  const q = (input.value || '').trim();
  if (!q) return;
  input.value = '';
  add('you', q);
  const thinking = add('ai think', modelReady() ? 'ARIA is thinking…' : '…');
  ask(q).then(txt => { thinking.textContent = txt; thinking.classList.remove('think'); scroll(); });
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
