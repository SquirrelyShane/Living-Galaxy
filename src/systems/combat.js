// Living Galaxy — who takes damage, what dies, what it drops.

import { scene } from '../world/scene.js';
import { S, cargoFree, recalcStats } from '../core/state.js';
import { rand, fmtCr } from '../core/utils.js';
import { SPAWN, POINTDEF } from '../core/config.js';
import { applyDamage, damageType, resistance } from './damage.js';
import { toast, status } from '../ui/toast.js';
import { sfx } from './audio.js';
import { clearTarget } from './targeting.js';
import { creditKill, bountyScale, blocOf } from './reputation.js';
import { witnessKill } from './npc-brain.js';
import { callForHelp } from './npc-tactics.js';
import { practice } from './character.js';
import { untrack as untrackInterp } from '../world/interpolate.js';
import { crewCasualty, crewEvent } from './crew.js';

const MAX_PARTICLES = 720;
const LOOT_LIMIT = 26;
const LOOT_PICKUP = 70;

const parts = [];
let pPoints, pPos, pCol;
let lootGeo, lootMat;
const _v = new THREE.Vector3();

export function initCombat() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3));
  pPos = geo.attributes.position;
  pCol = geo.attributes.color;
  geo.setDrawRange(0, 0);
  pPoints = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 9, sizeAttenuation: true, vertexColors: true, transparent: true,
    opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false
  }));
  pPoints.frustumCulled = false;
  scene.add(pPoints);

  lootGeo = new THREE.IcosahedronGeometry(6, 0);
  lootMat = new THREE.MeshStandardMaterial({
    color: 0x66ffcc, emissive: 0x22aa88, emissiveIntensity: 0.7, metalness: 0.6, roughness: 0.35
  });
}

// ── player ───────────────────────────────────────────────────────────
/**
 * @param {number} amount
 * @param {string} [type] kinetic | thermal | em — see DAMAGE in config.
 *
 * Point defence used to live here as a dice roll: a share of incoming damage simply
 * never happened, invisibly, after the round had already arrived. It is a real
 * interception in projectiles.js now, so by the time a round reaches this function it
 * has already got past the grid.
 */
export function damagePlayer(amount, type) {
  const p = S.player, st = S.stats;
  p.lastHit = S.time;
  p.lastHitType = damageType(type);

  const res = applyDamage(p, amount, type, {
    onShield: (taken, down) => { sfx.shieldHit(); if (down) status('Shields down — armor exposed'); },
    onArmor:  (taken, gone) => { sfx.hit(); if (gone) status('Armor stripped'); },
    onHull:   () => sfx.hit()
  });

  // Structure is where the people are. A hit that reaches it can hurt somebody — and
  // only somebody actually on watch, because injuring the crew you deliberately sent to
  // rest would be punishing the player for using the rotation the ship just gave them.
  if (res.hull > 0) {
    // A breach teaches the whole ship something, and damage control most of all.
    crewEvent('hitTaken', 'medic', res.hull / 30);
    const hurt = crewCasualty(res.hull);
    if (hurt) crewEvent('casualty', 'medic');
  }

  if (p.hull <= 0) { destroyPlayer(); return res; }
  if (res.hull > 0 && p.hull / st.hullMax < 0.3) status('CRITICAL HULL DAMAGE');
  return res;
}

function destroyPlayer() {
  const p = S.player;
  burst(p.position, 0xff8844, 40, 90);
  sfx.explode();
  const lost = Math.round(S.credits * 0.3);
  S.credits -= lost;
  S.cargo.ore = 0; S.cargo.salvage = 0;
  const st = nearestStation(p.position);
  p.position.copy(st ? st.position : new THREE.Vector3(SPAWN.x, SPAWN.y, SPAWN.z)).add(new THREE.Vector3(rand(-200, 200), rand(-60, 60), 260));
  p.velocity.set(0, 0, 0);
  p.throttle = 0;
  p.hull = S.stats.hullMax * 0.4;
  p.armor = S.stats.armorMax * 0.5;
  p.shield = S.stats.shieldMax * 0.5;
  p.energy = S.stats.energyCap;
  S.warp.state = 'idle'; S.warp.charge = 0; S.warp.dest = null;
  clearTarget();
  toast(`Hull lost — rebuilt at ${st ? st.userData.name : 'the core'} for ${fmtCr(lost)}`, 4000);
}

function nearestStation(pos) {
  let best = null, bd = Infinity;
  for (const s of S.world.stations) {
    const d = s.position.distanceToSquared(pos);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}

/**
 * Mercenary disabling fire: same shield→armor→hull cascade, but it can never
 * breach — the contract wants you alive. At 15% hull the ship goes dark instead.
 */
export function damagePlayerDisabling(amount, type) {
  const p = S.player, st = S.stats;
  p.lastHit = S.time;
  p.lastHitType = damageType(type);

  // The hull floor is what makes this disabling fire rather than lethal fire: the
  // cascade is identical, it simply cannot take the last 12%.
  applyDamage(p, amount, type, {
    hullFloor: st.hullMax * 0.12,
    onShield: () => sfx.shieldHit(),
    onArmor:  () => sfx.hit(),
    onHull:   () => sfx.hit()
  });

  if (p.hull <= st.hullMax * 0.15 && !S.sim.disabled) {
    p.hull = st.hullMax * 0.12;
    S.sim.disabled = { t: 0 };
    p.throttle = 0;
    status('SHIP DISABLED');
    toast('⚠ Disabling hit — drives and weapons offline', 4500);
    burst(p.position, 0x66aaff, 20, 40);
    sfx.explode();
  }
}

// ── NPCs ─────────────────────────────────────────────────────────────
/**
 * A hull's softness to a damage type. `profile` on the NPC type picks which layer of
 * the shared resistance table it behaves like: a drone is a shield boat, a bastion is
 * armour, an unshielded raider is bare structure.
 */
/**
 * `pierce` is armour penetration, 0..1, and it only means anything against a plated hull.
 * A sabot does not help you against a shield boat — it goes through plate, and a shield is
 * not plate.
 *
 * Note which direction this goes. `DAMAGE.resist` entries are damage *multipliers*, not
 * resistances: kinetic against armour is already 1.30, so "lift it toward 1" — the obvious
 * reading of the word penetration — would have made armour-piercing rounds *worse* against
 * armour. Penetration widens the multiplier it already has.
 *
 * Paired with `ORDNANCE.apYield` this is a real trade rather than a strict upgrade: an AP
 * round gives up yield everywhere in exchange for going through plate, so it is the right
 * answer against a plated raider and the wrong one against a shield boat.
 */
export function npcResist(u, type, pierce = 0) {
  const base = resistance(type, u.armorProfile || 'shield');
  if (!(pierce > 0) || (u.armorProfile || 'shield') !== 'armor') return base;
  return base * (1 + Math.min(1, pierce));
}
export function damageNpc(npc, amount, byPlayer, type, pierce = 0) {
  const u = npc.userData;
  if (u.hp <= 0) return;
  // NPCs carry one pool rather than three layers — a 63-ship roster resolving a full
  // cascade every hit buys detail nobody can see. They still respect damage types, via
  // a per-hull profile that says which of the three they are soft to.
  const dealt = amount * npcResist(u, type, pierce);
  // Being shot is the moment a ship has something worth shouting about. Filed here rather
  // than in the AI loop because this is the only place that knows *who* did it — the loop
  // sees a hull losing points and cannot tell an ambush from an asteroid.
  if (byPlayer && S.player.hull > 0) {
    callForHelp(npc, u, { position: S.player.position, vel: S.player.velocity, isPlayer: true });
  }
  u.hp -= dealt;
  // Practice is credited on damage landed rather than on kills, so a long fight you
  // lose still taught you something and a lucky finishing blow does not teach you a lot.
  if (byPlayer) {
    practice('gunnery', dealt * 0.05);
    // Gunners learn from the shot that connected, not from the hour of quiet either side.
    crewEvent('hitDealt', 'gunner', dealt / 40);
  }
  u.lastHit = S.time;
  u.lastHitType = damageType(type);
  if (u.ambush) u.triggered = true;   // shooting a lurker blows its cover
  if (u.hp > 0) return;

  u.hp = 0;
  burst(npc.position, u.color, 26, 60);
  sfx.explode();
  scene.remove(npc);
  const i = S.world.npcs.indexOf(npc);
  // Untrack before splicing: an interpolation entry pointing at a despawned ship is a
  // slow leak, and over a long session it is a list of thousands of dead references.
  sfx.explodeAt(npc.position, npc.userData.vel);
  untrackInterp(npc);
  if (i >= 0) S.world.npcs.splice(i, 1);
  if (S.target && S.target.obj === npc) clearTarget();

  if (byPlayer) {
    crewEvent('kill', 'gunner');
    // Everyone in earshot forms an opinion. Filed before the bounty toast so the memory
    // exists by the time anybody nearby next opens their mouth on the radio.
    witnessKill(u);
    // Standing moves on every kill, bounty or not — shooting an unarmed miner has to
    // cost something even though nobody pays you for it.
    creditKill(u.faction);
    if (u.bounty) {
      const paid = Math.round(u.bounty * bountyScale('coalition'));
      S.credits += paid;
      S.player.kills++;
      toast(`${u.name} destroyed · +${fmtCr(paid)}`);
    }
  }
  if (u.salvage) dropLoot(npc.position, u.salvage);
}

// ── loot ─────────────────────────────────────────────────────────────
function dropLoot(pos, kg) {
  if (S.world.loot.length >= LOOT_LIMIT) {
    const old = S.world.loot.shift();
    scene.remove(old.mesh);
  }
  const mesh = new THREE.Mesh(lootGeo, lootMat);
  mesh.position.copy(pos);
  scene.add(mesh);
  S.world.loot.push({ mesh, kg, spin: rand(0.6, 1.8), life: 0 });
}

function updateLoot(dt) {
  const loot = S.world.loot;
  for (let i = loot.length - 1; i >= 0; i--) {
    const l = loot[i];
    l.life += dt;
    l.mesh.rotation.y += l.spin * dt;
    l.mesh.rotation.x += l.spin * 0.4 * dt;
    const d = l.mesh.position.distanceTo(S.player.position);
    if (d < LOOT_PICKUP) {
      const take = Math.min(l.kg, cargoFree());
      if (take > 0) {
        S.cargo.salvage += take;
        sfx.pickup();
        toast(`Salvage +${Math.round(take)} kg${take < l.kg ? ' (hold full)' : ''}`);
      } else {
        toast('Cargo hold full');
      }
      scene.remove(l.mesh);
      loot.splice(i, 1);
      continue;
    }
    if (l.life > 180) { scene.remove(l.mesh); loot.splice(i, 1); }
  }
}

// ── particles ────────────────────────────────────────────────────────
export function burst(pos, colorHex, count, speed) {
  const c = new THREE.Color(colorHex);
  for (let i = 0; i < count && parts.length < MAX_PARTICLES; i++) {
    _v.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(0.2, 1) * speed);
    parts.push({
      p: pos.clone(), v: _v.clone(), life: 0, ttl: rand(0.5, 1.4),
      r: c.r, g: c.g, b: c.b
    });
  }
}

export function updateCombat(dt) {
  updateLoot(dt);
  const pa = pPos.array, ca = pCol.array;
  let w = 0;
  for (let i = 0; i < parts.length; i++) {
    const q = parts[i];
    q.life += dt;
    if (q.life > q.ttl) continue;
    q.p.addScaledVector(q.v, dt);
    q.v.multiplyScalar(1 - 1.4 * dt);
    if (w !== i) parts[w] = q;
    const o = w * 3, f = 1 - q.life / q.ttl;
    pa[o] = q.p.x; pa[o + 1] = q.p.y; pa[o + 2] = q.p.z;
    ca[o] = q.r * f; ca[o + 1] = q.g * f; ca[o + 2] = q.b * f;
    w++;
  }
  parts.length = w;
  pPos.needsUpdate = true;
  pCol.needsUpdate = true;
  pPoints.geometry.setDrawRange(0, w);
}

/** Used by save/load when hull caps change under the player. */
export function reclampVitals() { recalcStats(); }
