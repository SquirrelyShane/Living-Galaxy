/* 0.3.49 — the HUD's top edge and the deck HALL, in a real browser, portrait
 * phone (384x832 and 360x740):
 *   the title bar spans the very top; nothing on the right rail overlaps;
 *   a message about the ship is titled SHIP, not the nearest planet; the
 *   response clock is never under the message card; the comms puck hangs
 *   under the systems strip, not over the gauges;
 *   docked, the HALL shows your crew with TALK inline — the console never
 *   opens — and the registrar takes a typed company name.
 *   node test/smoke-hall.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const checks = [];
const ok = (c, m) => { checks.push([Boolean(c), m]); console.log(`${c ? "ok  " : "FAIL"} ${m}`); };
const over = (a, b) => a && b && a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];

async function boot(w, h, name) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const errors = [];
  page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });
  const sleep = (ms) => page.waitForTimeout(ms);
  await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
  await page.fill("#callsign", name);
  await page.click("#btn-create"); await sleep(300);
  await page.evaluate(() => document.querySelector("#create-body .pick")?.click()); await sleep(300);
  await page.click("#create-next"); await sleep(300);
  await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
  await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
  await page.click("#create-next"); await sleep(300);
  await page.click("#create-next"); await sleep(300);
  await page.click("#btn-sol");
  await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
  await sleep(2600);
  return { page, errors, sleep };
}
const rect = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e || e.classList.contains("hidden") || e.offsetParent === null) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }, sel);

for (const [w, h] of [[384, 832], [360, 740]]) {
  const { page, errors, sleep } = await boot(w, h, `Hall${w}`);
  const tag = `${w}x${h}`;
  const bar = await rect(page, ".hud-top");
  ok(bar && bar[1] <= 1 && bar[0] <= 1 && Math.abs(bar[2] - w) <= 1 && bar[3] <= 40, `${tag}: the title bar rests across the very top (${bar?.map(Math.round)})`);
  const g = await rect(page, "#gauges"), s = await rect(page, "#sys-strip"), inst = await rect(page, "#instruments");
  ok(!over(bar, g) && !over(bar, inst), `${tag}: nothing hides under the title bar`);
  ok(!over(g, s), `${tag}: the gauges card and the systems strip do not overlap (${g?.[1] + g?.[3]} ≤ ${s?.[1]})`);

  /* a ship message is the ship's, and the response clock is never under it */
  await page.evaluate(async () => {
    const { sim } = await import("/js/sim.js");
    sim.notice = "Turrets armed. Anything hostile inside 1.5 km gets rounds."; sim.noticeAt = sim.wall;
    const S = await import("/js/seclevel.js");
    sim.ship.dockedAt = null; sim.ship.lastHitBy = null;
    S.callSOS(sim.ship, sim.time);
  });
  await sleep(900);
  const head = await page.evaluate(() => document.getElementById("lock-name")?.textContent);
  ok(head === "SHIP", `${tag}: a message about the ship is titled SHIP (${head})`);
  const resp = await rect(page, "#respline"), card = await rect(page, "#notice-card");
  ok(resp && card && !over(resp, card), `${tag}: the response clock is not under the message card`);
  ok(!resp || !over(resp, s), `${tag}: the response clock stops short of the systems strip`);
  ok(!over(card, s), `${tag}: the message card stops short of the systems strip`);

  /* a call: the puck hangs under the strip, not over the gauges */
  await page.evaluate(async () => { const { sim } = await import("/js/sim.js"); const { stations } = await import("/js/stations.js"); const st = stations.filter((x) => !x.hostile)[0]; sim.lock.id = st.id; sim.lock.kind = "station"; (await import("/js/comms/comms.js")).hail(); });
  await sleep(1800);
  const puck = await rect(page, ".cx-puck");
  ok(puck && s && puck[1] >= s[1] + s[3] - 1 && !over(puck, g), `${tag}: the call puck is under the systems strip, not in the top-right corner (${puck?.map(Math.round)})`);
  await page.screenshot({ path: `/tmp/hall-hud-${tag}.png` });
  await page.evaluate(async () => (await import("/js/comms/comms.js")).comms.session?.end?.("test"));

  if (w === 384) {
    /* dock and use the HALL */
    const docked = await page.evaluate(async () => {
      const { sim, toggleDock } = await import("/js/sim.js");
      const { stations } = await import("/js/stations.js");
      const { crew, hireCrew, stationRoster } = await import("/js/crew.js");
      sim.ship.credits = 50000;
      const st = stations.find((x) => x.sector === "industrial") ?? stations.find((x) => !x.hostile);
      const m = st.hangars[0];
      sim.ship.pos.x = st.x + m.x + m.dir.x * 60; sim.ship.pos.y = st.y + m.y + m.dir.y * 60; sim.ship.pos.z = st.z + m.z + m.dir.z * 60;
      sim.ship.vel.x = st.vx; sim.ship.vel.y = st.vy; sim.ship.vel.z = st.vz;
      await new Promise((r) => setTimeout(r, 300));
      toggleDock();
      for (let i = 0; i < 150 && sim.ship.dockedAt !== st.id; i++) await new Promise((r) => setTimeout(r, 500));
      for (const c of stationRoster(st, 1, sim.skySeed).slice(0, 1)) hireCrew(c, sim.ship, 8);
      await new Promise((r) => setTimeout(r, 800));
      document.querySelector('#sd-tabs button[data-sd="hall"]')?.click();
      await new Promise((r) => setTimeout(r, 600));
      return { docked: sim.ship.dockedAt === st.id, crew: crew.aboard.length };
    });
    ok(docked.docked && docked.crew >= 1, `docked with ${docked.crew} aboard`);
    const hall = await page.evaluate(async () => {
      const row = document.querySelector("#sd-body [data-crew]");
      const talk = [...(row?.querySelectorAll(".sd-btn") ?? [])].find((b) => b.textContent === "TALK");
      talk?.click();
      await new Promise((r) => setTimeout(r, 500));
      const C = await import("/js/console/console.js");
      const { sim } = await import("/js/sim.js");
      const inline = document.querySelector("#sd-body .sd-talk .in-talk-nm");
      const settle = [...document.querySelectorAll("#sd-body [data-crew] .sd-btn")].find((b) => /SETTLE/.test(b.textContent));
      return { inline: Boolean(inline), name: inline?.textContent, console: C.console.open || sim.terminalOpen, deck: !document.getElementById("station-deck").classList.contains("hidden"), settleOff: settle?.disabled, topics: document.querySelectorAll("#sd-body .sd-talk .sd-btn").length };
    });
    ok(hall.inline && hall.topics > 2, `HALL › TALK opens the conversation inline on the deck (${hall.name}, ${hall.topics} buttons)`);
    ok(!hall.console && hall.deck, "and the console never opens — you stay in station style");
    ok(hall.settleOff, "SETTLE waits for a company");
    await page.screenshot({ path: "/tmp/hall-talk.png" });
    /* the registrar takes a typed name */
    await page.fill("#sd-body .sd-input", "Squirrel Works");
    await page.evaluate(() => [...document.querySelectorAll("#sd-body .sd-btn")].find((b) => b.textContent === "REGISTER")?.click());
    await sleep(500);
    const co = await page.evaluate(async () => { const CO = await import("/js/company.js"); return { name: CO.company.name, founded: CO.company.founded, floor: [...document.querySelectorAll("#sd-body h4")].map((h) => h.textContent) }; });
    ok(co.founded && co.name === "Squirrel Works", `the registrar takes a typed name (${co.name})`);
    ok(co.floor.some((t) => /SQUIRREL WORKS — ON THIS FLOOR/.test(t)), "and the hall turns into the company's floor");
    const settle2 = await page.evaluate(() => [...document.querySelectorAll("#sd-body [data-crew] .sd-btn")].find((b) => /SETTLE/.test(b.textContent))?.disabled);
    ok(settle2 === false, "SETTLE is live once there is a company");
    await page.screenshot({ path: "/tmp/hall-registered.png" });
  }
  ok(!errors.length, `${tag}: no page errors (${errors.length})`);
  await page.close();
}

await browser.close();
const bad = checks.filter(([c]) => !c);
if (bad.length) { console.error(`smoke-hall: ${bad.length} failed`); process.exit(1); }
console.log("smoke-hall: all green");
