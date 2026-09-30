# js/robotgen/world.js

[index](../../../README.md) · 168 lines · 11 symbols · 1 imports · 0 importers

## About

<!-- note:@file -->
robotgen/src/world.js — the planet a machine was built for.

v1.7: a world also decides whether FLYING works at all. A rotor and a wing
need air, so vacuum worlds zero them out and thin or dense atmospheres scale
them; that is the same one-line bias every other draw goes through.

A world does two things: it sets the gravity the animator runs under, and it
biases every weighted draw in the spec generator. The draw COUNT never
changes, so a world shifts the odds without desynchronising a seed.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./spec.js` | `generateRobot`, `makeRng`, `PALETTES` | [js/robotgen/spec.js](spec.js.md) |

## Imported by

_nothing scanned imports this file — entry point, loaded by path, or dead_

## Exports

- [`WORLDS`](#s-WORLDS) · const — **no importer in scanned roots**
- [`WORLD_KEYS`](#s-WORLD_KEYS) · const — **no importer in scanned roots**
- [`FLIES`](#s-FLIES) · function — **no importer in scanned roots**
- [`SETTLEMENTS`](#s-SETTLEMENTS) · const — **no importer in scanned roots**
- [`SETTLEMENT_KEYS`](#s-SETTLEMENT_KEYS) · const — **no importer in scanned roots**
- [`resolveWorld`](#s-resolveWorld) · function — **no importer in scanned roots**
- [`gravityOf`](#s-gravityOf) · function — **no importer in scanned roots**
- [`generatePopulation`](#s-generatePopulation) · function — **no importer in scanned roots**
- [`describeWorld`](#s-describeWorld) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-WORLDS"></a>`WORLDS`

const · **exported** · L3–98

<!-- note:WORLDS -->
<!-- /note -->

### <a id="s-WORLD_KEYS"></a>`WORLD_KEYS`

const · **exported** · L99–99

<!-- note:WORLD_KEYS -->
<!-- /note -->

### <a id="s-FLIES"></a>`FLIES(world)`

function · **exported** · L100–103

- calls: [`resolveWorld`](#s-resolveWorld)
- called by: [`generatePopulation`](#s-generatePopulation)

<!-- note:FLIES -->
<!-- /note -->

### <a id="s-SETTLEMENTS"></a>`SETTLEMENTS`

const · **exported** · L105–115

<!-- note:SETTLEMENTS -->
---------- settlements: who is actually on the ground ----------
<!-- /note -->

### <a id="s-SETTLEMENT_KEYS"></a>`SETTLEMENT_KEYS`

const · **exported** · L116–116

<!-- note:SETTLEMENT_KEYS -->
<!-- /note -->

### <a id="s-resolveWorld"></a>`resolveWorld(world)`

function · **exported** · L118–121

- called by: [`FLIES`](#s-FLIES) · [`describeWorld`](#s-describeWorld) · [`generatePopulation`](#s-generatePopulation) · [`gravityOf`](#s-gravityOf)

<!-- note:resolveWorld -->
<!-- /note -->

### <a id="s-gravityOf"></a>`gravityOf(world)`

function · **exported** · L122–125

- calls: [`resolveWorld`](#s-resolveWorld)

<!-- note:gravityOf -->
<!-- /note -->

### <a id="s-FACTION_A"></a>`FACTION_A`

const · L127–127

<!-- note:FACTION_A -->
<!-- /note -->

### <a id="s-FACTION_B"></a>`FACTION_B`

const · L128–128

<!-- note:FACTION_B -->
<!-- /note -->

### <a id="s-generatePopulation"></a>`generatePopulation(seed, worldKey, count=, opts=)`

function · **exported** · L130–158

- calls: [`generateRobot`](spec.js.md#s-generateRobot) _js/robotgen/spec.js_ · [`makeRng`](spec.js.md#s-makeRng) _js/robotgen/spec.js_ · [`FLIES`](#s-FLIES) · [`resolveWorld`](#s-resolveWorld)

<!-- note:generatePopulation -->
A crowd that reads as one place: shared livery, shared designation prefix, a
role mix that suits the settlement, and every frame built for this gravity.

- L147 · `const onLivery = Math.ceil(count * 0.6);` — the crowd has to read as one place,
- L148 · `for (let i = 0; i < count; i++) {` — so most of it wears the livery by quota
- L150 · `if (!FLIES(world) && (role === 'recon' || role === 'inspector' || role === 'interceptor'))` — an air career on an airless world would be built as a grounded frame the
  moment its loco bias hits zero — pick it deliberately rather than by accident
- L151 · `const palette = (i < onLivery || rng.chance(0.5)) ? livery : undefined;` — the rest are contractors, salvage and hand-me-downs in their own colours
<!-- /note -->

### <a id="s-describeWorld"></a>`describeWorld(world)`

function · **exported** · L160–168

- calls: [`resolveWorld`](#s-resolveWorld)

<!-- note:describeWorld -->
<!-- /note -->
