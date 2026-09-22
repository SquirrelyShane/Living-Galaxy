/* LIVING GALAXY 0.3 — the asteroid generator in the game: bodies, impacts, collapsed stars.
 *
 *   node --import ./test/three-register.mjs test/asteroids.test.mjs
 *
 * What this pins, by behaviour:
 *   1. the vendored generator answers from the game's one mineral list
 *   2. a grown body: seven shapes, determinism, detail levels, the assay agreeing
 *      with the canopy, the grade model, outcrops
 *   3. the shader patches the renderer depends on are actually in the text
 *   4. an impact run: pieces are chunks, held and let go, momentum sane, crust
 *      thrown, and a rock-on-rock collision leaving a fragment rogue
 *   5. holes: Kerr radii, gravity, warp shear, rarity, the belt tunnel, rogues
 *      shredded, debris burned, a world torn by tides, a star collapsing, the wire
 *   6. the avoidance solver sees a hole
 */

import { ORES as GAME_ORES } from "../js/materials.js";
import { CLASSES, CLASS_IDS } from "../js/bodygen/classes.js";
import { ORES as GEN_ORES, ASTEROID_CLASSES } from "../js/asteroidgen/ores.js";
import { generateBody, assayRock, rockParams, rogueParams, DETAIL, faceCount, SHAPE_KINDS, MESH_RADIUS } from "../js/bodygen/body.js";
import { patchGeneratorShaders } from "../js/bodygen/gl.js";
import { SHADERS } from "../js/asteroidgen/debris.js";
import { IMPACT_SHADERS } from "../js/asteroidgen/impact-shaders.js";
import { horizon as kerrHorizon, isco as kerrIsco } from "../js/asteroidgen/kerr.js";
import { HOLE, holes, holeRadii, holeAccel, holeWarpBlock, rollTransit, resetHoles, spawnTransit, collapseStar, holeWire, adoptHoles, stepHoles, massOf } from "../js/holes.js";
import { IMPACTS, runs, resetImpacts, startStrike, startCollision, stepImpacts } from "../js/impacts.js";
import { chunks, addChunk, resetDebris } from "../js/debris.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

/* ---- 1. one mineral list ---------------------------------------------------- */
{
  ok(GAME_ORES.every((o) => GEN_ORES[o.id]), "every game ore is in the generator's catalogue");
  ok(Object.keys(GEN_ORES).length === GAME_ORES.length, `and nothing else is (${Object.keys(GEN_ORES).length} of ${GAME_ORES.length}) — no kamacite, no chalcopyrite`);
  ok(Object.values(GEN_ORES).every((o) => Number.isFinite(o.color) && o.metalness >= 0 && o.roughness > 0 && o.rarity > 0 && o.rarity < 1 && typeof o.category === "string"), "each carries the fields the generator reads");
  ok(CLASS_IDS.every((c) => ASTEROID_CLASSES[c]?.ores === CLASSES[c].ores), "the nine classes are the game's tables, by reference");
  ok(CLASS_IDS.every((c) => Object.keys(CLASSES[c].ores).every((id) => GEN_ORES[id])), "every class weight names a real ore");
  ok(CLASS_IDS.every((c) => CLASSES[c].grade > 0.3 && CLASSES[c].grade < 0.9), "every class has a bulk grade");
  ok(CLASSES.M.grade > CLASSES.S.grade && CLASSES.S.grade > CLASSES.P.grade, "a metal core is more ore than a stony chondrite, which is more than a primitive body");
}

/* ---- 2. a grown body --------------------------------------------------------- */
{
  const shapes = new Set();
  for (let i = 0; i < 48; i++) shapes.add(generateBody(null, { ...rockParams({ key: `shape:${i}`, cls: CLASS_IDS[i % 9], r: 200 }), detail: DETAIL.far }).shape);
  ok(shapes.size === SHAPE_KINDS.length, `all seven body kinds turn up over 48 rocks (${[...shapes].join(", ")})`);

  const rock = { key: "3|0|-2|4", cls: "M", r: 320, rich: true, ore: "nickel_ore" };
  const a = generateBody(null, { ...rockParams(rock), detail: DETAIL.near });
  const b = generateBody(null, { ...rockParams(rock), detail: DETAIL.near });
  ok(a.shape === b.shape && a.triangles === b.triangles && JSON.stringify(a.composition) === JSON.stringify(b.composition), "a rock is the same rock every time");
  ok(a.triangles === faceCount(DETAIL.near), `the triangle count is the cube-sphere's own (${a.triangles})`);
  ok(Math.abs(a.scale * MESH_RADIUS - rock.r) < 1e-6, "scale puts the unit-frame body at the rock's radius");
  ok(faceCount(DETAIL.placeholder) < faceCount(DETAIL.far) && faceCount(DETAIL.far) < faceCount(DETAIL.near) && faceCount(DETAIL.near) < faceCount(DETAIL.high), "detail levels climb");
  const attrs = Object.keys(a.geometry.attributes);
  ok(["position", "normal", "color", "aMetal", "aRough", "aEmit"].every((k) => attrs.includes(k)), `per-vertex PBR attributes ride the geometry (${attrs.join(", ")})`);

  /* the card and the canopy */
  const card = assayRock(rock);
  ok(card.cls === a.cls && card.shape === a.shape, `the card names the same class and body kind as the canopy (${card.cls}, ${card.shapeLabel})`);
  ok(card.headline === rock.ore, `the card's headline is the ore the cutter will put in the hold (${card.headline})`);
  ok(Math.abs(card.oreFrac - a.oreFrac) < 1e-9, "the grade does not depend on the sample");
  ok(card.suite.length >= 3 && card.suite.every((r) => r.pct > 0), `a suite, not a single ore (${card.suite.length})`);
  const ice = generateBody(null, { ...rockParams({ key: "ice:1", cls: "D", r: 250 }), detail: DETAIL.near });
  const metal = generateBody(null, { ...rockParams({ key: "ice:1", cls: "M", r: 250 }), detail: DETAIL.near });
  ok(ice.iceAffinity > 0.5 && metal.iceAffinity === 0, `a Trojan carries frost and a core does not (${ice.iceAffinity.toFixed(2)} vs ${metal.iceAffinity})`);
  ok(ice.frostPct > metal.frostPct, `and the frost shows in the cold traps (${ice.frostPct.toFixed(1)}%)`);
  let surface = 0;
  for (let i = 0; i < 12; i++) surface += generateBody(null, { ...rockParams({ key: `sf:${i}`, cls: CLASS_IDS[i % 9], r: 200 }), detail: DETAIL.near }).surfaceFrac;
  surface /= 12;
  ok(surface > 0.06 && surface < 0.3, `seams show on the surface without swallowing it (${(surface * 100).toFixed(1)}% of vertices)`);
  const outcrops = [0, 1, 2, 3, 4, 5].reduce((n, i) => n + generateBody(null, { ...rockParams({ key: `oc:${i}`, cls: "M", r: 200 }), detail: DETAIL.near }).outcrops.length, 0);
  ok(outcrops > 6, `metal seams break the surface as outcrops (${outcrops} over six M-types)`);

  const rogue = generateBody(null, { ...rogueParams({ id: "r1", name: "Grey Sister", r: 900, seed: 0.3, shape: "fragment" }, "S"), detail: DETAIL.near });
  ok(rogue.shape === "fragment", "a rogue born from a collision is a faceted fragment");
}

/* ---- 3. shader patches ------------------------------------------------------- */
{
  patchGeneratorShaders();
  patchGeneratorShaders();
  ok(SHADERS.solidVertex.includes("logdepthbuf_vertex") && SHADERS.rockFragment.includes("logdepthbuf_fragment"), "debris shaders write logarithmic depth");
  ok((SHADERS.solidVertex.match(/logdepthbuf_vertex/g) ?? []).length === 1, "patching twice patches once");
  ok(SHADERS.solidVertex.includes("offset * vis * uFade") && SHADERS.pointsVertex.includes("uFade"), "a field can be let go (uFade)");
  ok(IMPACT_SHADERS.bodyVertex.includes("logdepthbuf_vertex") && IMPACT_SHADERS.spriteFragment.includes("logdepthbuf_fragment"), "Impact Lab shaders write logarithmic depth");
}

/* ---- 4. impact runs ------------------------------------------------------------ */
{
  resetDebris();
  resetImpacts();
  const body = { id: "w1", name: "Testworld", kind: "rocky", radius: 1800, oreId: "iron_ore" };
  const rogue = { id: "imp9", name: "Blind Anvil", r: 700, x: 1800 + 700, y: 0, z: 0, vx: -650, vy: 30, vz: 0, seed: 0.4 };
  const run = startStrike({
    rogue, body, bodyPos: { x: 0, y: 0, z: 0 }, bodyVel: { x: 0, y: 0, z: 0 }, normal: { nx: 1, ny: 0, nz: 0 },
    speed: 650, sev: 0.2, gSurf: 25, time: 0, shipPos: { x: 9000, y: 0, z: 0 }, addChunk,
  });
  ok(run && runs.length === 1, "a strike in view runs");
  const far = startStrike({ rogue: { ...rogue, id: "imp10" }, body, bodyPos: { x: 0, y: 0, z: 0 }, bodyVel: { x: 0, y: 0, z: 0 }, normal: { nx: 1, ny: 0, nz: 0 }, speed: 650, sev: 0.2, gSurf: 25, shipPos: { x: IMPACTS.viewR * 3, y: 0, z: 0 }, addChunk });
  ok(far === null, "a strike nobody can see does not");
  const frag = run.sim.pieces.filter((P) => P.kind === "fragment" && !P.crust);
  const crust = run.sim.pieces.filter((P) => P.crust);
  ok(frag.length >= IMPACTS.chunks * 0.6, `the rock breaks into its chunks (${frag.length})`);
  ok(crust.length >= 3, `and the world throws crust (${crust.length})`);
  ok(chunks.length === frag.length + crust.length && chunks.every((c) => c.driven), "every piece is a debris chunk from the first tick, held by the run");
  ok(chunks.some((c) => c.good === "iron_ore" && c.tint > 0), "crust carries the world's ore");
  const g0 = chunks[0];
  const p0 = { x: g0.x, y: g0.y, z: g0.z };
  let steps = 0;
  const t0 = performance.now();
  for (let t = 0; t < 4; t += 0.05) { stepImpacts(0.05, { time: t }); steps++; }
  const ms = (performance.now() - t0) / steps;
  ok(Math.hypot(g0.x - p0.x, g0.y - p0.y, g0.z - p0.z) > 5, "a held chunk moves where its piece goes");
  ok(ms < 6, `a run costs a few ms a tick, not a frame (${ms.toFixed(2)} ms)`);
  const out = frag.filter((P) => Math.hypot(...P.pos) > run.worldR + P.radius * 2);
  ok(out.length > 0, `pieces leave the crater (${out.length} clear of the surface after 4 s)`);
  ok(run.sim.pieces.filter((P) => P.kind === "fragment").every((P) => Math.hypot(...P.pos) > run.worldR * 0.9), "and none tunnel into the world");
  ok(run.sim.events.length > 0, `secondary impacts happen (${run.sim.events.length})`);
  for (let t = 4; t < IMPACTS.seconds + 1; t += 0.1) stepImpacts(0.1, { time: t });
  ok(runs.length === 0, "the run ends");
  ok(chunks.every((c) => !c.driven), "and lets its chunks go to the debris integrator");
  ok(chunks.some((c) => Math.hypot(c.vx, c.vy, c.vz) > 1), "with the run's velocities");

  /* rock on rock */
  resetDebris();
  resetImpacts();
  const A = { id: "impA", name: "Ossuary", r: 900, x: -950, y: 0, z: 0, vx: 900, vy: 0, vz: 0, seed: 0.2 };
  const B = { id: "impB", name: "Grey Sister", r: 420, x: 450, y: 60, z: 0, vx: -1400, vy: 0, vz: 0, seed: 0.7 };
  const born = [];
  const crun = startCollision({ a: A, b: B, time: 0, shipPos: { x: 0, y: 20000, z: 0 }, addChunk });
  ok(crun && crun.rocks.length === 2, "two rogues that meet both run");
  ok(crun.plan.bodies.every((pb) => pb.detached.length > 0), `both break (${crun.plan.bodies.map((pb) => `${Math.round(pb.fraction * 100)}%`).join(" / ")})`);
  const P0 = crun.sim.momentum();
  for (let t = 0; t < IMPACTS.seconds + 1; t += 0.1) {
    if (t < 6) { const P = crun.sim.momentum(); ok(Math.abs(P[0] - P0[0]) < 1e-6 * Math.max(1, Math.abs(P0[0])), "momentum closes through the run"); }
    stepImpacts(0.1, { time: t, onRogue: (m) => born.push(m) });
  }
  ok(born.length <= 1, "at most one heir");
  if (born.length) {
    ok(born[0].shape === "fragment" && born[0].r >= IMPACTS.fragmentRogueR && /fragment/.test(born[0].name), `the biggest piece leaving becomes a rogue (${born[0].name}, ${Math.round(born[0].r)} u)`);
    ok(born[0].bodySeed.includes("-R"), "with a designation off its parent's seed");
  } else console.log("  --  no piece left fast and big enough at this seed; heir path not exercised");
}

/* ---- 5. holes ------------------------------------------------------------------ */
{
  resetHoles();
  resetDebris();
  const ship = { pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 } };
  const h = spawnTransit({ ship, rng: () => 0.5, time: 0, rs: 2000, speed: 2500 });
  const R = holeRadii(h, {});
  ok(Math.abs(R.horizon - kerrHorizon(0.6) * 1000) < 1e-6 && Math.abs(R.burn - kerrIsco(0.6) * 1000) < 1e-6, `radii are the lens's Kerr radii at a = 0.6 (horizon ${Math.round(R.horizon)}, ISCO ${Math.round(R.burn)})`);
  ok(R.horizon < R.burn && R.burn < R.roche && R.roche < R.danger && R.danger < R.disk, "and they nest");
  const g = { x: 0, y: 0, z: 0 };
  h.x = 60000; h.y = 0; h.z = 0;
  const a60 = holeAccel({ x: 0, y: 0, z: 0 }, g);
  ok(a60 > 15 && a60 < 60 && g.x > 0, `it pulls: ${a60.toFixed(1)} u/s² at 60 km, toward it`);
  h.x = 20000;
  g.x = 0;
  const a20 = holeAccel({ x: 0, y: 0, z: 0 }, g);
  ok(a20 > 88, `and at 20 km no engine out-pulls it (${a20.toFixed(0)} u/s²)`);
  ok(holeWarpBlock({ x: 0, y: 0, z: 0 }).includes("SHEAR"), "warp does not hold near it");
  h.x = 1e7;
  ok(holeWarpBlock({ x: 0, y: 0, z: 0 }) === "", "and does far away");
  resetHoles();

  /* rarity: ten sessions of five hours each, real dice */
  let births = 0;
  for (let s = 0; s < 10; s++) {
    resetHoles();
    let time = 0;
    for (let i = 0; i < 5 * 3600; i++) {
      time += 1;
      if (rollTransit(1, time)) { births++; spawnTransit({ ship, time }); holes.length = 0; }
    }
  }
  ok(births >= 1 && births <= 14, `not common: ${births} transits over 50 hours of sky`);
  resetHoles();

  /* the belt tunnel, a rogue, debris, a port, a world */
  const rocks = [];
  for (let i = 0; i < 40; i++) rocks.push({ key: `k${i}`, x: -20000 + i * 1000, y: 0, z: (i % 3) * 3000, r: 100 + i * 5, ore: "iron_ore", cls: "S", seed: i / 40 });
  const eaten = new Set();
  const impactorsList = [{ id: "impZ", name: "Stray", r: 600, x: 4000, y: 0, z: 0, vx: 0, vy: 0, vz: 0, seed: 0.5 }, { id: "impFar", name: "Safe", r: 600, x: 400000, y: 0, z: 0 }];
  const chunkList = [{ x: 1500, y: 0, z: 0, r: 20 }, { x: 8000, y: 0, z: 0, r: 20 }, { x: 900000, y: 0, z: 0, r: 20 }];
  const world = { id: "wT", name: "Tidal", kind: "rocky", radius: 1700, mu: 25 * 1700 * 1700, integrity: 1 };
  let damaged = 0;
  const lost = [];
  const logs = [];
  const hole = spawnTransit({ ship, rng: () => 0.5, time: 0, rs: 2000, speed: 0 });
  hole.x = 0; hole.y = 0; hole.z = 0; hole.vx = hole.vy = hole.vz = 0;
  const ctx = {
    time: 0, authority: true, ship: { pos: { x: 500000, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 } },
    bodies: [world], bodyPosition: (id, t, out) => { out.x = 12000; out.y = 0; out.z = 0; return out; },
    impactors: impactorsList, chunks: chunkList,
    stations: [{ id: "p1", name: "Near Port", x: 3000, y: 0, z: 0 }, { id: "p2", name: "Far Port", x: 300000, y: 0, z: 0 }],
    rocksNear: () => rocks, eatRocks: (keys) => keys.forEach((k) => eaten.add(k)), inBelt: () => true,
    damageBody: (b, sev) => { damaged += sev; b.integrity -= sev; },
    loseStation: (st) => lost.push(st.id), rakeStation: () => {},
    log: (t) => logs.push(t), rng: () => 0.99,
  };
  const mass0 = hole.mass;
  for (let i = 0; i < 40; i++) { ctx.time += 0.25; stepHoles(0.25, ctx); }
  const inRoche = rocks.filter((k) => Math.hypot(k.x, k.y, k.z) <= R.roche + k.r).length;
  ok(eaten.size === inRoche && eaten.size > 5, `rocks inside the tidal radius are eaten, and only those (${eaten.size} of ${rocks.length})`);
  ok(!impactorsList.some((m) => m.id === "impZ") && impactorsList.some((m) => m.id === "impFar"), "a rogue inside the tidal radius is shredded; one outside is not");
  ok(chunkList.length === 2 && chunkList.some((c) => c.hot > 0), "debris inside the burn radius is burned; inside the tidal radius it glows");
  ok(lost.includes("p1") && !lost.includes("p2"), "a port inside the burn radius is lost");
  ok(damaged > 0.05 && world.integrity < 1, `a world inside its Roche limit is torn at (${damaged.toFixed(2)} integrity in 10 s)`);
  ok(hole.mass > mass0 && hole.feed.length >= 2, `and the disk is fed by what fell in (mass ${mass0} → ${hole.mass.toFixed(2)}, ${hole.feed.length} rings)`);
  ok(hole.feed.every((f) => f.r >= R.burn && f.r <= R.disk), "at radii inside the disk");
  ok(Math.abs(massOf(1000) - 1) < 1e-12, "a kilometre rock is one unit of disk mass");

  /* the ship's zones */
  const zones = [];
  ctx.onShip = (_h, zone) => zones.push(zone);
  for (const d of [R.horizon * 0.5, R.burn * 0.9, R.roche * 0.9, R.roche * 3]) { ctx.ship.pos.x = d; stepHoles(0.01, ctx); }
  ok(zones.join(",") === "horizon,burn,roche", `the ship feels horizon, burn and tides, and nothing further out (${zones.join(",")})`);

  /* a transit that has gone by leaves */
  hole.vx = 3000; hole.x = 0; ctx.ship.pos.x = -HOLE.despawnR * 1.2; ctx.onShip = null;
  stepHoles(0.1, ctx);
  ok(!holes.includes(hole), "a transit that has passed and is far away leaves the sky");

  /* the wire */
  resetHoles();
  const wh = spawnTransit({ ship, rng: () => 0.3, time: 5, rs: 1800 });
  const wire = JSON.parse(JSON.stringify(holeWire()));
  resetHoles();
  adoptHoles(wire);
  ok(holes.length === 1 && holes[0].id === wh.id && holes[0].rs === 1800 && holes[0].feed.length === wh.feed.length, "a mirror adopts the host's hole whole");
  adoptHoles([]);
  ok(holes.length === 0, "and drops it when the host does");

  /* a star falls in */
  resetHoles();
  const star = { id: "sun", name: "Sol", kind: "star", radius: 26776, mu: 3.1e11 };
  const rem = collapseStar(star, { x: 0, y: 0, z: 0 }, 80);
  ok(rem && rem.kind === "remnant" && star.collapsed && !rem.gravity, "a collapsed star leaves a remnant that does not pull twice");
  ok(rem.mu === star.mu, "with the star's own mass");
  ok(rem.mass > 1 && rem.feed.length >= 3, "and a bright fallback disk from the start");
  ok(collapseStar(star, { x: 0, y: 0, z: 0 }, 81) === null, "once");
  const g2 = { x: 0, y: 0, z: 0 };
  ok(holeAccel({ x: 50000, y: 0, z: 0 }, g2) === 0, "no extra pull from a remnant");
  resetHoles();
}

/* ---- 6. the solver sees one ------------------------------------------------------ */
{
  const { threatTo } = await import("../js/avoid.js");
  resetHoles();
  const ship = { pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 } };
  const h = spawnTransit({ ship, rng: () => 0.5, time: 0, rs: 2000, speed: 0 });
  h.x = 0; h.y = 0; h.z = -60000; h.vx = h.vy = h.vz = 0;
  const t = threatTo({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -3000 }, { time: 0, includeRocks: false });
  ok(t && t.id === h.id, `a hull flying at a hole sees it as the threat (${t?.name})`);
  resetHoles();
}

/* ---- 7. in the sim --------------------------------------------------------------- */
{
  const { sim, launchSim, tickSim, summonHole, warpBlock, goSupernova } = await import("../js/sim.js");
  const { makePilot } = await import("../js/pilot.js");
  const { impactors } = await import("../js/impactors.js");
  const { gnn } = await import("../js/gnn.js");
  const { bodyById: liveBody, bodyPosition, bodyVelocity, starBody } = await import("../js/bodies.js");
  const { chunks: liveChunks } = await import("../js/debris.js");
  makePilot("Rocks", "terran", "mining", null);
  launchSim("RockTest", "sol");
  sim.phase = "play";

  /* a rogue on Earth runs the physics, and the crater is still the cataclysm system's */
  const earth = liveBody("earth");
  const ep = bodyPosition("earth", sim.time, { x: 0, y: 0, z: 0 }), ev = bodyVelocity("earth", sim.time, { x: 0, y: 0, z: 0 });
  sim.ship.pos = { x: ep.x + 30000, y: ep.y, z: ep.z };
  sim.ship.vel = { ...ev };
  impactors.length = 0;
  impactors.push({ id: "impE", name: "Test Rock", r: 800, x: ep.x + earth.radius + 5000, y: ep.y, z: ep.z, vx: ev.x - 900, vy: ev.y, vz: ev.z, seed: 0.3, spin: 0.1, born: sim.time, deflected: 0 });
  const craters0 = earth.craters.length;
  let started = false;
  for (let i = 0; i < 160 && !started; i++) { tickSim(0.05); started = runs.length > 0; }
  ok(started, "a rogue striking a world in view starts an impact run");
  ok(earth.craters.length === craters0 + 1, "and the world still takes its crater");
  ok(liveChunks.some((c) => c.driven && c.run === runs[0]?.id), "the run's pieces are in the debris list");

  /* rock on rock, through the sim's own collision check */
  resetImpacts();
  impactors.length = 0;
  const base = { x: ep.x + 90000, y: ep.y + 30000, z: ep.z };
  impactors.push({ id: "impP", name: "Pair One", r: 700, x: base.x - 2500, y: base.y, z: base.z, vx: 700, vy: 0, vz: 0, seed: 0.2, spin: 0.1, born: sim.time - 10, deflected: 0 });
  impactors.push({ id: "impQ", name: "Pair Two", r: 500, x: base.x + 2500, y: base.y + 200, z: base.z, vx: -800, vy: 0, vz: 0, seed: 0.7, spin: 0.1, born: sim.time - 10, deflected: 0 });
  sim.ship.pos = { x: base.x, y: base.y + 25000, z: base.z };
  const posts0 = gnn.posts.length;
  let coll = false;
  for (let i = 0; i < 120 && !coll; i++) { tickSim(0.05); coll = runs.some((r) => r.kind === "collision"); }
  ok(coll && !impactors.some((m) => m.id === "impP" || m.id === "impQ"), "two rogues that meet in the sim break up in a collision run");
  ok(gnn.posts.slice(posts0).some((p) => p.title === "ROCK ON ROCK"), "and the news desk says so");

  /* a transit through the sky */
  sim.ship.pos = { x: 2.2e6, y: 0, z: 0 };
  sim.ship.vel = { x: 0, y: 0, z: 0 };
  const h = summonHole({ at: { x: 2.2e6 + 90000, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 } });
  tickSim(0.05);
  ok(Math.hypot(sim.ship.gAccel.x, sim.ship.gAccel.y, sim.ship.gAccel.z) > 10, `the ship feels it (${Math.hypot(sim.ship.gAccel.x, sim.ship.gAccel.y, sim.ship.gAccel.z).toFixed(1)} u/s²)`);
  ok(/SHEAR/.test(warpBlock("earth")), `and the core will not hold (${warpBlock("earth")})`);
  ok(sim.holeWatch && sim.holeWatch.id === h.id, "the dash is watching it");
  ok(gnn.posts.some((p) => p.title === "COLLAPSAR INBOUND"), "and the news desk has it");
  ok(/long-range|pulling|NOW/.test(sim.notice ?? ""), `the pilot is told (${(sim.notice ?? "").slice(0, 60)}…)`);
  holes.length = 0;

  /* a star goes supernova and collapses */
  const star = starBody();
  sim.events.length = 0;
  goSupernova(star.id);
  for (let i = 0; i < 780; i++) tickSim(0.1);
  ok(star.collapsed && holes.some((x) => x.kind === "remnant" && x.starId === star.id), "a supernova's core collapses into a remnant once the plateau breaks");
  ok(gnn.posts.some((p) => p.title === "STELLAR COLLAPSE"), "and the news desk reports the collapse");
  sim.ship.pos = { x: star.radius * 0.6, y: 0, z: 0 };
  sim.ship.vel = { x: 0, y: 0, z: 0 };
  tickSim(0.05);
  ok(Math.hypot(sim.ship.pos.x, sim.ship.pos.y, sim.ship.pos.z) < star.radius, "there is no photosphere left to push a hull back out of");
  holes.length = 0;
  star.collapsed = false;
  star.nova = false;
  sim.events.length = 0;
  sim.phase = "menu";
}

console.log(`asteroids: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
