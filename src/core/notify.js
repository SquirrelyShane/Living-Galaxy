// Living Galaxy — telling the pilot something.
//
// This is a **port**, not a widget. It is the one place in the project where a simulation
// system is allowed to say "the pilot should know about this", and it deliberately knows
// nothing about how that gets shown.
//
// ## The inversion this ends
//
// `ui/toast.js` carried the comment "kept dependency-free so any system can import it", and
// it was — but the direction was still wrong. Thirty-five files under `systems/` imported it,
// which is thirty-five arrows pointing from the simulation *up* into the interface. That is
// the largest architectural inversion in the project and it cost real things:
//
//   **Every system needed a DOM to run.** `toast()` reaches for `$('toast')` and `status()`
//   for `$('status-line')`, so importing `systems/economy.js` in a test pulled in a document.
//   `test/stub.mjs` exists in large part to satisfy that, and it is 400 lines.
//
//   **A headless consumer had no way in.** The fleet layer runs work for hulls the player
//   cannot see, a server would run the sim with no interface at all, and neither had any way
//   to receive a notice except by pretending to be a browser.
//
//   **The dependency graph said the wrong thing.** A reader tracing what `contracts.js`
//   depends on found the interface layer, which is not true of the logic and never was.
//
// Now the arrow points down. `core/notify.js` holds a sink; `ui/toast.js` registers one at
// boot; systems call `toast()` and `status()` exactly as before and do not know or care
// whether anything is listening. With no sink registered the calls are silent no-ops, which
// is the correct behaviour for a headless run and is why the tests stopped needing a DOM for
// this.
//
// ## Why a sink rather than an event bus
//
// A bus would let anything subscribe, and then two things would render the same toast. There
// is exactly one place a transient message goes and exactly one status line; a single
// replaceable sink says that, and a subscriber list would not.
//
// The `log` sink is the exception and it is additive on purpose — diagnostics, the flight
// recorder and a test harness all legitimately want to *observe* every notice without being
// the thing that displays it.
//
// Pure module: no DOM, no three.js, no imports at all.

/** Where a notice goes. Replaced at boot by `ui/toast.js`; null means nothing is listening. */
let sink = null;

/** Observers. Additive, and never responsible for display. */
const observers = [];

/**
 * Install the thing that shows notices. Returns the previous sink so a caller that is
 * temporarily taking over — a cutscene, a test — can put it back.
 *
 * A sink is `{ toast(msg, ms), status(msg) }`. Either method may be omitted.
 */
export function setNotifySink(next) {
  const prev = sink;
  sink = next || null;
  return prev;
}

/** Watch every notice without being the one that displays it. Returns an unsubscribe. */
export function observeNotices(fn) {
  if (typeof fn !== 'function') return () => {};
  observers.push(fn);
  return () => {
    const i = observers.indexOf(fn);
    if (i >= 0) observers.splice(i, 1);
  };
}

/** For teardown and tests. */
export function resetNotify() {
  sink = null;
  observers.length = 0;
}

function emit(kind, msg, ms) {
  for (let i = 0; i < observers.length; i++) {
    // An observer that throws must not take the notice down with it — a broken flight
    // recorder should not stop the pilot being told the hull is on fire.
    try { observers[i]({ kind, msg, ms }); } catch (e) { /* observers are advisory */ }
  }
}

/**
 * A transient message. The thing that appears for a couple of seconds and goes away.
 *
 * Silent when nothing is listening, which is what makes a headless run work.
 */
export function toast(msg, ms = 2200) {
  if (msg == null || msg === '') return;
  emit('toast', String(msg), ms);
  if (sink && sink.toast) sink.toast(String(msg), ms);
}

/** The persistent line under the system name. Replaces whatever was there. */
export function status(msg) {
  if (msg == null) return;
  emit('status', String(msg));
  if (sink && sink.status) sink.status(String(msg));
}

/** Is anything actually showing these? Diagnostics, and the boot sequence's own check. */
export const notifyBound = () => !!sink;
