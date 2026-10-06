# js/npc/lanes.js

[index](../../../README.md) · 142 lines · 29 symbols · 0 imports · 11 importers

## About

<!-- note:@file -->
LIVING GALAXY — port traffic lanes.

Every port runs two lanes out into open space from its hangar mouth: an
ENTRY lane and an EXIT lane, side by side, so inbound hulls never meet
outbound ones head-on. A lane is a string of marker beads from the mouth
out to LANE_U; a runner light chases along it — outward on the exit lane,
inward on the entry lane — so from ten kilometres out you can read which
way each lane flows.

The lanes are a FUNNEL. At the mouth the three ways of each lane are as
close as the hangar's own floor strips (a few units apart) and the entry
and exit lanes sit in the two halves of one aperture; by FUNNEL_U out they
have spread to the full highway spacing and stay there to the far gate.
Ships fly the wide lane in, and the lane gathers them into the mouth.

Lanes are short: LANE_U out from the mouth (5 km), and the engine draws a
rig only when the hull is inside LANE_DRAW_R of the lane itself — they are
the last approach, not scenery. The tractor pulls arrivals in by the ENTRY
door and pushes departures out by the EXIT door, releasing at RELEASE_U up
the exit lane, past the funnel and outside its own reach.

The lane frame is fixed in the sky: the station generator holds the hull
still and the mouth's direction is deterministic in the seed, so every
client agrees. A port without a built hangar (test fixtures) falls back to
a frame off its seed. Pure data — nothing here touches three.js.

- L1 · `export const LANE_U = 500;` — mouth → far gate, world units (5 km: the last approach, not a highway across the system)
- L2 · `export const LANE_BEADS = 24;` — marker beads per lane
- L3 · `export const LANE_GAP_K = 3.2;` — far-field lane centreline offset, in port radii
- L4 · `export const LANE_RUN_S = 4.5;` — seconds for the runner to cover the lane
- L5 · `export const LANE_TRAIL = 4;` — beads lit behind the runner
- L6 · `export const LANE_HALF_W = 90;` — how far off a lane-way's centreline still counts as "in it" (far field)
- L7 · `export const SUBLANES = 3;` — lane-ways per direction: three in, three out
- L8 · `export const SUBLANE_GAP = 140;` — far-field centre-to-centre spacing of the lane-ways
- L9 · `export const ZONE_HALF_H = 110;` — the coloured zone's half height (far field)
- L10 · `export const ZONE_HALF_W = SUBLANE_GAP * SUBLANES * 0.5;` — and half width (covers all three ways)
- L11 · `export const FUNNEL_U = 0.45;` — fraction of the lane over which the funnel opens
- L12 · `export const LANE_DRAW_R = 500;` — the rig is only drawn inside this of the lane itself (5 km)
- L13 · `export const RELEASE_U = 0.65;` — where the departure push lets go: past the funnel, outside the tractor's reach
<!-- /note -->

## Imports

_none_

## Imported by

- [js/flight/autopilot.js](../flight/autopilot.js.md) — `lanePoint`
- [js/npc/bay.js](bay.js.md) — `lanePoint`, `SUBLANES`
- [js/npc/flow.js](flow.js.md) — `stationLane`, `laneAt`, `SUBLANES`, `LANE_U`
- [js/npc/traffic.js](traffic.js.md) — `stationLane`, `subLaneFor`, `laneAt`, `LANE_U`
- [js/render/engine.js](../render/engine.js.md) — `stationLane`, `lanePoint`, `laneCentre`, `spreadAt`, `beadLit`, `laneDistance`, `LANE_BEADS`, `LANE_DRAW_R`, `SUBLANES`, `ZONE_HALF_W`, `ZONE_HALF_H`
- [js/sim/sim.js](../sim/sim.js.md) — `laneOf`, `laneFlow`, `stationLane`
- [js/station/stationworks.js](../station/stationworks.js.md) — `laneOf`, `lanePoint`, `stationLane`, `FUNNEL_U`, `RELEASE_U`
- test/bay.test.mjs _(outside js/)_ — `lanePoint`
- test/performance-upgrade.test.mjs _(outside js/)_ — `stationLane`, `lanePoint`, `laneCentre`, `subLaneOffset`, `spreadAt`
- test/sky.test.mjs _(outside js/)_ — `stationLane`, `lanePoint`, `laneOf`, `runnerIndex`, `beadLit`, `LANE_BEADS`, `LANE_U`
- test/sky.test.mjs _(outside js/)_ — `subLaneFor`, `subLaneOffset`, `SUBLANES`, `SUBLANE_GAP`, `ZONE_HALF_W`, `laneFlow`

## Exports

- [`LANE_U`](#s-LANE_U) · const — used by [js/npc/flow.js](flow.js.md), [js/npc/traffic.js](traffic.js.md), test/sky.test.mjs
- [`LANE_BEADS`](#s-LANE_BEADS) · const — used by [js/render/engine.js](../render/engine.js.md), test/sky.test.mjs
- [`LANE_GAP_K`](#s-LANE_GAP_K) · const — **no importer in scanned roots**
- [`LANE_RUN_S`](#s-LANE_RUN_S) · const — **no importer in scanned roots**
- [`LANE_TRAIL`](#s-LANE_TRAIL) · const — **no importer in scanned roots**
- [`LANE_HALF_W`](#s-LANE_HALF_W) · const — **no importer in scanned roots**
- [`SUBLANES`](#s-SUBLANES) · const — used by [js/npc/bay.js](bay.js.md), [js/npc/flow.js](flow.js.md), [js/render/engine.js](../render/engine.js.md), test/sky.test.mjs
- [`SUBLANE_GAP`](#s-SUBLANE_GAP) · const — used by test/sky.test.mjs
- [`ZONE_HALF_H`](#s-ZONE_HALF_H) · const — used by [js/render/engine.js](../render/engine.js.md)
- [`ZONE_HALF_W`](#s-ZONE_HALF_W) · const — used by [js/render/engine.js](../render/engine.js.md), test/sky.test.mjs
- [`FUNNEL_U`](#s-FUNNEL_U) · const — used by [js/station/stationworks.js](../station/stationworks.js.md)
- [`LANE_DRAW_R`](#s-LANE_DRAW_R) · const — used by [js/render/engine.js](../render/engine.js.md)
- [`RELEASE_U`](#s-RELEASE_U) · const — used by [js/station/stationworks.js](../station/stationworks.js.md)
- [`stationLane`](#s-stationLane) · function — used by [js/npc/flow.js](flow.js.md), [js/npc/traffic.js](traffic.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationworks.js](../station/stationworks.js.md), test/performance-upgrade.test.mjs, test/sky.test.mjs
- [`subLaneOffset`](#s-subLaneOffset) · function — used by test/performance-upgrade.test.mjs, test/sky.test.mjs
- [`subLaneFor`](#s-subLaneFor) · function — used by [js/npc/traffic.js](traffic.js.md), test/sky.test.mjs
- [`funnel`](#s-funnel) · function — **no importer in scanned roots**
- [`spreadAt`](#s-spreadAt) · function — used by [js/render/engine.js](../render/engine.js.md), test/performance-upgrade.test.mjs
- [`laneCentre`](#s-laneCentre) · function — used by [js/render/engine.js](../render/engine.js.md), test/performance-upgrade.test.mjs
- [`lanePoint`](#s-lanePoint) · function — used by [js/flight/autopilot.js](../flight/autopilot.js.md), [js/npc/bay.js](bay.js.md), [js/render/engine.js](../render/engine.js.md), [js/station/stationworks.js](../station/stationworks.js.md), test/bay.test.mjs, test/performance-upgrade.test.mjs, test/sky.test.mjs
- [`laneAt`](#s-laneAt) · function — used by [js/npc/flow.js](flow.js.md), [js/npc/traffic.js](traffic.js.md)
- [`runnerIndex`](#s-runnerIndex) · function — used by test/sky.test.mjs
- [`beadLit`](#s-beadLit) · function — used by [js/render/engine.js](../render/engine.js.md), test/sky.test.mjs
- [`laneOf`](#s-laneOf) · function — used by [js/sim/sim.js](../sim/sim.js.md), [js/station/stationworks.js](../station/stationworks.js.md), test/sky.test.mjs
- [`laneDistance`](#s-laneDistance) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`laneFlow`](#s-laneFlow) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/sky.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-LANE_U"></a>`LANE_U`

const · **exported** · L1–1

<!-- note:LANE_U -->
<!-- /note -->

### <a id="s-LANE_BEADS"></a>`LANE_BEADS`

const · **exported** · L2–2

<!-- note:LANE_BEADS -->
<!-- /note -->

### <a id="s-LANE_GAP_K"></a>`LANE_GAP_K`

const · **exported** · L3–3

<!-- note:LANE_GAP_K -->
<!-- /note -->

### <a id="s-LANE_RUN_S"></a>`LANE_RUN_S`

const · **exported** · L4–4

<!-- note:LANE_RUN_S -->
<!-- /note -->

### <a id="s-LANE_TRAIL"></a>`LANE_TRAIL`

const · **exported** · L5–5

<!-- note:LANE_TRAIL -->
<!-- /note -->

### <a id="s-LANE_HALF_W"></a>`LANE_HALF_W`

const · **exported** · L6–6

<!-- note:LANE_HALF_W -->
<!-- /note -->

### <a id="s-SUBLANES"></a>`SUBLANES`

const · **exported** · L7–7

<!-- note:SUBLANES -->
<!-- /note -->

### <a id="s-SUBLANE_GAP"></a>`SUBLANE_GAP`

const · **exported** · L8–8

<!-- note:SUBLANE_GAP -->
<!-- /note -->

### <a id="s-ZONE_HALF_H"></a>`ZONE_HALF_H`

const · **exported** · L9–9

<!-- note:ZONE_HALF_H -->
<!-- /note -->

### <a id="s-ZONE_HALF_W"></a>`ZONE_HALF_W`

const · **exported** · L10–10

<!-- note:ZONE_HALF_W -->
<!-- /note -->

### <a id="s-FUNNEL_U"></a>`FUNNEL_U`

const · **exported** · L11–11

<!-- note:FUNNEL_U -->
<!-- /note -->

### <a id="s-LANE_DRAW_R"></a>`LANE_DRAW_R`

const · **exported** · L12–12

<!-- note:LANE_DRAW_R -->
<!-- /note -->

### <a id="s-RELEASE_U"></a>`RELEASE_U`

const · **exported** · L13–13

<!-- note:RELEASE_U -->
<!-- /note -->

### <a id="s-cache"></a>`cache`

const · L15–15

<!-- note:cache -->
<!-- /note -->

### <a id="s-stationLane"></a>`stationLane(st)`

function · **exported** · L17–43

- calls: [`stationLane>far`](#s-stationLane-far) ×2
- called by: [`flowPose`](flow.js.md#s-flowPose) _js/npc/flow.js_ · [`laneDistance`](#s-laneDistance) · [`laneOf`](#s-laneOf) · [`lanePoint`](#s-lanePoint) · [`routePose`](traffic.js.md#s-routePose) _js/npc/traffic.js_ ×2 · [`stepHullOnce`](traffic.js.md#s-stepHullOnce) _js/npc/traffic.js_ · [`mountGame>makeLanes`](../render/engine.js.md#s-mountGame-makeLanes) _js/render/engine.js_ · [`stepLaneDiscipline`](../sim/sim.js.md#s-stepLaneDiscipline) _js/sim/sim.js_ · [`engagePush`](../station/stationworks.js.md#s-engagePush) _js/station/stationworks.js_ · [`outboundSpeed`](../station/stationworks.js.md#s-outboundSpeed) _js/station/stationworks.js_

<!-- note:stationLane -->
Lane frame for a port: unit direction, side, up, the near (mouth) and far offsets of both lanes.

- L26 · `entry: p.entry, exit: p.exit,` — at the mouth
- L27 · `farEntry: far(-1), farExit: far(1),` — past the funnel
- L28 · `nearK: p.wayGap / SUBLANE_GAP,` — how tight the ways are at the mouth
- L29 · `nearH: p.halfH / ZONE_HALF_H,` — and the zone
<!-- /note -->

#### <a id="s-stationLane-far"></a>`stationLane>far(sgn)`

function · L23–23

- called by: [`stationLane`](#s-stationLane) ×2

<!-- note:stationLane>far -->
<!-- /note -->

### <a id="s-subLaneOffset"></a>`subLaneOffset(k)`

function · **exported** · L45–47

- called by: [`laneOf`](#s-laneOf) · [`lanePoint`](#s-lanePoint)

<!-- note:subLaneOffset -->
Lateral offset (far field, world units along `side`) of lane-way `k` (0..SUBLANES-1) within a lane.
<!-- /note -->

### <a id="s-subLaneFor"></a>`subLaneFor(id)`

function · **exported** · L49–54

- called by: [`buildRoster`](traffic.js.md#s-buildRoster) _js/npc/traffic.js_ · [`poseBay`](traffic.js.md#s-poseBay) _js/npc/traffic.js_ · [`routePose`](traffic.js.md#s-routePose) _js/npc/traffic.js_ · [`spawnVessel`](traffic.js.md#s-spawnVessel) _js/npc/traffic.js_ · [`stepHullOnce`](traffic.js.md#s-stepHullOnce) _js/npc/traffic.js_ ×4

<!-- note:subLaneFor -->
Which lane-way a hull uses, off its id — stable for the hull's whole life.
<!-- /note -->

### <a id="s-funnel"></a>`funnel(u)`

function · **exported** · L56–59

- called by: [`laneCentre`](#s-laneCentre) · [`lanePoint`](#s-lanePoint) · [`spreadAt`](#s-spreadAt)

<!-- note:funnel -->
How far open the funnel is at `u` along the lane: 0 at the mouth, 1 past FUNNEL_U.
<!-- /note -->

### <a id="s-spreadAt"></a>`spreadAt(f, u)`

function · **exported** · L61–65

- calls: [`funnel`](#s-funnel)
- called by: [`laneOf`](#s-laneOf) · [`mountGame>makeLanes`](../render/engine.js.md#s-mountGame-makeLanes) _js/render/engine.js_ · [`mountGame>makeLanes>edge`](../render/engine.js.md#s-mountGame-makeLanes-edge) _js/render/engine.js_

<!-- note:spreadAt -->
The lane-way spacing multiplier and zone scale at `u`.
<!-- /note -->

### <a id="s-laneCentre"></a>`laneCentre(f, which, u, out=)`

function · **exported** · L67–75

- calls: [`funnel`](#s-funnel)
- called by: [`laneOf`](#s-laneOf) · [`lanePoint`](#s-lanePoint) · [`mountGame>makeLanes`](../render/engine.js.md#s-mountGame-makeLanes) _js/render/engine.js_ · [`mountGame>makeLanes>edge`](../render/engine.js.md#s-mountGame-makeLanes-edge) _js/render/engine.js_

<!-- note:laneCentre -->
The lane's centreline offset (from the station centre) at `u`.
<!-- /note -->

### <a id="s-_c"></a>`_c`

const · L77–77

<!-- note:_c -->
<!-- /note -->

### <a id="s-lanePoint"></a>`lanePoint(st, which, u, out=, k=)`

function · **exported** · L78–87

- calls: [`funnel`](#s-funnel) · [`laneCentre`](#s-laneCentre) · [`stationLane`](#s-stationLane) · [`subLaneOffset`](#s-subLaneOffset)
- called by: [`apDock`](../flight/autopilot.js.md#s-apDock) _js/flight/autopilot.js_ ×2 · [`controls`](bay.js.md#s-controls) _js/npc/bay.js_ · [`entryDoor`](bay.js.md#s-entryDoor) _js/npc/bay.js_ · [`laneAt`](#s-laneAt) · [`mountGame>makeLanes`](../render/engine.js.md#s-mountGame-makeLanes) _js/render/engine.js_ ×2 · [`engagePush`](../station/stationworks.js.md#s-engagePush) _js/station/stationworks.js_

<!-- note:lanePoint -->
World point on a lane: `which` is "entry" | "exit", `u` 0 at the mouth, 1 at the far gate,
`k` the lane-way (default: the centre one).
<!-- /note -->

### <a id="s-laneAt"></a>`laneAt(st, which, dist, k=, out=)`

function · **exported** · L89–91

- calls: [`lanePoint`](#s-lanePoint)
- called by: [`flowPose`](flow.js.md#s-flowPose) _js/npc/flow.js_ ×2 · [`routePose`](traffic.js.md#s-routePose) _js/npc/traffic.js_ ×2 · [`stepHullOnce`](traffic.js.md#s-stepHullOnce) _js/npc/traffic.js_ ×4

<!-- note:laneAt -->
The same by distance from the mouth (may run past the far gate: hulls drop out of warp beyond it).
<!-- /note -->

### <a id="s-runnerIndex"></a>`runnerIndex(t, which)`

function · **exported** · L93–97

- called by: [`beadLit`](#s-beadLit)

<!-- note:runnerIndex -->
Which bead the runner is on right now, 0..LANE_BEADS-1 in the direction of flow.
<!-- /note -->

### <a id="s-beadLit"></a>`beadLit(t, which, i)`

function · **exported** · L99–104

- calls: [`runnerIndex`](#s-runnerIndex)
- called by: [`mountGame>updateLanes`](../render/engine.js.md#s-mountGame-updateLanes) _js/render/engine.js_

<!-- note:beadLit -->
Brightness of bead `i` on a lane at time `t`: 1 on the runner, fading over the trail, 0 off.
<!-- /note -->

### <a id="s-laneOf"></a>`laneOf(st, p)`

function · **exported** · L106–131

- calls: [`laneCentre`](#s-laneCentre) · [`spreadAt`](#s-spreadAt) · [`stationLane`](#s-stationLane) · [`subLaneOffset`](#s-subLaneOffset)
- called by: [`stepLaneDiscipline`](../sim/sim.js.md#s-stepLaneDiscipline) _js/sim/sim.js_ · [`approachOf`](../station/stationworks.js.md#s-approachOf) _js/station/stationworks.js_ · [`inDeparture`](../station/stationworks.js.md#s-inDeparture) _js/station/stationworks.js_

<!-- note:laneOf -->
Where a point sits relative to a port's lanes: { which, way, u, off, along }
for the lane-way it is in, or null if it is outside every zone. `off` is
the lateral distance from that way's centreline, `along` the distance
from the mouth in world units.

- L114 · `if (along < -backR || along > f.length * 1.5 + 200) continue;` — hulls drop out of warp a little past the far gate
<!-- /note -->

### <a id="s-laneDistance"></a>`laneDistance(st, p)`

function · **exported** · L133–140

- calls: [`stationLane`](#s-stationLane)
- called by: [`mountGame>updateLanes`](../render/engine.js.md#s-mountGame-updateLanes) _js/render/engine.js_

<!-- note:laneDistance -->
Distance from a point to the lane rig: to the axis from the mouth to the far gate, less the rig's own half-extent
(both lanes and their zones sit within gap + ZONE_HALF_W of the axis). 0 anywhere inside the rig.
<!-- /note -->

### <a id="s-laneFlow"></a>`laneFlow(which)`

function · **exported** · L142–142

- called by: [`stepLaneDiscipline`](../sim/sim.js.md#s-stepLaneDiscipline) _js/sim/sim.js_

<!-- note:laneFlow -->
Direction of travel a lane expects: +1 along `dir` on the exit lane, −1 on the entry lane.
<!-- /note -->
