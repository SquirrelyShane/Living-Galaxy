/**
 * GLSL for the collision demo: fractured bodies (chunks driven by impact-sim.js),
 * GPU dust / ice / spark sprites and instanced meshed ejecta rocks. Particles are
 * emitted over time (blast, surface shedding, secondary impacts) with an emission
 * time aT0 and then move analytically: a drag-damped burst plus a slow outward drift.
 */
import { FRACTURE_GLSL } from './fracture.js';

const HEAT_RAMP = /* glsl */ `
vec3 heatRamp(float h) {
  vec3 c = mix(vec3(0.0), vec3(0.45, 0.03, 0.0), smoothstep(0.0, 0.25, h));
  c = mix(c, vec3(1.0, 0.32, 0.04), smoothstep(0.2, 0.5, h));
  c = mix(c, vec3(1.0, 0.82, 0.5), smoothstep(0.45, 0.8, h));
  c = mix(c, vec3(0.78, 0.88, 1.0), smoothstep(0.8, 1.2, h));
  return c * (0.5 + 3.5 * h);
}
`;

const LIGHT = /* glsl */ `
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uAmbient;
`;

export const IMPACT_SHADERS = {
  bodyVertex: /* glsl */ `
${FRACTURE_GLSL.vertexPars}
attribute vec3 color;
varying vec3 vCol;
varying vec3 vN;
varying vec3 vW;
void main() {
  mat3 R;
  float h;
  vec3 p = fractureVertex(position, R, h);
  vFracHeat = h;
  vFracCrack = aCrack;
  vCol = color;
  vN = normalize(mat3(modelMatrix) * (R * gFracNormal));
  vec4 w = modelMatrix * vec4(p, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`,
  bodyFragment: /* glsl */ `
${FRACTURE_GLSL.fragmentPars}
${LIGHT}
varying vec3 vCol;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing && vFracInner <= 0.0) n = -n;
  vec3 V = normalize(cameraPosition - vW);
  float ndl = max(dot(n, uSunDir), 0.0);
  float hemi = 0.5 + 0.5 * n.y;
  vec4 diffuseColor = vec4(vCol, 1.0);
  vec3 totalEmissiveRadiance = vec3(0.0);
  ${FRACTURE_GLSL.fragmentApply}
  vec3 H = normalize(uSunDir + V);
  float spec = pow(max(dot(n, H), 0.0), 32.0) * 0.12 * ndl;
  float rim = pow(1.0 - max(dot(n, V), 0.0), 3.0) * 0.08;
  vec3 col = diffuseColor.rgb * (uAmbient * 1.6 + vec3(0.07, 0.08, 0.1) * hemi + uSunColor * ndl) + uSunColor * spec + vec3(0.4, 0.55, 0.8) * rim + totalEmissiveRadiance;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`,
  spriteVertex: /* glsl */ `
${HEAT_RAMP}
uniform float uTime;
uniform float uImpact;
uniform float uPx;
uniform float uDrag;
uniform float uSlow;
attribute vec3 aVel;
attribute vec4 aData;   // size, seed, heat0, kind (0 dust · 1 ice · 2 spark)
attribute vec3 aColor;
attribute float aT0;    // emission time after impact (blast 0 · shedding · secondary impacts)
varying vec4 vC;
void main() {
  float tau = uTime - uImpact - aT0;
  if (tau < 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vC = vec4(0.0);
    return;
  }
  // drag-damped burst, then a slow outward drift that never quite stops
  float d = uDrag * (0.6 + aData.y * 0.8);
  vec3 p = position + aVel * ((1.0 - exp(-d * tau)) / d + uSlow * tau);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float a;
  float size;
  vec3 col;
#ifdef SPARK
  float life = 0.5 + aData.y * 1.3;
  a = 1.0 - smoothstep(0.0, life, tau);
  size = aData.x * (1.0 + 2.0 * a);
  col = heatRamp(aData.z * (0.4 + 0.6 * a));
#else
  float hot = aData.z * exp(-tau * 0.9);
  if (aData.w > 0.5) {
    // ice: small hard crystals glinting as they tumble
    float tw = pow(0.5 + 0.5 * sin(tau * (2.5 + aData.y * 5.0) + aData.y * 40.0), 8.0);
    a = smoothstep(0.0, 0.2, tau) * mix(1.0, 0.55, smoothstep(10.0, 40.0, tau));
    size = aData.x * (0.8 + 1.4 * tw);
    col = aColor * (1.1 + 2.2 * tw);
  } else {
    // big blast puffs spread and thin out; fine shed grains stay fine so their swirl lines read
    float puff = smoothstep(0.12, 0.3, aData.x);
    a = smoothstep(0.0, 0.25, tau) * mix(1.0, 0.16 + 0.3 * (1.0 - puff), smoothstep(4.0, 28.0, tau)) * mix(1.0, 0.55, puff);
    size = aData.x * (0.6 + min(tau, 6.0) * mix(0.08, 0.22, puff));
    col = mix(aColor, heatRamp(hot), clamp(hot, 0.0, 1.0));
  }
#endif
  gl_PointSize = clamp(size * uPx / max(0.1, -mv.z), 1.0, 128.0);
  vC = vec4(col, a);
}
`,
  spriteFragment: /* glsl */ `
varying vec4 vC;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  if (d > 1.0) discard;
#ifdef SPARK
  float m = exp(-d * d * 6.0);
  gl_FragColor = vec4(vC.rgb, vC.a * m);
#else
  float m = 1.0 - d;
  m *= m;
  gl_FragColor = vec4(vC.rgb, vC.a * m * 0.75);
#endif
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`,
  rockVertex: /* glsl */ `
uniform float uTime;
uniform float uImpact;
uniform float uDrag;
uniform float uSlow;
attribute vec3 aColor;
attribute vec3 aVel;
attribute vec4 aSpin;   // tumble axis, rate
attribute vec4 aSpin2;  // precession axis, rate (the tumble axis itself wanders)
attribute vec2 aHeat;
attribute float aT0;
varying vec3 vW;
varying vec3 vCol;
varying float vH;
mat3 rotAxis(vec3 a, float ang) {
  float s = sin(ang);
  float c = cos(ang);
  float oc = 1.0 - c;
  return mat3(
    oc * a.x * a.x + c,       oc * a.x * a.y + a.z * s, oc * a.z * a.x - a.y * s,
    oc * a.x * a.y - a.z * s, oc * a.y * a.y + c,       oc * a.y * a.z + a.x * s,
    oc * a.z * a.x + a.y * s, oc * a.y * a.z - a.x * s, oc * a.z * a.z + c);
}
void main() {
  float tau = uTime - uImpact - aT0;
  float vis = step(0.0, tau) * smoothstep(0.0, 0.12, tau);
  tau = max(0.0, tau);
  vec3 lp = rotAxis(aSpin2.xyz, tau * aSpin2.w) * rotAxis(aSpin.xyz, tau * aSpin.w) * position;
  vec3 c0 = instanceMatrix[3].xyz;
  vec3 c = c0 + aVel * ((1.0 - exp(-uDrag * tau)) / uDrag + uSlow * tau);
  vec4 w = modelMatrix * vec4(c + mat3(instanceMatrix) * lp * vis, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
  vec3 ic = vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
  ic = instanceColor;
  #endif
  vCol = ic * aColor;
  vH = aHeat.x * exp(-tau * (0.45 + aHeat.y * 0.6));
}
`,
  rockFragment: /* glsl */ `
${HEAT_RAMP}
${LIGHT}
varying vec3 vW;
varying vec3 vCol;
varying float vH;
void main() {
  vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
  vec3 V = normalize(cameraPosition - vW);
  if (dot(n, V) < 0.0) n = -n;
  float ndl = max(dot(n, uSunDir), 0.0);
  vec3 alb = vCol * (1.0 - 0.7 * clamp(vH, 0.0, 1.0));
  vec3 col = alb * (uAmbient * 1.8 + uSunColor * ndl) + heatRamp(vH) * smoothstep(0.05, 0.4, vH);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`,
};
