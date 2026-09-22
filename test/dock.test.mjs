/* LIVING GALAXY — 0.3.04: the approach docks again.
 *
 *   node --import ./test/three-register.mjs test/dock.test.mjs
 *
 * Reported: approach circles stations and never docks; manual DOCK is never
 * caught; no berth transition. Four causes, each pinned here by behaviour.
 */

const store = new Map();
globalThis.localStorage ??= { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { sim, launchSim, tickSim, toggleDock, shiftClock } = await import("../js/sim.js");
const { makePilot } = await import("../js/pilot.js");
const { touch } = await import("../js/input.js");
const { stations } = await import("../js/stations.js");
const { bodyById, bodyPosition, bodyVelocity } = await import("../js/bodies.js");
const { tractor, releaseTractor, clearDockRequest } = await import("../js/stationworks.js");
const { threatTo, deliberate, surfaceOnly } = await import("../js/avoid.js");
const AP = await import("../js/autopilot.js");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const DT = 0.1;
const run = (secs, until) => { for (let t = 0; t < secs; t += DT) { tickSim(DT); if (until()) return t; } return null; };

makePilot("Dock", "terran", "mining", null);
launchSim("DockTest", "Vesiaphou");
sim.phase = "play";
touch.panX = touch.panY = touch.rcsX = touch.rcsY = 0;
sim.dropoutRoll = 1;
run(3, () => false);
const ship = sim.ship;
const reset = () => { AP.disengageAutopilot("reset"); releaseTractor(); clearDockRequest(); ship.dockedAt = null; };

/* ---- 1. a tethered port on a fast world: manual DOCK from its lane -------- */
{
  const st = stations.find((s) => s.id === "st5");   // tethered at 2.3 radii, riding at 78 u/s — NEVER docked on 0.3.03
  ok(st && st.mount === "tethered", `the case: ${st?.name}, tethered to ${bodyById(st?.hostId)?.name}`);
  const m = st.hangars[0];
  reset();
  ship.pos.x = st.x + m.entry.x + m.dir.x * 1200; ship.pos.y = st.y + m.entry.y + m.dir.y * 1200; ship.pos.z = st.z + m.entry.z + m.dir.z * 1200;
  ship.vel.x = st.vx; ship.vel.y = st.vy; ship.vel.z = st.vz;
  tickSim(DT);
  toggleDock();
  tickSim(DT);
  ok(sim.dockPort?.id === st.id, "a berth filed: the hull flies in that port's frame");
  const t = run(120, () => ship.dockedAt === st.id);
  ok(t != null && t < 60, `manual DOCK on the lane is caught and berthed (${t?.toFixed(0)} s)`);
  const host = bodyById(st.hostId);
  const s = surfaceOnly(sim);
  ok(!s || s.has(host.id), "the port's own world is a surface, not a 2.4-radii no-go, while docking there");
}

/* ---- 2. the approach autopilot from 40 km, the case that circled ------------ */
{
  const st = stations.find((s) => s.id === "st8");   // free port at 276 u/s
  reset();
  ship.pos.x = st.x + 30000; ship.pos.y = st.y + 3000; ship.pos.z = st.z + 26000;
  ship.vel.x = st.vx; ship.vel.y = st.vy; ship.vel.z = st.vz;
  AP.engageAutopilot(st.id, "approach");
  let caught = false;
  const t = run(300, () => { caught ||= tractor.active; return ship.dockedAt === st.id; });
  ok(caught && t != null, `APPROACH to a 276 u/s port: tractor and berth (${t?.toFixed(0)} s)`);
}

/* ---- 3. the clock chase carries the hull -------------------------------------- */
{
  const st = stations.find((s) => s.id === "st7");
  reset();
  ship.pos.x = st.x + 3000; ship.pos.y = st.y; ship.pos.z = st.z;
  ship.vel.x = st.vx; ship.vel.y = st.vy; ship.vel.z = st.vz;
  AP.engageAutopilot(st.id, "approach");
  tickSim(DT);
  const before = { x: ship.pos.x - st.x, y: ship.pos.y - st.y, z: ship.pos.z - st.z };
  shiftClock(1.5);
  const { stepStations } = await import("../js/stations.js");
  stepStations(sim.time);
  const drift = Math.hypot(ship.pos.x - st.x - before.x, ship.pos.y - st.y - before.y, ship.pos.z - st.z - before.z);
  ok(drift < 20, `a 1.5 s room-clock jump leaves the hull where it was against the port (${drift.toFixed(1)} u; 0.3.03: ${Math.round(Math.hypot(st.vx, st.vy, st.vz) * 1.5)} u)`);
  reset();
}

/* ---- 4. the avoidance solver works in the hazard's frame ----------------------- */
{
  const st = stations.find((s) => s.mount === "tethered");
  const host = bodyById(st.hostId);
  const p = { x: 0, y: 0, z: 0 }, v = { x: 0, y: 0, z: 0 };
  bodyPosition(host.id, sim.time, p);
  bodyVelocity(host.id, sim.time, v);
  const pos = { x: p.x + host.radius * 2.2, y: p.y, z: p.z };
  const riding = threatTo(pos, { x: v.x, y: v.y, z: v.z }, { time: sim.time, includeRocks: false });
  ok(!riding || riding.id !== host.id || riding.inside, `a hull riding along with a world is not "about to hit" it (${riding?.name ?? "clear"} t${riding?.t?.toFixed?.(1) ?? "-"})`);
  const diving = threatTo(pos, { x: v.x - 200, y: v.y, z: v.z }, { time: sim.time, includeRocks: false });
  ok(diving && diving.id === host.id && diving.t < 10, `…but one closing on it at 200 u/s is (${diving?.name} in ${diving?.t?.toFixed(1)} s)`);
}

/* ---- 5. drift: sideways speed is killed before it becomes an orbit --------- */
{
  const target = { x: ship.pos.x + 4500, y: ship.pos.y, z: ship.pos.z };
  const frame = { x: 0, y: 0, z: 0 };
  ship.vel.x = 20; ship.vel.y = 0; ship.vel.z = 150;
  ok(AP.drifting(target, frame, 140), "150 u/s across the line at 140 allowed is drift");
  ship.vel.x = 130; ship.vel.z = 10;
  ok(!AP.drifting(target, frame, 140), "130 u/s down the line is an approach");
  ship.vel.x = -60; ship.vel.z = 0;
  ok(AP.drifting(target, frame, 140), "opening the range is drift");
  ship.vel.x = ship.vel.y = ship.vel.z = 0;
}

console.log(`dock: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
