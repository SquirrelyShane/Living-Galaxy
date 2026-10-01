const DOC = globalThis.document ?? null;
const WIN = globalThis.window ?? null;

export const FULLSCREEN_KEY = "lgaa.fullscreen";

export const fullscreen = {
  on: false,
  wanted: false,
  wake: null,
  lastError: "",
  changes: 0,
};

const fsElement = () => DOC?.fullscreenElement ?? DOC?.webkitFullscreenElement ?? null;

export function fullscreenSupported() {
  const root = DOC?.documentElement;
  return Boolean(root && (root.requestFullscreen || root.webkitRequestFullscreen));
}

export function immersiveMode() {
  if (!WIN?.matchMedia) return "browser";
  for (const m of ["fullscreen", "standalone", "minimal-ui"]) {
    if (WIN.matchMedia(`(display-mode: ${m})`).matches) return m;
  }
  return "browser";
}

export const isFullscreen = () => Boolean(fsElement());

async function takeWakeLock() {
  if (fullscreen.wake || !globalThis.navigator?.wakeLock) return;
  try {
    fullscreen.wake = await globalThis.navigator.wakeLock.request("screen");
    fullscreen.wake.addEventListener?.("release", () => { fullscreen.wake = null; });
  } catch {}
}

async function dropWakeLock() {
  const w = fullscreen.wake;
  fullscreen.wake = null;
  try { await w?.release(); } catch {}
}

export async function enterFullscreen() {
  const root = DOC?.documentElement;
  if (!root) return { ok: false, why: "no document" };
  if (isFullscreen()) { await afterEnter(); return { ok: true }; }
  if (!fullscreenSupported()) {
    fullscreen.lastError = "This browser has no fullscreen for pages. Install the game to your home screen instead.";
    return { ok: false, why: fullscreen.lastError };
  }
  try {
    const p = root.requestFullscreen
      ? root.requestFullscreen({ navigationUI: "hide" })
      : root.webkitRequestFullscreen();
    await p;
  } catch (e) {
    fullscreen.lastError = String(e?.message ?? e);
    return { ok: false, why: fullscreen.lastError };
  }
  await afterEnter();
  return { ok: true };
}

async function afterEnter() {
  fullscreen.wanted = true;
  save();
  await takeWakeLock();
  try { globalThis.screen?.orientation?.unlock?.(); } catch {}
}

export async function exitFullscreen({ remember = true } = {}) {
  if (remember) { fullscreen.wanted = false; save(); }
  try { globalThis.screen?.orientation?.unlock?.(); } catch {}
  await dropWakeLock();
  if (!isFullscreen()) return { ok: true };
  try { await (DOC.exitFullscreen ? DOC.exitFullscreen() : DOC.webkitExitFullscreen()); } catch {}
  return { ok: true };
}

export async function toggleFullscreen() {
  return isFullscreen() ? exitFullscreen() : enterFullscreen();
}

function save() {
  try { globalThis.localStorage?.setItem(FULLSCREEN_KEY, fullscreen.wanted ? "on" : "off"); } catch {}
}

function load() {
  try { return globalThis.localStorage?.getItem(FULLSCREEN_KEY) === "on"; } catch { return false; }
}

function relayout() {
  if (!WIN) return;
  const fire = () => WIN.dispatchEvent(new Event("resize"));
  fire();
  WIN.requestAnimationFrame?.(fire);
  WIN.setTimeout(fire, 140);
  WIN.setTimeout(fire, 420);
}

export function mountFullscreen({ button = null, onChange = null } = {}) {
  if (!DOC) return { paint: () => {} };
  fullscreen.wanted = load();
  fullscreen.on = isFullscreen();

  const installed = immersiveMode() !== "browser";
  if (button && (installed || !fullscreenSupported())) button.classList.add("hidden");

  const paint = () => {
    if (!button) return;
    const on = isFullscreen();
    button.classList.toggle("on", on);
    button.textContent = on ? "◱" : "⛶";
    button.title = on ? "Leave fullscreen" : "Fullscreen — hide the phone's bars";
    button.setAttribute("aria-label", on ? "Leave fullscreen" : "Fullscreen");
  };

  button?.addEventListener("click", async () => {
    const r = await toggleFullscreen();
    if (!r.ok) onChange?.(false, r.why);
    paint();
  });

  const changed = () => {
    fullscreen.on = isFullscreen();
    fullscreen.changes++;
    if (!fullscreen.on) dropWakeLock();
    relayout();
    paint();
    onChange?.(fullscreen.on, "");
  };
  DOC.addEventListener("fullscreenchange", changed);
  DOC.addEventListener("webkitfullscreenchange", changed);

  DOC.addEventListener("visibilitychange", () => {
    if (DOC.visibilityState === "visible" && isFullscreen()) takeWakeLock();
  });

  if (fullscreen.wanted && !installed && fullscreenSupported() && !isFullscreen()) {
    const once = () => {
      DOC.removeEventListener("pointerdown", once, true);
      enterFullscreen();
    };
    DOC.addEventListener("pointerdown", once, true, { passive: true });
  }

  paint();
  return { paint };
}

export default mountFullscreen;
