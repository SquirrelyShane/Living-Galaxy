/* Living Galaxy — headless smoke for CREW › GENOME and CREW › LOG.
 *
 * Signs a crew on at a port, runs pay cycles so deckmind files decisions,
 * then opens both new sub-tabs and checks that a real body and a real
 * decision record render on a portrait phone without overflowing the sheet.
 *
 *   node test/smoke-genome.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });

const fail = (m) => { console.error("FAIL", m); errors.push(m); };

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "GeneSmoke");
await page.click("#btn-create");
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await page.waitForTimeout(600);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await page.waitForTimeout(600);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await page.waitForTimeout(1500);

/* dock, hire a watch, and run enough cycles for the book to fill */
const hired = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { stations } = await import("/js/stations.js");
  const { crew, hireCrew, stationRoster } = await import("/js/crew.js");
  const { setSocial } = await import("/js/family.js");
  const { runDeckCycle } = await import("/js/crew/deckmind.js");
  sim.ship.credits = 500000;
  sim.crewCapacity = 8;
  setSocial({ romance: "crew", family: true });
  const st = stations[0];
  for (const c of stationRoster(st, 0, sim.skySeed).slice(0, 5)) hireCrew(c, sim.ship, 8);
  for (let i = 0; i < 8; i++) { sim.time += 90; runDeckCycle(); }
  return { aboard: crew.aboard.length, withGenome: crew.aboard.filter((m) => m.genome).length };
});
console.log("hired:", JSON.stringify(hired));
if (hired.aboard < 4) fail("could not sign a watch on");
if (hired.withGenome !== hired.aboard) fail("a hand came aboard without a genome");

/* CREW › GENOME */
await page.evaluate(() => window.__lg.console.openConsole("crew", "genome"));
await page.waitForTimeout(700);
const gene = await page.evaluate(() => {
  const body = document.querySelector("#con-body");
  const secs = [...body.querySelectorAll(".term-sec")].map((s) => s.querySelector("h4,.tsec-title,header")?.textContent?.trim() ?? "");
  const rows = [...body.querySelectorAll(".trow")];
  const find = (label) => rows.find((r) => r.querySelector(".k")?.firstChild?.textContent?.trim() === label)?.querySelector(".v")?.textContent ?? "";
  return {
    subs: [...document.querySelectorAll("#con-subtabs .con-sub")].map((b) => b.textContent),
    secs: secs.filter(Boolean),
    fingerprint: find("Genome"),
    tier: find("Tier"),
    bars: body.querySelectorAll(".tbar").length,
    mono: (body.querySelector(".tmono")?.textContent ?? "").slice(0, 14),
    overflow: body.scrollWidth > body.clientWidth + 1,
  };
});
console.log("crew › genome:", JSON.stringify(gene));
if (!gene.subs.includes("GENOME") || !gene.subs.includes("LOG")) fail("the new sub-tabs are not on the strip");
if (!/^[0-9A-Z]{7}$/.test(gene.fingerprint)) fail(`no genome fingerprint rendered (${gene.fingerprint})`);
if (gene.tier !== "cultural") fail(`unexpected capability tier: ${gene.tier}`);
if (gene.bars < 20) fail(`expected trait/aptitude/need bars, got ${gene.bars}`);
if (!gene.mono.startsWith("p1:spacer:")) fail("the packed genome is not on the record view");
if (gene.overflow) fail("GENOME overflows the sheet sideways at 412 px");
await page.screenshot({ path: "/tmp/ui-crew-genome.png" });

/* CREW › LOG */
await page.evaluate(() => window.__lg.console.openConsole("crew", "log"));
await page.waitForTimeout(700);
const log = await page.evaluate(() => {
  const body = document.querySelector("#con-body");
  const cards = [...body.querySelectorAll(".tlogcard")];
  const first = cards[0];
  return {
    cards: cards.length,
    title: first?.querySelector("h4,header")?.textContent?.trim() ?? first?.textContent?.slice(0, 30) ?? "",
    reasons: first?.querySelectorAll(".treason li").length ?? 0,
    path: (first?.querySelector(".tpath")?.textContent ?? "").split("›").length,
    fx: Boolean(first?.querySelector(".tfx")),
    habits: Boolean(body.querySelector(".tfx")),
    overflow: body.scrollWidth > body.clientWidth + 1,
  };
});
console.log("crew › log:", JSON.stringify(log));
if (!log.cards) fail("no decision records rendered");
if (log.reasons < 2) fail("a record rendered without its chain of reasoning");
if (log.path < 3) fail("a record rendered without its graph path");
if (log.overflow) fail("LOG overflows the sheet sideways at 412 px");
await page.screenshot({ path: "/tmp/ui-crew-log.png" });

/* the flight recorder */
const exported = await page.evaluate(async () => {
  const btn = [...document.querySelectorAll("#con-body .tbtn")].find((b) => /EXPORT/.test(b.textContent));
  btn?.click();
  await new Promise((r) => setTimeout(r, 400));
  const txt = document.querySelectorAll("#con-body .tmono")[0]?.textContent ?? "";
  let parsed = null;
  try { parsed = JSON.parse(txt); } catch { /* not JSON */ }
  return { kb: Math.round(txt.length / 1024), people: parsed?.records?.length ?? 0, filed: parsed?.counts?.filed ?? 0 };
});
console.log("flight recorder:", JSON.stringify(exported));
if (!exported.people || !exported.filed) fail("the flight recorder exported nothing");

/* the training corpus */
const corpus = await page.evaluate(async () => {
  const btn = [...document.querySelectorAll("#con-body .tbtn")].find((b) => /CORPUS/.test(b.textContent));
  btn?.click();
  await new Promise((r) => setTimeout(r, 400));
  const txt = document.querySelectorAll("#con-body .tmono")[0]?.textContent ?? "";
  const lines = txt.split("\n").filter(Boolean);
  let first = null;
  try { first = JSON.parse(lines[0]); } catch { /* not JSONL */ }
  return { lines: lines.length, features: first?.features?.length ?? 0, kind: first?.kind ?? "", reward: typeof first?.reward };
});
console.log("training corpus:", JSON.stringify(corpus));
if (!corpus.lines || corpus.features !== 16) fail("the training corpus did not export as JSONL");

/* CREW › BONDS: the ladder, and HOUSE: the switches */
const ladder = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { setSocial } = await import("/js/family.js");
  const { runDeckCycle } = await import("/js/crew/deckmind.js");
  const R = await import("/js/crew/romance.js");
  const { ladderReport, pairOf } = R;
  const { crew } = await import("/js/crew.js");
  const { journal } = await import("/js/crew/journal.js");
  setSocial({ romance: "crew", family: true, adult: true, contraception: false });
  sim.crewCapacity = 12;
  for (let i = 0; i < 150; i++) { sim.time += 90; sim.ship.dockedAt = i % 4 === 0 ? "foundry-hold" : null; runDeckCycle(); }
  sim.ship.dockedAt = null;
  window.__lg.console.openConsole("crew", "bonds");
  await new Promise((r) => setTimeout(r, 700));
  const body = document.querySelector("#con-body");
  return {
    pairs: ladderReport().length,
    stages: [...new Set(ladderReport().map((r) => r.stage))],
    sparks: ladderReport().map((r) => Math.round(r.spark)),
    topSpark: Math.round(Math.max(0, ...crew.aboard.flatMap((a, i) => crew.aboard.slice(i + 1).map((b2) => pairOf(a, b2).spark)))),
    partners: crew.aboard.filter((m) => m.partner).length,
    mates: journal.all().filter((r) => r.action.kind === "mate").length,
    bars: body.querySelectorAll(".tbar").length,
    overflow: body.scrollWidth > body.clientWidth + 1,
  };
});
console.log("crew › bonds:", JSON.stringify(ladder));
if (!ladder.pairs) fail("no pair is on the ladder at all");
if (ladder.topSpark < 20) fail(`150 watches together moved nothing between anybody (top spark ${ladder.topSpark})`);
if (ladder.stages.length === 1 && ladder.stages[0] === "strangers" && ladder.topSpark < 80) {
  fail(`nobody got anywhere in 150 watches (top spark ${ladder.topSpark})`);
}
if (!ladder.bars) fail("the ladder did not render");
if (ladder.overflow) fail("BONDS overflows the sheet sideways at 412 px");
await page.screenshot({ path: "/tmp/ui-crew-bonds.png" });

const house = await page.evaluate(async () => {
  window.__lg.console.openConsole("crew", "house");
  await new Promise((r) => setTimeout(r, 600));
  const body = document.querySelector("#con-body");
  const labels = [...body.querySelectorAll(".trow .k")].map((k) => k.firstChild?.textContent?.trim());
  return { labels: labels.filter(Boolean), overflow: body.scrollWidth > body.clientWidth + 1 };
});
console.log("crew › house:", JSON.stringify(house.labels));
/* This row is named to say what it actually is */
const privacyRow = house.labels.includes("Private evenings") || house.labels.includes("Adult");
if (!privacyRow || !house.labels.includes("Berths with a door")) fail("the house rules are missing the new switches");
if (house.overflow) fail("HOUSE overflows the sheet sideways at 412 px");

/* CREW › SKY: the rest of the board */
const sky = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { stepTraffic } = await import("/js/npc/traffic.js");
  const { tickNpcCrews, npcCrews, crewCensus } = await import("/js/npc/npccrew.js");
  for (let i = 0; i < 14; i++) { sim.time += 90; stepTraffic(sim.time, 90); tickNpcCrews(); }
  window.__lg.console.openConsole("crew", "sky");
  await new Promise((r) => setTimeout(r, 700));
  const body = document.querySelector("#con-body");
  const cards = [...body.querySelectorAll(".tcard, .term-card, [class*=card]")];
  return {
    built: npcCrews.built,
    census: crewCensus().length,
    stepped: npcCrews.stepped,
    cards: cards.length,
    rows: body.querySelectorAll(".trow").length,
    bars: body.querySelectorAll(".tbar").length,
    text: (body.textContent ?? "").slice(0, 0),
    overflow: body.scrollWidth > body.clientWidth + 1,
  };
});
console.log("crew › sky:", JSON.stringify(sky));
if (!sky.built) fail("no NPC crews were built");
if (sky.stepped > 18) fail(`the work budget was exceeded (${sky.stepped})`);
if (sky.bars < 4) fail("no watches rendered on the SKY tab");
if (sky.overflow) fail("SKY overflows the sheet sideways at 412 px");
await page.screenshot({ path: "/tmp/ui-crew-sky.png" });

/* open one vessel's log */
const skyLog = await page.evaluate(async () => {
  const btn = [...document.querySelectorAll("#con-body .tbtn")].find((b) => /^LOG/.test(b.textContent));
  btn?.click();
  await new Promise((r) => setTimeout(r, 500));
  const body = document.querySelector("#con-body");
  return { opened: Boolean([...body.querySelectorAll(".tbtn")].find((b) => /LOG ▾/.test(b.textContent))), lines: body.querySelectorAll(".tfx").length };
});
console.log("crew › sky › log:", JSON.stringify(skyLog));
if (!skyLog.opened) fail("a vessel's log would not open");

/* the roster card carries what they last decided */
await page.evaluate(() => window.__lg.console.openConsole("crew", "roster"));
await page.waitForTimeout(600);
const roster = await page.evaluate(() => {
  const rows = [...document.querySelectorAll("#con-body .trow")];
  const r = rows.find((x) => x.querySelector(".k")?.firstChild?.textContent?.trim() === "On their mind");
  return { value: r?.querySelector(".v")?.textContent ?? "", hint: r?.querySelector(".k small")?.textContent ?? "" };
});
console.log("roster › on their mind:", JSON.stringify(roster));
if (!roster.value || roster.value === "—") fail("the roster card is not showing the last decision");

await browser.close();
if (errors.length) { console.error(`genome smoke FAILED (${errors.length})`); process.exit(1); }
console.log("genome smoke OK");
