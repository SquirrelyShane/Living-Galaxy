/* Public surface of the station generator. Import from here. */
export { buildStation, releaseStation, randomConfig, normalizeConfig, stationBounds, DEFAULT_CFG } from "./generate.js";
export { StationBuilder } from "./builder/StationBuilder.js";
export { STYLES } from "./builder/hull.js";
export { HANGAR, MOUTHS, HANGAR_FORMS, hangarPlan } from "./builder/hangar.js";
export { STYLES_ARCH, STYLE_KEYS, roll } from "./data/styles.js";
export { FORMS, FORM_KEYS, DECOR, body, decorate } from "./prefabs/forms.js";
export { RNG } from "./core/rng.js";
export { G, makeMat, addMesh, mergeStatic, instanced, disposeOwned } from "./core/geometry.js";
export { MODULES, MODULE_COUNT, REQUIRED, ZONE } from "./data/modules.js";
export { PARTS, PART_DOMAINS, PART_COUNT } from "./data/parts.js";
export { MATERIALS, FAB_RATE, ALLOYS, ALLOY_KEYS } from "./data/materials.js";
export { ARCHETYPES, ARCHETYPE_KEYS } from "./data/archetypes.js";
export { TIERS, TIER_KEYS } from "./data/tiers.js";
export { doctrineFor, manifestOf } from "./data/doctrine.js";
export { partBom, partCost, moduleParts, moduleBom, stationBom } from "./data/bom.js";
export { PREFABS } from "./prefabs/modules.js";
export { newRegistry, collectInto, tick, disposeAnim, bake } from "./anim.js";
