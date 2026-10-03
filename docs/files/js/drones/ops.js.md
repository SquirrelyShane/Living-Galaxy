# js/drones/ops.js

[index](../../../README.md) · 945 lines · 88 symbols · 22 imports · 6 importers

## About

<!-- note:@file -->
LIVING GALAXY — drone operations.

Your work drones: built at a port whose lines make that role (roles.js),
set up with a few questions when they roll off the line, then left to work
on sim time — so TIME ×8 and ×40 fast-forward them like everything else.

Every drone is a small state machine over the same world the ships fly in:
real stations (their live positions, stock and lockers), real belt rocks
(field.js — the same key a rock wears down under your own cutter), real
debris chunks, real pirates on the timetable. Near you the fights are real
rounds (turrets.js); out of contact range they resolve on the numbers.

  state        what it is doing: setup · outbound · working · returning ·
               docked · waiting · holding · patrol · engage · following
  home         the port it docks at, stashes into (sim.stash) and repairs at
  site         where it works: a mark, a vein, a belt band, a world
  mode         the role's orders (passive haul, patrol, gas, route …)
  guard        a slot it looks after: your ship, a drone, a port, a mark

A drone is company property: you need a charter (company.js) before a port
will build you one, the treasury pays for it, and everything it earns —
freight, bounties, a courier's margin — lands in the treasury. Freight is
taken off the shared work board (board.js), so a slot your hauler holds is
one an NPC corporation's drone or a crewed hull cannot.

Reports go to the chat bus (channel "drones"); kills and big finds also go
to GNN's contractors desk. Saved per sky and callsign in localStorage.

- L22 · `import { claim as settleClaim, insure, droneKey, premiumFor, TIER_BY_ID, release as dropPo` — `claim` is already the freight board's — the underwriter's is aliased
- L24 · `export const FREIGHT_RATE = BOARD_RATE;` — of the buyer's bid, per unit hauled, paid to the company (board.js)
- L25 · `export const BOUNTY_DRONE = 180;` — what the charters pay when your drone downs a pirate out of your sight
- L26 · `export const THREAT_R = 1400;` — inside this a raider is shooting at a drone
- L27 · `const STEP = 0.5;` — sim-seconds per substep
- L142 · `registerAnchor("drone", (a, t, out) => { const u = unitById(a.id); if (!u) return null; ou` — 0.3.67: a MARK on a drone follows the drone (and turns "last seen" when it is lost or scrapped)
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim`, `logEvent`, `addWaypointAt`, `addAnchoredWaypoint`, `waypointPosition` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../world/anchors.js` | `registerAnchor` | [js/world/anchors.js](../world/anchors.js.md) |
| 3 | `../flight/ship.js` | `cargoTotal` | [js/flight/ship.js](../flight/ship.js.md) |
| 4 | `../station/stations.js` | `stations`, `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 5 | `../world/field.js` | `nearbyRocks`, `wearRock`, `depleted`, `CELL` | [js/world/field.js](../world/field.js.md) |
| 6 | `../world/bodies.js` | `BODIES`, `bodyPosition`, `currentSystem` | [js/world/bodies.js](../world/bodies.js.md) |
| 7 | `../world/debris.js` | `chunks`, `removeChunk`, `chunkMass`, `burst` | [js/world/debris.js](../world/debris.js.md) |
| 8 | `../world/hulks.js` | `spawnHulk` | [js/world/hulks.js](../world/hulks.js.md) |
| 9 | `../npc/traffic.js` | `traffic`, `HOSTILE_ROLES`, `markVesselDown` | [js/npc/traffic.js](../npc/traffic.js.md) |
| 10 | `../npc/battles.js` | `pirateKilled` | [js/npc/battles.js](../npc/battles.js.md) |
| 11 | `../flight/turrets.js` | `contacts`, `contactById`, `fireRound` | [js/flight/turrets.js](../flight/turrets.js.md) |
| 12 | `../economy/economy.js` | `stockOf`, `lift`, `deliver`, `askPrice`, `bidPrice`, `shortagesOf` | [js/economy/economy.js](../economy/economy.js.md) |
| 13 | `../economy/materials.js` | `goodName` | [js/economy/materials.js](../economy/materials.js.md) |
| 14 | `./dronespec.js` | `droneSummary` | [js/drones/dronespec.js](dronespec.js.md) |
| 15 | `../flight/probes.js` | `assayPoint`, `fileReport` | [js/flight/probes.js](../flight/probes.js.md) |
| 16 | `../comms/chat.js` | `post` | [js/comms/chat.js](../comms/chat.js.md) |
| 17 | `../comms/gnn.js` | `gnnPost` | [js/comms/gnn.js](../comms/gnn.js.md) |
| 18 | `../npc/bay.js` | `droneDoorGoal`, `startDroneBay`, `stepDroneBay` | [js/npc/bay.js](../npc/bay.js.md) |
| 19 | `./roles.js` | `DRONE_ROLES`, `DRONE_CAP`, `LANE_SPEED`, `NEAR_SPEED`, `LANE_OVER`, `JUMP_SPEED`, `JUMP_OVER`, `DOCK_SECS`, `PRICE_K`, `rolesAt` | [js/drones/roles.js](roles.js.md) |
| 20 | `../corp/company.js` | `company`, `hasCompany`, `treasuryPay`, `treasuryEarn` | [js/corp/company.js](../corp/company.js.md) |
| 21 | `./board.js` | `openFreight`, `claim`, `touch`, `release`, `releaseAll`, `freightKey`, `FREIGHT_RATE` as `BOARD_RATE` | [js/drones/board.js](board.js.md) |
| 22 | `../economy/insurance.js` | `claim` as `settleClaim`, `insure`, `droneKey`, `premiumFor`, `TIER_BY_ID`, `release` as `dropPolicy` | [js/economy/insurance.js](../economy/insurance.js.md) |

## Imported by

- [js/aria/pilot.js](../aria/pilot.js.md) — `buildOptions`, `orderBuild`
- [js/console/console.js](../console/console.js.md) — `droneOps`
- [js/console/panels/work-drones.js](../console/panels/work-drones.js.md) — `droneOps`, `buildOptions`, `orderBuild`, `queueAt`, `setHome`, `setSite`, `setMode`, `setGuard`, `addPatrol`, `clearPatrol`, `assignSlot`, `setRoute`, `beginWork`, `recall`, `scrapDrone`, `homeOptions`, `siteOptions`, `haulSlots`, `guardSlots`, `tradeRoutes`, `patrolOptions`, `statusLine`, `pendingAsks`, `holdOf`
- [js/render/engine.js](../render/engine.js.md) — `droneOps`
- [js/sim/sim.js](../sim/sim.js.md) — `stepDroneOps`, `loadDroneOps`, `noteDroneKill`
- [js/station/stationdeck.js](../station/stationdeck.js.md) — `droneOps`, `buildOptions`, `orderBuild`, `queueAt`, `unitsHomedAt`, `statusLine`, `pendingAsks`, `beginWork`

## Exports

- [`FREIGHT_RATE`](#s-FREIGHT_RATE) · const — **no importer in scanned roots**
- [`BOUNTY_DRONE`](#s-BOUNTY_DRONE) · const — **no importer in scanned roots**
- [`THREAT_R`](#s-THREAT_R) · const — **no importer in scanned roots**
- [`droneOps`](#s-droneOps) · const — used by [js/console/console.js](../console/console.js.md), [js/console/panels/work-drones.js](../console/panels/work-drones.js.md), [js/render/engine.js](../render/engine.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md)
- [`posOf`](#s-posOf) · function — **no importer in scanned roots**
- [`priceOf`](#s-priceOf) · function — **no importer in scanned roots**
- [`buildOptions`](#s-buildOptions) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/console/panels/work-drones.js](../console/panels/work-drones.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md)
- [`orderBuild`](#s-orderBuild) · function — used by [js/aria/pilot.js](../aria/pilot.js.md), [js/console/panels/work-drones.js](../console/panels/work-drones.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md)
- [`queueAt`](#s-queueAt) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md)
- [`unitById`](#s-unitById) · function — **no importer in scanned roots**
- [`unitsHomedAt`](#s-unitsHomedAt) · function — used by [js/station/stationdeck.js](../station/stationdeck.js.md)
- [`setHome`](#s-setHome) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`setSite`](#s-setSite) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`setMode`](#s-setMode) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`setGuard`](#s-setGuard) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`addPatrol`](#s-addPatrol) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`clearPatrol`](#s-clearPatrol) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`assignSlot`](#s-assignSlot) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`setRoute`](#s-setRoute) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`beginWork`](#s-beginWork) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md)
- [`recall`](#s-recall) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`scrapDrone`](#s-scrapDrone) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`homeOptions`](#s-homeOptions) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`siteOptions`](#s-siteOptions) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`haulSlots`](#s-haulSlots) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`freightSlots`](#s-freightSlots) · function — **no importer in scanned roots**
- [`guardSlots`](#s-guardSlots) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`tradeRoutes`](#s-tradeRoutes) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`patrolOptions`](#s-patrolOptions) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`holdOf`](#s-holdOf) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)
- [`statusLine`](#s-statusLine) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md)
- [`pendingAsks`](#s-pendingAsks) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md)
- [`stepDroneOps`](#s-stepDroneOps) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`noteDroneKill`](#s-noteDroneKill) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`save`](#s-save) · function — **no importer in scanned roots**
- [`resetDroneOps`](#s-resetDroneOps) · function — **no importer in scanned roots**
- [`loadDroneOps`](#s-loadDroneOps) · function — used by [js/sim/sim.js](../sim/sim.js.md)

## Effects

- **storage.get** — `‹KEY()›` (loadDroneOps:930)
- **storage.set** — `‹KEY()›` (save:910)

## Symbols

### <a id="s-FREIGHT_RATE"></a>`FREIGHT_RATE`

const · **exported** · L24–24

<!-- note:FREIGHT_RATE -->
<!-- /note -->

### <a id="s-BOUNTY_DRONE"></a>`BOUNTY_DRONE`

const · **exported** · L25–25

<!-- note:BOUNTY_DRONE -->
<!-- /note -->

### <a id="s-THREAT_R"></a>`THREAT_R`

const · **exported** · L26–26

<!-- note:THREAT_R -->
<!-- /note -->

### <a id="s-STEP"></a>`STEP`

const · L27–27

<!-- note:STEP -->
<!-- /note -->

### <a id="s-SAVE_EVERY"></a>`SAVE_EVERY`

const · L28–28

<!-- note:SAVE_EVERY -->
<!-- /note -->

### <a id="s-droneOps"></a>`droneOps`

const · **exported** · L30–30

<!-- note:droneOps -->
<!-- /note -->

### <a id="s-holdFrac"></a>`holdFrac()`

function · L32–36

- calls: [`cargoTotal`](../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_
- called by: [`ROLE_STEP.miner`](#s-ROLE_STEP-miner)

<!-- note:holdFrac -->
How full the ship's hold is, 0…1 — the drones' own limit, not just the cutter's.

- L35 · `return ship ? cargoTotal(ship) / cap : 0;` — 0.3.52: by bulk, like the hold
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L38–38

- called by: [`ROLE_STEP.combat`](#s-ROLE_STEP-combat) · [`ROLE_STEP.harvester`](#s-ROLE_STEP-harvester) ×2 · [`ROLE_STEP.miner`](#s-ROLE_STEP-miner) ×2 · [`ROLE_STEP.relay`](#s-ROLE_STEP-relay) · [`ROLE_STEP.repair`](#s-ROLE_STEP-repair) · [`ROLE_STEP.salvager`](#s-ROLE_STEP-salvager) ×2 · [`combatAnchor`](#s-combatAnchor) ×2 · [`homeOptions`](#s-homeOptions) · [`hostilesNear`](#s-hostilesNear) ×2 · [`nearestBeltPoint`](#s-nearestBeltPoint) · [`nearestBody`](#s-nearestBody) · [`tradeRoutes`](#s-tradeRoutes)

<!-- note:d3 -->
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L39–39

<!-- note:_p -->
<!-- /note -->

### <a id="s-roleOf"></a>`roleOf(u)`

function · L40–40

- called by: [`beginWork`](#s-beginWork) · [`freightSlots`](#s-freightSlots) · [`guardSlots`](#s-guardSlots) · [`pendingAsks`](#s-pendingAsks) · [`setMode`](#s-setMode) · [`stepDocked`](#s-stepDocked) ×2 · [`stepUnit`](#s-stepUnit)

<!-- note:roleOf -->
<!-- /note -->

### <a id="s-pad"></a>`pad(n)`

function · L41–41

- called by: [`rollOff`](#s-rollOff)

<!-- note:pad -->
<!-- /note -->

### <a id="s-posOf"></a>`posOf(ref, out=)`

function · **exported** · L43–52

- calls: [`unitById`](#s-unitById) · [`waypointPosition`](../sim/sim.js.md#s-waypointPosition) _js/sim/sim.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_
- via [js/sim/sim.js](../sim/sim.js.md): `sim.waypoints.find`
- called by: [`ROLE_STEP.harvester`](#s-ROLE_STEP-harvester) ×2 · [`ROLE_STEP.miner`](#s-ROLE_STEP-miner) ×2 · [`ROLE_STEP.relay`](#s-ROLE_STEP-relay) ×2 · [`ROLE_STEP.repair`](#s-ROLE_STEP-repair) · [`ROLE_STEP.salvager`](#s-ROLE_STEP-salvager) ×2 · [`ROLE_STEP.surveyor`](#s-ROLE_STEP-surveyor) ×2 · [`beginWork`](#s-beginWork) · [`combatAnchor`](#s-combatAnchor) ×3 · [`freightSlots`](#s-freightSlots) · [`siteOptions`](#s-siteOptions) · [`tradeRoutes`](#s-tradeRoutes)

<!-- note:posOf -->
---- positions ------------------------------------------------------------

Live position of a reference: station, drone, your ship, a body, a mark, a point.
<!-- /note -->

### <a id="s-nearestBeltPoint"></a>`nearestBeltPoint(p)`

function · L54–65

- calls: [`d3`](#s-d3)
- called by: [`beginWork`](#s-beginWork) · [`siteOptions`](#s-siteOptions)

<!-- note:nearestBeltPoint -->
<!-- /note -->

### <a id="s-priceOf"></a>`priceOf(roleId, seed)`

function · **exported** · L67–70

- calls: [`droneSummary`](dronespec.js.md#s-droneSummary) _js/drones/dronespec.js_
- called by: [`buildOptions`](#s-buildOptions) · [`scrapDrone`](#s-scrapDrone)

<!-- note:priceOf -->
---- build ------------------------------------------------------------------
<!-- /note -->

### <a id="s-buildOptions"></a>`buildOptions(st)`

function · **exported** · L72–86

- calls: [`hasCompany`](../corp/company.js.md#s-hasCompany) _js/corp/company.js_ · [`droneSummary`](dronespec.js.md#s-droneSummary) _js/drones/dronespec.js_ · [`priceOf`](#s-priceOf) · [`rolesAt`](roles.js.md#s-rolesAt) _js/drones/roles.js_
- via [js/drones/roles.js](roles.js.md): `rolesAt.map`
- called by: [`buildPlan`](../aria/pilot.js.md#s-buildPlan) _js/aria/pilot.js_ · [`registerBuildOp`](../aria/pilot.js.md#s-registerBuildOp) _js/aria/pilot.js_ · [`buildSection`](../console/panels/work-drones.js.md#s-buildSection) _js/console/panels/work-drones.js_ · [`orderBuild`](#s-orderBuild) · [`opts`](../station/stationdeck.js.md#s-opts) _js/station/stationdeck.js_

<!-- note:buildOptions -->
What this port's lines will build you, with price, time and why not.
<!-- /note -->

### <a id="s-orderBuild"></a>`orderBuild(roleId, st, tier=)`

function · **exported** · L88–103

- calls: [`post`](../comms/chat.js.md#s-post) _js/comms/chat.js_ · [`treasuryPay`](../corp/company.js.md#s-treasuryPay) _js/corp/company.js_ · [`buildOptions`](#s-buildOptions) · [`save`](#s-save) · [`premiumFor`](../economy/insurance.js.md#s-premiumFor) _js/economy/insurance.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- called by: [`registerBuildOp`](../aria/pilot.js.md#s-registerBuildOp) _js/aria/pilot.js_ · [`buildSection`](../console/panels/work-drones.js.md#s-buildSection) _js/console/panels/work-drones.js_ · [`b`](../station/stationdeck.js.md#s-b) _js/station/stationdeck.js_

<!-- note:orderBuild -->
- L93 · `const cover = TIER_BY_ID[tier] ? tier : null;` — 0.3.33 — cover is bought with the hull, not after it. The premium comes
  out of the treasury with the build price, in one transaction, because a
  drone that rolls off uninsured and dies on its first run is exactly the
  case the player meant to avoid.
<!-- /note -->

### <a id="s-queueAt"></a>`queueAt(stId)`

function · **exported** · L105–105

- called by: [`buildSection`](../console/panels/work-drones.js.md#s-buildSection) _js/console/panels/work-drones.js_ · [`q`](../station/stationdeck.js.md#s-q) _js/station/stationdeck.js_

<!-- note:queueAt -->
<!-- /note -->

### <a id="s-rollOff"></a>`rollOff(job)`

function · L107–139

- calls: [`post`](../comms/chat.js.md#s-post) _js/comms/chat.js_ · [`droneSummary`](dronespec.js.md#s-droneSummary) _js/drones/dronespec.js_ · [`pad`](#s-pad) · [`save`](#s-save) · [`droneKey`](../economy/insurance.js.md#s-droneKey) _js/economy/insurance.js_ · [`insure`](../economy/insurance.js.md#s-insure) _js/economy/insurance.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- called by: [`stepDroneOps`](#s-stepDroneOps)

<!-- note:rollOff -->
- L124 · `u.cover = job.cover ?? null;` — the cover was paid for at commission; it attaches to the hull that
  actually exists, which is only now
<!-- /note -->

#### <a id="s-rollOff-run"></a>`rollOff.run()`

prop · L132–132

<!-- note:rollOff.run -->
<!-- /note -->

### <a id="s-unitById"></a>`unitById(id)`

function · **exported** · L141–141

- called by: [`ROLE_STEP.miner`](#s-ROLE_STEP-miner) ×2 · [`assignSlot`](#s-assignSlot) · [`haulForMiner`](#s-haulForMiner) · [`noteDroneKill`](#s-noteDroneKill) · [`posOf`](#s-posOf) · [`releaseSlot`](#s-releaseSlot) · [`u`](#s-u)

<!-- note:unitById -->
---- orders ---------------------------------------------------------------
<!-- /note -->

### <a id="s-u"></a>`u`

const · L142–142

- calls: [`unitById`](#s-unitById)

<!-- note:u -->
<!-- /note -->

### <a id="s-unitsHomedAt"></a>`unitsHomedAt(stId)`

function · **exported** · L143–143

- called by: [`mine`](../station/stationdeck.js.md#s-mine) _js/station/stationdeck.js_

<!-- note:unitsHomedAt -->
<!-- /note -->

### <a id="s-setHome"></a>`setHome(u, stId)`

function · **exported** · L145–153

- calls: [`save`](#s-save) · [`say`](#s-say) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_

<!-- note:setHome -->
<!-- /note -->

### <a id="s-setSite"></a>`setSite(u, site)`

function · **exported** · L155–164

- calls: [`save`](#s-save) · [`say`](#s-say)
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ · [`ROLE_STEP.surveyor.run`](#s-ROLE_STEP-surveyor-run)

<!-- note:setSite -->
<!-- /note -->

### <a id="s-setMode"></a>`setMode(u, mode)`

function · **exported** · L166–177

- calls: [`replan`](#s-replan) · [`roleOf`](#s-roleOf) · [`save`](#s-save) · [`say`](#s-say)
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_

<!-- note:setMode -->
<!-- /note -->

### <a id="s-setGuard"></a>`setGuard(u, guard)`

function · **exported** · L179–188

- calls: [`replan`](#s-replan) · [`save`](#s-save) · [`say`](#s-say)
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_

<!-- note:setGuard -->
<!-- /note -->

### <a id="s-addPatrol"></a>`addPatrol(u, pt)`

function · **exported** · L190–197

- calls: [`save`](#s-save) · [`say`](#s-say)
- called by: [`droneCard.onPick`](../console/panels/work-drones.js.md#s-droneCard-onPick) _js/console/panels/work-drones.js_

<!-- note:addPatrol -->
<!-- /note -->

### <a id="s-clearPatrol"></a>`clearPatrol(u)`

function · **exported** · L198–198

- calls: [`save`](#s-save) · [`say`](#s-say)
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_

<!-- note:clearPatrol -->
<!-- /note -->

### <a id="s-assignSlot"></a>`assignSlot(u, slot)`

function · **exported** · L200–212

- calls: [`claim`](board.js.md#s-claim) _js/drones/board.js_ · [`freightKey`](board.js.md#s-freightKey) _js/drones/board.js_ · [`releaseSlot`](#s-releaseSlot) · [`replan`](#s-replan) · [`save`](#s-save) · [`say`](#s-say) ×2 · [`unitById`](#s-unitById)
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ · [`ROLE_STEP.hauler`](#s-ROLE_STEP-hauler)

<!-- note:assignSlot -->
A hauler takes a slot: under one of your miners, or an NPC freight lane.
<!-- /note -->

### <a id="s-releaseSlot"></a>`releaseSlot(u)`

function · L213–218

- calls: [`freightKey`](board.js.md#s-freightKey) _js/drones/board.js_ · [`release`](board.js.md#s-release) _js/drones/board.js_ · [`unitById`](#s-unitById)
- called by: [`assignSlot`](#s-assignSlot) · [`destroy`](#s-destroy) · [`dock`](#s-dock) · [`haulForMiner`](#s-haulForMiner) · [`runFreight`](#s-runFreight) ×3 · [`scrapDrone`](#s-scrapDrone)

<!-- note:releaseSlot -->
<!-- /note -->

### <a id="s-setRoute"></a>`setRoute(u, route)`

function · **exported** · L220–227

- calls: [`replan`](#s-replan) · [`save`](#s-save) · [`say`](#s-say)
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_

<!-- note:setRoute -->
<!-- /note -->

### <a id="s-beginWork"></a>`beginWork(u)`

function · **exported** · L229–254

- calls: [`nearestBeltPoint`](#s-nearestBeltPoint) · [`nearestBody`](#s-nearestBody) · [`posOf`](#s-posOf) · [`roleOf`](#s-roleOf) · [`save`](#s-save) · [`say`](#s-say) · [`statusLine`](#s-statusLine) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×2
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ ×2 · [`@file`](../station/stationdeck.js.md#) _js/station/stationdeck.js_

<!-- note:beginWork -->
Take the defaults for anything not answered and go to work.
<!-- /note -->

### <a id="s-recall"></a>`recall(u)`

function · **exported** · L256–262

- calls: [`save`](#s-save) · [`say`](#s-say) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_

<!-- note:recall -->
<!-- /note -->

### <a id="s-scrapDrone"></a>`scrapDrone(u)`

function · **exported** · L264–278

- calls: [`post`](../comms/chat.js.md#s-post) _js/comms/chat.js_ · [`treasuryEarn`](../corp/company.js.md#s-treasuryEarn) _js/corp/company.js_ · [`releaseAll`](board.js.md#s-releaseAll) _js/drones/board.js_ · [`priceOf`](#s-priceOf) · [`releaseSlot`](#s-releaseSlot) · [`save`](#s-save) · [`droneKey`](../economy/insurance.js.md#s-droneKey) _js/economy/insurance.js_ · [`release`](../economy/insurance.js.md#s-release) _js/economy/insurance.js_
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_

<!-- note:scrapDrone -->
- L271 · `dropPolicy(droneKey(u.id));` — sold, not lost: the cover goes with it, unpaid
<!-- /note -->

### <a id="s-replan"></a>`replan(u)`

function · L280–284

- called by: [`assignSlot`](#s-assignSlot) · [`setGuard`](#s-setGuard) · [`setMode`](#s-setMode) · [`setRoute`](#s-setRoute)

<!-- note:replan -->
<!-- /note -->

### <a id="s-homeOptions"></a>`homeOptions(u=)`

function · **exported** · L286–290

- calls: [`d3`](#s-d3)
- via [js/station/stations.js](../station/stations.js.md): `stations.filter`, `stations.filter.map`, `stations.filter.map.sort`
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ · [`guardSlots`](#s-guardSlots) · [`patrolOptions`](#s-patrolOptions) · [`stepUnit`](#s-stepUnit)

<!-- note:homeOptions -->
---- slot and option lists (the deck reads these) ---------------------------
<!-- /note -->

### <a id="s-siteOptions"></a>`siteOptions(u)`

function · **exported** · L292–313

- calls: [`nearestBeltPoint`](#s-nearestBeltPoint) · [`posOf`](#s-posOf) · [`waypointPosition`](../sim/sim.js.md#s-waypointPosition) _js/sim/sim.js_
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_

<!-- note:siteOptions -->
Where a drone could start: your marks, known veins, the belts, the worlds, right here.
<!-- /note -->

### <a id="s-haulSlots"></a>`haulSlots(u)`

function · **exported** · L315–322

- calls: [`freightSlots`](#s-freightSlots)
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ · [`ROLE_STEP.hauler`](#s-ROLE_STEP-hauler)

<!-- note:haulSlots -->
Open work for a hauler: your miners without one, then NPC freight lanes.
<!-- /note -->

### <a id="s-freightSlots"></a>`freightSlots(u, n=)`

function · **exported** · L324–328

- calls: [`openFreight`](board.js.md#s-openFreight) _js/drones/board.js_ · [`posOf`](#s-posOf) · [`roleOf`](#s-roleOf)
- called by: [`ROLE_STEP.hauler`](#s-ROLE_STEP-hauler) · [`haulSlots`](#s-haulSlots)

<!-- note:freightSlots -->
<!-- /note -->

### <a id="s-guardSlots"></a>`guardSlots(u)`

function · **exported** · L330–336

- calls: [`homeOptions`](#s-homeOptions) · [`roleOf`](#s-roleOf) · [`waypointPosition`](../sim/sim.js.md#s-waypointPosition) _js/sim/sim.js_
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_

<!-- note:guardSlots -->
Who a combat or repair drone can look after.
<!-- /note -->

### <a id="s-tradeRoutes"></a>`tradeRoutes(u, n=)`

function · **exported** · L338–353

- calls: [`d3`](#s-d3) · [`posOf`](#s-posOf) · [`askPrice`](../economy/economy.js.md#s-askPrice) _js/economy/economy.js_ · [`bidPrice`](../economy/economy.js.md#s-bidPrice) _js/economy/economy.js_ · [`shortagesOf`](../economy/economy.js.md#s-shortagesOf) _js/economy/economy.js_ · [`stockOf`](../economy/economy.js.md#s-stockOf) _js/economy/economy.js_ · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_
- via [js/station/stations.js](../station/stations.js.md): `stations.filter`, `stations.filter.filter`
- via [js/economy/economy.js](../economy/economy.js.md): `shortagesOf.slice`
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ · [`ROLE_STEP.courier`](#s-ROLE_STEP-courier)

<!-- note:tradeRoutes -->
Profitable pairs near home for a courier: buy at A's ask, sell at B's bid.
<!-- /note -->

### <a id="s-patrolOptions"></a>`patrolOptions()`

function · **exported** · L355–360

- calls: [`homeOptions`](#s-homeOptions) · [`waypointPosition`](../sim/sim.js.md#s-waypointPosition) _js/sim/sim.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ · [`droneCard.onPick`](../console/panels/work-drones.js.md#s-droneCard-onPick) _js/console/panels/work-drones.js_

<!-- note:patrolOptions -->
<!-- /note -->

### <a id="s-holdQty"></a>`holdQty(u)`

function · L362–362

- called by: [`ROLE_STEP.harvester`](#s-ROLE_STEP-harvester) · [`ROLE_STEP.miner`](#s-ROLE_STEP-miner) ×2 · [`ROLE_STEP.salvager`](#s-ROLE_STEP-salvager) · [`haulForMiner`](#s-haulForMiner) ×5 · [`holdOf`](#s-holdOf) · [`load`](#s-load) · [`runFreight`](#s-runFreight) · [`statusLine`](#s-statusLine)

<!-- note:holdQty -->
---- status ------------------------------------------------------------------
<!-- /note -->

### <a id="s-holdOf"></a>`holdOf(u)`

function · **exported** · L363–363

- calls: [`holdQty`](#s-holdQty)
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ ×2 · [`mount`](../console/panels/work-drones.js.md#s-mount) _js/console/panels/work-drones.js_

<!-- note:holdOf -->
<!-- /note -->

### <a id="s-statusLine"></a>`statusLine(u)`

function · **exported** · L365–370

- calls: [`holdQty`](#s-holdQty) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ · [`mount`](../console/panels/work-drones.js.md#s-mount) _js/console/panels/work-drones.js_ · [`beginWork`](#s-beginWork) · [`v~4`](../station/stationdeck.js.md#s-v-4) _js/station/stationdeck.js_

<!-- note:statusLine -->
<!-- /note -->

### <a id="s-pendingAsks"></a>`pendingAsks(u)`

function · **exported** · L372–374

- calls: [`roleOf`](#s-roleOf)
- called by: [`droneCard`](../console/panels/work-drones.js.md#s-droneCard) _js/console/panels/work-drones.js_ · [`mount>signature`](../console/panels/work-drones.js.md#s-mount-signature) _js/console/panels/work-drones.js_ · [`@file`](../station/stationdeck.js.md#) _js/station/stationdeck.js_ ×2

<!-- note:pendingAsks -->
<!-- /note -->

### <a id="s-stepDroneOps"></a>`stepDroneOps()`

function · **exported** · L376–393

- calls: [`rollOff`](#s-rollOff) · [`save`](#s-save) · [`stepUnit`](#s-stepUnit)
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepDroneOps -->
---- the tick ----------------------------------------------------------------

- L381 · `dt = Math.min(dt, 30);` — a long pause resumes, it does not teleport
<!-- /note -->

### <a id="s-say"></a>`say(u, text, links=, tone=)`

function · L395–398

- calls: [`post`](../comms/chat.js.md#s-post) _js/comms/chat.js_
- called by: [`ROLE_STEP.combat`](#s-ROLE_STEP-combat) · [`ROLE_STEP.courier`](#s-ROLE_STEP-courier) ×2 · [`ROLE_STEP.harvester`](#s-ROLE_STEP-harvester) · [`ROLE_STEP.miner`](#s-ROLE_STEP-miner) · [`ROLE_STEP.relay`](#s-ROLE_STEP-relay) · [`ROLE_STEP.surveyor`](#s-ROLE_STEP-surveyor) · [`addPatrol`](#s-addPatrol) · [`assignSlot`](#s-assignSlot) ×2 · [`beginWork`](#s-beginWork) · [`clearPatrol`](#s-clearPatrol) · [`combatAnchor`](#s-combatAnchor) · [`destroy`](#s-destroy) · [`dock`](#s-dock) · [`noteDroneKill`](#s-noteDroneKill) · [`recall`](#s-recall) · [`runFreight`](#s-runFreight) ×2 · [`setGuard`](#s-setGuard) · [`setHome`](#s-setHome) · [`setMode`](#s-setMode) · [`setRoute`](#s-setRoute) · [`setSite`](#s-setSite) · [`stepUnit`](#s-stepUnit) ×2

<!-- note:say -->
<!-- /note -->

### <a id="s-_door"></a>`_door`

const · L400–400

<!-- note:_door -->
<!-- /note -->

### <a id="s-stepUnit"></a>`stepUnit(u, dt)`

function · L401–419

- calls: [`danger`](#s-danger) · [`goHome`](#s-goHome) · [`holdAt`](#s-holdAt) · [`homeOptions`](#s-homeOptions) · [`roleOf`](#s-roleOf) · [`say`](#s-say) ×2 · [`stepDocked`](#s-stepDocked) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`stepDroneOps`](#s-stepDroneOps)

<!-- note:stepUnit -->
- L403 · `if (u.bay && u.state !== "docked") u.bay = null;` — pulled off the clamps mid-run (recall, scrap): the bay run is over
- L406 · `if (!droneOps.units.includes(u)) return;` — it died of it
<!-- /note -->

### <a id="s-holdAt"></a>`holdAt(u, stId)`

function · L421–424

- calls: [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`stepDocked`](#s-stepDocked) · [`stepUnit`](#s-stepUnit)

<!-- note:holdAt -->
<!-- /note -->

### <a id="s-stepDocked"></a>`stepDocked(u, dt)`

function · L426–443

- calls: [`holdAt`](#s-holdAt) · [`roleOf`](#s-roleOf) ×2 · [`startDroneBay`](../npc/bay.js.md#s-startDroneBay) _js/npc/bay.js_ · [`stepDroneBay`](../npc/bay.js.md#s-stepDroneBay) _js/npc/bay.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×2
- called by: [`stepUnit`](#s-stepUnit)

<!-- note:stepDocked -->
- L427 · `if (u.bay) {` — 0.3.15: the bay run — in through the entry door onto the clamps, or off them and out by the exit door
- L434 · `u.hp = Math.min(u.hpMax, u.hp + u.hpMax * 0.05 * dt);` — the yard patches it while it sits
<!-- /note -->

### <a id="s-flyTo"></a>`flyTo(u, p, dt, stopR=)`

function · L445–457

- called by: [`ROLE_STEP.combat`](#s-ROLE_STEP-combat) ×2 · [`ROLE_STEP.courier`](#s-ROLE_STEP-courier) ×2 · [`ROLE_STEP.harvester`](#s-ROLE_STEP-harvester) ×3 · [`ROLE_STEP.miner`](#s-ROLE_STEP-miner) ×2 · [`ROLE_STEP.relay`](#s-ROLE_STEP-relay) · [`ROLE_STEP.repair`](#s-ROLE_STEP-repair) · [`ROLE_STEP.salvager`](#s-ROLE_STEP-salvager) ×2 · [`ROLE_STEP.surveyor`](#s-ROLE_STEP-surveyor) ×2 · [`goHome`](#s-goHome) · [`haulForMiner`](#s-haulForMiner) ×2 · [`runFreight`](#s-runFreight) ×2

<!-- note:flyTo -->
Fly toward a point. Returns true on arrival.

- L446 · `if (p.vx || p.vy || p.vz) { u.x += (p.vx ?? 0) * dt; u.y += (p.vy ?? 0) * dt; u.z += (p.vz` — a port rides its orbit at hundreds of u/s: match its frame first, then close on it
<!-- /note -->

### <a id="s-goHome"></a>`goHome(u, dt)`

function · L459–465

- calls: [`dock`](#s-dock) · [`flyTo`](#s-flyTo) · [`droneDoorGoal`](../npc/bay.js.md#s-droneDoorGoal) _js/npc/bay.js_ · [`startDroneBay`](../npc/bay.js.md#s-startDroneBay) _js/npc/bay.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`stepUnit`](#s-stepUnit)

<!-- note:goHome -->
<!-- /note -->

### <a id="s-dock"></a>`dock(u, st, next=)`

function · L467–474

- calls: [`releaseSlot`](#s-releaseSlot) · [`say`](#s-say) · [`stash`](#s-stash) · [`stashLine`](#s-stashLine)
- called by: [`goHome`](#s-goHome) · [`haulForMiner`](#s-haulForMiner)

<!-- note:dock -->
- L469 · `if (u.leg?.phase === "sell") u.leg = null;` — the hold goes to the locker below: a leg that thinks it still carries the goods must not sell them again
<!-- /note -->

### <a id="s-stash"></a>`stash(u, st)`

function · L476–488

- called by: [`dock`](#s-dock)

<!-- note:stash -->
<!-- /note -->

### <a id="s-stashLine"></a>`stashLine(m)`

function · L489–489

- calls: [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_
- called by: [`dock`](#s-dock)

<!-- note:stashLine -->
<!-- /note -->

### <a id="s-load"></a>`load(u, id, q)`

function · L491–496

- calls: [`holdQty`](#s-holdQty)
- called by: [`ROLE_STEP.harvester`](#s-ROLE_STEP-harvester) ×2 · [`ROLE_STEP.miner`](#s-ROLE_STEP-miner) · [`ROLE_STEP.salvager`](#s-ROLE_STEP-salvager) · [`haulForMiner`](#s-haulForMiner)

<!-- note:load -->
<!-- /note -->

### <a id="s-_threat"></a>`_threat`

const · L498–498

<!-- note:_threat -->
---- danger ------------------------------------------------------------------

This runs for every undocked drone on every substep, and it used to build an
array, allocate a wrapper object per hostile in range, and then SORT it — to
answer two questions: how many are there (capped at three), and which is the
nearest. Twelve drones against a hundred and fifty hulls at timeScale 40 was
twenty-four sorts and twelve arrays a frame for two numbers.

One pass, one reused result object, no sort. `nearest` is the closest hostile
and `count` stops climbing at the cap the caller uses, so the scan can stop
caring past three.
<!-- /note -->

### <a id="s-hostilesNear"></a>`hostilesNear(p, R)`

function · L500–520

- calls: [`d3`](#s-d3) ×2
- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`
- called by: [`ROLE_STEP.combat`](#s-ROLE_STEP-combat) · [`ROLE_STEP.relay`](#s-ROLE_STEP-relay) · [`danger`](#s-danger)

<!-- note:hostilesNear -->
<!-- /note -->

### <a id="s-danger"></a>`danger(u, dt)`

function · L522–529

- calls: [`destroy`](#s-destroy) · [`hostilesNear`](#s-hostilesNear)
- called by: [`stepUnit`](#s-stepUnit)

<!-- note:danger -->
- L528 · `if (u.hp <= 0) destroy(u, near.nearest);` — `_threat` is reused, and destroy() only wants the name — read it here, while
  it is still this drone's threat and not the next one's
<!-- /note -->

### <a id="s-destroy"></a>`destroy(u, by)`

function · L531–546

- calls: [`treasuryEarn`](../corp/company.js.md#s-treasuryEarn) _js/corp/company.js_ · [`releaseAll`](board.js.md#s-releaseAll) _js/drones/board.js_ · [`releaseSlot`](#s-releaseSlot) · [`save`](#s-save) · [`say`](#s-say) · [`claim`](../economy/insurance.js.md#s-claim) _js/economy/insurance.js_ · [`droneKey`](../economy/insurance.js.md#s-droneKey) _js/economy/insurance.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`burst`](../world/debris.js.md#s-burst) _js/world/debris.js_
- called by: [`danger`](#s-danger)

<!-- note:destroy -->
- L538 · `const { paid, tier } = settleClaim(droneKey(u.id), { at: sim.time, what: u.name, by: who }` — a drone is the one hull in this game that could always be lost for good,
  which is why it is the one that most wanted covering
<!-- /note -->

#### <a id="s-destroy-run"></a>`destroy.run()`

prop · L543–543

- calls: [`addWaypointAt`](../sim/sim.js.md#s-addWaypointAt) _js/sim/sim.js_

<!-- note:destroy.run -->
<!-- /note -->

### <a id="s-ROLE_STEP"></a>`ROLE_STEP`

const · L548–807

<!-- note:ROLE_STEP -->
---- roles -----------------------------------------------------------------------
<!-- /note -->

#### <a id="s-ROLE_STEP-miner"></a>`ROLE_STEP.miner(u, dt, r)`

prop · L549–598

- calls: [`d3`](#s-d3) ×2 · [`flyTo`](#s-flyTo) ×2 · [`holdFrac`](#s-holdFrac) · [`holdQty`](#s-holdQty) ×2 · [`load`](#s-load) · [`posOf`](#s-posOf) ×2 · [`say`](#s-say) · [`unitById`](#s-unitById) ×2 · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_ · [`wearRock`](../world/field.js.md#s-wearRock) _js/world/field.js_
- via [js/world/field.js](../world/field.js.md): `depleted.get`, `nearbyRocks.filter`

<!-- note:ROLE_STEP.miner -->
- L568 · `let rock = u.cut && u.cut.key === u.target && (depleted.get(u.target) ?? 0) < 1 && sim.tim` — working: find a rock near the site, close to it, cut it (the found rock is kept; rescan when it is gone or every ~2 s)
- L572 · `const want = sim.autoPlan?.seamOre ?? null;` — 0.3.22: a contract that named an ore is what the crew is out here for.
  Miners work that ore while there is any at the site and go back to the
  nearest rock when there is not — a free run is unchanged.
- L574 · `if (want && !onOre.length && holdFrac() > 0.7) {` — 0.3.24: and when there is none of it at their site, they do not go on
  packing the hold with something else — the order needs the room. A
  contract that cannot be finished because the crew filled the hold with
  a better rock is the crew's fault, not the belt's.
<!-- /note -->

##### <a id="s-ROLE_STEP-miner-run"></a>`ROLE_STEP.miner.run()`

prop · L585–585

<!-- note:ROLE_STEP.miner.run -->
<!-- /note -->

#### <a id="s-ROLE_STEP-hauler"></a>`ROLE_STEP.hauler(u, dt, r)`

prop · L600–612

- calls: [`assignSlot`](#s-assignSlot) · [`freightSlots`](#s-freightSlots) · [`haulForMiner`](#s-haulForMiner) · [`haulSlots`](#s-haulSlots) · [`runFreight`](#s-runFreight)

<!-- note:ROLE_STEP.hauler -->
<!-- /note -->

#### <a id="s-ROLE_STEP-combat"></a>`ROLE_STEP.combat(u, dt, r)`

prop · L614–653

- calls: [`gnnPost`](../comms/gnn.js.md#s-gnnPost) _js/comms/gnn.js_ · [`treasuryEarn`](../corp/company.js.md#s-treasuryEarn) _js/corp/company.js_ · [`anchorLabel`](#s-anchorLabel) ×3 · [`combatAnchor`](#s-combatAnchor) · [`d3`](#s-d3) · [`flyTo`](#s-flyTo) ×2 · [`hostilesNear`](#s-hostilesNear) · [`say`](#s-say) · [`contactById`](../flight/turrets.js.md#s-contactById) _js/flight/turrets.js_ · [`fireRound`](../flight/turrets.js.md#s-fireRound) _js/flight/turrets.js_ · [`pirateKilled`](../npc/battles.js.md#s-pirateKilled) _js/npc/battles.js_ · [`markVesselDown`](../npc/traffic.js.md#s-markVesselDown) _js/npc/traffic.js_ · [`spawnHulk`](../world/hulks.js.md#s-spawnHulk) _js/world/hulks.js_

<!-- note:ROLE_STEP.combat -->
- L618 · `const foe = found.nearest;` — `_threat` is shared scratch — take what this branch needs off it now
- L619 · `const foeKind = found.kind;` — "npc" = a traffic hull, "gun" = a board contact
- L630 · `if (d3(u, tgt) > 900) return;` — in guns range from the standoff, not from the anchor
- L641 · `if (foeKind !== "npc") return;` — out of your contact range: the fight resolves on the numbers
<!-- /note -->

#### <a id="s-ROLE_STEP-salvager"></a>`ROLE_STEP.salvager(u, dt, r)`

prop · L655–677

- calls: [`d3`](#s-d3) ×2 · [`flyTo`](#s-flyTo) ×2 · [`holdQty`](#s-holdQty) · [`load`](#s-load) · [`posOf`](#s-posOf) ×2 · [`chunkMass`](../world/debris.js.md#s-chunkMass) _js/world/debris.js_ · [`removeChunk`](../world/debris.js.md#s-removeChunk) _js/world/debris.js_
- via [js/world/debris.js](../world/debris.js.md): `chunks.includes`

<!-- note:ROLE_STEP.salvager -->
<!-- /note -->

#### <a id="s-ROLE_STEP-surveyor"></a>`ROLE_STEP.surveyor(u, dt, r)`

prop · L679–705

- calls: [`gnnPost`](../comms/gnn.js.md#s-gnnPost) _js/comms/gnn.js_ · [`flyTo`](#s-flyTo) ×2 · [`posOf`](#s-posOf) ×2 · [`say`](#s-say) · [`assayPoint`](../flight/probes.js.md#s-assayPoint) _js/flight/probes.js_ · [`fileReport`](../flight/probes.js.md#s-fileReport) _js/flight/probes.js_ · [`addAnchoredWaypoint`](../sim/sim.js.md#s-addAnchoredWaypoint) _js/sim/sim.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_
- via [js/world/field.js](../world/field.js.md): `nearbyRocks.find`

<!-- note:ROLE_STEP.surveyor -->
- L695 · `` const wp = addAnchoredWaypoint(`Survey · ${rich.oreName} vein`, { kind: "asteroid", id: ri `` — 0.3.67: on the rock, not where it was
<!-- /note -->

##### <a id="s-ROLE_STEP-surveyor-run"></a>`ROLE_STEP.surveyor.run()`

prop · L700–700

- calls: [`setSite`](#s-setSite)

<!-- note:ROLE_STEP.surveyor.run -->
<!-- /note -->

#### <a id="s-ROLE_STEP-harvester"></a>`ROLE_STEP.harvester(u, dt, r)`

prop · L707–740

- calls: [`d3`](#s-d3) ×2 · [`flyTo`](#s-flyTo) ×3 · [`holdQty`](#s-holdQty) · [`load`](#s-load) ×2 · [`nearestBody`](#s-nearestBody) · [`posOf`](#s-posOf) ×2 · [`say`](#s-say) · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_ · [`wearRock`](../world/field.js.md#s-wearRock) _js/world/field.js_
- via [js/world/field.js](../world/field.js.md): `depleted.get`, `nearbyRocks.filter`
- via [js/world/bodies.js](../world/bodies.js.md): `BODIES.find`

<!-- note:ROLE_STEP.harvester -->
<!-- /note -->

##### <a id="s-ROLE_STEP-harvester-run"></a>`ROLE_STEP.harvester.run()`

prop · L730–730

<!-- note:ROLE_STEP.harvester.run -->
<!-- /note -->

#### <a id="s-ROLE_STEP-courier"></a>`ROLE_STEP.courier(u, dt, r)`

prop · L742–773

- calls: [`treasuryEarn`](../corp/company.js.md#s-treasuryEarn) _js/corp/company.js_ · [`treasuryPay`](../corp/company.js.md#s-treasuryPay) _js/corp/company.js_ · [`flyTo`](#s-flyTo) ×2 · [`say`](#s-say) ×2 · [`tradeRoutes`](#s-tradeRoutes) · [`askPrice`](../economy/economy.js.md#s-askPrice) _js/economy/economy.js_ · [`bidPrice`](../economy/economy.js.md#s-bidPrice) _js/economy/economy.js_ · [`deliver`](../economy/economy.js.md#s-deliver) _js/economy/economy.js_ · [`lift`](../economy/economy.js.md#s-lift) _js/economy/economy.js_ · [`stockOf`](../economy/economy.js.md#s-stockOf) _js/economy/economy.js_ · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ ×5 · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×2

<!-- note:ROLE_STEP.courier -->
<!-- /note -->

#### <a id="s-ROLE_STEP-relay"></a>`ROLE_STEP.relay(u, dt, r)`

prop · L775–791

- calls: [`d3`](#s-d3) · [`flyTo`](#s-flyTo) · [`hostilesNear`](#s-hostilesNear) · [`posOf`](#s-posOf) ×2 · [`say`](#s-say)

<!-- note:ROLE_STEP.relay -->
- L781 · `const f = watch.nearest;` — `_threat` is a shared scratch object — read what this branch needs off it
  NOW, because the next drone's scan overwrites it
<!-- /note -->

##### <a id="s-ROLE_STEP-relay-run"></a>`ROLE_STEP.relay.run()`

prop · L790–790

- calls: [`addWaypointAt`](../sim/sim.js.md#s-addWaypointAt) _js/sim/sim.js_

<!-- note:ROLE_STEP.relay.run -->
<!-- /note -->

#### <a id="s-ROLE_STEP-repair"></a>`ROLE_STEP.repair(u, dt, r)`

prop · L793–806

- calls: [`d3`](#s-d3) · [`flyTo`](#s-flyTo) · [`posOf`](#s-posOf)

<!-- note:ROLE_STEP.repair -->
<!-- /note -->

### <a id="s-haulForMiner"></a>`haulForMiner(u, dt)`

function · L809–832

- calls: [`dock`](#s-dock) · [`flyTo`](#s-flyTo) ×2 · [`holdQty`](#s-holdQty) ×5 · [`load`](#s-load) · [`releaseSlot`](#s-releaseSlot) · [`unitById`](#s-unitById) · [`droneDoorGoal`](../npc/bay.js.md#s-droneDoorGoal) _js/npc/bay.js_ · [`startDroneBay`](../npc/bay.js.md#s-startDroneBay) _js/npc/bay.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×2
- called by: [`ROLE_STEP.hauler`](#s-ROLE_STEP-hauler)

<!-- note:haulForMiner -->
<!-- /note -->

### <a id="s-runFreight"></a>`runFreight(u, dt)`

function · L834–860

- calls: [`treasuryEarn`](../corp/company.js.md#s-treasuryEarn) _js/corp/company.js_ · [`freightKey`](board.js.md#s-freightKey) _js/drones/board.js_ · [`touch`](board.js.md#s-touch) _js/drones/board.js_ · [`flyTo`](#s-flyTo) ×2 · [`holdQty`](#s-holdQty) · [`releaseSlot`](#s-releaseSlot) ×3 · [`say`](#s-say) ×2 · [`bidPrice`](../economy/economy.js.md#s-bidPrice) _js/economy/economy.js_ · [`deliver`](../economy/economy.js.md#s-deliver) _js/economy/economy.js_ · [`lift`](../economy/economy.js.md#s-lift) _js/economy/economy.js_ · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ ×5 · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×2
- called by: [`ROLE_STEP.hauler`](#s-ROLE_STEP-hauler)

<!-- note:runFreight -->
- L859 · `if (u.mode === "passive") releaseSlot(u);` — passive haulers pick the next best job
<!-- /note -->

### <a id="s-combatAnchor"></a>`combatAnchor(u, dt)`

function · L862–876

- calls: [`d3`](#s-d3) ×2 · [`posOf`](#s-posOf) ×3 · [`say`](#s-say)
- called by: [`ROLE_STEP.combat`](#s-ROLE_STEP-combat)

<!-- note:combatAnchor -->
<!-- /note -->

### <a id="s-anchorLabel"></a>`anchorLabel(u)`

function · L877–882

- calls: [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`ROLE_STEP.combat`](#s-ROLE_STEP-combat) ×3

<!-- note:anchorLabel -->
<!-- /note -->

### <a id="s-nearestBody"></a>`nearestBody(p, pred)`

function · L884–893

- calls: [`d3`](#s-d3) · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_
- called by: [`ROLE_STEP.harvester`](#s-ROLE_STEP-harvester) · [`beginWork`](#s-beginWork)

<!-- note:nearestBody -->
<!-- /note -->

### <a id="s-noteDroneKill"></a>`noteDroneKill(owner)`

function · **exported** · L895–900

- calls: [`say`](#s-say) · [`unitById`](#s-unitById)
- called by: [`onKill`](../sim/sim.js.md#s-onKill) _js/sim/sim.js_

<!-- note:noteDroneKill -->
turrets → sim onKill: a round from one of your drones made the kill.
<!-- /note -->

### <a id="s-KEY"></a>`KEY()`

function · L902–902

- called by: [`loadDroneOps`](#s-loadDroneOps) · [`save`](#s-save)

<!-- note:KEY -->
---- persistence ---------------------------------------------------------------
<!-- /note -->

### <a id="s-KEEP"></a>`KEEP`

const · L903–903

<!-- note:KEEP -->
<!-- /note -->

### <a id="s-save"></a>`save()`

function · **exported** · L905–913

- calls: [`KEY`](#s-KEY)
- called by: [`addPatrol`](#s-addPatrol) · [`assignSlot`](#s-assignSlot) · [`beginWork`](#s-beginWork) · [`clearPatrol`](#s-clearPatrol) · [`destroy`](#s-destroy) · [`orderBuild`](#s-orderBuild) · [`recall`](#s-recall) · [`rollOff`](#s-rollOff) · [`scrapDrone`](#s-scrapDrone) · [`setGuard`](#s-setGuard) · [`setHome`](#s-setHome) · [`setMode`](#s-setMode) · [`setRoute`](#s-setRoute) · [`setSite`](#s-setSite) · [`stepDroneOps`](#s-stepDroneOps)
- effects: storage.set `‹KEY()›`

<!-- note:save -->
<!-- /note -->

### <a id="s-resetDroneOps"></a>`resetDroneOps()`

function · **exported** · L915–924

- called by: [`loadDroneOps`](#s-loadDroneOps)

<!-- note:resetDroneOps -->
<!-- /note -->

### <a id="s-loadDroneOps"></a>`loadDroneOps()`

function · **exported** · L926–945

- calls: [`claim`](board.js.md#s-claim) _js/drones/board.js_ · [`freightKey`](board.js.md#s-freightKey) _js/drones/board.js_ · [`KEY`](#s-KEY) · [`resetDroneOps`](#s-resetDroneOps) · [`droneKey`](../economy/insurance.js.md#s-droneKey) _js/economy/insurance.js_ · [`insure`](../economy/insurance.js.md#s-insure) _js/economy/insurance.js_
- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_
- effects: storage.get `‹KEY()›`

<!-- note:loadDroneOps -->
Bring back this sky's drones. Queued builds finish on sim time as if you never left.

- L938 · `if (s.assign?.kind === "freight") claim(s.assign.key ?? freightKey(s.assign), s.id);` — the slot it held is still its
- L939 · `if (s.cover && s.value > 0) insure(droneKey(s.id), s.cover, s.value, sim.time);` — Policies live in a Map in js/economy/insurance.js, not in this save file, so
  a reload would quietly void cover the treasury has already paid for.
  The drone remembers what it carries; write the policy back from it.
<!-- /note -->

## Module-level calls

- calls: [`registerAnchor`](../world/anchors.js.md#s-registerAnchor) _js/world/anchors.js_
