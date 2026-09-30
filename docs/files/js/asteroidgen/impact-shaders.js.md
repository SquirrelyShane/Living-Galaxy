# js/asteroidgen/impact-shaders.js

[index](../../../README.md) · 193 lines · 3 symbols · 1 imports · 3 importers

## About

<!-- note:@file -->
GLSL for the collision demo: fractured bodies (chunks driven by impact-sim.js),
GPU dust / ice / spark sprites and instanced meshed ejecta rocks. Particles are
emitted over time (blast, surface shedding, secondary impacts) with an emission
time aT0 and then move analytically: a drag-damped burst plus a slow outward drift.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./fracture.js` | `FRACTURE_GLSL` | [js/asteroidgen/fracture.js](fracture.js.md) |

## Imported by

- [js/bodygen/gl.js](../bodygen/gl.js.md) — `IMPACT_SHADERS`
- [js/render/impactfx.js](../render/impactfx.js.md) — `IMPACT_SHADERS`
- test/asteroids.test.mjs _(outside js/)_ — `IMPACT_SHADERS`

## Exports

- [`IMPACT_SHADERS`](#s-IMPACT_SHADERS) · const — used by [js/bodygen/gl.js](../bodygen/gl.js.md), [js/render/impactfx.js](../render/impactfx.js.md), test/asteroids.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-HEAT_RAMP"></a>`HEAT_RAMP`

const · L3–11

<!-- note:HEAT_RAMP -->
- L3 · `const HEAT_RAMP =` — glsl
<!-- /note -->

### <a id="s-LIGHT"></a>`LIGHT`

const · L13–17

<!-- note:LIGHT -->
- L13 · `const LIGHT =` — glsl
<!-- /note -->

### <a id="s-IMPACT_SHADERS"></a>`IMPACT_SHADERS`

const · **exported** · L19–193

<!-- note:IMPACT_SHADERS -->
- L20 · `bodyVertex:` — glsl
- L39 · `bodyFragment:` — glsl
- L63 · `spriteVertex:` — glsl
- L116 · `spriteFragment:` — glsl
- L134 · `rockVertex:` — glsl
- L175 · `rockFragment:` — glsl
<!-- /note -->
