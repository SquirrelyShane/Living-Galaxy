/* Headless smoke: rocks break the way the asteroid generator breaks them.
 *
 * What it measures, rather than that it ran:
 *   - a rogue that strikes a world in view starts an impact run, and the
 *     renderer draws it: the rock's own body cut into chunks, the chunks the
 *     run detached, the blast sprites and ejecta rocks, the flash
 *   - the run's pieces are debris chunks held by the run, and the debris mesh
 *     does not draw the rock's own pieces twice while the run holds them
 *   - when the run ends the view is let go and the chunks are ordinary debris
 *   - two rogues that meet run a collision with BOTH bodies drawn
 *   - a belt rock cut out goes up as a shatter field from its own body
 *   - no page errors, no GL errors
 *
 *   node test/smoke-impact.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
page.setDefaultTimeout(120000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { const t = m.text(); if (/GL_INVALID|Shader Error|WebGL: INVALID/.test(t)) errors.push(t.slice(0, 200)); });
let fail = 0;
const ok = (c, m) => { if (c) console.log("  ok ", m); else { fail++; console.error("  FAIL", m); } };
/* page.waitForFunction treats an async predicate's promise as truthy, so poll by hand */
async function until(pred, ms = 60000, every = 400) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await page.evaluate(pred).catch(() => false)) return true;
    await page.waitForTimeout(every);
  }
  return false;
}

await page.addInitScript(() => { try { localStorage.setItem("lgaa.rocks", "full"); } catch {} });
await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "ImpactSmoke");
await page.click("#btn-create");
for (let i = 0; i < 4; i++) { await page.waitForTimeout(350); await page.click("#create-next").catch(() => {}); }
await page.waitForTimeout(400);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await page.waitForTimeout(1500);

/* ---- a rock on Earth ---- */
await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { bodyPosition, bodyVelocity, bodyById } = await import("/js/bodies.js");
  const { impactors } = await import("/js/impactors.js");
  const earth = bodyById("earth");
  const p = bodyPosition("earth", sim.time, { x: 0, y: 0, z: 0 }), v = bodyVelocity("earth", sim.time, { x: 0, y: 0, z: 0 });
  const hit = { x: p.x + earth.radius, y: p.y, z: p.z };
  sim.ship.pos.x = hit.x + 5200; sim.ship.pos.y = hit.y + 1400; sim.ship.pos.z = hit.z + 7200;
  sim.ship.vel.x = v.x; sim.ship.vel.y = v.y; sim.ship.vel.z = v.z;
  const dx = hit.x - sim.ship.pos.x, dy = hit.y - sim.ship.pos.y, dz = hit.z - sim.ship.pos.z;
  sim.ship.yaw = sim.ship.aimYaw = Math.atan2(-dx, -dz);
  sim.ship.pitch = sim.ship.aimPitch = Math.atan2(dy, Math.hypot(dx, dz));
  sim.ship.engines = false; sim.ship.throttle = 0;
  impactors.length = 0;
  impactors.push({ id: "impSmoke", name: "Smoke Anvil", r: 700, x: hit.x + 4200, y: hit.y + 300, z: hit.z - 900, vx: v.x - 1100, vy: v.y, vz: v.z + 160, seed: 0.15, spin: 0.1, born: sim.time, deflected: 0 });
});
await until(async () => (await import("/js/impacts.js")).runs.length > 0, 60000);
await page.waitForTimeout(2500);
const strike = await page.evaluate(async () => {
  const { runs } = await import("/js/impacts.js");
  const { chunks } = await import("/js/debris.js");
  const gl = window.__lgGL;
  const run = runs[0];
  const view = gl.impactFx.views.get(run.id);
  const rk = view?.rocks[0];
  let detached = 0;
  if (rk) for (let k = 0; k < 32; k++) if (rk.uniforms.uChunkA.value[k * 4 + 3] >= 0) detached++;
  const held = chunks.filter((c) => c.driven && c.run === run.id);
  return {
    kind: run.kind, age: run.age, pieces: run.sim.pieces.length, events: run.sim.events.length,
    view: Boolean(view), meshVisible: rk?.mesh.visible, detached, dust: view?.dust.count ?? 0, rocks: view?.rockBuf.counts.reduce((a, b) => a + b, 0) ?? 0,
    held: held.length, fracturedHeld: held.filter((c) => c.fractured != null).length,
  };
});
console.log("strike:", JSON.stringify(strike));
ok(strike.kind === "strike" && strike.view, "the strike runs and the renderer has a view of it");
ok(strike.meshVisible && strike.detached >= 6, `the rock's own body is drawn cut into detached chunks (${strike.detached})`);
ok(strike.dust > 500 && strike.rocks > 50, `with a blast: ${strike.dust} dust sprites, ${strike.rocks} ejecta rocks`);
ok(strike.held > 10 && strike.fracturedHeld > 0, `its pieces are debris chunks held by the run (${strike.held}, ${strike.fracturedHeld} of them the rock's own)`);
await page.screenshot({ path: "_scratch/impact-smoke.png" });

/* let the run finish and the view go */
await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  sim.timeScale = 8;
});
await until(async () => (await import("/js/impacts.js")).runs.length === 0, 90000);
await page.waitForTimeout(3000);
const after = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  sim.timeScale = 1;
  const { chunks } = await import("/js/debris.js");
  return { held: chunks.filter((c) => c.driven).length, chunks: chunks.length, views: window.__lgGL.impactFx.views.size };
});
console.log("after:", JSON.stringify(after));
ok(after.held === 0, "when the run ends every chunk is let go");
await until(() => window.__lgGL.impactFx.views.size === 0, 60000);
ok(await page.evaluate(() => window.__lgGL.impactFx.views.size === 0), "and the view is disposed once its ejecta has faded");

/* ---- rock on rock ---- */
await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { impactors } = await import("/js/impactors.js");
  const base = { x: sim.ship.pos.x + 60000, y: sim.ship.pos.y + 20000, z: sim.ship.pos.z };
  impactors.length = 0;
  impactors.push({ id: "impL", name: "Left Rock", r: 650, x: base.x - 2500, y: base.y, z: base.z, vx: sim.ship.vel.x + 750, vy: sim.ship.vel.y, vz: sim.ship.vel.z, seed: 0.3, spin: 0.1, born: sim.time - 9, deflected: 0 });
  impactors.push({ id: "impR", name: "Right Rock", r: 480, x: base.x + 2500, y: base.y + 150, z: base.z, vx: sim.ship.vel.x - 850, vy: sim.ship.vel.y, vz: sim.ship.vel.z, seed: 0.6, spin: 0.1, born: sim.time - 9, deflected: 0 });
});
await until(async () => (await import("/js/impacts.js")).runs.some((r) => r.kind === "collision"), 60000);
await page.waitForTimeout(1500);
const coll = await page.evaluate(async () => {
  const { runs } = await import("/js/impacts.js");
  const run = runs.find((r) => r.kind === "collision");
  const view = window.__lgGL.impactFx.views.get(run.id);
  return { rocks: view?.rocks.length ?? 0, visible: view?.rocks.every((r) => r.mesh.visible) ?? false, parts: run.plan.bodies.map((b) => b.detached.length) };
});
console.log("collision:", JSON.stringify(coll));
ok(coll.rocks === 2 && coll.visible, "two rogues that meet are both drawn breaking");
ok(coll.parts.every((n) => n > 0), `and both break (${coll.parts.join(" / ")} chunks)`);

/* ---- a belt rock cut out ---- */
const shatter = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { currentSystem } = await import("/js/bodies.js");
  const { nearbyRocks, wearRock } = await import("/js/field.js");
  const { impactors } = await import("/js/impactors.js");
  impactors.length = 0;
  const belt = currentSystem.belt ?? currentSystem.outerBelt;
  const mid = (belt.inner + belt.outer) / 2;
  sim.ship.pos.x = mid; sim.ship.pos.y = 0; sim.ship.pos.z = 0;
  sim.ship.vel.x = sim.ship.vel.y = sim.ship.vel.z = 0;
  const gl = window.__lgGL;
  const deadline = performance.now() + 20000;
  let rec = null;
  while (performance.now() < deadline) {
    await new Promise((r) => setTimeout(r, 400));
    rec = [...gl.bodies.values()].find((b) => b.group.visible && b.rock);
    if (rec) break;
  }
  if (!rec) return { grown: 0 };
  const key = rec.rock.key;
  wearRock(key, 1);
  await new Promise((r) => setTimeout(r, 1200));
  const s = gl.rockFx.shatters[gl.rockFx.shatters.length - 1];
  let instances = 0;
  s?.field.traverse((o) => { if (o.isInstancedMesh) instances += o.count; });
  return { grown: gl.bodies.size, gone: !gl.bodies.has(key), shatters: gl.rockFx.shatters.length, instances, fade: s?.fade.value, tier: gl.rockFx.tier };
});
console.log("shatter:", JSON.stringify(shatter));
ok(shatter.grown > 0, `rocks are grown in the belt (${shatter.grown})`);
if (shatter.tier !== "off") {
  ok(shatter.gone && shatter.shatters >= 1, "a cut-out rock leaves the scene as a shatter field");
  ok(shatter.instances > 40 && shatter.fade === 1, `in its own colours, whole for now (${shatter.instances} pieces)`);
}

ok(errors.length === 0, `no page or GL errors (${errors.length}${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""})`);
await browser.close();
console.log(fail ? `impact smoke: ${fail} FAILED` : "impact smoke OK");
process.exit(fail ? 1 : 0);
