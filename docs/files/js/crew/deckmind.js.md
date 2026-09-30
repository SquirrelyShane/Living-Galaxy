# js/crew/deckmind.js

[index](../../../README.md) · 445 lines · 25 symbols · 14 imports · 10 importers

## About

<!-- note:@file -->
Living Galaxy — DECKMIND: the loop that runs a hand's own life.

Once a pay cycle, every person aboard observes the hull, weighs what they
need against what they are for, walks the deck graph to a decision, and
lives with the result. Nothing here is narrated after the fact: the record
is written FROM the decision — the trace the graph left, the deltas that
were actually applied, the diff of the hull before and after — so the
journal cannot drift from what happened.

What the crew system already had stays exactly where it was. duties.js
still moves wear every two seconds, crew.js still steps rapport and pays
wages, bonds.js still rolls rivalries. Deckmind sits on the same cycle hook
and adds the part that was missing: a person choosing, for reasons, and
that choice mattering to the hull and to the people in the room.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../genome/behavior-graph.js` | `decide`, `explainTrace` | [js/genome/behavior-graph.js](../genome/behavior-graph.js.md) |
| 2 | `./deckgraph.js` | `deckGraph`, `ACTION_META` | [js/crew/deckgraph.js](deckgraph.js.md) |
| 3 | `../genome/spacer.js` | `SPACER`, `SYNTH`, `createSpacer`, `packGenome`, `unpackGenome`, `fingerprint`, `capabilities`, `phenotype`, `createContext`, `genomeTraits`, `skillAptitude`, `expectedLifespan` | [js/genome/spacer.js](../genome/spacer.js.md) |
| 4 | `./ledger.js` | `crew`, `crewHooks`, `rapportBetween` | [js/crew/ledger.js](ledger.js.md) |
| 5 | `../npc/cradle.js` | `cradle`, `drawnTo` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 6 | `./family.js` | `adjustMorale`, `trustOf`, `social` **unused**, `loadSocial`, `household` | [js/crew/family.js](family.js.md) |
| 7 | `./bonds.js` | `tieBetween` | [js/crew/bonds.js](bonds.js.md) |
| 8 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 9 | `../npc/captain.js` | `captain` | [js/npc/captain.js](../npc/captain.js.md) |
| 10 | `./hull.js` | `playerHull` | [js/crew/hull.js](hull.js.md) |
| 11 | `./journal.js` | `fileRecord`, `diffOf`, `r3`, `writeSummary` | [js/crew/journal.js](journal.js.md) |
| 12 | `./learn.js` | `learnFromRecord`, `forgetBrain` | [js/crew/learn.js](learn.js.md) |
| 13 | `./romance.js` | `courtingTarget`, `stageOf`, `pairOf`, `attraction`, `canPropose`, `canBond`, `canHavePrivacy`, `triangleFor`, `forgetRomanceGenome`, `resetRomance`, `moment` | [js/crew/romance.js](romance.js.md) |
| 17 | `./deckacts.js` | `ACTIONS`, `NEED_KEYS`, `applyAction` | [js/crew/deckacts.js](deckacts.js.md) |
| 445 | `./deckacts.js` | re-export `ACTIONS`, `NEED_KEYS`, `applyAction` | [js/crew/deckacts.js](deckacts.js.md) |

## Imported by

- [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md) — `bodyOf`, `needsOf`, `buildContext`
- [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md) — `deckmind`
- [js/crew/captive.js](captive.js.md) — `bodyOf`
- [js/crew/orders.js](orders.js.md) — `deckmind`, `buildContext`, `stepHand`, `bodyOf`
- [js/main.js](../main.js.md) — _side effect_
- [js/npc/bounty.js](../npc/bounty.js.md) — `bodyOf`
- [js/npc/npccrew.js](../npc/npccrew.js.md) — `stepWatch`, `needsOf`, `forgetBody`
- test/genome.test.mjs _(outside js/)_ — `deckmind`, `runDeckCycle`, `stepHand`, `buildContext`, `bodyOf`, `ACTIONS`, `NEED_KEYS`, `deckReport`
- test/orders.test.mjs _(outside js/)_ — `DM`
- test/skycrew.test.mjs _(outside js/)_ — `buildContext`, `stepHand`, `stepWatch`, `runDeckCycle`, `bodyOf`

## Exports

- [`deckmind`](#s-deckmind) · const — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/crew/orders.js](orders.js.md), test/genome.test.mjs
- [`bodyOf`](#s-bodyOf) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/crew/captive.js](captive.js.md), [js/crew/orders.js](orders.js.md), [js/npc/bounty.js](../npc/bounty.js.md), test/genome.test.mjs, test/skycrew.test.mjs
- [`forgetBody`](#s-forgetBody) · function — used by [js/npc/npccrew.js](../npc/npccrew.js.md)
- [`clearBodies`](#s-clearBodies) · function — **no importer in scanned roots**
- [`needsOf`](#s-needsOf) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/npc/npccrew.js](../npc/npccrew.js.md)
- [`HEARD`](#s-HEARD) · const — **no importer in scanned roots**
- [`computedNeeds`](#s-computedNeeds) · function — **no importer in scanned roots**
- [`buildContext`](#s-buildContext) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/crew/orders.js](orders.js.md), test/genome.test.mjs, test/skycrew.test.mjs
- [`stepHand`](#s-stepHand) · function — used by [js/crew/orders.js](orders.js.md), test/genome.test.mjs, test/skycrew.test.mjs
- [`runDeckCycle`](#s-runDeckCycle) · function — used by test/genome.test.mjs, test/skycrew.test.mjs
- [`stepWatch`](#s-stepWatch) · function — used by [js/npc/npccrew.js](../npc/npccrew.js.md), test/skycrew.test.mjs
- [`deckReport`](#s-deckReport) · function — used by test/genome.test.mjs
- `ACTIONS` · from `./deckacts.js` — used by test/genome.test.mjs
- `NEED_KEYS` · from `./deckacts.js` — used by test/genome.test.mjs
- `applyAction` · from `./deckacts.js` — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-deckmind"></a>`deckmind`

const · **exported** · L19–24

<!-- note:deckmind -->
<!-- /note -->

### <a id="s-cache"></a>`cache`

const · L26–26

<!-- note:cache -->
---- genomes -------------------------------------------------------------

ledger id → { genome, typeId, caps, apt }. A decoded body is about a
kilobyte; with a crew on every hull in the sky that is worth a ceiling.
Insertion order is eviction order — the crews that were stepped most
recently are the ones at the end of the map.
<!-- /note -->

### <a id="s-BODY_CACHE_MAX"></a>`BODY_CACHE_MAX`

const · L27–27

<!-- note:BODY_CACHE_MAX -->
<!-- /note -->

### <a id="s-bodyOf"></a>`bodyOf(who)`

function · **exported** · L29–56

- calls: [`capabilities`](../genome/spacer.js.md#s-capabilities) _js/genome/spacer.js_ · [`createSpacer`](../genome/spacer.js.md#s-createSpacer) _js/genome/spacer.js_ · [`fingerprint`](../genome/spacer.js.md#s-fingerprint) _js/genome/spacer.js_ · [`genomeTraits`](../genome/spacer.js.md#s-genomeTraits) _js/genome/spacer.js_ · [`packGenome`](../genome/spacer.js.md#s-packGenome) _js/genome/spacer.js_ · [`skillAptitude`](../genome/spacer.js.md#s-skillAptitude) _js/genome/spacer.js_ · [`unpackGenome`](../genome/spacer.js.md#s-unpackGenome) _js/genome/spacer.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.put`
- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ · [`canRecruit`](captive.js.md#s-canRecruit) _js/crew/captive.js_ · [`captiveState`](captive.js.md#s-captiveState) _js/crew/captive.js_ · [`buildContext`](#s-buildContext) · [`ceilingOf`](orders.js.md#s-ceilingOf) _js/crew/orders.js_ · [`setTraining`](orders.js.md#s-setTraining) _js/crew/orders.js_ · [`captureStrength`](../npc/bounty.js.md#s-captureStrength) _js/npc/bounty.js_ · [`markStrength`](../npc/bounty.js.md#s-markStrength) _js/npc/bounty.js_

<!-- note:bodyOf -->
Everything about a person's body, built once and kept.
<!-- /note -->

### <a id="s-forgetBody"></a>`forgetBody(id)`

function · **exported** · L58–58

- calls: [`forgetBrain`](learn.js.md#s-forgetBrain) _js/crew/learn.js_ · [`forgetRomanceGenome`](romance.js.md#s-forgetRomanceGenome) _js/crew/romance.js_
- called by: [`resetNpcCrews`](../npc/npccrew.js.md#s-resetNpcCrews) _js/npc/npccrew.js_

<!-- note:forgetBody -->
Forget a cached body — call after a genome is replaced (breeding, import).
<!-- /note -->

### <a id="s-clearBodies"></a>`clearBodies()`

function · **exported** · L59–59

- calls: [`forgetBrain`](learn.js.md#s-forgetBrain) _js/crew/learn.js_ · [`forgetRomanceGenome`](romance.js.md#s-forgetRomanceGenome) _js/crew/romance.js_

<!-- note:clearBodies -->
<!-- /note -->

### <a id="s-RISE"></a>`RISE`

const · L61–64

<!-- note:RISE -->
---- needs ---------------------------------------------------------------
Nine numbers, 0..1, high = pressing. They rise on their own and come down
when something is done about them. They live on the member so the roster
and the talk trees can read them without going through here.
<!-- /note -->

### <a id="s-needsOf"></a>`needsOf(m)`

function · **exported** · L66–72

- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ ×2 · [`buildContext`](#s-buildContext) · [`driftNeeds`](#s-driftNeeds) · [`drift`](../npc/npccrew.js.md#s-drift) _js/npc/npccrew.js_

<!-- note:needsOf -->
<!-- /note -->

### <a id="s-clamp01"></a>`clamp01(v)`

function · L74–74

- called by: [`buildContext`](#s-buildContext) ×2 · [`computedNeeds`](#s-computedNeeds) ×2 · [`driftNeeds`](#s-driftNeeds) ×2 · [`stepHand`](#s-stepHand) ×3

<!-- note:clamp01 -->
<!-- /note -->

### <a id="s-HEARD"></a>`HEARD`

const · **exported** · L76–76

<!-- note:HEARD -->
0.3.53: a captain who sat down and HEARD a grievance buys this many watches
of it counting for less — the cause is still there, and it comes back.
<!-- /note -->

### <a id="s-computedNeeds"></a>`computedNeeds(m, st)`

function · **exported** · L78–86

- calls: [`clamp01`](#s-clamp01) ×2
- called by: [`buildContext`](#s-buildContext) · [`driftNeeds`](#s-driftNeeds)

<!-- note:computedNeeds -->
The two needs that are read off the world, not drifted: grievance and upkeep.

- L79 · `let grief = 0;` — a grievance is not a mood — it is owed wages, a rival on the same watch,
  or a hull nobody is maintaining. It is computed, not drifted.
- L80 · `if (st?.shortfall) grief += 0.6;` — unpaid wages are a grievance on their own
<!-- /note -->

### <a id="s-driftNeeds"></a>`driftNeeds(m, body, st)`

function · L88–110

- calls: [`clamp01`](#s-clamp01) ×2 · [`computedNeeds`](#s-computedNeeds) · [`needsOf`](#s-needsOf) · [`adjustMorale`](family.js.md#s-adjustMorale) _js/crew/family.js_
- called by: [`buildContext`](#s-buildContext)

<!-- note:driftNeeds -->
Needs drift up before the decision; genes set how fast for each person.

- L92 · `fatigue: RISE.fatigue * (1.35 - (g[138] ?? 0.5) * 0.7),` — FATIGUE_RESIST
- L93 · `hunger: RISE.hunger * (0.7 + (g[15] ?? 0.5) * 0.6),` — METAB_A
- L94 · `social: RISE.social * (0.5 + (g[20] ?? 0.5) * 1.1),` — SOCIAL
- L95 · `stress: RISE.stress * (0.6 + (g[66] ?? 0.5) * 0.9),` — CORTISOL
- L96 · `intimacy: RISE.intimacy * (0.4 + (g[70] ?? 0.5) * 1.2),` — OXYTOCIN
- L97 · `play: RISE.play * (0.5 + (g[174] ?? 0.5) * 1.1),` — PLAY_DRIVE
- L98 · `purpose: RISE.purpose * (0.5 + (g[19] ?? 0.5) * 1.1) * (m.trainFocus ? 0.7 : 1),` — CURIOSITY; a goal slows it (0.3.53)
- L100 · `for (const k of NEED_KEYS) {` — Saturating rise. A need that nothing is being done about climbs toward 1
  and never quite reaches it, which keeps a gradient for the graph to weigh
  — a pinned need is a need that can no longer lose an argument.
- L106 · `let starved = 0;` — A need nobody can meet is not free. Someone with no one to be close to,
  or nothing worth doing, comes off the watch a little worse each cycle —
  this is what makes a full berth list and a dull run show up in morale
  before it shows up in a walkout.
<!-- /note -->

### <a id="s-buildContext"></a>`buildContext(m, opts=)`

function · **exported** · L112–209

- calls: [`tieBetween`](bonds.js.md#s-tieBetween) _js/crew/bonds.js_ · [`bodyOf`](#s-bodyOf) · [`clamp01`](#s-clamp01) ×2 · [`computedNeeds`](#s-computedNeeds) · [`driftNeeds`](#s-driftNeeds) · [`needsOf`](#s-needsOf) · [`socialPull`](#s-socialPull) · [`loadSocial`](family.js.md#s-loadSocial) _js/crew/family.js_ · [`playerHull`](hull.js.md#s-playerHull) _js/crew/hull.js_ · [`r3`](journal.js.md#s-r3) _js/crew/journal.js_ ×2 · [`rapportBetween`](ledger.js.md#s-rapportBetween) _js/crew/ledger.js_ · [`attraction`](romance.js.md#s-attraction) _js/crew/romance.js_ · [`canBond`](romance.js.md#s-canBond) _js/crew/romance.js_ · [`canHavePrivacy`](romance.js.md#s-canHavePrivacy) _js/crew/romance.js_ · [`canPropose`](romance.js.md#s-canPropose) _js/crew/romance.js_ · [`courtingTarget`](romance.js.md#s-courtingTarget) _js/crew/romance.js_ · [`pairOf`](romance.js.md#s-pairOf) _js/crew/romance.js_ · [`stageOf`](romance.js.md#s-stageOf) _js/crew/romance.js_ · [`triangleFor`](romance.js.md#s-triangleFor) _js/crew/romance.js_ ×2 · [`createContext`](../genome/context.js.md#s-createContext) _js/genome/context.js_ · [`expectedLifespan`](../genome/context.js.md#s-expectedLifespan) _js/genome/context.js_ · [`phenotype`](../genome/spacer.js.md#s-phenotype) _js/genome/spacer.js_ · [`drawnTo`](../npc/cradle.js.md#s-drawnTo) _js/npc/cradle.js_ ×2
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- via [js/crew/family.js](family.js.md): `household.children.some`
- called by: [`ctxOf`](../console/panels/crew-gene.js.md#s-ctxOf) _js/console/panels/crew-gene.js_ · [`stepHand`](#s-stepHand) · [`coachHabit`](orders.js.md#s-coachHabit) _js/crew/orders.js_ · [`giveOrder`](orders.js.md#s-giveOrder) _js/crew/orders.js_ ×2

<!-- note:buildContext -->
---- the decision context ------------------------------------------------

The context the graph reads. One object, built fresh, never mutated by a
node. `hull` is whatever the watch is being stood on — the player's ship by
default, or an NPC vessel's (js/crew/hull.js), which is what lets the same
63 nodes run for every crew in the sky.

- L117 · `const needs = opts.peek ? Object.assign(needsOf(m), m.robot ? {} : computedNeeds(m, ship))` — 0.3.53: `peek` reads a hand without living a watch. Building a context
  used to drift every need a step, and the GENOME sheet built one on every
  repaint — keyed on tiredness, so an open sheet tired a seasoned hand out
  in a handful of frames. A peek only refreshes the two computed needs.
- L124 · `const gctx = createContext({` — age and wear feed the contextual expression: the same genome reads
  differently at fifty, tired, on the wrong end of the rota.
- L138 · `const others = [];` — who else is in earshot: on the same post this watch, or in the mess
- L159 · `const present = others.map((o) => o.m);` — Where this hand stands with whoever is actually in the room. The ladder
  lives in crew/romance.js; this is the rung the graph reads. Only people
  who are present count — you cannot walk out at a port with somebody who
  is asleep two decks up.
- L201 · `captainIsPlayer: isPlayerHull && (!captain.holder || captain.holder === "player"),` — only the player's crew can bring something to the player — and only
  while the player still has the conn (captain.holder is "player" by
  default, and a crew id once command has been handed over)
- L204 · `const pull = socialPull(ctx);` — who is on this person's mind, and what the graph should do about it
<!-- /note -->

### <a id="s-socialPull"></a>`socialPull(ctx)`

function · L211–224

- called by: [`buildContext`](#s-buildContext)

<!-- note:socialPull -->
- L213 · `if (needs.grievance > 0.55) {` — A grievance goes to whoever can do anything about it. On the player's
  hull that is the captain, and CONFRONT is what raises the flag the TALK
  tree reads; on an NPC hull it is said to whoever is in the room.
<!-- /note -->

### <a id="s-seededRng"></a>`seededRng(seedStr)`

function · L226–236

- called by: [`stepHand`](#s-stepHand)

<!-- note:seededRng -->
---- one decision --------------------------------------------------------
<!-- /note -->

### <a id="s-PHASE_ROOM"></a>`PHASE_ROOM`

const · L238–238

<!-- note:PHASE_ROOM -->
<!-- /note -->

### <a id="s-stepHand"></a>`stepHand(m, opts=)`

function · **exported** · L240–363

- calls: [`applyAction`](deckacts.js.md#s-applyAction) _js/crew/deckacts.js_ · [`buildContext`](#s-buildContext) · [`clamp01`](#s-clamp01) ×3 · [`dominantDrive`](#s-dominantDrive) · [`dominantLimit`](#s-dominantLimit) · [`holdingsOf`](#s-holdingsOf) ×2 · [`mergeDiffs`](#s-mergeDiffs) · [`seededRng`](#s-seededRng) · [`diffOf`](journal.js.md#s-diffOf) _js/crew/journal.js_ ×4 · [`fileRecord`](journal.js.md#s-fileRecord) _js/crew/journal.js_ · [`r3`](journal.js.md#s-r3) _js/crew/journal.js_ ×20 · [`writeSummary`](journal.js.md#s-writeSummary) _js/crew/journal.js_ · [`learnFromRecord`](learn.js.md#s-learnFromRecord) _js/crew/learn.js_ · [`decide`](../genome/behavior-graph.js.md#s-decide) _js/genome/behavior-graph.js_ · [`explainTrace`](../genome/behavior-graph.js.md#s-explainTrace) _js/genome/behavior-graph.js_ · [`fingerprint`](../genome/spacer.js.md#s-fingerprint) _js/genome/spacer.js_
- via [js/crew/deckacts.js](deckacts.js.md): `NEED_KEYS.map`
- called by: [`stepWatch`](#s-stepWatch) · [`giveOrder`](orders.js.md#s-giveOrder) _js/crew/orders.js_

<!-- note:stepHand -->
Observe, decide, live with it. Returns the journal record, already filed.
`stepHand` is deterministic for a given (hand, cycle, hull state).

- L245 · `const before = {` — ── observe ──
- L252 · `let out;` — ── decide ──
- L254 · `out = opts.order` — 0.3.53: an order from the captain (js/crew/orders.js) is the decision —
  the graph is not asked, but everything after this is the same watch
- L264 · `const applied = applyAction(ctx, out.action, spec, efficacy, rng, deckmind.cycle);` — ── apply ──
- L266 · `const nowState = hull.state();` — ── record ──
- L292 · `room: ctx.phase === 0 ? (ctx.postName ?? PHASE_ROOM[0]) : PHASE_ROOM[ctx.phase],` — on watch they are at their post; off it they are where the rota puts them
- L361 · `rec.reward = learnFromRecord(ctx, rec);` — the record is the training pair: what was observed, what was done, and
  the deltas that were actually applied. Learn from it while it is warm.
<!-- /note -->

### <a id="s-mergeDiffs"></a>`mergeDiffs(a, b)`

function · L365–368

- called by: [`stepHand`](#s-stepHand)

<!-- note:mergeDiffs -->
<!-- /note -->

### <a id="s-holdingsOf"></a>`holdingsOf(m, ctx)`

function · L370–380

- calls: [`trustOf`](family.js.md#s-trustOf) _js/crew/family.js_
- called by: [`stepHand`](#s-stepHand) ×2

<!-- note:holdingsOf -->
<!-- /note -->

### <a id="s-dominantDrive"></a>`dominantDrive(needs)`

function · L382–386

- called by: [`stepHand`](#s-stepHand)

<!-- note:dominantDrive -->
<!-- /note -->

### <a id="s-dominantLimit"></a>`dominantLimit(pheno)`

function · L388–400

- called by: [`stepHand`](#s-stepHand)

<!-- note:dominantLimit -->
<!-- /note -->

### <a id="s-runDeckCycle"></a>`runDeckCycle()`

function · **exported** · L402–409

- calls: [`stepWatch`](#s-stepWatch) · [`playerHull`](hull.js.md#s-playerHull) _js/crew/hull.js_

<!-- note:runDeckCycle -->
---- the cycle -----------------------------------------------------------

Every hand takes their turn. Hooked onto crewHooks.cycle.
<!-- /note -->

### <a id="s-stepWatch"></a>`stepWatch(roster, hull, opts=)`

function · **exported** · L411–432

- calls: [`stepHand`](#s-stepHand) · [`moment`](romance.js.md#s-moment) _js/crew/romance.js_
- called by: [`runDeckCycle`](#s-runDeckCycle) · [`tickNpcCrews`](../npc/npccrew.js.md#s-tickNpcCrews) _js/npc/npccrew.js_

<!-- note:stepWatch -->
One watch on one hull. Shared by the player's pay cycle and the NPC crew
budget (js/npc/npccrew.js), so a hand on a hauler two systems out decides
exactly the way a hand in your engine room does.

- L419 · `const time = opts.time ?? sim.time ?? 0;` — Keeping the same hours is the commonest way two people end up anywhere
  near each other, and a hull is small. Two hands on the same watch see
  each other all shift; two on the same watch at different posts still pass
  in the passage. Once per cycle per pair, not once per hand, so it counts
  the watch and not the paperwork.
- L428 · `try { moment(a, b, "watch", together ? 1 : 0.45); } catch {` — a pair that cannot be read is not a pair
<!-- /note -->

### <a id="s-deckReport"></a>`deckReport(records=)`

function · **exported** · L434–438

<!-- note:deckReport -->
What the whole deck did this cycle, as counts by action kind.
<!-- /note -->

### <a id="s-reset"></a>`reset()`

function · L440–440

- calls: [`forgetBrain`](learn.js.md#s-forgetBrain) _js/crew/learn.js_ · [`forgetRomanceGenome`](romance.js.md#s-forgetRomanceGenome) _js/crew/romance.js_ · [`resetRomance`](romance.js.md#s-resetRomance) _js/crew/romance.js_

<!-- note:reset -->
<!-- /note -->

## Module-level calls

- via [js/crew/ledger.js](ledger.js.md): `crewHooks.cycle.includes`, `crewHooks.cycle.push`, `crewHooks.reset.includes`, `crewHooks.reset.push`
