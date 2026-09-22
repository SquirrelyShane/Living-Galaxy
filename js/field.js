/* LIVING GALAXY — procedural asteroid field.
 *
 * The belt is hundreds of thousands of units wide, so we never build it all.
 * Space is diced into cells; each cell deterministically hashes out its own
 * rocks. Fly away and back and the same rocks are in the same places. Mined
 * rocks are remembered by key so they stay gone.
 */

import { currentSystem } from "./bodies.js";
import { ORES } from "./materials.js";
import { classFor, classOre } from "./bodygen/classes.js";
import { siteRocksInCell, siteHooks } from "./sites.js";

const ASTEROID_ORES = ORES.filter((o) => o.found.includes("asteroid"));
const byIds = (...ids) => ORES.filter((o) => ids.includes(o.id));
/* The belt is not one country. Sunward rim: differentiated cores, the heavy
 * stuff. The broad middle: stony commons. The cold outer fifth: carbon and
 * frost. Weighted by abundance inside each band. */
export const BAND_METAL = byIds("iron_ore", "nickel_ore", "chromite", "ilmenite", "pentlandite", "galena", "platinum_ore", "iridium_ore", "uraninite");
export const BAND_STONE = byIds("silicate", "regolith", "iron_ore", "bauxite", "copper_ore", "sphalerite", "cassiterite", "monazite");
export const BAND_CARBON = byIds("carbonaceous", "regolith", "sphalerite", "galena", "tholins");
/* Veins: the rare rich pocket a prospector calls in. One uncommon ore owns the cell. */
export const VEIN_ORES = byIds("chromite", "ilmenite", "pentlandite", "cassiterite", "monazite", "galena", "platinum_ore", "iridium_ore", "uraninite");
/* Past the frost line the belt is a different country: dirty snowballs, not
 * stone. Weighted by abundance so water ice dominates and clathrates are the
 * find worth calling in. */
export const ICE_ORES = ORES.filter((o) => ["water_ice", "methane_ice", "nitrogen_ice", "ammonia_ice", "tholins"].includes(o.id));

/** Abundance-weighted pick from an ore table, off one hash. Exported for tests. */
export function pickOre(table, h) {
  const total = table.reduce((s, o) => s + o.yield, 0);
  let r = h * total;
  for (const o of table) {
    r -= o.yield;
    if (r <= 0) return o;
  }
  return table[table.length - 1];
}

const ORE_BY_ID = new Map(ORES.map((o) => [o.id, o]));

export const CELL = 3000;
const PER_CELL = 10;
/* A belt is a DISC, not a cloud: six and a half kilometres thick and hundreds
 * of thousands wide. That asymmetry is the cheapest way out of the rocks —
 * climbing is a few seconds, flying to the rim is a journey — so the autopilot
 * needs the number, not just a boolean. */
export const BELT_HALF_HEIGHT = 3200;

/** depletion by rock key: 0..1, 1 = mined out */
export const depleted = new Map();

function hash(x, y, z, salt) {
  let h = 2166136261 ^ salt;
  h = Math.imul(h ^ (x & 0xffff), 16777619);
  h = Math.imul(h ^ (y & 0xffff), 16777619);
  h = Math.imul(h ^ (z & 0xffff), 16777619);
  h ^= h >>> 13;
  h = Math.imul(h, 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function beltAt(rad) {
  for (const b of [currentSystem.belt, currentSystem.outerBelt]) {
    if (b && rad > b.inner - CELL && rad < b.outer + CELL) return b;
  }
  return null;
}

/** Is this radius icy? The outer belt always; the main belt's cold outer fifth carries frost pockets. */
export function icyAt(belt, rad, h) {
  if (!belt) return false;
  if (belt === currentSystem.outerBelt) return true;
  const edge = (rad - belt.inner) / Math.max(1, belt.outer - belt.inner);
  return edge > 0.8 && h < 0.55; // frost pockets on the shadowed rim
}

/** The ore table for a non-icy rock at this radius of the main belt. */
export function bandAt(belt, rad) {
  if (!belt || belt === currentSystem.outerBelt) return ASTEROID_ORES;
  const edge = (rad - belt.inner) / Math.max(1, belt.outer - belt.inner);
  if (edge < 0.25) return BAND_METAL;
  if (edge > 0.8) return BAND_CARBON;
  return BAND_STONE;
}

/**
 * The band as a NAME, which is what the taxonomy needs.
 *
 * The radial bands from v0.0.4 are still what decides where you are; the
 * asteroid classes (js/bodygen/classes.js) sit on top, so the sunward rim
 * offers M, X and E while the cold outer fifth offers C, B, P and D. The rock
 * then draws its class off its own hash and its ore out of that class's suite,
 * which is why a rock now looks like what it carries.
 */
export function bandNameAt(belt, rad, ice) {
  if (ice) return "ice";
  if (!belt || belt === currentSystem.outerBelt) return "carbon";
  const edge = (rad - belt.inner) / Math.max(1, belt.outer - belt.inner);
  if (edge < 0.25) return "metal";
  if (edge > 0.8) return "carbon";
  return "stone";
}

/**
 * Vein check for a cell: ~7% of main-belt cells are owned by one uncommon
 * ore; rocks in them are that ore and cut rich. Deterministic per cell.
 */
export function veinAt(cx, cy, cz, belt) {
  if (!belt || belt === currentSystem.outerBelt) return null;
  const h = hash(cx, cy, cz, 29);
  if (h > 0.07) return null;
  const ore = VEIN_ORES[Math.floor(hash(cx, cy, cz, 31) * VEIN_ORES.length) % VEIN_ORES.length];
  return ore;
}

function cellRocks(cx, cy, cz, out) {
  const bx = cx * CELL + CELL * 0.5;
  const bz = cz * CELL + CELL * 0.5;
  /* 0.3.20: a contract's job site lays its own rocks into whatever the cell
   * already grows — the seam the job names, on top of the ordinary belt */
  siteRocksInCell(cx, cy, cz, CELL, out, depleted);
  const belt = beltAt(Math.hypot(bx, bz));
  if (!belt) return;
  const density = hash(cx, cy, cz, 7);
  const n = Math.floor(density * PER_CELL) + 2;
  for (let i = 0; i < n; i++) {
    const h1 = hash(cx * 31 + i, cy, cz, 11);
    const h2 = hash(cx, cy * 31 + i, cz, 13);
    const h3 = hash(cx, cy, cz * 31 + i, 17);
    const h4 = hash(cx + i, cy + i, cz + i, 19);
    const y = cy * CELL + h2 * CELL;
    if (Math.abs(y) > BELT_HALF_HEIGHT) continue;
    const key = `${cx}|${cy}|${cz}|${i}`;
    if ((depleted.get(key) ?? 0) >= 1) continue;
    /* heavy tail: mostly gravel, occasionally a mountain */
    const r = 26 + 700 * Math.pow(h4, 2.2);
    /* Composition is fixed by the same hash, so a rock is always the same rock. */
    const rad = Math.hypot(bx, bz);
    const ice = icyAt(belt, rad, h3);
    const vein = ice ? null : veinAt(cx, cy, cz, belt);
    /* the taxonomic class comes off its own hash so it is stable under wear,
     * and the headline ore comes out of that class — the rock you can see is
     * the rock you will cut, all the way down to the assay */
    const cls = classFor(bandNameAt(belt, rad, ice), hash(cx * 17 + i, cy, cz, 23));
    const oreObj = ice ? pickOre(ICE_ORES, h2) : null;
    const oreId = ice ? oreObj.id : vein && h2 < 0.8 ? vein.id : classOre(cls, h2);
    const ore = ORE_BY_ID.get(oreId) ?? ASTEROID_ORES[0];
    /* 0.3.28 — the rock is stored where it BELONGS; the wobble is applied at
     * read time (refreshCell). Everything above this line is a pure function
     * of the cell, so it is worked out once and kept. */
    out.push({
      key,
      bx: cx * CELL + h1 * CELL,
      bz: cz * CELL + h3 * CELL,
      px: h1, pz: h3,
      x: cx * CELL + h1 * CELL,
      y,
      z: cz * CELL + h3 * CELL,
      r,
      spin: 0.05 + h2 * 0.3,
      seed: h4,
      cls,
      ice,
      rich: Boolean(vein && h2 < 0.8),
      ore: ore.id,
      oreName: ore.name,
      worn: depleted.get(key) ?? 0,
    });
  }
}

/* ---- the rock query, and why it is cached twice ---------------------------
 *
 * A rock is a pure function of (cell, sky time), so the same cell asked for
 * twice in one tick is the same answer twice. It was asked for a great deal
 * more than twice: twenty call sites, and within a single tick the engine
 * wants span 2 at the hull, the turrets want span 1 at the hull, the autopilot
 * and the avoidance want their own spans, and EVERY work drone and NPC drone
 * wants span 1 at its own position, which is a different cell each.
 *
 * The old cache was one array and a one-query memo keyed on
 * (cell, span, time). With more than one caller live it never hit once — each
 * query evicted the last — so a belt with a dozen drones in it regenerated the
 * whole 27-cell neighbourhood a dozen times a substep. And because every
 * caller got the SAME array back, anyone holding a result across another call
 * watched it change underneath them (js/turrets.js spreads its result
 * immediately, which reads like somebody was already bitten by this).
 *
 * So there are two caches now, and they do different jobs:
 *
 *   CELL CACHE — the expensive one. One entry per cell, holding that cell's
 *     rocks, thrown away whole when the sky time moves on. Overlapping queries
 *     now share their cells instead of each rebuilding them, which is where
 *     nearly all the saving is: two drones one cell apart share 18 of their 27.
 *
 *   RESULT RING — the aliasing one. Each query gets its own output array out
 *     of a small ring, so two callers in the same tick never hold the same
 *     array. The ring is bounded, so the contract is unchanged and still
 *     stated on the function: copy it if you mean to keep it.
 */
const _cells = new Map();            // "cx,cy,cz" → { at, rocks }: the cell, and the time its wobble is for
let _cellsSys = null;

const RING = 24;                     // distinct live queries per tick before reuse
const _ring = [];
for (let i = 0; i < RING; i++) _ring.push([]);
let _ringAt = 0;
const _memo = new Map();             // query key → the ring array holding its answer
let _memoAt = NaN;

/* opening or closing a site changes what the cells hold: drop the caches */
siteHooks.onChange = () => forgetRocks();

function forgetRocks() {
  _cells.clear();
  _memo.clear();
  _memoAt = NaN;
}

/**
 * The wobble, and how worn each rock is — the only two things about a rock
 * that are not a pure function of its cell. Applied once per cell per sky
 * time, over rocks that already exist.
 */
function refreshCell(rocks, time) {
  const drift = time * 0.0009;
  for (let i = 0; i < rocks.length; i++) {
    const r = rocks[i];
    r.x = r.bx + Math.sin(drift + r.px * 9) * 60;
    r.z = r.bz + Math.cos(drift + r.pz * 9) * 60;
    r.worn = depleted.get(r.key) ?? 0;
  }
}

/**
 * One cell's rocks.
 *
 * 0.3.28 — this used to be keyed on the sky time, which meant it threw the
 * whole belt away and grew it again on every distinct clock value: every
 * sub-tick, for ever, whether or not anything had changed. Measured at the
 * hull in a belt, a frame of queries cost 0.70 ms with the clock running and
 * 0.01 ms with it frozen — the cache was worth ninety-three times its keep and
 * never collected any of it, because in a running game the clock always moves.
 *
 * A rock's identity — where its cell puts it, how big it is, what class it is,
 * what ore it holds — does not depend on the clock at all. Only the wobble
 * does, and how worn it is. So the cell is grown once and kept, and those two
 * are refreshed over it when the clock moves on.
 */
function cellCached(cx, cy, cz, time) {
  if (currentSystem !== _cellsSys) {
    _cells.clear();
    _cellsSys = currentSystem;
  }
  const key = `${cx},${cy},${cz}`;
  let got = _cells.get(key);
  if (!got) {
    got = { at: NaN, rocks: [] };
    cellRocks(cx, cy, cz, got.rocks);
    _cells.set(key, got);
  }
  if (got.at !== time) { refreshCell(got.rocks, time); got.at = time; }
  return got.rocks;
}

/** Rocks within `span` cells of a position. Reuses one array — copy if you keep it, never mutate it. */
export function nearbyRocks(pos, time, span = 2) {
  if (!currentSystem.belt && !currentSystem.outerBelt) { forgetRocks(); _ring[0].length = 0; return _ring[0]; }
  const cx = Math.floor(pos.x / CELL);
  const cy = Math.floor(pos.y / CELL);
  const cz = Math.floor(pos.z / CELL);
  if (time !== _memoAt || currentSystem !== _cellsSys) { _memo.clear(); _memoAt = time; }
  const key = `${cx},${cy},${cz},${span}`;
  const hit = _memo.get(key);
  if (hit) return hit;

  const out = _ring[_ringAt];
  _ringAt = (_ringAt + 1) % RING;
  /* the ring recycled an array that an earlier query in this same tick is
   * still filed under — drop that memo entry so nobody is handed a stale one */
  for (const [k, v] of _memo) if (v === out) { _memo.delete(k); break; }
  out.length = 0;
  for (let i = -span; i <= span; i++) {
    for (let k = -span; k <= span; k++) {
      for (let j = -1; j <= 1; j++) {
        const cell = cellCached(cx + i, cy + j, cz + k, time);
        for (let n = 0; n < cell.length; n++) out.push(cell[n]);
      }
    }
  }
  _memo.set(key, out);
  return out;
}

/**
 * How far, and which way, to the clean space above or below the belt.
 *
 * Returns null when there is nothing to climb out of. Otherwise `{ sign, need,
 * y }`: which way is shorter, how much further there is to go, and the
 * altitude that is clear. `margin` buys some room above the last rock so we do
 * not arrive exactly on the boundary and get dragged back in by the next
 * wobble.
 */
export function beltExit(pos, margin = 900) {
  if (!inBelt(pos)) return null;
  const sign = pos.y >= 0 ? 1 : -1;
  const y = sign * (BELT_HALF_HEIGHT + margin);
  return { sign, y, need: Math.max(0, Math.abs(y) - Math.abs(pos.y)) };
}

/** Is this position clear of the rock layer, wherever it is in the annulus? */
export function aboveBelt(pos, margin = 600) {
  return Math.abs(pos.y) > BELT_HALF_HEIGHT + margin;
}

export function inBelt(pos) {
  if (Math.abs(pos.y) > BELT_HALF_HEIGHT + CELL) return false;
  const rad = Math.hypot(pos.x, pos.z);
  for (const b of [currentSystem.belt, currentSystem.outerBelt]) {
    if (b && rad > b.inner - CELL * 2 && rad < b.outer + CELL * 2) return true;
  }
  return false;
}

/* Rocks that were cut out, newest last, for whoever wants to see them go (the
 * renderer bursts a grown body into a shatter field). Keys only, bounded: a
 * queue nobody drains must not grow. */
export const brokenRocks = [];

export function wearRock(key, amount) {
  const cur = depleted.get(key) ?? 0;
  const next = Math.min(1, cur + amount);
  depleted.set(key, next);
  if (cur < 1 && next >= 1) {
    brokenRocks.push(key);
    if (brokenRocks.length > 32) brokenRocks.shift();
    /* it is GONE, so the cells that held it have to be grown again without it */
    forgetRocks();
    return next;
  }
  /* 0.3.28 — a rock being cut is still the same rock in the same place. This
   * used to drop every cached cell on every tick of the cutter, which is sixty
   * full rebuilds of the whole neighbourhood a second while you are mining —
   * the one moment you are certainly parked next to a rock and looking at it.
   * `refreshCell` reads the wear off the same map, so there is nothing to
   * invalidate: the number updates itself on the next query. */
  return next;
}

/**
 * A black hole passing through the belt (js/holes.js) takes whole rocks at a
 * time. One rock-cache flush for the lot — `wearRock` flushes per call, and a
 * hole eats hundreds a second. Eaten rocks do not shatter: they fall in.
 */
export function eatRocks(keys) {
  for (const k of keys) depleted.set(k, 1);
  forgetRocks();
}

export function resetField() {
  depleted.clear();
  brokenRocks.length = 0;
  forgetRocks();
}
