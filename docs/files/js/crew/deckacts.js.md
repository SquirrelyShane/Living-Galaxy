# js/crew/deckacts.js

[index](../../../README.md) · 258 lines · 69 symbols · 8 imports · 5 importers

## About

<!-- note:@file -->
Living Galaxy — DECK ACTIONS: what a decision actually costs and buys.

The deck graph (deckgraph.js) decides; this is the one place that says what
happens next. Every terminal in the graph has exactly one entry in ACTIONS,
and the verification suite fails if a graph action has no implementation or
an implementation has no node — the two cannot drift apart.

  self     needs moved, 0..1, negative is relief
  vitals   morale for a person, condition for a machine
  trust    standing with the captain — work earns it, slacking spends it
  ship     the hull: wear, hull points, the drill and stow flags
  other    the person it was aimed at: rapport, morale
  eff(c)   0..1, how well this body does this thing

Reductions are scaled by efficacy, costs are not: a tired hand pays the
same fatigue for a watch and gets less out of it.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./ledger.js` | `firstName`, `rapportBetween` | [js/crew/ledger.js](ledger.js.md) |
| 2 | `../npc/cradle.js` | `cradle` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 3 | `./family.js` | `adjustMorale`, `adjustTrust` | [js/crew/family.js](family.js.md) |
| 4 | `./bonds.js` | `adjustRapport`, `tieBetween`, `makeRivals` | [js/crew/bonds.js](bonds.js.md) |
| 5 | `./journal.js` | `diffOf` | [js/crew/journal.js](journal.js.md) |
| 6 | `./heritage.js` | `learningBonus`, `houseSkills` | [js/crew/heritage.js](heritage.js.md) |
| 7 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 8 | `./romance.js` | `moment`, `makePartners`, `bond`, `breakOff`, `privateNight`, `actOnJealousy`, `canPropose`, `canBond` | [js/crew/romance.js](romance.js.md) |

## Imported by

- [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md) — `NEED_KEYS`
- [js/crew/deckmind.js](deckmind.js.md) — `ACTIONS`, `NEED_KEYS`, `applyAction`
- [js/crew/deckmind.js](deckmind.js.md) — `ACTIONS`, `NEED_KEYS`, `applyAction`
- [js/crew/orders.js](orders.js.md) — `NEED_KEYS`
- test/skycrew.test.mjs _(outside js/)_ — `ACTIONS`, `NEED_KEYS`

## Exports

- [`NEED_KEYS`](#s-NEED_KEYS) · const — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/crew/deckmind.js](deckmind.js.md), [js/crew/orders.js](orders.js.md), test/skycrew.test.mjs
- [`ACTIONS`](#s-ACTIONS) · const — used by [js/crew/deckmind.js](deckmind.js.md), test/skycrew.test.mjs
- [`applyAction`](#s-applyAction) · function — used by [js/crew/deckmind.js](deckmind.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-EVERYDAY_MOMENT"></a>`EVERYDAY_MOMENT`

const · L10–14

<!-- note:EVERYDAY_MOMENT -->
An ordinary evening is how most of it actually happens. These are the
everyday actions that also move a pair's spark, so a relationship grows out
of a shared watch and a game of cards rather than out of a dedicated
"romance" mode nobody would ever open.
<!-- /note -->

### <a id="s-clamp01"></a>`clamp01(v)`

function · L16–16

- called by: [`applyAction`](#s-applyAction) ×2

<!-- note:clamp01 -->
<!-- /note -->

### <a id="s-NEED_KEYS"></a>`NEED_KEYS`

const · **exported** · L18–18

<!-- note:NEED_KEYS -->
The nine needs, in the order the journal prints them.
<!-- /note -->

### <a id="s-A"></a>`A(spec)`

function · L20–20

- called by: [`ACTIONS`](#s-ACTIONS) ×51

<!-- note:A -->
---- what actions actually do --------------------------------------------
Every terminal in the graph has exactly one entry here. `self` moves needs,
`vitals` moves morale or condition, `ship` moves the hull, `other` moves the
person it was aimed at. Efficacy scales the lot: a tired hand with the wrong
genes for the job still does the job, just not well.
<!-- /note -->

### <a id="s-ACTIONS"></a>`ACTIONS`

const · **exported** · L21–78

- calls: [`A`](#s-A) ×51

<!-- note:ACTIONS -->
- L63 · `NOTICE_THEM: A({ self: { intimacy: -0.1, social: -0.15 }, vitals: +0.8, eff: (c) => 0.4 +` — the ladder. Each of these moves crew/romance.js's spark for the pair as
  well as the numbers here; applyAction routes them through `romance`.
<!-- /note -->

#### <a id="s-ACTIONS-eff"></a>`ACTIONS.eff(c)`

prop · L22–22

<!-- note:ACTIONS.eff -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-2"></a>`ACTIONS.eff~2(c)`

prop · L23–23

<!-- note:ACTIONS.eff~2 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-3"></a>`ACTIONS.eff~3(c)`

prop · L24–24

<!-- note:ACTIONS.eff~3 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-4"></a>`ACTIONS.eff~4(c)`

prop · L25–25

<!-- note:ACTIONS.eff~4 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-5"></a>`ACTIONS.eff~5(c)`

prop · L26–26

<!-- note:ACTIONS.eff~5 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-6"></a>`ACTIONS.eff~6(c)`

prop · L27–27

<!-- note:ACTIONS.eff~6 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-7"></a>`ACTIONS.eff~7(c)`

prop · L28–28

<!-- note:ACTIONS.eff~7 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-8"></a>`ACTIONS.eff~8(c)`

prop · L29–29

<!-- note:ACTIONS.eff~8 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-9"></a>`ACTIONS.eff~9(c)`

prop · L30–30

<!-- note:ACTIONS.eff~9 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-10"></a>`ACTIONS.eff~10(c)`

prop · L31–31

<!-- note:ACTIONS.eff~10 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-11"></a>`ACTIONS.eff~11(c)`

prop · L32–32

<!-- note:ACTIONS.eff~11 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-12"></a>`ACTIONS.eff~12(c)`

prop · L33–33

<!-- note:ACTIONS.eff~12 -->
<!-- /note -->

#### <a id="s-ACTIONS-note"></a>`ACTIONS.note(c)`

prop · L33–33

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_

<!-- note:ACTIONS.note -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-13"></a>`ACTIONS.eff~13()`

prop · L34–34

<!-- note:ACTIONS.eff~13 -->
<!-- /note -->

#### <a id="s-ACTIONS-note-2"></a>`ACTIONS.note~2(c)`

prop · L34–34

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_

<!-- note:ACTIONS.note~2 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-14"></a>`ACTIONS.eff~14(c)`

prop · L35–35

<!-- note:ACTIONS.eff~14 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-15"></a>`ACTIONS.eff~15(c)`

prop · L36–36

<!-- note:ACTIONS.eff~15 -->
<!-- /note -->

#### <a id="s-ACTIONS-note-3"></a>`ACTIONS.note~3(c)`

prop · L36–36

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_

<!-- note:ACTIONS.note~3 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-16"></a>`ACTIONS.eff~16()`

prop · L38–38

<!-- note:ACTIONS.eff~16 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-17"></a>`ACTIONS.eff~17(c)`

prop · L39–39

<!-- note:ACTIONS.eff~17 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-18"></a>`ACTIONS.eff~18(c)`

prop · L40–40

<!-- note:ACTIONS.eff~18 -->
<!-- /note -->

#### <a id="s-ACTIONS-note-4"></a>`ACTIONS.note~4(c)`

prop · L40–40

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_

<!-- note:ACTIONS.note~4 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-19"></a>`ACTIONS.eff~19(c)`

prop · L41–41

<!-- note:ACTIONS.eff~19 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-20"></a>`ACTIONS.eff~20(c)`

prop · L42–42

<!-- note:ACTIONS.eff~20 -->
<!-- /note -->

#### <a id="s-ACTIONS-note-5"></a>`ACTIONS.note~5(c)`

prop · L42–42

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×2

<!-- note:ACTIONS.note~5 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-21"></a>`ACTIONS.eff~21(c)`

prop · L44–44

<!-- note:ACTIONS.eff~21 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-22"></a>`ACTIONS.eff~22()`

prop · L45–45

<!-- note:ACTIONS.eff~22 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-23"></a>`ACTIONS.eff~23()`

prop · L46–46

<!-- note:ACTIONS.eff~23 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-24"></a>`ACTIONS.eff~24()`

prop · L47–47

<!-- note:ACTIONS.eff~24 -->
<!-- /note -->

#### <a id="s-ACTIONS-note-6"></a>`ACTIONS.note~6(c)`

prop · L47–47

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_

<!-- note:ACTIONS.note~6 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-25"></a>`ACTIONS.eff~25(c)`

prop · L48–48

<!-- note:ACTIONS.eff~25 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-26"></a>`ACTIONS.eff~26()`

prop · L49–49

<!-- note:ACTIONS.eff~26 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-27"></a>`ACTIONS.eff~27(c)`

prop · L51–51

<!-- note:ACTIONS.eff~27 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-28"></a>`ACTIONS.eff~28()`

prop · L52–52

<!-- note:ACTIONS.eff~28 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-29"></a>`ACTIONS.eff~29()`

prop · L53–53

<!-- note:ACTIONS.eff~29 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-30"></a>`ACTIONS.eff~30(c)`

prop · L54–54

<!-- note:ACTIONS.eff~30 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-31"></a>`ACTIONS.eff~31()`

prop · L55–55

<!-- note:ACTIONS.eff~31 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-32"></a>`ACTIONS.eff~32(c)`

prop · L56–56

<!-- note:ACTIONS.eff~32 -->
<!-- /note -->

#### <a id="s-ACTIONS-note-7"></a>`ACTIONS.note~7(c)`

prop · L56–56

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×2

<!-- note:ACTIONS.note~7 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-33"></a>`ACTIONS.eff~33(c)`

prop · L57–57

<!-- note:ACTIONS.eff~33 -->
<!-- /note -->

#### <a id="s-ACTIONS-note-8"></a>`ACTIONS.note~8(c)`

prop · L57–57

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×2

<!-- note:ACTIONS.note~8 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-34"></a>`ACTIONS.eff~34()`

prop · L58–58

<!-- note:ACTIONS.eff~34 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-35"></a>`ACTIONS.eff~35(c)`

prop · L59–59

<!-- note:ACTIONS.eff~35 -->
<!-- /note -->

#### <a id="s-ACTIONS-note-9"></a>`ACTIONS.note~9(c)`

prop · L59–59

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_

<!-- note:ACTIONS.note~9 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-36"></a>`ACTIONS.eff~36(c)`

prop · L60–60

<!-- note:ACTIONS.eff~36 -->
<!-- /note -->

#### <a id="s-ACTIONS-note-10"></a>`ACTIONS.note~10(c)`

prop · L60–60

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_

<!-- note:ACTIONS.note~10 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-37"></a>`ACTIONS.eff~37()`

prop · L61–61

<!-- note:ACTIONS.eff~37 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-38"></a>`ACTIONS.eff~38(c)`

prop · L63–63

<!-- note:ACTIONS.eff~38 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-39"></a>`ACTIONS.eff~39(c)`

prop · L64–64

<!-- note:ACTIONS.eff~39 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-40"></a>`ACTIONS.eff~40(c)`

prop · L65–65

<!-- note:ACTIONS.eff~40 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-41"></a>`ACTIONS.eff~41()`

prop · L66–66

<!-- note:ACTIONS.eff~41 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-42"></a>`ACTIONS.eff~42(c)`

prop · L67–67

<!-- note:ACTIONS.eff~42 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-43"></a>`ACTIONS.eff~43(c)`

prop · L68–68

<!-- note:ACTIONS.eff~43 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-44"></a>`ACTIONS.eff~44()`

prop · L69–69

<!-- note:ACTIONS.eff~44 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-45"></a>`ACTIONS.eff~45()`

prop · L70–70

<!-- note:ACTIONS.eff~45 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-46"></a>`ACTIONS.eff~46(c)`

prop · L71–71

<!-- note:ACTIONS.eff~46 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-47"></a>`ACTIONS.eff~47()`

prop · L72–72

<!-- note:ACTIONS.eff~47 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-48"></a>`ACTIONS.eff~48(c)`

prop · L74–74

<!-- note:ACTIONS.eff~48 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-49"></a>`ACTIONS.eff~49()`

prop · L75–75

<!-- note:ACTIONS.eff~49 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-50"></a>`ACTIONS.eff~50()`

prop · L76–76

<!-- note:ACTIONS.eff~50 -->
<!-- /note -->

#### <a id="s-ACTIONS-eff-51"></a>`ACTIONS.eff~51(c)`

prop · L77–77

<!-- note:ACTIONS.eff~51 -->
<!-- /note -->

#### <a id="s-ACTIONS-note-11"></a>`ACTIONS.note~11(c)`

prop · L77–77

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_

<!-- note:ACTIONS.note~11 -->
<!-- /note -->

### <a id="s-applyRomance"></a>`applyRomance(ctx, kind, efficacy, rng, out)`

function · L80–119

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×2 · [`actOnJealousy`](romance.js.md#s-actOnJealousy) _js/crew/romance.js_ · [`bond`](romance.js.md#s-bond) _js/crew/romance.js_ · [`breakOff`](romance.js.md#s-breakOff) _js/crew/romance.js_ · [`canBond`](romance.js.md#s-canBond) _js/crew/romance.js_ · [`canPropose`](romance.js.md#s-canPropose) _js/crew/romance.js_ · [`makePartners`](romance.js.md#s-makePartners) _js/crew/romance.js_ · [`moment`](romance.js.md#s-moment) _js/crew/romance.js_ · [`privateNight`](romance.js.md#s-privateNight) _js/crew/romance.js_
- called by: [`applyAction`](#s-applyAction)

<!-- note:applyRomance -->
---- consequences --------------------------------------------------------

The ladder rungs. Each one moves the pair's spark (crew/romance.js) and, for
the three that are decisions rather than gestures, actually changes what the
two of them are to each other. `private` is a fade to black: it moves the
numbers and may start a pregnancy; it depicts nothing.
<!-- /note -->

### <a id="s-applyAction"></a>`applyAction(ctx, id, spec, efficacy, rng, cycle=)`

function · **exported** · L121–258

- calls: [`adjustRapport`](bonds.js.md#s-adjustRapport) _js/crew/bonds.js_ ×4 · [`makeRivals`](bonds.js.md#s-makeRivals) _js/crew/bonds.js_ · [`tieBetween`](bonds.js.md#s-tieBetween) _js/crew/bonds.js_ ×2 · [`applyRomance`](#s-applyRomance) · [`clamp01`](#s-clamp01) ×2 · [`adjustMorale`](family.js.md#s-adjustMorale) _js/crew/family.js_ ×6 · [`adjustTrust`](family.js.md#s-adjustTrust) _js/crew/family.js_ · [`houseSkills`](heritage.js.md#s-houseSkills) _js/crew/heritage.js_ · [`learningBonus`](heritage.js.md#s-learningBonus) _js/crew/heritage.js_ ×2 · [`diffOf`](journal.js.md#s-diffOf) _js/crew/journal.js_ ×3 · [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ ×2 · [`rapportBetween`](ledger.js.md#s-rapportBetween) _js/crew/ledger.js_ ×3 · [`moment`](romance.js.md#s-moment) _js/crew/romance.js_
- via [js/crew/heritage.js](heritage.js.md): `houseSkills.slice`
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`stepHand`](deckmind.js.md#s-stepHand) _js/crew/deckmind.js_

<!-- note:applyAction -->
Apply one decision. Mutates the member, the people in the room and the
hull, and reports exactly what moved so the record can be written from it.

- L144 · `const rt = ctx.romance?.target;` — a rung of the ladder is always aimed at the person it is about, whatever
  else was on this hand's mind when the watch started
- L193 · `pupil.skills[best[0]] = Math.min(100, b + Math.round((2 * efficacy + 1) * learningBonus(pu` — a pupil raised to this trade picks it up faster from anybody
- L202 · `const house = new Set(houseSkills(m).slice(0, 4));` — A person studies what their body is best at — weighted toward what their
  house does, because that is the shelf the manuals are already on.
- L206 · `const focus = m.trainFocus && ctx.body.apt[m.trainFocus] != null ? m.trainFocus : null;` — 0.3.53: a hand the captain set to TRAIN studies that — and only as far
  as their body lets them (js/crew/orders.js)
<!-- /note -->
