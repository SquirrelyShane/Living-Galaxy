// Static audit: do imports resolve, do named exports exist, does every id/selector
// referenced from JS actually appear in index.html and the stylesheets?
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, resolve, relative } from 'path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
let problems = 0;
const bad = m => { problems++; console.log('  FAIL ' + m); };

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (f.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = walk(join(ROOT, 'src'));
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
// Read whatever index.html actually links, rather than a hand-kept list — a stylesheet
// added to the markup and forgotten here silently drops out of the selector audit.
const sheets = [...html.matchAll(/href="([^"]+\.css)"/g)].map(m => m[1]);
const css = sheets.filter(p => existsSync(join(ROOT, p)))
                  .map(p => readFileSync(join(ROOT, p), 'utf8')).join('\n');

// ── exports per file ─────────────────────────────────────────────────
const exportsOf = new Map();
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?function\s+([\w$]+)/g)) names.add(m[1]);
  // handles `export const a = 1` and `export let a, b, c;`
  for (const m of src.matchAll(/export\s+(?:const|let|var|class)\s+([^=;\n]+)/g))
    m[1].split(',').forEach(n => { const t = n.trim().split(/[\s({]/)[0]; if (t) names.add(t); });
  for (const m of src.matchAll(/export\s*\{([^}]+)\}/g))
    m[1].split(',').forEach(n => names.add(n.trim().split(/\s+as\s+/).pop().trim()));
  exportsOf.set(f, names);
}

// `export * from './y.js'` republishes y's whole surface, so a barrel that uses it has
// exports this file never sees written down. Resolve those transitively — depth-capped
// and cycle-guarded, because a barrel that re-exports a module which imports the barrel
// back is a legal and load-bearing shape here (crafting/derived.js does exactly that).
const starOf = new Map();
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  starOf.set(f, [...src.matchAll(/export\s*\*\s*from\s*'([^']+)'/g)]
    .map(m => resolve(dirname(f), m[1])).filter(t => exportsOf.has(t)));
}
const resolveStars = (f, seen = new Set()) => {
  if (seen.has(f)) return;
  seen.add(f);
  for (const t of starOf.get(f) || []) {
    resolveStars(t, seen);
    for (const n of exportsOf.get(t)) exportsOf.get(f).add(n);
  }
};
for (const f of files) resolveStars(f);

console.log('\n— imports —');
let importCount = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*'([^']+)'/g)) {
    const target = resolve(dirname(f), m[2]);
    importCount++;
    if (!existsSync(target)) { bad(`${relative(ROOT, f)} imports missing file ${m[2]}`); continue; }
    const have = exportsOf.get(target);
    for (const raw of m[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/)[0].trim();
      if (name && have && !have.has(name))
        bad(`${relative(ROOT, f)} imports {${name}} which ${m[2]} does not export`);
    }
  }
}
// Barrels re-export without importing, so the loop above never sees them. An `export { x }
// from './y.js'` that names something y.js does not export only fails at runtime, and only
// for whoever imports the barrel — which, for a barrel nothing imports yet, is nobody.
let reexportCount = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/export\s*\{([^}]+)\}\s*from\s*'([^']+)'/g)) {
    const target = resolve(dirname(f), m[2]);
    reexportCount++;
    if (!existsSync(target)) { bad(`${relative(ROOT, f)} re-exports from missing file ${m[2]}`); continue; }
    const have = exportsOf.get(target);
    for (const raw of m[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/)[0].trim();
      if (name && have && !have.has(name))
        bad(`${relative(ROOT, f)} re-exports {${name}} which ${m[2]} does not export`);
    }
  }
}
console.log(`  checked ${importCount} import statements and ${reexportCount} re-exports across ${files.length} modules`);

// ── DOM ids ──────────────────────────────────────────────────────────
console.log('\n— element ids —');
const htmlIds = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
const used = new Set();
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/\$\('([^']+)'\)/g)) used.add(m[1]);
  for (const m of src.matchAll(/getElementById\('([^']+)'\)/g)) used.add(m[1]);
  for (const m of src.matchAll(/const IDS = \[([\s\S]*?)\];/g))
    for (const q of m[1].matchAll(/'([^']+)'/g)) used.add(q[1]);
}
for (const id of used) if (!htmlIds.has(id)) bad(`JS references #${id}, which index.html does not define`);
console.log(`  ${used.size} referenced ids, ${htmlIds.size} defined in markup`);

// ── selectors ────────────────────────────────────────────────────────
console.log('\n— selectors —');
const sels = new Set();
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/querySelectorAll\('([^']+)'\)/g)) sels.add(m[1]);
}
for (const s of sels) {
  const cls = s.match(/\.([\w-]+)/g) || [];
  for (const c of cls) {
    const name = c.slice(1);
    if (!html.includes(`class="${name}`) && !html.includes(` ${name}"`) &&
        !html.includes(`${name} `) && !css.includes('.' + name))
      bad(`selector ${s} targets .${name}, absent from markup and CSS`);
  }
}
console.log(`  ${sels.size} querySelectorAll selectors checked`);

// ── stylesheet + script wiring ───────────────────────────────────────
console.log('\n— assets —');
for (const m of html.matchAll(/href="([^"]+\.css)"/g))
  if (!existsSync(join(ROOT, m[1]))) bad(`index.html links missing stylesheet ${m[1]}`);
for (const m of html.matchAll(/<script[^>]+src="(?!https?:)([^"]+)"/g))
  if (!existsSync(join(ROOT, m[1]))) bad(`index.html loads missing script ${m[1]}`);
console.log('  stylesheet and script paths resolved');

// ── build identity lives in one file ────────────────────────────────
//
// index.html carried `v1.01.70 · Consignment` as the boot stamp's initial text for ten
// slices. main.js overwrites it from core/version.js as soon as the module graph loads, so
// it was only ever on screen for a beat — but it *was* on screen, on every boot, and a
// wipe-and-reload held it there long enough to read as the game reverting to an old build.
//
// The rule is general: a version, codename or schema number written into markup or a
// stylesheet has no way to stay true, because nothing that bumps the real one will think to
// look there. A version inside a comment is history and passes; one in displayed text does
// not.
console.log('\n— build identity —');
{
  const sources = [['index.html', html]];
  for (const f of readdirSync(join(ROOT, 'css')))
    if (f.endsWith('.css')) sources.push([`css/${f}`, readFileSync(join(ROOT, 'css', f), 'utf8')]);

  let found = 0;
  for (const [name, text] of sources) {
    for (const m of text.matchAll(/v?\d+\.\d+\.\d+/g)) {
      const lineStart = text.lastIndexOf('\n', m.index) + 1;
      const lineEnd = text.indexOf('\n', m.index);
      const line = text.slice(lineStart, lineEnd < 0 ? text.length : lineEnd);
      // A comment is history, not identity. HTML comments run to several lines, so the test
      // is whether this offset sits inside one — checking only the line's first character
      // missed every continuation line, which is how this check first failed on the comment
      // that explains why the check exists.
      const before = text.slice(0, m.index);
      const inHtmlComment = before.lastIndexOf('<!--') > before.lastIndexOf('-->');
      if (inHtmlComment) continue;
      if (/^\s*(\/\/|\/\*|\*)/.test(line)) continue;
      if (/(three|cdnjs|r1\d\d)/i.test(line)) continue;         // a CDN library pin is a dependency
      found++;
      bad(`${name} hard-codes a build string: ${line.trim().slice(0, 70)}`);
    }
  }
  if (!found) console.log('  no version string in markup or stylesheets');
}

console.log(problems ? `\n${problems} problem(s)\n` : '\nno problems\n');
process.exit(problems ? 1 : 0);
