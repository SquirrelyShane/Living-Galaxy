/* Headless smoke for 0.3.19: WORK › PRESETS › TRADE RUN starts on a real route; MARKET › ROUTES lists them.
 * door, release up the exit lane outside the tractor's reach, no re-lock and
 * no lane hail on the way out, the lane rig drawn only inside 5 km of it.
 *   node test/smoke-docking.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "DockSmoke");
await page.click("#btn-create");
await sleep(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await sleep(400);
await page.click("#create-next");
await sleep(300);
await page.evaluate(() => [...document.querySelectorAll("#create-body .pick")].find((b) => /mining/i.test(b.textContent))?.click() ?? document.querySelector("#create-body .pick")?.click());
await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
await page.click("#create-next");
await sleep(300);
await page.click("#create-next");
await sleep(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await sleep(1200);
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok ", m); } else { fail++; console.log("  FAIL", m); } };

const r = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const { sim } = await import("/js/sim.js");
  const { openConsole, closeConsole } = await import("/js/console/console.js");
  const { mission } = await import("/js/mission/run.js");
  const { bestRoute } = await import("/js/traderoutes.js");
  sim.ship.credits = 20000;
  const out = { best: bestRoute()?.name ?? null };
  /* MARKET › ROUTES */
  openConsole("market", "routes");
  await sleep(600);
  const body = document.querySelector("#con-body");
  out.routeRows = [...(body?.querySelectorAll(".trow") ?? [])].filter((r) => /→/.test(r.textContent)).length;
  out.flyButtons = [...(body?.querySelectorAll("button") ?? [])].filter((b) => b.textContent === "FLY IT").length;
  /* WORK › the TRADE RUN preset's RUN button */
  openConsole("work");
  await sleep(600);
  const rows = [...document.querySelectorAll("#con-body .trow")];
  const tradeRow = rows.find((r) => /TRADE RUN/.test(r.textContent));
  out.tradeRow = Boolean(tradeRow);
  [...(tradeRow?.querySelectorAll("button") ?? [])].find((b) => b.textContent === "RUN")?.click();
  for (let i = 0; i < 40 && !mission.trade; i++) await sleep(100);
  out.running = mission.active?.name ?? null;
  out.route = mission.trade?.line ?? null;
  out.first = mission.active?.steps?.[0]?.target?.kind ?? mission.active?.steps?.[0]?.op;
  out.notice = sim.notice;
  closeConsole?.();
  return out;
});
console.log(JSON.stringify(r));
ok(r.routeRows >= 1 && r.flyButtons >= 1, `MARKET › ROUTES lists ${r.routeRows} routes with FLY IT`);
ok(r.tradeRow, "WORK › PRESETS has TRADE RUN");
ok(r.running === "TRADE RUN" && r.route, `RUN starts it on a real route: ${r.route}`);
ok(errors.length === 0, `no page errors (${errors.length})`);
await browser.close();
console.log(`smoke trade: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
