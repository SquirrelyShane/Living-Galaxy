# js/crew/romance.js

[index](../../../README.md) · 372 lines · 48 symbols · 7 imports · 6 importers

## About

<!-- note:@file -->
Living Galaxy — how two people on a hull get from strangers to a family.

an earlier build had one rung: rapport crossed 55, both were drawn to each other, a die
came up, and they were "official aboard". Everything before that was a
number going up, and everything after it was a 5% conception roll per pay
cycle. This is the ladder that was missing.

  strangers → noticed → interested → courting → together → bonded

Every rung is earned by something that actually happened on the deck and is
on the record for it (deckmind writes the journal entry either way): a
watch stood side by side, a walk out at a port, a gift, something said in
confidence, an argument mended. Each rung needs BOTH people to want it —
mutual attraction is a hard gate at every step, not a coin flip at the end
— and close kin never start the climb at all.

Private evenings are fade-to-black in core. An optional addon may listen
on hooks.onPrivateNight; core never imports that pack.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./ledger.js` | `crew`, `crewNote`, `firstName`, `rapportBetween` | [js/crew/ledger.js](ledger.js.md) |
| 2 | `../npc/cradle.js` | `cradle`, `drawnTo` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 3 | `./family.js` | `social`, `loadSocial`, `adjustMorale`, `household` | [js/crew/family.js](family.js.md) |
| 4 | `./bonds.js` | `adjustRapport`, `tieBetween` | [js/crew/bonds.js](bonds.js.md) |
| 5 | `../genome/spacer.js` | `genomeCompat`, `kinship`, `unpackGenome`, `KIN_BLOCK`, `GENE` | [js/genome/spacer.js](../genome/spacer.js.md) |
| 6 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 7 | `./hooks.js` | `runHooks` | [js/crew/hooks.js](hooks.js.md) |

## Imported by

- [js/console/panels/crew.js](../console/panels/crew.js.md) — `ladderReport`, `STAGE_LABEL`, `stageIndex`, `conceptionOdds`, `fertilityOf`, `privacyAboard`, `kinBetween`
- [js/crew/beats.js](beats.js.md) — `moment`, `attraction`
- [js/crew/deckacts.js](deckacts.js.md) — `moment`, `makePartners`, `bond`, `breakOff`, `privateNight`, `actOnJealousy`, `canPropose`, `canBond`
- [js/crew/deckmind.js](deckmind.js.md) — `courtingTarget`, `stageOf`, `pairOf`, `attraction`, `canPropose`, `canBond`, `canHavePrivacy`, `triangleFor`, `forgetRomanceGenome`, `resetRomance`, `moment`
- [js/crew/tiers.js](tiers.js.md) — `STAGES`, `STAGE_LABEL`, `stageIndex`, `MIN_ATTRACTION`, `attraction`
- test/skycrew.test.mjs _(outside js/)_ — `STAGES`, `STAGE_LABEL`, `RUNG`, `MIN_ATTRACTION`, `MOMENT`, `attraction`, `pairOf`, `stageOf`, `stageIndex`, `moment`, `setStage`, `canPropose`, `makePartners`, `canBond`, `bond`, `breakOff`, `privateNight`, `canHavePrivacy`, `privacyAboard`, `conceptionOdds`, `fertilityOf`, `carrierAndSire`, `triangleFor`, `ladderReport`, `ladderLine`, `kinBetween`, `prospectsFor`, `resetRomance`

## Exports

- [`forgetRomanceGenome`](#s-forgetRomanceGenome) · function — used by [js/crew/deckmind.js](deckmind.js.md)
- [`kinBetween`](#s-kinBetween) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), test/skycrew.test.mjs
- [`STAGES`](#s-STAGES) · const — used by [js/crew/tiers.js](tiers.js.md), test/skycrew.test.mjs
- [`STAGE_LABEL`](#s-STAGE_LABEL) · const — used by [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/tiers.js](tiers.js.md), test/skycrew.test.mjs
- [`RUNG`](#s-RUNG) · const — used by test/skycrew.test.mjs
- [`MIN_ATTRACTION`](#s-MIN_ATTRACTION) · const — used by [js/crew/tiers.js](tiers.js.md), test/skycrew.test.mjs
- [`pairOf`](#s-pairOf) · function — used by [js/crew/deckmind.js](deckmind.js.md), test/skycrew.test.mjs
- [`stageIndex`](#s-stageIndex) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/tiers.js](tiers.js.md), test/skycrew.test.mjs
- [`stageOf`](#s-stageOf) · function — used by [js/crew/deckmind.js](deckmind.js.md), test/skycrew.test.mjs
- [`attraction`](#s-attraction) · function — used by [js/crew/beats.js](beats.js.md), [js/crew/deckmind.js](deckmind.js.md), [js/crew/tiers.js](tiers.js.md), test/skycrew.test.mjs
- [`prospectsFor`](#s-prospectsFor) · function — used by test/skycrew.test.mjs
- [`courtingTarget`](#s-courtingTarget) · function — used by [js/crew/deckmind.js](deckmind.js.md)
- [`MOMENT`](#s-MOMENT) · const — used by test/skycrew.test.mjs
- [`moment`](#s-moment) · function — used by [js/crew/beats.js](beats.js.md), [js/crew/deckacts.js](deckacts.js.md), [js/crew/deckmind.js](deckmind.js.md), test/skycrew.test.mjs
- [`setStage`](#s-setStage) · function — used by test/skycrew.test.mjs
- [`canPropose`](#s-canPropose) · function — used by [js/crew/deckacts.js](deckacts.js.md), [js/crew/deckmind.js](deckmind.js.md), test/skycrew.test.mjs
- [`makePartners`](#s-makePartners) · function — used by [js/crew/deckacts.js](deckacts.js.md), test/skycrew.test.mjs
- [`canBond`](#s-canBond) · function — used by [js/crew/deckacts.js](deckacts.js.md), [js/crew/deckmind.js](deckmind.js.md), test/skycrew.test.mjs
- [`bond`](#s-bond) · function — used by [js/crew/deckacts.js](deckacts.js.md), test/skycrew.test.mjs
- [`breakOff`](#s-breakOff) · function — used by [js/crew/deckacts.js](deckacts.js.md), test/skycrew.test.mjs
- [`triangleFor`](#s-triangleFor) · function — used by [js/crew/deckmind.js](deckmind.js.md), test/skycrew.test.mjs
- [`actOnJealousy`](#s-actOnJealousy) · function — used by [js/crew/deckacts.js](deckacts.js.md)
- [`privacyAboard`](#s-privacyAboard) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), test/skycrew.test.mjs
- [`canHavePrivacy`](#s-canHavePrivacy) · function — used by [js/crew/deckmind.js](deckmind.js.md), test/skycrew.test.mjs
- [`privateNight`](#s-privateNight) · function — used by [js/crew/deckacts.js](deckacts.js.md), test/skycrew.test.mjs
- [`fertilityOf`](#s-fertilityOf) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), test/skycrew.test.mjs
- [`conceptionOdds`](#s-conceptionOdds) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), test/skycrew.test.mjs
- [`carrierAndSire`](#s-carrierAndSire) · function — used by test/skycrew.test.mjs
- [`tryConceive`](#s-tryConceive) · function — **no importer in scanned roots**
- [`ladderReport`](#s-ladderReport) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), test/skycrew.test.mjs
- [`ladderLine`](#s-ladderLine) · function — used by test/skycrew.test.mjs
- [`resetRomance`](#s-resetRomance) · function — used by [js/crew/deckmind.js](deckmind.js.md), test/skycrew.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-_g"></a>`_g`

const · L9–9

<!-- note:_g -->
Genomes come off the member rather than out of deckmind, so this module
serves a provisional NPC hand (who is not on the ledger) exactly as well as
one of yours — and so nothing here has to import the loop that calls it.
<!-- /note -->

### <a id="s-genomeFor"></a>`genomeFor(m)`

function · L10–18

- calls: [`unpackGenome`](../genome/spacer.js.md#s-unpackGenome) _js/genome/spacer.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`attraction`](#s-attraction) ×2 · [`fertilityOf`](#s-fertilityOf) · [`kinBetween`](#s-kinBetween) ×2 · [`twinRoll`](#s-twinRoll) ×2

<!-- note:genomeFor -->
<!-- /note -->

### <a id="s-forgetRomanceGenome"></a>`forgetRomanceGenome(id)`

function · **exported** · L19–19

- called by: [`clearBodies`](deckmind.js.md#s-clearBodies) _js/crew/deckmind.js_ · [`forgetBody`](deckmind.js.md#s-forgetBody) _js/crew/deckmind.js_ · [`reset`](deckmind.js.md#s-reset) _js/crew/deckmind.js_

<!-- note:forgetRomanceGenome -->
<!-- /note -->

### <a id="s-kinBetween"></a>`kinBetween(a, b)`

function · **exported** · L21–24

- calls: [`genomeFor`](#s-genomeFor) ×2 · [`kinship`](../genome/spacer.js.md#s-kinship) _js/genome/spacer.js_
- called by: [`mountBonds`](../console/panels/crew.js.md#s-mountBonds) _js/console/panels/crew.js_ · [`attraction`](#s-attraction) · [`canPropose`](#s-canPropose) · [`ladderLine`](#s-ladderLine)

<!-- note:kinBetween -->
Coefficient of relationship between two hands, from whatever genomes they carry.
<!-- /note -->

### <a id="s-STAGES"></a>`STAGES`

const · **exported** · L26–26

<!-- note:STAGES -->
The rungs, in order. A pair is always on exactly one of them.
<!-- /note -->

### <a id="s-STAGE_LABEL"></a>`STAGE_LABEL`

const · **exported** · L27–34

<!-- note:STAGE_LABEL -->
<!-- /note -->

### <a id="s-RUNG"></a>`RUNG`

const · **exported** · L36–36

<!-- note:RUNG -->
Spark needed to reach each rung, and the trust the player needs for their own.
<!-- /note -->

### <a id="s-MIN_ATTRACTION"></a>`MIN_ATTRACTION`

const · **exported** · L37–37

<!-- note:MIN_ATTRACTION -->
Below this attraction the climb stops wherever it is.
<!-- /note -->

### <a id="s-clamp01"></a>`clamp01(v)`

function · L39–39

- called by: [`attraction`](#s-attraction) ×3 · [`conceptionOdds`](#s-conceptionOdds) · [`fertilityOf`](#s-fertilityOf) ×2

<!-- note:clamp01 -->
<!-- /note -->

### <a id="s-r2"></a>`r2(v)`

function · L40–40

- called by: [`attraction`](#s-attraction) · [`conceptionOdds`](#s-conceptionOdds) · [`fertilityOf`](#s-fertilityOf) · [`ladderReport`](#s-ladderReport) · [`moment`](#s-moment)

<!-- note:r2 -->
<!-- /note -->

### <a id="s-book"></a>`book(m)`

function · L42–45

- called by: [`pairOf`](#s-pairOf)

<!-- note:book -->
---- the book -------------------------------------------------------------
<!-- /note -->

### <a id="s-pairOf"></a>`pairOf(a, b)`

function · **exported** · L47–52

- calls: [`book`](#s-book)
- called by: [`buildContext`](deckmind.js.md#s-buildContext) _js/crew/deckmind.js_ · [`bothWays`](#s-bothWays) ×2 · [`canBond`](#s-canBond) · [`canPropose`](#s-canPropose) · [`ladderLine`](#s-ladderLine) · [`ladderReport`](#s-ladderReport) · [`prospectsFor`](#s-prospectsFor) · [`reconsider`](#s-reconsider) · [`stageOf`](#s-stageOf) ×2 · [`triangleFor`](#s-triangleFor)

<!-- note:pairOf -->
The pair's state: { stage, spark, since, moments, privateNights, ended }.
<!-- /note -->

### <a id="s-bothWays"></a>`bothWays(a, b, fn)`

function · L54–59

- calls: [`pairOf`](#s-pairOf) ×2
- called by: [`breakOff`](#s-breakOff) · [`moment`](#s-moment) · [`privateNight`](#s-privateNight) · [`setStage`](#s-setStage)

<!-- note:bothWays -->
<!-- /note -->

### <a id="s-stageIndex"></a>`stageIndex(s)`

function · **exported** · L61–61

- called by: [`mountBonds`](../console/panels/crew.js.md#s-mountBonds) _js/console/panels/crew.js_ ×3 · [`canPropose`](#s-canPropose) · [`ladderReport>order`](#s-ladderReport-order) · [`prospectsFor`](#s-prospectsFor) ×2 · [`reconsider`](#s-reconsider) · [`romanceTier>rung`](tiers.js.md#s-romanceTier-rung) _js/crew/tiers.js_ · [`tierGate`](tiers.js.md#s-tierGate) _js/crew/tiers.js_

<!-- note:stageIndex -->
<!-- /note -->

### <a id="s-stageOf"></a>`stageOf(a, b)`

function · **exported** · L62–66

- calls: [`pairOf`](#s-pairOf) ×2
- called by: [`buildContext`](deckmind.js.md#s-buildContext) _js/crew/deckmind.js_ · [`ladderLine`](#s-ladderLine) · [`ladderReport`](#s-ladderReport) · [`prospectsFor`](#s-prospectsFor)

<!-- note:stageOf -->
<!-- /note -->

### <a id="s-attraction"></a>`attraction(a, b)`

function · **exported** · L68–79

- calls: [`rapportBetween`](ledger.js.md#s-rapportBetween) _js/crew/ledger.js_ · [`clamp01`](#s-clamp01) ×3 · [`genomeFor`](#s-genomeFor) ×2 · [`kinBetween`](#s-kinBetween) · [`r2`](#s-r2) · [`genomeCompat`](../genome/spacer.js.md#s-genomeCompat) _js/genome/spacer.js_ · [`drawnTo`](../npc/cradle.js.md#s-drawnTo) _js/npc/cradle.js_ ×2
- called by: [`odds`](beats.js.md#s-odds) _js/crew/beats.js_ · [`buildContext`](deckmind.js.md#s-buildContext) _js/crew/deckmind.js_ · [`canPropose`](#s-canPropose) · [`ladderLine`](#s-ladderLine) · [`ladderReport`](#s-ladderReport) · [`moment`](#s-moment) · [`prospectsFor`](#s-prospectsFor) · [`reconsider`](#s-reconsider) · [`triangleFor`](#s-triangleFor) · [`romanceTier`](tiers.js.md#s-romanceTier) _js/crew/tiers.js_

<!-- note:attraction -->
---- attraction -----------------------------------------------------------

0..1, and 0 is a wall. Mutual interest is required — it is not a number that
can be outweighed by rapport — and so is not being family. Above that floor
it is what the two genomes make of each other, what their watches have
built, and whether either of them is in any state to want anything.

- L77 · `const show = ga && gb ? ((ga[GENE.COURTSHIP_DISPLAY] ?? 0.5) + (gb[GENE.COURTSHIP_DISPLAY]` — courtship display is what makes somebody noticeable rather than merely present
<!-- /note -->

### <a id="s-prospectsFor"></a>`prospectsFor(m, roster=)`

function · **exported** · L81–90

- calls: [`attraction`](#s-attraction) · [`pairOf`](#s-pairOf) · [`stageIndex`](#s-stageIndex) ×2 · [`stageOf`](#s-stageOf)
- called by: [`courtingTarget`](#s-courtingTarget) ×2

<!-- note:prospectsFor -->
Everyone aboard this hull who could, in principle, be somebody to them.
<!-- /note -->

### <a id="s-courtingTarget"></a>`courtingTarget(m, roster=)`

function · **exported** · L92–95

- calls: [`prospectsFor`](#s-prospectsFor) ×2
- called by: [`buildContext`](deckmind.js.md#s-buildContext) _js/crew/deckmind.js_

<!-- note:courtingTarget -->
The one they are closest to getting somewhere with, or null.
<!-- /note -->

### <a id="s-MOMENT"></a>`MOMENT`

const · **exported** · L97–114

<!-- note:MOMENT -->
---- moments --------------------------------------------------------------

Spark per kind of thing that passed between them. These are the interactions
the deck graph can actually reach; everything else moves rapport and leaves
the ladder alone.

- L98 · `watch: 1.5,` — stood the same post
- L102 · `vent: 4,` — told them something
- L106 · `walkout: 12,` — shore leave together at a port
- L108 · `mend: 6,` — made it up after a row
<!-- /note -->

### <a id="s-moment"></a>`moment(a, b, kind, scale=)`

function · **exported** · L116–129

- calls: [`attraction`](#s-attraction) · [`bothWays`](#s-bothWays) · [`r2`](#s-r2) · [`reconsider`](#s-reconsider)
- called by: [`applyOutcome`](beats.js.md#s-applyOutcome) _js/crew/beats.js_ · [`applyAction`](deckacts.js.md#s-applyAction) _js/crew/deckacts.js_ · [`applyRomance`](deckacts.js.md#s-applyRomance) _js/crew/deckacts.js_ · [`stepWatch`](deckmind.js.md#s-stepWatch) _js/crew/deckmind.js_ · [`actOnJealousy`](#s-actOnJealousy) · [`bond`](#s-bond) · [`makePartners`](#s-makePartners) · [`privateNight`](#s-privateNight)

<!-- note:moment -->
Something happened between two people. Returns { stage, advanced, line } —
`advanced` is the rung they just reached, if any.
<!-- /note -->

### <a id="s-reconsider"></a>`reconsider(a, b, att=)`

function · L131–153

- calls: [`attraction`](#s-attraction) · [`pairOf`](#s-pairOf) · [`setStage`](#s-setStage) ×3 · [`stageIndex`](#s-stageIndex)
- called by: [`moment`](#s-moment)

<!-- note:reconsider -->
Has this pair earned the next rung — or lost the one they were on?

- L135 · `if (att < MIN_ATTRACTION) {` — the climb stops dead without mutual interest, wherever it had got to
- L136 · `if (here > 0 && here < 4) {` — falling back down: a row can undo a rung, but never a partnership — that
  takes a break-off, which is its own decision
- L150 · `if (next === "together" || next === "bonded") return null;` — the last two rungs are decisions, not thresholds — COURT and BOND make them
<!-- /note -->

### <a id="s-setStage"></a>`setStage(a, b, stage)`

function · **exported** · L155–164

- calls: [`crewNote`](ledger.js.md#s-crewNote) _js/crew/ledger.js_ · [`bothWays`](#s-bothWays)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`bond`](#s-bond) · [`makePartners`](#s-makePartners) · [`reconsider`](#s-reconsider) ×3

<!-- note:setStage -->
<!-- /note -->

### <a id="s-LINES"></a>`LINES`

const · L166–172

<!-- note:LINES -->
<!-- /note -->

#### <a id="s-LINES-noticed"></a>`LINES.noticed(a, b)`

prop · L167–167

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×2

<!-- note:LINES.noticed -->
<!-- /note -->

#### <a id="s-LINES-interested"></a>`LINES.interested(a, b)`

prop · L168–168

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×2

<!-- note:LINES.interested -->
<!-- /note -->

#### <a id="s-LINES-courting"></a>`LINES.courting(a, b)`

prop · L169–169

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×2

<!-- note:LINES.courting -->
<!-- /note -->

#### <a id="s-LINES-together"></a>`LINES.together(a, b)`

prop · L170–170

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×2

<!-- note:LINES.together -->
<!-- /note -->

#### <a id="s-LINES-bonded"></a>`LINES.bonded(a, b)`

prop · L171–171

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×2

<!-- note:LINES.bonded -->
<!-- /note -->

### <a id="s-canPropose"></a>`canPropose(a, b)`

function · **exported** · L174–184

- calls: [`attraction`](#s-attraction) · [`kinBetween`](#s-kinBetween) · [`pairOf`](#s-pairOf) · [`stageIndex`](#s-stageIndex)
- called by: [`applyRomance`](deckacts.js.md#s-applyRomance) _js/crew/deckacts.js_ · [`buildContext`](deckmind.js.md#s-buildContext) _js/crew/deckmind.js_ · [`makePartners`](#s-makePartners)

<!-- note:canPropose -->
---- the two decisions ----------------------------------------------------

Ask. Needs the rung, mutual interest and nerve; returns { ok, why }.
<!-- /note -->

### <a id="s-makePartners"></a>`makePartners(a, b)`

function · **exported** · L186–195

- calls: [`adjustRapport`](bonds.js.md#s-adjustRapport) _js/crew/bonds.js_ · [`adjustMorale`](family.js.md#s-adjustMorale) _js/crew/family.js_ ×2 · [`canPropose`](#s-canPropose) · [`moment`](#s-moment) · [`setStage`](#s-setStage)
- called by: [`applyRomance`](deckacts.js.md#s-applyRomance) _js/crew/deckacts.js_

<!-- note:makePartners -->
They asked and were not refused.
<!-- /note -->

### <a id="s-canBond"></a>`canBond(a, b, {…}=)`

function · **exported** · L197–204

- calls: [`pairOf`](#s-pairOf)
- called by: [`applyRomance`](deckacts.js.md#s-applyRomance) _js/crew/deckacts.js_ · [`buildContext`](deckmind.js.md#s-buildContext) _js/crew/deckmind.js_ · [`bond`](#s-bond)

<!-- note:canBond -->
The permanent rung. Needs time together and a port to do it at.
<!-- /note -->

### <a id="s-bond"></a>`bond(a, b, opts=)`

function · **exported** · L206–214

- calls: [`adjustMorale`](family.js.md#s-adjustMorale) _js/crew/family.js_ ×3 · [`canBond`](#s-canBond) · [`moment`](#s-moment) · [`setStage`](#s-setStage)
- called by: [`applyRomance`](deckacts.js.md#s-applyRomance) _js/crew/deckacts.js_

<!-- note:bond -->
<!-- /note -->

### <a id="s-breakOff"></a>`breakOff(a, b, why=)`

function · **exported** · L216–225

- calls: [`adjustRapport`](bonds.js.md#s-adjustRapport) _js/crew/bonds.js_ · [`adjustMorale`](family.js.md#s-adjustMorale) _js/crew/family.js_ ×2 · [`crewNote`](ledger.js.md#s-crewNote) _js/crew/ledger.js_ · [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×2 · [`bothWays`](#s-bothWays)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`applyRomance`](deckacts.js.md#s-applyRomance) _js/crew/deckacts.js_

<!-- note:breakOff -->
It ended. Rapport takes it, and so do they.
<!-- /note -->

### <a id="s-triangleFor"></a>`triangleFor(m, roster=)`

function · **exported** · L227–238

- calls: [`attraction`](#s-attraction) · [`pairOf`](#s-pairOf)
- called by: [`buildContext`](deckmind.js.md#s-buildContext) _js/crew/deckmind.js_ ×2

<!-- note:triangleFor -->
---- somebody else --------------------------------------------------------

Who is carrying a torch for a hand who is already with someone. Jealousy is
not a flag on a person; it is the shape of a triangle, and the graph reads
it to decide whether to do anything about it.
<!-- /note -->

### <a id="s-actOnJealousy"></a>`actOnJealousy(m, rival, partner)`

function · **exported** · L240–248

- calls: [`adjustRapport`](bonds.js.md#s-adjustRapport) _js/crew/bonds.js_ · [`adjustMorale`](family.js.md#s-adjustMorale) _js/crew/family.js_ ×2 · [`crewNote`](ledger.js.md#s-crewNote) _js/crew/ledger.js_ · [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×3 · [`moment`](#s-moment)
- called by: [`applyRomance`](deckacts.js.md#s-applyRomance) _js/crew/deckacts.js_

<!-- note:actOnJealousy -->
A hand acts on it. Costs everyone something; occasionally it works.
<!-- /note -->

### <a id="s-privacyAboard"></a>`privacyAboard()`

function · **exported** · L250–254

- called by: [`mountHouse>repaintRules`](../console/panels/crew.js.md#s-mountHouse-repaintRules) _js/console/panels/crew.js_ · [`canHavePrivacy`](#s-canHavePrivacy)

<!-- note:privacyAboard -->
---- privacy, and what it is for ------------------------------------------
The adult switch does not change what anything looks like — nothing here
depicts anything. It gates whether a couple get a step that needs a door
that shuts, and whether a conception can come from it. With the switch off
the crew still pair off, still bond, and still have children through the
ordinary household path; they simply do it off-screen the way they always
did.

Berths with a door: crew quarters and the captain's. The refit matters here.
<!-- /note -->

### <a id="s-canHavePrivacy"></a>`canHavePrivacy(a, b)`

function · **exported** · L256–265

- calls: [`loadSocial`](family.js.md#s-loadSocial) _js/crew/family.js_ · [`privacyAboard`](#s-privacyAboard)
- called by: [`buildContext`](deckmind.js.md#s-buildContext) _js/crew/deckmind.js_ · [`privateNight`](#s-privateNight)

<!-- note:canHavePrivacy -->
Can this couple have a night to themselves? { ok, why }
<!-- /note -->

### <a id="s-privateNight"></a>`privateNight(a, b, rng=)`

function · **exported** · L267–278

- calls: [`adjustRapport`](bonds.js.md#s-adjustRapport) _js/crew/bonds.js_ · [`adjustMorale`](family.js.md#s-adjustMorale) _js/crew/family.js_ ×2 · [`runHooks`](hooks.js.md#s-runHooks) _js/crew/hooks.js_ · [`bothWays`](#s-bothWays) · [`canHavePrivacy`](#s-canHavePrivacy) · [`moment`](#s-moment) · [`tryConceive`](#s-tryConceive)
- called by: [`applyRomance`](deckacts.js.md#s-applyRomance) _js/crew/deckacts.js_

<!-- note:privateNight -->
A night to themselves. Core is fade-to-black: numbers move, a child may
start, nothing is depicted. Addons may rewrite the log via onPrivateNight.
<!-- /note -->

### <a id="s-fertilityOf"></a>`fertilityOf(m)`

function · **exported** · L280–290

- calls: [`clamp01`](#s-clamp01) ×2 · [`genomeFor`](#s-genomeFor) · [`r2`](#s-r2)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`mountBonds`](../console/panels/crew.js.md#s-mountBonds) _js/console/panels/crew.js_ ×2 · [`conceptionOdds`](#s-conceptionOdds) ×2

<!-- note:fertilityOf -->
---- fertility ------------------------------------------------------------

0..1 for one person: the genes for it, and where they are in a life.

- L287 · `const window = age < 0.22 ? 0 : age < 0.3 ? (age - 0.22) / 0.08 : age < 0.6 ? 1 : Math.max` — a curve, not a cliff: best through the prime years, tailing either side
<!-- /note -->

### <a id="s-conceptionOdds"></a>`conceptionOdds(a, b)`

function · **exported** · L292–303

- calls: [`loadSocial`](family.js.md#s-loadSocial) _js/crew/family.js_ · [`carrierAndSire`](#s-carrierAndSire) · [`clamp01`](#s-clamp01) · [`fertilityOf`](#s-fertilityOf) ×2 · [`r2`](#s-r2)
- via [js/crew/family.js](family.js.md): `household.pregnancies.some`
- called by: [`mountBonds`](../console/panels/crew.js.md#s-mountBonds) _js/console/panels/crew.js_ · [`tryConceive`](#s-tryConceive)

<!-- note:conceptionOdds -->
The pair's chance per private night, and who would carry.
<!-- /note -->

### <a id="s-carrierAndSire"></a>`carrierAndSire(a, b)`

function · **exported** · L305–318

- calls: [`carrierAndSire>role`](#s-carrierAndSire-role) ×2
- called by: [`conceptionOdds`](#s-conceptionOdds)

<!-- note:carrierAndSire -->
Who carries and who sires. Nonbinary hands roll it from their own seed, once.
<!-- /note -->

#### <a id="s-carrierAndSire-role"></a>`carrierAndSire>role(p)`

function · L306–314

- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`carrierAndSire`](#s-carrierAndSire) ×2

<!-- note:carrierAndSire>role -->
<!-- /note -->

### <a id="s-tryConceive"></a>`tryConceive(a, b, rng=)`

function · **exported** · L320–333

- calls: [`crewNote`](ledger.js.md#s-crewNote) _js/crew/ledger.js_ · [`conceptionOdds`](#s-conceptionOdds) · [`twinRoll`](#s-twinRoll)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- via [js/crew/family.js](family.js.md): `household.pregnancies.push`
- called by: [`privateNight`](#s-privateNight)

<!-- note:tryConceive -->
Roll it. On a hit this files the pregnancy on `household` exactly the way
the old per-cycle path did, so gestation, birth, heredity and the crèche
are all unchanged — only the way it starts is different.
<!-- /note -->

### <a id="s-twinRoll"></a>`twinRoll(carrier, sire, rng)`

function · L335–339

- calls: [`genomeFor`](#s-genomeFor) ×2
- called by: [`tryConceive`](#s-tryConceive)

<!-- note:twinRoll -->
<!-- /note -->

### <a id="s-ladderReport"></a>`ladderReport(roster=)`

function · **exported** · L341–354

- calls: [`tieBetween`](bonds.js.md#s-tieBetween) _js/crew/bonds.js_ · [`attraction`](#s-attraction) · [`ladderReport>order`](#s-ladderReport-order) ×2 · [`pairOf`](#s-pairOf) · [`r2`](#s-r2) · [`stageOf`](#s-stageOf)
- called by: [`mountBonds`](../console/panels/crew.js.md#s-mountBonds) _js/console/panels/crew.js_

<!-- note:ladderReport -->
---- reading it back ------------------------------------------------------

[{ a, b, stage, spark, attraction, kin }] — every pair with anything between them.

- L348 · `if (!p || (p.stage === "strangers" && att < MIN_ATTRACTION && p.spark < 20)) continue;` — A pair with real spark and no draw between them belongs on this list
  too — two people who spend every watch together and were never going
  to be anything else is the commonest thing on a ship, and a panel that
  hides it reads as a panel that is not working.
<!-- /note -->

#### <a id="s-ladderReport-order"></a>`ladderReport>order(s)`

function · L352–352

- calls: [`stageIndex`](#s-stageIndex)
- called by: [`ladderReport`](#s-ladderReport) ×2

<!-- note:ladderReport>order -->
<!-- /note -->

### <a id="s-ladderLine"></a>`ladderLine(a, b)`

function · **exported** · L356–367

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×6 · [`attraction`](#s-attraction) · [`kinBetween`](#s-kinBetween) · [`pairOf`](#s-pairOf) · [`stageOf`](#s-stageOf)

<!-- note:ladderLine -->
One line about where a pair stand.
<!-- /note -->

### <a id="s-resetRomance"></a>`resetRomance()`

function · **exported** · L369–372

- called by: [`reset`](deckmind.js.md#s-reset) _js/crew/deckmind.js_

<!-- note:resetRomance -->
Clear every ladder — a new sky is new people.
<!-- /note -->
