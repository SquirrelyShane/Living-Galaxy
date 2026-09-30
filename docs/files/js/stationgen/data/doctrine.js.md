# js/stationgen/data/doctrine.js

[index](../../../../README.md) · 45 lines · 6 symbols · 4 imports · 2 importers

## About

<!-- note:@file -->
Doctrine: archetype + tier → the module manifest.

The tier gives every station its habitation set (quarters, mess halls,
kitchens, life support, water, farms, shelters, lifeboats in proportion
to the people), the archetype adds what the place is for, and the list
the user asked for is always present: life support, air, chemical and
water plants, agriculture, R&D, a yard, industry, trading, command,
brig, mess, kitchens, quarters. Manufacturing archetypes get the big
yard; everyone else gets at least a fabrication bay so the "ship
manufacturing" line on the manifest is never empty.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./modules.js` | `MODULES` | [js/stationgen/data/modules.js](modules.js.md) |
| 2 | `./archetypes.js` | `ARCHETYPES` | [js/stationgen/data/archetypes.js](archetypes.js.md) |
| 3 | `./tiers.js` | `TIERS` | [js/stationgen/data/tiers.js](tiers.js.md) |
| 4 | `./bom.js` | `moduleBom` | [js/stationgen/data/bom.js](bom.js.md) |

## Imported by

- [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md) — `doctrineFor`, `manifestOf`
- [js/stationgen/index.js](../index.js.md) — `doctrineFor`, `manifestOf`

## Exports

- [`expand`](#s-expand) · function — **no importer in scanned roots**
- [`doctrineFor`](#s-doctrineFor) · function — used by [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md), [js/stationgen/index.js](../index.js.md)
- [`manifestOf`](#s-manifestOf) · function — used by [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md), [js/stationgen/index.js](../index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-expand"></a>`expand(list)`

function · **exported** · L6–10

- called by: [`doctrineFor`](#s-doctrineFor)

<!-- note:expand -->
<!-- /note -->

### <a id="s-doctrineFor"></a>`doctrineFor(archKey, tierKey, opts=)`

function · **exported** · L12–40

- calls: [`moduleBom`](bom.js.md#s-moduleBom) _js/stationgen/data/bom.js_ · [`doctrineFor>balance`](#s-doctrineFor-balance) ×2 · [`doctrineFor>fit`](#s-doctrineFor-fit) ×25 · [`expand`](#s-expand)
- called by: [`StationBuilder.build`](../builder/StationBuilder.js.md#s-StationBuilder-build) _js/stationgen/builder/StationBuilder.js_

<!-- note:doctrineFor -->
{ moduleId: count } for an archetype at a tier, before the builder trims what does not fit.

- L17 · `fit(T.quarters, T.quartersN);` — the population set
- L24 · `fit("cmd.deck"); fit("hb.brig"); fit("sc.rnd"); fit("cg.trading"); fit("mf.industrial");` — the always-present set
- L27 · `fit("sf.pdc_cluster"); fit("sf.fire_control");` — no station goes unarmed: close-in defence at the least, and a mast to aim it
- L28 · `for (const [id, n] of Object.entries(expand(A.doctrine))) fit(id, n);` — the archetype's own kit
<!-- /note -->

#### <a id="s-doctrineFor-fit"></a>`doctrineFor>fit(id, n=)`

function · L16–16

- called by: [`doctrineFor`](#s-doctrineFor) ×25

<!-- note:doctrineFor>fit -->
<!-- /note -->

#### <a id="s-doctrineFor-balance"></a>`doctrineFor>balance()`

function · L29–29

- calls: [`moduleBom`](bom.js.md#s-moduleBom) _js/stationgen/data/bom.js_
- called by: [`doctrineFor`](#s-doctrineFor) ×2

<!-- note:doctrineFor>balance -->
the balance sheet closes: generation covers draw with a fifth in hand,
radiators cover the heat. Solar for the quiet places, reactors where
there is already one.
<!-- /note -->

### <a id="s-manifestOf"></a>`manifestOf(lo)`

function · **exported** · L42–45

- calls: [`manifestOf>order`](#s-manifestOf-order) ×2
- called by: [`StationBuilder.build`](../builder/StationBuilder.js.md#s-StationBuilder-build) _js/stationgen/builder/StationBuilder.js_

<!-- note:manifestOf -->
[{ module, count }] in build order: big anchors first, masts last.
<!-- /note -->

#### <a id="s-manifestOf-order"></a>`manifestOf>order(m)`

function · L43–43

- called by: [`manifestOf`](#s-manifestOf) ×2

<!-- note:manifestOf>order -->
<!-- /note -->
