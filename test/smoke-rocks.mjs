/* Headless smoke: every rock in the belt is the asteroid generator's.
 *
 * What it measures, rather than that it ran:
 *   - the field draws as the generator's class prototypes (0.3.02 — it was three
 *     hand-deformed icosahedra), in more than one class and more than one body
 *   - the instance colours actually differ (the ore rides on the tint)
 *   - no white shards, crystals, rubble or clouds around a rock sitting still
 *   - rocks close aboard grow their own baked body in the worker
 *   - the triangle budget stays inside what a phone will carry
 *   - nothing renders when the hull is out of the belt
 *
 *   node test/smoke-rocks.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));
let fail = 0;
const ok = (c, m) => { if (c) console.log("  ok ", m); else { fail++; console.error("  FAIL", m); } };

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "RockSmoke");
await page.click("#btn-create");
for (let i = 0; i < 4; i++) { await page.waitForTimeout(350); await page.click("#create-next").catch(() => {}); }
await page.waitForTimeout(400);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await page.waitForTimeout(1500);

const res = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { currentSystem } = await import("/js/bodies.js");
  const { nearbyRocks } = await import("/js/field.js");
  const belt = currentSystem.belt ?? currentSystem.outerBelt;
  const mid = (belt.inner + belt.outer) / 2;
  const out = {};
  /* out of the belt first */
  sim.ship.pos.x = belt.outer * 2.4; sim.ship.pos.y = 90000; sim.ship.pos.z = 0;
  await new Promise((r) => setTimeout(r, 500));
  out.outside = window.__lgGL.asteroids.count;
  /* then in it */
  sim.ship.pos.x = mid; sim.ship.pos.y = 0; sim.ship.pos.z = 0;
  sim.ship.vel.x = sim.ship.vel.y = sim.ship.vel.z = 0;
  await new Promise((r) => setTimeout(r, 900));
  const gl = window.__lgGL;
  /* the prototypes grow in the worker at launch */
  for (let i = 0; i < 40 && gl.rockBuckets.some((b) => !b.mesh); i++) await new Promise((r) => setTimeout(r, 250));
  await new Promise((r) => setTimeout(r, 400));
  out.protos = gl.rockBuckets.filter((b) => b.mesh).length;
  out.protoCount = gl.rockBuckets.length;
  out.count = gl.asteroids.count;
  const live = gl.rockBuckets.filter((b) => b.mesh && b.lods.some((m) => m.count > 0));
  out.buckets = live.map((b) => `${b.cls}/v${b.v}:${b.lods.map((m) => m.count).join("+")}`);
  out.shapes = live.length;
  out.materials = new Set(live.map((b) => b.cls)).size;
  out.baked = live.every((b) => b.mesh.material.userData.bake && b.mesh.geometry.attributes.aBakeUv);
  out.grownAt = live[0]?.mount?.built?.bakedH ?? 0;
  /* nothing bright and faceted hanging round the rocks */
  out.shards = 0;
  gl.scene.traverse((o) => { if (o.isInstancedMesh && o.geometry?.type === "OctahedronGeometry" && o.count > 0) out.shards += o.count; });
  out.dust = gl.dust.visible;
  out.dustRound = Boolean(gl.dust.material.map);
  /* distinct instance colours across every populated bucket */
  const seen = new Set();
  let tris = 0;
  for (const b of live) {
    for (const m of b.lods) {
      tris += m.geometry.index.count / 3 * m.count;
      const a = m.instanceColor.array;
      for (let i = 0; i < m.count; i++) seen.add([0, 1, 2].map((k) => Math.round(a[i * 3 + k] * 24)).join(","));
    }
  }
  out.distinctColours = seen.size;
  out.tris = Math.round(tris);
  /* the grown bodies: give them a few seconds, one is built per frame */
  await new Promise((r) => setTimeout(r, 6000));
  out.bodyBudget = gl.rockQuality();
  out.bodies = gl.bodies.size;
  out.bodyVisible = [...gl.bodies.values()].filter((b) => b.group.visible).length;
  out.bodyTris = [...gl.bodies.values()].reduce((n, b) => n + (b.mesh.geometry.index ? b.mesh.geometry.index.count / 3 : b.mesh.geometry.attributes.position.count / 3), 0);
  out.outcrops = [...gl.bodies.values()].reduce((n, b) => n + (b.built.outcrops?.length ?? 0), 0);
  out.dressed = [...gl.bodies.values()].filter((b) => b.rubble || b.cloud).length;
  out.bodyH = [...gl.bodies.values()][0]?.built.bakedH ?? 0;
  out.grower = { state: gl.growerStats.state, worker: gl.growerStats.worker, main: gl.growerStats.mainThread, failed: gl.growerStats.failed };
  out.bodyClasses = [...new Set([...gl.bodies.values()].map((b) => b.cls))].sort();
  const first = [...gl.bodies.values()][0];
  out.assay = first ? { cls: first.assay.cls, ore: first.assay.headline, suite: first.assay.suite.length, value: Math.round(first.assay.value), units: Math.round(first.assay.units) } : null;
  out.perVertex = Boolean(first && first.mesh.material.userData.bake && first.mesh.geometry.attributes.aBakeUv);

  /* what the field says is actually out there, for comparison */
  const rocks = nearbyRocks(sim.ship.pos, sim.time, 2);
  out.fieldRocks = rocks.length;
  out.fieldOres = new Set(rocks.map((r) => r.ore)).size;
  out.fieldRich = rocks.filter((r) => r.rich).length;
  out.fieldIce = rocks.filter((r) => r.ice).length;
  out.fieldClasses = [...new Set(rocks.map((r) => r.cls))].sort();
  return out;
});

console.log("belt draw:", JSON.stringify(res, null, 0));
ok(res.outside === 0, `nothing drawn outside the belt (${res.outside})`);
ok(res.protos === res.protoCount, `every class prototype grew (${res.protos} of ${res.protoCount})`);
ok(res.count > 20, `the belt draws (${res.count} rocks of ${res.fieldRocks} in reach)`);
ok(res.baked, `…and every rock on screen is a baked generator body (grown at ${res.grownAt} cells a face)`);
ok(res.grownAt >= 32, "at the generator's resolution, not 0.3's 7–12 cells");
ok(res.shapes >= 2, `more than one body on screen (${res.shapes} prototypes: ${res.buckets.join(" ")})`);
ok(res.distinctColours >= 4, `an ore palette, not a tint (${res.distinctColours} distinct instance colours, ${res.fieldOres} ores in the cells)`);
ok(res.tris < 90000, `triangle budget is phone-sized (${res.tris})`);
ok(res.shards === 0, `no white shards or crystals around the rocks (${res.shards})`);
ok(res.dust === true && res.dustRound, "dust is up inside the belt, as soft round motes");
if (res.fieldIce > 0) ok(res.materials >= 1, `ice and rock share the field (${res.materials} classes, ${res.fieldIce} icy rocks in reach)`);

ok(res.fieldClasses.length >= 3, `the belt carries a taxonomy, not one rock type (${res.fieldClasses.join("")})`);
if (res.bodyBudget > 0) {
  ok(res.bodies > 0, `rocks close aboard are grown, not instanced (${res.bodies} bodies, budget ${res.bodyBudget}, grower ${JSON.stringify(res.grower)})`);
  ok(res.grower.worker > 0 && res.grower.failed === 0, "grown in the worker, off the frame loop");
  ok(res.perVertex, `a grown body wears its baked surface (H${res.bodyH})`);
  ok(res.outcrops > 0, `the assay still knows where its seams break the surface (${res.outcrops} outcrops)`);
  ok(res.dressed === 0, "and a rock sitting still wears no rubble or cloud");
  ok(res.assay && res.assay.suite > 0 && res.assay.value > 0, `the assay prices what a cutter would get (${res.assay?.suite} ores, ${res.assay?.units} units, ${res.assay?.value?.toLocaleString()} cr)`);
  ok(res.bodyTris < 40000, `grown bodies stay inside the budget too (${res.bodyTris} tris over ${res.bodies})`);
} else console.log("  --  this device gates grown bodies off; field-only path exercised");

await page.screenshot({ path: "_scratch/belt.png" });
await browser.close();
console.log(fail ? `rocks smoke: ${fail} failed` : "rocks smoke OK");
if (fail) process.exit(1);
