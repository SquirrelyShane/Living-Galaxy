# js/asteroidgen/addons/Pass.js

[index](../../../../README.md) · 35 lines · 15 symbols · 1 imports · 0 importers

## About

<!-- note:@file -->
LIVING GALAXY — the two names js/asteroidgen/blackhole.js imports from
`three/addons/postprocessing/Pass.js`, and nothing else from three's
post-processing examples. The game does not vendor three/addons (its own
compact composer is js/render/postfx.js), so the import map points that one
specifier here. Same contract as three's own: a Pass has enabled /
needsSwap / clear / renderToScreen and a render(renderer, write, read);
a FullScreenQuad draws one material over the whole target.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `OrthographicCamera`, `Float32BufferAttribute`, `BufferGeometry`, `Mesh` | external |

## Imported by

_nothing scanned imports this file — entry point, loaded by path, or dead_

## Exports

- [`Pass`](#s-Pass) · class — **no importer in scanned roots**
- [`FullScreenQuad`](#s-FullScreenQuad) · class — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-Pass"></a>`Pass`

class · **exported** · L3–14

<!-- note:Pass -->
<!-- /note -->

#### <a id="s-Pass-constructor"></a>`Pass.constructor()`

method · L4–10

<!-- note:Pass.constructor -->
<!-- /note -->

#### <a id="s-Pass-setSize"></a>`Pass.setSize()`

method · L11–11

<!-- note:Pass.setSize -->
<!-- /note -->

#### <a id="s-Pass-render"></a>`Pass.render()`

method · L12–12

<!-- note:Pass.render -->
<!-- /note -->

#### <a id="s-Pass-dispose"></a>`Pass.dispose()`

method · L13–13

<!-- note:Pass.dispose -->
<!-- /note -->

### <a id="s-_camera"></a>`_camera`

const · L16–16

<!-- note:_camera -->
<!-- /note -->

### <a id="s-FullscreenTriangleGeometry"></a>`FullscreenTriangleGeometry`

class · L18–24

- called by: [`_geometry`](#s-_geometry)

<!-- note:FullscreenTriangleGeometry -->
one triangle that covers the screen: no diagonal seam, fewer vertices
<!-- /note -->

#### <a id="s-FullscreenTriangleGeometry-constructor"></a>`FullscreenTriangleGeometry.constructor()`

method · L19–23

<!-- note:FullscreenTriangleGeometry.constructor -->
<!-- /note -->

### <a id="s-_geometry"></a>`_geometry`

const · L25–25

- calls: [`new FullscreenTriangleGeometry`](#s-FullscreenTriangleGeometry)

<!-- note:_geometry -->
<!-- /note -->

### <a id="s-FullScreenQuad"></a>`FullScreenQuad`

class · **exported** · L27–35

<!-- note:FullScreenQuad -->
<!-- /note -->

#### <a id="s-FullScreenQuad-constructor"></a>`FullScreenQuad.constructor(material)`

method · L28–30

<!-- note:FullScreenQuad.constructor -->
<!-- /note -->

#### <a id="s-FullScreenQuad-dispose"></a>`FullScreenQuad.dispose()`

method · L31–31

<!-- note:FullScreenQuad.dispose -->
<!-- /note -->

#### <a id="s-FullScreenQuad-render"></a>`FullScreenQuad.render(renderer)`

method · L32–32

<!-- note:FullScreenQuad.render -->
<!-- /note -->

#### <a id="s-FullScreenQuad-get-material"></a>`FullScreenQuad.get material()`

method · L33–33

<!-- note:FullScreenQuad.get material -->
<!-- /note -->

#### <a id="s-FullScreenQuad-set-material"></a>`FullScreenQuad.set material(value)`

method · L34–34

<!-- note:FullScreenQuad.set material -->
<!-- /note -->
