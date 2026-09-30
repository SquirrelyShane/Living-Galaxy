# js/world/events/impactors.js

[index](../../../../README.md) · 344 lines · 34 symbols · 2 imports · 5 importers

## About

<!-- note:@file -->
LIVING GALAXY — super asteroids.

Rogue bodies on their own trajectories through the system. They fly the
same gravity the ship does, so passing a world bends them: a shallow pass
turns them onto a new heading, a deep one drops them into the surface. When
they connect, the world they hit does not walk away from it.

- L6 · `const SPAWN_R = 90000;` — they arrive from your neighbourhood, not the rim
- L16 · `let nextAt = ROGUE.every;` — rolled once per spawn, not per frame
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../scale.js` | `WORLD_SCALE`, `remnantRadius` | [js/world/scale.js](../scale.js.md) |
| 2 | `../names.js` | `rockName`, `surveyYear` | [js/world/names.js](../names.js.md) |

## Imported by

- [js/net/worldsync.js](../../net/worldsync.js.md) — `adoptImpactors`, `impactorWire`, `setImpactorAuthority`
- [js/npc/captain.js](../../npc/captain.js.md) — `impactors`
- [js/render/engine.js](../../render/engine.js.md) — `impactors`
- [js/sim/sim.js](../../sim/sim.js.md) — `addRogue`, `adoptImpactors`, `impactorWire`, `impactors`, `resetImpactors`, `rogueHooks`, `setImpactorAuthority`, `stepImpactors`, `threatBoard`, `emptyThreatBoard`
- test/spacing.test.mjs _(outside js/)_ — `ROGUE`, `rogueHooks`, `stepImpactors`, `resetImpactors`, `impactors`

## Exports

- [`ROGUE`](#s-ROGUE) · const — used by test/spacing.test.mjs
- [`rogueHooks`](#s-rogueHooks) · const — used by [js/sim/sim.js](../../sim/sim.js.md), test/spacing.test.mjs
- [`impactors`](#s-impactors) · const — used by [js/npc/captain.js](../../npc/captain.js.md), [js/render/engine.js](../../render/engine.js.md), [js/sim/sim.js](../../sim/sim.js.md), test/spacing.test.mjs
- [`setImpactorAuthority`](#s-setImpactorAuthority) · function — used by [js/net/worldsync.js](../../net/worldsync.js.md), [js/sim/sim.js](../../sim/sim.js.md)
- [`impactorAuthority`](#s-impactorAuthority) · function — **no importer in scanned roots**
- [`adoptImpactors`](#s-adoptImpactors) · function — used by [js/net/worldsync.js](../../net/worldsync.js.md), [js/sim/sim.js](../../sim/sim.js.md)
- [`impactorWire`](#s-impactorWire) · function — used by [js/net/worldsync.js](../../net/worldsync.js.md), [js/sim/sim.js](../../sim/sim.js.md)
- [`resetImpactors`](#s-resetImpactors) · function — used by [js/sim/sim.js](../../sim/sim.js.md), test/spacing.test.mjs
- [`stepImpactors`](#s-stepImpactors) · function — used by [js/sim/sim.js](../../sim/sim.js.md), test/spacing.test.mjs
- [`addRogue`](#s-addRogue) · function — used by [js/sim/sim.js](../../sim/sim.js.md)
- [`closestApproach`](#s-closestApproach) · function — **no importer in scanned roots**
- [`threatBoard`](#s-threatBoard) · function — used by [js/sim/sim.js](../../sim/sim.js.md)
- [`emptyThreatBoard`](#s-emptyThreatBoard) · function — used by [js/sim/sim.js](../../sim/sim.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-ROGUE"></a>`ROGUE`

const · **exported** · L4–4

<!-- note:ROGUE -->
0.3.60 — reported: a rogue hit a core world within minutes of every
session. Measured on 0.3.59 (ship parked by its spawn world, 4 skies × 3
runs): 21 rogues an hour, 3.7 world strikes an hour, the first at a median
13 min and as early as 3. Rogues are rarer and aimed with care now:
  every     seconds between arrivals, average (was 55); none in the first 5 min
  maxLive   in the sky at once (was 3)
  aimWorld  thrown at a world rather than sailing past you (was 0.66)
  strike    of those, aimed to hit rather than pass (was 0.45)
  passR     a pass misses by this many radii (was 3.2 — deep enough that the
            well bent a third of them in)
  clearR    a rock sailing past you or a world is flown first (planSecs,
            the same gravity it will fly) and re-rolled if it would come
            within this many contact distances (world + rock radius) of any
            world — passMargin of the world it is passing
and a settled world — one with a port in its well — is never the one aimed
at (rogueHooks.spare). A strike is an event again, not the weather.
<!-- /note -->

### <a id="s-rogueHooks"></a>`rogueHooks`

const · **exported** · L5–5

<!-- note:rogueHooks -->
The sim says which worlds are spared an aimed strike (settled ones).
<!-- /note -->

### <a id="s-SPAWN_R"></a>`SPAWN_R`

const · L6–6

<!-- note:SPAWN_R -->
<!-- /note -->

### <a id="s-DESPAWN_R"></a>`DESPAWN_R`

const · L7–7

<!-- note:DESPAWN_R -->
<!-- /note -->

### <a id="s-impactors"></a>`impactors`

const · **exported** · L9–9

<!-- note:impactors -->
<!-- /note -->

### <a id="s-year"></a>`year`

const · L11–11

<!-- note:year -->
Thirteen names and a counter used to be the whole supply, so the fourteenth
rock of a session was Kerrn again. Rocks are catalogued now (js/world/names.js):
most die as a survey designation, and only one that is big enough to end a
moon gets talked about long enough to earn a name.
<!-- /note -->

### <a id="s-namedRocks"></a>`namedRocks`

const · L12–12

<!-- note:namedRocks -->
<!-- /note -->

### <a id="s-seq"></a>`seq`

const · L14–14

<!-- note:seq -->
<!-- /note -->

### <a id="s-clock"></a>`clock`

const · L15–15

<!-- note:clock -->
<!-- /note -->

### <a id="s-nextAt"></a>`nextAt`

const · L16–16

<!-- note:nextAt -->
<!-- /note -->

### <a id="s-rng"></a>`rng`

const · L17–17

- called by: [`addRogue`](#s-addRogue) ×2 · [`launch`](#s-launch) ×2 · [`resetImpactors`](#s-resetImpactors) · [`spawn`](#s-spawn) ×15 · [`stepImpactors`](#s-stepImpactors)

<!-- note:rng -->
<!-- /note -->

### <a id="s-authority"></a>`authority`

const · L19–19

<!-- note:authority -->
Who rolls the rocks. In a shared sky only the host spawns and integrates
impactors; everyone else mirrors the host's list (`adoptImpactors`) and
dead-reckons it between updates. Strikes arrive as events.
<!-- /note -->

### <a id="s-setImpactorAuthority"></a>`setImpactorAuthority(on)`

function · **exported** · L20–22

- called by: [`resetWorldSync`](../../net/worldsync.js.md#s-resetWorldSync) _js/net/worldsync.js_ · [`setHost`](../../net/worldsync.js.md#s-setHost) _js/net/worldsync.js_ · [`launchSim`](../../sim/sim.js.md#s-launchSim) _js/sim/sim.js_

<!-- note:setImpactorAuthority -->
<!-- /note -->

### <a id="s-impactorAuthority"></a>`impactorAuthority()`

function · **exported** · L23–25

<!-- note:impactorAuthority -->
<!-- /note -->

### <a id="s-adoptImpactors"></a>`adoptImpactors(list)`

function · **exported** · L27–43

- called by: [`handleMessage`](../../net/worldsync.js.md#s-handleMessage) _js/net/worldsync.js_ · [`applyWorldSnapshot`](../../sim/sim.js.md#s-applyWorldSnapshot) _js/sim/sim.js_

<!-- note:adoptImpactors -->
Mirror the host's list: keep what we have by id (smooth), add new, drop gone.

- L36 · `const err = Math.hypot(m.x - have.x, m.y - have.y, m.z - have.z);` — snap position gently: a small error slews, a large one jumps
<!-- /note -->

### <a id="s-impactorWire"></a>`impactorWire()`

function · **exported** · L45–47

- called by: [`tickWorldSync`](../../net/worldsync.js.md#s-tickWorldSync) _js/net/worldsync.js_ · [`worldSnapshot`](../../sim/sim.js.md#s-worldSnapshot) _js/sim/sim.js_

<!-- note:impactorWire -->
Wire form of the live list, for the host to broadcast.
<!-- /note -->

### <a id="s-resetImpactors"></a>`resetImpactors(seedFn)`

function · **exported** · L49–57

- calls: [`rng`](#s-rng) · [`surveyYear`](../names.js.md#s-surveyYear) _js/world/names.js_
- called by: [`loadSky`](../../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:resetImpactors -->
- L54 · `year = surveyYear(rng);` — One survey year for the whole sky, so the designations in a system read
  as one catalogue rather than a scatter of unrelated years.
<!-- /note -->

### <a id="s-spawn"></a>`spawn(ship, bodies, bodyPosition, time, gravityAt=)`

function · L59–112

- calls: [`flyPlan`](#s-flyPlan) ×2 · [`launch`](#s-launch) · [`leadWorld`](#s-leadWorld) · [`rng`](#s-rng) ×15
- called by: [`stepImpactors`](#s-stepImpactors)

<!-- note:spawn -->
- L60 · `const near = bodies` — Come in from a random direction, aimed either at a nearby world or at a
  near-miss past the ship — the near misses are what make the deflections
  worth watching.
- L69 · `const toWorld = near.length && rng() < ROGUE.aimWorld;` — 0.3.60: what it is for — a strike (rare), a pass by a world, or a pass by you
- L72 · `if (striking && !targets.length) return null;` — every world near you is settled: nothing is thrown
- L87 · `const at = leadWorld(target.b, from, speed, time, bodyPosition);` — 0.3.60: lead the world — it rides its orbit at hundreds of u/s for the
  minutes the rock is in flight, so aiming at where it IS turned a pass
  into a strike (and a strike into a pass) about as often as not
- L93 · `const j = 8000;` — past you — where you will be, riding your world's orbit, not where you are
- L98 · `const r = (120 + 780 * Math.pow(rng(), 2.5)) * WORLD_SCALE;` — heavy tail: mostly mountains, rarely something that ends a moon
- L99 · `let ratio = gravityAt ? flyPlan(from, aim, speed, r, bodies, time, bodyPosition, gravityAt` — 0.3.60: fly it first. A pass that would come near any world (the one it
  passes included) is re-rolled; a strike that would take a settled world
  on the way is too. Straight lines were not enough: the worlds ride
  kinematic orbits while the rock falls in the star's well, and the two
  drift thousands of units apart over a two-minute flight.
- L100 · `for (let k = 0; striking && ratio && k < 2 && ratio.get(target.b) >= 1; k++) {` — a strike is steered onto its world: shift the aim by what the flown
  plan missed by, and fly it again (twice is plenty)
- L108 · `m.aim = striking ? "strike" : toWorld ? "pass" : "by-you";` — what it was thrown for (the tests read it)
<!-- /note -->

### <a id="s-leadWorld"></a>`leadWorld(b, from, speed, time, bodyPosition)`

function · L114–121

- called by: [`spawn`](#s-spawn)

<!-- note:leadWorld -->
Where a world will be when a rock leaving `from` at `speed` gets to it.
<!-- /note -->

### <a id="s-_pg"></a>`_pg`

const · L123–123

<!-- note:_pg -->
Fly a rock that has not been thrown yet: the same gravity it will fly
(2 s steps), for ROGUE.planSecs. Returns, per world in reach, its closest pass
in contact distances (world + rock radius) — under 1 is a strike.
<!-- /note -->

### <a id="s-_pb"></a>`_pb`

const · L123–123

<!-- note:_pb -->
<!-- /note -->

### <a id="s-flyPlan"></a>`flyPlan(from, aim, speed, r, bodies, time, bodyPosition, gravityAt, target=)`

function · L124–151

- calls: [`remnantRadius`](../scale.js.md#s-remnantRadius) _js/world/scale.js_
- called by: [`spawn`](#s-spawn) ×2

<!-- note:flyPlan -->
- L128 · `const reach = speed * ROGUE.planSecs + len;` — only worlds it could reach in the plan's time (a phone pays for every one)
- L135 · `out.off = { x: 0, y: 0, z: 0 };` — for `target`: rock minus world at the closest pass
<!-- /note -->

### <a id="s-launch"></a>`launch(from, aim, speed, r, time)`

function · L153–176

- calls: [`rng`](#s-rng) ×2 · [`rockName`](../names.js.md#s-rockName) _js/world/names.js_
- called by: [`spawn`](#s-spawn)

<!-- note:launch -->
<!-- /note -->

### <a id="s-stepImpactors"></a>`stepImpactors(dt, ship, bodies, bodyPosition, gravityAt, gOut, time, onImpact, onShipHit, onRogueHit=)`

function · **exported** · L178–265

- calls: [`rng`](#s-rng) · [`spawn`](#s-spawn) · [`remnantRadius`](../scale.js.md#s-remnantRadius) _js/world/scale.js_
- called by: [`stepWorld`](../../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepImpactors -->
@param onImpact  (impactor, body, speed, normal) => void
@param onShipHit (impactor, speed) => void

- L180 · `for (let i = impactors.length - 1; i >= 0; i--) {` — mirror mode: dead-reckon the host's rocks, and only the ship can be hit
- L203 · `const dom = gravityAt(m, time, bodyPosition, gOut);` — Same solver the ship uses, so a well bends it honestly.
- L218 · `let hit = null;` — strike a world
- L220 · `if (b.collapsed) continue;` — a remnant is its hole now (holes.js eats); the old star's sphere is gone
- L239 · `const ds = Math.hypot(m.x - ship.pos.x, m.y - ship.pos.y, m.z - ship.pos.z);` — strike the ship
- L250 · `if (onRogueHit && impactors.length > 1) {` — Rock on rock. Three rogues in a sky a million units across almost never
  meet — but a fragment thrown off one is born beside it, and two that do
  meet are the Impact Lab's whole premise (js/world/events/impacts.js). One pair a tick.
- L254 · `if ((a.born ?? 0) > time - 2 && a.parentOf === b.id) continue;` — a fragment leaving its parent
<!-- /note -->

### <a id="s-addRogue"></a>`addRogue(m, time=)`

function · **exported** · L267–280

- calls: [`rng`](#s-rng) ×2 · [`rockName`](../names.js.md#s-rockName) _js/world/names.js_
- called by: [`fragmentRogue`](../../sim/sim.js.md#s-fragmentRogue) _js/sim/sim.js_

<!-- note:addRogue -->
A new rogue that did not come from outside: the biggest piece leaving a
rock-on-rock collision (js/world/events/impacts.js). It carries its parent's class and a
designation off its parent's name, and it is a faceted fragment.
<!-- /note -->

### <a id="s-closestApproach"></a>`closestApproach(m, pos, out)`

function · **exported** · L282–296

- called by: [`threatBoard`](#s-threatBoard) ×2

<!-- note:closestApproach -->
Closest approach of an impactor to a point, and how long until it.

`out` lets a caller inside a loop reuse one object rather than allocate a
`{t, d}` per body per impactor per tick — which the sentry board did, at a
few hundred short-lived objects a frame. Omit it and you get a fresh one,
which is what every caller outside this file wants.
<!-- /note -->

### <a id="s-_board"></a>`_board`

const · L298–298

<!-- note:_board -->
Scratch for threatBoard. This runs every tick the sentry is powered, and it
used to allocate: one array, one row per rock, one `{t,d}` per BODY per rock,
and one `{body,t,d}` per near miss — then sort the lot. Thirty rocks against
twelve worlds is close to four hundred short-lived objects a tick, or twenty
thousand a second, to produce a list whose consumers (sim.js, the NPC
captain, one console panel) only ever read `[0]`.

The rows are pooled and the array is reused, so a steady sky allocates
nothing here at all. It is still sorted and still complete — the console
panel does show the whole board — but the list belongs to this module: a
caller that wants to keep a row past the next tick must copy it.
<!-- /note -->

### <a id="s-_rows"></a>`_rows`

const · L299–299

<!-- note:_rows -->
<!-- /note -->

### <a id="s-_bp"></a>`_bp`

const · L300–300

<!-- note:_bp -->
<!-- /note -->

### <a id="s-_self"></a>`_self`

const · L301–301

<!-- note:_self -->
<!-- /note -->

### <a id="s-_ca"></a>`_ca`

const · L302–302

<!-- note:_ca -->
<!-- /note -->

### <a id="s-boardRow"></a>`boardRow(i)`

function · L304–307

- called by: [`threatBoard`](#s-threatBoard)

<!-- note:boardRow -->
<!-- /note -->

### <a id="s-threatBoard"></a>`threatBoard(ship, bodies, bodyPosition, time)`

function · **exported** · L309–339

- calls: [`boardRow`](#s-boardRow) · [`closestApproach`](#s-closestApproach) ×2
- called by: [`stepWorld`](../../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:threatBoard -->
What the sentry board shows: inbound rocks ranked by how much they matter.
<!-- /note -->

### <a id="s-emptyThreatBoard"></a>`emptyThreatBoard()`

function · **exported** · L341–344

- called by: [`stepWorld`](../../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:emptyThreatBoard -->
The sentry board with the sentry off: the same array, empty.
<!-- /note -->
