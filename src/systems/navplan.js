// Living Galaxy — course planning over gravity wells.
//
// v0.2 planned recursively: find the first blocker, drop one waypoint beside it, recurse
// on both halves. That is greedy — it commits to a side before it knows what is behind
// the body, so a corner chosen to clear Solaris Prime could put you straight into
// Aether's well, and the recursion had to be depth-capped to stop it thrashing. It
// scored 5/5 on the tuned seeds and 3/5 on others, which is exactly the signature of a
// planner that gets the easy geometries right by luck.
//
// This is a visibility graph instead. Bypass nodes are generated around every obstacle
// that matters, an edge exists between two nodes when the straight segment between them
// misses every well, and A* finds the shortest route through what is left. It considers
// all the sides at once, so the choice between going over Solaris Prime or around it is
// made on total path length rather than on which one the recursion happened to try.
//
// Everything here is pure: positions in, waypoints out. It never touches S, so the same
// function plans a warp course, a nav-map preview, and an NPC route.

import { NAV, WARP } from '../core/config.js';

const _ab = new THREE.Vector3();
const _ac = new THREE.Vector3();
const _n1 = new THREE.Vector3();
const _n2 = new THREE.Vector3();

/**
 * Shortest distance from sphere centre `c` to segment a→b.
 * The clamp is what makes it a segment test rather than an infinite-line test —
 * a body behind you does not block the road ahead.
 */
export function segmentDistance(a, b, c) {
  _ab.copy(b).sub(a);
  const len2 = _ab.lengthSq();
  if (len2 < 1e-9) return a.distanceTo(c);
  _ac.copy(c).sub(a);
  const t = Math.max(0, Math.min(1, _ac.dot(_ab) / len2));
  _ac.copy(a).addScaledVector(_ab, t);
  return _ac.distanceTo(c);
}

/**
 * Collect the obstacles worth planning against.
 * `wellOf(body)` returns the raw well radius; the caller owns that formula so this
 * module stays independent of the warp rules.
 */
export function collectObstacles(from, to, bodies, wellOf, destObj) {
  const out = [];
  // The destination's own gravity well is where a warp course *ends* — the core drops
  // out at that edge and the approach autopilot flies the rest. Anything orbiting inside
  // that edge therefore sits behind the arrival point and can never be flown through.
  //
  // Without this, a moon was treated as a wall across the only approach to its own
  // primary. A gas giant's third moon orbits at roughly five planet radii; its well
  // spans well over half that distance; and the planner would dutifully try to route
  // *around* a body that stands between the ship and the giant from every direction at
  // once, hand back the fallback sidestep, and mark its own course unflyable.
  //
  // This was latent long before moons had classes — it needed a moon to sit in a narrow
  // band just outside its primary's clear ring, which the twenty-seed sweep happened not
  // to produce. It reproduces on the old flat moon values at seed 191393 (Obscura III).
  const destWell = destObj && destObj.userData ? wellOf(destObj.userData) : 0;
  // The goal is a sphere, not a point. A course ends anywhere on the destination's
  // arrival region, so `to` is only the centre of what the ship is actually aiming for.
  // `arriveOf` is supplied by the caller that owns the drop-out rule, so the planner and
  // the warp core always use the same radius — see `arrivalRadius()` in systems/warp.js.
  const goalR = destWell * WARP.arriveFactor;

  for (const body of bodies) {
    const u = body.userData;
    if (u.kind !== 'planet' && u.kind !== 'star' && u.kind !== 'moon') continue;
    if (destObj && body === destObj) continue;
    if (destObj && destWell > 0 && destObj.position.distanceTo(body.position) < destWell) continue;

    const well = wellOf(u);
    // The destination sitting inside this well means we have to fly in regardless —
    // planning around it would make the target unreachable, not safer.
    const testR = testRadius(well);
    const clearR = clearRadius(well);
    // The two "impossible to avoid" tests are measured at `testR` — the same radius
    // `visible()` treats as a wall. They have to be: an obstacle excused at one radius and
    // walled off at a larger one is an obstacle the planner refuses to route around and
    // then refuses to fly through. Measuring them at `clearR` instead would skip Solaris
    // Prime on every course to Aether, which orbits outside the star's well and is
    // perfectly reachable around it.
    if (destObj && destObj.position.distanceTo(body.position) < testR) continue;
    // Measured against the goal *sphere*, not its centre. An obstacle whose bypass ring
    // reaches the arrival region cannot be planned around: every node on that ring is as
    // close to the obstacle as the goal is, so the final leg dips inside whichever node it
    // comes from. This is the same dead band `escapesWell()` closes at the start of a
    // route — a sibling moon 250 units from its neighbour, with a 247-unit ring, sat two
    // units outside the old centre-only test and made its neighbour unreachable.
    if (to.distanceTo(body.position) - goalR < testR) continue;

    // Rank by *encroachment on the route*: how far inside its own well the straight
    // line passes. Negative means it genuinely blocks. Ranking by distance to the
    // corridor midpoint instead — which is what this did first — sorts a big obstacle
    // sitting squarely across the path below a small one that merely happens to be
    // near the middle, and the cap below then throws the important one away. That is
    // how a course got plotted straight through Solaris Prime.
    const clearance = segmentDistance(from, to, body.position) - clearR;
    if (clearance > clearR) continue;                // nowhere near the corridor

    out.push({ body, pos: body.position, well, testR, clearR, clearance });
  }

  out.sort((a, b) => a.clearance - b.clearance);
  return out.slice(0, NAV.maxObstacles);
}

/** Two unit vectors perpendicular to `axis` and to each other. */
function basis(axis, u, v) {
  const ref = Math.abs(axis.y) > 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  u.set(axis.y * ref.z - axis.z * ref.y,
        axis.z * ref.x - axis.x * ref.z,
        axis.x * ref.y - axis.y * ref.x).normalize();
  v.set(axis.y * u.z - axis.z * u.y,
        axis.z * u.x - axis.x * u.z,
        axis.x * u.y - axis.y * u.x).normalize();
}

/**
 * Ring of bypass nodes around one obstacle, in the plane perpendicular to the
 * route axis. Angles are fixed and the ring starts at a fixed offset, so the same
 * geometry always produces the same nodes — a planner that jitters cannot be tested.
 */
function ringNodes(ob, axis, out) {
  basis(axis, _n1, _n2);
  const r = ob.clearR;
  for (let i = 0; i < NAV.rings; i++) {
    const a = (i / NAV.rings) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    out.push(new THREE.Vector3(
      ob.pos.x + (_n1.x * c + _n2.x * s) * r,
      ob.pos.y + (_n1.y * c + _n2.y * s) * r,
      ob.pos.z + (_n1.z * c + _n2.z * s) * r
    ));
    if (out.length >= NAV.maxNodes) return;
  }
}

/**
 * Three radii, and getting the order wrong is what made a shrunken well unflyable.
 *
 *   well          — where the core actually breaks lock. Not negotiable; physics.
 *   testRadius    — where the planner calls a leg blocked. Must sit **outside** `well` by
 *                   more than the ship's own tracking error, because a plan is a polyline
 *                   and a ship at 1,500 units/s with a finite align rate is not. At the
 *                   old well sizes `well x 1.12` gave 111 units of slack and the error
 *                   fits inside it; at the new sizes it gave 44, and a course planned
 *                   legally was flown 8 units inside Gaia's well and dropped out.
 *   clearRadius   — where bypass nodes go. Outside `testRadius` so a node is a place the
 *                   ship can actually stand, which is the hysteresis this planner has
 *                   always needed and now measures from the right base.
 *
 * `NAV.margin` is absolute because the error it absorbs is absolute — it is a property of
 * the ship, not of whatever the ship is going around.
 */
export const testRadius = well => well * NAV.test + NAV.margin;
export const clearRadius = well => testRadius(well) * NAV.clear;

/**
 * Is the ship already so deep in this well that planning around it is meaningless?
 *
 * Two radii bracket every obstacle: legs are blocked inside `NAV.test` well-radii, and
 * bypass nodes are placed at `NAV.clear` well-radii — and `clear` is the larger of the
 * two. A ship sitting *between* them is in a dead band: it is blocked, and every chord
 * from where it stands to any node on the bypass ring dips further inside the well than
 * either endpoint, so no first leg is ever visible. A* then finds no route at all and
 * hands back the fallback sidestep, which is by construction not clear.
 *
 * Measured at `NAV.clear`, the band closes. This is the same lesson as the lock ranges in
 * v1.00.30: when two thresholds bracket a state, check which is larger *in the units they
 * are compared in*. Here `escaping` was measured at the smaller one and the ring at the
 * larger, so the geometry guaranteed a gap.
 *
 * Both the planner and `routeClear()` ask through this one function; a route judged by a
 * different rule than the one that produced it is a test that fails on correct output.
 */
export const escapesWell = (from, ob) => from.distanceTo(ob.pos) < ob.clearR;

const _goal = new THREE.Vector3();

/**
 * Where a course to `to` actually stops.
 *
 * The planner has always planned to the destination's *centre*, and a warp core has never
 * flown there: it drops out at the destination's well edge and the approach autopilot
 * closes the rest. So the last stretch of every plotted course is a stretch that will
 * never be flown — and demanding it be clear invents impossible corridors out of nothing.
 * Two planets in near conjunction, 1,600 units apart with 1,000-unit wells, produced
 * exactly that: a legal approach the planner rejected because of geometry inside a well
 * the ship stops outside of.
 *
 * The clip is exact rather than approximate: the segment from `a` to a sphere's centre
 * enters that sphere at one point, and this is it. the factor is `WARP.arriveFactor`,
 * the same number systems/warp.js drops out on — one constant, so the rule cannot drift.
 */
export function clipGoal(a, to, destWell) {
  if (!(destWell > 0)) return to;
  const r = destWell * WARP.arriveFactor;
  _goal.copy(a).sub(to);
  const d = _goal.length();
  if (d <= r || d < 1e-9) return to;
  return _goal.multiplyScalar(r / d).add(to).clone();
}

/** True when the straight line a→b stays clear of every obstacle. */
function visible(a, b, obstacles) {
  for (const ob of obstacles) {
    if (segmentDistance(a, b, ob.pos) < ob.testR) return false;
  }
  return true;
}

/**
 * Plan a route from `from` to `to`.
 * @returns {THREE.Vector3[]} intermediate waypoints; empty means fly direct.
 */
export function planRoute(from, to, bodies, wellOf, destObj) {
  const obstacles = collectObstacles(from, to, bodies, wellOf, destObj);
  if (!obstacles.length) return [];
  const destWell = destObj && destObj.userData ? wellOf(destObj.userData) : 0;

  // Sitting inside a well is a legal state (you spawned there, you were dropped there).
  // Those wells cannot be treated as walls or nothing is reachable.
  const blocking = obstacles.filter(ob => !escapesWell(from, ob));

  if (visible(from, clipGoal(from, to, destWell), blocking)) return [];

  const axis = _ac.copy(to).sub(from);
  if (axis.lengthSq() < 1e-9) return [];
  axis.normalize();

  const nodes = [from.clone(), to.clone()];
  for (const ob of blocking) {
    if (nodes.length >= NAV.maxNodes) break;
    ringNodes(ob, axis, nodes);
  }

  // ── A* over the visibility graph ───────────────────────────────────
  const n = nodes.length;
  const START = 0, GOAL = 1;
  const g = new Float64Array(n).fill(Infinity);
  const f = new Float64Array(n).fill(Infinity);
  const cameFrom = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  g[START] = 0;
  f[START] = nodes[START].distanceTo(nodes[GOAL]);

  // A linear scan for the cheapest open node. n is bounded by NAV.maxNodes, so the
  // heap that would make this asymptotically better would cost more than it saves.
  for (let guard = 0; guard < n; guard++) {
    let cur = -1, best = Infinity;
    for (let i = 0; i < n; i++) {
      if (closed[i] || f[i] === Infinity) continue;
      if (f[i] < best) { best = f[i]; cur = i; }
    }
    if (cur < 0) break;
    if (cur === GOAL) break;
    closed[cur] = 1;

    for (let j = 0; j < n; j++) {
      if (j === cur || closed[j]) continue;
      // A leg that ends at the destination is only flown as far as the well edge.
      const end = j === GOAL ? clipGoal(nodes[cur], nodes[GOAL], destWell) : nodes[j];
      if (!visible(nodes[cur], end, blocking)) continue;
      const tentative = g[cur] + nodes[cur].distanceTo(nodes[j]);
      if (tentative >= g[j]) continue;
      cameFrom[j] = cur;
      g[j] = tentative;
      f[j] = tentative + nodes[j].distanceTo(nodes[GOAL]);
    }
  }

  if (cameFrom[GOAL] < 0) {
    // No clean route. Rather than stranding the pilot, hand back the single best
    // sidestep around the nearest blocker so the ship at least makes progress and
    // the next re-plan sees a different, usually easier, geometry.
    return fallback(from, to, blocking);
  }

  // Walk the parent chain back from the goal. The loop stops *before* pushing START,
  // so the goal is the only endpoint that needs removing — taking it off the wrong
  // end here silently drops the first waypoint, which is the corner that matters most.
  const path = [];
  for (let at = GOAL; at !== START && at >= 0; at = cameFrom[at]) path.push(nodes[at]);
  path.shift();                    // the goal itself is not a waypoint
  path.reverse();
  return path.slice(0, NAV.maxWaypoints);
}

/** One waypoint beside the worst blocker, preferring a side that is actually flyable. */
function fallback(from, to, obstacles) {
  let worst = null, worstD = Infinity;
  for (const ob of obstacles) {
    const d = segmentDistance(from, to, ob.pos) - ob.testR;
    if (d < worstD) { worstD = d; worst = ob; }
  }
  if (!worst) return [];

  const axis = _ac.copy(to).sub(from).normalize();
  basis(axis, _n1, _n2);
  const r = worst.clearR;
  let bestPt = null, bestLen = Infinity;
  let anyPt = null, anyLen = Infinity;
  for (let i = 0; i < NAV.rings; i++) {
    const a = (i / NAV.rings) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    const pt = new THREE.Vector3(
      worst.pos.x + (_n1.x * c + _n2.x * s) * r,
      worst.pos.y + (_n1.y * c + _n2.y * s) * r,
      worst.pos.z + (_n1.z * c + _n2.z * s) * r
    );
    const len = from.distanceTo(pt) + pt.distanceTo(to);
    if (len < anyLen) { anyLen = len; anyPt = pt; }
    // Shortest is worthless if the leg flies through something. Prefer a corner both
    // legs can actually reach, and only fall back to shortest-regardless if none can.
    if (visible(from, pt, obstacles) && len < bestLen) { bestLen = len; bestPt = pt; }
  }
  return (bestPt || anyPt) ? [bestPt || anyPt] : [];
}

/** Total length of a route, for comparing plans and for ETA readouts. */
export function routeLength(from, waypoints, to) {
  let total = 0, prev = from;
  for (const w of waypoints) { total += prev.distanceTo(w); prev = w; }
  return total + prev.distanceTo(to);
}

/** Does this route actually stay clear? Used by the tests and by the stall detector. */
export function routeClear(from, waypoints, to, bodies, wellOf, destObj) {
  const obstacles = collectObstacles(from, to, bodies, wellOf, destObj)
    .filter(ob => !escapesWell(from, ob));
  const destWell = destObj && destObj.userData ? wellOf(destObj.userData) : 0;
  let prev = from;
  for (const w of waypoints) {
    if (!visible(prev, w, obstacles)) return false;
    prev = w;
  }
  return visible(prev, clipGoal(prev, to, destWell), obstacles);
}
