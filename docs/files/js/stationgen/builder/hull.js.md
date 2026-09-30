# js/stationgen/builder/hull.js

[index](../../../../README.md) · 476 lines · 21 symbols · 4 imports · 3 importers

## About

<!-- note:@file -->
Hull grammars — the bones a station's modules hang on.

Every style lays its long axis along +Z: command end at −Z (zone 0),
power end at +Z (zone 1). Each returns the structure it drew plus the
slot list the placement solver fills and the AABBs it must not intrude on.

  spindle    a pressurised spine, one rotating ring, a boom past the power end
  torus      a wide ring on spokes about a short hub — the agricultural classic
  lattice    an open truss keel with a small pressurised core; everything bolts on
  cross      a hub with radial arms in the plane, nodes at the tips
  drum       a long spine carrying the Tier III habitat drum amidships
  cluster    pressurised pods on a despun mast, joined by tubes
  cathedral  a nave with aisles, flying buttresses, a transept, a crossing spire,
             twin west towers and a rose window over the great door — the hangar
  bastion    an armoured octagonal core with a citadel belt, star-fort arms with
             faceted bastions at the tips, and a prow for the spinal gun
  ziggurat   a stepped hulk of welded holds, terraces on every face

Spines are drawn *after* placement so a recessed hangar can notch the
skin and a throat can trim the end. A ring or a drum is added to any
style when the manifest calls for one. Every grammar rolls its own
proportions and counts, so no two hulls of a style match.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `../core/geometry.js` | `G`, `latheOf`, `addMesh`, `trussGeometry`, `extrude`, `extrudeOwned`, `archOutline`, `bittenDisc`, `instanced` | [js/stationgen/core/geometry.js](../core/geometry.js.md) |
| 3 | `./frames.js` | `slot` | [js/stationgen/builder/frames.js](frames.js.md) |
| 4 | `../prefabs/forms.js` | `vaultGeo`, `ribGeo` | [js/stationgen/prefabs/forms.js](../prefabs/forms.js.md) |

## Imported by

- [js/stationgen/builder/StationBuilder.js](StationBuilder.js.md) — `STYLES`, `habitatDrum`
- [js/stationgen/generate.js](../generate.js.md) — `STYLES`
- [js/stationgen/index.js](../index.js.md) — `STYLES`

## Exports

- [`STYLES`](#s-STYLES) · const — used by [js/stationgen/builder/StationBuilder.js](StationBuilder.js.md), [js/stationgen/generate.js](../generate.js.md), [js/stationgen/index.js](../index.js.md)
- [`habitatDrum`](#s-habitatDrum) · function — used by [js/stationgen/builder/StationBuilder.js](StationBuilder.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-V"></a>`V(x, y, z)`

function · L6–6

- called by: [`STYLES.bastion`](#s-STYLES-bastion) ×9 · [`STYLES.cathedral`](#s-STYLES-cathedral) ×33 · [`STYLES.cluster`](#s-STYLES-cluster) ×2 · [`STYLES.lattice`](#s-STYLES-lattice) ×3 · [`STYLES.spindle`](#s-STYLES-spindle) ×2 · [`STYLES.ziggurat`](#s-STYLES-ziggurat) ×6 · [`Z`](#s-Z) · [`arm`](#s-arm) ×3 · [`boom`](#s-boom) ×3 · [`endSlots`](#s-endSlots) ×4 · [`habitatDrum`](#s-habitatDrum) ×6 · [`ring`](#s-ring) ×10 · [`spine`](#s-spine) ×3

<!-- note:V -->
<!-- /note -->

### <a id="s-Z"></a>`Z`

const · L7–7

- calls: [`V`](#s-V)

<!-- note:Z -->
<!-- /note -->

### <a id="s-PI"></a>`PI`

const · L8–8

<!-- note:PI -->
<!-- /note -->

### <a id="s-H"></a>`H`

const · L8–8

<!-- note:H -->
<!-- /note -->

### <a id="s-spine"></a>`spine(B, root, R, L, z0, opts=)`

function · L10–64

- calls: [`slot`](frames.js.md#s-slot) _js/stationgen/builder/frames.js_ · [`V`](#s-V) ×3 · [`addMesh`](../core/geometry.js.md#s-addMesh) _js/stationgen/core/geometry.js_ ×8 · [`bittenDisc`](../core/geometry.js.md#s-bittenDisc) _js/stationgen/core/geometry.js_ · [`extrudeOwned`](../core/geometry.js.md#s-extrudeOwned) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.torus`
- called by: [`STYLES.bastion`](#s-STYLES-bastion) · [`STYLES.cross`](#s-STYLES-cross) · [`STYLES.drum`](#s-STYLES-drum) · [`STYLES.lattice`](#s-STYLES-lattice) · [`STYLES.spindle`](#s-STYLES-spindle) · [`STYLES.torus`](#s-STYLES-torus)

<!-- note:spine -->
---- shared pieces -------------------------------------------------------

A pressurised spine along Z: segments with bulkhead rings, and grid slots on its skin.
Drawing is deferred (B.deferred) so hangars placed on it can notch or trim it.

- L19 · `const segs = [];` — per-segment looks rolled now (deterministic), drawn later
- L27 · `const cuts = [Math.max(a, zStart), Math.min(b, zEnd)];` — split the segment where notches start and end, so a bite is exactly as long as its bay
- L44 · `if (form === "ribbed") for (let k = 0; k < 6; k++) { const t = (k / 6) * PI * 2; addMesh(g` — style dressing along the segment
- L51 · `const around = opts.around ?? Math.max(6, Math.min(12, Math.round(R / 4)));` — skin slots: rows along Z, spokes around
<!-- /note -->

### <a id="s-ring"></a>`ring(B, root, R, tube, z, spokes=)`

function · L66–98

- calls: [`slot`](frames.js.md#s-slot) _js/stationgen/builder/frames.js_ · [`ring>rimOwner`](#s-ring-rimOwner) · [`V`](#s-V) ×10 · [`addMesh`](../core/geometry.js.md#s-addMesh) _js/stationgen/core/geometry.js_ ×6 · [`trussGeometry`](../core/geometry.js.md#s-trussGeometry) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.torus`
- called by: [`STYLES.bastion`](#s-STYLES-bastion) · [`STYLES.cathedral`](#s-STYLES-cathedral) · [`STYLES.cluster`](#s-STYLES-cluster) · [`STYLES.cross`](#s-STYLES-cross) · [`STYLES.drum`](#s-STYLES-drum) · [`STYLES.lattice`](#s-STYLES-lattice) · [`STYLES.spindle`](#s-STYLES-spindle) · [`STYLES.torus`](#s-STYLES-torus) ×2 · [`STYLES.ziggurat`](#s-STYLES-ziggurat)

<!-- note:ring -->
A spin ring at z: torus + spokes + a hub collar. Slots on the outer rim (ring) and rim faces.

- L85 · `const own = new THREE.Box3(V(-R - tube, R - tube, z - tube), V(R + tube, R + tube, z + tub` — occupancy: the rim as four boxes, so the middle (spokes only) stays free for the spine's own business
<!-- /note -->

#### <a id="s-ring-rimOwner"></a>`ring>rimOwner(a)`

function · L87–87

- called by: [`ring`](#s-ring)

<!-- note:ring>rimOwner -->
<!-- /note -->

### <a id="s-boom"></a>`boom(B, root, z0, L, width=, name=)`

function · L100–117

- calls: [`slot`](frames.js.md#s-slot) _js/stationgen/builder/frames.js_ · [`V`](#s-V) ×3 · [`addMesh`](../core/geometry.js.md#s-addMesh) _js/stationgen/core/geometry.js_ · [`trussGeometry`](../core/geometry.js.md#s-trussGeometry) _js/stationgen/core/geometry.js_
- called by: [`STYLES.bastion`](#s-STYLES-bastion) · [`STYLES.cathedral`](#s-STYLES-cathedral) · [`STYLES.cluster`](#s-STYLES-cluster) · [`STYLES.cross`](#s-STYLES-cross) · [`STYLES.drum`](#s-STYLES-drum) · [`STYLES.lattice`](#s-STYLES-lattice) · [`STYLES.spindle`](#s-STYLES-spindle) · [`STYLES.torus`](#s-STYLES-torus) · [`STYLES.ziggurat`](#s-STYLES-ziggurat)

<!-- note:boom -->
A truss boom along Z from z0 for length L, with slots on all four faces.
<!-- /note -->

### <a id="s-arm"></a>`arm(B, root, a, L, z, width=, o=)`

function · L119–155

- calls: [`slot`](frames.js.md#s-slot) _js/stationgen/builder/frames.js_ ×3 · [`V`](#s-V) ×3 · [`addMesh`](../core/geometry.js.md#s-addMesh) _js/stationgen/core/geometry.js_ ×5 · [`latheOf`](../core/geometry.js.md#s-latheOf) _js/stationgen/core/geometry.js_ · [`trussGeometry`](../core/geometry.js.md#s-trussGeometry) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.frustum`, `G.ico`, `G.sphere`
- called by: [`STYLES.bastion`](#s-STYLES-bastion) · [`STYLES.cross`](#s-STYLES-cross)

<!-- note:arm -->
A radial arm from the axis in the XY plane at angle a, out to length L, with slots along its top/bottom.

- L124 · `addMesh(g, G.frustum(0.6, 4), mats.armour, dir.x * L * 0.5, dir.y * L * 0.5, z, 0, 0, a -` — a wedge arm: a tapered armoured box
- L124 · `addMesh(g, G.frustum(0.6, 4), mats.armour, dir.x * L * 0.5, dir.y * L * 0.5, z, 0, 0, a -` — a diamond section: sloped faces
- L135 · `const r0 = o.from ?? 0;` — occupancy in short lengths along the arm, so a diagonal arm does not fence off the whole quadrant
<!-- /note -->

### <a id="s-endSlots"></a>`endSlots(B, zMin, zMax, R, sp=)`

function · L157–161

- calls: [`slot`](frames.js.md#s-slot) _js/stationgen/builder/frames.js_ ×2 · [`V`](#s-V) ×4
- called by: [`STYLES.cluster`](#s-STYLES-cluster) · [`STYLES.cross`](#s-STYLES-cross) · [`STYLES.drum`](#s-STYLES-drum) · [`STYLES.lattice`](#s-STYLES-lattice) · [`STYLES.spindle`](#s-STYLES-spindle) · [`STYLES.torus`](#s-STYLES-torus) · [`STYLES.ziggurat`](#s-STYLES-ziggurat)

<!-- note:endSlots -->
End caps: a slot facing straight along the axis at each end.
<!-- /note -->

### <a id="s-STYLES"></a>`STYLES`

const · **exported** · L163–434

<!-- note:STYLES -->
---- styles ----------------------------------------------------------------
<!-- /note -->

#### <a id="s-STYLES-spindle"></a>`STYLES.spindle(B, root, needs)`

prop · L164–176

- calls: [`boom`](#s-boom) · [`endSlots`](#s-endSlots) · [`ring`](#s-ring) · [`spine`](#s-spine) · [`V`](#s-V) ×2 · [`addMesh`](../core/geometry.js.md#s-addMesh) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:STYLES.spindle -->
- L174 · `if (rng.chance(0.4)) {` — a keel fin
<!-- /note -->

#### <a id="s-STYLES-torus"></a>`STYLES.torus(B, root, needs)`

prop · L177–188

- calls: [`boom`](#s-boom) · [`endSlots`](#s-endSlots) · [`ring`](#s-ring) ×2 · [`spine`](#s-spine)

<!-- note:STYLES.torus -->
<!-- /note -->

#### <a id="s-STYLES-lattice"></a>`STYLES.lattice(B, root, needs)`

prop · L189–211

- calls: [`slot`](frames.js.md#s-slot) _js/stationgen/builder/frames.js_ · [`boom`](#s-boom) · [`endSlots`](#s-endSlots) · [`ring`](#s-ring) · [`spine`](#s-spine) · [`V`](#s-V) ×3 · [`addMesh`](../core/geometry.js.md#s-addMesh) _js/stationgen/core/geometry.js_ · [`trussGeometry`](../core/geometry.js.md#s-trussGeometry) _js/stationgen/core/geometry.js_

<!-- note:STYLES.lattice -->
<!-- /note -->

#### <a id="s-STYLES-cross"></a>`STYLES.cross(B, root, needs)`

prop · L212–226

- calls: [`arm`](#s-arm) · [`boom`](#s-boom) · [`endSlots`](#s-endSlots) · [`ring`](#s-ring) · [`spine`](#s-spine)

<!-- note:STYLES.cross -->
<!-- /note -->

#### <a id="s-STYLES-drum"></a>`STYLES.drum(B, root, needs)`

prop · L227–235

- calls: [`boom`](#s-boom) · [`endSlots`](#s-endSlots) · [`ring`](#s-ring) · [`spine`](#s-spine)

<!-- note:STYLES.drum -->
- L228 · `const L = B.L * 1.6, R = B.R * (needs.drum ? 0.8 : 1.4);` — without the drum to carry, the spine is a fatter city core
<!-- /note -->

#### <a id="s-STYLES-cluster"></a>`STYLES.cluster(B, root, needs)`

prop · L236–266

- calls: [`slot`](frames.js.md#s-slot) _js/stationgen/builder/frames.js_ · [`boom`](#s-boom) · [`endSlots`](#s-endSlots) · [`ring`](#s-ring) · [`V`](#s-V) ×2 · [`addMesh`](../core/geometry.js.md#s-addMesh) _js/stationgen/core/geometry.js_ ×5 · [`latheOf`](../core/geometry.js.md#s-latheOf) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.ico`, `G.sphere`, `G.torus`

<!-- note:STYLES.cluster -->
<!-- /note -->

#### <a id="s-STYLES-cathedral"></a>`STYLES.cathedral(B, root, needs)`

prop · L268–357

- calls: [`slot`](frames.js.md#s-slot) _js/stationgen/builder/frames.js_ ×10 · [`boom`](#s-boom) · [`ring`](#s-ring) · [`V`](#s-V) ×33 · [`addMesh`](../core/geometry.js.md#s-addMesh) _js/stationgen/core/geometry.js_ ×17 · [`archOutline`](../core/geometry.js.md#s-archOutline) _js/stationgen/core/geometry.js_ · [`extrude`](../core/geometry.js.md#s-extrude) _js/stationgen/core/geometry.js_ · [`ribGeo`](../prefabs/forms.js.md#s-ribGeo) _js/stationgen/prefabs/forms.js_ ×2 · [`vaultGeo`](../prefabs/forms.js.md#s-vaultGeo) _js/stationgen/prefabs/forms.js_ ×3
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cone`, `G.cyl`, `G.dome`, `G.torus`

<!-- note:STYLES.cathedral -->
the cathedral: nave, aisles, buttresses, transept, crossing spire, west towers, rose, apse

- L271 · `const W = Math.max(150, R * rng.range(2.6, 3.2)), Hn = Math.max(190, R * rng.range(3.8, 4.` — nave section: always wide enough for the great door
- L276 · `B.deferred.push(() => {` — the nave body is drawn after placement so the great door (a throat hangar) can trim it
- L283 · `for (const s of [-1, 1]) {` — flying buttresses: a pier out from each aisle and a strut up to the clerestory
- L292 · `const win = extrude("win:pointed", archOutline("pointed", 1, 1), 1, [], { curveSegments: 6` — window bands along the clerestory: lit, pointed
- L297 · `const Wa = R * rng.range(1.0, 1.4), Ha = Hn * 0.42;` — aisles: lower round vaults along both sides
- L306 · `const rows = Math.max(4, Math.round(Ln / 50));` — nave roof ridge and floor: rows of big slots; clerestory walls: side slots
- L313 · `const zc = z0 + Ln * rng.range(0.58, 0.7), Wt = W * 0.9, Ht = Hn * 0.92, Lt = W * rng.rang` — transept across the nave, and the crossing: a lantern with spires both ways
- L332 · `const tw = R * rng.range(0.9, 1.2), th = Hn * rng.range(1.15, 1.4);` — west front: twin towers flanking the great door, a rose window above it
- L347 · `B.slots.push(slot("end", V(0, 0, z0 - 1), Z.clone().negate(), V(0, 1, 0), 0, { width: W, c` — the great west door: the nave's own end slot, marked so the hangar bores in as a throat
- L348 · `addMesh(root, G.dome(24), mats.hull, 0, 0, z0 + Ln, H, 0, 0, W / 2, W / 2, Hn / 2);` — apse and the power boom behind it
- L350 · `const Rd = Math.min(330, Math.max(R * 4.5, 120)), LdMax = Rd * 1.5;` — the halo: a ring about the apse; a Tier III drum sits behind it on a longer boom
<!-- /note -->

#### <a id="s-STYLES-bastion"></a>`STYLES.bastion(B, root, needs)`

prop · L359–389

- calls: [`slot`](frames.js.md#s-slot) _js/stationgen/builder/frames.js_ ×3 · [`arm`](#s-arm) · [`boom`](#s-boom) · [`ring`](#s-ring) · [`spine`](#s-spine) · [`V`](#s-V) ×9 · [`addMesh`](../core/geometry.js.md#s-addMesh) _js/stationgen/core/geometry.js_ ×4 · [`instanced`](../core/geometry.js.md#s-instanced) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.taper`

<!-- note:STYLES.bastion -->
the bastion: armoured octagonal core, citadel belt, star-fort arms, faceted bastions, a prow

- L364 · `const zc = z0 + L * (needs.drum ? 0.72 : rng.range(0.42, 0.55)), Rc = R * rng.range(1.9, 2` — the citadel: a belt of sloped plate amidships, hard points on its faces
- L372 · `const arms = rng.pick([4, 4, 5, 6]);` — star-fort arms with faceted bastions
- L376 · `const plates = [];` — armour belts on the core between the arms and the prow
- L380 · `const pL = R * rng.range(1.4, 2.2);` — the prow: an armoured cone with the spinal gun's slot at its tip
- L384 · `boom(B, root, z0 + L * 0.9, L * 0.1 + B.L * 0.12, R * 0.55);` — stern boom and its cap
<!-- /note -->

#### <a id="s-STYLES-ziggurat"></a>`STYLES.ziggurat(B, root, needs)`

prop · L391–433

- calls: [`slot`](frames.js.md#s-slot) _js/stationgen/builder/frames.js_ ×2 · [`boom`](#s-boom) · [`endSlots`](#s-endSlots) · [`ring`](#s-ring) · [`V`](#s-V) ×6 · [`addMesh`](../core/geometry.js.md#s-addMesh) _js/stationgen/core/geometry.js_ ×5
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.frustum`

<!-- note:STYLES.ziggurat -->
the ziggurat: a stepped hulk — tiers of welded holds along the axis, terraces on every face

- L401 · `const k = 1 - Math.abs(i - (tiers - 1) / 2) / ((tiers - 1) / 2 + 0.6);` — fattest in the middle
- L413 · `const cols = Math.max(1, Math.round(len / 40));` — terraces: slots on all four faces of this tier
- L425 · `boom(B, root, z0, L, R * 0.5, "keel");` — a keel girder the length of the hulk, a mast off the fat tier
<!-- /note -->

### <a id="s-habitatDrum"></a>`habitatDrum(B, root, z, R)`

function · **exported** · L436–476

- calls: [`slot`](frames.js.md#s-slot) _js/stationgen/builder/frames.js_ ×2 · [`V`](#s-V) ×6 · [`addMesh`](../core/geometry.js.md#s-addMesh) _js/stationgen/core/geometry.js_ ×7
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.torus`, `G.tube`
- called by: [`StationBuilder.build`](StationBuilder.js.md#s-StationBuilder-build) _js/stationgen/builder/StationBuilder.js_

<!-- note:habitatDrum -->
The Tier III habitat drum: a rotating cylinder about the spine with end plates, bearings and window bands.

- L447 · `addMesh(g, G.cyl(32), mats.dark, 0, 0, s * (Ld * 0.5 + R * 0.8), H, 0, 0, R * 1.6, R * 1.6` — bearing housings
<!-- /note -->
