// Living Galaxy — the simulation asking for a screen.
//
// The second and last arrow that pointed from `systems/` up into `ui/`. `systems/approach.js`
// imported `openDock` directly, because the tractor beam finishing is exactly the moment the
// dock screen should appear — a real need, wired the wrong way round.
//
// It is the same problem `core/notify.js` solves for messages and it gets the same shape: the
// simulation names *what should happen*, the interface decides *what that looks like*, and
// with nothing registered the request is a silent no-op so a headless run works.
//
// One registry rather than one port per screen, because there will be more of these — a
// contract completing wanting the board, a hull finishing wanting the hangar — and a file
// per screen would be a table serving a synonym.
//
// Pure module: no DOM, no imports.

const handlers = new Map();

/**
 * Register what opens a named screen. Returns an unregister, so a screen can withdraw when
 * it is torn down rather than leaving a handler pointing at a dead node.
 */
export function registerScreen(name, open) {
  if (!name || typeof open !== 'function') return () => {};
  handlers.set(name, open);
  return () => { if (handlers.get(name) === open) handlers.delete(name); };
}

/**
 * Ask for a screen. Returns whether anything answered, which the caller is free to ignore —
 * docking completes whether or not there is an interface to show for it.
 */
export function requestScreen(name, opts) {
  const open = handlers.get(name);
  if (!open) return false;
  // A screen that throws must not take the simulation step down with it. Docking has already
  // happened by the time this is called; a broken panel is a display fault, not a physics one.
  try { open(opts); } catch (e) { return false; }
  return true;
}

/** Which screens can currently be opened. Diagnostics and the boot check. */
export const registeredScreens = () => [...handlers.keys()].sort();

export function resetScreens() { handlers.clear(); }
