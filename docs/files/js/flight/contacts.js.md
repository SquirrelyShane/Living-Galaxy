# js/flight/contacts.js

[index](../../../README.md) · 260 lines · 20 symbols · 6 imports · 5 importers

## About

<!-- note:@file -->
LIVING GALAXY — the contact register.

The chart used to draw every hull in the sky, at true position, with its
name, forever — the comment in map.js said so outright: "every hull on the
board, wherever it is". That is not a sensor picture, it is omniscience,
and it makes the scanner, the probes and the whole idea of a sensor range
decorative.

So nothing is on the chart until you have earned it. A contact starts as
an unknown return and resolves while you keep the scanner on it:

  0  nothing            not on the chart at all
  1  return             a blob, with a position error that shrinks
  2  track              hull class, heading and speed
  3  identified         name, corp, and what it is carrying

Resolution is a number that rises while you look and falls when you stop,
so a busy lane you swept once does not stay lit for the rest of the
session. Four things are exempt, because you do not need a scanner to know
about them: your own hulls, your corp's structures, anything inside a
probe's footprint, and the ports, which are on the chart because they are
charted.

---- two scanners, both always running ----------------------------------

The array does two jobs at once, the way a real one would:

  BROAD   a wide sweep over everything in range. It is fast and it is
          shallow: it will tell you there is a freighter out there and
          whether it is shooting at you, and it will never tell you its
          name. Capped at `broadCap`, which sits above the track threshold
          and below the identification one, so a broad return can reach
          level 2 and can never reach level 3.

  FOCUS   the narrow beam, on exactly ONE contact at a time. It is the only
          thing that can push a return past `ident` and produce a name, a
          flag and a manifest. It points where you point: the contact
          nearest your reticle inside the dish's cone, and when you are not
          looking at anything in particular it works down the board on its
          own, nearest and most interesting first.

Once a hull has been identified it STAYS identified for as long as it is in
range — `known` latches. Losing a name the moment the beam moved on would
be realistic and would also make a busy board flicker between "freighter"
and "Kestrel VOSS-42" continuously, which is unreadable. Drift out of range
and the record ages out; meet it again and it is a stranger again.

- L55 · `const RATE = 0.2;` — the register updates at 5 Hz, not per frame
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../npc/traffic.js` | `traffic` | [js/npc/traffic.js](../npc/traffic.js.md) |
| 3 | `../npc/flow.js` | `flow` | [js/npc/flow.js](../npc/flow.js.md) |
| 4 | `./probes.js` | `probes` | [js/flight/probes.js](probes.js.md) |
| 5 | `./ship.js` | `forwardOf` | [js/flight/ship.js](ship.js.md) |
| 6 | `./ship.js` | `shipFx` | [js/flight/ship.js](ship.js.md) |

## Imported by

- [js/render/engine.js](../render/engine.js.md) — `contactView`, `hullTag`, `scanFocus`
- [js/sim/sim.js](../sim/sim.js.md) — `tickContacts`, `resetContacts`
- [js/ui/map.js](../ui/map.js.md) — `knownContacts`
- test/chartquiet.test.mjs _(outside js/)_ — `register`, `knownContacts`, `tickContacts`, `SCAN`
- test/nav.test.mjs _(outside js/)_ — `SCAN`, `levelOf`, `errorOf`, `hullTag`, `classOf`

## Exports

- [`SCAN`](#s-SCAN) · const — used by test/chartquiet.test.mjs, test/nav.test.mjs
- [`register`](#s-register) · const — used by test/chartquiet.test.mjs
- [`levelOf`](#s-levelOf) · function — used by test/nav.test.mjs
- [`errorOf`](#s-errorOf) · function — used by test/nav.test.mjs
- [`tickContacts`](#s-tickContacts) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/chartquiet.test.mjs
- [`focus`](#s-focus) · const — **no importer in scanned roots**
- [`knownContacts`](#s-knownContacts) · function — used by [js/ui/map.js](../ui/map.js.md), test/chartquiet.test.mjs
- [`hullTag`](#s-hullTag) · function — used by [js/render/engine.js](../render/engine.js.md), test/nav.test.mjs
- [`classOf`](#s-classOf) · function — used by test/nav.test.mjs
- [`effLevel`](#s-effLevel) · function — **no importer in scanned roots**
- [`levelFor`](#s-levelFor) · function — **no importer in scanned roots**
- [`contactView`](#s-contactView) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`scanFocus`](#s-scanFocus) · function — used by [js/render/engine.js](../render/engine.js.md)
- [`resetContacts`](#s-resetContacts) · function — used by [js/sim/sim.js](../sim/sim.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-SCAN"></a>`SCAN`

const · **exported** · L8–25

<!-- note:SCAN -->
- L9 · `range: 12000,` — Deliberately modest. The old sensor range was 300 km and everything
  inside it was fully identified the instant it entered; the point of a
  scanner is that it costs you something.
- L9 · `range: 12000,` — u — where a return can be picked up at all
- L10 · `cone: 0.55,` — rad — half-angle the dish actually looks down
- L11 · `omni: 0.16,` — how much of the gain you get off-axis
- L12 · `gain: 0.55,` — resolution per second at ideal range, on the nose (× the phased-array refit)
- L13 · `decay: 0.055,` — resolution lost per second when nothing is looking
- L14 · `pulseBonus: 2.6,` — an active pulse resolves this much faster
- L15 · `probeWatch: 9000,` — u — a landed probe keeps this much of the sky under watch
- L16 · `keep: 240,` — 0.3.50 — the long-range track is gone. From 0.2.x a hull under drive
  anywhere inside 1.4 million u put a blob on the chart, so the nav map
  showed every NPC warping across the system, and the register kept a live
  record for every hull in the sky at 5 Hz to do it. A contact is now what
  the dish can actually see (`range`), and a hull with its drive lit is not
  a contact at all until it drops out: a warp is a streak, not a track.
- L16 · `keep: 240,` — seconds a stale record is remembered before it is dropped
- L17 · `seen: 0.14,` — level thresholds
- L20 · `broadCap: 0.62,` — The broad sweep's ceiling. Deliberately between `track` and `ident`: wide
  enough to class a hull and colour it, never enough to name it. Moving
  this above `ident` would hand every name in the sky back for free.
- L21 · `broadGain: 0.42,` — how fast the wide sweep fills, per second, at ideal range
- L22 · `focusGain: 0.95,` — and the narrow beam, which is the only way past `ident`
- L23 · `focusCone: 0.30,` — rad — how near the reticle a contact must be to take the beam
- L24 · `focusHold: 1.2,` — s — the beam stays on a target this long before it may be stolen
<!-- /note -->

### <a id="s-register"></a>`register`

const · **exported** · L27–27

<!-- note:register -->
id -> { res, x, y, z, at, kind, ref }
<!-- /note -->

### <a id="s-levelOf"></a>`levelOf(res)`

function · **exported** · L29–34

- called by: [`effLevel`](#s-effLevel)

<!-- note:levelOf -->
<!-- /note -->

### <a id="s-errorOf"></a>`errorOf(rec, dist)`

function · **exported** · L36–39

- called by: [`knownContacts`](#s-knownContacts)

<!-- note:errorOf -->
How far off a blob might really be, in world units.
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L41–43

- called by: [`knownContacts`](#s-knownContacts) · [`tickContacts>touch`](#s-tickContacts-touch)

<!-- note:d3 -->
<!-- /note -->

### <a id="s-probeCovers"></a>`probeCovers(x, y, z)`

function · L45–52

- called by: [`tickContacts>touch`](#s-tickContacts-touch)

<!-- note:probeCovers -->
---- the things you never have to scan ----------------------------------
Your own hulls are flagged `company` by fleet.js when it puts them on the
board, so this needs no import and cannot go stale. Ports and worlds are
not in here at all: they are charted, not detected, and the map draws them
from the body list as it always did.

Anything sitting inside a landed probe's footprint is being watched for you.
<!-- /note -->

### <a id="s-acc"></a>`acc`

const · L54–54

<!-- note:acc -->
---- the tick ------------------------------------------------------------
<!-- /note -->

### <a id="s-RATE"></a>`RATE`

const · L55–55

<!-- note:RATE -->
<!-- /note -->

### <a id="s-tickContacts"></a>`tickContacts(dt)`

function · **exported** · L57–125

- calls: [`stepFocus`](#s-stepFocus) · [`tickContacts>touch`](#s-tickContacts-touch) ×2 · [`forwardOf`](ship.js.md#s-forwardOf) _js/flight/ship.js_
- called by: [`stepShip`](../sim/sim.js.md#s-stepShip) _js/sim/sim.js_

<!-- note:tickContacts -->
- L117 · `stepFocus(step);` — ---- the narrow beam ----
  One contact at a time. It goes where you are looking; when you are not
  looking at anything in particular it works the board itself.
- L119 · `for (const [id, rec] of register) {` — Decay anything we did not touch this pass, and forget it eventually.
- L122 · `if (!rec.inRange) rec.known = false;` — a name is only held while the hull is in range: drift apart and it goes
  back to being a stranger, which is what stops one sweep of a lane
  naming its traffic for the rest of the session
<!-- /note -->

#### <a id="s-tickContacts-touch"></a>`tickContacts>touch(id, v, kind)`

function · L69–111

- calls: [`d3`](#s-d3) · [`probeCovers`](#s-probeCovers)
- via [js/flight/ship.js](ship.js.md): `shipFx.fx`
- called by: [`tickContacts`](#s-tickContacts) ×2

<!-- note:tickContacts>touch -->
- L71 · `if (v.company === true || probeCovers(v.x, v.y ?? 0, v.z)) {` — Free knowledge first: your own hulls and a probe's footprint never need
  the dish (and your own fleet stays on the chart even under drive).
- L79 · `const dist = d3(ship.pos, v);` — 0.3.50: out of the dish's range, or under drive — not a contact. An
  existing record just decays (below); nothing new is allocated, so a busy
  sky costs the register only what is actually near you.
- L81 · `if (rec) { rec.free = false; rec.ref = v; if (v.drive) rec.res = 0; }` — lit its drive: off the chart now, not a fading blob
- L92 · `const dx = (v.x - ship.pos.x) / (dist || 1);` — ---- the broad sweep ----
  Everything in range, every pass, up to `broadCap`. On the nose fills
  faster than off to the side and close faster than far, so pointing the
  ship still means something — but no amount of sweeping will name
  anything, because the ceiling is below `ident`.
- L107 · `rec.gain = gain;` — the beam is applied after the sweep, once we know who has it
- L109 · `rec.x = v.x; rec.y = v.y ?? 0; rec.z = v.z;` — The believed position only updates while you actually have a return —
  that is why a stale blob sits where you last saw it and its error
  circle grows as it ages.
<!-- /note -->

### <a id="s-focus"></a>`focus`

const · **exported** · L127–127

<!-- note:focus -->
---- focus ----------------------------------------------------------------
<!-- /note -->

### <a id="s-stepFocus"></a>`stepFocus(step)`

function · L129–165

- called by: [`tickContacts`](#s-tickContacts)

<!-- note:stepFocus -->
Pick and drive the narrow beam. Preference order:

  1. what you have locked, if it is in range — an explicit choice wins
  2. the unidentified contact nearest your reticle, inside `focusCone`
  3. otherwise, work the board: nearest first among what is not yet named

A held target is not given up for `focusHold` seconds, so sweeping the nose
across a crowded lane does not restart the beam on a new hull every frame
and finish none of them.

- L140 · `let best = null, bestAng = SCAN.focusCone;` — nearest the reticle, inside the cone
- L145 · `if (!best) {` — Nothing under the reticle: work the board on its own. Nearest first,
  but not blindly — a port's flow boats are anonymous by construction and
  identifying one tells you "hull", so an array that spends itself on the
  three boats orbiting a station while a raider closes is working hard
  and telling you nothing. Crewed hulls outrank boats, and something
  already resolved most of the way is finished before a new one starts.
- L150 · `+ rec.res * 1.4` — finish what is nearly done
- L151 · `- rec.dist / Math.max(1, SCAN.range);` — and prefer what is close
<!-- /note -->

### <a id="s-knownContacts"></a>`knownContacts()`

function · **exported** · L167–191

- calls: [`classOf`](#s-classOf) · [`d3`](#s-d3) · [`effLevel`](#s-effLevel) · [`errorOf`](#s-errorOf)
- called by: [`mountMap`](../ui/map.js.md#s-mountMap) _js/ui/map.js_ · [`mountMap>dirEntries`](../ui/map.js.md#s-mountMap-dirEntries) _js/ui/map.js_ · [`mountMap>hitAt`](../ui/map.js.md#s-mountMap-hitAt) _js/ui/map.js_

<!-- note:knownContacts -->
What the chart is allowed to draw. Each entry carries its level and its
position error so the map can show an honest blob rather than a dot it has
no right to.

- L183 · `name: level >= 3 ? rec.ref?.name ?? "contact" : level >= 2 ? classOf(rec.ref) : "unknown",` — What the player is actually allowed to be told at this level.
<!-- /note -->

### <a id="s-hullTag"></a>`hullTag(v)`

function · **exported** · L193–204

- called by: [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_

<!-- note:hullTag -->
---- what kind of thing is flying it ------------------------------------

Four tags, and the distinction each one draws is about WHO IS IN THE LOOP,
not about size or armament:

  P  a person at a console — another pilot in the room, or one of your own
     company hulls, which answer to you
  N  a crewed hull with somebody in the chair: the sky's own captains
  D  a deployed drone. Launched by a ship or a port, belongs to it, goes
     home to it: work drones, interceptors, a corporation's line
  R  an autonomous robotic hull with no crew and no parent — the nests'
     machines, which are nobody's and are not going home

The tag is what the bracket on the canopy reads, and it is deliberately the
first thing you learn about a contact: it survives at level 1, before the
scanner knows the hull class and long before it knows a name, because an
unidentified return that is somebody's drone and an unidentified return
that is a crewed ship are different problems.

- L201 · `if (id.startsWith("flow:") || v.port != null) return "D";` — a port's own shuttle: belongs to the ring, flies a fixed loop, goes home,
  and nobody is filed as its captain
<!-- /note -->

### <a id="s-classOf"></a>`classOf(v)`

function · **exported** · L206–213

- called by: [`contactView`](#s-contactView) · [`knownContacts`](#s-knownContacts) · [`scanFocus`](#s-scanFocus)

<!-- note:classOf -->
A hull class, without a name attached to it.
<!-- /note -->

### <a id="s-effLevel"></a>`effLevel(rec)`

function · **exported** · L215–220

- calls: [`levelOf`](#s-levelOf)
- called by: [`contactView`](#s-contactView) · [`knownContacts`](#s-knownContacts) · [`levelFor`](#s-levelFor) · [`scanFocus`](#s-scanFocus)

<!-- note:effLevel -->
One contact's level, for the HUD and the lock computer.

The level a record actually discloses at, `known` included.
<!-- /note -->

### <a id="s-levelFor"></a>`levelFor(id)`

function · **exported** · L222–224

- calls: [`effLevel`](#s-effLevel)

<!-- note:levelFor -->
<!-- /note -->

### <a id="s-contactView"></a>`contactView(id)`

function · **exported** · L226–239

- calls: [`classOf`](#s-classOf) · [`effLevel`](#s-effLevel)
- called by: [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ ×2

<!-- note:contactView -->
Everything the canopy is allowed to say about one contact, in one lookup.
`level` 0 means say nothing at all.

- L234 · `label: level >= 3 ? (rec.ref?.name ?? "contact") : level >= 2 ? classOf(rec.ref) : "unknow` — level 1 is a return and nothing more; 2 knows what shape it is; only 3
  has a name, and only the beam produces a 3
<!-- /note -->

### <a id="s-scanFocus"></a>`scanFocus()`

function · **exported** · L241–252

- calls: [`classOf`](#s-classOf) · [`effLevel`](#s-effLevel)
- called by: [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_

<!-- note:scanFocus -->
What the narrow beam is working on right now, for the HUD readout.

- L249 · `progress: Math.max(0, Math.min(1, (rec.res - SCAN.broadCap) / Math.max(0.01, 1 - SCAN.broa` — how far through identification the beam is, which is the bar worth
  showing: broad already got it to `broadCap` for free
<!-- /note -->

### <a id="s-resetContacts"></a>`resetContacts()`

function · **exported** · L254–260

- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:resetContacts -->
<!-- /note -->
