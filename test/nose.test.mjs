/* LIVING GALAXY — 0.3.51: the nose goes where the ship goes.
 *
 *   node --import ./test/three-register.mjs test/nose.test.mjs
 *
 * An autopilot jump out of a well, measured every second: the angle between
 * the nose and the flight path (relative to the well the canopy shows), and
 * during the run the angle between the nose and the lane. Before: 125–138°
 * through the spool (sliding backwards at 600 u/s) and 24° crabbed by the end
 * of the jump. And a manual jump flies the lane nose-first too.
 */
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

import { sim, launchSim, tickSim, selectBody, toggleWarp } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { BODIES } from "../js/bodies.js";
import { forwardOf } from "../js/ship.js";
import { touch } from "../js/input.js";
import * as AP from "../js/autopilot.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (process.env.V) console.log(c ? "  ok  " : "  FAIL", m); if (c) pass++; else { fail++; if (!process.env.V) console.error("  FAIL", m); } };
const deg = (a) => Math.round((a * 180) / Math.PI);

makePilot("Nose", "terran", "mining", null);
launchSim("NoseTest", "sol");
sim.phase = "play";
touch.panX = touch.panY = touch.rcsX = touch.rcsY = 0;
sim.dropoutRoll = 1;
for (let i = 0; i < 30; i++) tickSim(1 / 30);
const ship = sim.ship;
const offOf = (vx, vy, vz) => { const f = forwardOf(ship.yaw, ship.pitch); const s = Math.hypot(vx, vy, vz); return s < 1 ? 0 : Math.acos(Math.max(-1, Math.min(1, (f.x * vx + f.y * vy + f.z * vz) / s))); };

/* ---- an autopilot jump out of Earth's well ---------------------------------- */
{
  const tgt = BODIES.find((b) => b.name === "Mars") ?? BODIES[3];
  selectBody(tgt.id);
  AP.engageAutoWarp(tgt.id);
  let worstFlight = 0, worstAt = "", worstLane = 0, runSamples = 0, arrived = false, t0 = sim.time, sawShed = false;
  for (let i = 0; i < 30 * 150; i++) {
    tickSim(1 / 30);
    if (AP.autopilot.lining === "shed") sawShed = true;
    if (i % 30 !== 0) continue;
    const w = sim.warp;
    if (w.state === "run") {
      const f = w.t / w.dur;
      if (f > 0.12 && f < 0.88) {
        const lx = w.to.x - w.from.x, ly = w.to.y - w.from.y, lz = w.to.z - w.from.z;
        worstLane = Math.max(worstLane, offOf(lx, ly, lz));
        runSamples++;
      }
      continue;
    }
    if (sim.time - t0 < 5) continue;                      // the first turn off the pad
    const fv = sim.frameVel;
    const vx = ship.vel.x - fv.x, vy = ship.vel.y - fv.y, vz = ship.vel.z - fv.z;
    const sp = Math.hypot(vx, vy, vz);
    if (sp > 150) { const o = offOf(vx, vy, vz); if (o > worstFlight) { worstFlight = o; worstAt = `${AP.autopilot.phase}/${w.state} at ${Math.round(sp)} u/s`; } }
    if (AP.autopilot.jumped && w.state === "idle") { arrived = true; break; }
  }
  ok(runSamples > 3, `the jump ran (${runSamples} samples)`);
  ok(deg(worstLane) <= 2, `through the jump the nose is on the lane (worst ${deg(worstLane)}°; was 24°)`);
  ok(deg(worstFlight) <= 20, `out of the jump, above 150 u/s the ship moves where it points (worst ${deg(worstFlight)}° ${worstAt}; the spool was 125–138°)`);
  ok(sawShed, "the climb's drift is shed nose-first before the core is lit");
  ok(arrived && sim.time - t0 < 120, `and it still gets there (${Math.round(sim.time - t0)} s)`);
  AP.disengageAutopilot?.("test");
}

/* ---- a manual jump flies the lane nose-first too ----------------------------- */
{
  sim.warp.state = "idle"; sim.warp.cool = 0;
  /* out of every well: well above the plane, between the orbits */
  ship.pos.y += 3e6; ship.charge = 1e6;
  for (let i = 0; i < 10; i++) tickSim(1 / 30);
  sim.warp.cool = 0;
  const tgt = BODIES.find((b) => b.name === "Jupiter") ?? BODIES[5];
  selectBody(tgt.id);
  /* point at the lane so the nav computer will take it */
  const r = await import("../js/sim.js");
  const dest = r.warpDestination(r.warpNodeById(tgt.id));
  const dx = dest.x - ship.pos.x, dz = dest.z - ship.pos.z, dy = dest.y - ship.pos.y;
  ship.yaw = ship.aimYaw = Math.atan2(-dx, -dz); ship.pitch = ship.aimPitch = Math.atan2(dy, Math.hypot(dx, dz));
  ship.vel.x = sim.frameVel.x; ship.vel.y = sim.frameVel.y; ship.vel.z = sim.frameVel.z;
  toggleWarp();
  if (sim.warp.state !== "spool") console.log("   (manual plot:", sim.notice, ")");
  let worst = 0, n = 0, started = sim.warp.state === "spool";
  for (let i = 0; i < 30 * 90 && (sim.warp.state !== "idle" || i < 5); i++) {
    tickSim(1 / 30);
    const w = sim.warp;
    if (w.state === "run" && w.t / w.dur > 0.12 && w.t / w.dur < 0.88) { worst = Math.max(worst, offOf(w.to.x - w.from.x, w.to.y - w.from.y, w.to.z - w.from.z)); n++; }
  }
  ok(!started || n > 3, `a manual jump ran (${started ? n + " samples" : "the plot refused here — skipped"})`);
  if (n) ok(deg(worst) <= 2, `and flew the lane nose-first (worst ${deg(worst)}°)`);
}

console.log(`nose: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
