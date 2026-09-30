# js/stationgen/anim.js

[index](../../../README.md) · 160 lines · 7 symbols · 1 imports · 3 importers

## About

<!-- note:@file -->
Animation registry. collectInto(reg, root) indexes every marker the
builder wrote into userData; tick(reg, dt, t) drives them:

  spin     { axis, speed }                        rings, drums, radar bars, radomes
  gimbal   { amp, speed }                         dishes, turrets, solar yokes
  pulse    { speed, amp, phase }                  radiator glow, reactor throat
  door     { axis, base, amp, speed, phase }      bay door leaves drifting
  lamp     { mode, period, phase, base, color }   a single beacon mesh: steady | blink | double | strobe | pulse
  lamps    { items: [{ color, mode, period, phase, base }] }  the same, as one instanced batch (the builder's default)
  chase    { items, beads, inCol, outCol, speed } instanced lane beads: a runner per way,
                                                  inward on entry ways, outward on exit ways
  traffic  { way, phase, period, y } | { axis, amp, speed, phase }
                                                  shuttles running the ways; cranes on rails
  turret   { amp, speed, phase }                  gun mounts: traverse and elevate together
  drone    { x, y, z0, reach, r, period, phase }  drones: out of the tube, a sortie loop, back in
  shield   { phase, base }                        shield petals and the station shell: opacity breathes

---- brightness ----------------------------------------------------------

`tick` takes a LIGHT LEVEL `k` (0..1) that scales everything emissive:
gate lamps, roof floods, chase beads, lane strips, the mouth glow. The
engine drives it off range, so a port's lighting reads exactly as it did
when you are on the approach and is gone from a hundred kilometres out.

It exists because the old arrangement had three separate faults that all
pushed the same way, and the result was a wall of white dots readable from
four thousand kilometres:

  - lamp batches were baked at FULL brightness at build time and only
    animated inside 45 km, so past that every lamp sat pinned at 100 % and
    never blinked — brighter far away than close up;
  - chase beads carried no build-time colour at all, so until the animation
    first ran they rendered as raw `mats.bead`: pure white, `toneMapped:
    false`, the brightest value the renderer can produce;
  - and nothing anywhere attenuated any of it with distance.

`bake(reg)` fixes the first two by writing the dim state into the instance
colours as soon as the station is built, and `k` fixes the third.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |

## Imported by

- [js/render/engine.js](../render/engine.js.md) — `tick`
- [js/stationgen/generate.js](generate.js.md) — `newRegistry`, `collectInto`, `disposeAnim`, `bake`
- [js/stationgen/index.js](index.js.md) — `newRegistry`, `collectInto`, `tick`, `disposeAnim`, `bake`

## Exports

- [`newRegistry`](#s-newRegistry) · function — used by [js/stationgen/generate.js](generate.js.md), [js/stationgen/index.js](index.js.md)
- [`collectInto`](#s-collectInto) · function — used by [js/stationgen/generate.js](generate.js.md), [js/stationgen/index.js](index.js.md)
- [`bake`](#s-bake) · function — used by [js/stationgen/generate.js](generate.js.md), [js/stationgen/index.js](index.js.md)
- [`tick`](#s-tick) · function — used by [js/render/engine.js](../render/engine.js.md), [js/stationgen/index.js](index.js.md)
- [`disposeAnim`](#s-disposeAnim) · function — used by [js/stationgen/generate.js](generate.js.md), [js/stationgen/index.js](index.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-newRegistry"></a>`newRegistry()`

function · **exported** · L3–3

- called by: [`buildStation`](generate.js.md#s-buildStation) _js/stationgen/generate.js_

<!-- note:newRegistry -->
<!-- /note -->

### <a id="s-collectInto"></a>`collectInto(reg, root)`

function · **exported** · L5–34

- called by: [`buildStation`](generate.js.md#s-buildStation) _js/stationgen/generate.js_

<!-- note:collectInto -->
- L9 · `const seen = new Set();` — Every emissive material this station owns, with the brightness it was
  authored at. The builder makes a fresh material set per station, so
  scaling these dims one port without touching any other — which is what
  makes a range falloff possible at all. Deduped: one material is shared by
  many meshes of the same hull.
<!-- /note -->

### <a id="s-_c"></a>`_c`

const · L36–36

<!-- note:_c -->
<!-- /note -->

### <a id="s-bake"></a>`bake(reg)`

function · **exported** · L38–53

- called by: [`buildStation`](generate.js.md#s-buildStation) _js/stationgen/generate.js_

<!-- note:bake -->
Write the resting state of every instanced light into its instance colour.
Called once when a station is built, so a port that has never been close
enough to animate is dark rather than blazing.
<!-- /note -->

### <a id="s-lampK"></a>`lampK(l, t)`

function · L55–62

- called by: [`tick`](#s-tick) ×2

<!-- note:lampK -->
<!-- /note -->

### <a id="s-tick"></a>`tick(reg, dt, t, k=)`

function · **exported** · L63–156

- calls: [`lampK`](#s-lampK) ×2
- called by: [`mountGame>updateStations`](../render/engine.js.md#s-mountGame-updateStations) _js/render/engine.js_ ×2

<!-- note:tick -->
`k` is the light level, 0..1 — how brightly this station's own lighting
should read from where it is being looked at. At 0 the emissive work is
skipped entirely and every light is written black once, which is both the
correct picture and the cheap path for a port on the far side of the system.

- L65 · `if (!lit && reg.dark) return;` — already dark and staying dark: nothing to write
- L66 · `if (Math.abs(k - reg.level) > 0.004 || (!lit && !reg.dark)) {` — the authored brightness, scaled by range. Written once per level change
  rather than every frame, because a material write is not free and the
  level only moves when the camera does.
- L72 · `for (const im of reg.lampBatches) {` — write every instanced light out once, then stop: a port on the far side
  of the system costs nothing per frame
- L85 · `for (const o of reg.pulses) { const p = o.userData.pulse; if (o.material) o.material.emiss` — pulses and single lamps own their material outright (collectInto clones
  them), so these writes are the authority for those and carry `k` themselves
- L99 · `const r = Math.floor(run * n);` — runner index: outward on exit ways, inward on entry ways
- L118 · `if (u < 0.1) {` — launch: straight out of the tube
- L123 · `} else if (u < 0.9) {` — the sortie: a tilted loop out past the mouth
- L130 · `} else {` — recovery: back into the tube
- L145 · `const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;` — ease in, dwell inside, ease out — in the way's direction of flow
<!-- /note -->

### <a id="s-disposeAnim"></a>`disposeAnim(root)`

function · **exported** · L158–160

- called by: [`releaseStation`](generate.js.md#s-releaseStation) _js/stationgen/generate.js_

<!-- note:disposeAnim -->
Free the per-station clones the registry made.
<!-- /note -->
