export const anchorKinds = new Map();

export function registerAnchor(kind, fn) {
  anchorKinds.set(kind, fn);
}

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

export function anchorHint(anchor) {
  if (!anchor) return "fixed point";
  return ({
    asteroid: "tracks the rock", site: "tracks the seam's rock", station: "tracks the port", vessel: "tracks the hull",
    boat: "tracks the hull", drone: "tracks the drone", nest: "tracks the nest", body: "tracks the body",
    beacon: "tracks the beacon", rock: "tracks the rogue", debris: "tracks the debris", job: "tracks the job",
  })[anchor.kind] ?? "tracked";
}
