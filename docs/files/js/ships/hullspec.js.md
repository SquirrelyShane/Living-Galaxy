# js/ships/hullspec.js

[index](../../../README.md) · 289 lines · 63 symbols · 5 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY — hull specification bridge.

The fleet registry (shipdb.js) describes a hull the LIVING GALAXY way: a silhouette
grammar, working dimensions and the numbers the sim reads. The ship
generator (js/shipgen/, the NEWSHIPGEN extraction of ORBITAL YARD) builds
hulls its own way: a class, a doctrine, a drive family and a parts list
drawn from a 346-part catalogue.

This module is the translation. For every registry def it derives:

  - a synthetic generator class registered as `lg:&lt;def.id>` — the
    def's own body / nose / wings / engine count / weapon weight in the
    generator's vocabulary, so the silhouette the registry promises is the
    silhouette the generator grows;
  - a drive family, a design regime and a livery finish;
  - the buildable parts list: the base class doctrine, re-fitted for the
    def's reactor, crew and turret count, plus one catalogue part (or a
    small set) for every module the grammar names. The list is a property
    of the def, not of the seed, so every Ore Sled carries the same
    manifest and the yard can price it before a single mesh exists.

Everything here is pure data; nothing touches three.js.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../shipgen/data/classes.js` | `SHIP_CLASSES`, `EQUIP_DEFAULT`, `CLASS_EQUIP` | [js/shipgen/data/classes.js](../shipgen/data/classes.js.md) |
| 2 | `../shipgen/data/loadouts.js` | `CLASS_LOADOUT`, `CORE`, `expandLoadout` | [js/shipgen/data/loadouts.js](../shipgen/data/loadouts.js.md) |
| 3 | `../shipgen/data/catalog/index.js` | `PARTS`, `WEAPON_PART`, `CATALOG` | [js/shipgen/data/catalog/index.js](../shipgen/data/catalog/index.js.md) |
| 4 | `../shipgen/data/drives.js` | `DRIVE_TYPES` | [js/shipgen/data/drives.js](../shipgen/data/drives.js.md) |
| 5 | `../shipgen/core/rng.js` | `RNG` | [js/shipgen/core/rng.js](../shipgen/core/rng.js.md) |

## Imported by

- [js/economy/shipcost.js](../economy/shipcost.js.md) — `hullSpec`, `manifestTotals`
- [js/ships/shipforge.js](shipforge.js.md) — `genConfig`, `hullSpec`
- test/forge.test.mjs _(outside js/)_ — `hullSpec`
- test/hullspec.test.mjs _(outside js/)_ — `hullSpec`, `genConfig`, `manifestTotals`, `MODULE_PARTS`, `registerAll`

## Exports

- [`MODULE_PARTS`](#s-MODULE_PARTS) · const — used by test/hullspec.test.mjs
- [`GEN_MAX_LENGTH_M`](#s-GEN_MAX_LENGTH_M) · const — **no importer in scanned roots**
- [`hullSpec`](#s-hullSpec) · function — used by [js/economy/shipcost.js](../economy/shipcost.js.md), [js/ships/shipforge.js](shipforge.js.md), test/forge.test.mjs, test/hullspec.test.mjs
- [`manifestTotals`](#s-manifestTotals) · function — used by [js/economy/shipcost.js](../economy/shipcost.js.md), test/hullspec.test.mjs
- [`genConfig`](#s-genConfig) · function — used by [js/ships/shipforge.js](shipforge.js.md), test/hullspec.test.mjs
- [`registerAll`](#s-registerAll) · function — used by test/hullspec.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-TIERS"></a>`TIERS`

const · L7–7

<!-- note:TIERS -->
<!-- /note -->

### <a id="s-tierIx"></a>`tierIx(t)`

function · L8–8

- called by: [`buildSpec`](#s-buildSpec)

<!-- note:tierIx -->
<!-- /note -->

### <a id="s-BODY_MAP"></a>`BODY_MAP`

const · L10–30

<!-- note:BODY_MAP -->
---- grammar → generator vocabulary ------------------------------------

Registry bodies that the generator does not know, translated by tier.

- L27 · `dome:       () => "curved",` — the generator's sphere hull mounts almost nothing
<!-- /note -->

#### <a id="s-BODY_MAP-sleek"></a>`BODY_MAP.sleek(ix)`

prop · L11–11

<!-- note:BODY_MAP.sleek -->
<!-- /note -->

#### <a id="s-BODY_MAP-boxy"></a>`BODY_MAP.boxy()`

prop · L12–12

<!-- note:BODY_MAP.boxy -->
<!-- /note -->

#### <a id="s-BODY_MAP-industrial"></a>`BODY_MAP.industrial()`

prop · L13–13

<!-- note:BODY_MAP.industrial -->
<!-- /note -->

#### <a id="s-BODY_MAP-layered"></a>`BODY_MAP.layered()`

prop · L14–14

<!-- note:BODY_MAP.layered -->
<!-- /note -->

#### <a id="s-BODY_MAP-barge"></a>`BODY_MAP.barge()`

prop · L15–15

<!-- note:BODY_MAP.barge -->
<!-- /note -->

#### <a id="s-BODY_MAP-colossus"></a>`BODY_MAP.colossus()`

prop · L16–16

<!-- note:BODY_MAP.colossus -->
<!-- /note -->

#### <a id="s-BODY_MAP-hab"></a>`BODY_MAP.hab(ix)`

prop · L17–17

<!-- note:BODY_MAP.hab -->
<!-- /note -->

#### <a id="s-BODY_MAP-capital"></a>`BODY_MAP.capital()`

prop · L18–18

<!-- note:BODY_MAP.capital -->
<!-- /note -->

#### <a id="s-BODY_MAP-tug"></a>`BODY_MAP.tug()`

prop · L19–19

<!-- note:BODY_MAP.tug -->
<!-- /note -->

#### <a id="s-BODY_MAP-truss"></a>`BODY_MAP.truss()`

prop · L20–20

<!-- note:BODY_MAP.truss -->
<!-- /note -->

#### <a id="s-BODY_MAP-cradle"></a>`BODY_MAP.cradle()`

prop · L21–21

<!-- note:BODY_MAP.cradle -->
<!-- /note -->

#### <a id="s-BODY_MAP-cargo"></a>`BODY_MAP.cargo()`

prop · L22–22

<!-- note:BODY_MAP.cargo -->
<!-- /note -->

#### <a id="s-BODY_MAP-refinery"></a>`BODY_MAP.refinery()`

prop · L23–23

<!-- note:BODY_MAP.refinery -->
<!-- /note -->

#### <a id="s-BODY_MAP-tanks"></a>`BODY_MAP.tanks()`

prop · L24–24

<!-- note:BODY_MAP.tanks -->
<!-- /note -->

#### <a id="s-BODY_MAP-spine"></a>`BODY_MAP.spine()`

prop · L25–25

<!-- note:BODY_MAP.spine -->
<!-- /note -->

#### <a id="s-BODY_MAP-ring"></a>`BODY_MAP.ring()`

prop · L26–26

<!-- note:BODY_MAP.ring -->
<!-- /note -->

#### <a id="s-BODY_MAP-dome"></a>`BODY_MAP.dome()`

prop · L27–27

<!-- note:BODY_MAP.dome -->
<!-- /note -->

#### <a id="s-BODY_MAP-science"></a>`BODY_MAP.science()`

prop · L28–28

<!-- note:BODY_MAP.science -->
<!-- /note -->

#### <a id="s-BODY_MAP-war"></a>`BODY_MAP.war()`

prop · L29–29

<!-- note:BODY_MAP.war -->
<!-- /note -->

### <a id="s-NOSE_MAP"></a>`NOSE_MAP`

const · L32–36

<!-- note:NOSE_MAP -->
<!-- /note -->

### <a id="s-WINGS"></a>`WINGS`

const · L38–38

<!-- note:WINGS -->
<!-- /note -->

### <a id="s-BASE_CLASS"></a>`BASE_CLASS`

const · L40–60

<!-- note:BASE_CLASS -->
Which generator class each registry body borrows its doctrine (base parts
list, glazing, arms mix) from. Colossus hulls are the G-tier flagships and
take their doctrine from the complex that commissions them.
<!-- /note -->

#### <a id="s-BASE_CLASS-sleek"></a>`BASE_CLASS.sleek(ix)`

prop · L41–41

<!-- note:BASE_CLASS.sleek -->
<!-- /note -->

#### <a id="s-BASE_CLASS-boxy"></a>`BASE_CLASS.boxy(ix)`

prop · L42–42

<!-- note:BASE_CLASS.boxy -->
<!-- /note -->

#### <a id="s-BASE_CLASS-industrial"></a>`BASE_CLASS.industrial()`

prop · L43–43

<!-- note:BASE_CLASS.industrial -->
<!-- /note -->

#### <a id="s-BASE_CLASS-layered"></a>`BASE_CLASS.layered(ix)`

prop · L44–44

<!-- note:BASE_CLASS.layered -->
<!-- /note -->

#### <a id="s-BASE_CLASS-barge"></a>`BASE_CLASS.barge()`

prop · L45–45

<!-- note:BASE_CLASS.barge -->
<!-- /note -->

#### <a id="s-BASE_CLASS-colossus"></a>`BASE_CLASS.colossus(ix, complex)`

prop · L46–46

<!-- note:BASE_CLASS.colossus -->
<!-- /note -->

#### <a id="s-BASE_CLASS-hab"></a>`BASE_CLASS.hab(ix)`

prop · L47–47

<!-- note:BASE_CLASS.hab -->
<!-- /note -->

#### <a id="s-BASE_CLASS-capital"></a>`BASE_CLASS.capital(ix)`

prop · L48–48

<!-- note:BASE_CLASS.capital -->
<!-- /note -->

#### <a id="s-BASE_CLASS-tug"></a>`BASE_CLASS.tug()`

prop · L49–49

<!-- note:BASE_CLASS.tug -->
<!-- /note -->

#### <a id="s-BASE_CLASS-truss"></a>`BASE_CLASS.truss()`

prop · L50–50

<!-- note:BASE_CLASS.truss -->
<!-- /note -->

#### <a id="s-BASE_CLASS-cradle"></a>`BASE_CLASS.cradle()`

prop · L51–51

<!-- note:BASE_CLASS.cradle -->
<!-- /note -->

#### <a id="s-BASE_CLASS-cargo"></a>`BASE_CLASS.cargo()`

prop · L52–52

<!-- note:BASE_CLASS.cargo -->
<!-- /note -->

#### <a id="s-BASE_CLASS-refinery"></a>`BASE_CLASS.refinery()`

prop · L53–53

<!-- note:BASE_CLASS.refinery -->
<!-- /note -->

#### <a id="s-BASE_CLASS-tanks"></a>`BASE_CLASS.tanks()`

prop · L54–54

<!-- note:BASE_CLASS.tanks -->
<!-- /note -->

#### <a id="s-BASE_CLASS-spine"></a>`BASE_CLASS.spine()`

prop · L55–55

<!-- note:BASE_CLASS.spine -->
<!-- /note -->

#### <a id="s-BASE_CLASS-ring"></a>`BASE_CLASS.ring()`

prop · L56–56

<!-- note:BASE_CLASS.ring -->
<!-- /note -->

#### <a id="s-BASE_CLASS-dome"></a>`BASE_CLASS.dome()`

prop · L57–57

<!-- note:BASE_CLASS.dome -->
<!-- /note -->

#### <a id="s-BASE_CLASS-science"></a>`BASE_CLASS.science()`

prop · L58–58

<!-- note:BASE_CLASS.science -->
<!-- /note -->

#### <a id="s-BASE_CLASS-war"></a>`BASE_CLASS.war()`

prop · L59–59

<!-- note:BASE_CLASS.war -->
<!-- /note -->

### <a id="s-COLOSSUS_CLASS"></a>`COLOSSUS_CLASS`

const · L62–68

<!-- note:COLOSSUS_CLASS -->
<!-- /note -->

### <a id="s-DRIVE_LADDER"></a>`DRIVE_LADDER`

const · L70–88

<!-- note:DRIVE_LADDER -->
Drive family by complex, promoted with tier. Index into the list by tier
band: [A–B, C–D, E–G].
<!-- /note -->

### <a id="s-FINISH"></a>`FINISH`

const · L90–93

<!-- note:FINISH -->
<!-- /note -->

### <a id="s-MODULE_PARTS"></a>`MODULE_PARTS`

const · **exported** · L95–125

<!-- note:MODULE_PARTS -->
Registry module → catalogue parts. Each entry is the kit the yard fits for
that word in the grammar; a module named twice is fitted twice.
<!-- /note -->

### <a id="s-reactorParts"></a>`reactorParts(reactor)`

function · L127–133

- called by: [`buildSpec`](#s-buildSpec)

<!-- note:reactorParts -->
Reactor plant by registry output (units/s).
<!-- /note -->

### <a id="s-ARMS_BAND"></a>`ARMS_BAND`

const · L135–135

<!-- note:ARMS_BAND -->
Weapon count band from the grammar word — the same bands the old forge used.
<!-- /note -->

### <a id="s-GEN_MAX_LENGTH_M"></a>`GEN_MAX_LENGTH_M`

const · **exported** · L137–137

<!-- note:GEN_MAX_LENGTH_M -->
The generator sizes its parts against the hull, but clamps them to a
0.75–2.4 m "bay". A 240 m colossus built at true scale would carry parts
the size of rivets, so hulls are grown no longer than this and scaled up
by the forge afterwards.
<!-- /note -->

### <a id="s-SPECS"></a>`SPECS`

const · L139–139

<!-- note:SPECS -->
---- the spec ----------------------------------------------------------
<!-- /note -->

### <a id="s-hullSpec"></a>`hullSpec(def)`

function · **exported** · L141–147

- calls: [`buildSpec`](#s-buildSpec)
- called by: [`componentBill`](../economy/shipcost.js.md#s-componentBill) _js/economy/shipcost.js_ · [`genConfig`](#s-genConfig) · [`registerAll`](#s-registerAll) · [`forgeShip`](shipforge.js.md#s-forgeShip) _js/ships/shipforge.js_

<!-- note:hullSpec -->
Generator-side description of a registry def. Cached per def id.
<!-- /note -->

### <a id="s-buildSpec"></a>`buildSpec(def)`

function · L149–230

- calls: [`new RNG`](../shipgen/core/rng.js.md#s-RNG) _js/shipgen/core/rng.js_ · [`expandLoadout`](../shipgen/data/loadouts.js.md#s-expandLoadout) _js/shipgen/data/loadouts.js_ · [`buildSpec>fit`](#s-buildSpec-fit) ×11 · [`buildSpec>jit`](#s-buildSpec-jit) ×3 · [`buildSpec>once`](#s-buildSpec-once) ×3 · [`manifestOf`](#s-manifestOf) · [`reactorParts`](#s-reactorParts) · [`tierIx`](#s-tierIx)
- called by: [`hullSpec`](#s-hullSpec)

<!-- note:buildSpec -->
- L157 · `const Lm = def.dims[0] * 10;` — Dimensions: registry units are 10 m each. Grow at true scale up to the
  cap, keeping the def's proportions.
- L183 · `const lo = expandLoadout(CLASS_LOADOUT[baseKey] ?? CORE);` — ---- parts list -----------------------------------------------------
- L184 · `for (const id of Object.keys(lo)) {` — Strip what the registry overrides: the reactor plant and the arms.
- L192 · `if (def.stats.crew >= 8) fit("hb.cabins", Math.floor(def.stats.crew / 8));` — Crew spaces scale with berths; the doctrine kits assume a handful.
- L195 · `const stacks = Math.round(def.stats.cargo / 250) - (lo["cg.container"] ?? 0);` — Cargo frames: one container stack per 250 m³ beyond what the kit fitted.
- L198 · `const [lo0, hi0] = ARMS_BAND[gr.weapons] ?? ARMS_BAND.none;` — Arms: the grammar band, never fewer than the fitted mounts, rolled from
  the base doctrine's arms mix on the def id — same manifest every seed.
- L204 · `fit("wp.fcs"); fit("wp.tracker");` — Magazines and fire control come with the first mount.
<!-- /note -->

#### <a id="s-buildSpec-jit"></a>`buildSpec>jit(v, j)`

function · L160–160

- called by: [`buildSpec`](#s-buildSpec) ×3

<!-- note:buildSpec>jit -->
<!-- /note -->

#### <a id="s-buildSpec-fit"></a>`buildSpec>fit(id, n=)`

function · L189–189

- called by: [`buildSpec`](#s-buildSpec) ×11 · [`buildSpec>once`](#s-buildSpec-once)

<!-- note:buildSpec>fit -->
<!-- /note -->

#### <a id="s-buildSpec-once"></a>`buildSpec>once(mag)`

function · L211–211

- calls: [`buildSpec>fit`](#s-buildSpec-fit)
- called by: [`buildSpec`](#s-buildSpec) ×3

<!-- note:buildSpec>once -->
<!-- /note -->

### <a id="s-manifestOf"></a>`manifestOf(lo, drivePart)`

function · L232–243

- calls: [`manifestOf>push`](#s-manifestOf-push) ×2
- via [js/shipgen/data/catalog/index.js](../shipgen/data/catalog/index.js.md): `CATALOG.map`
- called by: [`buildSpec`](#s-buildSpec)

<!-- note:manifestOf -->
Ordered, sectioned view of a loadout for the yard and the registry page.
<!-- /note -->

#### <a id="s-manifestOf-push"></a>`manifestOf>push(p, n)`

function · L234–238

- called by: [`manifestOf`](#s-manifestOf) ×2

<!-- note:manifestOf>push -->
<!-- /note -->

### <a id="s-manifestTotals"></a>`manifestTotals(spec)`

function · **exported** · L245–249

- called by: [`componentBill`](../economy/shipcost.js.md#s-componentBill) _js/economy/shipcost.js_

<!-- note:manifestTotals -->
Total fitted parts, mass (t) and net power (kW) of a spec's manifest.
<!-- /note -->

### <a id="s-genConfig"></a>`genConfig(def, seed, opts=)`

function · **exported** · L251–273

- calls: [`hullSpec`](#s-hullSpec) · [`liteLoadout`](#s-liteLoadout)
- called by: [`forgeShip`](shipforge.js.md#s-forgeShip) _js/ships/shipforge.js_

<!-- note:genConfig -->
Build config for the generator: the spec plus a seed and the livery.
<!-- /note -->

### <a id="s-liteLoadout"></a>`liteLoadout(lo)`

function · L275–285

- called by: [`genConfig`](#s-genConfig)

<!-- note:liteLoadout -->
Traffic and remote hulls keep the silhouette and the big fittings but drop
the sub-metre clutter so a dozen ships on screen stay cheap on a phone.
<!-- /note -->

### <a id="s-registerAll"></a>`registerAll(defs)`

function · **exported** · L287–289

- calls: [`hullSpec`](#s-hullSpec)

<!-- note:registerAll -->
Every registry def, warmed so SHIP_CLASSES knows all of them.
<!-- /note -->
