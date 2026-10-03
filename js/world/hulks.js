import { BODIES, bodyById, bodyPosition, bodyVelocity } from "./bodies.js";
import { rngFromSeed } from "./generate.js";
import { shipById, DEFAULT_SHIP_ID } from "../ships/shipdb.js";
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

export function resetHulks() {
  hulks.length = 0;
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

function frameFor(x, y, z, time) {
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

function dropOldest() {
  const i = hulks.findIndex((h) => !h.pinned);
  if (i < 0) return false;
  hulks[i].dead = true;
  hulks.splice(i, 1);
  return true;
}

export function spawnHulk(v, { source = "kill", owner = null, at = null, pinned = false, intact = null } = {}) {
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
  const frame = frameFor(v.x, v.y, v.z, time);
  const h = {
    id: `hk${seq++}`,
    name: `${v.name ?? def.name} hulk`,
    vessel,
    vesselName: v.name ?? def.name,
    ship: def.id,
    hullName: def.name,
    tier: def.tier,
    massT: def.stats?.massT ?? 12,
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
    if (!h.pinned && h.age > h.life) { h.dead = true; hulks.splice(i, 1); continue; }
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
