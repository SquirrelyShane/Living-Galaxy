# js/station/refityard.js

[index](../../../README.md) · 124 lines · 9 symbols · 8 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — the refit yard, a station-deck fragment.

refitPanel(body, st) → void. Every upgrade in the UPGRADES table as a row:
name, blurb, effect line, price, BUY when this port's sector fits it and
SELL (50% back) when it is already aboard. The station deck mounts it as
PANELS.refit; CONSOLE › MARKET › REFIT calls the same function. Built on
the console kit (js/console/kit.js). Contract: PLAN.md §4.8, §6 contract 2.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../console/kit.js` | `el`, `row`, `button`, `note`, `section` | [js/console/kit.js](../console/kit.js.md) |
| 3 | `../economy/upgrades.js` | `upgradeOptions`, `buyUpgrade`, `sellUpgrade`, `upgradeLines`, `effectOf`, `upgrades` | [js/economy/upgrades.js](../economy/upgrades.js.md) |
| 4 | `../flight/repair.js` | `repairQuote`, `yardRepair`, `repairsAt`, `hullMaxOf`, `droneRate` | [js/flight/repair.js](../flight/repair.js.md) |
| 5 | `../flight/defence.js` | `defenceReport`, `KINDS` | [js/flight/defence.js](../flight/defence.js.md) |
| 6 | `../sim/sim.js` | `currentShipId` | [js/sim/sim.js](../sim/sim.js.md) |
| 7 | `../ships/shipdb.js` | `shipById` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 8 | `../economy/upgrades.js` | `upgradeResists` | [js/economy/upgrades.js](../economy/upgrades.js.md) |

## Imported by

- [js/console/panels/market.js](../console/panels/market.js.md) — `refitPanel`
- [js/station/stationdeck.js](stationdeck.js.md) — `refitPanel`, `wireDeckRepair`, `paintDeckRepair`

## Exports

- [`refitPanel`](#s-refitPanel) · function — used by [js/console/panels/market.js](../console/panels/market.js.md), [js/station/stationdeck.js](stationdeck.js.md)
- [`wireDeckRepair`](#s-wireDeckRepair) · function — used by [js/station/stationdeck.js](stationdeck.js.md)
- [`paintDeckRepair`](#s-paintDeckRepair) · function — used by [js/station/stationdeck.js](stationdeck.js.md)
- `default` · Identifier — **no importer in scanned roots**

## Effects

- **event.listen** — `click on btn → (inline)` (wireDeckRepair:107)

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L10–10

<!-- note:DOC -->
<!-- /note -->

### <a id="s-YARDS"></a>`YARDS`

const · L12–12

<!-- note:YARDS -->
<!-- /note -->

### <a id="s-refitPanel"></a>`refitPanel(body, st)`

function · **exported** · L14–21

- calls: [`refitPanel>paint`](#s-refitPanel-paint)
- called by: [`mountRefit`](../console/panels/market.js.md#s-mountRefit) _js/console/panels/market.js_

<!-- note:refitPanel -->
<!-- /note -->

#### <a id="s-refitPanel-paint"></a>`refitPanel>paint()`

function · L16–19

- calls: [`build`](#s-build)
- called by: [`build`](#s-build) ×2 · [`build>act`](#s-build-act) · [`refitPanel`](#s-refitPanel)

<!-- note:refitPanel>paint -->
<!-- /note -->

### <a id="s-build"></a>`build(body, st, paint)`

function · L23–104

- calls: [`button`](../console/kit.js.md#s-button) _js/console/kit.js_ ×2 · [`el`](../console/kit.js.md#s-el) _js/console/kit.js_ ×2 · [`note`](../console/kit.js.md#s-note) _js/console/kit.js_ ×9 · [`row`](../console/kit.js.md#s-row) _js/console/kit.js_ ×4 · [`section`](../console/kit.js.md#s-section) _js/console/kit.js_ ×4 · [`buyUpgrade`](../economy/upgrades.js.md#s-buyUpgrade) _js/economy/upgrades.js_ · [`effectOf`](../economy/upgrades.js.md#s-effectOf) _js/economy/upgrades.js_ ×2 · [`sellUpgrade`](../economy/upgrades.js.md#s-sellUpgrade) _js/economy/upgrades.js_ · [`upgradeLines`](../economy/upgrades.js.md#s-upgradeLines) _js/economy/upgrades.js_ · [`upgradeOptions`](../economy/upgrades.js.md#s-upgradeOptions) _js/economy/upgrades.js_ · [`upgradeResists`](../economy/upgrades.js.md#s-upgradeResists) _js/economy/upgrades.js_ · [`defenceReport`](../flight/defence.js.md#s-defenceReport) _js/flight/defence.js_ · [`droneRate`](../flight/repair.js.md#s-droneRate) _js/flight/repair.js_ ×2 · [`hullMaxOf`](../flight/repair.js.md#s-hullMaxOf) _js/flight/repair.js_ · [`repairQuote`](../flight/repair.js.md#s-repairQuote) _js/flight/repair.js_ · [`repairsAt`](../flight/repair.js.md#s-repairsAt) _js/flight/repair.js_ · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ · [`currentShipId`](../sim/sim.js.md#s-currentShipId) _js/sim/sim.js_ · [`build>act`](#s-build-act) ×2 · [`build>pctRow`](#s-build-pctRow) ×2 · [`refitPanel>paint`](#s-refitPanel-paint) ×2
- via [js/sim/sim.js](../sim/sim.js.md): `sim.ship.credits.toLocaleString`
- called by: [`refitPanel>paint`](#s-refitPanel-paint)

<!-- note:build -->
- L27 · `const ship = sim.ship;` — ---- the hull: buy it back by the point ----
- L30 · `{` — 0.3.34 — what this frame actually turns away. Before this there were no
  resistances at all and the pools were a flat hundred for every hull in
  the game, so there was nothing here worth printing.
- L61 · `` const own = section(`FITTED · ${upgrades.owned.length}`); `` — ---- what is fitted ----
- L78 · `` const cat = section(yard ? `REFIT YARD · ${st.name}` : "REFIT YARD"); `` — ---- what this yard fits ----
<!-- /note -->

#### <a id="s-build-pctRow"></a>`build>pctRow(label, hint, set)`

function · L33–36

- calls: [`row`](../console/kit.js.md#s-row) _js/console/kit.js_
- via [js/flight/defence.js](../flight/defence.js.md): `KINDS.map`, `KINDS.map.join`
- called by: [`build`](#s-build) ×2

<!-- note:build>pctRow -->
<!-- /note -->

#### <a id="s-build-act"></a>`build>act(pts, label)`

function · L46–55

- calls: [`button`](../console/kit.js.md#s-button) _js/console/kit.js_ · [`repairQuote`](../flight/repair.js.md#s-repairQuote) _js/flight/repair.js_ · [`yardRepair`](../flight/repair.js.md#s-yardRepair) _js/flight/repair.js_ · [`refitPanel>paint`](#s-refitPanel-paint)
- called by: [`build`](#s-build) ×2

<!-- note:build>act -->
<!-- /note -->

### <a id="s-wireDeckRepair"></a>`wireDeckRepair(btn, after)`

function · **exported** · L106–112

- calls: [`yardRepair`](../flight/repair.js.md#s-yardRepair) _js/flight/repair.js_
- called by: [`mountStationDeck`](stationdeck.js.md#s-mountStationDeck) _js/station/stationdeck.js_
- effects: event.listen `click`

<!-- note:wireDeckRepair -->
The deck header's REPAIR chip (js/station/stationdeck.js): the whole shortfall, or as much as you can pay.
<!-- /note -->

### <a id="s-paintDeckRepair"></a>`paintDeckRepair(btn, st)`

function · **exported** · L114–122

- calls: [`repairQuote`](../flight/repair.js.md#s-repairQuote) _js/flight/repair.js_
- called by: [`mountStationDeck`](stationdeck.js.md#s-mountStationDeck) _js/station/stationdeck.js_

<!-- note:paintDeckRepair -->
<!-- /note -->
