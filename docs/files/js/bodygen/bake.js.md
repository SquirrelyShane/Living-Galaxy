# js/bodygen/bake.js

[index](../../../README.md) · 96 lines · 3 symbols · 0 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — the generator's surface, at the generator's own resolution,
on a mesh a phone can carry.

Shane's asteroid generator draws its craters, grooves, grit, scarps, frost
and vein networks as GEOMETRY and per-vertex colour, for a survey mesh of
56–158 cells a cube face. The game had been asking it for 7–12 cells, where
every one of those features falls between vertices: what came back was the
right silhouette wearing an averaged colour — a smooth grey potato that only
started to look like the rock as you closed to a few hundred metres.

So a body is grown ONCE at a real detail (H cells a face) and baked:

  - the generator's vertex lattice IS a texture already. Its cube-sphere puts
    every face on an (H+1)² grid, so each face's colour, metalness,
    roughness, emission and normal go straight into an atlas texel per
    vertex — six faces in a 3×2 sheet, no rasteriser, no UV unwrap. At H=48
    that sheet is 147×98 texels.
  - the mesh actually drawn is the same lattice sampled every H/L vertices
    (L cells a face), unwelded per face so each face carries its own atlas
    coordinates. Its corners ARE generator vertices, so the silhouette is the
    generator's; the shading between them reads the full-resolution normal.

Texel centres sit exactly on the low mesh's vertices and a face never
samples outside its own block, so there is no seam bleed; a seam vertex has
the same data on every face that shares it, so there is no seam line.

Pure data, no THREE — it runs in the grower worker (js/bodygen/worker.js) and
in node for the tests; js/bodygen/baked.js turns the arrays into a mesh.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/bodygen/body.js](body.js.md) — `bakeLattice`

## Exports

- [`faceGrids`](#s-faceGrids) · function — **no importer in scanned roots**
- [`bakeLattice`](#s-bakeLattice) · function — used by [js/bodygen/body.js](body.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-faceGrids"></a>`faceGrids(n)`

function · **exported** · L1–23

- called by: [`bakeLattice`](#s-bakeLattice)

<!-- note:faceGrids -->
Vertex id at every (face, i, j) of the generator's cube-sphere, in its own build order.

- L7 · `for (let k = 0; k < 3; k++) {` — the loop order, key and first-seen numbering of generator.js buildCubeSphere,
  exactly: that is what makes a grid cell and a generator vertex the same thing
<!-- /note -->

### <a id="s-clamp01"></a>`clamp01(x)`

function · L25–25

- called by: [`bakeLattice`](#s-bakeLattice) ×8

<!-- note:clamp01 -->
<!-- /note -->

### <a id="s-bakeLattice"></a>`bakeLattice(src, H, L)`

function · **exported** · L27–96

- calls: [`clamp01`](#s-clamp01) ×8 · [`faceGrids`](#s-faceGrids)
- called by: [`growBaked`](body.js.md#s-growBaked) _js/bodygen/body.js_ ×2

<!-- note:bakeLattice -->
Bake a grown body. `src` is the generator's vertex arrays (position, normal,
color, aMetal, aRough, aEmit) at detail `H`; `L` must divide `H`.

Atlas A: rgb = √albedo (so dark carbonaceous rock survives 8 bits), a = metalness.
Atlas B: rgb = object-space normal ·½+½, a = roughness.
Atlas C: rgb = emission / emitScale — null when nothing on the body glows.

- L62 · `const vpf = M1 * M1;` — the drawn mesh: every step-th lattice vertex, one unwelded grid a face
- L86 · `const far = f % 2 === 1;` — the generator's winding: faces on the far side of an axis turn the other way
<!-- /note -->
