/* Loader hook: bare "three" → stub; with STUB_SCENE=1 also swap the WebGL scene module. */
export async function resolve(specifier, context, next) {
  if (specifier === "three") return { url: new URL("./three-stub.mjs", import.meta.url).href, shortCircuit: true };
  if (process.env.STUB_SCENE && /scene\/scene\.js$/.test(specifier)) return { url: new URL("./scene-stub.mjs", import.meta.url).href, shortCircuit: true };
  return next(specifier, context);
}
