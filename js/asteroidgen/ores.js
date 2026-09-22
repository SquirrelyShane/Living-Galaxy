/* LIVING GALAXY — the asteroid generator's mineral catalogue, answered from the game.
 *
 * This is the ONE file in js/asteroidgen/ that is not the generator's own. The
 * drop-in shipped a forty-species catalogue (kamacite, chalcopyrite, impact
 * diamond…) plus, from v1.01, a second table that re-mapped its classes onto
 * this game's ore ids. Carrying either would be a second mineral list: a rock
 * that assays "chalcopyrite" and then puts "copper ore" in the hold is two
 * games. So every name the generator imports from here is BUILT from the lists
 * the game already has:
 *
 *   ORES               js/materials.js ORES (name, value, yield, refine)
 *                      + js/rockgen.js oreLook() (albedo, family, PBR, glow)
 *   ASTEROID_CLASSES   js/bodygen/classes.js CLASSES (the nine taxonomic classes,
 *                      weights already written in materials.js ids)
 *
 * The export names and field names are the generator's, so generator.js,
 * debris.js and the rest import from here unchanged. Upgrading the generator is
 * dropping a newer tree over js/asteroidgen/ and keeping this file.
 */

import { ORES as GAME_ORES, MINERALS } from "../materials.js";
import { oreLook, hexToRgb as rgb } from "../rockgen.js";
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
    /* the generator's rarity is "how hard to find", off the same yield the
     * field and the assay already use */
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
