import { runLines, stockOf, stockMultAt, lotMult, targetFor, bidPrice, askPrice, LINES, GLUT_FRAC, SHORT_FRAC } from "../economy/economy.js";
import { goodName } from "../economy/materials.js";

export const FORESEE = { ticks: 4, glutCost: 0.5, needGain: 0.5 };

export function ghost(st) {
  return {
    id: st.id, name: st.name, sector: st.sector, radius: st.radius,
    credits: st.credits ?? 0,
    stock: (st.stock ?? []).map((l) => ({ ...l })),
    econ: st.econ ? JSON.parse(JSON.stringify(st.econ)) : undefined,
  };
}

function bump(g, id, dq) {
  const line = g.stock.find((x) => x.id === id);
  if (line) line.qty = Math.max(0, line.qty + dq);
  else if (dq > 0) g.stock.push({ id, qty: dq });
}

const stalledOn = (st, id) => Boolean(st.econ?.lines?.some((l) => !l.running && l.stalledOn === id));
const feeds = (st, id) => (LINES[st.sector] ?? []).some((L) => L.in[id]);

export function foreseeSale(st, lots, price = bidPrice) {
  const out = { lots: [], revenue: 0, flat: 0, slipLost: 0, paid: 0, short: false, gluts: [], relieves: [] };
  for (const { id, qty } of lots) {
    if (!(qty > 0)) continue;
    const q0 = stockOf(st, id), T = Math.max(1, targetFor(st, id));
    const m0 = stockMultAt(st, id, q0), m1 = stockMultAt(st, id, q0 + qty), avg = lotMult(st, id, qty, +1);
    const unit = price(st, id, qty), first = price(st, id, 1);
    const revenue = unit * qty, flat = first * qty;
    const glut = q0 + qty > T * GLUT_FRAC;
    const need = q0 < T * SHORT_FRAC || stalledOn(st, id);
    out.lots.push({ id, name: goodName(id), qty, m0, m1, slip: m0 > 0 ? 1 - avg / m0 : 0, unit, first, revenue, fill0: q0 / T, fill1: (q0 + qty) / T, glut, need, feeds: feeds(st, id) });
    out.revenue += revenue; out.flat += flat;
    if (glut) out.gluts.push(id);
    if (need) out.relieves.push(id);
  }
  out.slipLost = Math.max(0, out.flat - out.revenue);
  out.paid = Math.min(out.revenue, Math.max(0, st.credits ?? 0));
  out.short = out.paid < out.revenue - 0.5;
  return out;
}

export function foreseeBuy(st, id, qty, price = askPrice) {
  const q0 = stockOf(st, id), T = Math.max(1, targetFor(st, id));
  const take = Math.max(0, Math.min(qty, q0));
  const m0 = stockMultAt(st, id, q0), m1 = stockMultAt(st, id, q0 - take);
  const unit = price(st, id, take), first = price(st, id, 1);
  return { id, name: goodName(id), qty: take, m0, m1, climb: m0 > 0 ? m1 / m0 - 1 : 0, unit, first, cost: unit * take, slipLost: Math.max(0, (unit - first) * take), leavesShort: q0 - take < T * SHORT_FRAC && q0 >= T * SHORT_FRAC, starves: feeds(st, id) && q0 - take < T * SHORT_FRAC };
}

export function counterfactual(st, delta = {}, ticks = FORESEE.ticks) {
  const A = ghost(st), B = ghost(st);
  for (const [id, q] of Object.entries(delta.deliver ?? {})) bump(B, id, +q);
  for (const [id, q] of Object.entries(delta.lift ?? {})) bump(B, id, -q);
  const touched = new Set([...Object.keys(delta.deliver ?? {}), ...Object.keys(delta.lift ?? {})]);
  for (let i = 0; i < ticks; i++) { runLines(A); runLines(B); }
  const restarted = [], stalled = [];
  const la = A.econ.lines, lb = B.econ.lines;
  for (let i = 0; i < la.length; i++) {
    if (lb[i].running && !la[i].running) restarted.push({ id: lb[i].id, name: lb[i].name, on: la[i].stalledOn });
    if (!lb[i].running && la[i].running) stalled.push({ id: lb[i].id, name: lb[i].name, on: lb[i].stalledOn });
  }
  const extra = {};
  for (const id of new Set([...Object.keys(A.econ.made ?? {}), ...Object.keys(B.econ.made ?? {})])) {
    const d = (B.econ.made[id] ?? 0) - (A.econ.made[id] ?? 0);
    if (Math.abs(d) > 0.05) extra[id] = d;
  }
  for (const id of Object.keys(extra)) touched.add(id);
  const prices = [...touched].map((id) => ({ id, name: goodName(id), without: stockMultAt(st, id, stockOf(A, id)), with: stockMultAt(st, id, stockOf(B, id)) }));
  return { ticks, restarted, stalled, extra, prices, credits: (B.credits ?? 0) - (A.credits ?? 0) };
}

export function sellValue(st, hold, { price = bidPrice, steward = 0 } = {}) {
  const lots = Object.entries(hold).filter(([, q]) => q > 0.01).map(([id, qty]) => ({ id, qty }));
  if (!lots.length) return { value: 0, revenue: 0, slipLost: 0, gluts: [], relieves: [] };
  const f = foreseeSale(st, lots, price);
  let lean = 0;
  if (steward > 0) for (const l of f.lots) {
    if (l.glut) lean -= l.revenue * FORESEE.glutCost * steward;
    else if (l.need) lean += l.revenue * FORESEE.needGain * steward;
  }
  return { value: Math.max(0, f.paid + lean), revenue: f.revenue, paid: f.paid, slipLost: f.slipLost, gluts: f.gluts, relieves: f.relieves, short: f.short };
}

export function saleLine(f) {
  if (!f?.lots?.length) return "nothing to sell";
  const worst = [...f.lots].sort((a, b) => b.slip - a.slip)[0];
  const bits = [`${Math.round(f.revenue).toLocaleString("en-US")} cr`];
  if (f.slipLost > 1) bits.push(`${Math.round(f.slipLost).toLocaleString("en-US")} cr lost to her own selling (${worst.name} −${Math.round(worst.slip * 100)}%)`);
  if (f.gluts.length) bits.push(`leaves ${f.gluts.map(goodName).join(", ")} glutted`);
  if (f.relieves.length) bits.push(`${f.relieves.map(goodName).join(", ")} was wanted`);
  if (f.short) bits.push("the port cannot pay for all of it");
  return bits.join(" · ");
}
