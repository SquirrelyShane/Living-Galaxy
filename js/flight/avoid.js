import { BODIES, bodyPosition, bodyVelocity, dist3 } from "../world/bodies.js";
import { nearbyRocks } from "../world/field.js";
import { stations } from "../station/stations.js";
import { remnantRadius } from "../world/scale.js";
import { holes, holeRadii } from "../world/events/holes.js";

export const AVOID = {
  horizon: 22,
  pad: 2.4,
  surfacePad: 1.15,
  minPad: 60,
  brakeAt: 6,
  hardAt: 2.6,
  rockSpan: 1,
  everyMs: 180,

  rockHorizon: 5.5,
  rockPad: 1.2,
  rockMinPad: 34,
  rockHardR: 130,
  rockHardAt: 1.15,

  commitS: 5.5,
  clearFactor: 1.25,
  leadFactor: 0.9,
};

const _p = { x: 0, y: 0, z: 0 };
const _bv = { x: 0, y: 0, z: 0 };
const _sv = { x: 0, y: 0, z: 0 };
const _hr = {};

function approach(px, py, pz, vx, vy, vz, cx, cy, cz, clear) {
  const rx = px - cx, ry = py - cy, rz = pz - cz;
  const vv = vx * vx + vy * vy + vz * vz;
  if (vv < 1e-9) return { t: 0, tEnter: Infinity, miss: Math.hypot(rx, ry, rz), inside: false, outward: true };

  let t = -(rx * vx + ry * vy + rz * vz) / vv;
  if (t < 0) t = 0;
  const mx = px + vx * t - cx;
  const my = py + vy * t - cy;
  const mz = pz + vz * t - cz;
  const miss = Math.hypot(mx, my, mz);

  const b = rx * vx + ry * vy + rz * vz;
  const c = rx * rx + ry * ry + rz * rz - clear * clear;

  if (c < 0) {
    const outward = b > 0;
    return { t: 0, tEnter: outward ? Infinity : 0, miss, inside: true, outward };
  }

  let tEnter = Infinity;
  const disc = b * b - vv * c;
  if (disc >= 0) {
    const root = (-b - Math.sqrt(disc)) / vv;
    if (root >= 0) tEnter = root;
  }
  return { t, tEnter, miss, inside: false, outward: b > 0 };
}

export const blind = new Map();

export function threatTo(pos, vel, { exempt = null, surface = null, ignore = blind, time = 0, horizon = AVOID.horizon, includeRocks = true, minLevel = 0 } = {}) {
  const speed = Math.hypot(vel.x, vel.y, vel.z);
  const reach = speed * horizon;
  let worst = null;

  const consider = (id, name, kind, cx, cy, cz, radius, hz, hv = null) => {
    if (exempt && exempt.has(id)) return;
    const vx = vel.x - (hv?.x ?? 0), vy = vel.y - (hv?.y ?? 0), vz = vel.z - (hv?.z ?? 0);
    const stopped = Math.hypot(vx, vy, vz) < 1;
    if (ignore && (ignore.get(id) ?? -Infinity) > time) return;
    const rock = kind === "rock";
    const clear = rock
      ? Math.max(radius * AVOID.rockPad, radius + AVOID.rockMinPad)
      : surface && surface.has(id) ? radius * AVOID.surfacePad + AVOID.minPad
      : Math.max(radius * AVOID.pad, radius + AVOID.minPad);
    if (stopped) {
      const d = Math.hypot(pos.x - cx, pos.y - cy, pos.z - cz);
      if (d >= clear) return;
      const u = 2 + (clear - d) / clear;
      if (!worst || u > worst.urgency) {
        worst = { id, name, kind, x: cx, y: cy, z: cz, r: radius, clear, t: 0, tClosest: 0, miss: d, inside: true, outward: false, urgency: u, rv: { x: vx, y: vy, z: vz } };
      }
      return;
    }
    const a = approach(pos.x, pos.y, pos.z, vx, vy, vz, cx, cy, cz, clear);
    if (a.tEnter > hz) return;
    if (!a.inside && a.miss > clear) return;
    const squareness = 1 - Math.min(1, a.miss / clear);
    const urgency = a.inside ? 2 : (1 - a.tEnter / hz) * (0.45 + squareness * 0.55);
    if (!worst || urgency > worst.urgency) {
      worst = {
        id, name, kind, x: cx, y: cy, z: cz, r: radius, clear,
        t: a.tEnter, tClosest: a.t, miss: a.miss, inside: a.inside, outward: a.outward, urgency, rv: { x: vx, y: vy, z: vz },
      };
    }
  };

  for (const b of BODIES) {
    if (b.kind === "star") continue;
    const r = remnantRadius(b);
    bodyPosition(b.id, time, _p);
    bodyVelocity(b.id, time, _bv);
    const relReach = Math.hypot(vel.x - _bv.x, vel.y - _bv.y, vel.z - _bv.z) * horizon;
    if (dist3(_p, pos) > Math.max(reach, relReach) + r * 4) continue;
    consider(b.id, b.name, "body", _p.x, _p.y, _p.z, r, horizon, _bv);
  }

  for (const h of holes) {
    const r = holeRadii(h, _hr).danger;
    if (dist3(h, pos) > reach + r * 4) continue;
    consider(h.id, h.name, "body", h.x, h.y, h.z, r, horizon);
  }

  for (const st of stations) {
    if (!st || st.x === undefined) continue;
    if (dist3(st, pos) > reach + (st.radius ?? 100) * 4) continue;
    _sv.x = st.vx ?? 0; _sv.y = st.vy ?? 0; _sv.z = st.vz ?? 0;
    consider(st.id, st.name, "station", st.x, st.y, st.z, st.radius ?? 100, horizon, _sv);
  }

  if (includeRocks) {
    const rockHz = Math.min(AVOID.rockHorizon, horizon);
    const rockReach = speed * rockHz;
    const rocks = nearbyRocks(pos, time, AVOID.rockSpan);
    for (const k of rocks) {
      if (dist3(k, pos) > rockReach + (k.r ?? 40) * 2 + AVOID.rockMinPad * 2) continue;
      consider(k.key ?? k.id ?? `rock:${k.x.toFixed(0)}:${k.z.toFixed(0)}`, "rock", "rock", k.x, k.y, k.z, k.r ?? 40, rockHz);
    }
  }

  if (worst && minLevel > 0 && avoidLevel(worst) < minLevel) return null;
  return worst;
}

const commit = { id: null, x: 0, y: 0, z: 0, at: -1e9 };

export function clearAvoidCommit() {
  commit.id = null;
  commit.at = -1e9;
}

export function avoidCommit() {
  return commit.id ? { id: commit.id, x: commit.x, y: commit.y, z: commit.z, at: commit.at } : null;
}

export function avoidAim(pos, vel, threat, out = { x: 0, y: 0, z: 0 }, now = 0) {
  const vx = threat.rv?.x ?? vel.x, vy = threat.rv?.y ?? vel.y, vz = threat.rv?.z ?? vel.z;
  const sp = Math.hypot(vx, vy, vz) || 1;
  const fx = vx / sp, fy = vy / sp, fz = vz / sp;

  if (threat.inside) {
    const ox = pos.x - threat.x, oy = pos.y - threat.y, oz = pos.z - threat.z;
    const on = Math.hypot(ox, oy, oz) || 1;
    out.x = threat.x + (ox / on) * threat.clear * AVOID.clearFactor;
    out.y = threat.y + (oy / on) * threat.clear * AVOID.clearFactor;
    out.z = threat.z + (oz / on) * threat.clear * AVOID.clearFactor;
    return out;
  }

  let lx, ly, lz;
  const fresh = commit.id !== threat.id || now - commit.at > AVOID.commitS;
  if (!fresh) {
    lx = commit.x; ly = commit.y; lz = commit.z;
    const dot = lx * fx + ly * fy + lz * fz;
    lx -= fx * dot; ly -= fy * dot; lz -= fz * dot;
    const n = Math.hypot(lx, ly, lz);
    if (n < 1e-3) { commit.id = null; } else { lx /= n; ly /= n; lz /= n; }
  }

  if (commit.id !== threat.id || fresh) {
    const tc = threat.tClosest ?? threat.t;
    const rx = pos.x + fx * sp * tc - threat.x;
    const ry = pos.y + fy * sp * tc - threat.y;
    const rz = pos.z + fz * sp * tc - threat.z;
    const dot = rx * fx + ry * fy + rz * fz;
    lx = rx - fx * dot; ly = ry - fy * dot; lz = rz - fz * dot;
    let ln = Math.hypot(lx, ly, lz);
    if (ln < 1e-3) {
      lx = -fz; ly = 0; lz = fx;
      ln = Math.hypot(lx, ly, lz) || 1;
    }
    lx /= ln; ly /= ln; lz /= ln;
    commit.id = threat.id; commit.x = lx; commit.y = ly; commit.z = lz; commit.at = now;
  }

  const need = threat.clear * AVOID.clearFactor;
  const lead = threat.clear * AVOID.leadFactor;
  out.x = threat.x + lx * need + fx * lead;
  out.y = threat.y + ly * need + fy * lead;
  out.z = threat.z + lz * need + fz * lead;
  return out;
}

export function avoidLevel(threat) {
  if (!threat) return 0;
  if (threat.inside) return threat.outward ? 0 : 2;
  if (threat.kind === "rock") {
    if (threat.r >= AVOID.rockHardR && threat.t <= AVOID.rockHardAt) return 3;
    if (threat.t <= AVOID.rockHorizon * 0.5) return 2;
    return 1;
  }
  if (threat.t <= AVOID.hardAt) return 3;
  if (threat.t <= AVOID.brakeAt) return 2;
  return 1;
}

export function surfaceOnly(sim) {
  return sim.dockPort?.hostId ? new Set([sim.dockPort.hostId]) : null;
}

export function deliberate(sim, mining) {
  const set = new Set();
  const ship = sim.ship;
  if (ship?.dockedAt) set.add(ship.dockedAt);
  if (sim.lock?.id) set.add(sim.lock.id);
  if (sim.selected) set.add(sim.selected);
  if (sim.dockRequestFor) set.add(sim.dockRequestFor);
  if (sim.tractor?.stationId) set.add(sim.tractor.stationId);
  if (sim.approach?.st?.id) set.add(sim.approach.st.id);
  if (sim.dockPort?.id) set.add(sim.dockPort.id);
  if (mining?.active && mining.key) set.add(mining.key);
  return set;
}
