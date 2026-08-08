// Living Galaxy — transient messages. Kept dependency-free so any system can import it.

import { $ } from '../core/utils.js';

let node = null, timer = 0;

export function toast(msg, ms = 2200) {
  if (!node) node = $('toast');
  if (!node) return;
  node.textContent = msg;
  node.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => node.classList.remove('show'), ms);
}

/** Persistent line under the system name. */
export function status(msg) {
  const n = $('status-line');
  if (n) n.textContent = msg;
}
