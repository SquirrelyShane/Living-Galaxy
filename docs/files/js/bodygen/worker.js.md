# js/bodygen/worker.js

[index](../../../README.md) · 46 lines · 8 symbols · 0 imports · 0 importers

## About

<!-- note:@file -->
LIVING GALAXY — the body grower, off the main thread.

Growing a rock at the generator's own resolution costs 40–260 ms in node and
several times that on a phone: done in the frame loop, every rock you fly up
to is a hitch. So it happens here.

The one wrinkle is that the vendored generator imports bare `three`, and a
module worker has no import map. Rather than edit the vendored files, this
loads the module graph itself: fetch each file, point `three` at the vendored
build by absolute URL, rewrite relative imports to blob URLs of their own
rewritten sources, and import the result. The graph under body.js is small
and acyclic (generator, debris, ores, rng, classes, materials, rockgen, bake).
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 32 | `‹(await)›` | dynamic `import()` in `ready` | runtime-resolved |

## Imported by

_nothing scanned imports this file — entry point, loaded by path, or dead_

## Exports

_none_

## Effects

- **event.handler** — `self.onmessage` (@file:35)
- **net.fetch** — `‹url›` (loadModule:9)
- **net.postMessage** — `self` (@file:40, @file:42, @file:46, @file:46)

## Symbols

### <a id="s-THREE_URL"></a>`THREE_URL`

const · L1–1

<!-- note:THREE_URL -->
<!-- /note -->

### <a id="s-blobs"></a>`blobs`

const · L2–2

<!-- note:blobs -->
<!-- /note -->

### <a id="s-FROM"></a>`FROM`

const · L3–3

<!-- note:FROM -->
<!-- /note -->

### <a id="s-BARE"></a>`BARE`

const · L4–4

<!-- note:BARE -->
<!-- /note -->

### <a id="s-loadModule"></a>`loadModule(url)`

function · L6–28

- calls: [`loadModule`](#s-loadModule)
- called by: [`loadModule`](#s-loadModule) · [`ready`](#s-ready)
- effects: net.fetch `‹url›`

<!-- note:loadModule -->
<!-- /note -->

### <a id="s-body"></a>`body`

const · L30–30

<!-- note:body -->
<!-- /note -->

### <a id="s-ready"></a>`ready`

const · L31–33

- calls: [`loadModule`](#s-loadModule)

<!-- note:ready -->
<!-- /note -->

### <a id="s-d"></a>`d`

const · L39–39

<!-- note:d -->
<!-- /note -->
