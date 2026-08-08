// Living Galaxy — stations: sell what you hauled, patch the hull, bolt on refits.

import { S, recalcStats, cargoMass, seatWeapon } from '../core/state.js';
import { witnessTrade } from './npc-brain.js';
import { DOCK, COMMODITIES, TRADE_MULT, REPAIR_COST, UPGRADES, PROBE, SHIP_PRICE, SHIP_CLASSES, ORDNANCE } from '../core/config.js';
import { fmtCr, aimAngles } from '../core/utils.js';
import { WEAPON_MODULES } from '../data/weapons.js';
import { MODULES } from '../data/modules.js';
import { AMMUNITION } from '../data/crafting/ammo.js';
import { FEEDS } from './ordnance.js';
import { addRounds } from './magazine.js';
import { marketPrice, applyTrade } from './market.js';
import { dockingAllowed, tradeScale, standingLabel, standing } from './reputation.js';
import { practice, hasCharacter, hasLicence } from './character.js';
import { creditDelivery } from './contracts.js';
import { crewEvent } from './crew.js';
import { toast, status } from '../ui/toast.js';
import { sfx } from './audio.js';
import { clearTarget } from './targeting.js';

/** Station in docking range at docking speed, or null. */
export function updateDocking(dt = 0) {
  if (S.dockCooldown > 0) { S.dockCooldown -= dt; S.dockCandidate = null; return; }
  if (S.docked) { S.dockCandidate = null; return; }
  if (S.player.velocity.length() > DOCK.maxSpeed || S.warp.state !== 'idle') { S.dockCandidate = null; return; }
  let best = null, bd = DOCK.range * DOCK.range;
  for (const st of S.world.stations) {
    const d = st.position.distanceToSquared(S.player.position);
    if (d < bd) { bd = d; best = st; }
  }
  S.dockCandidate = best;
}

export function dock(station) {
  const st = station || S.dockCandidate;
  if (!st) return false;
  // Standing now decides whether the pad opens at all. Shoot enough patrols and the
  // Coalition stops selling you fuel — which is the first real cost of a reputation
  // that has nowhere left to fall.
  if (!dockingAllowed('coalition')) {
    toast(`${st.userData.name} refuses the pad — Coalition standing ${standingLabel(standing('coalition')).toLowerCase()}`, 4500);
    return false;
  }
  // Docking through MATCH left station-keeping live — it snapped the ship back to
  // the station every frame after undocking, which read as "unable to undock".
  S.follow = null;
  S.orbit = null;
  S.approach = null;
  S.docking = null;
  S.docked = st;
  S.player.throttle = 0;
  S.player.velocity.set(0, 0, 0);
  clearTarget();
  sfx.dock();
  status(`Docked — ${st.userData.name}`);
  return true;
}

export function undock() {
  if (!S.docked) return;
  const st = S.docked, u = st.userData, name = u.name;
  const p = S.player;

  // Release the tractor: place the ship clear of the hull, pointed and moving
  // outward at a real cruising speed so it visibly departs under its own power.
  const out = p.position.clone().sub(st.position);
  if (out.lengthSq() < 1) out.set(0, 1, 0);
  out.normalize();
  const clear = (u.radius || 30) * 2.4 + 60;
  p.position.copy(st.position).addScaledVector(out, clear);
  p.position.y += (u.radius || 30) * 0.4;

  const ang = aimAngles(out);          // face the way we're leaving
  p.yaw = ang.yaw;
  p.pitch = 0;
  p.autoLevel = true;
  p.velocity.copy(out).multiplyScalar(S.stats.maxSpeed * 0.5);
  p.throttle = 0.3;                    // hands-free coast until the pilot takes over

  S.follow = null; S.orbit = null; S.approach = null; S.docking = null;
  S.dockCooldown = 6;                  // long enough to clear the dock trigger
  S.docked = null;
  p.energy = S.stats.energyCap;
  status(`Departing ${name} — throttle is yours`);
  sfx.ui();
}

// ── trade ────────────────────────────────────────────────────────────
export function priceFor(station, key) {
  // Standing tilts the book a little in your favour, or against it.
  return marketPrice(station, key) * tradeScale('coalition');
}

export function sell(key, station = S.docked) {
  if (!station) return 0;
  const kg = Math.round(S.cargo[key]);
  if (kg <= 0) { toast(`No ${COMMODITIES[key].name.toLowerCase()} aboard`); sfx.deny(); return 0; }
  const value = kg * priceFor(station, key);
  S.cargo[key] = 0;
  S.credits += value;
  applyTrade(station, key, kg, true);   // dumping volume moves the price
  creditDelivery(station, key, kg);     // haul and supply contracts are credited here
  // Practice scales with the *value* of the trade, not the tonnage — a broker learns
  // from the size of the deal, not from how heavy it was.
  practice('commerce', Math.sqrt(Math.max(0, value)) * 0.12);
  crewEvent('trade', 'purser', Math.min(3, value / 6000));
  // The station's purser remembers who deals here and how big.
  witnessTrade(station.userData && station.userData.name, value);
  sfx.pickup();
  toast(`Sold ${kg} kg of ${COMMODITIES[key].name.toLowerCase()} for ${fmtCr(value)}`);
  return value;
}

export function sellAll(station = S.docked) {
  let total = 0;
  for (const key in COMMODITIES) if (S.cargo[key] >= 0.5) total += sell(key, station);
  if (!total) toast('Hold is empty');
  return total;
}

// ── service ──────────────────────────────────────────────────────────
export function buyProbe(station = S.docked) {
  if (!station) return false;
  if (S.credits < PROBE.cost) { toast(`A probe costs ${fmtCr(PROBE.cost)}`); sfx.deny(); return false; }
  S.credits -= PROBE.cost;
  S.probes++;
  sfx.pickup();
  toast(`Probe loaded — ${S.probes} aboard`);
  return true;
}

/**
 * Buy rounds at a station. Priced off the blueprint's own `unit_cost` with a station
 * markup, sold by the stack the catalogue declares — a pilot buys "a stack of slugs",
 * not 137 slugs, and the stack size is already a designed number.
 *
 * Stations stock what they can plausibly make: tier is capped by the station's own tech
 * level, so an antimatter torpedo is a manufacturing problem rather than a shopping trip.
 * That is the point of the ammunition tree existing in the crafting database at all.
 */
export function ammoStackPrice(id) {
  const a = AMMUNITION[id];
  if (!a) return 0;
  return Math.round((a.unit_cost || 0) * (a.stack_size || 1) * ORDNANCE.stationMarkup);
}

export function ammoForSale(station = S.docked) {
  const cap = station && station.userData ? (station.userData.techTier || ORDNANCE.baseStationTier)
                                          : ORDNANCE.baseStationTier;
  return Object.keys(AMMUNITION)
    .filter(id => (AMMUNITION[id].tier || 1) <= cap)
    .filter(id => Object.values(FEEDS).some(f =>
      f.match.some(m => (AMMUNITION[id].compatible || []).join(" | ").includes(m))))
    .sort((a, b) => (AMMUNITION[a].tier - AMMUNITION[b].tier) || (AMMUNITION[a].unit_cost - AMMUNITION[b].unit_cost));
}

export function buyAmmo(id, station = S.docked) {
  if (!station) return false;
  const a = AMMUNITION[id];
  if (!a) return false;
  if (!ammoForSale(station).includes(id)) {
    toast(`${a.name} is not stocked here`); sfx.deny(); return false;
  }
  const price = ammoStackPrice(id);
  if (S.credits < price) { toast(`A stack costs ${fmtCr(price)}`); sfx.deny(); return false; }
  S.credits -= price;
  addRounds(id, a.stack_size || 1);
  sfx.pickup();
  toast(`${a.name} \u00d7${a.stack_size} loaded`);
  return true;
}

export function repairQuote() {
  const p = S.player, st = S.stats;
  const armor = Math.max(0, st.armorMax - p.armor);
  const hull = Math.max(0, st.hullMax - p.hull);
  return {
    armor, hull,
    cost: Math.ceil((armor * REPAIR_COST.armor + hull * REPAIR_COST.hull) *
                    (1 - Math.min(0.5, (S.stats.repairDiscount || 0))))
  };
}

export function repair() {
  const q = repairQuote();
  if (q.cost <= 0) { toast('Hull and armor already intact'); return false; }
  if (S.credits < q.cost) { toast(`Repair needs ${fmtCr(q.cost)}`); sfx.deny(); return false; }
  S.credits -= q.cost;
  practice('engineering', (q.armor + q.hull) * 0.05);
  crewEvent('repair', 'medic');
  S.player.armor = S.stats.armorMax;
  S.player.hull = S.stats.hullMax;
  S.player.shield = S.stats.shieldMax;
  sfx.dock();
  toast(`Repaired for ${fmtCr(q.cost)}`);
  return true;
}

// ── refit ────────────────────────────────────────────────────────────
export function upgradeCost(key) {
  const u = UPGRADES[key];
  return Math.round(u.base * Math.pow(u.scale, S.upgrades[key]));
}

export function upgradeLocked(key) {
  const u = UPGRADES[key];
  if (!u.req) return false;
  const [dep, lvl] = u.req;
  return S.upgrades[dep] < lvl;
}

export function upgradeReqText(key) {
  const u = UPGRADES[key];
  if (!u.req) return '';
  const [dep, lvl] = u.req;
  return `needs ${UPGRADES[dep].name} L${lvl}`;
}

export function canUpgrade(key) {
  return S.upgrades[key] < UPGRADES[key].max && !upgradeLocked(key) && S.credits >= upgradeCost(key);
}

export function buyUpgrade(key) {
  const u = UPGRADES[key];
  if (S.upgrades[key] >= u.max) { toast(`${u.name} already maxed`); return false; }
  if (upgradeLocked(key)) { toast(`${u.name} — ${upgradeReqText(key)}`); sfx.deny(); return false; }
  const cost = upgradeCost(key);
  if (S.credits < cost) { toast(`${u.name} costs ${fmtCr(cost)}`); sfx.deny(); return false; }
  S.credits -= cost;
  S.upgrades[key]++;
  recalcStats();
  if (key === 'shield') S.player.shield = S.stats.shieldMax;
  if (key === 'armor') S.player.armor = S.stats.armorMax;
  sfx.pickup();
  toast(`${u.name} → level ${S.upgrades[key]}`);
  return true;
}

/** Switching hull at a station: cargo above the new capacity is jettisoned. */
export function ownsWeapon(key) {
  return WEAPON_MODULES[key] && (WEAPON_MODULES[key].price === 0 || !!S.ownedWeapons[key]);
}

export function buyWeapon(key) {
  const w = WEAPON_MODULES[key];
  if (!w) return false;
  if (ownsWeapon(key)) { installWeapon(key); toast(`${w.name} online`); sfx.ui(); return true; }
  if (S.credits < w.price) { toast(`${w.name} costs ${fmtCr(w.price)}`); sfx.deny(); return false; }
  S.credits -= w.price;
  S.ownedWeapons[key] = true;
  installWeapon(key);
  sfx.pickup();
  toast(`${w.name} installed`);
  return true;
}

/**
 * Drop a weapon into the first empty mount, or over mount 1 if the rack is full.
 *
 * The "find a free slot" half now lives in core/state.js as `seatWeapon`, because
 * character creation needs exactly the same operation and two implementations of
 * "install a gun" is how a ship ends up able to fire one it does not have. This wrapper
 * keeps the yard-specific part: a full rack overwrites mount one rather than refusing,
 * and the legacy `S.weapon` ownership key is kept in step.
 */
function installWeapon(key) {
  if (!S.fit) recalcStats();
  const rack = S.fit.weapon;
  if (rack.includes(key)) { S.weapon = rack.find(Boolean) || key; recalcStats(); return; }
  if (seatWeapon(key) < 0) { rack[0] = key; recalcStats(); }
  S.weapon = rack.find(Boolean) || key;
  recalcStats();
}

export function ownsHull(key) { return !!S.ownedHulls[key]; }

export function hullPrice(key) { return SHIP_PRICE[key] || 0; }

/** Buy a career hull at a shipyard. Returns true on success. */
export function buyHull(key) {
  if (S.ownedHulls[key]) { switchClass(key); return true; }
  const cost = SHIP_PRICE[key] || 0;
  if (S.credits < cost) { toast(`${SHIP_CLASSES[key].name} hull costs ${fmtCr(cost)}`); sfx.deny(); return false; }
  S.credits -= cost;
  S.ownedHulls[key] = true;
  sfx.pickup();
  toast(`${SHIP_CLASSES[key].name} hull purchased`);
  switchClass(key);
  return true;
}

/** Swap to an already-owned hull. Refuses hulls you don't own. */
export function switchClass(key) {
  if (!S.ownedHulls[key]) { toast(`You don't own the ${SHIP_CLASSES[key].name} hull`); sfx.deny(); return false; }
  // Owning a hull and being licensed to fly it are separate things. A pilot can inherit,
  // salvage or buy their way into a gunship long before anyone will certify them for it —
  // and the licence is the part that has to be earned. Characters created before 0.6 have
  // no licence record at all, so they are grandfathered rather than grounded.
  if (hasCharacter() && !hasLicence(key)) {
    toast(`No ${SHIP_CLASSES[key].name} licence — see a shipyard`);
    sfx.deny();
    return false;
  }
  if (S.docked === null && key !== S.player.classKey) {
    // hull swaps happen at a shipyard, like refits
  }
  S.player.classKey = key;
  recalcStats();
  const over = cargoMass() - S.stats.cargoCap;
  if (over > 0) {
    const dropOre = Math.min(S.cargo.ore, over);
    S.cargo.ore -= dropOre;
    const rest = over - dropOre;
    if (rest > 0) S.cargo.salvage = Math.max(0, S.cargo.salvage - rest);
    toast(`${Math.round(over)} kg jettisoned — smaller hold`);
  }
  return true;
}

// ── modules & fitting ────────────────────────────────────────────────
export function ownsModule(key) { return !!S.ownedModules[key]; }

export function buyModule(key) {
  const m = MODULES[key];
  if (!m) return false;
  if (ownsModule(key)) { toast(`${m.name} already in the locker`); return true; }
  if (S.credits < m.price) { toast(`${m.name} costs ${fmtCr(m.price)}`); sfx.deny(); return false; }
  S.credits -= m.price;
  S.ownedModules[key] = true;
  recalcStats();
  sfx.pickup();
  toast(`${m.name} purchased`);
  return true;
}

/** Sell back at half — enough to undo a bad build, not enough to farm. */
export function sellModule(key) {
  const m = MODULES[key];
  if (!m || !ownsModule(key)) return false;
  for (const kind of ['utility', 'core'])
    S.fit[kind] = S.fit[kind].map(k => (k === key ? null : k));
  delete S.ownedModules[key];
  const back = Math.round(m.price * 0.5);
  S.credits += back;
  recalcStats();
  toast(`${m.name} sold for ${fmtCr(back)}`);
  sfx.ui();
  return true;
}

/**
 * Seat something in a hardpoint. `key` of null clears the slot. A module already
 * fitted elsewhere is moved rather than duplicated — you own one of each.
 */
export function fitSlot(kind, index, key) {
  if (!S.fit || !S.fit[kind] || index >= S.fit[kind].length) return false;
  if (key) {
    if (kind === 'weapon' && !ownsWeapon(key)) { toast('Buy that weapon first'); sfx.deny(); return false; }
    if (kind !== 'weapon' && !ownsModule(key)) { toast('Buy that module first'); sfx.deny(); return false; }
    for (const k of ['weapon', 'utility', 'core'])
      S.fit[k] = S.fit[k].map(x => (x === key ? null : x));
  }
  S.fit[kind][index] = key || null;
  if (kind === 'weapon') S.weapon = S.fit.weapon.find(Boolean) || null;
  recalcStats();
  sfx.ui();
  return true;
}
