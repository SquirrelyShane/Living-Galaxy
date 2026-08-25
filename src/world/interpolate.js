// Living Galaxy — render interpolation.
//
// Slice 1 made the simulation run on a fixed 1/60 s step and computed `clock.alpha` — the
// fraction of a step left over when the frame is drawn — then never used it. This is the
// other half of that change, six slices later.
//
// The problem it solves is specific and easy to miss. On a 120 Hz screen the simulation
// only advances every *other* frame, so half the frames drawn were showing a position
// that was one full step stale. That reads as a subtle judder that no frame-rate counter
// will ever show you, because the frame rate is fine — it is the content that is not
// moving smoothly.
//
// The approach is to keep the previous step's transform for anything worth smoothing,
// and draw between the two. Deliberately *inter*polation, not extrapolation: guessing
// ahead means being wrong whenever something changes direction, and the visible artifact
// of a wrong guess (a ship snapping back) is far worse than a sixteenth of a second of
// lag nobody can perceive.

import { INTERP } from '../core/config.js';
import { clock } from '../core/clock.js';

const tracked = [];
const _a = new THREE.Vector3();

/**
 * Start smoothing an object. Safe to call twice — a second registration is ignored
 * rather than producing two entries fighting over the same transform.
 */
export function track(obj, opts = {}) {
  if (!obj || obj.__interp) return obj;
  obj.__interp = {
    prev: obj.position.clone(),
    next: obj.position.clone(),
    rot: !!opts.rotation,
    prevRot: opts.rotation ? obj.quaternion.clone() : null,
    nextRot: opts.rotation ? obj.quaternion.clone() : null,
    snap: opts.snap || INTERP.snapDistance
  };
  tracked.push(obj);
  return obj;
}

export function untrack(obj) {
  if (!obj || !obj.__interp) return;
  const i = tracked.indexOf(obj);
  if (i >= 0) tracked.splice(i, 1);
  obj.__interp = null;
}

/**
 * Called at the end of every fixed step, *before* rendering. Rolls the current transform
 * into `prev` and records the new one.
 *
 * A jump larger than `snap` is treated as a teleport rather than motion — a warp
 * drop-out or a respawn — and both ends are set to the new position. Smearing a pilot
 * across 30,000 km over a sixtieth of a second would be a spectacular bug.
 */
export function commitStep() {
  if (!INTERP.enabled) return;
  for (let i = 0; i < tracked.length; i++) {
    const o = tracked[i], s = o.__interp;
    if (!s) continue;
    const jumped = _a.copy(o.position).sub(s.next).lengthSq() > s.snap * s.snap;
    if (jumped) { s.prev.copy(o.position); s.next.copy(o.position); }
    else { s.prev.copy(s.next); s.next.copy(o.position); }
    if (s.rot) {
      s.prevRot.copy(s.nextRot);
      s.nextRot.copy(o.quaternion);
    }
  }
}

/**
 * Called once per rendered frame, after the steps and before `render()`. Writes the
 * blended transform into the live object; `restoreAfterRender()` puts the authoritative
 * one back so nothing downstream ever reads an interpolated position as truth.
 *
 * That restore is the important part. A physics system that reads a smoothed position
 * would integrate against a value that is deliberately wrong, and the error would
 * compound — the whole point of a fixed step is that the simulation is exact.
 */
export function applyInterpolation(alpha) {
  if (!INTERP.enabled) return;
  const t = Math.max(0, Math.min(INTERP.maxLead, alpha));
  for (let i = 0; i < tracked.length; i++) {
    const o = tracked[i], s = o.__interp;
    if (!s) continue;
    s.live = s.live || new THREE.Vector3();
    s.live.copy(o.position);
    o.position.lerpVectors(s.prev, s.next, t);
    if (s.rot) {
      s.liveRot = s.liveRot || o.quaternion.clone();
      s.liveRot.copy(o.quaternion);
      o.quaternion.copy(s.prevRot).slerp(s.nextRot, t);
    }
  }
}

export function restoreAfterRender() {
  if (!INTERP.enabled) return;
  for (let i = 0; i < tracked.length; i++) {
    const o = tracked[i], s = o.__interp;
    if (!s || !s.live) continue;
    o.position.copy(s.live);
    if (s.rot && s.liveRot) o.quaternion.copy(s.liveRot);
  }
}

export const trackedCount = () => tracked.length;

export function resetInterpolation() {
  for (const o of tracked) if (o) o.__interp = null;
  tracked.length = 0;
}

/** Drop anything that has left the world, so a long session does not leak entries. */
export function pruneInterpolation(isAlive) {
  for (let i = tracked.length - 1; i >= 0; i--) {
    if (!isAlive(tracked[i])) {
      tracked[i].__interp = null;
      tracked.splice(i, 1);
    }
  }
}
