import { sim, sellPriceAt } from "../sim/sim.js";
import { stationById } from "../station/stations.js";
import { stockOf, stockMultAt, targetFor, LINES, GLUT_FRAC, SHORT_FRAC } from "../economy/economy.js";
import { goodName, baseValue } from "../economy/materials.js";
import { corpOfStation } from "../corp/corps.js";
import { sellable } from "../economy/traderoutes.js";
import { ariaMind, verbOf } from "./mind.js";
import { counterfactual, sellValue } from "./foresee.js";
import { footprint, noteTrade, noteWork, audit, footprintIn, footprintOut, resetFootprint } from "./footprint.js";
import { anchor } from "./belief.js";

export const WAKE = { auditEvery: 20 };

const armed = new Map();
let auditAt = -1e9;

export function wakeArm(name, fn) { armed.set(name, fn); }
export function ariaFlying() {
  for (const fn of armed.values()) { try { if (fn()) return true; } catch {} }
  return false;
}

export function sellValueAt(st, ship = sim.ship) {
  if (!ariaFlying()) return null;
  return sellValue(st, sellable(ship), { price: sellPriceAt, steward: ariaMind.orders.steward ?? 0 }).value;
}

const feeds = (st, id) => (LINES[st.sector] ?? []).some((L) => L.in[id]);
const stalledOn = (st, id) => Boolean(st.econ?.lines?.some((l) => !l.running && l.stalledOn === id));

export function wakeOpen(st) {
  if (!st) return null;
  const co = corpOfStation(st);
  const stock = {};
  for (const l of st.stock ?? []) stock[l.id] = l.qty;
  const need = {};
  for (const id of Object.keys(sim.ship.hold ?? {})) need[id] = stalledOn(st, id);
  return { st, at: sim.time, hold: { ...(sim.ship.hold ?? {}) }, credits: sim.ship.credits ?? 0, stock, need, standing: co ? { id: co.id, name: co.name, before: co.standing } : null };
}

export function wakeClose(w, kind) {
  if (!w) return null;
  const st = w.st, ship = sim.ship;
  const lots = [];
  const mine = {};
  let weight = 0;
  for (const id of new Set([...Object.keys(w.hold), ...Object.keys(ship.hold ?? {})])) {
    const d = (ship.hold?.[id] ?? 0) - (w.hold[id] ?? 0);
    const qty = kind === "sell" ? -d : d;
    if (!(qty > 0.01)) continue;
    const q0 = w.stock[id] ?? 0, q1 = stockOf(st, id), T = Math.max(1, targetFor(st, id));
    const m0 = stockMultAt(st, id, q0), m1 = stockMultAt(st, id, q1);
    const wgt = qty * Math.max(1, baseValue(id)) * (m0 + m1) / 2;
    weight += wgt;
    mine[id] = qty;
    lots.push({
      id, name: goodName(id), qty, cr: 0, wgt, m0, m1,
      glut: kind === "sell" && q1 > T * GLUT_FRAC && q0 <= T * GLUT_FRAC,
      need: kind === "sell" && (q0 < T * SHORT_FRAC || Boolean(w.need[id])),
      starved: kind === "buy" && feeds(st, id) && q1 < T * SHORT_FRAC && q0 >= T * SHORT_FRAC,
    });
  }
  if (!lots.length) return null;
  const moved = Math.abs((ship.credits ?? 0) - w.credits);
  let slipLost = 0;
  for (const l of lots) {
    l.cr = weight > 0 ? moved * (l.wgt / weight) : 0;
    const avg = (l.m0 + l.m1) / 2;
    slipLost += kind === "sell" ? l.cr * Math.max(0, l.m0 / avg - 1) : l.cr * Math.max(0, 1 - l.m0 / avg);
    delete l.wgt;
    anchor(`px:${st.id}:${l.id}`, sellPriceAt(st, l.id), sim.time);
  }
  let forecast = null;
  if (lots.some((l) => feeds(st, l.id))) {
    try {
      const cf = counterfactual(st, kind === "sell" ? { lift: mine } : { deliver: mine });
      forecast = { restarted: cf.stalled, stalled: cf.restarted };
    } catch { forecast = null; }
  }
  const co = w.standing ? corpOfStation(st) : null;
  return noteTrade({
    at: sim.time, port: { id: st.id, name: st.name }, kind, lots, slipLost,
    standing: w.standing && co ? { ...w.standing, after: co.standing } : null,
    forecast,
  });
}

export function wakeJobOpen() {
  return { at: sim.time, sold: footprint.totals.sold };
}
export function wakeJobClose(open, key, ok, cr) {
  const verb = verbOf(key);
  if (!verb) return;
  const took = open && (verb === "mine" || verb === "salvage") ? Math.max(0, footprint.totals.sold - open.sold) : 0;
  noteWork({ at: sim.time, verb, ok, secs: open ? sim.time - open.at : 0, cr, took, what: verb === "salvage" ? "units of plate and parts" : "units of ore" });
}

export function wakeAudit() {
  if (sim.time - auditAt < WAKE.auditEvery && sim.time >= auditAt) return 0;
  auditAt = sim.time;
  if (!footprint.pending.length) return 0;
  return audit(sim.time, (portId, lineId) => {
    const l = stationById(portId)?.econ?.lines?.find((x) => x.id === lineId);
    return l ? Boolean(l.running) : null;
  });
}

export function wakeSave() { ariaMind.wake = footprintOut(); }
export function wakeLoad() { return footprintIn(ariaMind.wake); }
export function wakeReset() { resetFootprint(); auditAt = -1e9; ariaMind.wake = null; }
