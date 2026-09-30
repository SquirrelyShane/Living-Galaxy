import { generateRobot } from "../robotgen/spec.js";
import { DRONE_ROLES } from "./roles.js";

export const DRONE_KINDS = {
  sdrone: { role: "interceptor", locomotion: "plane", len: 8, label: "interceptor" },
  guard: { role: "sentry", locomotion: "hover", len: 10, label: "gun drone" },
  probe: { role: "survey", locomotion: "plane", len: 5, label: "survey probe" },
};
for (const r of Object.values(DRONE_ROLES)) DRONE_KINDS[r.id] = { ...r.robot, label: r.label.toLowerCase() };

const SECTOR_PALETTES = {
  logistic: ["civic", "chrome", "glacier"],
  military: ["military", "security", "ferrite"],
  industrial: ["industrial", "hazard", "ferrite"],
  civilian: ["civic", "ceramic", "medical"],
  agricultural: ["agri", "verdigris", "ceramic"],
  pirate: ["void", "stealth", "rust", "biolume"],
};
const PROBE_PALETTES = ["survey", "glacier", "chrome"];
const WORK_PALETTES = ["hazard", "industrial", "civic", "chrome", "survey", "rescue"];

function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

export function droneSpec(kind, seed, sector = null) {
  const K = DRONE_KINDS[kind] ?? DRONE_KINDS.guard;
  const pool = kind === "probe" ? PROBE_PALETTES : SECTOR_PALETTES[sector] ?? (DRONE_ROLES[kind] ? WORK_PALETTES : null);
  const palette = pool ? pool[hash(`${seed}:livery`) % pool.length] : undefined;
  return generateRobot(`${kind}:${seed}`, { role: K.role, locomotion: K.locomotion, palette });
}

const SUMMARY_CACHE = new Map();
const SUMMARY_CACHE_MAX = 200;

export function droneSummary(kind, seed, sector = null) {
  const key = `${kind}|${seed}|${sector ?? ""}`;
  const hit = SUMMARY_CACHE.get(key);
  if (hit) return hit;
  const out = buildSummary(kind, seed, sector);
  if (SUMMARY_CACHE.size >= SUMMARY_CACHE_MAX) SUMMARY_CACHE.delete(SUMMARY_CACHE.keys().next().value);
  SUMMARY_CACHE.set(key, out);
  return out;
}

function buildSummary(kind, seed, sector) {
  const spec = droneSpec(kind, seed, sector);
  const s = spec.stats ?? {};
  return {
    kind,
    designation: spec.designation,
    career: spec.career?.label ?? DRONE_KINDS[kind]?.label ?? kind,
    chassis: spec.locomotion?.type ?? "",
    palette: spec.palette?.name ?? "",
    massKg: Math.round(s.massKg ?? 0),
    parts: s.partCount ?? 0,
    costCr: Math.round(s.costCr ?? 0),
    enduranceMin: Math.round(s.enduranceMin ?? 0),
  };
}
