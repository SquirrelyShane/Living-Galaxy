/* generate.js — one-call entry point.
 *
 *   import { buildStation } from ".../src/generate.js";
 *   const st = buildStation({ seed: "PORT-7", archetype: "tradehub", tier: "II" });
 *   scene.add(st.root);
 *   // per frame: tick(st.anim, dt, t)
 *
 * Returns { root, builder, cfg, anim, stats } — stats carries the manifest,
 * the parts list by domain, the bill of materials, population, crew, power
 * and heat balance, cost, and what the placement solver could not fit. */
import * as THREE from "three";
import { StationBuilder } from "./builder/StationBuilder.js";
import { ARCHETYPES, ARCHETYPE_KEYS } from "./data/archetypes.js";
import { TIERS, TIER_KEYS } from "./data/tiers.js";
import { STYLES } from "./builder/hull.js";
import { stationBom } from "./data/bom.js";
import { newRegistry, collectInto, disposeAnim, bake } from "./anim.js";
import { disposeOwned } from "./core/geometry.js";
import { RNG } from "./core/rng.js";
import { HANGAR } from "./builder/hangar.js";
import { STYLES_ARCH, STYLE_KEYS } from "./data/styles.js";
import { ALLOYS } from "./data/materials.js";

export const DEFAULT_CFG = {
  seed: "STATION-01",
  archetype: "tradehub",   // ARCHETYPES key
  tier: null,              // TIERS key; null = the archetype's default
  hull: null,              // STYLES key; null = the archetype's own grammar; "auto" = one the style favours
  style: null,             // STYLES_ARCH key (cathedral | bastion | civic | industrial | frontier | research | agrarian); null = the archetype's
  alloy: null,             // ALLOYS key the hull is skinned in; null = one the style favours
  shieldShell: true,       // draw the faint shield shell when emitters are fitted
  hangars: null,           // hangar mouths; null = archetype default
  scale: 1,                // spine length multiplier
  girth: 1,                // spine radius multiplier
  complexity: 0.6,         // greeble density 0–1
  finish: null,            // brushed | matte | chrome | ceramic | weathered
  palette: null,           // { hull, dark, accent, glow } overrides
  sun: [1, 0.35, 0.2],     // where the light comes from: solar faces it, radiators go edge-on, reactors hide
  merge: true,             // bake statics per material
  center: true,            // centre the group on its bounding box
  manifest: null,          // explicit { moduleId: count } to skip the doctrine
};

export function normalizeConfig(opts = {}) {
  const cfg = { ...DEFAULT_CFG, ...opts };
  cfg.seed = String(cfg.seed ?? DEFAULT_CFG.seed);
  if (!ARCHETYPES[cfg.archetype]) cfg.archetype = DEFAULT_CFG.archetype;
  if (!cfg.tier || !TIERS[cfg.tier]) cfg.tier = ARCHETYPES[cfg.archetype].tier;
  if (cfg.hull && cfg.hull !== "auto" && !STYLES[cfg.hull]) cfg.hull = null;
  if (cfg.style && !STYLES_ARCH[cfg.style]) cfg.style = null;
  if (cfg.alloy && !ALLOYS[cfg.alloy]) cfg.alloy = null;
  for (const k of ["scale", "girth", "complexity"]) cfg[k] = Number(cfg[k]);
  return cfg;
}

export function buildStation(opts = {}) {
  const cfg = normalizeConfig(opts);
  const builder = new StationBuilder();
  const root = builder.build(cfg);
  /* A station that has never been close enough to animate used to render with
   * every lamp pinned at full brightness and every chase bead at raw white,
   * because nothing had written their instance colours yet. Bake the resting
   * state in at build time so a port is dark until something lights it. */
  const anim = bake(collectInto(newRegistry(), root));
  const bom = stationBom(builder.manifest, builder.alloy);
  const stats = {
    archetype: builder.arch.label, tier: builder.tier.label, hull: builder.style, seed: cfg.seed,
    style: builder.styleKey, styleLabel: builder.styleArch.label, alloy: builder.alloy, alloyName: ALLOYS[builder.alloy].name,
    hangarForms: builder.hangars.map((h) => `${h.form}/${h.mouth}`), shielded: builder.shielded,
    defence: bom.defence, inhouse: bom.inhouse,
    size: builder.size, lengthM: builder.size.z, spanM: Math.max(builder.size.x, builder.size.y),
    modules: builder.manifest.reduce((a, m) => a + m.count, 0),
    placed: builder.placed.length, unplaced: builder.unplaced.map((m) => m.id),
    hangars: builder.hangars.length, hangar: HANGAR,
    partCount: builder.partCount, lampCount: builder.lampCount, folded: builder.folded,
    population: bom.pop, crew: bom.crew, massT: bom.massT, powerKW: bom.pwr, heatKW: bom.heat, costCr: bom.cr,
    manifest: builder.manifest.map((m) => ({ id: m.module.id, name: m.module.name, count: m.count, role: m.module.role, family: m.module.family })),
    bom,
  };
  return { root, builder, cfg, anim, stats };
}

export function releaseStation(st) {
  disposeAnim(st.root);
  disposeOwned(st.root);
}

/** A plausible random station. */
export function randomConfig(seed = Math.random().toString(36).slice(2), overrides = {}) {
  const rng = new RNG(String(seed));
  const archetype = rng.pick(ARCHETYPE_KEYS);
  return { ...DEFAULT_CFG, seed: String(seed), archetype, tier: rng.chance(0.6) ? ARCHETYPES[archetype].tier : rng.pick(TIER_KEYS),
    hull: rng.chance(0.35) ? "auto" : null, style: rng.chance(0.2) ? rng.pick(STYLE_KEYS) : null,
    scale: +rng.range(0.85, 1.25).toFixed(2), girth: +rng.range(0.85, 1.2).toFixed(2), complexity: +rng.range(0.4, 0.9).toFixed(2), ...overrides };
}

export function stationBounds(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  return { box, size, center: box.getCenter(new THREE.Vector3()), radius: Math.max(size.x, size.y, size.z) * 0.5 };
}
