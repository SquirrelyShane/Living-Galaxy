<<<<<<< HEAD
// Living Galaxy — showing a transient message.
//
// This used to *be* the notification system, and thirty-five files under `systems/` imported
// it — thirty-five arrows from the simulation up into the interface. The port moved to
// `core/notify.js` at v1.02.52 and this became what it always should have been: the sink
// that renders a notice, registered at boot, replaceable, and imported by nobody in
// `systems/`.
//
// `toast` and `status` are still re-exported here. UI modules legitimately raise notices
// too, and making them import from core while the rest of the file is about rendering would
// be a distinction without a difference at the call site. What matters is that the arrow
// from `systems/` is gone.

import { $ } from '../core/utils.js';
import { setNotifySink, toast, status } from '../core/notify.js';

let node = null, timer = 0;

/**
 * Register the DOM renderer. Called once from the boot sequence.
 *
 * Deliberately not run at import time: a module that reaches for the document as a side
 * effect of being imported is a module that cannot be loaded in a test, which is most of
 * what this change was for.
 */
export function initToast() {
  return setNotifySink({
    toast(msg, ms) {
      if (!node) node = $('toast');
      if (!node) return;
      node.textContent = msg;
      node.classList.add('show');
      clearTimeout(timer);
      timer = setTimeout(() => node.classList.remove('show'), ms);
    },
    status(msg) {
      const n = $('status-line');
      if (n) n.textContent = msg;
    }
  });
}

export { toast, status };
=======
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
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
