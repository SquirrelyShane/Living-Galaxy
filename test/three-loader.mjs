/* Node loader hook: the ship generator imports bare "three" (the page maps it
 * with an import map); here it resolves to the vendored build so headless
 * tests run the real geometry. Usage: node --import ./test/three-register.mjs <script> */
export async function resolve(specifier, context, next) {
  if (specifier === "three") return { url: new URL("../vendor/three.module.min.js", import.meta.url).href, shortCircuit: true };
  /* the asteroid generator's lens imports Pass/FullScreenQuad from three's
   * examples; the game answers that one specifier with a local copy */
  if (specifier === "three/addons/postprocessing/Pass.js") return { url: new URL("../js/asteroidgen/addons/Pass.js", import.meta.url).href, shortCircuit: true };
  return next(specifier, context);
}
