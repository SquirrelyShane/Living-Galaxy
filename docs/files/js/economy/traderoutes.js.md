# js/economy/traderoutes.js

[index](../../../README.md) · 84 lines · 10 symbols · 5 imports · 6 importers

## About

<!-- note:@file -->
LIVING GALAXY — trade routes: where the money is in moving goods.

0.3.19. The trader's instrument. For a hull with a hold and a purse, every
way to make money by buying at one honest port and selling at another: the
good, how many (what the source has, what the hold takes, what you can pay
for, what the buyer can pay out), the per-unit margin at the prices the
game actually transacts at (sim.js buyPriceAt / sellPriceAt — the whole lot
moves at one price per trade, so the estimate is the transaction), the
profit, and the time it costs to fly it from where you are — skipping legs
with a world across the line right now, which the autopilot would refuse.
Ranked by credits per minute, not by the fattest margin, because a margin
two systems away is not worth what it looks like.

TRADE RUN (mission/run.js) flies the top route; MARKET › ROUTES lists them
with FLY IT.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim`, `sellPriceAt`, `buyPriceAt`, `losBlocker` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../station/stations.js` | `stations` | [js/station/stations.js](../station/stations.js.md) |
| 3 | `../flight/ship.js` | `holdRoom` | [js/flight/ship.js](../flight/ship.js.md) |
| 4 | `./materials.js` | `goodName`, `bulkOf` | [js/economy/materials.js](materials.js.md) |
| 5 | `./contracts.js` | `contracts` | [js/economy/contracts.js](contracts.js.md) |

## Imported by

- [js/aria/company.js](../aria/company.js.md) — `bestRoute`
- [js/aria/play.js](../aria/play.js.md) — `bestRoute`, `sellable`, `tradeRoutes`
- [js/aria/senses.js](../aria/senses.js.md) — `tradeRoutes`
- [js/console/panels/market.js](../console/panels/market.js.md) — `tradeRoutes`, `routeLine`
- [js/mission/tradeops.js](../mission/tradeops.js.md) — `bestRoute`, `sellable`, `routeLine`
- test/trade.test.mjs _(outside js/)_ — `tradeRoutes`, `bestRoute`, `sellable`, `routeLine`

## Exports

- [`ROUTE`](#s-ROUTE) · const — **no importer in scanned roots**
- [`legSeconds`](#s-legSeconds) · function — **no importer in scanned roots**
- [`tradeRoutes`](#s-tradeRoutes) · function — used by [js/aria/play.js](../aria/play.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/console/panels/market.js](../console/panels/market.js.md), test/trade.test.mjs
- [`bestRoute`](#s-bestRoute) · function — used by [js/aria/company.js](../aria/company.js.md), [js/aria/play.js](../aria/play.js.md), [js/mission/tradeops.js](../mission/tradeops.js.md), test/trade.test.mjs
- [`sellable`](#s-sellable) · function — used by [js/aria/play.js](../aria/play.js.md), [js/mission/tradeops.js](../mission/tradeops.js.md), test/trade.test.mjs
- [`routeLine`](#s-routeLine) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/mission/tradeops.js](../mission/tradeops.js.md), test/trade.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-d3"></a>`d3(a, b)`

function · L7–7

- called by: [`tradeRoutes`](#s-tradeRoutes) ×2

<!-- note:d3 -->
<!-- /note -->

### <a id="s-ROUTE"></a>`ROUTE`

const · **exported** · L8–13

<!-- note:ROUTE -->
- L9 · `dockS: 150,` — clamps, lanes and the push out: a port call, in seconds
- L10 · `cruise: 25000,` — u/s — a rough crossing speed with the drive lit
- L11 · `minProfit: 150,` — cr — below this a run is not worth the fuel
<!-- /note -->

### <a id="s-legSeconds"></a>`legSeconds(d)`

function · **exported** · L15–17

- called by: [`tradeRoutes`](#s-tradeRoutes) ×2

<!-- note:legSeconds -->
Seconds to fly a distance and make a port call, roughly — for ranking, not for a timetable.
<!-- /note -->

### <a id="s-honest"></a>`honest(st)`

function · L19–19

<!-- note:honest -->
<!-- /note -->

### <a id="s-consigned"></a>`consigned()`

function · L21–25

- called by: [`sellable`](#s-sellable)

<!-- note:consigned -->
goods an accepted haul contract has consigned to the hold: not ours to sell
<!-- /note -->

### <a id="s-tradeRoutes"></a>`tradeRoutes({…}=)`

function · **exported** · L27–66

- calls: [`bulkOf`](materials.js.md#s-bulkOf) _js/economy/materials.js_ · [`goodName`](materials.js.md#s-goodName) _js/economy/materials.js_ · [`d3`](#s-d3) ×2 · [`legSeconds`](#s-legSeconds) ×2 · [`tradeRoutes>lineBlocked`](#s-tradeRoutes-lineBlocked) · [`holdRoom`](../flight/ship.js.md#s-holdRoom) _js/flight/ship.js_ · [`buyPriceAt`](../sim/sim.js.md#s-buyPriceAt) _js/sim/sim.js_ ×4 · [`losBlocker`](../sim/sim.js.md#s-losBlocker) _js/sim/sim.js_ · [`sellPriceAt`](../sim/sim.js.md#s-sellPriceAt) _js/sim/sim.js_ ×4
- via [js/station/stations.js](../station/stations.js.md): `stations.filter`
- called by: [`startRoute`](../aria/play.js.md#s-startRoute) _js/aria/play.js_ · [`senseRoutes`](../aria/senses.js.md#s-senseRoutes) _js/aria/senses.js_ · [`marketBlock`](../console/panels/market.js.md#s-marketBlock) _js/console/panels/market.js_ · [`mountRoutes`](../console/panels/market.js.md#s-mountRoutes) _js/console/panels/market.js_ · [`bestRoute`](#s-bestRoute)

<!-- note:tradeRoutes -->
Every profitable route, best first:
  [{ from, to, good, name, qty, buy, sell, margin, profit, cost, secs, perMin }]
`pos` is where the hull is now (the run to the source is part of the cost);
`room` and `credits` default to the ship's own.

- L35 · `if (pos && toA > 3000 && losBlocker(pos, A, null)) continue;` — a source you cannot see from here (a world across the line) is not a run the autopilot can start
- L38 · `const unit = buyPriceAt(A, line);` — 0.3.24: a lot is priced as a lot at both ends (economy.js lotMult), so
  the estimate IS the transaction. Sizing and pricing are circular — the
  bigger the lot the worse both prices get — so size it on the marginal
  price first, then re-price that size, then trim it to what the buyer
  can actually pay for at the price that size costs.
- L39 · `const can = Math.min(Math.floor(line.qty), Math.floor(room / bulkOf(line.id)), Math.floor(` — room is hold units (0.3.52)
- L45 · `if (sellPriceAt(B, line.id) <= unit) continue;` — not even the first unit clears
- L47 · `let qty = Math.min(afford, Math.floor((B.credits ?? Infinity) / Math.max(1, sellPriceAt(B,` — Size it, then price BOTH ends at that size, then check it still
  clears — a lot is bought as a lot too, so the quote has to be for
  exactly the number of units the run will actually move.
<!-- /note -->

#### <a id="s-tradeRoutes-lineBlocked"></a>`tradeRoutes>lineBlocked(A, B)`

function · L31–31

- calls: [`losBlocker`](../sim/sim.js.md#s-losBlocker) _js/sim/sim.js_
- called by: [`tradeRoutes`](#s-tradeRoutes)

<!-- note:tradeRoutes>lineBlocked -->
<!-- /note -->

### <a id="s-bestRoute"></a>`bestRoute(opts=)`

function · **exported** · L68–70

- calls: [`tradeRoutes`](#s-tradeRoutes)
- called by: [`workingCapital`](../aria/company.js.md#s-workingCapital) _js/aria/company.js_ · [`movesNow`](../aria/play.js.md#s-movesNow) _js/aria/play.js_ · [`makeTradeOps.BUY`](../mission/tradeops.js.md#s-makeTradeOps-BUY) _js/mission/tradeops.js_ · [`makeTradeOps>pickRoute`](../mission/tradeops.js.md#s-makeTradeOps-pickRoute) _js/mission/tradeops.js_

<!-- note:bestRoute -->
The single best run from here, or null.
<!-- /note -->

### <a id="s-sellable"></a>`sellable(ship=)`

function · **exported** · L72–80

- calls: [`consigned`](#s-consigned)
- called by: [`movesNow`](../aria/play.js.md#s-movesNow) _js/aria/play.js_ · [`startSell`](../aria/play.js.md#s-startSell) _js/aria/play.js_ · [`makeTradeOps.SELL`](../mission/tradeops.js.md#s-makeTradeOps-SELL) _js/mission/tradeops.js_ ×3

<!-- note:sellable -->
What in the hold can be sold without selling somebody else's consignment.
<!-- /note -->

### <a id="s-routeLine"></a>`routeLine(r)`

function · **exported** · L82–84

- called by: [`flyRoute`](../console/panels/market.js.md#s-flyRoute) _js/console/panels/market.js_ · [`makeTradeOps>pickRoute`](../mission/tradeops.js.md#s-makeTradeOps-pickRoute) _js/mission/tradeops.js_

<!-- note:routeLine -->
One line for a route: "Steel · Smelt Station → Haven Hold · 120 × +14 = 1,680 cr · ~6 min".
<!-- /note -->
