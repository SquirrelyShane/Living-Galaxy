/* LIVING GALAXY — the canopy, edge to edge.
 *
 * On a phone the game was drawing inside a window with a status bar over it and
 * a gesture bar under it: two strips of someone else's UI across a cockpit that
 * is supposed to BE the screen. One UI has no system-wide switch for that — the
 * Samsung threads all end in a workaround — so it is the page's job to ask.
 *
 * Two routes, and the game wants both:
 *
 *   1. The Fullscreen API. Chromium on Android hides BOTH bars for a page in
 *      fullscreen. It must be asked for from a real user gesture — a tap
 *      handler, never a timer and never on load — or the promise rejects and
 *      (on some builds) the tab is marked as having tried, so we only ever call
 *      it from a pointer event.
 *
 *   2. Installed to the home screen with `display: "fullscreen"` in the
 *      manifest, which comes up immersive with no bars and no address bar and
 *      no tap at all. That is the better experience, so when the game is
 *      ALREADY running that way the toggle takes itself off the HUD rather than
 *      offering a button that would do nothing.
 *
 * Two things ride along with fullscreen because they are only available there,
 * or only matter there:
 *
 *   ORIENTATION. `screen.orientation.lock()` is specified to work only while
 *   fullscreen, so the portrait lock is taken on the way in and dropped on the
 *   way out. It rejects flat on desktop Chromium and on iOS; that is fine and
 *   is not reported.
 *
 *   WAKE LOCK. A long burn or a mining run has no touches in it, so the panel
 *   dims and then sleeps in the middle of the thing you are watching. The lock
 *   is taken with fullscreen and released with it, and — this is the part that
 *   is easy to miss — it is dropped by the browser whenever the page is
 *   backgrounded, so it has to be RE-taken on visibilitychange or it silently
 *   stops working the first time you check a message.
 *
 * The re-layout matters as much as the bars. The HUD measures itself from
 * `visualViewport` (js/hud.js) and the chart plot sizes itself from a
 * `getBoundingClientRect`, so a bar leaving mid-session changes the viewport
 * under a layout that has already been computed. Android animates the bars out
 * over a few hundred ms, and the `fullscreenchange` event fires at the START of
 * that, so one resize on the event measures the OLD height. We nudge three
 * times across the animation instead — cheap, and the alternative is a HUD that
 * is wrong until something else happens to resize it.
 *
 * Leaf module: DOM and storage only, no sim import, so a test can drive it.
 */

const DOC = globalThis.document ?? null;
const WIN = globalThis.window ?? null;

/** Device key — filed in js/profile.js. Belongs to the machine, not the pilot. */
export const FULLSCREEN_KEY = "lgaa.fullscreen";

export const fullscreen = {
  on: false,          // the page is fullscreen right now
  wanted: false,      // the pilot asked for it and it should be restored
  wake: null,         // the WakeLockSentinel, while we hold one
  lastError: "",      // why the last request failed, for the panel
  changes: 0,         // how many times we have gone in or out (tests)
};

/* ---- what the platform gives us ------------------------------------------ */

const fsElement = () => DOC?.fullscreenElement ?? DOC?.webkitFullscreenElement ?? null;

/** Is the Fullscreen API here at all? iOS Safari on iPhone has no element-level one. */
export function fullscreenSupported() {
  const root = DOC?.documentElement;
  return Boolean(root && (root.requestFullscreen || root.webkitRequestFullscreen));
}

/**
 * How the game is being displayed: "fullscreen" and "standalone" mean it was
 * launched from an installed icon, "browser" means it is a tab. Only the tab
 * case wants a toggle on the HUD — the other two are already immersive, or as
 * immersive as the install allows.
 */
export function immersiveMode() {
  if (!WIN?.matchMedia) return "browser";
  for (const m of ["fullscreen", "standalone", "minimal-ui"]) {
    if (WIN.matchMedia(`(display-mode: ${m})`).matches) return m;
  }
  return "browser";
}

export const isFullscreen = () => Boolean(fsElement());

/* ---- the screen stays awake ---------------------------------------------- */

async function takeWakeLock() {
  if (fullscreen.wake || !globalThis.navigator?.wakeLock) return;
  try {
    fullscreen.wake = await globalThis.navigator.wakeLock.request("screen");
    fullscreen.wake.addEventListener?.("release", () => { fullscreen.wake = null; });
  } catch { /* denied, low battery, or not in a secure context — not worth a notice */ }
}

async function dropWakeLock() {
  const w = fullscreen.wake;
  fullscreen.wake = null;
  try { await w?.release(); } catch { /* already gone */ }
}

/* ---- going in and out ----------------------------------------------------- */

/**
 * Ask for fullscreen. MUST be called from inside a user-gesture handler.
 * → { ok } | { ok: false, why }
 */
export async function enterFullscreen() {
  const root = DOC?.documentElement;
  if (!root) return { ok: false, why: "no document" };
  if (isFullscreen()) { await afterEnter(); return { ok: true }; }
  if (!fullscreenSupported()) {
    fullscreen.lastError = "This browser has no fullscreen for pages. Install the game to your home screen instead.";
    return { ok: false, why: fullscreen.lastError };
  }
  try {
    /* navigationUI:"hide" is the ask for the gesture bar as well as the status
     * bar; browsers that do not know the option ignore it rather than throw. */
    const p = root.requestFullscreen
      ? root.requestFullscreen({ navigationUI: "hide" })
      : root.webkitRequestFullscreen();
    await p;
  } catch (e) {
    /* Almost always "API can only be initiated by a user gesture". */
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
  try { await globalThis.screen?.orientation?.lock?.("portrait"); } catch { /* desktop / iOS */ }
}

export async function exitFullscreen({ remember = true } = {}) {
  if (remember) { fullscreen.wanted = false; save(); }
  try { globalThis.screen?.orientation?.unlock?.(); } catch { /* never mind */ }
  await dropWakeLock();
  if (!isFullscreen()) return { ok: true };
  try { await (DOC.exitFullscreen ? DOC.exitFullscreen() : DOC.webkitExitFullscreen()); } catch { /* already out */ }
  return { ok: true };
}

/** The HUD button. From a gesture, so it may enter. */
export async function toggleFullscreen() {
  return isFullscreen() ? exitFullscreen() : enterFullscreen();
}

/* ---- storage -------------------------------------------------------------- */

function save() {
  try { globalThis.localStorage?.setItem(FULLSCREEN_KEY, fullscreen.wanted ? "on" : "off"); } catch { /* private mode */ }
}

function load() {
  try { return globalThis.localStorage?.getItem(FULLSCREEN_KEY) === "on"; } catch { return false; }
}

/* ---- the re-layout -------------------------------------------------------- */

/**
 * Tell the HUD the viewport moved. Android animates the bars away over roughly
 * a quarter-second and fires `fullscreenchange` at the start of it, so a single
 * measurement here reads the height we are leaving, not the one we are going
 * to. Three nudges across the animation costs nothing and is always right by
 * the end of it.
 */
function relayout() {
  if (!WIN) return;
  const fire = () => WIN.dispatchEvent(new Event("resize"));
  fire();
  WIN.requestAnimationFrame?.(fire);
  WIN.setTimeout(fire, 140);
  WIN.setTimeout(fire, 420);
}

/* ---- wiring --------------------------------------------------------------- */

/**
 * Wire the HUD toggle.
 *
 * `button` is the element; `onChange(on)` is called after every transition so
 * the HUD can repaint the chip. Returns a `paint()` the HUD may call itself.
 */
export function mountFullscreen({ button = null, onChange = null } = {}) {
  if (!DOC) return { paint: () => {} };
  fullscreen.wanted = load();
  fullscreen.on = isFullscreen();

  const installed = immersiveMode() !== "browser";
  /* Launched from the home-screen icon: there are no bars to hide and the
   * button would be a no-op, so it comes off the strip entirely. */
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

  /* The wake lock is dropped by the browser every time the page is hidden.
   * Take it again on the way back, or it quietly stops working after the
   * first notification the pilot reads. */
  DOC.addEventListener("visibilitychange", () => {
    if (DOC.visibilityState === "visible" && isFullscreen()) takeWakeLock();
  });

  /* Asked for last time? We cannot enter without a gesture, so latch ONE: the
   * next tap anywhere puts the canopy back where the pilot left it. Capture
   * phase and passive, so it never eats the tap that the game wanted. */
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
