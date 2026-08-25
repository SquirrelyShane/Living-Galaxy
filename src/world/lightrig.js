// Living Galaxy — the light rig.
//
// Every ship, station and hull used to carry its own `THREE.PointLight`, parented to its
// own group, because that is the obvious way to give a thing a glow. Sixty-seven NPCs, a
// dozen stations, the player's hull and a star came to **eighty point lights in the
// scene**, and three.js does not treat that as eighty cheap things.
//
// Two separate costs, and the second is the one that hurts:
//
//   1. **Per fragment.** `MeshStandardMaterial` compiles a loop over every point light in
//      the scene and runs it for every pixel of every lit surface. Eighty iterations per
//      fragment on a mid-range phone is not a rendering budget, it is a slideshow — and
//      seventy-nine of those iterations were contributing nothing visible, because the
//      emitter was ten thousand kilometres away with a 120-unit falloff radius.
//   2. **Per recompile.** The light count is baked into the shader program key. A pirate
//      dying, a hauler despawning, a patrol wing spawning — each changed the count, which
//      invalidated every material in the scene and recompiled them mid-firefight. That is
//      the hitch you cannot profile away, because it is not in the frame loop at all.
//
// The rig fixes both by inverting the ownership. Lights are no longer *owned* by the
// things that emit them. There is one pool of exactly `LIGHTS.pool` point lights, created
// at boot, added to the scene once and never removed. Emitters register as **data** —
// a host object, a colour, an intensity, a range — and each rendered frame the rig sorts
// them by distance to the camera and hands the pool to the nearest few.
//
// Because the pool never changes size, the shader never recompiles. Because unused slots
// sit at zero intensity rather than being removed, "no emitters nearby" is also free. And
// because selection is by distance to the *camera* rather than to the player, it stays
// correct in the chase view and in whatever external camera comes later.
//
// What this deliberately does not do: it does not try to be a light manager for the star.
// The system's primary is one light, it is always relevant, and it is left alone in
// `system.js` where it belongs.

import { LIGHTS } from '../core/config.js';
import { scene, camera } from './scene.js';

let pool = [];
const emitters = [];
let dirty = true;
let acc = 0;

/** Rank by squared distance — a sort key, never a displayed number, so no square root. */
const _cam = { x: 0, y: 0, z: 0 };

/**
 * Build the pool. Idempotent: calling it twice does not double the lights, because a
 * second boot (new game, restored save) must not change the count and recompile the
 * world's shaders.
 */
export function initLightRig() {
  if (pool.length) return pool.length;
  for (let i = 0; i < LIGHTS.pool; i++) {
    const l = new THREE.PointLight(0xffffff, 0, LIGHTS.range);
    l.userData.rigSlot = i;
    scene.add(l);
    pool.push(l);
  }
  return pool.length;
}

/**
 * Register a glow. `host` is the object the light follows — its world position is used
 * directly, which is exact for anything parented to the scene (every ship, hull and
 * station is) and close enough for anything nested, since a glow's offset is small
 * against its own falloff radius.
 *
 * Returns the emitter record so a caller can retune it later; most never need to.
 */
export function attachGlow(host, color, intensity = 0.5, distance = 120) {
  if (!host) return null;
  const e = { host, color, intensity, distance, d2: Infinity, slot: -1, seen: !!host.parent };
  emitters.push(e);
  dirty = true;
  return e;
}

/** Explicit removal. Rarely needed — see the pruning note in `updateLightRig`. */
<<<<<<< HEAD
function detachGlow(e) {
=======
export function detachGlow(e) {
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  const i = emitters.indexOf(e);
  if (i >= 0) { emitters.splice(i, 1); dirty = true; }
}

/** Drop every emitter belonging to a host. Used when a composite is torn down. */
<<<<<<< HEAD
function detachGlowsFor(host) {
=======
export function detachGlowsFor(host) {
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  for (let i = emitters.length - 1; i >= 0; i--) {
    if (emitters[i].host === host) { emitters.splice(i, 1); dirty = true; }
  }
}

/**
 * Assign the pool to the nearest emitters.
 *
 * Runs on a timer rather than every frame. Which few of eighty glows are nearest does not
 * change at 60 Hz — ships move metres per frame against falloff radii measured in
 * hundreds — and the sort is the only part of this file with any cost in it. At the
 * default 10 Hz the rig is invisible in a profile; the lights themselves still *track*
 * their hosts every frame, because a light lagging its ship by a tenth of a second is
 * visible immediately.
 *
 * Emitters whose host has left the scene are pruned here rather than at every despawn
 * site. There are eight places in the codebase that call `scene.remove()` on something
 * that might carry a glow, and requiring each of them to remember a matching detach is a
 * leak waiting to happen. `parent === null` is the same fact, checked in one place.
 */
export function updateLightRig(dt = 0) {
  if (!pool.length || !camera) return 0;

  acc += dt;
  const resort = dirty || acc >= LIGHTS.interval;

  if (resort) {
    acc = 0;
    dirty = false;

    _cam.x = camera.position.x; _cam.y = camera.position.y; _cam.z = camera.position.z;

    let live = 0;
    for (let i = 0; i < emitters.length; i++) {
      const e = emitters[i];
      const h = e.host;
      // Pruned: a host that was in the scene and is not any more. The `seen` latch matters
      // because a glow is registered by the builder, which runs *before* the caller adds
      // the finished group to the scene — without it every hull would prune itself in the
      // window between being built and being spawned.
      if (!h) { emitters.splice(i--, 1); continue; }
      if (h.parent) e.seen = true;
      else if (e.seen) { emitters.splice(i--, 1); continue; }
      // A light for something too small to draw is a light for something you cannot see.
      if (!h.visible || e.intensity <= 0) { e.d2 = Infinity; continue; }
      const dx = h.position.x - _cam.x, dy = h.position.y - _cam.y, dz = h.position.z - _cam.z;
      e.d2 = dx * dx + dy * dy + dz * dz;
      // Beyond its own falloff a point light contributes nothing but shader time.
      const reach = e.distance * LIGHTS.reach;
      if (e.d2 > reach * reach) e.d2 = Infinity; else live++;
    }

    // Partial selection: the pool is small (single digits) against the emitter count, so
    // repeatedly taking the minimum beats sorting the whole array, and allocates nothing.
    for (let i = 0; i < emitters.length; i++) emitters[i].slot = -1;
    const take = Math.min(pool.length, live);
    for (let s = 0; s < take; s++) {
      let best = -1, bestD = Infinity;
      for (let i = 0; i < emitters.length; i++) {
        const e = emitters[i];
        if (e.slot >= 0 || e.d2 >= bestD) continue;
        best = i; bestD = e.d2;
      }
      if (best < 0) break;
      emitters[best].slot = s;
    }

    // Retune the pool. Colour and range only change on reassignment, which is why this
    // sits inside the resort branch — writing a light's colour every frame dirties
    // uniforms that did not move.
    for (let s = 0; s < pool.length; s++) pool[s].intensity = 0;
    for (let i = 0; i < emitters.length; i++) {
      const e = emitters[i];
      if (e.slot < 0) continue;
      const l = pool[e.slot];
      l.color.setHex(e.color);
      l.distance = e.distance;
      l.intensity = e.intensity;
    }
  }

  // Track every frame, sort occasionally. Cheap: at most `pool.length` copies.
  let active = 0;
  for (let i = 0; i < emitters.length; i++) {
    const e = emitters[i];
    if (e.slot < 0) continue;
    pool[e.slot].position.copy(e.host.position);
    active++;
  }
  return active;
}

/** Reset for a new world. The pool survives; only the registrations go. */
<<<<<<< HEAD
function resetLightRig() {
=======
export function resetLightRig() {
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  emitters.length = 0;
  for (const l of pool) l.intensity = 0;
  dirty = true;
}

export const lightRigReport = () => ({
  pool: pool.length,
  emitters: emitters.length,
  active: emitters.reduce((n, e) => n + (e.slot >= 0 ? 1 : 0), 0),
  // What the shader actually compiles against — the pool plus anything outside the rig.
  scenePointLights: scene ? scene.children.filter(o => o.isPointLight || o.type === 'PointLight').length : 0
});

/** Test seam: the emitter table, read-only in spirit. */
export const rigEmitters = () => emitters;
