# js/robotgen/data/parts.js

[index](../../../../README.md) · 280 lines · 8 symbols · 1 imports · 1 importers

## About

<!-- note:@file -->
robotgen/src/data/parts.js — the robot parts catalogue.

Same shape as STATIONGEN's parts list and NEWSHIPGEN's part catalogue: an id,
a name, a mass, net power and heat, and a bill of materials — here written as
counts of catalogue COMPONENTS (`c.*`), which roll up to raw `m.*` stock the
same way a ship part does. So a yard can quote a robot, a shuttle and a
station module off one manifest.

  mass  kg           pwr  W (+ generates, − draws)      heat  W to reject
  bom   { componentId: count }   fractional counts are fine (half a harness run)

A part is an ASSEMBLY, not a mesh: `bom.js` picks parts from the spec and
counts them, so the parts list and the geometry stay independently editable.

- L29 · `P('r.fr.spine_light',   'Light spine / core frame',        { mass: 3.2,  bom: { 'c.frame_r` — ---- frame & structure ----------------------------------------------------
- L40 · `P('r.ac.joint_micro',   'Micro servo joint',               { mass: 0.15, pwr: -8,   bom: {` — ---- actuation ------------------------------------------------------------
- L47 · `P('r.dr.leg_light',     'Light walking leg',               { mass: 4.6,  pwr: -180, heat:` — ---- drive & locomotion ---------------------------------------------------
- L61 · `P('r.fl.rotor_unit',    'Rotor unit (motor + blades)',     { mass: 1.5,  pwr: -700, heat:` — ---- flight ---------------------------------------------------------------
- L69 · `P('r.fl.microjet',      'Micro turbofan pod',              { mass: 6.0,  pwr: -2600, heat:` — a turbofan burns its own fuel: the tank is booked as stored energy and the
  pod's shaft power as draw, so endurance falls out of the same sum as a battery
- L74 · `P('r.pw.pack_small',    'Battery pack (0.5 kWh)',          { kwh: 0.5, mass: 2.6,  bom: {` — ---- power ----------------------------------------------------------------
- L83 · `P('r.sn.optic_mono',    'Optic pod (mono)',                { mass: 0.35, pwr: -6,  bom: {` — ---- sensors & head -------------------------------------------------------
- L100 · `P('r.cd.cpu_core',      'Flight / motion controller',      { mass: 0.6,  pwr: -25, heat: 2` — ---- compute, autonomy, comms ---------------------------------------------
- L109 · `P('r.ee.gripper',       'Two-finger gripper',              { mass: 1.6,  pwr: -40, bom: {` — ---- end effectors & tools ------------------------------------------------
- L127 · `P('r.ar.plate',         'Armour plate section',            { mass: 2.0,  bom: { 'c.armor_t` — ---- armour & protection ---------------------------------------------------
- L136 · `P('r.wp.smallarm',      'Integrated small-arm',            { mass: 6.5,  pwr: -20, bom: {` — ---- weapons ---------------------------------------------------------------
- L153 · `P('r.kt.cargo_rack',    'Cargo rack + bins',               { mass: 6.0,  bom: { 'c.cargo_b` — ---- career kit & payload ---------------------------------------------------
- L173 · `P('r.th.fan_loop',      'Forced-air cooling loop',         { mass: 1.4,  pwr: -45, heat: -` — ---- thermal & environment ---------------------------------------------------
- L179 · `P('r.sv.beacon',        'Hazard beacon set',               { mass: 0.4,  pwr: -18, bom: {` — ---- service, safety, interface ---------------------------------------------
- L185 · `P('r.fr.spine_micro',   'Micro airframe plate stack',      { mass: 0.25, bom: { 'c.frame_m` — ---- micro tier — sub-metre scouts and inspection flyers -------------------
- L255 · `P('r.wp.missiles_micro','Micro munition rail (2 tube)',    { mass: 2.0,  pwr: -8, bom: { '` — ---- micro-tier stores: what a sub-metre airframe is actually allowed to carry --
- L267 · `P('r.wp.railgun',       'Shoulder railgun',                { mass: 52.0, pwr: -9000, heat:` — ---- v1.7: the hardware the taxonomy grew ----------------------------------
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./catalog.js` | `COMPONENTS` | [js/robotgen/data/catalog.js](catalog.js.md) |

## Imported by

- [js/robotgen/data/bom.js](bom.js.md) — `PARTS`, `PART_DOMAINS`

## Exports

- [`PART_DOMAINS`](#s-PART_DOMAINS) · const — used by [js/robotgen/data/bom.js](bom.js.md)
- [`PARTS`](#s-PARTS) · const — used by [js/robotgen/data/bom.js](bom.js.md)
- [`reconcileParts`](#s-reconcileParts) · function — **no importer in scanned roots**
- [`RECONCILE`](#s-RECONCILE) · const — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-PART_DOMAINS"></a>`PART_DOMAINS`

const · **exported** · L3–17

<!-- note:PART_DOMAINS -->
<!-- /note -->

### <a id="s-PARTS"></a>`PARTS`

const · **exported** · L19–19

<!-- note:PARTS -->
<!-- /note -->

### <a id="s-P"></a>`P(id, name, o)`

function · L20–27

- called by: [`@file`](#) ×204

<!-- note:P -->
<!-- /note -->

### <a id="s-FILL_STD"></a>`FILL_STD`

const · L225–225

<!-- note:FILL_STD -->
---- mass reconciliation -----------------------------------------------------
The components decide. Where a part's listed components already weigh more
than the part was pencilled in at, the part's mass is raised to what it is
actually made of; where they weigh less, the difference is filled with the
structure a real assembly carries anyway — frame, shell, fasteners — exactly
the way NEWSHIPGEN fills a part out to its mass. After this pass every part
satisfies  Σ(component mass) == part.mass,  so the manifest cannot quietly
invent or lose kilograms on the way down to raw stock.
<!-- /note -->

### <a id="s-FILL_MICRO"></a>`FILL_MICRO`

const · L226–226

<!-- note:FILL_MICRO -->
<!-- /note -->

### <a id="s-bomKg"></a>`bomKg(bom)`

function · L227–231

- called by: [`reconcileParts`](#s-reconcileParts)

<!-- note:bomKg -->
<!-- /note -->

### <a id="s-reconcileParts"></a>`reconcileParts()`

function · **exported** · L232–253

- calls: [`bomKg`](#s-bomKg)
- called by: [`RECONCILE`](#s-RECONCILE)

<!-- note:reconcileParts -->
<!-- /note -->

### <a id="s-RECONCILE"></a>`RECONCILE`

const · **exported** · L280–280

- calls: [`reconcileParts`](#s-reconcileParts)

<!-- note:RECONCILE -->
<!-- /note -->

## Module-level calls

- calls: [`P`](#s-P)
