/* Headless smoke for 0.3.20: a job site — accept a mining job, fly to the place it names, cut its ore.
 * door, release up the exit lane outside the tractor's reach, no re-lock and
 * no lane hail on the way out, the lane rig drawn only inside 5 km of it.
 *   node test/smoke-docking.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "DockSmoke");
await page.click("#btn-create");
await sleep(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await sleep(400);
await page.click("#create-next");
await sleep(300);
await page.evaluate(() => [...document.querySelectorAll("#create-body .pick")].find((b) => /mining/i.test(b.textContent))?.click() ?? document.querySelector("#create-body .pick")?.click());
await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
await page.click("#create-next");
await sleep(300);
await page.click("#create-next");
await sleep(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await sleep(1200);
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok ", m); } else { fail++; console.log("  FAIL", m); } };

const r = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const { sim } = await import("/js/sim.js");
  const { stations } = await import("/js/stations.js");
  const { corps } = await import("/js/corps.js");
  const { boardFor, acceptContract, contracts } = await import("/js/contracts.js");
  const { siteById } = await import("/js/sites.js");
  const { nearbyRocks } = await import("/js/field.js");
  for (const c of corps) c.standing = 100;
  const out = {};
  let job = null;
  for (const st of stations) { job = boardFor(st).find((o) => o.cat === "mining" && o.type !== "ice"); if (job) break; }
  out.job = job?.title ?? null;
  out.spot = job?.spot?.name ?? null;
  if (!job) return out;
  sim.ship.dockedAt = null;
  acceptContract(job);
  const a = contracts.active.find((x) => x.id === job.id);
  const site = siteById(a.id);
  out.site = site ? { ore: site.ore, count: site.count } : null;
  /* fly there: teleport to the seam and let the field and the renderer catch up */
  sim.ship.pos.x = a.spot.x; sim.ship.pos.y = a.spot.y + 300; sim.ship.pos.z = a.spot.z;
  sim.ship.vel.x = sim.ship.vel.y = sim.ship.vel.z = 0;
  await sleep(2500);
  const rocks = nearbyRocks(sim.ship.pos, sim.time, 1);
  out.mine = rocks.filter((k) => k.site === a.id).length;
  out.others = new Set(rocks.filter((k) => !k.site).map((k) => k.ore)).size;
  const gl = window.__lgGL;
  for (let i = 0; i < 40 && gl.rockBuckets.some((b) => !b.mesh); i++) await sleep(250);
  out.drawn = gl.rockBuckets.filter((b) => b.mesh && b.lods.some((m) => m.count > 0)).length;
  out.waypoint = sim.waypoints.some((w) => w.name.includes(a.spot.name) || w.name.includes(a.title));
  out.seam = sim.autoPlan.seam?.name ?? null;
  return out;
});
console.log(JSON.stringify(r));
ok(r.job && r.spot, `a mining job names a place: ${r.job} — ${r.spot}`);
ok(r.site && r.mine >= 4, `its ore is really there: ${r.mine} ${r.site?.ore} rocks in reach`);
ok(r.others >= 2, `with the belt's own mix around it (${r.others} other ores)`);
ok(r.drawn >= 1, `and the field draws them (${r.drawn} live buckets)`);
ok(r.waypoint && r.seam === r.spot, "the chart and the mining loop are pointed at it");
await page.screenshot({ path: "/tmp/site-smoke.png" });
ok(errors.length === 0, `no page errors (${errors.length})`);
await browser.close();
console.log(`smoke site: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
