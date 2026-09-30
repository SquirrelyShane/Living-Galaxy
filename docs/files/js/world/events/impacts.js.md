# js/world/events/impacts.js

[index](../../../../README.md) · 274 lines · 20 symbols · 6 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY — what happens in the seconds after a rock connects.

Before 0.3 a strike threw a random burst: N chunks in a cone off the crater,
sizes and speeds off Math.random, and the rock itself simply vanished. Now a
strike runs the asteroid generator's Impact Lab physics (vendored at
js/asteroidgen/impact.js and impact-sim.js), at game scale:

  - the rogue's own body is grown (the same seed the canopy grew) and cut
    into solid Voronoi chunks (fracture.js)
  - the break-up is planned by specific energy against a size-dependent
    strength, nearest the contact first; every piece leaves with the rock's
    velocity, its tumble (ω × r) and an ejection kick that falls with mass
  - a rigid-body run integrates it: softened gravity toward the world, sphere
    contacts with restitution and friction, torque-free tumbling, secondary
    impacts that spray dust, and young pieces shedding grains off their spin
  - crust thrown off the world rides the same run

The pieces ARE the salvage. Each one is a chunk in js/world/debris.js from the
first tick — the tractor can reel one, the cutter can eat one, a passing hole
can swallow one — but while the run holds it (`chunk.driven`) its position is
the run's, not the debris integrator's. When the run ends the chunks are let
go with the run's velocities, and whatever came to rest on the world rained
back down.

Two rogues that meet run the same way with no world: both break, and the
biggest piece that is leaving fast enough becomes a rogue of its own — a
faceted fragment carrying its parent's class and a designation off its
parent's name, which is exactly the generator's own "send rogue" hand-off.

Frames and units. A run lives in its own frame: centred on the struck world
(co-moving with its rail) or on the pair's centre of mass, in units of
`L` world units — chosen so the rogue's generated body sits at its own unit
radius, which is what fracture.js and impact.js were tuned for. Time is 1:1.
Gravity is set per run so the world's surface gravity in the run equals the
game's (`surfaceGravity`), because the Lab's one constant G would give a
gas giant three times the escape speed it has here.

Headless. The renderer (js/render/impactfx.js) reads `runs` and draws the
fractured body, the ejecta and the flash; nothing here needs a GPU, and a
strike too far from the ship for anyone to see runs no physics at all — the
caller falls back to the old burst.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../../bodygen/body.js` | `generateBody`, `rogueParams`, `DETAIL` **unused** | [js/bodygen/body.js](../../bodygen/body.js.md) |
| 2 | `../../bodygen/classes.js` | `CLASSES` | [js/bodygen/classes.js](../../bodygen/classes.js.md) |
| 3 | `../../asteroidgen/fracture.js` | `fractureGeometry`, `eigen3` | [js/asteroidgen/fracture.js](../../asteroidgen/fracture.js.md) |
| 4 | `../../asteroidgen/impact.js` | `planImpact`, `planEjecta`, `samplePalette` | [js/asteroidgen/impact.js](../../asteroidgen/impact.js.md) |
| 5 | `../../asteroidgen/impact-sim.js` | `ImpactSim`, `buildSimPieces`, `meshShape`, `ellipsoidInertia`, `quatToRows`, `SIM` | [js/asteroidgen/impact-sim.js](../../asteroidgen/impact-sim.js.md) |
| 6 | `../../asteroidgen/rng.js` | `RNG`, `hashString`, `unitVec` | [js/asteroidgen/rng.js](../../asteroidgen/rng.js.md) |

## Imported by

- [js/render/holefx.js](../../render/holefx.js.md) — `rogueClassOf`
- [js/render/impactfx.js](../../render/impactfx.js.md) — `runs`, `IMPACTS`
- [js/sim/sim.js](../../sim/sim.js.md) — `resetImpacts`, `startCollision`, `startStrike`, `stepImpacts`
- test/asteroids.test.mjs _(outside js/)_ — `IMPACTS`, `runs`, `resetImpacts`, `startStrike`, `startCollision`, `stepImpacts`

## Exports

- [`IMPACTS`](#s-IMPACTS) · const — used by [js/render/impactfx.js](../../render/impactfx.js.md), test/asteroids.test.mjs
- [`rogueClassOf`](#s-rogueClassOf) · function — used by [js/render/holefx.js](../../render/holefx.js.md)
- [`runs`](#s-runs) · const — used by [js/render/impactfx.js](../../render/impactfx.js.md), test/asteroids.test.mjs
- [`resetImpacts`](#s-resetImpacts) · function — used by [js/sim/sim.js](../../sim/sim.js.md), test/asteroids.test.mjs
- [`startStrike`](#s-startStrike) · function — used by [js/sim/sim.js](../../sim/sim.js.md), test/asteroids.test.mjs
- [`startCollision`](#s-startCollision) · function — used by [js/sim/sim.js](../../sim/sim.js.md), test/asteroids.test.mjs
- [`stepImpacts`](#s-stepImpacts) · function — used by [js/sim/sim.js](../../sim/sim.js.md), test/asteroids.test.mjs
- `CLASSES` — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-IMPACTS"></a>`IMPACTS`

const · **exported** · L8–17

<!-- note:IMPACTS -->
- L10 · `seconds: 26,` — a run's length; the Lab loops at 34
- L11 · `viewR: 320000,` — strikes further than this from the ship do not run
- L12 · `chunks: 16,` — Voronoi chunks a rogue is cut into
- L13 · `crust: 14,` — most crust pieces a world throws into a run
- L14 · `detail: 8,` — cells per face for the fractured body
- L16 · `fragmentRogueR: 90,` — world units: a leaving piece this big becomes a rogue
<!-- /note -->

### <a id="s-ROGUE_CLASSES"></a>`ROGUE_CLASSES`

const · L19–19

<!-- note:ROGUE_CLASSES -->
Rogue class weights, the same shortlist the renderer uses for a rogue with
no class of its own (engine.js ROGUE_CLASSES)
<!-- /note -->

### <a id="s-rogueClassOf"></a>`rogueClassOf(m)`

function · **exported** · L20–20

- called by: [`makeHoleFx>addTidal`](../../render/holefx.js.md#s-makeHoleFx-addTidal) _js/render/holefx.js_ · [`fracturedRogue`](#s-fracturedRogue) · [`release`](#s-release)

<!-- note:rogueClassOf -->
<!-- /note -->

### <a id="s-runs"></a>`runs`

const · **exported** · L22–22

<!-- note:runs -->
<!-- /note -->

### <a id="s-seq"></a>`seq`

const · L23–23

<!-- note:seq -->
<!-- /note -->

### <a id="s-resetImpacts"></a>`resetImpacts()`

function · **exported** · L25–29

- calls: [`release`](#s-release)
- called by: [`loadSky`](../../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:resetImpacts -->
<!-- /note -->

### <a id="s-fracturedRogue"></a>`fracturedRogue(m, seedTag)`

function · L31–41

- calls: [`fractureGeometry`](../../asteroidgen/fracture.js.md#s-fractureGeometry) _js/asteroidgen/fracture.js_ · [`meshShape`](../../asteroidgen/impact-sim.js.md#s-meshShape) _js/asteroidgen/impact-sim.js_ · [`samplePalette`](../../asteroidgen/impact.js.md#s-samplePalette) _js/asteroidgen/impact.js_ · [`generateBody`](../../bodygen/body.js.md#s-generateBody) _js/bodygen/body.js_ · [`rogueParams`](../../bodygen/body.js.md#s-rogueParams) _js/bodygen/body.js_ · [`rogueClassOf`](#s-rogueClassOf)
- called by: [`startCollision`](#s-startCollision) ×2 · [`startStrike`](#s-startStrike)

<!-- note:fracturedRogue -->
---- building the pieces -----------------------------------------------------

A rogue grown and cut, in its generator frame.
<!-- /note -->

### <a id="s-quatFrom"></a>`quatFrom(rng)`

function · L43–47

- calls: [`unitVec`](../../asteroidgen/rng.js.md#s-unitVec) _js/asteroidgen/rng.js_
- called by: [`rogueSpec`](#s-rogueSpec) · [`startStrike`](#s-startStrike)

<!-- note:quatFrom -->
<!-- /note -->

### <a id="s-rogueSpec"></a>`rogueSpec(fr, pos, vel, rng)`

function · L49–64

- calls: [`quatToRows`](../../asteroidgen/impact-sim.js.md#s-quatToRows) _js/asteroidgen/impact-sim.js_ · [`unitVec`](../../asteroidgen/rng.js.md#s-unitVec) _js/asteroidgen/rng.js_ · [`quatFrom`](#s-quatFrom)
- called by: [`startCollision`](#s-startCollision) ×2 · [`startStrike`](#s-startStrike)

<!-- note:rogueSpec -->
A body spec in the shape planImpact / buildSimPieces want.
<!-- /note -->

#### <a id="s-rogueSpec-pieceColor"></a>`rogueSpec.pieceColor(k)`

prop · L62–62

<!-- note:rogueSpec.pieceColor -->
<!-- /note -->

### <a id="s-startStrike"></a>`startStrike(p)`

function · **exported** · L66–139

- calls: [`buildSimPieces`](../../asteroidgen/impact-sim.js.md#s-buildSimPieces) _js/asteroidgen/impact-sim.js_ · [`ellipsoidInertia`](../../asteroidgen/impact-sim.js.md#s-ellipsoidInertia) _js/asteroidgen/impact-sim.js_ ×2 · [`new ImpactSim`](../../asteroidgen/impact-sim.js.md#s-ImpactSim) _js/asteroidgen/impact-sim.js_ · [`quatToRows`](../../asteroidgen/impact-sim.js.md#s-quatToRows) _js/asteroidgen/impact-sim.js_ · [`planEjecta`](../../asteroidgen/impact.js.md#s-planEjecta) _js/asteroidgen/impact.js_ · [`planImpact`](../../asteroidgen/impact.js.md#s-planImpact) _js/asteroidgen/impact.js_ · [`hashString`](../../asteroidgen/rng.js.md#s-hashString) _js/asteroidgen/rng.js_ · [`new RNG`](../../asteroidgen/rng.js.md#s-RNG) _js/asteroidgen/rng.js_ · [`unitVec`](../../asteroidgen/rng.js.md#s-unitVec) _js/asteroidgen/rng.js_ · [`bindChunks`](#s-bindChunks) · [`cross`](#s-cross) ×3 · [`fracturedRogue`](#s-fracturedRogue) · [`norm`](#s-norm) ×3 · [`quatFrom`](#s-quatFrom) · [`release`](#s-release) · [`rogueSpec`](#s-rogueSpec)
- called by: [`onImpact`](../../sim/sim.js.md#s-onImpact) _js/sim/sim.js_

<!-- note:startStrike -->
---- a rock on a world ---------------------------------------------------------

Run a strike. Returns the run, or null if it is too far to be worth running
(the caller then throws the old burst).

p: { rogue, body, bodyPos, bodyVel, normal {nx,ny,nz}, speed, sev, gSurf,
     time, shipPos, addChunk(c) }

- L68 · `if (!(rogue.r > 0)) return null;` — L = 0 → NaN chunks; the caller throws the old burst
- L71 · `if (runs.length >= IMPACTS.maxLive) release(runs.shift(), null, true);` — evict the oldest for real: 0.3 released runs[0] but left it in the list, so the
  next eviction hit the same ended run and the cap never capped (5 live, 17 ms a tick)
- L77 · `const L = rogue.r / fr.built.asteroid.meshRadius;` — L: world units per run unit, so the generated body's mean radius (the
  generator normalises every shape to meshRadius) IS the rogue's radius
- L81 · `const rel = [(rogue.vx ?? 0) - bodyVel.x, (rogue.vy ?? 0) - bodyVel.y, (rogue.vz ?? 0) - b` — the rogue touching the world along the strike normal, closing at its real
  speed relative to the world's rail
- L87 · `const dens = body.kind === "gas" ? 0.25 : body.kind === "ice" ? 0.55 : 1;` — the world: mass by volume against the rock (the rock is 1), a rocky world
  denser than a gas one, and gravity set so its surface pull is the game's
- L98 · `plan.bodies[0] = { fraction: 0, detached: [], velPost: [0, 0, 0], spinPost: [0, 0, 0], mas` — the world does not fracture in a run — its crater, its ring and its
  integrity are the cataclysm system's (sim.js damageBody). Its plan row is
  replaced by an intact survivor.
- L103 · `const crustN = Math.max(3, Math.min(IMPACTS.crust, Math.round(3 + (p.sev ?? 0.1) * 40)));` — crust: thrown off the crater, on the same run, the world's colours
<!-- /note -->

#### <a id="s-startStrike-pieceColor"></a>`startStrike.pieceColor()`

prop · L95–95

<!-- note:startStrike.pieceColor -->
<!-- /note -->

### <a id="s-startCollision"></a>`startCollision(p)`

function · **exported** · L141–178

- calls: [`buildSimPieces`](../../asteroidgen/impact-sim.js.md#s-buildSimPieces) _js/asteroidgen/impact-sim.js_ · [`new ImpactSim`](../../asteroidgen/impact-sim.js.md#s-ImpactSim) _js/asteroidgen/impact-sim.js_ · [`planEjecta`](../../asteroidgen/impact.js.md#s-planEjecta) _js/asteroidgen/impact.js_ · [`planImpact`](../../asteroidgen/impact.js.md#s-planImpact) _js/asteroidgen/impact.js_ · [`hashString`](../../asteroidgen/rng.js.md#s-hashString) _js/asteroidgen/rng.js_ · [`new RNG`](../../asteroidgen/rng.js.md#s-RNG) _js/asteroidgen/rng.js_ · [`bindChunks`](#s-bindChunks) · [`fracturedRogue`](#s-fracturedRogue) ×2 · [`release`](#s-release) · [`rogueSpec`](#s-rogueSpec) ×2
- called by: [`onRogueCollision`](../../sim/sim.js.md#s-onRogueCollision) _js/sim/sim.js_

<!-- note:startCollision -->
---- two rocks -------------------------------------------------------------------

Two rogues meet. p: { a, b, time, shipPos, addChunk(c) }. Returns the run or
null (too far to run — the caller removes both and throws a burst).

- L166 · `const sim = new ImpactSim({ pieces, G: SIM.G * 0.08, seed: seedTag, t: 0 });` — self-gravity of a pair of mountains is real but slight at these speeds
<!-- /note -->

### <a id="s-bindChunks"></a>`bindChunks(run, addChunk, goodOf, tintOf)`

function · L180–195

- calls: [`place`](#s-place)
- called by: [`startCollision`](#s-startCollision) · [`startStrike`](#s-startStrike)

<!-- note:bindChunks -->
Every fragment is a chunk from the first tick.

- L183 · `if (P.kind === "survivor" && run.kind === "strike") return;` — the world
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L197–197

<!-- note:_p -->
---- stepping ---------------------------------------------------------------------
<!-- /note -->

### <a id="s-stepImpacts"></a>`stepImpacts(dt, ctx=)`

function · **exported** · L199–217

- calls: [`place`](#s-place) · [`release`](#s-release)
- called by: [`stepWorld`](../../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepImpacts -->
ctx: { time, bodyPosition(id,t,out), bodyVelocity(id,t,out), onRogue(m) }
<!-- /note -->

### <a id="s-place"></a>`place(run)`

function · L219–228

- called by: [`bindChunks`](#s-bindChunks) · [`release`](#s-release) · [`stepImpacts`](#s-stepImpacts)

<!-- note:place -->
Chunks go where the run says their piece is.
<!-- /note -->

### <a id="s-release"></a>`release(run, onRogue, early=)`

function · L230–269

- calls: [`place`](#s-place) · [`rogueClassOf`](#s-rogueClassOf)
- called by: [`resetImpacts`](#s-resetImpacts) · [`startCollision`](#s-startCollision) · [`startStrike`](#s-startStrike) · [`stepImpacts`](#s-stepImpacts)

<!-- note:release -->
A run ends: its chunks go back to the debris integrator with the run's
velocities. Anything resting on the struck world rained back down. From a
collision, the biggest piece leaving the pair fast enough is handed to
`onRogue` as a new rogue.

- L251 · `if (d < run.worldR + P.radius * 1.6 && speed < 0.3) c.life = c.age + 0.01;` — on the ground and not going anywhere: it is part of the world again
<!-- /note -->

### <a id="s-cross"></a>`cross(a, b)`

function · L271–271

- called by: [`startStrike`](#s-startStrike) ×3

<!-- note:cross -->
tiny vector helpers
<!-- /note -->

### <a id="s-norm"></a>`norm(a)`

function · L272–272

- called by: [`startStrike`](#s-startStrike) ×3

<!-- note:norm -->
<!-- /note -->
