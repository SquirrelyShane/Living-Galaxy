import { SECTORS, priceAt, baseValue, goodName, good } from "./materials.js";

export const ECON_TICK = 20;
export const PRICE_FLOOR = 0.8;
export const PRICE_CEIL = 1.3;
export const SHORT_FRAC = 0.25;
export const GLUT_FRAC = 2.2;
const CURVE_K = Math.log(1 / PRICE_FLOOR) / Math.log(GLUT_FRAC + 0.18);

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

export function tierOf(st) {
  const r = st.radius ?? 100;
  return r < 30 ? 1 : r < 60 ? 1.6 : 2.4;
}

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

export function stockMultAt(st, id, q) {
  const target = Math.max(1, targetFor(st, id));
  const m = Math.pow(target / (Math.max(0, q) + 0.18 * target), CURVE_K);
  return Math.max(PRICE_FLOOR, Math.min(PRICE_CEIL, m));
}

export function stockMult(st, id) {
  return stockMultAt(st, id, stockOf(st, id));
}

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

export function askPrice(st, id, qty = 1) {
  return Math.max(1, Math.round(priceAt(st.sector, id, "sell") * lotMult(st, id, qty, -1)));
}
export function bidPrice(st, id, qty = 1) {
  return Math.max(1, Math.round(priceAt(st.sector, id, "buy") * lotMult(st, id, qty, +1)));
}

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

export function deliver(st, id, qty) {
  if (!(qty > 0)) return stockOf(st, id);
  const got = adjust(st, id, qty);
  if (got) { const e = ledgerOf(st); e.flow.in[id] = (e.flow.in[id] ?? 0) + got; e.moved += got; }
  return stockOf(st, id);
}

export function lift(st, id, qty) {
  if (!(qty > 0)) return 0;
  const take = -adjust(st, id, -qty);
  if (take) { const e = ledgerOf(st); e.flow.out[id] = (e.flow.out[id] ?? 0) + take; e.moved += take; }
  return take;
}

export function ledgerOf(st) {
  if (!st.econ) {
    st.econ = {
      acc: 0, ticks: 0, moved: 0,
      flow: { in: {}, out: {} },
      made: {}, used: {},
      trend: {},
      lines: (LINES[st.sector] ?? []).map((l) => ({ id: l.id, name: l.name, running: false, stalledOn: null, passes: 0 })),
      earned: 0,
    };
    for (const L of LINES[st.sector] ?? []) for (const id of Object.keys(L.in)) {
      if (!st.stock?.some((l) => l.id === id)) adjust(st, id, Math.round(targetFor(st, id) * 0.5));
    }
  }
  return st.econ;
}

export const econHooks = { labour: null };

export function runLines(st) {
  const e = ledgerOf(st);
  const k = tierOf(st) * (econHooks.labour?.(st.id) ?? 1);
  const before = {};
  for (const l of st.stock ?? []) before[l.id] = l.qty;
  const lines = LINES[st.sector] ?? [];
  lines.forEach((L, i) => {
    const rec = e.lines[i];
    let frac = 1, short = null;
    for (const [id, need] of Object.entries(L.in)) {
      const have = stockOf(st, id) / (need * k);
      if (have < frac) { frac = have; short = id; }
    }
    if (frac < 0.25) { rec.running = false; rec.stalledOn = short; return; }
    frac = Math.min(1, frac);
    for (const [id] of Object.entries(L.out)) {
      const fill = stockOf(st, id) / targetFor(st, id);
      if (fill > GLUT_FRAC) frac *= 0.25;
    }
    for (const [id, need] of Object.entries(L.in)) { const q = -adjust(st, id, -need * k * frac); e.used[id] = (e.used[id] ?? 0) + q; }
    for (const [id, make] of Object.entries(L.out)) { const q = adjust(st, id, make * k * frac); e.made[id] = (e.made[id] ?? 0) + q; }
    if (L.credits) { const c = L.credits * k * frac; st.credits = (st.credits ?? 0) + c; e.earned += c; }
    rec.running = true; rec.stalledOn = null; rec.passes++;
  });
  const makes = new Set(lines.flatMap((L) => Object.keys(L.out)));
  for (const l of st.stock ?? []) {
    const T = targetFor(st, l.id);
    if (l.qty > T * 1.2 && !makes.has(l.id)) { const q = (l.qty - T * 1.2) * 0.04; l.qty -= q; st.credits = (st.credits ?? 0) + q * baseValue(l.id) * 0.15; e.reexport = (e.reexport ?? 0) + q; }
  }
  const keep = 30000 * k;
  if ((st.credits ?? 0) < keep) st.credits = Math.min(keep, (st.credits ?? 0) + 120 * k);
  else if (st.credits > keep * 5) st.credits = keep * 5;
  for (const l of st.stock ?? []) e.trend[l.id] = l.qty - (before[l.id] ?? 0);
  for (const id of Object.keys(before)) if (!st.stock.some((l) => l.id === id)) e.trend[id] = -before[id];
  e.ticks++;
}

export function stepEconomy(dt, stations) {
  for (const st of stations) {
    if (!st.stock) continue;
    const e = ledgerOf(st);
    e.acc += dt;
    let n = 0;
    while (e.acc >= ECON_TICK && n++ < 4) { e.acc -= ECON_TICK; runLines(st); }
    if (e.acc >= ECON_TICK) e.acc = 0;
  }
}

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

export function wantsOf(st, n = 3) {
  const ids = new Set([...Object.keys(SECTORS[st.sector]?.buys ?? {}), ...(LINES[st.sector] ?? []).flatMap((L) => Object.keys(L.in))]);
  return [...ids]
    .map((id) => ({ id, name: goodName(id), pays: bidPrice(st, id), mult: stockMult(st, id), over: bidPrice(st, id) / Math.max(1, baseValue(id)) }))
    .sort((a, b) => b.over - a.over)
    .slice(0, n);
}

export function cargoFor(st, inbound, rnd) {
  const s = SECTORS[st.sector] ?? {};
  const lines = LINES[st.sector] ?? [];
  const pool = inbound
    ? [...new Set([...Object.keys(s.buys ?? {}), ...lines.flatMap((L) => Object.keys(L.in))])]
    : [...new Set([...Object.keys(s.sells ?? {}), ...lines.flatMap((L) => Object.keys(L.out))])];
  if (!pool.length) return null;
  return pool[Math.floor(rnd() * pool.length)];
}

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

export function legCargo(A, B, rnd) {
  const out = new Set([...Object.keys(SECTORS[A.sector]?.sells ?? {}), ...(LINES[A.sector] ?? []).flatMap((L) => Object.keys(L.out))]);
  const need = new Set([...Object.keys(SECTORS[B.sector]?.buys ?? {}), ...(LINES[B.sector] ?? []).flatMap((L) => Object.keys(L.in))]);
  const both = [...out].filter((id) => need.has(id));
  const pool = both.length ? both : [...out];
  if (!pool.length) return null;
  return pool[Math.floor(rnd() * pool.length)];
}

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
