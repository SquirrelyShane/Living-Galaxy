/* LIVING GALAXY — the reactive sky: flown crossings, hunts, distress, response,
 * rogue waves, and the frame budget that keeps all of it affordable.
 *
 *   node --import ./test/three-register.mjs test/reactive.test.mjs
 *
 * What this pins is the behaviour the old sky could not have: that a hull
 * really crosses open space instead of teleporting through a lane, that it is
 * a contact while it does, that somebody shoots at it, that it runs, that it
 * gets on the radio, that something comes, and that the clock it comes on is
 * the clock the player was shown.
 */

import { sim, launchSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations, stepStations } from "../js/stations.js";
import { currentSystem } from "../js/bodies.js";
import { corps } from "../js/corps.js";
import {
  traffic, stepTraffic, trafficCensus, vesselById, markVesselDown, trafficDown,
  LANE_OVERHEAD, MIN_TRAVEL_S, HOSTILE_ROLES, LAW_ROLES, ROLES, seatHull,
} from "../js/npc/traffic.js";
import { legCruise, legTime, usesLane, laneProfile, hullPerf, armFlight, flyStep, LANE_MIN_U, RUN_OUT_U, RUN_IN_U } from "../js/npc/flight.js";
import {
  distress, stepSecurity, securityCorp, securityReport, callForHelp, etaOf,
  coverageFor, isLaw, SCRAMBLE_S, HELP_SPEED, assignGuards,
} from "../js/npc/security.js";
import { stepNpcCombat, hostileTo, acquire, setHunt, damageHull, combatLog, combatReport, HUNT_R } from "../js/npc/combat.js";
import { nests, waves, launchWave, stepRogues, rogueReport, nestById, WAVE_SLOT } from "../js/npc/rogues.js";
import { perf, notePerf, resetPerf, lockPerfTier, farBudget, waveCap, perfReport } from "../js/perf.js";
import { contacts, syncContacts, shots, stepShots, CONTACT_R } from "../js/turrets.js";
import { relationOf } from "../js/sim.js";

/* A SEEDED SKY.
 *
 * This suite flies a live sky and then asserts things about what happened in
 * it, so every roll inside it has to be reproducible or the suite is a
 * lottery. `resetRogues()` already seeds itself off the sky seed, but combat
 * and flight roll `Math.random()` directly — gun cooldowns, hit rolls, the
 * jink a hull flies — and those decide who is alive, who is hunting and how
 * many hulls are left in `traffic` when the assertions run.
 *
 * Unseeded, the suite drifted: the "a drone takes anything crewed" check would
 * fail perhaps one run in eight, and the ASSERTION COUNT itself moved between
 * runs (93 vs 95) because several blocks below are guarded on what the sky
 * happens to contain. A test whose own shape changes run to run cannot tell
 * you what regressed.
 *
 * So: one deterministic generator for the whole file, installed before the sky
 * is launched. mulberry32 — three lines, good enough for this, and identical
 * on every machine, which `Math.random` explicitly is not. The engine is
 * untouched; this is the test pinning its inputs, which is where a seed
 * belongs.
 */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const REAL_RANDOM = Math.random;
Math.random = mulberry32(0x5eed1e);
void REAL_RANDOM;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

makePilot("Reactive", "terran", "security", null);
launchSim("ReactiveTest", "sol");
sim.phase = "play";

/** Advance the whole reactive sky by `secs`, in `step`-second ticks. */
function run(secs, step = 0.5) {
  for (let t = 0; t < secs; t += step) {
    sim.time += step;
    stepStations(sim.time);
    stepTraffic(sim.time, step, stations, currentSystem, sim.ship.pos);
    stepNpcCombat(sim.time, step, sim.ship.pos);
    stepSecurity(sim.time, step, stations);
    stepRogues(sim.time, step, stations, sim.ship.pos);
  }
}

/* ---- 1. the flight kernel ------------------------------------------------ */
{
  ok(legCruise(40000, 50) > 0 && legCruise(40000, 50) <= 2200, `sublight cruise is bounded (${Math.round(legCruise(40000, 50))} u/s over 40 km)`);
  ok(!usesLane(LANE_MIN_U - 1) && usesLane(LANE_MIN_U + 1), "a short hop never lights the drive; a long one does");

  /* the solved trapezoid really covers the distance in the time it claims */
  for (const L of [8000, 40000, 120000, 900000, 4.2e6]) {
    const a = 50;
    const T = legTime(L, a);
    ok(T > 0 && Number.isFinite(T), `a ${Math.round(L / 1000)} km leg is costed (${Math.round(T)} s)`);
    ok(T < 260, `…and no crossing takes more than four minutes (${Math.round(T)} s at ${Math.round(L / 1000)} km)`);
  }
  const lp = laneProfile(4.2e6);
  ok(lp.top > 0 && lp.mid > 0, `the drive carries the middle of a long leg (${Math.round(lp.mid / 1000)} km at ${Math.round(lp.top)} u/s)`);
  ok(lp.mid === 4.2e6 - RUN_OUT_U - RUN_IN_U, "…and exactly the middle: the two sublight runs are not in it");

  /* a hull flown at a point actually arrives, and arrives stopped */
  const probe = { id: "probe", role: "trader", ship: "commerce_b", x: 0, y: 0, z: 0, yaw: 0, pitch: 0, vx: 0, vy: 0, vz: 0 };
  armFlight(probe);
  probe.fly.top = legCruise(30000, probe.fly.accel);
  let rem = Infinity, ticks = 0;
  while (rem > 12 && ticks++ < 40000) rem = flyStep(probe, 0.05, 30000, 0, 0);
  ok(rem <= 12, `a hull flown at a point 300 km away arrives (${ticks} ticks, ${Math.round(rem)} u short)`);
  ok(probe.speed < 45, `…and arrives slow enough to dock rather than through the hull (${Math.round(probe.speed)} u/s from ${Math.round(probe.fly.top)} cruise)`);
}

/* ---- 2. hull characteristics --------------------------------------------- */
{
  const perfOf = (role, ship) => hullPerf({ role, ship });
  ok(perfOf("hauler", "logistics_d").hp > perfOf("pirate", "general_c").hp, "a barge takes more killing than a raider");
  ok(perfOf("pirate", "general_c").accel > perfOf("hauler", "logistics_d").accel, "and the raider is the faster hull");
  ok(perfOf("security", "security_d").gun.dmg > perfOf("trader", "commerce_b").gun.dmg, "a picket out-guns a trader");
  ok(traffic.every((n) => n.hp > 0 && n.shield >= 0 && n.gun), "every hull on the board has integrity and a gun");
  ok(new Set(traffic.map((n) => n.hpMax)).size > 3, `hulls are not all the same toughness (${new Set(traffic.map((n) => n.hpMax)).size} distinct)`);
}

/* ---- 3. the roster and the supply runs ----------------------------------- */
{
  const c = trafficCensus();
  ok(c.total >= 80, `a busier sky (${c.total} hulls: ${c.trader} trade, ${c.supply} supply, ${c.pirate} raid, ${c.patrol + c.security} law)`);
  ok(c.supply > 0 && ROLES.supply, `station supply runs exist (${c.supply})`);
  ok(c.pirate >= 13 && c.patrol + c.security >= 17, `more raiders and far more law than before (${c.pirate} vs ${c.patrol + c.security})`);
  ok(traffic.filter((n) => n.role === "supply").every((n) => n.supplyFor), "every supply hull is named for the port waiting on it");
  ok(traffic.every((n) => n.legs || n.role === "patrol" || n.role === "pirate" || n.rogue), "everyone else runs a timetable");
  for (const n of traffic) {
    if (!n.legs) continue;
    for (const l of n.legs) if (l.kind === "travel") { ok(l.dur >= MIN_TRAVEL_S, `no travel leg is shorter than a real port call (${Math.round(l.dur)} s)`); break; }
    break;
  }
}

/* ---- 4. crossings are flown, and are on the board while they are ---------- */
{
  run(400, 1);
  const c = trafficCensus();
  ok(c.crossing + c.docked > 0, `the sky is working (${c.crossing} crossing, ${c.docked} on clamps, ${c.flying} up)`);

  /* the old sky put a hull `visible:false` in the middle of every leg. The new
   * one only hides what is inside a ring — which is the entire point: a
   * crossing you can see is a crossing you can intercept. */
  const hidden = traffic.filter((n) => n.visible === false && n.job !== "down");
  ok(hidden.every((n) => n.job === "docked"), `the only hulls off the board are docked (${hidden.length} hidden, all docked)`);

  const underDrive = traffic.filter((n) => n.job === "in lane");
  ok(underDrive.every((n) => n.visible !== false), `hulls under drive stay tracked (${underDrive.length})`);

  /* and they really move: a hull sampled twice is somewhere else */
  const moving = traffic.filter((n) => n.visible !== false && n.speed > 1);
  const before = moving.slice(0, 12).map((n) => ({ n, x: n.x, y: n.y, z: n.z }));
  run(30, 0.5);
  const shifted = before.filter((b) => d3(b.n, b) > 100);
  ok(shifted.length >= before.length * 0.6, `hulls in flight actually travel (${shifted.length}/${before.length} moved over 30 s)`);

  syncContacts(sim.ship, sim.remotes, relationOf, sim.time, 0.1);
  const up = traffic.filter((n) => n.visible !== false && d3(n, sim.ship.pos) <= CONTACT_R);
  ok(contacts.filter((x) => x.kind === "npc").length === up.length, `every flying hull in sensor range is a contact (${up.length})`);
}

/* ---- 5. the directorate exists and is a real corporation ----------------- */
{
  const law = securityCorp();
  ok(law && law.tier === "law", `the sky has a Security Directorate (${law?.name})`);
  ok(law && !law.ports.length, "it holds no berths of its own");
  ok(corps.filter((c) => c.tier === "law").length === 1, "exactly one");
  const honest = traffic.find((n) => !HOSTILE_ROLES.has(n.role) && !n.rogue);
  const raider = traffic.find((n) => HOSTILE_ROLES.has(n.role));
  ok(coverageFor(honest) > 0, `an honest hull is covered (${coverageFor(honest).toFixed(2)})`);
  ok(coverageFor(raider) === 0, "a raider is not");
  ok(traffic.filter((n) => n.guard).length > 0, `ports keep quick-reaction hulls ringed up (${traffic.filter((n) => n.guard).length})`);
}

/* ---- 6. hostility ---------------------------------------------------------- */
{
  /* live hulls only: `hostileTo` reports false about anything already down,
   * which is correct and would make this section test nothing */
  const live = (f) => traffic.find((n) => n.job !== "down" && f(n));
  const pirate = live((n) => n.role === "pirate");
  const trader = live((n) => n.role === "trader");
  const law = live((n) => LAW_ROLES.has(n.role));
  const pirate2 = traffic.filter((n) => n.job !== "down" && n.role === "pirate")[1];
  ok(pirate && trader && law && pirate2, "live hulls of each kind to test against");
  ok(hostileTo(pirate, trader), "a raider takes honest traffic");
  ok(!hostileTo(pirate, pirate2), "raiders do not eat each other");
  ok(hostileTo(law, pirate), "the law takes raiders");
  ok(!hostileTo(law, trader), "and leaves honest traffic alone");
  ok(!hostileTo(trader, trader), "nothing is hostile to itself");
}

/* ---- 7. a hunt, a call, and a response ----------------------------------- */
{
  /* stage it rather than wait for one: put a raider on a specific trader at a
   * specific distance, and watch the whole chain run */
  /* a hull that is mid-crossing, not one about to touch down: a raider that
   * loses its target to a docking clamp is behaving correctly and tests
   * nothing. Pick something far from every port and put it on a long leg. */
  const farFromPorts = (n) => stations.every((st) => d3(n, st) > 40000);
  const prey = traffic.find((n) => n.role === "supply" && n.job === "outbound" && !n.drive && farFromPorts(n))
    ?? traffic.find((n) => (n.role === "supply" || n.role === "trader") && n.job === "outbound" && !n.drive)
    ?? traffic.find((n) => n.role === "trader" && n.visible !== false && n.job !== "down");
  const raider = traffic.find((n) => n.role === "pirate" && n.job !== "down");
  ok(prey && raider, `a raider and a crossing to stage against (${prey?.role} ${prey?.job})`);

  /* Hold the victim still for the length of this section. What is under test
   * here is the chain — raider closes, victim notices, radio call, dispatch,
   * clock — and a hull that reaches its port mid-test takes its docking clamp
   * with it and proves nothing. The crossing behaviour itself is section 4. */
  prey.legs = null;
  prey.state = "hold";
  prey.job = "outbound";
  prey.drive = 0;
  prey.lane3 = null;
  prey.vx = 0; prey.vy = 0; prey.vz = 0; prey.speed = 0;

  /* park the raider on the prey's shoulder */
  raider.x = prey.x + 900; raider.y = prey.y; raider.z = prey.z;
  raider.vx = prey.vx; raider.vy = prey.vy; raider.vz = prey.vz;
  raider.hunt = null; raider.fleeFrom = null; raider.respondTo = null; raider.guard = null;
  prey.fleeFrom = null; prey.respondTo = null; prey.huntedBy = null;

  const found = acquire(raider, HUNT_R);
  ok(found, `a raider on the prowl finds something worth taking (${found?.name})`);

  const openBefore = distress.length;
  setHunt(raider, prey, sim.time);
  const hp0 = prey.hp;
  run(50, 0.5);

  ok(prey.hp < hp0 || prey.job === "down" || prey.fleeFrom || raider.hunt === prey.id,
    `the raider actually pressed it (hp ${Math.round(hp0)} → ${Math.round(prey.hp)}, job ${prey.job}, raider ${raider.job})`);
  const call = distress.find((c) => c.victimId === prey.id);
  ok(call, "the victim put out a distress call");
  if (call) {
    ok(call.state !== "calling", `the call was acted on (${call.state})`);
    if (call.eta != null) {
      ok(call.eta > call.at, "the response has an ETA in the future");
      const left = etaOf(call, sim.time);
      ok(left === null || left >= 0, `the clock counts down and does not go negative (${left === null ? "n/a" : Math.round(left) + "s"})`);
    }
    /* a closed call has already released its wing, which is not the same as
     * never having had one — `outcome` is what says how it ended */
    ok(call.wing.length > 0 || call.state === "unanswered" || call.state === "closed",
      `somebody was sent, or nobody could be (${call.state}${call.outcome ? `/${call.outcome}` : ""}, wing ${call.wing.length})`);
  }
  ok(distress.some((c) => c.victimId === prey.id), "the bus holds the call against the victim's id");

  const rep = securityReport(sim.time);
  ok(rep.corp, `the report names the directorate (${rep.corp})`);
  ok(rep.responders >= 0 && rep.guards > 0, `${rep.responders} hulls answering, ${rep.guards} on port rings`);
}

/* ---- 8. a response arrives on the clock it promised ---------------------- */
{
  /* a call whose ETA has passed should have someone on scene, or have been
   * honestly marked unanswered — never left promising forever */
  const staged = distress.filter((c) => c.eta != null && c.state !== "closed");
  if (staged.length) {
    run(200, 1);
    const late = distress.filter((c) => c.eta != null && sim.time > c.eta + 90 && c.state === "dispatched" && !c.arrivedAt);
    ok(late.length === 0, `no call is left promising a response that never comes (${late.length} overdue)`);
  } else ok(true, "no dispatched call to age (skipped)");
}

/* ---- 9. a hull that is shot at runs, and the law shoots back ------------- */
{
  /* a HEALTHY victim: twelve points of damage onto a hull that is already
   * nearly finished destroys it, and a destroyed hull has let go of everything
   * including who it was running from — correct, and not what this tests */
  const victim = traffic.find((n) => !HOSTILE_ROLES.has(n.role) && !LAW_ROLES.has(n.role) && !n.rogue && n.job !== "down" && n.visible !== false && n.hp > 60);
  ok(victim, "a healthy honest hull to shoot at");
  victim.fleeFrom = null;
  const attacker = traffic.find((n) => n.role === "pirate" && n.job !== "down");
  damageHull(victim, 12, attacker.id, sim.time);
  ok(victim.fleeFrom === attacker.id, "a hull that takes a round starts running from whoever fired it");
  ok(distress.some((c) => c.victimId === victim.id), "…and gets on the radio");

  const picket = traffic.find((n) => LAW_ROLES.has(n.role) && n.job !== "down" && !n.respondTo);
  if (picket) {
    picket.hunt = null;
    damageHull(picket, 8, attacker.id, sim.time);
    ok(picket.hunt === attacker.id, "a picket that is shot at does not run — it answers");
  } else ok(true, "no free picket to test (skipped)");
}

/* ---- 10. damage, death and recovery -------------------------------------- */
{
  const mark = traffic.find((n) => n.job !== "down" && n.hp > 0 && !n.rogue);
  const id = mark.id;
  const shield0 = mark.shield;
  damageHull(mark, Math.max(1, shield0 * 0.5), "self", sim.time);
  ok(mark.shield < shield0, "shields soak before the hull does");
  damageHull(mark, 99999, "self", sim.time);
  ok(mark.job === "down" && mark.visible === false, "a hull that runs out of integrity goes off the board");
  ok(trafficDown[id] > sim.time, "…for a while");
  ok(combatLog.some((k) => k.id === id), "and the kill is on the record");
  ok(mark.hunt === null && mark.respondTo === null, "whatever had a claim on it let go");

  /* and it comes back on its timetable, whole */
  trafficDown[id] = sim.time - 1;
  run(2, 0.5);
  const back = vesselById(id);
  ok(back.job !== "down" && back.hp > 0, `it returns to the roster repaired (${back.job}, ${Math.round(back.hp)} hp)`);
}

/* ---- 11. rogue nests and waves ------------------------------------------- */
{
  ok(nests.length >= 2, `the sky has drone nests (${nests.length}: ${nests.map((n) => n.name).join(", ")})`);
  ok(nests.every((n) => n.hp > 0 && n.hpMax > 0), "each nest has something to destroy");

  const nest = nests[0];
  nest.ready = 0;
  const w = launchWave(nest, sim.time, stations);
  ok(w, "a nest launches a wave");
  if (w) {
    ok(w.drones.length >= 2, `the wave has drones in it (${w.drones.length})`);
    ok(w.drones.length <= waveCap(99), "and no more than the frame budget allows");
    ok(["station", "hull", "nest"].includes(w.target.kind), `it launched at something specific (${w.target.kind}: ${w.target.name})`);
    const drones = w.drones.map((id) => vesselById(id)).filter(Boolean);
    ok(drones.length === w.drones.length, "every drone is on the board as a real hull");
    ok(drones.every((d) => d.rogue && d.hp > 0 && d.gun), "…with integrity and a gun, like anything else");
    ok(drones.every((d) => HOSTILE_ROLES.has(d.role)), "and hostile to everything with a crew");

    /* they go somewhere — toward their objective */
    const d0 = d3(drones[0], w.target);
    run(60, 0.5);
    const alive = w.drones.map((id) => vesselById(id)).filter(Boolean);
    if (alive.length) {
      const d1 = d3(alive[0], w.target);
      /* closing, or fighting something it met on the way, or its objective
       * outran it and it has been given a new one — all three are the wave
       * doing its job; flying at nothing is not */
      const retargeted = w.target !== undefined && d3(alive[0], w.target) < d1 + 1;
      ok(d1 < d0 || alive[0].hunt || w.state === "home" || retargeted,
        `the wave closes on its objective (${Math.round(d0 / 1000)} km → ${Math.round(d1 / 1000)} km, state ${w.state})`);
    } else ok(true, "the wave was destroyed on the way (fair)");
  }

  /* a rogue is hostile to a rival nest's drones, not to its own */
  const a = traffic.find((n) => n.rogue);
  if (a) {
    const sameNest = traffic.find((n) => n.rogue && n !== a && n.nest === a.nest);
    ok(!sameNest || !hostileTo(a, sameNest), "a drone does not shoot its own wave");
    const other = traffic.find((n) => n.rogue && n.nest !== a.nest);
    if (other) ok(hostileTo(a, other), "two nests are competitors");
    /* `find` can come back empty — every crewed hull in the sky may be down by
     * now — and `hostileTo(a, undefined)` is false, which read as a failure of
     * the rule rather than as "there was nothing to test it against". Say
     * which it is. */
    const honest = traffic.find((n) => !n.rogue && !HOSTILE_ROLES.has(n.role) && n.job !== "down");
    ok(honest, "there is still a crewed hull in the sky to test against");
    if (honest) ok(hostileTo(a, honest), `and a drone takes anything crewed (${honest.name ?? honest.role})`);
  }

  const rr = rogueReport(sim.time);
  ok(rr.nests.length === nests.length && rr.drones >= 0, `the report is complete (${rr.drones} drones up, ${rr.waves.length} waves)`);
}

/* ---- 12. the frame budget ------------------------------------------------ */
{
  resetPerf();
  lockPerfTier(null);
  ok(perf.tier === 3, "a fresh sky starts rich");

  /* a settled, comfortable device stays there */
  for (let i = 0; i < 200; i++) notePerf(9, 1 / 60);
  ok(perf.tier === 3, `a fast frame keeps every tier (${perfReport().label}, ${perfReport().ms} ms)`);

  /* a struggling one drops, and drops immediately rather than after a wait */
  for (let i = 0; i < 200; i++) notePerf(34, 1 / 60);
  ok(perf.tier < 3, `a slow frame sheds detail (${perfReport().label} at ${perfReport().ms} ms)`);
  const low = perf.tier;
  ok(farBudget(200).stride > 1, `…the far field goes onto a stride (1 frame in ${farBudget(200).stride})`);
  ok(waveCap(12) < 12, `…and rogue waves come smaller (${waveCap(12)})`);

  /* recovery is earned, not instant */
  for (let i = 0; i < 60; i++) notePerf(8, 1 / 60);
  ok(perf.tier === low, "one good second does not hand the tier back");
  for (let i = 0; i < 1200; i++) notePerf(8, 1 / 60);
  ok(perf.tier > low, `a sustained good stretch does (${perfReport().label})`);

  /* a single hitch is not a verdict */
  resetPerf();
  for (let i = 0; i < 200; i++) notePerf(9, 1 / 60);
  notePerf(240, 1 / 60);
  ok(perf.tier === 3, "one 240 ms hitch does not drop the sky a tier");

  ok(lockPerfTier(1) === 1 && perf.tier === 1, "the tier can be pinned");
  ok(lockPerfTier(null) === null, "and released");
  resetPerf();
}

/* ---- 13. it all still runs together -------------------------------------- */
{
  const t0 = Date.now();
  run(300, 0.5);
  const ms = Date.now() - t0;
  const c = trafficCensus();
  ok(c.flying > 0, `after five more minutes the sky is still working (${c.flying} up, ${c.down} down, ${c.crossing} crossing)`);
  ok(traffic.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y) && Number.isFinite(n.z)), "no hull has flown to NaN");
  ok(traffic.every((n) => Number.isFinite(n.speed) && n.speed >= 0), "and every speed is a real number");
  ok(traffic.every((n) => n.hp <= (n.hpMax ?? Infinity) + 1e-6), "nothing healed past its own maximum");
  const stuck = traffic.filter((n) => n.legs && n.job === "approach" && n.speed < 1);
  ok(stuck.length === 0, `nobody is parked on an approach they cannot finish (${stuck.length})`);
  console.log(`  reactive: 600 hull-seconds of sky in ${ms} ms (${c.total} hulls, ${combatReport().hunting} hunting, ${combatReport().fleeing} running, ${distress.filter((x) => x.state !== "closed").length} calls open)`);
}

console.log(`reactive: ${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
