# js/render/warpfx.js

[index](../../../README.md) · 196 lines · 22 symbols · 1 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — what a warp run looks like from inside it.

The core already worked. `sim.warp` has run a real state machine for a long
time — idle → spool → run, a spool the reactor has to pay for, lane
blockers, hazards, dropouts that dump you at the crossing with damage and a
cooling core. What it did not have was a picture. Engaging a warp widened
the FOV to 92°, shook the camera, and moved the ship a very long way. The
most dramatic thing the ship can do looked like a fast zoom.

This is the picture. Three layers, each doing a different job:

  SHELL     the 5,200-star backdrop stretches into radial streaks along the
            axis you are travelling. It is what tells you the whole sky is
            moving, and because the shell is fixed and enormous the streaks
            swing correctly when you turn.
  TUNNEL    a close-in layer that exists only during a run: streaks in a
            cylinder around the flight axis, recycling as they pass. The
            shell says the sky is moving; this says how fast, because it is
            near enough to have parallax.
  WAKE      the same trick applied to NPC hulls under lane drive, so traffic
            crossing the system reads at a glance — and so the thing you
            cannot intercept looks like the thing you cannot intercept.

All three are `LineSegments` with additive blending and vertex colours: no
new material type, no shader, no texture, and one buffer update each. The
glow comes from postfx.js, which is why the streak colours run above 1.0 —
they are meant to be thresholded, and on a device that cannot afford the
bloom they simply read as bright lines, which is a perfectly good fallback.

Nothing here knows what a warp is. The engine hands it a strength and a
direction; everything else is geometry.

- L4 · `const SHELL_MIN = 0.004;` — a touch of smear even at a crawl, so spool has somewhere to go
- L6 · `const TUNNEL_N = 1100;` — streaks in the near layer at full tier
- L7 · `const TUNNEL_R = 260;` — radius of the cylinder they live in
- L8 · `const TUNNEL_LEN = 5200;` — how far ahead they are seeded
- L9 · `const TUNNEL_BEHIND = 90;` — and how far past the camera before they recycle
- L10 · `const TUNNEL_SPEED = 9000;` — units a second at full strength
- L11 · `const TUNNEL_STREAK = 900;` — length of one streak at full strength
- L13 · `const WAKE_MAX = 40;` — the most drive trails drawn at once
- L14 · `const WAKE_LEN = 0.55;` — trail length as a fraction of the hull's speed (seconds of travel)
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |

## Imported by

- [js/render/engine.js](engine.js.md) — `makeWarpFx`

## Exports

- [`makeWarpFx`](#s-makeWarpFx) · function — used by [js/render/engine.js](engine.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-SHELL_STREAK"></a>`SHELL_STREAK`

const · L3–3

<!-- note:SHELL_STREAK -->
---- shell ----------------------------------------------------------------

How far a star smears at full warp, as a fraction of the shell radius.
Larger than it sounds: the shell is 15,000,000 units out, so a streak has to
be a real slice of that to subtend any angle at all.
<!-- /note -->

### <a id="s-SHELL_MIN"></a>`SHELL_MIN`

const · L4–4

<!-- note:SHELL_MIN -->
<!-- /note -->

### <a id="s-TUNNEL_N"></a>`TUNNEL_N`

const · L6–6

<!-- note:TUNNEL_N -->
---- tunnel ---------------------------------------------------------------
<!-- /note -->

### <a id="s-TUNNEL_R"></a>`TUNNEL_R`

const · L7–7

<!-- note:TUNNEL_R -->
<!-- /note -->

### <a id="s-TUNNEL_LEN"></a>`TUNNEL_LEN`

const · L8–8

<!-- note:TUNNEL_LEN -->
<!-- /note -->

### <a id="s-TUNNEL_BEHIND"></a>`TUNNEL_BEHIND`

const · L9–9

<!-- note:TUNNEL_BEHIND -->
<!-- /note -->

### <a id="s-TUNNEL_SPEED"></a>`TUNNEL_SPEED`

const · L10–10

<!-- note:TUNNEL_SPEED -->
<!-- /note -->

### <a id="s-TUNNEL_STREAK"></a>`TUNNEL_STREAK`

const · L11–11

<!-- note:TUNNEL_STREAK -->
<!-- /note -->

### <a id="s-WAKE_MAX"></a>`WAKE_MAX`

const · L13–13

<!-- note:WAKE_MAX -->
---- wake -----------------------------------------------------------------
<!-- /note -->

### <a id="s-WAKE_LEN"></a>`WAKE_LEN`

const · L14–14

<!-- note:WAKE_LEN -->
<!-- /note -->

### <a id="s-WAKE_MIN"></a>`WAKE_MIN`

const · L15–15

<!-- note:WAKE_MIN -->
<!-- /note -->

### <a id="s-WAKE_MAX_LEN"></a>`WAKE_MAX_LEN`

const · L16–16

<!-- note:WAKE_MAX_LEN -->
<!-- /note -->

### <a id="s-_fwd"></a>`_fwd`

const · L18–18

<!-- note:_fwd -->
<!-- /note -->

### <a id="s-_head"></a>`_head`

const · L19–19

<!-- note:_head -->
<!-- /note -->

### <a id="s-lineSegments"></a>`lineSegments(count, opacity=)`

function · L21–41

- called by: [`makeWarpFx`](#s-makeWarpFx) ×3

<!-- note:lineSegments -->
<!-- /note -->

### <a id="s-makeWarpFx"></a>`makeWarpFx(scene, starPos, shellRadius)`

function · **exported** · L43–196

- calls: [`lineSegments`](#s-lineSegments) ×3 · [`makeWarpFx>seed`](#s-makeWarpFx-seed)
- called by: [`mountGame`](engine.js.md#s-mountGame) _js/render/engine.js_

<!-- note:makeWarpFx -->
Build the warp layers.

  scene        where to hang them
  starPos      the shell's own position buffer — the streaks reuse the exact
               stars that are already there, so the smear lines up with the
               backdrop instead of being a second, differently-placed sky
  shellRadius  STAR_SHELL

- L48 · `const tunnelGroup = new THREE.Group();` — the near layer lives in its own frame: placed on the camera and turned
  with it every frame, so its contents can be plain local coordinates and
  the whole thing is one matrix rather than 1,100 rotations
- L57 · `const tx = new Float32Array(TUNNEL_N);` — tunnel particle state, in the group's local frame. The camera looks down
  local −Z, so a streak ahead of you has negative z and walks toward +z.
- L71 · `const dir = new Float32Array(starCount * 3);` — the shell's own direction per star, normalised once
- L78 · `const stretch = new Float32Array(starCount);` — Length varies per star as well as brightness. Uniform-length streaks read
  as a wire-frame cone — a drawn thing — because nothing in a real field of
  light sources is that regular. The spread is what makes it look like
  depth rather than geometry.
- L88 · `bloom: 0,` — 0..1 — how much of the frame should bleed. Drives postfx.
<!-- /note -->

#### <a id="s-makeWarpFx-seed"></a>`makeWarpFx>seed(i, z)`

function · L61–68

- called by: [`makeWarpFx`](#s-makeWarpFx) · [`makeWarpFx.update`](#s-makeWarpFx-update)

<!-- note:makeWarpFx>seed -->
- L63 · `const r = TUNNEL_R * (0.25 + Math.pow(Math.random(), 0.6) * 0.95);` — biased outward: a uniform disc puts most streaks in the middle of the
  screen where they read as noise rather than motion
<!-- /note -->

#### <a id="s-makeWarpFx-flash"></a>`makeWarpFx.flash()`

prop · L89–89

<!-- note:makeWarpFx.flash -->
0..1 — a white-out, spent down by the engine each frame.
<!-- /note -->

#### <a id="s-makeWarpFx-kick"></a>`makeWarpFx.kick(v=)`

prop · L90–90

<!-- note:makeWarpFx.kick -->
Kick a flash: engaging and dropping out both earn one.
<!-- /note -->

#### <a id="s-makeWarpFx-update"></a>`makeWarpFx.update(dt, camera, strength, phase, budget=)`

prop · L92–153

- calls: [`makeWarpFx>seed`](#s-makeWarpFx-seed)

<!-- note:makeWarpFx.update -->
`strength` 0..1 is how deep into the run we are. `phase` is the core's
own state string, used only to notice the edges and fire a flash.
`budget` 0..1 scales the near layer for a device under load.

- L95 · `if (phase === "run") this.kick(1);` — entering and leaving the tunnel are both events worth seeing
- L103 · `const k = strength * strength;` — ---- shell ----
- L108 · `_head.setRGB(0.86 + k * 0.9, 0.93 + k * 0.85, 1.0 + k * 1.1);` — cool at rest, hot and blue-shifted down the throat of a run
- L113 · `const len = smear * stretch[i];` — the tail runs back along the direction of travel, not along the
  star's own bearing: that is what makes the smear radiate from the
  point you are flying at rather than from the middle of the screen
- L117 · `const along = dir[i3] * _fwd.x + dir[i3 + 1] * _fwd.y + dir[i3 + 2] * _fwd.z;` — A star dead ahead barely moves across the eye and a star abeam
  sweeps past fastest — so the smear is strongest on the beam and
  the throat you are flying into stays comparatively clear. Getting
  this backwards fills the middle of the screen with the brightest
  lines, which is the one place you are trying to look.
- L129 · `if (strength > 0.06) {` — ---- tunnel ----
- L145 · `const near = 1 - Math.min(1, Math.abs(tz[i]) / TUNNEL_LEN);` — fade in as they come out of the distance and out as they pass
<!-- /note -->

#### <a id="s-makeWarpFx-updateWakes"></a>`makeWarpFx.updateWakes(list, origin, near=)`

prop · L155–189

<!-- note:makeWarpFx.updateWakes -->
Drive wakes on NPC hulls. `list` is the roster, `origin` the floating
origin, `near` a cutoff. Only hulls with their drive lit get one, which
is the point: it is the readable difference between a hull you could
catch and one you could not.

- L173 · `_head.setRGB(1.5, 1.9, 2.6);` — hot at the hull, gone at the tail
- L178 · `for (let i = n; i < WAKE_MAX; i++) {` — park the unused ones on a point rather than resizing the buffer
<!-- /note -->

#### <a id="s-makeWarpFx-dispose"></a>`makeWarpFx.dispose()`

prop · L191–194

<!-- note:makeWarpFx.dispose -->
<!-- /note -->
