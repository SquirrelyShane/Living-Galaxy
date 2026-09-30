# js/crew/beats.js

[index](../../../README.md) · 373 lines · 92 symbols · 6 imports · 3 importers

## About

<!-- note:@file -->
Living Galaxy — staged social acts.

A beat is a short scene: a few stages, each waiting on the captain's answer,
a progress bar that moves when you answer, and an ending that is a buff
(trust / morale / spark) or a debuff — with the odds moved by what you said
on the way (0.3.17; it used to play itself on a timer). Nothing here is
explicit; addons may register extra beats through hooks.js.

- L373 · `if (!crewHooks.reset.includes(stopAllBeats)) crewHooks.reset.push(stopAllBeats);` — a new sky is a new crew: a stale entry here would lock somebody out of
  every beat for the rest of the session
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./ledger.js` | `crew`, `crewHooks`, `firstName` | [js/crew/ledger.js](ledger.js.md) |
| 2 | `./family.js` | `adjustMorale`, `adjustTrust`, `trustOf`, `social`, `loadSocial`, `playerAsPerson`, `couldCourt`, `pairWithPlayer` | [js/crew/family.js](family.js.md) |
| 3 | `./bonds.js` | `adjustRapport` | [js/crew/bonds.js](bonds.js.md) |
| 4 | `./romance.js` | `moment`, `attraction` | [js/crew/romance.js](romance.js.md) |
| 5 | `./hooks.js` | `runHooks` | [js/crew/hooks.js](hooks.js.md) |
| 6 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |

## Imported by

- [js/console/panels/crew.js](../console/panels/crew.js.md) — `stopAllBeats`
- [js/crew/talkview.js](talkview.js.md) — `beatsFor`, `playBeat`, `isRunning`, `advanceBeat`
- test/beats.test.mjs _(outside js/)_ — `CORE_BEATS`, `beatsFor`, `playBeat`, `isRunning`, `stopAllBeats`, `advanceBeat`

## Exports

- [`CORE_BEATS`](#s-CORE_BEATS) · const — used by test/beats.test.mjs
- [`stopAllBeats`](#s-stopAllBeats) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), test/beats.test.mjs
- [`beatsFor`](#s-beatsFor) · function — used by [js/crew/talkview.js](talkview.js.md), test/beats.test.mjs
- [`isRunning`](#s-isRunning) · function — used by [js/crew/talkview.js](talkview.js.md), test/beats.test.mjs
- [`playBeat`](#s-playBeat) · function — used by [js/crew/talkview.js](talkview.js.md), test/beats.test.mjs
- [`advanceBeat`](#s-advanceBeat) · function — used by [js/crew/talkview.js](talkview.js.md), test/beats.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-hi"></a>`hi(t, k)`

function · L8–8

- called by: [`pickLean`](#s-pickLean) · [`pickLine`](#s-pickLine)

<!-- note:hi -->
<!-- /note -->

### <a id="s-lo"></a>`lo(t, k)`

function · L9–9

- called by: [`odds`](#s-odds)

<!-- note:lo -->
<!-- /note -->

### <a id="s-Q"></a>`Q(m, s)`

function · L10–10

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_
- called by: [`CORE_BEATS.resolve`](#s-CORE_BEATS-resolve) ×2 · [`CORE_BEATS.resolve~2`](#s-CORE_BEATS-resolve-2) ×2 · [`CORE_BEATS.resolve~3`](#s-CORE_BEATS-resolve-3) ×2 · [`CORE_BEATS.resolve~4`](#s-CORE_BEATS-resolve-4) ×2 · [`CORE_BEATS.resolve~5`](#s-CORE_BEATS-resolve-5) ×4 · [`CORE_BEATS.resolve~6`](#s-CORE_BEATS-resolve-6) ×2 · [`CORE_BEATS.scene`](#s-CORE_BEATS-scene) ×2 · [`CORE_BEATS.scene~2`](#s-CORE_BEATS-scene-2) ×3 · [`CORE_BEATS.scene~3`](#s-CORE_BEATS-scene-3) ×3 · [`CORE_BEATS.scene~4`](#s-CORE_BEATS-scene-4) ×2 · [`CORE_BEATS.scene~5`](#s-CORE_BEATS-scene-5) ×4 · [`CORE_BEATS.scene~6`](#s-CORE_BEATS-scene-6) ×2

<!-- note:Q -->
<!-- /note -->

### <a id="s-roll"></a>`roll(m, id)`

function · L12–17 · **never referenced**

<!-- note:roll -->
<!-- /note -->

### <a id="s-applyOutcome"></a>`applyOutcome(m, o)`

function · L19–30

- calls: [`adjustRapport`](bonds.js.md#s-adjustRapport) _js/crew/bonds.js_ · [`adjustMorale`](family.js.md#s-adjustMorale) _js/crew/family.js_ · [`adjustTrust`](family.js.md#s-adjustTrust) _js/crew/family.js_ ×2 · [`moment`](romance.js.md#s-moment) _js/crew/romance.js_
- called by: [`playBeat>finish`](#s-playBeat-finish)

<!-- note:applyOutcome -->
Apply what a beat resolved to, and report what actually landed.

`o.with` is the other party. A captain's beat has none — you are not on the
crew's own ladder — so a `spark` with nobody to spark with used to be
dropped on the floor while the tag still promised it. It now goes where the
player's side of a relationship actually lives: trust.
<!-- /note -->

### <a id="s-odds"></a>`odds(m, kind)`

function · L32–45

- calls: [`lo`](#s-lo) · [`loadSocial`](family.js.md#s-loadSocial) _js/crew/family.js_ · [`playerAsPerson`](family.js.md#s-playerAsPerson) _js/crew/family.js_ · [`trustOf`](family.js.md#s-trustOf) _js/crew/family.js_ · [`attraction`](romance.js.md#s-attraction) _js/crew/romance.js_
- called by: [`CORE_BEATS.resolve`](#s-CORE_BEATS-resolve) · [`CORE_BEATS.resolve~2`](#s-CORE_BEATS-resolve-2) · [`CORE_BEATS.resolve~3`](#s-CORE_BEATS-resolve-3) · [`CORE_BEATS.resolve~4`](#s-CORE_BEATS-resolve-4) · [`CORE_BEATS.resolve~5`](#s-CORE_BEATS-resolve-5) · [`CORE_BEATS.resolve~6`](#s-CORE_BEATS-resolve-6)

<!-- note:odds -->
Chance an act lands, from trust, morale, and whether they are drawn to you.

- L41 · `p += (attraction(m, playerAsPerson()) || 0) * 0.15;` — the ledger's own idea of who the captain is — the hand-built stand-in
  had no race and no traits, so half of what attraction() reads was blank
<!-- /note -->

### <a id="s-who"></a>`who(m)`

function · L47–47

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_
- called by: [`CORE_BEATS.scene`](#s-CORE_BEATS-scene) ×2 · [`CORE_BEATS.scene~2`](#s-CORE_BEATS-scene-2) ×3 · [`CORE_BEATS.scene~3`](#s-CORE_BEATS-scene-3) ×2 · [`CORE_BEATS.scene~4`](#s-CORE_BEATS-scene-4) ×2 · [`CORE_BEATS.scene~5`](#s-CORE_BEATS-scene-5) ×2 · [`CORE_BEATS.scene~6`](#s-CORE_BEATS-scene-6)

<!-- note:who -->
0.3.17 — a beat is a scene the captain plays, not one that plays itself.

It used to run on a setInterval: three unconnected lines drawn from three
separate bags of the voice bank, a progress bar filling on its own, and an
outcome rolled at the end with nothing the captain did in between. Now each
core beat is a SCENE: stages written to follow one another, each waiting on
the captain's answer, and what the captain says moves the odds the scene
lands (`lean`, per choice, and per trait where a hand would care). The bar
moves when you answer and not before; "Let it drop" still walks away.

A beat that only has `steps()` (an addon's) still works: each line waits on
a "Go on".

  stage  { line, choices: [{ id, label, lean?, say?(m) → the hand's reply }] }
<!-- /note -->

### <a id="s-tr"></a>`tr(m)`

function · L48–48

- called by: [`pickLean`](#s-pickLean) · [`pickLine`](#s-pickLine)

<!-- note:tr -->
<!-- /note -->

### <a id="s-pickLean"></a>`pickLean(m, table)`

function · L49–52

- calls: [`hi`](#s-hi) · [`tr`](#s-tr)
- called by: [`CORE_BEATS.scene`](#s-CORE_BEATS-scene) ×5 · [`CORE_BEATS.scene~2`](#s-CORE_BEATS-scene-2) ×4 · [`CORE_BEATS.scene~3`](#s-CORE_BEATS-scene-3) ×5 · [`CORE_BEATS.scene~4`](#s-CORE_BEATS-scene-4) ×4 · [`CORE_BEATS.scene~5`](#s-CORE_BEATS-scene-5) ×3 · [`CORE_BEATS.scene~6`](#s-CORE_BEATS-scene-6)

<!-- note:pickLean -->
a lean that depends on who they are: pickLean(m, { caution: 0.1, grit: -0.05, else: 0 })
<!-- /note -->

### <a id="s-pickLine"></a>`pickLine(m, table)`

function · L53–56

- calls: [`hi`](#s-hi) · [`tr`](#s-tr)
- called by: [`CORE_BEATS.resolve`](#s-CORE_BEATS-resolve) ×2 · [`CORE_BEATS.resolve~2`](#s-CORE_BEATS-resolve-2) · [`CORE_BEATS.scene`](#s-CORE_BEATS-scene) ×2 · [`CORE_BEATS.scene~2`](#s-CORE_BEATS-scene-2) · [`CORE_BEATS.scene~3`](#s-CORE_BEATS-scene-3) · [`CORE_BEATS.scene~4`](#s-CORE_BEATS-scene-4) · [`CORE_BEATS.scene~5`](#s-CORE_BEATS-scene-5) · [`CORE_BEATS.scene~6`](#s-CORE_BEATS-scene-6)

<!-- note:pickLine -->
<!-- /note -->

### <a id="s-You"></a>`You(s)`

function · L57–57

- called by: [`CORE_BEATS.scene.say`](#s-CORE_BEATS-scene-say) · [`CORE_BEATS.scene.say~2`](#s-CORE_BEATS-scene-say-2) · [`CORE_BEATS.scene.say~4`](#s-CORE_BEATS-scene-say-4) · [`CORE_BEATS.scene.say~5`](#s-CORE_BEATS-scene-say-5) · [`CORE_BEATS.scene.say~6`](#s-CORE_BEATS-scene-say-6) · [`CORE_BEATS.scene.say~7`](#s-CORE_BEATS-scene-say-7) · [`CORE_BEATS.scene.say~8`](#s-CORE_BEATS-scene-say-8) · [`CORE_BEATS.scene~2.say`](#s-CORE_BEATS-scene-2-say) · [`CORE_BEATS.scene~2.say~2`](#s-CORE_BEATS-scene-2-say-2) · [`CORE_BEATS.scene~2.say~3`](#s-CORE_BEATS-scene-2-say-3) · [`CORE_BEATS.scene~2.say~4`](#s-CORE_BEATS-scene-2-say-4) · [`CORE_BEATS.scene~2.say~5`](#s-CORE_BEATS-scene-2-say-5) · [`CORE_BEATS.scene~2.say~6`](#s-CORE_BEATS-scene-2-say-6) · [`CORE_BEATS.scene~2.say~7`](#s-CORE_BEATS-scene-2-say-7) · [`CORE_BEATS.scene~3.say`](#s-CORE_BEATS-scene-3-say) · [`CORE_BEATS.scene~3.say~2`](#s-CORE_BEATS-scene-3-say-2) · [`CORE_BEATS.scene~3.say~3`](#s-CORE_BEATS-scene-3-say-3) · [`CORE_BEATS.scene~3.say~4`](#s-CORE_BEATS-scene-3-say-4) · [`CORE_BEATS.scene~3.say~6`](#s-CORE_BEATS-scene-3-say-6) · [`CORE_BEATS.scene~3.say~7`](#s-CORE_BEATS-scene-3-say-7) · [`CORE_BEATS.scene~3.say~8`](#s-CORE_BEATS-scene-3-say-8) · [`CORE_BEATS.scene~4.say`](#s-CORE_BEATS-scene-4-say) · [`CORE_BEATS.scene~4.say~2`](#s-CORE_BEATS-scene-4-say-2) · [`CORE_BEATS.scene~4.say~3`](#s-CORE_BEATS-scene-4-say-3) · [`CORE_BEATS.scene~4.say~5`](#s-CORE_BEATS-scene-4-say-5) · [`CORE_BEATS.scene~4.say~6`](#s-CORE_BEATS-scene-4-say-6) · [`CORE_BEATS.scene~4.say~8`](#s-CORE_BEATS-scene-4-say-8) · [`CORE_BEATS.scene~5.say`](#s-CORE_BEATS-scene-5-say) · [`CORE_BEATS.scene~5.say~10`](#s-CORE_BEATS-scene-5-say-10) · [`CORE_BEATS.scene~5.say~2`](#s-CORE_BEATS-scene-5-say-2) · [`CORE_BEATS.scene~5.say~3`](#s-CORE_BEATS-scene-5-say-3) · [`CORE_BEATS.scene~5.say~4`](#s-CORE_BEATS-scene-5-say-4) · [`CORE_BEATS.scene~5.say~5`](#s-CORE_BEATS-scene-5-say-5) · [`CORE_BEATS.scene~5.say~6`](#s-CORE_BEATS-scene-5-say-6) · [`CORE_BEATS.scene~5.say~7`](#s-CORE_BEATS-scene-5-say-7) · [`CORE_BEATS.scene~5.say~8`](#s-CORE_BEATS-scene-5-say-8) · [`CORE_BEATS.scene~5.say~9`](#s-CORE_BEATS-scene-5-say-9) · [`CORE_BEATS.scene~6.say`](#s-CORE_BEATS-scene-6-say) · [`CORE_BEATS.scene~6.say~2`](#s-CORE_BEATS-scene-6-say-2) · [`CORE_BEATS.scene~6.say~3`](#s-CORE_BEATS-scene-6-say-3) · [`CORE_BEATS.scene~6.say~4`](#s-CORE_BEATS-scene-6-say-4) · [`CORE_BEATS.scene~6.say~5`](#s-CORE_BEATS-scene-6-say-5)

<!-- note:You -->
<!-- /note -->

### <a id="s-CORE_BEATS"></a>`CORE_BEATS`

const · **exported** · L59–265

<!-- note:CORE_BEATS -->
<!-- /note -->

#### <a id="s-CORE_BEATS-when"></a>`CORE_BEATS.when(m)`

prop · L64–64

<!-- note:CORE_BEATS.when -->
<!-- /note -->

#### <a id="s-CORE_BEATS-scene"></a>`CORE_BEATS.scene(m)`

prop · L65–83

- calls: [`pickLean`](#s-pickLean) ×5 · [`pickLine`](#s-pickLine) ×2 · [`Q`](#s-Q) ×2 · [`who`](#s-who) ×2

<!-- note:CORE_BEATS.scene -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-say"></a>`CORE_BEATS.scene.say()`

prop · L68–68

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene.say -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-say-2"></a>`CORE_BEATS.scene.say~2()`

prop · L69–69

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene.say~2 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-say-3"></a>`CORE_BEATS.scene.say~3()`

prop · L70–70

<!-- note:CORE_BEATS.scene.say~3 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-say-4"></a>`CORE_BEATS.scene.say~4()`

prop · L74–74

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene.say~4 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-say-5"></a>`CORE_BEATS.scene.say~5()`

prop · L75–75

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene.say~5 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-say-6"></a>`CORE_BEATS.scene.say~6()`

prop · L76–76

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene.say~6 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-say-7"></a>`CORE_BEATS.scene.say~7()`

prop · L80–80

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene.say~7 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-say-8"></a>`CORE_BEATS.scene.say~8()`

prop · L81–81

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene.say~8 -->
<!-- /note -->

#### <a id="s-CORE_BEATS-resolve"></a>`CORE_BEATS.resolve(m, rng)`

prop · L84–88

- calls: [`odds`](#s-odds) · [`pickLine`](#s-pickLine) ×2 · [`Q`](#s-Q) ×2

<!-- note:CORE_BEATS.resolve -->
<!-- /note -->

#### <a id="s-CORE_BEATS-when-2"></a>`CORE_BEATS.when~2(m)`

prop · L94–94

<!-- note:CORE_BEATS.when~2 -->
<!-- /note -->

#### <a id="s-CORE_BEATS-scene-2"></a>`CORE_BEATS.scene~2(m)`

prop · L95–113

- calls: [`pickLean`](#s-pickLean) ×4 · [`pickLine`](#s-pickLine) · [`Q`](#s-Q) ×3 · [`who`](#s-who) ×3

<!-- note:CORE_BEATS.scene~2 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-2-say"></a>`CORE_BEATS.scene~2.say()`

prop · L98–98

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~2.say -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-2-say-2"></a>`CORE_BEATS.scene~2.say~2()`

prop · L99–99

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~2.say~2 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-2-say-3"></a>`CORE_BEATS.scene~2.say~3()`

prop · L100–100

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~2.say~3 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-2-say-4"></a>`CORE_BEATS.scene~2.say~4()`

prop · L104–104

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~2.say~4 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-2-say-5"></a>`CORE_BEATS.scene~2.say~5()`

prop · L105–105

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~2.say~5 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-2-say-6"></a>`CORE_BEATS.scene~2.say~6()`

prop · L106–106

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~2.say~6 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-2-say-7"></a>`CORE_BEATS.scene~2.say~7()`

prop · L110–110

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~2.say~7 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-2-say-8"></a>`CORE_BEATS.scene~2.say~8()`

prop · L111–111

<!-- note:CORE_BEATS.scene~2.say~8 -->
<!-- /note -->

#### <a id="s-CORE_BEATS-resolve-2"></a>`CORE_BEATS.resolve~2(m, rng)`

prop · L114–118

- calls: [`odds`](#s-odds) · [`pickLine`](#s-pickLine) · [`Q`](#s-Q) ×2

<!-- note:CORE_BEATS.resolve~2 -->
<!-- /note -->

#### <a id="s-CORE_BEATS-when-3"></a>`CORE_BEATS.when~3(m)`

prop · L124–124

- calls: [`trustOf`](family.js.md#s-trustOf) _js/crew/family.js_

<!-- note:CORE_BEATS.when~3 -->
<!-- /note -->

#### <a id="s-CORE_BEATS-scene-3"></a>`CORE_BEATS.scene~3(m)`

prop · L125–143

- calls: [`pickLean`](#s-pickLean) ×5 · [`pickLine`](#s-pickLine) · [`Q`](#s-Q) ×3 · [`who`](#s-who) ×2

<!-- note:CORE_BEATS.scene~3 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-3-say"></a>`CORE_BEATS.scene~3.say()`

prop · L128–128

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~3.say -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-3-say-2"></a>`CORE_BEATS.scene~3.say~2()`

prop · L129–129

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~3.say~2 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-3-say-3"></a>`CORE_BEATS.scene~3.say~3()`

prop · L130–130

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~3.say~3 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-3-say-4"></a>`CORE_BEATS.scene~3.say~4()`

prop · L134–134

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~3.say~4 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-3-say-5"></a>`CORE_BEATS.scene~3.say~5()`

prop · L135–135

<!-- note:CORE_BEATS.scene~3.say~5 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-3-say-6"></a>`CORE_BEATS.scene~3.say~6()`

prop · L136–136

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~3.say~6 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-3-say-7"></a>`CORE_BEATS.scene~3.say~7()`

prop · L140–140

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~3.say~7 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-3-say-8"></a>`CORE_BEATS.scene~3.say~8()`

prop · L141–141

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~3.say~8 -->
<!-- /note -->

#### <a id="s-CORE_BEATS-resolve-3"></a>`CORE_BEATS.resolve~3(m, rng)`

prop · L144–148

- calls: [`odds`](#s-odds) · [`Q`](#s-Q) ×2

<!-- note:CORE_BEATS.resolve~3 -->
<!-- /note -->

#### <a id="s-CORE_BEATS-when-4"></a>`CORE_BEATS.when~4(m)`

prop · L154–154

<!-- note:CORE_BEATS.when~4 -->
<!-- /note -->

#### <a id="s-CORE_BEATS-scene-4"></a>`CORE_BEATS.scene~4(m)`

prop · L155–173

- calls: [`pickLean`](#s-pickLean) ×4 · [`pickLine`](#s-pickLine) · [`Q`](#s-Q) ×2 · [`who`](#s-who) ×2

<!-- note:CORE_BEATS.scene~4 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-4-say"></a>`CORE_BEATS.scene~4.say()`

prop · L158–158

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~4.say -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-4-say-2"></a>`CORE_BEATS.scene~4.say~2()`

prop · L159–159

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~4.say~2 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-4-say-3"></a>`CORE_BEATS.scene~4.say~3()`

prop · L160–160

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~4.say~3 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-4-say-4"></a>`CORE_BEATS.scene~4.say~4()`

prop · L164–164

<!-- note:CORE_BEATS.scene~4.say~4 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-4-say-5"></a>`CORE_BEATS.scene~4.say~5()`

prop · L165–165

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~4.say~5 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-4-say-6"></a>`CORE_BEATS.scene~4.say~6()`

prop · L166–166

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~4.say~6 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-4-say-7"></a>`CORE_BEATS.scene~4.say~7()`

prop · L170–170

<!-- note:CORE_BEATS.scene~4.say~7 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-4-say-8"></a>`CORE_BEATS.scene~4.say~8()`

prop · L171–171

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~4.say~8 -->
<!-- /note -->

#### <a id="s-CORE_BEATS-resolve-4"></a>`CORE_BEATS.resolve~4(m, rng)`

prop · L174–181

- calls: [`odds`](#s-odds) · [`Q`](#s-Q) ×2

<!-- note:CORE_BEATS.resolve~4 -->
<!-- /note -->

#### <a id="s-CORE_BEATS-when-5"></a>`CORE_BEATS.when~5(m)`

prop · L187–188

- calls: [`couldCourt`](family.js.md#s-couldCourt) _js/crew/family.js_

<!-- note:CORE_BEATS.when~5 -->
the same gate the TALK topic uses: drawn to each other, not kin, and
enough trust to be asked. Without it the beat could pair you with
somebody who would have refused in conversation.
<!-- /note -->

#### <a id="s-CORE_BEATS-scene-5"></a>`CORE_BEATS.scene~5(m)`

prop · L190–218

- calls: [`pickLean`](#s-pickLean) ×3 · [`pickLine`](#s-pickLine) · [`Q`](#s-Q) ×4 · [`who`](#s-who) ×2

<!-- note:CORE_BEATS.scene~5 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-5-say"></a>`CORE_BEATS.scene~5.say()`

prop · L195–195

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~5.say -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-5-say-2"></a>`CORE_BEATS.scene~5.say~2()`

prop · L196–196

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~5.say~2 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-5-say-3"></a>`CORE_BEATS.scene~5.say~3()`

prop · L198–198

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~5.say~3 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-5-say-4"></a>`CORE_BEATS.scene~5.say~4()`

prop · L203–203

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~5.say~4 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-5-say-5"></a>`CORE_BEATS.scene~5.say~5()`

prop · L204–204

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~5.say~5 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-5-say-6"></a>`CORE_BEATS.scene~5.say~6()`

prop · L205–205

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~5.say~6 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-5-say-7"></a>`CORE_BEATS.scene~5.say~7()`

prop · L209–209

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~5.say~7 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-5-say-8"></a>`CORE_BEATS.scene~5.say~8()`

prop · L210–210

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~5.say~8 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-5-say-9"></a>`CORE_BEATS.scene~5.say~9()`

prop · L214–214

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~5.say~9 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-5-say-10"></a>`CORE_BEATS.scene~5.say~10()`

prop · L215–215

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~5.say~10 -->
<!-- /note -->

#### <a id="s-CORE_BEATS-resolve-5"></a>`CORE_BEATS.resolve~5(m, rng)`

prop · L219–233

- calls: [`odds`](#s-odds) · [`Q`](#s-Q) ×4 · [`couldCourt`](family.js.md#s-couldCourt) _js/crew/family.js_ · [`pairWithPlayer`](family.js.md#s-pairWithPlayer) _js/crew/family.js_

<!-- note:CORE_BEATS.resolve~5 -->
- L229 · `pairWithPlayer(m);` — one place does this, and it writes the ledger and the crew log
<!-- /note -->

#### <a id="s-CORE_BEATS-when-6"></a>`CORE_BEATS.when~6(m)`

prop · L239–239

<!-- note:CORE_BEATS.when~6 -->
<!-- /note -->

#### <a id="s-CORE_BEATS-scene-6"></a>`CORE_BEATS.scene~6(m)`

prop · L240–257

- calls: [`pickLean`](#s-pickLean) · [`pickLine`](#s-pickLine) · [`Q`](#s-Q) ×2 · [`who`](#s-who)

<!-- note:CORE_BEATS.scene~6 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-6-say"></a>`CORE_BEATS.scene~6.say()`

prop · L243–243

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~6.say -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-6-say-2"></a>`CORE_BEATS.scene~6.say~2()`

prop · L244–244

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~6.say~2 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-6-say-3"></a>`CORE_BEATS.scene~6.say~3()`

prop · L248–248

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~6.say~3 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-6-say-4"></a>`CORE_BEATS.scene~6.say~4()`

prop · L249–249

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~6.say~4 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-6-say-5"></a>`CORE_BEATS.scene~6.say~5()`

prop · L250–250

- calls: [`You`](#s-You)

<!-- note:CORE_BEATS.scene~6.say~5 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-6-say-6"></a>`CORE_BEATS.scene~6.say~6()`

prop · L254–254

<!-- note:CORE_BEATS.scene~6.say~6 -->
<!-- /note -->

##### <a id="s-CORE_BEATS-scene-6-say-7"></a>`CORE_BEATS.scene~6.say~7()`

prop · L255–255

<!-- note:CORE_BEATS.scene~6.say~7 -->
<!-- /note -->

#### <a id="s-CORE_BEATS-resolve-6"></a>`CORE_BEATS.resolve~6(m, rng)`

prop · L258–263

- calls: [`odds`](#s-odds) · [`Q`](#s-Q) ×2 · [`loadSocial`](family.js.md#s-loadSocial) _js/crew/family.js_

<!-- note:CORE_BEATS.resolve~6 -->
<!-- /note -->

### <a id="s-running"></a>`running`

const · L267–267

<!-- note:running -->
<!-- /note -->

### <a id="s-stopAllBeats"></a>`stopAllBeats()`

function · **exported** · L269–272

- calls: [`playBeat>stop`](#s-playBeat-stop)
- called by: [`unmount`](../console/panels/crew.js.md#s-unmount) _js/console/panels/crew.js_ · [`playBeat`](#s-playBeat)

<!-- note:stopAllBeats -->
Stop whatever is playing. One captain, one conversation at a time.

- L270 · `for (const stop of [...running.values()]) { try { stop(); } catch {` — already gone
<!-- /note -->

### <a id="s-beatsFor"></a>`beatsFor(m)`

function · **exported** · L274–280

- calls: [`loadSocial`](family.js.md#s-loadSocial) _js/crew/family.js_ · [`runHooks`](hooks.js.md#s-runHooks) _js/crew/hooks.js_
- via [js/crew/hooks.js](hooks.js.md): `runHooks.flat`, `runHooks.flat.filter`
- called by: [`playBeat`](#s-playBeat) · [`mountTalk>paintOpts`](talkview.js.md#s-mountTalk-paintOpts) _js/crew/talkview.js_ ×2

<!-- note:beatsFor -->
<!-- /note -->

### <a id="s-isRunning"></a>`isRunning(memberId)`

function · **exported** · L282–284

- called by: [`mountTalk>paintOpts`](talkview.js.md#s-mountTalk-paintOpts) _js/crew/talkview.js_

<!-- note:isRunning -->
<!-- /note -->

### <a id="s-playBeat"></a>`playBeat(m, beatId, {…}=)`

function · **exported** · L286–366

- calls: [`beatsFor`](#s-beatsFor) · [`playBeat>pub`](#s-playBeat-pub) ×2 · [`stopAllBeats`](#s-stopAllBeats)
- called by: [`mountTalk>paintOpts`](talkview.js.md#s-mountTalk-paintOpts) _js/crew/talkview.js_

<!-- note:playBeat -->
Play a beat as a scene. `onStep({ i, n, frac, line, choices, tag })` shows a
stage and the answers it waits on; `onDone(result)` fires once. Nothing
advances by itself — the returned stop() carries `.advance(choiceId)`,
which answers the stage on screen (any answer for a "Go on" stage), and
`.stage()` which reports it. stop() walks away without applying anything.

What the captain answers moves the odds: every choice carries a `lean`,
summed and taken off the roll the beat's own resolve() makes (a roll under
the odds is a success), so an addon's resolve gets it for free.

- L290 · `onDone?.({ ok: false, line: "You are already in the middle of that.", tag: "busy", cancell` — the caller's handlers used to be dropped on the floor here, leaving the
  panel waiting on a beat that was never theirs
- L293 · `stopAllBeats();` — one at a time, across the whole crew
- L299 · `const steps = (beat.steps?.(m, { social }) ?? []).filter((x) => x != null);` — an addon's lines: each one waits on "Go on"; a null closes the list
- L309 · `let carry = "";` — the captain's answer, said before the next stage's line
- L310 · `const said = [];` — what was answered, stage by stage
<!-- /note -->

#### <a id="s-playBeat-advance"></a>`playBeat.advance()`

prop · L288–288

<!-- note:playBeat.advance -->
<!-- /note -->

#### <a id="s-playBeat-stage"></a>`playBeat.stage()`

prop · L288–288

<!-- note:playBeat.stage -->
<!-- /note -->

#### <a id="s-playBeat-pub"></a>`playBeat>pub()`

function · L312–312

- called by: [`playBeat`](#s-playBeat) ×2 · [`playBeat>advance`](#s-playBeat-advance)

<!-- note:playBeat>pub -->
<!-- /note -->

#### <a id="s-playBeat-finish"></a>`playBeat>finish(apply)`

function · L314–341

- calls: [`applyOutcome`](#s-applyOutcome) · [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.includes`
- called by: [`playBeat>advance`](#s-playBeat-advance) ×2 · [`playBeat>stop`](#s-playBeat-stop)

<!-- note:playBeat>finish -->
- L319 · `if (!crew.aboard.includes(m)) {` — somebody who has walked off the ship does not finish the conversation
- L328 · `if (!res.tag) {` — the tag is what the player reads: build it from what actually landed so
  it can never promise something the outcome did not do
<!-- /note -->

##### <a id="s-playBeat-finish-leaned"></a>`playBeat>finish>leaned()`

function · L323–323

<!-- note:playBeat>finish>leaned -->
<!-- /note -->

#### <a id="s-playBeat-advance-2"></a>`playBeat>advance(choiceId=)`

function · L343–358

- calls: [`playBeat>finish`](#s-playBeat-finish) ×2 · [`playBeat>pub`](#s-playBeat-pub)
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.includes`

<!-- note:playBeat>advance -->
Answer the stage on screen. Returns false when there is nothing to answer.
<!-- /note -->

#### <a id="s-playBeat-stop"></a>`playBeat>stop()`

function · L360–360

- calls: [`playBeat>finish`](#s-playBeat-finish)
- called by: [`stopAllBeats`](#s-stopAllBeats)

<!-- note:playBeat>stop -->
<!-- /note -->

### <a id="s-advanceBeat"></a>`advanceBeat(memberId, choiceId=)`

function · **exported** · L368–371

- called by: [`mountTalk>paintOpts`](talkview.js.md#s-mountTalk-paintOpts) _js/crew/talkview.js_

<!-- note:advanceBeat -->
Answer the stage a hand's beat is waiting on (the talk view's buttons).
<!-- /note -->

## Module-level calls

- via [js/crew/ledger.js](ledger.js.md): `crewHooks.reset.includes`, `crewHooks.reset.push`
