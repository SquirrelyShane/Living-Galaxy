# js/asteroidgen/ores.js

[index](../../../README.md) · 57 lines · 8 symbols · 3 imports · 3 importers

## About

<!-- note:@file -->
LIVING GALAXY — the asteroid generator's mineral catalogue, answered from the game.

This is the ONE file in js/asteroidgen/ that is not the generator's own. The
drop-in shipped a forty-species catalogue (kamacite, chalcopyrite, impact
diamond…) plus, from v1.01, a second table that re-mapped its classes onto
this game's ore ids. Carrying either would be a second mineral list: a rock
that assays "chalcopyrite" and then puts "copper ore" in the hold is two
games. So every name the generator imports from here is BUILT from the lists
the game already has:

  ORES               js/economy/materials.js ORES (name, value, yield, refine)
                     + js/world/rockgen.js oreLook() (albedo, family, PBR, glow)
  ASTEROID_CLASSES   js/bodygen/classes.js CLASSES (the nine taxonomic classes,
                     weights already written in materials.js ids)

The export names and field names are the generator's, so generator.js,
debris.js and the rest import from here unchanged. Upgrading the generator is
dropping a newer tree over js/asteroidgen/ and keeping this file.

- L20 · `rarity: Math.max(0.08, Math.min(0.92, 1 - o.yield / 1.8)),` — the generator's rarity is "how hard to find", off the same yield the
  field and the assay already use
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../economy/materials.js` | `ORES` as `GAME_ORES`, `MINERALS` | [js/economy/materials.js](../economy/materials.js.md) |
| 2 | `../world/rockgen.js` | `oreLook`, `hexToRgb` as `rgb` | [js/world/rockgen.js](../world/rockgen.js.md) |
| 3 | `../bodygen/classes.js` | `CLASSES` | [js/bodygen/classes.js](../bodygen/classes.js.md) |

## Imported by

- [js/asteroidgen/debris.js](debris.js.md) — `ORES`
- [js/asteroidgen/generator.js](generator.js.md) — `ORES`, `ASTEROID_CLASSES`, `hexToRgb`
- test/asteroids.test.mjs _(outside js/)_ — `ORES`, `ASTEROID_CLASSES`

## Exports

- [`ORES`](#s-ORES) · const — used by [js/asteroidgen/debris.js](debris.js.md), [js/asteroidgen/generator.js](generator.js.md), test/asteroids.test.mjs
- [`ASTEROID_CLASSES`](#s-ASTEROID_CLASSES) · const — used by [js/asteroidgen/generator.js](generator.js.md), test/asteroids.test.mjs
- [`CLASS_ORDER`](#s-CLASS_ORDER) · const — **no importer in scanned roots**
- [`hexToRgb`](#s-hexToRgb) · const — used by [js/asteroidgen/generator.js](generator.js.md)
- [`lerpColor`](#s-lerpColor) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-MINERAL"></a>`MINERAL`

const · L5–5

- via [js/economy/materials.js](../economy/materials.js.md): `MINERALS.map`

<!-- note:MINERAL -->
<!-- /note -->

### <a id="s-ORES"></a>`ORES`

const · **exported** · L7–7

<!-- note:ORES -->
<!-- /note -->

### <a id="s-look"></a>`look`

const · L9–9

- calls: [`oreLook`](../world/rockgen.js.md#s-oreLook) _js/world/rockgen.js_

<!-- note:look -->
<!-- /note -->

### <a id="s-refined"></a>`refined`

const · L10–10

<!-- note:refined -->
<!-- /note -->

### <a id="s-ASTEROID_CLASSES"></a>`ASTEROID_CLASSES`

const · **exported** · L33–33

<!-- note:ASTEROID_CLASSES -->
<!-- /note -->

### <a id="s-CLASS_ORDER"></a>`CLASS_ORDER`

const · **exported** · L49–49

<!-- note:CLASS_ORDER -->
<!-- /note -->

### <a id="s-hexToRgb"></a>`hexToRgb`

const · **exported** · L51–51

- called by: [`generateAsteroid`](generator.js.md#s-generateAsteroid) _js/asteroidgen/generator.js_ ×4

<!-- note:hexToRgb -->
<!-- /note -->

### <a id="s-lerpColor"></a>`lerpColor(a, b, t)`

function · **exported** · L53–57

- calls: [`hexToRgb`](../world/rockgen.js.md#s-hexToRgb) _js/world/rockgen.js_ ×2

<!-- note:lerpColor -->
<!-- /note -->
