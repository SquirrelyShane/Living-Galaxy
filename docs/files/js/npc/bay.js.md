# js/npc/bay.js

[index](../../../README.md) · 117 lines · 18 symbols · 1 imports · 6 importers

## About

<!-- note:@file -->
LIVING GALAXY — the hangar bay, flown.

0.3.15. Until now the only hull that ever flew INSIDE a hangar was yours:
the tractor pulls you in by the entry door to the clamps and pushes you out
by the exit door (stationworks.js). Everything else — the named captains,
the port's flow boats, work drones, corporate drones — vanished at the
mouth (or at 1.2 station radii) and reappeared at the station's centre
when it left. To hide that, the station generator dressed every bay with
box "shuttles" on a loop, a parked box "tug" and little sortie drones in
the drone bays: scenery pretending to be traffic.

The scenery is gone (stationgen/builder/hangar.js, prefabs/modules.js) and
this is what replaces it: one path through the bay, in the same frame the
tractor uses (st.hangars[0] — the port frame the lanes grow from), that
every real hull flies at the end of an arrival and the start of a
departure.

  in   entry door → inside the bay on the arrivals half → the arrivals clamps
  out  the departures clamps → inside the bay on the departures half → exit door

Each lane-way (0..2) gets its own line through the bay, spread across its
half of the aperture, so three boats arriving together do not stack. The
path ends on the doors the lanes start from (lanePoint(st, which, 0, k)),
so a hull leaving the bay is already ON its lane-way and one arriving by
its lane-way is already at the start of its bay line — no pop either side.

Pure data, no three.js. A port with no built hangar (test fixtures) has no
bay: callers keep the old behaviour there.

- L3 · `export const BAY_IN_S = 9;` — entry door to the clamps
- L4 · `export const BAY_OUT_S = 7;` — the clamps to the exit door
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./lanes.js` | `lanePoint`, `SUBLANES` | [js/npc/lanes.js](lanes.js.md) |

## Imported by

- [js/drones/npcdrones.js](../drones/npcdrones.js.md) — `droneDoorGoal`, `startDroneBay`, `stepDroneBay`
- [js/drones/ops.js](../drones/ops.js.md) — `droneDoorGoal`, `startDroneBay`, `stepDroneBay`
- [js/npc/flow.js](flow.js.md) — `hasBay`, `bayPose`, `BAY_IN_S`, `BAY_OUT_S`
- [js/npc/traffic.js](traffic.js.md) — `hasBay`, `bayPose`, `bayOffset`, `BAY_IN_S`, `BAY_OUT_S`
- test/bay.test.mjs _(outside js/)_ — `hasBay`, `bayPose`, `insideBay`, `BAY_IN_S`, `BAY_OUT_S`
- test/sky.test.mjs _(outside js/)_ — `insideBay`

## Exports

- [`BAY_IN_S`](#s-BAY_IN_S) · const — used by [js/npc/flow.js](flow.js.md), [js/npc/traffic.js](traffic.js.md), test/bay.test.mjs
- [`BAY_OUT_S`](#s-BAY_OUT_S) · const — used by [js/npc/flow.js](flow.js.md), [js/npc/traffic.js](traffic.js.md), test/bay.test.mjs
- [`hasBay`](#s-hasBay) · function — used by [js/npc/flow.js](flow.js.md), [js/npc/traffic.js](traffic.js.md), test/bay.test.mjs
- [`bayPose`](#s-bayPose) · function — used by [js/npc/flow.js](flow.js.md), [js/npc/traffic.js](traffic.js.md), test/bay.test.mjs
- [`bayOffset`](#s-bayOffset) · function — used by [js/npc/traffic.js](traffic.js.md)
- [`entryDoor`](#s-entryDoor) · function — **no importer in scanned roots**
- [`insideBay`](#s-insideBay) · function — used by test/bay.test.mjs, test/sky.test.mjs
- [`droneDoorGoal`](#s-droneDoorGoal) · function — used by [js/drones/npcdrones.js](../drones/npcdrones.js.md), [js/drones/ops.js](../drones/ops.js.md)
- [`droneWay`](#s-droneWay) · function — **no importer in scanned roots**
- [`startDroneBay`](#s-startDroneBay) · function — used by [js/drones/npcdrones.js](../drones/npcdrones.js.md), [js/drones/ops.js](../drones/ops.js.md)
- [`stepDroneBay`](#s-stepDroneBay) · function — used by [js/drones/npcdrones.js](../drones/npcdrones.js.md), [js/drones/ops.js](../drones/ops.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-BAY_IN_S"></a>`BAY_IN_S`

const · **exported** · L3–3

<!-- note:BAY_IN_S -->
<!-- /note -->

### <a id="s-BAY_OUT_S"></a>`BAY_OUT_S`

const · **exported** · L4–4

<!-- note:BAY_OUT_S -->
<!-- /note -->

### <a id="s-hasBay"></a>`hasBay(st)`

function · **exported** · L6–8

- called by: [`droneDoorGoal`](#s-droneDoorGoal) · [`insideBay`](#s-insideBay) · [`startDroneBay`](#s-startDroneBay) · [`stepDroneBay`](#s-stepDroneBay) · [`flowPose`](flow.js.md#s-flowPose) _js/npc/flow.js_ · [`stepHullOnce`](traffic.js.md#s-stepHullOnce) _js/npc/traffic.js_ ×6

<!-- note:hasBay -->
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L10–10

<!-- note:_p -->
<!-- /note -->

### <a id="s-controls"></a>`controls(st, which, k, P)`

function · L12–30

- calls: [`lanePoint`](lanes.js.md#s-lanePoint) _js/npc/lanes.js_
- called by: [`bayPose`](#s-bayPose)

<!-- note:controls -->
the three station-local control points of the path for lane-way k

- L17 · `lanePoint(st, which === "in" ? "entry" : "exit", 0, _p, kk);` — the door: the lane's own mouth point on this way (world → station-local)
- L19 · `const sgn = which === "in" ? -1 : 1;` — the clamps: the arrivals set on the port half, the departures set mirrored onto the starboard half
- L25 · `const depth = (m.d ?? 20) * 0.35;` — a point a third of the way into the bay, on the door's line: the hull comes in straight, then drifts to the clamps
<!-- /note -->

### <a id="s-smooth"></a>`smooth(s)`

function · L32–32

- called by: [`bayPose`](#s-bayPose) ×2

<!-- note:smooth -->
<!-- /note -->

### <a id="s-smoothD"></a>`smoothD(s)`

function · L33–33

- called by: [`bayPose`](#s-bayPose)

<!-- note:smoothD -->
<!-- /note -->

### <a id="s-_P"></a>`_P`

const · L34–34

<!-- note:_P -->
<!-- /note -->

### <a id="s-bayPose"></a>`bayPose(st, which, s, k, out=, off=)`

function · **exported** · L36–58

- calls: [`controls`](#s-controls) · [`smooth`](#s-smooth) ×2 · [`smoothD`](#s-smoothD)
- called by: [`bayOffset`](#s-bayOffset) · [`poseDrone`](#s-poseDrone) · [`flowPose`](flow.js.md#s-flowPose) _js/npc/flow.js_ ×2 · [`poseBay`](traffic.js.md#s-poseBay) _js/npc/traffic.js_

<!-- note:bayPose -->
Where a hull is on its bay path. `which` is "in" | "out", `s` 0..1 of the
transit, `k` its lane-way. Writes world x/y/z, the world velocity (the
port's own velocity plus the path's), and yaw/pitch facing the motion, into
`out`. The path is eased at both ends: a hull drifts off the clamps and
settles onto them.

- L52 · `if (off) { const w = 1 - smooth(Math.min(1, u / 0.4)); out.x += off.x * w; out.y += off.y` — a hull that reached the door a little off its line (a coarse tick, the
  capture radius) starts from where it actually is and blends onto the
  path over the first stretch — no snap
- L55 · `out.yaw = Math.atan2(-tx, -tz);` — face the way the hull is going; on the clamps (sp → 0) keep facing along the path, nose to the door on the way out
<!-- /note -->

### <a id="s-bayOffset"></a>`bayOffset(st, which, k, p)`

function · **exported** · L60–63

- calls: [`bayPose`](#s-bayPose)
- called by: [`startDroneBay`](#s-startDroneBay) · [`stepHullOnce`](traffic.js.md#s-stepHullOnce) _js/npc/traffic.js_

<!-- note:bayOffset -->
Where the bay path starts relative to `p`: the blend offset for a run beginning at `p` (see bayPose).
<!-- /note -->

### <a id="s-entryDoor"></a>`entryDoor(st, k, out=)`

function · **exported** · L65–67

- calls: [`lanePoint`](lanes.js.md#s-lanePoint) _js/npc/lanes.js_
- called by: [`droneDoorGoal`](#s-droneDoorGoal)

<!-- note:entryDoor -->
The world point a hull aims for to start its bay run in: the entry door on its lane-way.
<!-- /note -->

### <a id="s-insideBay"></a>`insideBay(st, p)`

function · **exported** · L69–77

- calls: [`hasBay`](#s-hasBay)

<!-- note:insideBay -->
Is a world point inside the hangar (behind the aperture plane and within its box)?
<!-- /note -->

### <a id="s-_dp"></a>`_dp`

const · L79–79

<!-- note:_dp -->
---- drones --------------------------------------------------------------
Work drones (drones/ops.js) and corporate drones (drones/npcdrones.js)
dock by the same doors. A drone's transit rides on the unit as
`u.bay = { which, s, st }` while it is filed as docked (so every rule
about a docked drone — stash, repair, recall — still applies the moment it
reaches the door); the renderer draws a docked drone only while it has one.
<!-- /note -->

### <a id="s-droneDoorGoal"></a>`droneDoorGoal(st, u, out=)`

function · **exported** · L81–87

- calls: [`droneWay`](#s-droneWay) · [`entryDoor`](#s-entryDoor) · [`hasBay`](#s-hasBay)
- called by: [`stepHauler`](../drones/npcdrones.js.md#s-stepHauler) _js/drones/npcdrones.js_ · [`stepMiner`](../drones/npcdrones.js.md#s-stepMiner) _js/drones/npcdrones.js_ · [`goHome`](../drones/ops.js.md#s-goHome) _js/drones/ops.js_ · [`haulForMiner`](../drones/ops.js.md#s-haulForMiner) _js/drones/ops.js_

<!-- note:droneDoorGoal -->
The goal a homing drone flies to: its port's entry door, moving with the port.

- L85 · `out.r = 6 + Math.hypot(out.vx, out.vy, out.vz) * 0.6;` — the port moves between one sim step and the next; the capture ring covers that, and bayOffset blends the rest
<!-- /note -->

### <a id="s-droneWay"></a>`droneWay(u)`

function · **exported** · L89–94

- called by: [`droneDoorGoal`](#s-droneDoorGoal) · [`poseDrone`](#s-poseDrone) · [`startDroneBay`](#s-startDroneBay)

<!-- note:droneWay -->
<!-- /note -->

### <a id="s-startDroneBay"></a>`startDroneBay(u, st, which)`

function · **exported** · L96–101

- calls: [`bayOffset`](#s-bayOffset) · [`droneWay`](#s-droneWay) · [`hasBay`](#s-hasBay) · [`poseDrone`](#s-poseDrone)
- called by: [`stepHauler`](../drones/npcdrones.js.md#s-stepHauler) _js/drones/npcdrones.js_ · [`stepMiner`](../drones/npcdrones.js.md#s-stepMiner) _js/drones/npcdrones.js_ · [`stepUnit`](../drones/npcdrones.js.md#s-stepUnit) _js/drones/npcdrones.js_ · [`goHome`](../drones/ops.js.md#s-goHome) _js/drones/ops.js_ · [`haulForMiner`](../drones/ops.js.md#s-haulForMiner) _js/drones/ops.js_ · [`stepDocked`](../drones/ops.js.md#s-stepDocked) _js/drones/ops.js_

<!-- note:startDroneBay -->
Start a drone's run through the bay: "in" on docking, "out" on leaving. False if the port has no bay.
<!-- /note -->

### <a id="s-stepDroneBay"></a>`stepDroneBay(u, st, dt)`

function · **exported** · L103–111

- calls: [`hasBay`](#s-hasBay) · [`poseDrone`](#s-poseDrone)
- called by: [`stepUnit`](../drones/npcdrones.js.md#s-stepUnit) _js/drones/npcdrones.js_ · [`stepDocked`](../drones/ops.js.md#s-stepDocked) _js/drones/ops.js_

<!-- note:stepDroneBay -->
Advance a drone's bay run. Returns true while the run is still going.

- L107 · `b.s = Math.min(1, b.s + dt / ((b.which === "in" ? BAY_IN_S : BAY_OUT_S) * 0.66));` — drones are small and quick: two thirds of a hull's time
<!-- /note -->

### <a id="s-poseDrone"></a>`poseDrone(u, st)`

function · L113–117

- calls: [`bayPose`](#s-bayPose) · [`droneWay`](#s-droneWay)
- called by: [`startDroneBay`](#s-startDroneBay) · [`stepDroneBay`](#s-stepDroneBay)

<!-- note:poseDrone -->
<!-- /note -->
