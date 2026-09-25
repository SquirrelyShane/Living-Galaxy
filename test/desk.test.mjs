/* LIVING GALAXY 0.3.18 — the desk is a port's whole payroll.
 *
 *   node --import ./test/three-register.mjs test/desk.test.mjs
 *
 * Two dozen jobs a port, across nine departments that between them pay every
 * career; posted by the landlord AND the tenant outfits; sized to the hull you
 * are flying and gated on what it carries; shaped by the port's sector; and
 * every new kind of job completes end to end.
 */

import { sim, launchSim } from "../js/sim.js";
import { bulkOf } from "../js/materials.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { corps, corpOfStation } from "../js/corps.js";
import { COMPLEXES } from "../js/careers/complexes.js";
import { BODIES } from "../js/bodies.js";
import {
  boardFor, boardByCategory, acceptBlocker, acceptContract, abandonContract, deliverableAt, deliverContracts, tickContracts,
  noteDestroyed, targetPos, contracts, CATEGORIES, CATEGORY_ORDER, issuersAt, hullFit, BOARD, jobStatus, resetContracts,
} from "../js/contracts.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("Desk", "terran", "commerce", null);
launchSim("DeskTest", "fixture");
sim.phase = "play";
const ship = sim.ship;
const honest = stations.filter((s) => !(s.hostile && !s.claimed) && s.sector !== "pirate");

/* ---- volume, departments, careers ------------------------------------------------ */
{
  const counts = honest.map((st) => boardFor(st).length);
  ok(counts.every((n) => n >= 18), `every honest port posts a full desk (${counts.join(", ")} offers; was 5)`);
  let covered = 0;
  for (const st of honest) { const cats = new Set(boardFor(st).map((o) => o.cat)); if (cats.size >= 8) covered++; }
  ok(covered === honest.length, `every honest port posts in at least 8 of the 9 departments (${covered}/${honest.length})`);
  const careers = Object.keys(COMPLEXES ?? {});
  const catOfCareer = (c) => Object.entries(CATEGORIES).find(([, v]) => v.careers.includes(c))?.[0];
  ok(careers.length >= 16 && careers.every((c) => catOfCareer(c)), `every one of ${careers.length} careers has a department`);
  const starved = careers.filter((c) => honest.filter((st) => boardFor(st).some((o) => o.cat === catOfCareer(c))).length < Math.ceil(honest.length * 0.75));
  ok(starved.length === 0, `and work in it at three ports in four or more (starved: ${starved.join(", ") || "none"})`);
  ok(honest.every((st) => { const t = boardFor(st).map((o) => o.title); return new Set(t).size === t.length; }), "no port posts the same job twice");
  const floor = honest.every((st) => { const t = boardFor(st).filter((o) => o.cat === "trade"); return t.length >= 4 && t.filter((o) => o.tier === "low").length >= 2; });
  ok(floor, `a trader's own department always has work, two of it Standard (${honest.map((st) => boardFor(st).filter((o) => o.cat === "trade").length).join(", ")})`);
  const kinds = new Set(honest.flatMap((st) => boardFor(st).map((o) => o.type)));
  ok(kinds.size >= 18, `${kinds.size} kinds of job across the sky: ${[...kinds].join(", ")}`);
}

/* ---- the landlord and the tenants --------------------------------------------------- */
{
  for (const st of honest.slice(0, 4)) {
    const iss = issuersAt(st);
    ok(iss.length >= 3 && iss[0] === corpOfStation(st) && new Set(iss.map((c) => c.id)).size === iss.length, `${st.name}: ${iss.map((c) => c.name).join(", ")}`);
  }
  const tenantJobs = honest.flatMap((st) => boardFor(st)).filter((o) => o.tenant);
  ok(tenantJobs.length > honest.length * 5, `tenant outfits post real work (${tenantJobs.length} offers)`);
  ok(tenantJobs.every((o) => o.corpId && o.corpId !== corpOfStation(stations.find((s) => s.id === o.stationId))?.id), "and it is theirs, not the landlord's");
}

/* ---- the nested view ------------------------------------------------------------------ */
{
  const st = honest[0];
  const view = boardByCategory(st);
  ok(view.length >= 8 && view.every((c) => CATEGORIES[c.cat] && c.issuers.length >= 1 && c.offers === c.issuers.reduce((a, g) => a + g.offers.length, 0)), `departments → issuers → offers (${view.map((c) => `${c.name} ${c.offers}`).join(" · ")})`);
  ok(view.map((c) => c.cat).every((c, i, a) => i === 0 || CATEGORY_ORDER.indexOf(c) > CATEGORY_ORDER.indexOf(a[i - 1])), "in a fixed department order");
  ok(view.every((c) => c.issuers.every((g) => g.offers.every((o, i, a) => i === 0 || (acceptBlocker(a[i - 1]) ? 1 : 0) <= (acceptBlocker(o) ? 1 : 0)))), "takeable offers first in every issuer");
}

/* ---- sized to the hull, gated on the hull -------------------------------------------- */
{
  resetContracts();
  const st = honest[0];
  sim.activeHullId = null;
  ship.cargoCap = 60;
  const small = boardFor(st, sim.time + BOARD.refresh * 3).filter((o) => o.mech === "deliver" || o.mech === "haul");
  ship.cargoCap = 2000;
  const big = boardFor(st, sim.time + BOARD.refresh * 3).filter((o) => o.mech === "deliver" || o.mech === "haul");
  const avg = (l) => l.reduce((a, o) => a + o.qty, 0) / Math.max(1, l.length);
  /* 0.3.52: cap is hold units, and a light good packs more units into them */
  ok(small.every((o) => o.qty <= Math.ceil(60 / bulkOf(o.good))) && avg(big) > avg(small) * 3, `cargo work is sized to the hold (avg ${avg(small).toFixed(0)} at 60, ${avg(big).toFixed(0)} at 2000)`);
  ship.cargoCap = 400;
  const fit0 = hullFit();
  ok(!fit0.armed, `the trainer is unarmed (${fit0.hull})`);
  const keep = corps.map((c) => c.standing);
  for (const c of corps) c.standing = 100;            // standing is its own gate; this one is about the hull
  const combat = honest.flatMap((s) => boardFor(s)).filter((o) => o.armed);
  ok(combat.length > 0 && combat.every((o) => /armed hull/.test(acceptBlocker(o) ?? "")), `combat work says it needs guns (${acceptBlocker(combat[0])})`);
  sim.activeHullId = "security_b";
  ok(hullFit().armed && combat.every((o) => !/armed hull/.test(acceptBlocker(o) ?? "")), "and opens on an armed hull");
  sim.activeHullId = null;
  corps.forEach((c, i) => { c.standing = keep[i]; });
}

/* ---- the sector shapes the desk ---------------------------------------------------------- */
{
  const share = (sector, cats) => {
    const ports = honest.filter((s) => s.sector === sector);
    const all = [];
    for (const st of ports) for (let k = 0; k < 6; k++) all.push(...boardFor(st, sim.time + BOARD.refresh * (10 + k)));
    return all.length ? all.filter((o) => cats.includes(o.cat)).length / all.length : null;
  };
  const indMining = share("industrial", ["mining", "industry"]), civMining = share("civilian", ["mining", "industry"]);
  if (indMining != null && civMining != null) ok(indMining > civMining, `an industrial yard posts more mining and industry work than a habitat (${(indMining * 100).toFixed(0)}% vs ${(civMining * 100).toFixed(0)}%)`);
  const civCivic = share("civilian", ["civic"]), indCivic = share("industrial", ["civic"]);
  if (civCivic != null && indCivic != null) ok(civCivic > indCivic, `and a habitat more civic work (${(civCivic * 100).toFixed(0)}% vs ${(indCivic * 100).toFixed(0)}%)`);
}

/* ---- the new mechanics, end to end ----------------------------------------------------------- */
const find = (pred) => { for (let k = 0; k < 40; k++) for (const st of honest) { const o = boardFor(st, sim.time + BOARD.refresh * (20 + k)).find(pred); if (o) return o; } return null; };
{
  resetContracts();
  sim.activeHullId = "security_b";
  for (const c of corps) c.standing = 100;
  /* a visit job: fly each point, hold, report */
  const v = find((o) => o.type === "patrol");
  ok(v, "a picket sweep is posted somewhere");
  if (v) {
    sim.time = Math.max(sim.time, v.posted);
    ok(acceptContract(v) === null, `accepted ${v.title}`);
    const a = contracts.active.find((x) => x.id === v.id);
    ok(sim.waypoints.some((w) => w.name.includes(v.title)), "and its first point is on the chart");
    for (let leg = 0; leg < a.targets.length; leg++) {
      const p = targetPos(a.targets[leg]);
      ship.pos = { x: p.x, y: p.y, z: p.z };
      for (let i = 0; i < 40; i++) tickContracts(1);
    }
    ok(a.progress >= 1 && /report/.test(jobStatus(a)), `every point flown and held: ${jobStatus(a)}`);
    ship.dockedAt = null;
    ship.dockedAt = v.stationId;
    const c0 = ship.credits;
    ok(deliverableAt(v.stationId).includes(a) && deliverContracts(v.stationId) >= v.pay && ship.credits >= c0 + v.pay, `reported and paid ${v.pay} cr`);
  }
  /* a survey */
  const s = find((o) => o.type === "survey");
  if (s) {
    ship.dockedAt = null;
    acceptContract(s);
    const a = contracts.active.find((x) => x.id === s.id);
    tickContracts(1);
    ok(a.progress === 0, "a survey job waits for the scan");
    sim.scanned.add(s.bodyId);
    tickContracts(1);
    ok(a.progress === 1, `scanning ${s.bodyName} completes it`);
    ship.dockedAt = s.stationId;
    ok(deliverContracts(s.stationId) >= s.pay, "and it pays at the desk");
  } else ok(true, "every world already surveyed in this sky");
  /* a drone cull counts drones */
  const r = find((o) => o.type === "rogues");
  if (r) {
    ship.dockedAt = null;
    acceptContract(r);
    const a = contracts.active.find((x) => x.id === r.id);
    noteDestroyed({ id: "pirate", role: "pirate" });
    ok(a.kills === 0, "a pirate is not a drone");
    for (let i = 0; i < r.count; i++) noteDestroyed({ id: `rog:${i}`, rogue: true });
    ok(a.progress === 1 && jobStatus(a).includes("pays"), `${r.count} drones down: ${jobStatus(a)}`);
    abandonContract(a.id);
  } else ok(true, "no nests in this sky");
  /* procurement: buy it anywhere, deliver here */
  const pr = find((o) => o.type === "procure");
  ok(pr && pr.sourceName && pr.text.includes(pr.sourceName), `procurement names where it is sold (${pr?.title} — ${pr?.sourceName})`);
  if (pr) {
    ship.dockedAt = null;
    acceptContract(pr);
    ship.hold[pr.good] = (ship.hold[pr.good] ?? 0) + pr.qty;
    ship.dockedAt = pr.stationId;
    ok(deliverContracts(pr.stationId) >= pr.pay, `delivered and paid ${pr.pay} cr`);
  }
  /* a cargo pod comes aboard at the site and is delivered home */
  const pod = find((o) => o.type === "pod");
  if (pod) {
    ship.dockedAt = null;
    for (const k of Object.keys(ship.hold)) delete ship.hold[k];
    ok(acceptContract(pod) === null, `accepted ${pod.title}`);
    const a = contracts.active.find((x) => x.id === pod.id);
    const p = targetPos(a.targets[0]);
    ship.pos = { x: p.x, y: p.y, z: p.z };
    for (let i = 0; i < 20; i++) tickContracts(1);
    ok(a.progress === 1 && (ship.hold[pod.good] ?? 0) >= pod.qty, `the pod is aboard (${ship.hold[pod.good]} ${pod.good})`);
    ship.dockedAt = pod.stationId;
    ok(deliverContracts(pod.stationId) >= pod.pay, "and the finder is paid");
  }
  ok(BOARD.maxActive >= 5, `a working pilot holds ${BOARD.maxActive} jobs at once`);
  sim.activeHullId = null;
  ship.dockedAt = null;
}

console.log(`desk: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
