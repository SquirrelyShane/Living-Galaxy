# js/ui/coverage.js

[index](../../../README.md) · 45 lines · 2 symbols · 1 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — the underwriter's desk, at a yard.

One panel, rendered into the station deck's yard page under the hull you
are looking at. It is its own module for a boring reason — js/station/stationdeck.js
is held under 600 lines by test/console.test.mjs and had sixty to spare —
and for a better one: what a policy costs is arithmetic over a hull value,
and arithmetic that renders itself is easier to be sure of than arithmetic
buried in a five-hundred-line panel.

It takes the DOM helpers it needs rather than importing the deck's private
ones, so it can be dropped into any panel that has a hull and a purse.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../economy/insurance.js` | `quoteAll`, `policyFor`, `insure`, `playerKey`, `TIER_BY_ID` | [js/economy/insurance.js](../economy/insurance.js.md) |

## Imported by

- [js/station/stationdeck.js](../station/stationdeck.js.md) — `renderCoverage`, `buyCoverage`

## Exports

- [`renderCoverage`](#s-renderCoverage) · function — used by [js/station/stationdeck.js](../station/stationdeck.js.md)
- [`buyCoverage`](#s-buyCoverage) · function — used by [js/station/stationdeck.js](../station/stationdeck.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-renderCoverage"></a>`renderCoverage(host, opts)`

function · **exported** · L3–36

- calls: [`playerKey`](../economy/insurance.js.md#s-playerKey) _js/economy/insurance.js_ · [`policyFor`](../economy/insurance.js.md#s-policyFor) _js/economy/insurance.js_ · [`quoteAll`](../economy/insurance.js.md#s-quoteAll) _js/economy/insurance.js_
- called by: [`PANELS.shipyard>render`](../station/stationdeck.js.md#s-PANELS-shipyard-render) _js/station/stationdeck.js_

<!-- note:renderCoverage -->
Render the cover block for one hull.

@param host    element to append into
@param opts    { hullId, hullName, value, credits, docked, onBuy(tierId, premium), ui: { el, row, btn } }
<!-- /note -->

### <a id="s-buyCoverage"></a>`buyCoverage(ship, hullId, tierId, value)`

function · **exported** · L38–45

- calls: [`insure`](../economy/insurance.js.md#s-insure) _js/economy/insurance.js_ · [`playerKey`](../economy/insurance.js.md#s-playerKey) _js/economy/insurance.js_
- called by: [`PANELS.shipyard>render.onBuy`](../station/stationdeck.js.md#s-PANELS-shipyard-render-onBuy) _js/station/stationdeck.js_

<!-- note:buyCoverage -->
Buy cover on the player's hull, taking the premium out of their purse.
Returns the policy, or null if they could not pay.

Replacing cover on a hull that already has some charges the new premium in
full and refunds nothing — you are not trading a policy in, you are buying
a different one, and the one you had has been running since you bought it.
<!-- /note -->
