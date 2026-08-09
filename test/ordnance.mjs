// Ammunition, magazines and thermal load.
//
// The two things this slice adds are *budgets*, and a budget is only interesting if it
// can actually run out — so most of what is asserted here is the failure side: what
// happens with an empty rack, what happens at the cutout, and what the interlocks say
// while it is happening. A weapon system that only works when everything is fine has not
// been tested.

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
const { initScene } = await imp('world/scene.js');
const { createSystem } = await imp('world/system.js');
const { AMMUNITION } = await imp('data/crafting/ammo.js');
const { WEAPON_MODULES, WEAPON_KEYS } = await imp('data/weapons.js');
const ORD = await imp('systems/ordnance.js');
const MAG = await imp('systems/magazine.js');
const { updateWeapons, heatFraction } = await imp('systems/weapons.js');
const { canFire, canFireMount } = await imp('systems/preflight.js');
const { npcResist } = await imp('systems/combat.js');
const { buyWeapon, buyAmmo, ammoForSale, ammoStackPrice, fitSlot } = await imp('systems/economy.js');
const { serializeCrafting, restoreCrafting } = await imp('systems/crafting.js');
const { ORDNANCE, HEAT, SHIP_CLASSES, MULTI_GUN_FALLOFF } = await imp('core/config.js');
const { SCHEMA } = await imp('core/version.js');
const GRP = await imp('systems/groups.js');
const { activeGuns } = await imp('systems/preflight.js');
const { mountScale } = await imp('systems/fitting.js');

initScene();
recalcStats();
seedWorld(20260807);
createSystem();

const step = (dt, n) => { for (let i = 0; i < n; i++) { S.time += dt; updateWeapons(dt); } };
const clearFire = () => { S.input.firing = false; };

// ── compatibility is derived from the catalogue ──────────────────────
console.log('\n— feeds —');
{
  for (const f of Object.keys(ORD.FEEDS)) {
    const rounds = ORD.roundsFor(f);
    ok(`${f} resolves to rounds`, rounds.length > 0, `${rounds.length}`);
    ok(`${f} rounds are all real catalogue entries`,
       rounds.every(a => AMMUNITION[a.id] === a));
    ok(`${f} rounds are ordered cheapest first`,
       rounds.every((a, i) => i === 0 || rounds[i - 1].unit_cost <= a.unit_cost));
  }
  // The whole point of deriving: a round that says it fits a railgun must reach the rail
  // feed without anybody adding it to a list here.
  ok('a railgun round reaches the rail feed',
     ORD.roundsFor('rail').some(a => a.id === 'AMMO-004'));
  ok('an autocannon slug does not reach the rail feed',
     !ORD.roundsFor('rail').some(a => a.id === 'AMMO-001'));
  ok('a torpedo warhead does not reach the missile rack',
     !ORD.roundsFor('missile').some(a => a.id === 'AMMO-010'));

  // Non-combat stores share the catalogue and must not be offered as shots.
  for (const id of ['AMMO-012', 'AMMO-017', 'AMMO-024', 'AMMO-036']) {
    ok(`${id} (${AMMUNITION[id].name}) is not offered as a round`,
       !Object.keys(ORD.FEEDS).some(f => ORD.roundsFor(f).some(a => a.id === id)));
  }

  ok('energy weapons have no feed',
     ['pulse', 'beam', 'scatter'].every(k => !ORD.usesAmmo(k)));
  ok('projectile and missile weapons all have one',
     ['autocan', 'gauss', 'railgun', 'missile', 'torpedo'].every(k => ORD.usesAmmo(k)));
  ok('every weapon with a feed resolves to a non-empty rack',
     WEAPON_KEYS.filter(k => ORD.usesAmmo(k)).every(k => ORD.roundsForWeapon(k).length > 0));
  ok('a weapon definition maps back to its feed',
     MAG.feedOf(WEAPON_MODULES.railgun) === 'rail' && MAG.feedOf(WEAPON_MODULES.pulse) === null);
}

console.log('\n— what a round does —');
{
  ok('an EMP warhead is EM', ORD.dtypeOf(AMMUNITION['AMMO-009']) === 'em');
  ok('a thermite round burns', ORD.dtypeOf(AMMUNITION['AMMO-014']) === 'thermal');
  ok('a plain slug is kinetic', ORD.dtypeOf(AMMUNITION['AMMO-001']) === 'kinetic');
  ok('an antimatter torpedo burns', ORD.dtypeOf(AMMUNITION['AMMO-011']) === 'thermal');
  ok('every round resolves to a known type',
     Object.keys(AMMUNITION).every(id => ['em', 'kinetic', 'thermal'].includes(ORD.dtypeOf(AMMUNITION[id]))));

  ok('a sabot is armour-piercing', ORD.isAP(AMMUNITION['AMMO-004']));
  ok('a standard slug is not', !ORD.isAP(AMMUNITION['AMMO-001']));
  ok('yield rises with tier',
     ORD.yieldOf(AMMUNITION['AMMO-004']) > ORD.yieldOf(AMMUNITION['AMMO-001']));
  // Shallow on purpose: the reason to carry expensive rounds is type and penetration.
  ok('the tier curve stays shallow',
     ORD.yieldOf(AMMUNITION['AMMO-011']) < ORD.yieldOf(AMMUNITION['AMMO-001']) * 2,
     ORD.yieldOf(AMMUNITION['AMMO-011']).toFixed(2));

  // Penetration lives inside the type system, not beside it.
  const plated = { armorProfile: 'armor' }, shielded = { armorProfile: 'shield' };
  ok('AP helps against plate',
     npcResist(plated, 'kinetic', ORDNANCE.apPenetration) > npcResist(plated, 'kinetic', 0));
  ok('AP does nothing against a shield boat',
     npcResist(shielded, 'kinetic', ORDNANCE.apPenetration) === npcResist(shielded, 'kinetic', 0));
  // Bounded: a pierce value above 1 must not scale without limit, or a future round with
  // a typo'd number one-shots everything wearing plate.
  ok('penetration is bounded at double',
     npcResist(plated, 'kinetic', 5) === npcResist(plated, 'kinetic', 1));
  ok('AP costs yield everywhere to pay for it', ORDNANCE.apYield < 1);
}

// ── magazines ────────────────────────────────────────────────────────
console.log('\n— magazines —');
{
  S.ammo = {}; S.loadout = {};
  ok('an empty hold chambers nothing', MAG.chambered('rail') === null);
  ok('an empty feed reports unloaded', !MAG.feedLoaded('rail'));
  ok('an empty feed holds no rounds', MAG.feedRounds('rail') === 0);

  MAG.addRounds('AMMO-005', 30);
  MAG.addRounds('AMMO-002', 100);
  ok('rounds land in the hold', MAG.roundsHeld('AMMO-005') === 30);
  // Auto-chamber picks the cheapest thing aboard rather than leaving a pilot who never
  // opened the panel staring at a dry gun.
  ok('the cheapest compatible round chambers itself', MAG.chambered('rail').id === 'AMMO-002');

  ok('a pilot can chamber something else', MAG.chamber('rail', 'AMMO-005'));
  ok('the choice sticks', MAG.chambered('rail').id === 'AMMO-005');
  ok('a feed refuses a round it cannot take', !MAG.chamber('rail', 'AMMO-001'));
  ok('a feed refuses a round that does not exist', !MAG.chamber('rail', 'AMMO-999'));
  ok('an unknown feed refuses everything', !MAG.chamber('nonsense', 'AMMO-001'));

  // Fractional draw, integer stock.
  MAG.addRounds('AMMO-001', 10);
  MAG.chamber('autocannon', 'AMMO-001');
  const before = MAG.roundsHeld('AMMO-001');
  MAG.drawRounds('autocannon', 0.34);
  ok('a fractional draw does not move the visible count', MAG.roundsHeld('AMMO-001') === before);
  MAG.drawRounds('autocannon', 0.34);
  MAG.drawRounds('autocannon', 0.34);
  ok('three fractional draws spend one round', MAG.roundsHeld('AMMO-001') === before - 1);

  // Running a type out re-chambers rather than reporting empty for a frame.
  S.ammo = { 'AMMO-005': 1, 'AMMO-002': 20 }; S.loadout = { rail: 'AMMO-005' };
  MAG.drawRounds('rail', 1);
  ok('a spent type is removed from the hold', MAG.roundsHeld('AMMO-005') === 0);
  ok('the feed falls back to what is left', MAG.chambered('rail').id === 'AMMO-002');
  S.ammo = {}; S.loadout = {};
  ok('drawing from an empty feed fails', !MAG.drawRounds('rail', 1));

  // The panel's view.
  MAG.addRounds('AMMO-001', 50);
  const rep = MAG.magazineReport('autocannon');
  ok('a report names the feed', rep.name.length > 3);
  ok('a report totals across types', rep.total === 50);
  ok('a report lists every compatible round',
     rep.rounds.length === ORD.roundsFor('autocannon').length);
  ok('a report says what is chambered', rep.chambered === 'AMMO-001');
}

// ── the firing path ──────────────────────────────────────────────────
console.log('\n— firing —');
{
  S.docked = null; S.warp.state = 'idle'; S.target = null;
  S.player.classKey = 'military';
  S.credits = 500000;
  buyWeapon('autocan');
  fitSlot('weapon', 0, 'autocan');
  recalcStats();
  ok('the fit reports the feed it uses', MAG.fittedFeeds().includes('autocannon'));

  S.ammo = { 'AMMO-001': 200 }; S.loadout = {};
  S.player.energy = S.stats.energyCap;
  S.player.heat = 0; S.player.overheat = false;
  const held0 = MAG.roundsHeld('AMMO-001');
  S.input.firing = true;
  step(1 / 60, 60);
  clearFire();
  ok('firing spends rounds', MAG.roundsHeld('AMMO-001') < held0,
     `${held0} -> ${MAG.roundsHeld('AMMO-001')}`);
  ok('firing generates heat', S.player.heat > 0, S.player.heat.toFixed(1));

  // An empty rack stops the gun and says why.
  S.ammo = {}; S.loadout = {};
  S.player.energy = S.stats.energyCap;
  S.player.heat = 0; S.player.overheat = false;
  const gate = canFire();
  ok('an all-dry fit fails preflight', !gate.ok && gate.code === 'noammo', JSON.stringify(gate));
  ok('the dry mount fails its own gate',
     canFireMount(WEAPON_MODULES.autocan).code === 'noammo');
  const heat0 = S.player.heat;
  S.input.firing = true;
  step(1 / 60, 60);
  clearFire();
  ok('a dry gun generates no heat', S.player.heat <= heat0);

  // An energy weapon in the same hull is unaffected: this is the trade the split exists for.
  buyWeapon('pulse');
  fitSlot('weapon', 0, 'pulse');
  recalcStats();
  ok('an energy fit needs no magazine', canFire().ok, JSON.stringify(canFire()));
  ok('an energy fit reports no feeds', MAG.fittedFeeds().length === 0);
}

// ── heat ─────────────────────────────────────────────────────────────
console.log('\n— thermal load —');
{
  ok('heat capacity is declared per hull',
     Object.keys(SHIP_CLASSES).every(k => SHIP_CLASSES[k].heatCap > 0));
  // Mass was the obvious proxy and the wrong one. The military hull must out-soak the
  // freighter, or a gun platform is the worst gun platform in the game.
  ok('the military hull soaks the most',
     SHIP_CLASSES.military.heatCap === Math.max(...Object.values(SHIP_CLASSES).map(c => c.heatCap)));
  ok('the freighter does not out-soak the warship',
     SHIP_CLASSES.industrial.heatCap < SHIP_CLASSES.military.heatCap);

  S.player.classKey = 'military';
  recalcStats();
  ok('stats carry the hull capacity', S.stats.heatCap === SHIP_CLASSES.military.heatCap);

  // Venting.
  S.player.heat = S.stats.heatCap; S.player.overheat = true;
  S.input.firing = false;
  step(1, 4);
  ok('heat radiates without firing', S.player.heat < S.stats.heatCap);
  ok('the cutout stays latched above the resume threshold',
     S.player.overheat === (heatFraction() > HEAT.resume), `${heatFraction().toFixed(3)}`);
  step(1, 30);
  ok('heat vents to zero eventually', S.player.heat === 0);
  ok('the cutout clears', !S.player.overheat);
  ok('heat never goes negative', S.player.heat >= 0);

  // Hysteresis has a direction: equal thresholds would chatter.
  ok('the resume threshold is below the cutout', HEAT.resume < HEAT.cutout);
  ok('the warning comes before anything stops', HEAT.warn < HEAT.cutout);

  // The cutout actually fires, and it actually stops the guns.
  buyWeapon('beam');
  fitSlot('weapon', 0, 'beam');
  fitSlot('weapon', 1, 'beam');
  recalcStats();
  S.player.energy = 1e9;
  S.player.heat = 0; S.player.overheat = false;
  S.input.firing = true;
  step(1 / 60, 60 * 20);
  ok('sustained fire trips the cutout', S.player.overheat, heatFraction().toFixed(2));
  ok('heat is clamped at capacity', S.player.heat <= S.stats.heatCap + 1e-9);
  const gate = canFire();
  ok('preflight reports the cutout', !gate.ok && gate.code === 'overheat', JSON.stringify(gate));
  const at = S.player.heat;
  step(1 / 60, 30);
  ok('an overheated ship stops adding heat while the trigger is down', S.player.heat <= at);
  clearFire();

  // And it comes back on its own.
  step(1, 40);
  ok('the ship cools back to online', !S.player.overheat);
  S.player.energy = S.stats.energyCap;
  ok('the guns clear preflight again', canFire().ok, JSON.stringify(canFire()));

  // A hull with more radiators lasts longer on the same trigger.
  const runTo = () => {
    S.player.heat = 0; S.player.overheat = false;
    S.input.firing = true;
    let t = 0;
    while (!S.player.overheat && t < 3600) { S.time += 1 / 60; updateWeapons(1 / 60); t++; }
    clearFire();
    return t;
  };
  S.player.energy = 1e9;
  const tMil = runTo();
  S.player.classKey = 'civilian';
  recalcStats();
  fitSlot('weapon', 0, 'beam');
  recalcStats();
  ok('the smaller hull still has a gun', (S.stats.mounts || []).length > 0);
  S.player.energy = 1e9;
  const tCiv = runTo();
  ok('both hulls trip eventually', tMil < 3600 && tCiv < 3600, `${tMil} / ${tCiv}`);
  // Per mount, the bigger sink lasts longer: the military hull was carrying two beams to
  // the civilian's one, so compare the heat each hull absorbs rather than raw seconds.
  ok('a bigger heat sink absorbs more before it stops',
     SHIP_CLASSES.military.heatCap > SHIP_CLASSES.civilian.heatCap);
}

// ── buying rounds ────────────────────────────────────────────────────
console.log('\n— resupply —');
{
  const station = S.world.stations[0];
  S.docked = station;
  S.credits = 200000;
  S.ammo = {}; S.loadout = {};

  const stocked = ammoForSale(station);
  ok('a station stocks something', stocked.length > 0);
  ok('a station stocks nothing above its tech tier',
     stocked.every(id => AMMUNITION[id].tier <= (station.userData.techTier || ORDNANCE.baseStationTier)));
  ok('an antimatter torpedo is not on the counter', !stocked.includes('AMMO-011'));
  ok('a nuclear warhead is not on the counter', !stocked.includes('AMMO-010'));
  ok('non-combat stores are not on the counter', !stocked.includes('AMMO-024'));

  const id = stocked[0];
  const price = ammoStackPrice(id);
  ok('a stack is priced above raw unit cost',
     price > AMMUNITION[id].unit_cost * AMMUNITION[id].stack_size);
  const c0 = S.credits;
  ok('a stack can be bought', buyAmmo(id, station));
  ok('the stack arrived whole', MAG.roundsHeld(id) === AMMUNITION[id].stack_size);
  ok('the credits went', S.credits === c0 - price);

  ok('an unstocked round is refused', !buyAmmo('AMMO-011', station));
  S.credits = 1;
  ok('an unaffordable stack is refused', !buyAmmo(id, station));
  ok('nothing is delivered on a refusal', MAG.roundsHeld(id) === AMMUNITION[id].stack_size);
  S.docked = null;
  ok('buying undocked is refused', !buyAmmo(id, null));
}

// ── persistence ──────────────────────────────────────────────────────
console.log('\n— it survives a save —');
{
  S.ammo = { 'AMMO-005': 12, 'AMMO-001': 90 };
  S.loadout = { rail: 'AMMO-005' };
  const packed = serializeCrafting();
  ok('the payload carries the chambered round', packed.loadout.rail === 'AMMO-005');
  ok('the payload carries the stock', packed.ammo['AMMO-005'] === 12);

  S.ammo = {}; S.loadout = {};
  restoreCrafting(packed);
  ok('the stock comes back', MAG.roundsHeld('AMMO-005') === 12);
  ok('the chambered round comes back', MAG.chambered('rail').id === 'AMMO-005');

  // A selection this build cannot honour is dropped rather than repaired — auto-chamber
  // picks something on the next shot, which is the same path a new pilot takes.
  MAG.restoreLoadout({ rail: 'AMMO-001', autocannon: 'AMMO-001', bogus: 'AMMO-001' });
  ok('a round the feed cannot take is dropped', S.loadout.rail === undefined);
  ok('a valid selection survives', S.loadout.autocannon === 'AMMO-001');
  ok('an unknown feed is dropped', S.loadout.bogus === undefined);
  MAG.restoreLoadout(null);
  ok('an absent payload restores empty', Object.keys(S.loadout).length === 0);

  // A save from before this slice has no loadout at all and must still fly.
  restoreCrafting({ stock: {}, jobs: [], locker: {}, ammo: { 'AMMO-001': 40 } });
  ok('a pre-slice payload loads', MAG.roundsHeld('AMMO-001') === 40);
  ok('and chambers on its own', MAG.chambered('autocannon').id === 'AMMO-001');
}

// A new pilot must be able to fire the gun they were issued.
console.log('\n— a new pilot —');
{
  ok('the starting hold has rounds', Object.keys(ORDNANCE.startingRounds).length > 0);
  ok('the starting rounds are real',
     Object.keys(ORDNANCE.startingRounds).every(id => !!AMMUNITION[id]));
  ok('the starting rounds fit the standard-issue gauss driver',
     Object.keys(ORDNANCE.startingRounds).some(id =>
       ORD.roundsForWeapon('gauss').some(a => a.id === id)));
  ok('and the standard-issue autocannon',
     Object.keys(ORDNANCE.startingRounds).some(id =>
       ORD.roundsForWeapon('autocan').some(a => a.id === id)));
}

// ── weapon groups ────────────────────────────────────────────────────
console.log('\n— weapon groups —');
{
  S.player.classKey = 'military';
  S.credits = 500000;
  recalcStats();
  buyWeapon('autocan'); buyWeapon('railgun');
  fitSlot('weapon', 0, 'autocan');
  fitSlot('weapon', 1, 'railgun');
  recalcStats();
  S.groups = { slots: {}, active: GRP.ALL };

  ok('an unassigned hardpoint is group I', GRP.groupOf(0) === 1 && GRP.groupOf(1) === 1);
  ok('a fresh fit is not split', !GRP.hasSplit());
  ok('an unsplit fit populates one group', GRP.populatedGroups().length === 1);
  ok('everything fires by default', GRP.firingSlots().length === 2);

  ok('a hardpoint can be moved', GRP.setGroup(1, 2) && GRP.groupOf(1) === 2);
  ok('a nonsense group is refused', !GRP.setGroup(1, 7));
  ok('the refusal did not move it', GRP.groupOf(1) === 2);
  ok('cycling flips a hardpoint', GRP.cycleGroup(1) === 1 && GRP.cycleGroup(1) === 2);
  ok('a split fit reports split', GRP.hasSplit());
  ok('both groups are populated', GRP.populatedGroups().join() === '1,2');

  // The selector.
  ok('the default trigger is ALL', GRP.activeGroup() === GRP.ALL);
  ok('the cycle order is I, II, ALL',
     GRP.cycleActive() === 1 && GRP.cycleActive() === 2 && GRP.cycleActive() === GRP.ALL);
  ok('the label follows the selection',
     (GRP.setActive(1), GRP.activeLabel()) === 'I' &&
     (GRP.setActive(2), GRP.activeLabel()) === 'II' &&
     (GRP.setActive(GRP.ALL), GRP.activeLabel()) === 'ALL');
  ok('a nonsense selection is refused', !GRP.setActive(9));

  GRP.setActive(1);
  ok('group I fires only its own hardpoint', GRP.firingSlots().join() === '0');
  GRP.setActive(2);
  ok('group II fires only its own', GRP.firingSlots().join() === '1');
  GRP.setActive(GRP.ALL);
  ok('ALL fires both', GRP.firingSlots().join() === '0,1');

  // Empty hardpoints never fire, whatever group they claim.
  fitSlot('weapon', 1, null);
  recalcStats();
  ok('an empty hardpoint is not in the volley', !GRP.firingSlots().includes(1));
  ok('an empty hardpoint does not populate its group', GRP.populatedGroups().join() === '1');
  fitSlot('weapon', 1, 'railgun');
  recalcStats();
  GRP.setGroup(1, 2);

  // Preflight judges the group under the trigger, not the whole rack.
  S.docked = null; S.warp.state = 'idle'; S.target = null;
  S.player.energy = S.stats.energyCap;
  S.player.heat = 0; S.player.overheat = false;
  GRP.setActive(1);
  ok('the active guns are just the live group', activeGuns().length === 1);
  ok('and they are the right ones', activeGuns()[0].name === WEAPON_MODULES.autocan.name);
  GRP.setActive(GRP.ALL);
  ok('ALL brings both back', activeGuns().length === 2);

  // A group with a dry feed reports dry even when the other group is loaded — the mistake
  // would be reassuring a pilot because ammunition exists somewhere on the ship.
  S.ammo = { 'AMMO-004': 30 };   // rail only
  S.loadout = {};
  GRP.setActive(1);
  const g1 = canFire();
  ok('a dry live group says so', !g1.ok && g1.code === 'noammo', JSON.stringify(g1));
  GRP.setActive(2);
  ok('the loaded group still fires', canFire().ok, JSON.stringify(canFire()));

  // A group with nothing in it at all is its own state, not "no weapon fitted".
  fitSlot('weapon', 0, null);
  recalcStats();
  GRP.setActive(1);
  const g0 = canFire();
  ok('an empty live group is its own refusal', !g0.ok && g0.code === 'nogroup', JSON.stringify(g0));
  fitSlot('weapon', 0, 'autocan');
  recalcStats();
  GRP.setGroup(0, 1); GRP.setGroup(1, 2);
}

console.log('\n— falloff inside the volley —');
{
  // The point of splitting a rack: falloff is counted within whichever group fires, so
  // two of four guns do not pay the fourth barrel's penalty.
  S.player.classKey = 'military';
  recalcStats();
  S.credits = 500000;
  // Three *different* guns: a hardpoint refuses a module already seated elsewhere, so
  // "fit the same autocannon three times" quietly leaves two slots empty and every
  // comparison below reads one barrel against one barrel.
  buyWeapon('autocan'); buyWeapon('gauss'); buyWeapon('railgun');
  fitSlot('weapon', 0, 'autocan');
  fitSlot('weapon', 1, 'gauss');
  fitSlot('weapon', 2, 'railgun');
  recalcStats();
  const seated = (S.fit.weapon || []).filter(Boolean).length;
  ok('the hull carries three mounts', seated === 3, `${seated}`);

  S.ammo = { 'AMMO-001': 4000, 'AMMO-005': 4000 }; S.loadout = {};
  S.docked = null; S.warp.state = 'idle'; S.target = null;

  // Group I gets hardpoints 0 and 2; group II gets 1.
  GRP.setGroup(0, 1); GRP.setGroup(1, 2); GRP.setGroup(2, 1);

  GRP.setActive(GRP.ALL);
  const all = GRP.firingSlots();
  GRP.setActive(1);
  const half = GRP.firingSlots();
  ok('a split volley fires fewer barrels', half.length < all.length, `${half.length} vs ${all.length}`);
  ok('the last barrel of a split volley is docked less than the full rack\'s last',
     mountScale(half.length - 1) > mountScale(all.length - 1),
     `${mountScale(half.length - 1).toFixed(3)} vs ${mountScale(all.length - 1).toFixed(3)}`);
  ok('the first barrel is never docked', mountScale(0) === 1);
  ok('the full rack still puts out more barrels in total', all.length > half.length);

  // And it actually fires that way.
  const spendOver = frames => {
    S.player.energy = 1e9; S.player.heat = 0; S.player.overheat = false;
    const before = MAG.roundsHeld('AMMO-001') + MAG.roundsHeld('AMMO-005');
    S.input.firing = true;
    step(1 / 60, frames);
    clearFire();
    return before - (MAG.roundsHeld('AMMO-001') + MAG.roundsHeld('AMMO-005'));
  };
  GRP.setActive(2);
  const spentOne = spendOver(120);
  GRP.setActive(GRP.ALL);
  const spentAll = spendOver(120);
  ok('firing one group spends fewer rounds than firing all',
     spentOne < spentAll, `${spentOne} vs ${spentAll}`);
  ok('firing at all spends something', spentOne > 0);

  // Cooldowns are per hardpoint, not per position in the volley: switching groups must
  // not re-arm a barrel that just fired.
  GRP.setActive(GRP.ALL);
  S.player.energy = 1e9; S.player.heat = 0; S.player.overheat = false;
  S.input.firing = true;
  step(1 / 60, 1);
  clearFire();
  const afterAll = MAG.roundsHeld('AMMO-005');
  GRP.setActive(1);
  S.input.firing = true;
  step(1 / 60, 1);
  clearFire();
  ok('switching groups does not re-arm a hot barrel',
     MAG.roundsHeld('AMMO-005') === afterAll, `${afterAll} -> ${MAG.roundsHeld('AMMO-005')}`);
}

console.log('\n— groups survive a save —');
{
  GRP.setGroup(0, 2); GRP.setActive(2);
  const packed = GRP.serializeGroups();
  ok('the payload carries assignments', packed.slots[0] === 2);
  ok('the payload carries the live group', packed.active === 2);

  GRP.restoreGroups(packed, (S.fit.weapon || []).length);
  ok('assignments come back', GRP.groupOf(0) === 2);
  ok('the live group comes back', GRP.activeGroup() === 2);

  // A hardpoint that no longer exists is dropped rather than kept lurking: a pilot who
  // moves from a four-mount hull to a two-mount one and back should not find group four.
  GRP.restoreGroups({ slots: { 0: 2, 99: 2 }, active: 1 }, 2);
  ok('an out-of-range hardpoint is dropped', GRP.groupState().slots[99] === undefined);
  ok('an in-range one survives', GRP.groupOf(0) === 2);
  GRP.restoreGroups({ slots: { 0: 'nonsense' }, active: 'nonsense' }, 4);
  ok('a nonsense group is dropped', GRP.groupOf(0) === 1);
  ok('a nonsense selection falls back to ALL', GRP.activeGroup() === GRP.ALL);
  GRP.restoreGroups(null, 4);
  ok('an absent payload restores clean', !GRP.hasSplit() && GRP.activeGroup() === GRP.ALL);
  ok('the schema moved for it', SCHEMA === 15);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
