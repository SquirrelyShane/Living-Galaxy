/* LIVING GALAXY — collapsed stars.
 *
 * The rarest cataclysm in the sky, and the only one that moves. A black hole
 * here is a stellar remnant, and it arrives one of two ways:
 *
 *   TRANSIT   a neighbouring star collapses and the remnant is kicked out of
 *             its own system. Very occasionally one falls through this one on a
 *             straight, fast line — minutes from first flash to gone — and eats
 *             what it passes: a tunnel through the belt, any rogue that strays
 *             inside its tidal radius, loose debris, ports and hulls that do
 *             not get out of the way. A world it passes close enough to is torn
 *             apart by tides, and the pieces fall in. It pulls on everything
 *             that flies, the ship included.
 *   REMNANT   a star that goes supernova (js/cataclysm.js, `goSupernova`)
 *             collapses behind its own shock: once the plateau breaks, the core
 *             is a hole where the star was. It keeps the star's mass — the
 *             orbits do not change — but the light goes, and the disk that
 *             forms out of the fallback is what lights the system now.
 *
 * "Not common" is load-bearing. A transit is rolled once every ten minutes of
 * sky time, never in the first forty, never within three hours of the last one,
 * and at 5% a roll. Measured over 1,600 simulated hours: one every ~6 hours of
 * play, and an hour-long session sees one about one time in ten. In a shared
 * sky only the host rolls; the hole is on a straight line, so a mirror
 * dead-reckons it exactly.
 *
 * Units and radii. `rs` is the hole's Schwarzschild radius in world units, a
 * GAME number (a real one would be a few hundred units and invisible from
 * orbit), and every other radius is a multiple of it off the Kerr maths the
 * lens itself uses (js/asteroidgen/kerr.js), at the lens's spin:
 *
 *   horizon   r+ = M(1 + √(1−a²))           crossing it ends the hull
 *   burn      prograde ISCO                 matter inside burns into the disk
 *   roche     6 rs                          rocks and rogues shred inside this
 *   disk      13 rs                         the lensed disk's outer edge
 *   danger    9 rs                          what the avoidance solver keeps out of
 *
 * This module is headless: it knows about the sky through the context
 * `stepHoles` is handed, so nothing here imports the ship, the ports or the
 * renderer, and ship.js can import it for gravity without a cycle.
 */

import { horizon as kerrHorizon, isco as kerrIsco } from "./asteroidgen/kerr.js";

export const HOLE = {
  spin: 0.6,                  // a/M — the lens's Interstellar look; the radii follow it
  transitRs: [1500, 2300],
  /* ~1/3 of Sol's gravitational parameter: at 60 km it pulls 30 u/s² (a third
   * of a main engine), at 20 km 270 — more than any engine. You get out of the
   * way from far off, or you do not get out. */
  transitMu: 1.1e11,
  speed: [2200, 3200],        // u/s — a remnant with a natal kick
  spawnR: 720000,
  despawnR: 1100000,
  missShip: [110000, 240000], // how close a transit that is NOT aimed at a world passes you
  worldShare: 0.4,            // of transits, the share thrown at a world
  checkEvery: 600,            // s of sky time between rolls
  chance: 0.05,
  firstAfter: 2400,
  minGap: 10800,
  eatEvery: 0.25,             // s between eat passes (the belt query is not free)
  warpClear: 60,              // × rs: warp geometry does not hold inside this
  tidalRate: 0.18,            // integrity per second at twice the Roche depth
  maxFeed: 24,
};

export const holes = [];
/* What the renderer should see happen, drained by the engine. Bounded. */
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

/** Every radius a hole has, in world units. */
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

/**
 * Add every hole's pull at `pos` into `out` (x/y/z, accumulated — call after the
 * worlds). Softened by rs so a point inside the horizon does not divide by zero.
 * A REMNANT does not pull: the star it replaced is still in BODIES with the
 * same mass, and pulling twice would change every orbit in the sky.
 * Returns the strongest single acceleration added.
 */
export function holeAccel(pos, out) {
  let strongest = 0;
  for (const h of holes) {
    if (!h.gravity) continue;
    const dx = h.x - pos.x, dy = h.y - pos.y, dz = h.z - pos.z;
    const d2 = dx * dx + dy * dy + dz * dz;
    const soft = d2 + h.rs * h.rs;
    if (!(soft > 0)) continue; // a zero-size hole sat on the point: 0/0
    const a = h.mu / soft;
    const inv = a / Math.sqrt(soft);
    out.x += dx * inv;
    out.y += dy * inv;
    out.z += dz * inv;
    if (a > strongest) strongest = a;
  }
  return strongest;
}

/** The nearest hole to a point, with the distance and its radii; null if the sky has none. */
export function nearestHole(pos) {
  let best = null, bd = Infinity;
  for (const h of holes) {
    const d = Math.hypot(h.x - pos.x, h.y - pos.y, h.z - pos.z);
    if (d < bd) { bd = d; best = h; }
  }
  return best ? { hole: best, dist: bd, radii: holeRadii(best, {}) } : null;
}

/** Why the warp core will not hold near a hole, or "". */
export function holeWarpBlock(pos) {
  for (const h of holes) {
    const d = Math.hypot(h.x - pos.x, h.y - pos.y, h.z - pos.z);
    if (d < h.rs * HOLE.warpClear) return `${h.name.toUpperCase()} · SPACETIME SHEAR · ${Math.round((h.rs * HOLE.warpClear - d) / 100)} km OUT`;
  }
  return "";
}

/* Accreted mass is remembered by where it went in: the lens turns these into
 * rings (asteroidgen/blackhole.js buildRings), so a hole that ate a rogue on
 * its way through has a bright band at the radius the rogue burned. */
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

/** A rock of radius r (world units) as disk mass: a 1 km body is 1. */
export const massOf = (r) => Math.pow(Math.max(1, r) / 1000, 3);

function nameHole(rng) {
  const L = "ABCDEFGHJKLMNPRSTVWXYZ";
  const a = L[Math.floor(rng() * L.length)], b = L[Math.floor(rng() * L.length)];
  return `Collapsar ${a}${b}-${100 + Math.floor(rng() * 900)}`;
}

/**
 * A remnant falls through. `aimAt` is an optional world ({ body, pos }) to pass
 * inside the tidal radius of; otherwise the line misses the ship by a
 * survivable margin. Returns the hole.
 */
export function spawnTransit({ ship, rng = Math.random, time = 0, aimAt = null, rs = null, speed = null } = {}) {
  const r = rs ?? HOLE.transitRs[0] + rng() * (HOLE.transitRs[1] - HOLE.transitRs[0]);
  const v = speed ?? HOLE.speed[0] + rng() * (HOLE.speed[1] - HOLE.speed[0]);
  /* mostly in the ecliptic, where the things worth eating are */
  const az = rng() * Math.PI * 2;
  const el = (rng() - 0.5) * 0.35;
  const dir = { x: Math.cos(el) * Math.cos(az), y: Math.sin(el), z: Math.cos(el) * Math.sin(az) };
  let aim;
  if (aimAt) {
    /* offset the line perpendicular to its heading so it passes at `aimAt.pass` */
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
    /* a remnant arrives with a little of its old system still around it, so
     * the disk is faint but there before it has eaten anything here */
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

/**
 * A star has gone supernova and its core has fallen in. The hole takes the
 * star's place and its mass; the fallback gives it a bright disk from the start.
 */
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

/** Should the sky roll a transit now? Host only; see the rarity note at the top. */
export function rollTransit(dt, time, rng = Math.random) {
  clock += dt;
  if (clock < nextRoll) return false;
  nextRoll = clock + HOLE.checkEvery;
  if (holes.some((h) => h.kind === "transit")) return false;
  if (time - lastBirth < HOLE.minGap) return false;
  return rng() < HOLE.chance;
}

/* scratch */
const _p = { x: 0, y: 0, z: 0 };
const _n = { nx: 0, ny: 0, nz: 0 };
let eatAcc = 0;

/**
 * Step every hole: move it, feed it, and apply what it does to the sky.
 *
 * ctx (all optional except `time`):
 *   authority          only the host removes rogues, damages worlds, loses ports, rolls transits
 *   ship               { pos, vel }
 *   bodies, bodyPosition
 *   impactors          the live rogue list (spliced on capture)
 *   chunks, removeChunk
 *   stations, loseStation(st, hole), rakeStation(st, hole, frac)
 *   contacts           hulls with hp — eaten inside the capture radius
 *   rocksNear(pos, span), eatRocks(keys), inBelt(pos)
 *   damageBody(body, sev, n, r, speed)
 *   onShip(hole, zone, dist, dt)   zone: "horizon" | "burn" | "roche"
 *   log(text), rng()
 */
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

    /* the ship, every tick: this is the one that has to be exact */
    if (ctx.ship && ctx.onShip) {
      const d = Math.hypot(ctx.ship.pos.x - h.x, ctx.ship.pos.y - h.y, ctx.ship.pos.z - h.z);
      if (d < R.horizon * 1.05) ctx.onShip(h, "horizon", d, dt);
      else if (d < R.burn) ctx.onShip(h, "burn", d, dt);
      else if (d < R.roche) ctx.onShip(h, "roche", d, dt);
    }

    /* a transit that has gone by leaves */
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

    /* belt rocks: a tunnel. Only the host's field query decides, but rocks are
     * a pure function of the cell, so a mirror eating them too agrees. */
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

    /* rogues: shredded inside the tidal radius */
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

    /* loose debris falls in and burns; inside the tidal radius it is already hot */
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

    /* hulls with hit points: nothing gets out from under the horizon */
    if (ctx.contacts && ctx.authority !== false) {
      for (const c of ctx.contacts) {
        if (!(c.hp > 0)) continue;
        const d = Math.hypot(c.x - h.x, c.y - h.y, c.z - h.z);
        if (d < R.burn) { c.hp = 0; c.eaten = true; ctx.log?.(`${c.name} fell into ${h.name}`, "impact"); }
        else if (d < R.roche) c.hp -= edt * 12 * (1 - d / R.roche);
      }
    }

    /* ports: lost inside the burn radius, raked inside the tidal one */
    if (ctx.stations && ctx.authority !== false) {
      for (let j = ctx.stations.length - 1; j >= 0; j--) {
        const st = ctx.stations[j];
        if (st.x === undefined) continue;
        const d = Math.hypot(st.x - h.x, st.y - h.y, st.z - h.z);
        if (d < R.burn * 1.6) { h.eaten.ports++; ctx.loseStation?.(st, h); }
        else if (d < R.roche * 1.5 && (st.rakedBy ?? null) !== h.id) { st.rakedBy = h.id; ctx.rakeStation?.(st, h, 1 - d / (R.roche * 1.5)); }
      }
    }

    /* worlds: tides. The Roche distance for a point mass against a world of
     * radius Rw and parameter μw is Rw·∛(2μh/μw) — a hole a third of a star
     * reaches ~25 km around an Earth and ~33 km around a Jupiter. Inside it the
     * world loses integrity every second, faster the deeper; what comes off is
     * thrown toward the hole and falls in. */
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

/* A transit thrown at a world picks one near the ship, so it happens where
 * somebody can see it. */
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
  /* the world keeps moving on its rail while the hole flies in; aim where it
   * will be, near enough, by leading it by the flight time */
  return { body: t.b, pos: t.pos, pass: Math.max(t.b.radius * 1.3, dR * (0.45 + rng() * 0.25)) };
}

/* ---- the wire --------------------------------------------------------------- */

export function holeWire() {
  return holes.map((h) => ({
    id: h.id, name: h.name, kind: h.kind, starId: h.starId ?? null,
    x: Math.round(h.x), y: Math.round(h.y), z: Math.round(h.z),
    vx: h.vx, vy: h.vy, vz: h.vz, rs: h.rs, mu: h.mu, spin: h.spin, gravity: h.gravity,
    mass: h.mass, feed: h.feed.map((f) => ({ r: Math.round(f.r), mass: f.mass })), born: h.born, target: h.target ?? null,
  }));
}

/** Mirror the host's holes: keep by id (smooth), add new, drop gone. */
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
