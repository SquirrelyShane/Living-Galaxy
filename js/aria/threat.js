export const THREAT = {
  reach: 14000,
  near: 6000,
  closeK: 0.004,
  toughness: 60,
  gain: 1.6,
  bands: [[0.12, "clear"], [0.35, "watch"], [0.65, "pressed"], [Infinity, "outgunned"]],
  laneR: 7000,
  nestR: 9000,
};

const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export const bandOf = (level) => THREAT.bands.find(([edge]) => level < edge)[1];

export function guardOf(own) {
  const guns = own.armed ? 1 + 0.6 * Math.max(1, own.turrets ?? 1) : 0.55;
  return guns * (0.4 + 0.6 * clamp01(own.hull ?? 1)) * (0.6 + 0.4 * clamp01(own.charge ?? 1));
}

export function threatOf(own, hostiles = []) {
  const p = own.pos, v = own.vel ?? { x: 0, y: 0, z: 0 };
  let press = 0, n = 0, nearest = Infinity, closing = 0, eta = Infinity, worst = null, worstP = 0;
  for (const c of hostiles) {
    const dx = c.x - p.x, dy = c.y - p.y, dz = c.z - p.z;
    const d = Math.hypot(dx, dy, dz);
    if (d > THREAT.reach) continue;
    n++;
    nearest = Math.min(nearest, d);
    const inv = 1 / Math.max(1, d);
    const close = -(((c.vx ?? 0) - v.x) * dx + ((c.vy ?? 0) - v.y) * dy + ((c.vz ?? 0) - v.z) * dz) * inv;
    if (close > closing) closing = close;
    if (close > 1) eta = Math.min(eta, d / close);
    const reachW = 1 / (1 + (d / THREAT.near) * (d / THREAT.near));
    const tough = Math.max(0.5, Math.min(3, ((c.hp ?? 40) + (c.shield ?? 0)) / THREAT.toughness));
    const pi = reachW * (1 + Math.max(0, close) * THREAT.closeK) * tough;
    press += pi;
    if (pi > worstP) { worstP = pi; worst = { id: c.id ?? null, name: c.name ?? "contact", d }; }
  }
  const guard = guardOf(own);
  const level = n ? 1 - Math.exp(-press / (guard * THREAT.gain)) : 0;
  return { level, band: bandOf(level), n, nearest, closing, eta, press, guard, worst };
}

function segDist(a, b, q) {
  const ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z;
  const len2 = ux * ux + uy * uy + uz * uz;
  if (len2 < 1) return d3(a, q);
  const t = clamp01(((q.x - a.x) * ux + (q.y - a.y) * uy + (q.z - a.z) * uz) / len2);
  return Math.hypot(a.x + ux * t - q.x, a.y + uy * t - q.y, a.z + uz * t - q.z);
}

export function legRisk(from, to, hazards = []) {
  let safe = 1, worst = null, wr = 0;
  for (const h of hazards) {
    const r = h.r ?? THREAT.laneR;
    const d = segDist(from, to, h);
    const k = clamp01(h.w ?? 1) * Math.exp(-(d / r) * (d / r));
    if (k < 0.005) continue;
    safe *= 1 - k;
    if (k > wr) { wr = k; worst = h; }
  }
  return { risk: 1 - safe, worst };
}

export function pathRisk(points, hazards = []) {
  let safe = 1, worst = null, wr = 0;
  for (let i = 1; i < points.length; i++) {
    if (!points[i - 1] || !points[i]) continue;
    const r = legRisk(points[i - 1], points[i], hazards);
    safe *= 1 - r.risk;
    if (r.risk > wr) { wr = r.risk; worst = r.worst; }
  }
  return { risk: 1 - safe, worst };
}

export function hazardsFrom({ hostiles = [], nests = [], dangers = [] } = {}) {
  const out = [];
  for (const h of hostiles) out.push({ x: h.x, y: h.y, z: h.z, w: 0.5, r: THREAT.laneR, name: h.name ?? "contact" });
  for (const n of nests) out.push({ x: n.x, y: n.y, z: n.z, w: 0.6, r: THREAT.nestR, name: n.name ?? "nest" });
  for (const d of dangers) out.push({ x: d.x, y: d.y, z: d.z, w: Math.min(0.8, d.w), r: THREAT.laneR, name: d.name ?? "trouble seen" });
  return out;
}

export function threatLine(t) {
  if (!t || !t.n) return "clear";
  const eta = Number.isFinite(t.eta) && t.eta < 180 ? `, ${Math.round(t.eta)} s out` : "";
  return `${t.band} — ${t.n} hostile, nearest ${Math.round(t.nearest).toLocaleString("en-US")} u${t.closing > 20 ? `, closing ${Math.round(t.closing)} u/s` : ""}${eta}`;
}
