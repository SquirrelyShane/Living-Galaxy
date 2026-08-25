// Living Galaxy — player guns & missiles. Every weapon slot on the fit cycles on its
// own cooldown, so a three-mount military hull genuinely puts out more than a
// single-mount civilian one. Damage past the first barrel falls off (config:
// MULTI_GUN_FALLOFF) so stacking mounts is strong, not degenerate.
//
// Aim: fires down the nose, with a lead solution when a lock is close to centre.
// Missiles seek the locked ship and leave a smoke trail.

import { S } from '../../core/state.js';
import { forward } from '../../core/utils.js';
import { mountScale } from '../industry/fitting.js';
import { fire, deployDecoy } from './projectiles.js';
import { rangeScale } from './damage.js';
import { sfx } from '../platform/audio.js';
import { status } from '../../core/notify.js';
import { sendFire } from '../platform/net.js';
import { canFire, canFireMount, announce } from '../platform/preflight.js';
import { HEAT, ORDNANCE } from '../../core/config.js';
import { chambered, drawRounds, feedOf } from './magazine.js';
import { dtypeOf, isAP, yieldOf } from './ordnance.js';
import { firingSlots, activeLabel } from './groups.js';
import { WEAPON_MODULES } from '../../data/weapons.js';
import { wearShot, weaponEffect } from './wear.js';

const _dir = new THREE.Vector3();
const _aim = new THREE.Vector3();
const _muzzle = new THREE.Vector3();
const ASSIST_COS = Math.cos(0.14);   // ~8 deg cone

// Per-mount cooldown clocks. Rebuilt whenever the mount count changes.
let cd = [];

function mountCooldowns() { return cd; }

/**
 * Heat radiates whether or not the trigger is down, so this runs before the firing gate
 * rather than inside it. The cutout has hysteresis and the direction matters: the guns
 * stop at `cutout` and stay stopped until heat falls to `resume`, which is lower. Equal
 * thresholds would chatter the trigger on and off every frame at the boundary.
 */
function updateHeat(dt) {
  const p = S.player, cap = S.stats.heatCap || HEAT.capFloor;
  const vent = (S.stats.heatVent || HEAT.ventRate) * cap;
  p.heat = Math.max(0, Math.min(cap, (p.heat || 0) - vent * dt));
  const frac = p.heat / cap;
  // Only the *clearing* half of the latch lives here. Setting it here as well looked
  // right and could never fire: heat is clamped at capacity when it is added, so the
  // stored value never exceeds the cutout, and this function vents before it looks — so
  // by the time the test ran, heat was always a fraction under the line. The latch goes
  // down where the heat is actually generated, in the firing loop below.
  if (p.overheat && frac <= HEAT.resume) {
    p.overheat = false;
    status('Emitters cooled — weapons online');
  }
}

export const heatFraction = () => (S.player.heat || 0) / (S.stats && S.stats.heatCap ? S.stats.heatCap : HEAT.capFloor);

export function updateWeapons(dt) {
  const p = S.player, st = S.stats;
  updateHeat(dt);
  // The fit is the armament. There is no fallback to a hull's nominal weapon any more:
  // an empty hardpoint is an empty hardpoint, and preflight says so out loud rather than
  // letting the ship shoot something it is not carrying.
  // Cooldown clocks are keyed by *hardpoint*, not by position in the volley. A pilot who
  // switches from group I to group II mid-fight must not find their guns re-armed by the
  // switch — the barrel that just fired is still hot whether or not it is in the group
  // currently under the trigger.
  const bay = (S.fit && S.fit.weapon) || [];
  if (cd.length !== bay.length) cd = new Array(bay.length).fill(-99);

  if (!S.input.firing) return;

  // One gate, asked once per frame. Everything that can stop a trigger — no weapon, no
  // lock for a launcher-only fit, flat batteries, docked, disabled, in warp — comes back
  // with a code and a sentence, and the sentence is rate-limited inside announce().
  const clear = canFire();
  if (!clear.ok) { announce(clear); return; }

  // Aim solution is shared across mounts — computed once per frame, not per barrel.
  forward(p.yaw, p.pitch, _dir);
  const t = S.target;
  let leadReady = false;
  if (t && t.kind === 'ship') {
    _aim.copy(t.obj.position).sub(p.position);
    const dist = _aim.length();
    if (dist > 1) { _aim.divideScalar(dist); leadReady = _aim.dot(_dir) > ASSIST_COS; }
  }

  let fired = 0, heavy = false, missileShot = false, starved = false, dry = false;

  // Only the hardpoints in the group currently selected. Falloff is then measured by
  // position *within this volley* — see systems/groups.js for why that is the right index.
  const volley = firingSlots(S.fit);
  for (let n = 0; n < volley.length; n++) {
    const i = volley[n];
    const w = WEAPON_MODULES[bay[i]];
    if (!w) continue;
    if (S.time - cd[i] < w.cooldown) continue;
    const mountOk = canFireMount(w);
    if (!mountOk.ok) {
      if (mountOk.code === 'energy') starved = true;
      if (mountOk.code === 'noammo') dry = true;
      continue;
    }

    // Utility mounts are not guns, but they are not nothing either. The decoy buoy
    // drops behind the ship and pulls seekers off you — the one answer a pilot has to
    // an incoming torpedo other than outrunning it.
    if (w.kind === 'utility') {
      if (w.name && w.name.indexOf('Decoy') === 0) {
        _muzzle.copy(p.position).addScaledVector(_dir, -18);
        deployDecoy(_muzzle, p.velocity);
        p.energy -= w.energy;
        cd[i] = S.time;
        fired++;
        status('Decoy away');
      }
      continue;
    }

    // per-mount direction: lead the lock when the shot can plausibly connect
    const dir = _dir.clone();
    if (t && t.kind === 'ship' && (leadReady || w.kind === 'missile')) {
      const tof = p.position.distanceTo(t.obj.position) / w.speed;
      const v = t.obj.userData.vel;
      _aim.copy(t.obj.position);
      if (v) _aim.addScaledVector(v, tof);
      _aim.sub(p.position).normalize();
      dir.copy(_aim);
    }

    // stagger muzzles slightly so parallel mounts read as separate barrels
    const spread = (n - (volley.length - 1) / 2) * 3.5;
    _muzzle.copy(p.position).addScaledVector(dir, 12);
    _muzzle.x += Math.cos(p.yaw) * spread;
    _muzzle.z -= Math.sin(p.yaw) * spread;

    // ── the round ──────────────────────────────────────────────────
    // A projectile or missile mount fires whatever is chambered in its feed. An energy
    // weapon has no feed and gets `null`, which is the branch that keeps a laser from
    // ever being stranded: the split between "costs you the bank" and "costs you cargo,
    // credits and forethought" is the whole trade.
    const feed = feedOf(w);
    const round = feed ? chambered(feed) : null;
    const dtype = round ? dtypeOf(round) : w.dtype;
    let ammoMult = 1;
    if (round) {
      ammoMult = Math.max(ORDNANCE.minYield, yieldOf(round));
      if (isAP(round)) ammoMult *= ORDNANCE.apYield;
    }

    const opts = w.kind === 'missile'
      // The lock is captured at launch. Switching targets afterwards no longer drags
      // rounds already in the air onto the new ship.
      ? { kind: 'missile', track: w.track || 1.5, ttl: w.life || 4.5,
          dtype, seek: t.obj, pierce: round && isAP(round) ? ORDNANCE.apPenetration : 0 }
      : { ttl: w.life || 1.2, dtype,
          pierce: round && isAP(round) ? ORDNANCE.apPenetration : 0 };

    // Range falloff is judged at the muzzle against the lock, not per-frame in flight:
    // a round is as good as the shot you took, and a target that runs after you pull
    // the trigger does not make the slug you already fired weaker.
    const reach = t ? p.position.distanceTo(t.obj.position) : 0;
    // v1.01.70: and by how worn this particular barrel is. Condition is per hardpoint, so a
    // pilot who has been leaning on group I all session finds group I hitting softer while
    // the untouched rack beside it does not.
    const power = w.damage * st.weaponMult * mountScale(n) * ammoMult
                  * weaponEffect(i) * (t ? rangeScale(w, reach) : 1);

    fire(_muzzle, dir, w.speed, power, 'player', w.color, opts);
    sendFire(_muzzle, dir, w.speed, w.color);

    if (feed) drawRounds(feed, ORDNANCE.roundsPerShot[feed] || 1);

    p.energy -= w.energy;
    p.expend += w.energy / Math.max(w.cooldown, 0.05);
    // Energy weapons dump their draw straight into the emitter; a projectile weapon's
    // heat is mostly the barrel, so the two terms are added rather than chosen between.
    const cap = st.heatCap || HEAT.capFloor;
    const hot = (p.heat || 0) + w.energy * HEAT.perEnergy + w.damage * HEAT.perDamage;
    p.heat = Math.min(cap, hot);
    if (!p.overheat && hot >= cap * HEAT.cutout) {
      p.overheat = true;
      status('Weapons offline — thermal cutout');
      sfx.deny();
    }
    cd[i] = S.time;
    // Wear is filed after the shot is away and against this hardpoint only. Heat multiplies
    // it inside wearShot(), which is why it is called here rather than before the heat above
    // is added: the round that pushed the rack to the cutout should be charged at the cutout.
    wearShot(i);
    fired++;
    if (w.kind === 'missile') missileShot = true;
    else if (w.damage > 15) heavy = true;
  }

  if (fired) {
    p.lastShot = S.time;
    if (missileShot) sfx.missile();
    else if (heavy) sfx.fireHeavy();
    else sfx.fire();
  } else if (dry) {
    announce({ ok: false, code: 'noammo', reason: 'Magazine empty — no compatible rounds aboard' });
  } else if (starved) {
    // A per-mount starve that the whole-ship check let through: one heavy barrel is
    // hungry while the light ones keep firing. Same door, same rate limit.
    announce({ ok: false, code: 'energy', reason: 'Insufficient energy for weapons' });
  }
}
