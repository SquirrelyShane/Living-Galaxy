import { BODIES, bodyById, bodyPosition, bodyVelocity } from "./bodies.js";
import { rngFromSeed } from "./generate.js";
import { shipById, DEFAULT_SHIP_ID, SHIP_DB } from "../ships/shipdb.js";
import { baseValue } from "../economy/materials.js";

export const HULK = {
  max: 48,
  life: 5400,
  plate: "steel",
  plateK: 4,
  plateExp: 0.7,
  partK: 0.9,
  partExp: 0.5,
  intact: [0.35, 0.95],
  cargoKeep: [0.15, 0.6],
  drift: 0.25,
  driftMax: 30,
  driftTau: 45,
  again: 30,
  sweep: 2,
  afterJob: 600,
  same: 600,
  goneFor: 180,
};

export const HULK_SECTIONS = ["bridge", "engine block", "hold", "spine", "reactor deck", "bow", "port quarter", "starboard quarter"];

export const HULK_PARTS = {
  "bridge": ["controller", "sensor", "chip", "wiring", "optic", "life_scrub"],
  "engine block": ["thruster_bell", "turbine", "pump", "heat_ex", "motor"],
  "hold": ["actuator", "motor", "wiring", "bearing"],
  "spine": ["wiring", "capacitor", "radiator", "bearing"],
  "reactor deck": ["capacitor", "heat_ex", "radiator", "fuel_cell", "battery"],
  "bow": ["sensor", "optic", "wiring", "armour_plate"],
  "port quarter": ["radiator", "battery", "pump", "wiring"],
  "starboard quarter": ["radiator", "battery", "pump", "wiring"],
};

const TIERS = "ABCDEFG";

export const hulks = [];

const _bp = { x: 0, y: 0, z: 0 };
let seq = 1;
let sweepT = 0;
let sim0 = { time: 0 };

const gone = new Map();

export function resetHulks() {
  hulks.length = 0;
  gone.clear();
  seq = 1;
  sweepT = 0;
}

export function bindHulks(sim) {
  sim0 = sim;
}

export function hulkById(id) {
  for (const h of hulks) if (h.id === id) return h;
  return null;
}

export const plateOf = (def) => HULK.plateK * Math.pow(Math.max(1, def?.stats?.massT ?? 12), HULK.plateExp);

export function hullForPlate(qty, margin = 1.2) {
  let best = null, big = null;
  for (const def of SHIP_DB) {
    const p = plateOf(def);
    if (!big || p > big.p) big = { def, p };
    if (p >= qty * margin && (!best || p < best.p)) best = { def, p };
  }
  return (best ?? big)?.def ?? shipById(DEFAULT_SHIP_ID);
}

export function sectionCount(tier) {
  const i = TIERS.indexOf(tier);
  return Math.max(2, Math.min(HULK_SECTIONS.length, 2 + (i < 0 ? 0 : i)));
}

function buildSections(def, cargo, rnd, intact) {
  const n = sectionCount(def.tier);
  const massT = Math.max(1, def.stats?.massT ?? 12);
  const plateAll = HULK.plateK * Math.pow(massT, HULK.plateExp);
  const partAll = Math.round(HULK.partK * Math.pow(massT, HULK.partExp));
  const span = HULK.intact[1] - HULK.intact[0];
  const shares = [];
  let sum = 0;
  for (let i = 0; i < n; i++) { const s = 0.6 + rnd() * 0.8; shares.push(s); sum += s; }
  const sections = [];
  for (let i = 0; i < n; i++) {
    const whole = intact == null ? HULK.intact[0] + rnd() * span : Math.max(0, Math.min(1, intact));
    const plate = Math.max(1, Math.round((plateAll * shares[i] / sum) * whole));
    sections.push({ i, name: HULK_SECTIONS[i], plate, plate0: plate, parts: {}, cargo: null, box: i === 0, intact: whole, cut: 0 });
  }
  for (let k = 0; k < partAll; k++) {
    const s = sections[k % n];
    const pool = HULK_PARTS[s.name];
    const id = pool[Math.floor(rnd() * pool.length)];
    if (rnd() < s.intact) s.parts[id] = (s.parts[id] ?? 0) + 1;
  }
  if (cargo?.id && cargo.qty > 0) {
    const keep = HULK.cargoKeep[0] + rnd() * (HULK.cargoKeep[1] - HULK.cargoKeep[0]);
    const qty = Math.floor(cargo.qty * keep);
    if (qty >= 1) (sections.find((s) => s.name === "hold") ?? sections[n - 1]).cargo = { id: cargo.id, qty };
  }
  return sections;
}

function frameFor(x, y, z, time, parent = null) {
  const host = parent ? bodyById(parent) : null;
  if (host && !host.shattered && !host.collapsed && host.kind !== "star") {
    bodyPosition(host.id, time, _bp);
    return { parent: host.id, ox: x - _bp.x, oy: y - _bp.y, oz: z - _bp.z };
  }
  let best = null;
  let ox = x, oy = y, oz = z;
  for (const b of BODIES) {
    if (b.kind === "star" || b.shattered || b.collapsed) continue;
    bodyPosition(b.id, time, _bp);
    const d = Math.hypot(x - _bp.x, y - _bp.y, z - _bp.z);
    if (d < (b.soi ?? 0) && (!best || b.soi < best.soi)) { best = b; ox = x - _bp.x; oy = y - _bp.y; oz = z - _bp.z; }
  }
  return { parent: best?.id ?? null, ox, oy, oz };
}

const busy = (h, time) => (h.busyUntil ?? -Infinity) > time;

function dropOldest() {
  const time = sim0.time ?? 0;
  let i = hulks.findIndex((h) => !h.pinned && !h.shared && !busy(h, time));
  if (i < 0) i = hulks.findIndex((h) => !h.pinned && !h.shared);
  if (i < 0) return false;
  hulks[i].dead = true;
  hulks.splice(i, 1);
  return true;
}

export function spawnHulk(v, { source = "kill", owner = null, at = null, pinned = false, intact = null, parent = null } = {}) {
  if (!v || !Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.z)) return null;
  const time = at ?? sim0.time ?? 0;
  const vessel = v.id ?? null;
  if (vessel) {
    const prev = hulks.find((h) => h.vessel === vessel && time - h.born < HULK.again);
    if (prev) return prev;
  }
  const def = shipById(v.ship) ?? shipById(DEFAULT_SHIP_ID);
  const rnd = rngFromSeed(`hulk:${vessel ?? "?"}:${Math.floor(time)}:${Math.round(v.x)}:${Math.round(v.z)}`);
  let vx = (v.vx ?? 0) * HULK.drift, vy = (v.vy ?? 0) * HULK.drift, vz = (v.vz ?? 0) * HULK.drift;
  const sp = Math.hypot(vx, vy, vz);
  if (!Number.isFinite(sp)) { vx = 0; vy = 0; vz = 0; }
  else if (sp > HULK.driftMax) { const k = HULK.driftMax / sp; vx *= k; vy *= k; vz *= k; }
  const frame = frameFor(v.x, v.y, v.z, time, parent);
  const h = {
    id: `hk${seq++}`,
    name: `${v.name ?? def.name} hulk`,
    vessel,
    vesselName: v.name ?? def.name,
    ship: def.id,
    hullName: def.name,
    tier: def.tier,
    massT: def.stats?.massT ?? 12,
    len: def.dims?.[0] ?? 3,
    role: v.role ?? null,
    owner,
    source,
    x: v.x, y: v.y, z: v.z,
    vx, vy, vz,
    parent: frame.parent,
    ox: frame.ox, oy: frame.oy, oz: frame.oz,
    r: Math.max(6, v.radius ?? 7),
    yaw: v.yaw ?? rnd() * Math.PI * 2,
    pitch: (rnd() - 0.5) * 0.9,
    roll: rnd() * Math.PI * 2,
    spin: (rnd() - 0.5) * 0.24,
    tumble: 0,
    sections: buildSections(def, v.cargo, rnd, intact),
    born: time,
    age: 0,
    life: HULK.life,
    pinned,
    assayed: false,
    dead: false,
  };
  while (hulks.length >= HULK.max) if (!dropOldest()) break;
  hulks.push(h);
  return h;
}

export function removeHulk(h) {
  if (!h) return;
  if (h.key) gone.set(h.key, (sim0.time ?? 0) + HULK.goneFor);
  h.dead = true;
  const i = hulks.indexOf(h);
  if (i >= 0) hulks.splice(i, 1);
}

export function stepHulks(dt) {
  if (!hulks.length || !(dt > 0)) return;
  const time = sim0.time ?? 0;
  const k = Math.exp(-dt / HULK.driftTau);
  for (let i = hulks.length - 1; i >= 0; i--) {
    const h = hulks[i];
    h.age += dt;
    if (!h.pinned && h.age > h.life && !busy(h, time)) { h.dead = true; hulks.splice(i, 1); continue; }
    if (h.vx || h.vy || h.vz) {
      h.ox += h.vx * dt; h.oy += h.vy * dt; h.oz += h.vz * dt;
      h.vx *= k; h.vy *= k; h.vz *= k;
      if (Math.abs(h.vx) + Math.abs(h.vy) + Math.abs(h.vz) < 0.01) { h.vx = 0; h.vy = 0; h.vz = 0; }
    }
    if (h.parent) {
      const b = bodyById(h.parent);
      if (!b || b.shattered || b.collapsed) { h.parent = null; h.ox = h.x; h.oy = h.y; h.oz = h.z; }
      else { bodyPosition(h.parent, time, _bp); h.x = _bp.x + h.ox; h.y = _bp.y + h.oy; h.z = _bp.z + h.oz; }
    }
    if (!h.parent) { h.x = h.ox; h.y = h.oy; h.z = h.oz; }
    h.tumble += h.spin * dt;
  }
  sweepT += dt;
  if (sweepT < HULK.sweep) return;
  sweepT = 0;
  for (const b of BODIES) {
    if (b.shattered || b.collapsed) continue;
    bodyPosition(b.id, time, _bp);
    const r2 = (b.radius * 0.985) ** 2;
    for (let i = hulks.length - 1; i >= 0; i--) {
      const h = hulks[i];
      const dx = h.x - _bp.x, dy = h.y - _bp.y, dz = h.z - _bp.z;
      if (dx * dx + dy * dy + dz * dz < r2) { h.dead = true; hulks.splice(i, 1); }
    }
  }
}

export const hulkKey = (h) => (h.key ??= `${h.vessel ?? h.id}@${Math.round(h.born)}`);

const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const partsOut = (p) => Object.entries(p ?? {}).map(([k, q]) => `${k}:${q}`).join(",");
function partsIn(t) {
  const o = {};
  for (const kv of String(t ?? "").split(",")) {
    const [k, q] = kv.split(":");
    if (k && Number(q) > 0) o[k] = Math.floor(Number(q));
  }
  return o;
}

export function hulkWire(cap = HULK.max) {
  const out = [];
  for (const h of hulks) {
    if (h.dead || h.source === "contract") continue;
    out.push([
      hulkKey(h), h.vessel ?? "", h.vesselName ?? "", h.ship, h.role ?? "", h.owner ?? "", h.source ?? "kill", h.parent ?? "",
      Math.round(h.ox), Math.round(h.oy), Math.round(h.oz), Math.round(h.born), Math.round(h.life),
      r2(h.yaw), r2(h.pitch), r2(h.roll), r2(h.spin), Math.round(h.r),
      h.sections.map((s) => [r2(s.plate), s.plate0, s.cut >= 1 ? 1 : 0, s.box ? 1 : 0, s.cargo?.id ?? "", s.cargo?.qty ?? 0, partsOut(s.parts), r2(s.intact)]),
    ]);
    if (out.length >= cap) break;
  }
  return out;
}

function sectionsIn(rows) {
  const out = [];
  for (let i = 0; i < rows.length && i < HULK_SECTIONS.length; i++) {
    const w = rows[i];
    if (!Array.isArray(w)) return null;
    const plate0 = Math.max(0, Number(w[1]) || 0);
    const done = Boolean(w[2]);
    const plate = done ? 0 : Math.max(0, Math.min(plate0, Number(w[0]) || 0));
    out.push({
      i, name: HULK_SECTIONS[i], plate, plate0,
      parts: done ? {} : partsIn(w[6]),
      cargo: !done && w[4] && Number(w[5]) > 0 ? { id: String(w[4]), qty: Math.floor(Number(w[5])) } : null,
      box: !done && Boolean(w[3]),
      intact: Number(w[7]) || 0,
      cut: done ? 1 : plate0 > 0 ? Math.min(1, 1 - plate / plate0) : 1,
    });
  }
  return out.length ? out : null;
}

const cutOut = (s) => { s.plate = 0; s.cut = 1; s.parts = {}; s.cargo = null; s.box = false; };
const spent = (h) => h.sections.every((s) => s.cut >= 1);
const touched = (h) => h.sections.some((s) => s.cut > 0);

function place(h, time) {
  if (h.parent && bodyById(h.parent) && bodyPosition(h.parent, time, _bp)) { h.x = _bp.x + h.ox; h.y = _bp.y + h.oy; h.z = _bp.z + h.oz; }
  else { h.parent = null; h.x = h.ox; h.y = h.oy; h.z = h.oz; }
}

export function adoptHulkWire(rows, { time = sim0.time ?? 0, mirror = true } = {}) {
  const stats = { added: 0, kept: 0, removed: 0 };
  if (!Array.isArray(rows)) return stats;
  const named = new Set();
  for (const row of rows) {
    if (!Array.isArray(row) || typeof row[0] !== "string" || !Array.isArray(row[18])) continue;
    const [key, vessel, vesselName, ship, role, owner, source, parent, ox, oy, oz, born, life, yaw, pitch, roll, spin, rad] = row;
    if (![ox, oy, oz, born, life].every(Number.isFinite)) continue;
    named.add(key);
    if ((gone.get(key) ?? -Infinity) > time) continue;
    const secs = sectionsIn(row[18]);
    if (!secs) continue;
    let h = hulks.find((x) => x.key === key)
      ?? (vessel ? hulks.find((x) => !x.key && x.vessel === vessel && x.source !== "contract" && Math.abs(x.born - born) < HULK.same) : null);
    if (h) {
      const mine = busy(h, time);
      if (!h.shared && !touched(h) && !mine) h.sections = secs;
      else for (let i = 0; i < h.sections.length && i < secs.length; i++) if (secs[i].cut >= 1 && h.sections[i].cut < 1) cutOut(h.sections[i]);
      h.key = key;
      h.shared = mirror;
      h.born = born; h.life = life; h.age = Math.max(0, time - born);
      if (!mine) { h.parent = parent || null; h.ox = ox; h.oy = oy; h.oz = oz; h.vx = 0; h.vy = 0; h.vz = 0; place(h, time); }
      if (spent(h)) { removeHulk(h); stats.removed++; } else stats.kept++;
      continue;
    }
    if (secs.every((x) => x.cut >= 1)) continue;
    const def = shipById(ship) ?? shipById(DEFAULT_SHIP_ID);
    h = {
      id: `hk${seq++}`,
      name: `${vesselName || def.name} hulk`,
      vessel: vessel || null,
      vesselName: vesselName || def.name,
      ship: def.id,
      hullName: def.name,
      tier: def.tier,
      massT: def.stats?.massT ?? 12,
      len: def.dims?.[0] ?? 3,
      role: role || null,
      owner: owner || null,
      source: source || "kill",
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      parent: parent || null,
      ox, oy, oz,
      r: Math.max(6, Number(rad) || 7),
      yaw: Number(yaw) || 0, pitch: Number(pitch) || 0, roll: Number(roll) || 0, spin: Number(spin) || 0,
      tumble: 0,
      sections: secs,
      born,
      age: Math.max(0, time - born),
      life,
      pinned: false,
      assayed: false,
      dead: false,
      key,
      shared: mirror,
    };
    place(h, time);
    hulks.push(h);
    stats.added++;
  }
  if (mirror) {
    for (let i = hulks.length - 1; i >= 0; i--) {
      const h = hulks[i];
      if (!h.shared || named.has(h.key) || busy(h, time)) continue;
      h.dead = true;
      hulks.splice(i, 1);
      stats.removed++;
    }
  }
  for (const [k, until] of gone) if (until <= time) gone.delete(k);
  return stats;
}

export function applyHulkCut(key, i) {
  const h = hulks.find((x) => x.key === key);
  const s = h?.sections[i];
  if (!s) return false;
  if (s.cut < 1) cutOut(s);
  if (spent(h)) removeHulk(h);
  return true;
}

export function hulkVelocity(h, out) {
  const o = out ?? { x: 0, y: 0, z: 0 };
  if (h?.parent) bodyVelocity(h.parent, sim0.time ?? 0, o);
  else { o.x = 0; o.y = 0; o.z = 0; }
  o.x += h?.vx ?? 0; o.y += h?.vy ?? 0; o.z += h?.vz ?? 0;
  return o;
}

export function nearHulks(pos, range) {
  const out = [];
  for (const h of hulks) {
    const d = Math.hypot(h.x - pos.x, h.y - pos.y, h.z - pos.z);
    if (d < range) out.push({ h, d });
  }
  out.sort((a, b) => a.d - b.d);
  return out;
}

export function hulkManifest(h) {
  const parts = {};
  const cargo = {};
  let plate = 0, partCount = 0, cargoCount = 0, left = 0, value = 0, box = false;
  for (const s of h?.sections ?? []) {
    plate += s.plate;
    for (const [id, q] of Object.entries(s.parts)) { parts[id] = (parts[id] ?? 0) + q; partCount += q; value += q * baseValue(id); }
    if (s.cargo) { cargo[s.cargo.id] = (cargo[s.cargo.id] ?? 0) + s.cargo.qty; cargoCount += s.cargo.qty; value += s.cargo.qty * baseValue(s.cargo.id); }
    if (s.cut < 1) left++;
    if (s.box) box = true;
  }
  value += plate * baseValue(HULK.plate);
  return { plate, parts, partCount, cargo, cargoCount, sections: h?.sections?.length ?? 0, left, box, value: Math.round(value) };
}
