// Living Galaxy — level of detail.
//
// Every planet in Solaris was built once, at full tessellation, and drawn at that
// tessellation whether it filled the screen or occupied four pixels on the far side of
// the system. There are up to nine planets, six moons each, and a station roster on top,
// and most of them are always distant — which means most of the vertex work every frame
// was being spent on things too small to see.
//
// The rule here is **screen size, not distance**. Distance alone is the wrong metric: a
// gas giant 20,000 km out subtends more of the screen than a station 2,000 km out, and a
// LOD system keyed on distance would give the small nearby thing the detail and the large
// distant one the mush. Screen-space size is what actually decides whether detail is
// visible, so it is what decides whether detail is drawn.

import { LOD } from '../core/config.js';
import { camera } from './scene.js';
import { lodBias } from '../systems/quality.js';

const _v = new THREE.Vector3();
const registry = [];

/**
 * Register a body for LOD. `levels` is an array of meshes ordered best-first; exactly one
 * is visible at a time. Anything without levels is still tracked for culling.
 */
export function register(obj, radius, levels) {
  if (!obj) return obj;
  obj.__lod = { radius: radius || 1, levels: levels || null, current: -1, screen: 0 };
  registry.push(obj);
  return obj;
}

export function unregister(obj) {
  const i = registry.indexOf(obj);
  if (i >= 0) registry.splice(i, 1);
  if (obj) obj.__lod = null;
}

/**
 * Approximate fraction of screen height a sphere of `radius` at `distance` covers.
 * The small-angle form is used deliberately: it is one divide, it is exact enough for a
 * threshold test, and the trigonometric version costs more than the vertices it saves.
 */
export function screenSize(radius, distance, fovDeg, viewportH) {
  if (distance <= 0) return 1;
  const fov = (fovDeg || 68) * Math.PI / 180;
  const projected = (radius / distance) / Math.tan(fov / 2);
  return Math.max(0, Math.min(1, projected));
}

/** Which level index a given screen size deserves, given the quality bias. */
export function levelFor(screen, count) {
  if (count <= 1) return 0;
  const bias = lodBias();
  for (let i = 0; i < LOD.thresholds.length && i < count - 1; i++) {
    if (screen >= LOD.thresholds[i] / bias) return i;
  }
  return count - 1;
}

/**
 * Update every registered body. Runs once per rendered frame, not per simulation step —
 * LOD is a property of the view, and the view only changes when a frame is drawn.
 */
export function updateLod(viewportH) {
  if (!camera) return 0;
  const fov = camera.fov || 68;
  let changes = 0;

  for (let i = 0; i < registry.length; i++) {
    const obj = registry[i];
    const l = obj.__lod;
    if (!l) continue;

    const dist = _v.copy(obj.position).sub(camera.position).length();
    l.screen = screenSize(l.radius, dist, fov, viewportH);

    // Cull first: something below the cull threshold is smaller than a pixel and there
    // is no level of detail worth drawing for it at all.
    const visible = l.screen >= LOD.cull;
    if (obj.visible !== visible) { obj.visible = visible; changes++; }
    if (!visible || !l.levels) continue;

    const want = levelFor(l.screen, l.levels.length);
    if (want === l.current) continue;
    for (let j = 0; j < l.levels.length; j++) {
      if (l.levels[j]) l.levels[j].visible = (j === want);
    }
    l.current = want;
    changes++;
  }
  return changes;
}

export const lodCount = () => registry.length;

export function lodReport() {
  const buckets = new Array(LOD.thresholds.length + 1).fill(0);
  let culled = 0;
  for (const obj of registry) {
    const l = obj.__lod;
    if (!l) continue;
    if (!obj.visible) { culled++; continue; }
    buckets[Math.max(0, l.current)]++;
  }
  return { tracked: registry.length, culled, buckets };
}

export function resetLod() {
  for (const o of registry) if (o) o.__lod = null;
  registry.length = 0;
}
