/* LIVING GALAXY 0.3.61 — the module preload list.
 *
 *   node tools/preload.mjs          rewrite the block in index.html
 *   node tools/preload.mjs --check  exit 1 if the block is stale (test/preload.test.mjs runs this)
 *
 * The browser only learns a module's imports once it has fetched and parsed
 * it, so the graph loads one LEVEL per round trip. main.js sits 34 levels
 * above its deepest leaf: on localhost that is nothing, through the tunnel
 * on a phone at ~100–250 ms a hop it was 3–8 s of the start card doing
 * nothing but waiting. `<link rel="modulepreload">` for every module in the
 * static graph hands the browser the whole list up front, so the fetches go
 * out together and the depth stops costing anything.
 *
 * No build step: this walks the same files the browser does, with the same
 * import map, and writes plain tags between two markers. A module added
 * without re-running this still loads (just one hop later) — the test is what
 * notices.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = path.join(ROOT, "index.html");
const BEGIN = "<!-- preload:begin (node tools/preload.mjs) -->";
const END = "<!-- preload:end -->";

/** The import map in index.html, so bare "three" resolves the way the page resolves it. */
function importMap(html) {
  const m = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
  return m ? JSON.parse(m[1]).imports ?? {} : {};
}

/* Static imports only: `import … from "x"`, `import "x"`, `export … from "x"`.
 * A dynamic import() is a deliberate "later" and stays out. Comments are
 * stripped first so a commented-out import is not preloaded. */
const STATIC = /(?:^|[;\n}])\s*(?:import|export)\s*(?:[\w*{}\s,$]+?\s*from\s*)?["']([^"']+)["']/g;
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");

export function graph(entry = "js/main.js") {
  const html = fs.readFileSync(INDEX, "utf8");
  const map = importMap(html);
  const seen = new Set();
  const walk = (abs) => {
    if (seen.has(abs) || !fs.existsSync(abs)) return;
    seen.add(abs);
    const src = strip(fs.readFileSync(abs, "utf8"));
    for (const m of src.matchAll(STATIC)) {
      let spec = m[1];
      if (map[spec]) spec = map[spec];
      let target;
      if (spec.startsWith("./") && map[m[1]]) target = path.join(ROOT, spec);          // import-map target, page-relative
      else if (spec.startsWith(".")) target = path.resolve(path.dirname(abs), spec);
      else if (spec.startsWith("/")) target = path.join(ROOT, spec);
      else continue;                                                               // an unmapped bare name: not ours
      walk(target);
    }
  };
  walk(path.join(ROOT, entry));
  return [...seen].map((f) => "./" + path.relative(ROOT, f).split(path.sep).join("/")).sort();
}

export function block(list = graph()) {
  const lines = list.filter((f) => f !== "./js/main.js").map((f) => `    <link rel="modulepreload" href="${f}" />`);
  return `${BEGIN}\n${lines.join("\n")}\n    ${END}`;
}

export function current(html = fs.readFileSync(INDEX, "utf8")) {
  const a = html.indexOf(BEGIN), b = html.indexOf(END);
  return a < 0 || b < 0 ? null : html.slice(a, b + END.length);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const html = fs.readFileSync(INDEX, "utf8");
  const want = block();
  const have = current(html);
  if (process.argv.includes("--check")) {
    if (have !== want) { console.error("index.html preload block is stale — run: node tools/preload.mjs"); process.exit(1); }
    console.log("preload block current:", want.split("\n").length - 2, "modules");
  } else {
    if (!have) { console.error(`index.html has no ${BEGIN} … ${END} markers`); process.exit(1); }
    fs.writeFileSync(INDEX, html.replace(have, want));
    console.log("wrote", want.split("\n").length - 2, "preload tags");
  }
}
