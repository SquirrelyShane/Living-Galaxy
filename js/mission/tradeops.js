import { authorize, spendCap } from "../aria/mind.js";
import { sim, sellAllOre, tradeBuy, tradeSell, logEvent, buyPriceAt } from "../sim/sim.js";
import { holdRoom, roomFor } from "../flight/ship.js";
import { stationById } from "../station/stations.js";
import { bestRoute, sellable, routeLine } from "../economy/traderoutes.js";
import { deliverContracts, deliverableAt, jobForSite } from "../economy/contracts.js";

export function makeTradeOps({ mission, note, ap }) {
  function pickRoute(peek = false) {
    if (mission.trade && !peek) return mission.trade;
    const r = bestRoute({ room: holdRoom(sim.ship) });
    if (!r) return null;
    const t = { fromId: r.from.id, toId: r.to.id, from: r.from.name, to: r.to.name, good: r.good, name: r.name, qty: r.qty, buy: r.buy, sell: r.sell, profit: r.profit, line: routeLine(r), bought: 0, spent: 0 };
    if (!peek) {
      mission.trade = t;
      logEvent(`${mission.active?.name ?? "Trade run"}: route — ${t.line}`, "trade");
      note(`Route: ${t.line}`);
    }
    return t;
  }

  const T = {
    pickRoute,
    SELL(s) {
      const ship = sim.ship;
      const st = stationById(ship.dockedAt);
      if (!st) return "fail:not docked";
      ap().phase = "trade"; ap().task = `sell · ${st.name}`;
      const what = s.args?.what ?? "ore";
      const before = ship.credits;
      let refused = null;
      if (what === "ore") sellAllOre();
      else if (what === "all") { const keep = s.args?.keep ?? null; for (const [k, q] of Object.entries(sellable(ship))) if (k !== keep) refused = tradeSell(k, q) ?? refused; }
      else if (what === "route") {
        const t = mission.trade;
        if (!t) return "fail:no route cargo to sell";
        const q = Math.min(ship.hold[t.good] ?? 0, sellable(ship)[t.good] ?? 0);
        if (q > 0) refused = tradeSell(t.good, q);
      } else if (ship.hold[what] > 0) refused = tradeSell(what, sellable(ship)[what] ?? 0);
      const got = ship.credits - before;
      if (what === "route" && mission.trade) {
        const t = mission.trade;
        const net = got - t.spent;
        mission.run.why = `sold ${t.name.toLowerCase()} for ${Math.round(got).toLocaleString()} cr at ${st.name} — ${net >= 0 ? "+" : ""}${Math.round(net).toLocaleString()} cr on the round`;
        logEvent(`${mission.active.name}: ${mission.run.why}`, "trade");
        mission.stats.earned += got;
        mission.stats.profit = (mission.stats.profit ?? 0) + net;
        ap().earned = mission.stats.earned;
        if (refused && (ship.hold[t.good] ?? 0) > 0) note(`${st.name}: ${refused.toLowerCase()} — ${Math.round(ship.hold[t.good])} ${t.name.toLowerCase()} still aboard.`);
        mission.trade = null;
        return "done";
      }
      mission.stats.earned += got;
      ap().earned = mission.stats.earned;
      mission.run.why = `sold for ${Math.round(got)} cr at ${st.name}`;
      logEvent(`${mission.active.name}: sold for ${Math.round(got)} cr at ${st.name}`, "trade");
      return "done";
    },
    DELIVER(s) {
      const ship = sim.ship;
      const st = stationById(ship.dockedAt);
      if (!st) return "fail:not docked";
      ap().phase = "trade"; ap().task = `deliver · ${st.name}`;
      const due = deliverableAt(st.id).length;
      const paid = due ? deliverContracts(st.id) : 0;
      const site = s.args?.site ?? null;
      if (paid > 0) {
        mission.stats.earned += paid;
        ap().earned = mission.stats.earned;
        mission.run.why = `delivered at ${st.name} — ${Math.round(paid).toLocaleString()} cr`;
        logEvent(`${mission.active.name}: ${mission.run.why}`, "trade");
      }
      if (site && !jobForSite(site)) {
        if (mission.active) mission.active.loop = { mode: "none" };
        if (!paid) mission.run.why = "the job is closed";
        return "done";
      }
      if (site) {
        const a = jobForSite(site);
        mission.run.why = `${st.name} wants ${a.qty} ${a.good.replace(/_/g, " ")} — ${Math.round(ship.hold[a.good] ?? 0)} aboard, back to the seam`;
        note(mission.run.why);
      }
      return "done";
    },
    BUY(s) {
      const ship = sim.ship;
      const st = stationById(ship.dockedAt);
      if (!st) return "fail:not docked";
      ap().phase = "trade"; ap().task = `buy · ${st.name}`;
      let good = s.args?.good ?? null;
      let qty = Math.min(s.args?.qty ?? 20, holdRoom(ship));
      if (good === "route") {
        const t = mission.trade;
        if (!t) return "fail:no route on the books";
        if (t.fromId !== st.id) return `fail:the route buys at ${t.from}, not ${st.name}`;
        good = t.good;
        qty = Math.min(t.qty, Math.floor(roomFor(ship, good)));
      } else if (!good) {
        const r = bestRoute({ only: { from: st.id }, pos: st, room: holdRoom(ship) });
        if (!r) return "fail:nothing on this shelf sells for more anywhere else";
        good = r.good;
        qty = Math.min(qty, r.qty);
      }
      if (good && good !== "route") qty = Math.min(qty, Math.floor(roomFor(ship, good)));
      if (qty <= 0) return "fail:hold full";
      const c0 = ship.credits, h0 = ship.hold[good] ?? 0;
      if (mission.active?.mode === "aria" || mission.active?.aria) {
        const cap = spendCap(ship.credits, "trading");
        const unit = buyPriceAt(st, { id: good }, qty);
        if (unit * qty > cap) qty = Math.max(1, Math.floor(cap / Math.max(1, unit)));
        const a = authorize("trading", { cost: buyPriceAt(st, { id: good }, qty) * qty, credits: ship.credits, at: sim.time });
        if (!a.ok) return `fail:${a.why}`;
      }
      const e = tradeBuy(good, qty);
      if (e) return `fail:${e.toLowerCase()}`;
      const got = (ship.hold[good] ?? 0) - h0;
      if (mission.trade && good === mission.trade.good) { mission.trade.bought += got; mission.trade.spent += c0 - ship.credits; }
      mission.run.why = `bought ${Math.round(got)} ${good.replace(/_/g, " ")} for ${Math.round(c0 - ship.credits).toLocaleString()} cr`;
      return "done";
    },
  };
  return T;
}
