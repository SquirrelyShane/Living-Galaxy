# js/console/panels/corp-town.js

[index](../../../../README.md) · 221 lines · 12 symbols · 10 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — CONSOLE › CORP › TOWN: the company's people, on the line.

Was a read-only list (corp.js, to 0.3.45). Now every row opens the company
line to that person (js/station/staffline.js): what they say, what the two of you
last said, and what you can do about it from wherever you are — a bonus, a
bigger cut, a push for promotion, passage to another port or out to the
ship, a clean release. Above the towns is THE LINE: what they called about,
newest first, with the answers an ask would take right there on the row.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `button`, `el`, `note`, `row`, `section`, `setBar`, `chips` | [js/console/kit.js](../kit.js.md) |
| 2 | `../../sim/sim.js` | `sim` | [js/sim/sim.js](../../sim/sim.js.md) |
| 3 | `../../corp/company.js` | `company`, `hasCompany` | [js/corp/company.js](../../corp/company.js.md) |
| 4 | `../../station/stationlife.js` | `townReport`, `townLog`, `townLine`, `roleAt` | [js/station/stationlife.js](../../station/stationlife.js.md) |
| 5 | `../../npc/cradle.js` | `cradle`, `traitLine` | [js/npc/cradle.js](../../npc/cradle.js.md) |
| 6 | `../../station/stafflife.js` | `lifeLine`, `needsLine`, `dayLogOf` | [js/station/stafflife.js](../../station/stafflife.js.md) |
| 7 | `../../station/stationclock.js` | `clockLine` | [js/station/stationclock.js](../../station/stationclock.js.md) |
| 8 | `../../station/staffcare.js` | `CARE`, `careAct`, `setHousing`, `setHours`, `setJob`, `setShift`, `termsLine`, `workOptions` | [js/station/staffcare.js](../../station/staffcare.js.md) |
| 9 | `../../ui/glyphs.js` | `sigil` | [js/ui/glyphs.js](../../ui/glyphs.js.md) |
| 10 | `../../station/staffline.js` | `TOPICS`, `callTopic`, `cutOf`, `lineLog`, `lineState`, `lineSummary`, `markRead`, `openAsk`, `regardOf`, `staffById`, `topicById`, `unread`, `whereOf` | [js/station/staffline.js](../../station/staffline.js.md) |

## Imported by

- [js/console/panels/corp.js](corp.js.md) — `mountTown`

## Exports

- [`mountTown`](#s-mountTown) · function — used by [js/console/panels/corp.js](corp.js.md)
- `default` · Identifier — **no importer in scanned roots**

## Effects

- **dom.query** — `[data-focus="${…}"]` (mountTown>paint:215)
- **event.listen** — `change on sel → (inline)` (careBlock>pick:37)
- **input.key** — `Shift` (careBlock:41)

## Symbols

### <a id="s-view"></a>`view`

const · L15–15

<!-- note:view -->
<!-- /note -->

### <a id="s-ago"></a>`ago(at)`

function · L16–16

- called by: [`mountTown>paint`](#s-mountTown-paint) ×2

<!-- note:ago -->
<!-- /note -->

### <a id="s-moodWord"></a>`moodWord(m)`

function · L17–17

- called by: [`lineCard`](#s-lineCard)

<!-- note:moodWord -->
<!-- /note -->

### <a id="s-act"></a>`act(staffId, topicId, arg, render)`

function · L19–26

- calls: [`mountTown>render`](#s-mountTown-render) · [`callTopic`](../../station/staffline.js.md#s-callTopic) _js/station/staffline.js_ · [`staffById`](../../station/staffline.js.md#s-staffById) _js/station/staffline.js_
- called by: [`lineCard`](#s-lineCard) · [`lineCard.onPick`](#s-lineCard-onPick) · [`mountTown>paint`](#s-mountTown-paint)

<!-- note:act -->
<!-- /note -->

### <a id="s-careBlock"></a>`careBlock(s, render)`

function · L28–55

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×5 · [`careBlock>pick`](#s-careBlock-pick) ×4 · [`mountTown>render`](#s-mountTown-render) · [`careAct`](../../station/staffcare.js.md#s-careAct) _js/station/staffcare.js_ · [`termsLine`](../../station/staffcare.js.md#s-termsLine) _js/station/staffcare.js_ · [`workOptions`](../../station/staffcare.js.md#s-workOptions) _js/station/staffcare.js_
- called by: [`lineCard`](#s-lineCard)
- effects: input.key `Shift`

<!-- note:careBlock -->
0.3.53 — WORK · HOME · CARE (js/station/staffcare.js): the settled hand's menu
<!-- /note -->

#### <a id="s-careBlock-pick"></a>`careBlock>pick(list, cur, fn, aria)`

function · L32–39

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×2 · [`mountTown>render`](#s-mountTown-render)
- called by: [`careBlock`](#s-careBlock) ×4
- effects: event.listen `change`

<!-- note:careBlock>pick -->
<!-- /note -->

### <a id="s-lineCard"></a>`lineCard(s, render)`

function · L57–122

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ · [`chips`](../kit.js.md#s-chips) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×17 · [`act`](#s-act) · [`careBlock`](#s-careBlock) · [`moodWord`](#s-moodWord) · [`mountTown>render`](#s-mountTown-render) ×2 · [`traitLine`](../../npc/cradle.js.md#s-traitLine) _js/npc/cradle.js_ · [`dayLogOf`](../../station/stafflife.js.md#s-dayLogOf) _js/station/stafflife.js_ · [`lifeLine`](../../station/stafflife.js.md#s-lifeLine) _js/station/stafflife.js_ · [`needsLine`](../../station/stafflife.js.md#s-needsLine) _js/station/stafflife.js_ · [`cutOf`](../../station/staffline.js.md#s-cutOf) _js/station/staffline.js_ · [`lineLog`](../../station/staffline.js.md#s-lineLog) _js/station/staffline.js_ · [`openAsk`](../../station/staffline.js.md#s-openAsk) _js/station/staffline.js_ · [`regardOf`](../../station/staffline.js.md#s-regardOf) _js/station/staffline.js_ · [`topicById`](../../station/staffline.js.md#s-topicById) _js/station/staffline.js_ ×2 · [`whereOf`](../../station/staffline.js.md#s-whereOf) _js/station/staffline.js_ · [`roleAt`](../../station/stationlife.js.md#s-roleAt) _js/station/stationlife.js_ · [`sigil`](../../ui/glyphs.js.md#s-sigil) _js/ui/glyphs.js_
- via [js/npc/cradle.js](../../npc/cradle.js.md): `cradle.get`
- via [js/station/staffline.js](../../station/staffline.js.md): `TOPICS.map`, `TOPICS.map.join`, `lineLog.slice`, `lineLog.slice.reverse`, `topicById.label.toLowerCase`
- called by: [`mountTown>paint`](#s-mountTown-paint)

<!-- note:lineCard -->
The open line to one person: who they are now, the transcript, what you can do.

- L74 · `` body.append(el("p", "warm", `Now: ${lifeLine(s)}`)); `` — 0.3.52: their day — what they are doing now, how they are holding up, and the log
- L84 · `const log = lineLog(s, 6).slice().reverse();` — the transcript, oldest at the top so it reads like a call
<!-- /note -->

#### <a id="s-lineCard-onPick"></a>`lineCard.onPick(id)`

prop · L118–118

- calls: [`act`](#s-act)

<!-- note:lineCard.onPick -->
<!-- /note -->

### <a id="s-mountTown"></a>`mountTown(root, ctx=)`

function · **exported** · L124–219

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`mountTown>paint`](#s-mountTown-paint) · [`staffById`](../../station/staffline.js.md#s-staffById) _js/station/staffline.js_
- called by: [`SUBS.town`](corp.js.md#s-SUBS-town) _js/console/panels/corp.js_

<!-- note:mountTown -->
<!-- /note -->

#### <a id="s-mountTown-render"></a>`mountTown>render()`

function · L129–132

- calls: [`mountTown>paint`](#s-mountTown-paint)
- called by: [`act`](#s-act) · [`careBlock`](#s-careBlock) · [`careBlock>pick`](#s-careBlock-pick) · [`lineCard`](#s-lineCard) ×2 · [`mountTown>paint`](#s-mountTown-paint) ×4

<!-- note:mountTown>render -->
<!-- /note -->

#### <a id="s-mountTown-signature"></a>`mountTown>signature()`

function · L133–136

- calls: [`hasCompany`](../../corp/company.js.md#s-hasCompany) _js/corp/company.js_ ×2 · [`lineState`](../../station/staffline.js.md#s-lineState) _js/station/staffline.js_ · [`unread`](../../station/staffline.js.md#s-unread) _js/station/staffline.js_
- via [js/corp/company.js](../../corp/company.js.md): `company.staff.map`, `company.staff.map.join`
- called by: [`mountTown>paint`](#s-mountTown-paint)

<!-- note:mountTown>signature -->
<!-- /note -->

#### <a id="s-mountTown-paint"></a>`mountTown>paint()`

function · L137–216

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×5 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×3 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×5 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×3 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×5 · [`setBar`](../kit.js.md#s-setBar) _js/console/kit.js_ · [`act`](#s-act) · [`ago`](#s-ago) ×2 · [`lineCard`](#s-lineCard) · [`mountTown>render`](#s-mountTown-render) ×4 · [`mountTown>signature`](#s-mountTown-signature) · [`hasCompany`](../../corp/company.js.md#s-hasCompany) _js/corp/company.js_ · [`lifeLine`](../../station/stafflife.js.md#s-lifeLine) _js/station/stafflife.js_ · [`cutOf`](../../station/staffline.js.md#s-cutOf) _js/station/staffline.js_ ×2 · [`lineState`](../../station/staffline.js.md#s-lineState) _js/station/staffline.js_ · [`lineSummary`](../../station/staffline.js.md#s-lineSummary) _js/station/staffline.js_ · [`markRead`](../../station/staffline.js.md#s-markRead) _js/station/staffline.js_ ×4 · [`openAsk`](../../station/staffline.js.md#s-openAsk) _js/station/staffline.js_ ×4 · [`staffById`](../../station/staffline.js.md#s-staffById) _js/station/staffline.js_ · [`topicById`](../../station/staffline.js.md#s-topicById) _js/station/staffline.js_ · [`unread`](../../station/staffline.js.md#s-unread) _js/station/staffline.js_ · [`whereOf`](../../station/staffline.js.md#s-whereOf) _js/station/staffline.js_ · [`clockLine`](../../station/stationclock.js.md#s-clockLine) _js/station/stationclock.js_ · [`townLine`](../../station/stationlife.js.md#s-townLine) _js/station/stationlife.js_ · [`townLog`](../../station/stationlife.js.md#s-townLog) _js/station/stationlife.js_ · [`townReport`](../../station/stationlife.js.md#s-townReport) _js/station/stationlife.js_
- called by: [`mountTown`](#s-mountTown) · [`mountTown>render`](#s-mountTown-render)
- effects: dom.query `[data-focus="${…}"]`

<!-- note:mountTown>paint -->
- L150 · `const L = lineState();` — ---- THE LINE: they called you ----
<!-- /note -->
