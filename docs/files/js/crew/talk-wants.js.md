# js/crew/talk-wants.js

[index](../../../README.md) · 107 lines · 12 symbols · 4 imports · 1 importers

## About

<!-- note:@file -->
Living Galaxy — the topics a hand brings to YOU.

Every other topic in the tree is the captain opening a subject. These three
come the other way: a hand decided something on their own watch (deckmind),
and now it is on the board to be dealt with.

  wants — they asked for a word. Either a grievance (wages, or the state of
          the hull) or something they will not put in the log. Hearing them
          out costs a minute and buys trust; brushing it off does the
          opposite, and the grievance does not go away.
  watch — "how has your watch been?" reads their last filed decision back
          in their own words, including the reason they gave for it.
  blood — if the ledger says somebody aboard is family, they know.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./ledger.js` | `crew`, `firstName`, `relatedTo` | [js/crew/ledger.js](ledger.js.md) |
| 2 | `./duties.js` | `wearLine` | [js/crew/duties.js](duties.js.md) |
| 3 | `./journal.js` | `journal` | [js/crew/journal.js](journal.js.md) |
| 4 | `../genome/spacer.js` | `kinLabel` | [js/genome/spacer.js](../genome/spacer.js.md) |

## Imported by

- [js/crew/talk.js](talk.js.md) — `WANT_TOPICS`

## Exports

- [`WANT_TOPICS`](#s-WANT_TOPICS) · const — used by [js/crew/talk.js](talk.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-cap"></a>`cap(s)`

function · L6–6

- called by: [`WANT_TOPICS.say`](#s-WANT_TOPICS-say) · [`WANT_TOPICS.say~2`](#s-WANT_TOPICS-say-2) ×3 · [`WANT_TOPICS.say~3`](#s-WANT_TOPICS-say-3)

<!-- note:cap -->
<!-- /note -->

### <a id="s-WANT_TOPICS"></a>`WANT_TOPICS`

const · **exported** · L8–107

<!-- note:WANT_TOPICS -->
<!-- /note -->

#### <a id="s-WANT_TOPICS-label"></a>`WANT_TOPICS.label(m)`

prop · L11–11

<!-- note:WANT_TOPICS.label -->
<!-- /note -->

#### <a id="s-WANT_TOPICS-when"></a>`WANT_TOPICS.when(m)`

prop · L14–14

<!-- note:WANT_TOPICS.when -->
<!-- /note -->

#### <a id="s-WANT_TOPICS-say"></a>`WANT_TOPICS.say(m, c)`

prop · L15–31

- calls: [`wearLine`](duties.js.md#s-wearLine) _js/crew/duties.js_ · [`cap`](#s-cap)

<!-- note:WANT_TOPICS.say -->
<!-- /note -->

#### <a id="s-WANT_TOPICS-reply"></a>`WANT_TOPICS.reply(m, choiceId)`

prop · L32–39

<!-- note:WANT_TOPICS.reply -->
<!-- /note -->

#### <a id="s-WANT_TOPICS-when-2"></a>`WANT_TOPICS.when~2(m)`

prop · L46–46

- via [js/crew/journal.js](journal.js.md): `journal.last`

<!-- note:WANT_TOPICS.when~2 -->
<!-- /note -->

#### <a id="s-WANT_TOPICS-say-2"></a>`WANT_TOPICS.say~2(m, c)`

prop · L47–64

- calls: [`cap`](#s-cap) ×3
- via [js/crew/journal.js](journal.js.md): `journal.last`

<!-- note:WANT_TOPICS.say~2 -->
- L50 · `const chain = r.whatMadeMeActThis.reasoning;` — the last line of a trace is the commitment ("committed to EXERCISE");
  the one before it is the reason a person would actually give
<!-- /note -->

#### <a id="s-WANT_TOPICS-reply-2"></a>`WANT_TOPICS.reply~2(m, choiceId)`

prop · L65–78

- via [js/crew/journal.js](journal.js.md): `journal.last`

<!-- note:WANT_TOPICS.reply~2 -->
<!-- /note -->

#### <a id="s-WANT_TOPICS-when-3"></a>`WANT_TOPICS.when~3(m)`

prop · L85–85

- calls: [`relatedTo`](ledger.js.md#s-relatedTo) _js/crew/ledger.js_
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.some`

<!-- note:WANT_TOPICS.when~3 -->
<!-- /note -->

#### <a id="s-WANT_TOPICS-say-3"></a>`WANT_TOPICS.say~3(m, c)`

prop · L86–100

- calls: [`relatedTo`](ledger.js.md#s-relatedTo) _js/crew/ledger.js_ ×2 · [`cap`](#s-cap) · [`kinLabel`](../genome/spacer.js.md#s-kinLabel) _js/genome/spacer.js_
- via [js/crew/ledger.js](ledger.js.md): `crew.aboard.filter`, `crew.aboard.filter.map`, `….filter.map.sort`

<!-- note:WANT_TOPICS.say~3 -->
<!-- /note -->

#### <a id="s-WANT_TOPICS-reply-3"></a>`WANT_TOPICS.reply~3(m, choiceId)`

prop · L101–105

- calls: [`firstName`](ledger.js.md#s-firstName) _js/crew/ledger.js_

<!-- note:WANT_TOPICS.reply~3 -->
<!-- /note -->
