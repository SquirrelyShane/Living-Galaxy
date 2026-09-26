/* Headless smoke for 0.3.62: one rock, one shape.
 *
 * Reported: a rock became a different rock as you closed on it, and the belt
 * kept re-rendering. Measured here, on the `low` tier (the belt lattice IS the
 * prototype's) and on `full` (the prototype's seed grown finer):
 *   - every close-aboard body is its instance's prototype — same seed, and a
 *     silhouette within a few percent of the prototype mesh
 *   - it sits at the instance's scale and stretch
 *   - bodies sharing a prototype share one geometry (grown once, not per rock)
 *   - flying ~18 km through the belt files no per-rock growth: the grower's
 *     count is bounded by the prototypes, not by the rocks passed
 *
 *   node test/smoke-oneshape.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
let fail = 0;
const ok = (c, m) => { if (c) console.log("  ok ", m); else { fail++; console.error("  FAIL", m); } };

async function run(tier) {
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
  const errors = [];
  page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });
  await page.addInitScript((t) => { try { localStorage.setItem("lgaa.rocks", t); } catch { /* */ } }, tier);
  await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
  await page.fill("#callsign", "ShapeSmoke");
  await page.click("#btn-create");
  for (let i = 0; i < 4; i++) { await page.waitForTimeout(350); await page.click("#create-next").catch(() => {}); }
  await page.waitForTimeout(400);
  await page.click("#btn-sol");
  await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
  await page.waitForTimeout(1500);

  const res = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const { sim } = await import("/js/sim.js");
    const { currentSystem } = await import("/js/bodies.js");
    const { nearbyRocks } = await import("/js/field.js");
    const gl = window.__lgGL;
    const belt = currentSystem.belt ?? currentSystem.outerBelt;
    const mid = (belt.inner + belt.outer) / 2;
    const ship = sim.ship;
    ship.pos.x = mid; ship.pos.y = 0; ship.pos.z = 0; ship.vel.x = ship.vel.y = ship.vel.z = 0;
    for (let i = 0; i < 60 && gl.rockBuckets.some((b) => !b.mesh); i++) await sleep(250);
    await sleep(3000);
    const grows0 = gl.growerStats.worker + gl.growerStats.mainThread;

    /* fly a straight line through the belt at ~1.5 km/s, the way a pass goes */
    const seen = new Set();
    const bodyGeos = new Map();          // geometry → keys on it
    let checked = 0, seedMatch = 0, scaleMatch = 0, stretchMatch = 0, worstMean = 0;
    const protoByCls = new Map();
    const profile = (geo, R) => {
      const p = geo.attributes.position.array, out = [];
      const N = 160;
      for (let i = 0; i < N; i++) {
        const y = 1 - 2 * (i + 0.5) / N, rr = Math.sqrt(1 - y * y), a = i * 2.39996, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
        let best = -2, rad = 0;
        for (let k = 0; k < p.length; k += 3) { const l = Math.hypot(p[k], p[k + 1], p[k + 2]); const c = (p[k] * x + p[k + 1] * y + p[k + 2] * z) / l; if (c > best) { best = c; rad = l; } }
        out.push(rad / R);
      }
      return out;
    };
    for (let step = 0; step < 120; step++) {
      ship.pos.z = step * 150;
      ship.vel.x = ship.vel.y = ship.vel.z = 0;
      await sleep(100);
      const rocks = new Map(nearbyRocks(ship.pos, sim.time, 2).map((r) => [r.key, r]));
      for (const [key, b] of gl.bodies) {
        if (!b.group.visible) continue;
        seen.add(key);
        if (!bodyGeos.has(b.mesh.geometry)) bodyGeos.set(b.mesh.geometry, new Set());
        bodyGeos.get(b.mesh.geometry).add(key);
        const r = rocks.get(key);
        if (!r || checked >= 24) continue;
        checked++;
        const cls = r.cls in { S: 1, C: 1, M: 1, X: 1, V: 1, E: 1, B: 1, P: 1, D: 1 } ? r.cls : "S";
        const v = Math.floor((r.seed ?? 0.5) * 9973) % 2;
        const bucket = gl.rockBuckets.find((x) => x.cls === cls && x.v === v);
        if (b.built.seed === bucket.mount.built.seed) seedMatch++;
        if (Math.abs(b.unit.scale.x - r.r / bucket.unitR) < 1e-6 * r.r) scaleMatch++;
        const w = 1 - r.worn * 0.45;
        const sx = 0.8 + ((r.seed * 3571) % 1) * 0.2, sy = 0.8 + ((r.seed * 6007) % 1) * 0.2;
        if (Math.abs(b.group.scale.x - w * sx) < 1e-9 && Math.abs(b.group.scale.y - w * sy) < 1e-9 && Math.abs(b.group.scale.z - w) < 1e-9) stretchMatch++;
        const pk = `${cls}:${v}`;
        if (!protoByCls.has(pk)) {
          const A = profile(bucket.lods[0].geometry, bucket.unitR), B = profile(b.mesh.geometry, bucket.unitR);
          const mean = A.reduce((s, a, i) => s + Math.abs(a - B[i]), 0) / A.length;
          protoByCls.set(pk, mean);
          worstMean = Math.max(worstMean, mean);
        }
      }
    }
    const grows = gl.growerStats.worker + gl.growerStats.mainThread - grows0;
    const shared = [...bodyGeos.values()].some((s) => s.size > 1);
    return { budget: gl.rockQuality(), bodyH: gl.bodyDetail, seen: seen.size, checked, seedMatch, scaleMatch, stretchMatch, worstMean, protos: protoByCls.size, grows, shared, geos: bodyGeos.size, protoCount: gl.rockBuckets.length };
  });
  console.log(`[${tier}]`, JSON.stringify(res));
  ok(res.seen >= 6, `[${tier}] a pass through the belt mounts close-aboard bodies (${res.seen} rocks, budget ${res.budget})`);
  ok(res.checked > 0 && res.seedMatch === res.checked, `[${tier}] every body is its instance's prototype (${res.seedMatch}/${res.checked})`);
  ok(res.worstMean < 0.05, `[${tier}] and its silhouette is the prototype's (worst mean radial difference ${(res.worstMean * 100).toFixed(1)}% over ${res.protos} prototypes)`);
  ok(res.scaleMatch === res.checked && res.stretchMatch === res.checked, `[${tier}] at the instance's size and stretch (${res.scaleMatch}, ${res.stretchMatch} of ${res.checked})`);
  ok(res.grows <= res.protoCount, `[${tier}] flying ${res.seen} rocks past files ${res.grows} grows — bounded by the ${res.protoCount} prototypes, not the rocks`);
  ok(res.geos <= res.protoCount, `[${tier}] bodies ride shared geometry (${res.geos} geometries for ${res.seen} rocks${res.shared ? ", some shared" : ""})`);
  ok(errors.length === 0, `[${tier}] no page errors (${errors.slice(0, 2).join(" | ")})`);
  await browser.close();
}

await run("low");
await run("full");
console.log(fail ? `smoke-oneshape: ${fail} FAILED` : "smoke-oneshape: all green");
process.exit(fail ? 1 : 0);
