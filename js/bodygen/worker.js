const THREE_URL = new URL("../../vendor/three.module.min.js", import.meta.url).href;
const blobs = new Map();
const FROM = /((?:import|export)\s+[^'";]*?\sfrom\s*)(['"])([^'"]+)\2/g;
const BARE = /(^|[;\n]\s*)(import\s*)(['"])([^'"]+)\3/g;

function loadModule(url) {
  if (blobs.has(url)) return blobs.get(url);
  const p = (async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`grower: ${url} → ${res.status}`);
    let src = await res.text();
    const specs = new Set();
    for (const m of src.matchAll(FROM)) specs.add(m[3]);
    for (const m of src.matchAll(BARE)) specs.add(m[4]);
    const to = new Map();
    for (const s of specs) {
      if (s === "three") to.set(s, THREE_URL);
      else if (s.startsWith(".")) to.set(s, await loadModule(new URL(s, url).href));
      else to.set(s, s);
    }
    src = src
      .replace(FROM, (all, pre, q, s) => `${pre}${q}${to.get(s) ?? s}${q}`)
      .replace(BARE, (all, lead, imp, q, s) => `${lead}${imp}${q}${to.get(s) ?? s}${q}`);
    return URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
  })();
  blobs.set(url, p);
  return p;
}

let body = null;
const ready = (async () => {
  body = await import(await loadModule(new URL("./body.js", import.meta.url).href));
})();

self.onmessage = async (e) => {
  const { id, opts } = e.data;
  try {
    await ready;
    const d = body.growBaked(opts);
    self.postMessage({ id, d }, body.bakedTransfer(d));
  } catch (err) {
    self.postMessage({ id, error: String(err?.stack ?? err) });
  }
};

ready.then(() => self.postMessage({ ready: true }), (err) => self.postMessage({ fatal: String(err?.stack ?? err) }));
