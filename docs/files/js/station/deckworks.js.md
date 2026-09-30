# js/station/deckworks.js

[index](../../../README.md) · 66 lines · 3 symbols · 4 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — CONSOLE/DECK › WORKS: the pilot's fabrication desk, then the
port's own lines.

Lifted out of js/station/stationdeck.js in 0.3.10, for the reason that file keeps
forcing: it sits exactly on the 600-line gate, so a panel that grows has to
grow somewhere else. This is the whole WORKS tab —

  FABRICATION   what you can have built here, and what it eats (js/station/fabyard.js)
  DEFENCES      the guns and bays on the port's hull
  MAGAZINES     what they are loaded with
  FABRICATION   the port's OWN lines, making its munitions from traded stock
  WHAT THE LINES EAT   the recipes behind them

The first is yours and the rest is the port's, which is why the pilot's desk
goes at the top: it is the thing they opened this tab to use.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./stationworks.js` | `worksReport`, `RECIPES` | [js/station/stationworks.js](stationworks.js.md) |
| 2 | `../drones/dronespec.js` | `droneSummary` | [js/drones/dronespec.js](../drones/dronespec.js.md) |
| 3 | `../economy/materials.js` | `goodName` | [js/economy/materials.js](../economy/materials.js.md) |
| 4 | `./fabyard.js` | `fabPanel` | [js/station/fabyard.js](fabyard.js.md) |

## Imported by

- [js/station/stationdeck.js](stationdeck.js.md) — `worksPanel`

## Exports

- [`worksPanel`](#s-worksPanel) · function — used by [js/station/stationdeck.js](stationdeck.js.md)
- `default` · Identifier — **no importer in scanned roots**

## Effects

- **dom.create** — `‹tag›` (el:6)

## Symbols

### <a id="s-el"></a>`el(tag, cls, text)`

function · L6–6

- called by: [`row`](#s-row) ×5 · [`worksPanel`](#s-worksPanel) ×18
- effects: dom.create `‹tag›`

<!-- note:el -->
The deck's own two helpers, copied rather than imported: they are four lines
each and importing them from stationdeck.js would make these two modules a
cycle for no gain. `el` is the deck's, not the console kit's — the deck
styles its own rows (.sd-row / .sd-lab / .sd-val).
<!-- /note -->

### <a id="s-row"></a>`row(parent, label, hint)`

function · L8–15

- calls: [`el`](#s-el) ×5
- called by: [`worksPanel`](#s-worksPanel) ×8

<!-- note:row -->
<!-- /note -->

### <a id="s-worksPanel"></a>`worksPanel(body, st)`

function · **exported** · L17–64

- calls: [`droneSummary`](../drones/dronespec.js.md#s-droneSummary) _js/drones/dronespec.js_ ×2 · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`el`](#s-el) ×18 · [`row`](#s-row) ×8 · [`fabPanel`](fabyard.js.md#s-fabPanel) _js/station/fabyard.js_ · [`worksReport`](stationworks.js.md#s-worksReport) _js/station/stationworks.js_
- called by: [`PANELS.works`](stationdeck.js.md#s-PANELS-works) _js/station/stationdeck.js_

<!-- note:worksPanel -->
- L18 · `const fab = el("div", "sd-sec");` — The pilot's own fabrication desk goes first: it is the thing they came
  to this tab to use. The port's own defence lines are below it. Its own
  module (js/station/fabyard.js) because this file sits on the 600-line gate.
- L34 · `const d = droneSummary("sdrone", st.name, st.sector);` — the drone line's one design (robotgen, seeded by the port) — the same machine the bays launch
<!-- /note -->
