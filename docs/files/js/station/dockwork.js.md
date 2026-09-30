# js/station/dockwork.js

[index](../../../README.md) · 78 lines · 12 symbols · 1 imports · 8 importers

## About

<!-- note:@file -->
LIVING GALAXY — cargo handling: the crane is not instant.

0.3.25. Every trade in the game settled in one frame. A hundred and sixty
girders left the hold, the credits landed, and the clamps let go on the same
tick — so a trade run's only real cost was flying, and a hold's worth of
anything cost the same to move as a crate. It also made ARIA's numbers a
lie: her credits-per-minute counted the flying and not the loading, so the
bench measured a game nobody plays.

The till is still instant — you agree a price and the money moves. The CRANE
is not. A consignment books HANDLING time at the berth: the clamps stay on
and the port will not release you until the last pallet is aboard or ashore.
It is the same rule for a player and for a bot, which is the point: what the
bench measures is what you experience.

Handling is per-berth and cumulative — buy, sell and deliver in one port
call and you wait for all of it — and it scales with TONNAGE, not with
units, so eight shield coils are quick and eight hundred rations are not.
A hull with a better cargo rig works it off faster (`mods.handling`).

Undocking is what enforces it (sim.js toggleDock), so nothing else has to
know: the autopilot's own undock, the mission executor's, and the deck
button all hit the same refusal and wait it out.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../economy/materials.js` | `good` | [js/economy/materials.js](../economy/materials.js.md) |

## Imported by

- [js/aria/play.js](../aria/play.js.md) — `handlingLeft`, `handlingLine`
- [js/economy/contracts.js](../economy/contracts.js.md) — `bookHandling`
- [js/sim/sim.js](../sim/sim.js.md) — `bookHandling`, `clearDockwork`, `handlingLeft`, `handlingLine`, `handlingProgress`, `stepDockwork`
- [js/station/stationdeck.js](stationdeck.js.md) — `handlingLeft`, `handlingLine`
- [js/ui/holdview.js](../ui/holdview.js.md) — `handlingLeft`
- test/dockwork.test.mjs _(outside js/)_ — `HANDLING`, `dockwork`, `bookHandling`, `clearDockwork`, `handlingLeft`, `handlingLine`, `handlingProgress`, `handlingSeconds`, `isBulk`
- test/hold.test.mjs _(outside js/)_ — `clearDockwork`
- test/undock.test.mjs _(outside js/)_ — `handlingLeft`, `clearDockwork`

## Exports

- [`HANDLING`](#s-HANDLING) · const — used by test/dockwork.test.mjs
- [`dockwork`](#s-dockwork) · const — used by test/dockwork.test.mjs
- [`dockworkHooks`](#s-dockworkHooks) · const — **no importer in scanned roots**
- [`isBulk`](#s-isBulk) · function — used by test/dockwork.test.mjs
- [`handlingSeconds`](#s-handlingSeconds) · function — used by test/dockwork.test.mjs
- [`bookHandling`](#s-bookHandling) · function — used by [js/economy/contracts.js](../economy/contracts.js.md), [js/sim/sim.js](../sim/sim.js.md), test/dockwork.test.mjs
- [`handlingLeft`](#s-handlingLeft) · function — used by [js/aria/play.js](../aria/play.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationdeck.js](stationdeck.js.md), [js/ui/holdview.js](../ui/holdview.js.md), test/dockwork.test.mjs, test/undock.test.mjs
- [`handlingProgress`](#s-handlingProgress) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/dockwork.test.mjs
- [`handlingLine`](#s-handlingLine) · function — used by [js/aria/play.js](../aria/play.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationdeck.js](stationdeck.js.md), test/dockwork.test.mjs
- [`stepDockwork`](#s-stepDockwork) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`clearDockwork`](#s-clearDockwork) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/dockwork.test.mjs, test/hold.test.mjs, test/undock.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-HANDLING"></a>`HANDLING`

const · **exported** · L3–10

<!-- note:HANDLING -->
- L4 · `rate: 34,` — tonnes a second at the berth, before the hull's rig
- L5 · `floor: 2,` — s: even one crate is a pallet, a signature and a scan
- L6 · `cap: 300,` — s: a port does not take more than five minutes on one call
- L7 · `perUnit: 0.6,` — s a unit, for goods with no mass on the books
- L8 · `bulkRate: 140,` — 0.3.76 — raw ore and ice are not craned in pallets: they go down a chute.
  At the pallet rate a mining hull's full hold (≈1,200 units, ≈3,500 t) was
  106 s of clamps on every loop — reported from an ARIA mine loop, where the
  port call took as long as the mining. Bulk goes at 140 t/s and never holds
  a hull more than 45 s: the same full hold is ≈25 s.
- L8 · `bulkRate: 140,` — tonnes a second, raw ore and ice
- L9 · `bulkCap: 45,` — s: the most a hold of bulk keeps the clamps on
<!-- /note -->

### <a id="s-dockwork"></a>`dockwork`

const · **exported** · L12–12

<!-- note:dockwork -->
The berth's clock: { stationId, secs, left, done, items: [...] } or null.
<!-- /note -->

### <a id="s-dockworkHooks"></a>`dockworkHooks`

const · **exported** · L13–13

<!-- note:dockworkHooks -->
<!-- /note -->

### <a id="s-massOf"></a>`massOf(id)`

function · L15–15

- calls: [`good`](../economy/materials.js.md#s-good) _js/economy/materials.js_
- called by: [`handlingSeconds`](#s-handlingSeconds) ×2

<!-- note:massOf -->
<!-- /note -->

### <a id="s-isBulk"></a>`isBulk(id)`

function · **exported** · L16–16

- calls: [`good`](../economy/materials.js.md#s-good) _js/economy/materials.js_
- called by: [`handlingSeconds`](#s-handlingSeconds)

<!-- note:isBulk -->
Raw ore and ice go down a chute, not onto a pallet (0.3.76).
<!-- /note -->

### <a id="s-handlingSeconds"></a>`handlingSeconds(id, qty, mods=)`

function · **exported** · L18–27

- calls: [`isBulk`](#s-isBulk) · [`massOf`](#s-massOf) ×2
- called by: [`bookHandling`](#s-bookHandling)

<!-- note:handlingSeconds -->
Seconds a lot of `id` takes over the side, for a hull with this rig.
<!-- /note -->

### <a id="s-bookHandling"></a>`bookHandling(stationId, kind, id, qty, mods=)`

function · **exported** · L29–44

- calls: [`handlingSeconds`](#s-handlingSeconds)
- called by: [`acceptContract`](../economy/contracts.js.md#s-acceptContract) _js/economy/contracts.js_ · [`deliverContracts`](../economy/contracts.js.md#s-deliverContracts) _js/economy/contracts.js_ · [`tradeBuy`](../sim/sim.js.md#s-tradeBuy) _js/sim/sim.js_ · [`tradeSell`](../sim/sim.js.md#s-tradeSell) _js/sim/sim.js_

<!-- note:bookHandling -->
Book handling for a lot at a berth. Cumulative within one port call: a buy
and a sell on the same visit wait for both. Returns the seconds added.

- L37 · `const room = Math.max(0, HANDLING.cap - j.left);` — 0.3.76: one port call never holds a hull past the cap, however many lots it is
  made of (a loop sells each ore as its own lot)
<!-- /note -->

### <a id="s-handlingLeft"></a>`handlingLeft(stationId=)`

function · **exported** · L46–51

- called by: [`playReport`](../aria/play.js.md#s-playReport) _js/aria/play.js_ · [`tickSim`](../sim/sim.js.md#s-tickSim) _js/sim/sim.js_ · [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_ · [`mountStationDeck>paintUndock`](stationdeck.js.md#s-mountStationDeck-paintUndock) _js/station/stationdeck.js_ · [`holdSlots`](../ui/holdview.js.md#s-holdSlots) _js/ui/holdview.js_

<!-- note:handlingLeft -->
Seconds still to run at this berth (0 when there is nothing on the crane).
<!-- /note -->

### <a id="s-handlingProgress"></a>`handlingProgress()`

function · **exported** · L53–57

<!-- note:handlingProgress -->
0…1 through the current port call, for a bar.
<!-- /note -->

### <a id="s-handlingLine"></a>`handlingLine()`

function · **exported** · L59–65

- called by: [`playReport`](../aria/play.js.md#s-playReport) _js/aria/play.js_ · [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_ ×2 · [`mountStationDeck>paintUndock`](stationdeck.js.md#s-mountStationDeck-paintUndock) _js/station/stationdeck.js_ ×2

<!-- note:handlingLine -->
"loading 120 Girder · 38 s"
<!-- /note -->

### <a id="s-stepDockwork"></a>`stepDockwork(dt, dockedAt=)`

function · **exported** · L67–76

- calls: [`clearDockwork`](#s-clearDockwork)
- called by: [`tickSim`](../sim/sim.js.md#s-tickSim) _js/sim/sim.js_

<!-- note:stepDockwork -->
The sim tick works it off. Only while the hull is actually at that berth.

- L70 · `if (dockedAt !== j.stationId) { clearDockwork(); return; }` — left the berth: the crane is somebody else's problem
<!-- /note -->

### <a id="s-clearDockwork"></a>`clearDockwork()`

function · **exported** · L78–78

- called by: [`stepDockwork`](#s-stepDockwork)

<!-- note:clearDockwork -->
<!-- /note -->
