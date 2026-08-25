// Living Galaxy — what the sensor can see, in one list, for everybody who draws it.
//
// ## Why this file exists
//
// There were two answers to "what is in range" and they disagreed.
//
// `ui/hud.js` built the contact list. `ui/navmap.js` plotted the chart. Both walked the
// same four collections, and both applied their own range rule while doing it — which is
// how the bug that prompted this file happened:
//
//   - the chart plotted every rock inside `S.stats.sensor` (4,200–5,200 units)
//   - the contact list capped rocks at a flat **900 units** — `Math.min(r2, 900*900)`
//
// So the chart showed forty rocks in scanner range and the list offered none of them. The
// pilot could see the field on the map, tap a rock there, and then find nothing to lock
// from the cockpit; the rocks themselves are 3–20 units across at a kilometre and change,
// so there was nothing on the canopy either. "The asteroids in the nav chart do not show
// up in game" is exactly that: they were rendering, they were simulating, and no interface
// in front of the pilot would admit they existed.
//
// The 900 was not arbitrary — it is roughly mining range times three, and as a *mining*
// filter it was reasonable. As the definition of what the sensor can see it was wrong, and
// nothing said which of the two it meant to be.
//
// The two range rules also differed for ships: the chart used `detectionRange()`, which
// scales with a hull's signature, and the list used raw sensor range. A laden hauler is a
// bigger return than a raider running quiet, and the chart was right about that. So the
// asymmetry is what this file keeps, and the contact list inherits it.
//
// ## The rule
//
// One walk, one range rule per class of thing, one sorted list. Both interfaces read it,
// and `ui/markers.js` — the canopy brackets — reads the same thing, so what you can see on
// the chart, what you can lock from the list and what is bracketed in front of you are by
// construction the same set.

import { S } from '../../core/state.js';
import { scanOrigin } from '../industry/scanner.js';
import { fieldContacts } from './fields.js';
import { lagrangeContacts } from './lagrange.js';
import { detectionRange, npcSignature } from '../combat/detection.js';
import { net } from '../platform/net.js';
import { ownerOfHull, OWN } from '../company/ownership.js';

/**
 * How many rocks the list will carry.
 *
 * A belt is 150–400 rocks in a band a couple of thousand units wide, and a hull sitting in
 * the middle of one has forty-odd inside sensor range. The cap is a *rendering* budget, not
 * a sensor rule: the nearest N are the ones any interface can usefully show, and the
 * telemetry pane's own count still reports the true total.
 */
export const ROCK_CAP = 48;

let cache = null, cacheT = -1;

/**
 * Everything in range, nearest first.
 *
 * Cached for one tenth of a second, because the HUD asks four times a second, the markers
 * ask once a rendered frame, and the chart asks eight times a second — three walks of every
 * rock in the system for one answer that has not changed between them.
 *
 * @param {boolean} [force] rebuild even if the cache is warm
 */
export function contacts(force) {
  if (!force && cache && S.time - cacheT < 0.1) return cache;
  cacheT = S.time;
  cache = build();
  return cache;
}

/** Drop the cache — after a jump, a load, or anything that replaces the world. */
export function resetContacts() { cache = null; cacheT = -1; }

function build() {
  const o = scanOrigin();
  const p = o.pos;
  const range = o.range;
  const r2 = range * range;
  const out = [];

  // Ships, against `detectionRange` rather than raw sensor range — see the header.
  for (const n of S.world.npcs) {
    const u = n.userData;
    if (u.hp <= 0 || (u.ambush && !u.triggered)) continue;      // lurkers stay dark
    const d2 = n.position.distanceToSquared(p);
    if (d2 > detectionRange(range, npcSignature(u)) ** 2) continue;
    // Who it flies for, resolved once here rather than three times downstream. The contact
    // list, the chart and the canopy brackets all draw ownership now, and each deriving it
    // separately is the same drift this file exists to prevent.
    const own = ownerOfHull(n);
    out.push({ obj: n, kind: 'ship', name: u.name, faction: u.faction, d: Math.sqrt(d2),
               own: own.kind, owner: own.label, mine: own.mine, ownColour: own.colour });
  }

  // Charted bodies are always listed, whatever the array reaches.
  //
  // This used to be range-gated like everything else, and v1.02.57 — which made sensor
  // range something you buy rather than something every hull has — turned that into a
  // problem: a bare hull reaches under two thousand units, and a station is tens of
  // thousands away, so the contact list went empty and stayed empty. Which is wrong on its
  // own terms. You do not *detect* a planet; it is on the chart, it has been on the chart
  // for four hundred years, and a sensor that cannot resolve a berth does not make the berth
  // unknown. The telemetry pane has claimed exactly this since it shipped ("Charted objects
  // are always listed. Traffic appears when the array can resolve it") and the contact list
  // simply did not agree with it.
  //
  // Traffic and rock stay gated, because those genuinely are detections.
  for (const b of S.world.bodies) {
    const d2 = b.position.distanceToSquared(p);
    out.push({ obj: b, kind: b.userData.kind, name: b.userData.name,
               faction: 'neutral', d: Math.sqrt(d2), charted: true });
  }

  for (const r of net.remotes.values()) {
    const d2 = r.group.position.distanceToSquared(p);
    if (d2 < r2) out.push({ obj: r.group, kind: 'pilot', name: '◈ ' + r.name,
                            faction: 'friendly', d: Math.sqrt(d2),
                            own: OWN.PILOT, owner: 'Pilot', mine: false,
                            ownColour: 'rgba(180,150,255,' });
  }

  // Rocks, at sensor range like everything else. Collected then trimmed rather than
  // trimmed while collecting, because "the nearest 48" is only the nearest 48 once the
  // walk is finished — a distance-ordered filter mid-walk keeps whichever 48 happened to
  // be early in the array.
  const rocks = [];
  for (const a of S.world.asteroids) {
    const d2 = a.position.distanceToSquared(p);
    if (d2 > r2) continue;
    rocks.push({ obj: a, kind: 'asteroid', name: a.name, faction: 'rock',
                 d: Math.sqrt(d2), ore: a.ore, spent: a.ore <= 0 });
  }
  rocks.sort((a, b) => a.d - b.d);
  // A worked-out rock is still a contact — it is a landmark, it is cover, and a pilot who
  // just mined it dry should not watch it vanish off the list — but it never displaces a
  // rock that still has ore, so a heavily worked field still offers somewhere to point at.
  const live = rocks.filter(r => !r.spent);
  const spent = rocks.filter(r => r.spent);
  for (const r of live.slice(0, ROCK_CAP)) out.push(r);
  for (const r of spent.slice(0, Math.max(0, ROCK_CAP - live.length))) out.push(r);

  // Named fields as whole-field contacts, so "the belt" is somewhere you can lock and warp
  // to even when no individual rock is resolved yet. Geometry lives in `fields.js`.
  for (const c of fieldContacts(p, range * 2.2)) {
    out.push({ obj: c.obj, kind: 'belt', name: c.name, faction: 'neutral', d: c.d,
               beltKey: c.field.key, beltMid: c.obj.userData.beltMid });
  }

  // Lagrange points are places, not bodies — derived, mesh-free, always charted.
  for (const c of lagrangeContacts(p, range * 2.2)) {
    out.push({ obj: c.obj, kind: 'lagrange', name: c.name, faction: 'neutral', d: c.d });
  }

  out.sort((a, b) => a.d - b.d);
  return out;
}

/** Hulls in range that belong to somebody — yours, a power's, another pilot's. */
export function ownedContacts() {
  return contacts().filter(c => (c.kind === 'ship' || c.kind === 'pilot') &&
                                c.own && c.own !== OWN.NONE);
}

/** The rocks in range that still have ore, nearest first. What a mining run wants. */
export function mineableContacts() {
  return contacts().filter(c => c.kind === 'asteroid' && !c.spent);
}

/**
 * The nearest rock with ore left in it, as a contact.
 *
 * Deliberately built on the shared list rather than on `nearestAsteroid()` in
 * `world/asteroids.js`: that function answers "which rock is closest", full stop, and will
 * happily hand back one the sensor cannot see. ARIA telling the pilot to fly to a rock that
 * is not on any of their instruments is the same class of disagreement this file exists to
 * end.
 */
export function nearestMineable() {
  return mineableContacts()[0] || null;
}
