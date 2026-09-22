/* LIVING GALAXY — 0.3.03: ARIA works the ship like you, and the hull can be fixed.
 *
 *   node --import ./test/three-register.mjs test/aria-repair.test.mjs
 */

const store = new Map();
globalThis.localStorage ??= { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { sim, launchSim, tickSim } = await import("../js/sim.js");
const { makePilot } = await import("../js/pilot.js");
const { touch } = await import("../js/input.js");
const { stations } = await import("../js/stations.js");
const { currentSystem } = await import("../js/bodies.js");
const { upgrades, fx } = await import("../js/upgrades.js");
const { repairsAt, pricePerPoint, repairQuote, yardRepair, tickPatchDrone, patchDrone, REPAIR } = await import("../js/repair.js");
const { aria, ariaTakeConn, ariaRelease, ariaHasConn, wireAria } = await import("../js/aria.js");
const { ariaPilot, planJob, notePlayerJob, jobHabits } = await import("../js/aria-pilot.js");
const { mission } = await import("../js/mission/run.js");
const { validate, makeMission, makeStep } = await import("../js/mission/script.js");
const { autopilot, busIdle } = await import("../js/autopilot.js");
const { captain } = await import("../js/npc/captain.js");
const { corpOfStation } = await import("../js/corps.js");
const { tractor, engageTractor, stepTractor } = await import("../js/stationworks.js");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const tick = (s) => { for (let i = 0; i < s * 60; i++) tickSim(1 / 60); };

makePilot("Aria", "terran", "mining", null);
launchSim("AriaTest", "sol");
sim.phase = "play";
wireAria();
touch.panX = touch.panY = touch.rcsX = touch.rcsY = 0;
sim.dropoutRoll = 1;
const ship = sim.ship;
tickSim(1 / 60);

/* ---- the yard ------------------------------------------------------------- */
{
  const yard = stations.find((s) => repairsAt(s));
  const farm = stations.find((s) => s.sector === "agricultural");
  ok(yard, `a port with a repair yard exists (${yard?.name}, ${yard?.sector})`);
  if (farm) ok(!repairsAt(farm), "an agricultural dock does not fix hulls");
  ship.dockedAt = yard.id; ship.hull = 40; ship.credits = 100000;
  const q = repairQuote(yard, ship);
  ok(q.ok && q.need === 60 && q.per === pricePerPoint(yard), `quote: ${q.need} points at ${q.per} cr`);
  const before = ship.credits;
  const r1 = yardRepair(25);
  ok(r1.ok && r1.points === 25 && ship.hull === 65 && before - ship.credits === 25 * q.per, `a 25-point patch (${ship.hull} hull, ${before - ship.credits} cr)`);
  ship.credits = q.per * 10 + 3;
  const r2 = yardRepair();
  ok(r2.ok && r2.points === 10 && ship.credits === 3 && r2.why === "ran out of credits", `never charges more than you have (${r2.points} points, ${ship.credits} cr left)`);
  ship.credits = 100000;
  ok(yardRepair().ok && ship.hull === 100 && !repairQuote(yard, ship).ok, "FULL makes it whole, then there is nothing to sell");
  const co = corpOfStation(yard);
  if (co) {
    const was = co.standing;
    co.standing = -80; const hi = pricePerPoint(yard);
    co.standing = 80; const lo = pricePerPoint(yard);
    co.standing = was;
    ok(hi > lo, `standing moves the price (${lo} trusted vs ${hi} disliked)`);
  }
  ship.dockedAt = null;
  ok(!yardRepair().ok, "undocked there is no yard");
  ok(validate(makeMission({ steps: [makeStep("REPAIR")] })).length === 0, "REPAIR is a mission step");
}

/* ---- the patch drone ------------------------------------------------------ */
{
  ship.hull = 50; ship.lastHitAt = -999;
  tickPatchDrone(1, ship);
  ok(!patchDrone.out && ship.hull === 50, "no drone fitted: nothing happens");
  upgrades.owned.push("repair_drone");
  ok(fx("patchDrone", 0) > 0, `fitted: welds ${fx("patchDrone", 0)} a second`);
  let got = 0;
  for (let i = 0; i < 100; i++) got += tickPatchDrone(0.1, ship);
  ok(patchDrone.out && got > 5 && ship.hull > 55, `out and welding (${got.toFixed(1)} hull in 10 s)`);
  ok(ship.patchDraw === REPAIR.droneKw && busIdle(ship).on.ops >= REPAIR.droneKw, "it bills the ops board while it works");
  ship.lastHitAt = sim.time;
  const h = ship.hull;
  tickPatchDrone(1, ship);
  ok(!patchDrone.out && ship.hull === h && ship.patchDraw === 0, "under fire it stays in the bay");
  ship.lastHitAt = -999; ship.hull = 99.9;
  for (let i = 0; i < 20; i++) tickPatchDrone(0.1, ship);
  ok(ship.hull === 100 && !patchDrone.out, "whole: back in the bay, never past the max");
  upgrades.owned.splice(upgrades.owned.indexOf("repair_drone"), 1);
}

/* ---- ARIA plans your jobs ------------------------------------------------ */
{
  const belt = currentSystem.belt;
  ship.pos.x = (belt.inner + belt.outer) / 2; ship.pos.y = 0; ship.pos.z = 0;
  ship.hull = 100; ship.hold = {}; ship.dockedAt = null;
  aria.prefs.job = {};
  let p = planJob();
  ok(p.job === "mine" && /not watched you long/.test(p.why), `no habits yet, in reach of a belt: mine (${p.why})`);
  for (let i = 0; i < 12; i++) notePlayerJob("survey");
  notePlayerJob("mine");
  ok(jobHabits().share.survey > 0.8, "your flying is tallied by job");
  p = planJob();
  ok(p.job === "survey" && /survey 9\\d%/.test(p.why) === false && /you survey/.test(p.why), `a surveyor's ARIA surveys (${p.why})`);
  ship.hold = { iron_ore: ship.cargoCap * 0.9 };
  p = planJob();
  ok(p.job === "sell" && p.mission.steps[0].op === "DOCK", `a full hold goes to the desk first (${p.why})`);
  ship.hull = 30;
  p = planJob();
  ok(p.job === "repair" && p.mission.steps.some((s) => s.op === "REPAIR") && validate(p.mission).length === 0, `a hurt hull goes to a yard before anything (${p.why})`);
  ship.hull = 100; ship.hold = {};
}

/* ---- ARIA at the conn ----------------------------------------------------- */
{
  aria.prefs.job = {};
  for (let i = 0; i < 6; i++) notePlayerJob("mine");
  const r = ariaTakeConn();
  ok(r.ok && ariaHasConn(), "ARIA takes the conn");
  tick(3);
  ok(mission.active && mission.active.mode === "aria" && ariaPilot.job === "mine", `…and hands the autopilot a job (${mission.active?.name}, ${ariaPilot.why})`);
  ok(autopilot.on, "the autopilot flies it — power rule, avoidance and all");
  tick(8);
  ok(ariaHasConn() && mission.active, `still working after 8 s (${autopilot.phase} · ${autopilot.task})`);
  touch.panX = 0.5;
  tick(0.2);
  touch.panX = 0;
  ok(!ariaHasConn() && captain.holder === "player", "touching the stick takes the ship back");
  ok(!mission.active, "…and ARIA's job stops with it");
  ok(ariaTakeConn().ok && ariaRelease().ok && captain.holder === "player", "the HUD toggle path: take, release");
}

/* ---- the berth: rush only speeds the pull, the path is the path ----------- */
{
  const st = stations.find((s) => s.hangars?.length && !s.hostile);
  const m = st.hangars[0];
  ship.dockedAt = null;
  ship.pos.x = st.x + m.entry.x + m.dir.x * m.d * 3; ship.pos.y = st.y + m.entry.y + m.dir.y * m.d * 3; ship.pos.z = st.z + m.entry.z + m.dir.z * m.d * 3;
  const e = engageTractor(st, ship, 0, "test");
  ok(e.ok, "tractor lock");
  const T = tractor.T;
  let t = 0, res = null;
  tractor.rush = 5;
  while (t < T && res !== "docked") { res = stepTractor(1 / 60, ship); t += 1 / 60; }
  ok(res === "docked" && t < T / 4, `the covered pull runs at ×5 (${t.toFixed(1)} s of ${T.toFixed(1)})`);
  ok(Math.hypot(ship.pos.x - (st.x + m.berth.x), ship.pos.y - (st.y + m.berth.y), ship.pos.z - (st.z + m.berth.z)) < 1, "…and still lands on the berth");
  ok(tractor.rush === 1, "released tractors forget the rush");
}

console.log(`aria-repair: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
