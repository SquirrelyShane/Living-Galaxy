// Living Galaxy — pooled bolts + guided missiles with fire/smoke trails.
// Collision is a swept segment test so fast rounds can't tunnel through small targets.

import { scene } from '../world/scene.js';
import { S } from '../core/state.js';
import { SEEKER, DECOY, POINTDEF } from '../core/config.js';
import { damagePlayer, damageNpc, damagePlayerDisabling, burst } from './combat.js';
import { markStale, querySegment } from './broadphase.js';

const MAX = 420;
const MAX_SMOKE = 600;
const PLAYER_RADIUS = 15;

const list = [];
const smoke = [];          // residual smoke puffs (launch plume + exhaust trail)
let points, posAttr, colAttr;
let smokePts, smokePos, smokeCol;

const _p1 = new THREE.Vector3();
const _ab = new THREE.Vector3();
const _ac = new THREE.Vector3();
const _cl = new THREE.Vector3();
const _col = new THREE.Color();
const _seek = new THREE.Vector3();
const _tmp = new THREE.Vector3();

export function initProjectiles() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3));
  posAttr = geo.attributes.position;
  colAttr = geo.attributes.color;
  geo.setDrawRange(0, 0);
  points = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 7, sizeAttenuation: true, vertexColors: true,
    transparent: true, opacity: 0.95, depthWrite: false,
    blending: THREE.AdditiveBlending, fog: false
  }));
  points.frustumCulled = false;
  scene.add(points);

  // smoke / exhaust trail cloud
  const sgeo = new THREE.BufferGeometry();
  sgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_SMOKE * 3), 3));
  sgeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_SMOKE * 3), 3));
  smokePos = sgeo.attributes.position;
  smokeCol = sgeo.attributes.color;
  sgeo.setDrawRange(0, 0);
  smokePts = new THREE.Points(sgeo, new THREE.PointsMaterial({
    size: 14, sizeAttenuation: true, vertexColors: true,
    transparent: true, opacity: 0.55, depthWrite: false,
    blending: THREE.NormalBlending, fog: false
  }));
  smokePts.frustumCulled = false;
  scene.add(smokePts);
}

/**
 * @param {THREE.Vector3} origin
 * @param {THREE.Vector3} dir normalized
 * @param {'player'|'friendly'|'hostile'|'fx'|'merc'} faction
 * @param {object} [opts] { track, kind, ttl, size }
 */
export function fire(origin, dir, speed, damage, faction, colorHex, opts = {}) {
  if (list.length >= MAX) list.shift();
  _col.setHex(colorHex);
  const isMissile = opts.kind === 'missile';
  list.push({
    pos: origin.clone(),
    vel: dir.clone().multiplyScalar(speed),
    life: 0,
    ttl: opts.ttl || (isMissile ? 4.5 : 1.2),
    dmg: damage,
    dtype: opts.dtype || 'kinetic',
    faction,
    r: _col.r, g: _col.g, b: _col.b,
    kind: opts.kind || 'bolt',
    track: opts.track || 0,
    // A missile carries the lock it was fired with. v0.3 steered every missile at
    // whatever the player happened to have selected *right now*, so switching targets
    // mid-flight yanked rounds already in the air around onto the new ship — and NPC
    // missiles steered at the player's lock too, which is nonsense.
    seek: opts.seek || null,
    // Armour penetration carried by the round, not by the gun. See systems/ordnance.js.
    pierce: opts.pierce || 0,
    lost: false,
    size: isMissile ? 11 : 7,
    pd: false,             // has point defence already judged this round?
    smokeT: 0
  });

  // launch plume — dense smoke at the muzzle that drifts and fades
  if (isMissile) {
    for (let i = 0; i < 8; i++) {
      spawnSmoke(
        origin.x + (Math.random() - 0.5) * 4,
        origin.y + (Math.random() - 0.5) * 4,
        origin.z + (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        0.9 + Math.random() * 0.6,
        0.55 + Math.random() * 0.3
      );
    }
  }
}

// ── decoy buoys ──────────────────────────────────────────────────────
// The decoy module was a weapon that did nothing: zero damage, no object, no effect.
// A buoy is a real thing in the world now, and it is the counter to a seeker.

export function deployDecoy(pos, vel) {
  const d = S.world.decoys;
  if (d.length >= DECOY.max) d.shift();
  d.push({ position: pos.clone(), vel: (vel ? vel.clone() : new THREE.Vector3()), life: DECOY.life });
  return d[d.length - 1];
}

function updateDecoys(dt) {
  const d = S.world.decoys;
  for (let i = d.length - 1; i >= 0; i--) {
    const b = d[i];
    b.life -= dt;
    b.position.addScaledVector(b.vel, dt);
    b.vel.multiplyScalar(1 - 0.6 * dt);
    if (b.life <= 0) d.splice(i, 1);
  }
}

/** Is there a buoy close enough to pull this seeker off its lock? */
function decoyFor(p) {
  const d = S.world.decoys;
  let best = null, bd = SEEKER.decoyRange * SEEKER.decoyRange;
  for (let i = 0; i < d.length; i++) {
    const q = d[i].position.distanceToSquared(p.pos);
    if (q < bd) { bd = q; best = d[i]; }
  }
  return best;
}

// ── missile guidance ─────────────────────────────────────────────────
/**
 * A seeker steers toward an intercept point, not toward where the target is now —
 * chasing the current position is a tail chase that a missile only wins if it is much
 * faster than its target. It can also lose the lock: if the target leaves the seeker
 * cone, or a decoy pulls it, the round flies on ballistically. That is what makes
 * breaking a lock a real thing a pilot can do rather than a number in a table.
 */
function guide(p, dt) {
  // A lost seeker normally stops steering for good. With `reacquire` on it keeps looking,
  // which is the only way the branch below can ever fire — an early return here is what
  // made the flag unreadable in the first place.
  if (p.lost && !SEEKER.reacquire) return;

  const target = p.seek;
  const alive = target && (target.userData ? target.userData.hp > 0 : true);
  if (!alive) { p.lost = true; return; }

  // a buoy in range may take the lock instead
  if (!p.decoyed) {
    const buoy = decoyFor(p);
    if (buoy) {
      p.decoyed = true;                                   // judged once, not every frame
      if (Math.random() < SEEKER.decoyChance) { p.seek = buoy; p.lured = true; }
    }
  }

  const tp = p.seek.position || p.seek;
  _seek.copy(tp).sub(p.pos);
  const dist = _seek.length();
  if (dist < 1e-3) return;
  _seek.divideScalar(dist);

  // Seeker cone. A target that slips outside the sensor's view is lost — and by default it
  // stays lost, which is what `SEEKER.reacquire: false` has been describing since v1.00.40
  // without anything reading it. The flag is read now, so it is a lever rather than a
  // comment: with it on, a seeker that still has the target back inside its cone picks the
  // lock up again instead of coasting past a ship it can see.
  //
  // Kept off by default deliberately. A missile that regains its lock removes the whole
  // point of breaking one — the hard turn that beat the seeker becomes a delay rather than
  // a defence — so this exists as a knob for a harder difficulty, not as a fix.
  _tmp.copy(p.vel).normalize();
  if (_tmp.dot(_seek) < SEEKER.cone) { p.lost = true; return; }
  p.lost = false;

  // lead the intercept
  const spd = p.vel.length();
  const tv = p.seek.userData && p.seek.userData.vel;
  if (tv) {
    const tof = dist / Math.max(spd, 1e-3);
    _tmp.copy(tp).addScaledVector(tv, tof * SEEKER.lead).sub(p.pos);
    if (_tmp.lengthSq() > 1e-6) _seek.copy(_tmp).normalize();
  }

  p.vel.normalize().lerp(_seek, Math.min(1, p.track * dt)).normalize().multiplyScalar(spd);
}

// ── point defence ────────────────────────────────────────────────────
/**
 * Shoot a round down before it arrives. Each round is judged exactly once, on entry to
 * the envelope — rolling every frame would make the grid strictly better the slower the
 * round, which is backwards, and would make the effective interception rate depend on
 * frame rate.
 * @returns {boolean} true if the round was destroyed.
 */
function pointDefence(p) {
  const st = S.stats;
  if (!st || !st.pointDef) return false;
  if (p.pd || p.faction === 'player' || p.faction === 'fx') return false;
  if (p.pos.distanceToSquared(S.player.position) > POINTDEF.range * POINTDEF.range) return false;

  p.pd = true;                                   // judged, whatever the outcome
  if (Math.random() >= st.pointDef) return false;
  burst(p.pos, 0xffee88, POINTDEF.burst, 30);
  return true;
}

function spawnSmoke(x, y, z, vx, vy, vz, life, grey) {
  if (smoke.length >= MAX_SMOKE) smoke.shift();
  smoke.push({ x, y, z, vx, vy, vz, life, max: life, grey });
}

export function updateProjectiles(dt) {
  const pa = posAttr.array, ca = colAttr.array;
  let w = 0;

  // The grid is declared stale here and built by the first round that needs it, so a
  // frame with nothing in the air pays nothing at all.
  markStale(S.world.npcs, npcRadius);
  updateDecoys(dt);

  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    p.life += dt;

    if (p.track > 0 && p.life > SEEKER.armTime) guide(p, dt);

    _p1.copy(p.pos).addScaledVector(p.vel, dt);

    // exhaust trail behind missiles
    if (p.kind === 'missile') {
      p.smokeT += dt;
      if (p.smokeT > 0.03) {
        p.smokeT = 0;
        const back = _tmp.copy(p.vel).normalize().multiplyScalar(-6);
        spawnSmoke(
          p.pos.x + back.x + (Math.random() - 0.5) * 2,
          p.pos.y + back.y + (Math.random() - 0.5) * 2,
          p.pos.z + back.z + (Math.random() - 0.5) * 2,
          back.x * 0.3 + (Math.random() - 0.5) * 4,
          back.y * 0.3 + (Math.random() - 0.5) * 4,
          back.z * 0.3 + (Math.random() - 0.5) * 4,
          0.7 + Math.random() * 0.5,
          0.35 + Math.random() * 0.35
        );
        // bright fire core puffs
        spawnSmoke(
          p.pos.x + back.x * 0.4,
          p.pos.y + back.y * 0.4,
          p.pos.z + back.z * 0.4,
          back.x * 0.15, back.y * 0.15, back.z * 0.15,
          0.18 + Math.random() * 0.12,
          1.2
        );
      }
    }

    if (pointDefence(p)) continue;      // shot down in flight, never reaches the hull

    let hit = false;
    if (p.faction === 'fx') {
      // remote pilot's tracer — damage resolves on their client
    } else if (p.faction === 'merc') {
      if (S.player.hull > 0 && !S.sim.disabled && segHits(p.pos, _p1, S.player.position, PLAYER_RADIUS)) {
        damagePlayerDisabling(p.dmg, p.dtype);
        hit = true;
      }
    } else if (p.faction === 'hostile') {
      if (S.player.hull > 0 && segHits(p.pos, _p1, S.player.position, PLAYER_RADIUS)) {
        damagePlayer(p.dmg, p.dtype);
        hit = true;
      }
      if (!hit) hit = hitNpcs(p, _p1, 'friendly');
    } else {
      hit = hitNpcs(p, _p1, 'hostile');
    }

    p.pos.copy(_p1);
    if (hit || p.life > p.ttl) continue;

    if (w !== i) list[w] = p;
    const o = w * 3;
    pa[o] = p.pos.x; pa[o + 1] = p.pos.y; pa[o + 2] = p.pos.z;
    // missiles render brighter / larger via colour boost
    const boost = p.kind === 'missile' ? 1.15 : 1;
    ca[o] = Math.min(1, p.r * boost);
    ca[o + 1] = Math.min(1, p.g * boost);
    ca[o + 2] = Math.min(1, p.b * boost);
    w++;
  }
  list.length = w;

  posAttr.needsUpdate = true;
  colAttr.needsUpdate = true;
  points.geometry.setDrawRange(0, w);
  // scale points material size roughly for mixed bolt/missile — average
  points.material.size = list.some(x => x.kind === 'missile') ? 9 : 7;

  // ── smoke trail update ──
  const spa = smokePos.array, sca = smokeCol.array;
  let sw = 0;
  for (let i = 0; i < smoke.length; i++) {
    const s = smoke[i];
    s.life -= dt;
    if (s.life <= 0) continue;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.z += s.vz * dt;
    s.vx *= 0.96; s.vy *= 0.96; s.vz *= 0.96;
    const a = s.life / s.max;
    if (sw !== i) smoke[sw] = s;
    const o = sw * 3;
    spa[o] = s.x; spa[o + 1] = s.y; spa[o + 2] = s.z;
    if (s.grey > 1) {
      // fire core — hot orange
      sca[o] = 1; sca[o + 1] = 0.45 * a; sca[o + 2] = 0.08 * a;
    } else {
      // smoke — grey fading to transparent via dim colour
      const g = s.grey * a;
      sca[o] = g; sca[o + 1] = g * 0.95; sca[o + 2] = g * 0.9;
    }
    sw++;
  }
  smoke.length = sw;
  smokePos.needsUpdate = true;
  smokeCol.needsUpdate = true;
  smokePts.geometry.setDrawRange(0, sw);
}

const npcRadius = n => n.userData.size * 1.8 + 4;

function hitNpcs(p, next, faction) {
  // Broadphase narrows the candidates to the cells this round's segment crosses; the
  // swept test below is unchanged and still decides every hit. Same answers, far fewer
  // questions — this loop used to be projectiles x ships, every frame.
  let struck = null;
  querySegment(p.pos, next, 80, n => {
    const u = n.userData;
    if (u.faction !== faction || u.hp <= 0) return false;
    if (!segHits(p.pos, next, n.position, npcRadius(n))) return false;
    struck = n;
    return true;
  });
  if (!struck) return false;
  damageNpc(struck, p.dmg, p.faction === 'player', p.dtype, p.pierce);
  return true;
}

/** Does segment a→b pass within r of centre c? */
function segHits(a, b, c, r) {
  _ab.copy(b).sub(a);
  _ac.copy(c).sub(a);
  const len2 = _ab.lengthSq();
  let t = len2 > 0 ? _ac.dot(_ab) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  _cl.copy(a).addScaledVector(_ab, t);
  return _cl.distanceToSquared(c) <= r * r;
}

export const activeProjectiles = () => list.length;

/**
 * The live round list. Exposed for the test harness and the console — nothing in the
 * game reads it, and callers must treat it as read-only.
 */
export const inspectProjectiles = () => list;
export const activeDecoys = () => S.world.decoys;
