/* LIVING GALAXY 0.3.19 — trading pays, and TRADE RUN flies it.
 *
 *   node --import ./test/three-register.mjs test/trade.test.mjs
 *
 * The routes are real (bought at one port's transaction price, sold at
 * another's for more, sized to hold, purse, shelf and the buyer's till); BUY
 * with no good picks a route from here, not the cheapest thing on the shelf;
 * SELL "all" never sells a haul contract's consignment; the port preference
 * no longer pushes a favourite away on a negative score; and the TRADE RUN
 * preset, flown end to end, buys at one port, sells at ANOTHER, and makes
 * money — where it used to lose some every round.
 */

import { sim, launchSim, tickSim, sellPriceAt, buyPriceAt } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations, stationById } from "../js/stations.js";
import { autopilot, bestPortFor } from "../js/autopilot.js";
import { touch } from "../js/input.js";
import { currentSystem } from "../js/bodies.js";
import { BATTERY, holdRoom } from "../js/ship.js";
import { presets, validate } from "../js/mission/script.js";
import { mission, missionHooks, startMission, stopMission } from "../js/mission/run.js";
import { tradeRoutes, bestRoute, sellable, routeLine } from "../js/traderoutes.js";
import { contracts } from "../js/contracts.js";
import { notePlayerChoice } from "../js/aria.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

makePilot("Trader", "terran", "commerce", null);
launchSim("TradeTest", "sol");
sim.phase = "play";
const ship = sim.ship;
touch.panX = touch.panY = touch.rcsX = touch.rcsY = 0;
sim.dropoutRoll = 1;
ship.shields = false; ship.turretsArmed = false; ship.localGravity = false; ship.miningMode = "off";
ship.credits = 20000;
tickSim(1 / 60);

/* ---- the routes ----------------------------------------------------------------- */
{
  const rs = tradeRoutes({ n: 0 });
  ok(rs.length > 0, `there is money in moving goods in this sky (${rs.length} profitable routes)`);
  ok(rs.every((r) => r.from !== r.to && r.margin > 0 && r.sell === sellPriceAt(r.to, r.good) && r.buy === buyPriceAt(r.from, r.from.stock.find((l) => l.id === r.good))), "every route buys at one port's price and sells at another's for more");
  ok(rs.every((r) => r.qty <= holdRoom(ship) && r.qty * r.buy <= ship.credits && r.qty <= r.from.stock.find((l) => l.id === r.good).qty), "sized to the hold, the purse and the shelf");
  ok(rs.every((r, i) => i === 0 || r.perMin <= rs[i - 1].perMin), "ranked by credits per minute");
  console.log(`  best: ${routeLine(rs[0])}`);
  const poor = tradeRoutes({ credits: 50, n: 0 });
  ok(poor.every((r) => r.qty * r.buy <= 50), "a thin purse only sees what it can pay for");
}

/* ---- BUY with no good picks a route from here ------------------------------------ */
{
  const A = bestRoute().from;
  const here = bestRoute({ only: { from: A.id }, pos: A });
  ok(here && here.from === A && here.to !== A && sellPriceAt(here.to, here.good) > buyPriceAt(A, A.stock.find((l) => l.id === here.good)), `from ${A.name} the pick is ${here.name} → ${here.to.name}, which sells there for more than it costs here`);
}

/* ---- SELL "all" is only ours -------------------------------------------------------- */
{
  ship.hold.steel = 30;
  contracts.active.push({ id: "tst", consigned: 20, good: "steel", mech: "haul" });
  ok(Math.round(sellable().steel) === 10, "a consignment in the hold is not ours to sell");
  contracts.active.length = 0;
  delete ship.hold.steel;
}

/* ---- the port lean pulls a favourite in, never away --------------------------------- */
{
  ship.pos = { x: stations[0].x + 2e6, y: 0, z: 0 };
  const before = bestPortFor("nearest");
  for (let i = 0; i < 40; i++) notePlayerChoice("port", before.id);
  ok(bestPortFor("nearest") === before, `favouring ${before.name} keeps it the pick for "nearest" (negative scores divide by the lean now)`);
}

/* ---- TRADE RUN, flown ------------------------------------------------------------------ */
{
  const tr = presets().find((p) => p.name === "TRADE RUN");
  ok(tr && validate(tr).length === 0 && tr.steps.map((s) => `${s.op}${s.target ? ":" + s.target.kind : ""}`).join(">") === "DOCK:trade-source>BUY>DOCK:trade-dest>SELL>CHARGE", `the preset flies a route (${tr.steps.map((s) => s.op).join(" > ")})`);
  /* start a few kilometres off the best route's source port, out of its well */
  const pick = bestRoute({ pos: { x: 0, y: 0, z: 0 } }) ?? bestRoute();
  const A = pick.from;
  ship.pos = { x: A.x + 3500, y: A.y + 800, z: A.z + 2500 };
  sim.dominant = null;
  ship.vel.x = ship.vel.y = ship.vel.z = 0;
  ship.charge = BATTERY;
  ship.credits = 20000;
  for (const k of Object.keys(ship.hold)) delete ship.hold[k];
  const cr0 = ship.credits;
  const docks = [];
  missionHooks.onStep = (s) => { if (s.op === "SELL" || s.op === "BUY") docks.push({ op: s.op, at: ship.dockedAt }); };
  ok(startMission(tr), "TRADE RUN starts");
  for (let i = 0; i < 3 && !mission.trade; i++) tickSim(1 / 60);   // the route is picked when the source dock resolves
  const route = mission.trade ?? {};
  ok(route && route.fromId !== route.toId, `with a route on the books: ${route?.line}`);
  let n = 0, bought = false;
  while (n++ < 60 * 1800 && autopilot.on && mission.stats.loops < 1) {
    tickSim(1 / 60);
    if (!bought && (ship.hold[route.good] ?? 0) > 0) bought = true;
  }
  ok(bought, `it bought ${route.name}`);
  const buyAt = docks.find((d) => d.op === "BUY")?.at, sellAt = docks.find((d) => d.op === "SELL")?.at;
  ok(mission.stats.loops >= 1, `one round flown in ${(n / 60 / 60).toFixed(1)} min of sky time (${sim.notice})`);
  ok(buyAt && sellAt && buyAt !== sellAt, `bought at ${stationById(buyAt)?.name}, sold at ${stationById(sellAt)?.name} — not back where it came from`);
  ok((ship.hold[route.good] ?? 0) < 1, "the cargo is gone");
  ok(ship.credits > cr0 && (mission.stats.profit ?? 0) > 0, `and it made money: ${cr0} → ${Math.round(ship.credits)} cr (+${Math.round(mission.stats.profit ?? 0)} on the round)`);
  stopMission("test");
  missionHooks.onStep = null;
}

/* ---- MARKET › ROUTES: FLY IT is a one-off run of exactly that route ------------------ */
{
  const { flyRoute } = await import("../js/console/panels/market.js");
  ship.credits = 20000;
  for (const k of Object.keys(ship.hold)) delete ship.hold[k];
  const r = bestRoute();
  const m = flyRoute(r);
  ok(mission.active && mission.active.name === m.name && m.steps.map((s) => `${s.op}${s.target?.id ? ":" + s.target.id : ""}${s.args?.good ? ":" + s.args.good : s.args?.what ? ":" + s.args.what : ""}`).join(">") === `DOCK:${r.from.id}>BUY:${r.good}>DOCK:${r.to.id}>SELL:${r.good}`, `FLY IT: ${m.name} — ${m.steps.map((s) => s.op).join(" > ")}`);
  stopMission("test");
}

console.log(`trade: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
