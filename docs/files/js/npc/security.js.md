# js/npc/security.js

[index](../../../README.md) · 352 lines · 35 symbols · 5 imports · 8 importers

## About

<!-- note:@file -->
LIVING GALAXY — somebody answers the radio.

Until now nothing in this sky ever called for help and nothing ever came.
There was an authored distress corpus in js/speech/ that no system was
wired to, a `"responding"` job string that was only ever a label, and six
`security` hulls whose entire difference from a trader was that they
docked for a shorter time and carried no cargo. A pirate wing's outcome
was rolled from the seed before the first round was fired.

This module is the missing half. It holds three things:

  THE DISTRESS BUS   anything that gets shot at can put out a call. A call
                     names the victim, the attacker and where it happened,
                     and it lives for a while whether or not anyone comes.

  THE DIRECTORATE    one chartered outfit per sky that answers those calls.
                     It is a real corporation in corps.js with a standing
                     you can move, it flies every patrol and security hull
                     in the roster, and it keeps a quick-reaction wing at
                     the ports that pay for one.

  THE CLOCK          the part that matters to a player deciding whether to
                     press an attack: a dispatched response has an ETA, it
                     is honest, and it is on the HUD. You can read the
                     timer and decide to be gone before it lands.

Response is not instant and not guaranteed. A call from the belt fringe
with every picket committed elsewhere goes unanswered, and the sky is
meant to have places where that is reliably true — which is what makes the
patrolled lanes worth something.

- L7 · `export const CALL_TTL = 300;` — a call stays open this long, answered or not
- L8 · `export const CALL_COOLDOWN = 45;` — one hull cannot spam the channel
- L9 · `export const SCRAMBLE_S = 8;` — from call to wheels-up at a port
- L10 · `export const RESPONSE_R = 140000;` — a call further than this from any picket or port is nobody's problem
- L11 · `export const ON_SCENE_R = 900;` — close enough to be "on scene" and start shooting
- L12 · `export const HELP_SPEED = 2600;` — the run-in speed a responding picket sustains
- L13 · `export const HOLD_AFTER_S = 70;` — how long a wing stays on station after the shooting stops
- L14 · `export const LATE_GRACE = 25;` — seconds past the ETA before the promise is re-cut or withdrawn
- L15 · `export const QRF_PER_PORT = 2;` — quick-reaction hulls a port keeps ringed up
- L16 · `export const QRF_RING = 2600;` — and the radius they ring it at
- L18 · `export const distress = [];` — live calls, oldest first
- L27 · `const lastCall = new Map();` — victim id → sky time of its last call
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../station/stations.js` | `stations` as `liveStations` | [js/station/stations.js](../station/stations.js.md) |
| 2 | `./traffic.js` | `traffic`, `vesselById`, `trafficHooks`, `LAW_ROLES`, `HOSTILE_ROLES`, `markVesselDown` **unused** | [js/npc/traffic.js](traffic.js.md) |
| 3 | `../corp/corps.js` | `corps`, `corpById`, `corpOfVessel`, `corpRelation`, `adjustStanding` | [js/corp/corps.js](../corp/corps.js.md) |
| 4 | `./flight.js` | `flyStep`, `armFlight` | [js/npc/flight.js](flight.js.md) |
| 5 | `../core/perf.js` | `waveCap` | [js/core/perf.js](../core/perf.js.md) |

## Imported by

- [js/corp/seclevel.js](../corp/seclevel.js.md) — `callForHelp`, `callById`, `securityCorp`, `etaOf`
- [js/npc/combat.js](combat.js.md) — `noteAttack`, `callForHelp`
- [js/npc/ground.js](ground.js.md) — `distress`
- [js/sim/sim.js](../sim/sim.js.md) — `resetSecurity`, `stepSecurity`, `mountSecurity`, `assignGuards`, `securityHooks`, `securityCorp`, `securityReport`, `callForHelp`, `distress`, `nearestCall`, `etaOf`
- test/qrf.test.mjs _(outside js/)_ — `securityCorp`, `callById`
- test/reactive.test.mjs _(outside js/)_ — `distress`, `stepSecurity`, `securityCorp`, `securityReport`, `callForHelp`, `etaOf`, `coverageFor`, `isLaw`, `SCRAMBLE_S`, `HELP_SPEED`, `assignGuards`
- test/rogues.test.mjs _(outside js/)_ — `stepSecurity`
- test/seclevel.test.mjs _(outside js/)_ — `distress`, `securityCorp`, `stepSecurity`, `callById`

## Exports

- [`CALL_TTL`](#s-CALL_TTL) · const — **no importer in scanned roots**
- [`CALL_COOLDOWN`](#s-CALL_COOLDOWN) · const — **no importer in scanned roots**
- [`SCRAMBLE_S`](#s-SCRAMBLE_S) · const — used by test/reactive.test.mjs
- [`RESPONSE_R`](#s-RESPONSE_R) · const — **no importer in scanned roots**
- [`ON_SCENE_R`](#s-ON_SCENE_R) · const — **no importer in scanned roots**
- [`HELP_SPEED`](#s-HELP_SPEED) · const — used by test/reactive.test.mjs
- [`HOLD_AFTER_S`](#s-HOLD_AFTER_S) · const — **no importer in scanned roots**
- [`LATE_GRACE`](#s-LATE_GRACE) · const — **no importer in scanned roots**
- [`QRF_PER_PORT`](#s-QRF_PER_PORT) · const — **no importer in scanned roots**
- [`QRF_RING`](#s-QRF_RING) · const — **no importer in scanned roots**
- [`distress`](#s-distress) · const — used by [js/npc/ground.js](ground.js.md), [js/sim/sim.js](../sim/sim.js.md), test/reactive.test.mjs, test/seclevel.test.mjs
- [`securityHooks`](#s-securityHooks) · const — used by [js/sim/sim.js](../sim/sim.js.md)
- [`resetSecurity`](#s-resetSecurity) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`securityCorp`](#s-securityCorp) · function — used by [js/corp/seclevel.js](../corp/seclevel.js.md), [js/sim/sim.js](../sim/sim.js.md), test/qrf.test.mjs, test/reactive.test.mjs, test/seclevel.test.mjs
- [`isLaw`](#s-isLaw) · function — used by test/reactive.test.mjs
- [`coverageFor`](#s-coverageFor) · function — used by test/reactive.test.mjs
- [`callForHelp`](#s-callForHelp) · function — used by [js/corp/seclevel.js](../corp/seclevel.js.md), [js/npc/combat.js](combat.js.md), [js/sim/sim.js](../sim/sim.js.md), test/reactive.test.mjs
- [`noteAttack`](#s-noteAttack) · function — used by [js/npc/combat.js](combat.js.md)
- [`dispatch`](#s-dispatch) · function — **no importer in scanned roots**
- [`etaOf`](#s-etaOf) · function — used by [js/corp/seclevel.js](../corp/seclevel.js.md), [js/sim/sim.js](../sim/sim.js.md), test/reactive.test.mjs
- [`callById`](#s-callById) · function — used by [js/corp/seclevel.js](../corp/seclevel.js.md), test/qrf.test.mjs, test/seclevel.test.mjs
- [`nearestCall`](#s-nearestCall) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`flyResponse`](#s-flyResponse) · function — **no importer in scanned roots**
- [`assignGuards`](#s-assignGuards) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/reactive.test.mjs
- [`flyGuard`](#s-flyGuard) · function — **no importer in scanned roots**
- [`stepSecurity`](#s-stepSecurity) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/reactive.test.mjs, test/rogues.test.mjs, test/seclevel.test.mjs
- [`mountSecurity`](#s-mountSecurity) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`securityReport`](#s-securityReport) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/reactive.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-CALL_TTL"></a>`CALL_TTL`

const · **exported** · L7–7

<!-- note:CALL_TTL -->
---- tuning --------------------------------------------------------------
<!-- /note -->

### <a id="s-CALL_COOLDOWN"></a>`CALL_COOLDOWN`

const · **exported** · L8–8

<!-- note:CALL_COOLDOWN -->
<!-- /note -->

### <a id="s-SCRAMBLE_S"></a>`SCRAMBLE_S`

const · **exported** · L9–9

<!-- note:SCRAMBLE_S -->
<!-- /note -->

### <a id="s-RESPONSE_R"></a>`RESPONSE_R`

const · **exported** · L10–10

<!-- note:RESPONSE_R -->
<!-- /note -->

### <a id="s-ON_SCENE_R"></a>`ON_SCENE_R`

const · **exported** · L11–11

<!-- note:ON_SCENE_R -->
<!-- /note -->

### <a id="s-HELP_SPEED"></a>`HELP_SPEED`

const · **exported** · L12–12

<!-- note:HELP_SPEED -->
<!-- /note -->

### <a id="s-HOLD_AFTER_S"></a>`HOLD_AFTER_S`

const · **exported** · L13–13

<!-- note:HOLD_AFTER_S -->
<!-- /note -->

### <a id="s-LATE_GRACE"></a>`LATE_GRACE`

const · **exported** · L14–14

<!-- note:LATE_GRACE -->
<!-- /note -->

### <a id="s-QRF_PER_PORT"></a>`QRF_PER_PORT`

const · **exported** · L15–15

<!-- note:QRF_PER_PORT -->
<!-- /note -->

### <a id="s-QRF_RING"></a>`QRF_RING`

const · **exported** · L16–16

<!-- note:QRF_RING -->
<!-- /note -->

### <a id="s-distress"></a>`distress`

const · **exported** · L18–18

<!-- note:distress -->
<!-- /note -->

### <a id="s-securityHooks"></a>`securityHooks`

const · **exported** · L19–19

<!-- note:securityHooks -->
<!-- /note -->

### <a id="s-victimOf"></a>`victimOf(id)`

function · L21–23

- calls: [`vesselById`](traffic.js.md#s-vesselById) _js/npc/traffic.js_
- called by: [`flyResponse`](#s-flyResponse) · [`stepSecurity`](#s-stepSecurity)

<!-- note:victimOf -->
0.3.48: a call can come from the player (js/corp/seclevel.js SOS). "self" is not
in the traffic list, so the scene is read through a hook the sim installs.
<!-- /note -->

### <a id="s-seq"></a>`seq`

const · L25–25

<!-- note:seq -->
<!-- /note -->

### <a id="s-lawCorpId"></a>`lawCorpId`

const · L26–26

<!-- note:lawCorpId -->
<!-- /note -->

### <a id="s-lastCall"></a>`lastCall`

const · L27–27

<!-- note:lastCall -->
<!-- /note -->

### <a id="s-resetSecurity"></a>`resetSecurity()`

function · **exported** · L29–34

- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:resetSecurity -->
<!-- /note -->

### <a id="s-securityCorp"></a>`securityCorp()`

function · **exported** · L36–41

- calls: [`corpById`](../corp/corps.js.md#s-corpById) _js/corp/corps.js_
- via [js/corp/corps.js](../corp/corps.js.md): `corps.find`
- called by: [`addHeat`](../corp/seclevel.js.md#s-addHeat) _js/corp/seclevel.js_ · [`payFine`](../corp/seclevel.js.md#s-payFine) _js/corp/seclevel.js_ · [`secLevel`](../corp/seclevel.js.md#s-secLevel) _js/corp/seclevel.js_ · [`stepSecLevel`](../corp/seclevel.js.md#s-stepSecLevel) _js/corp/seclevel.js_ · [`wingArrived`](../corp/seclevel.js.md#s-wingArrived) _js/corp/seclevel.js_ · [`coverageFor`](#s-coverageFor) · [`securityReport`](#s-securityReport) · [`stepSecurity`](#s-stepSecurity) · [`wireReactiveSky`](../sim/sim.js.md#s-wireReactiveSky) _js/sim/sim.js_ ×2

<!-- note:securityCorp -->
---- the directorate ------------------------------------------------------

The sky's security corporation, if this sky has one.
<!-- /note -->

### <a id="s-isLaw"></a>`isLaw(n)`

function · **exported** · L43–45

- via [js/npc/traffic.js](traffic.js.md): `LAW_ROLES.has`
- called by: [`assignGuards`](#s-assignGuards) · [`freeResponders`](#s-freeResponders)

<!-- note:isLaw -->
Does this hull answer to the directorate?
<!-- /note -->

### <a id="s-coverageFor"></a>`coverageFor(n)`

function · **exported** · L47–57

- calls: [`corpOfVessel`](../corp/corps.js.md#s-corpOfVessel) _js/corp/corps.js_ · [`corpRelation`](../corp/corps.js.md#s-corpRelation) _js/corp/corps.js_ · [`securityCorp`](#s-securityCorp)
- via [js/npc/traffic.js](traffic.js.md): `HOSTILE_ROLES.has`
- called by: [`callForHelp`](#s-callForHelp)

<!-- note:coverageFor -->
Whether the directorate will lift a finger for this victim. Its own hulls
and the ports that pay it, always; a corporation it is at odds with, only
grudgingly; a free port's raider, never.

- L55 · `const standing = (co.standing ?? 0) / 100;` — standing with the directorate is the player's lever: fly clean and the
  cavalry comes for you too
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L59–59 · **never referenced**

<!-- note:d3 -->
---- raising a call -------------------------------------------------------
<!-- /note -->

### <a id="s-callForHelp"></a>`callForHelp(victim, attacker, t, kind=, opts=)`

function · **exported** · L61–103

- calls: [`corpOfVessel`](../corp/corps.js.md#s-corpOfVessel) _js/corp/corps.js_ · [`coverageFor`](#s-coverageFor) · [`dispatch`](#s-dispatch)
- called by: [`callSOS`](../corp/seclevel.js.md#s-callSOS) _js/corp/seclevel.js_ · [`combatFly`](combat.js.md#s-combatFly) _js/npc/combat.js_ · [`noteAttack`](#s-noteAttack) · [`wireReactiveSky`](../sim/sim.js.md#s-wireReactiveSky) _js/sim/sim.js_

<!-- note:callForHelp -->
Something is shooting at `victim`. Opens a call, or refreshes the one it
already has open. `attacker` may be a contact, a hull, or the player
(pass `{ id: "self", name, player: true }`).

- L92 · `eta: null,` — sky time the first responder is due on scene
<!-- /note -->

### <a id="s-noteAttack"></a>`noteAttack(victimId, attacker, t, kind=)`

function · **exported** · L105–111

- calls: [`callForHelp`](#s-callForHelp) · [`vesselById`](traffic.js.md#s-vesselById) _js/npc/traffic.js_
- called by: [`damageHull`](combat.js.md#s-damageHull) _js/npc/combat.js_

<!-- note:noteAttack -->
Shorthand used by the combat code: an id took a hit from an id.
<!-- /note -->

### <a id="s-freeResponders"></a>`freeResponders(call, stationList)`

function · L113–123

- calls: [`isLaw`](#s-isLaw)
- called by: [`dispatch`](#s-dispatch)

<!-- note:freeResponders -->
---- dispatch -------------------------------------------------------------
<!-- /note -->

### <a id="s-coveringPort"></a>`coveringPort(call, stationList)`

function · L125–134

- called by: [`dispatch`](#s-dispatch)

<!-- note:coveringPort -->
Nearest port that would send its own quick-reaction hulls.

- L130 · `const reach = st.sector === "military" ? RESPONSE_R : RESPONSE_R * 0.45;` — a military port reaches further than a farm does
<!-- /note -->

### <a id="s-dispatch"></a>`dispatch(call, t, stationList=)`

function · **exported** · L136–174

- calls: [`waveCap`](../core/perf.js.md#s-waveCap) _js/core/perf.js_ · [`coveringPort`](#s-coveringPort) · [`freeResponders`](#s-freeResponders)
- called by: [`callForHelp`](#s-callForHelp) · [`stepSecurity`](#s-stepSecurity)

<!-- note:dispatch -->
Work out who is coming and when. Sets `call.eta` to a sky time, which is
what the HUD counts down — the number the player is deciding against.

- L144 · `const willing = call.coverage >= 1 ? want : Math.round(want * call.coverage);` — a roll against coverage decides whether anyone is actually free for this;
  a marginal corporation gets a picket some of the time, not every time
- L155 · `const eta = t + SCRAMBLE_S + d / HELP_SPEED;` — run-in time: the distance at the speed a picket sustains, plus the
  seconds it takes to break off whatever it was doing
- L159 · `if (!take && port && port.d < QRF_RING * 14) {` — nothing free in the sky, but a port close enough to scramble its own
<!-- /note -->

### <a id="s-etaOf"></a>`etaOf(call, t)`

function · **exported** · L176–179

- called by: [`callSOS`](../corp/seclevel.js.md#s-callSOS) _js/corp/seclevel.js_ · [`secLevel`](../corp/seclevel.js.md#s-secLevel) _js/corp/seclevel.js_ · [`securityReport`](#s-securityReport) · [`publishHud`](../sim/sim.js.md#s-publishHud) _js/sim/sim.js_ · [`wireReactiveSky`](../sim/sim.js.md#s-wireReactiveSky) _js/sim/sim.js_ ×2

<!-- note:etaOf -->
Seconds until the first responder is on scene, or null if nobody is coming.
<!-- /note -->

### <a id="s-callById"></a>`callById(id)`

function · **exported** · L181–183

- called by: [`callSOS`](../corp/seclevel.js.md#s-callSOS) _js/corp/seclevel.js_ · [`secLevel`](../corp/seclevel.js.md#s-secLevel) _js/corp/seclevel.js_ · [`stepSecLevel`](../corp/seclevel.js.md#s-stepSecLevel) _js/corp/seclevel.js_ · [`flyResponse`](#s-flyResponse)

<!-- note:callById -->
The call a hull is flying to, if any.
<!-- /note -->

### <a id="s-nearestCall"></a>`nearestCall(pos, maxR=)`

function · **exported** · L185–193

- called by: [`publishHud`](../sim/sim.js.md#s-publishHud) _js/sim/sim.js_

<!-- note:nearestCall -->
The live call nearest a point — what the HUD shows a countdown for.
<!-- /note -->

### <a id="s-flyResponse"></a>`flyResponse(n, t, dt)`

function · **exported** · L195–229

- calls: [`armFlight`](flight.js.md#s-armFlight) _js/npc/flight.js_ · [`flyStep`](flight.js.md#s-flyStep) _js/npc/flight.js_ ×2 · [`callById`](#s-callById) · [`victimOf`](#s-victimOf) · [`vesselById`](traffic.js.md#s-vesselById) _js/npc/traffic.js_
- called by: [`mountSecurity`](#s-mountSecurity)

<!-- note:flyResponse -->
---- the responder's own flying -------------------------------------------

A hull on a response flies the call, not its timetable. Returns true when
it has taken the hull over for this tick, so the timetable leaves it alone.

- L204 · `const v = victimOf(call.victimId);` — the scene follows the victim while the victim is still flying
- L212 · `n.fly.top = HELP_SPEED;` — the run-in: flat out, nose on the scene
- L217 · `if (!call.arrivedAt) {` — on scene: mark the arrival once, then hold a firing position on the
  attacker if there is one to hold on
<!-- /note -->

### <a id="s-assignGuards"></a>`assignGuards(stationList=)`

function · **exported** · L231–246

- calls: [`isLaw`](#s-isLaw)
- via [js/npc/traffic.js](traffic.js.md): `traffic.filter`
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:assignGuards -->
---- port quick-reaction wings -------------------------------------------

Ports that pay for security keep hulls ringed up outside the mouth. These
are ordinary roster hulls with a `guard` assignment; they orbit their port
until a call inside their reach pulls them off it.

- L234 · `ports.sort((a, b) => (b.sector === "military" ? 1 : 0) - (a.sector === "military" ? 1 : 0)` — biggest and most exposed first: military, then by radius
<!-- /note -->

### <a id="s-flyGuard"></a>`flyGuard(n, t, dt, stationList=)`

function · **exported** · L248–264

- calls: [`armFlight`](flight.js.md#s-armFlight) _js/npc/flight.js_ · [`flyStep`](flight.js.md#s-flyStep) _js/npc/flight.js_
- called by: [`mountSecurity`](#s-mountSecurity)

<!-- note:flyGuard -->
A guard hull's patrol ring around its port. Returns true if it flew the hull.
<!-- /note -->

### <a id="s-stepSecurity"></a>`stepSecurity(t, dt, stationList=)`

function · **exported** · L266–326

- calls: [`waveCap`](../core/perf.js.md#s-waveCap) _js/core/perf.js_ · [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_ · [`dispatch`](#s-dispatch) · [`securityCorp`](#s-securityCorp) · [`victimOf`](#s-victimOf) · [`vesselById`](traffic.js.md#s-vesselById) _js/npc/traffic.js_ ×3
- via [js/npc/traffic.js](traffic.js.md): `traffic.filter`
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepSecurity -->
---- the tick -------------------------------------------------------------

Age the calls, retire the ones nobody is shooting at any more, and send
the wings home. Everything that flies a hull happens through the director
hook installed below; this is only the bookkeeping.

- L273 · `if (c.qrfPending && c.eta != null && t > c.at + SCRAMBLE_S * 1.6) {` — a pending port scramble becomes real hulls once the scramble time is up
- L287 · `if (c.state === "dispatched" && c.eta != null && !c.arrivedAt && t > c.eta + LATE_GRACE) {` — A promise with a clock on it has to come good or be withdrawn. If the
  ETA has come and gone and nothing is on scene — the wing was destroyed
  on the way, or pulled onto something nearer — try once more off whoever
  is free now, and if there is nobody, say so. A timer that counts past
  zero and keeps counting is worse than no timer.
- L296 · `let soonest = Infinity;` — somebody is still inbound, just slower than the estimate: re-cut the
  clock off where they actually are rather than leaving it at zero
- L310 · `const quiet = t - Math.max(c.lastHitAt ?? c.at, c.sos && c.eta != null && !c.arrivedAt ? c` — 0.3.49: a player's SOS made before the shooting starts is quiet by
  definition, and was closed 70 s after the call — before a wing from the
  far side of the ring could arrive. It holds until the wing is due.
- L320 · `const law = securityCorp();` — the directorate's record: a call it reached is worth something to it
<!-- /note -->

### <a id="s-mountSecurity"></a>`mountSecurity()`

function · **exported** · L328–335

- calls: [`flyGuard`](#s-flyGuard) · [`flyResponse`](#s-flyResponse)
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:mountSecurity -->
The director: given a hull and a tick, fly it if security has a claim on
it. Installed onto `trafficHooks` so traffic.js never has to import this
module and the two can be reasoned about separately.
<!-- /note -->

### <a id="s-securityReport"></a>`securityReport(t)`

function · **exported** · L337–352

- calls: [`etaOf`](#s-etaOf) · [`securityCorp`](#s-securityCorp)
- via [js/npc/traffic.js](traffic.js.md): `traffic.filter`

<!-- note:securityReport -->
Everything the console and the HUD want to know about the response picture.
<!-- /note -->
