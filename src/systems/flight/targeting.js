// Living Galaxy — one lock at a time. Works for ships, rocks, stations and planets alike.

import { S } from '../../core/state.js';
import { camera } from '../../world/scene.js';
import { $ } from '../../core/utils.js';
import { sfx } from '../platform/audio.js';
import { setCourse, clearCourse } from './warp.js';
import { refreshFieldTarget } from './fields.js';
import { refreshLagrangeTarget } from './lagrange.js';

/**
 * Things you fly *to*, as opposed to things you shoot at.
 *
 * **Stated as an exception list, and that is the whole point.** This was a whitelist —
 * `['planet', 'moon', 'star', 'station', 'belt']` — and it never grew when new targetable
 * things arrived. By v1.02.52 you could select an asteroid, a Lagrange point, a brown dwarf,
 * a stellar remnant or a debris field, and every one of them left the *previous* course
 * standing in `S.warp.dest`.
 *
 * The symptom was flying to the wrong place with nothing on screen explaining why: select a
 * rock, hit warp, and the ship comes about and burns for whatever you had selected before —
 * often the star, because that is what a pilot targets early and never clears. Which is the
 * exact bug the comment on `setTarget()` below claims to have fixed. It fixed it for five
 * kinds and left the door open for every kind added afterwards.
 *
 * A whitelist of places has to be edited every time the world gains a new kind of place, and
 * forgetting is silent. A list of things that are *not* places does not: a ship is a lock and
 * a missile is a threat, and those categories are closed in a way "everywhere you can go" is
 * not. Anything the contacts list can show that is not on this list is somewhere you can fly.
 */
const NOT_A_PLACE = new Set(['ship', 'pilot', 'projectile', 'missile', 'decoy', 'seeker']);
const isDestination = kind => !!kind && !NOT_A_PLACE.has(kind);

const _v = new THREE.Vector3();
let reticle = null;

/**
 * Lock a target — and, if it is somewhere you could fly to, make it the warp course.
 *
 * This is the fix for a bug that was genuinely confusing to hit: the nav map's SET COURSE
 * wrote `S.warp.dest`, while picking a contact from the HUD list only wrote `S.target`.
 * Warp reads the *course*. So selecting a planet on the map, closing the map, picking a
 * different station from the contacts list and hitting warp flew you to the planet — the
 * thing you had stopped looking at several taps ago. Nothing on screen said why, because
 * the two selections lived in two different variables and only one of them was shown.
 *
 * They are one act now. Selecting a destination sets the course, from either interface,
 * so "what I have selected" and "where warp will take me" cannot disagree.
 *
 * Locking a *ship* deliberately does not touch the course. You do not warp to a ship, and
 * a pilot locking a pursuer mid-flight is doing it to shoot at them, not to cancel the
 * escape they are in the middle of.
 */
export function setTarget(obj, kind, name, faction) {
  if (!obj) return clearTarget();
  S.target = { obj, kind, name, faction: faction || 'neutral' };
  if (isDestination(kind)) setCourse(obj, name);
  sfx.ui();
}

export function clearTarget() {
  // Dropping the lock on a place drops the course with it — leaving a course behind for a
  // destination you have just deselected is the same stale-state bug in miniature.
  const t = S.target;
  if (t && isDestination(t.kind) && S.warp.dest && S.warp.dest.obj === t.obj) clearCourse();
  S.target = null;
  if (reticle) reticle.classList.add('hidden');
}

function targetPos(t = S.target) {
  return t ? t.obj.position : null;
}

function targetDistance() {
  return S.target ? S.player.position.distanceTo(S.target.obj.position) : Infinity;
}

/** Cycle: nearest hostile first, then friendlies, then rocks. */
export function cycleTarget() {
  const p = S.player.position;
  const range = S.stats.sensor;
  const pool = [];
  for (const n of S.world.npcs) {
    if (n.userData.hp <= 0 || (n.userData.ambush && !n.userData.triggered)) continue;
    const d = n.position.distanceTo(p);
    if (d < range) pool.push({ obj: n, kind: 'ship', name: n.userData.name, faction: n.userData.faction, d });
  }
  pool.sort((a, b) => (rank(a) - rank(b)) || (a.d - b.d));
  if (!pool.length) { clearTarget(); return null; }
  let idx = 0;
  if (S.target) {
    const cur = pool.findIndex(x => x.obj === S.target.obj);
    idx = (cur + 1) % pool.length;
  }
  const t = pool[idx];
  setTarget(t.obj, t.kind, t.name, t.faction);
  return t;
}

const rank = t => (t.faction === 'hostile' ? 0 : t.faction === 'friendly' ? 1 : 2);

/** Keeps the DOM reticle glued to the locked object; drops dead locks. */
export function updateTargeting() {
  if (!reticle) reticle = $('reticle');
  const t = S.target;
  if (!t) { if (reticle) reticle.classList.add('hidden'); return; }

  if (t.kind === 'ship' && (t.obj.userData.hp <= 0 || S.world.npcs.indexOf(t.obj) < 0)) {
    clearTarget();
    return;
  }

  // Keep a field waypoint on the nearest point of the field as the ship moves — and, for
  // a ring, as its planet moves too.
  if (t.kind === 'belt') refreshFieldTarget(t.obj, S.player.position);
  // A Lagrange point has no mesh either, and it moves with its planet.
  if (t.kind === 'lagrange') refreshLagrangeTarget(t.obj);

  const dist = S.player.position.distanceTo(t.obj.position);
  if (dist > S.stats.sensor * 1.6 && t.kind === 'ship') { clearTarget(); return; }

  _v.copy(t.obj.position).project(camera);
  if (_v.z > 1 || Math.abs(_v.x) > 1 || Math.abs(_v.y) > 1) {
    reticle.classList.add('hidden');
    return;
  }
  reticle.style.left = ((_v.x * 0.5 + 0.5) * innerWidth) + 'px';
  reticle.style.top = ((-_v.y * 0.5 + 0.5) * innerHeight) + 'px';
  reticle.className = t.faction === 'friendly' ? 'friendly' : t.kind === 'asteroid' ? 'rock' : '';
}
