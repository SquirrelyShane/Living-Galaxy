# js/console/panels/crew.js

[index](../../../../README.md) · 353 lines · 35 symbols · 23 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — CONSOLE › CREW: ROSTER · TALK · BONDS · HOUSE.

The one place to manage everyone aboard: who is posted where and how well
it is going (roster.js + duties.js), talking to them (talkview.js), who
gets on with whom (bonds.js + family.household), and the house rules
(family.social). Built on the console kit; contract PLAN.md §3 CREW, §2.3.

- L325 · `export default {` — ---- panel --------------------------------------------------------------
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `el`, `section`, `note`, `row`, `button`, `group`, `chips`, `setBar`, `card` | [js/console/kit.js](../kit.js.md) |
| 2 | `../../crew/ledger.js` | `crew`, `crewWageTotal`, `firstName`, `genderMark` | [js/crew/ledger.js](../../crew/ledger.js.md) |
| 3 | `../../crew/children.js` | `childrenAboard`, `CHILD_ACTS`, `raise` | [js/crew/children.js](../../crew/children.js.md) |
| 4 | `../../crew/childtalk.js` | `CHILD_TOPICS`, `talkToChild`, `openChildAsk`, `answerChild`, `childTalkLog`, `stageOf` | [js/crew/childtalk.js](../../crew/childtalk.js.md) |
| 5 | `../../crew/tiers.js` | `tiersOf` | [js/crew/tiers.js](../../crew/tiers.js.md) |
| 6 | `../../sim/sim.js` | `sim` | [js/sim/sim.js](../../sim/sim.js.md) |
| 7 | `../../crew/family.js` | `social`, `setSocial`, `loadSocial`, `household`, `settleFamily`, `berthsUsed`, `trustOf` | [js/crew/family.js](../../crew/family.js.md) |
| 8 | `../../crew/romance.js` | `ladderReport`, `STAGE_LABEL`, `stageIndex`, `conceptionOdds`, `fertilityOf`, `privacyAboard`, `kinBetween` | [js/crew/romance.js](../../crew/romance.js.md) |
| 9 | `../../npc/cradle.js` | `GENDERS` | [js/npc/cradle.js](../../npc/cradle.js.md) |
| 10 | `../../npc/captain.js` | `captain`, `transferCommand`, `retakeCommand` | [js/npc/captain.js](../../npc/captain.js.md) |
| 11 | `../../corp/company.js` | `hasCompany`, `company` | [js/corp/company.js](../../corp/company.js.md) |
| 12 | `../../crew/roster.js` | `roster`, `ROSTER_SORTS`, `ROSTER_FILTERS`, `dutyOptions`, `setDuty`, `PHASE_LABEL`, `KIND_LABEL` | [js/crew/roster.js](../../crew/roster.js.md) |
| 13 | `../../crew/bonds.js` | `bondsReport` | [js/crew/bonds.js](../../crew/bonds.js.md) |
| 14 | `../../crew/duties.js` | `duties`, `dutyReport` | [js/crew/duties.js](../../crew/duties.js.md) |
| 15 | `../../crew/talkview.js` | `mountTalk` | [js/crew/talkview.js](../../crew/talkview.js.md) |
| 16 | `../../crew/journal.js` | `journal` | [js/crew/journal.js](../../crew/journal.js.md) |
| 17 | `../../crew/talk.js` | `tierOf`, `TIER_NAMES` | [js/crew/talk.js](../../crew/talk.js.md) |
| 18 | `./crew-gene.js` | `mountGenome`, `mountLog` | [js/console/panels/crew-gene.js](crew-gene.js.md) |
| 19 | `./crew-sky.js` | `mountSky` | [js/console/panels/crew-sky.js](crew-sky.js.md) |
| 20 | `./crew-brig.js` | `mountBrig` | [js/console/panels/crew-brig.js](crew-brig.js.md) |
| 21 | `./crew-gdb.js` | `mountGdb` | [js/console/panels/crew-gdb.js](crew-gdb.js.md) |
| 22 | `../../crew/hooks.js` | `runHooks` | [js/crew/hooks.js](../../crew/hooks.js.md) |
| 23 | `../../crew/beats.js` | `stopAllBeats` | [js/crew/beats.js](../../crew/beats.js.md) |

## Imported by

- [js/console/console.js](../console.js.md) — `default`

## Exports

- `default` · ObjectExpression — used by [js/console/console.js](../console.js.md)

## Effects

- **dom.query** — `small` (rosterCard:95) · `button` (mountHouse>paintDrawn:292) · `[data-id="${…}"]` (mount:342)
- **event.listen** — `change on name → (inline)` (mountHouse:281)

## Symbols

### <a id="s-view"></a>`view`

const · L25–25

<!-- note:view -->
<!-- /note -->

### <a id="s-TIE_GLYPH"></a>`TIE_GLYPH`

const · L26–26

<!-- note:TIE_GLYPH -->
<!-- /note -->

### <a id="s-SORT_LABEL"></a>`SORT_LABEL`

const · L27–27

<!-- note:SORT_LABEL -->
<!-- /note -->

### <a id="s-FILTER_LABEL"></a>`FILTER_LABEL`

const · L28–28

<!-- note:FILTER_LABEL -->
<!-- /note -->

### <a id="s-moraleGlyph"></a>`moraleGlyph(v)`

function · L29–29

- called by: [`rosterCard`](#s-rosterCard)

<!-- note:moraleGlyph -->
<!-- /note -->

### <a id="s-fmtTime"></a>`fmtTime(t)`

function · L30–30

- called by: [`logList`](#s-logList)

<!-- note:fmtTime -->
<!-- /note -->

### <a id="s-logList"></a>`logList(parent, entries, empty)`

function · L32–37

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×5 · [`fmtTime`](#s-fmtTime)
- called by: [`mountBonds`](#s-mountBonds)

<!-- note:logList -->
<!-- /note -->

### <a id="s-mountRoster"></a>`mountRoster(root, ctx)`

function · L39–77

- calls: [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ ×2 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×4 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×2 · [`setBar`](../kit.js.md#s-setBar) _js/console/kit.js_ · [`mountRoster>paintList`](#s-mountRoster-paintList) · [`berthsUsed`](../../crew/family.js.md#s-berthsUsed) _js/crew/family.js_ · [`crewWageTotal`](../../crew/ledger.js.md#s-crewWageTotal) _js/crew/ledger.js_
- via [js/crew/roster.js](../../crew/roster.js.md): `ROSTER_FILTERS.map`, `ROSTER_SORTS.map`
- called by: [`mount`](#s-mount)

<!-- note:mountRoster -->
---- ROSTER -------------------------------------------------------------
<!-- /note -->

#### <a id="s-mountRoster-rebuild"></a>`mountRoster>rebuild()`

function · L56–56

- calls: [`mountRoster>paintList`](#s-mountRoster-paintList)
- called by: [`childCard`](#s-childCard) ×3 · [`mountRoster.onPick`](#s-mountRoster-onPick) · [`mountRoster.onPick~2`](#s-mountRoster-onPick-2) · [`rosterCard`](#s-rosterCard) ×5 · [`rosterCard.onPick`](#s-rosterCard-onPick)

<!-- note:mountRoster>rebuild -->
<!-- /note -->

#### <a id="s-mountRoster-onPick"></a>`mountRoster.onPick(id)`

prop · L57–57

- calls: [`mountRoster>rebuild`](#s-mountRoster-rebuild)

<!-- note:mountRoster.onPick -->
<!-- /note -->

#### <a id="s-mountRoster-onPick-2"></a>`mountRoster.onPick~2(id)`

prop · L58–58

- calls: [`mountRoster>rebuild`](#s-mountRoster-rebuild)

<!-- note:mountRoster.onPick~2 -->
<!-- /note -->

#### <a id="s-mountRoster-paintList"></a>`mountRoster>paintList()`

function · L65–75

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`rosterCard`](#s-rosterCard) · [`roster`](../../crew/roster.js.md#s-roster) _js/crew/roster.js_
- called by: [`mountRoster`](#s-mountRoster) · [`mountRoster>rebuild`](#s-mountRoster-rebuild)

<!-- note:mountRoster>paintList -->
<!-- /note -->

### <a id="s-rosterCard"></a>`rosterCard(r, docked, ctx, rebuild, live)`

function · L79–124

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×6 · [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×9 · [`setBar`](../kit.js.md#s-setBar) _js/console/kit.js_ ×2 · [`moraleGlyph`](#s-moraleGlyph) · [`mountRoster>rebuild`](#s-mountRoster-rebuild) ×5 · [`hasCompany`](../../corp/company.js.md#s-hasCompany) _js/corp/company.js_ ×2 · [`dutyReport`](../../crew/duties.js.md#s-dutyReport) _js/crew/duties.js_ · [`settleFamily`](../../crew/family.js.md#s-settleFamily) _js/crew/family.js_ ×2 · [`trustOf`](../../crew/family.js.md#s-trustOf) _js/crew/family.js_ · [`firstName`](../../crew/ledger.js.md#s-firstName) _js/crew/ledger.js_ · [`genderMark`](../../crew/ledger.js.md#s-genderMark) _js/crew/ledger.js_ · [`dutyOptions`](../../crew/roster.js.md#s-dutyOptions) _js/crew/roster.js_ · [`tierOf`](../../crew/talk.js.md#s-tierOf) _js/crew/talk.js_ · [`tiersOf`](../../crew/tiers.js.md#s-tiersOf) _js/crew/tiers.js_ · [`retakeCommand`](../../npc/captain.js.md#s-retakeCommand) _js/npc/captain.js_ · [`transferCommand`](../../npc/captain.js.md#s-transferCommand) _js/npc/captain.js_
- via [js/crew/roster.js](../../crew/roster.js.md): `dutyOptions.map`
- via [js/crew/duties.js](../../crew/duties.js.md): `dutyReport.find`
- via [js/crew/journal.js](../../crew/journal.js.md): `journal.last`
- called by: [`mountRoster>paintList`](#s-mountRoster-paintList)
- effects: dom.query `small`

<!-- note:rosterCard -->
- L83 · `if (!m.robot) {` — three tracks, named. A number is a readout of a relationship, not one.
- L105 · `const chain = last?.whatMadeMeActThis.reasoning ?? [];` — the last line of a trace is the commitment; the one before it is the reason
- L108 · `const acts = [button("TALK", () => { view.talkId = m.id; ctx.setSub("talk"); }, "accent")]` — actions
<!-- /note -->

#### <a id="s-rosterCard-onPick"></a>`rosterCard.onPick(id)`

prop · L121–121

- calls: [`mountRoster>rebuild`](#s-mountRoster-rebuild) · [`setDuty`](../../crew/roster.js.md#s-setDuty) _js/crew/roster.js_

<!-- note:rosterCard.onPick -->
<!-- /note -->

### <a id="s-mountTalkSub"></a>`mountTalkSub(root, ctx)`

function · L126–139

- calls: [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×2 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ · [`mountTalkSub>refresh`](#s-mountTalkSub-refresh) · [`mountTalkSub>remount`](#s-mountTalkSub-remount) ×2 · [`firstName`](../../crew/ledger.js.md#s-firstName) _js/crew/ledger.js_
- via [js/crew/ledger.js](../../crew/ledger.js.md): `crew.aboard.map`, `crew.aboard.some`
- called by: [`mount`](#s-mount)

<!-- note:mountTalkSub -->
---- TALK ---------------------------------------------------------------
<!-- /note -->

#### <a id="s-mountTalkSub-refresh"></a>`mountTalkSub>refresh()`

function · L132–132

- called by: [`mountTalkSub`](#s-mountTalkSub)

<!-- note:mountTalkSub>refresh -->
<!-- /note -->

#### <a id="s-mountTalkSub-remount"></a>`mountTalkSub>remount()`

function · L133–133

- calls: [`mountTalk`](../../crew/talkview.js.md#s-mountTalk) _js/crew/talkview.js_
- called by: [`mountTalkSub`](#s-mountTalkSub) ×2 · [`mountTalkSub.onPick`](#s-mountTalkSub-onPick)

<!-- note:mountTalkSub>remount -->
<!-- /note -->

##### <a id="s-mountTalkSub-remount-onChange"></a>`mountTalkSub>remount.onChange()`

prop · L133–133

<!-- note:mountTalkSub>remount.onChange -->
<!-- /note -->

#### <a id="s-mountTalkSub-onPick"></a>`mountTalkSub.onPick(id)`

prop · L134–134

- calls: [`mountTalkSub>remount`](#s-mountTalkSub-remount)

<!-- note:mountTalkSub.onPick -->
<!-- /note -->

### <a id="s-childCard"></a>`childCard(root, k, rebuild)`

function · L141–194

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×3 · [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×7 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×8 · [`setBar`](../kit.js.md#s-setBar) _js/console/kit.js_ · [`mountRoster>rebuild`](#s-mountRoster-rebuild) ×3 · [`raise`](../../crew/children.js.md#s-raise) _js/crew/children.js_ · [`answerChild`](../../crew/childtalk.js.md#s-answerChild) _js/crew/childtalk.js_ · [`childTalkLog`](../../crew/childtalk.js.md#s-childTalkLog) _js/crew/childtalk.js_ · [`openChildAsk`](../../crew/childtalk.js.md#s-openChildAsk) _js/crew/childtalk.js_ · [`stageOf`](../../crew/childtalk.js.md#s-stageOf) _js/crew/childtalk.js_ · [`talkToChild`](../../crew/childtalk.js.md#s-talkToChild) _js/crew/childtalk.js_ · [`firstName`](../../crew/ledger.js.md#s-firstName) _js/crew/ledger.js_ ×6
- via [js/crew/childtalk.js](../../crew/childtalk.js.md): `childTalkLog.slice`, `childTalkLog.slice.reverse`
- called by: [`mountBonds`](#s-mountBonds)

<!-- note:childCard -->
One child, and what to do about them.

The genome was always there — an earlier build crossed both parents properly — it was just
never shown, and there was nothing to do with a child for the forty-eight
cycles before they walked off to a hiring hall. What they got from whom, what
it cost them, and four things a captain on a working ship can actually do.

- L146 · `setBar(bondRow.bar, bond / 100, bond >= 55 ? "ok" : bond >= 25 ? "warn" : "hot");` — 0.3.57: the bar was always drawn full
- L154 · `const stage = stageOf(c);` — 0.3.57 — talk WITH them: what you ask, what they ask you, and the transcript
<!-- /note -->

### <a id="s-mountBonds"></a>`mountBonds(root, ctx)`

function · L196–273

- calls: [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×7 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×6 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×4 · [`setBar`](../kit.js.md#s-setBar) _js/console/kit.js_ ×2 · [`childCard`](#s-childCard) · [`logList`](#s-logList) · [`bondsReport`](../../crew/bonds.js.md#s-bondsReport) _js/crew/bonds.js_ · [`childrenAboard`](../../crew/children.js.md#s-childrenAboard) _js/crew/children.js_ · [`firstName`](../../crew/ledger.js.md#s-firstName) _js/crew/ledger.js_ ×5 · [`conceptionOdds`](../../crew/romance.js.md#s-conceptionOdds) _js/crew/romance.js_ · [`fertilityOf`](../../crew/romance.js.md#s-fertilityOf) _js/crew/romance.js_ ×2 · [`kinBetween`](../../crew/romance.js.md#s-kinBetween) _js/crew/romance.js_ · [`ladderReport`](../../crew/romance.js.md#s-ladderReport) _js/crew/romance.js_ · [`stageIndex`](../../crew/romance.js.md#s-stageIndex) _js/crew/romance.js_ ×3
- via [js/crew/ledger.js](../../crew/ledger.js.md): `crew.aboard.find`
- via [js/crew/family.js](../../crew/family.js.md): `household.children.map`, `household.children.map.join`, `household.pregnancies.map`, `household.pregnancies.map.join`
- called by: [`mount`](#s-mount)

<!-- note:mountBonds -->
---- BONDS --------------------------------------------------------------

- L197 · `const lad = section("THE LADDER");` — the ladder first: it is the part that moves, and the part people look for
<!-- /note -->

### <a id="s-mountHouse"></a>`mountHouse(root)`

function · L275–323

- calls: [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ ×6 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×7 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×2 · [`mountHouse>paintDrawn`](#s-mountHouse-paintDrawn) · [`mountHouse>repaintRules`](#s-mountHouse-repaintRules) · [`loadSocial`](../../crew/family.js.md#s-loadSocial) _js/crew/family.js_ · [`setSocial`](../../crew/family.js.md#s-setSocial) _js/crew/family.js_ · [`runHooks`](../../crew/hooks.js.md#s-runHooks) _js/crew/hooks.js_
- via [js/npc/cradle.js](../../npc/cradle.js.md): `GENDERS.map`
- called by: [`mount`](#s-mount)
- effects: event.listen `change`

<!-- note:mountHouse -->
---- HOUSE --------------------------------------------------------------

- L322 · `runHooks("houseRules", rules, { el, section, note, row, button, group, chips, setBar, soci` — the kit as hooks.js documents it, so an addon can build a row that looks
  like every other row instead of hand-rolling its own markup
<!-- /note -->

#### <a id="s-mountHouse-onPick"></a>`mountHouse.onPick(g)`

prop · L284–284

- calls: [`setSocial`](../../crew/family.js.md#s-setSocial) _js/crew/family.js_

<!-- note:mountHouse.onPick -->
<!-- /note -->

#### <a id="s-mountHouse-onPick-2"></a>`mountHouse.onPick~2(g)`

prop · L286–291

- calls: [`mountHouse>paintDrawn`](#s-mountHouse-paintDrawn) · [`setSocial`](../../crew/family.js.md#s-setSocial) _js/crew/family.js_

<!-- note:mountHouse.onPick~2 -->
<!-- /note -->

#### <a id="s-mountHouse-paintDrawn"></a>`mountHouse>paintDrawn()`

function · L292–292

- called by: [`mountHouse`](#s-mountHouse) · [`mountHouse.onPick~2`](#s-mountHouse-onPick-2)
- effects: dom.query `button`

<!-- note:mountHouse>paintDrawn -->
<!-- /note -->

#### <a id="s-mountHouse-onPick-3"></a>`mountHouse.onPick~3(v)`

prop · L299–299

- calls: [`mountHouse>repaintRules`](#s-mountHouse-repaintRules) · [`setSocial`](../../crew/family.js.md#s-setSocial) _js/crew/family.js_

<!-- note:mountHouse.onPick~3 -->
<!-- /note -->

#### <a id="s-mountHouse-onPick-4"></a>`mountHouse.onPick~4(v)`

prop · L301–301

- calls: [`mountHouse>repaintRules`](#s-mountHouse-repaintRules) · [`setSocial`](../../crew/family.js.md#s-setSocial) _js/crew/family.js_

<!-- note:mountHouse.onPick~4 -->
<!-- /note -->

#### <a id="s-mountHouse-onPick-5"></a>`mountHouse.onPick~5(v)`

prop · L304–304

- calls: [`mountHouse>repaintRules`](#s-mountHouse-repaintRules) · [`setSocial`](../../crew/family.js.md#s-setSocial) _js/crew/family.js_

<!-- note:mountHouse.onPick~5 -->
<!-- /note -->

#### <a id="s-mountHouse-onPick-6"></a>`mountHouse.onPick~6(v)`

prop · L307–307

- calls: [`mountHouse>repaintRules`](#s-mountHouse-repaintRules) · [`setSocial`](../../crew/family.js.md#s-setSocial) _js/crew/family.js_

<!-- note:mountHouse.onPick~6 -->
<!-- /note -->

#### <a id="s-mountHouse-repaintRules"></a>`mountHouse>repaintRules()`

function · L312–319

- calls: [`loadSocial`](../../crew/family.js.md#s-loadSocial) _js/crew/family.js_ · [`privacyAboard`](../../crew/romance.js.md#s-privacyAboard) _js/crew/romance.js_
- called by: [`mountHouse`](#s-mountHouse) · [`mountHouse.onPick~3`](#s-mountHouse-onPick-3) · [`mountHouse.onPick~4`](#s-mountHouse-onPick-4) · [`mountHouse.onPick~5`](#s-mountHouse-onPick-5) · [`mountHouse.onPick~6`](#s-mountHouse-onPick-6)

<!-- note:mountHouse>repaintRules -->
<!-- /note -->

### <a id="s-mount"></a>`mount(root, ctx)`

prop · L330–343

- calls: [`mountBrig`](crew-brig.js.md#s-mountBrig) _js/console/panels/crew-brig.js_ · [`mountGdb`](crew-gdb.js.md#s-mountGdb) _js/console/panels/crew-gdb.js_ · [`mountGenome`](crew-gene.js.md#s-mountGenome) _js/console/panels/crew-gene.js_ · [`mountLog`](crew-gene.js.md#s-mountLog) _js/console/panels/crew-gene.js_ · [`mountSky`](crew-sky.js.md#s-mountSky) _js/console/panels/crew-sky.js_ · [`mountBonds`](#s-mountBonds) · [`mountHouse`](#s-mountHouse) · [`mountRoster`](#s-mountRoster) · [`mountTalkSub`](#s-mountTalkSub)
- effects: dom.query `[data-id="${…}"]`

<!-- note:mount -->
<!-- /note -->

### <a id="s-paint"></a>`paint()`

prop · L344–344

<!-- note:paint -->
- L344 · `paint() {` — refreshers pushed via ctx.push do the work
<!-- /note -->

### <a id="s-unmount"></a>`unmount()`

prop · L345–345

- calls: [`stopAllBeats`](../../crew/beats.js.md#s-stopAllBeats) _js/crew/beats.js_

<!-- note:unmount -->
<!-- /note -->

### <a id="s-search"></a>`search()`

prop · L346–352

- via [js/crew/ledger.js](../../crew/ledger.js.md): `crew.aboard.map`

<!-- note:search -->
one hit per hand
<!-- /note -->

#### <a id="s-search-run"></a>`search.run()`

prop · L350–350

<!-- note:search.run -->
<!-- /note -->
