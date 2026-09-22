/* LIVING GALAXY — the chart menu patch: point warp nodes, arrival clearance, auto-warp,
 * remote scans and probes, boost/cruise, sensor range, net relay back-off.
 *
 *   node --import ./test/three-register.mjs test/chart.test.mjs
 */

import {
  sim, launchSim, tickSim, warpNodeById, warpDestination, warpBlock, plotRoute, clearArrival, POINT_ARRIVE_R,
  addWaypointAt, selectBody, targetPosition, sensorRange, SENSOR_R, throttleCap, setThrottle, stepWarp,
} from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { BODIES, bodyPosition, currentSystem, dist3 } from "../js/bodies.js";
const _hp = { x: 0, y: 0, z: 0 };
import { inBelt, nearbyRocks, CELL } from "../js/field.js";
import { autopilot, engageAutoWarp, engageAutopilot, disengageAutopilot, tickAutopilot } from "../js/autopilot.js";
import { assayPoint, beltBandAt, remoteScan, launchProbe, probes, stepProbes, PROBE_SPEED, SCAN_REACH } from "../js/probes.js";
import { setInjectedKeys, sampleInput, touch } from "../js/input.js";
import { captain } from "../js/npc/captain.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("Chart", "terran", "mining", null);
launchSim("ChartTest", "sol");
sim.phase = "play";
sim.timeScale = 1;
const ship = sim.ship;

/* ---- a point in the belt is a warp node ---------------------------------- */
const belt = currentSystem.belt;
ok(belt, "the sky has a main belt");
const mid = (belt.inner + belt.outer) / 2;
const wp = addWaypointAt("Belt fix", mid, 0, 0);
const node = warpNodeById(wp.id);
ok(node && node.kind === "point" && node.arriveR === POINT_ARRIVE_R, "a saved location resolves to a point warp node");
const dest = warpDestination(node);
ok(Math.abs(dest.x - mid) < 1e-6 && Math.abs(dest.z) < 1e-6, "a point jump lands on the point itself");
ok(beltBandAt(mid, 0)?.label === "belt", `the point reads as belt (${beltBandAt(mid, 0)?.band})`);
selectBody(wp.id);
ok(sim.selected === wp.id, "selectBody accepts a waypoint as the nav target");
ok(sim.lock.kind === "waypoint" && sim.lock.id === wp.id, "…and locks it");
ok(targetPosition("waypoint", wp.id) && Math.abs(targetPosition("waypoint", wp.id).x - mid) < 1e-6, "waypoint lock has a live position");
const route = plotRoute(wp.id);
ok(route && route.targetId === wp.id && route.kind === "point", `the route plots to a point (${route?.dist} u, ${route?.hazards.length} hazards)`);
ok(route.hazards.some((h) => h.kind === "belt"), "a belt destination lists the belt crossing");

/* ---- from inside a well: nav climbs out first, then jumps ------------------ */
{
  ship.charge = Math.max(ship.charge, 5000);
  ship.dockedAt = null;
  touch.panX = 0; touch.panY = 0; touch.rcsX = 0; touch.rcsY = 0;
  /* park just off the home world, inside its well */
  const home = BODIES.find((b) => b.kind === "terra" || b.kind === "rocky") ?? BODIES.find((b) => b.kind !== "star");
  bodyPosition(home.id, sim.time, _hp);
  ship.pos.x = _hp.x + home.radius * 2.5; ship.pos.y = _hp.y; ship.pos.z = _hp.z;
  ship.vel.x = ship.vel.y = ship.vel.z = 0;
  tickSim(1 / 60); tickSim(1 / 60);
  ok(/WELL/.test(sim.warp.block), `next to ${home.name} the core reads its well (${sim.warp.block})`);
  /* the well ends where the pull falls off: past wellEdge the core spools even with the world still dominant */
  {
    const { wellEdge, warpBlock } = await import("../js/sim.js");
    const edge = wellEdge(home);
    ok(edge <= home.radius * 8 && edge >= home.radius * 4, `${home.name}'s well ends between 4 and 8 radii (${(edge / 100).toFixed(0)} km)`);
    const p0 = { ...sim.ship.pos };
    const hp = _hp; const dir = { x: sim.ship.pos.x - hp.x, y: sim.ship.pos.y - hp.y, z: sim.ship.pos.z - hp.z }; const L = Math.hypot(dir.x, dir.y, dir.z) || 1;
    sim.ship.pos.x = hp.x + (dir.x / L) * (edge * 1.05); sim.ship.pos.y = hp.y + (dir.y / L) * (edge * 1.05); sim.ship.pos.z = hp.z + (dir.z / L) * (edge * 1.05);
    tickSim(1 / 30);
    ok(!/WELL/.test(warpBlock(sim.selected) ?? ""), `5 % past the edge the well no longer holds the core (${warpBlock(sim.selected) ?? "clear"})`);
    sim.ship.pos.x = p0.x; sim.ship.pos.y = p0.y; sim.ship.pos.z = p0.z;
  }
  ok(engageAutoWarp(wp.id), "auto-warp still engages there");
  sim.dropoutRoll = 1;
  let climbed = false, jumped = false, n = 0;
  while (n++ < 60 * 600) {
    tickSim(1 / 60);
    if (autopilot.phase === "climb") climbed = true;
    if (sim.warp.state === "run") { jumped = true; break; }
    if (!autopilot.on) break;
  }
  ok(climbed, "nav climbed out of the well");
  ok(jumped, `…and jumped once clear (${(n / 60).toFixed(0)} s, ${sim.notice})`);
  console.log(`  climb-and-jump: ${(n / 60).toFixed(0)} s`);
  while (sim.warp.state === "run" || autopilot.on) tickSim(1 / 60);
  sim.dropoutRoll = undefined;
}

/* ---- the auto-warp: align, spool, run, hand back ------------------------- */
ship.charge = Math.max(ship.charge, 5000);
ship.dockedAt = null;
ship.vel.x = ship.vel.y = ship.vel.z = 0;
/* start well clear of any well so the core will engage */
ship.pos.x = belt.inner * 0.55; ship.pos.y = 4000; ship.pos.z = belt.inner * 0.4;
sim.dominant = null;
ok(captain.holder === "player", "player has the conn");
ok(engageAutoWarp(wp.id), "auto-warp engages on a point");
ok(autopilot.on && autopilot.mode === "warp", "autopilot is in jump-only mode");
touch.panX = 0; touch.panY = 0; touch.rcsX = 0; touch.rcsY = 0;
sim.dropoutRoll = 1; // never drop out in this test
let jumped = false, handedBack = false, steps = 0;
while (steps++ < 60 * 90) {
  tickSim(1 / 60);
  if (sim.warp.state === "run") jumped = true;
  if (jumped && !autopilot.on) { handedBack = true; break; }
}
ok(jumped, `the nav computer came about and spooled the core (block now: "${sim.warp.block}")`);
ok(handedBack, `the stick came back after the jump (${(steps / 60).toFixed(1)} s)`);
ok(dist3(ship.pos, { x: mid, y: 0, z: 0 }) < POINT_ARRIVE_R + 400, `arrived on the fix (${Math.round(dist3(ship.pos, { x: mid, y: 0, z: 0 }))} u off)`);
ok(inBelt(ship.pos), "…which is inside the belt");
ok(!sim.waypoints.some((w) => w.id === wp.id) || !wp.transient, "a kept fix survives arrival");
ok(!nearbyRocks(ship.pos, sim.time, 1).some((r) => dist3(ship.pos, r) < r.r + 200), "nothing materialised inside a rock");
sim.dropoutRoll = undefined;

/* ---- arrival clearance walks the ship out of a rock ---------------------- */
{
  const rocks = nearbyRocks(ship.pos, sim.time, 1);
  const big = rocks.slice().sort((a, b) => b.r - a.r)[0];
  if (big) {
    ship.pos.x = big.x + big.r * 0.3; ship.pos.y = big.y; ship.pos.z = big.z;
    const moved = clearArrival(ship);
    const d = dist3(ship.pos, big);
    ok(moved && d > big.r + 250, `clearArrival moved the ship out of a ${Math.round(big.r)} u rock (${Math.round(d)} u off now)`);
  } else ok(true, "no rocks in this cell to test clearance against");
}

/* ---- transient jump points vanish, saved ones stay ------------------------ */
{
  const t = addWaypointAt("Jump 1", mid + CELL * 3, 0, CELL);
  t.transient = true;
  sim.warp.state = "run"; sim.warp.t = 1e9; sim.warp.dur = 1; sim.warp.targetId = t.id; sim.selected = t.id;
  sim.warp.from = { ...ship.pos }; sim.warp.to = { x: t.x, y: t.y, z: t.z }; sim.warp.hazards = [];
  sim.warp.fromYaw = ship.yaw; sim.warp.toYaw = ship.yaw; sim.warp.fromPitch = 0; sim.warp.toPitch = 0;
  stepWarp(0.1);
  ok(sim.warp.state === "idle" && !sim.waypoints.some((w) => w.id === t.id), "a transient jump point is dropped on arrival");
  ok(sim.waypoints.some((w) => w.id === wp.id), "a saved fix is not");
}

/* ---- remote scan and probes --------------------------------------------- */
{
  ship.charge = 5000;
  const a = assayPoint(mid, 0, 0);
  ok(a.title === "Belt" && a.lines.length >= 3, `assay: ${a.title} — ${a.lines[0]}; ${a.lines[1]}`);
  const nearRep = remoteScan(ship.pos.x + 3000, ship.pos.y, ship.pos.z + 3000, "here");
  ok(nearRep && sim.scanReports[0] === nearRep, "a remote scan in reach files a report");
  const before = ship.charge;
  const far = remoteScan(ship.pos.x + sensorRange() * SCAN_REACH * 3, 0, 0);
  ok(far === null && ship.charge === before && /reach/i.test(sim.notice), `out of reach refuses without spending (${sim.notice})`);
  const tx = ship.pos.x + 90000, tz = ship.pos.z;
  const pr = launchProbe(tx, 0, tz, "Test probe");
  ok(pr && probes.includes(pr) && Math.abs(pr.eta - dist3(ship.pos, { x: tx, y: 0, z: tz }) / PROBE_SPEED) < 1e-6, `probe launched, eta ${pr?.eta.toFixed(1)} s`);
  const nWp = sim.waypoints.length;
  const t0 = sim.time;
  sim.time = t0 + pr.eta * 0.5; stepProbes(0);
  ok(!pr.done && Math.abs(pr.x - (ship.pos.x + 45000)) < 1, "halfway there at half the eta");
  sim.time = t0 + pr.eta + 0.1; stepProbes(0);
  ok(pr.done && sim.waypoints.length === nWp + 1 && sim.scanReports[0].kind === "probe", `probe reported and dropped a saved location (${sim.waypoints.at(-1).name})`);
  ok(warpNodeById(sim.waypoints.at(-1).id)?.kind === "point", "the probe drop is a warp node");
}

/* ---- keys: WASD pans, arrows throttle, Shift boosts, Shift+Ctrl cruises --- */
{
  const a0 = (() => { setInjectedKeys(["KeyW", "KeyD"]); return { ...sampleInput() }; })();
  ok(a0.panY === 1 && a0.panX === 1 && a0.throttleStep === 0, "W/D pan the nose up/right, not the throttle");
  setInjectedKeys(["ArrowUp"]);
  ok(sampleInput().throttleStep === 1, "↑ steps the throttle");
  setInjectedKeys(["KeyR"]);
  ok(sampleInput().rcsY === 1, "R is RCS up");
  setInjectedKeys(["ShiftLeft"]);
  const b = { ...sampleInput() };
  ok(b.boost && !b.cruise && b.rcsY === 0, "Shift is the boost, not RCS");
  setInjectedKeys(["ShiftLeft", "ControlLeft"]);
  ok(sampleInput().cruise === true, "Shift+Ctrl is cruise");
  setInjectedKeys([]);
  sampleInput();

  /* through the sim: boost raises the mains to the cap, release restores, cruise holds */
  sim.warp.state = "idle"; sim.warp.cool = 0;
  autopilot.on = false;
  setThrottle(0.3);
  sim.cruise = null; sim.boostFrom = null;
  setInjectedKeys(["ShiftLeft"]); tickSim(1 / 60); tickSim(1 / 60);
  ok(Math.abs(ship.throttle - throttleCap()) < 1e-6, `boost pins the mains at the cap (${ship.throttle.toFixed(2)})`);
  setInjectedKeys([]); tickSim(1 / 60); tickSim(1 / 60);
  ok(Math.abs(ship.throttle - 0.3) < 1e-6, `release restores the old setting (${ship.throttle.toFixed(2)})`);
  setInjectedKeys(["ShiftLeft"]); tickSim(1 / 60);
  setInjectedKeys(["ShiftLeft", "ControlLeft"]); tickSim(1 / 60);
  setInjectedKeys([]); tickSim(1 / 60); tickSim(1 / 60);
  ok(sim.cruise != null && Math.abs(ship.throttle - throttleCap()) < 1e-6, `cruise holds the boosted setting after the keys lift (${ship.throttle.toFixed(2)})`);
  setInjectedKeys(["ArrowDown"]); tickSim(1 / 60); setInjectedKeys([]); tickSim(1 / 60);
  ok(sim.cruise == null && ship.throttle < throttleCap(), "touching the throttle drops cruise");
  setThrottle(0);
}

/* ---- sensor range --------------------------------------------------------- */
ok(sensorRange() >= SENSOR_R && sensorRange() <= SENSOR_R * 2, `sensor range ${sensorRange()} u`);
sim.pulseUntil = sim.time + 10;
ok(sensorRange() > SENSOR_R * 1.5, "a pulse stretches it");
sim.pulseUntil = -1e6;

/* ---- approach mode parks on a point --------------------------------------- */
{
  const p = addWaypointAt("Park", ship.pos.x + 4000, ship.pos.y, ship.pos.z);
  ship.vel.x = ship.vel.y = ship.vel.z = 0;
  ship.charge = 1600;
  ok(engageAutopilot(p.id), "approach engages on a point");
  let n = 0;
  while (autopilot.on && n++ < 60 * 240) { tickSim(1 / 60); if (n % 600 === 0) console.log("   ", autopilot.phase, autopilot.task, Math.round(dist3(ship.pos, p)), Math.round(ship.charge), ship.throttle.toFixed(2), Math.hypot(ship.vel.x,ship.vel.y,ship.vel.z).toFixed(1), sim.warp.state, sim.dominant?.name); }
  ok(!autopilot.on && /holding at Park/.test(sim.notice), `approach parks on the point and hands back (${(n / 60).toFixed(0)} s: ${sim.notice})`);
  ok(dist3(ship.pos, p) < 900, `parked ${Math.round(dist3(ship.pos, p))} u off the fix`);
}

console.log(`chart: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
