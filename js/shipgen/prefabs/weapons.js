/* Prefabs — Weapon mounts — thin wrappers over the builder's wpn_* family builders.
 * Each prefab: faces (default mount faces), fp(s, part, face) → footprint {w,h,d} in ship units
 * (w along the face u-axis, d along v, h outward), build(g, s, part, S, rng) where g is a group
 * whose +Y points away from the hull and S is the StarshipBuilder (mats, lamp, dockBody…). */
import { ALL_FACES } from "./_common.js";

export default {
  turret_beam:   { faces: ALL_FACES, fp: (s) => ({ w: s * 2.0, h: s * 2.4, d: s * 2.4 }), build(g, s, p, S, rng) { S.wpn_beam(g, s, rng); } },

  turret_rail:   { faces: ALL_FACES, fp: (s) => ({ w: s * 2.2, h: s * 1.9, d: s * 4.0 }), build(g, s, p, S, rng) { S.wpn_railgun(g, s, rng); } },

  turret_plasma: { faces: ALL_FACES, fp: (s) => ({ w: s * 2.0, h: s * 2.1, d: s * 3.2 }), build(g, s, p, S, rng) { S.wpn_plasma(g, s, rng); } },

  turret_pdc:    { faces: ALL_FACES, fp: (s) => ({ w: s * 1.3, h: s * 1.5, d: s * 1.6 }), build(g, s, p, S, rng) { S.wpn_pdc(g, s, rng); } },

  vls:           { faces: ["top", "bottom", "port", "star"], fp: (s) => ({ w: s * 2.2, h: s * 1.25, d: s * 2.6 }),
    build(g, s, p, S, rng) { S.wpn_missile(g, s, rng); g.userData.launcher.ammo = p.ammo || "he"; g.userData.launcher.rate = p.ammo === "nuke" ? 1.6 : p.ammo === "kkv" ? 0.35 : 0.5; } },
  turret_coil:     { faces: ALL_FACES, fp: (s) => ({ w: s * 2.0, h: s * 1.9, d: s * 3.8 }), build(g, s, p, S, rng) { S.wpn_coil(g, s, rng); } },
  turret_auto:     { faces: ALL_FACES, fp: (s) => ({ w: s * 1.7, h: s * 1.5, d: s * 2.2 }), build(g, s, p, S, rng) { S.wpn_auto(g, s, rng); } },
  turret_flak:     { faces: ALL_FACES, fp: (s) => ({ w: s * 1.7, h: s * 1.7, d: s * 2.0 }), build(g, s, p, S, rng) { S.wpn_flak(g, s, rng); } },
  turret_lance:    { faces: ALL_FACES, fp: (s) => ({ w: s * 1.8, h: s * 2.0, d: s * 4.2 }), build(g, s, p, S, rng) { S.wpn_lance(g, s, rng); } },
  turret_particle: { faces: ALL_FACES, fp: (s) => ({ w: s * 2.2, h: s * 2.4, d: s * 3.0 }), build(g, s, p, S, rng) { S.wpn_particle(g, s, rng); } },
  turret_ciws:     { faces: ALL_FACES, fp: (s) => ({ w: s * 1.2, h: s * 1.6, d: s * 1.6 }), build(g, s, p, S, rng) { S.wpn_ciws(g, s, rng); } },
  chaff:           { faces: ALL_FACES, fp: (s) => ({ w: s * 1.5, h: s * 0.9, d: s * 1.2 }), build(g, s, p, S, rng) { S.wpn_chaff(g, s, rng); } },
  minelayer:       { faces: ["stern", "bottom", "port", "star"], fp: (s) => ({ w: s * 2.1, h: s * 1.1, d: s * 1.8 }), build(g, s, p, S, rng) { S.wpn_mines(g, s, rng); } },

  torpedo:       { faces: ["port", "star", "bottom"], fp: (s) => ({ w: s * 1.4, h: s * 1.3, d: s * 3.0 }), build(g, s, p, S, rng) { S.wpn_torpedo(g, s, rng); } }
};
