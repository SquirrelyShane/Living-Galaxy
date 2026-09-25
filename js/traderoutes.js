/* LIVING GALAXY — trade routes: where the money is in moving goods.
 *
 * 0.3.19. The trader's instrument. For a hull with a hold and a purse, every
 * way to make money by buying at one honest port and selling at another: the
 * good, how many (what the source has, what the hold takes, what you can pay
 * for, what the buyer can pay out), the per-unit margin at the prices the
 * game actually transacts at (sim.js buyPriceAt / sellPriceAt — the whole lot
 * moves at one price per trade, so the estimate is the transaction), the
 * profit, and the time it costs to fly it from where you are — skipping legs
 * with a world across the line right now, which the autopilot would refuse.
 * Ranked by credits per minute, not by the fattest margin, because a margin
 * two systems away is not worth what it looks like.
 *
 * TRADE RUN (mission/run.js) flies the top route; MARKET › ROUTES lists them
 * with FLY IT.
 */

import { sim, sellPriceAt, buyPriceAt, losBlocker } from "./sim.js";
import { stations } from "./stations.js";
import { holdRoom } from "./ship.js";
import { goodName, bulkOf } from "./materials.js";
import { contracts } from "./contracts.js";

const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export const ROUTE = {
  dockS: 150,          // clamps, lanes and the push out: a port call, in seconds
  cruise: 25000,       // u/s — a rough crossing speed with the drive lit
  minProfit: 150,      // cr — below this a run is not worth the fuel
  minUnits: 5,
};

/** Seconds to fly a distance and make a port call, roughly — for ranking, not for a timetable. */
export function legSeconds(d) {
  return d <= 1 ? 0 : ROUTE.dockS + d / ROUTE.cruise;
}

const honest = (st) => st && !(st.hostile && !st.claimed) && !(st.mount === "pirate" && !st.hangars?.length);

/* goods an accepted haul contract has consigned to the hold: not ours to sell */
function consigned() {
  const out = {};
  for (const a of contracts.active) if (a.consigned && a.good) out[a.good] = (out[a.good] ?? 0) + a.consigned;
  return out;
}

/**
 * Every profitable route, best first:
 *   [{ from, to, good, name, qty, buy, sell, margin, profit, cost, secs, perMin }]
 * `pos` is where the hull is now (the run to the source is part of the cost);
 * `room` and `credits` default to the ship's own.
 */
export function tradeRoutes({ pos = sim.ship?.pos, room = holdRoom(sim.ship), credits = sim.ship?.credits ?? 0, n = 8, only = null } = {}) {
  const out = [];
  const ports = stations.filter(honest);
  const blocked = new Map();
  const lineBlocked = (A, B) => { const k = `${A.id}>${B.id}`; if (!blocked.has(k)) blocked.set(k, Boolean(losBlocker(A, B, null))); return blocked.get(k); };
  for (const A of ports) {
    if (only?.from && A.id !== only.from) continue;
    const toA = pos ? d3(pos, A) : 0;
    /* a source you cannot see from here (a world across the line) is not a run the autopilot can start */
    if (pos && toA > 3000 && losBlocker(pos, A, null)) continue;
    for (const line of A.stock ?? []) {
      if (!(line.qty >= ROUTE.minUnits)) continue;
      /* 0.3.24: a lot is priced as a lot at both ends (economy.js lotMult), so
       * the estimate IS the transaction. Sizing and pricing are circular — the
       * bigger the lot the worse both prices get — so size it on the marginal
       * price first, then re-price that size, then trim it to what the buyer
       * can actually pay for at the price that size costs. */
      const unit = buyPriceAt(A, line);
      const can = Math.min(Math.floor(line.qty), Math.floor(room / bulkOf(line.id)), Math.floor(credits / Math.max(1, unit)));   // room is hold units (0.3.52)
      if (can < ROUTE.minUnits) continue;
      const afford = Math.min(can, Math.floor(credits / Math.max(1, buyPriceAt(A, line, can))));
      if (afford < ROUTE.minUnits) continue;
      for (const B of ports) {
        if (B === A) continue;
        if (sellPriceAt(B, line.id) <= unit) continue;                    // not even the first unit clears
        if (lineBlocked(A, B)) continue;
        /* Size it, then price BOTH ends at that size, then check it still
         * clears — a lot is bought as a lot too, so the quote has to be for
         * exactly the number of units the run will actually move. */
        let qty = Math.min(afford, Math.floor((B.credits ?? Infinity) / Math.max(1, sellPriceAt(B, line.id, afford))));
        let buy = buyPriceAt(A, line, qty);
        let sell = sellPriceAt(B, line.id, qty);
        for (let k = 0; k < 5 && qty >= ROUTE.minUnits && (sell <= buy || qty * buy > credits); k++) {
          qty = Math.floor(qty * 0.6);
          buy = buyPriceAt(A, line, qty);
          sell = sellPriceAt(B, line.id, qty);
        }
        if (qty < ROUTE.minUnits || sell <= buy || qty * buy > credits) continue;
        const margin = sell - buy;
        const profit = margin * qty;
        if (profit < ROUTE.minProfit) continue;
        const secs = legSeconds(toA) + legSeconds(d3(A, B));
        out.push({ from: A, to: B, good: line.id, name: goodName(line.id), qty, buy, sell, margin, profit, cost: buy * qty, secs, perMin: profit / Math.max(1, secs / 60) });
      }
    }
  }
  out.sort((a, b) => b.perMin - a.perMin);
  return n ? out.slice(0, n) : out;
}

/** The single best run from here, or null. */
export function bestRoute(opts = {}) {
  return tradeRoutes({ ...opts, n: 1 })[0] ?? null;
}

/** What in the hold can be sold without selling somebody else's consignment. */
export function sellable(ship = sim.ship) {
  const held = consigned();
  const out = {};
  for (const [id, q] of Object.entries(ship.hold ?? {})) {
    const free = q - (held[id] ?? 0);
    if (free > 1e-6) out[id] = free;
  }
  return out;
}

/** One line for a route: "Steel · Smelt Station → Haven Hold · 120 × +14 = 1,680 cr · ~6 min". */
export function routeLine(r) {
  return `${r.name} · ${r.from.name} → ${r.to.name} · ${r.qty} × +${Math.round(r.margin)} = ${Math.round(r.profit).toLocaleString("en-US")} cr · ~${Math.max(1, Math.round(r.secs / 60))} min`;
}
