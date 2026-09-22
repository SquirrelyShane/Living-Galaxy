/* LIVING GALAXY 0.3.27 — a build that cannot start says why.
 *
 *   node --import ./test/three-register.mjs test/boot.test.mjs
 *
 * ES modules link before they run, so ONE file left a version behind its
 * neighbours does not throw where anybody can see it: the whole graph never
 * evaluates, index.html's shell stays on screen, the canvas stays black, and
 * the server log is clean because every file was there — they just did not
 * agree with each other. This is the reporter that turns that into words, and
 * these are the words, in the three ways the three engines phrase it.
 */

import { EXPECTS, readFailure, explain, showFailure, guard } from "../js/boot.js";
import { VERSION } from "../js/version.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };

/* ---- reading the failure, whatever the engine calls it ------------------------------ */
{
  const chromium = "The requested module './economy.js' does not provide an export named 'lotMult'";
  const firefox = "The requested module './economy.js' doesn't provide an export named: 'lotMult'";
  const safari = "Importing binding name 'lotMult' is not found.";
  for (const [engine, msg] of [["Chromium", chromium], ["Firefox", firefox], ["Safari", safari]]) {
    const f = readFailure(new Error(msg));
    ok(f.kind === "mismatch" && f.name === "lotMult", `${engine}'s wording is read as a half-patched tree missing ${f.name}`);
    ok(f.patch === "0.3.24", `and it knows lotMult arrived in ${f.patch}`);
  }
  ok(readFailure(new Error(chromium)).module === "./economy.js", "and which module was asked for it");
  const miss = readFailure(new Error("Failed to fetch dynamically imported module: http://x/js/sites.js"));
  ok(miss.kind === "missing", "a file that would not load is a different problem and reads as one");
  const other = readFailure(new TypeError("x is not a function"));
  ok(other.kind === "error" && !other.name, "and anything else is neither");
}

/* ---- the words ---------------------------------------------------------------------- */
{
  const w = explain(readFailure(new Error("The requested module './economy.js' does not provide an export named 'lotMult'")));
  ok(/half-patched/i.test(w.title), `the title says what is wrong: "${w.title}"`);
  ok(w.body.includes("economy.js") && w.body.includes("lotMult"), "the body names the module and the export");
  ok(/0\.3\.24/.test(w.fix) && /order/.test(w.fix), `and the fix is an instruction, not a diagnosis: "${w.fix.replace(/<[^>]+>/g, "")}"`);
  const u = explain(readFailure(new Error("does not provide an export named 'somethingNewerThanThisTable'")));
  ok(!/undefined/.test(u.fix) && u.fix.length > 20, "an export the table has never heard of still gets a usable instruction");
  ok(Object.entries(EXPECTS).every(([k, v]) => /^0\.\d+\.\d+$/.test(v) && k.length > 2), `${Object.keys(EXPECTS).length} exports are mapped to the patch they arrived in`);
}

/* ---- it puts it on the page ---------------------------------------------------------- */
{
  const made = [];
  const cls = new Set();
  globalThis.document = {
    createElement: (t) => { const n = { tag: t, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; if (k === "id") this.id = v; }, set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html; } }; made.push(n); return n; },
    body: { appendChild: (n) => made.push(n) },
    documentElement: { classList: { add: (c) => cls.add(c) } },
    getElementById: () => null,
  };
  const err = console.error; console.error = () => {};
  const f = showFailure(new Error("The requested module './economy.js' does not provide an export named 'lotMult'"));
  console.error = err;
  const panel = made.find((n) => n.tag === "div");
  ok(f.name === "lotMult" && panel, "the panel is built");
  ok(panel.attrs.role === "alert" && panel.id === "boot-fail", "as an alert with an id the watchdog can see");
  ok(/half-patched/i.test(panel.innerHTML) && /0\.3\.24/.test(panel.innerHTML), "carrying the title and the patch to re-apply");
  ok(panel.innerHTML.includes(VERSION), `and the build it is complaining about (${VERSION})`);
  ok(cls.has("boot-failed"), "and the page is marked failed, so the panel covers the shell instead of sitting behind a black canvas");
  ok(!/<script/i.test(panel.innerHTML), "the message is escaped, not injected");
  made.length = 0;
  const e2 = console.error; console.error = () => {};
  showFailure(new Error("<img src=x onerror=alert(1)> does not provide an export named 'x'"));
  console.error = e2;
  const p2 = made.find((n) => n.tag === "div");
  ok(!/<img/.test(p2.innerHTML) && /&lt;img/.test(p2.innerHTML), "…including one that tried to be");
  delete globalThis.document;
}

/* ---- and it wraps the boot ------------------------------------------------------------ */
{
  let ran = 0;
  ok(guard(() => { ran++; return 7; }) === 7 && ran === 1, "a boot that works is passed straight through");
  globalThis.document = { createElement: () => ({ setAttribute() {}, set innerHTML(v) { this._h = v; } }), body: { appendChild() {} }, documentElement: { classList: { add() {} } }, getElementById: () => null };
  const err = console.error; console.error = () => {};
  const r = guard(() => { throw new Error("mount blew up"); });
  console.error = err;
  ok(r === null, "a boot that throws is caught rather than left to the console");
  delete globalThis.document;
}

console.log(`boot: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
