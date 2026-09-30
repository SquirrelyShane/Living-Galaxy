import { WORLD_SCALE, remnantRadius } from "../scale.js";
import { rockName, surveyYear } from "../names.js";

export const ROGUE = { every: 420, firstAfter: 300, maxLive: 2, aimWorld: 0.3, strike: 0.2, passR: [4.5, 7], clearR: 2.2, passMargin: 1.5, planSecs: 480, planStep: 2, tries: 8 };
export const rogueHooks = { spare: null };
const SPAWN_R = 90000;
const DESPAWN_R = 260000;

export const impactors = [];

let year = 2371;
const namedRocks = new Set();

let seq = 1;
let clock = 0;
let nextAt = ROGUE.every;
let rng = Math.random;

let authority = true;
export function setImpactorAuthority(on) {
  authority = Boolean(on);
}
export function impactorAuthority() {
  return authority;
}

export function adoptImpactors(list) {
  const seen = new Set();
  for (const m of list ?? []) {
    seen.add(m.id);
    let have = impactors.find((x) => x.id === m.id);
    if (!have) {
      have = { id: m.id, name: m.name, r: m.r, x: m.x, y: m.y, z: m.z, vx: m.vx, vy: m.vy, vz: m.vz, seed: m.seed ?? 0.5, spin: m.spin ?? 0.1, deflected: 0, lastWell: null, born: m.born ?? 0, remote: true, cls: m.cls, shape: m.shape, bodySeed: m.bodySeed };
      impactors.push(have);
    }
    const err = Math.hypot(m.x - have.x, m.y - have.y, m.z - have.z);
    const k = err > 800 ? 1 : 0.35;
    have.x += (m.x - have.x) * k; have.y += (m.y - have.y) * k; have.z += (m.z - have.z) * k;
    have.vx = m.vx; have.vy = m.vy; have.vz = m.vz;
    have.r = m.r; have.name = m.name;
  }
  for (let i = impactors.length - 1; i >= 0; i--) if (!seen.has(impactors[i].id)) impactors.splice(i, 1);
}

export function impactorWire() {
  return impactors.map((m) => ({ id: m.id, name: m.name, r: m.r, x: m.x, y: m.y, z: m.z, vx: m.vx, vy: m.vy, vz: m.vz, seed: m.seed, spin: m.spin, born: m.born ?? 0, cls: m.cls, shape: m.shape, bodySeed: m.bodySeed }));
}

export function resetImpactors(seedFn) {
  impactors.length = 0;
  seq = 1;
  clock = -14;
  if (seedFn) rng = seedFn;
  year = surveyYear(rng);
  namedRocks.clear();
  nextAt = ROGUE.firstAfter + 14 + ROGUE.every * rng();
}

function spawn(ship, bodies, bodyPosition, time, gravityAt = null) {
  const near = bodies
    .filter((b) => b.kind !== "star" && !b.shattered && !b.collapsed)
    .map((b) => {
      const p = bodyPosition(b.id, time, { x: 0, y: 0, z: 0 });
      return { b, p, d: Math.hypot(p.x - ship.pos.x, p.y - ship.pos.y, p.z - ship.pos.z) };
    })
    .filter((x) => x.d < SPAWN_R * 1.6)
    .sort((x, y) => x.d - y.d);

  const toWorld = near.length && rng() < ROGUE.aimWorld;
  const striking = toWorld && rng() < ROGUE.strike;
  const targets = striking ? near.filter((x) => !rogueHooks.spare?.(x.b)) : near;
  if (striking && !targets.length) return null;

  for (let attempt = 0; attempt < ROGUE.tries; attempt++) {
    const a = rng() * Math.PI * 2;
    const el = (rng() - 0.5) * 0.7;
    const from = {
      x: ship.pos.x + Math.cos(a) * Math.cos(el) * SPAWN_R,
      y: ship.pos.y + Math.sin(el) * SPAWN_R * 0.5,
      z: ship.pos.z + Math.sin(a) * Math.cos(el) * SPAWN_R,
    };
    const speed = 280 + rng() * 620;
    let aim, target = null;
    if (toWorld) {
      target = targets[Math.floor(rng() * Math.min(3, targets.length))];
      const j = target.b.radius * (striking ? 0.4 : ROGUE.passR[0] + rng() * (ROGUE.passR[1] - ROGUE.passR[0]));
      const at = leadWorld(target.b, from, speed, time, bodyPosition);
      const ox = rng() - 0.5, oy = rng() - 0.5, oz = rng() - 0.5;
      const on = Math.hypot(ox, oy, oz) || 1;
      const k = striking ? j * rng() : j;
      aim = { x: at.x + (ox / on) * k, y: at.y + (oy / on) * k, z: at.z + (oz / on) * k };
    } else {
      const j = 8000;
      const t = SPAWN_R / speed;
      const v = ship.vel ?? { x: 0, y: 0, z: 0 };
      aim = { x: ship.pos.x + v.x * t + (rng() - 0.5) * j, y: ship.pos.y + v.y * t + (rng() - 0.5) * j, z: ship.pos.z + v.z * t + (rng() - 0.5) * j };
    }
    const r = (120 + 780 * Math.pow(rng(), 2.5)) * WORLD_SCALE;
    let ratio = gravityAt ? flyPlan(from, aim, speed, r, bodies, time, bodyPosition, gravityAt, striking ? target.b : null) : null;
    for (let k = 0; striking && ratio && k < 2 && ratio.get(target.b) >= 1; k++) {
      const off = ratio.off;
      aim.x -= off.x; aim.y -= off.y; aim.z -= off.z;
      ratio = flyPlan(from, aim, speed, r, bodies, time, bodyPosition, gravityAt, target.b);
    }
    if (ratio && !striking && [...ratio].some(([b, k]) => k < (b === target?.b ? ROGUE.passMargin : ROGUE.clearR))) continue;
    if (ratio && striking && [...ratio].some(([b, k]) => k < ROGUE.clearR && b !== target.b && rogueHooks.spare?.(b))) continue;
    const m = launch(from, aim, speed, r, time);
    m.aim = striking ? "strike" : toWorld ? "pass" : "by-you";
    return m;
  }
  return null;
}

function leadWorld(b, from, speed, time, bodyPosition) {
  const p = bodyPosition(b.id, time, { x: 0, y: 0, z: 0 });
  for (let i = 0; i < 3; i++) {
    const t = Math.hypot(p.x - from.x, p.y - from.y, p.z - from.z) / speed;
    bodyPosition(b.id, time + t, p);
  }
  return p;
}

const _pg = { x: 0, y: 0, z: 0 }, _pb = { x: 0, y: 0, z: 0 };
function flyPlan(from, aim, speed, r, bodies, time, bodyPosition, gravityAt, target = null) {
  const dx = aim.x - from.x, dy = aim.y - from.y, dz = aim.z - from.z;
  const len = Math.hypot(dx, dy, dz) || 1;
  const m = { x: from.x, y: from.y, z: from.z, vx: (dx / len) * speed, vy: (dy / len) * speed, vz: (dz / len) * speed };
  const reach = speed * ROGUE.planSecs + len;
  const worlds = bodies.filter((b) => {
    if (b.kind === "star" || b.collapsed) return false;
    bodyPosition(b.id, time, _pb);
    return Math.hypot(_pb.x - from.x, _pb.y - from.y, _pb.z - from.z) < reach;
  });
  const out = new Map(worlds.map((b) => [b, Infinity]));
  out.off = { x: 0, y: 0, z: 0 };
  const h = ROGUE.planStep;
  for (let t = 0; t < ROGUE.planSecs; t += h) {
    gravityAt(m, time + t, bodyPosition, _pg);
    m.vx += _pg.x * h; m.vy += _pg.y * h; m.vz += _pg.z * h;
    m.x += m.vx * h; m.y += m.vy * h; m.z += m.vz * h;
    for (const b of worlds) {
      bodyPosition(b.id, time + t + h, _pb);
      const k = Math.hypot(m.x - _pb.x, m.y - _pb.y, m.z - _pb.z) / (remnantRadius(b) + r);
      if (k < out.get(b)) {
        out.set(b, k);
        if (b === target) { out.off.x = m.x - _pb.x; out.off.y = m.y - _pb.y; out.off.z = m.z - _pb.z; }
      }
    }
  }
  return out;
}

function launch(from, aim, speed, r, time) {
  const dx = aim.x - from.x;
  const dy = aim.y - from.y;
  const dz = aim.z - from.z;
  const d = Math.hypot(dx, dy, dz) || 1;

  const n = ++seq;
  const m = {
    id: `imp${n}`,
    name: rockName(n, r / WORLD_SCALE, rng, year, namedRocks),
    x: from.x, y: from.y, z: from.z,
    vx: (dx / d) * speed,
    vy: (dy / d) * speed,
    vz: (dz / d) * speed,
    r,
    seed: rng(),
    spin: (rng() - 0.5) * 0.4,
    born: time,
    deflected: 0,
    lastWell: null,
  };
  impactors.push(m);
  return m;
}

export function stepImpactors(dt, ship, bodies, bodyPosition, gravityAt, gOut, time, onImpact, onShipHit, onRogueHit = null) {
  if (!authority) {
    for (let i = impactors.length - 1; i >= 0; i--) {
      const m = impactors[i];
      m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt;
      const ds = Math.hypot(m.x - ship.pos.x, m.y - ship.pos.y, m.z - ship.pos.z);
      if (ds < m.r + 6) {
        const rel = Math.hypot(m.vx - ship.vel.x, m.vy - ship.vel.y, m.vz - ship.vel.z);
        impactors.splice(i, 1);
        onShipHit(m, rel);
      }
    }
    return;
  }
  clock += dt;
  if (clock > nextAt && impactors.length < ROGUE.maxLive) {
    clock = 0;
    nextAt = ROGUE.every * (0.5 + rng());
    spawn(ship, bodies, bodyPosition, time, gravityAt);
  }

  const bp = { x: 0, y: 0, z: 0 };
  for (let i = impactors.length - 1; i >= 0; i--) {
    const m = impactors[i];

    const dom = gravityAt(m, time, bodyPosition, gOut);
    const before = Math.atan2(m.vz, m.vx);
    m.vx += gOut.x * dt;
    m.vy += gOut.y * dt;
    m.vz += gOut.z * dt;
    const after = Math.atan2(m.vz, m.vx);
    let turn = after - before;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    m.deflected += Math.abs(turn);
    m.lastWell = dom.body?.name ?? null;

    m.x += m.vx * dt;
    m.y += m.vy * dt;
    m.z += m.vz * dt;

    let hit = null;
    for (const b of bodies) {
      if (b.collapsed) continue;
      bodyPosition(b.id, time, bp);
      const dx = m.x - bp.x;
      const dy = m.y - bp.y;
      const dz = m.z - bp.z;
      const d = Math.hypot(dx, dy, dz);
      const skin = remnantRadius(b) + m.r;
      if (d < skin) {
        hit = { b, nx: dx / (d || 1), ny: dy / (d || 1), nz: dz / (d || 1) };
        break;
      }
    }
    if (hit) {
      const speed = Math.hypot(m.vx, m.vy, m.vz);
      impactors.splice(i, 1);
      onImpact(m, hit.b, speed, hit);
      continue;
    }

    const ds = Math.hypot(m.x - ship.pos.x, m.y - ship.pos.y, m.z - ship.pos.z);
    if (ds < m.r + 6) {
      const rel = Math.hypot(m.vx - ship.vel.x, m.vy - ship.vel.y, m.vz - ship.vel.z);
      impactors.splice(i, 1);
      onShipHit(m, rel);
      continue;
    }

    if (ds > DESPAWN_R) impactors.splice(i, 1);
  }

  if (onRogueHit && impactors.length > 1) {
    for (let i = 0; i < impactors.length; i++) {
      for (let j = i + 1; j < impactors.length; j++) {
        const a = impactors[i], b = impactors[j];
        if ((a.born ?? 0) > time - 2 && a.parentOf === b.id) continue;
        if ((b.born ?? 0) > time - 2 && b.parentOf === a.id) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
        if (d >= a.r + b.r) continue;
        impactors.splice(j, 1);
        impactors.splice(i, 1);
        onRogueHit(a, b);
        return;
      }
    }
  }
}

export function addRogue(m, time = 0) {
  if (!authority) return null;
  const n = ++seq;
  const rock = {
    id: `imp${n}`,
    name: m.name ?? rockName(n, m.r / WORLD_SCALE, rng, year, namedRocks),
    x: m.x, y: m.y, z: m.z, vx: m.vx, vy: m.vy, vz: m.vz,
    r: m.r, seed: m.seed ?? rng(), spin: m.spin ?? (rng() - 0.5) * 0.4,
    born: time, deflected: 0, lastWell: null,
    cls: m.cls, shape: m.shape, bodySeed: m.bodySeed, parentOf: m.parentOf ?? null,
  };
  impactors.push(rock);
  return rock;
}

export function closestApproach(m, pos, out) {
  const r = out ?? { t: 0, d: 0 };
  const rx = pos.x - m.x;
  const ry = pos.y - m.y;
  const rz = pos.z - m.z;
  const v2 = m.vx * m.vx + m.vy * m.vy + m.vz * m.vz;
  if (v2 < 1e-6) { r.t = Infinity; r.d = Math.hypot(rx, ry, rz); return r; }
  const t = Math.max(0, (rx * m.vx + ry * m.vy + rz * m.vz) / v2);
  const cx = m.x + m.vx * t - pos.x;
  const cy = m.y + m.vy * t - pos.y;
  const cz = m.z + m.vz * t - pos.z;
  r.t = t;
  r.d = Math.hypot(cx, cy, cz);
  return r;
}

const _board = [];
const _rows = [];
const _bp = { x: 0, y: 0, z: 0 };
const _self = { t: 0, d: 0 };
const _ca = { t: 0, d: 0 };

function boardRow(i) {
  if (!_rows[i]) _rows[i] = { id: "", name: "", r: 0, dist: 0, speed: 0, missSelf: 0, etaSelf: 0, target: null, well: null, deflected: 0, _t: { body: "", t: 0, d: 0 } };
  return _rows[i];
}

export function threatBoard(ship, bodies, bodyPosition, time) {
  _board.length = 0;
  let n = 0;
  for (const m of impactors) {
    closestApproach(m, ship.pos, _self);
    const row = boardRow(n++);
    let worst = null;
    for (const b of bodies) {
      if (b.kind === "star" || b.shattered) continue;
      bodyPosition(b.id, time, _bp);
      closestApproach(m, _bp, _ca);
      if (_ca.d < b.radius * 1.6 && (!worst || _ca.t < worst.t)) {
        row._t.body = b.name; row._t.t = _ca.t; row._t.d = _ca.d;
        worst = row._t;
      }
    }
    row.id = m.id;
    row.name = m.name;
    row.r = m.r;
    row.dist = Math.hypot(m.x - ship.pos.x, m.y - ship.pos.y, m.z - ship.pos.z);
    row.speed = Math.hypot(m.vx, m.vy, m.vz);
    row.missSelf = _self.d;
    row.etaSelf = _self.t;
    row.target = worst;
    row.well = m.lastWell;
    row.deflected = m.deflected;
    _board.push(row);
  }
  _board.sort((a, b) => (a.target ? a.target.t : a.etaSelf) - (b.target ? b.target.t : b.etaSelf));
  return _board;
}

export function emptyThreatBoard() {
  _board.length = 0;
  return _board;
}
