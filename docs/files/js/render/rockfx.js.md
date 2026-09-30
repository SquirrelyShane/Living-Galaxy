# js/render/rockfx.js

[index](../../../README.md) · 164 lines · 23 symbols · 4 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — what a grown rock carries, and what is left when it goes.

Three things out of the asteroid generator's debris module (vendored at
js/asteroidgen/debris.js and generator.js), all laid out in the generator's
unit frame and so parented to a grown body's `unit` group:

  RUBBLE    seated boulders and a lofted halo of chips, on the ONE rock you
            are working (locked, under the cutter, or simply nearest).
            Five draw calls; not worth paying on every rock in view.
  CLOUDS    icy crystalline debris — hex prisms, shards, needles, plates and
            druse clusters, meshed rocks rimed with frost, haze and glints —
            orbiting an ice-bearing body in the cold of the belt. The
            generator's field is up to eighteen draw calls, so it goes on the
            nearest one or two such bodies, not on all of them.
  SHATTER   when a rock is cut out, it does not blink off. A dense field in
            the rock's own colours bursts out from where it was, tumbles, and
            is let go over the last few seconds of its life (`uFade`, see
            js/bodygen/gl.js).

Everything animates in the vertex shader — per frame this module writes a
handful of uniforms per field and moves a group to the floating origin.

Budget, off the same quality gate as the grown bodies (engine.js
rockQuality): at `off` none of this exists; `low` gets shatter only, thin;
`full` gets rubble, one cloud, thin shatter; `high` gets two clouds and a
denser shatter.

- L6 · `const CLOUD_R = 2600;` — a cloud is only worth drawing this close
- L8 · `const SHATTER_LIFE = 48;` — seconds from burst to gone
- L9 · `const SHATTER_FADE = 9;` — …the last of which are spent letting it go
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `../asteroidgen/debris.js` | `buildDebrisField` | [js/asteroidgen/debris.js](../asteroidgen/debris.js.md) |
| 3 | `../asteroidgen/generator.js` | `buildRubbleField` | [js/asteroidgen/generator.js](../asteroidgen/generator.js.md) |
| 4 | `../bodygen/gl.js` | `patchGeneratorShaders`, `addFadeUniform` | [js/bodygen/gl.js](../bodygen/gl.js.md) |

## Imported by

- [js/render/engine.js](engine.js.md) — `makeRockFx`

## Exports

- [`makeRockFx`](#s-makeRockFx) · function — used by [js/render/engine.js](engine.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-CLOUD_R"></a>`CLOUD_R`

const · L6–6

<!-- note:CLOUD_R -->
<!-- /note -->

### <a id="s-RUBBLE_R"></a>`RUBBLE_R`

const · L7–7

<!-- note:RUBBLE_R -->
<!-- /note -->

### <a id="s-SHATTER_LIFE"></a>`SHATTER_LIFE`

const · L8–8

<!-- note:SHATTER_LIFE -->
<!-- /note -->

### <a id="s-SHATTER_FADE"></a>`SHATTER_FADE`

const · L9–9

<!-- note:SHATTER_FADE -->
<!-- /note -->

### <a id="s-MAX_SHATTER"></a>`MAX_SHATTER`

const · L10–10

<!-- note:MAX_SHATTER -->
<!-- /note -->

### <a id="s-CLOUD_ICE"></a>`CLOUD_ICE`

const · L11–11

<!-- note:CLOUD_ICE -->
ice budget share (generator iceAffinity) at which a body is worth a cloud:
a C-type's water is 0.4, a D-type's volatiles saturate at 1
<!-- /note -->

### <a id="s-SUN_COLOR"></a>`SUN_COLOR`

const · L12–12

<!-- note:SUN_COLOR -->
<!-- /note -->

### <a id="s-AMBIENT"></a>`AMBIENT`

const · L13–13

<!-- note:AMBIENT -->
<!-- /note -->

### <a id="s-makeRockFx"></a>`makeRockFx({…})`

function · **exported** · L15–164

- calls: [`patchGeneratorShaders`](../bodygen/gl.js.md#s-patchGeneratorShaders) _js/bodygen/gl.js_
- called by: [`mountGame`](engine.js.md#s-mountGame) _js/render/engine.js_

<!-- note:makeRockFx -->
- L18 · `const cfg = {` — 0.3.02: rubble and ice clouds are off on every tier — a rock sitting in the
  belt does not wear a debris ring. Shatter (a rock cut out) stays.
<!-- /note -->

#### <a id="s-makeRockFx-pxScale"></a>`makeRockFx>pxScale()`

function · L31–34

- called by: [`makeRockFx>update`](#s-makeRockFx-update)

<!-- note:makeRockFx>pxScale -->
The debris shaders size their motes as `aSize · uPx / depth`, with aSize in
the field's unit frame and depth in world units, so the pixel scale a field
wants is the screen's projection factor times the field's own scale.
<!-- /note -->

#### <a id="s-makeRockFx-lightField"></a>`makeRockFx>lightField(api, scale, worldPos, px)`

function · L36–46

- called by: [`makeRockFx>update`](#s-makeRockFx-update) ×2

<!-- note:makeRockFx>lightField -->
- L38 · `_v.set(-worldPos.x, -worldPos.y, -worldPos.z);` — the star sits at the origin of the sky; light comes from it
- L43 · `u.uSunColor.value = SUN_COLOR;` — the generator's debris shaders light without three's 1/π, so they run hot beside
  a MeshStandard body under the same sun: brought down to sit with it
<!-- /note -->

#### <a id="s-makeRockFx-disposeGroup"></a>`makeRockFx>disposeGroup(g)`

function · L48–55

- called by: [`makeRockFx>dropCloud`](#s-makeRockFx-dropCloud) · [`makeRockFx>dropRubble`](#s-makeRockFx-dropRubble) · [`makeRockFx>release`](#s-makeRockFx-release)

<!-- note:makeRockFx>disposeGroup -->
- L50 · `if (o.isInstancedMesh) o.dispose();` — instance buffers are freed only by the mesh's own dispose
<!-- /note -->

#### <a id="s-makeRockFx-attachRubble"></a>`makeRockFx>attachRubble(rec)`

function · L57–65

- calls: [`buildRubbleField`](../asteroidgen/generator.js.md#s-buildRubbleField) _js/asteroidgen/generator.js_
- called by: [`makeRockFx>dress`](#s-makeRockFx-dress)

<!-- note:makeRockFx>attachRubble -->
---- per body --------------------------------------------------------

- L62 · `g.traverse((o) => { if (o.isPoints) o.material.size *= rec.built.scale; });` — PointsMaterial sizes do not follow the object's scale: put the chips back
  at the size the generator meant them in its own frame
<!-- /note -->

#### <a id="s-makeRockFx-dropRubble"></a>`makeRockFx>dropRubble(rec)`

function · L67–71

- calls: [`makeRockFx>disposeGroup`](#s-makeRockFx-disposeGroup)
- called by: [`makeRockFx>detach`](#s-makeRockFx-detach) · [`makeRockFx>dress`](#s-makeRockFx-dress)

<!-- note:makeRockFx>dropRubble -->
<!-- /note -->

#### <a id="s-makeRockFx-attachCloud"></a>`makeRockFx>attachCloud(rec)`

function · L73–82

- calls: [`buildDebrisField`](../asteroidgen/debris.js.md#s-buildDebrisField) _js/asteroidgen/debris.js_ · [`addFadeUniform`](../bodygen/gl.js.md#s-addFadeUniform) _js/bodygen/gl.js_
- called by: [`makeRockFx>dress`](#s-makeRockFx-dress)

<!-- note:makeRockFx>attachCloud -->
<!-- /note -->

#### <a id="s-makeRockFx-dropCloud"></a>`makeRockFx>dropCloud(rec)`

function · L84–88

- calls: [`makeRockFx>disposeGroup`](#s-makeRockFx-disposeGroup)
- called by: [`makeRockFx>detach`](#s-makeRockFx-detach) · [`makeRockFx>dress`](#s-makeRockFx-dress)

<!-- note:makeRockFx>dropCloud -->
<!-- /note -->

#### <a id="s-makeRockFx-dress"></a>`makeRockFx>dress(recs, focusKey, ship)`

function · L90–108

- calls: [`makeRockFx>attachCloud`](#s-makeRockFx-attachCloud) · [`makeRockFx>attachRubble`](#s-makeRockFx-attachRubble) · [`makeRockFx>dropCloud`](#s-makeRockFx-dropCloud) · [`makeRockFx>dropRubble`](#s-makeRockFx-dropRubble)

<!-- note:makeRockFx>dress -->
Decide who carries what this frame. `recs` is every grown body that is in
view, `focusKey` the rock being worked (locked / cut), `ship` the hull.
<!-- /note -->

#### <a id="s-makeRockFx-detach"></a>`makeRockFx>detach(rec)`

function · L110–113

- calls: [`makeRockFx>dropCloud`](#s-makeRockFx-dropCloud) · [`makeRockFx>dropRubble`](#s-makeRockFx-dropRubble)

<!-- note:makeRockFx>detach -->
A grown body is leaving the scene: take what it carried with it.
<!-- /note -->

#### <a id="s-makeRockFx-shatter"></a>`makeRockFx>shatter(rec)`

function · L115–129

- calls: [`buildDebrisField`](../asteroidgen/debris.js.md#s-buildDebrisField) _js/asteroidgen/debris.js_ · [`addFadeUniform`](../bodygen/gl.js.md#s-addFadeUniform) _js/bodygen/gl.js_ · [`makeRockFx>release`](#s-makeRockFx-release)

<!-- note:makeRockFx>shatter -->
The rock is cut out. `rec` is its grown body (still holding its last
position and spin); the field is built from the body's own vertex colours
and ice budget, so what flies apart is what you were looking at.
<!-- /note -->

#### <a id="s-makeRockFx-release"></a>`makeRockFx>release(s)`

function · L131–133

- calls: [`makeRockFx>disposeGroup`](#s-makeRockFx-disposeGroup)
- called by: [`makeRockFx>dispose`](#s-makeRockFx-dispose) · [`makeRockFx>shatter`](#s-makeRockFx-shatter) · [`makeRockFx>update`](#s-makeRockFx-update)

<!-- note:makeRockFx>release -->
<!-- /note -->

#### <a id="s-makeRockFx-update"></a>`makeRockFx>update(dt, recs)`

function · L135–156

- calls: [`makeRockFx>lightField`](#s-makeRockFx-lightField) ×2 · [`makeRockFx>pxScale`](#s-makeRockFx-pxScale) · [`makeRockFx>release`](#s-makeRockFx-release)

<!-- note:makeRockFx>update -->
- L152 · `api.uniforms.uFade.value = Math.min(1, (clock - rec.cloudBorn) / 2.5);` — a cloud grows in over a couple of seconds instead of appearing whole
<!-- /note -->

#### <a id="s-makeRockFx-dispose"></a>`makeRockFx>dispose()`

function · L158–161

- calls: [`makeRockFx>release`](#s-makeRockFx-release)

<!-- note:makeRockFx>dispose -->
<!-- /note -->

#### <a id="s-makeRockFx-shatters"></a>`makeRockFx.shatters()`

prop · L163–163

<!-- note:makeRockFx.shatters -->
<!-- /note -->
