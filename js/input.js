/* LIVING GALAXY — input. Pan is aim, the slider is thrust, everything else is RCS. */

const GAME_CODES = new Set([
  "KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "KeyR", "KeyF", "KeyG",
  "KeyM", "KeyC", "KeyV", "KeyX", "KeyZ", "KeyT", "KeyY", "KeyB",
  "Space", "Tab", "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Escape",
  "BracketLeft", "BracketRight",
  "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0",
]);

const keys = new Set();
let injectedKeys = null;
let injectedPan = null;

/** Touch surface state, written by the cockpit HUD. */
export const touch = {
  panX: 0,      // left stick — camera/nose heading rate
  panY: 0,
  rcsX: 0,      // thruster cluster: right(+) / up(+) / forward(+)
  rcsY: 0,
  rcsZ: 0,
  throttle: 0,  // absolute slider value, -0.4 .. 1.4
  brake: false,
  fire: false,
  scanDown: false,
  warpDown: false,
  terminal: false,
};

/** Free-look drag on the canvas, consumed once per frame. */
export const lookDelta = { yaw: 0, pitch: 0 };

export function addLook(dx, dy) {
  lookDelta.yaw += -dx * 0.0034;
  lookDelta.pitch += -dy * 0.0028;
}

export function consumeLook() {
  const yaw = lookDelta.yaw;
  const pitch = lookDelta.pitch;
  lookDelta.yaw = 0;
  lookDelta.pitch = 0;
  return { yaw, pitch };
}

function emptyActions() {
  return {
    panX: 0, panY: 0,
    rcsX: 0, rcsY: 0, rcsZ: 0,
    throttleStep: 0,
    throttleZero: false,
    boost: false,
    cruise: false,
    brake: false,
    fire: false,
    scan: false,
    warp: false,
    map: false,
    pause: false,
    cam: false,
    timeUp: false,
    timeDown: false,
    tShields: false,
    tTurrets: false,
    tEngines: false,
    tLife: false,
    tGrav: false,
    tAssist: false,
    cycleTurret: false,
    cycleMining: false,
    terminal: false,
    select: null,
  };
}

const prev = emptyActions();
const curr = emptyActions();

function has(code) {
  if (injectedKeys) return injectedKeys.includes(code);
  return keys.has(code);
}

function radialDeadzone(x, y, dz = 0.16) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function bindInput(_target) {
  const typing = (e) => {
    const t = e.target;
    return Boolean(t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable));
  };
  const onDown = (e) => {
    if (typing(e)) return;
    if (e.repeat) {
      if (GAME_CODES.has(e.code)) e.preventDefault();
      return;
    }
    keys.add(e.code);
    if (GAME_CODES.has(e.code)) e.preventDefault();
  };
  /* a key pressed on the canvas and released in a text field must still let go */
  const onUp = (e) => {
    keys.delete(e.code);
  };
  const clear = () => keys.clear();
  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  window.addEventListener("blur", clear);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clear();
  });
  return () => {
    window.removeEventListener("keydown", onDown);
    window.removeEventListener("keyup", onUp);
    window.removeEventListener("blur", clear);
  };
}

export function sampleInput() {
  Object.assign(prev, curr);

  let panX = 0;
  let panY = 0;
  let rcsX = 0;
  let rcsY = 0;
  let rcsZ = 0;
  let step = 0;
  let padBrake = false;
  let padFire = false;

  /* WASD is the camera/nose: W up, S down, A left, D right. Arrows up/down
   * step the mains; R/F are the vertical thrusters; Q/E strafe. Shift is the
   * boost, Shift+Ctrl sets cruise (sim.js reads those). */
  if (has("KeyA") || has("ArrowLeft")) panX -= 1;
  if (has("KeyD") || has("ArrowRight")) panX += 1;
  if (has("KeyW")) panY += 1;
  if (has("KeyS")) panY -= 1;
  if (has("ArrowUp")) step += 1;
  if (has("ArrowDown")) step -= 1;
  if (has("KeyQ")) rcsX -= 1;
  if (has("KeyE")) rcsX += 1;
  if (has("KeyR")) rcsY += 1;
  if (has("KeyF")) rcsY -= 1;
  const shift = has("ShiftLeft") || has("ShiftRight");
  const ctrl = has("ControlLeft") || has("ControlRight");

  panX += touch.panX;
  panY += touch.panY;
  rcsX += touch.rcsX;
  rcsY += touch.rcsY;
  rcsZ += touch.rcsZ;

  const pads = typeof navigator !== "undefined" && navigator.getGamepads ? navigator.getGamepads() : [];
  for (const pad of pads) {
    if (!pad) continue;
    const l = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
    const r = radialDeadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0);
    panX += l.x;
    panY += -l.y;
    rcsX += r.x;
    rcsY += -r.y;
    step += (pad.buttons[7]?.value ?? 0) - (pad.buttons[6]?.value ?? 0);
    if (pad.buttons[0]?.pressed) padBrake = true;
    if (pad.buttons[1]?.pressed) padFire = true;
  }

  if (injectedPan !== null) {
    panX = injectedPan.x;
    panY = injectedPan.y;
  }

  curr.panX = clamp(panX, -1, 1);
  curr.panY = clamp(panY, -1, 1);
  curr.rcsX = clamp(rcsX, -1, 1);
  curr.rcsY = clamp(rcsY, -1, 1);
  curr.rcsZ = clamp(rcsZ, -1, 1);
  curr.throttleStep = clamp(step, -1, 1);
  curr.throttleZero = has("KeyX");
  curr.boost = shift && !ctrl;
  curr.cruise = shift && ctrl;
  curr.brake = has("Space") || touch.brake || padBrake;
  curr.fire = has("KeyZ") || touch.fire || padFire;
  curr.scan = has("KeyV") || touch.scanDown;
  curr.warp = has("KeyG") || touch.warpDown;
  curr.map = has("KeyM");
  curr.pause = has("Escape");
  curr.cam = has("KeyC");
  curr.timeUp = has("BracketRight");
  curr.timeDown = has("BracketLeft");
  curr.tShields = has("Digit1");
  curr.tTurrets = has("Digit2");
  curr.tEngines = has("Digit3");
  curr.tLife = has("Digit4");
  curr.tGrav = has("Digit5");
  curr.tAssist = has("Digit6");
  curr.cycleTurret = has("KeyT");
  curr.cycleMining = has("KeyY");
  curr.terminal = has("KeyB") || has("Tab") || touch.terminal;
  curr.select = null;
  for (let n = 7; n <= 9; n++) if (has(`Digit${n}`)) curr.select = n - 6;
  return curr;
}

export function justPressed(action) {
  return curr[action] === true && prev[action] !== true;
}

export function setInjectedKeys(codes) {
  injectedKeys = codes;
}

export function setInjectedPan(v) {
  injectedPan = v;
}

/* legacy test hook */
export function setInjectedSteer(v) {
  injectedPan = v === null ? null : { x: v, y: 0 };
}
