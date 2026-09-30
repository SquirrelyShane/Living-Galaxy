import { parse as acornParse } from "./vendor/acorn.mjs";
import fs from "node:fs";
import path from "node:path";

export const OPTS = { ecmaVersion: "latest", sourceType: "module", allowHashBang: true };

export function parse(src, withComments = false) {
  const comments = [];
  const ast = acornParse(src, { ...OPTS, locations: true, onComment: withComments ? comments : undefined });
  return { ast, comments };
}

const SKIP = new Set(["start", "end", "loc", "range", "raw"]);

export function walk(node, enter, parents = []) {
  if (!node || typeof node.type !== "string") return;
  if (enter(node, parents) === false) return;
  parents.push(node);
  for (const k in node) {
    if (SKIP.has(k)) continue;
    const v = node[k];
    if (Array.isArray(v)) { for (const c of v) if (c && typeof c.type === "string") walk(c, enter, parents); }
    else if (v && typeof v.type === "string") walk(v, enter, parents);
  }
  parents.pop();
}

export function sameAst(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null || typeof a !== "object") return Object.is(a, b) || (typeof a === "bigint" && a === b);
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) { if (a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (!sameAst(a[i], b[i])) return false; return true; }
  if (a instanceof RegExp || b instanceof RegExp) return String(a) === String(b);
  const ka = Object.keys(a).filter((k) => !SKIP.has(k)), kb = Object.keys(b).filter((k) => !SKIP.has(k));
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (!sameAst(a[k], b[k])) return false;
  if (a.type === "TemplateElement" && a.value?.raw !== b.value?.raw) return false;
  return true;
}

export const KEEP = /^!|@license|@preserve|sourceMappingURL|[#@]__PURE__|eslint-|@ts-/;

export function keepComment(c, i, src) {
  if (KEEP.test(c.value)) return true;
  if (i === 0 && /^\s*$/.test(src.slice(0, c.start)) && /@generated|\bGenerated\.|file (was|is) generated|do not (edit|modify)/i.test(c.value.split("\n")[0])) return true;
  return false;
}

export function listFiles(dir, ext = /\.m?js$/) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules" && !e.name.startsWith(".")) out.push(...listFiles(p, ext)); }
    else if (ext.test(e.name)) out.push(p);
  }
  return out.sort();
}

const FN = new Set(["FunctionExpression", "ArrowFunctionExpression"]);
const isFn = (n) => n && (FN.has(n.type) || n.type === "FunctionDeclaration");
const keyName = (k, computed) => (!computed && k?.type === "Identifier") ? k.name : k?.type === "Literal" ? String(k.value) : k?.type === "PrivateIdentifier" ? "#" + k.name : "[computed]";

export function memberText(n, depth = 0) {
  if (!n) return "?";
  if (n.type === "Identifier") return n.name;
  if (n.type === "ThisExpression") return "this";
  if (n.type === "Super") return "super";
  if (n.type === "MemberExpression") {
    if (depth > 4) return "…";
    const o = memberText(n.object, depth + 1);
    const p = n.computed ? (n.property.type === "Literal" ? `[${JSON.stringify(n.property.value)}]` : "[…]") : "." + keyName(n.property);
    return o + p;
  }
  if (n.type === "CallExpression") return memberText(n.callee, depth + 1) + "()";
  if (n.type === "ChainExpression") return memberText(n.expression, depth);
  return "(" + n.type.replace(/Expression$/, "").toLowerCase() + ")";
}

export function rootIdent(n) {
  while (n) {
    if (n.type === "Identifier") return n.name;
    if (n.type === "MemberExpression") n = n.object;
    else if (n.type === "CallExpression") n = n.callee;
    else if (n.type === "ChainExpression") n = n.expression;
    else return null;
  }
  return null;
}

function params(fn) {
  const one = (p) => p.type === "Identifier" ? p.name : p.type === "AssignmentPattern" ? one(p.left) + "=" : p.type === "RestElement" ? "..." + one(p.argument) : p.type === "ObjectPattern" ? "{…}" : p.type === "ArrayPattern" ? "[…]" : "?";
  return (fn?.params ?? []).map(one).join(", ");
}

/** Symbols: named functions, classes, methods, object-literal function props, top-level consts. Deterministic from AST alone. */
export function symbols(ast) {
  const syms = [];
  const stack = [];
  const seen = new Map();
  const exported = new Set();
  for (const s of ast.body) {
    if (s.type === "ExportNamedDeclaration") {
      if (s.declaration?.id) exported.add(s.declaration.id.name);
      for (const d of s.declaration?.declarations ?? []) if (d.id.type === "Identifier") exported.add(d.id.name);
      for (const sp of s.specifiers ?? []) if (!s.source) exported.add(sp.local.name);
    }
    if (s.type === "ExportDefaultDeclaration" && s.declaration?.id) exported.add(s.declaration.id.name);
  }
  const add = (name, kind, node, fn, stmtStart) => {
    const parent = stack.length ? stack[stack.length - 1] : null;
    let key = parent ? parent.key + (kind === "method" || kind === "prop" ? "." : ">") + name : name;
    const n = (seen.get(key) ?? 0) + 1; seen.set(key, n); if (n > 1) key += "~" + n;
    const s = { key, name, kind, start: node.start, end: node.end, stmtStart: stmtStart ?? node.start, line: node.loc.start.line, endLine: node.loc.end.line, params: fn ? params(fn) : null, async: !!fn?.async, generator: !!fn?.generator, exported: !parent && kind !== "prop" && kind !== "method" && exported.has(name), parent: parent?.key ?? null, top: !parent && kind !== "prop" && kind !== "method" };
    syms.push(s);
    return s;
  };
  const visit = (node, stmtStart) => {
    if (!node || typeof node.type !== "string") return;
    let pushed = null;
    const T = node.type;
    if (T === "FunctionDeclaration" && node.id) pushed = add(node.id.name, "function", node, node, stmtStart);
    else if (T === "ClassDeclaration" && node.id) pushed = add(node.id.name, "class", node, null, stmtStart);
    else if (T === "VariableDeclarator" && node.id.type === "Identifier" && node.init) {
      const i = node.init;
      if (isFn(i)) pushed = add(node.id.name, "function", node, i, stmtStart);
      else if (i.type === "ClassExpression") pushed = add(node.id.name, "class", node, null, stmtStart);
      else if (!stack.length) pushed = add(node.id.name, "const", node, null, stmtStart);
    } else if (T === "MethodDefinition" || T === "PropertyDefinition") {
      const nm = (node.static ? "static " : "") + (node.kind === "get" ? "get " : node.kind === "set" ? "set " : "") + keyName(node.key, node.computed);
      if (T === "MethodDefinition" || isFn(node.value)) pushed = add(nm, "method", node, node.value, node.start);
    } else if (T === "Property" && (isFn(node.value) || node.method) && stack.length) {
      pushed = add(keyName(node.key, node.computed), "prop", node, node.value, node.start);
    } else if (T === "Property" && isFn(node.value) && !stack.length) {
      pushed = add(keyName(node.key, node.computed), "prop", node, node.value, node.start);
    }
    if (pushed) stack.push(pushed);
    for (const k in node) {
      if (SKIP.has(k)) continue;
      const v = node[k];
      if (Array.isArray(v)) {
        for (const c of v) {
          if (!c || typeof c.type !== "string") continue;
          let st;
          if (T === "VariableDeclaration") st = stmtStart ?? node.start;
          else if (c.type === "VariableDeclaration" || c.type === "FunctionDeclaration" || c.type === "ClassDeclaration" || c.type === "ExportNamedDeclaration" || c.type === "ExportDefaultDeclaration") st = c.start;
          visit(c, st);
        }
      } else if (v && typeof v.type === "string") {
        let st;
        if ((T === "ExportNamedDeclaration" || T === "ExportDefaultDeclaration") && k === "declaration") st = node.start;
        else if (T === "VariableDeclaration") st = stmtStart ?? node.start;
        visit(v, st);
      }
    }
    if (pushed) stack.pop();
  };
  visit(ast, undefined);
  return syms;
}

export function innermost(syms, pos, fnOnly = false) {
  let best = null;
  for (const s of syms) {
    if (fnOnly && s.kind === "class") continue;
    if (s.start <= pos && pos < s.end && (!best || s.start >= best.start)) best = s;
  }
  return best;
}

function lineAt(src, pos) {
  const a = src.lastIndexOf("\n", pos - 1) + 1;
  let b = src.indexOf("\n", pos); if (b < 0) b = src.length;
  return [a, b];
}

export function cleanComment(c) {
  if (c.type === "Line") return c.value.replace(/^\s?/, "");
  let lines = c.value.split("\n");
  lines = lines.map((l, i) => (i === 0 ? l.replace(/^\*+\s?|^\s/, "") : l.replace(/^\s*\*(?!\/)\s?/, "")).replace(/\s+$/, ""));
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length), 99);
  return lines.map((l) => l.slice(Math.min(ind, l.match(/^\s*/)[0].length))).join("\n");
}

/** Groups adjacent line comments, anchors each note to a symbol (+ code context when it is not the symbol's leading doc). */
export function harvest(src, ast, comments, syms) {
  const removable = comments.map((c, i) => ({ c, i })).filter(({ c, i }) => !keepComment(c, i, src)).map(({ c }) => c);
  const groups = [];
  for (const c of removable) {
    const g = groups[groups.length - 1];
    const own = (x) => !/\S/.test(src.slice(lineAt(src, x)[0], x));
    if (g && c.type === "Line" && g.type === "Line" && /^[ \t]*\n[ \t]*$/.test(src.slice(g.end, c.start)) && own(g.start) && own(c.start)) {
      g.end = c.end; g.text += "\n" + cleanComment(c); continue;
    }
    groups.push({ type: c.type, start: c.start, end: c.end, text: cleanComment(c) });
  }
  const notes = [];
  for (const g of groups) {
    const [la, lb] = lineAt(src, g.start);
    const before = src.slice(la, g.start);
    const trailing = /\S/.test(before);
    const encl = innermost(syms, g.start);
    let anchor = encl ? encl.key : "@file", context = null, doc = false;
    if (!trailing) {
      const prev = ast.body.filter((st) => st.end <= g.start), nextSt = ast.body.find((st) => st.start >= g.end);
      const blankAfter = /\n[ \t]*\n/.test(src.slice(g.end, nextSt?.start ?? src.length));
      const afterImports = !encl && prev.every((st) => st.type === "ImportDeclaration") && (nextSt?.type !== "ImportDeclaration" || blankAfter);
      const headerish = g.text.includes("\n") || blankAfter || !syms.some((s) => s.top && s.stmtStart === nextSt?.start);
      if (!notes.some((n) => n.anchor === "@file" && n.doc) && (!/\S/.test(src.slice(0, g.start)) || (afterImports && headerish))) { anchor = "@file"; doc = true; }
      else {
        const next = syms.filter((s) => s.stmtStart >= g.end && (s.parent ?? null) === (encl?.key ?? null)).sort((a, b) => a.stmtStart - b.stmtStart)[0];
        if (next && stripAllComments(src.slice(g.end, next.stmtStart)).trim() === "") { anchor = next.key; doc = true; }
      }
    }
    if (!doc) {
      if (trailing) context = before.trim();
      else {
        let p = g.end;
        while (p < src.length) {
          const m = /\S/.exec(src.slice(p)); if (!m) break;
          p += m.index;
          if (src.startsWith("//", p)) { p = src.indexOf("\n", p); if (p < 0) break; continue; }
          if (src.startsWith("/*", p)) { p = src.indexOf("*/", p) + 2; continue; }
          context = src.slice(p, lineAt(src, p)[1]).trim(); break;
        }
        if (context === null) context = "(end of file)";
      }
      context = stripAllComments(context).trim().slice(0, 90);
    }
    notes.push({ anchor, context, doc, text: g.text, line: g.start ? src.slice(0, g.start).split("\n").length : 1 });
  }
  return notes;
}

function stripAllComments(s) { return s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1"); }

/** Removes non-kept comments. Returns { out, removed }. Caller verifies AST equality. */
export function strip(src, comments) {
  const rm = comments.filter((c, i) => !keepComment(c, i, src));
  let out = src;
  for (let k = rm.length - 1; k >= 0; k--) {
    const c = rm[k];
    const [la] = lineAt(out, c.start);
    let [, lb] = lineAt(out, c.end);
    const before = out.slice(la, c.start), after = out.slice(c.end, lb);
    const bWs = !/\S/.test(before), aWs = !/\S/.test(after);
    const nl = out.slice(c.start, c.end).includes("\n");
    if (bWs && aWs) { out = out.slice(0, la) + out.slice(Math.min(lb + 1, out.length)); }
    else if (bWs) { const sp = after.match(/^[ \t]*/)[0].length; out = out.slice(0, c.start) + out.slice(c.end + sp); }
    else if (aWs) { const sp = before.match(/[ \t]*$/)[0].length; out = out.slice(0, c.start - sp) + out.slice(lb); }
    else {
      const sb = before.match(/[ \t]*$/)[0].length, sa = after.match(/^[ \t]*/)[0].length;
      const pc = out[c.start - sb - 1], nc = out[c.end + sa];
      const glue = nl ? "\n" : ("([{".includes(pc) || ")]},;".includes(nc)) ? "" : " ";
      out = out.slice(0, c.start - sb) + glue + out.slice(c.end + sa);
    }
  }
  return { out: collapseBlank(out), removed: rm.length };
}

function collapseBlank(src) {
  let ast;
  try { ast = acornParse(src, OPTS); } catch { return src; }
  const prot = [];
  walk(ast, (n) => { if (n.type === "TemplateLiteral" || (n.type === "Literal" && typeof n.value === "string")) prot.push([n.start, n.end]); });
  prot.sort((a, b) => a[0] - b[0]);
  let res = "", last = 0;
  const seg = (s, lead) => { let t = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n"); if (lead) t = t.replace(/^\s*\n/, ""); return t; };
  for (const [a, b] of prot) { if (a < last) continue; res += seg(src.slice(last, a), last === 0) + src.slice(a, b); last = b; }
  res += seg(src.slice(last), last === 0);
  return res.replace(/\s*$/, "\n");
}

/* ---------- tracing ---------- */

const BUILTIN = new Set("Math Object Array JSON Number String Promise console Date Symbol Reflect Map Set WeakMap WeakSet parseInt parseFloat isNaN isFinite Boolean BigInt Error TypeError RangeError structuredClone Intl URL URLSearchParams Uint8Array Uint16Array Uint32Array Int8Array Int16Array Int32Array Float32Array Float64Array ArrayBuffer DataView TextEncoder TextDecoder encodeURIComponent decodeURIComponent atob btoa queueMicrotask performance".split(" "));
const KEYCODE = /^(Key[A-Z]|Digit\d|Numpad\w+|Arrow(Up|Down|Left|Right)|Space|Enter|Escape|Tab|Backspace|Delete|Shift(Left|Right)?|Control(Left|Right)?|Alt(Left|Right)?|Meta(Left|Right)?|F\d{1,2}|Backquote|Minus|Equal|Bracket(Left|Right)|Semicolon|Quote|Comma|Period|Slash|Backslash|PageUp|PageDown|Home|End)$/;

function strArg(n) {
  if (!n) return null;
  if (n.type === "Literal" && typeof n.value === "string") return n.value;
  if (n.type === "TemplateLiteral") return n.quasis.map((q) => q.value.cooked).join("${…}");
  if (n.type === "Identifier") return "‹" + n.name + "›";
  if (n.type === "BinaryExpression" && n.operator === "+") return (strArg(n.left) ?? "…") + (strArg(n.right) ?? "…");
  return "‹" + memberText(n) + "›";
}

export function trace(rel, src, ast, syms) {
  const imports = [], reexports = [], dynamic = [], exports = [];
  const bindings = new Map();
  for (const s of ast.body) {
    if (s.type === "ImportDeclaration") {
      const names = s.specifiers.map((sp) => ({ local: sp.local.name, imported: sp.type === "ImportDefaultSpecifier" ? "default" : sp.type === "ImportNamespaceSpecifier" ? "*" : keyName(sp.imported) }));
      imports.push({ spec: s.source.value, names, line: s.loc.start.line });
      for (const n of names) bindings.set(n.local, { spec: s.source.value, imported: n.imported });
    } else if (s.type === "ExportAllDeclaration") {
      reexports.push({ spec: s.source.value, names: [{ local: s.exported ? keyName(s.exported) : "*", imported: "*" }], line: s.loc.start.line });
      exports.push({ name: s.exported ? keyName(s.exported) : "*", from: s.source.value });
    } else if (s.type === "ExportNamedDeclaration") {
      if (s.source) reexports.push({ spec: s.source.value, names: s.specifiers.map((sp) => ({ local: keyName(sp.exported), imported: keyName(sp.local) })), line: s.loc.start.line });
      if (s.declaration) {
        if (s.declaration.id) exports.push({ name: s.declaration.id.name, kind: s.declaration.type.replace("Declaration", "").toLowerCase() });
        for (const d of s.declaration.declarations ?? []) {
          if (d.id.type === "Identifier") exports.push({ name: d.id.name, kind: isFn(d.init) ? "function" : s.declaration.kind });
          else walk(d.id, (n) => { if (n.type === "Identifier") exports.push({ name: n.name, kind: s.declaration.kind }); });
        }
      }
      for (const sp of s.specifiers) exports.push({ name: keyName(sp.exported), local: keyName(sp.local), from: s.source?.value });
    } else if (s.type === "ExportDefaultDeclaration") exports.push({ name: "default", local: s.declaration.id?.name ?? null, kind: s.declaration.type });
  }
  const refs = new Map();
  const calls = [], effects = [];
  const owner = (pos) => innermost(syms, pos, true)?.key ?? "@file";
  const eff = (kind, value, node, extra = {}) => effects.push({ kind, value, at: owner(node.start), line: node.loc.start.line, ...extra });
  walk(ast, (n, par) => {
    const p = par[par.length - 1];
    if (n.type === "Identifier") {
      const gp = par[par.length - 2];
      const exportLocal = p?.type === "ExportSpecifier" && p.local === n && !gp?.source;
      const isDecl = !exportLocal && p && (((p.type === "FunctionDeclaration" || p.type === "ClassDeclaration" || p.type === "VariableDeclarator" || p.type === "FunctionExpression" || p.type === "ClassExpression") && p.id === n) ||(p.type === "ImportSpecifier" || p.type === "ImportDefaultSpecifier" || p.type === "ImportNamespaceSpecifier" || p.type === "ExportSpecifier") || (p.type === "MemberExpression" && p.property === n && !p.computed) || (p.type === "Property" && p.key === n && !p.computed && !p.shorthand) || (p.type === "MethodDefinition" && p.key === n) || (p.type === "PropertyDefinition" && p.key === n));
      if (!isDecl) refs.set(n.name, (refs.get(n.name) ?? 0) + 1);
    }
    if (n.type === "ImportExpression") dynamic.push({ spec: strArg(n.source), line: n.loc.start.line, at: owner(n.start) });
    if (n.type === "CallExpression" || n.type === "NewExpression") {
      const cal = n.callee.type === "ChainExpression" ? n.callee.expression : n.callee;
      const text = memberText(cal);
      const root = rootIdent(cal);
      const isNew = n.type === "NewExpression";
      calls.push({ text, root, prop: cal.type === "MemberExpression" && !cal.computed ? keyName(cal.property) : null, direct: cal.type === "Identifier", isNew, at: owner(n.start), line: n.loc.start.line });
      const a0 = n.arguments[0], a1 = n.arguments[1];
      const last = text.split(".").pop();
      if (last === "addEventListener" || last === "removeEventListener") eff(last === "addEventListener" ? "event.listen" : "event.unlisten", strArg(a0), n, { target: memberText(cal.object ?? cal), handler: a1 ? (a1.type === "Identifier" ? a1.name : a1.type === "MemberExpression" ? memberText(a1) : "(inline)") : null });
      else if (last === "dispatchEvent") eff("event.dispatch", a0?.type === "NewExpression" ? strArg(a0.arguments[0]) : strArg(a0), n, { target: memberText(cal.object ?? cal) });
      else if (/^(emit|fire|trigger)$/.test(last) && a0) eff("bus.emit", strArg(a0), n, { target: memberText(cal.object ?? cal) });
      else if (/^(on|once|off|subscribe)$/.test(last) && a0 && cal.type === "MemberExpression") eff("bus.on", strArg(a0), n, { target: memberText(cal.object) });
      else if (/^(localStorage|sessionStorage)\.(getItem|setItem|removeItem)$/.test(text.replace(/^(window|globalThis|self)\./, ""))) eff("storage." + last.replace("Item", ""), strArg(a0), n, { store: text.includes("session") ? "session" : "local" });
      else if (text === "fetch" || /\.fetch$/.test(text)) eff("net.fetch", strArg(a0), n, { method: a1?.type === "ObjectExpression" ? strArg(a1.properties.find((p) => keyName(p.key) === "method")?.value) : null });
      else if (isNew && /^(WebSocket|EventSource|Worker|SharedWorker|BroadcastChannel)$/.test(text)) eff("net." + text, a0?.type === "NewExpression" ? strArg(a0.arguments[0]) : strArg(a0), n);
      else if (/^(window\.|globalThis\.|self\.)?(setInterval|setTimeout|requestAnimationFrame|requestIdleCallback)$/.test(text)) eff("timer", text.replace(/^(window|globalThis|self)\./, ""), n);
      else if (/(^|\.)getElementById$/.test(text) || (text === "$" && a0 && n.arguments.length === 1)) eff("dom.id", strArg(a0), n);
      else if (/(^|\.)(querySelector|querySelectorAll|closest)$/.test(text)) eff("dom.query", strArg(a0), n);
      else if (/(^|\.)createElement$/.test(text)) eff("dom.create", strArg(a0), n);
      else if (text === "registerJump" && a0?.type === "ObjectExpression") eff("console.jump", strArg(a0.properties.find((p) => keyName(p.key) === "id")?.value), n);
      else if (/(^|\.)postMessage$/.test(text)) eff("net.postMessage", memberText(cal.object ?? cal), n);
    }
    if (n.type === "AssignmentExpression" && n.left.type === "MemberExpression") {
      const t = memberText(n.left);
      if (/^(window|globalThis|self)\.[\w$]+$/.test(t)) eff(/\.on\w+$/.test(t) ? "event.handler" : "global.write", t, n);
      else if (!n.left.computed && /^on[a-z]+$/.test(keyName(n.left.property))) eff("event.handler", t, n);
    }
    if (n.type === "Literal" && typeof n.value === "string" && KEYCODE.test(n.value)) eff("input.key", n.value, n);
  });
  return { imports, reexports, dynamic, exports, bindings, refs, calls, effects };
}

export function resolveSpec(fromRel, spec) {
  if (typeof spec !== "string" || !(spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/"))) return null;
  return path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), spec));
}

export const isBuiltinRoot = (r) => BUILTIN.has(r);
