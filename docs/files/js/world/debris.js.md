# js/world/debris.js

[index](../../../README.md) · 210 lines · 19 symbols · 1 imports · 8 importers

## About

<!-- note:@file -->
LIVING GALAXY — debris.

Everything that comes apart ends up here: chunks blown off a world by an
impact, the rubble of something that shattered outright, wreckage from a
kill. Chunks fall under the same gravity the ship does, so a burst thrown
off a planet either rains back down, settles into a ring, or leaves.

- L104 · `const _tab = [];` — { b, x, y, z, r2 } per body, reused across steps
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./bodies.js` | `BODIES`, `bodyById`, `bodyPosition` | [js/world/bodies.js](bodies.js.md) |

## Imported by

- [js/drones/ops.js](../drones/ops.js.md) — `chunks`, `removeChunk`, `chunkMass`, `burst`
- [js/flight/turrets.js](../flight/turrets.js.md) — `chunks`, `removeChunk`
- [js/npc/battles.js](../npc/battles.js.md) — `burst`
- [js/render/engine.js](../render/engine.js.md) — `chunks`
- [js/sim/sim.js](../sim/sim.js.md) — `addChunk`, `bindDebris`, `burst`, `chunkMass`, `chunks`, `nearDebris`, `removeChunk`, `resetDebris`, `rubbleRing`, `stepDebris`
- [js/ui/tutorial.js](../ui/tutorial.js.md) — `chunks`
- test/asteroids.test.mjs _(outside js/)_ — `chunks`, `addChunk`, `resetDebris`
- test/salvage.test.mjs _(outside js/)_ — `chunkMass`

## Exports

- [`chunks`](#s-chunks) · const — used by [js/drones/ops.js](../drones/ops.js.md), [js/flight/turrets.js](../flight/turrets.js.md), [js/render/engine.js](../render/engine.js.md), [js/sim/sim.js](../sim/sim.js.md), [js/ui/tutorial.js](../ui/tutorial.js.md), test/asteroids.test.mjs
- [`resetDebris`](#s-resetDebris) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/asteroids.test.mjs
- [`burst`](#s-burst) · function — used by [js/drones/ops.js](../drones/ops.js.md), [js/npc/battles.js](../npc/battles.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`rubbleRing`](#s-rubbleRing) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`bindDebris`](#s-bindDebris) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`stepDebris`](#s-stepDebris) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`nearDebris`](#s-nearDebris) · function — used by [js/sim/sim.js](../sim/sim.js.md)
- [`removeChunk`](#s-removeChunk) · function — used by [js/drones/ops.js](../drones/ops.js.md), [js/flight/turrets.js](../flight/turrets.js.md), [js/sim/sim.js](../sim/sim.js.md)
- [`addChunk`](#s-addChunk) · function — used by [js/sim/sim.js](../sim/sim.js.md), test/asteroids.test.mjs
- [`chunkMass`](#s-chunkMass) · function — used by [js/drones/ops.js](../drones/ops.js.md), [js/sim/sim.js](../sim/sim.js.md), test/salvage.test.mjs
- [`debrisCount`](#s-debrisCount) · function — **no importer in scanned roots**
- `bodyById` — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-MAX"></a>`MAX`

const · L3–3

<!-- note:MAX -->
<!-- /note -->

### <a id="s-chunks"></a>`chunks`

const · **exported** · L4–4

<!-- note:chunks -->
<!-- /note -->

### <a id="s-_bp"></a>`_bp`

const · L6–6

<!-- note:_bp -->
Scratch
<!-- /note -->

### <a id="s-seq"></a>`seq`

const · L8–8

<!-- note:seq -->
<!-- /note -->

### <a id="s-resetDebris"></a>`resetDebris()`

function · **exported** · L10–13

- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:resetDebris -->
<!-- /note -->

### <a id="s-burst"></a>`burst(opts)`

function · **exported** · L15–66

- calls: [`dropOldest`](#s-dropOldest)
- called by: [`destroy`](../drones/ops.js.md#s-destroy) _js/drones/ops.js_ · [`stepBattles`](../npc/battles.js.md#s-stepBattles) _js/npc/battles.js_ · [`damageBody`](../sim/sim.js.md#s-damageBody) _js/sim/sim.js_ · [`onKill`](../sim/sim.js.md#s-onKill) _js/sim/sim.js_ ×4 · [`onRogueCollision`](../sim/sim.js.md#s-onRogueCollision) _js/sim/sim.js_ · [`onShipHit`](../sim/sim.js.md#s-onShipHit) _js/sim/sim.js_

<!-- note:burst -->
Throws `count` chunks outward from a point. `spread` is the cone half-angle
in radians around `nx,ny,nz`; pass no normal for a spherical burst.

- L32 · `let dx = Math.random() * 2 - 1;` — random direction, biased into the cone around the normal
- L62 · `life,` — 0 = never expires
<!-- /note -->

### <a id="s-rubbleRing"></a>`rubbleRing(body, count, radius)`

function · **exported** · L68–97

- calls: [`bodyPosition`](bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`dropOldest`](#s-dropOldest)
- called by: [`applyWorldSnapshot`](../sim/sim.js.md#s-applyWorldSnapshot) _js/sim/sim.js_ · [`shatterBody`](../sim/sim.js.md#s-shatterBody) _js/sim/sim.js_

<!-- note:rubbleRing -->
A rubble ring — what is left when a world stops being one. It arrives as a
thick, inclined torus and flattens into the equatorial plane over the next
few minutes, the way inelastic collisions really do damp a debris cloud:
out-of-plane motion dies far faster than the radial spread.
<!-- /note -->

### <a id="s-sim0"></a>`sim0`

const · L99–99

<!-- note:sim0 -->
sim is injected to avoid an import cycle
<!-- /note -->

### <a id="s-bindDebris"></a>`bindDebris(sim)`

function · **exported** · L100–102

- called by: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:bindDebris -->
<!-- /note -->

### <a id="s-_tab"></a>`_tab`

const · L104–104

<!-- note:_tab -->
Per-step body table: every body placed once per step, not once per chunk.
gravityAt takes a position lookup, so it reads the table too.
<!-- /note -->

### <a id="s-_tabById"></a>`_tabById`

const · L105–105

<!-- note:_tabById -->
<!-- /note -->

### <a id="s-tableBodyPosition"></a>`tableBodyPosition(id, time, out)`

function · L106–110

- calls: [`bodyPosition`](bodies.js.md#s-bodyPosition) _js/world/bodies.js_
- called by: [`stepDebris`](#s-stepDebris)

<!-- note:tableBodyPosition -->
<!-- /note -->

### <a id="s-stepDebris"></a>`stepDebris(dt, gravityAt, gOut)`

function · **exported** · L112–168

- calls: [`bodyPosition`](bodies.js.md#s-bodyPosition) _js/world/bodies.js_ · [`tableBodyPosition`](#s-tableBodyPosition)
- called by: [`stepWorld`](../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepDebris -->
Chunks orbiting a shattered world ride its rails; free chunks integrate
under the local well and get absorbed if they fall back in.

- L131 · `if (c.driven) continue;` — a piece still inside an impact's rigid-body run (js/world/events/impacts.js) is
  placed by that run, not by this integrator, until the run lets it go
- L134 · `tableBodyPosition(c.parent, sim0.time, _bp);` — rubble ring: on rails around whatever is left. Keplerian-ish shear —
  the inside laps the outside, so a fresh torus visibly smears into a
  ring instead of turning like a painted disc.
- L138 · `c.settle = Math.min(1, (c.settle ?? 0) + dt / 240);` — vertical damping: fast at first, asymptotic after
- L158 · `for (const e of _tab) {` — Re-absorbed only once it is genuinely back under the surface — a burst
  thrown off a crater has to be allowed to leave first.
- L159 · `if (e.b.shattered || e.b.collapsed) continue;` — a collapsed star's surface is not there to land on
<!-- /note -->

### <a id="s-nearDebris"></a>`nearDebris(pos, range)`

function · **exported** · L170–178

- called by: [`lockCandidates`](../sim/sim.js.md#s-lockCandidates) _js/sim/sim.js_ · [`stepSalvage`](../sim/sim.js.md#s-stepSalvage) _js/sim/sim.js_ · [`tryAssay`](../sim/sim.js.md#s-tryAssay) _js/sim/sim.js_

<!-- note:nearDebris -->
Chunks within `range` of a point, nearest first. Used by the salvage tractor.
<!-- /note -->

### <a id="s-removeChunk"></a>`removeChunk(c)`

function · **exported** · L180–184

- called by: [`ROLE_STEP.salvager`](../drones/ops.js.md#s-ROLE_STEP-salvager) _js/drones/ops.js_ · [`stepMining`](../flight/turrets.js.md#s-stepMining) _js/flight/turrets.js_ · [`stepSalvage`](../sim/sim.js.md#s-stepSalvage) _js/sim/sim.js_

<!-- note:removeChunk -->
<!-- /note -->

### <a id="s-dropOldest"></a>`dropOldest()`

function · L186–189

- called by: [`addChunk`](#s-addChunk) · [`burst`](#s-burst) · [`rubbleRing`](#s-rubbleRing)

<!-- note:dropOldest -->
The oldest chunk goes when the cap is hit — marked, because an impact run
may still be holding it (js/world/events/impacts.js checks `dead`).
<!-- /note -->

### <a id="s-addChunk"></a>`addChunk(c)`

function · **exported** · L191–200

- calls: [`dropOldest`](#s-dropOldest)

<!-- note:addChunk -->
Add one chunk as built by the caller (impacts hand over their pieces this way).
<!-- /note -->

### <a id="s-chunkMass"></a>`chunkMass(c)`

function · **exported** · L202–204

- called by: [`ROLE_STEP.salvager`](../drones/ops.js.md#s-ROLE_STEP-salvager) _js/drones/ops.js_ · [`stepSalvage`](../sim/sim.js.md#s-stepSalvage) _js/sim/sim.js_ · [`tryAssay`](../sim/sim.js.md#s-tryAssay) _js/sim/sim.js_

<!-- note:chunkMass -->
Rough tonnage, so salvage pays by volume rather than by count.
<!-- /note -->

### <a id="s-debrisCount"></a>`debrisCount()`

function · **exported** · L206–208

<!-- note:debrisCount -->
<!-- /note -->
