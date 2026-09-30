/* LIVING GALAXY 0.3.72 — MINE IT on a delivery job flies the job.
 *
 *   node --import ./test/three-register.mjs test/jobloop.test.mjs
 *
 * Reported: accepting a mining job and pressing MINE IT started the plain mine
 * loop, which docked at the best bidder and sold the job's ore there instead
 * of bringing it to the desk that ordered it. */

import { sim, launchSim, sellAllOre } from "../js/sim/sim.js";
import { makePilot } from "../js/flight/pilot.js";
import { stations, stationById } from "../js/station/stations.js";
import { corps } from "../js/corp/corps.js";
import { clearSites } from "../js/economy/sites.js";
import { boardFor, acceptContract, contracts, resetContracts, BOARD, owedCargo, jobForSite } from "../js/economy/contracts.js";
import { engageMiningLoop, disengageAutopilot } from "../js/flight/autopilot.js";
import { mission, tickMission } from "../js/mission/run.js";
import { validate } from "../js/mission/script.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };

makePilot("Jobs", "terran", "mining", null);
launchSim("JobLoopTest", "fixture");
sim.phase = "play";
const ship = sim.ship;
const honest = stations.filter((s) => !(s.hostile && !s.claimed) && s.sector !== "pirate");
for (const c of corps) c.standing = 100;

resetContracts(); clearSites();
let job = null;
for (let k = 0; k < 40 && !job; k++) for (const st of honest) { const o = boardFor(st, sim.time + BOARD.refresh * (60 + k)).find((x) => x.type === "mine" && x.mech === "deliver" && !x.spot?.outer); if (o) { job = o; break; } }
ok(job, `a mining delivery job: ${job?.title} for ${job?.stationName}`);
sim.time = Math.max(sim.time, job.posted);
ok(acceptContract(job) === null, "accepted");
const a = contracts.active.find((x) => x.id === job.id);
ok(jobForSite(a.id) === a && owedCargo()[a.good] === a.qty, `the site is the job's, and ${a.qty} ${a.good} are owed`);

/* ---- selling never sells what a job is owed ---------------------------------- */
{
  const other = honest.find((s) => s.id !== a.stationId) ?? honest[0];
  ship.dockedAt = other.id;
  ship.hold[a.good] = a.qty + 7;
  const spare = a.good === "iron_ore" ? "nickel_ore" : "iron_ore";
  ship.hold[spare] = 11;
  sellAllOre();
  ok(Math.abs((ship.hold[a.good] ?? 0) - a.qty) < 1e-6, `SELL ALL ORE at another port keeps the ${a.qty} owed and sells the 7 over`);
  ok(!(ship.hold[spare] > 0), "…and sells ore no job wants");
  ok(Math.abs((sim.oreKept?.[a.good] ?? 0) - a.qty) < 1e-6, "…and says what it kept");
  ship.dockedAt = null;
  delete ship.hold[a.good];
}

/* ---- MINE IT → the job loop ------------------------------------------------------ */
{
  ok(engageMiningLoop({ x: a.spot.x, y: a.spot.y, z: a.spot.z, name: a.spot.name, site: String(a.id) }), "MINE IT engages");
  const m = mission.active;
  ok(m?.name === "JOB LOOP", `it is the job loop, not the market loop (${m?.name})`);
  ok(validate(m).length === 0, `the job loop is a valid mission${validate(m).length ? " — " + JSON.stringify(validate(m)) : ""}`);
  const ops = m.steps.map((s) => s.op).join(" ");
  ok(ops === "MINE DOCK DELIVER SELL CHARGE", `steps: ${ops}`);
  ok(m.steps[1].target.kind === "station" && m.steps[1].target.id === a.stationId, `it docks at ${a.stationName}, the desk that ordered it — not the best bidder`);
  const until = m.steps[0].until;
  ok(until.any?.some((c) => c.k === "cargoOf" && c.id === a.good && c.v === a.qty), "it cuts until the order is aboard (or the hold is full)");

  /* short: docked at the desk without the full order → no pay, back round */
  ship.dockedAt = a.stationId;
  ship.hold[a.good] = Math.floor(a.qty / 2);
  mission.stepIx = 2; mission.run = {};
  tickMission(0.1);
  ok(contracts.active.includes(a) && mission.active?.loop?.mode === "count" && mission.stepIx === 3, "short of the order: nothing paid, the loop goes round again");
  ok(Math.abs(ship.hold[a.good] - Math.floor(a.qty / 2)) < 1e-6, "…and the half-order is kept through the SELL");
  tickMission(0.1);
  ok(Math.abs(ship.hold[a.good] - Math.floor(a.qty / 2)) < 1e-6, `SELL left the ${Math.floor(a.qty / 2)} ${a.good} aboard`);

  /* full: delivered, paid, and the loop ends after this round */
  ship.hold[a.good] = a.qty;
  const c0 = ship.credits;
  mission.stepIx = 2; mission.run = {};
  tickMission(0.1);
  ok(!contracts.active.includes(a) && ship.credits - c0 >= a.pay - 1e-6, `delivered at the desk: +${Math.round(ship.credits - c0)} cr (job pays ${a.pay})`);
  ok(mission.active?.loop?.mode === "none", "…and the loop will not go back out for a job that is closed");
  ok(!(ship.hold[a.good] > 0), "…the order left the hold");
  disengageAutopilot("test");
  ship.dockedAt = null;
}

/* ---- the plain loop is unchanged (no site) ----------------------------------------- */
{
  ok(engageMiningLoop({ x: a.spot.x, y: a.spot.y, z: a.spot.z, name: "free seam" }) && mission.active?.name === "MINE LOOP", "MINE with no job is still the market loop");
  disengageAutopilot("test");
}

console.log(`jobloop: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
