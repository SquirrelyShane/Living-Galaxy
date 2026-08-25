# PATCH v1.01.96 — "Out of Sight"

The follow-on to v1.01.95, and it closes the item that patch had to leave open. Schema
stays **17**; no gameplay changes, no save format change.

---

## The blocker, and why it was a blocker

v1.01.95 flagged NPC culling as the next large render win and then declined to do it, for
a specific reason: `systems/fleet.js` already writes `ship.visible` to hide a hull parked
inside a station ring, and `world/lod.js` writes `ship.visible` to hide anything too small
on screen to draw. Both are right. Neither is wrong to want the field. But
`Object3D.visible` is one boolean, and one boolean cannot hold two reasons.

Whichever ran second won. In practice LOD runs every rendered frame and docking runs once,
so LOD won every time — meaning a miner docked at a station the player was flying past
would be **un**hidden the instant it came close enough to be worth drawing. A ship inside a
station, drawn, every frame, for as long as you were nearby.

Registering NPCs for LOD without fixing that would have shipped that bug to sixty-seven
hulls instead of the handful that dock. So this patch fixes the field first.

## Reasons, not a boolean

`src/world/visibility.js` is small and does one thing: it lets several systems hide the
same object independently, and shows the object only when nobody is hiding it.

```js
hide(ship, HIDE.dock);        // fleet: it is inside the ring
hide(ship, HIDE.lod, tiny);   // lod: it is a fraction of a pixel
// visible only when both agree
```

Reasons are bits — `dock`, `lod`, and `fx` reserved for the presentation layer — because
there will never be many and the mask lives on hot objects. The write to `.visible` is
guarded on change, since the LOD pass calls this for every registered object every frame
and assignment to a group's `visible` is not free in three.js.

The property that matters is compositional: adding a fourth reason later — a cloak, a
cutscene, an editor filter — costs one constant and requires no coordination with the
three that exist. That is the whole reason to build this rather than special-case docking
inside `lod.js`, which would have been six lines and would have had to be untangled again
by the next system with an opinion.

## The cull

With the field safe, NPCs register with LOD for culling only — no tessellation levels,
because a hull is a handful of small parts and swapping their detail would cost more
bookkeeping than it saves. The registered radius is `size × 1.6`, the length of the cone,
which is what actually subtends the screen.

Hulls spawn across orbital rings out to 30,000 km and the player is at one point on one of
them, so at any given moment a large fraction of the population is a fraction of a pixel
wide. Measured on seed 1337 from the player's own position, with and without the
registration and nothing else changed:

| | before | after |
|---|---|---|
| visible drawables | 332 | **286** |
| hulls drawn | 70 | **41** |
| hulls culled | 0 | **29** (41%) |
| LOD tracked | 47 | 117 |

Frustum culling already handled anything behind the camera, so this is specifically the
on-screen-but-subpixel set — the ships that were costing a draw call each to put four
pixels somewhere near the horizon.

## Registry hygiene

The LOD registry now prunes itself the way the light rig does: an object whose `parent` is
null has left the scene and is dropped on the next pass, with a `seen` latch so a body
registered by its builder is not pruned in the window before its caller adds it.

This is not tidiness. Hulls despawn from half a dozen call sites — combat, the world sim's
capture and merc paths, the population respawner — and not one of them called `unregister`,
because until this patch nothing but permanent celestial bodies was ever registered. A
registry that only shrinks when somebody remembers is a leak with a session-long fuse, and
`soak.mjs` would have caught it in an hour of game time and blamed something else.

`register()` is also idempotent now, so a body registered twice ticks once.

## The census was lying

`test/profile.mjs` reported "visible drawables" by reading each node's own `visible` flag.
That is wrong in exactly the case this patch creates: LOD hides a *group*, three.js stops
descending there, and the child meshes stay flagged visible while never being drawn. The
census would have reported no saving at all from the change that saves the most.

It now walks with inherited visibility, and takes its viewpoint from the player rather
than the origin — a view-dependent measurement read from inside the star is not a
measurement of anything.

---

## Files touched

| File | Change |
|---|---|
| `src/world/visibility.js` | **new** — bitmask visibility arbiter, `HIDE` reasons, `hide`/`show`/`hiddenBy` |
| `src/world/lod.js` | culls through the arbiter; self-pruning registry with a `seen` latch; `register()` idempotent |
| `src/entities/npcs.js` | hulls registered for cull-only LOD at spawn |
| `src/systems/fleet.js` | dock/undock hide through the arbiter instead of assigning `.visible` |
| `test/profile.mjs` | inherited-visibility census, viewpoint at the player, LOD and hull-cull breakdown |
| `test/render.mjs` | thirteen checks: reason composition, the docked-hull pairing, registry pruning, idempotent register |
| `package.json`, `README.md`, `CHANGELOG.md`, `src/core/version.js` | 1.01.96 |

## Verified

- `node test/all.mjs` — **41/41 suites, 3,261 checks, 0 failed** (48.6 s).
- The docked-hull case is pinned directly: hide a hull for `dock`, park the camera on top
  of it, run the LOD pass, assert it is still hidden and that the dock reason survived.
- The A/B in the table above was measured by commenting out the one `registerLod` call and
  re-running the profiler on the same seed — same world, same frame, one line different.
- Soak passes unchanged, which is the check that matters for the registry pruning.

## Not verified

**Still nothing rendered.** The 332 → 286 figure is a count of objects three.js would
descend into, not a measured draw-call count from a browser, and certainly not a frame
rate. Things to watch on the device:

- **Whether 0.0015 is the right cull threshold for hulls.** It was tuned for planets, where
  a body dropping out at a fraction of a pixel is invisible. A ship is smaller, brighter,
  and moving, and motion is exactly what the eye picks up at the edge of visibility — a
  hull popping out at 12,000 km may read as a glitch where a moon doing the same reads as
  nothing at all. If so, hulls want their own threshold rather than sharing `LOD.cull`.
- **Whether culled hulls should still show on the Contacts list and nav map.** They do, and
  that is deliberate — sensors are not eyesight. But it means a contact can be listed with
  nothing to see when you look at it, which is either correct or confusing depending on how
  far away it is.

Not attempted: the 165 individually-built `SphereGeometry` instances across planets and
moons, and the 48 per-beacon `SpriteMaterial`s. Both still stand, both still next, and the
sphere work is now unblocked in the sense that nothing else has a claim on the LOD level
arrays it has to touch.
