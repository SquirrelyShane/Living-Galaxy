# js/world/hulks.js

[index](../../../README.md) · 260 lines · 25 symbols · 4 imports · 12 importers

## About

<!-- note:@file -->
LIVING GALAXY — hulks.

0.3.86, Dead Hulls. A destroyed hull leaves a hulk: the same hull, dead, in
sections. Each section holds plate and parts, the bridge holds the flight
recorder, the hold keeps a share of whatever cargo was aboard. This module is
the entity only — store, spawn, frame, step, manifest. Nothing here cuts a
hulk; that is the salvage rig (`docs/SALVAGE_PLAN.md`, slice 0.3.87).

Like `debris.js` it never imports the sim: `bindHulks(sim)` hands it the clock.
A hulk is plain JSON-able data so a later slice can put it on the wire.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./bodies.js` | `BODIES`, `bodyById`, `bodyPosition`, `bodyVelocity` | [js/world/bodies.js](bodies.js.md) |
| 2 | `./generate.js` | `rngFromSeed` | [js/world/generate.js](generate.js.md) |
| 3 | `../ships/shipdb.js` | `shipById`, `DEFAULT_SHIP_ID`, `SHIP_DB` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 4 | `../economy/materials.js` | `baseValue` | [js/economy/materials.js](../economy/materials.js.md) |

## Imported by

- [js/aria/play.js](../aria/play.js.md) — `hulkById`
- [js/drones/ops.js](../drones/ops.js.md) — `spawnHulk`
- [js/economy/contracts.js](../economy/contracts.js.md) — `HULK`, `hulkById`, `hullForPlate`, `plateOf`, `spawnHulk`
- [js/flight/autopilot.js](../flight/autopilot.js.md) — `hulkById`
- [js/flight/rig.js](../flight/rig.js.md) — `HULK`, `hulkVelocity`, `nearHulks`, `removeHulk`
- [js/mission/salvage.js](../mission/salvage.js.md) — `hulks`, `hulkById`, `hulkManifest`, `HULK`
- [js/npc/battles.js](../npc/battles.js.md) — `spawnHulk`
- [js/render/engine.js](../render/engine.js.md) — `hulks`
- [js/sim/sim.js](../sim/sim.js.md) — `HULK`, `bindHulks`, `hulkById`, `hulkManifest`, `hulkVelocity`, `hulks`, `nearHulks`, `resetHulks`, `spawnHulk`, `stepHulks`
- [js/ui/tutorial.js](../ui/tutorial.js.md) — `hulks`
- test/hulks.test.mjs _(outside js/)_ — `HULK`, `HULK_PARTS`, `HULK_SECTIONS`, `hulks`, `spawnHulk`, `stepHulks`, `resetHulks`, `bindHulks`, `hulkById`, `nearHulks`, `removeHulk`, `hulkManifest`, `hulkVelocity`, `sectionCount`
- test/rig.test.mjs _(outside js/)_ — `HULK`, `hulks`, `spawnHulk`, `resetHulks`, `bindHulks`, `hulkManifest`

## Exports

- [`HULK`](#s-HULK) · const — used by [js/economy/contracts.js](../economy/contracts.js.md), [js/flight/rig.js](../flight/rig.js.md), [js/mission/salvage.js](../mission/salvage.js.md), [js/sim/sim.js](../sim/sim.js.md), test/hulks.test.mjs, test/rig.test.mjs
- [`HULK_SECTIONS`](#s-HULK_SECTIONS) · const — used by test/hulks.test.mjs
- [`HULK_PARTS`](#s-HULK_PARTS) · const — used by test/hulks.test.mjs
- [`hulks`](#s-hulks) · const — used by [js/mission/salvage.js](../mission/salvage.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md), test/hulks.test.mjs, test/rig.test.mjs
- [`resetHulks`](#s-resetHulks) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/hulks.test.mjs, test/rig.test.mjs
- [`bindHulks`](#s-bindHulks) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/hulks.test.mjs, test/rig.test.mjs
- [`hulkById`](#s-hulkById) · function — used by [js/aria/play.js](../aria/play.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/mission/salvage.js](../mission/salvage.js.md), [js/sim/sim.js](../sim/sim.js.md), test/hulks.test.mjs
- [`plateOf`](#s-plateOf) · function — used by [js/economy/contracts.js](../economy/contracts.js.md)
- [`hullForPlate`](#s-hullForPlate) · function — used by [js/economy/contracts.js](../economy/contracts.js.md)
- [`sectionCount`](#s-sectionCount) · function — used by test/hulks.test.mjs
- [`spawnHulk`](#s-spawnHulk) · function — used by [js/drones/ops.js](../drones/ops.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/npc/battles.js](../npc/battles.js.md), [js/sim/sim.js](../sim/sim.js.md), test/hulks.test.mjs, test/rig.test.mjs
- [`removeHulk`](#s-removeHulk) · function — used by [js/flight/rig.js](../flight/rig.js.md), test/hulks.test.mjs
- [`stepHulks`](#s-stepHulks) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/hulks.test.mjs
- [`hulkVelocity`](#s-hulkVelocity) · function — used by [js/flight/rig.js](../flight/rig.js.md), [js/sim/sim.js](../sim/sim.js.md), test/hulks.test.mjs
- [`nearHulks`](#s-nearHulks) · function — used by [js/flight/rig.js](../flight/rig.js.md), [js/sim/sim.js](../sim/sim.js.md), test/hulks.test.mjs
- [`hulkManifest`](#s-hulkManifest) · function — used by [js/mission/salvage.js](../mission/salvage.js.md), [js/sim/sim.js](../sim/sim.js.md), test/hulks.test.mjs, test/rig.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-HULK"></a>`HULK`

const · **exported** · L6–22

<!-- note:HULK -->
Every number a hulk is built from, in one place so the parity slice tunes here.

- `max` / `life` — the sky keeps 48; an unpinned hulk lasts 90 minutes of sim time
- `plate` — the good a section's plate is counted in (`steel`: scrap, not finished plate)
- `plateK`, `plateExp` — plate units for an intact hull = `plateK * massT ^ plateExp`
- `partK`, `partExp` — parts rolled = `partK * massT ^ partExp`, each surviving with its section's `intact`
- `intact` — per-section damage band; `cargoKeep` — share of the hold that survives
- `drift`, `driftMax`, `driftTau` — a hulk inherits a quarter of the hull's velocity, capped, and loses it with a 45 s time constant, so it stays near where it died
- `again` — two reports of one death inside this many seconds are one hulk
- `sweep` — seconds between checks for a hulk that has ended up inside a world
<!-- /note -->

### <a id="s-HULK_SECTIONS"></a>`HULK_SECTIONS`

const · **exported** · L24–24

<!-- note:HULK_SECTIONS -->
<!-- /note -->

### <a id="s-HULK_PARTS"></a>`HULK_PARTS`

const · **exported** · L26–35

<!-- note:HULK_PARTS -->
<!-- /note -->

### <a id="s-TIERS"></a>`TIERS`

const · L37–37

<!-- note:TIERS -->
<!-- /note -->

### <a id="s-hulks"></a>`hulks`

const · **exported** · L39–39

<!-- note:hulks -->
<!-- /note -->

### <a id="s-_bp"></a>`_bp`

const · L41–41

<!-- note:_bp -->
<!-- /note -->

### <a id="s-seq"></a>`seq`

const · L42–42

<!-- note:seq -->
<!-- /note -->

### <a id="s-sweepT"></a>`sweepT`

const · L43–43

<!-- note:sweepT -->
<!-- /note -->

### <a id="s-sim0"></a>`sim0`

const · L44–44

<!-- note:sim0 -->
<!-- /note -->

### <a id="s-resetHulks"></a>`resetHulks()`

function · **exported** · L46–50

- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:resetHulks -->
<!-- /note -->

### <a id="s-bindHulks"></a>`bindHulks(sim)`

function · **exported** · L52–54

- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:bindHulks -->
<!-- /note -->

### <a id="s-hulkById"></a>`hulkById(id)`

function · **exported** · L56–59

- called by: [`jobPlan`](../aria/play.js.md#s-jobPlan) _js/aria/play.js_ · [`jobSeconds`](../aria/play.js.md#s-jobSeconds) _js/aria/play.js_ · [`anchorFor`](../economy/contracts.js.md#s-anchorFor) _js/economy/contracts.js_ · [`jobStatus`](../economy/contracts.js.md#s-jobStatus) _js/economy/contracts.js_ · [`noteSalvaged`](../economy/contracts.js.md#s-noteSalvaged) _js/economy/contracts.js_ · [`settle`](../economy/contracts.js.md#s-settle) _js/economy/contracts.js_ · [`engageSalvageLoop`](../flight/autopilot.js.md#s-engageSalvageLoop) _js/flight/autopilot.js_ · [`makeSalvage`](../mission/salvage.js.md#s-makeSalvage) _js/mission/salvage.js_ · [`makeSalvage>pick`](../mission/salvage.js.md#s-makeSalvage-pick) _js/mission/salvage.js_ ×2 · [`candidateSig`](../sim/sim.js.md#s-candidateSig) _js/sim/sim.js_ · [`h`](../sim/sim.js.md#s-h) _js/sim/sim.js_ · [`targetPosition`](../sim/sim.js.md#s-targetPosition) _js/sim/sim.js_ · [`targetVelocity`](../sim/sim.js.md#s-targetVelocity) _js/sim/sim.js_

<!-- note:hulkById -->
<!-- /note -->

### <a id="s-plateOf"></a>`plateOf(def)`

function · **exported** · L61–61

- called by: [`acceptContract`](../economy/contracts.js.md#s-acceptContract) _js/economy/contracts.js_ · [`hullForPlate`](#s-hullForPlate)

<!-- note:plateOf -->
<!-- /note -->

### <a id="s-hullForPlate"></a>`hullForPlate(qty, margin=)`

function · **exported** · L63–71

- calls: [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ · [`plateOf`](#s-plateOf)
- called by: [`acceptContract`](../economy/contracts.js.md#s-acceptContract) _js/economy/contracts.js_

<!-- note:hullForPlate -->
The smallest hull in the book whose whole plate covers a job — what a
contract wreck is the hulk of.
<!-- /note -->

### <a id="s-sectionCount"></a>`sectionCount(tier)`

function · **exported** · L73–76

- called by: [`buildSections`](#s-buildSections)

<!-- note:sectionCount -->
<!-- /note -->

### <a id="s-buildSections"></a>`buildSections(def, cargo, rnd, intact)`

function · L78–105

- calls: [`sectionCount`](#s-sectionCount)
- called by: [`spawnHulk`](#s-spawnHulk)

<!-- note:buildSections -->
Sections in a fixed order (`HULK_SECTIONS`), two for an A hull up to eight for a G.
Plate is shared out by a seeded weight then scaled by that section's `intact`.
Parts are dealt round the sections from each one's pool. `intact` passed in
(0..1) overrides the roll — a crew-abandoned derelict will pass 1.
<!-- /note -->

### <a id="s-frameFor"></a>`frameFor(x, y, z, time, parent=)`

function · L107–122

- calls: [`bodyById`](bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`bodyPosition`](bodies.js.md#s-bodyPosition) _js/world/bodies.js_ ×2
- called by: [`spawnHulk`](#s-spawnHulk)

<!-- note:frameFor -->
Which frame a hulk lies in. Inside a world's sphere of influence (`b.soi`) it is
parented to that world — the smallest sphere wins, so a moon beats its planet —
and stores an offset; otherwise it is fixed in the star's frame. This is the
same rule `gravityOfWorlds` (`flight/ship.js`) uses to pick the ship's primary,
so a hulk and the ship beside it ride the same frame. `b.well` is wider and
overlaps (the Moon's well reaches low Earth orbit): using it parented a hulk
off Earth to the Moon and it slid away at ~7 u/s. Planets move at tens of u/s,
so with no frame at all a wreck beside a port would be left behind by it.
<!-- /note -->

### <a id="s-busy"></a>`busy(h, time)`

function · L124–124

- called by: [`dropOldest`](#s-dropOldest) · [`stepHulks`](#s-stepHulks)

<!-- note:busy -->
0.3.90: a hulk somebody is flying to or has a rig on is not the one the cap
throws away. The sky makes three or four a minute and keeps 48, so before
this the oldest — often the one being cut — went out from under the beam.
<!-- /note -->

### <a id="s-dropOldest"></a>`dropOldest()`

function · L126–134

- calls: [`busy`](#s-busy)
- called by: [`spawnHulk`](#s-spawnHulk)

<!-- note:dropOldest -->
<!-- /note -->

### <a id="s-spawnHulk"></a>`spawnHulk(v, {…}=)`

function · **exported** · L136–184

- calls: [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ ×2 · [`rngFromSeed`](generate.js.md#s-rngFromSeed) _js/world/generate.js_ · [`buildSections`](#s-buildSections) · [`dropOldest`](#s-dropOldest) · [`frameFor`](#s-frameFor)
- called by: [`ROLE_STEP.combat`](../drones/ops.js.md#s-ROLE_STEP-combat) _js/drones/ops.js_ · [`acceptContract`](../economy/contracts.js.md#s-acceptContract) _js/economy/contracts.js_ · [`stepBattles`](../npc/battles.js.md#s-stepBattles) _js/npc/battles.js_ · [`leaveHulk`](../sim/sim.js.md#s-leaveHulk) _js/sim/sim.js_

<!-- note:spawnHulk -->
`v` is anything with `id, name, ship, x, y, z` — a traffic vessel is one.
Optional on `v`: `vx vy vz yaw role cargo radius`. Options: `source` (who
reports the death), `owner` (corp id, for salvage rights later), `at`,
`pinned` (never expires, never dropped for the cap — for contract hulks),
`intact`. Seeded off the vessel id and the second it died, so the same death
builds the same hulk. Returns the hulk, the existing one for a repeat report,
or null for a hull with no position.
<!-- /note -->

### <a id="s-removeHulk"></a>`removeHulk(h)`

function · **exported** · L186–191

- called by: [`stepRig`](../flight/rig.js.md#s-stepRig) _js/flight/rig.js_

<!-- note:removeHulk -->
<!-- /note -->

### <a id="s-stepHulks"></a>`stepHulks(dt)`

function · **exported** · L193–227

- calls: [`bodyById`](bodies.js.md#s-bodyById) _js/world/bodies.js_ · [`bodyPosition`](bodies.js.md#s-bodyPosition) _js/world/bodies.js_ ×2 · [`busy`](#s-busy)
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepHulks -->
Ages, drifts, re-places against the parent frame, tumbles. A hulk whose parent
world shatters or collapses is cut loose where it is. Every `HULK.sweep`
seconds anything inside a world's radius is removed.
<!-- /note -->

### <a id="s-hulkVelocity"></a>`hulkVelocity(h, out)`

function · **exported** · L229–235

- calls: [`bodyVelocity`](bodies.js.md#s-bodyVelocity) _js/world/bodies.js_
- called by: [`shed`](../flight/rig.js.md#s-shed) _js/flight/rig.js_ · [`stepRig`](../flight/rig.js.md#s-stepRig) _js/flight/rig.js_ · [`targetVelocity`](../sim/sim.js.md#s-targetVelocity) _js/sim/sim.js_

<!-- note:hulkVelocity -->
<!-- /note -->

### <a id="s-nearHulks"></a>`nearHulks(pos, range)`

function · **exported** · L237–245

- called by: [`rigTarget`](../flight/rig.js.md#s-rigTarget) _js/flight/rig.js_ · [`lockCandidates`](../sim/sim.js.md#s-lockCandidates) _js/sim/sim.js_ · [`tryAssay`](../sim/sim.js.md#s-tryAssay) _js/sim/sim.js_

<!-- note:nearHulks -->
<!-- /note -->

### <a id="s-hulkManifest"></a>`hulkManifest(h)`

function · **exported** · L247–260

- calls: [`baseValue`](../economy/materials.js.md#s-baseValue) _js/economy/materials.js_ ×3
- called by: [`bestHulk`](../mission/salvage.js.md#s-bestHulk) _js/mission/salvage.js_ · [`hulkWorth`](../mission/salvage.js.md#s-hulkWorth) _js/mission/salvage.js_ · [`tryAssay`](../sim/sim.js.md#s-tryAssay) _js/sim/sim.js_

<!-- note:hulkManifest -->
What is left aboard, added over the sections: plate, parts by id, cargo by id,
sections still uncut, whether the recorder is aboard, and a value at base prices.
<!-- /note -->
