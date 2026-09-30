# js/stationgen/core/geometry.js

[index](../../../../README.md) · 273 lines · 41 symbols · 1 imports · 7 importers

## About

<!-- note:@file -->
Shared geometry: cached unit primitives, lathe profiles, truss lattices,
the material factory, per-material static merging and instanced batches.

Everything here is scale-agnostic: a "unit" cylinder is scaled per mesh.
The cache is page-lifetime; nothing in it is ever disposed. Geometry a
station owns outright (merged batches, lathes with custom profiles) is
flagged `owned` so releaseStation() can free it.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |

## Imported by

- [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md) — `G`, `makeMat`, `addMesh`, `instanced`, `mergeStatic`, `FINISHES`
- [js/stationgen/builder/hangar.js](../builder/hangar.js.md) — `G`, `addMesh`, `instanced`, `extrude`, `archOutline`
- [js/stationgen/builder/hull.js](../builder/hull.js.md) — `G`, `latheOf`, `addMesh`, `trussGeometry`, `extrude`, `extrudeOwned`, `archOutline`, `bittenDisc`, `instanced`
- [js/stationgen/generate.js](../generate.js.md) — `disposeOwned`
- [js/stationgen/index.js](../index.js.md) — `G`, `makeMat`, `addMesh`, `mergeStatic`, `instanced`, `disposeOwned`
- [js/stationgen/prefabs/forms.js](../prefabs/forms.js.md) — `G`, `PROFILES`, `lathe`, `latheOf`, `extrude`, `archOutline`
- [js/stationgen/prefabs/modules.js](../prefabs/modules.js.md) — `G`, `PROFILES`, `lathe`, `latheOf`

## Exports

- [`cached`](#s-cached) · function — **no importer in scanned roots**
- [`G`](#s-G) · const — used by [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md), [js/stationgen/builder/hangar.js](../builder/hangar.js.md), [js/stationgen/builder/hull.js](../builder/hull.js.md), [js/stationgen/index.js](../index.js.md), [js/stationgen/prefabs/forms.js](../prefabs/forms.js.md), [js/stationgen/prefabs/modules.js](../prefabs/modules.js.md)
- [`lathe`](#s-lathe) · function — used by [js/stationgen/prefabs/forms.js](../prefabs/forms.js.md), [js/stationgen/prefabs/modules.js](../prefabs/modules.js.md)
- [`PROFILES`](#s-PROFILES) · const — used by [js/stationgen/prefabs/forms.js](../prefabs/forms.js.md), [js/stationgen/prefabs/modules.js](../prefabs/modules.js.md)
- [`jitterProfile`](#s-jitterProfile) · function — **no importer in scanned roots**
- [`latheOf`](#s-latheOf) · function — used by [js/stationgen/builder/hull.js](../builder/hull.js.md), [js/stationgen/prefabs/forms.js](../prefabs/forms.js.md), [js/stationgen/prefabs/modules.js](../prefabs/modules.js.md)
- [`extrude`](#s-extrude) · function — used by [js/stationgen/builder/hangar.js](../builder/hangar.js.md), [js/stationgen/builder/hull.js](../builder/hull.js.md), [js/stationgen/prefabs/forms.js](../prefabs/forms.js.md)
- [`extrudeOwned`](#s-extrudeOwned) · function — used by [js/stationgen/builder/hull.js](../builder/hull.js.md)
- [`archOutline`](#s-archOutline) · function — used by [js/stationgen/builder/hangar.js](../builder/hangar.js.md), [js/stationgen/builder/hull.js](../builder/hull.js.md), [js/stationgen/prefabs/forms.js](../prefabs/forms.js.md)
- [`bittenDisc`](#s-bittenDisc) · function — used by [js/stationgen/builder/hull.js](../builder/hull.js.md)
- [`FINISHES`](#s-FINISHES) · const — used by [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md)
- [`makeMat`](#s-makeMat) · function — used by [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md), [js/stationgen/index.js](../index.js.md)
- [`addMesh`](#s-addMesh) · function — used by [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md), [js/stationgen/builder/hangar.js](../builder/hangar.js.md), [js/stationgen/builder/hull.js](../builder/hull.js.md), [js/stationgen/index.js](../index.js.md)
- [`trussGeometry`](#s-trussGeometry) · function — used by [js/stationgen/builder/hull.js](../builder/hull.js.md)
- [`mergeGeometries`](#s-mergeGeometries) · function — **no importer in scanned roots**
- [`mergeStatic`](#s-mergeStatic) · function — used by [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md), [js/stationgen/index.js](../index.js.md)
- [`instanced`](#s-instanced) · function — used by [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md), [js/stationgen/builder/hangar.js](../builder/hangar.js.md), [js/stationgen/builder/hull.js](../builder/hull.js.md), [js/stationgen/index.js](../index.js.md)
- [`disposeOwned`](#s-disposeOwned) · function — used by [js/stationgen/generate.js](../generate.js.md), [js/stationgen/index.js](../index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-cache"></a>`cache`

const · L3–3

<!-- note:cache -->
<!-- /note -->

### <a id="s-cached"></a>`cached(key, make)`

function · **exported** · L4–8

- called by: [`G.box`](#s-G-box) · [`G.cone`](#s-G-cone) · [`G.cyl`](#s-G-cyl) · [`G.disc`](#s-G-disc) · [`G.dome`](#s-G-dome) · [`G.frustum`](#s-G-frustum) · [`G.ico`](#s-G-ico) · [`G.octa`](#s-G-octa) · [`G.ring`](#s-G-ring) · [`G.sphere`](#s-G-sphere) · [`G.taper`](#s-G-taper) · [`G.throat`](#s-G-throat) · [`G.torus`](#s-G-torus) · [`G.tube`](#s-G-tube) · [`extrude`](#s-extrude) · [`lathe`](#s-lathe) · [`trussGeometry`](#s-trussGeometry)

<!-- note:cached -->
<!-- /note -->

### <a id="s-G"></a>`G`

const · **exported** · L10–25

<!-- note:G -->
<!-- /note -->

#### <a id="s-G-box"></a>`G.box()`

prop · L11–11

- calls: [`cached`](#s-cached)

<!-- note:G.box -->
<!-- /note -->

#### <a id="s-G-cyl"></a>`G.cyl(seg=)`

prop · L12–12

- calls: [`cached`](#s-cached)

<!-- note:G.cyl -->
<!-- /note -->

#### <a id="s-G-tube"></a>`G.tube(seg=)`

prop · L13–13

- calls: [`cached`](#s-cached)

<!-- note:G.tube -->
<!-- /note -->

#### <a id="s-G-taper"></a>`G.taper(r, seg=)`

prop · L14–14

- calls: [`cached`](#s-cached)

<!-- note:G.taper -->
<!-- /note -->

#### <a id="s-G-frustum"></a>`G.frustum(r, seg=)`

prop · L15–15

- calls: [`cached`](#s-cached)

<!-- note:G.frustum -->
<!-- /note -->

#### <a id="s-G-cone"></a>`G.cone(seg=)`

prop · L16–16

- calls: [`cached`](#s-cached)

<!-- note:G.cone -->
<!-- /note -->

#### <a id="s-G-sphere"></a>`G.sphere(w=, h=)`

prop · L17–17

- calls: [`cached`](#s-cached)

<!-- note:G.sphere -->
<!-- /note -->

#### <a id="s-G-dome"></a>`G.dome(w=)`

prop · L18–18

- calls: [`cached`](#s-cached)

<!-- note:G.dome -->
<!-- /note -->

#### <a id="s-G-torus"></a>`G.torus(tube=, radial=, tubular=)`

prop · L19–19

- calls: [`cached`](#s-cached)

<!-- note:G.torus -->
<!-- /note -->

#### <a id="s-G-ring"></a>`G.ring(inner=)`

prop · L20–20

- calls: [`cached`](#s-cached)

<!-- note:G.ring -->
<!-- /note -->

#### <a id="s-G-disc"></a>`G.disc()`

prop · L21–21

- calls: [`cached`](#s-cached)

<!-- note:G.disc -->
<!-- /note -->

#### <a id="s-G-octa"></a>`G.octa()`

prop · L22–22

- calls: [`cached`](#s-cached)

<!-- note:G.octa -->
<!-- /note -->

#### <a id="s-G-ico"></a>`G.ico(d=)`

prop · L23–23

- calls: [`cached`](#s-cached)

<!-- note:G.ico -->
<!-- /note -->

#### <a id="s-G-throat"></a>`G.throat(seg=)`

prop · L24–24

- calls: [`cached`](#s-cached)

<!-- note:G.throat -->
a cylinder open at one end: the hangar throat, seen from inside
<!-- /note -->

### <a id="s-lathe"></a>`lathe(key, points, seg=)`

function · **exported** · L27–29

- calls: [`cached`](#s-cached)
- called by: [`latheOf`](#s-latheOf) · [`DECOR.dish`](../prefabs/forms.js.md#s-DECOR-dish) _js/stationgen/prefabs/forms.js_ · [`PREFABS.bigdish`](../prefabs/modules.js.md#s-PREFABS-bigdish) _js/stationgen/prefabs/modules.js_ ×2 · [`PREFABS.commsmast`](../prefabs/modules.js.md#s-PREFABS-commsmast) _js/stationgen/prefabs/modules.js_ · [`PREFABS.concentrators`](../prefabs/modules.js.md#s-PREFABS-concentrators) _js/stationgen/prefabs/modules.js_ · [`PREFABS.observatory`](../prefabs/modules.js.md#s-PREFABS-observatory) _js/stationgen/prefabs/modules.js_ · [`PREFABS.siege`](../prefabs/modules.js.md#s-PREFABS-siege) _js/stationgen/prefabs/modules.js_

<!-- note:lathe -->
---- lathe profiles ----------------------------------------------------

Points are (radius, y) in unit space: y from −0.5 to 0.5. Lathes are per
profile-key cached; a profile with random jitter should be keyed by its
rounded numbers so a repeated shape shares geometry.
<!-- /note -->

### <a id="s-PROFILES"></a>`PROFILES`

const · **exported** · L30–37

<!-- note:PROFILES -->
<!-- /note -->

### <a id="s-jitterProfile"></a>`jitterProfile(rng, kind=, amount=)`

function · **exported** · L39–46

- calls: [`jitterProfile>j`](#s-jitterProfile-j) ×2
- called by: [`latheOf`](#s-latheOf)

<!-- note:jitterProfile -->
A seeded lathe profile: `kind` picks the family, the rng bends it. Points
are rounded so near-identical shapes share one cached geometry.

- L43 · `if (rng.chance(0.35)) { const k = rng.int(1, pts.length - 2); pts[k][0] = +(pts[k][0] * rn` — a neck or a bulge, sometimes
<!-- /note -->

#### <a id="s-jitterProfile-j"></a>`jitterProfile>j(v, a)`

function · L41–41

- called by: [`jitterProfile`](#s-jitterProfile) ×2

<!-- note:jitterProfile>j -->
<!-- /note -->

### <a id="s-latheOf"></a>`latheOf(rng, kind, seg=, amount=)`

function · **exported** · L47–50

- calls: [`jitterProfile`](#s-jitterProfile) · [`lathe`](#s-lathe)
- called by: [`STYLES.cluster`](../builder/hull.js.md#s-STYLES-cluster) _js/stationgen/builder/hull.js_ · [`arm`](../builder/hull.js.md#s-arm) _js/stationgen/builder/hull.js_ · [`FORMS.barrel`](../prefabs/forms.js.md#s-FORMS-barrel) _js/stationgen/prefabs/forms.js_ · [`FORMS.cluster`](../prefabs/forms.js.md#s-FORMS-cluster) _js/stationgen/prefabs/forms.js_ · [`FORMS.spindle`](../prefabs/forms.js.md#s-FORMS-spindle) _js/stationgen/prefabs/forms.js_ · [`PREFABS.lifeboats`](../prefabs/modules.js.md#s-PREFABS-lifeboats) _js/stationgen/prefabs/modules.js_ · [`PREFABS.podblock`](../prefabs/modules.js.md#s-PREFABS-podblock) _js/stationgen/prefabs/modules.js_ · [`PREFABS.reactor`](../prefabs/modules.js.md#s-PREFABS-reactor) _js/stationgen/prefabs/modules.js_ ×3 · [`PREFABS.shipyard`](../prefabs/modules.js.md#s-PREFABS-shipyard) _js/stationgen/prefabs/modules.js_ · [`PREFABS.tankfarm`](../prefabs/modules.js.md#s-PREFABS-tankfarm) _js/stationgen/prefabs/modules.js_ · [`tank`](../prefabs/modules.js.md#s-tank) _js/stationgen/prefabs/modules.js_

<!-- note:latheOf -->
<!-- /note -->

### <a id="s-extrude"></a>`extrude(key, outline, depth=, holes=, o=)`

function · **exported** · L52–60

- calls: [`cached`](#s-cached)
- called by: [`liningGeo`](../builder/hangar.js.md#s-liningGeo) _js/stationgen/builder/hangar.js_ · [`plateGeo`](../builder/hangar.js.md#s-plateGeo) _js/stationgen/builder/hangar.js_ · [`tubeGeo`](../builder/hangar.js.md#s-tubeGeo) _js/stationgen/builder/hangar.js_ · [`STYLES.cathedral`](../builder/hull.js.md#s-STYLES-cathedral) _js/stationgen/builder/hull.js_ · [`DECOR.arcade`](../prefabs/forms.js.md#s-DECOR-arcade) _js/stationgen/prefabs/forms.js_ · [`ribGeo`](../prefabs/forms.js.md#s-ribGeo) _js/stationgen/prefabs/forms.js_ · [`vaultGeo`](../prefabs/forms.js.md#s-vaultGeo) _js/stationgen/prefabs/forms.js_

<!-- note:extrude -->
---- extrusions ----------------------------------------------------------

Flat outlines extruded along +Z from z = 0 to z = depth (unit outlines are
scaled per mesh). `holes` are inner outlines. Keyed and cached.
<!-- /note -->

### <a id="s-extrudeOwned"></a>`extrudeOwned(outline, depth=, holes=, o=)`

function · **exported** · L62–69

- called by: [`spine`](../builder/hull.js.md#s-spine) _js/stationgen/builder/hull.js_

<!-- note:extrudeOwned -->
An extrusion the station owns outright (unique outlines: notched spine segments).
<!-- /note -->

### <a id="s-archOutline"></a>`archOutline(kind, w=, h=, n=)`

function · **exported** · L71–98

- calls: [`archOutline`](#s-archOutline)
- called by: [`hangar`](../builder/hangar.js.md#s-hangar) _js/stationgen/builder/hangar.js_ · [`liningGeo`](../builder/hangar.js.md#s-liningGeo) _js/stationgen/builder/hangar.js_ ×2 · [`plateGeo`](../builder/hangar.js.md#s-plateGeo) _js/stationgen/builder/hangar.js_ ×2 · [`tubeGeo`](../builder/hangar.js.md#s-tubeGeo) _js/stationgen/builder/hangar.js_ ×2 · [`STYLES.cathedral`](../builder/hull.js.md#s-STYLES-cathedral) _js/stationgen/builder/hull.js_ · [`archOutline`](#s-archOutline) · [`DECOR.arcade`](../prefabs/forms.js.md#s-DECOR-arcade) _js/stationgen/prefabs/forms.js_ · [`ribGeo`](../prefabs/forms.js.md#s-ribGeo) _js/stationgen/prefabs/forms.js_ ×2 · [`vaultGeo`](../prefabs/forms.js.md#s-vaultGeo) _js/stationgen/prefabs/forms.js_

<!-- note:archOutline -->
Outline of an aperture / arch, width w, height h (base on y = 0), as [x,y] points.

- L78 · `const rise = Math.min(hw, h * 0.6);` — straight jambs then a semicircle (or a flatter segment when h < w/2)
- L86 · `const rise = Math.min(h * 0.55, hw * 1.15);` — two arcs meeting at the apex: the gothic arch. Centres at ±(hw·k) on the springing line.
- L89 · `const R = hw * 1.5, cx = hw - R;` — right arc centred at (hw−R, y0): passes through (hw, y0)
- L90 · `const aTop = Math.acos((0 - cx) / R);` — where x = 0
<!-- /note -->

### <a id="s-bittenDisc"></a>`bittenDisc(R, bites=, n=)`

function · **exported** · L100–115

- calls: [`bittenDisc>rot`](#s-bittenDisc-rot) ×4
- called by: [`spine`](../builder/hull.js.md#s-spine) _js/stationgen/builder/hull.js_

<!-- note:bittenDisc -->
A circle of radius R with rectangular bites taken out of the rim (for notched spine segments). Bites: { a, w, sink }.

- L111 · `pts.push(rot([inside.w / 2, yr]), rot([inside.w / 2, yi]), rot([-inside.w / 2, yi]), rot([` — walking anticlockwise: enter at +x side of the bite (x = +w/2) … no: at angle a−ha we are at x = +w/2 in the bite frame
<!-- /note -->

#### <a id="s-bittenDisc-rot"></a>`bittenDisc>rot([…])`

function · L110–110

- called by: [`bittenDisc`](#s-bittenDisc) ×4

<!-- note:bittenDisc>rot -->
<!-- /note -->

### <a id="s-FINISHES"></a>`FINISHES`

const · **exported** · L117–123

<!-- note:FINISHES -->
---- materials ---------------------------------------------------------
<!-- /note -->

### <a id="s-makeMat"></a>`makeMat(color, o=)`

function · **exported** · L124–139

- called by: [`StationBuilder.materials`](../builder/StationBuilder.js.md#s-StationBuilder-materials) _js/stationgen/builder/StationBuilder.js_ ×18 · [`StationBuilder.materials>skin`](../builder/StationBuilder.js.md#s-StationBuilder-materials-skin) _js/stationgen/builder/StationBuilder.js_ · [`StationBuilder.shieldShell`](../builder/StationBuilder.js.md#s-StationBuilder-shieldShell) _js/stationgen/builder/StationBuilder.js_

<!-- note:makeMat -->
<!-- /note -->

### <a id="s-addMesh"></a>`addMesh(parent, geo, mat, x=, y=, z=, rx=, ry=, rz=, sx=, sy=, sz=)`

function · **exported** · L141–148

- called by: [`StationBuilder.ctx.add`](../builder/StationBuilder.js.md#s-StationBuilder-ctx-add) _js/stationgen/builder/StationBuilder.js_ · [`StationBuilder.ctx.addTo`](../builder/StationBuilder.js.md#s-StationBuilder-ctx-addTo) _js/stationgen/builder/StationBuilder.js_ · [`StationBuilder.shieldShell`](../builder/StationBuilder.js.md#s-StationBuilder-shieldShell) _js/stationgen/builder/StationBuilder.js_ ×2 · [`hangar`](../builder/hangar.js.md#s-hangar) _js/stationgen/builder/hangar.js_ · [`hangar>add`](../builder/hangar.js.md#s-hangar-add) _js/stationgen/builder/hangar.js_ · [`STYLES.bastion`](../builder/hull.js.md#s-STYLES-bastion) _js/stationgen/builder/hull.js_ ×4 · [`STYLES.cathedral`](../builder/hull.js.md#s-STYLES-cathedral) _js/stationgen/builder/hull.js_ ×17 · [`STYLES.cluster`](../builder/hull.js.md#s-STYLES-cluster) _js/stationgen/builder/hull.js_ ×5 · [`STYLES.lattice`](../builder/hull.js.md#s-STYLES-lattice) _js/stationgen/builder/hull.js_ · [`STYLES.spindle`](../builder/hull.js.md#s-STYLES-spindle) _js/stationgen/builder/hull.js_ · [`STYLES.ziggurat`](../builder/hull.js.md#s-STYLES-ziggurat) _js/stationgen/builder/hull.js_ ×5 · [`arm`](../builder/hull.js.md#s-arm) _js/stationgen/builder/hull.js_ ×5 · [`boom`](../builder/hull.js.md#s-boom) _js/stationgen/builder/hull.js_ · [`habitatDrum`](../builder/hull.js.md#s-habitatDrum) _js/stationgen/builder/hull.js_ ×7 · [`ring`](../builder/hull.js.md#s-ring) _js/stationgen/builder/hull.js_ ×6 · [`spine`](../builder/hull.js.md#s-spine) _js/stationgen/builder/hull.js_ ×8

<!-- note:addMesh -->
<!-- /note -->

### <a id="s-trussGeometry"></a>`trussGeometry(bays=, width=, rod=)`

function · **exported** · L150–177

- calls: [`cached`](#s-cached) · [`mergeGeometries`](#s-mergeGeometries) · [`trussGeometry>push`](#s-trussGeometry-push) ×6
- called by: [`STYLES.lattice`](../builder/hull.js.md#s-STYLES-lattice) _js/stationgen/builder/hull.js_ · [`arm`](../builder/hull.js.md#s-arm) _js/stationgen/builder/hull.js_ · [`boom`](../builder/hull.js.md#s-boom) _js/stationgen/builder/hull.js_ · [`ring`](../builder/hull.js.md#s-ring) _js/stationgen/builder/hull.js_

<!-- note:trussGeometry -->
---- truss lattices ----------------------------------------------------

A square-section girder along +Y of length 1 (unit), made of four chords
and X-bracing, merged into one owned geometry per (bays, width) key.

- L164 · `for (const [x, z, ry] of [[0, -h, 0], [0, h, 0], [-h, 0, Math.PI / 2], [h, 0, Math.PI / 2]` — rungs on all four faces
- L165 · `const s = i % 2 ? 1 : -1;` — one diagonal per face, alternating direction
<!-- /note -->

#### <a id="s-trussGeometry-push"></a>`trussGeometry>push(g, x, y, z, rx, ry, rz, sx, sy, sz)`

function · L153–156

- called by: [`trussGeometry`](#s-trussGeometry) ×6

<!-- note:trussGeometry>push -->
<!-- /note -->

### <a id="s-mergeGeometries"></a>`mergeGeometries(list)`

function · **exported** · L179–198

- called by: [`mergeStatic>mergeUnder`](#s-mergeStatic-mergeUnder) · [`trussGeometry`](#s-trussGeometry)

<!-- note:mergeGeometries -->
---- merging -------------------------------------------------------------

Non-indexed concatenation of position/normal/uv. Every input is consumed
as-is (already transformed).
<!-- /note -->

### <a id="s-LIVE_KEYS"></a>`LIVE_KEYS`

const · L200–200

<!-- note:LIVE_KEYS -->
<!-- /note -->

### <a id="s-_inv"></a>`_inv`

const · L201–201

<!-- note:_inv -->
<!-- /note -->

### <a id="s-mergeStatic"></a>`mergeStatic(root, liveKeys=)`

function · **exported** · L202–241

- calls: [`mergeStatic>mergeUnder`](#s-mergeStatic-mergeUnder)
- called by: [`StationBuilder.build`](../builder/StationBuilder.js.md#s-StationBuilder-build) _js/stationgen/builder/StationBuilder.js_

<!-- note:mergeStatic -->
Bake every static mesh under `root` into one mesh per material, leaving
animated nodes alone. A live *group* (a spinning ring, a drum, a turret)
becomes its own merge root, so the modules riding it bake into that group
and keep turning with it. Returns the number of draws folded away. Merged
geometry is owned by the station.
<!-- /note -->

#### <a id="s-mergeStatic-isLive"></a>`mergeStatic>isLive(o)`

function · L204–204

- called by: [`mergeStatic>mergeUnder>walk`](#s-mergeStatic-mergeUnder-walk)

<!-- note:mergeStatic>isLive -->
<!-- /note -->

#### <a id="s-mergeStatic-mergeUnder"></a>`mergeStatic>mergeUnder(node)`

function · L206–238

- calls: [`mergeGeometries`](#s-mergeGeometries) · [`mergeStatic>mergeUnder>walk`](#s-mergeStatic-mergeUnder-walk)
- called by: [`mergeStatic`](#s-mergeStatic) · [`mergeStatic>mergeUnder>walk`](#s-mergeStatic-mergeUnder-walk)

<!-- note:mergeStatic>mergeUnder -->
<!-- /note -->

##### <a id="s-mergeStatic-mergeUnder-walk"></a>`mergeStatic>mergeUnder>walk(o)`

function · L210–219

- calls: [`mergeStatic>isLive`](#s-mergeStatic-isLive) · [`mergeStatic>mergeUnder`](#s-mergeStatic-mergeUnder) · [`mergeStatic>mergeUnder>walk`](#s-mergeStatic-mergeUnder-walk)
- called by: [`mergeStatic>mergeUnder`](#s-mergeStatic-mergeUnder) · [`mergeStatic>mergeUnder>walk`](#s-mergeStatic-mergeUnder-walk)

<!-- note:mergeStatic>mergeUnder>walk -->
<!-- /note -->

### <a id="s-instanced"></a>`instanced(parent, geo, mat, items, name=)`

function · **exported** · L243–262

- called by: [`StationBuilder.bakeLamps`](../builder/StationBuilder.js.md#s-StationBuilder-bakeLamps) _js/stationgen/builder/StationBuilder.js_ · [`StationBuilder.greebles`](../builder/StationBuilder.js.md#s-StationBuilder-greebles) _js/stationgen/builder/StationBuilder.js_ ×2 · [`hangar`](../builder/hangar.js.md#s-hangar) _js/stationgen/builder/hangar.js_ · [`STYLES.bastion`](../builder/hull.js.md#s-STYLES-bastion) _js/stationgen/builder/hull.js_

<!-- note:instanced -->
---- instancing ----------------------------------------------------------

Build an InstancedMesh from a list of {x,y,z,rx,ry,rz,sx,sy,sz,color?}.
<!-- /note -->

### <a id="s-disposeOwned"></a>`disposeOwned(root)`

function · **exported** · L264–273

- called by: [`releaseStation`](../generate.js.md#s-releaseStation) _js/stationgen/generate.js_

<!-- note:disposeOwned -->
---- disposal ------------------------------------------------------------
<!-- /note -->
