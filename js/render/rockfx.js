import * as THREE from "three";
import { buildDebrisField } from "../asteroidgen/debris.js";
import { buildRubbleField } from "../asteroidgen/generator.js";
import { patchGeneratorShaders, addFadeUniform } from "../bodygen/gl.js";

const CLOUD_R = 2600;
const RUBBLE_R = 1800;
const SHATTER_LIFE = 48;
const SHATTER_FADE = 9;
const MAX_SHATTER = 3;
const CLOUD_ICE = 0.3;
const SUN_COLOR = [0.62, 0.57, 0.5];
const AMBIENT = [0.05, 0.055, 0.07];

export function makeRockFx({ scene, origin, camera, renderer, budget }) {
  patchGeneratorShaders();
  const tier = budget >= 18 ? "high" : budget >= 10 ? "full" : budget > 0 ? "low" : "off";
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

  function pxScale() {
    renderer.getDrawingBufferSize(_size);
    return (_size.y * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
  }

  function lightField(api, scale, worldPos, px) {
    const u = api.uniforms;
    _v.set(-worldPos.x, -worldPos.y, -worldPos.z);
    if (_v.lengthSq() < 1) _v.set(1, 0.4, 0);
    _v.normalize();
    u.uSunDir.value = [_v.x, _v.y, _v.z];
    u.uFogDensity.value = 0;
    u.uSunColor.value = SUN_COLOR;
    u.uAmbient.value = AMBIENT;
    u.uPx.value = px * scale;
  }

  function disposeGroup(g) {
    g.traverse((o) => {
      if (o.isInstancedMesh) o.dispose();
      o.geometry?.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
    g.removeFromParent();
  }

  function attachRubble(rec) {
    if (rec.rubble || !cfg.rubble) return;
    const a = rec.built?.asteroid;
    if (!a) return;
    const g = buildRubbleField(a, `${a.seed}`);
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

  function detach(rec) {
    dropRubble(rec);
    dropCloud(rec);
  }

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
