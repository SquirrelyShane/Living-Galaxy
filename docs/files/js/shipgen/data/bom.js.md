# js/shipgen/data/bom.js

[index](../../../../README.md) · 383 lines · 25 symbols · 1 imports · 4 importers

## About

<!-- note:@file -->
Bills of materials.

partBom(part)  → { componentId: count }   functional components by rule, then structural fill
                                           (plates / frames / fasteners / harness) so Σ mass == part.mass
expandBom(bom) → { materialId: kg }        recursive roll-up to raw stock, plus fastener piece count
hullBom(dims)  → hull structure from surface area: skin plates, frames, Whipple layers, MLI, welds, bolts

Rules are additive: every matching rule contributes. Counts may be numbers or fn(massKg).

- L4 · `const per = (c, k) => (m) => Math.max(1, Math.round(m * k / COMPONENTS[c].kg));` — fraction k of mass in component c
- L13 · `rule((p) => p.pwr !== 0, { "c.pcb": (m) => 1 + Math.round(m / 400), "c.connector": (m) =>` — every powered part has electronics + connectors; every exterior part has thermal hardware
- L22 · `rule(id("prop.gridion"), { "c.cathode": 2, "c.grid_cc": 1, "c.cusp_magnet": 6, "c.anode":` — 01 propulsion
- L53 · `rule(any(id("fl.lh2"), id("fl.lox"), id("fl.lch4"), id("fl.lxe")), { "c.dewar": per("c.dew` — 02 fluids
- L63 · `rule(id("pw.solar"), { "c.pv_blanket": per("c.pv_blanket", 0.5), "c.hinge": 4, "c.slip_rin` — 03 power
- L81 · `rule(id("ep.battery"), { "c.battery_cell": per("c.battery_cell", 0.7), "c.pcb": 4, "c.busb` — 04 epds
- L93 · `rule(id("st.cnt"), { "c.truss_cnt": per("c.truss_cnt", 0.8), "c.metglass_joint": 4 });` — 05 structure
- L107 · `rule(id("mt.polyshield"), { "c.pe_shield": per("c.pe_shield", 0.85) });` — 06 materials
- L122 · `rule(any(id("tc.radwing"), id("tc.bodyrad"), id("tc.varem")), { "c.radiator_panel": per("c` — 07 thermal
- L131 · `rule(any(id("cd.fc"), id("cd.rtos"), id("cd.autonomy"), id("cd.hm"), id("cd.predict"), id(` — 08 computing
- L136 · `rule(any(id("gn.fog"), id("gn.rlg")), { "c.fog": 1, "c.accel": 1 });` — 09 gnc
- L146 · `rule(id("cm.hga"), { "c.dish_cfrp": per("c.dish_cfrp", 0.4), "c.feedhorn": 1, "c.twta": 1,` — 10 comms
- L156 · `rule(any(id("sw.lidar"), id("sf.debrisradar"), id("nav.lidar")), { "c.lidar_head": 1, "c.m` — 11 sensors
- L165 · `rule(id("at.electrolysis"), { "c.electrolysis_stack": 1, "c.pump": 2, "c.valve_latch": 6,` — 12 atmosphere
- L175 · `rule(any(id("wf.urine"), id("wf.multifilt"), id("wf.condensate"), id("wf.brine")), { "c.me` — 13 water / waste / food
- L183 · `rule(id("hb.cabins"), { "c.bunk": 4, "c.lamp": 6, "c.fan": 2 });` — 14 habitation
- L193 · `rule(any(id("ev.airlock"), id("dk.tunnel")), { "c.hatch": 2, "c.pump": 1, "c.valve_latch":` — 15 eva / docking
- L201 · `rule(any(id("rb.freeflyer"), id("cg.invbot")), { "c.drone": 1, "c.latch": 2 });` — 16 robotics
- L207 · `rule(any(id("cg.rack"), id("cg.printers")), { "c.rack_frame": 2, "c.latch": 4 });` — 17 cargo / mining
- L218 · `rule(any(id("sf.smoke"), id("sf.avoid"), id("sf.watchdog")), { "c.gas_sensor": 4, "c.pcb":` — 18 safety / defense
- L241 · `rule(any(id("mf.printer"), id("mf.wirearc")), { "c.print_head": 3, "c.spindle": 1, "c.vac_` — 19 manufacturing
- L253 · `rule(any(id("sd."), id("id.blockport")), { "c.connector": 4, "c.qd": 1, "c.insert": 2 });` — 20 standards & 00 identity
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./materials.js` | `MATERIALS`, `COMPONENTS` | [js/shipgen/data/materials.js](materials.js.md) |

## Imported by

- [js/economy/shipcost.js](../../economy/shipcost.js.md) — `partBom`, `expandBom`
- [js/shipgen/generate.js](../generate.js.md) — `shipBom`
- [js/shipgen/index.js](../index.js.md) — `partBom`, `expandBom`, `bomMass`, `hullBom`, `shipBom`
- test/shipgen/audit-bom.mjs _(outside js/)_ — `partBom`, `expandBom`, `bomMass`, `hullBom`, `shipBom`

## Exports

- [`partBom`](#s-partBom) · function — used by [js/economy/shipcost.js](../../economy/shipcost.js.md), [js/shipgen/index.js](../index.js.md), test/shipgen/audit-bom.mjs
- [`bomMass`](#s-bomMass) · function — used by [js/shipgen/index.js](../index.js.md), test/shipgen/audit-bom.mjs
- [`expandBom`](#s-expandBom) · function — used by [js/economy/shipcost.js](../../economy/shipcost.js.md), [js/shipgen/index.js](../index.js.md), test/shipgen/audit-bom.mjs
- [`hullBom`](#s-hullBom) · function — used by [js/shipgen/index.js](../index.js.md), test/shipgen/audit-bom.mjs
- [`shipBom`](#s-shipBom) · function — used by [js/shipgen/generate.js](../generate.js.md), [js/shipgen/index.js](../index.js.md), test/shipgen/audit-bom.mjs

## Effects

_none detected_

## Symbols

### <a id="s-kg"></a>`kg(p)`

function · L3–3

- called by: [`partBom`](#s-partBom)

<!-- note:kg -->
<!-- /note -->

### <a id="s-per"></a>`per(c, k)`

function · L4–4

- called by: [`@file`](#) ×41

<!-- note:per -->
<!-- /note -->

### <a id="s-R"></a>`R`

const · L6–6

<!-- note:R -->
---- functional rules: [predicate, { component: count|fn }] ---------------------------------
<!-- /note -->

### <a id="s-rule"></a>`rule(pred, comps)`

function · L7–7

- called by: [`@file`](#) ×241

<!-- note:rule -->
<!-- /note -->

### <a id="s-id"></a>`id(prefix)`

function · L8–8

- called by: [`@file`](#) ×358

<!-- note:id -->
<!-- /note -->

### <a id="s-tag"></a>`tag(t)`

function · L9–9

- called by: [`@file`](#) ×3

<!-- note:tag -->
<!-- /note -->

### <a id="s-pf"></a>`pf(k)`

function · L10–10

- called by: [`@file`](#)

<!-- note:pf -->
<!-- /note -->

### <a id="s-any"></a>`any(...fs)`

function · L11–11

- called by: [`@file`](#) ×79

<!-- note:any -->
<!-- /note -->

#### <a id="s-c-pcb"></a>`c.pcb(m)`

prop · L13–13

<!-- note:c.pcb -->
<!-- /note -->

#### <a id="s-c-connector"></a>`c.connector(m)`

prop · L13–13

<!-- note:c.connector -->
<!-- /note -->

#### <a id="s-c-mli"></a>`c.mli(m)`

prop · L14–14

<!-- note:c.mli -->
<!-- /note -->

#### <a id="s-c-heatpipe"></a>`c.heatpipe(m)`

prop · L20–20

<!-- note:c.heatpipe -->
<!-- /note -->

#### <a id="s-c-cryocooler"></a>`c.cryocooler(m)`

prop · L127–127

<!-- note:c.cryocooler -->
<!-- /note -->

#### <a id="s-c-grow_rack"></a>`c.grow_rack(m)`

prop · L178–178

<!-- note:c.grow_rack -->
<!-- /note -->

#### <a id="s-c-bio_vessel"></a>`c.bio_vessel(m)`

prop · L179–179

<!-- note:c.bio_vessel -->
<!-- /note -->

#### <a id="s-c-pe_shield"></a>`c.pe_shield(m)`

prop · L191–191

<!-- note:c.pe_shield -->
<!-- /note -->

#### <a id="s-c-container_shell"></a>`c.container_shell(m)`

prop · L208–208

<!-- note:c.container_shell -->
<!-- /note -->

### <a id="s-FILL"></a>`FILL`

const · L256–302

<!-- note:FILL -->
---- structural fill per prefab: how the remaining mass is spent ----------------------------
<!-- /note -->

### <a id="s-partBom"></a>`partBom(p)`

function · **exported** · L304–327

- calls: [`kg`](#s-kg) · [`partBom>add`](#s-partBom-add) ×6
- called by: [`partPrice`](../../economy/shipcost.js.md#s-partPrice) _js/economy/shipcost.js_ · [`shipBom`](#s-shipBom) ×2

<!-- note:partBom -->
- L310 · `let functional = Object.entries(bom).reduce((s, [c, q]) => s + q * COMPONENTS[c].kg, 0);` — if the functional set alone outweighs the part, scale it down proportionally (keep ≥1 of each)
- L313 · `const fast = Math.max(massKg * 0.03, 0.6);` — fasteners and wiring scale with the part, then structure takes the remainder
- L323 · `used = Object.entries(bom).reduce((s, [c, q]) => s + q * COMPONENTS[c].kg, 0);` — final trim: nudge the largest structural line so Σ lands within 2% of the declared mass
<!-- /note -->

#### <a id="s-partBom-add"></a>`partBom>add(c, q)`

function · L308–308

- called by: [`partBom`](#s-partBom) ×6

<!-- note:partBom>add -->
<!-- /note -->

### <a id="s-bomMass"></a>`bomMass(bom)`

function · **exported** · L329–329

<!-- note:bomMass -->
<!-- /note -->

### <a id="s-expandBom"></a>`expandBom(bom, out=, mult=)`

function · **exported** · L331–345

- calls: [`expandBom`](#s-expandBom)
- called by: [`partPrice`](../../economy/shipcost.js.md#s-partPrice) _js/economy/shipcost.js_ · [`expandBom`](#s-expandBom) · [`shipBom`](#s-shipBom) ×3

<!-- note:expandBom -->
recursive roll-up to raw materials; also counts fastener pieces
<!-- /note -->

### <a id="s-hullBom"></a>`hullBom(builder)`

function · **exported** · L347–373

- calls: [`hullBom>add`](#s-hullBom-add) ×20
- called by: [`shipBom`](#s-shipBom)

<!-- note:hullBom -->
hull structure from the tracked volumes: skin area → plates, frames, bumper, MLI, welds, bolts

- L352 · `add("c.plate_al", area * 1.0);` — pressure skin
- L353 · `add("c.whipple_layer", area * 0.6);` — outer bumper over 60% of the skin
- L354 · `add("c.honeycomb", area * 0.3);` — internal decks
- L355 · `add("c.frame_al", length * 6);` — longerons + frames
- L356 · `add("c.frame_ti", length * 1.5);` — primary load path
- L360 · `add("c.bolt_m6", area * 0.6);` — ~30 bolts per m² of skin
<!-- /note -->

#### <a id="s-hullBom-add"></a>`hullBom>add(c, q)`

function · L349–349

- called by: [`hullBom`](#s-hullBom) ×20

<!-- note:hullBom>add -->
<!-- /note -->

### <a id="s-shipBom"></a>`shipBom(builder, parts, drivePart)`

function · **exported** · L375–383

- calls: [`expandBom`](#s-expandBom) ×3 · [`hullBom`](#s-hullBom) · [`partBom`](#s-partBom) ×2
- called by: [`buildShip`](../generate.js.md#s-buildShip) _js/shipgen/generate.js_

<!-- note:shipBom -->
whole-ship roll-up: hull + every mounted part + the drive
<!-- /note -->

## Module-level calls

- calls: [`rule`](#s-rule) · [`pf`](#s-pf) · [`any`](#s-any) · [`tag`](#s-tag) · [`id`](#s-id) · [`per`](#s-per)
