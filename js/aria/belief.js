export const BELIEF = {
  half: { threat: 45, danger: 240, price: 600, count: 180, fact: 300 },
  ewma: 0.12,
  cusumK: 0.5,
  cusumH: 4.5,
  warm: 6,
  floor: 0.02,
  alerts: 24,
  facts: 400,
  trackers: 240,
  cell: 8000,
  dangerCap: 96,
};

export const belief = { facts: new Map(), trackers: new Map(), danger: new Map(), alerts: [], at: 0 };

export function resetBelief() {
  belief.facts.clear();
  belief.trackers.clear();
  belief.danger.clear();
  belief.alerts.length = 0;
  belief.at = 0;
}

const halfOf = (kind) => BELIEF.half[kind] ?? BELIEF.half.fact;
const decay = (age, kind) => Math.pow(0.5, Math.max(0, age) / halfOf(kind));

function trim(map, cap, score) {
  if (map.size <= cap) return;
  let worst = null, ws = Infinity;
  for (const [k, v] of map) { const s = score(v); if (s < ws) { ws = s; worst = k; } }
  if (worst != null) map.delete(worst);
}

export function observe(key, value, at, { kind = "fact", conf = 1 } = {}) {
  belief.at = Math.max(belief.at, at);
  belief.facts.set(key, { v: value, at, conf: Math.max(0, Math.min(1, conf)), kind });
  trim(belief.facts, BELIEF.facts, (f) => f.at);
  return value;
}

export function recall(key, now, min = 0) {
  const f = belief.facts.get(key);
  if (!f) return null;
  const age = Math.max(0, now - f.at);
  const conf = f.conf * decay(age, f.kind);
  return conf >= min ? { v: f.v, age, conf, kind: f.kind } : null;
}

export function track(key, x, at, { kind = "count", scale = 0, label = null, group = null } = {}) {
  if (!Number.isFinite(x)) return null;
  belief.at = Math.max(belief.at, at);
  let t = belief.trackers.get(key);
  if (!t) {
    t = { mean: x, var: 0, n: 0, up: 0, dn: 0, at, last: x, kind, label: label ?? key, group, since: at };
    belief.trackers.set(key, t);
    trim(belief.trackers, BELIEF.trackers, (v) => v.at);
  }
  t.n++; t.at = at; t.last = x;
  const sd = Math.max(Math.sqrt(t.var), Math.abs(t.mean) * BELIEF.floor, scale, 1e-9);
  const z = (x - t.mean) / sd;
  let alert = null;
  if (t.n > BELIEF.warm) {
    t.up = Math.max(0, t.up + z - BELIEF.cusumK);
    t.dn = Math.max(0, t.dn - z - BELIEF.cusumK);
    if (t.up > BELIEF.cusumH || t.dn > BELIEF.cusumH) {
      alert = { key, label: t.label, group: t.group, kind: t.kind, at, from: t.mean, to: x, dir: t.up > t.dn ? 1 : -1, held: at - t.since };
      t.mean = x; t.var = 0; t.up = 0; t.dn = 0; t.n = 1; t.since = at;
      belief.alerts.unshift(alert);
      if (belief.alerts.length > BELIEF.alerts) belief.alerts.length = BELIEF.alerts;
      return alert;
    }
  }
  const a = t.n <= BELIEF.warm ? 1 / t.n : BELIEF.ewma;
  const d = x - t.mean;
  t.mean += a * d;
  t.var = (1 - a) * (t.var + a * d * d);
  return alert;
}

export function anchor(key, x, at) {
  const t = belief.trackers.get(key);
  if (!t || !Number.isFinite(x)) return false;
  t.mean = x; t.last = x; t.up = 0; t.dn = 0; t.at = at; t.since = at;
  return true;
}

export function trackerOf(key) {
  const t = belief.trackers.get(key);
  return t ? { mean: t.mean, sd: Math.sqrt(t.var), n: t.n, last: t.last, at: t.at, label: t.label } : null;
}

export function alertsSince(now, maxAge = 600) {
  return belief.alerts.filter((a) => now - a.at <= maxAge);
}

const cellKey = (p) => `${Math.round(p.x / BELIEF.cell)}:${Math.round(p.y / BELIEF.cell)}:${Math.round(p.z / BELIEF.cell)}`;

export function markDanger(pos, weight, at, name = null) {
  if (!pos || !(weight > 0)) return;
  const k = cellKey(pos);
  const was = belief.danger.get(k);
  const left = was ? was.w * decay(at - was.at, "danger") : 0;
  belief.danger.set(k, { x: pos.x, y: pos.y, z: pos.z, w: Math.min(1, Math.max(left, weight)), at, name: name ?? was?.name ?? null });
  trim(belief.danger, BELIEF.dangerCap, (d) => d.w * decay(belief.at - d.at, "danger"));
}

export function dangers(now, min = 0.05) {
  const out = [];
  for (const [k, d] of belief.danger) {
    const w = d.w * decay(now - d.at, "danger");
    if (w < min) { if (w < 0.01) belief.danger.delete(k); continue; }
    out.push({ x: d.x, y: d.y, z: d.z, w, age: now - d.at, name: d.name });
  }
  return out.sort((a, b) => b.w - a.w);
}

export function beliefReport(now = belief.at) {
  return {
    facts: belief.facts.size,
    trackers: belief.trackers.size,
    danger: dangers(now).slice(0, 6),
    alerts: alertsSince(now).slice(0, 6).map((a) => ({ ...a, line: alertLine(a) })),
  };
}

export function alertLine(a) {
  const f = (v) => (Math.abs(v) >= 100 ? Math.round(v).toLocaleString("en-US") : Number(v.toFixed(2)));
  return `${a.label} ${a.dir > 0 ? "rose" : "fell"} — ${f(a.from)} → ${f(a.to)}`;
}
