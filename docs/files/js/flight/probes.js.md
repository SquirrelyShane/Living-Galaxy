# js/flight/probes.js

[index](../../../README.md) · 168 lines · 16 symbols · 8 imports · 6 importers

## About

<!-- note:@file -->
LIVING GALAXY — remote scans and survey probes.

The chart lets you point at any spot in the sky and ask what is there.
Two answers: a REMOTE SCAN is instant but only reaches a few sensor
ranges out; a PROBE is a small drone the ship throws at the point — it
flies there at a fixed speed, assays the cell on arrival, drops a saved
location with the findings and calls it in. Both write a scan report the
chart sheet and the log can read back.

- L11 · `export const PROBE_SPEED = 9000;` — u/s straight-line
- L14 · `export const SCAN_REACH = 5;` — remote scan reaches this many sensor ranges
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../world/bodies.js` | `BODIES`, `bodyPosition`, `currentSystem`, `dist3` | [js/world/bodies.js](../world/bodies.js.md) |
| 2 | `../world/field.js` | `bandAt`, `BAND_METAL`, `BAND_CARBON`, `CELL`, `inBelt`, `nearbyRocks` | [js/world/field.js](../world/field.js.md) |
| 3 | `../npc/traffic.js` | `traffic` | [js/npc/traffic.js](../npc/traffic.js.md) |
| 4 | `../npc/flow.js` | `flow` | [js/npc/flow.js](../npc/flow.js.md) |
| 5 | `../station/stations.js` | `stations` | [js/station/stations.js](../station/stations.js.md) |
| 6 | `../sim/sim.js` | `addWaypointAt`, `logEvent`, `sensorRange`, `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 7 | `../audio/index.js` | `NAV`, `WARN` | [js/audio/index.js](../audio/index.js.md) |
| 8 | `./ship.js` | `shipFx` | [js/flight/ship.js](ship.js.md) |

## Imported by

- [js/drones/ops.js](../drones/ops.js.md) — `assayPoint`, `fileReport`
- [js/flight/contacts.js](contacts.js.md) — `probes`
- [js/render/engine.js](../render/engine.js.md) — `probes`
- [js/sim/sim.js](../sim/sim.js.md) — `resetProbes`, `stepProbes`
- [js/ui/map.js](../ui/map.js.md) — `beltBandAt`, `launchProbe`, `probes`, `remoteScan`
- test/chart.test.mjs _(outside js/)_ — `assayPoint`, `beltBandAt`, `remoteScan`, `launchProbe`, `probes`, `stepProbes`, `PROBE_SPEED`, `SCAN_REACH`

## Exports

- [`probes`](#s-probes) · const — used by [js/flight/contacts.js](contacts.js.md), [js/render/engine.js](../render/engine.js.md), [js/ui/map.js](../ui/map.js.md), test/chart.test.mjs
- [`PROBE_SPEED`](#s-PROBE_SPEED) · const — used by test/chart.test.mjs
- [`PROBE_CHARGE`](#s-PROBE_CHARGE) · const — **no importer in scanned roots**
- [`SCAN_CHARGE`](#s-SCAN_CHARGE) · const — **no importer in scanned roots**
- [`SCAN_REACH`](#s-SCAN_REACH) · const — used by test/chart.test.mjs
- [`resetProbes`](#s-resetProbes) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`beltBandAt`](#s-beltBandAt) · function — used by [js/ui/map.js](../ui/map.js.md), test/chart.test.mjs
- [`assayPoint`](#s-assayPoint) · function — used by [js/drones/ops.js](../drones/ops.js.md), test/chart.test.mjs
- [`fileReport`](#s-fileReport) · function — used by [js/drones/ops.js](../drones/ops.js.md)
- [`remoteScan`](#s-remoteScan) · function — used by [js/ui/map.js](../ui/map.js.md), test/chart.test.mjs
- [`launchProbe`](#s-launchProbe) · function — used by [js/ui/map.js](../ui/map.js.md), test/chart.test.mjs
- [`stepProbes`](#s-stepProbes) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/chart.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-probes"></a>`probes`

const · **exported** · L10–10

<!-- note:probes -->
<!-- /note -->

### <a id="s-PROBE_SPEED"></a>`PROBE_SPEED`

const · **exported** · L11–11

<!-- note:PROBE_SPEED -->
<!-- /note -->

### <a id="s-PROBE_CHARGE"></a>`PROBE_CHARGE`

const · **exported** · L12–12

<!-- note:PROBE_CHARGE -->
<!-- /note -->

### <a id="s-SCAN_CHARGE"></a>`SCAN_CHARGE`

const · **exported** · L13–13

<!-- note:SCAN_CHARGE -->
<!-- /note -->

### <a id="s-SCAN_REACH"></a>`SCAN_REACH`

const · **exported** · L14–14

<!-- note:SCAN_REACH -->
<!-- /note -->

### <a id="s-seq"></a>`seq`

const · L15–15

<!-- note:seq -->
<!-- /note -->

### <a id="s-reportSeq"></a>`reportSeq`

const · L16–16

<!-- note:reportSeq -->
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L17–17

<!-- note:_p -->
<!-- /note -->

### <a id="s-resetProbes"></a>`resetProbes()`

function · **exported** · L19–23

- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:resetProbes -->
<!-- /note -->

### <a id="s-fmtKm"></a>`fmtKm(u)`

function · L25–28

- called by: [`assayPoint`](#s-assayPoint) ×2 · [`launchProbe`](#s-launchProbe) ×2 · [`remoteScan`](#s-remoteScan) ×3

<!-- note:fmtKm -->
<!-- /note -->

### <a id="s-beltBandAt"></a>`beltBandAt(x, z)`

function · **exported** · L30–41

- calls: [`bandAt`](../world/field.js.md#s-bandAt) _js/world/field.js_
- called by: [`assayPoint`](#s-assayPoint) · [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_ · [`mountMap.run~8`](../ui/map.js.md#s-mountMap-run-8) _js/ui/map.js_ · [`mountMap>drawSheet`](../ui/map.js.md#s-mountMap-drawSheet) _js/ui/map.js_ · [`mountMap>openMenu`](../ui/map.js.md#s-mountMap-openMenu) _js/ui/map.js_ ×2 · [`mountMap>tapAt`](../ui/map.js.md#s-mountMap-tapAt) _js/ui/map.js_

<!-- note:beltBandAt -->
Which belt (if any) a radius sits in, and which band of it.
<!-- /note -->

### <a id="s-assayPoint"></a>`assayPoint(x, y, z)`

function · **exported** · L43–87

- calls: [`beltBandAt`](#s-beltBandAt) · [`fmtKm`](#s-fmtKm) ×2 · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ ×4 · [`inBelt`](../world/field.js.md#s-inBelt) _js/world/field.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_
- called by: [`ROLE_STEP.surveyor`](../drones/ops.js.md#s-ROLE_STEP-surveyor) _js/drones/ops.js_ · [`remoteScan`](#s-remoteScan) · [`stepProbes`](#s-stepProbes)

<!-- note:assayPoint -->
Everything the sensors can say about a point: rocks, hulls, the nearest world.

- L72 · `const near = [];` — hulls with transponders near the point
- L76 · `let best = null, bestD = Infinity;` — the closest world and port, for bearings
<!-- /note -->

### <a id="s-fileReport"></a>`fileReport(kind, name, a)`

function · **exported** · L89–94

- via [js/sim/sim.js](../sim/sim.js.md): `sim.scanReports.unshift`
- called by: [`ROLE_STEP.surveyor`](../drones/ops.js.md#s-ROLE_STEP-surveyor) _js/drones/ops.js_ · [`remoteScan`](#s-remoteScan) · [`stepProbes`](#s-stepProbes)

<!-- note:fileReport -->
<!-- /note -->

### <a id="s-remoteScan"></a>`remoteScan(x, y, z, name=)`

function · **exported** · L96–117

- calls: [`assayPoint`](#s-assayPoint) · [`fileReport`](#s-fileReport) · [`fmtKm`](#s-fmtKm) ×3 · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`sensorRange`](../sim/sim.js.md#s-sensorRange) _js/sim/sim.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- via [js/flight/ship.js](ship.js.md): `shipFx.fx`
- via [js/audio/index.js](../audio/index.js.md): `NAV.ping`, `WARN.deny`
- called by: [`mountMap.run~5`](../ui/map.js.md#s-mountMap-run-5) _js/ui/map.js_

<!-- note:remoteScan -->
Instant long-range look at a point. Costs charge; refuses beyond reach.
Returns the report, or null with the reason in sim.notice.
<!-- /note -->

### <a id="s-launchProbe"></a>`launchProbe(x, y, z, name)`

function · **exported** · L119–143

- calls: [`fmtKm`](#s-fmtKm) ×2 · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- via [js/audio/index.js](../audio/index.js.md): `NAV.ping`, `WARN.deny`
- called by: [`mountMap.run~4`](../ui/map.js.md#s-mountMap-run-4) _js/ui/map.js_

<!-- note:launchProbe -->
Throw a probe at a point. It reports on arrival and drops a saved location.
<!-- /note -->

### <a id="s-stepProbes"></a>`stepProbes(_dt)`

function · **exported** · L145–168

- calls: [`assayPoint`](#s-assayPoint) · [`fileReport`](#s-fileReport) · [`addWaypointAt`](../sim/sim.js.md#s-addWaypointAt) _js/sim/sim.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- via [js/audio/index.js](../audio/index.js.md): `NAV.ping`
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepProbes -->
- L167 · `for (let i = probes.length - 1; i >= 0; i--) if (probes[i].done && sim.time - probes[i].do` — spent probes fall off the board after a while
<!-- /note -->
