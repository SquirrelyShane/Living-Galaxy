// Living Galaxy — mining fields, heliocentric and planetary.
//
// A field has no single body to lock onto, so "warp to the belt" has always meant "warp to
// the nearest point on the belt's mid-orbit circle" — a synthetic target the drive can
// chase. That calculation existed in four places: `ui/hud.js` built it for the contact
// list, `ui/navmap.js` built it for the tap handler, `systems/tools.js` built it for ARIA,
// and `systems/targeting.js` rebuilt it every frame to keep the reticle honest. Four
// copies of one rule, all of them assuming the circle is centred on the star.
//
// v1.00.50 adds rings, which are centred on a planet that is itself moving. Rather than
// teach four files about parents, they all ask here. This is the same lesson as the target
// bug in v1.00.20: when two pieces of state are always meant to agree, make the write
// single.

import { S } from '../../core/state.js';

export const fields = () => S.world.belts || [];

/** A ring is a field held by a body; a belt is a field held by the star. */
export const isRing = f => !!(f && f.parentName);

export const fieldMid = f => f.inner + f.width * 0.5;

/** The body a ring hangs off, or null for a heliocentric belt. */
export function parentOf(f) {
  if (!isRing(f)) return null;
  return (S.world.bodies || []).find(b => b.userData && b.userData.name === f.parentName) || null;
}

const _c = { x: 0, y: 0, z: 0 };

/**
 * The nearest point of this field to `from`, as plain numbers.
 *
 * For a belt that is the point on the mid-orbit circle sharing the ship's bearing from the
 * star. For a ring it is the same construction about the parent instead — and the parent's
 * position is read live rather than cached, because a ring around Titanus is somewhere
 * different every minute and a stale centre means a waypoint in empty space.
 */
export function fieldPoint(f, from, out = { x: 0, y: 0, z: 0 }) {
  const parent = parentOf(f);
  const cx = parent ? parent.position.x : 0;
  const cy = parent ? parent.position.y : 0;
  const cz = parent ? parent.position.z : 0;
  const mid = fieldMid(f);
  const dx = from.x - cx, dz = from.z - cz;
  const ang = Math.atan2(dz, dx);
  out.x = cx + Math.cos(ang) * mid;
  out.y = cy;
  out.z = cz + Math.sin(ang) * mid;
  return out;
}

/** Distance from `from` to the nearest point of the field. */
export function fieldDistance(f, from) {
  fieldPoint(f, from, _c);
  return Math.hypot(_c.x - from.x, _c.y - from.y, _c.z - from.z);
}

/**
 * A synthetic target the warp drive, the reticle and the contact list can all hold.
 * `beltMid` survives on userData for the scan readout, which reports it as a mid-orbit;
 * for a ring that number is a radius from the planet, and the readout says which.
 */
export function fieldTarget(f, from) {
  fieldPoint(f, from, _c);
  return {
    position: new THREE.Vector3(_c.x, _c.y, _c.z),
    userData: { kind: 'belt', name: f.name, radius: 0, beltKey: f.key,
                beltMid: fieldMid(f), ringOf: f.parentName || null }
  };
}

/** Keep an existing synthetic target on the nearest point as the ship (and parent) move. */
export function refreshFieldTarget(obj, from) {
  const u = obj && obj.userData;
  if (!u || !u.beltKey) return false;
  const f = fields().find(x => x.key === u.beltKey);
  if (!f) return false;
  fieldPoint(f, from, _c);
  obj.position.set(_c.x, _c.y, _c.z);
  return true;
}

/** Every field with its current distance, nearest first. */
export function fieldContacts(from, maxDist = Infinity) {
  const out = [];
  for (const f of fields()) {
    const d = fieldDistance(f, from);
    if (d > maxDist) continue;
    out.push({ field: f, d, obj: fieldTarget(f, from), name: f.name, kind: 'belt' });
  }
  return out.sort((a, b) => a.d - b.d);
}
