# js/npc/traffic.js

[index](../../../README.md) · 973 lines · 67 symbols · 13 imports · 46 importers

## About

<!-- note:@file -->
LIVING GALAXY experimental — other pilots in the sky.

The CRADLE does not only staff hiring halls. Every sky also carries a
roster of working hulls: traders running the ports, miners cutting the
belts, haulers on long legs, pickets on a slow watch. They are real
people (generateNPC) filed in the ledger as captains, flying real registry
hulls, on clocks derived from the sky seed and the shared world time.

The ROSTER is still a pure function of the seed — the same sky always
grows the same captains in the same hulls flying for the same flags, so a
room agrees about who exists without anyone being in charge.

WHERE THEY ARE is no longer. It used to be: `poseAt(n, t)` was closed-form
in (seed, skyTime), a hull burned 500 units out of the hangar, went
`visible:false` for the length of a warp lane, and reappeared 700 units
off the far port. Nothing was ever in between, which is why a supply run
popped up outside a station and vanished before you could turn toward it,
and why there was no such thing as intercepting one.

Now a leg is flown. The timetable still says WHICH port is next and what
it is carrying; npc/flight.js flies the hull there under real thrust, and
it is on the board and shootable for the whole crossing. A hull carries
velocity, hull integrity and shields, it notices being shot at, and it can
be pulled off its route entirely — to run, to fight, or to answer somebody
else's distress call (npc/security.js).

The cost is the old determinism, and it is paid deliberately: you cannot
intercept a position that is a closed-form function of the clock, because
nothing you do can change where it will be. So the sky is now
host-authoritative — the host integrates, mirrors take its word
(worldsync.js). `poseAt`/`routePose` survive as the PLACEMENT function:
they still say where a hull belongs on its timetable, which is what seeds
a fresh sky and what a mirror falls back to between host packets.

Shot down? `trafficDown` keeps the id for ten minutes of sky time; that
map rides in the host's snapshot so the whole room sees the same gap.

- L15 · `export const SLOT_S = 180;` — shared-event cadence, seconds of world time
- L16 · `export const traffic = [];` — live NPC hulls
- L17 · `export const trafficDown = {};` — id → sky time it is back on its route
- L21 · `export const DEPART_S = 36;` — burn out along the exit lane before the warp
- L22 · `export const ARRIVE_S = 48;` — brake in along the entry lane to the clamps
- L23 · `export const DEPART_U = LANE_U;` — the exit lane's far gate is where the warp opens
- L24 · `export const ARRIVE_U = LANE_U * 1.4;` — hulls drop out of the lane a little beyond the entry gate
- L405 · `const DOCK_R = 70;` — close enough to the mouth to be on the clamps
- L406 · `const LANE_OUT = LANE_U * 1.15;` — the launch ends a little past the far gate
- L407 · `const CAPTURE_MULT = 6;` — entry-lane capture distance, in ARRIVE_U
- L408 · `const LAUNCH_TOP = 190;` — hulls leave the mouth slowly; it is a doorway
- L411 · `const NEAR_R = 42000;` — inside this, always stepped in full
- L543 · `const SUB_MAX = 120;` — beyond a minute of catch-up, the timetable is the honest answer
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../corp/corps.js` | `corpById` | [js/corp/corps.js](../corp/corps.js.md) |
| 2 | `./cradle.js` | `generateNPC`, `cradle` | [js/npc/cradle.js](cradle.js.md) |
| 3 | `../corp/gdb.js` | `file` as `gdbFile` | [js/corp/gdb.js](../corp/gdb.js.md) |
| 4 | `../world/generate.js` | `rngFromSeed` | [js/world/generate.js](../world/generate.js.md) |
| 5 | `../world/bodies.js` | `currentSystem`, `hashHue` | [js/world/bodies.js](../world/bodies.js.md) |
| 6 | `../station/stations.js` | `stations` as `liveStations` | [js/station/stations.js](../station/stations.js.md) |
| 7 | `../ships/shipdb.js` | `shipById` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 8 | `./lanes.js` | `stationLane`, `subLaneFor`, `laneAt`, `LANE_U` | [js/npc/lanes.js](lanes.js.md) |
| 9 | `../economy/economy.js` | `legCargo`, `pickCargoAt`, `deliver`, `lift`, `targetFor`, `stockOf` | [js/economy/economy.js](../economy/economy.js.md) |
| 10 | `./flight.js` | `armFlight`, `flyStep`, `coastStep`, `legCruise`, `legTime`, `faceVelocity` **unused**, `placeAt`, `hullPerf`, `usesLane`, `laneProfile`, `RUN_OUT_U`, `RUN_IN_U` | [js/npc/flight.js](flight.js.md) |
| 11 | `../core/perf.js` | `perf`, `farBudget` | [js/core/perf.js](../core/perf.js.md) |
| 12 | `./bay.js` | `hasBay`, `bayPose`, `bayOffset`, `BAY_IN_S`, `BAY_OUT_S` | [js/npc/bay.js](bay.js.md) |
| 13 | `../economy/insurance.js` | `coverForVessel`, `downScaleFor` | [js/economy/insurance.js](../economy/insurance.js.md) |

## Imported by

- [js/aria/play.js](../aria/play.js.md) — `traffic`
- [js/aria/senses.js](../aria/senses.js.md) — `traffic`, `HOSTILE_ROLES`
- [js/comms/comms.js](../comms/comms.js.md) — `traffic`, `trafficHooks`, `vesselById`, `vesselStatus`, `captainLine`
- [js/console/panels/crew-gdb.js](../console/panels/crew-gdb.js.md) — `traffic`
- [js/console/panels/crew-sky.js](../console/panels/crew-sky.js.md) — `traffic`
- [js/corp/fleet.js](../corp/fleet.js.md) — `traffic`, `trafficHooks`, `spawnVessel`, `removeVessel`
- [js/corp/seclevel.js](../corp/seclevel.js.md) — `traffic`, `HOSTILE_ROLES`, `LAW_ROLES`, `vesselById`
- [js/drones/ops.js](../drones/ops.js.md) — `traffic`, `HOSTILE_ROLES`, `markVesselDown`
- [js/economy/contracts.js](../economy/contracts.js.md) — `traffic`, `HOSTILE_ROLES`
- [js/flight/contacts.js](../flight/contacts.js.md) — `traffic`
- [js/flight/probes.js](../flight/probes.js.md) — `traffic`
- [js/flight/turrets.js](../flight/turrets.js.md) — `traffic`, `HOSTILE_ROLES`, `LAW_ROLES`
- [js/mission/salvage.js](../mission/salvage.js.md) — `traffic`, `HOSTILE_ROLES`
- [js/net/worldsync.js](../net/worldsync.js.md) — `markVesselDown`, `trafficDown`, `traffic`, `vesselById`
- [js/npc/battles.js](battles.js.md) — `traffic`, `trafficDown`, `trafficHooks`, `routePose`, `markVesselDown`, `vesselById`, `eventAt`, `HOSTILE_ROLES`, `LAW_ROLES`
- [js/npc/combat.js](combat.js.md) — `traffic`, `vesselById`, `trafficHooks`, `markVesselDown`, `HOSTILE_ROLES`, `LAW_ROLES`
- [js/npc/flow.js](flow.js.md) — `DEPART_S`, `ARRIVE_S`, `ARRIVE_U`
- [js/npc/ground.js](ground.js.md) — `traffic`, `vesselById`, `trafficHooks`, `HOSTILE_ROLES`
- [js/npc/npccrew.js](npccrew.js.md) — `traffic`, `trafficDown`, `markVesselDown`
- [js/npc/reports.js](reports.js.md) — `traffic`, `vesselById`, `HOSTILE_ROLES`, `LAW_ROLES`
- [js/npc/rogues.js](rogues.js.md) — `traffic`, `removeVessel`, `reindexTraffic`, `markVesselDown`, `HOSTILE_ROLES`
- [js/npc/security.js](security.js.md) — `traffic`, `vesselById`, `trafficHooks`, `LAW_ROLES`, `HOSTILE_ROLES`, `markVesselDown`
- [js/npc/speech.js](speech.js.md) — `traffic`, `HOSTILE_ROLES`
- [js/render/engine.js](../render/engine.js.md) — `traffic`, `HOSTILE_ROLES`, `LAW_ROLES`
- [js/sim/sim.js](../sim/sim.js.md) — `eventAt`, `eventLine`, `markVesselDown`, `populateTraffic`, `resetTraffic`, `stepTraffic`, `traffic`, `trafficCensus`, `trafficDown`, `trafficHooks`, `vesselById`, `HOSTILE_ROLES`, `LAW_ROLES`, `SLOT_S`
- [js/station/stationworks.js](../station/stationworks.js.md) — `traffic`, `HOSTILE_ROLES`
- [js/ui/chatbox.js](../ui/chatbox.js.md) — `traffic`
- [js/ui/map.js](../ui/map.js.md) — `vesselStatus`, `captainLine`, `HOSTILE_ROLES`, `LAW_ROLES`
- test/bay.test.mjs _(outside js/)_ — `traffic`, `stepTraffic`
- test/board.test.mjs _(outside js/)_ — `traffic`, `stepTraffic`
- test/chartquiet.test.mjs _(outside js/)_ — `traffic`
- test/economy.test.mjs _(outside js/)_ — `traffic`, `populateTraffic`, `stepTraffic`, `trafficCensus`
- test/gdb.test.mjs _(outside js/)_ — `traffic`
- test/ground.test.mjs _(outside js/)_ — `traffic`, `stepTraffic`, `HOSTILE_ROLES`, `trafficHooks`
- test/hostilegun.test.mjs _(outside js/)_ — `HOSTILE_ROLES`
- test/hulks.test.mjs _(outside js/)_ — `traffic`, `vesselById`
- test/marks.test.mjs _(outside js/)_ — `traffic`
- test/npcchat.test.mjs _(outside js/)_ — `traffic`
- test/people.test.mjs _(outside js/)_ — `traffic`, `vesselStatus`
- test/qrf.test.mjs _(outside js/)_ — `traffic`, `LAW_ROLES`, `HOSTILE_ROLES`
- test/reactive.test.mjs _(outside js/)_ — `traffic`, `stepTraffic`, `trafficCensus`, `vesselById`, `markVesselDown`, `trafficDown`, `LANE_OVERHEAD`, `MIN_TRAVEL_S`, `HOSTILE_ROLES`, `LAW_ROLES`, `ROLES`, `seatHull`
- test/rogues.test.mjs _(outside js/)_ — `traffic`, `stepTraffic`
- test/seclevel.test.mjs _(outside js/)_ — `traffic`, `LAW_ROLES`, `HOSTILE_ROLES`
- test/sky.test.mjs _(outside js/)_ — `traffic`, `poseAt`, `routePose`, `stepTraffic`, `trafficCensus`, `ROLES`, `HOSTILE_ROLES`, `LAW_ROLES`, `DEPART_S`, `ARRIVE_S`
- test/skycrew.test.mjs _(outside js/)_ — `traffic`, `stepTraffic`, `markVesselDown`, `vesselStatus`
- test/speech.test.mjs _(outside js/)_ — `traffic`, `stepTraffic`

## Exports

- [`SLOT_S`](#s-SLOT_S) · const — used by [js/sim/sim.js](../sim/sim.js.md)
- [`traffic`](#s-traffic) · const — used by [js/aria/play.js](../aria/play.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/comms/comms.js](../comms/comms.js.md), [js/console/panels/crew-gdb.js](../console/panels/crew-gdb.js.md), [js/console/panels/crew-sky.js](../console/panels/crew-sky.js.md), [js/corp/fleet.js](../corp/fleet.js.md), [js/corp/seclevel.js](../corp/seclevel.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/flight/contacts.js](../flight/contacts.js.md), [js/flight/probes.js](../flight/probes.js.md), [js/flight/turrets.js](../flight/turrets.js.md), [js/mission/salvage.js](../mission/salvage.js.md), [js/net/worldsync.js](../net/worldsync.js.md), [js/npc/battles.js](battles.js.md), [js/npc/combat.js](combat.js.md), [js/npc/ground.js](ground.js.md), [js/npc/npccrew.js](npccrew.js.md), [js/npc/reports.js](reports.js.md), [js/npc/rogues.js](rogues.js.md), [js/npc/security.js](security.js.md), [js/npc/speech.js](speech.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationworks.js](../station/stationworks.js.md), [js/ui/chatbox.js](../ui/chatbox.js.md), test/bay.test.mjs, test/board.test.mjs, test/chartquiet.test.mjs, test/economy.test.mjs, test/gdb.test.mjs, test/ground.test.mjs, test/hulks.test.mjs, test/marks.test.mjs, test/npcchat.test.mjs, test/people.test.mjs, test/qrf.test.mjs, test/reactive.test.mjs, test/rogues.test.mjs, test/seclevel.test.mjs, test/sky.test.mjs, test/skycrew.test.mjs, test/speech.test.mjs
- [`trafficDown`](#s-trafficDown) · const — used by [js/net/worldsync.js](../net/worldsync.js.md), [js/npc/battles.js](battles.js.md), [js/npc/npccrew.js](npccrew.js.md), [js/sim/sim.js](../sim/sim.js.md), test/reactive.test.mjs
- [`trafficHooks`](#s-trafficHooks) · const — used by [js/comms/comms.js](../comms/comms.js.md), [js/corp/fleet.js](../corp/fleet.js.md), [js/npc/battles.js](battles.js.md), [js/npc/combat.js](combat.js.md), [js/npc/ground.js](ground.js.md), [js/npc/security.js](security.js.md), [js/sim/sim.js](../sim/sim.js.md), test/ground.test.mjs
- [`DEPART_S`](#s-DEPART_S) · const — used by [js/npc/flow.js](flow.js.md), test/sky.test.mjs
- [`ARRIVE_S`](#s-ARRIVE_S) · const — used by [js/npc/flow.js](flow.js.md), test/sky.test.mjs
- [`DEPART_U`](#s-DEPART_U) · const — **no importer in scanned roots**
- [`ARRIVE_U`](#s-ARRIVE_U) · const — used by [js/npc/flow.js](flow.js.md)
- [`LANE_OVERHEAD`](#s-LANE_OVERHEAD) · const — used by test/reactive.test.mjs
- [`MIN_TRAVEL_S`](#s-MIN_TRAVEL_S) · const — used by test/reactive.test.mjs
- [`ROLES`](#s-ROLES) · const — used by test/reactive.test.mjs, test/sky.test.mjs
- [`HOSTILE_ROLES`](#s-HOSTILE_ROLES) · const — used by [js/aria/senses.js](../aria/senses.js.md), [js/corp/seclevel.js](../corp/seclevel.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/flight/turrets.js](../flight/turrets.js.md), [js/mission/salvage.js](../mission/salvage.js.md), [js/npc/battles.js](battles.js.md), [js/npc/combat.js](combat.js.md), [js/npc/ground.js](ground.js.md), [js/npc/reports.js](reports.js.md), [js/npc/rogues.js](rogues.js.md), [js/npc/security.js](security.js.md), [js/npc/speech.js](speech.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationworks.js](../station/stationworks.js.md), [js/ui/map.js](../ui/map.js.md), test/ground.test.mjs, test/hostilegun.test.mjs, test/qrf.test.mjs, test/reactive.test.mjs, test/seclevel.test.mjs, test/sky.test.mjs
- [`LAW_ROLES`](#s-LAW_ROLES) · const — used by [js/corp/seclevel.js](../corp/seclevel.js.md), [js/flight/turrets.js](../flight/turrets.js.md), [js/npc/battles.js](battles.js.md), [js/npc/combat.js](combat.js.md), [js/npc/reports.js](reports.js.md), [js/npc/security.js](security.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/map.js](../ui/map.js.md), test/qrf.test.mjs, test/reactive.test.mjs, test/seclevel.test.mjs, test/sky.test.mjs
- [`buildRoster`](#s-buildRoster) · function — **no importer in scanned roots**
- [`spawnVessel`](#s-spawnVessel) · function — used by [js/corp/fleet.js](../corp/fleet.js.md)
- [`removeVessel`](#s-removeVessel) · function — used by [js/corp/fleet.js](../corp/fleet.js.md), [js/npc/rogues.js](rogues.js.md)
- [`resetTraffic`](#s-resetTraffic) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`populateTraffic`](#s-populateTraffic) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/economy.test.mjs
- [`poseAt`](#s-poseAt) · function — used by test/sky.test.mjs
- [`routePose`](#s-routePose) · function — used by [js/npc/battles.js](battles.js.md), test/sky.test.mjs
- [`legAt`](#s-legAt) · function — **no importer in scanned roots**
- [`seatHull`](#s-seatHull) · function — used by test/reactive.test.mjs
- [`stepTraffic`](#s-stepTraffic) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/bay.test.mjs, test/board.test.mjs, test/economy.test.mjs, test/ground.test.mjs, test/reactive.test.mjs, test/rogues.test.mjs, test/sky.test.mjs, test/skycrew.test.mjs, test/speech.test.mjs
- [`markVesselDown`](#s-markVesselDown) · function — used by [js/drones/ops.js](../drones/ops.js.md), [js/net/worldsync.js](../net/worldsync.js.md), [js/npc/battles.js](battles.js.md), [js/npc/combat.js](combat.js.md), [js/npc/npccrew.js](npccrew.js.md), [js/npc/rogues.js](rogues.js.md), [js/npc/security.js](security.js.md), [js/sim/sim.js](../sim/sim.js.md), test/reactive.test.mjs, test/skycrew.test.mjs
- [`reindexTraffic`](#s-reindexTraffic) · function — used by [js/npc/rogues.js](rogues.js.md)
- [`vesselById`](#s-vesselById) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/corp/seclevel.js](../corp/seclevel.js.md), [js/net/worldsync.js](../net/worldsync.js.md), [js/npc/battles.js](battles.js.md), [js/npc/combat.js](combat.js.md), [js/npc/ground.js](ground.js.md), [js/npc/reports.js](reports.js.md), [js/npc/security.js](security.js.md), [js/sim/sim.js](../sim/sim.js.md), test/hulks.test.mjs, test/reactive.test.mjs
- [`captainLine`](#s-captainLine) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/ui/map.js](../ui/map.js.md)
- [`vesselStatus`](#s-vesselStatus) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/ui/map.js](../ui/map.js.md), test/people.test.mjs, test/skycrew.test.mjs
- [`visibleVessels`](#s-visibleVessels) · function — **no importer in scanned roots**
- [`EVENT_KINDS`](#s-EVENT_KINDS) · const — **no importer in scanned roots**
- [`eventAt`](#s-eventAt) · function — used by [js/npc/battles.js](battles.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`eventLine`](#s-eventLine) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`trafficCensus`](#s-trafficCensus) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/economy.test.mjs, test/reactive.test.mjs, test/sky.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-SLOT_S"></a>`SLOT_S`

const · **exported** · L15–15

<!-- note:SLOT_S -->
<!-- /note -->

### <a id="s-traffic"></a>`traffic`

const · **exported** · L16–16

<!-- note:traffic -->
<!-- /note -->

### <a id="s-trafficDown"></a>`trafficDown`

const · **exported** · L17–17

<!-- note:trafficDown -->
<!-- /note -->

### <a id="s-trafficHooks"></a>`trafficHooks`

const · **exported** · L18–18

<!-- note:trafficHooks -->
comms chatter, cargo logging, and the two override points that let other
modules take a hull off its timetable without this one importing them:
  director(n, t, dt, ctx)  flew the hull itself this tick — return true and
                           the timetable leaves it alone. npc/security.js
                           and npc/combat.js chain onto this.
  battlePose(n, t, ...)    the legacy pose override, kept for anything that
                           still wants to place a hull outright.
<!-- /note -->

### <a id="s-DOWN_FOR"></a>`DOWN_FOR`

const · L20–20

<!-- note:DOWN_FOR -->
<!-- /note -->

### <a id="s-DEPART_S"></a>`DEPART_S`

const · **exported** · L21–21

<!-- note:DEPART_S -->
<!-- /note -->

### <a id="s-ARRIVE_S"></a>`ARRIVE_S`

const · **exported** · L22–22

<!-- note:ARRIVE_S -->
<!-- /note -->

### <a id="s-DEPART_U"></a>`DEPART_U`

const · **exported** · L23–23

<!-- note:DEPART_U -->
<!-- /note -->

### <a id="s-ARRIVE_U"></a>`ARRIVE_U`

const · **exported** · L24–24

<!-- note:ARRIVE_U -->
<!-- /note -->

### <a id="s-LANE_OVERHEAD"></a>`LANE_OVERHEAD`

const · **exported** · L25–25

<!-- note:LANE_OVERHEAD -->
the two ends of a crossing that are not cruise: out through the mouth and
down the exit lane under low power, and the braked run down the entry lane
at the far end. Costed into the timetable so `period` stays honest.
<!-- /note -->

### <a id="s-MIN_TRAVEL_S"></a>`MIN_TRAVEL_S`

const · **exported** · L26–26

<!-- note:MIN_TRAVEL_S -->
and a travel leg is never shorter than one: clearing a ring, crossing, and
coming back down onto clamps is not something a hull does in a few seconds,
however close the two ports happen to be right now
<!-- /note -->

### <a id="s-ROLES"></a>`ROLES`

const · **exported** · L28–36

<!-- note:ROLES -->
Who works the sky. Pirates fly out of the free ports (or lurk on the belt
if the sky has none); security runs sweeps between the ports and answers
engagements — see npc/battles.js.

- L31 · `supply:   { complex: "logistics", ships: ["logistics_c", "logistics_d", "construction_c"],` — Station supply: the runs the ports actually eat. A supply hull is slow,
  fat, lightly armed and always bound somewhere that needs what it has —
  which makes it the thing worth escorting and the thing worth taking.
<!-- /note -->

### <a id="s-HOSTILE_ROLES"></a>`HOSTILE_ROLES`

const · **exported** · L37–37

<!-- note:HOSTILE_ROLES -->
<!-- /note -->

### <a id="s-LAW_ROLES"></a>`LAW_ROLES`

const · **exported** · L38–38

<!-- note:LAW_ROLES -->
<!-- /note -->

### <a id="s-PIRATE_HUES"></a>`PIRATE_HUES`

const · L39–39

<!-- note:PIRATE_HUES -->
<!-- /note -->

### <a id="s-pick"></a>`pick(rng, arr)`

function · L41–43

- called by: [`buildLegs`](#s-buildLegs) · [`buildRoster`](#s-buildRoster) ×3

<!-- note:pick -->
<!-- /note -->

### <a id="s-callsign"></a>`callsign(rec, rng)`

function · L45–48

- called by: [`buildRoster`](#s-buildRoster)

<!-- note:callsign -->
<!-- /note -->

### <a id="s-_a"></a>`_a`

const · L50–50

<!-- note:_a -->
<!-- /note -->

### <a id="s-_b"></a>`_b`

const · L51–51

<!-- note:_b -->
<!-- /note -->

### <a id="s-nodePos"></a>`nodePos(node, n, stationList, out)`

function · L53–64

- called by: [`buildLegs`](#s-buildLegs) ×2 · [`buildPirateLegs`](#s-buildPirateLegs) ×2 · [`enterLeg`](#s-enterLeg) ×2 · [`routePose`](#s-routePose) ×5 · [`seatHull`](#s-seatHull) ×2 · [`stepHullOnce`](#s-stepHullOnce) ×2

<!-- note:nodePos -->
<!-- /note -->

### <a id="s-nodeName"></a>`nodeName(node, stationList)`

function · L66–69

- called by: [`routePose`](#s-routePose) ×2 · [`stepHullOnce`](#s-stepHullOnce) ×4

<!-- note:nodeName -->
<!-- /note -->

### <a id="s-buildRoster"></a>`buildRoster(seed, stationList, system, count)`

function · **exported** · L71–173

- calls: [`file`](../corp/gdb.js.md#s-file) _js/corp/gdb.js_ · [`generateNPC`](cradle.js.md#s-generateNPC) _js/npc/cradle.js_ · [`subLaneFor`](lanes.js.md#s-subLaneFor) _js/npc/lanes.js_ · [`buildLegs`](#s-buildLegs) · [`buildPirateLegs`](#s-buildPirateLegs) · [`buildRoster>push`](#s-buildRoster-push) ×7 · [`callsign`](#s-callsign) · [`pick`](#s-pick) ×3 · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ · [`hashHue`](../world/bodies.js.md#s-hashHue) _js/world/bodies.js_ · [`rngFromSeed`](../world/generate.js.md#s-rngFromSeed) _js/world/generate.js_
- via [js/npc/cradle.js](cradle.js.md): `cradle.get`, `cradle.note`, `cradle.put`
- called by: [`populateTraffic`](#s-populateTraffic)

<!-- note:buildRoster -->
Deterministic roster for this sky. Always the same captains for a seed.

- L75 · `const rich = perf.tier >= 2;` — A busier sky than the 47–56 hulls this used to carry. The ceiling is not
  a guess about the device: perf.js measures the frame and the far field
  thins itself out, so the roster is written for the sky the game wants and
  the budget decides how much of it gets stepped in detail this frame.
- L104 · `rec.name = prior.name;` — 0.3.54: the same captain is the same person — the name on file stands,
  even when the forge would say something else today
- L127 · `captainGender: rec.gender,` — who is flying it, not just what it is called. The open channel names
  people now, and the SHIPS directory says whose hull it is — both need
  this off the vessel without a CRADLE lookup per frame.
- L150 · `corpId: from?.corpId ?? null,` — the flag: the home port's corporation (corps.js), a hold's for a pirate, a
  major's for the law. Filled below; corpOfVessel() falls back to the port.
- L153 · `n.supplyFor = to?.id ?? from?.id ?? null;` — a supply run is named for its destination, not its origin — the port
  waiting on it is the one whose stock moves when it does or does not
  arrive, and it is the name the open channel uses
- L161 · `const hold = holds.length ? holds[Math.floor(rng() * holds.length)] : null;` — a hold to lurk out of, and a stretch of belt to watch the lanes from
<!-- /note -->

#### <a id="s-buildRoster-push"></a>`buildRoster>push(role, k)`

function · L85–85

- called by: [`buildRoster`](#s-buildRoster) ×7

<!-- note:buildRoster>push -->
<!-- /note -->

#### <a id="s-buildRoster-cover"></a>`buildRoster.cover()`

prop · L129–129

- calls: [`coverForVessel`](../economy/insurance.js.md#s-coverForVessel) _js/economy/insurance.js_

<!-- note:buildRoster.cover -->
what this operator carries, if anything — a fact about them, seeded
off the id, so it is the same for every client in the room
<!-- /note -->

### <a id="s-spawnVessel"></a>`spawnVessel(spec, stationList=, system=)`

function · **exported** · L175–218

- calls: [`subLaneFor`](lanes.js.md#s-subLaneFor) _js/npc/lanes.js_ · [`buildLegs`](#s-buildLegs) · [`reindexTraffic`](#s-reindexTraffic) · [`seatHull`](#s-seatHull) · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ · [`rngFromSeed`](../world/generate.js.md#s-rngFromSeed) _js/world/generate.js_
- called by: [`spawnHull`](../corp/fleet.js.md#s-spawnHull) _js/corp/fleet.js_

<!-- note:spawnVessel -->
A hull added to the board after the roster was built — the company's own.
Same shape, same legs machinery: a miner cuts the belt and brings ore home,
a hauler runs stock between ports. Returns the live entry.

- L211 · `const t0 = spec.now ?? 0;` — start on the pad at home so the first thing it does is leave
<!-- /note -->

### <a id="s-removeVessel"></a>`removeVessel(id)`

function · **exported** · L219–223

- calls: [`reindexTraffic`](#s-reindexTraffic)
- called by: [`decommissionHull`](../corp/fleet.js.md#s-decommissionHull) _js/corp/fleet.js_ · [`resetFleet`](../corp/fleet.js.md#s-resetFleet) _js/corp/fleet.js_ · [`resetRogues`](rogues.js.md#s-resetRogues) _js/npc/rogues.js_ · [`stepRogues`](rogues.js.md#s-stepRogues) _js/npc/rogues.js_

<!-- note:removeVessel -->
<!-- /note -->

### <a id="s-buildLegs"></a>`buildLegs(n, rng, ports, belt, stationList)`

function · L225–269

- calls: [`legCargo`](../economy/economy.js.md#s-legCargo) _js/economy/economy.js_ · [`hullPerf`](flight.js.md#s-hullPerf) _js/npc/flight.js_ · [`legTime`](flight.js.md#s-legTime) _js/npc/flight.js_ · [`nodePos`](#s-nodePos) ×2 · [`pick`](#s-pick) · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_
- called by: [`buildRoster`](#s-buildRoster) · [`spawnVessel`](#s-spawnVessel)

<!-- note:buildLegs -->
The timetable: dock at home, then stops (ports, or belt claims for miners), then home.

- L246 · `const acc = hullPerf(n).accel;` — the hull's own thrust decides how long a crossing takes, so the timetable
  is costed against the hull that flies it. `n.period` therefore still means
  what it says: one full circuit of this captain's route.
- L251 · `leg.warp = Math.min(45, Math.max(3, d / 55000));` — kept: the chart and the comms desk read it
- L253 · `const pa = leg.from.kind === "port" ? stationList.find((x) => x.id === leg.from.id) : null` — a port-to-port leg carries something the far end eats (economy.js); a miner's belt run is empty going out
- L267 · `const cut = legs.find((l) => l.kind === "cut");` — miners open on the claim; everyone else somewhere on the loop
<!-- /note -->

### <a id="s-buildPirateLegs"></a>`buildPirateLegs(n, rng, stationList)`

function · L271–294

- calls: [`hullPerf`](flight.js.md#s-hullPerf) _js/npc/flight.js_ · [`legTime`](flight.js.md#s-legTime) _js/npc/flight.js_ · [`nodePos`](#s-nodePos) ×2
- called by: [`buildRoster`](#s-buildRoster)

<!-- note:buildPirateLegs -->
A pirate's day: berth in the hold, burn out its exit lane, warp to the
belt, lurk, warp home, brake in on the entry lane. Same legs machinery as
the honest traffic, so the hold sees streams too.
<!-- /note -->

### <a id="s-resetTraffic"></a>`resetTraffic()`

function · **exported** · L296–299

- calls: [`reindexTraffic`](#s-reindexTraffic)
- called by: [`populateTraffic`](#s-populateTraffic) · [`returnToMenu`](../sim/sim.js.md#s-returnToMenu) _js/sim/sim.js_

<!-- note:resetTraffic -->
<!-- /note -->

### <a id="s-populateTraffic"></a>`populateTraffic(seed, stationList=, system=)`

function · **exported** · L301–311

- calls: [`buildRoster`](#s-buildRoster) · [`reindexTraffic`](#s-reindexTraffic) · [`resetTraffic`](#s-resetTraffic) · [`seatHull`](#s-seatHull)
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:populateTraffic -->
- L306 · `seatHull(live, 0, stationList, system);` — give it thrust, hull, shields and guns, then put it where its timetable
  says it is — spread along the crossings, not all sitting on clamps
<!-- /note -->

### <a id="s-poseAt"></a>`poseAt(n, t, stationList=, system=)`

function · **exported** · L313–317

- calls: [`routePose`](#s-routePose)

<!-- note:poseAt -->
Where this hull is at world time `t`. Pure: same inputs, same pose.
Returns { x, y, z, yaw, pitch, speed, docked, job, visible, toName }.

- L314 · `const battle = trafficHooks.battlePose?.(n, t, stationList, system);` — an engagement (npc/battles.js) takes the hull off its timetable
<!-- /note -->

### <a id="s-routePose"></a>`routePose(n, t, stationList=, system=)`

function · **exported** · L319–403

- calls: [`usesLane`](flight.js.md#s-usesLane) _js/npc/flight.js_ · [`laneAt`](lanes.js.md#s-laneAt) _js/npc/lanes.js_ ×2 · [`stationLane`](lanes.js.md#s-stationLane) _js/npc/lanes.js_ ×2 · [`subLaneFor`](lanes.js.md#s-subLaneFor) _js/npc/lanes.js_ · [`nodeName`](#s-nodeName) ×2 · [`nodePos`](#s-nodePos) ×5
- called by: [`battlePose`](battles.js.md#s-battlePose) _js/npc/battles.js_ · [`engagementFor`](battles.js.md#s-engagementFor) _js/npc/battles.js_ ×2 · [`poseAt`](#s-poseAt) · [`seatHull`](#s-seatHull)

<!-- note:routePose -->
The timetable pose alone — what the hull would be doing if nobody were shooting.

- L358 · `const A = nodePos(leg.from, n, stationList, _a), B = nodePos(leg.to, n, stationList, _b);` — travel: down the exit lane, across, up the entry lane.
  
  These are the same three parts the hull actually flies (npc/flight.js) —
  the run out of the port, the crossing, the run in — costed as fractions
  of the leg rather than integrated. The two ends are bounded by
  LANE_OVERHEAD, which is exactly what the timetable charged for them, and
  squeezed proportionally on a leg too short to spend that long in a lane.
  A hull is never `visible:false` mid-crossing any more: the only thing
  that takes it off the board is being inside a station ring.
- L386 · `const u = (lt - dep) / Math.max(1, leg.dur - arr - dep);` — the crossing: somewhere between the two lane gates, on the board
- L389 · `return { x: A.x + dx * u, y: A.y + dy * u, z: A.z + dz * u, yaw, pitch, speed, docked: nul` — "in lane" used to mean GONE — visible:false, off the contact board, not
  shootable. It now means the drive is lit: fast, but on the board and
  tracked the whole way, which is the difference between a supply run you
  can plan an interception against and one that simply is not there.
- L397 · `const f = stationLane(stB);` — in along the port's entry lane, the funnel gathering it to the mouth
<!-- /note -->

### <a id="s-DOCK_R"></a>`DOCK_R`

const · L405–405

<!-- note:DOCK_R -->
---- the flown timetable -------------------------------------------------

The legs are still the plan: dock here, then that port, then the belt, then
home, carrying this. What changed is that the hull now FLIES the plan
instead of being placed along it. Each hull holds a state and its own
clock, and the states are exactly the phases of a real port call:

  dock      on the clamps inside the ring. Off the board, riding with the
            port (ports move), until its turnaround is up.
  launch    out through the mouth and down the exit lane under low power.
            On the board from the moment it clears the doors.
  cruise    the crossing. Thrust up to the leg's cruise speed, hold it,
            brake for the far end. This is the part that did not exist —
            minutes of open space where a hull can be met, hailed, escorted
            or taken.
  approach  captured by the destination's entry lane, braking to the mouth.
  cut       a miner on its claim, or a pirate on its lurk.
  watch     a picket's sweep.

Nothing here teleports and nothing goes `visible:false` except while it is
genuinely inside a station ring.
<!-- /note -->

### <a id="s-LANE_OUT"></a>`LANE_OUT`

const · L406–406

<!-- note:LANE_OUT -->
<!-- /note -->

### <a id="s-CAPTURE_MULT"></a>`CAPTURE_MULT`

const · L407–407

<!-- note:CAPTURE_MULT -->
<!-- /note -->

### <a id="s-LAUNCH_TOP"></a>`LAUNCH_TOP`

const · L408–408

<!-- note:LAUNCH_TOP -->
<!-- /note -->

### <a id="s-APPROACH_TOP"></a>`APPROACH_TOP`

const · L409–409

<!-- note:APPROACH_TOP -->
<!-- /note -->

### <a id="s-NEAR_R"></a>`NEAR_R`

const · L411–411

<!-- note:NEAR_R -->
Far-field detail. A hull the player cannot see does not need a full
steering solution sixty times a second, but it must still get where it is
going on time — so it is stepped with the dt it missed rather than skipped.
<!-- /note -->

### <a id="s-stationById"></a>`stationById(list, id)`

function · L413–417

- called by: [`deliverCargo`](#s-deliverCargo) · [`liftCargo`](#s-liftCargo) ×2 · [`stepHullOnce`](#s-stepHullOnce) ×5

<!-- note:stationById -->
<!-- /note -->

### <a id="s-legAt"></a>`legAt(n, t)`

function · **exported** · L419–427

- called by: [`seatHull`](#s-seatHull)

<!-- note:legAt -->
Which leg the timetable says the hull is on at `t`, and how far into it.
<!-- /note -->

### <a id="s-setJob"></a>`setJob(n, job, toName)`

function · L429–435

- called by: [`stepHullOnce`](#s-stepHullOnce) ×12

<!-- note:setJob -->
<!-- /note -->

### <a id="s-nextLeg"></a>`nextLeg(n, t, stationList)`

function · L437–440

- calls: [`enterLeg`](#s-enterLeg)
- called by: [`stepHullOnce`](#s-stepHullOnce) ×7

<!-- note:nextLeg -->
Advance to the next leg of the timetable and enter the state it calls for.
<!-- /note -->

### <a id="s-enterLeg"></a>`enterLeg(n, t, stationList)`

function · L442–465

- calls: [`laneProfile`](flight.js.md#s-laneProfile) _js/npc/flight.js_ · [`legCruise`](flight.js.md#s-legCruise) _js/npc/flight.js_ · [`legTime`](flight.js.md#s-legTime) _js/npc/flight.js_ · [`usesLane`](flight.js.md#s-usesLane) _js/npc/flight.js_ · [`nodePos`](#s-nodePos) ×2
- called by: [`nextLeg`](#s-nextLeg)

<!-- note:enterLeg -->
- L455 · `const A = nodePos(leg.from, n, stationList, _a), B = nodePos(leg.to, n, stationList, _b);` — a travel leg: cost the crossing once, here
- L463 · `n.stateUntil = t + legTime(L, n.fly.accel) * 3 + 120;` — a generous watchdog, not a schedule
<!-- /note -->

### <a id="s-seatHull"></a>`seatHull(n, t, stationList=, system=)`

function · **exported** · L467–507

- calls: [`armFlight`](flight.js.md#s-armFlight) _js/npc/flight.js_ · [`laneProfile`](flight.js.md#s-laneProfile) _js/npc/flight.js_ · [`legCruise`](flight.js.md#s-legCruise) _js/npc/flight.js_ · [`legTime`](flight.js.md#s-legTime) _js/npc/flight.js_ · [`placeAt`](flight.js.md#s-placeAt) _js/npc/flight.js_ ×2 · [`usesLane`](flight.js.md#s-usesLane) _js/npc/flight.js_ · [`legAt`](#s-legAt) · [`nodePos`](#s-nodePos) ×2 · [`routePose`](#s-routePose)
- called by: [`populateTraffic`](#s-populateTraffic) · [`spawnVessel`](#s-spawnVessel) · [`stepHull`](#s-stepHull) · [`stepTraffic`](#s-stepTraffic)

<!-- note:seatHull -->
Put a hull where its timetable says it belongs and give it the state to
match. Used to seed a fresh sky, to bring one back after being shot down,
and by a mirror that has lost the host.

- L495 · `n.state = "cruise";` — drop it somewhere sensible along the crossing rather than at the mouth,
  so a fresh sky does not have forty hulls all leaving port at once
<!-- /note -->

### <a id="s-liftCargo"></a>`liftCargo(n, stationList)`

function · L509–528

- calls: [`lift`](../economy/economy.js.md#s-lift) _js/economy/economy.js_ · [`pickCargoAt`](../economy/economy.js.md#s-pickCargoAt) _js/economy/economy.js_ · [`stockOf`](../economy/economy.js.md#s-stockOf) _js/economy/economy.js_ · [`targetFor`](../economy/economy.js.md#s-targetFor) _js/economy/economy.js_ · [`stationById`](#s-stationById) ×2
- called by: [`stepHullOnce`](#s-stepHullOnce)

<!-- note:liftCargo -->
the cargo moves, unchanged in meaning: lifted from the port it leaves,
delivered to the port it reaches. Only the trigger moved, from a pose
transition to an undock and a touchdown.

- L519 · `let qty = leg.cargo.qty;` — A commercial run loads against the far port's SHORTFALL, not against
  its own hold. Nobody freights a barge of stainless to a port whose
  shelves are already full of it — and if they did, the sky's own traffic
  would keep every port permanently topped up, every shortage would close
  before anyone could act on it, and the work board the player (and the
  corporations) haul against would have nothing on it. Load what is
  wanted; the rest of the hold stays empty and the hull is smaller for it.
<!-- /note -->

### <a id="s-deliverCargo"></a>`deliverCargo(n, stationList, portId)`

function · L530–540

- calls: [`deliver`](../economy/economy.js.md#s-deliver) _js/economy/economy.js_ · [`stationById`](#s-stationById)
- called by: [`stepHullOnce`](#s-stepHullOnce)

<!-- note:deliverCargo -->
<!-- /note -->

### <a id="s-SUB_S"></a>`SUB_S`

const · L542–542

<!-- note:SUB_S -->
---- the per-hull tick ---------------------------------------------------

The longest slice of time a hull is ever integrated in one go. In play a
tick is 1/60 s and the far-field stride hands over at most a few frames'
worth, so this never bites; it exists because a test, a tab that was
backgrounded, or a sky change can hand over a much larger dt, and flying a
ninety-second step as one Euler jump puts hulls through stations.
<!-- /note -->

### <a id="s-SUB_MAX"></a>`SUB_MAX`

const · L543–543

<!-- note:SUB_MAX -->
<!-- /note -->

### <a id="s-stepHull"></a>`stepHull(n, t, dt, ctx)`

function · L545–554

- calls: [`seatHull`](#s-seatHull) · [`stepHullOnce`](#s-stepHullOnce) ×2
- called by: [`stepTraffic`](#s-stepTraffic)

<!-- note:stepHull -->
<!-- /note -->

### <a id="s-_bay"></a>`_bay`

const · L556–556

<!-- note:_bay -->
<!-- /note -->

### <a id="s-poseBay"></a>`poseBay(n, st, which)`

function · L557–562

- calls: [`bayPose`](bay.js.md#s-bayPose) _js/npc/bay.js_ · [`placeAt`](flight.js.md#s-placeAt) _js/npc/flight.js_ · [`subLaneFor`](lanes.js.md#s-subLaneFor) _js/npc/lanes.js_
- called by: [`stepHullOnce`](#s-stepHullOnce) ×3

<!-- note:poseBay -->
<!-- /note -->

### <a id="s-stepHullOnce"></a>`stepHullOnce(n, t, dt, ctx)`

function · L564–794

- calls: [`bayOffset`](bay.js.md#s-bayOffset) _js/npc/bay.js_ · [`hasBay`](bay.js.md#s-hasBay) _js/npc/bay.js_ ×6 · [`coastStep`](flight.js.md#s-coastStep) _js/npc/flight.js_ · [`flyStep`](flight.js.md#s-flyStep) _js/npc/flight.js_ ×9 · [`placeAt`](flight.js.md#s-placeAt) _js/npc/flight.js_ · [`laneAt`](lanes.js.md#s-laneAt) _js/npc/lanes.js_ ×4 · [`stationLane`](lanes.js.md#s-stationLane) _js/npc/lanes.js_ · [`subLaneFor`](lanes.js.md#s-subLaneFor) _js/npc/lanes.js_ ×4 · [`deliverCargo`](#s-deliverCargo) · [`liftCargo`](#s-liftCargo) · [`nextLeg`](#s-nextLeg) ×7 · [`nodeName`](#s-nodeName) ×4 · [`nodePos`](#s-nodePos) ×2 · [`poseBay`](#s-poseBay) ×3 · [`setJob`](#s-setJob) ×12 · [`stationById`](#s-stationById) ×5
- called by: [`stepHull`](#s-stepHull) ×2

<!-- note:stepHullOnce -->
- L567 · `const inBay = n.state === "berth" || n.state === "unberth";` — anything with a claim on this hull flies it: a security response, a
  pirate run-in, a hull that is running for its life (npc/combat.js,
  npc/security.js). The timetable waits. 0.3.60: but a hull in its bay run
  finishes it first (a few seconds) — a claim or a battle pose that landed
  mid-hangar used to lift it off the clamps and put it at the fight in one
  tick (bay.test caught a law corvette leaving its bay for a battle 30 Mu out).
- L573 · `const posed = inBay || n.state === "launch" ? null : trafficHooks.battlePose?.(n, t, SL, s` — the legacy outright-pose override, for anything still using it
- L573 · `const posed = inBay || n.state === "launch" ? null : trafficHooks.battlePose?.(n, t, SL, s` — …and a battle pose (an outright teleport to the engagement) also waits
  until the hull is off its exit lane: near a port is where you watch them
- L588 · `placeAt(n, st.x, st.y, st.z, st.vx ?? 0, st.vy ?? 0, st.vz ?? 0);` — riding the clamps: the port moves and the hull moves with it
- L596 · `n.docked = null;` — clamps off. The cargo comes off the port's shelves now, on the same
  tick the hull reads as outbound — a watcher sampling one tick must
  see the manifest and the job agree.
- L602 · `if (n.state === "launch" && st && hasBay(st)) {` — 0.3.15: off the clamps and out through the bay, not out of the station's middle
- L616 · `const st = stationById(SL, n.bayAt);` — 0.3.15 — the hangar, flown: the departures clamps to the exit door, or
  the entry door to the arrivals clamps (npc/bay.js). Kinematic, riding
  the port, the same path every client computes.
- L645 · `n.state = "cruise";` — clear of the mouth and the funnel: open the throttle and cross
- L661 · `const gate = st ? laneAt(st, "entry", LANE_U, n.way ?? subLaneFor(n.id), _a) : null;` — the lane gate at the far end, if the destination is a port: the hull
  aims at the lane rather than the hull plating the whole way in
- L673 · `const F = n.legFrom ?? { x: n.x, y: n.y, z: n.z };` — how far out of the origin, and how far still to run
- L677 · `n.drive = 1;` — drive lit. The goal is the DROP POINT — RUN_IN_U short of the far
  end — so the arrive-brake sheds the drive on its own, and the hull
  comes out of the lane already slow. It stays visible throughout:
  a lane transit you can see is a transit you can get ahead of.
- L689 · `if (st) {` — sublight: the run out of the port, the run in to the far one, and
  every short leg from end to end
- L695 · `if (t > n.stateUntil) nextLeg(n, t, SL);` — watchdog: a leg that somehow cannot be finished does not strand a hull
- L710 · `const along = (n.x - mouth.x) * f.dir.x + (n.y - mouth.y) * f.dir.y + (n.z - mouth.z) * f.` — How far down the lane the hull is — a PROJECTION onto the lane axis,
  not the range to the mouth. The funnel offsets the lane sideways, so
  the two are not the same number, and using the range as if it were
  one gives a goal that sits further out than the hull does: the hull
  flies to it, recomputes the same goal, and parks in the funnel for
  good. Project, and the goal always lies inboard.
- L713 · `const pre = { x: n.x, y: n.y, z: n.z };` — 0.3.15: the last few hundred units come down to a creep, so the hull
  reaches the entry door at the pace it flies the bay rather than
  stopping dead on the aperture
- L713 · `const pre = { x: n.x, y: n.y, z: n.z };` — where the hull is in the port's frame at this tick (flyStep integrates it to the next)
- L717 · `const rvx = n.vx - (st.vx ?? 0), rvy = n.vy - (st.vy ?? 0), rvz = n.vz - (st.vz ?? 0);` — the harbour brake: a heavy hull that came off the cruise hot is
  walked down to the creep by the port's own beam, so nothing enters
  the bay at cruise speed
- L727 · `const relSp = hasBay(st) ? Math.hypot(n.vx - (st.vx ?? 0), n.vy - (st.vy ?? 0), n.vz - (st` — the gate has to be at least as wide as one step of travel, or a
  coarse tick flies straight through it and the hull orbits forever
- L727 · `const relSp = hasBay(st) ? Math.hypot(n.vx - (st.vx ?? 0), n.vy - (st.vy ?? 0), n.vz - (st` — (the step is measured in the port's frame: a tethered port's own orbit is hundreds of u/s and is not travel)
- L732 · `n.state = "berth";` — 0.3.15: through the entry door and down onto the clamps — the hull stays on the board until it is on them
- L755 · `if (n.role === "miner") {` — 0.3.16: a miner hauls home what its claim actually holds — the ore
  with the most money in reach (npc/ground.js claimSurvey) — not a
  name drawn when the timetable was written. What it said on the band
  about its seam and what lands on the port's shelf are the same ore.
- L766 · `const L = n.lurk ?? { angle: 0, rad: n.orbitR, y: 0 };` — a pirate with no hold to fly out of: it lives on its stretch of belt
- L769 · `n.visible = true;` — No timetable and no orders: hold position. A hull in this state used
  to fall through to the picket ellipse and fly off on a sweep it was
  never assigned — which is wrong for a company hull between contracts,
  a hull whose route was cleared, and anything a caller is holding on
  purpose.
- L786 · `const r = n.orbitR * 1.35;` — watch: a picket's long ellipse through the inner system
<!-- /note -->

### <a id="s-_ctx"></a>`_ctx`

const · L796–796

<!-- note:_ctx -->
---- the tick ------------------------------------------------------------
<!-- /note -->

### <a id="s-stepTraffic"></a>`stepTraffic(t, dt, stationList=, system=, shipPos=)`

function · **exported** · L798–849

- calls: [`farBudget`](../core/perf.js.md#s-farBudget) _js/core/perf.js_ · [`armFlight`](flight.js.md#s-armFlight) _js/npc/flight.js_ · [`coastStep`](flight.js.md#s-coastStep) _js/npc/flight.js_ ×2 · [`seatHull`](#s-seatHull) · [`stepHull`](#s-stepHull)
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepTraffic -->
- L813 · `const down = trafficDown[n.id];` — shot down: off the board until its clock is up, then seated back onto
  the timetable wherever that now puts it
- L822 · `delete trafficDown[n.id];` — its ten minutes are up: a replacement hull under the same name takes
  the run over, which is why the roster count never sags
- L831 · `if (n.heldUntil) {` — 0.3.65: a mirror holding the host's word for this hull (worldsync.js
  adoptHulls) dead-reckons it instead of flying its own timetable, which
  would carry it straight back to where the host says it is not
- L836 · `let step = dt;` — Far field: stepped on a stride with the time it missed, coasting in
  between. `shipPos` null (tests, headless) means everything is near.
<!-- /note -->

### <a id="s-markVesselDown"></a>`markVesselDown(id, t)`

function · **exported** · L851–867

- calls: [`downScaleFor`](../economy/insurance.js.md#s-downScaleFor) _js/economy/insurance.js_ · [`vesselById`](#s-vesselById) ×2
- called by: [`ROLE_STEP.combat`](../drones/ops.js.md#s-ROLE_STEP-combat) _js/drones/ops.js_ · [`handleMessage`](../net/worldsync.js.md#s-handleMessage) _js/net/worldsync.js_ · [`stepBattles`](battles.js.md#s-stepBattles) _js/npc/battles.js_ · [`downHull`](combat.js.md#s-downHull) _js/npc/combat.js_ · [`applyMood`](npccrew.js.md#s-applyMood) _js/npc/npccrew.js_ ×2 · [`onKill`](../sim/sim.js.md#s-onKill) _js/sim/sim.js_ ×3

<!-- note:markVesselDown -->
A hull was destroyed: off the board for a while, then back on its route.
Returns the sky time it returns.

0.3.33 — how long "a while" is now depends on who was underwriting it. An
operator with platinum cover has the money to replace the hull and is back
in under half the time; one with nothing at all takes a third longer than
the base. That is the whole mechanical meaning of NPC insurance, and it is
the right one: you can read a lane's underwriting off how well it keeps its
traffic after a bad week. Seeded off the vessel id, so a shared sky agrees
without exchanging anything.

- L861 · `n.respondTo = null;` — whatever had a claim on it lets go
<!-- /note -->

### <a id="s-hullIx"></a>`hullIx`

const · L869–869

<!-- note:hullIx -->
`traffic` is an array because everything that draws it walks it in order.
It is also looked up BY ID constantly — the battle tick alone resolved nine
ids per frame with `traffic.find()`, which against 150 hulls is 1,350 string
comparisons a frame for the life of an engagement. So the array carries an
index beside it, rebuilt lazily after any push/splice/clear. The array stays
the source of truth; the Map is only ever a view of it.
<!-- /note -->

### <a id="s-hullIxDirty"></a>`hullIxDirty`

const · L870–870

<!-- note:hullIxDirty -->
<!-- /note -->

### <a id="s-reindexTraffic"></a>`reindexTraffic()`

function · **exported** · L872–874

- called by: [`launchWave`](rogues.js.md#s-launchWave) _js/npc/rogues.js_ · [`populateTraffic`](#s-populateTraffic) · [`removeVessel`](#s-removeVessel) · [`resetTraffic`](#s-resetTraffic) · [`spawnVessel`](#s-spawnVessel)

<!-- note:reindexTraffic -->
Mark the hull index stale — after any push/splice/clear of `traffic`.
<!-- /note -->

### <a id="s-hullIxLen"></a>`hullIxLen`

const · L876–876

<!-- note:hullIxLen -->
<!-- /note -->

### <a id="s-vesselById"></a>`vesselById(id)`

function · **exported** · L878–886

- called by: [`hailContact`](../comms/comms.js.md#s-hailContact) _js/comms/comms.js_ · [`alive`](../corp/seclevel.js.md#s-alive) _js/corp/seclevel.js_ · [`attackerKind`](../corp/seclevel.js.md#s-attackerKind) _js/corp/seclevel.js_ · [`bountyFor`](../corp/seclevel.js.md#s-bountyFor) _js/corp/seclevel.js_ · [`callSOS`](../corp/seclevel.js.md#s-callSOS) _js/corp/seclevel.js_ · [`wingArrived`](../corp/seclevel.js.md#s-wingArrived) _js/corp/seclevel.js_ ×2 · [`wingSupport`](../corp/seclevel.js.md#s-wingSupport) _js/corp/seclevel.js_ · [`adoptHulls`](../net/worldsync.js.md#s-adoptHulls) _js/net/worldsync.js_ · [`hostVesselDown`](../net/worldsync.js.md#s-hostVesselDown) _js/net/worldsync.js_ · [`fightCentre`](battles.js.md#s-fightCentre) _js/npc/battles.js_ ×2 · [`stepBattles`](battles.js.md#s-stepBattles) _js/npc/battles.js_ ×4 · [`acquire`](combat.js.md#s-acquire) _js/npc/combat.js_ · [`clearHunt`](combat.js.md#s-clearHunt) _js/npc/combat.js_ · [`combatFly`](combat.js.md#s-combatFly) _js/npc/combat.js_ ×2 · [`damageHull`](combat.js.md#s-damageHull) _js/npc/combat.js_ · [`stepFar`](combat.js.md#s-stepFar) _js/npc/combat.js_ · [`stepGuns`](combat.js.md#s-stepGuns) _js/npc/combat.js_ · [`nameOf`](ground.js.md#s-nameOf) _js/npc/ground.js_ · [`underFire`](ground.js.md#s-underFire) _js/npc/ground.js_ ×3 · [`transitionReport`](reports.js.md#s-transitionReport) _js/npc/reports.js_ · [`flyResponse`](security.js.md#s-flyResponse) _js/npc/security.js_ · [`noteAttack`](security.js.md#s-noteAttack) _js/npc/security.js_ · [`stepSecurity`](security.js.md#s-stepSecurity) _js/npc/security.js_ ×3 · [`victimOf`](security.js.md#s-victimOf) _js/npc/security.js_ · [`markVesselDown`](#s-markVesselDown) ×2 · [`leaveHulk`](../sim/sim.js.md#s-leaveHulk) _js/sim/sim.js_ · [`n`](../sim/sim.js.md#s-n) _js/sim/sim.js_ · [`onKill`](../sim/sim.js.md#s-onKill) _js/sim/sim.js_ · [`wireReactiveSky`](../sim/sim.js.md#s-wireReactiveSky) _js/sim/sim.js_ ×3

<!-- note:vesselById -->
- L879 · `if (hullIxDirty || traffic.length !== hullIxLen) {` — self-healing on the array's length as well as on reindexTraffic(), because
  `traffic` is exported and a caller (or a test) can mutate it directly
<!-- /note -->

### <a id="s-captainLine"></a>`captainLine(n)`

function · **exported** · L888–891

- called by: [`onVesselTransition`](../comms/comms.js.md#s-onVesselTransition) _js/comms/comms.js_ · [`vesselStatus`](#s-vesselStatus) · [`mountMap>dirEntries`](../ui/map.js.md#s-mountMap-dirEntries) _js/ui/map.js_ · [`mountMap>openMenu`](../ui/map.js.md#s-mountMap-openMenu) _js/ui/map.js_

<!-- note:captainLine -->
"Ilya Voss · she/her" — the person in the chair, for anything that lists hulls.
<!-- /note -->

### <a id="s-vesselStatus"></a>`vesselStatus(n)`

function · **exported** · L893–910

- calls: [`corpById`](../corp/corps.js.md#s-corpById) _js/corp/corps.js_ ×2 · [`captainLine`](#s-captainLine)
- called by: [`hailContact`](../comms/comms.js.md#s-hailContact) _js/comms/comms.js_ · [`mountMap>dirEntries`](../ui/map.js.md#s-mountMap-dirEntries) _js/ui/map.js_ · [`mountMap>openMenu`](../ui/map.js.md#s-mountMap-openMenu) _js/ui/map.js_

<!-- note:vesselStatus -->
"on approach to Bastion Anchorage — Ilya Voss · she/her commanding"

- L894 · `` const tag = n.crewTag ? ` · ${n.crewTag}` : ""; `` — npc/npccrew.js writes `crewTag` onto a vessel once it has a crew worth
  mentioning — a strike, a mutiny, a hull nobody is maintaining. Read as a
  plain string so this module never has to know that crews exist.
<!-- /note -->

### <a id="s-visibleVessels"></a>`visibleVessels(pos)`

function · **exported** · L912–917

<!-- note:visibleVessels -->
Everyone currently on the board, nearest first.
<!-- /note -->

### <a id="s-EVENT_KINDS"></a>`EVENT_KINDS`

const · **exported** · L919–919

<!-- note:EVENT_KINDS -->
---- shared sky events --------------------------------------------------
<!-- /note -->

### <a id="s-eventAt"></a>`eventAt(seed, t)`

function · **exported** · L921–945

- calls: [`rngFromSeed`](../world/generate.js.md#s-rngFromSeed) _js/world/generate.js_
- called by: [`engagementFor`](battles.js.md#s-engagementFor) _js/npc/battles.js_ · [`stepMarket`](../sim/sim.js.md#s-stepMarket) _js/sim/sim.js_

<!-- note:eventAt -->
The event that is live at `t` in this sky. Same seed + same slot = same
bulletin on every client. `quiet` means the markets desk has nothing.
About one slot in four carries something — a bulletin every ten or twelve
minutes, not every three.
<!-- /note -->

### <a id="s-eventLine"></a>`eventLine(ev, ports=)`

function · **exported** · L947–958

- called by: [`applySkyEvent`](../sim/sim.js.md#s-applySkyEvent) _js/sim/sim.js_

<!-- note:eventLine -->
- L951 · `if (!named.length) return null;` — no thirsty port, no bulletin
<!-- /note -->

### <a id="s-trafficCensus"></a>`trafficCensus(list=)`

function · **exported** · L960–973

- called by: [`publishHud`](../sim/sim.js.md#s-publishHud) _js/sim/sim.js_

<!-- note:trafficCensus -->
Count of live hulls by role, for the HUD and tests.
<!-- /note -->
