# js/crew/heritage.js

[index](../../../README.md) · 139 lines · 20 symbols · 2 imports · 4 importers

## About

<!-- note:@file -->
Living Galaxy — what a child gets from the house they were born into.

A genome is what a child inherits from two bodies. This is what they
inherit from two lives: the trade their parents worked, the words they grew
up hearing, and the head start that gives them. Three generations of miners
is a family with rock in it — the third one is not born knowing geology,
but they were assaying core samples on the mess table at nine, and it shows
in what they start with and in how fast the rest goes in.

Every career does this, not just the drills. The rule is the same whatever
the complex: the parents' own skill in their trade decides what they can
pass on, the child's genome decides how much of it sticks, and the
generation count decides how deep the house's habit runs.

  taught   — skills the child is already carrying when they come of age
  learn    — a multiplier on how fast that career's skills go in after that
  line     — the house's trade, and how many generations have worked it

Nothing here overrides the genome. A child born to two surveyors who drew a
body with no head for rock still starts ahead of a stranger and still never
gets very good; a child who drew the aptitude AND the upbringing is the one
the hiring halls fight over.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../careers/complexes.js` | `COMPLEXES`, `RANK_LETTERS` | [js/careers/complexes.js](../careers/complexes.js.md) |
| 2 | `../npc/cradle.js` | `cradle` | [js/npc/cradle.js](../npc/cradle.js.md) |

## Imported by

- [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md) — `heritageLine`, `learningBonus`, `houseSkills`
- [js/crew/deckacts.js](deckacts.js.md) — `learningBonus`, `houseSkills`
- [js/crew/family.js](family.js.md) — `heritageFor`, `applyHeritage`, `heritageLine`, `startingLetter`
- test/skycrew.test.mjs _(outside js/)_ — `heritageFor`, `applyHeritage`, `heritageLine`, `learningBonus`, `houseSkills`, `generationOf`, `startingLetter`, `skillsOfComplex`, `TAUGHT_SHARE`, `LEARN_CAP`

## Exports

- [`TAUGHT_SHARE`](#s-TAUGHT_SHARE) · const — used by test/skycrew.test.mjs
- [`GENERATION_STEP`](#s-GENERATION_STEP) · const — **no importer in scanned roots**
- [`MAX_GENERATIONS`](#s-MAX_GENERATIONS) · const — **no importer in scanned roots**
- [`LEARN_CAP`](#s-LEARN_CAP) · const — used by test/skycrew.test.mjs
- [`generationOf`](#s-generationOf) · function — used by test/skycrew.test.mjs
- [`houseTradeOf`](#s-houseTradeOf) · function — **no importer in scanned roots**
- [`lineFor`](#s-lineFor) · function — **no importer in scanned roots**
- [`skillsOfComplex`](#s-skillsOfComplex) · function — used by test/skycrew.test.mjs
- [`heritageFor`](#s-heritageFor) · function — used by [js/crew/family.js](family.js.md), test/skycrew.test.mjs
- [`applyHeritage`](#s-applyHeritage) · function — used by [js/crew/family.js](family.js.md), test/skycrew.test.mjs
- [`learningBonus`](#s-learningBonus) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/crew/deckacts.js](deckacts.js.md), test/skycrew.test.mjs
- [`houseSkills`](#s-houseSkills) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/crew/deckacts.js](deckacts.js.md), test/skycrew.test.mjs
- [`heritageLine`](#s-heritageLine) · function — used by [js/console/panels/crew-gene.js](../console/panels/crew-gene.js.md), [js/crew/family.js](family.js.md), test/skycrew.test.mjs
- [`startingLetter`](#s-startingLetter) · function — used by [js/crew/family.js](family.js.md), test/skycrew.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-TAUGHT_SHARE"></a>`TAUGHT_SHARE`

const · **exported** · L4–4

<!-- note:TAUGHT_SHARE -->
How much of a parent's skill a child can carry out of the house, at best.
<!-- /note -->

### <a id="s-GENERATION_STEP"></a>`GENERATION_STEP`

const · **exported** · L5–5

<!-- note:GENERATION_STEP -->
And how much the generations after the first add to that.
<!-- /note -->

### <a id="s-MAX_GENERATIONS"></a>`MAX_GENERATIONS`

const · **exported** · L6–6

<!-- note:MAX_GENERATIONS -->
<!-- /note -->

### <a id="s-LEARN_CAP"></a>`LEARN_CAP`

const · **exported** · L7–7

<!-- note:LEARN_CAP -->
The most a house's habit can speed the rest of the learning up.
<!-- /note -->

### <a id="s-clamp"></a>`clamp(v, a, b)`

function · L9–9

- called by: [`generationOf`](#s-generationOf) · [`lineFor`](#s-lineFor) ×2

<!-- note:clamp -->
<!-- /note -->

### <a id="s-r2"></a>`r2(v)`

function · L10–10

- called by: [`heritageFor`](#s-heritageFor) ×3

<!-- note:r2 -->
<!-- /note -->

### <a id="s-hashRoll"></a>`hashRoll(s)`

function · L12–16

- called by: [`lineFor`](#s-lineFor)

<!-- note:hashRoll -->
<!-- /note -->

### <a id="s-recOf"></a>`recOf(p)`

function · L18–22

- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`generationOf`](#s-generationOf) · [`heritageFor`](#s-heritageFor) ×2 · [`heritageLine`](#s-heritageLine) · [`houseSkills`](#s-houseSkills) · [`houseTradeOf`](#s-houseTradeOf) · [`learningBonus`](#s-learningBonus)

<!-- note:recOf -->
A person's record, whether they are a live member or a ledger id.
<!-- /note -->

### <a id="s-generationOf"></a>`generationOf(p)`

function · **exported** · L24–27

- calls: [`clamp`](#s-clamp) · [`recOf`](#s-recOf)
- called by: [`lineFor`](#s-lineFor) ×4

<!-- note:generationOf -->
Generations this person's house has worked their trade. 1 = they are the first.
<!-- /note -->

### <a id="s-houseTradeOf"></a>`houseTradeOf(p)`

function · **exported** · L29–32

- calls: [`recOf`](#s-recOf)
- called by: [`lineFor`](#s-lineFor) ×2

<!-- note:houseTradeOf -->
The complex a person's house works, which is usually their own.
<!-- /note -->

### <a id="s-lineFor"></a>`lineFor(carrier, sire, seed=)`

function · **exported** · L34–47

- calls: [`clamp`](#s-clamp) ×2 · [`generationOf`](#s-generationOf) ×4 · [`hashRoll`](#s-hashRoll) · [`houseTradeOf`](#s-houseTradeOf) ×2
- called by: [`heritageFor`](#s-heritageFor)

<!-- note:lineFor -->
Which trade a child is raised into. Two parents in the same complex is a
house — the child is the next generation of it. Two different trades is a
choice, made once, from the child's own seed, and the other parent's trade
comes along as a smaller second inheritance.

- L42 · `` const leanA = hashRoll(`line:${seed}:${a}:${b}`) < 0.5; `` — mixed house: the child leans one way, deterministically
<!-- /note -->

### <a id="s-skillsOfComplex"></a>`skillsOfComplex(complexId)`

function · **exported** · L49–53

- called by: [`heritageFor`](#s-heritageFor) ×2 · [`heritageFor>teach`](#s-heritageFor-teach)

<!-- note:skillsOfComplex -->
The skills a complex actually teaches, primaries first.
<!-- /note -->

### <a id="s-heritageFor"></a>`heritageFor(carrier, sire, {…}=)`

function · **exported** · L55–95

- calls: [`heritageFor>teach`](#s-heritageFor-teach) ×2 · [`lineFor`](#s-lineFor) · [`r2`](#s-r2) ×3 · [`recOf`](#s-recOf) ×2 · [`skillsOfComplex`](#s-skillsOfComplex) ×2
- called by: [`conceive`](family.js.md#s-conceive) _js/crew/family.js_

<!-- note:heritageFor -->
What a child of these two is carrying when they come of age.

`aptitude` is the child's own genome read (spacer.skillAptitude): the house
can teach, but it cannot make a body good at something it is not built for.
The share rises with the generation, so a fourth-generation fitter starts
meaningfully ahead of a second — and it is capped, because eventually the
child has to go and do the job themselves.
<!-- /note -->

#### <a id="s-heritageFor-teach"></a>`heritageFor>teach(complexId, weight)`

function · L62–74

- calls: [`skillsOfComplex`](#s-skillsOfComplex)
- called by: [`heritageFor`](#s-heritageFor) ×2

<!-- note:heritageFor>teach -->
- L68 · `const parental = both > 0 ? (best * 0.6 + both * 0.4) : best;` — what a house can pass on sits between "the better parent knew it" and
  "they both did" — two of them at the same bench teaches more
<!-- /note -->

### <a id="s-applyHeritage"></a>`applyHeritage(child, heritage)`

function · **exported** · L97–107

- called by: [`conceive`](family.js.md#s-conceive) _js/crew/family.js_

<!-- note:applyHeritage -->
Fold a heritage into a child's record: trade, starting skills, the line.
<!-- /note -->

### <a id="s-learningBonus"></a>`learningBonus(m, skill)`

function · **exported** · L109–114

- calls: [`recOf`](#s-recOf)
- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ · [`applyAction`](deckacts.js.md#s-applyAction) _js/crew/deckacts.js_ ×2

<!-- note:learningBonus -->
How fast a career's skills go in for this person. 1 for anybody who was not
raised to it; up to LEARN_CAP for somebody whose house has done nothing else
for four generations. Read by STUDY and MENTOR in the effect table.
<!-- /note -->

### <a id="s-houseSkills"></a>`houseSkills(m)`

function · **exported** · L116–121

- calls: [`recOf`](#s-recOf)
- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ · [`applyAction`](deckacts.js.md#s-applyAction) _js/crew/deckacts.js_

<!-- note:houseSkills -->
The skills this person's house would push them toward, best first.
<!-- /note -->

### <a id="s-ORDINAL"></a>`ORDINAL`

const · L123–123

<!-- note:ORDINAL -->
<!-- /note -->

### <a id="s-heritageLine"></a>`heritageLine(m)`

function · **exported** · L125–133

- calls: [`recOf`](#s-recOf)
- called by: [`mountGenome>paint`](../console/panels/crew-gene.js.md#s-mountGenome-paint) _js/console/panels/crew-gene.js_ · [`conceive`](family.js.md#s-conceive) _js/crew/family.js_

<!-- note:heritageLine -->
"Third-generation Mining — taught it before they could read a manifest."
<!-- /note -->

### <a id="s-startingLetter"></a>`startingLetter(heritage)`

function · **exported** · L135–139

- called by: [`tickHousehold`](family.js.md#s-tickHousehold) _js/crew/family.js_

<!-- note:startingLetter -->
Where a hand's rank ladder starts, given a house. A child of the trade starts one rung up.
<!-- /note -->
