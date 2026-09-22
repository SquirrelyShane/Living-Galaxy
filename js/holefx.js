/* LIVING GALAXY — seeing a collapsed star.
 *
 * js/holes.js decides where a hole is and what it eats; this draws it.
 *
 *   THE LENS    the asteroid generator's Kerr lens (vendored at
 *               js/asteroidgen/blackhole.js): each pixel's ray is traced through
 *               a spinning hole's spacetime with the DNGR equations the film
 *               Interstellar was rendered with — the shadow, the photon ring, the
 *               thin disk lensed over and under the shadow, and the stars behind
 *               it bent into arcs. It runs as a pass inside js/postfx.js over the
 *               scene and its depth, so a hull in front of the hole stays a hull.
 *   THE STAND-IN  when the lens is gated off (a low frame-budget tier, reduced
 *               motion, or `localStorage["lgaa.lens"] = "off"`), a black shadow
 *               sphere and an unlensed disk, so the thing that is eating the belt
 *               is still a thing you can see and steer away from.
 *   INFALL      rocks the hole takes out of the belt near you do not blink out:
 *               each spirals down, flattens into the disk plane, heats, is
 *               stretched along the line to the hole, and burns away at the
 *               inner edge — the generator's debris-well law, per instance, in
 *               the vertex shader.
 *   TIDES       a rogue that strays inside the tidal radius is torn apart by the
 *               generator's TidalBody: its own grown body cut into solid chunks
 *               that peel off the tidal bulges, stream, spaghettify, heat and
 *               burn into the disk. Visual only — the rogue itself was already
 *               removed by holes.js.
 *
 * The disk is lit by what fell in: holes.js keeps accreted mass by the radius
 * it burned at, and `buildRings` turns that into the lens's ring uniforms.
 *
 * Adapting the lens to this renderer (the vendored file is not edited; its
 * shader text is exported and patched here):
 *   - the game draws with a LOGARITHMIC depth buffer, so the lens's perspective
 *     depth linearisation is replaced with the log-depth inverse
 *   - the lens's few absolute distances (how far a bent ray is marched through
 *     the depth buffer, the depth-match slack) were written for a scene ten
 *     units across; they scale with the hole here
 *   - a per-pixel cut-off: a ray passing further out than the deflection that
 *     would move it a pixel does no work at all, which is most of the screen
 *     when the hole is far
 */

import * as THREE from "three";
import { BLACKHOLE_SHADER, RING_MAX, buildRings } from "./asteroidgen/blackhole.js";
import { BH_RS, makeRockGeometry } from "./asteroidgen/debris.js";
import { KERR, isco, horizon } from "./asteroidgen/kerr.js";
import { TidalBody, Trajectory, TIDAL, setTidalSpin } from "./asteroidgen/tidal.js";
import { RNG } from "./asteroidgen/rng.js";
import { generateBody, bodyMaterial, rogueParams } from "./bodygen/body.js";
import { logDepthVertex, logDepthFragment } from "./bodygen/gl.js";
import { rogueClassOf } from "./impacts.js";
import { holes, holeFx, holeRadii } from "./holes.js";
import { oreLook } from "./rockgen.js";
import { perf } from "./perf.js";

const COARSE = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
const INFALL_CAP = 64;      // per rock variant
const MAX_TIDAL = 2;
const LENS_ON_TIER = 2;     // same dead-band idea as the bloom gate (postfx.js)
const LENS_OFF_TIER = 1;

/* ---- the lens shader, adapted ------------------------------------------------ */

function lensShader() {
  let fs = BLACKHOLE_SHADER.fragmentShader;
  const rep = (a, b) => {
    if (!fs.includes(a)) throw new Error(`holefx: lens shader patch target missing: ${a.slice(0, 60)}`);
    fs = fs.replace(a, b);
  };
  rep("uniform float uSpin;", "uniform float uSpin;\nuniform float uLenScale;\nuniform float uBCut;\nuniform float uLogFar;");
  rep(
    "  float z = texture2D(tDepth, uv).x;\n  if (z >= 0.99999) return 1e6;\n  return -(uNear * uFar) / ((uFar - uNear) * z - uFar);",
    "  float z = texture2D(tDepth, uv).x;\n  if (z >= 0.99999) return 1e6;\n  /* logarithmic depth: z = log2(1 + w) / log2(far + 1) */\n  return pow(2.0, z * uLogFar) - 1.0;",
  );
  rep("const float LENS_FAR = 260.0;", "#define LENS_FAR (260.0 * uLenScale)");
  rep("zs >= min(prevZ, zr) - 0.35 - 0.08 * zr", "zs >= min(prevZ, zr) - 0.35 * uLenScale - 0.08 * zr");
  rep("zs <= max(zr, zPrev) + 0.05 && zs >= min(zr, zPrev) - 0.25", "zs <= max(zr, zPrev) + 0.05 * uLenScale && zs >= min(zr, zPrev) - 0.25 * uLenScale");
  rep("  vec3 cvec = ro + dir * max(tca, 0.0);\n  float b = length(cvec);", "  vec3 cvec = ro + dir * max(tca, 0.0);\n  float b = length(cvec);\n  if (b > uBCut && !insideSphere) {\n    gl_FragColor = scene;\n    return;\n  }");
  /* alpha is a mask: 0 where the pixel passes straight through, 1 where it was
   * bent. postfx merges the (possibly half-resolution) lens over the full-res
   * scene by it, so only the part of the frame that is actually lensed pays for
   * the lower resolution. */
  fs = fs.replace(/gl_FragColor = scene;/g, "gl_FragColor = vec4(scene.rgb, 0.0);");
  /* the view ray from the NEAR plane: unprojecting the far plane of a 30,000 km
   * frustum divides by a w that has underflowed, and every direction is NaN */
  rep("vec4 vp = uInvProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);", "vec4 vp = uInvProj * vec4(vUv * 2.0 - 1.0, -1.0, 1.0);");
  /* "no surface" was anything past 100,000 units — most of this sky */
  fs = fs.replace(/1e6/g, "1e12").replace(/1e5/g, "1e11");
  rep("gl_FragColor = vec4(mix(lensed, scene.rgb, front), 1.0);", "gl_FragColor = vec4(mix(lensed, scene.rgb, front), 1.0 - front);");
  return fs;
}

export function makeHoleFx({ scene, origin, camera, renderer, reduced = false }) {
  setTidalSpin(0.6);
  /* ---- lens material, rendered by postfx over its own quad ---- */
  const lensUniforms = {
    tDiffuse: { value: null }, tDepth: { value: null }, uHasDepth: { value: 0 },
    uNear: { value: camera.near }, uFar: { value: camera.far }, uLogFar: { value: Math.log2(camera.far + 1) },
    uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uViewProj: { value: new THREE.Matrix4() },
    uCamPos: { value: new THREE.Vector3() }, uCamFwd: { value: new THREE.Vector3(0, 0, -1) },
    uBHPos: { value: new THREE.Vector3() }, uRs: { value: 0 }, uTime: { value: 0 },
    uBgColor: { value: new THREE.Color(0x030407).convertSRGBToLinear() },
    uDiskBase: { value: 0 },
    uRingR: { value: new Float32Array(RING_MAX) }, uRingW: { value: new Float32Array(RING_MAX).fill(1) }, uRingI: { value: new Float32Array(RING_MAX) },
    uRingCount: { value: 0 },
    uSpin: { value: 0.6 }, uShift: { value: 0 }, uIsco: { value: isco(0.6) }, uHorizon: { value: horizon(0.6) },
    uLenScale: { value: 1 }, uBCut: { value: 1e6 },
  };
  let lensMat = null;
  try {
    lensMat = new THREE.ShaderMaterial({
      name: "blackhole-lens",
      defines: { STEPS: COARSE ? 80 : 170, RING_MAX },
      uniforms: lensUniforms,
      vertexShader: "varying vec2 vUv;\nvoid main() {\n  vUv = uv;\n  gl_Position = vec4(position.xy, 0.0, 1.0);\n}",
      fragmentShader: lensShader(),
      depthTest: false,
      depthWrite: false,
    });
  } catch (e) {
    console.warn("[holefx] lens unavailable", e);
    lensMat = null;
  }
  const lensScene = new THREE.Scene();
  if (lensMat) {
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), lensMat);
    quad.frustumCulled = false;
    lensScene.add(quad);
  }
  let lensLatched = false;
  const forced = (() => { try { return localStorage.getItem("lgaa.lens"); } catch { return null; } })();

  /* ---- per hole: the stand-in ---- */
  const standins = new Map();
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const diskMat = new THREE.ShaderMaterial({
    name: "hole-disk",
    uniforms: { uInner: { value: 0.15 }, uBase: { value: 0.5 }, uTime: { value: 0 } },
    vertexShader: logDepthVertex("varying vec2 vUv;\nvoid main() {\n  vUv = uv;\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n}"),
    fragmentShader: logDepthFragment(`uniform float uInner;
uniform float uBase;
uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0 || r < uInner) discard;
  float a = atan(p.y, p.x) - uTime * 0.6 / pow(max(r, 0.1) * 6.0, 1.5);
  float band = 0.6 + 0.4 * sin(r * 70.0 + sin(a * 3.0) * 1.5) * sin(a * 7.0 + r * 11.0);
  float fall = pow(uInner / max(r, uInner), 1.6) * smoothstep(1.0, 0.72, r) * smoothstep(uInner, uInner * 1.25, r);
  vec3 col = mix(vec3(0.74, 0.85, 1.0), vec3(1.0, 0.97, 0.92), smoothstep(uInner, 1.0, r));
  gl_FragColor = vec4(col * fall * band * (0.6 + uBase * 1.6), 1.0);
}`),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });

  function standinFor(h) {
    let s = standins.get(h.id);
    if (s) return s;
    const R = holeRadii(h, {});
    const group = new THREE.Group();
    const shadow = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), shadowMat);
    shadow.scale.setScalar(h.rs * 2.5);
    const disk = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), diskMat.clone());
    disk.rotation.x = -Math.PI / 2;
    disk.scale.setScalar(R.disk);
    disk.material.uniforms.uInner.value = R.burn / R.disk;
    disk.renderOrder = 4;
    group.add(shadow, disk);
    scene.add(group);
    s = { group, shadow, disk };
    standins.set(h.id, s);
    return s;
  }

  function dropStandin(id) {
    const s = standins.get(id);
    if (!s) return;
    s.group.removeFromParent();
    s.shadow.geometry.dispose();
    s.disk.geometry.dispose();
    s.disk.material.dispose();
    standins.delete(id);
  }

  /* ---- infall ---- */
  const infallUniforms = {
    uTime: { value: 0 },
    uHole: { value: new THREE.Vector3() },
    uBurn: { value: 3000 },
    uSunDir: { value: new THREE.Vector3(1, 0.3, 0) },
  };
  const infallVS = logDepthVertex(`uniform float uTime;
uniform vec3 uHole;
uniform float uBurn;
attribute vec3 aStart;
attribute vec4 aInfo;   // t0, seed, size, fall seconds
attribute vec3 aCol;
varying vec3 vW;
varying vec3 vCol;
varying float vHeat;
mat3 rotAxis(vec3 a, float ang) {
  float s = sin(ang), c = cos(ang), oc = 1.0 - c;
  return mat3(oc*a.x*a.x+c, oc*a.x*a.y+a.z*s, oc*a.z*a.x-a.y*s, oc*a.x*a.y-a.z*s, oc*a.y*a.y+c, oc*a.y*a.z+a.x*s, oc*a.z*a.x+a.y*s, oc*a.y*a.z-a.x*s, oc*a.z*a.z+c);
}
void main() {
  float tau = uTime - aInfo.x;
  float T = aInfo.w;
  float r0 = max(length(aStart), uBurn * 1.1);
  float u = clamp(tau / T, 0.0, 1.0);
  /* r² falls linearly in time (the generator's r² = r0² − 2aτ), to the burn radius */
  float r = sqrt(max(r0 * r0 - (r0 * r0 - uBurn * uBurn * 0.8) * u, 1.0));
  float fallen = 1.0 - (r - uBurn) / max(r0 - uBurn, 1.0);
  float phi = atan(aStart.z, aStart.x) + (sqrt(r0 / max(r, 1.0)) - 1.0) * 5.0;
  float y = aStart.y * (r / r0) * (r / r0);
  float rxz = sqrt(max(r * r - y * y, 0.0));
  vec3 c = uHole + vec3(cos(phi) * rxz, y, sin(phi) * rxz);
  float heat = clamp(fallen, 0.0, 1.0);
  float vis = (tau < 0.0 ? 0.0 : 1.0) * (1.0 - smoothstep(0.82, 1.0, u)) * smoothstep(0.0, 0.08, u + 0.02);
  vec3 er = normalize(c - uHole + vec3(1e-3));
  vec3 lp = rotAxis(normalize(vec3(aInfo.y, 0.7, 1.0 - aInfo.y)), tau * (0.6 + aInfo.y * 2.0)) * position * aInfo.z * vis;
  float S = 1.0 + 5.0 * heat * heat;
  float al = dot(lp, er);
  lp = er * (al * S) + (lp - er * al) / sqrt(S);
  vec4 w = vec4(c + lp, 1.0);
  vW = w.xyz;
  vCol = aCol;
  vHeat = heat;
  gl_Position = projectionMatrix * viewMatrix * w;
}`);
  const infallFS = logDepthFragment(`uniform vec3 uSunDir;
varying vec3 vW;
varying vec3 vCol;
varying float vHeat;
vec3 heatRamp(float h) {
  vec3 c = mix(vec3(0.0), vec3(0.45, 0.03, 0.0), smoothstep(0.0, 0.25, h));
  c = mix(c, vec3(1.0, 0.32, 0.04), smoothstep(0.2, 0.5, h));
  c = mix(c, vec3(1.0, 0.82, 0.5), smoothstep(0.45, 0.8, h));
  c = mix(c, vec3(0.78, 0.88, 1.0), smoothstep(0.8, 1.2, h));
  return c * (0.5 + 3.5 * h);
}
void main() {
  vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
  float ndl = max(dot(n, uSunDir), 0.0);
  vec3 col = vCol * (0.08 + 0.5 * ndl) * (1.0 - 0.7 * vHeat) + heatRamp(vHeat * 1.1) * smoothstep(0.1, 0.5, vHeat);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`);
  const infallMat = new THREE.ShaderMaterial({ name: "hole-infall", uniforms: infallUniforms, vertexShader: infallVS, fragmentShader: infallFS });
  const infall = [0, 1, 2, 3].map((v) => {
    const geo = makeRockGeometry(new RNG(910 + v), { detail: v === 0 ? 1 : 2 });
    const start = new Float32Array(INFALL_CAP * 3);
    const info = new Float32Array(INFALL_CAP * 4);
    for (let i = 0; i < INFALL_CAP; i++) { info[i * 4] = 1e9; info[i * 4 + 3] = 1; }
    const col = new Float32Array(INFALL_CAP * 3).fill(0.4);
    geo.setAttribute("aStart", new THREE.InstancedBufferAttribute(start, 3));
    geo.setAttribute("aInfo", new THREE.InstancedBufferAttribute(info, 4));
    geo.setAttribute("aCol", new THREE.InstancedBufferAttribute(col, 3));
    const mesh = new THREE.InstancedMesh(geo, infallMat, INFALL_CAP);
    mesh.frustumCulled = false;
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, geo, start, info, col, next: 0 };
  });
  let infallHole = null;
  let infallLive = 0;
  const _rgb = new THREE.Color();

  function addInfall(h, e) {
    if (infallHole && infallHole !== h.id) return;
    infallHole = h.id;
    const bucket = infall[Math.floor((e.seed ?? Math.random()) * 4) % 4];
    const i = bucket.next;
    bucket.next = (bucket.next + 1) % INFALL_CAP;
    bucket.start.set([e.x - h.x, e.y - h.y, e.z - h.z], i * 3);
    const seed = e.seed ?? Math.random();
    bucket.info.set([clock, seed, e.r * 1.15, 6 + seed * 9], i * 4);
    const look = oreLook(e.ore ?? "silicate");
    _rgb.setHex(look.albedo ?? look.tint);
    bucket.col.set([_rgb.r * 1.2, _rgb.g * 1.2, _rgb.b * 1.2], i * 3);
    bucket.geo.attributes.aStart.needsUpdate = true;
    bucket.geo.attributes.aInfo.needsUpdate = true;
    bucket.geo.attributes.aCol.needsUpdate = true;
    bucket.mesh.visible = true;
    infallLive = clock + 16;
  }

  /* ---- tides ---- */
  const tidal = [];
  function addTidal(h, m) {
    if (tidal.length >= MAX_TIDAL) return;
    try {
      const cls = rogueClassOf(m);
      const built = generateBody(null, { ...rogueParams(m, cls), detail: 8 });
      const S = m.r / built.asteroid.meshRadius;
      const R = holeRadii(h, {});
      /* the Lab's tidal radii scale with √M and ∛M; pick the M and the Roche
       * base that land them on this hole's burn and tidal radii in the body's frame */
      const sq = Math.max(1, (R.burn / S) / (TIDAL.burnR * TIDAL.iscoScale));
      const M = sq * sq;
      const mat = bodyMaterial(THREE);
      const mesh = new THREE.Mesh(built.geometry, mat);
      mesh.frustumCulled = false;
      const tb = new TidalBody(mesh, {
        name: m.name, seed: m.id, chunks: 20, mass: 0.06, morph: true, reform: [3, 6],
        roche: (R.roche / S) / (0.62 * Math.cbrt(M)), rocheScale: 0.62,
      });
      tb.setBHMass(M);
      const group = new THREE.Group();
      group.scale.setScalar(S);
      group.add(mesh);
      scene.add(group);
      const p = { x: (m.x - h.x) / S, y: (m.y - h.y) / S, z: (m.z - h.z) / S };
      mesh.position.set(p.x, p.y, p.z);
      const traj = new Trajectory(mesh.position, [(m.vx - h.vx) / S, (m.vy - h.vy) / S, (m.vz - h.vz) / S]);
      tidal.push({ hole: h.id, tb, traj, group, mesh, S, gm: h.mu / (S * S * S), born: clock });
    } catch (e) {
      console.warn("[holefx] tidal disruption skipped", e);
    }
  }

  function dropTidal(i) {
    const t = tidal[i];
    t.group.removeFromParent();
    t.tb.dispose();
    t.mesh.geometry.dispose();
    t.mesh.material.dispose();
    tidal.splice(i, 1);
  }

  /* ---- per frame ---- */
  let clock = 0;
  const _v = new THREE.Vector3();
  const _fwd = new THREE.Vector3();
  const _size = new THREE.Vector2();
  let ringsAt = -1;
  let lensHole = null;

  function drain() {
    while (holeFx.length) {
      const e = holeFx.shift();
      const h = holes.find((x) => x.id === e.id);
      if (e.t === "gone") { dropStandin(e.id); continue; }
      if (!h) continue;
      if (e.t === "rock") addInfall(h, e);
      else if (e.t === "rogue") addTidal(h, e.m);
    }
  }

  function lensWanted() {
    if (!lensMat || reduced || forced === "off") return false;
    if (forced === "on") return true;
    if (perf.locked != null) return perf.tier >= LENS_ON_TIER;
    if (lensLatched && perf.tier < LENS_OFF_TIER) lensLatched = false;
    else if (!lensLatched && perf.tier >= LENS_ON_TIER) lensLatched = true;
    return lensLatched;
  }

  let lensOn = false;

  function update(dt) {
    clock += dt;
    drain();
    const wantLens = lensWanted();
    camera.getWorldDirection(_fwd);
    renderer.getDrawingBufferSize(_size);
    const pixelAngle = THREE.MathUtils.degToRad(camera.fov) / Math.max(1, _size.y);

    /* the hole the lens is for: the one that bends the most of the screen */
    lensHole = null;
    let best = 0;
    for (const h of holes) {
      _v.set(h.x - origin.x - camera.position.x, h.y - origin.y - camera.position.y, h.z - origin.z - camera.position.z);
      const d = _v.length();
      const R = holeRadii(h, {});
      /* angular size of the march sphere, and whether it could touch the view */
      const ang = Math.atan2(KERR.march * h.rs * 0.5, d);
      const off = Math.acos(Math.max(-1, Math.min(1, _v.dot(_fwd) / Math.max(d, 1))));
      const inView = off < THREE.MathUtils.degToRad(camera.fov) * 0.9 + ang;
      const px = (R.disk / Math.max(d, 1)) / pixelAngle;
      const score = inView ? px : 0;
      if (score > best && px > 1.5) { best = score; lensHole = h; }

      const s = standinFor(h);
      s.group.position.set(h.x - origin.x, h.y - origin.y, h.z - origin.z);
      const base = Math.min(1.6, 0.3 * Math.log(1 + h.mass / 0.006));
      s.disk.material.uniforms.uBase.value = base;
      s.disk.material.uniforms.uTime.value = clock;
    }
    for (const [id, s] of standins) {
      if (!holes.some((h) => h.id === id)) { dropStandin(id); continue; }
      const lensed = wantLens && lensHole && lensHole.id === id;
      s.group.visible = !lensed;
    }

    lensOn = Boolean(lensHole && wantLens);
    if (lensOn) {
      const h = lensHole;
      const u = lensUniforms;
      u.uRs.value = h.rs;
      u.uBHPos.value.set(h.x - origin.x, h.y - origin.y, h.z - origin.z);
      u.uTime.value = clock;
      u.uLenScale.value = h.rs / BH_RS;
      u.uSpin.value = h.spin ?? 0.6;
      u.uIsco.value = isco(u.uSpin.value);
      u.uHorizon.value = horizon(u.uSpin.value);
      /* a ray further out than a pixel's worth of bending (α = 4M/b) is left alone */
      u.uBCut.value = Math.max(KERR.march * 1.6, 4 / Math.max(pixelAngle * 0.7, 1e-6));
      if (clock - ringsAt > 0.25) {
        ringsAt = clock;
        const k = BH_RS / h.rs;
        const rings = buildRings(h.feed.map((f) => ({ r: f.r * k, mass: f.mass })), 0);
        u.uRingR.value.set(rings.r);
        u.uRingW.value.set(rings.w);
        u.uRingI.value.set(rings.i);
        u.uRingCount.value = rings.count;
        u.uDiskBase.value = rings.base;
      }
    }

    /* infall */
    if (infallHole) {
      const h = holes.find((x) => x.id === infallHole);
      if (!h || clock > infallLive) {
        for (const b of infall) b.mesh.visible = false;
        infallHole = null;
      } else {
        const R = holeRadii(h, {});
        infallUniforms.uTime.value = clock;
        infallUniforms.uHole.value.set(h.x - origin.x, h.y - origin.y, h.z - origin.z);
        infallUniforms.uBurn.value = R.burn;
        infallUniforms.uSunDir.value.set(-h.x, -h.y, -h.z).normalize();
      }
    }

    /* tides */
    for (let i = tidal.length - 1; i >= 0; i--) {
      const t = tidal[i];
      const h = holes.find((x) => x.id === t.hole);
      if (!h || clock - t.born > 90 || (t.tb.done && !t.tb.remnant)) { dropTidal(i); continue; }
      const step = Math.min(dt, 0.05);
      t.traj.update(step, [0, 0, 0], t.gm, TIDAL.captureR * Math.sqrt(t.tb.bhMass));
      t.tb.update(clock, step, { pos: [0, 0, 0], vel: [0, 0, 0], gm: t.gm }, { pos: [t.mesh.position.x, t.mesh.position.y, t.mesh.position.z], vel: t.traj.v });
      t.group.position.set(h.x - origin.x, h.y - origin.y, h.z - origin.z);
      if (t.traj.absorbed) t.tb.shedAll();
    }
  }

  /** What postfx needs to run the lens this frame, or null. */
  function lens() {
    return lensOn ? lensPass : null;
  }
  const lensPass = {
    scene: lensScene,
    /* a phone traces the lens at half resolution; the merge keeps the rest of the frame sharp */
    scale: COARSE ? 0.5 : 1,
    prepare(readTexture, depthTexture) {
      const u = lensUniforms;
      u.tDiffuse.value = readTexture;
      u.tDepth.value = depthTexture ?? null;
      u.uHasDepth.value = depthTexture ? 1 : 0;
      u.uNear.value = camera.near;
      u.uFar.value = camera.far;
      u.uLogFar.value = Math.log2(camera.far + 1);
      u.uInvProj.value.copy(camera.projectionMatrixInverse);
      u.uCamWorld.value.copy(camera.matrixWorld);
      u.uViewProj.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      camera.getWorldPosition(u.uCamPos.value);
      camera.getWorldDirection(u.uCamFwd.value);
    },
  };

  function dispose() {
    for (const id of [...standins.keys()]) dropStandin(id);
    for (let i = tidal.length - 1; i >= 0; i--) dropTidal(i);
    for (const b of infall) { b.mesh.removeFromParent(); b.geo.dispose(); }
    infallMat.dispose();
    diskMat.dispose();
    shadowMat.dispose();
    lensMat?.dispose();
  }

  return {
    update,
    lens,
    dispose,
    get lensHole() { return lensHole; },
    get tidal() { return tidal.length; },
    get standinsShown() { let n = 0; for (const x of standins.values()) if (x.group.visible) n++; return n; },
    get infallLive() { return infallHole != null; },
  };
}
