/* LIVING GALAXY — collision avoidance.
 *
 * One solver, two customers. The autopilot flew straight lines at its target
 * and the flight assist trimmed drift, and neither of them ever looked at
 * what was in the way — so both would drive a hull into a rock or a station
 * at full throttle without so much as easing off.
 *
 * The hard part of avoidance in this game is not the geometry, it is knowing
 * when NOT to act. Mining means flying at a rock on purpose. Docking means
 * flying at a station on purpose. A system that cannot tell those from a
 * collision is worse than none, because the player loses the ability to do
 * the two things the game is mostly about. So the exemption list below is
 * the load-bearing part of this file, not the maths.
 *
 * ## What the belt taught us
 *
 * The first version treated every hazard the same, and a belt broke it three
 * separate ways at once:
 *
 *   1. Inside a belt there is ALWAYS a rock in the cone. With one 22-second
 *      horizon and a 2.4-radii pad, a 26 u pebble claimed an 86 u exclusion
 *      sphere and the solver never returned null. The hull braked, and a
 *      stopped hull has no velocity, so the solver returned null, so it threw
 *      the throttle open, so it found the pebble again. That oscillation is
 *      the "stuck in the rocks" report. Rocks now get their own short horizon
 *      and a tight pad, and only a mountain is allowed to trigger a full brake.
 *
 *   2. Once you are INSIDE an exclusion sphere the quadratic says tEnter = 0
 *      forever, which is a permanent level-3 alarm even while you are flying
 *      away from the thing. Parking near a moon or cutting a rock beside one
 *      deadlocked the autopilot outright. `approach()` now reports `inside`
 *      and `outward`, and leaving something is not a threat.
 *
 *   3. The dodge was recomputed from scratch five times a second, so the
 *      lateral axis wandered and the hull crabbed sideways forever instead of
 *      going round. A dodge is now COMMITTED: the same threat keeps the same
 *      escape axis until it is cleared or the commit times out.
 *
 *   threatTo(pos, vel, opts)   -> the thing you are about to hit, or null
 *   avoidAim(pos, vel, threat) -> a point to steer at instead
 *   avoidLevel(threat)         -> 0 nothing | 1 steer | 2 shed speed | 3 brake
 */

import { BODIES, bodyPosition, bodyVelocity, dist3 } from "./bodies.js";
import { nearbyRocks } from "./field.js";
import { stations } from "./stations.js";
import { remnantRadius } from "./scale.js";
import { holes, holeRadii } from "./holes.js";

export const AVOID = {
  horizon: 22,        // seconds ahead we care about, for things that are not rocks
  pad: 2.4,           // clear a hazard by this many of its radii
  surfacePad: 1.15,   // …except the world your port is tethered to, while you dock
  minPad: 60,         // and never by less than this, in world units
  brakeAt: 6,         // seconds to impact at which steering alone is not enough
  hardAt: 2.6,        // and at which we brake outright
  rockSpan: 1,        // how many belt cells out to look for rocks
  everyMs: 180,       // the solver runs at about 5 Hz, not per frame

  /* Rocks are their own country. A belt is a place you fly THROUGH — treating
   * gravel with the same margins as a moon is what deadlocked the hull. */
  rockHorizon: 5.5,   // seconds: a pebble you will pass in six seconds is not news
  rockPad: 1.2,       // rocks are small and irregular; a fifth of a radius is plenty
  rockMinPad: 34,     // plus a hull's width of slack
  rockHardR: 130,     // a rock this big or bigger may order a full brake
  rockHardAt: 1.15,   // …and only this close

  commitS: 5.5,       // how long a chosen escape axis is held before re-solving
  clearFactor: 1.25,  // aim this many exclusion radii clear of the hazard
  leadFactor: 0.9,    // …and this far PAST it, so a dodge goes round, not beside
};

const _p = { x: 0, y: 0, z: 0 };
const _bv = { x: 0, y: 0, z: 0 };
const _sv = { x: 0, y: 0, z: 0 };
const _hr = {};

/**
 * How this approach goes: when we come closest, how near that is, and — the
 * number that actually matters — when we cross into the sphere of radius
 * `clear` around it.
 *
 * Time to closest approach is the obvious measure and the wrong one. A gas
 * giant can be thirteen thousand units across; by the time its *centre* is
 * twenty seconds away the hull is long since inside it. What you want to
 * know is when you enter the exclusion sphere, which for a big body is far
 * earlier and for a rock is much the same thing.
 *
 * Being ALREADY inside is the case the first version got wrong. It reported
 * tEnter = 0, which reads as "impact now" and never stops reading that way,
 * so a hull parked beside a moon sat at full alarm forever. Inside, the only
 * question worth asking is whether we are on our way out.
 */
function approach(px, py, pz, vx, vy, vz, cx, cy, cz, clear) {
  const rx = px - cx, ry = py - cy, rz = pz - cz;
  const vv = vx * vx + vy * vy + vz * vz;
  if (vv < 1e-9) return { t: 0, tEnter: Infinity, miss: Math.hypot(rx, ry, rz), inside: false, outward: true };

  let t = -(rx * vx + ry * vy + rz * vz) / vv;
  if (t < 0) t = 0;
  const mx = px + vx * t - cx;
  const my = py + vy * t - cy;
  const mz = pz + vz * t - cz;
  const miss = Math.hypot(mx, my, mz);

  const b = rx * vx + ry * vy + rz * vz;   // > 0 means the range is opening
  const c = rx * rx + ry * ry + rz * rz - clear * clear;

  if (c < 0) {
    /* already inside the exclusion sphere. Flying outward is not a collision,
     * it is the recovery — say so, or the solver deadlocks on its own alarm. */
    const outward = b > 0;
    return { t: 0, tEnter: outward ? Infinity : 0, miss, inside: true, outward };
  }

  /* |p + v t - c| = clear, smaller root. No real root means we never get
   * inside it at all. */
  let tEnter = Infinity;
  const disc = b * b - vv * c;
  if (disc >= 0) {
    const root = (-b - Math.sqrt(disc)) / vv;
    if (root >= 0) tEnter = root;
  }
  return { t, tEnter, miss, inside: false, outward: b > 0 };
}

/**
 * What are we about to hit?
 *
 * `opts.exempt` is a Set of ids that are being approached deliberately — the
 * rock under the cutter, the station we filed a berth with, whatever the
 * player has locked. Those are never threats however close we get, which is
 * the difference between an avoidance system and an obstruction.
 *
 * `blind` is the watchdog's escape hatch: a Map of id → sim time until which a
 * hazard is deliberately not looked at, because refusing to look at it is the
 * only way past. Nothing fills it on its own — the autopilot writes to it only
 * after it has MEASURED that it is stuck, and both customers read the same map
 * so the flight assist does not keep flinching at what the autopilot has
 * already decided to fly past.
 */
export const blind = new Map();

export function threatTo(pos, vel, { exempt = null, surface = null, ignore = blind, time = 0, horizon = AVOID.horizon, includeRocks = true, minLevel = 0 } = {}) {
  const speed = Math.hypot(vel.x, vel.y, vel.z);
  /* A stopped hull used to see nothing at all, which is the worst possible
   * moment to go blind: a ship pressed nose-first against a rock by its own
   * thrust has no velocity, so there was no approach to solve and nothing ever
   * told it to back off. Standing still, the only question is what we are
   * already touching. */
  const reach = speed * horizon;
  let worst = null;

  /* `hv` is the hazard's own velocity. Worlds and ports move — a tethered port and
   * its world sweep round together at tens to hundreds of u/s — and solving the
   * approach off the hull's WORLD velocity against a frozen position reported a
   * hull holding station on a port as "2.5 s from the moon" forever, braking it
   * dead on the lane. Everything is solved in the hazard's frame. */
  const consider = (id, name, kind, cx, cy, cz, radius, hz, hv = null) => {
    if (exempt && exempt.has(id)) return;
    const vx = vel.x - (hv?.x ?? 0), vy = vel.y - (hv?.y ?? 0), vz = vel.z - (hv?.z ?? 0);
    const stopped = Math.hypot(vx, vy, vz) < 1;
    if (ignore && (ignore.get(id) ?? -Infinity) > time) return;
    const rock = kind === "rock";
    /* `surface`: a world the port you are docking at is tethered to. Its 2.4-radii
     * pad swallows a port parked at 2.2–5.6 radii, so the solver braked and dodged
     * the whole lane out from under the approach; for that world only the surface
     * itself (plus a margin) is a hazard. */
    const clear = rock
      ? Math.max(radius * AVOID.rockPad, radius + AVOID.rockMinPad)
      : surface && surface.has(id) ? radius * AVOID.surfacePad + AVOID.minPad
      : Math.max(radius * AVOID.pad, radius + AVOID.minPad);
    if (stopped) {
      const d = Math.hypot(pos.x - cx, pos.y - cy, pos.z - cz);
      if (d >= clear) return;
      const u = 2 + (clear - d) / clear;
      if (!worst || u > worst.urgency) {
        worst = { id, name, kind, x: cx, y: cy, z: cz, r: radius, clear, t: 0, tClosest: 0, miss: d, inside: true, outward: false, urgency: u, rv: { x: vx, y: vy, z: vz } };
      }
      return;
    }
    const a = approach(pos.x, pos.y, pos.z, vx, vy, vz, cx, cy, cz, clear);
    if (a.tEnter > hz) return;
    if (!a.inside && a.miss > clear) return;
    /* Urgency is how little time we have before we are inside it, weighted by
     * how squarely we are lined up — a graze at three seconds matters less
     * than a direct hit at eight. Being inside already outranks everything. */
    const squareness = 1 - Math.min(1, a.miss / clear);
    const urgency = a.inside ? 2 : (1 - a.tEnter / hz) * (0.45 + squareness * 0.55);
    if (!worst || urgency > worst.urgency) {
      worst = {
        id, name, kind, x: cx, y: cy, z: cz, r: radius, clear,
        t: a.tEnter, tClosest: a.t, miss: a.miss, inside: a.inside, outward: a.outward, urgency, rv: { x: vx, y: vy, z: vz },
      };
    }
  };

  /* Worlds. You will not out-turn one, so they get a wide berth. */
  for (const b of BODIES) {
    if (b.kind === "star") continue;
    const r = remnantRadius(b);
    bodyPosition(b.id, time, _p);
    bodyVelocity(b.id, time, _bv);
    const relReach = Math.hypot(vel.x - _bv.x, vel.y - _bv.y, vel.z - _bv.z) * horizon;
    if (dist3(_p, pos) > Math.max(reach, relReach) + r * 4) continue;
    consider(b.id, b.name, "body", _p.x, _p.y, _p.z, r, horizon, _bv);
  }

  /* Collapsed stars (js/holes.js). Treated as a world with its danger radius
   * for a surface — nine Schwarzschild radii, which the pad then more than
   * doubles — and never exempt: there is no docking with one. A transit moves,
   * so its position is where it is now; the solver re-runs at 5 Hz. */
  for (const h of holes) {
    const r = holeRadii(h, _hr).danger;
    if (dist3(h, pos) > reach + r * 4) continue;
    consider(h.id, h.name, "body", h.x, h.y, h.z, r, horizon);
  }

  /* Ports. The one thing players actually complain about ramming. */
  for (const st of stations) {
    if (!st || st.x === undefined) continue;     // stepStations writes x/y/z in place
    if (dist3(st, pos) > reach + (st.radius ?? 100) * 4) continue;
    _sv.x = st.vx ?? 0; _sv.y = st.vy ?? 0; _sv.z = st.vz ?? 0;
    consider(st.id, st.name, "station", st.x, st.y, st.z, st.radius ?? 100, horizon, _sv);
  }

  /* Rocks, but only when we are somewhere they exist — and on their own,
   * much shorter, horizon. A belt you are flying through is not a wall. */
  if (includeRocks) {
    const rockHz = Math.min(AVOID.rockHorizon, horizon);
    const rockReach = speed * rockHz;
    const rocks = nearbyRocks(pos, time, AVOID.rockSpan);
    for (const k of rocks) {
      if (dist3(k, pos) > rockReach + (k.r ?? 40) * 2 + AVOID.rockMinPad * 2) continue;
      consider(k.key ?? k.id ?? `rock:${k.x.toFixed(0)}:${k.z.toFixed(0)}`, "rock", "rock", k.x, k.y, k.z, k.r ?? 40, rockHz);
    }
  }

  if (worst && minLevel > 0 && avoidLevel(worst) < minLevel) return null;
  return worst;
}

/* ---- the committed dodge --------------------------------------------------
 * Re-deriving the escape axis on every solve let it wander with the geometry,
 * and a wandering axis means the hull crabs around the hazard without ever
 * getting past it. Once a dodge is chosen it is held: same threat, same way
 * round, until it clears or the commit ages out.
 */
const commit = { id: null, x: 0, y: 0, z: 0, at: -1e9 };

export function clearAvoidCommit() {
  commit.id = null;
  commit.at = -1e9;
}

/** For tests and the HUD: which way the current dodge is committed. */
export function avoidCommit() {
  return commit.id ? { id: commit.id, x: commit.x, y: commit.y, z: commit.z, at: commit.at } : null;
}

/**
 * Where to steer instead. Pushes the aim off the hazard perpendicular to the
 * approach — the shortest way out of the way — and then a little way PAST
 * it, so the manoeuvre is "go around" rather than "stand off to one side".
 *
 * If we are already inside the exclusion sphere the answer is different and
 * much simpler: straight out, the shortest way.
 */
export function avoidAim(pos, vel, threat, out = { x: 0, y: 0, z: 0 }, now = 0) {
  /* in the hazard's frame, the same frame threatTo solved it in */
  const vx = threat.rv?.x ?? vel.x, vy = threat.rv?.y ?? vel.y, vz = threat.rv?.z ?? vel.z;
  const sp = Math.hypot(vx, vy, vz) || 1;
  const fx = vx / sp, fy = vy / sp, fz = vz / sp;

  if (threat.inside) {
    /* Inside it. Radially out is both the shortest way clear and the only
     * direction that is guaranteed not to take us deeper. */
    const ox = pos.x - threat.x, oy = pos.y - threat.y, oz = pos.z - threat.z;
    const on = Math.hypot(ox, oy, oz) || 1;
    out.x = threat.x + (ox / on) * threat.clear * AVOID.clearFactor;
    out.y = threat.y + (oy / on) * threat.clear * AVOID.clearFactor;
    out.z = threat.z + (oz / on) * threat.clear * AVOID.clearFactor;
    return out;
  }

  let lx, ly, lz;
  const fresh = commit.id !== threat.id || now - commit.at > AVOID.commitS;
  if (!fresh) {
    lx = commit.x; ly = commit.y; lz = commit.z;
    /* keep it perpendicular to the CURRENT heading, or the aim slides into
     * the hazard as the geometry turns under us */
    const dot = lx * fx + ly * fy + lz * fz;
    lx -= fx * dot; ly -= fy * dot; lz -= fz * dot;
    const n = Math.hypot(lx, ly, lz);
    if (n < 1e-3) { commit.id = null; } else { lx /= n; ly /= n; lz /= n; }
  }

  if (commit.id !== threat.id || fresh) {
    /* The offset from the hazard's centre at closest approach: the direction
     * we are already missing it by, and the cheapest dodge there is. */
    const tc = threat.tClosest ?? threat.t;
    const rx = pos.x + fx * sp * tc - threat.x;
    const ry = pos.y + fy * sp * tc - threat.y;
    const rz = pos.z + fz * sp * tc - threat.z;
    const dot = rx * fx + ry * fy + rz * fz;
    lx = rx - fx * dot; ly = ry - fy * dot; lz = rz - fz * dot;
    let ln = Math.hypot(lx, ly, lz);
    if (ln < 1e-3) {
      /* Dead-on. Any perpendicular will do; pick one off the world's up axis
       * so the dodge is predictable rather than random. */
      lx = -fz; ly = 0; lz = fx;
      ln = Math.hypot(lx, ly, lz) || 1;
    }
    lx /= ln; ly /= ln; lz /= ln;
    commit.id = threat.id; commit.x = lx; commit.y = ly; commit.z = lz; commit.at = now;
  }

  /* Aim one safety margin out to the side AND a lead ahead: the point we want
   * is past the hazard's shoulder, not level with its middle. */
  const need = threat.clear * AVOID.clearFactor;
  const lead = threat.clear * AVOID.leadFactor;
  out.x = threat.x + lx * need + fx * lead;
  out.y = threat.y + ly * need + fy * lead;
  out.z = threat.z + lz * need + fz * lead;
  return out;
}

/**
 * How hard to react: 0 nothing, 1 steer, 2 steer and shed speed, 3 brake.
 *
 * A rock almost never earns a 3. Braking to a stop inside a belt is how the
 * hull got stuck: there is always another rock, and a stationary hull cannot
 * steer out of anything. Gravel gets steered around at speed; only a mountain
 * close aboard is worth stopping for.
 */
export function avoidLevel(threat) {
  if (!threat) return 0;
  if (threat.inside) return threat.outward ? 0 : 2;
  if (threat.kind === "rock") {
    if (threat.r >= AVOID.rockHardR && threat.t <= AVOID.rockHardAt) return 3;
    if (threat.t <= AVOID.rockHorizon * 0.5) return 2;
    return 1;
  }
  if (threat.t <= AVOID.hardAt) return 3;
  if (threat.t <= AVOID.brakeAt) return 2;
  return 1;
}

/**
 * The exemption set: everything we are approaching on purpose.
 *
 * Getting this wrong in either direction is worse than having no avoidance at
 * all — too loose and it rams, too tight and the player can never mine or
 * dock again.
 */
/** The worlds that only count by their surface right now (see `surface` in threatTo). */
export function surfaceOnly(sim) {
  return sim.dockPort?.hostId ? new Set([sim.dockPort.hostId]) : null;
}

export function deliberate(sim, mining) {
  const set = new Set();
  const ship = sim.ship;
  if (ship?.dockedAt) set.add(ship.dockedAt);
  if (sim.lock?.id) set.add(sim.lock.id);
  if (sim.selected) set.add(sim.selected);
  if (sim.dockRequestFor) set.add(sim.dockRequestFor);
  if (sim.tractor?.stationId) set.add(sim.tractor.stationId);
  if (sim.approach?.st?.id) set.add(sim.approach.st.id);
  if (sim.dockPort?.id) set.add(sim.dockPort.id);
  if (mining?.active && mining.key) set.add(mining.key);
  return set;
}
