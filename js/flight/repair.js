import { sim, logEvent } from "../sim/sim.js";
import { SECTORS } from "../economy/materials.js";
import { corpOfStation } from "../corp/corps.js";
import { fx } from "../economy/upgrades.js";
import { stationById } from "../station/stations.js";

export const REPAIR = {
  perPoint: 26,
  sector: { industrial: 0.8, military: 0.95, logistic: 1, civilian: 1.15, pirate: 1.4 },
  droneKw: 14,
  droneQuiet: 6,
  droneRange: 9,
};

export const patchDrone = { out: false, welding: false, since: 0, patched: 0 };

export const hullMaxOf = (ship) => ship?.hullMax ?? 100;

export function repairsAt(st) {
  if (!st) return false;
  if (st.hostile && !st.claimed) return false;
  return (SECTORS[st.sector]?.services ?? []).includes("repair");
}

export function pricePerPoint(st) {
  const k = REPAIR.sector[st?.sector] ?? 1;
  const standing = corpOfStation(st)?.standing ?? 0;
  const lean = 1 - Math.max(-1, Math.min(1, standing / 100)) * 0.3;
  return Math.max(4, Math.round(REPAIR.perPoint * k * lean));
}

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

export const droneRate = () => fx("patchDrone", 0);

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
