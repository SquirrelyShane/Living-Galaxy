# js/robotgen/data/bom.js

[index](../../../../README.md) · 326 lines · 16 symbols · 2 imports · 1 importers

## About

<!-- note:@file -->
robotgen/src/data/bom.js — spec → parts manifest → bill of materials.

  robotParts(spec)  → [{ part, count, why }]      what the yard would pick
  partBom(part)     → { componentId: count }
  expandBom(bom)    → { materials: {id: kg}, components: {id: count}, fasteners }
  robotBom(spec)    → the whole unit rolled up: parts by domain, components,
                      materials by kind, mass, power, heat, cost

Same algorithm as NEWSHIPGEN's expandBom (components recurse to raw stock and
mass is conserved) and the same two-step costing as STATIONGEN. Nothing here
touches THREE — it runs in node, a worker or the page.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./catalog.js` | `MATERIALS`, `COMPONENTS`, `materialCost` | [js/robotgen/data/catalog.js](catalog.js.md) |
| 2 | `./parts.js` | `PARTS`, `PART_DOMAINS` | [js/robotgen/data/parts.js](parts.js.md) |

## Imported by

- [js/robotgen/spec.js](../spec.js.md) — `robotBom`

## Exports

- `PARTS` — **no importer in scanned roots**
- `PART_DOMAINS` — **no importer in scanned roots**
- `MATERIALS` — **no importer in scanned roots**
- `COMPONENTS` — **no importer in scanned roots**
- [`partBom`](#s-partBom) · function — **no importer in scanned roots**
- [`bomMass`](#s-bomMass) · function — **no importer in scanned roots**
- [`expandBom`](#s-expandBom) · function — **no importer in scanned roots**
- [`HAND_PART`](#s-HAND_PART) · const — **no importer in scanned roots**
- [`LIMB_PART`](#s-LIMB_PART) · const — **no importer in scanned roots**
- [`MOUNT_PART`](#s-MOUNT_PART) · const — **no importer in scanned roots**
- [`BACK_PART`](#s-BACK_PART) · const — **no importer in scanned roots**
- [`KIT_PART`](#s-KIT_PART) · const — **no importer in scanned roots**
- [`MICRO_SWAP`](#s-MICRO_SWAP) · const — **no importer in scanned roots**
- [`isMicro`](#s-isMicro) · function — **no importer in scanned roots**
- [`robotParts`](#s-robotParts) · function — **no importer in scanned roots**
- [`robotBom`](#s-robotBom) · function — used by [js/robotgen/spec.js](../spec.js.md)
- [`partCost`](#s-partCost) · function — **no importer in scanned roots**
- [`describeBom`](#s-describeBom) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-partBom"></a>`partBom(part)`

function · **exported** · L6–6

<!-- note:partBom -->
<!-- /note -->

### <a id="s-bomMass"></a>`bomMass(bom)`

function · **exported** · L7–11

<!-- note:bomMass -->
<!-- /note -->

### <a id="s-expandBom"></a>`expandBom(bom, out=, mult=)`

function · **exported** · L13–27

- calls: [`expandBom`](#s-expandBom)
- called by: [`expandBom`](#s-expandBom) · [`partCost`](#s-partCost) · [`robotBom`](#s-robotBom)

<!-- note:expandBom -->
recursive roll-up to raw stock; fastener kits also report piece counts
<!-- /note -->

### <a id="s-HAND_PART"></a>`HAND_PART`

const · **exported** · L29–29

<!-- note:HAND_PART -->
---------- spec → parts ----------------------------------------------------
<!-- /note -->

### <a id="s-LIMB_PART"></a>`LIMB_PART`

const · **exported** · L30–31

<!-- note:LIMB_PART -->
<!-- /note -->

### <a id="s-MOUNT_PART"></a>`MOUNT_PART`

const · **exported** · L32–40

<!-- note:MOUNT_PART -->
<!-- /note -->

### <a id="s-BACK_PART"></a>`BACK_PART`

const · **exported** · L41–47

<!-- note:BACK_PART -->
<!-- /note -->

### <a id="s-KIT_PART"></a>`KIT_PART`

const · **exported** · L48–64

<!-- note:KIT_PART -->
<!-- /note -->

### <a id="s-MICRO_SWAP"></a>`MICRO_SWAP`

const · **exported** · L66–105

<!-- note:MICRO_SWAP -->
A 0.5 m inspection flyer is not a small starship: below a metre the yard
   builds from the micro tier, so the manifest weighs what the airframe weighs.
<!-- /note -->

### <a id="s-isMicro"></a>`isMicro(spec)`

function · **exported** · L106–108

- called by: [`robotParts`](#s-robotParts)

<!-- note:isMicro -->
The micro tier is for airframes that fit in a backpack and for the smallest
   ground units. A metre-tall tracked frame is small, not micro — it still wants
   real wheels, real armour and a real battery.
<!-- /note -->

### <a id="s-OPTIONAL"></a>`OPTIONAL`

const · L110–110

<!-- note:OPTIONAL -->
<!-- /note -->

### <a id="s-robotParts"></a>`robotParts(spec)`

function · **exported** · L112–254

- calls: [`isMicro`](#s-isMicro) · [`robotParts>add`](#s-robotParts-add) ×74
- called by: [`robotBom`](#s-robotBom)

<!-- note:robotParts -->
- L116 · `const microCap = spec.flying ? 6 : 12;` — kg of optional kit a micro unit will carry
- L127 · `const mass = spec.stats.frameEstimateKg || spec.stats.massKg;` — sizing runs off the FRAME estimate, never off the mass the manifest itself
  produced — otherwise re-quoting a unit would keep changing what it is made of
- L130 · `add(mass > 400 ? 'r.fr.spine_heavy' : mass > 90 ? 'r.fr.spine_std' : 'r.fr.spine_light', 1` — frame
- L140 · `if (L.legs) {` — drive
- L174 · `if (spec.arms.count > 0) {` — arms
- L190 · `const O = spec.head.optics;` — head + sensors
- L200 · `add('r.cd.cpu_core', 1, 'controller');` — compute + comms
- L206 · `const panels = (A.armor || []).length;` — armour
- L212 · `for (const side of ['L', 'R']) {` — shoulder mounts + weapon mods
- L228 · `if (A.back && A.back !== 'none' && BACK_PART[A.back]) add(BACK_PART[A.back], 1, 'back unit` — back unit + career kit
- L232 · `let draw = 0;` — power — sized off the draw the manifest already committed to, not guessed:
       enough pack for a useful shift, capped so a scout does not fly a brick
- L237 · `const hours = flying ? 0.42 : 2.2;` — the shift the yard sizes for
- L242 · `if (spec.kit && spec.kit.includes('solar')) {` — handled by kit
- L244 · `add(draw < -2500 ? 'r.th.liquid_loop' : 'r.th.fan_loop', 1, 'cooling');` — thermal sized off the draw
- L248 · `if (A.hazardLights) add('r.sv.beacon', 1, 'hazard beacons');` — service + identity
<!-- /note -->

#### <a id="s-robotParts-add"></a>`robotParts>add(rawId, count=, why=)`

function · L117–125

- called by: [`robotParts`](#s-robotParts) ×74

<!-- note:robotParts>add -->
- L121 · `if (micro && part && OPTIONAL.has(part.domain) && part.mass > microCap) return;` — a sub-metre airframe cannot be handed a shield generator or a pallet fork
  just because its career rolled one: optional kit heavier than a chunk of
  the whole unit is left off the manifest rather than bolted on
<!-- /note -->

### <a id="s-robotBom"></a>`robotBom(spec)`

function · **exported** · L256–298

- calls: [`expandBom`](#s-expandBom) · [`partCost`](#s-partCost) · [`robotParts`](#s-robotParts)
- called by: [`describeBom`](#s-describeBom) · [`applyPartsMass`](../spec.js.md#s-applyPartsMass) _js/robotgen/spec.js_

<!-- note:robotBom -->
---------- roll-up ----------------------------------------------------------
<!-- /note -->

### <a id="s-partCost"></a>`partCost(part)`

function · **exported** · L300–306

- calls: [`expandBom`](#s-expandBom) · [`materialCost`](catalog.js.md#s-materialCost) _js/robotgen/data/catalog.js_
- called by: [`robotBom`](#s-robotBom)

<!-- note:partCost -->
<!-- /note -->

### <a id="s-describeBom"></a>`describeBom(spec, bom=)`

function · **exported** · L308–326

- calls: [`robotBom`](#s-robotBom)

<!-- note:describeBom -->
readable manifest, the same shape describe() gives for the spec sheet
<!-- /note -->
