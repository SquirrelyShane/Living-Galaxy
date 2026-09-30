# js/world/archetypes.js

[index](../../../README.md) · 169 lines · 7 symbols · 0 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — the body database.

Every world in the sky is one of these. An archetype fixes what the surface
is made of, how it is painted, what it smells of on a survey, and what you
can dig out of it. The texture generator in textures.js reads `surface` to
decide which painter to run.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/world/bodies.js](bodies.js.md) — `archetypeById`
- [js/world/generate.js](generate.js.md) — `archetypeById`, `rollArchetypeAt`, `tempBand`

## Exports

- [`ARCHETYPES`](#s-ARCHETYPES) · const — **no importer in scanned roots**
- [`archetypesFor`](#s-archetypesFor) · function — **no importer in scanned roots**
- [`archetypeById`](#s-archetypeById) · function — used by [js/world/bodies.js](bodies.js.md), [js/world/generate.js](generate.js.md)
- [`rollArchetype`](#s-rollArchetype) · function — **no importer in scanned roots**
- [`tempBand`](#s-tempBand) · function — used by [js/world/generate.js](generate.js.md)
- [`rollArchetypeAt`](#s-rollArchetypeAt) · function — used by [js/world/generate.js](generate.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-ARCHETYPES"></a>`ARCHETYPES`

const · **exported** · L1–124

<!-- note:ARCHETYPES -->
- L2 · `{ id: "cinder", name: "Cinder world", kind: "rocky", surface: "lava", weight: 0.7,` — ---- rocky -----------------------------------------------------------
- L27 · `{ id: "garden", name: "Garden world", kind: "terra", surface: "ocean", weight: 1.0,` — ---- terra -----------------------------------------------------------
- L52 · `{ id: "sulfuric", name: "Sulfuric hothouse", kind: "cloud", surface: "sulfur", weight: 1.2` — ---- cloud -----------------------------------------------------------
- L65 · `{ id: "banded", name: "Banded giant", kind: "gas", surface: "bands", weight: 1.6,` — ---- gas -------------------------------------------------------------
- L82 · `{ id: "iceGiant", name: "Ice giant", kind: "ice", surface: "bands", weight: 1.3,` — ---- ice -------------------------------------------------------------
- L95 · `{ id: "cratered", name: "Cratered moon", kind: "moon", surface: "cratered", weight: 2.0,` — ---- moon ------------------------------------------------------------
- L112 · `{ id: "snowball", name: "Snowball", kind: "dwarf", surface: "iceshell", weight: 1.3,` — ---- dwarf -----------------------------------------------------------
<!-- /note -->

### <a id="s-BY_KIND"></a>`BY_KIND`

const · L126–126

<!-- note:BY_KIND -->
<!-- /note -->

### <a id="s-archetypesFor"></a>`archetypesFor(kind)`

function · **exported** · L132–134

- called by: [`rollArchetype`](#s-rollArchetype) · [`rollArchetypeAt`](#s-rollArchetypeAt)

<!-- note:archetypesFor -->
<!-- /note -->

### <a id="s-archetypeById"></a>`archetypeById(id)`

function · **exported** · L136–138

- called by: [`scaleBody`](bodies.js.md#s-scaleBody) _js/world/bodies.js_ · [`makeBody`](generate.js.md#s-makeBody) _js/world/generate.js_

<!-- note:archetypeById -->
<!-- /note -->

### <a id="s-rollArchetype"></a>`rollArchetype(kind, rnd)`

function · **exported** · L140–149

- calls: [`archetypesFor`](#s-archetypesFor)

<!-- note:rollArchetype -->
Weighted pick for a body kind.
<!-- /note -->

### <a id="s-tempBand"></a>`tempBand(orbit, maxOrbit)`

function · **exported** · L151–158

- called by: [`generateSystem`](generate.js.md#s-generateSystem) _js/world/generate.js_

<!-- note:tempBand -->
Rough surface temperature band from where it sits, used to bias the roll.
<!-- /note -->

### <a id="s-rollArchetypeAt"></a>`rollArchetypeAt(kind, rnd, band)`

function · **exported** · L160–169

- calls: [`archetypesFor`](#s-archetypesFor)
- called by: [`generateSystem`](generate.js.md#s-generateSystem) _js/world/generate.js_ ×2

<!-- note:rollArchetypeAt -->
Prefer archetypes whose temperature suits the orbit, but do not force it.
<!-- /note -->
