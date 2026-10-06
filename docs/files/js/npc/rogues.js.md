# js/npc/rogues.js

[index](../../../README.md) · 384 lines · 36 symbols · 7 imports · 10 importers

## About

<!-- note:@file -->
LIVING GALAXY — the rogue drones, and where they come from.

"Rogue drone" used to be a string. One contact type in turrets.js, spawned
on a dice roll within four kilometres of the player whenever the player was
near the belt, flying straight at them, despawning at sixteen kilometres,
dropping steel into their hold when killed. It existed only where the
player was standing, it only ever attacked the player, and nothing else in
the sky knew it was there.

Now they come from somewhere and they are going somewhere.

  A NEST is a derelict — a dead yard, a cracked hauler, a mining platform
  nobody came back for — with something still running in it that is building
  drones out of whatever drifts past. Two or three per sky, seeded, out in
  the belt and the cold parts of the system where nobody patrols.

  A WAVE is what comes out. It has a target picked before it launches: a
  port, a hull working the lanes, or a rival nest — because two machine
  intelligences building drones out of the same belt are competitors, and
  the sky is more interesting when the monsters have their own quarrel.

A wave's drones are ordinary roster hulls with `rogue` set, which is the
whole trick: they fly with npc/flight.js, fight with npc/combat.js, show on
the board and the chart like anything else, get shot at by station
batteries, and provoke a distress call from whatever they jump. Nothing had
to learn about them specially.

They are not a faction and they do not negotiate. There is no hailing a
nest and no paying it off.

- L11 · `export const WAVE_SLOT = 210;` — seconds between a nest's launch rolls
- L12 · `export const WAVE_CHANCE = 0.34;` — and the chance a roll sends one
- L41 · `export const WAVE_TTL = 620;` — a wave that has achieved nothing goes home
- L42 · `export const REBUILD_S = 260;` — a nest that lost a wave needs this long before the next
- L43 · `export const SIEGE_R = 2400;` — close enough to a port to be working on it
- L44 · `export const CHASE_GIVEUP = 260000;` — a wave stops chasing a hull that has outrun it
- L45 · `export const SIEGE_RATE = 0.9;` — stock destroyed per drone per second inside SIEGE_R
- L49 · `export const nests = [];` — live nests
- L50 · `export const waves = [];` — live waves
- L384 · `HOSTILE_ROLES.add("rogue");` — rogues are hostile to everything with a crew, which is what makes station
  batteries and the directorate answer them without being told to
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../world/generate.js` | `rngFromSeed` | [js/world/generate.js](../world/generate.js.md) |
| 2 | `../station/stations.js` | `stations` as `liveStations` | [js/station/stations.js](../station/stations.js.md) |
| 3 | `../world/bodies.js` | `currentSystem` | [js/world/bodies.js](../world/bodies.js.md) |
| 4 | `./traffic.js` | `traffic`, `removeVessel`, `reindexTraffic`, `markVesselDown` **unused**, `HOSTILE_ROLES` | [js/npc/traffic.js](traffic.js.md) |
| 5 | `./flight.js` | `armFlight`, `hullPerf`, `flyStep` | [js/npc/flight.js](flight.js.md) |
| 6 | `../station/stationworks.js` | `worksFor` | [js/station/stationworks.js](../station/stationworks.js.md) |
| 7 | `../core/perf.js` | `waveCap`, `perf` | [js/core/perf.js](../core/perf.js.md) |

## Imported by

- [js/aria/play.js](../aria/play.js.md) — `nests`
- [js/aria/senses.js](../aria/senses.js.md) — `nests`
- [js/economy/contracts.js](../economy/contracts.js.md) — `nests`
- [js/mission/salvage.js](../mission/salvage.js.md) — `nests`
- [js/npc/ground.js](ground.js.md) — `nests`
- [js/sim/sim.js](../sim/sim.js.md) — `populateNests`, `stepRogues`, `mountRogues`, `rogueHooks`, `rogueReport`, `nests`, `waves`
- test/hostilegun.test.mjs _(outside js/)_ — 
- test/hotpath-optimization.test.mjs _(outside js/)_ — `waves`, `nests`, `rogueHooks`, `stepRogues`, `TIDE`
- test/reactive.test.mjs _(outside js/)_ — `nests`, `waves`, `launchWave`, `stepRogues`, `rogueReport`, `nestById`, `WAVE_SLOT`
- test/rogues.test.mjs _(outside js/)_ — `nests`, `waves`, `populateNests`, `launchWave`, `stepRogues`, `rogueReport`, `rogueTide`, `tideState`, `TIDE`, `WAVE_SLOT`, `WAVE_TTL`

## Exports

- [`NEST_MIN`](#s-NEST_MIN) · const — **no importer in scanned roots**
- [`NEST_MAX`](#s-NEST_MAX) · const — **no importer in scanned roots**
- [`WAVE_SLOT`](#s-WAVE_SLOT) · const — used by test/reactive.test.mjs, test/rogues.test.mjs
- [`WAVE_CHANCE`](#s-WAVE_CHANCE) · const — **no importer in scanned roots**
- [`TIDE`](#s-TIDE) · const — used by test/hotpath-optimization.test.mjs, test/rogues.test.mjs
- [`rogueTide`](#s-rogueTide) · function — used by test/rogues.test.mjs
- [`tideState`](#s-tideState) · function — used by test/rogues.test.mjs
- [`WAVE_TTL`](#s-WAVE_TTL) · const — used by test/rogues.test.mjs
- [`REBUILD_S`](#s-REBUILD_S) · const — **no importer in scanned roots**
- [`SIEGE_R`](#s-SIEGE_R) · const — **no importer in scanned roots**
- [`CHASE_GIVEUP`](#s-CHASE_GIVEUP) · const — **no importer in scanned roots**
- [`SIEGE_RATE`](#s-SIEGE_RATE) · const — **no importer in scanned roots**
- [`DRONE_HULLS`](#s-DRONE_HULLS) · const — **no importer in scanned roots**
- [`NEST_COLOURS`](#s-NEST_COLOURS) · const — **no importer in scanned roots**
- [`nests`](#s-nests) · const — used by [js/aria/play.js](../aria/play.js.md), [js/aria/senses.js](../aria/senses.js.md), [js/economy/contracts.js](../economy/contracts.js.md), [js/mission/salvage.js](../mission/salvage.js.md), [js/npc/ground.js](ground.js.md), [js/sim/sim.js](../sim/sim.js.md), test/hotpath-optimization.test.mjs, test/reactive.test.mjs, test/rogues.test.mjs
- [`waves`](#s-waves) · const — used by [js/sim/sim.js](../sim/sim.js.md), test/hotpath-optimization.test.mjs, test/reactive.test.mjs, test/rogues.test.mjs
- [`rogueHooks`](#s-rogueHooks) · const — used by [js/sim/sim.js](../sim/sim.js.md), test/hotpath-optimization.test.mjs
- [`resetRogues`](#s-resetRogues) · function — **no importer in scanned roots**
- [`populateNests`](#s-populateNests) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/rogues.test.mjs
- [`nestById`](#s-nestById) · function — used by test/reactive.test.mjs
- [`launchWave`](#s-launchWave) · function — used by test/reactive.test.mjs, test/rogues.test.mjs
- [`flyRogue`](#s-flyRogue) · function — **no importer in scanned roots**
- [`stepRogues`](#s-stepRogues) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/hotpath-optimization.test.mjs, test/reactive.test.mjs, test/rogues.test.mjs
- [`mountRogues`](#s-mountRogues) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`rogueReport`](#s-rogueReport) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/reactive.test.mjs, test/rogues.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-NEST_MIN"></a>`NEST_MIN`

const · **exported** · L9–9

<!-- note:NEST_MIN -->
---- tuning --------------------------------------------------------------
<!-- /note -->

### <a id="s-NEST_MAX"></a>`NEST_MAX`

const · **exported** · L10–10

<!-- note:NEST_MAX -->
<!-- /note -->

### <a id="s-WAVE_SLOT"></a>`WAVE_SLOT`

const · **exported** · L11–11

<!-- note:WAVE_SLOT -->
<!-- /note -->

### <a id="s-WAVE_CHANCE"></a>`WAVE_CHANCE`

const · **exported** · L12–12

<!-- note:WAVE_CHANCE -->
<!-- /note -->

### <a id="s-TIDE"></a>`TIDE`

const · **exported** · L14–21

<!-- note:TIDE -->
---- the tide -----------------------------------------------------------

0.3.30. Every nest rolled on the same fixed chance for ever, so the sky
settled on a constant: three nests, a launch about every three and a half
minutes, waves living ten — roughly fifteen rogue drones in the belt at all
times, always, whatever else was happening. Reported as exactly that: they
swarm the belts, they are always there, and there are always about the same
number of them.

A derelict yard putting drones together out of belt scrap is not a tap. It
builds up, it spends itself, and it goes quiet for a while. So there is a
TIDE: a slow pressure on the whole sky, made of three seeded swells at
different periods, that spends real time at the bottom.

Under `calm` the sky is genuinely empty — nothing launches, and anything
still out there is recalled rather than left to expire. Over `surge` the
nests are busy and the waves run large. In between is ordinary. The periods
are deliberately not multiples of each other, so the pattern does not repeat
on a schedule you could set a clock by.

It is deterministic in the sky seed and in the clock, which means every
client in a shared sky is in the same weather without a byte crossing the
wire — the same trick the belt and the timetables already use.

- L15 · `swells: [[1450, 1], [640, 0.55], [3100, 0.7]],` — period (s), weight
- L16 · `calm: 0.26,` — below this the sky is quiet and nests hold
- L17 · `surge: 0.68,` — above this they are busy
- L18 · `lift: 2.1,` — launch chance at full surge, × the base
- L19 · `size: 0.55,` — …and how much of the wave size rides the tide
- L20 · `recall: true,` — a wave caught out by a lull goes home rather than expiring
<!-- /note -->

### <a id="s-tideSeed"></a>`tideSeed`

const · L23–23

<!-- note:tideSeed -->
<!-- /note -->

### <a id="s-rogueTide"></a>`rogueTide(t=)`

function · **exported** · L25–34

- called by: [`launchWave`](#s-launchWave) · [`stepRogues`](#s-stepRogues) ×2 · [`tideState`](#s-tideState)

<!-- note:rogueTide -->
Pressure on the sky, 0…1, deterministic in the sky seed and the clock.

- L33 · `return Math.pow(sum / total, 1.7);` — squared, so the bottom is broad and flat: long quiets, sharp surges
<!-- /note -->

### <a id="s-tideState"></a>`tideState(t=)`

function · **exported** · L36–40

- calls: [`rogueTide`](#s-rogueTide)
- called by: [`rogueReport`](#s-rogueReport)

<!-- note:tideState -->
What the tide is doing, in a word — for the band, the console and the log.
<!-- /note -->

### <a id="s-WAVE_TTL"></a>`WAVE_TTL`

const · **exported** · L41–41

<!-- note:WAVE_TTL -->
<!-- /note -->

### <a id="s-REBUILD_S"></a>`REBUILD_S`

const · **exported** · L42–42

<!-- note:REBUILD_S -->
<!-- /note -->

### <a id="s-SIEGE_R"></a>`SIEGE_R`

const · **exported** · L43–43

<!-- note:SIEGE_R -->
<!-- /note -->

### <a id="s-CHASE_GIVEUP"></a>`CHASE_GIVEUP`

const · **exported** · L44–44

<!-- note:CHASE_GIVEUP -->
<!-- /note -->

### <a id="s-SIEGE_RATE"></a>`SIEGE_RATE`

const · **exported** · L45–45

<!-- note:SIEGE_RATE -->
<!-- /note -->

### <a id="s-DRONE_HULLS"></a>`DRONE_HULLS`

const · **exported** · L46–46

<!-- note:DRONE_HULLS -->
<!-- /note -->

### <a id="s-NEST_COLOURS"></a>`NEST_COLOURS`

const · **exported** · L47–47

<!-- note:NEST_COLOURS -->
<!-- /note -->

### <a id="s-nests"></a>`nests`

const · **exported** · L49–49

<!-- note:nests -->
<!-- /note -->

### <a id="s-waves"></a>`waves`

const · **exported** · L50–50

<!-- note:waves -->
<!-- /note -->

### <a id="s-rogueHooks"></a>`rogueHooks`

const · **exported** · L51–51

<!-- note:rogueHooks -->
<!-- /note -->

### <a id="s-seq"></a>`seq`

const · L53–53

<!-- note:seq -->
<!-- /note -->

### <a id="s-rng"></a>`rng`

const · L54–54

- called by: [`launchWave`](#s-launchWave) · [`makeDrone`](#s-makeDrone) ×8 · [`pickTarget`](#s-pickTarget) · [`populateNests`](#s-populateNests) ×8 · [`stepRogues`](#s-stepRogues) ×2

<!-- note:rng -->
<!-- /note -->

### <a id="s-slotSeen"></a>`slotSeen`

const · L55–55

<!-- note:slotSeen -->
<!-- /note -->

### <a id="s-resetRogues"></a>`resetRogues(seed)`

function · **exported** · L57–64

- calls: [`removeVessel`](traffic.js.md#s-removeVessel) _js/npc/traffic.js_ · [`rngFromSeed`](../world/generate.js.md#s-rngFromSeed) _js/world/generate.js_
- called by: [`populateNests`](#s-populateNests)

<!-- note:resetRogues -->
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L66–66

- called by: [`flyRogue`](#s-flyRogue) ×3 · [`pickTarget`](#s-pickTarget) ×3 · [`stepRogues`](#s-stepRogues) ×2

<!-- note:d3 -->
<!-- /note -->

### <a id="s-NEST_NAMES"></a>`NEST_NAMES`

const · L68–71

<!-- note:NEST_NAMES -->
---- the nests -----------------------------------------------------------
<!-- /note -->

### <a id="s-populateNests"></a>`populateNests(seed, system=, stationList=)`

function · **exported** · L73–103

- calls: [`resetRogues`](#s-resetRogues) · [`rng`](#s-rng) ×8
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:populateNests -->
Seed this sky's nests. Deterministic in the seed: the same sky, the same derelicts.

- L75 · `tideSeed = rng();` — the tide's phase belongs to the sky, so two pilots in one room get the
  same quiet and the same swarm without exchanging anything
- L80 · `const a = (i / count) * Math.PI * 2 + rng() * 0.8;` — far enough out that a port's guns are not the answer, and far enough
  from each other that their waves have to cross open space to meet
- L92 · `strength: 0.7 + rng() * 0.6,` — how big its waves run
- L93 · `ready: 0,` — sky time it can launch again
- L98 · `known: false,` — has anyone seen it yet
<!-- /note -->

### <a id="s-nestById"></a>`nestById(id)`

function · **exported** · L105–105

- called by: [`flyRogue`](#s-flyRogue) · [`resolveTarget`](#s-resolveTarget) · [`retarget`](#s-retarget) · [`stepRogues`](#s-stepRogues) ×2

<!-- note:nestById -->
<!-- /note -->

### <a id="s-makeDrone"></a>`makeDrone(nest, i, t)`

function · L107–160

- calls: [`armFlight`](flight.js.md#s-armFlight) _js/npc/flight.js_ · [`hullPerf`](flight.js.md#s-hullPerf) _js/npc/flight.js_ · [`rng`](#s-rng) ×8
- called by: [`launchWave`](#s-launchWave)

<!-- note:makeDrone -->
---- launching -----------------------------------------------------------

- L149 · `const p2 = hullPerf({ role: "rogue", ship: hull });` — a drone is small, quick and brittle: it wins by arriving in numbers
<!-- /note -->

### <a id="s-pickTarget"></a>`pickTarget(nest, t, stationList)`

function · L162–188

- calls: [`d3`](#s-d3) ×3 · [`rng`](#s-rng)
- called by: [`launchWave`](#s-launchWave) · [`retarget`](#s-retarget)

<!-- note:pickTarget -->
Pick what a nest sends its next wave at.

- L164 · `for (const st of stationList) {` — a port: the nearer and the less defended, the more attractive
- L171 · `for (const n of traffic) {` — a hull working the lanes: a supply run is the softest thing in the sky
- L178 · `for (const o of nests) {` — a rival nest: they are building out of the same belt
<!-- /note -->

### <a id="s-launchWave"></a>`launchWave(nest, t, stationList=, tide=)`

function · **exported** · L190–220

- calls: [`waveCap`](../core/perf.js.md#s-waveCap) _js/core/perf.js_ · [`makeDrone`](#s-makeDrone) · [`pickTarget`](#s-pickTarget) · [`rng`](#s-rng) · [`rogueTide`](#s-rogueTide) · [`reindexTraffic`](traffic.js.md#s-reindexTraffic) _js/npc/traffic.js_
- via [js/npc/traffic.js](traffic.js.md): `traffic.push`
- called by: [`stepRogues`](#s-stepRogues)

<!-- note:launchWave -->
Send a wave. Returns it, or null if the nest is not ready or nothing is worth hitting.

- L194 · `const p = tide == null ? rogueTide(t) : tide;` — 0.3.30 — the size rides the tide as well as the roll, so a quiet sky that
  does send something sends two, and a swarm is a swarm. A flat 3–8 every
  time is what made the belt feel like a fixed cost.
<!-- /note -->

### <a id="s-flyRogue"></a>`flyRogue(n, t, dt, ctx)`

function · **exported** · L222–251

- calls: [`armFlight`](flight.js.md#s-armFlight) _js/npc/flight.js_ · [`flyStep`](flight.js.md#s-flyStep) _js/npc/flight.js_ ×2 · [`d3`](#s-d3) ×3 · [`nestById`](#s-nestById) · [`resolveTarget`](#s-resolveTarget) · [`retarget`](#s-retarget) ×2
- called by: [`mountRogues`](#s-mountRogues)

<!-- note:flyRogue -->
---- the drones' own flying ----------------------------------------------

A rogue drone flies its wave's target unless npc/combat.js has already
given it something closer to shoot. Installed as a director downstream of
combat, so a drone that has found prey fights it and the rest press on.

- L229 · `if (!wave || wave.state === "home") {` — no wave left, or recalled: head home and dissolve back into the nest
- L240 · `const live = resolveTarget(tg, ctx?.stations ?? liveStations);` — the target may have moved, been destroyed, or docked
- L242 · `if (tg.kind === "hull" && (live.drive || d3(n, live) > CHASE_GIVEUP)) { retarget(wave, t,` — a hull that lit its drive is gone and is not coming back into reach: a
  wave that keeps chasing it flies out of the system and achieves nothing.
  Pick something else while there is still time on the clock.
- L248 · `const spread = 260 + (n.way ?? 0) * 190;` — a swarm spreads out on the way in so a point-defence cluster cannot take
  the whole wave with one traverse
<!-- /note -->

### <a id="s-retarget"></a>`retarget(wave, t, stationList)`

function · L253–261

- calls: [`nestById`](#s-nestById) · [`pickTarget`](#s-pickTarget)
- via [js/npc/traffic.js](traffic.js.md): `traffic.find`
- called by: [`flyRogue`](#s-flyRogue) ×2

<!-- note:retarget -->
The wave's objective is gone or unreachable: pick another, or go home.
<!-- /note -->

### <a id="s-resolveTarget"></a>`resolveTarget(tg, stationList)`

function · L263–268

- calls: [`nestById`](#s-nestById)
- via [js/npc/traffic.js](traffic.js.md): `traffic.find`
- called by: [`flyRogue`](#s-flyRogue)

<!-- note:resolveTarget -->
<!-- /note -->

### <a id="s-indexWaveVessels"></a>`indexWaveVessels()`

function · L270–274

- called by: [`stepRogues`](#s-stepRogues) ×4

<!-- note:indexWaveVessels -->
<!-- /note -->

### <a id="s-stepRogues"></a>`stepRogues(t, dt, stationList=, shipPos=)`

function · **exported** · L276–365

- calls: [`d3`](#s-d3) ×2 · [`indexWaveVessels`](#s-indexWaveVessels) ×4 · [`launchWave`](#s-launchWave) · [`nestById`](#s-nestById) ×2 · [`rng`](#s-rng) ×2 · [`rogueTide`](#s-rogueTide) ×2 · [`removeVessel`](traffic.js.md#s-removeVessel) _js/npc/traffic.js_ · [`worksFor`](../station/stationworks.js.md#s-worksFor) _js/station/stationworks.js_
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepRogues -->
Vessel lookups use a first-match index scoped to this call, rebuilt after removals and mutation-capable hooks. Never reuse it across calls: exported traffic can be replaced without changing length. Duplicate IDs preserve Array.find ordering.

---- the tick ------------------------------------------------------------

- L277 · `const slot = Math.floor(t / WAVE_SLOT);` — launch rolls, on the shared slot cadence
- L283 · `if (tide < TIDE.calm) continue;` — 0.3.30: nothing builds during a lull. The nest is still there, it is
  just not sending anything, which is what makes the belt worth flying
  through some of the time.
- L284 · `const chance = WAVE_CHANCE * (perf.tier >= 2 ? 1 : 0.55) * (1 + (TIDE.lift - 1) * tide);` — a busy sky sends fewer: the budget decides how much of this the
  device can carry, not a guess about the device
- L291 · `for (let i = waves.length - 1; i >= 0; i--) {` — waves: siege, expiry, and cleaning up the dead
- L311 · `if (TIDE.recall && w.state !== "home" && rogueTide(t) < TIDE.calm) { w.state = "home"; w.e` — 0.3.30: the tide went out from under them — they break off and go home
  rather than hanging about until their ten minutes are up
- L313 · `if (w.target.kind === "station" && w.state !== "home") {` — a wave sitting on a port is taking it apart
- L326 · `const w2 = worksFor(st);` — they are not raiding it, they are eating it: the magazines and the
  drone racks go first, which is exactly what the port needs to
  fight them off. A siege left alone disarms the port that is
  under it.
- L345 · `if (w.target.kind === "nest" && w.state !== "home") {` — and a wave sitting on a rival nest is dismantling it
- L358 · `for (let k = waves.length - 1; k >= 0; k--) if (waves[k].nest === o.id) waves[k].state = "` — its own drones go with it
<!-- /note -->

### <a id="s-mountRogues"></a>`mountRogues(trafficHooks)`

function · **exported** · L367–373

- calls: [`flyRogue`](#s-flyRogue)
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:mountRogues -->
Install the director. Chain-safe, and deliberately LAST in the chain: a
drone that npc/combat.js has put onto a target fights that target, and only
one with nothing in front of it presses on toward the wave's objective.
<!-- /note -->

### <a id="s-rogueReport"></a>`rogueReport(t)`

function · **exported** · L375–382

- calls: [`tideState`](#s-tideState)
- via [js/npc/traffic.js](traffic.js.md): `traffic.reduce`

<!-- note:rogueReport -->
Everything the console and the news desk want.
<!-- /note -->

## Module-level calls

- via [js/npc/traffic.js](traffic.js.md): `HOSTILE_ROLES.add`
