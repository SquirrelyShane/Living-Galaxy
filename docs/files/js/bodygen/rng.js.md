# js/bodygen/rng.js

[index](../../../README.md) · 132 lines · 16 symbols · 0 imports · 0 importers

## About

<!-- note:@file -->
LIVING GALAXY — seeded noise for the asteroid generator.

Taken verbatim from Shane's asteroid-generator drop-in (js/rng.js): hash,
PRNG, 3D value noise, fbm and ridged noise. It has no imports and nothing
game-specific in it, so it is carried across unchanged — the parts that
needed changing were the ORE CATALOGUE and the class tables, which now read
Living Galaxy's own minerals (see js/bodygen/classes.js).
<!-- /note -->

## Imports

_none_

## Imported by

_nothing scanned imports this file — entry point, loaded by path, or dead_

## Exports

- [`hashString`](#s-hashString) · function — **no importer in scanned roots**
- [`RNG`](#s-RNG) · class — **no importer in scanned roots**
- [`valueNoise3`](#s-valueNoise3) · function — **no importer in scanned roots**
- [`fbm`](#s-fbm) · function — **no importer in scanned roots**
- [`ridged`](#s-ridged) · function — **no importer in scanned roots**
- [`randomSeedString`](#s-randomSeedString) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-hashString"></a>`hashString(str)`

function · **exported** · L1–8

<!-- note:hashString -->
<!-- /note -->

### <a id="s-RNG"></a>`RNG`

class · **exported** · L10–38

<!-- note:RNG -->
<!-- /note -->

#### <a id="s-RNG-constructor"></a>`RNG.constructor(seed)`

method · L11–13

<!-- note:RNG.constructor -->
<!-- /note -->

#### <a id="s-RNG-next"></a>`RNG.next()`

method · L15–21

<!-- note:RNG.next -->
<!-- /note -->

#### <a id="s-RNG-range"></a>`RNG.range(a, b)`

method · L23–25

<!-- note:RNG.range -->
<!-- /note -->

#### <a id="s-RNG-int"></a>`RNG.int(a, b)`

method · L27–29

<!-- note:RNG.int -->
<!-- /note -->

#### <a id="s-RNG-pick"></a>`RNG.pick(arr)`

method · L31–33

<!-- note:RNG.pick -->
<!-- /note -->

#### <a id="s-RNG-signed"></a>`RNG.signed()`

method · L35–37

<!-- note:RNG.signed -->
<!-- /note -->

### <a id="s-fade"></a>`fade(t)`

function · L40–42

- called by: [`valueNoise3`](#s-valueNoise3) ×3

<!-- note:fade -->
<!-- /note -->

### <a id="s-lerp"></a>`lerp(a, b, t)`

function · L44–46

- called by: [`valueNoise3`](#s-valueNoise3) ×7

<!-- note:lerp -->
<!-- /note -->

### <a id="s-gradHash"></a>`gradHash(ix, iy, iz, seed)`

function · L48–56

- called by: [`valueNoise3>corner`](#s-valueNoise3-corner)

<!-- note:gradHash -->
<!-- /note -->

### <a id="s-valueNoise3"></a>`valueNoise3(x, y, z, seed)`

function · **exported** · L58–90

- calls: [`fade`](#s-fade) ×3 · [`lerp`](#s-lerp) ×7 · [`valueNoise3>corner`](#s-valueNoise3-corner) ×8
- called by: [`fbm`](#s-fbm) · [`ridged`](#s-ridged)

<!-- note:valueNoise3 -->
<!-- /note -->

#### <a id="s-valueNoise3-corner"></a>`valueNoise3>corner(cx, cy, cz)`

function · L66–72

- calls: [`gradHash`](#s-gradHash)
- called by: [`valueNoise3`](#s-valueNoise3) ×8

<!-- note:valueNoise3>corner -->
<!-- /note -->

### <a id="s-fbm"></a>`fbm(x, y, z, seed, octaves=, lacunarity=, gain=)`

function · **exported** · L92–104

- calls: [`valueNoise3`](#s-valueNoise3)

<!-- note:fbm -->
<!-- /note -->

### <a id="s-ridged"></a>`ridged(x, y, z, seed, octaves=)`

function · **exported** · L106–119

- calls: [`valueNoise3`](#s-valueNoise3)

<!-- note:ridged -->
<!-- /note -->

### <a id="s-randomSeedString"></a>`randomSeedString(rng=)`

function · **exported** · L121–132

<!-- note:randomSeedString -->
<!-- /note -->
