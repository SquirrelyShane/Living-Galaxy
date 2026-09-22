/* Headless smoke for 0.3.17: the talk view — scenes wait on you, topics carry on.
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
  const { crew, hireCrew, stationRoster } = await import("/js/crew.js");
  const { mountTalk } = await import("/js/crew/talkview.js");
  sim.ship.credits = 100000;
  const st = stations.find((s) => s.sector !== "pirate");
  sim.ship.dockedAt = st.id;
  for (const c of stationRoster(st, 0, sim.skySeed).slice(0, 2)) hireCrew(c, sim.ship, 8);
  const m = crew.aboard[0];
  m.trust = 60; m.morale = 80;
  const host = document.createElement("div");
  host.id = "talk-smoke";
  host.style.cssText = "position:fixed;left:0;top:0;width:412px;height:900px;overflow:auto;background:#000;z-index:99999";
  document.body.append(host);
  mountTalk(host, m.id, { btnClass: "tbtn" });
  const btns = () => [...host.querySelectorAll("button")].map((b) => b.textContent);
  const out = { topics: btns().length };
  const scene = [...host.querySelectorAll("button")].find((b) => b.textContent.startsWith("▶ Stand a watch"));
  out.sceneButton = Boolean(scene);
  scene?.click();
  await sleep(50);
  const line0 = host.querySelector(".in-talk-line").textContent;
  const bar0 = host.querySelector(".in-talk-beat-fill").style.width;
  out.stage0 = btns();
  await sleep(3000);
  out.still = host.querySelector(".in-talk-line").textContent === line0 && host.querySelector(".in-talk-beat-fill").style.width === bar0;
  out.bar0 = bar0;
  [...host.querySelectorAll("button")].find((b) => !/Let it drop/.test(b.textContent))?.click();
  await sleep(50);
  out.bar1 = host.querySelector(".in-talk-beat-fill").style.width;
  out.line1 = host.querySelector(".in-talk-line").textContent;
  for (let k = 0; k < 6; k++) { const all = [...host.querySelectorAll("button")]; if (!all.some((x) => /Let it drop/.test(x.textContent))) break; all[0].click(); await sleep(50); }
  out.tag = host.querySelector(".in-talk-beat-tag").textContent;
  /* a topic that carries on */
  const hopes = [...host.querySelectorAll("button")].find((b) => /What needs fixing/.test(b.textContent));
  hopes?.click(); await sleep(50);
  const firstAns = [...host.querySelectorAll("button")].find((b) => !/Leave it/.test(b.textContent));
  out.firstAns = firstAns?.textContent;
  firstAns?.click(); await sleep(50);
  out.followUps = btns().filter((t) => !/Leave it/.test(t));
  out.line2 = host.querySelector(".in-talk-line").textContent;
  return out;
});
console.log(JSON.stringify(r, null, 1).slice(0, 1600));
ok(r.sceneButton, "scenes are marked ▶ on the talk view");
ok(r.stage0.length >= 3 && r.stage0.some((t) => /Let it drop/.test(t)), `a scene opens on its answers: ${r.stage0.join(" / ")}`);
ok(r.still, "and three seconds later it has not moved on by itself");
ok(r.bar1 !== r.bar0 && /^You: /.test(r.line1), `an answer moves the bar (${r.bar0} → ${r.bar1}) and the next stage opens with it`);
ok(/trust|morale|buff|debuff|together|spark/.test(r.tag), `played through to an outcome: ${r.tag}`);
ok(r.followUps.length >= 2, `a topic's answer carries the conversation on: ${r.firstAns} → ${r.followUps.join(" / ")}`);
await page.screenshot({ path: "/tmp/talk-smoke.png" });
ok(errors.length === 0, `no page errors (${errors.length})`);
await browser.close();
console.log(`smoke talk: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
