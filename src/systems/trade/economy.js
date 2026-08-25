// Living Galaxy — stations: sell what you hauled, patch the hull, bolt on refits.

import { S, recalcStats, cargoMass, seatWeapon } from '../../core/state.js';
import { witnessTrade } from '../npc/npc-brain.js';
import { DOCK, COMMODITIES, TRADE_MULT, UPGRADES, PROBE, SHIP_PRICE, SHIP_CLASSES, ORDNANCE } from '../../core/config.js';
import { repairQuote, serviceScale } from './pricing.js';
import { fmtCr, aimAngles } from '../../core/utils.js';
import { WEAPON_MODULES } from '../../data/weapons.js';
import { MODULES } from '../../data/modules.js';
import { AMMUNITION } from '../../data/crafting/ammo.js';
import { anyOnShore, recallShore, comfortUpkeep } from '../crew/welfare.js';
import { FEEDS } from '../combat/ordnance.js';
import { addRounds } from '../combat/magazine.js';
import { marketPrice, applyTrade } from './market.js';
import { dockingAllowed, tradeScale, standingLabel, standing } from '../company/reputation.js';
import { practice, hasCharacter, hasLicence } from '../crew/character.js';
import { creditDelivery, sellableOf } from './contracts.js';
import { crewEvent } from '../crew/crew.js';
import { toast, status } from '../../core/notify.js';
import { sfx } from '../platform/audio.js';
import { clearTarget } from '../flight/targeting.js';
import { crewNote } from '../crew/crew-note.js';

/** Station in docking range at docking speed, or null. */
export function updateDocking(dt = 0) {
  if (S.dockCooldown > 0) { S.dockCooldown -= dt; S.dockCandidate = null; return; }
  if (S.docked) { S.dockCandidate = null; return; }
  if (S.player.velocity.length() > DOCK.maxSpeed || S.warp.state !== 'idle') { S.dockCandidate = null; return; }
  // Distance to the *hull*, not to the centre. A berth ring forty kilometres across and a
  // survey buoy two hundred metres across should both open their pad when you are alongside
  // them, and a single centre-distance number cannot mean that for both.
  let best = null, bd = Infinity;
  for (const st of S.world.stations) {
    const gap = st.position.distanceTo(S.player.position) - ((st.userData && st.userData.radius) || 30);
    if (gap <= DOCK.reach && gap < bd) { bd = gap; best = st; }
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

/** Does the pilot personally own the hull they are sitting in? */
export const ownsCurrentHull = () => !!(S.ownedHulls && S.ownedHulls[S.player.classKey]);

export function undock() {
  if (!S.docked) return;
  // A founder starts on the office deck with no hull of their own. The company's ships are
  // the company's; a pilot flies what a pilot owns. The yard on this station sells the
  // civilian shuttle for nothing, so this is one tap away from resolved — but it has to be
  // a tap, because being handed a ship is the thing the executive start is not.
  if (!ownsCurrentHull()) {
    toast('No hull of your own — claim one at the shipyard');
    sfx.deny();
    return;
  }
  // Leaving is what cuts shore leave short. The clock does not quietly pause when you
  // undock — the crew are recalled, they keep a fraction of the benefit, and the log
  // records that it was cut short so a player who wonders why the leave did not help can
  // find out. See systems/welfare.js.
  if (anyOnShore()) recallShore(false);
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
  S.viewOutside = false;
  p.energy = S.stats.energyCap;
  crewNote('undocked');
  status(`Departing ${name} — throttle is yours`);
  sfx.ui();
}

// ── trade ────────────────────────────────────────────────────────────
export function priceFor(station, key) {
  // Standing tilts the book a little in your favour, or against it.
  //
  // ...and so does the pilot. `tradeBonus` has been summed from the commerce skill and
  // from a corporation's perk since v0.6, reached `S.stats.tradeBonus`, and been read by
  // **nobody** — a broker's entire specialisation and one starting employer's whole perk
  // were inert. It is a fraction, so a rank-10 broker out of Meridian sells for about a
  // fifth more than a rank-0 stranger. Capped so it cannot invert the spread.
  const pilot = 1 + Math.min(0.45, Math.max(-0.45, (S.stats && S.stats.tradeBonus) || 0));
  return marketPrice(station, key) * tradeScale('coalition') * pilot;
}

export function sell(key, station = S.docked) {
  if (!station) return 0;
  // Only what the pilot owns. A haul consignment rides in the same hold and counts against
  // the same capacity, but it belongs to the station that issued it — selling it was the
  // exploit that made abandoning a contract more profitable than completing one.
  // Sell the whole free portion including its fraction, but price the rounded figure —
  // the old code zeroed the stack, so subtracting a rounded amount instead would leave a
  // sliver behind or, worse, a negative hold.
  const avail = sellableOf(key);
  const kg = Math.round(avail);
  if (kg <= 0) {
    const held = Math.round(S.cargo[key] || 0);
    toast(held > 0
      ? `That ${COMMODITIES[key].name.toLowerCase()} is under consignment — deliver it, do not sell it`
      : `No ${COMMODITIES[key].name.toLowerCase()} aboard`);
    sfx.deny();
    return 0;
  }
  const value = kg * priceFor(station, key);
  S.cargo[key] = Math.max(0, (S.cargo[key] || 0) - avail);
  S.credits += value;
  applyTrade(station, key, kg, true);   // dumping volume moves the price
  creditDelivery(station, key, kg);     // supply contracts are credited here; haul is delivered, not sold
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
  for (const key in COMMODITIES) if (sellableOf(key) >= 0.5) total += sell(key, station);
  if (!total) toast('Nothing aboard to sell');
  return total;
}

// ── service ──────────────────────────────────────────────────────────

/**
 * What a station charges you, after standing and papers.
 *
 * `dockDiscount` is the last of the three bonuses that were being summed and thrown away.
 * A pilot with Coalition papers pays less at a Coalition pad, which is what "a file with
 * them opens stations" was always supposed to mean. Capped at half, like every other
 * discount in this file, so no stack of perks makes a service free.
 */


export const probeCost = () => Math.max(1, Math.round(PROBE.cost * serviceScale()));

export function buyProbe(station = S.docked) {
  if (!station) return false;
  const cost = probeCost();
  if (S.credits < cost) { toast(`A probe costs ${fmtCr(cost)}`); sfx.deny(); return false; }
  S.credits -= cost;
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

/* Moved to `pricing.js` — a price is a leaf, and this one had the whole shop standing
   behind it. Re-exported from here because a great many call sites already import it by
   this name and a rename is churn, not an improvement. See systems/trade/pricing.js. */
export { repairQuote };

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
  crewNote('repaired');
  toast(`Repaired for ${fmtCr(q.cost)}`);
  return true;
}

// ── refit ────────────────────────────────────────────────────────────
export function upgradeCost(key) {
  const u = UPGRADES[key];
  const base = u.base * Math.pow(u.scale, S.upgrades[key]);
  // `upgradeDiscount` was declared on a starting employer, summed in `characterBonuses()`,
  // and then dropped on the floor — it never reached `S.stats` and nothing multiplied by
  // it. Staff rates at the yard now actually are staff rates. Same half cap the repair
  // discount uses, so no perk stack can make a refit free.
  const off = Math.min(0.5, Math.max(0, (S.stats && S.stats.upgradeDiscount) || 0));
  return Math.round(base * (1 - off));
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
  // Something new in the racks is worth a word from whoever has to live with it. Only on
  // a fit, not on a strip: a crew remarking on an empty hardpoint is a crew reading a
  // diff, which is not a thing people do.
  if (key) crewNote('refit');
  recalcStats();
  sfx.ui();
  return true;
}
