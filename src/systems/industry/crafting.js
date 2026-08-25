// Living Galaxy — crafting.
//
// Everything the ship can mount now has a bill of materials behind it. Buying a module at
// a shipyard still works and always will — this is the other route, and it exists because
// a game with a mining laser, a cargo hold and a market ought to let you close the loop
// yourself rather than only ever selling ore to someone who does.
//
// Three things live here:
//
//   **Stock.** A separate inventory from the cargo hold, keyed by material id. Ore in the
//   hold is a commodity you sell by the tonne; refined titanium is a *component* you count
//   in units and spend on a specific thing. Mixing them would mean either the market has
//   to price 76 materials or the crafting system has to work in kilograms of "cargo", and
//   both of those are worse than two inventories.
//
//   **Jobs.** Manufacturing takes hours, not frames. A job is queued against a facility,
//   consumes its materials up front, and delivers when the clock runs out. Consuming up
//   front matters: a queue that reserves nothing lets you spend the same titanium three
//   times and discover it when the first job lands.
//
//   **Affordability.** The question the UI asks constantly is "what am I short of", not
//   "can I build this" — a yes/no tells a player nothing about what to go and mine.

import { S } from '../../core/state.js';
import { CRAFT } from '../../core/config.js';
import { BLUEPRINTS, blueprint, craftable, billOfMaterials, rawCost, manufHours, tierOf,
         categoryOf, materialName, MATERIALS } from '../../data/crafting/index.js';
import { skill } from '../crew/character.js';
import { toast, status } from '../../core/notify.js';
import { sfx } from '../platform/audio.js';
import { lockReason } from './research.js';
import { serializeLoadout, restoreLoadout, ammoStock } from '../combat/magazine.js';

// ── stock ────────────────────────────────────────────────────────────

export function stock() {
  if (!S.stock) S.stock = {};
  return S.stock;
}

export const held = id => stock()[id] || 0;

export function addMaterial(id, qty) {
  if (!id || !(qty > 0)) return 0;
  const s = stock();
  s[id] = (s[id] || 0) + qty;
  return s[id];
}

export function takeMaterial(id, qty) {
  const s = stock();
  const have = s[id] || 0;
  if (have < qty) return false;
  s[id] = have - qty;
  if (s[id] <= 0) delete s[id];
  return true;
}

/** Total units carried, for a capacity readout. */
export const stockUnits = () =>
  Object.values(stock()).reduce((a, b) => a + b, 0);

// ── affordability ────────────────────────────────────────────────────

/**
 * What you have and what you are short of, per material.
 * @returns {{ok:boolean, lines:Array, missing:Array}}
 */
export function checkMaterials(id, qty = 1) {
  // Trade-only goods have no recipe, and "no recipe" must not read as "needs nothing".
  if (!craftable(id)) return { ok: false, lines: [], missing: [], tradeOnly: true };
  const bom = billOfMaterials(id);
  const lines = bom.map(m => {
    const need = m.qty * qty;
    const have = held(m.id);
    return { id: m.id, name: m.name, need, have, short: Math.max(0, need - have) };
  });
  return { ok: lines.every(l => l.short === 0), lines, missing: lines.filter(l => l.short > 0) };
}

/** In words, for a button's tooltip: what to go and get. */
export function shortfallText(id, qty = 1) {
  const check = checkMaterials(id, qty);
  if (check.tradeOnly) return 'Traded, not manufactured';
  const { missing } = check;
  if (!missing.length) return null;
  return 'Short: ' + missing.slice(0, 3)
    .map(m => `${Math.ceil(m.short)} ${m.name}`).join(', ') +
    (missing.length > 3 ? `, +${missing.length - 3} more` : '');
}

/**
 * How long one unit takes here.
 *
 * Engineering rank cuts it, and so does the facility's own speed. The floor exists because
 * a build time that trends to zero turns the whole manufacturing layer into an inventory
 * screen — there should always be a reason to queue a job and go and do something else.
 */
export function buildHours(id, { speed = 1, engineering = null } = {}) {
  const base = manufHours(id);
  const rank = engineering === null ? skill('engineering') : engineering;
  const skilled = 1 - Math.min(CRAFT.maxSkillCut, rank * CRAFT.hoursPerRank);
  return Math.max(CRAFT.minHours, base * skilled / Math.max(0.1, speed));
}

// ── jobs ─────────────────────────────────────────────────────────────

export function jobs() {
  if (!S.jobs) S.jobs = [];
  return S.jobs;
}

/**
 * Queue a build. Materials are taken *now*.
 *
 * The alternative — checking materials at delivery — reads as more forgiving and is much
 * worse: three queued jobs each pass the check, then the first one lands and the other two
 * fail for reasons the player set in motion twenty minutes ago and cannot now see.
 */
export function queueJob(id, { qty = 1, where = 'ship', speed = 1, facility = null } = {}) {
  const bp = blueprint(id);
  if (!bp) { toast('No such blueprint'); return null; }
  if (!craftable(id)) {
    toast(`${bp.name} is traded, not manufactured`); sfx.deny(); return null;
  }
  // The seven tier-5 entries are the only gated ones, and only by the project that names
  // them. See systems/research.js for why the whole catalogue is not gated retroactively.
  const locked = lockReason(id);
  if (locked) { toast(`${bp.name} — ${locked}`); sfx.deny(); return null; }

  const check = checkMaterials(id, qty);
  if (!check.ok) { toast(shortfallText(id, qty)); sfx.deny(); return null; }

  const list = jobs();
  if (list.length >= CRAFT.maxJobs) { toast(`Queue full — ${CRAFT.maxJobs} jobs`); sfx.deny(); return null; }

  for (const l of check.lines) takeMaterial(l.id, l.need);

  const hours = buildHours(id, { speed }) * qty;
  const job = {
    id: `job-${S.time.toFixed(2)}-${list.length}`,
    item: id, name: bp.name, qty,
    where, facility,
    hours, remaining: hours,
    started: S.time
  };
  list.push(job);
  status(`${bp.name} \u00d7${qty} queued \u2014 ${hours.toFixed(1)}h`);
  sfx.ui();
  return job;
}

/** Give up on a job. Materials come back at a loss — scrap is not stock. */
export function cancelJob(jobId) {
  const list = jobs();
  const i = list.findIndex(j => j.id === jobId);
  if (i < 0) return false;
  const job = list[i];
  list.splice(i, 1);
  const frac = CRAFT.cancelRefund * (job.remaining / job.hours);
  for (const m of billOfMaterials(job.item)) {
    const back = Math.floor(m.qty * job.qty * frac);
    if (back > 0) addMaterial(m.id, back);
  }
  toast(`${job.name} cancelled \u2014 ${Math.round(frac * 100)}% of materials recovered`);
  return true;
}

/**
 * Advance every job. `hours` is game hours — the caller converts, because the frame loop
 * thinks in seconds and a factory thinks in shifts, and putting that conversion in one
 * place beats scattering a magic number through both.
 */
export function updateJobs(hours) {
  const list = jobs();
  if (!list.length || !(hours > 0)) return [];
  const done = [];
  for (let i = list.length - 1; i >= 0; i--) {
    const j = list[i];
    j.remaining -= hours;
    if (j.remaining > 0) continue;
    list.splice(i, 1);
    done.push(j);
    deliver(j);
  }
  return done;
}

function deliver(job) {
  const cat = categoryOf(job.item);
  if (cat === 'ammo') {
    const bp = blueprint(job.item);
    const rounds = (bp.stack_size || 100) * job.qty;
    S.ammo = S.ammo || {};
    S.ammo[job.item] = (S.ammo[job.item] || 0) + rounds;
    toast(`${job.name} \u2014 ${rounds} rounds delivered`, 4200);
  } else {
    // Modules, weapons and personal kit land in the locker. Fitting them is a separate
    // act, at a station, with the fitting rules that already exist.
    S.locker = S.locker || {};
    S.locker[job.item] = (S.locker[job.item] || 0) + job.qty;
    toast(`${job.name} \u00d7${job.qty} delivered to the locker`, 4200);
  }
  sfx.pickup();
}

export const locker = () => (S.locker = S.locker || {});
// The magazine owns the ammunition store; re-exported here so a caller already holding
// the crafting module does not need a second import for the thing it just built.
export { ammoStock } from '../combat/magazine.js';

// ── reporting ────────────────────────────────────────────────────────

/** What could be built right now from what is held. */
export function buildableNow(category = null, tierCap = 99) {
  return Object.keys(BLUEPRINTS).filter(id => {
    if (!craftable(id)) return false;
    if (category && categoryOf(id) !== category) return false;
    if (tierOf(id) > tierCap) return false;
    return checkMaterials(id).ok;
  });
}

/** Everything about one blueprint, for a detail panel. */
export function blueprintDetail(id, qty = 1) {
  const bp = blueprint(id);
  if (!bp) return null;
  const check = checkMaterials(id, qty);
  return {
    id, name: bp.name, category: categoryOf(id), tier: tierOf(id),
    cost: bp.cost, mass: bp.mass_tons || bp.mass_kg || null,
    desc: bp.description || bp.notes || '',
    hours: buildHours(id) * qty,
    materials: check.lines,
    raw: Object.keys(rawCost(id, qty)).map(m => ({
      id: m, name: materialName(m), qty: rawCost(id, qty)[m]
    })),
    ok: check.ok,
    shortfall: shortfallText(id, qty)
  };
}

export function craftingReport() {
  return {
    stock: Object.keys(stock()).length,
    units: stockUnits(),
    jobs: jobs().length,
    locker: Object.keys(locker()).length,
    ammo: Object.keys(ammoStock()).length
  };
}

// ── persistence ──────────────────────────────────────────────────────

export const serializeCrafting = () => ({
  stock: S.stock || {}, jobs: S.jobs || [],
  locker: S.locker || {}, ammo: S.ammo || {},
  // v1.00.60: which round each feed has chambered. Rides with the ammunition it selects
  // from rather than becoming a payload of its own.
  loadout: serializeLoadout()
});

export function restoreCrafting(d) {
  if (!d) return false;
  S.stock = d.stock || {};
  // A job list from an older build may carry ids no longer in the catalogue. Dropping
  // them beats delivering an item that does not exist.
  S.jobs = (d.jobs || []).filter(j => j && blueprint(j.item));
  S.locker = d.locker || {};
  S.ammo = d.ammo || {};
  restoreLoadout(d.loadout || null);
  return true;
}
