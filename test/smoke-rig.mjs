/* Headless smoke, 0.3.87: the salvage rig in the sky you can see. A hulk is
 * left 200 u off the nose and the quick CUT switch is tapped: with a hulk in
 * reach it must run the rig (not the mining laser), the switch must say so,
 * the arc and its flash must draw, plate must come aboard through the tractor,
 * a second tap must stow it and take the arc away — and with no hulk about the
 * same switch must go back to being the mining laser. No page error anywhere.
 *   node test/smoke-rig.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "RigSmoke");
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

const setup = await page.evaluate(async () => {
  const { sim, acquireLock, clearLock, setMiningMode } = await import("/js/sim/sim.js");
  const { spawnHulk, hulkManifest } = await import("/js/world/hulks.js");
  const { forwardOf } = await import("/js/flight/ship.js");
  document.getElementById("tutor")?.remove();
  const ship = sim.ship;
  const f = forwardOf(ship.yaw, ship.pitch);
  const h = spawnHulk({ id: "smoke:rig", name: "Rig Test", ship: "general_b", cargo: { id: "water", qty: 20 }, x: ship.pos.x + f.x * 200, y: ship.pos.y + f.y * 200, z: ship.pos.z + f.z * 200 }, { source: "smoke", intact: 1 });
  setMiningMode("off", { quiet: true });
  ship.salvage = true;
  ship.cargoCap = Math.max(ship.cargoCap, 2000);
  clearLock();
  acquireLock({ kind: "hulk", id: h.id });
  const sw = document.getElementById("sw-cut");
  return { before: { rig: ship.rigMode, miner: ship.miningMode, nm: sw?.querySelector(".nm")?.textContent, st: sw?.querySelector(".st")?.textContent }, manifest: hulkManifest(h).plate };
});
console.log("setup:", JSON.stringify(setup));

await page.click("#sw-cut");
await page.waitForTimeout(1200);
const on = await page.evaluate(async () => {
  const { sim } = await import("/js/sim/sim.js");
  const { rig } = await import("/js/flight/rig.js");
  const gl = window.__lgGL;
  const beam = gl.scene.children.find((c) => c.isMesh && c.geometry?.type === "CylinderGeometry" && c.children.length === 1 && c.children[0].isMesh);
  const at = (c) => Math.hypot(c.position.x - (rig.x - gl.origin.x), c.position.y - (rig.y - gl.origin.y), c.position.z - (rig.z - gl.origin.z));
  const flash = gl.scene.children.find((c) => c.isSprite && c.visible && at(c) < 1 && c.material.color.getHex() === 0xbfe9ff);
  const sw = document.getElementById("sw-cut");
  return { rig: sim.ship.rigMode, miner: sim.ship.miningMode, active: rig.active, section: rig.section, beam: Boolean(beam?.visible), beamLen: beam ? +beam.scale.z.toFixed(1) : 0, beamHex: beam?.material.color.getHexString(), flash: Boolean(flash), nm: sw.querySelector(".nm").textContent, st: sw.querySelector(".st").textContent, lit: sw.classList.contains("on"), drawRig: sim.ship.draws?.rig };
});
console.log("rig on:", JSON.stringify(on));
await page.screenshot({ path: process.env.SHOT ?? "/tmp/rig.png" });

const haul = await page.evaluate(async () => {
  const { sim } = await import("/js/sim/sim.js");
  const { chunks } = await import("/js/world/debris.js");
  const wait = (ms) => new Promise((f) => setTimeout(f, ms));
  let shed = 0;
  for (let i = 0; i < 80 && !((sim.ship.hold.steel ?? 0) > 0); i++) { await wait(250); shed = Math.max(shed, chunks.filter((c) => c.salvage).length); }
  return { steel: +(sim.ship.hold.steel ?? 0).toFixed(2), shedSeen: shed };
});
console.log("haul:", JSON.stringify(haul));

await page.click("#sw-cut");
await page.waitForTimeout(900);
const off = await page.evaluate(async () => {
  const { sim } = await import("/js/sim/sim.js");
  const { rig } = await import("/js/flight/rig.js");
  const { resetHulks } = await import("/js/world/hulks.js");
  const gl = window.__lgGL;
  const beam = gl.scene.children.find((c) => c.isMesh && c.geometry?.type === "CylinderGeometry" && c.children.length === 1 && c.children[0].isMesh);
  const sw = document.getElementById("sw-cut");
  const out = { rig: sim.ship.rigMode, active: rig.active, beam: Boolean(beam?.visible), nm: sw.querySelector(".nm").textContent, st: sw.querySelector(".st").textContent };
  resetHulks();
  return out;
});
console.log("rig off:", JSON.stringify(off));

await page.waitForTimeout(400);
await page.click("#sw-cut");
await page.waitForTimeout(500);
const miner = await page.evaluate(async () => {
  const { sim, setMiningMode } = await import("/js/sim/sim.js");
  const sw = document.getElementById("sw-cut");
  const out = { rig: sim.ship.rigMode, miner: sim.ship.miningMode, nm: sw.querySelector(".nm").textContent, st: sw.querySelector(".st").textContent };
  setMiningMode("off");
  return out;
});
console.log("no hulk:", JSON.stringify(miner));
await browser.close();

const bad = [];
if (on.rig !== "strip" || on.miner !== "off") bad.push(`the quick switch did not run the rig with a hulk in reach (rig ${on.rig}, miner ${on.miner})`);
if (!on.active) bad.push("the rig is on but not cutting");
if (!on.beam || !(on.beamLen > 50)) bad.push("no arc drawn to the hulk");
if (!on.flash) bad.push("no flash at the cut");
if (on.nm !== "RIG" || !/STRIP/.test(on.st) || !on.lit) bad.push(`the switch does not read as the rig ("${on.nm} ${on.st}")`);
if (!(haul.steel > 0)) bad.push("no plate came aboard");
if (off.rig !== "off" || off.active || off.beam) bad.push("a second tap did not stow the rig and take the arc away");
if (off.nm !== "CUT") bad.push(`the switch did not go back to CUT ("${off.nm}")`);
if (miner.miner === "off" || miner.rig !== "off" || miner.nm !== "CUT") bad.push(`with no hulk about the switch is not the mining laser (miner ${miner.miner}, rig ${miner.rig})`);
if (errors.length) bad.push(`${errors.length} page error(s)`);
if (bad.length) { for (const b of bad) console.error("FAIL:", b); process.exit(1); }
console.log("rig smoke OK");
