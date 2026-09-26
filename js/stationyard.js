/* LIVING GALAXY — the station yard: STATIONGEN stations in the sky.
 *
 * Every port is grown once from its seed by the station generator
 * (js/stationgen — the same generator that ships as STATIONGEN), scaled to
 * the sim (1 u = 10 m) and held still in the sky: the rings and drums spin
 * inside it, the hull itself does not, so a hangar mouth points the same
 * way for everyone and the lanes can grow out of it.
 *
 * What the build hands the sim, on the station record:
 *   st.gen     { root, anim, stats, builder, cfg }   the engine draws root, ticks anim
 *   st.port    the primary hangar's mouth: position, direction, side, up, the
 *              way spacing and aperture — npc/lanes.js builds the lane funnel on it
 *   st.hangars every mouth, each with an entry door (port half) and an exit
 *              door (starboard half): the tractor pulls in by one and pushes
 *              out by the other, so arrivals and departures never cross
 *   st.mounts  weapon mounts (kind, position, range, damage, rate, ammo) and
 *              drone bays and shield emitters — stationworks.js fires them
 *   st.works   the fabrication lines and magazines — stationworks.js runs them
 *
 * Sector → archetype, radius → population tier, so a military port grows a
 * bastion, a civilian one a habitat city or a pilgrim sanctum, a free port a
 * welded hold. Same seed, same station, on every client. */

import * as THREE from "three";
import { buildStation, releaseStation, MODULES } from "./stationgen/index.js";

export const SIM_SCALE = 0.14;         // metres → world units (1 u = 10 m; ports are grown a little large for the sky)
export const YARD_VERSION = 1;

const ARCH_BY_SECTOR = {
  logistic: ["tradehub", "tradehub", "relay"],
  military: ["military"],
  industrial: ["industrial", "shipyard", "foundry"],
  civilian: ["habitat", "sanctum", "research", "habitat"],
  agricultural: ["agricultural"],
  pirate: ["piratehold", "foundry"],
};

/* weapon mounts: what each defence module is worth in the sky (world units, u/s, hull points) */
export const MOUNT_KINDS = {
  "sf.pdc_cluster":   { kind: "pdc",     range: 900,  damage: 4,  rate: 0.45, speed: 620, ammo: null,      barrels: 4 },
  "sf.defense":       { kind: "rail",    range: 1700, damage: 9,  rate: 1.6,  speed: 900, ammo: "slug",    barrels: 2 },
  "sf.laser_battery": { kind: "laser",   range: 1400, damage: 6,  rate: 0.9,  speed: 1400, ammo: null,     barrels: 1 },
  "sf.missile_cells": { kind: "missile", range: 2600, damage: 22, rate: 4.5,  speed: 480, ammo: "missile", barrels: 1 },
  "sf.spinal":        { kind: "spinal",  range: 4200, damage: 70, rate: 9,    speed: 1600, ammo: "slug",   barrels: 1, cost: 6 },
  "sf.siege_laser":   { kind: "siege",   range: 3400, damage: 34, rate: 5.5,  speed: 1400, ammo: null,     barrels: 1 },
};

/** The generator config a port grows from. Deterministic in (sky seed, station). */
export function stationConfig(st, skySeed = "sky") {
  const pool = ARCH_BY_SECTOR[st.sector] ?? ARCH_BY_SECTOR.logistic;
  const pick = Math.floor(((st.seed ?? 0.5) * 7919) % pool.length);
  const archetype = st.archetype ?? pool[pick];   // the GNN station asks for a relay
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

/** Grow a port once. Idempotent; cheap after the first call. */
export function ensureBuilt(st, skySeed = st.skySeed ?? "sky") {
  if (st.gen) return st.gen;
  const cfg = stationConfig(st, skySeed);
  const key = JSON.stringify(cfg);
  /* 0.3.61 — the same sky loaded again (the menu's preview, then FLY AS) hands
   * its hulls across instead of growing every port a second time */
  let g = carried.get(key);
  if (g) carried.delete(key);
  else g = { ...buildStation(cfg), key };
  const root = g.root;
  /* a held hull still hangs off the last engine's holder, out in the scene;
   * everything below is measured in the hull's own frame, so it comes off first */
  root.parent?.remove(root);
  root.name = `station:${st.id}`;
  root.scale.setScalar(SIM_SCALE);
  root.updateMatrixWorld(true);
  st.gen = g.cfg === cfg ? g : { ...g, cfg };
  st.skySeed = skySeed;
  /* the hull's real size takes over from the roll that picked the tier */
  st.radius = Math.max(12, Math.max(g.stats.size.x, g.stats.size.y, g.stats.size.z) * 0.5 * SIM_SCALE);
  /* everything below is measured in the unrotated hull; orientStation turns it to the station's heading */
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

/** The heading the hull points its primary mouth along. A tethered port keeps its mouth turned
 * away from its host so the lanes run out into open sky; a free port takes a heading off its seed. */
export function headingFor(st, orbitAngle = null) {
  const seedYaw = (st.seed ?? 0.37) * Math.PI * 2;
  const d0 = st.portLocal?.dir;
  if (!d0 || st.mount !== "tethered" || orbitAngle == null) return seedYaw;
  const h = Math.hypot(d0.x, d0.z);
  if (h < 0.2) return seedYaw;                       // a mouth that points along the hull's own up: leave it
  const theta0 = Math.atan2(d0.x, d0.z);
  return Math.atan2(Math.cos(orbitAngle), Math.sin(orbitAngle)) - theta0;
}

const rotY = (v, out, c, s) => { const x = v.x, z = v.z; out.x = x * c + z * s; out.y = v.y; out.z = -x * s + z * c; return out; };
/** Turn the hull's port frame, mounts and mouths to heading `yaw` (rotation about +Y, three.js sense). */
export function orientStation(st, yaw) {
  if (st.yaw === yaw || !st.portLocal) return;
  /* a tethered port creeps round its orbit by ~1e-6 rad a frame: a turn that small is not worth a new port frame (portVersion feeds a lanes cache) */
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

/* 0.3.61 — hulls held across a reload of the same sky, keyed by their full
 * build config. A port is a pure function of that config, and nothing in the
 * game edits a built hull (only its animation state moves), so a held hull is
 * the hull a fresh build would make. Anything not claimed is released. */
const carried = new Map();
/** Hold a roster's hulls for the next build of the same sky; the roster lets go of them. */
export function carryBuilt(list) {
  for (const st of list) {
    if (!st.gen) continue;
    if (st.gen.key) carried.set(st.gen.key, st.gen); else releaseBuilt(st);
    st.gen = null;
  }
}
/** Release whatever a reload did not claim. */
export function dropCarried() {
  for (const g of carried.values()) { try { releaseStation(g); } catch { /* already gone */ } }
  carried.clear();
}
export const carriedCount = () => carried.size;

export function releaseBuilt(st) {
  if (!st.gen) return;
  try { releaseStation(st.gen); } catch { /* already gone */ }
  st.gen = null;
}

/** A hangar's mouth in station-local world units: centre, out direction, side (+x of the bay), up. */
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
  /* one aperture, two doors: arrivals come in through the port half (−x), departures leave by the starboard half (+x).
   * The clamps sit on the same side of the bay, so an inbound hull and an outbound one never share a line. */
  const half = (sgn, p) => ({ x: p.x + side.x * q * sgn, y: p.y + side.y * q * sgn, z: p.z + side.z * q * sgn });
  return {
    form: h.form, mouth: h.mouth,
    x: centre.x, y: centre.y, z: centre.z,
    dir: { x: dir.x, y: dir.y, z: dir.z }, side: { x: side.x, y: side.y, z: side.z }, up: { x: up.x, y: up.y, z: up.z },
    floor: { x: floor.x, y: floor.y, z: floor.z }, back: { x: back.x, y: back.y, z: back.z },
    entry: half(-1, centre), exit: half(1, centre),
    berth: half(-0.5, back),                         // the clamps, on the arrivals side of the bay
    w, h: h.h * SIM_SCALE, d: h.d * SIM_SCALE,
    wayGap: (h.w / 2 / 3) * SIM_SCALE,              // centre-to-centre of the ways at the mouth
    laneLen: h.d * 0.8 * SIM_SCALE,                 // the gantries outside
  };
}

/** The port frame the lanes grow from: the first hangar's mouth. */
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

/** Weapon mounts, drone bays and shield emitters with their station-local positions. */
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

/** Roll-up of what the port can make and hold, from its manifest. */
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

/** Distance from a point to a hangar mouth's plane, and where it sits across the aperture. */
export function mouthCoords(st, m, p) {
  const px = p.x - st.x - m.x, py = p.y - st.y - m.y, pz = p.z - st.z - m.z;
  const along = px * m.dir.x + py * m.dir.y + pz * m.dir.z;          // + outside the mouth, − inside the bay
  const lat = px * m.side.x + py * m.side.y + pz * m.side.z;
  const vert = px * m.up.x + py * m.up.y + pz * m.up.z;
  return { along, lat, vert };
}
