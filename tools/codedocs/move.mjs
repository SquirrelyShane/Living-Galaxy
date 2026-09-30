#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse, walk, listFiles } from "./lib.mjs";

const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const ROOT = path.resolve(opt("--root", path.join(path.dirname(fileURLToPath(import.meta.url)), "../..")));
const PLAN = opt("--plan", null);
const WRITE = flag("--write");
const AFTER = flag("--after");
const ONLY = opt("--only", "addon").split(",").map((d) => d.trim()).filter(Boolean);
if (!PLAN) { console.error("usage: node tools/codedocs/move.mjs --plan <moves.json> [--write] [--root DIR] [--prune-list OUT] | --after [--only addon,dir]"); process.exit(2); }

const posix = (p) => p.split(path.sep).join("/");
const moves = JSON.parse(fs.readFileSync(path.resolve(PLAN), "utf8")).moves;
const M = new Map(Object.entries(moves));
const problems = [];
if (!AFTER) for (const [a, b] of M) {
  if (!fs.existsSync(path.join(ROOT, a))) problems.push(`source missing: ${a}`);
  if (fs.existsSync(path.join(ROOT, b)) && !M.has(b)) problems.push(`destination exists: ${b}`);
}
const dests = [...M.values()]; if (new Set(dests).size !== dests.length) problems.push("two sources map to one destination");
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }

const newPath = (r) => M.get(r) ?? r;
const relSpec = (fromFile, target) => { let s = posix(path.posix.relative(path.posix.dirname(fromFile), target)); if (!s.startsWith(".")) s = "./" + s; return s; };
const JS_ROOTS = AFTER ? ONLY : ["js", "test", "tools", "host", "addon"];
const TEXT_FILES = ["index.html", "server.py", "README.md", "PERSISTENT-SOL.md", "manifest.webmanifest", "wrangler.jsonc"];
const TEXT_DIRS = [["deploy", /\.(sh|md|txt|conf|service)$/], ["tools", /\.(sh|py|html)$/], ["test", /\.py$/], ["docs/files", /\.md$/]];

const edits = new Map();
let specCount = 0, strCount = 0;
const oldFlat = [...M.keys()];
const rootRe = new RegExp(`(^|[^A-Za-z0-9_./-])(\\.?/)?(${oldFlat.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![A-Za-z0-9_-])`, "g");
const rewriteRootRel = (s) => s.replace(rootRe, (all, pre, dot, p) => { strCount++; return pre + (dot ?? "") + M.get(p); });

function rewriteRelative(fileOld, fileNew, spec) {
  if (typeof spec !== "string" || !/^\.\.?\//.test(spec)) return null;
  const abs = path.posix.normalize(path.posix.join(path.posix.dirname(fileOld), spec));
  const next = relSpec(fileNew, newPath(abs));
  return next === spec ? null : next;
}

for (const dir of JS_ROOTS) {
  for (const abs of listFiles(path.join(ROOT, dir), /\.m?js$/)) {
    const rel = posix(path.relative(ROOT, abs));
    if (rel.startsWith("tools/codedocs/vendor/") || rel.startsWith("js/vendor/")) continue;
    const src = fs.readFileSync(abs, "utf8");
    let ast, comments; try { ({ ast, comments } = parse(src, true)); } catch (e) { problems.push(`parse ${rel}: ${e.message}`); continue; }
    const fileNew = AFTER ? rel : newPath(rel);
    const reps = [];
    const lit = (n, value) => { reps.push([n.start + 1, n.end - 1, value]); };
    const handled = new Set();
    const specNode = (n) => {
      if (!n) return;
      handled.add(n);
      if (n.type === "Literal" && typeof n.value === "string") {
        const r = rewriteRelative(rel, fileNew, n.value);
        if (r) { lit(n, r); specCount++; }
        else { const raw = src.slice(n.start + 1, n.end - 1), rr = rewriteRootRel(raw); if (rr !== raw) { lit(n, rr); specCount++; } }
      } else if (n.type === "TemplateLiteral" && n.quasis.length) {
        const q = n.quasis[0], raw = q.value.raw, cut = raw.lastIndexOf("/");
        if (/^\.\.?\//.test(raw) && cut > 0) {
          const dirSpec = raw.slice(0, cut + 1);
          const abs2 = path.posix.normalize(path.posix.join(path.posix.dirname(rel), dirSpec));
          let nd = posix(path.posix.relative(path.posix.dirname(fileNew), abs2)); if (!nd.startsWith(".")) nd = "./" + nd;
          nd += "/";
          if (nd !== dirSpec) { reps.push([q.start, q.start + dirSpec.length, nd]); specCount++; }
        }
        for (const x of n.quasis) handled.add(x);
      } else problems.push(`${rel}:${n.loc.start.line} computed specifier — check by hand`);
    };
    walk(ast, (n) => {
      if ((n.type === "ImportDeclaration" || n.type === "ExportAllDeclaration" || n.type === "ExportNamedDeclaration") && n.source) specNode(n.source);
      else if (n.type === "ImportExpression") specNode(n.source);
      else if (n.type === "NewExpression" && n.callee.type === "Identifier" && n.callee.name === "URL" && n.arguments.length >= 2 && n.arguments[1].type === "MemberExpression" && n.arguments[1].property?.name === "url") specNode(n.arguments[0]);
    });
    if (!AFTER) walk(ast, (n) => {
      if (handled.has(n)) return;
      if (n.type === "Literal" && typeof n.value === "string") {
        const raw = src.slice(n.start + 1, n.end - 1);
        const rel2 = /^\.\.?\//.test(n.value) && /\.m?js$/.test(n.value) ? rewriteRelative(rel, fileNew, n.value) : null;
        if (rel2) { lit(n, rel2); strCount++; return; }
        const r = rewriteRootRel(raw); if (r !== raw) lit(n, r);
      } else if (n.type === "TemplateElement") {
        const raw = n.value.raw, r = rewriteRootRel(raw); if (r !== raw) reps.push([n.start, n.end, r]);
      }
    });
    if (!AFTER) for (const c of comments) { const raw = src.slice(c.start, c.end), r = rewriteRootRel(raw); if (r !== raw) reps.push([c.start, c.end, r]); }
    if (!reps.length && fileNew === rel) continue;
    reps.sort((a, b) => b[0] - a[0]);
    if (AFTER) for (const [a, b, v] of [...reps].reverse()) console.log(`  ${rel}:${src.slice(0, a).split("\n").length}  ${src.slice(a, b)}  →  ${v}`);
    let out = src;
    for (const [a, b, v] of reps) out = out.slice(0, a) + v + out.slice(b);
    edits.set(rel, { to: fileNew, out, n: reps.length });
  }
}

const textFiles = AFTER ? [] : [...TEXT_FILES.filter((f) => fs.existsSync(path.join(ROOT, f)))];
if (!AFTER) for (const [d, re] of TEXT_DIRS) for (const abs of listFiles(path.join(ROOT, d), re)) textFiles.push(posix(path.relative(ROOT, abs)));
for (const rel of textFiles) {
  const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
  const out = rewriteRootRel(src);
  let to = rel;
  const m = rel.match(/^docs\/files\/(.+)\.md$/);
  if (m && M.has(m[1])) to = `docs/files/${M.get(m[1])}.md`;
  if (out !== src || to !== rel) edits.set(rel, { to, out, n: 1 });
}

if (AFTER) console.log(`after-move: ${ONLY.join(", ")} — import specifiers only; nothing else in those files is read for meaning or changed`);
console.log(`move: ${AFTER ? 0 : M.size} files · ${edits.size} files touched · ${specCount} specifiers · ${strCount} path strings${problems.length ? "\n" + problems.join("\n") : ""}`);
if (!WRITE) { console.log("dry run — pass --write to apply"); process.exit(problems.some((p) => !p.includes("check by hand")) ? 1 : 0); }
for (const [rel, e] of edits) {
  const dst = path.join(ROOT, e.to);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, e.out);
  if (e.to !== rel) fs.rmSync(path.join(ROOT, rel));
}
if (!AFTER) for (const [a, b] of M) if (!edits.has(a) && fs.existsSync(path.join(ROOT, a))) { fs.mkdirSync(path.dirname(path.join(ROOT, b)), { recursive: true }); fs.renameSync(path.join(ROOT, a), path.join(ROOT, b)); }
const pl = opt("--prune-list", null);
if (pl) {
  const gone = [...M.keys(), ...[...M.keys()].map((k) => `docs/files/${k}.md`)];
  fs.writeFileSync(path.resolve(pl), gone.join("\n") + "\n");
}
console.log("written");
