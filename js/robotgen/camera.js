// robotgen/src/camera.js — framing math, kept out of demo.html so it can be
// checked headless (test/framing.js). Two rules:
//   1. fit the MEASURED bounding sphere, not the nominal height — antennas,
//      backpacks, outstretched arms and track pods all stick out past it;
//   2. frame into the band left between the title bar and the HUD, so nothing
//      important sits behind the panel.
// A sphere is rotation-invariant, so orbiting never pushes the robot off screen.

export function fitCamera(o) {
  const fovDeg = o.fovDeg === undefined ? 42 : o.fovDeg;
  const padding = o.padding === undefined ? 1.08 : o.padding;
  const viewW = o.viewW, viewH = o.viewH;
  const bandH = Math.max(120, viewH - o.topPx - o.bottomPx);
  const bandCenter = o.topPx + bandH / 2;

  const vfov = fovDeg * Math.PI / 180;
  const aspect = Math.max(0.3, viewW / viewH);
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
  const vfovBand = 2 * Math.atan(Math.tan(vfov / 2) * (bandH / viewH));

  // Fit a standing cylinder, not a sphere: the horizontal radius is invariant
  // under yaw (so orbiting is safe) but a tall thin robot is no longer pushed
  // far away just because its height inflated a sphere radius.
  const rXZ = Math.max(0.1, o.radiusXZ !== undefined ? o.radiusXZ : o.radius);
  const halfH = Math.max(0.1, o.halfHeight !== undefined ? o.halfHeight : o.radius);
  const pitch = o.pitch === undefined ? 0.16 : o.pitch;
  const dV = (halfH * Math.cos(pitch) + rXZ * Math.sin(pitch)) / Math.tan(vfovBand / 2) + rXZ;
  const dH = rXZ / Math.tan(hfov / 2) + rXZ;
  const dist = Math.max(dV, dH) * padding;

  const wpp = 2 * dist * Math.tan(vfov / 2) / viewH;      // world metres per pixel
  const c = o.center || { x: 0, y: halfH, z: 0 };
  return {
    dist,
    target: { x: c.x, y: c.y + (bandCenter - viewH / 2) * wpp, z: c.z },
    bandH, bandCenter, wpp, fovDeg
  };
}

/* standing-cylinder bound from an axis-aligned box (shape that bounds() returns) */
export function focusFromBox(b) {
  const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2, cz = (b.minZ + b.maxZ) / 2;
  const radiusXZ = Math.hypot(b.maxX - cx, b.maxZ - cz);
  const halfHeight = b.maxY - cy;
  return { center: { x: cx, y: cy, z: cz }, radiusXZ, halfHeight, radius: Math.hypot(radiusXZ, halfHeight) };
}

export function orbitPosition(target, yaw, pitch, dist) {
  const cp = Math.cos(pitch);
  return {
    x: target.x + Math.sin(yaw) * cp * dist,
    y: target.y + Math.sin(pitch) * dist,
    z: target.z + Math.cos(yaw) * cp * dist
  };
}

export function clampOrbit(cam, focus) {
  const r = Math.max(0.5, focus.radius || 1);
  const cy = (focus.center && focus.center.y) || r;
  cam.pitch = Math.max(-0.25, Math.min(1.05, cam.pitch));
  cam.dist = Math.max(r * 0.35, Math.min(r * 40, cam.dist));
  cam.target.y = Math.max(cy - r * 3, Math.min(cy + r * 3, cam.target.y));
  cam.target.x = Math.max(-r * 6, Math.min(r * 6, cam.target.x));
  cam.target.z = Math.max(-r * 6, Math.min(r * 6, cam.target.z));
  return cam;
}
