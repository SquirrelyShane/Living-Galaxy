import { currentSystem } from "./bodies.js";
import { ORES } from "../economy/materials.js";
import { classFor, classOre } from "../bodygen/classes.js";
import { siteRocksInCell, siteHooks, classForOre, siteRocks, siteRockBase } from "../economy/sites.js";

const ASTEROID_ORES = ORES.filter((o) => o.found.includes("asteroid"));
const byIds = (...ids) => ORES.filter((o) => ids.includes(o.id));
export const BAND_METAL = byIds("iron_ore", "nickel_ore", "chromite", "ilmenite", "pentlandite", "galena", "platinum_ore", "iridium_ore", "uraninite");
export const BAND_STONE = byIds("silicate", "regolith", "iron_ore", "bauxite", "copper_ore", "sphalerite", "cassiterite", "monazite");
export const BAND_CARBON = byIds("carbonaceous", "regolith", "sphalerite", "galena", "tholins");
export const VEIN_ORES = byIds("chromite", "ilmenite", "pentlandite", "cassiterite", "monazite", "galena", "platinum_ore", "iridium_ore", "uraninite");
export const ICE_ORES = ORES.filter((o) => ["water_ice", "methane_ice", "nitrogen_ice", "ammonia_ice", "tholins"].includes(o.id));

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

export const BELT = { emptyCell: 0.22, perCell: 7, perCellExp: 1.25, matrix: { metal: 0.5, stone: 0.72, carbon: 0.7 }, veinCells: 0.03, veinShare: 0.55 };
const MATRIX = {
  metal: [["iron_ore", 0.6], ["silicate", 1]],
  stone: [["silicate", 0.6], ["regolith", 1]],
  carbon: [["carbonaceous", 0.65], ["regolith", 1]],
};
function matrixOre(band, h) {
  for (const [id, upTo] of MATRIX[band] ?? MATRIX.stone) if (h < upTo) return id;
  return "silicate";
}
export const BELT_HALF_HEIGHT = 3200;

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

export function icyAt(belt, rad, h) {
  if (!belt) return false;
  if (belt === currentSystem.outerBelt) return true;
  const edge = (rad - belt.inner) / Math.max(1, belt.outer - belt.inner);
  return edge > 0.8 && h < 0.55;
}

export function bandAt(belt, rad) {
  if (!belt || belt === currentSystem.outerBelt) return ASTEROID_ORES;
  const edge = (rad - belt.inner) / Math.max(1, belt.outer - belt.inner);
  if (edge < 0.25) return BAND_METAL;
  if (edge > 0.8) return BAND_CARBON;
  return BAND_STONE;
}

export function bandNameAt(belt, rad, ice) {
  if (ice) return "ice";
  if (!belt || belt === currentSystem.outerBelt) return "carbon";
  const edge = (rad - belt.inner) / Math.max(1, belt.outer - belt.inner);
  if (edge < 0.25) return "metal";
  if (edge > 0.8) return "carbon";
  return "stone";
}

export function veinAt(cx, cy, cz, belt) {
  if (!belt || belt === currentSystem.outerBelt) return null;
  const h = hash(cx, cy, cz, 29);
  if (h > BELT.veinCells) return null;
  const ore = VEIN_ORES[Math.floor(hash(cx, cy, cz, 31) * VEIN_ORES.length) % VEIN_ORES.length];
  return ore;
}

function cellRocks(cx, cy, cz, out) {
  const bx = cx * CELL + CELL * 0.5;
  const bz = cz * CELL + CELL * 0.5;
  siteRocksInCell(cx, cy, cz, CELL, out, depleted);
  const belt = beltAt(Math.hypot(bx, bz));
  if (!belt) return;
  const density = hash(cx, cy, cz, 7);
  if (density < BELT.emptyCell) return;
  const n = 1 + Math.floor(Math.pow((density - BELT.emptyCell) / (1 - BELT.emptyCell), BELT.perCellExp) * BELT.perCell);
  for (let i = 0; i < n; i++) {
    const h1 = hash(cx * 31 + i, cy, cz, 11);
    const h2 = hash(cx, cy * 31 + i, cz, 13);
    const h3 = hash(cx, cy, cz * 31 + i, 17);
    const h4 = hash(cx + i, cy + i, cz + i, 19);
    const y = cy * CELL + h2 * CELL;
    if (Math.abs(y) > BELT_HALF_HEIGHT) continue;
    const key = `${cx}|${cy}|${cz}|${i}`;
    if ((depleted.get(key) ?? 0) >= 1) continue;
    const r = 26 + 700 * Math.pow(h4, 2.2);
    const rad = Math.hypot(bx, bz);
    const ice = icyAt(belt, rad, h3);
    const vein = ice ? null : veinAt(cx, cy, cz, belt);
    const band = bandNameAt(belt, rad, ice);
    let cls = classFor(band, hash(cx * 17 + i, cy, cz, 23));
    const oreObj = ice ? pickOre(ICE_ORES, h2) : null;
    const rich = Boolean(vein && h2 < BELT.veinShare);
    const plain = !ice && !rich && hash(cx * 7 + i, cy * 3 + i, cz, 41) < (BELT.matrix[band] ?? 0.7);
    const oreId = ice ? oreObj.id : rich ? vein.id : plain ? matrixOre(band, h2) : classOre(cls, h2);
    if (plain) cls = classForOre(oreId);
    const ore = ORE_BY_ID.get(oreId) ?? ASTEROID_ORES[0];
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
      rich,
      ore: ore.id,
      oreName: ore.name,
      worn: depleted.get(key) ?? 0,
    });
  }
}

export function rocksInCell(cx, cy, cz) { const out = []; cellRocks(cx, cy, cz, out); return out; }

export const CELL_CACHE_LIMIT = 2048;
const _cells = new Map();
export function fieldCacheStats() { return { cells: _cells.size, limit: CELL_CACHE_LIMIT }; }
let _cellsSys = null;

const RING = 24;
const _ring = [];
for (let i = 0; i < RING; i++) _ring.push([]);
let _ringAt = 0;
const _memo = new Map();
let _memoAt = NaN;

siteHooks.onChange = () => forgetRocks();

function forgetRocks() {
  _cells.clear();
  _memo.clear();
  _memoAt = NaN;
}

function refreshCell(rocks, time) {
  const drift = time * 0.0009;
  for (let i = 0; i < rocks.length; i++) {
    const r = rocks[i];
    r.x = r.bx + Math.sin(drift + r.px * 9) * 60;
    r.z = r.bz + Math.cos(drift + r.pz * 9) * 60;
    r.worn = depleted.get(r.key) ?? 0;
  }
}

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
    if (_cells.size > CELL_CACHE_LIMIT) _cells.delete(_cells.keys().next().value);
  } else {
    _cells.delete(key);
    _cells.set(key, got);
  }
  if (got.at !== time) { refreshCell(got.rocks, time); got.at = time; }
  return got.rocks;
}

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

export function rockByKey(key, time) {
  if (typeof key !== "string") return null;
  let cx, cy, cz;
  if (key.startsWith("site:")) {
    const b = siteRockBase(key);
    if (!b) return null;
    cx = Math.floor(b.x / CELL); cy = Math.floor(b.y / CELL); cz = Math.floor(b.z / CELL);
  } else {
    const p = key.split("|");
    if (p.length !== 4) return null;
    cx = Number(p[0]); cy = Number(p[1]); cz = Number(p[2]);
    if (!Number.isInteger(cx) || !Number.isInteger(cy) || !Number.isInteger(cz)) return null;
  }
  const rocks = cellCached(cx, cy, cz, time);
  for (let i = 0; i < rocks.length; i++) if (rocks[i].key === key) return (rocks[i].worn ?? 0) < 1 ? rocks[i] : null;
  return null;
}

export function siteMarkRock(siteId, time, prefer = null) {
  if (prefer && !markSkipped(prefer, time)) {
    const r = rockByKey(prefer, time);
    if (r && r.site === String(siteId)) return r;
  }
  let best = null, fallback = null;
  for (const b of siteRocks(siteId)) {
    if ((depleted.get(b.key) ?? 0) >= 1) continue;
    if (!fallback || b.r > fallback.r) fallback = b;
    if (markSkipped(b.key, time)) continue;
    if (!best || b.r > best.r) best = b;
  }
  const pick = best ?? fallback;
  return pick ? rockByKey(pick.key, time) : null;
}

const markSkip = new Map();
export function skipMarkRock(key, until) { if (key) markSkip.set(key, until); }
export function markSkipped(key, time) {
  const until = markSkip.get(key);
  if (until === undefined) return false;
  if (until > time) return true;
  markSkip.delete(key);
  return false;
}

export function beltExit(pos, margin = 900) {
  if (!inBelt(pos)) return null;
  const sign = pos.y >= 0 ? 1 : -1;
  const y = sign * (BELT_HALF_HEIGHT + margin);
  return { sign, y, need: Math.max(0, Math.abs(y) - Math.abs(pos.y)) };
}

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

export const brokenRocks = [];

export function wearRock(key, amount) {
  const cur = depleted.get(key) ?? 0;
  const next = Math.min(1, cur + amount);
  depleted.set(key, next);
  if (cur < 1 && next >= 1) {
    brokenRocks.push(key);
    if (brokenRocks.length > 32) brokenRocks.shift();
    forgetRocks();
    return next;
  }
  return next;
}

export function eatRocks(keys) {
  for (const k of keys) depleted.set(k, 1);
  forgetRocks();
}

export function resetField() {
  depleted.clear();
  markSkip.clear();
  brokenRocks.length = 0;
  forgetRocks();
}
