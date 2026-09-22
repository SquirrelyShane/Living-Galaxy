/* LIVING GALAXY — 0.3.01's bug hunt outside the bus, pinned by behaviour.
 *
 *   node --import ./test/three-register.mjs test/hunt.test.mjs
 *
 * The power findings live in test/power.test.mjs. These are the rest: the
 * impact cap, a hole's horizon, lanes through holes, a stood-down spool.
 */

const store = new Map();
globalThis.localStorage ??= { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { IMPACTS, runs, resetImpacts, startStrike, stepImpacts } = await import("../js/impacts.js");
const { chunks, addChunk, resetDebris } = await import("../js/debris.js");
const { holes, holeRadii, holeAccel, resetHoles } = await import("../js/holes.js");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

/* ---- the live-run cap caps ------------------------------------------------- */
{
  resetDebris(); resetImpacts();
  const body = { id: "w1", name: "T", kind: "rocky", radius: 1800, oreId: "iron_ore" };
  const strike = (k, r = 500) => startStrike({ rogue: { id: `imp${k}`, name: "R", r, x: 2300, y: 0, z: 0, vx: -650, vy: 30, vz: 0, seed: 0.4 }, body, bodyPos: { x: 0, y: 0, z: 0 }, bodyVel: { x: 0, y: 0, z: 0 }, normal: { nx: 1, ny: 0, nz: 0 }, speed: 650, sev: 0.2, gSurf: 25, time: 0, shipPos: { x: 9000, y: 0, z: 0 }, addChunk });
  for (let k = 0; k < 5; k++) strike(k);
  ok(runs.length <= IMPACTS.maxLive, `five strikes hold ${runs.length} live runs (cap ${IMPACTS.maxLive}; 0.3 held 5)`);
  ok(runs.every((r) => !r.ended), "no ended run is left in the live list");
  const n = chunks.length;
  ok(strike(9, 0) === null && chunks.length === n, "a zero-radius rogue is refused, not run as NaN");
  ok(chunks.every((c) => Number.isFinite(c.x + c.y + c.z)), "every chunk position is finite");
  resetImpacts(); resetDebris();
}

/* ---- a zero-size hole on the sample point ---------------------------------- */
{
  resetHoles();
  holes.push({ id: "h0", name: "Z", x: 0, y: 0, z: 0, rs: 0, mu: 0, gravity: true });
  const out = { x: 0, y: 0, z: 0 };
  holeAccel({ x: 0, y: 0, z: 0 }, out);
  ok(Number.isFinite(out.x + out.y + out.z), "holeAccel at a zero-size hole's centre is finite");
  resetHoles();
}

/* ---- the sim: a stood-down spool, a lane through a hole, the horizon -------- */
const { sim, launchSim, tickSim, summonHole, plotRoute, addWaypointAt } = await import("../js/sim.js");
const { makePilot } = await import("../js/pilot.js");
const { touch } = await import("../js/input.js");
const AP = await import("../js/autopilot.js");
const { startMission } = await import("../js/mission/run.js");
const { oneStep } = await import("../js/mission/script.js");
const { currentSystem } = await import("../js/bodies.js");
const { stations } = await import("../js/stations.js");
const tick = (s) => { for (let i = 0; i < s * 60; i++) tickSim(1 / 60); };

makePilot("Hunt", "terran", "mining", null);
launchSim("HuntTest", "sol");
sim.phase = "play";
touch.panX = touch.panY = touch.rcsX = touch.rcsY = 0;
sim.dropoutRoll = 1;
const ship = sim.ship;
ship.shields = false; ship.turretsArmed = false; ship.localGravity = false; ship.miningMode = "off";
tickSim(1 / 60);

{
  const belt = currentSystem.belt;
  const mid = (belt.inner + belt.outer) / 2;
  ship.pos.x = belt.inner * 0.55; ship.pos.y = 4000; ship.pos.z = belt.inner * 0.4; sim.dominant = null;
  ship.vel.x = ship.vel.y = ship.vel.z = 0; ship.charge = 1600;
  const far = addWaypointAt("Far", mid, 0, 0);
  ok(startMission(oneStep("GOTO", { kind: "wp", id: far.id, name: far.name }, { warp: "auto" })), "a jumping GOTO starts");
  let n = 0;
  while (AP.autopilot.on && sim.warp.state === "idle" && n++ < 60 * 300) tickSim(1 / 60);
  ok(sim.warp.state === "spool", `the autopilot spools the core (${sim.warp.state})`);
  AP.disengageAutopilot("stood down");
  let ran = false;
  for (let i = 0; i < 60 * 10; i++) { tickSim(1 / 60); if (sim.warp.state === "run") ran = true; }
  ok(!ran && sim.warp.state === "idle", "standing the autopilot down stands its spool down too (0.3 jumped anyway)");
}

{
  /* a hole parked mid-lane to a far waypoint */
  ship.vel.x = ship.vel.y = ship.vel.z = 0;
  const to = addWaypointAt("Across", ship.pos.x + 400000, ship.pos.y, ship.pos.z);
  const h = summonHole({ at: { x: ship.pos.x + 200000, y: ship.pos.y, z: ship.pos.z }, vel: { x: 0, y: 0, z: 0 }, rs: 1900 });
  sim.time += 1; // the route cache keys on the clock
  const route = plotRoute(to.id);
  ok(route?.impact && /disk/.test(route.impact.note), `a lane through ${h.name}'s disk is refused (${route?.impact?.note ?? "no impact"})`);
  resetHoles();
}

{
  const h = summonHole({ at: { x: ship.pos.x + 1000, y: ship.pos.y, z: ship.pos.z }, vel: { x: 0, y: 0, z: 0 }, rs: 1900 });
  ship.hull = 100; ship.hold = { iron_ore: 40 }; ship.dockedAt = null;
  let trapped = 0, rescued = false;
  for (let i = 0; i < 60 * 8; i++) {
    tickSim(1 / 60);
    const d = Math.hypot(ship.pos.x - h.x, ship.pos.y - h.y, ship.pos.z - h.z);
    if (d < holeRadii(h).burn && ship.hull <= 12) trapped++;
    if (d > holeRadii(h).danger) { rescued = true; break; }
  }
  ok(rescued, `a hull lost at the horizon is recovered, not pinned (${trapped} ticks at ≤12 hull inside the burn)`);
  ok(!ship.hold.iron_ore, "…and the hole keeps the hold");
  ok(stations.some((st) => Math.hypot(st.x - ship.pos.x, st.y - ship.pos.y, st.z - ship.pos.z) < 5000), "…at a friendly port");
  resetHoles();
}

console.log(`hunt: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
