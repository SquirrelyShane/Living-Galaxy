/* LIVING GALAXY — super asteroids.
 *
 * Rogue bodies on their own trajectories through the system. They fly the
 * same gravity the ship does, so passing a world bends them: a shallow pass
 * turns them onto a new heading, a deep one drops them into the surface. When
 * they connect, the world they hit does not walk away from it.
 */

import { WORLD_SCALE, remnantRadius } from "./scale.js";
import { rockName, surveyYear } from "./names.js";

const MAX_LIVE = 3;
const SPAWN_R = 90000;       // they arrive from your neighbourhood, not the rim
const DESPAWN_R = 260000;
const SPAWN_EVERY = 55;      // seconds, average

export const impactors = [];

/* Thirteen names and a counter used to be the whole supply, so the fourteenth
 * rock of a session was Kerrn again. Rocks are catalogued now (js/names.js):
 * most die as a survey designation, and only one that is big enough to end a
 * moon gets talked about long enough to earn a name. */
let year = 2371;
const namedRocks = new Set();

let seq = 1;
let clock = 0;
let nextAt = SPAWN_EVERY;    // rolled once per spawn, not per frame
let rng = Math.random;

/* Who rolls the rocks. In a shared sky only the host spawns and integrates
 * impactors; everyone else mirrors the host's list (`adoptImpactors`) and
 * dead-reckons it between updates. Strikes arrive as events. */
let authority = true;
export function setImpactorAuthority(on) {
  authority = Boolean(on);
}
export function impactorAuthority() {
  return authority;
}

/** Mirror the host's list: keep what we have by id (smooth), add new, drop gone. */
export function adoptImpactors(list) {
  const seen = new Set();
  for (const m of list ?? []) {
    seen.add(m.id);
    let have = impactors.find((x) => x.id === m.id);
    if (!have) {
      have = { id: m.id, name: m.name, r: m.r, x: m.x, y: m.y, z: m.z, vx: m.vx, vy: m.vy, vz: m.vz, seed: m.seed ?? 0.5, spin: m.spin ?? 0.1, deflected: 0, lastWell: null, born: m.born ?? 0, remote: true, cls: m.cls, shape: m.shape, bodySeed: m.bodySeed };
      impactors.push(have);
    }
    /* snap position gently: a small error slews, a large one jumps */
    const err = Math.hypot(m.x - have.x, m.y - have.y, m.z - have.z);
    const k = err > 800 ? 1 : 0.35;
    have.x += (m.x - have.x) * k; have.y += (m.y - have.y) * k; have.z += (m.z - have.z) * k;
    have.vx = m.vx; have.vy = m.vy; have.vz = m.vz;
    have.r = m.r; have.name = m.name;
  }
  for (let i = impactors.length - 1; i >= 0; i--) if (!seen.has(impactors[i].id)) impactors.splice(i, 1);
}

/** Wire form of the live list, for the host to broadcast. */
export function impactorWire() {
  return impactors.map((m) => ({ id: m.id, name: m.name, r: m.r, x: m.x, y: m.y, z: m.z, vx: m.vx, vy: m.vy, vz: m.vz, seed: m.seed, spin: m.spin, born: m.born ?? 0, cls: m.cls, shape: m.shape, bodySeed: m.bodySeed }));
}

export function resetImpactors(seedFn) {
  impactors.length = 0;
  seq = 1;
  clock = -14;
  if (seedFn) rng = seedFn;
  /* One survey year for the whole sky, so the designations in a system read
   * as one catalogue rather than a scatter of unrelated years. */
  year = surveyYear(rng);
  namedRocks.clear();
  nextAt = SPAWN_EVERY * (0.5 + rng());
}

function spawn(ship, bodies, bodyPosition, time) {
  /* Come in from a random direction, aimed either at a nearby world or at a
   * near-miss past the ship — the near misses are what make the deflections
   * worth watching. */
  const a = rng() * Math.PI * 2;
  const el = (rng() - 0.5) * 0.7;
  const from = {
    x: ship.pos.x + Math.cos(a) * Math.cos(el) * SPAWN_R,
    y: ship.pos.y + Math.sin(el) * SPAWN_R * 0.5,
    z: ship.pos.z + Math.sin(a) * Math.cos(el) * SPAWN_R,
  };

  /* Two thirds are thrown at a world, the rest sail past you. */
  let aim;
  const near = bodies
    .filter((b) => b.kind !== "star" && !b.shattered)
    .map((b) => {
      const p = bodyPosition(b.id, time, { x: 0, y: 0, z: 0 });
      return { b, p, d: Math.hypot(p.x - ship.pos.x, p.y - ship.pos.y, p.z - ship.pos.z) };
    })
    .filter((x) => x.d < SPAWN_R * 1.6)
    .sort((x, y) => x.d - y.d);

  if (near.length && rng() < 0.66) {
    const t = near[Math.floor(rng() * Math.min(3, near.length))];
    const j = t.b.radius * (rng() < 0.45 ? 0.4 : 3.2);
    aim = {
      x: t.p.x + (rng() - 0.5) * j,
      y: t.p.y + (rng() - 0.5) * j,
      z: t.p.z + (rng() - 0.5) * j,
    };
  } else {
    const j = 8000;
    aim = {
      x: ship.pos.x + (rng() - 0.5) * j,
      y: ship.pos.y + (rng() - 0.5) * j,
      z: ship.pos.z + (rng() - 0.5) * j,
    };
  }

  const dx = aim.x - from.x;
  const dy = aim.y - from.y;
  const dz = aim.z - from.z;
  const d = Math.hypot(dx, dy, dz) || 1;
  const speed = 280 + rng() * 620;
  /* heavy tail: mostly mountains, rarely something that ends a moon */
  const r = (120 + 780 * Math.pow(rng(), 2.5)) * WORLD_SCALE;

  const n = ++seq;
  impactors.push({
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
  });
}

/**
 * @param onImpact  (impactor, body, speed, normal) => void
 * @param onShipHit (impactor, speed) => void
 */
export function stepImpactors(dt, ship, bodies, bodyPosition, gravityAt, gOut, time, onImpact, onShipHit, onRogueHit = null) {
  if (!authority) {
    /* mirror mode: dead-reckon the host's rocks, and only the ship can be hit */
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
  if (clock > nextAt && impactors.length < MAX_LIVE) {
    clock = 0;
    nextAt = SPAWN_EVERY * (0.5 + rng());
    spawn(ship, bodies, bodyPosition, time);
  }

  const bp = { x: 0, y: 0, z: 0 };
  for (let i = impactors.length - 1; i >= 0; i--) {
    const m = impactors[i];

    /* Same solver the ship uses, so a well bends it honestly. */
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

    /* strike a world */
    let hit = null;
    for (const b of bodies) {
      if (b.collapsed) continue; // a remnant is its hole now (holes.js eats); the old star's sphere is gone
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

    /* strike the ship */
    const ds = Math.hypot(m.x - ship.pos.x, m.y - ship.pos.y, m.z - ship.pos.z);
    if (ds < m.r + 6) {
      const rel = Math.hypot(m.vx - ship.vel.x, m.vy - ship.vel.y, m.vz - ship.vel.z);
      impactors.splice(i, 1);
      onShipHit(m, rel);
      continue;
    }

    if (ds > DESPAWN_R) impactors.splice(i, 1);
  }

  /* Rock on rock. Three rogues in a sky a million units across almost never
   * meet — but a fragment thrown off one is born beside it, and two that do
   * meet are the Impact Lab's whole premise (js/impacts.js). One pair a tick. */
  if (onRogueHit && impactors.length > 1) {
    for (let i = 0; i < impactors.length; i++) {
      for (let j = i + 1; j < impactors.length; j++) {
        const a = impactors[i], b = impactors[j];
        if ((a.born ?? 0) > time - 2 && a.parentOf === b.id) continue;   // a fragment leaving its parent
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

/**
 * A new rogue that did not come from outside: the biggest piece leaving a
 * rock-on-rock collision (js/impacts.js). It carries its parent's class and a
 * designation off its parent's name, and it is a faceted fragment.
 */
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

/** Closest approach of an impactor to a point, and how long until it.
 *
 * `out` lets a caller inside a loop reuse one object rather than allocate a
 * `{t, d}` per body per impactor per tick — which the sentry board did, at a
 * few hundred short-lived objects a frame. Omit it and you get a fresh one,
 * which is what every caller outside this file wants. */
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

/* Scratch for threatBoard. This runs every tick the sentry is powered, and it
 * used to allocate: one array, one row per rock, one `{t,d}` per BODY per rock,
 * and one `{body,t,d}` per near miss — then sort the lot. Thirty rocks against
 * twelve worlds is close to four hundred short-lived objects a tick, or twenty
 * thousand a second, to produce a list whose consumers (sim.js, the NPC
 * captain, one console panel) only ever read `[0]`.
 *
 * The rows are pooled and the array is reused, so a steady sky allocates
 * nothing here at all. It is still sorted and still complete — the console
 * panel does show the whole board — but the list belongs to this module: a
 * caller that wants to keep a row past the next tick must copy it. */
const _board = [];
const _rows = [];
const _bp = { x: 0, y: 0, z: 0 };
const _self = { t: 0, d: 0 };
const _ca = { t: 0, d: 0 };

function boardRow(i) {
  if (!_rows[i]) _rows[i] = { id: "", name: "", r: 0, dist: 0, speed: 0, missSelf: 0, etaSelf: 0, target: null, well: null, deflected: 0, _t: { body: "", t: 0, d: 0 } };
  return _rows[i];
}

/** What the sentry board shows: inbound rocks ranked by how much they matter. */
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

/** The sentry board with the sentry off: the same array, empty. */
export function emptyThreatBoard() {
  _board.length = 0;
  return _board;
}
