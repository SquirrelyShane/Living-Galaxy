/* LIVING GALAXY — ARIA running a business, not just a hull.
 *
 * 0.3.26. A career in this game is a company: you sign hands, you post them to
 * watches, you register a charter, you settle people at ports where they earn
 * you a share of a wage forever, and a board of three sits above you being
 * unhappy about different things. ARIA did none of it. She flew a one-seat
 * ship with an empty roster and an empty treasury for the whole of every run,
 * which is not a career — it is a courier with ambitions.
 *
 * This is the bridge's business side, and it is the same machinery the deck
 * gives you: `stationRoster` / `hireCrew` for the hall, `setDuty` for the
 * watch bill, `foundCompany` / `transfer` / `settleAsStaff` for the charter.
 * Nothing here has its own economy. If ARIA can afford a hand, so can you, on
 * the same terms, at the same desk.
 *
 * The rules she works to, in order:
 *
 *   PAYROLL FIRST. A wage is a standing bill against the purse every ninety
 *   seconds. She will not sign a hand she cannot carry for `RUN.cover` cycles
 *   out of what the run is actually earning, because a ship that cannot make
 *   payroll loses the crew AND the morale, and morale is what the watch bill
 *   is worth.
 *
 *   HIRE FOR THE WATCH, NOT FOR THE ROSTER. A hand is worth their wage if the
 *   hull has a post for them — Engineering works off the maintenance backlog,
 *   Cargo stows the hold, Medbay keeps the rest of them upright — or if their
 *   trade is the career's own. Anything else is a passenger.
 *
 *   A CHARTER WHEN THERE IS SOMETHING TO CHARTER. Registration is 2,500 cr and
 *   an office; she waits until the run is clearly paying and then registers
 *   the charter that matches what she actually earns from, because the
 *   Registrar's seat on the board scores exactly that.
 *
 *   SETTLE THE ONES THE SHIP IS DONE WITH. A hand with nowhere to stand is
 *   worth more ashore: settled staff pay the treasury a share of their wage
 *   every cycle, for ever, and it is the only income in the game that does not
 *   need the hull to be anywhere.
 */

import { sim, crewCapacity, logEvent } from "../sim.js";
import { stationById } from "../stations.js";
import { crew, stationRoster, hireCrew, hireTerms, dismissCrew, crewWageTotal, wageFor, CYCLE_SECONDS } from "../crew.js";
import { dutyOptions, setDuty, dutyOf, postKind, currentPlan } from "../crew/roster.js";
import { company, hasCompany, foundCompany, transfer, settleAsStaff, staffIncome, suggestName, boardBrief, CHARTERS, COMPANY } from "../company.js";
import { CATEGORIES } from "../contracts.js";
import { bestRoute } from "../traderoutes.js";
import { holdRoom } from "../ship.js";

export const RUN = {
  cover: 8,            // cycles of payroll she keeps in hand before signing anybody
  float: 6000,         // credits that stay aboard whatever the treasury wants
  foundAt: 12000,      // purse at which a charter starts to look like a good idea
  settleMorale: 42,    // a hand this unhappy is better off ashore than aboard
  settleAfter: 6,      // cycles aboard before settling one is anything but churn
  maxCrew: 6,          // she will not out-hire a hull she has to fly herself
  tickEvery: 20,       // s of sky between looks at the business
};

/* Which trades are worth a berth, by department. The first entry is the
 * career's own; the rest are the posts every hull needs standing. */
export const WANTED = {
  mining:    ["mining", "shipyard", "healthcare", "logistics"],
  logistics: ["logistics", "shipyard", "healthcare", "communications"],
  trade:     ["commerce", "logistics", "shipyard", "healthcare"],
  security:  ["security", "shipyard", "healthcare", "communications"],
  salvage:   ["salvage", "shipyard", "manufacturing", "healthcare"],
  industry:  ["manufacturing", "construction", "shipyard", "healthcare"],
  energy:    ["energy", "shipyard", "healthcare", "manufacturing"],
  science:   ["research", "navigation", "shipyard", "healthcare"],
  civic:     ["healthcare", "agriculture", "education", "communications"],
};

/* The charter that matches what a department actually earns from. */
export const CHARTER_FOR = {
  mining: "industrial", industry: "industrial", energy: "industrial",
  logistics: "logistic", trade: "civilian", salvage: "civilian",
  security: "military", civic: "agricultural", science: "industrial",
};

export const biz = { at: -1e9, log: [], hires: 0, settled: 0, founded: false, moved: 0 };

const note = (text) => { biz.log.push({ t: Math.round(sim.time), text }); if (biz.log.length > 60) biz.log.shift(); };

/** Payroll as a bill: credits a minute, not credits a cycle. */
export const payrollPerMin = () => Math.round((crewWageTotal() * 60) / CYCLE_SECONDS);

/** What one more hand at this wage would add to the bill, per cycle. */
export const wageOf = (c) => hireTerms(c).wage;

/**
 * Is there a post on this hull for this trade? A hand who can stand a watch is
 * worth a wage; a hand who cannot is a passenger with an opinion.
 */
export function hasPostFor(c) {
  const opts = dutyOptions().map((o) => o.kind);
  const want = { shipyard: "eng", healthcare: "med", logistics: "cargo", commerce: "office", communications: "sensor", security: "sec", agriculture: "agri", research: "lab", manufacturing: "works", construction: "works", navigation: "bridge" }[c.complexId];
  return want ? opts.includes(want) : false;
}

/** How much she wants this candidate, 0 and up. Career first, then the watch. */
export function wantScore(c, dept) {
  const list = WANTED[dept] ?? [];
  const i = list.indexOf(c.complexId);
  let s = i >= 0 ? 4 - i : 0;
  if (hasPostFor(c)) s += 1.5;
  if (crew.aboard.some((m) => m.complexId === c.complexId)) s -= 1.2;   // a second engineer is worth less than a first
  s += Math.min(1, (c.letter ? "ABCDEFG".indexOf(c.letter) : 0) * 0.25);
  return s;
}

/* ---- the hall --------------------------------------------------------------------- */

/**
 * Sign the best hand this port has, if the run can carry the wage.
 * `earnPerMin` is what ARIA is actually making, which is the only honest test
 * of whether another wage is affordable.
 */
export function considerHire(st, dept, earnPerMin = 0) {
  if (!st || sim.ship.dockedAt !== st.id) return null;
  const cap = Math.min(RUN.maxCrew, crewCapacity());
  if (crew.aboard.length >= cap) return null;
  const roster = stationRoster(st, Math.floor(sim.time / 600), sim.skySeed ?? "sol");
  const picks = roster
    .map((c) => ({ c, want: wantScore(c, dept), terms: hireTerms(c) }))
    .filter((p) => p.want > 0)
    .sort((a, b) => b.want - a.want || a.terms.wage - b.terms.wage);
  for (const p of picks) {
    const billAfter = crewWageTotal() + p.terms.wage;
    const perMin = Math.round((billAfter * 60) / CYCLE_SECONDS);
    /* the bill has to be covered by what the run earns, and the bonus paid out
     * of money she does not need to buy cargo with */
    if (perMin > Math.max(120, earnPerMin * 0.45)) continue;
    if (sim.ship.credits - p.terms.bonus < RUN.float * 0.5) continue;
    if (billAfter * RUN.cover > sim.ship.credits - p.terms.bonus) continue;
    const why = hireCrew(p.c, sim.ship, cap);
    if (why) continue;
    biz.hires++;
    postThem(p.c);
    note(`signed ${p.c.name} — ${p.c.title}, ${p.terms.wage} cr/cycle${p.terms.firstHand ? " (first hand, half rate)" : ""}`);
    return p.c;
  }
  return null;
}

/** Put a new hand where the hull needs one, not where the roster defaults them. */
export function postThem(m) {
  const opts = dutyOptions().map((o) => o.kind);
  const standing = new Set(crew.aboard.map((x) => (x.id === m.id ? null : postKind(dutyOf(x)))).filter(Boolean));
  /* the posts that pay for themselves, in the order a short-handed ship fills them */
  for (const k of ["eng", "cargo", "med", "sensor", "sec", "office"]) {
    if (!opts.includes(k) || standing.has(k)) continue;
    if (!setDuty(m.id, k)) return k;
  }
  return null;
}

/** Let one go when the purse cannot carry them. Returns who, or null. */
export function considerLayoff(earnPerMin = 0) {
  if (crew.aboard.length <= 1) return null;
  const bill = payrollPerMin();
  const broke = sim.ship.credits < crewWageTotal() * 2;
  if (!broke && bill <= Math.max(150, earnPerMin * 0.6)) return null;
  /* the most expensive hand with no post is the one that goes */
  const order = [...crew.aboard].sort((a, b) => (hasPostFor(a) ? 1 : 0) - (hasPostFor(b) ? 1 : 0) || b.wage - a.wage);
  const m = order[0];
  if (!m) return null;
  dismissCrew(m.id);
  note(`let ${m.name} go — payroll ${bill} cr/min against ${Math.round(earnPerMin)} cr/min earned`);
  return m;
}

/* ---- the charter ------------------------------------------------------------------- */

/** Register when there is something to register. Returns the charter, or null. */
export function considerFound(st, dept) {
  if (hasCompany() || !st || sim.ship.dockedAt !== st.id) return null;
  if (st.hostile && !st.claimed) return null;
  if (sim.ship.credits < Math.max(RUN.foundAt, workingCapital() + COMPANY.registration)) return null;
  const charter = CHARTER_FOR[dept] ?? "industrial";
  const why = foundCompany(suggestName(), charter);
  if (why) return null;
  biz.founded = true;
  note(`registered ${company.name} at ${st.name} — ${CHARTERS[charter].name}`);
  return charter;
}

/**
 * Working capital: what has to stay aboard to keep trading. A treasury that
 * has swallowed the money the next run was going to buy cargo with is not a
 * treasury, it is a mistake — the first version of this banked everything
 * above six thousand and left her unable to afford a single route.
 */
export function workingCapital() {
  /* what she could actually buy with the purse she has, not with an imaginary
   * one — priced off an infinite purse this came out at half a million and she
   * never registered a charter in her life */
  const r = bestRoute({ credits: sim.ship.credits ?? 0 });
  const hold = Math.max(0, holdRoom(sim.ship)) * 90;
  const want = Math.max(hold, (r?.cost ?? 0) * 1.3);
  return Math.max(RUN.float, Math.min(RUN.float * 6, Math.round(want)));
}

/**
 * Keep the working capital aboard and the rest in the treasury; draw back when
 * the purse is too thin to trade with. The board's Solvency seat reads the
 * treasury and the Expansion seat reads the staff, so this is not bookkeeping
 * — it is what the board is scoring.
 */
export function considerTreasury() {
  if (!hasCompany()) return 0;
  const purse = sim.ship.credits;
  const need = workingCapital();
  if (purse > need * 1.8) {
    const move = Math.round((purse - need * 1.2) * 0.7);
    if (move > 800 && !transfer(move)) { biz.moved += move; note(`banked ${move.toLocaleString("en-US")} cr — ${need.toLocaleString("en-US")} cr stays aboard to trade with`); return move; }
  } else if (purse < need * 0.6 && company.treasury > 1000) {
    const draw = Math.min(company.treasury, need - purse);
    if (draw > 500 && !transfer(-draw)) { note(`drew ${Math.round(draw).toLocaleString("en-US")} cr back — the purse was too thin to buy a hold`); return -draw; }
  }
  return 0;
}

/**
 * Settle a hand ashore. They stop costing a wage and start paying one — a
 * share of their list wage into the treasury every cycle, for ever. The ones
 * worth settling are the unhappy, the unpostable and the surplus.
 */
export function considerSettle(st) {
  if (!hasCompany() || !st || sim.ship.dockedAt !== st.id) return null;
  if (st.hostile && !st.claimed) return null;
  if (sim.ship.credits < COMPANY.settleFee * 3) return null;
  if (crew.aboard.length <= 1) return null;
  const pick = crew.aboard
    .filter((m) => !m.robot && (m.cyclesAboard ?? 0) >= RUN.settleAfter)
    .map((m) => ({ m, worth: staffIncome(m), why: m.morale < RUN.settleMorale ? "unhappy aboard" : !hasPostFor(m) ? "no post on this hull" : crew.aboard.length > Math.min(RUN.maxCrew, crewCapacity()) ? "surplus to the watch bill" : null }))
    .filter((p) => p.why)
    .sort((a, b) => b.worth - a.worth)[0];
  if (!pick) return null;
  const why = settleAsStaff(pick.m, [], st);
  if (why) return null;
  const i = crew.aboard.indexOf(pick.m);
  if (i >= 0) crew.aboard.splice(i, 1);
  biz.settled++;
  note(`settled ${pick.m.name} at ${st.name} — ${pick.why}, ${pick.worth} cr/cycle to the books`);
  return pick.m;
}

/* ---- the whole business, once a port call ------------------------------------------- */

/**
 * Run the business side. Called while docked, on its own cadence — a port call
 * is when a hiring hall, a registrar and a housing office are all in reach,
 * and none of them are anywhere else.
 */
export function runBusiness(dept, earnPerMin = 0) {
  if (sim.time - biz.at < RUN.tickEvery) return null;
  biz.at = sim.time;
  const st = sim.ship.dockedAt ? stationById(sim.ship.dockedAt) : null;
  if (!st) return null;
  const did = [];
  if (considerLayoff(earnPerMin)) did.push("layoff");
  if (considerFound(st, dept)) did.push("charter");
  if (considerSettle(st)) did.push("settled");
  if (considerHire(st, dept, earnPerMin)) did.push("hired");
  const moved = considerTreasury();
  if (moved) did.push(moved > 0 ? "banked" : "drew");
  return did.length ? did : null;
}

/** Where the business stands, for a screen or a test. */
export function bizReport() {
  const b = hasCompany() ? boardBrief() : null;
  return {
    crew: crew.aboard.length,
    berths: Math.min(RUN.maxCrew, crewCapacity()),
    payroll: crewWageTotal(),
    payrollPerMin: payrollPerMin(),
    posted: crew.aboard.filter((m) => postKind(dutyOf(m))).length,
    morale: crew.aboard.length ? Math.round(crew.aboard.reduce((a, m) => a + (m.morale ?? 0), 0) / crew.aboard.length) : null,
    company: hasCompany() ? company.name : null,
    charter: hasCompany() ? CHARTERS[company.charter]?.name ?? company.charter : null,
    treasury: hasCompany() ? Math.round(company.treasury) : 0,
    staff: hasCompany() ? company.staff.length : 0,
    staffIncome: b ? Math.round(b.staffIncome) : 0,
    confidence: b ? Number(b.confidence.toFixed(2)) : null,
    board: b ? b.seats.map((s) => ({ role: s.role, verdict: s.verdict })) : [],
    hires: biz.hires, settled: biz.settled, banked: biz.moved,
  };
}

/** One line: "4 crew · 3 posted · 420 cr/cycle · Kestrel Holdings · 2 ashore · 18,400 cr". */
export function bizLine() {
  const r = bizReport();
  const bits = [`${r.crew}/${r.berths} crew`];
  if (r.posted) bits.push(`${r.posted} posted`);
  if (r.payroll) bits.push(`${r.payroll} cr/cycle`);
  if (r.morale != null) bits.push(`morale ${r.morale}`);
  if (r.company) bits.push(`${r.company} · ${r.staff} ashore · ${r.treasury.toLocaleString("en-US")} cr`);
  else bits.push("no charter");
  return bits.join(" · ");
}

export function resetBusiness() {
  biz.at = -1e9;
  biz.log = [];
  biz.hires = 0;
  biz.settled = 0;
  biz.founded = false;
  biz.moved = 0;
}

void wageFor; void currentPlan; void CATEGORIES; void logEvent;
