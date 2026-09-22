/* Living Galaxy — headless smoke for CORP › MARSHAL and CREW › BRIG.
 *
 * Signs for a mark, takes them off a station, and works on them in the cell —
 * checking that both panels render a real board and a real person on a
 * portrait phone without overflowing the sheet.
 *
 *   node test/smoke-bounty.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });
const fail = (m) => { console.error("FAIL", m); errors.push(m); };

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "BountySmoke");
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

/* the sky's gender mix, as the player actually meets it */
const mix = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { stations } = await import("/js/stations.js");
  const { stationRoster } = await import("/js/crew.js");
  const { traffic } = await import("/js/npc/traffic.js");
  const { cradle } = await import("/js/npc/cradle.js");
  const seen = { woman: 0, man: 0, nonbinary: 0 };
  for (const st of stations.slice(0, 6)) for (const c of stationRoster(st, 0, sim.skySeed)) seen[c.gender]++;
  for (const v of traffic) { const r = cradle.get(v.recId); if (r?.gender) seen[r.gender]++; }
  const n = seen.woman + seen.man + seen.nonbinary;
  return { ...seen, n, womenPc: Math.round((seen.woman / n) * 100), nbPc: Math.round((seen.nonbinary / n) * 100) };
});
console.log("who is out there:", JSON.stringify(mix));
if (mix.womenPc < 33) fail(`only ${mix.womenPc}% of the people you can actually meet are women`);
if (mix.nbPc > 15) fail(`${mix.nbPc}% nonbinary is still the old bell curve`);

/* sign for a mark and take them */
const took = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { stations } = await import("/js/stations.js");
  const { crew, hireCrew, stationRoster } = await import("/js/crew.js");
  const { boardAt, takeTicket, attemptCapture } = await import("/js/npc/bounty.js");
  const { boarding } = await import("/js/interior/boarding.js");
  sim.ship.credits = 500000;
  sim.crewCapacity = 8;
  for (const c of stationRoster(stations[0], 0, sim.skySeed).slice(0, 4)) hireCrew(c, sim.ship, 8);
  const port = stations.find((s) => s.id && s.sector !== "pirate");
  sim.ship.dockedAt = port.id;
  const marks = boardAt(port);
  const m = marks[0];
  takeTicket(m);
  sim.ship.dockedAt = m.holedAt;
  const r = attemptCapture(m, { rng: () => 0.01 });
  sim.ship.dockedAt = port.id;
  return { marks: marks.length, taken: Boolean(r.taken), brig: boarding.brig.length, name: boarding.brig[0]?.name ?? null };
});
console.log("marshal:", JSON.stringify(took));
if (!took.marks) fail("the board was empty");
if (!took.taken || !took.brig) fail("the capture did not land");

/* CORP › MARSHAL */
const marshal = await page.evaluate(async () => {
  window.__lg.console.openConsole("corp", "marshal");
  await new Promise((r) => setTimeout(r, 700));
  const body = document.querySelector("#con-body");
  const rows = [...body.querySelectorAll(".trow .k")].map((k) => k.firstChild?.textContent?.trim()).filter(Boolean);
  return {
    subs: [...document.querySelectorAll("#con-subtabs .con-sub")].map((b) => b.textContent),
    rows: [...new Set(rows)].slice(0, 10),
    buttons: [...body.querySelectorAll(".tbtn")].map((b) => b.textContent).slice(0, 6),
    overflow: body.scrollWidth > body.clientWidth + 1,
  };
});
console.log("corp › marshal:", JSON.stringify(marshal));
if (!marshal.subs.includes("MARSHAL")) fail("the MARSHAL sub-tab is not on the strip");
if (!marshal.rows.includes("Costs you")) fail("the board does not show what a ticket costs in standing");
if (marshal.overflow) fail("MARSHAL overflows the sheet sideways at 412 px");
await page.screenshot({ path: "/tmp/ui-marshal.png" });

/* CREW › BRIG */
const brig = await page.evaluate(async () => {
  window.__lg.console.openConsole("crew", "brig");
  await new Promise((r) => setTimeout(r, 700));
  const body = document.querySelector("#con-body");
  const open = [...body.querySelectorAll(".tbtn")].find((b) => /OPEN CELL/.test(b.textContent));
  open?.click();
  await new Promise((r) => setTimeout(r, 500));
  const rows = [...body.querySelectorAll(".trow .k")].map((k) => k.firstChild?.textContent?.trim()).filter(Boolean);
  const feed = [...body.querySelectorAll(".trow")].find((r) => /Bring them a meal/.test(r.textContent));
  feed?.querySelector(".tbtn")?.click();
  await new Promise((r) => setTimeout(r, 400));
  const { captiveById, captiveState } = await import("/js/crew/captive.js");
  const { boarding } = await import("/js/interior/boarding.js");
  const p = boarding.brig[0];
  const st = p ? captiveState(p) : null;
  return {
    subs: [...document.querySelectorAll("#con-subtabs .con-sub")].map((b) => b.textContent),
    rows: [...new Set(rows)],
    bars: body.querySelectorAll(".tbar").length,
    actions: [...body.querySelectorAll(".trow")].filter((r) => /Bring them|Sit and talk|work out|clean clothes/.test(r.textContent)).length,
    resistance: st ? Math.round(st.resistance) : null,
    regard: st ? Math.round(st.regard) : null,
    fed: st ? st.done.feed != null : false,
    overflow: body.scrollWidth > body.clientWidth + 1,
  };
});
console.log("crew › brig:", JSON.stringify(brig));
if (!brig.subs.includes("BRIG")) fail("the BRIG sub-tab is not on the strip");
if (!brig.rows.includes("Resistance") || !brig.rows.includes("What they make of you")) fail("the two numbers are not on the card");
if (brig.actions < 4) fail(`only ${brig.actions} things you can do for somebody rendered`);
if (!brig.fed) fail("bringing a meal did nothing");
if (brig.overflow) fail("BRIG overflows the sheet sideways at 412 px");
await page.screenshot({ path: "/tmp/ui-brig.png" });

await browser.close();
if (errors.length) { console.error(`bounty smoke FAILED (${errors.length})`); process.exit(1); }
console.log("bounty smoke OK");
