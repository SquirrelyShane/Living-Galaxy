/* Prefab registry. Every catalog part names one of these keys. To add a prefab,
 * export it from one of the group files (or a new file) and merge it here. */
import internal from "./internal.js";
import structure from "./structure.js";
import power from "./power.js";
import acs from "./acs.js";
import sensors from "./sensors.js";
import docking from "./docking.js";
import industrial from "./industrial.js";
import weapons from "./weapons.js";
import extra from "./extra.js";
export { ALL_FACES } from "./_common.js";

export const PREFABS = Object.assign({}, internal, structure, power, acs, sensors, docking, industrial, weapons, extra);

/* footprint area used to sort the mounting order (biggest first) */
export function fpArea(p) {
  const pf = PREFABS[p.prefab]; if (!pf) return 0;
  const f = pf.fp(p.size || 1, p, "top"); return f.w * f.d;
}
