/* Public surface of the ship generator. Import from here unless you want a specific module.
 *
 *   import { buildShip, tick, opsBind, opsUpdate, setOpsHost } from ".../src/index.js";
 */

/* --- generation ---------------------------------------------------- */
export { buildShip, releaseShip, randomConfig, shipBounds, loadoutFor, normalizeConfig, DEFAULT_CFG } from "./generate.js";
export { StarshipBuilder } from "./builder/StarshipBuilder.js";
export { RNG } from "./core/rng.js";
export { G, FINISHES, makeMat, addMesh, wingShape, disposeDeep } from "./core/geometry.js";

/* --- data tables ---------------------------------------------------- */
export { SHIP_CLASSES, EQUIP_DEFAULT, CLASS_EQUIP } from "./data/classes.js";
export { DRIVE_TYPES } from "./data/drives.js";
export { WEAPON_TYPES } from "./data/weapons.js";
export { FACTION_PALETTES } from "./data/palettes.js";
export { CATALOG, PARTS, WEAPON_PART } from "./data/catalog/index.js";
export { PREFABS, ALL_FACES, fpArea } from "./prefabs/index.js";
export { CORE, CLASS_LOADOUT, expandLoadout, doctrineLoadout } from "./data/loadouts.js";

/* --- analysis ------------------------------------------------------- */
export { REGIMES, DESIGN_REGIMES, HULL_CD, analyzeFlight, optimizeDrag } from "./data/flight.js";
export { MATERIALS, COMPONENTS } from "./data/materials.js";
export { partBom, expandBom, bomMass, hullBom, shipBom } from "./data/bom.js";

/* --- idle animation (thrusters, spins, lamps, sensor sweeps) --------- */
export { newRegistry, collectInto, disposeShip, tick } from "./anim.js";

/* --- live systems (fire control, mining, docking, deployables) ------- */
export { setOpsHost, host } from "./ops/host.js";
export { rig } from "./ops/rig.js";
export { ops, opsBind, opsUpdate, doScan, startMining, stopMining, aimAngles,
         fireShot, fireLauncher, targetDrone, colliderGroup } from "./ops/ops.js";
export { fxUpdate } from "./ops/fx.js";
