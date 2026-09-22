/* Headless smoke: a rogue rock is a body, not a paper bag.
 *
 * The symptom, seen on a named rogue at 288 km: rogue asteroids rendered no
 * better than before the rock rebuild. They were not in it — that work went
 * into the belt (js/rockgen.js, js/bodygen/) and the super asteroids were still
 * an IcosahedronGeometry(1, 1) in flat brown, eight to an InstancedMesh.
 *
 * What this measures, rather than that it ran:
 *   - a live rogue rock grows its own body off the generator, in the worker
 *   - grown at the generator's survey resolution and baked (0.3.02: 0.3 drew it
 *     at 7–12 cells a face, a smooth potato until you were nearly touching it)
 *   - it carries a taxonomic class and a real assay, like a belt rock does
 *   - no crystals stuck on it — the seams are in the surface
 *   - a rock that despawns takes its body with it (no leak across a session)
 *
 *   node test/smoke-rogue.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));
let fail = 0;
const ok = (c, m) => { if (c) console.log("  ok ", m); else { fail++; console.error("  FAIL", m); } };

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "RogueSmoke");
await page.click("#btn-create");
for (let i = 0; i < 4; i++) { await page.waitForTimeout(350); await page.click("#create-next").catch(() => {}); }
await page.waitForTimeout(400);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await page.waitForTimeout(1500);

const res = await page.evaluate(async () => {
  const { impactors } = await import("/js/impactors.js");
  const { sim } = await import("/js/sim.js");
  const { BAKE } = await import("/js/bodygen/body.js");
  const out = {};
  const gl = window.__lgGL;

  /* plant a rogue rock right beside the hull rather than waiting ~55 s for one */
  impactors.length = 0;
  impactors.push({
    id: "smoke-rogue", name: "Blind Anvil",
    x: sim.ship.pos.x + 9000, y: sim.ship.pos.y, z: sim.ship.pos.z,
    vx: 0, vy: 0, vz: 0, r: 640, seed: 0.41, spin: 0.08,
    born: sim.time, deflected: 0, lastWell: null, remote: true,
  });
  for (let i = 0; i < 60 && !gl.impBodies.size; i++) await new Promise((r) => setTimeout(r, 250));
  await new Promise((r) => setTimeout(r, 300));

  out.grown = gl.impBodies.size;
  out.grower = { state: gl.growerStats.state, worker: gl.growerStats.worker, main: gl.growerStats.mainThread };
  const b = gl.impBodies.get("smoke-rogue");
  if (b) {
    const g = b.mesh.geometry;
    out.faces = (g.index ? g.index.count : g.attributes.position.count) / 3;
    out.cls = b.cls;
    out.outcrops = b.built.outcrops?.length ?? 0;
    out.crystals = b.group.getObjectsByProperty ? b.group.getObjectsByProperty("isInstancedMesh", true).length : 0;
    out.bakedH = b.built.bakedH;
    out.grownFaces = b.built.grownTriangles;
    out.baked = Boolean(b.mesh.material.userData.bake && g.attributes.aBakeUv);
    out.assayOre = Object.keys(b.assay?.composition ?? b.assay?.assay ?? {}).length;
    out.assayKeys = Object.keys(b.assay ?? {});
    out.visible = b.group.visible;
    out.radius = b.r;
    /* the extremes of the hull, to prove craters and relief actually moved it */
    const a = g.attributes.position.array;
    let lo = Infinity, hi = 0;
    for (let i = 0; i < a.length; i += 3) {
      const d = Math.hypot(a[i], a[i + 1], a[i + 2]);
      if (d < lo) lo = d; if (d > hi) hi = d;
    }
    out.spread = hi / lo;
    /* 0.3: the body is built in the generator's unit frame and scaled up by its
     * `unit` group, so its world size is the geometry times that scale */
    out.hi = hi * b.unit.scale.x;
    /* vertex attributes the material reads — this is the metal-proud-of-matrix look */
    out.attrs = Object.keys(g.attributes);
  }
  out.tiers = BAKE.rogue;

  /* and when it strikes or drifts out, the body goes with it */
  impactors.length = 0;
  await new Promise((r) => setTimeout(r, 600));
  out.afterDespawn = gl.impBodies.size;
  return out;
});

console.log(`  rogue body: class ${res.cls} · ${res.faces} faces drawn over a ${res.grownFaces}-face surface (H${res.bakedH}) · ${res.outcrops} outcrops · hull ${Math.round(res.hi)} u · relief ×${res.spread?.toFixed(2)} · grower ${JSON.stringify(res.grower)}`);
console.log(`  assay carries: ${res.assayKeys?.join(", ")}`);

ok(res.grown === 1, `a live rogue rock grows its own body (${res.grown})`);
ok(res.grower?.worker > 0, "grown in the worker, off the frame loop");
ok(res.baked, "it wears the generator's surface baked, not averaged vertex colour");
ok(res.bakedH >= 48, `grown at ${res.bakedH} cells a face — the generator's features exist at that detail`);
ok(res.grownFaces >= 12 * 48 * 48 && res.faces < res.grownFaces, `…drawn on ${res.faces} faces carrying ${res.grownFaces}`);
ok(typeof res.cls === "string" && res.cls.length === 1, `it has a taxonomic class (${res.cls})`);
ok(res.spread > 1.08, `relief and craters actually moved the hull (×${res.spread?.toFixed(2)})`);
ok(res.hi > 600 && res.hi < 1400, `it is shown at its own world radius (${Math.round(res.hi)} u to the highest point for r=640 — mean radius is r, and an elongate or binary body reaches past it)`);
ok((res.attrs ?? []).includes("normal") && (res.attrs ?? []).includes("aBakeUv"), `geometry carries the atlas coordinates (${(res.attrs ?? []).join(", ")})`);
ok(res.outcrops > 0, `the assay knows where seams break the surface (${res.outcrops})`);
ok(res.crystals === 0, "and no crystals are stuck on it");
ok(res.visible === true, "and it is actually on screen");
ok(res.afterDespawn === 0, `a rock that leaves takes its body with it (${res.afterDespawn} left behind)`);

await browser.close();
console.log(fail ? `rogue smoke: ${fail} FAILED` : "rogue smoke: all good");
process.exit(fail ? 1 : 0);
