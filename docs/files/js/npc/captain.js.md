# js/npc/captain.js

[index](../../../README.md) · 494 lines · 27 symbols · 15 imports · 12 importers

## About

<!-- note:@file -->
LIVING GALAXY experimental — the conn.

Whoever holds command flies the hull. By default that is you. Hand it to a
crew member from the deck plan and they fly it: every second they assemble
a snapshot of the hull and everything inside scan range (contacts, ports,
rocks, threats, and the deck itself — who is aboard, what is synthetic,
what is a drone, what the interior sensors see), ask the neural core for a
reflex, roll every candidate goal sixty seconds forward with the
forecaster, and take the goal with the best expected outcome. Then they
steer through the same input path you do — injected pan and throttle — so
the hull obeys them exactly the way it obeys you.

Pluggable: `captain.provider = async (snapshot, candidates) => ({ action,
rationale })` lets a local SLM make the call instead (with the forecaster's
numbers in the prompt). It falls back to the core on timeout.

While you hold the conn, the core watches you and learns.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `DROPOUT_ODDS`, `plotRoute`, `sim`, `sellPriceAt`, `stationStatus`, `toggleDock`, `setThrottle`, `setMiningMode`, `setTurretMode`, `requestJump`, `acquireLock`, `logEvent`, `selectBody` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../station/stationworks.js` | `tractor`, `inDeparture` | [js/station/stationworks.js](../station/stationworks.js.md) |
| 3 | `../station/stations.js` | `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 4 | `../core/input.js` | `setInjectedPan`, `touch` | [js/core/input.js](../core/input.js.md) |
| 5 | `../flight/turrets.js` | `contacts`, `mining`, `turretAim` | [js/flight/turrets.js](../flight/turrets.js.md) |
| 6 | `../station/stations.js` | `nearestStation` | [js/station/stations.js](../station/stations.js.md) |
| 7 | `../world/bodies.js` | `BODIES`, `bodyPosition`, `scanRadius` | [js/world/bodies.js](../world/bodies.js.md) |
| 8 | `../world/field.js` | `inBelt`, `nearbyRocks` | [js/world/field.js](../world/field.js.md) |
| 9 | `../economy/icework.js` | `benchValue`, `iceworkFit` | [js/economy/icework.js](../economy/icework.js.md) |
| 10 | `../world/events/impactors.js` | `impactors` | [js/world/events/impactors.js](../world/events/impactors.js.md) |
| 11 | `../flight/ship.js` | `forwardOf`, `cargoTotal`, `batteryCap` | [js/flight/ship.js](../flight/ship.js.md) |
| 12 | `../corp/corps.js` | `corpOfStation` | [js/corp/corps.js](../corp/corps.js.md) |
| 13 | `../crew/ledger.js` | `crew` | [js/crew/ledger.js](../crew/ledger.js.md) |
| 14 | `./cradle.js` | `cradle` | [js/npc/cradle.js](cradle.js.md) |
| 15 | `./brain.js` | `ACTIONS`, `N_FEATURES`, `createBrain`, `features`, `labelFromPlay`, `learnImitation`, `learnOutcome`, `think` | [js/npc/brain.js](brain.js.md) |

## Imported by

- [js/aria/aria.js](../aria/aria.js.md) — `captain`, `houseBrain`, `retakeCommand`, `ariaHooks`
- [js/aria/pilot.js](../aria/pilot.js.md) — `captain`, `ariaHooks`
- [js/console/panels/crew.js](../console/panels/crew.js.md) — `captain`, `transferCommand`, `retakeCommand`
- [js/crew/deckmind.js](../crew/deckmind.js.md) — `captain`
- [js/flight/autopilot.js](../flight/autopilot.js.md) — `captain`, `ariaHooks`
- [js/interior/interior.js](../interior/interior.js.md) — `captain`, `transferCommand`, `retakeCommand`, `holderName`, `interiorReport`
- [js/mission/run.js](../mission/run.js.md) — `captain`
- [js/sim/sim.js](../sim/sim.js.md) — `captain`, `retakeCommand`, `tickCaptain`
- [js/ui/hud.js](../ui/hud.js.md) — `captain`, `wireCaptainTest`
- test/chart.test.mjs _(outside js/)_ — `captain`
- test/robots.test.mjs _(outside js/)_ — `transferCommand`, `captain`
- test/systems.test.mjs _(outside js/)_ — `captain`, `houseBrain`

## Exports

- [`ariaHooks`](#s-ariaHooks) · const — used by [js/aria/aria.js](../aria/aria.js.md), [js/aria/pilot.js](../aria/pilot.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md)
- [`captain`](#s-captain) · const — used by [js/aria/aria.js](../aria/aria.js.md), [js/aria/pilot.js](../aria/pilot.js.md), [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/deckmind.js](../crew/deckmind.js.md), [js/flight/autopilot.js](../flight/autopilot.js.md), [js/interior/interior.js](../interior/interior.js.md), [js/mission/run.js](../mission/run.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/hud.js](../ui/hud.js.md), test/chart.test.mjs, test/robots.test.mjs, test/systems.test.mjs
- [`holderName`](#s-holderName) · function — used by [js/interior/interior.js](../interior/interior.js.md)
- [`transferCommand`](#s-transferCommand) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), [js/interior/interior.js](../interior/interior.js.md), test/robots.test.mjs
- [`retakeCommand`](#s-retakeCommand) · function — used by [js/aria/aria.js](../aria/aria.js.md), [js/console/panels/crew.js](../console/panels/crew.js.md), [js/interior/interior.js](../interior/interior.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`snapshot`](#s-snapshot) · function — **no importer in scanned roots**
- [`interiorReport`](#s-interiorReport) · function — used by [js/interior/interior.js](../interior/interior.js.md)
- [`forecast`](#s-forecast) · function — **no importer in scanned roots**
- [`holdValueAt`](#s-holdValueAt) · function — **no importer in scanned roots**
- [`tickCaptain`](#s-tickCaptain) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`houseBrain`](#s-houseBrain) · function — used by [js/aria/aria.js](../aria/aria.js.md), test/systems.test.mjs
- [`captainPrompt`](#s-captainPrompt) · function — **no importer in scanned roots**
- [`llamaCaptainProvider`](#s-llamaCaptainProvider) · function — **no importer in scanned roots**
- [`wireCaptainTest`](#s-wireCaptainTest) · function — used by [js/ui/hud.js](../ui/hud.js.md)

## Effects

- **net.fetch** — `‹url› POST` (llamaCaptainProvider:472)
- **storage.get** — `lgaa.housebrain.v1` (houseBrain:432)
- **storage.set** — `lgaa.housebrain.v1` (houseBrain:435)
- **timer** — `setTimeout` (decide:261)

## Symbols

### <a id="s-ariaHooks"></a>`ariaHooks`

const · **exported** · L17–17

<!-- note:ariaHooks -->
a one-key bus so aria.js can hear about decisions without captain.js
importing it — aria.js imports captain.js, and the cycle would bite
<!-- /note -->

### <a id="s-captain"></a>`captain`

const · **exported** · L19–32

<!-- note:captain -->
- L20 · `holder: "player",` — "player" | crew member id
- L21 · `member: null,` — the crew record holding the conn
- L23 · `goal: null,` — { action, target, since, rationale, forecast }
- L24 · `log: [],` — last decisions, newest first
- L25 · `provider: null,` — optional SLM bridge
- L29 · `decideGen: 0,` — bumps per decide(); a late result from an older tick is dropped
- L31 · `decision: null,` — outcome learning: the state the last decision was made in
- L31 · `decision: null,` — { x, action, at, hull, credits, cargo }
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L34–34

<!-- note:_p -->
<!-- /note -->

### <a id="s-note"></a>`note(text, kind=)`

function · L36–40

- calls: [`logEvent`](../sim/sim.js.md#s-logEvent) _js/sim/sim.js_
- called by: [`retakeCommand`](#s-retakeCommand) · [`tickCaptain`](#s-tickCaptain) ×2 · [`transferCommand`](#s-transferCommand)

<!-- note:note -->
<!-- /note -->

### <a id="s-holderName"></a>`holderName()`

function · **exported** · L42–44

- called by: [`paintRail`](../interior/interior.js.md#s-paintRail) _js/interior/interior.js_ · [`execute`](#s-execute)

<!-- note:holderName -->
---- command -------------------------------------------------------------
<!-- /note -->

### <a id="s-transferCommand"></a>`transferCommand(memberId)`

function · **exported** · L46–67

- calls: [`inheritBrain`](#s-inheritBrain) · [`isSane`](#s-isSane) · [`note`](#s-note)
- via [js/crew/ledger.js](../crew/ledger.js.md): `crew.aboard.find`
- via [js/npc/cradle.js](cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`rosterCard`](../console/panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_ · [`paintDialogue.run`](../interior/interior.js.md#s-paintDialogue-run) _js/interior/interior.js_

<!-- note:transferCommand -->
- L54 · `captain.brain = rec?.brain && isSane(rec.brain) ? rec.brain : inheritBrain(m);` — a first-time captain inherits the house core — everything it learned from you — with their own temperament laid over it
<!-- /note -->

### <a id="s-retakeCommand"></a>`retakeCommand()`

function · **exported** · L69–88

- calls: [`setInjectedPan`](../core/input.js.md#s-setInjectedPan) _js/core/input.js_ · [`note`](#s-note) · [`setThrottle`](../sim/sim.js.md#s-setThrottle) _js/sim/sim.js_
- via [js/npc/cradle.js](cradle.js.md): `cradle.get`, `cradle.note`
- called by: [`ariaRelease`](../aria/aria.js.md#s-ariaRelease) _js/aria/aria.js_ · [`rosterCard`](../console/panels/crew.js.md#s-rosterCard) _js/console/panels/crew.js_ · [`paintDialogue.run~2`](../interior/interior.js.md#s-paintDialogue-run-2) _js/interior/interior.js_ · [`paintDialogue.run~3`](../interior/interior.js.md#s-paintDialogue-run-3) _js/interior/interior.js_ · [`checkHolder`](#s-checkHolder) · [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:retakeCommand -->
- L84 · `setThrottle(0);` — the holder's last burn is not yours — 0.3 handed back a hull still at full mains
<!-- /note -->

### <a id="s-checkHolder"></a>`checkHolder()`

function · L90–93

- calls: [`retakeCommand`](#s-retakeCommand)
- via [js/crew/ledger.js](../crew/ledger.js.md): `crew.aboard.some`
- called by: [`tickCaptain`](#s-tickCaptain)

<!-- note:checkHolder -->
If the holder walks or is dismissed, the conn falls back to you.

- L91 · `if (captain.holder === "aria") return;` — ARIA is not on the crew list and never will be — it has no berth, no wage
  and no morale. It is still a legitimate holder of the conn.
<!-- /note -->

### <a id="s-snapshot"></a>`snapshot()`

function · **exported** · L95–155

- calls: [`corpOfStation`](../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`benchValue`](../economy/icework.js.md#s-benchValue) _js/economy/icework.js_ · [`iceworkFit`](../economy/icework.js.md#s-iceworkFit) _js/economy/icework.js_ · [`batteryCap`](../flight/ship.js.md#s-batteryCap) _js/flight/ship.js_ · [`cargoTotal`](../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_ · [`interiorReport`](#s-interiorReport) · [`nearestStation`](../station/stations.js.md#s-nearestStation) _js/station/stations.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`scanRadius`](../world/bodies.js.md#s-scanRadius) _js/world/bodies.js_ · [`inBelt`](../world/field.js.md#s-inBelt) _js/world/field.js_ · [`nearbyRocks`](../world/field.js.md#s-nearbyRocks) _js/world/field.js_
- via [js/flight/turrets.js](../flight/turrets.js.md): `contacts.filter`
- via [js/sim/sim.js](../sim/sim.js.md): `sim.scanned.has`
- called by: [`tickCaptain`](#s-tickCaptain)

<!-- note:snapshot -->
---- the snapshot -------------------------------------------------------

Everything the captain reasons over, in one plain object. Also what the
interior sensors report — the deck plan's crew, synthetics, robotics —
so a captain knows who is aboard when they decide to run or fight.

- L110 · `let unsurveyed = null;` — nearest unsurveyed world
- L119 · `let rockValue = 0;` — what a unit cut here is worth to THIS ship: veins rich, ice at the bench's melted value
- L153 · `interior: interiorReport(),` — the deck: what the interior sensors report
<!-- /note -->

### <a id="s-interiorReport"></a>`interiorReport()`

function · **exported** · L157–165

- via [js/crew/ledger.js](../crew/ledger.js.md): `crew.aboard.filter`, `crew.aboard.filter.map`
- called by: [`paintRail`](../interior/interior.js.md#s-paintRail) _js/interior/interior.js_ · [`snapshot`](#s-snapshot)

<!-- note:interiorReport -->
Who and what is inside the hull, as the sensors classify it.
<!-- /note -->

### <a id="s-forecast"></a>`forecast(s, action)`

function · **exported** · L167–226

- calls: [`holdValueAt`](#s-holdValueAt)
- called by: [`decide`](#s-decide)

<!-- note:forecast -->
---- the forecaster ------------------------------------------------------

Roll a goal 60 s forward with a coarse model and return an expected score.
Not the sim — arithmetic on the snapshot: closure rates, damage rates,
yield rates, the things a captain estimates in their head.

- L169 · `const cur = Math.hypot(sim.ship.vel.x, sim.ship.vel.y, sim.ship.vel.z);` — cruise closure: what the hull is doing now, floored at a working estimate
- L185 · `credits += holdValueAt(s.port.id);` — what THIS port actually pays
- L186 · `credits += s.hull < 60 ? 200 : 0;` — repairs are worth something
- L187 · `credits += intruders ? 300 : 0;` — port security ends a boarding fast
- L196 · `const unit = s.rockValue > 0 ? s.rockValue : 6;` — per-unit value of THIS field — veins rich, ice at melted value when the bench is fitted
- L197 · `credits += gain * (sim.ship.cargoCap ?? 400) * unit * 0.25;` — a minute cuts a quarter of that gain's book
- L203 · `{ const eta = s.unsurveyed / (speed * 4);` — warp closes faster
- L222 · `if (intruders && (action === "mine" || action === "survey" || action === "hold")) { risk +` — a deck fight makes everything but docking and running worse
- L224 · `const score = credits / 400 - hullLoss * (s.hull < 40 ? 0.12 : 0.05) - risk * 2 + (action` — score: hull is worth more the less you have; credits scaled; risk is a flat penalty
<!-- /note -->

### <a id="s-holdValueAt"></a>`holdValueAt(portId)`

function · **exported** · L228–234

- calls: [`sellPriceAt`](../sim/sim.js.md#s-sellPriceAt) _js/sim/sim.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`forecast`](#s-forecast)

<!-- note:holdValueAt -->
What the hold would fetch at a given port, through the real price path.
<!-- /note -->

### <a id="s-decide"></a>`decide(s)`

function · async · L236–271

- calls: [`features`](brain.js.md#s-features) _js/npc/brain.js_ · [`think`](brain.js.md#s-think) _js/npc/brain.js_ · [`forecast`](#s-forecast)
- via [js/npc/brain.js](brain.js.md): `ACTIONS.map`
- called by: [`tickCaptain`](#s-tickCaptain)
- effects: timer `setTimeout`

<!-- note:decide -->
---- deciding -----------------------------------------------------------

- L240 · `const trust = Math.min(1, (captain.brain.steps + captain.brain.outcomes) / 200);` — blend: forecaster score + reflex prior scaled by how much the core has learned
- L245 · `if (f.action === "engage") v += ((traits.grit ?? 0.5) - 0.5) * 1.5 - ((traits.caution ?? 0` — personality on top of the numbers
- L249 · `if (captain.goal?.action === f.action) v += 0.6;` — stickiness: do not flip goals every second
- L257 · `let timer = 0;` — The timer used to run to completion whoever won the race, holding its
  closure — and the race's reject — alive for four seconds and then firing
  at an already-settled promise. One decision per captain per cadence is
  one orphan timer per decision. Clear it in `finally`.
- L265 · `} catch {` — fall back to the core
<!-- /note -->

### <a id="s-steerToward"></a>`steerToward(tx, ty, tz, throttle)`

function · L273–288

- calls: [`setInjectedPan`](../core/input.js.md#s-setInjectedPan) _js/core/input.js_ · [`forwardOf`](../flight/ship.js.md#s-forwardOf) _js/flight/ship.js_ · [`setThrottle`](../sim/sim.js.md#s-setThrottle) _js/sim/sim.js_
- called by: [`execute`](#s-execute) ×3 · [`steerAway`](#s-steerAway)

<!-- note:steerToward -->
---- flying -------------------------------------------------------------

- L285 · `setInjectedPan({ x: Math.max(-1, Math.min(1, -ey * 1.6)), y: Math.max(-1, Math.min(1, ep *` — stick-right REDUCES yaw in the flight model — the error goes in negated
<!-- /note -->

### <a id="s-steerAway"></a>`steerAway(fx, fy, fz)`

function · L290–293

- calls: [`steerToward`](#s-steerToward)
- called by: [`execute`](#s-execute) ×2

<!-- note:steerAway -->
<!-- /note -->

### <a id="s-execute"></a>`execute(goal, s)`

function · L295–360

- calls: [`setInjectedPan`](../core/input.js.md#s-setInjectedPan) _js/core/input.js_ ×2 · [`d3`](#s-d3) ×5 · [`holderName`](#s-holderName) · [`steerAway`](#s-steerAway) ×2 · [`steerToward`](#s-steerToward) ×3 · [`acquireLock`](../sim/sim.js.md#s-acquireLock) _js/sim/sim.js_ ×2 · [`plotRoute`](../sim/sim.js.md#s-plotRoute) _js/sim/sim.js_ · [`requestJump`](../sim/sim.js.md#s-requestJump) _js/sim/sim.js_ · [`selectBody`](../sim/sim.js.md#s-selectBody) _js/sim/sim.js_ · [`setMiningMode`](../sim/sim.js.md#s-setMiningMode) _js/sim/sim.js_ ×2 · [`setThrottle`](../sim/sim.js.md#s-setThrottle) _js/sim/sim.js_ ×7 · [`setTurretMode`](../sim/sim.js.md#s-setTurretMode) _js/sim/sim.js_ ×2 · [`stationStatus`](../sim/sim.js.md#s-stationStatus) _js/sim/sim.js_ · [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_ · [`inDeparture`](../station/stationworks.js.md#s-inDeparture) _js/station/stationworks.js_ · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_
- via [js/flight/turrets.js](../flight/turrets.js.md): `contacts.filter`, `contacts.filter.sort`, `contacts.find`
- via [js/world/events/impactors.js](../world/events/impactors.js.md): `impactors.find`
- called by: [`tickCaptain`](#s-tickCaptain) ×2

<!-- note:execute -->
- L307 · `if (tractor.active) { setThrottle(0); break; }` — control has the helm (a pull or the push out), or we are fresh off the push: no DOCK from the conn
- L328 · `const route = d > 40000 && sim.warp.state === "idle" ? plotRoute(s.unsurveyedId) : null;` — the nav computer wants the nose on the lane — same rule the pilot flies under.
  A cautious captain also reads the dropout odds: a graze is a 90% coin
  they will not flip; a careless one will.
<!-- /note -->

### <a id="s-d3"></a>`d3(o)`

function · L362–365

- called by: [`execute`](#s-execute) ×5

<!-- note:d3 -->
<!-- /note -->

### <a id="s-tickCaptain"></a>`tickCaptain(dt)`

function · **exported** · L367–413

- calls: [`cargoTotal`](../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_ ×2 · [`features`](brain.js.md#s-features) _js/npc/brain.js_ · [`labelFromPlay`](brain.js.md#s-labelFromPlay) _js/npc/brain.js_ · [`learnImitation`](brain.js.md#s-learnImitation) _js/npc/brain.js_ · [`learnOutcome`](brain.js.md#s-learnOutcome) _js/npc/brain.js_ · [`checkHolder`](#s-checkHolder) · [`decide`](#s-decide) · [`execute`](#s-execute) ×2 · [`houseBrain`](#s-houseBrain) · [`note`](#s-note) ×2 · [`snapshot`](#s-snapshot)
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:tickCaptain -->
---- tick ----------------------------------------------------------------

Called from the sim every frame (dt in sim seconds).

- L373 · `if (s && sim.time - captain.lastLearn >= 5) {` — learn from the way you fly — one label every 5 s, from the core of whoever last held the conn or a shared house brain
- L382 · `if (captain.holder === "aria" && ariaHooks.pilot) { ariaHooks.pilot(dt); return; }` — ARIA plans jobs for the autopilot instead of steering the stick (js/aria/pilot.js)
- L385 · `if (captain.decision && sim.time - captain.decision.at >= 20) {` — score the last decision by what happened since
- L393 · `decide(s).then(({ pick, rationale, x }) => {` — `decide` is async and runs every tick a captain holds the conn. Without a
  catch, one malformed brain or one undefined field in forecast() produces an
  unhandled rejection PER TICK — invisible unless devtools is open — while
  execute() keeps flying the last goal it managed to set. Better to hand the
  conn back and say so once.
- L394 · `if (gen !== captain.decideGen || captain.holder === "player" || !captain.member) return;` — the conn may have changed hands, or a newer tick may have landed first
- L395 · `captain.thinkFailed = false;` — a good decision re-arms the warning
<!-- /note -->

### <a id="s-isSane"></a>`isSane(b)`

function · L415–417

- called by: [`houseBrain`](#s-houseBrain) · [`transferCommand`](#s-transferCommand)

<!-- note:isSane -->
<!-- /note -->

### <a id="s-inheritBrain"></a>`inheritBrain(m)`

function · L419–427

- calls: [`createBrain`](brain.js.md#s-createBrain) _js/npc/brain.js_ · [`houseBrain`](#s-houseBrain)
- called by: [`transferCommand`](#s-transferCommand)

<!-- note:inheritBrain -->
<!-- /note -->

### <a id="s-_house"></a>`_house`

const · L429–429

<!-- note:_house -->
the ship's own core: learns from you whenever nobody else holds the conn, and seeds new captains
<!-- /note -->

### <a id="s-houseBrain"></a>`houseBrain()`

function · **exported** · L430–437

- calls: [`createBrain`](brain.js.md#s-createBrain) _js/npc/brain.js_ · [`isSane`](#s-isSane)
- called by: [`ariaTakeConn`](../aria/aria.js.md#s-ariaTakeConn) _js/aria/aria.js_ · [`ariaWatchReport`](../aria/aria.js.md#s-ariaWatchReport) _js/aria/aria.js_ · [`inheritBrain`](#s-inheritBrain) · [`tickCaptain`](#s-tickCaptain)
- effects: storage.get `lgaa.housebrain.v1` · storage.set `lgaa.housebrain.v1`

<!-- note:houseBrain -->
- L432 · `try { const raw = globalThis.localStorage?.getItem("lgaa.housebrain.v1"); if (raw) _house` — none
- L435 · `if ((_house.steps & 15) === 0) { try { globalThis.localStorage?.setItem("lgaa.housebrain.v` — full
<!-- /note -->

### <a id="s-captainPrompt"></a>`captainPrompt(s, ranked)`

function · **exported** · L439–457

- calls: [`traitWords`](#s-traitWords)
- via [js/npc/cradle.js](cradle.js.md): `cradle.get`
- called by: [`llamaCaptainProvider`](#s-llamaCaptainProvider)

<!-- note:captainPrompt -->
---- the SLM socket -------------------------------------------------------

The prompt an SLM sees: the snapshot in a captain's words, then the forecaster's ranked options as letters.
<!-- /note -->

### <a id="s-traitWords"></a>`traitWords(rec)`

function · L459–465

- called by: [`captainPrompt`](#s-captainPrompt)

<!-- note:traitWords -->
<!-- /note -->

### <a id="s-llamaCaptainProvider"></a>`llamaCaptainProvider(url=, opts=)`

function · **exported** · L467–486

- calls: [`captainPrompt`](#s-captainPrompt)
- called by: [`wireCaptainTest.useLlama`](#s-wireCaptainTest-useLlama)
- effects: net.fetch `‹url›`

<!-- note:llamaCaptainProvider -->
A provider for a local llama.cpp server (`llama-server -m model.gguf --port 8081 --cors`).
  captain.provider = llamaCaptainProvider("http://127.0.0.1:8081/completion");
The model answers with a letter; anything else is discarded and the core's pick stands.
<!-- /note -->

### <a id="s-wireCaptainTest"></a>`wireCaptainTest()`

function · **exported** · L488–494

- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:wireCaptainTest -->
Console/test access.
<!-- /note -->

#### <a id="s-wireCaptainTest-useLlama"></a>`wireCaptainTest.useLlama(url)`

prop · L492–492

- calls: [`llamaCaptainProvider`](#s-llamaCaptainProvider)

<!-- note:wireCaptainTest.useLlama -->
<!-- /note -->
