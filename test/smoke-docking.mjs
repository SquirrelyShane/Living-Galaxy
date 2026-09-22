/* Headless smoke for the docking rework: in by the entry door, out by the exit
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

/* park 60 u off the primary mouth of the first civil port, station-relative rest */
const setup = await page.evaluate(() => {
  const { sim, stations } = window.__lg;
  const st = stations.find((s) => s.sector !== "pirate" && s.hangars?.length);
  const m = st.hangars[0];
  sim.ship.pos.x = st.x + m.x + m.dir.x * 60; sim.ship.pos.y = st.y + m.y + m.dir.y * 60; sim.ship.pos.z = st.z + m.z + m.dir.z * 60;
  sim.ship.vel.x = st.vx; sim.ship.vel.y = st.vy; sim.ship.vel.z = st.vz;
  sim.ship.yaw = Math.atan2(m.dir.x, m.dir.z); sim.ship.pitch = 0;
  window.__dock = { stId: st.id };
  return { port: st.name, hangars: st.hangars.length, w: +m.w.toFixed(1), d: +m.d.toFixed(1) };
});
console.log("port:", JSON.stringify(setup));
await page.evaluate(() => { window.__lg.sim.ui.lanesDrawn = true; });   // the rigs are a chart overlay now, off by default
await sleep(600);
await page.screenshot({ path: "/tmp/dock-0-mouth.png" });

/* the rig: visible this close, hidden 5 km+ off it */
const rig = await page.evaluate(() => {
  const { sim, stations } = window.__lg;
  const st = stations.find((s) => s.id === window.__dock.stId);
  const g = window.__lgGL.scene.children.find((c) => c.userData?.strings && c.userData?.colors);
  return { near: Boolean(g?.visible), beads: g?.userData.strings.length };
});
console.log("lane rig near:", JSON.stringify(rig));

/* DOCK: the pull, through the entry (port) half */
const pull = await page.evaluate(async () => {
  const { sim, stations, toggleDock } = window.__lg;
  const st = stations.find((s) => s.id === window.__dock.stId);
  const m = st.hangars[0];
  const took = toggleDock();
  const label0 = document.getElementById("op-dock-st").textContent;
  let inLat = null;
  for (let i = 0; i < 400 && !sim.ship.dockedAt; i++) {
    await new Promise((r) => setTimeout(r, 100));
    const px = sim.ship.pos.x - st.x - m.x, py = sim.ship.pos.y - st.y - m.y, pz = sim.ship.pos.z - st.z - m.z;
    const along = px * m.dir.x + py * m.dir.y + pz * m.dir.z, lat = px * m.side.x + py * m.side.y + pz * m.side.z;
    if (inLat == null && along < 0) inLat = lat;
  }
  return { took, label0, docked: sim.ship.dockedAt === st.id, inLat: inLat == null ? null : +inLat.toFixed(1), halfW: +(m.w / 2).toFixed(1), notice: sim.notice };
});
console.log("pull:", JSON.stringify(pull));
await sleep(400);
await page.screenshot({ path: "/tmp/dock-1-docked.png" });

/* UNDOCK: the push, out by the exit (starboard) half, DOCK ignored mid-push, release off the mouth on the exit lane */
const push = await page.evaluate(async () => {
  const { sim, stations, toggleDock } = window.__lg;
  const st = stations.find((s) => s.id === window.__dock.stId);
  const m = st.hangars[0];
  toggleDock();
  await new Promise((r) => setTimeout(r, 300));
  const label1 = document.getElementById("op-dock-st").textContent;
  const second = toggleDock();       // must not wave control off
  let outLat = null, wrong = false, t0 = performance.now(), phaseSeen = sim.tractor?.phase ?? null;
  for (let i = 0; i < 600; i++) {
    await new Promise((r) => setTimeout(r, 100));
    const px = sim.ship.pos.x - st.x - m.x, py = sim.ship.pos.y - st.y - m.y, pz = sim.ship.pos.z - st.z - m.z;
    const along = px * m.dir.x + py * m.dir.y + pz * m.dir.z, lat = px * m.side.x + py * m.side.y + pz * m.side.z;
    if (outLat == null && along > 0) outLat = lat;
    if (sim.lane?.wrong) wrong = true;
    if (/released the helm/.test(sim.notice ?? "")) break;
  }
  const dm = Math.hypot(st.x + m.x - sim.ship.pos.x, st.y + m.y - sim.ship.pos.y, st.z + m.z - sim.ship.pos.z);
  return { label1, secondTap: second, outLat: outLat == null ? null : +outLat.toFixed(1), wrong, released: /released the helm/.test(sim.notice ?? ""), offMouth: +dm.toFixed(0), lane: sim.lane && { which: sim.lane.which, wrong: sim.lane.wrong }, secs: +((performance.now() - t0) / 1000).toFixed(1) };
});
console.log("push:", JSON.stringify(push));
await page.screenshot({ path: "/tmp/dock-2-released.png" });

/* hands off for 25 s: assist stops the hull out there; no lock, no lane hail, DOCK files a berth instead of locking */
const after = await page.evaluate(async () => {
  const { sim, stations, toggleDock } = window.__lg;
  const st = stations.find((s) => s.id === window.__dock.stId);
  const m = st.hangars[0];
  let hail = false, calls = 0;
  for (let i = 0; i < 250; i++) {
    await new Promise((r) => setTimeout(r, 100));
    if (sim.approach) hail = true;
    if (document.querySelector("#call-ui:not(.hidden), .call-card:not(.hidden)")) calls++;
  }
  const dm = Math.hypot(st.x + m.x - sim.ship.pos.x, st.y + m.y - sim.ship.pos.y, st.z + m.z - sim.ship.pos.z);
  const rel = Math.hypot(sim.ship.vel.x - st.vx, sim.ship.vel.y - st.vy, sim.ship.vel.z - st.vz);
  const label = document.getElementById("op-dock-st").textContent;
  const took = toggleDock();
  await new Promise((r) => setTimeout(r, 300));
  return { docked: Boolean(sim.ship.dockedAt), hail, calls, offMouth: +dm.toFixed(0), rel: +rel.toFixed(1), label, dockTap: took, lockedByTap: Boolean(window.__lg.stationStatus()?.tractor), notice: sim.notice };
});
console.log("after:", JSON.stringify(after));
await page.screenshot({ path: "/tmp/dock-3-after.png" });

/* 5 km+ off the lane: the rig is not drawn */
const far = await page.evaluate(async () => {
  const { sim, stations } = window.__lg;
  const st = stations.find((s) => s.id === window.__dock.stId);
  const m = st.hangars[0];
  sim.ship.pos.x = st.x + m.x - m.dir.x * 1800; sim.ship.pos.y = st.y + m.y - m.dir.y * 1800; sim.ship.pos.z = st.z + m.z - m.dir.z * 1800;
  sim.ship.vel.x = st.vx; sim.ship.vel.y = st.vy; sim.ship.vel.z = st.vz;
  await new Promise((r) => setTimeout(r, 400));
  const g = window.__lgGL.scene.children.find((c) => c.userData?.strings && c.userData?.colors);
  return { farVisible: Boolean(g?.visible) };
});
console.log("rig far:", JSON.stringify(far));

const fails = [];
if (!pull.took || !pull.docked) fails.push("pull docks");
if (pull.inLat == null || pull.inLat > -0.1 * pull.halfW) fails.push("pull by the entry half");
if (push.secondTap !== false || push.label1 !== "DEPART") fails.push("DOCK mid-push ignored / label");
if (push.outLat == null || push.outLat < 0.1 * pull.halfW) fails.push("push by the exit half");
if (push.wrong) fails.push("wrong-way during push");
if (!push.released || push.offMouth < 250 || push.lane?.which !== "exit") fails.push("release off the mouth on the exit lane");
if (after.docked || after.hail || after.lockedByTap) fails.push("re-dock / hail / tap-lock on the way out");
if (!rig.near || far.farVisible) fails.push("lane rig draw radius");
if (errors.length) fails.push(`page errors: ${errors.join("; ")}`);
await browser.close();
if (fails.length) { console.error("docking smoke FAILED:", fails.join(", ")); process.exit(1); }
console.log("docking smoke OK");
