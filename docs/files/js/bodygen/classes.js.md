# js/bodygen/classes.js

[index](../../../README.md) · 121 lines · 6 symbols · 0 imports · 10 importers

## About

<!-- note:@file -->
LIVING GALAXY — asteroid taxonomy, written in Living Galaxy's own ores.

Shane's asteroid-generator drop-in shipped nine taxonomic classes (C, B, S,
M, V, E, D, P, X) and its own 41-species mineral catalogue. The classes are
the good part and they are kept; the catalogue is not, because a rock that
assays "chalcopyrite" and then puts "copper ore" in the hold is two games.
So every weight table below is rewritten in `js/economy/materials.js` ore ids, and
the LOOK table in `js/world/rockgen.js` supplies how each one looks. There is one
mineral list in this game and this file does not add a second.

The classes do NOT replace the radial bands from v0.0.4 — they sit on top of
them. Where you are in the belt decides which classes are PLAUSIBLE (the
sunward rim is differentiated metal, the cold outer fifth is carbon and
frost); the rock's own hash then picks one from that shortlist. So the belt
still reads the way it was designed to, and two rocks a hundred metres apart
can still be a stony chondrite and an exposed core fragment.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/asteroidgen/ores.js](../asteroidgen/ores.js.md) — `CLASSES`
- [js/bodygen/baked.js](baked.js.md) — `CLASSES`
- [js/bodygen/body.js](body.js.md) — `CLASSES`
- [js/console/panels/nav.js](../console/panels/nav.js.md) — `CLASSES`
- [js/economy/sites.js](../economy/sites.js.md) — `classFor`, `classOre`, `CLASSES`, `CLASS_IDS`
- [js/render/engine.js](../render/engine.js.md) — `CLASSES`
- [js/world/events/impacts.js](../world/events/impacts.js.md) — `CLASSES`
- [js/world/field.js](../world/field.js.md) — `classFor`, `classOre`
- test/asteroids.test.mjs _(outside js/)_ — `CLASSES`, `CLASS_IDS`
- test/systems.test.mjs _(outside js/)_ — `CLASSES`, `CLASS_IDS`, `classFor`, `classOre`, `classSuite`, `BAND_CLASSES`

## Exports

- [`CLASSES`](#s-CLASSES) · const — used by [js/asteroidgen/ores.js](../asteroidgen/ores.js.md), [js/bodygen/baked.js](baked.js.md), [js/bodygen/body.js](body.js.md), [js/console/panels/nav.js](../console/panels/nav.js.md), [js/economy/sites.js](../economy/sites.js.md), [js/render/engine.js](../render/engine.js.md), [js/world/events/impacts.js](../world/events/impacts.js.md), test/asteroids.test.mjs, test/systems.test.mjs
- [`CLASS_IDS`](#s-CLASS_IDS) · const — used by [js/economy/sites.js](../economy/sites.js.md), test/asteroids.test.mjs, test/systems.test.mjs
- [`BAND_CLASSES`](#s-BAND_CLASSES) · const — used by test/systems.test.mjs
- [`classFor`](#s-classFor) · function — used by [js/economy/sites.js](../economy/sites.js.md), [js/world/field.js](../world/field.js.md), test/systems.test.mjs
- [`classOre`](#s-classOre) · function — used by [js/economy/sites.js](../economy/sites.js.md), [js/world/field.js](../world/field.js.md), test/systems.test.mjs
- [`classSuite`](#s-classSuite) · function — used by test/systems.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-CLASSES"></a>`CLASSES`

const · **exported** · L1–90

<!-- note:CLASSES -->
Each class: how it looks in bulk, how dense it is (the assay's mass), and
what it is made of as weights over Living Galaxy ore ids. Weights are relative.

`grade` is the bulk share of a cut that is cargo rather than matrix. It is a
separate number from what the surface SHOWS: the generator paints ore as thin
vein networks and spots, a few percent of the face, which is how a seam reads
from a cockpit — but a prospector's ticket priced off surface coverage would
call every rock in the belt worthless while the cutter fills the hold. So the
surface decides WHICH ores and in what proportion (with the class table as
the prior), and the class's grade decides how much of the rock is ore. A
metal core is mostly ore; a primitive carbonaceous body is mostly matrix.
<!-- /note -->

### <a id="s-CLASS_IDS"></a>`CLASS_IDS`

const · **exported** · L92–92

<!-- note:CLASS_IDS -->
<!-- /note -->

### <a id="s-BAND_CLASSES"></a>`BAND_CLASSES`

const · **exported** · L94–99

<!-- note:BAND_CLASSES -->
Which classes are plausible at this point in the belt.

`band` is what js/world/field.js already decides from the radius — "metal" for the
sunward rim, "stone" for the broad middle, "carbon" for the cold outer
fifth, "ice" past the frost line. The shortlists overlap on purpose: a metal
rim is mostly M and X but an S-type in it is not a bug, it is a rock that
came from somewhere else.
<!-- /note -->

### <a id="s-classFor"></a>`classFor(band, h)`

function · **exported** · L101–104

- called by: [`cellRocks`](../world/field.js.md#s-cellRocks) _js/world/field.js_

<!-- note:classFor -->
Deterministic class for a rock: its own hash against the band's shortlist.
<!-- /note -->

### <a id="s-classOre"></a>`classOre(cls, h)`

function · **exported** · L106–116

- called by: [`cellRocks`](../world/field.js.md#s-cellRocks) _js/world/field.js_

<!-- note:classOre -->
Abundance-weighted pick from a class's table, off one hash in [0,1).
<!-- /note -->

### <a id="s-classSuite"></a>`classSuite(cls)`

function · **exported** · L118–121

<!-- note:classSuite -->
The ore ids a class can carry at all, richest first — the assay's shortlist.
<!-- /note -->
