/* Headless smoke: strike a world hard, verify the mesh is actually deformed
 * (not a perfect sphere any more) and grab a portrait screenshot to eyeball.
 * Run with the server on :8124 —
 *   node test/smoke-craters.mjs "$(npm root -g)/playwright/index.mjs"
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "CraterSmoke");
await page.click("#btn-create");
for (let i = 0; i < 3; i++) {
  await page.waitForTimeout(400);
  await page.click("#create-next");
}
await page.waitForTimeout(400);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await page.waitForTimeout(2500);

const out = await page.evaluate(async () => {
  const { sim, strikeBody } = await import("/js/sim.js");
  const { BODIES, bodyPosition } = await import("/js/bodies.js");
  const world = BODIES.find((b) => b.kind !== "star" && b.kind !== "gas" && !b.shattered);
  /* one bite facing the camera, one on the limb so the silhouette shows it */
  strikeBody(world.id, world.radius * 0.55, 1100, { nx: 0, ny: 0, nz: 1 });
  strikeBody(world.id, world.radius * 0.4, 1000, { nx: 1, ny: 0.15, nz: 0.2 });
  /* park the nose on it */
  const p = { x: 0, y: 0, z: 0 };
  bodyPosition(world.id, sim.time, p);
  sim.ship.pos.x = p.x; sim.ship.pos.y = p.y; sim.ship.pos.z = p.z + world.radius * 3.4;
  sim.ship.vel.x = sim.ship.vel.y = sim.ship.vel.z = 0;
  sim.ship.yaw = sim.ship.aimYaw = 0;
  sim.ship.pitch = sim.ship.aimPitch = 0;
  await new Promise((r) => setTimeout(r, 1200));
  /* measure the mesh: radius spread across deformed vertices */
  const gl = window.__lgGL;
  const pl = gl.planets.find((x) => x.id === world.id);
  const mesh = pl.group.children.find((c) => c.isMesh && c.userData.bodyId === world.id);
  const pos = mesh.geometry.attributes.position;
  let min = Infinity, max = 0;
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getY(i), pos.getZ(i));
    if (r < min) min = r;
    if (r > max) max = r;
  }
  return {
    world: world.name,
    craters: world.craters.map((c) => ({ depth: c.depth, r: Math.round(c.r) })),
    radius: Math.round(world.radius),
    vertexMin: Math.round(min),
    vertexMax: Math.round(max),
    spreadPct: Math.round(((max - min) / world.radius) * 100),
    vertexColors: Boolean(mesh.material.vertexColors),
    segments: pos.count,
  };
});

console.log(JSON.stringify(out, null, 2));
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/crater.png" });

/* shatter a moon and make sure the remnant core rebuilds as a jagged shard */
const shard = await page.evaluate(async () => {
  const { sim, strikeBody } = await import("/js/sim.js");
  const { BODIES } = await import("/js/bodies.js");
  const moon = BODIES.find((b) => b.kind !== "star" && b.kind !== "gas" && !b.shattered && b.radius < 2000 && !b.craters?.length);
  for (let i = 0; i < 14 && !moon.shattered; i++) strikeBody(moon.id, moon.radius * 0.8, 1400);
  await new Promise((r) => setTimeout(r, 1200));
  const gl = window.__lgGL;
  const pl = gl.planets.find((x) => x.id === moon.id);
  const mesh = pl?.group.children.find((c) => c.isMesh && c.userData.bodyId === moon.id);
  if (!mesh) return { shattered: moon.shattered, mesh: false };
  const pos = mesh.geometry.attributes.position;
  let min = Infinity, max = 0;
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getY(i), pos.getZ(i));
    if (r < min) min = r;
    if (r > max) max = r;
  }
  return { world: moon.name, shattered: moon.shattered, mesh: true, flat: Boolean(mesh.material.flatShading), corePct: Math.round(((max - min) / moon.radius) * 100) };
});
console.log(JSON.stringify(shard));
await browser.close();
if (shard.shattered && (!shard.mesh || shard.corePct < 5)) {
  console.error("FAIL: shattered core still a sphere");
  process.exit(1);
}
if (out.spreadPct < 10) {
  console.error("FAIL: sphere barely deformed");
  process.exit(1);
}
console.log("crater smoke OK");
