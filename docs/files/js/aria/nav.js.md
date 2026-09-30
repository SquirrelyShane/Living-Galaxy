# js/aria/nav.js

[index](../../../README.md) · 130 lines · 14 symbols · 3 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — ARIA navigating the way a pilot does.

0.3.25. The bot used to hand a destination to the mission executor and hope.
That works right up until the leg is one the core will not take: a world
across the corridor, a well she is sitting inside, a port on the far side of
the star. The executor's own answer to those is to keep trying, which is why
a run could spend twenty minutes at "cruise · 387 km" and then get dropped
for being stuck.

So she flies it the way you do:

  1. LOCK the thing (selectBody — P-LOCK). The lock is what the warp core,
     the cutter and the turrets all read, so a bot that never locks is a bot
     whose guns are pointed at whatever happened to be nearest.
  2. MARK it on the chart, so a human watching the same sky can see where
     she thinks she is going.
  3. Check the corridor. A body inside `losMargin` radii of the line is a
     leg the core refuses; she picks a DOGLEG — a point out to the side of
     the blocker, far enough that both halves are clear — and flies two legs
     instead of failing one.
  4. Climb out of a well before spooling, which the autopilot already does,
     but which has to be in the TIME ESTIMATE or every job looks cheap.

`legSeconds` is the honest cost of a leg: undock, climb, spool, the jump
itself at the sim's own rate, the sublight fall at the end, and the berth.
The old estimate divided distance by a flat cruise number and came out with
3.6 seconds for a leg that takes four minutes, which is why she would take a
400 km mining job over a job at the port she was standing in.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim`, `selectBody`, `addWaypointAt`, `losBlocker`, `wellEdge`, `warpNodeById`, `WARP`, `spoolTime` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../world/bodies.js` | `BODIES`, `bodyPosition`, `dist3` | [js/world/bodies.js](../world/bodies.js.md) |
| 3 | `../station/stations.js` | `stationById` | [js/station/stations.js](../station/stations.js.md) |

## Imported by

- [js/aria/play.js](play.js.md) — `planRoute`, `legSeconds`, `tripSeconds`, `aimAt`, `lockOn`, `markPlace`, `routeLine`, `NAV`
- test/ariasense.test.mjs _(outside js/)_ — `NAV`, `planRoute`, `legSeconds`, `tripSeconds`, `corridorBlocker`, `doglegAround`, `climbOut`, `lockOn`, `markPlace`, `aimAt`, `placeOf`, `routeLine`

## Exports

- [`NAV`](#s-NAV) · const — used by [js/aria/play.js](play.js.md), test/ariasense.test.mjs
- [`placeOf`](#s-placeOf) · function — used by test/ariasense.test.mjs
- [`corridorBlocker`](#s-corridorBlocker) · function — used by test/ariasense.test.mjs
- [`doglegAround`](#s-doglegAround) · function — used by test/ariasense.test.mjs
- [`planRoute`](#s-planRoute) · function — used by [js/aria/play.js](play.js.md), test/ariasense.test.mjs
- [`climbOut`](#s-climbOut) · function — used by test/ariasense.test.mjs
- [`legSeconds`](#s-legSeconds) · function — used by [js/aria/play.js](play.js.md), test/ariasense.test.mjs
- [`tripSeconds`](#s-tripSeconds) · function — used by [js/aria/play.js](play.js.md), test/ariasense.test.mjs
- [`lockOn`](#s-lockOn) · function — used by [js/aria/play.js](play.js.md), test/ariasense.test.mjs
- [`markPlace`](#s-markPlace) · function — used by [js/aria/play.js](play.js.md), test/ariasense.test.mjs
- [`aimAt`](#s-aimAt) · function — used by [js/aria/play.js](play.js.md), test/ariasense.test.mjs
- [`routeLine`](#s-routeLine) · function — used by [js/aria/play.js](play.js.md), test/ariasense.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-NAV"></a>`NAV`

const · **exported** · L5–15

<!-- note:NAV -->
- L6 · `warpRate: 55000,` — u per second in the run, matching sim.js requestJump
- L9 · `sublight: 2200,` — u/s: the honest average of a fall with braking room priced in
- L10 · `climb: 1.25,` — seconds per 1000 u of well to get clear of before a jump
- L11 · `undock: 18,` — clamps off, the push out, the lane
- L12 · `berth: 42,` — the lane in, the gate, the tractor, the clamps
- L13 · `legOverhead: 8,` — align, settle, the core's cooldown between hops
- L14 · `clear: 1.25,` — a dogleg stands this many blocker-radii off the line
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L17–17

<!-- note:_p -->
<!-- /note -->

### <a id="s-_q"></a>`_q`

const · L18–18

<!-- note:_q -->
<!-- /note -->

### <a id="s-placeOf"></a>`placeOf(target)`

function · **exported** · L20–31

- calls: [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_
- via [js/world/bodies.js](../world/bodies.js.md): `BODIES.find`
- called by: [`aimAt`](#s-aimAt) · [`legSeconds`](#s-legSeconds) ×2 · [`markPlace`](#s-markPlace) · [`planRoute`](#s-planRoute)

<!-- note:placeOf -->
Where a thing is right now, whatever kind of thing it is.

- L25 · `const b = BODIES.find((x) => x.id === target);` — bodyPosition answers for an id it has never heard of, so the register is
  what decides whether a name is a place
<!-- /note -->

### <a id="s-corridorBlocker"></a>`corridorBlocker(from, to, ignoreId=)`

function · **exported** · L33–35

- calls: [`losBlocker`](../sim/sim.js.md#s-losBlocker) _js/sim/sim.js_
- called by: [`planRoute`](#s-planRoute)

<!-- note:corridorBlocker -->
---- the corridor ------------------------------------------------------------------

The body sitting across a leg, or null. Same test the core uses.
<!-- /note -->

### <a id="s-doglegAround"></a>`doglegAround(from, to, b)`

function · **exported** · L37–57

- calls: [`losBlocker`](../sim/sim.js.md#s-losBlocker) _js/sim/sim.js_ ×2 · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_
- called by: [`planRoute`](#s-planRoute)

<!-- note:doglegAround -->
A point to fly to first so BOTH halves of the trip are clear of `b`.
Perpendicular to the leg, out past the blocker's own corridor margin.

- L42 · `const rx = _p.x - from.x, ry = _p.y - from.y, rz = _p.z - from.z;` — the blocker's offset from the line, which is the direction to step away in
- L47 · `ox = -uz; oy = 0; oz = ux;` — dead ahead through the middle of it: step "up" out of the ecliptic
- L51 · `const s = -stand / on;` — away from the body, not toward it
<!-- /note -->

### <a id="s-planRoute"></a>`planRoute(to, from=)`

function · **exported** · L59–67

- calls: [`corridorBlocker`](#s-corridorBlocker) · [`doglegAround`](#s-doglegAround) · [`legSeconds`](#s-legSeconds) ×3 · [`placeOf`](#s-placeOf)
- called by: [`tripSeconds`](#s-tripSeconds) · [`jobSeconds`](play.js.md#s-jobSeconds) _js/aria/play.js_ · [`legsTo`](play.js.md#s-legsTo) _js/aria/play.js_ · [`startRoute`](play.js.md#s-startRoute) _js/aria/play.js_ ×2 · [`startSupply`](play.js.md#s-startSupply) _js/aria/play.js_ ×2

<!-- note:planRoute -->
How to get from here to there.
  → { legs: [{ x, y, z, name, kind, id? }], blocked, why, secs }
One leg when the corridor is clear, two when something is across it, and
`blocked` when nothing clears it — which is an answer, not a failure: the
caller picks different work instead of flying at a planet for ten minutes.
<!-- /note -->

### <a id="s-climbOut"></a>`climbOut(from=)`

function · **exported** · L69–74

- calls: [`wellEdge`](../sim/sim.js.md#s-wellEdge) _js/sim/sim.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- called by: [`legSeconds`](#s-legSeconds)

<!-- note:climbOut -->
---- what a leg really costs --------------------------------------------------------

The well the hull has to climb out of before the core will hold, in units.
<!-- /note -->

### <a id="s-legSeconds"></a>`legSeconds(from, to, opts=)`

function · **exported** · L76–95

- calls: [`climbOut`](#s-climbOut) · [`placeOf`](#s-placeOf) ×2 · [`spoolTime`](../sim/sim.js.md#s-spoolTime) _js/sim/sim.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_
- called by: [`planRoute`](#s-planRoute) ×3 · [`tripSeconds`](#s-tripSeconds)

<!-- note:legSeconds -->
Seconds for one leg, honestly: the climb out of whatever is holding you, the
spool, the run at the sim's own rate, and the sublight fall at the far end.
`opts.undock` and `opts.berth` add a port call at either end.

- L86 · `s += d / NAV.sublight;` — short enough that the core is not worth spooling
- L91 · `const fall = Math.min(d * 0.12, 18000);` — the jump lands short of the mark and the rest is flown
<!-- /note -->

### <a id="s-tripSeconds"></a>`tripSeconds(to, from=, opts=)`

function · **exported** · L97–103

- calls: [`legSeconds`](#s-legSeconds) · [`planRoute`](#s-planRoute)

<!-- note:tripSeconds -->
A whole trip, port call included.
<!-- /note -->

### <a id="s-lockOn"></a>`lockOn(id)`

function · **exported** · L105–109

- calls: [`selectBody`](../sim/sim.js.md#s-selectBody) _js/sim/sim.js_
- called by: [`aimAt`](#s-aimAt) · [`startJob`](play.js.md#s-startJob) _js/aria/play.js_ ×2

<!-- note:lockOn -->
---- the instruments -----------------------------------------------------------------

P-LOCK: the core, the cutter and the turrets all read this.
<!-- /note -->

### <a id="s-markPlace"></a>`markPlace(name, p)`

function · **exported** · L111–115

- calls: [`placeOf`](#s-placeOf) · [`addWaypointAt`](../sim/sim.js.md#s-addWaypointAt) _js/sim/sim.js_
- called by: [`aimAt`](#s-aimAt) · [`startJob`](play.js.md#s-startJob) _js/aria/play.js_ ×2

<!-- note:markPlace -->
Put it on the chart, so a human in the same sky can see where she is going.
<!-- /note -->

### <a id="s-aimAt"></a>`aimAt(target, label=)`

function · **exported** · L117–123

- calls: [`lockOn`](#s-lockOn) · [`markPlace`](#s-markPlace) · [`placeOf`](#s-placeOf) · [`warpNodeById`](../sim/sim.js.md#s-warpNodeById) _js/sim/sim.js_
- called by: [`startJob`](play.js.md#s-startJob) _js/aria/play.js_ ×2 · [`startRoute`](play.js.md#s-startRoute) _js/aria/play.js_ · [`startSupply`](play.js.md#s-startSupply) _js/aria/play.js_ · [`startYard`](play.js.md#s-startYard) _js/aria/play.js_

<!-- note:aimAt -->
Lock what can be locked and mark the rest — what a pilot does before a leg.
<!-- /note -->

### <a id="s-routeLine"></a>`routeLine(r)`

function · **exported** · L125–128

<!-- note:routeLine -->
For a screen: "round Jupiter, 2 legs, ~4 min".
<!-- /note -->
