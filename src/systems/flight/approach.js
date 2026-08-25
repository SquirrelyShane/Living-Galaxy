// Living Galaxy — approach autopilot, orbit hold, station hail and tractor docking.
// One module because these are one flow: approach → hail → tractor → dock for stations,
// approach → orbit → scan for planets, approach → hold for everything else.

import { S } from '../../core/state.js';
import { APPROACH, TRACTOR, STAR, MINING, UNIT_M, WARP } from '../../core/config.js';
import { aimAngles, damp, wrapPi, clamp, fmtKm, $ } from '../../core/utils.js';
import { toast, status } from '../../core/notify.js';
import { sfx } from '../platform/audio.js';
import { dock } from '../trade/economy.js';
import { requestScreen } from '../../core/screens.js';

const _dir = new THREE.Vector3();
const _pad = new THREE.Vector3();
const _tv = new THREE.Vector3();
let hailStation = null;

const FLAVOR = {
  military:   n => `${n} control. Weapons cold and transponder green, pilot — approach corridor is hot for anything else.`,
  industrial: n => `${n} traffic desk here. Watch the slag barges on your way in; the tractor will take you past the smelters.`,
  logistics:  n => `${n} dispatch. You're slotted between two freight runs — hold still and the beam does the rest.`,
  economic:   n => `${n} concierge. Berthing is complimentary; everything after that has a price.`,
  civilian:   n => `${n} approach. Welcome, traveler — kill your thrust and we'll bring you onto the pad gently.`
};

export function holdDistance(t) {
  const u = t.obj.userData || {};
  // An explicit orbit band overrides the default standoff for this run.
  if (S.approach && S.approach.orbitR) return S.approach.orbitR;
  if (t.kind === 'station')
    return (u.radius || 30) * APPROACH.stationStandoff + APPROACH.hailMeters / UNIT_M;
  if (t.kind === 'planet' || t.kind === 'moon')
    return (u.radius || 40) * APPROACH.planetGravityMult;
  if (t.kind === 'star')
    return Math.max((u.radius || 320) * APPROACH.starMult, STAR.dangerRadius + 250);
  if (t.kind === 'asteroid')
    return MINING.range * APPROACH.asteroidHoldMult;
  return APPROACH.shipHold;
}

/**
 * Fly to a chosen orbit band around the locked body and hold there.
 * `mult` is a multiple of the body's own radius (see ORBIT_BANDS).
 */
export function startOrbit(mult, label) {
  const t = S.target;
  if (!t) { toast('Lock a body first'); sfx.deny(); return false; }
  if (t.kind !== 'planet' && t.kind !== 'moon' && t.kind !== 'star') {
    toast('Orbit insertion needs a celestial body'); sfx.deny(); return false;
  }
  if (!startApproach()) return false;
  const u = t.obj.userData || {};
  const floor = t.kind === 'star' ? STAR.dangerRadius + 250 : (u.radius || 40) * 1.5;
  S.approach.orbitR = Math.max(floor, (u.radius || 40) * mult);
  status(`${label || 'Orbit'} insertion — ${t.name}`);
  return true;
}

/**
 * Begin an approach on the current lock.
 *
 * @param {object} [opts]
 * @param {number} [opts.power] throttle ceiling for this run, 0..1. Omitted means
 *   `APPROACH.powerCap` — the ordinary quarter-throttle run. ARIA's mining run passes
 *   `APPROACH.crawlPower`, which is what "take us in slow" has to mean in a number.
 */
export function startApproach(opts) {
  const t = S.target;
  if (!t) { toast('Lock a target first'); sfx.deny(); return false; }
  if (S.docked) { toast('Undock first'); sfx.deny(); return false; }
  if (S.sim.disabled) { toast('Autopilot offline — ship disabled'); sfx.deny(); return false; }
  if (S.warp.state !== 'idle') { toast('Approach needs the warp core idle'); sfx.deny(); return false; }
  const o = opts || {};
  S.orbit = null;
  S.follow = null;
  S.approach = { active: true, prevAssist: S.settings.assist, obj: t.obj, prev: null,
                 stallT: 0, best: Infinity,
                 power: o.power ? clamp(o.power, 0.02, 1) : 0 };
  S.settings.assist = true;               // the autopilot flies assisted
  status(o.power
    ? `Approach — ${t.name} · ${Math.round(o.power * 100)}% power`
    : `Approach — ${t.name}`);
  sfx.ui();
  return true;
}

function cancelApproach(quiet) {
  if (S.approach && S.approach.active) {
    S.settings.assist = S.approach.prevAssist;
    S.approach = null;
    if (!quiet) status('Approach cancelled — manual control');
  }
}

function steer(dt, dir) {
  const p = S.player;
  const a = aimAngles(dir);
  p.yaw += wrapPi(a.yaw - p.yaw) * (1 - Math.exp(-APPROACH.steer * dt));
  p.pitch = damp(p.pitch, clamp(a.pitch, -1.3, 1.3), APPROACH.steer, dt);
  p.autoLevel = false;
}

export function updateApproach(dt) {
  const p = S.player;

  // ── tractor docking ──────────────────────────────────────────────
  if (S.docking) {
    // A hard yank on the stick or throttle aborts the pull — never trap the pilot.
    if (S.input.dragging || Math.abs(p.throttle) > 0.5) {
      const st0 = S.docking.station, u0 = st0.userData;
      const out = p.position.clone().sub(st0.position);
      if (out.lengthSq() < 1) out.set(0, 1, 0);
      out.normalize();
      p.position.copy(st0.position).addScaledVector(out, (u0.radius || 30) * 2.4 + 60);
      p.velocity.copy(out).multiplyScalar(S.stats.maxSpeed * 0.4);
      S.docking = null;
      S.dockCooldown = 6;
      status('Tractor released — manual control');
      sfx.deny();
      return;
    }
    const d = S.docking, st = d.station;
    d.t += dt;
    const k = clamp(d.t / TRACTOR.dur, 0, 1);
    const e = k * k * (3 - 2 * k);                       // smoothstep
    _pad.copy(st.position);
    _pad.y += (st.userData.radius || 30) * 0.95;         // pad on the spin axis — stable while it rotates
    p.position.lerpVectors(d.from, _pad, e);
    p.velocity.set(0, 0, 0);
    p.throttle = 0;
    if (d.t >= TRACTOR.dur) {
      S.docking = null;
      dock(st);
      // Through the port rather than by importing the panel. Docking is a thing that happens
      // in the world; the dock screen is what the interface does about it, and the simulation
      // does not need to know there is one. See `core/screens.js`.
      requestScreen('dock');
    }
    return;
  }

  // ── velocity match (station-keeping) ─────────────────────────────
  if (S.follow) {
    const f = S.follow, o = f.obj;
    const dead = o.userData && o.userData.hp !== undefined && o.userData.hp <= 0;
    if (dead) { S.follow = null; status('Match target lost'); }
    else if (Math.abs(p.throttle) > 0.08 || S.input.dragging || S.warp.state !== 'idle') {
      S.follow = null;
      status('Station-keeping off — manual control');
    } else {
      p.position.copy(o.position).add(f.offset);
      p.velocity.set(0, 0, 0);
    }
  }

  // ── orbit hold ───────────────────────────────────────────────────
  if (S.orbit) {
    const o = S.orbit, b = o.body;
    if (Math.abs(p.throttle) > 0.08 || S.warp.state !== 'idle') {
      S.orbit = null;
      status('Orbit broken — manual control');
    } else {
      o.angle += APPROACH.orbitOmega * dt;
      p.position.set(
        b.position.x + Math.cos(o.angle) * o.r,
        b.position.y + o.y,
        b.position.z + Math.sin(o.angle) * o.r
      );
      p.velocity.set(0, 0, 0);
    }
  }

  // ── approach flight ──────────────────────────────────────────────
  const ap = S.approach;
  if (!ap || !ap.active) return;
  const t = S.target;
  if (!t) { cancelApproach(); return; }
  if (S.input.dragging || S.warp.state !== 'idle') { cancelApproach(); return; }

  _dir.copy(t.obj.position).sub(p.position);
  const dist = _dir.length();
  if (dist > 1e-3) _dir.divideScalar(dist);
  steer(dt, _dir);

  // the target is moving — feed its radial velocity into the throttle solution,
  // so a receding station is chased and a closing one is braked for
  if (ap.obj !== t.obj) { ap.obj = t.obj; ap.prev = null; ap.lastGap = undefined; }
  let tAlong = 0;
  if (ap.prev) {
    _tv.copy(t.obj.position).sub(ap.prev).divideScalar(Math.max(dt, 1e-4));
    tAlong = _tv.dot(_dir);
  } else { ap.prev = new THREE.Vector3(); _tv.set(0, 0, 0); }
  ap.prev.copy(t.obj.position);

  const hold = holdDistance(t);
  const gap = dist - hold;

  // Two throttle rules learned the hard way:
  //  - cap closing speed near the hold point, because braking is drag, not thrust —
  //    a full-speed glide overshoots, and reverse can't recover (flight assist
  //    swings velocity back toward the nose, which points at the target)
  //  - judge arrival on how fast the gap is changing, not on ship speed — the
  //    target drags its own orbital velocity, so absolute speed never reads zero
  const vCap = Math.max(gap, 0) * 0.05 + 0.35;
  const want = clamp(Math.min(gap * APPROACH.speedGain, vCap) + tAlong,
                     -S.stats.maxSpeed * 0.3, S.stats.maxSpeed);
  // The throttle ceiling for this run. `APPROACH.powerCap` unless the caller asked for
  // something gentler — see `startApproach`. Reverse gets four fifths of it, because
  // backing off is trim rather than a manoeuvre.
  const cap = (ap.power || APPROACH.powerCap);
  p.throttle = clamp(want / S.stats.maxSpeed, -cap * 0.8, cap);

  const gapRate = ap.lastGap === undefined ? 99 : (gap - ap.lastGap) / Math.max(dt, 1e-4);
  ap.lastGap = gap;
  if (Math.abs(gap) < Math.max(hold * 0.05, 8) && Math.abs(gapRate) < 0.6) {
    arrive(t, dist);
    return;
  }

  // Progress watchdog. An autopilot that cannot close — because the target outruns the
  // hull, because a mercenary just disabled the drives, because the geometry is one the
  // solver cannot solve — used to simply keep flying and never say so. The pilot sat
  // watching a status line that never changed. Now it gives up out loud, and hands the
  // stick back, which is always better than a silent hang.
  const remaining = Math.abs(gap);
  const band = Math.max(hold * 0.05, 8);
  if (remaining < band * 4) {
    // Inside the arrival neighbourhood the gap is small and signed, so it naturally
    // wobbles around zero while the solver settles. Judging progress by percentage
    // there declares a stall on a ship that is seconds from arriving.
    ap.stallT = 0;
    ap.best = Math.min(ap.best, remaining);
  } else if (remaining < ap.best - 1e-3) {
    // Any closing at all counts. Demanding a percentage of the remaining distance per
    // window sounds stricter and is simply wrong: the first seconds of an approach are
    // spent accelerating at a quarter throttle, and a ship doing exactly what it should
    // covers almost nothing in that time. The question the watchdog exists to answer is
    // "is this ship getting closer or not", so that is the question it asks.
    ap.best = remaining;
    ap.stallT = 0;
  } else {
    ap.stallT = (ap.stallT || 0) + dt;
    if (ap.stallT > WARP.stallWindow * 2) {
      cancelApproach(true);
      p.throttle = 0;
      status(`Approach stalled — ${t.name} is not closing`);
      toast('Autopilot cannot close the gap — manual control');
      sfx.deny();
    }
  }
}

function arrive(t, dist) {
  const p = S.player;
  const orbitBand = S.approach && S.approach.orbitR ? Math.round(S.approach.orbitR) : null;
  cancelApproach(true);
  p.throttle = 0;
  if (t.kind === 'station') {
    S.follow = { obj: t.obj, offset: p.position.clone().sub(t.obj.position) };
    status(`Holding ${fmtKm(dist)} off ${t.name} — velocity matched`);
    openHail(t.obj);
  } else if (t.kind === 'planet' || t.kind === 'moon' || t.kind === 'star') {
    const off = p.position.clone().sub(t.obj.position);
    S.orbit = { body: t.obj, r: Math.max(1, Math.hypot(off.x, off.z)), y: off.y,
                angle: Math.atan2(off.z, off.x), band: orbitBand };
    p.velocity.set(0, 0, 0);
    status(`Stable orbit — ${t.name}`);
    toast(`Stable orbit around ${t.name} — scanners ready`);
    sfx.dock();
  } else {
    S.follow = { obj: t.obj, offset: p.position.clone().sub(t.obj.position) };
    status(`Holding off ${t.name} — velocity matched`);
    toast(`Holding off ${t.name} — mining and guns in range`);
  }
}

// ── station hail ───────────────────────────────────────────────────
//
// Arriving alongside a berth opens the *channel* now, not a flavour box with a docking
// button on it: clearance is a conversation with a scan in it, and it is the same
// conversation whether you got here by flying, by warping, or by asking for it off the warp
// menu. See `systems/npc/parley.js`.
//
// Through the screens port rather than an import, because this file is `systems/` and the
// panel is `ui/`. With nothing registered — headless, or a boot that has not reached the
// interface yet — it falls through to the old box, which still works.
export function openHail(station) {
  if (requestScreen('contact', station)) { hailStation = station; return; }
  hailStation = station;
  const u = station.userData;
  $('hail-name').textContent = u.name;
  $('hail-text').innerHTML =
    `<p class="hail-line">${(FLAVOR[u.category] || FLAVOR.civilian)(u.name)}</p>` +
    `<p class="hail-sub">Services: ${u.category} hub — trade, repair, refit, probe resupply.</p>`;
  $('hail-overlay').classList.remove('hidden');
  sfx.ui();
}

export function closeHail() {
  $('hail-overlay').classList.add('hidden');
  hailStation = null;
}

export const hailOpen = () => !!hailStation;

/**
 * Velocity match: ride along with the target. Everything in Solaris is on rails,
 * so station-keeping is exact — the ship holds its current offset while the
 * target orbits. Throttle, dragging the stick, or warp breaks it.
 */
export function matchTarget() {
  const t = S.target;
  if (!t) { toast('Lock a target first'); sfx.deny(); return false; }
  if (S.docked) { toast('Undock first'); sfx.deny(); return false; }
  if (S.sim.disabled) { toast('Autopilot offline — ship disabled'); sfx.deny(); return false; }
  cancelApproach(true);
  S.orbit = null;
  S.follow = { obj: t.obj, offset: S.player.position.clone().sub(t.obj.position) };
  S.player.velocity.set(0, 0, 0);
  S.player.throttle = 0;
  status(`Velocity matched — ${t.name}`);
  toast(`Riding with ${t.name} — throttle to break off`);
  sfx.ui();
  return true;
}

export function requestDocking(station) {
  const st = station || hailStation;
  if (!st) return;
  closeHail();
  S.orbit = null;
  S.follow = null;
  cancelApproach(true);
  S.docking = { station: st, t: 0, from: S.player.position.clone() };
  status(`Tractor lock — ${st.userData.name}`);
  toast('Tractor beam engaged — hands off the stick');
  sfx.warpSpool();
}

export function initHail() {
  $('hail-dock').addEventListener('click', () => requestDocking());
  const off = () => { closeHail(); status('Holding position'); };
  $('hail-break').addEventListener('click', off);
  $('hail-close').addEventListener('click', off);
}
