# js/crew/children.js

[index](../../../README.md) · 170 lines · 11 symbols · 7 imports · 5 importers

## About

<!-- note:@file -->
LIVING GALAXY — the children.

A child has had a real crossover genome earlier: `breed()` in
genome/spacer.js crosses both parents, and heritage.js teaches them the
house trade. What was missing is that none of it was ever SHOWN. A child was
a name and an age on the bonds tab; you could not see what they had got from
whom, whether it was a gift or a burden, and you could not do anything with
them for the forty-eight cycles before they came of age and walked off.

So, three things:

  inheritance(child) — what they got, named, measured against the parents
                       they got it from, as boons and flaws
  childActs(child)   — what a captain can do about it
  raise(child, act)  — doing it, which moves their ledger and their skills

The measurement is the honest part: a boon is not "the genome rolled high",
it is "this is better than BOTH the people it came from", which is the only
comparison a parent would actually make.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../npc/cradle.js` | `cradle`, `genomeOf` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 2 | `../genome/spacer.js` | `skillAptitude`, `genomeTraits`, `kinship` | [js/genome/spacer.js](../genome/spacer.js.md) |
| 3 | `./family.js` | `household`, `personById`, `note` | [js/crew/family.js](family.js.md) |
| 4 | `./ledger.js` | `crew`, `firstName` | [js/crew/ledger.js](ledger.js.md) |
| 5 | `../sim/sim.js` | `logEvent`, `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 6 | `../careers/complexes.js` | `COMPLEXES` | [js/careers/complexes.js](../careers/complexes.js.md) |
| 7 | `./voice.js` | `line` as `V`, `wrap` as `voiceWrap` | [js/crew/voice.js](voice.js.md) |

## Imported by

- [js/console/panels/crew.js](../console/panels/crew.js.md) — `childrenAboard`, `CHILD_ACTS`, `raise`
- [js/crew/childtalk.js](childtalk.js.md) — `bondWith`, `inheritance`, `APT_LABEL`
- [js/crew/family.js](family.js.md) — `comeOfAge`
- test/childtalk.test.mjs _(outside js/)_ — `bondWith`
- test/systems.test.mjs _(outside js/)_ — `CH`

## Exports

- [`APT_LABEL`](#s-APT_LABEL) · const — used by [js/crew/childtalk.js](childtalk.js.md)
- [`inheritance`](#s-inheritance) · function — used by [js/crew/childtalk.js](childtalk.js.md)
- [`CHILD_ACTS`](#s-CHILD_ACTS) · const — used by [js/console/panels/crew.js](../console/panels/crew.js.md)
- [`bondWith`](#s-bondWith) · function — used by [js/crew/childtalk.js](childtalk.js.md), test/childtalk.test.mjs
- [`raise`](#s-raise) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md)
- [`comeOfAge`](#s-comeOfAge) · function — used by [js/crew/family.js](family.js.md)
- [`childrenAboard`](#s-childrenAboard) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-BOON"></a>`BOON`

const · L9–9

<!-- note:BOON -->
How far above or below both parents a reading has to be before it is worth
a word. Below this it is just a number.
<!-- /note -->

### <a id="s-APT_LABEL"></a>`APT_LABEL`

const · **exported** · L11–18

<!-- note:APT_LABEL -->
<!-- /note -->

### <a id="s-TRAIT_LABEL"></a>`TRAIT_LABEL`

const · L20–26

<!-- note:TRAIT_LABEL -->
<!-- /note -->

### <a id="s-parentsOf"></a>`parentsOf(child)`

function · L28–30

- calls: [`personById`](family.js.md#s-personById) _js/crew/family.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`childrenAboard`](#s-childrenAboard) · [`inheritance`](#s-inheritance)

<!-- note:parentsOf -->
- L29 · `return (child?.parents ?? []).map((id) => (id === "player" ? null : cradle.get(id) ?? pers` — the ledger first: a crew member object carries a name and a mood, the
  CRADLE record carries the genome, and the genome is the whole question
<!-- /note -->

### <a id="s-inheritance"></a>`inheritance(child)`

function · **exported** · L32–80

- calls: [`parentsOf`](#s-parentsOf) · [`genomeTraits`](../genome/spacer.js.md#s-genomeTraits) _js/genome/spacer.js_ · [`kinship`](../genome/spacer.js.md#s-kinship) _js/genome/spacer.js_ ×2 · [`skillAptitude`](../genome/spacer.js.md#s-skillAptitude) _js/genome/spacer.js_ ×2 · [`genomeOf`](../npc/cradle.js.md#s-genomeOf) _js/npc/cradle.js_ ×4
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`childrenAboard`](#s-childrenAboard) · [`comeOfAge`](#s-comeOfAge) · [`CHILD_TOPICS.run~2`](childtalk.js.md#s-CHILD_TOPICS-run-2) _js/crew/childtalk.js_ · [`CHILD_TOPICS.run~4`](childtalk.js.md#s-CHILD_TOPICS-run-4) _js/crew/childtalk.js_ · [`CHILD_TOPICS.run~7`](childtalk.js.md#s-CHILD_TOPICS-run-7) _js/crew/childtalk.js_ · [`answerChild`](childtalk.js.md#s-answerChild) _js/crew/childtalk.js_

<!-- note:inheritance -->
What this child got, and from whom.

Returns { boons, flaws, shares, kin, complex } — `shares` is how much of
each parent is measurably in them, which is the thing people actually want
to know and which kinship() can answer honestly.

- L78 · `complex: h ? { id: h.complexId, name: (COMPLEXES[h.complexId]?.name ?? h.complexId).replac` — 0.3.57: heritage keeps `learn` per skill ({ mining: 1.3, … }); the card
  printed it with toFixed and threw — so a child of a trade house took the
  whole HOUSEHOLD section down with it. The number is the house's best.
<!-- /note -->

### <a id="s-CHILD_ACTS"></a>`CHILD_ACTS`

const · **exported** · L82–87

<!-- note:CHILD_ACTS -->
---- raising them ----------------------------------------------------------

Forty-eight cycles is a long time to watch a name tick up. These are the
four things a captain on a working ship can actually do, and each one bends
something real: the child's bond with you, which follows them into the
hiring hall, and what they will be good at when they get there.
<!-- /note -->

### <a id="s-bondKey"></a>`bondKey(id)`

function · L89–89

- called by: [`bondWith`](#s-bondWith) · [`raise`](#s-raise)

<!-- note:bondKey -->
<!-- /note -->

### <a id="s-bondWith"></a>`bondWith(child)`

function · **exported** · L91–93

- calls: [`bondKey`](#s-bondKey)
- called by: [`childrenAboard`](#s-childrenAboard) · [`comeOfAge`](#s-comeOfAge) · [`raise`](#s-raise) ×4 · [`CHILD_TOPICS.run`](childtalk.js.md#s-CHILD_TOPICS-run) _js/crew/childtalk.js_ · [`CHILD_TOPICS.run~4`](childtalk.js.md#s-CHILD_TOPICS-run-4) _js/crew/childtalk.js_ · [`CHILD_TOPICS.run~6`](childtalk.js.md#s-CHILD_TOPICS-run-6) _js/crew/childtalk.js_ · [`CHILD_TOPICS.run~7`](childtalk.js.md#s-CHILD_TOPICS-run-7) _js/crew/childtalk.js_ · [`addBond`](childtalk.js.md#s-addBond) _js/crew/childtalk.js_ ×2 · [`answerChild`](childtalk.js.md#s-answerChild) _js/crew/childtalk.js_ · [`talkToChild`](childtalk.js.md#s-talkToChild) _js/crew/childtalk.js_

<!-- note:bondWith -->
<!-- /note -->

### <a id="s-raise"></a>`raise(child, actId)`

function · **exported** · L95–126

- calls: [`bondKey`](#s-bondKey) · [`bondWith`](#s-bondWith) ×4 · [`note`](family.js.md#s-note) _js/crew/family.js_ · [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_ · [`line`](voice.js.md#s-line) _js/crew/voice.js_ · [`wrap`](voice.js.md#s-wrap) _js/crew/voice.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.put`
- called by: [`childCard`](../console/panels/crew.js.md#s-childCard) _js/console/panels/crew.js_

<!-- note:raise -->
Do one of them. Returns { ok, line, tag } the way a beat does, so the panel
can render it with the same shape it already knows.

- L109 · `const ceiling = Math.round(28 + (rec.aptitude?.[key] ?? 0.5) * 42);` — capped by what the body can carry: teaching does not beat aptitude,
  it just gets there sooner — the same rule heritage.js uses
- L111 · `rec.skills[key] = Math.max(before, Math.min(ceiling, before + 2));` — 0.3.57: never taught DOWN to the ceiling
<!-- /note -->

### <a id="s-comeOfAge"></a>`comeOfAge(child)`

function · **exported** · L128–160

- calls: [`bondWith`](#s-bondWith) · [`inheritance`](#s-inheritance)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`tickHousehold`](family.js.md#s-tickHousehold) _js/crew/family.js_

<!-- note:comeOfAge -->
What a grown child carries out of the door.

Called by family.js when they come of age. A child who was raised — time
spent, trade taught — leaves with the captain's name on their record and a
standing offer; one who was not is a stranger in a hall like anyone else.

- L133 · `const inh = inheritance(child);` — The boons and flaws stop being a description and start being a number.
  An aptitude that beat both parents is worth a head start in that skill
  when they walk into a hall; one that came in under both is a gap they
  will have to work out of. The heritage cap still applies — a gift gets
  you there sooner, it does not get you past what the body can carry.
<!-- /note -->

### <a id="s-childrenAboard"></a>`childrenAboard()`

function · **exported** · L162–170

- calls: [`bondWith`](#s-bondWith) · [`inheritance`](#s-inheritance) · [`parentsOf`](#s-parentsOf)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- via [js/crew/family.js](family.js.md): `household.children.map`
- called by: [`mountBonds`](../console/panels/crew.js.md#s-mountBonds) _js/console/panels/crew.js_

<!-- note:childrenAboard -->
Children currently aboard, with everything a panel needs.
<!-- /note -->
