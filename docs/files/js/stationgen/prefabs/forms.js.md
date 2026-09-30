# js/stationgen/prefabs/forms.js

[index](../../../../README.md) · 311 lines · 48 symbols · 2 imports · 4 importers

## About

<!-- note:@file -->
Body forms and decorative kits — the shape grammar every module prefab
draws with. A prefab asks for a body of a family-appropriate form; the
style weights which forms are likely and the rng rolls the proportions,
segment counts, tiers and profiles, so every instance is its own shape.

Frame: origin on the mount surface, +Y out of the hull, +Z along the
structure, +X across. A form draws inside [−w/2, w/2] × [0, h] × [−d/2, d/2]
and returns the envelope it actually used, which the kits and decor hang on:

  { kind, w, h, d, top, faces: { px, nx, pz, nz } }   faces = half-extents where a side kit can attach
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../core/geometry.js` | `G`, `PROFILES`, `lathe`, `latheOf`, `extrude`, `archOutline` | [js/stationgen/core/geometry.js](../core/geometry.js.md) |
| 2 | `../data/styles.js` | `roll` | [js/stationgen/data/styles.js](../data/styles.js.md) |

## Imported by

- [js/stationgen/builder/hangar.js](../builder/hangar.js.md) — `ribGeo`
- [js/stationgen/builder/hull.js](../builder/hull.js.md) — `vaultGeo`, `ribGeo`
- [js/stationgen/index.js](../index.js.md) — `FORMS`, `FORM_KEYS`, `DECOR`, `body`, `decorate`
- [js/stationgen/prefabs/modules.js](modules.js.md) — `FORMS`, `body`, `decorate`

## Exports

- [`vaultGeo`](#s-vaultGeo) — used by [js/stationgen/builder/hull.js](../builder/hull.js.md)
- [`ribGeo`](#s-ribGeo) — used by [js/stationgen/builder/hangar.js](../builder/hangar.js.md), [js/stationgen/builder/hull.js](../builder/hull.js.md)
- [`FORMS`](#s-FORMS) · const — used by [js/stationgen/index.js](../index.js.md), [js/stationgen/prefabs/modules.js](modules.js.md)
- [`FORM_KEYS`](#s-FORM_KEYS) · const — used by [js/stationgen/index.js](../index.js.md)
- [`pickForm`](#s-pickForm) · function — **no importer in scanned roots**
- [`body`](#s-body) · function — used by [js/stationgen/index.js](../index.js.md), [js/stationgen/prefabs/modules.js](modules.js.md)
- [`DECOR`](#s-DECOR) · const — used by [js/stationgen/index.js](../index.js.md)
- [`decorate`](#s-decorate) · function — used by [js/stationgen/index.js](../index.js.md), [js/stationgen/prefabs/modules.js](modules.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-PI"></a>`PI`

const · L4–4

<!-- note:PI -->
<!-- /note -->

### <a id="s-H"></a>`H`

const · L4–4

<!-- note:H -->
<!-- /note -->

### <a id="s-env"></a>`env(kind, w, h, d, extra=)`

function · L5–5

- called by: [`FORMS.barrel`](#s-FORMS-barrel) · [`FORMS.block`](#s-FORMS-block) · [`FORMS.cluster`](#s-FORMS-cluster) · [`FORMS.cradle`](#s-FORMS-cradle) · [`FORMS.dome`](#s-FORMS-dome) · [`FORMS.faceted`](#s-FORMS-faceted) · [`FORMS.keep`](#s-FORMS-keep) · [`FORMS.lantern`](#s-FORMS-lantern) · [`FORMS.prism`](#s-FORMS-prism) ×2 · [`FORMS.spindle`](#s-FORMS-spindle) · [`FORMS.stack`](#s-FORMS-stack) · [`FORMS.vault`](#s-FORMS-vault) · [`FORMS.wedge`](#s-FORMS-wedge)

<!-- note:env -->
<!-- /note -->

### <a id="s-vaultGeo"></a>`vaultGeo(kind)`

function · **exported** · L7–7

- calls: [`archOutline`](../core/geometry.js.md#s-archOutline) _js/stationgen/core/geometry.js_ · [`extrude`](../core/geometry.js.md#s-extrude) _js/stationgen/core/geometry.js_
- called by: [`STYLES.cathedral`](../builder/hull.js.md#s-STYLES-cathedral) _js/stationgen/builder/hull.js_ ×3 · [`FORMS.vault`](#s-FORMS-vault)

<!-- note:vaultGeo -->
---- unit outlines (cached geometry, scaled per mesh) ------------------------
<!-- /note -->

### <a id="s-ribGeo"></a>`ribGeo(kind, t=)`

function · **exported** · L8–8

- calls: [`archOutline`](../core/geometry.js.md#s-archOutline) _js/stationgen/core/geometry.js_ ×2 · [`extrude`](../core/geometry.js.md#s-extrude) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `archOutline.map`
- called by: [`hangar`](../builder/hangar.js.md#s-hangar) _js/stationgen/builder/hangar.js_ · [`STYLES.cathedral`](../builder/hull.js.md#s-STYLES-cathedral) _js/stationgen/builder/hull.js_ ×2 · [`FORMS.vault`](#s-FORMS-vault)

<!-- note:ribGeo -->
<!-- /note -->

### <a id="s-FORMS"></a>`FORMS`

const · **exported** · L11–186

<!-- note:FORMS -->
---- the forms ----------------------------------------------------------------
<!-- /note -->

#### <a id="s-FORMS-block"></a>`FORMS.block(C, w, h, d)`

prop · L12–21

- calls: [`env`](#s-env)
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:FORMS.block -->
a pressurised block: plinth, main box, chamfer rails, sometimes an ell

- L17 · `for (const sx of [-1, 1]) C.add(G.box(), mats.dark, sx * bw * 0.5, 2 + bh, 0, 0, 0, 0, 1.4` — chamfer rails on the long edges
<!-- /note -->

#### <a id="s-FORMS-barrel"></a>`FORMS.barrel(C, w, h, d, o=)`

prop · L22–39

- calls: [`latheOf`](../core/geometry.js.md#s-latheOf) _js/stationgen/core/geometry.js_ · [`env`](#s-env)
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.torus`

<!-- note:FORMS.barrel -->
one to three lathed vessels along the long axis, on saddles

- L35 · `for (const s of [-1, 1]) C.add(G.torus(0.06, 6, 24), mats.metal, alongX ? s * L * 0.42 : x` — end collars
<!-- /note -->

#### <a id="s-FORMS-spindle"></a>`FORMS.spindle(C, w, h, d)`

prop · L40–50

- calls: [`latheOf`](../core/geometry.js.md#s-latheOf) _js/stationgen/core/geometry.js_ · [`env`](#s-env)
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.torus`

<!-- note:FORMS.spindle -->
a vertical lathe: tower, silo, bell
<!-- /note -->

#### <a id="s-FORMS-prism"></a>`FORMS.prism(C, w, h, d, o=)`

prop · L51–70

- calls: [`env`](#s-env) ×2
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:FORMS.prism -->
an n-gon prism, banded
<!-- /note -->

#### <a id="s-FORMS-faceted"></a>`FORMS.faceted(C, w, h, d)`

prop · L71–80

- calls: [`env`](#s-env)
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.ico`, `G.octa`, `G.torus`

<!-- note:FORMS.faceted -->
a faceted armoured pod on a plinth

- L77 · `C.add(G.torus(0.04, 6, 24), mats.dark, 0, 2 + ry * 0.9, 0, H, 0, 0, Math.max(rx, rz) * 1.0` — a seam belt
<!-- /note -->

#### <a id="s-FORMS-vault"></a>`FORMS.vault(C, w, h, d, o=)`

prop · L81–94

- calls: [`roll`](../data/styles.js.md#s-roll) _js/stationgen/data/styles.js_ · [`env`](#s-env) · [`ribGeo`](#s-ribGeo) · [`vaultGeo`](#s-vaultGeo)
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:FORMS.vault -->
the nave: an arched section extruded along z, with ribs
<!-- /note -->

#### <a id="s-FORMS-dome"></a>`FORMS.dome(C, w, h, d, o=)`

prop · L95–105

- calls: [`env`](#s-env)
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.dome`, `G.torus`

<!-- note:FORMS.dome -->
a dome on a drum or an n-gon
<!-- /note -->

#### <a id="s-FORMS-stack"></a>`FORMS.stack(C, w, h, d)`

prop · L106–122

- calls: [`env`](#s-env)
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:FORMS.stack -->
stacked decks, each smaller, each turned a little
<!-- /note -->

#### <a id="s-FORMS-cluster"></a>`FORMS.cluster(C, w, h, d)`

prop · L123–138

- calls: [`latheOf`](../core/geometry.js.md#s-latheOf) _js/stationgen/core/geometry.js_ · [`env`](#s-env)
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.ico`, `G.sphere`

<!-- note:FORMS.cluster -->
pods bunched on a frame
<!-- /note -->

#### <a id="s-FORMS-wedge"></a>`FORMS.wedge(C, w, h, d)`

prop · L139–148

- calls: [`env`](#s-env)
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.frustum`

<!-- note:FORMS.wedge -->
a tapered block — the frustum
<!-- /note -->

#### <a id="s-FORMS-keep"></a>`FORMS.keep(C, w, h, d)`

prop · L149–162

- calls: [`env`](#s-env)
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.frustum`

<!-- note:FORMS.keep -->
a keep: sloped walls, a deck, battlements — military spec

- L155 · `const tw = bw * taper, td = bd * taper;` — deck with a parapet and teeth
- L159 · `if (rng.chance(0.7)) C.add(G.box(), mats.armour, rng.range(-1, 1) * tw * 0.15, 1 + bh + 2` — an armoured citadel block on the deck
<!-- /note -->

#### <a id="s-FORMS-lantern"></a>`FORMS.lantern(C, w, h, d)`

prop · L163–174

- calls: [`env`](#s-env)
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cone`, `G.cyl`

<!-- note:FORMS.lantern -->
an octagonal glazed tower under a spire
<!-- /note -->

#### <a id="s-FORMS-cradle"></a>`FORMS.cradle(C, w, h, d, o=)`

prop · L175–185

- calls: [`env`](#s-env)
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:FORMS.cradle -->
an open frame with a body inside — the works look
<!-- /note -->

### <a id="s-FORM_KEYS"></a>`FORM_KEYS`

const · **exported** · L187–187

<!-- note:FORM_KEYS -->
<!-- /note -->

### <a id="s-pickForm"></a>`pickForm(C, allowed)`

function · **exported** · L189–193

- calls: [`roll`](../data/styles.js.md#s-roll) _js/stationgen/data/styles.js_
- called by: [`body`](#s-body)

<!-- note:pickForm -->
Roll a body form for a family: the family's allowed forms weighted by the style.
<!-- /note -->

### <a id="s-body"></a>`body(C, allowed, w, h, d, o=)`

function · **exported** · L194–199

- calls: [`pickForm`](#s-pickForm)
- called by: [`PREFABS.brig`](modules.js.md#s-PREFABS-brig) _js/stationgen/prefabs/modules.js_ · [`PREFABS.concourse`](modules.js.md#s-PREFABS-concourse) _js/stationgen/prefabs/modules.js_ · [`PREFABS.dronebay`](modules.js.md#s-PREFABS-dronebay) _js/stationgen/prefabs/modules.js_ · [`PREFABS.hall`](modules.js.md#s-PREFABS-hall) _js/stationgen/prefabs/modules.js_ · [`PREFABS.labstack`](modules.js.md#s-PREFABS-labstack) _js/stationgen/prefabs/modules.js_ · [`PREFABS.plant`](modules.js.md#s-PREFABS-plant) _js/stationgen/prefabs/modules.js_ · [`PREFABS.podblock`](modules.js.md#s-PREFABS-podblock) _js/stationgen/prefabs/modules.js_ · [`PREFABS.ringsection`](modules.js.md#s-PREFABS-ringsection) _js/stationgen/prefabs/modules.js_ · [`PREFABS.shelter`](modules.js.md#s-PREFABS-shelter) _js/stationgen/prefabs/modules.js_ · [`PREFABS.shieldnode`](modules.js.md#s-PREFABS-shieldnode) _js/stationgen/prefabs/modules.js_ · [`PREFABS.siege`](modules.js.md#s-PREFABS-siege) _js/stationgen/prefabs/modules.js_ · [`PREFABS.vls`](modules.js.md#s-PREFABS-vls) _js/stationgen/prefabs/modules.js_ · [`PREFABS.warehouse`](modules.js.md#s-PREFABS-warehouse) _js/stationgen/prefabs/modules.js_ · [`PREFABS.works`](modules.js.md#s-PREFABS-works) _js/stationgen/prefabs/modules.js_

<!-- note:body -->
<!-- /note -->

### <a id="s-DECOR"></a>`DECOR`

const · **exported** · L201–301

<!-- note:DECOR -->
---- decorative kits ------------------------------------------------------------
<!-- /note -->

#### <a id="s-DECOR-buttress"></a>`DECOR.buttress(C, e)`

prop · L202–216

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cone`

<!-- note:DECOR.buttress -->
<!-- /note -->

#### <a id="s-DECOR-spire"></a>`DECOR.spire(C, e)`

prop · L217–228

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cone`, `G.cyl`

<!-- note:DECOR.spire -->
<!-- /note -->

#### <a id="s-DECOR-arcade"></a>`DECOR.arcade(C, e)`

prop · L229–238

- calls: [`archOutline`](../core/geometry.js.md#s-archOutline) _js/stationgen/core/geometry.js_ · [`extrude`](../core/geometry.js.md#s-extrude) _js/stationgen/core/geometry.js_

<!-- note:DECOR.arcade -->
<!-- /note -->

#### <a id="s-DECOR-finial"></a>`DECOR.finial(C, e)`

prop · L239–239

<!-- note:DECOR.finial -->
<!-- /note -->

#### <a id="s-DECOR-rose"></a>`DECOR.rose(C, e)`

prop · L240–248

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.torus`

<!-- note:DECOR.rose -->
<!-- /note -->

#### <a id="s-DECOR-plates"></a>`DECOR.plates(C, e)`

prop · L249–257

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:DECOR.plates -->
<!-- /note -->

#### <a id="s-DECOR-blister"></a>`DECOR.blister(C, e)`

prop · L258–263

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.dome`

<!-- note:DECOR.blister -->
<!-- /note -->

#### <a id="s-DECOR-gunport"></a>`DECOR.gunport(C, e)`

prop · L264–269

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:DECOR.gunport -->
<!-- /note -->

#### <a id="s-DECOR-sensorpod"></a>`DECOR.sensorpod(C, e)`

prop · L270–270

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.octa`

<!-- note:DECOR.sensorpod -->
<!-- /note -->

#### <a id="s-DECOR-bands"></a>`DECOR.bands(C, e)`

prop · L271–277

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:DECOR.bands -->
<!-- /note -->

#### <a id="s-DECOR-terrace"></a>`DECOR.terrace(C, e)`

prop · L278–278

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:DECOR.terrace -->
<!-- /note -->

#### <a id="s-DECOR-antenna"></a>`DECOR.antenna(C, e)`

prop · L279–279

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`

<!-- note:DECOR.antenna -->
<!-- /note -->

#### <a id="s-DECOR-panels"></a>`DECOR.panels(C, e)`

prop · L280–280

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:DECOR.panels -->
<!-- /note -->

#### <a id="s-DECOR-pipes"></a>`DECOR.pipes(C, e)`

prop · L281–290

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`

<!-- note:DECOR.pipes -->
<!-- /note -->

#### <a id="s-DECOR-stacks"></a>`DECOR.stacks(C, e)`

prop · L291–291

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`

<!-- note:DECOR.stacks -->
<!-- /note -->

#### <a id="s-DECOR-hazard"></a>`DECOR.hazard(C, e)`

prop · L292–292

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:DECOR.hazard -->
<!-- /note -->

#### <a id="s-DECOR-vents"></a>`DECOR.vents(C, e)`

prop · L293–293

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:DECOR.vents -->
<!-- /note -->

#### <a id="s-DECOR-frame"></a>`DECOR.frame(C, e)`

prop · L294–294

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:DECOR.frame -->
<!-- /note -->

#### <a id="s-DECOR-patches"></a>`DECOR.patches(C, e)`

prop · L295–295

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:DECOR.patches -->
<!-- /note -->

#### <a id="s-DECOR-girders"></a>`DECOR.girders(C, e)`

prop · L296–296

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:DECOR.girders -->
<!-- /note -->

#### <a id="s-DECOR-cables"></a>`DECOR.cables(C, e)`

prop · L297–297

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`

<!-- note:DECOR.cables -->
<!-- /note -->

#### <a id="s-DECOR-glassstrip"></a>`DECOR.glassstrip(C, e)`

prop · L298–298

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:DECOR.glassstrip -->
<!-- /note -->

#### <a id="s-DECOR-dish"></a>`DECOR.dish(C, e)`

prop · L299–299

- calls: [`lathe`](../core/geometry.js.md#s-lathe) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`

<!-- note:DECOR.dish -->
<!-- /note -->

#### <a id="s-DECOR-glazing"></a>`DECOR.glazing(C, e)`

prop · L300–300

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:DECOR.glazing -->
<!-- /note -->

### <a id="s-decorate"></a>`decorate(C, e, {…}=)`

function · **exported** · L303–311

- called by: [`PREFABS.battery`](modules.js.md#s-PREFABS-battery) _js/stationgen/prefabs/modules.js_ · [`PREFABS.brig`](modules.js.md#s-PREFABS-brig) _js/stationgen/prefabs/modules.js_ · [`PREFABS.command`](modules.js.md#s-PREFABS-command) _js/stationgen/prefabs/modules.js_ · [`PREFABS.concourse`](modules.js.md#s-PREFABS-concourse) _js/stationgen/prefabs/modules.js_ · [`PREFABS.dronebay`](modules.js.md#s-PREFABS-dronebay) _js/stationgen/prefabs/modules.js_ · [`PREFABS.greenhouse`](modules.js.md#s-PREFABS-greenhouse) _js/stationgen/prefabs/modules.js_ · [`PREFABS.hall`](modules.js.md#s-PREFABS-hall) _js/stationgen/prefabs/modules.js_ · [`PREFABS.labstack`](modules.js.md#s-PREFABS-labstack) _js/stationgen/prefabs/modules.js_ · [`PREFABS.plant`](modules.js.md#s-PREFABS-plant) _js/stationgen/prefabs/modules.js_ · [`PREFABS.podblock`](modules.js.md#s-PREFABS-podblock) _js/stationgen/prefabs/modules.js_ · [`PREFABS.ringsection`](modules.js.md#s-PREFABS-ringsection) _js/stationgen/prefabs/modules.js_ · [`PREFABS.tankfarm`](modules.js.md#s-PREFABS-tankfarm) _js/stationgen/prefabs/modules.js_ · [`PREFABS.warehouse`](modules.js.md#s-PREFABS-warehouse) _js/stationgen/prefabs/modules.js_ · [`PREFABS.works`](modules.js.md#s-PREFABS-works) _js/stationgen/prefabs/modules.js_

<!-- note:decorate -->
Apply 1–3 of the style's decors to an envelope, skipping any the family bars.
<!-- /note -->
