# js/world/events/atmoworks.js

[index](../../../../README.md) · 149 lines · 17 symbols · 6 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY experimental — the atmo works.

The first industry that changes a sky instead of hauling it. A terraforming
hull (or terraforming hands aboard any hull) can park inside two and a half
radii of a solid world and run the works: HEAT seeds greenhouse gas and
mirror light, COOL seeds albedo dust and radiator film. The world's
temperature moves — for real, persistently, saved with the sky — and its
climate band moves with it: warm a frozen moon 110 K and the readout stops
saying FROZEN.

The payday: the first time a world's band is brought to TEMPERATE by
terraforming, the charter pays a **terraform bond** — scaled by the world's
size — and every corporation in the sky remembers who did it.

Fit: the hull's own trade (terraforming complex, any tier — it carries an
Atmo Plant), plus one unit of rate per terraforming-complex hand aboard.
Runs off the ops bus; AUX 5 (ATMO) cycles OFF → HEAT → COOL.

- L14 · `export const ATMO_RATE = 0.5;` — kelvin per second per unit of works
- L15 · `export const ATMO_RANGE = 2.5;` — body radii
- L16 · `export const ATMO_LIMIT = 160;` — |terraform| clamp, kelvin
- L17 · `const DRAW_KW = 22;` — battery drain while seeding
- L18 · `const BOND_BASE = 900;` — terraform bond floor
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../../sim/sim.js` | `currentShipId`, `sim`, `logEvent` | [js/sim/sim.js](../../sim/sim.js.md) |
| 2 | `../bodies.js` | `BODIES`, `bodyById`, `bodyPosition`, `bodyTempK`, `bandFromK`, `dist3` | [js/world/bodies.js](../bodies.js.md) |
| 3 | `../../ships/shipdb.js` | `shipById` | [js/ships/shipdb.js](../../ships/shipdb.js.md) |
| 4 | `../../crew/ledger.js` | `crew` | [js/crew/ledger.js](../../crew/ledger.js.md) |
| 5 | `../../corp/corps.js` | `adjustStanding`, `corps` | [js/corp/corps.js](../../corp/corps.js.md) |
| 6 | `../../flight/pilot.js` | `work` | [js/flight/pilot.js](../../flight/pilot.js.md) |

## Imported by

- [js/sim/sim.js](../../sim/sim.js.md) — `applyTerraformSnapshot`, `resetAtmoWorks`, `stepAtmoWorks`, `terraformSnapshot`
- [js/ui/hud.js](../../ui/hud.js.md) — `wireAtmoWorks`

## Exports

- [`ATMO_MODES`](#s-ATMO_MODES) · const — **no importer in scanned roots**
- [`ATMO_RATE`](#s-ATMO_RATE) · const — **no importer in scanned roots**
- [`ATMO_RANGE`](#s-ATMO_RANGE) · const — **no importer in scanned roots**
- [`ATMO_LIMIT`](#s-ATMO_LIMIT) · const — **no importer in scanned roots**
- [`atmoworks`](#s-atmoworks) · const — **no importer in scanned roots**
- [`atmoFit`](#s-atmoFit) · function — **no importer in scanned roots**
- [`cycleAtmoMode`](#s-cycleAtmoMode) · function — **no importer in scanned roots**
- [`atmoTarget`](#s-atmoTarget) · function — **no importer in scanned roots**
- [`stepAtmoWorks`](#s-stepAtmoWorks) · function — used by [js/sim/sim.js](../../sim/sim.js.md)
- [`terraformSnapshot`](#s-terraformSnapshot) · function — used by [js/sim/sim.js](../../sim/sim.js.md)
- [`applyTerraformSnapshot`](#s-applyTerraformSnapshot) · function — used by [js/sim/sim.js](../../sim/sim.js.md)
- [`resetAtmoWorks`](#s-resetAtmoWorks) · function — used by [js/sim/sim.js](../../sim/sim.js.md)
- [`wireAtmoWorks`](#s-wireAtmoWorks) · function — used by [js/ui/hud.js](../../ui/hud.js.md)

## Effects

- **dom.id** — `aux-atmo` (wireAtmoWorks:137) · `aux-atmo-st` (wireAtmoWorks:138)
- **event.listen** — `click on btn → (inline)` (wireAtmoWorks:139)
- **timer** — `setInterval` (wireAtmoWorks:141)

## Symbols

### <a id="s-ATMO_MODES"></a>`ATMO_MODES`

const · **exported** · L8–12

<!-- note:ATMO_MODES -->
<!-- /note -->

### <a id="s-ATMO_RATE"></a>`ATMO_RATE`

const · **exported** · L14–14

<!-- note:ATMO_RATE -->
<!-- /note -->

### <a id="s-ATMO_RANGE"></a>`ATMO_RANGE`

const · **exported** · L15–15

<!-- note:ATMO_RANGE -->
<!-- /note -->

### <a id="s-ATMO_LIMIT"></a>`ATMO_LIMIT`

const · **exported** · L16–16

<!-- note:ATMO_LIMIT -->
<!-- /note -->

### <a id="s-DRAW_KW"></a>`DRAW_KW`

const · L17–17

<!-- note:DRAW_KW -->
<!-- /note -->

### <a id="s-BOND_BASE"></a>`BOND_BASE`

const · L18–18

<!-- note:BOND_BASE -->
<!-- /note -->

### <a id="s-atmoworks"></a>`atmoworks`

const · **exported** · L20–25

<!-- note:atmoworks -->
- L22 · `targetId: null,` — body being worked (the nearest solid world in range)
- L23 · `applied: 0,` — kelvin moved this session
- L24 · `product: "",` — AUX readout
<!-- /note -->

### <a id="s-SOLID"></a>`SOLID`

const · L27–27

<!-- note:SOLID -->
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L28–28

<!-- note:_p -->
<!-- /note -->

### <a id="s-atmoFit"></a>`atmoFit()`

function · **exported** · L30–44

- calls: [`shipById`](../../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ · [`currentShipId`](../../sim/sim.js.md#s-currentShipId) _js/sim/sim.js_
- via [js/crew/ledger.js](../../crew/ledger.js.md): `crew.aboard.filter`
- called by: [`cycleAtmoMode`](#s-cycleAtmoMode) · [`stepAtmoWorks`](#s-stepAtmoWorks) · [`wireAtmoWorks`](#s-wireAtmoWorks)

<!-- note:atmoFit -->
Units of works aboard: the hull's own trade counts double, each terraforming hand is one.
<!-- /note -->

### <a id="s-cycleAtmoMode"></a>`cycleAtmoMode()`

function · **exported** · L46–58

- calls: [`logEvent`](../../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`atmoFit`](#s-atmoFit)
- called by: [`wireAtmoWorks`](#s-wireAtmoWorks)

<!-- note:cycleAtmoMode -->
<!-- /note -->

### <a id="s-atmoTarget"></a>`atmoTarget()`

function · **exported** · L60–68

- calls: [`bodyPosition`](../bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`dist3`](../bodies.js.md#s-dist3) _js/world/bodies.js_
- called by: [`stepAtmoWorks`](#s-stepAtmoWorks)

<!-- note:atmoTarget -->
The solid world in working range, or null.
<!-- /note -->

### <a id="s-stepAtmoWorks"></a>`stepAtmoWorks(dt)`

function · **exported** · L70–112

- calls: [`adjustStanding`](../../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`work`](../../flight/pilot.js.md#s-work) _js/flight/pilot.js_ ×2 · [`logEvent`](../../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ ×2 · [`bandFromK`](../bodies.js.md#s-bandFromK) _js/world/bodies.js_ ×2 · [`bodyTempK`](../bodies.js.md#s-bodyTempK) _js/world/bodies.js_ ×3 · [`atmoFit`](#s-atmoFit) · [`atmoTarget`](#s-atmoTarget)
- via [js/sim/sim.js](../../sim/sim.js.md): `sim.terraBonds.has`
- called by: [`stepCareer`](../../sim/sim.js.md#s-stepCareer) _js/sim/sim.js_

<!-- note:stepAtmoWorks -->
Called from the sim tick (sim seconds).

- L72 · `if (ship) ship.atmoDraw = 0;` — billed on the ops board by stepPower next tick — never straight off the battery
- L91 · `if ((atmoworks.applied | 0) % 25 === 0 && atmoworks.applied - (atmoworks.lastSave ?? 0) >=` — save the earned kelvin with the sky every so often
- L100 · `if (bandAfter === "temperate" && !sim.terraBonds?.has(body.id)) {` — the bond: first time the works bring a world to temperate
<!-- /note -->

### <a id="s-terraformSnapshot"></a>`terraformSnapshot()`

function · **exported** · L114–118

- called by: [`launchSim`](../../sim/sim.js.md#s-launchSim) _js/sim/sim.js_ · [`persistProgress`](../../sim/sim.js.md#s-persistProgress) _js/sim/sim.js_

<!-- note:terraformSnapshot -->
---- persistence: the sky keeps what the works earned ---------------------
<!-- /note -->

### <a id="s-applyTerraformSnapshot"></a>`applyTerraformSnapshot(snap, bonds=)`

function · **exported** · L120–126

- calls: [`bodyById`](../bodies.js.md#s-bodyById) _js/world/bodies.js_
- called by: [`launchSim`](../../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:applyTerraformSnapshot -->
<!-- /note -->

### <a id="s-resetAtmoWorks"></a>`resetAtmoWorks()`

function · **exported** · L128–133

- called by: [`launchSim`](../../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:resetAtmoWorks -->
<!-- /note -->

### <a id="s-wireAtmoWorks"></a>`wireAtmoWorks()`

function · **exported** · L135–149

- calls: [`atmoFit`](#s-atmoFit) · [`cycleAtmoMode`](#s-cycleAtmoMode)
- called by: [`mountHud`](../../ui/hud.js.md#s-mountHud) _js/ui/hud.js_
- effects: dom.id `aux-atmo` · dom.id `aux-atmo-st` · event.listen `click` · timer `setInterval`

<!-- note:wireAtmoWorks -->
Dash AUX wiring + console access.
<!-- /note -->
