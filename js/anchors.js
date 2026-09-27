/* LIVING GALAXY — what a mark is pinned to.
 *
 * 0.3.67. A waypoint used to be a point: `addWaypointAt(name, x, y, z)` copied
 * where something was at the moment you marked it, and only a world (`wp.body`)
 * was ever followed. Everything else moves — a port rides its host, a belt rock
 * wobbles on its cell, a hull flies, a drone works — so the mark was left in
 * empty space. And MINE IT marked a job's SURVEY POINT, the middle of a seam,
 * which is the one place in it with no rock.
 *
 * A mark now carries an `anchor` ({ kind, id, … }) and its position is asked of
 * the thing it names, every time it is read. The resolvers live here, with no
 * imports, so any module can register one without a load-order cycle (sim.js
 * imports contracts.js, which imports sim.js — a registry on sim.js itself
 * would be read in its temporal dead zone).
 *
 * A resolver is (anchor, time, out) → out, or null when the thing is gone. It
 * may write `anchor.label` (what it is pinned to now, for the chart) and, for a
 * site, `anchor.key` (which rock carries the mark).
 */

export const anchorKinds = new Map();

/** Register how to find a kind of thing. Last registration wins. */
export function registerAnchor(kind, fn) {
  anchorKinds.set(kind, fn);
}

/** → out with x/y/z, or null (gone, unknown kind, or no anchor). */
export function resolveAnchor(anchor, time, out = { x: 0, y: 0, z: 0 }) {
  if (!anchor) return null;
  const fn = anchorKinds.get(anchor.kind);
  if (!fn) return null;
  try {
    const p = fn(anchor, time, out);
    return p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z) ? p : null;
  } catch {
    return null;
  }
}

/** A plain label for the chart: what a mark of this kind follows. */
export function anchorHint(anchor) {
  if (!anchor) return "fixed point";
  return ({
    asteroid: "tracks the rock", site: "tracks the seam's rock", station: "tracks the port", vessel: "tracks the hull",
    boat: "tracks the hull", drone: "tracks the drone", nest: "tracks the nest", body: "tracks the body",
    beacon: "tracks the beacon", rock: "tracks the rogue", debris: "tracks the debris", job: "tracks the job",
  })[anchor.kind] ?? "tracked";
}
