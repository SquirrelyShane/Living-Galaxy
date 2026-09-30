import * as THREE from "three";
import { buildStation, releaseStation, MODULES } from "../stationgen/index.js";

export const SIM_SCALE = 0.14;
export const YARD_VERSION = 1;

const ARCH_BY_SECTOR = {
  logistic: ["tradehub", "tradehub", "relay"],
  military: ["military"],
  industrial: ["industrial", "shipyard", "foundry"],
  civilian: ["habitat", "sanctum", "research", "habitat"],
  agricultural: ["agricultural"],
  pirate: ["piratehold", "foundry"],
};

export const MOUNT_KINDS = {
  "sf.pdc_cluster":   { kind: "pdc",     range: 900,  damage: 4,  rate: 0.45, speed: 620, ammo: null,      barrels: 4 },
  "sf.defense":       { kind: "rail",    range: 1700, damage: 9,  rate: 1.6,  speed: 900, ammo: "slug",    barrels: 2 },
  "sf.laser_battery": { kind: "laser",   range: 1400, damage: 6,  rate: 0.9,  speed: 1400, ammo: null,     barrels: 1 },
  "sf.missile_cells": { kind: "missile", range: 2600, damage: 22, rate: 4.5,  speed: 480, ammo: "missile", barrels: 1 },
  "sf.spinal":        { kind: "spinal",  range: 4200, damage: 70, rate: 9,    speed: 1600, ammo: "slug",   barrels: 1, cost: 6 },
  "sf.siege_laser":   { kind: "siege",   range: 3400, damage: 34, rate: 5.5,  speed: 1400, ammo: null,     barrels: 1 },
};

export function stationConfig(st, skySeed = "sky") {
  const pool = ARCH_BY_SECTOR[st.sector] ?? ARCH_BY_SECTOR.logistic;
  const pick = Math.floor(((st.seed ?? 0.5) * 7919) % pool.length);
  const archetype = st.archetype ?? pool[pick];
  const r = st.radius ?? 100;
  const tier = st.sector === "pirate" ? "I" : r < 105 ? "I" : r < 165 ? "II" : "III";
  return {
    seed: `${skySeed}:${st.id}:${(st.seed ?? 0).toFixed(6)}`,
    archetype, tier,
    hangars: st.sector === "pirate" ? 1 : null,
    sun: [1, 0.35, 0.2],
    shieldShell: true,
    complexity: 0.55,
  };
}

const _v = new THREE.Vector3(), _w = new THREE.Vector3();
function worldOf(obj, x, y, z, out = new THREE.Vector3()) { return out.set(x, y, z).applyMatrix4(obj.matrixWorld); }
function dirOf(obj, x, y, z, out = new THREE.Vector3()) { worldOf(obj, x, y, z, out); worldOf(obj, 0, 0, 0, _w); return out.sub(_w).normalize(); }

export function ensureBuilt(st, skySeed = st.skySeed ?? "sky") {
  if (st.gen) return st.gen;
  const cfg = stationConfig(st, skySeed);
  const key = JSON.stringify(cfg);
  let g = carried.get(key);
  if (g) carried.delete(key);
  else g = { ...buildStation(cfg), key };
  const root = g.root;
  root.parent?.remove(root);
  root.name = `station:${st.id}`;
  root.scale.setScalar(SIM_SCALE);
  root.updateMatrixWorld(true);
  st.gen = g.cfg === cfg ? g : { ...g, cfg };
  st.skySeed = skySeed;
  st.radius = Math.max(12, Math.max(g.stats.size.x, g.stats.size.y, g.stats.size.z) * 0.5 * SIM_SCALE);
  st.portLocal = portFrameOf(st);
  st.mountsLocal = mountsOf(st);
  st.hangarsLocal = st.gen.builder.hangars.map((h) => mouthOf(h));
  st.port = st.portLocal ? clonePort(st.portLocal) : null;
  st.mounts = st.mountsLocal.map((m) => ({ ...m }));
  st.hangars = st.hangarsLocal.map((m) => clonePort(m));
  st.yaw = null;
  st.portVersion = 0;
  orientStation(st, headingFor(st, 0));
  return st.gen;
}

const clonePort = (p) => ({ ...p, dir: { ...p.dir }, side: { ...p.side }, up: { ...p.up }, floor: { ...p.floor }, back: { ...p.back }, entry: { ...p.entry }, exit: { ...p.exit }, berth: { ...p.berth } });

export function headingFor(st, orbitAngle = null) {
  const seedYaw = (st.seed ?? 0.37) * Math.PI * 2;
  const d0 = st.portLocal?.dir;
  if (!d0 || st.mount !== "tethered" || orbitAngle == null) return seedYaw;
  const h = Math.hypot(d0.x, d0.z);
  if (h < 0.2) return seedYaw;
  const theta0 = Math.atan2(d0.x, d0.z);
  return Math.atan2(Math.cos(orbitAngle), Math.sin(orbitAngle)) - theta0;
}

const rotY = (v, out, c, s) => { const x = v.x, z = v.z; out.x = x * c + z * s; out.y = v.y; out.z = -x * s + z * c; return out; };
export function orientStation(st, yaw) {
  if (st.yaw === yaw || !st.portLocal) return;
  if (st.yaw != null) { const dy = yaw - st.yaw; if (Math.abs(Math.atan2(Math.sin(dy), Math.cos(dy))) < 0.002) return; }
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const turn = (src, dst) => {
    rotY(src, dst, c, s);
    for (const k of ["dir", "side", "up", "floor", "back", "entry", "exit", "berth"]) if (src[k]) rotY(src[k], dst[k], c, s);
  };
  turn(st.portLocal, st.port);
  st.hangarsLocal.forEach((m, i) => turn(m, st.hangars[i]));
  st.mountsLocal.forEach((m, i) => { const d = st.mounts[i]; rotY(m, d, c, s); const n = rotY({ x: m.nx, y: m.ny, z: m.nz }, {}, c, s); d.nx = n.x; d.ny = n.y; d.nz = n.z; });
  st.yaw = yaw;
  st.portVersion = (st.portVersion ?? 0) + 1;
}

const carried = new Map();
export function carryBuilt(list) {
  for (const st of list) {
    if (!st.gen) continue;
    if (st.gen.key) carried.set(st.gen.key, st.gen); else releaseBuilt(st);
    st.gen = null;
  }
}
export function dropCarried() {
  for (const g of carried.values()) { try { releaseStation(g); } catch {} }
  carried.clear();
}
export const carriedCount = () => carried.size;

export function releaseBuilt(st) {
  if (!st.gen) return;
  try { releaseStation(st.gen); } catch {}
  st.gen = null;
}

function mouthOf(h) {
  const bay = h.group.children.find((c) => c.name?.startsWith("hangar")) ?? h.group;
  const T = 2.5;
  const centre = worldOf(bay, 0, h.h / 2 + T, h.d / 2);
  const dir = dirOf(bay, 0, 0, 1);
  const side = dirOf(bay, 1, 0, 0);
  const up = dirOf(bay, 0, 1, 0);
  const floor = worldOf(bay, 0, T, h.d / 2);
  const back = worldOf(bay, 0, h.h / 2 + T, -h.d * 0.42);
  const w = h.w * SIM_SCALE, q = w / 4;
  const half = (sgn, p) => ({ x: p.x + side.x * q * sgn, y: p.y + side.y * q * sgn, z: p.z + side.z * q * sgn });
  return {
    form: h.form, mouth: h.mouth,
    x: centre.x, y: centre.y, z: centre.z,
    dir: { x: dir.x, y: dir.y, z: dir.z }, side: { x: side.x, y: side.y, z: side.z }, up: { x: up.x, y: up.y, z: up.z },
    floor: { x: floor.x, y: floor.y, z: floor.z }, back: { x: back.x, y: back.y, z: back.z },
    entry: half(-1, centre), exit: half(1, centre),
    berth: half(-0.5, back),
    w, h: h.h * SIM_SCALE, d: h.d * SIM_SCALE,
    wayGap: (h.w / 2 / 3) * SIM_SCALE,
    laneLen: h.d * 0.8 * SIM_SCALE,
  };
}

export function portFrameOf(st) {
  const H = st.gen?.builder?.hangars;
  if (!H?.length) return null;
  const m = mouthOf(H[0]);
  return {
    ...m,
    halfW: m.w / 2, halfH: m.h / 2,
    version: YARD_VERSION,
  };
}

export function mountsOf(st) {
  const out = [];
  const B = st.gen?.builder;
  if (!B) return out;
  let n = 0;
  for (const p of B.placed) {
    if (!p.group) continue;
    const mod = p.module;
    const spec = MOUNT_KINDS[mod.id];
    const isDrones = mod.tags.includes("drones"), isShield = mod.tags.includes("shield");
    if (!spec && !isDrones && !isShield) continue;
    const pos = worldOf(p.group, 0, (p.size?.[1] ?? 10) * 0.6, 0);
    const nrm = dirOf(p.group, 0, 1, 0);
    out.push({
      id: `${st.id}:m${n++}`, module: mod.id, name: mod.name,
      x: pos.x, y: pos.y, z: pos.z, nx: nrm.x, ny: nrm.y, nz: nrm.z,
      ...(spec ?? {}), kind: spec?.kind ?? (isDrones ? "dronebay" : "shield"),
      cooldown: 0, cells: isDrones ? Number(mod.parts["sf.drone_cell"] ?? 8) : 0,
    });
  }
  return out;
}

export function worksOf(st) {
  const S = st.gen?.stats;
  const count = (id) => S?.manifest.find((m) => m.id === id)?.count ?? 0;
  const modules = S?.manifest ?? [];
  const hasLine = (part) => modules.some((m) => MODULES[m.id]?.parts?.[part]);
  const droneLines = modules.reduce((a, m) => a + (MODULES[m.id]?.parts?.["mf.drone_line"] ?? 0) * m.count, 0);
  const munLines = modules.reduce((a, m) => a + (MODULES[m.id]?.parts?.["mf.munitions"] ?? 0) * m.count, 0);
  const presses = modules.reduce((a, m) => a + (MODULES[m.id]?.parts?.["mf.armour_press"] ?? 0) * m.count, 0);
  const rails = count("sf.defense") + count("sf.spinal");
  const cells = count("sf.missile_cells");
  const bays = count("sf.drone_bay");
  return {
    lines: { drone: droneLines, munitions: munLines, press: presses },
    cap: { slug: 400 * Math.max(1, rails) + 200, missile: 48 * Math.max(1, cells), drone: 24 * bays },
    stock: { slug: 200 * rails, missile: 24 * cells, drone: 12 * bays },
    needs: { slug: rails > 0, missile: cells > 0, drone: bays > 0 },
    hasLine, tick: 0, stalled: null, made: { slug: 0, missile: 0, drone: 0, plate: 0 },
  };
}

export function mouthCoords(st, m, p) {
  const px = p.x - st.x - m.x, py = p.y - st.y - m.y, pz = p.z - st.z - m.z;
  const along = px * m.dir.x + py * m.dir.y + pz * m.dir.z;
  const lat = px * m.side.x + py * m.side.y + pz * m.side.z;
  const vert = px * m.up.x + py * m.up.y + pz * m.up.z;
  return { along, lat, vert };
}
