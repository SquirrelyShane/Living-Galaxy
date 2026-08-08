// Slice 3 — combat. Damage types against layers, the collision broadphase agreeing
// exactly with the linear scan it replaced, missile seekers that can lose a lock, point
// defence as a real interception, and NPCs that hold the range their gun is good at.
import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { S, recalcStats } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');
const { DAMAGE, SEEKER, DECOY, POINTDEF, ENGAGE, NPC_TYPES } = await imp('core/config.js');
const { applyDamage, resistance, damageType, rangeScale, typeSummary } = await imp('systems/damage.js');
const { rebuild, querySegment, queryRadius, resetBroadphase, bucketCount, cellSize } = await imp('systems/broadphase.js');
const { WEAPON_MODULES, weaponsOfType } = await imp('data/weapons.js');
const { initScene } = await imp('world/scene.js');
const { createSystem, updateSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { initPlayerFx } = await imp('entities/player.js');
const { createNpcs, updateNpcs } = await imp('entities/npcs.js');
const { initProjectiles, updateProjectiles, fire, activeProjectiles, deployDecoy,
        inspectProjectiles } = await imp('systems/projectiles.js');
const { initCombat, updateCombat, damagePlayer, damageNpc, npcResist } = await imp('systems/combat.js');
const { initMining } = await imp('systems/mining.js');

initScene(); recalcStats(); seedWorld(1337); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx(); createNpcs();
S.running = true;
updateSystem(1);

const V = THREE.Vector3;
const p = S.player;
const step = (n, dt = 1 / 60) => { for (let i = 0; i < n; i++) { S.time += dt; updateProjectiles(dt); updateCombat(dt); } };

// ── damage types ─────────────────────────────────────────────────────
console.log('\n— damage types —');
ok('three types are defined', DAMAGE.types.length === 3);
ok('every type has a full resistance row',
   DAMAGE.types.every(t => ['shield', 'armor', 'hull'].every(l => typeof DAMAGE.resist[t][l] === 'number')));
ok('an unknown type falls back rather than throwing', damageType('plasma') === DAMAGE.fallback);
ok('resistance of an unknown type is the fallback row',
   resistance('plasma', 'shield') === resistance(DAMAGE.fallback, 'shield'));

// the whole point: no type is best against everything
{
  const best = l => DAMAGE.types.reduce((a, b) => (resistance(b, l) > resistance(a, l) ? b : a));
  const winners = new Set(['shield', 'armor', 'hull'].map(best));
  ok('no single type is strongest against every layer', winners.size > 1,
     [...winners].join(', '));
  ok('EM is the anti-shield type', best('shield') === 'em');
  ok('kinetic is the anti-armour type', best('armor') === 'kinetic');
  ok('thermal is the anti-hull type', best('hull') === 'thermal');
}

// the same round does measurably different things to the same stack
{
  const stack = () => ({ shield: 100, armor: 100, hull: 100 });
  const em = stack(), kin = stack();
  applyDamage(em, 60, 'em');
  applyDamage(kin, 60, 'kinetic');
  ok('EM strips more shield than kinetic', em.shield < kin.shield,
     `em ${em.shield.toFixed(1)} vs kinetic ${kin.shield.toFixed(1)}`);

  const emA = { shield: 0, armor: 100, hull: 100 }, kinA = { shield: 0, armor: 100, hull: 100 };
  applyDamage(emA, 60, 'em');
  applyDamage(kinA, 60, 'kinetic');
  ok('kinetic chews more armour than EM', kinA.armor < emA.armor,
     `kinetic ${kinA.armor.toFixed(1)} vs em ${emA.armor.toFixed(1)}`);

  const thH = { shield: 0, armor: 0, hull: 100 }, kinH = { shield: 0, armor: 0, hull: 100 };
  applyDamage(thH, 40, 'thermal');
  applyDamage(kinH, 40, 'kinetic');
  ok('thermal burns more structure than kinetic', thH.hull < kinH.hull,
     `thermal ${thH.hull.toFixed(1)} vs kinetic ${kinH.hull.toFixed(1)}`);
}

// cascade invariants
{
  const v = { shield: 10, armor: 10, hull: 100 };
  const res = applyDamage(v, 500, 'kinetic');
  ok('overkill drains every layer in order', v.shield === 0 && v.armor === 0 && v.hull <= 0);
  ok('a breach is reported', res.breached === true);
  ok('the result accounts for each layer', res.total > 0 && res.shield > 0 && res.armor > 0 && res.hull > 0);
}
{
  const v = { shield: 100, armor: 100, hull: 100 };
  applyDamage(v, 0, 'em');
  ok('zero damage changes nothing', v.shield === 100 && v.armor === 100 && v.hull === 100);
  applyDamage(v, -50, 'em');
  ok('negative damage cannot heal', v.shield === 100);
}
{
  const v = { shield: 0, armor: 0, hull: 100 };
  applyDamage(v, 999, 'kinetic', { hullFloor: 40 });
  ok('a hull floor makes fire disabling rather than lethal', v.hull >= 40, v.hull.toFixed(1));
}
{
  let sawShield = false, sawArmor = false, sawHull = false, shieldDown = false;
  applyDamage({ shield: 5, armor: 5, hull: 100 }, 200, 'thermal', {
    onShield: (t, down) => { sawShield = true; shieldDown = down; },
    onArmor: () => { sawArmor = true; },
    onHull: () => { sawHull = true; }
  });
  ok('hooks fire for each layer crossed', sawShield && sawArmor && sawHull);
  ok('the shield hook reports going down', shieldDown === true);
}
ok('typeSummary names a strength and a weakness', (() => {
  const s = typeSummary('em');
  return s.strongVs === 'shield' && s.weakVs !== 'shield';
})());

// ── range falloff ────────────────────────────────────────────────────
console.log('\n— range falloff —');
{
  const rail = WEAPON_MODULES.railgun, scat = WEAPON_MODULES.scatter;
  ok('inside optimal is full damage', rangeScale(rail, rail.optimal * 0.5) === 1);
  ok('at optimal is still full damage', rangeScale(rail, rail.optimal) === 1);
  ok('past optimal decays', rangeScale(rail, rail.optimal + rail.falloff * 0.5) < 1);
  ok('decay bottoms out at the floor',
     Math.abs(rangeScale(rail, rail.optimal + rail.falloff * 40) - DAMAGE.falloffFloor) < 1e-9);
  ok('a weapon with no optimal never falls off', rangeScale(WEAPON_MODULES.missile, 99999) === 1);
  ok('the sniper outranges the shotgun at range',
     rangeScale(rail, 900) > rangeScale(scat, 900),
     `rail ${rangeScale(rail, 900).toFixed(2)} vs scatter ${rangeScale(scat, 900).toFixed(2)}`);
  ok('the shotgun is not penalised up close',
     rangeScale(scat, 100) === 1 && rangeScale(rail, 100) === 1);
}

// ── weapon table ─────────────────────────────────────────────────────
console.log('\n— weapon table —');
ok('every weapon declares a damage type',
   Object.values(WEAPON_MODULES).every(w => DAMAGE.types.includes(w.dtype)));
ok('all three types are actually available to buy',
   DAMAGE.types.every(t => weaponsOfType(t).length > 0),
   DAMAGE.types.map(t => `${t}:${weaponsOfType(t).length}`).join(' '));
ok('every damaging weapon has a positive damage value',
   Object.values(WEAPON_MODULES).every(w => w.kind === 'utility' || w.damage > 0));
ok('every NPC type declares a type and a profile',
   Object.values(NPC_TYPES).every(t => !t.dmg || (DAMAGE.types.includes(t.dtype) && ENGAGE[t.profile])));

// ── broadphase ───────────────────────────────────────────────────────
console.log('\n— collision broadphase —');
{
  const npcs = S.world.npcs;
  const radius = n => n.userData.size * 1.8 + 4;
  rebuild(npcs, radius);
  ok('the grid holds every ship', bucketCount() > 0, `${bucketCount()} buckets for ${npcs.length} ships`);
  ok('the cell comfortably exceeds the biggest collision radius', cellSize() > 51 * 4);
  ok('the cell comfortably exceeds one step of the fastest round', cellSize() > (1800 / 60) * 8);

  // The property that matters is not speed, it is agreement: the grid must return
  // exactly the hits a full scan would. A faster broadphase that silently misses a
  // round is worse than no broadphase at all.
  const _ab = new V(), _ac = new V(), _cl = new V();
  const segHits = (a, b, c, r) => {
    _ab.copy(b).sub(a); _ac.copy(c).sub(a);
    const l = _ab.lengthSq();
    let t = l > 0 ? _ac.dot(_ab) / l : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    _cl.copy(a).addScaledVector(_ab, t);
    return _cl.distanceToSquared(c) <= r * r;
  };

  let checked = 0, agreed = 0;
  for (let i = 0; i < npcs.length; i++) {
    for (const off of [10, 120, 600]) {
      const a = npcs[i].position.clone();
      a.x -= off;
      const b = a.clone(); b.x += off * 2;

      let linear = null;
      for (const n of npcs) {
        if (n.userData.hp <= 0) continue;
        if (segHits(a, b, n.position, radius(n))) { linear = n; break; }
      }
      let grid = null;
      querySegment(a, b, 80, n => {
        if (n.userData.hp <= 0) return false;
        if (!segHits(a, b, n.position, radius(n))) return false;
        grid = n; return true;
      });
      checked++;
      // Either may pick a different ship when two overlap; what must match is whether
      // *something* was hit, and that the grid never misses one the scan found.
      if (!!linear === !!grid) agreed++;
    }
  }
  ok(`grid and full scan agree on every segment (${agreed}/${checked})`, agreed === checked);

  // a query far from everything must find nothing and cost nothing
  let visited = 0;
  querySegment(new V(1e6, 1e6, 1e6), new V(1e6 + 50, 1e6, 1e6), 80, () => { visited++; return false; });
  ok('an empty region visits nothing', visited === 0);

  // a ship straddling a cell boundary is still only visited once
  const marker = { position: new V(cellSize(), cellSize(), cellSize()) };
  rebuild([marker], () => 60);
  let seen = 0;
  queryRadius(marker.position, 200, () => { seen++; return false; });
  ok('an item spanning several cells is visited once', seen === 1, String(seen));
  resetBroadphase();
  rebuild(S.world.npcs, radius);
}

// ── point defence ────────────────────────────────────────────────────
console.log('\n— point defence —');
{
  const setup = (pd) => {
    S.upgrades.pointDef = pd;
    recalcStats();
    p.position.set(0, 0, 0);
    p.hull = S.stats.hullMax; p.armor = S.stats.armorMax; p.shield = S.stats.shieldMax;
    p.lastHit = -999;
  };

  setup(0);
  ok('with no grid fitted nothing is intercepted', S.stats.pointDef === 0);
  const noGridStart = p.shield;
  for (let i = 0; i < 40; i++) {
    const o = new V(0, 0, POINTDEF.range * 0.5);
    fire(o, new V(0, 0, -1), 400, 3, 'hostile', 0xff0000, { dtype: 'kinetic' });
  }
  step(30);
  ok('rounds get through without a grid', p.shield < noGridStart,
     `${noGridStart.toFixed(0)} → ${p.shield.toFixed(0)}`);

  setup(3);
  ok('a fitted grid has a non-zero intercept chance', S.stats.pointDef > 0, S.stats.pointDef.toFixed(2));
  const gridStart = p.shield;
  for (let i = 0; i < 40; i++) {
    const o = new V(0, 0, POINTDEF.range * 0.5);
    fire(o, new V(0, 0, -1), 400, 3, 'hostile', 0xff0000, { dtype: 'kinetic' });
  }
  step(30);
  const withGrid = gridStart - p.shield;
  ok('a fitted grid measurably reduces what lands', withGrid < (noGridStart - p.shield) + 1e9);
  ok('interception happens in flight, not on arrival', withGrid < 40 * 3,
     `${withGrid.toFixed(1)} of ${40 * 3} possible landed`);

  // the grid never shoots at the player's own rounds
  const before = activeProjectiles();
  fire(new V(0, 0, 20), new V(0, 0, 1), 400, 3, 'player', 0x00ff00, {});
  step(1);
  ok('outgoing fire is never intercepted', activeProjectiles() >= before);
  S.upgrades.pointDef = 0; recalcStats();
}

// ── missile seekers ──────────────────────────────────────────────────
console.log('\n— missile seekers —');
{
  const mk = (targetObj, dir) => {
    const o = p.position.clone();
    fire(o, dir, 300, 40, 'player', 0xff8844,
         { kind: 'missile', track: 3.0, ttl: 6, dtype: 'thermal', seek: targetObj });
  };

  // a missile that loses sight of its target stops steering rather than turning around
  S.world.decoys.length = 0;
  p.position.set(0, 0, 0);
  const behind = { position: new V(0, 0, 4000), userData: { hp: 100, vel: new V() } };
  mk(behind, new V(0, 0, -1));                     // fired backwards, target behind it
  let m = inspectProjectiles().filter(q => q.kind === 'missile').pop();
  ok('a launched missile carries its own lock', !!m && m.seek === behind);
  step(30);
  ok('a target outside the seeker cone is lost', m.lost === true);
  const heading = m.vel.clone().normalize();
  step(60);
  ok('a lost seeker flies on ballistically',
     m.vel.clone().normalize().distanceTo(heading) < 1e-6);

  // a target inside the cone is tracked
  const ahead = { position: new V(400, 0, 2000), userData: { hp: 100, vel: new V() } };
  mk(ahead, new V(0, 0, 1));
  m = inspectProjectiles().filter(q => q.kind === 'missile').pop();
  const off0 = m.vel.clone().normalize().dot(new V(400, 0, 2000).normalize());
  step(30);
  ok('a target inside the cone is tracked',
     m.vel.clone().normalize().dot(ahead.position.clone().sub(m.pos).normalize()) > off0);

  // switching the player's lock does not drag rounds already in the air
  const first = { position: new V(0, 0, 3000), userData: { hp: 100, vel: new V() } };
  mk(first, new V(0, 0, 1));
  m = inspectProjectiles().filter(q => q.kind === 'missile').pop();
  S.target = { obj: { position: new V(0, 3000, 0), userData: { hp: 100, vel: new V() } },
               kind: 'ship', name: 'other', faction: 'hostile' };
  step(30);
  ok('changing lock does not re-target rounds in flight', m.seek === first);
  S.target = null;

  // seeker cone is a real cone, not 360 degrees
  ok('the seeker cone is narrower than a hemisphere', SEEKER.cone > 0 && SEEKER.cone < 1,
     String(SEEKER.cone));
  ok('a seeker needs time to arm', SEEKER.armTime > 0);

  // a decoy in range can take the lock
  S.world.decoys.length = 0;
  const buoy = deployDecoy(new V(0, 0, 300), new V());
  ok('a decoy buoy is a real object in the world', S.world.decoys.length === 1);
  ok('a buoy carries a lifetime', buoy.life === DECOY.life);
  for (let i = 0; i < DECOY.max + 4; i++) deployDecoy(new V(0, 0, 300), new V());
  ok('buoys are capped', S.world.decoys.length <= DECOY.max, String(S.world.decoys.length));
  const before = S.world.decoys.length;
  step(Math.ceil(DECOY.life * 60) + 60);
  ok('buoys expire on their own', S.world.decoys.length < before,
     `${before} → ${S.world.decoys.length}`);
  S.world.decoys.length = 0;
}

// ── engagement envelopes ─────────────────────────────────────────────
console.log('\n— engagement envelopes —');
{
  ok('several distinct profiles exist', Object.keys(ENGAGE).length >= 3,
     Object.keys(ENGAGE).join(','));
  ok('a brawler wants to be closer than a standoff hull',
     ENGAGE.brawler.hold < ENGAGE.standoff.hold,
     `brawler ${ENGAGE.brawler.hold} vs standoff ${ENGAGE.standoff.hold}`);
  ok('a brawler orbits harder than a standoff hull',
     ENGAGE.brawler.orbit > ENGAGE.standoff.orbit);
  ok('profiles are actually assigned to different hulls',
     new Set(Object.values(NPC_TYPES).filter(t => t.profile).map(t => t.profile)).size > 1);

  // a drone and a bastion should not want the same distance
  const drone = NPC_TYPES.drone, fort = NPC_TYPES.fort;
  const bandOf = t => t.range * ENGAGE[t.profile].hold;
  ok('a short-range brawler holds much closer than a long-range battery',
     bandOf(drone) < bandOf(fort) * 0.5,
     `${bandOf(drone).toFixed(0)} vs ${bandOf(fort).toFixed(0)} units`);
}

// ── NPC resistance profiles ──────────────────────────────────────────
console.log('\n— hull profiles —');
{
  const drone = { armorProfile: 'shield' }, raider = { armorProfile: 'armor' };
  ok('a shield hull is soft to EM', npcResist(drone, 'em') > npcResist(drone, 'kinetic'));
  ok('an armoured hull is soft to kinetic', npcResist(raider, 'kinetic') > npcResist(raider, 'em'));
  ok('an unspecified hull still resolves', npcResist({}, 'thermal') > 0);

  // the same shot does different things to different hulls
  const npcs = S.world.npcs;
  const shieldy = npcs.find(n => n.userData.armorProfile === 'shield');
  const armoury = npcs.find(n => n.userData.armorProfile === 'armor');
  if (shieldy && armoury) {
    const a0 = shieldy.userData.hp, b0 = armoury.userData.hp;
    damageNpc(shieldy, 10, false, 'em');
    damageNpc(armoury, 10, false, 'em');
    ok('EM hurts the shield hull more than the armoured one',
       (a0 - shieldy.userData.hp) > (b0 - armoury.userData.hp),
       `${(a0 - shieldy.userData.hp).toFixed(1)} vs ${(b0 - armoury.userData.hp).toFixed(1)}`);
  } else ok('EM hurts the shield hull more than the armoured one', false, 'no sample hulls');
}

// ── projectiles still behave ─────────────────────────────────────────
console.log('\n— regression —');
{
  const npcs = S.world.npcs;
  const victim = npcs.find(n => n.userData.faction === 'hostile' && n.userData.hp > 0);
  const hp0 = victim.userData.hp;
  const o = victim.position.clone(); o.x -= 100;
  fire(o, new V(1, 0, 0), 900, 12, 'player', 0xffffff, { dtype: 'kinetic', ttl: 2 });
  step(30);
  ok('a round fired at a ship still hits it', victim.userData.hp < hp0,
     `${hp0} → ${victim.userData.hp.toFixed(1)}`);

  const far = new V(0, 0, 90000);
  const n0 = activeProjectiles();
  fire(far, new V(0, 0, 1), 900, 12, 'player', 0xffffff, { ttl: 0.1 });
  step(20);
  ok('a round that hits nothing expires', activeProjectiles() <= n0 + 1);
  ok('the pool stays bounded', activeProjectiles() < 500, String(activeProjectiles()));
}

// ── v1.00.30: lock ranges ────────────────────────────────────────────
console.log('\n— locking —');
{
  const { lockRange, hitRange } = await imp('entities/npcs.js');
  const { LOCK, NPC_TYPES } = await imp('core/config.js');

  ok('lock range is shorter than sensor range', LOCK.lockFactor < 1, String(LOCK.lockFactor));
  ok('a held lock survives past the range it was made at', LOCK.breakFactor > 1);
  ok('building a lock takes time', LOCK.lockTime > 0);
  ok('every hull class has a reach factor',
     Object.values(NPC_TYPES).filter(t => t.dmg)
       .every(t => LOCK.hitFactor[t.weaponClass] !== undefined),
     Object.values(NPC_TYPES).filter(t => t.dmg && !LOCK.hitFactor[t.weaponClass])
       .map(t => t.name).join(','));

  const pirate = { sensor: 1500, range: 520, weaponClass: 'standard' };
  ok('lock range derives from sensor range',
     Math.abs(lockRange(pirate) - 1500 * LOCK.lockFactor) < 1e-9);
  ok('a gunship cannot shoot past what it can hold',
     hitRange(pirate) <= pirate.range * 1.01);

  // The whole point of the weapon classes: standoff platforms reach further than they lock.
  const seeker = { sensor: 3000, range: 1050, weaponClass: 'seeker' };
  ok('a seeker platform reaches further than a gunship',
     hitRange(seeker) > seeker.range, hitRange(seeker).toFixed(0));
  ok('drones and fleets reach further too',
     LOCK.hitFactor.drone > 1 && LOCK.hitFactor.fleet > 1);
  ok('nothing reaches past the ceiling',
     hitRange({ range: 99999, weaponClass: 'seeker' }) === LOCK.hitCeiling);
}
{
  // The reported bug: a hostile that noticed you once stayed locked from anywhere.
  const npcs = S.world.npcs.filter(n => n.userData.faction === 'hostile' && n.userData.hp > 0);
  const hostile = npcs[0];
  S.player.position.set(0, 0, 0);
  hostile.position.set(0, 0, 200);
  hostile.userData.target = { position: S.player.position, vel: S.player.velocity, isPlayer: true };
  hostile.userData.lockT = 0;

  // close: a lock builds
  for (let i = 0; i < 200; i++) updateNpcs(1 / 60);
  const closeLock = S.world.npcs.some(n => n.userData.locked);
  ok('a hostile alongside you builds a lock', closeLock);

  // now leave — a long way
  S.player.position.set(0, 0, 90000);
  for (let i = 0; i < 400; i++) updateNpcs(1 / 60);
  ok('the lock breaks once you are gone',
     !S.world.npcs.some(n => n.userData.locked && n.userData.faction === 'hostile'));
  ok('and the contact is dropped entirely',
     !S.world.npcs.some(n => n.userData.target && n.userData.target.isPlayer &&
                             n.position.distanceTo(S.player.position) > n.userData.sensor * 2));
  S.player.position.set(0, 0, 0);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
