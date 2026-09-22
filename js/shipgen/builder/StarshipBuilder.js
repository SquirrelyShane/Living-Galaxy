/* StarshipBuilder — core: build() pipeline, hull-volume tracking, hardpoint frame, lamps.
 * Geometry passes live in mixins (hull, drives, weapons, glazing, docking, placement, details)
 * so each can be upgraded on its own. */
import * as THREE from "three";
import { RNG } from "../core/rng.js";
import { G, makeMat, addMesh, wingShape, FINISHES } from "../core/geometry.js";
import { faceNormal, faceEuler, faceRotation } from "./faces.js";
import { DRIVE_TYPES } from "../data/drives.js";
import { WEAPON_TYPES } from "../data/weapons.js";
import { PARTS } from "../data/catalog/index.js";
import { PREFABS, ALL_FACES, fpArea } from "../prefabs/index.js";
import { SHIP_CLASSES, EQUIP_DEFAULT, CLASS_EQUIP } from "../data/classes.js";
import { DESIGN_REGIMES } from "../data/flight.js";
import hull from "./hull.js";
import drives from "./drives.js";
import weapons from "./weapons.js";
import glazing from "./glazing.js";
import docking from "./docking.js";
import placement from "./placement.js";
import details from "./details.js";

export class StarshipBuilder {
  build(opts) {
    this.opts = opts;
    this.rng = new RNG(opts.seed);
    this.cls = SHIP_CLASSES[opts.shipClass] || SHIP_CLASSES.corvette;
    this.partCount = 0;
    this.complexity = opts.complexity;
    this.hullVols = [];
    this.wingTips = [];
    this.armsUsed = [];
    this.docks = [];
    this.lampCount = 0;
    this.occ = [];
    this.eq = Object.assign({}, EQUIP_DEFAULT, CLASS_EQUIP[opts.shipClass] || {});


    const rng = this.rng;
    const C = this.cls;
    // design regime: the flight environment the hull is shaped for
    this.regimeKey = (opts.designRegime && opts.designRegime !== "auto") ? opts.designRegime : (C.regime || "deep");
    this.aero = DESIGN_REGIMES[this.regimeKey] || DESIGN_REGIMES.deep;
    const fin = this.aero.fineness;                       // stretch along the flow, slim across it, keep volume
    this.L = rng.range(...C.length) * opts.lengthBias * opts.scale * fin;
    this.B = rng.range(...C.beam) * opts.beamBias * opts.scale / Math.sqrt(fin);
    this.H = rng.range(...C.height) * opts.scale / Math.sqrt(fin);
    this.noseKind = this.aero.nose && C.nose !== "industrial" ? this.aero.nose : C.nose;

    this.drive = opts.driveType === "auto" ? C.drive : opts.driveType;
    this.driveDef = DRIVE_TYPES[this.drive] || DRIVE_TYPES.fusion;
    this.armMix = opts.weaponSuite === "auto"
      ? C.arms.slice()
      : (opts.weaponSuite === "mixed" ? Object.keys(WEAPON_TYPES) : [opts.weaponSuite]);

    const engineCol = new THREE.Color(opts.engine);
    const hotCol = new THREE.Color(this.driveDef.hot);

    const F = FINISHES[opts.finish] || FINISHES.brushed;
    const skin = (base, extra) => makeMat(base, Object.assign({}, extra, F, F.emissiveBoost ? { emissive: opts.accent, emissiveIntensity: F.emissiveBoost } : {}));
    this.finish = opts.finish || "brushed";
    this.mats = {
      hull:   skin(opts.primary,   { metalness: 0.52, roughness: 0.42 }),
      light:  skin(new THREE.Color(opts.primary).lerp(new THREE.Color("#ffffff"), 0.28), { metalness: 0.45, roughness: 0.5 }),
      dark:   skin(opts.secondary, { metalness: 0.6, roughness: 0.48 }),
      accent: makeMat(opts.accent,    { metalness: 0.4, roughness: 0.3, emissive: opts.accent, emissiveIntensity: F.emissiveBoost ? 1.6 : 0.55 }),
      stripe: makeMat(opts.accent,    { metalness: 0.35, roughness: 0.42 }),
      metal:  makeMat("#2b3442",      { metalness: 0.9, roughness: 0.28 }),
      engine: makeMat("#1c2430",      { metalness: 0.88, roughness: 0.26 }),
      glow:   makeMat(engineCol,      { metalness: 0.05, roughness: 0.3, emissive: engineCol, emissiveIntensity: 3.2 }),
      hot:    makeMat(hotCol,         { metalness: 0.02, roughness: 0.2, emissive: hotCol, emissiveIntensity: 4.0 }),
      glass:  makeMat("#bfe6ff",      { metalness: 0.05, roughness: 0.06, emissive: "#63b5ff", emissiveIntensity: 0.9, transparent: true, opacity: 0.68 }),
      panel:  skin(new THREE.Color(opts.primary).lerp(new THREE.Color("#000000"), 0.2), { metalness: 0.5, roughness: 0.62 }),
      // tinted structural glazing — bridge canopy / viewports / array faces
      glassDark: makeMat("#101d29", { metalness: 0.25, roughness: 0.07, emissive: "#0d2f45", emissiveIntensity: 0.45, transparent: true, opacity: 0.92 }),
      // warm cabin light behind crew viewports
      winLit: makeMat("#ffe3b8", { metalness: 0.0, roughness: 0.45, emissive: "#ffd39a", emissiveIntensity: 1.9 }),
      hazard: makeMat("#ffb03a", { metalness: 0.3, roughness: 0.5, emissive: "#ffb03a", emissiveIntensity: 0.7 }),
      rubber: makeMat("#171c24", { metalness: 0.15, roughness: 0.85 }),
      solar:  makeMat("#16294a", { metalness: 0.6, roughness: 0.15, emissive: "#0b2a66", emissiveIntensity: 0.35 }),
      sail:   makeMat("#e8f4ff", { metalness: 0.95, roughness: 0.08, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
      algae:  makeMat("#2f7a4f", { metalness: 0.1, roughness: 0.3, emissive: "#1f6b3a", emissiveIntensity: 0.5, transparent: true, opacity: 0.86 }),
      algaeLit: makeMat("#9dffc4", { metalness: 0.0, roughness: 0.4, emissive: "#74ffb8", emissiveIntensity: 1.6 }),
      foil:   makeMat("#d8b25a", { metalness: 0.95, roughness: 0.22, emissive: "#3a2a08", emissiveIntensity: 0.25 })
    };

    const root = new THREE.Group();
    root.name = "starship";

    this.addHull(root);
    if (this.aero.heatShield) this.addHeatShield(root);
    this.addNose(root);
    this.addSuperstructure(root);
    if (this.aero.fairings) this.addFairings(root);
    this.hardpoints();
    // catalog unit: one "bay" of exterior real estate — follows the hull but never absurd on giants or needles
    this.U = THREE.MathUtils.clamp(Math.min(this.B, this.H) * 0.18, 0.75, 2.4);
    if (opts.wings && C.wings !== "none") this.addWings(root);
    this.addEngines(root);
    this.occInit(root);
    if (opts.windows)  this.addWindows(root);
    this.mountLoadout(root);
    if (opts.greeble)  this.addGreebles(root);
    if (opts.lights)   this.addRunningLights(root);

    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    root.position.sub(center);
    this.bounds = box;
    this.size = box.getSize(new THREE.Vector3());
    return root;
  }

  count(n = 1) { this.partCount += n; }

  /* ---- hull volume tracking so detail can sit flush ---------------- */
  vol(parent, mat, x, y, z, w, h, d, rz = 0) {
    const m = addMesh(parent, G.box(), mat, x, y, z, 0, 0, rz, w, h, d);
    this.hullVols.push({ x, y, z, w, h, d });
    this.count();
    return m;
  }

  /* pick a point on the outer surface of a tracked hull volume */
  pickSurface(rng, faces = ["top", "side", "bottom"], zRange = null) {
    const pool = this.hullVols.filter(v => v.w > this.B * 0.15 && v.d > this.L * 0.08);
    if (!pool.length) return null;
    for (let attempt = 0; attempt < 12; attempt++) {
      const v = rng.pick(pool);
      const face = rng.pick(faces);
      const z = v.z + rng.range(-0.42, 0.42) * v.d;
      if (zRange && (z < zRange[0] || z > zRange[1])) continue;
      if (face === "top") return { pos: [v.x + rng.range(-0.34, 0.34) * v.w, v.y + v.h * 0.5, z], face, vol: v };
      if (face === "bottom") return { pos: [v.x + rng.range(-0.34, 0.34) * v.w, v.y - v.h * 0.5, z], face, vol: v };
      const s = rng.sign();
      return { pos: [v.x + s * v.w * 0.5, v.y + rng.range(-0.25, 0.25) * v.h, z], face: s > 0 ? "right" : "left", vol: v };
    }
    const v = pool[0];
    return { pos: [v.x, v.y + v.h * 0.5, v.z], face: "top", vol: v };
  }

  /* ---- HARDPOINT FRAME -------------------------------------------- *
   * One reference volume + normalised (u,v) face coordinates, so every
   * module can be placed deliberately instead of scattered at random.  */
  hardpoints() {
    // a volume is mountable real estate if two of its dimensions are substantial (thin side pads count)
    const pool = this.hullVols.filter(v => !v.shield && Math.max(v.w, v.h) > this.B * 0.18 && Math.min(v.w, v.h) > this.B * 0.05 && v.d > this.L * 0.12);
    pool.sort((a, b) => (b.w * b.d * b.h) - (a.w * a.d * a.h));
    this.main = pool[0] || { x: 0, y: 0, z: 0, w: this.B * 0.6, h: this.H * 0.6, d: this.L * 0.7 };
    this.mainPool = pool;
  }

  /* face + normalised coords -> world position on that face */
  hp(face, u, v, vol) {
    const V = vol || this.main;
    switch (face) {
      case "top":    return [V.x + u * V.w * 0.5, V.y + V.h * 0.5, V.z + v * V.d * 0.5];
      case "bottom": return [V.x + u * V.w * 0.5, V.y - V.h * 0.5, V.z + v * V.d * 0.5];
      case "port":   return [V.x - V.w * 0.5, V.y + u * V.h * 0.5, V.z + v * V.d * 0.5];
      case "star":   return [V.x + V.w * 0.5, V.y + u * V.h * 0.5, V.z + v * V.d * 0.5];
      case "bow":    return [V.x + u * V.w * 0.5, V.y + v * V.h * 0.5, V.z - V.d * 0.5];
      default:       return [V.x + u * V.w * 0.5, V.y + v * V.h * 0.5, V.z + V.d * 0.5];
    }
  }

  /* ---- LAMPS ------------------------------------------------------- *
   * modes: steady | pulse | blink | strobe | double | chase            */
  lamp(parent, o) {
    const color = o.color || "#ffffff";
    const base = o.base ?? 4.0;
    const mat = makeMat(color, { emissive: color, emissiveIntensity: base, metalness: 0.05, roughness: 0.35 });
    mat.userData.cloned = true;
    const r = o.r ?? 0.12;
    const m = addMesh(parent, o.box ? G.box() : G.sphere(), mat,
      o.x || 0, o.y || 0, o.z || 0, o.rx || 0, o.ry || 0, o.rz || 0,
      r * (o.sx ?? 1), r * (o.sy ?? 1), r * (o.sz ?? 1));
    m.castShadow = false;
    return this.tagLamp(m, Object.assign({ base }, o));
  }

  tagLamp(mesh, o) {
    mesh.userData.lamp = {
      mode: o.mode || "steady", period: o.period ?? 2, phase: o.phase ?? 0,
      duty: o.duty ?? 0.5, i: o.i ?? 0, count: o.count ?? 1, base: o.base ?? 2.4
    };
    this.lampCount = (this.lampCount || 0) + 1;
    return mesh;
  }

  /* face helpers kept on the class for backwards compatibility */
  static faceNormal(f) { return faceNormal(f); }
  static faceEuler(f) { return faceEuler(f); }
  static faceRotation(f) { return faceRotation(f); }
}

Object.assign(StarshipBuilder.prototype, hull, drives, weapons, glazing, docking, placement, details);
