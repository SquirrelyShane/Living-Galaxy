/* LIVING GALAXY — 0.3.06: ARIA spends the takings on the ship and on drones.
 *
 * The planner could only ever earn. This is the other half: with the money in,
 * the hull whole and nothing urgent, it buys the refit its job wants or puts a
 * drone on a line. What is tested here is mostly the CAUTION — the rule spends
 * the pilot's money without being asked, so the interesting cases are all the
 * ones where it must decline.
 *
 *   node --import ./test/three-register.mjs test/aria-invest.test.mjs
 */

const store = new Map();
globalThis.localStorage ??= { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { sim, launchSim, tickSim } = await import("../js/sim.js");
const { makePilot } = await import("../js/pilot.js");
const { touch } = await import("../js/input.js");
const { stations } = await import("../js/stations.js");
const { upgrades, hasUpgrade } = await import("../js/upgrades.js");
const { company, foundCompany } = await import("../js/company.js");
const { droneOps } = await import("../js/drones/ops.js");
const { wireAria } = await import("../js/aria.js");
const { ariaPilot, planJob, refitPlan, buildPlan, notePlayerJob, ARIA_JOBS, INVEST_JOBS } = await import("../js/aria-pilot.js");
const { mission, EXEC } = await import("../js/mission/run.js");
const { OPS, validate } = await import("../js/mission/script.js");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("Aria", "terran", "mining", null);
launchSim("AriaInvest", "sol");
sim.phase = "play";
wireAria();
touch.panX = touch.panY = touch.rcsX = touch.rcsY = 0;
const ship = sim.ship;
tickSim(1 / 60);

/* A clean slate the rule is happy with: whole hull, empty hold, money in. */
function idle({ credits = 400000, hull = 100 } = {}) {
  ship.hull = hull;
  ship.credits = credits;
  ship.dockedAt = null;
  for (const k of Object.keys(ship.cargo ?? {})) delete ship.cargo[k];
  ariaPilot.investAt = 0;
  ariaPilot.fails = {};
  ariaPilot.job = null;
}

/* ---- the ops exist and are shaped like the others -------------------------- */
{
  ok(Object.keys(OPS).length === 18, `eighteen ops (${Object.keys(OPS).length}) — 0.3.10 added FAB`);
  ok(OPS.REFIT && OPS.BUILD, "REFIT and BUILD are in the op table");
  ok(typeof EXEC.REFIT === "function" && typeof EXEC.BUILD === "function", "and both have an executor registered");

  const bad = validate({ steps: [{ op: "REFIT", args: {} }], loop: { mode: "none" } });
  ok(bad.some((e) => /refit needs an upgrade/.test(e.msg)), "a REFIT with nothing named does not validate");
  const bad2 = validate({ steps: [{ op: "BUILD", args: {} }], loop: { mode: "none" } });
  ok(bad2.some((e) => /build needs a drone role/.test(e.msg)), "a BUILD with no role does not validate");

  ok(ARIA_JOBS.includes("refit") && ARIA_JOBS.includes("build"), "refit and build are jobs ARIA can be doing");
  ok(INVEST_JOBS.length === 2, "and both are marked as bought, not learned");
}

/* ---- refit: what it picks, and what it refuses ----------------------------- */
{
  idle();
  notePlayerJob("mine", 20);           // a miner's habits
  const r = refitPlan(ship, "mine");
  ok(r, `a refit is found with 400k in hand (${r?.opt?.name} at ${r?.st?.name})`);
  ok(r && !r.opt.owned && !r.opt.blocker, "and it is one this yard will actually sell");
  ok(r && r.opt.sector.includes(r.st.sector), "at a port whose lines fit it");

  /* the reserve is real */
  idle({ credits: 14000 });
  ok(!refitPlan(ship, "mine"), "nothing is bought inside the 15,000 cr reserve");
  idle({ credits: 15500 });
  const cheap = refitPlan(ship, "mine");
  ok(!cheap || cheap.opt.price <= 500, `and only what the margin covers (${cheap ? `${cheap.opt.price} cr` : "nothing"})`);

  /* a hurt hull gets fixed first — the plan must not be a shopping trip */
  idle({ credits: 400000, hull: 30 });
  const p = planJob();
  ok(p.job === "repair", `a hurt hull goes to a yard, not a shop (${p.job})`);

  /* and with the hull whole it is willing to go */
  idle();
  const p2 = planJob();
  ok(["refit", "build"].includes(p2.job), `money in and nothing urgent: it invests (${p2.job} — ${p2.why})`);
  ok(p2.mission && validate(p2.mission).length === 0, "the mission it writes validates");
  ok(p2.mission.steps[0].op === "DOCK", "dock first");
  ok(["REFIT", "BUILD"].includes(p2.mission.steps[1].op), "then buy");
}

/* ---- the cooldown ---------------------------------------------------------- */
{
  idle();
  ariaPilot.investAt = sim.time + 120;   // just bought something
  const p = planJob();
  ok(!INVEST_JOBS.includes(p.job), `inside the cooldown it goes back to work (${p.job})`);
  ariaPilot.investAt = 0;
}

/* ---- REFIT as a step: docked-only, and it actually fits the thing ---------- */
{
  idle();
  const r = refitPlan(ship, "mine");
  ok(r, "a refit to buy");
  ship.dockedAt = null;
  mission.active = { steps: [{ op: "REFIT", args: { id: r.opt.id } }], mode: "aria" };
  mission.stepIx = 0;
  mission.run = {};
  ok(String(EXEC.REFIT()).startsWith("fail:not docked"), "REFIT refuses in open space");

  ship.dockedAt = r.st.id;
  const before = ship.credits;
  const res = EXEC.REFIT();
  ok(res === "done", `REFIT at the berth: ${res} — ${mission.run.why}`);
  ok(hasUpgrade(r.opt.id), `${r.opt.name} is aboard`);
  ok(before - ship.credits === r.opt.price, `and it cost what it said (${(before - ship.credits).toLocaleString()} cr)`);
  ok(ariaPilot.investAt > sim.time, "the cooldown starts on the purchase, not the plan");
  ok(ariaPilot.bought.length === 1 && ariaPilot.bought[0].what === r.opt.name, "the watch report knows what it bought");

  /* the same step run twice is not a second purchase */
  const again = EXEC.REFIT();
  ok(again === "done" && mission.run.why === "already fitted", "buying it twice is a no-op, not a charge");
}

/* ---- build: needs a company, and comes out of the treasury ----------------- */
{
  idle();
  ariaPilot.investAt = 0;
  company.founded = false;
  ok(!buildPlan(ship, "mine"), "no company, no drone");

  /* a charter is registered at a desk, so dock to get one */
  const home = stations.find((st) => st.sector === "industrial" && !st.hostile);
  ship.dockedAt = home.id;
  const err = foundCompany("Test Holdings", "industrial");
  ok(!err && company.founded, `a charter is registered at ${home.name}${err ? ` (${err})` : ""}`);
  ship.dockedAt = null;
  ship.credits = 400000;
  company.treasury = 0;
  ok(!buildPlan(ship, "mine"), "a company with an empty treasury cannot build either");

  company.treasury = 200000;
  const b = buildPlan(ship, "mine");
  ok(b, `with the treasury funded a drone is found (${b?.opt?.label} at ${b?.st?.name})`);
  ok(b && !b.opt.blocker, "and nothing is blocking the line");

  ship.dockedAt = null;
  mission.active = { steps: [{ op: "BUILD", args: { role: b.opt.role } }], mode: "aria" };
  mission.stepIx = 0;
  mission.run = {};
  ok(String(EXEC.BUILD()).startsWith("fail:not docked"), "BUILD refuses in open space too");

  ship.dockedAt = b.st.id;
  const tre = company.treasury;
  const queued = droneOps.queue.length;
  const res = EXEC.BUILD();
  ok(res === "done", `BUILD at the berth: ${res} — ${mission.run.why}`);
  ok(droneOps.queue.length === queued + 1, "a drone is on the line");
  ok(tre - company.treasury === b.opt.price, `paid from the treasury, not the credit line (${(tre - company.treasury).toLocaleString()} cr)`);
  ok(ship.credits === 400000, "the pilot's own credits are untouched by a drone");
}

/* ---- a job it cannot do is not a job it keeps trying ----------------------- */
{
  idle();
  ariaPilot.fails = { refit: 2, build: 2 };
  const p = planJob();
  ok(!INVEST_JOBS.includes(p.job), `two failures and it stops asking (${p.job})`);
}

console.log(fail ? `aria-invest: ${pass} passed, ${fail} FAILED` : `aria-invest: ${pass} passed, 0 failed`);
process.exit(fail ? 1 : 0);
