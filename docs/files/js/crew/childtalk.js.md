# js/crew/childtalk.js

[index](../../../README.md) · 321 lines · 37 symbols · 7 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — talking with the children aboard (0.3.57).

A child aboard had four buttons — spend the watch, teach, the terminal,
shadow a watch — and each answered with the same greeting line anybody on
the crew would give. Nobody ever talked WITH them. This is that:

  YOU ASK      eight things a captain says to a child, answered by who they
               are: how old (little, a child, a teenager), their temperament,
               what they have been taught and by whom, their parents, the
               bond you have put in, where the ship is right now.

  THEY ASK     every few watches a child brings YOU a question — why the
               stars move when we turn, whether they can fly the ship, where
               people go when they die, why they cannot sign on somewhere
               else — with three ways to answer. What you answer moves the
               bond, and an honest answer to a curious child teaches them
               something, up to what their body can carry.

  THE GROWN-UPS  a working ship is a village: every watch there is a chance
               a parent or a hand does something with a child — reads to
               them, lets them hold the torque driver, loses an argument
               about the rota — and it goes in the crew log, and now and
               then the child picks up a point of that adult's trade.

Everything is seeded per child and per watch: the same question twice in a
watch gets the same answer; a new watch answers fresh.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../npc/cradle.js` | `cradle` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 2 | `./family.js` | `household`, `note`, `personById` | [js/crew/family.js](family.js.md) |
| 3 | `./ledger.js` | `crew`, `crewHooks`, `firstName`, `CYCLE_SECONDS` | [js/crew/ledger.js](ledger.js.md) |
| 4 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 5 | `../station/stations.js` | `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 6 | `../careers/complexes.js` | `COMPLEXES` | [js/careers/complexes.js](../careers/complexes.js.md) |
| 7 | `./children.js` | `bondWith`, `inheritance`, `APT_LABEL` | [js/crew/children.js](children.js.md) |

## Imported by

- [js/console/panels/crew.js](../console/panels/crew.js.md) — `CHILD_TOPICS`, `talkToChild`, `openChildAsk`, `answerChild`, `childTalkLog`, `stageOf`
- test/childtalk.test.mjs _(outside js/)_ — `CT`

## Exports

- [`CHILD`](#s-CHILD) · const — **no importer in scanned roots**
- [`stageOf`](#s-stageOf) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md)
- [`childTalkLog`](#s-childTalkLog) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md)
- [`CHILD_TOPICS`](#s-CHILD_TOPICS) · const — used by [js/console/panels/crew.js](../console/panels/crew.js.md)
- [`childTopicById`](#s-childTopicById) · function — **no importer in scanned roots**
- [`talkToChild`](#s-talkToChild) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md)
- [`CHILD_ASKS`](#s-CHILD_ASKS) · const — **no importer in scanned roots**
- [`openChildAsk`](#s-openChildAsk) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md)
- [`answerChild`](#s-answerChild) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md)
- [`tickChildren`](#s-tickChildren) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-CHILD"></a>`CHILD`

const · **exported** · L9–17

<!-- note:CHILD -->
- L10 · `little: 6,` — under this many cycles: little
- L11 · `teen: 16,` — this many and over: a teenager
- L12 · `askEvery: 3,` — watches between a child's questions, at the least
- L13 · `askChance: 0.45,` — …and the chance each watch after that
- L14 · `momentChance: 0.3,` — an adult–child moment per child per watch
- L15 · `skillEvery: 3,` — one moment in this many teaches a point of the adult's trade
<!-- /note -->

### <a id="s-cycleNow"></a>`cycleNow()`

function · L19–19

- called by: [`talkToChild`](#s-talkToChild) · [`tickChildren`](#s-tickChildren)

<!-- note:cycleNow -->
<!-- /note -->

### <a id="s-bondKey"></a>`bondKey(id)`

function · L20–20

- called by: [`addBond`](#s-addBond)

<!-- note:bondKey -->
<!-- /note -->

### <a id="s-hash"></a>`hash(s)`

function · L22–27

- called by: [`CHILD_TOPICS.run~3`](#s-CHILD_TOPICS-run-3) · [`momentFor`](#s-momentFor) ×2 · [`pick`](#s-pick) · [`roll`](#s-roll) · [`tickChildren`](#s-tickChildren)

<!-- note:hash -->
<!-- /note -->

### <a id="s-pick"></a>`pick(key, arr)`

function · L28–28

- calls: [`hash`](#s-hash)
- called by: [`CHILD_TOPICS.run`](#s-CHILD_TOPICS-run) ×6 · [`CHILD_TOPICS.run~2`](#s-CHILD_TOPICS-run-2) ×2 · [`CHILD_TOPICS.run~3`](#s-CHILD_TOPICS-run-3) ×2 · [`CHILD_TOPICS.run~4`](#s-CHILD_TOPICS-run-4) ×3 · [`CHILD_TOPICS.run~5`](#s-CHILD_TOPICS-run-5) · [`CHILD_TOPICS.run~6`](#s-CHILD_TOPICS-run-6) ×2 · [`CHILD_TOPICS.run~7`](#s-CHILD_TOPICS-run-7) ×2 · [`CHILD_TOPICS.run~8`](#s-CHILD_TOPICS-run-8) ×3 · [`momentFor`](#s-momentFor)

<!-- note:pick -->
<!-- /note -->

### <a id="s-roll"></a>`roll(key)`

function · L29–29

- calls: [`hash`](#s-hash)
- called by: [`tickChildren`](#s-tickChildren) ×2

<!-- note:roll -->
<!-- /note -->

### <a id="s-stageOf"></a>`stageOf(c)`

function · **exported** · L31–34

- called by: [`childCard`](../console/panels/crew.js.md#s-childCard) _js/console/panels/crew.js_ · [`CHILD_TOPICS.run`](#s-CHILD_TOPICS-run) · [`CHILD_TOPICS.run~2`](#s-CHILD_TOPICS-run-2) · [`CHILD_TOPICS.run~4`](#s-CHILD_TOPICS-run-4) · [`CHILD_TOPICS.run~5`](#s-CHILD_TOPICS-run-5) · [`CHILD_TOPICS.run~6`](#s-CHILD_TOPICS-run-6) · [`CHILD_TOPICS.run~7`](#s-CHILD_TOPICS-run-7) · [`CHILD_TOPICS.run~8`](#s-CHILD_TOPICS-run-8) · [`momentFor`](#s-momentFor) · [`tickChildren`](#s-tickChildren)

<!-- note:stageOf -->
<!-- /note -->

### <a id="s-traitsOf"></a>`traitsOf(c)`

function · L36–36

- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`tr`](#s-tr)

<!-- note:traitsOf -->
<!-- /note -->

### <a id="s-tr"></a>`tr(c, k)`

function · L37–37

- calls: [`traitsOf`](#s-traitsOf)
- called by: [`CHILD_TOPICS.run~2`](#s-CHILD_TOPICS-run-2) · [`CHILD_TOPICS.run~4`](#s-CHILD_TOPICS-run-4) · [`CHILD_TOPICS.run~6`](#s-CHILD_TOPICS-run-6) · [`CHILD_TOPICS.run~8`](#s-CHILD_TOPICS-run-8) ×2 · [`answerChild`](#s-answerChild)

<!-- note:tr -->
<!-- /note -->

### <a id="s-addBond"></a>`addBond(c, d)`

function · L39–43

- calls: [`bondWith`](children.js.md#s-bondWith) _js/crew/children.js_ ×2 · [`bondKey`](#s-bondKey)
- called by: [`answerChild`](#s-answerChild) · [`talkToChild`](#s-talkToChild)

<!-- note:addBond -->
<!-- /note -->

### <a id="s-teach"></a>`teach(c, skill, n=)`

function · L45–55

- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.put`
- called by: [`CHILD_TOPICS.run~8`](#s-CHILD_TOPICS-run-8) · [`answerChild`](#s-answerChild) · [`momentFor`](#s-momentFor)

<!-- note:teach -->
A point of a skill, capped by what the body can carry (the rule heritage and raise() use).

- L51 · `if (before >= ceiling) return false;` — teaching gets them there sooner; it does not get them past it
<!-- /note -->

### <a id="s-talkLog"></a>`talkLog(c)`

function · L57–61

- called by: [`childTalkLog`](#s-childTalkLog) · [`say`](#s-say)

<!-- note:talkLog -->
<!-- /note -->

### <a id="s-say"></a>`say(c, who, text)`

function · L62–67

- calls: [`talkLog`](#s-talkLog)
- called by: [`answerChild`](#s-answerChild) ×2 · [`talkToChild`](#s-talkToChild) ×2 · [`tickChildren`](#s-tickChildren)

<!-- note:say -->
<!-- /note -->

### <a id="s-childTalkLog"></a>`childTalkLog(c, n=)`

function · **exported** · L68–68

- calls: [`talkLog`](#s-talkLog)
- called by: [`childCard`](../console/panels/crew.js.md#s-childCard) _js/console/panels/crew.js_

<!-- note:childTalkLog -->
<!-- /note -->

### <a id="s-parents"></a>`parents(c)`

function · L70–72

- calls: [`personById`](family.js.md#s-personById) _js/crew/family.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.find`
- called by: [`CHILD_TOPICS.run~3`](#s-CHILD_TOPICS-run-3) · [`momentFor`](#s-momentFor)

<!-- note:parents -->
<!-- /note -->

### <a id="s-where"></a>`where()`

function · L73–78

- calls: [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`CHILD_TOPICS.run~5`](#s-CHILD_TOPICS-run-5)

<!-- note:where -->
<!-- /note -->

### <a id="s-topSkill"></a>`topSkill(c)`

function · L79–83

- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`CHILD_TOPICS.run~2`](#s-CHILD_TOPICS-run-2)

<!-- note:topSkill -->
<!-- /note -->

### <a id="s-topApt"></a>`topApt(c)`

function · L84–88

- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`CHILD_TOPICS.run~4`](#s-CHILD_TOPICS-run-4) · [`answerChild`](#s-answerChild)

<!-- note:topApt -->
<!-- /note -->

### <a id="s-firstPerson"></a>`firstPerson(label)`

function · L89–93

- called by: [`CHILD_TOPICS.run~7`](#s-CHILD_TOPICS-run-7)

<!-- note:firstPerson -->
"checks the seal twice" → "check the seal twice": the trait lines are written about them
<!-- /note -->

### <a id="s-aptWord"></a>`aptWord(k)`

function · L94–94

- called by: [`CHILD_TOPICS.run~4`](#s-CHILD_TOPICS-run-4)

<!-- note:aptWord -->
<!-- /note -->

### <a id="s-CHILD_TOPICS"></a>`CHILD_TOPICS`

const · **exported** · L96–188

<!-- note:CHILD_TOPICS -->
---- you ask ------------------------------------------------------------------
<!-- /note -->

#### <a id="s-CHILD_TOPICS-run"></a>`CHILD_TOPICS.run(c, k)`

prop · L99–105

- calls: [`bondWith`](children.js.md#s-bondWith) _js/crew/children.js_ · [`pick`](#s-pick) ×6 · [`stageOf`](#s-stageOf)

<!-- note:CHILD_TOPICS.run -->
<!-- /note -->

#### <a id="s-CHILD_TOPICS-run-2"></a>`CHILD_TOPICS.run~2(c, k)`

prop · L109–118

- calls: [`inheritance`](children.js.md#s-inheritance) _js/crew/children.js_ · [`pick`](#s-pick) ×2 · [`stageOf`](#s-stageOf) · [`topSkill`](#s-topSkill) · [`tr`](#s-tr)

<!-- note:CHILD_TOPICS.run~2 -->
<!-- /note -->

#### <a id="s-CHILD_TOPICS-run-3"></a>`CHILD_TOPICS.run~3(c, k)`

prop · L122–135

- calls: [`hash`](#s-hash) · [`parents`](#s-parents) · [`pick`](#s-pick) ×2 · [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×7
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.some`

<!-- note:CHILD_TOPICS.run~3 -->
<!-- /note -->

#### <a id="s-CHILD_TOPICS-run-4"></a>`CHILD_TOPICS.run~4(c, k)`

prop · L139–146

- calls: [`bondWith`](children.js.md#s-bondWith) _js/crew/children.js_ · [`inheritance`](children.js.md#s-inheritance) _js/crew/children.js_ · [`aptWord`](#s-aptWord) · [`pick`](#s-pick) ×3 · [`stageOf`](#s-stageOf) · [`topApt`](#s-topApt) · [`tr`](#s-tr)

<!-- note:CHILD_TOPICS.run~4 -->
<!-- /note -->

#### <a id="s-CHILD_TOPICS-run-5"></a>`CHILD_TOPICS.run~5(c, k)`

prop · L150–157

- calls: [`pick`](#s-pick) · [`stageOf`](#s-stageOf) · [`where`](#s-where)

<!-- note:CHILD_TOPICS.run~5 -->
<!-- /note -->

#### <a id="s-CHILD_TOPICS-run-6"></a>`CHILD_TOPICS.run~6(c, k)`

prop · L161–166

- calls: [`bondWith`](children.js.md#s-bondWith) _js/crew/children.js_ · [`pick`](#s-pick) ×2 · [`stageOf`](#s-stageOf) · [`tr`](#s-tr)

<!-- note:CHILD_TOPICS.run~6 -->
<!-- /note -->

#### <a id="s-CHILD_TOPICS-run-7"></a>`CHILD_TOPICS.run~7(c, k)`

prop · L170–176

- calls: [`bondWith`](children.js.md#s-bondWith) _js/crew/children.js_ · [`inheritance`](children.js.md#s-inheritance) _js/crew/children.js_ · [`firstPerson`](#s-firstPerson) · [`pick`](#s-pick) ×2 · [`stageOf`](#s-stageOf)

<!-- note:CHILD_TOPICS.run~7 -->
<!-- /note -->

#### <a id="s-CHILD_TOPICS-run-8"></a>`CHILD_TOPICS.run~8(c, k)`

prop · L180–186

- calls: [`pick`](#s-pick) ×3 · [`stageOf`](#s-stageOf) · [`teach`](#s-teach) · [`tr`](#s-tr) ×2

<!-- note:CHILD_TOPICS.run~8 -->
<!-- /note -->

### <a id="s-childTopicById"></a>`childTopicById(id)`

function · **exported** · L190–190

- called by: [`talkToChild`](#s-talkToChild)

<!-- note:childTopicById -->
<!-- /note -->

### <a id="s-talkToChild"></a>`talkToChild(c, topicId)`

function · **exported** · L192–205

- calls: [`bondWith`](children.js.md#s-bondWith) _js/crew/children.js_ · [`addBond`](#s-addBond) · [`childTopicById`](#s-childTopicById) · [`cycleNow`](#s-cycleNow) · [`say`](#s-say) ×2
- via [js/crew/family.js](family.js.md): `household.children.includes`
- called by: [`childCard`](../console/panels/crew.js.md#s-childCard) _js/console/panels/crew.js_

<!-- note:talkToChild -->
Ask a child something. → { ok, line, bond, why? } — each topic once a watch per child.
<!-- /note -->

### <a id="s-CHILD_ASKS"></a>`CHILD_ASKS`

const · **exported** · L207–256

<!-- note:CHILD_ASKS -->
---- they ask ------------------------------------------------------------------
<!-- /note -->

### <a id="s-openChildAsk"></a>`openChildAsk(c)`

function · **exported** · L258–262

- called by: [`childCard`](../console/panels/crew.js.md#s-childCard) _js/console/panels/crew.js_ · [`answerChild`](#s-answerChild)

<!-- note:openChildAsk -->
The question a child has open for you, if any.
<!-- /note -->

### <a id="s-answerChild"></a>`answerChild(c, answerId)`

function · **exported** · L264–280

- calls: [`bondWith`](children.js.md#s-bondWith) _js/crew/children.js_ · [`inheritance`](children.js.md#s-inheritance) _js/crew/children.js_ · [`addBond`](#s-addBond) · [`openChildAsk`](#s-openChildAsk) · [`say`](#s-say) ×2 · [`teach`](#s-teach) · [`topApt`](#s-topApt) · [`tr`](#s-tr) · [`note`](family.js.md#s-note) _js/crew/family.js_ · [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_
- called by: [`childCard`](../console/panels/crew.js.md#s-childCard) _js/console/panels/crew.js_

<!-- note:answerChild -->
Answer it. → { ok, line, bond, taught? }
<!-- /note -->

### <a id="s-tickChildren"></a>`tickChildren()`

function · **exported** · L282–299

- calls: [`cycleNow`](#s-cycleNow) · [`hash`](#s-hash) · [`momentFor`](#s-momentFor) · [`roll`](#s-roll) ×2 · [`say`](#s-say) · [`stageOf`](#s-stageOf) · [`note`](family.js.md#s-note) _js/crew/family.js_ · [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_

<!-- note:tickChildren -->
Once a watch: children ask, and the grown-ups do things with them.

- L287 · `const cur = household.asks[c.id];` — a question
- L297 · `` if (roll(`${c.id}:moment:${cyc}`) < CHILD.momentChance) momentFor(c, cyc); `` — a grown-up and a child
<!-- /note -->

### <a id="s-MOMENTS"></a>`MOMENTS`

const · L301–305

<!-- note:MOMENTS -->
<!-- /note -->

### <a id="s-momentFor"></a>`momentFor(c, cyc)`

function · L307–319

- calls: [`hash`](#s-hash) ×2 · [`parents`](#s-parents) · [`pick`](#s-pick) · [`stageOf`](#s-stageOf) · [`teach`](#s-teach) · [`note`](family.js.md#s-note) _js/crew/family.js_ · [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×2
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.filter`, `crew.aboard.some`
- called by: [`tickChildren`](#s-tickChildren)

<!-- note:momentFor -->
- L314 · `` if (hash(`${c.id}:skill:${cyc}`) % CHILD.skillEvery === 0) { `` — now and then it sticks: a point of the grown-up's own trade
<!-- /note -->

## Module-level calls

- via [js/crew/ledger.js](ledger.js.md): `crewHooks.cycle.includes`, `crewHooks.cycle.push`
