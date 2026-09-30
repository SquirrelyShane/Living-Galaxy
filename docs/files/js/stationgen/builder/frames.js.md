# js/stationgen/builder/frames.js

[index](../../../../README.md) · 48 lines · 7 symbols · 1 imports · 3 importers

## About

<!-- note:@file -->
Slot frames: where a module may be mounted, and how it is oriented there.

A slot is a point on the structure with an outward normal, a direction
along the structure (the module's own long axis), a mount kind, the
station zone it sits in (0 command end → 1 power end) and how much of
the sun it sees. Modules are built in a local frame with +Y out of the
hull and +Z along the structure; `frameMatrix` turns a slot into that.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |

## Imported by

- [js/stationgen/builder/StationBuilder.js](StationBuilder.js.md) — `frameMatrix`
- [js/stationgen/builder/hull.js](hull.js.md) — `slot`
- [js/stationgen/builder/placement.js](placement.js.md) — `slotBox`, `slotBoxes`, `frameMatrix`, `sunDot`

## Exports

- [`slot`](#s-slot) · function — used by [js/stationgen/builder/hull.js](hull.js.md)
- [`frameMatrix`](#s-frameMatrix) · function — used by [js/stationgen/builder/StationBuilder.js](StationBuilder.js.md), [js/stationgen/builder/placement.js](placement.js.md)
- [`slotBox`](#s-slotBox) · function — used by [js/stationgen/builder/placement.js](placement.js.md)
- [`slotBoxes`](#s-slotBoxes) · function — used by [js/stationgen/builder/placement.js](placement.js.md)
- [`sunDot`](#s-sunDot) · function — used by [js/stationgen/builder/placement.js](placement.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-slot"></a>`slot(kind, pos, normal, along, zone, extra=)`

function · **exported** · L3–9

- called by: [`STYLES.bastion`](hull.js.md#s-STYLES-bastion) _js/stationgen/builder/hull.js_ ×3 · [`STYLES.cathedral`](hull.js.md#s-STYLES-cathedral) _js/stationgen/builder/hull.js_ ×10 · [`STYLES.cluster`](hull.js.md#s-STYLES-cluster) _js/stationgen/builder/hull.js_ · [`STYLES.lattice`](hull.js.md#s-STYLES-lattice) _js/stationgen/builder/hull.js_ · [`STYLES.ziggurat`](hull.js.md#s-STYLES-ziggurat) _js/stationgen/builder/hull.js_ ×2 · [`arm`](hull.js.md#s-arm) _js/stationgen/builder/hull.js_ ×3 · [`boom`](hull.js.md#s-boom) _js/stationgen/builder/hull.js_ · [`endSlots`](hull.js.md#s-endSlots) _js/stationgen/builder/hull.js_ ×2 · [`habitatDrum`](hull.js.md#s-habitatDrum) _js/stationgen/builder/hull.js_ ×2 · [`ring`](hull.js.md#s-ring) _js/stationgen/builder/hull.js_ · [`spine`](hull.js.md#s-spine) _js/stationgen/builder/hull.js_

<!-- note:slot -->
- L6 · `a.sub(n.clone().multiplyScalar(a.dot(n))).normalize();` — make `along` tangent
<!-- /note -->

### <a id="s-_x"></a>`_x`

const · L11–11

<!-- note:_x -->
<!-- /note -->

### <a id="s-_m"></a>`_m`

const · L11–11

<!-- note:_m -->
<!-- /note -->

### <a id="s-frameMatrix"></a>`frameMatrix(s, out=)`

function · **exported** · L12–17

- called by: [`StationBuilder.draw`](StationBuilder.js.md#s-StationBuilder-draw) _js/stationgen/builder/StationBuilder.js_ · [`StationBuilder.greebles`](StationBuilder.js.md#s-StationBuilder-greebles) _js/stationgen/builder/StationBuilder.js_ · [`slotBox`](#s-slotBox) · [`slotBoxes`](#s-slotBoxes) · [`place`](placement.js.md#s-place) _js/stationgen/builder/placement.js_

<!-- note:frameMatrix -->
Basis for a slot: X = normal × along, Y = normal, Z = along.
<!-- /note -->

### <a id="s-slotBox"></a>`slotBox(s, size, lift=, zShift=)`

function · **exported** · L19–29

- calls: [`frameMatrix`](#s-frameMatrix)
- called by: [`place`](placement.js.md#s-place) _js/stationgen/builder/placement.js_ ×2

<!-- note:slotBox -->
World-space AABB of a module box [w, h, d] sitting on a slot (base on the surface).
<!-- /note -->

### <a id="s-slotBoxes"></a>`slotBoxes(s, size, lift=, cell=, zShift=)`

function · **exported** · L31–46

- calls: [`frameMatrix`](#s-frameMatrix)
- called by: [`place`](placement.js.md#s-place) _js/stationgen/builder/placement.js_ ×2

<!-- note:slotBoxes -->
The same footprint as a set of tighter AABBs: the frame box is split into cells
(≤ 3 per axis, ~45 m each) so a big box on a tilted slot does not fence off
the whole neighbourhood the way one world-aligned box round it would.
<!-- /note -->

### <a id="s-sunDot"></a>`sunDot(s, sun)`

function · **exported** · L48–48

- called by: [`scoreSlot`](placement.js.md#s-scoreSlot) _js/stationgen/builder/placement.js_

<!-- note:sunDot -->
Sun exposure of a slot: +1 facing the sun, −1 in its own shadow, 0 edge-on.
<!-- /note -->
