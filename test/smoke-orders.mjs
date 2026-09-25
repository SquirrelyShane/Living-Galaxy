/* 0.3.53 — doing something about it, in a real browser, portrait phone:
 *   CREW › GENOME: every need has an order button; an order is a real watch
 *     (the need comes down) and there is one a watch; TRAIN marks a skill;
 *     ENCOURAGE is once a habit a watch; nothing overflows the sheet
 *   CORP › TOWN: a settled hand's card carries WORK · HOME · CARE — a shift
 *     change and a DAY OFF land
 *   the deck's HALL: the same menu in station style; a meal spends the treasury
 *   node test/smoke-orders.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
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
await page.fill("#callsign", "OrderSmoke");
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

const setup = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { stations } = await import("/js/stations.js");
  const { crew, hireCrew, stationRoster } = await import("/js/crew.js");
  const DM = await import("/js/crew/deckmind.js");
  const honest = stations.filter((s) => !s.hostile);
  const a = honest.find((s) => s.sector === "industrial") ?? honest[0];
  sim.ship.credits = 200000;
  for (const c of stationRoster(a, 1, sim.skySeed).slice(0, 3)) hireCrew(c, sim.ship, 24);
  const m = crew.aboard[0];
  DM.needsOf(m).fatigue = 0.92;
  return { port: a.id, n: crew.aboard.length, id: m.id };
});
ok(setup.n >= 2, `${setup.n} aboard`);

/* ---- CREW › GENOME ---- */
await page.evaluate(async () => (await import("/js/console/console.js")).openConsole("crew", "genome"));
await sleep(900);
const g0 = await page.evaluate(() => ({
  orders: [...document.querySelectorAll("#con-body .tbtn[data-order]")].map((b) => [b.dataset.order, b.textContent, b.disabled]),
  train: document.querySelectorAll("#con-body .tbtn[data-train]").length,
  coach: document.querySelectorAll("#con-body .tbtn[data-coach]").length,
  overflow: document.querySelector("#con-body").scrollWidth > document.querySelector("#con-body").clientWidth + 1,
}));
ok(g0.orders.length === 9, `nine needs, nine orders (${g0.orders.map((o) => o[1]).join(", ")})`);
ok(g0.train >= 3 && g0.coach >= 6, `TRAIN on the aptitudes (${g0.train}), + and − on the learned habits (${g0.coach})`);
ok(!g0.overflow, "the sheet does not overflow sideways");
await page.evaluate(() => document.querySelector('#con-body .tbtn[data-order="fatigue"]')?.click());
await sleep(500);
const g1 = await page.evaluate(async (id) => {
  const { crew } = await import("/js/crew.js");
  const m = crew.aboard.find((x) => x.id === id);
  return { fatigue: m.need.fatigue, disabled: [...document.querySelectorAll("#con-body .tbtn[data-order]")].every((b) => b.disabled), said: document.querySelector("#con-body .term-sec p.warm")?.textContent ?? "" };
}, setup.id);
ok(g1.fatigue < 0.7, `STAND DOWN takes the tiredness off (0.92 → ${g1.fatigue.toFixed(2)})`);
ok(g1.disabled, "and every order is spent for this watch");
ok(g1.said.length > 10, `the sheet says what happened ("${g1.said.slice(0, 70)}")`);
await page.evaluate(() => document.querySelector("#con-body .tbtn[data-train]")?.click());
await sleep(400);
const tr = await page.evaluate(async (id) => { const { crew } = await import("/js/crew.js"); return { focus: crew.aboard.find((x) => x.id === id).trainFocus, label: [...document.querySelectorAll("#con-body .tbtn[data-train]")].map((b) => b.textContent) }; }, setup.id);
ok(tr.focus && tr.label.includes("TRAINING"), `TRAIN sets a skill (${tr.focus})`);
await page.evaluate(() => document.querySelector('#con-body .tbtn[data-coach$=":+"]')?.click());
await sleep(400);
const co = await page.evaluate(() => document.querySelector('#con-body .tbtn[data-coach$=":+"]')?.disabled);
ok(co, "ENCOURAGE is once a habit a watch");
await page.screenshot({ path: "/tmp/orders-genome.png" });
await page.evaluate(() => [...document.querySelectorAll("#con-body .term-sec")].find((x) => /CARRYING/.test(x.querySelector("h3")?.textContent ?? ""))?.setAttribute("data-shot", "carrying"));
await page.locator('#con-body [data-shot="carrying"]').screenshot({ path: "/tmp/orders-carrying.png" }).catch(() => {});

/* ---- CORP › TOWN ---- */
const co2 = await page.evaluate(async (port) => {
  const { sim } = await import("/js/sim.js");
  const { crew } = await import("/js/crew.js");
  const CO = await import("/js/company.js");
  sim.ship.dockedAt = port;
  CO.foundCompany("Smoke Orders", "industrial");
  CO.company.treasury = 40000;
  const st = (await import("/js/stations.js")).stationById(port);
  for (const m of [...crew.aboard].slice(1)) CO.settleAsStaff(m, [], st);
  sim.ship.dockedAt = null;
  return { staff: CO.company.staff.length, first: CO.company.staff[0]?.id };
}, setup.port);
ok(co2.staff >= 1, `${co2.staff} settled`);
await page.evaluate(async () => (await import("/js/console/console.js")).openConsole("corp", "town"));
await sleep(900);
await page.evaluate((id) => [...document.querySelectorAll(`#con-body [data-focus="${id}"] .tbtn`)].find((b) => b.textContent === "LINE")?.click(), co2.first);
await sleep(600);
const town = await page.evaluate(() => {
  const card = document.querySelector("#con-body .tcard");
  return { care: Boolean(card?.querySelector(".tcare")), selects: card?.querySelectorAll(".tcare select").length ?? 0, btns: [...(card?.querySelectorAll(".tcare .tbtn[data-care]") ?? [])].map((b) => b.dataset.care), now: card?.querySelector("p.warm")?.textContent ?? "" };
});
ok(town.care && town.selects === 4 && ["dayoff", "meal", "night", "course"].every((c) => town.btns.includes(c)), `the card carries WORK · HOME · CARE (${town.selects} pickers, ${town.btns.join(", ")})`);
ok(/^Now: /.test(town.now), `and what they are doing (${town.now})`);
await page.evaluate(() => { const s = document.querySelector('#con-body .tcare select[data-care="shift"]'); s.value = "night"; s.dispatchEvent(new Event("change")); });
await sleep(500);
await page.evaluate(() => document.querySelector('#con-body .tcare .tbtn[data-care="dayoff"]')?.click());
await sleep(500);
const town2 = await page.evaluate(async (id) => { const CO = await import("/js/company.js"); const s = CO.company.staff.find((x) => x.id === id); return { shift: s.shift, off: s.offShift?.kind, terms: document.querySelector("#con-body .tcare small")?.textContent ?? "", overflow: document.querySelector("#con-body").scrollWidth > document.querySelector("#con-body").clientWidth + 1 }; }, co2.first);
ok(town2.shift === "night" && /night shift/.test(town2.terms), `a shift change lands (${town2.terms})`);
ok(town2.off === "off", "and a DAY OFF takes their next shift");
ok(!town2.overflow, "the town page does not overflow sideways");
await page.screenshot({ path: "/tmp/orders-town.png" });
await page.locator("#con-body .tcard").first().screenshot({ path: "/tmp/orders-towncard.png" }).catch(() => {});

/* ---- the deck's HALL ---- */
await page.evaluate(async () => (await import("/js/console/console.js")).closeConsole());
const hall = await page.evaluate(async (port) => {
  const { sim, toggleDock } = await import("/js/sim.js");
  const { stationById } = await import("/js/stations.js");
  const CO = await import("/js/company.js");
  const st = stationById(port);
  const m = st.hangars[0];
  sim.ship.pos.x = st.x + m.x + m.dir.x * 60; sim.ship.pos.y = st.y + m.y + m.dir.y * 60; sim.ship.pos.z = st.z + m.z + m.dir.z * 60;
  sim.ship.vel.x = st.vx; sim.ship.vel.y = st.vy; sim.ship.vel.z = st.vz;
  await new Promise((r) => setTimeout(r, 300));
  toggleDock();
  for (let i = 0; i < 150 && sim.ship.dockedAt !== st.id; i++) await new Promise((r) => setTimeout(r, 500));
  await new Promise((r) => setTimeout(r, 900));
  document.querySelector('#sd-tabs button[data-sd="hall"]')?.click();
  await new Promise((r) => setTimeout(r, 600));
  [...document.querySelectorAll("#sd-body [data-staff] .sd-btn")].find((b) => b.textContent === "LINE")?.click();
  await new Promise((r) => setTimeout(r, 600));
  const care = document.querySelector("#sd-body .sd-care");
  const t0 = CO.company.treasury;
  care?.querySelector('.sd-btn[data-care="meal"]')?.click();
  await new Promise((r) => setTimeout(r, 500));
  const sub = document.getElementById("sd-sub")?.textContent ?? "";
  return { docked: sim.ship.dockedAt === st.id, care: Boolean(care), selects: care?.querySelectorAll("select").length ?? 0, spent: t0 - CO.company.treasury, now: document.querySelector("#sd-body .sd-now")?.textContent ?? "", sub, deckOpen: !document.getElementById("station-deck").classList.contains("hidden") };
}, setup.port);
ok(hall.docked && hall.deckOpen, "docked, on the deck");
ok(hall.care && hall.selects === 4, "HALL › LINE carries the same menu in station style");
ok(hall.spent > 0, `a meal on the company spends the treasury (${hall.spent} cr)`);
ok(/^NOW — /.test(hall.now), `and says what they are doing (${hall.now.slice(0, 60)})`);
ok(/shift/.test(hall.sub) && /\d\d:\d\d/.test(hall.sub), `the deck header keeps the port's hours (${hall.sub})`);
await page.screenshot({ path: "/tmp/orders-hall.png" });
await page.evaluate(() => document.querySelector("#sd-body .sd-line")?.scrollIntoView({ block: "start" }));
await sleep(300);
await page.screenshot({ path: "/tmp/orders-hallcard.png" });

ok(!errors.length, `no page errors (${errors.length})`);
await browser.close();
const bad = checks.filter(([c]) => !c);
if (bad.length) { console.error(`smoke-orders: ${bad.length} failed`); process.exit(1); }
console.log("smoke-orders: all green");
