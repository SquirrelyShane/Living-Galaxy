// Living Galaxy — the ship you fly. Newtonian at heart, with an optional assist layer.

import { scene, camera } from '../world/scene.js';
import { S, totalMass, hullFactor } from '../core/state.js';
import { UNIT_M, G0, WORLD_RADIUS, MAX_PITCH, FLIGHT, STAR } from '../core/config.js';
import { clamp, damp, forward, aimAngles } from '../core/utils.js';
<<<<<<< HEAD
import { toast } from '../core/notify.js';
import { damagePlayer } from '../systems/combat/combat.js';
import { buildShip } from './shipmesh.js';
import { initParticles, plume } from '../world/particles.js';
import { throttleLocked } from '../systems/industry/habitat.js';
=======
import { toast } from '../ui/toast.js';
import { damagePlayer } from '../systems/combat.js';
import { buildShip } from './shipmesh.js';
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

const _fwd = new THREE.Vector3();
const _tmp = new THREE.Vector3();
const _back = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();
const _aim = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);

<<<<<<< HEAD
=======
const THRUSTER_COUNT = 120;
let thrusters, thrusterPos;
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
let lastStarWarn = -99;
let shipMesh = null, shipCls = '';

export function initPlayerFx() {
<<<<<<< HEAD
  // The private thruster buffer is gone — see `updateThrusters` and `world/particles.js`.
  initParticles(scene);
=======
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(THRUSTER_COUNT * 3), 3));
  thrusterPos = geo.attributes.position;
  thrusters = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0x44aaff, size: 5, transparent: true, opacity: 0.7,
    depthWrite: false, blending: THREE.AdditiveBlending, fog: false
  }));
  thrusters.frustumCulled = false;
  thrusters.visible = false;
  scene.add(thrusters);
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
}

export function updatePlayer(dt) {
  const p = S.player, st = S.stats;
  if (S.sim.disabled) p.throttle = 0;      // drives are dark
<<<<<<< HEAD
  // ...and so is a hull with its arrays out. Same shape as the disabled case on purpose:
  // both are "the drive is not available", and the flight model should not have to know
  // which of the two it is. See systems/industry/habitat.js.
  if (throttleLocked()) p.throttle = 0;
=======
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  const warping = S.warp.state === 'warping';

  if (p.autoLevel) {
    p.pitch = damp(p.pitch, 0, 7, dt);
    if (Math.abs(p.pitch) < 0.002) { p.pitch = 0; p.autoLevel = false; }
  }
  p.pitch = clamp(p.pitch, -MAX_PITCH, MAX_PITCH);
  forward(p.yaw, p.pitch, _fwd);

  const mass = totalMass();
  const hf = hullFactor();
  const thrust = (S.docked || warping) ? 0 : p.throttle * st.maxThrust * hf;
  p.twr = Math.abs(thrust) / (mass * G0);
  p.accel = thrust / mass;
  p.expend = 0;

  if (!warping && !S.docked) {
    if (Math.abs(p.throttle) > 0.01) p.expend += st.energyDrainThrust * Math.abs(p.throttle);
    if (S.input.turning) p.expend += st.energyDrainTurn;

    // speed on entry decides which cap rule applies below
    const spEntry = p.velocity.length();

    // main engine
    p.velocity.addScaledVector(_fwd, (thrust / mass) / UNIT_M * dt);

    // ── flight assist ──────────────────────────────────────────────
    // v0.2 assist rotated the velocity vector toward the nose while preserving its
    // length, and applied idle braking as a plain multiply. Both edited velocity
    // directly, which meant a cold, unpowered, zero-throttle ship still curved to
    // follow wherever you happened to point — free momentum from nothing. Assist is
    // now two pieces of real hardware with real limits:
    //
    //   RCS quads null sideways drift, capped at rcsAuthority x rated acceleration.
    //   The main engine runs retrograde to slow down, capped at brakeAuthority.
    //
    // The consequence you can feel: hauling the nose around no longer carries your
    // speed through the turn. The sideways component is *removed*, not rotated, so a
    // hard course change costs velocity — and a heavy, damaged or flat-battery ship
    // has less authority to correct with.
    const ratedAccel = (st.maxThrust * hf / mass) / UNIT_M;   // units/s^2
    if (S.settings.assist && ratedAccel > 0) {
      const power = clamp(p.energy / Math.max(st.energyCap * 0.2, 1e-3), 0, 1);
      const authority = FLIGHT.assistFloor + (1 - FLIGHT.assistFloor) * power;
      let firing = false;

      // lateral: whatever part of the velocity is not along the nose
      const along = p.velocity.dot(_fwd);
      _tmp.copy(p.velocity).addScaledVector(_fwd, -along);
      const lateral = _tmp.length();
      if (lateral > 1e-5) {
        const want = lateral * (1 - Math.exp(-FLIGHT.assistAlign * dt));
        const able = FLIGHT.rcsAuthority * ratedAccel * authority * dt;
        const applied = Math.min(want, able);
        p.velocity.addScaledVector(_tmp, -applied / lateral);
        if (applied > 1e-6) firing = true;
      }

      // retrograde braking, hands off the throttle
      if (Math.abs(p.throttle) < 0.02) {
        const sp = p.velocity.length();
        if (sp > 1e-5) {
          const want = sp * (1 - Math.exp(-FLIGHT.assistBrake * dt));
          const able = FLIGHT.brakeAuthority * ratedAccel * authority * dt;
          const applied = Math.min(want, able);
          p.velocity.multiplyScalar(Math.max(0, 1 - applied / sp));
          if (applied > 1e-6) firing = true;
        }
      }
      if (firing) p.expend += FLIGHT.assistDrain;
    }

    // ── terminal velocity ──────────────────────────────────────────
    // A hard scale-back at the cap is a wall: cross it by any means — a drop-out, a
    // shove, an assist correction — and the ship snaps. Past the cap the excess now
    // bleeds off, with an absolute ceiling left in as the backstop.
    const cap = st.maxSpeed * (p.throttle < 0 ? FLIGHT.reverseCap : 1);
    const sp2 = p.velocity.length();
    if (sp2 > cap) {
      // Two different situations wear the same number. The engine pushing a ship that
      // was already at terminal velocity is not overspeed — it is a rounding artifact
      // of a discrete step, and it hard-clamps, so maxSpeed stays a real invariant.
      // Arriving over the cap from outside — a warp drop-out, a throttle reversal that
      // lowers the cap under you — is overspeed, and that bleeds off smoothly instead
      // of snapping the ship back in one frame.
      const overspeed = spEntry > cap + 1e-9;
      const target = overspeed
        ? Math.min(cap * FLIGHT.capHard, cap + (sp2 - cap) * Math.exp(-FLIGHT.capBleed * dt))
        : cap;
      p.velocity.multiplyScalar(target / sp2);
    }
  }

  if (S.docked) p.velocity.set(0, 0, 0);
  p.position.addScaledVector(p.velocity, dt);

  // Handling telemetry. `drift` is how much of your velocity is not going where the
  // nose points, `slip` is the cosine of the angle between them — 1 is clean flight,
  // 0 is flying sideways. The HUD and the autopilots both want to know.
  const spNow = p.velocity.length();
  p.speed = spNow;
  if (spNow > 1e-5) {
    const alongNow = p.velocity.dot(_fwd);
    p.slip = clamp(alongNow / spNow, -1, 1);
    p.drift = Math.sqrt(Math.max(0, spNow * spNow - alongNow * alongNow));
  } else { p.slip = 1; p.drift = 0; }

  const d = p.position.length();
  if (d > WORLD_RADIUS) {
    p.position.multiplyScalar(WORLD_RADIUS / d);
    p.velocity.multiplyScalar(0.2);
    toast('Edge of charted space — turn back');
  }

  // energy budget
  p.energy -= p.expend * dt;
  if (p.energy <= 0) {
    p.energy = 0;
    if (p.throttle > 0.05) p.throttle *= Math.exp(-2 * dt);
  }
  if (p.expend < 8 && !warping) {
    p.energy = Math.min(st.energyCap, p.energy + st.energyRegen * hf * dt);
  }

  // corona heat — the star is a hazard, not scenery
  const fromStar = p.position.length() - STAR.radius;
  if (fromStar < STAR.dangerRadius && p.hull > 0) {
    damagePlayer(STAR.dps * (1 - fromStar / STAR.dangerRadius) * dt);
    if (S.time - lastStarWarn > 2) {
      lastStarWarn = S.time;
      toast('Corona heat — pull away from Solaris Prime');
    }
  }

  // shields knit back together once nobody has shot at you for a while.
  // the regen-matrix module shortens that delay and (via stats) speeds the recharge.
  if (S.time - p.lastHit > (st.shieldDelay || 5) && p.hull > 0) {
    p.shield = Math.min(st.shieldMax, p.shield + st.shieldRegen * dt);
  }
  // nanite repair bay: slowly rebuilds armor then hull, out of combat only
  if ((st.naniteArmor || st.naniteHull) && S.time - p.lastHit > 6 && p.hull > 0 && !S.docked) {
    if (p.armor < st.armorMax) p.armor = Math.min(st.armorMax, p.armor + st.naniteArmor * dt);
    else if (p.hull < st.hullMax) p.hull = Math.min(st.hullMax, p.hull + st.naniteHull * dt);
  }

  if (S.settings.chase) {
    if (!shipMesh || shipCls !== p.classKey) {
      if (shipMesh) scene.remove(shipMesh);
<<<<<<< HEAD
      // Identity is the ship's own name, not the career class — so your hull is *your*
      // hull across sessions, and two pilots of the same career do not fly the same mesh.
      // `noseMinusZ` because the chase cam's basis is the opposite of the forge's.
      shipMesh = buildShip(p.classKey, p.shipName || S.shipName || p.classKey,
                           { noseMinusZ: true });
=======
      shipMesh = buildShip(p.classKey);
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
      shipCls = p.classKey;
      scene.add(shipMesh);
    }
    shipMesh.visible = true;
    shipMesh.position.copy(p.position);
    shipMesh.rotation.set(p.pitch, p.yaw, 0);

    // Offset along the *ship's* up, not world up. With world up the rise shrinks as
    // you pitch — at the 86° pitch limit it collapsed to nothing and the camera ended
    // up on the nose axis, staring at the hull end-on.
    _right.copy(_fwd).cross(WORLD_UP);
    if (_right.lengthSq() < 1e-6) _right.set(1, 0, 0);   // nose within a whisker of vertical
    _right.normalize();
    _up.copy(_right).cross(_fwd).normalize();

    _tmp.copy(p.position)
        .addScaledVector(_fwd, -FLIGHT.chaseBack)
        .addScaledVector(_up, FLIGHT.chaseUp);
    camera.position.copy(_tmp);

    // And then actually look at the ship. The old code left the cockpit orientation
    // in place, which is why the chase view read as the forward view: the camera was
    // behind the hull but aimed straight over it. Aiming at a point ahead of the nose
    // rather than at the hull itself keeps the ship in the lower third and leaves the
    // space you are flying into on screen.
    _aim.copy(p.position).addScaledVector(_fwd, FLIGHT.chaseLead).sub(camera.position);
    if (_aim.lengthSq() > 1e-9) {
      _aim.normalize();
      const a = aimAngles(_aim);
      camera.rotation.y = a.yaw;
      camera.rotation.x = a.pitch;
    } else {
      camera.rotation.y = p.yaw;
      camera.rotation.x = p.pitch;
    }
  } else {
    if (shipMesh) shipMesh.visible = false;
    camera.position.copy(p.position);
    camera.rotation.y = p.yaw;
    camera.rotation.x = p.pitch;
  }
  const wantFov = warping ? FLIGHT.fovWarp : FLIGHT.fovCruise;
  if (Math.abs(camera.fov - wantFov) > 0.05) {
    camera.fov = damp(camera.fov, wantFov, 5, dt);
    camera.updateProjectionMatrix();
  }

  updateThrusters();
}

<<<<<<< HEAD
/**
 * The drive plume.
 *
 * Was 120 points teleported to fresh random offsets every frame — a static cloud that changed
 * shape rather than exhaust that was *emitted and left behind*, so it did not read as thrust
 * at all, only as a fuzzy patch that followed the ship. It is now a real emitter: particles
 * are born at the nozzle with the ship's own velocity minus the exhaust, then drift, so the
 * plume trails correctly when you turn and stretches when you accelerate.
 *
 * The colour carries **drive heat** — cold blue at nominal, orange as it climbs. That number
 * was previously readable only on a HUD bar, which means looking away from the canopy to find
 * out whether the thing you are doing is damaging the ship.
 */
function updateThrusters() {
  const p = S.player;
  // From the cockpit the plume sits behind the camera; only the chase cam can see it.
  if (!S.settings.chase || Math.abs(p.throttle) < 0.05 || S.warp.state === 'warping' || S.docked) return;

  _back.copy(_fwd).multiplyScalar(-1);
  _tmp.copy(p.position).addScaledVector(_back, 8);
  // Reverse thrust comes out of the front, which is where reverse thrust comes out of.
  const dir = p.throttle > 0 ? _back : _fwd;
  const heat = Math.min(1, (S.stats.heat || 0) / Math.max(1, S.stats.heatMax || 100));
  plume(_tmp, dir, Math.min(1, Math.abs(p.throttle)), heat);
=======
function updateThrusters() {
  if (!thrusters) return;
  const p = S.player;
  // From the cockpit the plume sits behind the camera; only the chase cam can see it.
  if (!S.settings.chase || Math.abs(p.throttle) < 0.05 || S.warp.state === 'warping' || S.docked) {
    thrusters.visible = false;
    return;
  }
  thrusters.visible = true;
  const a = thrusterPos.array;
  _back.copy(_fwd).multiplyScalar(-1);
  _tmp.copy(p.position).addScaledVector(_back, 8);
  for (let i = 0; i < THRUSTER_COUNT; i++) {
    const t = Math.random() * 18;
    a[i * 3]     = _tmp.x + _back.x * t + (Math.random() - 0.5) * 4;
    a[i * 3 + 1] = _tmp.y + _back.y * t + (Math.random() - 0.5) * 4;
    a[i * 3 + 2] = _tmp.z + _back.z * t + (Math.random() - 0.5) * 4;
  }
  thrusterPos.needsUpdate = true;
  thrusters.material.color.setHex(p.throttle > 0 ? 0x44aaff : 0xff6633);
  thrusters.material.opacity = 0.35 + Math.abs(p.throttle) * 0.55;
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
}
