# js/world/events/cataclysm.js

[index](../../../../README.md) · 204 lines · 23 symbols · 0 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — cataclysm.

What a world actually does when something big enough hits it, and what a
star does when it stops being one. Everything here is pure maths on plain
numbers so the tests can run it headless; the renderer reads these curves
and draws them.

The physics it is modelled on (compressed, but the SHAPE is real):

  Contact/jetting  — seconds. Shock-melted spray, 10,000–15,000 K,
                     blue-white. The brightest moment of the whole event.
  Vapour plume     — minutes–hours. ~7,800 K rock vapour balloons out,
                     opaque then optically thin, white going yellow.
  Ejecta curtain   — minutes–hours. Ballistic fan, not a uniform shell.
                     Some falls back, some orbits, some leaves.
  Magma ocean      — the body is not a sphere any more and it is glowing.
                     1,300–2,000 K, orange. Craters SLUMP while it is
                     molten — this is why a hit world must not stay spiky.
  Crust            — 800–1,300 K, cherry red, fading to nothing.
  Settle           — the debris torus is thick and clumpy on crossing
                     orbits; inelastic collisions damp out-of-plane motion
                     far faster than radial, so it flattens to a thin
                     equatorial ring long before it circularises.

Inside the Roche limit tides beat self-gravity and material stays a ring.
Outside it, the same debris accretes into moonlets. One event gives both.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/render/engine.js](../../render/engine.js.md) — `dirFbm`, `dirNoise`, `kelvinHex`
- [js/sim/sim.js](../../sim/sim.js.md) — `OUTCOME`, `apparentGlow`, `cataclysmState`, `eventDuration`, `isCataclysmic`, `kelvinHex`, `outcomeOf`, `relaxCraters`, `ringPlan`, `supernovaDuration`, `supernovaState`

## Exports

- [`kelvinRGB`](#s-kelvinRGB) · function — **no importer in scanned roots**
- [`kelvinHex`](#s-kelvinHex) · function — used by [js/render/engine.js](../../render/engine.js.md), [js/sim/sim.js](../../sim/sim.js.md)
- [`dirNoise`](#s-dirNoise) · function — used by [js/render/engine.js](../../render/engine.js.md)
- [`dirFbm`](#s-dirFbm) · function — used by [js/render/engine.js](../../render/engine.js.md)
- [`OUTCOME`](#s-OUTCOME) · const — used by [js/sim/sim.js](../../sim/sim.js.md)
- [`outcomeOf`](#s-outcomeOf) · function — used by [js/sim/sim.js](../../sim/sim.js.md)
- [`isCataclysmic`](#s-isCataclysmic) · function — used by [js/sim/sim.js](../../sim/sim.js.md)
- [`PHASES`](#s-PHASES) · const — **no importer in scanned roots**
- [`eventDuration`](#s-eventDuration) · function — used by [js/sim/sim.js](../../sim/sim.js.md)
- [`cataclysmState`](#s-cataclysmState) · function — used by [js/sim/sim.js](../../sim/sim.js.md)
- [`SN_PHASES`](#s-SN_PHASES) · const — **no importer in scanned roots**
- [`supernovaDuration`](#s-supernovaDuration) · function — used by [js/sim/sim.js](../../sim/sim.js.md)
- [`supernovaState`](#s-supernovaState) · function — used by [js/sim/sim.js](../../sim/sim.js.md)
- [`rocheLimit`](#s-rocheLimit) · function — **no importer in scanned roots**
- [`ringPlan`](#s-ringPlan) · function — used by [js/sim/sim.js](../../sim/sim.js.md)
- [`relaxCraters`](#s-relaxCraters) · function — used by [js/sim/sim.js](../../sim/sim.js.md)
- [`glowFalloff`](#s-glowFalloff) · function — **no importer in scanned roots**
- [`apparentGlow`](#s-apparentGlow) · function — used by [js/sim/sim.js](../../sim/sim.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-kelvinRGB"></a>`kelvinRGB(k)`

function · **exported** · L1–15

- calls: [`kelvinRGB>c`](#s-kelvinRGB-c) ×3
- called by: [`kelvinHex`](#s-kelvinHex)

<!-- note:kelvinRGB -->
---- blackbody ----------------------------------------------------------
A single temperature scalar drives every glow colour in the game, so a
cooling body walks blue-white → white → yellow → orange → red → dark for
free instead of hand-authored colour keys.

Kelvin → linear RGB (0..1). Helland's fit, clamped to a usable range.
<!-- /note -->

#### <a id="s-kelvinRGB-c"></a>`kelvinRGB>c(v)`

function · L13–13

- called by: [`kelvinRGB`](#s-kelvinRGB) ×3

<!-- note:kelvinRGB>c -->
<!-- /note -->

### <a id="s-kelvinHex"></a>`kelvinHex(k)`

function · **exported** · L17–20

- calls: [`kelvinRGB`](#s-kelvinRGB)
- called by: [`mountGame>stepEventFX`](../../render/engine.js.md#s-mountGame-stepEventFX) _js/render/engine.js_ · [`mountGame>tick`](../../render/engine.js.md#s-mountGame-tick) _js/render/engine.js_ · [`mountGame>updateDebris`](../../render/engine.js.md#s-mountGame-updateDebris) _js/render/engine.js_ · [`stepCataclysms`](../../sim/sim.js.md#s-stepCataclysms) _js/sim/sim.js_

<!-- note:kelvinHex -->
Kelvin → 0xRRGGBB, for three.js material colours.
<!-- /note -->

### <a id="s-hash3"></a>`hash3(seed, i, j, k)`

function · L22–30

- called by: [`dirNoise`](#s-dirNoise)

<!-- note:hash3 -->
---- smooth direction noise ---------------------------------------------
The old surface jag hashed each vertex independently, so neighbouring
vertices got uncorrelated values and every damaged world grew a coat of
spikes. This is lattice value noise on the direction vector with a
smoothstep blend: neighbouring directions get NEIGHBOURING values, so a
crater rim is rough, not hairy. Seam-safe because it is a function of the
unit normal only — duplicated UV-seam vertices sit at the same direction
and therefore get the same displacement.
<!-- /note -->

### <a id="s-smooth"></a>`smooth(t)`

function · L32–32

- called by: [`dirNoise`](#s-dirNoise) ×3

<!-- note:smooth -->
<!-- /note -->

### <a id="s-dirNoise"></a>`dirNoise(seed, nx, ny, nz, freq=)`

function · **exported** · L34–50

- calls: [`hash3`](#s-hash3) · [`smooth`](#s-smooth) ×3
- called by: [`mountGame>deformShatteredCore`](../../render/engine.js.md#s-mountGame-deformShatteredCore) _js/render/engine.js_ · [`mountGame>surfJag`](../../render/engine.js.md#s-mountGame-surfJag) _js/render/engine.js_ · [`dirFbm`](#s-dirFbm) ×2

<!-- note:dirNoise -->
Value noise in [-0.5, 0.5] over a direction, at `freq` cells per unit.
<!-- /note -->

### <a id="s-dirFbm"></a>`dirFbm(seed, nx, ny, nz, freq=)`

function · **exported** · L52–54

- calls: [`dirNoise`](#s-dirNoise) ×2
- called by: [`mountGame>deformShatteredCore`](../../render/engine.js.md#s-mountGame-deformShatteredCore) _js/render/engine.js_

<!-- note:dirFbm -->
Two octaves, still smooth — used for crater rims and shattered cores.
<!-- /note -->

### <a id="s-OUTCOME"></a>`OUTCOME`

const · **exported** · L56–62

<!-- note:OUTCOME -->
---- what a strike does --------------------------------------------------

- L57 · `SCAR: "scar",` — a mark, nothing structural
- L58 · `BASIN: "basin",` — a real crater, ejecta, a bruise on the limb
- L59 · `RESURFACE: "resurface",` — magma ocean, atmosphere stripped, the world glows
- L60 · `DISRUPT: "disrupt",` — partly torn away — a debris ring, a smaller world
- L61 · `SHATTER: "shatter",` — it stops being a world
<!-- /note -->

### <a id="s-outcomeOf"></a>`outcomeOf(sev, integrityLeft=)`

function · **exported** · L64–71

- called by: [`onImpact`](../../sim/sim.js.md#s-onImpact) _js/sim/sim.js_

<!-- note:outcomeOf -->
Severity (see impactSeverity) → what actually happens to the body.
<!-- /note -->

### <a id="s-isCataclysmic"></a>`isCataclysmic(outcome)`

function · **exported** · L73–75

- called by: [`onImpact`](../../sim/sim.js.md#s-onImpact) _js/sim/sim.js_

<!-- note:isCataclysmic -->
Outcomes at or past this point run the full staged cataclysm.
<!-- /note -->

### <a id="s-PHASES"></a>`PHASES`

const · **exported** · L77–84

<!-- note:PHASES -->
---- the staged event ----------------------------------------------------
Real timescales run from seconds to centuries. These are compressed, but
the ratios are kept: the flash is violent and brief, the glow lingers, the
settle is long and quiet. Durations scale a little with severity so a
world-ender takes visibly longer to finish than a bad afternoon.
<!-- /note -->

### <a id="s-eventDuration"></a>`eventDuration(sev=)`

function · **exported** · L86–89

- called by: [`startCataclysm`](../../sim/sim.js.md#s-startCataclysm) _js/sim/sim.js_ · [`cataclysmState`](#s-cataclysmState)

<!-- note:eventDuration -->
Total seconds an event of this severity runs for.
<!-- /note -->

### <a id="s-lerp"></a>`lerp(a, b, u)`

function · L91–91

- called by: [`cataclysmState`](#s-cataclysmState) · [`supernovaState`](#s-supernovaState) ×4

<!-- note:lerp -->
<!-- /note -->

### <a id="s-clamp01"></a>`clamp01(v)`

function · L92–92

- called by: [`cataclysmState`](#s-cataclysmState) ×6 · [`supernovaState`](#s-supernovaState) ×3

<!-- note:clamp01 -->
<!-- /note -->

### <a id="s-cataclysmState"></a>`cataclysmState(t, sev=)`

function · **exported** · L94–126

- calls: [`clamp01`](#s-clamp01) ×6 · [`eventDuration`](#s-eventDuration) · [`lerp`](#s-lerp)
- called by: [`stepCataclysms`](../../sim/sim.js.md#s-stepCataclysms) _js/sim/sim.js_

<!-- note:cataclysmState -->
The whole event as a function of elapsed seconds.

  phase     which stage it is in
  u         0..1 through that stage
  kelvin    the driving temperature — colour comes from this
  lum       0..1 apparent brightness (this is what lights the sky)
  shell     0..1 how far the blast shell has expanded
  settle    0..1 debris torus → flat equatorial ring
  molten    0..1 how liquid the surface is (craters slump while > 0)

- L112 · `const attack = clamp01(t / (0.18 * scale));` — Light curve: ease-out-expo attack over the contact phase, then an
  exponential decay with a long radioactive-looking tail.
- L121 · `const settle = 1 - Math.exp(-t / (240 * scale));` — the torus flattens long before it circularises — quick at first, then
  asymptotic, exactly the way collisional damping actually behaves
<!-- /note -->

### <a id="s-SN_PHASES"></a>`SN_PHASES`

const · **exported** · L128–134

<!-- note:SN_PHASES -->
---- supernova ----------------------------------------------------------
Shock breakout is a genuinely brief UV/X-ray transient; the optical light
curve rises over days, plateaus for ~100 while hydrogen recombination pins
the photosphere near 5,500 K, drops over ~30, then decays on the cobalt-56
tail for years. Compressed to a couple of minutes, with the shape intact.
<!-- /note -->

### <a id="s-supernovaDuration"></a>`supernovaDuration()`

function · **exported** · L136–138

- called by: [`goSupernova`](../../sim/sim.js.md#s-goSupernova) _js/sim/sim.js_ · [`supernovaState`](#s-supernovaState)

<!-- note:supernovaDuration -->
<!-- /note -->

### <a id="s-supernovaState"></a>`supernovaState(t)`

function · **exported** · L140–164

- calls: [`clamp01`](#s-clamp01) ×3 · [`lerp`](#s-lerp) ×4 · [`supernovaDuration`](#s-supernovaDuration)
- called by: [`stepCataclysms`](../../sim/sim.js.md#s-stepCataclysms) _js/sim/sim.js_

<!-- note:supernovaState -->
A supernova as a function of elapsed seconds.
  lum    0..1, breakout spike then plateau then tail
  shell  photosphere radius multiple (homologous — roughly linear in t)
  pulse  0..1, the shock pulses the renderer draws as expanding rings

- L161 · `const shell = t * 0.9;` — homologous expansion: constant velocity, so radius is linear in time
- L162 · `const pulse = (t * 0.55) % 1;` — successive shock pulses walk out of the photosphere
<!-- /note -->

### <a id="s-rocheLimit"></a>`rocheLimit(bodyRadius, densityRatio=)`

function · **exported** · L166–168

- called by: [`ringPlan`](#s-ringPlan)

<!-- note:rocheLimit -->
---- rings ---------------------------------------------------------------
Debris inside the Roche limit cannot clump: tides shear it faster than
self-gravity gathers it, so it stays a ring. Outside it, the same debris
accretes into moonlets. A big enough strike puts material on both sides of
that line and you get a ring AND a new moon out of one event.

Fluid Roche limit, in the same units as `bodyRadius`.
<!-- /note -->

### <a id="s-ringPlan"></a>`ringPlan(bodyRadius, sev, shattered=)`

function · **exported** · L170–178

- calls: [`rocheLimit`](#s-rocheLimit)
- called by: [`layRing`](../../sim/sim.js.md#s-layRing) _js/sim/sim.js_

<!-- note:ringPlan -->
What ring an event of this severity leaves around a body.
  inner/outer   radii (world units)
  count         debris chunks to place
  moonlets      how many clumps form outside the Roche limit
  tilt          initial torus inclination, radians — decays to the
                equatorial plane as `settle` runs to 1
<!-- /note -->

### <a id="s-relaxCraters"></a>`relaxCraters(body, dt, molten)`

function · **exported** · L180–195

- called by: [`stepCataclysms`](../../sim/sim.js.md#s-stepCataclysms) _js/sim/sim.js_

<!-- note:relaxCraters -->
---- crater relaxation ---------------------------------------------------
The bug this exists to kill: a world took a big hit, grew a bite out of its
limb, and kept it forever. A body hot enough to be resurfaced is a body
whose surface FLOWS — basins slump and widen, rims collapse, and what is
left after it cools is a shallow basin, not a spike. Small craters on a
cold world are untouched, which is correct: the Moon still has its.

Ease a body's craters toward their relaxed shape. Mutates in place.

- L183 · `const k = Math.pow(0.5, (dt * molten) / 40);` — how fast the surface flows — fully molten halves a rim in ~40 s
- L189 · `c.r = Math.min(body.radius * 0.62, c.r * (1 + (1 - k) * 0.5));` — a slumping basin widens as it fills
<!-- /note -->

### <a id="s-glowFalloff"></a>`glowFalloff(dist, ref)`

function · **exported** · L197–200

- called by: [`apparentGlow`](#s-apparentGlow)

<!-- note:glowFalloff -->
---- the sky glow bus ----------------------------------------------------
"You should be able to see things get a little brighter behind you." A live
event publishes a light source into sim.skyGlow; the renderer turns each
one into a real light (so hulls rim-light from the correct side even when
the source is off-screen), an exposure bump and a bloom pulse.

Inverse-square falloff normalised so `ref` distance reads as 1.
<!-- /note -->

### <a id="s-apparentGlow"></a>`apparentGlow(lum, radius, dist)`

function · **exported** · L202–204

- calls: [`glowFalloff`](#s-glowFalloff)
- called by: [`stepCataclysms`](../../sim/sim.js.md#s-stepCataclysms) _js/sim/sim.js_

<!-- note:apparentGlow -->
Apparent brightness of an event at the ship, 0..1.
`radius` is the emitting body's radius — a struck moon 2,000 u away is
nothing; a star going off at the same range is everything.
<!-- /note -->
