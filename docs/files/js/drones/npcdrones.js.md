# js/drones/npcdrones.js

[index](../../../README.md) · 241 lines · 19 symbols · 10 imports · 6 importers

## About

<!-- note:@file -->
LIVING GALAXY — the corporations' drones.

0.3.59 — a port's drones are its guards and its repair crew. Reported:
too many drones making deliveries, and stations should field combat and
repair drones instead. A corporation's line is now:

  major    a miner (the corporation's own property — it feeds the shelves),
           a DELIVERY hauler while the sky has fewer than
           DRONE_LINE.deliveryCap of them (else a guard), and a repair drone
  alt      a miner and a guard
  hostile  a gun drone, as before

A guard of an honest port patrols it and puts rounds on anything hostile
inside its reach — rogue drones, pirates — and its kills are the port's,
not yours. A repair drone patches YOUR hull when you are near its port, out
of a fight, and not wanted by it. Your own drones are untouched.

Every NPC corporation with a port fields a small drone line of its own:
miners on the belt nearest its home, haulers on the shared work board
(board.js). They are the same machines you build — the same roles, holds
and speeds — so a freight slot one of them holds is a slot your hauler
cannot, and their ore lands on their port's shelves (economy.js), which
is where the prices you see come from.

Deterministic from the sky seed: same corps, same drones, same names. No
chat, no memory — they are the traffic's small end. Near you they render
as robots (droneforge, kind = role, livery from the port's sector) with
labels; hostile corps' drones are hostile contacts and shoot back at the
same rate a gun drone does.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../station/stations.js` | `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 3 | `../corp/corps.js` | `corps`, `corpById` | [js/corp/corps.js](../corp/corps.js.md) |
| 4 | `../world/bodies.js` | `currentSystem` | [js/world/bodies.js](../world/bodies.js.md) |
| 5 | `../world/field.js` | `nearbyRocks`, `wearRock`, `depleted` | [js/world/field.js](../world/field.js.md) |
| 6 | `../economy/economy.js` | `deliver`, `lift` | [js/economy/economy.js](../economy/economy.js.md) |
| 7 | `../world/generate.js` | `rngFromSeed` | [js/world/generate.js](../world/generate.js.md) |
| 8 | `../npc/bay.js` | `droneDoorGoal`, `startDroneBay`, `stepDroneBay` | [js/npc/bay.js](../npc/bay.js.md) |
| 9 | `./roles.js` | `DRONE_ROLES`, `LANE_SPEED`, `NEAR_SPEED`, `LANE_OVER`, `JUMP_SPEED`, `JUMP_OVER`, `DOCK_SECS` | [js/drones/roles.js](roles.js.md) |
| 10 | `./board.js` | `openFreight`, `claim`, `touch`, `release`, `releaseAll` | [js/drones/board.js](board.js.md) |

## Imported by

- [js/console/panels/work-drones.js](../console/panels/work-drones.js.md) — `npcDroneReport`
- [js/flight/turrets.js](../flight/turrets.js.md) — `npcDrones`
- [js/render/engine.js](../render/engine.js.md) — `npcDrones`
- [js/sim/sim.js](../sim/sim.js.md) — `populateNpcDrones`, `stepNpcDrones`, `npcDroneHooks`, `npcDrones`, `DRONE_LINE`
- test/bay.test.mjs _(outside js/)_ — `npcDrones`, `stepNpcDrones`
- test/portdrones.test.mjs _(outside js/)_ — `npcDrones`, `stepNpcDrones`, `populateNpcDrones`, `DRONE_LINE`, `npcDroneHooks`

## Exports

- [`npcDrones`](#s-npcDrones) · const — used by [js/flight/turrets.js](../flight/turrets.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), test/bay.test.mjs, test/portdrones.test.mjs
- [`DRONE_LINE`](#s-DRONE_LINE) · const — used by [js/sim/sim.js](../sim/sim.js.md), test/portdrones.test.mjs
- [`npcDroneHooks`](#s-npcDroneHooks) · const — used by [js/sim/sim.js](../sim/sim.js.md), test/portdrones.test.mjs
- [`populateNpcDrones`](#s-populateNpcDrones) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/portdrones.test.mjs
- [`resetNpcDrones`](#s-resetNpcDrones) · function — **no importer in scanned roots**
- [`stepNpcDrones`](#s-stepNpcDrones) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/bay.test.mjs, test/portdrones.test.mjs
- [`npcDronesNear`](#s-npcDronesNear) · function — **no importer in scanned roots**
- [`npcDroneReport`](#s-npcDroneReport) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)

## Effects

- **bus.emit** — `‹u› on npcDroneHooks` (stepCombat:219)

## Symbols

### <a id="s-npcDrones"></a>`npcDrones`

const · **exported** · L12–12

<!-- note:npcDrones -->
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L14–14

- called by: [`npcDronesNear`](#s-npcDronesNear) · [`stepCombat`](#s-stepCombat) ×2 · [`stepMiner`](#s-stepMiner) ×2

<!-- note:d3 -->
<!-- /note -->

### <a id="s-STEP"></a>`STEP`

const · L15–15

<!-- note:STEP -->
<!-- /note -->

### <a id="s-DRONE_LINE"></a>`DRONE_LINE`

const · **exported** · L16–23

<!-- note:DRONE_LINE -->
- L17 · `deliveryCap: 3,` — delivery haulers in a whole sky, at most
- L18 · `major: ["miner", "haul", "repair"],` — "haul": a hauler while under the cap, a guard after
<!-- /note -->

### <a id="s-npcDroneHooks"></a>`npcDroneHooks`

const · **exported** · L24–24

<!-- note:npcDroneHooks -->
the sim wires these: rounds, and the hull a repair drone may patch
<!-- /note -->

### <a id="s-beltPointNear"></a>`beltPointNear(p, rnd)`

function · L26–33

- called by: [`populateNpcDrones`](#s-populateNpcDrones)

<!-- note:beltPointNear -->
<!-- /note -->

### <a id="s-populateNpcDrones"></a>`populateNpcDrones(seed)`

function · **exported** · L35–61

- calls: [`beltPointNear`](#s-beltPointNear) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ · [`rngFromSeed`](../world/generate.js.md#s-rngFromSeed) _js/world/generate.js_
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:populateNpcDrones -->
Field every corporation's drones for this sky.
<!-- /note -->

### <a id="s-resetNpcDrones"></a>`resetNpcDrones()`

function · **exported** · L63–63

<!-- note:resetNpcDrones -->
<!-- /note -->

### <a id="s-flyTo"></a>`flyTo(u, p, dt, stopR=)`

function · L65–76

- called by: [`patrol`](#s-patrol) · [`stepCombat`](#s-stepCombat) · [`stepHauler`](#s-stepHauler) ×2 · [`stepMiner`](#s-stepMiner) ×3 · [`stepRepair`](#s-stepRepair)

<!-- note:flyTo -->
- L66 · `if (p.vx || p.vy || p.vz) { u.x += (p.vx ?? 0) * dt; u.y += (p.vy ?? 0) * dt; u.z += (p.vz` — a port rides its orbit at hundreds of u/s: match its frame first, then close on it
<!-- /note -->

### <a id="s-stepNpcDrones"></a>`stepNpcDrones()`

function · **exported** · L78–88

- calls: [`stepUnit`](#s-stepUnit)
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepNpcDrones -->
<!-- /note -->

### <a id="s-_door"></a>`_door`

const · L90–90

<!-- note:_door -->
<!-- /note -->

### <a id="s-stepUnit"></a>`stepUnit(u, dt)`

function · L91–121

- calls: [`releaseAll`](board.js.md#s-releaseAll) _js/drones/board.js_ · [`stepCombat`](#s-stepCombat) · [`stepHauler`](#s-stepHauler) · [`stepMiner`](#s-stepMiner) · [`stepRepair`](#s-stepRepair) · [`deliver`](../economy/economy.js.md#s-deliver) _js/economy/economy.js_ · [`startDroneBay`](../npc/bay.js.md#s-startDroneBay) _js/npc/bay.js_ · [`stepDroneBay`](../npc/bay.js.md#s-stepDroneBay) _js/npc/bay.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×2
- called by: [`stepNpcDrones`](#s-stepNpcDrones)

<!-- note:stepUnit -->
- L95 · `const at = stationById(u.dockedAt) ?? home;` — 0.3.15: in by the entry door, out by the exit door (npc/bay.js)
- L113 · `if (u.hold > 0 && u.good) deliver(home, u.good, u.hold);` — whatever it carried lands on its own shelf, not in the void
<!-- /note -->

### <a id="s-stepMiner"></a>`stepMiner(u, dt, home)`

function · L123–157

- calls: [`d3`](#s-d3) ×2 · [`flyTo`](#s-flyTo) ×3 · [`deliver`](../economy/economy.js.md#s-deliver) _js/economy/economy.js_ · [`droneDoorGoal`](../npc/bay.js.md#s-droneDoorGoal) _js/npc/bay.js_ · [`startDroneBay`](../npc/bay.js.md#s-startDroneBay) _js/npc/bay.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_ · [`wearRock`](../world/field.js.md#s-wearRock) _js/world/field.js_
- via [js/world/field.js](../world/field.js.md): `depleted.get`, `nearbyRocks.filter`
- called by: [`stepUnit`](#s-stepUnit)

<!-- note:stepMiner -->
- L151 · `if (u.good && u.good !== rock.ore && u.hold > 0) { u.state = "returning"; return; }` — one ore a trip: the shelf wants a bill it can read
<!-- /note -->

### <a id="s-stepHauler"></a>`stepHauler(u, dt, home)`

function · L159–191

- calls: [`claim`](board.js.md#s-claim) _js/drones/board.js_ · [`openFreight`](board.js.md#s-openFreight) _js/drones/board.js_ ×2 · [`release`](board.js.md#s-release) _js/drones/board.js_ ×3 · [`touch`](board.js.md#s-touch) _js/drones/board.js_ · [`flyTo`](#s-flyTo) ×2 · [`deliver`](../economy/economy.js.md#s-deliver) _js/economy/economy.js_ · [`lift`](../economy/economy.js.md#s-lift) _js/economy/economy.js_ · [`droneDoorGoal`](../npc/bay.js.md#s-droneDoorGoal) _js/npc/bay.js_ · [`startDroneBay`](../npc/bay.js.md#s-startDroneBay) _js/npc/bay.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×2
- called by: [`stepUnit`](#s-stepUnit)

<!-- note:stepHauler -->
- L164 · `const slot = openFreight({ home, cap: u.holdCap, who: u.id, n: 1, maxKm: 60000 })[0]` — 0.3.59: three delivery haulers in a whole sky are a freight line, not a port's
  shuttle — local work first, then the best-paying run anywhere on the board
<!-- /note -->

### <a id="s-patrol"></a>`patrol(u, dt, home, what)`

function · L193–200

- calls: [`flyTo`](#s-flyTo)
- called by: [`stepCombat`](#s-stepCombat) ×2 · [`stepRepair`](#s-stepRepair)

<!-- note:patrol -->
<!-- /note -->

### <a id="s-stepCombat"></a>`stepCombat(u, dt, home)`

function · L202–221

- calls: [`d3`](#s-d3) ×2 · [`flyTo`](#s-flyTo) · [`patrol`](#s-patrol) ×2
- called by: [`stepUnit`](#s-stepUnit)
- effects: bus.emit `‹u›`

<!-- note:stepCombat -->
- L203 · `if (u.hostile) return patrol(u, dt, home, "patrolling");` — a hold's gun drone: circles its port; the turret board (turrets.js) makes it a hostile contact
- L204 · `const foes = npcDroneHooks.hostiles?.() ?? [];` — 0.3.59: an honest port's guard — anything hostile inside its reach gets rounds
<!-- /note -->

### <a id="s-stepRepair"></a>`stepRepair(u, dt, home)`

function · L223–231

- calls: [`flyTo`](#s-flyTo) · [`patrol`](#s-patrol)
- called by: [`stepUnit`](#s-stepUnit)

<!-- note:stepRepair -->
0.3.59: a port's repair drone patches a hull near its port that is out of a fight
<!-- /note -->

### <a id="s-npcDronesNear"></a>`npcDronesNear(p, range)`

function · **exported** · L233–237

- calls: [`d3`](#s-d3)

<!-- note:npcDronesNear -->
Drones inside `range` of a point, for the engine's labels and meshes.
<!-- /note -->

### <a id="s-npcDroneReport"></a>`npcDroneReport()`

function · **exported** · L239–241

- calls: [`corpById`](../corp/corps.js.md#s-corpById) _js/corp/corps.js_
- called by: [`boardSection`](../console/panels/work-drones.js.md#s-boardSection) _js/console/panels/work-drones.js_

<!-- note:npcDroneReport -->
<!-- /note -->
