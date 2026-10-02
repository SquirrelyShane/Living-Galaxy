# js/crew/ledger.js

[index](../../../README.md) · 310 lines · 32 symbols · 5 imports · 61 importers

## About

<!-- note:@file -->
LIVING GALAXY — the crew ledger.

Crew are hired off station rosters, draw a wage every cycle (the same
90-second cycle the career engine runs on), and keep morale. A paid crew
settles toward content; an unpaid one sours by the cycle and walks when
the number hits zero. Wages come straight off the complex pay ladders in
careers/complexes.js — a rank-C fitter costs a fifth of what a rank-C
player earns, times the outfit's cut.

- L? · `import { shipFx } from "./ship.js";` — through ship.js, not upgrades.js: upgrades imports sim, sim imports family,
  family imports this file, and that cycle leaves crewHooks in its temporal
  dead zone at load. ship.js is the designated leaf for exactly this —
  upgrades.js writes its own fx() into shipFx when it loads.
- L8 · `const WAGE_SHARE = 0.2;` — crew wage = rank pay × share
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../careers/complexes.js` | `COMPLEXES`, `RANK_LETTERS` | [js/careers/complexes.js](../careers/complexes.js.md) |
| 2 | `../flight/ship.js` | `shipFx` | [js/flight/ship.js](../flight/ship.js.md) |
| 3 | `../npc/cradle.js` | `cradle`, `drawnTo`, `ensureIdentity`, `generateNPC`, `genomeOf` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 4 | `../corp/gdb.js` | `file` as `gdbFile` | [js/corp/gdb.js](../corp/gdb.js.md) |
| 5 | `../genome/spacer.js` | `genomeCompat`, `kinship`, `KIN_BLOCK`, `kinLabel` | [js/genome/spacer.js](../genome/spacer.js.md) |

## Imported by

- [js/aria/company.js](../aria/company.js.md) — `crew`, `stationRoster`, `hireCrew`, `hireTerms`, `dismissCrew`, `crewWageTotal`, `wageFor`, `CYCLE_SECONDS`
- [js/aria/play.js](../aria/play.js.md) — `crew`
- [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md) — `genderMark`
- [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md) — `crew`, `firstName`, `genderMark`, `relatedTo`
- [js/console/panels/crew.js](../console/panels/crew.js.md) — `crew`, `crewWageTotal`, `firstName`, `genderMark`
- [js/corp/company.js](../corp/company.js.md) — `wageFor`, `CYCLE_SECONDS`
- [js/corp/fleet.js](../corp/fleet.js.md) — `CYCLE_SECONDS`
- [js/crew/beats.js](beats.js.md) — `crew`, `crewHooks`, `firstName`
- [js/crew/bonds.js](bonds.js.md) — `crew`, `crewHooks`, `compat`, `crewNote`, `rapportBetween`, `firstName`
- [js/crew/captive.js](captive.js.md) — `crew`, `crewHooks`, `crewNote`, `wageFor`
- [js/crew/children.js](children.js.md) — `crew`, `firstName`
- [js/crew/childtalk.js](childtalk.js.md) — `crew`, `crewHooks`, `firstName`, `CYCLE_SECONDS`
- [js/crew/deckacts.js](deckacts.js.md) — `firstName`, `rapportBetween`
- [js/crew/deckmind.js](deckmind.js.md) — `crew`, `crewHooks`, `rapportBetween`
- [js/crew/duties.js](duties.js.md) — `crew`, `crewHooks`, `crewNote`
- [js/crew/family.js](family.js.md) — `crew`, `crewHooks`, `rapportBetween`
- [js/crew/hull.js](hull.js.md) — `crew`, `crewNote`
- [js/crew/orders.js](orders.js.md) — `crew`, `firstName`, `rapportBetween`
- [js/crew/robots.js](robots.js.md) — `crew`
- [js/crew/robotyard.js](robotyard.js.md) — `crew`
- [js/crew/romance.js](romance.js.md) — `crew`, `crewNote`, `firstName`, `rapportBetween`
- [js/crew/roster.js](roster.js.md) — `crew`
- [js/crew/talk-threads.js](talk-threads.js.md) — `crew`, `crewHooks`, `firstName`, `rapportBetween`
- [js/crew/talk-trees.js](talk-trees.js.md) — `firstName`, `rapportBetween`
- [js/crew/talk-wants.js](talk-wants.js.md) — `crew`, `firstName`, `relatedTo`
- [js/crew/talk.js](talk.js.md) — `crew`, `crewHooks`, `firstName`, `rapportBetween`
- [js/crew/talkview.js](talkview.js.md) — `crew`, `bondLine`
- [js/crew/tiers.js](tiers.js.md) — `crew`, `rapportBetween`
- [js/economy/icework.js](../economy/icework.js.md) — `crew`
- [js/interior/boarding.js](../interior/boarding.js.md) — `crew`
- [js/interior/interior.js](../interior/interior.js.md) — `crew`, `dismissCrew`
- [js/npc/bounty.js](../npc/bounty.js.md) — `crew`, `crewHooks`
- [js/npc/captain.js](../npc/captain.js.md) — `crew`
- [js/npc/crewfx.js](../npc/crewfx.js.md) — `crew`
- [js/npc/npccrew.js](../npc/npccrew.js.md) — `crew`, `crewHooks`, `CYCLE_SECONDS`
- [js/sim/sim.js](../sim/sim.js.md) — `crew`, `crewHooks`, `resetCrew`, `tickCrew`
- [js/station/deckhall.js](../station/deckhall.js.md) — `crew`, `crewWageTotal`, `hireCrew`, `hireTerms`, `stationRoster`, `wageFor`
- [js/station/staffline.js](../station/staffline.js.md) — `CYCLE_SECONDS`
- [js/station/stationdeck.js](../station/stationdeck.js.md) — `crew`
- [js/ui/tutorial.js](../ui/tutorial.js.md) — `crew`
- [js/world/events/atmoworks.js](../world/events/atmoworks.js.md) — `crew`
- test/ariabiz.test.mjs _(outside js/)_ — `crew`, `crewWageTotal`, `stationRoster`, `resetCrew`, `CYCLE_SECONDS`
- test/ariaplay.test.mjs _(outside js/)_ — `resetCrew`, `crew`
- test/beats.test.mjs _(outside js/)_ — `crew`, `hireCrew`, `stationRoster`, `dismissCrew`, `resetCrew`
- test/board.test.mjs _(outside js/)_ — `crew`, `hireCrew`, `stationRoster`, `CYCLE_SECONDS`
- test/bounty.test.mjs _(outside js/)_ — `crew`, `hireCrew`, `stationRoster`, `tickCrew`, `CYCLE_SECONDS`
- test/childtalk.test.mjs _(outside js/)_ — `crew`, `crewHooks`, `hireCrew`, `stationRoster`, `CYCLE_SECONDS`, `firstName`
- test/converse.test.mjs _(outside js/)_ — `crew`, `hireCrew`, `stationRoster`, `crewHooks`
- test/crew-life.test.mjs _(outside js/)_ — `crew`, `hireCrew`, `stationRoster`, `tickCrew`, `CYCLE_SECONDS`, `crewWageTotal`, `crewHooks`, `resetCrew`
- test/gdb.test.mjs _(outside js/)_ — `crew`, `hireCrew`, `stationRoster`, `dismissCrew`
- test/gender.test.mjs _(outside js/)_ — `genderMark`, `pronounOf`
- test/genome.test.mjs _(outside js/)_ — `crew`, `hireCrew`, `stationRoster`, `tickCrew`, `compat`, `relatedTo`, `CYCLE_SECONDS`
- test/line.test.mjs _(outside js/)_ — `crew`, `hireCrew`, `stationRoster`, `CYCLE_SECONDS`
- test/orders.test.mjs _(outside js/)_ — `crew`, `hireCrew`, `stationRoster`, `rapportBetween`
- test/people.test.mjs _(outside js/)_ — `crew`, `hireCrew`, `stationRoster`, `CYCLE_SECONDS`, `tickCrew`
- test/robots.test.mjs _(outside js/)_ — `crew`, `crewWageTotal`, `tickCrew`, `CYCLE_SECONDS`, `stationRoster`, `hireCrew`
- test/skycrew.test.mjs _(outside js/)_ — `crew`, `hireCrew`, `stationRoster`, `tickCrew`, `crewHooks`, `CYCLE_SECONDS`
- test/stafflife.test.mjs _(outside js/)_ — `crew`, `hireCrew`, `stationRoster`, `CYCLE_SECONDS`
- test/systems.test.mjs _(outside js/)_ — `crew`, `hireCrew`, `stationRoster`, `CYCLE_SECONDS`
- addon/adult/index.js _(outside js/)_ — `firstName`, `crewNote`
- addon/adult/trees.js _(outside js/)_ — `firstName`

## Exports

- [`CYCLE_SECONDS`](#s-CYCLE_SECONDS) · const — used by [js/aria/company.js](../aria/company.js.md), [js/corp/company.js](../corp/company.js.md), [js/corp/fleet.js](../corp/fleet.js.md), [js/crew/childtalk.js](childtalk.js.md), [js/npc/npccrew.js](../npc/npccrew.js.md), [js/station/staffline.js](../station/staffline.js.md), test/ariabiz.test.mjs, test/board.test.mjs, test/bounty.test.mjs, test/childtalk.test.mjs, test/crew-life.test.mjs, test/genome.test.mjs, test/line.test.mjs, test/people.test.mjs, test/robots.test.mjs, test/skycrew.test.mjs, test/stafflife.test.mjs, test/systems.test.mjs
- [`wageFor`](#s-wageFor) · function — used by [js/aria/company.js](../aria/company.js.md), [js/corp/company.js](../corp/company.js.md), [js/crew/captive.js](captive.js.md), [js/station/deckhall.js](../station/deckhall.js.md)
- [`stationRoster`](#s-stationRoster) · function — used by [js/aria/company.js](../aria/company.js.md), [js/station/deckhall.js](../station/deckhall.js.md), test/ariabiz.test.mjs, test/beats.test.mjs, test/board.test.mjs, test/bounty.test.mjs, test/childtalk.test.mjs, test/converse.test.mjs, test/crew-life.test.mjs, test/gdb.test.mjs, test/genome.test.mjs, test/line.test.mjs, test/orders.test.mjs, test/people.test.mjs, test/robots.test.mjs, test/skycrew.test.mjs, test/stafflife.test.mjs, test/systems.test.mjs
- [`crewHooks`](#s-crewHooks) · const — used by [js/crew/beats.js](beats.js.md), [js/crew/bonds.js](bonds.js.md), [js/crew/captive.js](captive.js.md), [js/crew/childtalk.js](childtalk.js.md), [js/crew/deckmind.js](deckmind.js.md), [js/crew/duties.js](duties.js.md), [js/crew/family.js](family.js.md), [js/crew/talk-threads.js](talk-threads.js.md), [js/crew/talk.js](talk.js.md), [js/npc/bounty.js](../npc/bounty.js.md), [js/npc/npccrew.js](../npc/npccrew.js.md), [js/sim/sim.js](../sim/sim.js.md), test/childtalk.test.mjs, test/converse.test.mjs, test/crew-life.test.mjs, test/skycrew.test.mjs
- [`crew`](#s-crew) · const — used by [js/aria/company.js](../aria/company.js.md), [js/aria/play.js](../aria/play.js.md), [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/beats.js](beats.js.md), [js/crew/bonds.js](bonds.js.md), [js/crew/captive.js](captive.js.md), [js/crew/children.js](children.js.md), [js/crew/childtalk.js](childtalk.js.md), [js/crew/deckmind.js](deckmind.js.md), [js/crew/duties.js](duties.js.md), [js/crew/family.js](family.js.md), [js/crew/hull.js](hull.js.md), [js/crew/orders.js](orders.js.md), [js/crew/robots.js](robots.js.md), [js/crew/robotyard.js](robotyard.js.md), [js/crew/romance.js](romance.js.md), [js/crew/roster.js](roster.js.md), [js/crew/talk-threads.js](talk-threads.js.md), [js/crew/talk-wants.js](talk-wants.js.md), [js/crew/talk.js](talk.js.md), [js/crew/talkview.js](talkview.js.md), [js/crew/tiers.js](tiers.js.md), [js/economy/icework.js](../economy/icework.js.md), [js/interior/boarding.js](../interior/boarding.js.md), [js/interior/interior.js](../interior/interior.js.md), [js/npc/bounty.js](../npc/bounty.js.md), [js/npc/captain.js](../npc/captain.js.md), [js/npc/crewfx.js](../npc/crewfx.js.md), [js/npc/npccrew.js](../npc/npccrew.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/deckhall.js](../station/deckhall.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md), [js/world/events/atmoworks.js](../world/events/atmoworks.js.md), test/ariabiz.test.mjs, test/ariaplay.test.mjs, test/beats.test.mjs, test/board.test.mjs, test/bounty.test.mjs, test/childtalk.test.mjs, test/converse.test.mjs, test/crew-life.test.mjs, test/gdb.test.mjs, test/genome.test.mjs, test/line.test.mjs, test/orders.test.mjs, test/people.test.mjs, test/robots.test.mjs, test/skycrew.test.mjs, test/stafflife.test.mjs, test/systems.test.mjs
- [`FIRST_HAND_WAGE`](#s-FIRST_HAND_WAGE) · const — **no importer in scanned roots**
- [`hireTerms`](#s-hireTerms) · function — used by [js/aria/company.js](../aria/company.js.md), [js/station/deckhall.js](../station/deckhall.js.md)
- [`crewWageTotal`](#s-crewWageTotal) · function — used by [js/aria/company.js](../aria/company.js.md), [js/console/panels/crew.js](../console/panels/crew.js.md), [js/station/deckhall.js](../station/deckhall.js.md), test/ariabiz.test.mjs, test/crew-life.test.mjs, test/robots.test.mjs
- [`firstName`](#s-firstName) · function — used by addon/adult/index.js, addon/adult/trees.js, [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/beats.js](beats.js.md), [js/crew/bonds.js](bonds.js.md), [js/crew/children.js](children.js.md), [js/crew/childtalk.js](childtalk.js.md), [js/crew/deckacts.js](deckacts.js.md), [js/crew/orders.js](orders.js.md), [js/crew/romance.js](romance.js.md), [js/crew/talk-threads.js](talk-threads.js.md), [js/crew/talk-trees.js](talk-trees.js.md), [js/crew/talk-wants.js](talk-wants.js.md), [js/crew/talk.js](talk.js.md), test/childtalk.test.mjs
- [`pronounOf`](#s-pronounOf) · function — used by test/gender.test.mjs
- [`genderMark`](#s-genderMark) · function — used by [js/console/panels/crew-brig.js](../console/panels/crew-brig.js.md), [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/console/panels/crew.js](../console/panels/crew.js.md), test/gender.test.mjs
- [`hireCrew`](#s-hireCrew) · function — used by [js/aria/company.js](../aria/company.js.md), [js/station/deckhall.js](../station/deckhall.js.md), test/beats.test.mjs, test/board.test.mjs, test/bounty.test.mjs, test/childtalk.test.mjs, test/converse.test.mjs, test/crew-life.test.mjs, test/gdb.test.mjs, test/genome.test.mjs, test/line.test.mjs, test/orders.test.mjs, test/people.test.mjs, test/robots.test.mjs, test/skycrew.test.mjs, test/stafflife.test.mjs, test/systems.test.mjs
- [`dismissCrew`](#s-dismissCrew) · function — used by [js/aria/company.js](../aria/company.js.md), [js/interior/interior.js](../interior/interior.js.md), test/beats.test.mjs, test/gdb.test.mjs
- [`forgetGenome`](#s-forgetGenome) · function — **no importer in scanned roots**
- [`compat`](#s-compat) · function — used by [js/crew/bonds.js](bonds.js.md), test/genome.test.mjs
- [`relatedTo`](#s-relatedTo) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/crew/talk-wants.js](talk-wants.js.md), test/genome.test.mjs
- [`kinLineBetween`](#s-kinLineBetween) · function — **no importer in scanned roots**
- [`rapportBetween`](#s-rapportBetween) · function — used by [js/crew/bonds.js](bonds.js.md), [js/crew/deckacts.js](deckacts.js.md), [js/crew/deckmind.js](deckmind.js.md), [js/crew/family.js](family.js.md), [js/crew/orders.js](orders.js.md), [js/crew/romance.js](romance.js.md), [js/crew/talk-threads.js](talk-threads.js.md), [js/crew/talk-trees.js](talk-trees.js.md), [js/crew/talk.js](talk.js.md), [js/crew/tiers.js](tiers.js.md), test/orders.test.mjs
- [`bondLine`](#s-bondLine) · function — used by [js/crew/talkview.js](talkview.js.md)
- [`tickCrew`](#s-tickCrew) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/bounty.test.mjs, test/crew-life.test.mjs, test/genome.test.mjs, test/people.test.mjs, test/robots.test.mjs, test/skycrew.test.mjs
- [`resetCrew`](#s-resetCrew) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/ariabiz.test.mjs, test/ariaplay.test.mjs, test/beats.test.mjs, test/crew-life.test.mjs
- [`crewNote`](#s-crewNote) · function — used by addon/adult/index.js, [js/crew/bonds.js](bonds.js.md), [js/crew/captive.js](captive.js.md), [js/crew/duties.js](duties.js.md), [js/crew/hull.js](hull.js.md), [js/crew/romance.js](romance.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-CYCLE_SECONDS"></a>`CYCLE_SECONDS`

const · **exported** · L7–7

<!-- note:CYCLE_SECONDS -->
<!-- /note -->

### <a id="s-WAGE_SHARE"></a>`WAGE_SHARE`

const · L8–8

<!-- note:WAGE_SHARE -->
<!-- /note -->

### <a id="s-mulberry"></a>`mulberry(seedStr)`

function · L10–20

- called by: [`stationRoster`](#s-stationRoster) · [`stepBonds`](#s-stepBonds) ×2

<!-- note:mulberry -->
<!-- /note -->

### <a id="s-wageFor"></a>`wageFor(complexId, letter)`

function · **exported** · L22–26

- called by: [`payOffAndRecord`](../corp/company.js.md#s-payOffAndRecord) _js/corp/company.js_ · [`restoreCompany`](../corp/company.js.md#s-restoreCompany) _js/corp/company.js_ · [`settleAsStaff`](../corp/company.js.md#s-settleAsStaff) _js/corp/company.js_ · [`staffIncome`](../corp/company.js.md#s-staffIncome) _js/corp/company.js_ · [`recruit`](captive.js.md#s-recruit) _js/crew/captive.js_ · [`candidateFrom`](#s-candidateFrom) · [`candidateFor`](../station/deckhall.js.md#s-candidateFor) _js/station/deckhall.js_

<!-- note:wageFor -->
<!-- /note -->

### <a id="s-stationRoster"></a>`stationRoster(station, restock=, sky=)`

function · **exported** · L28–55

- calls: [`file`](../corp/gdb.js.md#s-file) _js/corp/gdb.js_ · [`candidateFrom`](#s-candidateFrom) ×3 · [`mulberry`](#s-mulberry) · [`generateNPC`](../npc/cradle.js.md#s-generateNPC) _js/npc/cradle.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.pool`, `cradle.pool.sort`
- called by: [`considerHire`](../aria/company.js.md#s-considerHire) _js/aria/company.js_ · [`hallSection`](../station/deckhall.js.md#s-hallSection) _js/station/deckhall.js_

<!-- note:stationRoster -->
The hiring hall roster a station offers. Half the hall is people already in
the CRADLE pool — hands you dismissed, hands who walked — and the rest are
born here and filed. Deterministic per station+restock+sky.

- L32 · `const locals = cradle.pool((r) => r.station === station.id).sort((a, b) => (a.seed < b.see` — 0.3.54: the people who come back to a hall are the people who LIVE at
  this port — offered here before, or paid off here. It used to be the whole
  sky's pool, and every candidate any hall had ever shown went into it, so
  the first port's people turned up at every port after it. A drifter from
  elsewhere still walks in now and then (the hand you dismissed at Foundry
  Hold, turning up at Kessler Reach), one a hall at most.
- L33 · `const pool = [...locals, ...locals.filter((r) => r.status === "dismissed").flatMap((r) =>` — somebody you paid off HERE is looking for a berth, not just living here: they come back to the hall first
- L46 · `const letter = RANK_LETTERS[Math.min(4, Math.floor(rnd() * rnd() * 7))];` — stations mostly offer the working ranks
- L49 · `if (have && (have.status === "aboard" || have.status === "captain") && crew.aboard.some((m` — Someone born here before may already be aboard a ship, or already on
  this list. But "aboard" in the LEDGER is not the same as aboard THIS
  session — the CRADLE is shared through server.py and outlives a run, so
  a hall that trusted the flag thinned out a little more every time
  anybody played and eventually offered two people. Believe the flag only
  about hands who are actually on this ship.
- L51 · `const filed = have ?? gdbFile(rec, { kind: "hall", place: station.id, group: [...crew.aboa` — 0.3.54: into the GDB — a name nobody else has, and not one that looks
  like anybody already on this list or aboard your ship
<!-- /note -->

### <a id="s-candidateFrom"></a>`candidateFrom(rec)`

function · L57–82

- calls: [`wageFor`](#s-wageFor) · [`ensureIdentity`](../npc/cradle.js.md#s-ensureIdentity) _js/npc/cradle.js_
- called by: [`stationRoster`](#s-stationRoster) ×3

<!-- note:candidateFrom -->
A hiring-hall line item from a ledger record.

- L74 · `genome: rec.genome,` — the body travels with the candidate: the hiring hall shows what you can
  see, and deckmind reads the rest without another ledger lookup
<!-- /note -->

### <a id="s-crewHooks"></a>`crewHooks`

const · **exported** · L84–84

<!-- note:crewHooks -->
---- the ship's crew ----------------------------------------------------

family.js hangs the household off the pay cycle without a circular import;
bonds.js / duties.js / talk.js push into `cycle`; `reset` runs on resetCrew.
`always` runs on every sim tick whether or not the player has anybody
aboard — the rest of the sky has crews too (npc/npccrew.js), and they do
not stop existing because your berths are empty.
<!-- /note -->

### <a id="s-crew"></a>`crew`

const · **exported** · L86–93

<!-- note:crew -->
- L87 · `employer: null,` — the pilot's callsign, for the ledger
- L88 · `aboard: [],` — hired members
- L89 · `payPool: 0,` — seconds toward the next pay cycle
- L90 · `lastPay: null,` — { total, paid, shortfall }
- L92 · `hires: 0,` — lifetime signings this sky — the first one is cheap
<!-- /note -->

### <a id="s-FIRST_HAND_WAGE"></a>`FIRST_HAND_WAGE`

const · **exported** · L95–95

<!-- note:FIRST_HAND_WAGE -->
The first hand a new captain signs is on the entry rate: no signing bonus
and half wage for as long as they stay. Every complex runs the scheme; it
is how a one-seat skiff ever affords a second seat.
<!-- /note -->

### <a id="s-hireTerms"></a>`hireTerms(candidate)`

function · **exported** · L97–101

- called by: [`considerHire`](../aria/company.js.md#s-considerHire) _js/aria/company.js_ · [`wageOf`](../aria/company.js.md#s-wageOf) _js/aria/company.js_ · [`hireCrew`](#s-hireCrew) · [`hallSection`](../station/deckhall.js.md#s-hallSection) _js/station/deckhall.js_

<!-- note:hireTerms -->
What signing this candidate would actually cost: { bonus, wage, firstHand }.
<!-- /note -->

### <a id="s-note"></a>`note(msg)`

function · L103–106

- called by: [`crewNote`](#s-crewNote) · [`dismissCrew`](#s-dismissCrew) · [`hireCrew`](#s-hireCrew) · [`partingWords`](#s-partingWords) · [`stepBonds`](#s-stepBonds) ×2 · [`tickCrew`](#s-tickCrew) ×2

<!-- note:note -->
<!-- /note -->

### <a id="s-crewWageTotal"></a>`crewWageTotal()`

function · **exported** · L108–111

- via [js/flight/ship.js](../flight/ship.js.md): `shipFx.fx`
- called by: [`bizReport`](../aria/company.js.md#s-bizReport) _js/aria/company.js_ · [`considerHire`](../aria/company.js.md#s-considerHire) _js/aria/company.js_ · [`considerLayoff`](../aria/company.js.md#s-considerLayoff) _js/aria/company.js_ · [`payrollPerMin`](../aria/company.js.md#s-payrollPerMin) _js/aria/company.js_ · [`mountRoster`](../console/panels/crew.js.md#s-mountRoster) _js/console/panels/crew.js_ · [`tickCrew`](#s-tickCrew) · [`crewSection`](../station/deckhall.js.md#s-crewSection) _js/station/deckhall.js_

<!-- note:crewWageTotal -->
<!-- /note -->

### <a id="s-firstName"></a>`firstName(m)`

function · **exported** · L113–113

- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ ×2 · [`picker`](../console/panels/crew-gene.js.md#s-picker) _js/console/panels/crew-gene.js_ · [`recordCard`](../console/panels/crew-gene.js.md#s-recordCard) _js/console/panels/crew-gene.js_ · [`childCard`](../console/panels/crew.js.md#s-childCard) _js/console/panels/crew.js_ ×6 · [`mountBonds`](../console/panels/crew.js.md#s-mountBonds) _js/console/panels/crew.js_ ×5 · [`mountTalkSub`](../console/panels/crew.js.md#s-mountTalkSub) _js/console/panels/crew.js_ · [`rosterCard`](../console/panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_ · [`Q`](beats.js.md#s-Q) _js/crew/beats.js_ · [`playBeat>finish`](beats.js.md#s-playBeat-finish) _js/crew/beats.js_ · [`who`](beats.js.md#s-who) _js/crew/beats.js_ · [`bondFactor>has`](bonds.js.md#s-bondFactor-has) _js/crew/bonds.js_ · [`tickBonds`](bonds.js.md#s-tickBonds) _js/crew/bonds.js_ ×4 · [`raise`](children.js.md#s-raise) _js/crew/children.js_ · [`CHILD_TOPICS.run~3`](childtalk.js.md#s-CHILD_TOPICS-run-3) _js/crew/childtalk.js_ ×7 · [`answerChild`](childtalk.js.md#s-answerChild) _js/crew/childtalk.js_ · [`momentFor`](childtalk.js.md#s-momentFor) _js/crew/childtalk.js_ ×2 · [`tickChildren`](childtalk.js.md#s-tickChildren) _js/crew/childtalk.js_ · [`ACTIONS.note`](deckacts.js.md#s-ACTIONS-note) _js/crew/deckacts.js_ · [`ACTIONS.note~10`](deckacts.js.md#s-ACTIONS-note-10) _js/crew/deckacts.js_ · [`ACTIONS.note~11`](deckacts.js.md#s-ACTIONS-note-11) _js/crew/deckacts.js_ · [`ACTIONS.note~2`](deckacts.js.md#s-ACTIONS-note-2) _js/crew/deckacts.js_ · [`ACTIONS.note~3`](deckacts.js.md#s-ACTIONS-note-3) _js/crew/deckacts.js_ · [`ACTIONS.note~4`](deckacts.js.md#s-ACTIONS-note-4) _js/crew/deckacts.js_ · [`ACTIONS.note~5`](deckacts.js.md#s-ACTIONS-note-5) _js/crew/deckacts.js_ ×2 · [`ACTIONS.note~6`](deckacts.js.md#s-ACTIONS-note-6) _js/crew/deckacts.js_ · [`ACTIONS.note~7`](deckacts.js.md#s-ACTIONS-note-7) _js/crew/deckacts.js_ ×2 · [`ACTIONS.note~8`](deckacts.js.md#s-ACTIONS-note-8) _js/crew/deckacts.js_ ×2 · [`ACTIONS.note~9`](deckacts.js.md#s-ACTIONS-note-9) _js/crew/deckacts.js_ · [`applyAction`](deckacts.js.md#s-applyAction) _js/crew/deckacts.js_ ×2 · [`applyRomance`](deckacts.js.md#s-applyRomance) _js/crew/deckacts.js_ ×2 · [`coachHabit`](orders.js.md#s-coachHabit) _js/crew/orders.js_ · [`giveOrder`](orders.js.md#s-giveOrder) _js/crew/orders.js_ · [`grievanceCauses`](orders.js.md#s-grievanceCauses) _js/crew/orders.js_ · [`orderFor`](orders.js.md#s-orderFor) _js/crew/orders.js_ ×3 · [`LINES.bonded`](romance.js.md#s-LINES-bonded) _js/crew/romance.js_ ×2 · [`LINES.courting`](romance.js.md#s-LINES-courting) _js/crew/romance.js_ ×2 · [`LINES.interested`](romance.js.md#s-LINES-interested) _js/crew/romance.js_ ×2 · [`LINES.noticed`](romance.js.md#s-LINES-noticed) _js/crew/romance.js_ ×2 · [`LINES.together`](romance.js.md#s-LINES-together) _js/crew/romance.js_ ×2 · [`actOnJealousy`](romance.js.md#s-actOnJealousy) _js/crew/romance.js_ ×3 · [`breakOff`](romance.js.md#s-breakOff) _js/crew/romance.js_ ×2 · [`ladderLine`](romance.js.md#s-ladderLine) _js/crew/romance.js_ ×6 · [`THREADS.label`](talk-threads.js.md#s-THREADS-label) _js/crew/talk-threads.js_ · [`THREADS.label~2`](talk-threads.js.md#s-THREADS-label-2) _js/crew/talk-threads.js_ · [`THREADS.say~14`](talk-threads.js.md#s-THREADS-say-14) _js/crew/talk-threads.js_ · [`THREADS.say~2`](talk-threads.js.md#s-THREADS-say-2) _js/crew/talk-threads.js_ · [`THREADS.say~9`](talk-threads.js.md#s-THREADS-say-9) _js/crew/talk-threads.js_ · [`TREE.label`](talk-trees.js.md#s-TREE-label) _js/crew/talk-trees.js_ · [`TREE.say~13`](talk-trees.js.md#s-TREE-say-13) _js/crew/talk-trees.js_ · [`TREE.say~7`](talk-trees.js.md#s-TREE-say-7) _js/crew/talk-trees.js_ · [`TREE.say~8`](talk-trees.js.md#s-TREE-say-8) _js/crew/talk-trees.js_ ×2 · [`WANT_TOPICS.reply~3`](talk-wants.js.md#s-WANT_TOPICS-reply-3) _js/crew/talk-wants.js_ · [`answerFreeText`](talk.js.md#s-answerFreeText) _js/crew/talk.js_ · [`greet`](talk.js.md#s-greet) _js/crew/talk.js_ ×2 · [`talkContext`](talk.js.md#s-talkContext) _js/crew/talk.js_

<!-- note:firstName -->
First-name shorthand used across the crew modules.
<!-- /note -->

### <a id="s-pronounOf"></a>`pronounOf(m)`

function · **exported** · L115–115

- called by: [`genderMark`](#s-genderMark)

<!-- note:pronounOf -->
The gender mark.

Every generator in the game has had gender on the record earlier and the
measured split has been right earlier too, and it still played as a sky
full of men — because two places in the whole UI ever printed it (the
hiring hall and the talk sub-line) and everywhere else a person was a name
in an invented tongue with nothing beside it. A reader with no ear for the
tongue fills that blank in with the default, and the default is male.

So this is deliberately terse and deliberately everywhere: "she/her",
"he/him", "they/them" appended to the line that already carries a person's
rank and trade. Cheap to read, impossible to miss, and it costs a roster
row eight characters.
<!-- /note -->

### <a id="s-genderMark"></a>`genderMark(m, sep=)`

function · **exported** · L117–117

- calls: [`pronounOf`](#s-pronounOf)
- called by: [`captiveCard`](../console/panels/crew-brig.js.md#s-captiveCard) _js/console/panels/crew-brig.js_ · [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ · [`rosterCard`](../console/panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_

<!-- note:genderMark -->
The same thing as a suffix you can concatenate onto an existing hint.
<!-- /note -->

### <a id="s-hireCrew"></a>`hireCrew(candidate, ship, capacity)`

function · **exported** · L119–137

- calls: [`hireTerms`](#s-hireTerms) · [`note`](#s-note)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`considerHire`](../aria/company.js.md#s-considerHire) _js/aria/company.js_ · [`floorSection`](../station/deckhall.js.md#s-floorSection) _js/station/deckhall.js_ · [`hallSection`](../station/deckhall.js.md#s-hallSection) _js/station/deckhall.js_

<!-- note:hireCrew -->
<!-- /note -->

### <a id="s-dismissCrew"></a>`dismissCrew(id)`

function · **exported** · L139–145

- calls: [`fileDeparture`](#s-fileDeparture) · [`note`](#s-note)
- called by: [`considerLayoff`](../aria/company.js.md#s-considerLayoff) _js/aria/company.js_ · [`paintDialogue.run~3`](../interior/interior.js.md#s-paintDialogue-run-3) _js/interior/interior.js_

<!-- note:dismissCrew -->
<!-- /note -->

### <a id="s-fileDeparture"></a>`fileDeparture(m, status, text)`

function · L147–157

- calls: [`partingWords`](#s-partingWords)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`dismissCrew`](#s-dismissCrew) · [`resetCrew`](#s-resetCrew) · [`tickCrew`](#s-tickCrew)

<!-- note:fileDeparture -->
- L153 · `const port = crewHooks.port?.() ?? null;` — 0.3.54: they live where you left them — that port's hall is where they come back
<!-- /note -->

### <a id="s-_genomeCache"></a>`_genomeCache`

const · L159–159

<!-- note:_genomeCache -->
---- life aboard ----------------------------------------------------------
Crew who share a deck get to know each other: a rapport number per pair
that grows every cycle, faster when temperaments fit. When two people are
drawn to each other and the rapport is there, it becomes a relationship —
any pairing, when the interest is mutual. Partners keep each other's
morale up; losing one hurts. None of it needs the player; all of it shows
on the crew sheet and the deck.

Genomes are decoded once per pair and kept — compat runs for every pair,
every cycle, and unpacking 178 characters each time would show up on a phone.
<!-- /note -->

### <a id="s-genomeFor"></a>`genomeFor(m)`

function · L160–167

- calls: [`genomeOf`](../npc/cradle.js.md#s-genomeOf) _js/npc/cradle.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`compat`](#s-compat) ×2 · [`relatedTo`](#s-relatedTo) ×2

<!-- note:genomeFor -->
<!-- /note -->

### <a id="s-forgetGenome"></a>`forgetGenome(id)`

function · **exported** · L168–168

- called by: [`resetCrew`](#s-resetCrew)

<!-- note:forgetGenome -->
<!-- /note -->

### <a id="s-compat"></a>`compat(a, b)`

function · **exported** · L170–179

- calls: [`compat>d`](#s-compat-d) ×3 · [`genomeFor`](#s-genomeFor) ×2 · [`genomeCompat`](../genome/spacer.js.md#s-genomeCompat) _js/genome/spacer.js_
- called by: [`tickBonds`](bonds.js.md#s-tickBonds) _js/crew/bonds.js_ · [`stepBonds`](#s-stepBonds)

<!-- note:compat -->
Temperament fit, −5…+5. Exported for bonds.js's rivalry roll.

The five rounded axes were always a summary of something with more in it.
Where both people have a genome on file the real comparison runs — shared
idea of a favour owed, opposite clocks, two dominants in one passage — and
the axes are folded in behind it. Where one does not (an old save, a
candidate mid-import) the original formula stands on its own, unchanged.

- L174 · `if ((ta.greed ?? 0) > 0.7 && (tb.greed ?? 0) > 0.7) c -= 3;` — two sharks, one hold
<!-- /note -->

#### <a id="s-compat-d"></a>`compat>d(k)`

function · L172–172

- called by: [`compat`](#s-compat) ×3

<!-- note:compat>d -->
<!-- /note -->

### <a id="s-relatedTo"></a>`relatedTo(a, b)`

function · **exported** · L181–184

- calls: [`genomeFor`](#s-genomeFor) ×2 · [`kinship`](../genome/spacer.js.md#s-kinship) _js/genome/spacer.js_
- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ · [`kinLineBetween`](#s-kinLineBetween) · [`stepBonds`](#s-stepBonds) · [`WANT_TOPICS.say~3`](talk-wants.js.md#s-WANT_TOPICS-say-3) _js/crew/talk-wants.js_ ×2 · [`WANT_TOPICS.when~3`](talk-wants.js.md#s-WANT_TOPICS-when-3) _js/crew/talk-wants.js_

<!-- note:relatedTo -->
Coefficient of relationship between two people aboard. 0.5 is a full sibling.
<!-- /note -->

### <a id="s-kinLineBetween"></a>`kinLineBetween(a, b)`

function · **exported** · L186–186

- calls: [`relatedTo`](#s-relatedTo) · [`kinLabel`](../genome/spacer.js.md#s-kinLabel) _js/genome/spacer.js_

<!-- note:kinLineBetween -->
"half-sibling or closer", for the crew sheet and the talk trees.
<!-- /note -->

### <a id="s-rapportBetween"></a>`rapportBetween(a, b)`

function · **exported** · L188–190

- called by: [`bondsReport`](bonds.js.md#s-bondsReport) _js/crew/bonds.js_ · [`tickBonds`](bonds.js.md#s-tickBonds) _js/crew/bonds.js_ · [`tieBetween`](bonds.js.md#s-tieBetween) _js/crew/bonds.js_ · [`tiesOf`](bonds.js.md#s-tiesOf) _js/crew/bonds.js_ · [`applyAction`](deckacts.js.md#s-applyAction) _js/crew/deckacts.js_ ×3 · [`buildContext`](deckmind.js.md#s-buildContext) _js/crew/deckmind.js_ · [`crewTopics.run~6`](family.js.md#s-crewTopics-run-6) _js/crew/family.js_ · [`bondLine`](#s-bondLine) · [`bestMate`](orders.js.md#s-bestMate) _js/crew/orders.js_ · [`focusEntry`](orders.js.md#s-focusEntry) _js/crew/orders.js_ · [`attraction`](romance.js.md#s-attraction) _js/crew/romance.js_ · [`THREADS.say~14`](talk-threads.js.md#s-THREADS-say-14) _js/crew/talk-threads.js_ · [`TREE.say~13`](talk-trees.js.md#s-TREE-say-13) _js/crew/talk-trees.js_ · [`friendTierBetween`](tiers.js.md#s-friendTierBetween) _js/crew/tiers.js_

<!-- note:rapportBetween -->
<!-- /note -->

### <a id="s-bondLine"></a>`bondLine(m)`

function · **exported** · L192–204

- calls: [`rapportBetween`](#s-rapportBetween)
- called by: [`subLine`](talkview.js.md#s-subLine) _js/crew/talkview.js_

<!-- note:bondLine -->
"with Marn Voss" / "close with Marn Voss" / "" — the crew sheet tag.
<!-- /note -->

### <a id="s-stepBonds"></a>`stepBonds()`

function · L206–242

- calls: [`compat`](#s-compat) · [`mulberry`](#s-mulberry) ×2 · [`note`](#s-note) ×2 · [`relatedTo`](#s-relatedTo) · [`drawnTo`](../npc/cradle.js.md#s-drawnTo) _js/npc/cradle.js_ ×2
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`tickCrew`](#s-tickCrew)

<!-- note:stepBonds -->
- L215 · `if (a.robot || b.robot) continue;` — a machine keeps rapport — it can be a friend — but never pairs off
- L216 · `if (relatedTo(a, b) >= KIN_BLOCK) continue;` — the ledger knows who is whose: siblings and parents do not pair off,
  whatever the rapport number says
- L228 · `for (const m of list) {` — partners hold each other up — and a rough patch can end it
- L230 · `if (m.partner === "player") { m.morale = Math.min(100, m.morale + 3); continue; }` — the captain: family.js runs that one
<!-- /note -->

### <a id="s-partingWords"></a>`partingWords(m)`

function · L244–255

- calls: [`note`](#s-note)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`fileDeparture`](#s-fileDeparture)

<!-- note:partingWords -->
Someone leaving takes a piece of whoever they were with.
<!-- /note -->

### <a id="s-tickCrew"></a>`tickCrew(seconds, ship)`

function · **exported** · L257–290

- calls: [`crewWageTotal`](#s-crewWageTotal) · [`fileDeparture`](#s-fileDeparture) · [`note`](#s-note) ×2 · [`stepBonds`](#s-stepBonds)

<!-- note:tickCrew -->
Called from the sim tick with scaled seconds. Pays wages every cycle.

- L267 · `if (m.robot) continue;` — no wage, no morale, no walking off — robots.js keeps their condition
- L282 · `for (const m of [...crew.aboard]) {` — the ones done waiting
<!-- /note -->

### <a id="s-resetCrew"></a>`resetCrew()`

function · **exported** · L292–306

- calls: [`fileDeparture`](#s-fileDeparture) · [`forgetGenome`](#s-forgetGenome)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.all`, `cradle.put`
- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:resetCrew -->
- L293 · `` for (const m of crew.aboard) fileDeparture(m, "pool", `Paid off when ${crew.employer ?? "t `` — a new sky is a new ship: whoever this pilot had aboard goes back to the pool with a line in the record
- L305 · `for (const fn of crewHooks.reset) { try { fn(); } catch {` — a module's own reset
<!-- /note -->

### <a id="s-crewNote"></a>`crewNote(msg)`

function · **exported** · L308–310

- calls: [`note`](#s-note)
- called by: [`tickBonds`](bonds.js.md#s-tickBonds) _js/crew/bonds.js_ ×2 · [`recruit`](captive.js.md#s-recruit) _js/crew/captive.js_ · [`tryEscape`](captive.js.md#s-tryEscape) _js/crew/captive.js_ · [`tickDutiesCycle`](duties.js.md#s-tickDutiesCycle) _js/crew/duties.js_ · [`playerHull.note`](hull.js.md#s-playerHull-note) _js/crew/hull.js_ · [`actOnJealousy`](romance.js.md#s-actOnJealousy) _js/crew/romance.js_ · [`breakOff`](romance.js.md#s-breakOff) _js/crew/romance.js_ · [`setStage`](romance.js.md#s-setStage) _js/crew/romance.js_ · [`tryConceive`](romance.js.md#s-tryConceive) _js/crew/romance.js_

<!-- note:crewNote -->
Append a line to the crew log (bonds/duties/talk share the same book).
<!-- /note -->
