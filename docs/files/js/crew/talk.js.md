# js/crew/talk.js

[index](../../../README.md) · 285 lines · 29 symbols · 14 imports · 5 importers

## About

<!-- note:@file -->
LIVING GALAXY — talking to the crew.

family.crewTopics() is the base list (praise, bonus, court, settle…) and
stays as it was. Above it sits a tree of topic nodes (talk-trees.js) with
trust tiers, `when` gates, once/cooldown, and choices that carry
consequences — trust, morale, credits, rapport with a crewmate, a duty, a
flag the roster and later talks read back. Everything said is remembered
on the member (`m.memory`) and mirrored to the CRADLE record, so a hand who
walks and signs on again still knows what you promised. Contract: §4.2.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./ledger.js` | `crew`, `crewHooks`, `firstName`, `rapportBetween` | [js/crew/ledger.js](ledger.js.md) |
| 2 | `./family.js` | `crewTopics`, `greetLine`, `adjustTrust`, `adjustMorale`, `familyOf` | [js/crew/family.js](family.js.md) |
| 3 | `../npc/cradle.js` | `cradle`, `PRONOUNS` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 4 | `../sim/sim.js` | `sim`, `logEvent` | [js/sim/sim.js](../sim/sim.js.md) |
| 5 | `../mission/run.js` | `mission` | [js/mission/run.js](../mission/run.js.md) |
| 6 | `./bonds.js` | `adjustRapport`, `makeRivals`, `tiesOf` | [js/crew/bonds.js](bonds.js.md) |
| 7 | `./roster.js` | `setDuty`, `dutyOf`, `postKind` | [js/crew/roster.js](roster.js.md) |
| 8 | `./talk-trees.js` | `TREE`, `ROBOT_TOPICS` | [js/crew/talk-trees.js](talk-trees.js.md) |
| 9 | `./talk-wants.js` | `WANT_TOPICS` | [js/crew/talk-wants.js](talk-wants.js.md) |
| 10 | `./talk-threads.js` | `THREADS` | [js/crew/talk-threads.js](talk-threads.js.md) |
| 11 | `./hooks.js` | `runHooks` | [js/crew/hooks.js](hooks.js.md) |
| 12 | `./duties.js` | `duties` | [js/crew/duties.js](duties.js.md) |
| 13 | `./voice.js` | `line` as `voiceLine`, `wrap` as `voiceWrap` **unused** | [js/crew/voice.js](voice.js.md) |
| 14 | `./tiers.js` | `FRIEND_TIERS`, `FRIEND_INDEX`, `MORALE_INDEX`, `friendTier`, `tierGate`, `tiersOf` | [js/crew/tiers.js](tiers.js.md) |

## Imported by

- [js/console/panels/crew.js](../console/panels/crew.js.md) — `tierOf`, `TIER_NAMES`
- [js/crew/talkview.js](talkview.js.md) — `topicsFor`, `lockedTopicsFor`, `open`, `choose`, `answerFreeText`, `greet`, `talkLog`, `tierOf`, `TIER_NAMES`
- test/converse.test.mjs _(outside js/)_ — `TREE`, `THREADS`, `topicsFor`, `open`, `choose`, `memoryOf`, `forgetTalk`, `greet`
- test/crew-life.test.mjs _(outside js/)_ — `TREE`, `ROBOT_TOPICS`, `topicsFor`, `lockedTopicsFor`, `open`, `choose`, `memoryOf`, `answerFreeText`, `greet`, `tierOf`, `forgetTalk`, `TIER_NAMES`
- test/genome.test.mjs _(outside js/)_ — `topicsFor`, `open`, `choose`

## Exports

- `TREE` — used by test/converse.test.mjs, test/crew-life.test.mjs
- `ROBOT_TOPICS` — used by test/crew-life.test.mjs
- `WANT_TOPICS` — **no importer in scanned roots**
- `THREADS` — used by test/converse.test.mjs
- [`TIERS`](#s-TIERS) · const — **no importer in scanned roots**
- [`TIER_NAMES`](#s-TIER_NAMES) · const — used by [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/talkview.js](talkview.js.md), test/crew-life.test.mjs
- [`tierOf`](#s-tierOf) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/talkview.js](talkview.js.md), test/crew-life.test.mjs
- [`memoryOf`](#s-memoryOf) · function — used by test/converse.test.mjs, test/crew-life.test.mjs
- [`forgetTalk`](#s-forgetTalk) · function — used by test/converse.test.mjs, test/crew-life.test.mjs
- [`talkContext`](#s-talkContext) · function — **no importer in scanned roots**
- [`topicsFor`](#s-topicsFor) · function — used by [js/crew/talkview.js](talkview.js.md), test/converse.test.mjs, test/crew-life.test.mjs, test/genome.test.mjs
- [`lockedTopicsFor`](#s-lockedTopicsFor) · function — used by [js/crew/talkview.js](talkview.js.md), test/crew-life.test.mjs
- [`open`](#s-open) · function — used by [js/crew/talkview.js](talkview.js.md), test/converse.test.mjs, test/crew-life.test.mjs, test/genome.test.mjs
- [`choose`](#s-choose) · function — used by [js/crew/talkview.js](talkview.js.md), test/converse.test.mjs, test/crew-life.test.mjs, test/genome.test.mjs
- [`answerFreeText`](#s-answerFreeText) · function — used by [js/crew/talkview.js](talkview.js.md), test/crew-life.test.mjs
- [`greet`](#s-greet) · function — used by [js/crew/talkview.js](talkview.js.md), test/converse.test.mjs, test/crew-life.test.mjs
- [`talkLog`](#s-talkLog) · function — used by [js/crew/talkview.js](talkview.js.md)
- `rapportBetween` — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-TIER_RUNG"></a>`TIER_RUNG`

const · L18–18

<!-- note:TIER_RUNG -->
The tree's four gates, read off the six-rung friendship ladder.

There were two vocabularies for the same number: this file's
stranger/hand/confidant/friend at 0/25/50/75, and nothing at all for morale.
js/crew/tiers.js is the one ladder now — wary → civil → shipmate → friend →
confidant → sworn — and a node's `tier: 0..3` names a rung on it, so the
gate the tree applies and the tier the crew sheet prints are the same thing.
<!-- /note -->

### <a id="s-TIERS"></a>`TIERS`

const · **exported** · L19–19

- calls: [`FRIEND_INDEX`](tiers.js.md#s-FRIEND_INDEX) _js/crew/tiers.js_

<!-- note:TIERS -->
<!-- /note -->

### <a id="s-TIER_NAMES"></a>`TIER_NAMES`

const · **exported** · L20–20

- calls: [`FRIEND_INDEX`](tiers.js.md#s-FRIEND_INDEX) _js/crew/tiers.js_
- via [js/crew/tiers.js](tiers.js.md): `FRIEND_TIERS[…].label.toLowerCase`

<!-- note:TIER_NAMES -->
<!-- /note -->

### <a id="s-LOG_MAX"></a>`LOG_MAX`

const · L21–21

<!-- note:LOG_MAX -->
<!-- /note -->

### <a id="s-tierOf"></a>`tierOf(m)`

function · **exported** · L23–28

- calls: [`FRIEND_INDEX`](tiers.js.md#s-FRIEND_INDEX) _js/crew/tiers.js_ ×2 · [`friendTier`](tiers.js.md#s-friendTier) _js/crew/tiers.js_
- called by: [`rosterCard`](../console/panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_ · [`gate`](#s-gate) · [`talkContext`](#s-talkContext) · [`subLine`](talkview.js.md#s-subLine) _js/crew/talkview.js_

<!-- note:tierOf -->
0..3 from where they stand on the friendship ladder
<!-- /note -->

### <a id="s-memoryOf"></a>`memoryOf(m)`

function · **exported** · L30–38

- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`applyFx`](#s-applyFx) ×2 · [`choose`](#s-choose) · [`gate`](#s-gate) · [`greet`](#s-greet) · [`open`](#s-open) · [`remember`](#s-remember) · [`talkContext`](#s-talkContext) · [`talkLog`](#s-talkLog) · [`tickTalkCycle`](#s-tickTalkCycle)

<!-- note:memoryOf -->
→ { topics: {id: n}, flags: {}, lastTalk, log: [{ t, topic, choice?, line }], used: {id: cycle} }
<!-- /note -->

### <a id="s-forgetTalk"></a>`forgetTalk(m)`

function · **exported** · L40–45

- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.put`

<!-- note:forgetTalk -->
Wipe what a hand remembers (tests, a fresh sky).
<!-- /note -->

### <a id="s-mirror"></a>`mirror(m)`

function · L47–50

- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.put`
- called by: [`remember`](#s-remember)

<!-- note:mirror -->
<!-- /note -->

### <a id="s-talkContext"></a>`talkContext(m, ctx=)`

function · **exported** · L52–62

- calls: [`tiesOf`](bonds.js.md#s-tiesOf) _js/crew/bonds.js_ · [`familyOf`](family.js.md#s-familyOf) _js/crew/family.js_ · [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ · [`memoryOf`](#s-memoryOf) · [`tierOf`](#s-tierOf)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.filter`, `crew.aboard.find`
- called by: [`answerFreeText`](#s-answerFreeText) · [`choose`](#s-choose) ×2 · [`greet`](#s-greet) · [`lockedTopicsFor`](#s-lockedTopicsFor) · [`open`](#s-open) · [`topicsFor`](#s-topicsFor)

<!-- note:talkContext -->
Everything a node needs to speak: the hand, their people, the ship's day.
<!-- /note -->

### <a id="s-gate"></a>`gate(node, m, c)`

function · L64–81

- calls: [`memoryOf`](#s-memoryOf) · [`tierOf`](#s-tierOf) · [`MORALE_INDEX`](tiers.js.md#s-MORALE_INDEX) _js/crew/tiers.js_ ×2 · [`tierGate`](tiers.js.md#s-tierGate) _js/crew/tiers.js_ · [`tiersOf`](tiers.js.md#s-tiersOf) _js/crew/tiers.js_
- called by: [`allNodes`](#s-allNodes) · [`greet`](#s-greet) · [`lockedTopicsFor`](#s-lockedTopicsFor) · [`open`](#s-open) · [`topicsFor`](#s-topicsFor)

<!-- note:gate -->
- L68 · `if (node.need && !tierGate(m, node.need)) {` — the richer gate: a topic can also want a mood, or a rung on the romantic
  ladder. A sullen hand has an answer, it is just not that answer.
<!-- /note -->

### <a id="s-baseNodes"></a>`baseNodes(m, c)`

function · L83–86

- calls: [`crewTopics`](family.js.md#s-crewTopics) _js/crew/family.js_
- via [js/crew/family.js](family.js.md): `crewTopics.map`
- called by: [`allNodes`](#s-allNodes)

<!-- note:baseNodes -->
The base list from family.js, each a tier-0 node whose say() is its run().
<!-- /note -->

#### <a id="s-baseNodes-say"></a>`baseNodes.say()`

prop · L85–85

<!-- note:baseNodes.say -->
<!-- /note -->

### <a id="s-allNodes"></a>`allNodes(m, c)`

function · L88–97

- calls: [`runHooks`](hooks.js.md#s-runHooks) _js/crew/hooks.js_ · [`baseNodes`](#s-baseNodes) · [`gate`](#s-gate)
- via [js/crew/hooks.js](hooks.js.md): `runHooks.flat`, `runHooks.flat.filter`
- called by: [`lockedTopicsFor`](#s-lockedTopicsFor) · [`nodeById`](#s-nodeById) · [`topicsFor`](#s-topicsFor)

<!-- note:allNodes -->
What the hand brought to the captain comes first — a flagged grievance
should not be three taps down a list of small talk.

0.3.17: a conversation that is picking up where the last one left off
(talk-threads.js) comes right after anything they flagged themselves.

And one id, one topic. family.js's "How's the watch?" and the WANT list's
"How's your watch been?" were both `watch`; the lookup found the WANT one
first, so tapping the family one ran the other — and when that one was
hidden or cooling down the tap answered with nothing. The base topic now
stands aside while the richer one is on the board, and comes back when it
is not.
<!-- /note -->

### <a id="s-labelOf"></a>`labelOf(n, m, c)`

function · L99–99

- called by: [`open`](#s-open) · [`pub`](#s-pub)

<!-- note:labelOf -->
<!-- /note -->

### <a id="s-pub"></a>`pub(n, m, c)`

function · L100–100

- calls: [`labelOf`](#s-labelOf)
- called by: [`lockedTopicsFor`](#s-lockedTopicsFor) · [`topicsFor`](#s-topicsFor)

<!-- note:pub -->
<!-- /note -->

### <a id="s-topicsFor"></a>`topicsFor(m, ctx=)`

function · **exported** · L102–106

- calls: [`allNodes`](#s-allNodes) · [`gate`](#s-gate) · [`pub`](#s-pub) · [`talkContext`](#s-talkContext)
- called by: [`mountTalk>paintOpts`](talkview.js.md#s-mountTalk-paintOpts) _js/crew/talkview.js_

<!-- note:topicsFor -->
Topics this hand will talk about right now (tier/when/once/cooldown applied).
<!-- /note -->

### <a id="s-lockedTopicsFor"></a>`lockedTopicsFor(m, ctx=)`

function · **exported** · L108–117

- calls: [`allNodes`](#s-allNodes) · [`gate`](#s-gate) · [`pub`](#s-pub) · [`talkContext`](#s-talkContext)
- called by: [`mountTalk>paintOpts`](talkview.js.md#s-mountTalk-paintOpts) _js/crew/talkview.js_

<!-- note:lockedTopicsFor -->
Topics that exist but are shut for now, with the reason: [{ id, label, tier, why }].
<!-- /note -->

### <a id="s-nodeById"></a>`nodeById(m, id, c)`

function · L119–121

- calls: [`allNodes`](#s-allNodes)
- called by: [`choose`](#s-choose) ×2 · [`open`](#s-open)

<!-- note:nodeById -->
<!-- /note -->

### <a id="s-normalise"></a>`normalise(res)`

function · L123–127

- called by: [`choose`](#s-choose) · [`open`](#s-open)

<!-- note:normalise -->
<!-- /note -->

### <a id="s-remember"></a>`remember(m, entry)`

function · L129–135

- calls: [`memoryOf`](#s-memoryOf) · [`mirror`](#s-mirror)
- called by: [`answerFreeText`](#s-answerFreeText) ×2 · [`choose`](#s-choose) · [`open`](#s-open)

<!-- note:remember -->
<!-- /note -->

### <a id="s-open"></a>`open(m, topicId, ctx=)`

function · **exported** · L137–154

- calls: [`gate`](#s-gate) · [`labelOf`](#s-labelOf) · [`memoryOf`](#s-memoryOf) · [`nodeById`](#s-nodeById) · [`normalise`](#s-normalise) · [`remember`](#s-remember) · [`talkContext`](#s-talkContext)
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.includes`
- called by: [`mountTalk>paintOpts`](talkview.js.md#s-mountTalk-paintOpts) _js/crew/talkview.js_

<!-- note:open -->
Open a topic → { text, choices: [{ id, label, cls }] }. Records the topic in memory.

- L152 · `if (!crew.aboard.includes(m)) mem.pending = null;` — a settle or a dismissal took them off the deck: nothing more to say
<!-- /note -->

### <a id="s-applyFx"></a>`applyFx(m, fx, c)`

function · L156–174

- calls: [`adjustRapport`](bonds.js.md#s-adjustRapport) _js/crew/bonds.js_ · [`makeRivals`](bonds.js.md#s-makeRivals) _js/crew/bonds.js_ · [`adjustMorale`](family.js.md#s-adjustMorale) _js/crew/family.js_ ×2 · [`adjustTrust`](family.js.md#s-adjustTrust) _js/crew/family.js_ · [`dutyOf`](roster.js.md#s-dutyOf) _js/crew/roster.js_ · [`postKind`](roster.js.md#s-postKind) _js/crew/roster.js_ · [`setDuty`](roster.js.md#s-setDuty) _js/crew/roster.js_ ×2 · [`memoryOf`](#s-memoryOf) ×2 · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- called by: [`choose`](#s-choose)

<!-- note:applyFx -->
Apply a choice's consequences. Returns null, or a line that refuses it.
<!-- /note -->

### <a id="s-choose"></a>`choose(m, topicId, choiceId, ctx=)`

function · **exported** · L176–204

- calls: [`applyFx`](#s-applyFx) · [`memoryOf`](#s-memoryOf) · [`nodeById`](#s-nodeById) ×2 · [`normalise`](#s-normalise) · [`remember`](#s-remember) · [`talkContext`](#s-talkContext) ×2
- called by: [`mountTalk>paintOpts`](talkview.js.md#s-mountTalk-paintOpts) _js/crew/talkview.js_

<!-- note:choose -->
Pick a choice on an open topic → { text }. Applies its fx and records it.
<!-- /note -->

### <a id="s-FREE"></a>`FREE`

const · L206–216

<!-- note:FREE -->
---- free text ------------------------------------------------------------
<!-- /note -->

### <a id="s-hashN"></a>`hashN(s, n)`

function · L218–222

- called by: [`answerFreeText`](#s-answerFreeText)

<!-- note:hashN -->
<!-- /note -->

### <a id="s-answerFreeText"></a>`answerFreeText(m, text)`

function · **exported** · L224–255

- calls: [`adjustMorale`](family.js.md#s-adjustMorale) _js/crew/family.js_ ×2 · [`adjustTrust`](family.js.md#s-adjustTrust) _js/crew/family.js_ ×3 · [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ · [`hashN`](#s-hashN) · [`remember`](#s-remember) ×2 · [`talkContext`](#s-talkContext) · [`line`](voice.js.md#s-line) _js/crew/voice.js_ ×15
- called by: [`mountTalk>send`](talkview.js.md#s-mountTalk-send) _js/crew/talkview.js_

<!-- note:answerFreeText -->
A reply to anything typed, flavoured by trait and tier. Always a string.
<!-- /note -->

### <a id="s-greet"></a>`greet(m)`

function · **exported** · L257–270

- calls: [`greetLine`](family.js.md#s-greetLine) _js/crew/family.js_ · [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×2 · [`gate`](#s-gate) · [`memoryOf`](#s-memoryOf) · [`talkContext`](#s-talkContext)
- via [js/crew/talk-threads.js](talk-threads.js.md): `THREADS.find`
- called by: [`mountTalk`](talkview.js.md#s-mountTalk) _js/crew/talkview.js_

<!-- note:greet -->
A greeting that remembers the last thing you talked about.

- L266 · `const c = talkContext(m);` — 0.3.17: a thread waiting to be picked up is the first thing they'd raise
<!-- /note -->

### <a id="s-talkLog"></a>`talkLog(m, n=)`

function · **exported** · L272–274

- calls: [`memoryOf`](#s-memoryOf)
- called by: [`mountTalk>paintLog`](talkview.js.md#s-mountTalk-paintLog) _js/crew/talkview.js_

<!-- note:talkLog -->
Last exchanges, newest last: [{ t, topic, label, choice?, line }].
<!-- /note -->

### <a id="s-tickTalkCycle"></a>`tickTalkCycle()`

function · L276–282

- calls: [`memoryOf`](#s-memoryOf)

<!-- note:tickTalkCycle -->
a promise kept keeps a floor under morale
<!-- /note -->

## Module-level calls

- via [js/crew/ledger.js](ledger.js.md): `crewHooks.cycle.includes`, `crewHooks.cycle.push`
