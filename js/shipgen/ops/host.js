/* Host bindings for the live-systems layer.
 *
 * The ops/fx modules used to import the yard's WebGL scene, its global builder and its
 * toast helper directly. In a portable generator they take those from here instead, so a
 * host project injects its own THREE scene (or any Object3D) once at startup:
 *
 *   import { setOpsHost } from ".../src/ops/host.js";
 *   setOpsHost({ scene: myScene, toast: (msg) => myHud.say(msg) });
 *
 * `scene` is the only required field — it is where transient effects (tracers, beams,
 * puffs, the target drone, the mining rock) are parented. Anything added there is removed
 * again by the effect's own lifetime, so a dedicated `new THREE.Group()` works fine and
 * keeps the FX out of your main graph.
 */
export const host = {
  scene: null,                 // Object3D that transient FX are added to / removed from
  toast: () => {},             // optional user-facing message sink
};

export function setOpsHost({ scene, toast } = {}) {
  if (scene) host.scene = scene;
  if (toast) host.toast = toast;
  return host;
}

/* Throws with a useful message instead of "cannot read property add of null". */
export function fxScene() {
  if (!host.scene) throw new Error("ops: no scene bound — call setOpsHost({ scene }) before opsBind()");
  return host.scene;
}
