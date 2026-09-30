# js/npc/chat.js

[index](../../../README.md) · 132 lines · 20 symbols · 0 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY — NPC chat, separated from the speech engine that drives it.

0.3.23. Until now "what an NPC says" and "how the band decides who says it"
were the same file: js/npc/speech.js built the band, chose the pair, chose
the topic, and handed the speech engine's own words straight to the comms
log. There was no seam — so no pack, no mod and no addon could give a hull
a different voice without editing core.

This is the seam. The ENGINE still decides who speaks, to whom, about what,
on which channel, and what it means for regard and standing — all of that is
the simulation and stays in core. A VOICE PROVIDER only gets the finished
beat and may re-word it:

  { id, rating, priority, channels, roles, topics,
    line(beat)   → string | null     re-word one line of an exchange
    reply(beat)  → string | null     re-word an answer to something you said
    chips(u, t)  → [{label, text}]   extra things you can say to this hull }

A provider that returns null (or throws) declines and the core words stand,
so a broken pack degrades to vanilla instead of to silence.

RATING is the gate, and it is off by default. A provider declares the rating
it writes at; nothing above the rating the player has set is ever consulted.
"core" is the vanilla band. Anything higher is opt-in, is remembered per
device, and — because the open channel is a public room — may only dress the
channels it is allowed to: an adult provider is confined to `direct`, the
one-to-one call you opened yourself, and never to open-band chatter.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/npc/speech.js](speech.js.md) — `dressLine`, `dressReply`, `extraChips`, `loadChatRating`
- [js/ui/hud.js](../ui/hud.js.md) — `wireNpcChat`
- test/npcchat.test.mjs _(outside js/)_ — `npcChat`, `RATINGS`, `CHANNELS`, `registerVoice`, `unregisterVoice`, `clearVoices`, `voicesFor`, `dressLine`, `dressReply`, `extraChips`, `setChatRating`, `chatRating`, `chatReport`, `loadChatRating`
- addon/adult/npc.js _(outside js/)_ — `registerVoice`

## Exports

- [`RATINGS`](#s-RATINGS) · const — used by test/npcchat.test.mjs
- [`CHANNELS`](#s-CHANNELS) · const — used by test/npcchat.test.mjs
- [`npcChat`](#s-npcChat) · const — used by test/npcchat.test.mjs
- [`loadChatRating`](#s-loadChatRating) · function — used by [js/npc/speech.js](speech.js.md), test/npcchat.test.mjs
- [`setChatRating`](#s-setChatRating) · function — used by test/npcchat.test.mjs
- [`chatRating`](#s-chatRating) · function — used by test/npcchat.test.mjs
- [`registerVoice`](#s-registerVoice) · function — used by addon/adult/npc.js, test/npcchat.test.mjs
- [`unregisterVoice`](#s-unregisterVoice) · function — used by test/npcchat.test.mjs
- [`clearVoices`](#s-clearVoices) · function — used by test/npcchat.test.mjs
- [`voicesFor`](#s-voicesFor) · function — used by test/npcchat.test.mjs
- [`dressLine`](#s-dressLine) · function — used by [js/npc/speech.js](speech.js.md), test/npcchat.test.mjs
- [`dressReply`](#s-dressReply) · function — used by [js/npc/speech.js](speech.js.md), test/npcchat.test.mjs
- [`extraChips`](#s-extraChips) · function — used by [js/npc/speech.js](speech.js.md), test/npcchat.test.mjs
- [`chatReport`](#s-chatReport) · function — used by test/npcchat.test.mjs
- [`wireNpcChat`](#s-wireNpcChat) · function — used by [js/ui/hud.js](../ui/hud.js.md)

## Effects

- **storage.get** — `‹KEY›` (loadChatRating:22)
- **storage.set** — `‹KEY›` (persist:17)

## Symbols

### <a id="s-KEY"></a>`KEY`

const · L1–1

<!-- note:KEY -->
<!-- /note -->

### <a id="s-RATINGS"></a>`RATINGS`

const · **exported** · L3–3

<!-- note:RATINGS -->
Ratings in order. A provider is consulted only at or below the set rating.
<!-- /note -->

### <a id="s-rank"></a>`rank(r)`

function · L4–4

- called by: [`chatReport`](#s-chatReport) ×2 · [`registerVoice`](#s-registerVoice) ×2 · [`voicesFor`](#s-voicesFor) ×2

<!-- note:rank -->
<!-- /note -->

### <a id="s-CHANNELS"></a>`CHANNELS`

const · **exported** · L6–6

<!-- note:CHANNELS -->
Channels a provider may be handed. `open` is the band everyone hears.
<!-- /note -->

### <a id="s-ALLOWED"></a>`ALLOWED`

const · L8–8

<!-- note:ALLOWED -->
Which channels a rating is allowed to touch, whatever a provider asks for.
<!-- /note -->

### <a id="s-npcChat"></a>`npcChat`

const · **exported** · L10–14

<!-- note:npcChat -->
<!-- /note -->

### <a id="s-persist"></a>`persist()`

function · L16–18

- called by: [`setChatRating`](#s-setChatRating)
- effects: storage.set `‹KEY›`

<!-- note:persist -->
- L17 · `try { globalThis.localStorage?.setItem(KEY, npcChat.rating); } catch {` — private mode
<!-- /note -->

### <a id="s-loadChatRating"></a>`loadChatRating()`

function · **exported** · L20–26

- called by: [`wireNpcChat`](#s-wireNpcChat) · [`resetSpeech`](speech.js.md#s-resetSpeech) _js/npc/speech.js_
- effects: storage.get `‹KEY›`

<!-- note:loadChatRating -->
- L24 · `} catch {` — private mode
<!-- /note -->

### <a id="s-setChatRating"></a>`setChatRating(r)`

function · **exported** · L28–33

- calls: [`persist`](#s-persist)

<!-- note:setChatRating -->
The rating the band is allowed to speak at. Anything but "core" is opt-in.
<!-- /note -->

### <a id="s-chatRating"></a>`chatRating()`

function · **exported** · L34–34

<!-- note:chatRating -->
<!-- /note -->

### <a id="s-registerVoice"></a>`registerVoice(spec)`

function · **exported** · L36–54

- calls: [`rank`](#s-rank) ×2 · [`unregisterVoice`](#s-unregisterVoice) ×2

<!-- note:registerVoice -->
Register a voice. Returns a function that takes it off again, so a pack can
be unloaded at runtime. Re-registering the same id replaces it.
<!-- /note -->

### <a id="s-unregisterVoice"></a>`unregisterVoice(id)`

function · **exported** · L56–60

- called by: [`registerVoice`](#s-registerVoice) ×2

<!-- note:unregisterVoice -->
<!-- /note -->

### <a id="s-clearVoices"></a>`clearVoices()`

function · **exported** · L62–62

<!-- note:clearVoices -->
<!-- /note -->

### <a id="s-voicesFor"></a>`voicesFor(channel=, beat=)`

function · **exported** · L64–74

- calls: [`rank`](#s-rank) ×2
- called by: [`dressLine`](#s-dressLine) · [`dressReply`](#s-dressReply) · [`extraChips`](#s-extraChips)

<!-- note:voicesFor -->
Every provider that may speak on this channel right now, best first.
<!-- /note -->

### <a id="s-run"></a>`run(fn, v, beat)`

function · L76–88

- called by: [`dressLine`](#s-dressLine) · [`dressReply`](#s-dressReply)

<!-- note:run -->
<!-- /note -->

### <a id="s-dressLine"></a>`dressLine(beat)`

function · **exported** · L90–98

- calls: [`run`](#s-run) · [`voicesFor`](#s-voicesFor)
- called by: [`chatter`](speech.js.md#s-chatter) _js/npc/speech.js_

<!-- note:dressLine -->
Give the providers one line of an exchange. `beat` is everything a voice
could want: { text, channel, topic, move, frame, turn, speaker, listener,
role, register, regard, place, ref }. First one to answer wins; nobody
answering means the core words stand, which is the normal case.
<!-- /note -->

### <a id="s-dressReply"></a>`dressReply(beat)`

function · **exported** · L100–108

- calls: [`run`](#s-run) · [`voicesFor`](#s-voicesFor)
- called by: [`talkTo`](speech.js.md#s-talkTo) _js/npc/speech.js_

<!-- note:dressReply -->
The same, for an answer to something you said on a one-to-one call.
<!-- /note -->

### <a id="s-extraChips"></a>`extraChips(unit, turn=, channel=)`

function · **exported** · L110–119

- calls: [`voicesFor`](#s-voicesFor)
- called by: [`talkChips`](speech.js.md#s-talkChips) _js/npc/speech.js_

<!-- note:extraChips -->
Extra things a pack lets you say to this hull, appended to the core chips.
<!-- /note -->

### <a id="s-chatReport"></a>`chatReport()`

function · **exported** · L121–127

- calls: [`rank`](#s-rank) ×2

<!-- note:chatReport -->
For the console: what is speaking, and at what rating.
<!-- /note -->

### <a id="s-wireNpcChat"></a>`wireNpcChat()`

function · **exported** · L129–132

- calls: [`loadChatRating`](#s-loadChatRating)
- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:wireNpcChat -->
<!-- /note -->
