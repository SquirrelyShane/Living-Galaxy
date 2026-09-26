/* LIVING GALAXY — 0.3.60: room between things, and rogues that are an event.
 *
 *   spacing: neighbouring planets clear each other by SPACING.planetClear of
 *     their (capped) SOIs; neighbouring moons by SPACING.moonGap of their
 *     radii; belts keep SPACING.beltClear SOIs off every planet's orbit; a
 *     pushed body keeps its orbital speed
 *   rogues: none in the first ROGUE.firstAfter seconds, a handful an hour,
 *     never more than ROGUE.maxLive; a pass (by you or by a world) is flown
 *     first and never lands; a strike is aimed, and never at a spared world
 *
 *   node --import ./test/three-register.mjs test/spacing.test.mjs
 */
import { generateSystem, spawnBodyId, rngFromSeed } from "../js/generate.js";
import { scaleSystem, applySystem, bodyPosition, bodyVelocity, SOL_SYSTEM, SPACING } from "../js/bodies.js";
import * as bodiesMod from "../js/bodies.js";
import { scaleOrbit, PERIOD_K } from "../js/scale.js";
import { gravityAt } from "../js/ship.js";
import { ROGUE, rogueHooks, stepImpactors, resetImpactors, impactors } from "../js/impactors.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };

/* ---- 1. spacing ------------------------------------------------------------------------ */
const room = (p) => Math.min(p.soi, p.orbit * SPACING.soiCap);
const seeds = ["sol", ...Array.from({ length: 30 }, (_, i) => `space${i}`)];
let worstPP = Infinity, worstMoon = Infinity, worstBelt = Infinity, pushed = 0, moonsPushed = 0, speedOff = 0;
let worstAt = "";
for (const seed of seeds) {
  const sys = scaleSystem(generateSystem(seed));
  const src = generateSystem(seed);
  const planets = sys.bodies.filter((b) => !b.parent && b.kind !== "star").sort((a, b) => a.orbit - b.orbit);
  for (let i = 1; i < planets.length; i++) {
    const a = planets[i - 1], b = planets[i];
    const gap = b.orbit * (1 - b.eccentricity) - a.orbit * (1 + a.eccentricity);
    const k = gap / (room(a) + room(b));
    if (k < worstPP) { worstPP = k; worstAt = `${seed}: ${a.name} / ${b.name}`; }
  }
  for (const p of sys.bodies) {
    const d = src.bodies.find((x) => x.id === p.id);
    if (!d || p.kind === "star") continue;
    const stretch = p.orbit / Math.max(1, scaleOrbit(d.orbit));
    if (p.spaced || (p.parent && stretch > 1.0001 && p.period > d.period * PERIOD_K * 1.0001)) {
      p.parent ? moonsPushed++ : pushed++;
      /* same speed: orbit ÷ period is what it would have been unpushed */
      const want = (p.parent ? p.orbit / (p.period / (d.period * PERIOD_K)) : scaleOrbit(d.orbit)) / (d.period * PERIOD_K);
      const got = p.orbit / p.period;
      if (!p.parent) speedOff = Math.max(speedOff, Math.abs(got / want - 1));
    }
  }
  for (const p of planets) {
    const moons = sys.bodies.filter((m) => m.parent === p.id).sort((a, b) => a.orbit - b.orbit);
    for (let i = 1; i < moons.length; i++) {
      const a = moons[i - 1], b = moons[i];
      worstMoon = Math.min(worstMoon, (b.orbit * (1 - b.eccentricity) - a.orbit * (1 + a.eccentricity)) / (a.radius + b.radius));
    }
  }
  for (const bl of [sys.belt, sys.outerBelt]) {
    for (const p of planets) {
      if (p.kind === "dwarf") continue;   // a dwarf is a belt's own kind of body
      const lo = p.orbit * (1 - p.eccentricity), hi = p.orbit * (1 + p.eccentricity);
      const d = bl.outer < lo ? lo - bl.outer : bl.inner > hi ? bl.inner - hi : -1;
      worstBelt = Math.min(worstBelt, d / room(p));
    }
  }
  if (sys.outerBelt && sys.belt) ok(sys.outerBelt.inner > sys.belt.outer, `${seed}: the ice belt stays outside the main belt`);
}
ok(worstPP >= SPACING.planetClear - 0.01, `no two neighbouring planets closer than ${SPACING.planetClear} rooms (worst ${worstPP.toFixed(2)}, ${worstAt})`);
ok(worstMoon >= SPACING.moonGap - 0.01, `no two neighbouring moons closer than ${SPACING.moonGap} radii (worst ${worstMoon.toFixed(2)}) — they used to overlap`);
ok(worstBelt >= SPACING.beltClear - 0.01, `every belt keeps ${SPACING.beltClear} rooms off every planet's orbit (worst ${worstBelt.toFixed(2)})`);
ok(pushed > 0 && moonsPushed > 0, `bodies that were too close were moved (${pushed} planets, ${moonsPushed} moons in ${seeds.length} skies)`);
ok(speedOff < 1e-6, `a pushed planet keeps its orbital speed (${(speedOff * 100).toFixed(4)}% off)`);

/* Sol, by name */
{
  const sol = scaleSystem(SOL_SYSTEM);
  const by = (n) => sol.bodies.find((b) => b.name === n);
  const J = by("Jupiter"), N = by("Neptune"), U = by("Uranus");
  ok(sol.belt.outer < J.orbit * (1 - J.eccentricity) - SPACING.beltClear * room(J), `Sol's main belt is off Jupiter's sphere (${Math.round(sol.belt.inner / 1000)}k–${Math.round(sol.belt.outer / 1000)}k)`);
  ok(sol.outerBelt.inner > N.orbit * (1 + N.eccentricity) && sol.outerBelt.inner > U.orbit, `Sol's ice belt is beyond Neptune, not through Uranus and Neptune (${Math.round(sol.outerBelt.inner / 1000)}k–${Math.round(sol.outerBelt.outer / 1000)}k)`);
  ok(by("Earth").orbit === scaleOrbit(SOL_SYSTEM.bodies.find((b) => b.id === "earth").orbit), "the inner worlds are where they were");
}

/* ---- 2. rogues ------------------------------------------------------------------------------ */
{
  const HOURS = 3;
  let spawned = 0, strikes = 0, stray = 0, spareHit = 0, early = 0, overLive = 0, runs = 0, aimed = 0;
  for (const seed of ["sol", "space1", "space2", "space3"]) {
    for (const spareHome of [true, false]) {
      applySystem(generateSystem(seed));
      const BODIES = bodiesMod.BODIES;
      const home = BODIES.find((b) => b.id === (seed === "sol" ? "earth" : spawnBodyId({ bodies: BODIES })));
      resetImpactors(rngFromSeed(`${seed}:${spareHome}:rogue`));
      rogueHooks.spare = spareHome ? (b) => b.id === home.id || b.parent === home.id : null;
      runs++;
      const seen = new Set();
      let t = 1000;
      const g = { x: 0, y: 0, z: 0 };
      const ship = { pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 } };
      for (let i = 0; i < (HOURS * 3600) / 0.25; i++) {
        t += 0.25;
        const p = bodyPosition(home.id, t, { x: 0, y: 0, z: 0 });
        ship.pos.x = p.x + home.radius * 4; ship.pos.y = p.y; ship.pos.z = p.z;
        bodyVelocity(home.id, t, ship.vel);
        stepImpactors(0.25, ship, BODIES, bodyPosition, gravityAt, g, t, (m, b) => {
          strikes++;
          if (m.aim !== "strike") stray++;
          if (spareHome && (b.id === home.id || b.parent === home.id)) spareHit++;
        }, () => {}, null);
        if (impactors.length > ROGUE.maxLive) overLive++;
        for (const m of impactors) if (!seen.has(m.id)) { seen.add(m.id); if (t - 1000 < ROGUE.firstAfter) early++; if (m.aim === "strike") aimed++; }
      }
      spawned += seen.size;
    }
  }
  rogueHooks.spare = null;
  const perHour = spawned / (runs * HOURS);
  ok(early === 0, `no rogue in the first ${ROGUE.firstAfter / 60} minutes of a sky`);
  ok(perHour > 3 && perHour < 12, `a handful an hour, not one a minute (${perHour.toFixed(1)} an hour; 0.3.59 was 21)`);
  ok(overLive === 0, `never more than ${ROGUE.maxLive} at once`);
  ok(stray === 0, `a rock thrown past you or a world never lands (${stray} of ${strikes} strikes were strays)`);
  ok(spareHit === 0, "a spared world is never struck");
  ok(strikes / (runs * HOURS) < 0.6, `strikes are an event (${(strikes / (runs * HOURS)).toFixed(2)} an hour; 0.3.59 was 3.7)`);
  ok(aimed === 0 || strikes > 0, `an aimed strike does land somewhere (${strikes} of ${aimed} aimed)`);
}

/* ---- 3. the sim spares settled worlds -------------------------------------------------------- */
{
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  const { sim, launchSim, tickSim } = await import("../js/sim.js");
  const { makePilot } = await import("../js/pilot.js");
  const { stations } = await import("../js/stations.js");
  makePilot("ROCK", "terran", "mining", null);
  launchSim("RockTest", "sol");
  sim.phase = "play";
  tickSim(1 / 60);
  const B = bodiesMod.BODIES;
  const fam = (id) => B.find((x) => x.id === id)?.parent ?? id;
  const settled = new Set(stations.filter((st) => st.hostId).map((st) => fam(st.hostId)));
  ok(typeof rogueHooks.spare === "function", "the sim tells the rocks which worlds to spare");
  ok(rogueHooks.spare(B.find((b) => b.id === "earth")), "the world you start by is spared");
  const hostMoon = B.find((b) => b.parent && settled.has(fam(b.id)) && fam(b.id) !== "earth") ?? B.find((b) => b.parent && settled.has(fam(b.id)));
  if (hostMoon) ok(rogueHooks.spare(hostMoon) && rogueHooks.spare(B.find((b) => b.id === hostMoon.parent)), `a world with a port in its family is spared, moons and all (${B.find((b) => b.id === hostMoon.parent).name})`);
  const wild = B.find((b) => b.kind !== "star" && !settled.has(fam(b.id)) && fam(b.id) !== "earth");
  ok(wild && !rogueHooks.spare(wild), `a wild world is fair game (${wild?.name})`);
}

console.log(`spacing: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
