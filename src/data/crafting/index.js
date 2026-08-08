// Living Galaxy — the crafting catalogue, in one place.
//
// The database this comes from is a flat file of 1,204 recipe rows. That shape is right
// for authoring and wrong for playing: at runtime the questions are "what does this item
// need" and "what can I make with what I am holding", and both of those want an index
// rather than a table to scan. The bill of materials therefore lives on each blueprint,
// and the reverse index — material to the things that consume it — is built once here.
//
// Splitting by category rather than keeping one giant object is deliberate too. A station
// fabricator can make ammunition and not reactors; a planetary complex can make refined
// metal and not personal sidearms. Who can build what is a per-category question, so
// category is a first-class division rather than a string on a record.

import { MATERIALS, MATERIAL_KEYS, MATERIAL_GROUPS, materialsIn, material,
         materialName, materialTier } from './materials.js';
import { SHIP_MODULES, SHIP_MODULES_KEYS } from './modules.js';
import { SHIP_WEAPONS, SHIP_WEAPONS_KEYS } from './weapons.js';
import { AMMUNITION, AMMUNITION_KEYS } from './ammo.js';
import { PERSONAL_ITEMS, PERSONAL_ITEMS_KEYS } from './personal.js';

export { MATERIALS, MATERIAL_KEYS, MATERIAL_GROUPS, materialsIn, material,
         materialName, materialTier,
         SHIP_MODULES, SHIP_WEAPONS, AMMUNITION, PERSONAL_ITEMS };

/** Every craftable thing, by id. Ids are globally unique across categories by design. */
export const BLUEPRINTS = Object.assign({}, SHIP_MODULES, SHIP_WEAPONS, AMMUNITION, PERSONAL_ITEMS);
export const BLUEPRINT_KEYS = Object.keys(BLUEPRINTS);

export const CATEGORIES = {
  module: { name: 'Ship modules', keys: SHIP_MODULES_KEYS, set: SHIP_MODULES },
  weapon: { name: 'Ship weapons', keys: SHIP_WEAPONS_KEYS, set: SHIP_WEAPONS },
  ammo:   { name: 'Ammunition',   keys: AMMUNITION_KEYS,   set: AMMUNITION },
  personal: { name: 'Personal kit', keys: PERSONAL_ITEMS_KEYS, set: PERSONAL_ITEMS }
};
export const CATEGORY_KEYS = Object.keys(CATEGORIES);

export const blueprint = id => BLUEPRINTS[id] || null;

/**
 * Can this be *made*, as opposed to only bought?
 *
 * A few entries in the catalogue have an empty bill of materials on purpose — luxury trade
 * goods, art, spices. They are cargo you acquire, not things you fabricate, and the data
 * says so by listing no inputs. Without this check an empty bill reads as "needs nothing",
 * which would let a fabricator print art out of an empty hold: the most valuable item in
 * the game, free, forever.
 */
export const craftable = id => {
  const bp = BLUEPRINTS[id];
  return !!bp && Object.keys(bp.materials || {}).length > 0;
};

export const TRADE_ONLY = BLUEPRINT_KEYS.filter(k => !craftable(k));

/** Which category an id belongs to, from its prefix. */
export function categoryOf(id) {
  if (!id) return null;
  if (id.startsWith('MOD-')) return 'module';
  if (id.startsWith('WPN-')) return 'weapon';
  if (id.startsWith('AMMO-')) return 'ammo';
  if (id.startsWith('ITM-')) return 'personal';
  return null;
}

/** The bill of materials for one item: [{ id, name, qty }]. */
export function billOfMaterials(id) {
  const bp = BLUEPRINTS[id];
  if (!bp || !bp.materials) return [];
  return Object.keys(bp.materials).map(m => ({
    id: m, name: materialName(m), qty: bp.materials[m], tier: materialTier(m)
  })).sort((a, b) => b.qty - a.qty);
}

/**
 * Reverse index: material id -> the blueprints that consume it. Built once at import
 * because it never changes, and because the alternative — scanning 235 blueprints every
 * time the player asks "what is this iron for" — is the sort of thing that is invisible
 * until someone opens the panel on a phone.
 */
const consumers = new Map();
for (const id of BLUEPRINT_KEYS) {
  const mats = BLUEPRINTS[id].materials || {};
  for (const m in mats) {
    if (!consumers.has(m)) consumers.set(m, []);
    consumers.get(m).push(id);
  }
}
export const usedBy = matId => consumers.get(matId) || [];

/**
 * The full material cost of an item, expanded down to raw inputs.
 *
 * Blueprints list *immediate* inputs — a reactor wants structural steel, not the iron ore
 * the steel came from. This walks the tree so the industrial planner can answer the real
 * question, which is how much digging a thing represents. Depth-capped and cycle-guarded:
 * the data is a DAG today and a single circular recipe would otherwise hang the game.
 */
export function rawCost(id, qty = 1, seen = new Set(), depth = 0) {
  const out = {};
  const bp = BLUEPRINTS[id];
  if (!bp || depth > 6 || seen.has(id)) return out;
  seen.add(id);

  for (const m in (bp.materials || {})) {
    const need = bp.materials[m] * qty;
    const sub = BLUEPRINTS[m];
    if (sub) {
      const inner = rawCost(m, need, seen, depth + 1);
      for (const k in inner) out[k] = (out[k] || 0) + inner[k];
    } else {
      out[m] = (out[m] || 0) + need;
    }
  }
  seen.delete(id);
  return out;
}

/** Manufacturing hours for one unit (or one stack, for ammunition). */
export const manufHours = id => {
  const bp = BLUEPRINTS[id];
  if (!bp) return 0;
  return bp.manuf_hours || bp.manuf_hours_per_stack || 0;
};

/** Tier of a blueprint — how advanced an industry has to be to build it. */
export const tierOf = id => (BLUEPRINTS[id] && BLUEPRINTS[id].tier) || 1;

/** Everything of a category at or below a tier. What a given facility can actually make. */
export const buildableAt = (category, tier) => {
  const c = CATEGORIES[category];
  if (!c) return [];
  return c.keys.filter(k => tierOf(k) <= tier);
};

export const catalogueSize = () => ({
  materials: MATERIAL_KEYS.length,
  blueprints: BLUEPRINT_KEYS.length,
  modules: SHIP_MODULES_KEYS.length,
  weapons: SHIP_WEAPONS_KEYS.length,
  ammo: AMMUNITION_KEYS.length,
  personal: PERSONAL_ITEMS_KEYS.length
});
