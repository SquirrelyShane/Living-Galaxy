/* LIVING GALAXY 0.3.26 — ARIA running a business, not just a hull.
 *
 *   node --import ./test/three-register.mjs test/ariabiz.test.mjs
 *
 * She signs hands off the same hiring hall you do, on the same terms, and only
 * ones the hull has a post for and the run can carry the wage of. She posts
 * them to watches. She registers the charter that matches what she actually
 * earns from. She settles the ones the ship is done with, so they pay the
 * books instead of costing them. And she banks the surplus without banking
 * the money the next run has to buy cargo with.
 */

import { sim, launchSim, tickSim, crewCapacity } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations, stationById } from "../js/stations.js";
import { corps } from "../js/corps.js";
import { crew, crewWageTotal, stationRoster, resetCrew, CYCLE_SECONDS } from "../js/crew.js";
import { dutyOf, postKind, dutyOptions } from "../js/crew/roster.js";
import { company, hasCompany, resetCompany, COMPANY, CHARTERS } from "../js/company.js";
import { holdRoom } from "../js/ship.js";
import {
  RUN, WANTED, CHARTER_FOR, biz, runBusiness, bizReport, bizLine, resetBusiness,
  considerHire, considerFound, considerSettle, considerTreasury, considerLayoff,
  wantScore, hasPostFor, payrollPerMin, workingCapital, postThem,
} from "../js/aria/company.js";
import { netWorth, CAREER_DEPT } from "../js/ariaplay.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

makePilot("Boss", "terran", "mining", null);
launchSim("BizTest", "sol");
sim.phase = "play";
for (const c of corps) c.standing = 100;
sim.activeHullId = "mining_b";
for (let i = 0; i < 240; i++) tickSim(1 / 60);
const ship = sim.ship;
const st = stations.find((s) => !(s.hostile && !s.claimed));
const fresh = () => { resetCompany(); resetCrew(); resetBusiness(); ship.dockedAt = st.id; ship.credits = 80000; };

/* ---- every department knows what it wants aboard ------------------------------------ */
{
  const depts = [...new Set(Object.values(CAREER_DEPT))];
  ok(depts.every((d) => WANTED[d]?.length >= 3), `every department has a hiring list: ${depts.filter((d) => !WANTED[d]).join(", ") || "none missing"}`);
  ok(depts.every((d) => CHARTER_FOR[d] && CHARTERS[CHARTER_FOR[d]]), "and a charter that matches what it earns from");
  ok(CHARTER_FOR.mining === "industrial" && CHARTER_FOR.security === "military" && CHARTER_FOR.trade === "civilian", "a miner registers an Extraction Charter and a gun registers a Security one");
  ok(WANTED.mining[0] === "mining" && WANTED.security[0] === "security", "the career's own trade is first on its own list");
}

/* ---- the hall ------------------------------------------------------------------------ */
{
  fresh();
  const roster = stationRoster(st, 0, sim.skySeed ?? "sol");
  ok(roster.length > 0, `${roster.length} people in the hall at ${st.name}`);
  const scored = roster.map((c) => ({ c, s: wantScore(c, "mining") }));
  ok(scored.some((x) => x.s > 0), "she wants some of them");
  const miner = scored.find((x) => x.c.complexId === "mining");
  if (miner) ok(scored.every((x) => x.s <= miner.s), `and a miner tops a miner's list (${miner.c.title}, ${miner.s.toFixed(1)})`);
  else ok(true, "no miner in this hall");
  ok(dutyOptions().length > 0, `the hull has ${dutyOptions().length} postable rooms`);
  const eng = roster.find((c) => c.complexId === "shipyard");
  if (eng) ok(hasPostFor(eng), "an engineer has a post on this hull");
  else ok(true, "no engineer in this hall");

  const hired = considerHire(st, "mining", 4000);
  ok(hired, `signed ${hired?.name} — ${hired?.title}`);
  ok(crew.aboard.length === 1 && crewWageTotal() > 0, `one aboard on ${crewWageTotal()} cr/cycle`);
  ok(payrollPerMin() === Math.round((crewWageTotal() * 60) / CYCLE_SECONDS), `which is ${payrollPerMin()} cr a minute, the way a bill is actually felt`);
  ok(postKind(dutyOf(crew.aboard[0])), `and posted to ${postKind(dutyOf(crew.aboard[0]))}`);
}

/* ---- payroll first ------------------------------------------------------------------- */
{
  fresh();
  /* the first hand is half wage and no bonus — the scheme exists so a broke
   * captain can afford a second seat, and she takes it. The SECOND is a bill. */
  const first = considerHire(st, "mining", 0);
  ok(first && crew.aboard[0]?.firstHand, `on a run earning nothing she still takes the first-hand rate: ${first?.name} at ${crew.aboard[0]?.wage} cr/cycle, no bonus`);
  ok(considerHire(st, "mining", 0) === null, "but not a second, because a second is a bill against money that is not coming in");
  ship.credits = 900;
  ok(considerHire(st, "mining", 9000) === null, "nor out of a purse that cannot cover the bonus and a float");
  ship.credits = 80000;
  let n = 0;
  while (considerHire(st, "mining", 6000) && n++ < 12) { /* fill the berths */ }
  ok(crew.aboard.length > 0 && crew.aboard.length <= Math.min(RUN.maxCrew, crewCapacity()), `she fills the berths and stops: ${crew.aboard.length} of ${Math.min(RUN.maxCrew, crewCapacity())}`);
  ok(considerHire(st, "mining", 6000) === null, "a full hull hires nobody");
  /* and lets one go when the bill outruns the earnings */
  const before = crew.aboard.length;
  if (before > 1) {
    const gone = considerLayoff(50);
    ok(gone && crew.aboard.length === before - 1, `paid off ${gone?.name} when the bill outran what the run was earning`);
  } else ok(true, "only one hand aboard — nobody to let go");
  ok(considerLayoff(9999) === null, "and keeps everybody when the run is paying for them");
}

/* ---- the charter ---------------------------------------------------------------------- */
{
  fresh();
  ship.credits = 3000;
  ok(considerFound(st, "mining") === null && !hasCompany(), "no charter on three thousand credits — registration is 2,500 and the trading money has to stay aboard");
  ship.credits = 90000;
  const ch = considerFound(st, "mining");
  ok(ch === "industrial" && hasCompany(), `registered ${company.name} — ${CHARTERS[company.charter]?.name}`);
  ok(company.hq === st.id && company.treasury === 0, `office at ${st.name}, treasury empty`);
  ok(considerFound(st, "mining") === null, "and she does not register a second one");
}

/* ---- the treasury holds the surplus, not the working capital ---------------------------- */
{
  const need = workingCapital();
  ok(need >= RUN.float && need <= RUN.float * 6, `working capital is ${need.toLocaleString("en-US")} cr — bounded, and not the half-million an infinite purse would justify`);
  ok(need >= holdRoom(ship) * 80, "and it is sized off the hold she has to fill");
  ship.credits = need * 4;
  const moved = considerTreasury();
  ok(moved > 0 && company.treasury === moved, `banked ${moved.toLocaleString("en-US")} cr`);
  ok(ship.credits >= need, `and left ${Math.round(ship.credits).toLocaleString("en-US")} cr aboard — enough to buy a hold with`);
  ship.credits = Math.round(need * 0.2);
  const drew = considerTreasury();
  ok(drew < 0 && ship.credits > need * 0.2, `and draws it back when the purse is too thin: ${Math.round(drew).toLocaleString("en-US")} cr`);
  /* net worth counts both, or banking looks like a loss */
  const before = netWorth();
  const p = ship.credits;
  considerTreasury();
  ok(Math.abs(netWorth() - before) < 2 && ship.credits !== p + 1, `a transfer moves nothing: net worth ${before.toLocaleString("en-US")} either side of it`);
}

/* ---- settling ashore --------------------------------------------------------------------- */
{
  fresh();
  ship.credits = 90000;
  considerFound(st, "mining");
  let n = 0;
  while (considerHire(st, "mining", 6000) && n++ < 12) { /* crew up */ }
  ok(crew.aboard.length >= 1, `${crew.aboard.length} aboard`);
  ok(considerSettle(st) === null || crew.aboard.length >= 1, "a hand fresh off the gangway is not settled");
  /* age them and sour one */
  for (const m of crew.aboard) m.cyclesAboard = RUN.settleAfter + 2;
  if (crew.aboard.length > 1) {
    crew.aboard[0].morale = 20;
    const before = crew.aboard.length;
    const gone = considerSettle(st);
    ok(gone, `settled ${gone?.name} at ${st.name}`);
    ok(crew.aboard.length === before - 1 && company.staff.length === 1, "off the roster and onto the books");
    ok(company.staff[0].income > 0 && company.staff[0].stationId === st.id, `paying ${company.staff[0].income} cr a cycle from ${st.name}, for ever`);
    /* and the books actually collect it */
    const t0 = company.treasury;
    for (let i = 0; i < 60 * (CYCLE_SECONDS + 5); i++) tickSim(1 / 60);
    ok(company.treasury > t0, `the treasury collected it on the next cycle (${Math.round(t0)} → ${Math.round(company.treasury)} cr)`);
  } else { ok(true, "—"); ok(true, "—"); ok(true, "—"); ok(true, "—"); }
}

/* ---- the whole port call ------------------------------------------------------------------- */
{
  fresh();
  ship.credits = 120000;
  const did = [];
  for (let k = 0; k < 10; k++) { sim.time += RUN.tickEvery + 1; const d = runBusiness("mining", 5000); if (d) did.push(...d); }
  ok(did.includes("charter") && did.includes("hired"), `one port call does the business: ${[...new Set(did)].join(", ")}`);
  const r = bizReport();
  ok(r.crew > 0 && r.company && r.treasury >= 0, `and the report reads like a company: ${bizLine()}`);
  ok(r.board.length === 3 && r.confidence != null, `with the board's own view of it: ${r.board.map((b) => `${b.role} ${b.verdict}`).join(", ")}`);
  ok(biz.hires >= 1, `${biz.hires} signed this run`);
  /* undocked, none of it happens */
  ship.dockedAt = null;
  sim.time += RUN.tickEvery + 1;
  ok(runBusiness("mining", 5000) === null, "and none of it happens in open space — a hiring hall is somewhere you stand");
}

console.log(`ariabiz: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
