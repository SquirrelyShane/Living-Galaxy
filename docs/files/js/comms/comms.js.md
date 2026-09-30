# js/comms/comms.js

[index](../../../README.md) · 738 lines · 70 symbols · 23 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — the comms director.

Four kinds of traffic run through one channel overlay:

  NPC → you     a port sees you on approach, a free port makes a demand,
                a guard warns you off. They ring the puck; you answer or not.
  you → NPC     HAIL on the AUX page calls whatever is locked, the port you
                are clamped to, or the nearest port. Scripted dialogue with
                real consequences — clearances open clamps, tolls cost credits,
                refusals cost standing.
  NPC ↔ NPC     the open channels: ports talking to each other. Overheard on
                the ticker when LISTEN is on, logged to the flight log.
  you ↔ pilot   another human on the same server (js/net/net.js). Live call:
                free text both ways, light-lag from real range, no script.

Scripted calls run on sim time, so TIME and pause govern them. Live calls
run on the wall clock — the other pilot's clock is not yours to compress.

- L28 · `const CARRIER_RANGE = 240000;` — beyond this the lag is minutes: no carrier
- L30 · `const MS_PER_UNIT = 0.02;` — 9000 u → 180 ms; 60000 u → 1.2 s
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./call-session.js` | `CallSession`, `CallState` | [js/comms/call-session.js](call-session.js.md) |
| 2 | `./call-ui.js` | `CallUI` | [js/comms/call-ui.js](call-ui.js.md) |
| 3 | `./call-scripts.js` | `approachScript`, `guardScript`, `laneScript`, `marketScript`, `newsScript`, `pirateScript`, `portScript`, `trafficLines`, `undockScript`, `vesselScript` | [js/comms/call-scripts.js](call-scripts.js.md) |
| 4 | `../npc/traffic.js` | `traffic`, `trafficHooks`, `vesselById`, `vesselStatus`, `captainLine` | [js/npc/traffic.js](../npc/traffic.js.md) |
| 5 | `../npc/battles.js` | `fightCentre` | [js/npc/battles.js](../npc/battles.js.md) |
| 6 | `../npc/cradle.js` | `cradle`, `traitLine` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 7 | `../sim/sim.js` | `addBodyWaypoint`, `addWaypointAt`, `addAnchoredWaypoint`, `logEvent`, `selectBody`, `sim`, `takeSalvageContract`, `toggleDock`, `portWants` | [js/sim/sim.js](../sim/sim.js.md) |
| 8 | `../world/bodies.js` | `BODIES`, `bodyTempK` | [js/world/bodies.js](../world/bodies.js.md) |
| 9 | `../station/stations.js` | `nearestStation`, `stationById`, `stations` | [js/station/stations.js](../station/stations.js.md) |
| 10 | `../flight/turrets.js` | `contacts` | [js/flight/turrets.js](../flight/turrets.js.md) |
| 11 | `../station/stationworks.js` | `requestDock`, `hasDockRequest` | [js/station/stationworks.js](../station/stationworks.js.md) |
| 12 | `../corp/corps.js` | `adjustStanding`, `corpOfStation`, `corpOfVessel`, `standingLabel` | [js/corp/corps.js](../corp/corps.js.md) |
| 13 | `../economy/materials.js` | `baseValue` | [js/economy/materials.js](../economy/materials.js.md) |
| 14 | `../economy/economy.js` | `shortagesOf` | [js/economy/economy.js](../economy/economy.js.md) |
| 15 | `../flight/pilot.js` | `pilot` | [js/flight/pilot.js](../flight/pilot.js.md) |
| 16 | `../interior/boarding.js` | `launchPod` | [js/interior/boarding.js](../interior/boarding.js.md) |
| 17 | `../net/net.js` | `net`, `onMessage` | [js/net/net.js](../net/net.js.md) |
| 18 | `../audio/index.js` | `WARN`, `CREW` | [js/audio/index.js](../audio/index.js.md) |
| 19 | `../world/generate.js` | `rngFromSeed` | [js/world/generate.js](../world/generate.js.md) |
| 20 | `./chat.js` | `post` as `chatPost` | [js/comms/chat.js](chat.js.md) |
| 21 | `./gnn.js` | `gnnPost` | [js/comms/gnn.js](gnn.js.md) |
| 22 | `../npc/reports.js` | `groundedReport`, `urgentReport`, `transitionReport`, `resetReports` | [js/npc/reports.js](../npc/reports.js.md) |
| 23 | `../npc/speech.js` | `SIGN_OFF`, `chatter` as `speechChatter`, `noteLost`, `resetSpeech`, `speechStats`, `talkChips`, `talkTo`, `regardOf` | [js/npc/speech.js](../npc/speech.js.md) |

## Imported by

- [js/ui/chatbox.js](../ui/chatbox.js.md) — `comms`
- [js/ui/hud.js](../ui/hud.js.md) — `mountComms`, `wireCommsTest`

## Exports

- [`comms`](#s-comms) · const — used by [js/ui/chatbox.js](../ui/chatbox.js.md)
- [`hail`](#s-hail) · function — **no importer in scanned roots**
- [`mountComms`](#s-mountComms) · function — used by [js/ui/hud.js](../ui/hud.js.md)
- [`wireCommsTest`](#s-wireCommsTest) · function — used by [js/ui/hud.js](../ui/hud.js.md)

## Effects

- **bus.on** — `node on session` (attach:87) · `choice on session` (attach:90) · `closed on session` (attach:93) · `state on session` (attach:103) · `line on session` (attach:104) · `say on s` (peerSession:480) · `state on sess` (onPeerMessage:509)
- **dom.id** — `‹id›` ($:45) · `aux-hail-st` (paintAux:593) · `aux-comms-st` (paintAux:594) · `aux-hail` (paintAux:610, mountComms:641) · `aux-comms` (paintAux:611, mountComms:647) · `aux-listen-st` (paintAux:612) · `aux-listen` (paintAux:613, mountComms:642)
- **event.listen** — `click on $() → (inline)` (mountComms:641, mountComms:642, mountComms:647) · `keydown on window → (inline)` (mountComms:653)
- **input.key** — `KeyH` (mountComms:656)
- **timer** — `requestAnimationFrame` (mountComms>loop:661, mountComms:664)

## Symbols

### <a id="s-APPROACH_RANGE"></a>`APPROACH_RANGE`

const · L25–25

<!-- note:APPROACH_RANGE -->
<!-- /note -->

### <a id="s-PIRATE_RANGE"></a>`PIRATE_RANGE`

const · L26–26

<!-- note:PIRATE_RANGE -->
<!-- /note -->

### <a id="s-HAIL_RANGE"></a>`HAIL_RANGE`

const · L27–27

<!-- note:HAIL_RANGE -->
<!-- /note -->

### <a id="s-CARRIER_RANGE"></a>`CARRIER_RANGE`

const · L28–28

<!-- note:CARRIER_RANGE -->
<!-- /note -->

### <a id="s-CHATTER_RANGE"></a>`CHATTER_RANGE`

const · L29–29

<!-- note:CHATTER_RANGE -->
<!-- /note -->

### <a id="s-MS_PER_UNIT"></a>`MS_PER_UNIT`

const · L30–30

<!-- note:MS_PER_UNIT -->
<!-- /note -->

### <a id="s-COOLDOWN"></a>`COOLDOWN`

const · L31–31

<!-- note:COOLDOWN -->
<!-- /note -->

### <a id="s-comms"></a>`comms`

const · **exported** · L33–43

<!-- note:comms -->
- L37 · `peerId: null,` — live call: who is on the other end
<!-- /note -->

### <a id="s-S"></a>`$(id)`

function · L45–45

- called by: [`mountComms`](#s-mountComms) ×3 · [`paintAux`](#s-paintAux) ×6
- effects: dom.id `‹id›`

<!-- note:$ -->
<!-- /note -->

### <a id="s-clamp"></a>`clamp(v, lo, hi)`

function · L46–46

- called by: [`quality`](#s-quality)

<!-- note:clamp -->
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L47–47

- called by: [`hailContact`](#s-hailContact) · [`hailStation`](#s-hailStation) · [`nearestPeer`](#s-nearestPeer) · [`noteShootDowns`](#s-noteShootDowns) · [`onVesselTransition`](#s-onVesselTransition) · [`peerSession`](#s-peerSession) · [`stationCall`](#s-stationCall) · [`stationCtx.range`](#s-stationCtx-range) · [`step`](#s-step) · [`stepChatter`](#s-stepChatter) · [`stepIncoming`](#s-stepIncoming) · [`stepMarkets.effect`](#s-stepMarkets-effect) ×2

<!-- note:d3 -->
<!-- /note -->

### <a id="s-quality"></a>`quality(d)`

function · L48–48

- calls: [`clamp`](#s-clamp)
- called by: [`hailContact`](#s-hailContact) · [`peerSession`](#s-peerSession) · [`stationCall`](#s-stationCall) · [`step`](#s-step) · [`stepChatter`](#s-stepChatter)

<!-- note:quality -->
<!-- /note -->

### <a id="s-busy"></a>`busy()`

function · L49–49

- called by: [`onPeerMessage`](#s-onPeerMessage) · [`stepIncoming`](#s-stepIncoming)

<!-- note:busy -->
<!-- /note -->

### <a id="s-stationCtx"></a>`stationCtx(st)`

function · L51–81

- calls: [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_
- called by: [`hail`](#s-hail) · [`hailStation`](#s-hailStation) ×2 · [`stepIncoming`](#s-stepIncoming) ×3

<!-- note:stationCtx -->
---- consequences a script can reach for ----------------------------------
<!-- /note -->

#### <a id="s-stationCtx-range"></a>`stationCtx.range()`

prop · L54–54

- calls: [`d3`](#s-d3)

<!-- note:stationCtx.range -->
<!-- /note -->

#### <a id="s-stationCtx-flagged"></a>`stationCtx.flagged()`

prop · L55–55

<!-- note:stationCtx.flagged -->
<!-- /note -->

#### <a id="s-stationCtx-wants"></a>`stationCtx.wants()`

prop · L56–56

- calls: [`portWants`](../sim/sim.js.md#s-portWants) _js/sim/sim.js_
- via [js/sim/sim.js](../sim/sim.js.md): `portWants.filter`, `portWants.filter.map`

<!-- note:stationCtx.wants -->
what the port is short of right now, by how far over book it pays (economy.js)
<!-- /note -->

#### <a id="s-stationCtx-credits"></a>`stationCtx.credits()`

prop · L57–57

<!-- note:stationCtx.credits -->
<!-- /note -->

#### <a id="s-stationCtx-pay"></a>`stationCtx.pay(n, why)`

prop · L58–61

- calls: [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_

<!-- note:stationCtx.pay -->
<!-- /note -->

#### <a id="s-stationCtx-undock"></a>`stationCtx.undock()`

prop · L62–64

- calls: [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_

<!-- note:stationCtx.undock -->
<!-- /note -->

#### <a id="s-stationCtx-request"></a>`stationCtx.request()`

prop · L65–65

- calls: [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`requestDock`](../station/stationworks.js.md#s-requestDock) _js/station/stationworks.js_

<!-- note:stationCtx.request -->
a berth: from here on the entry lane and the mouth hand you to the tractor
<!-- /note -->

#### <a id="s-stationCtx-requested"></a>`stationCtx.requested()`

prop · L66–66

- calls: [`hasDockRequest`](../station/stationworks.js.md#s-hasDockRequest) _js/station/stationworks.js_

<!-- note:stationCtx.requested -->
<!-- /note -->

#### <a id="s-stationCtx-standing"></a>`stationCtx.standing(delta, why)`

prop · L67–67

- calls: [`adjustStanding`](../corp/corps.js.md#s-adjustStanding) _js/corp/corps.js_

<!-- note:stationCtx.standing -->
<!-- /note -->

#### <a id="s-stationCtx-board"></a>`stationCtx.board()`

prop · L68–68

- calls: [`launchPod`](../interior/boarding.js.md#s-launchPod) _js/interior/boarding.js_

<!-- note:stationCtx.board -->
a refused toll inside pod range gets a breach team, not just the guns
<!-- /note -->

#### <a id="s-stationCtx-cargoValue"></a>`stationCtx.cargoValue()`

prop · L69–69

- calls: [`baseValue`](../economy/materials.js.md#s-baseValue) _js/economy/materials.js_

<!-- note:stationCtx.cargoValue -->
<!-- /note -->

#### <a id="s-stationCtx-provoke"></a>`stationCtx.provoke()`

prop · L70–74

- calls: [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_

<!-- note:stationCtx.provoke -->
the guns of a free port answer to the watch — not to relation flags
<!-- /note -->

#### <a id="s-stationCtx-truce"></a>`stationCtx.truce()`

prop · L75–79

- calls: [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_

<!-- note:stationCtx.truce -->
<!-- /note -->

### <a id="s-attach"></a>`attach(session, {…}=)`

function · L83–111

- calls: [`paintAux`](#s-paintAux) ×3 · [`sendPeer`](#s-sendPeer) · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ ×4
- called by: [`hailContact`](#s-hailContact) · [`peerSession`](#s-peerSession) · [`stationCall`](#s-stationCall)
- effects: bus.on `node` · bus.on `choice` · bus.on `closed` · bus.on `state` · bus.on `line`

<!-- note:attach -->
---- session plumbing -----------------------------------------------------

- L107 · `comms.ui.hideChatter();` — the open channels drop out when you are on one
<!-- /note -->

### <a id="s-npcSession"></a>`npcSession(o)`

function · L113–120

- calls: [`new CallSession`](call-session.js.md#s-CallSession) _js/comms/call-session.js_
- called by: [`hailContact`](#s-hailContact) · [`stationCall`](#s-stationCall)

<!-- note:npcSession -->
<!-- /note -->

### <a id="s-cooled"></a>`cooled(key, secs)`

function · L122–125

- called by: [`stepBattles`](#s-stepBattles) · [`stepIncoming`](#s-stepIncoming) ×3 · [`stepMarkets`](#s-stepMarkets) ×4 · [`stepNews`](#s-stepNews)

<!-- note:cooled -->
<!-- /note -->

### <a id="s-cool"></a>`cool(key)`

function · L126–128

- called by: [`hail`](#s-hail) · [`hailStation`](#s-hailStation) ×2 · [`stepBattles`](#s-stepBattles) · [`stepIncoming`](#s-stepIncoming) ×3 · [`stepMarkets`](#s-stepMarkets) ×4 · [`stepNews`](#s-stepNews)

<!-- note:cool -->
<!-- /note -->

### <a id="s-stationCall"></a>`stationCall(st, script, {…}=)`

function · L130–150

- calls: [`attach`](#s-attach) · [`d3`](#s-d3) · [`npcSession`](#s-npcSession) · [`quality`](#s-quality) · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- via [js/audio/index.js](../audio/index.js.md): `CREW.hail`, `WARN.alarm`
- called by: [`hail`](#s-hail) · [`hailStation`](#s-hailStation) ×2 · [`stepIncoming`](#s-stepIncoming) ×3

<!-- note:stationCall -->
---- NPC → you -------------------------------------------------------------
<!-- /note -->

### <a id="s-findBodyByName"></a>`findBodyByName(name)`

function · L152–155

- called by: [`stepNews`](#s-stepNews)

<!-- note:findBodyByName -->
<!-- /note -->

### <a id="s-stepNews"></a>`stepNews()`

function · L157–189

- calls: [`newsScript`](call-scripts.js.md#s-newsScript) _js/comms/call-scripts.js_ · [`cool`](#s-cool) · [`cooled`](#s-cooled) · [`findBodyByName`](#s-findBodyByName) · [`gnnPost`](gnn.js.md#s-gnnPost) _js/comms/gnn.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`bodyTempK`](../world/bodies.js.md#s-bodyTempK) _js/world/bodies.js_
- called by: [`stepIncoming`](#s-stepIncoming)

<!-- note:stepNews -->
the news desk: a major strike anywhere in the sky goes out as a bulletin.
GNN is auto-accepted: it lands in chat (with the desk link and the actions),
never rings the puck. The script text is the same the old call read.
<!-- /note -->

#### <a id="s-stepNews-run"></a>`stepNews.run()`

prop · L184–184

- calls: [`addBodyWaypoint`](../sim/sim.js.md#s-addBodyWaypoint) _js/sim/sim.js_ · [`selectBody`](../sim/sim.js.md#s-selectBody) _js/sim/sim.js_

<!-- note:stepNews.run -->
<!-- /note -->

#### <a id="s-stepNews-run-2"></a>`stepNews.run~2()`

prop · L185–185

- calls: [`takeSalvageContract`](../sim/sim.js.md#s-takeSalvageContract) _js/sim/sim.js_

<!-- note:stepNews.run~2 -->
<!-- /note -->

### <a id="s-stepMarkets"></a>`stepMarkets()`

function · L191–244

- calls: [`marketScript`](call-scripts.js.md#s-marketScript) _js/comms/call-scripts.js_ ×3 · [`broadcast`](#s-broadcast) ×3 · [`cool`](#s-cool) ×4 · [`cooled`](#s-cooled) ×4 · [`shortagesOf`](../economy/economy.js.md#s-shortagesOf) _js/economy/economy.js_
- via [js/station/stations.js](../station/stations.js.md): `stations.filter`, `stations.filter.flatMap`, `stations.filter.flatMap.sort`
- via [js/economy/economy.js](../economy/economy.js.md): `shortagesOf.filter`, `shortagesOf.filter.map`
- called by: [`stepIncoming`](#s-stepIncoming)

<!-- note:stepMarkets -->
the markets desk: droughts and terraform bonds read out on the same channel

- L224 · `if (sim.time > 240 && cooled("news:short", 420) && cooled("news:short:probe", 15)) {` — the markets desk proper: a port whose lines are stalled on something is a bulletin, and a job
- L224 · `if (sim.time > 240 && cooled("news:short", 420) && cooled("news:short:probe", 15)) {` — the probe itself is throttled on its own clock: it walks every port's ledger, and mostly finds nothing
<!-- /note -->

#### <a id="s-stepMarkets-effect"></a>`stepMarkets.effect()`

prop · L205–210

- calls: [`d3`](#s-d3) ×2 · [`addAnchoredWaypoint`](../sim/sim.js.md#s-addAnchoredWaypoint) _js/sim/sim.js_ · [`selectBody`](../sim/sim.js.md#s-selectBody) _js/sim/sim.js_

<!-- note:stepMarkets.effect -->
<!-- /note -->

#### <a id="s-stepMarkets-effect-2"></a>`stepMarkets.effect~2()`

prop · L239–239

- calls: [`addAnchoredWaypoint`](../sim/sim.js.md#s-addAnchoredWaypoint) _js/sim/sim.js_ · [`selectBody`](../sim/sim.js.md#s-selectBody) _js/sim/sim.js_

<!-- note:stepMarkets.effect~2 -->
<!-- /note -->

### <a id="s-broadcast"></a>`broadcast(script, desk=)`

function · L246–259

- calls: [`gnnPost`](gnn.js.md#s-gnnPost) _js/comms/gnn.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- called by: [`stepBattles`](#s-stepBattles) · [`stepMarkets`](#s-stepMarkets) ×3

<!-- note:broadcast -->
a markets/security read-out, auto-accepted: marketScript's text, its action as a link
<!-- /note -->

#### <a id="s-broadcast-run"></a>`broadcast.run()`

prop · L255–255

<!-- note:broadcast.run -->
<!-- /note -->

### <a id="s-stepBattles"></a>`stepBattles()`

function · L261–295

- calls: [`marketScript`](call-scripts.js.md#s-marketScript) _js/comms/call-scripts.js_ · [`broadcast`](#s-broadcast) · [`cool`](#s-cool) · [`cooled`](#s-cooled) · [`gnnPost`](gnn.js.md#s-gnnPost) _js/comms/gnn.js_ · [`fightCentre`](../npc/battles.js.md#s-fightCentre) _js/npc/battles.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ ×2 · [`nearestStation`](../station/stations.js.md#s-nearestStation) _js/station/stations.js_
- called by: [`stepIncoming`](#s-stepIncoming)

<!-- note:stepBattles -->
the security desk: a firefight goes out on the same channel, with a mark
<!-- /note -->

#### <a id="s-stepBattles-effect"></a>`stepBattles.effect()`

prop · L278–278

- calls: [`fightCentre`](../npc/battles.js.md#s-fightCentre) _js/npc/battles.js_ · [`addWaypointAt`](../sim/sim.js.md#s-addWaypointAt) _js/sim/sim.js_

<!-- note:stepBattles.effect -->
<!-- /note -->

### <a id="s-stepIncoming"></a>`stepIncoming()`

function · L297–323

- calls: [`approachScript`](call-scripts.js.md#s-approachScript) _js/comms/call-scripts.js_ · [`laneScript`](call-scripts.js.md#s-laneScript) _js/comms/call-scripts.js_ · [`pirateScript`](call-scripts.js.md#s-pirateScript) _js/comms/call-scripts.js_ · [`busy`](#s-busy) · [`cool`](#s-cool) ×3 · [`cooled`](#s-cooled) ×3 · [`d3`](#s-d3) · [`stationCall`](#s-stationCall) ×3 · [`stationCtx`](#s-stationCtx) ×3 · [`stepBattles`](#s-stepBattles) · [`stepMarkets`](#s-stepMarkets) · [`stepNews`](#s-stepNews) · [`nearestStation`](../station/stations.js.md#s-nearestStation) _js/station/stations.js_
- called by: [`step`](#s-step)

<!-- note:stepIncoming -->
- L302 · `const ap = sim.approach;` — on a port's entry lane or in its mouth with no berth asked for: control wants a word
<!-- /note -->

### <a id="s-hail"></a>`hail()`

function · **exported** · L325–362

- calls: [`undockScript`](call-scripts.js.md#s-undockScript) _js/comms/call-scripts.js_ · [`cool`](#s-cool) · [`hailContact`](#s-hailContact) ×2 · [`hailStation`](#s-hailStation) ×2 · [`nearestPeer`](#s-nearestPeer) · [`stationCall`](#s-stationCall) · [`stationCtx`](#s-stationCtx) · [`nearestStation`](../station/stations.js.md#s-nearestStation) _js/station/stations.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×2
- via [js/audio/index.js](../audio/index.js.md): `WARN.deny`
- via [js/flight/turrets.js](../flight/turrets.js.md): `contacts.find`
- called by: [`mountComms`](#s-mountComms) ×2

<!-- note:hail -->
---- you → NPC / pilot -----------------------------------------------------
<!-- /note -->

### <a id="s-withTalk"></a>`withTalk(script, entity, kind)`

function · L364–390

- calls: [`withTalk>chips`](#s-withTalk-chips)
- called by: [`hailContact`](#s-hailContact) · [`hailStation`](#s-hailStation)

<!-- note:withTalk -->
---- free talk (npc/speech.js) ---------------------------------------------
A hailed hull or port keeps its scripted options (the ones with consequences) and
gains TALK: quick lines or free text, answered in character by the speech engine,
filed as memory, with the regard it earns handed back as standing.
<!-- /note -->

#### <a id="s-withTalk-chips"></a>`withTalk>chips()`

function · L369–374

- calls: [`talkChips`](../npc/speech.js.md#s-talkChips) _js/npc/speech.js_
- via [js/npc/speech.js](../npc/speech.js.md): `talkChips.map`
- called by: [`withTalk`](#s-withTalk) · [`withTalk>provider`](#s-withTalk-provider)

<!-- note:withTalk>chips -->
<!-- /note -->

#### <a id="s-withTalk-provider"></a>`withTalk>provider({…})`

function · L378–388

- calls: [`withTalk>chips`](#s-withTalk-chips) · [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`corpOfVessel`](../corp/corps.js.md#s-corpOfVessel) _js/corp/corps.js_ · [`talkTo`](../npc/speech.js.md#s-talkTo) _js/npc/speech.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_

<!-- note:withTalk>provider -->
<!-- /note -->

### <a id="s-hailStation"></a>`hailStation(st)`

function · L392–404

- calls: [`pirateScript`](call-scripts.js.md#s-pirateScript) _js/comms/call-scripts.js_ · [`portScript`](call-scripts.js.md#s-portScript) _js/comms/call-scripts.js_ · [`cool`](#s-cool) ×2 · [`d3`](#s-d3) · [`stationCall`](#s-stationCall) ×2 · [`stationCtx`](#s-stationCtx) ×2 · [`withTalk`](#s-withTalk)
- via [js/audio/index.js](../audio/index.js.md): `WARN.deny`
- called by: [`hail`](#s-hail) ×2

<!-- note:hailStation -->
<!-- /note -->

### <a id="s-hailContact"></a>`hailContact(c)`

function · L406–445

- calls: [`guardScript`](call-scripts.js.md#s-guardScript) _js/comms/call-scripts.js_ · [`vesselScript`](call-scripts.js.md#s-vesselScript) _js/comms/call-scripts.js_ · [`attach`](#s-attach) · [`d3`](#s-d3) · [`hailPeer`](#s-hailPeer) · [`npcSession`](#s-npcSession) · [`quality`](#s-quality) · [`withTalk`](#s-withTalk) · [`corpOfVessel`](../corp/corps.js.md#s-corpOfVessel) _js/corp/corps.js_ ×5 · [`standingLabel`](../corp/corps.js.md#s-standingLabel) _js/corp/corps.js_ · [`traitLine`](../npc/cradle.js.md#s-traitLine) _js/npc/cradle.js_ · [`vesselById`](../npc/traffic.js.md#s-vesselById) _js/npc/traffic.js_ · [`vesselStatus`](../npc/traffic.js.md#s-vesselStatus) _js/npc/traffic.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_ · [`nearestStation`](../station/stations.js.md#s-nearestStation) _js/station/stations.js_
- via [js/audio/index.js](../audio/index.js.md): `WARN.deny`
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`hail`](#s-hail) ×2

<!-- note:hailContact -->
- L438 · `answerMs: guard || n ? undefined : Infinity,` — a rogue drone has no radio
<!-- /note -->

### <a id="s-nearestPeer"></a>`nearestPeer(range)`

function · L447–459

- calls: [`d3`](#s-d3)
- called by: [`hail`](#s-hail)

<!-- note:nearestPeer -->
---- you ↔ pilot (live, over the relay) ------------------------------------
<!-- /note -->

### <a id="s-sendPeer"></a>`sendPeer(d, to)`

function · L461–464

- via [js/sim/sim.js](../sim/sim.js.md): `sim.send`
- called by: [`attach`](#s-attach) · [`hailPeer`](#s-hailPeer) · [`onPeerMessage`](#s-onPeerMessage) ×2 · [`peerSession`](#s-peerSession)

<!-- note:sendPeer -->
<!-- /note -->

### <a id="s-peerSession"></a>`peerSession(c, incoming)`

function · L466–485

- calls: [`new CallSession`](call-session.js.md#s-CallSession) _js/comms/call-session.js_ · [`attach`](#s-attach) · [`d3`](#s-d3) · [`quality`](#s-quality) · [`sendPeer`](#s-sendPeer)
- called by: [`hailPeer`](#s-hailPeer) · [`onPeerMessage`](#s-onPeerMessage)
- effects: bus.on `say`

<!-- note:peerSession -->
<!-- /note -->

### <a id="s-hailPeer"></a>`hailPeer(c)`

function · L487–497

- calls: [`peerSession`](#s-peerSession) · [`sendPeer`](#s-sendPeer) · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- via [js/audio/index.js](../audio/index.js.md): `WARN.deny`
- called by: [`hailContact`](#s-hailContact)

<!-- note:hailPeer -->
<!-- /note -->

### <a id="s-onPeerMessage"></a>`onPeerMessage(from, d)`

function · L499–535

- calls: [`busy`](#s-busy) · [`peerSession`](#s-peerSession) · [`sendPeer`](#s-sendPeer) ×2 · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- via [js/flight/turrets.js](../flight/turrets.js.md): `contacts.find`
- effects: bus.on `state`

<!-- note:onPeerMessage -->
- L509 · `const off = sess.on("state", (st) => {` — our accept/reject goes back over the wire
<!-- /note -->

### <a id="s-stepChatter"></a>`stepChatter(dtSim)`

function · L537–566

- calls: [`post`](chat.js.md#s-post) _js/comms/chat.js_ · [`d3`](#s-d3) · [`garble`](#s-garble) · [`noteShootDowns`](#s-noteShootDowns) · [`quality`](#s-quality) · [`groundedReport`](../npc/reports.js.md#s-groundedReport) _js/npc/reports.js_ · [`urgentReport`](../npc/reports.js.md#s-urgentReport) _js/npc/reports.js_ · [`chatter`](../npc/speech.js.md#s-chatter) _js/npc/speech.js_ · [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- called by: [`step`](#s-step)

<!-- note:stepChatter -->
---- NPC ↔ NPC: the open channels -----------------------------------------

- L546 · `` if (comms.listen) logEvent(`${line.from.name} › ${line.to.name}: ${text}`, "comms"); `` — the band lives in the chatbox now (ui/chatbox.js over chat.js); the ticker is for calls
- L552 · `if (sim.time >= (ch.urgentAt ?? 0)) {` — 0.3.16: a hull that is actually being shot calls it at once, whatever the band is doing
- L560 · `if (ch.rnd() < 0.5) {` — first-hand reports — a port's real traffic from a hull that is there, a
  miner's real seam and the real threats on its belt, a picket's real sweep
  (npc/reports.js) — share the band with the speech engine's exchanges
- L564 · `const ex = speechChatter(sim.ship.pos, sim.time, ch.rnd, { skySeed: sim.skySeed });` — The band is pilots. It used to be three parts speech engine to one part
  port-to-port shop talk between two buildings a hundred thousand units
  apart, which is the thing that made the channel read as machinery rather
  than as a system with people in it. Ports keep every line they actually
  need — the approach hail, the lane, clearance, the pirate demand — and
  those are calls on the puck, not gossip on the open channel.
<!-- /note -->

### <a id="s-bandLine"></a>`bandLine(l)`

function · L568–573

- calls: [`bandLine>at`](#s-bandLine-at)

<!-- note:bandLine -->
speech-engine line → the ticker's shape: range and colour from the real hull or port
<!-- /note -->

#### <a id="s-bandLine-at"></a>`bandLine>at(u)`

function · L569–569

- called by: [`bandLine`](#s-bandLine)

<!-- note:bandLine>at -->
<!-- /note -->

### <a id="s-downSeen"></a>`downSeen`

const · L575–575

<!-- note:downSeen -->
hulls that went off the board since the last look: the band remembers the last one lost
<!-- /note -->

### <a id="s-noteShootDowns"></a>`noteShootDowns()`

function · L576–581

- calls: [`d3`](#s-d3) · [`noteLost`](../npc/speech.js.md#s-noteLost) _js/npc/speech.js_
- called by: [`stepChatter`](#s-stepChatter)

<!-- note:noteShootDowns -->
<!-- /note -->

### <a id="s-GARBLE"></a>`GARBLE`

const · L583–583

<!-- note:GARBLE -->
<!-- /note -->

### <a id="s-garble"></a>`garble(text, q, rnd)`

function · L584–589

- called by: [`stepChatter`](#s-stepChatter)

<!-- note:garble -->
<!-- /note -->

### <a id="s-paintAux"></a>`paintAux()`

function · L591–614

- calls: [`$`](#s-S) ×6 · [`nearestStation`](../station/stations.js.md#s-nearestStation) _js/station/stations.js_
- via [js/sim/sim.js](../sim/sim.js.md): `sim.lock.name.split`, `….name.split[0].toUpperCase`, `…[0].toUpperCase.slice`
- called by: [`attach`](#s-attach) ×3 · [`mountComms`](#s-mountComms) · [`step`](#s-step)
- effects: dom.id `aux-hail-st` · dom.id `aux-comms-st` · dom.id `aux-hail` · dom.id `aux-comms` · dom.id `aux-listen-st` · dom.id `aux-listen`

<!-- note:paintAux -->
---- HUD wiring ------------------------------------------------------------
<!-- /note -->

### <a id="s-onVesselTransition"></a>`onVesselTransition(n, from, job)`

function · L616–634

- calls: [`trafficLines`](call-scripts.js.md#s-trafficLines) _js/comms/call-scripts.js_ · [`d3`](#s-d3) · [`transitionReport`](../npc/reports.js.md#s-transitionReport) _js/npc/reports.js_ · [`chatter`](../npc/speech.js.md#s-chatter) _js/npc/speech.js_ · [`captainLine`](../npc/traffic.js.md#s-captainLine) _js/npc/traffic.js_ · [`nearestStation`](../station/stations.js.md#s-nearestStation) _js/station/stations.js_
- via [js/station/stations.js](../station/stations.js.md): `stations.find`
- via [js/npc/traffic.js](../npc/traffic.js.md): `captainLine.split`

<!-- note:onVesselTransition -->
Traffic on the open channel: a hull changing job near you says so, and the port answers.

- L622 · `const rep = transitionReport(n, job, sim.time);` — 0.3.16: a miner starting on its claim says what is in the rock and who is on the belt;
  one coming in says what it actually cut. From the sky, not the stock lines.
- L624 · `if (n.role === "miner" && (job === "cutting" || job === "approach")) return;` — the stock lines would invent it
- L625 · `if (job && ch.rnd() < 0.7) {` — the hull that changed job opens, to the port it is dealing with if it can reach it
- L632 · `ch.queue.push({ from: { name: captainLine(n).split(" · ")[0] || n.name, x: n.x, y: n.y, z:` — the hull calls the port and the port does NOT answer on the open channel —
  a berth is granted on the puck, by name, or it is not granted
<!-- /note -->

### <a id="s-mountComms"></a>`mountComms()`

function · **exported** · L636–667

- calls: [`new CallUI`](call-ui.js.md#s-CallUI) _js/comms/call-ui.js_ · [`$`](#s-S) ×3 · [`hail`](#s-hail) ×2 · [`paintAux`](#s-paintAux) · [`onMessage`](../net/net.js.md#s-onMessage) _js/net/net.js_
- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_
- effects: event.listen `click` · dom.id `aux-hail` · dom.id `aux-listen` · dom.id `aux-comms` · event.listen `keydown` · input.key `KeyH` · timer `requestAnimationFrame`

<!-- note:mountComms -->
- L639 · `comms.ui = new CallUI({ mount: document.body });` — On &lt;body>, not in #hud: the HUD is a stacking context that sits under the
  station deck and the terminal, and a call has to reach you on the deck.
- L653 · `window.addEventListener("keydown", (e) => {` — Keyboard: H hails / answers, Escape is already pause — leave it alone.
<!-- /note -->

#### <a id="s-mountComms-loop"></a>`mountComms>loop()`

function · L660–663

- calls: [`step`](#s-step)
- effects: timer `requestAnimationFrame`

<!-- note:mountComms>loop -->
<!-- /note -->

### <a id="s-step"></a>`step()`

function · L669–718

- calls: [`d3`](#s-d3) · [`paintAux`](#s-paintAux) · [`quality`](#s-quality) · [`stepChatter`](#s-stepChatter) · [`stepIncoming`](#s-stepIncoming) · [`resetReports`](../npc/reports.js.md#s-resetReports) _js/npc/reports.js_ · [`resetSpeech`](../npc/speech.js.md#s-resetSpeech) _js/npc/speech.js_ · [`rngFromSeed`](../world/generate.js.md#s-rngFromSeed) _js/world/generate.js_
- via [js/flight/turrets.js](../flight/turrets.js.md): `contacts.some`
- called by: [`mountComms>loop`](#s-mountComms-loop)

<!-- note:step -->
- L671 · `const nowMs = performance.now();` — sim.wall stops on pause; a live call runs on the other pilot's clock, so use the real one
- L694 · `comms.quietUntil = sim.time + 8;` — let the canopy clear before anyone calls
- L696 · `comms.ui.root.hidden = sim.phase !== "play";` — the pause screen owns the canopy
- L698 · `if (comms.session?.wall) comms.ui.tick(dtWall * 1000);` — pause freezes scripted calls (sim time) but not a live one — the other pilot keeps talking
- L704 · `const p = s.peer;` — range and signal follow the world while the channel is open
- L711 · `comms.ui.tick((s && s.wall ? dtWall : dtSim) * 1000);` — a live call keeps the other pilot's clock; everything NPC keeps the sim's
<!-- /note -->

### <a id="s-wireCommsTest"></a>`wireCommsTest()`

function · **exported** · L720–738

- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:wireCommsTest -->
console access
<!-- /note -->

#### <a id="s-wireCommsTest-hailStation"></a>`wireCommsTest.hailStation(id)`

prop · L726–729

- calls: [`wireCommsTest.hailStation`](#s-wireCommsTest-hailStation) · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`wireCommsTest.hailStation`](#s-wireCommsTest-hailStation)

<!-- note:wireCommsTest.hailStation -->
<!-- /note -->

#### <a id="s-wireCommsTest-hailContact"></a>`wireCommsTest.hailContact(id)`

prop · L730–733

- calls: [`wireCommsTest.hailContact`](#s-wireCommsTest-hailContact)
- via [js/flight/turrets.js](../flight/turrets.js.md): `contacts.find`
- called by: [`wireCommsTest.hailContact`](#s-wireCommsTest-hailContact)

<!-- note:wireCommsTest.hailContact -->
<!-- /note -->
