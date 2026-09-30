import { sim, sellPriceAt, buyPriceAt, losBlocker } from "../sim/sim.js";
import { stations } from "../station/stations.js";
import { holdRoom } from "../flight/ship.js";
import { goodName, bulkOf } from "./materials.js";
import { contracts } from "./contracts.js";

const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export const ROUTE = {
  dockS: 150,
  cruise: 25000,
  minProfit: 150,
  minUnits: 5,
};

export function legSeconds(d) {
  return d <= 1 ? 0 : ROUTE.dockS + d / ROUTE.cruise;
}

const honest = (st) => st && !(st.hostile && !st.claimed) && !(st.mount === "pirate" && !st.hangars?.length);

function consigned() {
  const out = {};
  for (const a of contracts.active) if (a.consigned && a.good) out[a.good] = (out[a.good] ?? 0) + a.consigned;
  return out;
}

export function tradeRoutes({ pos = sim.ship?.pos, room = holdRoom(sim.ship), credits = sim.ship?.credits ?? 0, n = 8, only = null } = {}) {
  const out = [];
  const ports = stations.filter(honest);
  const blocked = new Map();
  const lineBlocked = (A, B) => { const k = `${A.id}>${B.id}`; if (!blocked.has(k)) blocked.set(k, Boolean(losBlocker(A, B, null))); return blocked.get(k); };
  for (const A of ports) {
    if (only?.from && A.id !== only.from) continue;
    const toA = pos ? d3(pos, A) : 0;
    if (pos && toA > 3000 && losBlocker(pos, A, null)) continue;
    for (const line of A.stock ?? []) {
      if (!(line.qty >= ROUTE.minUnits)) continue;
      const unit = buyPriceAt(A, line);
      const can = Math.min(Math.floor(line.qty), Math.floor(room / bulkOf(line.id)), Math.floor(credits / Math.max(1, unit)));
      if (can < ROUTE.minUnits) continue;
      const afford = Math.min(can, Math.floor(credits / Math.max(1, buyPriceAt(A, line, can))));
      if (afford < ROUTE.minUnits) continue;
      for (const B of ports) {
        if (B === A) continue;
        if (sellPriceAt(B, line.id) <= unit) continue;
        if (lineBlocked(A, B)) continue;
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

export function bestRoute(opts = {}) {
  return tradeRoutes({ ...opts, n: 1 })[0] ?? null;
}

export function sellable(ship = sim.ship) {
  const held = consigned();
  const out = {};
  for (const [id, q] of Object.entries(ship.hold ?? {})) {
    const free = q - (held[id] ?? 0);
    if (free > 1e-6) out[id] = free;
  }
  return out;
}

export function routeLine(r) {
  return `${r.name} · ${r.from.name} → ${r.to.name} · ${r.qty} × +${Math.round(r.margin)} = ${Math.round(r.profit).toLocaleString("en-US")} cr · ~${Math.max(1, Math.round(r.secs / 60))} min`;
}
