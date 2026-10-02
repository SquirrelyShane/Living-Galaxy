# js/ui/fullscreen.js

[index](../../../README.md) · 153 lines · 23 symbols · 0 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — the canopy, edge to edge.

On a phone the game was drawing inside a window with a status bar over it and
a gesture bar under it: two strips of someone else's UI across a cockpit that
is supposed to BE the screen. One UI has no system-wide switch for that — the
Samsung threads all end in a workaround — so it is the page's job to ask.

Two routes, and the game wants both:

  1. The Fullscreen API. Chromium on Android hides BOTH bars for a page in
     fullscreen. It must be asked for from a real user gesture — a tap
     handler, never a timer and never on load — or the promise rejects and
     (on some builds) the tab is marked as having tried, so we only ever call
     it from a pointer event.

  2. Installed to the home screen with `display: "fullscreen"` in the
     manifest, which comes up immersive with no bars and no address bar and
     no tap at all. That is the better experience, so when the game is
     ALREADY running that way the toggle takes itself off the HUD rather than
     offering a button that would do nothing.

Two things ride along with fullscreen because they are only available there,
or only matter there:

  ORIENTATION. `screen.orientation.lock()` is specified to work only while
  fullscreen, so the portrait lock is taken on the way in and dropped on the
  way out. It rejects flat on desktop Chromium and on iOS; that is fine and
  is not reported.

  WAKE LOCK. A long burn or a mining run has no touches in it, so the panel
  dims and then sleeps in the middle of the thing you are watching. The lock
  is taken with fullscreen and released with it, and — this is the part that
  is easy to miss — it is dropped by the browser whenever the page is
  backgrounded, so it has to be RE-taken on visibilitychange or it silently
  stops working the first time you check a message.

The re-layout matters as much as the bars. The HUD measures itself from
`visualViewport` (js/ui/hud.js) and the chart plot sizes itself from a
`getBoundingClientRect`, so a bar leaving mid-session changes the viewport
under a layout that has already been computed. Android animates the bars out
over a few hundred ms, and the `fullscreenchange` event fires at the START of
that, so one resize on the event measures the OLD height. We nudge three
times across the animation instead — cheap, and the alternative is a HUD that
is wrong until something else happens to resize it.

Leaf module: DOM and storage only, no sim import, so a test can drive it.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/ui/hud.js](hud.js.md) — `mountFullscreen`

## Exports

- [`FULLSCREEN_KEY`](#s-FULLSCREEN_KEY) · const — **no importer in scanned roots**
- [`fullscreen`](#s-fullscreen) · const — **no importer in scanned roots**
- [`fullscreenSupported`](#s-fullscreenSupported) · function — **no importer in scanned roots**
- [`immersiveMode`](#s-immersiveMode) · function — **no importer in scanned roots**
- [`isFullscreen`](#s-isFullscreen) · function — **no importer in scanned roots**
- [`enterFullscreen`](#s-enterFullscreen) · function — **no importer in scanned roots**
- [`exitFullscreen`](#s-exitFullscreen) · function — **no importer in scanned roots**
- [`toggleFullscreen`](#s-toggleFullscreen) · function — **no importer in scanned roots**
- [`mountFullscreen`](#s-mountFullscreen) · function — used by [js/ui/hud.js](hud.js.md)
- `default` · Identifier — **no importer in scanned roots**

## Effects

- **event.dispatch** — `resize on WIN` (relayout>fire:96)
- **event.listen** — `release on fullscreen.wake → (inline)` (takeWakeLock:35) · `click on button → (inline)` (mountFullscreen:120) · `fullscreenchange on DOC → changed` (mountFullscreen:134) · `webkitfullscreenchange on DOC → changed` (mountFullscreen:135) · `visibilitychange on DOC → (inline)` (mountFullscreen:137) · `pointerdown on DOC → once` (mountFullscreen:146)
- **event.unlisten** — `pointerdown on DOC → once` (mountFullscreen>once:143)
- **storage.get** — `‹FULLSCREEN_KEY›` (load:91)
- **storage.set** — `‹FULLSCREEN_KEY›` (save:87)

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L1–1

<!-- note:DOC -->
<!-- /note -->

### <a id="s-WIN"></a>`WIN`

const · L2–2

<!-- note:WIN -->
<!-- /note -->

### <a id="s-FULLSCREEN_KEY"></a>`FULLSCREEN_KEY`

const · **exported** · L4–4

<!-- note:FULLSCREEN_KEY -->
Device key — filed in js/core/profile.js. Belongs to the machine, not the pilot.
<!-- /note -->

### <a id="s-fullscreen"></a>`fullscreen`

const · **exported** · L6–12

<!-- note:fullscreen -->
- L7 · `on: false,` — the page is fullscreen right now
- L8 · `wanted: false,` — the pilot asked for it and it should be restored
- L9 · `wake: null,` — the WakeLockSentinel, while we hold one
- L10 · `lastError: "",` — why the last request failed, for the panel
- L11 · `changes: 0,` — how many times we have gone in or out (tests)
<!-- /note -->

### <a id="s-fsElement"></a>`fsElement()`

function · L14–14

- called by: [`isFullscreen`](#s-isFullscreen)

<!-- note:fsElement -->
---- what the platform gives us ------------------------------------------
<!-- /note -->

### <a id="s-fullscreenSupported"></a>`fullscreenSupported()`

function · **exported** · L16–19

- called by: [`enterFullscreen`](#s-enterFullscreen) · [`mountFullscreen`](#s-mountFullscreen) ×2

<!-- note:fullscreenSupported -->
Is the Fullscreen API here at all? iOS Safari on iPhone has no element-level one.
<!-- /note -->

### <a id="s-immersiveMode"></a>`immersiveMode()`

function · **exported** · L21–27

- called by: [`mountFullscreen`](#s-mountFullscreen)

<!-- note:immersiveMode -->
How the game is being displayed: "fullscreen" and "standalone" mean it was
launched from an installed icon, "browser" means it is a tab. Only the tab
case wants a toggle on the HUD — the other two are already immersive, or as
immersive as the install allows.
<!-- /note -->

### <a id="s-isFullscreen"></a>`isFullscreen()`

function · **exported** · L29–29

- calls: [`fsElement`](#s-fsElement)
- called by: [`enterFullscreen`](#s-enterFullscreen) · [`exitFullscreen`](#s-exitFullscreen) · [`mountFullscreen`](#s-mountFullscreen) ×3 · [`mountFullscreen>changed`](#s-mountFullscreen-changed) · [`mountFullscreen>paint`](#s-mountFullscreen-paint) · [`toggleFullscreen`](#s-toggleFullscreen)

<!-- note:isFullscreen -->
<!-- /note -->

### <a id="s-takeWakeLock"></a>`takeWakeLock()`

function · async · L31–37

- called by: [`afterEnter`](#s-afterEnter) · [`mountFullscreen`](#s-mountFullscreen)
- effects: event.listen `release`

<!-- note:takeWakeLock -->
---- the screen stays awake ----------------------------------------------

- L36 · `} catch {` — denied, low battery, or not in a secure context — not worth a notice
<!-- /note -->

### <a id="s-dropWakeLock"></a>`dropWakeLock()`

function · async · L39–43

- called by: [`exitFullscreen`](#s-exitFullscreen) · [`mountFullscreen>changed`](#s-mountFullscreen-changed)

<!-- note:dropWakeLock -->
- L42 · `try { await w?.release(); } catch {` — already gone
<!-- /note -->

### <a id="s-enterFullscreen"></a>`enterFullscreen()`

function · async · **exported** · L45–64

- calls: [`afterEnter`](#s-afterEnter) ×2 · [`fullscreenSupported`](#s-fullscreenSupported) · [`isFullscreen`](#s-isFullscreen)
- called by: [`mountFullscreen>once`](#s-mountFullscreen-once) · [`toggleFullscreen`](#s-toggleFullscreen)

<!-- note:enterFullscreen -->
---- going in and out -----------------------------------------------------

Ask for fullscreen. MUST be called from inside a user-gesture handler.
→ { ok } | { ok: false, why }

- L54 · `const p = root.requestFullscreen` — navigationUI:"hide" is the ask for the gesture bar as well as the status
  bar; browsers that do not know the option ignore it rather than throw.
- L59 · `fullscreen.lastError = String(e?.message ?? e);` — Almost always "API can only be initiated by a user gesture".
<!-- /note -->

### <a id="s-afterEnter"></a>`afterEnter()`

function · async · L66–71

- calls: [`save`](#s-save) · [`takeWakeLock`](#s-takeWakeLock)
- called by: [`enterFullscreen`](#s-enterFullscreen) ×2

<!-- note:afterEnter -->
- L? · `try { await globalThis.screen?.orientation?.lock?.("portrait"); } catch {` — desktop / iOS
<!-- /note -->

### <a id="s-exitFullscreen"></a>`exitFullscreen({…}=)`

function · async · **exported** · L73–80

- calls: [`dropWakeLock`](#s-dropWakeLock) · [`isFullscreen`](#s-isFullscreen) · [`save`](#s-save)
- called by: [`toggleFullscreen`](#s-toggleFullscreen)

<!-- note:exitFullscreen -->
- L75 · `try { globalThis.screen?.orientation?.unlock?.(); } catch {` — never mind
- L78 · `try { await (DOC.exitFullscreen ? DOC.exitFullscreen() : DOC.webkitExitFullscreen()); } ca` — already out
<!-- /note -->

### <a id="s-toggleFullscreen"></a>`toggleFullscreen()`

function · async · **exported** · L82–84

- calls: [`enterFullscreen`](#s-enterFullscreen) · [`exitFullscreen`](#s-exitFullscreen) · [`isFullscreen`](#s-isFullscreen)
- called by: [`mountFullscreen`](#s-mountFullscreen)

<!-- note:toggleFullscreen -->
The HUD button. From a gesture, so it may enter.
<!-- /note -->

### <a id="s-save"></a>`save()`

function · L86–88

- called by: [`afterEnter`](#s-afterEnter) · [`exitFullscreen`](#s-exitFullscreen)
- effects: storage.set `‹FULLSCREEN_KEY›`

<!-- note:save -->
---- storage --------------------------------------------------------------

- L87 · `try { globalThis.localStorage?.setItem(FULLSCREEN_KEY, fullscreen.wanted ? "on" : "off");` — private mode
<!-- /note -->

### <a id="s-load"></a>`load()`

function · L90–92

- called by: [`mountFullscreen`](#s-mountFullscreen)
- effects: storage.get `‹FULLSCREEN_KEY›`

<!-- note:load -->
<!-- /note -->

### <a id="s-relayout"></a>`relayout()`

function · L94–101

- calls: [`relayout>fire`](#s-relayout-fire)
- called by: [`mountFullscreen>changed`](#s-mountFullscreen-changed)

<!-- note:relayout -->
---- the re-layout --------------------------------------------------------

Tell the HUD the viewport moved. Android animates the bars away over roughly
a quarter-second and fires `fullscreenchange` at the start of it, so a single
measurement here reads the height we are leaving, not the one we are going
to. Three nudges across the animation costs nothing and is always right by
the end of it.
<!-- /note -->

#### <a id="s-relayout-fire"></a>`relayout>fire()`

function · L96–96

- called by: [`relayout`](#s-relayout)
- effects: event.dispatch `resize`

<!-- note:relayout>fire -->
<!-- /note -->

### <a id="s-mountFullscreen"></a>`mountFullscreen({…}=)`

function · **exported** · L103–151

- calls: [`fullscreenSupported`](#s-fullscreenSupported) ×2 · [`immersiveMode`](#s-immersiveMode) · [`isFullscreen`](#s-isFullscreen) ×3 · [`load`](#s-load) · [`mountFullscreen.paint`](#s-mountFullscreen-paint) ×2 · [`takeWakeLock`](#s-takeWakeLock) · [`toggleFullscreen`](#s-toggleFullscreen)
- called by: [`mountHud`](hud.js.md#s-mountHud) _js/ui/hud.js_
- effects: event.listen `click` · event.listen `fullscreenchange` · event.listen `webkitfullscreenchange` · event.listen `visibilitychange` · event.listen `pointerdown`

<!-- note:mountFullscreen -->
---- wiring ---------------------------------------------------------------

Wire the HUD toggle.

`button` is the element; `onChange(on)` is called after every transition so
the HUD can repaint the chip. Returns a `paint()` the HUD may call itself.

- L109 · `if (button && (installed || !fullscreenSupported())) button.classList.add("hidden");` — Launched from the home-screen icon: there are no bars to hide and the
  button would be a no-op, so it comes off the strip entirely.
- L137 · `DOC.addEventListener("visibilitychange", () => {` — The wake lock is dropped by the browser every time the page is hidden.
  Take it again on the way back, or it quietly stops working after the
  first notification the pilot reads.
- L141 · `if (fullscreen.wanted && !installed && fullscreenSupported() && !isFullscreen()) {` — Asked for last time? We cannot enter without a gesture, so latch ONE: the
  next tap anywhere puts the canopy back where the pilot left it. Capture
  phase and passive, so it never eats the tap that the game wanted.
<!-- /note -->

#### <a id="s-mountFullscreen-paint"></a>`mountFullscreen.paint()`

prop · L104–104

- called by: [`mountFullscreen`](#s-mountFullscreen) ×2 · [`mountFullscreen>changed`](#s-mountFullscreen-changed)

<!-- note:mountFullscreen.paint -->
<!-- /note -->

#### <a id="s-mountFullscreen-paint-2"></a>`mountFullscreen>paint()`

function · L111–118

- calls: [`isFullscreen`](#s-isFullscreen)

<!-- note:mountFullscreen>paint -->
<!-- /note -->

#### <a id="s-mountFullscreen-changed"></a>`mountFullscreen>changed()`

function · L126–133

- calls: [`dropWakeLock`](#s-dropWakeLock) · [`isFullscreen`](#s-isFullscreen) · [`mountFullscreen.paint`](#s-mountFullscreen-paint) · [`relayout`](#s-relayout)

<!-- note:mountFullscreen>changed -->
<!-- /note -->

#### <a id="s-mountFullscreen-once"></a>`mountFullscreen>once()`

function · L142–145

- calls: [`enterFullscreen`](#s-enterFullscreen)
- effects: event.unlisten `pointerdown`

<!-- note:mountFullscreen>once -->
<!-- /note -->
