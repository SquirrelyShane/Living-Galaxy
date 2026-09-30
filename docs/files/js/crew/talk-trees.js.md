# js/crew/talk-trees.js

[index](../../../README.md) · 326 lines · 132 symbols · 5 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — what the crew will talk about.

Data for crew/talk.js. Every node: { id, label, cls?, tier, when?, once?,
cooldown?, say(m, c) → string | { text, choices }, remember? }. `c` is
talk.talkContext(): f (first name), t (traits 0..1 on cradle's five axes:
grit, caution, greed, loyalty, curiosity), pr (pronouns), rec (cradle
record), docked, partner, kids, ties, mission, cycle, memory, others.

Voice rules: lines are theirs, first person, short. A trait leans a line,
it never scripts a person — a greedy hand can still be kind, and the
choices are the captain's, with consequences the roster shows.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./ledger.js` | `firstName`, `rapportBetween` | [js/crew/ledger.js](ledger.js.md) |
| 2 | `./family.js` | `trustOf` | [js/crew/family.js](family.js.md) |
| 3 | `./duties.js` | `duties`, `wearLine` | [js/crew/duties.js](duties.js.md) |
| 4 | `./roster.js` | `dutyOptions`, `dutyOf`, `KIND_LABEL` | [js/crew/roster.js](roster.js.md) |
| 5 | `./voice.js` | `line` as `V`, `byTrait` | [js/crew/voice.js](voice.js.md) |

## Imported by

- [js/crew/talk.js](talk.js.md) — `TREE`, `ROBOT_TOPICS`

## Exports

- [`TREE`](#s-TREE) · const — used by [js/crew/talk.js](talk.js.md)
- [`ROBOT_TOPICS`](#s-ROBOT_TOPICS) · const — used by [js/crew/talk.js](talk.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-Q"></a>`Q(c, s)`

function · L7–7

- called by: [`ROBOT_TOPICS.say`](#s-ROBOT_TOPICS-say) · [`ROBOT_TOPICS.say.say`](#s-ROBOT_TOPICS-say-say) · [`ROBOT_TOPICS.say~2`](#s-ROBOT_TOPICS-say-2) · [`ROBOT_TOPICS.say~2.say`](#s-ROBOT_TOPICS-say-2-say) · [`ROBOT_TOPICS.say~3`](#s-ROBOT_TOPICS-say-3) · [`ROBOT_TOPICS.say~3.say`](#s-ROBOT_TOPICS-say-3-say) · [`ROBOT_TOPICS.say~3.say~2`](#s-ROBOT_TOPICS-say-3-say-2) · [`TREE.say`](#s-TREE-say) ×2 · [`TREE.say.say.say`](#s-TREE-say-say-say) · [`TREE.say.say.say~2`](#s-TREE-say-say-say-2) · [`TREE.say.say.say~3`](#s-TREE-say-say-say-3) · [`TREE.say.say~2.say`](#s-TREE-say-say-2-say) · [`TREE.say.say~2.say~2`](#s-TREE-say-say-2-say-2) · [`TREE.say.say~3`](#s-TREE-say-say-3) · [`TREE.say~10`](#s-TREE-say-10) · [`TREE.say~10.say.say`](#s-TREE-say-10-say-say) · [`TREE.say~10.say.say~2`](#s-TREE-say-10-say-say-2) · [`TREE.say~10.say~2`](#s-TREE-say-10-say-2) · [`TREE.say~11`](#s-TREE-say-11) · [`TREE.say~11.say`](#s-TREE-say-11-say) · [`TREE.say~11.say~2.say`](#s-TREE-say-11-say-2-say) · [`TREE.say~11.say~2.say~2`](#s-TREE-say-11-say-2-say-2) · [`TREE.say~11.say~2.say~3`](#s-TREE-say-11-say-2-say-3) · [`TREE.say~12`](#s-TREE-say-12) · [`TREE.say~12.say.say`](#s-TREE-say-12-say-say) · [`TREE.say~12.say.say~2`](#s-TREE-say-12-say-say-2) · [`TREE.say~12.say~2`](#s-TREE-say-12-say-2) · [`TREE.say~13`](#s-TREE-say-13) ×2 · [`TREE.say~13.say`](#s-TREE-say-13-say) · [`TREE.say~13.say~2`](#s-TREE-say-13-say-2) · [`TREE.say~13.say~3.say`](#s-TREE-say-13-say-3-say) · [`TREE.say~13.say~3.say~2`](#s-TREE-say-13-say-3-say-2) · [`TREE.say~14`](#s-TREE-say-14) · [`TREE.say~14.say.say`](#s-TREE-say-14-say-say) · [`TREE.say~14.say.say~2`](#s-TREE-say-14-say-say-2) · [`TREE.say~14.say~2`](#s-TREE-say-14-say-2) · [`TREE.say~15`](#s-TREE-say-15) · [`TREE.say~15.say.say`](#s-TREE-say-15-say-say) · [`TREE.say~15.say.say~2`](#s-TREE-say-15-say-say-2) · [`TREE.say~15.say~2`](#s-TREE-say-15-say-2) · [`TREE.say~15.say~3`](#s-TREE-say-15-say-3) · [`TREE.say~15.say~4`](#s-TREE-say-15-say-4) · [`TREE.say~15.say~5`](#s-TREE-say-15-say-5) · [`TREE.say~16`](#s-TREE-say-16) · [`TREE.say~16.say.say`](#s-TREE-say-16-say-say) · [`TREE.say~16.say.say~2`](#s-TREE-say-16-say-say-2) · [`TREE.say~16.say~2`](#s-TREE-say-16-say-2) · [`TREE.say~2`](#s-TREE-say-2) · [`TREE.say~2.say.say`](#s-TREE-say-2-say-say) · [`TREE.say~2.say.say~2`](#s-TREE-say-2-say-say-2) · [`TREE.say~2.say~2`](#s-TREE-say-2-say-2) · [`TREE.say~2.say~3.say`](#s-TREE-say-2-say-3-say) · [`TREE.say~2.say~3.say~2`](#s-TREE-say-2-say-3-say-2) · [`TREE.say~2.say~4`](#s-TREE-say-2-say-4) · [`TREE.say~2.say~5.say`](#s-TREE-say-2-say-5-say) · [`TREE.say~2.say~5.say~2`](#s-TREE-say-2-say-5-say-2) · [`TREE.say~2.say~6`](#s-TREE-say-2-say-6) · [`TREE.say~2.say~7.say`](#s-TREE-say-2-say-7-say) · [`TREE.say~2.say~7.say~2`](#s-TREE-say-2-say-7-say-2) · [`TREE.say~3.say`](#s-TREE-say-3-say) · [`TREE.say~3.say~2.say`](#s-TREE-say-3-say-2-say) · [`TREE.say~3.say~2.say~2`](#s-TREE-say-3-say-2-say-2) · [`TREE.say~4`](#s-TREE-say-4) · [`TREE.say~4.say.say`](#s-TREE-say-4-say-say) · [`TREE.say~4.say.say~2`](#s-TREE-say-4-say-say-2) · [`TREE.say~4.say.say~3`](#s-TREE-say-4-say-say-3) · [`TREE.say~4.say~2.say`](#s-TREE-say-4-say-2-say) · [`TREE.say~4.say~2.say~2`](#s-TREE-say-4-say-2-say-2) · [`TREE.say~5`](#s-TREE-say-5) · [`TREE.say~5.say.say`](#s-TREE-say-5-say-say) · [`TREE.say~5.say.say~2`](#s-TREE-say-5-say-say-2) · [`TREE.say~5.say~2`](#s-TREE-say-5-say-2) · [`TREE.say~6`](#s-TREE-say-6) · [`TREE.say~6.say.say`](#s-TREE-say-6-say-say) · [`TREE.say~6.say.say~2`](#s-TREE-say-6-say-say-2) · [`TREE.say~6.say~2`](#s-TREE-say-6-say-2) · [`TREE.say~7`](#s-TREE-say-7) · [`TREE.say~7.say`](#s-TREE-say-7-say) · [`TREE.say~7.say.say`](#s-TREE-say-7-say-say) · [`TREE.say~7.say.say~2`](#s-TREE-say-7-say-say-2) · [`TREE.say~7.say~2`](#s-TREE-say-7-say-2) · [`TREE.say~8`](#s-TREE-say-8) · [`TREE.say~8.say`](#s-TREE-say-8-say) · [`TREE.say~8.say~2`](#s-TREE-say-8-say-2) · [`TREE.say~8.say~3.say`](#s-TREE-say-8-say-3-say) · [`TREE.say~8.say~3.say~2`](#s-TREE-say-8-say-3-say-2) · [`TREE.say~8.say~4`](#s-TREE-say-8-say-4) · [`TREE.say~8.say~5`](#s-TREE-say-8-say-5) · [`TREE.say~9`](#s-TREE-say-9) · [`TREE.say~9.say`](#s-TREE-say-9-say) · [`TREE.say~9.say.say`](#s-TREE-say-9-say-say) · [`TREE.say~9.say.say~2`](#s-TREE-say-9-say-say-2) · [`TREE.say~9.say~2.say`](#s-TREE-say-9-say-2-say) · [`TREE.say~9.say~2.say~2`](#s-TREE-say-9-say-2-say-2) · [`TREE.say~9.say~2.say~3`](#s-TREE-say-9-say-2-say-3) · [`go`](#s-go)

<!-- note:Q -->
<!-- /note -->

### <a id="s-hi"></a>`hi(t, k)`

function · L8–8

- called by: [`TREE.say~11`](#s-TREE-say-11) ×2 · [`TREE.say~12`](#s-TREE-say-12) · [`TREE.say~15`](#s-TREE-say-15) · [`TREE.say~2`](#s-TREE-say-2) ×3 · [`TREE.say~5.say~2`](#s-TREE-say-5-say-2) · [`TREE.say~6`](#s-TREE-say-6) · [`TREE.say~8.say~3`](#s-TREE-say-8-say-3) · [`TREE.say~8.say~3.say~2`](#s-TREE-say-8-say-3-say-2) · [`pick`](#s-pick)

<!-- note:hi -->
<!-- /note -->

### <a id="s-lo"></a>`lo(t, k)`

function · L9–9

- called by: [`TREE.say~15`](#s-TREE-say-15) · [`TREE.say~9`](#s-TREE-say-9)

<!-- note:lo -->
<!-- /note -->

### <a id="s-pick"></a>`pick(t, table)`

function · L10–13

- calls: [`hi`](#s-hi)
- called by: [`TREE.say.say~2`](#s-TREE-say-say-2) · [`TREE.say~10`](#s-TREE-say-10) · [`TREE.say~10.say`](#s-TREE-say-10-say) · [`TREE.say~12.say.say`](#s-TREE-say-12-say-say) · [`TREE.say~3.say~2`](#s-TREE-say-3-say-2) · [`TREE.say~3.say~2.say`](#s-TREE-say-3-say-2-say) · [`TREE.say~4`](#s-TREE-say-4) · [`TREE.say~4.say`](#s-TREE-say-4-say) · [`TREE.say~4.say.say~3`](#s-TREE-say-4-say-say-3) · [`TREE.say~4.say~2`](#s-TREE-say-4-say-2) · [`TREE.say~5`](#s-TREE-say-5) · [`TREE.say~5.say`](#s-TREE-say-5-say) · [`TREE.say~6`](#s-TREE-say-6) · [`TREE.say~7.say~2`](#s-TREE-say-7-say-2) · [`TREE.say~8`](#s-TREE-say-8) ×2 · [`TREE.say~8.say~3`](#s-TREE-say-8-say-3) · [`TREE.say~9`](#s-TREE-say-9)

<!-- note:pick -->
First trait in `table`'s key order that leans high, else `else`.
<!-- /note -->

### <a id="s-cap"></a>`cap(s)`

function · L14–14

- called by: [`TREE.say~4`](#s-TREE-say-4)

<!-- note:cap -->
<!-- /note -->

### <a id="s-lowest"></a>`lowest(c)`

function · L15–15

- called by: [`TREE.say~7`](#s-TREE-say-7)

<!-- note:lowest -->
<!-- /note -->

### <a id="s-go"></a>`go(c, text, choices)`

function · L17–17

- calls: [`Q`](#s-Q)
- called by: [`TREE.say.say`](#s-TREE-say-say) · [`TREE.say.say~2`](#s-TREE-say-say-2) · [`TREE.say~10.say`](#s-TREE-say-10-say) · [`TREE.say~11.say~2`](#s-TREE-say-11-say-2) · [`TREE.say~12.say`](#s-TREE-say-12-say) · [`TREE.say~13.say~3`](#s-TREE-say-13-say-3) · [`TREE.say~14.say`](#s-TREE-say-14-say) · [`TREE.say~15.say`](#s-TREE-say-15-say) · [`TREE.say~16.say`](#s-TREE-say-16-say) · [`TREE.say~2.say`](#s-TREE-say-2-say) · [`TREE.say~2.say~3`](#s-TREE-say-2-say-3) · [`TREE.say~2.say~5`](#s-TREE-say-2-say-5) · [`TREE.say~2.say~7`](#s-TREE-say-2-say-7) · [`TREE.say~3.say~2`](#s-TREE-say-3-say-2) · [`TREE.say~4.say`](#s-TREE-say-4-say) · [`TREE.say~4.say~2`](#s-TREE-say-4-say-2) · [`TREE.say~5.say`](#s-TREE-say-5-say) · [`TREE.say~6.say`](#s-TREE-say-6-say) · [`TREE.say~7.say`](#s-TREE-say-7-say) · [`TREE.say~8.say~3`](#s-TREE-say-8-say-3) · [`TREE.say~9.say`](#s-TREE-say-9-say) · [`TREE.say~9.say~2`](#s-TREE-say-9-say-2)

<!-- note:go -->
0.3.17 — conversations are threads now, not one line and done.

A choice's `say` may return a string (the exchange ends) or `{ text,
choices }` — the hand answers AND carries it on, and the captain's next
options answer what was just said. Every topic below runs two or three
turns. And the ends of threads leave flags that later conversations pick
up (talk-threads.js): what you promised, what they told you, who you said
you would look after — so the next time you sit down with them it is the
next part of the same conversation, not a fresh one.
<!-- /note -->

### <a id="s-TREE"></a>`TREE`

const · **exported** · L19–297

<!-- note:TREE -->
---- the human tree --------------------------------------------------------

- L20 · `{` — STATION — tier 0
- L20 · `{` — THE RUN — tier 0, reads mission.active
- L20 · `{` — RECORD — tier 0
- L20 · `{` — PAST — tier 1
- L20 · `{` — MESS TALK — tier 1
- L20 · `{` — CREWMATES — tier 1, one choice per tie
- L20 · `{` — FEARS / HOPES — tier 2
- L20 · `{` — WAGE — tier 2
- L20 · `{` — APOLOGY — after a dressing-down
- L20 · `{` — PARTNER (crew) — tier 2
- L20 · `{` — KIDS — tier 2
- L20 · `{` — PROMISE — tier 3, once
- L20 · `{` — THE CONN — tier 3
<!-- /note -->

#### <a id="s-TREE-say"></a>`TREE.say(m, c)`

prop · L22–39

- calls: [`wearLine`](duties.js.md#s-wearLine) _js/crew/duties.js_ · [`dutyOf`](roster.js.md#s-dutyOf) _js/crew/roster.js_ · [`dutyOptions`](roster.js.md#s-dutyOptions) _js/crew/roster.js_ · [`Q`](#s-Q) ×2 · [`line`](voice.js.md#s-line) _js/crew/voice.js_ ×2
- via [js/crew/roster.js](roster.js.md): `dutyOptions.some`

<!-- note:TREE.say -->
<!-- /note -->

##### <a id="s-TREE-say-say"></a>`TREE.say.say(m2, c2)`

prop · L28–32

- calls: [`go`](#s-go) · [`line`](voice.js.md#s-line) _js/crew/voice.js_

<!-- note:TREE.say.say -->
<!-- /note -->

###### <a id="s-TREE-say-say-say"></a>`TREE.say.say.say(m3, c3)`

prop · L29–29

- calls: [`Q`](#s-Q)

<!-- note:TREE.say.say.say -->
<!-- /note -->

###### <a id="s-TREE-say-say-say-2"></a>`TREE.say.say.say~2(m3, c3)`

prop · L30–30

- calls: [`Q`](#s-Q)

<!-- note:TREE.say.say.say~2 -->
<!-- /note -->

###### <a id="s-TREE-say-say-say-3"></a>`TREE.say.say.say~3(m3, c3)`

prop · L31–31

- calls: [`Q`](#s-Q)

<!-- note:TREE.say.say.say~3 -->
<!-- /note -->

##### <a id="s-TREE-say-say-2"></a>`TREE.say.say~2(m2, c2)`

prop · L33–36

- calls: [`go`](#s-go) · [`pick`](#s-pick) · [`line`](voice.js.md#s-line) _js/crew/voice.js_

<!-- note:TREE.say.say~2 -->
<!-- /note -->

###### <a id="s-TREE-say-say-2-say"></a>`TREE.say.say~2.say(m3, c3)`

prop · L34–34

- calls: [`Q`](#s-Q)

<!-- note:TREE.say.say~2.say -->
<!-- /note -->

###### <a id="s-TREE-say-say-2-say-2"></a>`TREE.say.say~2.say~2(m3, c3)`

prop · L35–35

- calls: [`Q`](#s-Q)

<!-- note:TREE.say.say~2.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-say-3"></a>`TREE.say.say~3(m2, c2)`

prop · L37–37

- calls: [`Q`](#s-Q) · [`line`](voice.js.md#s-line) _js/crew/voice.js_

<!-- note:TREE.say.say~3 -->
<!-- /note -->

#### <a id="s-TREE-say-2"></a>`TREE.say~2(m, c)`

prop · L43–76

- calls: [`hi`](#s-hi) ×3 · [`Q`](#s-Q) · [`byTrait`](voice.js.md#s-byTrait) _js/crew/voice.js_ ×2

<!-- note:TREE.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-2-say"></a>`TREE.say~2.say(m2, c2)`

prop · L52–55

- calls: [`go`](#s-go)

<!-- note:TREE.say~2.say -->
<!-- /note -->

###### <a id="s-TREE-say-2-say-say"></a>`TREE.say~2.say.say(m3, c3)`

prop · L53–53

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~2.say.say -->
<!-- /note -->

###### <a id="s-TREE-say-2-say-say-2"></a>`TREE.say~2.say.say~2(m3, c3)`

prop · L54–54

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~2.say.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-2-say-2"></a>`TREE.say~2.say~2(m2, c2)`

prop · L56–56

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~2.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-2-say-3"></a>`TREE.say~2.say~3(m2, c2)`

prop · L58–61

- calls: [`go`](#s-go)

<!-- note:TREE.say~2.say~3 -->
<!-- /note -->

###### <a id="s-TREE-say-2-say-3-say"></a>`TREE.say~2.say~3.say(m3, c3)`

prop · L59–59

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~2.say~3.say -->
<!-- /note -->

###### <a id="s-TREE-say-2-say-3-say-2"></a>`TREE.say~2.say~3.say~2(m3, c3)`

prop · L60–60

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~2.say~3.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-2-say-4"></a>`TREE.say~2.say~4(m2, c2)`

prop · L62–62

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~2.say~4 -->
<!-- /note -->

##### <a id="s-TREE-say-2-say-5"></a>`TREE.say~2.say~5(m2, c2)`

prop · L64–67

- calls: [`go`](#s-go)

<!-- note:TREE.say~2.say~5 -->
<!-- /note -->

###### <a id="s-TREE-say-2-say-5-say"></a>`TREE.say~2.say~5.say(m3, c3)`

prop · L65–65

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~2.say~5.say -->
<!-- /note -->

###### <a id="s-TREE-say-2-say-5-say-2"></a>`TREE.say~2.say~5.say~2(m3, c3)`

prop · L66–66

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~2.say~5.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-2-say-6"></a>`TREE.say~2.say~6(m2, c2)`

prop · L68–68

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~2.say~6 -->
<!-- /note -->

##### <a id="s-TREE-say-2-say-7"></a>`TREE.say~2.say~7(m2, c2)`

prop · L70–73

- calls: [`go`](#s-go)

<!-- note:TREE.say~2.say~7 -->
<!-- /note -->

###### <a id="s-TREE-say-2-say-7-say"></a>`TREE.say~2.say~7.say(m3, c3)`

prop · L71–71

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~2.say~7.say -->
<!-- /note -->

###### <a id="s-TREE-say-2-say-7-say-2"></a>`TREE.say~2.say~7.say~2(m3, c3)`

prop · L72–72

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~2.say~7.say~2 -->
<!-- /note -->

#### <a id="s-TREE-say-3"></a>`TREE.say~3(m, c)`

prop · L80–90

<!-- note:TREE.say~3 -->
<!-- /note -->

##### <a id="s-TREE-say-3-say"></a>`TREE.say~3.say(m2, c2)`

prop · L84–84

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~3.say -->
<!-- /note -->

##### <a id="s-TREE-say-3-say-2"></a>`TREE.say~3.say~2(m2, c2)`

prop · L85–88

- calls: [`go`](#s-go) · [`pick`](#s-pick)

<!-- note:TREE.say~3.say~2 -->
<!-- /note -->

###### <a id="s-TREE-say-3-say-2-say"></a>`TREE.say~3.say~2.say(m3, c3)`

prop · L86–86

- calls: [`pick`](#s-pick) · [`Q`](#s-Q)

<!-- note:TREE.say~3.say~2.say -->
<!-- /note -->

###### <a id="s-TREE-say-3-say-2-say-2"></a>`TREE.say~3.say~2.say~2(m3, c3)`

prop · L87–87

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~3.say~2.say~2 -->
<!-- /note -->

#### <a id="s-TREE-say-4"></a>`TREE.say~4(m, c)`

prop · L94–107

- calls: [`cap`](#s-cap) · [`pick`](#s-pick) · [`Q`](#s-Q)

<!-- note:TREE.say~4 -->
<!-- /note -->

##### <a id="s-TREE-say-4-say"></a>`TREE.say~4.say(m2, c2)`

prop · L97–101

- calls: [`go`](#s-go) · [`pick`](#s-pick)

<!-- note:TREE.say~4.say -->
<!-- /note -->

###### <a id="s-TREE-say-4-say-say"></a>`TREE.say~4.say.say(m3, c3)`

prop · L98–98

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~4.say.say -->
<!-- /note -->

###### <a id="s-TREE-say-4-say-say-2"></a>`TREE.say~4.say.say~2(m3, c3)`

prop · L99–99

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~4.say.say~2 -->
<!-- /note -->

###### <a id="s-TREE-say-4-say-say-3"></a>`TREE.say~4.say.say~3(m3, c3)`

prop · L100–100

- calls: [`pick`](#s-pick) · [`Q`](#s-Q)

<!-- note:TREE.say~4.say.say~3 -->
<!-- /note -->

##### <a id="s-TREE-say-4-say-2"></a>`TREE.say~4.say~2(m2, c2)`

prop · L102–105

- calls: [`go`](#s-go) · [`pick`](#s-pick)

<!-- note:TREE.say~4.say~2 -->
<!-- /note -->

###### <a id="s-TREE-say-4-say-2-say"></a>`TREE.say~4.say~2.say(m3, c3)`

prop · L103–103

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~4.say~2.say -->
<!-- /note -->

###### <a id="s-TREE-say-4-say-2-say-2"></a>`TREE.say~4.say~2.say~2(m3, c3)`

prop · L104–104

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~4.say~2.say~2 -->
<!-- /note -->

#### <a id="s-TREE-say-5"></a>`TREE.say~5(m, c)`

prop · L111–119

- calls: [`pick`](#s-pick) · [`Q`](#s-Q)

<!-- note:TREE.say~5 -->
<!-- /note -->

##### <a id="s-TREE-say-5-say"></a>`TREE.say~5.say(m2, c2)`

prop · L113–116

- calls: [`go`](#s-go) · [`pick`](#s-pick)

<!-- note:TREE.say~5.say -->
<!-- /note -->

###### <a id="s-TREE-say-5-say-say"></a>`TREE.say~5.say.say(m3, c3)`

prop · L114–114

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~5.say.say -->
<!-- /note -->

###### <a id="s-TREE-say-5-say-say-2"></a>`TREE.say~5.say.say~2(m3, c3)`

prop · L115–115

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~5.say.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-5-say-2"></a>`TREE.say~5.say~2(m2, c2)`

prop · L117–117

- calls: [`hi`](#s-hi) · [`Q`](#s-Q)

<!-- note:TREE.say~5.say~2 -->
<!-- /note -->

#### <a id="s-TREE-say-6"></a>`TREE.say~6(m, c)`

prop · L123–134

- calls: [`hi`](#s-hi) · [`pick`](#s-pick) · [`Q`](#s-Q)

<!-- note:TREE.say~6 -->
<!-- /note -->

##### <a id="s-TREE-say-6-say"></a>`TREE.say~6.say(m2, c2)`

prop · L128–131

- calls: [`go`](#s-go)

<!-- note:TREE.say~6.say -->
<!-- /note -->

###### <a id="s-TREE-say-6-say-say"></a>`TREE.say~6.say.say(m3, c3)`

prop · L129–129

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~6.say.say -->
<!-- /note -->

###### <a id="s-TREE-say-6-say-say-2"></a>`TREE.say~6.say.say~2(m3, c3)`

prop · L130–130

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~6.say.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-6-say-2"></a>`TREE.say~6.say~2(m2, c2)`

prop · L132–132

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~6.say~2 -->
<!-- /note -->

#### <a id="s-TREE-when"></a>`TREE.when(m, c)`

prop · L137–137

<!-- note:TREE.when -->
<!-- /note -->

#### <a id="s-TREE-say-7"></a>`TREE.say~7(m, c)`

prop · L138–149

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ · [`lowest`](#s-lowest) · [`Q`](#s-Q)

<!-- note:TREE.say~7 -->
<!-- /note -->

##### <a id="s-TREE-say-7-say"></a>`TREE.say~7.say(m2, c2)`

prop · L143–146

- calls: [`go`](#s-go) · [`Q`](#s-Q)

<!-- note:TREE.say~7.say -->
<!-- /note -->

###### <a id="s-TREE-say-7-say-say"></a>`TREE.say~7.say.say(m3, c3)`

prop · L144–144

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~7.say.say -->
<!-- /note -->

###### <a id="s-TREE-say-7-say-say-2"></a>`TREE.say~7.say.say~2(m3, c3)`

prop · L145–145

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~7.say.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-7-say-2"></a>`TREE.say~7.say~2(m2, c2)`

prop · L147–147

- calls: [`pick`](#s-pick) · [`Q`](#s-Q)

<!-- note:TREE.say~7.say~2 -->
<!-- /note -->

#### <a id="s-TREE-when-2"></a>`TREE.when~2(m, c)`

prop · L152–152

<!-- note:TREE.when~2 -->
<!-- /note -->

#### <a id="s-TREE-say-8"></a>`TREE.say~8(m, c)`

prop · L153–175

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×2 · [`pick`](#s-pick) ×2 · [`Q`](#s-Q)

<!-- note:TREE.say~8 -->
<!-- /note -->

##### <a id="s-TREE-say-8-say"></a>`TREE.say~8.say(m2, c2)`

prop · L163–163

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~8.say -->
<!-- /note -->

##### <a id="s-TREE-say-8-say-2"></a>`TREE.say~8.say~2(m2, c2)`

prop · L164–164

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~8.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-8-say-3"></a>`TREE.say~8.say~3(m2, c2)`

prop · L166–169

- calls: [`go`](#s-go) · [`hi`](#s-hi) · [`pick`](#s-pick)

<!-- note:TREE.say~8.say~3 -->
<!-- /note -->

###### <a id="s-TREE-say-8-say-3-say"></a>`TREE.say~8.say~3.say(m3, c3)`

prop · L167–167

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~8.say~3.say -->
<!-- /note -->

###### <a id="s-TREE-say-8-say-3-say-2"></a>`TREE.say~8.say~3.say~2(m3, c3)`

prop · L168–168

- calls: [`hi`](#s-hi) · [`Q`](#s-Q)

<!-- note:TREE.say~8.say~3.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-8-say-4"></a>`TREE.say~8.say~4(m2, c2)`

prop · L170–170

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~8.say~4 -->
<!-- /note -->

##### <a id="s-TREE-say-8-say-5"></a>`TREE.say~8.say~5(m2, c2)`

prop · L173–173

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~8.say~5 -->
<!-- /note -->

#### <a id="s-TREE-say-9"></a>`TREE.say~9(m, c)`

prop · L179–195

- calls: [`lo`](#s-lo) · [`pick`](#s-pick) · [`Q`](#s-Q)

<!-- note:TREE.say~9 -->
<!-- /note -->

##### <a id="s-TREE-say-9-say"></a>`TREE.say~9.say(m2, c2)`

prop · L183–188

- calls: [`go`](#s-go) · [`Q`](#s-Q)

<!-- note:TREE.say~9.say -->
<!-- /note -->

###### <a id="s-TREE-say-9-say-say"></a>`TREE.say~9.say.say(m3, c3)`

prop · L185–185

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~9.say.say -->
<!-- /note -->

###### <a id="s-TREE-say-9-say-say-2"></a>`TREE.say~9.say.say~2(m3, c3)`

prop · L186–186

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~9.say.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-9-say-2"></a>`TREE.say~9.say~2(m2, c2)`

prop · L189–193

- calls: [`go`](#s-go)

<!-- note:TREE.say~9.say~2 -->
<!-- /note -->

###### <a id="s-TREE-say-9-say-2-say"></a>`TREE.say~9.say~2.say(m3, c3)`

prop · L190–190

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~9.say~2.say -->
<!-- /note -->

###### <a id="s-TREE-say-9-say-2-say-2"></a>`TREE.say~9.say~2.say~2(m3, c3)`

prop · L191–191

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~9.say~2.say~2 -->
<!-- /note -->

###### <a id="s-TREE-say-9-say-2-say-3"></a>`TREE.say~9.say~2.say~3(m3, c3)`

prop · L192–192

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~9.say~2.say~3 -->
<!-- /note -->

#### <a id="s-TREE-say-10"></a>`TREE.say~10(m, c)`

prop · L199–208

- calls: [`pick`](#s-pick) · [`Q`](#s-Q)

<!-- note:TREE.say~10 -->
<!-- /note -->

##### <a id="s-TREE-say-10-say"></a>`TREE.say~10.say(m2, c2)`

prop · L202–205

- calls: [`go`](#s-go) · [`pick`](#s-pick)

<!-- note:TREE.say~10.say -->
<!-- /note -->

###### <a id="s-TREE-say-10-say-say"></a>`TREE.say~10.say.say(m3, c3)`

prop · L203–203

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~10.say.say -->
<!-- /note -->

###### <a id="s-TREE-say-10-say-say-2"></a>`TREE.say~10.say.say~2(m3, c3)`

prop · L204–204

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~10.say.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-10-say-2"></a>`TREE.say~10.say~2(m2, c2)`

prop · L206–206

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~10.say~2 -->
<!-- /note -->

#### <a id="s-TREE-when-3"></a>`TREE.when~3(m)`

prop · L211–211

<!-- note:TREE.when~3 -->
<!-- /note -->

#### <a id="s-TREE-say-11"></a>`TREE.say~11(m, c)`

prop · L212–222

- calls: [`hi`](#s-hi) ×2 · [`Q`](#s-Q) · [`line`](voice.js.md#s-line) _js/crew/voice.js_

<!-- note:TREE.say~11 -->
<!-- /note -->

##### <a id="s-TREE-say-11-say"></a>`TREE.say~11.say(m2, c2)`

prop · L215–215

- calls: [`Q`](#s-Q) · [`line`](voice.js.md#s-line) _js/crew/voice.js_

<!-- note:TREE.say~11.say -->
<!-- /note -->

##### <a id="s-TREE-say-11-say-2"></a>`TREE.say~11.say~2(m2, c2)`

prop · L216–220

- calls: [`go`](#s-go) · [`line`](voice.js.md#s-line) _js/crew/voice.js_

<!-- note:TREE.say~11.say~2 -->
<!-- /note -->

###### <a id="s-TREE-say-11-say-2-say"></a>`TREE.say~11.say~2.say(m3, c3)`

prop · L217–217

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~11.say~2.say -->
<!-- /note -->

###### <a id="s-TREE-say-11-say-2-say-2"></a>`TREE.say~11.say~2.say~2(m3, c3)`

prop · L218–218

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~11.say~2.say~2 -->
<!-- /note -->

###### <a id="s-TREE-say-11-say-2-say-3"></a>`TREE.say~11.say~2.say~3(m3, c3)`

prop · L219–219

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~11.say~2.say~3 -->
<!-- /note -->

#### <a id="s-TREE-when-4"></a>`TREE.when~4(m, c)`

prop · L225–225

<!-- note:TREE.when~4 -->
<!-- /note -->

#### <a id="s-TREE-say-12"></a>`TREE.say~12(m, c)`

prop · L226–234

- calls: [`hi`](#s-hi) · [`Q`](#s-Q) · [`line`](voice.js.md#s-line) _js/crew/voice.js_

<!-- note:TREE.say~12 -->
<!-- /note -->

##### <a id="s-TREE-say-12-say"></a>`TREE.say~12.say(m2, c2)`

prop · L228–231

- calls: [`go`](#s-go) · [`line`](voice.js.md#s-line) _js/crew/voice.js_

<!-- note:TREE.say~12.say -->
<!-- /note -->

###### <a id="s-TREE-say-12-say-say"></a>`TREE.say~12.say.say(m3, c3)`

prop · L229–229

- calls: [`pick`](#s-pick) · [`Q`](#s-Q)

<!-- note:TREE.say~12.say.say -->
<!-- /note -->

###### <a id="s-TREE-say-12-say-say-2"></a>`TREE.say~12.say.say~2(m3, c3)`

prop · L230–230

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~12.say.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-12-say-2"></a>`TREE.say~12.say~2(m2, c2)`

prop · L232–232

- calls: [`Q`](#s-Q) · [`line`](voice.js.md#s-line) _js/crew/voice.js_

<!-- note:TREE.say~12.say~2 -->
<!-- /note -->

#### <a id="s-TREE-label"></a>`TREE.label(m, c)`

prop · L237–237

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_

<!-- note:TREE.label -->
<!-- /note -->

#### <a id="s-TREE-when-5"></a>`TREE.when~5(m, c)`

prop · L237–237

<!-- note:TREE.when~5 -->
<!-- /note -->

#### <a id="s-TREE-say-13"></a>`TREE.say~13(m, c)`

prop · L238–250

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ · [`rapportBetween`](ledger.js.md#s-rapportBetween) _js/crew/ledger.js_ · [`Q`](#s-Q) ×2 · [`line`](voice.js.md#s-line) _js/crew/voice.js_ ×3

<!-- note:TREE.say~13 -->
<!-- /note -->

##### <a id="s-TREE-say-13-say"></a>`TREE.say~13.say(m2, c2)`

prop · L240–240

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~13.say -->
<!-- /note -->

##### <a id="s-TREE-say-13-say-2"></a>`TREE.say~13.say~2(m2, c2)`

prop · L244–244

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~13.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-13-say-3"></a>`TREE.say~13.say~3(m2, c2)`

prop · L245–248

- calls: [`go`](#s-go)

<!-- note:TREE.say~13.say~3 -->
<!-- /note -->

###### <a id="s-TREE-say-13-say-3-say"></a>`TREE.say~13.say~3.say(m3, c3)`

prop · L246–246

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~13.say~3.say -->
<!-- /note -->

###### <a id="s-TREE-say-13-say-3-say-2"></a>`TREE.say~13.say~3.say~2(m3, c3)`

prop · L247–247

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~13.say~3.say~2 -->
<!-- /note -->

#### <a id="s-TREE-when-6"></a>`TREE.when~6(m, c)`

prop · L253–253

<!-- note:TREE.when~6 -->
<!-- /note -->

#### <a id="s-TREE-say-14"></a>`TREE.say~14(m, c)`

prop · L254–263

- calls: [`Q`](#s-Q) · [`line`](voice.js.md#s-line) _js/crew/voice.js_

<!-- note:TREE.say~14 -->
<!-- /note -->

##### <a id="s-TREE-say-14-say"></a>`TREE.say~14.say(m2, c2)`

prop · L257–260

- calls: [`go`](#s-go)

<!-- note:TREE.say~14.say -->
<!-- /note -->

###### <a id="s-TREE-say-14-say-say"></a>`TREE.say~14.say.say(m3, c3)`

prop · L258–258

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~14.say.say -->
<!-- /note -->

###### <a id="s-TREE-say-14-say-say-2"></a>`TREE.say~14.say.say~2(m3, c3)`

prop · L259–259

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~14.say.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-14-say-2"></a>`TREE.say~14.say~2(m2, c2)`

prop · L261–261

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~14.say~2 -->
<!-- /note -->

#### <a id="s-TREE-say-15"></a>`TREE.say~15(m, c)`

prop · L267–283

- calls: [`hi`](#s-hi) · [`lo`](#s-lo) · [`Q`](#s-Q) · [`line`](voice.js.md#s-line) _js/crew/voice.js_ ×2

<!-- note:TREE.say~15 -->
<!-- /note -->

##### <a id="s-TREE-say-15-say"></a>`TREE.say~15.say(m2, c2)`

prop · L271–274

- calls: [`go`](#s-go)

<!-- note:TREE.say~15.say -->
<!-- /note -->

###### <a id="s-TREE-say-15-say-say"></a>`TREE.say~15.say.say(m3, c3)`

prop · L272–272

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~15.say.say -->
<!-- /note -->

###### <a id="s-TREE-say-15-say-say-2"></a>`TREE.say~15.say.say~2(m3, c3)`

prop · L273–273

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~15.say.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-15-say-2"></a>`TREE.say~15.say~2(m2, c2)`

prop · L275–275

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~15.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-15-say-3"></a>`TREE.say~15.say~3(m2, c2)`

prop · L276–276

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~15.say~3 -->
<!-- /note -->

##### <a id="s-TREE-say-15-say-4"></a>`TREE.say~15.say~4(m2, c2)`

prop · L278–278

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~15.say~4 -->
<!-- /note -->

##### <a id="s-TREE-say-15-say-5"></a>`TREE.say~15.say~5(m2, c2)`

prop · L279–279

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~15.say~5 -->
<!-- /note -->

#### <a id="s-TREE-say-16"></a>`TREE.say~16(m, c)`

prop · L287–295

- calls: [`Q`](#s-Q) · [`line`](voice.js.md#s-line) _js/crew/voice.js_

<!-- note:TREE.say~16 -->
<!-- /note -->

##### <a id="s-TREE-say-16-say"></a>`TREE.say~16.say(m2, c2)`

prop · L289–292

- calls: [`trustOf`](family.js.md#s-trustOf) _js/crew/family.js_ · [`go`](#s-go)

<!-- note:TREE.say~16.say -->
<!-- /note -->

###### <a id="s-TREE-say-16-say-say"></a>`TREE.say~16.say.say(m3, c3)`

prop · L290–290

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~16.say.say -->
<!-- /note -->

###### <a id="s-TREE-say-16-say-say-2"></a>`TREE.say~16.say.say~2(m3, c3)`

prop · L291–291

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~16.say.say~2 -->
<!-- /note -->

##### <a id="s-TREE-say-16-say-2"></a>`TREE.say~16.say~2(m2, c2)`

prop · L293–293

- calls: [`Q`](#s-Q)

<!-- note:TREE.say~16.say~2 -->
<!-- /note -->

### <a id="s-ROBOT_TOPICS"></a>`ROBOT_TOPICS`

const · **exported** · L299–326

<!-- note:ROBOT_TOPICS -->
---- robots: three topics, no wage, no dinner ---------------------------------
<!-- /note -->

#### <a id="s-ROBOT_TOPICS-say"></a>`ROBOT_TOPICS.say(m, c)`

prop · L302–307

- calls: [`dutyOf`](roster.js.md#s-dutyOf) _js/crew/roster.js_ · [`Q`](#s-Q)

<!-- note:ROBOT_TOPICS.say -->
<!-- /note -->

##### <a id="s-ROBOT_TOPICS-say-say"></a>`ROBOT_TOPICS.say.say(m2, c2)`

prop · L306–306

- calls: [`Q`](#s-Q)

<!-- note:ROBOT_TOPICS.say.say -->
<!-- /note -->

#### <a id="s-ROBOT_TOPICS-say-2"></a>`ROBOT_TOPICS.say~2(m, c)`

prop · L311–315

- calls: [`Q`](#s-Q)

<!-- note:ROBOT_TOPICS.say~2 -->
<!-- /note -->

##### <a id="s-ROBOT_TOPICS-say-2-say"></a>`ROBOT_TOPICS.say~2.say(m2, c2)`

prop · L314–314

- calls: [`Q`](#s-Q)

<!-- note:ROBOT_TOPICS.say~2.say -->
<!-- /note -->

#### <a id="s-ROBOT_TOPICS-say-3"></a>`ROBOT_TOPICS.say~3(m, c)`

prop · L319–324

- calls: [`dutyOptions`](roster.js.md#s-dutyOptions) _js/crew/roster.js_ · [`Q`](#s-Q)

<!-- note:ROBOT_TOPICS.say~3 -->
<!-- /note -->

##### <a id="s-ROBOT_TOPICS-say-3-say"></a>`ROBOT_TOPICS.say~3.say(m2, c2)`

prop · L321–321

- calls: [`Q`](#s-Q)

<!-- note:ROBOT_TOPICS.say~3.say -->
<!-- /note -->

##### <a id="s-ROBOT_TOPICS-say-3-say-2"></a>`ROBOT_TOPICS.say~3.say~2(m2, c2)`

prop · L322–322

- calls: [`Q`](#s-Q)

<!-- note:ROBOT_TOPICS.say~3.say~2 -->
<!-- /note -->
