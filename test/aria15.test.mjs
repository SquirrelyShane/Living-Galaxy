/* LIVING GALAXY 0.3.95 — ARIA 1.5: what she sees, what she is sure of, and the wake she leaves.
 *
 *   node --import ./test/three-register.mjs test/aria15.test.mjs
 *
 * The first half is the pure instruments (mind, belief, threat, foresee,
 * footprint) on hand-built numbers. The second half is the real sim: a port,
 * a hold, an ARIA-flown SELL and BUY, hostiles put in the sky by hand.
 */

const store = new Map();
globalThis.localStorage ??= { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const mind = await import("../js/aria/mind.js");
const { ariaMind, resetMind, learnTape, contextualScore, policyScore, learnOutcome, verbOf, breakLine, forecast, settleForecast, calibrated, calibReport, discount, setOrders, saveMind, loadMind, riskAversion, explanationPacket, decideMind, CONTEXT_CAP } = mind;
const B = await import("../js/aria/belief.js");
const T = await import("../js/aria/threat.js");
const F = await import("../js/aria/foresee.js");
const FP = await import("../js/aria/footprint.js");
const econ = await import("../js/economy/economy.js");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;

/* ---- one vocabulary --------------------------------------------------------- */
{
  ok(verbOf("MINE", "mission") === "mine" && verbOf("mine") === "mine" && verbOf("board:mining:vein") === "mine", "the Tape's MINE, the conn's mine and a mining contract are one verb");
  ok(verbOf("route") === "trade" && verbOf("supply") === "trade" && verbOf("BUY", "mission") === "trade" && verbOf("board:logistics:haul") === "trade", "a route, a supply run, a BUY step and a haul contract are all trade");
  ok(verbOf("yard") === "repair" && verbOf("REPAIR", "mission") === "repair", "the yard is a repair");
  ok(verbOf("GOTO", "mission") === null && verbOf("DOCK", "mission") === null && verbOf("end", "mission") === null, "a leg or a berth is not a decision");
  ok(verbOf("cutter", "order", "auto") === "mine" && verbOf("cutter", "order", "off") === null, "switching the cutter on is mining; switching it off is not");
  ok(verbOf("btn-settings", "tap", "SETTINGS") === null && verbOf("btn-x", "tap", "MINING LOOP") === "mine" && verbOf("sell-all", "tap", null) === "sell", "a tap counts only when it is on a button about work");
}

/* ---- taps no longer push out what she learned (the 0.3.93 defect) ------------ */
{
  resetMind(null);
  const s = { t: 0, hull: 0.9, hold: 0.1, hz: 0, dk: 0 };
  for (let i = 0; i < 40; i++) learnTape({ by: "player", kind: "mission", act: "MINE", s, d: { cr: 0, hull: 0, dt: 30 } });
  for (let i = 0; i < 400; i++) learnTape({ by: "player", kind: "tap", act: "btn-" + i, arg: "PANEL " + i, s: { ...s, hold: (i % 4) / 4 }, d: { cr: 0, hull: 0, dt: 30 } });
  const c = contextualScore("mine", s);
  ok(c.lean > 0.99 && c.samples === 40, `40 mining observations survive 400 unrelated taps (lean ${c.lean.toFixed(2)}, ${c.samples} samples)`);
  ok(ariaMind.contexts.length === 1, `and the taps took no room at all (${ariaMind.contexts.length} context)`);
  ok(ariaMind.learned === 440, "every settled record still counts as an observation");
  for (let i = 0; i < 300; i++) learnTape({ by: "player", kind: "mission", act: "OP" + i, s: { ...s, t: 10 }, d: { cr: 0, hull: 0, dt: 30 } });
  ok(ariaMind.contexts.length === CONTEXT_CAP && ariaMind.contexts.some((x) => x.action === "mine" && x.n === 40), "when memory is full the thinnest context goes, not the oldest — the 40 are still there");
}

/* ---- the career planner's words now match the Tape's ------------------------- */
{
  resetMind(null);
  const s = { t: 0, hull: 0.9, hold: 0.1, hz: 0, dk: 0 };
  for (let i = 0; i < 30; i++) learnTape({ by: "player", kind: "mission", act: "MINE", s, d: { cr: 0, hull: 0, dt: 30 } });
  for (let i = 0; i < 10; i++) learnTape({ by: "player", kind: "mission", act: "BUY", s, d: { cr: -100, hull: 0, dt: 30 } });
  const m = contextualScore("board:mining:vein", s), r = contextualScore("route", s), sv = contextualScore("survey", s);
  ok(near(m.lean, 0.75, 0.01) && near(r.lean, 0.25, 0.01) && sv.lean === 0, `a captain who mined 30 and bought 10: mining contract ${m.lean.toFixed(2)}, route ${r.lean.toFixed(2)}, survey ${sv.lean}`);
  const nearby = contextualScore("mine", { ...s, hull: 0.74 });
  ok(nearby.lean > 0.7 && nearby.mass > 30, `a hull at 74% is not a stranger to one at 90% (mass ${nearby.mass.toFixed(1)} of 40)`);
  const far = contextualScore("mine", { hull: 0.1, hold: 0.95, hz: 1, dk: 1 });
  ok(far.confidence < 0.05, `but a wrecked, full, docked ship under fire is (confidence ${far.confidence.toFixed(3)})`);

  /* the decision mode means something at credits-a-minute scale */
  setOrders({ mode: "imitate" });
  const a = policyScore("board:mining:vein", 600, s, { ratio: true }), b = policyScore("board:science:survey", 700, s, { ratio: true });
  ok(a > b, `imitate: a 600 cr/min mining job beats a 700 cr/min survey for a captain who mines (${Math.round(a)} vs ${Math.round(b)})`);
  setOrders({ mode: "optimize" });
  ok(policyScore("board:mining:vein", 600, s, { ratio: true }) === 600 && policyScore("board:science:survey", 700, s, { ratio: true }) === 700, "optimize: the money decides");
  setOrders({ mode: "balanced" });
  const bal = policyScore("board:mining:vein", 600, s, { ratio: true });
  ok(bal > 600 && bal < a, `balanced sits between (${Math.round(bal)})`);
  ok(near(policyScore("mine", 0.6, s), 0.6 + m.lean * m.confidence * 0.35, 1e-9), "the conn planner's share-scale score is unchanged");
}

/* ---- old results fade with sky time, not with the version number ------------- */
{
  resetMind(null);
  learnOutcome("route", 120, 4000, true, 0);
  learnOutcome("route", 120, 4000, true, 30);
  const m = ariaMind.experience.moves.route;
  ok(m.runs === 2 && m.secs === 240 && m.cr === 8000, "two runs half a minute apart are both whole");
  learnOutcome("route", 120, 400, true, 30 + 7200);
  ok(m.runs === 3 && near(m.w, 2, 1e-6) && near(m.cr, 4400, 1e-6), `two hours on the old pair count for one (w ${m.w.toFixed(2)}, ${Math.round(m.cr)} cr)`);
  const rate = m.cr / (m.secs / 60);
  ok(rate < 1200, `so the rate follows the sky as it is now (${Math.round(rate)} cr/min, was 2,000)`);
  const n = discount((k) => k === "route", 0.5, "ore fell at Ceres", 9000);
  ok(n === 1 && near(m.w, 1, 1e-6) && ariaMind.shift.why === "ore fell at Ceres", "a shift in the sky marks a kind of work down and says why");
  const { brainSig } = await import("../js/aria/play.js");
  const { VERSION } = await import("../js/version.js");
  ok(!brainSig().includes(VERSION), `the career brain's signature no longer carries the version (${brainSig()})`);
}

/* ---- she is scored on what she said she was sure of -------------------------- */
{
  resetMind(null);
  ok(calibrated(0.9) === 0.9, "with no record her confidence is taken as given");
  for (let i = 0; i < 10; i++) { forecast({ key: "mine", p: 0.9, secs: 100, cr: 1000 }); settleForecast("mine", 150, 800, i < 4); }
  const r = calibReport();
  ok(r.n === 10 && r.bins[3].n === 10 && near(r.bins[3].came, 0.4), `ten jobs called at 90%, four came off (${r.bins[3].came})`);
  const c = calibrated(0.9);
  ok(c < 0.6 && c > 0.4, `so 90% now reads ${Math.round(c * 100)}%`);
  ok(r.slower > 1.3 && r.richer < 1, `and she knows they ran ${Math.round((r.slower - 1) * 100)}% long and paid ${Math.round((1 - r.richer) * 100)}% short`);
  ok(settleForecast("route", 1, 1, true) === null, "a forecast is only scored against the job it was made for");
  const d = decideMind({ action: "mine", state: { hull: 1, th: 0.8 } });
  ok(d.confidence <= d.raw && d.risk >= 0.39, `the Core shows the corrected figure (${d.confidence.toFixed(2)} from ${d.raw.toFixed(2)}) and a graded risk (${d.risk.toFixed(2)})`);
  const store2 = new Map(); const was = globalThis.localStorage;
  globalThis.localStorage = { setItem: (k, v) => store2.set(k, v), getItem: (k) => store2.get(k) ?? null };
  ariaMind.wake = { v: 1, totals: { trades: 3 } };
  saveMind("cal"); loadMind("other"); ok(ariaMind.calib.n === 0 && ariaMind.wake === null, "another captain starts with no record and no wake");
  loadMind("cal"); ok(ariaMind.calib.n === 10 && ariaMind.calib.bins[3].ok === 4 && ariaMind.wake?.totals.trades === 3, "the record and the wake come back with the mind");
  resetMind("old");
  store2.set("old", JSON.stringify({ v: 2, contexts: [
    { key: "player:mission:MINE", bucket: "3:0:0:0", action: "MINE", by: "player", n: 30, cr: 0, hull: 0, dt: 900 },
    { key: "player:tap:btn-settings", bucket: "3:0:0:0", action: "btn-settings", by: "player", n: 50, cr: 0, hull: 0, dt: 0 },
    { key: "player:tap:btn-mining-loop", bucket: "3:0:0:0", action: "btn-mining-loop", by: "player", n: 6, cr: 0, hull: 0, dt: 0 },
    { key: "player:order:cutter", bucket: "3:0:0:0", action: "cutter", by: "player", n: 9, cr: 0, hull: 0, dt: 0 },
    { key: "player:mission:DOCK", bucket: "3:0:0:0", action: "DOCK", by: "player", n: 12, cr: 0, hull: 0, dt: 0 },
    { key: "player:mission:BUY", bucket: "3:3:0:1", action: "BUY", by: "player", n: 4, cr: -900, hull: 0, dt: 120 },
  ] }));
  loadMind("old");
  const kept = ariaMind.contexts;
  ok(kept.length === 2 && kept.find((x) => x.key === "player:mine")?.n === 36 && kept.find((x) => x.key === "player:trade")?.n === 4, `a 0.3.93 save is read into the new words: taps, legs and switch orders dropped, mining merged (${kept.map((x) => `${x.key}×${x.n}`).join(", ")})`);
  ok(contextualScore("mine", { hull: 0.9, hold: 0.1, hz: 0, dk: 0 }).lean > 0.95, "and the 50 settings taps in it no longer water her lean down");
  globalThis.localStorage = was;
}

/* ---- the break line -------------------------------------------------------------- */
{
  resetMind(null);
  ok(near(breakLine(1, 0), 0.55) && near(breakLine(1, 0.5), 0.55), "a threat she can handle does not move the break line");
  ok(near(breakLine(1, 1), 0.70) && breakLine(1, 0.75) > 0.6, `outgunned lifts it (${breakLine(1, 1).toFixed(2)})`);
  ok(near(breakLine(0.1, 1), 0.90) && breakLine(0.1, 1) <= 0.95, "outgunned on a flat battery lifts it further, never past the top");
  ariaMind.risk.combat = 0.05; const careful = riskAversion();
  ariaMind.risk.combat = 0.45; const bold = riskAversion();
  ok(careful > bold && careful <= 1 && bold >= 0.15, `a captain who kept out of fights makes her careful (${careful.toFixed(2)} vs ${bold.toFixed(2)})`);
  setOrders({ avoidHostiles: false }); ok(riskAversion() < bold, "and unticking Avoid hostiles halves it"); setOrders({ avoidHostiles: true });
}

/* ---- belief: change detection ------------------------------------------------- */
{
  B.resetBelief();
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let alarms = 0;
  for (let i = 0; i < 300; i++) if (B.track("p", 100 + (rnd() - 0.5) * 4, i * 20, { kind: "price" })) alarms++;
  ok(alarms === 0, "300 readings of a steady price raise nothing");
  let drift = 0;
  for (let i = 0; i < 300; i++) if (B.track("d", 100 + i * 0.02 + (rnd() - 0.5) * 4, i * 20)) drift++;
  ok(drift === 0, "slow drift is followed, not announced");
  let at = null, a0 = null;
  for (let i = 300; i < 330; i++) { const a = B.track("p", 112 + (rnd() - 0.5) * 4, i * 20, { kind: "price" }); if (a && at == null) { at = i - 300; a0 = a; } }
  ok(at != null && at <= 3 && a0.dir === 1, `a step from 100 to 112 is caught within ${at + 1} reading(s), as a rise`);
  let again = 0;
  for (let i = 330; i < 400; i++) if (B.track("p", 112 + (rnd() - 0.5) * 4, i * 20)) again++;
  ok(again === 0, "and announced once: the tracker settles on the new level");
  ok(B.alertsSince(400 * 20, 600).length === 0 && B.alertsSince(330 * 20, 2000).length === 1, "alerts age out");
  B.resetBelief();
  for (let i = 0; i < 20; i++) B.track("x", 50, i * 20);
  B.anchor("x", 30, 400);
  let self = 0; for (let i = 21; i < 40; i++) if (B.track("x", 30, i * 20)) self++;
  ok(self === 0, "a move she made herself (anchor) is not news");
  let n1 = 0; B.resetBelief(); for (let i = 0; i < 30; i++) if (B.track("h", i < 15 ? 0 : 1, i * 2, { scale: 1 })) n1++;
  let n4 = 0; for (let i = 0; i < 30; i++) if (B.track("h4", i < 15 ? 0 : 4, i * 2, { scale: 1 })) n4++;
  ok(n1 === 0 && n4 === 1, "one more hostile is not a change in the sky; four at once is");
}

/* ---- belief: facts and danger fade --------------------------------------------- */
{
  B.resetBelief();
  B.observe("raider", { x: 1 }, 0, { kind: "threat" });
  ok(near(B.recall("raider", 45).conf, 0.5, 0.01) && B.recall("raider", 400, 0.05) === null, "a sighting is half as sure after 45 s and not worth acting on after 400");
  B.markDanger({ x: 1000, y: 0, z: 0 }, 0.8, 0, "raider");
  ok(near(B.dangers(240)[0].w, 0.4, 0.01), "where trouble was fades the same way");
  B.markDanger({ x: 1200, y: 0, z: 0 }, 0.3, 240);
  ok(B.dangers(240).length === 1 && near(B.dangers(240)[0].w, 0.4, 0.01), "a weaker sighting in the same place does not talk a stronger one down");
  ok(B.dangers(4000).length === 0 && B.belief.danger.size === 0, "and in the end it is forgotten");
}

/* ---- threat is graded ------------------------------------------------------------ */
{
  const own = { pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 }, hull: 1, charge: 1, armed: true, turrets: 2 };
  const h = (d, vx = 0) => ({ id: "h", name: "Raider", x: d, y: 0, z: 0, vx, vy: 0, vz: 0, hp: 60, shield: 20 });
  const drift = T.threatOf(own, [h(5500)]), closing = T.threatOf(own, [h(5500, -300)]), pack = T.threatOf(own, [1, 2, 3, 4].map(() => h(3000, -300)));
  const hurt = T.threatOf({ ...own, hull: 0.4, charge: 0.2 }, [1, 2, 3, 4].map(() => h(3000, -300))), unarmed = T.threatOf({ ...own, armed: false }, [h(5500)]);
  ok(T.threatOf(own, []).level === 0 && T.threatOf(own, [h(20000)]).n === 0, "nothing in reach is no threat");
  ok(drift.level < closing.level && closing.level < pack.level && pack.level <= hurt.level, `drifting ${drift.level.toFixed(2)} < closing ${closing.level.toFixed(2)} < a pack ${pack.level.toFixed(2)} ≤ a pack on a hurt hull ${hurt.level.toFixed(2)}`);
  ok(drift.band === "watch" && pack.band === "outgunned", `one drone drifting past is "${drift.band}", four closing is "${pack.band}"`);
  ok(unarmed.level > drift.level * 2, `the same drone means more to an unarmed hull (${unarmed.level.toFixed(2)})`);
  ok(near(closing.eta, 5500 / 300, 0.5) && !Number.isFinite(drift.eta), `closing speed gives a time (${Math.round(closing.eta)} s)`);
  const hz = T.hazardsFrom({ nests: [{ x: 50000, y: 0, z: 3000, name: "nest" }], dangers: [{ x: 0, y: 0, z: 90000, w: 0.5 }] });
  const through = T.legRisk({ x: 0, y: 0, z: 0 }, { x: 100000, y: 0, z: 0 }, hz), clear = T.legRisk({ x: 0, y: 0, z: -60000 }, { x: 100000, y: 0, z: -60000 }, hz);
  ok(through.risk > 0.4 && through.worst.name === "nest" && clear.risk < 0.01, `a lane past a nest carries risk (${through.risk.toFixed(2)}); one well clear does not`);
  const two = T.pathRisk([{ x: 0, y: 0, z: 0 }, { x: 100000, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }], hz);
  ok(near(two.risk, 1 - (1 - through.risk) * (1 - through.risk), 0.02), "there and back is twice the exposure, not the same again");
}

/* ---- the forward model runs the economy's own code ---------------------------- */
{
  const st = { id: "t1", name: "Test Foundry", sector: "industrial", radius: 50, credits: 40000, stock: [{ id: "iron_ore", qty: 2 }, { id: "carbonaceous", qty: 80 }, { id: "steel", qty: 10 }] };
  econ.ledgerOf(st); st.stock.find((l) => l.id === "iron_ore").qty = 2; econ.runLines(st);
  ok(!st.econ.lines[0].running && st.econ.lines[0].stalledOn === "iron_ore", "a foundry out of ore: the smelter is stalled on it");
  const snap = JSON.stringify(st);
  const cf = F.counterfactual(st, { deliver: { iron_ore: 200 } }, 4);
  ok(cf.restarted.some((l) => l.id === "smelter") && cf.extra.steel > 10, `200 ore restarts it and makes ${cf.extra.steel.toFixed(0)} more steel in four ticks`);
  ok(JSON.stringify(st) === snap, "the forecast did not touch the real port");
  const real = JSON.parse(snap); real.stock.find((l) => l.id === "iron_ore").qty += 200; for (let i = 0; i < 4; i++) econ.runLines(real);
  const g = F.ghost(st); g.stock.find((l) => l.id === "iron_ore").qty += 200; for (let i = 0; i < 4; i++) econ.runLines(g);
  ok(near(econ.stockOf(real, "steel"), econ.stockOf(g, "steel"), 1e-9) && near(real.credits, g.credits, 1e-9), "and it is exact: a copy run forward matches the port run forward");
  const none = F.counterfactual(st, { deliver: { steel_plate: 5 } }, 4);
  ok(none.restarted.length === 0 && none.stalled.length === 0, "cargo no line eats starts nothing");
  const lift = F.counterfactual({ ...JSON.parse(snap), stock: [{ id: "iron_ore", qty: 300 }, { id: "carbonaceous", qty: 80 }, { id: "steel", qty: 10 }] }, { lift: { iron_ore: 298 } }, 2);
  ok(lift.stalled.some((l) => l.id === "smelter"), "buying a port's feed bare is forecast to stop its line");

  const f = F.foreseeSale(st, [{ id: "iron_ore", qty: 600 }]);
  ok(f.lots[0].slip > 0.15 && f.slipLost > 0 && near(f.revenue + f.slipLost, f.flat, 1), `600 ore sells ${Math.round(f.lots[0].slip * 100)}% under the shelf price: ${Math.round(f.slipLost)} cr is her own doing`);
  ok(f.gluts.includes("iron_ore") && f.relieves.includes("iron_ore"), "it was wanted, and that much of it floods the shelf");
  ok(near(f.lots[0].unit, econ.bidPrice(st, "iron_ore", 600)), "the lot price is the economy's lot price");
  const poor = F.foreseeSale({ ...st, credits: 500 }, [{ id: "iron_ore", qty: 600 }]);
  ok(poor.short && poor.paid === 500, "a port that cannot pay is worth what it can pay");
  const hold = { iron_ore: 100 };
  const v0 = F.sellValue(st, hold).value, v1 = F.sellValue(st, hold, { steward: 0.5 }).value;
  ok(v1 > v0, `steward 0.5: a port short of the cargo is worth more to her (${Math.round(v0)} → ${Math.round(v1)})`);
  const full = { ...st, stock: [{ id: "iron_ore", qty: econ.targetFor(st, "iron_ore") * 2.1 }] };
  const g0 = F.sellValue(full, hold).value, g1 = F.sellValue(full, hold, { steward: 0.5 }).value;
  ok(g1 < g0, `and one she would flood is worth less (${Math.round(g0)} → ${Math.round(g1)})`);
  const b = F.foreseeBuy({ ...st, stock: [{ id: "iron_ore", qty: 100 }] }, "iron_ore", 90);
  ok(b.climb > 0 && b.leavesShort && b.starves, `buying 90 of 100 walks the price up ${Math.round(b.climb * 100)}% and starves the smelter`);
}

/* ---- the ledger ------------------------------------------------------------------- */
{
  FP.resetFootprint();
  FP.noteTrade({ at: 10, port: { id: "s1", name: "Foundry" }, kind: "sell", lots: [{ id: "iron_ore", name: "Iron ore", qty: 200, cr: 1800, m0: 1.3, m1: 1.05, need: true }], slipLost: 200, standing: { id: "c1", name: "Ceres Works", before: 3, after: 3.6 }, forecast: { restarted: [{ id: "smelter", name: "Smelter" }], stalled: [] } });
  ok(FP.audit(30, () => true) === 0, "a forecast is not scored before the port has had a tick to show it");
  ok(FP.audit(70, () => true) === 1 && FP.footprint.lines.confirmed === 1, "then it is: the line is running");
  FP.noteTrade({ at: 80, port: { id: "s2", name: "Mill" }, kind: "buy", lots: [{ id: "steel", name: "Steel", qty: 50, cr: 900, m0: 1, m1: 1.2, starved: true }], forecast: { restarted: [], stalled: [{ id: "rolling", name: "Rolling mill" }] } });
  FP.noteTrade({ at: 85, port: { id: "s3", name: "Yard" }, kind: "sell", lots: [{ id: "steel", name: "Steel", qty: 50, cr: 1100, m0: 1.2, m1: 1.1 }], forecast: { restarted: [{ id: "x", name: "Never" }], stalled: [] } });
  FP.audit(200, (p) => (p === "s2" ? false : p === "s3" ? false : null));
  ok(FP.footprint.lines.stalledConfirmed === 1 && FP.footprint.lines.missed === 0, "a line she stopped is booked as soon as it is seen stopped; one she has not started yet waits");
  FP.audit(400, () => false);
  ok(FP.footprint.lines.missed === 1 && FP.footprint.pending.length === 0, "and is a miss when its time runs out");
  const r = FP.footprintReport();
  ok(r.totals.trades === 3 && r.totals.earned === 2900 && r.totals.spent === 900 && r.totals.slipLost === 200, `totals: ${r.totals.trades} trades, ${r.totals.earned} in, ${r.totals.spent} out, ${r.totals.slipLost} to slip`);
  ok(r.corps[0].name === "Ceres Works" && near(r.corps[0].delta, 0.6, 0.01) && r.lines.rate === 0.5, "standing moved and the forecast score are in the report");
  ok(/3 trades at 3 ports/.test(FP.footprintLine()) && /1 line started/.test(FP.footprintLine()) && /1 stopped/.test(FP.footprintLine()), FP.footprintLine());
  const out = FP.footprintOut(); FP.resetFootprint(); ok(FP.footprintLine() === "no wake yet", "reset clears it");
  ok(FP.footprintIn(out) && FP.footprintReport().totals.trades === 3 && !FP.footprintIn({ v: 9 }), "it saves and loads, and refuses a shape it does not know");
}

/* ============================ the real sim ===================================== */
const { sim, launchSim, tickSim, sellPriceAt } = await import("../js/sim/sim.js");
const { makePilot } = await import("../js/flight/pilot.js");
const { touch } = await import("../js/core/input.js");
const { stations } = await import("../js/station/stations.js");
const { wireAria, ariaTakeConn, ariaRelease, saveAria, loadAria, ariaWatchReport } = await import("../js/aria/aria.js");
const { mission, startMission, stopMission } = await import("../js/mission/run.js");
const { makeMission, makeStep } = await import("../js/mission/script.js");
const { bestPortFor, portHooks } = await import("../js/flight/autopilot.js");
const { contacts } = await import("../js/flight/turrets.js");
const { perceive, hostileWithin, forgetSenses } = await import("../js/aria/senses.js");
const { corpOfStation } = await import("../js/corp/corps.js");
const { ariaFlying, sellValueAt, wakeReset } = await import("../js/aria/wake.js");
const { shouldBreakOff, bestRepairPort } = await import("../js/aria/pilot.js");
const { hullMaxOf } = await import("../js/flight/repair.js");
const { captain } = await import("../js/npc/captain.js");

makePilot("Aria", "terran", "mining", null);
launchSim("Aria15", "sol");
sim.phase = "play";
wireAria();
touch.panX = touch.panY = touch.rcsX = touch.rcsY = 0;
sim.dropoutRoll = 1;
const ship = sim.ship;
tickSim(1 / 60);
resetMind(null); wakeReset(); FP.resetFootprint(); forgetSenses();

const runMission = (steps, secs = 20) => {
  const m = makeMission({ name: "ARIA · test", builtin: true, aria: true, steps, loop: { mode: "none" } });
  ok(startMission(m), `mission starts (${steps.map((s) => s.op).join(" → ")})`);
  for (let i = 0; i < secs * 60 && mission.active && mission.state === "running"; i++) tickSim(1 / 60);
  const state = mission.state;
  if (mission.active) stopMission("test over", { quiet: true });
  mission.state = "idle";
  return state;
};

/* ---- an ARIA-flown sale is witnessed ------------------------------------------- */
const ind = stations.find((s) => s.sector === "industrial" && !s.hostile && s.hangars?.length) ?? stations.find((s) => !s.hostile && s.hangars?.length);
{
  ok(ind, `an honest port to trade at (${ind?.name}, ${ind?.sector})`);
  econ.ledgerOf(ind);
  const line = ind.stock.find((l) => l.id === "iron_ore") ?? (ind.stock.push({ id: "iron_ore", qty: 0 }), ind.stock.at(-1));
  line.qty = 1; ind.credits = 500000;
  for (let i = 0; i < 2; i++) econ.runLines(ind);
  line.qty = 1;
  const stalled = ind.econ.lines.filter((l) => !l.running && l.stalledOn === "iron_ore").map((l) => l.id);
  ship.dockedAt = ind.id; ship.hold = { iron_ore: Math.min(200, Math.floor(ship.cargoCap * 0.8)) }; ship.credits = 5000;
  const qty = ship.hold.iron_ore;
  const co = corpOfStation(ind); const stand0 = co?.standing ?? null;
  const p0 = sellPriceAt(ind, "iron_ore");
  perceive(true);
  for (let i = 0; i < 12; i++) { sim.time += 20; perceive(true); }
  const priceAlerts = () => perceive(true).alerts.filter((a) => a.group === "price").length;
  const alerts0 = priceAlerts();
  const cr0 = ship.credits;
  const state = runMission([makeStep("SELL", null, { args: { what: "all" } })]);
  const r = FP.footprintReport();
  const P = r.ports.find((x) => x.id === ind.id);
  ok(state === "done" && !(ship.hold.iron_ore > 0), `the SELL step ran (${state})`);
  ok(P && P.trades === 1 && Math.abs(P.earned - (ship.credits - cr0)) <= 1, `the sale is in the ledger at ${ind.name}: ${P?.earned} cr for ${qty} ore`);
  ok(P?.top?.id === "iron_ore" && P.top.m1 < P.top.m0 && sellPriceAt(ind, "iron_ore") < p0, `with what it did to the price (×${P?.top?.m0.toFixed(2)} → ×${P?.top?.m1.toFixed(2)})`);
  ok(P?.relieved === 1 && r.totals.slipLost > 0, `it was wanted, and ${r.totals.slipLost} cr of the take went to her own price move`);
  if (co) ok(r.corps.some((c) => c.id === co.id && c.delta > 0) && co.standing > stand0, `and to standing with ${co.name} (+${r.corps.find((c) => c.id === co.id)?.delta})`);
  if (stalled.length) {
    ok(r.lines.forecast >= 1 && r.lines.waiting >= 1, `she forecast ${r.lines.forecast} stalled line(s) to start on it`);
    for (let i = 0; i < 70 * 60; i++) tickSim(1 / 60);
    captain.holder = "aria"; perceive(true); const { wakeAudit } = await import("../js/aria/wake.js"); wakeAudit(); captain.holder = "player";
    const after = FP.footprintReport().lines;
    ok(after.confirmed >= 1 && ind.econ.lines.some((l) => stalled.includes(l.id) && l.running), `and seventy seconds on the real port bears it out (${after.confirmed} confirmed, ${after.missed} missed)`);
  } else ok(true, "(no line at this port was stalled on ore — forecast check skipped)");
  sim.time += 20;
  const fresh = perceive(true).fresh.filter((a) => a.group === "price");
  ok(fresh.length === 0 && priceAlerts() === alerts0, `her own sale (ore ${Math.round((1 - sellPriceAt(ind, "iron_ore") / p0) * 100)}% down) is not reported to her as the sky changing`);
}

/* ---- a player-flown sale is not hers -------------------------------------------- */
{
  const before = FP.footprintReport().totals.trades;
  ship.dockedAt = ind.id; ship.hold = { iron_ore: 20 };
  const m = makeMission({ name: "manual", steps: [makeStep("SELL", null, { args: { what: "all" } })], loop: { mode: "none" } });
  startMission(m);
  for (let i = 0; i < 10 * 60 && mission.active && mission.state === "running"; i++) tickSim(1 / 60);
  if (mission.active) stopMission("x", { quiet: true }); mission.state = "idle";
  ok(FP.footprintReport().totals.trades === before, "the captain's own missions leave no mark in ARIA's ledger");
}

/* ---- an ARIA-flown purchase is witnessed too ------------------------------------- */
{
  const src = stations.find((s) => !s.hostile && s.hangars?.length && s.stock?.some((l) => l.qty >= 30)) ?? ind;
  const line = src.stock.filter((l) => l.qty >= 30).sort((a, b) => b.qty - a.qty)[0];
  ship.dockedAt = src.id; ship.hold = {}; ship.credits = 60000;
  const before = FP.footprintReport().totals.bought;
  const state = runMission([makeStep("BUY", null, { args: { good: line.id, qty: 10 } })]);
  const r = FP.footprintReport();
  ok(state === "done" && r.totals.bought - before >= 1 && r.totals.spent > 0, `a BUY of ${line.id} at ${src.name} is booked (${r.totals.bought - before} units, ${r.totals.spent} cr)`);
}

/* ---- the buyer is chosen on the whole lot, while she flies ----------------------- */
{
  ship.dockedAt = null;
  ok(portHooks.sellValue === sellValueAt && !ariaFlying() && sellValueAt(ind) === null, "the hook is wired and hands the question back when she is not flying");
  const honest = stations.filter((s) => !s.hostile && s.hangars?.length && s.stock);
  const A = honest[0], Bst = honest.find((s) => s !== A && s.sector === A.sector) ?? honest[1];
  for (const s of honest) s.credits = 1e6;
  ship.pos.x = (A.x + Bst.x) / 2; ship.pos.y = (A.y + Bst.y) / 2; ship.pos.z = (A.z + Bst.z) / 2;
  ship.hold = { iron_ore: Math.min(300, Math.floor(ship.cargoCap * 0.9)) };
  const set = (s, q) => { const l = s.stock.find((x) => x.id === "iron_ore"); if (l) l.qty = q; else s.stock.push({ id: "iron_ore", qty: q }); };
  for (const s of honest) set(s, econ.targetFor(s, "iron_ore") * 3);
  setOrders({ steward: 0 });
  captain.holder = "aria";
  const best0 = bestPortFor("sell");
  const worth = (s) => sellPriceAt(s, "iron_ore", ship.hold.iron_ore) * ship.hold.iron_ore;
  ok(Math.abs(sellValueAt(A) - Math.min(worth(A), A.credits)) <= 1, `while she flies a port is valued on the whole lot (${Math.round(sellValueAt(A))} cr at ${A.name})`);
  const poor = best0; poor.credits = 300;
  ok(sellValueAt(poor) === 300 && bestPortFor("sell")?.id !== poor.id, `and a port with 300 cr in the till is no longer the best buyer (was ${poor.name}, now ${bestPortFor("sell")?.name})`);
  poor.credits = 1e6;
  set(A, 0); set(Bst, econ.targetFor(Bst, "iron_ore") * 3);
  const need0 = sellValueAt(A); setOrders({ steward: 1 }); const need1 = sellValueAt(A);
  ok(need1 > need0, `steward 1 lifts a port that is out of the cargo (${Math.round(need0)} → ${Math.round(need1)})`);
  captain.holder = "player"; setOrders({ steward: 0.25 });
  ok(sellValueAt(A) === null, "and the captain's own autopilot is left as it was");
}

/* ---- perception: scene, threat, danger, break-off --------------------------------- */
{
  contacts.length = 0; forgetSenses(); resetMind(null);
  ship.dockedAt = null; ship.hull = hullMaxOf(ship); ship.credits = 50000;
  const s0 = perceive(true);
  ok(s0.threat.level === 0 && ariaMind.scene?.line && ariaMind.scene.threat.band === "clear", `a quiet sky: "${ariaMind.scene?.line}", threat clear`);
  const raider = (i, d, close) => ({ id: `t-raider-${i}`, kind: "drone", name: "Test raider", relation: "hostile", x: ship.pos.x + d, y: ship.pos.y + i * 40, z: ship.pos.z, vx: ship.vel.x - close, vy: ship.vel.y, vz: ship.vel.z, hp: 80, shield: 20, radius: 4 });
  contacts.push(raider(0, 5500, 0));
  const one = perceive(true);
  ok(hostileWithin(6000) && one.threat.n === 1 && one.threat.level > 0 && one.threat.level < 0.65, `one drone at 5,500 u: ${one.threat.band} (${one.threat.level.toFixed(2)})`);
  ok(one.hazards.length >= 1, "it is a hazard on any lane past it, and remembered as one");
  ship.hull = hullMaxOf(ship) * 0.62;
  captain.holder = "aria";
  ok(shouldBreakOff(ship) === null, "hull at 62% and one drone drifting: she keeps working (the 0.3.88 rule holds)");
  for (let i = 1; i <= 4; i++) contacts.push(raider(i, 2500, 320));
  const pack = perceive(true);
  ok(pack.threat.band === "outgunned" && pack.threat.eta < 15, `four more closing at 320 u/s: ${pack.threat.band}, ${Math.round(pack.threat.eta)} s out`);
  const yard = shouldBreakOff(ship);
  ok(yard && bestRepairPort(ship)?.id === yard.id, `the same 62% hull now breaks off for ${yard?.name} — outgunned lifts the line to ${breakLine((ship.charge ?? 0) / 1e9 + 1, pack.threat.level).toFixed(2)}`);
  ok(ariaMind.scene.label === "outgunned" && /outgunned/.test(ariaMind.scene.line), `the Core says so: "${ariaMind.scene.line}"`);
  const pk = explanationPacket();
  ok(pk.v === 2 && pk.scene?.threat?.n === 5 && pk.wake?.line && pk.calibration && !("start" in pk), "the explanation packet carries the scene, the wake and the calibration, and still no actuators");
  captain.holder = "player";
  contacts.length = 0;
  const gone = perceive(true);
  ok(gone.threat.level === 0 && gone.hazards.length >= 1, "they are gone from the scope but the place is still marked");
  sim.time += 3000;
  ok(perceive(true).hazards.filter((h) => h.name === "Test raider").length === 0, "and the mark fades");
  ship.hull = hullMaxOf(ship);
}

/* ---- the wake is saved with the mind, per captain ---------------------------------- */
{
  const trades = FP.footprintReport().totals.trades;
  ok(trades >= 2, `(${trades} trades in the ledger)`);
  saveAria();
  FP.resetFootprint();
  ok(loadAria() !== false && FP.footprintReport().totals.trades === trades, "save, wipe, load: the wake is back");
  const call = sim.callsign; sim.callsign = "SomeoneElse";
  loadAria();
  ok(FP.footprintReport().totals.trades === 0, "another captain in the same sky has none of it");
  sim.callsign = call; loadAria();
  ok(FP.footprintReport().totals.trades === trades && typeof ariaWatchReport().wake === "string", "and the first captain's is intact");
}

/* ---- she takes the conn and looks ----------------------------------------------------- */
{
  contacts.length = 0; forgetSenses(); ariaMind.scene = null;
  ship.dockedAt = null; ship.hold = {}; ship.hull = hullMaxOf(ship);
  const r = ariaTakeConn();
  ok(r.ok, "ARIA takes the conn");
  for (let i = 0; i < 6 * 60; i++) tickSim(1 / 60);
  ok(ariaMind.scene && ariaFlying() && ariaMind.decision, `six seconds in she has a scene ("${ariaMind.scene?.line}") and a decision (${ariaMind.decision?.action})`);
  ok(ariaMind.forecast == null || typeof ariaMind.forecast.p === "number", "a started job carries a forecast");
  ariaRelease();
  ok(!ariaFlying(), "released: she is not flying");
}

console.log(`aria15: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
