# js/console/panels/crew-gene.js

[index](../../../../README.md) · 272 lines · 14 symbols · 13 imports · 1 importers

## About

<!-- note:@file -->
Living Galaxy — CONSOLE › CREW: GENOME and LOG.

Two views onto the part of a hand that was always there and never shown.

  GENOME — the body on file: the fingerprint that follows them between
           skies, what you can see across a mess, what they were built to
           be good at, the nine needs they are carrying right now, and who
           aboard they are related to.
  LOG    — the decision record. Every watch, what they chose, how well they
           did it, the chain of reasoning that got them there, what else
           they nearly did instead, and what it cost. Exportable whole.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `el`, `section`, `note`, `row`, `button`, `group`, `chips`, `setBar`, `card`, `pct` | [js/console/kit.js](../kit.js.md) |
| 2 | `../../crew/ledger.js` | `crew`, `firstName`, `genderMark`, `relatedTo` | [js/crew/ledger.js](../../crew/ledger.js.md) |
| 3 | `../../sim/sim.js` | `sim` | [js/sim/sim.js](../../sim/sim.js.md) |
| 4 | `../../npc/cradle.js` | `cradle`, `looksLine` | [js/npc/cradle.js](../../npc/cradle.js.md) |
| 5 | `../../genome/spacer.js` | `kinLabel`, `KIN_BLOCK` | [js/genome/spacer.js](../../genome/spacer.js.md) |
| 6 | `../../crew/deckmind.js` | `bodyOf`, `needsOf`, `buildContext` | [js/crew/deckmind.js](../../crew/deckmind.js.md) |
| 7 | `../../crew/deckacts.js` | `NEED_KEYS` | [js/crew/deckacts.js](../../crew/deckacts.js.md) |
| 8 | `../../crew/journal.js` | `journal`, `exportJournals`, `habitsOf` | [js/crew/journal.js](../../crew/journal.js.md) |
| 9 | `../../crew/learn.js` | `habitsLearned`, `learnedLine`, `confidenceOf`, `trainingCorpus`, `DECK_KINDS` | [js/crew/learn.js](../../crew/learn.js.md) |
| 10 | `../../crew/heritage.js` | `heritageLine`, `learningBonus`, `houseSkills` | [js/crew/heritage.js](../../crew/heritage.js.md) |
| 11 | `../../careers/skills.js` | `SKILLS` | [js/careers/skills.js](../../careers/skills.js.md) |
| 12 | `../../crew/orders.js` | `orderFor`, `giveOrder`, `setTraining`, `coachHabit`, `ceilingOf`, `TRAIT_MEANS` | [js/crew/orders.js](../../crew/orders.js.md) |
| 13 | `../../crew/deckmind.js` | `deckmind` | [js/crew/deckmind.js](../../crew/deckmind.js.md) |

## Imported by

- [js/console/panels/crew.js](crew.js.md) — `mountGenome`, `mountLog`

## Exports

- [`mountGenome`](#s-mountGenome) · function — used by [js/console/panels/crew.js](crew.js.md)
- [`mountLog`](#s-mountLog) · function — used by [js/console/panels/crew.js](crew.js.md)
- [`geneView`](#s-view) — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-view"></a>`view`

const · **exported** · L15–15

<!-- note:view -->
<!-- /note -->

### <a id="s-TRAIT_LABEL"></a>`TRAIT_LABEL`

const · L17–17

<!-- note:TRAIT_LABEL -->
<!-- /note -->

### <a id="s-NEED_LABEL"></a>`NEED_LABEL`

const · L18–21

<!-- note:NEED_LABEL -->
<!-- /note -->

### <a id="s-NEED_TONE"></a>`NEED_TONE(v)`

function · L22–22

- called by: [`mountGenome>paint`](#s-mountGenome-paint)

<!-- note:NEED_TONE -->
<!-- /note -->

### <a id="s-picker"></a>`picker(sec, key, onPick)`

function · L24–30

- calls: [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ · [`firstName`](../../crew/ledger.js.md#s-firstName) _js/crew/ledger.js_
- via [js/crew/ledger.js](../../crew/ledger.js.md): `crew.aboard.map`, `crew.aboard.some`
- called by: [`mountGenome`](#s-mountGenome) · [`mountLog`](#s-mountLog)

<!-- note:picker -->
<!-- /note -->

#### <a id="s-picker-onPick"></a>`picker.onPick(id)`

prop · L27–27

- calls: [`picker.onPick`](#s-picker-onPick)
- called by: [`picker.onPick`](#s-picker-onPick)

<!-- note:picker.onPick -->
<!-- /note -->

### <a id="s-memberOf"></a>`memberOf(id)`

function · L32–32

- via [js/crew/ledger.js](../../crew/ledger.js.md): `crew.aboard.find`
- called by: [`mountGenome>paint`](#s-mountGenome-paint) · [`mountLog>paint`](#s-mountLog-paint)

<!-- note:memberOf -->
<!-- /note -->

### <a id="s-ctxOf"></a>`ctxOf(m)`

function · L34–36

- calls: [`buildContext`](../../crew/deckmind.js.md#s-buildContext) _js/crew/deckmind.js_
- called by: [`mountGenome>paint`](#s-mountGenome-paint)

<!-- note:ctxOf -->
The learned prior is situational, so it is read against the situation this
hand is actually in. Cheap enough to build on a repaint; guarded because a
member who has just left the deck has no context to build.

- L35 · `try { return buildContext(m, { peek: true }); } catch { return null; }` — 0.3.53: a PEEK — reading a hand must not live a watch for them
<!-- /note -->

### <a id="s-said"></a>`said(m, r)`

function · L38–41

- called by: [`mountGenome>paint`](#s-mountGenome-paint) ×4

<!-- note:said -->
what the last thing you did on the sheet came to, for this hand
<!-- /note -->

### <a id="s-mountGenome"></a>`mountGenome(root, ctx)`

function · **exported** · L43–178

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×2 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`section`](../kit.js.md#s-section) _js/console/kit.js_ · [`mountGenome>paint`](#s-mountGenome-paint) · [`picker`](#s-picker)
- called by: [`mount`](crew.js.md#s-mount) _js/console/panels/crew.js_

<!-- note:mountGenome -->
---- GENOME --------------------------------------------------------------
<!-- /note -->

#### <a id="s-mountGenome-paint"></a>`mountGenome>paint()`

function · L53–176

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×4 · [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×3 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×10 · [`pct`](../kit.js.md#s-pct) _js/console/kit.js_ ×4 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×17 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×7 · [`setBar`](../kit.js.md#s-setBar) _js/console/kit.js_ ×5 · [`ctxOf`](#s-ctxOf) · [`memberOf`](#s-memberOf) · [`mountGenome>paint`](#s-mountGenome-paint) ×4 · [`NEED_TONE`](#s-NEED_TONE) · [`said`](#s-said) ×4 · [`bodyOf`](../../crew/deckmind.js.md#s-bodyOf) _js/crew/deckmind.js_ · [`needsOf`](../../crew/deckmind.js.md#s-needsOf) _js/crew/deckmind.js_ ×2 · [`heritageLine`](../../crew/heritage.js.md#s-heritageLine) _js/crew/heritage.js_ · [`houseSkills`](../../crew/heritage.js.md#s-houseSkills) _js/crew/heritage.js_ · [`learningBonus`](../../crew/heritage.js.md#s-learningBonus) _js/crew/heritage.js_ · [`confidenceOf`](../../crew/learn.js.md#s-confidenceOf) _js/crew/learn.js_ · [`habitsLearned`](../../crew/learn.js.md#s-habitsLearned) _js/crew/learn.js_ · [`learnedLine`](../../crew/learn.js.md#s-learnedLine) _js/crew/learn.js_ · [`firstName`](../../crew/ledger.js.md#s-firstName) _js/crew/ledger.js_ ×2 · [`genderMark`](../../crew/ledger.js.md#s-genderMark) _js/crew/ledger.js_ · [`relatedTo`](../../crew/ledger.js.md#s-relatedTo) _js/crew/ledger.js_ · [`ceilingOf`](../../crew/orders.js.md#s-ceilingOf) _js/crew/orders.js_ · [`coachHabit`](../../crew/orders.js.md#s-coachHabit) _js/crew/orders.js_ ×2 · [`giveOrder`](../../crew/orders.js.md#s-giveOrder) _js/crew/orders.js_ · [`orderFor`](../../crew/orders.js.md#s-orderFor) _js/crew/orders.js_ · [`setTraining`](../../crew/orders.js.md#s-setTraining) _js/crew/orders.js_ · [`kinLabel`](../../genome/spacer.js.md#s-kinLabel) _js/genome/spacer.js_ · [`looksLine`](../../npc/cradle.js.md#s-looksLine) _js/npc/cradle.js_
- via [js/npc/cradle.js](../../npc/cradle.js.md): `cradle.get`
- via [js/crew/deckacts.js](../../crew/deckacts.js.md): `NEED_KEYS.map`, `NEED_KEYS.map.join`
- via [js/crew/heritage.js](../../crew/heritage.js.md): `learningBonus.toFixed`
- via [js/crew/learn.js](../../crew/learn.js.md): `habitsLearned.slice`
- called by: [`mountGenome`](#s-mountGenome) · [`mountGenome>paint`](#s-mountGenome-paint) ×4

<!-- note:mountGenome>paint -->
- L64 · `` const id = card(m.name, `${`${rec?.complexName ?? m.complexName ?? ""} ${m.letter ?? ""}`. `` — — the body —
- L77 · `const tr = section("TEMPERAMENT");` — — temperament —
- L86 · `const ap = section("APTITUDE");` — — what they were built for —
- L102 · `const nd = section("CARRYING");` — — what they need —
- L121 · `const h = rec?.heritage;` — — what the house gave them —
- L136 · `const lr = section("LEARNED");` — — what they have worked out for themselves —
- L143 · `note(lr, "ENCOURAGE or CURB a habit: a word from you, learned the way their own watches ar` — 0.3.53: a word from the captain is one step of the same learning
- L158 · `const kin = section("KIN ABOARD");` — — kin —
- L170 · `const raw = section("ON THE RECORD");` — — the string itself —
<!-- /note -->

### <a id="s-recordCard"></a>`recordCard(r)`

function · L180–215

- calls: [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×12 · [`pct`](../kit.js.md#s-pct) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×2 · [`setBar`](../kit.js.md#s-setBar) _js/console/kit.js_ · [`firstName`](../../crew/ledger.js.md#s-firstName) _js/crew/ledger.js_
- called by: [`mountLog>paint`](#s-mountLog-paint)

<!-- note:recordCard -->
---- LOG -----------------------------------------------------------------
<!-- /note -->

### <a id="s-mountLog"></a>`mountLog(root, ctx)`

function · **exported** · L217–270

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×3 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×4 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×2 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×2 · [`mountLog>paint`](#s-mountLog-paint) · [`picker`](#s-picker) · [`exportJournals`](../../crew/journal.js.md#s-exportJournals) _js/crew/journal.js_ · [`trainingCorpus`](../../crew/learn.js.md#s-trainingCorpus) _js/crew/learn.js_
- via [js/crew/journal.js](../../crew/journal.js.md): `journal.all`
- called by: [`mount`](crew.js.md#s-mount) _js/console/panels/crew.js_

<!-- note:mountLog -->
- L239 · `try { globalThis.navigator?.clipboard?.writeText?.(jsonl).catch(() => {}); } catch {` — no clipboard here
- L248 · `} catch {` — no clipboard on this device; the text is on screen
<!-- /note -->

#### <a id="s-mountLog-paint"></a>`mountLog>paint()`

function · L255–268

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×2 · [`memberOf`](#s-memberOf) · [`recordCard`](#s-recordCard) · [`habitsOf`](../../crew/journal.js.md#s-habitsOf) _js/crew/journal.js_
- via [js/crew/journal.js](../../crew/journal.js.md): `habitsOf.slice`, `journal.of`
- called by: [`mountLog`](#s-mountLog)

<!-- note:mountLog>paint -->
<!-- /note -->
