# js/net/worldsync.js

[index](../../../README.md) · 305 lines · 32 symbols · 7 imports · 3 importers

## About

<!-- note:@file -->
LIVING GALAXY experimental — one sky for everyone in the room.

The room already shares a clock (net.js chases `now - born`), which makes
the ports, the NPC traffic and the markets desk line up for everyone by
construction. What it did not share was the stuff that is rolled, not
computed: the rogue rocks, and what they do to worlds and ports. This
module closes that:

  host     the longest-present pilot (the server elects them). They alone
           spawn and integrate impactors — and, since the NPC sky became
           something you can change rather than a closed-form function of
           the clock, they alone integrate the hulls as well.
  wstate   every 2 s the host broadcasts the live rocks, the shot-down list
           and the hull state; everyone else mirrors them.
  strike   when a rock lands on the host's screen, an event carries the
           body, size, speed and normal; every mirror applies the same
           impact — same crater, same blast, same GNN bulletin.
  snapshot every 20 s (and right after a strike) the host POSTs the state
           of the sky — damage, lost ports, climate, rocks — so a pilot
           who joins an hour later inherits every scar. (`worldSnapshot()`)

Host hand-off is automatic: when the host leaves, the server names the
next-oldest pilot and their `worldAuthority` flips on within a poll.

---- why the hulls are here now ------------------------------------------

They did not used to need to be. `poseAt(n, t)` was pure in (seed, skyTime),
so two clients agreed about every captain in the sky without anyone being in
charge — a genuinely nice property, and the reason the old sky worked with
no host simulation at all.

It was also the reason nothing could ever be intercepted. A position that is
a closed-form function of the clock cannot be changed by anything you do to
it: you cannot chase it, damage it, drive it off course or destroy it and
have the sky agree. Buying flight that means something costs that property,
so the host now integrates and mirrors take its word.

The wire is deliberately thin. A hull's ROSTER — who is flying it, for whom,
in what — is still a pure function of the seed and is never sent. Only what
has become genuinely unpredictable travels: where each hull is, what it is
doing, and how much of it is left. Hulls are sent nearest-the-host first and
capped, so a busy sky costs a bounded packet rather than a growing one; a
mirror keeps flying anything the packet left out on its own timetable, which
is exactly what `routePose` is still for.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../comms/gnn.js` | `gnnBroadcastWire` | [js/comms/gnn.js](../comms/gnn.js.md) |
| 2 | `./net.js` | `fetchWorld`, `lonely`, `net`, `onMessage`, `onRoom`, `pushWorld` | [js/net/net.js](net.js.md) |
| 3 | `../sim/sim.js` | `applyRemoteRockHit`, `applyRemoteStrike`, `applyWorldSnapshot`, `leaveHulk`, `logEvent`, `shiftClock`, `sim`, `worldSnapshot` | [js/sim/sim.js](../sim/sim.js.md) |
| 4 | `../world/hulks.js` | `adoptHulkWire`, `applyHulkCut`, `hulkWire` | [js/world/hulks.js](../world/hulks.js.md) |
| 5 | `../world/events/holes.js` | `adoptHoles`, `holeWire` | [js/world/events/holes.js](../world/events/holes.js.md) |
| 6 | `../world/events/impactors.js` | `adoptImpactors`, `impactorWire`, `setImpactorAuthority` | [js/world/events/impactors.js](../world/events/impactors.js.md) |
| 7 | `../npc/traffic.js` | `markVesselDown`, `trafficDown`, `traffic`, `vesselById` | [js/npc/traffic.js](../npc/traffic.js.md) |

## Imported by

- [js/render/engine.js](../render/engine.js.md) — `tickWorldSync`, `wireWorldSyncTest`
- [js/ui/hud.js](../ui/hud.js.md) — `applySolPrime`, `mountWorldSync`, `resetWorldSync`
- test/solprime.test.mjs _(outside js/)_ — `applySolPrime`, `resetWorldSync`, `worldsync`

## Exports

- [`HULL_CAP`](#s-HULL_CAP) · const — **no importer in scanned roots**
- [`HULL_SNAP`](#s-HULL_SNAP) · const — **no importer in scanned roots**
- [`worldsync`](#s-worldsync) · const — used by test/solprime.test.mjs
- [`HULK_EVERY`](#s-HULK_EVERY) · const — **no importer in scanned roots**
- [`hostVesselDown`](#s-hostVesselDown) · function — **no importer in scanned roots**
- [`hullWire`](#s-hullWire) · function — **no importer in scanned roots**
- [`HULL_DEAD`](#s-HULL_DEAD) · const — **no importer in scanned roots**
- [`HULL_BLEND`](#s-HULL_BLEND) · const — **no importer in scanned roots**
- [`HULL_HOLD`](#s-HULL_HOLD) · const — **no importer in scanned roots**
- [`adoptHulls`](#s-adoptHulls) · function — **no importer in scanned roots**
- [`blendHulls`](#s-blendHulls) · function — **no importer in scanned roots**
- [`applySolPrime`](#s-applySolPrime) · function — used by [js/ui/hud.js](../ui/hud.js.md), test/solprime.test.mjs
- [`mountWorldSync`](#s-mountWorldSync) · function — used by [js/ui/hud.js](../ui/hud.js.md)
- [`resetWorldSync`](#s-resetWorldSync) · function — used by [js/ui/hud.js](../ui/hud.js.md), test/solprime.test.mjs
- [`tickWorldSync`](#s-tickWorldSync) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`wireWorldSyncTest`](#s-wireWorldSyncTest) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`mirrorMode`](#s-mirrorMode) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-HULL_CAP"></a>`HULL_CAP`

const · **exported** · L9–9

<!-- note:HULL_CAP -->
How many hulls ride in a wstate packet, and how far a mirror lets a hull
drift from where the host last put it before it simply jumps.
<!-- /note -->

### <a id="s-HULL_SNAP"></a>`HULL_SNAP`

const · **exported** · L10–10

<!-- note:HULL_SNAP -->
<!-- /note -->

### <a id="s-worldsync"></a>`worldsync`

const · **exported** · L12–24

<!-- note:worldsync -->
- L14 · `applied: false,` — have we applied the host's snapshot this join
<!-- /note -->

### <a id="s-HULK_EVERY"></a>`HULK_EVERY`

const · **exported** · L26–26

<!-- note:HULK_EVERY -->
0.3.91: hulks ride their own packet. They change when something dies or a
section comes off, not every two seconds, and they are bulkier than hulls.
<!-- /note -->

### <a id="s-hostVesselDown"></a>`hostVesselDown(id)`

function · **exported** · L28–31

- calls: [`vesselById`](../npc/traffic.js.md#s-vesselById) _js/npc/traffic.js_ · [`leaveHulk`](../sim/sim.js.md#s-leaveHulk) _js/sim/sim.js_
- called by: [`handleMessage`](#s-handleMessage)

<!-- note:hostVesselDown -->
A kill a pilot reports is a kill: the host puts the hulk there, so the next
pilot along finds it too. Before, only the pilot who made it ever saw it.
<!-- /note -->

### <a id="s-hullWire"></a>`hullWire(pos, cap=)`

function · **exported** · L33–61

- called by: [`tickWorldSync`](#s-tickWorldSync)

<!-- note:hullWire -->
The hull state a mirror cannot work out for itself, nearest the host first.

- L47 · `wire.push([` — rounded: this is a position on a screen, not a ledger entry, and the
  packet goes out five times a minute over a phone's wifi
<!-- /note -->

### <a id="s-HULL_DEAD"></a>`HULL_DEAD`

const · **exported** · L63–63

<!-- note:HULL_DEAD -->
0.3.65 — how a mirror takes the host's word without juddering.

Until the persistent Sol host, a pilot alone in a sky WAS the host and never
received a hull packet; mirroring was a two-pilot edge case. Now every pilot
in Sol is a mirror, every 2 s, and each packet was a visible hop:

  The mirror flies the hulls itself between packets, but its hull state
  machine (leg, bay run, clamps) is its own, so it drifts from the host's.
  Measured on 0.3.64 over 25 s near the player: median 128 u, p90 1.2 km
  apart when a packet lands. 40% of that was applied in ONE frame — a median
  10 and a p90 51 frames' worth of the hull's own motion, every 2 s — and the
  velocity was replaced outright, a kink in the path on top of the hop.

Now:
  - HULL_DEAD: a disagreement under 400 u is left alone. Nobody alone in a
    sky can see it, and correcting it is exactly what juddered.
  - a larger one is held on the hull (`n.sync`) and bled off over about a
    second from the render loop (`blendHulls`), heading and pitch with it,
    and the mirror keeps its own velocity: a drift, not a hop.
  - a hull riding a bay run or the clamps is posed by the port every step, so
    a correction there lasts one frame and flickers; those are left to the port.
  - the packet carries `at`, the host's sky time, and the report is carried
    forward by its velocity before it is compared.

Past HULL_SNAP, or when the host and the mirror disagree about whether it can
be seen, the two are flying different states (the host's directors have it in
a fight or a response the mirror never runs). The old code snapped it and let
the mirror's timetable fly it straight back, so the same hull teleported every
packet. Now it is placed once and HELD: the mirror stops running its own state
machine for it and dead-reckons on the host's velocity (`heldUntil`, refreshed
by each packet), so the next packet finds it close and blends. If the host
goes quiet the hold lapses after HULL_HOLD seconds and the timetable resumes.
<!-- /note -->

### <a id="s-HULL_BLEND"></a>`HULL_BLEND`

const · **exported** · L64–64

<!-- note:HULL_BLEND -->
<!-- /note -->

### <a id="s-HULL_HOLD"></a>`HULL_HOLD`

const · **exported** · L65–65

<!-- note:HULL_HOLD -->
<!-- /note -->

### <a id="s-BLEND_RATE_FLOOR"></a>`BLEND_RATE_FLOOR`

const · L66–66

<!-- note:BLEND_RATE_FLOOR -->
how fast a blend may move a hull beyond its own motion: a correction reads as
drift only while it is slower than the hull (or this floor, for the slow ones)
<!-- /note -->

### <a id="s-BLEND_RATE_K"></a>`BLEND_RATE_K`

const · L66–66

<!-- note:BLEND_RATE_K -->
<!-- /note -->

### <a id="s-MAX_AGE"></a>`MAX_AGE`

const · L67–67

<!-- note:MAX_AGE -->
<!-- /note -->

### <a id="s-POSED"></a>`POSED`

const · L68–68

<!-- note:POSED -->
<!-- /note -->

### <a id="s-wrapPi"></a>`wrapPi(a)`

function · L70–70

- called by: [`adoptHulls`](#s-adoptHulls)

<!-- note:wrapPi -->
<!-- /note -->

### <a id="s-adoptHulls"></a>`adoptHulls(wire, {…}=)`

function · **exported** · L72–105

- calls: [`wrapPi`](#s-wrapPi) · [`vesselById`](../npc/traffic.js.md#s-vesselById) _js/npc/traffic.js_
- called by: [`handleMessage`](#s-handleMessage)

<!-- note:adoptHulls -->
Apply a host's hull packet. Anything not in it keeps flying its timetable.
 `at` is the host's sky time when it read the hulls; `snap` places them
 exactly (a host restoring its own checkpoint has no render loop to blend).

- L81 · `const x = x0 + vx * age, y = y0 + vy * age, z = z0 + vz * age;` — where the host's hull is NOW, not where it was when the packet left
- L87 · `n.x = x; n.y = y; n.z = z;` — too far wrong to reconcile, or nobody can see it: take the host's word outright
- L91 · `n.sync = { x: ex, y: ey, z: ez, yaw: wrapPi(yaw - (n.yaw ?? 0)), pitch: pitch - (n.pitch ?` — close enough to ease onto: the residual is spent a little each frame
- L93 · `if (snap || diverged || held || n.visible === false) { n.vx = vx; n.vy = vy; n.vz = vz; n.` — a held hull flies the host's velocity; one on its own timetable keeps its own
- L99 · `n.hunt = null;` — a mirror never runs the directors: the host decides who is hunting whom,
  and a mirror that made its own mind up would fight a different war
<!-- /note -->

### <a id="s-blendHulls"></a>`blendHulls(dt)`

function · **exported** · L107–126

- called by: [`tickWorldSync`](#s-tickWorldSync)

<!-- note:blendHulls -->
Mirror, every frame: spend each hull's held correction. Exponential, so a
 new packet arriving mid-blend simply replaces what is left of the old one.
<!-- /note -->

### <a id="s-mounted"></a>`mounted`

const · L128–128

<!-- note:mounted -->
<!-- /note -->

### <a id="s-joinGeneration"></a>`joinGeneration`

const · L129–129

<!-- note:joinGeneration -->
<!-- /note -->

### <a id="s-liveStateSeen"></a>`liveStateSeen`

const · L130–130

<!-- note:liveStateSeen -->
<!-- /note -->

### <a id="s-bodySignatures"></a>`bodySignatures`

const · L131–131

<!-- note:bodySignatures -->
<!-- /note -->

### <a id="s-bodySignature"></a>`bodySignature(body)`

function · L133–138

- called by: [`applySolPrime`](#s-applySolPrime) · [`pull`](#s-pull)

<!-- note:bodySignature -->
<!-- /note -->

### <a id="s-applySolPrime"></a>`applySolPrime(prime)`

function · **exported** · L140–153

- calls: [`bodySignature`](#s-bodySignature) · [`applyWorldSnapshot`](../sim/sim.js.md#s-applyWorldSnapshot) _js/sim/sim.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`shiftClock`](../sim/sim.js.md#s-shiftClock) _js/sim/sim.js_
- called by: [`mountHud>go`](../ui/hud.js.md#s-mountHud-go) _js/ui/hud.js_

<!-- note:applySolPrime -->
0.3.73 — put a freshly launched Sol on the room's clock and state before its
first frame (net.js primeSol). Everything the first poll and the first pull
would have done a second later is done here, and recorded as done, so they
find nothing to change. Call after resetWorldSync(), before connectNet().
<!-- /note -->

### <a id="s-mountWorldSync"></a>`mountWorldSync()`

function · **exported** · L155–160

- calls: [`onMessage`](net.js.md#s-onMessage) _js/net/net.js_ · [`onRoom`](net.js.md#s-onRoom) _js/net/net.js_
- called by: [`mountHud>go`](../ui/hud.js.md#s-mountHud-go) _js/ui/hud.js_

<!-- note:mountWorldSync -->
<!-- /note -->

### <a id="s-resetWorldSync"></a>`resetWorldSync()`

function · **exported** · L162–178

- calls: [`setImpactorAuthority`](../world/events/impactors.js.md#s-setImpactorAuthority) _js/world/events/impactors.js_
- called by: [`mountHud>go`](../ui/hud.js.md#s-mountHud-go) _js/ui/hud.js_

<!-- note:resetWorldSync -->
Call before connectNet on each launch.
<!-- /note -->

### <a id="s-setHost"></a>`setHost(on)`

function · L180–192

- calls: [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ ×2 · [`setImpactorAuthority`](../world/events/impactors.js.md#s-setImpactorAuthority) _js/world/events/impactors.js_
- called by: [`handleRoom`](#s-handleRoom) ×3

<!-- note:setHost -->
- L186 · `worldsync.lastPush = 0;` — publish the sky as soon as we hold it
<!-- /note -->

### <a id="s-handleRoom"></a>`handleRoom(info)`

function · L194–203

- calls: [`pull`](#s-pull) · [`setHost`](#s-setHost) ×3

<!-- note:handleRoom -->
<!-- /note -->

### <a id="s-pull"></a>`pull()`

function · async · L205–236

- calls: [`fetchWorld`](net.js.md#s-fetchWorld) _js/net/net.js_ · [`bodySignature`](#s-bodySignature) · [`applyWorldSnapshot`](../sim/sim.js.md#s-applyWorldSnapshot) _js/sim/sim.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- called by: [`handleRoom`](#s-handleRoom)

<!-- note:pull -->
- L212 · `const bodies = {};` — Later snapshots repair durable changes only. Never rewind the two-second live stream.
- L233 · `} finally {` — next poll retries the unacknowledged revision
<!-- /note -->

### <a id="s-handleMessage"></a>`handleMessage(from, d)`

function · L238–269

- calls: [`adoptHulls`](#s-adoptHulls) · [`hostVesselDown`](#s-hostVesselDown) · [`markVesselDown`](../npc/traffic.js.md#s-markVesselDown) _js/npc/traffic.js_ · [`applyRemoteRockHit`](../sim/sim.js.md#s-applyRemoteRockHit) _js/sim/sim.js_ · [`applyRemoteStrike`](../sim/sim.js.md#s-applyRemoteStrike) _js/sim/sim.js_ · [`adoptHoles`](../world/events/holes.js.md#s-adoptHoles) _js/world/events/holes.js_ · [`adoptImpactors`](../world/events/impactors.js.md#s-adoptImpactors) _js/world/events/impactors.js_ · [`adoptHulkWire`](../world/hulks.js.md#s-adoptHulkWire) _js/world/hulks.js_ · [`applyHulkCut`](../world/hulks.js.md#s-applyHulkCut) _js/world/hulks.js_

<!-- note:handleMessage -->
- L241 · `if (worldsync.host) return;` — our own strikes are already on the ground
<!-- /note -->

### <a id="s-lastBlend"></a>`lastBlend`

const · L271–271

<!-- note:lastBlend -->
From the render loop. Host duties live here.
<!-- /note -->

### <a id="s-tickWorldSync"></a>`tickWorldSync()`

function · **exported** · L272–299

- calls: [`gnnBroadcastWire`](../comms/gnn.js.md#s-gnnBroadcastWire) _js/comms/gnn.js_ · [`lonely`](net.js.md#s-lonely) _js/net/net.js_ · [`pushWorld`](net.js.md#s-pushWorld) _js/net/net.js_ · [`blendHulls`](#s-blendHulls) · [`hullWire`](#s-hullWire) · [`worldSnapshot`](../sim/sim.js.md#s-worldSnapshot) _js/sim/sim.js_ · [`holeWire`](../world/events/holes.js.md#s-holeWire) _js/world/events/holes.js_ · [`impactorWire`](../world/events/impactors.js.md#s-impactorWire) _js/world/events/impactors.js_ · [`hulkWire`](../world/hulks.js.md#s-hulkWire) _js/world/hulks.js_
- via [js/sim/sim.js](../sim/sim.js.md): `sim.send`
- via [js/net/net.js](net.js.md): `pushWorld.then`, `pushWorld.then.catch`
- called by: [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_

<!-- note:tickWorldSync -->
<!-- /note -->

### <a id="s-wireWorldSyncTest"></a>`wireWorldSyncTest()`

function · **exported** · L301–303

- called by: [`mountGame`](../render/engine.js.md#s-mountGame) _js/render/engine.js_

<!-- note:wireWorldSyncTest -->
<!-- /note -->

### <a id="s-mirrorMode"></a>`mirrorMode()`

function · **exported** · L305–305

<!-- note:mirrorMode -->
A mirror steps the sky too — it has to, or hulls would freeze between
packets — but it does not get to decide anything. `sim.worldAuthority` is
the flag every director already checks through here.
<!-- /note -->
