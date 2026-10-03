# js/aria/senses.js

[index](../../../README.md) · 216 lines · 16 symbols · 20 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — what ARIA can see.

0.3.25. Until now the bot decided from three numbers: the board, the trade
routes, and how full the hold was. That is not a pilot looking out of a
canopy, it is a spreadsheet with a throttle — and it is why a mining run
would happily buy a hundred girders, why a job was taken at a port whose
smelter had been stalled for ten minutes, and why nobody noticed the
raiders on the belt the job was sending her to.

This is the instrument panel instead. One call builds a SNAPSHOT of the
whole situation from the live sim — the hull, where it is and what is
pulling on it, what is in weapons range, the belt under the nose, every
honest port with its prices, its industry lines and what has stalled on
them, the board, the routes, the traffic and the standing — and everything
downstream reads that snapshot rather than reaching into the world itself.

Two reasons it is a snapshot and not a set of getters. It is CHEAP: the
expensive parts (per-port ledgers, route search) are rebuilt on their own
cadence, not per tick. And it is HONEST: every decision in one think is made
against one consistent picture of the sky, the way a pilot decides from what
the panel said when they looked at it.

Nothing here mutates anything. If a field is missing the sky did not have
it, which is a fact and not an error.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim`, `losBlocker`, `sellPriceAt`, `buyPriceAt`, `currentShipId` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../station/stations.js` | `stations`, `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 3 | `../world/bodies.js` | `BODIES`, `bodyPosition`, `currentSystem`, `dist3` | [js/world/bodies.js](../world/bodies.js.md) |
| 4 | `../world/scale.js` | `wellRadius` | [js/world/scale.js](../world/scale.js.md) |
| 5 | `../economy/economy.js` | `econReport`, `stockOf` **unused**, `shortagesOf` **unused**, `wantsOf` | [js/economy/economy.js](../economy/economy.js.md) |
| 6 | `../world/field.js` | `nearbyRocks`, `inBelt`, `depleted` | [js/world/field.js](../world/field.js.md) |
| 7 | `../flight/turrets.js` | `contacts` | [js/flight/turrets.js](../flight/turrets.js.md) |
| 8 | `../npc/traffic.js` | `traffic`, `HOSTILE_ROLES` | [js/npc/traffic.js](../npc/traffic.js.md) |
| 9 | `../npc/flow.js` | `flow` | [js/npc/flow.js](../npc/flow.js.md) |
| 10 | `../npc/rogues.js` | `nests` | [js/npc/rogues.js](../npc/rogues.js.md) |
| 11 | `../corp/corps.js` | `corps`, `corpOfStation`, `standingLabel` | [js/corp/corps.js](../corp/corps.js.md) |
| 12 | `../flight/ship.js` | `holdRoom`, `batteryCap` | [js/flight/ship.js](../flight/ship.js.md) |
| 13 | `../flight/repair.js` | `hullMaxOf`, `repairsAt`, `pricePerPoint` | [js/flight/repair.js](../flight/repair.js.md) |
| 14 | `../ships/shipdb.js` | `shipById` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 15 | `../economy/materials.js` | `goodName`, `bulkOf` | [js/economy/materials.js](../economy/materials.js.md) |
| 16 | `../economy/sites.js` | `sites`, `sitesNear` | [js/economy/sites.js](../economy/sites.js.md) |
| 17 | `../economy/contracts.js` | `boardByCategory` | [js/economy/contracts.js](../economy/contracts.js.md) |
| 18 | `../economy/traderoutes.js` | `tradeRoutes` | [js/economy/traderoutes.js](../economy/traderoutes.js.md) |
| 19 | `../economy/chains.js` | `chainReport` | [js/economy/chains.js](../economy/chains.js.md) |
| 20 | `../economy/materials.js` | `SECTORS` | [js/economy/materials.js](../economy/materials.js.md) |

## Imported by

- [js/aria/play.js](play.js.md) — `sense`, `senseSpace`, `senseLine`, `forgetSenses`, `unpostedWork`
- test/ariasense.test.mjs _(outside js/)_ — `SENSE`, `sense`, `senseHull`, `senseSpace`, `sensePorts`, `senseBoard`, `senseRoutes`, `senseLine`, `forgetSenses`, `unpostedWork`, `nearestReachablePort`

## Exports

- [`SENSE`](#s-SENSE) · const — used by test/ariasense.test.mjs
- [`forgetSenses`](#s-forgetSenses) · function — used by [js/aria/play.js](play.js.md), test/ariasense.test.mjs
- [`senseHull`](#s-senseHull) · function — used by test/ariasense.test.mjs
- [`senseSpace`](#s-senseSpace) · function — used by [js/aria/play.js](play.js.md), test/ariasense.test.mjs
- [`sensePorts`](#s-sensePorts) · function — used by test/ariasense.test.mjs
- [`senseBoard`](#s-senseBoard) · function — used by test/ariasense.test.mjs
- [`senseRoutes`](#s-senseRoutes) · function — used by test/ariasense.test.mjs
- [`sense`](#s-sense) · function — used by [js/aria/play.js](play.js.md), test/ariasense.test.mjs
- [`nearestReachablePort`](#s-nearestReachablePort) · function — used by test/ariasense.test.mjs
- [`unpostedWork`](#s-unpostedWork) · function — used by [js/aria/play.js](play.js.md), test/ariasense.test.mjs
- [`senseLine`](#s-senseLine) · function — used by [js/aria/play.js](play.js.md), test/ariasense.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-SENSE"></a>`SENSE`

const · **exported** · L22–28

<!-- note:SENSE -->
How stale each layer is allowed to get, in sim seconds.

- L23 · `hull: 0,` — every look
- L24 · `space: 2,` — what is around the hull
- L25 · `ports: 20,` — ledgers and prices: the economy ticks every 20 s anyway
- L26 · `board: 45,` — the desk re-posts every 480 s; 45 is plenty
<!-- /note -->

### <a id="s-cache"></a>`cache`

const · L30–30

<!-- note:cache -->
<!-- /note -->

### <a id="s-fresh"></a>`fresh(k)`

function · L31–31

- called by: [`senseBoard`](#s-senseBoard) · [`sensePorts`](#s-sensePorts) · [`senseRoutes`](#s-senseRoutes) · [`senseSpace`](#s-senseSpace)

<!-- note:fresh -->
<!-- /note -->

### <a id="s-keep"></a>`keep(k, v)`

function · L32–32

- called by: [`senseBoard`](#s-senseBoard) · [`sensePorts`](#s-sensePorts) · [`senseRoutes`](#s-senseRoutes) · [`senseSpace`](#s-senseSpace)

<!-- note:keep -->
<!-- /note -->

### <a id="s-forgetSenses"></a>`forgetSenses()`

function · **exported** · L34–37

- called by: [`beginPlay`](play.js.md#s-beginPlay) _js/aria/play.js_

<!-- note:forgetSenses -->
Drop everything: a new sky, a new hull, a new run.
<!-- /note -->

### <a id="s-honest"></a>`honest(st)`

function · L39–39

- called by: [`sensePorts`](#s-sensePorts)

<!-- note:honest -->
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L40–40

<!-- note:_p -->
<!-- /note -->

### <a id="s-senseHull"></a>`senseHull()`

function · **exported** · L42–67

- calls: [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`hullMaxOf`](../flight/repair.js.md#s-hullMaxOf) _js/flight/repair.js_ · [`batteryCap`](../flight/ship.js.md#s-batteryCap) _js/flight/ship.js_ · [`holdRoom`](../flight/ship.js.md#s-holdRoom) _js/flight/ship.js_ · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ · [`currentShipId`](../sim/sim.js.md#s-currentShipId) _js/sim/sim.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ · [`inBelt`](../world/field.js.md#s-inBelt) _js/world/field.js_
- called by: [`sense`](#s-sense)

<!-- note:senseHull -->
---- the hull -------------------------------------------------------------------
<!-- /note -->

### <a id="s-senseSpace"></a>`senseSpace()`

function · **exported** · L69–109

- calls: [`fresh`](#s-fresh) · [`keep`](#s-keep) · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`sitesNear`](../economy/sites.js.md#s-sitesNear) _js/economy/sites.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ ×2 · [`inBelt`](../world/field.js.md#s-inBelt) _js/world/field.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_ · [`wellRadius`](../world/scale.js.md#s-wellRadius) _js/world/scale.js_ ×2
- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`, `traffic.filter`
- via [js/npc/rogues.js](../npc/rogues.js.md): `nests.filter`, `nests.filter.map`, `nests.filter.map.sort`
- via [js/economy/sites.js](../economy/sites.js.md): `sitesNear.map`
- via [js/npc/flow.js](../npc/flow.js.md): `flow.filter`
- called by: [`hostilesClose`](play.js.md#s-hostilesClose) _js/aria/play.js_ · [`sense`](#s-sense)

<!-- note:senseSpace -->
---- the space around it ----------------------------------------------------------

Wells, contacts, rock. `well` is the radius inside which the core will not
hold geometry, which is the thing a pilot actually plans around.
<!-- /note -->

### <a id="s-sensePorts"></a>`sensePorts()`

function · **exported** · L111–141

- calls: [`fresh`](#s-fresh) · [`honest`](#s-honest) · [`keep`](#s-keep) · [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`standingLabel`](../corp/corps.js.md#s-standingLabel) _js/corp/corps.js_ · [`econReport`](../economy/economy.js.md#s-econReport) _js/economy/economy.js_ · [`wantsOf`](../economy/economy.js.md#s-wantsOf) _js/economy/economy.js_ · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ ×2 · [`pricePerPoint`](../flight/repair.js.md#s-pricePerPoint) _js/flight/repair.js_ · [`repairsAt`](../flight/repair.js.md#s-repairsAt) _js/flight/repair.js_ ×2 · [`losBlocker`](../sim/sim.js.md#s-losBlocker) _js/sim/sim.js_ · [`dist3`](../world/bodies.js.md#s-dist3) _js/world/bodies.js_ ×2
- via [js/economy/economy.js](../economy/economy.js.md): `wantsOf.map`
- called by: [`nearestReachablePort`](#s-nearestReachablePort) · [`sense`](#s-sense) · [`senseBoard`](#s-senseBoard) · [`unpostedWork`](#s-unpostedWork)

<!-- note:sensePorts -->
---- the ports --------------------------------------------------------------------

Every honest port: where it is, what it pays, what it is short of, what its
lines are eating and what they have stalled on. A stalled smelter is a
standing order for the thing it stalled on, which is a mining job nobody
posted yet — and knowing that is the difference between a bot that reads a
board and a pilot who reads a port.

- L130 · `lines: e.lines.map((l) => ({ id: l.id, name: l.name, running: l.running, stalledOn: l.stal` — what its factories are doing right now
- L135 · `stock: e.stock.filter((l) => l.qty >= 1).map((l) => ({ id: l.id, name: l.name, qty: l.qty,` — the shelf, priced for one unit — a lot is priced when a lot is proposed
<!-- /note -->

### <a id="s-senseBoard"></a>`senseBoard()`

function · **exported** · L143–155

- calls: [`fresh`](#s-fresh) · [`keep`](#s-keep) · [`sensePorts`](#s-sensePorts) · [`chainReport`](../economy/chains.js.md#s-chainReport) _js/economy/chains.js_ · [`boardByCategory`](../economy/contracts.js.md#s-boardByCategory) _js/economy/contracts.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`sense`](#s-sense)

<!-- note:senseBoard -->
---- the work on offer --------------------------------------------------------------
<!-- /note -->

### <a id="s-senseRoutes"></a>`senseRoutes(opts=)`

function · **exported** · L157–164

- calls: [`fresh`](#s-fresh) · [`keep`](#s-keep) · [`tradeRoutes`](../economy/traderoutes.js.md#s-tradeRoutes) _js/economy/traderoutes.js_
- via [js/economy/traderoutes.js](../economy/traderoutes.js.md): `tradeRoutes.map`
- called by: [`sense`](#s-sense)

<!-- note:senseRoutes -->
<!-- /note -->

### <a id="s-sense"></a>`sense(opts=)`

function · **exported** · L166–177

- calls: [`senseBoard`](#s-senseBoard) · [`senseHull`](#s-senseHull) · [`sensePorts`](#s-sensePorts) · [`senseRoutes`](#s-senseRoutes) · [`senseSpace`](#s-senseSpace)
- via [js/corp/corps.js](../corp/corps.js.md): `corps.map`, `corps.map.sort`
- called by: [`startSupply`](play.js.md#s-startSupply) _js/aria/play.js_ · [`senseLine`](#s-senseLine)

<!-- note:sense -->
---- the whole panel ----------------------------------------------------------------

One consistent picture of the sky. Everything downstream reads this.
<!-- /note -->

### <a id="s-nearestReachablePort"></a>`nearestReachablePort(s=, except=)`

function · **exported** · L179–182

- calls: [`sensePorts`](#s-sensePorts)

<!-- note:nearestReachablePort -->
---- reading the panel ---------------------------------------------------------------

The port nearest the hull that a leg can actually be flown to.
<!-- /note -->

### <a id="s-unpostedWork"></a>`unpostedWork(s=, room=, purse=)`

function · **exported** · L184–208

- calls: [`sensePorts`](#s-sensePorts) · [`bulkOf`](../economy/materials.js.md#s-bulkOf) _js/economy/materials.js_ · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`holdRoom`](../flight/ship.js.md#s-holdRoom) _js/flight/ship.js_ · [`buyPriceAt`](../sim/sim.js.md#s-buyPriceAt) _js/sim/sim.js_ · [`sellPriceAt`](../sim/sim.js.md#s-sellPriceAt) _js/sim/sim.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×2
- called by: [`startSupply`](play.js.md#s-startSupply) _js/aria/play.js_

<!-- note:unpostedWork -->
What a port would pay over the odds for, that somebody else has on the
shelf: a stalled line is a standing order nobody has posted yet.
<!-- /note -->

### <a id="s-senseLine"></a>`senseLine(s=)`

function · **exported** · L210–214

- calls: [`sense`](#s-sense)
- called by: [`playReport`](play.js.md#s-playReport) _js/aria/play.js_

<!-- note:senseLine -->
One line a terminal can print: what she is looking at.
<!-- /note -->
