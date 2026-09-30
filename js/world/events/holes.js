import { horizon as kerrHorizon, isco as kerrIsco } from "../../asteroidgen/kerr.js";

export const HOLE = {
  spin: 0.6,
  transitRs: [1500, 2300],
  transitMu: 1.1e11,
  speed: [2200, 3200],
  spawnR: 720000,
  despawnR: 1100000,
  missShip: [110000, 240000],
  worldShare: 0.4,
  checkEvery: 600,
  chance: 0.05,
  firstAfter: 2400,
  minGap: 10800,
  eatEvery: 0.25,
  warpClear: 60,
  tidalRate: 0.18,
  maxFeed: 24,
};

export const holes = [];
export const holeFx = [];
function fx(e) {
  holeFx.push(e);
  if (holeFx.length > 64) holeFx.shift();
}

let seq = 1;
let clock = 0;
let nextRoll = HOLE.firstAfter;
let lastBirth = -Infinity;

export function resetHoles() {
  holes.length = 0;
  holeFx.length = 0;
  seq = 1;
  clock = 0;
  nextRoll = HOLE.firstAfter;
  lastBirth = -Infinity;
}

export function holeRadii(h, out = {}) {
  const a = h.spin ?? HOLE.spin;
  const M = h.rs / 2;
  out.horizon = kerrHorizon(a) * M;
  out.burn = kerrIsco(a) * M;
  out.capture = h.rs;
  out.roche = h.rs * 6;
  out.danger = h.rs * 9;
  out.disk = h.rs * 13;
  out.warp = h.rs * HOLE.warpClear;
  return out;
}
const _r = {};

export function holeAccel(pos, out) {
  let strongest = 0;
  for (const h of holes) {
    if (!h.gravity) continue;
    const dx = h.x - pos.x, dy = h.y - pos.y, dz = h.z - pos.z;
    const d2 = dx * dx + dy * dy + dz * dz;
    const soft = d2 + h.rs * h.rs;
    if (!(soft > 0)) continue;
    const a = h.mu / soft;
    const inv = a / Math.sqrt(soft);
    out.x += dx * inv;
    out.y += dy * inv;
    out.z += dz * inv;
    if (a > strongest) strongest = a;
  }
  return strongest;
}

export function nearestHole(pos) {
  let best = null, bd = Infinity;
  for (const h of holes) {
    const d = Math.hypot(h.x - pos.x, h.y - pos.y, h.z - pos.z);
    if (d < bd) { bd = d; best = h; }
  }
  return best ? { hole: best, dist: bd, radii: holeRadii(best, {}) } : null;
}

export function holeWarpBlock(pos) {
  for (const h of holes) {
    const d = Math.hypot(h.x - pos.x, h.y - pos.y, h.z - pos.z);
    if (d < h.rs * HOLE.warpClear) return `${h.name.toUpperCase()} · SPACETIME SHEAR · ${Math.round((h.rs * HOLE.warpClear - d) / 100)} km OUT`;
  }
  return "";
}

function feed(h, r, mass) {
  h.mass += mass;
  const rr = Math.max(holeRadii(h, _r).burn * 1.05, Math.min(_r.disk * 0.92, r));
  for (const f of h.feed) {
    if (Math.abs(f.r - rr) < h.rs * 0.45) { f.r = (f.r * f.mass + rr * mass) / (f.mass + mass); f.mass += mass; return; }
  }
  h.feed.push({ r: rr, mass });
  if (h.feed.length > HOLE.maxFeed) {
    h.feed.sort((a, b) => b.mass - a.mass);
    h.feed.length = HOLE.maxFeed;
  }
}

export const massOf = (r) => Math.pow(Math.max(1, r) / 1000, 3);

function nameHole(rng) {
  const L = "ABCDEFGHJKLMNPRSTVWXYZ";
  const a = L[Math.floor(rng() * L.length)], b = L[Math.floor(rng() * L.length)];
  return `Collapsar ${a}${b}-${100 + Math.floor(rng() * 900)}`;
}

export function spawnTransit({ ship, rng = Math.random, time = 0, aimAt = null, rs = null, speed = null } = {}) {
  const r = rs ?? HOLE.transitRs[0] + rng() * (HOLE.transitRs[1] - HOLE.transitRs[0]);
  const v = speed ?? HOLE.speed[0] + rng() * (HOLE.speed[1] - HOLE.speed[0]);
  const az = rng() * Math.PI * 2;
  const el = (rng() - 0.5) * 0.35;
  const dir = { x: Math.cos(el) * Math.cos(az), y: Math.sin(el), z: Math.cos(el) * Math.sin(az) };
  let aim;
  if (aimAt) {
    const px = -dir.z, pz = dir.x;
    const pl = Math.hypot(px, pz) || 1;
    aim = { x: aimAt.pos.x + (px / pl) * aimAt.pass, y: aimAt.pos.y, z: aimAt.pos.z + (pz / pl) * aimAt.pass };
  } else {
    const miss = HOLE.missShip[0] + rng() * (HOLE.missShip[1] - HOLE.missShip[0]);
    const px = -dir.z, pz = dir.x;
    const pl = Math.hypot(px, pz) || 1;
    const side = rng() < 0.5 ? -1 : 1;
    aim = { x: ship.pos.x + (px / pl) * miss * side, y: ship.pos.y, z: ship.pos.z + (pz / pl) * miss * side };
  }
  const h = {
    id: `bh${seq++}`,
    name: nameHole(rng),
    kind: "transit",
    x: aim.x - dir.x * HOLE.spawnR,
    y: aim.y - dir.y * HOLE.spawnR,
    z: aim.z - dir.z * HOLE.spawnR,
    vx: dir.x * v, vy: dir.y * v, vz: dir.z * v,
    rs: r,
    mu: HOLE.transitMu * (r / 1900),
    spin: HOLE.spin,
    gravity: true,
    mass: 0.4,
    feed: [{ r: r * 3.2, mass: 0.25 }, { r: r * 6.5, mass: 0.15 }],
    born: time,
    target: aimAt?.body?.id ?? null,
    eaten: { rocks: 0, rogues: 0, chunks: 0, ports: 0 },
    warned: 0,
  };
  holes.push(h);
  lastBirth = time;
  fx({ t: "birth", id: h.id });
  return h;
}

export function collapseStar(star, pos, time = 0) {
  if (!star || star.collapsed) return null;
  star.collapsed = true;
  const rs = Math.max(1800, Math.min(4200, (star.baseRadius ?? star.radius) * 0.09));
  const h = {
    id: `bh${seq++}`,
    name: `${star.name} remnant`,
    kind: "remnant",
    starId: star.id,
    x: pos.x, y: pos.y, z: pos.z, vx: 0, vy: 0, vz: 0,
    rs,
    mu: star.mu ?? HOLE.transitMu,
    spin: HOLE.spin,
    gravity: false,
    mass: 6,
    feed: [2.4, 3.6, 5.2, 7.8].map((k, i) => ({ r: rs * k, mass: 1.6 - i * 0.3 })),
    born: time,
    target: null,
    eaten: { rocks: 0, rogues: 0, chunks: 0, ports: 0 },
    warned: 3,
  };
  holes.push(h);
  lastBirth = time;
  fx({ t: "birth", id: h.id });
  return h;
}

export function rollTransit(dt, time, rng = Math.random) {
  clock += dt;
  if (clock < nextRoll) return false;
  nextRoll = clock + HOLE.checkEvery;
  if (holes.some((h) => h.kind === "transit")) return false;
  if (time - lastBirth < HOLE.minGap) return false;
  return rng() < HOLE.chance;
}

const _p = { x: 0, y: 0, z: 0 };
const _n = { nx: 0, ny: 0, nz: 0 };
let eatAcc = 0;

export function stepHoles(dt, ctx) {
  const time = ctx.time ?? 0;
  if (ctx.authority !== false && ctx.ship && ctx.bodies && rollTransit(dt, time, ctx.rng)) {
    const h = spawnTransit({ ship: ctx.ship, rng: ctx.rng, time, aimAt: pickWorld(ctx) });
    ctx.log?.(`Collapse flash on the long-range array — ${h.name}, a stellar remnant, is falling through this system at ${Math.round(Math.hypot(h.vx, h.vy, h.vz))} u/s`, "impact");
  }
  if (!holes.length) return;
  eatAcc += dt;
  const eat = eatAcc >= HOLE.eatEvery;
  const edt = eatAcc;
  if (eat) eatAcc = 0;

  for (let i = holes.length - 1; i >= 0; i--) {
    const h = holes[i];
    if (h.kind === "remnant" && ctx.bodyPosition && h.starId) {
      ctx.bodyPosition(h.starId, time, _p);
      h.x = _p.x; h.y = _p.y; h.z = _p.z;
    } else {
      h.x += h.vx * dt; h.y += h.vy * dt; h.z += h.vz * dt;
    }
    const R = holeRadii(h, _r);

    if (ctx.ship && ctx.onShip) {
      const d = Math.hypot(ctx.ship.pos.x - h.x, ctx.ship.pos.y - h.y, ctx.ship.pos.z - h.z);
      if (d < R.horizon * 1.05) ctx.onShip(h, "horizon", d, dt);
      else if (d < R.burn) ctx.onShip(h, "burn", d, dt);
      else if (d < R.roche) ctx.onShip(h, "roche", d, dt);
    }

    if (h.kind === "transit" && ctx.ship && ctx.authority !== false) {
      const dx = h.x - ctx.ship.pos.x, dy = h.y - ctx.ship.pos.y, dz = h.z - ctx.ship.pos.z;
      const away = dx * h.vx + dy * h.vy + dz * h.vz > 0;
      if (away && Math.hypot(dx, dy, dz) > HOLE.despawnR) {
        ctx.log?.(`${h.name} has left the system — ${h.eaten.rocks} rocks, ${h.eaten.rogues} rogues and ${h.eaten.chunks} tonnes of debris went with it`, "impact");
        holes.splice(i, 1);
        fx({ t: "gone", id: h.id });
        continue;
      }
    }
    if (!eat) continue;

    if (ctx.rocksNear && ctx.eatRocks && (!ctx.inBelt || ctx.inBelt(h))) {
      const span = Math.min(4, Math.ceil(R.roche / 3000));
      const rocks = ctx.rocksNear(h, time, span);
      const keys = [];
      const near = ctx.ship ? Math.hypot(ctx.ship.pos.x - h.x, ctx.ship.pos.y - h.y, ctx.ship.pos.z - h.z) < 160000 : false;
      for (const k of rocks) {
        const d = Math.hypot(k.x - h.x, k.y - h.y, k.z - h.z);
        if (d > R.roche + k.r) continue;
        keys.push(k.key);
        feed(h, d * 0.5, massOf(k.r));
        if (near) fx({ t: "rock", id: h.id, x: k.x, y: k.y, z: k.z, r: k.r, ore: k.ore, cls: k.cls, seed: k.seed });
      }
      if (keys.length) { ctx.eatRocks(keys); h.eaten.rocks += keys.length; }
    }

    if (ctx.impactors && ctx.authority !== false) {
      for (let j = ctx.impactors.length - 1; j >= 0; j--) {
        const m = ctx.impactors[j];
        const d = Math.hypot(m.x - h.x, m.y - h.y, m.z - h.z);
        if (d > R.roche + m.r) continue;
        ctx.impactors.splice(j, 1);
        h.eaten.rogues++;
        feed(h, d * 0.55, massOf(m.r) * 2.5);
        fx({ t: "rogue", id: h.id, m: { id: m.id, name: m.name, r: m.r, x: m.x, y: m.y, z: m.z, vx: m.vx, vy: m.vy, vz: m.vz, seed: m.seed, cls: m.cls, shape: m.shape, bodySeed: m.bodySeed } });
        ctx.log?.(`${m.name} strayed inside ${h.name}'s tidal radius and was torn apart`, "impact");
      }
    }

    if (ctx.chunks) {
      for (let j = ctx.chunks.length - 1; j >= 0; j--) {
        const c = ctx.chunks[j];
        if (c.driven) continue;
        const d = Math.hypot(c.x - h.x, c.y - h.y, c.z - h.z);
        if (d < R.burn) {
          h.eaten.chunks++;
          feed(h, R.burn * 1.3, massOf(c.r) * 4);
          if (ctx.removeChunk) ctx.removeChunk(c); else ctx.chunks.splice(j, 1);
        } else if (d < R.roche) {
          c.hot = Math.max(c.hot ?? 0, Math.min(1, 1.4 - d / R.roche));
        }
      }
    }

    if (ctx.contacts && ctx.authority !== false) {
      for (const c of ctx.contacts) {
        if (!(c.hp > 0)) continue;
        const d = Math.hypot(c.x - h.x, c.y - h.y, c.z - h.z);
        if (d < R.burn) { c.hp = 0; c.eaten = true; ctx.log?.(`${c.name} fell into ${h.name}`, "impact"); }
        else if (d < R.roche) c.hp -= edt * 12 * (1 - d / R.roche);
      }
    }

    if (ctx.stations && ctx.authority !== false) {
      for (let j = ctx.stations.length - 1; j >= 0; j--) {
        const st = ctx.stations[j];
        if (st.x === undefined) continue;
        const d = Math.hypot(st.x - h.x, st.y - h.y, st.z - h.z);
        if (d < R.burn * 1.6) { h.eaten.ports++; ctx.loseStation?.(st, h); }
        else if (d < R.roche * 1.5 && (st.rakedBy ?? null) !== h.id) { st.rakedBy = h.id; ctx.rakeStation?.(st, h, 1 - d / (R.roche * 1.5)); }
      }
    }

    if (ctx.bodies && ctx.bodyPosition && ctx.damageBody && ctx.authority !== false) {
      for (const b of ctx.bodies) {
        if (b.kind === "star" || b.shattered) continue;
        ctx.bodyPosition(b.id, time, _p);
        const d = Math.hypot(_p.x - h.x, _p.y - h.y, _p.z - h.z);
        const muW = Math.max(1, b.mu ?? 1);
        const dR = b.radius * Math.cbrt((2 * h.mu) / muW);
        if (d > dR) continue;
        const depth = Math.min(8, Math.pow(dR / Math.max(d, b.radius), 3) - 1);
        b.tidal = (b.tidal ?? 0) + HOLE.tidalRate * depth * edt;
        if (!b.tidalLogged || b.tidalLogged !== h.id) {
          b.tidalLogged = h.id;
          ctx.log?.(`${b.name} is inside ${h.name}'s Roche limit — the world is being pulled apart`, "impact");
        }
        if (b.tidal >= 0.06) {
          const sev = b.tidal;
          b.tidal = 0;
          const inv = 1 / (d || 1);
          _n.nx = (h.x - _p.x) * inv; _n.ny = (h.y - _p.y) * inv; _n.nz = (h.z - _p.z) * inv;
          if (depth > 0.8 && b.atmo) b.atmo = undefined;
          ctx.damageBody(b, sev, _n, b.radius * 0.25, 400);
          feed(h, R.roche * 0.6, sev * massOf(b.radius) * 0.02);
        }
      }
    }
  }
}

function pickWorld(ctx) {
  const rng = ctx.rng ?? Math.random;
  if (rng() > HOLE.worldShare) return null;
  const near = [];
  for (const b of ctx.bodies) {
    if (b.kind === "star" || b.shattered) continue;
    ctx.bodyPosition(b.id, ctx.time ?? 0, _p);
    const d = Math.hypot(_p.x - ctx.ship.pos.x, _p.y - ctx.ship.pos.y, _p.z - ctx.ship.pos.z);
    if (d < 520000) near.push({ b, pos: { x: _p.x, y: _p.y, z: _p.z }, d });
  }
  if (!near.length) return null;
  near.sort((a, b) => a.d - b.d);
  const t = near[Math.floor(rng() * Math.min(3, near.length))];
  const dR = t.b.radius * Math.cbrt((2 * HOLE.transitMu) / Math.max(1, t.b.mu ?? 1));
  return { body: t.b, pos: t.pos, pass: Math.max(t.b.radius * 1.3, dR * (0.45 + rng() * 0.25)) };
}

export function holeWire() {
  return holes.map((h) => ({
    id: h.id, name: h.name, kind: h.kind, starId: h.starId ?? null,
    x: Math.round(h.x), y: Math.round(h.y), z: Math.round(h.z),
    vx: h.vx, vy: h.vy, vz: h.vz, rs: h.rs, mu: h.mu, spin: h.spin, gravity: h.gravity,
    mass: h.mass, feed: h.feed.map((f) => ({ r: Math.round(f.r), mass: f.mass })), born: h.born, target: h.target ?? null,
  }));
}

export function adoptHoles(list) {
  if (!Array.isArray(list)) return;
  const seen = new Set();
  for (const w of list) {
    seen.add(w.id);
    let h = holes.find((x) => x.id === w.id);
    if (!h) {
      h = { ...w, feed: (w.feed ?? []).map((f) => ({ ...f })), eaten: { rocks: 0, rogues: 0, chunks: 0, ports: 0 }, warned: 3, remote: true };
      holes.push(h);
      fx({ t: "birth", id: h.id });
      continue;
    }
    const err = Math.hypot(w.x - h.x, w.y - h.y, w.z - h.z);
    const k = err > 5000 ? 1 : 0.3;
    h.x += (w.x - h.x) * k; h.y += (w.y - h.y) * k; h.z += (w.z - h.z) * k;
    h.vx = w.vx; h.vy = w.vy; h.vz = w.vz;
    h.mass = Math.max(h.mass, w.mass ?? 0);
    if (Array.isArray(w.feed)) h.feed = w.feed.map((f) => ({ ...f }));
  }
  for (let i = holes.length - 1; i >= 0; i--) {
    if (!seen.has(holes[i].id)) { fx({ t: "gone", id: holes[i].id }); holes.splice(i, 1); }
  }
}
