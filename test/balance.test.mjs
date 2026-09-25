/* LIVING GALAXY — 0.3.47: what things cost, and what work pays.
 *
 *   node --import ./test/three-register.mjs test/balance.test.mjs
 *
 * The value table is the rule (materials.js VALUE_RULE), a deeper part is
 * worth more over its ore than a shallow one, the desk pays about what its
 * own words promise, and a start purse is a start — not a fleet.
 */

import { sim, launchSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { ALL_GOODS, ORES, VALUE_RULE, baseValue, derivedValue } from "../js/materials.js";
import { fabMargin, recipeFor } from "../js/fabricate.js";
import { boardFor, BOARD, TIERS } from "../js/contracts.js";
import { CHAINS } from "../js/data/chains.js";
import { CHAIN, chainBonus } from "../js/chains.js";
import { bidPrice, stockMultAt, targetFor, PRICE_FLOOR, PRICE_CEIL, GLUT_FRAC } from "../js/economy.js";
import { COMPANY } from "../js/company.js";
import { SHIP_DB } from "../js/shipdb.js";
import { yardQuote } from "../js/shipcost.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

/* ---- 1. the table is the rule ------------------------------------------------ */
{
  const made = ALL_GOODS.filter((g) => g.tier !== "ore");
  const off = made.filter((g) => derivedValue(g.id) !== g.value);
  ok(off.length === 0, `every mineral and part is priced by the rule (${off.map((g) => `${g.id} ${g.value}≠${derivedValue(g.id)}`).join(", ") || "all"})`);
  ok(VALUE_RULE.stage > 1.1 && VALUE_RULE.stage < 1.3 && VALUE_RULE.refine >= 1.2, `a stage adds ${Math.round((VALUE_RULE.stage - 1) * 100)}%, refining ${Math.round((VALUE_RULE.refine - 1) * 100)}%`);
  ok(ORES.find((o) => o.id === "iron_ore").value === 4, "ore is the unit — untouched");
}

/* ---- 2. deeper is worth more ------------------------------------------------- */
{
  const depthOf = (id, d = 0) => { const r = recipeFor(id); if (!r) return d; return Math.max(...Object.keys(r.from).map((k) => depthOf(k, d + 1))); };
  const parts = ALL_GOODS.filter((g) => g.tier === "component");
  const byDepth = new Map();
  for (const g of parts) { const d = depthOf(g.id); if (!byDepth.has(d)) byDepth.set(d, []); byDepth.get(d).push(fabMargin(g.id).ratio); }
  const ds = [...byDepth.keys()].sort((a, b) => a - b);
  const meds = ds.map((d) => median(byDepth.get(d)));
  ok(meds.every((m, i) => i === 0 || m >= meds[i - 1] - 0.02), `the multiple over raw ore climbs with depth (${ds.map((d, i) => `d${d} ${meds[i].toFixed(2)}×`).join(", ")})`);
  const all = parts.map((g) => ({ id: g.id, r: fabMargin(g.id).ratio }));
  const lo = all.reduce((a, b) => (b.r < a.r ? b : a)), hi = all.reduce((a, b) => (b.r > a.r ? b : a));
  ok(lo.r >= 1.3, `nothing is barely worth its rock (lowest ${lo.id} ${lo.r.toFixed(2)}×; the gyroscope was 1.25×)`);
  ok(hi.r <= 3.6, `and nothing prints money (highest ${hi.id} ${hi.r.toFixed(2)}×; the heat exchanger was 6.49×)`);
  const gyro = fabMargin("gyro").ratio, hx = fabMargin("heat_ex").ratio;
  ok(gyro > hx, `a gyroscope is worth more over its ore than a heat exchanger (${gyro.toFixed(2)}× vs ${hx.toFixed(2)}×)`);
  ok(baseValue("shield_coil") > baseValue("capacitor") * 2 + baseValue("superalloy"), "a part is always worth more than what went into it");
}

/* ---- 3. the price curve ------------------------------------------------------ */
{
  const st = { sector: "industrial", radius: 80, stock: [] };
  const T = targetFor(st, "iron_ore");
  const at = (k) => stockMultAt(st, "iron_ore", T * k);
  ok(at(0) === PRICE_CEIL, "bare shelves are the ceiling");
  ok(at(0.5) > at(1) && at(1) > at(2) && at(2) > at(GLUT_FRAC + 0.3), `the curve still falls past twice the target (${[0.5, 1, 2, 2.5].map((k) => at(k).toFixed(2)).join(" > ")})`);
  ok(at(4) === PRICE_FLOOR, "and lands on the floor in a glut");
}

/* ---- 4. the desk pays what it says -------------------------------------------- */
makePilot("Balance", "terran", "mining", null);
launchSim("BalanceTest", "sol");
sim.phase = "play";
const honest = stations.filter((s) => !(s.hostile && !s.claimed) && s.sector !== "pirate");
{
  ok(BOARD.pay === 1, `no hidden multiplier on the posted pay (BOARD.pay ${BOARD.pay}; was 1.7)`);
  ok(TIERS.find((t) => t.key === "high").pay <= 1.8, "a sealed job is worth having, not a jackpot");
  const cut = [], goods = [], freight = [], flat = [];
  const FLAT = new Set(["survey", "chart", "relay", "fieldtrip", "assay", "escort", "patrol", "bounty", "rogues", "wreck", "salvage"]);
  for (const st of honest) for (const o of boardFor(st)) {
    if (o.chain) continue;
    const book = o.good ? o.qty * Math.max(bidPrice(st, o.good), baseValue(o.good)) : 0;
    if (o.type === "mine" && o.qty) cut.push(o.pay / book);
    else if ((o.type === "procure" || o.type === "resupply") && o.qty) goods.push(o.pay / book);
    else if ((o.type === "haul" || o.type === "consign" || o.type === "courier") && o.qty) freight.push(o.pay / (o.qty * baseValue(o.good)));
    else if (FLAT.has(o.type)) flat.push(o.pay);
  }
  const mc = median(cut);
  ok(cut.length > 3 && mc < 1.8 && mc > 1.05, `a mining job pays over the counter, not twice it (median ${mc.toFixed(2)}× the bid; was ~2.3×)`);
  ok(goods.length > 3 && median(goods) < 1.7, `buying for the desk pays the goods and a margin (median ${median(goods).toFixed(2)}× book; a Sealed procure was 3.7×)`);
  ok(freight.length > 3 && median(freight) < 0.35, `freight is a commission on the cargo (median ${(median(freight) * 100).toFixed(0)}% of its value; was 60%+)`);
  const hulls = SHIP_DB.filter((d) => d.tier === "A").map((d) => yardQuote(d, { complexId: "mining", letter: "E" }).total);
  const starter = median(hulls);
  ok(median(flat) < starter * 0.3, `a flying job is a fraction of a starter hull (median ${Math.round(median(flat)).toLocaleString()} cr vs ${Math.round(starter).toLocaleString()} cr)`);
  ok(CHAINS.every((c) => chainBonus(c) === Math.round(c.bonus * CHAIN.bonusK)) && CHAIN.bonusK <= 0.6, `the closing bonus is ${CHAIN.bonusK * 100}% of what data/chains.js authors`);
}

/* ---- 5. passive money --------------------------------------------------------- */
ok(COMPANY.staffShare <= 0.35, `a settled hand books ${Math.round(COMPANY.staffShare * 100)}% of a list wage, not 45%`);

console.log(`balance: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
