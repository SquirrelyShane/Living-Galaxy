/* Headless smoke, 0.3.90: Salvage end to end in the sky you can see. A fresh
 * pilot picks Salvage on the creation card (it must be offered, not "in
 * development"), the tutorial card is the RIG branch, a hulk is left a few km
 * off and the SALVAGE LOOP is engaged: the autopilot must fly to it, run the
 * rig, reel the plate aboard, dock at a buyer and come away richer. Then ARIA
 * takes the conn as a salvor and must plan a salvage run of her own. No page
 * error anywhere.
 *   node test/smoke-salvage.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "SalvSmoke");
await page.click("#btn-create");
await page.waitForTimeout(400);
await page.click("#create-next");
await page.waitForTimeout(400);
const card = await page.evaluate(() => {
  const b = [...document.querySelectorAll("#create-body button.pick")].find((x) => /salvage/i.test(x.textContent || ""));
  if (!b) return { found: false };
  const out = { found: true, shut: b.classList.contains("shut"), small: b.querySelector("small")?.textContent ?? "" };
  b.click();
  return out;
});
console.log("career card:", JSON.stringify(card));
await page.waitForTimeout(300);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#create-next");
await page.waitForTimeout(400);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await page.waitForTimeout(2000);

const start = await page.evaluate(async () => {
  const { sim } = await import("/js/sim/sim.js");
  const { pilot } = await import("/js/flight/pilot.js");
  const { tutorialEvaluate } = await import("/js/ui/tutorial.js");
  const el = document.getElementById("tutor");
  let rig = null;
  try { rig = tutorialEvaluate?.() ?? null; } catch { rig = null; }
  return {
    career: pilot.complexId, tractor: Boolean(sim.ship.salvage), credits: Math.round(sim.ship.credits ?? 0),
    tutor: { present: Boolean(el), title: el?.querySelector("#tutor-title")?.textContent ?? null, text: el?.querySelector("#tutor-text")?.textContent ?? null },
    step: rig ? { id: rig.id ?? null, title: rig.title ?? null } : null,
  };
});
console.log("start:", JSON.stringify(start));

const engaged = await page.evaluate(async () => {
  const { sim } = await import("/js/sim/sim.js");
  const { spawnHulk, hulkManifest } = await import("/js/world/hulks.js");
  const { forwardOf } = await import("/js/flight/ship.js");
  const { engageSalvageLoop, autopilot } = await import("/js/flight/autopilot.js");
  const { mission } = await import("/js/mission/run.js");
  document.getElementById("tutor")?.remove();
  const ship = sim.ship;
  const f = forwardOf(ship.yaw, ship.pitch);
  const k = 3200;
  const h = spawnHulk({ id: "smoke:salvage", name: "Salvage Test", ship: "general_b", cargo: { id: "water", qty: 20 }, x: ship.pos.x + f.x * k, y: ship.pos.y + f.y * k + 400, z: ship.pos.z + f.z * k }, { source: "smoke", intact: 1 });
  h.pinned = true;
  sim.autoPlan.loop = false;
  const rigWas = ship.rigMode ?? "off";
  const ok = engageSalvageLoop({ hulkId: h.id, mode: "cut" });
  return { ok, hulk: h.id, rigWas, notice: sim.notice ?? null, plate: hulkManifest(h).plate, mission: mission.active?.name ?? null, steps: mission.active?.steps.map((s) => s.op) ?? [], phase: autopilot.phase };
});
console.log("engaged:", JSON.stringify(engaged));

/* The cut: watch for the rig running on the hulk under autopilot and plate in
 * the hold. Wall clock is the sim clock here — the arc has to be seen. */
const cut = await page.evaluate(async (hulkId) => {
  const { sim } = await import("/js/sim/sim.js");
  const { rig } = await import("/js/flight/rig.js");
  const { autopilot } = await import("/js/flight/autopilot.js");
  const wait = (ms) => new Promise((f) => setTimeout(f, ms));
  let ran = false, mode = null, beam = false;
  const gl = window.__lgGL;
  const t0 = performance.now();
  while (performance.now() - t0 < 150000) {
    if (rig.active && rig.key === hulkId) {
      ran = true; mode = sim.ship.rigMode;
      const b = gl.scene.children.find((c) => c.isMesh && c.geometry?.type === "CylinderGeometry" && c.children.length === 1 && c.children[0].isMesh);
      beam ||= Boolean(b?.visible);
    }
    if (ran && (sim.ship.hold.steel ?? 0) > 3) break;
    if (!autopilot.on) break;
    await wait(250);
  }
  return { ran, mode, beam, steel: +(sim.ship.hold.steel ?? 0).toFixed(1), on: autopilot.on, phase: autopilot.phase, task: autopilot.task ?? null, secs: Math.round((performance.now() - t0) / 1000) };
}, engaged.hulk);
console.log("cut:", JSON.stringify(cut));
await page.screenshot({ path: process.env.SHOT ?? "/tmp/salvage.png" });

/* The rest of the loop is flying. A software-rendered page makes a handful of
 * frames a second, so the sim is stepped here directly, as the node suites do,
 * with the page still drawing between batches. */
const sold = await page.evaluate(async () => {
  const { sim, tickSim } = await import("/js/sim/sim.js");
  const { autopilot } = await import("/js/flight/autopilot.js");
  const { mission } = await import("/js/mission/run.js");
  const wait = (ms) => new Promise((f) => setTimeout(f, ms));
  const money = () => Math.round(sim.ship.credits ?? 0);
  const before = money();
  const ops = new Set();
  let peak = 0, docked = null;
  const t0 = performance.now();
  let simS = 0;
  while (performance.now() - t0 < 200000 && simS < 1500) {
    for (let i = 0; i < 300; i++) {
      tickSim(1 / 30);
      const m = mission.active;
      if (m) ops.add(m.steps[mission.stepIx ?? 0]?.op);
      peak = Math.max(peak, sim.ship.hold.steel ?? 0);
      docked = sim.ship.dockedAt ?? docked;
    }
    simS += 10;
    if (!mission.active && !autopilot.on) break;
    await wait(30);
  }
  return { before, after: money(), peak: +peak.toFixed(1), left: +(sim.ship.hold.steel ?? 0).toFixed(1), docked, ops: [...ops].filter(Boolean), done: !mission.active, why: mission.lastWhy ?? null, notice: sim.notice ?? null, rig: sim.ship.rigMode, secs: Math.round((performance.now() - t0) / 1000), simS };
});
console.log("sold:", JSON.stringify(sold));

const aria = await page.evaluate(async () => {
  const { sim } = await import("/js/sim/sim.js");
  const { ariaTakeConn } = await import("/js/aria/aria.js");
  const { spawnHulk } = await import("/js/world/hulks.js");
  const { ariaPilot } = await import("/js/aria/pilot.js");
  const { mission } = await import("/js/mission/run.js");
  const wait = (ms) => new Promise((f) => setTimeout(f, ms));
  const ship = sim.ship;
  for (let i = 0; i < 3; i++) spawnHulk({ id: `smoke:aria${i}`, name: `Aria Test ${i}`, ship: "general_b", x: ship.pos.x + 9000 + i * 1500, y: ship.pos.y + 1200, z: ship.pos.z - 4000 }, { source: "smoke", intact: 1 });
  for (const k of Object.keys(ship.hold)) delete ship.hold[k];
  let took = null;
  try { took = ariaTakeConn?.(); } catch (e) { took = `threw: ${e.message}`; }
  const seen = new Set();
  const t0 = performance.now();
  while (performance.now() - t0 < 30000) {
    if (ariaPilot.job) seen.add(ariaPilot.job);
    if (mission.active?.steps.some((s) => s.op === "SALVAGE")) break;
    await wait(250);
  }
  const m = mission.active;
  return { took, jobs: [...seen], job: ariaPilot.job ?? null, mission: m?.name ?? null, steps: m?.steps.map((s) => s.op) ?? [], notice: sim.notice ?? null };
});
console.log("aria:", JSON.stringify(aria));
await browser.close();

const bad = [];
if (!card.found) bad.push("the creation card does not offer Salvage");
if (card.shut || /development/i.test(card.small ?? "")) bad.push(`Salvage is still shut on the creation card ("${card.small}")`);
if (start.career !== "salvage") bad.push(`the pilot was not enrolled in Salvage (${start.career})`);
if (!start.tractor) bad.push("a salvor's hull came without the tractor");
if (!start.tutor.present) bad.push("no tutorial card on a fresh salvor");
if (!engaged.ok) bad.push(`the salvage loop would not engage (${engaged.notice})`);
if (engaged.steps[0] !== "SALVAGE") bad.push(`the loop does not open on SALVAGE (${engaged.steps.join(" ")})`);
if (!cut.ran) bad.push(`the autopilot never ran the rig on the hulk (${cut.phase} · ${cut.task})`);
if (cut.mode !== "cut") bad.push(`the rig ran in ${cut.mode}, not the mode asked for`);
if (!cut.beam) bad.push("no arc drawn while the autopilot cut");
if (!(cut.steel > 0)) bad.push("no plate came aboard under autopilot");
if (!sold.done) bad.push(`the loop never finished (${sold.ops.join(" ")} · ${sold.notice})`);
if (!sold.ops.includes("DOCK")) bad.push("the loop never flew the DOCK step");
if (!sold.docked) bad.push("the ship never docked");
if (!(sold.after > sold.before)) bad.push(`selling the cut paid nothing (${sold.before} → ${sold.after})`);
if (!(sold.left < sold.peak)) bad.push("the plate is still in the hold");
if (sold.rig !== engaged.rigWas) bad.push(`the rig was not put back as the pilot had it (${engaged.rigWas} → ${sold.rig})`);
if (!aria.steps.includes("SALVAGE")) bad.push(`ARIA at the conn of a salvor never planned a salvage run (jobs ${aria.jobs.join(",") || "none"} · ${aria.mission})`);
if (errors.length) bad.push(`${errors.length} page error(s)`);
if (bad.length) { for (const b of bad) console.error("FAIL:", b); process.exit(1); }
console.log("salvage smoke OK");
