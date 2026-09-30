# js/ships/shipforge.js

[index](../../../README.md) · 188 lines · 19 symbols · 4 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY — the ship forge.

Grows a hull from a registry def (shipdb.js) and a seed, using the ship
generator in js/shipgen/ (the NEWSHIPGEN extraction of ORBITAL YARD). The
def is translated into a generator class and a catalogue parts list by
hullspec.js; this file is the thin layer that builds it, normalizes it to
the engine's conventions and hands back the contract the rest of LIVING GALAXY
already reads.

Same def + same seed is the same ship, every time, on every client — the
generator is deterministic for a (seed, config), so multiplayer peers agree
on what a hull looks like without shipping meshes around.

Conventions match the engine: nose toward -Z, +Y up, the returned group is
centred on origin and its length is exactly def.dims[0] world units
(1 u = 10 m). On the group:

  userData.def, .seed, .parts       as before
  userData.plumes / .glow           exhaust cones (glow = the first one)
  userData.gen                      { builder, cfg, anim, stats } from the
                                    generator — anim feeds tickHull()
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../../vendor/three.module.min.js` | `*` as `THREE` | **missing in js/** |
| 2 | `../shipgen/generate.js` | `buildShip`, `releaseShip` | [js/shipgen/generate.js](../shipgen/generate.js.md) |
| 3 | `../shipgen/anim.js` | `tick`, `newRegistry`, `collectInto` | [js/shipgen/anim.js](../shipgen/anim.js.md) |
| 4 | `./hullspec.js` | `genConfig`, `hullSpec` | [js/ships/hullspec.js](hullspec.js.md) |

## Imported by

- [js/render/attract.js](../render/attract.js.md) — `forgeShipScaled`, `tickHull`, `releaseHull`
- [js/render/engine.js](../render/engine.js.md) — `forgeShip`, `tickHull`
- [js/render/hullpool.js](../render/hullpool.js.md) — `forgeShip`, `releaseHull`
- test/forge.test.mjs _(outside js/)_ — `forgeShip`, `forgeShipScaled`, `tickHull`, `releaseHull`

## Exports

- [`forgeShip`](#s-forgeShip) · function — used by [js/render/engine.js](../render/engine.js.md), [js/render/hullpool.js](../render/hullpool.js.md), test/forge.test.mjs
- [`forgeShipScaled`](#s-forgeShipScaled) · function — used by [js/render/attract.js](../render/attract.js.md), test/forge.test.mjs
- [`tickHull`](#s-tickHull) · function — used by [js/render/attract.js](../render/attract.js.md), [js/render/engine.js](../render/engine.js.md), test/forge.test.mjs
- [`releaseHull`](#s-releaseHull) · function — used by [js/render/attract.js](../render/attract.js.md), [js/render/hullpool.js](../render/hullpool.js.md), test/forge.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-forgeShip"></a>`forgeShip(def, seed, opts=)`

function · **exported** · L6–46

- calls: [`collectInto`](../shipgen/anim.js.md#s-collectInto) _js/shipgen/anim.js_ · [`newRegistry`](../shipgen/anim.js.md#s-newRegistry) _js/shipgen/anim.js_ · [`buildShip`](../shipgen/generate.js.md#s-buildShip) _js/shipgen/generate.js_ · [`genConfig`](hullspec.js.md#s-genConfig) _js/ships/hullspec.js_ · [`hullSpec`](hullspec.js.md#s-hullSpec) _js/ships/hullspec.js_ · [`lodSwap`](#s-lodSwap) · [`mergeStatic`](#s-mergeStatic) · [`shareLampMaterials`](#s-shareLampMaterials)
- called by: [`makeShipGroup`](../render/engine.js.md#s-makeShipGroup) _js/render/engine.js_ · [`warm`](../render/hullpool.js.md#s-warm) _js/render/hullpool.js_ · [`forgeShipScaled`](#s-forgeShipScaled)

<!-- note:forgeShip -->
Forge a hull. `opts`: primary / secondary / accent / engine livery colours,
`finish`, `detail` ("full" | "lite" — lite drops greeble, windows, lamps
and the sub-metre fittings for traffic and remote hulls), `analyze` (run
the flight + BOM pass; off by default, the yard turns it on).

- L11 · `inner.traverse((o) => { if (o.geometry?.userData?.shared) o.geometry.userData.keep = true;` — Shared unit geometry lives for the life of the page: flag it so the
  engine's disposal pass leaves it alone (its own GEO uses the same flag).
- L13 · `if (!opts.pointLights) {` — The generator lights its drives with point lights. Every light in the
  scene costs every material a shader path, so a dozen traffic hulls would
  grind the whole frame — the engine lights hulls with its own sun.
- L19 · `const lite = opts.detail === "lite";` — A generated hull is 400–2000 meshes. Merge everything that never moves
  into one mesh per material; only the animated nodes stay live.
- L20 · `lodSwap(inner, lite ? "lite" : "full");` — Unit primitives come from the generator at yard resolution — an 18×14
  sphere for every lamp bead. Swap in coarser unit geometry before the
  merge: lamps always, the rest of the round stock on lite hulls.
- L24 · `if (lite) built.anim = collectInto(newRegistry(), inner);` — Lite hulls animate nothing but the plumes: re-index what survived.
- L27 · `_box.setFromObject(inner);` — Normalize: centre on origin, exact length = def.dims[0]. Measured after
  the LOD swap and the merge, so what is on screen is what is scaled.
<!-- /note -->

### <a id="s-_box"></a>`_box`

const · L48–48

<!-- note:_box -->
---- level of detail -----------------------------------------------------
Replacement unit geometries, cached per (shape, resolution) and flagged
shared/keep like the generator's own, so a swap is free and the engine's
disposal pass leaves them alone. A phone's budget is triangles as much as
draws: a lamp bead does not need 500 of them.
<!-- /note -->

### <a id="s-_size"></a>`_size`

const · L49–49

<!-- note:_size -->
<!-- /note -->

### <a id="s-_centre"></a>`_centre`

const · L50–50

<!-- note:_centre -->
<!-- /note -->

### <a id="s-LOD_CACHE"></a>`LOD_CACHE`

const · L51–51

<!-- note:LOD_CACHE -->
<!-- /note -->

### <a id="s-lodGeo"></a>`lodGeo(key, make)`

function · L52–56

- called by: [`lodSwap`](#s-lodSwap) ×3

<!-- note:lodGeo -->
<!-- /note -->

### <a id="s-LOD"></a>`LOD`

const · L58–61

<!-- note:LOD -->
segment counts by level: [lamp sphere, sphere, cylinder, torus radial, torus tubular]
<!-- /note -->

### <a id="s-lodSwap"></a>`lodSwap(inner, level)`

function · L63–86

- calls: [`lodGeo`](#s-lodGeo) ×3
- called by: [`forgeShip`](#s-forgeShip)

<!-- note:lodSwap -->
<!-- /note -->

### <a id="s-FULL_LIVE"></a>`FULL_LIVE`

const · L88–88

<!-- note:FULL_LIVE -->
---- static merge --------------------------------------------------------
Draw calls are the budget on a phone. Everything the animation registry
does not touch (see shipgen/anim.js markers) is baked, per material, into
a single non-indexed BufferGeometry in the hull's own frame. Animated nodes
— plumes, lamps, spinning drums, sweeping sensors, patrolling turrets — and
everything under them are left as they are.
<!-- /note -->

### <a id="s-LITE_LIVE"></a>`LITE_LIVE`

const · L89–89

<!-- note:LITE_LIVE -->
<!-- /note -->

### <a id="s-_inv"></a>`_inv`

const · L90–90

<!-- note:_inv -->
<!-- /note -->

### <a id="s-shareLampMaterials"></a>`shareLampMaterials(inner)`

function · L92–102

- called by: [`forgeShip`](#s-forgeShip)

<!-- note:shareLampMaterials -->
Lite hulls: every lamp of one colour shares one material, so the merge can
fold hundreds of beads into a handful of draws. Steady glow, no blink.
<!-- /note -->

### <a id="s-mergeStatic"></a>`mergeStatic(inner, liveKeys)`

function · L104–138

- calls: [`mergeList`](#s-mergeList) · [`mergeStatic>walk`](#s-mergeStatic-walk)
- called by: [`forgeShip`](#s-forgeShip)

<!-- note:mergeStatic -->
- L108 · `const buckets = new Map();` — material → [{ geo, matrix }]
- L123 · `if (list.length < 2) continue;` — nothing to gain
- L134 · `if (!entry?.some((e) => e.merged)) continue;` — singletons stay where they were
<!-- /note -->

#### <a id="s-mergeStatic-isAnimated"></a>`mergeStatic>isAnimated(o)`

function · L105–105

- called by: [`mergeStatic>walk`](#s-mergeStatic-walk)

<!-- note:mergeStatic>isAnimated -->
<!-- /note -->

#### <a id="s-mergeStatic-walk"></a>`mergeStatic>walk(o, live)`

function · L110–119

- calls: [`mergeStatic>isAnimated`](#s-mergeStatic-isAnimated) · [`mergeStatic>walk`](#s-mergeStatic-walk)
- called by: [`mergeStatic`](#s-mergeStatic) · [`mergeStatic>walk`](#s-mergeStatic-walk)

<!-- note:mergeStatic>walk -->
<!-- /note -->

### <a id="s-mergeList"></a>`mergeList(list)`

function · L140–169

- called by: [`mergeStatic`](#s-mergeStatic)

<!-- note:mergeList -->
<!-- /note -->

### <a id="s-forgeShipScaled"></a>`forgeShipScaled(def, seed, opts=, targetLen=)`

function · **exported** · L171–175

- calls: [`forgeShip`](#s-forgeShip)
- called by: [`mountAttract>buildHull`](../render/attract.js.md#s-mountAttract-buildHull) _js/render/attract.js_

<!-- note:forgeShipScaled -->
Drop-in for engine.js: forge a hull, uniformly scaled so its length is
`targetLen` world units (defaults to the def's own registry length).
<!-- /note -->

### <a id="s-tickHull"></a>`tickHull(group, dt, t, ctx=)`

function · **exported** · L177–181

- calls: [`tick`](../shipgen/anim.js.md#s-tick) _js/shipgen/anim.js_
- called by: [`mountAttract>step`](../render/attract.js.md#s-mountAttract-step) _js/render/attract.js_ · [`mountGame>syncFlow`](../render/engine.js.md#s-mountGame-syncFlow) _js/render/engine.js_ · [`mountGame>syncRemotes`](../render/engine.js.md#s-mountGame-syncRemotes) _js/render/engine.js_ · [`mountGame>syncTraffic`](../render/engine.js.md#s-mountGame-syncTraffic) _js/render/engine.js_ · [`mountGame>tick`](../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_

<!-- note:tickHull -->
Drive the hull's idle animation: plumes follow `throttle` (0–1), lamps
blink, sensors sweep, turrets patrol or slew onto `aim` (a world Vector3).
<!-- /note -->

### <a id="s-releaseHull"></a>`releaseHull(group)`

function · **exported** · L183–188

- calls: [`releaseShip`](../shipgen/generate.js.md#s-releaseShip) _js/shipgen/generate.js_
- called by: [`mountAttract>stop`](../render/attract.js.md#s-mountAttract-stop) _js/render/attract.js_ · [`drainPool`](../render/hullpool.js.md#s-drainPool) _js/render/hullpool.js_

<!-- note:releaseHull -->
Free what a forged hull owns that the scene-level disposer cannot see:
the materials the generator cloned per build. Geometry is handled by the
caller's own disposal pass (shared primitives are flagged `keep`).
<!-- /note -->
