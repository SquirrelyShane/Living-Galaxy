export const LANE_U = 500;
export const LANE_BEADS = 24;
export const LANE_GAP_K = 3.2;
export const LANE_RUN_S = 4.5;
export const LANE_TRAIL = 4;
export const LANE_HALF_W = 90;
export const SUBLANES = 3;
export const SUBLANE_GAP = 140;
export const ZONE_HALF_H = 110;
export const ZONE_HALF_W = SUBLANE_GAP * SUBLANES * 0.5;
export const FUNNEL_U = 0.45;
export const LANE_DRAW_R = 500;
export const RELEASE_U = 0.65;

const cache = new WeakMap();

export function stationLane(st) {
  let f = cache.get(st);
  if (f && f.port === (st.port ?? null) && f.version === (st.portVersion ?? 0)) return f;
  const p = st.port;
  if (p) {
    const gap = Math.max((st.radius ?? 100) * LANE_GAP_K, ZONE_HALF_W + 120);
    const far = (sgn) => ({ x: p.x + p.side.x * gap * sgn, y: p.y + p.side.y * gap * sgn, z: p.z + p.side.z * gap * sgn });
    f = {
      dir: p.dir, side: p.side, up: p.up, gap,
      entry: p.entry, exit: p.exit,
      farEntry: far(-1), farExit: far(1),
      nearK: p.wayGap / SUBLANE_GAP,
      nearH: p.halfH / ZONE_HALF_H,
      mouth: { x: p.x, y: p.y, z: p.z, halfW: p.halfW, halfH: p.halfH, depth: p.d },
      length: LANE_U, port: p, version: st.portVersion ?? 0,
    };
  } else {
    const a = (st.seed ?? 0.37) * Math.PI * 2;
    const dir = { x: Math.cos(a), y: 0, z: Math.sin(a) };
    const side = { x: -Math.sin(a), y: 0, z: Math.cos(a) };
    const gap = Math.max((st.radius ?? 100) * LANE_GAP_K, ZONE_HALF_W + 120);
    const entry = { x: side.x * gap, y: 0, z: side.z * gap }, exit = { x: -side.x * gap, y: 0, z: -side.z * gap };
    f = { dir, side, up: { x: 0, y: 1, z: 0 }, gap, entry, exit, farEntry: entry, farExit: exit, nearK: 1, nearH: 1, mouth: null, length: LANE_U, port: null, version: 0 };
  }
  cache.set(st, f);
  return f;
}

export function subLaneOffset(k) {
  return (k - (SUBLANES - 1) / 2) * SUBLANE_GAP;
}

export function subLaneFor(id) {
  let n = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) n = Math.imul(n ^ s.charCodeAt(i), 2654435761) >>> 0;
  return n % SUBLANES;
}

export function funnel(u) {
  const t = Math.max(0, Math.min(1, u / FUNNEL_U));
  return t * t * (3 - 2 * t);
}

export function spreadAt(f, u) {
  if (!f.port) return { k: 1, h: 1 };
  const s = funnel(u);
  return { k: f.nearK + (1 - f.nearK) * s, h: f.nearH + (1 - f.nearH) * s };
}

export function laneCentre(f, which, u, out = { x: 0, y: 0, z: 0 }) {
  const near = f[which], far = which === "entry" ? f.farEntry : f.farExit;
  const s = f.port ? funnel(u) : 1;
  const dd = u * f.length;
  out.x = near.x + (far.x - near.x) * s + f.dir.x * dd;
  out.y = near.y + (far.y - near.y) * s + f.dir.y * dd;
  out.z = near.z + (far.z - near.z) * s + f.dir.z * dd;
  return out;
}

const _c = { x: 0, y: 0, z: 0 };
export function lanePoint(st, which, u, out = { x: 0, y: 0, z: 0 }, k = (SUBLANES - 1) / 2) {
  const f = stationLane(st);
  laneCentre(f, which, u, _c);
  const spread = f.port ? f.nearK + (1 - f.nearK) * funnel(u) : 1;
  const lat = subLaneOffset(k) * spread;
  out.x = st.x + _c.x + f.side.x * lat;
  out.y = st.y + _c.y + f.side.y * lat;
  out.z = st.z + _c.z + f.side.z * lat;
  return out;
}

export function laneAt(st, which, dist, k = (SUBLANES - 1) / 2, out = { x: 0, y: 0, z: 0 }) {
  return lanePoint(st, which, dist / LANE_U, out, k);
}

export function runnerIndex(t, which) {
  const u = ((t / LANE_RUN_S) % 1 + 1) % 1;
  const i = Math.floor(u * LANE_BEADS);
  return which === "exit" ? i : LANE_BEADS - 1 - i;
}

export function beadLit(t, which, i) {
  const r = runnerIndex(t, which);
  const behind = which === "exit" ? r - i : i - r;
  if (behind < 0 || behind > LANE_TRAIL) return 0;
  return 1 - behind / (LANE_TRAIL + 1);
}

export function laneOf(st, p) {
  const f = stationLane(st);
  let best = null;
  const backR = f.port ? f.mouth.depth : st.radius;
  for (const which of ["entry", "exit"]) {
    const near = f[which];
    const px = p.x - st.x - near.x, py = p.y - st.y - near.y, pz = p.z - st.z - near.z;
    const along = px * f.dir.x + py * f.dir.y + pz * f.dir.z;
    if (along < -backR || along > f.length * 1.5 + 200) continue;
    const u = Math.max(0, along) / f.length;
    laneCentre(f, which, u, _c);
    const cx = p.x - st.x - _c.x, cy = p.y - st.y - _c.y, cz = p.z - st.z - _c.z;
    const lat = cx * f.side.x + cy * f.side.y + cz * f.side.z;
    const vert = cx * f.up.x + cy * f.up.y + cz * f.up.z;
    const sp = spreadAt(f, u);
    const limW = Math.max((ZONE_HALF_W + LANE_HALF_W) * sp.k, f.mouth ? f.mouth.halfW * 0.6 : 0), limH = Math.max(ZONE_HALF_H * sp.h, f.mouth ? f.mouth.halfH * 1.1 : 0);
    if (Math.abs(vert) > limH || Math.abs(lat) > limW) continue;
    let way = 0, off = Infinity;
    for (let k = 0; k < SUBLANES; k++) {
      const d = Math.abs(lat - subLaneOffset(k) * sp.k);
      if (d < off) { off = d; way = k; }
    }
    if (!best || off < best.off) best = { which, way, u, off, along };
  }
  return best;
}

export function laneDistance(st, p) {
  const f = stationLane(st);
  const ox = f.port ? f.mouth.x : 0, oy = f.port ? f.mouth.y : 0, oz = f.port ? f.mouth.z : 0;
  const px = p.x - st.x - ox, py = p.y - st.y - oy, pz = p.z - st.z - oz;
  const along = Math.max(0, Math.min(f.length, px * f.dir.x + py * f.dir.y + pz * f.dir.z));
  const d = Math.hypot(px - f.dir.x * along, py - f.dir.y * along, pz - f.dir.z * along);
  return Math.max(0, d - (f.gap + ZONE_HALF_W));
}

export function laneFlow(which) { return which === "exit" ? 1 : -1; }
