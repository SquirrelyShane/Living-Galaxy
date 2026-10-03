# js/aria/play.js

[index](../../../README.md) · 659 lines · 60 symbols · 24 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY — ARIA at the controls, playing for herself.

0.3.22. The preference core (js/aria/aria.js) learns from watching you. This is
the other half: ARIA flying a hull of her own, taking work off the board,
doing it, and keeping score — so a career can be PLAYED headlessly, start to
finish, without a renderer, a browser or a person.

The brain is small on purpose. A MOVE is a kind of work with a target
("board:mining", "route", "mine", "sell"); a RUN of a move is scored by the
only number that matters, credits per minute of sky time, and the score is
kept per career in a brain that survives the process. Choosing is
epsilon-greedy: mostly the move that has paid best so far, sometimes
something else, because a bot that only repeats its first lucky run never
finds out that trading beats hauling in this sky.

Every move is executed by machinery the player uses: the contract desk
(contracts.js), the trade routes (traderoutes.js), the mission executor
(mission/run.js) and the autopilot. Nothing here reaches into the sim and
moves the hull by hand, so what ARIA learns is about the GAME, not about a
private simulation of it — and a bad number here is a bad number for you.

tools/aria-play.mjs is the runner; js/ariaplay-net.mjs puts her in the room.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./mind.js` | `ariaMind`, `authorize`, `decideMind`, `policyScore`, `learnOutcome`, `spendCap` | [js/aria/mind.js](mind.js.md) |
| 2 | `../sim/sim.js` | `sim`, `sellPriceAt`, `setTurretMode`, `setMiningMode`, `toggleSystem` | [js/sim/sim.js](../sim/sim.js.md) |
| 3 | `../station/stations.js` | `stations`, `stationById` | [js/station/stations.js](../station/stations.js.md) |
| 4 | `../flight/ship.js` | `holdRoom`, `batteryCap`, `roomFor`, `cargoTotal` | [js/flight/ship.js](../flight/ship.js.md) |
| 5 | `../flight/pilot.js` | `pilot` | [js/flight/pilot.js](../flight/pilot.js.md) |
| 6 | `../economy/materials.js` | `goodName`, `bulkOf` | [js/economy/materials.js](../economy/materials.js.md) |
| 7 | `../economy/contracts.js` | `boardFor`, `acceptContract`, `acceptBlocker`, `abandonContract`, `deliverContracts`, `deliverableAt`, `contracts`, `CATEGORIES`, `CATEGORY_ORDER`, `categoryOf`, `hullFit`, `jobStatus`, `targetPos`, `timeLeft`, `BOARD` | [js/economy/contracts.js](../economy/contracts.js.md) |
| 8 | `../economy/traderoutes.js` | `bestRoute`, `sellable`, `tradeRoutes` | [js/economy/traderoutes.js](../economy/traderoutes.js.md) |
| 9 | `../economy/economy.js` | `stockOf`, `askPrice` | [js/economy/economy.js](../economy/economy.js.md) |
| 10 | `../mission/script.js` | `makeMission`, `makeStep` | [js/mission/script.js](../mission/script.js.md) |
| 11 | `../mission/run.js` | `mission`, `startMission`, `stopMission` | [js/mission/run.js](../mission/run.js.md) |
| 12 | `../flight/autopilot.js` | `autopilot`, `busIdle`, `AP_POWER` | [js/flight/autopilot.js](../flight/autopilot.js.md) |
| 13 | `../economy/chains.js` | `chainReport` | [js/economy/chains.js](../economy/chains.js.md) |
| 14 | `../version.js` | `VERSION` | [js/version.js](../version.js.md) |
| 15 | `../economy/economy.js` | `PRICE_CEIL`, `PRICE_FLOOR` | [js/economy/economy.js](../economy/economy.js.md) |
| 16 | `../npc/rogues.js` | `nests` | [js/npc/rogues.js](../npc/rogues.js.md) |
| 17 | `../npc/traffic.js` | `traffic` | [js/npc/traffic.js](../npc/traffic.js.md) |
| 18 | `./senses.js` | `sense`, `senseSpace`, `senseLine`, `forgetSenses`, `unpostedWork` | [js/aria/senses.js](senses.js.md) |
| 19 | `./nav.js` | `planRoute`, `legSeconds` **unused**, `tripSeconds` **unused**, `aimAt`, `lockOn`, `markPlace`, `routeLine` as `navLine` **unused**, `NAV` | [js/aria/nav.js](nav.js.md) |
| 20 | `../station/dockwork.js` | `handlingLeft`, `handlingLine` | [js/station/dockwork.js](../station/dockwork.js.md) |
| 21 | `./company.js` | `runBusiness`, `bizReport`, `bizLine`, `resetBusiness`, `biz` | [js/aria/company.js](company.js.md) |
| 22 | `../corp/company.js` | `company`, `hasCompany` | [js/corp/company.js](../corp/company.js.md) |
| 23 | `../crew/ledger.js` | `crew` | [js/crew/ledger.js](../crew/ledger.js.md) |
| 24 | `../flight/repair.js` | `yardRepair`, `repairsAt`, `repairQuote`, `hullMaxOf` | [js/flight/repair.js](../flight/repair.js.md) |

## Imported by

- test/ariabiz.test.mjs _(outside js/)_ — `netWorth`, `CAREER_DEPT`
- test/ariamind-integration.test.mjs _(outside js/)_ — `play`, `brainNote`
- test/ariaplay.test.mjs _(outside js/)_ — `play`, `beginPlay`, `stepPlay`, `endPlay`, `playReport`, `brainReport`, `brainNote`, `scoreOf`, `weightOf`, `jobPlan`, `jobsFor`, `canFly`, `sourceFor`, `movesNow`, `nearestPort`, `holdUsed`, `setPlayRng`, `netWorth`, `CAREER_DEPT`, `PLAY`
- test/ariasense.test.mjs _(outside js/)_ — `jobSeconds`, `jobsFor`, `jobPlan`

## Exports

- [`CAREER_DEPT`](#s-CAREER_DEPT) · const — used by test/ariabiz.test.mjs, test/ariaplay.test.mjs
- [`PLAY`](#s-PLAY) · const — used by test/ariaplay.test.mjs
- [`play`](#s-play) · const — used by test/ariamind-integration.test.mjs, test/ariaplay.test.mjs
- [`netWorth`](#s-netWorth) · function — used by test/ariabiz.test.mjs, test/ariaplay.test.mjs
- [`holdUsed`](#s-holdUsed) · function — used by test/ariaplay.test.mjs
- [`scoreOf`](#s-scoreOf) · function — used by test/ariaplay.test.mjs
- [`brainNote`](#s-brainNote) · function — used by test/ariamind-integration.test.mjs, test/ariaplay.test.mjs
- [`brainReport`](#s-brainReport) · function — used by test/ariaplay.test.mjs
- [`nearestPort`](#s-nearestPort) · function — used by test/ariaplay.test.mjs
- [`jobSeconds`](#s-jobSeconds) · function — used by test/ariasense.test.mjs
- [`jobsFor`](#s-jobsFor) · function — used by test/ariaplay.test.mjs, test/ariasense.test.mjs
- [`sourceFor`](#s-sourceFor) · function — used by test/ariaplay.test.mjs
- [`canFly`](#s-canFly) · function — used by test/ariaplay.test.mjs
- [`purse`](#s-purse) · function — **no importer in scanned roots**
- [`jobPlan`](#s-jobPlan) · function — used by test/ariaplay.test.mjs, test/ariasense.test.mjs
- [`moveKeyFor`](#s-moveKeyFor) · function — **no importer in scanned roots**
- [`readyForTrouble`](#s-readyForTrouble) · function — **no importer in scanned roots**
- [`hullFrac`](#s-hullFrac) · function — **no importer in scanned roots**
- [`bestYard`](#s-bestYard) · function — **no importer in scanned roots**
- [`movesNow`](#s-movesNow) · function — used by test/ariaplay.test.mjs
- [`setPlayRng`](#s-setPlayRng) · function — used by test/ariaplay.test.mjs
- [`weightOf`](#s-weightOf) · function — used by test/ariaplay.test.mjs
- [`hostilesClose`](#s-hostilesClose) · function — **no importer in scanned roots**
- [`shouldBreakOff`](#s-shouldBreakOff) · function — **no importer in scanned roots**
- [`beginPlay`](#s-beginPlay) · function — used by test/ariaplay.test.mjs
- [`tendBus`](#s-tendBus) · function — **no importer in scanned roots**
- [`stepPlay`](#s-stepPlay) · function — used by test/ariaplay.test.mjs
- [`brainSig`](#s-brainSig) · function — **no importer in scanned roots**
- [`brainOut`](#s-brainOut) · function — **no importer in scanned roots**
- [`adoptBrain`](#s-adoptBrain) · function — **no importer in scanned roots**
- [`playReport`](#s-playReport) · function — used by test/ariaplay.test.mjs
- [`jobProgress`](#s-jobProgress) · function — **no importer in scanned roots**
- [`endPlay`](#s-endPlay) · function — used by test/ariaplay.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-CAREER_DEPT"></a>`CAREER_DEPT`

const · **exported** · L26–28

- via [js/economy/contracts.js](../economy/contracts.js.md): `CATEGORIES[…].careers.map`, `CATEGORY_ORDER.flatMap`

<!-- note:CAREER_DEPT -->
Which department a career takes its work from, and the hull line it flies.
<!-- /note -->

### <a id="s-PLAY"></a>`PLAY`

const · **exported** · L30–47

<!-- note:PLAY -->
- L31 · `think: 2.5,` — s of sky between decisions when idle
- L32 · `stuck: 1200,` — s on one move with nothing to show for it → drop it
- L33 · `replans: 2,` — how many times a live job is re-flown before it is dropped
- L34 · `explore: 0.18,` — chance of trying something other than the best move
- L35 · `deptBias: 2.2,` — her own department's work is what she is here to learn
- L36 · `minCredits: 800,` — keep this much back so a BUY never strands the hull
- L37 · `patchAt: 0.55,` — hull below this fraction and the next move is a yard
- L38 · `yardCool: 240,` — s before another yard run: a purse that cannot pay for plate is not a plan
- L39 · `runAt: 0.3,` — hull below this and nothing matters except getting out
- L40 · `chainBias: 1.35,` — a chain stage is worth more than its pay: it opens the next one
<!-- /note -->

### <a id="s-play"></a>`play`

const · **exported** · L49–66

<!-- note:play -->
- L56 · `move: null,` — { key, kind, since, cr0, note }
- L60 · `yardAt: -1e9,` — when she last bought hull, so a broke pilot stops circling
<!-- /note -->

#### <a id="s-play-brain"></a>`play.brain()`

prop · L61–61

<!-- note:play.brain -->
<!-- /note -->

#### <a id="s-play-brain-2"></a>`play.brain~2(value)`

prop · L62–62

<!-- note:play.brain~2 -->
<!-- /note -->

### <a id="s-now"></a>`now()`

function · L68–68

- called by: [`beginPlay`](#s-beginPlay) · [`brainNote`](#s-brainNote) · [`brainOut`](#s-brainOut) · [`decide`](#s-decide) ×2 · [`finishMove`](#s-finishMove) · [`jobsFor`](#s-jobsFor) · [`movesNow`](#s-movesNow) · [`note`](#s-note) · [`playReport`](#s-playReport) ×2 · [`resumeHeld`](#s-resumeHeld) ×2 · [`resumeHeld>drop`](#s-resumeHeld-drop) · [`startFreeMine`](#s-startFreeMine) · [`startJob`](#s-startJob) ×2 · [`startRoute`](#s-startRoute) · [`startSell`](#s-startSell) · [`startSupply`](#s-startSupply) · [`startYard`](#s-startYard) ×3 · [`stepPlay`](#s-stepPlay) ×9

<!-- note:now -->
<!-- /note -->

### <a id="s-bizSeen"></a>`bizSeen`

const · L69–69

<!-- note:bizSeen -->
<!-- /note -->

### <a id="s-netWorth"></a>`netWorth()`

function · **exported** · L71–71

- calls: [`hasCompany`](../corp/company.js.md#s-hasCompany) _js/corp/company.js_
- called by: [`beginPlay`](#s-beginPlay) · [`finishMove`](#s-finishMove) · [`playReport`](#s-playReport) ×2 · [`resumeHeld`](#s-resumeHeld) · [`resumeHeld>drop`](#s-resumeHeld-drop) · [`startFreeMine`](#s-startFreeMine) · [`startJob`](#s-startJob) · [`startRoute`](#s-startRoute) · [`startSell`](#s-startSell) · [`startSupply`](#s-startSupply) · [`startYard`](#s-startYard) · [`stepPlay`](#s-stepPlay)

<!-- note:netWorth -->
What the run is worth, which is not what is in the purse.

0.3.26 gave her a treasury to bank into, and the first thing that happened
was that every move which ended with a port call scored as a loss — the
money had not gone anywhere, it had gone into the company. A business is
measured by what it is worth, so the purse and the treasury are counted
together and the brain learns from the sum.
<!-- /note -->

### <a id="s-holdUsed"></a>`holdUsed()`

function · **exported** · L72–75

- calls: [`cargoTotal`](../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_
- called by: [`decide`](#s-decide) · [`jobPlan`](#s-jobPlan) ×2 · [`playReport`](#s-playReport) · [`stepPlay`](#s-stepPlay) · [`weightOf`](#s-weightOf)

<!-- note:holdUsed -->
How much of the hold is spoken for, 0…1.

- L74 · `return cargoTotal(sim.ship) / cap;` — 0.3.52: by bulk
<!-- /note -->

### <a id="s-note"></a>`note(text)`

function · L76–76

- calls: [`now`](#s-now)
- called by: [`beginPlay`](#s-beginPlay) · [`finishMove`](#s-finishMove) · [`resumeHeld`](#s-resumeHeld) · [`resumeHeld>drop`](#s-resumeHeld-drop) · [`startFreeMine`](#s-startFreeMine) · [`startJob`](#s-startJob) · [`startRoute`](#s-startRoute) · [`startSupply`](#s-startSupply) · [`startYard`](#s-startYard) · [`stepPlay`](#s-stepPlay) ×6 · [`tendBus`](#s-tendBus)

<!-- note:note -->
<!-- /note -->

### <a id="s-scoreOf"></a>`scoreOf(key)`

function · **exported** · L78–82

- called by: [`brainReport`](#s-brainReport) · [`weightOf`](#s-weightOf)

<!-- note:scoreOf -->
---- the brain --------------------------------------------------------------------

A move's score: credits per minute over every run of it, with an optimist's prior.

- L80 · `if (!m || m.secs < 30) return 900;` — untried work is worth a look
<!-- /note -->

### <a id="s-brainNote"></a>`brainNote(key, secs, cr, ok)`

function · **exported** · L84–86

- calls: [`learnOutcome`](mind.js.md#s-learnOutcome) _js/aria/mind.js_ · [`now`](#s-now)
- called by: [`finishMove`](#s-finishMove) · [`resumeHeld>drop`](#s-resumeHeld-drop)

<!-- note:brainNote -->
<!-- /note -->

### <a id="s-brainReport"></a>`brainReport()`

function · **exported** · L88–92

- calls: [`scoreOf`](#s-scoreOf)
- called by: [`playReport`](#s-playReport)

<!-- note:brainReport -->
What the brain has learned, best first.
<!-- /note -->

### <a id="s-honest"></a>`honest(st)`

function · L94–94

- called by: [`bestYard`](#s-bestYard) · [`nearestPort`](#s-nearestPort) · [`sourceFor`](#s-sourceFor)

<!-- note:honest -->
---- what there is to do ------------------------------------------------------------
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L95–95

- called by: [`bestYard`](#s-bestYard) · [`nearestPort`](#s-nearestPort)

<!-- note:d3 -->
<!-- /note -->

### <a id="s-nearestPort"></a>`nearestPort(pos=, except=)`

function · **exported** · L97–105

- calls: [`d3`](#s-d3) · [`honest`](#s-honest)
- called by: [`movesNow`](#s-movesNow)

<!-- note:nearestPort -->
<!-- /note -->

### <a id="s-jobSeconds"></a>`jobSeconds(o, from=)`

function · **exported** · L107–128

- calls: [`planRoute`](nav.js.md#s-planRoute) _js/aria/nav.js_ · [`targetPos`](../economy/contracts.js.md#s-targetPos) _js/economy/contracts.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×3
- called by: [`jobsFor`](#s-jobsFor) · [`resumeHeld`](#s-resumeHeld)

<!-- note:jobSeconds -->
The offers ARIA would consider at a port: her own department first, then
anything else she can actually fly. Ranked by pay for the time it will cost.

What a job will really cost in time: the legs it needs, flown the way the
autopilot flies them (js/aria/nav.js — climb, spool, run, fall, berth), plus
the crane at either end and the cutting if there is rock in it. The old
estimate divided distance by a flat cruise number, came out with three and a
half seconds for a four-minute leg, and so rated a job four hundred
kilometres away above one at the port she was standing on.

- L120 · `if (r.blocked) return Infinity;` — nothing across the system is worth a twenty-minute stall
- L124 · `s += (o.qty ?? 0) * 0.35;` — the crane, and the rock
<!-- /note -->

### <a id="s-jobsFor"></a>`jobsFor(st, dept=, now2=)`

function · **exported** · L130–141

- calls: [`canFly`](#s-canFly) · [`jobSeconds`](#s-jobSeconds) · [`now`](#s-now) · [`acceptBlocker`](../economy/contracts.js.md#s-acceptBlocker) _js/economy/contracts.js_ · [`boardFor`](../economy/contracts.js.md#s-boardFor) _js/economy/contracts.js_ · [`categoryOf`](../economy/contracts.js.md#s-categoryOf) _js/economy/contracts.js_
- called by: [`movesNow`](#s-movesNow)

<!-- note:jobsFor -->
<!-- /note -->

### <a id="s-sourceFor"></a>`sourceFor(good, qty, except=)`

function · **exported** · L143–152

- calls: [`honest`](#s-honest) · [`askPrice`](../economy/economy.js.md#s-askPrice) _js/economy/economy.js_ · [`stockOf`](../economy/economy.js.md#s-stockOf) _js/economy/economy.js_
- called by: [`canFly`](#s-canFly) · [`jobPlan`](#s-jobPlan)

<!-- note:sourceFor -->
A port that really has `qty` of `good` on the shelf and will sell it cheapest.
A "buy it and bring it here" job with nowhere to buy it is a job that ends in
a hold full of nothing and a broken contract, so ARIA checks before she signs.
<!-- /note -->

### <a id="s-canFly"></a>`canFly(o)`

function · **exported** · L154–172

- calls: [`hullFrac`](#s-hullFrac) · [`purse`](#s-purse) · [`sourceFor`](#s-sourceFor) · [`hullFit`](../economy/contracts.js.md#s-hullFit) _js/economy/contracts.js_ · [`askPrice`](../economy/economy.js.md#s-askPrice) _js/economy/economy.js_ ×2 · [`stockOf`](../economy/economy.js.md#s-stockOf) _js/economy/economy.js_ · [`roomFor`](../flight/ship.js.md#s-roomFor) _js/flight/ship.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×2
- via [js/npc/traffic.js](../npc/traffic.js.md): `traffic.some`
- via [js/npc/rogues.js](../npc/rogues.js.md): `nests.some`
- called by: [`jobsFor`](#s-jobsFor)

<!-- note:canFly -->
Can the bot actually finish this one? Combat and escorts need guns and a pilot.

- L155 · `if (o.mech === "escort") return false;` — needs to shadow a live boat: not yet
- L158 · `if (!hullFit().armed) return false;` — no guns, no bounty
- L159 · `if (hullFrac() < 0.6) return false;` — and not in a hull this thin
- L161 · `if (!o.markId && !(o.nestId && nests.some((n) => n.id === o.nestId))) return false;` — nothing to fly to
- L165 · `if (o.mech === "deliver" && !o.spot && !o.salvage && o.good) {` — a buy-and-bring job needs somewhere to buy it, and the purse to do it
- L169 · `if (askPrice(src, o.good) * o.qty >= o.pay) return false;` — it has to clear a profit
<!-- /note -->

### <a id="s-purse"></a>`purse()`

function · **exported** · L174–174

- calls: [`spendCap`](mind.js.md#s-spendCap) _js/aria/mind.js_
- called by: [`canFly`](#s-canFly) · [`startRoute`](#s-startRoute) · [`startSupply`](#s-startSupply)

<!-- note:purse -->
What she may put into one load of cargo: the purse above the working floor,
and never more than the captain's ceiling on a single purchase. Planning with
the same number the BUY step is checked against is what stops a route being
flown to its source and then refused at the till.
<!-- /note -->

### <a id="s-C"></a>`C(k, op, v)`

function · L176–176

- called by: [`jobPlan`](#s-jobPlan) ×3 · [`startFreeMine`](#s-startFreeMine)

<!-- note:C -->
---- turning a job into a flight plan -------------------------------------------------
<!-- /note -->

### <a id="s-jobPlan"></a>`jobPlan(a)`

function · **exported** · L178–255

- calls: [`C`](#s-C) ×3 · [`holdUsed`](#s-holdUsed) ×2 · [`jobPlan>go`](#s-jobPlan-go) ×9 · [`legsTo`](#s-legsTo) · [`sourceFor`](#s-sourceFor) · [`targetPos`](../economy/contracts.js.md#s-targetPos) _js/economy/contracts.js_ · [`stockOf`](../economy/economy.js.md#s-stockOf) _js/economy/economy.js_ · [`bulkOf`](../economy/materials.js.md#s-bulkOf) _js/economy/materials.js_ · [`roomFor`](../flight/ship.js.md#s-roomFor) _js/flight/ship.js_ · [`makeMission`](../mission/script.js.md#s-makeMission) _js/mission/script.js_ · [`makeStep`](../mission/script.js.md#s-makeStep) _js/mission/script.js_ ×17 · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×3
- via [js/npc/traffic.js](../npc/traffic.js.md): `traffic.find`
- via [js/npc/rogues.js](../npc/rogues.js.md): `nests.find`
- called by: [`resumeHeld`](#s-resumeHeld) · [`startJob`](#s-startJob) · [`stepPlay`](#s-stepPlay) ×2

<!-- note:jobPlan -->
The mission that completes `a`. Every op in it is an op the player has on
the mission editor, so a job ARIA can fly is a job you can automate.

- L182 · `let at = sim.ship.pos;` — where the hull will be at each stage, so each leg is planned from where the
  one before it ended rather than from where she is standing now
- L191 · `go(a.destId, a.destName);` — the consignment is signed over at the desk, not sold: stepPlay delivers on arrival
- L202 · `const w = t.kind === "body" ? null : targetPos(t, sim.time, {});` — A picket point is a STATION target with an offset on it, and a "wp" to
  the station itself parks you on the dock, nineteen kilometres from the
  point the contract is actually watching. Every visit target is resolved
  to a world point through the desk's own targetPos, which is the same
  function the contract checks you against.
- L221 · `const nest = a.nestId ? nests.find((n) => n.id === a.nestId) : null;` — a named mark is a lock; a drone cull is a place — sit off the nest with the
  guns hot and let them come to you, which is how the job is done by hand too
- L225 · `const k = 5000 / Math.max(1, Math.hypot(nest.x, nest.z));` — STAND OFF. Sitting on the nest cost a patrol boat 88% of its hull in
  seventy-three seconds: the drones launch at zero range and the guns
  have nothing to track. Five kilometres up-system is inside turret reach
  and outside the swarm's.
- L? · `if (holdUsed() > 0.12) {` — A job with a seam of its own: cut it where the desk put it. The hold has
  to be clear first — the cutter stops at a full hold, and a hold full of
  the drones' sphalerite is a hold with no room for the order.
- L237 · `const seam = a.spot ? { kind: "seam", x: a.spot.x, y: a.spot.y, z: a.spot.z, name: a.spot.` — plate is iron: a salvage order with no site of its own is cut off the nearest belt
- L238 · `if (a.spot) { const L = legsTo({ x: a.spot.x, y: a.spot.y, z: a.spot.z, name: a.spot.name,` — fly the corridor to the drift first if something is across it, then cut
- L243 · `const need = Math.max(0, Math.ceil((a.qty ?? 0) - (sim.ship.hold[a.good] ?? 0)));` — buy it where it is actually on the shelf, then bring it here. 0.3.60:
  only what the hold is SHORT — a re-flown restock whose first shelf ran
  dry bought the whole order again on top of what it already carried

- L194 · `const id = a.grant?.good ?? a.good;` — 0.3.84 made wrecks and pods a job for the SALVAGE system: nothing
  comes aboard with it off. She used to hold over the site for the
  dwell with the rig cold, fly home empty and lose the contract.
- L232 · `const mine = a.good ? ((sim.ship.hold[a.good] ?? 0) * bulkOf(a.good)) / Math.max(1, sim.sh` — Clear the hold of everything BUT the order's own ore: a job picked up
  again after a yard run used to sell what it had already cut.
<!-- /note -->

#### <a id="s-jobPlan-go"></a>`jobPlan>go(target, label)`

function · L183–189

- calls: [`legsTo`](#s-legsTo)
- called by: [`jobPlan`](#s-jobPlan) ×9

<!-- note:jobPlan>go -->
<!-- /note -->

### <a id="s-legsTo"></a>`legsTo(target, from, label=)`

function · L257–271

- calls: [`planRoute`](nav.js.md#s-planRoute) _js/aria/nav.js_ · [`makeStep`](../mission/script.js.md#s-makeStep) _js/mission/script.js_ ×2
- called by: [`jobPlan`](#s-jobPlan) · [`jobPlan>go`](#s-jobPlan-go) · [`startRoute>go`](#s-startRoute-go) · [`startSupply>go`](#s-startSupply-go)

<!-- note:legsTo -->
---- the moves ------------------------------------------------------------------------

Turn one destination into the GOTO steps that actually get there.

- L266 · `const nx = !last ? r.legs[i + 1] : null;` — 0.3.52: a dogleg is a way round, not a place — it carries the next
  leg's end so the executor can call it done once that corridor is clear
<!-- /note -->

### <a id="s-startJob"></a>`startJob(o)`

function · L273–290

- calls: [`authorize`](mind.js.md#s-authorize) _js/aria/mind.js_ · [`aimAt`](nav.js.md#s-aimAt) _js/aria/nav.js_ ×2 · [`lockOn`](nav.js.md#s-lockOn) _js/aria/nav.js_ ×2 · [`markPlace`](nav.js.md#s-markPlace) _js/aria/nav.js_ ×2 · [`jobPlan`](#s-jobPlan) · [`moveKeyFor`](#s-moveKeyFor) · [`netWorth`](#s-netWorth) · [`note`](#s-note) · [`now`](#s-now) ×2 · [`readyForTrouble`](#s-readyForTrouble) · [`abandonContract`](../economy/contracts.js.md#s-abandonContract) _js/economy/contracts.js_ · [`acceptContract`](../economy/contracts.js.md#s-acceptContract) _js/economy/contracts.js_ · [`targetPos`](../economy/contracts.js.md#s-targetPos) _js/economy/contracts.js_ · [`startMission`](../mission/run.js.md#s-startMission) _js/mission/run.js_
- via [js/economy/contracts.js](../economy/contracts.js.md): `contracts.active.find`
- called by: [`movesNow.start`](#s-movesNow-start)

<!-- note:startJob -->
- L277 · `if (o.armed || o.mech === "kill" || play.dept === "security") readyForTrouble();` — 0.3.24: she took a drone cull with the guns cold and the shields down and
  came back at nought per cent hull — twice. Anything that expects to be
  shot at goes out ready for it.
- L282 · `` if (a.spot) { markPlace(`${a.title} · ${a.spot.name}`, a.spot); lockOn(a.stationId); } `` — P-LOCK and a chart mark: the core, the cutter and the turrets all read the
  lock, and a human in the same sky can see where she thinks she is going
<!-- /note -->

### <a id="s-moveKeyFor"></a>`moveKeyFor(o)`

function · **exported** · L292–292

- called by: [`movesNow`](#s-movesNow) · [`resumeHeld`](#s-resumeHeld) · [`startJob`](#s-startJob)

<!-- note:moveKeyFor -->
<!-- /note -->

### <a id="s-startRoute"></a>`startRoute()`

function · L294–316

- calls: [`aimAt`](nav.js.md#s-aimAt) _js/aria/nav.js_ · [`planRoute`](nav.js.md#s-planRoute) _js/aria/nav.js_ ×2 · [`netWorth`](#s-netWorth) · [`note`](#s-note) · [`now`](#s-now) · [`purse`](#s-purse) · [`startRoute>go`](#s-startRoute-go) ×2 · [`tradeRoutes`](../economy/traderoutes.js.md#s-tradeRoutes) _js/economy/traderoutes.js_ · [`startMission`](../mission/run.js.md#s-startMission) _js/mission/run.js_ · [`makeMission`](../mission/script.js.md#s-makeMission) _js/mission/script.js_ · [`makeStep`](../mission/script.js.md#s-makeStep) _js/mission/script.js_ ×2

<!-- note:startRoute -->
- L? · `const purse = Math.max(0, sim.ship.credits - PLAY.minCredits);` — pick the best route whose BOTH legs she can actually fly from here
<!-- /note -->

#### <a id="s-startRoute-go"></a>`startRoute>go(id, nm)`

function · L305–305

- calls: [`legsTo`](#s-legsTo)
- called by: [`startRoute`](#s-startRoute) ×2

<!-- note:startRoute>go -->
<!-- /note -->

### <a id="s-startFreeMine"></a>`startFreeMine()`

function · L318–332

- calls: [`C`](#s-C) · [`netWorth`](#s-netWorth) · [`note`](#s-note) · [`now`](#s-now) · [`startMission`](../mission/run.js.md#s-startMission) _js/mission/run.js_ · [`makeMission`](../mission/script.js.md#s-makeMission) _js/mission/script.js_ · [`makeStep`](../mission/script.js.md#s-makeStep) _js/mission/script.js_ ×3

<!-- note:startFreeMine -->
<!-- /note -->

### <a id="s-readyForTrouble"></a>`readyForTrouble()`

function · **exported** · L334–339

- calls: [`setTurretMode`](../sim/sim.js.md#s-setTurretMode) _js/sim/sim.js_
- called by: [`startJob`](#s-startJob)

<!-- note:readyForTrouble -->
Guns hot, shields up, gravity off — what a pilot does before a fight.
<!-- /note -->

### <a id="s-hullFrac"></a>`hullFrac()`

function · **exported** · L341–341

- calls: [`hullMaxOf`](../flight/repair.js.md#s-hullMaxOf) _js/flight/repair.js_
- called by: [`canFly`](#s-canFly) · [`decide`](#s-decide) ×2 · [`movesNow`](#s-movesNow) · [`playReport`](#s-playReport) · [`shouldBreakOff`](#s-shouldBreakOff) · [`startYard`](#s-startYard) ×2 · [`stepPlay`](#s-stepPlay) ×2 · [`weightOf`](#s-weightOf)

<!-- note:hullFrac -->
0.3.24: she flew a hull at six per cent for a whole run before anybody looked.
<!-- /note -->

### <a id="s-startYard"></a>`startYard()`

function · L343–359

- calls: [`aimAt`](nav.js.md#s-aimAt) _js/aria/nav.js_ · [`bestYard`](#s-bestYard) · [`hullFrac`](#s-hullFrac) ×2 · [`netWorth`](#s-netWorth) · [`note`](#s-note) · [`now`](#s-now) ×3 · [`repairQuote`](../flight/repair.js.md#s-repairQuote) _js/flight/repair.js_ · [`startMission`](../mission/run.js.md#s-startMission) _js/mission/run.js_ · [`makeMission`](../mission/script.js.md#s-makeMission) _js/mission/script.js_ · [`makeStep`](../mission/script.js.md#s-makeStep) _js/mission/script.js_
- called by: [`stepPlay`](#s-stepPlay)

<!-- note:startYard -->
- L347 · `if (!repairQuote(st, sim.ship).ok) return false;` — a yard run you cannot pay for is a lap of the system for nothing — security
  spent a whole 25-minute bench doing exactly that, 106 moves and 98 cr a
  minute, because a hull under the threshold kept re-picking the same trip
<!-- /note -->

### <a id="s-bestYard"></a>`bestYard(pos=)`

function · **exported** · L361–370

- calls: [`d3`](#s-d3) · [`honest`](#s-honest) · [`repairQuote`](../flight/repair.js.md#s-repairQuote) _js/flight/repair.js_ · [`repairsAt`](../flight/repair.js.md#s-repairsAt) _js/flight/repair.js_
- called by: [`movesNow`](#s-movesNow) · [`startYard`](#s-startYard) · [`stepPlay`](#s-stepPlay)

<!-- note:bestYard -->
The nearest port that actually welds, weighted against what it charges.
<!-- /note -->

### <a id="s-startSupply"></a>`startSupply()`

function · L372–390

- calls: [`aimAt`](nav.js.md#s-aimAt) _js/aria/nav.js_ · [`planRoute`](nav.js.md#s-planRoute) _js/aria/nav.js_ ×2 · [`netWorth`](#s-netWorth) · [`note`](#s-note) · [`now`](#s-now) · [`purse`](#s-purse) · [`startSupply>go`](#s-startSupply-go) ×2 · [`sense`](senses.js.md#s-sense) _js/aria/senses.js_ · [`unpostedWork`](senses.js.md#s-unpostedWork) _js/aria/senses.js_ · [`holdRoom`](../flight/ship.js.md#s-holdRoom) _js/flight/ship.js_ · [`startMission`](../mission/run.js.md#s-startMission) _js/mission/run.js_ · [`makeMission`](../mission/script.js.md#s-makeMission) _js/mission/script.js_ · [`makeStep`](../mission/script.js.md#s-makeStep) _js/mission/script.js_ ×2 · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_

<!-- note:startSupply -->
0.3.25 — work nobody posted. A stalled production line is a standing order
with no contract on it: the smelter wants iron ore, somebody two ports over
has iron ore on the shelf, and the port will pay shortage prices for it.
Reading the ledgers instead of only the board is the difference between a
bot that answers adverts and a trader who knows the system.
<!-- /note -->

#### <a id="s-startSupply-go"></a>`startSupply>go(id, nm)`

function · L379–379

- calls: [`legsTo`](#s-legsTo)
- called by: [`startSupply`](#s-startSupply) ×2

<!-- note:startSupply>go -->
<!-- /note -->

### <a id="s-startSell"></a>`startSell()`

function · L392–403

- calls: [`netWorth`](#s-netWorth) · [`now`](#s-now) · [`sellable`](../economy/traderoutes.js.md#s-sellable) _js/economy/traderoutes.js_ · [`startMission`](../mission/run.js.md#s-startMission) _js/mission/run.js_ · [`makeMission`](../mission/script.js.md#s-makeMission) _js/mission/script.js_ · [`makeStep`](../mission/script.js.md#s-makeStep) _js/mission/script.js_ ×2

<!-- note:startSell -->
<!-- /note -->

### <a id="s-movesNow"></a>`movesNow()`

function · **exported** · L405–420

- calls: [`bestYard`](#s-bestYard) · [`hullFrac`](#s-hullFrac) · [`jobsFor`](#s-jobsFor) · [`moveKeyFor`](#s-moveKeyFor) · [`nearestPort`](#s-nearestPort) · [`now`](#s-now) · [`categoryOf`](../economy/contracts.js.md#s-categoryOf) _js/economy/contracts.js_ · [`bestRoute`](../economy/traderoutes.js.md#s-bestRoute) _js/economy/traderoutes.js_ · [`sellable`](../economy/traderoutes.js.md#s-sellable) _js/economy/traderoutes.js_ · [`holdRoom`](../flight/ship.js.md#s-holdRoom) _js/flight/ship.js_ · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`decide`](#s-decide)

<!-- note:movesNow -->
Every move ARIA could start right now, best first by what she has learned.

- L410 · `const mine = list.filter((o) => (o.cat ?? categoryOf(o.type)) === play.dept).slice(0, 3);` — her own department always gets a seat, even when something louder pays more
<!-- /note -->

#### <a id="s-movesNow-start"></a>`movesNow.start()`

prop · L411–411

- calls: [`startJob`](#s-startJob)

<!-- note:movesNow.start -->
<!-- /note -->

### <a id="s-rng"></a>`rng`

const · L422–422

- called by: [`rand`](#s-rand)

<!-- note:rng -->
---- the loop --------------------------------------------------------------------------

The draw behind exploration. Seedable so a run can be reproduced — a bot
whose choices cannot be replayed cannot be debugged.
<!-- /note -->

### <a id="s-setPlayRng"></a>`setPlayRng(fn)`

function · **exported** · L423–423

- called by: [`beginPlay`](#s-beginPlay)

<!-- note:setPlayRng -->
<!-- /note -->

### <a id="s-rand"></a>`rand()`

function · L424–424

- calls: [`rng`](#s-rng)
- called by: [`decide`](#s-decide) ×2

<!-- note:rand -->
<!-- /note -->

### <a id="s-weightOf"></a>`weightOf(key)`

function · **exported** · L426–431

- calls: [`policyScore`](mind.js.md#s-policyScore) _js/aria/mind.js_ · [`holdUsed`](#s-holdUsed) · [`hullFrac`](#s-hullFrac) · [`scoreOf`](#s-scoreOf)
- called by: [`decide`](#s-decide) ×3

<!-- note:weightOf -->
The score a move is CHOSEN on: what it has paid, leaning hard on her career.
<!-- /note -->

### <a id="s-hostilesClose"></a>`hostilesClose()`

function · **exported** · L433–433

- calls: [`senseSpace`](senses.js.md#s-senseSpace) _js/aria/senses.js_
- called by: [`decide`](#s-decide) · [`shouldBreakOff`](#s-shouldBreakOff)

<!-- note:hostilesClose -->
0.3.88 — what "avoid hostiles" means.

Core read it as "leave if anything hostile is inside 6,000 u". The belt puts
rogue drones 4,200 u from any hull that comes near it, so that was "never
work a belt": drop the job, dock, take another, fly out, drop it — and each
dropped contract stayed on the books until five of them locked the board.

It is now a line on the hull. With the order on and hostiles close she
breaks off at the captain's repair line; with it off, or nothing about, at
the old 30%. Either way the job is PAUSED, not thrown away: the contract is
kept, she patches, and picks it up again if the clock still allows.
<!-- /note -->

### <a id="s-shouldBreakOff"></a>`shouldBreakOff()`

function · **exported** · L434–437

- calls: [`hostilesClose`](#s-hostilesClose) · [`hullFrac`](#s-hullFrac)
- called by: [`stepPlay`](#s-stepPlay)

<!-- note:shouldBreakOff -->
<!-- /note -->

### <a id="s-heldFlyable"></a>`heldFlyable(a)`

function · L439–439

- calls: [`hullFit`](../economy/contracts.js.md#s-hullFit) _js/economy/contracts.js_
- called by: [`resumeHeld`](#s-resumeHeld)

<!-- note:heldFlyable -->
<!-- /note -->

### <a id="s-resumeHeld"></a>`resumeHeld()`

function · L441–463

- calls: [`authorize`](mind.js.md#s-authorize) _js/aria/mind.js_ · [`heldFlyable`](#s-heldFlyable) · [`jobPlan`](#s-jobPlan) · [`jobSeconds`](#s-jobSeconds) · [`moveKeyFor`](#s-moveKeyFor) · [`netWorth`](#s-netWorth) · [`note`](#s-note) · [`now`](#s-now) ×2 · [`resumeHeld>drop`](#s-resumeHeld-drop) ×3 · [`timeLeft`](../economy/contracts.js.md#s-timeLeft) _js/economy/contracts.js_ ×2 · [`startMission`](../mission/run.js.md#s-startMission) _js/mission/run.js_
- via [js/economy/contracts.js](../economy/contracts.js.md): `contracts.active.find`
- called by: [`decide`](#s-decide)

<!-- note:resumeHeld -->
A contract she holds and is not flying: the one she paused for the yard, or
one that was on the books when she took the conn. Flown before anything new
is taken off the desk — five idle contracts lock the board.
<!-- /note -->

#### <a id="s-resumeHeld-drop"></a>`resumeHeld>drop(why)`

function · L449–456

- calls: [`brainNote`](#s-brainNote) · [`netWorth`](#s-netWorth) · [`note`](#s-note) · [`now`](#s-now) · [`abandonContract`](../economy/contracts.js.md#s-abandonContract) _js/economy/contracts.js_
- called by: [`resumeHeld`](#s-resumeHeld) ×3

<!-- note:resumeHeld>drop -->
<!-- /note -->

### <a id="s-decide"></a>`decide()`

function · L465–476

- calls: [`authorize`](mind.js.md#s-authorize) _js/aria/mind.js_ · [`decideMind`](mind.js.md#s-decideMind) _js/aria/mind.js_ · [`holdUsed`](#s-holdUsed) · [`hostilesClose`](#s-hostilesClose) · [`hullFrac`](#s-hullFrac) ×2 · [`movesNow`](#s-movesNow) · [`now`](#s-now) ×2 · [`rand`](#s-rand) ×2 · [`resumeHeld`](#s-resumeHeld) · [`weightOf`](#s-weightOf) ×3
- called by: [`stepPlay`](#s-stepPlay)

<!-- note:decide -->
- L? · `const yard = hullFrac() < PLAY.patchAt ? opts.find((o) => o.key === "yard") : null;` — a hull this far gone is not a choice between moves: it is the move
<!-- /note -->

### <a id="s-finishMove"></a>`finishMove(ok, why)`

function · L478–488

- calls: [`brainNote`](#s-brainNote) · [`netWorth`](#s-netWorth) · [`note`](#s-note) · [`now`](#s-now)
- called by: [`endPlay`](#s-endPlay) · [`stepPlay`](#s-stepPlay) ×7

<!-- note:finishMove -->
<!-- /note -->

### <a id="s-beginPlay"></a>`beginPlay({…}=)`

function · **exported** · L490–512

- calls: [`resetBusiness`](company.js.md#s-resetBusiness) _js/aria/company.js_ · [`adoptBrain`](#s-adoptBrain) · [`brainOut`](#s-brainOut) · [`netWorth`](#s-netWorth) · [`note`](#s-note) · [`now`](#s-now) · [`setPlayRng`](#s-setPlayRng) · [`forgetSenses`](senses.js.md#s-forgetSenses) _js/aria/senses.js_

<!-- note:beginPlay -->
Start a career run. `brain` is a previous run's brainOut(), or null.
<!-- /note -->

### <a id="s-COMFORT"></a>`COMFORT`

const · L514–514

<!-- note:COMFORT -->
0.3.88 — the bus. The autopilot stands a mission down when the battery is
flat and the idle load is more than the core makes. At the conn ARIA sheds
load before that happens (pilot.js); the terminal player never did, so a
hull whose shields were regenerating under drone fire went flat, the
mission was stood down, and she took the next contract off the desk — which
was stood down a second later — every think tick, each one a broken
contract on some corporation's books, until the hull was gone.

She now switches the comfort loads off as the battery runs down with no
spare on the bus, puts them back when there is room, and with a flat
battery waits for charge instead of planning.
<!-- /note -->

### <a id="s-tendBus"></a>`tendBus()`

function · **exported** · L516–529

- calls: [`note`](#s-note) · [`busIdle`](../flight/autopilot.js.md#s-busIdle) _js/flight/autopilot.js_ · [`batteryCap`](../flight/ship.js.md#s-batteryCap) _js/flight/ship.js_ · [`setMiningMode`](../sim/sim.js.md#s-setMiningMode) _js/sim/sim.js_ · [`toggleSystem`](../sim/sim.js.md#s-toggleSystem) _js/sim/sim.js_ ×2
- called by: [`stepPlay`](#s-stepPlay)

<!-- note:tendBus -->
<!-- /note -->

### <a id="s-stepPlay"></a>`stepPlay(dt)`

function · **exported** · L531–592

- calls: [`runBusiness`](company.js.md#s-runBusiness) _js/aria/company.js_ · [`authorize`](mind.js.md#s-authorize) _js/aria/mind.js_ ×2 · [`bestYard`](#s-bestYard) · [`decide`](#s-decide) · [`finishMove`](#s-finishMove) ×7 · [`holdUsed`](#s-holdUsed) · [`hullFrac`](#s-hullFrac) ×2 · [`jobPlan`](#s-jobPlan) ×2 · [`netWorth`](#s-netWorth) · [`note`](#s-note) ×6 · [`now`](#s-now) ×9 · [`shouldBreakOff`](#s-shouldBreakOff) · [`startYard`](#s-startYard) · [`tendBus`](#s-tendBus) · [`abandonContract`](../economy/contracts.js.md#s-abandonContract) _js/economy/contracts.js_ ×4 · [`deliverableAt`](../economy/contracts.js.md#s-deliverableAt) _js/economy/contracts.js_ · [`deliverContracts`](../economy/contracts.js.md#s-deliverContracts) _js/economy/contracts.js_ · [`timeLeft`](../economy/contracts.js.md#s-timeLeft) _js/economy/contracts.js_ ×2 · [`repairQuote`](../flight/repair.js.md#s-repairQuote) _js/flight/repair.js_ ×2 · [`repairsAt`](../flight/repair.js.md#s-repairsAt) _js/flight/repair.js_ · [`yardRepair`](../flight/repair.js.md#s-yardRepair) _js/flight/repair.js_ · [`startMission`](../mission/run.js.md#s-startMission) _js/mission/run.js_ ×2 · [`stopMission`](../mission/run.js.md#s-stopMission) _js/mission/run.js_ ×6 · [`stationById`](../station/stations.js.md#s-stationById) _js/station/stations.js_ ×2
- via [js/economy/contracts.js](../economy/contracts.js.md): `contracts.active.find`

<!-- note:stepPlay -->
One tick of ARIA's head. Call it after tickSim(dt) — the sim moves the hull,
this decides what the hull is for.

- L538 · `if (sim.ship.dockedAt && deliverableAt(sim.ship.dockedAt).length) {` — anything deliverable where we are docked is money on the floor
- L542 · `if (sim.ship.dockedAt) {` — A port call is when a hiring hall, a registrar and a housing office are all
  in reach, and none of them are anywhere else. 0.3.26: she runs the business
  while she is standing in it — signs hands, posts them to watches, registers
  the charter, settles the ones the ship is done with, banks the surplus.
- L547 · `if (sim.ship.dockedAt && hullFrac() < 0.995 && repairsAt(stationById(sim.ship.dockedAt)) &` — docked at a yard with a hurt hull: buy the plate back before anything else
- L? · `if (play.move && play.move.kind !== "yard" && hullFrac() < PLAY.runAt && now() - (play.yar` — The hull is nearly open to space: nothing on the board is worth the next
  hit. Once only — the cooldown in startYard is what stops this becoming a
  loop of break off, dock, spend what is left, take another job, break off,
  which is what the first version of it did 146 times in eight minutes.
- L573 · `if (a && a.good && a.qty && holdUsed() > 0.95 && (sim.ship.hold[a.good] ?? 0) < a.qty && !` — the hold has filled with something that is not the order: go and sell it,
  then come back to the seam. The drones do not pack it any more (0.3.24),
  but a run that started full still has to clear it.
- L580 · `if (a && (m.replans ?? 0) < PLAY.replans) { m.replans = (m.replans ?? 0) + 1; if (startMis` — the plan ran out but the job is still in hand: fly it again before giving up —
  an arrival that missed the dwell, or a buy that could not fill, is worth one more pass
<!-- /note -->

### <a id="s-brainSig"></a>`brainSig()`

function · **exported** · L594–594

- called by: [`adoptBrain`](#s-adoptBrain) · [`brainOut`](#s-brainOut)

<!-- note:brainSig -->
A brain is only worth what the rules it was learned under are still worth.
0.3.24 took 46% out of trade routes; a brain from before it carried `route`
at eleven thousand credits a minute and kept picking it, in a sky where that
number no longer existed. The signature is the build and the two constants
that decide what a run is worth — change either and the old scores are
discarded rather than believed.
<!-- /note -->

### <a id="s-brainOut"></a>`brainOut()`

function · **exported** · L596–598

- calls: [`brainSig`](#s-brainSig) · [`now`](#s-now)
- called by: [`beginPlay`](#s-beginPlay) · [`endPlay`](#s-endPlay)

<!-- note:brainOut -->
The brain, ready for a file.
<!-- /note -->

### <a id="s-adoptBrain"></a>`adoptBrain(saved, sky=)`

function · **exported** · L600–605

- calls: [`brainSig`](#s-brainSig)
- called by: [`beginPlay`](#s-beginPlay)

<!-- note:adoptBrain -->
What a saved brain is worth here, and why. → { moves, runs, why }
<!-- /note -->

### <a id="s-playReport"></a>`playReport()`

function · **exported** · L607–644

- calls: [`bizLine`](company.js.md#s-bizLine) _js/aria/company.js_ · [`bizReport`](company.js.md#s-bizReport) _js/aria/company.js_ · [`brainReport`](#s-brainReport) · [`holdUsed`](#s-holdUsed) · [`hullFrac`](#s-hullFrac) · [`jobProgress`](#s-jobProgress) · [`netWorth`](#s-netWorth) ×2 · [`now`](#s-now) ×2 · [`senseLine`](senses.js.md#s-senseLine) _js/aria/senses.js_ · [`chainReport`](../economy/chains.js.md#s-chainReport) _js/economy/chains.js_ ×2 · [`jobStatus`](../economy/contracts.js.md#s-jobStatus) _js/economy/contracts.js_ · [`timeLeft`](../economy/contracts.js.md#s-timeLeft) _js/economy/contracts.js_ ×2 · [`goodName`](../economy/materials.js.md#s-goodName) _js/economy/materials.js_ · [`batteryCap`](../flight/ship.js.md#s-batteryCap) _js/flight/ship.js_ · [`handlingLeft`](../station/dockwork.js.md#s-handlingLeft) _js/station/dockwork.js_ · [`handlingLine`](../station/dockwork.js.md#s-handlingLine) _js/station/dockwork.js_
- via [js/economy/contracts.js](../economy/contracts.js.md): `contracts.active.find`
- called by: [`endPlay`](#s-endPlay)

<!-- note:playReport -->
Where the run stands, for a terminal or a test. Everything a screen needs.

- L619 · `hold: holdUsed(),` — the hull, as fractions a bar can draw
- L625 · `` move: play.move ? `${play.move.key}${play.move.note ? ` · ${play.move.note}` : ""}` : null `` — the job in hand
<!-- /note -->

### <a id="s-jobProgress"></a>`jobProgress(a)`

function · **exported** · L646–650

- called by: [`playReport`](#s-playReport)

<!-- note:jobProgress -->
How far through a job is, 0…1 — cargo for a delivery, the engine's own progress otherwise.
<!-- /note -->

### <a id="s-endPlay"></a>`endPlay()`

function · **exported** · L652–657

- calls: [`brainOut`](#s-brainOut) · [`finishMove`](#s-finishMove) · [`playReport`](#s-playReport) · [`stopMission`](../mission/run.js.md#s-stopMission) _js/mission/run.js_

<!-- note:endPlay -->
<!-- /note -->
