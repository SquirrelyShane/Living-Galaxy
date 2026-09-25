/* 0.3.54 — CON › CREW › GDB in a real browser, portrait phone: the census
 * reads (hundreds catalogued, no shared names), a search narrows the list, a
 * FILE card opens with the person's record, the chronicle has lines, and
 * nothing overflows the sheet sideways. Also: the relay's /gdb endpoints are
 * up and the catalogue reaches them.
 *   node test/smoke-gdb.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 384, height: 832 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });
const sleep = (ms) => page.waitForTimeout(ms);
const checks = [];
const ok = (c, m) => { checks.push([Boolean(c), m]); console.log(`${c ? "ok  " : "FAIL"} ${m}`); };

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "GdbSmoke");
await page.click("#btn-create"); await sleep(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click()); await sleep(300);
await page.click("#create-next"); await sleep(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
await page.click("#create-next"); await sleep(300);
await page.click("#create-next"); await sleep(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await sleep(1500);

/* a few halls and hull crews, the way play fills the catalogue */
const filled = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { stations } = await import("/js/stations.js");
  const { stationRoster } = await import("/js/crew.js");
  const { traffic } = await import("/js/npc/traffic.js");
  const { crewOf } = await import("/js/npc/npccrew.js");
  for (const st of stations.slice(0, 4)) stationRoster(st, 0, sim.skySeed);
  for (const v of traffic.slice(0, 20)) crewOf(v);
  const G = await import("/js/gdb.js");
  await G.flushGdb();
  return G.census({ sky: sim.skySeed });
});
ok(filled.total > 100 && filled.sharedNames === 0, `${filled.total} catalogued in this sky, ${filled.sharedNames} shared names`);

await page.evaluate(async () => (await import("/js/console/console.js")).openConsole("crew", "gdb"));
await sleep(900);
const g0 = await page.evaluate(() => ({
  subs: [...document.querySelectorAll("#con-subtabs button, .con-subtabs button, [data-sub]")].map((b) => b.textContent.trim()).filter(Boolean),
  heads: [...document.querySelectorAll("#con-body .term-sec h3")].map((h) => h.textContent),
  rows: document.querySelectorAll("#con-body [data-gdb]").length,
  shared: [...document.querySelectorAll("#con-body .trow")].find((r) => /Names shared/.test(r.textContent))?.querySelector(".v")?.textContent,
  chron: document.querySelectorAll("#con-body .term-sec:last-child .in-talk-log p").length,
  overflow: document.querySelector("#con-body").scrollWidth > document.querySelector("#con-body").clientWidth + 1,
}));
ok(g0.heads.some((h) => /GALACTIC DATABASE/.test(h)) && g0.heads.some((h) => /^ON FILE/.test(h)), `the GDB page is up (${g0.heads.join(" | ")})`);
ok(g0.rows >= 20, `people on file are listed (${g0.rows} on the first page)`);
ok(g0.shared === "0", "no names shared");
ok(g0.chron > 0, `the chronicle has lines (${g0.chron})`);
ok(!g0.overflow, "the sheet does not overflow sideways");

/* search, then open a file */
const q = await page.evaluate(() => document.querySelector("#con-body [data-gdb] .k")?.firstChild?.textContent?.split(" ")[0] ?? "");
await page.fill("#con-body input.tinput", q);
await sleep(600);
const g1 = await page.evaluate(() => ({ rows: document.querySelectorAll("#con-body [data-gdb]").length }));
ok(g1.rows >= 1 && g1.rows < g0.rows, `a search narrows it ("${q}" → ${g1.rows})`);
await page.evaluate(() => [...document.querySelectorAll("#con-body [data-gdb] .tbtn")].find((b) => b.textContent === "FILE")?.click());
await sleep(500);
const g2 = await page.evaluate(() => { const c = document.querySelector("#con-body [data-gdb-card]"); return { card: Boolean(c), text: c?.textContent ?? "" }; });
ok(g2.card && /GDB-[0-9A-Z]{6}/.test(g2.text) && /Status/.test(g2.text), "FILE opens their record, number and all");
await page.screenshot({ path: "/tmp/gdb-panel.png" });

/* the relay has them */
const relay = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const r = await fetch(`/gdb/all?room=${encodeURIComponent(sim.skySeed)}`);
  const j = await r.json();
  return { status: r.status, n: j.entries?.length ?? 0 };
});
ok(relay.status === 200 && relay.n > 50, `the relay holds this sky's catalogue (${relay.n} entries)`);

ok(!errors.length, `no page errors (${errors.length})`);
await browser.close();
const bad = checks.filter(([c]) => !c);
if (bad.length) { console.error(`smoke-gdb: ${bad.length} failed`); process.exit(1); }
console.log("smoke-gdb: all green");
