# js/drones/dronespec.js

[index](../../../README.md) · 62 lines · 10 symbols · 2 imports · 5 importers

## About

<!-- note:@file -->
LIVING GALAXY — drone designs as data.

The THREE-free half of the drone forge (droneforge.js): which career and
chassis each kind of remote drone is, which livery pool a port's sector
draws from, and the yard tag for a design — robotgen's spec and its parts
manifest (mass, part count, cost, endurance). The station deck and the
tests read this without touching a renderer.

- L9 · `for (const r of Object.values(DRONE_ROLES)) DRONE_KINDS[r.id] = { ...r.robot, label: r.lab` — your work drones (drones/roles.js): one kind per role, same machinery
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../robotgen/spec.js` | `generateRobot` | [js/robotgen/spec.js](../robotgen/spec.js.md) |
| 2 | `./roles.js` | `DRONE_ROLES` | [js/drones/roles.js](roles.js.md) |

## Imported by

- [js/drones/droneforge.js](droneforge.js.md) — `DRONE_KINDS`, `droneSpec`
- [js/drones/droneforge.js](droneforge.js.md) — `DRONE_KINDS`, `droneSpec`, `droneSummary`
- [js/drones/ops.js](ops.js.md) — `droneSummary`
- [js/station/deckworks.js](../station/deckworks.js.md) — `droneSummary`
- test/drones.test.mjs _(outside js/)_ — `DRONE_KINDS`, `droneSpec`, `droneSummary`

## Exports

- [`DRONE_KINDS`](#s-DRONE_KINDS) · const — used by [js/drones/droneforge.js](droneforge.js.md), test/drones.test.mjs
- [`droneSpec`](#s-droneSpec) · function — used by [js/drones/droneforge.js](droneforge.js.md), test/drones.test.mjs
- [`droneSummary`](#s-droneSummary) · function — used by [js/drones/droneforge.js](droneforge.js.md), [js/drones/ops.js](ops.js.md), [js/station/deckworks.js](../station/deckworks.js.md), test/drones.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-DRONE_KINDS"></a>`DRONE_KINDS`

const · **exported** · L4–8

<!-- note:DRONE_KINDS -->
<!-- /note -->

### <a id="s-SECTOR_PALETTES"></a>`SECTOR_PALETTES`

const · L11–18

<!-- note:SECTOR_PALETTES -->
A port's livery follows its sector; the holds fly dark.
<!-- /note -->

### <a id="s-PROBE_PALETTES"></a>`PROBE_PALETTES`

const · L19–19

<!-- note:PROBE_PALETTES -->
<!-- /note -->

### <a id="s-WORK_PALETTES"></a>`WORK_PALETTES`

const · L20–20

<!-- note:WORK_PALETTES -->
your own work drones fly the yard colours unless the port that built them has a sector livery
<!-- /note -->

### <a id="s-hash"></a>`hash(s)`

function · L22–26

- called by: [`droneSpec`](#s-droneSpec)

<!-- note:hash -->
<!-- /note -->

### <a id="s-droneSpec"></a>`droneSpec(kind, seed, sector=)`

function · **exported** · L28–33

- calls: [`hash`](#s-hash) · [`generateRobot`](../robotgen/spec.js.md#s-generateRobot) _js/robotgen/spec.js_
- called by: [`forgeDrone`](droneforge.js.md#s-forgeDrone) _js/drones/droneforge.js_ · [`buildSummary`](#s-buildSummary)

<!-- note:droneSpec -->
The spec (pure data) for a drone design. `sector` picks the livery pool.
<!-- /note -->

### <a id="s-SUMMARY_CACHE"></a>`SUMMARY_CACHE`

const · L35–35

<!-- note:SUMMARY_CACHE -->
the tag is deterministic in (kind, seed, sector), and the generator is not cheap: remember the last few hundred
<!-- /note -->

### <a id="s-SUMMARY_CACHE_MAX"></a>`SUMMARY_CACHE_MAX`

const · L36–36

<!-- note:SUMMARY_CACHE_MAX -->
<!-- /note -->

### <a id="s-droneSummary"></a>`droneSummary(kind, seed, sector=)`

function · **exported** · L38–46

- calls: [`buildSummary`](#s-buildSummary)
- called by: [`buildOptions`](ops.js.md#s-buildOptions) _js/drones/ops.js_ · [`priceOf`](ops.js.md#s-priceOf) _js/drones/ops.js_ · [`rollOff`](ops.js.md#s-rollOff) _js/drones/ops.js_ · [`worksPanel`](../station/deckworks.js.md#s-worksPanel) _js/station/deckworks.js_ ×2

<!-- note:droneSummary -->
What the yard would print on the tag: designation, career, mass, parts, cost.
<!-- /note -->

### <a id="s-buildSummary"></a>`buildSummary(kind, seed, sector)`

function · L48–62

- calls: [`droneSpec`](#s-droneSpec)
- called by: [`droneSummary`](#s-droneSummary)

<!-- note:buildSummary -->
<!-- /note -->
