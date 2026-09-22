/* LIVING GALAXY — ground truth for anything said on the band.
 *
 * 0.3.16. The open channel used to make claims nobody checked: a hull said
 * the lane off a port was "stacked" while it was forty kilometres out in
 * open space bound FOR that port; a pirate mid-raid broadcast that it was
 * "taking fire"; a victim actually being shot kept quiet because its speech
 * unit read hull 100 % off a job string; miners called their seam "good" off
 * a hash that never changed, and never said what was in it, how much, or who
 * was sitting on the belt with them.
 *
 * Everything here answers one question about the live sky, from the live
 * sky, and nothing else — no rolls, no templates. js/npc/speech.js grounds
 * the speech engine's units and callbacks on it, and js/npc/reports.js builds
 * the band's first-hand reports from it.
 *
 *   placeOf(p)            where a point actually is: a port's approaches, a
 *                         belt, or open space (and the port it is nearest)
 *   portCensus(st)        who is actually around a port right now
 *   underFire(n, t)       is this hull being shot at, by whom, how badly
 *   threatsNear(p, r)     raiders and rogue drones actually within r
 *   claimSurvey(p, t)     what is in the rock at a claim: ores, amounts, value
 *
 * Units: 1 world unit = 10 m, so 100 u is a kilometre.
 */

import { traffic, vesselById, trafficHooks, HOSTILE_ROLES } from "./traffic.js";
import { flow } from "./flow.js";
import { distress } from "./security.js";
import { engagementAt } from "./battles.js";
import { nests } from "./rogues.js";
import { stations } from "../stations.js";
import { currentSystem } from "../bodies.js";
import { nearbyRocks, bandNameAt } from "../field.js";
import { baseValue, goodName } from "../materials.js";

export const PORT_R = 4000;          // 40 km: "around" a port — its approaches, its lanes, its ring
export const THREAT_R = 3000;        // 30 km: a contact worth calling
export const BELT_THREAT_R = 6000;   // 60 km: a raider or drone near enough to a claim to matter
export const HIT_FRESH_S = 25;       // a hit this recent means the shooting is still going on

const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const km = (u) => u / 100;

/* ---- where ------------------------------------------------------------------ */

function beltOf(rad) {
  for (const [b, name] of [[currentSystem.belt, "the belt"], [currentSystem.outerBelt, "the outer belt"]]) {
    if (b && rad > b.inner - 1500 && rad < b.outer + 1500) return { belt: b, name };
  }
  return null;
}

/**
 * Where a point is, said the way a pilot would place it.
 *   { kind: "port", station, dist, name }       inside PORT_R of a port
 *   { kind: "belt", name, band, nearest, dist } in a belt (band: metal/stone/carbon/ice)
 *   { kind: "space", nearest, dist, name }      anywhere else ("12 km out from X")
 */
export function placeOf(p) {
  let best = null, bd = Infinity;
  for (const st of stations) { const d = d3(st, p); if (d < bd) { bd = d; best = st; } }
  if (best && bd < PORT_R) return { kind: "port", station: best, dist: bd, name: best.name };
  const rad = Math.hypot(p.x, p.z);
  const b = beltOf(rad);
  if (b) return { kind: "belt", name: b.name, band: bandNameAt(b.belt, rad, false), nearest: best, dist: bd };
  return { kind: "space", nearest: best, dist: bd, name: best ? `${Math.round(km(bd))} km out from ${best.name}` : "open space" };
}

/** A place as an adverbial: "off Smelt Station", "on the belt past Smelt Station", "80 km out from Smelt Station". */
export function placePhrase(pl) {
  if (!pl) return "out here";
  if (pl.kind === "port") return pl.dist < 900 ? `on ${pl.name}'s lanes` : `off ${pl.name}`;
  if (pl.kind === "belt") return pl.nearest ? `on ${pl.name} out past ${pl.nearest.name}` : `on ${pl.name}`;
  return pl.name;
}

/* ---- who is around a port ------------------------------------------------------ */

/**
 * Hulls actually on the board around a port right now — named traffic, flow
 * boats, both counted only if visible and inside PORT_R — split by what they
 * are doing there. Docked hulls are inside the ring and not "around" it.
 */
export function portCensus(st, R = PORT_R) {
  const out = { station: st, total: 0, inbound: 0, outbound: 0, bay: 0, working: 0, raiders: 0, law: 0, names: [] };
  if (!st) return out;
  for (const n of traffic) {
    if (n.visible === false || n.job === "down" || n.job === "docked") continue;
    if (d3(n, st) > R) continue;
    out.total++;
    if (HOSTILE_ROLES.has(n.role) || n.rogue) out.raiders++;
    else if (n.role === "patrol" || n.role === "security") out.law++;
    if (n.state === "berth" || n.state === "unberth") out.bay++;
    else if (n.job === "approach") out.inbound++;
    else if (n.job === "outbound") out.outbound++;
    else out.working++;
    if (out.names.length < 3 && !n.rogue && !HOSTILE_ROLES.has(n.role)) out.names.push(n.name);
  }
  for (const b of flow) {
    if (!b.visible || b.port !== st.id || d3(b, st) > R) continue;
    out.total++;
    if (b.lane === "bay") out.bay++;
    else if (b.job === "approach") out.inbound++;
    else out.outbound++;
  }
  return out;
}

/* ---- who is being shot --------------------------------------------------------- */

function nameOf(id) {
  if (!id) return null;
  if (id === "self") return "you";
  const v = vesselById(id);
  return v ? v.name : null;
}

/**
 * Is `n` under fire right now? Real only: a hit inside HIT_FRESH_S, an open
 * distress call it raised that is still being hit, or a live engagement it
 * is the VICTIM of (the wing's tracers are flying at it). A raider in the
 * middle of its own attack is not under fire unless something is shooting
 * back at it — it does not get to call a mayday.
 */
export function underFire(n, t) {
  if (!n || n.job === "down") return null;
  const hitAt = typeof n.lastHitAt === "number" ? n.lastHitAt : null;
  const fresh = hitAt != null && t - hitAt < HIT_FRESH_S && t >= hitAt;
  const call = distress.find((c) => c.victimId === n.id && c.state !== "closed" && t - (c.lastHitAt ?? c.at) < HIT_FRESH_S * 1.5);
  let eng = null;
  try { eng = engagementAt(t); } catch { eng = null; }
  const victimOfEng = eng && eng.victimId === n.id && t >= eng.start && t < eng.end ? eng : null;
  if (!fresh && !call && !victimOfEng) return null;
  const attackers = [];
  if (victimOfEng) for (const id of victimOfEng.wing) { const v = vesselById(id); if (v && v.job !== "down") attackers.push(v); }
  let byName = nameOf(n.lastHitBy) ?? call?.attackerName ?? (attackers[0]?.name ?? null);
  const kind = attackers.length ? "pirate" : call?.kind ?? (vesselById(n.lastHitBy)?.rogue ? "rogue" : HOSTILE_ROLES.has(vesselById(n.lastHitBy)?.role) ? "pirate" : n.lastHitBy === "self" ? "player" : "unknown");
  /* count what is actually shooting: the wing, plus hostile hulls closing inside 2 km */
  let count = attackers.length;
  if (!count) for (const v of traffic) if (v !== n && v.job !== "down" && (v.rogue || HOSTILE_ROLES.has(v.role)) && d3(v, n) < 2000) count++;
  if (!count && byName) count = 1;
  const hp = n.hpMax ? Math.max(0, Math.round((n.hp / n.hpMax) * 100)) : null;
  return { since: Math.min(hitAt ?? t, call?.at ?? t, victimOfEng?.start ?? t), by: byName, kind, count, hp, call, engagement: victimOfEng };
}

/* ---- threats ------------------------------------------------------------------- */

/** Raiders and rogue drones actually on the board within r of p, nearest first, plus any known nest inside r. */
export function threatsNear(p, r = THREAT_R, except = null) {
  const pirates = [], rogues = [];
  for (const n of traffic) {
    if (n === except || n.visible === false || n.job === "down" || n.job === "docked") continue;
    const isRogue = Boolean(n.rogue), isPirate = HOSTILE_ROLES.has(n.role);
    if (!isRogue && !isPirate) continue;
    const d = d3(n, p);
    if (d > r) continue;
    (isRogue ? rogues : pirates).push({ n, d });
  }
  pirates.sort((a, b) => a.d - b.d);
  rogues.sort((a, b) => a.d - b.d);
  let nest = null;
  for (const ns of nests) { if (ns.hp > 0 && d3(ns, p) < r * 1.5) { nest = ns; break; } }
  const nearest = [...pirates, ...rogues].sort((a, b) => a.d - b.d)[0] ?? null;
  return { pirates, rogues, nest, count: pirates.length + rogues.length, nearest };
}

/** Bearing from a to b as a compass number, 0..359 on the flat x/z plane (0 = −z, clockwise). */
export function bearingTo(a, b) {
  const deg = (Math.atan2(b.x - a.x, -(b.z - a.z)) * 180) / Math.PI;
  return Math.round((deg + 360) % 360);
}

/* ---- what is in the rock --------------------------------------------------------- */

/* units a rock gives a working cutter before it is spent — the same yield curve
 * turrets.js cuts with (2.5 + (r/60)^1.5 · 5 u/s at MINE_YIELD 0.5, ~31 s a rock) */
export function rockUnits(k) {
  const rate = (2.5 + Math.pow((k.r ?? 40) / 60, 1.5) * 5) * (k.rich ? 1.6 : 1) * 0.5;
  return rate * 31 * Math.max(0, 1 - (k.worn ?? 0));
}

const _survey = new Map();

/**
 * What is in the rock around a claim: every ore on the rocks within one cell,
 * how many units a cutter would actually get, what it is worth at book, which
 * are rich seams. Sorted by value, richest first. Cached per claim cell for
 * thirty seconds of sky time (the field drifts slowly and wears as it is cut).
 */
export function claimSurvey(p, t) {
  const key = `${Math.floor(p.x / 3000)},${Math.floor(p.y / 3000)},${Math.floor(p.z / 3000)}`;
  const hit = _survey.get(key);
  if (hit && Math.abs(t - hit.t) < 30) return hit.s;
  const rocks = nearbyRocks(p, t, 1);
  const by = new Map();
  let units = 0, rocksN = 0;
  for (const k of rocks) {
    if (k.worn >= 1) continue;
    const u = rockUnits(k);
    if (u <= 0) continue;
    rocksN++;
    units += u;
    const e = by.get(k.ore) ?? { id: k.ore, name: k.oreName ?? goodName(k.ore), units: 0, rocks: 0, rich: 0, value: baseValue(k.ore) };
    e.units += u; e.rocks++; if (k.rich) e.rich++;
    by.set(k.ore, e);
  }
  const ores = [...by.values()].map((e) => ({ ...e, units: Math.round(e.units), worth: Math.round(e.units * e.value) }));
  ores.sort((a, b) => b.value - a.value || b.units - a.units);
  const common = ores.slice().sort((a, b) => b.units - a.units)[0] ?? null;
  const best = ores[0] ?? null;
  /* what a cutter would work: the most money in the rock, not the most rock */
  const pays = ores.slice().sort((a, b) => b.worth - a.worth)[0] ?? null;
  const worth = ores.reduce((s, e) => s + e.worth, 0);
  /* a grade the speech engine understands, 0..1: book value per unit against iron's */
  const perUnit = units > 0 ? worth / units : 0;
  const grade = Math.max(0, Math.min(1, Math.log2(1 + perUnit / 4) / 4.2));
  const s = { rocks: rocksN, units: Math.round(units), ores, best, common, pays, worth, grade };
  _survey.set(key, { t, s });
  if (_survey.size > 200) _survey.delete(_survey.keys().next().value);
  return s;
}

/** Say an amount of ore the way a cutter would: "about 340 units". */
export function unitsPhrase(n) {
  if (n < 15) return "a few units";
  const r = n < 100 ? Math.round(n / 5) * 5 : n < 1000 ? Math.round(n / 10) * 10 : Math.round(n / 50) * 50;
  return `about ${r.toLocaleString("en-US")} units`;
}

export function countWord(n) {
  const W = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
  return n <= 12 ? W[n] : String(n);
}

/* the timetable asks what a finished claim sends home */
trafficHooks.claimOre = (p, t) => {
  const s = claimSurvey(p, t);
  return s.pays?.id ?? null;
};
