# js/flight/repair.js

[index](../../../README.md) · 87 lines · 10 symbols · 5 imports · 7 importers

## About

<!-- note:@file -->
LIVING GALAXY — putting the hull back.

Before 0.3.02 the only things that ever raised `ship.hull` were a nanofoam
refit (two points a cycle), an engineer on duty, and a rented company repair
drone that needed a charter and an industrial yard. A hull that took a
beating in the belt stayed beaten. Two ways now, both honest about cost:

  YARD      docked at a port whose sector lists the `repair` service
            (materials.js SECTORS — logistic, military, industrial,
            civilian and free ports; agricultural docks do not), the yard
            sells hull by the point. The price leans on the port's sector
            and on your standing with whoever runs it; you can buy a patch
            or the lot, and it never charges for more than you can pay.

  PATCH     the Hull-patch drone refit (upgrades.js `repair_drone`, fx
  DRONE     `patchDrone` = hull points a second). A drone that lives in a
            bay on your own hull: once nothing has hit you for a few seconds
            it goes out and welds, drawing on the OPS bus while it works —
            so it shows on the ledger, sheds in a brownout, and stops the
            moment you are under fire again. No charter, no home port.

`patchDrone` (the object) is what the renderer draws: out, and welding.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim`, `logEvent` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../economy/materials.js` | `SECTORS` | [js/economy/materials.js](../economy/materials.js.md) |
| 3 | `../corp/corps.js` | `corpOfStation` | [js/corp/corps.js](../corp/corps.js.md) |
| 4 | `../economy/upgrades.js` | `fx` | [js/economy/upgrades.js](../economy/upgrades.js.md) |
| 5 | `../station/stations.js` | `stationById` | [js/station/stations.js](../station/stations.js.md) |

## Imported by

- [js/aria/pilot.js](../aria/pilot.js.md) — `repairsAt`, `pricePerPoint`, `yardRepair`, `hullMaxOf`
- [js/aria/play.js](../aria/play.js.md) — `yardRepair`, `repairsAt`, `repairQuote`, `hullMaxOf`
- [js/aria/senses.js](../aria/senses.js.md) — `hullMaxOf`, `repairsAt`, `pricePerPoint`
- [js/sim/sim.js](../sim/sim.js.md) — `tickPatchDrone`, `hullMaxOf`
- [js/station/refityard.js](../station/refityard.js.md) — `repairQuote`, `yardRepair`, `repairsAt`, `hullMaxOf`, `droneRate`
- [js/ui/hud.js](../ui/hud.js.md) — `hullMaxOf`
- test/portdrones.test.mjs _(outside js/)_ — `hullMaxOf`

## Exports

- [`REPAIR`](#s-REPAIR) · const — **no importer in scanned roots**
- [`patchDrone`](#s-patchDrone) · const — **no importer in scanned roots**
- [`hullMaxOf`](#s-hullMaxOf) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/refityard.js](../station/refityard.js.md), [js/ui/hud.js](../ui/hud.js.md), test/portdrones.test.mjs
- [`repairsAt`](#s-repairsAt) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/station/refityard.js](../station/refityard.js.md)
- [`pricePerPoint`](#s-pricePerPoint) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/senses.js](../aria/senses.js.md)
- [`repairQuote`](#s-repairQuote) · function — used by [js/aria/play.js](../aria/play.js.md), [js/station/refityard.js](../station/refityard.js.md)
- [`yardRepair`](#s-yardRepair) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/aria/play.js](../aria/play.js.md), [js/station/refityard.js](../station/refityard.js.md)
- [`droneRate`](#s-droneRate) · function — used by [js/station/refityard.js](../station/refityard.js.md)
- [`tickPatchDrone`](#s-tickPatchDrone) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`resetRepair`](#s-resetRepair) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-REPAIR"></a>`REPAIR`

const · **exported** · L7–13

<!-- note:REPAIR -->
- L8 · `perPoint: 26,` — cr a hull point at a neutral port
- L10 · `droneKw: 14,` — on the ops bus while the drone welds
- L11 · `droneQuiet: 6,` — seconds since the last hit before it launches
- L12 · `droneRange: 9,` — metres off the hull it works at (the renderer's orbit)
<!-- /note -->

### <a id="s-patchDrone"></a>`patchDrone`

const · **exported** · L15–15

<!-- note:patchDrone -->
<!-- /note -->

### <a id="s-hullMaxOf"></a>`hullMaxOf(ship)`

function · **exported** · L17–17

- called by: [`planJob`](../aria/pilot.js.md#s-planJob) _js/aria/pilot.js_ · [`registerAriaOps`](../aria/pilot.js.md#s-registerAriaOps) _js/aria/pilot.js_ · [`tickAriaPilot`](../aria/pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`hullFrac`](../aria/play.js.md#s-hullFrac) _js/aria/play.js_ · [`senseHull`](../aria/senses.js.md#s-senseHull) _js/aria/senses.js_ · [`repairQuote`](#s-repairQuote) · [`tickPatchDrone`](#s-tickPatchDrone) ×2 · [`yardRepair`](#s-yardRepair) ×2 · [`loseHull`](../sim/sim.js.md#s-loseHull) _js/sim/sim.js_ · [`wireReactiveSky`](../sim/sim.js.md#s-wireReactiveSky) _js/sim/sim.js_ · [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_ · [`sampleWorld`](../ui/hud.js.md#s-sampleWorld) _js/ui/hud.js_

<!-- note:hullMaxOf -->
<!-- /note -->

### <a id="s-repairsAt"></a>`repairsAt(st)`

function · **exported** · L19–23

- called by: [`bestRepairPort`](../aria/pilot.js.md#s-bestRepairPort) _js/aria/pilot.js_ · [`tickAriaPilot`](../aria/pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`bestYard`](../aria/play.js.md#s-bestYard) _js/aria/play.js_ · [`stepPlay`](../aria/play.js.md#s-stepPlay) _js/aria/play.js_ · [`sensePorts`](../aria/senses.js.md#s-sensePorts) _js/aria/senses.js_ ×2 · [`repairQuote`](#s-repairQuote) · [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_

<!-- note:repairsAt -->
Does this port fix hulls?
<!-- /note -->

### <a id="s-pricePerPoint"></a>`pricePerPoint(st)`

function · **exported** · L25–30

- calls: [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_
- called by: [`bestRepairPort`](../aria/pilot.js.md#s-bestRepairPort) _js/aria/pilot.js_ · [`sensePorts`](../aria/senses.js.md#s-sensePorts) _js/aria/senses.js_ · [`repairQuote`](#s-repairQuote) ×2

<!-- note:pricePerPoint -->
cr a point here, after the sector and your standing with the port's operator.

- L27 · `const standing = corpOfStation(st)?.standing ?? 0;` — −100 … 100
<!-- /note -->

### <a id="s-repairQuote"></a>`repairQuote(st, ship=, points=)`

function · **exported** · L32–41

- calls: [`hullMaxOf`](#s-hullMaxOf) · [`pricePerPoint`](#s-pricePerPoint) ×2 · [`repairsAt`](#s-repairsAt)
- called by: [`bestYard`](../aria/play.js.md#s-bestYard) _js/aria/play.js_ · [`startYard`](../aria/play.js.md#s-startYard) _js/aria/play.js_ · [`stepPlay`](../aria/play.js.md#s-stepPlay) _js/aria/play.js_ · [`yardRepair`](#s-yardRepair) · [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_ · [`build>act`](../station/refityard.js.md#s-build-act) _js/station/refityard.js_ · [`paintDeckRepair`](../station/refityard.js.md#s-paintDeckRepair) _js/station/refityard.js_

<!-- note:repairQuote -->
What a repair here would cost. `points` defaults to the whole shortfall.
→ { ok, why, need, points, per, total, affordable }
<!-- /note -->

### <a id="s-yardRepair"></a>`yardRepair(points=, ship=)`

function · **exported** · L43–55

- calls: [`hullMaxOf`](#s-hullMaxOf) ×2 · [`repairQuote`](#s-repairQuote) · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`registerAriaOps`](../aria/pilot.js.md#s-registerAriaOps) _js/aria/pilot.js_ · [`tickAriaPilot`](../aria/pilot.js.md#s-tickAriaPilot) _js/aria/pilot.js_ · [`stepPlay`](../aria/play.js.md#s-stepPlay) _js/aria/play.js_ · [`build>act`](../station/refityard.js.md#s-build-act) _js/station/refityard.js_ · [`wireDeckRepair`](../station/refityard.js.md#s-wireDeckRepair) _js/station/refityard.js_

<!-- note:yardRepair -->
Buy hull at the yard you are docked at. → { ok, points, cost, why }
<!-- /note -->

### <a id="s-droneRate"></a>`droneRate()`

function · **exported** · L57–57

- calls: [`fx`](../economy/upgrades.js.md#s-fx) _js/economy/upgrades.js_
- called by: [`tickPatchDrone`](#s-tickPatchDrone) · [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_ ×2

<!-- note:droneRate -->
---- the patch drone ----------------------------------------------------

Hull points a second the fitted drone welds, 0 when none is fitted.
<!-- /note -->

### <a id="s-tickPatchDrone"></a>`tickPatchDrone(dt, ship=)`

function · **exported** · L59–81

- calls: [`droneRate`](#s-droneRate) · [`hullMaxOf`](#s-hullMaxOf) ×2 · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_

<!-- note:tickPatchDrone -->
Called from the sim tick. Decides whether the drone is out, and bills the bus
through `ship.patchDraw` (read by buildDemand next tick, on the ops board).

- L75 · `if (ship.powered?.ops === false) return 0;` — the ops board carries it: shed in a brownout, the drone holds station and waits
<!-- /note -->

### <a id="s-resetRepair"></a>`resetRepair()`

function · **exported** · L83–87

<!-- note:resetRepair -->
<!-- /note -->
