# js/drones/roles.js

[index](../../../README.md) · 109 lines · 17 symbols · 0 imports · 6 importers

## About

<!-- note:@file -->
LIVING GALAXY — the drone roles.

Pure data: what each kind of work drone is, where it can be built, what the
robot generator grows for it, and what it asks you once it rolls off the
line. The behaviour lives in ops.js; the machine in droneforge.js.

One role per industry the careers already name, so a drone is the robot
version of a job a captain or a crew hand could hold:

  miner      mining            cuts rock at a site, stashes ore at home
  hauler     logistics         shuttles for your miners, or runs NPC freight
  combat     security          defends home, guards a slot, or patrols a route
  salvager   salvage           tractors wreck and debris, stashes the scrap
  surveyor   research          sweeps an area, assays, marks the rich veins
  harvester  energy            ice off the frost pockets, or gas off a giant
  courier    commerce          buys low at one port, sells high at another
  relay      communications    parks on a point; an early-warning picket
  repair     shipyard          follows a ship, drone or port and patches it

Drones are the small end of the board: a third to half the hold of the
crewed hull doing the same job, a little faster on the legs and quicker on
the clamps, and they never stop to eat. A company fields them — yours or an
NPC corporation's — and they share one work board (board.js) with the
crewed hulls, so a freight slot a drone takes is a slot a captain does not.

Numbers are in world units (1 u = 10 m) and sim seconds.

- L1 · `export const DRONE_CAP = 10;` — drones a company may field in one sky
- L2 · `export const LANE_SPEED = 36000;` — u/s: a drone's micro-warp across a belt or between neighbours (a crewed hull warps at 30k)
- L3 · `export const JUMP_SPEED = 55000;` — u/s: cross-system legs ride the same warp you do
- L4 · `export const NEAR_SPEED = 640;` — u/s: working pace near a site (crewed hulls close at ~500)
- L5 · `export const LANE_OVER = 16000;` — legs longer than this take the micro-warp
- L6 · `export const JUMP_OVER = 800000;` — legs longer than this take the warp
- L7 · `export const DOCK_SECS = 4;` — clamps, stash, undock — no crew to walk off the ramp
- L8 · `export const PRICE_K = 0.1;` — robotgen parts cost → credits (a starter miner lands near 3k)
<!-- /note -->

## Imports

_none_

## Imported by

- [js/console/panels/work-drones.js](../console/panels/work-drones.js.md) — `DRONE_ROLES`, `ASK_LABEL`
- [js/drones/dronespec.js](dronespec.js.md) — `DRONE_ROLES`
- [js/drones/npcdrones.js](npcdrones.js.md) — `DRONE_ROLES`, `LANE_SPEED`, `NEAR_SPEED`, `LANE_OVER`, `JUMP_SPEED`, `JUMP_OVER`, `DOCK_SECS`
- [js/drones/ops.js](ops.js.md) — `DRONE_ROLES`, `DRONE_CAP`, `LANE_SPEED`, `NEAR_SPEED`, `LANE_OVER`, `JUMP_SPEED`, `JUMP_OVER`, `DOCK_SECS`, `PRICE_K`, `rolesAt`
- [js/station/stationdeck.js](../station/stationdeck.js.md) — `DRONE_ROLES`
- test/portdrones.test.mjs _(outside js/)_ — `DRONE_CAP`

## Exports

- [`DRONE_CAP`](#s-DRONE_CAP) · const — used by [js/drones/ops.js](ops.js.md), test/portdrones.test.mjs
- [`LANE_SPEED`](#s-LANE_SPEED) · const — used by [js/drones/npcdrones.js](npcdrones.js.md), [js/drones/ops.js](ops.js.md)
- [`JUMP_SPEED`](#s-JUMP_SPEED) · const — used by [js/drones/npcdrones.js](npcdrones.js.md), [js/drones/ops.js](ops.js.md)
- [`NEAR_SPEED`](#s-NEAR_SPEED) · const — used by [js/drones/npcdrones.js](npcdrones.js.md), [js/drones/ops.js](ops.js.md)
- [`LANE_OVER`](#s-LANE_OVER) · const — used by [js/drones/npcdrones.js](npcdrones.js.md), [js/drones/ops.js](ops.js.md)
- [`JUMP_OVER`](#s-JUMP_OVER) · const — used by [js/drones/npcdrones.js](npcdrones.js.md), [js/drones/ops.js](ops.js.md)
- [`DOCK_SECS`](#s-DOCK_SECS) · const — used by [js/drones/npcdrones.js](npcdrones.js.md), [js/drones/ops.js](ops.js.md)
- [`PRICE_K`](#s-PRICE_K) · const — used by [js/drones/ops.js](ops.js.md)
- [`DRONE_ROLES`](#s-DRONE_ROLES) · const — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md), [js/drones/dronespec.js](dronespec.js.md), [js/drones/npcdrones.js](npcdrones.js.md), [js/drones/ops.js](ops.js.md), [js/station/stationdeck.js](../station/stationdeck.js.md)
- [`ROLE_IDS`](#s-ROLE_IDS) · const — **no importer in scanned roots**
- [`rolesAt`](#s-rolesAt) · function — used by [js/drones/ops.js](ops.js.md)
- [`ASK_LABEL`](#s-ASK_LABEL) · const — used by [js/console/panels/work-drones.js](../console/panels/work-drones.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-DRONE_CAP"></a>`DRONE_CAP`

const · **exported** · L1–1

<!-- note:DRONE_CAP -->
<!-- /note -->

### <a id="s-LANE_SPEED"></a>`LANE_SPEED`

const · **exported** · L2–2

<!-- note:LANE_SPEED -->
<!-- /note -->

### <a id="s-JUMP_SPEED"></a>`JUMP_SPEED`

const · **exported** · L3–3

<!-- note:JUMP_SPEED -->
<!-- /note -->

### <a id="s-NEAR_SPEED"></a>`NEAR_SPEED`

const · **exported** · L4–4

<!-- note:NEAR_SPEED -->
<!-- /note -->

### <a id="s-LANE_OVER"></a>`LANE_OVER`

const · **exported** · L5–5

<!-- note:LANE_OVER -->
<!-- /note -->

### <a id="s-JUMP_OVER"></a>`JUMP_OVER`

const · **exported** · L6–6

<!-- note:JUMP_OVER -->
<!-- /note -->

### <a id="s-DOCK_SECS"></a>`DOCK_SECS`

const · **exported** · L7–7

<!-- note:DOCK_SECS -->
<!-- /note -->

### <a id="s-PRICE_K"></a>`PRICE_K`

const · **exported** · L8–8

<!-- note:PRICE_K -->
<!-- /note -->

### <a id="s-IND"></a>`IND`

const · L10–10

<!-- note:IND -->
who can build what: a port's sector decides its drone lines
<!-- /note -->

### <a id="s-LOG"></a>`LOG`

const · L11–11

<!-- note:LOG -->
<!-- /note -->

### <a id="s-MIL"></a>`MIL`

const · L12–12

<!-- note:MIL -->
<!-- /note -->

### <a id="s-CIV"></a>`CIV`

const · L13–13

<!-- note:CIV -->
<!-- /note -->

### <a id="s-AGR"></a>`AGR`

const · L14–14

<!-- note:AGR -->
<!-- /note -->

### <a id="s-DRONE_ROLES"></a>`DRONE_ROLES`

const · **exported** · L16–94

<!-- note:DRONE_ROLES -->
<!-- /note -->

### <a id="s-ROLE_IDS"></a>`ROLE_IDS`

const · **exported** · L96–96

<!-- note:ROLE_IDS -->
<!-- /note -->

### <a id="s-rolesAt"></a>`rolesAt(st)`

function · **exported** · L98–102

- called by: [`buildOptions`](ops.js.md#s-buildOptions) _js/drones/ops.js_

<!-- note:rolesAt -->
Roles a port's lines can build (a claimed free port builds its sector's too).
<!-- /note -->

### <a id="s-ASK_LABEL"></a>`ASK_LABEL`

const · **exported** · L104–109

<!-- note:ASK_LABEL -->
What each setup question is called on the deck.
<!-- /note -->
