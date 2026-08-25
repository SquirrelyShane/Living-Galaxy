// Living Galaxy — magazines: which rounds a gun eats, and what they do to what it hits.
//
// The ammunition catalogue and the material stock have both existed since v1.00.20. The
// firing path has never touched either: `weapons.js` spent energy and produced a
// projectile out of nothing, so forty ammunition blueprints were a manufacturing tree with
// no consumer at the far end of it. This is the far end.
//
// ── compatibility is derived, not listed ─────────────────────────────
// `AMMUNITION[id].compatible` is prose — "Autocannon/Railgun", "Missile Rack/Torpedo" —
// written for a human reading a catalogue. Rather than hand-maintain a second table that
// says the same thing in ids (and drifts the first time anyone adds a round), each weapon
// declares the *words* its feed answers to, and compatibility is a match against the
// catalogue's own text. A new AMMO- entry joins the right guns the moment it is added, and
// `test/ordnance.mjs` asserts every feed still resolves to something.
//
// ── what a round does is derived too ─────────────────────────────────
// `damage_type` is also prose, and also the authority. "Kinetic/AP" is kinetic with a
// penetration flag; "EMP" and "Ion" are EM; "Thermal", "Nuclear" and "Antimatter" burn.
// Reading the string beats a forty-row lookup nobody will keep in step, and it means a
// round's tier drives its yield without a designer typing a number twice.
//
// ── energy weapons take no ammunition, on purpose ────────────────────
// A pulse laser that runs dry is a projectile weapon with extra steps. The split is the
// whole trade: energy guns cost you the bank and never strand you; projectile and missile
// guns cost you cargo space, credits and forethought, and hit harder for it.

import { AMMUNITION } from '../data/crafting/ammo.js';
import { WEAPON_MODULES } from '../data/weapons.js';

/**
 * A feed is a family of hardpoint. `match` are the words that appear in a catalogue
 * entry's `compatible` list for rounds this feed can chamber.
 */
export const FEEDS = {
  autocannon: { name: 'Autocannon feed', match: ['Autocannon', 'Flak'] },
  rail:       { name: 'Rail feed',       match: ['Railgun', 'Coilgun', 'Gauss'] },
  missile:    { name: 'Missile rack',    match: ['Missile'] },
  torpedo:    { name: 'Torpedo tube',    match: ['Torpedo', 'Spinal'] }
};

/** Which feed each weapon module uses. Energy weapons have none and want none. */
export const WEAPON_FEED = {
  autocan: 'autocannon',
  gauss:   'rail',
  railgun: 'rail',
  missile: 'missile',
  torpedo: 'torpedo'
};

// Rounds that are not shots. A boarding pod and a coolant cartridge live in the same
// catalogue as a sabot because they are all things a ship carries; they are not things a
// gun fires at somebody, and putting them in a magazine list would offer the pilot a
// choice that does nothing.
const NON_COMBAT = /Utility|Boarding|Decoy|Countermeasure|EW\b/i;

/** The in-game damage type a round carries, read off its own description. */
export function dtypeOf(ammo) {
  const t = String((ammo && ammo.damage_type) || '');
  if (/EMP|Ion|Energy/i.test(t)) return 'em';
  if (/Thermal|Incendiary|Nuclear|Antimatter/i.test(t)) return 'thermal';
  return 'kinetic';
}

/** Armour-piercing rounds trade yield for getting through plate. */
export const isAP = ammo => /\/AP|Penetrator/i.test(String((ammo && ammo.damage_type) || '') + ' ' + ((ammo && ammo.name) || ''));

/**
 * Yield multiplier applied to the weapon's own damage.
 *
 * Tier is the lever, because tier is the thing the crafting tree already prices, times
 * and gates. A tier-5 antimatter torpedo is not four times a standard one — the curve is
 * deliberately shallow, so the reason to carry expensive rounds is the damage *type* and
 * the penetration, not a number that makes the cheap ones pointless.
 */
export const yieldOf = ammo => 1 + (((ammo && ammo.tier) || 1) - 1) * 0.14;

/** Every round this feed can chamber, cheapest first. */
export function roundsFor(feedKey) {
  const feed = FEEDS[feedKey];
  if (!feed) return [];
  const out = [];
  for (const id in AMMUNITION) {
    const a = AMMUNITION[id];
    if (NON_COMBAT.test(String(a.damage_type || ''))) continue;
    const compat = (a.compatible || []).join(' | ');
    if (!feed.match.some(m => compat.includes(m))) continue;
    out.push(a);
  }
  return out.sort((a, b) => (a.unit_cost || 0) - (b.unit_cost || 0));
}

/** Every round a given weapon module can chamber. Empty for energy weapons. */
export const roundsForWeapon = key => roundsFor(WEAPON_FEED[key]);

/** Does this weapon eat rounds at all? */
export const usesAmmo = key => !!WEAPON_FEED[key];

/** The feed a weapon definition belongs to, from the definition rather than the key. */
export function feedOfDef(def) {
  if (!def) return null;
  for (const k in WEAPON_MODULES) if (WEAPON_MODULES[k] === def) return WEAPON_FEED[k] || null;
  // A definition that arrived by value rather than by reference (the fit hands out copies
  // in places) is matched on name, which is unique in the module table.
  for (const k in WEAPON_MODULES) if (WEAPON_MODULES[k].name === def.name) return WEAPON_FEED[k] || null;
  return null;
}

/** Cached lookup of every id in a feed, for the loadout defaulting in weapons.js. */
const idCache = {};
export function feedIds(feedKey) {
  if (!idCache[feedKey]) idCache[feedKey] = roundsFor(feedKey).map(a => a.id);
  return idCache[feedKey];
}
