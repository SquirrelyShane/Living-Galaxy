/* Headless smoke: the tutorial card is up on a fresh device, P-LOCK grabs a
 * belt rock, the cutter beam + chips render, and the beam dies in sections.
 *   node test/smoke-mining.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "MineSmoke");
await page.click("#btn-create");
/* step 2 is the career: pick mining if the card offers it */
await page.waitForTimeout(400);
await page.click("#create-next");
await page.waitForTimeout(400);
const pickedMining = await page.evaluate(() => {
  const b = [...document.querySelectorAll("#create-body button, #create-body [data-id]")].find((x) => /mining/i.test(x.textContent || "") || x.dataset.id === "mining");
  if (b) { b.click(); return true; }
  return false;
});
await page.waitForTimeout(300);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#create-next");
await page.waitForTimeout(400);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await page.waitForTimeout(2000);

const tut = await page.evaluate(() => {
  const el = document.getElementById("tutor");
  return { present: Boolean(el), hidden: el?.hidden, title: el?.querySelector("#tutor-title")?.textContent, text: el?.querySelector("#tutor-text")?.textContent };
});
console.log("tutorial:", JSON.stringify(tut));

const res = await page.evaluate(async () => {
  const { sim, togglePointerLock, clearLock } = await import("/js/sim.js");
  const { currentSystem } = await import("/js/bodies.js");
  const { nearbyRocks } = await import("/js/field.js");
  const { mining } = await import("/js/turrets.js");
  const { pilot } = await import("/js/pilot.js");
  const ship = sim.ship;
  /* into the belt, find a rock, sit 500 u off it and look at it */
  const belt = currentSystem.belt;
  ship.pos.x = (belt.inner + belt.outer) / 2; ship.pos.y = 0; ship.pos.z = 0;
  ship.vel.x = ship.vel.y = ship.vel.z = 0;
  const rocks = [...nearbyRocks(ship.pos, sim.time, 1)].filter((k) => k.r > 60 && k.r < 200).sort((a, b) => b.r - a.r);
  const r = rocks[0] ?? [...nearbyRocks(ship.pos, sim.time, 1)][0];
  ship.pos.x = r.x - (r.r + 420); ship.pos.y = r.y; ship.pos.z = r.z;
  ship.yaw = ship.aimYaw = -Math.PI / 2; ship.pitch = ship.aimPitch = 0; // nose +X
  await new Promise((f) => setTimeout(f, 200));
  const lock = togglePointerLock();
  ship.miningMode = "closest";
  ship.powered.mining = true;
  await new Promise((f) => setTimeout(f, 1800));
  const gl = window.__lgGL;
  const beamGroup = gl.scene.children.find((o) => o.isGroup && o.children.length === 8 && o.children[0].isMesh && o.children[0].geometry.type === "CylinderGeometry");
  const chipMesh = gl.scene.children.find((o) => o.isPoints && o.geometry.attributes.position.count === 160);
  const segsOn = beamGroup ? beamGroup.children.filter((c) => c.visible).length : -1;
  return {
    complex: pilot.complexId, defaultMode: ship.miningMode,
    lock: lock ? `${lock.kind}:${lock.name}` : null,
    active: mining.active, cut: mining.name, dist: Math.round(mining.dist ?? -1),
    beamVisible: Boolean(beamGroup?.visible), segsOn, chipsVisible: Boolean(chipMesh?.visible),
  };
});
console.log("cutting:", JSON.stringify(res));
await page.screenshot({ path: "/tmp/laser-on.png" });

/* Cut the cutter: the beam should break into sections and walk out, not blink.
 * The separation travels up the beam, so a single instant is a race — one
 * sample catches three lengths and the next catches two. Watch the whole
 * shutoff instead and judge it on what happened across it. */
const fade = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const gl = window.__lgGL;
  const find = () => gl.scene.children.find((o) => o.isGroup && o.children.length === 8 && o.children[0].isMesh && o.children[0].geometry.type === "CylinderGeometry");
  sim.ship.miningMode = "off";
  const samples = [];
  const seen = new Set();
  for (let i = 0; i < 12; i++) {
    await new Promise((f) => setTimeout(f, 140));
    const g = find();
    if (!g?.visible) { samples.push(null); continue; }
    const segs = g.children.map((c) => (c.visible ? +c.scale.z.toFixed(1) : 0));
    for (const v of segs) seen.add(v);
    samples.push(segs);
  }
  const live = samples.filter(Boolean);
  return {
    framesVisible: live.length,
    distinct: seen.size,
    widest: live.length ? live[0] : null,
    last: live.length ? live[live.length - 1] : null,
  };
});
console.log("fade over the shutoff:", JSON.stringify(fade));
await page.screenshot({ path: "/tmp/laser-fade.png" });
await page.waitForTimeout(2000);
const gone = await page.evaluate(() => {
  const gl = window.__lgGL;
  const beamGroup = gl.scene.children.find((o) => o.isGroup && o.children.length === 8 && o.children[0].isMesh && o.children[0].geometry.type === "CylinderGeometry");
  return beamGroup.visible;
});
console.log("beam after 2s:", gone);
await browser.close();

if (!res.active || !res.beamVisible || !res.chipsVisible) { console.error("FAIL: cutter not rendering"); process.exit(1); }
if (fade.framesVisible < 2) { console.error("FAIL: the beam blinked off instead of fading"); process.exit(1); }
if (fade.distinct < 3) { console.error(`FAIL: beam did not break into sections (${fade.distinct} distinct lengths over the shutoff)`); process.exit(1); }
if (gone) { console.error("FAIL: beam never vanished"); process.exit(1); }
if (!tut.present || tut.hidden) { console.error("FAIL: tutorial card missing"); process.exit(1); }
console.log("mining smoke OK");
