# js/npc/combat.js

[index](../../../README.md) · 290 lines · 37 symbols · 6 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY — NPC hulls that actually fight each other.

What was here before was theatre with a verdict attached. `npc/battles.js`
rolled an engagement out of the sky seed, decided at roll time which hull
would be destroyed and when, flew everyone in decorative circles, and fired
damage-0 tracers between them until the clock reached the moment the seed
had already chosen. Nothing you did mattered unless you personally shot a
pirate, and nothing that happened out of your sight happened at all.

Now the rounds decide. A pirate picks a target because it is worth taking,
closes on it, and fires real ordnance; the victim runs for the nearest
guns and puts out a call; whatever the directorate sends arrives when the
clock says it will and fights until one side is finished. Nobody knows the
outcome in advance, including this module.

---- near and far --------------------------------------------------------

Simulating ballistics for every fight in a system, most of them hundreds of
kilometres from anyone who could see them, is work spent on nothing. So a
fight is resolved one of two ways depending on whether the player could
plausibly be watching it:

  NEAR (inside sensor range)  real rounds, real flight, real misses. You
                              can fly into it, join it, finish it, or take
                              the loser's cargo out of the wreck.
  FAR                         resolved on the numbers, on a slow tick:
                              effective firepower against effective
                              integrity, with the same hp the near model
                              uses. A hull that loses a fight out of sight
                              is just as dead, and the survivor carries the
                              damage it took into the next one.

The two agree because they share the hull's own numbers. Fly out to a fight
that started while you were elsewhere and you find it in progress, with the
damage already done still on the hulls.

- L8 · `export const PROWL_R = 220000;` — how far a raider will look for something worth taking
- L9 · `export const HUNT_R = 5200;` — and the range at which the law reacts to what is in front of it
- L10 · `export const ENGAGE_R = 1500;` — guns open inside this
- L11 · `export const CLOSE_R = 12000;` — inside this the stalk becomes an attack run
- L12 · `export const STALK_TOP = 9000;` — a raider's own drive, for getting into the same volume
- L13 · `export const ALARM_R = 9000;` — the victim notices it is being stalked at about here
- L14 · `export const BREAK_R = 9000;` — an engaged hull gives up past this
- L15 · `export const HUNT_FOR = 420;` — and a stalk expires after this long regardless
- L16 · `export const FLEE_SPEED = 1.35;` — a running hull's cruise multiplier
- L17 · `export const FLEE_FOR = 90;` — how long a hull keeps running after the last round
- L18 · `export const NEAR_R = 32000;` — inside this of the player, fights fly real rounds
- L19 · `export const FAR_TICK = 2.0;` — seconds between abstract resolutions
- L20 · `export const HIT_CHANCE = 0.42;` — fraction of aimed rounds that connect, near and far alike
- L22 · `export const combatLog = [];` — recent kills, for the news desk and the console
- L245 · `const LOOK_TICK = 1.4;` — how often a hull sweeps for something to attack
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./traffic.js` | `traffic`, `vesselById`, `trafficHooks`, `markVesselDown`, `HOSTILE_ROLES`, `LAW_ROLES` | [js/npc/traffic.js](traffic.js.md) |
| 2 | `./flight.js` | `armFlight`, `flyStep`, `faceAt` | [js/npc/flight.js](flight.js.md) |
| 3 | `../flight/turrets.js` | `npcTracer`, `contacts` **unused**, `contactById` **unused** | [js/flight/turrets.js](../flight/turrets.js.md) |
| 4 | `../corp/corps.js` | `corpOfVessel`, `corpRelation` | [js/corp/corps.js](../corp/corps.js.md) |
| 5 | `./security.js` | `noteAttack`, `callForHelp` | [js/npc/security.js](security.js.md) |
| 6 | `../core/perf.js` | `perf`, `tracerGate` | [js/core/perf.js](../core/perf.js.md) |

## Imported by

- [js/sim/sim.js](../sim/sim.js.md) — `resetNpcCombat`, `stepNpcCombat`, `mountNpcCombat`, `combatHooksOut`, `combatReport`, `combatLog`, `damageHull`
- test/hulks.test.mjs _(outside js/)_ — `damageHull`
- test/reactive.test.mjs _(outside js/)_ — `stepNpcCombat`, `hostileTo`, `acquire`, `setHunt`, `damageHull`, `combatLog`, `combatReport`, `HUNT_R`
- test/rogues.test.mjs _(outside js/)_ — `stepNpcCombat`

## Exports

- [`PROWL_R`](#s-PROWL_R) · const — **no importer in scanned roots**
- [`HUNT_R`](#s-HUNT_R) · const — used by test/reactive.test.mjs
- [`ENGAGE_R`](#s-ENGAGE_R) · const — **no importer in scanned roots**
- [`CLOSE_R`](#s-CLOSE_R) · const — **no importer in scanned roots**
- [`STALK_TOP`](#s-STALK_TOP) · const — **no importer in scanned roots**
- [`ALARM_R`](#s-ALARM_R) · const — **no importer in scanned roots**
- [`BREAK_R`](#s-BREAK_R) · const — **no importer in scanned roots**
- [`HUNT_FOR`](#s-HUNT_FOR) · const — **no importer in scanned roots**
- [`FLEE_SPEED`](#s-FLEE_SPEED) · const — **no importer in scanned roots**
- [`FLEE_FOR`](#s-FLEE_FOR) · const — **no importer in scanned roots**
- [`NEAR_R`](#s-NEAR_R) · const — **no importer in scanned roots**
- [`FAR_TICK`](#s-FAR_TICK) · const — **no importer in scanned roots**
- [`HIT_CHANCE`](#s-HIT_CHANCE) · const — **no importer in scanned roots**
- [`combatLog`](#s-combatLog) · const — used by [js/sim/sim.js](../sim/sim.js.md), test/reactive.test.mjs
- [`resetNpcCombat`](#s-resetNpcCombat) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`hostileTo`](#s-hostileTo) · function — used by test/reactive.test.mjs
- [`acquire`](#s-acquire) · function — used by test/reactive.test.mjs
- [`setHunt`](#s-setHunt) · function — used by test/reactive.test.mjs
- [`clearHunt`](#s-clearHunt) · function — **no importer in scanned roots**
- [`damageHull`](#s-damageHull) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/hulks.test.mjs, test/reactive.test.mjs
- [`combatHooksOut`](#s-combatHooksOut) · const — used by [js/sim/sim.js](../sim/sim.js.md)
- [`combatFly`](#s-combatFly) · function — **no importer in scanned roots**
- [`stepNpcCombat`](#s-stepNpcCombat) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/reactive.test.mjs, test/rogues.test.mjs
- [`mountNpcCombat`](#s-mountNpcCombat) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`combatReport`](#s-combatReport) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/reactive.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-PROWL_R"></a>`PROWL_R`

const · **exported** · L8–8

<!-- note:PROWL_R -->
---- tuning --------------------------------------------------------------

A raider that only looks four kilometres finds nothing, ever. The sky is
hundreds of thousands of units across and traffic crosses it at speed, so a
pirate sitting on a belt claim waiting for something to wander past is a
pirate that never eats — which is exactly how the old sky behaved, and why
an "engagement" had to be scheduled out of the seed to make anything happen
at all.

So a raider PROWLS. It picks something worth taking from most of the way
across the system, runs its own drive to get into the same volume, and
closes sublight for the kill. What it cannot do is catch a hull that is
already under drive mid-crossing — so it goes for the ends of a leg, where
traffic is slow, committed and close to a port. That is a real tactical
shape: the dangerous places are the approaches, and the safe part of a run
is the middle.
<!-- /note -->

### <a id="s-HUNT_R"></a>`HUNT_R`

const · **exported** · L9–9

<!-- note:HUNT_R -->
<!-- /note -->

### <a id="s-ENGAGE_R"></a>`ENGAGE_R`

const · **exported** · L10–10

<!-- note:ENGAGE_R -->
<!-- /note -->

### <a id="s-CLOSE_R"></a>`CLOSE_R`

const · **exported** · L11–11

<!-- note:CLOSE_R -->
<!-- /note -->

### <a id="s-STALK_TOP"></a>`STALK_TOP`

const · **exported** · L12–12

<!-- note:STALK_TOP -->
<!-- /note -->

### <a id="s-ALARM_R"></a>`ALARM_R`

const · **exported** · L13–13

<!-- note:ALARM_R -->
<!-- /note -->

### <a id="s-BREAK_R"></a>`BREAK_R`

const · **exported** · L14–14

<!-- note:BREAK_R -->
<!-- /note -->

### <a id="s-HUNT_FOR"></a>`HUNT_FOR`

const · **exported** · L15–15

<!-- note:HUNT_FOR -->
<!-- /note -->

### <a id="s-FLEE_SPEED"></a>`FLEE_SPEED`

const · **exported** · L16–16

<!-- note:FLEE_SPEED -->
<!-- /note -->

### <a id="s-FLEE_FOR"></a>`FLEE_FOR`

const · **exported** · L17–17

<!-- note:FLEE_FOR -->
<!-- /note -->

### <a id="s-NEAR_R"></a>`NEAR_R`

const · **exported** · L18–18

<!-- note:NEAR_R -->
<!-- /note -->

### <a id="s-FAR_TICK"></a>`FAR_TICK`

const · **exported** · L19–19

<!-- note:FAR_TICK -->
<!-- /note -->

### <a id="s-HIT_CHANCE"></a>`HIT_CHANCE`

const · **exported** · L20–20

<!-- note:HIT_CHANCE -->
<!-- /note -->

### <a id="s-combatLog"></a>`combatLog`

const · **exported** · L22–22

<!-- note:combatLog -->
<!-- /note -->

### <a id="s-farClock"></a>`farClock`

const · L23–23

<!-- note:farClock -->
<!-- /note -->

### <a id="s-resetNpcCombat"></a>`resetNpcCombat()`

function · **exported** · L25–28

- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:resetNpcCombat -->
<!-- /note -->

### <a id="s-d3"></a>`d3(a, b)`

function · L30–30

- called by: [`acquire`](#s-acquire) · [`combatFly`](#s-combatFly) ×2 · [`nearestHaven`](#s-nearestHaven) · [`stepFar`](#s-stepFar) ×2 · [`stepGuns`](#s-stepGuns) ×2

<!-- note:d3 -->
<!-- /note -->

### <a id="s-hostileTo"></a>`hostileTo(a, b)`

function · **exported** · L32–46

- calls: [`corpOfVessel`](../corp/corps.js.md#s-corpOfVessel) _js/corp/corps.js_ ×2 · [`corpRelation`](../corp/corps.js.md#s-corpRelation) _js/corp/corps.js_
- via [js/npc/traffic.js](traffic.js.md): `HOSTILE_ROLES.has`, `LAW_ROLES.has`
- called by: [`acquire`](#s-acquire)

<!-- note:hostileTo -->
---- who is somebody's enemy ---------------------------------------------

Whether `a` would shoot `b`. Role first — a pirate takes honest traffic and
the law takes pirates — then the corporations' own quarrels, so two outfits
at war really do open up on each other's hulls.

- L37 · `if (a.rogue && b.rogue) return a.nest !== b.nest;` — Two nests building drones out of the same belt are competitors, so rogue
  fights rogue when the nests differ — and a drone never shoots one of its
  own wave, however crowded the engagement gets.
- L39 · `if (aH && bH) return false;` — raiders do not eat each other
- L40 · `if (aH) return true;` — a pirate takes anything honest
- L41 · `if (bH) return aL || Boolean(a.gun);` — everyone else shoots back at raiders
<!-- /note -->

### <a id="s-worth"></a>`worth(n)`

function · L48–53

- via [js/npc/traffic.js](traffic.js.md): `LAW_ROLES.has`
- called by: [`acquire`](#s-acquire)

<!-- note:worth -->
How rich a target is — a pirate would rather take a laden hauler than a picket.
<!-- /note -->

### <a id="s-catchable"></a>`catchable(hunter, prey, d)`

function · L55–59

- called by: [`acquire`](#s-acquire)

<!-- note:catchable -->
Can `hunter` realistically get its guns onto `prey`? A hull with its drive
lit mid-crossing is doing tens of thousands of units a second and nothing
is going to run it down; one on a port approach is doing a few hundred and
is committed to a lane. This is what pushes raiders onto the approaches.
<!-- /note -->

### <a id="s-acquire"></a>`acquire(n, radius=)`

function · **exported** · L61–74

- calls: [`catchable`](#s-catchable) · [`d3`](#s-d3) · [`hostileTo`](#s-hostileTo) · [`worth`](#s-worth) · [`vesselById`](traffic.js.md#s-vesselById) _js/npc/traffic.js_
- called by: [`stepLook`](#s-stepLook) ×2

<!-- note:acquire -->
---- acquisition ---------------------------------------------------------

Best thing within reach for `n` to attack, or null.

- L69 · `if (m.huntedBy && m.huntedBy !== n.id && vesselById(m.huntedBy)?.hunt === m.id) continue;` — somebody else's problem: a wing of four on one trader is not a sky, it
  is a pile-on, and it strips the lanes bare in minutes
- L70 · `const score = worth(m) / (1 + d / radius);` — close and fat beats far and empty
<!-- /note -->

### <a id="s-setHunt"></a>`setHunt(n, foe, t)`

function · **exported** · L76–82

- called by: [`damageHull`](#s-damageHull) · [`stepLook`](#s-stepLook) ×2

<!-- note:setHunt -->
Put `n` onto `foe`.
<!-- /note -->

### <a id="s-clearHunt"></a>`clearHunt(n)`

function · **exported** · L84–90

- calls: [`vesselById`](traffic.js.md#s-vesselById) _js/npc/traffic.js_
- called by: [`combatFly`](#s-combatFly) ×2

<!-- note:clearHunt -->
`n` breaks off.
<!-- /note -->

### <a id="s-damageHull"></a>`damageHull(n, amount, byId, t)`

function · **exported** · L92–110

- calls: [`downHull`](#s-downHull) · [`setHunt`](#s-setHunt) · [`noteAttack`](security.js.md#s-noteAttack) _js/npc/security.js_ · [`vesselById`](traffic.js.md#s-vesselById) _js/npc/traffic.js_
- via [js/npc/traffic.js](traffic.js.md): `HOSTILE_ROLES.has`, `LAW_ROLES.has`
- called by: [`stepFar`](#s-stepFar) · [`wireReactiveSky`](../sim/sim.js.md#s-wireReactiveSky) _js/sim/sim.js_

<!-- note:damageHull -->
---- damage --------------------------------------------------------------

The one place a hull loses integrity, whoever fired and however the fight is
being resolved. Raises the alarm, and hands the kill to `onDown`.

- L102 · `if (!HOSTILE_ROLES.has(n.role) && !n.rogue) {` — being shot at is the thing that makes a hull do something other than its
  timetable: run, shoot back, and get on the radio
<!-- /note -->

### <a id="s-downHull"></a>`downHull(n, byId, t)`

function · L112–117

- calls: [`markVesselDown`](traffic.js.md#s-markVesselDown) _js/npc/traffic.js_
- called by: [`damageHull`](#s-damageHull)

<!-- note:downHull -->
<!-- /note -->

### <a id="s-combatHooksOut"></a>`combatHooksOut`

const · **exported** · L119–119

<!-- note:combatHooksOut -->
<!-- /note -->

### <a id="s-combatFly"></a>`combatFly(n, t, dt, ctx)`

function · **exported** · L121–183

- calls: [`clearHunt`](#s-clearHunt) ×2 · [`d3`](#s-d3) ×2 · [`nearestHaven`](#s-nearestHaven) · [`armFlight`](flight.js.md#s-armFlight) _js/npc/flight.js_ ×2 · [`faceAt`](flight.js.md#s-faceAt) _js/npc/flight.js_ · [`flyStep`](flight.js.md#s-flyStep) _js/npc/flight.js_ ×4 · [`callForHelp`](security.js.md#s-callForHelp) _js/npc/security.js_ · [`vesselById`](traffic.js.md#s-vesselById) _js/npc/traffic.js_ ×2
- via [js/npc/traffic.js](traffic.js.md): `HOSTILE_ROLES.has`, `LAW_ROLES.has`
- called by: [`mountNpcCombat`](#s-mountNpcCombat)

<!-- note:combatFly -->
---- the flying ----------------------------------------------------------

A hull with a fight on is flown by this instead of by its timetable.
Returns true if it took the hull over.

- L122 · `if (n.fleeFrom) {` — running
- L133 · `const haven = nearestHaven(n, ctx?.stations);` — toward the nearest thing with guns on it if there is one, else flat out
  away — a hull running for a port is a hull the port's batteries can cover
- L144 · `if (n.hunt) {` — hunting
- L148 · `const reach = raider ? PROWL_R : BREAK_R;` — a raider will follow across the system; anything else only fights what
  is in front of it
- L153 · `if (foe.drive && d > CLOSE_R) { clearHunt(n); return false; }` — it got its drive lit and is gone: not worth the fuel
- L159 · `n.job = "hunting";` — the stalk: its own drive, aimed at where the target is going to be
  rather than where it is, because a stern chase never closes
- L166 · `n.job = "engaged";` — the attack run
- L167 · `if (!n.alarmed && d < ALARM_R && raider) {` — close enough that the victim knows: this is where the radio call goes
  out, not the moment a raider a hundred kilometres away thought about it
- L173 · `n.fly.top = Math.max(760, n.fly.accel * 9, (foe.speed ?? 0) * 1.3 + 260);` — A raider has to be able to STAY on what it is shooting at. Sublight
  cruise for a laden hauler runs to a couple of thousand units a second,
  and an attack run pinned at its own nominal speed simply falls behind,
  breaks off, re-stalks, and never lands a round. The run speed tracks the
  target's, with enough margin to close the last of the gap.
<!-- /note -->

### <a id="s-nearestHaven"></a>`nearestHaven(n, stationList)`

function · L185–194

- calls: [`d3`](#s-d3)
- called by: [`combatFly`](#s-combatFly)

<!-- note:nearestHaven -->
The nearest thing a frightened hull would rather be near: a friendly port.
<!-- /note -->

### <a id="s-canShoot"></a>`canShoot(n)`

function · L196–198

- called by: [`stepFar`](#s-stepFar) · [`stepGuns`](#s-stepGuns)

<!-- note:canShoot -->
---- gunnery -------------------------------------------------------------
<!-- /note -->

### <a id="s-stepGuns"></a>`stepGuns(t, dt, shipPos)`

function · L200–223

- calls: [`tracerGate`](../core/perf.js.md#s-tracerGate) _js/core/perf.js_ · [`npcTracer`](../flight/turrets.js.md#s-npcTracer) _js/flight/turrets.js_ · [`canShoot`](#s-canShoot) · [`d3`](#s-d3) ×2 · [`vesselById`](traffic.js.md#s-vesselById) _js/npc/traffic.js_
- via [js/npc/traffic.js](traffic.js.md): `HOSTILE_ROLES.has`, `LAW_ROLES.has`
- called by: [`stepNpcCombat`](#s-stepNpcCombat)

<!-- note:stepGuns -->
Everyone with a target in range takes their shot. Near field only.

- L214 · `const near = shipPos ? d3(n, shipPos) < NEAR_R : true;` — inside sensor range the round is a real object that can miss; outside
  it, the far tick has already accounted for this hull's firepower and
  drawing a tracer nobody can see is pure cost
- L218 · `const wild = Math.random() > HIT_CHANCE;` — spread stands in for gunnery: a fraction of rounds are aimed to miss
- L219 · `if (gate < 1 && Math.random() > gate && wild) continue;` — thin the misses first when the budget is tight
<!-- /note -->

### <a id="s-stepFar"></a>`stepFar(t, dt, shipPos)`

function · L225–242

- calls: [`canShoot`](#s-canShoot) · [`d3`](#s-d3) ×2 · [`damageHull`](#s-damageHull) · [`vesselById`](traffic.js.md#s-vesselById) _js/npc/traffic.js_
- called by: [`stepNpcCombat`](#s-stepNpcCombat)

<!-- note:stepFar -->
---- the far field -------------------------------------------------------

Fights the player cannot see, settled on the numbers. Runs on a slow tick
and touches only hulls that are actually engaged, so an empty sky costs
nothing and a busy one costs a handful of multiplications.

- L235 · `if (shipPos && d3(n, shipPos) < NEAR_R) continue;` — the near model already handled it
- L239 · `const dps = (n.gun.dmg * (n.gun.mounts ?? 1) / Math.max(0.2, n.gun.rate)) * HIT_CHANCE;` — effective firepower over the slice, with the same hit fraction the
  ballistic model gets, so a fight resolves to the same place either way
<!-- /note -->

### <a id="s-lookClock"></a>`lookClock`

const · L244–244

<!-- note:lookClock -->
---- acquisition tick ----------------------------------------------------
<!-- /note -->

### <a id="s-LOOK_TICK"></a>`LOOK_TICK`

const · L245–245

<!-- note:LOOK_TICK -->
<!-- /note -->

### <a id="s-stepLook"></a>`stepLook(t, dt, shipPos)`

function · L247–266

- calls: [`acquire`](#s-acquire) ×2 · [`setHunt`](#s-setHunt) ×2
- via [js/npc/traffic.js](traffic.js.md): `HOSTILE_ROLES.has`, `LAW_ROLES.has`
- called by: [`stepNpcCombat`](#s-stepNpcCombat)

<!-- note:stepLook -->
- L255 · `if (n.job === "docked" || n.visible === false) continue;` — raiders hunt from a lurk or a patrol, not while docked
- L257 · `if (prey) setHunt(n, prey, t);` — no call goes out here: being picked out from two hundred kilometres
  away is not something the victim can know. The radio call happens when
  the raider is close enough to be seen coming (combatFly, ALARM_R).
- L261 · `if (n.visible === false) continue;` — the law does not need to be asked about something in front of it
<!-- /note -->

### <a id="s-stepNpcCombat"></a>`stepNpcCombat(t, dt, shipPos=)`

function · **exported** · L268–272

- calls: [`stepFar`](#s-stepFar) · [`stepGuns`](#s-stepGuns) · [`stepLook`](#s-stepLook)
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepNpcCombat -->
---- the tick ------------------------------------------------------------
<!-- /note -->

### <a id="s-mountNpcCombat"></a>`mountNpcCombat()`

function · **exported** · L274–280

- calls: [`combatFly`](#s-combatFly)
- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:mountNpcCombat -->
Install the flight director. Chain-safe.
<!-- /note -->

### <a id="s-combatReport"></a>`combatReport()`

function · **exported** · L282–290

<!-- note:combatReport -->
For the console: what is actually happening out there.
<!-- /note -->
