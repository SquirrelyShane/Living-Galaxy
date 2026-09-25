/* LIVING GALAXY — the ledger: a working economy under the ports.
 *
 * Before this, a port's stock was a list rolled at launch that only the
 * player ever touched, and a price was a sector multiplier on a book value.
 * Now every port is a going concern:
 *
 *   LINES     each sector runs production lines that eat inputs and make
 *             outputs every ECON_TICK — a foundry turns ore into steel and
 *             plate, a grow ring turns phosphorus and water into rations, a
 *             habitat consumes rations and water and makes little but
 *             credits. A line with an empty input stalls, and a stalled line
 *             is a SHORTAGE the port will pay over the odds to fix.
 *   STOCK     the same st.stock list the market tab shows, now moved by
 *             everyone: the lines, the flow boats (npc/flow.js — an inbound
 *             copper boat that docks adds its copper; an outbound plate boat
 *             that leaves takes its plate), the traffic captains running real
 *             cargo between real ports (npc/traffic.js), and you.
 *   PRICES    a curve on stock against the port's TARGET for that good: bare
 *             shelves pay up to 1.7× book and charge the same; a glut pays
 *             0.6×. Sell a hold of copper ore into a foundry and watch the
 *             price you got fall behind you.
 *   TREASURY  st.credits: what the port can pay you with. Lines earn it,
 *             buying from you spends it, and it recovers on its own slowly.
 *
 * Pure data with a tick; nothing here touches three.js or the DOM. The
 * lines and targets are deterministic per port; the stock is live and local
 * (world sync does not carry it — every client's markets drift alone, which
 * is fine: prices are a thing you fly to find out).
 */

import { SECTORS, priceAt, baseValue, goodName, good } from "./materials.js";

export const ECON_TICK = 20;          // sim seconds between production passes
/* 0.3.24 — the band was 0.6 … 1.7, which is a 2.83× swing between a glutted
 * source and a bare buyer BEFORE the sector spread (another 1.3–1.6×) is
 * applied on top. That is where a doubling per hop came from: buy at the
 * floor, sell at the ceiling, fly the same two ports forever. Narrowed to
 * 0.72 … 1.45 (a 2.01× swing), which still makes a shortage worth flying to
 * and a glut worth avoiding without making a round trip print money.
 *
 * Contracts are unaffected: a delivery pays `max(bid, book)` plus a premium,
 * so the floor under contract work is the book price and narrowing the band
 * moves route profit down without moving job pay with it. */
/* 0.3.47 — narrowed again, 0.72…1.45 → 0.8…1.3 (a 1.63× swing). The trade
 * bench still found a motor bought at an industrial yard for 579 and sold at a
 * garrison for 996 — 1.7× in five minutes, 2,800 cr/min, with nothing made
 * and nothing mined. A shortage is still worth flying to; a round trip is a
 * living, not a fortune. */
export const PRICE_FLOOR = 0.8;       // glut: what a port pays / charges at the bottom of the curve, × book
export const PRICE_CEIL = 1.3;        // shortage: the top of the curve
export const SHORT_FRAC = 0.25;       // stock under this fraction of target is a shortage
export const GLUT_FRAC = 2.2;         // stock over this multiple of target is a glut
const CURVE_K = Math.log(1 / PRICE_FLOOR) / Math.log(GLUT_FRAC + 0.18);

/* Production lines by sector: what a pass eats and makes (units per tick at tier I; tier scales it).
 * Inputs are the sector's buys, outputs its sells — the trade map already told us who needs what. */
export const LINES = {
  industrial: [
    { id: "smelter",   name: "Smelter",        in: { iron_ore: 6, carbonaceous: 1 },                 out: { steel: 7 } },
    { id: "alloy",     name: "Alloy works",    in: { steel: 2, chromite: 1, nickel_ore: 1 },         out: { stainless: 1.5 } },
    { id: "rolling",   name: "Rolling mill",   in: { steel: 3 },                                     out: { steel_plate: 0.8, girder: 0.6 } },
    { id: "motors",    name: "Motor shop",     in: { copper_ore: 3, steel: 1 },                      out: { motor: 0.4, wiring: 1.2 } },
    { id: "kiln",      name: "Ceramic kiln",   in: { silicate: 3, bauxite: 1 },                      out: { ceramic: 1.2 } },
    { id: "titan",     name: "Titanium cell",  in: { ilmenite: 2 },                                  out: { titanium: 0.6 } },
  ],
  agricultural: [
    { id: "vats",      name: "Protein vats",   in: { water: 3, phosphorus: 1, nitrogen: 1 },         out: { organics: 3 } },
    { id: "packing",   name: "Packing line",   in: { organics: 2, water: 1 },                        out: { ration: 4 } },
    { id: "fixer",     name: "Nitrogen fixer", in: { nitrogen: 2, phosphorus: 1 },                   out: { fertiliser: 1.5 } },
  ],
  civilian: [
    { id: "habitat",   name: "Habitat draw",   in: { ration: 1.5, water: 1.5 },                      out: {}, credits: 220 },
    { id: "clinic",    name: "Clinic",         in: { medkit: 0.2, organics: 0.3 },                   out: {}, credits: 90 },
    { id: "glassworks",name: "Glassworks",     in: { silicon: 1 },                                   out: { glass: 0.5, polymer: 0.3 } },
  ],
  military: [
    { id: "mess",      name: "Garrison mess",  in: { ration: 1.2, water: 0.8 },                      out: {}, credits: 120 },
    { id: "arsenal",   name: "Arsenal",        in: { steel: 2, lead: 1 },                            out: { ammo_case: 1 } },
    { id: "armoury",   name: "Armour press",   in: { stainless: 1, titanium: 0.5 },                  out: { armour_plate: 0.4 } },
    { id: "coils",     name: "Coil shop",      in: { superalloy: 0.5, rare_earths: 0.5 },            out: { shield_coil: 0.2 } },
  ],
  logistic: [
    { id: "bonded",    name: "Bonded stores",  in: {},                                               out: { hydrogen_r: 2, water: 2 }, credits: 140 },
    { id: "crossdock", name: "Cross-dock",     in: { steel_plate: 0.5, girder: 0.5 },                out: {}, credits: 160 },
  ],
  pirate: [
    { id: "fence",     name: "The fence",      in: {},                                               out: { ammo_case: 0.4, platinum: 0.15 }, credits: 60 },
  ],
};

/** The port's size as a multiplier on line rates and stock targets. */
export function tierOf(st) {
  const r = st.radius ?? 100;
  return r < 30 ? 1 : r < 60 ? 1.6 : 2.4;
}

/** What the port would like to hold of a good: its outputs and inputs deep, everything else shallow. */
export function targetFor(st, id) {
  const s = SECTORS[st.sector];
  const k = tierOf(st);
  if (!s) return 60 * k;
  if (s.sells[id]) return 220 * k;
  if (s.buys[id]) return 160 * k;
  const lines = LINES[st.sector] ?? [];
  if (lines.some((l) => l.in[id])) return 140 * k;
  if (lines.some((l) => l.out[id])) return 200 * k;
  return 50 * k;
}

export function stockOf(st, id) {
  return st.stock?.find((x) => x.id === id)?.qty ?? 0;
}

/** The curve itself, at an arbitrary quantity — the thing a lot is integrated over. */
export function stockMultAt(st, id, q) {
  const target = Math.max(1, targetFor(st, id));
  /* 0.3.47: the exponent was 0.45, which hit the 0.72 floor at 2× target —
   * a glut past that point moved nothing, and a port sitting on four times
   * what it wanted priced it the same as one on twice. The exponent is now
   * whatever lands the curve on the floor where GLUT_FRAC says a glut starts,
   * so the band and the curve cannot disagree again. */
  const m = Math.pow(target / (Math.max(0, q) + 0.18 * target), CURVE_K);
  return Math.max(PRICE_FLOOR, Math.min(PRICE_CEIL, m));
}

/** Price curve on stock: bare shelves → PRICE_CEIL, target → about book, glut → PRICE_FLOOR. */
export function stockMult(st, id) {
  return stockMultAt(st, id, stockOf(st, id));
}

/**
 * 0.3.24 — the price of a LOT, not of a unit.
 *
 * Every trade in the game used to move the whole consignment at ONE price: the
 * marginal price for a single unit, applied a hundred and sixty times. So a
 * hold of girders emptied into a port that wanted forty of them still fetched
 * bare-shelf money on the hundred and sixtieth, and the shelf you had just
 * filled did not find out until the next tick. Stacked on top of a glutted
 * source that floored at PRICE_FLOOR, that is where the 2.3× round trips came
 * from — buy at 0.6× book, sell at 1.7×, repeat forever on the same two ports.
 *
 * A lot now walks the curve as it lands. `dir` is +1 when the port's stock
 * RISES (you are selling to it) and −1 when it falls (you are buying). The
 * return is the AVERAGE multiplier across the fill, integrated by trapezoid in
 * a few steps — cheap, and close enough that the estimate and the transaction
 * agree, which matters more than the third decimal.
 *
 * It is not a penalty on trading. It is the reason to find a second buyer.
 */
export function lotMult(st, id, qty, dir = 1) {
  const n = Math.max(0, qty ?? 0);
  if (n <= 1) return stockMult(st, id);
  const q0 = Math.max(0, stockOf(st, id));
  const steps = 8;
  let sum = 0;
  for (let i = 0; i <= steps; i++) {
    const q = Math.max(0, q0 + dir * n * (i / steps));
    sum += stockMultAt(st, id, q) * (i === 0 || i === steps ? 0.5 : 1);
  }
  return sum / steps;
}

/** What the port charges for a good, live. `qty` prices the whole lot (see lotMult). */
export function askPrice(st, id, qty = 1) {
  return Math.max(1, Math.round(priceAt(st.sector, id, "sell") * lotMult(st, id, qty, -1)));
}
/** What the port pays for a good, live. `qty` prices the whole lot. */
export function bidPrice(st, id, qty = 1) {
  return Math.max(1, Math.round(priceAt(st.sector, id, "buy") * lotMult(st, id, qty, +1)));
}

/** Raw stock move, no ledger: returns the actual change (a take never goes below zero). */
function adjust(st, id, dq) {
  if (!st?.stock || !dq) return 0;
  const line = st.stock.find((x) => x.id === id);
  if (dq > 0) {
    if (line) line.qty += dq;
    else st.stock.push({ id, qty: dq, sell: priceAt(st.sector, id, "sell") });
    return dq;
  }
  if (!line) return 0;
  const take = Math.min(line.qty, -dq);
  line.qty -= take;
  return -take;
}

/** A boat or a captain adds stock to a port. Returns the new quantity. */
export function deliver(st, id, qty) {
  if (!(qty > 0)) return stockOf(st, id);
  const got = adjust(st, id, qty);
  if (got) { const e = ledgerOf(st); e.flow.in[id] = (e.flow.in[id] ?? 0) + got; e.moved += got; }
  return stockOf(st, id);
}

/** A boat or a captain takes stock from a port. Returns what was actually taken. */
export function lift(st, id, qty) {
  if (!(qty > 0)) return 0;
  const take = -adjust(st, id, -qty);
  if (take) { const e = ledgerOf(st); e.flow.out[id] = (e.flow.out[id] ?? 0) + take; e.moved += take; }
  return take;
}

/** The port's running ledger (created on first touch). */
export function ledgerOf(st) {
  if (!st.econ) {
    st.econ = {
      acc: 0, ticks: 0, moved: 0,
      flow: { in: {}, out: {} },         // totals moved by boats and captains
      made: {}, used: {},                // totals by the lines
      trend: {},                         // stock delta over the last pass, by good
      lines: (LINES[st.sector] ?? []).map((l) => ({ id: l.id, name: l.name, running: false, stalledOn: null, passes: 0 })),
      earned: 0,
    };
    /* opening stock for the lines: a working port does not start with bare bins — half a target of each input */
    for (const L of LINES[st.sector] ?? []) for (const id of Object.keys(L.in)) {
      if (!st.stock?.some((l) => l.id === id)) adjust(st, id, Math.round(targetFor(st, id) * 0.5));
    }
  }
  return st.econ;
}

/** One production pass for a port. */
export function runLines(st) {
  const e = ledgerOf(st);
  const k = tierOf(st);
  const before = {};
  for (const l of st.stock ?? []) before[l.id] = l.qty;
  const lines = LINES[st.sector] ?? [];
  lines.forEach((L, i) => {
    const rec = e.lines[i];
    /* the pass runs at the fraction the scarcest input allows, down to a quarter; under that it stalls */
    let frac = 1, short = null;
    for (const [id, need] of Object.entries(L.in)) {
      const have = stockOf(st, id) / (need * k);
      if (have < frac) { frac = have; short = id; }
    }
    if (frac < 0.25) { rec.running = false; rec.stalledOn = short; return; }
    frac = Math.min(1, frac);
    /* a glut of the output throttles the line: nobody makes plate onto a full floor */
    for (const [id] of Object.entries(L.out)) {
      const fill = stockOf(st, id) / targetFor(st, id);
      if (fill > GLUT_FRAC) frac *= 0.25;
    }
    for (const [id, need] of Object.entries(L.in)) { const q = -adjust(st, id, -need * k * frac); e.used[id] = (e.used[id] ?? 0) + q; }
    for (const [id, make] of Object.entries(L.out)) { const q = adjust(st, id, make * k * frac); e.made[id] = (e.made[id] ?? 0) + q; }
    if (L.credits) { const c = L.credits * k * frac; st.credits = (st.credits ?? 0) + c; e.earned += c; }
    rec.running = true; rec.stalledOn = null; rec.passes++;
  });
  /* re-export: anything well over target that the port did not make itself is sold on, a little each pass —
   * a foundry with a floor full of medkits does not keep them, it moves them */
  const makes = new Set(lines.flatMap((L) => Object.keys(L.out)));
  for (const l of st.stock ?? []) {
    const T = targetFor(st, l.id);
    if (l.qty > T * 1.2 && !makes.has(l.id)) { const q = (l.qty - T * 1.2) * 0.04; l.qty -= q; st.credits = (st.credits ?? 0) + q * baseValue(l.id) * 0.15; e.reexport = (e.reexport ?? 0) + q; }
  }
  /* the treasury recovers on its own, slowly, toward what a port of this size keeps on hand */
  const keep = 30000 * k;
  if ((st.credits ?? 0) < keep) st.credits = Math.min(keep, (st.credits ?? 0) + 120 * k);
  else if (st.credits > keep * 5) st.credits = keep * 5;      // the charter sweeps the surplus
  for (const l of st.stock ?? []) e.trend[l.id] = l.qty - (before[l.id] ?? 0);
  for (const id of Object.keys(before)) if (!st.stock.some((l) => l.id === id)) e.trend[id] = -before[id];
  e.ticks++;
}

/** Advance every port's ledger. Cheap: a pass every ECON_TICK per port, arithmetic only. */
export function stepEconomy(dt, stations) {
  for (const st of stations) {
    if (!st.stock) continue;
    const e = ledgerOf(st);
    e.acc += dt;
    let n = 0;
    while (e.acc >= ECON_TICK && n++ < 4) { e.acc -= ECON_TICK; runLines(st); }   // catches up after a time-warp, never more than four passes a step
    if (e.acc >= ECON_TICK) e.acc = 0;
  }
}

/** Shortages and gluts, most pressing first: { id, name, qty, target, mult, pays } */
export function shortagesOf(st) {
  const out = [];
  const seen = new Set();
  const consider = (id) => {
    if (seen.has(id)) return;
    seen.add(id);
    const target = targetFor(st, id), qty = stockOf(st, id);
    if (qty < target * SHORT_FRAC) out.push({ id, name: goodName(id), qty, target, mult: stockMult(st, id), pays: bidPrice(st, id) });
  };
  for (const id of Object.keys(SECTORS[st.sector]?.buys ?? {})) consider(id);
  for (const L of LINES[st.sector] ?? []) for (const id of Object.keys(L.in)) consider(id);
  return out.sort((a, b) => b.mult - a.mult);
}

export function glutsOf(st) {
  return (st.stock ?? [])
    .filter((l) => l.qty > targetFor(st, l.id) * GLUT_FRAC)
    .map((l) => ({ id: l.id, name: goodName(l.id), qty: l.qty, target: targetFor(st, l.id), mult: stockMult(st, l.id), asks: askPrice(st, l.id) }))
    .sort((a, b) => a.mult - b.mult);
}

/** The three goods a port most wants right now, by how far over book it pays. */
export function wantsOf(st, n = 3) {
  const ids = new Set([...Object.keys(SECTORS[st.sector]?.buys ?? {}), ...(LINES[st.sector] ?? []).flatMap((L) => Object.keys(L.in))]);
  return [...ids]
    .map((id) => ({ id, name: goodName(id), pays: bidPrice(st, id), mult: stockMult(st, id), over: bidPrice(st, id) / Math.max(1, baseValue(id)) }))
    .sort((a, b) => b.over - a.over)
    .slice(0, n);
}

/** A good for a boat to carry: inbound boats bring what the port's lines eat, outbound boats take what it makes. */
export function cargoFor(st, inbound, rnd) {
  const s = SECTORS[st.sector] ?? {};
  const lines = LINES[st.sector] ?? [];
  const pool = inbound
    ? [...new Set([...Object.keys(s.buys ?? {}), ...lines.flatMap((L) => Object.keys(L.in))])]
    : [...new Set([...Object.keys(s.sells ?? {}), ...lines.flatMap((L) => Object.keys(L.out))])];
  if (!pool.length) return null;
  return pool[Math.floor(rnd() * pool.length)];
}

/** What to actually load at A for B, off the floor as it stands: the good B eats that A holds the most of
 * (over half a target), or null if A has nothing B wants. */
export function pickCargoAt(A, B) {
  const need = new Set([...Object.keys(SECTORS[B.sector]?.buys ?? {}), ...(LINES[B.sector] ?? []).flatMap((L) => Object.keys(L.in))]);
  let best = null, bestFill = 0.5;
  for (const l of A.stock ?? []) {
    if (!need.has(l.id)) continue;
    const fill = l.qty / Math.max(1, targetFor(A, l.id));
    if (fill > bestFill) { bestFill = fill; best = l.id; }
  }
  return best;
}

/** A cargo for a captain's leg from port A to port B: something A makes that B eats, else something A makes. */
export function legCargo(A, B, rnd) {
  const out = new Set([...Object.keys(SECTORS[A.sector]?.sells ?? {}), ...(LINES[A.sector] ?? []).flatMap((L) => Object.keys(L.out))]);
  const need = new Set([...Object.keys(SECTORS[B.sector]?.buys ?? {}), ...(LINES[B.sector] ?? []).flatMap((L) => Object.keys(L.in))]);
  const both = [...out].filter((id) => need.has(id));
  const pool = both.length ? both : [...out];
  if (!pool.length) return null;
  return pool[Math.floor(rnd() * pool.length)];
}

/** The port's ledger for a screen: lines, shortages, gluts, treasury, throughput. */
export function econReport(st) {
  const e = ledgerOf(st);
  return {
    tier: tierOf(st),
    credits: Math.round(st.credits ?? 0),
    lines: e.lines.map((l) => ({ ...l, stalledName: l.stalledOn ? goodName(l.stalledOn) : null })),
    shortages: shortagesOf(st),
    gluts: glutsOf(st),
    moved: Math.round(e.moved),
    earned: Math.round(e.earned),
    ticks: e.ticks,
    stock: (st.stock ?? []).map((l) => ({ id: l.id, name: goodName(l.id), qty: Math.round(l.qty), target: targetFor(st, l.id), fill: l.qty / Math.max(1, targetFor(st, l.id)), trend: e.trend[l.id] ?? 0, ask: askPrice(st, l.id), bid: bidPrice(st, l.id), mass: good(l.id)?.mass ?? 1 })),
  };
}
