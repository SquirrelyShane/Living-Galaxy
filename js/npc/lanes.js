/* LIVING GALAXY — port traffic lanes.
 *
 * Every port runs two lanes out into open space from its hangar mouth: an
 * ENTRY lane and an EXIT lane, side by side, so inbound hulls never meet
 * outbound ones head-on. A lane is a string of marker beads from the mouth
 * out to LANE_U; a runner light chases along it — outward on the exit lane,
 * inward on the entry lane — so from ten kilometres out you can read which
 * way each lane flows.
 *
 * The lanes are a FUNNEL. At the mouth the three ways of each lane are as
 * close as the hangar's own floor strips (a few units apart) and the entry
 * and exit lanes sit in the two halves of one aperture; by FUNNEL_U out they
 * have spread to the full highway spacing and stay there to the far gate.
 * Ships fly the wide lane in, and the lane gathers them into the mouth.
 *
 * Lanes are short: LANE_U out from the mouth (5 km), and the engine draws a
 * rig only when the hull is inside LANE_DRAW_R of the lane itself — they are
 * the last approach, not scenery. The tractor pulls arrivals in by the ENTRY
 * door and pushes departures out by the EXIT door, releasing at RELEASE_U up
 * the exit lane, past the funnel and outside its own reach.
 *
 * The lane frame is fixed in the sky: the station generator holds the hull
 * still and the mouth's direction is deterministic in the seed, so every
 * client agrees. A port without a built hangar (test fixtures) falls back to
 * a frame off its seed. Pure data — nothing here touches three.js.
 */

export const LANE_U = 500;          // mouth → far gate, world units (5 km: the last approach, not a highway across the system)
export const LANE_BEADS = 24;       // marker beads per lane
export const LANE_GAP_K = 3.2;      // far-field lane centreline offset, in port radii
export const LANE_RUN_S = 4.5;      // seconds for the runner to cover the lane
export const LANE_TRAIL = 4;        // beads lit behind the runner
export const LANE_HALF_W = 90;      // how far off a lane-way's centreline still counts as "in it" (far field)
export const SUBLANES = 3;          // lane-ways per direction: three in, three out
export const SUBLANE_GAP = 140;     // far-field centre-to-centre spacing of the lane-ways
export const ZONE_HALF_H = 110;     // the coloured zone's half height (far field)
export const ZONE_HALF_W = SUBLANE_GAP * SUBLANES * 0.5;   // and half width (covers all three ways)
export const FUNNEL_U = 0.45;       // fraction of the lane over which the funnel opens
export const LANE_DRAW_R = 500;     // the rig is only drawn inside this of the lane itself (5 km)
export const RELEASE_U = 0.65;      // where the departure push lets go: past the funnel, outside the tractor's reach

const cache = new WeakMap();

/** Lane frame for a port: unit direction, side, up, the near (mouth) and far offsets of both lanes. */
export function stationLane(st) {
  let f = cache.get(st);
  if (f && f.port === (st.port ?? null) && f.version === (st.portVersion ?? 0)) return f;
  const p = st.port;
  if (p) {
    const gap = Math.max((st.radius ?? 100) * LANE_GAP_K, ZONE_HALF_W + 120);
    const far = (sgn) => ({ x: p.x + p.side.x * gap * sgn, y: p.y + p.side.y * gap * sgn, z: p.z + p.side.z * gap * sgn });
    f = {
      dir: p.dir, side: p.side, up: p.up, gap,
      entry: p.entry, exit: p.exit,                    // at the mouth
      farEntry: far(-1), farExit: far(1),              // past the funnel
      nearK: p.wayGap / SUBLANE_GAP,                   // how tight the ways are at the mouth
      nearH: p.halfH / ZONE_HALF_H,                    // and the zone
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

/** Lateral offset (far field, world units along `side`) of lane-way `k` (0..SUBLANES-1) within a lane. */
export function subLaneOffset(k) {
  return (k - (SUBLANES - 1) / 2) * SUBLANE_GAP;
}

/** Which lane-way a hull uses, off its id — stable for the hull's whole life. */
export function subLaneFor(id) {
  let n = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) n = Math.imul(n ^ s.charCodeAt(i), 2654435761) >>> 0;
  return n % SUBLANES;
}

/** How far open the funnel is at `u` along the lane: 0 at the mouth, 1 past FUNNEL_U. */
export function funnel(u) {
  const t = Math.max(0, Math.min(1, u / FUNNEL_U));
  return t * t * (3 - 2 * t);
}

/** The lane-way spacing multiplier and zone scale at `u`. */
export function spreadAt(f, u) {
  if (!f.port) return { k: 1, h: 1 };
  const s = funnel(u);
  return { k: f.nearK + (1 - f.nearK) * s, h: f.nearH + (1 - f.nearH) * s };
}

/** The lane's centreline offset (from the station centre) at `u`. */
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
/** World point on a lane: `which` is "entry" | "exit", `u` 0 at the mouth, 1 at the far gate,
 * `k` the lane-way (default: the centre one). */
export function lanePoint(st, which, u, out = { x: 0, y: 0, z: 0 }, k = (SUBLANES - 1) / 2) {
  const f = stationLane(st);
  laneCentre(f, which, u, _c);
  const lat = subLaneOffset(k) * spreadAt(f, u).k;
  out.x = st.x + _c.x + f.side.x * lat;
  out.y = st.y + _c.y + f.side.y * lat;
  out.z = st.z + _c.z + f.side.z * lat;
  return out;
}

/** The same by distance from the mouth (may run past the far gate: hulls drop out of warp beyond it). */
export function laneAt(st, which, dist, k = (SUBLANES - 1) / 2, out = { x: 0, y: 0, z: 0 }) {
  return lanePoint(st, which, dist / LANE_U, out, k);
}

/** Which bead the runner is on right now, 0..LANE_BEADS-1 in the direction of flow. */
export function runnerIndex(t, which) {
  const u = ((t / LANE_RUN_S) % 1 + 1) % 1;
  const i = Math.floor(u * LANE_BEADS);
  return which === "exit" ? i : LANE_BEADS - 1 - i;
}

/** Brightness of bead `i` on a lane at time `t`: 1 on the runner, fading over the trail, 0 off. */
export function beadLit(t, which, i) {
  const r = runnerIndex(t, which);
  const behind = which === "exit" ? r - i : i - r;
  if (behind < 0 || behind > LANE_TRAIL) return 0;
  return 1 - behind / (LANE_TRAIL + 1);
}

/**
 * Where a point sits relative to a port's lanes: { which, way, u, off, along }
 * for the lane-way it is in, or null if it is outside every zone. `off` is
 * the lateral distance from that way's centreline, `along` the distance
 * from the mouth in world units.
 */
export function laneOf(st, p) {
  const f = stationLane(st);
  let best = null;
  const backR = f.port ? f.mouth.depth : st.radius;
  for (const which of ["entry", "exit"]) {
    const near = f[which];
    const px = p.x - st.x - near.x, py = p.y - st.y - near.y, pz = p.z - st.z - near.z;
    const along = px * f.dir.x + py * f.dir.y + pz * f.dir.z;
    if (along < -backR || along > f.length * 1.5 + 200) continue; // hulls drop out of warp a little past the far gate
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

/** Distance from a point to the lane rig: to the axis from the mouth to the far gate, less the rig's own half-extent
 * (both lanes and their zones sit within gap + ZONE_HALF_W of the axis). 0 anywhere inside the rig. */
export function laneDistance(st, p) {
  const f = stationLane(st);
  const ox = f.port ? f.mouth.x : 0, oy = f.port ? f.mouth.y : 0, oz = f.port ? f.mouth.z : 0;
  const px = p.x - st.x - ox, py = p.y - st.y - oy, pz = p.z - st.z - oz;
  const along = Math.max(0, Math.min(f.length, px * f.dir.x + py * f.dir.y + pz * f.dir.z));
  const d = Math.hypot(px - f.dir.x * along, py - f.dir.y * along, pz - f.dir.z * along);
  return Math.max(0, d - (f.gap + ZONE_HALF_W));
}

/** Direction of travel a lane expects: +1 along `dir` on the exit lane, −1 on the entry lane. */
export function laneFlow(which) { return which === "exit" ? 1 : -1; }
