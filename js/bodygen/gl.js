/* LIVING GALAXY — making the asteroid generator's shaders sit in this renderer.
 *
 * The generator's hand-written ShaderMaterials (debris clouds, shatter fields,
 * Impact Lab sprites and ejecta rocks, fractured bodies) were written for a
 * demo page with an ordinary depth buffer and a scene ten units across. This
 * game renders with `logarithmicDepthBuffer: true` across thirty million units,
 * and a ShaderMaterial that does not include three's logdepth chunks writes a
 * LINEAR depth into a logarithmic buffer — every rock in a debris cloud then
 * sorts against the hull, the canopy and each other by the wrong number, which
 * reads as clouds drawn through ships. MeshStandardMaterial-based paths get the
 * chunks for free; these do not, so they are added here.
 *
 * The vendored files are not edited. Their shader text is exported as mutable
 * objects (`SHADERS` in debris.js, `IMPACT_SHADERS` in impact-shaders.js), and
 * the generator reads them at material-creation time, so patching the strings
 * once, before the first material is made, is enough.
 *
 * One addition rides along on the debris shaders: `uFade`, a 0..1 master that
 * shrinks every instance to nothing and fades every mote. The generator's
 * fields live forever (a demo has one rock); a game spawns a shatter field
 * every time a rock is cut out and needs a way to let one go.
 */

import { SHADERS } from "../asteroidgen/debris.js";
import { IMPACT_SHADERS } from "../asteroidgen/impact-shaders.js";

/** Add three's logarithmic-depth chunks to a vertex shader string. */
export function logDepthVertex(src) {
  if (src.includes("logdepthbuf_vertex")) return src;
  const end = src.lastIndexOf("}");
  return `#include <common>\n#include <logdepthbuf_pars_vertex>\n${src.slice(0, end)}  #include <logdepthbuf_vertex>\n${src.slice(end)}`;
}

/** Add three's logarithmic-depth chunks to a fragment shader string. */
export function logDepthFragment(src) {
  if (src.includes("logdepthbuf_fragment")) return src;
  const at = src.indexOf("void main() {");
  if (at < 0) return src;
  const body = at + "void main() {".length;
  return `#include <logdepthbuf_pars_fragment>\n${src.slice(0, body)}\n  #include <logdepthbuf_fragment>${src.slice(body)}`;
}

/* An early `return` in a vertex main (the Impact Lab sprites hide unemitted
 * slots that way) skips the chunk at the end, which is harmless: the point is
 * parked off-screen at size 0. But `common` must not be included twice. */
function stripCommon(src) {
  return src.replace(/#include <common>\n?/g, "");
}

let patched = false;

/** Patch the generator's shader text once. Safe to call from every module that builds its materials. */
export function patchGeneratorShaders() {
  if (patched) return;
  patched = true;

  /* ---- debris / shatter fields ---------------------------------------- */
  const fade = (v) => v
    .replace("uniform float uTime;", "uniform float uTime;\nuniform float uFade;")
    .replace("vec3 o = rotY(offset * vis, ang);", "vec3 o = rotY(offset * vis * uFade, ang);");
  SHADERS.solidVertex = logDepthVertex(stripCommon(fade(SHADERS.solidVertex)));
  SHADERS.pointsVertex = logDepthVertex(stripCommon(
    fade(SHADERS.pointsVertex).replace(
      "aColor.a * gVis * (1.0 + gHeat * 1.5));",
      "aColor.a * gVis * uFade * (1.0 + gHeat * 1.5));",
    ),
  ));
  SHADERS.iceFragment = logDepthFragment(SHADERS.iceFragment);
  SHADERS.rockFragment = logDepthFragment(SHADERS.rockFragment);
  SHADERS.pointsFragment = logDepthFragment(SHADERS.pointsFragment);

  /* ---- Impact Lab: fractured bodies, sprites, ejecta rocks ------------- */
  for (const k of ["bodyVertex", "spriteVertex", "rockVertex"]) IMPACT_SHADERS[k] = logDepthVertex(stripCommon(IMPACT_SHADERS[k]));
  for (const k of ["bodyFragment", "spriteFragment", "rockFragment"]) IMPACT_SHADERS[k] = logDepthFragment(IMPACT_SHADERS[k]);
}

/** The uniform every patched debris field needs before its first frame. */
export function addFadeUniform(uniforms) {
  if (!uniforms.uFade) uniforms.uFade = { value: 1 };
  return uniforms.uFade;
}
