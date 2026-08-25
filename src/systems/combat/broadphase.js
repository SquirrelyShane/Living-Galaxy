// Living Galaxy — collision broadphase.
//
// Every projectile used to test itself against every NPC, every frame. That is
// projectiles x ships: with the pool at 420 and a 63-ship roster it is 26,000 swept
// segment tests per frame, and slice 4 grows the roster. It is the only loop in the game
// whose cost is a product of two things that both get bigger.
//
// This is a uniform spatial hash. Ships are bucketed into cells once per frame; a
// projectile walks only the cells its own segment actually crosses. The narrow phase —
// the real swept test — is unchanged and still decides every hit, so this changes how
// many candidates get tested, never which ones hit.
//
// A uniform grid rather than a tree because the contents are cheap to rebuild and
// roughly uniformly scaled: rebuilding 63 entries from scratch each frame costs less
// than keeping a tree balanced, and there is no allocation per frame after warm-up.

// Cell size is chosen against what moves through a cell, not against weapon range: it
// only has to be comfortably larger than the biggest collision radius (a bastion, ~51
// units) and than the distance the fastest round covers in one step (a railgun, ~30),
// so a segment usually touches one or two cells. Bigger wastes the grid; smaller makes
// long segments walk too many cells.
const CELL = 900;
const buckets = new Map();        // cell key -> array of entries
const pool = [];                  // reused arrays, so a frame allocates nothing
let poolUsed = 0;
let stamp = 0;

/**
 * Integer cell key. The obvious `${x},${y},${z}` allocates a string for every cell
 * touched by every rebuild and every query — which on a hot frame is thousands of
 * short-lived strings and enough garbage to cost more than the tests the grid saves.
 * A mixed 32-bit integer key allocates nothing.
 *
 * Collisions are acceptable and safe: two distant cells sharing a key only means a few
 * extra candidates reaching the narrow phase, and the narrow phase is exact. A wrong
 * *answer* is impossible; a wasted swept test is the worst case.
 */
const key = (x, y, z) =>
  (Math.imul(x, 0x9E3779B1) ^ Math.imul(y, 0x85EBCA77) ^ Math.imul(z, 0xC2B2AE3D)) | 0;
const cellOf = v => Math.floor(v / CELL);

function bucket(cx, cy, cz) {
  const k = key(cx, cy, cz);
  let b = buckets.get(k);
  if (!b) {
    b = pool[poolUsed] || (pool[poolUsed] = []);
    poolUsed++;
    b.length = 0;
    buckets.set(k, b);
  }
  return b;
}

// Lazy rebuild. The grid is only worth building on a frame where something actually
// queries it. Rebuilding unconditionally cost more than it saved on the many frames
// that have no rounds in the air at all — a warp crossing spends thousands of frames
// like that — so a frame declares the grid stale and the first query pays to build it.
let pending = null, pendingRadius = null;

export function markStale(items, radiusOf) {
  pending = items;
  pendingRadius = radiusOf;
}

function ensureBuilt() {
  if (!pending) return;
  const items = pending, radiusOf = pendingRadius;
  pending = null;
  build(items, radiusOf);
}

/**
 * Rebuild the grid. `items` are objects with `.position`; `radiusOf` gives each one's
 * collision radius so a big station-sized bastion still lands in every cell it spans.
 */
export function rebuild(items, radiusOf) {
  pending = null;
  return build(items, radiusOf);
}

function build(items, radiusOf) {
  buckets.clear();
  poolUsed = 0;
  stamp++;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const p = it.position;
    const r = radiusOf ? radiusOf(it) : 0;
    const x0 = cellOf(p.x - r), x1 = cellOf(p.x + r);
    const y0 = cellOf(p.y - r), y1 = cellOf(p.y + r);
    const z0 = cellOf(p.z - r), z1 = cellOf(p.z + r);
    for (let x = x0; x <= x1; x++)
      for (let y = y0; y <= y1; y++)
        for (let z = z0; z <= z1; z++)
          bucket(x, y, z).push(it);
  }
  return items.length;
}

/**
 * Visit every item whose cell the segment a→b touches, padded by `pad`.
 * `fn(item)` returning true stops the walk — the caller's first hit ends it.
 *
 * Each item is visited at most once per query even when it spans several cells, which
 * is what the visit stamp is for. Double-resolving one round against one ship because
 * that ship straddled a cell boundary would be a very hard bug to find later.
 */
export function querySegment(a, b, pad, fn) {
  ensureBuilt();
  const x0 = cellOf(Math.min(a.x, b.x) - pad), x1 = cellOf(Math.max(a.x, b.x) + pad);
  const y0 = cellOf(Math.min(a.y, b.y) - pad), y1 = cellOf(Math.max(a.y, b.y) + pad);
  const z0 = cellOf(Math.min(a.z, b.z) - pad), z1 = cellOf(Math.max(a.z, b.z) + pad);
  const visit = ++stamp;

  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        const b2 = buckets.get(key(x, y, z));
        if (!b2) continue;
        for (let i = 0; i < b2.length; i++) {
          const it = b2[i];
          if (it.__bpVisit === visit) continue;
          it.__bpVisit = visit;
          if (fn(it)) return true;
        }
      }
    }
  }
  return false;
}

/** Everything within `r` of a point. Used by point defence and decoy checks. */
export function queryRadius(centre, r, fn) {
  ensureBuilt();
  const c0 = cellOf(centre.x - r), c1 = cellOf(centre.x + r);
  const d0 = cellOf(centre.y - r), d1 = cellOf(centre.y + r);
  const e0 = cellOf(centre.z - r), e1 = cellOf(centre.z + r);
  const visit = ++stamp;
  const r2 = r * r;
  for (let x = c0; x <= c1; x++)
    for (let y = d0; y <= d1; y++)
      for (let z = e0; z <= e1; z++) {
        const b2 = buckets.get(key(x, y, z));
        if (!b2) continue;
        for (let i = 0; i < b2.length; i++) {
          const it = b2[i];
          if (it.__bpVisit === visit) continue;
          it.__bpVisit = visit;
          if (it.position.distanceToSquared(centre) <= r2 && fn(it)) return true;
        }
      }
  return false;
}

export const cellSize = () => CELL;
export const bucketCount = () => buckets.size;
export function resetBroadphase() { buckets.clear(); poolUsed = 0; stamp = 0; pending = null; }
const isStale = () => pending !== null;
