# js/shipgen/ops/host.js

[index](../../../../README.md) · 15 lines · 4 symbols · 0 imports · 4 importers

## About

<!-- note:@file -->
Host bindings for the live-systems layer.

The ops/fx modules used to import the yard's WebGL scene, its global builder and its
toast helper directly. In a portable generator they take those from here instead, so a
host project injects its own THREE scene (or any Object3D) once at startup:

  import { setOpsHost } from ".../src/ops/host.js";
  setOpsHost({ scene: myScene, toast: (msg) => myHud.say(msg) });

`scene` is the only required field — it is where transient effects (tracers, beams,
puffs, the target drone, the mining rock) are parented. Anything added there is removed
again by the effect's own lifetime, so a dedicated `new THREE.Group()` works fine and
keeps the FX out of your main graph.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/shipgen/index.js](../index.js.md) — `setOpsHost`, `host`
- [js/shipgen/ops/fx.js](fx.js.md) — `fxScene`
- [js/shipgen/ops/ops.js](ops.js.md) — `host`, `fxScene`
- test/shipgen/test-ops.mjs _(outside js/)_ — `setOpsHost`

## Exports

- [`host`](#s-host) · const — used by [js/shipgen/index.js](../index.js.md), [js/shipgen/ops/ops.js](ops.js.md)
- [`setOpsHost`](#s-setOpsHost) · function — used by [js/shipgen/index.js](../index.js.md), test/shipgen/test-ops.mjs
- [`fxScene`](#s-fxScene) · function — used by [js/shipgen/ops/fx.js](fx.js.md), [js/shipgen/ops/ops.js](ops.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-host"></a>`host`

const · **exported** · L1–4

<!-- note:host -->
- L2 · `scene: null,` — Object3D that transient FX are added to / removed from
- L3 · `toast: () => {},` — optional user-facing message sink
<!-- /note -->

#### <a id="s-host-toast"></a>`host.toast()`

prop · L3–3

<!-- note:host.toast -->
<!-- /note -->

### <a id="s-setOpsHost"></a>`setOpsHost({…}=)`

function · **exported** · L6–10

<!-- note:setOpsHost -->
<!-- /note -->

### <a id="s-fxScene"></a>`fxScene()`

function · **exported** · L12–15

- called by: [`fxAdd`](fx.js.md#s-fxAdd) _js/shipgen/ops/fx.js_ · [`fxUpdate`](fx.js.md#s-fxUpdate) _js/shipgen/ops/fx.js_ · [`opsBind`](ops.js.md#s-opsBind) _js/shipgen/ops/ops.js_ ×6 · [`startMining`](ops.js.md#s-startMining) _js/shipgen/ops/ops.js_ ×2 · [`stopMining`](ops.js.md#s-stopMining) _js/shipgen/ops/ops.js_

<!-- note:fxScene -->
Throws with a useful message instead of "cannot read property add of null".
<!-- /note -->
