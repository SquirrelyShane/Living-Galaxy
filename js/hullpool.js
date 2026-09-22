/* LIVING GALAXY — the hull pool.
 *
 * Forging a hull through the generator costs tens of milliseconds and a
 * few thousand triangles of its own geometry. The flow (npc/flow.js) wants
 * a hundred boats on the board. So the pool forges each (hull id, variant)
 * once — a lite build, a seed and a livery of its own — and hands out
 * instances that share its geometry and materials. An instance is a
 * three.js clone: its own transform, its own scale jitter, its own plume
 * materials (so throttle reads per boat), everything else by reference.
 * Forty templates cover the whole sky; the GPU sees one copy of each.
 *
 * Templates are built lazily, one per call to `warm()`, so the engine can
 * spread the cost over frames the way it already does for traffic hulls.
 */

import { forgeShip, releaseHull } from "./shipforge.js";
import { shipById, DEFAULT_SHIP_ID } from "./shipdb.js";
import { newRegistry, collectInto } from "./shipgen/anim.js";

const templates = new Map();   // key → { group, key }
const pending = [];            // keys waiting to be forged

const keyOf = (shipId, variant, color) => `${shipId}:${variant}:${color}`;

/** Ask for a template; null until `warm()` has forged it. */
export function templateFor(shipId, variant = 0, color = "#9aa4b2") {
  const key = keyOf(shipId, variant, color);
  const hit = templates.get(key);
  if (hit) return hit;
  if (!pending.some((p) => p.key === key)) pending.push({ key, shipId, variant, color });
  return null;
}

/** Forge up to `n` pending templates. Returns how many were built. */
export function warm(n = 1) {
  let built = 0;
  while (built < n && pending.length) {
    const p = pending.shift();
    if (templates.has(p.key)) continue;
    const def = shipById(p.shipId) ?? shipById(DEFAULT_SHIP_ID);
    const group = forgeShip(def, `pool:${p.variant}`, { primary: p.color, detail: "lite" });
    group.userData.poolKey = p.key;
    templates.set(p.key, { group, key: p.key, def });
    built++;
  }
  return built;
}

/** An instance of a template: shared geometry and materials, own plumes. */
export function instanceOf(tpl, scale = 1) {
  /* Object3D.clone deep-copies userData through JSON — the root's carries the
   * builder and mesh references, so lift it off for the copy. */
  const keep = tpl.group.userData;
  tpl.group.userData = {};
  const g = tpl.group.clone(true);
  tpl.group.userData = keep;
  /* the template's own materials carry `cloned` too (the generator marks what it
   * cloned per build), so the flag cannot tell ours from the shared ones — keep a list */
  const ownMats = [];
  g.traverse((o) => {
    if (o.isMesh && o.userData.plume && o.material) {
      o.material = o.material.clone();
      o.material.userData.cloned = true;
      ownMats.push(o.material);
    }
  });
  g.scale.multiplyScalar(scale);
  g.userData = { def: keep.def, seed: keep.seed, parts: keep.parts, hullScale: keep.hullScale, poolKey: keep.poolKey, gen: { anim: collectInto(newRegistry(), g), pooled: true }, plumes: [], ownMats };
  /* collectInto re-clones every pulse material: those are ours as well */
  for (const o of g.userData.gen.anim.pulses) if (o.material) ownMats.push(o.material);
  g.traverse((o) => { if (o.userData?.plume) g.userData.plumes.push(o); });
  g.userData.glow = g.userData.plumes[0] ?? null;
  return g;
}

/** Free an instance: only what it owns — its plume and pulse materials. */
export function releaseInstance(g) {
  for (const m of g.userData.ownMats ?? []) m.dispose();
  g.userData.ownMats = [];
  g.userData.gen = null;
}

/** Drop every template (sky change). */
export function drainPool() {
  for (const t of templates.values()) {
    releaseHull(t.group);
    t.group.traverse((o) => { if (o.geometry && !o.geometry.userData?.keep) o.geometry.dispose(); const m = o.material; if (m && !m.userData?.keep) m.dispose?.(); });
  }
  templates.clear();
  pending.length = 0;
}

export function poolStats() { return { templates: templates.size, pending: pending.length }; }
