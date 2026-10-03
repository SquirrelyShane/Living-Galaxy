# js/npc/battles.js

[index](../../../README.md) · 246 lines · 28 symbols · 7 imports · 9 importers

## About

<!-- note:@file -->
LIVING GALAXY — engagements: the fights the sky has without you.

Pirates lurk on the belt approaches (npc/traffic.js). Every so often a
wing of them jumps a working hull — a trader on its burn out, a miner on
a claim — and security answers. The whole thing is a timetable, like the
traffic it preys on: engagement k of this sky is a pure function of
(seed, k), so two clients in the same room see the same ambush at the
same place with the same ending, and nothing needs a host.

An engagement has a site (where the victim was when the pirates dropped
in), a start, a security arrival, and an end with an outcome — the
pirates are driven off (one goes down), the victim is lost, or both sides
break off. While it runs the participants are pulled off their routes
onto battle poses around the site: the victim runs, the pirates circle
it, security closes and circles wider. Tracers fly between them (turrets.js
shot pool, faction "npc": drawn, never lethal — the outcome is decided by
the seed, not by who the client thinks got hit).

Fly inside JOIN_R of the site and you are in it: pirates take you as a
target, your turrets take them (they are hostile contacts), and a pirate
you kill during the fight pays the security bounty and saves the victim
regardless of what the seed had planned.

- L13 · `export const ENG_SLOT = 240;` — seconds of sky time between rolls
- L14 · `export const ENG_CHANCE = 0.55;` — chance a slot carries a fight
- L15 · `export const JOIN_R = 1400;` — fly this close and you are a participant
- L16 · `export const ENGAGE_R = 1600;` — pirates open up on a participant inside this
- L17 · `export const DISENGAGE_S = 26;` — blend back onto the timetable after the end
- L19 · `export const engagements = [];` — live and recently ended, oldest first
- L20 · `const known = new Map();` — slot → engagement (or null when the roll was quiet)
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../corp/corps.js` | `corpOfVessel`, `corpRelation` | [js/corp/corps.js](../corp/corps.js.md) |
| 2 | `../world/generate.js` | `rngFromSeed` | [js/world/generate.js](../world/generate.js.md) |
| 3 | `./traffic.js` | `traffic`, `trafficDown`, `trafficHooks`, `routePose`, `markVesselDown`, `vesselById`, `eventAt`, `HOSTILE_ROLES`, `LAW_ROLES` | [js/npc/traffic.js](traffic.js.md) |
| 4 | `../world/debris.js` | `burst` | [js/world/debris.js](../world/debris.js.md) |
| 5 | `../world/hulks.js` | `spawnHulk` | [js/world/hulks.js](../world/hulks.js.md) |
| 6 | `../station/stations.js` | `stations` as `liveStations` | [js/station/stations.js](../station/stations.js.md) |
| 7 | `../world/bodies.js` | `currentSystem` | [js/world/bodies.js](../world/bodies.js.md) |

## Imported by

- [js/comms/comms.js](../comms/comms.js.md) — `fightCentre`
- [js/drones/ops.js](../drones/ops.js.md) — `pirateKilled`
- [js/flight/turrets.js](../flight/turrets.js.md) — `engagementAt`, `ENGAGE_R`
- [js/npc/ground.js](ground.js.md) — `engagementAt`
- [js/npc/npccrew.js](npccrew.js.md) — `engagementOf`
- [js/render/engine.js](../render/engine.js.md) — `fightCentre`
- [js/sim/sim.js](../sim/sim.js.md) — `battleHooks`, `fightCentre`, `pirateKilled`, `resetBattles`, `stepBattles`
- test/hulks.test.mjs _(outside js/)_ — `engagementAt`, `stepBattles`, `ENG_SLOT`
- test/sky.test.mjs _(outside js/)_ — `engagementAt`, `engagements`, `stepBattles`, `resetBattles`, `ENG_SLOT`, `JOIN_R`, `pirateKilled`

## Exports

- [`ENG_SLOT`](#s-ENG_SLOT) · const — used by test/hulks.test.mjs, test/sky.test.mjs
- [`ENG_CHANCE`](#s-ENG_CHANCE) · const — **no importer in scanned roots**
- [`JOIN_R`](#s-JOIN_R) · const — used by test/sky.test.mjs
- [`ENGAGE_R`](#s-ENGAGE_R) · const — used by [js/flight/turrets.js](../flight/turrets.js.md)
- [`DISENGAGE_S`](#s-DISENGAGE_S) · const — **no importer in scanned roots**
- [`engagements`](#s-engagements) · const — used by test/sky.test.mjs
- [`battleHooks`](#s-battleHooks) · const — used by [js/sim/sim.js](../sim/sim.js.md)
- [`resetBattles`](#s-resetBattles) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/sky.test.mjs
- [`engagementAt`](#s-engagementAt) · function — used by [js/flight/turrets.js](../flight/turrets.js.md), [js/npc/ground.js](ground.js.md), test/hulks.test.mjs, test/sky.test.mjs
- [`engagementOf`](#s-engagementOf) · function — used by [js/npc/npccrew.js](npccrew.js.md)
- [`fightCentre`](#s-fightCentre) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`stepBattles`](#s-stepBattles) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/hulks.test.mjs, test/sky.test.mjs
- [`pirateKilled`](#s-pirateKilled) · function — used by [js/drones/ops.js](../drones/ops.js.md), [js/sim/sim.js](../sim/sim.js.md), test/sky.test.mjs
- [`isHostileRole`](#s-isHostileRole) · function — **no importer in scanned roots**
- [`isLawRole`](#s-isLawRole) · function — **no importer in scanned roots**
- `trafficDown` — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-wingBuf"></a>`wingBuf`

const · L9–9

<!-- note:wingBuf -->
reused per-tick scratch: the battle tick used to allocate four arrays a frame
<!-- /note -->

### <a id="s-lawBuf"></a>`lawBuf`

const · L10–10

<!-- note:lawBuf -->
<!-- /note -->

### <a id="s-foeBuf"></a>`foeBuf`

const · L11–11

<!-- note:foeBuf -->
<!-- /note -->

### <a id="s-ENG_SLOT"></a>`ENG_SLOT`

const · **exported** · L13–13

<!-- note:ENG_SLOT -->
<!-- /note -->

### <a id="s-ENG_CHANCE"></a>`ENG_CHANCE`

const · **exported** · L14–14

<!-- note:ENG_CHANCE -->
<!-- /note -->

### <a id="s-JOIN_R"></a>`JOIN_R`

const · **exported** · L15–15

<!-- note:JOIN_R -->
<!-- /note -->

### <a id="s-ENGAGE_R"></a>`ENGAGE_R`

const · **exported** · L16–16

<!-- note:ENGAGE_R -->
<!-- /note -->

### <a id="s-DISENGAGE_S"></a>`DISENGAGE_S`

const · **exported** · L17–17

<!-- note:DISENGAGE_S -->
<!-- /note -->

### <a id="s-engagements"></a>`engagements`

const · **exported** · L19–19

<!-- note:engagements -->
<!-- /note -->

### <a id="s-known"></a>`known`

const · L20–20

<!-- note:known -->
<!-- /note -->

### <a id="s-skySeed"></a>`skySeed`

const · L21–21

<!-- note:skySeed -->
<!-- /note -->

### <a id="s-battleHooks"></a>`battleHooks`

const · **exported** · L22–22

<!-- note:battleHooks -->
<!-- /note -->

### <a id="s-resetBattles"></a>`resetBattles(seed)`

function · **exported** · L24–28

- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:resetBattles -->
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L30–30 · **never referenced**

<!-- note:_p -->
---- the roll ------------------------------------------------------------
<!-- /note -->

### <a id="s-preyRoles"></a>`preyRoles`

const · L31–31

<!-- note:preyRoles -->
<!-- /note -->

### <a id="s-engagementFor"></a>`engagementFor(slot, stationList, system)`

function · L33–86

- calls: [`corpOfVessel`](../corp/corps.js.md#s-corpOfVessel) _js/corp/corps.js_ ×2 · [`corpRelation`](../corp/corps.js.md#s-corpRelation) _js/corp/corps.js_ · [`eventAt`](traffic.js.md#s-eventAt) _js/npc/traffic.js_ · [`routePose`](traffic.js.md#s-routePose) _js/npc/traffic.js_ ×2 · [`rngFromSeed`](../world/generate.js.md#s-rngFromSeed) _js/world/generate.js_
- via [js/npc/traffic.js](traffic.js.md): `traffic.filter`
- called by: [`engagementAt`](#s-engagementAt)

<!-- note:engagementFor -->
- L40 · `const watch = eventAt(skySeed, slot * ENG_SLOT + 1).kind === "pirate_watch";` — a PIRATE WATCH bulletin means what it says: more raids, bigger wings
- L42 · `const weighted = [];` — prey whose flag is at war with the raiders' flag is the prey they go for
- L53 · `const t0 = slot * ENG_SLOT + 20 + rng() * 60;` — find a moment in the slot when the victim is actually on the board
- L83 · `for (const k of known.keys()) if (k < slot - 2) known.delete(k);` — only the current and previous slot are ever asked for again
<!-- /note -->

### <a id="s-engagementAt"></a>`engagementAt(t, stationList=, system=)`

function · **exported** · L88–97

- calls: [`engagementFor`](#s-engagementFor)
- called by: [`stepPirates`](../flight/turrets.js.md#s-stepPirates) _js/flight/turrets.js_ · [`engagementOf`](#s-engagementOf) · [`pirateKilled`](#s-pirateKilled) · [`stepBattles`](#s-stepBattles) · [`underFire`](ground.js.md#s-underFire) _js/npc/ground.js_

<!-- note:engagementAt -->
Engagement live at sky time t, or null. Rolls the slot on first sight.
<!-- /note -->

### <a id="s-engagementOf"></a>`engagementOf(n, t, stationList, system)`

function · **exported** · L99–104

- calls: [`engagementAt`](#s-engagementAt)
- called by: [`battlePose`](#s-battlePose) · [`readRun`](npccrew.js.md#s-readRun) _js/npc/npccrew.js_

<!-- note:engagementOf -->
The engagement (if any) `n` is part of at time t.
<!-- /note -->

### <a id="s-_route"></a>`_route`

const · L106–106 · **never referenced**

<!-- note:_route -->
---- poses ---------------------------------------------------------------
<!-- /note -->

### <a id="s-battlePoseRaw"></a>`battlePoseRaw(n, e, t)`

function · L108–144

- calls: [`hash`](#s-hash)
- called by: [`battlePose`](#s-battlePose) ×2

<!-- note:battlePoseRaw -->
- L113 · `const fx = -Math.sin(e.heading), fz = -Math.cos(e.heading);` — run along the old heading, jinking
- L123 · `const vx = -Math.sin(e.heading) * 7.5 * k, vz = -Math.cos(e.heading) * 7.5 * k;` — circle the victim, each pirate on its own ring
- L133 · `if (t < e.secArrive) return null;` — still on its route until the call comes
- L136 · `const close = Math.max(0, 1 - k2 / 18);` — 18 s to close from 1800 u out
<!-- /note -->

### <a id="s-battlePose"></a>`battlePose(n, t, stationList, system)`

function · L146–158

- calls: [`battlePoseRaw`](#s-battlePoseRaw) ×2 · [`engagementOf`](#s-engagementOf) · [`routePose`](traffic.js.md#s-routePose) _js/npc/traffic.js_

<!-- note:battlePose -->
trafficHooks.battlePose: the pose an engagement gives `n`, or null for the timetable.

- L150 · `const u = Math.min(1, (t - e.end) / DISENGAGE_S);` — disengage: slide from the last battle pose back onto the route
<!-- /note -->

### <a id="s-hash"></a>`hash(s)`

function · L161–165

- called by: [`battlePoseRaw`](#s-battlePoseRaw) · [`stepBattles`](#s-stepBattles) ×3

<!-- note:hash -->
<!-- /note -->

### <a id="s-_fc"></a>`_fc`

const · L167–167

<!-- note:_fc -->
Where the fight is right now: the victim while it is on the board, else
the lead pirate, else the site it started at.
<!-- /note -->

### <a id="s-fightCentre"></a>`fightCentre(e, out=)`

function · **exported** · L168–175

- calls: [`vesselById`](traffic.js.md#s-vesselById) _js/npc/traffic.js_ ×2
- called by: [`stepBattles`](../comms/comms.js.md#s-stepBattles) _js/comms/comms.js_ · [`stepBattles.effect`](../comms/comms.js.md#s-stepBattles-effect) _js/comms/comms.js_ · [`stepBattles`](#s-stepBattles) · [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ · [`publishHud`](../sim/sim.js.md#s-publishHud) _js/sim/sim.js_

<!-- note:fightCentre -->
<!-- /note -->

### <a id="s-stepBattles"></a>`stepBattles(t, dt, shipPos, fireNpc, stationList=, system=)`

function · **exported** · L177–229

- calls: [`corpOfVessel`](../corp/corps.js.md#s-corpOfVessel) _js/corp/corps.js_ · [`engagementAt`](#s-engagementAt) · [`fightCentre`](#s-fightCentre) · [`hash`](#s-hash) ×3 · [`markVesselDown`](traffic.js.md#s-markVesselDown) _js/npc/traffic.js_ · [`vesselById`](traffic.js.md#s-vesselById) _js/npc/traffic.js_ ×4 · [`burst`](../world/debris.js.md#s-burst) _js/world/debris.js_ · [`spawnHulk`](../world/hulks.js.md#s-spawnHulk) _js/world/hulks.js_
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepBattles -->
---- the tick ------------------------------------------------------------

Advance engagements: fire the decided outcome when its time comes, spawn
tracers between the fighters, notice the player joining. `shipPos` is the
player's position; `fireNpc(from, to)` pushes a cosmetic tracer.

- L189 · `if (fireNpc) {` — tracers: every fighter shoots its foe on its own cadence
- L190 · `const victim = vesselById(e.victimId);` — Four fresh arrays and nine linear scans of `traffic`, every tick, for
  the whole length of an engagement. The ids do not change while the
  engagement runs — only who is still visible does — so resolve through
  the roster's own id index and fill three arrays that are reused.
- L217 · `if (!e.applied && t >= e.downAt) {` — the seed's verdict, unless the player already settled it
- L222 · `if (w) burst({ x: w.x, y: w.y, z: w.z, vx: (w.vx ?? 0) * 0.3, vy: (w.vy ?? 0) * 0.3, vz: (` — a wreck: hull plate the salvage tractor can take
<!-- /note -->

### <a id="s-pirateKilled"></a>`pirateKilled(id, t)`

function · **exported** · L231–242

- calls: [`engagementAt`](#s-engagementAt)
- called by: [`ROLE_STEP.combat`](../drones/ops.js.md#s-ROLE_STEP-combat) _js/drones/ops.js_ · [`onKill`](../sim/sim.js.md#s-onKill) _js/sim/sim.js_ ×3

<!-- note:pirateKilled -->
A pirate died to the player during a live engagement: the victim is saved.
<!-- /note -->

### <a id="s-isHostileRole"></a>`isHostileRole(role)`

function · **exported** · L244–244

- via [js/npc/traffic.js](traffic.js.md): `HOSTILE_ROLES.has`

<!-- note:isHostileRole -->
<!-- /note -->

### <a id="s-isLawRole"></a>`isLawRole(role)`

function · **exported** · L245–245

- via [js/npc/traffic.js](traffic.js.md): `LAW_ROLES.has`

<!-- note:isLawRole -->
<!-- /note -->
