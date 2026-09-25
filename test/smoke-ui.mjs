/* Headless smoke for the glass skin + CONSOLE: creation compile block, the
 * console (tabs, SHIP › SYSTEMS rule grid, jump search), telemetry charts,
 * hiring hall cards, the robots tab. Portrait phone.
 *   node test/smoke-ui.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "SkinSmoke");
await page.click("#btn-create");
await page.waitForTimeout(300);
/* pick a race: the compile block should appear and fill */
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await page.waitForTimeout(700);
const compile1 = await page.evaluate(() => {
  const c = document.querySelector("#create-body .compile");
  const cells = c ? [...c.querySelectorAll(".gcell")] : [];
  return { present: Boolean(c), bars: c?.querySelectorAll(".gbar").length ?? 0, lit: cells.filter((x) => x.classList.contains("lit")).length, sigil: c?.querySelector(".compile-sigil")?.textContent ?? "" };
});
console.log("creation compile:", JSON.stringify(compile1));
await page.screenshot({ path: "/tmp/ui-create.png" });
await page.click("#create-next");
await page.waitForTimeout(300);
await page.evaluate(() => [...document.querySelectorAll("#create-body .pick")].find((b) => /mining/i.test(b.textContent))?.click() ?? document.querySelector("#create-body .pick")?.click());
/* the sigil settles on rAF cadence, which a software GL stack drags out */
await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(300);
const compile2 = await page.evaluate(() => {
  const c = document.querySelector("#create-body .compile");
  return { bars: c?.querySelectorAll(".gbar").length ?? 0, sigilSet: Boolean(c?.querySelector(".compile-sigil.set")) };
});
console.log("after career pick:", JSON.stringify(compile2));
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await page.waitForTimeout(1500);

/* the console: CON opens it, six tabs */
await page.click("#btn-con");
await page.waitForTimeout(400);
const shell = await page.evaluate(() => ({
  open: !document.querySelector("#console").classList.contains("hidden"),
  tabs: [...document.querySelectorAll("#con-tabs button[data-panel]")].map((b) => b.dataset.panel),
  subs: [...document.querySelectorAll("#con-subtabs .con-sub")].map((b) => b.textContent),
  sections: document.querySelectorAll("#con-body .term-sec").length,
}));
console.log("console:", JSON.stringify(shell));
await page.screenshot({ path: "/tmp/ui-con-ship.png" });
/* SHIP › SYSTEMS: the ENEMIES rule sets the turret mode */
await page.evaluate(() => [...document.querySelectorAll("#con-subtabs .con-sub")].find((b) => /SYSTEMS/.test(b.textContent))?.click());
await page.waitForTimeout(250);
await page.evaluate(() => [...document.querySelectorAll("#con-body .tmode")].find((b) => /ENEMIES/i.test(b.textContent))?.click());
await page.waitForTimeout(600);
const tmode = await page.evaluate(async () => (await import("/js/sim.js")).sim.ship.turretMode);
const onGrid = await page.evaluate(() => [...document.querySelectorAll("#con-body .tmode.on")].map((b) => b.querySelector("b")?.textContent));
console.log("turret mode via console:", tmode, "lit:", onGrid.join(" | "));
await page.screenshot({ path: "/tmp/ui-con-systems.png" });
/* the jump box: "ice" hits Ice works and lands on MARKET › HOLD */
await page.fill("#con-q", "ice");
await page.waitForTimeout(250);
const search = await page.evaluate(() => [...document.querySelectorAll("#con-hits .cmd-row .cmd-label")].map((x) => x.textContent));
console.log("search 'ice':", search.join(" | "));
await page.screenshot({ path: "/tmp/ui-con-search.png" });
await page.evaluate(() => [...document.querySelectorAll("#con-hits .cmd-row")].find((r) => /Ice works/.test(r.textContent))?.click());
await page.waitForTimeout(400);
const landed = await page.evaluate(() => ({
  panel: document.querySelector("#con-tabs button.on")?.dataset.panel,
  sub: document.querySelector("#con-subtabs .con-sub.on")?.textContent,
  focused: Boolean(document.querySelector("#con-body [data-focus='ice-works'].focus")),
  recents: [...document.querySelectorAll("#con-recents .cmd-chip")].map((c) => c.textContent),
}));
console.log("landed:", JSON.stringify(landed));
await page.click("#con-close");
await page.waitForTimeout(200);
const closed = await page.evaluate(async () => ({ hidden: document.querySelector("#console").classList.contains("hidden"), flag: (await import("/js/sim.js")).sim.terminalOpen }));
console.log("closed:", JSON.stringify(closed));

/* telemetry after a few samples: SHIP › STATUS rings and sparklines */
await page.evaluate(async () => { const { sim } = await import("/js/sim.js"); sim.timeScale = 40; });
await page.waitForTimeout(2500);
await page.evaluate(async () => { const { sim, setTerminal } = await import("/js/sim.js"); sim.timeScale = 1; window.__lg.console.openConsole("ship", "status"); setTerminal(true); });
await page.waitForTimeout(700);
const tele = await page.evaluate(() => ({
  rings: document.querySelectorAll("#con-body .ring").length,
  sparks: document.querySelectorAll("#con-body .spark").length,
  points: (document.querySelector("#con-body .spark-line")?.getAttribute("points") ?? "").split(" ").length,
  overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  sheetOverflow: (document.querySelector("#con-body")?.scrollWidth ?? 0) > (document.querySelector("#con-body")?.clientWidth ?? 0) + 2,
}));
console.log("telemetry:", JSON.stringify(tele));
await page.screenshot({ path: "/tmp/ui-con-status.png" });
await page.evaluate(async () => (await import("/js/sim.js")).setTerminal(false));

/* dock by teleport to the hangar mouth: DOCK hands the helm to the tractor, which lands you; then open the hiring hall */
const hall = await page.evaluate(async () => {
  const { sim, toggleDock } = await import("/js/sim.js");
  const { stations } = await import("/js/stations.js");
  const st = stations.find((s) => s.sector === "industrial") ?? stations.find((s) => s.sector !== "pirate");
  const m = st.hangars[0];
  sim.ship.pos.x = st.x + m.x + m.dir.x * 60; sim.ship.pos.y = st.y + m.y + m.dir.y * 60; sim.ship.pos.z = st.z + m.z + m.dir.z * 60;
  sim.ship.vel.x = st.vx; sim.ship.vel.y = st.vy; sim.ship.vel.z = st.vz;
  await new Promise((r) => setTimeout(r, 300));
  toggleDock();
  /* the tractor pull runs ~38 sim-s under swiftshader; 30 s of polling expired before the clamps did */
  for (let i = 0; i < 150 && sim.ship.dockedAt !== st.id; i++) await new Promise((r) => setTimeout(r, 500));
  await new Promise((r) => setTimeout(r, 900));
  document.querySelector('#sd-tabs button[data-sd="hall"]')?.click();
  await new Promise((r) => setTimeout(r, 1200));
  const out = { docked: sim.ship.dockedAt === st.id, port: st.name, sector: st.sector, cards: document.querySelectorAll("#sd-body .sd-person").length, radars: document.querySelectorAll("#sd-body .radar").length, lit: document.querySelectorAll("#sd-body .gcell.lit").length, crewJump: Boolean([...document.querySelectorAll("#sd-body .sd-btn")].find((b) => /^CON › CREW$/.test(b.textContent))) };
  document.querySelector('#sd-tabs button[data-sd="market"]')?.click();
  await new Promise((r) => setTimeout(r, 300));
  out.marketSecs = [...document.querySelectorAll("#sd-body .sd-sec h4")].map((h) => h.textContent);
  document.querySelector('#sd-tabs button[data-sd="robots"]')?.click();
  await new Promise((r) => setTimeout(r, 300));
  out.robotCards = document.querySelectorAll("#sd-body .trow, #sd-body .sd-row, #sd-body .tcard").length;
  return out;
});
console.log("hiring hall:", JSON.stringify(hall));
await page.screenshot({ path: "/tmp/ui-hall.png" });

await browser.close();
const fails = [];
if (!compile1.present || compile1.bars < 1 || compile1.lit < 1) fails.push("creation compile block");
if (!compile2.sigilSet) fails.push("sigil never settled");
if (!shell.open || shell.tabs.length !== 6 || shell.sections < 1) fails.push("console shell");
if (tmode !== "enemies") fails.push("console rule grid did not set turret mode");
if (!search.some((r) => /Ice works/.test(r))) fails.push("console search");
if (landed.panel !== "market" || !/HOLD/.test(landed.sub ?? "")) fails.push("jump did not land on MARKET › HOLD");
if (!closed.hidden || closed.flag) fails.push("close did not clear terminalOpen");
if (tele.rings < 4 || tele.sparks < 4 || tele.points < 2) fails.push("telemetry charts");
if (tele.overflow || tele.sheetOverflow) fails.push("horizontal overflow at 412 px");
if (!hall.docked || hall.cards < 1 || hall.radars < 1) fails.push("hiring hall cards");
if (!hall.crewJump) fails.push("deck hall has no CON › CREW jump");
if (!hall.marketSecs.some((h) => /THEY SELL/.test(h))) fails.push("deck market block");
/* the robots tab is package D's fragment; until it lands the tab is simply empty */
if (hall.sector === "industrial" && hall.robotCards < 3) console.warn("note: robots tab has fewer than 3 cards at an industrial port (package D pending?)");
if (errors.length) fails.push(`page errors: ${errors.join("; ")}`);
if (fails.length) { console.error("FAIL:", fails.join("; ")); process.exit(1); }
console.log("ui smoke OK");
