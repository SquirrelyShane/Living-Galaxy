# js/stationgen/builder/StationBuilder.js

[index](../../../../README.md) · 258 lines · 20 symbols · 13 imports · 2 importers

## About

<!-- note:@file -->
StationBuilder — the pipeline.

  1. resolve the manifest (archetype doctrine × population tier), the
     architecture style and the hull alloy
  2. grow the hull grammar: spine / nave / core / arms / booms → slots + occupancy
     (spines only *plan* themselves here; they draw after placement)
  3. place every module on the best slot its zone, sun and neighbours allow —
     hangars are planned per slot: bay, blister, cut into the spine, bored into an end
  4. draw each placed module with its prefab in the slot's frame, from the
     shape grammar the style speaks
  5. draw the spines round the notches and trims the hangars left, then
     details: instanced greebles, running lamps, antennae, the shield shell
  6. bake statics per material, collect the animation registry, report

Everything reads off one seeded RNG, so a (seed, config) is one station.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `../core/rng.js` | `RNG` | [js/stationgen/core/rng.js](../core/rng.js.md) |
| 3 | `../core/geometry.js` | `G`, `makeMat`, `addMesh`, `instanced`, `mergeStatic`, `FINISHES` | [js/stationgen/core/geometry.js](../core/geometry.js.md) |
| 4 | `../data/archetypes.js` | `ARCHETYPES` | [js/stationgen/data/archetypes.js](../data/archetypes.js.md) |
| 5 | `../data/tiers.js` | `TIERS` | [js/stationgen/data/tiers.js](../data/tiers.js.md) |
| 6 | `../data/styles.js` | `STYLES_ARCH`, `roll` | [js/stationgen/data/styles.js](../data/styles.js.md) |
| 7 | `../data/materials.js` | `ALLOYS` | [js/stationgen/data/materials.js](../data/materials.js.md) |
| 8 | `../data/doctrine.js` | `doctrineFor`, `manifestOf` | [js/stationgen/data/doctrine.js](../data/doctrine.js.md) |
| 9 | `./hull.js` | `STYLES`, `habitatDrum` | [js/stationgen/builder/hull.js](hull.js.md) |
| 10 | `./placement.js` | `place` | [js/stationgen/builder/placement.js](placement.js.md) |
| 11 | `../prefabs/modules.js` | `PREFABS` | [js/stationgen/prefabs/modules.js](../prefabs/modules.js.md) |
| 12 | `./hangar.js` | `hangar` | [js/stationgen/builder/hangar.js](hangar.js.md) |
| 13 | `./frames.js` | `frameMatrix` | [js/stationgen/builder/frames.js](frames.js.md) |

## Imported by

- [js/stationgen/generate.js](../generate.js.md) — `StationBuilder`
- [js/stationgen/index.js](../index.js.md) — `StationBuilder`

## Exports

- [`StationBuilder`](#s-StationBuilder) · class — used by [js/stationgen/generate.js](../generate.js.md), [js/stationgen/index.js](../index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-StationBuilder"></a>`StationBuilder`

class · **exported** · L15–258

- called by: [`buildStation`](../generate.js.md#s-buildStation) _js/stationgen/generate.js_

<!-- note:StationBuilder -->
<!-- /note -->

#### <a id="s-StationBuilder-build"></a>`StationBuilder.build(cfg)`

method · L16–88

- calls: [`habitatDrum`](hull.js.md#s-habitatDrum) _js/stationgen/builder/hull.js_ · [`place`](placement.js.md#s-place) _js/stationgen/builder/placement.js_ ×2 · [`mergeStatic`](../core/geometry.js.md#s-mergeStatic) _js/stationgen/core/geometry.js_ · [`new RNG`](../core/rng.js.md#s-RNG) _js/stationgen/core/rng.js_ · [`doctrineFor`](../data/doctrine.js.md#s-doctrineFor) _js/stationgen/data/doctrine.js_ · [`manifestOf`](../data/doctrine.js.md#s-manifestOf) _js/stationgen/data/doctrine.js_ · [`roll`](../data/styles.js.md#s-roll) _js/stationgen/data/styles.js_ ×2
- via [js/stationgen/builder/hull.js](hull.js.md): `STYLES[…]`

<!-- note:StationBuilder.build -->
- L35 · `const T = this.tier;` — scale: the tier sets the spine; the archetype and the seed nudge it
- L46 · `this.doctrine = cfg.manifest ? { ...cfg.manifest } : doctrineFor(cfg.archetype, cfg.tier,` — 1. manifest
- L50 · `if (needs.drum && this.style !== "drum") this.L *= 1.45;` — 2. hull — a drum swallows a third of any spine, so a Tier III hull grows to carry it
- L58 · `this.modulesRoot = new THREE.Group(); this.modulesRoot.name = "modules"; root.add(this.mod` — 3 + 4. place and draw
- L63 · `if (mod.id === "hb.quarters_3") { this.placed.push({ module: mod, structural: true, pos: n` — the drum is the hull
- L75 · `for (const fn of this.deferred) fn();` — 5. the structure that waited for the hangars, then details
- L82 · `this.folded = cfg.merge === false ? 0 : mergeStatic(root);` — 6. bake
<!-- /note -->

#### <a id="s-StationBuilder-count"></a>`StationBuilder.count(n=)`

method · L90–90

<!-- note:StationBuilder.count -->
<!-- /note -->

#### <a id="s-StationBuilder-materials"></a>`StationBuilder.materials(cfg)`

method · L92–123

- calls: [`StationBuilder.materials>skin`](#s-StationBuilder-materials-skin) ×4 · [`makeMat`](../core/geometry.js.md#s-makeMat) _js/stationgen/core/geometry.js_ ×18

<!-- note:StationBuilder.materials -->
- L96 · `const hullCol = new THREE.Color(pal.hull).lerp(new THREE.Color(alloy.tint), 0.55);` — the hull is the livery tinted by the metal it is skinned in
- L118 · `bead: new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),` — unlit: the instance colour is the light
<!-- /note -->

##### <a id="s-StationBuilder-materials-skin"></a>`StationBuilder.materials>skin(c, o=)`

function · L97–97

- calls: [`makeMat`](../core/geometry.js.md#s-makeMat) _js/stationgen/core/geometry.js_
- called by: [`StationBuilder.materials`](#s-StationBuilder-materials) ×4

<!-- note:StationBuilder.materials>skin -->
<!-- /note -->

#### <a id="s-StationBuilder-draw"></a>`StationBuilder.draw(p, ix=)`

method · L125–146

- calls: [`frameMatrix`](frames.js.md#s-frameMatrix) _js/stationgen/builder/frames.js_

<!-- note:StationBuilder.draw -->
one module, drawn by its prefab in the slot frame and parented to the ring if it lives on one
<!-- /note -->

#### <a id="s-StationBuilder-reserveHangar"></a>`StationBuilder.reserveHangar(p)`

method · L148–159

<!-- note:StationBuilder.reserveHangar -->
a recessed hangar notches its spine; a throat trims the end it bores into
<!-- /note -->

#### <a id="s-StationBuilder-ctx"></a>`StationBuilder.ctx(p, ix)`

method · L161–173

<!-- note:StationBuilder.ctx -->
<!-- /note -->

##### <a id="s-StationBuilder-ctx-parent"></a>`StationBuilder.ctx>parent()`

function · L163–163

- called by: [`StationBuilder.ctx.add`](#s-StationBuilder-ctx-add) · [`StationBuilder.ctx.child`](#s-StationBuilder-ctx-child) · [`StationBuilder.ctx.lamp`](#s-StationBuilder-ctx-lamp)

<!-- note:StationBuilder.ctx>parent -->
<!-- /note -->

##### <a id="s-StationBuilder-ctx-add"></a>`StationBuilder.ctx.add(geo, mat, x, y, z, rx, ry, rz, sx, sy, sz)`

prop · L166–166

- calls: [`StationBuilder.ctx>parent`](#s-StationBuilder-ctx-parent) · [`addMesh`](../core/geometry.js.md#s-addMesh) _js/stationgen/core/geometry.js_

<!-- note:StationBuilder.ctx.add -->
<!-- /note -->

##### <a id="s-StationBuilder-ctx-addTo"></a>`StationBuilder.ctx.addTo(par, geo, mat, x, y, z, rx, ry, rz, sx, sy, sz)`

prop · L167–167

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/stationgen/core/geometry.js_

<!-- note:StationBuilder.ctx.addTo -->
<!-- /note -->

##### <a id="s-StationBuilder-ctx-child"></a>`StationBuilder.ctx.child(name=)`

prop · L168–168

- calls: [`StationBuilder.ctx>parent`](#s-StationBuilder-ctx-parent)

<!-- note:StationBuilder.ctx.child -->
<!-- /note -->

##### <a id="s-StationBuilder-ctx-count"></a>`StationBuilder.ctx.count(n=)`

prop · L169–169

<!-- note:StationBuilder.ctx.count -->
<!-- /note -->

##### <a id="s-StationBuilder-ctx-lamp"></a>`StationBuilder.ctx.lamp(x, y, z, color=, mode=, base=)`

prop · L170–170

- calls: [`StationBuilder.ctx>parent`](#s-StationBuilder-ctx-parent)

<!-- note:StationBuilder.ctx.lamp -->
<!-- /note -->

##### <a id="s-StationBuilder-ctx-lampOn"></a>`StationBuilder.ctx.lampOn(par, x, y, z, color=, mode=, base=)`

prop · L171–171

<!-- note:StationBuilder.ctx.lampOn -->
<!-- /note -->

#### <a id="s-StationBuilder-lamp"></a>`StationBuilder.lamp(parent, x, y, z, color, mode, base)`

method · L175–180

<!-- note:StationBuilder.lamp -->
lamps are recorded now and baked into one instanced batch per spinning group at the end: a
Tier III city has hundreds of them, and one draw call each was most of the station's cost
<!-- /note -->

#### <a id="s-StationBuilder-bakeLamps"></a>`StationBuilder.bakeLamps(root)`

method · L182–202

- calls: [`instanced`](../core/geometry.js.md#s-instanced) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.sphere`

<!-- note:StationBuilder.bakeLamps -->
- L184 · `const batches = new Map();` — spinning ancestor (or root) → items
- L189 · `if (!sp.parent.parent && sp.parent !== root) continue;` — orphaned group: skip
<!-- /note -->

#### <a id="s-StationBuilder-greebles"></a>`StationBuilder.greebles(root)`

method · L204–227

- calls: [`frameMatrix`](frames.js.md#s-frameMatrix) _js/stationgen/builder/frames.js_ · [`instanced`](../core/geometry.js.md#s-instanced) _js/stationgen/core/geometry.js_ ×2
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:StationBuilder.greebles -->
instanced greebles over the hull skin: vents, hatches, pipe stubs, plates — coarse or fine by style
<!-- /note -->

#### <a id="s-StationBuilder-runningLights"></a>`StationBuilder.runningLights(root)`

method · L229–238

<!-- note:StationBuilder.runningLights -->
running lights: red port, green starboard, white on the extremities
<!-- /note -->

#### <a id="s-StationBuilder-shieldShell"></a>`StationBuilder.shieldShell(root)`

method · L240–257

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/stationgen/core/geometry.js_ ×2 · [`makeMat`](../core/geometry.js.md#s-makeMat) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.ico`

<!-- note:StationBuilder.shieldShell -->
the shield: when emitters are fitted, a faint faceted shell breathes round the whole structure
<!-- /note -->
