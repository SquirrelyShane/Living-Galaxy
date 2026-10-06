import { traffic, vesselById, trafficHooks, HOSTILE_ROLES } from "./traffic.js";
import { flow } from "./flow.js";
import { distress } from "./security.js";
import { engagementAt } from "./battles.js";
import { nests } from "./rogues.js";
import { stations } from "../station/stations.js";
import { currentSystem } from "../world/bodies.js";
import { nearbyRocks, bandNameAt } from "../world/field.js";
import { baseValue, goodName } from "../economy/materials.js";

export const PORT_R = 4000;
export const THREAT_R = 3000;
export const BELT_THREAT_R = 6000;
export const HIT_FRESH_S = 25;

const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const km = (u) => u / 100;

function beltOf(rad) {
  for (const [b, name] of [[currentSystem.belt, "the belt"], [currentSystem.outerBelt, "the outer belt"]]) {
    if (b && rad > b.inner - 1500 && rad < b.outer + 1500) return { belt: b, name };
  }
  return null;
}

export function placeOf(p) {
  let best = null, bd = Infinity;
  for (const st of stations) { const d = d3(st, p); if (d < bd) { bd = d; best = st; } }
  if (best && bd < PORT_R) return { kind: "port", station: best, dist: bd, name: best.name };
  const rad = Math.hypot(p.x, p.z);
  const b = beltOf(rad);
  if (b) return { kind: "belt", name: b.name, band: bandNameAt(b.belt, rad, false), nearest: best, dist: bd };
  return { kind: "space", nearest: best, dist: bd, name: best ? `${Math.round(km(bd))} km out from ${best.name}` : "open space" };
}

export function placePhrase(pl) {
  if (!pl) return "out here";
  if (pl.kind === "port") return pl.dist < 900 ? `on ${pl.name}'s lanes` : `off ${pl.name}`;
  if (pl.kind === "belt") return pl.nearest ? `on ${pl.name} out past ${pl.nearest.name}` : `on ${pl.name}`;
  return pl.name;
}

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

function nameOf(id) {
  if (!id) return null;
  if (id === "self") return "you";
  const v = vesselById(id);
  return v ? v.name : null;
}

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
  let count = attackers.length;
  if (!count) for (const v of traffic) if (v !== n && v.job !== "down" && (v.rogue || HOSTILE_ROLES.has(v.role)) && d3(v, n) < 2000) count++;
  if (!count && byName) count = 1;
  const hp = n.hpMax ? Math.max(0, Math.round((n.hp / n.hpMax) * 100)) : null;
  return { since: Math.min(hitAt ?? t, call?.at ?? t, victimOfEng?.start ?? t), by: byName, kind, count, hp, call, engagement: victimOfEng };
}

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
  const pirate = pirates[0], rogue = rogues[0];
  const nearest = !pirate ? rogue ?? null : !rogue || pirate.d <= rogue.d ? pirate : rogue;
  return { pirates, rogues, nest, count: pirates.length + rogues.length, nearest };
}

export function bearingTo(a, b) {
  const deg = (Math.atan2(b.x - a.x, -(b.z - a.z)) * 180) / Math.PI;
  return Math.round((deg + 360) % 360);
}

export function rockUnits(k) {
  const rate = (2.5 + Math.pow((k.r ?? 40) / 60, 1.5) * 5) * (k.rich ? 1.6 : 1) * 0.5;
  return rate * 31 * Math.max(0, 1 - (k.worn ?? 0));
}

const _survey = new Map();

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
  const pays = ores.slice().sort((a, b) => b.worth - a.worth)[0] ?? null;
  const worth = ores.reduce((s, e) => s + e.worth, 0);
  const perUnit = units > 0 ? worth / units : 0;
  const grade = Math.max(0, Math.min(1, Math.log2(1 + perUnit / 4) / 4.2));
  const s = { rocks: rocksN, units: Math.round(units), ores, best, common, pays, worth, grade };
  _survey.set(key, { t, s });
  if (_survey.size > 200) _survey.delete(_survey.keys().next().value);
  return s;
}

export function unitsPhrase(n) {
  if (n < 15) return "a few units";
  const r = n < 100 ? Math.round(n / 5) * 5 : n < 1000 ? Math.round(n / 10) * 10 : Math.round(n / 50) * 50;
  return `about ${r.toLocaleString("en-US")} units`;
}

export function countWord(n) {
  const W = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
  return n <= 12 ? W[n] : String(n);
}

trafficHooks.claimOre = (p, t) => {
  const s = claimSurvey(p, t);
  return s.pays?.id ?? null;
};
