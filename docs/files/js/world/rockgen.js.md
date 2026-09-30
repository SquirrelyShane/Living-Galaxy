# js/world/rockgen.js

[index](../../../README.md) · 315 lines · 24 symbols · 0 imports · 5 importers

## About

<!-- note:@file -->
LIVING GALAXY — what a rock looks like.

Every asteroid in the game used to be the same object: one icosahedron,
detail 1, flat-shaded, `0x8a8178`. A belt of four hundred of them is four
hundred copies of one grey pebble at different sizes, and since the ore a
rock carries is decided by the field's own hash long before it is drawn,
none of that information ever reached the canopy. You could be flying
through a platinum vein and a carbon drift and they looked identical.

So: the rock you see is the rock you are about to cut.

  LOOK[oreId]         the palette and surface class for an ore
  rockLook(rock)      → the look for a field rock, vein lift included
  makeRockTexture()   → one albedo canvas per surface class
  makeRockBump()      → the matching height field, shared as a normal map
  rockShapes(THREE)   → three deformed hulls, each at two levels of detail

Everything here is built once per session and shared by every instance —
the per-rock differences are carried on the instance colour and matrix, so
a belt is still six draw calls, not four hundred.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/asteroidgen/ores.js](../asteroidgen/ores.js.md) — `oreLook`, `hexToRgb`
- [js/bodygen/body.js](../bodygen/body.js.md) — `oreLook`
- [js/render/engine.js](../render/engine.js.md) — `rockLook`
- [js/render/holefx.js](../render/holefx.js.md) — `oreLook`
- test/systems.test.mjs _(outside js/)_ — `oreLook`

## Exports

- [`SURFACES`](#s-SURFACES) · const — **no importer in scanned roots**
- [`LOOK`](#s-LOOK) · const — **no importer in scanned roots**
- [`oreLook`](#s-oreLook) · function — used by [js/asteroidgen/ores.js](../asteroidgen/ores.js.md), [js/bodygen/body.js](../bodygen/body.js.md), [js/render/holefx.js](../render/holefx.js.md), test/systems.test.mjs
- [`bodySurface`](#s-bodySurface) · function — **no importer in scanned roots**
- [`hexToRgb`](#s-hexToRgb) · function — used by [js/asteroidgen/ores.js](../asteroidgen/ores.js.md)
- [`rockLook`](#s-rockLook) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`makeRockTexture`](#s-makeRockTexture) · function — **no importer in scanned roots**
- [`makeRockRough`](#s-makeRockRough) · function — **no importer in scanned roots**
- [`makeCraterDetail`](#s-makeCraterDetail) · function — **no importer in scanned roots**
- [`deformGeometry`](#s-deformGeometry) · function — **no importer in scanned roots**
- [`rockShapes`](#s-rockShapes) · function — **no importer in scanned roots**
- [`shapeOf`](#s-shapeOf) · function — **no importer in scanned roots**

## Effects

- **dom.create** — `canvas` (makeCanvas:257)

## Symbols

### <a id="s-SURFACES"></a>`SURFACES`

const · **exported** · L1–1

<!-- note:SURFACES -->
Surface classes. Four ways a rock can be put together, which is about as
many as you can tell apart at belt distances:
  metal   — differentiated core stuff: dark, slightly shiny, sharp facets
  stone   — the ordinary run of the belt: dusty, matte, cratered
  carbon  — C-type: very dark, almost no specular, soft-edged
  ice     — dirty snowball: bright, low roughness, a little translucent
<!-- /note -->

### <a id="s-LOOK"></a>`LOOK`

const · **exported** · L3–30

<!-- note:LOOK -->
tint is multiplied onto the shared albedo, so these read as "how this ore
shifts a grey rock", not as absolute colours.

- L4 · `iron_ore:     { surface: "metal",  tint: 0xb4795a, note: "rust streaks" },` — --- metal ---------------------------------------------------------
- L16 · `silicate:     { surface: "stone",  tint: 0x9a9186, note: "pale stone" },` — --- stone ---------------------------------------------------------
- L22 · `carbonaceous: { surface: "carbon", tint: 0x4a474a, note: "soot" },` — --- carbon --------------------------------------------------------
- L24 · `water_ice:    { surface: "ice",    tint: 0xcfe4f0, note: "blue-white" },` — --- ice -----------------------------------------------------------
<!-- /note -->

### <a id="s-FALLBACK"></a>`FALLBACK`

const · L32–32

<!-- note:FALLBACK -->
<!-- /note -->

### <a id="s-ALBEDO"></a>`ALBEDO`

const · L34–49

<!-- note:ALBEDO -->
The grown bodies (js/bodygen/ over the vendored js/asteroidgen/) paint ore
seams as an ABSOLUTE albedo on a dark class matrix, not as a shift on grey,
and they sort ores into mineral families (which ones stand proud of the rock,
which ones frost over, which clouds turn amber). Both columns are the
generator's own v1.01 mapping onto these ids — kept here, beside the tint,
so there is still exactly one table that says what an ore looks like.
<!-- /note -->

### <a id="s-SURFACE_PBR"></a>`SURFACE_PBR`

const · L51–56

<!-- note:SURFACE_PBR -->
How a surface class behaves under light, before the ore's own override. The
generated bodies in js/bodygen/ need per-ore PBR numbers and a crystal habit
for their outcrops; rather than start a second mineral table for them, they
read this one.
<!-- /note -->

### <a id="s-PBR_OVERRIDE"></a>`PBR_OVERRIDE`

const · L58–76

<!-- note:PBR_OVERRIDE -->
The handful of ores whose behaviour is not their class's.
<!-- /note -->

### <a id="s-oreLook"></a>`oreLook(id)`

function · **exported** · L78–83

- called by: [`look`](../asteroidgen/ores.js.md#s-look) _js/asteroidgen/ores.js_ · [`outcropsOf`](../bodygen/body.js.md#s-outcropsOf) _js/bodygen/body.js_ ×2 · [`makeHoleFx>addInfall`](../render/holefx.js.md#s-makeHoleFx-addInfall) _js/render/holefx.js_

<!-- note:oreLook -->
Everything the renderer needs to know about one ore, in one call: its tint,
its surface family, how it takes light, whether it glows, and what shape it
grows in when it breaks the surface as an outcrop.
<!-- /note -->

### <a id="s-bodySurface"></a>`bodySurface(cls, iceAffinity=)`

function · **exported** · L85–89

<!-- note:bodySurface -->
Which surface texture a GROWN body wears, off its taxonomic class: the
differentiated classes are metal, the stony ones stone, the primitive dark
ones carbon, and a primitive body carrying real ice reads as a dirty
snowball. Same four textures the instanced field uses, so a rock keeps its
surface when it swaps from an instance to a grown body.
<!-- /note -->

### <a id="s-hexToRgb"></a>`hexToRgb(hex)`

function · **exported** · L91–93

- called by: [`lerpColor`](../asteroidgen/ores.js.md#s-lerpColor) _js/asteroidgen/ores.js_ ×2

<!-- note:hexToRgb -->
0xRRGGBB → { r, g, b } in 0..1.
<!-- /note -->

### <a id="s-rockLook"></a>`rockLook(rock)`

function · **exported** · L95–109

- called by: [`mountGame>rockTint`](../render/engine.js.md#s-mountGame-rockTint) _js/render/engine.js_

<!-- note:rockLook -->
The look for one field rock.

A rich rock is not a different rock, it is the same rock with the ore
showing: the tint is pushed toward the ore's own colour and lifted, so a
vein reads as a brighter, more saturated version of its neighbours rather
than a magic glowing object. Depletion goes the other way — a rock you have
cut most of the way through is bare and grey.

- L105 · `const t = worn * 0.65, grey = 132;` — toward the bare grey of the host rock
<!-- /note -->

### <a id="s-hash"></a>`hash(i, j, seed)`

function · L111–116

- called by: [`craterField`](#s-craterField) ×4 · [`deformGeometry`](#s-deformGeometry) ×7 · [`makeCraterDetail`](#s-makeCraterDetail) ×5 · [`makeCraterDetail>lat`](#s-makeCraterDetail-lat) · [`makeRockTexture`](#s-makeRockTexture) · [`noise`](#s-noise) ×4

<!-- note:hash -->
---- procedural surfaces -------------------------------------------------
Same integer hash as textures.js, kept local so this module has no imports
and can be measured on its own.
<!-- /note -->

### <a id="s-noise"></a>`noise(x, y, seed)`

function · L118–125

- calls: [`hash`](#s-hash) ×4
- called by: [`fbm`](#s-fbm)

<!-- note:noise -->
<!-- /note -->

### <a id="s-fbm"></a>`fbm(x, y, seed, oct=)`

function · L127–131

- calls: [`noise`](#s-noise)
- called by: [`makeRockRough`](#s-makeRockRough) · [`makeRockTexture`](#s-makeRockTexture)

<!-- note:fbm -->
<!-- /note -->

### <a id="s-craterField"></a>`craterField(seed, n)`

function · L133–144

- calls: [`hash`](#s-hash) ×4
- called by: [`makeRockTexture`](#s-makeRockTexture)

<!-- note:craterField -->
Craters are what makes a rock read as a rock rather than a lump of noise.
A ring of rim brightening around a darkened floor is the whole trick, and
two dozen of them at mixed sizes is enough at any range you can see one.
<!-- /note -->

### <a id="s-SURFACE_MIX"></a>`SURFACE_MIX`

const · L146–151

<!-- note:SURFACE_MIX -->
- L147 · `metal:  [7.5, 0.42, 16, 0.85, 0.60],` — [grain frequency, grain contrast, crater count, crater depth, base level]
<!-- /note -->

### <a id="s-makeRockTexture"></a>`makeRockTexture(surface, size=, seed=)`

function · **exported** · L153–189

- calls: [`craterField`](#s-craterField) · [`fbm`](#s-fbm) · [`hash`](#s-hash) · [`makeCanvas`](#s-makeCanvas)

<!-- note:makeRockTexture -->
An albedo canvas for one surface class. Wraps in u (longitude), so the seam
on a sphere-mapped hull does not show.

- L162 · `const lat = Math.sin(v * Math.PI);` — latitude squash so craters near the poles are not smeared into stripes
- L165 · `const a = u * Math.PI * 2;` — sample on a cylinder so u wraps seamlessly
- L168 · `t += (hash(i, j, seed + 3) - 0.5) * 0.07;` — fine grit on top, mostly visible close in
- L174 · `if (d < 0.86) t -= (1 - d / 0.86) * c.d * cDepth * 0.5;` — floor in shadow
- L175 · `else t += (1 - Math.abs(d - 1.05) / 0.27) * 0.16 * c.d;` — bright rim
<!-- /note -->

### <a id="s-makeRockRough"></a>`makeRockRough(surface, size=, seed=)`

function · **exported** · L191–211

- calls: [`fbm`](#s-fbm) · [`makeCanvas`](#s-makeCanvas)

<!-- note:makeRockRough -->
The roughness map for a surface class, derived from the same noise so the
shine sits where the geometry says it should: crater floors hold dust and
go rough, exposed faces are the shiny part on a metal rock and the dull
part on ice.
<!-- /note -->

### <a id="s-makeCraterDetail"></a>`makeCraterDetail(size=, seed=, count=)`

function · **exported** · L213–253

- calls: [`hash`](#s-hash) ×5 · [`makeCanvas`](#s-makeCanvas) · [`makeCraterDetail>vnoise`](#s-makeCraterDetail-vnoise) ×2

<!-- note:makeCraterDetail -->
A crater height field that tiles on BOTH axes, for grown bodies.

The belt textures above wrap in longitude only (they are sphere-mapped onto
instanced hulls). A grown body samples its detail triplanar in object space,
which tiles in every direction, so this one is built on a torus: lattice
noise with a wrapped period, and craters measured by wrapped distance. Grey =
height (0.5 is datum): dark floors, bright rims, a little grit. One canvas per
session; ~40 ms at 384².

- L217 · `const P = 8;` — noise lattice period
- L227 · `const r = 0.018 + Math.pow(hash(i, 3, seed), 2.6) * 0.16;` — power-law sizes: a few big bowls, many pits
- L241 · `if (d < 1) v -= (1 - d * d) * 0.34 * c.d;` — bowl
- L242 · `v += Math.exp(-Math.pow((d - 1) * 4.5, 2)) * 0.17 * c.d;` — rim
- L248 · `const g = Math.round(Math.max(0, Math.min(1, h[k] + (hash(k, 77, seed) - 0.5) * 0.05)) * 2` — grit last, per texel, so it does not tile with the lattice
<!-- /note -->

#### <a id="s-makeCraterDetail-lat"></a>`makeCraterDetail>lat(i, j, sd)`

function · L218–218

- calls: [`hash`](#s-hash)
- called by: [`makeCraterDetail>vnoise`](#s-makeCraterDetail-vnoise) ×4

<!-- note:makeCraterDetail>lat -->
<!-- /note -->

#### <a id="s-makeCraterDetail-vnoise"></a>`makeCraterDetail>vnoise(x, y, sd)`

function · L219–224

- calls: [`makeCraterDetail>lat`](#s-makeCraterDetail-lat) ×4
- called by: [`makeCraterDetail`](#s-makeCraterDetail) ×2

<!-- note:makeCraterDetail>vnoise -->
<!-- /note -->

### <a id="s-makeCanvas"></a>`makeCanvas(w, h)`

function · L255–263

- called by: [`makeCraterDetail`](#s-makeCraterDetail) · [`makeRockRough`](#s-makeRockRough) · [`makeRockTexture`](#s-makeRockTexture)
- effects: dom.create `canvas`

<!-- note:makeCanvas -->
- L261 · `if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);` — headless: OffscreenCanvas if the runtime has one, else a stub so tests can
  still call the palette side of this module
<!-- /note -->

### <a id="s-deformGeometry"></a>`deformGeometry(geo, seed, strength=)`

function · **exported** · L265–299

- calls: [`hash`](#s-hash) ×7
- called by: [`rockShapes`](#s-rockShapes) ×2

<!-- note:deformGeometry -->
---- shapes ---------------------------------------------------------------
One sphere is one rock. Three deformed hulls at two detail levels each is
the smallest set where a field stops looking like a bag of identical
marbles: at belt speeds you read silhouette and spin, not surface.

The deformation is low-frequency lobes plus a couple of flat cleaves, which
is roughly what a rubble pile or a fragment actually looks like. Vertices
are welded by position first so the lobes do not tear the mesh open.

- L268 · `const ax = [];` — three lobe axes and two cleave planes, all off the same seed
- L287 · `r += (hash(Math.round(ux * 57), Math.round(uy * 57 + uz * 31), seed) - 0.5) * strength * 0` — lumpy high-frequency skin, seeded on the direction so it is stable
- L288 · `for (const [dx, dy, dz, at] of cleaves) {` — flat cleaves: anything past the plane gets pulled back onto it
<!-- /note -->

### <a id="s-rockShapes"></a>`rockShapes(THREE, variants=)`

function · **exported** · L301–310

- calls: [`deformGeometry`](#s-deformGeometry) ×2

<!-- note:rockShapes -->
`THREE` is passed in rather than imported so this module stays loadable in
the node suites, which have no WebGL and no need for geometry.
<!-- /note -->

### <a id="s-shapeOf"></a>`shapeOf(rock, variants=)`

function · **exported** · L312–315

<!-- note:shapeOf -->
Which shape variant a rock uses — off its own seed, so it never changes.
<!-- /note -->
