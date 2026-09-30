# js/comms/chat.js

[index](../../../README.md) · 43 lines · 9 symbols · 0 imports · 9 importers

## About

<!-- note:@file -->
LIVING GALAXY — the chat bus.

One stream for everything said to you or near you: the open channel (NPC
chatter from the speech band), GNN bulletins (auto-accepted — they never
ring the puck), your drones' reports, and system lines. Each message can
carry links — "GNN desk", "Mark it", "Set up MINER-01" — that run an
action when tapped.

The bus is the data layer the new HUD's chatbox renders (see ui-demos/).
Until that HUD lands, the comms ticker and the flight log mirror it, and
CMD › COMMS › Channel log lists it.

  post({ channel, from, text, links, tone })   → message
  onChat(fn)                                    → unsubscribe
  recent(n, channel)                            → last n messages

- L9 · `export const chat = { log: [], seq: 1, cap: 240, subs: new Set(), unread: {}, clock: () =>` — sim sets clock
<!-- /note -->

## Imports

_none_

## Imported by

- [js/aria/aria.js](../aria/aria.js.md) — `post`
- [js/comms/comms.js](comms.js.md) — `post`
- [js/comms/gnn.js](gnn.js.md) — `post`
- [js/drones/ops.js](../drones/ops.js.md) — `post`
- [js/mission/run.js](../mission/run.js.md) — `post`
- [js/sim/sim.js](../sim/sim.js.md) — `chat`, `post`, `resetChat`
- [js/station/stationlife.js](../station/stationlife.js.md) — `post`
- [js/ui/chatbox.js](../ui/chatbox.js.md) — `chat`, `CHANNELS`, `onChat`, `recent`, `markRead`, `follow`, `post`
- test/mission.test.mjs _(outside js/)_ — `chat`

## Exports

- [`CHANNELS`](#s-CHANNELS) · const — used by [js/ui/chatbox.js](../ui/chatbox.js.md)
- [`chat`](#s-chat) · const — used by [js/sim/sim.js](../sim/sim.js.md), [js/ui/chatbox.js](../ui/chatbox.js.md), test/mission.test.mjs
- [`post`](#s-post) · function — used by [js/aria/aria.js](../aria/aria.js.md), [js/comms/comms.js](comms.js.md), [js/comms/gnn.js](gnn.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/mission/run.js](../mission/run.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationlife.js](../station/stationlife.js.md), [js/ui/chatbox.js](../ui/chatbox.js.md)
- [`onChat`](#s-onChat) · function — used by [js/ui/chatbox.js](../ui/chatbox.js.md)
- [`recent`](#s-recent) · function — used by [js/ui/chatbox.js](../ui/chatbox.js.md)
- [`markRead`](#s-markRead) · function — used by [js/ui/chatbox.js](../ui/chatbox.js.md)
- [`follow`](#s-follow) · function — used by [js/ui/chatbox.js](../ui/chatbox.js.md)
- [`resetChat`](#s-resetChat) · function — used by [js/sim/sim.js](../sim/sim.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-CHANNELS"></a>`CHANNELS`

const · **exported** · L1–7

<!-- note:CHANNELS -->
<!-- /note -->

### <a id="s-chat"></a>`chat`

const · **exported** · L9–9

<!-- note:chat -->
<!-- /note -->

#### <a id="s-chat-clock"></a>`chat.clock()`

prop · L9–9

<!-- note:chat.clock -->
<!-- /note -->

### <a id="s-post"></a>`post({…}=)`

function · **exported** · L11–19

- called by: [`ariaRelease`](../aria/aria.js.md#s-ariaRelease) _js/aria/aria.js_ · [`ariaTakeConn`](../aria/aria.js.md#s-ariaTakeConn) _js/aria/aria.js_ · [`wireAriaHooks`](../aria/aria.js.md#s-wireAriaHooks) _js/aria/aria.js_ · [`stepChatter`](comms.js.md#s-stepChatter) _js/comms/comms.js_ · [`gnnPost`](gnn.js.md#s-gnnPost) _js/comms/gnn.js_ · [`orderBuild`](../drones/ops.js.md#s-orderBuild) _js/drones/ops.js_ · [`rollOff`](../drones/ops.js.md#s-rollOff) _js/drones/ops.js_ · [`say`](../drones/ops.js.md#s-say) _js/drones/ops.js_ · [`scrapDrone`](../drones/ops.js.md#s-scrapDrone) _js/drones/ops.js_ · [`beginAsk`](../mission/run.js.md#s-beginAsk) _js/mission/run.js_ · [`log`](../sim/sim.js.md#s-log) _js/sim/sim.js_ · [`kill`](../station/stationlife.js.md#s-kill) _js/station/stationlife.js_ · [`send`](../ui/chatbox.js.md#s-send) _js/ui/chatbox.js_ ×4

<!-- note:post -->
Post a message. `links`: [{ label, run }] — run() is called when it is tapped.

- L17 · `for (const fn of chat.subs) { try { fn(m); } catch {` — a bad listener is not the bus's problem
<!-- /note -->

### <a id="s-onChat"></a>`onChat(fn)`

function · **exported** · L21–21

- called by: [`mountChatbox`](../ui/chatbox.js.md#s-mountChatbox) _js/ui/chatbox.js_

<!-- note:onChat -->
<!-- /note -->

### <a id="s-recent"></a>`recent(n=, channel=)`

function · **exported** · L23–26

- called by: [`mountChatbox`](../ui/chatbox.js.md#s-mountChatbox) _js/ui/chatbox.js_ · [`paintLog`](../ui/chatbox.js.md#s-paintLog) _js/ui/chatbox.js_

<!-- note:recent -->
<!-- /note -->

### <a id="s-markRead"></a>`markRead(channel=)`

function · **exported** · L28–31

- called by: [`mountChatbox`](../ui/chatbox.js.md#s-mountChatbox) _js/ui/chatbox.js_ · [`paintTabs`](../ui/chatbox.js.md#s-paintTabs) _js/ui/chatbox.js_ · [`setSize`](../ui/chatbox.js.md#s-setSize) _js/ui/chatbox.js_

<!-- note:markRead -->
<!-- /note -->

### <a id="s-follow"></a>`follow(m, i=)`

function · **exported** · L33–38

- called by: [`row`](../ui/chatbox.js.md#s-row) _js/ui/chatbox.js_

<!-- note:follow -->
Run a message's link by index (the chatbox and the deck both call this).
<!-- /note -->

### <a id="s-resetChat"></a>`resetChat()`

function · **exported** · L40–43

- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:resetChat -->
<!-- /note -->
