/* Headless smoke for the ledger: named boats with strobes on the board, the PORT LEDGER on the deck.
 *   node test/smoke-economy.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const { chromium } = await import(process.argv[2]);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = []; page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });
await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "Econ"); await page.click("#btn-create"); await sleep(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click()); await sleep(400);
await page.click("#create-next"); await sleep(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
await page.click("#create-next"); await sleep(300); await page.click("#create-next"); await sleep(300);
await page.click("#btn-sol"); await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 }); await sleep(1500);
/* sit 300 u off a logistic hub's mouth, looking at the entry lane */
await page.evaluate(() => {
  const { sim, stations } = window.__lg;
  const st = stations.find((s) => s.sector === "logistic" && s.hangars?.length) ?? stations[0];
  const m = st.hangars[0];
  sim.ship.pos.x = st.x + m.x + m.dir.x * 350 + m.up.x * 120; sim.ship.pos.y = st.y + m.y + m.dir.y * 350 + m.up.y * 120; sim.ship.pos.z = st.z + m.z + m.dir.z * 350 + m.up.z * 120;
  sim.ship.vel.x = st.vx; sim.ship.vel.y = st.vy; sim.ship.vel.z = st.vz;
  sim.ship.yaw = Math.atan2(m.dir.x, m.dir.z); sim.ship.pitch = -0.3; sim.ship.aimYaw = sim.ship.yaw; sim.ship.aimPitch = sim.ship.pitch;
  document.querySelectorAll("#tutorial").forEach((e) => e.classList.add("hidden"));
  window.__st = st.id;
});
await sleep(5000);
/* look at the nearest boat on the board */
await page.evaluate(async () => {
  const { sim } = window.__lg;
  const flow = (await import("/js/npc/flow.js")).flow;
  const near = flow.filter((n) => n.visible).map((n) => ({ n, d: Math.hypot(n.x - sim.ship.pos.x, n.y - sim.ship.pos.y, n.z - sim.ship.pos.z) })).sort((a, b) => a.d - b.d)[0]?.n;
  if (!near) return;
  const d = { x: near.x - sim.ship.pos.x, y: near.y - sim.ship.pos.y, z: near.z - sim.ship.pos.z }; const L = Math.hypot(d.x, d.y, d.z);
  sim.ship.yaw = Math.atan2(-d.x, -d.z); sim.ship.pitch = Math.asin(d.y / L); sim.ship.aimYaw = sim.ship.yaw; sim.ship.aimPitch = sim.ship.pitch;
});
await sleep(2000);
/* One fixed-time sample was luck-dependent twice over since 0.2.02: the flow is
 * half the size (a port can legitimately have nothing on its lanes for a
 * moment), and a boat with no hull warmed from the pool yet draws no label by
 * design. So poll: keep the nose on the nearest boat and sample until a label
 * shows or the patience runs out — the assertion itself is unchanged. */
let view = { navLights: 0, labels: [] };
for (let tries = 0; tries < 25; tries++) {
  await page.evaluate(async () => {
    const { sim } = window.__lg;
    const flow = (await import("/js/npc/flow.js")).flow;
    const near = flow.filter((n) => n.visible).map((n) => ({ n, d: Math.hypot(n.x - sim.ship.pos.x, n.y - sim.ship.pos.y, n.z - sim.ship.pos.z) })).sort((a, b) => a.d - b.d)[0]?.n;
    if (!near) return;
    const d = { x: near.x - sim.ship.pos.x, y: near.y - sim.ship.pos.y, z: near.z - sim.ship.pos.z }; const L = Math.hypot(d.x, d.y, d.z);
    sim.ship.yaw = Math.atan2(-d.x, -d.z); sim.ship.pitch = Math.asin(d.y / L); sim.ship.aimYaw = sim.ship.yaw; sim.ship.aimPitch = sim.ship.pitch;
  });
  await sleep(1000);
  view = await page.evaluate(() => {
    const GL = window.__lgGL;
    const sprites = []; GL.scene.traverse((o) => { if (o.isSprite && o.material?.map && o.scale.x >= 3.5 && o.scale.x < 400) sprites.push(o.scale.x); });
    const labels = [...document.querySelectorAll(".labels span.flow, .labels span.vessel")].map((s) => s.textContent);
    return { navLights: sprites.length, labels: labels.slice(0, 8) };
  });
  if (view.labels.some((l) => /^(\[D\])?▹ [A-Z]+ [A-Z]+ \d+/.test(l))) break;
}
console.log("view:", JSON.stringify(view));
await page.screenshot({ path: "/tmp/econ-view.png" });
/* dock and open the market: the ledger */
const deck = await page.evaluate(async () => {
  const { sim, stations, toggleDock } = window.__lg;
  const st = stations.find((s) => s.id === window.__st);
  const m = st.hangars[0];
  sim.ship.pos.x = st.x + m.x + m.dir.x * 40; sim.ship.pos.y = st.y + m.y + m.dir.y * 40; sim.ship.pos.z = st.z + m.z + m.dir.z * 40;
  sim.ship.vel.x = st.vx; sim.ship.vel.y = st.vy; sim.ship.vel.z = st.vz;
  toggleDock();
  for (let i = 0; i < 400 && !sim.ship.dockedAt; i++) await new Promise((r) => setTimeout(r, 100));
  await new Promise((r) => setTimeout(r, 800));
  const body = document.querySelector("#sd-body")?.textContent ?? "";
  return { docked: Boolean(sim.ship.dockedAt), ledger: /PORT LEDGER/.test(body), lines: (body.match(/RUN|STALL/g) ?? []).length, meters: (body.match(/[▮▯]{5}/g) ?? []).length, short: /SHORT|Short of/.test(body) };
});
console.log("deck:", JSON.stringify(deck));
await page.screenshot({ path: "/tmp/econ-deck.png" });
await browser.close();
const fails = [];
if (view.navLights < 3) fails.push("nav lights");
/* since 0.2.02 a shuttle label leads with its kind bracket, e.g. "[D]▹ IV DORY 28" */
if (!view.labels.some((l) => /^(\[D\])?▹ [A-Z]+ [A-Z]+ \d+/.test(l))) fails.push("named boat labels");
if (!deck.docked || !deck.ledger || deck.lines < 1 || deck.meters < 3) fails.push("deck ledger");
if (errors.length) fails.push("page errors " + errors.join(";"));
if (fails.length) { console.error("econ smoke FAILED:", fails.join(", ")); process.exit(1); }
console.log("econ smoke OK");
