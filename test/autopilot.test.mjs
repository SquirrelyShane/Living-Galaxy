/* LIVING GALAXY — the power-aware autopilot and its mining loop.
 *
 *   node --import ./test/three-register.mjs test/autopilot.test.mjs
 */

import { sim, launchSim, tickSim, addWaypointAt, stashAt, smeltAll, stashDeposit, stashWithdraw, canSmeltAt } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { autopilot, engageMiningLoop, engageAutopilot, powerThrottle, sustainableThrottle, warpReserve, AP_POWER, bestPortFor, cycleAutoPlan } from "../js/autopilot.js";
import { touch } from "../js/input.js";
import { currentSystem, dist3 } from "../js/bodies.js";
import { BATTERY, cargoTotal } from "../js/ship.js";
import { stations } from "../js/stations.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("Loop", "terran", "mining", null);
launchSim("LoopTest", "sol");
sim.phase = "play";
const ship = sim.ship;
const belt = currentSystem.belt;
const mid = (belt.inner + belt.outer) / 2;
touch.panX = touch.panY = touch.rcsX = touch.rcsY = 0;
sim.dropoutRoll = 1;

/* ---- the power rule ------------------------------------------------------- */
{
  ship.shields = false; ship.turretsArmed = false; ship.localGravity = false; ship.miningMode = "off";
  tickSim(1 / 60);
  const sus = sustainableThrottle(ship);
  /* 0.3.01: the starter core is floored at 130 kW, so a lean bus can now carry full rated thrust */
  ok(sus > 0.2 && sus <= 1, `a lean bus sustains ${sus.toFixed(2)} throttle`);
  ship.charge = BATTERY;
  ok(powerThrottle(ship, 1) >= sus, "a full battery may dip into the reserve for momentum");
  ship.charge = BATTERY * 0.4;
  const mid40 = powerThrottle(ship, 1);
  ok(mid40 <= Math.max(sus, AP_POWER.eco) + 1e-9 && mid40 > 0, `at 40% the mains hold the sustainable setting (${mid40.toFixed(2)})`);
  ship.charge = BATTERY * 0.1;
  ok(powerThrottle(ship, 1) === 0, "at the 20% floor the mains go cold");
  ship.charge = warpReserve() * 0.9;
  ok(powerThrottle(ship, 1, true) <= sus * 0.8 + 1e-9, "a pending jump keeps the spool's reserve untouched");
  ok(warpReserve() > 300, `warp reserve is ${Math.round(warpReserve())} (min charge + the spool's draw + margin)`);
  ship.charge = BATTERY;
}

/* ---- the loop: seam → cut → port → sell → back out --------------------------- */
{
  ship.pos.x = mid; ship.pos.y = 0; ship.pos.z = 0; sim.dominant = null;
  ship.vel.x = ship.vel.y = ship.vel.z = 0;
  ok(engageMiningLoop({ x: mid, y: 0, z: 0, name: "Test seam" }), "the loop engages on a belt seam");
  ok(sim.autoPlan.onDock === "sell" && sim.autoPlan.loop, "default plan: sell, and go back out");
  const seen = new Set();
  let n = 0, cr0 = ship.credits, cut = false;
  while (n++ < 60 * 1500 && autopilot.on) {
    tickSim(1 / 60);
    seen.add(autopilot.phase);
    if (autopilot.phase === "mine" && ship.miningMode !== "off") cut = true;
    if (autopilot.loops >= 1 && autopilot.phase === "mine") break;
  }
  ok(cut, "the cutter ran at the seam");
  ok(seen.has("lane") && seen.has("dock") && seen.has("trade"), `it took the entry lane, the tractor and the desk (${[...seen].join(" → ")})`);
  ok(autopilot.loops === 1 && ship.credits > cr0, `one run sold for ${Math.round(autopilot.earned)} cr`);
  ok(autopilot.on && autopilot.phase === "mine", `…and it is back on a rock (${(n / 60).toFixed(0)} s)`);
  ok(ship.charge > BATTERY * AP_POWER.floor, `the battery never hit the floor (${Math.round(ship.charge)})`);
}

/* ---- the plan: stash and smelt ---------------------------------------------- */
{
  const st = stations.find((s) => canSmeltAt(s));
  ok(st, "the sky has an industrial port with a smelter");
  ok(cycleAutoPlan() === "stash" && cycleAutoPlan() === "smelt" && cycleAutoPlan() === "sell", "the plan cycles sell → stash → smelt");
  sim.autoPlan.onDock = "smelt";
  ok(bestPortFor("smelt") && canSmeltAt(bestPortFor("smelt")), `smelt picks a port with a works (${bestPortFor("smelt")?.name})`);
  /* the desk by hand */
  ship.dockedAt = st.id;
  ship.hold = { iron_ore: 100 };
  ok(smeltAll() === null && (ship.hold.iron ?? 0) > 50 && !ship.hold.iron_ore, `smelting turned 100 iron ore into ${Math.round(ship.hold.iron ?? 0)} iron`);
  ok(stashDeposit("all") === null && cargoTotal(ship) === 0 && stashAt(st.id).length === 1, "the locker takes the hold");
  ok(stashWithdraw("all") === null && (ship.hold.iron ?? 0) > 50 && stashAt(st.id).length === 0, "…and gives it back");
  ship.dockedAt = null;
}

/* ---- the buttons build missions now ----------------------------------------- */
{
  const { mission, stopMission } = await import("../js/mission/run.js");
  const { disengageAutopilot } = await import("../js/autopilot.js");
  const st2 = stations.find((s) => !s.hostile);
  ship.dockedAt = null;
  ok(engageAutopilot(st2.id) && mission.active?.steps[0].op === "APPROACH" && mission.active.builtin && autopilot.on && autopilot.mode === "approach" && autopilot.targetId === st2.id, "engageAutopilot builds a one-step APPROACH mission and mirrors on/mode/target");
  ok(mission.active.defaults.thrustCap === 1 && mission.active.defaults.warp === "auto" && sim.autoPlan.defaults?.warp === "auto", "…with the HUD's default plan (sim.autoPlan.defaults)");
  disengageAutopilot("test");
  ok(!autopilot.on && !mission.active, "disengageAutopilot stops the mission");
  sim.autoPlan.loop = false;
  ok(engageMiningLoop({ x: mid, y: 0, z: 0, name: "Test seam" }) && mission.active.loop.mode === "none" && mission.active.steps.map((x) => x.op).join(",") === "MINE,DOCK,SMELT,SELL,CHARGE", `REPEAT off → loop none; on dock smelt → SMELT then SELL (${mission.active.steps.map((x) => x.op).join(" ")})`);
  stopMission("test");
  sim.autoPlan.loop = true;
}

console.log(`autopilot: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
