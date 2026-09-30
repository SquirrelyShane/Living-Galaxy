# js/stationgen/prefabs/modules.js

[index](../../../../README.md) · 595 lines · 44 symbols · 2 imports · 2 importers

## About

<!-- note:@file -->
Module prefabs. Each draws one module into a group whose frame is:
origin on the mount surface, +Y out of the hull, +Z along the structure,
+X across. `size` is [w, h, d] in metres. `C` is the build context:
mats, rng, style, G, add(geo, mat, x,y,z, rx,ry,rz, sx,sy,sz), lamp(), count().

Every prefab rolls a body from the shape grammar (forms.js) — the family
says which forms make sense, the station's architecture style weights
them, the rng sets proportions — then hangs the family's own kit on the
envelope and lets the style decorate. No two modules come out the same.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../core/geometry.js` | `G`, `PROFILES`, `lathe`, `latheOf` | [js/stationgen/core/geometry.js](../core/geometry.js.md) |
| 2 | `./forms.js` | `FORMS`, `body`, `decorate` | [js/stationgen/prefabs/forms.js](forms.js.md) |

## Imported by

- [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md) — `PREFABS`
- [js/stationgen/index.js](../index.js.md) — `PREFABS`

## Exports

- [`PREFABS`](#s-PREFABS) · const — used by [js/stationgen/builder/StationBuilder.js](../builder/StationBuilder.js.md), [js/stationgen/index.js](../index.js.md)

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

### <a id="s-pipeRun"></a>`pipeRun(C, y, z0, z1, x, r=, mat)`

function · L6–9

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`
- called by: [`PREFABS.plant`](#s-PREFABS-plant) · [`PREFABS.tankfarm`](#s-PREFABS-tankfarm) ×2 · [`PREFABS.works`](#s-PREFABS-works) ×2

<!-- note:pipeRun -->
---- helpers ---------------------------------------------------------------
<!-- /note -->

### <a id="s-tank"></a>`tank(C, x, y, z, r, len, mat, axis=)`

function · L10–15

- calls: [`latheOf`](../core/geometry.js.md#s-latheOf) _js/stationgen/core/geometry.js_
- called by: [`PREFABS.plant`](#s-PREFABS-plant) · [`PREFABS.tankfarm`](#s-PREFABS-tankfarm) ×2

<!-- note:tank -->
<!-- /note -->

### <a id="s-rack"></a>`rack(C, x, y, z, w, h, d, mat)`

function · L16–20 · **never referenced**

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:rack -->
<!-- /note -->

### <a id="s-turret"></a>`turret(C, x, y, z, r, barrels, len, o=)`

function · L21–38

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.dome`, `G.ico`
- called by: [`PREFABS.battery`](#s-PREFABS-battery) · [`PREFABS.pdc`](#s-PREFABS-pdc)

<!-- note:turret -->
A gimballed turret: barbette, a body of some form, barrels — all in one child group that traverses.
<!-- /note -->

### <a id="s-PREFABS"></a>`PREFABS`

const · **exported** · L40–595

<!-- note:PREFABS -->
---- prefabs --------------------------------------------------------------
<!-- /note -->

#### <a id="s-PREFABS-plant"></a>`PREFABS.plant(g, […], C)`

prop · L41–50

- calls: [`body`](forms.js.md#s-body) _js/stationgen/prefabs/forms.js_ · [`decorate`](forms.js.md#s-decorate) _js/stationgen/prefabs/forms.js_ · [`pipeRun`](#s-pipeRun) · [`tank`](#s-tank)
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:PREFABS.plant -->
a pressurised plant: a body with tanks along one side, pipes, a service spine
<!-- /note -->

#### <a id="s-PREFABS-tankfarm"></a>`PREFABS.tankfarm(g, […], C)`

prop · L51–81

- calls: [`latheOf`](../core/geometry.js.md#s-latheOf) _js/stationgen/core/geometry.js_ · [`decorate`](forms.js.md#s-decorate) _js/stationgen/prefabs/forms.js_ · [`pipeRun`](#s-pipeRun) ×2 · [`tank`](#s-tank) ×2
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.ico`, `G.sphere`
- via [js/stationgen/prefabs/forms.js](forms.js.md): `FORMS.barrel`

<!-- note:PREFABS.tankfarm -->
tank farm: spheres and lathes on a frame, sometimes a faceted cryo block
<!-- /note -->

#### <a id="s-PREFABS-greenhouse"></a>`PREFABS.greenhouse(g, […], C)`

prop · L82–102

- calls: [`decorate`](forms.js.md#s-decorate) _js/stationgen/prefabs/forms.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cone`, `G.sphere`, `G.torus`, `G.tube`
- via [js/stationgen/prefabs/forms.js](forms.js.md): `FORMS.dome`, `FORMS.vault`

<!-- note:PREFABS.greenhouse -->
a glazed hall: a vault, a dome or a barrel of glass with green inside
<!-- /note -->

#### <a id="s-PREFABS-labstack"></a>`PREFABS.labstack(g, […], C)`

prop · L103–110

- calls: [`body`](forms.js.md#s-body) _js/stationgen/prefabs/forms.js_ · [`decorate`](forms.js.md#s-decorate) _js/stationgen/prefabs/forms.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.octa`

<!-- note:PREFABS.labstack -->
lab decks: stacks, facets, lanterns — a lot of windows and a cold mast
<!-- /note -->

#### <a id="s-PREFABS-observatory"></a>`PREFABS.observatory(g, […], C)`

prop · L111–137

- calls: [`lathe`](../core/geometry.js.md#s-lathe) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.dome`, `G.tube`

<!-- note:PREFABS.observatory -->
- L115 · `C.add(G.cyl(10), mats.dark, 0, h * 0.2, 0, 0, 0, 0, w * 0.2, h * 0.4, w * 0.2);` — an open telescope on a yoke
- L128 · `C.add(G.box(), mats.dark, x, h * 0.72, 0, 0, rng.range(0, PI), 0, r * 0.25, h * 0.4, r * 2` — slit
- L129 · `C.add(G.cyl(12), mats.metal, x, h * 0.75, 0, 0.6, 0, 0, r * 0.2, h * 0.6, r * 0.2);` — scope
<!-- /note -->

#### <a id="s-PREFABS-shipyard"></a>`PREFABS.shipyard(g, […], C)`

prop · L138–161

- calls: [`latheOf`](../core/geometry.js.md#s-latheOf) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.taper`

<!-- note:PREFABS.shipyard -->
the yard: open jigs on a truss frame, cranes, hulls on the jigs

- L146 · `const hulls = rng.int(1, 2);` — hulls on the jigs: one or two, at different stages
<!-- /note -->

#### <a id="s-PREFABS-works"></a>`PREFABS.works(g, […], C)`

prop · L162–177

- calls: [`body`](forms.js.md#s-body) _js/stationgen/prefabs/forms.js_ · [`decorate`](forms.js.md#s-decorate) _js/stationgen/prefabs/forms.js_ · [`pipeRun`](#s-pipeRun) ×2
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`

<!-- note:PREFABS.works -->
refinery drums, furnace stacks, a lot of pipe
<!-- /note -->

#### <a id="s-PREFABS-concourse"></a>`PREFABS.concourse(g, […], C)`

prop · L178–186

- calls: [`body`](forms.js.md#s-body) _js/stationgen/prefabs/forms.js_ · [`decorate`](forms.js.md#s-decorate) _js/stationgen/prefabs/forms.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.tube`

<!-- note:PREFABS.concourse -->
market concourse: a long hall with a glazed roof and a lot of light
<!-- /note -->

#### <a id="s-PREFABS-warehouse"></a>`PREFABS.warehouse(g, […], C)`

prop · L187–196

- calls: [`body`](forms.js.md#s-body) _js/stationgen/prefabs/forms.js_ · [`decorate`](forms.js.md#s-decorate) _js/stationgen/prefabs/forms.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:PREFABS.warehouse -->
- L190 · `const n = rng.int(3, 8);` — containers stacked outside, in yard colours
<!-- /note -->

#### <a id="s-PREFABS-command"></a>`PREFABS.command(g, […], C)`

prop · L197–216

- calls: [`decorate`](forms.js.md#s-decorate) _js/stationgen/prefabs/forms.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.dome`
- via [js/stationgen/prefabs/forms.js](forms.js.md): `FORMS[…]`

<!-- note:PREFABS.command -->
command deck: a lens of windows on a neck, in whatever body the style favours
<!-- /note -->

#### <a id="s-PREFABS-tower"></a>`PREFABS.tower(g, […], C)`

prop · L217–232

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`
- via [js/stationgen/prefabs/forms.js](forms.js.md): `FORMS.lantern`, `FORMS.prism`

<!-- note:PREFABS.tower -->
<!-- /note -->

#### <a id="s-PREFABS-podblock"></a>`PREFABS.podblock(g, […], C)`

prop · L233–255

- calls: [`latheOf`](../core/geometry.js.md#s-latheOf) _js/stationgen/core/geometry.js_ · [`body`](forms.js.md#s-body) _js/stationgen/prefabs/forms.js_ · [`decorate`](forms.js.md#s-decorate) _js/stationgen/prefabs/forms.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:PREFABS.podblock -->
tier I quarters: cabin pods clustered on a frame — rows, a hive or a stack
<!-- /note -->

#### <a id="s-PREFABS-ringsection"></a>`PREFABS.ringsection(g, […], C)`

prop · L256–265

- calls: [`body`](forms.js.md#s-body) _js/stationgen/prefabs/forms.js_ · [`decorate`](forms.js.md#s-decorate) _js/stationgen/prefabs/forms.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:PREFABS.ringsection -->
tier II quarters: the ring section this sits on gets streets and windows
<!-- /note -->

#### <a id="s-PREFABS-habdrum"></a>`PREFABS.habdrum()`

prop · L266–266

<!-- note:PREFABS.habdrum -->
- L266 · `habdrum() {` — the drum is structure: see builder/hull.js habitatDrum
<!-- /note -->

#### <a id="s-PREFABS-hall"></a>`PREFABS.hall(g, […], C)`

prop · L267–272

- calls: [`body`](forms.js.md#s-body) _js/stationgen/prefabs/forms.js_ · [`decorate`](forms.js.md#s-decorate) _js/stationgen/prefabs/forms.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:PREFABS.hall -->
<!-- /note -->

#### <a id="s-PREFABS-brig"></a>`PREFABS.brig(g, […], C)`

prop · L273–280

- calls: [`body`](forms.js.md#s-body) _js/stationgen/prefabs/forms.js_ · [`decorate`](forms.js.md#s-decorate) _js/stationgen/prefabs/forms.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:PREFABS.brig -->
<!-- /note -->

#### <a id="s-PREFABS-shelter"></a>`PREFABS.shelter(g, […], C)`

prop · L281–285

- calls: [`body`](forms.js.md#s-body) _js/stationgen/prefabs/forms.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:PREFABS.shelter -->
<!-- /note -->

#### <a id="s-PREFABS-solarwing"></a>`PREFABS.solarwing(g, […], C)`

prop · L286–306

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:PREFABS.solarwing -->
solar wings on a tracking yoke — the panel plane faces +Y (the sun side); single, twin, split or twisted
<!-- /note -->

#### <a id="s-PREFABS-solarfan"></a>`PREFABS.solarfan(g, […], C)`

prop · L307–322

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:PREFABS.solarfan -->
a radial fan of petals on a hub
<!-- /note -->

#### <a id="s-PREFABS-solarsail"></a>`PREFABS.solarsail(g, […], C)`

prop · L323–337

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:PREFABS.solarsail -->
a single thin-film sail on catenary booms
<!-- /note -->

#### <a id="s-PREFABS-concentrators"></a>`PREFABS.concentrators(g, […], C)`

prop · L338–352

- calls: [`lathe`](../core/geometry.js.md#s-lathe) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.sphere`

<!-- note:PREFABS.concentrators -->
dishes that focus the sun on cells
<!-- /note -->

#### <a id="s-PREFABS-reactor"></a>`PREFABS.reactor(g, […], C)`

prop · L353–370

- calls: [`latheOf`](../core/geometry.js.md#s-latheOf) _js/stationgen/core/geometry.js_ ×3
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.ico`, `G.sphere`

<!-- note:PREFABS.reactor -->
- L355 · `const shieldGeo = rng.chance(0.5) ? G.cyl(24) : G.cyl(8);` — shadow shield first, then the vessel, then the turbomachinery
<!-- /note -->

#### <a id="s-PREFABS-radiators"></a>`PREFABS.radiators(g, […], C)`

prop · L371–388

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:PREFABS.radiators -->
radiator array: flat fins, a vee, or a radial spray about a spine
<!-- /note -->

#### <a id="s-PREFABS-dockcluster"></a>`PREFABS.dockcluster(g, […], C)`

prop · L389–405

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.ico`, `G.sphere`, `G.torus`

<!-- note:PREFABS.dockcluster -->
<!-- /note -->

#### <a id="s-PREFABS-commsmast"></a>`PREFABS.commsmast(g, […], C)`

prop · L406–429

- calls: [`lathe`](../core/geometry.js.md#s-lathe) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:PREFABS.commsmast -->
comms: a dish mast, a lattice tower with drums, or a phased-array pylon
<!-- /note -->

#### <a id="s-PREFABS-bigdish"></a>`PREFABS.bigdish(g, […], C)`

prop · L430–442

- calls: [`lathe`](../core/geometry.js.md#s-lathe) _js/stationgen/core/geometry.js_ ×2
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:PREFABS.bigdish -->
a great dish on a yoke
<!-- /note -->

#### <a id="s-PREFABS-phasedslab"></a>`PREFABS.phasedslab(g, […], C)`

prop · L443–455

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:PREFABS.phasedslab -->
phased-array slabs at angles
<!-- /note -->

#### <a id="s-PREFABS-sensormast"></a>`PREFABS.sensormast(g, […], C)`

prop · L456–465

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.ico`, `G.sphere`

<!-- note:PREFABS.sensormast -->
<!-- /note -->

#### <a id="s-PREFABS-battery"></a>`PREFABS.battery(g, […], C)`

prop · L466–474

- calls: [`decorate`](forms.js.md#s-decorate) _js/stationgen/prefabs/forms.js_ · [`turret`](#s-turret)
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:PREFABS.battery -->
railgun battery: a barbette, a turret of some form, twin rails
<!-- /note -->

#### <a id="s-PREFABS-pdc"></a>`PREFABS.pdc(g, […], C)`

prop · L475–488

- calls: [`turret`](#s-turret)
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.octa`

<!-- note:PREFABS.pdc -->
point-defence cluster: several small mounts on a plinth
<!-- /note -->

#### <a id="s-PREFABS-laserturret"></a>`PREFABS.laserturret(g, […], C)`

prop · L489–500

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.ico`, `G.sphere`

<!-- note:PREFABS.laserturret -->
laser battery: an armoured lens turret with radiator fins
<!-- /note -->

#### <a id="s-PREFABS-vls"></a>`PREFABS.vls(g, […], C)`

prop · L501–515

- calls: [`body`](forms.js.md#s-body) _js/stationgen/prefabs/forms.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cone`

<!-- note:PREFABS.vls -->
vertical launch cells: a flat block with a grid of lids, some open and lit
<!-- /note -->

#### <a id="s-PREFABS-spinal"></a>`PREFABS.spinal(g, […], C)`

prop · L516–534

- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`, `G.taper`, `G.torus`

<!-- note:PREFABS.spinal -->
the spinal mass driver: rails out along +Y (the station axis at an end cap), capacitor rings, a muzzle

- L519 · `C.add(G.cyl(rng.pick([8, 12, 16])), mats.armour, 0, h * 0.25, 0, 0, 0, 0, w * 0.5, h * 0.5` — breech housing
- L522 · `C.add(G.cyl(12), mats.dark, 0, h * 0.5 + L / 2, 0, 0, 0, 0, r * 0.55, L, r * 0.55);` — bore
- L529 · `C.add(G.taper(1.3, 12), mats.armour, 0, h * 0.5 + L + 3, 0, PI, 0, 0, r * 1.4, 6, r * 1.4)` — muzzle brake
<!-- /note -->

#### <a id="s-PREFABS-siege"></a>`PREFABS.siege(g, […], C)`

prop · L535–549

- calls: [`lathe`](../core/geometry.js.md#s-lathe) _js/stationgen/core/geometry.js_ · [`body`](forms.js.md#s-body) _js/stationgen/prefabs/forms.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`, `G.cyl`

<!-- note:PREFABS.siege -->
the siege laser: a driver stack, a yoke, a twelve-metre optic that gimbals
<!-- /note -->

#### <a id="s-PREFABS-shieldnode"></a>`PREFABS.shieldnode(g, […], C)`

prop · L550–564

- calls: [`body`](forms.js.md#s-body) _js/stationgen/prefabs/forms.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.cyl`, `G.octa`, `G.taper`

<!-- note:PREFABS.shieldnode -->
shield emitter array: a generator body, emitter spines with lit tips, a translucent shield petal above
<!-- /note -->

#### <a id="s-PREFABS-dronebay"></a>`PREFABS.dronebay(g, […], C)`

prop · L565–582

- calls: [`body`](forms.js.md#s-body) _js/stationgen/prefabs/forms.js_ · [`decorate`](forms.js.md#s-decorate) _js/stationgen/prefabs/forms.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.torus`, `G.tube`

<!-- note:PREFABS.dronebay -->
drone bay: launch tubes on the +Z face, drones that fly out and come back

- L578 · `const flying = rng.int(2, 4);` — 0.3.15: no scenery sorties. The bay's drones are the port's real ones —
  interceptors off the drone-bay mounts (stationworks.js) and corporate
  work drones through the hangar (npc/bay.js). The draws stay, so the seed
  grows the same module.
<!-- /note -->

#### <a id="s-PREFABS-lifeboats"></a>`PREFABS.lifeboats(g, […], C)`

prop · L583–594

- calls: [`latheOf`](../core/geometry.js.md#s-latheOf) _js/stationgen/core/geometry.js_
- via [js/stationgen/core/geometry.js](../core/geometry.js.md): `G.box`

<!-- note:PREFABS.lifeboats -->
<!-- /note -->
