# js/bodygen/body.js

[index](../../../README.md) · 291 lines · 22 symbols · 5 imports · 7 importers

## About

<!-- note:@file -->
LIVING GALAXY — one asteroid, grown properly.

The thin adapter between the game and Shane's asteroid generator, which is
vendored as-is at js/asteroidgen/ (v1.01 of the drop-in, the tree whose own
README calls itself 1.9.0). Before 0.3 this file WAS the generator — a port of
the pre-1.1 one, an icosahedron with craters and veins. Now the generator
lives in its own folder and this file only says how the game asks it for a
rock:

  - which rolls to hand it, in ONE place (`rockParams`, `rogueParams`), because
    the generator only draws a roll it was not given — hand it richness here
    and not there and the rng stream shifts and the survey card describes a
    different rock from the one in the canopy
  - how fine a mesh (DETAIL, cells per cube face edge, 12·n² triangles)
  - what the rock is worth, priced off the cutter (`assayOf`), not the
    generator's toy in-situ ledger
  - where the outcrops are, which the renderer seats crystals on

What the generator brings that the old port did not: a cube-sphere with no
pole pinching; seven body kinds (spheroid, ellipsoid, elongate, contact
binary, faceted fragment, rubble pile, spinning top); craters that age —
shallow soft-rimmed ponded floors on old ones, bright rayed halos on young
ones — plus basins that bite the silhouette and groove families; bedrock
brightening on scarps, cavity occlusion, and frost in the cold traps of an
ice-bearing class; vein NETWORKS that wander across the surface instead of
round spots; seated boulders and a lofted halo of chips.

Geometry comes back in the generator's unit frame (mean radius
`meshRadius` = 1.65). `scale` is what puts it at the rock's radius: the
renderer scales the mesh, rubble and debris together, because the debris
shaders and the rubble are laid out in that same unit frame.

- L155 · `export const CUT_SECONDS = 31;` — 1 / 0.032, the normal-cutter wear rate
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../asteroidgen/generator.js` | `generateAsteroid`, `SHAPE_LABELS`, `SHAPE_KINDS` | [js/asteroidgen/generator.js](../asteroidgen/generator.js.md) |
| 2 | `./bake.js` | `bakeLattice` | [js/bodygen/bake.js](bake.js.md) |
| 3 | `./classes.js` | `CLASSES` | [js/bodygen/classes.js](classes.js.md) |
| 4 | `../world/rockgen.js` | `oreLook` | [js/world/rockgen.js](../world/rockgen.js.md) |
| 5 | `../economy/materials.js` | `ORES` | [js/economy/materials.js](../economy/materials.js.md) |

## Imported by

- [js/bodygen/grower.js](grower.js.md) — `growBaked`
- [js/console/panels/nav.js](../console/panels/nav.js.md) — `assayRock`
- [js/render/engine.js](../render/engine.js.md) — `BAKE`, `rogueParams`
- [js/render/holefx.js](../render/holefx.js.md) — `generateBody`, `bodyMaterial`, `rogueParams`
- [js/world/events/impacts.js](../world/events/impacts.js.md) — `generateBody`, `rogueParams`, `DETAIL`
- test/asteroids.test.mjs _(outside js/)_ — `generateBody`, `assayRock`, `rockParams`, `rogueParams`, `DETAIL`, `faceCount`, `SHAPE_KINDS`, `MESH_RADIUS`
- test/systems.test.mjs _(outside js/)_ — `assayRock`, `recoverableUnits`, `DETAIL`, `faceCount`

## Exports

- `SHAPE_LABELS` — **no importer in scanned roots**
- `SHAPE_KINDS` — used by test/asteroids.test.mjs
- [`DETAIL`](#s-DETAIL) · const — used by [js/world/events/impacts.js](../world/events/impacts.js.md), test/asteroids.test.mjs, test/systems.test.mjs
- [`faceCount`](#s-faceCount) · function — used by test/asteroids.test.mjs, test/systems.test.mjs
- [`FEATURE_SCALE`](#s-FEATURE_SCALE) · const — **no importer in scanned roots**
- [`FEATURE_DENSITY`](#s-FEATURE_DENSITY) · const — **no importer in scanned roots**
- [`MESH_RADIUS`](#s-MESH_RADIUS) · const — used by test/asteroids.test.mjs
- [`rockParams`](#s-rockParams) · function — used by test/asteroids.test.mjs
- [`rogueParams`](#s-rogueParams) · function — used by [js/render/engine.js](../render/engine.js.md), [js/render/holefx.js](../render/holefx.js.md), [js/world/events/impacts.js](../world/events/impacts.js.md), test/asteroids.test.mjs
- [`generateBody`](#s-generateBody) · function — used by [js/render/holefx.js](../render/holefx.js.md), [js/world/events/impacts.js](../world/events/impacts.js.md), test/asteroids.test.mjs
- [`BAKE`](#s-BAKE) · const — used by [js/render/engine.js](../render/engine.js.md)
- [`featureAt`](#s-featureAt) · function — **no importer in scanned roots**
- [`growBaked`](#s-growBaked) · function — used by [js/bodygen/grower.js](grower.js.md)
- [`bakedTransfer`](#s-bakedTransfer) · function — **no importer in scanned roots**
- [`CUT_SECONDS`](#s-CUT_SECONDS) · const — **no importer in scanned roots**
- [`recoverableUnits`](#s-recoverableUnits) · function — used by test/systems.test.mjs
- [`assayOf`](#s-assayOf) · function — **no importer in scanned roots**
- [`assayRock`](#s-assayRock) · function — used by [js/console/panels/nav.js](../console/panels/nav.js.md), test/asteroids.test.mjs, test/systems.test.mjs
- [`bodyMaterial`](#s-bodyMaterial) · function — used by [js/render/holefx.js](../render/holefx.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-ORE_BY_ID"></a>`ORE_BY_ID`

const · L9–9

- via [js/economy/materials.js](../economy/materials.js.md): `ORES.map`

<!-- note:ORE_BY_ID -->
<!-- /note -->

### <a id="s-DETAIL"></a>`DETAIL`

const · **exported** · L11–11

<!-- note:DETAIL -->
Cells per cube-face edge; a body is 12·n² triangles and 6·n²+2 vertices.
Measured in node on this tree: n=5 ~6 ms, n=10 ~11 ms, n=12 ~13 ms to grow
(a phone is several times slower, which is why one is grown per frame).
  placeholder  the shared stand-in a rogue wears until its own body lands
  far          a grown body on the low quality tier
  near         the default grown body
  high         the high tier, and the rock under the cutter on full
  assay        the survey card's sample — no renderer, cached per rock
  survey       a close inspection
<!-- /note -->

### <a id="s-faceCount"></a>`faceCount(n)`

function · **exported** · L12–12

<!-- note:faceCount -->
<!-- /note -->

### <a id="s-FEATURE_SCALE"></a>`FEATURE_SCALE`

const · **exported** · L14–14

<!-- note:FEATURE_SCALE -->
How much wider a seam is drawn than the generator's survey-deck default.
Fixed across every detail level, so a rock does not grow fatter veins as it
drops a LOD, and the assay's coarse sample sees the seams the canopy shows.
<!-- /note -->

### <a id="s-FEATURE_DENSITY"></a>`FEATURE_DENSITY`

const · **exported** · L15–15

<!-- note:FEATURE_DENSITY -->
<!-- /note -->

### <a id="s-MESH_RADIUS"></a>`MESH_RADIUS`

const · **exported** · L17–17

<!-- note:MESH_RADIUS -->
The generator's own frame: every shape is normalised to this mean radius.
<!-- /note -->

### <a id="s-rockParams"></a>`rockParams(rock)`

function · **exported** · L19–26

- called by: [`assayRock`](#s-assayRock)

<!-- note:rockParams -->
The rolls a BELT rock hands the generator. Belt rocks leave roughness,
craters and shape to the seed — that is what makes two rocks of one class
different bodies — and fix what the field already decided.
<!-- /note -->

### <a id="s-rogueParams"></a>`rogueParams(m, cls)`

function · **exported** · L28–40

- called by: [`mountGame>impactorBody`](../render/engine.js.md#s-mountGame-impactorBody) _js/render/engine.js_ · [`makeHoleFx>addTidal`](../render/holefx.js.md#s-makeHoleFx-addTidal) _js/render/holefx.js_ · [`fracturedRogue`](../world/events/impacts.js.md#s-fracturedRogue) _js/world/events/impacts.js_

<!-- note:rogueParams -->
The rolls a ROGUE hands it. A rock that has been out there long enough to be
catalogued is a survivor: more relief and more craters than a belt rock of
the same size. A rogue born from a collision (`m.shape`) is a faceted
fragment — the generator's own hand-off rule for a rogue off the Impact Lab.
<!-- /note -->

### <a id="s-generateBody"></a>`generateBody(_THREE, opts=)`

function · **exported** · L42–78

- calls: [`generateAsteroid`](../asteroidgen/generator.js.md#s-generateAsteroid) _js/asteroidgen/generator.js_ · [`assayOf`](#s-assayOf) · [`outcropsOf`](#s-outcropsOf)
- called by: [`growBaked`](#s-growBaked) · [`makeHoleFx>addTidal`](../render/holefx.js.md#s-makeHoleFx-addTidal) _js/render/holefx.js_ · [`fracturedRogue`](../world/events/impacts.js.md#s-fracturedRogue) _js/world/events/impacts.js_

<!-- note:generateBody -->
Grow one body.

`opts` is either generator params (`seed`, `classId`, `radiusM`, …) or the
pre-0.3 shape (`seed`, `cls`, `radius` in world units, `roughness`, `craters`,
`richness`, `shape`). `detail` is cells per face edge. Returns the geometry in
the generator's unit frame, the `scale` that puts it at `radius`, the assay,
the outcrops (unit frame), and the generator's own result as `asteroid` —
which is what the rubble and the debris clouds are built from.
<!-- /note -->

### <a id="s-BAKE"></a>`BAKE`

const · **exported** · L80–84

<!-- note:BAKE -->
---- baked bodies ---------------------------------------------------------

What the canopy draws since 0.3.02. A body is grown at H cells a face — the
generator's own survey resolution, where its craters and veins exist — and
baked (js/bodygen/bake.js) onto a lattice of L cells a face. The tiers are
off the same device gate as before (engine.js rockQuality):
  proto   the belt field: one per class and variant, instanced by the hundred
  belt    a rock close aboard
  rogue   a catalogued rogue — the biggest thing you fly up to, so the finest
`L` must divide `H`. Node timings on this tree to grow: H32 ~40 ms, H48 ~90,
H64 ~200, H72 ~260 — which is why growth runs in a worker (grower.js).

- L81 · `proto: { H: 32, L: [8, 4, 2] },` — 768 triangles close, 192 at a few dozen pixels, 48 at a dozen
<!-- /note -->

### <a id="s-featureAt"></a>`featureAt(H)`

function · **exported** · L86–86

- called by: [`growBaked`](#s-growBaked)

<!-- note:featureAt -->
The generator's features were tuned for 56 cells a face; below that a seam is
widened just enough to land on the lattice (the 0.3 bodies needed ×4 at 10).
<!-- /note -->

### <a id="s-growBaked"></a>`growBaked(opts=)`

function · **exported** · L88–111

- calls: [`bakeLattice`](bake.js.md#s-bakeLattice) _js/bodygen/bake.js_ ×2 · [`featureAt`](#s-featureAt) · [`generateBody`](#s-generateBody)
- called by: [`pump`](grower.js.md#s-pump) _js/bodygen/grower.js_

<!-- note:growBaked -->
Grow and bake one body. Plain data in, plain data out — it runs in the grower
worker. `opts` takes the same rolls as generateBody plus `H` and `L` (a list).
Returns the bake (atlases + one mesh per L) and everything generateBody
reports about the rock, with the assay taken off the fine surface.
<!-- /note -->

### <a id="s-bakedTransfer"></a>`bakedTransfer(d)`

function · **exported** · L113–118

<!-- note:bakedTransfer -->
Every transferable buffer of a growBaked result.
<!-- /note -->

### <a id="s-outcropsOf"></a>`outcropsOf(a)`

function · L120–153

- calls: [`oreLook`](../world/rockgen.js.md#s-oreLook) _js/world/rockgen.js_ ×2
- called by: [`generateBody`](#s-generateBody)

<!-- note:outcropsOf -->
An outcrop is where a seam worth calling in breaks the surface: an ore that
stands proud (metal), glows, or is worth more than the matrix around it.
Thinned by vertex order so a rich rock does not become a pincushion, and
capped, because each one is an instance the renderer pays for.

- L126 · `const hits = [];` — every qualifying vertex first, then thinned evenly: at the generator's own
  resolution a seam is a few vertices wide, and a fixed stride stepped over them
<!-- /note -->

### <a id="s-CUT_SECONDS"></a>`CUT_SECONDS`

const · **exported** · L155–155

<!-- note:CUT_SECONDS -->
The ledger.

Priced off what the CUTTER would actually get, not off the rock's mass.
A bulk-tonnage figure is the honest physics answer and it is useless here:
a 400 u body masses 3×10¹⁴ kg and assays at four hundred billion credits,
which tells a player nothing except that the number is theatre. The game
already has a yield curve in turrets.js — `(2.5 + (r/60)^1.5 · 5)` units a
second, and a rock is cut out in about thirty-one seconds of normal work —
so the ticket is that total, split by what fraction of the surface assays as
each ore, priced at the same `value` the market pays. A prospector's ticket
in the currency the prospector gets paid in.
<!-- /note -->

### <a id="s-recoverableUnits"></a>`recoverableUnits(radius)`

function · **exported** · L156–158

- called by: [`assayOf`](#s-assayOf)

<!-- note:recoverableUnits -->
<!-- /note -->

### <a id="s-assayOf"></a>`assayOf(composition, verts, cls, radius, richness=, favour=)`

function · **exported** · L160–186

- calls: [`recoverableUnits`](#s-recoverableUnits) · [`suiteShares`](#s-suiteShares)
- called by: [`assayRock`](#s-assayRock) · [`generateBody`](#s-generateBody)

<!-- note:assayOf -->
- L162 · `const gross = recoverableUnits(radius) * (0.8 + richness * 0.25);` — the gross is what the cutter would take out of a rock made entirely of
  ore; the ticket is only the ore in it, because bare matrix is not cargo.
  `units` is therefore the sum of the suite — the two numbers agreeing is the
  whole point of a ticket.
- L179 · `const metres = radius * 10;` — the bulk figure is still worth carrying for the survey card, it is just
  not what the ticket is priced on
<!-- /note -->

### <a id="s-suiteShares"></a>`suiteShares(composition, verts, klass, favour)`

function · L188–207

- called by: [`assayOf`](#s-assayOf)

<!-- note:suiteShares -->
Which ores, in what proportion. The class table is the prior; what the
surface actually shows is the evidence, trusted more the more of it there
is; the ore the field hash already gave this rock (what the cutter will put
in the hold) is favoured, so the card's headline and the hold agree. Shares
under 2% are dropped — a survey set does not report trace.
<!-- /note -->

### <a id="s-ASSAY_CACHE"></a>`ASSAY_CACHE`

const · L209–209

<!-- note:ASSAY_CACHE -->
The assay WITHOUT the renderer.

The survey card wants what a rock is made of; it must not reach into the
renderer to get it, and it must work with the graphics gated off. The
generator lays its ore features out in DIRECTION space off rolls that come
before any per-vertex work, so a coarse body (DETAIL.assay) grown from the
same params lands its veins in the same places as the canopy's finer one —
the card and the canopy disagree only by sampling. Cached per rock, because
a panel repaints and the rock does not change.
<!-- /note -->

### <a id="s-ASSAY_CAP"></a>`ASSAY_CAP`

const · L210–210

<!-- note:ASSAY_CAP -->
<!-- /note -->

### <a id="s-assayRock"></a>`assayRock(rock)`

function · **exported** · L212–233

- calls: [`generateAsteroid`](../asteroidgen/generator.js.md#s-generateAsteroid) _js/asteroidgen/generator.js_ · [`assayOf`](#s-assayOf) · [`rockParams`](#s-rockParams)
- called by: [`mountSurvey`](../console/panels/nav.js.md#s-mountSurvey) _js/console/panels/nav.js_

<!-- note:assayRock -->
<!-- /note -->

### <a id="s-bodyMaterial"></a>`bodyMaterial(THREE, {…}=)`

function · **exported** · L235–291

- called by: [`makeHoleFx>addTidal`](../render/holefx.js.md#s-makeHoleFx-addTidal) _js/render/holefx.js_

<!-- note:bodyMaterial -->
The material a generated body wears: per-vertex colour, metalness and glow —
and, given a `map`, the belt's own crater texture laid over it triplanar.

Why the texture: the generator's craters, grooves and grit are GEOMETRY, and
they are drawn for a survey mesh of 56–158 cells a face. A game body is 7–18,
where all of that falls between vertices and a rock reads as a smooth potato.
The instanced field already wears a procedural crater albedo per surface
class (js/world/rockgen.js makeRockTexture); sampling the same canvas in object
space, as albedo AND as a bump, puts crisp craters on a grown body at any
tessellation — and means the body that replaces an instance as you close in
has the surface you were already looking at.

- L245 · `mat.onBeforeCompile = (shader) => {` — Three has no per-vertex metalness/roughness/emissive, and a rock where the
  metal does not read as metal is just a painted ball. Three small injections
  are cheaper than a custom shader and survive the standard lighting.
<!-- /note -->
