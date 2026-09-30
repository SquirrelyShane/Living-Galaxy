# js/crew/roster.js

[index](../../../README.md) · 101 lines · 23 symbols · 8 imports · 8 importers

## About

<!-- note:@file -->
LIVING GALAXY — the crew roster: sorted, filtered, and who is posted where.

The deck plan already knows where a hand works from their trade
(deckplan.stationRoomFor). This adds the captain's word: `m.duty` is a room
kind ("eng", "cargo", …) and stationRoomFor honours it first, so crewfx's
trim, duties' wear model and the interior walkers all follow the assignment
without knowing it was made. Contract: PLAN.md §4.1.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./ledger.js` | `crew` | [js/crew/ledger.js](ledger.js.md) |
| 2 | `../sim/sim.js` | `sim`, `currentShipId` | [js/sim/sim.js](../sim/sim.js.md) |
| 3 | `../ships/shipdb.js` | `shipById` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 4 | `../interior/deckplan.js` | `hullPlan`, `stationRoomFor` | [js/interior/deckplan.js](../interior/deckplan.js.md) |
| 5 | `../npc/crewfx.js` | `shiftPhase` | [js/npc/crewfx.js](../npc/crewfx.js.md) |
| 6 | `../npc/cradle.js` | `cradle` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 7 | `./bonds.js` | `tiesOf` | [js/crew/bonds.js](bonds.js.md) |
| 8 | `./family.js` | `trustOf` | [js/crew/family.js](family.js.md) |

## Imported by

- [js/aria/company.js](../aria/company.js.md) — `dutyOptions`, `setDuty`, `dutyOf`, `postKind`, `currentPlan`
- [js/console/panels/crew.js](../console/panels/crew.js.md) — `roster`, `ROSTER_SORTS`, `ROSTER_FILTERS`, `dutyOptions`, `setDuty`, `PHASE_LABEL`, `KIND_LABEL`
- [js/crew/duties.js](duties.js.md) — `currentPlan`, `dutyOf`, `postKind`, `KIND_LABEL`
- [js/crew/hull.js](hull.js.md) — `currentPlan`, `dutyOf`, `postKind`
- [js/crew/talk-trees.js](talk-trees.js.md) — `dutyOptions`, `dutyOf`, `KIND_LABEL`
- [js/crew/talk.js](talk.js.md) — `setDuty`, `dutyOf`, `postKind`
- test/ariabiz.test.mjs _(outside js/)_ — `dutyOf`, `postKind`, `dutyOptions`
- test/crew-life.test.mjs _(outside js/)_ — `roster`, `setDuty`, `dutyOf`, `dutyOptions`, `currentPlan`, `ROSTER_SORTS`

## Exports

- [`ROSTER_SORTS`](#s-ROSTER_SORTS) · const — used by [js/console/panels/crew.js](../console/panels/crew.js.md), test/crew-life.test.mjs
- [`ROSTER_FILTERS`](#s-ROSTER_FILTERS) · const — used by [js/console/panels/crew.js](../console/panels/crew.js.md)
- [`KIND_LABEL`](#s-KIND_LABEL) · const — used by [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/duties.js](duties.js.md), [js/crew/talk-trees.js](talk-trees.js.md)
- [`currentPlan`](#s-currentPlan) · function — used by [js/aria/company.js](../aria/company.js.md), [js/crew/duties.js](duties.js.md), [js/crew/hull.js](hull.js.md), test/crew-life.test.mjs
- [`dutyOf`](#s-dutyOf) · function — used by [js/aria/company.js](../aria/company.js.md), [js/crew/duties.js](duties.js.md), [js/crew/hull.js](hull.js.md), [js/crew/talk-trees.js](talk-trees.js.md), [js/crew/talk.js](talk.js.md), test/ariabiz.test.mjs, test/crew-life.test.mjs
- [`postKind`](#s-postKind) · function — used by [js/aria/company.js](../aria/company.js.md), [js/crew/duties.js](duties.js.md), [js/crew/hull.js](hull.js.md), [js/crew/talk.js](talk.js.md), test/ariabiz.test.mjs
- [`dutyOptions`](#s-dutyOptions) · function — used by [js/aria/company.js](../aria/company.js.md), [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/talk-trees.js](talk-trees.js.md), test/ariabiz.test.mjs, test/crew-life.test.mjs
- [`setDuty`](#s-setDuty) · function — used by [js/aria/company.js](../aria/company.js.md), [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/talk.js](talk.js.md), test/crew-life.test.mjs
- [`roster`](#s-roster) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), test/crew-life.test.mjs
- [`PHASE_LABEL`](#s-PHASE_LABEL) · const — used by [js/console/panels/crew.js](../console/panels/crew.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-ROSTER_SORTS"></a>`ROSTER_SORTS`

const · **exported** · L10–10

<!-- note:ROSTER_SORTS -->
<!-- /note -->

### <a id="s-ROSTER_FILTERS"></a>`ROSTER_FILTERS`

const · **exported** · L11–11

<!-- note:ROSTER_FILTERS -->
<!-- /note -->

### <a id="s-KIND_LABEL"></a>`KIND_LABEL`

const · **exported** · L13–16

<!-- note:KIND_LABEL -->
Room kinds a hand can be posted to, with the label the roster shows.
<!-- /note -->

### <a id="s-NOT_A_POST"></a>`NOT_A_POST`

const · L17–17

<!-- note:NOT_A_POST -->
<!-- /note -->

### <a id="s-planCache"></a>`planCache`

const · L19–19

<!-- note:planCache -->
<!-- /note -->

### <a id="s-currentPlan"></a>`currentPlan()`

function · **exported** · L21–27

- calls: [`hullPlan`](../interior/deckplan.js.md#s-hullPlan) _js/interior/deckplan.js_ · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ ×2 · [`currentShipId`](../sim/sim.js.md#s-currentShipId) _js/sim/sim.js_
- called by: [`tickDuties`](duties.js.md#s-tickDuties) _js/crew/duties.js_ · [`playerHull.plan`](hull.js.md#s-playerHull-plan) _js/crew/hull.js_ · [`dutyOf`](#s-dutyOf) · [`dutyOptions`](#s-dutyOptions) · [`roster`](#s-roster)

<!-- note:currentPlan -->
hullPlan(shipById(currentShipId()), sim.callsign) — the same key crewfx uses.
<!-- /note -->

### <a id="s-dutyOf"></a>`dutyOf(m, plan=)`

function · **exported** · L29–32

- calls: [`currentPlan`](#s-currentPlan) · [`stationRoomFor`](../interior/deckplan.js.md#s-stationRoomFor) _js/interior/deckplan.js_
- called by: [`bizReport`](../aria/company.js.md#s-bizReport) _js/aria/company.js_ · [`postThem`](../aria/company.js.md#s-postThem) _js/aria/company.js_ · [`tickDuties`](duties.js.md#s-tickDuties) _js/crew/duties.js_ · [`playerHull.postOf`](hull.js.md#s-playerHull-postOf) _js/crew/hull.js_ · [`roster`](#s-roster) · [`ROBOT_TOPICS.say`](talk-trees.js.md#s-ROBOT_TOPICS-say) _js/crew/talk-trees.js_ · [`TREE.say`](talk-trees.js.md#s-TREE-say) _js/crew/talk-trees.js_ · [`applyFx`](talk.js.md#s-applyFx) _js/crew/talk.js_

<!-- note:dutyOf -->
Where this hand stands their watch: honours m.duty, else their trade.
<!-- /note -->

### <a id="s-postKind"></a>`postKind(room)`

function · **exported** · L34–37

- called by: [`bizReport`](../aria/company.js.md#s-bizReport) _js/aria/company.js_ · [`postThem`](../aria/company.js.md#s-postThem) _js/aria/company.js_ · [`tickDuties`](duties.js.md#s-tickDuties) _js/crew/duties.js_ · [`playerHull.postOf`](hull.js.md#s-playerHull-postOf) _js/crew/hull.js_ · [`applyFx`](talk.js.md#s-applyFx) _js/crew/talk.js_

<!-- note:postKind -->
The room kind crewfx credits a room as: an industrial hall of kind "works" is "industry".
<!-- /note -->

### <a id="s-dutyOptions"></a>`dutyOptions(plan=)`

function · **exported** · L39–46

- calls: [`currentPlan`](#s-currentPlan)
- called by: [`hasPostFor`](../aria/company.js.md#s-hasPostFor) _js/aria/company.js_ · [`postThem`](../aria/company.js.md#s-postThem) _js/aria/company.js_ · [`rosterCard`](../console/panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_ · [`setDuty`](#s-setDuty) · [`ROBOT_TOPICS.say~3`](talk-trees.js.md#s-ROBOT_TOPICS-say-3) _js/crew/talk-trees.js_ · [`TREE.say`](talk-trees.js.md#s-TREE-say) _js/crew/talk-trees.js_

<!-- note:dutyOptions -->
[{ kind, label }] — distinct postable room kinds on this hull.
<!-- /note -->

### <a id="s-setDuty"></a>`setDuty(memberId, roomKind=)`

function · **exported** · L48–56

- calls: [`dutyOptions`](#s-dutyOptions)
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.find`
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.put`
- called by: [`postThem`](../aria/company.js.md#s-postThem) _js/aria/company.js_ · [`rosterCard.onPick`](../console/panels/crew.js.md#s-rosterCard-onPick) _js/console/panels/crew.js_ · [`applyFx`](talk.js.md#s-applyFx) _js/crew/talk.js_ ×2

<!-- note:setDuty -->
Post a hand to a room kind (null = back to their trade). Returns null or the reason it failed.
<!-- /note -->

### <a id="s-unsettled"></a>`unsettled(m)`

function · L58–61

- calls: [`trustOf`](family.js.md#s-trustOf) _js/crew/family.js_
- called by: [`roster`](#s-roster)

<!-- note:unsettled -->
<!-- /note -->

### <a id="s-normFilter"></a>`normFilter(filter)`

function · L63–68

- called by: [`roster`](#s-roster)

<!-- note:normFilter -->
<!-- /note -->

### <a id="s-cmp"></a>`cmp(a, b)`

function · L70–70

- called by: [`SORTERS.career`](#s-SORTERS-career) ×2 · [`SORTERS.name`](#s-SORTERS-name) · [`SORTERS.station`](#s-SORTERS-station) · [`roster`](#s-roster) ×2

<!-- note:cmp -->
<!-- /note -->

### <a id="s-SORTERS"></a>`SORTERS`

const · L71–79

<!-- note:SORTERS -->
<!-- /note -->

#### <a id="s-SORTERS-name"></a>`SORTERS.name(a, b)`

prop · L72–72

- calls: [`cmp`](#s-cmp)

<!-- note:SORTERS.name -->
<!-- /note -->

#### <a id="s-SORTERS-career"></a>`SORTERS.career(a, b)`

prop · L73–73

- calls: [`cmp`](#s-cmp) ×2

<!-- note:SORTERS.career -->
<!-- /note -->

#### <a id="s-SORTERS-station"></a>`SORTERS.station(a, b)`

prop · L74–74

- calls: [`cmp`](#s-cmp)

<!-- note:SORTERS.station -->
<!-- /note -->

#### <a id="s-SORTERS-morale"></a>`SORTERS.morale(a, b)`

prop · L75–75

<!-- note:SORTERS.morale -->
<!-- /note -->

#### <a id="s-SORTERS-trust"></a>`SORTERS.trust(a, b)`

prop · L76–76

- calls: [`trustOf`](family.js.md#s-trustOf) _js/crew/family.js_ ×2

<!-- note:SORTERS.trust -->
<!-- /note -->

#### <a id="s-SORTERS-wage"></a>`SORTERS.wage(a, b)`

prop · L77–77

<!-- note:SORTERS.wage -->
<!-- /note -->

#### <a id="s-SORTERS-kind"></a>`SORTERS.kind(a, b)`

prop · L78–78

<!-- note:SORTERS.kind -->
<!-- /note -->

### <a id="s-roster"></a>`roster({…}=)`

function · **exported** · L81–99

- calls: [`tiesOf`](bonds.js.md#s-tiesOf) _js/crew/bonds.js_ · [`cmp`](#s-cmp) ×2 · [`currentPlan`](#s-currentPlan) · [`dutyOf`](#s-dutyOf) · [`normFilter`](#s-normFilter) · [`unsettled`](#s-unsettled) · [`shiftPhase`](../npc/crewfx.js.md#s-shiftPhase) _js/npc/crewfx.js_
- called by: [`mountRoster>paintList`](../console/panels/crew.js.md#s-mountRoster-paintList) _js/console/panels/crew.js_

<!-- note:roster -->
The roster, sorted and filtered. filter: { kind: "all"|"human"|"robot",
shift: "on"|"off"|null, unsettled: bool } or one of ROSTER_FILTERS as a string.
→ [{ m, station, phase, duty, ties, robot }]

- L97 · `rows.sort((a, b) => sorter(a, b) || cmp(a.m.name, b.m.name) || cmp(a.m.id, b.m.id));` — stable: fall back to name, then id
<!-- /note -->

### <a id="s-PHASE_LABEL"></a>`PHASE_LABEL`

const · **exported** · L101–101

<!-- note:PHASE_LABEL -->
<!-- /note -->
