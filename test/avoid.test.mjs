/* LIVING GALAXY — the belt: avoidance, the collision response, and the warp gates.
 *
 * Every assertion here pins a bug that was found by measuring, not by reading:
 * the spool-time well gate that disagreed with the jump gate, the ×0.55
 * restitution applied once per overlapping rock, the solver going blind below
 * 1 u/s, and the dropout that reported itself as an arrival.
 *
 *   node --import ./test/three-register.mjs test/avoid.test.mjs
 */
import { sim, launchSim, tickSim, selectBody } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { autopilot, engageAutopilot, apProgress, resetProgress, beginUnstick, AP_STUCK } from "../js/autopilot.js";
import { threatTo, avoidLevel, avoidAim, avoidCommit, clearAvoidCommit, blind, AVOID } from "../js/avoid.js";
import { touch } from "../js/input.js";
import { currentSystem, dist3 } from "../js/bodies.js";
import { stations } from "../js/stations.js";
import { inBelt, beltExit, aboveBelt, BELT_HALF_HEIGHT, nearbyRocks } from "../js/field.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("Avoid", "terran", "mining", null);
launchSim("AvoidTest", "sol");
sim.phase = "play";
const ship = sim.ship;
const belt = currentSystem.belt;
const mid = (belt.inner + belt.outer) / 2;
touch.panX = touch.panY = touch.rcsX = touch.rcsY = 0;

/* ---- the belt is a disc, and that is the way out ------------------------- */
{
  const inside = { x: mid, y: 0, z: 0 };
  ok(inBelt(inside), "mid-belt is in the belt");
  const ex = beltExit(inside);
  ok(ex && ex.need > 0 && Math.abs(ex.y) > BELT_HALF_HEIGHT, `there is a way out and it is up (${Math.round(ex.need)} u)`);
  const low = beltExit({ x: mid, y: -1500, z: 0 });
  ok(low.sign === -1, "from below the midplane the short way out is down");
  const gap = (belt.outer + (currentSystem.outerBelt?.inner ?? belt.outer * 2)) / 2;
  ok(beltExit({ x: gap, y: 0, z: 0 }) === null, `no belt, nothing to climb out of (${Math.round(gap / 1000)} k, between the annuli)`);
  ok(!aboveBelt({ x: mid, y: 100, z: 0 }) && aboveBelt({ x: mid, y: 9000, z: 0 }), "aboveBelt reads the layer, not the annulus");
}

/* ---- leaving something is not hitting it --------------------------------- */
{
  clearAvoidCommit();
  blind.clear();
  const st = stations.find((s) => !s.hostile);
  /* sit inside the station's exclusion sphere, moving straight out */
  const r = st.radius ?? 100;
  const out = { x: st.x + r * 1.5, y: st.y, z: st.z };
  const away = { x: 90, y: 0, z: 0 };
  const toward = { x: -90, y: 0, z: 0 };
  const leaving = threatTo(out, away, { time: sim.time, includeRocks: false });
  const arriving = threatTo(out, toward, { time: sim.time, includeRocks: false });
  const lv = leaving && leaving.id === st.id ? avoidLevel(leaving) : 0;
  ok(lv === 0, `a hull already inside a port's clearance and flying OUT is not a threat (level ${lv})`);
  ok(arriving && arriving.inside && avoidLevel(arriving) >= 2, "…and flying further in still is");
}

/* ---- a stopped hull is not a blind hull ---------------------------------- */
{
  const rocks = nearbyRocks({ x: mid, y: 0, z: 0 }, sim.time, 1);
  const r = rocks.find((x) => x.r > 60) ?? rocks[0];
  const touching = { x: r.x + r.r * 0.9, y: r.y, z: r.z };
  const stopped = threatTo(touching, { x: 0.2, y: 0, z: 0 }, { time: sim.time });
  ok(stopped && stopped.inside, "pressed against a rock at a standstill, the solver still sees it");
  ok(avoidLevel(stopped) >= 2, "…and says to push off, which is the only useful answer at zero speed");
}

/* ---- gravel is steered around, mountains are braked for ------------------ */
{
  const pebble = { kind: "rock", r: 40, t: 0.6, inside: false, outward: false };
  const mountain = { kind: "rock", r: 400, t: 0.6, inside: false, outward: false };
  const moon = { kind: "body", r: 900, t: 1.2, inside: false, outward: false };
  ok(avoidLevel(pebble) === 2, "a pebble close aboard sheds speed but never stops the hull");
  ok(avoidLevel(mountain) === 3, "a mountain at the same range does stop it");
  ok(avoidLevel(moon) === 3, "a world always does");
  ok(avoidLevel({ kind: "rock", r: 40, t: 4.5 }) === 1, "gravel four seconds out is a steer, not a manoeuvre");
}

/* ---- a dodge is committed, not re-argued five times a second ------------- */
{
  clearAvoidCommit();
  const hz = { id: "x1", kind: "body", x: 1000, y: 0, z: 0, r: 300, clear: 720, t: 5, tClosest: 5, miss: 100, inside: false };
  const pos = { x: 0, y: 0, z: 0 };
  const a = avoidAim(pos, { x: 200, y: 0, z: 0 }, hz, { x: 0, y: 0, z: 0 }, 0);
  const first = { ...avoidCommit() };
  ok(first.id === "x1", "the first dodge picks a way round and commits to it");
  /* same threat, a moment later, approach geometry nudged */
  avoidAim({ x: 40, y: 3, z: 0 }, { x: 200, y: 6, z: 0 }, hz, { x: 0, y: 0, z: 0 }, 1.2);
  const second = avoidCommit();
  const dot = first.x * second.x + first.y * second.y + first.z * second.z;
  ok(dot > 0.9, `the same threat keeps the same way round (dot ${dot.toFixed(3)})`);
  avoidAim({ x: 40, y: 3, z: 0 }, { x: 200, y: 6, z: 0 }, hz, { x: 0, y: 0, z: 0 }, AVOID.commitS + 2);
  ok(avoidCommit().at > 1.2, "…until the commit ages out and it may re-solve");
  ok(a.x !== hz.x || a.y !== hz.y, "the aim is beside the hazard, not at it");
}

/* ---- the collision response lets go of a hull that is leaving ------------ */
{
  ship.pos.x = mid; ship.pos.y = 0; ship.pos.z = 0;
  ship.vel.x = ship.vel.y = ship.vel.z = 0;
  const rocks = nearbyRocks(ship.pos, sim.time, 1);
  const r = rocks.find((x) => x.r > 80) ?? rocks[0];
  /* park the hull just inside the skin, moving outward at a decent clip */
  ship.pos.x = r.x + r.r * 0.85; ship.pos.y = r.y; ship.pos.z = r.z;
  const v0 = 120;
  ship.vel.x = v0; ship.vel.y = 0; ship.vel.z = 0;
  const before = Math.hypot(ship.vel.x, ship.vel.y, ship.vel.z);
  tickSim(1 / 60);
  const after = Math.hypot(ship.vel.x, ship.vel.y, ship.vel.z);
  ok(after > before * 0.9, `a hull moving out of a rock keeps its way (${Math.round(before)} → ${Math.round(after)} u/s)`);
}

/* ---- the two warp gates now answer to the same invariant ----------------- */
{
  const { WARP } = await import("../js/sim.js");
  ok(WARP.wellFloorG > 0, "there is a gravity floor at all");
  /* fly a leg from inside the belt and require that it actually leaves */
  const port = stations.filter((s) => !s.hostile).sort((a, b) => dist3({ x: mid, y: 0, z: 0 }, a) - dist3({ x: mid, y: 0, z: 0 }, b)).find((s) => dist3({ x: mid, y: 0, z: 0 }, s) > 200000);
  ok(port, "the sky has a port worth a jump");
  ship.pos.x = mid; ship.pos.y = 0; ship.pos.z = 0;
  ship.vel.x = ship.vel.y = ship.vel.z = 0;
  ship.hull = 100; sim.dominant = null; ship.dockedAt = null;
  sim.warp.state = "idle"; sim.warp.cool = 0; sim.wantJump = false;
  sim.dropoutRoll = 1;                       // no dropouts: this is the gate test, not the odds test
  autopilot.unstuckCount = 0;
  selectBody(port.id);
  ok(engageAutopilot(port.id, "warp"), "a jump-only leg engages from inside the belt");
  const seen = new Set();
  let n = 0, ran = false;
  while (n++ < 60 * 240 && autopilot.on) {
    tickSim(1 / 60);
    seen.add(autopilot.phase);
    if (sim.warp.state === "run") ran = true;
  }
  ok(seen.has("clear"), "it climbs out of the rocks before plotting");
  ok(ran, `the core actually spools and runs (phases: ${[...seen].join(" → ")})`);
  ok(dist3(ship.pos, port) < 120000, `and the hull arrives (${Math.round(dist3(ship.pos, port) / 1000)} k off)`);
  ok(autopilot.unstuckCount === 0, "with no break-out burns needed");
  ok(ship.hull > 95, `and no damage taken (${Math.round(ship.hull)})`);
}

/* ---- the watchdog measures closure, and only closure --------------------- */
{
  resetProgress(10000);
  ok(apProgress(10000) === false, "no time has passed, nothing is stuck");
  const t0 = sim.time;
  sim.time = t0 + AP_STUCK.idleS + 1;
  ship.vel.x = 0; ship.vel.y = 0; ship.vel.z = 0;
  ok(apProgress(10000) === true, "no closure for the idle window, at a standstill, is stuck");
  resetProgress(10000);
  sim.time += AP_STUCK.idleS + 1;
  ship.vel.x = 400;
  ok(apProgress(10000) === false, "…but a hull doing 400 u/s is slow, not boxed in");
  ship.vel.x = 0;
  resetProgress(10000);
  sim.time += AP_STUCK.idleS + 1;
  ok(apProgress(10000, 20000) === false, "and the doorstep is exempt — the braking curve is meant to crawl");
  sim.time = t0;
}

/* ---- a break-out picks the cheapest way out ------------------------------ */
{
  blind.clear();
  ship.pos.x = mid; ship.pos.y = -900; ship.pos.z = 0;
  const u = beginUnstick("test");
  ok(u && Math.abs(u.y) > 0.9 && u.y < 0, "inside a belt below the midplane, the break-out goes down");
  ok(autopilot.unstick === u && u.until > sim.time, "and it owns the ship for a fixed window");
  autopilot.unstick = null;
  ship.pos.x = (belt.outer + (currentSystem.outerBelt?.inner ?? belt.outer * 2)) / 2; ship.pos.y = 0; ship.pos.z = 0;
  const u2 = beginUnstick("test");
  ok(u2 && Math.hypot(u2.x, u2.y, u2.z) > 0.99, "out of a belt it still picks a unit direction");
  autopilot.unstick = null;
  blind.clear();
}

console.log(`avoid: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
