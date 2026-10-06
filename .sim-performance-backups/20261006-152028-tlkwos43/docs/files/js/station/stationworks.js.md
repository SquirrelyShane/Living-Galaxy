# js/station/stationworks.js

[index](../../../README.md) · 407 lines · 46 symbols · 6 imports · 11 importers

## About

<!-- note:@file -->
LIVING GALAXY — station works: what a port makes, what it shoots, and how it takes you in.

PRODUCTION. A port's fabrication lines (from its STATIONGEN manifest: drone
lines, munitions cells, armour presses) turn traded stock into the things
it defends itself with — slugs for the rails and the spinal gun, missiles
for the cells, drones for the bays — and armour plate and ammo cases for
the market. A line that is short of a material stalls and says which one:
fly it in and sell it, and the magazines fill again. A trickle of NPC
supply keeps the lines ticking over without you.

DEFENCE. Every weapon mount on the hull (pdc, rail, laser, missile cells,
spinal driver, siege laser) tracks the nearest hostile of the CURRENT ship
— pirates, rogue drones, anyone flagged hostile — inside its range and
answers it, spending magazines as it goes. A hostile free port turns the
same guns on you until it is claimed. Drone bays put interceptors out on
sorties against anything hostile within reach and recover them after.

TRACTOR. Fly into a hangar mouth — or ask for clearance inside TRACTOR_R —
and port control takes the helm: a tractor lock pulls the hull in by the
ENTRY door (the port half of the aperture), down the bay and onto the
clamps. Undocking pushes you out by the EXIT door (the starboard half), up
the exit lane and past the funnel before it lets go — and for the rest of
that departure the port neither reaches for you nor hails you: you are
outbound until you are off its exit lane or come back round onto the
entry lane. Undocking pushes you back
out along the exit ways. Pure sim: nothing here touches three.js.

- L14 · `const SUPPLY_S = 45;` — NPC supply trickle interval
- L15 · `const DRONE_REACH = 3200;` — how far a bay will send its drones
- L17 · `const DRONE_ENDURANCE = 110;` — seconds out before a drone comes home
- L19 · `const DEFENCE_WAKE_R = 6000;` — ballistic mounts are only stepped when the player is this close
- L20 · `const DEFENCE_REACH = 5200;` — and a port answers anything hostile inside this, seen or not
- L21 · `const SIEGE_HIT = 0.42;` — fraction of abstract battery fire that connects — the same as npc/combat.js
- L25 · `export const REQUEST_TTL = 900;` — seconds a request stands
- L26 · `export const PUSH_GRACE = 30;` — seconds after an undock push during which no lock is taken
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../flight/turrets.js` | `contacts`, `fireRound` | [js/flight/turrets.js](../flight/turrets.js.md) |
| 2 | `../npc/traffic.js` | `traffic`, `HOSTILE_ROLES` | [js/npc/traffic.js](../npc/traffic.js.md) |
| 3 | `./stations.js` | `stations`, `stationById`, `TRACTOR_R`, `TRACTOR_V` | [js/station/stations.js](stations.js.md) |
| 4 | `./stationyard.js` | `mouthCoords`, `worksOf` | [js/station/stationyard.js](stationyard.js.md) |
| 5 | `../npc/lanes.js` | `laneOf`, `lanePoint`, `stationLane`, `FUNNEL_U`, `RELEASE_U` | [js/npc/lanes.js](../npc/lanes.js.md) |
| 6 | `../economy/materials.js` | `goodName`, `priceAt`, `SECTORS` | [js/economy/materials.js](../economy/materials.js.md) |

## Imported by

- [js/comms/comms.js](../comms/comms.js.md) — `requestDock`, `hasDockRequest`
- [js/flight/autopilot.js](../flight/autopilot.js.md) — `requestDock`
- [js/mission/run.js](../mission/run.js.md) — `tractor`
- [js/npc/captain.js](../npc/captain.js.md) — `tractor`, `inDeparture`
- [js/npc/rogues.js](../npc/rogues.js.md) — `worksFor`
- [js/render/engine.js](../render/engine.js.md) — `tractor`
- [js/sim/sim.js](../sim/sim.js.md) — `stepStationWorks`, `stepTractor`, `autoTractor`, `engageTractor`, `engagePush`, `releaseTractor`, `holdOff`, `tractor`, `worksReport`, `worksHooks`, `dockRequest`, `requestDock`, `clearDockRequest`, `hasDockRequest`, `unrequestedApproach`, `inDeparture`, `PUSH_GRACE`
- [js/station/deckworks.js](deckworks.js.md) — `worksReport`, `RECIPES`
- [js/ui/dockboot.js](../ui/dockboot.js.md) — `tractor`
- test/portcontrol.test.mjs _(outside js/)_ — `tractor`, `dockRequest`
- test/undock.test.mjs _(outside js/)_ — `releaseTractor`

## Exports

- [`RECIPES`](#s-RECIPES) · const — used by [js/station/deckworks.js](deckworks.js.md)
- [`tractor`](#s-tractor) · const — used by [js/mission/run.js](../mission/run.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/dockboot.js](../ui/dockboot.js.md), test/portcontrol.test.mjs
- [`dockRequest`](#s-dockRequest) · const — used by [js/sim/sim.js](../sim/sim.js.md), test/portcontrol.test.mjs
- [`REQUEST_TTL`](#s-REQUEST_TTL) · const — **no importer in scanned roots**
- [`PUSH_GRACE`](#s-PUSH_GRACE) · const — used by [js/sim/sim.js](../sim/sim.js.md)
- [`departure`](#s-departure) · const — **no importer in scanned roots**
- [`requestDock`](#s-requestDock) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`clearDockRequest`](#s-clearDockRequest) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`hasDockRequest`](#s-hasDockRequest) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`worksFor`](#s-worksFor) · function — used by [js/npc/rogues.js](../npc/rogues.js.md)
- [`stepProduction`](#s-stepProduction) · function — **no importer in scanned roots**
- [`worksReport`](#s-worksReport) · function — used by [js/sim/sim.js](../sim/sim.js.md), [js/station/deckworks.js](deckworks.js.md)
- [`batteryDps`](#s-batteryDps) · function — **no importer in scanned roots**
- [`worksHooks`](#s-worksHooks) · const — used by [js/sim/sim.js](../sim/sim.js.md)
- [`stepDefences`](#s-stepDefences) · function — **no importer in scanned roots**
- [`stepStationDrones`](#s-stepStationDrones) · function — **no importer in scanned roots**
- [`stepStationWorks`](#s-stepStationWorks) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`approachOf`](#s-approachOf) · function — **no importer in scanned roots**
- [`outboundSpeed`](#s-outboundSpeed) · function — **no importer in scanned roots**
- [`inDeparture`](#s-inDeparture) · function — used by [js/npc/captain.js](../npc/captain.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`mouthAround`](#s-mouthAround) · function — **no importer in scanned roots**
- [`engageTractor`](#s-engageTractor) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`releaseTractor`](#s-releaseTractor) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/undock.test.mjs
- [`holdOff`](#s-holdOff) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`stepTractor`](#s-stepTractor) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`autoTractor`](#s-autoTractor) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`unrequestedApproach`](#s-unrequestedApproach) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`engagePush`](#s-engagePush) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- `TRACTOR_R` — **no importer in scanned roots**
- `TRACTOR_V` — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-RECIPES"></a>`RECIPES`

const · **exported** · L8–13

<!-- note:RECIPES -->
---- recipes: what a unit of each munition costs in traded stock ------------
<!-- /note -->

### <a id="s-SUPPLY_S"></a>`SUPPLY_S`

const · L14–14

<!-- note:SUPPLY_S -->
<!-- /note -->

### <a id="s-DRONE_REACH"></a>`DRONE_REACH`

const · L15–15

<!-- note:DRONE_REACH -->
<!-- /note -->

### <a id="s-DRONE_SPEED"></a>`DRONE_SPEED`

const · L16–16

<!-- note:DRONE_SPEED -->
<!-- /note -->

### <a id="s-DRONE_ENDURANCE"></a>`DRONE_ENDURANCE`

const · L17–17

<!-- note:DRONE_ENDURANCE -->
<!-- /note -->

### <a id="s-DRONE_RANGE"></a>`DRONE_RANGE`

const · L18–18

<!-- note:DRONE_RANGE -->
<!-- /note -->

### <a id="s-DEFENCE_WAKE_R"></a>`DEFENCE_WAKE_R`

const · L19–19

<!-- note:DEFENCE_WAKE_R -->
<!-- /note -->

### <a id="s-DEFENCE_REACH"></a>`DEFENCE_REACH`

const · L20–20

<!-- note:DEFENCE_REACH -->
<!-- /note -->

### <a id="s-SIEGE_HIT"></a>`SIEGE_HIT`

const · L21–21

<!-- note:SIEGE_HIT -->
<!-- /note -->

### <a id="s-tractor"></a>`tractor`

const · **exported** · L23–23

<!-- note:tractor -->
<!-- /note -->

### <a id="s-dockRequest"></a>`dockRequest`

const · **exported** · L24–24

<!-- note:dockRequest -->
a berth you asked for: port control only reaches out for a hull that requested one
<!-- /note -->

### <a id="s-REQUEST_TTL"></a>`REQUEST_TTL`

const · **exported** · L25–25

<!-- note:REQUEST_TTL -->
<!-- /note -->

### <a id="s-PUSH_GRACE"></a>`PUSH_GRACE`

const · **exported** · L26–26

<!-- note:PUSH_GRACE -->
<!-- /note -->

### <a id="s-departure"></a>`departure`

const · **exported** · L27–27

<!-- note:departure -->
the departure you are on: the port that pushed you out, and until when it leaves you alone by the clock
<!-- /note -->

### <a id="s-noCaptureUntil"></a>`noCaptureUntil`

const · L28–28

<!-- note:noCaptureUntil -->
<!-- /note -->

### <a id="s-requestDock"></a>`requestDock(st, time)`

function · **exported** · L29–29

- called by: [`stationCtx.request`](../comms/comms.js.md#s-stationCtx-request) _js/comms/comms.js_ · [`apDock`](../flight/autopilot.js.md#s-apDock) _js/flight/autopilot.js_ · [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_ ×4

<!-- note:requestDock -->
<!-- /note -->

### <a id="s-clearDockRequest"></a>`clearDockRequest()`

function · **exported** · L30–30

- called by: [`finishDock`](../sim/sim.js.md#s-finishDock) _js/sim/sim.js_ · [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_ · [`returnToMenu`](../sim/sim.js.md#s-returnToMenu) _js/sim/sim.js_ · [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_ · [`autoTractor`](#s-autoTractor)

<!-- note:clearDockRequest -->
<!-- /note -->

### <a id="s-hasDockRequest"></a>`hasDockRequest(st, time)`

function · **exported** · L31–31

- called by: [`stationCtx.requested`](../comms/comms.js.md#s-stationCtx-requested) _js/comms/comms.js_ · [`dockPortFor`](../sim/sim.js.md#s-dockPortFor) _js/sim/sim.js_ · [`autoTractor`](#s-autoTractor) · [`unrequestedApproach`](#s-unrequestedApproach)

<!-- note:hasDockRequest -->
<!-- /note -->

### <a id="s-worksFor"></a>`worksFor(st)`

function · **exported** · L33–36

- calls: [`worksOf`](stationyard.js.md#s-worksOf) _js/station/stationyard.js_
- called by: [`stepRogues`](../npc/rogues.js.md#s-stepRogues) _js/npc/rogues.js_ · [`stepDefences`](#s-stepDefences) · [`stepProduction`](#s-stepProduction) · [`stepSiege`](#s-stepSiege) · [`stepStationDrones`](#s-stepStationDrones) · [`worksReport`](#s-worksReport)

<!-- note:worksFor -->
---- production ---------------------------------------------------------------
<!-- /note -->

### <a id="s-stockLine"></a>`stockLine(st, id)`

function · L38–38

- called by: [`addStock`](#s-addStock) · [`stepProduction`](#s-stepProduction) · [`takeStock`](#s-takeStock)

<!-- note:stockLine -->
<!-- /note -->

### <a id="s-takeStock"></a>`takeStock(st, id, qty)`

function · L39–44

- calls: [`stockLine`](#s-stockLine)
- called by: [`stepProduction`](#s-stepProduction)

<!-- note:takeStock -->
<!-- /note -->

### <a id="s-addStock"></a>`addStock(st, id, qty)`

function · L45–49

- calls: [`priceAt`](../economy/materials.js.md#s-priceAt) _js/economy/materials.js_ · [`stockLine`](#s-stockLine)
- called by: [`stepProduction`](#s-stepProduction) ×3

<!-- note:addStock -->
<!-- /note -->

### <a id="s-stepProduction"></a>`stepProduction(st, dt, time)`

function · **exported** · L51–77

- calls: [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`addStock`](#s-addStock) ×3 · [`stockLine`](#s-stockLine) · [`takeStock`](#s-takeStock) · [`worksFor`](#s-worksFor)
- called by: [`stepStationWorks`](#s-stepStationWorks)

<!-- note:stepProduction -->
One production pass for a port: every line runs its recipe when its magazine has room and the stock is there.

- L59 · `if (what !== "plate" && !w.needs[what]) continue;` — no gun that eats it: no line for it
- L64 · `const short = Object.entries(R.needs).find(([id, q]) => (stockLine(st, id)?.qty ?? 0) < q)` — the batch's bill, all or nothing
- L71 · `w.stalled = w.stalls.slug ?? w.stalls.drone ?? w.stalls.missile ?? w.stalls.plate ?? null;` — the first stalled line is the one the deck shouts about; drones and slugs before plate
- L72 · `if (time - (w.suppliedAt ?? -SUPPLY_S) >= SUPPLY_S) {` — the supply line: the sector's own buy list trickles in on the flow
<!-- /note -->

### <a id="s-worksReport"></a>`worksReport(st)`

function · **exported** · L79–94

- calls: [`worksFor`](#s-worksFor)
- called by: [`stationStatus`](../sim/sim.js.md#s-stationStatus) _js/sim/sim.js_ · [`worksPanel`](deckworks.js.md#s-worksPanel) _js/station/deckworks.js_

<!-- note:worksReport -->
What the port can tell you about its works.
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L96–96

- called by: [`engagePush`](#s-engagePush) ×3 · [`engageTractor`](#s-engageTractor) · [`mouthAround`](#s-mouthAround) · [`siegeOf`](#s-siegeOf) · [`stepSiege`](#s-stepSiege) · [`stepStationDrones`](#s-stepStationDrones) ×2 · [`stepStationWorks`](#s-stepStationWorks) · [`unrequestedApproach`](#s-unrequestedApproach)

<!-- note:d3 -->
---- defence ------------------------------------------------------------------
<!-- /note -->

### <a id="s-targetsFor"></a>`targetsFor(st, ship)`

function · L98–101

- via [js/flight/turrets.js](../flight/turrets.js.md): `contacts.filter`
- called by: [`stepDefences`](#s-stepDefences)

<!-- note:targetsFor -->
Who a port's guns are for: the player's hostiles, or the player when the port is a hostile free port.
<!-- /note -->

### <a id="s-siegeOf"></a>`siegeOf(st)`

function · L103–114

- calls: [`d3`](#s-d3)
- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`
- called by: [`stepSiege`](#s-stepSiege)

<!-- note:siegeOf -->
The hostile hulls actually inside a port's engagement envelope, whether or
not the player is anywhere near. `contacts` only exists within sensor range
of the player, so a port under attack on the far side of the system has to
be answered off the roster instead.
<!-- /note -->

### <a id="s-batteryDps"></a>`batteryDps(st)`

function · **exported** · L116–123

- called by: [`stepSiege`](#s-stepSiege)

<!-- note:batteryDps -->
A port's total effective firepower, for a fight resolved on the numbers.
<!-- /note -->

### <a id="s-stepSiege"></a>`stepSiege(st, dt, time)`

function · L125–144

- calls: [`batteryDps`](#s-batteryDps) · [`d3`](#s-d3) · [`siegeOf`](#s-siegeOf) · [`worksFor`](#s-worksFor)
- via [js/npc/traffic.js](../npc/traffic.js.md): `HOSTILE_ROLES.has`
- called by: [`stepStationWorks`](#s-stepStationWorks)

<!-- note:stepSiege -->
A port defending itself out of the player's sight. Same numbers as the
ballistic path, resolved in one multiplication per tick: the batteries put
their effective firepower onto the nearest raider, the raiders put theirs
into the port's magazines and its works. A port with no guns loses; a
military port with a full doctrine does not.

- L132 · `if (w?.stock && (w.stock.slug ?? 0) <= 0 && (w.stock.missile ?? 0) <= 0) { st.guns = { fir` — the batteries need ammunition like they do up close
- L137 · `let best = null, bestD = DEFENCE_REACH;` — pick the nearest raider and put the whole battery on it, which is what a
  fire-control mast is for
<!-- /note -->

### <a id="s-worksHooks"></a>`worksHooks`

const · **exported** · L146–146

<!-- note:worksHooks -->
<!-- /note -->

### <a id="s-stepDefences"></a>`stepDefences(st, dt, time, ship)`

function · **exported** · L148–183

- calls: [`fireRound`](../flight/turrets.js.md#s-fireRound) _js/flight/turrets.js_ · [`targetsFor`](#s-targetsFor) · [`worksFor`](#s-worksFor)
- called by: [`stepStationWorks`](#s-stepStationWorks)

<!-- note:stepDefences -->
<!-- /note -->

### <a id="s-droneSeq"></a>`droneSeq`

const · L185–185

<!-- note:droneSeq -->
---- drones -------------------------------------------------------------------
<!-- /note -->

### <a id="s-stepStationDrones"></a>`stepStationDrones(st, dt, time, ship)`

function · **exported** · L186–242

- calls: [`fireRound`](../flight/turrets.js.md#s-fireRound) _js/flight/turrets.js_ · [`d3`](#s-d3) ×2 · [`worksFor`](#s-worksFor)
- via [js/flight/turrets.js](../flight/turrets.js.md): `contacts.filter`, `contacts.indexOf`, `contacts.push`, `contacts.splice`
- called by: [`stepStationWorks`](#s-stepStationWorks)

<!-- note:stepStationDrones -->
- L193 · `if (targets.length && w.stock.drone >= 1) {` — launch: one per bay per second while there is something to meet, up to the cells
- L210 · `for (let i = st.dronesOut.length - 1; i >= 0; i--) {` — fly: close on a hostile and shoot, or come home and land
- L221 · `const cruise = Math.max(-DRONE_SPEED, Math.min(DRONE_SPEED, (d - want) * 0.9));` — velocity matching: close at up to DRONE_SPEED, ease onto the standoff, and station-keep there
- L236 · `if (!tgt && d < 30) {` — recovered: back in the cells
<!-- /note -->

### <a id="s-stepStationWorks"></a>`stepStationWorks(dt, time, ship)`

function · **exported** · L244–256

- calls: [`d3`](#s-d3) · [`stepDefences`](#s-stepDefences) · [`stepProduction`](#s-stepProduction) · [`stepSiege`](#s-stepSiege) · [`stepStationDrones`](#s-stepStationDrones)
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepStationWorks -->
---- the works tick ------------------------------------------------------------

- L250 · `stepSiege(st, dt, time);` — Out of the player's sight the guns still work. They have to: rogue
  waves pick their targets off the whole station list, and a port that
  only defends itself when somebody is watching would be dismantled the
  first time a wave went somewhere quiet.
<!-- /note -->

### <a id="s-approachOf"></a>`approachOf(ship, st)`

function · **exported** · L258–265

- calls: [`laneOf`](../npc/lanes.js.md#s-laneOf) _js/npc/lanes.js_ · [`mouthAround`](#s-mouthAround) · [`outboundSpeed`](#s-outboundSpeed)
- called by: [`autoTractor`](#s-autoTractor) · [`unrequestedApproach`](#s-unrequestedApproach)

<!-- note:approachOf -->
---- the tractor --------------------------------------------------------------

Is the ship on a port's entry lane inside the funnel, or in its mouth? { st, hangar, m, where }
<!-- /note -->

### <a id="s-outboundSpeed"></a>`outboundSpeed(ship, st)`

function · **exported** · L267–270

- calls: [`stationLane`](../npc/lanes.js.md#s-stationLane) _js/npc/lanes.js_
- called by: [`approachOf`](#s-approachOf) · [`inDeparture`](#s-inDeparture)

<!-- note:outboundSpeed -->
Speed away from the port along its lane axis (u/s, relative to the port): + outbound, − inbound.
<!-- /note -->

### <a id="s-inDeparture"></a>`inDeparture(st, ship, time)`

function · **exported** · L272–277

- calls: [`laneOf`](../npc/lanes.js.md#s-laneOf) _js/npc/lanes.js_ · [`outboundSpeed`](#s-outboundSpeed)
- called by: [`execute`](../npc/captain.js.md#s-execute) _js/npc/captain.js_ · [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_ · [`autoTractor`](#s-autoTractor) · [`unrequestedApproach`](#s-unrequestedApproach)

<!-- note:inDeparture -->
Is the hull still on the departure the port pushed it onto? By the clock, or by riding the exit lane outbound.
<!-- /note -->

### <a id="s-mouthAround"></a>`mouthAround(ship, only=)`

function · **exported** · L279–290

- calls: [`d3`](#s-d3) · [`mouthCoords`](stationyard.js.md#s-mouthCoords) _js/station/stationyard.js_
- called by: [`approachOf`](#s-approachOf)

<!-- note:mouthAround -->
Which hangar mouth the ship is inside, if any: { st, hangar, m }

- L286 · `if (c.along < m.d && c.along > -m.d * 0.95 && Math.abs(c.lat) < m.w * 0.5 && Math.abs(c.ve` — the mouth's reach: a bay-depth out in front of the aperture, and the bay itself
<!-- /note -->

### <a id="s-easeInOut"></a>`easeInOut(u)`

function · L292–292

- called by: [`stepTractor`](#s-stepTractor)

<!-- note:easeInOut -->
<!-- /note -->

### <a id="s-engageTractor"></a>`engageTractor(st, ship, hangar=, why=)`

function · **exported** · L294–320

- calls: [`d3`](#s-d3) · [`mouthCoords`](stationyard.js.md#s-mouthCoords) _js/station/stationyard.js_
- called by: [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_ · [`autoTractor`](#s-autoTractor)

<!-- note:engageTractor -->
Port control takes the helm. Returns the tractor or null with a reason.

- L298 · `const door = { x: st.x + m.entry.x, y: st.y + m.entry.y, z: st.z + m.entry.z };` — the ENTRY door: port half of the aperture
- L300 · `const gate = { x: door.x + m.dir.x * gateD, y: door.y + m.dir.y * gateD, z: door.z + m.dir` — square on to the door before the sill
- L304 · `const pts = [from];` — the path: gather to the gate off the entry door if you are outside it, then the door, then the clamps
<!-- /note -->

### <a id="s-releaseTractor"></a>`releaseTractor()`

function · **exported** · L322–322

- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_ · [`returnToMenu`](../sim/sim.js.md#s-returnToMenu) _js/sim/sim.js_ · [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_ · [`stepTractor`](#s-stepTractor) ×3

<!-- note:releaseTractor -->
<!-- /note -->

### <a id="s-holdOff"></a>`holdOff(time, secs=, stId=)`

function · **exported** · L323–323

- called by: [`stepTractorTick`](../sim/sim.js.md#s-stepTractorTick) _js/sim/sim.js_

<!-- note:holdOff -->
No lock is taken for `secs`; with a port given, that port treats you as outbound until you are off its exit lane.
<!-- /note -->

### <a id="s-stepTractor"></a>`stepTractor(dt, ship)`

function · **exported** · L325–361

- calls: [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_ · [`easeInOut`](#s-easeInOut) · [`releaseTractor`](#s-releaseTractor) ×3
- called by: [`stepTractorTick`](../sim/sim.js.md#s-stepTractorTick) _js/sim/sim.js_

<!-- note:stepTractor -->
Advance the tractor: moves the ship along the path in the station's frame. Returns "docked" when it lands.

- L329 · `tractor.t += dt * (tractor.rush ?? 1);` — js/ui/dockboot.js sets rush while the canopy is covered by the boot sequence
- L330 · `const drift = { x: st.x - tractor.origin.x, y: st.y - tractor.origin.y, z: st.z - tractor.` — the path was laid in world space at capture; the station has moved since — follow it
- L339 · `const k = Math.min(1, dt * 1.6);` — the nose comes round to the bay
- L349 · `const d = tractor.exitDir;` — let go with way on, pointed out along the exit line, and stay hands-off for a while
- L352 · `return "released";` — the caller calls holdOff(time) so no lock is taken on the way out
<!-- /note -->

### <a id="s-autoTractor"></a>`autoTractor(ship, relSpeedOf, time)`

function · **exported** · L363–374

- calls: [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_ · [`approachOf`](#s-approachOf) · [`clearDockRequest`](#s-clearDockRequest) · [`engageTractor`](#s-engageTractor) · [`hasDockRequest`](#s-hasDockRequest) · [`inDeparture`](#s-inDeparture)
- called by: [`stepTractorTick`](../sim/sim.js.md#s-stepTractorTick) _js/sim/sim.js_

<!-- note:autoTractor -->
Port control reaches for a hull that asked for a berth once it is on the entry lane or in the mouth.
A hull that did not ask is left alone (the puck rings instead). Returns the station taken, or null.
<!-- /note -->

### <a id="s-unrequestedApproach"></a>`unrequestedApproach(ship, time)`

function · **exported** · L376–386

- calls: [`approachOf`](#s-approachOf) · [`d3`](#s-d3) · [`hasDockRequest`](#s-hasDockRequest) · [`inDeparture`](#s-inDeparture)
- called by: [`stepTractorTick`](../sim/sim.js.md#s-stepTractorTick) _js/sim/sim.js_

<!-- note:unrequestedApproach -->
A hull in a mouth or on the entry lane with no berth asked for: who should be talking to it.
<!-- /note -->

### <a id="s-engagePush"></a>`engagePush(st, ship, hangar=)`

function · **exported** · L388–405

- calls: [`lanePoint`](../npc/lanes.js.md#s-lanePoint) _js/npc/lanes.js_ · [`stationLane`](../npc/lanes.js.md#s-stationLane) _js/npc/lanes.js_ · [`d3`](#s-d3) ×3
- called by: [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_

<!-- note:engagePush -->
Undocking: port control pushes the hull out of the bay, through the mouth and clear of the capture reach, then lets go.

- L391 · `const door = { x: st.x + m.exit.x, y: st.y + m.exit.y, z: st.z + m.exit.z };` — the EXIT door: starboard half of the aperture
- L393 · `const clear = hangar === 0 && st.port ? lanePoint(st, "exit", RELEASE_U) : { x: door.x + m` — the release point: up the exit lane's centre way, past the funnel and outside the tractor's reach
- L397 · `{ a: from, b: door, t: Math.max(2.5, d3(from, door) / 12) },` — off the clamps and across to the exit door, dead slow
- L398 · `{ a: door, b: sill, t: Math.max(1.5, d3(door, sill) / 22) },` — over the sill
- L399 · `{ a: sill, b: clear, t: Math.max(3, d3(sill, clear) / 48) },` — up the exit lane, gathering way
<!-- /note -->
