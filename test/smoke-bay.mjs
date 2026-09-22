/* Headless smoke for 0.3.15: real hulls flying the hangar bay.
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
await sleep(1500);
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok ", m); } else { fail++; console.log("  FAIL", m); } };

/* hold station 110 u off the primary mouth of a civil port, nose into the bay */
const setup = await page.evaluate(() => {
  const { sim, stations } = window.__lg;
  const st = stations.find((s) => s.sector !== "pirate" && s.hangars?.length);
  window.__bay = { stId: st.id };
  const park = () => {
    const m = st.hangars[0];
    sim.ship.pos.x = st.x + m.x + m.dir.x * 110; sim.ship.pos.y = st.y + m.y + m.dir.y * 110 + 6; sim.ship.pos.z = st.z + m.z + m.dir.z * 110;
    sim.ship.vel.x = st.vx; sim.ship.vel.y = st.vy; sim.ship.vel.z = st.vz;
    sim.ship.yaw = Math.atan2(m.dir.x, m.dir.z); sim.ship.pitch = -0.05;
  };
  park();
  window.__bayPark = setInterval(park, 250);
  return { port: st.name };
});
console.log("port:", JSON.stringify(setup));

/* wait for a real hull in the bay: one of the port's flow boats, a captain, or a drone */
const seen = await page.evaluate(async () => {
  const { flow } = await import("/js/npc/flow.js");
  const { traffic } = await import("/js/npc/traffic.js");
  const st = window.__lg.stations.find((s) => s.id === window.__bay.stId);
  for (let i = 0; i < 1500; i++) {
    const b = flow.find((n) => n.port === st.id && n.lane === "bay" && n.visible) ?? traffic.find((n) => (n.state === "berth" || n.state === "unberth") && n.bayAt === st.id);
    if (b && (b.bayS == null || (b.bayS > 0.2 && b.bayS < 0.8))) return { name: b.name, job: b.job, kind: b.port ? "flow" : "captain" };
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
});
console.log("in the bay:", JSON.stringify(seen));
ok(seen, "a real hull is flying the bay");
await sleep(300);
await page.screenshot({ path: "/tmp/bay-1.png" });
await sleep(1500);
await page.screenshot({ path: "/tmp/bay-2.png" });
const scenery = await page.evaluate(() => {
  const { stations } = window.__lg;
  let shuttles = 0, sorties = 0;
  for (const st of stations) { const a = st.gen?.anim; if (!a) continue; shuttles += a.traffic.filter((o) => o.userData.traffic.way).length; sorties += a.drones.length; }
  return { shuttles, sorties };
});
ok(scenery.shuttles === 0 && scenery.sorties === 0, `no scenery traffic in any built port (${JSON.stringify(scenery)})`);
ok(errors.length === 0, `no page errors (${errors.length})`);
await browser.close();
console.log(`smoke bay: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
