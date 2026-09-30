# js/stationgen/builder/hangar.js

[index](../../../../README.md) · 151 lines · 11 symbols · 4 imports · 4 importers

## About

<!-- note:@file -->
The hangar bay — in five forms, with five mouth shapes.

Every hangar clears the biggest hull the ship generator grows (96 m long,
32 m across): the aperture always contains a 110 × 50 m rectangle and the
bay is 140 m deep. Port half of the mouth carries three entry ways, the
starboard half three exit ways; each way has a floor strip inside, a short
gantry outside with chase beads and a gate lamp. The traffic is real hulls
flying the bay (npc/bay.js), not dressing.

  bay        the bay stands proud of the hull as its own hall
  blister    a hull mass grows round the bay — sloped plate, a vault, a rounded blister — the style's shape
  recessed   the bay is cut *into* a spine: the hull is notched and the mouth is flush with the skin
  throat     the bay bores into the end of the structure along its axis: the station's own prow is the mouth
  cradle     an open frame with a roof and a floor, no walls — the yard's hangar

Mouths: rect · round · pointed (gothic) · hex · oct. The cavity is an
extruded tube with the aperture as its hole, so an arched mouth is an
arched hall inside, not a box behind a mask.

Frame: the module frame (+Y out of the hull, +Z along the structure). For
bay/blister/recessed/cradle the mouth is the +Z face (`C.flip` mirrors it
so a station's hangars face both ways); a throat's mouth faces +Y.

- L9 · `const T = 2.5;` — slab thickness
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `../core/geometry.js` | `G`, `addMesh`, `instanced`, `extrude`, `archOutline` | [js/stationgen/core/geometry.js](../core/geometry.js.md) |
| 3 | `../data/styles.js` | `roll` | [js/stationgen/data/styles.js](../data/styles.js.md) |
| 4 | `../prefabs/forms.js` | `ribGeo` | [js/stationgen/prefabs/forms.js](../prefabs/forms.js.md) |

## Imported by

- [js/stationgen/builder/StationBuilder.js](StationBuilder.js.md) — `hangar`
- [js/stationgen/builder/placement.js](placement.js.md) — `hangarPlan`, `hangarFootprint`
- [js/stationgen/generate.js](../generate.js.md) — `HANGAR`
- [js/stationgen/index.js](../index.js.md) — `HANGAR`, `MOUTHS`, `HANGAR_FORMS`, `hangarPlan`

## Exports

- [`HANGAR`](#s-HANGAR) · const — used by [js/stationgen/generate.js](../generate.js.md), [js/stationgen/index.js](../index.js.md)
- [`MOUTHS`](#s-MOUTHS) · const — used by [js/stationgen/index.js](../index.js.md)
- [`HANGAR_FORMS`](#s-HANGAR_FORMS) · const — used by [js/stationgen/index.js](../index.js.md)
- [`hangarPlan`](#s-hangarPlan) · function — used by [js/stationgen/builder/placement.js](placement.js.md), [js/stationgen/index.js](../index.js.md)
- [`hangarFootprint`](#s-hangarFootprint) · function — used by [js/stationgen/builder/placement.js](placement.js.md)
- [`hangar`](#s-hangar) · function — used by [js/stationgen/builder/StationBuilder.js](StationBuilder.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-HANGAR"></a>`HANGAR`

const · **exported** · L6–6

<!-- note:HANGAR -->
<!-- /note -->

### <a id="s-MOUTHS"></a>`MOUTHS`

const · **exported** · L7–7

<!-- note:MOUTHS -->
aperture sizes per mouth shape: each clears a 110 × 50 m box flying 6 m above the deck
<!-- /note -->

### <a id="s-HANGAR_FORMS"></a>`HANGAR_FORMS`

const · **exported** · L8–8

<!-- note:HANGAR_FORMS -->
<!-- /note -->

### <a id="s-T"></a>`T`

const · L9–9

<!-- note:T -->
<!-- /note -->

### <a id="s-hangarPlan"></a>`hangarPlan(B, s, relax=)`

function · **exported** · L11–37

- calls: [`roll`](../data/styles.js.md#s-roll) _js/stationgen/data/styles.js_ ×2
- called by: [`place`](placement.js.md#s-place) _js/stationgen/builder/placement.js_

<!-- note:hangarPlan -->
Decide how a hangar would sit on a slot: form, mouth, outer shell and how far it sinks. Pure: no rng side effects beyond one roll.

- L23 · `const form = relax && !s.nave ? (allowed.throat && s.cap ? "throat" : "bay") : roll(rng, a` — the relaxed pass wants the smallest thing that still swallows a cruiser
- L27 · `let outer = "rect", Wo = Wa + 2 * T, Ho = Ha + 2 * T;` — the outer shell: a shape the style likes, big enough round the aperture
- L35 · `const flip = form !== "throat" && (spine && !s.cap ? s.pos.z < spine.zc : (B.hangarIx ?? 0` — on a spine the mouth faces the nearer end, away from the rings and belts amidships; elsewhere hangars alternate fore and aft
<!-- /note -->

### <a id="s-hangarFootprint"></a>`hangarFootprint(plan)`

function · **exported** · L39–45

- called by: [`place`](placement.js.md#s-place) _js/stationgen/builder/placement.js_

<!-- note:hangarFootprint -->
Placement footprint for a plan on a slot: [w, h, d] in the slot frame, the lift below the surface,
and the shift along z that reserves the approach lanes in front of the mouth.

- L40 · `const lane = plan.d * HANGAR.laneLen;` — the approach stays clear of structure and modules
<!-- /note -->

### <a id="s-tubeGeo"></a>`tubeGeo(plan)`

function · L47–52

- calls: [`archOutline`](../core/geometry.js.md#s-archOutline) _js/stationgen/core/geometry.js_ ×2 · [`extrude`](../core/geometry.js.md#s-extrude) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `archOutline.map`
- called by: [`hangar`](#s-hangar)

<!-- note:tubeGeo -->
---- the tube: an outer outline extruded along z with the aperture as its hole ----
<!-- /note -->

### <a id="s-liningGeo"></a>`liningGeo(plan)`

function · L53–58

- calls: [`archOutline`](../core/geometry.js.md#s-archOutline) _js/stationgen/core/geometry.js_ ×2 · [`extrude`](../core/geometry.js.md#s-extrude) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `archOutline.map`
- called by: [`hangar`](#s-hangar)

<!-- note:liningGeo -->
a lit lining just inside the hole walls: the cavity reads as a hall from inside, invisible from outside
<!-- /note -->

### <a id="s-plateGeo"></a>`plateGeo(plan, grow=, hole=)`

function · L59–64

- calls: [`archOutline`](../core/geometry.js.md#s-archOutline) _js/stationgen/core/geometry.js_ ×2 · [`extrude`](../core/geometry.js.md#s-extrude) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `archOutline.map`
- called by: [`hangar`](#s-hangar) ×3

<!-- note:plateGeo -->
<!-- /note -->

### <a id="s-hangar"></a>`hangar(g, size, C)`

function · **exported** · L66–151

- calls: [`hangar>add`](#s-hangar-add) ×27 · [`liningGeo`](#s-liningGeo) · [`plateGeo`](#s-plateGeo) ×3 · [`tubeGeo`](#s-tubeGeo) · [`addMesh`](../core/geometry.js.md#s-addMesh) _js/stationgen/core/geometry.js_ · [`archOutline`](../core/geometry.js.md#s-archOutline) _js/stationgen/core/geometry.js_ · [`instanced`](../core/geometry.js.md#s-instanced) _js/stationgen/core/geometry.js_ · [`ribGeo`](../prefabs/forms.js.md#s-ribGeo) _js/stationgen/prefabs/forms.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cone`, `G.cyl`, `G.frustum`, `G.sphere`

<!-- note:hangar -->
- L75 · `bay.rotation.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(-1, 0,` — mouth out along +Y (the axis at an end cap), the arch's apex along +Z of the frame (world "up" on a cap)
- L84 · `add(G.box(), mats.hull, 0, T / 2, 0, 0, 0, 0, Wo + 8, T, d);` — floor, four posts, roof frame, a lattice roof — open sides
- L92 · `add(tubeGeo(plan), shell, 0, 0, 0, 0, 0, 0, 1, 1, d);` — the tube, its back plate, the mouth frame
- L96 · `const ribs = Math.max(3, Math.round(d / rng.range(18, 30)));` — ribs along the outside: arch ribs, armour bands or box frames by style
- L103 · `if (st.decor.includes("buttress")) for (let i = 0; i < ribs; i++) for (const s of [-1, 1])` — style dressing on the shell
- L107 · `add(G.box(), mats.glow, 0, Ha + T + 0.6, zm + 3.2, 0, 0, 0, Wa * 0.8, 0.5, 0.5);` — lit edge strip round the mouth and a floor lip
- L110 · `for (const s of [-1, 1]) {` — bay doors: two leaves, parted to the sides, drifting a little
- L117 · `if (form === "blister") { add(G.frustum(0.86, 4), shell, 0, 3, 0, 0, Math.PI / 4, 0, (Wo +` — an apron where a blister meets the hull
- L120 · `const laneLen = d * HANGAR.laneLen;` — the ways: three in on the port half, three out on the starboard half
- L141 · `for (let i = 0; i < 4; i++) for (const s of [-1, 1]) C.lampOn(bay, s * Wa * 0.3, Ha + T *` — floods on the roof, a lamp at each way's gate
- L143 · `for (const wy of ways) {` — 0.3.15: no scenery traffic. The box shuttles that looped the ways and the
  parked box tug were stand-ins for hulls that vanished at the mouth; the
  real ones fly the bay now (npc/bay.js). The draws they made are still
  made, so every seed grows the same hull it always did.
- L148 · `if (form !== "cradle") { const crane = addMesh(bay, G.box(), mats.metal, 0, Ha + T * 0.4,` — a crane on the roof rails
<!-- /note -->

#### <a id="s-hangar-add"></a>`hangar>add(geo, mat, ...a)`

function · L79–79

- calls: [`addMesh`](../core/geometry.js.md#s-addMesh) _js/stationgen/core/geometry.js_
- called by: [`hangar`](#s-hangar) ×27

<!-- note:hangar>add -->
<!-- /note -->
