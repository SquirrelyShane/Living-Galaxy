/* Headless smoke: run a staged cataclysm and a supernova in a real browser,
 * verify the FX rig, the ring and the sky lighting are actually there, and
 * grab screenshots to eyeball. Run with the server on :8124 —
 *   node test/smoke-cataclysm.mjs "$(npm root -g)/playwright/index.mjs"
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "CataSmoke");
await page.click("#btn-create");
for (let i = 0; i < 3; i++) { await page.waitForTimeout(400); await page.click("#create-next"); }
await page.waitForTimeout(400);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await page.waitForTimeout(2500);

/* --- a world takes a world-ending hit while you watch --- */
const cata = await page.evaluate(async () => {
  const { sim, strikeBody } = await import("/js/sim.js");
  const { bodyById, surveyIds } = await import("/js/bodies.js");
  const live = () => surveyIds().map(bodyById);
  const world = live().find((b) => b.kind !== "star" && b.kind !== "gas" && !b.shattered && b.radius > 500);
  const p = { x: 0, y: 0, z: 0 };
  const { bodyPosition } = await import("/js/bodies.js");
  bodyPosition(world.id, sim.time, p);
  /* ringside, looking at it */
  sim.ship.pos.x = p.x; sim.ship.pos.y = p.y; sim.ship.pos.z = p.z + world.radius * 7;
  sim.ship.vel.x = sim.ship.vel.y = sim.ship.vel.z = 0;
  sim.ship.yaw = sim.ship.aimYaw = 0;
  sim.ship.pitch = sim.ship.aimPitch = 0;
  strikeBody(world.id, world.radius * 0.62, 1400, { nx: 0, ny: 0.15, nz: 1 });
  await new Promise((r) => setTimeout(r, 700));
  const ev = sim.events[0];
  return {
    world: world.name,
    events: sim.events.length,
    phase: ev?.phase,
    kelvin: Math.round(ev?.kelvin ?? 0),
    lum: +(ev?.lum ?? 0).toFixed(3),
    skyGlow: sim.skyGlow.length,
    skyLift: +(sim.skyLift ?? 0).toFixed(3),
    exposure: +window.__lgGL.renderer.toneMappingExposure.toFixed(3),
  };
});
console.log("cataclysm:", JSON.stringify(cata));
await page.screenshot({ path: "/tmp/cata-contact.png" });

/* --- and it is still visible behind you --- */
const behind = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  sim.ship.yaw = sim.ship.aimYaw = Math.PI / 2;   // swing it onto the beam
  await new Promise((r) => setTimeout(r, 500));
  const beam = sim.glare ? { x: +sim.glare.x.toFixed(1), y: +sim.glare.y.toFixed(1), lum: +sim.glare.lum.toFixed(3) } : null;
  sim.ship.yaw = sim.ship.aimYaw = Math.PI;       // now turn your back on it
  await new Promise((r) => setTimeout(r, 500));
  const gl = window.__lgGL;
  const lit = gl.scene.children.filter((c) => c.isPointLight && c.visible && c.intensity > 0);
  return {
    lights: lit.length,
    brightest: +(lit[0]?.intensity ?? 0).toFixed(2),
    exposure: +gl.renderer.toneMappingExposure.toFixed(3),
    skyLift: +(sim.skyLift ?? 0).toFixed(3),
    beamGlare: beam,
    asternGlare: sim.glare ? { x: +sim.glare.x.toFixed(1), y: +sim.glare.y.toFixed(1), lum: +sim.glare.lum.toFixed(3) } : null,
    glareOpacity: document.getElementById("sky-glare").style.opacity,
  };
});
console.log("behind you:", JSON.stringify(behind));
await page.screenshot({ path: "/tmp/cata-behind.png" });

/* --- the ring lays down and settles --- */
const ring = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { chunks } = await import("/js/debris.js");
  const { bodyById, surveyIds } = await import("/js/bodies.js");
  const live = () => surveyIds().map(bodyById);
  const ev = sim.events[0];
  const t0 = performance.now();
  while (performance.now() - t0 < 22000 && !ev.ringed) await new Promise((r) => setTimeout(r, 200));
  const b = bodyById(ev.bodyId);
  const mine = chunks.filter((c) => c.parent === b.id);
  return {
    ringed: Boolean(ev.ringed),
    ring: b.ring ? { inner: Math.round(b.ring.inner), outer: Math.round(b.ring.outer), settle: +b.ring.settle.toFixed(2) } : null,
    chunks: mine.length,
    molten: +(b.moltenGlow ?? 0).toFixed(2),
    craterDepth: +(b.craters?.[b.craters.length - 1]?.depth ?? 0).toFixed(3),
    craterBorn: +(b.craters?.[b.craters.length - 1]?.depth0 ?? 0).toFixed(3),
    worlds: live().length,
  };
});
console.log("ring:", JSON.stringify(ring));
await page.screenshot({ path: "/tmp/cata-ring.png" });

/* look back at what is left of it */
await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { bodyById, bodyPosition } = await import("/js/bodies.js");
  const ev = sim.events[0];
  const b = bodyById(ev.bodyId);
  const p = { x: 0, y: 0, z: 0 };
  bodyPosition(b.id, sim.time, p);
  sim.ship.pos.x = p.x; sim.ship.pos.y = p.y + b.radius * 3.2; sim.ship.pos.z = p.z + b.radius * 16;
  sim.ship.vel.x = sim.ship.vel.y = sim.ship.vel.z = 0;
  sim.ship.yaw = sim.ship.aimYaw = 0;
  sim.ship.pitch = sim.ship.aimPitch = -0.2;
  await new Promise((r) => setTimeout(r, 900));
});
await page.screenshot({ path: "/tmp/cata-aftermath.png" });

/* --- the star stops being one --- */
const nova = await page.evaluate(async () => {
  const { sim, goSupernova } = await import("/js/sim.js");
  const { bodyById, surveyIds, starBody } = await import("/js/bodies.js");
  const star = starBody();
  const p = { x: 0, y: 0, z: 0 };
  const { bodyPosition } = await import("/js/bodies.js");
  bodyPosition(star.id, sim.time, p);
  sim.ship.pos.x = p.x + star.radius * 26; sim.ship.pos.y = p.y; sim.ship.pos.z = p.z;
  sim.ship.yaw = sim.ship.aimYaw = -Math.PI / 2;
  sim.ship.pitch = sim.ship.aimPitch = 0;
  goSupernova(star.id);
  await new Promise((r) => setTimeout(r, 900));
  const ev = sim.events.find((e) => e.kind === "supernova");
  const gl = window.__lgGL;
  return {
    phase: ev?.phase,
    kelvin: Math.round(ev?.kelvin ?? 0),
    lum: +(ev?.lum ?? 0).toFixed(2),
    skyLift: +(sim.skyLift ?? 0).toFixed(3),
    exposure: +gl.renderer.toneMappingExposure.toFixed(3),
  };
});
console.log("supernova:", JSON.stringify(nova));
await page.screenshot({ path: "/tmp/nova-breakout.png" });
await page.waitForTimeout(3000);
await page.screenshot({ path: "/tmp/nova-plateau.png" });

await browser.close();

const bad = [];
if (errors.length) bad.push(`page errors: ${errors.join(" | ")}`);
if (cata.events !== 1) bad.push("no staged event");
if (cata.skyGlow < 1 || cata.skyLift <= 0) bad.push("the sky did not light");
if (behind.lights < 1) bad.push("no light behind the pilot");
if (!behind.beamGlare || Math.abs(behind.beamGlare.x - 50) < 8) bad.push("no directional glare when the event is off the beam");
if (!behind.asternGlare || behind.asternGlare.lum <= 0) bad.push("nothing reads when the event is astern");
if (!(Number(behind.glareOpacity) > 0.02)) bad.push("the canopy glare layer is not lit");
if (!ring.ringed || !ring.ring) bad.push("no ring formed");
if (!(ring.craterDepth < ring.craterBorn)) bad.push("craters did not slump — a hit world stays spiky");
if (!nova.phase) bad.push("no supernova");
if (bad.length) { console.error("cataclysm smoke FAILED:", bad.join("; ")); process.exit(1); }
console.log("cataclysm smoke OK");
