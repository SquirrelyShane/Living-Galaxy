# js/robotgen/camera.js

[index](../../../README.md) · 54 lines · 4 symbols · 0 imports · 0 importers

## About

<!-- note:@file -->
robotgen/src/camera.js — framing math, kept out of demo.html so it can be
checked headless (test/framing.js). Two rules:
  1. fit the MEASURED bounding sphere, not the nominal height — antennas,
     backpacks, outstretched arms and track pods all stick out past it;
  2. frame into the band left between the title bar and the HUD, so nothing
     important sits behind the panel.
A sphere is rotation-invariant, so orbiting never pushes the robot off screen.
<!-- /note -->

## Imports

_none_

## Imported by

_nothing scanned imports this file — entry point, loaded by path, or dead_

## Exports

- [`fitCamera`](#s-fitCamera) · function — **no importer in scanned roots**
- [`focusFromBox`](#s-focusFromBox) · function — **no importer in scanned roots**
- [`orbitPosition`](#s-orbitPosition) · function — **no importer in scanned roots**
- [`clampOrbit`](#s-clampOrbit) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-fitCamera"></a>`fitCamera(o)`

function · **exported** · L1–27

<!-- note:fitCamera -->
- L13 · `const rXZ = Math.max(0.1, o.radiusXZ !== undefined ? o.radiusXZ : o.radius);` — Fit a standing cylinder, not a sphere: the horizontal radius is invariant
  under yaw (so orbiting is safe) but a tall thin robot is no longer pushed
  far away just because its height inflated a sphere radius.
- L20 · `const wpp = 2 * dist * Math.tan(vfov / 2) / viewH;` — world metres per pixel
<!-- /note -->

### <a id="s-focusFromBox"></a>`focusFromBox(b)`

function · **exported** · L29–34

<!-- note:focusFromBox -->
standing-cylinder bound from an axis-aligned box (shape that bounds() returns)
<!-- /note -->

### <a id="s-orbitPosition"></a>`orbitPosition(target, yaw, pitch, dist)`

function · **exported** · L36–43

<!-- note:orbitPosition -->
<!-- /note -->

### <a id="s-clampOrbit"></a>`clampOrbit(cam, focus)`

function · **exported** · L45–54

<!-- note:clampOrbit -->
<!-- /note -->
