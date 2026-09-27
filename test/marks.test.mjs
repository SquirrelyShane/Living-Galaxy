/* LIVING GALAXY 0.3.67 — a mark sits on the thing it marks.
 *
 *   node --import ./test/three-register.mjs test/marks.test.mjs
 *
 * Reported: MINE IT (and other careers' marks) left the tag in empty space. A
 * waypoint was a copied point, and a seam job's point is the empty middle of
 * its scatter. Now a mark carries an anchor and asks the thing where it is.
 */

import { sim, launchSim, addWaypointAt, addAnchoredWaypoint, waypointPosition, waypointVelocity, targetPosition, targetVelocity, removeWaypoint } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { corps } from "../js/corps.js";
import { rockByKey, siteMarkRock, wearRock, depleted, nearbyRocks } from "../js/field.js";
import { siteById, siteRocks, clearSites } from "../js/sites.js";
import { boardFor, acceptContract, abandonContract, contracts, resetContracts, BOARD, markTarget } from "../js/contracts.js";
import { engageMiningLoop, apMine, autopilot, disengageAutopilot, tickAutopilot } from "../js/autopilot.js";
import { mission } from "../js/mission/run.js";
import { traffic } from "../js/npc/traffic.js";
import { resolveAnchor, anchorHint } from "../js/anchors.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

makePilot("Marks", "terran", "mining", null);
launchSim("MarksTest", "fixture");
sim.phase = "play";
const ship = sim.ship;
const honest = stations.filter((s) => !(s.hostile && !s.claimed) && s.sector !== "pirate");
for (const c of corps) c.standing = 100;

/* ---- a plain mark is still a plain point ----------------------------------------- */
{
  const wp = addWaypointAt("Here", 100, 200, 300);
  sim.time += 50;
  const p = waypointPosition(wp, {});
  ok(p.x === 100 && p.y === 200 && p.z === 300 && !wp.anchor, "addWaypointAt is unchanged: a fixed point");
  removeWaypoint(wp.id);
}

/* ---- a seam job marks a ROCK, not the middle of the scatter ----------------------- */
let job = null, a = null;
{
  resetContracts(); clearSites();
  for (let k = 0; k < 30 && !job; k++) for (const st of honest) { const o = boardFor(st, sim.time + BOARD.refresh * (60 + k)).find((x) => x.type === "mine" && !x.spot?.outer); if (o) { job = o; break; } }
  ok(job, `a mining job: ${job?.title}`);
  sim.time = Math.max(sim.time, job.posted);
  ok(acceptContract(job) === null, "accepted");
  a = contracts.active.find((x) => x.id === job.id);
  const wp = sim.waypoints.find((w) => w.job === a.id);
  ok(wp?.anchor?.kind === "site", `accepting marks the seam's rock (${wp?.name})`);
  const p = waypointPosition(wp, {});
  const rock = rockByKey(wp.anchor.key, sim.time);
  ok(rock && rock.site === String(a.id) && d3(p, rock) < 1e-6, `the mark is ON a site rock (${wp.anchor.key}, ${Math.round(rock?.r)} u ${rock?.oreName})`);
  const biggest = Math.max(...siteRocks(a.id).map((r) => r.r));
  ok(Math.abs(rock.r - biggest) < 1e-9, "the biggest rock of the seam");
  const dCentre = d3(p, a.spot);
  const nearestToCentre = Math.min(...nearbyRocks(a.spot, sim.time, 1).map((r) => d3(r, a.spot) - r.r));
  ok(dCentre > 0 && nearestToCentre > 0, `the old mark (the spot) had no rock under it — ${Math.round(nearestToCentre)} u of empty space to the nearest surface; the new one is ${Math.round(dCentre)} u from it, on the rock`);

  /* it rides the rock's drift */
  const before = { ...p };
  sim.time += 900;
  const q = waypointPosition(wp, {});
  const moved = rockByKey(wp.anchor.key, sim.time);
  ok(d3(before, q) > 1 && d3(q, moved) < 1e-6, `the rock drifts ${d3(before, q).toFixed(1)} u and the mark goes with it`);
  ok(targetPosition("waypoint", wp.id, {}) && d3(targetPosition("waypoint", wp.id, {}), moved) < 1e-6, "a lock on the mark lands on the rock");

  /* mined out → the next rock of the seam carries it */
  const first = wp.anchor.key;
  wearRock(first, 1);
  sim.time += 1;
  const r2 = waypointPosition(wp, {});
  ok(wp.anchor.key !== first && !wp.lost && rockByKey(wp.anchor.key, sim.time) && d3(r2, rockByKey(wp.anchor.key, sim.time)) < 1e-6, `mined out: the mark moves to the next rock (${wp.anchor.key})`);
  ok(Math.hypot(...Object.values(waypointVelocity(wp, {}))) === 0, "and the hop is not read as a speed");

  /* the seam's mark and the cutter agree */
  ok(siteMarkRock(a.id, sim.time)?.key === wp.anchor.key, "field.siteMarkRock names the same rock the chart shows");
}

/* ---- MINE IT: the loop carries the site; the mission's mark and the cutter go to the rock */
{
  engageMiningLoop({ x: a.spot.x, y: a.spot.y, z: a.spot.z, name: a.spot.name, site: String(a.id) });
  ok(sim.autoPlan.seam?.site === String(a.id), "MINE IT hands the loop the site, not just a point");
  ok(mission.active?.steps?.[0]?.target?.site === String(a.id), "the MINE step carries it");
  /* the step resolves on the autopilot's tick: its (transient) mark is on the same rock */
  for (let i = 0; i < 5 && !mission.run?.wpId; i++) tickAutopilot(0.05);
  const tw = sim.waypoints.find((w) => w.id === mission.run?.wpId);
  ok(tw?.transient && tw.anchor?.kind === "site" && d3(waypointPosition(tw, {}), siteMarkRock(a.id, sim.time)) < 1e-6, `the mission's seam mark is on the rock too (${tw?.name})`);
  const marked = siteMarkRock(a.id, sim.time);
  /* on the seam, a few rocks off: the cutter picks the MARKED rock even when another site rock is nearer */
  const others = nearbyRocks(marked, sim.time, 1).filter((r) => r.site === String(a.id) && r.key !== marked.key && (r.worn ?? 0) < 0.97);
  const decoy = others.sort((x, y) => d3(x, marked) - d3(y, marked)).pop() ?? others[0];
  if (decoy) {
    ship.pos.x = decoy.x + decoy.r + 150; ship.pos.y = decoy.y; ship.pos.z = decoy.z;
    ship.vel.x = ship.vel.y = ship.vel.z = 0;
    const res = apMine(sim.autoPlan.seam);
    ok(res === "cutting" && autopilot.rockKey === marked.key, `parked on another rock of the seam, the cutter still goes to the marked one (${res}, ${autopilot.rockKey})`);
  } else ok(true, "single-rock seam");
  /* 0.3.68 — the cutter gives up on the marked rock (240 s without closing): the mark goes with it */
  {
    const jobMark = sim.waypoints.find((w) => w.job === a.id);
    const was = siteMarkRock(a.id, sim.time).key;
    waypointPosition(jobMark, {});
    ok(jobMark.anchor.key === was, "before: chart and cutter on the same rock");
    autopilot.rockKey = was; autopilot.rockSince = sim.time - 300;
    ship.pos.x = a.spot.x; ship.pos.y = a.spot.y; ship.pos.z = a.spot.z;   // on the seam, not latched
    apMine(sim.autoPlan.seam);
    ok(autopilot.skip.get(was) > sim.time, "the loop skips the rock it cannot close on");
    sim.time += 1;
    const moved = waypointPosition(jobMark, {});
    const now = siteMarkRock(a.id, sim.time);
    ok(jobMark.anchor.key !== was && jobMark.anchor.key === now.key && d3(moved, now) < 1e-6 && !jobMark.lost, `the mark moves to the next rock (${was} → ${jobMark.anchor.key})`);
    apMine(sim.autoPlan.seam);
    ok(autopilot.rockKey === now.key, "and the cutter goes to the rock the mark is on now");
    sim.time += 901;
    waypointPosition(jobMark, {});
    ok(jobMark.anchor.key === now.key, "when the skip lapses the mark does not jump back while its rock is live");
  }
  disengageAutopilot("test");
  ok(!sim.waypoints.some((w) => w.transient && w.job === a.id), "the mission's own transient mark is not the job's");
}

/* ---- the job's marks go with the job ------------------------------------------------- */
{
  const mine = sim.waypoints.filter((w) => w.job === a.id).length;
  abandonContract(a.id);
  ok(mine > 0 && !sim.waypoints.some((w) => w.job === a.id), `abandoning the job takes its marks off the chart (${mine})`);
}

/* ---- a port mark rides the port ------------------------------------------------------ */
{
  const st = honest.find((s) => (s.vx ?? 0) !== 0 || (s.vz ?? 0) !== 0) ?? honest[0];
  const wp = addAnchoredWaypoint(st.name, { kind: "station", id: st.id }, st);
  const p0 = { ...waypointPosition(wp, {}) };
  ok(d3(p0, st) < 1e-6, "a port mark is on the port");
  /* move the port the way its orbit would */
  st.x += 4000; st.z -= 2500; sim.time += 10;
  const p1 = waypointPosition(wp, {});
  ok(d3(p1, st) < 1e-6, "the port moves, the mark moves with it");
  const v = waypointVelocity(wp, {});
  ok(Math.abs(v.x - 400) < 1e-6 && Math.abs(v.z + 250) < 1e-6, `and its velocity is the port's (${v.x}, ${v.z} u/s) — approach leads it`);
  ok(targetVelocity("waypoint", wp.id, {}).x === v.x, "targetVelocity reads it");
  const again = addAnchoredWaypoint("again", { kind: "station", id: st.id }, st);
  ok(again === wp && sim.activeWaypoint === wp.id, "marking the same port twice is one mark, made active");
  ok(anchorHint(wp.anchor) === "tracks the port", "the chart says what it follows");
  st.x -= 4000; st.z += 2500;
  removeWaypoint(wp.id);
}

/* ---- a hunted hull; gone → last seen ------------------------------------------------- */
{
  const n = traffic.find((x) => x.job !== "down");
  if (n) {
    const wp = markTarget({ id: "bounty-test", title: "Bounty", markId: n.id, markName: n.name });
    ok(wp?.anchor?.kind === "vessel" && d3(waypointPosition(wp, {}), n) < 1e-6, `a bounty mark is on ${n.name}`);
    n.x += 1234; sim.time += 1;
    ok(d3(waypointPosition(wp, {}), n) < 1e-6, "…and stays on it as it flies");
    const was = n.job; n.job = "down"; sim.time += 1;
    const p = waypointPosition(wp, {});
    ok(wp.lost && /\(last seen\)$/.test(wp.name) && d3(p, n) < 1e-6, `down: the mark keeps where it was, marked "${wp.name}"`);
    n.job = was; n.x -= 1234;
    sim.time += 1;
    ok(wp.lost, "and a lost mark stays lost (it does not jump to a respawn)");
    removeWaypoint(wp.id);
  } else ok(true, "no traffic in this sky");
}

/* ---- anchors that are not registered, or broken, are gone, never a throw ------------- */
ok(resolveAnchor({ kind: "nope", id: 1 }, 0, {}) === null && resolveAnchor(null, 0, {}) === null, "an unknown anchor resolves to nothing");
ok(rockByKey("not-a-key", 0) === null && rockByKey("site:missing:3", 0) === null, "rockByKey refuses what is not a rock");

console.log(`marks: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
