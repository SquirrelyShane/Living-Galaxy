/* LIVING GALAXY — the ledger: lines, the price curve, boats and captains moving real stock.
 *
 *   node --import ./test/three-register.mjs test/economy.test.mjs
 */
import { sim, launchSim, sellPriceAt, buyPriceAt, tradeSell, portLedger } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { currentSystem } from "../js/bodies.js";
import { LINES, ECON_TICK, PRICE_FLOOR, PRICE_CEIL, stockMult, stockOf, runLines, stepEconomy, deliver, lift, shortagesOf, wantsOf, targetFor, econReport, ledgerOf } from "../js/economy.js";
import { flow, populateFlow, stepFlow, flowPose, boatName } from "../js/npc/flow.js";
import { traffic, populateTraffic, stepTraffic, trafficCensus } from "../js/npc/traffic.js";
import { rngFromSeed } from "../js/generate.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("Ledger", "terran", "commerce", null);
launchSim("LedgerTest", "sol");
sim.phase = "play";

/* ---- the price curve --------------------------------------------------- */
{
  const st = stations.find((s) => s.sector === "industrial") ?? stations[0];
  const id = "iron_ore";
  const T = targetFor(st, id);
  const line = st.stock.find((l) => l.id === id) ?? (st.stock.push({ id, qty: 0, sell: 1 }), st.stock[st.stock.length - 1]);
  const at = (q) => { line.qty = q; return stockMult(st, id); };
  ok(Math.abs(at(0) - PRICE_CEIL) < 1e-9, `bare shelves pay the ceiling (${at(0)})`);
  ok(at(T * 0.5) > at(T) && at(T) > at(T * 2) && at(T * 2) > at(T * 4), `the curve falls with stock (${at(T * 0.5).toFixed(2)} > ${at(T).toFixed(2)} > ${at(T * 2).toFixed(2)} > ${at(T * 4).toFixed(2)})`);
  ok(Math.abs(at(T * 20) - PRICE_FLOOR) < 1e-9, "a glut pays the floor");
  ok(at(T) > 0.85 && at(T) < 1.05, `at target the price is about book (${at(T).toFixed(2)})`);
  line.qty = T * 0.5;
  /* selling into the port moves the price you get */
  sim.ship.dockedAt = st.id;
  sim.ship.hold[id] = 400;
  const p0 = sellPriceAt(st, id);
  st.credits = 1e9;
  tradeSell(id, 300);
  const p1 = sellPriceAt(st, id);
  ok(p1 < p0, `selling 300 iron ore into the foundry drops what it pays (${p0} → ${p1} cr)`);
  const ask0 = buyPriceAt(st, line);
  line.qty = 2;
  ok(buyPriceAt(st, line) > ask0, "and what it charges rises when the shelf is bare");
  line.qty = T;
  sim.ship.dockedAt = null;
}

/* ---- the lines --------------------------------------------------------- */
{
  const st = stations.find((s) => s.sector === "industrial");
  ok(st && LINES.industrial.length >= 5, "an industrial port runs lines");
  const e = ledgerOf(st);
  ok(stockOf(st, "iron_ore") > 0 && stockOf(st, "copper_ore") > 0, "a working port opens with inputs on the floor");
  const steel0 = stockOf(st, "steel"), ore0 = stockOf(st, "iron_ore");
  runLines(st);
  ok(stockOf(st, "iron_ore") < ore0, `the smelter eats ore (${ore0.toFixed(0)} → ${stockOf(st, "iron_ore").toFixed(0)})`);
  ok(e.lines.find((l) => l.id === "smelter").running, "the smelter runs");
  ok(e.made.steel > 0, `and makes steel (${e.made.steel.toFixed(1)} u)`);
  /* starve it */
  lift(st, "iron_ore", 1e9);
  runLines(st);
  const sm = e.lines.find((l) => l.id === "smelter");
  ok(!sm.running && sm.stalledOn === "iron_ore", `no ore: the smelter stalls on ${sm.stalledOn}`);
  const sh = shortagesOf(st);
  ok(sh.some((x) => x.id === "iron_ore" && x.mult > 1.4), `iron ore is a shortage the port pays over the odds for (×${sh.find((x) => x.id === "iron_ore")?.mult.toFixed(2)})`);
  const w = wantsOf(st);
  ok(w.length === 3 && w[0].over >= w[1].over, `wants are ranked by premium (${w.map((x) => `${x.name} ×${x.over.toFixed(2)}`).join(", ")})`);
  deliver(st, "iron_ore", 500);
  runLines(st);
  ok(sm.running, "fed again, it runs again");
  /* a glut throttles output */
  deliver(st, "steel", targetFor(st, "steel") * 5);
  const made = e.made.steel;
  runLines(st);
  const full = e.made.steel - made;
  lift(st, "steel", 1e9);
  const made2 = e.made.steel;
  runLines(st);
  ok(e.made.steel - made2 > full * 2, `a glut of steel throttles the smelter (${full.toFixed(1)} u vs ${(e.made.steel - made2).toFixed(1)} u a pass)`);
  /* the clock */
  const ticks = e.ticks;
  e.acc = 0;
  stepEconomy(ECON_TICK * 3 + 0.01, stations);
  ok(e.ticks === ticks + 3, `stepEconomy runs one pass per ECON_TICK of accumulated time (${e.ticks - ticks})`);
  stepEconomy(0.02, stations);
  ok(e.ticks === ticks + 3, "and none early");
  const R = econReport(st);
  ok(R.lines.length === LINES.industrial.length && R.stock.every((x) => x.fill >= 0 && x.ask > 0 && x.bid > 0), "the report covers every line and prices every shelf");
  /* a habitat earns */
  const civ = stations.find((s) => s.sector === "civilian");
  if (civ) {
    const c0 = civ.credits;
    deliver(civ, "ration", 200); deliver(civ, "water", 200);
    ledgerOf(civ).earned = 0;
    runLines(civ);
    ok(ledgerOf(civ).earned > 0 && civ.credits >= c0, `a habitat turns rations and water into credits (+${ledgerOf(civ).earned.toFixed(0)})`);
  }
}

/* ---- the boats -------------------------------------------------------- */
{
  populateFlow(sim.skySeed, stations);
  ok(flow.length >= stations.length * 6, `${flow.length} boats over ${stations.length} ports`);
  ok(flow.every((n) => /^[A-Z]+ [A-Z]+ \d+$/.test(n.name) && n.hullName && n.qty > 0), `every boat has a name and a load (${flow[0].name}, ${flow[0].hullName}, ${flow[0].manifest})`);
  const names = flow.map((n) => n.name).join("|");
  populateFlow(sim.skySeed, stations);
  ok(flow.map((n) => n.name).join("|") === names, "names are deterministic in the seed");
  const rng = rngFromSeed("x");
  ok(boatName("logistic", rng, 3).startsWith("MV "), "logistic boats fly MV");
  /* an inbound boat that docks delivers its cargo */
  const n = flow.find((b) => b.inbound && b.good);
  const st = stations.find((s) => s.id === n.port);
  const dock = n.period * n.dockFrac;
  /* the arrival instant: phase wraps to 0 (docked) after the approach at the end of the period */
  const tArrive = n.period - n.phase;           // phase(t) = (t + n.phase) % period → 0 here
  stepFlow(tArrive - 0.5, stations);
  ok(n.job === "approach", `just before its arrival the boat is on approach (${n.job})`);
  const q0 = stockOf(st, n.good);
  stepFlow(tArrive + 0.5, stations);
  ok(n.job === "docked" && stockOf(st, n.good) - q0 >= n.qty - 1e-6, `${n.name} docks and ${st.name} gains ${n.qty} ${n.good} (${q0.toFixed(0)} → ${stockOf(st, n.good).toFixed(0)})`);
  /* an outbound boat that leaves lifts */
  const o = flow.find((b) => !b.inbound && b.good);
  const so = stations.find((s) => s.id === o.port);
  deliver(so, o.good, 500);
  const tLeave = so && (o.period * o.dockFrac - o.phase);
  stepFlow(tLeave - 0.5, stations);
  const q1 = stockOf(so, o.good);
  stepFlow(tLeave + 0.5, stations);
  ok(o.job === "outbound" && q1 - stockOf(so, o.good) >= o.qty - 1e-6, `${o.name} leaves and ${so.name} loses ${o.qty} ${o.good}`);
  void dock;
}

/* ---- the captains ------------------------------------------------------ */
{
  populateTraffic(sim.skySeed, stations, currentSystem);
  const c = trafficCensus();
  ok(c.total >= 50 && c.trader >= 9 && c.miner >= 12, `roster: ${JSON.stringify(c)}`);
  const withCargo = traffic.filter((n) => n.legs?.some((l) => l.cargo));
  ok(withCargo.length >= c.trader + c.hauler, `${withCargo.length} captains carry cargo on their legs`);
  const trader = traffic.find((n) => n.role === "trader" && n.legs?.some((l) => l.kind === "travel" && l.cargo && l.from.kind === "port"));

  /* This block used to pick a cargo leg, compute `leg.start - trader.phase` and
   * step the sim straight to that absolute time. Two things were wrong with it,
   * and the old sky's seed hid both:
   *
   *   - `phase` wraps modulo the period, so the bare subtraction goes NEGATIVE
   *     whenever a hull's phase has already passed that leg's start — stepping
   *     the sim backwards, so the departure never fires at all.
   *   - even wrapped, the arithmetic lands on whichever leg the hull's own
   *     clock says is next, which is not necessarily the leg that was picked.
   *     It asserted "it lifts 50 water" while the hull was departing with steel.
   *
   * What is actually under test is simpler than either: whatever a trader lifts
   * comes out of the port it is leaving, and lands at the port it is going to.
   * So stock every port that could be an origin, walk the hull through its own
   * timetable, and watch for the lift rather than trying to predict it. */
  const cargoLegs = trader.legs.filter((l) => l.kind === "travel" && l.cargo && l.from.kind === "port");
  for (const l of cargoLegs) {
    const from = stations.find((st) => st.id === l.from.id);
    if (from) deliver(from, l.cargo.id, 1000);
  }

  const STEP = 0.5;
  let lift = null;
  let before = new Map();
  const snapshot = () => {
    const m = new Map();
    for (const l of cargoLegs) {
      const from = stations.find((st) => st.id === l.from.id);
      if (from) m.set(`${from.id}:${l.cargo.id}`, stockOf(from, l.cargo.id));
    }
    return m;
  };
  for (let t = 0; t <= trader.period + STEP && !lift; t += STEP) {
    before = snapshot();
    const wasCarrying = trader.carrying;
    stepTraffic(t, STEP, stations, currentSystem);
    if (!wasCarrying && trader.carrying && trader.job === "outbound") {
      lift = { at: t, good: trader.carrying.id, qty: trader.carrying.qty };
    }
  }
  ok(lift, `${trader.name} departs under cargo somewhere in its ${Math.round(trader.period)} s timetable`);

  const leg = cargoLegs.find((l) => l.cargo.id === lift?.good && Math.abs(l.cargo.qty - lift.qty) < 1e-6)
    ?? cargoLegs.find((l) => l.cargo.id === lift?.good);
  const A = stations.find((st) => st.id === leg.from.id);
  const B = stations.find((st) => st.id === leg.to.id);
  const a0 = before.get(`${A.id}:${leg.cargo.id}`) ?? 0;
  const a1 = stockOf(A, leg.cargo.id);
  ok(a0 - a1 >= lift.qty - 1e-6, `it lifts ${lift.qty} ${lift.good} out of ${A.name} on departure (${a0.toFixed(0)} → ${a1.toFixed(0)})`);
  ok(trader.carrying?.qty === lift.qty, "and carries exactly what the port lost");

  /* now run it to the far end and watch the same quantity arrive */
  const b0 = stockOf(B, leg.cargo.id);
  let arrived = false;
  let sawApproach = false;
  for (let t = lift.at + STEP; t <= lift.at + leg.dur * 1.6 + 30 && !arrived; t += STEP) {
    stepTraffic(t, STEP, stations, currentSystem);
    if (trader.job === "approach") sawApproach = true;
    if (!trader.carrying && trader.job === "docked") arrived = true;
  }
  ok(sawApproach, "it shows as on approach at the far end");
  ok(arrived, `it docks at ${B.name} and sets the cargo down`);
  ok(stockOf(B, leg.cargo.id) - b0 >= lift.qty - 1e-6, `and ${B.name} takes delivery (${b0.toFixed(0)} → ${stockOf(B, leg.cargo.id).toFixed(0)})`);
  const miner = traffic.find((n) => n.role === "miner" && n.legs?.some((l) => l.kind === "travel" && l.cargo && l.from.kind === "belt"));
  ok(miner, `a miner brings ore home from the belt (${miner?.legs.find((l) => l.cargo)?.cargo.id})`);
  /* the ledger sees it */
  const L = portLedger(B);
  ok(L.moved > 0, `${B.name}'s ledger shows ${L.moved} u through the doors`);
}

console.log(`economy: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
