# js/main.js

[index](../../README.md) · 35 lines · 3 symbols · 12 imports · 1 importers

## About

<!-- note:@file -->
0.3.27 — everything after the imports runs inside the guard, so a failure
while mounting is reported in the page rather than into a console nobody on
a phone is looking at. A link error in the imports above never reaches here
(the module does not run at all) — index.html's inline watchdog catches
that one and calls the same reporter.

- L6 · `import "./crew/deckmind.js";` — Side-effect import: deckmind registers itself on the crew pay cycle, so the
  hands aboard live their own lives whether or not the CONSOLE is ever opened.
  It reaches the same modules the console does; importing it here means the
  crew do not start thinking only once you look at them.
- L28 · `mountAccount({` — 0.3.40 — the account: probes for living-galaxy.com behind this origin and,
  when it is there, keeps the pilot's storage namespace synced to it. Wired
  last so its hidden-tab flush runs after every module's own.
- L32 · `document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hi` — 0.3.41 — the wallet and the survey log are written when the tab goes to
  the background, on every host: the account flush above only runs with a
  site behind the origin, and a phone switching apps is the common case.
- L34 · `globalThis.__lgBooted = true;` — the watchdog stands down once the game is actually up
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./core/store.js` | `loadSave`, `randomCallsign`, `useGameStore` | [js/core/store.js](core/store.js.md) |
| 2 | `./audio/index.js` | `setAudioMuted` | [js/audio/index.js](audio/index.js.md) |
| 3 | `./world/bodies.js` | `PUBLIC_ROOM` | [js/world/bodies.js](world/bodies.js.md) |
| 4 | `./ui/hud.js` | `mountHud` | [js/ui/hud.js](ui/hud.js.md) |
| 5 | `./render/engine.js` | `mountGame` | [js/render/engine.js](render/engine.js.md) |
| 6 | `./crew/deckmind.js` | _side effect_ | [js/crew/deckmind.js](crew/deckmind.js.md) |
| 7 | `./core/addon-loader.js` | _side effect_ | [js/core/addon-loader.js](core/addon-loader.js.md) |
| 8 | `./core/boot.js` | `guard` | [js/core/boot.js](core/boot.js.md) |
| 9 | `./net/account.js` | `mountAccount` | [js/net/account.js](net/account.js.md) |
| 10 | `./corp/company.js` | `flushCompany` | [js/corp/company.js](corp/company.js.md) |
| 11 | `./sim/sim.js` | `sim`, `persistNow` | [js/sim/sim.js](sim/sim.js.md) |
| 12 | `./flight/pilot.js` | `pilot`, `title` | [js/flight/pilot.js](flight/pilot.js.md) |

## Imported by

- index.html _(outside js/)_ — `(entry)`

## Exports

_none_

## Effects

- **dom.id** — `view` (canvas:24)
- **event.listen** — `visibilitychange on document → (inline)` (@file:32) · `pagehide on window → (inline)` (@file:33)
- **global.write** — `globalThis.__lgBooted` (@file:34)

## Symbols

### <a id="s-saved"></a>`saved`

const · L15–15

- calls: [`loadSave`](core/store.js.md#s-loadSave) _js/core/store.js_

<!-- note:saved -->
<!-- /note -->

### <a id="s-canvas"></a>`canvas`

const · L24–24

- effects: dom.id `view`

<!-- note:canvas -->
<!-- /note -->

### <a id="s-meta"></a>`meta()`

prop · L29–29

- calls: [`title`](flight/pilot.js.md#s-title) _js/flight/pilot.js_
- via [js/core/store.js](core/store.js.md): `useGameStore.getState`

<!-- note:meta -->
<!-- /note -->

## Module-level calls

- calls: [`guard`](core/boot.js.md#s-guard) _js/core/boot.js_ · [`randomCallsign`](core/store.js.md#s-randomCallsign) _js/core/store.js_ · [`setAudioMuted`](audio/index.js.md#s-setAudioMuted) _js/audio/index.js_ · [`mountGame`](render/engine.js.md#s-mountGame) _js/render/engine.js_ · [`mountHud`](ui/hud.js.md#s-mountHud) _js/ui/hud.js_ · [`mountAccount`](net/account.js.md#s-mountAccount) _js/net/account.js_ · [`persistNow`](sim/sim.js.md#s-persistNow) _js/sim/sim.js_
- via [js/core/store.js](core/store.js.md): `useGameStore.setState`
