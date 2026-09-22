/* LIVING GALAXY — robot crew.
 *
 * A yard at an industrial, civilian or military port prints one design per
 * kind from the ROBOTGEN catalogue (robotgen/spec.js, the same generator the
 * drone lines use). A bought robot is a crew member with `robot: true`: it
 * stands a station like a hand does (its complexId puts it in a room via
 * deckplan.stationRoomFor), but it draws no wage, has no morale worth
 * moving, courts nobody and cannot hold the conn. What it wants instead is
 * power — Σ kW lands on ship.extraDraw — and maintenance: condition falls
 * with the hull's wear backlog and comes back under an engineer, or at a
 * yard for credits. Robots persist per sky: they are property.
 * Contract: PLAN.md §4.7.
 */

import { generateRobot } from "../robotgen/spec.js";
import { crew } from "../crew.js";
import { sim } from "../sim.js";
import { fx } from "../upgrades.js";
import { duties } from "./duties.js";
import { PRONOUNS } from "../npc/cradle.js";

/** kind → robotgen role, complexId (→ station via deckplan.stationRoomFor), power, base price */
export const ROBOT_KINDS = {
  deckhand: { label: "Deckhand",  role: "labor",      loco: "biped",   complexId: "logistics",      kw: 1.2, base: 2600 },
  engineer: { label: "Engineer",  role: "utility",    loco: "biped",   complexId: "energy",         kw: 1.6, base: 4200 },
  medic:    { label: "Medic",     role: "medic",      loco: "wheeled", complexId: "healthcare",     kw: 1.1, base: 3800 },
  steward:  { label: "Steward",   role: "service",    loco: "wheeled", complexId: "education",      kw: 0.8, base: 2200 },
  marshal:  { label: "Marshal",   role: "security",   loco: "biped",   complexId: "security",       kw: 1.8, base: 5200 },
  sensor:   { label: "Signals",   role: "comms",      loco: "tracked", complexId: "communications", kw: 1.3, base: 3400 },
  worker:   { label: "Line hand", role: "industrial", loco: "tracked", complexId: null,             kw: 2.0, base: 4800 },
};

export const ROBOT_PRICE_K = 0.12;
export const ROBOT_SECTORS = ["industrial", "civilian", "military"];

/* the rates, per second of sim time */
export const ROBOT_WEAR = 0.02;       // condition/s × (1 + duties.wear), halved by the charging bay
export const ROBOT_REPAIR = 0.05;     // condition/s an engineer at Engineering restores to each other robot
export const ROBOT_IDLE_AT = 30;      // below this a robot is off the rota until serviced
export const SERVICE_CR = 60;         // per point of condition at a yard
export const SCRAP_REFUND = 0.4;

/** { n: lifetime buys this sky (ids), sinceSave: seconds } */
export const robots = { n: 0, sinceSave: 0 };

/* a port's livery follows its sector, as the drone lines do */
const SECTOR_PALETTES = {
  industrial: ["industrial", "hazard", "ferrite"],
  military: ["military", "security", "ferrite"],
  civilian: ["civic", "ceramic", "medical"],
  logistic: ["civic", "chrome", "glacier"],
  agricultural: ["agri", "verdigris", "ceramic"],
};

function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/* the generator is not cheap: remember the designs already printed */
const DESIGN_CACHE = new Map();
const DESIGN_CACHE_MAX = 120;

/** The yard's tag for one (kind, seed, sector): designation, chassis, mass, kW, cost. */
export function robotDesign(kind, seed, sector = null) {
  const key = `${kind}|${seed}|${sector ?? ""}`;
  const hit = DESIGN_CACHE.get(key);
  if (hit) return hit;
  const K = ROBOT_KINDS[kind] ?? ROBOT_KINDS.deckhand;
  const pool = SECTOR_PALETTES[sector] ?? null;
  const palette = pool ? pool[hash(`${seed}:${kind}:livery`) % pool.length] : undefined;
  const spec = generateRobot(`${kind}:${seed}`, { role: K.role, locomotion: K.loco, palette });
  const s = spec.stats ?? {};
  const out = {
    kind,
    designation: spec.designation,
    nickname: spec.nickname,
    career: spec.roleLabel ?? spec.career?.label ?? K.label,
    chassis: spec.locomotion?.type ?? spec.locomotion ?? K.loco,
    palette: spec.palette?.name ?? palette ?? "",
    height: spec.height ?? 0,
    massKg: Math.round(s.massKg ?? 0),
    parts: s.partCount ?? 0,
    costCr: Math.round(s.costCr ?? 0),
    armor: s.armor ?? 0,
  };
  if (DESIGN_CACHE.size >= DESIGN_CACHE_MAX) DESIGN_CACHE.delete(DESIGN_CACHE.keys().next().value);
  DESIGN_CACHE.set(key, out);
  return out;
}

function priceOf(K, design) {
  return Math.round((K.base + design.costCr * ROBOT_PRICE_K) / 10) * 10;
}

function berthsUsedAboard() {
  return crew.aboard.length;
}

/** What buying `kind` here would run into, or null. */
function blockerFor(K, st, price) {
  if (!st || !ROBOT_SECTORS.includes(st.sector)) return `no robot yard at a ${st?.sector ?? "—"} port`;
  if (berthsUsedAboard() >= (sim.robotCapacity ?? sim.crewCapacity ?? 2)) return "no frames or berths free";
  if ((sim.ship?.credits ?? 0) < price) return `short ${Math.ceil(price - sim.ship.credits).toLocaleString()} cr`;
  return null;
}

/** → [{ kind, label, designation, spec, price, kw, blocker }] — one design per (kind, port). */
export function robotCatalogue(st, seed = `${sim.callsign}:${st?.id}`) {
  return Object.entries(ROBOT_KINDS).map(([kind, K]) => {
    const spec = robotDesign(kind, seed, st?.sector ?? null);
    const price = priceOf(K, spec);
    return { kind, label: K.label, designation: spec.designation, spec, price, kw: K.kw, blocker: blockerFor(K, st, price) };
  });
}

function note(msg) {
  crew.log.unshift({ t: Date.now(), msg });
  crew.log.length = Math.min(crew.log.length, 30);
}

/** Buys one robot of `kind` at port `st`. → null | error. */
export function buyRobot(kind, st) {
  const K = ROBOT_KINDS[kind];
  if (!K) return "No such robot";
  const seed = `${sim.callsign}:${st?.id}`;
  const spec = robotDesign(kind, seed, st?.sector ?? null);
  const price = priceOf(K, spec);
  const blocker = blockerFor(K, st, price);
  if (blocker) return blocker[0].toUpperCase() + blocker.slice(1);
  robots.n++;
  const id = `bot_${robots.n}`;
  const m = {
    id, robot: true, kind,
    name: `${spec.designation} ${spec.nickname}`, designation: spec.designation, seed: `${kind}:${seed}`,
    complexId: K.complexId, complexName: spec.career, letter: "—", title: K.label,
    wage: 0, listWage: 0, morale: 100, trust: 100,
    traits: { grit: 1, caution: 0.5, greed: 0, loyalty: 1, curiosity: 0.2 },
    gender: "nonbinary", pronouns: PRONOUNS.nonbinary, attractedTo: [], synthetic: true,
    condition: 100, kw: K.kw, idle: false, price, spec,
    partner: null, bonds: {}, cyclesAboard: 0,
  };
  sim.ship.credits -= price;
  crew.aboard.push(m);
  note(`${m.name} came aboard from the ${st.name} yard — ${K.label}, ${K.kw} kW, no wage`);
  saveRobots();
  return null;
}

/** Scraps a robot for 40% of what it cost. → null | error */
export function scrapRobot(id) {
  const i = crew.aboard.findIndex((m) => m.id === id && m.robot);
  if (i < 0) return "Not aboard";
  const m = crew.aboard[i];
  const refund = Math.round((m.price ?? 0) * SCRAP_REFUND);
  crew.aboard.splice(i, 1);
  sim.ship.credits += refund;
  note(`${m.name} scrapped — ${refund} cr back`);
  saveRobots();
  return null;
}

export function robotsAboard() {
  return crew.aboard.filter((m) => m.robot);
}

/** Standing Engineering and able to work: a human in a fit mood or a robot with a working frame. */
function isEngineer(m) {
  const atEng = m.duty ? m.duty === "eng" : m.complexId === "energy";
  return atEng && (m.robot ? (m.condition ?? 0) >= ROBOT_IDLE_AT : (m.morale ?? 0) >= 40);
}

export function engineerAboard() {
  return crew.aboard.some(isEngineer);
}

/**
 * Called from the sim's career step beside tickCrew, with scaled seconds.
 * Writes ship.extraDraw, wears the frames, flags the ones that need a yard.
 */
export function tickRobots(dt) {
  const ship = sim.ship;
  const bots = robotsAboard();
  if (!bots.length) { if (ship) ship.extraDraw = 0; return null; }
  const drawK = fx("robotDraw", 1);
  const wearK = fx("robotWear", 1);
  const wear = ROBOT_WEAR * (1 + (duties.wear ?? 0)) * wearK * dt;
  const fixers = crew.aboard.filter(isEngineer);
  let draw = 0;
  for (const m of bots) {
    m.condition = Math.max(0, Math.min(100, (m.condition ?? 100) - wear));
    /* an engineer at Engineering restores the others — a robot cannot service itself */
    if (m.condition < 100 && fixers.some((o) => o !== m)) m.condition = Math.min(100, m.condition + ROBOT_REPAIR * dt);
    m.idle = m.condition < ROBOT_IDLE_AT;
    if (m.condition > 0) draw += m.kw;
  }
  ship.extraDraw = draw * drawK;
  robots.sinceSave += dt;
  if (robots.sinceSave > 30) { robots.sinceSave = 0; saveRobots(); }
  return null;
}

/** What SERVICE ALL would cost here: 60 cr a point over every robot. */
export function servicePrice() {
  return robotsAboard().reduce((a, m) => a + Math.ceil(100 - (m.condition ?? 100)), 0) * SERVICE_CR;
}

/** Docked at a yard: every robot back to 100. → null | error */
export function serviceAll(st) {
  if (!st || !ROBOT_SECTORS.includes(st.sector)) return "No robot yard here";
  const cost = servicePrice();
  if (cost <= 0) return "Nothing to service";
  if (sim.ship.credits < cost) return `Service is ${cost.toLocaleString()} cr`;
  sim.ship.credits -= cost;
  for (const m of robotsAboard()) { m.condition = 100; m.idle = false; }
  note(`Robot crew serviced at ${st.name} — ${cost} cr`);
  saveRobots();
  return null;
}

/** → { n, kw, worst: { name, condition } | null } */
export function robotsSummary() {
  const bots = robotsAboard();
  let worst = null;
  for (const m of bots) if (!worst || m.condition < worst.condition) worst = { name: m.name, condition: Math.round(m.condition ?? 100) };
  return { n: bots.length, kw: Math.round(bots.reduce((a, m) => a + (m.condition > 0 ? m.kw : 0), 0) * fx("robotDraw", 1) * 10) / 10, worst };
}

/* ---- persistence: robots are property, per sky ---------------------------- */

export const ROBOTS_KEY = () => `lgaa.robots.v1:${sim.skySeed}:${sim.callsign}`;

export function saveRobots() {
  try {
    globalThis.localStorage?.setItem(ROBOTS_KEY(), JSON.stringify({ n: robots.n, aboard: robotsAboard() }));
  } catch { /* quota, or no window */ }
  return null;
}

/** Puts this sky's robots back aboard. Called by launchSim after resetCrew(). Returns the members restored. */
export function loadRobots() {
  let data = null;
  try {
    const raw = globalThis.localStorage?.getItem(ROBOTS_KEY());
    if (raw) data = JSON.parse(raw);
  } catch { data = null; }
  robots.n = Number(data?.n) || 0;
  robots.sinceSave = 0;
  const out = [];
  for (const m of Array.isArray(data?.aboard) ? data.aboard : []) {
    if (!m?.robot || !ROBOT_KINDS[m.kind] || crew.aboard.some((x) => x.id === m.id)) continue;
    m.pronouns = PRONOUNS.nonbinary;
    m.partner = null;
    m.bonds ??= {};
    m.idle = (m.condition ?? 100) < ROBOT_IDLE_AT;
    crew.aboard.push(m);
    out.push(m);
    robots.n = Math.max(robots.n, Number(String(m.id).replace("bot_", "")) || 0);
  }
  return out;
}
