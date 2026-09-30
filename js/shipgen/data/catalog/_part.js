export function P(id, name, prefab, o = {}) {
  return Object.assign({ id, name, prefab, size: 1, tags: [], mass: 1, pwr: 0, heat: 0, faces: null }, o);
}
export const INT = ["internal"];
