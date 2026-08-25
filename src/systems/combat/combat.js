// Living Galaxy — who takes damage, what dies, what it drops.

import { scene } from '../../world/scene.js';
import { S, cargoFree, recalcStats } from '../../core/state.js';
import { rand, fmtCr } from '../../core/utils.js';
import { SPAWN, POINTDEF, COMMODITIES, HOLD } from '../../core/config.js';
import { applyDamage, damageType, resistance } from './damage.js';
import { toast, status } from '../../core/notify.js';
import { sfx } from '../platform/audio.js';
import { clearTarget } from '../flight/targeting.js';
import { creditKill, bountyScale, blocOf, adjust as adjustRep } from '../company/reputation.js';
import { isInnocent, ownerOfHull } from '../company/ownership.js';
import { REP } from '../../core/config.js';
import { witnessKill } from '../npc/npc-brain.js';
import { callForHelp } from '../npc/npc-tactics.js';
import { practice } from '../crew/character.js';
import { untrack as untrackInterp } from '../../world/interpolate.js';
import { crewCasualty, crewEvent } from '../crew/crew.js';
import { wearHit } from './wear.js';
import { spillOf, loadHold, holdFree, holdCap } from '../trade/holds.js';
import { initParticles, emit, impact, bloom, shieldSplash, scoop } from '../../world/particles.js';
import { crewNote } from '../crew/crew-note.js';

const LOOT_LIMIT = 26;
const LOOT_PICKUP = 70;

let lootGeo, lootMat;   // lootMat is keyed by commodity — see initCombat()
const _v = new THREE.Vector3();
const _out = new THREE.Vector3();

/**
 * Roughly where a hit came from, for the spray to come off.
 *
 * Not the real incoming vector — nothing in the damage path carries one, and threading a
 * direction through six call sites to make sparks point correctly is a large change for a
 * small truth. What matters visually is that the spray comes *off the hull outward* rather
 * than out of a single point, so a random outward direction reads correctly and costs three
 * lines. If a round's true bearing is ever wanted, this is the one place to change.
 */
function forwardish() {
  _out.set(rand(-1, 1), rand(-1, 1), rand(-1, 1));
  if (_out.lengthSq() < 1e-6) _out.set(0, 1, 0);
  return _out.normalize();
}

export function initCombat() {
  // The private 720-particle pool that used to live here is gone. It was its own buffer, its
  // own draw call, one fixed size for every spark whatever its age, and it never read
  // `effectScale()` — so the quality system could not turn it down on the one device where it
  // mattered. Everything now goes through `world/particles.js`. See that file's header.
  initParticles(scene);

  lootGeo = new THREE.IcosahedronGeometry(6, 0);
  // One material per commodity. A pilot deciding whether to break off a chase to scoop
  // something needs to know what it is from the cockpit, and the alternative — a panel that
  // names it once you are already on top of it — is information arriving after the decision.
  lootMat = {
    salvage: new THREE.MeshStandardMaterial({
      color: 0x66ffcc, emissive: 0x22aa88, emissiveIntensity: 0.7, metalness: 0.6, roughness: 0.35 }),
    ore: new THREE.MeshStandardMaterial({
      color: 0xc8a86a, emissive: 0x6a4f22, emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.55 }),
    data: new THREE.MeshStandardMaterial({
      color: 0x7fb8ff, emissive: 0x2255aa, emissiveIntensity: 0.8, metalness: 0.3, roughness: 0.3 })
  };
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
    // Shield, armour and hull look different on purpose. Which layer a round landed on is
    // the single most useful thing a pilot can know mid-fight, and it was previously only
    // legible by watching three bars rather than the thing shooting at you.
    onShield: (taken, down) => {
      sfx.shieldHit(); shieldSplash(p.position, forwardish(), taken);
      if (down) status('Shields down — armor exposed');
    },
    onArmor:  (taken, gone) => {
      sfx.hit(); impact(p.position, forwardish(), damageType(type), taken);
      if (gone) status('Armor stripped');
    },
    onHull:   taken => { sfx.hit(); impact(p.position, forwardish(), damageType(type), taken); }
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
  // Being shot shakes the whole fit, and structure hits cost more than armour ones — which
  // is what makes plating a layer rather than a stat. Filed here rather than in damage.js so
  // the resolver stays a pure cascade with no opinion about who owns the ship.
  wearHit(res.armor, res.hull);

  if (p.hull <= 0) { destroyPlayer(); return res; }
  if (res.hull > 0 && p.hull / st.hullMax < 0.3) status('CRITICAL HULL DAMAGE');
  return res;
}

function destroyPlayer() {
  const p = S.player;
  bloom(p.position, 1.6);
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
    // EM blue, because a disabling hit is an EM event and the palette says so consistently.
    impact(p.position, { x: 0, y: 1, z: 0 }, 'em', 40);
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

  // ── the bill for free fire (v1.02.57) ─────────────────────────────
  //
  // Any hull can be shot now — see `canHit` in `combat/projectiles.js` — so the thing that
  // decides whether you *should* has to live somewhere, and it is here rather than in the
  // collision test. Firing on somebody who has not fired on you costs standing with their
  // bloc, once, on the first round that lands; after that the hull is `provoked` and the
  // fight is a fight rather than an ambush repeated forty times a second.
  //
  // Charged once per hull, not per round, for a reason worth stating: a scatter gun lands
  // eight pellets and a beam lands sixty ticks a second, and a per-hit penalty would make
  // the reputation cost of an identical decision depend entirely on which gun was fitted.
  if (byPlayer && isInnocent(u)) {
    u.provoked = true;
    const own = ownerOfHull(npc);
    adjustRep(blocOf(u.faction), -(REP.unprovokedFire || 6),
              own.label ? `opened fire on ${own.label} property` : 'opened fire unprovoked');
  }
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
  bloom(npc.position, 1);
  burst(npc.position, u.color, 10, 44);   // a little of its own paint in the debris
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
    // ...and somebody aboard says something about it. See systems/crew/crew-talk.js.
    crewNote('firstblood');
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
  // v1.01.70: and whatever it was actually carrying. This is the line that makes a laden
  // hauler a different target from an empty one — before it, the trade lanes two slices went
  // into building were worth precisely the fixed salvage figure to anybody who shot at them.
  //
  // If somebody other than the player did the killing, whoever is standing over the wreck
  // takes a share first, and only the rest scatters. That is what makes a raider who has
  // been working the lane a richer kill than one that just spawned — the loot on a pirate is
  // no longer a fixed number, it is the last hour of that pirate's afternoon.
  if (!byPlayer) scoopFrom(npc, u);
  for (const lot of spillOf(u)) dropLoot(npc.position, lot.kg, lot.commodity);
  u.hold = null;
}

const SCOOP_RANGE = 1400;

/** The nearest ship with a hold, hostile to the deceased, helps itself. */
function scoopFrom(npc, u) {
  if (!u.hold) return;
  let best = null, bd = SCOOP_RANGE * SCOOP_RANGE;
  for (const other of S.world.npcs) {
    const o = other.userData;
    if (!o || o === u || o.hp <= 0 || !holdCap(o) || holdFree(o) <= 0) continue;
    if (blocOf(o.faction) === blocOf(u.faction)) continue;   // you do not rob your own
    const d = other.position.distanceToSquared(npc.position);
    if (d < bd) { bd = d; best = o; }
  }
  if (!best) return;
  const h = u.hold;
  for (const k of Object.keys(h)) {
    const take = (h[k] || 0) * HOLD.scoopFraction;
    if (take < 1) continue;
    const got = loadHold(best, k, take);
    h[k] -= got;
    if (h[k] < 0.001) delete h[k];
  }
}

// ── loot ─────────────────────────────────────────────────────────────
function dropLoot(pos, kg, commodity = 'salvage') {
  if (S.world.loot.length >= LOOT_LIMIT) {
    const old = S.world.loot.shift();
    scene.remove(old.mesh);
  }
  const mesh = new THREE.Mesh(lootGeo, lootMat[commodity] || lootMat.salvage);
  mesh.position.copy(pos);
  // Containers from one wreck are scattered rather than stacked, so three lots do not read
  // as one object and a pilot can see there is more than one thing to collect.
  mesh.position.x += rand(-26, 26);
  mesh.position.y += rand(-14, 14);
  mesh.position.z += rand(-26, 26);
  scene.add(mesh);
  S.world.loot.push({ mesh, kg, commodity, spin: rand(0.6, 1.8), life: 0 });
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
      const key = l.commodity || 'salvage';
      if (take > 0) {
        S.cargo[key] = (S.cargo[key] || 0) + take;
        sfx.pickup();
        const nm = (COMMODITIES[key] || {}).name || key;
        toast(`${nm} +${Math.round(take)} kg${take < l.kg ? ' (hold full)' : ''}`);
      } else {
        toast('Cargo hold full');
      }
      scoop(l.mesh.position, S.player.position, key);
      scene.remove(l.mesh);
      loot.splice(i, 1);
      continue;
    }
    if (l.life > 180) { scene.remove(l.mesh); loot.splice(i, 1); }
  }
}

// ── particles ────────────────────────────────────────────────────────

/**
 * Kept for the callers that want an arbitrary colour rather than one of the reserved six —
 * a hull going up in its own faction's paint, mostly. Everything semantic should use the
 * named presets instead, because those are the ones that carry information.
 */
export function burst(pos, colorHex, count, speed) {
  const c = new THREE.Color(colorHex);
  for (let i = 0; i < count; i++) {
    _v.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(0.2, 1) * speed);
    emit(pos, _v, [c.r, c.g, c.b],
         { life: rand(0.5, 1.4), size: 9, endSize: 2, alpha: 1, drag: 1.4 });
  }
}

export function updateCombat(dt) {
  updateLoot(dt);
}

/** Used by save/load when hull caps change under the player. */
function reclampVitals() { recalcStats(); }
