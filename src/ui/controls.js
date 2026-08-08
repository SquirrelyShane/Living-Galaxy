// Living Galaxy — input. Pointer events cover mouse and touch in one path;
// keys are a convenience for desktop testing.
//
// Pitch is drag-only now. The old edge slider cost 48 px of canopy and duplicated
// what a vertical drag already does; LEVEL moved into the tool column, and the
// number lives beside the crosshair where the eye already is.

import { S, recalcStats } from '../core/state.js';
import { ACTIONS, actionFor, pollGamepad } from '../systems/input.js';
import { openSettings, closeSettings, isOpen as isSettingsOpen } from './settings.js';
import { SHIP_CLASSES, MAX_PITCH } from '../core/config.js';
import { $, clamp } from '../core/utils.js';
import { toggleWarp } from '../systems/warp.js';
import { cycleTarget, clearTarget } from '../systems/targeting.js';
import { dock, undock } from '../systems/economy.js';
import { saveGame } from '../systems/save.js';
import { openNavmap } from './navmap.js';
import { openAria } from './aria.js';
import { openFit } from './fitting.js';
import { openCrew } from './crew.js';
import { openDock, dockOpen, closeDock } from './dock.js';
import { sfx, resumeAudio, setAudioEnabled, startMusic } from '../systems/audio.js';
import { cycleActive, activeLabel, hasSplit } from '../systems/groups.js';
import { toast } from './toast.js';

const DRAG_GAIN = 0.0042;

function breakAutopilot() {
  // Manual input always wins. Approach, orbit hold and velocity-match all yield.
  if (S.approach) S.approach = null;
  if (S.orbit) S.orbit = null;
  if (S.follow) S.follow = null;
}

export function initControls() {
  steering();
  slider($('speed-track'), (t, rect, e) => {
    breakAutopilot();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    S.player.throttle = -0.25 + x * 1.25;
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  });

  document.querySelectorAll('.preset-btn').forEach(b => {
    b.addEventListener('click', () => {
      breakAutopilot();
      S.player.throttle = parseFloat(b.dataset.pct) / 100;
      document.querySelectorAll('.preset-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      sfx.ui();
    });
  });

  hold($('btn-fire'), v => { S.input.firing = v; });

  // Three-state group selector. It lives above the action grid rather than in it: a
  // seventh button in that row is a smaller tap target for every button, and this one is
  // only meaningful for a fit that has actually been split.
  tap($('group-chip'), () => {
    cycleActive();
    refreshGroupChip();
    sfx.ui();
  });
  refreshGroupChip();
  hold($('btn-mine'), v => { S.input.mining = v; });

  tap($('warp-btn'), toggleWarp);
  tap($('btn-nav'), openNavmap);
  tap($('btn-fit'), openFit);
  tap($('btn-crew'), openCrew);
  tap($('btn-cycle'), () => { if (!cycleTarget()) toast('Nothing in sensor range'); });
  tap($('target-clear'), clearTarget);
  tap($('dock-prompt'), () => { if (dock()) openDock(); });
  tap($('btn-level'), () => {
    S.player.autoLevel = true;
    $('btn-level').classList.add('on');
    setTimeout(() => $('btn-level').classList.remove('on'), 700);
    sfx.ui();
  });

  tap($('btn-assist'), () => {
    S.settings.assist = !S.settings.assist;
    $('btn-assist').classList.toggle('on', S.settings.assist);
    toast(S.settings.assist ? 'Flight assist on' : 'Flight assist off — newtonian');
  });
  tap($('btn-audio'), () => {
    // setAudioEnabled mutes the master and suspends the context. Flipping the flag alone
    // only silenced sounds that had not started yet, which left the music bed droning.
    setAudioEnabled(!S.settings.audio);
    $('btn-audio').classList.toggle('on', S.settings.audio);
    if (S.settings.audio) { resumeAudio(); startMusic(); }
    toast(S.settings.audio ? 'Sound on' : 'Sound off');
  });
  tap($('btn-save'), () => saveGame(false));
  tap($('btn-cam'), () => {
    S.settings.chase = !S.settings.chase;
    $('btn-cam').classList.toggle('on', S.settings.chase);
    toast(S.settings.chase ? 'Chase camera' : 'Cockpit camera');
  });
  tap($('btn-aria'), openAria);

  keys();
}

// ── steering ─────────────────────────────────────────────────────────
function steering() {
  const canvas = $('game-canvas');
  let id = null, lx = 0, ly = 0;

  canvas.addEventListener('pointerdown', e => {
    if (id !== null) return;
    id = e.pointerId; lx = e.clientX; ly = e.clientY;
    S.input.dragging = true;
    S.player.autoLevel = false;
    breakAutopilot();
    canvas.setPointerCapture(id);
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    const st = S.stats || SHIP_CLASSES[S.player.classKey];
    S.player.yaw -= (e.clientX - lx) * DRAG_GAIN * st.turnRate;
    S.player.pitch = clamp(S.player.pitch - (e.clientY - ly) * DRAG_GAIN * st.pitchRate,
                           -MAX_PITCH, MAX_PITCH);
    lx = e.clientX; ly = e.clientY;
  });
  const end = e => {
    if (e.pointerId !== id) return;
    id = null;
    S.input.dragging = false;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
}

// ── widget helpers ───────────────────────────────────────────────────
function slider(node, apply) {
  if (!node) return;
  let id = null;
  const run = e => apply(null, node.getBoundingClientRect(), e);
  node.addEventListener('pointerdown', e => {
    id = e.pointerId;
    node.setPointerCapture(id);
    run(e);
    e.preventDefault();
  });
  node.addEventListener('pointermove', e => { if (e.pointerId === id) run(e); });
  const end = e => { if (e.pointerId === id) id = null; };
  node.addEventListener('pointerup', end);
  node.addEventListener('pointercancel', end);
}

function hold(node, set) {
  if (!node) return;
  const on = e => {
    node.classList.add('active');
    set(true);
    try { node.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  };
  const off = () => { node.classList.remove('active'); set(false); };
  node.addEventListener('pointerdown', on);
  node.addEventListener('pointerup', off);
  node.addEventListener('pointercancel', off);
  node.addEventListener('pointerleave', off);
}

function tap(node, fn) {
  if (!node) return;
  node.addEventListener('click', e => { e.preventDefault(); fn(); });
}

// ── keyboard & gamepad ───────────────────────────────────────────────
// Nothing below knows what key does what. It asks the binding table for the *action* a
// code maps to, which is what makes rebinding a data change rather than a code change —
// and is why the gamepad slotted in underneath without touching any of this logic.
function keys() {
  const held = new Set();          // actions currently asserted, from any device

  const press = (action) => {
    switch (action) {
      case 'warp': toggleWarp(); break;
      case 'navmap': openNavmap(); break;
      case 'fitting': openFit(); break;
      case 'crew': openCrew(); break;
      case 'target': cycleTarget(); break;
      case 'cutThrottle': S.player.throttle = 0; break;
      case 'level': S.player.autoLevel = true; break;
      case 'dock': if (dock()) openDock(); break;
      case 'settings': isSettingsOpen() ? closeSettings() : openSettings(); break;
    }
  };

  const setHeld = (action, on) => {
    if (on) held.add(action); else held.delete(action);
    if (action === 'fire') S.input.firing = on;
    if (action === 'mine') S.input.mining = on;
  };

  addEventListener('keydown', e => {
    if (e.repeat) return;
    const action = actionFor(e.code);
    if (!action) return;
    if (ACTIONS[action].hold) setHeld(action, true);
    else press(action);
    // Only swallow the browser's own meaning for keys we actually claimed. Blanket
    // preventDefault on every keydown breaks the rebinding UI and text entry.
    if (e.code === 'Space' || e.code === 'Tab') e.preventDefault();
  });

  addEventListener('keyup', e => {
    const action = actionFor(e.code);
    if (action && ACTIONS[action].hold) setHeld(action, false);
  });

  // continuous input is polled from the loop
  keyPoll = dt => {
    const st = S.stats || SHIP_CLASSES[S.player.classKey];
    let turning = false;

    const stick = pollGamepad(setHeld, press);

    // Digital first, then the analogue stick on top. A pad stick is proportional, so a
    // quarter deflection is a quarter of the turn rate — the keyboard cannot express
    // that and should not be made to.
    if (held.has('yawLeft'))  { S.player.yaw += st.turnRate * dt; turning = true; }
    if (held.has('yawRight')) { S.player.yaw -= st.turnRate * dt; turning = true; }
    if (held.has('pitchUp'))   { S.player.pitch = clamp(S.player.pitch + st.pitchRate * dt, -MAX_PITCH, MAX_PITCH); turning = true; }
    if (held.has('pitchDown')) { S.player.pitch = clamp(S.player.pitch - st.pitchRate * dt, -MAX_PITCH, MAX_PITCH); turning = true; }
    if (held.has('thrustUp'))   S.player.throttle = clamp(S.player.throttle + 0.6 * dt, -0.25, 1);
    if (held.has('thrustDown')) S.player.throttle = clamp(S.player.throttle - 0.6 * dt, -0.25, 1);

    if (stick) {
      if (stick.yaw) { S.player.yaw -= st.turnRate * stick.yaw * dt; turning = true; }
      if (stick.pitch) {
        S.player.pitch = clamp(S.player.pitch - st.pitchRate * stick.pitch * dt, -MAX_PITCH, MAX_PITCH);
        turning = true;
      }
      if (stick.throttle) S.player.throttle = clamp(S.player.throttle - 0.6 * stick.throttle * dt, -0.25, 1);
    }

    if (turning) S.input.turning = true;
  };
}

export let keyPoll = () => {};

/**
 * Show the chip only when the fit has guns in more than one group, and keep the FIRE label
 * honest about which trigger is live. Called on fit changes as well as on taps — a pilot
 * who splits their rack in the fit screen should come out of it with the control already
 * there, not on the next time something else happened to refresh.
 */
export function refreshGroupChip() {
  const chip = $('group-chip');
  if (!chip) return;
  const split = hasSplit();
  chip.classList.toggle('hidden', !split);
  chip.innerHTML = `GRP <b>${activeLabel()}</b>`;
  // The label carries its own id rather than being found by tag under the button: the
  // fire control is a fixed piece of markup, and a query that walks it is a query that
  // breaks the first time somebody adds a second span in there.
  const label = $('fire-label');
  if (label) label.textContent = split && activeLabel() !== 'ALL' ? `FIRE ${activeLabel()}` : 'FIRE';
}
