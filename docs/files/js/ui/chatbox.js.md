# js/ui/chatbox.js

[index](../../../README.md) · 158 lines · 15 symbols · 7 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — the chatbox.

Sits where the thumbstick was (the nose is steered by dragging the sky).
One stream over chat.js: the open channel (speech band), GNN bulletins,
your drones' reports, ship notices — with tabs, unread badges and the
tappable links each message carries. What you type goes out on the band:
to the live call if one is up, otherwise to the nearest hull or port in
reach, answered in character by the speech engine.

- L14 · `export const chatbox = { channel: "all", size: 0, root: null, seen: 0 };` — size: 0 folded to the input · 1 open · 2 tall
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../comms/chat.js` | `chat`, `CHANNELS`, `onChat`, `recent`, `markRead`, `follow`, `post` | [js/comms/chat.js](../comms/chat.js.md) |
| 2 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 3 | `../station/stations.js` | `stations` | [js/station/stations.js](../station/stations.js.md) |
| 4 | `../flight/turrets.js` | `contacts` | [js/flight/turrets.js](../flight/turrets.js.md) |
| 5 | `../npc/traffic.js` | `traffic` | [js/npc/traffic.js](../npc/traffic.js.md) |
| 6 | `../npc/speech.js` | `talkTo`, `SPEECH_RANGE` | [js/npc/speech.js](../npc/speech.js.md) |
| 7 | `../comms/comms.js` | `comms` | [js/comms/comms.js](../comms/comms.js.md) |

## Imported by

- [js/ui/hud.js](hud.js.md) — `mountChatbox`

## Exports

- [`chatbox`](#s-chatbox) · const — **no importer in scanned roots**
- [`mountChatbox`](#s-mountChatbox) · function — used by [js/ui/hud.js](hud.js.md)

## Effects

- **dom.create** — `‹tag›` (el:11)
- **dom.id** — `‹id›` ($:10) · `cb-unread` (paintUnread:38, mountChatbox:118) · `cb-unread-n` (paintUnread:38) · `cb-fold` (paintUnread:44, mountChatbox:119) · `hud` (setSize:48) · `cb-tabs` (paintTabs:57) · `cb-log` (paintLog:71, mountChatbox:132, mountChatbox:154) · `cb-in` (send:97, mountChatbox:119, mountChatbox:120, mountChatbox:122, mountChatbox:123) · `chatbox` (mountChatbox:113) · `cb-toggle` (mountChatbox:117) · `cb-send` (mountChatbox:121) · `‹b.dataset.proxy›` (mountChatbox:125, mountChatbox:147) · `‹b.dataset.proxySt›` (mountChatbox:144)
- **dom.query** — `[data-proxy]` (mountChatbox:124) · `.cb-empty` (mountChatbox:134) · `small` (mountChatbox:145) · `.warp-state` (mountChatbox:145) · `.cb-when` (mountChatbox:154)
- **event.listen** — `click on b → (inline)` (row:27, paintTabs:65, mountChatbox:125) · `pointerdown on root → (inline)` (mountChatbox:116) · `click on $() → (inline)` (mountChatbox:117, mountChatbox:118, mountChatbox:119) · `focus on $() → (inline)` (mountChatbox:120) · `click on $() → send` (mountChatbox:121) · `keydown on $() → (inline)` (mountChatbox:122) · `keyup on $() → (inline)` (mountChatbox:123)
- **input.key** — `Enter` (mountChatbox:122)
- **timer** — `setTimeout` (send:105, mountChatbox:129, mountChatbox:139)

## Symbols

### <a id="s-TABS"></a>`TABS`

const · L9–9

<!-- note:TABS -->
<!-- /note -->

### <a id="s-S"></a>`$(id)`

function · L10–10

- called by: [`mountChatbox`](#s-mountChatbox) ×14 · [`paintLog`](#s-paintLog) · [`paintTabs`](#s-paintTabs) · [`paintUnread`](#s-paintUnread) ×3 · [`send`](#s-send) · [`setSize`](#s-setSize)
- effects: dom.id `‹id›`

<!-- note:$ -->
<!-- /note -->

### <a id="s-el"></a>`el(tag, cls, text)`

function · L11–11

- called by: [`paintLog`](#s-paintLog) · [`paintTabs`](#s-paintTabs) ×2 · [`row`](#s-row) ×8
- effects: dom.create `‹tag›`

<!-- note:el -->
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L12–12

- called by: [`target`](#s-target) ×2

<!-- note:d3 -->
<!-- /note -->

### <a id="s-chatbox"></a>`chatbox`

const · **exported** · L14–14

<!-- note:chatbox -->
<!-- /note -->

### <a id="s-ago"></a>`ago(at)`

function · L16–16

- called by: [`mountChatbox`](#s-mountChatbox) · [`row`](#s-row)

<!-- note:ago -->
<!-- /note -->

### <a id="s-row"></a>`row(m)`

function · L18–31

- calls: [`follow`](../comms/chat.js.md#s-follow) _js/comms/chat.js_ · [`ago`](#s-ago) · [`el`](#s-el) ×8
- called by: [`mountChatbox`](#s-mountChatbox) · [`paintLog`](#s-paintLog)
- effects: event.listen `click`

<!-- note:row -->
<!-- /note -->

### <a id="s-unreadHere"></a>`unreadHere()`

function · L33–36

- called by: [`paintUnread`](#s-paintUnread)

<!-- note:unreadHere -->
unread on the open tab: "All" counts every channel
<!-- /note -->

### <a id="s-paintUnread"></a>`paintUnread()`

function · L37–45

- calls: [`$`](#s-S) ×3 · [`unreadHere`](#s-unreadHere)
- called by: [`mountChatbox`](#s-mountChatbox) · [`setSize`](#s-setSize)
- effects: dom.id `cb-unread` · dom.id `cb-unread-n` · dom.id `cb-fold`

<!-- note:paintUnread -->
<!-- /note -->

### <a id="s-setSize"></a>`setSize(size)`

function · L46–54

- calls: [`markRead`](../comms/chat.js.md#s-markRead) _js/comms/chat.js_ · [`$`](#s-S) · [`paintLog`](#s-paintLog) · [`paintTabs`](#s-paintTabs) · [`paintUnread`](#s-paintUnread)
- called by: [`mountChatbox`](#s-mountChatbox) ×5
- effects: dom.id `hud`

<!-- note:setSize -->
<!-- /note -->

### <a id="s-paintTabs"></a>`paintTabs()`

function · L56–68

- calls: [`markRead`](../comms/chat.js.md#s-markRead) _js/comms/chat.js_ · [`$`](#s-S) · [`el`](#s-el) ×2 · [`paintLog`](#s-paintLog) · [`paintTabs`](#s-paintTabs)
- called by: [`mountChatbox`](#s-mountChatbox) ×3 · [`paintTabs`](#s-paintTabs) · [`setSize`](#s-setSize)
- effects: dom.id `cb-tabs` · event.listen `click`

<!-- note:paintTabs -->
<!-- /note -->

### <a id="s-paintLog"></a>`paintLog()`

function · L70–78

- calls: [`recent`](../comms/chat.js.md#s-recent) _js/comms/chat.js_ · [`$`](#s-S) · [`el`](#s-el) · [`row`](#s-row)
- called by: [`mountChatbox`](#s-mountChatbox) · [`paintTabs`](#s-paintTabs) · [`setSize`](#s-setSize)
- effects: dom.id `cb-log`

<!-- note:paintLog -->
<!-- /note -->

### <a id="s-target"></a>`target()`

function · L80–94

- calls: [`d3`](#s-d3) ×2
- via [js/npc/traffic.js](../npc/traffic.js.md): `traffic.find`
- called by: [`send`](#s-send)

<!-- note:target -->
Who a typed line reaches: the live call, else the nearest hull or port in speech range.

- L90 · `best = { entity: n, kind: "vessel", name: n?.captain || c.name, hull: c.name };` — the person, not the hull: the band labels a voice by who is flying, and
  a reply to you that used the hull name made the same ship look like two
  different contacts in the same log
<!-- /note -->

### <a id="s-send"></a>`send()`

function · L96–110

- calls: [`post`](../comms/chat.js.md#s-post) _js/comms/chat.js_ ×4 · [`talkTo`](../npc/speech.js.md#s-talkTo) _js/npc/speech.js_ · [`$`](#s-S) · [`target`](#s-target)
- called by: [`mountChatbox`](#s-mountChatbox)
- effects: dom.id `cb-in` · timer `setTimeout`

<!-- note:send -->
- L108 · `post({ channel: "local", from: r.speaker || t.name, text: r.text, tone: t.entity?.sector =` — talkTo hands back the band's own label for this voice — use it, so a
  reply and the same voice's chatter carry one name
<!-- /note -->

### <a id="s-mountChatbox"></a>`mountChatbox()`

function · **exported** · L112–158

- calls: [`markRead`](../comms/chat.js.md#s-markRead) _js/comms/chat.js_ · [`onChat`](../comms/chat.js.md#s-onChat) _js/comms/chat.js_ · [`recent`](../comms/chat.js.md#s-recent) _js/comms/chat.js_ · [`$`](#s-S) ×14 · [`ago`](#s-ago) · [`paintLog`](#s-paintLog) · [`paintTabs`](#s-paintTabs) ×3 · [`paintUnread`](#s-paintUnread) · [`row`](#s-row) · [`send`](#s-send) · [`setSize`](#s-setSize) ×5
- via [js/comms/chat.js](../comms/chat.js.md): `recent.entries`
- called by: [`mountHud`](hud.js.md#s-mountHud) _js/ui/hud.js_
- effects: dom.id `chatbox` · event.listen `pointerdown` · event.listen `click` · dom.id `cb-toggle` · dom.id `cb-unread` · dom.id `cb-fold` · dom.id `cb-in` · event.listen `focus` · dom.id `cb-send` · event.listen `keydown` · input.key `Enter` · event.listen `keyup` · dom.query `[data-proxy]` · dom.id `‹b.dataset.proxy›` · timer `setTimeout` · dom.id `cb-log` · dom.query `.cb-empty` · dom.id `‹b.dataset.proxySt›` · dom.query `small` · dom.query `.warp-state` · dom.query `.cb-when`

<!-- note:mountChatbox -->
- L117 · `$("cb-toggle")?.addEventListener("click", () => setSize((chatbox.size + 1) % 3));` — the toggle cycles folded → open → tall → folded; the unread badge opens it
- L124 · `const proxies = [...document.querySelectorAll("[data-proxy]")];` — Proxies for controls that live on the retired dash pages: tap the visible
  one, the real button gets the click, and its status text is mirrored here
  each paint. The APPROACH bar is the live user (index.html); the DOCK and
  HAIL side keys were removed in 0.3.07 — not because the mechanism failed,
  but because `.side-keys` was painted UNDER the 3D canvas, so every tap on
  them went to the sky instead. Anything added here needs to sit in a
  stacking context above #view or it will be dead in exactly the same way.
- L150 · `const now = performance.now();` — every ~10 s the ages tick over
<!-- /note -->
