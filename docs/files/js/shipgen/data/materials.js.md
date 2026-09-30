# js/shipgen/data/materials.js

[index](../../../../README.md) · 260 lines · 3 symbols · 0 imports · 4 importers

## About

<!-- note:@file -->
Raw materials and manufactured components — the bottom of every bill of materials.

MATERIALS   raw stock, priced by the kilogram.        { name, kind }
COMPONENTS  manufactured items with their own BOM.   { name, kg (unit mass), bom }
  bom values: kg of a material, or count of a sub-component. Σ must match kg (audited ±15%).
Fasteners are real components: a kit is 50 pieces; parts consume kits by the dozen.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/shipgen/data/bom.js](bom.js.md) — `MATERIALS`, `COMPONENTS`
- [js/shipgen/index.js](../index.js.md) — `MATERIALS`, `COMPONENTS`
- test/hullspec.test.mjs _(outside js/)_ — `MATERIALS`
- test/shipgen/audit-bom.mjs _(outside js/)_ — `MATERIALS`, `COMPONENTS`

## Exports

- [`MATERIALS`](#s-MATERIALS) · const — used by [js/shipgen/data/bom.js](bom.js.md), [js/shipgen/index.js](../index.js.md), test/hullspec.test.mjs, test/shipgen/audit-bom.mjs
- [`COMPONENTS`](#s-COMPONENTS) · const — used by [js/shipgen/data/bom.js](bom.js.md), [js/shipgen/index.js](../index.js.md), test/shipgen/audit-bom.mjs

## Effects

_none detected_

## Symbols

### <a id="s-MATERIALS"></a>`MATERIALS`

const · **exported** · L1–69

<!-- note:MATERIALS -->
- L2 · `"m.al_li":     { name: "Al-Li 2195 alloy",            kind: "alloy" },` — structural alloys
- L15 · `"m.cfrp":      { name: "Carbon-fibre epoxy laminate",  kind: "composite" },` — composites / polymers
- L25 · `"m.bn":        { name: "Boron nitride ceramic",        kind: "ceramic" },` — ceramics / glass
- L32 · `"m.si":        { name: "Silicon (rad-hard process)",   kind: "semiconductor" },` — electronics / photonics / magnetics
- L42 · `"m.li":        { name: "Li-metal solid-state cell stock", kind: "electrochem" },` — chemistry / storage / life
- L63 · `"m.cermet":    { name: "UO₂-W CERMET fuel",            kind: "nuclear" },` — nuclear
<!-- /note -->

### <a id="s-C"></a>`C(name, kg, bom)`

function · L71–71

- called by: [`COMPONENTS`](#s-COMPONENTS) ×187

<!-- note:C -->
helper: component record
<!-- /note -->

### <a id="s-COMPONENTS"></a>`COMPONENTS`

const · **exported** · L72–260

- calls: [`C`](#s-C) ×187

<!-- note:COMPONENTS -->
- L73 · `"c.bolt_m4":     C("M4 Ti bolt kit (50 + nuts, washers)", 0.12, { "m.ti64": 0.12 }),` — ---- fasteners, joints, hardware (the bolts and screws) ----
- L85 · `"c.plate_al":    C("Al-Li skin plate 1 m² × 4 mm",        11.0, { "m.al_li": 11.0 }),` — ---- structural stock ----
- L108 · `"c.harness":     C("Wiring harness run (10 m)",           2.0,  { "m.cu": 1.4, "m.kapton":` — ---- electrical ----
- L131 · `"c.valve_latch": C("Latching solenoid valve",             0.45, { "m.steel304": 0.3, "m.cu` — ---- fluids ----
- L148 · `"c.cathode":     C("Hollow cathode assembly",             0.8,  { "m.lab6": 0.1, "m.ta": 0` — ---- propulsion ----
- L169 · `"c.fuel_cermet": C("CERMET fuel element",                 8.0,  { "m.cermet": 8.0 }),` — ---- nuclear / power ----
- L186 · `"c.fog":         C("Fibre-optic gyro triad",              1.2,  { "m.fused_si": 0.4, "m.in` — ---- avionics / sensors / comms ----
- L206 · `"c.electrolysis_stack": C("PEM electrolysis stack",       12.0, { "m.nafion": 1.0, "m.pt":` — ---- life support / habitat ----
- L226 · `"c.robot_joint": C("Robot joint (motor + harmonic drive)",4.0,  { "c.motor": 1, "c.gearbox` — ---- robotics / manufacturing / mining ----
- L243 · `"c.rail_barrel": C("Railgun rail pair + sabot guide",     120.0,{ "m.cu": 60.0, "m.w": 30.` — ---- weapons (catalog level: the effector hardware, not the payload chemistry) ----
<!-- /note -->
