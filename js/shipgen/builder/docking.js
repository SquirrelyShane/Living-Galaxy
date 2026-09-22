/* StarshipBuilder mixin — Docking collar body shared by the dock prefab.
 * Methods are installed onto StarshipBuilder.prototype by src/builder/StarshipBuilder.js. */
import * as THREE from "three";
import { RNG } from "../core/rng.js";
import { G, makeMat, addMesh, wingShape } from "../core/geometry.js";
import { faceNormal, faceEuler, faceRotation } from "./faces.js";
import { DRIVE_TYPES } from "../data/drives.js";
import { WEAPON_TYPES } from "../data/weapons.js";
import { PARTS } from "../data/catalog/index.js";
import { PREFABS, ALL_FACES, fpArea } from "../prefabs/index.js";

export default {
  /* docking collar body — shared by the dock prefab (built along +Y) */
  dockBody(g, S, kind) {
    const m = this.mats;
    const arms = [], blinkers = [];
    // recessed base plate, collar, soft-capture ring, pressure iris
    addMesh(g, G.box(), m.dark, 0, S * 0.05, 0, 0, 0, 0, S * 2.15, S * 0.12, S * 2.15);
    addMesh(g, G.cyl(20), m.metal, 0, S * 0.16, 0, 0, 0, 0, S, S * 0.24, S);
    addMesh(g, G.torus(0.17), m.rubber, 0, S * 0.30, 0, Math.PI / 2, 0, 0, S * 0.94, S * 0.94, S * 0.30);
    const iris = addMesh(g, G.cyl(20), m.glassDark, 0, S * 0.32, 0, 0, 0, 0, S * 0.62, S * 0.06, S * 0.62);
    iris.castShadow = false;
    // latch arms
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const arm = new THREE.Group();
      arm.position.set(Math.cos(a) * S * 0.88, S * 0.30, Math.sin(a) * S * 0.88);
      arm.rotation.y = -a;
      addMesh(arm, G.box(), m.metal, 0, 0, 0, 0, 0, 0, S * 0.34, S * 0.18, S * 0.16);
      g.add(arm); arms.push(arm);
    }
    // hazard chevrons framing the approach
    for (const sgn of [-1, 1])
      addMesh(g, G.box(), m.hazard, sgn * S * 1.0, S * 0.10, 0, 0, 0, 0, S * 0.14, S * 0.06, S * 2.1);
    // amber approach blinkers, alternating around the collar
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      blinkers.push(this.lamp(g, { color: "#ffb03a", x: Math.cos(a) * S * 1.06, y: S * 0.22, z: Math.sin(a) * S * 1.06,
                     r: S * 0.11, mode: "blink", period: 1.1, duty: 0.33, phase: i / 3, base: 7 }));
    }
    // status light: green free / cyan crew / white hard mate
    const statusCol = kind === "fuel" ? "#7dffbe" : kind === "crew" ? "#5fd0ff" : kind === "hard" ? "#ffffff" : "#7dffbe";
    const status = this.lamp(g, { color: statusCol, x: 0, y: S * 0.36, z: -S * 0.78, r: S * 0.13, mode: "pulse", period: 2.6, phase: this.rng.next(), base: 6 });
    // fuel ports get a stowed probe boom
    if (kind === "fuel") {
      addMesh(g, G.cyl(8), m.metal, 0, S * 0.55, S * 0.2, 0.35, 0, 0, S * 0.12, S * 1.5, S * 0.12);
      addMesh(g, G.torus(0.2), m.accent, 0, S * 1.15, S * 0.42, Math.PI / 2 + 0.35, 0, 0, S * 0.2, S * 0.2, S * 0.12);
    }
    // cargo ports get guide rails for a container arm
    if (kind === "cargo") {
      for (const sgn of [-1, 1])
        addMesh(g, G.box(), m.metal, 0, S * 0.22, sgn * S * 1.0, 0, 0, 0, S * 1.9, S * 0.2, S * 0.10);
    }
    g.userData.dock = { kind, arms, blinkers, status, iris };
    this.docks.push({ kind });
    this.count(8);
  }
};
