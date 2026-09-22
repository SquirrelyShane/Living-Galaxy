/* Weapon families used by class doctrine (arms mix) and the Drydock weapon-suite select.
 * Geometry lives in src/builder/weapons.js, catalog rows in data/catalog/18-safety-defense.js. */
export const WEAPON_TYPES = {
  railgun:  { label: "Railgun",         size: 1.35, mounts: ["top", "side"] },
  beam:     { label: "Beam Turret",     size: 1.0,  mounts: ["top", "bottom", "side"] },
  missile:  { label: "Missile VLS",     size: 1.15, mounts: ["top", "side"] },
  plasma:   { label: "Plasma Cannon",   size: 1.2,  mounts: ["top", "side", "bottom"] },
  pdc:      { label: "Point Defense",   size: 0.6,  mounts: ["top", "bottom", "side"] },
  torpedo:  { label: "Torpedo Tubes",   size: 1.5,  mounts: ["side", "bottom"] },
  coil:     { label: "Coilgun",         size: 1.2,  mounts: ["top", "side"] },
  auto:     { label: "Autocannon",      size: 0.9,  mounts: ["top", "bottom", "side"] },
  flak:     { label: "Flak Turret",     size: 1.0,  mounts: ["top", "side"] },
  lance:    { label: "Plasma Lance",    size: 1.3,  mounts: ["top", "side"] },
  particle: { label: "Particle Beam",   size: 1.3,  mounts: ["top", "side"] },
  ciws:     { label: "Laser CIWS",      size: 0.7,  mounts: ["top", "bottom", "side"] },
  kkv:      { label: "KKV Interceptors",size: 1.0,  mounts: ["top", "side"] },
  nuke:     { label: "Nuclear Standoff",size: 1.2,  mounts: ["top", "side"] },
  emp:      { label: "EMP Missiles",    size: 1.0,  mounts: ["top", "side"] },
  cluster:  { label: "Cluster Munitions",size: 1.1, mounts: ["top", "side"] }
};
