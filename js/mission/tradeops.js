/* LIVING GALAXY — the mission's trade ops: the route a TRADE RUN flies, BUY and SELL.
 *
 * 0.3.19. Split out of mission/run.js (the console/crew/mission tree keeps
 * every file under 600 lines). run.js builds these with its own mission
 * state, `note` and the autopilot, and plugs BUY and SELL into its EXEC table
 * and pickRoute into its target resolver — no import back into run.js.
 *
 * The round's route (`mission.trade`) is picked at the source dock and kept
 * to the sell, so "the route's buyer" is the port the cargo was bought FOR.
 * SELL "route" sells that and only that; SELL "all" sells what is OURS — a
 * haul contract's consignment is somebody else's cargo. BUY with no good
 * asks for the best route whose source is this port.
 */

import { sim, sellAllOre, tradeBuy, tradeSell, logEvent } from "../sim.js";
import { holdRoom, roomFor } from "../ship.js";
import { stationById } from "../stations.js";
import { bestRoute, sellable, routeLine } from "../traderoutes.js";

export function makeTradeOps({ mission, note, ap }) {
  /**
   * The round's trade route: picked once at the top of a round (the source
   * dock) and kept to the sell, so "the route's buyer" is the port the cargo
   * was bought FOR, not whichever port scores best for a half-empty hold.
   * `peek` looks without keeping it (startMission's undock question).
   */
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
      /* "all" is everything that is OURS: a haul contract's consignment is somebody else's cargo (0.3.19) */
      else if (what === "all") { for (const [k, q] of Object.entries(sellable(ship))) refused = tradeSell(k, q) ?? refused; }
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
    BUY(s) {
      const ship = sim.ship;
      const st = stationById(ship.dockedAt);
      if (!st) return "fail:not docked";
      ap().phase = "trade"; ap().task = `buy · ${st.name}`;
      let good = s.args?.good ?? null;
      let qty = Math.min(s.args?.qty ?? 20, holdRoom(ship));
      if (good === "route") {
        /* the route's cargo, as much as the hold, the purse and the shelf allow */
        const t = mission.trade;
        if (!t) return "fail:no route on the books";
        if (t.fromId !== st.id) return `fail:the route buys at ${t.from}, not ${st.name}`;
        good = t.good;
        qty = Math.min(t.qty, Math.floor(roomFor(ship, good)));
      } else if (!good) {
        /* best margin FROM HERE: the best route whose source is this port (0.3.19 — it used to ask one
         * "best buyer" port chosen for the hold as it was before buying, which was nearly always this one) */
        const r = bestRoute({ only: { from: st.id }, pos: st, room: holdRoom(ship) });
        if (!r) return "fail:nothing on this shelf sells for more anywhere else";
        good = r.good;
        qty = Math.min(qty, r.qty);
      }
      if (good && good !== "route") qty = Math.min(qty, Math.floor(roomFor(ship, good)));   // 0.3.52: what fits of this good
      if (qty <= 0) return "fail:hold full";
      const c0 = ship.credits, h0 = ship.hold[good] ?? 0;
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
