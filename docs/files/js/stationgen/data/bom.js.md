# js/stationgen/data/bom.js

[index](../../../../README.md) · 76 lines · 7 symbols · 2 imports · 3 importers

## About

<!-- note:@file -->
Bills of materials.

  partBom(part)         → { materialId: kg }
  moduleParts(module)   → [{ part, count }]
  moduleBom(module)     → { kg, materials, cr }
  stationBom(manifest)  → the whole station rolled up: parts by domain,
                          materials by kind, mass, power, heat, crew, cost
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./parts.js` | `PARTS`, `PART_DOMAINS` | [js/stationgen/data/parts.js](parts.js.md) |
| 2 | `./materials.js` | `MATERIALS`, `FAB_RATE` | [js/stationgen/data/materials.js](materials.js.md) |

## Imported by

- [js/stationgen/data/doctrine.js](doctrine.js.md) — `moduleBom`
- [js/stationgen/generate.js](../generate.js.md) — `stationBom`
- [js/stationgen/index.js](../index.js.md) — `partBom`, `partCost`, `moduleParts`, `moduleBom`, `stationBom`

## Exports

- [`partBom`](#s-partBom) · function — used by [js/stationgen/index.js](../index.js.md)
- [`partCost`](#s-partCost) · function — used by [js/stationgen/index.js](../index.js.md)
- [`moduleParts`](#s-moduleParts) · function — used by [js/stationgen/index.js](../index.js.md)
- [`moduleBom`](#s-moduleBom) · function — used by [js/stationgen/data/doctrine.js](doctrine.js.md), [js/stationgen/index.js](../index.js.md)
- [`stationBom`](#s-stationBom) · function — used by [js/stationgen/generate.js](../generate.js.md), [js/stationgen/index.js](../index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-SKINNED"></a>`SKINNED`

const · L4–4

<!-- note:SKINNED -->
Domains whose primary structural alloy (al_li) is swapped for the hull alloy the style rolled.
<!-- /note -->

### <a id="s-SKINNED_PARTS"></a>`SKINNED_PARTS`

const · L5–5

<!-- note:SKINNED_PARTS -->
<!-- /note -->

### <a id="s-partBom"></a>`partBom(p, alloy=)`

function · **exported** · L6–12

- called by: [`moduleBom`](#s-moduleBom) · [`partCost`](#s-partCost) · [`stationBom`](#s-stationBom)

<!-- note:partBom -->
<!-- /note -->

### <a id="s-partCost"></a>`partCost(p, alloy=)`

function · **exported** · L14–23

- calls: [`partBom`](#s-partBom)
- called by: [`moduleBom`](#s-moduleBom) · [`stationBom`](#s-stationBom)

<!-- note:partCost -->
- L21 · `cr += Math.abs(p.pwr) * 120 + Math.abs(p.heat) * 40;` — control, wiring and certification scale with the part's power handling
<!-- /note -->

### <a id="s-moduleParts"></a>`moduleParts(mod)`

function · **exported** · L25–31

- called by: [`moduleBom`](#s-moduleBom) · [`stationBom`](#s-stationBom)

<!-- note:moduleParts -->
<!-- /note -->

### <a id="s-moduleBom"></a>`moduleBom(mod, alloy=)`

function · **exported** · L33–43

- calls: [`moduleParts`](#s-moduleParts) · [`partBom`](#s-partBom) · [`partCost`](#s-partCost)
- called by: [`stationBom`](#s-stationBom) · [`doctrineFor`](doctrine.js.md#s-doctrineFor) _js/stationgen/data/doctrine.js_ · [`doctrineFor>balance`](doctrine.js.md#s-doctrineFor-balance) _js/stationgen/data/doctrine.js_

<!-- note:moduleBom -->
<!-- /note -->

### <a id="s-stationBom"></a>`stationBom(manifest, alloy=)`

function · **exported** · L45–76

- calls: [`moduleBom`](#s-moduleBom) · [`moduleParts`](#s-moduleParts) · [`partBom`](#s-partBom) · [`partCost`](#s-partCost)
- via [js/stationgen/data/parts.js](parts.js.md): `PARTS[…].name.replace`
- called by: [`buildStation`](../generate.js.md#s-buildStation) _js/stationgen/generate.js_

<!-- note:stationBom -->
Whole-station roll-up over a manifest: [{ module, count }]. `alloy` is the hull alloy the structure is skinned in.

- L46 · `const parts = {};` — partId → count
- L47 · `const materials = {};` — materialId → kg
- L48 · `const byDomain = {};` — domain → { label, parts: [{ id, name, count, mass, each }], mass, cr }
- L49 · `const byKind = {};` — material kind → kg
- L67 · `const inhouse = {};` — what the station makes for itself from traded stock: drones, missiles, slugs, plate
<!-- /note -->
