# js/stationgen/generate.js

[index](../../../README.md) · 86 lines · 6 symbols · 12 imports · 1 importers

## About

<!-- note:@file -->
generate.js — one-call entry point.

  import { buildStation } from ".../src/generate.js";
  const st = buildStation({ seed: "PORT-7", archetype: "tradehub", tier: "II" });
  scene.add(st.root);
  // per frame: tick(st.anim, dt, t)

Returns { root, builder, cfg, anim, stats } — stats carries the manifest,
the parts list by domain, the bill of materials, population, crew, power
and heat balance, cost, and what the placement solver could not fit.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `./builder/StationBuilder.js` | `StationBuilder` | [js/stationgen/builder/StationBuilder.js](builder/StationBuilder.js.md) |
| 3 | `./data/archetypes.js` | `ARCHETYPES`, `ARCHETYPE_KEYS` | [js/stationgen/data/archetypes.js](data/archetypes.js.md) |
| 4 | `./data/tiers.js` | `TIERS`, `TIER_KEYS` | [js/stationgen/data/tiers.js](data/tiers.js.md) |
| 5 | `./builder/hull.js` | `STYLES` | [js/stationgen/builder/hull.js](builder/hull.js.md) |
| 6 | `./data/bom.js` | `stationBom` | [js/stationgen/data/bom.js](data/bom.js.md) |
| 7 | `./anim.js` | `newRegistry`, `collectInto`, `disposeAnim`, `bake` | [js/stationgen/anim.js](anim.js.md) |
| 8 | `./core/geometry.js` | `disposeOwned` | [js/stationgen/core/geometry.js](core/geometry.js.md) |
| 9 | `./core/rng.js` | `RNG` | [js/stationgen/core/rng.js](core/rng.js.md) |
| 10 | `./builder/hangar.js` | `HANGAR` | [js/stationgen/builder/hangar.js](builder/hangar.js.md) |
| 11 | `./data/styles.js` | `STYLES_ARCH`, `STYLE_KEYS` | [js/stationgen/data/styles.js](data/styles.js.md) |
| 12 | `./data/materials.js` | `ALLOYS` | [js/stationgen/data/materials.js](data/materials.js.md) |

## Imported by

- [js/stationgen/index.js](index.js.md) — `buildStation`, `releaseStation`, `randomConfig`, `normalizeConfig`, `stationBounds`, `DEFAULT_CFG`

## Exports

- [`DEFAULT_CFG`](#s-DEFAULT_CFG) · const — used by [js/stationgen/index.js](index.js.md)
- [`normalizeConfig`](#s-normalizeConfig) · function — used by [js/stationgen/index.js](index.js.md)
- [`buildStation`](#s-buildStation) · function — used by [js/stationgen/index.js](index.js.md)
- [`releaseStation`](#s-releaseStation) · function — used by [js/stationgen/index.js](index.js.md)
- [`randomConfig`](#s-randomConfig) · function — used by [js/stationgen/index.js](index.js.md)
- [`stationBounds`](#s-stationBounds) · function — used by [js/stationgen/index.js](index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-DEFAULT_CFG"></a>`DEFAULT_CFG`

const · **exported** · L14–32

<!-- note:DEFAULT_CFG -->
- L16 · `archetype: "tradehub",` — ARCHETYPES key
- L17 · `tier: null,` — TIERS key; null = the archetype's default
- L18 · `hull: null,` — STYLES key; null = the archetype's own grammar; "auto" = one the style favours
- L19 · `style: null,` — STYLES_ARCH key (cathedral | bastion | civic | industrial | frontier | research | agrarian); null = the archetype's
- L20 · `alloy: null,` — ALLOYS key the hull is skinned in; null = one the style favours
- L21 · `shieldShell: true,` — draw the faint shield shell when emitters are fitted
- L22 · `hangars: null,` — hangar mouths; null = archetype default
- L23 · `scale: 1,` — spine length multiplier
- L24 · `girth: 1,` — spine radius multiplier
- L25 · `complexity: 0.6,` — greeble density 0–1
- L26 · `finish: null,` — brushed | matte | chrome | ceramic | weathered
- L27 · `palette: null,` — { hull, dark, accent, glow } overrides
- L28 · `sun: [1, 0.35, 0.2],` — where the light comes from: solar faces it, radiators go edge-on, reactors hide
- L29 · `merge: true,` — bake statics per material
- L30 · `center: true,` — centre the group on its bounding box
- L31 · `manifest: null,` — explicit { moduleId: count } to skip the doctrine
<!-- /note -->

### <a id="s-normalizeConfig"></a>`normalizeConfig(opts=)`

function · **exported** · L34–44

- called by: [`buildStation`](#s-buildStation)

<!-- note:normalizeConfig -->
<!-- /note -->

### <a id="s-buildStation"></a>`buildStation(opts=)`

function · **exported** · L46–67

- calls: [`bake`](anim.js.md#s-bake) _js/stationgen/anim.js_ · [`collectInto`](anim.js.md#s-collectInto) _js/stationgen/anim.js_ · [`newRegistry`](anim.js.md#s-newRegistry) _js/stationgen/anim.js_ · [`new StationBuilder`](builder/StationBuilder.js.md#s-StationBuilder) _js/stationgen/builder/StationBuilder.js_ · [`stationBom`](data/bom.js.md#s-stationBom) _js/stationgen/data/bom.js_ · [`normalizeConfig`](#s-normalizeConfig)
- called by: [`ensureBuilt`](../station/stationyard.js.md#s-ensureBuilt) _js/station/stationyard.js_

<!-- note:buildStation -->
- L50 · `const anim = bake(collectInto(newRegistry(), root));` — A station that has never been close enough to animate used to render with
  every lamp pinned at full brightness and every chase bead at raw white,
  because nothing had written their instance colours yet. Bake the resting
  state in at build time so a port is dark until something lights it.
<!-- /note -->

### <a id="s-releaseStation"></a>`releaseStation(st)`

function · **exported** · L69–72

- calls: [`disposeAnim`](anim.js.md#s-disposeAnim) _js/stationgen/anim.js_ · [`disposeOwned`](core/geometry.js.md#s-disposeOwned) _js/stationgen/core/geometry.js_
- called by: [`dropCarried`](../station/stationyard.js.md#s-dropCarried) _js/station/stationyard.js_ · [`releaseBuilt`](../station/stationyard.js.md#s-releaseBuilt) _js/station/stationyard.js_

<!-- note:releaseStation -->
<!-- /note -->

### <a id="s-randomConfig"></a>`randomConfig(seed=, overrides=)`

function · **exported** · L74–80

- calls: [`new RNG`](core/rng.js.md#s-RNG) _js/stationgen/core/rng.js_

<!-- note:randomConfig -->
A plausible random station.
<!-- /note -->

### <a id="s-stationBounds"></a>`stationBounds(root)`

function · **exported** · L82–86

<!-- note:stationBounds -->
<!-- /note -->
