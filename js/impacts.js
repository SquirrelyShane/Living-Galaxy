/* LIVING GALAXY — what happens in the seconds after a rock connects.
 *
 * Before 0.3 a strike threw a random burst: N chunks in a cone off the crater,
 * sizes and speeds off Math.random, and the rock itself simply vanished. Now a
 * strike runs the asteroid generator's Impact Lab physics (vendored at
 * js/asteroidgen/impact.js and impact-sim.js), at game scale:
 *
 *   - the rogue's own body is grown (the same seed the canopy grew) and cut
 *     into solid Voronoi chunks (fracture.js)
 *   - the break-up is planned by specific energy against a size-dependent
 *     strength, nearest the contact first; every piece leaves with the rock's
 *     velocity, its tumble (ω × r) and an ejection kick that falls with mass
 *   - a rigid-body run integrates it: softened gravity toward the world, sphere
 *     contacts with restitution and friction, torque-free tumbling, secondary
 *     impacts that spray dust, and young pieces shedding grains off their spin
 *   - crust thrown off the world rides the same run
 *
 * The pieces ARE the salvage. Each one is a chunk in js/debris.js from the
 * first tick — the tractor can reel one, the cutter can eat one, a passing hole
 * can swallow one — but while the run holds it (`chunk.driven`) its position is
 * the run's, not the debris integrator's. When the run ends the chunks are let
 * go with the run's velocities, and whatever came to rest on the world rained
 * back down.
 *
 * Two rogues that meet run the same way with no world: both break, and the
 * biggest piece that is leaving fast enough becomes a rogue of its own — a
 * faceted fragment carrying its parent's class and a designation off its
 * parent's name, which is exactly the generator's own "send rogue" hand-off.
 *
 * Frames and units. A run lives in its own frame: centred on the struck world
 * (co-moving with its rail) or on the pair's centre of mass, in units of
 * `L` world units — chosen so the rogue's generated body sits at its own unit
 * radius, which is what fracture.js and impact.js were tuned for. Time is 1:1.
 * Gravity is set per run so the world's surface gravity in the run equals the
 * game's (`surfaceGravity`), because the Lab's one constant G would give a
 * gas giant three times the escape speed it has here.
 *
 * Headless. The renderer (js/impactfx.js) reads `runs` and draws the
 * fractured body, the ejecta and the flash; nothing here needs a GPU, and a
 * strike too far from the ship for anyone to see runs no physics at all — the
 * caller falls back to the old burst.
 */

import { generateBody, rogueParams, DETAIL } from "./bodygen/body.js";
import { CLASSES } from "./bodygen/classes.js";
import { fractureGeometry, eigen3 } from "./asteroidgen/fracture.js";
import { planImpact, planEjecta, samplePalette } from "./asteroidgen/impact.js";
import { ImpactSim, buildSimPieces, meshShape, ellipsoidInertia, quatToRows, SIM } from "./asteroidgen/impact-sim.js";
import { RNG, hashString, unitVec } from "./asteroidgen/rng.js";

export const IMPACTS = {
  maxLive: 2,
  seconds: 26,            // a run's length; the Lab loops at 34
  viewR: 320000,          // strikes further than this from the ship do not run
  chunks: 16,             // Voronoi chunks a rogue is cut into
  crust: 14,              // most crust pieces a world throws into a run
  detail: 8,              // cells per face for the fractured body
  stepsPerTick: 30,
  fragmentRogueR: 90,     // world units: a leaving piece this big becomes a rogue
};

/* Rogue class weights, the same shortlist the renderer uses for a rogue with
 * no class of its own (engine.js ROGUE_CLASSES) */
const ROGUE_CLASSES = ["S", "S", "S", "C", "C", "C", "M", "M", "X", "B", "V", "P", "D", "E"];
export const rogueClassOf = (m) => m.cls ?? ROGUE_CLASSES[Math.min(ROGUE_CLASSES.length - 1, Math.floor((m.seed ?? 0.5) * ROGUE_CLASSES.length))];

export const runs = [];
let seq = 1;

export function resetImpacts() {
  for (const r of runs) release(r, null);
  runs.length = 0;
  seq = 1;
}

/* ---- building the pieces ----------------------------------------------------- */

/** A rogue grown and cut, in its generator frame. */
function fracturedRogue(m, seedTag) {
  const cls = rogueClassOf(m);
  const built = generateBody(null, { ...rogueParams(m, cls), detail: IMPACTS.detail });
  const geometry = built.geometry;
  const shape = meshShape(geometry.attributes.position.array, eigen3);
  const fracture = fractureGeometry(geometry, { chunks: IMPACTS.chunks, seed: `${seedTag}:${m.id}`, morph: true });
  const palette = samplePalette(geometry.attributes.color.array, 32, `${seedTag}:${m.id}`);
  const avg = palette.reduce((s, c) => [s[0] + c[0] / palette.length, s[1] + c[1] / palette.length, s[2] + c[2] / palette.length], [0, 0, 0]);
  const suite = built.suite.map((r) => r.id);
  return { m, cls, built, geometry, shape, fracture, palette, avg, ore: built.headline ?? suite[0] ?? "iron_ore", suite, ice: built.iceAffinity ?? 0 };
}

function quatFrom(rng) {
  const a = unitVec(rng), ang = rng.range(0, Math.PI * 2);
  const s = Math.sin(ang / 2);
  return [a[0] * s, a[1] * s, a[2] * s, Math.cos(ang / 2)];
}

/* A body spec in the shape planImpact / buildSimPieces want. */
function rogueSpec(fr, pos, vel, rng) {
  const q = quatFrom(rng);
  const w = rng.range(0.15, 0.5);
  const ax = unitVec(rng);
  return {
    kind: "asteroid",
    seed: fr.m.id,
    classId: fr.cls,
    pos, vel, q, rot: quatToRows(q), spin: [ax[0] * w, ax[1] * w, ax[2] * w],
    mass: 1, scale: 1,
    radius: fr.built.asteroid.maxRadius * 0.9,
    strength: 1, reform: [1.0, 1.8],
    fracture: fr.fracture, shape: fr.shape, chunkShapes: null, ice: fr.ice,
    pieceColor: (k) => (k < 0 ? fr.avg : fr.fracture.colors[k] || fr.avg),
  };
}

/* ---- a rock on a world --------------------------------------------------------- */

/**
 * Run a strike. Returns the run, or null if it is too far to be worth running
 * (the caller then throws the old burst).
 *
 * p: { rogue, body, bodyPos, bodyVel, normal {nx,ny,nz}, speed, sev, gSurf,
 *      time, shipPos, addChunk(c) }
 */
export function startStrike(p) {
  const { rogue, body, bodyPos, bodyVel, normal: n } = p;
  if (!(rogue.r > 0)) return null; // L = 0 → NaN chunks; the caller throws the old burst
  const dShip = p.shipPos ? Math.hypot(p.shipPos.x - bodyPos.x, p.shipPos.y - bodyPos.y, p.shipPos.z - bodyPos.z) : 0;
  if (dShip > IMPACTS.viewR + body.radius) return null;
  /* evict the oldest for real: 0.3 released runs[0] but left it in the list, so the
   * next eviction hit the same ended run and the cap never capped (5 live, 17 ms a tick) */
  if (runs.length >= IMPACTS.maxLive) release(runs.shift(), null, true);

  const id = `ix${seq++}`;
  const seedTag = `${id}:${rogue.id ?? rogue.name}:${body.id}`;
  const rng = new RNG(hashString(seedTag));
  const fr = fracturedRogue(rogue, seedTag);
  /* L: world units per run unit, so the generated body's mean radius (the
   * generator normalises every shape to meshRadius) IS the rogue's radius */
  const L = rogue.r / fr.built.asteroid.meshRadius;
  const Rw = body.radius / L;
  const rRock = fr.built.asteroid.maxRadius * 0.9;

  /* the rogue touching the world along the strike normal, closing at its real
   * speed relative to the world's rail */
  const rel = [(rogue.vx ?? 0) - bodyVel.x, (rogue.vy ?? 0) - bodyVel.y, (rogue.vz ?? 0) - bodyVel.z];
  let vl = Math.hypot(rel[0], rel[1], rel[2]);
  if (vl < 1) { rel[0] = -n.nx * p.speed; rel[1] = -n.ny * p.speed; rel[2] = -n.nz * p.speed; vl = p.speed; }
  const posB = [n.nx * (Rw + rRock * 0.98), n.ny * (Rw + rRock * 0.98), n.nz * (Rw + rRock * 0.98)];
  const B = rogueSpec(fr, posB, [rel[0] / L, rel[1] / L, rel[2] / L], rng);

  /* the world: mass by volume against the rock (the rock is 1), a rocky world
   * denser than a gas one, and gravity set so its surface pull is the game's */
  const dens = body.kind === "gas" ? 0.25 : body.kind === "ice" ? 0.55 : 1;
  const Mw = Math.max(50, Math.pow(Rw / rRock, 3) * dens);
  const G = Math.max(1e-6, ((p.gSurf ?? 20) / L) * (Rw * Rw) / Mw);
  const A = {
    kind: "planet", seed: body.id, pos: [0, 0, 0], vel: [0, 0, 0], q: [0, 0, 0, 1], rot: quatToRows([0, 0, 0, 1]), spin: [0, 0, 0],
    mass: Mw, scale: 1, radius: Rw, strength: 1e9,
    fracture: { centroids: [[0, 0, 0]], counts: [1], colors: [[0.4, 0.37, 0.33]] },
    shape: { axes: [Rw, Rw, Rw], basis: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] }, ice: 0,
    pieceColor: () => [0.4, 0.37, 0.33],
  };
  const plan = planImpact(A, B, { speed: vl / L, seed: seedTag });
  /* the world does not fracture in a run — its crater, its ring and its
   * integrity are the cataclysm system's (sim.js damageBody). Its plan row is
   * replaced by an intact survivor. */
  plan.bodies[0] = { fraction: 0, detached: [], velPost: [0, 0, 0], spinPost: [0, 0, 0], massPost: Mw, totalChunks: 1 };
  const pieces = buildSimPieces(plan, [A, B]);
  const world = pieces.find((q) => q.body === 0 && q.kind === "survivor");
  if (world) { world.radius = Rw; world.shed = 0; world.inertia = ellipsoidInertia(Mw, [Rw, Rw, Rw]); }

  /* crust: thrown off the crater, on the same run, the world's colours */
  const crustN = Math.max(3, Math.min(IMPACTS.crust, Math.round(3 + (p.sev ?? 0.1) * 40)));
  const vEsc = Math.sqrt(2 * G * Mw / Rw);
  const up = [n.nx, n.ny, n.nz];
  const t1 = Math.abs(up[1]) < 0.9 ? norm(cross(up, [0, 1, 0])) : norm(cross(up, [1, 0, 0]));
  const t2 = cross(up, t1);
  const crustColor = p.crustColor ?? [0.42, 0.38, 0.33];
  for (let i = 0; i < crustN; i++) {
    const a = rng.range(0, Math.PI * 2), lift = rng.range(0.35, 1);
    const dir = norm([up[0] * lift + (t1[0] * Math.cos(a) + t2[0] * Math.sin(a)) * (1 - lift * 0.6), up[1] * lift + (t1[1] * Math.cos(a) + t2[1] * Math.sin(a)) * (1 - lift * 0.6), up[2] * lift + (t1[2] * Math.cos(a) + t2[2] * Math.sin(a)) * (1 - lift * 0.6)]);
    const rad = rRock * rng.range(0.12, 0.34);
    const off = rng.range(0, rRock * 0.6);
    const pos = [up[0] * (Rw + rad * 1.3) + t1[0] * Math.cos(a) * off + t2[0] * Math.sin(a) * off, up[1] * (Rw + rad * 1.3) + t1[1] * Math.cos(a) * off + t2[1] * Math.sin(a) * off, up[2] * (Rw + rad * 1.3) + t1[2] * Math.cos(a) * off + t2[2] * Math.sin(a) * off];
    const sp = vEsc * rng.range(0.25, 0.95) * Math.min(1.3, 0.5 + (p.sev ?? 0.1) * 3);
    const mass = Math.pow(rad / rRock, 3) * 0.8;
    const ax = unitVec(rng), w = rng.range(0.3, 1.4);
    pieces.push({
      kind: "fragment", body: 2, k: i, mass, radius: rad,
      pos, vel: [dir[0] * sp, dir[1] * sp, dir[2] * sp], q: quatFrom(rng), spin: [ax[0] * w, ax[1] * w, ax[2] * w],
      inertia: ellipsoidInertia(mass, [rad, rad * 0.8, rad * 0.65]),
      color: crustColor, ice: 0, heat: rng.range(0.4, 1), cool: rng.range(0.3, 0.6), seed: rng.next(), shed: 0.6, crust: true,
    });
  }

  const sim = new ImpactSim({ pieces, G, seed: seedTag, t: 0 });
  const ejecta = planEjecta(plan, fr.palette, [crustColor, crustColor], { dust: 900, sparks: 420, rocks: 110, seed: seedTag, ice: fr.ice });

  const run = {
    id, kind: "strike", seedTag, born: p.time ?? 0, age: 0, L, G,
    bodyId: body.id, frame: { x: bodyPos.x, y: bodyPos.y, z: bodyPos.z }, frameVel: { x: bodyVel.x, y: bodyVel.y, z: bodyVel.z },
    worldR: Rw, plan, sim, ejecta, rocks: [fr], contact: plan.contact, normal: plan.normal,
    impactPose: [{ pos: B.pos.slice(), q: B.q.slice() }],
    chunks: new Map(), ended: false, drawn: false,
  };
  bindChunks(run, p.addChunk, (P) => (P.crust ? body.oreId ?? "regolith" : fr.ore), (P) => (P.crust ? 0.35 : 0));
  runs.push(run);
  return run;
}

/* ---- two rocks ------------------------------------------------------------------- */

/**
 * Two rogues meet. p: { a, b, time, shipPos, addChunk(c) }. Returns the run or
 * null (too far to run — the caller removes both and throws a burst).
 */
export function startCollision(p) {
  const { a, b } = p;
  if (!(a.r > 0 && b.r > 0)) return null;
  const cx = (a.x * a.r ** 3 + b.x * b.r ** 3) / (a.r ** 3 + b.r ** 3);
  const cy = (a.y * a.r ** 3 + b.y * b.r ** 3) / (a.r ** 3 + b.r ** 3);
  const cz = (a.z * a.r ** 3 + b.z * b.r ** 3) / (a.r ** 3 + b.r ** 3);
  const dShip = p.shipPos ? Math.hypot(p.shipPos.x - cx, p.shipPos.y - cy, p.shipPos.z - cz) : 0;
  if (dShip > IMPACTS.viewR) return null;
  if (runs.length >= IMPACTS.maxLive) release(runs.shift(), null, true);

  const id = `ix${seq++}`;
  const seedTag = `${id}:${a.id}x${b.id}`;
  const rng = new RNG(hashString(seedTag));
  const fa = fracturedRogue(a, seedTag), fb = fracturedRogue(b, seedTag);
  const big = a.r >= b.r ? fa : fb;
  const L = big.m.r / big.built.asteroid.meshRadius;
  const ma = Math.pow(a.r / big.m.r, 3), mb = Math.pow(b.r / big.m.r, 3);
  const vcm = { x: (a.vx * ma + b.vx * mb) / (ma + mb), y: (a.vy * ma + b.vy * mb) / (ma + mb), z: (a.vz * ma + b.vz * mb) / (ma + mb) };
  const A = rogueSpec(fa, [(a.x - cx) / L, (a.y - cy) / L, (a.z - cz) / L], [(a.vx - vcm.x) / L, (a.vy - vcm.y) / L, (a.vz - vcm.z) / L], rng);
  const B = rogueSpec(fb, [(b.x - cx) / L, (b.y - cy) / L, (b.z - cz) / L], [(b.vx - vcm.x) / L, (b.vy - vcm.y) / L, (b.vz - vcm.z) / L], rng);
  A.mass = ma; A.scale = a.r / L / fa.built.asteroid.meshRadius; A.radius = fa.built.asteroid.maxRadius * 0.9 * A.scale;
  B.mass = mb; B.scale = b.r / L / fb.built.asteroid.meshRadius; B.radius = fb.built.asteroid.maxRadius * 0.9 * B.scale;
  const rel = Math.hypot(a.vx - b.vx, a.vy - b.vy, a.vz - b.vz) / L;
  const plan = planImpact(A, B, { speed: rel, seed: seedTag });
  const pieces = buildSimPieces(plan, [A, B]);
  /* self-gravity of a pair of mountains is real but slight at these speeds */
  const sim = new ImpactSim({ pieces, G: SIM.G * 0.08, seed: seedTag, t: 0 });
  const ejecta = planEjecta(plan, fa.palette, fb.palette, { dust: 900, sparks: 400, rocks: 120, seed: seedTag, ice: Math.max(fa.ice, fb.ice) });
  const run = {
    id, kind: "collision", seedTag, born: p.time ?? 0, age: 0, L, G: SIM.G * 0.08,
    bodyId: null, frame: { x: cx, y: cy, z: cz }, frameVel: vcm,
    worldR: 0, plan, sim, ejecta, rocks: [fa, fb], contact: plan.contact, normal: plan.normal,
    impactPose: [{ pos: A.pos.slice(), q: A.q.slice(), scale: A.scale }, { pos: B.pos.slice(), q: B.q.slice(), scale: B.scale }],
    chunks: new Map(), ended: false, drawn: false, parents: [a, b],
  };
  bindChunks(run, p.addChunk, (P) => run.rocks[P.body].ore, () => 0);
  runs.push(run);
  return run;
}

/* Every fragment is a chunk from the first tick. */
function bindChunks(run, addChunk, goodOf, tintOf) {
  if (!addChunk) return;
  run.sim.pieces.forEach((P, i) => {
    if (P.kind === "survivor" && run.kind === "strike") return;          // the world
    const r = P.radius * run.L;
    const c = addChunk({
      id: `${run.id}:${i}`,
      x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
      r, r0: r, spin: 0, seed: P.seed ?? 0.5, tint: tintOf(P), good: goodOf(P),
      parent: null, life: 0, hot: Math.min(1, P.heat ?? 0.4),
      driven: true, run: run.id, piece: i, fractured: P.kind === "fragment" && !P.crust ? P.body : null,
    });
    run.chunks.set(i, c);
  });
  place(run);
}

/* ---- stepping --------------------------------------------------------------------- */

const _p = { x: 0, y: 0, z: 0 };

/**
 * ctx: { time, bodyPosition(id,t,out), bodyVelocity(id,t,out), onRogue(m) }
 */
export function stepImpacts(dt, ctx = {}) {
  for (let i = runs.length - 1; i >= 0; i--) {
    const run = runs[i];
    run.age += dt;
    if (run.bodyId && ctx.bodyPosition) {
      ctx.bodyPosition(run.bodyId, ctx.time ?? 0, _p);
      run.frame.x = _p.x; run.frame.y = _p.y; run.frame.z = _p.z;
      if (ctx.bodyVelocity) { ctx.bodyVelocity(run.bodyId, ctx.time ?? 0, _p); run.frameVel.x = _p.x; run.frameVel.y = _p.y; run.frameVel.z = _p.z; }
    } else {
      run.frame.x += run.frameVel.x * dt; run.frame.y += run.frameVel.y * dt; run.frame.z += run.frameVel.z * dt;
    }
    run.sim.advance(Math.min(run.age, IMPACTS.seconds) + 2 * SIM.dt, IMPACTS.stepsPerTick);
    place(run);
    if (run.age >= IMPACTS.seconds) {
      release(run, ctx.onRogue ?? null);
      runs.splice(i, 1);
    }
  }
}

/* Chunks go where the run says their piece is. */
function place(run) {
  const L = run.L, f = run.frame, v = run.frameVel, s = run.sim;
  for (const [i, c] of run.chunks) {
    if (c.dead) { run.chunks.delete(i); continue; }
    const P = s.pieces[i];
    c.x = f.x + P.pos[0] * L; c.y = f.y + P.pos[1] * L; c.z = f.z + P.pos[2] * L;
    c.vx = v.x + P.vel[0] * L; c.vy = v.y + P.vel[1] * L; c.vz = v.z + P.vel[2] * L;
    c.hot = Math.max(0, Math.min(1.2, (P.heat ?? 0) * Math.exp(-run.age * (P.cool ?? 0.4)) + (P.heatBump ?? 0)));
  }
}

/**
 * A run ends: its chunks go back to the debris integrator with the run's
 * velocities. Anything resting on the struck world rained back down. From a
 * collision, the biggest piece leaving the pair fast enough is handed to
 * `onRogue` as a new rogue.
 */
function release(run, onRogue, early = false) {
  if (run.ended) return;
  run.ended = true;
  place(run);
  let heir = null;
  if (run.kind === "collision" && onRogue && !early) {
    const fates = run.sim.fates();
    for (const e of fates.escaping) {
      const P = run.sim.pieces[e.index];
      if (!P || P.kind !== "fragment") continue;
      const r = P.radius * run.L;
      if (r < IMPACTS.fragmentRogueR) continue;
      if (!heir || r > heir.r) heir = { P, r, index: e.index };
    }
  }
  for (const [i, c] of run.chunks) {
    c.driven = false;
    if (run.kind === "strike") {
      const P = run.sim.pieces[i];
      const d = Math.hypot(P.pos[0], P.pos[1], P.pos[2]);
      const speed = Math.hypot(P.vel[0], P.vel[1], P.vel[2]);
      /* on the ground and not going anywhere: it is part of the world again */
      if (d < run.worldR + P.radius * 1.6 && speed < 0.3) c.life = c.age + 0.01;
    }
  }
  if (heir) {
    const c = run.chunks.get(heir.index);
    const parent = run.parents[heir.P.body];
    if (c) { c.life = c.age + 0.01; }
    onRogue({
      name: `${parent.name} fragment`,
      r: heir.r,
      x: c?.x ?? run.frame.x, y: c?.y ?? run.frame.y, z: c?.z ?? run.frame.z,
      vx: c?.vx ?? run.frameVel.x, vy: c?.vy ?? run.frameVel.y, vz: c?.vz ?? run.frameVel.z,
      cls: rogueClassOf(parent), shape: "fragment",
      bodySeed: `${parent.bodySeed ?? `rogue:${parent.name || parent.id}`}-R${String(heir.P.k).padStart(2, "0")}`,
      seed: parent.seed ?? 0.5, spin: (parent.spin ?? 0.1) * 1.8,
    });
  }
  run.chunks.clear();
}

/* tiny vector helpers */
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function norm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

export { CLASSES };
