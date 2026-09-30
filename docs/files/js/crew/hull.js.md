# js/crew/hull.js

[index](../../../README.md) · 145 lines · 34 symbols · 7 imports · 4 importers

## About

<!-- note:@file -->
Living Galaxy — a HULL, as the deck graph sees one.

an earlier build's deckmind reached straight into `sim.ship`, `crew.aboard` and
`duties.wear`, which meant exactly one ship in the sky had a crew who
thought about anything: yours. This is the seam that fixes that. A hull is
whatever a watch is stood on — the player's, or one of the ~160 NPC vessels
in `npc/traffic.js` and `npc/flow.js` — and the graph, the effect table and
the journal all go through it rather than round it.

The player's hull is the real thing: the live ship object, the real deck
plan, the real maintenance backlog, the real payroll. An NPC hull is the
cheap version of the same interface — a wear number and a hull percentage
carried on the vessel, rooms named from a trade instead of a generated deck
plan, and no payroll, because nobody is reading an NPC's wage slip. The
decisions on both come out of the same 63 nodes.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./ledger.js` | `crew`, `crewNote` | [js/crew/ledger.js](ledger.js.md) |
| 2 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 3 | `./duties.js` | `duties` | [js/crew/duties.js](duties.js.md) |
| 4 | `./roster.js` | `currentPlan`, `dutyOf`, `postKind` | [js/crew/roster.js](roster.js.md) |
| 5 | `../npc/crewfx.js` | `shiftPhase` | [js/npc/crewfx.js](../npc/crewfx.js.md) |
| 6 | `../interior/boarding.js` | `boarding` | [js/interior/boarding.js](../interior/boarding.js.md) |
| 7 | `./family.js` | `social`, `loadSocial` | [js/crew/family.js](family.js.md) |

## Imported by

- [js/crew/deckmind.js](deckmind.js.md) — `playerHull`
- [js/crew/orders.js](orders.js.md) — `playerHull`
- [js/npc/npccrew.js](../npc/npccrew.js.md) — `vesselHull`
- test/skycrew.test.mjs _(outside js/)_ — `playerHull`, `vesselHull`, `ROOM_NAME`

## Exports

- [`ROOM_NAME`](#s-ROOM_NAME) · const — used by test/skycrew.test.mjs
- [`playerHull`](#s-playerHull) · function — used by [js/crew/deckmind.js](deckmind.js.md), [js/crew/orders.js](orders.js.md), test/skycrew.test.mjs
- [`vesselHull`](#s-vesselHull) · function — used by [js/npc/npccrew.js](../npc/npccrew.js.md), test/skycrew.test.mjs
- [`hullOf`](#s-hullOf) · function — **no importer in scanned roots**
- [`resetHulls`](#s-resetHulls) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-clamp01"></a>`clamp01(v)`

function · L9–9

- called by: [`playerHull.addWear`](#s-playerHull-addWear) · [`vesselHull.addWear`](#s-vesselHull-addWear)

<!-- note:clamp01 -->
<!-- /note -->

### <a id="s-r3"></a>`r3(v)`

function · L10–10

- called by: [`playerHull.state`](#s-playerHull-state) ×2 · [`vesselHull.state`](#s-vesselHull-state)

<!-- note:r3 -->
<!-- /note -->

### <a id="s-ROOM_NAME"></a>`ROOM_NAME`

const · **exported** · L12–16

<!-- note:ROOM_NAME -->
Room names for a post kind, when there is no generated deck plan to ask.
<!-- /note -->

### <a id="s-COMPLEX_POST"></a>`COMPLEX_POST`

const · L18–26

<!-- note:COMPLEX_POST -->
A trade's natural post, for hands on a hull with no deck plan.
<!-- /note -->

### <a id="s-postFromTrade"></a>`postFromTrade(m)`

function · L28–32

- called by: [`vesselHull.postOf`](#s-vesselHull-postOf)

<!-- note:postFromTrade -->
<!-- /note -->

### <a id="s-_player"></a>`_player`

const · L34–34

<!-- note:_player -->
---- the player's hull ---------------------------------------------------
<!-- /note -->

### <a id="s-playerHull"></a>`playerHull()`

function · **exported** · L36–83

- called by: [`buildContext`](deckmind.js.md#s-buildContext) _js/crew/deckmind.js_ · [`runDeckCycle`](deckmind.js.md#s-runDeckCycle) _js/crew/deckmind.js_ · [`hullOf`](#s-hullOf) · [`grievanceCauses`](orders.js.md#s-grievanceCauses) _js/crew/orders.js_

<!-- note:playerHull -->
The one hull with a real deck plan, a real backlog and a real payroll.
<!-- /note -->

#### <a id="s-playerHull-name"></a>`playerHull.name()`

prop · L41–41

<!-- note:playerHull.name -->
<!-- /note -->

#### <a id="s-playerHull-employer"></a>`playerHull.employer()`

prop · L42–42

<!-- note:playerHull.employer -->
<!-- /note -->

#### <a id="s-playerHull-roster"></a>`playerHull.roster()`

prop · L43–43

<!-- note:playerHull.roster -->
<!-- /note -->

#### <a id="s-playerHull-plan"></a>`playerHull.plan()`

prop · L44–44

- calls: [`currentPlan`](roster.js.md#s-currentPlan) _js/crew/roster.js_

<!-- note:playerHull.plan -->
<!-- /note -->

#### <a id="s-playerHull-state"></a>`playerHull.state()`

prop · L46–67

- calls: [`r3`](#s-r3) ×2

<!-- note:playerHull.state -->
- L49 · `const e = sim.engagement;` — An alarm is what the watch on THIS hull has to do something about.
  A firefight somewhere in the sky is a bulletin, not a klaxon — the
  crew only go to stations when the ship is actually in it.
<!-- /note -->

#### <a id="s-playerHull-postOf"></a>`playerHull.postOf(m)`

prop · L69–72

- calls: [`dutyOf`](roster.js.md#s-dutyOf) _js/crew/roster.js_ · [`postKind`](roster.js.md#s-postKind) _js/crew/roster.js_

<!-- note:playerHull.postOf -->
<!-- /note -->

#### <a id="s-playerHull-phaseOf"></a>`playerHull.phaseOf(m, time)`

prop · L73–73

- calls: [`shiftPhase`](../npc/crewfx.js.md#s-shiftPhase) _js/npc/crewfx.js_

<!-- note:playerHull.phaseOf -->
<!-- /note -->

#### <a id="s-playerHull-addWear"></a>`playerHull.addWear(d)`

prop · L75–75

- calls: [`clamp01`](#s-clamp01)

<!-- note:playerHull.addWear -->
<!-- /note -->

#### <a id="s-playerHull-repair"></a>`playerHull.repair(d)`

prop · L76–76

<!-- note:playerHull.repair -->
<!-- /note -->

#### <a id="s-playerHull-flag"></a>`playerHull.flag(k)`

prop · L77–77

<!-- note:playerHull.flag -->
<!-- /note -->

#### <a id="s-playerHull-note"></a>`playerHull.note(msg)`

prop · L78–78

- calls: [`crewNote`](ledger.js.md#s-crewNote) _js/crew/ledger.js_

<!-- note:playerHull.note -->
<!-- /note -->

#### <a id="s-playerHull-romance"></a>`playerHull.romance()`

prop · L79–79

- calls: [`loadSocial`](family.js.md#s-loadSocial) _js/crew/family.js_

<!-- note:playerHull.romance -->
<!-- /note -->

#### <a id="s-playerHull-intruders"></a>`playerHull.intruders()`

prop · L80–80

<!-- note:playerHull.intruders -->
only the player's hull can actually be boarded by intruders
<!-- /note -->

### <a id="s-vesselHull"></a>`vesselHull(v)`

function · **exported** · L85–138

- called by: [`tickNpcCrews`](../npc/npccrew.js.md#s-tickNpcCrews) _js/npc/npccrew.js_

<!-- note:vesselHull -->
---- an NPC vessel's hull ------------------------------------------------

The same interface over a traffic captain or a flow boat. The vessel object
itself carries the state — `v.wear`, `v.hullPct`, `v.crewList` — so nothing
here has to be kept in a side table that can drift out of step with a
vessel that was shot down.
<!-- /note -->

#### <a id="s-vesselHull-name"></a>`vesselHull.name()`

prop · L91–91

<!-- note:vesselHull.name -->
<!-- /note -->

#### <a id="s-vesselHull-employer"></a>`vesselHull.employer()`

prop · L92–92

<!-- note:vesselHull.employer -->
<!-- /note -->

#### <a id="s-vesselHull-roster"></a>`vesselHull.roster()`

prop · L93–93

<!-- note:vesselHull.roster -->
<!-- /note -->

#### <a id="s-vesselHull-state"></a>`vesselHull.state()`

prop · L96–111

- calls: [`r3`](#s-r3)

<!-- note:vesselHull.state -->
<!-- /note -->

#### <a id="s-vesselHull-postOf"></a>`vesselHull.postOf(m)`

prop · L113–116

- calls: [`postFromTrade`](#s-postFromTrade)

<!-- note:vesselHull.postOf -->
<!-- /note -->

#### <a id="s-vesselHull-phaseOf"></a>`vesselHull.phaseOf(m, time)`

prop · L117–123

<!-- note:vesselHull.phaseOf -->
no generated rota on an NPC hull: the watch is split off the member id
so it is stable, and so two hands are not always in the same place
<!-- /note -->

#### <a id="s-vesselHull-addWear"></a>`vesselHull.addWear(d)`

prop · L125–125

- calls: [`clamp01`](#s-clamp01)

<!-- note:vesselHull.addWear -->
<!-- /note -->

#### <a id="s-vesselHull-repair"></a>`vesselHull.repair(d)`

prop · L126–126

<!-- note:vesselHull.repair -->
<!-- /note -->

#### <a id="s-vesselHull-flag"></a>`vesselHull.flag(k)`

prop · L127–127

<!-- note:vesselHull.flag -->
<!-- /note -->

#### <a id="s-vesselHull-note"></a>`vesselHull.note(msg)`

prop · L128–132

<!-- note:vesselHull.note -->
an NPC deck's book is the vessel's own; nothing goes in the player's log
unless the vessel is close enough for it to be overheard (npccrew.js)
<!-- /note -->

#### <a id="s-vesselHull-intruders"></a>`vesselHull.intruders()`

prop · L134–134

<!-- note:vesselHull.intruders -->
<!-- /note -->

### <a id="s-hullOf"></a>`hullOf(m)`

function · **exported** · L140–143

- calls: [`playerHull`](#s-playerHull)

<!-- note:hullOf -->
Whichever hull this member is standing on. Defaults to the player's.
<!-- /note -->

### <a id="s-resetHulls"></a>`resetHulls()`

function · **exported** · L145–145

<!-- note:resetHulls -->
<!-- /note -->
