/* Headless smoke: a collapsed star you can see, steer by and lose things to.
 *
 * What it measures, rather than that it ran:
 *   - a hole ahead of the hull is picked for the lens, and the lens pass runs
 *     inside the composer with the scene's depth
 *   - the lensed frame has a SHADOW (the pixels at the hole are dark) and a DISK
 *     (somewhere around it is bright) — read back from the composer's target,
 *     not assumed
 *   - with the lens gated off by the frame budget, the stand-in (a shadow sphere
 *     and an unlensed disk) is what is drawn instead
 *   - a hole moving through the belt eats rocks, and the ones near the hull are
 *     seen falling in
 *   - a rogue that strays inside the tidal radius is torn apart on screen
 *   - the chart draws the hole and its danger ring; the dash labels it
 *   - no page or GL errors
 *
 * The lens is ~80–170 ray-march steps a pixel. Swiftshader draws it on the CPU,
 * so this smoke runs at a small viewport and waits in seconds, not frames.
 *
 *   node test/smoke-blackhole.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 320, height: 600 } });
page.setDefaultTimeout(180000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { const t = m.text(); if (/GL_INVALID|Shader Error|WebGL: INVALID|\[holefx\]/.test(t)) errors.push(t.slice(0, 200)); });
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

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "HoleSmoke");
await page.click("#btn-create");
for (let i = 0; i < 4; i++) { await page.waitForTimeout(350); await page.click("#create-next").catch(() => {}); }
await page.waitForTimeout(400);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 60000 });
await page.waitForTimeout(1500);

/* ---- the lens ---- */
await page.evaluate(async () => {
  const { sim, summonHole } = await import("/js/sim.js");
  const { lockPerfTier } = await import("/js/perf.js");
  lockPerfTier(3);
  const s = sim.ship;
  s.engines = false; s.throttle = 0; s.vel.x = s.vel.y = s.vel.z = 0;
  /* the pilot starts facing Earth; turn round so nothing sits between the hull and the hole */
  s.yaw = s.aimYaw = s.yaw + Math.PI; s.pitch = s.aimPitch = 0.05;
  const f = { x: -Math.sin(s.yaw) * Math.cos(s.pitch), y: Math.sin(s.pitch), z: -Math.cos(s.yaw) * Math.cos(s.pitch) };
  const h = summonHole({ at: { x: s.pos.x + f.x * 60000, y: s.pos.y + f.y * 60000, z: s.pos.z + f.z * 60000 }, vel: { x: 0, y: 0, z: 0 }, rs: 1900 });
  h.gravity = false;   // hold the frame still for the read-back
  window.__smokeHole = h.id;
});
await page.waitForTimeout(6000);
const lens = await page.evaluate(async () => {
  const THREE = await import("/vendor/three.module.min.js");
  const { holes } = await import("/js/holes.js");
  const gl = window.__lgGL;
  const h = holes.find((x) => x.id === window.__smokeHole);
  const t = gl.bloom.targets;
  if (!t.rtM) return { lens: Boolean(gl.holeFx.lens()), rtM: false };
  const cam = gl.camera;
  const p = new THREE.Vector3(h.x - gl.origin.x, h.y - gl.origin.y, h.z - gl.origin.z).project(cam);
  const uv = { u: p.x * 0.5 + 0.5, v: p.y * 0.5 + 0.5 };
  const read = (u, v) => {
    const buf = new Uint16Array(4);
    const x = Math.max(0, Math.min(t.rtM.width - 1, Math.floor(u * t.rtM.width)));
    const y = Math.max(0, Math.min(t.rtM.height - 1, Math.floor(v * t.rtM.height)));
    gl.renderer.readRenderTargetPixels(t.rtM, x, y, 1, 1, buf);
    const c = [...buf].map((b) => THREE.DataUtils.fromHalfFloat(b));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  /* the shadow: the darkest point near the middle — at a grazing view the lensed
   * disk crosses the very centre, so one pixel is not the test */
  const rPix0 = Math.atan2(h.rs * 4, 60000) / (cam.fov * Math.PI / 180);
  let centre = read(uv.u, uv.v);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    centre = Math.min(centre, read(uv.u + Math.cos(a) * rPix0 * 0.35 * (cam.aspect < 1 ? 1 / cam.aspect : 1), uv.v + Math.sin(a) * rPix0 * 0.35));
  }
  /* the disk and photon ring sit within ~3–13 rs; in screen terms, around the shadow */
  const rPix = Math.atan2(h.rs * 4, 60000) / (cam.fov * Math.PI / 180) ;
  let ring = 0;
  for (let k = 0; k < 24; k++) {
    for (const m of [1, 1.6, 2.4]) {
      const a = (k / 24) * Math.PI * 2;
      ring = Math.max(ring, read(uv.u + Math.cos(a) * rPix * m * (cam.aspect < 1 ? 1 / cam.aspect : 1), uv.v + Math.sin(a) * rPix * m));
    }
  }
  return {
    lens: Boolean(gl.holeFx.lens()), lensHole: gl.holeFx.lensHole?.id === h.id, rtM: true, rtL: t.rtL ? [t.rtL.width, t.rtL.height] : null,
    depth: Boolean(t.sceneRT?.depthTexture), uv, centre, ring, standins: gl.holeFx.standinsShown,
  };
});
console.log("lens:", JSON.stringify(lens));
ok(lens.lens && lens.lensHole, "a hole ahead of the hull gets the lens");
ok(lens.rtM && lens.depth, "the lens runs in the composer over the scene and its depth");
ok(lens.centre < 0.02 && lens.centre < lens.ring * 0.05, `the hole has a shadow (darkest ${lens.centre?.toFixed(4)} near its centre)`);
ok(lens.ring > 0.15, `and a lit disk around it (brightest nearby ${lens.ring?.toFixed(3)})`);
ok(lens.standins === 0, "the stand-in is not drawn under a live lens");
await page.screenshot({ path: "_scratch/blackhole-lens.png" });

/* ---- the stand-in ---- */
await page.evaluate(async () => { const { lockPerfTier } = await import("/js/perf.js"); lockPerfTier(0); });
await page.waitForTimeout(2500);
const standin = await page.evaluate(() => ({ lens: Boolean(window.__lgGL.holeFx.lens()), standins: window.__lgGL.holeFx.standinsShown }));
console.log("stand-in:", JSON.stringify(standin));
ok(!standin.lens && standin.standins === 1, "with the lens gated off by the frame budget, the stand-in is drawn instead");
await page.screenshot({ path: "_scratch/blackhole-standin.png" });

/* ---- the chart and the dash ---- */
const dash = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  return { watch: sim.holeWatch?.id === window.__smokeHole, label: [...document.querySelectorAll("*")].some((e) => e.childElementCount === 0 && /◉ Collapsar/.test(e.textContent ?? "")) };
});
ok(dash.watch, "the dash is watching the hole");
ok(dash.label, "and the canopy labels it");

/* ---- the belt, a rogue ---- */
const eat = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { holes } = await import("/js/holes.js");
  const { currentSystem } = await import("/js/bodies.js");
  const { depleted } = await import("/js/field.js");
  const { impactors } = await import("/js/impactors.js");
  const belt = currentSystem.belt ?? currentSystem.outerBelt;
  const mid = (belt.inner + belt.outer) / 2;
  const h = holes.find((x) => x.id === window.__smokeHole);
  sim.ship.pos.x = mid; sim.ship.pos.y = 0; sim.ship.pos.z = 60000;
  h.x = mid - 30000; h.y = 0; h.z = 0; h.vx = 1500; h.vy = 0; h.vz = 0;
  const before = depleted.size;
  impactors.length = 0;
  impactors.push({ id: "impTide", name: "Tide Rock", r: 600, x: h.x + 9000, y: 0, z: 0, vx: 1500, vy: 0, vz: 0, seed: 0.4, spin: 0.1, born: sim.time, deflected: 0 });
  await new Promise((r) => setTimeout(r, 8000));
  return { eaten: depleted.size - before, rogue: impactors.some((m) => m.id === "impTide"), infall: window.__lgGL.holeFx.infallLive, tidal: window.__lgGL.holeFx.tidal };
});
console.log("eat:", JSON.stringify(eat));
ok(eat.eaten > 20, `a hole through the belt eats rocks (${eat.eaten})`);
ok(eat.infall, "and the ones near the hull are drawn falling in");
ok(!eat.rogue && eat.tidal >= 1, "a rogue inside the tidal radius is removed and torn apart on screen");

/* chart */
await page.evaluate(async () => { const { useGameStore } = await import("/js/store.js"); useGameStore.getState().setMapOpen(true); });
await page.waitForTimeout(2500);
const chart = await page.evaluate(() => [...document.querySelectorAll("svg text")].some((t) => /Collapsar/.test(t.textContent ?? "")));
ok(chart, "the chart draws the hole by name");
await page.screenshot({ path: "_scratch/blackhole-chart.png" });

ok(errors.length === 0, `no page or GL errors (${errors.length}${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""})`);
await browser.close();
console.log(fail ? `blackhole smoke: ${fail} FAILED` : "blackhole smoke OK");
process.exit(fail ? 1 : 0);
