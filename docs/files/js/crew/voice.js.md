# js/crew/voice.js

[index](../../../README.md) · 43 lines · 6 symbols · 1 imports · 5 importers

## About

<!-- note:@file -->
Sample the voice bank. Trait + seed pick a stable line for a moment,
so the same hand doesn't recite a new novel every paint, but a new
conversation (new time / topic) draws a different one.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./voice-bank.js` | `BANK`, `BANK_SIZE` | [js/crew/voice-bank.js](voice-bank.js.md) |

## Imported by

- [js/crew/children.js](children.js.md) — `line`, `wrap`
- [js/crew/family.js](family.js.md) — `line`, `wrap`
- [js/crew/talk-trees.js](talk-trees.js.md) — `line`, `byTrait`
- [js/crew/talk.js](talk.js.md) — `line`, `wrap`
- test/systems.test.mjs _(outside js/)_ — `line`

## Exports

- `BANK_SIZE` — **no importer in scanned roots**
- [`hashN`](#s-hashN) · function — **no importer in scanned roots**
- [`leanTrait`](#s-leanTrait) · function — **no importer in scanned roots**
- [`line`](#s-line) · function — used by [js/crew/children.js](children.js.md), [js/crew/family.js](family.js.md), [js/crew/talk-trees.js](talk-trees.js.md), [js/crew/talk.js](talk.js.md), test/systems.test.mjs
- [`byTrait`](#s-byTrait) · function — used by [js/crew/talk-trees.js](talk-trees.js.md)
- [`wrap`](#s-wrap) · function — used by [js/crew/children.js](children.js.md), [js/crew/family.js](family.js.md), [js/crew/talk.js](talk.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-TRAIT_KEYS"></a>`TRAIT_KEYS`

const · L5–5

<!-- note:TRAIT_KEYS -->
<!-- /note -->

### <a id="s-hashN"></a>`hashN(s, n)`

function · **exported** · L7–12

- called by: [`line`](#s-line)

<!-- note:hashN -->
<!-- /note -->

### <a id="s-leanTrait"></a>`leanTrait(t=)`

function · **exported** · L14–21

- called by: [`byTrait`](#s-byTrait)

<!-- note:leanTrait -->
<!-- /note -->

### <a id="s-line"></a>`line(bags, seed, fallback=)`

function · **exported** · L23–30

- calls: [`hashN`](#s-hashN)
- called by: [`raise`](children.js.md#s-raise) _js/crew/children.js_ · [`crewTopics.run~2`](family.js.md#s-crewTopics-run-2) _js/crew/family.js_ · [`crewTopics.run~3`](family.js.md#s-crewTopics-run-3) _js/crew/family.js_ ×2 · [`crewTopics.run~4`](family.js.md#s-crewTopics-run-4) _js/crew/family.js_ · [`crewTopics.run~5`](family.js.md#s-crewTopics-run-5) _js/crew/family.js_ ×2 · [`crewTopics.run~9`](family.js.md#s-crewTopics-run-9) _js/crew/family.js_ ×3 · [`greetLine`](family.js.md#s-greetLine) _js/crew/family.js_ ×4 · [`TREE.say`](talk-trees.js.md#s-TREE-say) _js/crew/talk-trees.js_ ×2 · [`TREE.say.say`](talk-trees.js.md#s-TREE-say-say) _js/crew/talk-trees.js_ · [`TREE.say.say~2`](talk-trees.js.md#s-TREE-say-say-2) _js/crew/talk-trees.js_ · [`TREE.say.say~3`](talk-trees.js.md#s-TREE-say-say-3) _js/crew/talk-trees.js_ · [`TREE.say~11`](talk-trees.js.md#s-TREE-say-11) _js/crew/talk-trees.js_ · [`TREE.say~11.say`](talk-trees.js.md#s-TREE-say-11-say) _js/crew/talk-trees.js_ · [`TREE.say~11.say~2`](talk-trees.js.md#s-TREE-say-11-say-2) _js/crew/talk-trees.js_ · [`TREE.say~12`](talk-trees.js.md#s-TREE-say-12) _js/crew/talk-trees.js_ · [`TREE.say~12.say`](talk-trees.js.md#s-TREE-say-12-say) _js/crew/talk-trees.js_ · [`TREE.say~12.say~2`](talk-trees.js.md#s-TREE-say-12-say-2) _js/crew/talk-trees.js_ · [`TREE.say~13`](talk-trees.js.md#s-TREE-say-13) _js/crew/talk-trees.js_ ×3 · [`TREE.say~14`](talk-trees.js.md#s-TREE-say-14) _js/crew/talk-trees.js_ · [`TREE.say~15`](talk-trees.js.md#s-TREE-say-15) _js/crew/talk-trees.js_ ×2 · [`TREE.say~16`](talk-trees.js.md#s-TREE-say-16) _js/crew/talk-trees.js_ · [`answerFreeText`](talk.js.md#s-answerFreeText) _js/crew/talk.js_ ×15 · [`byTrait`](#s-byTrait)

<!-- note:line -->
Pick one line from a bag. `bags` may be a key or a list of keys (first hit).
<!-- /note -->

### <a id="s-byTrait"></a>`byTrait(prefix, t, seed, fallback=)`

function · **exported** · L32–35

- calls: [`leanTrait`](#s-leanTrait) · [`line`](#s-line)
- called by: [`TREE.say~2`](talk-trees.js.md#s-TREE-say-2) _js/crew/talk-trees.js_ ×2

<!-- note:byTrait -->
Trait-flavoured pick: tries `${prefix}_${trait}` then `${prefix}_else` then prefix.
<!-- /note -->

### <a id="s-wrap"></a>`wrap(name, text)`

function · **exported** · L37–43

- called by: [`raise`](children.js.md#s-raise) _js/crew/children.js_ · [`crewTopics.run~3`](family.js.md#s-crewTopics-run-3) _js/crew/family.js_ ×2 · [`crewTopics.run~4`](family.js.md#s-crewTopics-run-4) _js/crew/family.js_ · [`crewTopics.run~5`](family.js.md#s-crewTopics-run-5) _js/crew/family.js_ ×2 · [`crewTopics.run~9`](family.js.md#s-crewTopics-run-9) _js/crew/family.js_ ×3 · [`greetLine`](family.js.md#s-greetLine) _js/crew/family.js_ ×4

<!-- note:wrap -->
<!-- /note -->
