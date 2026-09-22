/* LIVING GALAXY — the bus: brownout, shed, the autopilot's overload verdict.
 *
 *   node --import ./test/three-register.mjs test/power.test.mjs
 *
 * 0.3.01's bug hunt, pinned by behaviour. The report was "everything says the
 * bus is overloaded, shed shields — and after shedding the cutter and shields
 * there is still not enough power to select approach".
 */

const store = new Map();
globalThis.localStorage ??= { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { sim, launchSim, tickSim, addWaypointAt } = await import("../js/sim.js");
const { makePilot } = await import("../js/pilot.js");
const AP = await import("../js/autopilot.js");
const { touch } = await import("../js/input.js");
const { BATTERY, DRAW, buildDemand, stepPower, makeShip, batteryCap } = await import("../js/ship.js");
const { stations } = await import("../js/stations.js");
const { startMission, mission } = await import("../js/mission/run.js");
const { oneStep } = await import("../js/mission/script.js");
const { hullTuneFor, shipById } = await import("../js/shipdb.js");
const { captain, retakeCommand } = await import("../js/npc/captain.js");
const { currentSystem } = await import("../js/bodies.js");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const tick = (s) => { for (let i = 0; i < s * 60; i++) tickSim(1 / 60); };

makePilot("Bus", "terran", "mining", null);
launchSim("BusTest", "sol");
sim.phase = "play";
touch.panX = touch.panY = touch.rcsX = touch.rcsY = 0;
sim.dropoutRoll = 1;
const ship = sim.ship;
tick(0.5);
const port = stations.find((s) => !s.hostile)?.id;

/* ---- the starter can carry its own default loadout ------------------------ */
{
  ok(ship.reactor >= 130 - 1e-6, `starter core ${ship.reactor.toFixed(1)} kW (was 110.5 — floored at the stock 130)`);
  ok(hullTuneFor(shipById("general_a")).reactor === 1, "a trainer's core is floored at 1.0×");
  ok(AP.busIdle(ship).load < ship.reactor, `default bus at idle ${AP.busIdle(ship).load.toFixed(1)} kW fits the core`);
}

/* ---- the reported bug: a stale overload verdict ---------------------------- */
{
  ship.charge = BATTERY * 0.1; ship.shieldCharge = 40; ship.shields = true; ship.turretsArmed = true; ship.localGravity = true;
  ship.miningMode = "overdrive"; ship.tune.reactorTrim = 0.8; // a bus that genuinely cannot refill itself
  tick(0.1);
  ok(AP.busOverload(ship).over, `overdrive cutter + regen on a trimmed core is an overload (${AP.busIdle(ship).load.toFixed(0)} on ${ship.reactor.toFixed(0)})`);
  ok(AP.engageAutopilot(port, "approach"), "engage accepted");
  tick(0.5);
  ok(!AP.autopilot.on, "…and stands down on a real overload");
  ok(/SHLD \d+/.test(sim.notice) && /MINER \d+/.test(sim.notice), `the stand-down names the switches with their kW: "${sim.notice}"`);
  ok(!/\(1 2 5\)|\(Y\)/.test(sim.notice), "no keyboard-only hints on a phone");
  ok(ship.miningMode === "overdrive", "stand-down does not switch a cutter back ON under a pilot shedding load");
  ship.miningMode = "off"; ship.shields = false; ship.tune.reactorTrim = 1;
  tick(1);
  ok(!AP.busOverload(ship).over, "shedding the cutter and shields clears the verdict");
  ok(AP.engageAutopilot(port, "approach"), "re-engage accepted");
  tick(1);
  ok(AP.autopilot.on, `…and the autopilot keeps the ship (0.3 stood down on the stale flag) — "${sim.notice}"`);
  ok(/coasting/i.test(sim.notice), "a cold-mains autopilot under the floor says why it is not moving");
  AP.disengageAutopilot("test");
  ship.charge = BATTERY;
}

/* ---- stepPower: no power from nothing, breathe before thrust -------------- */
{
  const s = makeShip();
  s.hullTune = { thrust: 1.2, turn: 1, reactor: 1, cargo: 1 };
  s.charge = 0; s.throttle = 1; s.miningMode = "off"; s.extraDraw = 50; // an unsheddable robot deck forces the mains to derate
  let o2Min = 100, powerFromNothing = 0, flips = 0, wasShields = null, scaleMin = 9;
  for (let i = 0; i < 60 * 30; i++) {
    const d = buildDemand(s, 0, false, 0);
    const before = s.charge;
    stepPower(s, 1 / 60, d);
    if (s.charge <= 0 && s.load > s.reactor + 0.01) powerFromNothing++;
    if (before > 0 && s.charge === 0 && s.load > s.reactor + 0.01) powerFromNothing++;
    if (wasShields !== null && s.powered.shields !== wasShields) flips++;
    wasShields = s.powered.shields;
    o2Min = Math.min(o2Min, s.o2);
    scaleMin = Math.min(scaleMin, s.thrustScale);
  }
  ok(powerFromNothing === 0, `a flat battery never bills more than the core makes (${powerFromNothing} ticks over)`);
  ok(o2Min > 90, `mains derate before life support is cut (O2 low ${o2Min.toFixed(1)})`);
  ok(scaleMin < 1.2 && scaleMin > 0.12, `derate multiplies the hull's own thrust (low ${scaleMin.toFixed(2)})`);
  ok(flips < 30, `a brownout latches instead of strobing (${flips} shield flips in 30 s; 0.3 did ~1000)`);
  const t = s.draws;
  const sum = t.life + t.avionics + t.engines + t.shields + t.turrets + t.cutter + t.bench + t.gravity + t.ops + t.robots + t.warp;
  ok(Math.abs(sum - s.load) < 0.01, `ship.draws adds up to the load (${sum.toFixed(2)} vs ${s.load.toFixed(2)})`);
  s.mods = { ...(s.mods ?? {}), life: 1.5 }; s.o2 = 100;
  stepPower(s, 1 / 60, buildDemand(s, 0, false, 0));
  ok(Math.abs(s.draws.life - DRAW.lifeSupport * 1.5 * 0.45) < 1e-6, "life support is one number (mods.life × setpoint factor)");
}

/* ---- the mining bus bills what is running ---------------------------------- */
{
  const s = makeShip();
  s.miningMode = "off"; s.benchDraw = 16;
  ok(buildDemand(s, 0, false, 0).mining === 16, "cutter stowed, bench running: 16 kW, not 24 + 16");
  s.benchDraw = 0;
  stepPower(s, 1 / 60, buildDemand(s, 0, false, 0));
  ok(!s.powered.mining, "nothing on the mining bus: it reads cold");
}

/* ---- a relaunch in the same page keeps its hull tune ----------------------- */
{
  const r1 = sim.ship.reactor;
  launchSim("BusTest2", "sol");
  sim.phase = "play";
  tickSim(1 / 60);
  ok(sim.ship.hullTune && Math.abs(sim.ship.reactor - r1) < 1e-6, `second launch still tuned (${sim.ship.reactor.toFixed(1)} kW, hullTune ${Boolean(sim.ship.hullTune)})`);
}

/* ---- the conn and the cutter ----------------------------------------------- */
{
  const s2 = sim.ship;
  s2.charge = batteryCap(s2);
  s2.miningMode = "closest";
  const wp = addWaypointAt("fix", s2.pos.x - 200000, s2.pos.y, s2.pos.z);
  ok(startMission(oneStep("APPROACH", { kind: "wp", id: wp.id, name: wp.name }, { warp: "never" })), "a one-step approach starts");
  tick(1);
  ok(s2.miningMode === "off", "the autopilot stows the cutter while it flies");
  AP.disengageAutopilot("test");
  ok(s2.miningMode === "closest", "…and hands back the PILOT's cutter setting");
  captain.holder = "aria"; captain.member = { id: "aria", name: "ARIA" };
  s2.throttle = 1; touch.throttle = 1;
  retakeCommand();
  tick(0.2);
  ok(s2.throttle === 0, "retaking the conn does not inherit the holder's full mains");
}

console.log(`power: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
