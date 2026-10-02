# js/sim/salvage.js

[index](../../../README.md) · 23 lines · 2 symbols · 1 imports · 3 importers

## About

<!-- note:@file -->
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../flight/ship.js` | `addCargo` | [js/flight/ship.js](../flight/ship.js.md) |

## Imported by

- [js/economy/contracts.js](../economy/contracts.js.md) — `recoverSite`
- [js/sim/sim.js](sim.js.md) — `recoveryBlocker`
- test/salvage.test.mjs _(outside js/)_ — `recoverSite`

## Exports

- [`recoveryBlocker`](#s-recoveryBlocker) · function — used by [js/sim/sim.js](sim.js.md)
- [`recoverSite`](#s-recoverSite) · function — used by [js/economy/contracts.js](../economy/contracts.js.md), test/salvage.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-recoveryBlocker"></a>`recoveryBlocker(ship)`

function · **exported** · L3–8

- called by: [`recoverSite`](#s-recoverSite) · [`stepSalvage`](sim.js.md#s-stepSalvage) _js/sim/sim.js_

<!-- note:recoveryBlocker -->
<!-- /note -->

### <a id="s-recoverSite"></a>`recoverSite(job, ship, dt)`

function · **exported** · L10–23

- calls: [`addCargo`](../flight/ship.js.md#s-addCargo) _js/flight/ship.js_ · [`recoveryBlocker`](#s-recoveryBlocker)
- called by: [`tickContracts`](../economy/contracts.js.md#s-tickContracts) _js/economy/contracts.js_

<!-- note:recoverSite -->
<!-- /note -->
