/* 0.3.57 — CREW › BONDS › HOUSEHOLD in a real browser, portrait phone: a
 * child's card carries the talk topics, asking one answers in the child's
 * voice into the transcript, a question they bring you shows with its three
 * answers, and nothing overflows the sheet.
 *   node test/smoke-childtalk.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 384, height: 832 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });
const sleep = (ms) => page.waitForTimeout(ms);
const checks = [];
const ok = (c, m) => { checks.push([Boolean(c), m]); console.log(`${c ? "ok  " : "FAIL"} ${m}`); };

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "KidSmoke");
await page.click("#btn-create"); await sleep(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click()); await sleep(300);
await page.click("#create-next"); await sleep(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
await page.click("#create-next"); await sleep(300);
await page.click("#create-next"); await sleep(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await sleep(1200);

const kid = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { stations } = await import("/js/stations.js");
  const { crew, hireCrew, stationRoster } = await import("/js/crew.js");
  const { household, conceive } = await import("/js/family.js");
  sim.ship.credits = 200000;
  const st = stations.find((s) => !s.hostile);
  for (const c of stationRoster(st, 1, sim.skySeed).slice(0, 3)) hireCrew(c, sim.ship, 12);
  const rec = conceive(crew.aboard[0], crew.aboard[1]);
  household.children.push({ id: rec.id, name: rec.name, age: 9, parents: rec.parents, raceId: rec.raceId, gender: rec.gender, pronouns: rec.pronouns, traits: rec.traits });
  household.asks ??= {};
  household.asks[rec.id] = { id: "stars", cycle: 0, answered: null };
  return { id: rec.id, first: rec.name.split(" ")[0] };
});

await page.evaluate(async () => (await import("/js/console/console.js")).openConsole("crew", "bonds"));
await sleep(900);
const c0 = await page.evaluate((id) => {
  const card = document.querySelector(`#con-body .tcard[data-id="${id}"]`);
  return {
    card: Boolean(card),
    topics: card ? card.querySelectorAll(".tbtn[data-child-topic]").length : 0,
    answers: card ? card.querySelectorAll(".tbtn[data-answer]").length : 0,
    ask: card?.querySelector(".tchild-ask p")?.textContent ?? "",
  };
}, kid.id);
ok(c0.card && c0.topics === 8, `the child's card carries eight things to say (${c0.topics})`);
ok(c0.answers === 3 && /stars/.test(c0.ask), `and their question, with three answers ("${c0.ask}")`);

await page.evaluate((id) => document.querySelector(`#con-body .tcard[data-id="${id}"] .tbtn[data-child-topic="window"]`)?.click(), kid.id);
await sleep(700);
await page.evaluate((id) => document.querySelector(`#con-body .tcard[data-id="${id}"] .tbtn[data-answer="game"]`)?.click(), kid.id);
await sleep(700);
const c1 = await page.evaluate((id) => {
  const card = document.querySelector(`#con-body .tcard[data-id="${id}"]`);
  return {
    lines: [...(card?.querySelectorAll(".in-talk-log p") ?? [])].map((p) => p.textContent),
    answers: card ? card.querySelectorAll(".tbtn[data-answer]").length : -1,
    overflow: document.querySelector("#con-body").scrollWidth > document.querySelector("#con-body").clientWidth + 1,
  };
}, kid.id);
ok(c1.lines.some((l) => /^You: Look out the port/.test(l)) && c1.lines.some((l) => l.startsWith(`${kid.first}:`)), `asking answers in their voice (${c1.lines.at(-1)?.slice(0, 60)})`);
ok(c1.answers === 0 && c1.lines.some((l) => /Make it a game/.test(l)), "answering their question closes it, and it is in the transcript");
ok(!c1.overflow, "the sheet does not overflow sideways");
await page.evaluate((id) => document.querySelector(`#con-body .tcard[data-id="${id}"]`)?.scrollIntoView({ block: "start" }), kid.id);
await sleep(300);
await page.screenshot({ path: "/tmp/childtalk.png" });

ok(!errors.length, `no page errors (${errors.length})`);
await browser.close();
const bad = checks.filter(([c]) => !c);
if (bad.length) { console.error(`smoke-childtalk: ${bad.length} failed`); process.exit(1); }
console.log("smoke-childtalk: all green");
