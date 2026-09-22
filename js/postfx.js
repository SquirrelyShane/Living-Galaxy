/* LIVING GALAXY — bloom, and (since 0.3) the black-hole lens.
 *
 * The warp tunnel wants glow. Streaks that are merely bright white lines read
 * as lines; streaks that bleed into the space around them read as speed, and
 * that difference is most of why a warp effect works at all.
 *
 * ---- why this is hand-rolled ---------------------------------------------
 *
 * Three ships a perfectly good `UnrealBloomPass`, and the obvious move is to
 * vendor it beside the core build. Two reasons not to:
 *
 *   - It is a five-mip-level pyramid: six render targets, five separable blur
 *     pairs, a composite, plus `EffectComposer`, `RenderPass`, `ShaderPass`,
 *     `MaskPass`, `CopyShader`, `OutputPass` and `OutputShader` to drive it.
 *     That is nine files and a lot of fill rate for a phone that is already
 *     GPU-bound before any of it runs.
 *   - This effect does not need a pyramid. It needs a threshold and one wide
 *     soft blur, because everything it is blooming is a thin bright line on a
 *     near-black field. A half-resolution bright pass and two quarter-res
 *     blur pairs get within a hair of the same picture for a fraction of the
 *     cost, and it is ~200 lines rather than nine vendored files.
 *
 * So: a two-target composer built from primitives the vendored core already
 * has. No new dependency, no build step, and it is sized for the device this
 * is actually played on.
 *
 * ---- the colour-space contract -------------------------------------------
 *
 * The renderer tone-maps (ACES) and encodes to sRGB on its way to the canvas.
 * That must happen exactly once. So the scene is rendered into a LINEAR
 * half-float target with tone mapping OFF, the bloom is built in linear light
 * where thresholding actually means something, and the final composite shader
 * does the tone map and the sRGB encode itself on its way to the screen.
 *
 * ---- when it runs ---------------------------------------------------------
 *
 * Only when there is something to bloom and the frame budget can afford it
 * (perf.js). Idle, or on a device at a low tier, `render()` is a plain
 * `renderer.render()` and no target is even allocated. A composer that costs
 * two full-screen passes to draw a sky with nothing glowing in it is a
 * composer that should have been switched off.
 */

import * as THREE from "three";
import { perf } from "./perf.js";

/* ---- the gate, and why it is a dead band ---------------------------------
 *
 * Bloom costs fill rate. Fill rate costs frame time. Frame time is what
 * perf.js measures to pick a tier — so a single threshold is a feedback loop:
 * bloom turns on, the frame gets slower, the tier drops, bloom turns off, the
 * frame recovers, the tier climbs, bloom turns on. The hysteresis in perf.js
 * stops that being a per-frame strobe and turns it into a roughly six-second
 * one, which is worse, because six seconds is long enough to look deliberate.
 *
 * So the gate has a dead band of its own and a latch. It takes tier 3 to
 * switch bloom ON and a drop below tier 2 to switch it OFF, and between those
 * it holds whatever it last decided. A device that can only just afford it
 * settles one way and stays there. */
export const BLOOM_ON_TIER = 3;
export const BLOOM_OFF_TIER = 2;

const QUAD = new THREE.PlaneGeometry(2, 2);
const ORTHO = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

/* ---- shaders --------------------------------------------------------------
 * Deliberately small and unclever: a full-screen triangle-ish quad, no
 * varyings beyond uv, no branching in the hot ones. */

const VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/* Bright pass with a soft knee: a hard threshold makes the bloom pop on and
 * off as something crosses it, which on a streak that is fading in as you
 * spool looks like a bug. */
const BRIGHT = /* glsl */`
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

/* One separable Gaussian, run twice per level (H then V). Nine taps with
 * linear-sampling weights: wide enough to bleed properly, cheap enough to
 * run four times a frame at quarter resolution. */
const BLUR = /* glsl */`
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

/* The one place tone mapping and the sRGB encode happen. ACES fitted — the
 * same curve `ACESFilmicToneMapping` uses, so switching the composer on and
 * off does not change how the sky looks, only how the bright things bleed. */
const COMPOSITE = /* glsl */`
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

/* The lens over the scene, by the lens's own mask (js/holefx.js writes 0 where
 * a pixel is not bent). The lens may be half resolution; the scene is not. */
const MERGE = /* glsl */`
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
  /* The scene target carries a depth TEXTURE, not just a buffer: the lens reads
   * it to keep whatever is in front of the hole unbent. It also fixes a quiet
   * bug from before the lens — the scene used to be drawn into a target with no
   * depth buffer at all whenever bloom was on, which only went unnoticed
   * because bloom only ran inside the warp tunnel. */
  if (depth) rt.depthTexture = new THREE.DepthTexture(Math.max(1, w), Math.max(1, h), THREE.UnsignedIntType);
  /* linear light all the way through: the encode happens once, at the end */
  rt.texture.colorSpace = THREE.LinearSRGBColorSpace;
  rt.texture.generateMipmaps = false;
  return rt;
}

/**
 * A bloom composer over an existing renderer/scene/camera.
 *
 *   render(strength)  draw the frame. `strength` 0 disables the whole thing
 *                     for this frame and falls back to a plain render, so the
 *                     cost only exists while something is actually glowing.
 */
export function makeBloom(renderer, scene, camera) {
  const caps = renderer.capabilities;
  /* half-float if we can have it: bloom on an 8-bit target bands badly on the
   * exact thing this is for, a thin bright line on black */
  const type = caps.isWebGL2 || renderer.extensions?.has?.("OES_texture_half_float")
    ? THREE.HalfFloatType
    : THREE.UnsignedByteType;

  let sceneRT = null, rtA = null, rtB = null, rtC = null, rtD = null, rtL = null, rtM = null;
  let w = 0, h = 0;
  let ready = false;
  let failed = false;
  let latched = false;          // the gate's own state, see the dead band above

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
      /* half res for the first bloom level, quarter for the second — the wide
       * soft one that does most of the actual bleeding */
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
    /** Is the composer going to do anything this frame? */
    active(strength) {
      if (failed || strength <= 0.001) return false;
      if (perf.locked != null) return perf.tier >= BLOOM_OFF_TIER;   // a pinned tier is a decision, not a measurement
      if (latched && perf.tier < BLOOM_OFF_TIER) latched = false;
      else if (!latched && perf.tier >= BLOOM_ON_TIER) latched = true;
      return latched;
    },

    /**
     * Draw the frame. `lens` is js/holefx.js's pass for this frame, or null:
     * `{ scene, prepare(colorTexture, depthTexture) }`. A lens forces the
     * composer path even when there is nothing to bloom — it needs the scene
     * and its depth as textures — and bloom is then built from the lensed
     * image, so the disk bleeds the way a hot disk should.
     */
    render(strength = 0, lens = null) {
      const bloomOn = this.active(strength);
      const lensOn = Boolean(lens) && !failed;
      if (!bloomOn && !lensOn) {
        /* the plain path, byte for byte what the engine did before this module
         * existed — tone mapping and encode by the renderer, straight to the
         * canvas, no targets touched */
        if (ready) free();
        renderer.setRenderTarget(null);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.render(scene, camera);
        return;
      }

      renderer.getDrawingBufferSize(_size);
      if (!ready || _size.x !== w || _size.y !== h) alloc(_size.x, _size.y);
      if (!ready) { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }

      /* 1. the sky, in linear light, untone-mapped */
      const exposure = renderer.toneMappingExposure;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.setRenderTarget(sceneRT);
      renderer.clear();
      renderer.render(scene, camera);

      /* 1b. the lens bends it */
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
        /* 2. what is bright enough to bleed */
        brightPass.uniforms.tSrc.value = src.texture;
        renderer.setRenderTarget(rtA);
        renderer.render(brightPass.scene, ORTHO);

        /* 3. two levels of separable blur: tight and wide. (Before 0.3 the
         * first call was blur(rtA, rtB, rtA): its horizontal half read rtA while
         * drawing into rtA, which WebGL refuses as a feedback loop — the tight
         * level was silently never drawn. H into rtB, V back into rtA.) */
        blur(rtA, rtA, rtB, 1 / (w >> 1), 1 / (h >> 1));
        blur(rtA, rtD, rtC, 1.9 / (w >> 2), 1.9 / (h >> 2));
      }

      /* 4. back to the screen, tone-mapped and encoded exactly once */
      compPass.uniforms.tScene.value = src.texture;
      compPass.uniforms.tBloomA.value = rtA.texture;
      compPass.uniforms.tBloomB.value = rtD.texture;
      compPass.uniforms.uStrength.value = bloomOn ? strength : 0;
      compPass.uniforms.uExposure.value = exposure;
      renderer.setRenderTarget(null);
      renderer.render(compPass.scene, ORTHO);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
    },

    /** Threshold is worth moving: a warp tunnel wants more of the frame to bleed. */
    setThreshold(v, knee = 0.6) {
      brightPass.uniforms.uThreshold.value = v;
      brightPass.uniforms.uKnee.value = knee;
    },

    dispose() { free(); },
    /* debug: the targets, for a harness to read back */
    get targets() { return { sceneRT, rtL, rtM, rtA, rtB, rtD }; },
    get failed() { return failed; },
  };
}
