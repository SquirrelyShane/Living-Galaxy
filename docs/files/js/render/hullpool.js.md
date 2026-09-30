# js/render/hullpool.js

[index](../../../README.md) · 68 lines · 9 symbols · 3 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — the hull pool.

Forging a hull through the generator costs tens of milliseconds and a
few thousand triangles of its own geometry. The flow (npc/flow.js) wants
a hundred boats on the board. So the pool forges each (hull id, variant)
once — a lite build, a seed and a livery of its own — and hands out
instances that share its geometry and materials. An instance is a
three.js clone: its own transform, its own scale jitter, its own plume
materials (so throttle reads per boat), everything else by reference.
Forty templates cover the whole sky; the GPU sees one copy of each.

Templates are built lazily, one per call to `warm()`, so the engine can
spread the cost over frames the way it already does for traffic hulls.

- L5 · `const templates = new Map();` — key → { group, key }
- L6 · `const pending = [];` — keys waiting to be forged
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../ships/shipforge.js` | `forgeShip`, `releaseHull` | [js/ships/shipforge.js](../ships/shipforge.js.md) |
| 2 | `../ships/shipdb.js` | `shipById`, `DEFAULT_SHIP_ID` | [js/ships/shipdb.js](../ships/shipdb.js.md) |
| 3 | `../shipgen/anim.js` | `newRegistry`, `collectInto` | [js/shipgen/anim.js](../shipgen/anim.js.md) |

## Imported by

- [js/render/engine.js](engine.js.md) — `templateFor`, `warm`, `instanceOf`, `releaseInstance`, `drainPool`
- test/sky.test.mjs _(outside js/)_ — `templateFor`, `warm`, `instanceOf`, `releaseInstance`, `poolStats`, `drainPool`

## Exports

- [`templateFor`](#s-templateFor) · function — used by [js/render/engine.js](engine.js.md), test/sky.test.mjs
- [`warm`](#s-warm) · function — used by [js/render/engine.js](engine.js.md), test/sky.test.mjs
- [`instanceOf`](#s-instanceOf) · function — used by [js/render/engine.js](engine.js.md), test/sky.test.mjs
- [`releaseInstance`](#s-releaseInstance) · function — used by [js/render/engine.js](engine.js.md), test/sky.test.mjs
- [`drainPool`](#s-drainPool) · function — used by [js/render/engine.js](engine.js.md), test/sky.test.mjs
- [`poolStats`](#s-poolStats) · function — used by test/sky.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-templates"></a>`templates`

const · L5–5

<!-- note:templates -->
<!-- /note -->

### <a id="s-pending"></a>`pending`

const · L6–6

<!-- note:pending -->
<!-- /note -->

### <a id="s-keyOf"></a>`keyOf(shipId, variant, color)`

function · L8–8

- called by: [`templateFor`](#s-templateFor)

<!-- note:keyOf -->
<!-- /note -->

### <a id="s-templateFor"></a>`templateFor(shipId, variant=, color=)`

function · **exported** · L10–16

- calls: [`keyOf`](#s-keyOf)
- called by: [`mountGame>syncFlow`](engine.js.md#s-mountGame-syncFlow) _js/render/engine.js_

<!-- note:templateFor -->
Ask for a template; null until `warm()` has forged it.
<!-- /note -->

### <a id="s-warm"></a>`warm(n=)`

function · **exported** · L18–30

- calls: [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ ×2 · [`forgeShip`](../ships/shipforge.js.md#s-forgeShip) _js/ships/shipforge.js_
- called by: [`mountGame>syncFlow`](engine.js.md#s-mountGame-syncFlow) _js/render/engine.js_

<!-- note:warm -->
Forge up to `n` pending templates. Returns how many were built.
<!-- /note -->

### <a id="s-instanceOf"></a>`instanceOf(tpl, scale=)`

function · **exported** · L32–51

- calls: [`collectInto`](../shipgen/anim.js.md#s-collectInto) _js/shipgen/anim.js_ · [`newRegistry`](../shipgen/anim.js.md#s-newRegistry) _js/shipgen/anim.js_
- called by: [`mountGame>syncFlow`](engine.js.md#s-mountGame-syncFlow) _js/render/engine.js_

<!-- note:instanceOf -->
An instance of a template: shared geometry and materials, own plumes.

- L33 · `const keep = tpl.group.userData;` — Object3D.clone deep-copies userData through JSON — the root's carries the
  builder and mesh references, so lift it off for the copy.
- L37 · `const ownMats = [];` — the template's own materials carry `cloned` too (the generator marks what it
  cloned per build), so the flag cannot tell ours from the shared ones — keep a list
- L47 · `for (const o of g.userData.gen.anim.pulses) if (o.material) ownMats.push(o.material);` — collectInto re-clones every pulse material: those are ours as well
<!-- /note -->

### <a id="s-releaseInstance"></a>`releaseInstance(g)`

function · **exported** · L53–57

- called by: [`mountGame>rebuildWorld`](engine.js.md#s-mountGame-rebuildWorld) _js/render/engine.js_ · [`mountGame>syncFlow`](engine.js.md#s-mountGame-syncFlow) _js/render/engine.js_

<!-- note:releaseInstance -->
Free an instance: only what it owns — its plume and pulse materials.
<!-- /note -->

### <a id="s-drainPool"></a>`drainPool()`

function · **exported** · L59–66

- calls: [`releaseHull`](../ships/shipforge.js.md#s-releaseHull) _js/ships/shipforge.js_
- called by: [`mountGame>rebuildWorld`](engine.js.md#s-mountGame-rebuildWorld) _js/render/engine.js_

<!-- note:drainPool -->
Drop every template (sky change).
<!-- /note -->

### <a id="s-poolStats"></a>`poolStats()`

function · **exported** · L68–68

<!-- note:poolStats -->
<!-- /note -->
