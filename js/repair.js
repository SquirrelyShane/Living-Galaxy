/* LIVING GALAXY — putting the hull back.
 *
 * Before 0.3.02 the only things that ever raised `ship.hull` were a nanofoam
 * refit (two points a cycle), an engineer on duty, and a rented company repair
 * drone that needed a charter and an industrial yard. A hull that took a
 * beating in the belt stayed beaten. Two ways now, both honest about cost:
 *
 *   YARD      docked at a port whose sector lists the `repair` service
 *             (materials.js SECTORS — logistic, military, industrial,
 *             civilian and free ports; agricultural docks do not), the yard
 *             sells hull by the point. The price leans on the port's sector
 *             and on your standing with whoever runs it; you can buy a patch
 *             or the lot, and it never charges for more than you can pay.
 *
 *   PATCH     the Hull-patch drone refit (upgrades.js `repair_drone`, fx
 *   DRONE     `patchDrone` = hull points a second). A drone that lives in a
 *             bay on your own hull: once nothing has hit you for a few seconds
 *             it goes out and welds, drawing on the OPS bus while it works —
 *             so it shows on the ledger, sheds in a brownout, and stops the
 *             moment you are under fire again. No charter, no home port.
 *
 * `patchDrone` (the object) is what the renderer draws: out, and welding.
 */

import { sim, logEvent } from "./sim.js";
import { SECTORS } from "./materials.js";
import { corpOfStation } from "./corps.js";
import { fx } from "./upgrades.js";
import { stationById } from "./stations.js";

export const REPAIR = {
  perPoint: 26,          // cr a hull point at a neutral port
  sector: { industrial: 0.8, military: 0.95, logistic: 1, civilian: 1.15, pirate: 1.4 },
  droneKw: 14,           // on the ops bus while the drone welds
  droneQuiet: 6,         // seconds since the last hit before it launches
  droneRange: 9,         // metres off the hull it works at (the renderer's orbit)
};

export const patchDrone = { out: false, welding: false, since: 0, patched: 0 };

export const hullMaxOf = (ship) => ship?.hullMax ?? 100;

/** Does this port fix hulls? */
export function repairsAt(st) {
  if (!st) return false;
  if (st.hostile && !st.claimed) return false;
  return (SECTORS[st.sector]?.services ?? []).includes("repair");
}

/** cr a point here, after the sector and your standing with the port's operator. */
export function pricePerPoint(st) {
  const k = REPAIR.sector[st?.sector] ?? 1;
  const standing = corpOfStation(st)?.standing ?? 0;   // −100 … 100
  const lean = 1 - Math.max(-1, Math.min(1, standing / 100)) * 0.3;
  return Math.max(4, Math.round(REPAIR.perPoint * k * lean));
}

/**
 * What a repair here would cost. `points` defaults to the whole shortfall.
 * → { ok, why, need, points, per, total, affordable }
 */
export function repairQuote(st, ship = sim.ship, points = null) {
  const need = Math.max(0, Math.ceil(hullMaxOf(ship) - (ship?.hull ?? 0)));
  if (!st) return { ok: false, why: "Not docked", need, points: 0, per: 0, total: 0, affordable: 0 };
  if (!repairsAt(st)) return { ok: false, why: `${st.name} has no repair yard`, need, points: 0, per: 0, total: 0, affordable: 0 };
  if (need <= 0) return { ok: false, why: "Hull is whole", need, points: 0, per: pricePerPoint(st), total: 0, affordable: 0 };
  const per = pricePerPoint(st);
  const want = Math.min(need, points == null ? need : Math.max(1, Math.ceil(points)));
  const affordable = Math.min(want, Math.floor((ship.credits ?? 0) / per));
  return { ok: affordable > 0, why: affordable > 0 ? "" : `Repairs are ${per} cr a point`, need, points: want, per, total: want * per, affordable };
}

/** Buy hull at the yard you are docked at. → { ok, points, cost, why } */
export function yardRepair(points = null, ship = sim.ship) {
  const st = stationById(ship.dockedAt);
  if (!ship.dockedAt) return { ok: false, points: 0, cost: 0, why: "Dock first" };
  const q = repairQuote(st, ship, points);
  if (!q.ok) return { ok: false, points: 0, cost: 0, why: q.why };
  const got = q.affordable;
  const cost = got * q.per;
  ship.credits -= cost;
  ship.hull = Math.min(hullMaxOf(ship), ship.hull + got);
  const whole = ship.hull >= hullMaxOf(ship) - 0.01;
  logEvent(`${st.name} yard: ${got} hull point${got === 1 ? "" : "s"} for ${cost.toLocaleString()} cr${whole ? " — hull whole" : ""}`, "trade");
  return { ok: true, points: got, cost, why: whole ? "" : got < q.points ? "ran out of credits" : "" };
}

/* ---- the patch drone ---------------------------------------------------- */

/** Hull points a second the fitted drone welds, 0 when none is fitted. */
export const droneRate = () => fx("patchDrone", 0);

/**
 * Called from the sim tick. Decides whether the drone is out, and bills the bus
 * through `ship.patchDraw` (read by buildDemand next tick, on the ops board).
 */
export function tickPatchDrone(dt, ship = sim.ship) {
  const rate = droneRate();
  const wasOut = patchDrone.out;
  ship.patchDraw = 0;
  patchDrone.welding = false;
  const hurt = ship.hull < hullMaxOf(ship) - 0.01;
  const quiet = (sim.time ?? 0) - (ship.lastHitAt ?? -999) >= REPAIR.droneQuiet;
  const can = rate > 0 && hurt && quiet && !ship.dockedAt && sim.warp?.state !== "run" && sim.phase === "play";
  patchDrone.out = can;
  if (!can) {
    if (wasOut && rate > 0 && !hurt) logEvent(`Patch drone recovered — ${Math.round(patchDrone.patched)} hull welded`, "system");
    if (!can && wasOut) patchDrone.patched = 0;
    return 0;
  }
  if (!wasOut) { patchDrone.since = sim.time; sim.notice = "Patch drone out — welding the hull."; }
  ship.patchDraw = REPAIR.droneKw;
  /* the ops board carries it: shed in a brownout, the drone holds station and waits */
  if (ship.powered?.ops === false) return 0;
  const got = Math.min(rate * dt, hullMaxOf(ship) - ship.hull);
  ship.hull += got;
  patchDrone.patched += got;
  patchDrone.welding = got > 0;
  return got;
}

export function resetRepair() {
  patchDrone.out = false;
  patchDrone.welding = false;
  patchDrone.patched = 0;
}
