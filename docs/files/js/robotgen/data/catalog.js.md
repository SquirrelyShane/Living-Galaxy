# js/robotgen/data/catalog.js

[index](../../../../README.md) · 191 lines · 12 symbols · 1 imports · 2 importers

## About

<!-- note:@file -->
robotgen/src/data/catalog.js — the shared build parts list.

`catalog-base.js` is a VERBATIM copy of NEWSHIPGEN/src/data/materials.js, so a
robot, a ship and a station are all quoted out of the same stock: the same
material ids (`m.*`) and the same manufactured components (`c.*`), with the
same unit masses. Nothing here rewrites a shared id — this file only ADDS the
small, robot-scale hardware the ship catalogue has no reason to carry
(servos, harmonic joints, rotor blades, tyres, track links, hand tools).

MATERIALS   raw stock                    { name, kind }
COMPONENTS  manufactured items           { name, kg, bom }   bom: kg of a material, or count of a sub-component
KIND_PRICE  book price per kg by kind, and FAB_RATE over stock — the same
            two-step costing STATIONGEN uses, so estimates are comparable.

STATION_ALIAS maps STATIONGEN's bare material ids onto the prefixed ones, so a
station BOM and a robot BOM can be summed without a translation pass.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./catalog-base.js` | `MATERIALS` as `SHIP_MATERIALS`, `COMPONENTS` as `SHIP_COMPONENTS` | [js/robotgen/data/catalog-base.js](catalog-base.js.md) |

## Imported by

- [js/robotgen/data/bom.js](bom.js.md) — `MATERIALS`, `COMPONENTS`, `materialCost`
- [js/robotgen/data/parts.js](parts.js.md) — `COMPONENTS`

## Exports

- [`MATERIALS`](#s-MATERIALS) · const — used by [js/robotgen/data/bom.js](bom.js.md)
- [`COMPONENTS`](#s-COMPONENTS) · const — used by [js/robotgen/data/bom.js](bom.js.md), [js/robotgen/data/parts.js](parts.js.md)
- [`ROBOT_ONLY`](#s-ROBOT_ONLY) · const — **no importer in scanned roots**
- [`STATION_ALIAS`](#s-STATION_ALIAS) · const — **no importer in scanned roots**
- [`KIND_PRICE`](#s-KIND_PRICE) · const — **no importer in scanned roots**
- [`FAB_RATE`](#s-FAB_RATE) · const — **no importer in scanned roots**
- [`materialCost`](#s-materialCost) · function — used by [js/robotgen/data/bom.js](bom.js.md)
- [`componentMass`](#s-componentMass) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-C"></a>`C(name, kg, bom)`

function · L3–3

- called by: [`ROBOT_COMPONENTS`](#s-ROBOT_COMPONENTS) ×124

<!-- note:C -->
<!-- /note -->

### <a id="s-ROBOT_MATERIALS"></a>`ROBOT_MATERIALS`

const · L5–20

<!-- note:ROBOT_MATERIALS -->
---- robot-scale materials the ship list does not stock ------------------
<!-- /note -->

### <a id="s-ROBOT_COMPONENTS"></a>`ROBOT_COMPONENTS`

const · L22–147

- calls: [`C`](#s-C) ×124

<!-- note:ROBOT_COMPONENTS -->
---- robot-scale components ---------------------------------------------

- L23 · `'c.motor_micro':  C('Micro BLDC motor',                  0.055,{ 'm.cu': 0.02, 'm.ndfeb_sm` — micro-scale hardware — a 0.5 m scout is not a small starship
- L48 · `'c.frame_rib':    C('Robot frame rib / bulkhead',        0.45, { 'm.al6061': 0.3, 'm.cfrp'` — structure
- L56 · `'c.servo_micro':  C('Micro servo (2 Nm)',                0.09, { 'm.abs': 0.03, 'm.cu': 0.` — actuation
- L63 · `'c.wheel_hub':    C('Hub-motor wheel unit',              2.80, { 'c.motor': 1, 'm.al6061':` — drives
- L71 · `'c.rotor_blade':  C('Composite rotor blade',             0.18, { 'm.cfrp': 0.14, 'm.epoxy'` — flight
- L82 · `'c.lipo_pack':    C('High-rate battery pack (0.5 kWh)',  2.40, { 'm.li': 1.7, 'm.al6061':` — power
- L88 · `'c.cam_module':   C('Machine-vision camera module',      0.18, { 'c.pcb_sm': 1.5, 'c.glazi` — sensing + compute
- L105 · `'c.beacon_led':   C('Beacon / strobe head',              0.12, { 'm.gan': 0.01, 'c.pcb': 0` — signalling / human interface
- L110 · `'c.gripper_2f':   C('Two-finger gripper',                1.20, { 'c.servo_joint': 1, 'm.al` — end effectors + tools
- L127 · `'c.cargo_bin':    C('Cargo bin / locker',                3.20, { 'm.abs': 1.8, 'm.al6061':` — payload bays and career kit
<!-- /note -->

### <a id="s-EXTRA_MATERIALS"></a>`EXTRA_MATERIALS`

const · L149–152

<!-- note:EXTRA_MATERIALS -->
the ship list stocks no Ge optics and no lead: add them rather than fake them
<!-- /note -->

### <a id="s-MATERIALS"></a>`MATERIALS`

const · **exported** · L154–154

<!-- note:MATERIALS -->
<!-- /note -->

### <a id="s-COMPONENTS"></a>`COMPONENTS`

const · **exported** · L155–155

<!-- note:COMPONENTS -->
<!-- /note -->

### <a id="s-ROBOT_ONLY"></a>`ROBOT_ONLY`

const · **exported** · L156–156

<!-- note:ROBOT_ONLY -->
<!-- /note -->

### <a id="s-STATION_ALIAS"></a>`STATION_ALIAS`

const · **exported** · L158–166

<!-- note:STATION_ALIAS -->
STATIONGEN's bare ids → this catalogue, so the three manifests can be summed.
<!-- /note -->

### <a id="s-KIND_PRICE"></a>`KIND_PRICE`

const · **exported** · L168–174

<!-- note:KIND_PRICE -->
Book price per kg of raw stock by kind, and what fabrication adds on top —
   the same two-step estimate STATIONGEN uses, in the same credits.
<!-- /note -->

### <a id="s-FAB_RATE"></a>`FAB_RATE`

const · **exported** · L175–180

<!-- note:FAB_RATE -->
<!-- /note -->

### <a id="s-materialCost"></a>`materialCost(id, kg)`

function · **exported** · L182–186

- called by: [`partCost`](bom.js.md#s-partCost) _js/robotgen/data/bom.js_

<!-- note:materialCost -->
<!-- /note -->

### <a id="s-componentMass"></a>`componentMass(id)`

function · **exported** · L187–191

<!-- note:componentMass -->
<!-- /note -->
