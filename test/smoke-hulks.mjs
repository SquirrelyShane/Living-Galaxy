/* Headless smoke, 0.3.86: a hulk is in the sky you can see. One is left 260 u
 * off the nose; it must draw as a dead hull (no plume), tumble, strobe its
 * recorder beacon, take a P-LOCK, answer SCAN with its manifest, and leave the
 * scene when it is removed — with no page error anywhere in that.
 *   node test/smoke-hulks.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "HulkSmoke");
await page.click("#btn-create");
await page.waitForTimeout(400);
await page.click("#create-next");
await page.waitForTimeout(400);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#create-next");
await page.waitForTimeout(400);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await page.waitForTimeout(2000);

const res = await page.evaluate(async () => {
  const { sim, acquireLock, clearLock, requestScan } = await import("/js/sim/sim.js");
  const { hulks, spawnHulk, removeHulk, hulkManifest } = await import("/js/world/hulks.js");
  const { forwardOf } = await import("/js/flight/ship.js");
  const wait = (ms) => new Promise((f) => setTimeout(f, ms));
  const gl = window.__lgGL;
  const ship = sim.ship;
  const at = (c, h) => Math.hypot(c.position.x - (h.x - gl.origin.x), c.position.y - (h.y - gl.origin.y), c.position.z - (h.z - gl.origin.z));
  const f = forwardOf(ship.yaw, ship.pitch);
  const start = hulks.length;
  const h = spawnHulk({ id: "smoke:hull", name: "Smoke Test", ship: "general_c", role: "hauler", cargo: { id: "water", qty: 40 }, x: ship.pos.x + f.x * 260, y: ship.pos.y + f.y * 260, z: ship.pos.z + f.z * 260 }, { source: "smoke" });
  await wait(1500);
  const mesh = gl.scene.children.find((c) => c.isGroup && c.visible && at(c, h) < 2);
  const beacon = gl.scene.children.find((c) => c.isSprite && at(c, h) < 2);
  let meshes = 0, plumesLit = 0;
  mesh?.traverse((o) => { if (o.isMesh) meshes++; if (o.userData?.plume && o.visible) plumesLit++; });
  const q0 = mesh ? mesh.quaternion.toArray() : null;
  await wait(1200);
  const q1 = mesh ? mesh.quaternion.toArray() : null;
  const turned = q0 && q1 ? Math.max(...q0.map((v, i) => Math.abs(v - q1[i]))) : 0;

  clearLock();
  acquireLock({ kind: "hulk", id: h.id });
  await wait(400);
  const lock = { kind: sim.lock.kind, id: sim.lock.id, name: sim.lock.name };
  sim.notice = "";
  requestScan();
  await wait(400);
  const notice = String(sim.notice);
  const manifest = hulkManifest(h);

  removeHulk(h);
  await wait(600);
  const meshGone = !gl.scene.children.some((c) => c === mesh);
  const beaconGone = !gl.scene.children.some((c) => c === beacon);
  return {
    docked: ship.dockedAt ?? null, start, sections: h.sections.length, manifest: { plate: manifest.plate, parts: manifest.partCount, value: manifest.value },
    drawn: Boolean(mesh), meshes, plumesLit, beacon: Boolean(beacon), turned: +turned.toFixed(5),
    lock, notice: notice.slice(0, 140), meshGone, beaconGone, lockAfter: sim.lock.id, left: hulks.length,
  };
});
console.log("hulk:", JSON.stringify(res));
await page.screenshot({ path: process.env.SHOT ?? "/tmp/hulk.png" });
await browser.close();

const bad = [];
if (!res.drawn || res.meshes < 1) bad.push("the hulk did not draw");
if (res.plumesLit) bad.push("a dead hull still has its plume lit");
if (!res.beacon) bad.push("no recorder beacon");
if (!(res.turned > 0)) bad.push("the hulk is not tumbling");
if (res.lock.kind !== "hulk" || res.lock.id == null) bad.push("P-LOCK did not take the hulk");
if (!/Hulk assay/.test(res.notice)) bad.push(`SCAN did not read the hulk ("${res.notice}")`);
if (!res.meshGone || !res.beaconGone) bad.push("a removed hulk stayed in the scene");
if (res.lockAfter) bad.push("the lock outlived the hulk");
if (errors.length) bad.push(`${errors.length} page error(s)`);
if (bad.length) { for (const b of bad) console.error("FAIL:", b); process.exit(1); }
console.log("hulks smoke OK");
