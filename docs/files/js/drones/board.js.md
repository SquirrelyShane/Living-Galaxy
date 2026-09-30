# js/drones/board.js

[index](../../../README.md) · 57 lines · 13 symbols · 3 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY — the work board.

One list of open work for every hull that can take it: your drones, the
NPC corporations' drones, and (through the same claims) company fleet
hulls. A slot is claimed by one worker at a time; claims expire if the
worker goes quiet, so a dead drone frees its job.

  freight  goods a port is short of that another port can spare
  escort   (reserved) a flow boat wants a gun alongside

`claim(key, who, ttl)` / `release(key)` / `heldBy(key)` / `openFreight()`

- L7 · `export const FREIGHT_RATE = 0.14;` — of the buyer's bid, per unit hauled, paid to the hauler's company
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../station/stations.js` | `stations` | [js/station/stations.js](../station/stations.js.md) |
| 2 | `../economy/economy.js` | `stockOf`, `bidPrice`, `shortagesOf` | [js/economy/economy.js](../economy/economy.js.md) |
| 3 | `../economy/materials.js` | `goodName` | [js/economy/materials.js](../economy/materials.js.md) |

## Imported by

- [js/console/panels/work-drones.js](../console/panels/work-drones.js.md) — `boardReport`
- [js/drones/npcdrones.js](npcdrones.js.md) — `openFreight`, `claim`, `touch`, `release`, `releaseAll`
- [js/drones/ops.js](ops.js.md) — `openFreight`, `claim`, `touch`, `release`, `releaseAll`, `freightKey`, `FREIGHT_RATE`
- [js/sim/sim.js](../sim/sim.js.md) — `board`, `resetBoard`

## Exports

- [`board`](#s-board) · const — used by [js/sim/sim.js](../sim/sim.js.md)
- [`FREIGHT_RATE`](#s-FREIGHT_RATE) · const — used by [js/drones/ops.js](ops.js.md)
- [`freightKey`](#s-freightKey) · function — used by [js/drones/ops.js](ops.js.md)
- [`claim`](#s-claim) · function — used by [js/drones/npcdrones.js](npcdrones.js.md), [js/drones/ops.js](ops.js.md)
- [`touch`](#s-touch) · function — used by [js/drones/npcdrones.js](npcdrones.js.md), [js/drones/ops.js](ops.js.md)
- [`release`](#s-release) · function — used by [js/drones/npcdrones.js](npcdrones.js.md), [js/drones/ops.js](ops.js.md)
- [`heldBy`](#s-heldBy) · function — **no importer in scanned roots**
- [`releaseAll`](#s-releaseAll) · function — used by [js/drones/npcdrones.js](npcdrones.js.md), [js/drones/ops.js](ops.js.md)
- [`resetBoard`](#s-resetBoard) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`openFreight`](#s-openFreight) · function — used by [js/drones/npcdrones.js](npcdrones.js.md), [js/drones/ops.js](ops.js.md)
- [`boardReport`](#s-boardReport) · function — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-board"></a>`board`

const · **exported** · L5–5

<!-- note:board -->
<!-- /note -->

#### <a id="s-board-clock"></a>`board.clock()`

prop · L5–5

<!-- note:board.clock -->
<!-- /note -->

### <a id="s-FREIGHT_RATE"></a>`FREIGHT_RATE`

const · **exported** · L7–7

<!-- note:FREIGHT_RATE -->
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L9–9

- called by: [`openFreight`](#s-openFreight) ×3

<!-- note:d3 -->
<!-- /note -->

### <a id="s-freightKey"></a>`freightKey(s)`

function · **exported** · L10–10

- called by: [`openFreight`](#s-openFreight) · [`assignSlot`](ops.js.md#s-assignSlot) _js/drones/ops.js_ · [`loadDroneOps`](ops.js.md#s-loadDroneOps) _js/drones/ops.js_ · [`releaseSlot`](ops.js.md#s-releaseSlot) _js/drones/ops.js_ · [`runFreight`](ops.js.md#s-runFreight) _js/drones/ops.js_

<!-- note:freightKey -->
<!-- /note -->

### <a id="s-claim"></a>`claim(key, who, ttl=)`

function · **exported** · L12–18

- called by: [`stepHauler`](npcdrones.js.md#s-stepHauler) _js/drones/npcdrones.js_ · [`assignSlot`](ops.js.md#s-assignSlot) _js/drones/ops.js_ · [`loadDroneOps`](ops.js.md#s-loadDroneOps) _js/drones/ops.js_

<!-- note:claim -->
<!-- /note -->

### <a id="s-touch"></a>`touch(key, who, ttl=)`

function · **exported** · L19–19

- called by: [`stepHauler`](npcdrones.js.md#s-stepHauler) _js/drones/npcdrones.js_ · [`runFreight`](ops.js.md#s-runFreight) _js/drones/ops.js_

<!-- note:touch -->
<!-- /note -->

### <a id="s-release"></a>`release(key, who=)`

function · **exported** · L20–20

- called by: [`stepHauler`](npcdrones.js.md#s-stepHauler) _js/drones/npcdrones.js_ ×3 · [`releaseSlot`](ops.js.md#s-releaseSlot) _js/drones/ops.js_

<!-- note:release -->
<!-- /note -->

### <a id="s-heldBy"></a>`heldBy(key)`

function · **exported** · L21–21

- called by: [`openFreight`](#s-openFreight)

<!-- note:heldBy -->
<!-- /note -->

### <a id="s-releaseAll"></a>`releaseAll(who)`

function · **exported** · L22–22

- called by: [`stepUnit`](npcdrones.js.md#s-stepUnit) _js/drones/npcdrones.js_ · [`destroy`](ops.js.md#s-destroy) _js/drones/ops.js_ · [`scrapDrone`](ops.js.md#s-scrapDrone) _js/drones/ops.js_

<!-- note:releaseAll -->
<!-- /note -->

### <a id="s-resetBoard"></a>`resetBoard()`

function · **exported** · L23–23

- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:resetBoard -->
<!-- /note -->

### <a id="s-openFreight"></a>`openFreight({…}=)`

function · **exported** · L25–52

- calls: [`d3`](#s-d3) ×3 · [`freightKey`](#s-freightKey) · [`heldBy`](#s-heldBy) · [`bidPrice`](../economy/economy.js.md#s-bidPrice) _js/economy/economy.js_ · [`shortagesOf`](../economy/economy.js.md#s-shortagesOf) _js/economy/economy.js_ · [`stockOf`](../economy/economy.js.md#s-stockOf) _js/economy/economy.js_ ×2 · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_
- via [js/station/stations.js](../station/stations.js.md): `stations.filter`
- via [js/economy/economy.js](../economy/economy.js.md): `shortagesOf.slice`
- called by: [`stepHauler`](npcdrones.js.md#s-stepHauler) _js/drones/npcdrones.js_ ×2 · [`freightSlots`](ops.js.md#s-freightSlots) _js/drones/ops.js_

<!-- note:openFreight -->
Freight slots near `home`, best pay-per-km first. `cap` is the taker's hold; `who`
sees its own claims as open. Excludes slots somebody else holds.
<!-- /note -->

### <a id="s-boardReport"></a>`boardReport()`

function · **exported** · L54–57

- called by: [`boardSection`](../console/panels/work-drones.js.md#s-boardSection) _js/console/panels/work-drones.js_

<!-- note:boardReport -->
Everything on the board and who holds it — for the deck and the tests.
<!-- /note -->
