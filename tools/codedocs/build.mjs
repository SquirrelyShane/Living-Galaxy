#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse, strip, sameAst, symbols, harvest, trace, resolveSpec, listFiles, isBuiltinRoot } from "./lib.mjs";

const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const ROOT = path.resolve(opt("--root", path.join(path.dirname(fileURLToPath(import.meta.url)), "../..")));
const SRC = opt("--src", "js");
const DOCS = opt("--out", "docs");
const MIGRATE = flag("--migrate"), CHECK = flag("--check"), QUIET = flag("--quiet");
const VENDOR = (rel) => /(^|\/)vendor\//.test(rel);
const posix = (p) => p.split(path.sep).join("/");
const rel = (abs) => posix(path.relative(ROOT, abs));
const docOf = (r) => `${DOCS}/files/${r}.md`;
const linkTo = (fromDoc, r, anchor) => posix(path.relative(path.dirname(fromDoc), docOf(r))) + (anchor ? "#" + anchor : "");
const slug = (k) => "s-" + k.replace(/[^A-Za-z0-9_$]+/g, "-").replace(/\$/g, "S");
const log = (...a) => { if (!QUIET) console.log(...a); };
const esc = (t) => t.replace(/<(?=[A-Za-z/!])/g, "&lt;");
const code = (t) => { const m = (String(t).match(/`+/g) ?? []).reduce((a, b) => Math.max(a, b.length), 0); const f = "`".repeat(m + 1); return m ? `${f} ${t} ${f}` : `${f}${t}${f}`; };

/* ---------- load ---------- */
const pruned = new Set();
for (const abs of listFiles(path.join(ROOT, "tools/prune"), /\.txt$/)) for (const l of fs.readFileSync(abs, "utf8").split(/\r?\n/)) if (l.trim() && !l.trim().startsWith("#")) pruned.add(l.trim());
const files = listFiles(path.join(ROOT, SRC), /\.js$/).map((abs) => ({ abs, rel: rel(abs) })).filter((f) => !pruned.has(f.rel));
const awaiting = listFiles(path.join(ROOT, SRC), /\.js$/).map(rel).filter((r) => pruned.has(r));
if (awaiting.length) console.log(`codedocs: ${awaiting.length} file(s) listed in tools/prune/ still on disk — skipped (tools/lg-patch.sh prune <version>)`);
const byRel = new Map(files.map((f) => [f.rel, f]));
const failures = [];
let migrated = 0, migratedFiles = 0;

for (const f of files) {
  f.src = fs.readFileSync(f.abs, "utf8");
  const { ast, comments } = parse(f.src, true);
  f.ast = ast; f.syms = symbols(ast);
  f.vendor = VENDOR(f.rel);
  f.harvested = [];
  if (!f.vendor) {
    const notes = harvest(f.src, ast, comments, f.syms);
    if (notes.length && MIGRATE) {
      const { out } = strip(f.src, comments);
      let ok = false;
      try { ok = sameAst(ast, parse(out).ast); } catch { ok = false; }
      if (!ok) { failures.push(f.rel); f.pending = notes.length; }
      else {
      f.harvested = notes; migrated += notes.length; migratedFiles++;
      f.newSrc = out;
      f.src = out; const re = parse(out, true); f.ast = re.ast; f.syms = symbols(re.ast);
      }
    } else f.pending = notes.length;
  }
  f.lines = f.src.split("\n").length - (f.src.endsWith("\n") ? 1 : 0);
  f.t = trace(f.rel, f.src, f.ast, f.syms);
}

/* ---------- outside importers (tests, tools, addon, html) : import edges only ---------- */
const outside = [];
for (const dir of ["test", "tools", "addon"]) {
  for (const abs of listFiles(path.join(ROOT, dir), /\.m?js$/)) {
    const r = rel(abs);
    if (r.startsWith("tools/codedocs/")) continue;
    let ast; try { ast = parse(fs.readFileSync(abs, "utf8")).ast; } catch { continue; }
    const specs = [];
    for (const s of ast.body) if ((s.type === "ImportDeclaration" || s.type === "ExportAllDeclaration" || s.type === "ExportNamedDeclaration") && s.source) specs.push({ spec: s.source.value, names: (s.specifiers ?? []).map((x) => x.imported?.name ?? x.local?.name ?? (x.type === "ImportNamespaceSpecifier" ? "*" : "default")) });
    for (const sp of specs) { const t = resolveSpec(r, sp.spec); if (t && byRel.has(t)) outside.push({ from: r, to: t, names: sp.names }); }
  }
}
for (const abs of fs.readdirSync(ROOT).filter((n) => n.endsWith(".html")).map((n) => path.join(ROOT, n))) {
  const r = rel(abs), html = fs.readFileSync(abs, "utf8");
  for (const m of html.matchAll(/(?:import\s[^;'"]*?from\s*|import\s*\(?\s*|<script[^>]*\ssrc=)["']([^"']+\.js)["']/g)) { const t = resolveSpec(r, m[1].startsWith(".") || m[1].startsWith("/") ? m[1] : "./" + m[1]); if (t && byRel.has(t)) outside.push({ from: r, to: t, names: ["(entry)"] }); }
}

/* ---------- resolution ---------- */
function exportTarget(r, name, depth = 0) {
  const f = byRel.get(r); if (!f || depth > 8) return null;
  const own = f.syms.find((s) => s.top && s.name === name);
  if (own) return { rel: r, key: own.key };
  const ex = f.t.exports.find((e) => e.name === name && e.local && !e.from);
  if (ex) { const s = f.syms.find((x) => x.top && x.name === ex.local); if (s) return { rel: r, key: s.key }; const b = f.t.bindings.get(ex.local); if (b) { const t = resolveSpec(r, b.spec); if (t) return exportTarget(t, b.imported, depth + 1); } }
  for (const re of f.t.reexports) {
    const t = resolveSpec(r, re.spec); if (!t) continue;
    for (const n of re.names) { if (n.local === name && n.imported !== "*") return exportTarget(t, n.imported, depth + 1); }
    if (re.names.some((n) => n.local === "*")) { const hit = exportTarget(t, name, depth + 1); if (hit) return hit; }
  }
  if (name === "default") return { rel: r, key: null };
  return null;
}

const calledBy = new Map();
const importers = new Map();
const missing = [], external = new Map(), cycles = [];
for (const f of files) {
  f.out = new Map();
  f.via = new Map();
  for (const im of [...f.t.imports, ...f.t.reexports]) {
    const t = resolveSpec(f.rel, im.spec);
    im.target = t && byRel.has(t) ? t : null;
    if (!t) { const k = im.spec; if (!external.has(k)) external.set(k, new Set()); external.get(k).add(f.rel); }
    else if (!im.target) missing.push({ from: f.rel, spec: im.spec, resolved: t, line: im.line });
    if (im.target) {
      if (!importers.has(im.target)) importers.set(im.target, []);
      importers.get(im.target).push({ from: f.rel, names: im.names.map((n) => n.imported) });
    }
  }
  for (const d of f.t.dynamic) { const t = resolveSpec(f.rel, d.spec); d.target = t && byRel.has(t) ? t : null; if (d.target) { if (!importers.has(d.target)) importers.set(d.target, []); importers.get(d.target).push({ from: f.rel, names: ["import()"] }); } }
  const symByName = new Map();
  for (const s of f.syms) { if (!symByName.has(s.name)) symByName.set(s.name, []); symByName.get(s.name).push(s); }
  for (const c of f.t.calls) {
    if (c.root && isBuiltinRoot(c.root)) continue;
    let dest = null;
    const b = c.root ? f.t.bindings.get(c.root) : null;
    if (b) {
      const t = resolveSpec(f.rel, b.spec);
      if (t && byRel.has(t)) {
        if (c.direct) dest = exportTarget(t, b.imported) ?? { rel: t, key: null, label: b.imported };
        else if (b.imported === "*" && c.prop && c.text === `${c.root}.${c.prop}`) dest = exportTarget(t, c.prop) ?? { rel: t, key: null, label: c.prop };
        else { const k = `${t}`; if (!f.via.has(k)) f.via.set(k, new Map()); const m = f.via.get(k); if (!m.has(c.at)) m.set(c.at, new Set()); m.get(c.at).add(c.text.replace(/\(\)/g, "")); continue; }
      } else continue;
    } else if (c.direct) {
      const cands = symByName.get(c.root) ?? [];
      if (!cands.length) continue;
      const pick = cands.find((s) => c.at === s.parent || c.at.startsWith((s.parent ?? "\0") + ">") || c.at.startsWith((s.parent ?? "\0") + ".")) ?? cands.find((s) => s.top) ?? cands[0];
      dest = { rel: f.rel, key: pick.key };
    } else continue;
    const k = c.at;
    if (!f.out.has(k)) f.out.set(k, new Map());
    const id = `${dest.rel}#${dest.key ?? dest.label ?? ""}`;
    const m = f.out.get(k); m.set(id, { ...dest, n: (m.get(id)?.n ?? 0) + 1, isNew: c.isNew });
    if (!calledBy.has(id)) calledBy.set(id, new Map());
    const cb = calledBy.get(id), from = `${f.rel}#${k}`; cb.set(from, (cb.get(from) ?? 0) + 1);
  }
}

/* SCCs over the import graph */
{
  let idx = 0; const st = [], on = new Set(), ix = new Map(), low = new Map();
  const adj = (r) => [...byRel.get(r).t.imports, ...byRel.get(r).t.reexports].map((i) => i.target).filter(Boolean);
  const sc = (v) => {
    ix.set(v, idx); low.set(v, idx); idx++; st.push(v); on.add(v);
    for (const w of adj(v)) { if (!ix.has(w)) { sc(w); low.set(v, Math.min(low.get(v), low.get(w))); } else if (on.has(w)) low.set(v, Math.min(low.get(v), ix.get(w))); }
    if (low.get(v) === ix.get(v)) { const comp = []; let w; do { w = st.pop(); on.delete(w); comp.push(w); } while (w !== v); if (comp.length > 1) cycles.push(comp.sort()); }
  };
  for (const f of files) if (!ix.has(f.rel)) sc(f.rel);
}

/* ---------- existing notes ---------- */
function readSlots(file) {
  const out = new Map();
  if (!fs.existsSync(file)) return out;
  const md = fs.readFileSync(file, "utf8");
  for (const m of md.matchAll(/<!-- note:(.+?) -->\n?([\s\S]*?)<!-- \/note -->/g)) out.set(m[1], (out.get(m[1]) ? out.get(m[1]) + "\n\n" : "") + m[2].replace(/\s+$/, ""));
  return out;
}

function renderHarvest(list) {
  const docs = list.filter((n) => n.doc).map((n) => esc(n.text));
  const ctx = list.filter((n) => !n.doc).map((n) => `- L? · ${code(n.context)} — ${esc(n.text).replace(/\n/g, "\n  ")}`);
  return [...docs, ...(ctx.length ? [ctx.join("\n")] : [])].join("\n\n");
}

function relocate(f, key, body) {
  const s = f.syms.find((x) => x.key === key);
  const lines = f.src.split("\n");
  const lo = s ? s.line - 1 : 0, hi = s ? s.endLine : lines.length;
  let cur = lo;
  const sq = (t) => t.replace(/\s+/g, "");
  const flat = lines.map(sq);
  return body.replace(/^- (?:L\d+|L\?) · (`+) ?(.*?) ?\1 — /gm, (all, tick, ctx) => {
    let hit = -1; const want = sq(ctx);
    if (want) for (let i = cur; i < hi; i++) if (flat[i].startsWith(want)) { hit = i; break; }
    if (hit < 0 && want) for (let i = lo; i < hi; i++) if (flat[i].startsWith(want)) { hit = i; break; }
    if (hit >= 0) cur = hit;
    return `- ${hit >= 0 ? "L" + (hit + 1) : "L?"} · ${code(ctx)} — `;
  });
}

/* ---------- render ---------- */
const summaries = new Map();
const outputs = new Map();
const unusedImports = [], deadLocal = [], orphanExports = [];
const effectsAll = [];

for (const f of files) {
  const docPath = docOf(f.rel);
  const slots = readSlots(path.join(ROOT, docPath));
  const byAnchor = new Map();
  for (const n of f.harvested) { if (!byAnchor.has(n.anchor)) byAnchor.set(n.anchor, []); byAnchor.get(n.anchor).push(n); }
  for (const [a, list] of byAnchor) slots.set(a, [slots.get(a), renderHarvest(list)].filter((x) => x && x.trim()).join("\n\n"));
  const used = new Set();
  const slot = (key) => { used.add(key); return `<!-- note:${key} -->\n${relocate(f, key, slots.get(key) ?? "")}${slots.get(key) ? "\n" : ""}<!-- /note -->`; };

  const fileNote = slots.get("@file") ?? "";
  const head = fileNote.split("\n").find((l) => l.trim() && !/^- L(\d+|\?) · /.test(l)) ?? (fileNote.match(/^- L(?:\d+|\?) · `+.*?`+ — (.*)$/m)?.[1] ?? "");
  const summary = head.replace(/^LIVING GALAXY\s*[—-]\s*|^Living Galaxy\s*[—-]\s*/i, "").replace(/\s+/g, " ").slice(0, 140);
  summaries.set(f.rel, summary);

  const L = [];
  L.push(`# ${f.rel}`, "");
  L.push(`[index](${posix(path.relative(path.dirname(docPath), DOCS + "/README.md"))}) · ${f.lines} lines · ${f.syms.length} symbols · ${f.t.imports.length} imports · ${(importers.get(f.rel) ?? []).length + outside.filter((o) => o.to === f.rel).length} importers${f.vendor ? " · **vendored — comments stay in the source, never migrated**" : ""}`, "");
  L.push("## About", "", slot("@file"), "");

  L.push("## Imports", "");
  if (!f.t.imports.length && !f.t.reexports.length && !f.t.dynamic.length) L.push("_none_", "");
  else {
    L.push("| line | from | names | target |", "|---|---|---|---|");
    for (const im of f.t.imports) {
      const names = im.names.map((n) => { const u = f.t.refs.get(n.local) ?? 0; if (!u) unusedImports.push({ file: f.rel, name: n.local, spec: im.spec, line: im.line }); return (n.imported === n.local ? code(n.local) : `${code(n.imported)} as ${code(n.local)}`) + (u ? "" : " **unused**"); }).join(", ") || "_side effect_";
      L.push(`| ${im.line} | ${code(im.spec)} | ${names} | ${im.target ? `[${im.target}](${linkTo(docPath, im.target)})` : resolveSpec(f.rel, im.spec) ? "**missing in " + SRC + "/**" : "external"} |`);
    }
    for (const im of f.t.reexports) L.push(`| ${im.line} | ${code(im.spec)} | re-export ${im.names.map((n) => code(n.imported === n.local ? n.local : `${n.imported}→${n.local}`)).join(", ")} | ${im.target ? `[${im.target}](${linkTo(docPath, im.target)})` : "external"} |`);
    for (const d of f.t.dynamic) L.push(`| ${d.line} | ${code(d.spec ?? "?")} | dynamic \`import()\` in ${code(d.at)} | ${d.target ? `[${d.target}](${linkTo(docPath, d.target)})` : "runtime-resolved"} |`);
    L.push("");
  }

  L.push("## Imported by", "");
  const ib = [...(importers.get(f.rel) ?? []).map((i) => `- [${i.from}](${linkTo(docPath, i.from)}) — ${i.names.length ? i.names.map(code).join(", ") : "_side effect_"}`), ...outside.filter((o) => o.to === f.rel).map((o) => `- ${o.from} _(outside ${SRC}/)_ — ${o.names.map(code).join(", ")}`)];
  L.push(...(ib.length ? ib : ["_nothing scanned imports this file — entry point, loaded by path, or dead_"]), "");

  L.push("## Exports", "");
  if (!f.t.exports.length) L.push("_none_", "");
  else {
    for (const e of f.t.exports) {
      const users = new Set();
      for (const i of importers.get(f.rel) ?? []) if (i.names.includes(e.name) || i.names.includes("*")) users.add(i.from);
      for (const o of outside) if (o.to === f.rel && (o.names.includes(e.name) || o.names.includes("*"))) users.add(o.from);
      if (!users.size && e.name !== "*") orphanExports.push({ file: f.rel, name: e.name });
      const s = f.syms.find((x) => x.top && x.name === (e.local ?? e.name));
      L.push(`- ${s ? `[${code(e.name)}](#${slug(s.key)})` : code(e.name)}${e.kind ? " · " + e.kind : ""}${e.from ? ` · from ${code(e.from)}` : ""} — ${users.size ? `used by ${[...users].sort().map((u) => byRel.has(u) ? `[${u}](${linkTo(docPath, u)})` : u).join(", ")}` : "**no importer in scanned roots**"}`);
    }
    L.push("");
  }

  L.push("## Effects", "");
  const effs = f.t.effects;
  for (const e of effs) effectsAll.push({ ...e, file: f.rel });
  if (!effs.length) L.push("_none detected_", "");
  else {
    const groups = new Map();
    for (const e of effs) { if (!groups.has(e.kind)) groups.set(e.kind, []); groups.get(e.kind).push(e); }
    for (const [k, list] of [...groups].sort()) {
      const agg = new Map();
      for (const e of list) { const id = `${e.value}${e.target ? " on " + e.target : ""}${e.handler ? " → " + e.handler : ""}${e.method ? " " + e.method : ""}`; if (!agg.has(id)) agg.set(id, []); agg.get(id).push(`${e.at}:${e.line}`); }
      L.push(`- **${k}** — ${[...agg].map(([v, at]) => `${code(v)} (${at.slice(0, 6).join(", ")}${at.length > 6 ? ` +${at.length - 6}` : ""})`).join(" · ")}`);
    }
    L.push("");
  }

  L.push("## Symbols", "");
  if (!f.syms.length) L.push("_none_", "");
  const seenSlug = new Map();
  for (const s of f.syms) {
    const depth = s.key.split(/[>.]/).length - 1;
    let sl = slug(s.key); const c = (seenSlug.get(sl) ?? 0) + 1; seenSlug.set(sl, c); if (c > 1) sl += "-" + c;
    const sig = s.params !== null ? `${s.key}(${s.params})` : s.key;
    const refN = s.top ? (f.t.refs.get(s.name) ?? 0) : null;
    if (s.top && !s.exported && refN === 0 && s.kind !== "class") deadLocal.push({ file: f.rel, key: s.key, line: s.line });
    L.push(`${"#".repeat(Math.min(3 + depth, 6))} <a id="${sl}"></a>${code(sig)}`, "");
    L.push(`${s.kind}${s.async ? " · async" : ""}${s.generator ? " · generator" : ""}${s.exported ? " · **exported**" : ""} · L${s.line}–${s.endLine}${refN === 0 && s.top && !s.exported ? " · **never referenced**" : ""}`, "");
    const out = f.out.get(s.key);
    if (out?.size) L.push("- calls: " + [...out.values()].sort((a, b) => (a.rel + a.key).localeCompare(b.rel + b.key)).map((d) => `[${code((d.isNew ? "new " : "") + (d.key ?? d.label ?? "default"))}](${d.rel === f.rel ? "" : linkTo(docPath, d.rel)}#${d.key ? slug(d.key) : ""})${d.rel === f.rel ? "" : " _" + d.rel + "_"}${d.n > 1 ? " ×" + d.n : ""}`).join(" · "));
    const via = [...f.via].filter(([, m]) => m.has(s.key));
    for (const [t, m] of via) L.push(`- via ${t === f.rel ? "self" : `[${t}](${linkTo(docPath, t)})`}: ${[...m.get(s.key)].sort().map(code).join(", ")}`);
    const cb = calledBy.get(`${f.rel}#${s.key}`);
    if (cb?.size) L.push("- called by: " + [...cb].sort().map(([from, n]) => { const [r, k] = from.split("#"); return `[${code(k)}](${r === f.rel ? "" : linkTo(docPath, r)}#${k === "@file" ? "" : slug(k)})${r === f.rel ? "" : " _" + r + "_"}${n > 1 ? " ×" + n : ""}`; }).join(" · "));
    const se = effs.filter((e) => e.at === s.key);
    if (se.length) L.push("- effects: " + [...new Set(se.map((e) => `${e.kind} ${code(e.value)}`))].join(" · "));
    if (out?.size || via.length || cb?.size || se.length) L.push("");
    L.push(slot(s.key), "");
  }
  const topCalls = f.out.get("@file"), topVia = [...f.via].filter(([, m]) => m.has("@file"));
  if (topCalls?.size || topVia.length) {
    L.push("## Module-level calls", "");
    if (topCalls?.size) L.push("- calls: " + [...topCalls.values()].map((d) => `[${code(d.key ?? d.label ?? "default")}](${d.rel === f.rel ? "" : linkTo(docPath, d.rel)}#${d.key ? slug(d.key) : ""})${d.rel === f.rel ? "" : " _" + d.rel + "_"}`).join(" · "));
    for (const [t, m] of topVia) L.push(`- via [${t}](${linkTo(docPath, t)}): ${[...m.get("@file")].sort().map(code).join(", ")}`);
    L.push("");
  }
  const orphans = [...slots.keys()].filter((k) => !used.has(k) && slots.get(k).trim());
  if (orphans.length) {
    L.push("## Orphaned notes", "", "_Anchors that no longer exist in the code. Kept so nothing is lost — move or delete by hand._", "");
    for (const k of orphans) { used.add(k); L.push(`### ${code(k)}`, "", `<!-- note:${k} -->\n${slots.get(k)}\n<!-- /note -->`, ""); }
  }
  f.pendingNote = f.pending ? `\n> **${f.pending} comment(s) still in the source** — run \`node tools/codedocs/build.mjs --migrate\`\n` : "";
  outputs.set(docPath, L.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\s*$/, "\n") + f.pendingNote);
}

/* ---------- global traces ---------- */
const T = (name) => `${DOCS}/trace/${name}.md`;
const fl = (from, r, k) => `[${r}${k && k !== "@file" ? " › " + k : ""}](${linkTo(from, r, k && k !== "@file" ? slug(k) : "")})`;

function effectPage(name, title, kinds, blurb) {
  const p = T(name), L = [`# ${title}`, "", `[index](../README.md)`, "", blurb, ""];
  const list = effectsAll.filter((e) => kinds.some((k) => e.kind === k || e.kind.startsWith(k + ".")));
  const by = new Map();
  for (const e of list) { const id = e.value ?? "?"; if (!by.has(id)) by.set(id, []); by.get(id).push(e); }
  L.push(`${by.size} distinct values across ${new Set(list.map((e) => e.file)).size} files.`, "");
  for (const [v, es] of [...by].sort((a, b) => String(a[0]).localeCompare(String(b[0])))) {
    L.push(`### ${code(v)}`, "");
    for (const e of es) L.push(`- ${e.kind}${e.target ? " on " + code(e.target) : ""}${e.handler ? " → " + code(e.handler) : ""}${e.method ? " " + e.method : ""} — ${fl(p, e.file, e.at)} L${e.line}`);
    L.push("");
  }
  outputs.set(p, L.join("\n"));
}
effectPage("events", "Events", ["event", "bus"], "DOM listeners, `on*` handler assignments, dispatched events and bus emit/on pairs. A value in ‹angle quotes› is a variable, not a literal.");
effectPage("storage", "Storage keys", ["storage"], "Every localStorage/sessionStorage key read, written or removed.");
effectPage("network", "Network & workers", ["net"], "fetch() endpoints (server.py routes), workers, sockets, postMessage.");
effectPage("dom", "DOM ids & selectors", ["dom"], "Element ids and selectors the code reaches for — the contract with index.html. `$()` is treated as getElementById.");
effectPage("input", "Keyboard codes", ["input"], "KeyboardEvent.code strings referenced in code.");
effectPage("timers", "Timers & frame loops", ["timer"], "setInterval / setTimeout / requestAnimationFrame / requestIdleCallback call sites.");
effectPage("globals", "Global writes", ["global"], "Assignments onto window / globalThis / self.");
effectPage("console", "Console jumps", ["console"], "registerJump() ids — the CONSOLE search index's static leaves.");

{
  const p = T("imports"), L = ["# Import graph", "", "[index](../README.md)", ""];
  const dirOf = (r) => path.posix.dirname(r);
  const agg = new Map();
  for (const f of files) for (const im of [...f.t.imports, ...f.t.reexports]) if (im.target && dirOf(im.target) !== dirOf(f.rel)) { const k = `${dirOf(f.rel)}|${dirOf(im.target)}`; agg.set(k, (agg.get(k) ?? 0) + 1); }
  const ids = new Map(); const nid = (d) => { if (!ids.has(d)) ids.set(d, "d" + ids.size); return ids.get(d); };
  L.push("## Folder graph", "", "Edge label = number of import statements crossing folders.", "", "```mermaid", "flowchart LR");
  for (const [k, n] of [...agg].sort()) { const [a, b] = k.split("|"); L.push(`  ${nid(a)}["${a}"] -->|${n}| ${nid(b)}["${b}"]`); }
  L.push("```", "");
  L.push("## Cycles", "", cycles.length ? `${cycles.length} strongly-connected groups. Cycles are legal in ES modules but make top-level evaluation order matter (TDZ).` : "_none_", "");
  for (const c of cycles) L.push(`- (${c.length}) ${c.map((r) => `[${r}](${linkTo(p, r)})`).join(" ⇄ ")}`);
  L.push("", "## External specifiers", "");
  for (const [s, set] of [...external].sort()) L.push(`- ${code(s)} — ${[...set].sort().map((r) => `[${r}](${linkTo(p, r)})`).join(", ")}`);
  L.push("", "## Unresolved (target not in " + SRC + "/)", "");
  L.push(...(missing.length ? missing.map((m) => `- ${fl(p, m.from)} L${m.line} → ${code(m.spec)} (${m.resolved})`) : ["_none_"]));
  L.push("", "## Dynamic imports", "");
  for (const f of files) for (const d of f.t.dynamic) L.push(`- ${fl(p, f.rel, d.at)} L${d.line} → ${code(d.spec ?? "?")}${d.target ? "" : " (runtime-resolved)"}`);
  L.push("", "## Every edge", "");
  for (const f of files) { const ims = [...f.t.imports, ...f.t.reexports]; if (ims.length) L.push(`- [${f.rel}](${linkTo(p, f.rel)}) → ${ims.map((i) => i.target ? `[${i.target}](${linkTo(p, i.target)})` : code(i.spec)).join(", ")}`); }
  outputs.set(p, L.join("\n"));
}
{
  const p = T("calls"), L = ["# Call graph", "", "[index](../README.md)", "", "Resolved calls only: direct calls to local symbols and imported bindings (named, default, namespace). Method calls on imported objects (e.g. `sim.x()`) appear per symbol as **via** lines in each file's doc.", ""];
  const fan = [...calledBy].map(([id, m]) => [id, [...m.values()].reduce((a, b) => a + b, 0), new Set([...m.keys()].map((k) => k.split("#")[0])).size]).filter(([id]) => !id.endsWith("#")).sort((a, b) => b[2] - a[2] || b[1] - a[1]);
  L.push("## Most depended-on symbols (by calling files)", "", "| symbol | files | calls |", "|---|---|---|");
  for (const [id, n, nf] of fan.slice(0, 60)) { const [r, k] = id.split("#"); L.push(`| ${fl(p, r, k)} | ${nf} | ${n} |`); }
  L.push("", "## Cross-file edges per file (outgoing)", "");
  for (const f of files) { const t = new Map(); for (const m of f.out.values()) for (const d of m.values()) if (d.rel !== f.rel) t.set(d.rel, (t.get(d.rel) ?? 0) + d.n); if (t.size) L.push(`- [${f.rel}](${linkTo(p, f.rel)}) → ${[...t].sort((a, b) => b[1] - a[1]).map(([r, n]) => `${r} ×${n}`).join(", ")}`); }
  outputs.set(p, L.join("\n"));
}
{
  const p = T("hygiene"), L = ["# Hygiene", "", "[index](../README.md)", "", "Candidates, not verdicts: tests, index.html, tools and the addon are scanned for imports, but anything reached by string, by `window`, or from a file outside the scanned roots will look dead here.", ""];
  L.push(`## Unused imports (${unusedImports.length})`, "", ...unusedImports.map((u) => `- ${fl(p, u.file)} L${u.line} ${code(u.name)} from ${code(u.spec)}`), "");
  L.push(`## Top-level symbols never referenced (${deadLocal.length})`, "", ...deadLocal.map((d) => `- ${fl(p, d.file, d.key)} L${d.line}`), "");
  L.push(`## Exports with no importer (${orphanExports.length})`, "", ...orphanExports.map((o) => `- ${fl(p, o.file)} ${code(o.name)}`), "");
  L.push(`## Files nothing imports`, "", ...files.filter((f) => !(importers.get(f.rel) ?? []).length && !outside.some((o) => o.to === f.rel)).map((f) => `- [${f.rel}](${linkTo(p, f.rel)}) — ${f.lines} lines`), "");
  outputs.set(p, L.join("\n"));
}

/* ---------- index ---------- */
{
  const p = `${DOCS}/README.md`;
  const pend = files.reduce((a, f) => a + (f.pending ?? 0), 0);
  const L = ["# Code docs", "", `Generated by \`node tools/codedocs/build.mjs\` over \`${SRC}/\` — ${files.length} files, ${files.reduce((a, f) => a + f.lines, 0)} lines, ${files.reduce((a, f) => a + f.syms.length, 0)} symbols.`, ""];
  L.push("## Rules", "",
    "- Code files carry code only. Every explanation lives here, one doc per code file at `docs/files/<same path>.md`.",
    "- Text between `<!-- note:KEY -->` and `<!-- /note -->` is the source of truth for notes — edit it freely; the builder preserves it and regenerates everything else.",
    "- Bullets shaped `- L12 · `code` — text` are pinned to a code line; the builder re-finds the line on every run. `L?` means the line changed — fix the quoted code or leave it.",
    "- Writing a comment in code is fine: `--migrate` moves it into its note slot and strips it (each file is AST-verified identical before it is written).",
    "- Kept in code: `/*! */`, `@license`, `@preserve`, `sourceMappingURL`, `__PURE__`, `eslint-`/`@ts-` directives, and a first-line `Generated.` header.",
    "- Notes whose symbol disappeared move to **Orphaned notes** at the bottom of that file's doc — nothing is dropped.", "");
  L.push("## Commands", "", "```", "node tools/codedocs/build.mjs            # regenerate docs", "node tools/codedocs/build.mjs --migrate  # move code comments into docs, strip, regenerate", "node tools/codedocs/build.mjs --check    # exit 1 if comments remain in code or docs are stale", "```", "");
  L.push("## Traces", "", ...["imports", "calls", "events", "storage", "network", "dom", "input", "timers", "globals", "console", "hygiene"].map((n) => `- [${n}](trace/${n}.md)`), "", "Machine-readable: [index.json](index.json).", "");
  if (pend) L.push(`> **${pend} comment(s) still in source code.** Run with \`--migrate\`.`, "");
  L.push("## Files", "");
  let dir = null;
  for (const f of files) {
    const d = path.posix.dirname(f.rel);
    if (d !== dir) { dir = d; L.push("", `### ${d}/`, ""); }
    L.push(`- [${path.posix.basename(f.rel)}](files/${f.rel}.md) — ${summaries.get(f.rel) || "_no summary_"} _(${f.lines})_`);
  }
  outputs.set(p, L.join("\n"));
  const idx = files.map((f) => ({ file: f.rel, lines: f.lines, vendor: f.vendor, summary: summaries.get(f.rel), imports: [...f.t.imports, ...f.t.reexports].map((i) => ({ spec: i.spec, target: i.target, names: i.names })), dynamic: f.t.dynamic, importedBy: (importers.get(f.rel) ?? []).map((i) => i.from), exports: f.t.exports.map((e) => e.name), symbols: f.syms.map((s) => ({ key: s.key, kind: s.kind, line: s.line, end: s.endLine, exported: s.exported, calls: [...(f.out.get(s.key)?.keys() ?? [])] })), effects: f.t.effects }));
  outputs.set(`${DOCS}/index.json`, JSON.stringify({ src: SRC, files: idx, cycles }, null, 1));
}

/* ---------- write / check ---------- */
let stale = 0;
for (const [p, body] of outputs) {
  const abs = path.join(ROOT, p);
  const now = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
  if (now === body) continue;
  stale++;
  if (!CHECK) { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, body); }
}
if (!CHECK) for (const f of files) if (f.newSrc) fs.writeFileSync(f.abs, f.newSrc);
const pending = files.reduce((a, f) => a + (f.pending ?? 0), 0);
const strays = listFiles(path.join(ROOT, DOCS, "files"), /\.md$/).map((a) => rel(a).slice(DOCS.length + 7, -3)).filter((r) => !byRel.has(r));
if (strays.length) log(`codedocs: ${strays.length} doc file(s) with no source (moved/deleted code — carry their notes over, then delete): ${strays.join(", ")}`);
log(`codedocs: ${files.length} files · ${outputs.size} docs · ${CHECK ? stale + " stale" : stale + " written"}${MIGRATE ? ` · migrated ${migrated} notes from ${migratedFiles} files` : ""}${pending ? ` · ${pending} comments still in code` : ""}${failures.length ? ` · VERIFY FAILED (left untouched): ${failures.join(", ")}` : ""}`);
if (failures.length || (CHECK && (stale || pending))) process.exit(1);
