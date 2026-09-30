# js/npc/npccrew.js

[index](../../../README.md) · 320 lines · 25 symbols · 11 imports · 3 importers

## About

<!-- note:@file -->
Living Galaxy — crews for the other hundred and sixty hulls.

an earlier patch gave the player's watch a genome, a decision graph and a journal. Every
other ship in the sky was a transponder with a captain's name on it. This
puts a crew behind each of them — the same 64 nodes, the same nine needs,
the same records — and lets what those crews decide reach the sim: a hauler
whose engineer has stopped caring wears out faster, a pirate crew that has
not been paid turns on its captain, and the hand who walks off a trader at
Foundry Hold is in the hiring hall when you dock there.

Three things keep it affordable on a phone:

  1. Crews are BUILT LAZILY, nearest first. A vessel forty thousand units
     away that you have never scanned has no crew until it needs one.
  2. Crews are NOT FILED. They are grown from a deterministic seed and kept
     in memory; only somebody who *does* something — deserts, mutinies, gets
     hired — is promoted into CRADLE. A ledger of 600 provisional strangers
     would be a megabyte of localStorage nobody asked for.
  3. A fixed WORK BUDGET per cycle. A round-robin slice of the sky stands a
     real watch through the graph; everyone else drifts on a cheap model
     that moves the same numbers without walking 64 nodes to do it.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./traffic.js` | `traffic`, `trafficDown`, `markVesselDown` | [js/npc/traffic.js](traffic.js.md) |
| 2 | `./battles.js` | `engagementOf` | [js/npc/battles.js](battles.js.md) |
| 3 | `./flow.js` | `flow` | [js/npc/flow.js](flow.js.md) |
| 4 | `./cradle.js` | `cradle`, `generateNPC` | [js/npc/cradle.js](cradle.js.md) |
| 5 | `../corp/gdb.js` | `catalogue`, `file` as `gdbFile` | [js/corp/gdb.js](../corp/gdb.js.md) |
| 6 | `../ships/shipdb.js` | `shipById` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 7 | `../sim/sim.js` | `sim`, `logEvent` | [js/sim/sim.js](../sim/sim.js.md) |
| 8 | `../crew/ledger.js` | `crew` **unused**, `crewHooks`, `CYCLE_SECONDS` | [js/crew/ledger.js](../crew/ledger.js.md) |
| 9 | `../crew/hull.js` | `vesselHull` | [js/crew/hull.js](../crew/hull.js.md) |
| 10 | `../crew/deckmind.js` | `stepWatch`, `needsOf`, `forgetBody` | [js/crew/deckmind.js](../crew/deckmind.js.md) |
| 11 | `../crew/journal.js` | `journal` | [js/crew/journal.js](../crew/journal.js.md) |

## Imported by

- [js/console/panels/crew-sky.js](../console/panels/crew-sky.js.md) — `npcCrews`, `moodOf`, `vesselJournal`, `NEAR_U`, `DESERT_AT`, `STRIKE_AT`, `WORK_BUDGET`
- test/gdb.test.mjs _(outside js/)_ — `crewOf`
- test/skycrew.test.mjs _(outside js/)_ — `npcCrews`, `tickNpcCrews`, `tickSky`, `crewOf`, `crewSizeOf`, `moodOf`, `crewCensus`, `vesselJournal`, `promote`, `readRun`, `applyMood`, `resetNpcCrews`, `WORK_BUDGET`, `BUILD_BUDGET`, `DESERT_AT`, `STRIKE_AT`

## Exports

- [`WORK_BUDGET`](#s-WORK_BUDGET) · const — used by [js/console/panels/crew-sky.js](../console/panels/crew-sky.js.md), test/skycrew.test.mjs
- [`BUILD_BUDGET`](#s-BUILD_BUDGET) · const — used by test/skycrew.test.mjs
- [`NEAR_U`](#s-NEAR_U) · const — used by [js/console/panels/crew-sky.js](../console/panels/crew-sky.js.md)
- [`DESERT_AT`](#s-DESERT_AT) · const — used by [js/console/panels/crew-sky.js](../console/panels/crew-sky.js.md), test/skycrew.test.mjs
- [`STRIKE_AT`](#s-STRIKE_AT) · const — used by [js/console/panels/crew-sky.js](../console/panels/crew-sky.js.md), test/skycrew.test.mjs
- [`MUTINY_AT`](#s-MUTINY_AT) · const — **no importer in scanned roots**
- [`npcCrews`](#s-npcCrews) · const — used by [js/console/panels/crew-sky.js](../console/panels/crew-sky.js.md), test/skycrew.test.mjs
- [`crewSizeOf`](#s-crewSizeOf) · function — used by test/skycrew.test.mjs
- [`crewOf`](#s-crewOf) · function — used by test/gdb.test.mjs, test/skycrew.test.mjs
- [`moodOf`](#s-moodOf) · function — used by [js/console/panels/crew-sky.js](../console/panels/crew-sky.js.md), test/skycrew.test.mjs
- [`promote`](#s-promote) · function — used by test/skycrew.test.mjs
- [`readRun`](#s-readRun) · function — used by test/skycrew.test.mjs
- [`applyMood`](#s-applyMood) · function — used by test/skycrew.test.mjs
- [`tickNpcCrews`](#s-tickNpcCrews) · function — used by test/skycrew.test.mjs
- [`crewCensus`](#s-crewCensus) · function — used by test/skycrew.test.mjs
- [`vesselJournal`](#s-vesselJournal) · function — used by [js/console/panels/crew-sky.js](../console/panels/crew-sky.js.md), test/skycrew.test.mjs
- [`resetNpcCrews`](#s-resetNpcCrews) · function — used by test/skycrew.test.mjs
- [`tickSky`](#s-tickSky) · function — used by test/skycrew.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-WORK_BUDGET"></a>`WORK_BUDGET`

const · **exported** · L13–13

<!-- note:WORK_BUDGET -->
Full graph steps per cycle, across the whole sky. The hard ceiling.
<!-- /note -->

### <a id="s-BUILD_BUDGET"></a>`BUILD_BUDGET`

const · **exported** · L14–14

<!-- note:BUILD_BUDGET -->
Vessels whose crews may be built in one cycle.
<!-- /note -->

### <a id="s-NEAR_U"></a>`NEAR_U`

const · **exported** · L15–15

<!-- note:NEAR_U -->
Inside this range a vessel's crew is worth simulating properly.
<!-- /note -->

### <a id="s-DESERT_AT"></a>`DESERT_AT`

const · **exported** · L16–16

<!-- note:DESERT_AT -->
Below this mean morale a hand walks at the next port.
<!-- /note -->

### <a id="s-STRIKE_AT"></a>`STRIKE_AT`

const · **exported** · L17–17

<!-- note:STRIKE_AT -->
Below this the watch stops working the ship.
<!-- /note -->

### <a id="s-MUTINY_AT"></a>`MUTINY_AT`

const · **exported** · L18–18

<!-- note:MUTINY_AT -->
Below this a pirate crew stops taking orders from its captain.
<!-- /note -->

### <a id="s-npcCrews"></a>`npcCrews`

const · **exported** · L20–28

<!-- note:npcCrews -->
- L22 · `built: 0,` — vessels with a crew
- L23 · `people: 0,` — hands alive in memory
- L24 · `stepped: 0,` — full graph steps last cycle
- L25 · `drifted: 0,` — cheap steps last cycle
- L26 · `events: [],` — { t, vesselId, kind, text }
<!-- /note -->

### <a id="s-clamp"></a>`clamp(v, a, b)`

function · L30–30

- called by: [`applyMood`](#s-applyMood) ×3 · [`crewSizeOf`](#s-crewSizeOf) · [`drift`](#s-drift) ×2

<!-- note:clamp -->
<!-- /note -->

### <a id="s-crewSizeOf"></a>`crewSizeOf(v)`

function · **exported** · L32–36

- calls: [`clamp`](#s-clamp) · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_
- called by: [`crewOf`](#s-crewOf)

<!-- note:crewSizeOf -->
---- building a crew ------------------------------------------------------

Berths on this hull, from the ship class table, bounded to something a watch fits in.
<!-- /note -->

### <a id="s-ROLE_TRADES"></a>`ROLE_TRADES`

const · L38–45

<!-- note:ROLE_TRADES -->
The complexes a vessel of this role actually signs on.
<!-- /note -->

### <a id="s-crewOf"></a>`crewOf(v)`

function · **exported** · L47–94

- calls: [`catalogue`](../corp/gdb.js.md#s-catalogue) _js/corp/gdb.js_ · [`generateNPC`](cradle.js.md#s-generateNPC) _js/npc/cradle.js_ · [`crewSizeOf`](#s-crewSizeOf)
- called by: [`tickNpcCrews`](#s-tickNpcCrews)

<!-- note:crewOf -->
A vessel's crew, grown from its own id. Deterministic: the same hauler in
the same sky always carries the same people, on this device and any other.

- L82 · `duty: null,` — the vessel's trade decides the post, not a deck plan it does not have
- L84 · `catalogue(list[i], { kind: "crew", place: v.id, sky: sim.skySeed ?? null, group: [{ id: v.` — 0.3.54: into the GDB — one name to one person in the whole galaxy, and
  not one that looks like a shipmate's. The captain is in the room too.
- L85 · `const want = trades[i % trades.length];` — keep the unfiled record's own trade sensible for the run it is on
<!-- /note -->

### <a id="s-moodOf"></a>`moodOf(v)`

function · **exported** · L96–102

- called by: [`rows`](../console/panels/crew-sky.js.md#s-rows) _js/console/panels/crew-sky.js_ · [`applyMood`](#s-applyMood) · [`crewCensus`](#s-crewCensus)

<!-- note:moodOf -->
Mean morale of a vessel's watch, 0..100. Null when nobody has been built yet.
<!-- /note -->

### <a id="s-promote"></a>`promote(m, note)`

function · **exported** · L104–117

- calls: [`file`](../corp/gdb.js.md#s-file) _js/corp/gdb.js_ · [`generateNPC`](cradle.js.md#s-generateNPC) _js/npc/cradle.js_
- via [js/npc/cradle.js](cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`applyMood`](#s-applyMood) ×3

<!-- note:promote -->
---- promotion ------------------------------------------------------------
A provisional hand becomes a real ledger entry the moment they do something
that ought to outlive the run: walk off, mutiny, or get hired by the player.

- L114 · `gdbFile(rec, { kind: "crew" });` — the catalogued name stands; now a full record
- L116 · `return rec;` — the cached body was keyed on the same id, and is still the same body
<!-- /note -->

### <a id="s-event"></a>`event(v, kind, text)`

function · L119–124

- calls: [`distanceTo`](#s-distanceTo) · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- called by: [`applyMood`](#s-applyMood) ×5

<!-- note:event -->
---- what a soured watch does ---------------------------------------------

- L122 · `const d = distanceTo(v);` — close enough to overhear
<!-- /note -->

### <a id="s-distanceTo"></a>`distanceTo(v)`

function · L126–130

- called by: [`event`](#s-event)

<!-- note:distanceTo -->
<!-- /note -->

### <a id="s-readRun"></a>`readRun(v)`

function · **exported** · L132–144

- calls: [`engagementOf`](battles.js.md#s-engagementOf) _js/npc/battles.js_
- called by: [`tickNpcCrews`](#s-tickNpcCrews)

<!-- note:readRun -->
What the run is like to be on. A hull that is off its route is not earning,
and a hull that is not earning is not paying — which is a grievance the deck
graph already knows what to do with. Nothing here is circular: a vessel that
is down because its own watch struck does not also count as unpaid.

- L136 · `const working = v.job && v.job !== "down" && v.job !== "hold";` — An NPC hull earns by running. A miner cutting rock, a trader three hours
  into a burn and a patrol on its arc are all working; a hull that is off
  the board is not. Cycles off the board is the whole wage model, and it
  does not care why — shot at, told to wait, or struck by its own watch, the
  wage slip reads the same.
<!-- /note -->

### <a id="s-applyMood"></a>`applyMood(v)`

function · **exported** · L146–208

- calls: [`clamp`](#s-clamp) ×3 · [`event`](#s-event) ×5 · [`moodOf`](#s-moodOf) · [`promote`](#s-promote) ×3 · [`markVesselDown`](traffic.js.md#s-markVesselDown) _js/npc/traffic.js_ ×2
- called by: [`tickNpcCrews`](#s-tickNpcCrews)

<!-- note:applyMood -->
The consequences a crew's mood has on the ship it is standing on. This is
the part the rest of the sim can feel: caution on a jump, willingness in a
fight, a hull that wears faster because nobody is working the backlog.

- L150 · `v.crewCaution = clamp(0.25 + (mood / 100) * 0.55, 0.1, 0.9);` — a happy watch is a careful one; a sour watch cuts corners
- L154 · `v.crewTag = v.derelict ? "derelict"` — one short string the map and the SHIPS directory can read without
  knowing anything about crews
- L171 · `if (v.strikeCool > 0) v.strikeCool--;` — Strike, with hysteresis and a cooling-off period, so a watch on the edge
  does not flicker on and off the board every cycle.
- L188 · `const stranded = (v.strikeFor ?? 0) > 8 || (v.legsSince ?? 0) > 16;` — A hand walks at the next port — or, if the hull has been sitting off its
  route long enough that there is no next port, on whatever shuttle is
  going. Either way they end up in a hiring hall, and the hiring hall is
  where you meet them.
<!-- /note -->

### <a id="s-drift"></a>`drift(v)`

function · L210–221

- calls: [`needsOf`](../crew/deckmind.js.md#s-needsOf) _js/crew/deckmind.js_ · [`clamp`](#s-clamp) ×2
- called by: [`tickNpcCrews`](#s-tickNpcCrews)

<!-- note:drift -->
---- the cheap model ------------------------------------------------------
For the hands not in this cycle's budget: the needs still rise, morale still
follows what the ship is like to be on, but nothing walks the graph. Over a
long run the two models agree on where a crew ends up; only the near ones
get a reason on file for how they got there.
<!-- /note -->

### <a id="s-candidates"></a>`candidates()`

function · L223–233

- called by: [`tickNpcCrews`](#s-tickNpcCrews)

<!-- note:candidates -->
---- the cycle ------------------------------------------------------------

Vessels worth attention, nearest first, with the flow boats behind them.
<!-- /note -->

### <a id="s-tickNpcCrews"></a>`tickNpcCrews()`

function · **exported** · L235–272

- calls: [`stepWatch`](../crew/deckmind.js.md#s-stepWatch) _js/crew/deckmind.js_ · [`vesselHull`](../crew/hull.js.md#s-vesselHull) _js/crew/hull.js_ · [`applyMood`](#s-applyMood) · [`candidates`](#s-candidates) · [`crewOf`](#s-crewOf) · [`drift`](#s-drift) · [`readRun`](#s-readRun)
- called by: [`tickSky`](#s-tickSky)

<!-- note:tickNpcCrews -->
One cycle of deck life across the sky, inside the budget. Hooked onto the
same `crewHooks.cycle` the player's watch runs on, after it.

- L245 · `let built = 0;` — build a few crews, nearest first, so the ships you can actually see are
  the ones with people on them
- L253 · `const withCrew = list.filter((v) => v.crewList?.length);` — spend the work budget round-robin, so nobody is permanently abstract
<!-- /note -->

### <a id="s-crewCensus"></a>`crewCensus(list=)`

function · **exported** · L274–278

- calls: [`moodOf`](#s-moodOf)

<!-- note:crewCensus -->
[{ name, role, mood, crew, wear }] — the SHIPS directory's crew column.
<!-- /note -->

### <a id="s-vesselJournal"></a>`vesselJournal(v, n=)`

function · **exported** · L280–283

- via [js/crew/journal.js](../crew/journal.js.md): `journal.all`, `journal.all.filter`, `journal.all.filter.slice`, `….filter.slice.reverse`
- called by: [`vesselCard`](../console/panels/crew-sky.js.md#s-vesselCard) _js/console/panels/crew-sky.js_

<!-- note:vesselJournal -->
The decision records filed for one vessel's watch this session.
<!-- /note -->

### <a id="s-resetNpcCrews"></a>`resetNpcCrews()`

function · **exported** · L285–308

- calls: [`forgetBody`](../crew/deckmind.js.md#s-forgetBody) _js/crew/deckmind.js_

<!-- note:resetNpcCrews -->
Drop every provisional crew — a new sky is new people.
<!-- /note -->

### <a id="s-pool"></a>`pool`

const · L310–310

<!-- note:pool -->
Its own clock, on `always`, so the sky keeps its crews whether or not the
player has a single hand aboard. The pool is the same 90-second cycle the
payroll runs on, so a watch out there and a watch in here are the same
length of time.
<!-- /note -->

### <a id="s-tickSky"></a>`tickSky(seconds)`

function · **exported** · L311–317

- calls: [`tickNpcCrews`](#s-tickNpcCrews)

<!-- note:tickSky -->
- L316 · `if (pool > CYCLE_SECONDS * 4) pool = 0;` — a long pause is not four hundred watches
<!-- /note -->

## Module-level calls

- via [js/crew/ledger.js](../crew/ledger.js.md): `crewHooks.always.includes`, `crewHooks.always.push`, `crewHooks.reset.includes`, `crewHooks.reset.push`
