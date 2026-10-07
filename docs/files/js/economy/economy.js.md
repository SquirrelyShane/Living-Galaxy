# js/economy/economy.js

[index](../../../README.md) · 262 lines · 30 symbols · 1 imports · 21 importers

## About

<!-- note:@file -->
LIVING GALAXY — the ledger: a working economy under the ports.

Before this, a port's stock was a list rolled at launch that only the
player ever touched, and a price was a sector multiplier on a book value.
Now every port is a going concern:

  LINES     each sector runs production lines that eat inputs and make
            outputs every ECON_TICK — a foundry turns ore into steel and
            plate, a grow ring turns phosphorus and water into rations, a
            habitat consumes rations and water and makes little but
            credits. A line with an empty input stalls, and a stalled line
            is a SHORTAGE the port will pay over the odds to fix.
  STOCK     the same st.stock list the market tab shows, now moved by
            everyone: the lines, the flow boats (npc/flow.js — an inbound
            copper boat that docks adds its copper; an outbound plate boat
            that leaves takes its plate), the traffic captains running real
            cargo between real ports (npc/traffic.js), and you.
  PRICES    a curve on stock against the port's TARGET for that good: bare
            shelves pay up to 1.7× book and charge the same; a glut pays
            0.6×. Sell a hold of copper ore into a foundry and watch the
            price you got fall behind you.
  TREASURY  st.credits: what the port can pay you with. Lines earn it,
            buying from you spends it, and it recovers on its own slowly.

Pure data with a tick; nothing here touches three.js or the DOM. The
lines and targets are deterministic per port; the stock is live and local
(world sync does not carry it — every client's markets drift alone, which
is fine: prices are a thing you fly to find out).

- L3 · `export const ECON_TICK = 20;` — sim seconds between production passes
- L4 · `export const PRICE_FLOOR = 0.8;` — glut: what a port pays / charges at the bottom of the curve, × book
- L5 · `export const PRICE_CEIL = 1.3;` — shortage: the top of the curve
- L6 · `export const SHORT_FRAC = 0.25;` — stock under this fraction of target is a shortage
- L7 · `export const GLUT_FRAC = 2.2;` — stock over this multiple of target is a glut
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./materials.js` | `SECTORS`, `priceAt`, `baseValue`, `goodName`, `good` | [js/economy/materials.js](materials.js.md) |

## Imported by

- [js/aria/foresee.js](../aria/foresee.js.md) — `runLines`, `stockOf`, `stockMultAt`, `lotMult`, `targetFor`, `bidPrice`, `askPrice`, `LINES`, `GLUT_FRAC`, `SHORT_FRAC`
- [js/aria/play.js](../aria/play.js.md) — `stockOf`, `askPrice`
- [js/aria/play.js](../aria/play.js.md) — `PRICE_CEIL`, `PRICE_FLOOR`
- [js/aria/senses.js](../aria/senses.js.md) — `econReport`, `stockOf`, `shortagesOf`, `wantsOf`
- [js/aria/wake.js](../aria/wake.js.md) — `stockOf`, `stockMultAt`, `targetFor`, `LINES`, `GLUT_FRAC`, `SHORT_FRAC`
- [js/comms/comms.js](../comms/comms.js.md) — `shortagesOf`
- [js/corp/fleet.js](../corp/fleet.js.md) — `bidPrice`
- [js/drones/board.js](../drones/board.js.md) — `stockOf`, `bidPrice`, `shortagesOf`
- [js/drones/npcdrones.js](../drones/npcdrones.js.md) — `deliver`, `lift`
- [js/drones/ops.js](../drones/ops.js.md) — `stockOf`, `lift`, `deliver`, `askPrice`, `bidPrice`, `shortagesOf`
- [js/economy/contracts.js](contracts.js.md) — `shortagesOf`, `wantsOf`, `bidPrice`, `askPrice`, `stockOf`, `deliver`, `lift`
- [js/npc/flow.js](../npc/flow.js.md) — `cargoFor`, `deliver`, `lift`, `stockOf`
- [js/npc/traffic.js](../npc/traffic.js.md) — `legCargo`, `pickCargoAt`, `deliver`, `lift`, `targetFor`, `stockOf`
- [js/sim/sim.js](../sim/sim.js.md) — `stepEconomy`, `stockMult`, `lotMult`, `askPrice`, `econReport`, `wantsOf`, `econHooks`
- test/ariasense.test.mjs _(outside js/)_ — `ledgerOf`, `lift`
- test/balance.test.mjs _(outside js/)_ — `bidPrice`, `stockMultAt`, `targetFor`, `PRICE_FLOOR`, `PRICE_CEIL`, `GLUT_FRAC`
- test/chains.test.mjs _(outside js/)_ — `stockOf`
- test/dockwork.test.mjs _(outside js/)_ — `deliver`
- test/economy.test.mjs _(outside js/)_ — `LINES`, `ECON_TICK`, `PRICE_FLOOR`, `PRICE_CEIL`, `stockMult`, `stockOf`, `runLines`, `stepEconomy`, `deliver`, `lift`, `shortagesOf`, `wantsOf`, `targetFor`, `econReport`, `ledgerOf`
- test/hold.test.mjs _(outside js/)_ — `deliver`
- test/stafflife.test.mjs _(outside js/)_ — `econHooks`

## Exports

- [`ECON_TICK`](#s-ECON_TICK) · const — used by test/economy.test.mjs
- [`PRICE_FLOOR`](#s-PRICE_FLOOR) · const — used by [js/aria/play.js](../aria/play.js.md), test/balance.test.mjs, test/economy.test.mjs
- [`PRICE_CEIL`](#s-PRICE_CEIL) · const — used by [js/aria/play.js](../aria/play.js.md), test/balance.test.mjs, test/economy.test.mjs
- [`SHORT_FRAC`](#s-SHORT_FRAC) · const — used by [js/aria/foresee.js](../aria/foresee.js.md), [js/aria/wake.js](../aria/wake.js.md)
- [`GLUT_FRAC`](#s-GLUT_FRAC) · const — used by [js/aria/foresee.js](../aria/foresee.js.md), [js/aria/wake.js](../aria/wake.js.md), test/balance.test.mjs
- [`LINES`](#s-LINES) · const — used by [js/aria/foresee.js](../aria/foresee.js.md), [js/aria/wake.js](../aria/wake.js.md), test/economy.test.mjs
- [`tierOf`](#s-tierOf) · function — **no importer in scanned roots**
- [`targetFor`](#s-targetFor) · function — used by [js/aria/foresee.js](../aria/foresee.js.md), [js/aria/wake.js](../aria/wake.js.md), [js/npc/traffic.js](../npc/traffic.js.md), test/balance.test.mjs, test/economy.test.mjs
- [`stockOf`](#s-stockOf) · function — used by [js/aria/foresee.js](../aria/foresee.js.md), [js/aria/play.js](../aria/play.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/aria/wake.js](../aria/wake.js.md), [js/drones/board.js](../drones/board.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/contracts.js](contracts.js.md), [js/npc/flow.js](../npc/flow.js.md), [js/npc/traffic.js](../npc/traffic.js.md), test/chains.test.mjs, test/economy.test.mjs
- [`stockMultAt`](#s-stockMultAt) · function — used by [js/aria/foresee.js](../aria/foresee.js.md), [js/aria/wake.js](../aria/wake.js.md), test/balance.test.mjs
- [`stockMult`](#s-stockMult) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/economy.test.mjs
- [`lotMult`](#s-lotMult) · function — used by [js/aria/foresee.js](../aria/foresee.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`askPrice`](#s-askPrice) · function — used by [js/aria/foresee.js](../aria/foresee.js.md), [js/aria/play.js](../aria/play.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/contracts.js](contracts.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`bidPrice`](#s-bidPrice) · function — used by [js/aria/foresee.js](../aria/foresee.js.md), [js/corp/fleet.js](../corp/fleet.js.md), [js/drones/board.js](../drones/board.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/contracts.js](contracts.js.md), test/balance.test.mjs
- [`deliver`](#s-deliver) · function — used by [js/drones/npcdrones.js](../drones/npcdrones.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/contracts.js](contracts.js.md), [js/npc/flow.js](../npc/flow.js.md), [js/npc/traffic.js](../npc/traffic.js.md), test/dockwork.test.mjs, test/economy.test.mjs, test/hold.test.mjs
- [`lift`](#s-lift) · function — used by [js/drones/npcdrones.js](../drones/npcdrones.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/contracts.js](contracts.js.md), [js/npc/flow.js](../npc/flow.js.md), [js/npc/traffic.js](../npc/traffic.js.md), test/ariasense.test.mjs, test/economy.test.mjs
- [`ledgerOf`](#s-ledgerOf) · function — used by test/ariasense.test.mjs, test/economy.test.mjs
- [`econHooks`](#s-econHooks) · const — used by [js/sim/sim.js](../sim/sim.js.md), test/stafflife.test.mjs
- [`runLines`](#s-runLines) · function — used by [js/aria/foresee.js](../aria/foresee.js.md), test/economy.test.mjs
- [`stepEconomy`](#s-stepEconomy) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/economy.test.mjs
- [`shortagesOf`](#s-shortagesOf) · function — used by [js/aria/senses.js](../aria/senses.js.md), [js/comms/comms.js](../comms/comms.js.md), [js/drones/board.js](../drones/board.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/contracts.js](contracts.js.md), test/economy.test.mjs
- [`glutsOf`](#s-glutsOf) · function — **no importer in scanned roots**
- [`wantsOf`](#s-wantsOf) · function — used by [js/aria/senses.js](../aria/senses.js.md), [js/economy/contracts.js](contracts.js.md), [js/sim/sim.js](../sim/sim.js.md), test/economy.test.mjs
- [`cargoFor`](#s-cargoFor) · function — used by [js/npc/flow.js](../npc/flow.js.md)
- [`pickCargoAt`](#s-pickCargoAt) · function — used by [js/npc/traffic.js](../npc/traffic.js.md)
- [`legCargo`](#s-legCargo) · function — used by [js/npc/traffic.js](../npc/traffic.js.md)
- [`econReport`](#s-econReport) · function — used by [js/aria/senses.js](../aria/senses.js.md), [js/sim/sim.js](../sim/sim.js.md), test/economy.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-ECON_TICK"></a>`ECON_TICK`

const · **exported** · L3–3

<!-- note:ECON_TICK -->
<!-- /note -->

### <a id="s-PRICE_FLOOR"></a>`PRICE_FLOOR`

const · **exported** · L4–4

<!-- note:PRICE_FLOOR -->
0.3.24 — the band was 0.6 … 1.7, which is a 2.83× swing between a glutted
source and a bare buyer BEFORE the sector spread (another 1.3–1.6×) is
applied on top. That is where a doubling per hop came from: buy at the
floor, sell at the ceiling, fly the same two ports forever. Narrowed to
0.72 … 1.45 (a 2.01× swing), which still makes a shortage worth flying to
and a glut worth avoiding without making a round trip print money.

Contracts are unaffected: a delivery pays `max(bid, book)` plus a premium,
so the floor under contract work is the book price and narrowing the band
moves route profit down without moving job pay with it.

0.3.47 — narrowed again, 0.72…1.45 → 0.8…1.3 (a 1.63× swing). The trade
bench still found a motor bought at an industrial yard for 579 and sold at a
garrison for 996 — 1.7× in five minutes, 2,800 cr/min, with nothing made
and nothing mined. A shortage is still worth flying to; a round trip is a
living, not a fortune.
<!-- /note -->

### <a id="s-PRICE_CEIL"></a>`PRICE_CEIL`

const · **exported** · L5–5

<!-- note:PRICE_CEIL -->
<!-- /note -->

### <a id="s-SHORT_FRAC"></a>`SHORT_FRAC`

const · **exported** · L6–6

<!-- note:SHORT_FRAC -->
<!-- /note -->

### <a id="s-GLUT_FRAC"></a>`GLUT_FRAC`

const · **exported** · L7–7

<!-- note:GLUT_FRAC -->
<!-- /note -->

### <a id="s-CURVE_K"></a>`CURVE_K`

const · L8–8

<!-- note:CURVE_K -->
<!-- /note -->

### <a id="s-LINES"></a>`LINES`

const · **exported** · L10–42

<!-- note:LINES -->
Production lines by sector: what a pass eats and makes (units per tick at tier I; tier scales it).
Inputs are the sector's buys, outputs its sells — the trade map already told us who needs what.
<!-- /note -->

### <a id="s-tierOf"></a>`tierOf(st)`

function · **exported** · L44–47

- called by: [`econReport`](#s-econReport) · [`runLines`](#s-runLines) · [`targetFor`](#s-targetFor)

<!-- note:tierOf -->
The port's size as a multiplier on line rates and stock targets.
<!-- /note -->

### <a id="s-targetFor"></a>`targetFor(st, id)`

function · **exported** · L49–59

- calls: [`tierOf`](#s-tierOf)
- called by: [`foreseeBuy`](../aria/foresee.js.md#s-foreseeBuy) _js/aria/foresee.js_ · [`foreseeSale`](../aria/foresee.js.md#s-foreseeSale) _js/aria/foresee.js_ · [`wakeClose`](../aria/wake.js.md#s-wakeClose) _js/aria/wake.js_ · [`econReport`](#s-econReport) ×2 · [`glutsOf`](#s-glutsOf) ×2 · [`ledgerOf`](#s-ledgerOf) · [`pickCargoAt`](#s-pickCargoAt) · [`runLines`](#s-runLines) ×2 · [`shortagesOf>consider`](#s-shortagesOf-consider) · [`stockMultAt`](#s-stockMultAt) · [`liftCargo`](../npc/traffic.js.md#s-liftCargo) _js/npc/traffic.js_

<!-- note:targetFor -->
What the port would like to hold of a good: its outputs and inputs deep, everything else shallow.
<!-- /note -->

### <a id="s-stockOf"></a>`stockOf(st, id)`

function · **exported** · L61–63

- called by: [`counterfactual`](../aria/foresee.js.md#s-counterfactual) _js/aria/foresee.js_ ×2 · [`foreseeBuy`](../aria/foresee.js.md#s-foreseeBuy) _js/aria/foresee.js_ · [`foreseeSale`](../aria/foresee.js.md#s-foreseeSale) _js/aria/foresee.js_ · [`canFly`](../aria/play.js.md#s-canFly) _js/aria/play.js_ · [`jobPlan`](../aria/play.js.md#s-jobPlan) _js/aria/play.js_ · [`sourceFor`](../aria/play.js.md#s-sourceFor) _js/aria/play.js_ · [`wakeClose`](../aria/wake.js.md#s-wakeClose) _js/aria/wake.js_ · [`openFreight`](../drones/board.js.md#s-openFreight) _js/drones/board.js_ ×2 · [`ROLE_STEP.courier`](../drones/ops.js.md#s-ROLE_STEP-courier) _js/drones/ops.js_ · [`tradeRoutes`](../drones/ops.js.md#s-tradeRoutes) _js/drones/ops.js_ · [`KINDS.build`](contracts.js.md#s-KINDS-build) _js/economy/contracts.js_ · [`KINDS.courier`](contracts.js.md#s-KINDS-courier) _js/economy/contracts.js_ ×2 · [`acceptBlocker`](contracts.js.md#s-acceptBlocker) _js/economy/contracts.js_ · [`acceptContract`](contracts.js.md#s-acceptContract) _js/economy/contracts.js_ ×2 · [`cheapestSource`](contracts.js.md#s-cheapestSource) _js/economy/contracts.js_ · [`deliver`](#s-deliver) ×2 · [`lotMult`](#s-lotMult) · [`runLines`](#s-runLines) ×2 · [`shortagesOf>consider`](#s-shortagesOf-consider) · [`stockMult`](#s-stockMult) · [`stepFlow`](../npc/flow.js.md#s-stepFlow) _js/npc/flow.js_ · [`liftCargo`](../npc/traffic.js.md#s-liftCargo) _js/npc/traffic.js_

<!-- note:stockOf -->
<!-- /note -->

### <a id="s-stockMultAt"></a>`stockMultAt(st, id, q)`

function · **exported** · L65–69

- calls: [`targetFor`](#s-targetFor)
- called by: [`counterfactual`](../aria/foresee.js.md#s-counterfactual) _js/aria/foresee.js_ ×2 · [`foreseeBuy`](../aria/foresee.js.md#s-foreseeBuy) _js/aria/foresee.js_ ×2 · [`foreseeSale`](../aria/foresee.js.md#s-foreseeSale) _js/aria/foresee.js_ ×2 · [`wakeClose`](../aria/wake.js.md#s-wakeClose) _js/aria/wake.js_ ×2 · [`lotMult`](#s-lotMult) · [`stockMult`](#s-stockMult)

<!-- note:stockMultAt -->
The curve itself, at an arbitrary quantity — the thing a lot is integrated over.

- L67 · `const m = Math.pow(target / (Math.max(0, q) + 0.18 * target), CURVE_K);` — 0.3.47: the exponent was 0.45, which hit the 0.72 floor at 2× target —
  a glut past that point moved nothing, and a port sitting on four times
  what it wanted priced it the same as one on twice. The exponent is now
  whatever lands the curve on the floor where GLUT_FRAC says a glut starts,
  so the band and the curve cannot disagree again.
<!-- /note -->

### <a id="s-stockMult"></a>`stockMult(st, id)`

function · **exported** · L71–73

- calls: [`stockMultAt`](#s-stockMultAt) · [`stockOf`](#s-stockOf)
- called by: [`glutsOf`](#s-glutsOf) · [`lotMult`](#s-lotMult) · [`shortagesOf>consider`](#s-shortagesOf-consider) · [`wantsOf`](#s-wantsOf)

<!-- note:stockMult -->
Price curve on stock: bare shelves → PRICE_CEIL, target → about book, glut → PRICE_FLOOR.
<!-- /note -->

### <a id="s-lotMult"></a>`lotMult(st, id, qty, dir=)`

function · **exported** · L75–86

- calls: [`stockMult`](#s-stockMult) · [`stockMultAt`](#s-stockMultAt) · [`stockOf`](#s-stockOf)
- called by: [`foreseeSale`](../aria/foresee.js.md#s-foreseeSale) _js/aria/foresee.js_ · [`askPrice`](#s-askPrice) · [`bidPrice`](#s-bidPrice) · [`sellPriceAt`](../sim/sim.js.md#s-sellPriceAt) _js/sim/sim.js_

<!-- note:lotMult -->
0.3.24 — the price of a LOT, not of a unit.

Every trade in the game used to move the whole consignment at ONE price: the
marginal price for a single unit, applied a hundred and sixty times. So a
hold of girders emptied into a port that wanted forty of them still fetched
bare-shelf money on the hundred and sixtieth, and the shelf you had just
filled did not find out until the next tick. Stacked on top of a glutted
source that floored at PRICE_FLOOR, that is where the 2.3× round trips came
from — buy at 0.6× book, sell at 1.7×, repeat forever on the same two ports.

A lot now walks the curve as it lands. `dir` is +1 when the port's stock
RISES (you are selling to it) and −1 when it falls (you are buying). The
return is the AVERAGE multiplier across the fill, integrated by trapezoid in
a few steps — cheap, and close enough that the estimate and the transaction
agree, which matters more than the third decimal.

It is not a penalty on trading. It is the reason to find a second buyer.
<!-- /note -->

### <a id="s-askPrice"></a>`askPrice(st, id, qty=)`

function · **exported** · L88–90

- calls: [`lotMult`](#s-lotMult) · [`priceAt`](materials.js.md#s-priceAt) _js/economy/materials.js_
- called by: [`canFly`](../aria/play.js.md#s-canFly) _js/aria/play.js_ ×2 · [`sourceFor`](../aria/play.js.md#s-sourceFor) _js/aria/play.js_ · [`ROLE_STEP.courier`](../drones/ops.js.md#s-ROLE_STEP-courier) _js/drones/ops.js_ · [`tradeRoutes`](../drones/ops.js.md#s-tradeRoutes) _js/drones/ops.js_ · [`KINDS.consign`](contracts.js.md#s-KINDS-consign) _js/economy/contracts.js_ ×2 · [`KINDS.resupply`](contracts.js.md#s-KINDS-resupply) _js/economy/contracts.js_ · [`cheapestSource`](contracts.js.md#s-cheapestSource) _js/economy/contracts.js_ · [`econReport`](#s-econReport) · [`glutsOf`](#s-glutsOf) · [`buyPriceAt`](../sim/sim.js.md#s-buyPriceAt) _js/sim/sim.js_

<!-- note:askPrice -->
What the port charges for a good, live. `qty` prices the whole lot (see lotMult).
<!-- /note -->

### <a id="s-bidPrice"></a>`bidPrice(st, id, qty=)`

function · **exported** · L91–93

- calls: [`lotMult`](#s-lotMult) · [`priceAt`](materials.js.md#s-priceAt) _js/economy/materials.js_
- called by: [`value`](../corp/fleet.js.md#s-value) _js/corp/fleet.js_ ×2 · [`openFreight`](../drones/board.js.md#s-openFreight) _js/drones/board.js_ · [`ROLE_STEP.courier`](../drones/ops.js.md#s-ROLE_STEP-courier) _js/drones/ops.js_ · [`runFreight`](../drones/ops.js.md#s-runFreight) _js/drones/ops.js_ · [`tradeRoutes`](../drones/ops.js.md#s-tradeRoutes) _js/drones/ops.js_ · [`KINDS.procure`](contracts.js.md#s-KINDS-procure) _js/economy/contracts.js_ · [`goodValue`](contracts.js.md#s-goodValue) _js/economy/contracts.js_ · [`unitBasis`](contracts.js.md#s-unitBasis) _js/economy/contracts.js_ · [`econReport`](#s-econReport) · [`shortagesOf>consider`](#s-shortagesOf-consider) · [`wantsOf`](#s-wantsOf) ×2

<!-- note:bidPrice -->
What the port pays for a good, live. `qty` prices the whole lot.
<!-- /note -->

### <a id="s-adjust"></a>`adjust(st, id, dq)`

function · L95–107

- calls: [`priceAt`](materials.js.md#s-priceAt) _js/economy/materials.js_
- called by: [`deliver`](#s-deliver) · [`ledgerOf`](#s-ledgerOf) · [`lift`](#s-lift) · [`runLines`](#s-runLines) ×2

<!-- note:adjust -->
Raw stock move, no ledger: returns the actual change (a take never goes below zero).
<!-- /note -->

### <a id="s-deliver"></a>`deliver(st, id, qty)`

function · **exported** · L109–114

- calls: [`adjust`](#s-adjust) · [`ledgerOf`](#s-ledgerOf) · [`stockOf`](#s-stockOf) ×2
- called by: [`stepHauler`](../drones/npcdrones.js.md#s-stepHauler) _js/drones/npcdrones.js_ · [`stepMiner`](../drones/npcdrones.js.md#s-stepMiner) _js/drones/npcdrones.js_ · [`stepUnit`](../drones/npcdrones.js.md#s-stepUnit) _js/drones/npcdrones.js_ · [`ROLE_STEP.courier`](../drones/ops.js.md#s-ROLE_STEP-courier) _js/drones/ops.js_ · [`runFreight`](../drones/ops.js.md#s-runFreight) _js/drones/ops.js_ · [`acceptContract`](contracts.js.md#s-acceptContract) _js/economy/contracts.js_ · [`deliverContracts`](contracts.js.md#s-deliverContracts) _js/economy/contracts.js_ · [`stepFlow`](../npc/flow.js.md#s-stepFlow) _js/npc/flow.js_ · [`deliverCargo`](../npc/traffic.js.md#s-deliverCargo) _js/npc/traffic.js_

<!-- note:deliver -->
A boat or a captain adds stock to a port. Returns the new quantity.
<!-- /note -->

### <a id="s-lift"></a>`lift(st, id, qty)`

function · **exported** · L116–121

- calls: [`adjust`](#s-adjust) · [`ledgerOf`](#s-ledgerOf)
- called by: [`stepHauler`](../drones/npcdrones.js.md#s-stepHauler) _js/drones/npcdrones.js_ · [`ROLE_STEP.courier`](../drones/ops.js.md#s-ROLE_STEP-courier) _js/drones/ops.js_ · [`runFreight`](../drones/ops.js.md#s-runFreight) _js/drones/ops.js_ · [`acceptContract`](contracts.js.md#s-acceptContract) _js/economy/contracts.js_ · [`stepFlow`](../npc/flow.js.md#s-stepFlow) _js/npc/flow.js_ · [`liftCargo`](../npc/traffic.js.md#s-liftCargo) _js/npc/traffic.js_

<!-- note:lift -->
A boat or a captain takes stock from a port. Returns what was actually taken.
<!-- /note -->

### <a id="s-ledgerOf"></a>`ledgerOf(st)`

function · **exported** · L123–138

- calls: [`adjust`](#s-adjust) · [`targetFor`](#s-targetFor)
- called by: [`deliver`](#s-deliver) · [`econReport`](#s-econReport) · [`lift`](#s-lift) · [`runLines`](#s-runLines) · [`stepEconomy`](#s-stepEconomy)

<!-- note:ledgerOf -->
The port's running ledger (created on first touch).

- L127 · `flow: { in: {}, out: {} },` — totals moved by boats and captains
- L128 · `made: {}, used: {},` — totals by the lines
- L129 · `trend: {},` — stock delta over the last pass, by good
- L133 · `for (const L of LINES[st.sector] ?? []) for (const id of Object.keys(L.in)) {` — opening stock for the lines: a working port does not start with bare bins — half a target of each input
<!-- /note -->

### <a id="s-econHooks"></a>`econHooks`

const · **exported** · L140–140

<!-- note:econHooks -->
One production pass for a port.

0.3.52: other systems may lean on a port's line rate — the company's hands on
shift there (js/station/stafflife.js labourAt). A hook, so this module stays a leaf.
<!-- /note -->

### <a id="s-runLines"></a>`runLines(st)`

function · **exported** · L142–177

- calls: [`adjust`](#s-adjust) ×2 · [`ledgerOf`](#s-ledgerOf) · [`stockOf`](#s-stockOf) ×2 · [`targetFor`](#s-targetFor) ×2 · [`tierOf`](#s-tierOf) · [`baseValue`](materials.js.md#s-baseValue) _js/economy/materials.js_
- called by: [`counterfactual`](../aria/foresee.js.md#s-counterfactual) _js/aria/foresee.js_ ×2 · [`stepEconomy`](#s-stepEconomy)

<!-- note:runLines -->
- L150 · `let frac = 1, short = null;` — the pass runs at the fraction the scarcest input allows, down to a quarter; under that it stalls
- L157 · `for (const [id] of Object.entries(L.out)) {` — a glut of the output throttles the line: nobody makes plate onto a full floor
- L166 · `const makes = new Set(lines.flatMap((L) => Object.keys(L.out)));` — re-export: anything well over target that the port did not make itself is sold on, a little each pass —
  a foundry with a floor full of medkits does not keep them, it moves them
- L171 · `const keep = 30000 * k;` — the treasury recovers on its own, slowly, toward what a port of this size keeps on hand
- L173 · `else if (st.credits > keep * 5) st.credits = keep * 5;` — the charter sweeps the surplus
<!-- /note -->

### <a id="s-stepEconomy"></a>`stepEconomy(dt, stations)`

function · **exported** · L179–188

- calls: [`ledgerOf`](#s-ledgerOf) · [`runLines`](#s-runLines)
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepEconomy -->
Advance every port's ledger. Cheap: a pass every ECON_TICK per port, arithmetic only.

- L185 · `while (e.acc >= ECON_TICK && n++ < 4) { e.acc -= ECON_TICK; runLines(st); }` — catches up after a time-warp, never more than four passes a step
<!-- /note -->

### <a id="s-shortagesOf"></a>`shortagesOf(st)`

function · **exported** · L190–202

- calls: [`shortagesOf>consider`](#s-shortagesOf-consider) ×2
- called by: [`stepMarkets`](../comms/comms.js.md#s-stepMarkets) _js/comms/comms.js_ · [`openFreight`](../drones/board.js.md#s-openFreight) _js/drones/board.js_ · [`tradeRoutes`](../drones/ops.js.md#s-tradeRoutes) _js/drones/ops.js_ · [`KINDS.materials`](contracts.js.md#s-KINDS-materials) _js/economy/contracts.js_ · [`KINDS.supply`](contracts.js.md#s-KINDS-supply) _js/economy/contracts.js_ · [`econReport`](#s-econReport)

<!-- note:shortagesOf -->
Shortages and gluts, most pressing first: { id, name, qty, target, mult, pays }
<!-- /note -->

#### <a id="s-shortagesOf-consider"></a>`shortagesOf>consider(id)`

function · L193–198

- calls: [`bidPrice`](#s-bidPrice) · [`stockMult`](#s-stockMult) · [`stockOf`](#s-stockOf) · [`targetFor`](#s-targetFor) · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_
- called by: [`shortagesOf`](#s-shortagesOf) ×2

<!-- note:shortagesOf>consider -->
<!-- /note -->

### <a id="s-glutsOf"></a>`glutsOf(st)`

function · **exported** · L204–209

- calls: [`askPrice`](#s-askPrice) · [`stockMult`](#s-stockMult) · [`targetFor`](#s-targetFor) ×2 · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_
- called by: [`econReport`](#s-econReport)

<!-- note:glutsOf -->
<!-- /note -->

### <a id="s-wantsOf"></a>`wantsOf(st, n=)`

function · **exported** · L211–217

- calls: [`bidPrice`](#s-bidPrice) ×2 · [`stockMult`](#s-stockMult) · [`baseValue`](materials.js.md#s-baseValue) _js/economy/materials.js_ · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_
- called by: [`perceive`](../aria/senses.js.md#s-perceive) _js/aria/senses.js_ · [`sensePorts`](../aria/senses.js.md#s-sensePorts) _js/aria/senses.js_ · [`KINDS.tender`](contracts.js.md#s-KINDS-tender) _js/economy/contracts.js_ · [`portWants`](../sim/sim.js.md#s-portWants) _js/sim/sim.js_

<!-- note:wantsOf -->
The three goods a port most wants right now, by how far over book it pays.
<!-- /note -->

### <a id="s-cargoFor"></a>`cargoFor(st, inbound, rnd)`

function · **exported** · L219–227

- called by: [`populateFlow`](../npc/flow.js.md#s-populateFlow) _js/npc/flow.js_

<!-- note:cargoFor -->
A good for a boat to carry: inbound boats bring what the port's lines eat, outbound boats take what it makes.
<!-- /note -->

### <a id="s-pickCargoAt"></a>`pickCargoAt(A, B)`

function · **exported** · L229–238

- calls: [`targetFor`](#s-targetFor)
- called by: [`liftCargo`](../npc/traffic.js.md#s-liftCargo) _js/npc/traffic.js_

<!-- note:pickCargoAt -->
What to actually load at A for B, off the floor as it stands: the good B eats that A holds the most of
(over half a target), or null if A has nothing B wants.
<!-- /note -->

### <a id="s-legCargo"></a>`legCargo(A, B, rnd)`

function · **exported** · L240–247

- called by: [`buildLegs`](../npc/traffic.js.md#s-buildLegs) _js/npc/traffic.js_

<!-- note:legCargo -->
A cargo for a captain's leg from port A to port B: something A makes that B eats, else something A makes.
<!-- /note -->

### <a id="s-econReport"></a>`econReport(st)`

function · **exported** · L249–262

- calls: [`askPrice`](#s-askPrice) · [`bidPrice`](#s-bidPrice) · [`glutsOf`](#s-glutsOf) · [`ledgerOf`](#s-ledgerOf) · [`shortagesOf`](#s-shortagesOf) · [`targetFor`](#s-targetFor) ×2 · [`tierOf`](#s-tierOf) · [`good`](materials.js.md#s-good) _js/economy/materials.js_ · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ ×2
- called by: [`sensePorts`](../aria/senses.js.md#s-sensePorts) _js/aria/senses.js_ · [`portLedger`](../sim/sim.js.md#s-portLedger) _js/sim/sim.js_

<!-- note:econReport -->
The port's ledger for a screen: lines, shortages, gluts, treasury, throughput.
<!-- /note -->
