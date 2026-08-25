// Living Galaxy — input bindings and gamepad.
//
// Every control was hard-coded into a switch statement: WASD to fly, Space to fire, and
// no way to change any of it. That is fine until someone is on an AZERTY keyboard, or
// flies left-handed, or physically cannot hold Space and Tab at once — at which point the
// game is simply not playable and there is nothing they can do about it.
//
// Actions are named here and bound to keys. `controls.js` asks "is `fire` down" rather
// than "is Space down", so a rebind is a data change and cannot break a code path. The
// same action table serves the gamepad, which is why adding one turned out to be small:
// a stick and a button are just another way to assert an action.

import { S } from '../../core/state.js';

/** The verbs the game understands. Order is the order the rebinding UI lists them. */
export const ACTIONS = {
  thrustUp:   { name: 'Throttle up',    hold: true,  keys: ['KeyW'] },
  thrustDown: { name: 'Throttle down',  hold: true,  keys: ['KeyS'] },
  yawLeft:    { name: 'Yaw left',       hold: true,  keys: ['KeyA', 'ArrowLeft'] },
  yawRight:   { name: 'Yaw right',      hold: true,  keys: ['KeyD', 'ArrowRight'] },
  pitchUp:    { name: 'Pitch up',       hold: true,  keys: ['ArrowUp'] },
  pitchDown:  { name: 'Pitch down',     hold: true,  keys: ['ArrowDown'] },
  fire:       { name: 'Fire',           hold: true,  keys: ['Space'] },
  mine:       { name: 'Mining laser',   hold: true,  keys: ['KeyM'] },
  warp:       { name: 'Warp',           hold: false, keys: ['KeyJ'] },
  navmap:     { name: 'Nav map',        hold: false, keys: ['KeyN'] },
  fitting:    { name: 'Fitting bay',    hold: false, keys: ['KeyF'] },
  crew:       { name: 'Crew',           hold: false, keys: ['KeyC'] },
  target:     { name: 'Cycle target',   hold: false, keys: ['Tab'] },
  cutThrottle:{ name: 'Cut throttle',   hold: false, keys: ['KeyX'] },
  level:      { name: 'Level off',      hold: false, keys: ['KeyZ'] },
  dock:       { name: 'Dock',           hold: false, keys: ['KeyG'] },
  settings:   { name: 'Settings',       hold: false, keys: ['Escape'] },
  // ARIA's switch has a key because the switch itself is a 90-pixel target near the bottom
  // of a phone screen, and the one moment you most want to take the stick back is the one
  // moment you are least willing to look down for it. `breakAutopilot` already covers the
  // reflex — this is for turning her *on*.
  autopilot:  { name: 'Autopilot',      hold: false, keys: ['KeyP'] },
  // Arrays out / arrays in. A key rather than only a panel button because the moment you
  // want them *in* is the moment something has appeared on the array and you are already
  // reaching for the throttle that will not answer until they are home.
  panels:     { name: 'Solar arrays',   hold: false, keys: ['KeyU'] }
};
export const ACTION_KEYS = Object.keys(ACTIONS);

/** Gamepad layout. Standard mapping, so it is the same on every pad worth owning. */
export const PAD = {
  axes: { yaw: 0, pitch: 1, throttle: 3 },
  buttons: { 0: 'fire', 1: 'cutThrottle', 2: 'mine', 3: 'level',
             4: 'target', 5: 'warp', 8: 'settings', 9: 'navmap',
             12: 'pitchUp', 13: 'pitchDown', 14: 'yawLeft', 15: 'yawRight' },
  deadzone: 0.18,
  // A stick sitting at 0.19 should not creep the ship around. Rescaling past the
  // deadzone rather than clamping means fine control near centre is preserved instead
  // of jumping from nothing to a fifth of full deflection.
  rescale: true
};

export function defaultBindings() {
  const out = {};
  for (const k of ACTION_KEYS) out[k] = ACTIONS[k].keys.slice();
  return out;
}

export function bindings() {
  if (!S.settings.bindings) S.settings.bindings = defaultBindings();
  // Fill in actions added by a later build rather than leaving them unbound.
  for (const k of ACTION_KEYS) {
    if (!Array.isArray(S.settings.bindings[k])) S.settings.bindings[k] = ACTIONS[k].keys.slice();
  }
  return S.settings.bindings;
}

/** Reverse index: key code -> action. Rebuilt on change, not per keystroke. */
let index = null;
function keyIndex() {
  if (index) return index;
  index = new Map();
  const b = bindings();
  for (const a of ACTION_KEYS) for (const code of b[a]) index.set(code, a);
  return index;
}

export const actionFor = code => keyIndex().get(code) || null;

/**
 * Bind a key to an action. A key can only mean one thing, so binding it somewhere else
 * removes it from wherever it was — silently leaving a key bound to two actions is how
 * you get a control scheme nobody can debug.
 */
export function bind(action, code) {
  if (!ACTIONS[action] || !code) return false;
  const b = bindings();
  for (const a of ACTION_KEYS) b[a] = b[a].filter(c => c !== code);
  b[action].push(code);
  index = null;
  return true;
}

export function unbind(action, code) {
  const b = bindings();
  if (!b[action]) return false;
  b[action] = b[action].filter(c => c !== code);
  index = null;
  return true;
}

export function resetBindings() {
  S.settings.bindings = defaultBindings();
  index = null;
  return S.settings.bindings;
}

/** 'KeyW' -> 'W', 'ArrowLeft' -> '←'. The raw codes are unreadable on a button. */
export function keyLabel(code) {
  if (!code) return '—';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Arrow')) return { Up: '↑', Down: '↓', Left: '←', Right: '→' }[code.slice(5)] || code;
  if (code === 'Space') return 'SPC';
  return code;
}

// ── gamepad ──────────────────────────────────────────────────────────

const padState = { connected: false, id: null, buttons: [], axes: [0, 0, 0, 0] };
export const gamepad = () => padState;

function dead(v) {
  const a = Math.abs(v);
  if (a < PAD.deadzone) return 0;
  if (!PAD.rescale) return v;
  return Math.sign(v) * (a - PAD.deadzone) / (1 - PAD.deadzone);
}

/**
 * Poll the pad and translate it into the same action set the keyboard produces.
 * @param {function(string, boolean)} setAction called with (action, isDown)
 * @param {function(string)} tapAction called once per press for non-hold actions
 * @returns {{yaw:number, pitch:number, throttle:number}|null} analogue axes
 */
export function pollGamepad(setAction, tapAction) {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  if (!nav || !nav.getGamepads) return null;
  const pads = nav.getGamepads();
  let pad = null;
  for (let i = 0; i < pads.length; i++) if (pads[i] && pads[i].connected) { pad = pads[i]; break; }

  if (!pad) {
    if (padState.connected) { padState.connected = false; padState.id = null; }
    return null;
  }
  padState.connected = true;
  padState.id = pad.id;

  for (const idx in PAD.buttons) {
    const action = PAD.buttons[idx];
    const pressed = !!(pad.buttons[idx] && pad.buttons[idx].pressed);
    const was = !!padState.buttons[idx];
    padState.buttons[idx] = pressed;
    if (ACTIONS[action] && ACTIONS[action].hold) setAction(action, pressed);
    else if (pressed && !was) tapAction(action);      // edge, not level
  }

  const ax = pad.axes || [];
  const out = {
    yaw: dead(ax[PAD.axes.yaw] || 0),
    pitch: dead(ax[PAD.axes.pitch] || 0),
    throttle: dead(ax[PAD.axes.throttle] || 0)
  };
  padState.axes = [out.yaw, out.pitch, out.throttle];
  return out;
}
