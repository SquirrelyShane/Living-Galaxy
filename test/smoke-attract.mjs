/* Headless smoke: the title screen composes a real shot, and gives it all
 * back when the game starts.
 *
 * The thing this guards is not "does it look nice" — it is that the attract
 * director cannot leak into play. It adds a nebula shell, one forged hull and
 * one light to the same scene the game flies through, so the moment the sim
 * launches every one of those has to be gone, the orbit lines have to be back,
 * and the camera has to be the game's own again.
 *
 *   node test/smoke-attract.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */

const pwPath = process.argv[2];
const { chromium } = await import(pwPath);

const errors = [];
const fail = (m) => { console.error("FAIL", m); errors.push(m); };

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });

/* The device heuristic would drop a headless VM to "low", which is a valid
 * state but not the one with anything in it to check. */
await page.addInitScript(() => { try { localStorage.setItem("lgaa.attract", "high"); } catch { /* private mode */ } });
await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.waitForTimeout(9000);

const menu = await page.evaluate(() => {
  const a = window.__lgAttract;
  const gl = window.__lgGL;
  const sky = gl.scene.children.find((o) => o.isMesh && o.renderOrder === -1000);
  const hull = gl.scene.children.find((o) => o.userData && o.userData.attract);
  const orbits = gl.worldRoot.children.filter((o) => o.userData && o.userData.orbit);
  /* Is the hero actually on screen, or is the camera pointed at nothing? */
  let heroNDC = null;
  const p = gl.planets?.[0];
  const big = (gl.planets ?? []).reduce((m, x) => (!m || x.radius > m.radius ? x : m), null);
  if (big) {
    const v = big.group.position.clone().project(gl.camera);
    heroNDC = [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(3)];
  }
  return {
    active: a?.active ?? false,
    hero: a?.hero ?? null,
    sky: Boolean(sky),
    skyLit: sky ? sky.material.color.r > 0.5 : false,
    hull: Boolean(hull),
    hullOnScreen: hull ? (() => { const v = hull.position.clone().project(gl.camera); return Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1; })() : false,
    orbitsHidden: orbits.length > 0 && orbits.every((o) => !o.visible),
    fov: +gl.camera.fov.toFixed(1),
    draws: gl.renderer.info.render.calls,
    heroNDC,
    _unused: Boolean(p),
  };
});
console.log("menu:", JSON.stringify(menu));

if (!menu.active) fail("the attract scene never came up");
if (!menu.hero) fail("no hero world was chosen");
if (!menu.sky) fail("no nebula behind the starfield");
if (!menu.skyLit) fail("the nebula never faded up");
if (!menu.hull) fail("no forged hull in the foreground");
if (!menu.hullOnScreen) fail("the hero hull is not in frame");
if (!menu.orbitsHidden) fail("orbit lines are still drawn across the shot");
if (menu.fov > 60) fail(`menu fov is still the old wide default (${menu.fov})`);

/* The composition must not put the hull behind the start card — that was the
 * bug the first pass shipped, and it is invisible to every other check. */
const card = await page.evaluate(() => {
  const gl = window.__lgGL;
  const hull = gl.scene.children.find((o) => o.userData && o.userData.attract);
  const el = document.querySelector(".start-card");
  const cv = gl.renderer.domElement.getBoundingClientRect();
  if (!hull || !el) return null;
  const r = el.getBoundingClientRect();
  const v = hull.position.clone().project(gl.camera);
  const x = cv.left + ((v.x + 1) / 2) * cv.width;
  const y = cv.top + ((1 - v.y) / 2) * cv.height;
  return { x: Math.round(x), y: Math.round(y), card: [r.left, r.top, r.right, r.bottom].map(Math.round) };
});
console.log("hull vs card:", JSON.stringify(card));
if (card) {
  const [l, t, r, b] = card.card;
  if (card.x > l && card.x < r && card.y > t && card.y < b) fail("the hero hull is behind the start card");
}

await page.screenshot({ path: "/tmp/attract-menu.png" });

/* ---- and now give it all back ------------------------------------------ */

await page.fill("#callsign", "AttractSmoke");
await page.click("#btn-create");
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await page.waitForTimeout(600);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await page.waitForTimeout(600);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await page.waitForTimeout(3000);

const playing = await page.evaluate(() => {
  const a = window.__lgAttract;
  const gl = window.__lgGL;
  const orbits = gl.worldRoot.children.filter((o) => o.userData && o.userData.orbit);
  return {
    active: a?.active ?? false,
    sky: Boolean(gl.scene.children.find((o) => o.isMesh && o.renderOrder === -1000)),
    hull: Boolean(gl.scene.children.find((o) => o.userData && o.userData.attract)),
    lights: gl.scene.children.filter((o) => o.isDirectionalLight).length,
    orbitsBack: orbits.length > 0 && orbits.every((o) => o.visible),
    fov: +gl.camera.fov.toFixed(1),
    draws: gl.renderer.info.render.calls,
  };
});
console.log("playing:", JSON.stringify(playing));

if (playing.active) fail("the attract scene still reports itself up in play");
if (playing.sky) fail("the nebula shell survived into play");
if (playing.hull) fail("the attract hull survived into play");
if (playing.lights > 1) fail(`the attract rim light survived into play (${playing.lights} directional lights)`);
if (!playing.orbitsBack) fail("orbit lines were not put back");
if (playing.fov < 55) fail(`the camera kept the menu fov into play (${playing.fov})`);

await page.screenshot({ path: "/tmp/attract-play.png" });
await browser.close();

if (errors.length) { console.error(`attract smoke FAILED (${errors.length})`); process.exit(1); }
console.log("attract smoke OK");
