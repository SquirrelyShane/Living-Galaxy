/* Headless smoke for 0.3.42: FLY AS <callsign> on the start card.
 *
 * Creates a pilot, trains a skill, buys a hull and earns; backgrounds the tab;
 * reloads. The start card must offer "Fly as <callsign>" with "New pilot"
 * stepped back; FLY AS must land the same pilot — rank, skill, hull, purse —
 * in the same sky without the creation screen; and "New pilot" must ask
 * before it sweeps anything (a dismissed dialog leaves the pilot alone).
 *
 *   node test/smoke-continue.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok ", m); } else { fail++; console.log("  FAIL", m); } };

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await sleep(500);
const card0 = await page.evaluate(() => ({ cont: document.getElementById("btn-continue").hidden, create: document.getElementById("btn-create").textContent }));
ok(card0.cont === true && card0.create === "Create pilot", `a fresh device offers only Create pilot (${JSON.stringify(card0)})`);

await page.fill("#callsign", "Keeper");
await page.click("#btn-create"); await sleep(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click()); await sleep(400);
await page.click("#create-next"); await sleep(300);
await page.evaluate(() => [...document.querySelectorAll("#create-body .pick")].find((b) => /mining/i.test(b.textContent))?.click() ?? document.querySelector("#create-body .pick")?.click());
await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
await page.click("#create-next"); await sleep(300); await page.click("#create-next"); await sleep(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await sleep(1000);

/* a session's worth of progress, in one evaluate */
const s1 = await page.evaluate(async () => {
  const { pilot, work, rankStatus, skillSheet } = await import("/js/pilot.js");
  const { SHIP_DB, DEFAULT_SHIP_ID } = await import("/js/shipdb.js");
  const { sim } = window.__lg;
  for (let i = 0; i < 80; i++) work("geology", 0.5);
  const hull = SHIP_DB.find((d) => d.id !== DEFAULT_SHIP_ID);
  sim.ownedHulls = [hull.id]; sim.activeHullId = hull.id; sim.requestPersist = true;
  sim.ship.credits = 42424;
  return { name: pilot.name, rank: rankStatus().letter, skill: skillSheet()[0], hull: hull.id, credits: sim.ship.credits };
});
await sleep(300);
/* background the tab */
await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
await sleep(300);
const disk = await page.evaluate(() => ({ rec: JSON.parse(localStorage.getItem("lgaa.pilot.v1")), save: JSON.parse(localStorage.getItem("lgaa-save-v1")) }));
ok(disk.rec?.name === "Keeper" && disk.rec.hulls?.[0] === s1.hull && disk.rec.activeHull === s1.hull, `the record is on disk with the hull (${disk.rec?.hulls})`);
ok(disk.save?.credits === 42424 && disk.save?.lastSky === "sol", `the save carries the purse and the sky (${disk.save?.credits}, ${disk.save?.lastSky})`);

/* reload: the start card */
await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await sleep(600);
const card1 = await page.evaluate(() => ({ cont: document.getElementById("btn-continue").hidden, contText: document.getElementById("btn-continue").textContent, create: document.getElementById("btn-create").textContent, ghost: document.getElementById("btn-create").classList.contains("btn-ghost"), callsign: document.getElementById("callsign").value }));
ok(card1.cont === false && card1.contText === "Fly as Keeper", `the start card offers FLY AS (${card1.contText})`);
ok(card1.create === "New pilot" && card1.ghost, "…and New pilot stepped back to a ghost");
ok(card1.callsign === "Keeper", "the callsign is already in the box");

/* New pilot asks first; dismissing leaves everything alone */
page.once("dialog", (d) => { ok(/NEW pilot/.test(d.message()) && /Keeper/.test(d.message()), "New pilot asks, naming the pilot it would sweep"); d.dismiss(); });
await page.click("#btn-create"); await sleep(400);
const still = await page.evaluate(() => ({ creation: !document.getElementById("create")?.classList.contains("hidden"), rec: Boolean(localStorage.getItem("lgaa.pilot.v1")) }));
ok(still.creation === false && still.rec, "…dismissed: no creation screen, the record is still there");

/* FLY AS */
await page.click("#btn-continue");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await sleep(1200);
const s2 = await page.evaluate(async () => {
  const { pilot, rankStatus, skillSheet } = await import("/js/pilot.js");
  const { currentShipId } = await import("/js/sim.js");
  const { sim } = window.__lg;
  return { name: pilot.name, restored: pilot.restored, rank: rankStatus().letter, skill: skillSheet()[0], hull: currentShipId(), owned: sim.ownedHulls, credits: sim.ship.credits, room: window.__lg.store?.getState?.().room ?? null };
});
ok(s2.name === "Keeper" && s2.restored === true, `flying as Keeper, restored (${s2.name})`);
ok(s2.rank === s1.rank && s2.skill.id === s1.skill.id && s2.skill.value === s1.skill.value, `rank ${s2.rank} and ${s2.skill.id} ${s2.skill.value} kept (was ${s1.rank}, ${s1.skill.value})`);
ok(s2.hull === s1.hull && s2.owned.includes(s1.hull), `flying the bought hull (${s2.hull})`);
ok(s2.credits === 42424, `the purse is back (${s2.credits})`);
ok(errors.length === 0, `no page errors (${errors.join(" | ")})`);

await browser.close();
console.log(`smoke-continue: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
