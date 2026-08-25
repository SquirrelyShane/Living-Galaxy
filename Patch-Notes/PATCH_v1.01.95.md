# PATCH v1.01.95 — "Light Discipline"

A performance slice, and the first one in this project that started from a measurement
rather than a suspicion. No gameplay changes, no new systems, no save format change —
schema stays **17**, and a v1.01.94 save loads untouched.

---

## Measuring first

The obvious way to optimise a game is to look at the simulation, find the loop that runs
sixty-seven times a frame and make it run faster. So the first thing built here was a way
to check whether that was even the problem.

`test/profile.mjs` boots the same headless world `soak.mjs` uses, runs the same frame in
the same order, and times each of twenty-three phases individually. It is a tool rather
than a suite — it asserts nothing and is not in `all.mjs`, because a timing threshold that
fails on a busy CI box is a test that gets ignored within a week.

The answer it gave, before any change:

```
0.245 ms/frame across 22 phases — 1.5% of a 16.7 ms budget
npcs 21% · hud 20% · asteroids 18% · projectiles 9%
```

The simulation is not the problem and has not been for some time. A quarter of a
millisecond is a rounding error against a sixteen-millisecond budget, and the parts of it
that look expensive are expensive in the way a rounding error is.

So the profiler grew a second half — a **scene census**, which counts the things that
actually decide a frame on a phone: how many objects get drawn, how many distinct
materials and vertex buffers the GPU has to hold, and how many lights every lit shader
compiles a loop over. That is measurable headlessly even with no renderer, because it is a
property of the scene graph rather than of the drawing.

```
631 nodes · 424 drawables · 340 materials · 376 geometries
point lights: 80
```

Eighty.

## Why eighty point lights is not eighty small costs

Every ship, station and hull carried its own `THREE.PointLight`, parented to its own group,
because that is the obvious way to make a thing glow. Sixty-seven NPCs, eleven stations,
the player's hull and the system primary came to eighty.

Two costs, and the second is the one that hurt:

**Per fragment.** `MeshStandardMaterial` compiles a loop over every point light in the
scene and runs it for every pixel of every lit surface. Eighty iterations per fragment on a
mid-range phone is not a budget, it is a slideshow — and seventy-nine of those iterations
contributed nothing visible, because the emitter was ten thousand kilometres away with a
120-unit falloff radius. The light was off; the shader still paid for it.

**Per recompile.** The light count is baked into the shader program key. A pirate dying, a
hauler despawning, a patrol wing respawning — each moved the count, which invalidated every
lit material in the scene and rebuilt them. That is the stutter you cannot find in a frame
profile, because it does not happen in the frame loop. It happens between frames, in the
driver, and every profiler in the world reports it as "one slow frame, cause unknown".

## The rig

`src/world/lightrig.js` inverts the ownership. Lights are no longer owned by the things
that emit them.

There is one pool of exactly `LIGHTS.pool` point lights, created once at boot, added to the
scene and never removed. Emitters register as **data** — a host object, a colour, an
intensity, a range. Each frame the rig hands the pool to the nearest few emitters by
distance to the *camera*, not to the player, so it stays correct in chase view and in
whatever external camera comes later.

Because the pool never changes size, **the shader never recompiles**. Because unused slots
sit at zero intensity rather than being removed, "nothing nearby" is free too.

Three details worth naming:

- **Selection runs at 10 Hz; tracking runs every frame.** Which six of eighty glows are
  nearest does not change sixty times a second — ships move metres per frame against
  falloff radii measured in hundreds. But a light lagging its ship by a tenth of a second
  is visible immediately, so the positions still copy per frame. The sort is the only part
  of the file with any cost in it, and it now runs a sixth as often.
- **Selection is partial, not a sort.** The pool is single digits against eighty emitters,
  so taking the minimum six times beats sorting the array, and allocates nothing.
- **Dead emitters prune themselves.** There are eight places in the codebase that call
  `scene.remove()` on something that might carry a glow. Requiring each of them to remember
  a matching detach is a leak waiting to happen, so the rig checks `parent === null` in one
  place instead. A `seen` latch keeps it from pruning a hull in the window between being
  built and being spawned, which is a real window — the builder registers the glow before
  the caller adds the group to the scene.

`LIGHTS.pool` is **6**, and deliberately not tied to the quality level. Six is what is
plausibly on screen at once: the ship you are fighting, the two nearest to it, the station
you are approaching, and slack. Tying it to quality would mean a mid-flight quality drop
stalls on a shader rebuild — which is exactly the stutter the quality controller exists to
prevent. Lowering it to 3 or 4 is the first knob to reach for on a device that still
struggles; raising it is safe and costs fragment time.

## Assets that were identical and separate anyway

Two caches, both the same observation: a hull's shape and paint are properties of its
*type*, not of the individual.

- **`entities/npcs.js`.** Every pirate is the same cone at the same size in the same
  colour, but `buildMesh` minted fresh geometry and a fresh material per hull. Sixty-seven
  ships meant sixty-seven separate GPU uploads of pairwise identical data, sixty-seven
  uniform blocks, and no chance of the renderer batching any two of them. Cached per type
  key — one of each now. Safe because nothing in the codebase mutates an NPC's material:
  damage is a number, a target lock is a HUD overlay, and death removes the hull rather
  than recolouring it. If that ever changes, the ship that wants its own colour clones the
  material first; sharing is now the default, not an assumption, and this note is where a
  future reader finds out.
- **`world/system.js`.** Every reactor on every station is the same green metal, but a
  material was minted per fitted module and per station hull section. Cached by colour and
  finish. Geometry still varies with station size and stays per-module.

## What it bought

Same world, same seed, same frame:

| | before | after |
|---|---|---|
| point lights | **80** | **7** |
| materials | 340 | 186 |
| geometries | 376 | 290 |
| scene nodes | 631 | 566 |
| heap after 3,600 frames | 25.7 MB | 22.9 MB |
| rig cost | — | 0.0010 ms/frame |

The seven is the pool of six plus the system primary, which stays outside the rig on
purpose: the star is one light, it is always relevant, and managing it would be management
for its own sake.

None of these are frame-rate numbers, and this patch does not claim one. See *Not verified*.

## Test harness fidelity

`test/stub.mjs` gained three things the rig is the first code to need: `Object3D.parent`
tracked through `add`/`remove` (real three.js does, and "left the scene" is now a fact the
game reads), `traverse`, and lights with real `color` / `intensity` / `distance` fields
instead of bare `Object3D`s. Every one of these was a place where the stub was quietly
easier to satisfy than the real renderer.

---

## Files touched

| File | Change |
|---|---|
| `src/world/lightrig.js` | **new** — fixed-count point light pool, nearest-first assignment, self-pruning emitters |
| `src/core/config.js` | new `LIGHTS` block: pool size, reach, re-selection interval |
| `src/entities/npcs.js` | per-type geometry/material cache; engine glow via the rig |
| `src/world/system.js` | station hull + module material cache; station floodlight via the rig |
| `src/entities/shipmesh.js` | player and remote-pilot hull glow via the rig |
| `src/main.js` | `initLightRig()` at boot, `updateLightRig()` in the presentation phase, `LG.lights` |
| `test/profile.mjs` | **new** — per-phase frame timer and scene census |
| `test/render.mjs` | ten checks pinning the pool size, the emitter count, self-pruning and idempotent init |
| `test/stub.mjs` | `parent` tracking, `traverse`, real light objects |
| `package.json` | `npm run profile`; 1.01.95 |
| `README.md`, `CHANGELOG.md`, `src/core/version.js` | 1.01.95 |

## Verified

- `node test/all.mjs` — **41/41 suites, 3,248 checks, 0 failed** (57.5 s).
- `node test/profile.mjs` — census numbers in the table above, measured before and after on
  seed 1337 with the same 2,400-frame sample.
- The soak suite passes unchanged, which is the check that matters most here: the rig keeps
  a list, and a list that grows across two hours of game time would have shown up there.

## Not verified

**Nothing was rendered.** There is no browser in this loop and no frame-rate measurement on
a device. Every claim above is about the *shape* of the scene — object counts, material
counts, light counts — which is a strong proxy for GPU cost and is not a substitute for
measuring it. The specific things to check on the phone:

- **That the glows still look right.** The rig drops each emitter's local offset and lights
  from the host's own position — the engine glow that sat at `z = sz * 0.8` behind a hull
  now sits at the hull's origin. That should be imperceptible at any range where a 120-unit
  light contributes, but "should be" is doing work in that sentence.
- **That six is enough.** In a dense fight with a station in view, the seventh-nearest ship
  goes dark rather than dim. If that reads as a popping artefact rather than as distance,
  raise `LIGHTS.pool` or lower `LIGHTS.interval` so reassignment is less steppy.
- **That the recompile stutter is actually gone.** This is the largest claimed win and the
  one with no headless evidence at all. The observable is a hitch on NPC spawn or death
  that no longer happens.

Not attempted, and flagged so the reason survives: **NPC LOD registration**, which would
cull distant hulls from the draw entirely. `systems/fleet.js` already drives `ship.visible`
to hide docked hulls inside a station ring, and LOD would fight it — a docked miner near
the camera would be made visible again mid-dock. That needs a single owner for visibility
before either system can be trusted with it, and inventing one inside a performance slice
is how a performance slice becomes a bug.

Also left alone: 165 individually-built `SphereGeometry` instances across planets and moons
(a unit sphere plus a scaled mesh collapses these to three, but it touches the LOD level
arrays) and 48 per-beacon `SpriteMaterial`s. Both are real, both are next.
