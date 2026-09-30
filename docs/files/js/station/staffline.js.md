# js/station/staffline.js

[index](../../../README.md) · 420 lines · 66 symbols · 8 imports · 7 importers

## About

<!-- note:@file -->
LIVING GALAXY — the company line.

Settling a hand used to be the last time you spoke to them. They went onto
the rolls, a number arrived every cycle, and the only things you could
still do were read a row in CON › CORP › TOWN or fly all the way back and
RECALL them from the hall. Everything that happened to them after that —
a promotion, a wedding, a child, a strike — was a line in a log.

This is the other end of the phone. Every member of staff in this sky is on
the company line, and it runs both ways:

  YOU CALL     CALL opens the line to one person. What they say is read off
               their actual life: role, cycles served, mood, household,
               the last thing the town log wrote about them. What you can
               do on it moves real numbers — a bonus out of the treasury,
               a bigger cut, a push for promotion, passage to another
               port, passage out to meet the ship, or a clean release.

  THEY CALL    what happens to them in the rolls (stationlife.js) lands in
               the company INBOX as a message from them, and a member whose
               mood is sliding asks for something before they walk. An ask
               carries the answers that would actually settle it; one left
               unanswered for three cycles costs mood.

REGARD is the new number: what they think of you as an employer, carried
over from their trust aboard when they settled. It lifts the mood their
port drifts them toward, which is what keeps someone on the rolls. Mood is
what the rolls already had; regard is what you can do about it from orbit.

No DOM. The console draws it (js/console/panels/corp-town.js).
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../corp/company.js` | `company`, `hasCompany`, `payOffAndRecord`, `COMPANY` | [js/corp/company.js](../corp/company.js.md) |
| 2 | `./stations.js` | `stationById` | [js/station/stations.js](stations.js.md) |
| 3 | `../npc/cradle.js` | `cradle`, `PRONOUNS` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 4 | `../sim/sim.js` | `logEvent`, `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 5 | `./stationlife.js` | `ROLES`, `roleAt`, `roleIndex`, `incomeOf`, `stationLife` | [js/station/stationlife.js](stationlife.js.md) |
| 6 | `../crew/ledger.js` | `CYCLE_SECONDS` | [js/crew/ledger.js](../crew/ledger.js.md) |
| 7 | `./stafflife.js` | `nowOf` | [js/station/stafflife.js](stafflife.js.md) |
| 8 | `./stationclock.js` | `clockAt` | [js/station/stationclock.js](stationclock.js.md) |

## Imported by

- [js/console/panels/corp-town.js](../console/panels/corp-town.js.md) — `TOPICS`, `callTopic`, `cutOf`, `lineLog`, `lineState`, `lineSummary`, `markRead`, `openAsk`, `regardOf`, `staffById`, `topicById`, `unread`, `whereOf`
- [js/console/panels/corp.js](../console/panels/corp.js.md) — `lineSummary`, `unread`
- [js/corp/company.js](../corp/company.js.md) — `tickLine`, `cutOf`
- [js/station/deckhall.js](deckhall.js.md) — `TOPICS`, `callTopic`, `lineLog`, `openAsk`, `regardOf`, `cutOf`, `topicById`
- [js/station/stationlife.js](stationlife.js.md) — `hearFrom`, `moodLift`
- test/line.test.mjs _(outside js/)_ — `LN`
- test/stafflife.test.mjs _(outside js/)_ — `LN`

## Exports

- [`LINE`](#s-LINE) · const — **no importer in scanned roots**
- [`lineState`](#s-lineState) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md)
- [`staffById`](#s-staffById) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md)
- [`regardOf`](#s-regardOf) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md)
- [`moodLift`](#s-moodLift) · function — used by [js/station/stationlife.js](stationlife.js.md)
- [`cutOf`](#s-cutOf) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/corp/company.js](../corp/company.js.md), [js/station/deckhall.js](deckhall.js.md)
- [`whereOf`](#s-whereOf) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md)
- [`lineLog`](#s-lineLog) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md)
- [`bonusCost`](#s-bonusCost) · function — **no importer in scanned roots**
- [`promoteCost`](#s-promoteCost) · function — **no importer in scanned roots**
- [`passage`](#s-passage) · function — **no importer in scanned roots**
- [`destinations`](#s-destinations) · function — **no importer in scanned roots**
- [`TOPICS`](#s-TOPICS) · const — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md)
- [`topicById`](#s-topicById) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md)
- [`callTopic`](#s-callTopic) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md)
- [`hearFrom`](#s-hearFrom) · function — used by [js/station/stationlife.js](stationlife.js.md)
- [`openAsk`](#s-openAsk) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/station/deckhall.js](deckhall.js.md)
- [`unread`](#s-unread) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md)
- [`markRead`](#s-markRead) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md)
- [`tickLine`](#s-tickLine) · function — used by [js/corp/company.js](../corp/company.js.md)
- [`lineSummary`](#s-lineSummary) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-LINE"></a>`LINE`

const · **exported** · L10–26

<!-- note:LINE -->
- L11 · `bonusCycles: 3,` — a bonus is this many cycles of what they bring in
- L12 · `bonusCooldown: 3,` — cycles between bonuses to the same person
- L13 · `raiseStep: 0.1,` — each raise gives them this much more of the share they earn
- L14 · `raiseMax: 3,` — and there are only so many
- L15 · `promoteCost: 5,` — cycles of income a sponsored promotion costs
- L16 · `promoteServe: 8,` — cycles per rung a sponsored promotion wants (the rolls want 14)
- L17 · `fareBase: 180,` — passage between ports
- L18 · `farePerMm: 40,` — …plus this per million units
- L19 · `transitMin: 45,` — sky seconds a trip takes at the least
- L20 · `transitPerMm: 30,` — …plus this per million units
- L21 · `askBelow: 48,` — mood under this and they ask for something
- L22 · `askEvery: 6,` — cycles between asks from one person
- L23 · `askPatience: 3,` — cycles an ask waits before it costs mood
- L25 · `logMax: 10,` — exchanges remembered per person
<!-- /note -->

### <a id="s-lineState"></a>`lineState()`

function · **exported** · L28–32

- called by: [`mountTown>paint`](../console/panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ · [`mountTown>signature`](../console/panels/corp-town.js.md#s-mountTown-signature) _js/console/panels/corp-town.js_ · [`TOPICS.run~8`](#s-TOPICS-run-8) · [`callTopic`](#s-callTopic) · [`markRead`](#s-markRead) · [`openAsk`](#s-openAsk) · [`post`](#s-post) · [`unread`](#s-unread)

<!-- note:lineState -->
---- state lives on the company, so it saves and syncs with it ------------
<!-- /note -->

### <a id="s-inThisSky"></a>`inThisSky(s)`

function · L34–34

- called by: [`callTopic`](#s-callTopic) · [`destinations`](#s-destinations) · [`tickLine`](#s-tickLine) · [`whereOf`](#s-whereOf)

<!-- note:inThisSky -->
<!-- /note -->

### <a id="s-cycleNow"></a>`cycleNow()`

function · L35–35

- called by: [`TOPICS.ok~2`](#s-TOPICS-ok-2) · [`TOPICS.run`](#s-TOPICS-run) · [`TOPICS.run~2`](#s-TOPICS-run-2) · [`pick`](#s-pick) · [`post`](#s-post) · [`tickLine`](#s-tickLine)

<!-- note:cycleNow -->
<!-- /note -->

### <a id="s-first"></a>`first(s)`

function · L36–36 · **never referenced**

<!-- note:first -->
<!-- /note -->

### <a id="s-prOf"></a>`prOf(s)`

function · L37–37 · **never referenced**

<!-- note:prOf -->
<!-- /note -->

### <a id="s-tr"></a>`tr(s, k)`

function · L38–38

- called by: [`TOPICS.run~2`](#s-TOPICS-run-2) · [`TOPICS.run~6`](#s-TOPICS-run-6) ×2 · [`tickLine`](#s-tickLine) ×3

<!-- note:tr -->
<!-- /note -->

### <a id="s-listOf"></a>`listOf(s)`

function · L39–39

- called by: [`TOPICS.hint~8`](#s-TOPICS-hint-8) · [`TOPICS.ok~8`](#s-TOPICS-ok-8) ×2 · [`TOPICS.run~8`](#s-TOPICS-run-8)

<!-- note:listOf -->
Their list wage — what a pay-off's severance is counted in.
<!-- /note -->

### <a id="s-staffById"></a>`staffById(id)`

function · **exported** · L41–43

- via [js/corp/company.js](../corp/company.js.md): `company.staff.find`
- called by: [`act`](../console/panels/corp-town.js.md#s-act) _js/console/panels/corp-town.js_ · [`mountTown`](../console/panels/corp-town.js.md#s-mountTown) _js/console/panels/corp-town.js_ · [`mountTown>paint`](../console/panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ · [`callTopic`](#s-callTopic) · [`hearFrom`](#s-hearFrom) · [`household`](#s-household)

<!-- note:staffById -->
<!-- /note -->

### <a id="s-regardOf"></a>`regardOf(s)`

function · **exported** · L45–49

- called by: [`lineCard`](../console/panels/corp-town.js.md#s-lineCard) _js/console/panels/corp-town.js_ · [`lineCard`](deckhall.js.md#s-lineCard) _js/station/deckhall.js_ · [`bumpRegard`](#s-bumpRegard) · [`moodLift`](#s-moodLift) · [`tickLine`](#s-tickLine)

<!-- note:regardOf -->
What they think of you as an employer, 0..100. Seeded from their trust aboard.
<!-- /note -->

### <a id="s-bumpRegard"></a>`bumpRegard(s, d)`

function · L50–50

- calls: [`regardOf`](#s-regardOf)
- called by: [`TOPICS.run`](#s-TOPICS-run) · [`TOPICS.run~2`](#s-TOPICS-run-2) · [`TOPICS.run~3`](#s-TOPICS-run-3) · [`TOPICS.run~4`](#s-TOPICS-run-4) · [`TOPICS.run~5`](#s-TOPICS-run-5) · [`TOPICS.run~6`](#s-TOPICS-run-6) · [`tickLine`](#s-tickLine)

<!-- note:bumpRegard -->
<!-- /note -->

### <a id="s-moodLift"></a>`moodLift(s)`

function · **exported** · L52–54

- calls: [`regardOf`](#s-regardOf)
- called by: [`tickStationLife`](stationlife.js.md#s-tickStationLife) _js/station/stationlife.js_

<!-- note:moodLift -->
How far their regard and their raises lift the mood their port pulls them
toward. stationlife.js adds this to its target every cycle.
<!-- /note -->

### <a id="s-cutOf"></a>`cutOf(s)`

function · **exported** · L56–58

- called by: [`lineCard`](../console/panels/corp-town.js.md#s-lineCard) _js/console/panels/corp-town.js_ · [`mountTown>paint`](../console/panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ ×2 · [`boardBrief`](../corp/company.js.md#s-boardBrief) _js/corp/company.js_ · [`tickCompany`](../corp/company.js.md#s-tickCompany) _js/corp/company.js_ · [`floorSection`](deckhall.js.md#s-floorSection) _js/station/deckhall.js_ · [`lineCard`](deckhall.js.md#s-lineCard) _js/station/deckhall.js_ · [`TOPICS.hint~3`](#s-TOPICS-hint-3)

<!-- note:cutOf -->
The share they bring in after any raise you gave them.
<!-- /note -->

### <a id="s-whereOf"></a>`whereOf(s)`

function · **exported** · L60–68

- calls: [`inThisSky`](#s-inThisSky) · [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_ ×2
- called by: [`lineCard`](../console/panels/corp-town.js.md#s-lineCard) _js/console/panels/corp-town.js_ · [`mountTown>paint`](../console/panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ · [`checkIn`](#s-checkIn)

<!-- note:whereOf -->
Where they are, or where they are going.
<!-- /note -->

### <a id="s-say"></a>`say(s, who, text)`

function · L70–75

- called by: [`callTopic`](#s-callTopic) ×2 · [`post`](#s-post)

<!-- note:say -->
---- the transcript --------------------------------------------------------
<!-- /note -->

### <a id="s-lineLog"></a>`lineLog(s, n=)`

function · **exported** · L76–76

- called by: [`lineCard`](../console/panels/corp-town.js.md#s-lineCard) _js/console/panels/corp-town.js_ · [`lineCard`](deckhall.js.md#s-lineCard) _js/station/deckhall.js_

<!-- note:lineLog -->
<!-- /note -->

### <a id="s-pick"></a>`pick(s, topic, arr)`

function · L78–83

- calls: [`cycleNow`](#s-cycleNow)
- called by: [`TOPICS.run~2`](#s-TOPICS-run-2) ×2 · [`TOPICS.run~3`](#s-TOPICS-run-3) · [`TOPICS.run~4`](#s-TOPICS-run-4) · [`TOPICS.run~5`](#s-TOPICS-run-5) ×2 · [`TOPICS.run~6`](#s-TOPICS-run-6) ×2 · [`TOPICS.run~8`](#s-TOPICS-run-8) · [`checkIn`](#s-checkIn) ×11 · [`tickLine`](#s-tickLine) ×4

<!-- note:pick -->
One seeded pick per person per cycle per topic — the same call twice in a
cycle reads the same, a new cycle reads fresh.
<!-- /note -->

### <a id="s-moodWord"></a>`moodWord(m)`

function · L85–87 · **never referenced**

<!-- note:moodWord -->
<!-- /note -->

### <a id="s-household"></a>`household(s)`

function · L89–97

- calls: [`staffById`](#s-staffById)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- via [js/station/stationlife.js](stationlife.js.md): `stationLife.kids.find`
- called by: [`TOPICS.hint~5`](#s-TOPICS-hint-5) · [`TOPICS.run~5`](#s-TOPICS-run-5) · [`checkIn`](#s-checkIn)

<!-- note:household -->
---- what they can say, read off their real life ---------------------------
<!-- /note -->

### <a id="s-lastNews"></a>`lastNews(s)`

function · L99–101

- via [js/station/stationlife.js](stationlife.js.md): `stationLife.log.find`
- called by: [`checkIn`](#s-checkIn)

<!-- note:lastNews -->
<!-- /note -->

### <a id="s-checkIn"></a>`checkIn(s)`

function · L103–136

- calls: [`nowOf`](stafflife.js.md#s-nowOf) _js/station/stafflife.js_ · [`household`](#s-household) · [`lastNews`](#s-lastNews) · [`pick`](#s-pick) ×11 · [`whereOf`](#s-whereOf) · [`clockAt`](stationclock.js.md#s-clockAt) _js/station/stationclock.js_ · [`roleAt`](stationlife.js.md#s-roleAt) _js/station/stationlife.js_
- via [js/station/stationlife.js](stationlife.js.md): `roleAt.label.toLowerCase`
- called by: [`TOPICS.run`](#s-TOPICS-run)

<!-- note:checkIn -->
- L111 · `const now = nowOf(s, sim.time ?? 0);` — 0.3.52: they are somewhere, doing something, at an hour of their day
<!-- /note -->

### <a id="s-payFrom"></a>`payFrom(amount, text)`

function · L138–142

- calls: [`bookLine`](#s-bookLine) ×2
- called by: [`TOPICS.run~2`](#s-TOPICS-run-2) · [`TOPICS.run~4`](#s-TOPICS-run-4) · [`TOPICS.run~6`](#s-TOPICS-run-6)

<!-- note:payFrom -->
---- topics ------------------------------------------------------------------
Each: { id, label, hint(s) → string, ok(s) → null | reason, run(s, arg) → line }.
`ok` returning a string greys the button with that reason. Money comes out of
the treasury first and your pocket if the company cannot cover it.
<!-- /note -->

### <a id="s-bookLine"></a>`bookLine(text, delta)`

function · L143–147

- via [js/corp/company.js](../corp/company.js.md): `company.book.unshift`
- called by: [`TOPICS.run~3`](#s-TOPICS-run-3) · [`payFrom`](#s-payFrom) ×2

<!-- note:bookLine -->
<!-- /note -->

### <a id="s-canPay"></a>`canPay(amount)`

function · L148–148

- called by: [`TOPICS.ok~2`](#s-TOPICS-ok-2) · [`TOPICS.ok~4`](#s-TOPICS-ok-4) · [`TOPICS.ok~7`](#s-TOPICS-ok-7)

<!-- note:canPay -->
<!-- /note -->

### <a id="s-bonusCost"></a>`bonusCost(s)`

function · **exported** · L150–150

- calls: [`incomeOf`](stationlife.js.md#s-incomeOf) _js/station/stationlife.js_
- called by: [`TOPICS.hint~2`](#s-TOPICS-hint-2) · [`TOPICS.ok~2`](#s-TOPICS-ok-2) ×2 · [`TOPICS.run~2`](#s-TOPICS-run-2)

<!-- note:bonusCost -->
<!-- /note -->

### <a id="s-promoteCost"></a>`promoteCost(s)`

function · **exported** · L151–151

- calls: [`incomeOf`](stationlife.js.md#s-incomeOf) _js/station/stationlife.js_
- called by: [`TOPICS.hint~4`](#s-TOPICS-hint-4) · [`TOPICS.ok~4`](#s-TOPICS-ok-4) ×2 · [`TOPICS.run~4`](#s-TOPICS-run-4)

<!-- note:promoteCost -->
<!-- /note -->

### <a id="s-passage"></a>`passage(fromId, toId)`

function · **exported** · L153–157

- calls: [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_ ×2
- called by: [`TOPICS.ok~7`](#s-TOPICS-ok-7) ×2 · [`TOPICS.options`](#s-TOPICS-options) ×2 · [`TOPICS.run~6`](#s-TOPICS-run-6)

<!-- note:passage -->
Passage from one port to another: a fare and a flight time off the distance.
<!-- /note -->

### <a id="s-destinations"></a>`destinations(s)`

function · **exported** · L159–166

- calls: [`inThisSky`](#s-inThisSky) · [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`TOPICS.ok~6`](#s-TOPICS-ok-6) · [`TOPICS.options`](#s-TOPICS-options) · [`tickLine`](#s-tickLine)

<!-- note:destinations -->
Ports a member could be moved to: where the company has people, its office, and where you are docked.
<!-- /note -->

### <a id="s-TOPICS"></a>`TOPICS`

const · **exported** · L168–309

<!-- note:TOPICS -->
<!-- /note -->

#### <a id="s-TOPICS-hint"></a>`TOPICS.hint()`

prop · L171–171

<!-- note:TOPICS.hint -->
<!-- /note -->

#### <a id="s-TOPICS-ok"></a>`TOPICS.ok()`

prop · L172–172

<!-- note:TOPICS.ok -->
<!-- /note -->

#### <a id="s-TOPICS-run"></a>`TOPICS.run(s)`

prop · L173–180

- calls: [`nowOf`](stafflife.js.md#s-nowOf) _js/station/stafflife.js_ · [`bumpRegard`](#s-bumpRegard) · [`checkIn`](#s-checkIn) · [`cycleNow`](#s-cycleNow)

<!-- note:TOPICS.run -->
- L176 · `const asleep = !s.transit && nowOf(s, sim.time ?? 0).id === "sleep";` — waking someone to ask how they are is still asking, but it costs a little
<!-- /note -->

#### <a id="s-TOPICS-hint-2"></a>`TOPICS.hint~2(s)`

prop · L184–184

- calls: [`bonusCost`](#s-bonusCost)

<!-- note:TOPICS.hint~2 -->
<!-- /note -->

#### <a id="s-TOPICS-ok-2"></a>`TOPICS.ok~2(s)`

prop · L185–189

- calls: [`bonusCost`](#s-bonusCost) ×2 · [`canPay`](#s-canPay) · [`cycleNow`](#s-cycleNow)

<!-- note:TOPICS.ok~2 -->
<!-- /note -->

#### <a id="s-TOPICS-run-2"></a>`TOPICS.run~2(s)`

prop · L190–200

- calls: [`bonusCost`](#s-bonusCost) · [`bumpRegard`](#s-bumpRegard) · [`cycleNow`](#s-cycleNow) · [`payFrom`](#s-payFrom) · [`pick`](#s-pick) ×2 · [`settleAsk`](#s-settleAsk) · [`tr`](#s-tr)

<!-- note:TOPICS.run~2 -->
<!-- /note -->

#### <a id="s-TOPICS-hint-3"></a>`TOPICS.hint~3(s)`

prop · L204–204

- calls: [`cutOf`](#s-cutOf) · [`incomeOf`](stationlife.js.md#s-incomeOf) _js/station/stationlife.js_

<!-- note:TOPICS.hint~3 -->
<!-- /note -->

#### <a id="s-TOPICS-ok-3"></a>`TOPICS.ok~3(s)`

prop · L205–205

<!-- note:TOPICS.ok~3 -->
<!-- /note -->

#### <a id="s-TOPICS-run-3"></a>`TOPICS.run~3(s)`

prop · L206–213

- calls: [`bookLine`](#s-bookLine) · [`bumpRegard`](#s-bumpRegard) · [`pick`](#s-pick) · [`settleAsk`](#s-settleAsk)

<!-- note:TOPICS.run~3 -->
<!-- /note -->

#### <a id="s-TOPICS-hint-4"></a>`TOPICS.hint~4(s)`

prop · L217–220

- calls: [`promoteCost`](#s-promoteCost) · [`roleIndex`](stationlife.js.md#s-roleIndex) _js/station/stationlife.js_

<!-- note:TOPICS.hint~4 -->
<!-- /note -->

#### <a id="s-TOPICS-ok-4"></a>`TOPICS.ok~4(s)`

prop · L221–228

- calls: [`canPay`](#s-canPay) · [`promoteCost`](#s-promoteCost) ×2 · [`roleIndex`](stationlife.js.md#s-roleIndex) _js/station/stationlife.js_

<!-- note:TOPICS.ok~4 -->
<!-- /note -->

#### <a id="s-TOPICS-run-4"></a>`TOPICS.run~4(s)`

prop · L229–242

- calls: [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`bumpRegard`](#s-bumpRegard) · [`payFrom`](#s-payFrom) · [`pick`](#s-pick) · [`promoteCost`](#s-promoteCost) · [`incomeOf`](stationlife.js.md#s-incomeOf) _js/station/stationlife.js_ · [`roleIndex`](stationlife.js.md#s-roleIndex) _js/station/stationlife.js_ · [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`

<!-- note:TOPICS.run~4 -->
<!-- /note -->

#### <a id="s-TOPICS-hint-5"></a>`TOPICS.hint~5(s)`

prop · L246–246

- calls: [`household`](#s-household)

<!-- note:TOPICS.hint~5 -->
<!-- /note -->

#### <a id="s-TOPICS-ok-5"></a>`TOPICS.ok~5()`

prop · L247–247

<!-- note:TOPICS.ok~5 -->
<!-- /note -->

#### <a id="s-TOPICS-run-5"></a>`TOPICS.run~5(s)`

prop · L248–257

- calls: [`bumpRegard`](#s-bumpRegard) · [`household`](#s-household) · [`pick`](#s-pick) ×2

<!-- note:TOPICS.run~5 -->
<!-- /note -->

#### <a id="s-TOPICS-hint-6"></a>`TOPICS.hint~6()`

prop · L261–261

<!-- note:TOPICS.hint~6 -->
<!-- /note -->

#### <a id="s-TOPICS-ok-6"></a>`TOPICS.ok~6(s)`

prop · L262–262

- calls: [`destinations`](#s-destinations)

<!-- note:TOPICS.ok~6 -->
<!-- /note -->

#### <a id="s-TOPICS-options"></a>`TOPICS.options(s)`

prop · L263–263

- calls: [`destinations`](#s-destinations) · [`passage`](#s-passage) ×2

<!-- note:TOPICS.options -->
<!-- /note -->

#### <a id="s-TOPICS-run-6"></a>`TOPICS.run~6(s, toId)`

prop · L264–275

- calls: [`bumpRegard`](#s-bumpRegard) · [`passage`](#s-passage) · [`payFrom`](#s-payFrom) · [`pick`](#s-pick) ×2 · [`settleAsk`](#s-settleAsk) · [`tr`](#s-tr) ×2 · [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_

<!-- note:TOPICS.run~6 -->
<!-- /note -->

#### <a id="s-TOPICS-hint-7"></a>`TOPICS.hint~7()`

prop · L279–279

<!-- note:TOPICS.hint~7 -->
<!-- /note -->

#### <a id="s-TOPICS-ok-7"></a>`TOPICS.ok~7(s)`

prop · L280–288

- calls: [`canPay`](#s-canPay) · [`passage`](#s-passage) ×2 · [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_

<!-- note:TOPICS.ok~7 -->
<!-- /note -->

#### <a id="s-TOPICS-run-7"></a>`TOPICS.run~7(s)`

prop · L289–289

<!-- note:TOPICS.run~7 -->
<!-- /note -->

#### <a id="s-TOPICS-hint-8"></a>`TOPICS.hint~8(s)`

prop · L293–293

- calls: [`listOf`](#s-listOf)

<!-- note:TOPICS.hint~8 -->
<!-- /note -->

#### <a id="s-TOPICS-ok-8"></a>`TOPICS.ok~8(s)`

prop · L294–294

- calls: [`listOf`](#s-listOf) ×2

<!-- note:TOPICS.ok~8 -->
<!-- /note -->

#### <a id="s-TOPICS-run-8"></a>`TOPICS.run~8(s)`

prop · L296–307

- calls: [`payOffAndRecord`](../corp/company.js.md#s-payOffAndRecord) _js/corp/company.js_ · [`lineState`](#s-lineState) · [`listOf`](#s-listOf) · [`pick`](#s-pick) · [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_
- via [js/corp/company.js](../corp/company.js.md): `company.staff.indexOf`, `company.staff.splice`

<!-- note:TOPICS.run~8 -->
- L301 · `const err = payOffAndRecord(m, [], "released from the company", st);` — severance comes from the pocket, like any pay-off
<!-- /note -->

### <a id="s-topicById"></a>`topicById(id)`

function · **exported** · L311–311

- called by: [`lineCard`](../console/panels/corp-town.js.md#s-lineCard) _js/console/panels/corp-town.js_ ×2 · [`mountTown>paint`](../console/panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ · [`lineCard`](deckhall.js.md#s-lineCard) _js/station/deckhall.js_ · [`callTopic`](#s-callTopic)

<!-- note:topicById -->
<!-- /note -->

### <a id="s-callTopic"></a>`callTopic(staffId, topicId, arg=)`

function · **exported** · L313–330

- calls: [`inThisSky`](#s-inThisSky) · [`lineState`](#s-lineState) · [`say`](#s-say) ×2 · [`staffById`](#s-staffById) · [`topicById`](#s-topicById)
- via [js/corp/company.js](../corp/company.js.md): `company.staff.includes`
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`act`](../console/panels/corp-town.js.md#s-act) _js/console/panels/corp-town.js_ · [`lineCard`](deckhall.js.md#s-lineCard) _js/station/deckhall.js_ · [`lineCard>run`](deckhall.js.md#s-lineCard-run) _js/station/deckhall.js_

<!-- note:callTopic -->
Say something on the line. Returns { ok, line, why }.
<!-- /note -->

### <a id="s-CALLS"></a>`CALLS`

const · L332–345

<!-- note:CALLS -->
---- the inbox: they call you ------------------------------------------------

Which of the rolls' events are worth a call from the person it happened to.
<!-- /note -->

### <a id="s-TOAST"></a>`TOAST`

const · L347–347

<!-- note:TOAST -->
the ones worth a toast on the HUD as well as a line in the inbox
<!-- /note -->

### <a id="s-hearFrom"></a>`hearFrom(kind, who, text)`

function · **exported** · L349–355

- calls: [`post`](#s-post) · [`staffById`](#s-staffById)
- via [js/corp/company.js](../corp/company.js.md): `company.staff.find`
- called by: [`note`](stationlife.js.md#s-note) _js/station/stationlife.js_

<!-- note:hearFrom -->
stationlife.js calls this on every event it files.
<!-- /note -->

### <a id="s-post"></a>`post(s, kind, text, asks=)`

function · L357–364

- calls: [`cycleNow`](#s-cycleNow) · [`lineState`](#s-lineState) · [`say`](#s-say)
- called by: [`hearFrom`](#s-hearFrom) · [`tickLine`](#s-tickLine) ×3

<!-- note:post -->
<!-- /note -->

### <a id="s-openAsk"></a>`openAsk(s)`

function · **exported** · L366–368

- calls: [`lineState`](#s-lineState)
- called by: [`lineCard`](../console/panels/corp-town.js.md#s-lineCard) _js/console/panels/corp-town.js_ · [`mountTown>paint`](../console/panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ ×4 · [`floorSection`](deckhall.js.md#s-floorSection) _js/station/deckhall.js_ ×2 · [`lineCard`](deckhall.js.md#s-lineCard) _js/station/deckhall.js_ · [`lineSummary`](#s-lineSummary) · [`settleAsk`](#s-settleAsk) · [`tickLine`](#s-tickLine)

<!-- note:openAsk -->
An open ask from this person, if any.
<!-- /note -->

### <a id="s-settleAsk"></a>`settleAsk(s, topicId)`

function · L369–372

- calls: [`openAsk`](#s-openAsk)
- called by: [`TOPICS.run~2`](#s-TOPICS-run-2) · [`TOPICS.run~3`](#s-TOPICS-run-3) · [`TOPICS.run~6`](#s-TOPICS-run-6)

<!-- note:settleAsk -->
<!-- /note -->

### <a id="s-unread"></a>`unread()`

function · **exported** · L374–374

- calls: [`lineState`](#s-lineState)
- called by: [`mountTown>paint`](../console/panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ · [`mountTown>signature`](../console/panels/corp-town.js.md#s-mountTown-signature) _js/console/panels/corp-town.js_ · [`search.status~2`](../console/panels/corp.js.md#s-search-status-2) _js/console/panels/corp.js_ ×2 · [`lineSummary`](#s-lineSummary)

<!-- note:unread -->
<!-- /note -->

### <a id="s-markRead"></a>`markRead(id=)`

function · **exported** · L375–375

- calls: [`lineState`](#s-lineState)
- called by: [`mountTown>paint`](../console/panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ ×4

<!-- note:markRead -->
<!-- /note -->

### <a id="s-tickLine"></a>`tickLine()`

function · **exported** · L377–413

- calls: [`hasCompany`](../corp/company.js.md#s-hasCompany) _js/corp/company.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`bumpRegard`](#s-bumpRegard) · [`cycleNow`](#s-cycleNow) · [`destinations`](#s-destinations) · [`inThisSky`](#s-inThisSky) · [`openAsk`](#s-openAsk) · [`pick`](#s-pick) ×4 · [`post`](#s-post) ×3 · [`regardOf`](#s-regardOf) · [`tr`](#s-tr) ×3 · [`stationById`](stations.js.md#s-stationById) _js/station/stations.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`tickCompany`](../corp/company.js.md#s-tickCompany) _js/corp/company.js_

<!-- note:tickLine -->
Once a cycle, after the rolls: finish journeys, raise asks from the
unhappy, and charge for asks left hanging.

- L384 · `if (s.transit && t >= s.transit.at) {` — a journey ends
- L393 · `const a = openAsk(s);` — an ask left hanging costs
- L400 · `if (!a && (s.mood ?? 74) < LINE.askBelow && c - (s.lastAsk ?? -99) >= LINE.askEvery) {` — sliding: ask for something before they walk
<!-- /note -->

### <a id="s-lineSummary"></a>`lineSummary()`

function · **exported** · L415–420

- calls: [`hasCompany`](../corp/company.js.md#s-hasCompany) _js/corp/company.js_ · [`openAsk`](#s-openAsk) · [`unread`](#s-unread)
- via [js/corp/company.js](../corp/company.js.md): `company.staff.filter`
- called by: [`mountTown>paint`](../console/panels/corp-town.js.md#s-mountTown-paint) _js/console/panels/corp-town.js_ · [`search`](../console/panels/corp.js.md#s-search) _js/console/panels/corp.js_

<!-- note:lineSummary -->
One line for a HUD chip or a heading.
<!-- /note -->
