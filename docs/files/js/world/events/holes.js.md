# js/world/events/holes.js

[index](../../../../README.md) · 375 lines · 27 symbols · 1 imports · 8 importers

## About

<!-- note:@file -->
LIVING GALAXY — collapsed stars.

The rarest cataclysm in the sky, and the only one that moves. A black hole
here is a stellar remnant, and it arrives one of two ways:

  TRANSIT   a neighbouring star collapses and the remnant is kicked out of
            its own system. Very occasionally one falls through this one on a
            straight, fast line — minutes from first flash to gone — and eats
            what it passes: a tunnel through the belt, any rogue that strays
            inside its tidal radius, loose debris, ports and hulls that do
            not get out of the way. A world it passes close enough to is torn
            apart by tides, and the pieces fall in. It pulls on everything
            that flies, the ship included.
  REMNANT   a star that goes supernova (js/world/events/cataclysm.js, `goSupernova`)
            collapses behind its own shock: once the plateau breaks, the core
            is a hole where the star was. It keeps the star's mass — the
            orbits do not change — but the light goes, and the disk that
            forms out of the fallback is what lights the system now.

"Not common" is load-bearing. A transit is rolled once every ten minutes of
sky time, never in the first forty, never within three hours of the last one,
and at 5% a roll. Measured over 1,600 simulated hours: one every ~6 hours of
play, and an hour-long session sees one about one time in ten. In a shared
sky only the host rolls; the hole is on a straight line, so a mirror
dead-reckons it exactly.

Units and radii. `rs` is the hole's Schwarzschild radius in world units, a
GAME number (a real one would be a few hundred units and invisible from
orbit), and every other radius is a multiple of it off the Kerr maths the
lens itself uses (js/asteroidgen/kerr.js), at the lens's spin:

  horizon   r+ = M(1 + √(1−a²))           crossing it ends the hull
  burn      prograde ISCO                 matter inside burns into the disk
  roche     6 rs                          rocks and rogues shred inside this
  disk      13 rs                         the lensed disk's outer edge
  danger    9 rs                          what the avoidance solver keeps out of

This module is headless: it knows about the sky through the context
`stepHoles` is handed, so nothing here imports the ship, the ports or the
renderer, and ship.js can import it for gravity without a cycle.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../../asteroidgen/kerr.js` | `horizon` as `kerrHorizon`, `isco` as `kerrIsco` | [js/asteroidgen/kerr.js](../../asteroidgen/kerr.js.md) |

## Imported by

- [js/flight/avoid.js](../../flight/avoid.js.md) — `holes`, `holeRadii`
- [js/flight/ship.js](../../flight/ship.js.md) — `holeAccel`, `holes`
- [js/net/worldsync.js](../../net/worldsync.js.md) — `adoptHoles`, `holeWire`
- [js/render/engine.js](../../render/engine.js.md) — `holes`
- [js/render/holefx.js](../../render/holefx.js.md) — `holes`, `holeFx`, `holeRadii`
- [js/sim/sim.js](../../sim/sim.js.md) — `HOLE`, `adoptHoles`, `collapseStar`, `holeRadii`, `holeWarpBlock`, `holeWire`, `holes`, `nearestHole`, `resetHoles`, `spawnTransit`, `stepHoles`
- [js/ui/map.js](../../ui/map.js.md) — `holes`, `holeRadii`
- test/asteroids.test.mjs _(outside js/)_ — `HOLE`, `holes`, `holeRadii`, `holeAccel`, `holeWarpBlock`, `rollTransit`, `resetHoles`, `spawnTransit`, `collapseStar`, `holeWire`, `adoptHoles`, `stepHoles`, `massOf`

## Exports

- [`HOLE`](#s-HOLE) · const — used by [js/sim/sim.js](../../sim/sim.js.md), test/asteroids.test.mjs
- [`holes`](#s-holes) · const — used by [js/flight/avoid.js](../../flight/avoid.js.md), [js/flight/ship.js](../../flight/ship.js.md), [js/render/engine.js](../../render/engine.js.md), [js/render/holefx.js](../../render/holefx.js.md), [js/sim/sim.js](../../sim/sim.js.md), [js/ui/map.js](../../ui/map.js.md), test/asteroids.test.mjs
- [`holeFx`](#s-holeFx) · const — used by [js/render/holefx.js](../../render/holefx.js.md)
- [`resetHoles`](#s-resetHoles) · function — used by [js/sim/sim.js](../../sim/sim.js.md), test/asteroids.test.mjs
- [`holeRadii`](#s-holeRadii) · function — used by [js/flight/avoid.js](../../flight/avoid.js.md), [js/render/holefx.js](../../render/holefx.js.md), [js/sim/sim.js](../../sim/sim.js.md), [js/ui/map.js](../../ui/map.js.md), test/asteroids.test.mjs
- [`holeAccel`](#s-holeAccel) · function — used by [js/flight/ship.js](../../flight/ship.js.md), test/asteroids.test.mjs
- [`nearestHole`](#s-nearestHole) · function — used by [js/sim/sim.js](../../sim/sim.js.md)
- [`holeWarpBlock`](#s-holeWarpBlock) · function — used by [js/sim/sim.js](../../sim/sim.js.md), test/asteroids.test.mjs
- [`massOf`](#s-massOf) · function — used by test/asteroids.test.mjs
- [`spawnTransit`](#s-spawnTransit) · function — used by [js/sim/sim.js](../../sim/sim.js.md), test/asteroids.test.mjs
- [`collapseStar`](#s-collapseStar) · function — used by [js/sim/sim.js](../../sim/sim.js.md), test/asteroids.test.mjs
- [`rollTransit`](#s-rollTransit) · function — used by test/asteroids.test.mjs
- [`stepHoles`](#s-stepHoles) · function — used by [js/sim/sim.js](../../sim/sim.js.md), test/asteroids.test.mjs
- [`holeWire`](#s-holeWire) · function — used by [js/net/worldsync.js](../../net/worldsync.js.md), [js/sim/sim.js](../../sim/sim.js.md), test/asteroids.test.mjs
- [`adoptHoles`](#s-adoptHoles) · function — used by [js/net/worldsync.js](../../net/worldsync.js.md), [js/sim/sim.js](../../sim/sim.js.md), test/asteroids.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-HOLE"></a>`HOLE`

const · **exported** · L3–20

<!-- note:HOLE -->
- L4 · `spin: 0.6,` — a/M — the lens's Interstellar look; the radii follow it
- L6 · `transitMu: 1.1e11,` — ~1/3 of Sol's gravitational parameter: at 60 km it pulls 30 u/s² (a third
  of a main engine), at 20 km 270 — more than any engine. You get out of the
  way from far off, or you do not get out.
- L7 · `speed: [2200, 3200],` — u/s — a remnant with a natal kick
- L10 · `missShip: [110000, 240000],` — how close a transit that is NOT aimed at a world passes you
- L11 · `worldShare: 0.4,` — of transits, the share thrown at a world
- L12 · `checkEvery: 600,` — s of sky time between rolls
- L16 · `eatEvery: 0.25,` — s between eat passes (the belt query is not free)
- L17 · `warpClear: 60,` — × rs: warp geometry does not hold inside this
- L18 · `tidalRate: 0.18,` — integrity per second at twice the Roche depth
<!-- /note -->

### <a id="s-holes"></a>`holes`

const · **exported** · L22–22

<!-- note:holes -->
<!-- /note -->

### <a id="s-holeFx"></a>`holeFx`

const · **exported** · L23–23

<!-- note:holeFx -->
What the renderer should see happen, drained by the engine. Bounded.
<!-- /note -->

### <a id="s-fx"></a>`fx(e)`

function · L24–27

- called by: [`adoptHoles`](#s-adoptHoles) ×2 · [`collapseStar`](#s-collapseStar) · [`spawnTransit`](#s-spawnTransit) · [`stepHoles`](#s-stepHoles) ×3

<!-- note:fx -->
<!-- /note -->

### <a id="s-seq"></a>`seq`

const · L29–29

<!-- note:seq -->
<!-- /note -->

### <a id="s-clock"></a>`clock`

const · L30–30

<!-- note:clock -->
<!-- /note -->

### <a id="s-nextRoll"></a>`nextRoll`

const · L31–31

<!-- note:nextRoll -->
<!-- /note -->

### <a id="s-lastBirth"></a>`lastBirth`

const · L32–32

<!-- note:lastBirth -->
<!-- /note -->

### <a id="s-resetHoles"></a>`resetHoles()`

function · **exported** · L34–41

- called by: [`loadSky`](../../sim/sim.js.md#s-loadSky) _js/sim/sim.js_

<!-- note:resetHoles -->
<!-- /note -->

### <a id="s-holeRadii"></a>`holeRadii(h, out=)`

function · **exported** · L43–54

- calls: [`horizon`](../../asteroidgen/kerr.js.md#s-horizon) _js/asteroidgen/kerr.js_ · [`isco`](../../asteroidgen/kerr.js.md#s-isco) _js/asteroidgen/kerr.js_
- called by: [`threatTo`](../../flight/avoid.js.md#s-threatTo) _js/flight/avoid.js_ · [`makeHoleFx>addTidal`](../../render/holefx.js.md#s-makeHoleFx-addTidal) _js/render/holefx.js_ · [`makeHoleFx>standinFor`](../../render/holefx.js.md#s-makeHoleFx-standinFor) _js/render/holefx.js_ · [`makeHoleFx>update`](../../render/holefx.js.md#s-makeHoleFx-update) _js/render/holefx.js_ ×2 · [`holeOnShip`](../../sim/sim.js.md#s-holeOnShip) _js/sim/sim.js_ · [`plotRoute`](../../sim/sim.js.md#s-plotRoute) _js/sim/sim.js_ · [`watchHoles`](../../sim/sim.js.md#s-watchHoles) _js/sim/sim.js_ · [`mountMap`](../../ui/map.js.md#s-mountMap) _js/ui/map.js_ · [`feed`](#s-feed) · [`nearestHole`](#s-nearestHole) · [`stepHoles`](#s-stepHoles)

<!-- note:holeRadii -->
Every radius a hole has, in world units.
<!-- /note -->

### <a id="s-_r"></a>`_r`

const · L55–55

<!-- note:_r -->
<!-- /note -->

### <a id="s-holeAccel"></a>`holeAccel(pos, out)`

function · **exported** · L57–73

- called by: [`gravityAt`](../../flight/ship.js.md#s-gravityAt) _js/flight/ship.js_

<!-- note:holeAccel -->
Add every hole's pull at `pos` into `out` (x/y/z, accumulated — call after the
worlds). Softened by rs so a point inside the horizon does not divide by zero.
A REMNANT does not pull: the star it replaced is still in BODIES with the
same mass, and pulling twice would change every orbit in the sky.
Returns the strongest single acceleration added.

- L64 · `if (!(soft > 0)) continue;` — a zero-size hole sat on the point: 0/0
<!-- /note -->

### <a id="s-nearestHole"></a>`nearestHole(pos)`

function · **exported** · L75–82

- calls: [`holeRadii`](#s-holeRadii)
- called by: [`watchHoles`](../../sim/sim.js.md#s-watchHoles) _js/sim/sim.js_

<!-- note:nearestHole -->
The nearest hole to a point, with the distance and its radii; null if the sky has none.
<!-- /note -->

### <a id="s-holeWarpBlock"></a>`holeWarpBlock(pos)`

function · **exported** · L84–90

- called by: [`warpBlock`](../../sim/sim.js.md#s-warpBlock) _js/sim/sim.js_ · [`warpBlockDuringSpool`](../../sim/sim.js.md#s-warpBlockDuringSpool) _js/sim/sim.js_

<!-- note:holeWarpBlock -->
Why the warp core will not hold near a hole, or "".
<!-- /note -->

### <a id="s-feed"></a>`feed(h, r, mass)`

function · L92–103

- calls: [`holeRadii`](#s-holeRadii)
- called by: [`stepHoles`](#s-stepHoles) ×4

<!-- note:feed -->
Accreted mass is remembered by where it went in: the lens turns these into
rings (asteroidgen/blackhole.js buildRings), so a hole that ate a rogue on
its way through has a bright band at the radius the rogue burned.
<!-- /note -->

### <a id="s-massOf"></a>`massOf(r)`

function · **exported** · L105–105

- called by: [`stepHoles`](#s-stepHoles) ×4

<!-- note:massOf -->
A rock of radius r (world units) as disk mass: a 1 km body is 1.
<!-- /note -->

### <a id="s-nameHole"></a>`nameHole(rng)`

function · L107–111

- called by: [`spawnTransit`](#s-spawnTransit)

<!-- note:nameHole -->
<!-- /note -->

### <a id="s-spawnTransit"></a>`spawnTransit({…}=)`

function · **exported** · L113–154

- calls: [`fx`](#s-fx) · [`nameHole`](#s-nameHole)
- called by: [`summonHole`](../../sim/sim.js.md#s-summonHole) _js/sim/sim.js_ · [`stepHoles`](#s-stepHoles)

<!-- note:spawnTransit -->
A remnant falls through. `aimAt` is an optional world ({ body, pos }) to pass
inside the tidal radius of; otherwise the line misses the ship by a
survivable margin. Returns the hole.

- L116 · `const az = rng() * Math.PI * 2;` — mostly in the ecliptic, where the things worth eating are
- L121 · `const px = -dir.z, pz = dir.x;` — offset the line perpendicular to its heading so it passes at `aimAt.pass`
- L143 · `mass: 0.4,` — a remnant arrives with a little of its old system still around it, so
  the disk is faint but there before it has eaten anything here
<!-- /note -->

### <a id="s-collapseStar"></a>`collapseStar(star, pos, time=)`

function · **exported** · L156–181

- calls: [`fx`](#s-fx)
- called by: [`collapseToHole`](../../sim/sim.js.md#s-collapseToHole) _js/sim/sim.js_

<!-- note:collapseStar -->
A star has gone supernova and its core has fallen in. The hole takes the
star's place and its mass; the fallback gives it a bright disk from the start.
<!-- /note -->

### <a id="s-rollTransit"></a>`rollTransit(dt, time, rng=)`

function · **exported** · L183–190

- called by: [`stepHoles`](#s-stepHoles)

<!-- note:rollTransit -->
Should the sky roll a transit now? Host only; see the rarity note at the top.
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L192–192

<!-- note:_p -->
scratch
<!-- /note -->

### <a id="s-_n"></a>`_n`

const · L193–193

<!-- note:_n -->
<!-- /note -->

### <a id="s-eatAcc"></a>`eatAcc`

const · L194–194

<!-- note:eatAcc -->
<!-- /note -->

### <a id="s-stepHoles"></a>`stepHoles(dt, ctx)`

function · **exported** · L196–325

- calls: [`feed`](#s-feed) ×4 · [`fx`](#s-fx) ×3 · [`holeRadii`](#s-holeRadii) · [`massOf`](#s-massOf) ×4 · [`pickWorld`](#s-pickWorld) · [`rollTransit`](#s-rollTransit) · [`spawnTransit`](#s-spawnTransit)
- called by: [`stepWorld`](../../sim/sim.js.md#s-stepWorld) _js/sim/sim.js_

<!-- note:stepHoles -->
Step every hole: move it, feed it, and apply what it does to the sky.

ctx (all optional except `time`):
  authority          only the host removes rogues, damages worlds, loses ports, rolls transits
  ship               { pos, vel }
  bodies, bodyPosition
  impactors          the live rogue list (spliced on capture)
  chunks, removeChunk
  stations, loseStation(st, hole), rakeStation(st, hole, frac)
  contacts           hulls with hp — eaten inside the capture radius
  rocksNear(pos, span), eatRocks(keys), inBelt(pos)
  damageBody(body, sev, n, r, speed)
  onShip(hole, zone, dist, dt)   zone: "horizon" | "burn" | "roche"
  log(text), rng()

- L218 · `if (ctx.ship && ctx.onShip) {` — the ship, every tick: this is the one that has to be exact
- L225 · `if (h.kind === "transit" && ctx.ship && ctx.authority !== false) {` — a transit that has gone by leaves
- L237 · `if (ctx.rocksNear && ctx.eatRocks && (!ctx.inBelt || ctx.inBelt(h))) {` — belt rocks: a tunnel. Only the host's field query decides, but rocks are
  a pure function of the cell, so a mirror eating them too agrees.
- L252 · `if (ctx.impactors && ctx.authority !== false) {` — rogues: shredded inside the tidal radius
- L265 · `if (ctx.chunks) {` — loose debris falls in and burns; inside the tidal radius it is already hot
- L280 · `if (ctx.contacts && ctx.authority !== false) {` — hulls with hit points: nothing gets out from under the horizon
- L289 · `if (ctx.stations && ctx.authority !== false) {` — ports: lost inside the burn radius, raked inside the tidal one
- L299 · `if (ctx.bodies && ctx.bodyPosition && ctx.damageBody && ctx.authority !== false) {` — worlds: tides. The Roche distance for a point mass against a world of
  radius Rw and parameter μw is Rw·∛(2μh/μw) — a hole a third of a star
  reaches ~25 km around an Earth and ~33 km around a Jupiter. Inside it the
  world loses integrity every second, faster the deeper; what comes off is
  thrown toward the hole and falls in.
<!-- /note -->

### <a id="s-pickWorld"></a>`pickWorld(ctx)`

function · L327–342

- called by: [`stepHoles`](#s-stepHoles)

<!-- note:pickWorld -->
A transit thrown at a world picks one near the ship, so it happens where
somebody can see it.

- L341 · `return { body: t.b, pos: t.pos, pass: Math.max(t.b.radius * 1.3, dR * (0.45 + rng() * 0.25` — the world keeps moving on its rail while the hole flies in; aim where it
  will be, near enough, by leading it by the flight time
<!-- /note -->

### <a id="s-holeWire"></a>`holeWire()`

function · **exported** · L344–351

- called by: [`tickWorldSync`](../../net/worldsync.js.md#s-tickWorldSync) _js/net/worldsync.js_ · [`worldSnapshot`](../../sim/sim.js.md#s-worldSnapshot) _js/sim/sim.js_

<!-- note:holeWire -->
---- the wire ---------------------------------------------------------------
<!-- /note -->

### <a id="s-adoptHoles"></a>`adoptHoles(list)`

function · **exported** · L353–375

- calls: [`fx`](#s-fx) ×2
- called by: [`handleMessage`](../../net/worldsync.js.md#s-handleMessage) _js/net/worldsync.js_ · [`applyWorldSnapshot`](../../sim/sim.js.md#s-applyWorldSnapshot) _js/sim/sim.js_

<!-- note:adoptHoles -->
Mirror the host's holes: keep by id (smooth), add new, drop gone.
<!-- /note -->
