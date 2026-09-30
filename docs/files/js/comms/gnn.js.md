# js/comms/gnn.js

[index](../../../README.md) · 55 lines · 11 symbols · 2 imports · 8 importers

## About

<!-- note:@file -->
LIVING GALAXY — the Galactic News Network.

One GNN station sits somewhere in every sky (stations.js places it: a relay
archetype, civilian berths, its own orbit or a world's well). Its desks put
out bulletins that are accepted automatically — no ringing puck — and land
in chat with a link to the GNN desk panel, where the archive, the desks and
each bulletin's actions (mark the site, take the salvage paper) live.

  gnnPost({ desk, title, body, actions })   → the bulletin
  gnnStation()                               → this sky's GNN station
  gnn.open                                   → set by the UI: opens the desk at a bulletin
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./chat.js` | `post` | [js/comms/chat.js](chat.js.md) |
| 2 | `../station/stations.js` | `stations` | [js/station/stations.js](../station/stations.js.md) |

## Imported by

- [js/comms/comms.js](comms.js.md) — `gnnPost`
- [js/console/console.js](../console/console.js.md) — `gnn`
- [js/console/panels/corp.js](../console/panels/corp.js.md) — `DESKS`, `gnn`, `gnnStation`, `runAction`
- [js/drones/ops.js](../drones/ops.js.md) — `gnnPost`
- [js/net/account.js](../net/account.js.md) — `gnnPost`
- [js/net/worldsync.js](../net/worldsync.js.md) — `gnnBroadcastWire`
- [js/sim/sim.js](../sim/sim.js.md) — `gnn`, `gnnPost`, `resetGnn`
- [js/station/stationdeck.js](../station/stationdeck.js.md) — `gnn`, `DESKS`, `runAction`

## Exports

- [`DESKS`](#s-DESKS) · const — used by [js/console/panels/corp.js](../console/panels/corp.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md)
- [`gnn`](#s-gnn) · const — used by [js/console/console.js](../console/console.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md)
- [`gnnStation`](#s-gnnStation) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md)
- [`gnnPost`](#s-gnnPost) · function — used by [js/comms/comms.js](comms.js.md), [js/drones/ops.js](../drones/ops.js.md), [js/net/account.js](../net/account.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`runAction`](#s-runAction) · function — used by [js/console/panels/corp.js](../console/panels/corp.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md)
- [`gnnById`](#s-gnnById) · function — **no importer in scanned roots**
- [`resetGnn`](#s-resetGnn) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`gnnBroadcastWire`](#s-gnnBroadcastWire) · function — used by [js/net/worldsync.js](../net/worldsync.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-DESKS"></a>`DESKS`

const · **exported** · L4–9

<!-- note:DESKS -->
<!-- /note -->

### <a id="s-gnn"></a>`gnn`

const · **exported** · L11–11

<!-- note:gnn -->
<!-- /note -->

#### <a id="s-gnn-clock"></a>`gnn.clock()`

prop · L11–11

<!-- note:gnn.clock -->
<!-- /note -->

### <a id="s-gnnStation"></a>`gnnStation()`

function · **exported** · L13–15

- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- called by: [`gnnPost`](#s-gnnPost) · [`mountGnn`](../console/panels/corp.js.md#s-mountGnn) _js/console/panels/corp.js_

<!-- note:gnnStation -->
<!-- /note -->

### <a id="s-gnnPost"></a>`gnnPost({…}=)`

function · **exported** · L17–34

- calls: [`post`](chat.js.md#s-post) _js/comms/chat.js_ · [`gnnStation`](#s-gnnStation)
- called by: [`broadcast`](comms.js.md#s-broadcast) _js/comms/comms.js_ · [`stepBattles`](comms.js.md#s-stepBattles) _js/comms/comms.js_ · [`stepNews`](comms.js.md#s-stepNews) _js/comms/comms.js_ · [`ROLE_STEP.combat`](../drones/ops.js.md#s-ROLE_STEP-combat) _js/drones/ops.js_ · [`ROLE_STEP.surveyor`](../drones/ops.js.md#s-ROLE_STEP-surveyor) _js/drones/ops.js_ · [`postNews`](../net/account.js.md#s-postNews) _js/net/account.js_ · [`onRogueCollision`](../sim/sim.js.md#s-onRogueCollision) _js/sim/sim.js_ · [`watchHoles`](../sim/sim.js.md#s-watchHoles) _js/sim/sim.js_ · [`wireReactiveSky`](../sim/sim.js.md#s-wireReactiveSky) _js/sim/sim.js_ ×3

<!-- note:gnnPost -->
File a bulletin: archived on the desk, auto-accepted into chat with a desk link.
<!-- /note -->

#### <a id="s-gnnPost-run"></a>`gnnPost.run()`

prop · L28–28

<!-- note:gnnPost.run -->
<!-- /note -->

#### <a id="s-gnnPost-run-2"></a>`gnnPost.run~2()`

prop · L29–29

- calls: [`runAction`](#s-runAction)

<!-- note:gnnPost.run~2 -->
<!-- /note -->

### <a id="s-runAction"></a>`runAction(b, i)`

function · **exported** · L36–42

- called by: [`gnnPost.run~2`](#s-gnnPost-run-2) · [`mountGnn`](../console/panels/corp.js.md#s-mountGnn) _js/console/panels/corp.js_ · [`x`](../station/stationdeck.js.md#s-x) _js/station/stationdeck.js_

<!-- note:runAction -->
Run a bulletin's action once (the chat link and the desk share this).
<!-- /note -->

### <a id="s-gnnById"></a>`gnnById(id)`

function · **exported** · L44–44

<!-- note:gnnById -->
<!-- /note -->

### <a id="s-resetGnn"></a>`resetGnn()`

function · **exported** · L46–46

- called by: [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:resetGnn -->
<!-- /note -->

### <a id="s-gnnBroadcastWire"></a>`gnnBroadcastWire()`

function · **exported** · L48–55

- called by: [`tickWorldSync`](../net/worldsync.js.md#s-tickWorldSync) _js/net/worldsync.js_

<!-- note:gnnBroadcastWire -->
Public text-only broadcast wire. Never publish action callbacks or site announcements.
<!-- /note -->
