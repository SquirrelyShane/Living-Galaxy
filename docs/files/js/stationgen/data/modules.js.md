# js/stationgen/data/modules.js

[index](../../../../README.md) · 300 lines · 6 symbols · 0 imports · 2 importers

## About

<!-- note:@file -->
The module catalogue: what a station is made of.

A module is the unit the placement solver works in. Each one has a
footprint in metres [w, h, d] — w across the mount, h out from the hull,
d along the spine — a prefab that draws it, a mount kind it can sit on,
a zone it wants along the station's axis (0 = command end, 1 = power
end), a sun preference, the crew it needs, what it does for the
station's balance sheet, and the parts it is assembled from.

Zones are the realism: command and traffic control at the quiet end
with the windows; quarters, mess and kitchens together on the ring or
the habitat drum; life support and water in the middle next to the
people who breathe it; agriculture where the light is; industry, yards
and hangars at the working end; reactors last, behind a shadow shield,
with the radiators edge-on to the sun.

- L11 · `add([` — ---- life support ----------------------------------------------------------
- L11 · `add([` — ---- agriculture ---------------------------------------------------------
- L11 · `add([` — ---- science -------------------------------------------------------------
- L11 · `add([` — ---- industry ------------------------------------------------------------
- L11 · `add([` — ---- trade & cargo -------------------------------------------------------
- L11 · `add([` — ---- command -------------------------------------------------------------
- L11 · `add([` — ---- habitation ----------------------------------------------------------
- L11 · `add([` — ---- power & thermal -----------------------------------------------------
- L11 · `add([` — ---- docking -------------------------------------------------------------
- L11 · `add([` — ---- comms, sensors, defence ---------------------------------------------
- L11 · `add([` — ---- array variants ----------------------------------------------------------
<!-- /note -->

## Imports

_none_

## Imported by

- [js/stationgen/data/doctrine.js](doctrine.js.md) — `MODULES`
- [js/stationgen/index.js](../index.js.md) — `MODULES`, `MODULE_COUNT`, `REQUIRED`, `ZONE`

## Exports

- [`ZONE`](#s-ZONE) · const — used by [js/stationgen/index.js](../index.js.md)
- [`MODULES`](#s-MODULES) · const — used by [js/stationgen/data/doctrine.js](doctrine.js.md), [js/stationgen/index.js](../index.js.md)
- [`MODULE_COUNT`](#s-MODULE_COUNT) · const — used by [js/stationgen/index.js](../index.js.md)
- [`REQUIRED`](#s-REQUIRED) · const — used by [js/stationgen/index.js](../index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-ZONE"></a>`ZONE`

const · **exported** · L1–1

<!-- note:ZONE -->
<!-- /note -->

### <a id="s-M"></a>`M(id, name, o)`

function · L3–6

- called by: [`@file`](#) ×51

<!-- note:M -->
<!-- /note -->

### <a id="s-MODULES"></a>`MODULES`

const · **exported** · L8–8

<!-- note:MODULES -->
<!-- /note -->

### <a id="s-add"></a>`add(list)`

function · L9–9

- called by: [`@file`](#) ×11

<!-- note:add -->
<!-- /note -->

### <a id="s-MODULE_COUNT"></a>`MODULE_COUNT`

const · **exported** · L299–299

<!-- note:MODULE_COUNT -->
<!-- /note -->

### <a id="s-REQUIRED"></a>`REQUIRED`

const · **exported** · L300–300

<!-- note:REQUIRED -->
<!-- /note -->

## Module-level calls

- calls: [`add`](#s-add) · [`M`](#s-M)
