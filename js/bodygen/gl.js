import { SHADERS } from "../asteroidgen/debris.js";
import { IMPACT_SHADERS } from "../asteroidgen/impact-shaders.js";

export function logDepthVertex(src) {
  if (src.includes("logdepthbuf_vertex")) return src;
  const end = src.lastIndexOf("}");
  return `#include <common>\n#include <logdepthbuf_pars_vertex>\n${src.slice(0, end)}  #include <logdepthbuf_vertex>\n${src.slice(end)}`;
}

export function logDepthFragment(src) {
  if (src.includes("logdepthbuf_fragment")) return src;
  const at = src.indexOf("void main() {");
  if (at < 0) return src;
  const body = at + "void main() {".length;
  return `#include <logdepthbuf_pars_fragment>\n${src.slice(0, body)}\n  #include <logdepthbuf_fragment>${src.slice(body)}`;
}

function stripCommon(src) {
  return src.replace(/#include <common>\n?/g, "");
}

let patched = false;

export function patchGeneratorShaders() {
  if (patched) return;
  patched = true;

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

  for (const k of ["bodyVertex", "spriteVertex", "rockVertex"]) IMPACT_SHADERS[k] = logDepthVertex(stripCommon(IMPACT_SHADERS[k]));
  for (const k of ["bodyFragment", "spriteFragment", "rockFragment"]) IMPACT_SHADERS[k] = logDepthFragment(IMPACT_SHADERS[k]);
}

export function addFadeUniform(uniforms) {
  if (!uniforms.uFade) uniforms.uFade = { value: 1 };
  return uniforms.uFade;
}
