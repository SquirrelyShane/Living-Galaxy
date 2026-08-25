// Living Galaxy — everything the catalogue derives from itself.
//
// Four small modules used to live here — meta, taxonomy, compat and validate. Each was
// under 120 lines, each imported the same four blueprint sets, and none of them was ever
// imported on its own: `index.js` was the only consumer and it re-exported all of them
// verbatim. Four files, four import headers and a 25-line re-export block to express one
// idea — *facts computed from the catalogue rather than authored into it*. It is one file
// now, in four marked sections.
//
//   PROVENANCE — which version of the source database this projection came from.
//   TAXONOMY   — the second axis on every record (module subcategory, weapon type,
//                ammunition damage type, personal-kit role) that a loadout UI groups by.
//   COMPAT     — the prose in an ammunition's `compatible` field, resolved to weapon ids.
//   VALIDATE   — the checks that catch a drifted or half-imported catalogue at boot.

import { MATERIALS, MATERIAL_KEYS, MATERIAL_GROUPS, materialsIn } from './materials.js';
import { SHIP_MODULES, SHIP_MODULES_KEYS } from './modules.js';
import { SHIP_WEAPONS, SHIP_WEAPONS_KEYS } from './weapons.js';
import { AMMUNITION, AMMUNITION_KEYS } from './ammo.js';
import { PERSONAL_ITEMS, PERSONAL_ITEMS_KEYS } from './personal.js';
import { BLUEPRINTS, BLUEPRINT_KEYS, categoryOf, craftable, rawCost, TRADE_ONLY } from './index.js';

// ══ PROVENANCE ═══════════════════════════════════════════════════════

export const CATALOGUE_META = {
  title: 'Space RPG Comprehensive Crafting Database',
  version: '3.0',
  description: 'Further expanded lists. Full relational recipe table included. ' +
    'Every craftable item derives from mined, refined, extracted, or biologically grown resources.',
  crafting_philosophy:
    'No pure exotic unobtainium. All high-end materials are either refined from ores/gases/ices, ' +
    'synthesized from organics, or cultured in bioreactors. Exotic Matter and Antimatter are rare ' +
    'but still produced via particle accelerators or anomaly harvesting that can be industrialized.',
  source_file: 'Space_RPG_Crafting_Database3.json'
};

/**
 * What the source file contains. validate.js asserts the code still matches these, so a
 * partial re-import (or a hand edit that drops a row) fails loudly instead of quietly
 * shrinking the game's economy.
 */
export const EXPECTED_COUNTS = {
  materials: 76,
  material_groups: { raw_mined_extracted: 25, grown_cultured_biological: 11,
                     refined_materials: 20, intermediate_components: 20 },
  modules: 70, weapons: 50, ammo: 40, personal: 75,
  blueprints: 235,
  recipe_rows: 1204   // one row per (item, material) pair in the source table
};

// ══ TAXONOMY ════════════════════════════════════════════════════════
// Living Galaxy — the vocabularies the catalogue sorts itself by.
//
// The source database carries a second axis on every record that the first import dropped:
// modules have a `subcategory` ("Core - Reactor"), weapons a `type` ("Kinetic"), ammunition a
// `damage_type`, personal kit a `subcategory` ("Armor", "Medical"). Those strings are what a
// shipyard UI groups by and what a faction's industry licence is written against, so they are
// worth indexing rather than re-deriving with string compares at every render.
//
// Everything here is computed from the data at import. Add a blueprint and its group appears;
// there is no second list to keep in sync.


const indexBy = (keys, set, field) => {
  const out = {};
  for (const k of keys) {
    const v = set[k][field];
    if (v === undefined) continue;
    (out[v] ||= []).push(k);
  }
  return out;
};

/** Module ids by subcategory: 'Core - Reactor', 'Defensive - Shields', 'Utility - Cargo', … */
export const MODULES_BY_SUBCATEGORY = indexBy(SHIP_MODULES_KEYS, SHIP_MODULES, 'subcategory');
/** Module ids by the coarse half of the subcategory: 'Core', 'Defensive', 'Utility', 'FTL', … */
export const MODULES_BY_ROLE = (() => {
  const out = {};
  for (const k of SHIP_MODULES_KEYS) {
    const role = String(SHIP_MODULES[k].subcategory || '').split(' - ')[0].trim() || 'Other';
    (out[role] ||= []).push(k);
  }
  return out;
})();

/** Weapon ids by mount class: Energy, Kinetic, Missile, Ordnance, Exotic, Countermeasure, Special. */
export const WEAPONS_BY_TYPE = indexBy(SHIP_WEAPONS_KEYS, SHIP_WEAPONS, 'type');
/** Weapon and ammo ids by damage type — the axis armour and shields are resisted along. */
export const WEAPONS_BY_DAMAGE = indexBy(SHIP_WEAPONS_KEYS, SHIP_WEAPONS, 'damage_type');
export const AMMO_BY_DAMAGE = indexBy(AMMUNITION_KEYS, AMMUNITION, 'damage_type');
/** Hull size a weapon or module needs: S, M, L, C (capital/spinal). */
export const WEAPONS_BY_SIZE = indexBy(SHIP_WEAPONS_KEYS, SHIP_WEAPONS, 'size');
export const MODULES_BY_SIZE = indexBy(SHIP_MODULES_KEYS, SHIP_MODULES, 'size');

/** Personal kit by what it is for: 'Personal Weapon', 'Armor', 'Medical', 'Tool', 'Trade Good', … */
export const PERSONAL_BY_SUBCATEGORY = indexBy(PERSONAL_ITEMS_KEYS, PERSONAL_ITEMS, 'subcategory');

export const SIZE_ORDER = ['S', 'M', 'L', 'C'];
export const sizeRank = s => { const i = SIZE_ORDER.indexOf(s); return i < 0 ? 0 : i; };
/** A hull with slots of size `hull` can take anything up to that size. */
export const fitsHull = (itemSize, hull) => sizeRank(itemSize) <= sizeRank(hull);

export const TAXONOMY = {
  module_subcategory: MODULES_BY_SUBCATEGORY,
  module_role: MODULES_BY_ROLE,
  weapon_type: WEAPONS_BY_TYPE,
  weapon_damage: WEAPONS_BY_DAMAGE,
  ammo_damage: AMMO_BY_DAMAGE,
  personal_subcategory: PERSONAL_BY_SUBCATEGORY
};

// ══ COMPAT ══════════════════════════════════════════════════════════
// Living Galaxy — which ammunition actually fits which launcher.
//
// The source database answers this in prose: AMMO-002 lists "Autocannon", AMMO-024 lists
// "High-energy weapons (optional)". A human reads that fine; a loadout screen cannot, and
// "Autocannon" silently means four different weapon ids while "Spinal Torpedo" means one
// that is spelled differently in the weapons table. So the prose is resolved here, once,
// into ids — and the genuinely open-ended entries are resolved by *rule* against the weapon
// table rather than frozen into a list, so a new laser is loadable by coolant cartridges the
// day it is added.
//
// This is the file to edit when a weapon gains or loses an ammunition type.


/** Rule-based classes, evaluated against the live weapon table. */
const CLASS = {
  energy:      () => SHIP_WEAPONS_KEYS.filter(k => SHIP_WEAPONS[k].type === 'Energy'),
  autocannon:  () => ['WPN-009', 'WPN-010', 'WPN-040', 'WPN-041'],
  flak:        () => ['WPN-014'],
  railgun:     () => ['WPN-011', 'WPN-012', 'WPN-042'],
  coilgun:     () => ['WPN-013'],
  gauss:       () => ['WPN-015'],
  missile_rack:() => ['WPN-016', 'WPN-017'],
  any_missile: () => SHIP_WEAPONS_KEYS.filter(k => SHIP_WEAPONS[k].type === 'Missile'),
  torpedo:     () => ['WPN-018', 'WPN-028', 'WPN-045'],
  countermeasure: () => SHIP_WEAPONS_KEYS.filter(k => SHIP_WEAPONS[k].type === 'Countermeasure'),
  cluster:     () => ['WPN-035']
};

const expand = spec => spec.flatMap(s => (typeof s === 'string' ? [s] : CLASS[s.class]()));

/**
 * ammo id -> { weapons, modules, optional }.
 * `optional` marks consumables a weapon can use but does not need to fire — coolant
 * cartridges, overcharge cells. A loadout validator must not demand them.
 */
const RAW_COMPAT = {
  'AMMO-001': { weapons: ['WPN-009', 'WPN-010', 'WPN-014', 'WPN-025', 'WPN-043'] },
  'AMMO-002': { weapons: [{ class: 'autocannon' }, { class: 'railgun' }, { class: 'coilgun' }] },
  'AMMO-003': { weapons: [{ class: 'flak' }, { class: 'autocannon' }] },
  'AMMO-004': { weapons: [{ class: 'railgun' }] },
  'AMMO-005': { weapons: [{ class: 'railgun' }, { class: 'coilgun' }, { class: 'gauss' }] },
  'AMMO-006': { weapons: [{ class: 'missile_rack' }] },
  'AMMO-007': { weapons: ['WPN-018', 'WPN-028'] },
  'AMMO-008': { weapons: ['WPN-019'] },
  'AMMO-009': { weapons: [{ class: 'missile_rack' }, { class: 'torpedo' }] },
  'AMMO-010': { weapons: ['WPN-018', 'WPN-028'] },
  'AMMO-011': { weapons: ['WPN-018', 'WPN-028'] },
  'AMMO-012': { weapons: ['WPN-029'], modules: ['MOD-024', 'MOD-057'] },
  'AMMO-013': { weapons: [{ class: 'missile_rack' }] },
  'AMMO-014': { weapons: [{ class: 'autocannon' }, { class: 'flak' }] },
  'AMMO-015': { weapons: ['WPN-020'] },
  'AMMO-016': { weapons: ['WPN-020'] },
  'AMMO-017': { weapons: ['WPN-031'], modules: ['MOD-044'] },
  'AMMO-018': { weapons: ['WPN-030'], modules: ['MOD-057'] },
  'AMMO-019': { weapons: [{ class: 'cluster' }] },
  'AMMO-020': { weapons: [{ class: 'any_missile' }] },
  'AMMO-021': { weapons: ['WPN-023', { class: 'missile_rack' }] },
  'AMMO-022': { weapons: [{ class: 'autocannon' }, { class: 'flak' }] },
  'AMMO-023': { weapons: [{ class: 'cluster' }] },
  'AMMO-024': { weapons: [{ class: 'energy' }], optional: true },
  'AMMO-025': { weapons: [{ class: 'energy' }], optional: true },
  'AMMO-026': { weapons: [{ class: 'autocannon' }, { class: 'railgun' }] },
  'AMMO-027': { weapons: [{ class: 'railgun' }, { class: 'coilgun' }, { class: 'gauss' }] },
  'AMMO-028': { weapons: ['WPN-044'] },
  'AMMO-029': { weapons: ['WPN-046'] },
  'AMMO-030': { weapons: ['WPN-045'] },
  'AMMO-031': { weapons: ['WPN-047'] },
  'AMMO-032': { weapons: [{ class: 'railgun' }, { class: 'coilgun' }] },
  'AMMO-033': { weapons: [{ class: 'autocannon' }, { class: 'flak' }] },
  'AMMO-034': { weapons: [{ class: 'missile_rack' }] },
  'AMMO-035': { weapons: [{ class: 'missile_rack' }, 'WPN-023'], modules: ['MOD-070'] },
  'AMMO-036': { weapons: [{ class: 'countermeasure' }], modules: ['MOD-057'] },
  'AMMO-037': { weapons: [{ class: 'autocannon' }, { class: 'flak' }] },
  'AMMO-038': { weapons: [{ class: 'flak' }, { class: 'cluster' }] },
  'AMMO-039': { weapons: [{ class: 'torpedo' }, { class: 'missile_rack' }] },
  'AMMO-040': { weapons: ['WPN-031'], modules: ['MOD-044'] }
};

const dedupe = a => [...new Set(a)];

/** Weapon ids that can load this ammunition. */
export const weaponsForAmmo = ammoId =>
  dedupe(expand((RAW_COMPAT[ammoId] || {}).weapons || []));
/** Ship modules that carry or dispense it (launch bays, countermeasure dispensers). */
export const modulesForAmmo = ammoId => dedupe((RAW_COMPAT[ammoId] || {}).modules || []);
/** True when the ammunition is a booster, not a requirement to fire. */
export const isOptionalAmmo = ammoId => !!(RAW_COMPAT[ammoId] || {}).optional;

/** Reverse: what this weapon can be loaded with. Built once, same reasoning as the BOM index. */
const byWeapon = new Map();
for (const a of AMMUNITION_KEYS)
  for (const w of weaponsForAmmo(a)) {
    if (!byWeapon.has(w)) byWeapon.set(w, []);
    byWeapon.get(w).push(a);
  }
export const ammoForWeapon = weaponId => byWeapon.get(weaponId) || [];

/** Ammunition a weapon needs to fire at all (excludes optional boosters). */
export const requiredAmmoForWeapon = weaponId =>
  ammoForWeapon(weaponId).filter(a => !isOptionalAmmo(a));

/**
 * Weapons with no ammunition entry at all. Energy weapons legitimately have none — they burn
 * power, not stores — so this is a design report, not an error, and validate.js treats it as one.
 */
export const weaponsWithoutAmmo = () =>
  SHIP_WEAPONS_KEYS.filter(k => requiredAmmoForWeapon(k).length === 0);

export const AMMO_COMPAT = Object.fromEntries(AMMUNITION_KEYS.map(a => [a, {
  name: AMMUNITION[a].name,
  weapons: weaponsForAmmo(a),
  modules: modulesForAmmo(a),
  optional: isOptionalAmmo(a)
}]));

// ══ VALIDATE ════════════════════════════════════════════════════════
// Living Galaxy — catalogue integrity checks.
//
// The catalogue is data, and data drifts: a re-import drops a row, a hand edit renames a
// material, a new blueprint cites an id that does not exist yet. Every one of those failures
// is silent at import and expensive at runtime — a recipe that can never be completed, a
// fabricator that prints from nothing. This runs the checks up front instead.
//
// Call validateCatalogue() from a test or a dev build. It never throws; it returns findings,
// separated into errors (the data is wrong) and warnings (the data is unusual on purpose).


export function validateCatalogue() {
  const errors = [], warnings = [];
  const err = (code, msg) => errors.push({ code, msg });
  const warn = (code, msg) => warnings.push({ code, msg });

  // --- counts still match the source file -------------------------------------------------
  const counts = {
    materials: MATERIAL_KEYS.length, modules: SHIP_MODULES_KEYS.length,
    weapons: SHIP_WEAPONS_KEYS.length, ammo: AMMUNITION_KEYS.length,
    personal: PERSONAL_ITEMS_KEYS.length, blueprints: BLUEPRINT_KEYS.length
  };
  for (const k in counts)
    if (counts[k] !== EXPECTED_COUNTS[k])
      err('COUNT_DRIFT', `${k}: ${counts[k]} present, source has ${EXPECTED_COUNTS[k]}`);
  for (const g in EXPECTED_COUNTS.material_groups) {
    const n = materialsIn(g).length;
    if (n !== EXPECTED_COUNTS.material_groups[g])
      err('COUNT_DRIFT', `material group ${g}: ${n} present, source has ${EXPECTED_COUNTS.material_groups[g]}`);
  }
  let rows = 0;
  for (const id of BLUEPRINT_KEYS) rows += Object.keys(BLUEPRINTS[id].materials || {}).length;
  if (rows !== EXPECTED_COUNTS.recipe_rows)
    err('COUNT_DRIFT', `bill-of-material rows: ${rows}, source recipe table has ${EXPECTED_COUNTS.recipe_rows}`);

  // --- ids resolve ------------------------------------------------------------------------
  for (const id of BLUEPRINT_KEYS) {
    if (!categoryOf(id)) err('BAD_ID', `${id} has no recognised category prefix`);
    const bp = BLUEPRINTS[id];
    if (bp.id !== id) err('ID_MISMATCH', `${id} carries id "${bp.id}"`);
    if (!bp.name) err('NO_NAME', `${id} has no name`);
    for (const m in (bp.materials || {})) {
      if (!MATERIALS[m] && !BLUEPRINTS[m]) err('DANGLING_INPUT', `${id} consumes unknown "${m}"`);
      else if (!MATERIALS[m]) warn('NESTED_BLUEPRINT', `${id} consumes ${m}, a blueprint rather than a material`);
      const q = bp.materials[m];
      if (!(q > 0)) err('BAD_QTY', `${id} consumes ${m} x${q}`);
    }
  }
  for (const g of Object.keys(MATERIAL_GROUPS)) if (!materialsIn(g).length)
    err('EMPTY_GROUP', `material group ${g} has no members`);
  for (const m of MATERIAL_KEYS) if (!MATERIAL_GROUPS[MATERIALS[m].group])
    err('BAD_GROUP', `${m} is in unknown group "${MATERIALS[m].group}"`);

  // --- economy sanity ---------------------------------------------------------------------
  for (const id of BLUEPRINT_KEYS) {
    const bp = BLUEPRINTS[id];
    const cost = bp.cost ?? bp.unit_cost;
    if (cost === undefined) err('NO_COST', `${id} has neither cost nor unit_cost`);
    const hours = bp.manuf_hours ?? bp.manuf_hours_per_stack;
    if (hours === undefined) err('NO_HOURS', `${id} has no manufacturing time`);
    if (!bp.tier) err('NO_TIER', `${id} has no tier`);
  }
  for (const id of TRADE_ONLY) warn('TRADE_ONLY', `${id} (${BLUEPRINTS[id].name}) has an empty bill of materials — acquired, not fabricated`);

  // --- the expansion terminates -----------------------------------------------------------
  for (const id of BLUEPRINT_KEYS) {
    const raw = rawCost(id);
    for (const m in raw) if (!MATERIALS[m])
      err('UNRESOLVED_RAW', `${id} expands to unknown input "${m}"`);
    if (craftable(id) && !Object.keys(raw).length)
      err('EMPTY_EXPANSION', `${id} is craftable but expands to nothing`);
  }

  // --- ammunition wiring ------------------------------------------------------------------
  for (const a of AMMUNITION_KEYS) {
    const w = weaponsForAmmo(a), mo = modulesForAmmo(a);
    if (!w.length && !mo.length) err('AMMO_ORPHAN', `${a} fits no weapon or module`);
    for (const id of [...w, ...mo]) if (!BLUEPRINTS[id]) err('BAD_COMPAT', `${a} maps to unknown "${id}"`);
  }
  for (const w of weaponsWithoutAmmo()) {
    const type = SHIP_WEAPONS[w].type;
    if (type !== 'Energy' && type !== 'Exotic' && type !== 'Special')
      warn('WEAPON_NO_AMMO', `${w} (${SHIP_WEAPONS[w].name}, ${type}) has no ammunition entry`);
  }

  return { ok: errors.length === 0, errors, warnings, counts };
}

/** Convenience for a dev build: prints a report, returns true when the data is sound. */
export function reportCatalogue(log = console) {
  const r = validateCatalogue();
  log.log(`catalogue: ${r.counts.blueprints} blueprints, ${r.counts.materials} materials — ` +
          `${r.errors.length} error(s), ${r.warnings.length} warning(s)`);
  for (const e of r.errors) log.error(`  ERROR ${e.code}: ${e.msg}`);
  for (const w of r.warnings) log.warn(`  warn  ${w.code}: ${w.msg}`);
  return r.ok;
}
