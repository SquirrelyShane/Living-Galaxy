# js/station/blueprint.js

[index](../../../README.md) · 168 lines · 11 symbols · 0 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — station blueprints.

Every station grows a deterministic deck plan from its id: rooms sized to
its sector, corridors joining them, and a shift of crew and dockside
pedestrians walking the halls. Drawn blueprint-style on a canvas — grid,
cyan ink, dashed pressure doors — with live occupancy per room.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/station/stationdeck.js](stationdeck.js.md) — `stationPlan`, `tickPlan`, `drawPlan`, `occupancy`, `roomAt`

## Exports

- [`stationPlan`](#s-stationPlan) · function — used by [js/station/stationdeck.js](stationdeck.js.md)
- [`tickPlan`](#s-tickPlan) · function — used by [js/station/stationdeck.js](stationdeck.js.md)
- [`occupancy`](#s-occupancy) · function — used by [js/station/stationdeck.js](stationdeck.js.md)
- [`drawPlan`](#s-drawPlan) · function — used by [js/station/stationdeck.js](stationdeck.js.md)
- [`roomAt`](#s-roomAt) · function — used by [js/station/stationdeck.js](stationdeck.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-mulberry"></a>`mulberry(seedStr)`

function · L1–11

- called by: [`stationPlan`](#s-stationPlan)

<!-- note:mulberry -->
<!-- /note -->

### <a id="s-SECTOR_ROOMS"></a>`SECTOR_ROOMS`

const · L13–20

<!-- note:SECTOR_ROOMS -->
<!-- /note -->

### <a id="s-plans"></a>`plans`

const · L22–22

<!-- note:plans -->
Grows the deck plan. Cached per station id.
<!-- /note -->

### <a id="s-stationPlan"></a>`stationPlan(station)`

function · **exported** · L23–66

- calls: [`mulberry`](#s-mulberry)
- called by: [`PANELS.blueprint`](stationdeck.js.md#s-PANELS-blueprint) _js/station/stationdeck.js_

<!-- note:stationPlan -->
- L24 · `` const key = `${station.id}:${station.name}:${station.sector}`; `` — ids restart at st1 every sky, so the key carries what makes this port itself
- L28 · `const U = 46;` — grid cell px at zoom 1
- L37 · `let xTop = 0, xBot = 0;` — pack rooms onto a ragged two-row spine off a central corridor
- L41 · `const y = top ? -h : 1;` — corridor band occupies y ∈ [0,1)
- L44 · `door: { x: x + w / 2, y: 0.5 },` — all doors open onto the corridor
- L53 · `const peds = [];` — people: crew on shift plus dockside peds
<!-- /note -->

### <a id="s-routeTo"></a>`routeTo(plan, p, room)`

function · L68–79

- called by: [`tickPlan`](#s-tickPlan)

<!-- note:routeTo -->
route: room → door → corridor walk → door → room
<!-- /note -->

### <a id="s-tickPlan"></a>`tickPlan(plan, dt)`

function · **exported** · L81–101

- calls: [`routeTo`](#s-routeTo)
- called by: [`mountStationDeck`](stationdeck.js.md#s-mountStationDeck) _js/station/stationdeck.js_

<!-- note:tickPlan -->
<!-- /note -->

### <a id="s-occupancy"></a>`occupancy(plan)`

function · **exported** · L103–109

- called by: [`PANELS.blueprint`](stationdeck.js.md#s-PANELS-blueprint) _js/station/stationdeck.js_

<!-- note:occupancy -->
<!-- /note -->

### <a id="s-drawPlan"></a>`drawPlan(ctx, plan, view, w, h)`

function · **exported** · L111–160

- calls: [`drawPlan>X`](#s-drawPlan-X) ×8 · [`drawPlan>Y`](#s-drawPlan-Y) ×8
- called by: [`mountStationDeck`](stationdeck.js.md#s-mountStationDeck) _js/station/stationdeck.js_

<!-- note:drawPlan -->
Draws one frame. view = { zoom, panX, panY, selected }

- L117 · `ctx.strokeStyle = "rgba(90,140,190,0.08)";` — blueprint grid
- L126 · `ctx.fillStyle = "rgba(110,180,230,0.07)";` — central corridor
- L133 · `for (const r of plan.rooms) {` — rooms
- L140 · `ctx.strokeStyle = "#9fe8b0";` — door tick
- L147 · `if (U > 26) {` — label
- L154 · `for (const p of plan.peds) {` — people
<!-- /note -->

#### <a id="s-drawPlan-X"></a>`drawPlan>X(u)`

function · L123–123

- called by: [`drawPlan`](#s-drawPlan) ×8

<!-- note:drawPlan>X -->
<!-- /note -->

#### <a id="s-drawPlan-Y"></a>`drawPlan>Y(u)`

function · L124–124

- called by: [`drawPlan`](#s-drawPlan) ×8

<!-- note:drawPlan>Y -->
<!-- /note -->

### <a id="s-roomAt"></a>`roomAt(plan, view, w, h, px, py)`

function · **exported** · L162–168

- called by: [`PANELS.blueprint`](stationdeck.js.md#s-PANELS-blueprint) _js/station/stationdeck.js_

<!-- note:roomAt -->
<!-- /note -->
