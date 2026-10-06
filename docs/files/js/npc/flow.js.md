# js/npc/flow.js

[index](../../../README.md) · 152 lines · 16 symbols · 9 imports · 16 importers

## About

<!-- note:@file -->
LIVING GALAXY — port flow: the heartbeat.

The captains in traffic.js are people — named, filed in the CRADLE,
running real legs across the sky. A port needs more than that to look
alive: a constant stream of supply boats in and goods boats out, the way
a body needs a pulse. That is the flow: per port, a ring of light hulls
cycling clamps → exit lane → gone → entry lane → clamps, phased evenly so
something is always arriving and something always leaving.

Flow hulls are not individuals. They carry no captain and no ledger
entry; they are a manifest (what they bring, what they take), a hull
variant from a small pool the engine pre-forges and re-uses (hullpool.js)
with a scale and hue jitter so no two look alike, and a pure timetable
pose like everything else on the board — same seed, same stream, every
client. They are not contacts and cannot be shot; they are the traffic
you fly through, not the traffic you fight.

- L22 · `export const FLOW_CAP = 58;` — the most boats the whole sky carries at once
- L28 · `export const FLOW_VARIANTS = 2;` — seeds per hull id in the pool (livery follows the variant)
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../world/generate.js` | `rngFromSeed` | [js/world/generate.js](../world/generate.js.md) |
| 2 | `../core/perf.js` | `perf` | [js/core/perf.js](../core/perf.js.md) |
| 3 | `../station/stations.js` | `stations` as `liveStations` | [js/station/stations.js](../station/stations.js.md) |
| 4 | `./lanes.js` | `stationLane`, `laneAt`, `SUBLANES`, `LANE_U` | [js/npc/lanes.js](lanes.js.md) |
| 5 | `./traffic.js` | `DEPART_S`, `ARRIVE_S`, `ARRIVE_U` | [js/npc/traffic.js](traffic.js.md) |
| 6 | `./bay.js` | `hasBay`, `bayPose`, `BAY_IN_S`, `BAY_OUT_S` | [js/npc/bay.js](bay.js.md) |
| 7 | `../economy/materials.js` | `SECTORS`, `goodName` | [js/economy/materials.js](../economy/materials.js.md) |
| 8 | `../ships/shipdb.js` | `shipById` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 9 | `../economy/economy.js` | `cargoFor`, `deliver`, `lift`, `stockOf` | [js/economy/economy.js](../economy/economy.js.md) |

## Imported by

- [js/aria/senses.js](../aria/senses.js.md) — `flow`
- [js/economy/contracts.js](../economy/contracts.js.md) — `flow`
- [js/flight/contacts.js](../flight/contacts.js.md) — `flow`
- [js/flight/probes.js](../flight/probes.js.md) — `flow`
- [js/npc/ground.js](ground.js.md) — `flow`
- [js/npc/npccrew.js](npccrew.js.md) — `flow`
- [js/npc/speech.js](speech.js.md) — `flow`
- [js/render/engine.js](../render/engine.js.md) — `flow`
- [js/sim/sim.js](../sim/sim.js.md) — `populateFlow`, `resetFlow`, `stepFlow`, `flow`, `portPulse`
- test/bay.test.mjs _(outside js/)_ — `flow`, `populateFlow`, `flowPose`
- test/economy.test.mjs _(outside js/)_ — `flow`, `populateFlow`, `stepFlow`, `flowPose`, `boatName`
- test/ground.test.mjs _(outside js/)_ — `flow`, `stepFlow`
- test/nav.test.mjs _(outside js/)_ — `FLOW_CAP`
- test/people.test.mjs _(outside js/)_ — `flow`
- test/sky.test.mjs _(outside js/)_ — `flow`, `populateFlow`, `stepFlow`, `flowPose`, `portPulse`
- test/speech.test.mjs _(outside js/)_ — `flow`, `stepFlow`

## Exports

- [`flow`](#s-flow) · const — used by [js/aria/senses.js](../aria/senses.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/flight/contacts.js](../flight/contacts.js.md), [js/flight/probes.js](../flight/probes.js.md), [js/npc/ground.js](ground.js.md), [js/npc/npccrew.js](npccrew.js.md), [js/npc/speech.js](speech.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), test/bay.test.mjs, test/economy.test.mjs, test/ground.test.mjs, test/people.test.mjs, test/sky.test.mjs, test/speech.test.mjs
- [`FLOW_CAP`](#s-FLOW_CAP) · const — used by test/nav.test.mjs
- [`FLOW_VARIANTS`](#s-FLOW_VARIANTS) · const — **no importer in scanned roots**
- [`boatName`](#s-boatName) · function — used by test/economy.test.mjs
- [`resetFlow`](#s-resetFlow) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`populateFlow`](#s-populateFlow) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/bay.test.mjs, test/economy.test.mjs, test/sky.test.mjs
- [`flowPose`](#s-flowPose) · function — used by test/bay.test.mjs, test/economy.test.mjs, test/sky.test.mjs
- [`stepFlow`](#s-stepFlow) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/economy.test.mjs, test/ground.test.mjs, test/sky.test.mjs, test/speech.test.mjs
- [`flowNear`](#s-flowNear) · function — **no importer in scanned roots**
- [`portPulse`](#s-portPulse) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/sky.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-flow"></a>`flow`

const · **exported** · L11–11

<!-- note:flow -->
<!-- /note -->

### <a id="s-SECTOR_HULLS"></a>`SECTOR_HULLS`

const · L13–20

<!-- note:SECTOR_HULLS -->
boats by sector: what a port of that kind sees most on its clamps
<!-- /note -->

### <a id="s-SECTOR_COUNT"></a>`SECTOR_COUNT`

const · L21–21

<!-- note:SECTOR_COUNT -->
Boats per port. These used to run 24/20/16/14/12/6, which across nine ports
is a hundred and sixty small craft — more than the entire named roster of
captains, drones and raiders put together, all of them anonymous, all of
them milling around the same few rings. A port should look busy; it should
not look like the only thing in the sky is shuttle traffic.

Roughly halved, and capped across the whole sky (FLOW_CAP) so a system with
a lot of ports does not quietly reintroduce the same crowd.
<!-- /note -->

### <a id="s-FLOW_CAP"></a>`FLOW_CAP`

const · **exported** · L22–22

<!-- note:FLOW_CAP -->
<!-- /note -->

### <a id="s-SECTOR_PALETTE"></a>`SECTOR_PALETTE`

const · L23–27

<!-- note:SECTOR_PALETTE -->
<!-- /note -->

### <a id="s-FLOW_VARIANTS"></a>`FLOW_VARIANTS`

const · **exported** · L28–28

<!-- note:FLOW_VARIANTS -->
<!-- /note -->

### <a id="s-PREFIX"></a>`PREFIX`

const · L30–30

<!-- note:PREFIX -->
Boats have names. Not captains — nobody is filed for them — but a hull on the
board reads as a ship, not as a cargo tag: a house prefix by sector, a word
and a pennant number, e.g. "MV TAMARIN 14" or "AG SORREL 3".
<!-- /note -->

### <a id="s-WORDS"></a>`WORDS`

const · L31–31

<!-- note:WORDS -->
<!-- /note -->

### <a id="s-boatName"></a>`boatName(sector, rng, i)`

function · **exported** · L32–34

- called by: [`populateFlow`](#s-populateFlow)

<!-- note:boatName -->
<!-- /note -->

### <a id="s-resetFlow"></a>`resetFlow()`

function · **exported** · L36–36

- called by: [`populateFlow`](#s-populateFlow) · [`returnToMenu`](../sim/sim.js.md#s-returnToMenu) _js/sim/sim.js_

<!-- note:resetFlow -->
<!-- /note -->

### <a id="s-populateFlow"></a>`populateFlow(seed, stationList=)`

function · **exported** · L38–79

- calls: [`cargoFor`](../economy/economy.js.md#s-cargoFor) _js/economy/economy.js_ · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`boatName`](#s-boatName) · [`resetFlow`](#s-resetFlow) · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ · [`rngFromSeed`](../world/generate.js.md#s-rngFromSeed) _js/world/generate.js_
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:populateFlow -->
Build the flow for every port in the sky. Deterministic per seed.

- L40 · `const tierK = perf.tier >= 3 ? 1 : perf.tier === 2 ? 0.8 : perf.tier === 1 ? 0.6 : 0.4;` — A device that is already shedding far-field detail does not want a
  hundred shuttles either, so the flow scales with the frame budget the
  same way everything else does.
- L42 · `const share = Math.max(2, Math.floor((FLOW_CAP * tierK) / ports));` — and the sky-wide cap is shared out, so ten ports each get a slice rather
  than each getting a full house
- L56 · `const good = cargoFor(st, inbound, rng) ?? ((inbound ? wants : sells)[0] ?? null);` — what it carries: the lines' inputs in, their outputs out (economy.js); the sector lists as the fallback
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L81–81

<!-- note:_p -->
<!-- /note -->

### <a id="s-flowPose"></a>`flowPose(n, t, stationList=, out=)`

function · **exported** · L83–125

- calls: [`bayPose`](bay.js.md#s-bayPose) _js/npc/bay.js_ ×2 · [`hasBay`](bay.js.md#s-hasBay) _js/npc/bay.js_ · [`laneAt`](lanes.js.md#s-laneAt) _js/npc/lanes.js_ ×2 · [`stationLane`](lanes.js.md#s-stationLane) _js/npc/lanes.js_
- called by: [`stepFlow`](#s-stepFlow)

<!-- note:flowPose -->
Docked hulls return before station lane geometry is requested; timetable transitions stay unchanged.

Pure pose of a flow hull at sky time t.

- L88 · `const away = n.period - dock - DEPART_S - ARRIVE_S;` — gone: somewhere else, off the board
- L95 · `const bay = hasBay(st);` — 0.3.15: a port with a built hangar puts the first seconds of a departure
  and the last seconds of an arrival INSIDE the bay (npc/bay.js) — off the
  clamps and out through the exit door, in through the entry door and down
  onto them. The lane part of each run is the rest of the same budget, so
  the timetable (and every transition the ledger keys on) is unchanged.
<!-- /note -->

### <a id="s-stepFlow"></a>`stepFlow(t, stationList=)`

function · **exported** · L127–138

- calls: [`deliver`](../economy/economy.js.md#s-deliver) _js/economy/economy.js_ · [`lift`](../economy/economy.js.md#s-lift) _js/economy/economy.js_ · [`stockOf`](../economy/economy.js.md#s-stockOf) _js/economy/economy.js_ · [`flowPose`](#s-flowPose)
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepFlow -->
Advance every flow hull. Cheap: a few dozen pure evaluations — plus the cargo: an inbound
boat that reaches the clamps delivers, an outbound one that leaves them lifts.

- L134 · `if (n.inbound && was === "approach" && n.job === "docked") { const had = stockOf(st, n.goo` — only what the floor actually took
<!-- /note -->

### <a id="s-flowNear"></a>`flowNear(pos, range)`

function · **exported** · L140–146

<!-- note:flowNear -->
Flow hulls on the board near a point, nearest first.
<!-- /note -->

### <a id="s-portPulse"></a>`portPulse(stId)`

function · **exported** · L148–152

- called by: [`stepLaneDiscipline`](../sim/sim.js.md#s-stepLaneDiscipline) _js/sim/sim.js_

<!-- note:portPulse -->
How busy a port's clamps are right now: hulls on its lanes.
<!-- /note -->
