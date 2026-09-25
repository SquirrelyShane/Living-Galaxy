/* LIVING GALAXY — the company's hulls.
 *
 * Ported in shape from Living Galaxy's systems/company/fleet.js + fleet-work.js
 * and cut to what Astra already has: a company hull is a real hull on the
 * board (npc/traffic.js spawnVessel), flying the same timetable a captain
 * does, with a settled member of staff in the chair. Two orders:
 *
 *   extract — a miner: belt claims and home, ore delivered to the port floor;
 *             the company books the port's bid for it (less the crew's share)
 *   haul    — a hauler: stock between ports; the company books a freight
 *             rate per unit delivered
 *
 * Every cycle the hull costs upkeep (a fraction of its yard price) and the
 * captain's wage. A hull that does not earn its keep is a decision the
 * Solvency seat will raise. Commissioning takes credits from the treasury
 * (the yard's raw-stock bill, shipcost.js) and a captain from the staff at
 * that port.
 */

import { logEvent, sim } from "./sim.js";
import { stationById } from "./stations.js";
import { traffic, trafficHooks, spawnVessel, removeVessel } from "./npc/traffic.js";
import { bidPrice } from "./economy.js";
import { company, hasCompany, staffAt, saveCompany } from "./company.js";
import { shipById, SHIP_DB, hullTuneFor } from "./shipdb.js";
import { yardQuote } from "./shipcost.js";
import { CYCLE_SECONDS } from "./crew.js";
import { cradle } from "./npc/cradle.js";
import { corpOfStation } from "./corps.js";

export const FLEET = {
  upkeep: 0.004,       // of yard price, per cycle
  crewShare: 0.25,     // of a delivery's value the captain and hands keep — that IS their wage
  haulRate: 0.35,      // of the bid per unit hauled, booked to the company
  max: 6,
};

/** What a company hull brings home a run. 0.3.52 made the PILOT's hold a
 * volume with no ceiling (a D-frame now holds ~22,000 hu); a company hull's
 * earnings are balanced on its run timetable, not its bay, so it keeps the
 * old curve — 400 × sqrt(rating / 30), clamped 0.5–4 — or one D-frame on the
 * books would out-earn a career. */
export function fleetHold(shipId) {
  const c = shipById(shipId)?.stats?.cargo;
  if (!c) return 400;
  return Math.round(400 * Math.max(0.5, Math.min(4, Math.sqrt(c / 30))));
}

export const fleet = { hulls: [], payPool: 0, seq: 1 };

/* the hulls are the company's, not the sky's: paid from the persisted treasury, so they persist beside it */
const FLEET_KEY = "lgaa-fleet";
let parked = [];   // hulls filed under other skies (or a port this sky no longer has); they come back when theirs loads
function saveFleet() {
  try { localStorage.setItem(FLEET_KEY, JSON.stringify({ hulls: [...parked, ...fleet.hulls], seq: fleet.seq })); } catch { /* quota, or no window */ }
  saveCompany();
}

/** Put a hull on the board at its home port, the captain in the chair. */
function spawnHull(h, st, captain) {
  return spawnVessel({
    id: h.id, seed: h.sky ?? sim.skySeed ?? "sky", role: h.order === "haul" ? "hauler" : "miner", ship: h.shipId, name: h.name,
    captain: h.captainName, recId: h.captainId, corpId: corpOfStation(st)?.id ?? null, from: st.id,
    company: true, color: "#9fe8b0", traits: captain?.traits, title: captain?.title, complexId: captain?.complexId, now: sim.time,
  });
}

/** Hulls the yard will commission for a company order: miners for extract, haulers for haul. */
export function commissionOptions(order = "extract") {
  const want = order === "extract" ? "mining" : "logistics";
  return SHIP_DB.filter((d) => d.complex === want && (d.tier === "A" || d.tier === "B" || d.tier === "C"))
    .map((d) => ({ id: d.id, name: d.name, tier: d.tier, price: yardPrice(d.id), cargo: fleetHold(d.id) }));
}

export function yardPrice(shipId) {
  try { return Math.round(yardQuote(shipById(shipId))?.total ?? shipById(shipId)?.stats?.price ?? 20000); } catch { return 20000; }
}

/** Why a commission fails, or null. */
export function commissionBlocker(shipId, staffId, st = stationById(sim.ship.dockedAt)) {
  if (!hasCompany()) return "No company";
  if (!st) return "Dock at a port";
  if (!(st.sector === "industrial" || st.sector === "military")) return "Only an industrial or military yard builds";
  if (fleet.hulls.length >= FLEET.max) return `The company holds ${FLEET.max} hulls already`;
  const def = shipById(shipId);
  if (!def) return "No such hull";
  const captain = staffAt(st.id).find((s) => s.id === staffId);
  if (!captain) return "Needs a member of staff at this port for the chair";
  const price = yardPrice(shipId);
  if (company.treasury < price) return `The yard wants ${price} cr from the treasury (${Math.round(company.treasury)} there)`;
  return null;
}

/** Buy a hull from the treasury and put a settled hand in the chair. */
export function commissionHull(shipId, staffId, order = "extract", st = stationById(sim.ship.dockedAt)) {
  const why = commissionBlocker(shipId, staffId, st);
  if (why) return why;
  const def = shipById(shipId);
  const price = yardPrice(shipId);
  company.treasury -= price;
  const captain = staffAt(st.id).find((s) => s.id === staffId);
  captain.role = "captain";
  const id = `co:${company.name.replace(/\W+/g, "").toLowerCase()}:${fleet.seq++}`;
  const name = `${def.name} ${company.name.split(" ")[0].toUpperCase()} ${fleet.seq - 1}`;
  const h = { id, name, shipId, hullName: def.name, order, captainId: captain.id, captainName: captain.name, captainPronouns: captain.pronouns ?? null, home: st.id, sky: sim.skySeed ?? "sky", price, earned: 0, spent: price, runs: 0, since: sim.time };
  spawnHull(h, st, captain);
  fleet.hulls.push(h);
  company.book?.unshift?.({ at: sim.time, text: `${name} commissioned at ${st.name} — ${captain.name} in the chair`, delta: -price, kind: "fleet" });
  company.spend += price;
  const rec = cradle.get(captain.id);
  if (rec) { rec.status = "captain"; rec.employer = company.name; cradle.note(rec.id, `Given ${name} by ${company.name}`); }
  logEvent(`${name} commissioned — ${captain.name} commanding, ${order} order out of ${st.name}`, "company");
  sim.notice = `${name} is yours. ${captain.name} has the chair; it works out of ${st.name}.`;
  saveFleet();
  return null;
}

/** Sell a hull back to the yard at half and return the captain to staff. */
export function decommissionHull(id) {
  const i = fleet.hulls.findIndex((h) => h.id === id);
  if (i < 0) return "No such hull";
  const h = fleet.hulls.splice(i, 1)[0];
  removeVessel(h.id);
  const back = Math.round(h.price * 0.5);
  company.treasury += back;
  company.book?.unshift?.({ at: sim.time, text: `${h.name} sold back to the yard`, delta: back, kind: "fleet" });
  const cap = company.staff.find((s) => s.id === h.captainId);
  if (cap) cap.role = "staff";
  logEvent(`${h.name} decommissioned — ${back} cr to the treasury`, "company");
  saveFleet();
  return null;
}

/** What each hull has earned against what it costs. */
export function fleetReport() {
  return fleet.hulls.map((h) => {
    const v = traffic.find((n) => n.id === h.id);
    return { ...h, job: v?.job ?? "—", toName: v?.toName ?? "", net: Math.round(h.earned - h.spent), cyclesOut: Math.floor((sim.time - h.since) / CYCLE_SECONDS) };
  });
}

/* ---- the money ---------------------------------------------------------------- */

const prevCargoHook = trafficHooks.onCargo;
trafficHooks.onCargo = (n, st, what, id, q) => {
  prevCargoHook?.(n, st, what, id, q);
  if (!n.company || what !== "deliver" || !(q > 0)) return;
  const h = fleet.hulls.find((x) => x.id === n.id);
  if (!h) return;
  /* the timetable's cargo number is a token; the hull brings a real hold home */
  const units = Math.max(q, fleetHold(h.shipId));
  const value = h.order === "haul" ? units * bidPrice(st, id) * FLEET.haulRate : units * bidPrice(st, id) * (1 - FLEET.crewShare);
  /* 0.3.52: a port pays a company hull out of its own treasury, as it pays you */
  const got = Math.max(0, Math.min(Math.round(value), Math.round(st.credits ?? Infinity)));
  if (Number.isFinite(st.credits)) st.credits -= got;
  company.treasury += got;
  h.earned += got;
  h.runs++;
  company.revenue += got;
  company.book?.unshift?.({ at: sim.time, text: `${h.name} delivered ${Math.round(q)} ${id.replace(/_/g, " ")} at ${st.name}`, delta: got, kind: "fleet" });
  if (company.book && company.book.length > 60) company.book.length = 60;
  saveFleet();
};

export function tickFleet(seconds) {
  if (!fleet.hulls.length) return;
  fleet.payPool += seconds;
  while (fleet.payPool >= CYCLE_SECONDS) {
    fleet.payPool -= CYCLE_SECONDS;
    let cost = 0;
    for (const h of fleet.hulls) {
      const c = Math.round(h.price * FLEET.upkeep); // the captain is paid out of the crew share
      cost += c;
      h.spent += c;
    }
    company.treasury -= cost;
    company.spend += cost;
    company.book?.unshift?.({ at: sim.time, text: `Fleet upkeep (${fleet.hulls.length} hull${fleet.hulls.length === 1 ? "" : "s"})`, delta: -cost, kind: "fleet" });
    if (company.book && company.book.length > 60) company.book.length = 60;
    if (company.treasury < 0) {
      /* the yard repossesses the newest hull */
      const h = fleet.hulls[fleet.hulls.length - 1];
      logEvent(`Treasury overdrawn — the yard has taken ${h.name} back`, "company");
      sim.notice = `Treasury overdrawn. The yard repossessed ${h.name}.`;
      decommissionHull(h.id);
    }
    saveFleet();
  }
}

/** A new sky: clear the board, then put the company's persisted hulls back on it (this sky's) or keep them parked (the rest). */
export function resetFleet() {
  for (const h of fleet.hulls) removeVessel(h.id);
  fleet.hulls.length = 0;
  fleet.payPool = 0;
  parked = [];
  let stored = null;
  try { const raw = typeof localStorage !== "undefined" ? localStorage.getItem(FLEET_KEY) : null; if (raw) stored = JSON.parse(raw); } catch { /* corrupt or absent */ }
  if (!stored || !Array.isArray(stored.hulls) || !hasCompany()) return; // no company: the hulls went with it
  fleet.seq = Math.max(fleet.seq, stored.seq | 0);
  const sky = sim.skySeed ?? "sky";
  for (const h of stored.hulls) {
    if (!h?.id || !h.shipId || fleet.hulls.some((x) => x.id === h.id)) continue;
    const st = h.sky === sky ? stationById(h.home) : null;
    if (!st) { parked.push(h); continue; }
    spawnHull(h, st, company.staff.find((s) => s.id === h.captainId));
    fleet.hulls.push(h);
  }
}

export function wireFleet() {
  if (globalThis.window?.__lg) window.__lg.fleet = { fleet, commissionOptions, commissionHull, commissionBlocker, decommissionHull, fleetReport, tickFleet, yardPrice, FLEET };
}
