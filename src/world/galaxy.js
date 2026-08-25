// Living Galaxy — the galaxy, at last.
//
// ## What this is not
//
// It is **not a second system generator.** `world/genesis.js` has turned a seed into a complete
// system since v1.02.33 — star class from a weighted draw, luminosity, habitable zone, planet
// bands, berths, belts, every name — and it is deterministic, versioned and tested. A galaxy
// module that generated its own planets would be a second source of truth for what a system is,
// and the first thing to drift.
//
// So a galaxy here is an **index**: a deterministic set of positions, names and *seeds*. Asking
// what is actually in a system is one call to `generateSystem(seedOf(node))`, which is the same
// call the game already makes for the one system it lives in. The galaxy adds where things are
// and how far apart; genesis still says what they are.
//
// That is the whole architectural claim, and it is why this file is 250 lines rather than a
// thousand. It also means the galaxy cost nothing to add to the save: a galaxy is one integer.
//
// ## Derived, never stored
//
// Every node is a pure function of `(galaxySeed, index)`. Nothing here is persisted beyond the
// seed itself, nothing can drift between devices, and a fifty-thousand-star galaxy costs one
// number in the save file — the same rule the NPC dossiers have followed since v1.00.90 and the
// desks since v1.02.39.
//
// ## Why it is generated in slices
//
// `nodesNear()` exists because building fifty thousand records to draw two hundred of them is
// the sort of thing that is invisible on a desktop and a two-second stall on a phone. The
// galaxy is queried, not instantiated.

import { makeRng } from '../core/rng.js';
import { GALAXY } from '../core/config.js';
import { STAR_CLASSES, GENESIS_VERSION } from './genesis.js';

/** Bumped when the *arrangement* changes — see `genesisMismatch()` in genesis.js for the rule. */
export const GALAXY_VERSION = 1;

// ── naming ───────────────────────────────────────────────────────────
//
// Catalogue designations, not fantasy names. A galaxy of fifty thousand invented words is
// unreadable and unsearchable; a designation tells you where a thing is before you go there,
// which is what a chart is for. The proper name is the *system's* business — `genesis.js`
// already names the star and its worlds — and this is the label on the map.
const SECTORS = ['AQ', 'BR', 'CN', 'DR', 'ER', 'FX', 'GM', 'HL', 'IO', 'KP',
                 'LY', 'MC', 'NX', 'OR', 'PV', 'QS', 'RG', 'SL', 'TU', 'VN'];

/**
 * A designation like `MC-7·441`. Sector letters come from the *position*, so two stars near
 * each other share a prefix and the chart is readable by eye — a name that carries no
 * locality is a random string with extra steps.
 */
export function designation(node) {
  const ring = Math.min(9, Math.floor(node.r / (GALAXY.radius / 9)));
  const sector = SECTORS[Math.floor(((node.theta % TAU) + TAU) % TAU / TAU * SECTORS.length) % SECTORS.length];
  return `${sector}-${ring}·${String(node.i % 1000).padStart(3, '0')}`;
}

const TAU = Math.PI * 2;

// ── the seed chain ───────────────────────────────────────────────────

/**
 * The system seed for a node — **the join between this file and `genesis.js`**.
 *
 * Mixed rather than concatenated, and mixed with a constant that is not any of the four
 * genesis stream constants. `generateSystem()` derives its four streams by XOR-ing the seed
 * with fixed masks, so handing it `galaxySeed + index` would make neighbouring systems share
 * low bits and produce visibly correlated star classes down an arm — the failure mode is a
 * whole spiral arm of red dwarfs, which looks like a bug and is one.
 */
export function systemSeed(galaxySeed, index) {
  let h = (galaxySeed ^ 0x6d2b79f5) >>> 0;
  h = Math.imul(h ^ (index + 0x9e3779b9), 0x85ebca6b) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

// ── the shape ────────────────────────────────────────────────────────

/**
 * One node, derived.
 *
 * The spiral is a log spiral per arm with scatter that widens outward, which is the cheap
 * approximation everyone uses and is right for the same reason: arms are density waves, so
 * they are tight and bright at the core and frayed at the rim. Height falls off exponentially
 * with radius — a galaxy is a disc, and a spherical scatter reads as a globular cluster.
 */
export function nodeAt(galaxySeed, i) {
  const r = makeRng((galaxySeed ^ Math.imul(i + 1, 0x27d4eb2d)) >>> 0);

  // Radius: sqrt-biased so area density is roughly even rather than piling everything at the
  // centre, then pulled inward a little so the core is genuinely denser than the rim.
  const u = r.next();
  const rad = Math.pow(u, GALAXY.coreBias) * GALAXY.radius;

  const arm = Math.floor(r.next() * GALAXY.arms);
  const armAngle = (arm / GALAXY.arms) * TAU;
  const spiral = rad * GALAXY.twist + armAngle;
  // Scatter widens with radius: tight near the core, frayed at the edge.
  const scatter = (r.next() - 0.5) * (GALAXY.armSpread + rad * GALAXY.armFray);
  const theta = spiral + scatter;

  const height = (r.next() - 0.5) * GALAXY.thickness * Math.exp(-rad / GALAXY.radius * 2.2);

  const seed = systemSeed(galaxySeed, i);
  // Star class from the *system's own* seed, not a fresh draw — so the class on the chart and
  // the star you arrive at are guaranteed to be the same object. Reproduces the first draw
  // `generateSystem()` makes, and `test/galaxy.mjs` asserts the two agree for every node it
  // checks. If genesis ever changes its draw order this assertion is what fails, loudly,
  // rather than the chart quietly lying.
  const cls = classFor(seed);

  return {
    i,
    x: Math.cos(theta) * rad,
    y: height,
    z: Math.sin(theta) * rad,
    r: rad, theta,
    arm,
    seed,
    cls: cls.key,
    color: cls.color,
    // Bright, hot stars are visible further. Used by the chart for point size, and by
    // `scanRange()` for how far a survey can resolve one.
    lum: cls.lum
  };
}

/** The star class `generateSystem(seed)` will pick — the same draw, from the same stream. */
export function classFor(seed) {
  const rStar = makeRng((seed ^ 0x51a2) >>> 0);
  const total = STAR_CLASSES.reduce((a, c) => a + c.weight, 0);
  let roll = rStar.next() * total;
  for (const c of STAR_CLASSES) {
    roll -= c.weight;
    if (roll <= 0) return c;
  }
  return STAR_CLASSES[0];
}

// ── queries ──────────────────────────────────────────────────────────

/**
 * Every node within `range` of a point.
 *
 * Brute force over `count`, deliberately. A spatial index would be the right answer if this
 * were called per frame, and it is not — the chart asks when it opens and when the player
 * moves a meaningful distance. At the default fifty thousand this is a few milliseconds, and
 * an index that has to be rebuilt whenever the galaxy seed changes is a cache with a lifetime
 * problem in exchange for time nobody was spending.
 *
 * If this ever does go per-frame, `systems/broadphase.js` already exists and is the answer.
 */
export function nodesNear(galaxySeed, cx, cy, cz, range, limit = 400) {
  const out = [];
  const r2 = range * range;
  for (let i = 0; i < GALAXY.count; i++) {
    const n = nodeAt(galaxySeed, i);
    const dx = n.x - cx, dy = n.y - cy, dz = n.z - cz;
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 > r2) continue;
    n.dist = Math.sqrt(d2);
    out.push(n);
  }
  out.sort((a, b) => a.dist - b.dist);
  return out.length > limit ? out.slice(0, limit) : out;
}

/** The nearest node to a point — what "which system am I in" means. */
export function nodeNearest(galaxySeed, cx, cy, cz) {
  let best = null, bestD = Infinity;
  for (let i = 0; i < GALAXY.count; i++) {
    const n = nodeAt(galaxySeed, i);
    const dx = n.x - cx, dy = n.y - cy, dz = n.z - cz;
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 < bestD) { bestD = d2; best = n; }
  }
  if (best) best.dist = Math.sqrt(bestD);
  return best;
}

/**
 * A node that would make a decent starting berth.
 *
 * Out on an arm rather than in the core — the core is where the traffic and the trouble are,
 * and a first flight should be quiet — and around a star whose habitable zone is somewhere a
 * new pilot can actually reach. Deterministic in the galaxy seed, so "new game, same seed"
 * starts you in the same place.
 */
export function homeNode(galaxySeed) {
  const lo = GALAXY.radius * GALAXY.homeBand[0];
  const hi = GALAXY.radius * GALAXY.homeBand[1];
  for (let i = 0; i < GALAXY.count; i++) {
    const n = nodeAt(galaxySeed, i);
    if (n.r < lo || n.r > hi) continue;
    if (!GALAXY.homeClasses.includes(n.cls)) continue;
    return n;
  }
  // Every galaxy has one — the class list covers 53% of the weight table and the band is a
  // third of the disc — but a generator that can return nothing is a generator that will.
  return nodeAt(galaxySeed, 0);
}

/** Fuel cost between two nodes. Superlinear, so a long hop is not just a slow short one. */
export function jumpCost(a, b) {
  const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  return Math.ceil(d * GALAXY.fuelPerLy + d * d * GALAXY.fuelQuad);
}

export const jumpRange = () => GALAXY.jumpRange;

/** Everything the chart needs about one node, in one call. */
export function nodeReport(galaxySeed, i) {
  const n = nodeAt(galaxySeed, i);
  const cls = STAR_CLASSES.find(c => c.key === n.cls) || STAR_CLASSES[0];
  return {
    node: n,
    name: designation(n),
    className: cls.name,
    classKey: cls.key,
    lum: cls.lum,
    seed: n.seed,
    arm: n.arm,
    // What is actually there is `generateSystem(n.seed)` — deliberately not called here, so
    // drawing a thousand chart points does not generate a thousand systems.
    genesis: GENESIS_VERSION,
    galaxy: GALAXY_VERSION
  };
}

/**
 * Where a legacy flight sits on the chart.
 *
 * A save written before v1.02.44 carries a system seed and no node, and the whole point of the
 * v17 migration was that you do not regenerate somebody's world underneath them — every
 * station, contract, company registration and hauler route is keyed by name, and renaming them
 * dangles all of it at once. So the flight keeps the system it has always had, and this finds
 * it a **place** for it: the first node in the home band whose star class matches the one they
 * are actually orbiting.
 *
 * That matters because of the rule the rest of this file is built on — the chart may not lie.
 * Dropping an old flight on an arbitrary node would put a G-class marker on the map above a
 * pilot sitting under a red dwarf, which is exactly the failure `classFor()` exists to prevent.
 * Matching the class means the marker and the sky agree, which is all the chart ever claimed.
 *
 * Deterministic in `(galaxySeed, class)`, so a save placed once is placed there for ever.
 */
export function placeExisting(galaxySeed, starClass) {
  const lo = GALAXY.radius * GALAXY.homeBand[0];
  const hi = GALAXY.radius * GALAXY.homeBand[1];
  for (let i = 0; i < GALAXY.count; i++) {
    const n = nodeAt(galaxySeed, i);
    if (n.r < lo || n.r > hi) continue;
    if (n.cls === starClass) return n;
  }
  // Every class in the table appears within the band at this count — the rarest is O at 1% of
  // 50,000 — but a placer that can return nothing is a placer that eventually will.
  return homeNode(galaxySeed);
}

/** Summary line for the chart header. */
export function galaxyLine(galaxySeed) {
  return `${GALAXY.count.toLocaleString()} systems · ${GALAXY.arms} arms · seed ${galaxySeed >>> 0}`;
}
