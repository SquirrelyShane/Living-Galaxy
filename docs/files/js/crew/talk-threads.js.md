# js/crew/talk-threads.js

[index](../../../README.md) · 221 lines · 70 symbols · 4 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — the next part of the conversation.

0.3.17. The talk tree used to be a list of openers: pick one, hear a line,
pick an answer, hear a line, done — and the next time you sat down with
that hand it was a fresh conversation. The flags the tree set (`hopeBacked`,
`longLane`, `looksAfter`, `watchesReactor`, `kidBerth`, `connOffered`) were
written and never read by anything.

These topics are the other end of those threads. Each one only appears
because of something said before, reads the ship as it is now — the mate
you said you'd look after and how their morale has actually moved, what
payroll actually did since you promised it, how much the hope fund actually
holds, what is actually in the lockers — and carries on from there, with
choices that answer it. A thread can close, loop back, or leave a new flag
for the next part.

The labels start with ↻ so a continuing conversation reads as one.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./ledger.js` | `crew`, `crewHooks`, `firstName`, `rapportBetween` | [js/crew/ledger.js](ledger.js.md) |
| 2 | `../sim/sim.js` | `sim`, `logEvent` | [js/sim/sim.js](../sim/sim.js.md) |
| 3 | `./duties.js` | `duties`, `wearLine` | [js/crew/duties.js](duties.js.md) |
| 4 | `../economy/materials.js` | `baseValue` | [js/economy/materials.js](../economy/materials.js.md) |

## Imported by

- [js/crew/talk.js](talk.js.md) — `THREADS`
- test/converse.test.mjs _(outside js/)_ — `hopeFundOf`

## Exports

- [`hopeFundOf`](#s-hopeFundOf) · function — used by test/converse.test.mjs
- [`THREADS`](#s-THREADS) · const — used by [js/crew/talk.js](talk.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-Q"></a>`Q(c, s)`

function · L6–6

- called by: [`THREADS.say.say`](#s-THREADS-say-say) · [`THREADS.say.say~2`](#s-THREADS-say-say-2) · [`THREADS.say.say~3`](#s-THREADS-say-say-3) · [`THREADS.say~10.say`](#s-THREADS-say-10-say) · [`THREADS.say~10.say~2`](#s-THREADS-say-10-say-2) · [`THREADS.say~11.say`](#s-THREADS-say-11-say) · [`THREADS.say~11.say~2`](#s-THREADS-say-11-say-2) · [`THREADS.say~12.say`](#s-THREADS-say-12-say) · [`THREADS.say~12.say~2`](#s-THREADS-say-12-say-2) · [`THREADS.say~13.say`](#s-THREADS-say-13-say) · [`THREADS.say~14.say`](#s-THREADS-say-14-say) · [`THREADS.say~14.say~2`](#s-THREADS-say-14-say-2) · [`THREADS.say~2.say`](#s-THREADS-say-2-say) · [`THREADS.say~2.say~2`](#s-THREADS-say-2-say-2) · [`THREADS.say~2.say~3`](#s-THREADS-say-2-say-3) · [`THREADS.say~3.say`](#s-THREADS-say-3-say) · [`THREADS.say~3.say~2`](#s-THREADS-say-3-say-2) · [`THREADS.say~3.say~3`](#s-THREADS-say-3-say-3) · [`THREADS.say~4.say`](#s-THREADS-say-4-say) · [`THREADS.say~4.say~2`](#s-THREADS-say-4-say-2) · [`THREADS.say~5.say`](#s-THREADS-say-5-say) · [`THREADS.say~5.say~2`](#s-THREADS-say-5-say-2) · [`THREADS.say~5.say~3`](#s-THREADS-say-5-say-3) · [`THREADS.say~6.say`](#s-THREADS-say-6-say) · [`THREADS.say~6.say~2`](#s-THREADS-say-6-say-2) · [`THREADS.say~6.say~3`](#s-THREADS-say-6-say-3) · [`THREADS.say~7.say`](#s-THREADS-say-7-say) · [`THREADS.say~7.say~2`](#s-THREADS-say-7-say-2) · [`THREADS.say~8.say`](#s-THREADS-say-8-say) · [`THREADS.say~8.say~2`](#s-THREADS-say-8-say-2) · [`THREADS.say~9.say`](#s-THREADS-say-9-say) · [`THREADS.say~9.say~2`](#s-THREADS-say-9-say-2) · [`go`](#s-go)

<!-- note:Q -->
<!-- /note -->

### <a id="s-go"></a>`go(c, text, choices)`

function · L7–7

- calls: [`Q`](#s-Q)
- called by: [`THREADS.say`](#s-THREADS-say) · [`THREADS.say~10`](#s-THREADS-say-10) · [`THREADS.say~11`](#s-THREADS-say-11) · [`THREADS.say~12`](#s-THREADS-say-12) · [`THREADS.say~13`](#s-THREADS-say-13) · [`THREADS.say~14`](#s-THREADS-say-14) · [`THREADS.say~2`](#s-THREADS-say-2) · [`THREADS.say~3`](#s-THREADS-say-3) · [`THREADS.say~4`](#s-THREADS-say-4) · [`THREADS.say~5`](#s-THREADS-say-5) · [`THREADS.say~6`](#s-THREADS-say-6) ×2 · [`THREADS.say~7`](#s-THREADS-say-7) · [`THREADS.say~8`](#s-THREADS-say-8) · [`THREADS.say~9`](#s-THREADS-say-9)

<!-- note:go -->
<!-- /note -->

### <a id="s-hi"></a>`hi(t, k)`

function · L8–8

- called by: [`THREADS.say`](#s-THREADS-say) ×2

<!-- note:hi -->
<!-- /note -->

### <a id="s-F"></a>`F(c)`

function · L9–9

- called by: [`THREADS.label`](#s-THREADS-label) · [`THREADS.label~2`](#s-THREADS-label-2) · [`THREADS.say`](#s-THREADS-say) ×2 · [`THREADS.say~12`](#s-THREADS-say-12) · [`THREADS.say~14`](#s-THREADS-say-14) · [`THREADS.say~2`](#s-THREADS-say-2) ×2 · [`THREADS.say~3`](#s-THREADS-say-3) ×2 · [`THREADS.say~7`](#s-THREADS-say-7) · [`THREADS.say~8`](#s-THREADS-say-8) · [`THREADS.when`](#s-THREADS-when) ×2 · [`THREADS.when~10`](#s-THREADS-when-10) · [`THREADS.when~11`](#s-THREADS-when-11) ×2 · [`THREADS.when~12`](#s-THREADS-when-12) · [`THREADS.when~13`](#s-THREADS-when-13) · [`THREADS.when~14`](#s-THREADS-when-14) ×2 · [`THREADS.when~2`](#s-THREADS-when-2) ×3 · [`THREADS.when~3`](#s-THREADS-when-3) · [`THREADS.when~4`](#s-THREADS-when-4) · [`THREADS.when~5`](#s-THREADS-when-5) · [`THREADS.when~6`](#s-THREADS-when-6) ×3 · [`THREADS.when~7`](#s-THREADS-when-7) · [`THREADS.when~8`](#s-THREADS-when-8) ×2 · [`THREADS.when~9`](#s-THREADS-when-9)

<!-- note:F -->
<!-- /note -->

### <a id="s-mate"></a>`mate(id)`

function · L10–10

- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.find`
- called by: [`THREADS.label`](#s-THREADS-label) · [`THREADS.label~2`](#s-THREADS-label-2) · [`THREADS.say~14`](#s-THREADS-say-14) · [`THREADS.say~2`](#s-THREADS-say-2) · [`THREADS.when~14`](#s-THREADS-when-14) · [`THREADS.when~2`](#s-THREADS-when-2)

<!-- note:mate -->
<!-- /note -->

### <a id="s-hopeFundOf"></a>`hopeFundOf(m)`

function · **exported** · L12–14

- called by: [`THREADS.say`](#s-THREADS-say) · [`THREADS.say.say~2`](#s-THREADS-say-say-2)

<!-- note:hopeFundOf -->
Credits the fund holds for a hand: what they put aside plus what the captain matched.
<!-- /note -->

### <a id="s-THREADS"></a>`THREADS`

const · **exported** · L16–205

<!-- note:THREADS -->
- L17 · `{` — hopes → "I'll help you get there"
- L17 · `{` — mess talk → "I'll talk to &lt;them>"
- L17 · `{` — the run → "Watch the reactor for me"
- L17 · `{` — the run → "Keep the tally"
- L17 · `{` — the run → "Next time, the long lane" → "If there's time"
- L17 · `{` — last berth → "On the cycle, every cycle"
- L17 · `{` — fears → "I'll keep you safe" → how
- L17 · `{` — fears → "We all carry one" → the captain's own
- L17 · `{` — partner → "Next port, the night's yours"
- L17 · `{` — kids → "I'll teach them myself"
- L17 · `{` — wage → "Ten more cycles aboard"
- L17 · `{` — captaincy → habits at the conn
- L17 · `{` — record → "Tell me"
- L17 · `{` — mates → "Sort it out with &lt;them>"
<!-- /note -->

#### <a id="s-THREADS-when"></a>`THREADS.when(m, c)`

prop · L19–19

- calls: [`F`](#s-F) ×2

<!-- note:THREADS.when -->
<!-- /note -->

#### <a id="s-THREADS-say"></a>`THREADS.say(m, c)`

prop · L20–32

- calls: [`F`](#s-F) ×2 · [`go`](#s-go) · [`hi`](#s-hi) ×2 · [`hopeFundOf`](#s-hopeFundOf)

<!-- note:THREADS.say -->
<!-- /note -->

##### <a id="s-THREADS-say-say"></a>`THREADS.say.say(m2, c2)`

prop · L28–28

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say.say -->
<!-- /note -->

##### <a id="s-THREADS-say-say-2"></a>`THREADS.say.say~2(m2, c2)`

prop · L29–29

- calls: [`hopeFundOf`](#s-hopeFundOf) · [`Q`](#s-Q)

<!-- note:THREADS.say.say~2 -->
<!-- /note -->

##### <a id="s-THREADS-say-say-3"></a>`THREADS.say.say~3(m2, c2)`

prop · L30–30

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say.say~3 -->
<!-- /note -->

#### <a id="s-THREADS-label"></a>`THREADS.label(m, c)`

prop · L35–35

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ · [`F`](#s-F) · [`mate`](#s-mate)

<!-- note:THREADS.label -->
<!-- /note -->

#### <a id="s-THREADS-when-2"></a>`THREADS.when~2(m, c)`

prop · L36–36

- calls: [`F`](#s-F) ×3 · [`mate`](#s-mate)

<!-- note:THREADS.when~2 -->
<!-- /note -->

#### <a id="s-THREADS-say-2"></a>`THREADS.say~2(m, c)`

prop · L37–51

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ · [`F`](#s-F) ×2 · [`go`](#s-go) · [`mate`](#s-mate)

<!-- note:THREADS.say~2 -->
<!-- /note -->

##### <a id="s-THREADS-say-2-say"></a>`THREADS.say~2.say(m2, c2)`

prop · L47–47

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~2.say -->
<!-- /note -->

##### <a id="s-THREADS-say-2-say-2"></a>`THREADS.say~2.say~2(m2, c2)`

prop · L48–48

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~2.say~2 -->
<!-- /note -->

##### <a id="s-THREADS-say-2-say-3"></a>`THREADS.say~2.say~3(m2, c2)`

prop · L49–49

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~2.say~3 -->
<!-- /note -->

#### <a id="s-THREADS-when-3"></a>`THREADS.when~3(m, c)`

prop · L55–55

- calls: [`F`](#s-F)

<!-- note:THREADS.when~3 -->
<!-- /note -->

#### <a id="s-THREADS-say-3"></a>`THREADS.say~3(m, c)`

prop · L56–66

- calls: [`wearLine`](duties.js.md#s-wearLine) _js/crew/duties.js_ · [`F`](#s-F) ×2 · [`go`](#s-go)

<!-- note:THREADS.say~3 -->
<!-- /note -->

##### <a id="s-THREADS-say-3-say"></a>`THREADS.say~3.say(m2, c2)`

prop · L62–62

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~3.say -->
<!-- /note -->

##### <a id="s-THREADS-say-3-say-2"></a>`THREADS.say~3.say~2(m2, c2)`

prop · L63–63

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~3.say~2 -->
<!-- /note -->

##### <a id="s-THREADS-say-3-say-3"></a>`THREADS.say~3.say~3(m2, c2)`

prop · L64–64

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~3.say~3 -->
<!-- /note -->

#### <a id="s-THREADS-when-4"></a>`THREADS.when~4(m, c)`

prop · L70–70

- calls: [`F`](#s-F)

<!-- note:THREADS.when~4 -->
<!-- /note -->

#### <a id="s-THREADS-say-4"></a>`THREADS.say~4(m, c)`

prop · L71–85

- calls: [`go`](#s-go) · [`baseValue`](../economy/materials.js.md#s-baseValue) _js/economy/materials.js_

<!-- note:THREADS.say~4 -->
<!-- /note -->

##### <a id="s-THREADS-say-4-say"></a>`THREADS.say~4.say(m2, c2)`

prop · L82–82

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~4.say -->
<!-- /note -->

##### <a id="s-THREADS-say-4-say-2"></a>`THREADS.say~4.say~2(m2, c2)`

prop · L83–83

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~4.say~2 -->
<!-- /note -->

#### <a id="s-THREADS-when-5"></a>`THREADS.when~5(m, c)`

prop · L89–89

- calls: [`F`](#s-F)

<!-- note:THREADS.when~5 -->
<!-- /note -->

#### <a id="s-THREADS-say-5"></a>`THREADS.say~5(m, c)`

prop · L90–97

- calls: [`go`](#s-go)

<!-- note:THREADS.say~5 -->
<!-- /note -->

##### <a id="s-THREADS-say-5-say"></a>`THREADS.say~5.say(m2, c2)`

prop · L93–93

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~5.say -->
<!-- /note -->

##### <a id="s-THREADS-say-5-say-2"></a>`THREADS.say~5.say~2(m2, c2)`

prop · L94–94

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~5.say~2 -->
<!-- /note -->

##### <a id="s-THREADS-say-5-say-3"></a>`THREADS.say~5.say~3(m2, c2)`

prop · L95–95

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~5.say~3 -->
<!-- /note -->

#### <a id="s-THREADS-when-6"></a>`THREADS.when~6(m, c)`

prop · L101–101

- calls: [`F`](#s-F) ×3

<!-- note:THREADS.when~6 -->
<!-- /note -->

#### <a id="s-THREADS-say-6"></a>`THREADS.say~6(m, c)`

prop · L102–113

- calls: [`go`](#s-go) ×2

<!-- note:THREADS.say~6 -->
<!-- /note -->

##### <a id="s-THREADS-say-6-say"></a>`THREADS.say~6.say(m2, c2)`

prop · L106–106

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~6.say -->
<!-- /note -->

##### <a id="s-THREADS-say-6-say-2"></a>`THREADS.say~6.say~2(m2, c2)`

prop · L107–107

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~6.say~2 -->
<!-- /note -->

##### <a id="s-THREADS-say-6-say-3"></a>`THREADS.say~6.say~3(m2, c2)`

prop · L111–111

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~6.say~3 -->
<!-- /note -->

#### <a id="s-THREADS-when-7"></a>`THREADS.when~7(m, c)`

prop · L117–117

- calls: [`F`](#s-F)

<!-- note:THREADS.when~7 -->
<!-- /note -->

#### <a id="s-THREADS-say-7"></a>`THREADS.say~7(m, c)`

prop · L118–124

- calls: [`F`](#s-F) · [`go`](#s-go)

<!-- note:THREADS.say~7 -->
<!-- /note -->

##### <a id="s-THREADS-say-7-say"></a>`THREADS.say~7.say(m2, c2)`

prop · L121–121

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~7.say -->
<!-- /note -->

##### <a id="s-THREADS-say-7-say-2"></a>`THREADS.say~7.say~2(m2, c2)`

prop · L122–122

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~7.say~2 -->
<!-- /note -->

#### <a id="s-THREADS-when-8"></a>`THREADS.when~8(m, c)`

prop · L128–128

- calls: [`F`](#s-F) ×2

<!-- note:THREADS.when~8 -->
<!-- /note -->

#### <a id="s-THREADS-say-8"></a>`THREADS.say~8(m, c)`

prop · L129–135

- calls: [`F`](#s-F) · [`go`](#s-go)

<!-- note:THREADS.say~8 -->
<!-- /note -->

##### <a id="s-THREADS-say-8-say"></a>`THREADS.say~8.say(m2, c2)`

prop · L132–132

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~8.say -->
<!-- /note -->

##### <a id="s-THREADS-say-8-say-2"></a>`THREADS.say~8.say~2(m2, c2)`

prop · L133–133

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~8.say~2 -->
<!-- /note -->

#### <a id="s-THREADS-when-9"></a>`THREADS.when~9(m, c)`

prop · L139–139

- calls: [`F`](#s-F)

<!-- note:THREADS.when~9 -->
<!-- /note -->

#### <a id="s-THREADS-say-9"></a>`THREADS.say~9(m, c)`

prop · L140–146

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ · [`go`](#s-go)

<!-- note:THREADS.say~9 -->
<!-- /note -->

##### <a id="s-THREADS-say-9-say"></a>`THREADS.say~9.say(m2, c2)`

prop · L143–143

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~9.say -->
<!-- /note -->

##### <a id="s-THREADS-say-9-say-2"></a>`THREADS.say~9.say~2(m2, c2)`

prop · L144–144

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~9.say~2 -->
<!-- /note -->

#### <a id="s-THREADS-when-10"></a>`THREADS.when~10(m, c)`

prop · L150–150

- calls: [`F`](#s-F)

<!-- note:THREADS.when~10 -->
<!-- /note -->

#### <a id="s-THREADS-say-10"></a>`THREADS.say~10(m, c)`

prop · L151–157

- calls: [`go`](#s-go)

<!-- note:THREADS.say~10 -->
<!-- /note -->

##### <a id="s-THREADS-say-10-say"></a>`THREADS.say~10.say(m2, c2)`

prop · L154–154

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~10.say -->
<!-- /note -->

##### <a id="s-THREADS-say-10-say-2"></a>`THREADS.say~10.say~2(m2, c2)`

prop · L155–155

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~10.say~2 -->
<!-- /note -->

#### <a id="s-THREADS-when-11"></a>`THREADS.when~11(m, c)`

prop · L161–161

- calls: [`F`](#s-F) ×2

<!-- note:THREADS.when~11 -->
<!-- /note -->

#### <a id="s-THREADS-say-11"></a>`THREADS.say~11(m, c)`

prop · L162–167

- calls: [`go`](#s-go)

<!-- note:THREADS.say~11 -->
<!-- /note -->

##### <a id="s-THREADS-say-11-say"></a>`THREADS.say~11.say(m2, c2)`

prop · L164–164

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~11.say -->
<!-- /note -->

##### <a id="s-THREADS-say-11-say-2"></a>`THREADS.say~11.say~2(m2, c2)`

prop · L165–165

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~11.say~2 -->
<!-- /note -->

#### <a id="s-THREADS-when-12"></a>`THREADS.when~12(m, c)`

prop · L171–171

- calls: [`F`](#s-F)

<!-- note:THREADS.when~12 -->
<!-- /note -->

#### <a id="s-THREADS-say-12"></a>`THREADS.say~12(m, c)`

prop · L172–178

- calls: [`F`](#s-F) · [`go`](#s-go)

<!-- note:THREADS.say~12 -->
<!-- /note -->

##### <a id="s-THREADS-say-12-say"></a>`THREADS.say~12.say(m2, c2)`

prop · L175–175

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~12.say -->
<!-- /note -->

##### <a id="s-THREADS-say-12-say-2"></a>`THREADS.say~12.say~2(m2, c2)`

prop · L176–176

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~12.say~2 -->
<!-- /note -->

#### <a id="s-THREADS-when-13"></a>`THREADS.when~13(m, c)`

prop · L182–182

- calls: [`F`](#s-F)

<!-- note:THREADS.when~13 -->
<!-- /note -->

#### <a id="s-THREADS-say-13"></a>`THREADS.say~13(m, c)`

prop · L183–187

- calls: [`go`](#s-go)

<!-- note:THREADS.say~13 -->
<!-- /note -->

##### <a id="s-THREADS-say-13-say"></a>`THREADS.say~13.say(m2, c2)`

prop · L185–185

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~13.say -->
<!-- /note -->

#### <a id="s-THREADS-label-2"></a>`THREADS.label~2(m, c)`

prop · L190–190

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ · [`F`](#s-F) · [`mate`](#s-mate)

<!-- note:THREADS.label~2 -->
<!-- /note -->

#### <a id="s-THREADS-when-14"></a>`THREADS.when~14(m, c)`

prop · L191–191

- calls: [`F`](#s-F) ×2 · [`mate`](#s-mate)

<!-- note:THREADS.when~14 -->
<!-- /note -->

#### <a id="s-THREADS-say-14"></a>`THREADS.say~14(m, c)`

prop · L192–203

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ · [`rapportBetween`](ledger.js.md#s-rapportBetween) _js/crew/ledger.js_ · [`F`](#s-F) · [`go`](#s-go) · [`mate`](#s-mate)

<!-- note:THREADS.say~14 -->
<!-- /note -->

##### <a id="s-THREADS-say-14-say"></a>`THREADS.say~14.say(m2, c2)`

prop · L200–200

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~14.say -->
<!-- /note -->

##### <a id="s-THREADS-say-14-say-2"></a>`THREADS.say~14.say~2(m2, c2)`

prop · L201–201

- calls: [`Q`](#s-Q)

<!-- note:THREADS.say~14.say~2 -->
<!-- /note -->

### <a id="s-tickThreads"></a>`tickThreads()`

function · L207–220

- calls: [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_

<!-- note:tickThreads -->
---- the fund, cycle by cycle -------------------------------------------------
"Put it aside — I'll match it" is a promise with a price: every cycle the hand
puts a tenth of the wage in, and the ship matches it or it doesn't.
<!-- /note -->

## Module-level calls

- via [js/crew/ledger.js](ledger.js.md): `crewHooks.cycle.includes`, `crewHooks.cycle.push`
