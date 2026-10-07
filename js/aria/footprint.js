export const FOOT = { events: 40, pending: 24, auditAfter: 45, auditBy: 240, ports: 64 };

const fresh = () => ({
  v: 1,
  ports: {},
  corps: {},
  work: {},
  totals: { sold: 0, bought: 0, earned: 0, spent: 0, slipLost: 0, trades: 0, glutted: 0, relieved: 0, starved: 0 },
  lines: { forecast: 0, confirmed: 0, missed: 0, stalledForecast: 0, stalledConfirmed: 0 },
  pending: [],
  events: [],
});

export const footprint = fresh();

export function resetFootprint() { Object.assign(footprint, fresh()); }

export function footprintOut() { return JSON.parse(JSON.stringify(footprint)); }

export function footprintIn(saved) {
  resetFootprint();
  if (!saved || saved.v !== 1) return false;
  for (const k of ["ports", "corps", "work"]) if (saved[k] && typeof saved[k] === "object") footprint[k] = saved[k];
  for (const k of ["totals", "lines"]) if (saved[k] && typeof saved[k] === "object") for (const f of Object.keys(footprint[k])) if (Number.isFinite(saved[k][f])) footprint[k][f] = saved[k][f];
  if (Array.isArray(saved.events)) footprint.events = saved.events.slice(0, FOOT.events);
  if (Array.isArray(saved.pending)) footprint.pending = saved.pending.slice(-FOOT.pending);
  return true;
}

function event(at, kind, text) {
  footprint.events.unshift({ at: Math.round(at), kind, text: String(text).slice(0, 200) });
  if (footprint.events.length > FOOT.events) footprint.events.length = FOOT.events;
}

function portOf(id, name) {
  const p = footprint.ports[id] ??= { name, trades: 0, sold: {}, bought: {}, earned: 0, spent: 0, slipLost: 0, glutted: 0, relieved: 0, starved: 0, last: 0 };
  p.name = name ?? p.name;
  const ids = Object.keys(footprint.ports);
  if (ids.length > FOOT.ports) {
    const oldest = ids.filter((k) => k !== id).sort((a, b) => footprint.ports[a].last - footprint.ports[b].last)[0];
    if (oldest) delete footprint.ports[oldest];
  }
  return p;
}

export function noteTrade({ at = 0, port, kind, lots = [], slipLost = 0, standing = null, forecast = null }) {
  if (!port?.id || !lots.length) return null;
  const p = portOf(port.id, port.name);
  const T = footprint.totals;
  const bag = kind === "sell" ? p.sold : p.bought;
  let cr = 0, qty = 0;
  for (const l of lots) {
    const g = bag[l.id] ??= { name: l.name, qty: 0, cr: 0, m0: l.m0, m1: l.m1 };
    g.qty += l.qty; g.cr += l.cr; g.m1 = l.m1; g.name = l.name ?? g.name;
    cr += l.cr; qty += l.qty;
    if (l.glut) { p.glutted++; T.glutted++; }
    if (l.need) { p.relieved++; T.relieved++; }
    if (l.starved) { p.starved++; T.starved++; }
  }
  p.trades++; p.last = at; T.trades++;
  if (kind === "sell") { p.earned += cr; p.slipLost += slipLost; T.sold += qty; T.earned += cr; T.slipLost += slipLost; }
  else { p.spent += cr; p.slipLost += slipLost; T.bought += qty; T.spent += cr; T.slipLost += slipLost; }
  if (standing?.id && Number.isFinite(standing.after - standing.before)) {
    const c = footprint.corps[standing.id] ??= { name: standing.name, delta: 0, from: standing.before, now: standing.after };
    c.delta += standing.after - standing.before; c.now = standing.after; c.name = standing.name ?? c.name;
  }
  for (const L of forecast?.restarted ?? []) { footprint.lines.forecast++; footprint.pending.push({ at, port: port.id, portName: port.name, line: L.id, name: L.name, want: true }); }
  for (const L of forecast?.stalled ?? []) { footprint.lines.stalledForecast++; footprint.pending.push({ at, port: port.id, portName: port.name, line: L.id, name: L.name, want: false }); }
  if (footprint.pending.length > FOOT.pending) footprint.pending.splice(0, footprint.pending.length - FOOT.pending);
  const big = [...lots].sort((a, b) => Math.abs(b.m1 - b.m0) - Math.abs(a.m1 - a.m0))[0];
  const move = big && Math.abs(big.m1 - big.m0) >= 0.02 ? ` — ${big.name} ${big.m1 < big.m0 ? "down" : "up"} ${Math.round(Math.abs(big.m1 / big.m0 - 1) * 100)}%` : "";
  const line = (forecast?.restarted?.length ? `; should start ${forecast.restarted.map((l) => l.name).join(", ")}` : "") + (forecast?.stalled?.length ? `; may stop ${forecast.stalled.map((l) => l.name).join(", ")}` : "");
  event(at, kind, `${kind === "sell" ? "Sold" : "Bought"} ${Math.round(qty)} at ${port.name} for ${Math.round(cr).toLocaleString("en-US")} cr${move}${line}`);
  return p;
}

export function noteWork({ at = 0, verb, ok = true, secs = 0, cr = 0, took = 0, what = null }) {
  if (!verb) return;
  const w = footprint.work[verb] ??= { jobs: 0, done: 0, secs: 0, cr: 0, took: 0 };
  w.jobs++; if (ok) w.done++; w.secs += Math.max(0, secs); w.cr += cr; w.took += Math.max(0, took);
  if (took > 0 && what) event(at, verb, `${verb === "salvage" ? "Stripped" : "Cut"} ${Math.round(took)} ${what}`);
}

export function audit(now, lineState) {
  const keep = [];
  let scored = 0;
  for (const q of footprint.pending) {
    const age = now - q.at;
    if (age < FOOT.auditAfter) { keep.push(q); continue; }
    const running = lineState(q.port, q.line);
    if (running == null) { if (age < FOOT.auditBy) keep.push(q); continue; }
    scored++;
    if (q.want) { if (running) { footprint.lines.confirmed++; event(now, "line", `${q.name} at ${q.portName} is running on what she brought`); } else if (age >= FOOT.auditBy) footprint.lines.missed++; else { keep.push(q); scored--; } }
    else if (!running) { footprint.lines.stalledConfirmed++; event(now, "line", `${q.name} at ${q.portName} stopped after she bought its feed`); }
    else if (age < FOOT.auditBy) { keep.push(q); scored--; }
  }
  footprint.pending = keep;
  return scored;
}

export function footprintReport() {
  const ports = Object.entries(footprint.ports).map(([id, p]) => {
    const moved = [...Object.entries(p.sold).map(([g, v]) => ({ id: g, dir: "sold", ...v })), ...Object.entries(p.bought).map(([g, v]) => ({ id: g, dir: "bought", ...v }))].sort((a, b) => b.cr - a.cr);
    return { id, name: p.name, trades: p.trades, earned: Math.round(p.earned), spent: Math.round(p.spent), slipLost: Math.round(p.slipLost), glutted: p.glutted, relieved: p.relieved, starved: p.starved, top: moved[0] ?? null, last: p.last };
  }).sort((a, b) => (b.earned + b.spent) - (a.earned + a.spent));
  const corps = Object.entries(footprint.corps).map(([id, c]) => ({ id, name: c.name, delta: Number(c.delta.toFixed(1)), now: Math.round(c.now) })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const L = footprint.lines;
  return {
    totals: { ...footprint.totals, earned: Math.round(footprint.totals.earned), spent: Math.round(footprint.totals.spent), slipLost: Math.round(footprint.totals.slipLost), sold: Math.round(footprint.totals.sold), bought: Math.round(footprint.totals.bought) },
    ports, corps,
    work: Object.entries(footprint.work).map(([verb, w]) => ({ verb, ...w, cr: Math.round(w.cr), took: Math.round(w.took) })).sort((a, b) => b.jobs - a.jobs),
    lines: { ...L, waiting: footprint.pending.length, rate: L.confirmed + L.missed ? L.confirmed / (L.confirmed + L.missed) : null },
    events: footprint.events.slice(0, 12),
  };
}

export function footprintLine() {
  const t = footprint.totals, L = footprint.lines;
  if (!t.trades && !Object.keys(footprint.work).length) return "no wake yet";
  const bits = [`${t.trades} trade${t.trades === 1 ? "" : "s"} at ${Object.keys(footprint.ports).length} port${Object.keys(footprint.ports).length === 1 ? "" : "s"}`];
  if (t.slipLost >= 1) bits.push(`${Math.round(t.slipLost).toLocaleString("en-US")} cr given up to her own price moves`);
  if (L.confirmed) bits.push(`${L.confirmed} line${L.confirmed === 1 ? "" : "s"} started`);
  if (L.stalledConfirmed) bits.push(`${L.stalledConfirmed} stopped`);
  if (t.glutted) bits.push(`${t.glutted} shelf${t.glutted === 1 ? "" : "s"} flooded`);
  return bits.join(" · ");
}
