# js/ui/hudnodes.js

[index](../../../README.md) · 75 lines · 6 symbols · 0 imports · 2 importers

## About

<!-- note:@file -->
<!-- /note -->

## Imports

_none_

## Imported by

- [js/ui/hud.js](hud.js.md) — `paintLabels`, `paintMarkerNodes`
- test/hudnodes.test.mjs _(outside js/)_ — `paintLabels`, `paintMarkerNodes`

## Exports

- [`paintLabels`](#s-paintLabels) · function — used by [js/ui/hud.js](hud.js.md), test/hudnodes.test.mjs
- [`paintMarkerNodes`](#s-paintMarkerNodes) · function — used by [js/ui/hud.js](hud.js.md), test/hudnodes.test.mjs

## Effects

- **dom.create** — `span` (paintLabels:34, paintMarkerNodes:59) · `i` (paintLabels:49) · `b` (paintMarkerNodes:71)

## Symbols

### <a id="s-labels"></a>`labels`

const · L1–1

<!-- note:labels -->
<!-- /note -->

### <a id="s-markers"></a>`markers`

const · L2–2

<!-- note:markers -->
<!-- /note -->

### <a id="s-reconcile"></a>`reconcile(box, list, cache, identity, create, update)`

function · L4–24

- called by: [`paintLabels`](#s-paintLabels) · [`paintMarkerNodes`](#s-paintMarkerNodes)

<!-- note:reconcile -->
<!-- /note -->

### <a id="s-position"></a>`position(node, x, y)`

function · L26–30

- called by: [`paintLabels`](#s-paintLabels) · [`paintMarkerNodes`](#s-paintMarkerNodes)

<!-- note:position -->
<!-- /note -->

### <a id="s-paintLabels"></a>`paintLabels(box, list)`

function · **exported** · L32–55

- calls: [`position`](#s-position) · [`reconcile`](#s-reconcile)
- called by: [`mountHud>paintAll`](hud.js.md#s-mountHud-paintAll) _js/ui/hud.js_
- effects: dom.create `span` · dom.create `i`

<!-- note:paintLabels -->
<!-- /note -->

### <a id="s-paintMarkerNodes"></a>`paintMarkerNodes(box, list, definitions)`

function · **exported** · L57–75

- calls: [`position`](#s-position) · [`reconcile`](#s-reconcile)
- called by: [`paintMarkers`](hud.js.md#s-paintMarkers) _js/ui/hud.js_
- effects: dom.create `span` · dom.create `b`

<!-- note:paintMarkerNodes -->
<!-- /note -->
