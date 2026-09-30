# js/bodygen/grower.js

[index](../../../README.md) · 130 lines · 22 symbols · 1 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — asking for a grown body.

`grow(key, opts)` returns a promise of a growBaked() result, grown in a
worker (js/bodygen/worker.js) — or, where there is no worker (node, a browser
that refuses the module worker, or a worker that failed to boot), grown on
this thread, one per `pump()` so a burst of requests is still spread across
frames. Results are cached by key: rocks are deterministic, so a body grown
once is right for the session, and flying back past a rock does not grow it
twice.

Priority is by request order within a small queue; a request for a key that
is already waiting is not queued twice.

- L4 · `const cache = new Map();` — key → result (LRU by re-insertion)
- L5 · `const pending = new Map();` — key → { promise, resolve, reject, opts }
- L6 · `const queue = [];` — keys waiting for a worker or the main-thread pump
- L8 · `let workerState = "none";` — none | booting | ready | dead
- L10 · `const inflight = new Map();` — message id → key
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./body.js` | `growBaked` | [js/bodygen/body.js](body.js.md) |

## Imported by

- [js/render/engine.js](../render/engine.js.md) — `grow`, `peek`, `pump`, `cancel`, `growerStats`

## Exports

- [`growerStats`](#s-growerStats) · const — used by [js/render/engine.js](../render/engine.js.md)
- [`peek`](#s-peek) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`grow`](#s-grow) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`isPending`](#s-isPending) · function — **no importer in scanned roots**
- [`cancel`](#s-cancel) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`pump`](#s-pump) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`resetGrower`](#s-resetGrower) · function — **no importer in scanned roots**

## Effects

- **event.handler** — `worker.onmessage` (boot:22) · `worker.onerror` (boot:37)
- **net.Worker** — `./worker.js` (boot:19)
- **net.postMessage** — `worker` (drain:67)
- **timer** — `setTimeout` (boot:21)

## Symbols

### <a id="s-CACHE_CAP"></a>`CACHE_CAP`

const · L3–3

<!-- note:CACHE_CAP -->
<!-- /note -->

### <a id="s-cache"></a>`cache`

const · L4–4

<!-- note:cache -->
<!-- /note -->

### <a id="s-pending"></a>`pending`

const · L5–5

<!-- note:pending -->
<!-- /note -->

### <a id="s-queue"></a>`queue`

const · L6–6

<!-- note:queue -->
<!-- /note -->

### <a id="s-worker"></a>`worker`

const · L7–7

<!-- note:worker -->
<!-- /note -->

### <a id="s-workerState"></a>`workerState`

const · L8–8

<!-- note:workerState -->
<!-- /note -->

### <a id="s-busy"></a>`busy`

const · L9–9

<!-- note:busy -->
<!-- /note -->

### <a id="s-inflight"></a>`inflight`

const · L10–10

<!-- note:inflight -->
<!-- /note -->

### <a id="s-seq"></a>`seq`

const · L11–11

<!-- note:seq -->
<!-- /note -->

### <a id="s-growerStats"></a>`growerStats`

const · **exported** · L13–13

<!-- note:growerStats -->
<!-- /note -->

#### <a id="s-growerStats-state"></a>`growerStats.state()`

prop · L13–13

<!-- note:growerStats.state -->
<!-- /note -->

#### <a id="s-growerStats-queued"></a>`growerStats.queued()`

prop · L13–13

<!-- note:growerStats.queued -->
<!-- /note -->

### <a id="s-boot"></a>`boot()`

function · L15–41

- calls: [`die`](#s-die) ×3 · [`drain`](#s-drain) ×2 · [`finish`](#s-finish)
- called by: [`grow`](#s-grow)
- effects: net.Worker `./worker.js` · timer `setTimeout` · event.handler `worker.onmessage` · event.handler `worker.onerror`

<!-- note:boot -->
- L21 · `setTimeout(() => { if (workerState === "booting") { console.warn("grower worker did not bo` — a worker that never says ready (a blocked fetch, a CSP) must not stall growth forever
<!-- /note -->

### <a id="s-die"></a>`die()`

function · L43–50

- called by: [`boot`](#s-boot) ×3

<!-- note:die -->
- L45 · `try { worker?.terminate(); } catch {` — already gone
- L48 · `for (const key of inflight.values()) if (pending.has(key) && !queue.includes(key)) queue.u` — anything the worker was holding goes back on the queue for the pump
<!-- /note -->

### <a id="s-finish"></a>`finish(key, d)`

function · L52–56

- called by: [`boot`](#s-boot) · [`pump`](#s-pump)

<!-- note:finish -->
<!-- /note -->

### <a id="s-drain"></a>`drain()`

function · L58–69

- called by: [`boot`](#s-boot) ×2 · [`grow`](#s-grow)
- effects: net.postMessage `worker`

<!-- note:drain -->
<!-- /note -->

### <a id="s-peek"></a>`peek(key)`

function · **exported** · L71–75

- called by: [`mountGame>impactorBody`](../render/engine.js.md#s-mountGame-impactorBody) _js/render/engine.js_ · [`mountGame>shapeFor`](../render/engine.js.md#s-mountGame-shapeFor) _js/render/engine.js_

<!-- note:peek -->
A grown body for `key`, cached, or null while it is still growing (the request is filed).
<!-- /note -->

### <a id="s-grow"></a>`grow(key, opts)`

function · **exported** · L77–90

- calls: [`boot`](#s-boot) · [`drain`](#s-drain)
- called by: [`mountGame`](../render/engine.js.md#s-mountGame) _js/render/engine.js_ · [`mountGame>impactorBody`](../render/engine.js.md#s-mountGame-impactorBody) _js/render/engine.js_ · [`mountGame>shapeFor`](../render/engine.js.md#s-mountGame-shapeFor) _js/render/engine.js_

<!-- note:grow -->
File a request. Resolves to the growBaked() result.
<!-- /note -->

### <a id="s-isPending"></a>`isPending(key)`

function · **exported** · L92–94

<!-- note:isPending -->
<!-- /note -->

### <a id="s-cancel"></a>`cancel(keep)`

function · **exported** · L96–104

- called by: [`mountGame>updateAsteroids`](../render/engine.js.md#s-mountGame-updateAsteroids) _js/render/engine.js_ ×2

<!-- note:cancel -->
Drop queued requests nobody wants any more (a rock you flew away from before it grew).
<!-- /note -->

### <a id="s-pump"></a>`pump(bootGrace=)`

function · **exported** · L106–123

- calls: [`growBaked`](body.js.md#s-growBaked) _js/bodygen/body.js_ · [`finish`](#s-finish)
- called by: [`mountGame>updateAsteroids`](../render/engine.js.md#s-mountGame-updateAsteroids) _js/render/engine.js_

<!-- note:pump -->
The main-thread path: grow at most one queued body. Call once a frame. A
no-op while a worker is serving (or still booting — give it a moment).
<!-- /note -->

### <a id="s-resetGrower"></a>`resetGrower()`

function · **exported** · L125–130

<!-- note:resetGrower -->
For the tests and a relaunch: forget every grown body.
<!-- /note -->
