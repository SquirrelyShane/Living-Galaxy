# js/crew/duties.js

[index](../../../README.md) · 97 lines · 12 symbols · 7 imports · 14 importers

## About

<!-- note:@file -->
LIVING GALAXY — what the watch actually does.

A hull accrues *wear* — a maintenance backlog, 0..1 — from thrust, overdrive
and heat. Somebody at Engineering works it off and patches the hull; a
medic keeps morale up; a hand in the cargo bay stows the load tighter. The
backlog feeds back into the crew bag (warp costs more, hull gives less) and
once a cycle a neglected hull sours the crew and grinds the robots.
Contract: PLAN.md §4.4.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./ledger.js` | `crew`, `crewHooks`, `crewNote` | [js/crew/ledger.js](ledger.js.md) |
| 2 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 3 | `../flight/ship.js` | `THROTTLE_RATED` | [js/flight/ship.js](../flight/ship.js.md) |
| 4 | `./family.js` | `adjustMorale` | [js/crew/family.js](family.js.md) |
| 5 | `../economy/upgrades.js` | `fx` as `upgradeFx` | [js/economy/upgrades.js](../economy/upgrades.js.md) |
| 6 | `../npc/crewfx.js` | `shiftPhase` | [js/npc/crewfx.js](../npc/crewfx.js.md) |
| 7 | `./roster.js` | `currentPlan`, `dutyOf`, `postKind`, `KIND_LABEL` | [js/crew/roster.js](roster.js.md) |

## Imported by

- [js/console/panels/crew.js](../console/panels/crew.js.md) — `duties`, `dutyReport`
- [js/console/panels/ship.js](../console/panels/ship.js.md) — `duties`, `dutyReport`
- [js/crew/hull.js](hull.js.md) — `duties`
- [js/crew/robots.js](robots.js.md) — `duties`
- [js/crew/talk-threads.js](talk-threads.js.md) — `duties`, `wearLine`
- [js/crew/talk-trees.js](talk-trees.js.md) — `duties`, `wearLine`
- [js/crew/talk-wants.js](talk-wants.js.md) — `wearLine`
- [js/crew/talk.js](talk.js.md) — `duties`
- [js/npc/crewfx.js](../npc/crewfx.js.md) — `duties`, `tickDuties`, `dutyBag`
- test/crew-life.test.mjs _(outside js/)_ — `duties`, `tickDuties`, `tickDutiesCycle`, `dutyBag`, `dutyReport`
- test/genome.test.mjs _(outside js/)_ — `duties`
- test/orders.test.mjs _(outside js/)_ — `duties`
- test/robots.test.mjs _(outside js/)_ — `duties`
- test/skycrew.test.mjs _(outside js/)_ — `duties`

## Exports

- [`duties`](#s-duties) · const — used by [js/console/panels/crew.js](../console/panels/crew.js.md), [js/console/panels/ship.js](../console/panels/ship.js.md), [js/crew/hull.js](hull.js.md), [js/crew/robots.js](robots.js.md), [js/crew/talk-threads.js](talk-threads.js.md), [js/crew/talk-trees.js](talk-trees.js.md), [js/crew/talk.js](talk.js.md), [js/npc/crewfx.js](../npc/crewfx.js.md), test/crew-life.test.mjs, test/genome.test.mjs, test/orders.test.mjs, test/robots.test.mjs, test/skycrew.test.mjs
- [`DUTY_FX`](#s-DUTY_FX) · const — **no importer in scanned roots**
- [`strengthOf`](#s-strengthOf) · function — **no importer in scanned roots**
- [`tickDuties`](#s-tickDuties) · function — used by [js/npc/crewfx.js](../npc/crewfx.js.md), test/crew-life.test.mjs
- [`tickDutiesCycle`](#s-tickDutiesCycle) · function — used by test/crew-life.test.mjs
- [`dutyBag`](#s-dutyBag) · function — used by [js/npc/crewfx.js](../npc/crewfx.js.md), test/crew-life.test.mjs
- [`dutyReport`](#s-dutyReport) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), [js/console/panels/ship.js](../console/panels/ship.js.md), test/crew-life.test.mjs
- [`wearLine`](#s-wearLine) · function — used by [js/crew/talk-threads.js](talk-threads.js.md), [js/crew/talk-trees.js](talk-trees.js.md), [js/crew/talk-wants.js](talk-wants.js.md)
- `KIND_LABEL` — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-duties"></a>`duties`

const · **exported** · L9–9

<!-- note:duties -->
wear 0..1 — the hull's maintenance backlog
<!-- /note -->

### <a id="s-DUTY_FX"></a>`DUTY_FX`

const · **exported** · L11–14

<!-- note:DUTY_FX -->
<!-- /note -->

### <a id="s-WEAR"></a>`WEAR`

const · L16–16

<!-- note:WEAR -->
<!-- /note -->

### <a id="s-NEGLECT"></a>`NEGLECT`

const · L17–17

<!-- note:NEGLECT -->
<!-- /note -->

### <a id="s-strengthOf"></a>`strengthOf(m)`

function · **exported** · L19–22

- called by: [`tickDuties`](#s-tickDuties)

<!-- note:strengthOf -->
How much of a hand a hand is at their post: morale for people, condition for machines.
<!-- /note -->

### <a id="s-onPost"></a>`onPost(m)`

function · L24–27

- called by: [`tickDuties`](#s-tickDuties)

<!-- note:onPost -->
<!-- /note -->

### <a id="s-tickDuties"></a>`tickDuties(dt, time=)`

function · **exported** · L29–62

- calls: [`onPost`](#s-onPost) · [`strengthOf`](#s-strengthOf) · [`adjustMorale`](family.js.md#s-adjustMorale) _js/crew/family.js_ · [`currentPlan`](roster.js.md#s-currentPlan) _js/crew/roster.js_ · [`dutyOf`](roster.js.md#s-dutyOf) _js/crew/roster.js_ · [`postKind`](roster.js.md#s-postKind) _js/crew/roster.js_ · [`shiftPhase`](../npc/crewfx.js.md#s-shiftPhase) _js/npc/crewfx.js_
- called by: [`updateCrewMods`](../npc/crewfx.js.md#s-updateCrewMods) _js/npc/crewfx.js_

<!-- note:tickDuties -->
Every ~2 s from crewfx.updateCrewMods (dt in sim seconds). Rebuilds the
report of who is at which post, moves wear, and applies the station work.

- L34 · `const at = new Map();` — kind → strength sum of hands actually working
- L47 · `const t = Math.abs(ship.throttle ?? 0);` — the hull wears
- L50 · `const eng = at.get("eng") ?? 0;` — … and Engineering works it off
- L56 · `const med = at.get("med") ?? 0;` — the medic keeps people upright
<!-- /note -->

### <a id="s-tickDutiesCycle"></a>`tickDutiesCycle()`

function · **exported** · L64–74

- calls: [`adjustMorale`](family.js.md#s-adjustMorale) _js/crew/family.js_ ×2 · [`crewNote`](ledger.js.md#s-crewNote) _js/crew/ledger.js_ · [`fx`](../economy/upgrades.js.md#s-fx) _js/economy/upgrades.js_

<!-- note:tickDutiesCycle -->
Per pay cycle (crewHooks.cycle): a neglected hull sours the crew and grinds the robots; a galley feeds them.
<!-- /note -->

### <a id="s-dutyBag"></a>`dutyBag()`

function · **exported** · L76–79

- called by: [`updateCrewMods`](../npc/crewfx.js.md#s-updateCrewMods) _js/npc/crewfx.js_

<!-- note:dutyBag -->
{ warp, hull, cargo } — multiplied into the crew bag by crewfx.
<!-- /note -->

### <a id="s-dutyReport"></a>`dutyReport()`

function · **exported** · L81–83

- called by: [`rosterCard`](../console/panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_ · [`mountStatus`](../console/panels/ship.js.md#s-mountStatus) _js/console/panels/ship.js_

<!-- note:dutyReport -->
For SHIP › STATUS and ROSTER → [{ id, name, station, kind, task, strength, working }]
<!-- /note -->

### <a id="s-wearLine"></a>`wearLine()`

function · **exported** · L85–91

- called by: [`THREADS.say~3`](talk-threads.js.md#s-THREADS-say-3) _js/crew/talk-threads.js_ · [`TREE.say`](talk-trees.js.md#s-TREE-say) _js/crew/talk-trees.js_ · [`WANT_TOPICS.say`](talk-wants.js.md#s-WANT_TOPICS-say) _js/crew/talk-wants.js_

<!-- note:wearLine -->
One line on the state of the hull, for talk and status rows.
<!-- /note -->

### <a id="s-reset"></a>`reset()`

function · L96–96

<!-- note:reset -->
<!-- /note -->

## Module-level calls

- via [js/crew/ledger.js](ledger.js.md): `crewHooks.cycle.includes`, `crewHooks.cycle.push`, `crewHooks.reset.includes`, `crewHooks.reset.push`
