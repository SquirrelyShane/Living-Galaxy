/* Headless smoke: the canopy never stops drawing because a panel threw.
 *
 * The report: "warping then going into the CON will make the rendering freeze
 * and not come out of it." The console paints from the HUD paint, which the
 * ENGINE calls inside its frame tick — so a refresher that threw took the tick
 * with it before the renderer ran, every frame, for good. The thrower was
 * WORK's live autopilot card writing to a subtitle element that kit.card had
 * never created; any active mission plus that panel open froze the game.
 *
 * What this measures:
 *   - with a mission flying (auto-warp), every console panel opens and the
 *     canopy keeps drawing frames
 *   - a refresher that throws on purpose is dropped, and the canopy still draws
 *
 *   node test/smoke-freeze.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });
let fail = 0;
const ok = (c, m) => { if (c) console.log("  ok ", m); else { fail++; console.error("  FAIL", m); } };

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "FreezeSmoke");
await page.click("#btn-create");
for (let i = 0; i < 4; i++) { await page.waitForTimeout(350); await page.click("#create-next").catch(() => {}); }
await page.waitForTimeout(400);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await page.waitForTimeout(1500);

const frames = () => page.evaluate(() => new Promise((res) => {
  let n = 0;
  const t0 = performance.now();
  const f = () => { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(f); else res(n); };
  requestAnimationFrame(f);
}));

/* a mission in the air: the chart's auto-warp, the way a pilot starts one */
const target = await page.evaluate(async () => {
  const { sim, selectBody } = await import("/js/sim.js");
  const { stations } = await import("/js/stations.js");
  const AP = await import("/js/autopilot.js");
  const s = sim.ship;
  s.dockedAt = null;
  s.pos.y += 60000;
  const st = [...stations].sort((a, b) => Math.hypot(b.x - s.pos.x, b.y - s.pos.y, b.z - s.pos.z) - Math.hypot(a.x - s.pos.x, a.y - s.pos.y, a.z - s.pos.z))[0];
  selectBody(st.id);
  AP.engageAutoWarp(st.id);
  return st.name;
});
for (let i = 0; i < 90; i++) { await page.waitForTimeout(400); const w = await page.evaluate(async () => (await import("/js/sim.js")).sim.warp.state); if (w !== "idle") break; }
const state = await page.evaluate(async () => { const { mission } = await import("/js/mission/run.js"); const { sim } = await import("/js/sim.js"); return { mission: Boolean(mission.active), warp: sim.warp.state }; });
ok(state.mission, `a mission is flying to ${target} (warp ${state.warp})`);

const before = await frames();
ok(before > 2, `the canopy draws before the console opens (${before} frames in 1.5 s)`);

const panels = ["ship", "nav", "crew", "work", "market", "corp"];
const sweep = async (label) => {
for (const id of panels) {
  const hit = errors.length;
  /* opening a panel must not throw at the caller either — 0.3.04 threw right here */
  const why = await page.evaluate(async (p) => {
    try { const C = await import("/js/console/console.js"); C.openConsole(p); return ""; }
    catch (e) { return String(e?.message ?? e); }
  }, id);
  await page.waitForTimeout(700);
  const n = await frames();
  ok(!why && n > 2 && errors.length === hit, `${label} · CONSOLE › ${id.toUpperCase()}: ${n} frames, ${errors.length - hit} errors${why ? ` — ${why}` : ""}`);
}
};
await sweep("auto-warp");

/* the reported case: ARIA has the conn (so a mission is always in the air) and
 * the pilot taps through every panel */
const aria = await page.evaluate(async () => {
  const A = await import("/js/aria.js");
  const r = A.ariaTakeConn();
  return r.ok || r.error;
});
await page.waitForTimeout(2500);
ok(aria === true, `ARIA takes the conn (${aria})`);
await sweep("ARIA at the conn");

/* and a panel that genuinely throws is dropped, not fatal: hang a refresher that
 * always throws off SHIP's mount, the same way a panel's own line would */
const pushed = await page.evaluate(async () => {
  const C = await import("/js/console/console.js");
  const p = C.console.panels.get("ship");
  const mount = p.mount;
  let armed = false;
  p.mount = (root, ctx) => { mount(root, ctx); ctx.push(() => { armed = true; throw new Error("smoke: deliberate refresher failure"); }); };
  C.openConsole("ship");
  await new Promise((r) => setTimeout(r, 600));
  p.mount = mount;
  return armed;
});
const after = await frames();
ok(pushed, "a panel refresher that throws actually ran");
ok(after > 2, `…and the canopy keeps drawing (${after} frames in 1.5 s)`);
ok(errors.length === 0, `nothing reached the page as an unhandled error (${errors.length})`);

await page.evaluate(async () => { const C = await import("/js/console/console.js"); C.closeConsole(); });
await page.waitForTimeout(600);
const closed = await frames();
ok(closed > 2, `and it keeps drawing once the console is closed (${closed} frames)`);

await browser.close();
console.log(fail ? `freeze smoke: ${fail} failed` : "freeze smoke OK");
process.exit(fail ? 1 : 0);
