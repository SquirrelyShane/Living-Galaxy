/* LIVING GALAXY — a baked body in the scene.
 *
 * Turns a growBaked() result (js/bodygen/body.js, grown in the worker) into a
 * geometry, three data textures and a material. The material is a
 * MeshStandardMaterial with the surface read from the atlases instead of
 * vertex attributes: albedo (stored as √ so dark rock keeps its 8 bits),
 * metalness, roughness, emission, and — the whole point — the generator's own
 * full-resolution normal, in object space, turned into view space per
 * fragment. The same material works instanced (the belt field's class
 * prototypes, tinted per instance) and on a single grown body.
 *
 * Every baked material shares one program; only its textures differ.
 */

import { CLASSES } from "./classes.js";

function dataTex(THREE, arr, W, H) {
  const t = new THREE.DataTexture(arr, W, H, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;   // an atlas has no mip-safe gutters; texels are vertices anyway
  t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}

const VS_PARS = `
attribute vec2 aBakeUv;
varying vec2 vBakeUv;
varying vec3 vBakeN0;
varying vec3 vBakeN1;
varying vec3 vBakeN2;`;

const VS_MAIN = `
vBakeUv = aBakeUv;
{
  mat3 bm = mat3(1.0);
  #ifdef USE_INSTANCING
  bm = mat3(instanceMatrix);
  #endif
  bm = normalMatrix * bm;
  vBakeN0 = bm[0]; vBakeN1 = bm[1]; vBakeN2 = bm[2];
}`;

const FS_PARS = `
uniform sampler2D tBakeA;
uniform sampler2D tBakeB;
uniform sampler2D tBakeC;
uniform float uEmitScale;
varying vec2 vBakeUv;
varying vec3 vBakeN0;
varying vec3 vBakeN1;
varying vec3 vBakeN2;
vec4 gBakeA;
vec4 gBakeB;`;

/** The material for one bake. `emitScale` 0 means the body has no glow atlas. */
export function bakedMaterial(THREE, { texA, texB, texC = null, emitScale = 0 }) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.7, emissive: 0x000000 });
  const uniforms = {
    tBakeA: { value: texA },
    tBakeB: { value: texB },
    tBakeC: { value: texC ?? texA },
    uEmitScale: { value: texC ? emitScale : 0 },
  };
  mat.userData.bake = uniforms;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>${VS_PARS}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>${VS_MAIN}`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>${FS_PARS}`)
      .replace("#include <color_fragment>", `#include <color_fragment>
gBakeA = texture2D(tBakeA, vBakeUv);
gBakeB = texture2D(tBakeB, vBakeUv);
diffuseColor.rgb *= gBakeA.rgb * gBakeA.rgb;`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = clamp(gBakeB.a, 0.04, 1.0);")
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nmetalnessFactor = gBakeA.a;")
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
normal = normalize(mat3(vBakeN0, vBakeN1, vBakeN2) * (gBakeB.rgb * 2.0 - 1.0));`)
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance = texture2D(tBakeC, vBakeUv).rgb * uEmitScale;");
  };
  mat.customProgramCacheKey = () => "asteroid-baked-v1";
  return mat;
}

/** One mesh of a bake as a BufferGeometry (atlas coordinates on `aBakeUv`). */
export function bakedGeometry(THREE, m) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(m.positions, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(m.normals, 3));
  g.setAttribute("aBakeUv", new THREE.BufferAttribute(m.uvs, 2));
  g.setIndex(new THREE.BufferAttribute(m.index, 1));
  g.computeBoundingSphere();
  return g;
}

/**
 * Everything the renderer needs for one grown result: geometries (one per L),
 * textures, the material, and a `built` record shaped like generateBody's, so
 * the assay card, the shatter field and the tests read it the same way.
 */
export function mountBakedData(THREE, d) {
  const texA = dataTex(THREE, d.texA, d.W, d.Ht);
  const texB = dataTex(THREE, d.texB, d.W, d.Ht);
  const texC = d.texC ? dataTex(THREE, d.texC, d.W, d.Ht) : null;
  const material = bakedMaterial(THREE, { texA, texB, texC, emitScale: d.emitScale });
  const geometries = d.meshes.map((m) => bakedGeometry(THREE, m));
  const m0 = d.meshes[0];
  /* the shatter field samples its palette off the body's colour attribute */
  const color = new THREE.BufferAttribute(m0.colors, 3);
  const meta = d.meta;
  const built = {
    ...meta,
    klass: CLASSES[meta.cls],
    geometry: geometries[0],
    asteroid: { seed: meta.seed, klass: CLASSES[meta.cls], maxRadius: meta.maxRadius, meshRadius: meta.meshRadius, iceAffinity: meta.iceAffinity, geometry: { attributes: { color } } },
    bakedH: d.H,
  };
  const dispose = () => {
    texA.dispose(); texB.dispose(); texC?.dispose(); material.dispose();
    for (const g of geometries) g.dispose();
  };
  return { geometries, material, textures: [texA, texB, texC].filter(Boolean), built, dispose };
}
