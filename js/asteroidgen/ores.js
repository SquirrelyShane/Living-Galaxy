import { ORES as GAME_ORES, MINERALS } from "../economy/materials.js";
import { oreLook, hexToRgb as rgb } from "../world/rockgen.js";
import { CLASSES } from "../bodygen/classes.js";

const MINERAL = new Map(MINERALS.map((m) => [m.id, m]));

export const ORES = {};
for (const o of GAME_ORES) {
  const look = oreLook(o.id);
  const refined = MINERAL.get(o.refine?.mineral);
  ORES[o.id] = {
    id: o.id,
    name: o.name,
    formula: refined ? refined.name : o.id,
    category: look.category,
    color: look.albedo,
    emissive: 0,
    metalness: look.metal,
    roughness: look.rough,
    rarity: Math.max(0.08, Math.min(0.92, 1 - o.yield / 1.8)),
    value: o.value,
    mass: o.mass,
    yield: o.yield,
    found: o.found,
    refine: o.refine,
    refinedValue: refined ? refined.value : o.value,
    glow: look.glow ?? 0,
    crystal: look.crystal ?? "nugget",
    blurb: look.note || o.name,
  };
}

export const ASTEROID_CLASSES = {};
for (const [id, c] of Object.entries(CLASSES)) {
  ASTEROID_CLASSES[id] = {
    id,
    name: c.name,
    tag: c.tag,
    baseColor: c.base,
    accent: c.accent,
    density: c.density,
    roughness: c.roughness,
    metalness: c.metalness,
    description: c.note,
    ores: c.ores,
  };
}

export const CLASS_ORDER = ["C", "B", "S", "M", "V", "E", "D", "P", "X"];

export const hexToRgb = rgb;

export function lerpColor(a, b, t) {
  const A = rgb(a);
  const B = rgb(b);
  return { r: A.r + (B.r - A.r) * t, g: A.g + (B.g - A.g) * t, b: A.b + (B.b - A.b) * t };
}
