/* LIVING GALAXY 0.3.88 — ARIA keeps a loop.
 *
 *   node --import ./test/three-register.mjs test/aria-loop.test.mjs
 *
 * Reported: ARIA warps to a station and docks, undocks at once, warps to the
 * belt, locks back onto the station, warps home and docks — for ever. No
 * mining loop, no board work, no hiring, no charter.
 *
 * What this pins:
 *   1. a hostile contact close by never, on its own, ends a job — at the conn
 *      (pilot.js) or in the terminal player (play.js);
 *   2. a hurt hull with contacts close DOES break off, the contract is kept,
 *      and she picks it up again after the yard;
 *   3. a lost nav target does not stall a jump;
 *   4. a world across the corridor is flown round by an ARIA mission and still
 *      fails a hand-flown one;
 *   5. the bus is tended before the autopilot has to stand a mission down;
 *   6. a purchase over the captain's ceiling is trimmed, not refused.
 */

const store = new Map();
globalThis.localStorage ??= { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

/* the sim rolls dice in a few places (drone spawns, cooldowns); pin them */
{ let a = 0x9e3779b9; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const { sim, launchSim, tickSim, setNavTarget, losBlocker, warpDestination, warpNodeById, wellEdge } = await import("../js/sim/sim.js");
const { makePilot } = await import("../js/flight/pilot.js");
const { touch } = await import("../js/core/input.js");
const { stations } = await import("../js/station/stations.js");
const { BODIES, bodyPosition, currentSystem } = await import("../js/world/bodies.js");
const { contacts } = await import("../js/flight/turrets.js");
const { batteryCap } = await import("../js/flight/ship.js");
const { hullMaxOf, repairsAt } = await import("../js/flight/repair.js");
const { ariaMind, resetMind } = await import("../js/aria/mind.js");
const { ariaTakeConn, ariaRelease, ariaHasConn, wireAria } = await import("../js/aria/aria.js");
const { ariaPilot, notePlayerJob } = await import("../js/aria/pilot.js");
const { play, beginPlay, stepPlay, endPlay, setPlayRng, tendBus, PLAY } = await import("../js/aria/play.js");
const { planRoute } = await import("../js/aria/nav.js");
const { mission, startMission, stopMission, EXEC } = await import("../js/mission/run.js");
const { makeMission, makeStep } = await import("../js/mission/script.js");
const { autopilot, busIdle } = await import("../js/flight/autopilot.js");
const { contracts } = await import("../js/economy/contracts.js");
const { captain } = await import("../js/npc/captain.js");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const HZ = 30;
const tick = (s, each = null) => { for (let i = 0; i < s * HZ; i++) { each?.(); tickSim(1 / HZ); } };
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const hostileWithin = (r) => contacts.some((c) => c.hp > 0 && c.relation === "hostile" && d3(c, sim.ship.pos) < r);
const honest = (st) => !(st.hostile && !st.claimed) && st.sector !== "pirate" && st.hangars?.length;

makePilot("Loop", "terran", "mining", null);
launchSim("LoopTest", "sol");
sim.phase = "play";
wireAria();
touch.panX = touch.panY = touch.rcsX = touch.rcsY = 0;
sim.dropoutRoll = 1;
const ship = sim.ship;
tick(1);
const whole = () => { ship.hull = hullMaxOf(ship); ship.charge = batteryCap(ship); };
const park = (x, y, z) => { ship.dockedAt = null; ship.pos.x = x; ship.pos.y = y; ship.pos.z = z; ship.vel.x = ship.vel.y = ship.vel.z = 0; };

/* ---- 1. the defaults: nothing ARIA always did is withheld --------------------- */
{
  resetMind();
  ok(Object.values(ariaMind.authority).every((v) => v === true), "every authority starts granted");
  ok(ariaMind.orders.avoidHostiles === true, "avoid-hostiles is still the standing order");
}

/* ---- 2. a lost nav target does not stall the jump ------------------------------ */
{
  /* open space, 260,000 u from a station, nothing across the lane and no well */
  const p = { x: 0, y: 0, z: 0 };
  const inWell = (q) => BODIES.some((b) => b.kind !== "star" && bodyPosition(b.id, sim.time, p) && d3(p, q) < wellEdge(b) * 1.5);
  let far = null, from = null;
  for (const st of stations.filter(honest)) {
    const dest = warpDestination(warpNodeById(st.id), { x: 0, y: 0, z: 0 });
    for (let k = 0; k < 12 && !from; k++) {
      const a = (k / 12) * Math.PI * 2;
      const q = { x: st.x + Math.cos(a) * 260000, y: st.y + 40000, z: st.z + Math.sin(a) * 260000 };
      const rad = Math.hypot(q.x, q.z);
      const belted = [currentSystem.belt, currentSystem.outerBelt].some((b) => b && rad > b.inner - 30000 && rad < b.outer + 30000);
      if (!belted && !inWell(q) && !losBlocker(q, dest, null) && Math.hypot(q.x, q.y, q.z) > 400000) { far = st; from = q; }
    }
    if (from) break;
  }
  ok(far && from, `open space with a clean lane to a station (${far?.name})`);
  park(from.x, from.y, from.z); whole(); tick(1);
  ok(startMission(makeMission({ name: "lock test", builtin: true, steps: [makeStep("DOCK", { kind: "station", id: far.id, name: far.name })] })), "a hand-flown dock mission starts");
  let spooled = false, blind = 0;
  for (let i = 0; i < 240 * HZ && !spooled && mission.active; i++) {
    /* what a broken signature lock does: the jump target goes with it */
    if (sim.warp.state === "idle" && sim.selected && i % 5 === 0) { setNavTarget(null); blind++; }
    tickSim(1 / HZ);
    if (sim.warp.state !== "idle") spooled = true;
  }
  ok(blind >= 1, `the nav target was taken away while she lined up (${blind}×)`);
  ok(spooled, `…and still spooled for ${far?.name} (${mission.state} · ${autopilot.phase} · ${autopilot.task})`);
  ok(sim.warp.targetId === far?.id, `the core is spooling for the mission's port, not for nothing (${sim.warp.targetId})`);
  stopMission("test", { quiet: true });
  tick(12);
}

/* ---- 3. a world across the corridor ------------------------------------------- */
{
  const st = stations.filter(honest)[0];
  const dest = warpDestination(warpNodeById(st.id), { x: 0, y: 0, z: 0 });
  const p = { x: 0, y: 0, z: 0 };
  /* stand a hull on the far side of a planet from the station, clear of its well */
  let spot = null, world = null;
  for (const b of BODIES) {
    if (b.kind === "star" || !bodyPosition(b.id, sim.time, p)) continue;
    const d = d3(p, dest);
    if (d < 300000) continue;
    const out = Math.max(wellEdge(b) * 2.5, b.radius * 12, 60000);
    const q = { x: p.x + ((p.x - dest.x) / d) * out, y: p.y + ((p.y - dest.y) / d) * out, z: p.z + ((p.z - dest.z) / d) * out };
    if (losBlocker(q, dest, null)?.id === b.id) { spot = q; world = b; break; }
  }
  ok(spot, `a hull can be stood behind a world (${world?.name}) from ${st.name}`);
  const dock = () => makeStep("DOCK", { kind: "station", id: st.id, name: st.name });

  park(spot.x, spot.y, spot.z); whole(); tick(1);
  ok(startMission(makeMission({ name: "by hand", builtin: true, steps: [dock()] })), "by hand: the mission starts");
  tick(20);
  ok(mission.state === "failed" && !mission.active, `by hand a blocked lane still ends the mission (${mission.state})`);

  park(spot.x, spot.y, spot.z); whole(); tick(1);
  ok(startMission(makeMission({ name: "ARIA · test dock", builtin: true, aria: true, steps: [dock()] })), "ARIA: the mission starts");
  let detoured = false;
  tick(20, () => { if (mission.run?.detour) detoured = true; });
  ok(detoured, "ARIA's mission marks a point clear of the world");
  ok(mission.active && mission.state === "running", `…and is still flying (${mission.state} · ${autopilot.task})`);
  ok(sim.log.some((e) => /going round it/.test(e.text)), "the log says she is going round it");
  const wps = sim.waypoints.length;
  stopMission("test", { quiet: true });
  ok(sim.waypoints.length === wps - 1 || !sim.waypoints.some((w) => /^clear of /.test(w.name)), "the dogleg mark is taken up when the mission ends");
  tick(12);
}

/* ---- 4. at the conn: drones close, hull whole → she keeps mining ---------------- */
const belt = currentSystem.belt;
{
  park((belt.inner + belt.outer) / 2, 0, 0); whole(); ship.hold = {}; ship.credits = 20000;
  tick(1);
  for (let i = 0; i < 6; i++) notePlayerJob("mine");
  ok(ariaTakeConn().ok && ariaHasConn(), "ARIA takes the conn in the belt");
  tick(4);
  ok(ariaPilot.job === "mine" && mission.active?.mode === "aria", `she starts a mining job (${ariaPilot.job} — ${ariaPilot.why})`);
  let seen = 0;
  tick(40, () => { if (hostileWithin(6000)) seen++; whole(); });
  ok(seen > 5 * HZ, `rogue drones were inside 6,000 u for ${Math.round(seen / HZ)} s of 40`);
  ok(ariaPilot.job === "mine" && mission.active?.name?.includes("mine"), `…and she is still on the mining job (${ariaPilot.job} · ${mission.active?.name})`);
  ok(ariaPilot.brokeOff === 0 && !ship.dockedAt, "no break-off, no run for a dock");
  ok(ship.turretMode !== "off", `guns are up instead (${ship.turretMode})`);

  /* now it is going badly */
  ship.hull = hullMaxOf(ship) * 0.4;
  let n = 0;
  while (!hostileWithin(6000) && n++ < 30 * HZ) tickSim(1 / HZ);
  ship.hull = hullMaxOf(ship) * 0.4;
  tick(6, () => { ship.hull = Math.min(ship.hull, hullMaxOf(ship) * 0.4); });
  ok(ariaPilot.brokeOff === 1, `hull at 40% with contacts close: she breaks off once (${ariaPilot.brokeOff})`);
  ok(ariaPilot.job === "repair" && mission.active?.steps.some((s) => s.op === "REPAIR"), `…for a yard, with a REPAIR step (${ariaPilot.job} — ${ariaPilot.why})`);
  ariaRelease();
  ok(captain.holder === "player" && !mission.active, "the conn comes back");
  tick(2);
}

/* ---- 5. the terminal player: same belt, same drones ---------------------------- */
{
  park((belt.inner + belt.outer) / 2, 0, 0); whole(); ship.hold = {}; ship.credits = 20000;
  contracts.active.length = 0;
  setPlayRng(() => 0.99);
  beginPlay({ career: "mining", name: "LOOP" });
  const run = (s, each = null) => { for (let i = 0; i < s * HZ; i++) { each?.(); tickSim(1 / HZ); stepPlay(1 / HZ); } };
  run(5);
  ok(play.move?.kind === "job" && contracts.active.length === 1, `she takes a job off the board (${play.move?.key} — ${play.move?.note})`);
  const job = play.move?.jobId;
  const failed0 = contracts.failed;
  let seen = 0;
  run(45, () => { if (hostileWithin(6000)) seen++; whole(); });
  ok(seen > 5 * HZ, `drones inside 6,000 u for ${Math.round(seen / HZ)} s of 45`);
  ok(play.move?.jobId === job && mission.active, `…and she is still flying the same job (${play.move?.note})`);
  ok(!play.log.some((l) => /threat/.test(l.text)), "nothing was dropped for a 'threat'");
  ok(contracts.active.length === 1 && contracts.failed === failed0, "one contract held, none broken");

  /* hurt, contacts close: pause the job, keep the contract, go to the yard */
  let n = 0;
  while (!hostileWithin(PLAY.threatR) && n++ < 30 * HZ) { tickSim(1 / HZ); stepPlay(1 / HZ); }
  ship.hull = hullMaxOf(ship) * 0.4;
  run(1, () => { ship.hull = Math.min(ship.hull, hullMaxOf(ship) * 0.4); });
  ok(play.move?.kind === "yard", `hull at 40%: the move is the yard run (${play.move?.kind})`);
  ok(play.paused?.jobId === job, "the job is paused, not finished");
  ok(contracts.active.some((a) => a.id === job) && contracts.failed === failed0, "the contract is still on the books and nothing was abandoned");

  /* at the yard: patched, then straight back onto the job she paused */
  const yard = stations.find((s) => honest(s) && repairsAt(s) && s.id === mission.active?.steps.at(-1)?.target?.id) ?? stations.find((s) => honest(s) && repairsAt(s));
  stopMission("test", { quiet: true });
  ship.dockedAt = yard.id; ship.pos.x = yard.x; ship.pos.y = yard.y; ship.pos.z = yard.z; ship.vel.x = ship.vel.y = ship.vel.z = 0;
  for (let i = 0; i < 8 * HZ && play.move?.kind !== "job"; i++) stepPlay(1 / HZ);
  ok(ship.hull >= hullMaxOf(ship) - 1, `the yard patched her (${Math.round(ship.hull)} hull)`);
  ok(play.move?.kind === "job" && play.move.jobId === job, `…and she is back on the same job (${play.move?.note})`);
  ok(play.log.some((l) => /back on/.test(l.text)), "the log says so");
  ok(contracts.active.length === 1 && contracts.failed === failed0, "still one contract, still none broken");
  ok(mission.active?.steps.some((s) => s.op === "MINE"), "the mission she flies has the MINE step in it");

  /* ---- 6. the bus ---- */
  stopMission("test", { quiet: true });
  park((belt.inner + belt.outer) / 2, 6000, 0);
  ship.localGravity = true;
  ship.charge = batteryCap(ship) * 0.3;
  const spare = (ship.reactor ?? 130) - busIdle(ship).load;
  ship.extraDraw = (ship.extraDraw ?? 0) + Math.max(0, spare - 1);
  tendBus();
  ok(ship.localGravity === false && play.shed.includes("localGravity"), "battery low and nothing spare: deck gravity goes off before the autopilot has to stand down");
  ship.extraDraw = 0; ship.charge = batteryCap(ship);
  ship.dockedAt = yard.id;
  tendBus();
  ok(ship.localGravity === true && !play.shed.length, "…and comes back when there is room");
  ship.dockedAt = null;
  ship.charge = batteryCap(ship) * 0.1;
  ok(tendBus() === true, "a flat battery is reported, so she waits instead of taking work");
  const held = contracts.active.length;
  for (let i = 0; i < 6 * HZ; i++) stepPlay(1 / HZ);
  ok(!mission.active && contracts.active.length === held, "flat: no new mission, no new contract");
  whole();
  endPlay();
  contracts.active.length = 0;
}

/* ---- 7. a purchase over the ceiling is trimmed --------------------------------- */
{
  const st = stations.find((s) => honest(s) && s.stock?.some((g) => g.qty > 20));
  const good = st.stock.find((g) => g.qty > 20);
  ship.dockedAt = st.id; ship.credits = 50000; ship.hold = {};
  const step = makeStep("BUY", null, { args: { good: good.id, qty: 10 } });
  mission.active = makeMission({ aria: true, builtin: true, steps: [step] });
  mission.run = {};
  const { buyPriceAt } = await import("../js/sim/sim.js");
  const unit = buyPriceAt(st, { id: good.id }, 10);
  ariaMind.orders.maxPurchase = unit * 3.5;
  const r = EXEC.BUY(step);
  const got = ship.hold[good.id] ?? 0;
  ok(r === "done" && got >= 1 && got < 10, `asked for 10 at ${unit} cr with a ${Math.round(unit * 3.5)} cr ceiling: bought ${got}, not refused (${r})`);
  ok(50000 - ship.credits <= unit * 3.5 + 1, `…and stayed under the ceiling (${Math.round(50000 - ship.credits)} cr)`);
  mission.active = null;
}

console.log(`aria-loop: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
