# js/audio/ambience.js

[index](../../../README.md) · 140 lines · 21 symbols · 2 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — the ambient bed.

Zimmer's score works because it never stops. The events sit inside it
rather than on top of silence, and that continuity is most of what makes
a handful of organ notes feel like a place instead of a sound effect. So
this is the layer that matters: seven held voices, always running, whose
levels are the only thing that changes.

Nothing here restarts on a context change. A crossfade between two held
drones is a place changing; a stop and a start is a glitch, and the ear
catches the difference every time.

The bed is also where the game's state becomes audible without a HUD: the
drone rises as you fall into a gravity well, the hull wash tracks your
speed, the reactor hum tracks charge. None of that needs a number on
screen to be legible.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./graph.js` | `NOTE`, `degree`, `ensureAudio` | [js/audio/graph.js](graph.js.md) |
| 2 | `./voices.js` | `heldDrone`, `heldAir` | [js/audio/voices.js](voices.js.md) |

## Imported by

- [js/audio/index.js](index.js.md) — `startAmbience`, `stopAmbience`, `updateAmbience`, `ambience`, `PLACE_IDS`, `disposeAmbience`

## Exports

- [`PLACE_IDS`](#s-PLACE_IDS) · const — used by [js/audio/index.js](index.js.md)
- [`placeFor`](#s-placeFor) · function — **no importer in scanned roots**
- [`updateAmbience`](#s-updateAmbience) · function — used by [js/audio/index.js](index.js.md)
- [`startAmbience`](#s-startAmbience) · function — used by [js/audio/index.js](index.js.md)
- [`stopAmbience`](#s-stopAmbience) · function — used by [js/audio/index.js](index.js.md)
- [`disposeAmbience`](#s-disposeAmbience) · function — used by [js/audio/index.js](index.js.md)
- [`ambience`](#s-ambience) · const — used by [js/audio/index.js](index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-RATE"></a>`RATE`

const · L4–4

<!-- note:RATE -->
The bed's own slow clock, in seconds. Layers move on this, not on frames,
so the mix does not lurch when the renderer stutters.
<!-- /note -->

### <a id="s-layers"></a>`layers`

const · L6–6

<!-- note:layers -->
<!-- /note -->

### <a id="s-running"></a>`running`

const · L7–7

<!-- note:running -->
<!-- /note -->

### <a id="s-timer"></a>`timer`

const · L8–8

<!-- note:timer -->
<!-- /note -->

### <a id="s-ctxKind"></a>`ctxKind`

const · L9–9

<!-- note:ctxKind -->
<!-- /note -->

### <a id="s-target"></a>`target`

const · L10–10

<!-- note:target -->
<!-- /note -->

### <a id="s-lastBreath"></a>`lastBreath`

const · L11–11

<!-- note:lastBreath -->
<!-- /note -->

### <a id="s-breathAt"></a>`breathAt`

const · L12–12

<!-- note:breathAt -->
<!-- /note -->

### <a id="s-build"></a>`build()`

function · L14–28

- calls: [`degree`](graph.js.md#s-degree) _js/audio/graph.js_ ×2 · [`ensureAudio`](graph.js.md#s-ensureAudio) _js/audio/graph.js_ · [`heldAir`](voices.js.md#s-heldAir) _js/audio/voices.js_ ×3 · [`heldDrone`](voices.js.md#s-heldDrone) _js/audio/voices.js_ ×4
- called by: [`ambience.set`](#s-ambience-set) · [`startAmbience`](#s-startAmbience) · [`updateAmbience`](#s-updateAmbience)

<!-- note:build -->
Each layer is one held voice and a resting level. `to` is where the
current context wants it; the layer walks there over `ms`.

- L19 · `deep: heldDrone(NOTE.A0, { harmonics: [1, 2], gain: 0, cut: 220, space: 0.35 }),` — The floor. Present in every context, at different depths.
- L20 · `organ: heldDrone(NOTE.A1, { harmonics: [1, 2, 3, 5, 8], gain: 0, cut: 900, space: 0.75 }),` — The organ. This is the one that carries the mood.
- L21 · `fifth: heldDrone(degree(4, 1), { harmonics: [1, 2, 3], gain: 0, cut: 1400, space: 0.8 }),` — A fifth above, brought in where a place should feel open or unresolved.
- L22 · `hull: heldAir({ gain: 0, freq: 260, q: 0.6, space: 0.2 }),` — Hull wash — the air moving past, or through, depending on where you are.
- L23 · `room: heldAir({ gain: 0, freq: 900, q: 0.5, type: "lowpass", space: 0.15 }),` — Room tone: the close, boxed sound of being inside something.
- L24 · `plant: heldDrone(degree(2, 1), { harmonics: [1, 2, 4, 7], gain: 0, cut: 600, type: "triang` — Machinery — reactor, station plant, refinery floor.
- L25 · `void: heldAir({ gain: 0, freq: 3200, q: 0.8, space: 0.9 }),` — The high, thin one. Vacuum, distance, cold.
<!-- /note -->

### <a id="s-PLACES"></a>`PLACES`

const · L30–39

<!-- note:PLACES -->
---- the contexts -------------------------------------------------------
Where you are, as a set of levels. These are the whole design: everything
else in this file is machinery for getting between them smoothly.

- L31 · `menu:     { deep: 0.072, organ: 0.0612, fifth: 0.036, hull: 0.0, room: 0.0, plant: 0.0, vo` — The title screen. Wide, empty, one held chord.
- L32 · `cockpit:  { deep: 0.0702, organ: 0.0312, fifth: 0.0156, hull: 0.039, room: 0.0156, plant:` — In the seat, engines idle.
- L33 · `interior: { deep: 0.0518, organ: 0.0222, fifth: 0.0074, hull: 0.0, room: 0.0666, plant: 0.` — Inside the hull — the sky is gone, everything is close.
- L34 · `docked:   { deep: 0.0592, organ: 0.0259, fifth: 0.0148, hull: 0.0074, room: 0.0444, plant:` — Clamped to a port. Somebody else's machinery all around you.
- L35 · `belt:     { deep: 0.0546, organ: 0.0234, fifth: 0.0312, hull: 0.0312, room: 0.0, plant: 0.` — In the rocks. Sparse and high — the belt is not a comfortable place.
- L36 · `warp:     { deep: 0.144, organ: 0.054, fifth: 0.0432, hull: 0.0936, room: 0.0, plant: 0.01` — Warp. Everything pulls toward the floor.
- L37 · `combat:   { deep: 0.1258, organ: 0.0148, fifth: 0.0, hull: 0.0518, room: 0.0, plant: 0.029` — Somebody is shooting. Low, tight, no organ to hide behind.
- L38 · `well:     { deep: 0.1178, organ: 0.0496, fifth: 0.0434, hull: 0.0248, room: 0.0, plant: 0.` — Close to something enormous.
<!-- /note -->

### <a id="s-PLACE_IDS"></a>`PLACE_IDS`

const · **exported** · L41–41

<!-- note:PLACE_IDS -->
<!-- /note -->

### <a id="s-placeFor"></a>`placeFor(state=)`

function · **exported** · L43–52

- called by: [`updateAmbience`](#s-updateAmbience)

<!-- note:placeFor -->
---- reading the game ---------------------------------------------------
One function, so what the bed reacts to is written down in one place
rather than smeared across the engine.
<!-- /note -->

### <a id="s-updateAmbience"></a>`updateAmbience(state=, dt=)`

function · **exported** · L54–103

- calls: [`build`](#s-build) · [`placeFor`](#s-placeFor) · [`degree`](graph.js.md#s-degree) _js/audio/graph.js_ ×4
- called by: [`tickAudio`](index.js.md#s-tickAudio) _js/audio/index.js_

<!-- note:updateAmbience -->
Drive the bed. Safe to call every frame — the work is rate limited to
RATE and nothing is allocated per call.

  state = { phase, interior, docked, warp, combat, inBelt,
            wellDepth 0..1, speed u/s, throttle, charge 0..1, alarm 0..1 }

- L71 · `const speed = Math.max(0, Math.min(1, (state.speed ?? 0) / 260));` — Continuous modifiers on top of the place. This is where the bed stops
  being a set of rooms and starts being an instrument the game plays.
- L89 · `L.deep?.freq(NOTE.A0 * (1 - well * 0.22), 2200);` — The drone follows the well: falling toward something big pulls the whole
  bed down a fifth. It is the cheapest possible way to make mass audible,
  and on a phone speaker it is the part people actually feel.
- L94 · `lastBreath += step;` — Every so often, in the quiet places, let the organ breathe — move the
  fifth to a neighbour and back. Without it the bed becomes wallpaper
  inside about two minutes.
<!-- /note -->

### <a id="s-startAmbience"></a>`startAmbience()`

function · **exported** · L105–111

- calls: [`build`](#s-build)
- called by: [`ambience.set`](#s-ambience-set) · [`unlockAudio`](index.js.md#s-unlockAudio) _js/audio/index.js_

<!-- note:startAmbience -->
- L110 · `breathAt = RATE;` — settle on the first update rather than waiting
<!-- /note -->

### <a id="s-stopAmbience"></a>`stopAmbience(ms=)`

function · **exported** · L113–117

<!-- note:stopAmbience -->
<!-- /note -->

### <a id="s-disposeAmbience"></a>`disposeAmbience()`

function · **exported** · L119–125

<!-- note:disposeAmbience -->
Full teardown — only the audition lab and the tests need this.
<!-- /note -->

### <a id="s-ambience"></a>`ambience`

const · **exported** · L127–140

<!-- note:ambience -->
<!-- /note -->

#### <a id="s-ambience-running"></a>`ambience.running()`

prop · L128–128

<!-- note:ambience.running -->
<!-- /note -->

#### <a id="s-ambience-place"></a>`ambience.place()`

prop · L129–129

<!-- note:ambience.place -->
<!-- /note -->

#### <a id="s-ambience-set"></a>`ambience.set(place)`

prop · L130–138

- calls: [`build`](#s-build) · [`startAmbience`](#s-startAmbience)

<!-- note:ambience.set -->
Force a place, for the audition lab.
<!-- /note -->

#### <a id="s-ambience-levels"></a>`ambience.levels()`

prop · L139–139

<!-- note:ambience.levels -->
<!-- /note -->
