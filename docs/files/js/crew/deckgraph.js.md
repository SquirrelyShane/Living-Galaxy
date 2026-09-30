# js/crew/deckgraph.js

[index](../../../README.md) · 440 lines · 155 symbols · 2 imports · 4 importers

## About

<!-- note:@file -->
Living Galaxy — the DECK GRAPH: what a hand decides to do with their watch.

The genome-agent project's decision graph is a 221-node brain for wolves,
fungi and golems. A crew member on a hull needs about a quarter of that and
none of the rest, so this is a purpose-built graph for one species in one
place: 53 nodes, built with the same engine (js/genome/behavior-graph.js),
validated by the same validator, traced the same way.

The trace is the point. Every hop leaves a line of plain language behind it,
and those lines are what the journal prints as "what made me act this" —
so a hand who stops speaking to the cook has a readable reason on file,
three cycles before the captain notices.

Gating is by capability, not by role: caps come off the genome (spacer.js),
so a synthetic hand never reaches the courting branch because `fertile` is
false for its entity type, not because a flag said "robot".

- L416 · `for (const id of Object.keys(nodes)) {` — Every `select` in the graph gets its weights bent by what this particular
  hand has learned works for them. One wrap, here, rather than forty edits to
  forty weight functions — and `behavior-graph.js` stays the verbatim port it
  was, with no idea that any of this is happening.
  
  A hand with nothing on file multiplies by exactly one, so a fresh crew
  behaves the way they did before there was a brain to consult.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../genome/behavior-graph.js` | `createGraph` | [js/genome/behavior-graph.js](../genome/behavior-graph.js.md) |
| 2 | `./learn.js` | `kindPrior` | [js/crew/learn.js](learn.js.md) |

## Imported by

- [js/crew/deckmind.js](deckmind.js.md) — `deckGraph`, `ACTION_META`
- [js/crew/orders.js](orders.js.md) — `ACTION_META`
- test/genome.test.mjs _(outside js/)_ — `deckGraph`, `ACTION_META`
- test/skycrew.test.mjs _(outside js/)_ — `deckGraph`, `kindOfNode`, `ACTION_META`, `NODE_KIND`

## Exports

- [`ACTION_META`](#s-ACTION_META) · const — used by [js/crew/deckmind.js](deckmind.js.md), [js/crew/orders.js](orders.js.md), test/genome.test.mjs, test/skycrew.test.mjs
- [`NODE_KIND`](#s-NODE_KIND) · const — used by test/skycrew.test.mjs
- [`kindOfNode`](#s-kindOfNode) · function — used by test/skycrew.test.mjs
- [`deckGraph`](#s-deckGraph) · const — used by [js/crew/deckmind.js](deckmind.js.md), test/genome.test.mjs, test/skycrew.test.mjs
- [`deckNodes`](#s-nodes) — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-act"></a>`act(id, label, kind, why)`

function · L4–4

- called by: [`nodes`](#s-nodes) ×51

<!-- note:act -->
<!-- /note -->

### <a id="s-ACTION_META"></a>`ACTION_META`

const · **exported** · L6–58

<!-- note:ACTION_META -->
Every terminal action, with the label and category the journal prints.

- L7 · `STAND_WATCH: { label: "stands their watch", kind: "duty" },` — the watch
- L22 · `BRACE: { label: "straps in and holds on", kind: "survival" },` — the emergency
- L27 · `SLEEP: { label: "sleeps", kind: "rest" },` — the body
- L33 · `TALK_TO: { label: "talks to somebody", kind: "social" },` — the others
- L54 · `STUDY: { label: "studies", kind: "study" },` — the self
<!-- /note -->

### <a id="s-need"></a>`need(c, k)`

function · L60–60

- called by: [`nodes.guard~13`](#s-nodes-guard-13) · [`nodes.guard~18`](#s-nodes-guard-18) · [`nodes.guard~2`](#s-nodes-guard-2) · [`nodes.guard~6`](#s-nodes-guard-6) · [`nodes.test~2`](#s-nodes-test-2) · [`nodes.weight~11`](#s-nodes-weight-11) · [`nodes.weight~12`](#s-nodes-weight-12) · [`nodes.weight~14`](#s-nodes-weight-14) · [`nodes.weight~16`](#s-nodes-weight-16) · [`nodes.weight~20`](#s-nodes-weight-20) · [`nodes.weight~21`](#s-nodes-weight-21) · [`nodes.weight~22`](#s-nodes-weight-22) · [`nodes.weight~23`](#s-nodes-weight-23) · [`nodes.weight~25`](#s-nodes-weight-25) · [`nodes.weight~26`](#s-nodes-weight-26) · [`nodes.weight~27`](#s-nodes-weight-27) · [`nodes.weight~28`](#s-nodes-weight-28) · [`nodes.weight~29`](#s-nodes-weight-29) · [`nodes.weight~31`](#s-nodes-weight-31) · [`nodes.weight~32`](#s-nodes-weight-32) · [`nodes.weight~36`](#s-nodes-weight-36) · [`nodes.weight~37`](#s-nodes-weight-37) · [`nodes.weight~42`](#s-nodes-weight-42) · [`nodes.weight~45`](#s-nodes-weight-45) · [`nodes.weight~46`](#s-nodes-weight-46) · [`nodes.weight~47`](#s-nodes-weight-47) · [`nodes.weight~50`](#s-nodes-weight-50) · [`nodes.weight~51`](#s-nodes-weight-51) · [`nodes.weight~59`](#s-nodes-weight-59) · [`nodes.weight~73`](#s-nodes-weight-73) · [`nodes.weight~78`](#s-nodes-weight-78)

<!-- note:need -->
Small readers over the decision context. `c` is built by deckmind.js.
<!-- /note -->

### <a id="s-cap"></a>`cap(c, k)`

function · L61–61

- called by: [`nodes.guard~15`](#s-nodes-guard-15) · [`nodes.guard~17`](#s-nodes-guard-17) · [`nodes.guard~4`](#s-nodes-guard-4) · [`nodes.guard~7`](#s-nodes-guard-7) · [`nodes.weight`](#s-nodes-weight)

<!-- note:cap -->
<!-- /note -->

### <a id="s-gene"></a>`gene(c, k)`

function · L62–62

- called by: [`nodes.weight`](#s-nodes-weight) · [`nodes.weight~13`](#s-nodes-weight-13) · [`nodes.weight~16`](#s-nodes-weight-16) · [`nodes.weight~18`](#s-nodes-weight-18) · [`nodes.weight~22`](#s-nodes-weight-22) · [`nodes.weight~24`](#s-nodes-weight-24) · [`nodes.weight~26`](#s-nodes-weight-26) · [`nodes.weight~3`](#s-nodes-weight-3) · [`nodes.weight~33`](#s-nodes-weight-33) · [`nodes.weight~4`](#s-nodes-weight-4) · [`nodes.weight~41`](#s-nodes-weight-41) · [`nodes.weight~43`](#s-nodes-weight-43) · [`nodes.weight~48`](#s-nodes-weight-48) · [`nodes.weight~5`](#s-nodes-weight-5) · [`nodes.weight~53`](#s-nodes-weight-53) · [`nodes.weight~54`](#s-nodes-weight-54) · [`nodes.weight~56`](#s-nodes-weight-56) · [`nodes.weight~58`](#s-nodes-weight-58) · [`nodes.weight~59`](#s-nodes-weight-59) · [`nodes.weight~60`](#s-nodes-weight-60) · [`nodes.weight~61`](#s-nodes-weight-61) · [`nodes.weight~69`](#s-nodes-weight-69) · [`nodes.weight~7`](#s-nodes-weight-7) · [`nodes.weight~8`](#s-nodes-weight-8) · [`nodes.weight~9`](#s-nodes-weight-9)

<!-- note:gene -->
<!-- /note -->

### <a id="s-someone"></a>`someone(c, kind)`

function · L63–63

- called by: [`nodes.guard`](#s-nodes-guard) ×2 · [`nodes.guard~22`](#s-nodes-guard-22) ×2 · [`nodes.guard~8`](#s-nodes-guard-8) ×2

<!-- note:someone -->
<!-- /note -->

### <a id="s-anyone"></a>`anyone(c)`

function · L64–64

- called by: [`nodes.guard~17`](#s-nodes-guard-17) · [`nodes.guard~21`](#s-nodes-guard-21) · [`nodes.guard~7`](#s-nodes-guard-7) · [`nodes.guard~9`](#s-nodes-guard-9) · [`nodes.test~4`](#s-nodes-test-4)

<!-- note:anyone -->
<!-- /note -->

### <a id="s-name"></a>`name(c)`

function · L65–65

- called by: [`nodes.why~8`](#s-nodes-why-8)

<!-- note:name -->
<!-- /note -->

### <a id="s-nodes"></a>`nodes`

const · **exported** · L67–396

- calls: [`act`](#s-act) ×51

<!-- note:nodes -->
- L68 · `root: {` — ---- routing ----------------------------------------------------------
- L94 · `"alarm.entry": {` — ---- the emergency ----------------------------------------------------
- L130 · `"condition.crisis": {` — ---- crisis -----------------------------------------------------------
- L142 · `"watch.entry": {` — ---- the watch --------------------------------------------------------
- L173 · `"mess.entry": {` — ---- the mess ---------------------------------------------------------
- L188 · `"quarters.entry": {` — ---- own time ---------------------------------------------------------
- L203 · `"grievance.entry": {` — ---- a grievance -------------------------------------------------------
  Owed wages, a hull nobody is maintaining, a rival on the same watch. It
  does not need company in the room to matter, which is why it has its own
  way in rather than hanging off social.entry.
- L228 · `"social.entry": {` — ---- other people -----------------------------------------------------
- L280 · `"intimate.entry": {` — ---- the ladder ---------------------------------------------------------
  strangers → noticed → interested → courting → together → bonded. Each rung
  is a different thing to do, each needs the one below it, and every one of
  them needs the interest to be mutual (crew/romance.js gates that, not a
  die roll here).
- L345 · `"act.standWatch": act("STAND_WATCH", ACTION_META.STAND_WATCH.label, "duty"),` — ---- terminals --------------------------------------------------------
<!-- /note -->

#### <a id="s-nodes-test"></a>`nodes.test(c)`

prop · L70–70

<!-- note:nodes.test -->
<!-- /note -->

#### <a id="s-nodes-why"></a>`nodes.why(c, r)`

prop · L72–74

<!-- note:nodes.why -->
<!-- /note -->

#### <a id="s-nodes-test-2"></a>`nodes.test~2(c)`

prop · L79–79

- calls: [`need`](#s-need)

<!-- note:nodes.test~2 -->
<!-- /note -->

#### <a id="s-nodes-why-2"></a>`nodes.why~2(c, r)`

prop · L81–83

<!-- note:nodes.why~2 -->
<!-- /note -->

#### <a id="s-nodes-on"></a>`nodes.on(c)`

prop · L88–88

<!-- note:nodes.on -->
<!-- /note -->

#### <a id="s-nodes-why-3"></a>`nodes.why~3(c, k)`

prop · L91–91

<!-- note:nodes.why~3 -->
<!-- /note -->

#### <a id="s-nodes-on-2"></a>`nodes.on~2(c)`

prop · L96–96

<!-- note:nodes.on~2 -->
<!-- /note -->

#### <a id="s-nodes-why-4"></a>`nodes.why~4(c, k)`

prop · L99–99

<!-- note:nodes.why~4 -->
<!-- /note -->

#### <a id="s-nodes-weight"></a>`nodes.weight(c)`

prop · L104–104

- calls: [`cap`](#s-cap) · [`gene`](#s-gene)

<!-- note:nodes.weight -->
<!-- /note -->

#### <a id="s-nodes-weight-2"></a>`nodes.weight~2(c)`

prop · L105–105

<!-- note:nodes.weight~2 -->
<!-- /note -->

#### <a id="s-nodes-weight-3"></a>`nodes.weight~3(c)`

prop · L106–106

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~3 -->
<!-- /note -->

#### <a id="s-nodes-weight-4"></a>`nodes.weight~4(c)`

prop · L107–107

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~4 -->
<!-- /note -->

#### <a id="s-nodes-weight-5"></a>`nodes.weight~5(c)`

prop · L114–114

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~5 -->
<!-- /note -->

#### <a id="s-nodes-weight-6"></a>`nodes.weight~6()`

prop · L115–115

<!-- note:nodes.weight~6 -->
<!-- /note -->

#### <a id="s-nodes-weight-7"></a>`nodes.weight~7(c)`

prop · L116–116

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~7 -->
<!-- /note -->

#### <a id="s-nodes-weight-8"></a>`nodes.weight~8(c)`

prop · L123–123

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~8 -->
<!-- /note -->

#### <a id="s-nodes-weight-9"></a>`nodes.weight~9(c)`

prop · L124–124

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~9 -->
<!-- /note -->

#### <a id="s-nodes-weight-10"></a>`nodes.weight~10()`

prop · L125–125

<!-- note:nodes.weight~10 -->
<!-- /note -->

#### <a id="s-nodes-weight-11"></a>`nodes.weight~11(c)`

prop · L133–133

- calls: [`need`](#s-need)

<!-- note:nodes.weight~11 -->
<!-- /note -->

#### <a id="s-nodes-weight-12"></a>`nodes.weight~12(c)`

prop · L134–134

- calls: [`need`](#s-need)

<!-- note:nodes.weight~12 -->
<!-- /note -->

#### <a id="s-nodes-guard"></a>`nodes.guard(c)`

prop · L135–135

- calls: [`someone`](#s-someone) ×2

<!-- note:nodes.guard -->
<!-- /note -->

#### <a id="s-nodes-weight-13"></a>`nodes.weight~13(c)`

prop · L135–135

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~13 -->
<!-- /note -->

#### <a id="s-nodes-guard-2"></a>`nodes.guard~2(c)`

prop · L136–136

- calls: [`need`](#s-need)

<!-- note:nodes.guard~2 -->
<!-- /note -->

#### <a id="s-nodes-weight-14"></a>`nodes.weight~14(c)`

prop · L136–136

- calls: [`need`](#s-need)

<!-- note:nodes.weight~14 -->
<!-- /note -->

#### <a id="s-nodes-weight-15"></a>`nodes.weight~15()`

prop · L137–137

<!-- note:nodes.weight~15 -->
<!-- /note -->

#### <a id="s-nodes-test-3"></a>`nodes.test~3(c)`

prop · L144–144

<!-- note:nodes.test~3 -->
<!-- /note -->

#### <a id="s-nodes-why-5"></a>`nodes.why~5(c, r)`

prop · L146–146

<!-- note:nodes.why~5 -->
<!-- /note -->

#### <a id="s-nodes-weight-16"></a>`nodes.weight~16(c)`

prop · L151–151

- calls: [`gene`](#s-gene) · [`need`](#s-need)

<!-- note:nodes.weight~16 -->
<!-- /note -->

#### <a id="s-nodes-guard-3"></a>`nodes.guard~3(c)`

prop · L152–152

<!-- note:nodes.guard~3 -->
<!-- /note -->

#### <a id="s-nodes-weight-17"></a>`nodes.weight~17(c)`

prop · L152–152

<!-- note:nodes.weight~17 -->
<!-- /note -->

#### <a id="s-nodes-guard-4"></a>`nodes.guard~4(c)`

prop · L153–153

- calls: [`cap`](#s-cap)

<!-- note:nodes.guard~4 -->
<!-- /note -->

#### <a id="s-nodes-weight-18"></a>`nodes.weight~18(c)`

prop · L153–153

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~18 -->
<!-- /note -->

#### <a id="s-nodes-guard-5"></a>`nodes.guard~5(c)`

prop · L154–154

<!-- note:nodes.guard~5 -->
<!-- /note -->

#### <a id="s-nodes-weight-19"></a>`nodes.weight~19(c)`

prop · L154–154

<!-- note:nodes.weight~19 -->
<!-- /note -->

#### <a id="s-nodes-guard-6"></a>`nodes.guard~6(c)`

prop · L155–155

- calls: [`need`](#s-need)

<!-- note:nodes.guard~6 -->
<!-- /note -->

#### <a id="s-nodes-weight-20"></a>`nodes.weight~20(c)`

prop · L155–155

- calls: [`need`](#s-need)

<!-- note:nodes.weight~20 -->
<!-- /note -->

#### <a id="s-nodes-guard-7"></a>`nodes.guard~7(c)`

prop · L156–156

- calls: [`anyone`](#s-anyone) · [`cap`](#s-cap)

<!-- note:nodes.guard~7 -->
<!-- /note -->

#### <a id="s-nodes-weight-21"></a>`nodes.weight~21(c)`

prop · L156–156

- calls: [`need`](#s-need)

<!-- note:nodes.weight~21 -->
<!-- /note -->

#### <a id="s-nodes-weight-22"></a>`nodes.weight~22(c)`

prop · L157–157

- calls: [`gene`](#s-gene) · [`need`](#s-need)

<!-- note:nodes.weight~22 -->
<!-- /note -->

#### <a id="s-nodes-on-3"></a>`nodes.on~3(c)`

prop · L163–163

<!-- note:nodes.on~3 -->
<!-- /note -->

#### <a id="s-nodes-why-6"></a>`nodes.why~6(c, k)`

prop · L170–170

<!-- note:nodes.why~6 -->
<!-- /note -->

#### <a id="s-nodes-weight-23"></a>`nodes.weight~23(c)`

prop · L176–176

- calls: [`need`](#s-need)

<!-- note:nodes.weight~23 -->
<!-- /note -->

#### <a id="s-nodes-guard-8"></a>`nodes.guard~8(c)`

prop · L177–177

- calls: [`someone`](#s-someone) ×2

<!-- note:nodes.guard~8 -->
<!-- /note -->

#### <a id="s-nodes-weight-24"></a>`nodes.weight~24(c)`

prop · L177–177

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~24 -->
<!-- /note -->

#### <a id="s-nodes-guard-9"></a>`nodes.guard~9(c)`

prop · L178–178

- calls: [`anyone`](#s-anyone)

<!-- note:nodes.guard~9 -->
<!-- /note -->

#### <a id="s-nodes-weight-25"></a>`nodes.weight~25(c)`

prop · L178–178

- calls: [`need`](#s-need)

<!-- note:nodes.weight~25 -->
<!-- /note -->

#### <a id="s-nodes-guard-10"></a>`nodes.guard~10(c)`

prop · L179–179

<!-- note:nodes.guard~10 -->
<!-- /note -->

#### <a id="s-nodes-weight-26"></a>`nodes.weight~26(c)`

prop · L179–179

- calls: [`gene`](#s-gene) · [`need`](#s-need)

<!-- note:nodes.weight~26 -->
<!-- /note -->

#### <a id="s-nodes-guard-11"></a>`nodes.guard~11(c)`

prop · L180–180

<!-- note:nodes.guard~11 -->
<!-- /note -->

#### <a id="s-nodes-weight-27"></a>`nodes.weight~27(c)`

prop · L180–180

- calls: [`need`](#s-need)

<!-- note:nodes.weight~27 -->
<!-- /note -->

#### <a id="s-nodes-guard-12"></a>`nodes.guard~12(c)`

prop · L181–181

<!-- note:nodes.guard~12 -->
<!-- /note -->

#### <a id="s-nodes-weight-28"></a>`nodes.weight~28(c)`

prop · L181–181

- calls: [`need`](#s-need)

<!-- note:nodes.weight~28 -->
<!-- /note -->

#### <a id="s-nodes-guard-13"></a>`nodes.guard~13(c)`

prop · L182–182

- calls: [`need`](#s-need)

<!-- note:nodes.guard~13 -->
<!-- /note -->

#### <a id="s-nodes-weight-29"></a>`nodes.weight~29(c)`

prop · L182–182

- calls: [`need`](#s-need)

<!-- note:nodes.weight~29 -->
<!-- /note -->

#### <a id="s-nodes-weight-30"></a>`nodes.weight~30()`

prop · L183–183

<!-- note:nodes.weight~30 -->
<!-- /note -->

#### <a id="s-nodes-weight-31"></a>`nodes.weight~31(c)`

prop · L191–191

- calls: [`need`](#s-need)

<!-- note:nodes.weight~31 -->
<!-- /note -->

#### <a id="s-nodes-guard-14"></a>`nodes.guard~14(c)`

prop · L192–192

<!-- note:nodes.guard~14 -->
<!-- /note -->

#### <a id="s-nodes-weight-32"></a>`nodes.weight~32(c)`

prop · L192–192

- calls: [`need`](#s-need)

<!-- note:nodes.weight~32 -->
<!-- /note -->

#### <a id="s-nodes-guard-15"></a>`nodes.guard~15(c)`

prop · L193–193

- calls: [`cap`](#s-cap)

<!-- note:nodes.guard~15 -->
<!-- /note -->

#### <a id="s-nodes-weight-33"></a>`nodes.weight~33(c)`

prop · L193–193

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~33 -->
<!-- /note -->

#### <a id="s-nodes-guard-16"></a>`nodes.guard~16(c)`

prop · L194–194

<!-- note:nodes.guard~16 -->
<!-- /note -->

#### <a id="s-nodes-weight-34"></a>`nodes.weight~34(c)`

prop · L194–194

<!-- note:nodes.weight~34 -->
<!-- /note -->

#### <a id="s-nodes-weight-35"></a>`nodes.weight~35()`

prop · L195–195

<!-- note:nodes.weight~35 -->
<!-- /note -->

#### <a id="s-nodes-guard-17"></a>`nodes.guard~17(c)`

prop · L196–196

- calls: [`anyone`](#s-anyone) · [`cap`](#s-cap)

<!-- note:nodes.guard~17 -->
<!-- /note -->

#### <a id="s-nodes-weight-36"></a>`nodes.weight~36(c)`

prop · L196–196

- calls: [`need`](#s-need)

<!-- note:nodes.weight~36 -->
<!-- /note -->

#### <a id="s-nodes-guard-18"></a>`nodes.guard~18(c)`

prop · L197–197

- calls: [`need`](#s-need)

<!-- note:nodes.guard~18 -->
<!-- /note -->

#### <a id="s-nodes-weight-37"></a>`nodes.weight~37(c)`

prop · L197–197

- calls: [`need`](#s-need)

<!-- note:nodes.weight~37 -->
<!-- /note -->

#### <a id="s-nodes-guard-19"></a>`nodes.guard~19(c)`

prop · L198–198

<!-- note:nodes.guard~19 -->
<!-- /note -->

#### <a id="s-nodes-weight-38"></a>`nodes.weight~38(c)`

prop · L198–198

<!-- note:nodes.weight~38 -->
<!-- /note -->

#### <a id="s-nodes-guard-20"></a>`nodes.guard~20(c)`

prop · L206–206

<!-- note:nodes.guard~20 -->
<!-- /note -->

#### <a id="s-nodes-weight-39"></a>`nodes.weight~39(c)`

prop · L206–206

<!-- note:nodes.weight~39 -->
<!-- /note -->

#### <a id="s-nodes-guard-21"></a>`nodes.guard~21(c)`

prop · L207–207

- calls: [`anyone`](#s-anyone)

<!-- note:nodes.guard~21 -->
<!-- /note -->

#### <a id="s-nodes-weight-40"></a>`nodes.weight~40(c)`

prop · L207–207

<!-- note:nodes.weight~40 -->
<!-- /note -->

#### <a id="s-nodes-guard-22"></a>`nodes.guard~22(c)`

prop · L208–208

- calls: [`someone`](#s-someone) ×2

<!-- note:nodes.guard~22 -->
<!-- /note -->

#### <a id="s-nodes-weight-41"></a>`nodes.weight~41(c)`

prop · L208–208

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~41 -->
<!-- /note -->

#### <a id="s-nodes-weight-42"></a>`nodes.weight~42(c)`

prop · L209–209

- calls: [`need`](#s-need)

<!-- note:nodes.weight~42 -->
<!-- /note -->

#### <a id="s-nodes-weight-43"></a>`nodes.weight~43(c)`

prop · L210–210

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~43 -->
<!-- /note -->

#### <a id="s-nodes-weight-44"></a>`nodes.weight~44()`

prop · L211–211

<!-- note:nodes.weight~44 -->
<!-- /note -->

#### <a id="s-nodes-weight-45"></a>`nodes.weight~45(c)`

prop · L219–219

- calls: [`need`](#s-need)

<!-- note:nodes.weight~45 -->
<!-- /note -->

#### <a id="s-nodes-weight-46"></a>`nodes.weight~46(c)`

prop · L220–220

- calls: [`need`](#s-need)

<!-- note:nodes.weight~46 -->
<!-- /note -->

#### <a id="s-nodes-weight-47"></a>`nodes.weight~47(c)`

prop · L221–221

- calls: [`need`](#s-need)

<!-- note:nodes.weight~47 -->
<!-- /note -->

#### <a id="s-nodes-guard-23"></a>`nodes.guard~23(c)`

prop · L222–222

<!-- note:nodes.guard~23 -->
<!-- /note -->

#### <a id="s-nodes-weight-48"></a>`nodes.weight~48(c)`

prop · L222–222

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~48 -->
<!-- /note -->

#### <a id="s-nodes-weight-49"></a>`nodes.weight~49()`

prop · L223–223

<!-- note:nodes.weight~49 -->
<!-- /note -->

#### <a id="s-nodes-test-4"></a>`nodes.test~4(c)`

prop · L230–230

- calls: [`anyone`](#s-anyone)

<!-- note:nodes.test~4 -->
<!-- /note -->

#### <a id="s-nodes-why-7"></a>`nodes.why~7(c, r)`

prop · L232–232

<!-- note:nodes.why~7 -->
<!-- /note -->

#### <a id="s-nodes-on-4"></a>`nodes.on~4(c)`

prop · L236–236

<!-- note:nodes.on~4 -->
<!-- /note -->

#### <a id="s-nodes-why-8"></a>`nodes.why~8(c, k)`

prop · L246–246

- calls: [`name`](#s-name)

<!-- note:nodes.why~8 -->
<!-- /note -->

#### <a id="s-nodes-weight-50"></a>`nodes.weight~50(c)`

prop · L251–251

- calls: [`need`](#s-need)

<!-- note:nodes.weight~50 -->
<!-- /note -->

#### <a id="s-nodes-weight-51"></a>`nodes.weight~51(c)`

prop · L252–252

- calls: [`need`](#s-need)

<!-- note:nodes.weight~51 -->
<!-- /note -->

#### <a id="s-nodes-weight-52"></a>`nodes.weight~52()`

prop · L253–253

<!-- note:nodes.weight~52 -->
<!-- /note -->

#### <a id="s-nodes-guard-24"></a>`nodes.guard~24(c)`

prop · L254–254

<!-- note:nodes.guard~24 -->
<!-- /note -->

#### <a id="s-nodes-weight-53"></a>`nodes.weight~53(c)`

prop · L254–254

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~53 -->
<!-- /note -->

#### <a id="s-nodes-weight-54"></a>`nodes.weight~54(c)`

prop · L261–261

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~54 -->
<!-- /note -->

#### <a id="s-nodes-guard-25"></a>`nodes.guard~25(c)`

prop · L262–262

<!-- note:nodes.guard~25 -->
<!-- /note -->

#### <a id="s-nodes-weight-55"></a>`nodes.weight~55(c)`

prop · L262–262

<!-- note:nodes.weight~55 -->
<!-- /note -->

#### <a id="s-nodes-weight-56"></a>`nodes.weight~56(c)`

prop · L263–263

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~56 -->
<!-- /note -->

#### <a id="s-nodes-guard-26"></a>`nodes.guard~26(c)`

prop · L264–264

<!-- note:nodes.guard~26 -->
<!-- /note -->

#### <a id="s-nodes-weight-57"></a>`nodes.weight~57()`

prop · L264–264

<!-- note:nodes.weight~57 -->
<!-- /note -->

#### <a id="s-nodes-weight-58"></a>`nodes.weight~58(c)`

prop · L265–265

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~58 -->
<!-- /note -->

#### <a id="s-nodes-weight-59"></a>`nodes.weight~59(c)`

prop · L272–272

- calls: [`gene`](#s-gene) · [`need`](#s-need)

<!-- note:nodes.weight~59 -->
<!-- /note -->

#### <a id="s-nodes-weight-60"></a>`nodes.weight~60(c)`

prop · L273–273

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~60 -->
<!-- /note -->

#### <a id="s-nodes-weight-61"></a>`nodes.weight~61(c)`

prop · L274–274

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~61 -->
<!-- /note -->

#### <a id="s-nodes-guard-27"></a>`nodes.guard~27(c)`

prop · L275–275

<!-- note:nodes.guard~27 -->
<!-- /note -->

#### <a id="s-nodes-weight-62"></a>`nodes.weight~62(c)`

prop · L275–275

<!-- note:nodes.weight~62 -->
<!-- /note -->

#### <a id="s-nodes-weight-63"></a>`nodes.weight~63(c)`

prop · L276–276

<!-- note:nodes.weight~63 -->
<!-- /note -->

#### <a id="s-nodes-test-5"></a>`nodes.test~5(c)`

prop · L282–282

<!-- note:nodes.test~5 -->
<!-- /note -->

#### <a id="s-nodes-why-9"></a>`nodes.why~9(c, r)`

prop · L284–284

<!-- note:nodes.why~9 -->
<!-- /note -->

#### <a id="s-nodes-on-5"></a>`nodes.on~5(c)`

prop · L288–288

<!-- note:nodes.on~5 -->
<!-- /note -->

#### <a id="s-nodes-why-10"></a>`nodes.why~10(c, k)`

prop · L298–298

<!-- note:nodes.why~10 -->
<!-- /note -->

#### <a id="s-nodes-weight-64"></a>`nodes.weight~64(c)`

prop · L303–303

<!-- note:nodes.weight~64 -->
<!-- /note -->

#### <a id="s-nodes-weight-65"></a>`nodes.weight~65()`

prop · L304–304

<!-- note:nodes.weight~65 -->
<!-- /note -->

#### <a id="s-nodes-weight-66"></a>`nodes.weight~66()`

prop · L305–305

<!-- note:nodes.weight~66 -->
<!-- /note -->

#### <a id="s-nodes-guard-28"></a>`nodes.guard~28(c)`

prop · L306–306

<!-- note:nodes.guard~28 -->
<!-- /note -->

#### <a id="s-nodes-weight-67"></a>`nodes.weight~67(c)`

prop · L306–306

<!-- note:nodes.weight~67 -->
<!-- /note -->

#### <a id="s-nodes-guard-29"></a>`nodes.guard~29(c)`

prop · L313–313

<!-- note:nodes.guard~29 -->
<!-- /note -->

#### <a id="s-nodes-weight-68"></a>`nodes.weight~68()`

prop · L313–313

<!-- note:nodes.weight~68 -->
<!-- /note -->

#### <a id="s-nodes-weight-69"></a>`nodes.weight~69(c)`

prop · L314–314

- calls: [`gene`](#s-gene)

<!-- note:nodes.weight~69 -->
<!-- /note -->

#### <a id="s-nodes-guard-30"></a>`nodes.guard~30(c)`

prop · L315–315

<!-- note:nodes.guard~30 -->
<!-- /note -->

#### <a id="s-nodes-weight-70"></a>`nodes.weight~70()`

prop · L315–315

<!-- note:nodes.weight~70 -->
<!-- /note -->

#### <a id="s-nodes-weight-71"></a>`nodes.weight~71()`

prop · L316–316

<!-- note:nodes.weight~71 -->
<!-- /note -->

#### <a id="s-nodes-weight-72"></a>`nodes.weight~72()`

prop · L317–317

<!-- note:nodes.weight~72 -->
<!-- /note -->

#### <a id="s-nodes-guard-31"></a>`nodes.guard~31(c)`

prop · L324–324

<!-- note:nodes.guard~31 -->
<!-- /note -->

#### <a id="s-nodes-weight-73"></a>`nodes.weight~73(c)`

prop · L324–324

- calls: [`need`](#s-need)

<!-- note:nodes.weight~73 -->
<!-- /note -->

#### <a id="s-nodes-weight-74"></a>`nodes.weight~74()`

prop · L325–325

<!-- note:nodes.weight~74 -->
<!-- /note -->

#### <a id="s-nodes-guard-32"></a>`nodes.guard~32(c)`

prop · L326–326

<!-- note:nodes.guard~32 -->
<!-- /note -->

#### <a id="s-nodes-weight-75"></a>`nodes.weight~75()`

prop · L326–326

<!-- note:nodes.weight~75 -->
<!-- /note -->

#### <a id="s-nodes-guard-33"></a>`nodes.guard~33(c)`

prop · L327–327

<!-- note:nodes.guard~33 -->
<!-- /note -->

#### <a id="s-nodes-weight-76"></a>`nodes.weight~76()`

prop · L327–327

<!-- note:nodes.weight~76 -->
<!-- /note -->

#### <a id="s-nodes-weight-77"></a>`nodes.weight~77()`

prop · L328–328

<!-- note:nodes.weight~77 -->
<!-- /note -->

#### <a id="s-nodes-guard-34"></a>`nodes.guard~34(c)`

prop · L335–335

<!-- note:nodes.guard~34 -->
<!-- /note -->

#### <a id="s-nodes-weight-78"></a>`nodes.weight~78(c)`

prop · L335–335

- calls: [`need`](#s-need)

<!-- note:nodes.weight~78 -->
<!-- /note -->

#### <a id="s-nodes-guard-35"></a>`nodes.guard~35(c)`

prop · L336–336

<!-- note:nodes.guard~35 -->
<!-- /note -->

#### <a id="s-nodes-weight-79"></a>`nodes.weight~79()`

prop · L336–336

<!-- note:nodes.weight~79 -->
<!-- /note -->

#### <a id="s-nodes-weight-80"></a>`nodes.weight~80()`

prop · L337–337

<!-- note:nodes.weight~80 -->
<!-- /note -->

#### <a id="s-nodes-weight-81"></a>`nodes.weight~81()`

prop · L338–338

<!-- note:nodes.weight~81 -->
<!-- /note -->

#### <a id="s-nodes-weight-82"></a>`nodes.weight~82()`

prop · L339–339

<!-- note:nodes.weight~82 -->
<!-- /note -->

#### <a id="s-nodes-guard-36"></a>`nodes.guard~36(c)`

prop · L340–340

<!-- note:nodes.guard~36 -->
<!-- /note -->

#### <a id="s-nodes-weight-83"></a>`nodes.weight~83(c)`

prop · L340–340

<!-- note:nodes.weight~83 -->
<!-- /note -->

### <a id="s-NODE_KIND"></a>`NODE_KIND`

const · **exported** · L398–407

<!-- note:NODE_KIND -->
Router nodes stand for a whole category of thing-to-do; terminals carry
their own. The learned prior (learn.js) weighs options by category, so it
needs to know what an edge leads toward before the walk gets there.
<!-- /note -->

### <a id="s-kindOfNode"></a>`kindOfNode(id)`

function · **exported** · L409–414

- called by: [`kind`](#s-kind)

<!-- note:kindOfNode -->
The category an edge leads toward: the node's own, or its action's.
<!-- /note -->

### <a id="s-n"></a>`n`

const · L417–417

<!-- note:n -->
<!-- /note -->

### <a id="s-kind"></a>`kind`

const · L420–420

- calls: [`kindOfNode`](#s-kindOfNode)

<!-- note:kind -->
<!-- /note -->

### <a id="s-base"></a>`base`

const · L421–421

- called by: [`weight`](#s-weight)

<!-- note:base -->
<!-- /note -->

### <a id="s-weight"></a>`weight(c)`

prop · L425–428

- calls: [`base`](#s-base) · [`kindPrior`](learn.js.md#s-kindPrior) _js/crew/learn.js_

<!-- note:weight -->
<!-- /note -->

### <a id="s-deckGraph"></a>`deckGraph`

const · **exported** · L433–438

- calls: [`createGraph`](../genome/behavior-graph.js.md#s-createGraph) _js/genome/behavior-graph.js_

<!-- note:deckGraph -->
<!-- /note -->
