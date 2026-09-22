/* LIVING GALAXY — mission scripts and the executor: schema, conditions, presets, and the
 * autopilot flying them (MINE LOOP end to end, thrust caps, warp policies, the ask).
 *
 *   node --import ./test/three-register.mjs test/mission.test.mjs
 */

import { sim, launchSim, tickSim, addWaypointAt, POINT_ARRIVE_R } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { autopilot, engageMiningLoop, AP_POWER } from "../js/autopilot.js";
import { touch } from "../js/input.js";
import { currentSystem, dist3 } from "../js/bodies.js";
import { BATTERY } from "../js/ship.js";
import { chat } from "../js/chat.js";
import { upgrades } from "../js/upgrades.js";
import {
  OPS, makeMission, makeStep, oneStep, validate, evalCond, describeStep, serialize, deserialize, presets, MISSIONS_KEY, loadMissions, saveMissions,
} from "../js/mission/script.js";
import {
  mission, missionHooks, startMission, stopMission, pauseMission, resumeMission, answerAsk, missionStatusLine, stepThrustCap, stepWarpPolicy, RUN_KEY, saveRun, restoreRun,
} from "../js/mission/run.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

/* ---- the schema, no sim needed ---------------------------------------------- */
{
  const m = makeMission({ name: "T", steps: [makeStep("MINE", { kind: "seam" }), makeStep("DOCK", { kind: "best-buyer" }), makeStep("SELL")], loop: { mode: "count", count: Infinity }, defaults: { thrustCap: 0.75, warp: "ask" } });
  ok(m.steps.every((s) => s.id) && m.steps[0].until?.k === "hold" && m.steps[2].args?.what === "ore", "makeStep fills the op's default until/args");
  const back = deserialize(serialize(m));
  ok(back && back.name === "T" && back.steps.length === 3 && back.loop.count === Infinity && back.defaults.warp === "ask", "serialize → deserialize round-trips (Infinity loop count included)");
  ok(back.steps[0].until.v === 0.9 && back.steps[1].target.kind === "best-buyer", "…with the steps intact");
  ok(deserialize("not json") === null && deserialize({ steps: [{ op: "FLY" }] }) === null, "garbage and unknown ops do not deserialize");
  ok(validate(m).length === 0, "a sane mission validates clean");
  const bad = makeMission({ steps: [makeStep("DOCK")] });
  ok(validate(bad).some((e) => e.step === 0 && /needs a target/.test(e.msg)), "validate catches a DOCK with no target");
  ok(validate(makeMission({ steps: [makeStep("WAIT", null, { until: { k: "mood", op: ">=", v: 1 } })] })).some((e) => /unknown condition/.test(e.msg)), "…and an unknown condition key");
  ok(validate(makeMission({ steps: [makeStep("HOLD")], loop: { mode: "count", count: 0 } })).some((e) => /loop count/.test(e.msg)), "…and a loop count under 1");
  ok(validate(makeMission({ steps: [makeStep("MINE", { kind: "best-buyer" })] })).some((e) => /cannot target/.test(e.msg)), "…and a MINE aimed at a port");
  for (const p of presets()) ok(validate(p).length === 0, `preset ${p.name} validates clean`);
  ok(presets().map((p) => p.name).join(",") === "MINE LOOP,TRADE RUN,SURVEY SWEEP,PATROL", "the four presets");
  const one = oneStep("APPROACH", { kind: "body", id: "mars", name: "Mars" }, { thrustCap: 0.5 });
  ok(one.steps.length === 1 && one.loop.mode === "none" && one.defaults.thrustCap === 0.5 && one.defaults.warp === "auto" && one.builtin, "oneStep builds a one-step builtin mission with defaults");
  ok(Object.keys(OPS).length === 18, "eighteen ops (0.3.03: REPAIR; 0.3.06: REFIT, BUILD; 0.3.10: FAB)");
}

/* ---- conditions --------------------------------------------------------------- */
{
  const snap = { hold: 0.95, credits: 1200, charge: 0.5, hull: 80, time: 30, docked: true, cargoOf: (id) => (id === "iron_ore" ? 40 : 0), loops: 2 };
  ok(evalCond({ k: "hold", op: ">=", v: 0.9 }, snap) && !evalCond({ k: "hold", op: "<", v: 0.9 }, snap), "a leaf compares");
  ok(evalCond({ k: "docked", op: "==", v: true }, snap) && evalCond({ k: "cargoOf", id: "iron_ore", op: ">", v: 10 }, snap), "docked and cargoOf read the snapshot");
  ok(evalCond({ all: [{ k: "credits", op: ">", v: 1000 }, { k: "loops", op: ">=", v: 2 }] }, snap), "all: every leaf");
  ok(!evalCond({ all: [{ k: "credits", op: ">", v: 1000 }, { k: "hull", op: ">", v: 90 }] }, snap), "all: one false leaf fails it");
  ok(evalCond({ any: [{ k: "hull", op: ">", v: 90 }, { k: "time", op: ">=", v: 30 }] }, snap), "any: one true leaf carries it");
  ok(evalCond({ not: { k: "charge", op: ">", v: 0.8 } }, snap) && !evalCond({ not: { all: [] } }, snap), "not: flips (and an empty all is true)");
  ok(!evalCond(null, snap) && !evalCond({ k: "nope", op: ">", v: 1 }, snap), "null and unknown keys are never met");
  ok(describeStep(makeStep("MINE", { kind: "seam" }, { thrustCap: 0.75, warp: "ask" })) === "MINE the seam until hold ≥ 90% · ≤75% · warp ask", `describeStep: ${describeStep(makeStep("MINE", { kind: "seam" }, { thrustCap: 0.75, warp: "ask" }))}`);
}

/* ---- the save list (a localStorage shim) --------------------------------------- */
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

makePilot("Loop", "terran", "mining", null);
launchSim("MissionTest", "sol");
sim.phase = "play";
const ship = sim.ship;
const belt = currentSystem.belt;
const mid = (belt.inner + belt.outer) / 2;
touch.panX = touch.panY = touch.rcsX = touch.rcsY = 0;
sim.dropoutRoll = 1;
ship.shields = false; ship.turretsArmed = false; ship.localGravity = false; ship.miningMode = "off";
tickSim(1 / 60);

{
  ok(MISSIONS_KEY() === "lgaa.missions.v1:MissionTest", "missions are saved per pilot");
  const list = [presets()[0], makeMission({ name: "Mine", steps: [makeStep("HOLD")] })];
  ok(saveMissions(list) === null && loadMissions().length === 2 && loadMissions()[1].name === "Mine", "saveMissions → loadMissions");
}

/* ---- gating: loops and multi-step want the Mission core --------------------------- */
/* CONTRACT CHANGED IN 0.3.14. This block used to assert that a PRESET was
 * refused without a Mission core. That was the bug: the core is meant to gate
 * plans the pilot WRITES, and gating the four the game ships with left a
 * coreless pilot with no multi-step autopilot at all. Presets carry
 * `builtin: true` now and fly as they are; a copy of one (the editor strips the
 * flag) is gated like anything else you build, which is what is asserted here. */
{
  const p = presets()[0];
  sim.autoPlan.seam = { x: mid, y: 0, z: 0, name: "Test seam" };
  ok(p.builtin === true, "the presets are builtin");
  ok(startMission(p) && mission.active, "a preset flies with no core fitted");
  stopMission("test");

  const mine = makeMission({ name: "My loop", steps: [makeStep("HOLD"), makeStep("HOLD")] });
  ok(!mine.builtin, "a mission the pilot builds is not builtin");
  ok(!startMission(mine) && /Mission core/.test(sim.notice), "and without a core a multi-step one of those is refused");
  const looped = makeMission({ name: "My loop", steps: [makeStep("HOLD")], loop: { mode: "count", count: 2 } });
  ok(!startMission(looped) && /Mission core/.test(sim.notice), "so is a loop");
  const copy = makeMission({ ...JSON.parse(JSON.stringify(p)), id: undefined, builtin: false });
  ok(!startMission(copy) && /Mission core/.test(sim.notice), "a COPY of a preset is refused — the flag does not travel");

  ok(startMission(oneStep("HOLD", null)) && mission.active && mission.state === "running", "…a one-step still flies");
  stopMission("test");
  ok(!mission.active && !autopilot.on && mission.state === "idle", "stopMission clears the run");
  upgrades.owned.push("nav_core");
}

/* ---- MINE LOOP end to end ----------------------------------------------------------- */
{
  ship.pos.x = mid; ship.pos.y = 0; ship.pos.z = 0; sim.dominant = null;
  ship.vel.x = ship.vel.y = ship.vel.z = 0;
  ship.charge = BATTERY;
  const steps = [];
  missionHooks.onStep = (s, i) => steps.push(`${i}:${s.op}`);
  ok(engageMiningLoop({ x: mid, y: 0, z: 0, name: "Test seam" }), "the loop engages on a belt seam");
  ok(mission.active?.name === "MINE LOOP" && mission.active.builtin && mission.active.loop.mode === "count" && mission.active.loop.count === Infinity, "engageMiningLoop builds the MINE LOOP mission (repeat → count ∞)");
  ok(mission.active.steps.map((s) => s.op).join(">") === "MINE>DOCK>SELL>CHARGE", `steps: ${mission.active.steps.map((s) => s.op).join(" > ")}`);
  ok(autopilot.on && autopilot.mode === "mine", "autopilot mirrors on/mode");
  ok(store.has(RUN_KEY()), "the run is persisted per sky and callsign");
  const seen = new Set();
  let n = 0, cr0 = ship.credits, cut = false, maxT = 0;
  while (n++ < 60 * 1500 && autopilot.on) {
    tickSim(1 / 60);
    seen.add(autopilot.phase);
    maxT = Math.max(maxT, ship.throttle);
    if (autopilot.phase === "mine" && ship.miningMode !== "off") cut = true;
    if (mission.stats.loops >= 1 && autopilot.phase === "mine") break;
  }
  ok(cut, "the cutter ran at the seam");
  ok(seen.has("lane") && seen.has("dock") && seen.has("trade"), `it took the entry lane, the tractor and the desk (${[...seen].join(" → ")})`);
  ok(mission.stats.loops === 1 && autopilot.loops === 1 && ship.credits > cr0, `one run sold for ${Math.round(mission.stats.earned)} cr (autopilot.earned ${Math.round(autopilot.earned)})`);
  ok(autopilot.on && autopilot.phase === "mine" && mission.stepIx === 0, `…and it is back on a rock (${(n / 60).toFixed(0)} s)`);
  ok(ship.charge > BATTERY * AP_POWER.floor, `the battery never hit the floor (${Math.round(ship.charge)})`);
  ok(maxT <= 1 + 1e-9, `never past rated thrust (${maxT.toFixed(2)})`);
  ok(steps.slice(0, 5).join(",") === "0:MINE,1:DOCK,2:SELL,3:CHARGE,0:MINE", `onStep fired in order (${steps.slice(0, 5).join(" ")})`);
  const line = missionStatusLine();
  ok(/^MINE LOOP · 1\/4 MINE/.test(line) && /1 loop/.test(line) && / cr$/.test(line), `status line: ${line}`);
  /* pause hands the stick back and keeps the place; resume picks it up */
  pauseMission();
  ok(!autopilot.on && mission.state === "paused" && mission.active && ship.throttle === 0, "pause: stick back at zero, mission kept");
  resumeMission();
  ok(autopilot.on && mission.state === "running", "resume flies again");
  stopMission("test");
  ok(!store.has(RUN_KEY()), "stop clears the persisted run");
  missionHooks.onStep = null;
}

/* clear of the belt and every well for the legs */
const clear = () => { ship.pos.x = belt.inner * 0.55; ship.pos.y = 4000; ship.pos.z = belt.inner * 0.4; sim.dominant = null; ship.vel.x = ship.vel.y = ship.vel.z = 0; ship.charge = BATTERY; };

/* ---- a thrust cap is a ceiling ---------------------------------------------------- */
{
  clear();
  const p = addWaypointAt("Cap fix", ship.pos.x - 40000, ship.pos.y, ship.pos.z);
  const m = oneStep("APPROACH", { kind: "wp", id: p.id, name: p.name }, { thrustCap: 0.5 });
  ok(startMission(m), "an approach with a 50% cap starts");
  ok(Math.abs(stepThrustCap(m.steps[0]) - 0.5) < 1e-9 && stepWarpPolicy(m.steps[0]) === "auto", "stepThrustCap / stepWarpPolicy read the defaults");
  let n = 0, maxT = 0;
  while (autopilot.on && n++ < 60 * 400) { tickSim(1 / 60); maxT = Math.max(maxT, ship.throttle); }
  ok(!autopilot.on && mission.state === "done" && dist3(ship.pos, p) < 900, `parked on the fix in ${(n / 60).toFixed(0)} s (${Math.round(dist3(ship.pos, p))} u off)`);
  /* the floor is the sustainable setting: once the battery leaves the dip band the power rule, not the cap, sets the mains */
  ok(maxT > 0.2 && maxT <= 0.5 + 1e-9, `the throttle never passed the cap (${maxT.toFixed(2)})`);
  ok(/holding at Cap fix/.test(sim.notice), `a one-step mission ends with the leg's own line (${sim.notice})`);
}

/* ---- warp "never" is sublight only ------------------------------------------------ */
{
  clear();
  const far = addWaypointAt("Far fix", ship.pos.x - 95000, ship.pos.y, ship.pos.z);
  ok(startMission(oneStep("APPROACH", { kind: "wp", id: far.id, name: far.name }, { warp: "never" })), "a sublight-only approach starts");
  let n = 0, ran = false, climbed = false;
  while (autopilot.on && n++ < 60 * 1500) { tickSim(1 / 60); if (sim.warp.state === "run") ran = true; if (autopilot.phase === "align" || autopilot.phase === "warp") climbed = true; }
  ok(!ran && !climbed, "the core never spooled and nav never aligned for a jump");
  ok(!autopilot.on && dist3(ship.pos, far) < 900, `…and it still got there in ${(n / 60).toFixed(0)} s (${Math.round(dist3(ship.pos, far))} u off)`);
}

/* ---- warp "ask" parks aligned and asks ------------------------------------------- */
{
  clear();
  const fix = addWaypointAt("Ask fix", mid, 0, 0);
  const asks = [];
  missionHooks.onAsk = (a) => asks.push(a);
  const n0 = chat.log.length;
  ok(startMission(oneStep("GOTO", { kind: "wp", id: fix.id, name: fix.name }, { warp: "ask" })), "a GOTO with warp: ask starts");
  let n = 0;
  while (mission.state !== "asking" && autopilot.on && n++ < 60 * 300) tickSim(1 / 60);
  ok(mission.state === "asking" && mission.ask?.node.id === fix.id && autopilot.phase === "ask", `parks in "asking" at the align point (${(n / 60).toFixed(0)} s)`);
  ok(asks.length === 1, "missionHooks.onAsk fired once");
  const post = chat.log.slice(n0).find((m) => m.from === "AUTOPILOT" && m.channel === "sys");
  ok(post && post.links.map((l) => l.label).join("/") === "JUMP/SUBLIGHT/ABORT" && /Jump to Ask fix\?/.test(post.text), `the ask went to the sys channel with links (${post?.text})`);
  for (let i = 0; i < 60 * 5; i++) tickSim(1 / 60);
  ok(mission.state === "asking" && sim.warp.state === "idle" && ship.throttle === 0, "…and waits with the mains off");
  post.links[0].run();
  ok(mission.state === "running" && autopilot.warpAllowed === fix.id, "JUMP on the chat link allows the jump");
  let spooled = false;
  n = 0;
  while (n++ < 60 * 120 && autopilot.on) { tickSim(1 / 60); if (sim.warp.state !== "idle") { spooled = true; break; } }
  ok(spooled, `the core spools after the answer (${sim.warp.state})`);
  while (sim.warp.state !== "idle" || autopilot.on) tickSim(1 / 60);
  ok(dist3(ship.pos, { x: mid, y: 0, z: 0 }) < POINT_ARRIVE_R + 400, "…and the jump lands on the fix");
  ok(answerAsk("jump") === null && mission.state !== "asking", "answerAsk outside an ask is a no-op");
  missionHooks.onAsk = null;
}

/* ---- warp "ask" answered SUBLIGHT and ABORT ------------------------------------------ */
{
  clear();
  const fix = addWaypointAt("Ask fix 2", mid, 0, 0);
  startMission(oneStep("GOTO", { kind: "wp", id: fix.id, name: fix.name }, { warp: "ask" }));
  let n = 0;
  while (mission.state !== "asking" && autopilot.on && n++ < 60 * 300) tickSim(1 / 60);
  ok(mission.state === "asking", "asks again");
  answerAsk("sublight");
  ok(mission.state === "running" && stepWarpPolicy(mission.active.steps[0]) === "never", "SUBLIGHT turns this step's policy to never");
  for (let i = 0; i < 60 * 20; i++) tickSim(1 / 60);
  ok(autopilot.on && (autopilot.phase === "cruise" || autopilot.phase === "brake") && sim.warp.state === "idle", `…and it cruises (${autopilot.phase})`);
  stopMission("test");
  startMission(oneStep("GOTO", { kind: "wp", id: fix.id, name: fix.name }, { warp: "ask" }));
  n = 0;
  while (mission.state !== "asking" && autopilot.on && n++ < 60 * 300) tickSim(1 / 60);
  answerAsk("abort");
  ok(!autopilot.on && !mission.active && /aborted/.test(sim.notice), `ABORT stands the autopilot down (${sim.notice})`);
}

/* ---- a saved run comes back paused ------------------------------------------------- */
{
  const m = makeMission({ name: "Round", steps: [makeStep("HOLD", null, { until: { k: "time", op: ">=", v: 30 } }), makeStep("WAIT")], loop: { mode: "count", count: 2 } });
  ok(startMission(m), "a two-step loop starts with the core fitted");
  for (let i = 0; i < 60 * 40; i++) tickSim(1 / 60);
  ok(mission.stepIx === 1, "HOLD until time ≥ 30 s moved on to WAIT");
  saveRun();
  const raw = store.get(RUN_KEY());
  mission.active = null; mission.state = "idle"; autopilot.on = false; mission.key = "";
  store.set(RUN_KEY(), raw);
  ok(restoreRun() && mission.state === "paused" && mission.active?.name === "Round" && mission.stepIx === 1 && !autopilot.on, "restoreRun brings the run back paused at the same step");
  ok(!restoreRun(), "…once per sky");
  resumeMission();
  ok(autopilot.on && mission.state === "running", "and RESUME flies it on");
  stopMission("test");
}

console.log(`mission: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
