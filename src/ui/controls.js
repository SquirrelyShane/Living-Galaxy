// Living Galaxy — input. Pointer events cover mouse and touch in one path;
// keys are a convenience for desktop testing.
//
// Pitch is drag-only now. The old edge slider cost 48 px of canopy and duplicated
// what a vertical drag already does; LEVEL moved into the tool column, and the
// number lives beside the crosshair where the eye already is.

import { S, recalcStats } from '../core/state.js';
import { ACTIONS, actionFor, pollGamepad } from '../systems/platform/input.js';
import { openSettings, closeSettings, isOpen as isSettingsOpen } from './settings.js';
import { SHIP_CLASSES, MAX_PITCH } from '../core/config.js';
import { $, clamp } from '../core/utils.js';
import { toggleWarp } from '../systems/flight/warp.js';
import { cycleTarget, clearTarget, setTarget } from '../systems/flight/targeting.js';
import { pickMarker } from './markers.js';
import { yieldAutopilot, toggleAutopilot } from '../systems/npc/autopilot.js';
import { dock, undock } from '../systems/trade/economy.js';
import { saveGame } from '../systems/platform/save.js';
import { openNavmap } from './navmap.js';
import { openAria } from './aria.js';
import { openDossier } from './dossier.js';
import { openGalaxyMap } from './galaxymap.js';
import { openFit } from './fitting.js';
import { openCrew } from './crew.js';
import { openDock, dockOpen, closeDock } from './dock.js';
import { sfx, resumeAudio, setAudioEnabled, startMusic } from '../systems/platform/audio.js';
import { cycleActive, activeLabel, hasSplit } from '../systems/combat/groups.js';
import { throttleLocked, togglePanels } from '../systems/industry/habitat.js';
import { warpButton, initWarpMenu, closeWarpMenu, warpMenuOpen } from './warpmenu.js';
import { initContact, openContact, contactOpen } from './contact.js';
import { toast } from './toast.js';
import { canPilot } from '../systems/company/career.js';

const DRAG_GAIN = 0.0042;

function breakAutopilot() {
  // Manual input always wins. Approach, orbit hold and velocity-match all yield — and, since
  // v1.02.58, so does ARIA. She hands the stick back the instant a finger lands on anything
  // rather than fighting for it: there is no state in which the player is pushing against
  // something invisible, which is the failure mode every autopilot in every game has.
  yieldAutopilot();
  if (S.approach) S.approach = null;
  if (S.orbit) S.orbit = null;
  if (S.follow) S.follow = null;
}

export function initControls() {
  steering();
  throttleControl();

  document.querySelectorAll('.preset-btn').forEach(b => {
    b.addEventListener('click', () => {
      breakAutopilot();
      setThrottle(parseFloat(b.dataset.pct) / 100);
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

  // The warp button opens a menu now — how close to arrive, and whether to talk to the
  // thing first. Mid-flight it still just drops out; see `warpButton` for why.
  tap($('warp-btn'), warpButton);
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
  // Your own file. Deliberately reachable from the flight HUD and not only from the
  // office deck: standing and the career ladder are what every career is climbing, and
  // a pilot who has to dock to see the gate they are working toward will not look.
  tap($('btn-file'), () => openDossier());
  tap($('btn-chart'), () => openGalaxyMap());

  keys();
}

// ── the throttle ─────────────────────────────────────────────────────
//
// The old control was an absolute slider: wherever your finger landed on a 13-pixel-tall
// bar was the throttle, immediately. On a phone that bar is about 180 px wide and covers
// -25% to 100%, so one percent is a pixel and a half — and a thumb does not land where a
// thumb thinks it lands. Aiming at 15 gave you 0 or 28, every time, because the contact
// patch is a centimetre across and the *reported* point drifts toward the middle of it.
//
// Three things fix that, and they are different fixes for different problems:
//
//   - **Detents.** Every set snaps to 5%. This alone removes "I got 13 when I wanted 15";
//     the values a pilot actually wants are all multiples of five.
//   - **Relative drag.** Grabbing the thumb moves the throttle by how far the thumb moves,
//     so the value does not jump to the finger on contact. Tapping the bar away from the
//     thumb still jumps — that is the fast gross move, and it is snapped.
//   - **Steppers.** ± 5% per press, repeating on hold. The only control here that needs no
//     precision whatsoever, which is what you want at 3% while trying to hold a rock.
//
// Dragging away from the bar vertically drops the gain to a quarter and the detent to 1%,
// which is the standard scrubbing gesture and costs nothing when nobody uses it.

const THR_MIN = -0.25, THR_MAX = 1, THR_SPAN = THR_MAX - THR_MIN;
const DETENT = 0.05, FINE_DETENT = 0.01;
const FINE_AT = 46;        // px of vertical travel before the fine gain engages
const GRAB_PX = 26;        // how close to the thumb counts as grabbing it

/**
 * Set the throttle, snapped to `step`.
 *
 * Exported because it is now the single write to `S.player.throttle` from the interface —
 * the presets, the track, the steppers and ARIA's `throttle` tool all come through here, so
 * the detent rule and the preset highlight cannot disagree about what the throttle is.
 */
export function setThrottle(v, step = DETENT) {
  // Arrays out means the drive is locked. Refused here with a reason rather than accepted
  // and then silently zeroed by the next habitat tick: a slider that moves and springs back
  // reads as a bug, and a slider that will not move without saying why reads as a machine.
  if (throttleLocked() && Math.abs(v) > 0.001) {
    toast('Solar arrays deployed — the drive is locked out');
    return S.player.throttle;
  }
  const q = step ? Math.round(v / step) * step : v;
  S.player.throttle = clamp(Math.round(q * 1000) / 1000, THR_MIN, THR_MAX);
  markPreset();
  return S.player.throttle;
}

/** Light the preset that matches exactly, and no other. */
function markPreset() {
  const pct = Math.round(S.player.throttle * 100);
  document.querySelectorAll('.preset-btn').forEach(b =>
    b.classList.toggle('active', parseFloat(b.dataset.pct) === pct));
}

function throttleControl() {
  const track = $('speed-track'), fine = $('speed-fine');
  stepper($('thr-down'), -1);
  stepper($('thr-up'), +1);
  if (!track) return;

  let id = null, grab = null;

  track.addEventListener('pointerdown', e => {
    if (id !== null) return;
    id = e.pointerId;
    try { track.setPointerCapture(id); } catch (_) {}
    breakAutopilot();
    const rect = track.getBoundingClientRect();
    const thumbX = rect.left + ((S.player.throttle - THR_MIN) / THR_SPAN) * rect.width;
    if (Math.abs(e.clientX - thumbX) > GRAB_PX) {
      // Away from the thumb: a deliberate jump, and it still lands on a detent.
      setThrottle(THR_MIN + ((e.clientX - rect.left) / rect.width) * THR_SPAN);
    }
    // Either way, what follows is relative to where the value is *now* — so a jump followed
    // by a drag adjusts from the value you just set rather than re-jumping to the finger.
    grab = { x: e.clientX, y: e.clientY, v: S.player.throttle, rect };
    track.classList.add('grabbed');
    e.preventDefault();
  });

  track.addEventListener('pointermove', e => {
    if (e.pointerId !== id || !grab) return;
    const fineMode = Math.abs(e.clientY - grab.y) > FINE_AT;
    if (fine) fine.classList.toggle('hidden', !fineMode);
    const gain = fineMode ? 0.25 : 1;
    const dv = ((e.clientX - grab.x) / Math.max(grab.rect.width, 1)) * THR_SPAN * gain;
    setThrottle(grab.v + dv, fineMode ? FINE_DETENT : DETENT);
  });

  const end = e => {
    if (e.pointerId !== id) return;
    id = null; grab = null;
    track.classList.remove('grabbed');
    if (fine) fine.classList.add('hidden');
  };
  track.addEventListener('pointerup', end);
  track.addEventListener('pointercancel', end);
}

/** ± one detent per press, repeating while held. */
function stepper(node, dir) {
  if (!node) return;
  let id = null, delay = null, timer = null;
  const bump = () => { breakAutopilot(); setThrottle(S.player.throttle + dir * DETENT); };
  const start = e => {
    if (id !== null) return;
    id = e.pointerId;
    try { node.setPointerCapture(id); } catch (_) {}
    bump();
    sfx.ui();
    // Repeat, but only after a pause long enough that a single tap is unambiguously a
    // single step. 90 ms thereafter is about eleven percent a second — fast enough to
    // cross the range, slow enough to stop where you meant to.
    delay = setTimeout(() => { timer = setInterval(bump, 90); }, 380);
    e.preventDefault();
  };
  const stop = () => {
    id = null;
    clearTimeout(delay); clearInterval(timer);
    delay = null; timer = null;
  };
  node.addEventListener('pointerdown', start);
  node.addEventListener('pointerup', stop);
  node.addEventListener('pointercancel', stop);
  node.addEventListener('pointerleave', stop);
}

// ── steering ─────────────────────────────────────────────────────────
function steering() {
  const canvas = $('game-canvas');
  let id = null, lx = 0, ly = 0, moved = 0, downX = 0, downY = 0;

  canvas.addEventListener('pointerdown', e => {
    if (id !== null || !canPilot()) return;
    id = e.pointerId; lx = e.clientX; ly = e.clientY;
    downX = e.clientX; downY = e.clientY; moved = 0;
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
    moved += Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly);
    lx = e.clientX; ly = e.clientY;
  });
  const end = e => {
    if (e.pointerId !== id) return;
    id = null;
    S.input.dragging = false;
    // A tap that never became a drag is a selection. The canopy keeps the pointer — see the
    // header of ui/markers.js for why the bracket overlay does not take one — so this is
    // where a tap gets offered to it. Anything the sensor can see and the screen is showing
    // is lockable by pointing at it, which is the whole reason the brackets exist.
    if (moved < 10) tapCanopy(e);
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  function tapCanopy(e) {
    const hit = pickMarker(e.clientX == null ? downX : e.clientX,
                           e.clientY == null ? downY : e.clientY);
    if (!hit) return;
    // Re-tapping what is already locked drops it, exactly like the contact list.
    if (S.target && S.target.obj === hit.obj) clearTarget();
    else setTarget(hit.obj, hit.kind, hit.name, hit.faction);
  }
}

// ── widget helpers ───────────────────────────────────────────────────
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

  // What a career with no flight licence may still press. The chart, the fit bench and
  // the crew roster are all readable from a desk; the drive, the stick and the docking
  // clamps are not. Listed as an allow-list rather than a set of `if (canPilot())` guards
  // scattered through the switch, so the next action added has to make a decision.
  const GROUNDED_OK = new Set(['navmap', 'fitting', 'crew', 'settings']);   // not 'autopilot': no hull, no stick to take

  const press = (action) => {
    if (!canPilot() && !GROUNDED_OK.has(action)) return;
    switch (action) {
      case 'warp': toggleWarp(); break;
      case 'navmap': openNavmap(); break;
      case 'fitting': openFit(); break;
      case 'crew': openCrew(); break;
      case 'target': cycleTarget(); break;
      case 'cutThrottle': S.player.throttle = 0; break;
      case 'panels': togglePanels(); break;
      case 'level': S.player.autoLevel = true; break;
      case 'dock':
        // While docked and looking outside, the same binding returns to the station UI.
        // This is the recovery path if the HUD return button is missed.
        if (S.docked) { openDock(); break; }
        if (dock()) openDock();
        break;
      case 'settings': isSettingsOpen() ? closeSettings() : openSettings(); break;
      case 'autopilot': toggleAutopilot(); break;
    }
  };

  const setHeld = (action, on) => {
    if (!canPilot()) return;
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
    // Keys reach the game whether or not a canopy is on screen. A hidden flight HUD is
    // not a lock — without this, an executive holding W on a desktop keyboard still
    // opens the throttle on a hull they do not own.
    if (!canPilot()) return;
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
