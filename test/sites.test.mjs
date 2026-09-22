/* LIVING GALAXY 0.3.20 — a job with rock in it names a place, and the rock is there.
 *
 *   node --import ./test/three-register.mjs test/sites.test.mjs
 *
 * Mining, ice, vein and assay jobs carry a spot in a real belt with a name, a
 * bearing and a distance from the port; accepting one lays that ore into the
 * belt AT the spot, as real rocks that cut and deplete; the belt's own mix is
 * still there around them; and closing the job takes the seam away.
 */

import { sim, launchSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { corps } from "../js/corps.js";
import { currentSystem } from "../js/bodies.js";
import { nearbyRocks, depleted, wearRock, inBelt, CELL } from "../js/field.js";
import { sites, openSite, closeSite, clearSites, siteById, sitesNear, pickSpot, spotLine, siteReport, classForOre } from "../js/sites.js";
import { boardFor, acceptContract, abandonContract, deliverContracts, contracts, resetContracts, BOARD, jobStatus } from "../js/contracts.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };

makePilot("Site", "terran", "mining", null);
launchSim("SiteTest", "fixture");
sim.phase = "play";
const ship = sim.ship;
const honest = stations.filter((s) => !(s.hostile && !s.claimed) && s.sector !== "pirate");
for (const c of corps) c.standing = 100;

/* ---- the spot the desk picks ---------------------------------------------------- */
{
  const st = honest[0];
  const a = pickSpot("seed-a", currentSystem, st), b = pickSpot("seed-a", currentSystem, st), c = pickSpot("seed-b", currentSystem, st);
  ok(a && a.x === b.x && a.z === b.z, "a spot is deterministic in its seed");
  ok(c && (c.x !== a.x || c.z !== a.z), "and a different seed is a different stretch of belt");
  ok(inBelt(a), `it is in the belt (${Math.round(Math.hypot(a.x, a.z))} u out, ${Math.round(a.y)} u off the plane)`);
  ok(/^the \w+ (Drift|Reach|Shoal)$/.test(a.name), `with a name: ${a.name}`);
  ok(a.bearing >= 0 && a.bearing < 360 && a.dist > 0 && /km out from/.test(spotLine(a, st)), `and a bearing and a range: ${spotLine(a, st)}`);
  const outer = pickSpot("seed-c", currentSystem, st, { outer: true });
  if (currentSystem.outerBelt) ok(Math.hypot(outer.x, outer.z) > currentSystem.belt.outer, `an ice job looks past the frost line (${Math.round(Math.hypot(outer.x, outer.z))} u)`);
  else ok(true, "no outer belt in this sky");
}

/* ---- a site is rock, in the field, among other rock ----------------------------- */
{
  clearSites();
  const spot = pickSpot("lay", currentSystem, honest[0]);
  const before = nearbyRocks(spot, sim.time, 1).length;
  const beforeOres = new Set(nearbyRocks(spot, sim.time, 1).map((r) => r.ore));
  const s = openSite({ id: "test1", ore: "chromite", count: 9, x: spot.x, y: spot.y, z: spot.z, r: 2200, name: spot.name });
  ok(s && siteById("test1") === s && sitesNear(spot, 5000).length === 1, "the site opens");
  const rocks = nearbyRocks(spot, sim.time, 1);
  const mine = rocks.filter((r) => r.site === "test1");
  ok(mine.length === 9, `all nine of its rocks are in the field at the spot (${mine.length})`);
  ok(mine.every((r) => r.ore === "chromite" && r.rich && r.cls === classForOre("chromite") && r.r > 40 && r.key.startsWith("site:")), "every one carries the job's ore, cuts rich, and looks like the class that holds it");
  ok(rocks.length === before + 9, `laid on top of the belt, not instead of it (${before} → ${rocks.length})`);
  const ores = new Set(rocks.map((r) => r.ore));
  ok(ores.size > 1 && [...beforeOres].every((o) => ores.has(o)), `and the belt's own ores are all still there to cut (${ores.size} ores in reach)`);
  /* it mines out like any other rock */
  const k = mine[0].key;
  wearRock(k, 1);
  ok((depleted.get(k) ?? 0) >= 1 && !nearbyRocks(spot, sim.time, 1).some((r) => r.key === k), "a site rock mined out is gone like any other");
  const rep = siteReport(depleted)[0];
  ok(rep.left === 8 && rep.rocks === 9 && rep.ore === "chromite", `the site knows what is left (${rep.left}/${rep.rocks})`);
  /* and the cells are honest once it closes */
  closeSite("test1");
  ok(!nearbyRocks(spot, sim.time, 1).some((r) => r.site === "test1"), "closing the site takes its rock away");
  ok(nearbyRocks(spot, sim.time, 1).length === before, "leaving the belt exactly as it was");
  depleted.delete(k);
}

/* ---- the board posts places ------------------------------------------------------- */
{
  resetContracts();
  const rockJobs = [];
  for (let k = 0; k < 20 && rockJobs.length < 12; k++) for (const st of honest) rockJobs.push(...boardFor(st, sim.time + BOARD.refresh * (30 + k)).filter((o) => o.cat === "mining" || o.type === "assay"));
  ok(rockJobs.length > 0, `${rockJobs.length} rock jobs posted`);
  ok(rockJobs.every((o) => o.spot && o.targets?.length === 1 && inBelt(o.spot)), "every one names a stretch of belt and puts it on the chart");
  ok(rockJobs.every((o) => /km out from/.test(o.text) && o.text.includes(o.spot.name)), `and says where in the posting: "${rockJobs[0].text.slice(-90)}"`);
  const ice = rockJobs.find((o) => o.type === "ice");
  if (ice && currentSystem.outerBelt) ok(Math.hypot(ice.spot.x, ice.spot.z) > currentSystem.belt.outer, "an ice run points past the frost line");
  else ok(true, "no ice run in this sample");
}

/* ---- accept → the seam is there; deliver → it is gone ------------------------------- */
{
  resetContracts();
  clearSites();
  let job = null;
  for (let k = 0; k < 30 && !job; k++) for (const st of honest) { const o = boardFor(st, sim.time + BOARD.refresh * (60 + k)).find((x) => x.type === "mine" && !x.spot?.outer); if (o) { job = o; break; } }
  ok(job, `a mining job to take: ${job?.title}`);
  sim.time = Math.max(sim.time, job.posted);
  ok(acceptContract(job) === null, "accepted");
  const a = contracts.active.find((x) => x.id === job.id);
  const site = siteById(a.id);
  ok(site && site.ore === job.good && site.count >= 4, `a seam of ${site?.count} ${site?.oreName} rocks opened at ${site?.name}`);
  ok(sim.autoPlan.seam && Math.abs(sim.autoPlan.seam.x - a.spot.x) < 1, "the mining autopilot is pointed at it");
  ok(sim.waypoints.some((w) => w.name.includes(a.spot.name) || w.name.includes(a.title)), "and it is on the chart");
  const there = nearbyRocks(a.spot, sim.time, 1).filter((r) => r.site === a.id);
  ok(there.length === site.count && there.every((r) => r.ore === job.good), `the ore is in the rock when you get there (${there.length} rocks)`);
  ok(/cut it in/.test(jobStatus(a)), `and the job says where: ${jobStatus(a)}`);
  /* cut it (the cutter's own path is turrets.js; the contract only cares that it is aboard) */
  ship.hold[a.good] = (ship.hold[a.good] ?? 0) + a.qty;
  ship.dockedAt = a.stationId;
  const paid = deliverContracts(a.stationId);
  ok(paid >= job.pay, `delivered for ${paid} cr`);
  ok(!siteById(job.id) && !nearbyRocks(a.spot, sim.time, 1).some((r) => r.site === job.id), "and the seam closes with the job");
  ship.dockedAt = null;
  /* abandoning closes it too */
  let job2 = null;
  for (let k = 0; k < 30 && !job2; k++) for (const st of honest) { const o = boardFor(st, sim.time + BOARD.refresh * (90 + k)).find((x) => x.cat === "mining"); if (o) { job2 = o; break; } }
  if (job2) {
    acceptContract(job2);
    ok(sites.size === 1, "a second job opens its own seam");
    abandonContract(job2.id);
    ok(sites.size === 0, "abandoning it closes that seam");
  }
}

console.log(`sites: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
