# js/net/net.js

[index](../../../README.md) · 251 lines · 31 symbols · 2 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY — the wire between pilots.

server.py carries a tiny relay (POST /net/send, GET /net/poll). This client
plugs it into the hooks sim.js already exposes:

  sim.broadcast(d)    → ship state, throttled to RATE_HZ
  sim.send(d, id)     → reliable message (beacon, scan, comms) to one pilot or all
  applyRemoteState    ← other pilots' hulls, which become "peer" contacts
  applyReliable       ← their beacons and surveys
  onMessage(from, d)  ← anything else (comms.js listens here for hails)

Plain fetch polling, no sockets: it works from Termux over Wi-Fi and it
survives the phone browser suspending the tab. When the server has no
relay (a static host) the first poll fails and the client goes quiet.

- L15 · `const NO_RELAY_MS = 30000;` — a static host (404/405 on the relay routes): look again rarely…
- L16 · `const NO_RELAY_MAX_MS = 600000;` — …and more rarely each time it still is not there (30 s, 1, 2, 4, 8, then every 10 min)
- L42 · `let pollGen = 0;` — bumped by connect/disconnect: a poll answered from before it is dropped
- L248 · `globalThis.document?.addEventListener("visibilitychange", () => {` — The tab going to sleep should not leave a ghost on everybody's sensors:
  the relay expires us on its own, but polling stops the moment we wake.
- L249 · `clearTimeout(pollTimer);` — a poll that lands while hidden does not reschedule (see finally); one chain, not two
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `applyReliable`, `applyRemoteState`, `dropRemote`, `shiftClock`, `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../core/store.js` | `useGameStore` | [js/core/store.js](../core/store.js.md) |

## Imported by

- [js/comms/comms.js](../comms/comms.js.md) — `net`, `onMessage`
- [js/net/worldsync.js](worldsync.js.md) — `fetchWorld`, `lonely`, `net`, `onMessage`, `onRoom`, `pushWorld`
- [js/ui/hud.js](../ui/hud.js.md) — `connectNet`, `disconnectNet`, `primeSol`
- test/solprime.test.mjs _(outside js/)_ — `primeSol`

## Exports

- [`net`](#s-net) · const — used by [js/comms/comms.js](../comms/comms.js.md), [js/net/worldsync.js](worldsync.js.md)
- [`lonely`](#s-lonely) · function — used by [js/net/worldsync.js](worldsync.js.md)
- [`onMessage`](#s-onMessage) · function — used by [js/comms/comms.js](../comms/comms.js.md), [js/net/worldsync.js](worldsync.js.md)
- [`onRoom`](#s-onRoom) · function — used by [js/net/worldsync.js](worldsync.js.md)
- [`fetchWorld`](#s-fetchWorld) · function — used by [js/net/worldsync.js](worldsync.js.md)
- [`primeSol`](#s-primeSol) · function — used by [js/ui/hud.js](../ui/hud.js.md), test/solprime.test.mjs
- [`pushWorld`](#s-pushWorld) · function — used by [js/net/worldsync.js](worldsync.js.md)
- [`connectNet`](#s-connectNet) · function — used by [js/ui/hud.js](../ui/hud.js.md)
- [`disconnectNet`](#s-disconnectNet) · function — used by [js/ui/hud.js](../ui/hud.js.md)

## Effects

- **event.handler** — `net.online` (noRelay:66, poll:141, poll:197, disconnectNet:243)
- **event.listen** — `visibilitychange on globalThis.document → (inline)` (@file:248)
- **net.fetch** — `/net/send POST` (post:74) · `/net/world?${…}` (fetchWorld:91) · `/net/world?room=sol` (primeSol:100) · `/net/world POST` (pushWorld:118) · `/net/poll?${…}` (poll:132)
- **storage.get** — `lgaa-net-id` (selfId:48)
- **storage.set** — `lgaa-net-id` (selfId:54)
- **timer** — `setTimeout` (primeSol:98, poll:206)

## Symbols

### <a id="s-RATE_HZ"></a>`RATE_HZ`

const · L4–4

<!-- note:RATE_HZ -->
<!-- /note -->

### <a id="s-POLL_MS"></a>`POLL_MS`

const · L5–5

<!-- note:POLL_MS -->
<!-- /note -->

### <a id="s-LONELY_HZ"></a>`LONELY_HZ`

const · L6–6

<!-- note:LONELY_HZ -->
alone in the room: nobody reads the state stream, so keep a heartbeat (the relay drops a pilot
after STATE_TTL 6 s) and look for company once a second instead of five times
<!-- /note -->

### <a id="s-CLOCK_DEAD"></a>`CLOCK_DEAD`

const · L7–7

<!-- note:CLOCK_DEAD -->
The shared-clock chase (see the poll handler). A quarter of a second is
below anything a pilot can perceive in a timetable and well inside one
poll's jitter; the ramp means a badly drifted client closes fast and a
nearly-synced one is nudged.
<!-- /note -->

### <a id="s-CLOCK_GAIN_MIN"></a>`CLOCK_GAIN_MIN`

const · L8–8

<!-- note:CLOCK_GAIN_MIN -->
<!-- /note -->

### <a id="s-CLOCK_GAIN_RAMP"></a>`CLOCK_GAIN_RAMP`

const · L9–9

<!-- note:CLOCK_GAIN_RAMP -->
<!-- /note -->

### <a id="s-CLOCK_GAIN_MAX"></a>`CLOCK_GAIN_MAX`

const · L10–10

<!-- note:CLOCK_GAIN_MAX -->
<!-- /note -->

### <a id="s-LONELY_POLL_MS"></a>`LONELY_POLL_MS`

const · L12–12

<!-- note:LONELY_POLL_MS -->
<!-- /note -->

### <a id="s-LONELY_AFTER_MS"></a>`LONELY_AFTER_MS`

const · L13–13

<!-- note:LONELY_AFTER_MS -->
<!-- /note -->

### <a id="s-BACKOFF_MS"></a>`BACKOFF_MS`

const · L14–14

<!-- note:BACKOFF_MS -->
<!-- /note -->

### <a id="s-NO_RELAY_MS"></a>`NO_RELAY_MS`

const · L15–15

<!-- note:NO_RELAY_MS -->
<!-- /note -->

### <a id="s-NO_RELAY_MAX_MS"></a>`NO_RELAY_MAX_MS`

const · L16–16

<!-- note:NO_RELAY_MAX_MS -->
<!-- /note -->

### <a id="s-noRelayMisses"></a>`noRelayMisses`

const · L17–17

<!-- note:noRelayMisses -->
<!-- /note -->

### <a id="s-net"></a>`net`

const · **exported** · L19–35

<!-- note:net -->
- L24 · `lonelySince: 0,` — performance.now() when the room last went empty of others; 0 = someone is here
- L27 · `relay: null,` — false once the server answered 404/405 on a relay route — a plain file
  server. Nothing is sent until a later poll finds the relay; the console
  gets one line, not one per state packet.
- L30 · `host: false,` — the held sky: who runs the rocks
<!-- /note -->

### <a id="s-pollTimer"></a>`pollTimer`

const · L37–37

<!-- note:pollTimer -->
<!-- /note -->

### <a id="s-lastSend"></a>`lastSend`

const · L38–38

<!-- note:lastSend -->
<!-- /note -->

### <a id="s-lonely"></a>`lonely()`

function · **exported** · L39–39

- called by: [`connectNet`](#s-connectNet) · [`poll`](#s-poll) · [`tickWorldSync`](worldsync.js.md#s-tickWorldSync) _js/net/worldsync.js_

<!-- note:lonely -->
<!-- /note -->

### <a id="s-inflight"></a>`inflight`

const · L40–40

<!-- note:inflight -->
<!-- /note -->

### <a id="s-stopped"></a>`stopped`

const · L41–41

<!-- note:stopped -->
<!-- /note -->

### <a id="s-pollGen"></a>`pollGen`

const · L42–42

<!-- note:pollGen -->
<!-- /note -->

### <a id="s-selfId"></a>`selfId()`

function · L44–61

- called by: [`poll`](#s-poll) ×2 · [`post`](#s-post) · [`pushWorld`](#s-pushWorld)
- effects: storage.get `lgaa-net-id` · storage.set `lgaa-net-id`

<!-- note:selfId -->
- L49 · `}` — private mode
- L49 · `}` — ignore
<!-- /note -->

### <a id="s-noRelay"></a>`noRelay(status, path)`

function · L63–68

- called by: [`poll`](#s-poll) · [`post`](#s-post)
- effects: event.handler `net.online`

<!-- note:noRelay -->
<!-- /note -->

### <a id="s-post"></a>`post(kind, data, to)`

function · async · L70–77

- calls: [`noRelay`](#s-noRelay) · [`selfId`](#s-selfId)
- called by: [`connectNet`](#s-connectNet) ×2
- effects: net.fetch `/net/send`

<!-- note:post -->
- L71 · `if (net.relay === false) return;` — static host: nobody is listening
- L72 · `if (kind === "state" && !net.online) return;` — relay unreachable: state is throwaway, do not queue 5 Hz of it
<!-- /note -->

### <a id="s-onMessage"></a>`onMessage(fn)`

function · **exported** · L79–82

- called by: [`mountComms`](../comms/comms.js.md#s-mountComms) _js/comms/comms.js_ · [`mountWorldSync`](worldsync.js.md#s-mountWorldSync) _js/net/worldsync.js_

<!-- note:onMessage -->
Anything not a ship state or a beacon lands here (comms hails, lines, …).
<!-- /note -->

### <a id="s-onRoom"></a>`onRoom(fn)`

function · **exported** · L84–87

- called by: [`mountWorldSync`](worldsync.js.md#s-mountWorldSync) _js/net/worldsync.js_

<!-- note:onRoom -->
Room facts after every poll: { host, hostId, wseq, wseqMoved, peers, fresh, offline }. worldsync.js listens.
<!-- /note -->

### <a id="s-fetchWorld"></a>`fetchWorld()`

function · async · **exported** · L89–94

- called by: [`pull`](worldsync.js.md#s-pull) _js/net/worldsync.js_
- effects: net.fetch `/net/world?${…}`

<!-- note:fetchWorld -->
The host's snapshot of the sky, or null.
<!-- /note -->

### <a id="s-primeSol"></a>`primeSol(timeoutMs=)`

function · async · **exported** · L96–114

- called by: [`mountHud>askSol`](../ui/hud.js.md#s-mountHud-askSol) _js/ui/hud.js_
- effects: timer `setTimeout` · net.fetch `/net/world?room=sol`

<!-- note:primeSol -->
0.3.73 — the shared Sol, asked for BEFORE its sky is built: the clock the room
is on and the state of its worlds. Entering Sol used to build the sky at time
0, then the first poll jumped the clock by the room's whole age (the sun and
every world swung to where they really are) and the first snapshot re-skinned
the worlds it had marked (Earth changed colour) — a second or two after the
pilot arrived. → { time, world, wseq, worldRevision, at } or null (no relay,
too slow, or not answering); the caller falls back to the old join.

- L105 · `const time = world && Number.isFinite(world.time)` — the same reading the relay gives a poll (server.py: solTime), so the chase that follows has nothing to correct
<!-- /note -->

### <a id="s-pushWorld"></a>`pushWorld(world)`

function · async · **exported** · L116–123

- calls: [`selfId`](#s-selfId)
- called by: [`tickWorldSync`](worldsync.js.md#s-tickWorldSync) _js/net/worldsync.js_
- effects: net.fetch `/net/world`

<!-- note:pushWorld -->
Host only: publish the sky.
<!-- /note -->

### <a id="s-poll"></a>`poll()`

function · async · L125–209

- calls: [`lonely`](#s-lonely) · [`noRelay`](#s-noRelay) · [`selfId`](#s-selfId) ×2 · [`applyReliable`](../sim/sim.js.md#s-applyReliable) _js/sim/sim.js_ · [`applyRemoteState`](../sim/sim.js.md#s-applyRemoteState) _js/sim/sim.js_ · [`dropRemote`](../sim/sim.js.md#s-dropRemote) _js/sim/sim.js_ ×2 · [`shiftClock`](../sim/sim.js.md#s-shiftClock) _js/sim/sim.js_ ×2
- via [js/sim/sim.js](../sim/sim.js.md): `sim.remotes.keys`, `sim.remotes.values`
- via [js/core/store.js](../core/store.js.md): `useGameStore.getState`, `useGameStore.getState.patchHud`
- called by: [`@file`](#) · [`connectNet`](#s-connectNet)
- effects: net.fetch `/net/poll?${…}` · event.handler `net.online` · timer `setTimeout`

<!-- note:poll -->
- L133 · `if (gen !== pollGen) return;` — reconnected while this was out: stale room
- L144 · `if (typeof j.born === "number" && net.worldBorn && j.born !== net.worldBorn) {` — 0.3.44 — THE ROOM WAS REBORN. A relay restart (a reboot, `--update`
  restarting lg-relay, the room swept after standing empty) starts the
  ring and its cursor over at zero, and `born` moves. A client still
  holding its old, larger cursor then asks for "everything after 4,812"
  of a ring that has seen three messages — and receives nothing, for
  every hail and beacon, until the new ring outgrows the old number.
  Measured: a pilot who stayed connected through a relay restart never
  got another message. So a moved `born` is a fresh join: take the new
  cursor, do not replay the ring, resync the clock from scratch.
- L153 · `if (typeof j.born === "number" && typeof j.now === "number") {` — shared world clock: the room was born when the first pilot joined it.
  every client chases that clock so the same slot fires the same event.
- L161 · `const off = shared - sim.time;` — CHASE THE ROOM'S CLOCK.
  
  A slow frame loop (dt is capped) lets the local clock fall behind
  the room's, so it has to be pulled back or timetables drift apart.
  
  0.3.37 — this had three faults, and together they desynced a shared
  sky by whole seconds:
  
    The dead zone was 2.5 s PER CLIENT. Nothing corrected inside it,
    so one pilot could settle 2.4 s ahead of the room and another 2.4
    behind, and the two of them were five seconds apart from each
    other, permanently. Measured: two browsers in one room disagreeing
    by 4.3 to 6.8 s, which is exactly that band.
  
    The gains were INVERTED. More than 12 s out corrected at 20% a
    poll while 6–12 s out corrected at 60%, so the worse the drift the
    slower it closed.
  
    And the whole middle branch was gated on `sim.timeScale === 1`,
    which is nearly always true online (js/sim/sim.js forces the scale
    back to 1 whenever a remote pilot is present) but silently
    disabled the chase for the frames around someone joining at 40x.
  
  Now: one proportional chase, a gain that RISES with the error, and
  a dead zone of a quarter second — small enough that two clients can
  never be meaningfully apart, wide enough that a settled clock is not
  jittered by poll noise.
- L187 · `const me = selfId();` — who holds the sky, and whether its snapshot moved
- L189 · `net.host = j.host == null || j.host === me;` — no live state yet means nobody else is here
- L199 · `net.host = true;` — offline: our sky, our rocks
- L200 · `for (const fn of net.roomListeners) fn({ host: true, hostId: null, wseq: net.wseq, worldRe` — 0.3.66: `j` is the try block's; reading it here threw
- L204 · `if (gen === pollGen) {` — a stale poll owns nothing: the generation that replaced it has its own inflight and timer
<!-- /note -->

### <a id="s-connectNet"></a>`connectNet(room)`

function · **exported** · L211–231

- calls: [`disconnectNet`](#s-disconnectNet) · [`lonely`](#s-lonely) · [`poll`](#s-poll) · [`post`](#s-post) ×2
- called by: [`mountHud>go`](../ui/hud.js.md#s-mountHud-go) _js/ui/hud.js_

<!-- note:connectNet -->
Joins a room. Called at launch with the sky's seed — same sky, same room.

- L217 · `net.seq = -1;` — -1 = fresh join: first poll only syncs the cursor, never replays the ring
<!-- /note -->

### <a id="s-disconnectNet"></a>`disconnectNet()`

function · **exported** · L235–246

- calls: [`dropRemote`](../sim/sim.js.md#s-dropRemote) _js/sim/sim.js_
- via [js/sim/sim.js](../sim/sim.js.md): `sim.remotes.keys`
- called by: [`connectNet`](#s-connectNet) · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_
- effects: event.handler `net.online`

<!-- note:disconnectNet -->
<!-- /note -->

## Module-level calls

- calls: [`poll`](#s-poll)
