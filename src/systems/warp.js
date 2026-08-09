// Living Galaxy — warp core. Spool, cruise, drop out. With a course set it flies itself.

import { S, totalMass } from '../core/state.js';
import { WARP } from '../core/config.js';
import { forward, aimAngles, damp, wrapPi, clamp, fmtKm } from '../core/utils.js';
import { toast, status } from '../ui/toast.js';
import { sfx } from './audio.js';
import { planRoute, routeLength, routeClear } from './navplan.js';
import { practice } from './character.js';
import { crewEvent } from './crew.js';
import { canWarp, announce } from './preflight.js';
import { intercept } from './ephemeris.js';
import { wearWarp } from './wear.js';

const _dir = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _obs = new THREE.Vector3();
const _perp = new THREE.Vector3();
const _way = new THREE.Vector3();

export function setCourse(obj, name) {
  const w = S.warp;
  const wasFlying = w.state === 'warping' && !!w.dest;
  w.dest = obj ? { obj, name } : null;
  w.avoid = null;
  w.avoidSide = null;
  w.path = null;
  w.replanT = 0;
  resetStall();
  if (!obj) return;
  // Retargeting mid-cruise no longer means dropping out and spooling again — the
  // bubble is already up, so the course simply changes under it.
  if (wasFlying) { status(`Course amended — ${name}`); toast(`Coming about for ${name}`); }
  else toast(`Course set — ${name}`);
}

export function clearCourse() {
  S.warp.dest = null; S.warp.avoid = null; S.warp.avoidSide = null; S.warp.path = null;
  resetStall();
}

function resetStall() {
  const w = S.warp;
  w.stallT = 0;
  w.stallBest = Infinity;
  w.stallCount = 0;
}

export function toggleWarp() {
  const w = S.warp, p = S.player;
  if (w.state === 'idle') {
    // Docked, disabled and flat batteries are all the same class of answer, so they come
    // from the same place. The gravity well stays here: it is a property of *where the
    // ship is*, which preflight deliberately does not know about.
    const clear = canWarp();
    if (!clear.ok) { toast(clear.reason); announce(clear); return; }
    const well = inGravityWell(p.position, w.dest && w.dest.obj);
    if (well) {
      toast(`Gravity well — ${well.userData.name} is holding the core unstable`);
      sfx.deny();
      return;
    }
    w.state = 'spooling'; w.charge = 0;
    status(w.dest ? `Spooling for ${w.dest.name}` : 'Spooling warp core');
    sfx.warpSpool();
  } else if (w.state === 'spooling' || w.state === 'warping') {
    dropOut('Warp disengaged');
  }
}

function dropOut(msg) {
  crewEvent('warp', 'helm');
  const w = S.warp, p = S.player;
  w.state = 'cooldown';
  w.timer = WARP.cooldown;
  const sp = p.velocity.length();
  const cap = S.stats.maxSpeed;
  if (sp > cap) p.velocity.multiplyScalar(cap / sp);
  status(msg);
  sfx.warpDrop();
}

/**
 * How far a body's gravity destabilises a warp signature lock.
 * Scales with mass but is capped relative to the body's own size, so a star can't
 * project a well that swallows its own inner planets.
 */
export function wellRadius(u) {
  const w = WARP.well;
  const r = u.radius || 1;
  // sqrt(gravity) x radius is a mass proxy: surface gravity is GM/r^2, so g x r^2 is GM,
  // and this is its square root. See the note on WARP.well for why reading `gravity`
  // alone was wrong.
  const m = Math.sqrt(u.gravity || 1) * r / w.refR;
  return clamp(w.scale * Math.pow(Math.max(m, 1e-6), w.exp) + r * w.size, w.min, w.max);
}

/**
 * How close a warp course actually gets. The core drops out at the destination's well
 * edge, or at `WARP.arriveRadius`, whichever is further — a pebble with a 45 km well is
 * still not something you materialise on top of.
 *
 * The planner reads this too (`planCourse` passes it into navplan), because a course
 * judged against a tighter arrival than the one the ship uses will route around bodies
 * the ship then drops out on anyway.
 */
export function arrivalRadius(u) {
  return Math.max(WARP.arriveRadius, u && u.gravity ? wellRadius(u) * WARP.arriveFactor : 0);
}

/** True if the ship currently sits inside any gravity well (warp can't hold). */
export function inGravityWell(pos, exclude) {
  for (const b of S.world.bodies) {
    const u = b.userData;
    if (u.kind !== 'planet' && u.kind !== 'star' && u.kind !== 'moon') continue;
    if (exclude && exclude === b) continue;
    if (pos.distanceTo(b.position) - u.radius < wellRadius(u)) return b;
  }
  return null;
}

export function updateWarp(dt) {
  const w = S.warp, p = S.player;
  if (w.state === 'idle') return;

  if (w.state === 'cooldown') {
    w.timer -= dt;
    w.charge = Math.max(0, w.charge - 45 * dt);
    if (w.timer <= 0) { w.state = 'idle'; w.charge = 0; status('Warp core cooled'); }
    return;
  }

  if (w.dest) align(dt);

  if (w.state === 'spooling') {
    w.charge = Math.min(100, w.charge + (100 / (WARP.spoolTime * (S.stats.warpSpool || 1))) * dt);
    p.energy -= WARP.drainSpool * dt;
    p.expend += WARP.drainSpool;

    // Incoming fire destabilises the signature lock. Running from a fight is still
    // possible — it just costs you charge for as long as they keep hitting you, so
    // whether you get away is a question of how hard they can shoot.
    if (S.time - p.lastHit < WARP.hitGrace && w.charge > 0) {
      w.charge = Math.max(0, w.charge - WARP.hitCharge * dt / Math.max(WARP.hitGrace, 1e-3));
      if (!w.hitWarnT || S.time - w.hitWarnT > 2) {
        w.hitWarnT = S.time;
        status('Signature lock destabilised — taking fire');
      }
    }

    if (p.energy <= 2) { p.energy = 0; dropOut('Spool aborted — energy exhausted'); return; }
    if (w.charge >= 100) { w.state = 'warping'; status(w.dest ? `Warping to ${w.dest.name}` : 'Warp engaged'); }
    return;
  }

  // cruising. The bubble has to enclose the whole ship, so a loaded hold is not free:
  // a hauler at twice its dry mass pays WARP.massDrain more per second, which is what
  // makes a long freight run a decision rather than a formality.
  const loadFactor = 1 + WARP.massDrain * Math.max(0, totalMass() / S.stats.dryMass - 1);
  // Fitted core modules finally pay into this — the item deferred out of slice 2, which
  // needed the fitting budget work in 0.7 before there was a sensible place to put it.
  // A tuned drive core makes a long crossing cheaper; an overloaded one makes it dearer.
  const coreEfficiency = 1 + (S.stats.warpDrain || 0);
  const drain = WARP.drainCruise * loadFactor * Math.max(0.35, coreEfficiency);
  p.energy -= drain * dt;
  p.expend += drain;
  // Cruise is the only warp state that wears the core. Spooling and cooling are the drive
  // being asked to do something; this is the drive doing it.
  wearWarp(dt);
  practice('navigation', dt * 1.4);
  if (p.energy <= 1) { p.energy = 0; dropOut('Warp collapsed — energy exhausted'); return; }

  forward(p.yaw, p.pitch, _fwd);
  p.velocity.copy(_fwd).multiplyScalar(S.stats.warpSpeed);

  if (w.dest) {
    const du = w.dest.obj.userData || {};
    const d = p.position.distanceTo(w.dest.obj.position) - (du.radius || 0);
    // a warp lock cannot survive inside the target's own well, so that edge IS arrival
    const arriveAt = arrivalRadius(du);
    if (d < arriveAt) {
      dropOut(`Arrived — ${w.dest.name}`);
      toast(`Arrived at ${w.dest.name}`);
      w.dest = null;
      return;
    }
  }

  // Gravity wells scale with the body's mass: a giant reaches far further than a
  // barren rock. Inside the well the core's signature lock goes unstable.
  const destU = w.dest && w.dest.obj.userData;
  const destEdge = destU ? wellRadius(destU) * WARP.arriveFactor : 0;
  for (const b of S.world.bodies) {
    const u = b.userData;
    if (u.kind !== 'planet' && u.kind !== 'star' && u.kind !== 'moon') continue;
    if (w.dest && w.dest.obj === b) continue;
    const well = wellRadius(u);
    // A body whose well overlaps the destination's arrival sphere cannot be avoided —
    // you cannot reach a planet without passing through its close moon's shadow. The
    // planner already declines to route around these (the goal is a sphere, not a
    // point); if the cruise still broke lock on them the two would disagree and the
    // ship would drop out, re-spool, and try the identical approach forever. It did:
    // one oblique run at Vulcan took three hops and fifty-six minutes.
    if (w.dest && b.position.distanceTo(w.dest.obj.position) - destEdge < well) continue;
    const d = p.position.distanceTo(b.position) - u.radius;
    if (d < well) {
      dropOut(`Warp lock lost — ${u.name} gravity well`);
      return;
    }
  }
}

// ── course planning ──────────────────────────────────────────────────
// The geometry lives in systems/navplan.js — a visibility graph over gravity wells,
// searched with A*. This file only supplies the well rule and the bookkeeping.

/** Intermediate waypoints from `from` to the destination. Empty means fly direct. */
export function planCourse(from, destObj) {
  return planRoute(from, destObj.position, S.world.bodies, wellRadius, destObj);
}

/** Straight-line vs planned distance, for the nav map's course readout. */
export function courseLength(from, destObj, path) {
  const wp = path || planCourse(from, destObj);
  return routeLength(from, wp, destObj.position);
}

/** Is a course still clear of every well? The stall detector asks before re-plotting. */
export function courseClear(from, destObj, path) {
  return routeClear(from, path || [], destObj.position, S.world.bodies, wellRadius, destObj);
}

function replan() {
  const w = S.warp;
  if (!w.dest) { w.path = null; return; }
  w.path = planCourse(S.player.position, w.dest.obj);
  w.replanT = 0;
}

/**
 * Progress watchdog. A planner can hand back a legal route that the ship still cannot
 * fly — a waypoint that drifts with its parent body, a well that closes behind you.
 * v0.2 had no way to notice: the ship would sit on a stalled course indefinitely.
 * Now, if the remaining distance stops falling, the route is thrown away and re-plotted;
 * after WARP.stallLimit attempts the course is abandoned and the pilot is told, because
 * pointing the nose manually always works and is better than a silent hang.
 */
function watchStall(dt) {
  const w = S.warp, p = S.player;
  const remaining = p.position.distanceTo(w.dest.obj.position);

  if (remaining < w.stallBest * (1 - WARP.stallProgress) || w.stallBest === Infinity) {
    w.stallBest = remaining;
    w.stallT = 0;
    return;
  }

  w.stallT = (w.stallT || 0) + dt;
  if (w.stallT < WARP.stallWindow) return;

  w.stallT = 0;
  w.stallCount = (w.stallCount || 0) + 1;
  if (w.stallCount > WARP.stallLimit) {
    const name = w.dest.name;
    clearCourse();
    status(`No course to ${name} — fly it manually`);
    toast(`Course to ${name} abandoned — point the nose and hold`);
    return;
  }
  // Nudge the plan off the geometry it got stuck in: re-plot from slightly ahead
  // of the ship, so the graph is built against a corridor the ship has already
  // committed to rather than the one it is sitting on the edge of.
  forward(p.yaw, p.pitch, _fwd);
  _way.copy(p.position).addScaledVector(_fwd, WARP.waypointRadius);
  w.path = planRoute(_way, w.dest.obj.position, S.world.bodies, wellRadius, w.dest.obj);
  w.replanT = 0;
  w.stallBest = remaining;
  status(`Re-plotting course — ${w.dest.name}`);
}

function align(dt) {
  const p = S.player, w = S.warp;

  // planets move and we drift, so re-plan on a slow cadence
  w.replanT = (w.replanT || 0) + dt;
  if (!w.path || w.replanT > WARP.replanInterval) replan();

  // retire waypoints as we reach them
  while (w.path && w.path.length && p.position.distanceTo(w.path[0]) < WARP.waypointRadius)
    w.path.shift();

  if (w.state === 'warping') watchStall(dt);
  if (!w.dest) return;                     // the watchdog may have given up

  // Aim at where the destination *will be*, not where it is. Chasing the current position
  // is a pursuit curve: it converges, but it converges along an arc trailing a body that
  // is moving at up to 0.45 units/s, which on a 30,000-unit crossing is a detour paid for
  // nothing. `intercept()` is analytic and falls back to the present position when the
  // body is not on an orbit, so the star and a derelict behave exactly as before.
  let aim = (w.path && w.path.length) ? w.path[0] : w.dest.obj.position;
  if (!(w.path && w.path.length)) {
    const ic = intercept(p.position, w.dest.obj, S.stats.warpSpeed);
    if (ic.converged) aim = ic.point;
  }
  _dir.set(aim.x - p.position.x, aim.y - p.position.y, aim.z - p.position.z).normalize();
  const a = aimAngles(_dir);
  p.yaw += wrapPi(a.yaw - p.yaw) * (1 - Math.exp(-WARP.alignRate * dt));
  p.pitch = damp(p.pitch, clamp(a.pitch, -1.4, 1.4), WARP.alignRate, dt);
  p.autoLevel = false;
}
