/* Headless smoke for 0.3.95: ARIA 1.5 on a phone-sized screen.
 *
 * The node suite (test/aria15.test.mjs) proves the instruments. This proves
 * the part it cannot: that the game still boots with five new modules in the
 * graph, that ARIA takes the conn and looks, and that NAV › ARIA CORE draws
 * WHAT SHE SEES and HER WAKE at 412 px wide without spilling off the side or
 * throwing.
 *
 *   python server.py 8124 &
 *   node test/smoke-aria15.mjs "$(npm root -g)/playwright/index.mjs" [port] [screenshot.png]
 */
const pwPath = process.argv[2];
const port = process.argv[3] || "8124";
const shot = process.argv[4] || null;
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });

let fails = 0;
const ok = (c, m) => { console.log(`${c ? "ok  " : "FAIL"} ${m}`); if (!c) fails++; };

await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
await page.fill("#callsign", "SightSmoke");
await page.click("#btn-create");
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await page.waitForTimeout(400);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.evaluate(() => [...document.querySelectorAll("#create-body .pick")].find((b) => /mining/i.test(b.textContent))?.click() ?? document.querySelector("#create-body .pick")?.click());
await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 60000 });
await page.waitForTimeout(1800);
ok(errors.length === 0, `the game boots with the new modules in the graph (${errors.length} page errors)`);

/* ---- she takes the conn and looks ------------------------------------------ */
const took = await page.evaluate(async () => {
  const { ariaTakeConn } = await import("/js/aria/aria.js");
  return ariaTakeConn();
});
ok(took.ok, `ARIA takes the conn (${took.error ?? "ok"})`);
await page.waitForFunction(async () => {
  const { ariaMind } = await import("/js/aria/mind.js");
  return Boolean(ariaMind.scene && ariaMind.decision);
}, null, { timeout: 60000, polling: 500 }).catch(() => {});
const seen = await page.evaluate(async () => {
  const { ariaMind } = await import("/js/aria/mind.js");
  const { ariaFlying } = await import("/js/aria/wake.js");
  return { scene: ariaMind.scene, decision: ariaMind.decision?.action ?? null, why: ariaMind.decision?.why ?? null, flying: ariaFlying() };
});
ok(seen.scene?.line && seen.scene.threat?.band, `she has a scene: "${seen.scene?.line}", threat ${seen.scene?.threat?.band}`);
ok(seen.flying, "and the wake knows she is the one flying");
console.log(`    decision: ${seen.decision} — ${seen.why}`);

/* ---- the Core, with something in the ledger -------------------------------- */
await page.evaluate(async () => {
  const { noteTrade } = await import("/js/aria/footprint.js");
  const { sim } = await import("/js/sim/sim.js");
  noteTrade({
    at: sim.time, port: { id: "smoke-port", name: "Ceres Foundry Smoke Port" }, kind: "sell", slipLost: 412,
    lots: [{ id: "iron_ore", name: "Iron ore", qty: 180, cr: 5230, m0: 1.22, m1: 0.94, need: true }],
    standing: { id: "smoke-corp", name: "Ceres Works", before: 3, after: 3.8 },
    forecast: { restarted: [{ id: "smelter", name: "Smelter" }], stalled: [] },
  });
  const { openConsole } = await import("/js/console/console.js");
  openConsole("nav", "core");
});
await page.waitForTimeout(1500);
const core = await page.evaluate(() => {
  const heads = [...document.querySelectorAll("#console h3")].map((h) => h.textContent.trim());
  const text = document.querySelector("#console")?.innerText ?? "";
  const wide = [...document.querySelectorAll("#console *")].filter((n) => n.getBoundingClientRect().right > window.innerWidth + 1).length;
  const steward = document.querySelector('#console input[aria-label="Steward weight"]');
  return { heads, wide, scroll: document.documentElement.scrollWidth, vw: window.innerWidth, hasSteward: Boolean(steward), steward: steward?.value ?? null,
    forecasts: /Forecasts kept/.test(text), scene: /Scene/.test(text) && /Threat/.test(text), port: /Ceres Foundry Smoke Port/.test(text), corp: /Ceres Works/.test(text), lines: /Station lines/.test(text), slip: /412 cr given up/.test(text) };
});
ok(core.heads.includes("WHAT SHE SEES") && core.heads.includes("HER WAKE"), `ARIA CORE has the two new sections (${core.heads.join(" · ")})`);
ok(core.scene, "WHAT SHE SEES shows the scene and the threat");
ok(core.forecasts, "the Core shows Forecasts kept");
ok(core.port && core.corp && core.lines && core.slip, `HER WAKE shows the port, the corp, the line forecast and the price-move cost (${[core.port, core.corp, core.lines, core.slip].join(",")})`);
ok(core.hasSteward && core.steward === "0.25", `Steward weight is a standing order, starting at 0.25 (${core.steward})`);
ok(core.scroll <= core.vw + 1, `nothing pushes the page sideways at ${core.vw} px (scroll width ${core.scroll}, ${core.wide} nodes past the edge)`);

/* ---- the order is kept ------------------------------------------------------ */
const kept = await page.evaluate(async () => {
  const input = document.querySelector('#console input[aria-label="Steward weight"]');
  input.value = "0.6";
  input.dispatchEvent(new Event("change", { bubbles: true }));
  const { ariaMind } = await import("/js/aria/mind.js");
  return ariaMind.orders.steward;
});
ok(kept === 0.6, `changing it changes her orders (${kept})`);

if (shot) await page.screenshot({ path: shot, fullPage: false });

await page.evaluate(async () => { const { ariaRelease } = await import("/js/aria/aria.js"); ariaRelease(); });
ok(errors.length === 0, `no page errors through all of it (${errors.join(" | ") || "none"})`);
await browser.close();
console.log(fails ? `smoke-aria15: ${fails} FAILED` : "smoke-aria15: PASS");
process.exit(fails ? 1 : 0);
