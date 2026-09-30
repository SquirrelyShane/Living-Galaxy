import { forgeShip, releaseHull } from "../ships/shipforge.js";
import { shipById, DEFAULT_SHIP_ID } from "../ships/shipdb.js";
import { newRegistry, collectInto } from "../shipgen/anim.js";

const templates = new Map();
const pending = [];

const keyOf = (shipId, variant, color) => `${shipId}:${variant}:${color}`;

export function templateFor(shipId, variant = 0, color = "#9aa4b2") {
  const key = keyOf(shipId, variant, color);
  const hit = templates.get(key);
  if (hit) return hit;
  if (!pending.some((p) => p.key === key)) pending.push({ key, shipId, variant, color });
  return null;
}

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

export function instanceOf(tpl, scale = 1) {
  const keep = tpl.group.userData;
  tpl.group.userData = {};
  const g = tpl.group.clone(true);
  tpl.group.userData = keep;
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
  for (const o of g.userData.gen.anim.pulses) if (o.material) ownMats.push(o.material);
  g.traverse((o) => { if (o.userData?.plume) g.userData.plumes.push(o); });
  g.userData.glow = g.userData.plumes[0] ?? null;
  return g;
}

export function releaseInstance(g) {
  for (const m of g.userData.ownMats ?? []) m.dispose();
  g.userData.ownMats = [];
  g.userData.gen = null;
}

export function drainPool() {
  for (const t of templates.values()) {
    releaseHull(t.group);
    t.group.traverse((o) => { if (o.geometry && !o.geometry.userData?.keep) o.geometry.dispose(); const m = o.material; if (m && !m.userData?.keep) m.dispose?.(); });
  }
  templates.clear();
  pending.length = 0;
}

export function poolStats() { return { templates: templates.size, pending: pending.length }; }
