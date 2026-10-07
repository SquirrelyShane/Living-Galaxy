# js/aria/foresee.js

[index](../../../README.md) · 96 lines · 10 symbols · 2 imports · 1 importers

## About

<!-- note:@file -->
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../economy/economy.js` | `runLines`, `stockOf`, `stockMultAt`, `lotMult`, `targetFor`, `bidPrice`, `askPrice`, `LINES`, `GLUT_FRAC`, `SHORT_FRAC` | [js/economy/economy.js](../economy/economy.js.md) |
| 2 | `../economy/materials.js` | `goodName` | [js/economy/materials.js](../economy/materials.js.md) |

## Imported by

- [js/aria/wake.js](wake.js.md) — `counterfactual`, `sellValue`

## Exports

- [`FORESEE`](#s-FORESEE) · const — **no importer in scanned roots**
- [`ghost`](#s-ghost) · function — **no importer in scanned roots**
- [`foreseeSale`](#s-foreseeSale) · function — **no importer in scanned roots**
- [`foreseeBuy`](#s-foreseeBuy) · function — **no importer in scanned roots**
- [`counterfactual`](#s-counterfactual) · function — used by [js/aria/wake.js](wake.js.md)
- [`sellValue`](#s-sellValue) · function — used by [js/aria/wake.js](wake.js.md)
- [`saleLine`](#s-saleLine) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-FORESEE"></a>`FORESEE`

const · **exported** · L4–4

<!-- note:FORESEE -->
<!-- /note -->

### <a id="s-ghost"></a>`ghost(st)`

function · **exported** · L6–13

- called by: [`counterfactual`](#s-counterfactual) ×2

<!-- note:ghost -->
<!-- /note -->

### <a id="s-bump"></a>`bump(g, id, dq)`

function · L15–19

- called by: [`counterfactual`](#s-counterfactual) ×2

<!-- note:bump -->
<!-- /note -->

### <a id="s-stalledOn"></a>`stalledOn(st, id)`

function · L21–21

- called by: [`foreseeSale`](#s-foreseeSale)

<!-- note:stalledOn -->
<!-- /note -->

### <a id="s-feeds"></a>`feeds(st, id)`

function · L22–22

- called by: [`foreseeBuy`](#s-foreseeBuy) · [`foreseeSale`](#s-foreseeSale)

<!-- note:feeds -->
<!-- /note -->

### <a id="s-foreseeSale"></a>`foreseeSale(st, lots, price=)`

function · **exported** · L24–43

- calls: [`feeds`](#s-feeds) · [`stalledOn`](#s-stalledOn) · [`lotMult`](../economy/economy.js.md#s-lotMult) _js/economy/economy.js_ · [`stockMultAt`](../economy/economy.js.md#s-stockMultAt) _js/economy/economy.js_ ×2 · [`stockOf`](../economy/economy.js.md#s-stockOf) _js/economy/economy.js_ · [`targetFor`](../economy/economy.js.md#s-targetFor) _js/economy/economy.js_ · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_
- called by: [`sellValue`](#s-sellValue)

<!-- note:foreseeSale -->
<!-- /note -->

### <a id="s-foreseeBuy"></a>`foreseeBuy(st, id, qty, price=)`

function · **exported** · L45–51

- calls: [`feeds`](#s-feeds) · [`stockMultAt`](../economy/economy.js.md#s-stockMultAt) _js/economy/economy.js_ ×2 · [`stockOf`](../economy/economy.js.md#s-stockOf) _js/economy/economy.js_ · [`targetFor`](../economy/economy.js.md#s-targetFor) _js/economy/economy.js_ · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_

<!-- note:foreseeBuy -->
<!-- /note -->

### <a id="s-counterfactual"></a>`counterfactual(st, delta=, ticks=)`

function · **exported** · L53–73

- calls: [`bump`](#s-bump) ×2 · [`ghost`](#s-ghost) ×2 · [`runLines`](../economy/economy.js.md#s-runLines) _js/economy/economy.js_ ×2 · [`stockMultAt`](../economy/economy.js.md#s-stockMultAt) _js/economy/economy.js_ ×2 · [`stockOf`](../economy/economy.js.md#s-stockOf) _js/economy/economy.js_ ×2 · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_
- called by: [`wakeClose`](wake.js.md#s-wakeClose) _js/aria/wake.js_

<!-- note:counterfactual -->
<!-- /note -->

### <a id="s-sellValue"></a>`sellValue(st, hold, {…}=)`

function · **exported** · L75–85

- calls: [`foreseeSale`](#s-foreseeSale)
- called by: [`sellValueAt`](wake.js.md#s-sellValueAt) _js/aria/wake.js_

<!-- note:sellValue -->
<!-- /note -->

### <a id="s-saleLine"></a>`saleLine(f)`

function · **exported** · L87–96

<!-- note:saleLine -->
<!-- /note -->
