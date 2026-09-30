import * as THREE from "three";
import { perf } from "../core/perf.js";

export const BLOOM_ON_TIER = 3;
export const BLOOM_OFF_TIER = 2;

const QUAD = new THREE.PlaneGeometry(2, 2);
const ORTHO = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const BRIGHT = `
uniform sampler2D tSrc;
uniform float uThreshold;
uniform float uKnee;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv).rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float k = uKnee * uThreshold + 1e-5;
  float soft = clamp(l - uThreshold + k, 0.0, 2.0 * k);
  soft = soft * soft / (4.0 * k);
  float w = max(soft, l - uThreshold) / max(l, 1e-5);
  gl_FragColor = vec4(c * w, 1.0);
}`;

const BLUR = `
uniform sampler2D tSrc;
uniform vec2 uStep;
varying vec2 vUv;
void main() {
  vec4 sum = texture2D(tSrc, vUv) * 0.227027;
  vec2 o1 = uStep * 1.3846153846;
  vec2 o2 = uStep * 3.2307692308;
  sum += texture2D(tSrc, vUv + o1) * 0.3162162162;
  sum += texture2D(tSrc, vUv - o1) * 0.3162162162;
  sum += texture2D(tSrc, vUv + o2) * 0.0702702703;
  sum += texture2D(tSrc, vUv - o2) * 0.0702702703;
  gl_FragColor = sum;
}`;

const COMPOSITE = `
uniform sampler2D tScene;
uniform sampler2D tBloomA;
uniform sampler2D tBloomB;
uniform float uStrength;
uniform float uExposure;
varying vec2 vUv;

vec3 aces(vec3 x) {
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}
vec3 toSRGB(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(0.41666)) - 0.055, step(0.0031308, c));
}
void main() {
  vec3 col = texture2D(tScene, vUv).rgb;
  vec3 glow = texture2D(tBloomA, vUv).rgb + texture2D(tBloomB, vUv).rgb * 0.7;
  col += glow * uStrength;
  gl_FragColor = vec4(toSRGB(aces(col * uExposure)), 1.0);
}`;

const MERGE = `
uniform sampler2D tScene;
uniform sampler2D tLens;
varying vec2 vUv;
void main() {
  vec4 l = texture2D(tLens, vUv);
  vec3 s = texture2D(tScene, vUv).rgb;
  gl_FragColor = vec4(mix(s, l.rgb, clamp(l.a, 0.0, 1.0)), 1.0);
}`;

function pass(fragmentShader, uniforms) {
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(QUAD, mat);
  mesh.frustumCulled = false;
  const sc = new THREE.Scene();
  sc.add(mesh);
  return { scene: sc, mat, uniforms };
}

function target(w, h, type, depth = false) {
  const rt = new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), {
    type,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: depth,
    stencilBuffer: false,
  });
  if (depth) rt.depthTexture = new THREE.DepthTexture(Math.max(1, w), Math.max(1, h), THREE.UnsignedIntType);
  rt.texture.colorSpace = THREE.LinearSRGBColorSpace;
  rt.texture.generateMipmaps = false;
  return rt;
}

export function makeBloom(renderer, scene, camera) {
  const caps = renderer.capabilities;
  const type = caps.isWebGL2 || renderer.extensions?.has?.("OES_texture_half_float")
    ? THREE.HalfFloatType
    : THREE.UnsignedByteType;

  let sceneRT = null, rtA = null, rtB = null, rtC = null, rtD = null, rtL = null, rtM = null;
  let w = 0, h = 0;
  let ready = false;
  let failed = false;
  let latched = false;

  const brightPass = pass(BRIGHT, {
    tSrc: { value: null },
    uThreshold: { value: 0.62 },
    uKnee: { value: 0.6 },
  });
  const blurPass = pass(BLUR, { tSrc: { value: null }, uStep: { value: new THREE.Vector2() } });
  const mergePass = pass(MERGE, { tScene: { value: null }, tLens: { value: null } });
  const compPass = pass(COMPOSITE, {
    tScene: { value: null },
    tBloomA: { value: null },
    tBloomB: { value: null },
    uStrength: { value: 0 },
    uExposure: { value: 1 },
  });

  function alloc(nw, nh) {
    free();
    w = Math.max(2, nw | 0);
    h = Math.max(2, nh | 0);
    try {
      sceneRT = target(w, h, type, true);
      rtL = null;
      rtM = null;
      rtA = target(w >> 1, h >> 1, type);
      rtB = target(w >> 1, h >> 1, type);
      rtC = target(w >> 2, h >> 2, type);
      rtD = target(w >> 2, h >> 2, type);
      ready = true;
    } catch {
      failed = true;
      ready = false;
    }
  }

  function free() {
    for (const rt of [sceneRT, rtA, rtB, rtC, rtD, rtL, rtM]) { rt?.depthTexture?.dispose(); rt?.dispose(); }
    sceneRT = rtA = rtB = rtC = rtD = rtL = rtM = null;
    ready = false;
  }

  const _size = new THREE.Vector2();

  function blur(src, dst, tmp, px, py) {
    blurPass.uniforms.tSrc.value = src.texture;
    blurPass.uniforms.uStep.value.set(px, 0);
    renderer.setRenderTarget(tmp);
    renderer.render(blurPass.scene, ORTHO);
    blurPass.uniforms.tSrc.value = tmp.texture;
    blurPass.uniforms.uStep.value.set(0, py);
    renderer.setRenderTarget(dst);
    renderer.render(blurPass.scene, ORTHO);
  }

  return {
    active(strength) {
      if (failed || strength <= 0.001) return false;
      if (perf.locked != null) return perf.tier >= BLOOM_OFF_TIER;
      if (latched && perf.tier < BLOOM_OFF_TIER) latched = false;
      else if (!latched && perf.tier >= BLOOM_ON_TIER) latched = true;
      return latched;
    },

    render(strength = 0, lens = null) {
      const bloomOn = this.active(strength);
      const lensOn = Boolean(lens) && !failed;
      if (!bloomOn && !lensOn) {
        if (ready) free();
        renderer.setRenderTarget(null);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.render(scene, camera);
        return;
      }

      renderer.getDrawingBufferSize(_size);
      if (!ready || _size.x !== w || _size.y !== h) alloc(_size.x, _size.y);
      if (!ready) { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }

      const exposure = renderer.toneMappingExposure;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.setRenderTarget(sceneRT);
      renderer.clear();
      renderer.render(scene, camera);

      let src = sceneRT;
      if (lensOn) {
        const scale = lens.scale ?? 1;
        const lw = Math.max(2, Math.round(w * scale)), lh = Math.max(2, Math.round(h * scale));
        if (!rtL || rtL.width !== lw || rtL.height !== lh) { rtL?.dispose(); rtL = target(lw, lh, type); }
        if (!rtM) rtM = target(w, h, type);
        lens.prepare(sceneRT.texture, sceneRT.depthTexture);
        renderer.setRenderTarget(rtL);
        renderer.render(lens.scene, ORTHO);
        mergePass.uniforms.tScene.value = sceneRT.texture;
        mergePass.uniforms.tLens.value = rtL.texture;
        renderer.setRenderTarget(rtM);
        renderer.render(mergePass.scene, ORTHO);
        src = rtM;
      }

      if (bloomOn) {
        brightPass.uniforms.tSrc.value = src.texture;
        renderer.setRenderTarget(rtA);
        renderer.render(brightPass.scene, ORTHO);

        blur(rtA, rtA, rtB, 1 / (w >> 1), 1 / (h >> 1));
        blur(rtA, rtD, rtC, 1.9 / (w >> 2), 1.9 / (h >> 2));
      }

      compPass.uniforms.tScene.value = src.texture;
      compPass.uniforms.tBloomA.value = rtA.texture;
      compPass.uniforms.tBloomB.value = rtD.texture;
      compPass.uniforms.uStrength.value = bloomOn ? strength : 0;
      compPass.uniforms.uExposure.value = exposure;
      renderer.setRenderTarget(null);
      renderer.render(compPass.scene, ORTHO);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
    },

    setThreshold(v, knee = 0.6) {
      brightPass.uniforms.uThreshold.value = v;
      brightPass.uniforms.uKnee.value = knee;
    },

    dispose() { free(); },
    get targets() { return { sceneRT, rtL, rtM, rtA, rtB, rtD }; },
    get failed() { return failed; },
  };
}
