/* 0.3.65 — a mirror takes the host's hull word without a hop.
 * node --import ./test/three-register.mjs test/hullsync.test.mjs
 *
 * Real modules: launches Sol headless (as host/sol-host.mjs does), then feeds
 * adoptHulls() hand-built wstate rows and steps blendHulls()/stepTraffic() at
 * 60 Hz, measuring the largest single-frame move a correction causes. */
import assert from "node:assert/strict";
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), get length() { return store.size; }, key: (i) => [...store.keys()][i] ?? null };
const { sim, launchSim } = await import("../js/sim/sim.js");
const { traffic, stepTraffic } = await import("../js/npc/traffic.js");
const { adoptHulls, blendHulls, HULL_DEAD, HULL_SNAP, HULL_HOLD } = await import("../js/net/worldsync.js");
launchSim("Hullsync", "sol");
sim.time = 1000;

let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; };
const FRAME = 1 / 60;
const row = (n, x, y, z, v = [0, 0, 0], vis = 1) => [n.id, x, y, z, v[0], v[1], v[2], n.yaw ?? 0, n.pitch ?? 0, n.job ?? "", n.hp ?? 100, n.shield ?? 0, vis, 0];
/* a visible hull on its own timetable, parked for the measurement */
function fresh() {
  const n = traffic.find((h) => h.visible !== false && h.job !== "down" && !["dock", "berth", "unberth"].includes(h.state) && !(h.heldUntil > sim.time));
  assert.ok(n, "a visible cruising hull exists");
  n.sync = null; n.heldUntil = 0; n.vx = n.vy = n.vz = 0; n.speed = 0;
  return n;
}
/* run the blend alone for `secs` at 60 Hz; the largest single-frame move */
function blendFor(n, secs) {
  let worst = 0;
  for (let t = 0; t < secs; t += FRAME) {
    const x = n.x, y = n.y, z = n.z;
    blendHulls(FRAME);
    worst = Math.max(worst, Math.hypot(n.x - x, n.y - y, n.z - z));
  }
  return worst;
}

/* 1. a disagreement under HULL_DEAD is left alone */
{
  const n = fresh(); const x = n.x;
  adoptHulls([row(n, n.x + HULL_DEAD * 0.5, n.y, n.z)], { at: sim.time });
  ok(n.x === x && !n.sync, "sub-deadband: no move, nothing held");
}

/* 2. a 1,500 u disagreement: no hop in the packet frame, a bounded drift after, converges */
{
  const n = fresh(); const x0 = n.x, target = n.x + 1500;
  adoptHulls([row(n, target, n.y, n.z)], { at: sim.time });
  ok(n.x === x0, "packet frame: position untouched (0.3.64 moved it 600 u here, 40% in one frame)");
  const worst = blendFor(n, 12);
  ok(worst <= 150 * FRAME + 1e-6, `blend frame move ≤ the 150 u/s floor at 60 Hz (worst ${worst.toFixed(2)} u)`);
  ok(Math.abs(n.x - target) < 5, `converged (${Math.abs(n.x - target).toFixed(1)} u left after 12 s)`);
}

/* 3. `at`: a report a second old is carried forward by its velocity */
{
  const n = fresh();
  adoptHulls([row(n, n.x, n.y, n.z, [0, 0, 0], 0)], { at: sim.time });   // host says: out of sight → taken outright
  const x = n.x;
  adoptHulls([row(n, x, n.y, n.z, [3000, 0, 0], 0)], { at: sim.time - 1 });
  ok(Math.abs(n.x - (x + 3000)) < 1e-6, "a 1 s old report lands 1 s further along");
}

/* 4. diverged (past HULL_SNAP): placed once, then HELD — dead-reckoned, not flown back */
{
  const n = fresh(); const target = n.x + HULL_SNAP * 4;
  adoptHulls([row(n, target, n.y, n.z, [200, 0, 0])], { at: sim.time });
  ok(n.x === target && n.heldUntil > sim.time, "diverged hull placed and held");
  const before = n.x;
  for (let i = 0; i < 60; i++) { sim.time += FRAME; stepTraffic(sim.time, FRAME, undefined, undefined, null); }
  ok(Math.abs(n.x - (before + 200)) < 1, `held hull coasts on the host's velocity (${(n.x - before).toFixed(1)} u in 1 s)`);
  /* next packet 2 s on finds it close: a blend, not a second teleport */
  const x = n.x;
  adoptHulls([row(n, x + 40, n.y, n.z, [200, 0, 0])], { at: sim.time });
  ok(n.x === x && n.sync, "held hull: next packet blends");
  /* the host goes quiet: the hold lapses and the timetable resumes */
  n.sync = null;
  for (let t = 0; t < HULL_HOLD + 0.5; t += 0.1) { sim.time += 0.1; stepTraffic(sim.time, 0.1, undefined, undefined, null); }
  ok(!n.heldUntil, "hold lapses without packets");
}

/* 5. the host restoring its own checkpoint places exactly, holds nothing */
{
  const n = fresh();
  adoptHulls([row(n, n.x + 900, n.y - 3, n.z + 7)], { snap: true });
  ok(!n.sync && !n.heldUntil, "snap: exact, no blend, no hold");
}

console.log(`hullsync: PASS — ${pass} assertions`);
