# js/shipgen/builder/placement.js

[index](../../../../README.md) · 258 lines · 22 symbols · 9 imports · 1 importers

## About

<!-- note:@file -->
StarshipBuilder mixin — Occupancy (AABB) solver and loadout mounting.
Methods are installed onto StarshipBuilder.prototype by src/builder/StarshipBuilder.js.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `../core/rng.js` | `RNG` | [js/shipgen/core/rng.js](../core/rng.js.md) |
| 3 | `../core/geometry.js` | `G` **unused**, `makeMat` **unused**, `addMesh` **unused**, `wingShape` **unused** | [js/shipgen/core/geometry.js](../core/geometry.js.md) |
| 4 | `./faces.js` | `faceNormal`, `faceEuler`, `faceRotation` **unused** | [js/shipgen/builder/faces.js](faces.js.md) |
| 5 | `../data/drives.js` | `DRIVE_TYPES` **unused** | [js/shipgen/data/drives.js](../data/drives.js.md) |
| 6 | `../data/weapons.js` | `WEAPON_TYPES` **unused** | [js/shipgen/data/weapons.js](../data/weapons.js.md) |
| 7 | `../data/catalog/index.js` | `PARTS` | [js/shipgen/data/catalog/index.js](../data/catalog/index.js.md) |
| 8 | `../prefabs/index.js` | `PREFABS`, `ALL_FACES`, `fpArea` | [js/shipgen/prefabs/index.js](../prefabs/index.js.md) |
| 9 | `../data/environment.js` | `sunExposure` | [js/shipgen/data/environment.js](../data/environment.js.md) |

## Imported by

- [js/shipgen/builder/StarshipBuilder.js](StarshipBuilder.js.md) — `default`

## Exports

- [`CONFORMAL_FLAGS`](#s-CONFORMAL_FLAGS) · const — **no importer in scanned roots**
- [`partPrio`](#s-partPrio) · function — **no importer in scanned roots**
- [`workzoneBox`](#s-workzoneBox) · function — **no importer in scanned roots**
- [`shapeOk`](#s-shapeOk) · function — **no importer in scanned roots**
- `default` · ObjectExpression — used by [js/shipgen/builder/StarshipBuilder.js](StarshipBuilder.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-CONFORMAL_FLAGS"></a>`CONFORMAL_FLAGS`

const · **exported** · L11–18

<!-- note:CONFORMAL_FLAGS -->
conformal substitutions for hulls that fly through air: same part, flush geometry

- L12 · `dish:      { flush: true },` — parabolic dish → conformal phased-array plate
- L13 · `radome:    { flush: true },` — tall radome → low blister
- L14 · `mast:      { flush: true },` — whip → blade antenna
- L15 · `sensorPod: { flush: true },` — spinning drum → flat aperture window
- L16 · `optic:     { flush: true },` — gimballed tube → recessed window
- L17 · `scanner:   { flush: true }` — sweep head → low fairing with a window
<!-- /note -->

### <a id="s-partPrio"></a>`partPrio(p)`

function · **exported** · L20–25

- called by: [`mountEvicting>evictable`](#s-mountEvicting-evictable) · [`mountLoadout`](#s-mountLoadout) ×2 · [`mountPart`](#s-mountPart)

<!-- note:partPrio -->
mounting priority: connection + mining hardware first, then heavy systems, then sensors, then fluff
<!-- /note -->

### <a id="s-workzoneBox"></a>`workzoneBox(g, wz)`

function · **exported** · L27–35

- called by: [`buildAt`](#s-buildAt)

<!-- note:workzoneBox -->
world-space AABB of a prefab's declared work zone (local box on the prefab's node)
<!-- /note -->

### <a id="s-shapeOk"></a>`shapeOk(V, face, u, v)`

function · **exported** · L37–44

- called by: [`place>tryAt`](#s-place-tryAt)

<!-- note:shapeOk -->
curved hull volumes only accept mounts where the bounding box actually touches the surface:
cylinders (axis along the ship) on the tangent band of each side face and inside the end discs,
spheres only around the six tangent points.
<!-- /note -->

### <a id="s-occInit"></a>`occInit(root)`

prop · L47–65

<!-- note:occInit -->
================================================================

OCCUPANCY — every placed object owns an AABB; nothing overlaps

================================================================

- L54 · `b.expandByScalar(-Math.min(v.w, v.h, v.d) * 0.06);` — mounts may sit flush on the skin
- L57 · `for (const e of this.enginePods || []) {` — exhaust plumes are exclusion zones: nothing mounts inside a drive's cone aft of the nozzle
- L61 · `for (const c of root.children) {` — nose, drives, wings and loose superstructure meshes are real obstacles too
- L62 · `if (c.name === "armor") { for (const m of c.children) this.occAddObject(m, "armor"); conti` — slab by slab, not one giant box
<!-- /note -->

### <a id="s-occAddObject"></a>`occAddObject(obj, tag)`

prop · L67–70

<!-- note:occAddObject -->
<!-- /note -->

### <a id="s-occFree"></a>`occFree(box, margin, ignore)`

prop · L72–75

- calls: [`place>tryAt>ignore`](#s-place-tryAt-ignore)

<!-- note:occFree -->
<!-- /note -->

### <a id="s-fpBox"></a>`fpBox(face, pos, fp)`

prop · L77–83

- calls: [`faceNormal`](faces.js.md#s-faceNormal) _js/shipgen/builder/faces.js_

<!-- note:fpBox -->
<!-- /note -->

### <a id="s-faceExtents"></a>`faceExtents(face, V)`

prop · L85–87

<!-- note:faceExtents -->
<!-- /note -->

### <a id="s-place"></a>`place(face, u, v, fp, opts=)`

prop · L89–123

- calls: [`place>tryAt`](#s-place-tryAt) ×3

<!-- note:place -->
find a free spot on a face near (u,v); spirals outward if occupied

- L94 · `const vMin = opts.overhang ? -(1 + 0.45 * fp.d / vL) : -vMax;` — booms may overhang the leading edge (negative v = toward the bow)
- L113 · `if (!r) {` — locality failed: sweep the whole face on a footprint-sized grid
<!-- /note -->

#### <a id="s-place-tryAt"></a>`place>tryAt(uu, vv)`

function · L97–104

- calls: [`shapeOk`](#s-shapeOk)
- called by: [`place`](#s-place) ×3

<!-- note:place>tryAt -->
<!-- /note -->

##### <a id="s-place-tryAt-ignore"></a>`place>tryAt>ignore(o)`

function · L102–102

- called by: [`occFree`](#s-occFree)

<!-- note:place>tryAt>ignore -->
the volume we stand on is never an obstacle to what stands on it
<!-- /note -->

### <a id="s-mountLoadout"></a>`mountLoadout(root)`

prop · L125–138

- calls: [`partPrio`](#s-partPrio) ×2 · [`fpArea`](../prefabs/index.js.md#s-fpArea) _js/shipgen/prefabs/index.js_ ×2

<!-- note:mountLoadout -->
================================================================

LOADOUT — mount every catalog part in the manifest

================================================================

- L134 · `entries.sort((a, b) => (partPrio(b) - partPrio(a)) || (fpArea(b) - fpArea(a)) || a.id.loca` — mission-critical hardware first, then biggest footprints; stable tiebreak keeps seeds reproducible
<!-- /note -->

### <a id="s-mountPart"></a>`mountPart(grp, p)`

prop · L140–145

- calls: [`partPrio`](#s-partPrio)

<!-- note:mountPart -->
- L141 · `for (const k of [1, 0.8, 0.64]) if (this.mountScaled(grp, p, k)) return true;` — full-size unit first; if no face has clearance, refit a compact variant before giving up
- L142 · `if (partPrio(p) >= 3 && this.mountEvicting(grp, p)) return true;` — connection hardware must always fit: displace low-priority kit to make room
<!-- /note -->

### <a id="s-mountEvicting"></a>`mountEvicting(grp, p)`

prop · L146–166

- calls: [`mountEvicting>evictable`](#s-mountEvicting-evictable)

<!-- note:mountEvicting -->
<!-- /note -->

#### <a id="s-mountEvicting-evictable"></a>`mountEvicting>evictable(o)`

function · L150–150

- calls: [`partPrio`](#s-partPrio)
- called by: [`mountEvicting`](#s-mountEvicting)

<!-- note:mountEvicting>evictable -->
<!-- /note -->

### <a id="s-evict"></a>`evict(m, by)`

prop · L167–174

<!-- note:evict -->
<!-- /note -->

### <a id="s-adaptPart"></a>`adaptPart(p)`

prop · L176–183

<!-- note:adaptPart -->
regime adapts the part before it is built: flush sensors in airflow, edge-on wings in VLEO
<!-- /note -->

### <a id="s-mountScaled"></a>`mountScaled(grp, p0, k)`

prop · L184–230

- calls: [`sunExposure`](../data/environment.js.md#s-sunExposure) _js/shipgen/data/environment.js_ ×4

<!-- note:mountScaled -->
- L189 · `if (this.aero && this.aero.noVentral && !p.tags.includes("landing")) faces = faces.filter(` — re-entry: nothing hangs below the shield line except the landing gear
- L190 · `if (this.aero && (this.aero.fairings) && !p.tags.includes("mining")) faces = faces.filter(` — streamlined regimes: no equipment on the bow face (it would sit in the stagnation flow)
- L193 · `const bias = p.tags.includes("dock") ? ["port", "star", "bottom", "top"]` — doctrine bias: sensors ride high, docks and mining ride low or forward
- L196 · `let start = rng.int(0, Math.max(0, order.length - 1));` — light logic: solar collectors take the sunlit faces, radiators the shaded ones — strictly, no seed rotation
- L200 · `const u0 = p.sun === "seek" ? 0.6 : p.sun === "avoid" ? -0.6 : rng.range(-0.75, 0.75);` — wings ride the outer edge of the flank (u toward the sunlit / shaded edge) so nothing dorsal shades them
- L201 · `const tall = pf.fp(s, p, faces[0]).h > this.U * 1.2;` — streamlined hulls keep tall kit aft, in the lee of the nose; everything else may sit anywhere
- L209 · `for (let attempt = 0; attempt < 6; attempt++) {` — a part with a work zone (drill) may need several tries: its zone must not swallow other kit
<!-- /note -->

### <a id="s-zoneClear"></a>`zoneClear(mount)`

prop · L231–235

<!-- note:zoneClear -->
true when the mount's work zone (if any) touches no other mounted part
<!-- /note -->

### <a id="s-unbuild"></a>`unbuild(mount)`

prop · L236–241

<!-- note:unbuild -->
<!-- /note -->

### <a id="s-buildAt"></a>`buildAt(grp, p, pf, s, spot, mirror, k=)`

prop · L242–257

- calls: [`faceEuler`](faces.js.md#s-faceEuler) _js/shipgen/builder/faces.js_ · [`faceNormal`](faces.js.md#s-faceNormal) _js/shipgen/builder/faces.js_ · [`workzoneBox`](#s-workzoneBox) · [`new RNG`](../core/rng.js.md#s-RNG) _js/shipgen/core/rng.js_

<!-- note:buildAt -->
- L253 · `const wz = g.userData.workzone;` — parts that need clear space around them (drill cutting envelope) reserve it as an obstacle
<!-- /note -->
