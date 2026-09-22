/**
 * Kerr (spinning) black hole as a post-process lens.
 *
 * v1.9: rays follow the super-Hamiltonian Kerr null-geodesic equations of the DNGR
 * code used for Interstellar (James, von Tunzelmann, Franklin & Thorne 2015,
 * appendix A.1): camera direction → FIDO-frame canonical momenta (p_r, p_θ, b, q),
 * integrated backward in ζ with RK2, thin disk in the equatorial plane at the
 * spin-dependent ISCO, optional Doppler + gravitational colour/brightness shift
 * (blackbody at T0 shifted to g·T0, Planck radiance sampled at film R/G/B).
 * kerr.js holds the JS reference this GLSL is checked against. Units inside the
 * march sphere are M (= world Rs / 2). The v1.3 Schwarzschild description follows.
 *
 * Per pixel, a camera ray is traced in units of the Schwarzschild radius (Rs = 1)
 * with the photon-orbit equation used by Marinozzi's raytracer:
 *
 *     v += -1.5 · h² · p / r⁵ · dt ,   p += v · dt ,   h = |p × v|
 *
 * inside a march sphere (MARCH_R). Outside it, the weak-field deflection
 * α = 2 / b is applied analytically, and the residual bend for the part of the
 * path outside the sphere is added on exit, so the lens is continuous across
 * the boundary. Escaped rays re-project onto the frame rendered so far (stars,
 * debris, fragments); captured rays are black.
 *
 * v1.8 finite-distance lensing: a lensed ray is marched from its bend point
 * through the depth buffer and takes the first surface it passes behind, so
 * bodies just behind the hole shift and wrap a little instead of being
 * magnified into a screen-filling Einstein ring as if they sat at infinity.
 * Rays whose source is hidden behind a foreground body fall back to the
 * pixel's own unlensed background — never a mirrored copy of the body.
 * Crossings of the disk plane (world XZ) add emission from the accretion disk,
 * so the lensed far side of the disk arcs over and under the shadow.
 *
 * The disk has no emission of its own until matter arrives: ring radii and
 * brightness come from the debris that has actually dissolved into it
 * (debris.accretion()) plus what the fx particles delivered.
 */
import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { BH_RS } from './debris.js';
import { KERR, isco, horizon, KERR_LOOKS } from './kerr.js';

export const RING_MAX = 24;
export const BH_DISK = { isco: 3.0, out: 12.5, march: 14.0 };

export const BLACKHOLE_SHADER = {
  vertexShader: /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
  fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform float uHasDepth;
uniform float uNear;
uniform float uFar;
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec3 uCamFwd;
uniform vec3 uBHPos;
uniform float uRs;
uniform float uTime;
uniform vec3 uBgColor;
uniform float uDiskBase;
uniform float uRingR[RING_MAX];
uniform float uRingW[RING_MAX];
uniform float uRingI[RING_MAX];
uniform int uRingCount;
uniform float uSpin;     // a/M
uniform float uShift;    // 1: Doppler + gravitational colour and brightness shifts · 0: Interstellar film look
uniform float uIsco;     // M
uniform float uHorizon;  // M
varying vec2 vUv;

const float DISK_OUT = ${KERR.diskOut.toFixed(2)};
const float MARCH_R = ${KERR.march.toFixed(2)};
const float T0 = ${KERR.T0.toFixed(1)};
const int LENS_STEPS = 14;
const float LENS_FAR = 260.0;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}

float linearDepthAt(vec2 uv) {
  float z = texture2D(tDepth, uv).x;
  if (z >= 0.99999) return 1e6;
  return -(uNear * uFar) / ((uFar - uNear) * z - uFar);
}

// one foreground rule for direct and lensed pixels: view depth vs the hole's view depth
float lensDepthRef() {
  return dot(uBHPos - uCamPos, uCamFwd);
}

vec2 projectDir(vec3 d) {
  vec4 c = uViewProj * vec4(d, 0.0);
  if (c.w <= 1e-4) return vec2(-9.0);
  return c.xy / c.w * 0.5 + 0.5;
}
vec2 projectPoint(vec3 X) {
  vec4 c = uViewProj * vec4(X, 1.0);
  if (c.w <= 1e-4) return vec2(-9.0);
  return c.xy / c.w * 0.5 + 0.5;
}
vec3 edgeFade(vec2 uv, vec3 s) {
  vec2 e = smoothstep(vec2(0.0), vec2(0.015), uv) * smoothstep(vec2(1.0), vec2(0.985), uv);
  return mix(uBgColor, s, e.x * e.y);
}
// what a hidden source looks like: this pixel's own background, unlensed (never a copy of a body)
vec3 hiddenSource() {
  if (uHasDepth < 0.5) return uBgColor;
  float here = linearDepthAt(vUv);
  return here < lensDepthRef() - 1.5 * uRs ? uBgColor : texture2D(tDiffuse, vUv).rgb;
}
// P0: world point where the ray bends · d: outgoing direction.
// March the bent ray through the depth buffer (quadratic steps out to the far field) and take
// the first surface it passes behind; if it meets nothing it sees the sky at infinity.
vec3 sampleLensed(vec3 P0, vec3 d) {
  vec2 uvInf = projectDir(d);
  if (uHasDepth < 0.5) return uvInf.x < -5.0 ? uBgColor : edgeFade(uvInf, texture2D(tDiffuse, clamp(uvInf, 0.001, 0.999)).rgb);
  float z0 = dot(P0 - uCamPos, uCamFwd);
  float prevZ = z0;
  for (int i = 1; i <= LENS_STEPS; i++) {
    float f = float(i) / float(LENS_STEPS);
    vec3 X = P0 + d * (f * f * LENS_FAR);
    float zr = dot(X - uCamPos, uCamFwd);
    vec2 uv = projectPoint(X);
    if (uv.x < -5.0 || zr <= uNear) break;
    if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) {
      prevZ = zr;
      continue;
    }
    float zs = linearDepthAt(uv);
    // the ray just went behind a surface that sits beyond the bend point: that is what it sees
    if (zs < 1e5 && zs <= zr && zs >= min(prevZ, zr) - 0.35 - 0.08 * zr && zs > z0) {
      return edgeFade(uv, texture2D(tDiffuse, uv).rgb);
    }
    prevZ = zr;
  }
  if (uvInf.x < -5.0) return uBgColor;
  vec2 su = clamp(uvInf, 0.001, 0.999);
  // nothing hit on the way out; if a body covers the far-field sample, what lies behind it is unknown.
  // Depthless glow (alpha > 0 without depth: gas, dust, sparks) sits near the hole, not at infinity — same.
  vec4 far = texture2D(tDiffuse, su);
  if (linearDepthAt(su) < 1e5 || far.a > 0.002) return hiddenSource();
  return edgeFade(uvInf, far.rgb);
}

// ---------------------------------------------------------------- Kerr (M = 1)
vec3 worldToBL(vec3 v) { return vec3(v.x, v.z, -v.y); }
vec3 blToWorld(vec3 v) { return vec3(v.x, -v.z, v.y); }
// BL Cartesian → (r, θ, φ), oblate embedding
vec3 cartToBL(vec3 c) {
  float a2 = uSpin * uSpin;
  float w = dot(c, c) - a2;
  float r = sqrt(max(1e-12, 0.5 * (w + sqrt(w * w + 4.0 * a2 * c.z * c.z))));
  return vec3(r, acos(clamp(c.z / r, -1.0, 1.0)), atan(c.y, c.x));
}
vec3 blToCart(vec3 s) {
  float e = sqrt(s.x * s.x + uSpin * uSpin) * sin(s.y);
  return vec3(e * cos(s.z), e * sin(s.z), s.x * cos(s.y));
}
void fido(vec3 s, out vec3 er, out vec3 et, out vec3 ep) {
  float sn = sin(s.y), cs = cos(s.y), cp = cos(s.z), sp = sin(s.z);
  float q = sqrt(s.x * s.x + uSpin * uSpin);
  ep = vec3(-sp, cp, 0.0);
  er = normalize(vec3(s.x / q * sn * cp, s.x / q * sn * sp, cs));
  et = vec3(q * cs * cp, q * cs * sp, -s.x * sn);
  et = normalize(et - dot(et, er) * er);
}
// (A.2) → alpha, omega, varpi, rho ; D
vec4 metricAt(float r, float th, out float D) {
  float a = uSpin, c = cos(th), sn = sin(th);
  float rho2 = r * r + a * a * c * c;
  float rho = sqrt(rho2);
  D = r * r - 2.0 * r + a * a;
  float Sig = sqrt((r * r + a * a) * (r * r + a * a) - a * a * D * sn * sn);
  return vec4(rho * sqrt(max(D, 0.0)) / Sig, 2.0 * a * r / (Sig * Sig), Sig * sn / rho, rho);
}
// (A.15): state x = (r, θ, φ), p = (p_r, p_θ); returns dx, dp
void kerrDerivs(vec3 x, vec2 p, float b, float q, out vec3 dx, out vec2 dp) {
  float a = uSpin, a2 = a * a, r = x.x, r2 = r * r;
  float sn = sin(x.y), cs = cos(x.y);
  float sn2 = max(sn * sn, 1e-8);
  float snS = abs(sn) < 1e-4 ? (sn < 0.0 ? -1e-4 : 1e-4) : sn;
  float rho2 = r2 + a2 * cs * cs, rho4 = rho2 * rho2;
  float D = r2 - 2.0 * r + a2;
  float P = r2 + a2 - a * b;
  float K = (b - a) * (b - a) + q;
  float R = P * P - D * K;
  float Th = q - cs * cs * (b * b / sn2 - a2);
  float Dp = 2.0 * r - 2.0;
  float Rp = 4.0 * r * P - Dp * K;
  dx.x = D / rho2 * p.x;
  dx.y = p.y / rho2;
  dx.z = (a * P / D + (b - a) + b * cs * cs / sn2) / rho2;
  dp.x = -p.x * p.x * (Dp * rho2 - 2.0 * r * D) / (2.0 * rho4) + p.y * p.y * r / rho4
       + (Rp * D * rho2 - R * (Dp * rho2 + 2.0 * r * D)) / (2.0 * D * D * rho4) - Th * r / rho4;
  float rho2t = -2.0 * a2 * cs * sn;
  float Thp = 2.0 * b * b * cs / (snS * snS * snS) - 2.0 * a2 * cs * sn;
  dp.y = rho2t / (2.0 * rho4) * (p.x * p.x * D + p.y * p.y - R / D - Th) + Thp / (2.0 * rho2);
}
// (A.9–A.12) with β = 0: a ray traced from the camera along dirBL is a photon arriving along −dirBL
void initRay(vec3 posBL, vec3 dirBL, out vec3 x, out vec2 p, out float bb, out float qq) {
  x = cartToBL(posBL);
  vec3 er, et, ep;
  fido(x, er, et, ep);
  vec3 nB = -dirBL;
  vec3 nF = normalize(vec3(dot(nB, er), dot(nB, et), dot(nB, ep)));
  float D0;
  vec4 m0 = metricAt(x.x, x.y, D0);
  float EF = 1.0 / (m0.x + m0.y * m0.z * nF.z);
  p = vec2(EF * m0.w * nF.x / sqrt(max(D0, 1e-9)), EF * m0.w * nF.y);
  bb = EF * m0.z * nF.z;
  float c0 = cos(x.y);
  qq = p.y * p.y + c0 * c0 * (bb * bb / max(sin(x.y) * sin(x.y), 1e-8) - uSpin * uSpin);
}
// direction (BL Cartesian) the traced ray is travelling, from its FIDO-frame momentum
vec3 rayDir(vec3 x, vec2 p, float bb) {
  vec3 er, et, ep;
  fido(x, er, et, ep);
  float D1;
  vec4 m1 = metricAt(x.x, x.y, D1);
  return normalize(-(er * (p.x * sqrt(max(D1, 1e-9)) / m1.w) + et * (p.y / m1.w) + ep * (bb / m1.z)));
}
float kerrStep(float r) {
  return clamp(${KERR.stepK.toFixed(3)} * (r - uHorizon * 0.98), ${KERR.stepMin.toFixed(4)}, ${KERR.stepMax.toFixed(2)});
}
// redshift ν_camera / ν_emitted from a prograde circular equatorial emitter (camera far away)
float diskRedshift(float r, float b) {
  float r15 = pow(r, 1.5);
  float ut = (r15 + uSpin) / (pow(r, 0.75) * sqrt(max(1e-6, r15 - 3.0 * sqrt(r) + 2.0 * uSpin)));
  return 1.0 / (ut * (1.0 - b / (r15 + uSpin)));
}
// Planck radiance at the film's R, G, B wavelengths relative to T0
vec3 blackbody(float T) {
  vec3 lam = vec3(610e-9, 550e-9, 465e-9);
  vec3 e = min(vec3(1.4388e-2) / (lam * max(T, 200.0)), vec3(60.0));
  vec3 e0 = vec3(1.4388e-2) / (lam * T0);
  return (exp(e0) - 1.0) / (exp(e) - 1.0);
}

// Emission + coverage of the thin equatorial disk at radius r (M), BL azimuth ph, ray constant b.
vec4 diskAt(float r, float ph, float b) {
  float r0 = uIsco * 0.98;
  if (r < r0 || r > DISK_OUT) return vec4(0.0);
  float I = uDiskBase * smoothstep(r0, uIsco * 1.3, r) * pow(uIsco / r, 2.2);
  for (int k = 0; k < RING_MAX; k++) {
    if (k >= uRingCount) break;
    float x = (r - 2.0 * uRingR[k]) / (2.0 * uRingW[k]); // ring radii arrive in Rs
    if (abs(x) > 3.0) continue;
    // more mass → more ringlets inside each ring
    float lanes = 1.0 + floor(min(uRingI[k] * 2.5, 4.0));
    I += uRingI[k] * exp(-x * x) * (0.68 + 0.32 * cos(x * lanes * 3.14159));
  }
  if (I < 1e-3) return vec4(0.0);
  // Keplerian shear (Kerr prograde Ω = 1/(r^1.5 + a)): the pattern turns faster inside
  float ang = ph - uTime * 2.55 / (pow(r, 1.5) + uSpin);
  vec2 rot = vec2(cos(ang), sin(ang));
  float rs = r * 0.5;
  float n = vnoise(rot * rs * 1.4) * 0.55 + vnoise(rot * 3.0 + vec2(rs * 3.7, 0.0)) * 0.45;
  I *= 0.5 + 0.8 * n;
  // white-hot palette: blue-white inside, neutral white outside
  vec3 col = mix(vec3(0.74, 0.85, 1.0), vec3(1.0, 0.98, 0.95), smoothstep(uIsco, DISK_OUT, r));
  if (uShift > 0.5) {
    // Doppler + gravitational shift: the blackbody arrives at g·T0 (colour and brightness together, I_ν ∝ ν³)
    float g = diskRedshift(max(r, uIsco), b);
    vec3 bb = blackbody(g * T0);
    float lum = dot(bb, vec3(0.3, 0.59, 0.11));
    col *= bb / max(1e-3, pow(lum, 0.35)); // keep the huge dynamic range readable after tonemapping
  }
  return vec4(col * I * 0.85, clamp(I * 0.7, 0.0, 0.9));
}

void main() {
  vec4 scene = texture2D(tDiffuse, vUv);
  if (uRs <= 1e-5) {
    gl_FragColor = scene;
    return;
  }
  float M = 0.5 * uRs;
  vec4 vp = uInvProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec3 dir = normalize((uCamWorld * vec4(vp.xyz / vp.w, 0.0)).xyz);
  vec3 ro = (uCamPos - uBHPos) / M;
  float tca = -dot(ro, dir);
  bool insideSphere = length(ro) < MARCH_R;
  if (tca <= 0.0 && !insideSphere) {
    gl_FragColor = scene;
    return;
  }
  vec3 cvec = ro + dir * max(tca, 0.0);
  float b = length(cvec);

  // geometry clearly in front of the lens plane stays unlensed
  float front = 0.0;
  float here = 1e6;
  if (uHasDepth > 0.5) {
    here = linearDepthAt(vUv);
    float ref = lensDepthRef();
    if (here < 1e5) front = 1.0 - smoothstep(ref - 5.0 * uRs, ref - 3.0 * uRs, here);
  }

  vec3 outDir;
  vec3 bendW = uBHPos + cvec * M;
  vec3 diskCol = vec3(0.0);
  float diskA = 0.0;
  float captured = 0.0;
  bool surf = false;
  vec3 surfCol = vec3(0.0);
  if (b >= MARCH_R) {
    // weak field: a surface on the straight stretch before the bend is simply what this pixel sees
    if (here < dot(bendW - uCamPos, uCamFwd)) {
      gl_FragColor = scene;
      return;
    }
    outDir = normalize(dir - (4.0 / (b * b)) * cvec); // α = 4M/b
  } else {
    float S = sqrt(MARCH_R * MARCH_R - b * b);
    vec3 entry = ro + dir * max(tca - S, 0.0);
    vec3 x;
    vec2 p;
    float bb, qq;
    initRay(worldToBL(entry), worldToBL(dir), x, p, bb, qq);
    bool exited = false;
    float zPrev = dot(uBHPos + entry * M - uCamPos, uCamFwd);
    vec3 dx1, dx2;
    vec2 dp1, dp2;
    for (int i = 0; i < STEPS; i++) {
      // BL coordinates are singular on the spin axis: hop straight across it and re-initialise on the far side
      if (abs(sin(x.y)) < ${KERR.poleSin.toFixed(3)}) {
        vec3 Pc = blToCart(x);
        vec3 dc = rayDir(x, p, bb);
        float dxy = dot(dc.xy, dc.xy);
        float tStar = dxy > 1e-12 ? -dot(Pc.xy, dc.xy) / dxy : 0.0;
        if (tStar > 0.0) initRay(Pc + dc * (2.0 * tStar + 0.002 * x.x), dc, x, p, bb, qq);
      }
      vec3 xPrev = x;
      kerrDerivs(x, p, bb, qq, dx1, dp1);
      // cap the angular change per step too, and the approach to the axis
      float h = -min(min(kerrStep(x.x), ${KERR.axisK.toFixed(3)} * abs(sin(x.y)) / (abs(dx1.y) + 1e-9)), min(${KERR.maxDTheta.toFixed(3)} / (abs(dx1.y) + 1e-9), ${KERR.maxDPhi.toFixed(3)} / (abs(dx1.z) + 1e-9)));
      kerrDerivs(x + dx1 * (0.5 * h), p + dp1 * (0.5 * h), bb, qq, dx2, dp2);
      x += dx2 * h;
      p += dp2 * h;
      if (cos(xPrev.y) * cos(x.y) < 0.0) {
        float f = cos(xPrev.y) / (cos(xPrev.y) - cos(x.y));
        vec4 d = diskAt(mix(xPrev.x, x.x, f), mix(xPrev.z, x.z, f), bb);
        diskCol += (1.0 - diskA) * d.rgb;
        diskA += (1.0 - diskA) * d.a;
        if (diskA > 0.97) break;
      }
      if (x.x < uHorizon * 1.01) {
        captured = 1.0;
        break;
      }
      if (x.x > MARCH_R && x.x > xPrev.x) {
        exited = true;
        break;
      }
      // the bent ray itself runs into a body near the hole (every 3rd step against the depth buffer)
      if (uHasDepth > 0.5 && (i % 3 == 2)) {
        vec3 X = uBHPos + blToWorld(blToCart(x)) * M;
        float zr = dot(X - uCamPos, uCamFwd);
        vec2 suv = projectPoint(X);
        if (suv.x >= 0.0 && suv.y >= 0.0 && suv.x <= 1.0 && suv.y <= 1.0 && zr > uNear) {
          float zs = linearDepthAt(suv);
          if (zs < 1e5 && zs <= max(zr, zPrev) + 0.05 && zs >= min(zr, zPrev) - 0.25) {
            surf = true;
            surfCol = texture2D(tDiffuse, suv).rgb;
            break;
          }
        }
        zPrev = zr;
      }
    }
    // rays still circling the photon orbits when steps run out read as shadow
    if (!exited && !surf && captured < 0.5 && diskA <= 0.97) captured = 1.0;
    // exit direction from the FIDO-frame momentum, then the residual weak-field bend outside
    vec3 vn = normalize(blToWorld(rayDir(x, p, bb)));
    vec3 pw = blToWorld(blToCart(x));
    vec3 cp = pw - vn * dot(pw, vn);
    float resid = (4.0 / max(b, 2.0)) * (1.0 - S / MARCH_R);
    outDir = normalize(vn - resid * normalize(cp + vec3(1e-5)));
    bendW = uBHPos + pw * M;
  }

  vec3 bg = surf ? surfCol : captured > 0.5 ? vec3(0.0) : sampleLensed(bendW, outDir);
  vec3 lensed = diskCol + (1.0 - diskA) * bg;
  gl_FragColor = vec4(mix(lensed, scene.rgb, front), 1.0);
}
`,
};

/**
 * Turn per-clump accretion into lens ring uniforms.
 * @param {Array<{r:number, mass:number}>} entries  r in world units
 * @param {number} extraMass  mass delivered by fx particles / chunks (feeds the inner disk)
 * @returns {{ r: Float32Array, w: Float32Array, i: Float32Array, count: number, base: number, total: number }}
 */
export function buildRings(entries, extraMass = 0) {
  let total = extraMass;
  let rings = [];
  for (const e of entries) {
    total += e.mass;
    if (e.mass <= 1e-6) continue;
    const I = 0.55 * Math.log(1 + e.mass / 0.004);
    rings.push({ r: e.r / BH_RS, i: I, w: 0.35 + 0.25 * I });
  }
  rings.sort((a, b) => a.r - b.r);
  const merged = [];
  for (const g of rings) {
    const last = merged[merged.length - 1];
    if (last && Math.abs(g.r - last.r) < 0.3 * (g.w + last.w)) {
      const sum = last.i + g.i;
      last.r = (last.r * last.i + g.r * g.i) / sum;
      last.w = Math.max(last.w, g.w) + 0.1;
      last.i = sum;
    } else {
      merged.push({ ...g });
    }
  }
  rings = merged.sort((a, b) => b.i - a.i).slice(0, RING_MAX);
  const out = { r: new Float32Array(RING_MAX), w: new Float32Array(RING_MAX), i: new Float32Array(RING_MAX), count: rings.length, total };
  rings.forEach((g, k) => {
    out.r[k] = g.r;
    out.w[k] = g.w;
    out.i[k] = Math.min(2.0, g.i);
  });
  out.base = Math.min(1.6, 0.3 * Math.log(1 + total / 0.006));
  return out;
}

export class BlackHolePass extends Pass {
  constructor(camera, opts = {}) {
    super();
    this.camera = camera;
    const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    this.material = new THREE.ShaderMaterial({
      name: 'blackhole-lens',
      defines: { STEPS: opts.steps ?? (coarse ? 110 : 200), RING_MAX },
      uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        uHasDepth: { value: 0 },
        uNear: { value: 0.1 },
        uFar: { value: 200 },
        uInvProj: { value: new THREE.Matrix4() },
        uCamWorld: { value: new THREE.Matrix4() },
        uViewProj: { value: new THREE.Matrix4() },
        uCamPos: { value: new THREE.Vector3() },
        uCamFwd: { value: new THREE.Vector3(0, 0, -1) },
        uBHPos: { value: new THREE.Vector3() },
        uRs: { value: 0 },
        uTime: { value: 0 },
        uBgColor: { value: new THREE.Color(0x04060c) },
        uDiskBase: { value: 0 },
        uRingR: { value: new Float32Array(RING_MAX) },
        uRingW: { value: new Float32Array(RING_MAX).fill(1) },
        uRingI: { value: new Float32Array(RING_MAX) },
        uRingCount: { value: 0 },
        uSpin: { value: KERR_LOOKS.interstellar.spin },
        uShift: { value: KERR_LOOKS.interstellar.shifts },
        uIsco: { value: isco(KERR_LOOKS.interstellar.spin) },
        uHorizon: { value: horizon(KERR_LOOKS.interstellar.spin) },
      },
      vertexShader: BLACKHOLE_SHADER.vertexShader,
      fragmentShader: BLACKHOLE_SHADER.fragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    this.fsQuad = new FullScreenQuad(this.material);
    this.enabled = false;
    this.rings = null;
  }

  /** rs: world Schwarzschild radius (0 disables), rings: buildRings() output, spin a/M, shifts 0|1. */
  setState({ rs = 0, rings = null, time = 0, position = null, background = null, spin = null, shifts = null } = {}) {
    const u = this.material.uniforms;
    if (spin != null) {
      const a = Math.max(0, Math.min(0.999, spin));
      u.uSpin.value = a;
      u.uIsco.value = isco(a);
      u.uHorizon.value = horizon(a);
    }
    if (shifts != null) u.uShift.value = shifts ? 1 : 0;
    u.uRs.value = rs;
    u.uTime.value = time;
    this.enabled = rs > 1e-5;
    if (position) u.uBHPos.value.copy(position);
    if (background) u.uBgColor.value.copy(background);
    if (rings) {
      this.rings = rings;
      u.uRingR.value.set(rings.r);
      u.uRingW.value.set(rings.w);
      u.uRingI.value.set(rings.i);
      u.uRingCount.value = rings.count;
      u.uDiskBase.value = rings.base;
    }
  }

  render(renderer, writeBuffer, readBuffer) {
    const u = this.material.uniforms;
    const cam = this.camera;
    u.tDiffuse.value = readBuffer.texture;
    u.tDepth.value = readBuffer.depthTexture || null;
    u.uHasDepth.value = readBuffer.depthTexture ? 1 : 0;
    u.uNear.value = cam.near;
    u.uFar.value = cam.far;
    u.uInvProj.value.copy(cam.projectionMatrixInverse);
    u.uCamWorld.value.copy(cam.matrixWorld);
    u.uViewProj.value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    cam.getWorldPosition(u.uCamPos.value);
    cam.getWorldDirection(u.uCamFwd.value);
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    if (this.clear) renderer.clear();
    this.fsQuad.render(renderer);
  }

  dispose() {
    this.material.dispose();
    this.fsQuad.dispose();
  }
}

/** Give both composer targets depth textures so the lens can keep foreground objects unwarped. */
export function attachComposerDepth(composer) {
  for (const rt of [composer.renderTarget1, composer.renderTarget2]) {
    if (rt.depthTexture) rt.depthTexture.dispose();
    rt.depthTexture = new THREE.DepthTexture(rt.width, rt.height);
  }
}
