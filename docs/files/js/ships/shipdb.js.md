# js/ships/shipdb.js

[index](../../../README.md) · 519 lines · 16 symbols · 1 imports · 34 importers

## About

<!-- note:@file -->
LIVING GALAXY — the fleet registry.

Every hull anyone flies in the sky is one of these. A ship def fixes the
silhouette grammar the forge is allowed to use, the working dimensions,
and the numbers the sim reads: dry mass, cargo, reactor, handling.

Hulls are organized by industrial complex (see careers/complexes.js) and
rank letter — the rung of the ladder where the complex will sign the hull
over to you. Tier A is what a surveyor gets handed; tier G is the platform
a complex authority commands. The eight `general` hulls have no ladder and
are for open sale.

Scale: 1 world unit = 10 m. `dims` are [length, beam, height] in units, so
a [2.4, 1.0, 0.6] hull is a 24 m boat. The forge normalizes to dims.

stats:
  massT     dry mass, tonnes            cargo   m^3
  reactor   units/s (player hull is 130)
  thrust / turn   multipliers on the base flight constants
  turrets   fitted mounts               crew    berths

- L53 · `SHIP_DB.push(` — ---- mining ------------------------------------------------------------
- L53 · `SHIP_DB.push(` — ---- healthcare --------------------------------------------------------
- L53 · `SHIP_DB.push(` — ---- shipyard ----------------------------------------------------------
- L53 · `SHIP_DB.push(` — ---- manufacturing -----------------------------------------------------
- L53 · `SHIP_DB.push(` — ---- logistics ---------------------------------------------------------
- L53 · `SHIP_DB.push(` — ---- energy ------------------------------------------------------------
- L53 · `SHIP_DB.push(` — ---- construction ------------------------------------------------------
- L53 · `SHIP_DB.push(` — ---- agriculture -------------------------------------------------------
- L53 · `SHIP_DB.push(` — ---- research ----------------------------------------------------------
- L53 · `SHIP_DB.push(` — ---- security ----------------------------------------------------------
- L53 · `SHIP_DB.push(` — ---- navigation --------------------------------------------------------
- L53 · `SHIP_DB.push(` — ---- commerce ----------------------------------------------------------
- L53 · `SHIP_DB.push(` — ---- communications ----------------------------------------------------
- L53 · `SHIP_DB.push(` — ---- terraforming ------------------------------------------------------
- L53 · `SHIP_DB.push(` — ---- salvage -----------------------------------------------------------
- L53 · `SHIP_DB.push(` — ---- education ---------------------------------------------------------
- L53 · `SHIP_DB.push(` — ---- general market hulls (no ladder) ----------------------------------
- L114 · `{` — Fix duplicate ids for general hulls (two share a tier letter).
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../economy/materials.js` | `holdForCargoRating`, `HOLD` | [js/economy/materials.js](../economy/materials.js.md) |

## Imported by

- [js/aria/senses.js](../aria/senses.js.md) — `shipById`
- [js/corp/fleet.js](../corp/fleet.js.md) — `shipById`, `SHIP_DB`, `hullTuneFor`
- [js/crew/roster.js](../crew/roster.js.md) — `shipById`
- [js/economy/contracts.js](../economy/contracts.js.md) — `shipById`
- [js/economy/icework.js](../economy/icework.js.md) — `shipById`
- [js/economy/upgrades.js](../economy/upgrades.js.md) — `shipById`
- [js/interior/interior.js](../interior/interior.js.md) — `shipById`
- [js/npc/crewfx.js](../npc/crewfx.js.md) — `shipById`
- [js/npc/flight.js](../npc/flight.js.md) — `shipById`
- [js/npc/flow.js](../npc/flow.js.md) — `shipById`
- [js/npc/npccrew.js](../npc/npccrew.js.md) — `shipById`
- [js/npc/speech.js](../npc/speech.js.md) — `shipById`
- [js/npc/traffic.js](../npc/traffic.js.md) — `shipById`
- [js/render/attract.js](../render/attract.js.md) — `shipById`, `SHIP_DB`, `DEFAULT_SHIP_ID`
- [js/render/engine.js](../render/engine.js.md) — `DEFAULT_SHIP_ID`, `shipById`
- [js/render/hullpool.js](../render/hullpool.js.md) — `shipById`, `DEFAULT_SHIP_ID`
- [js/sim/sim.js](../sim/sim.js.md) — `DEFAULT_SHIP_ID`, `hullTuneFor`, `issuedShips`, `shipById`
- [js/station/refityard.js](../station/refityard.js.md) — `shipById`
- [js/station/stationdeck.js](../station/stationdeck.js.md) — `SHIP_DB`, `shipById`, `sizeBand`
- [js/world/events/atmoworks.js](../world/events/atmoworks.js.md) — `shipById`
- [js/world/hulks.js](../world/hulks.js.md) — `shipById`, `DEFAULT_SHIP_ID`, `SHIP_DB`
- test/balance.test.mjs _(outside js/)_ — `SHIP_DB`
- test/defence.test.mjs _(outside js/)_ — `SHIP_DB`, `shipById`, `DEFAULT_SHIP_ID`
- test/experimental.test.mjs _(outside js/)_ — `SHIP_DB`
- test/forge.test.mjs _(outside js/)_ — `SHIP_DB`
- test/hulks.test.mjs _(outside js/)_ — `SHIP_DB`, `shipById`
- test/hullspec.test.mjs _(outside js/)_ — `SHIP_DB`, `SIZE_BANDS`
- test/insurance.test.mjs _(outside js/)_ — `SHIP_DB`, `shipById`, `DEFAULT_SHIP_ID`
- test/portdrones.test.mjs _(outside js/)_ — `SHIP_DB`
- test/rig.test.mjs _(outside js/)_ — `hullTuneFor`, `shipById`
- test/sky.test.mjs _(outside js/)_ — `SHIP_DB`, `shipById`, `hullTuneFor`, `DEFAULT_SHIP_ID`
- test/stafflife.test.mjs _(outside js/)_ — `SHIP_DB`, `hullTuneFor`
- test/systems.test.mjs _(outside js/)_ — `shipById`
- test/upgrades.test.mjs _(outside js/)_ — `shipById`

## Exports

- [`SIZE_BANDS`](#s-SIZE_BANDS) · const — used by test/hullspec.test.mjs
- [`sizeBand`](#s-sizeBand) · function — used by [js/station/stationdeck.js](../station/stationdeck.js.md)
- [`SHIP_DB`](#s-SHIP_DB) · const — used by [js/corp/fleet.js](../corp/fleet.js.md), [js/render/attract.js](../render/attract.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md), [js/world/hulks.js](../world/hulks.js.md), test/balance.test.mjs, test/defence.test.mjs, test/experimental.test.mjs, test/forge.test.mjs, test/hulks.test.mjs, test/hullspec.test.mjs, test/insurance.test.mjs, test/portdrones.test.mjs, test/sky.test.mjs, test/stafflife.test.mjs
- [`shipById`](#s-shipById) · function — used by [js/aria/senses.js](../aria/senses.js.md), [js/corp/fleet.js](../corp/fleet.js.md), [js/crew/roster.js](../crew/roster.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/economy/icework.js](../economy/icework.js.md), [js/economy/upgrades.js](../economy/upgrades.js.md), [js/interior/interior.js](../interior/interior.js.md), [js/npc/crewfx.js](../npc/crewfx.js.md), [js/npc/flight.js](../npc/flight.js.md), [js/npc/flow.js](../npc/flow.js.md), [js/npc/npccrew.js](../npc/npccrew.js.md), [js/npc/speech.js](../npc/speech.js.md), [js/npc/traffic.js](../npc/traffic.js.md), [js/render/attract.js](../render/attract.js.md), [js/render/engine.js](../render/engine.js.md), [js/render/hullpool.js](../render/hullpool.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/refityard.js](../station/refityard.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md), [js/world/events/atmoworks.js](../world/events/atmoworks.js.md), [js/world/hulks.js](../world/hulks.js.md), test/defence.test.mjs, test/hulks.test.mjs, test/insurance.test.mjs, test/rig.test.mjs, test/sky.test.mjs, test/systems.test.mjs, test/upgrades.test.mjs
- [`shipsForComplex`](#s-shipsForComplex) · function — **no importer in scanned roots**
- [`issuedShips`](#s-issuedShips) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`complexesInDb`](#s-complexesInDb) · function — **no importer in scanned roots**
- [`DEFAULT_SHIP_ID`](#s-DEFAULT_SHIP_ID) · const — used by [js/render/attract.js](../render/attract.js.md), [js/render/engine.js](../render/engine.js.md), [js/render/hullpool.js](../render/hullpool.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/world/hulks.js](../world/hulks.js.md), test/defence.test.mjs, test/insurance.test.mjs, test/sky.test.mjs
- [`hullTuneFor`](#s-hullTuneFor) · function — used by [js/corp/fleet.js](../corp/fleet.js.md), [js/sim/sim.js](../sim/sim.js.md), test/rig.test.mjs, test/sky.test.mjs, test/stafflife.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-SIZE_BANDS"></a>`SIZE_BANDS`

const · **exported** · L3–11

<!-- note:SIZE_BANDS -->
<!-- /note -->

### <a id="s-sizeBand"></a>`sizeBand(def)`

function · **exported** · L13–16

- called by: [`PANELS.shipyard>render`](../station/stationdeck.js.md#s-PANELS-shipyard-render) _js/station/stationdeck.js_

<!-- note:sizeBand -->
<!-- /note -->

### <a id="s-TIER"></a>`TIER`

const · L18–26

<!-- note:TIER -->
Tier scaling used to derive stats so 112 hulls stay consistent.
Each complex def below only supplies deltas where the line deviates.
<!-- /note -->

### <a id="s-mk"></a>`mk(complex, letter, name, role, grammar, blurb, over=)`

function · L28–45

- called by: [`@file`](#) ×121

<!-- note:mk -->
- L43 · `grammar,` — { body, nose, wings, engines:[min,max], weapons, modules:[...] }
<!-- /note -->

### <a id="s-g"></a>`g(body, nose, wings, engines, weapons, modules)`

function · L47–49

- called by: [`@file`](#) ×121

<!-- note:g -->
g() builds a grammar object tersely.
<!-- /note -->

### <a id="s-SHIP_DB"></a>`SHIP_DB`

const · **exported** · L51–51

<!-- note:SHIP_DB -->
<!-- /note -->

### <a id="s-seen"></a>`seen`

const · L476–476

<!-- note:seen -->
<!-- /note -->

### <a id="s-n"></a>`n`

const · L478–478

<!-- note:n -->
<!-- /note -->

### <a id="s-BY_ID"></a>`BY_ID`

const · L484–484

<!-- note:BY_ID -->
---- lookups ------------------------------------------------------------
<!-- /note -->

### <a id="s-shipById"></a>`shipById(id)`

function · **exported** · L486–488

- called by: [`senseHull`](../aria/senses.js.md#s-senseHull) _js/aria/senses.js_ · [`commissionBlocker`](../corp/fleet.js.md#s-commissionBlocker) _js/corp/fleet.js_ · [`commissionHull`](../corp/fleet.js.md#s-commissionHull) _js/corp/fleet.js_ · [`fleetHold`](../corp/fleet.js.md#s-fleetHold) _js/corp/fleet.js_ · [`yardPrice`](../corp/fleet.js.md#s-yardPrice) _js/corp/fleet.js_ ×2 · [`currentPlan`](../crew/roster.js.md#s-currentPlan) _js/crew/roster.js_ ×2 · [`hullFit`](../economy/contracts.js.md#s-hullFit) _js/economy/contracts.js_ · [`iceworkFit`](../economy/icework.js.md#s-iceworkFit) _js/economy/icework.js_ · [`hullTier`](../economy/upgrades.js.md#s-hullTier) _js/economy/upgrades.js_ · [`ensurePlan`](../interior/interior.js.md#s-ensurePlan) _js/interior/interior.js_ ×2 · [`crewEffects`](../npc/crewfx.js.md#s-crewEffects) _js/npc/crewfx.js_ ×2 · [`hullPerf`](../npc/flight.js.md#s-hullPerf) _js/npc/flight.js_ · [`populateFlow`](../npc/flow.js.md#s-populateFlow) _js/npc/flow.js_ · [`crewSizeOf`](../npc/npccrew.js.md#s-crewSizeOf) _js/npc/npccrew.js_ · [`vesselUnit`](../npc/speech.js.md#s-vesselUnit) _js/npc/speech.js_ · [`buildLegs`](../npc/traffic.js.md#s-buildLegs) _js/npc/traffic.js_ · [`buildRoster`](../npc/traffic.js.md#s-buildRoster) _js/npc/traffic.js_ · [`spawnVessel`](../npc/traffic.js.md#s-spawnVessel) _js/npc/traffic.js_ · [`mountAttract>buildHull`](../render/attract.js.md#s-mountAttract-buildHull) _js/render/attract.js_ ×2 · [`makeShipGroup`](../render/engine.js.md#s-makeShipGroup) _js/render/engine.js_ ×2 · [`mountGame>wreckOf`](../render/engine.js.md#s-mountGame-wreckOf) _js/render/engine.js_ ×2 · [`warm`](../render/hullpool.js.md#s-warm) _js/render/hullpool.js_ ×2 · [`crewCapacity`](../sim/sim.js.md#s-crewCapacity) _js/sim/sim.js_ · [`currentShipId`](../sim/sim.js.md#s-currentShipId) _js/sim/sim.js_ · [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_ · [`loseHull`](../sim/sim.js.md#s-loseHull) _js/sim/sim.js_ ×2 · [`onKill`](../sim/sim.js.md#s-onKill) _js/sim/sim.js_ · [`syncHullDefence`](../sim/sim.js.md#s-syncHullDefence) _js/sim/sim.js_ · [`syncHullTune`](../sim/sim.js.md#s-syncHullTune) _js/sim/sim.js_ · [`build`](../station/refityard.js.md#s-build) _js/station/refityard.js_ · [`PANELS.shipyard`](../station/stationdeck.js.md#s-PANELS-shipyard) _js/station/stationdeck.js_ ×2 · [`PANELS.shipyard>render`](../station/stationdeck.js.md#s-PANELS-shipyard-render) _js/station/stationdeck.js_ ×3 · [`atmoFit`](../world/events/atmoworks.js.md#s-atmoFit) _js/world/events/atmoworks.js_ · [`adoptHulkWire`](../world/hulks.js.md#s-adoptHulkWire) _js/world/hulks.js_ ×2 · [`hullForPlate`](../world/hulks.js.md#s-hullForPlate) _js/world/hulks.js_ · [`spawnHulk`](../world/hulks.js.md#s-spawnHulk) _js/world/hulks.js_ ×2

<!-- note:shipById -->
<!-- /note -->

### <a id="s-shipsForComplex"></a>`shipsForComplex(complexId)`

function · **exported** · L490–492

<!-- note:shipsForComplex -->
<!-- /note -->

### <a id="s-issuedShips"></a>`issuedShips(complexId, letter)`

function · **exported** · L494–499

- called by: [`issuedHullId`](../sim/sim.js.md#s-issuedHullId) _js/sim/sim.js_

<!-- note:issuedShips -->
Hulls a member of `complexId` at rank `letter` may be issued (their line, up to rank).
<!-- /note -->

### <a id="s-complexesInDb"></a>`complexesInDb()`

function · **exported** · L501–503

<!-- note:complexesInDb -->
<!-- /note -->

### <a id="s-DEFAULT_SHIP_ID"></a>`DEFAULT_SHIP_ID`

const · **exported** · L505–505

<!-- note:DEFAULT_SHIP_ID -->
Every pilot starts in the trainer. The complex's own line is bought at the
yard at the issue rate as rank allows — see shipcost.js yardQuote.
<!-- /note -->

### <a id="s-hullTuneFor"></a>`hullTuneFor(def)`

function · **exported** · L507–519

- calls: [`holdForCargoRating`](../economy/materials.js.md#s-holdForCargoRating) _js/economy/materials.js_ · [`hullTuneFor>clamp`](#s-hullTuneFor-clamp) ×3
- called by: [`_hullTune`](../sim/sim.js.md#s-_hullTune) _js/sim/sim.js_ · [`syncHullTune`](../sim/sim.js.md#s-syncHullTune) _js/sim/sim.js_

<!-- note:hullTuneFor -->
Flight-side multipliers the sim reads off the active hull, so a rookie
skiff and a colossus fly differently: thrust and attitude straight from
the registry, reactor and hold on a softened curve (the player's base
hull is 130 u/s and 400 m³; a skiff should feel small, not unflyable).

- L515 · `reactor: clamp((s.reactor / 130) ** 0.35, 1, 2.2),` — floor at the stock 130 kW core: at 0.85 the starter hulls idled their own
  default loadout (shields, turrets, gravity, sentry, cutter) at 101 of 110 kW
  and every regen tick put the bus over — "overloaded everywhere" from launch
- L516 · `cargo: holdForCargoRating(s.cargo) / HOLD.base,` — 0.3.52: the hold is a volume and has no ceiling — a Fledgling (rating 12)
  carries ~1,170 hu, a G-frame ark ~468,000. Was sqrt(rating/30) clamped
  to 0.5–4: every hull between 1,600 and nothing.
<!-- /note -->

#### <a id="s-hullTuneFor-clamp"></a>`hullTuneFor>clamp(v, a, b)`

function · L510–510

- called by: [`hullTuneFor`](#s-hullTuneFor) ×3

<!-- note:hullTuneFor>clamp -->
<!-- /note -->

## Module-level calls

- calls: [`mk`](#s-mk) · [`g`](#s-g)
