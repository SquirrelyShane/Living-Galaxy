/* Part record factory shared by every catalog domain file.
 *
 *  id      unique, "<domain>.<name>"            mass   tonnes
 *  prefab  key into src/prefabs (null = drive   pwr    kW  (+ generates, − draws)
 *          selector or hull-level info entry)   heat   kW  (+ produces, − rejects)
 *  tags    doctrine filters + mount bias        size   footprint multiplier
 *  faces   override the prefab's face list      mirror paired port/starboard twin
 *  drive   selects a DRIVE_TYPES family         info   hull-level concept, not mountable
 */
export function P(id, name, prefab, o = {}) {
  return Object.assign({ id, name, prefab, size: 1, tags: [], mass: 1, pwr: 0, heat: 0, faces: null }, o);
}
export const INT = ["internal"];
