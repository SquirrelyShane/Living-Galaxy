import { addChunk } from "../world/debris.js";
import { HULK, hulkVelocity, nearHulks, removeHulk } from "../world/hulks.js";
import { shipFx } from "./ship.js";

export const RIG = {
  range: 600,
  cut: 2.5,
  strip: 1,
  cutYield: 0.85,
  cutCargo: 0.5,
  lump: 6,
  scrap: [0.35, 1],
  chunkLife: 1800,
  heatCut: 0.9,
  heatStrip: 1.5,
  cool: 1,
};

export const rig = { active: false, mode: "off", key: null, name: "", section: "", x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r: 0, dist: 0, heat: 0, progress: 0 };

export const rigHooks = { onSection: null, onRecorder: null, onDone: null };

const _v = { x: 0, y: 0, z: 0 };

export function resetRig() {
  rig.active = false;
  rig.mode = "off";
  rig.key = null;
  rig.name = "";
  rig.section = "";
  rig.heat = 0;
  rig.progress = 0;
}

export function rigRange(ship) {
  return (ship.tune?.rigRange ?? RIG.range) + shipFx.fx("rigRange", 0);
}

export function rigBlocker(ship) {
  if (!ship.rigMode || ship.rigMode === "off") return "Rig stowed";
  if (ship.dockedAt) return "Undock to run the rig";
  if (ship.powered?.rig === false) return "Rig has no power";
  return null;
}

export function hulkCut(h) {
  let all = 0, left = 0;
  for (const s of h?.sections ?? []) { all += s.plate0; left += s.plate; }
  return all > 0 ? 1 - left / all : 1;
}

export function nextSection(h) {
  for (let i = (h?.sections?.length ?? 0) - 1; i >= 0; i--) if (h.sections[i].cut < 1) return h.sections[i];
  return null;
}

export function rigTarget(ship, lock = null) {
  const range = rigRange(ship);
  const want = lock && lock.kind === "hulk" ? lock.id : null;
  let best = null;
  let bestD = range;
  for (const { h, d } of nearHulks(ship.pos, range + 400)) {
    const dd = d - h.r;
    if (dd >= range || !nextSection(h)) continue;
    if (want && h.id === want) return { h, d: dd };
    if (dd < bestD) { bestD = dd; best = h; }
  }
  return best ? { h: best, d: bestD } : null;
}

function shed(h, good, qty) {
  const q = Math.round(qty * 100) / 100;
  if (!(q > 0)) return null;
  hulkVelocity(h, _v);
  const reach = Math.min(h.r * 1.5 + 4, (h.len ?? 6) * 0.6 + 0.6);
  const a = Math.random() * Math.PI * 2, b = (Math.random() - 0.5) * Math.PI;
  const dx = Math.cos(a) * Math.cos(b), dy = Math.sin(b), dz = Math.sin(a) * Math.cos(b);
  const sp = 0.4 + Math.random() * 1.2;
  return addChunk({
    x: h.x + dx * reach, y: h.y + dy * reach, z: h.z + dz * reach,
    vx: _v.x + dx * sp, vy: _v.y + dy * sp, vz: _v.z + dz * sp,
    r: RIG.scrap[0] + Math.min(RIG.scrap[1] - RIG.scrap[0], Math.sqrt(q) * 0.13),
    good,
    remainingMass: q,
    salvage: true,
    from: h.id,
    tint: 0.5,
    life: RIG.chunkLife,
  });
}

function finishSection(h, s, strip) {
  const out = { strip, plate: Math.round((s.shed ?? 0) * 100) / 100, parts: 0, lost: 0, cargo: null, recorder: null };
  s.plate = 0;
  s.cut = 1;
  for (const [id, q] of Object.entries(s.parts)) {
    if (strip) { shed(h, id, q); out.parts += q; }
    else out.lost += q;
  }
  s.parts = {};
  if (s.cargo) {
    const q = strip ? s.cargo.qty : Math.floor(s.cargo.qty * RIG.cutCargo);
    if (q > 0) { shed(h, s.cargo.id, q); out.cargo = { id: s.cargo.id, qty: q }; }
    s.cargo = null;
  }
  if (s.box) {
    s.box = false;
    h.recorder = strip ? "recovered" : "destroyed";
    out.recorder = h.recorder;
    rigHooks.onRecorder?.(h, strip);
  }
  rigHooks.onSection?.(h, s, out);
  return out;
}

export function stepRig(ship, dt, time, lock = null) {
  rig.active = false;
  ship.rigLive = false;
  rig.mode = ship.rigMode ?? "off";
  const t = rigBlocker(ship) || !(dt > 0) ? null : rigTarget(ship, lock);
  if (!t) {
    rig.key = null;
    rig.heat = Math.max(0, rig.heat - dt * RIG.cool);
    return null;
  }
  const h = t.h;
  const s = nextSection(h);
  const strip = ship.rigMode === "strip";
  h.busyUntil = Math.max(h.busyUntil ?? 0, time + 60);
  rig.active = true;
  ship.rigLive = true;
  rig.key = h.id;
  rig.name = h.name;
  rig.section = s.name;
  rig.x = h.x; rig.y = h.y; rig.z = h.z;
  hulkVelocity(h, _v);
  rig.vx = _v.x; rig.vy = _v.y; rig.vz = _v.z;
  rig.r = h.r;
  rig.dist = t.d;
  rig.heat = Math.min(1, rig.heat + dt * (strip ? RIG.heatStrip : RIG.heatCut));

  const rate = (strip ? RIG.strip : RIG.cut) * (ship.mods?.salvage ?? 1) * (ship.hullTune?.rig ?? 1);
  const take = Math.min(s.plate, rate * dt);
  const kept = take * (strip ? 1 : RIG.cutYield);
  s.plate -= take;
  s.cut = s.plate0 > 0 ? Math.min(1, 1 - s.plate / s.plate0) : 1;
  s.shed = (s.shed ?? 0) + kept;
  h.loose = (h.loose ?? 0) + kept;
  const done = s.plate <= 1e-6;
  const lump = Math.max(2, Math.min(RIG.lump, s.plate0 / 4));
  if (h.loose >= lump || (done && h.loose > 0)) { shed(h, HULK.plate, h.loose); h.loose = 0; }
  if (done) finishSection(h, s, strip);
  rig.progress = hulkCut(h);
  if (!nextSection(h)) {
    removeHulk(h);
    rig.key = null;
    rigHooks.onDone?.(h);
  }
  return h;
}
