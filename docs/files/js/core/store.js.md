# js/core/store.js

[index](../../../README.md) · 222 lines · 20 symbols · 1 imports · 7 importers

## About

<!-- note:@file -->
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../world/bodies.js` | `BEACONS`, `PUBLIC_ROOM`, `surveyIds` | [js/world/bodies.js](../world/bodies.js.md) |

## Imported by

- [js/console/console.js](../console/console.js.md) — `useGameStore`
- [js/console/panels/ship.js](../console/panels/ship.js.md) — `useGameStore`
- [js/main.js](../main.js.md) — `loadSave`, `randomCallsign`, `useGameStore`
- [js/net/account.js](../net/account.js.md) — `useGameStore`
- [js/net/net.js](../net/net.js.md) — `useGameStore`
- [js/sim/sim.js](../sim/sim.js.md) — `loadSave`, `skyProgress`, `useGameStore`
- [js/ui/hud.js](../ui/hud.js.md) — `loadSave`, `randomCallsign`, `skyProgress`, `useGameStore`

## Exports

- [`loadSave`](#s-loadSave) · function — used by [js/main.js](../main.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`skyProgress`](#s-skyProgress) · function — used by [js/sim/sim.js](../sim/sim.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`randomCallsign`](#s-randomCallsign) · function — used by [js/main.js](../main.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`useGameStore`](#s-useGameStore) · const — used by [js/console/console.js](../console/console.js.md), [js/console/panels/ship.js](../console/panels/ship.js.md), [js/main.js](../main.js.md), [js/net/account.js](../net/account.js.md), [js/net/net.js](../net/net.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/hud.js](../ui/hud.js.md)

## Effects

- **storage.get** — `‹SAVE_KEY›` (loadSave:9) · `‹SAVE_KEY_V1›` (loadSave:22)
- **storage.set** — `‹SAVE_KEY›` (state.persist:202)

## Symbols

### <a id="s-SAVE_KEY"></a>`SAVE_KEY`

const · L3–3

<!-- note:SAVE_KEY -->
<!-- /note -->

### <a id="s-SAVE_KEY_V1"></a>`SAVE_KEY_V1`

const · L4–4

<!-- note:SAVE_KEY_V1 -->
<!-- /note -->

### <a id="s-listeners"></a>`listeners`

const · L5–5

<!-- note:listeners -->
<!-- /note -->

### <a id="s-loadSave"></a>`loadSave()`

function · **exported** · L7–38

- called by: [`skyProgress`](#s-skyProgress) · [`state.persist`](#s-state-persist) · [`saved`](../main.js.md#s-saved) _js/main.js_ · [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_ · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_ ×4 · [`mountHud>paintStart`](../ui/hud.js.md#s-mountHud-paintStart) _js/ui/hud.js_ · [`mountHud>setMode.onFly`](../ui/hud.js.md#s-mountHud-setMode-onFly) _js/ui/hud.js_
- effects: storage.get `‹SAVE_KEY›` · storage.get `‹SAVE_KEY_V1›`

<!-- note:loadSave -->
- L17 · `credits: Number.isFinite(parsed.credits) ? parsed.credits : null,` — 0.3.41: the wallet. Absent on a save from before — the launch
  then issues the career's starting purse as it always did.
- L18 · `lastSky: typeof parsed.lastSky === "string" ? parsed.lastSky : null,` — 0.3.42: where FLY AS goes
- L19 · `}` — ignore
<!-- /note -->

### <a id="s-skyProgress"></a>`skyProgress(seed)`

function · **exported** · L40–42

- calls: [`loadSave`](#s-loadSave)
- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_ · [`mountHud>refreshPreview`](../ui/hud.js.md#s-mountHud-refreshPreview) _js/ui/hud.js_

<!-- note:skyProgress -->
<!-- /note -->

### <a id="s-randomCallsign"></a>`randomCallsign()`

function · **exported** · L44–48

- called by: [`@file`](../main.js.md#) _js/main.js_ · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:randomCallsign -->
<!-- /note -->

### <a id="s-notify"></a>`notify()`

function · L50–52

- called by: [`state.patchHud`](#s-state-patchHud) · [`state.setCallsign`](#s-state-setCallsign) · [`state.setMapOpen`](#s-state-setMapOpen) · [`state.setMuted`](#s-state-setMuted) · [`state.setPhase`](#s-state-setPhase) · [`state.setRoom`](#s-state-setRoom) · [`state.setToast`](#s-state-setToast) · [`useGameStore.setState`](#s-useGameStore-setState)

<!-- note:notify -->
<!-- /note -->

### <a id="s-state"></a>`state`

const · L54–206

- calls: [`surveyIds`](../world/bodies.js.md#s-surveyIds) _js/world/bodies.js_

<!-- note:state -->
- L64 · `charge: 1600,` — cockpit instrumentation
- L136 · `response: null,` — the live distress clock (npc/security.js)
<!-- /note -->

#### <a id="s-state-setCallsign"></a>`state.setCallsign(v)`

prop · L158–161

- calls: [`notify`](#s-notify)

<!-- note:state.setCallsign -->
<!-- /note -->

#### <a id="s-state-setRoom"></a>`state.setRoom(v, isPublic)`

prop · L162–166

- calls: [`notify`](#s-notify)

<!-- note:state.setRoom -->
<!-- /note -->

#### <a id="s-state-setPhase"></a>`state.setPhase(phase)`

prop · L167–170

- calls: [`notify`](#s-notify)

<!-- note:state.setPhase -->
<!-- /note -->

#### <a id="s-state-setMuted"></a>`state.setMuted(muted)`

prop · L171–175

- calls: [`notify`](#s-notify)

<!-- note:state.setMuted -->
<!-- /note -->

#### <a id="s-state-setMapOpen"></a>`state.setMapOpen(mapOpen)`

prop · L176–179

- calls: [`notify`](#s-notify)

<!-- note:state.setMapOpen -->
<!-- /note -->

#### <a id="s-state-setToast"></a>`state.setToast(toast)`

prop · L180–183

- calls: [`notify`](#s-notify)

<!-- note:state.setToast -->
<!-- /note -->

#### <a id="s-state-patchHud"></a>`state.patchHud(p)`

prop · L184–187

- calls: [`notify`](#s-notify)

<!-- note:state.patchHud -->
<!-- /note -->

#### <a id="s-state-persist"></a>`state.persist()`

prop · L188–205

- calls: [`loadSave`](#s-loadSave)
- effects: storage.set `‹SAVE_KEY›`

<!-- note:state.persist -->
- L199 · `}` — quota
<!-- /note -->

### <a id="s-useGameStore"></a>`useGameStore`

const · **exported** · L208–222

<!-- note:useGameStore -->
<!-- /note -->

#### <a id="s-useGameStore-getState"></a>`useGameStore.getState()`

prop · L211–211

<!-- note:useGameStore.getState -->
<!-- /note -->

#### <a id="s-useGameStore-setState"></a>`useGameStore.setState(partial)`

prop · L212–216

- calls: [`notify`](#s-notify)

<!-- note:useGameStore.setState -->
<!-- /note -->

#### <a id="s-useGameStore-subscribe"></a>`useGameStore.subscribe(fn)`

prop · L217–220

<!-- note:useGameStore.subscribe -->
<!-- /note -->
