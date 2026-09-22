/* LIVING GALAXY — what a grown rock carries, and what is left when it goes.
 *
 * Three things out of the asteroid generator's debris module (vendored at
 * js/asteroidgen/debris.js and generator.js), all laid out in the generator's
 * unit frame and so parented to a grown body's `unit` group:
 *
 *   RUBBLE    seated boulders and a lofted halo of chips, on the ONE rock you
 *             are working (locked, under the cutter, or simply nearest).
 *             Five draw calls; not worth paying on every rock in view.
 *   CLOUDS    icy crystalline debris — hex prisms, shards, needles, plates and
 *             druse clusters, meshed rocks rimed with frost, haze and glints —
 *             orbiting an ice-bearing body in the cold of the belt. The
 *             generator's field is up to eighteen draw calls, so it goes on the
 *             nearest one or two such bodies, not on all of them.
 *   SHATTER   when a rock is cut out, it does not blink off. A dense field in
 *             the rock's own colours bursts out from where it was, tumbles, and
 *             is let go over the last few seconds of its life (`uFade`, see
 *             js/bodygen/gl.js).
 *
 * Everything animates in the vertex shader — per frame this module writes a
 * handful of uniforms per field and moves a group to the floating origin.
 *
 * Budget, off the same quality gate as the grown bodies (engine.js
 * rockQuality): at `off` none of this exists; `low` gets shatter only, thin;
 * `full` gets rubble, one cloud, thin shatter; `high` gets two clouds and a
 * denser shatter.
 */

import * as THREE from "three";
import { buildDebrisField } from "./asteroidgen/debris.js";
import { buildRubbleField } from "./asteroidgen/generator.js";
import { patchGeneratorShaders, addFadeUniform } from "./bodygen/gl.js";

const CLOUD_R = 2600;          // a cloud is only worth drawing this close
const RUBBLE_R = 1800;
const SHATTER_LIFE = 48;       // seconds from burst to gone
const SHATTER_FADE = 9;        // …the last of which are spent letting it go
const MAX_SHATTER = 3;
/* ice budget share (generator iceAffinity) at which a body is worth a cloud:
 * a C-type's water is 0.4, a D-type's volatiles saturate at 1 */
const CLOUD_ICE = 0.3;
const SUN_COLOR = [0.62, 0.57, 0.5];
const AMBIENT = [0.05, 0.055, 0.07];

export function makeRockFx({ scene, origin, camera, renderer, budget }) {
  patchGeneratorShaders();
  const tier = budget >= 18 ? "high" : budget >= 10 ? "full" : budget > 0 ? "low" : "off";
  /* 0.3.02: rubble and ice clouds are off on every tier — a rock sitting in the
   * belt does not wear a debris ring. Shatter (a rock cut out) stays. */
  const cfg = {
    off: { rubble: false, clouds: 0, shatter: 0 },
    low: { rubble: false, clouds: 0, shatter: 0.12 },
    full: { rubble: false, clouds: 0, shatter: 0.22 },
    high: { rubble: false, clouds: 0, shatter: 0.5 },
  }[tier];

  const shatters = [];
  const sunDir = new THREE.Vector3();
  const _v = new THREE.Vector3();
  const _size = new THREE.Vector2();
  let clock = 0;

  /* The debris shaders size their motes as `aSize · uPx / depth`, with aSize in
   * the field's unit frame and depth in world units, so the pixel scale a field
   * wants is the screen's projection factor times the field's own scale. */
  function pxScale() {
    renderer.getDrawingBufferSize(_size);
    return (_size.y * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
  }

  function lightField(api, scale, worldPos, px) {
    const u = api.uniforms;
    /* the star sits at the origin of the sky; light comes from it */
    _v.set(-worldPos.x, -worldPos.y, -worldPos.z);
    if (_v.lengthSq() < 1) _v.set(1, 0.4, 0);
    _v.normalize();
    u.uSunDir.value = [_v.x, _v.y, _v.z];
    u.uFogDensity.value = 0;
    /* the generator's debris shaders light without three's 1/π, so they run hot beside
     * a MeshStandard body under the same sun: brought down to sit with it */
    u.uSunColor.value = SUN_COLOR;
    u.uAmbient.value = AMBIENT;
    u.uPx.value = px * scale;
  }

  function disposeGroup(g) {
    g.traverse((o) => {
      if (o.isInstancedMesh) o.dispose(); // instance buffers are freed only by the mesh's own dispose
      o.geometry?.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
    g.removeFromParent();
  }

  /* ---- per body -------------------------------------------------------- */

  function attachRubble(rec) {
    if (rec.rubble || !cfg.rubble) return;
    const a = rec.built?.asteroid;
    if (!a) return;
    const g = buildRubbleField(a, `${a.seed}`);
    /* PointsMaterial sizes do not follow the object's scale: put the chips back
     * at the size the generator meant them in its own frame */
    g.traverse((o) => { if (o.isPoints) o.material.size *= rec.built.scale; });
    rec.unit.add(g);
    rec.rubble = g;
  }

  function dropRubble(rec) {
    if (!rec.rubble) return;
    disposeGroup(rec.rubble);
    rec.rubble = null;
  }

  function attachCloud(rec) {
    if (rec.cloud || !cfg.clouds) return;
    const a = rec.built?.asteroid;
    if (!a || (a.iceAffinity ?? 0) < CLOUD_ICE) return;
    const g = buildDebrisField(a, { kind: "clouds", density: tier === "high" ? 0.55 : 0.32, ice: 0.55 + a.iceAffinity * 0.3 });
    addFadeUniform(g.userData.debris.uniforms);
    rec.unit.add(g);
    rec.cloud = g;
    rec.cloudBorn = clock;
  }

  function dropCloud(rec) {
    if (!rec.cloud) return;
    disposeGroup(rec.cloud);
    rec.cloud = null;
  }

  /**
   * Decide who carries what this frame. `recs` is every grown body that is in
   * view, `focusKey` the rock being worked (locked / cut), `ship` the hull.
   */
  function dress(recs, focusKey, ship) {
    if (tier === "off") return;
    let focus = null, best = Infinity;
    const icy = [];
    for (const rec of recs) {
      const rk = rec.rock;
      if (!rk) continue;
      const d = Math.hypot(rk.x - ship.x, rk.y - ship.y, rk.z - ship.z) - rec.r;
      if (focusKey && rk.key === focusKey) { focus = rec; best = -Infinity; }
      else if (best !== -Infinity && d < RUBBLE_R && d < best) { focus = rec; best = d; }
      if (d < CLOUD_R && (rec.built?.asteroid?.iceAffinity ?? 0) >= CLOUD_ICE) icy.push({ rec, d });
    }
    for (const rec of recs) if (rec !== focus) dropRubble(rec);
    if (focus) attachRubble(focus);
    icy.sort((a, b) => a.d - b.d);
    const keep = new Set(icy.slice(0, cfg.clouds).map((x) => x.rec));
    for (const rec of recs) if (!keep.has(rec)) dropCloud(rec);
    for (const rec of keep) attachCloud(rec);
  }

  /** A grown body is leaving the scene: take what it carried with it. */
  function detach(rec) {
    dropRubble(rec);
    dropCloud(rec);
  }

  /**
   * The rock is cut out. `rec` is its grown body (still holding its last
   * position and spin); the field is built from the body's own vertex colours
   * and ice budget, so what flies apart is what you were looking at.
   */
  function shatter(rec) {
    if (!cfg.shatter || !rec?.built?.asteroid) return null;
    while (shatters.length >= MAX_SHATTER) release(shatters.shift());
    const a = rec.built.asteroid;
    const g = buildDebrisField(a, { kind: "shatter", density: cfg.shatter, burstStart: clock });
    const fade = addFadeUniform(g.userData.debris.uniforms);
    const outer = new THREE.Group();
    outer.scale.setScalar(rec.built.scale * (rec.group.scale.x || 1));
    outer.quaternion.copy(rec.group.quaternion);
    outer.add(g);
    scene.add(outer);
    const s = { group: outer, field: g, api: g.userData.debris, fade, born: clock, x: rec.rock?.x ?? 0, y: rec.rock?.y ?? 0, z: rec.rock?.z ?? 0, scale: rec.built.scale };
    shatters.push(s);
    return s;
  }

  function release(s) {
    disposeGroup(s.group);
  }

  function update(dt, recs) {
    clock += dt;
    const px = pxScale();
    for (let i = shatters.length - 1; i >= 0; i--) {
      const s = shatters[i];
      const age = clock - s.born;
      if (age > SHATTER_LIFE) { release(s); shatters.splice(i, 1); continue; }
      s.group.position.set(s.x - origin.x, s.y - origin.y, s.z - origin.z);
      s.fade.value = Math.min(1, Math.max(0, (SHATTER_LIFE - age) / SHATTER_FADE));
      s.api.update(clock);
      sunDir.set(s.x, s.y, s.z);
      lightField(s.api, s.scale, sunDir, px);
    }
    for (const rec of recs) {
      if (!rec.cloud) continue;
      const api = rec.cloud.userData.debris;
      api.update(clock);
      /* a cloud grows in over a couple of seconds instead of appearing whole */
      api.uniforms.uFade.value = Math.min(1, (clock - rec.cloudBorn) / 2.5);
      sunDir.set(rec.rock?.x ?? 0, rec.rock?.y ?? 0, rec.rock?.z ?? 0);
      lightField(api, rec.built.scale, sunDir, px);
    }
  }

  function dispose() {
    for (const s of shatters) release(s);
    shatters.length = 0;
  }

  return { tier, dress, detach, shatter, update, dispose, get shatters() { return shatters; } };
}
