import { sim } from "../sim/sim.js";
import { traffic } from "../npc/traffic.js";
import { flow } from "../npc/flow.js";
import { probes } from "./probes.js";
import { forwardOf } from "./ship.js";
import { shipFx } from "./ship.js";

export const SCAN = {
  range: 12000,
  cone: 0.55,
  omni: 0.16,
  gain: 0.55,
  decay: 0.055,
  pulseBonus: 2.6,
  probeWatch: 9000,
  keep: 240,
  seen: 0.14,
  track: 0.46,
  ident: 0.84,
  broadCap: 0.62,
  broadGain: 0.42,
  focusGain: 0.95,
  focusCone: 0.30,
  focusHold: 1.2,
};

export const register = new Map();

export function levelOf(res) {
  if (res >= SCAN.ident) return 3;
  if (res >= SCAN.track) return 2;
  if (res >= SCAN.seen) return 1;
  return 0;
}

export function errorOf(rec, dist) {
  const raw = Math.max(120, dist * 0.07);
  return raw * Math.pow(1 - Math.min(1, rec.res), 1.6);
}

function d3(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function probeCovers(x, y, z) {
  for (const pr of probes) {
    if (!pr.done) continue;
    const r = pr.scanR ?? SCAN.probeWatch;
    if (Math.hypot(x - pr.x, (y ?? 0) - (pr.y ?? 0), z - pr.z) <= r) return true;
  }
  return false;
}

let acc = 0;
const RATE = 0.2;

export function tickContacts(dt) {
  acc += dt;
  if (acc < RATE) return;
  const step = acc;
  acc = 0;

  const ship = sim.ship;
  if (!ship) return;
  const f = forwardOf(ship.aimYaw ?? ship.yaw, ship.aimPitch ?? ship.pitch);
  const pulsing = sim.time < (sim.pulseUntil ?? 0);
  const range = SCAN.range * (ship.mods?.scan ?? 1);

  const touch = (id, v, kind) => {
    let rec = register.get(id);
    if (v.company === true || probeCovers(v.x, v.y ?? 0, v.z)) {
      if (!rec) { rec = { id, res: 0, x: v.x, y: v.y ?? 0, z: v.z, at: sim.time, kind, ref: v }; register.set(id, rec); }
      rec.ref = v; rec.kind = kind;
      rec.res = 1;
      rec.x = v.x; rec.y = v.y ?? 0; rec.z = v.z; rec.at = sim.time;
      rec.free = true;
      return;
    }
    const dist = d3(ship.pos, v);
    if (dist > range || v.drive) {
      if (rec) { rec.free = false; rec.ref = v; if (v.drive) rec.res = 0; }
      return;
    }
    if (!rec) {
      rec = { id, res: 0, x: v.x, y: v.y ?? 0, z: v.z, at: sim.time, kind, ref: v };
      register.set(id, rec);
    }
    rec.ref = v;
    rec.kind = kind;
    rec.free = false;

    const dx = (v.x - ship.pos.x) / (dist || 1);
    const dy = ((v.y ?? 0) - ship.pos.y) / (dist || 1);
    const dz = (v.z - ship.pos.z) / (dist || 1);
    const dot = dx * f.x + dy * f.y + dz * f.z;
    const ang = Math.acos(Math.max(-1, Math.min(1, dot)));
    const onAxis = ang <= SCAN.cone ? 1 : Math.max(0, 1 - (ang - SCAN.cone) / 0.9);
    const aim = SCAN.omni + (1 - SCAN.omni) * onAxis;
    const closeness = 1 - Math.min(0.92, dist / range);
    const gain = shipFx.fx("resolve", 1) * aim * (0.25 + closeness) * (pulsing ? SCAN.pulseBonus : 1);

    rec.ang = ang;
    rec.dist = dist;
    rec.inRange = true;

    if (rec.res < SCAN.broadCap) rec.res = Math.min(SCAN.broadCap, rec.res + SCAN.broadGain * gain * step);
    rec.gain = gain;

    rec.x = v.x; rec.y = v.y ?? 0; rec.z = v.z;
    rec.at = sim.time;
  };

  for (const rec of register.values()) { rec.inRange = false; rec.gain = 0; }
  for (const n of traffic) if (n.visible !== false) touch(n.id, n, "vessel");
  for (const n of flow) if (n.visible) touch(n.id, n, "boat");

  stepFocus(step);

  for (const [id, rec] of register) {
    if (rec.at === sim.time || rec.free) continue;
    rec.res = Math.max(0, rec.res - SCAN.decay * step);
    if (!rec.inRange) rec.known = false;
    if (rec.res <= 0 && sim.time - rec.at > SCAN.keep) register.delete(id);
  }
}

export const focus = { id: null, since: -1e9, res: 0 };

function stepFocus(step) {
  const held = focus.id ? register.get(focus.id) : null;
  const heldLive = held && held.inRange && !held.free && !held.known;
  const locked = sim.lock?.id ? register.get(sim.lock.id) : null;

  let pick = null;
  if (locked && locked.inRange && !locked.free && !locked.known) {
    pick = locked;
  } else if (heldLive && sim.time - focus.since < SCAN.focusHold) {
    pick = held;
  } else {
    let best = null, bestAng = SCAN.focusCone;
    for (const rec of register.values()) {
      if (!rec.inRange || rec.free || rec.known) continue;
      if (rec.ang < bestAng) { best = rec; bestAng = rec.ang; }
    }
    if (!best) {
      let bestScore = -Infinity;
      for (const rec of register.values()) {
        if (!rec.inRange || rec.free || rec.known) continue;
        const score = (rec.kind === "boat" ? -1.2 : 0)
          + rec.res * 1.4
          - rec.dist / Math.max(1, SCAN.range);
        if (score > bestScore) { bestScore = score; best = rec; }
      }
    }
    pick = best ?? (heldLive ? held : null);
  }

  if (!pick) { focus.id = null; focus.res = 0; return; }
  if (pick.id !== focus.id) { focus.id = pick.id; focus.since = sim.time; }

  const rate = SCAN.focusGain * (pick.gain || 0.25);
  pick.res = Math.min(1, pick.res + rate * step);
  if (pick.res >= SCAN.ident) pick.known = true;
  focus.res = pick.res;
}

export function knownContacts() {
  const out = [];
  const ship = sim.ship;
  for (const rec of register.values()) {
    const level = effLevel(rec);
    if (level <= 0) continue;
    const dist = ship ? d3(ship.pos, rec) : 0;
    out.push({
      id: rec.id,
      level,
      res: rec.res,
      kind: rec.kind,
      x: rec.x, y: rec.y, z: rec.z,
      err: rec.free ? 0 : errorOf(rec, dist),
      age: ship ? sim.time - rec.at : 0,
      ref: rec.ref,
      name: level >= 3 ? rec.ref?.name ?? "contact" : level >= 2 ? classOf(rec.ref) : "unknown",
      role: level >= 2 ? rec.ref?.role ?? null : null,
      corpId: level >= 3 ? rec.ref?.corpId ?? null : null,
      cargo: level >= 3 ? rec.ref?.cargo ?? null : null,
      yaw: level >= 2 ? rec.ref?.yaw ?? 0 : null,
    });
  }
  return out;
}

export function hullTag(v) {
  if (!v) return "N";
  if (v.rogue) return "R";
  if (v.company === true || v.kind === "peer" || v.peer === true) return "P";
  if (v.kind === "drone" || v.kind === "sdrone" || v.kind === "cdrone") return "D";
  if (v.corpDrone || v.dronesOut != null) return "D";
  const id = String(v.id ?? "");
  if (id.startsWith("pdrone-") || id.startsWith("cd:") || id.startsWith("sdrone-") || id.startsWith("drone-")) return "D";
  if (id.startsWith("flow:") || v.port != null) return "D";
  if (id.startsWith("rog:")) return "R";
  return "N";
}

export function classOf(v) {
  if (!v) return "contact";
  const r = v.role ?? "";
  if (r === "pirate" || r === "security" || r === "patrol") return "warship";
  if (r === "miner") return "miner";
  if (r === "hauler" || r === "trader") return "freighter";
  return v.hullClass ?? "hull";
}

export function effLevel(rec) {
  if (!rec) return 0;
  if (rec.free) return 3;
  if (rec.known && rec.inRange) return 3;
  return levelOf(rec.res);
}

export function levelFor(id) {
  return effLevel(register.get(id));
}

export function contactView(id) {
  const rec = register.get(id);
  if (!rec) return null;
  const level = effLevel(rec);
  if (level <= 0) return null;
  return {
    level,
    res: rec.res,
    label: level >= 3 ? (rec.ref?.name ?? "contact") : level >= 2 ? classOf(rec.ref) : "unknown",
    named: level >= 3,
    focused: focus.id === id,
    dist: rec.dist ?? 0,
  };
}

export function scanFocus() {
  const rec = focus.id ? register.get(focus.id) : null;
  if (!rec) return null;
  const level = effLevel(rec);
  return {
    id: rec.id,
    res: rec.res,
    level,
    progress: Math.max(0, Math.min(1, (rec.res - SCAN.broadCap) / Math.max(0.01, 1 - SCAN.broadCap))),
    name: level >= 3 ? rec.ref?.name : level >= 2 ? classOf(rec.ref) : "unknown return",
  };
}

export function resetContacts() {
  register.clear();
  acc = 0;
  focus.id = null;
  focus.since = -1e9;
  focus.res = 0;
}
