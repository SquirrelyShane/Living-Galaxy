// Living Galaxy — the particle shader, on its own and importing nothing.
//
// Split out of `world/particles.js` at v1.02.41 for one reason: **GLSL cannot be tested by a
// JavaScript suite.** A typo in here does not throw, does not fail an assertion and does not
// show up in `node test/all.mjs` — it produces a silent black screen on somebody's phone, and
// the only signal is a driver info log nobody is reading.
//
// With the source in a module that imports nothing, `tools/shader-check.html` can pull it into
// a real WebGL context and actually compile it, in one click, without three.js and without
// booting the game. That is the whole justification for the extra file.
//
// ── the scale bug this shader used to carry (v1.02.50) ───────────────
//
// The attenuation reference below was a hardcoded `300.0`, and it was right — for the scene it
// was written for. Combat sparks live tens to thousands of world units from the camera, and
// 300 is the distance at which a spark renders at its authored pixel size.
//
// Then the galaxy chart reused the same shader. Its camera sits **78,000 units** from the
// focus, because the disc is 52,000 light-years across. Every star came out at
// `7 * (300 / 78000)` — twenty-seven thousandths of a pixel. The chart was not failing to draw:
// it was drawing fifty thousand stars, all of them far smaller than a pixel, which a
// rasteriser resolves to nothing at all. A black screen with working tap-to-select, because
// picking is CPU-side projection and never asked the GPU anything.
//
// A compile check could never have caught it — the GLSL was valid. The fault was a constant
// that encoded an assumption about scene scale, in a file shared by two scenes whose scales
// differ by three orders of magnitude. So the reference distance is a **uniform** now, and
// each scene states its own. `uRef` defaults to 300 so the particle system is untouched.

/**
 * Per-vertex size and alpha need a shader — `PointsMaterial` has one size for the whole
 * system, which is why the old combat sparks were all the same nine pixels whether they were
 * new or nearly dead. Twenty lines of GLSL buys a particle that shrinks and fades on its own,
 * and it stays one draw call.
 *
 * `position` and `color` are declared by three.js itself; `aSize` is ours.
 */
export const PARTICLE_VERT = `
  attribute vec2 aSize;          // x = current pixel size, y = current alpha
  uniform float uRef;            // distance at which aSize.x IS the pixel size
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = color;
    vAlpha = aSize.y;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Attenuate with distance so a spark forty kilometres away is not the same size as one
    // on the canopy — the thing that made distant fights read as confetti.
    //
    // uRef is the scene's own scale. A scene that does not set it gets 300, which is the
    // world scale this was originally written against. (No backticks in here: the whole
    // shader is a template literal, and one stray backtick ends it mid-GLSL.)
    gl_PointSize = aSize.x * (uRef / max(1.0, -mv.z));
    gl_Position = projectionMatrix * mv;
  }`;

/** The world scale — sparks, plumes, debris. What the constant used to be. */
export const PARTICLE_REF = 300.0;

/**
 * Uniforms every consumer of this shader must supply.
 *
 * A helper rather than a bare object literal at each call site, because the failure mode of
 * forgetting `uRef` is a silent black screen rather than an error, and that is exactly the
 * class of bug this file was split out to make impossible.
 */
export const particleUniforms = (ref = PARTICLE_REF) => ({ uRef: { value: ref } });

export const PARTICLE_FRAG = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    // A round, soft particle. A square one is legible as a square at close range, and once
    // seen cannot be unseen.
    vec2 d = gl_PointCoord - vec2(0.5);
    float r = dot(d, d);
    if (r > 0.25) discard;
    float soft = 1.0 - smoothstep(0.06, 0.25, r);
    gl_FragColor = vec4(vColor, vAlpha * soft);
  }`;
