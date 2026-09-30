# js/ui/holdview.js

[index](../../../README.md) · 129 lines · 9 symbols · 7 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — the hold, as a bag you can open.

0.3.29. Everything the ship carries lived behind one number: the CGO gauge,
a bar and a total. You could see that the hold was 84% full and nothing
about what was in it — not which ore, not what it was worth, not which of it
was somebody else's consignment you were being paid to carry and must not
sell. The only way to find out was to dock and read the trade desk.

So the gauge opens. A slot grid, the way a bag is a slot grid: one slot per
good, the quantity on it, the tonnage it is costing you, what it is worth
where you are standing — and the empty slots drawn as empty, so "how much
room is left" is a thing you can see rather than a percentage you have to
think about.

It is a READ of the hold plus the two things you can do to what is in it
from the seat: drop it, or sell it if you are docked somewhere that buys it.
Everything else about trading is still the deck's job — this is the pocket
you check without docking.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim`, `sellPriceAt`, `jettison`, `tradeSell`, `logEvent` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../station/stations.js` | `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 3 | `../economy/materials.js` | `good`, `goodName`, `baseValue`, `bulkOf` | [js/economy/materials.js](../economy/materials.js.md) |
| 4 | `../flight/ship.js` | `holdRoom`, `cargoTotal` | [js/flight/ship.js](../flight/ship.js.md) |
| 5 | `../economy/contracts.js` | `contracts` | [js/economy/contracts.js](../economy/contracts.js.md) |
| 6 | `../economy/sites.js` | `classForOre` | [js/economy/sites.js](../economy/sites.js.md) |
| 7 | `../station/dockwork.js` | `handlingLeft` | [js/station/dockwork.js](../station/dockwork.js.md) |

## Imported by

- [js/ui/hud.js](hud.js.md) — `renderHold`
- test/hold.test.mjs _(outside js/)_ — `HOLD`, `holdSlots`, `holdLine`, `consignedNow`, `dropFromHold`, `sellFromHold`, `renderHold`

## Exports

- [`HOLD`](#s-HOLD) · const — used by test/hold.test.mjs
- [`consignedNow`](#s-consignedNow) · function — used by test/hold.test.mjs
- [`holdSlots`](#s-holdSlots) · function — used by test/hold.test.mjs
- [`holdLine`](#s-holdLine) · function — used by test/hold.test.mjs
- [`dropFromHold`](#s-dropFromHold) · function — used by test/hold.test.mjs
- [`sellFromHold`](#s-sellFromHold) · function — used by test/hold.test.mjs
- [`renderHold`](#s-renderHold) · function — used by [js/ui/hud.js](hud.js.md), test/hold.test.mjs

## Effects

- **dom.create** — `‹tag›` (mk:82)
- **event.listen** — `click on sell → (inline)` (renderHold:113) · `click on drop → (inline)` (renderHold:118)

## Symbols

### <a id="s-doc"></a>`doc()`

function · L9–9

- called by: [`mk`](#s-mk) · [`renderHold`](#s-renderHold)

<!-- note:doc -->
resolved lazily: the module is imported long before a page exists in some
hosts, and captured once it is null for ever
<!-- /note -->

### <a id="s-HOLD"></a>`HOLD`

const · **exported** · L11–11

<!-- note:HOLD -->
The smallest grid that holds what is aboard, so the bag grows with the hull.
<!-- /note -->

### <a id="s-consignedNow"></a>`consignedNow()`

function · **exported** · L13–17

- called by: [`holdSlots`](#s-holdSlots)

<!-- note:consignedNow -->
Goods an accepted contract has consigned to the hold: aboard, but not yours.
<!-- /note -->

### <a id="s-holdSlots"></a>`holdSlots(ship=)`

function · **exported** · L19–53

- calls: [`baseValue`](../economy/materials.js.md#s-baseValue) _js/economy/materials.js_ · [`bulkOf`](../economy/materials.js.md#s-bulkOf) _js/economy/materials.js_ ×2 · [`good`](../economy/materials.js.md#s-good) _js/economy/materials.js_ · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`classForOre`](../economy/sites.js.md#s-classForOre) _js/economy/sites.js_ · [`cargoTotal`](../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_ · [`holdRoom`](../flight/ship.js.md#s-holdRoom) _js/flight/ship.js_ · [`sellPriceAt`](../sim/sim.js.md#s-sellPriceAt) _js/sim/sim.js_ · [`handlingLeft`](../station/dockwork.js.md#s-handlingLeft) _js/station/dockwork.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ · [`consignedNow`](#s-consignedNow)
- called by: [`dropFromHold`](#s-dropFromHold) · [`holdLine`](#s-holdLine) · [`renderHold`](#s-renderHold) · [`sellFromHold`](#s-sellFromHold)

<!-- note:holdSlots -->
What is in the hold, as slots.
→ { slots: [{ id, name, qty, mass, unit, worth, mine, consigned, cls, ore }],
    used, cap, room, mass, worth, empty, port }

- L35 · `bulk: bulkOf(id), hu: Math.round(qty * bulkOf(id) * 10) / 10,` — 0.3.52: what it takes up
<!-- /note -->

### <a id="s-holdLine"></a>`holdLine(h=)`

function · **exported** · L55–58

- calls: [`holdSlots`](#s-holdSlots)
- called by: [`renderHold`](#s-renderHold)

<!-- note:holdLine -->
"84 of 420 · 6 kinds · 1,240 t · 38,900 cr"
<!-- /note -->

### <a id="s-dropFromHold"></a>`dropFromHold(id, amount=)`

function · **exported** · L60–68

- calls: [`jettison`](../sim/sim.js.md#s-jettison) _js/sim/sim.js_ · [`holdSlots`](#s-holdSlots)
- called by: [`renderHold`](#s-renderHold)

<!-- note:dropFromHold -->
---- what you can do to it from the seat ---------------------------------------

Drop it. Never somebody else's consignment — that is a contract, not cargo.
<!-- /note -->

### <a id="s-sellFromHold"></a>`sellFromHold(id, amount=)`

function · **exported** · L70–80

- calls: [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`tradeSell`](../sim/sim.js.md#s-tradeSell) _js/sim/sim.js_ · [`holdSlots`](#s-holdSlots)
- called by: [`renderHold`](#s-renderHold)

<!-- note:sellFromHold -->
Sell it, if you are docked somewhere and it is yours.
<!-- /note -->

### <a id="s-mk"></a>`mk(tag, cls, text)`

function · L82–82

- calls: [`doc`](#s-doc)
- called by: [`renderHold`](#s-renderHold) ×16
- effects: dom.create `‹tag›`

<!-- note:mk -->
---- the panel ------------------------------------------------------------------
<!-- /note -->

### <a id="s-renderHold"></a>`renderHold(host, {…}=)`

function · **exported** · L84–129

- calls: [`doc`](#s-doc) · [`dropFromHold`](#s-dropFromHold) · [`holdLine`](#s-holdLine) · [`holdSlots`](#s-holdSlots) · [`mk`](#s-mk) ×16 · [`sellFromHold`](#s-sellFromHold)
- called by: [`paintHold`](hud.js.md#s-paintHold) _js/ui/hud.js_
- effects: event.listen `click`

<!-- note:renderHold -->
Draw the bag into `host`. `onChange` repaints after an action.
Pure DOM: no styling decisions here beyond the class names css/style.css owns.
<!-- /note -->
