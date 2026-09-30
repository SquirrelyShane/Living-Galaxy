# js/shipgen/data/catalog/_part.js

[index](../../../../../README.md) · 4 lines · 2 symbols · 0 imports · 21 importers

## About

<!-- note:@file -->
Part record factory shared by every catalog domain file.

 id      unique, "&lt;domain>.&lt;name>"            mass   tonnes
 prefab  key into src/prefabs (null = drive   pwr    kW  (+ generates, − draws)
         selector or hull-level info entry)   heat   kW  (+ produces, − rejects)
 tags    doctrine filters + mount bias        size   footprint multiplier
 faces   override the prefab's face list      mirror paired port/starboard twin
 drive   selects a DRIVE_TYPES family         info   hull-level concept, not mountable
<!-- /note -->

## Imports

_none_

## Imported by

- [js/shipgen/data/catalog/00-identity.js](00-identity.js.md) — `P`
- [js/shipgen/data/catalog/01-propulsion.js](01-propulsion.js.md) — `P`, `INT`
- [js/shipgen/data/catalog/02-fluids.js](02-fluids.js.md) — `P`, `INT`
- [js/shipgen/data/catalog/03-power.js](03-power.js.md) — `P`
- [js/shipgen/data/catalog/04-epds.js](04-epds.js.md) — `P`, `INT`
- [js/shipgen/data/catalog/05-structure.js](05-structure.js.md) — `P`, `INT`
- [js/shipgen/data/catalog/06-materials.js](06-materials.js.md) — `P`
- [js/shipgen/data/catalog/07-thermal.js](07-thermal.js.md) — `P`, `INT`
- [js/shipgen/data/catalog/08-computing.js](08-computing.js.md) — `P`, `INT`
- [js/shipgen/data/catalog/09-gnc.js](09-gnc.js.md) — `P`, `INT`
- [js/shipgen/data/catalog/10-comms.js](10-comms.js.md) — `P`, `INT`
- [js/shipgen/data/catalog/11-sensors.js](11-sensors.js.md) — `P`, `INT`
- [js/shipgen/data/catalog/12-atmosphere.js](12-atmosphere.js.md) — `P`, `INT`
- [js/shipgen/data/catalog/13-water-waste-food.js](13-water-waste-food.js.md) — `P`, `INT`
- [js/shipgen/data/catalog/14-habitation.js](14-habitation.js.md) — `P`, `INT`
- [js/shipgen/data/catalog/15-eva-docking.js](15-eva-docking.js.md) — `P`
- [js/shipgen/data/catalog/16-robotics.js](16-robotics.js.md) — `P`, `INT`
- [js/shipgen/data/catalog/17-cargo.js](17-cargo.js.md) — `P`, `INT`
- [js/shipgen/data/catalog/18-safety-defense.js](18-safety-defense.js.md) — `P`, `INT`
- [js/shipgen/data/catalog/19-manufacturing.js](19-manufacturing.js.md) — `P`
- [js/shipgen/data/catalog/20-standards.js](20-standards.js.md) — `P`, `INT`

## Exports

- [`P`](#s-P) · function — used by [js/shipgen/data/catalog/00-identity.js](00-identity.js.md), [js/shipgen/data/catalog/01-propulsion.js](01-propulsion.js.md), [js/shipgen/data/catalog/02-fluids.js](02-fluids.js.md), [js/shipgen/data/catalog/03-power.js](03-power.js.md), [js/shipgen/data/catalog/04-epds.js](04-epds.js.md), [js/shipgen/data/catalog/05-structure.js](05-structure.js.md), [js/shipgen/data/catalog/06-materials.js](06-materials.js.md), [js/shipgen/data/catalog/07-thermal.js](07-thermal.js.md), [js/shipgen/data/catalog/08-computing.js](08-computing.js.md), [js/shipgen/data/catalog/09-gnc.js](09-gnc.js.md), [js/shipgen/data/catalog/10-comms.js](10-comms.js.md), [js/shipgen/data/catalog/11-sensors.js](11-sensors.js.md), [js/shipgen/data/catalog/12-atmosphere.js](12-atmosphere.js.md), [js/shipgen/data/catalog/13-water-waste-food.js](13-water-waste-food.js.md), [js/shipgen/data/catalog/14-habitation.js](14-habitation.js.md), [js/shipgen/data/catalog/15-eva-docking.js](15-eva-docking.js.md), [js/shipgen/data/catalog/16-robotics.js](16-robotics.js.md), [js/shipgen/data/catalog/17-cargo.js](17-cargo.js.md), [js/shipgen/data/catalog/18-safety-defense.js](18-safety-defense.js.md), [js/shipgen/data/catalog/19-manufacturing.js](19-manufacturing.js.md), [js/shipgen/data/catalog/20-standards.js](20-standards.js.md)
- [`INT`](#s-INT) · const — used by [js/shipgen/data/catalog/01-propulsion.js](01-propulsion.js.md), [js/shipgen/data/catalog/02-fluids.js](02-fluids.js.md), [js/shipgen/data/catalog/04-epds.js](04-epds.js.md), [js/shipgen/data/catalog/05-structure.js](05-structure.js.md), [js/shipgen/data/catalog/07-thermal.js](07-thermal.js.md), [js/shipgen/data/catalog/08-computing.js](08-computing.js.md), [js/shipgen/data/catalog/09-gnc.js](09-gnc.js.md), [js/shipgen/data/catalog/10-comms.js](10-comms.js.md), [js/shipgen/data/catalog/11-sensors.js](11-sensors.js.md), [js/shipgen/data/catalog/12-atmosphere.js](12-atmosphere.js.md), [js/shipgen/data/catalog/13-water-waste-food.js](13-water-waste-food.js.md), [js/shipgen/data/catalog/14-habitation.js](14-habitation.js.md), [js/shipgen/data/catalog/16-robotics.js](16-robotics.js.md), [js/shipgen/data/catalog/17-cargo.js](17-cargo.js.md), [js/shipgen/data/catalog/18-safety-defense.js](18-safety-defense.js.md), [js/shipgen/data/catalog/20-standards.js](20-standards.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-P"></a>`P(id, name, prefab, o=)`

function · **exported** · L1–3

- called by: [`@file`](00-identity.js.md#) _js/shipgen/data/catalog/00-identity.js_ ×16 · [`@file`](01-propulsion.js.md#) _js/shipgen/data/catalog/01-propulsion.js_ ×38 · [`@file`](02-fluids.js.md#) _js/shipgen/data/catalog/02-fluids.js_ ×18 · [`@file`](03-power.js.md#) _js/shipgen/data/catalog/03-power.js_ ×21 · [`@file`](04-epds.js.md#) _js/shipgen/data/catalog/04-epds.js_ ×16 · [`@file`](05-structure.js.md#) _js/shipgen/data/catalog/05-structure.js_ ×16 · [`@file`](06-materials.js.md#) _js/shipgen/data/catalog/06-materials.js_ ×15 · [`@file`](07-thermal.js.md#) _js/shipgen/data/catalog/07-thermal.js_ ×13 · [`@file`](08-computing.js.md#) _js/shipgen/data/catalog/08-computing.js_ ×14 · [`@file`](09-gnc.js.md#) _js/shipgen/data/catalog/09-gnc.js_ ×12 · [`@file`](10-comms.js.md#) _js/shipgen/data/catalog/10-comms.js_ ×14 · [`@file`](11-sensors.js.md#) _js/shipgen/data/catalog/11-sensors.js_ ×13 · [`@file`](12-atmosphere.js.md#) _js/shipgen/data/catalog/12-atmosphere.js_ ×13 · [`@file`](13-water-waste-food.js.md#) _js/shipgen/data/catalog/13-water-waste-food.js_ ×12 · [`@file`](14-habitation.js.md#) _js/shipgen/data/catalog/14-habitation.js_ ×14 · [`@file`](15-eva-docking.js.md#) _js/shipgen/data/catalog/15-eva-docking.js_ ×12 · [`@file`](16-robotics.js.md#) _js/shipgen/data/catalog/16-robotics.js_ ×11 · [`@file`](17-cargo.js.md#) _js/shipgen/data/catalog/17-cargo.js_ ×19 · [`@file`](18-safety-defense.js.md#) _js/shipgen/data/catalog/18-safety-defense.js_ ×43 · [`@file`](19-manufacturing.js.md#) _js/shipgen/data/catalog/19-manufacturing.js_ ×16 · [`@file`](20-standards.js.md#) _js/shipgen/data/catalog/20-standards.js_ ×10

<!-- note:P -->
<!-- /note -->

### <a id="s-INT"></a>`INT`

const · **exported** · L4–4

<!-- note:INT -->
<!-- /note -->
