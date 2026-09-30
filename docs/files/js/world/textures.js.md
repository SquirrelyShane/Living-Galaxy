# js/world/textures.js

[index](../../../README.md) · 507 lines · 46 symbols · 1 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — surface painting.

One painter per archetype surface. They all draw into an equirectangular
canvas that gets wrapped onto the sphere, so `v` is latitude and `u` is
longitude. Latitude is used for ice caps and banding; longitude wraps, so
noise is sampled on a cylinder to avoid a visible seam.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../../vendor/three.module.min.js` | `*` as `THREE` | **missing in js/** |

## Imported by

- [js/render/engine.js](../render/engine.js.md) — `makeGlowTexture`, `makePlanetTexture`, `makeRingTexture`, `planetPainter`

## Exports

- [`makePlanetTexture`](#s-makePlanetTexture) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`planetPainter`](#s-planetPainter) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`makeRingTexture`](#s-makeRingTexture) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`makeGlowTexture`](#s-makeGlowTexture) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`makeNameSprite`](#s-makeNameSprite) · function — **no importer in scanned roots**

## Effects

- **dom.create** — `canvas` (makePlanetTexture:354, planetPainter:392, makeRingTexture:446, makeGlowTexture:475, makeNameSprite:491)

## Symbols

### <a id="s-hash"></a>`hash(i, j, seed)`

function · L3–8

- called by: [`noise`](#s-noise) ×4

<!-- note:hash -->
Integer hash. The old sin-based one was costing seconds per system: a
512x256 surface runs tens of millions of these.
<!-- /note -->

### <a id="s-noise"></a>`noise(x, y, seed)`

function · L10–22

- calls: [`hash`](#s-hash) ×4
- called by: [`fbm`](#s-fbm) · [`ridge`](#s-ridge)

<!-- note:noise -->
<!-- /note -->

### <a id="s-stretch"></a>`stretch(v, amp)`

function · L24–26

- called by: [`fbm`](#s-fbm) · [`ridge`](#s-ridge)

<!-- note:stretch -->
Raw fbm clusters hard around 0.5, which paints everything the middle of its
palette. Stretch it so a surface actually uses the colours it was given.
<!-- /note -->

### <a id="s-OCT_BOOST"></a>`OCT_BOOST`

const · L28–28

<!-- note:OCT_BOOST -->
0.3.73: a close-up repaint adds octaves to every painter at once (see planetPainter)
<!-- /note -->

### <a id="s-fbm"></a>`fbm(x, y, seed, oct=)`

function · L30–43

- calls: [`noise`](#s-noise) · [`stretch`](#s-stretch)
- called by: [`PAINT.bands`](#s-PAINT-bands) ×3 · [`PAINT.barren`](#s-PAINT-barren) ×2 · [`PAINT.carbon`](#s-PAINT-carbon) ×2 · [`PAINT.cratered`](#s-PAINT-cratered) ×3 · [`PAINT.desert`](#s-PAINT-desert) ×2 · [`PAINT.dying`](#s-PAINT-dying) ×2 · [`PAINT.glacier`](#s-PAINT-glacier) · [`PAINT.haze`](#s-PAINT-haze) · [`PAINT.iceshell`](#s-PAINT-iceshell) · [`PAINT.jungle`](#s-PAINT-jungle) ×3 · [`PAINT.lava`](#s-PAINT-lava) · [`PAINT.methane`](#s-PAINT-methane) ×2 · [`PAINT.ocean`](#s-PAINT-ocean) ×5 · [`PAINT.rubble`](#s-PAINT-rubble) ×2 · [`PAINT.salt`](#s-PAINT-salt) ×2 · [`PAINT.star`](#s-PAINT-star) ×3 · [`PAINT.steppe`](#s-PAINT-steppe) · [`PAINT.storm`](#s-PAINT-storm) ×2 · [`PAINT.sulfur`](#s-PAINT-sulfur) ×2 · [`PAINT.sulfurmoon`](#s-PAINT-sulfurmoon) ×2 · [`PAINT.tholin`](#s-PAINT-tholin) ×2 · [`PAINT.tundra`](#s-PAINT-tundra) ×2 · [`makeRingTexture`](#s-makeRingTexture) ×2

<!-- note:fbm -->
<!-- /note -->

### <a id="s-ridge"></a>`ridge(x, y, seed, oct=)`

function · L45–58

- calls: [`noise`](#s-noise) · [`stretch`](#s-stretch)
- called by: [`PAINT.canyon`](#s-PAINT-canyon) · [`PAINT.glacier`](#s-PAINT-glacier) · [`PAINT.iceshell`](#s-PAINT-iceshell) ×2 · [`PAINT.lava`](#s-PAINT-lava) · [`PAINT.metallic`](#s-PAINT-metallic) · [`PAINT.sulfur`](#s-PAINT-sulfur)

<!-- note:ridge -->
Ridged noise — good for canyons, fractures and lava cracks.
<!-- /note -->

### <a id="s-wrapped"></a>`wrapped(u, v, scale, seed, fn=)`

function · L60–63

- called by: [`PAINT.metallic`](#s-PAINT-metallic)

<!-- note:wrapped -->
Seamless in longitude: sample the noise around a cylinder.
<!-- /note -->

### <a id="s-hexToRgb"></a>`hexToRgb(hex)`

function · L65–68

- called by: [`paletteFrom`](#s-paletteFrom)

<!-- note:hexToRgb -->
<!-- /note -->

### <a id="s-ramp"></a>`ramp(pal, t)`

function · L70–77

- called by: [`PAINT.bands`](#s-PAINT-bands) · [`PAINT.barren`](#s-PAINT-barren) · [`PAINT.canyon`](#s-PAINT-canyon) · [`PAINT.carbon`](#s-PAINT-carbon) · [`PAINT.cratered`](#s-PAINT-cratered) · [`PAINT.desert`](#s-PAINT-desert) · [`PAINT.dying`](#s-PAINT-dying) · [`PAINT.glacier`](#s-PAINT-glacier) · [`PAINT.haze`](#s-PAINT-haze) · [`PAINT.iceshell`](#s-PAINT-iceshell) · [`PAINT.jungle`](#s-PAINT-jungle) · [`PAINT.lava`](#s-PAINT-lava) · [`PAINT.metallic`](#s-PAINT-metallic) · [`PAINT.methane`](#s-PAINT-methane) · [`PAINT.ocean`](#s-PAINT-ocean) ×2 · [`PAINT.rubble`](#s-PAINT-rubble) · [`PAINT.salt`](#s-PAINT-salt) · [`PAINT.star`](#s-PAINT-star) · [`PAINT.steppe`](#s-PAINT-steppe) · [`PAINT.storm`](#s-PAINT-storm) · [`PAINT.sulfur`](#s-PAINT-sulfur) · [`PAINT.sulfurmoon`](#s-PAINT-sulfurmoon) · [`PAINT.tholin`](#s-PAINT-tholin) · [`PAINT.tundra`](#s-PAINT-tundra)

<!-- note:ramp -->
Sample a 4-stop palette at t in 0..1.
<!-- /note -->

### <a id="s-mix"></a>`mix(c, r, g, b, k)`

function · L79–83

- called by: [`PAINT.bands`](#s-PAINT-bands) ×2 · [`PAINT.barren`](#s-PAINT-barren) · [`PAINT.canyon`](#s-PAINT-canyon) · [`PAINT.carbon`](#s-PAINT-carbon) · [`PAINT.cratered`](#s-PAINT-cratered) ×3 · [`PAINT.desert`](#s-PAINT-desert) · [`PAINT.dying`](#s-PAINT-dying) ×2 · [`PAINT.glacier`](#s-PAINT-glacier) · [`PAINT.haze`](#s-PAINT-haze) · [`PAINT.iceshell`](#s-PAINT-iceshell) ×2 · [`PAINT.jungle`](#s-PAINT-jungle) ×2 · [`PAINT.lava`](#s-PAINT-lava) · [`PAINT.metallic`](#s-PAINT-metallic) · [`PAINT.methane`](#s-PAINT-methane) ×2 · [`PAINT.ocean`](#s-PAINT-ocean) ×4 · [`PAINT.rubble`](#s-PAINT-rubble) · [`PAINT.star`](#s-PAINT-star) · [`PAINT.steppe`](#s-PAINT-steppe) ×2 · [`PAINT.storm`](#s-PAINT-storm) · [`PAINT.sulfur`](#s-PAINT-sulfur) · [`PAINT.sulfurmoon`](#s-PAINT-sulfurmoon) ×2 · [`PAINT.tholin`](#s-PAINT-tholin) ×2 · [`PAINT.tundra`](#s-PAINT-tundra) ×2

<!-- note:mix -->
<!-- /note -->

### <a id="s-PAINT"></a>`PAINT`

const · L85–330

<!-- note:PAINT -->
---- painters -----------------------------------------------------------

Each returns [r,g,b] for one texel. u,v in 0..1; lat is -1..1.
<!-- /note -->

#### <a id="s-PAINT-lava"></a>`PAINT.lava(u, v, lat, pal, seed)`

prop · L86–95

- calls: [`fbm`](#s-fbm) · [`mix`](#s-mix) · [`ramp`](#s-ramp) · [`ridge`](#s-ridge)

<!-- note:PAINT.lava -->
<!-- /note -->

#### <a id="s-PAINT-barren"></a>`PAINT.barren(u, v, lat, pal, seed)`

prop · L97–103

- calls: [`fbm`](#s-fbm) ×2 · [`mix`](#s-mix) · [`ramp`](#s-ramp)

<!-- note:PAINT.barren -->
- L100 · `const cr = fbm(u * 22, v * 16, seed + 3, 3);` — impact basins
<!-- /note -->

#### <a id="s-PAINT-metallic"></a>`PAINT.metallic(u, v, lat, pal, seed)`

prop · L105–111

- calls: [`mix`](#s-mix) · [`ramp`](#s-ramp) · [`ridge`](#s-ridge) · [`wrapped`](#s-wrapped)

<!-- note:PAINT.metallic -->
<!-- /note -->

#### <a id="s-PAINT-desert"></a>`PAINT.desert(u, v, lat, pal, seed)`

prop · L113–118

- calls: [`fbm`](#s-fbm) ×2 · [`mix`](#s-mix) · [`ramp`](#s-ramp)

<!-- note:PAINT.desert -->
<!-- /note -->

#### <a id="s-PAINT-canyon"></a>`PAINT.canyon(u, v, lat, pal, seed)`

prop · L120–125

- calls: [`mix`](#s-mix) · [`ramp`](#s-ramp) · [`ridge`](#s-ridge)

<!-- note:PAINT.canyon -->
<!-- /note -->

#### <a id="s-PAINT-salt"></a>`PAINT.salt(u, v, lat, pal, seed)`

prop · L127–132

- calls: [`fbm`](#s-fbm) ×2 · [`ramp`](#s-ramp)

<!-- note:PAINT.salt -->
<!-- /note -->

#### <a id="s-PAINT-ocean"></a>`PAINT.ocean(u, v, lat, pal, seed)`

prop · L134–159

- calls: [`fbm`](#s-fbm) ×5 · [`mix`](#s-mix) ×4 · [`ramp`](#s-ramp) ×2

<!-- note:PAINT.ocean -->
- L138 · `const h = (land - 0.5) / 0.5;` — continents: shore, plain, upland
- L145 · `const arid = Math.exp(-Math.pow((Math.abs(lat) - 0.28) * 6, 2));` — arid belts either side of the equator
- L154 · `const capEdge = 0.8 - fbm(u * 8, 1, seed + 9) * 0.1;` — ice caps and cloud
<!-- /note -->

#### <a id="s-PAINT-jungle"></a>`PAINT.jungle(u, v, lat, pal, seed)`

prop · L161–169

- calls: [`fbm`](#s-fbm) ×3 · [`mix`](#s-mix) ×2 · [`ramp`](#s-ramp)

<!-- note:PAINT.jungle -->
<!-- /note -->

#### <a id="s-PAINT-steppe"></a>`PAINT.steppe(u, v, lat, pal, seed)`

prop · L171–177

- calls: [`fbm`](#s-fbm) · [`mix`](#s-mix) ×2 · [`ramp`](#s-ramp)

<!-- note:PAINT.steppe -->
<!-- /note -->

#### <a id="s-PAINT-tundra"></a>`PAINT.tundra(u, v, lat, pal, seed)`

prop · L179–186

- calls: [`fbm`](#s-fbm) ×2 · [`mix`](#s-mix) ×2 · [`ramp`](#s-ramp)

<!-- note:PAINT.tundra -->
<!-- /note -->

#### <a id="s-PAINT-dying"></a>`PAINT.dying(u, v, lat, pal, seed)`

prop · L188–197

- calls: [`fbm`](#s-fbm) ×2 · [`mix`](#s-mix) ×2 · [`ramp`](#s-ramp)

<!-- note:PAINT.dying -->
- L191 · `const basin = fbm(u * 3, v * 2.6, seed + 8);` — dry seabeds ringed with salt
<!-- /note -->

#### <a id="s-PAINT-sulfur"></a>`PAINT.sulfur(u, v, lat, pal, seed)`

prop · L199–205

- calls: [`fbm`](#s-fbm) ×2 · [`mix`](#s-mix) · [`ramp`](#s-ramp) · [`ridge`](#s-ridge)

<!-- note:PAINT.sulfur -->
<!-- /note -->

#### <a id="s-PAINT-haze"></a>`PAINT.haze(u, v, lat, pal, seed)`

prop · L207–212

- calls: [`fbm`](#s-fbm) · [`mix`](#s-mix) · [`ramp`](#s-ramp)

<!-- note:PAINT.haze -->
<!-- /note -->

#### <a id="s-PAINT-storm"></a>`PAINT.storm(u, v, lat, pal, seed)`

prop · L214–228

- calls: [`fbm`](#s-fbm) ×2 · [`mix`](#s-mix) · [`ramp`](#s-ramp)

<!-- note:PAINT.storm -->
- L218 · `const sx = 0.32;` — one great storm, parked off the equator
<!-- /note -->

#### <a id="s-PAINT-bands"></a>`PAINT.bands(u, v, lat, pal, seed)`

prop · L230–243

- calls: [`fbm`](#s-fbm) ×3 · [`mix`](#s-mix) ×2 · [`ramp`](#s-ramp)

<!-- note:PAINT.bands -->
- L231 · `const shear = fbm(u * 3, v * 2, seed) * 0.06;` — Belts and zones, sheared by longitude so they look like they are moving.
- L237 · `if (Math.abs(lat) < 0.5 && fine > 0.8) mix(c, 240, 232, 214, (fine - 0.8) * 2);` — white ammonia zones near the tropics
- L238 · `const du = Math.min(Math.abs(u - 0.62), 1 - Math.abs(u - 0.62)) * 4.4;` — a storm oval
<!-- /note -->

#### <a id="s-PAINT-methane"></a>`PAINT.methane(u, v, lat, pal, seed)`

prop · L245–252

- calls: [`fbm`](#s-fbm) ×2 · [`mix`](#s-mix) ×2 · [`ramp`](#s-ramp)

<!-- note:PAINT.methane -->
- L248 · `const lake = fbm(u * 9, v * 7, seed + 5);` — hydrocarbon lakes toward the poles
<!-- /note -->

#### <a id="s-PAINT-glacier"></a>`PAINT.glacier(u, v, lat, pal, seed)`

prop · L254–260

- calls: [`fbm`](#s-fbm) · [`mix`](#s-mix) · [`ramp`](#s-ramp) · [`ridge`](#s-ridge)

<!-- note:PAINT.glacier -->
<!-- /note -->

#### <a id="s-PAINT-cratered"></a>`PAINT.cratered(u, v, lat, pal, seed)`

prop · L262–276

- calls: [`fbm`](#s-fbm) ×3 · [`mix`](#s-mix) ×3 · [`ramp`](#s-ramp)

<!-- note:PAINT.cratered -->
- L265 · `const maria = fbm(u * 3, v * 2.6, seed + 2);` — maria: big dark flood basalt patches
- L267 · `for (const [sc, k] of [[9, 0.62], [19, 0.66], [38, 0.7]]) {` — craters at three sizes
- L270 · `mix(c, c[0] * 0.6, c[1] * 0.6, c[2] * 0.62, 1);` — floor
- L272 · `mix(c, 236, 232, 222, (cr - k) * 7);` — bright rim and ejecta
<!-- /note -->

#### <a id="s-PAINT-iceshell"></a>`PAINT.iceshell(u, v, lat, pal, seed)`

prop · L278–286

- calls: [`fbm`](#s-fbm) · [`mix`](#s-mix) ×2 · [`ramp`](#s-ramp) · [`ridge`](#s-ridge) ×2

<!-- note:PAINT.iceshell -->
- L281 · `const f1 = ridge(u * 9, v * 7, seed + 4, 3);` — the characteristic tangle of fractures
<!-- /note -->

#### <a id="s-PAINT-sulfurmoon"></a>`PAINT.sulfurmoon(u, v, lat, pal, seed)`

prop · L288–295

- calls: [`fbm`](#s-fbm) ×2 · [`mix`](#s-mix) ×2 · [`ramp`](#s-ramp)

<!-- note:PAINT.sulfurmoon -->
<!-- /note -->

#### <a id="s-PAINT-carbon"></a>`PAINT.carbon(u, v, lat, pal, seed)`

prop · L297–303

- calls: [`fbm`](#s-fbm) ×2 · [`mix`](#s-mix) · [`ramp`](#s-ramp)

<!-- note:PAINT.carbon -->
<!-- /note -->

#### <a id="s-PAINT-tholin"></a>`PAINT.tholin(u, v, lat, pal, seed)`

prop · L305–312

- calls: [`fbm`](#s-fbm) ×2 · [`mix`](#s-mix) ×2 · [`ramp`](#s-ramp)

<!-- note:PAINT.tholin -->
<!-- /note -->

#### <a id="s-PAINT-rubble"></a>`PAINT.rubble(u, v, lat, pal, seed)`

prop · L314–320

- calls: [`fbm`](#s-fbm) ×2 · [`mix`](#s-mix) · [`ramp`](#s-ramp)

<!-- note:PAINT.rubble -->
<!-- /note -->

#### <a id="s-PAINT-star"></a>`PAINT.star(u, v, lat, pal, seed)`

prop · L322–329

- calls: [`fbm`](#s-fbm) ×3 · [`mix`](#s-mix) · [`ramp`](#s-ramp)

<!-- note:PAINT.star -->
- L326 · `const sp = fbm(u * 7, v * 5, seed + 12);` — spots
<!-- /note -->

### <a id="s-KIND_SURFACE"></a>`KIND_SURFACE`

const · L332–341

<!-- note:KIND_SURFACE -->
Fallback painters when a body has no archetype (hand-built Sol, mostly).
<!-- /note -->

### <a id="s-paletteFrom"></a>`paletteFrom(hex)`

function · L343–351

- calls: [`hexToRgb`](#s-hexToRgb)
- called by: [`makePlanetTexture`](#s-makePlanetTexture) · [`planetPainter`](#s-planetPainter)

<!-- note:paletteFrom -->
Builds a 4-stop palette around a base colour when an archetype has none.
<!-- /note -->

### <a id="s-makePlanetTexture"></a>`makePlanetTexture(kind, baseHex, seed, size=, arch=)`

function · **exported** · L353–388

- calls: [`paletteFrom`](#s-paletteFrom)
- called by: [`mountGame>applyStar`](../render/engine.js.md#s-mountGame-applyStar) _js/render/engine.js_ · [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_
- effects: dom.create `canvas`

<!-- note:makePlanetTexture -->
@param kind    body kind, used when there is no archetype
@param baseHex fallback colour
@param seed    stable per body
@param size    texture edge
@param arch    archetype record from archetypes.js, if the body has one

- L372 · `const pinch = 1 - Math.pow(Math.abs(lat), 8) * 0.35;` — Poles converge on the sphere, so soften the pinch a little.
<!-- /note -->

### <a id="s-planetPainter"></a>`planetPainter(kind, baseHex, seed, size=, arch=, boost=)`

function · **exported** · L390–442

- calls: [`paletteFrom`](#s-paletteFrom)
- called by: [`mountGame>stepCloseUp`](../render/engine.js.md#s-mountGame-stepCloseUp) _js/render/engine.js_
- effects: dom.create `canvas`

<!-- note:planetPainter -->
0.3.73 — the close-up skin of the world you are flying at. The sky's skins
are 512–768 px across a whole globe, so at a few radii every texel is a
blurred block the size of a country. This paints the SAME surface (same
painter, palette and seed, so it is the same world) at a higher resolution
with two more noise octaves, a few rows per call so no frame stalls:
  const p = planetPainter(...texArgs, 768); while (!p.step(8)) {…}; p.texture
<!-- /note -->

#### <a id="s-planetPainter-done"></a>`planetPainter.done()`

prop · L403–403

<!-- note:planetPainter.done -->
<!-- /note -->

#### <a id="s-planetPainter-progress"></a>`planetPainter.progress()`

prop · L404–404

<!-- note:planetPainter.progress -->
<!-- /note -->

#### <a id="s-planetPainter-texture"></a>`planetPainter.texture()`

prop · L405–405

<!-- note:planetPainter.texture -->
<!-- /note -->

#### <a id="s-planetPainter-step"></a>`planetPainter.step(rows=)`

prop · L407–440

<!-- note:planetPainter.step -->
paint `rows` more rows; → true when the skin is finished
<!-- /note -->

### <a id="s-makeRingTexture"></a>`makeRingTexture(seed=)`

function · **exported** · L444–471

- calls: [`fbm`](#s-fbm) ×2
- called by: [`mountGame`](../render/engine.js.md#s-mountGame) _js/render/engine.js_
- effects: dom.create `canvas`

<!-- note:makeRingTexture -->
- L453 · `let a = 0.3 + Math.sin(u * 90 + seed) * 0.16 + Math.sin(u * 23 + seed * 2) * 0.12 + fbm(u` — several gaps, and fine structure between them
<!-- /note -->

### <a id="s-makeGlowTexture"></a>`makeGlowTexture()`

function · **exported** · L473–488

- called by: [`mountGame`](../render/engine.js.md#s-mountGame) _js/render/engine.js_
- effects: dom.create `canvas`

<!-- note:makeGlowTexture -->
<!-- /note -->

### <a id="s-makeNameSprite"></a>`makeNameSprite(text, color=)`

function · **exported** · L490–507

- effects: dom.create `canvas`

<!-- note:makeNameSprite -->
<!-- /note -->
