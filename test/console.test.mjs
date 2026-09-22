// node --import ./test/three-register.mjs test/console.test.mjs — the CONSOLE shell without a document
//
// Every module under js/console, js/crew, js/mission and js/upgrades.js must
// import in node with no `document`; the registry registers the six panels in
// order; jumpTo parses paths; query() finds a registered jump; and no file in
// the console/crew/mission tree is over 600 lines.
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

let pass = 0, fail = 0;
const t = async (name, fn) => {
  try { await fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.log(`FAIL  ${name}\n      ${e.stack ?? e.message}`); fail++; }
};

const ROOT = new URL("../", import.meta.url).pathname;
const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith(".js") ? [p] : []; });
const MODULES = [...walk(join(ROOT, "js/console")), ...walk(join(ROOT, "js/crew")), ...walk(join(ROOT, "js/mission")), join(ROOT, "js/upgrades.js"), join(ROOT, "js/refityard.js")];

await t("no document at import", () => assert.equal(globalThis.document, undefined));

await t("every console / crew / mission module imports in node", async () => {
  for (const m of MODULES) {
    try { await import(m); }
    catch (e) { throw new Error(`${m.replace(ROOT, "")}: ${e.message}`); }
  }
});

const C = await import("../js/console/console.js");
const S = await import("../js/console/search.js");

await t("mountConsole registers six panels in order and returns a painter", () => {
  const paint = C.mountConsole();
  assert.equal(typeof paint, "function");
  assert.deepEqual([...C.console.panels.keys()], ["ship", "nav", "crew", "work", "market", "corp"]);
  for (const p of C.console.panels.values()) {
    assert.equal(typeof p.mount, "function");
    assert.equal(typeof p.paint, "function");
    assert.equal(typeof p.search, "function");
    assert.ok(Array.isArray(p.subtabs));
  }
  paint({ terminalOpen: false, phase: "play" }); // no DOM: must be a no-op, not a throw
});

await t("registerPanel fills defaults and keeps order", () => {
  const rec = C.registerPanel({ id: "zz", title: "ZZ" });
  assert.equal(typeof rec.unmount, "function");
  assert.deepEqual(rec.search(), []);
  assert.equal([...C.console.panels.keys()].pop(), "zz");
  C.console.panels.delete("zz");
});

await t("jumpTo parses panel/sub#focus", () => {
  assert.equal(C.jumpTo("work/drones#d3"), true);
  assert.equal(C.console.panel, "work");
  assert.equal(C.console.sub.work, "drones");
  assert.equal(C.console.focus, "d3");
  assert.equal(C.jumpTo("corp"), true);
  assert.equal(C.console.panel, "corp");
  assert.equal(C.jumpTo(""), false);
  assert.equal(C.jumpTo("nowhere"), true); // unknown panels are ignored, not thrown
  assert.equal(C.console.panel, "corp");
  C.closeConsole();
});

await t("registerJump builds a path; query() finds it by label and by keyword", () => {
  S.registerJump({ id: "t-ice", label: "Ice works", hint: "melt water ice", keywords: "bench drill", panel: "market", sub: "hold", focus: "ice-works" });
  assert.equal(S.jumps.get("t-ice").path, "market/hold#ice-works");
  const hits = S.query("ice");
  assert.ok(hits.some((h) => h.label === "Ice works"), "label hit");
  assert.ok(S.query("drill").some((h) => h.id === "t-ice"), "keyword hit");
  assert.ok(S.query("ice")[0].label.toLowerCase().startsWith("ice"), "label match ranks first");
  assert.deepEqual(S.query(""), []);
  assert.equal(S.query("zzzzqqq").length, 0);
});

await t("query() includes every panel's sub-tabs and the static jumps", () => {
  assert.ok(S.query("systems").some((h) => h.path === "ship/systems"));
  assert.ok(S.query("map").some((h) => h.id === "map"));
  assert.ok(S.query("directory").length >= 10);
});

await t("runHit runs a run() leaf, else jumps, and remembers it", () => {
  let ran = 0;
  S.registerJump({ id: "t-run", label: "Test leaf", run: () => { ran++; } });
  assert.equal(S.runHit(S.jumps.get("t-run")), true);
  assert.equal(ran, 1);
  assert.equal(C.console.recents[0].path, "@t-run");
  assert.equal(S.runHit(S.jumps.get("t-ice")), true);
  assert.equal(C.console.panel, "market");
  assert.equal(C.console.sub.market, "hold");
  assert.equal(C.console.recents[0].path, "market/hold#ice-works");
  assert.ok(C.console.recents.length <= 6);
  C.closeConsole();
});

/* hud.js is exempt: PLAN §2.5 limits package A to seven call-site edits there ("Nothing else"). */
/* The gate is about modules a person has to read and change. A GENERATED data
 * file is not one — js/crew/voice-bank.js is 2,848 dialogue lines emitted by
 * tools/gen-voice-bank.py, and splitting it into six files of four hundred
 * lines would make it no more readable and the generator worse. The exemption
 * is earned by declaring itself generated in its own header, so it cannot be
 * claimed by hand-written code that has simply grown too long. */
const GENERATED = /^\/\*[\s\S]{0,400}?\bGenerated\b/;

await t("files stay under 600 lines", () => {
  const over = [...MODULES, join(ROOT, "js/stationdeck.js"), join(ROOT, "js/tutorial.js")]
    .map((m) => [m.replace(ROOT, ""), readFileSync(m, "utf8")])
    .filter(([, src]) => !GENERATED.test(src))
    .map(([name, src]) => [name, src.split("\n").length])
    .filter(([, n]) => n > 600);
  assert.deepEqual(over, []);
});

await t("a generated file says so, and nothing hand-written claims the exemption", () => {
  const claimed = [...MODULES]
    .map((m) => [m.replace(ROOT, ""), readFileSync(m, "utf8")])
    .filter(([, src]) => GENERATED.test(src))
    .map(([name]) => name);
  assert.deepEqual(claimed, ["js/crew/voice-bank.js"]);
});

await t("the old surfaces are gone", () => {
  for (const m of [["js", "term" + "inal.js"], ["js", "ui", "de" + "ck.js"]]) assert.throws(() => statSync(join(ROOT, ...m)), `${m.join("/")} still exists`);
});

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
