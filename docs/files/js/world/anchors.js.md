# js/world/anchors.js

[index](../../../README.md) · 26 lines · 4 symbols · 0 imports · 5 importers

## About

<!-- note:@file -->
LIVING GALAXY — what a mark is pinned to.

0.3.67. A waypoint used to be a point: `addWaypointAt(name, x, y, z)` copied
where something was at the moment you marked it, and only a world (`wp.body`)
was ever followed. Everything else moves — a port rides its host, a belt rock
wobbles on its cell, a hull flies, a drone works — so the mark was left in
empty space. And MINE IT marked a job's SURVEY POINT, the middle of a seam,
which is the one place in it with no rock.

A mark now carries an `anchor` ({ kind, id, … }) and its position is asked of
the thing it names, every time it is read. The resolvers live here, with no
imports, so any module can register one without a load-order cycle (sim.js
imports contracts.js, which imports sim.js — a registry on sim.js itself
would be read in its temporal dead zone).

A resolver is (anchor, time, out) → out, or null when the thing is gone. It
may write `anchor.label` (what it is pinned to now, for the chart) and, for a
site, `anchor.key` (which rock carries the mark).
<!-- /note -->

## Imports

_none_

## Imported by

- [js/console/panels/nav.js](../console/panels/nav.js.md) — `anchorHint`
- [js/drones/ops.js](../drones/ops.js.md) — `registerAnchor`
- [js/sim/sim.js](../sim/sim.js.md) — `registerAnchor`, `resolveAnchor`
- test/hulks.test.mjs _(outside js/)_ — `resolveAnchor`
- test/marks.test.mjs _(outside js/)_ — `resolveAnchor`, `anchorHint`

## Exports

- [`anchorKinds`](#s-anchorKinds) · const — **no importer in scanned roots**
- [`registerAnchor`](#s-registerAnchor) · function — used by [js/drones/ops.js](../drones/ops.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`resolveAnchor`](#s-resolveAnchor) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/hulks.test.mjs, test/marks.test.mjs
- [`anchorHint`](#s-anchorHint) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), test/marks.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-anchorKinds"></a>`anchorKinds`

const · **exported** · L1–1

<!-- note:anchorKinds -->
<!-- /note -->

### <a id="s-registerAnchor"></a>`registerAnchor(kind, fn)`

function · **exported** · L3–5

- called by: [`@file`](../drones/ops.js.md#) _js/drones/ops.js_ · [`@file`](../sim/sim.js.md#) _js/sim/sim.js_ ×11

<!-- note:registerAnchor -->
Register how to find a kind of thing. Last registration wins.
<!-- /note -->

### <a id="s-resolveAnchor"></a>`resolveAnchor(anchor, time, out=)`

function · **exported** · L7–17

- called by: [`addAnchoredWaypoint`](../sim/sim.js.md#s-addAnchoredWaypoint) _js/sim/sim.js_ · [`waypointPosition`](../sim/sim.js.md#s-waypointPosition) _js/sim/sim.js_

<!-- note:resolveAnchor -->
→ out with x/y/z, or null (gone, unknown kind, or no anchor).
<!-- /note -->

### <a id="s-anchorHint"></a>`anchorHint(anchor)`

function · **exported** · L19–26

- called by: [`markHint`](../console/panels/nav.js.md#s-markHint) _js/console/panels/nav.js_

<!-- note:anchorHint -->
A plain label for the chart: what a mark of this kind follows.
<!-- /note -->
