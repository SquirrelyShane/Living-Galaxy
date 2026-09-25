/* 0.3.46 — the company line in a real browser: CORP › TOWN opens a line to a
 * settled hand, a check-in is answered in the transcript, a bonus spends the
 * treasury, MOVE THEM offers ports, an ask shows on THE LINE with its answers,
 * and the deck's HALL jumps straight to the person. Portrait phone.
 *   node test/smoke-line.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });
const sleep = (ms) => page.waitForTimeout(ms);
const checks = [];
const ok = (c, m) => { checks.push([Boolean(c), m]); console.log(`${c ? "ok  " : "FAIL"} ${m}`); };

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "LineSmoke");
await page.click("#btn-create");
await sleep(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await sleep(400);
await page.click("#create-next"); await sleep(300);
await page.evaluate(() => [...document.querySelectorAll("#create-body .pick")].find((b) => /mining/i.test(b.textContent))?.click() ?? document.querySelector("#create-body .pick")?.click());
await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
await page.click("#create-next"); await sleep(300);
await page.click("#create-next"); await sleep(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await sleep(1200);

/* a company with people on the rolls at two ports, set up through the modules */
const setup = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { stations } = await import("/js/stations.js");
  const { crew, hireCrew, stationRoster } = await import("/js/crew.js");
  const CO = await import("/js/company.js");
  const honest = stations.filter((s) => !s.hostile);
  const a = honest.find((s) => s.sector === "industrial") ?? honest[0];
  const b = honest.find((s) => s.id !== a.id);
  sim.ship.credits = 200000;
  sim.ship.dockedAt = a.id;
  CO.foundCompany("Smoke Line", "industrial");
  CO.company.treasury = 40000;
  for (const c of stationRoster(a, 1, sim.skySeed).slice(0, 3)) hireCrew(c, sim.ship, 24);
  const settled = [];
  for (const m of [...crew.aboard]) if (CO.settleAsStaff(m, [], a) === null) settled.push(m.id);
  /* one of them unhappy, so they ask */
  const s = CO.company.staff[1];
  s.mood = 30;
  const LN = await import("/js/staffline.js");
  LN.tickLine();
  sim.ship.dockedAt = null;
  return { a: a.name, b: b.name, settled: settled.length, first: CO.company.staff[0].id, asker: s.id, asks: LN.openAsk(s)?.asks ?? [] };
});
ok(setup.settled >= 2, `settled ${setup.settled} at ${setup.a}`);
ok(setup.asks.includes("bonus"), "an unhappy member is asking");

await page.evaluate(async () => (await import("/js/console/console.js")).openConsole("corp", "town"));
await sleep(700);
const town = await page.evaluate(() => ({
  line: [...document.querySelectorAll("#con-body .term-sec h3")].map((h) => h.textContent),
  askBtns: [...document.querySelectorAll("#con-body .term-sec .tbtn.accent")].map((b) => b.textContent),
  lineBtns: [...document.querySelectorAll("#con-body .tbtn")].filter((b) => b.textContent === "LINE").length,
}));
ok(town.line.some((h) => /^THE LINE/.test(h)), `THE LINE is on the page (${town.line.join(" | ")})`);
ok(town.askBtns.some((t) => /BONUS/.test(t)), "the ask carries its answers on the row");
ok(town.lineBtns >= setup.settled, `every member has a LINE button (${town.lineBtns})`);

/* open a line to the first member and check in */
await page.evaluate((id) => document.querySelector(`#con-body [data-focus="${id}"] .tbtn`)?.click(), setup.first);
await sleep(400);
await page.evaluate(() => document.querySelector('#con-body .tcard .tbtn[data-topic="checkin"]')?.click());
await sleep(400);
const call = await page.evaluate(() => {
  const card = document.querySelector("#con-body .tcard");
  return { card: Boolean(card), said: [...(card?.querySelectorAll(".in-talk-log p") ?? [])].map((p) => p.textContent), topics: [...(card?.querySelectorAll(".tbtn[data-topic]") ?? [])].map((b) => b.dataset.topic) };
});
ok(call.card, "LINE opens the person's card");
ok(call.said.some((t) => /^You: How are things/.test(t)) && call.said.length >= 2, `the check-in is in the transcript (${call.said.at(-1)?.slice(0, 70)})`);
ok(["checkin", "bonus", "raise", "promote", "family", "move", "sendfor", "release"].every((t) => call.topics.includes(t)), "every topic is on the card");

const t0 = await page.evaluate(async () => (await import("/js/company.js")).company.treasury);
await page.evaluate(() => document.querySelector('#con-body .tcard .tbtn[data-topic="bonus"]')?.click());
await sleep(400);
const t1 = await page.evaluate(async () => (await import("/js/company.js")).company.treasury);
ok(t1 < t0, `SEND A BONUS spends the treasury (${Math.round(t0 - t1)} cr)`);

/* release asks twice */
await page.evaluate(() => document.querySelector('#con-body .tcard .tbtn[data-topic="release"]')?.click());
await sleep(300);
const armed = await page.evaluate(() => document.querySelector('#con-body .tcard .tbtn[data-topic="release"]')?.textContent ?? "");
ok(/CONFIRM/.test(armed), "LET THEM GO wants a second tap");
await page.screenshot({ path: "/tmp/line-town.png" });

/* answer the ask from THE LINE */
await page.evaluate(() => [...document.querySelectorAll("#con-body .term-sec .tbtn.accent")].find((b) => /^SEND A BONUS$/.test(b.textContent))?.click());
await sleep(400);
const answered = await page.evaluate(async (id) => { const LN = await import("/js/staffline.js"); const s = LN.staffById(id); return { answered: Boolean(LN.lineState().inbox.find((m) => m.staffId === id && m.asks)?.answered), mood: s.mood }; }, setup.asker);
ok(answered.answered, "answering the ask from the inbox settles it");

/* the deck's HALL: dock at the port and LINE jumps to the person */
await page.evaluate(async () => (await import("/js/console/console.js")).closeConsole());
const deck = await page.evaluate(async () => {
  const { sim, toggleDock } = await import("/js/sim.js");
  const { stations } = await import("/js/stations.js");
  const CO = await import("/js/company.js");
  const st = stations.find((s) => s.id === CO.company.hq);
  const m = st.hangars[0];
  sim.ship.pos.x = st.x + m.x + m.dir.x * 60; sim.ship.pos.y = st.y + m.y + m.dir.y * 60; sim.ship.pos.z = st.z + m.z + m.dir.z * 60;
  sim.ship.vel.x = st.vx; sim.ship.vel.y = st.vy; sim.ship.vel.z = st.vz;
  await new Promise((r) => setTimeout(r, 300));
  toggleDock();
  for (let i = 0; i < 150 && sim.ship.dockedAt !== st.id; i++) await new Promise((r) => setTimeout(r, 500));
  await new Promise((r) => setTimeout(r, 900));
  document.querySelector('#sd-tabs button[data-sd="hall"]')?.click();
  await new Promise((r) => setTimeout(r, 600));
  const btns = [...document.querySelectorAll("#sd-body .sd-btn")].filter((b) => b.textContent === "LINE");
  btns[0]?.click();
  await new Promise((r) => setTimeout(r, 700));
  const C = await import("/js/console/console.js");
  return { docked: sim.ship.dockedAt === st.id, lineBtns: btns.length, open: C.console.open || sim.terminalOpen, inline: Boolean(document.querySelector("#sd-body .sd-line")), topics: document.querySelectorAll("#sd-body .sd-line .sd-btn").length };
});
ok(deck.docked, "docked at the company's port");
ok(deck.lineBtns >= 1, `the HALL lists the company's people here with LINE (${deck.lineBtns})`);
/* 0.3.49: the deck keeps you in the station — the line opens inline, the console stays shut */
ok(deck.inline && deck.topics >= 5 && !deck.open, `LINE on the deck opens the line inline, in station style (${deck.topics} topics, console ${deck.open ? "OPEN" : "closed"})`);
await page.screenshot({ path: "/tmp/line-deck.png" });

ok(!errors.length, `no page errors (${errors.length})`);
await browser.close();
const bad = checks.filter(([c]) => !c);
if (bad.length) { console.error(`smoke-line: ${bad.length} failed`); process.exit(1); }
console.log("smoke-line: all green");
