/* Headless smoke for the chart-menu patch: tap-anywhere menu, steady plot size,
 * transponders on the chart, auto-warp from the sheet, EXT camera orbit/zoom,
 * and the net client going quiet on a static host (405/404). Portrait.
 *   python server.py 8124 &   (or any static server — the net check expects one without a relay)
 *   node test/smoke-chart.mjs "$(npm root -g)/playwright/index.mjs"
 */
const pwPath = process.argv[2];
const port = process.argv[3] || "8124";
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
const netHits = { send: 0, poll: 0 };
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });
page.on("request", (r) => { const u = r.url(); if (u.includes("/net/send")) netHits.send++; if (u.includes("/net/poll")) netHits.poll++; });
const warns = [];
page.on("console", (m) => { if (m.type() === "warning") warns.push(m.text()); });

await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
await page.fill("#callsign", "ChartSmoke");
await page.click("#btn-create");
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await page.waitForTimeout(400);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.evaluate(() => [...document.querySelectorAll("#create-body .pick")].find((b) => /mining/i.test(b.textContent))?.click() ?? document.querySelector("#create-body .pick")?.click());
await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await page.waitForTimeout(1500);

let fails = 0;
const ok = (c, m) => { console.log(`${c ? "ok  " : "FAIL"} ${m}`); if (!c) fails++; };

/* ---- open the chart, measure the plot, tap empty space -------------------- */
await page.click("#btn-map");
await page.waitForSelector("#map:not(.hidden)");
await page.waitForTimeout(400);
const plotBefore = await page.evaluate(() => { const r = document.querySelector(".chart-plot").getBoundingClientRect(); return { w: r.width, h: r.height }; });
const svgBox = await page.evaluate(() => { const r = document.querySelector("#map-svg").getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
/* a spot near the top-left corner: almost certainly empty space at ship framing */
const tap = { x: svgBox.x + svgBox.w * 0.18, y: svgBox.y + svgBox.h * 0.22 };
await page.mouse.click(tap.x, tap.y);
await page.waitForTimeout(250);
const menu1 = await page.evaluate(() => {
  const m = document.querySelector("#map-menu");
  return { open: m && !m.classList.contains("hidden"), title: m?.querySelector("#cm-title")?.textContent, acts: [...(m?.querySelectorAll(".cm-acts .tbtn") ?? [])].map((b) => b.textContent) };
});
ok(menu1.open, `tap on empty space opens the menu (${menu1.title}: ${menu1.acts.join("/")})`);
ok(menu1.acts.includes("WARP") && menu1.acts.includes("APPROACH") && menu1.acts.includes("PROBE") && menu1.acts.includes("SCAN") && menu1.acts.includes("SAVE"), "menu carries warp / approach / probe / scan / save");
const plotAfter = await page.evaluate(() => { const r = document.querySelector(".chart-plot").getBoundingClientRect(); return { w: r.width, h: r.height }; });
ok(Math.abs(plotAfter.h - plotBefore.h) < 2 && Math.abs(plotAfter.w - plotBefore.w) < 2, `plot keeps its size across a pick (${plotBefore.w}×${plotBefore.h} → ${plotAfter.w}×${plotAfter.h})`);
await page.screenshot({ path: "/tmp/chart-menu.png" });

/* SAVE makes a fix that is a warp node */
await page.evaluate(() => [...document.querySelectorAll("#map-menu .tbtn")].find((b) => b.textContent === "SAVE")?.click());
await page.waitForTimeout(200);
const saved = await page.evaluate(() => { const a = window.__lg; const w = a.sim.waypoints.at(-1); return { n: a.sim.waypoints.length, name: w?.name, node: Boolean(a.warpNodeById?.(w?.id) ?? true), tier: document.querySelector("#sheet-tier")?.textContent }; });
ok(saved.n >= 1 && saved.tier === "FIX", `SAVE files a fix (${saved.name}, sheet ${saved.tier})`);

/* tap a port: the menu names it */
const portTap = await page.evaluate(() => {
  const a = window.__lg;
  const st = a.stations?.[0] ?? null;
  return st ? { name: st.name } : null;
});
/* the map's own hit-test is unit-tested elsewhere; here drive the world tap through the chart's API via a synthetic pointer on a port pixel */
const portPx = await page.evaluate(() => {
  const svg = document.querySelector("#map-svg");
  const g = [...svg.querySelectorAll("g")].find((x) => x.querySelector("rect[width='6.8']"));
  if (!g) return null;
  const r = g.querySelector("rect").getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
if (portPx) {
  await page.mouse.click(portPx.x, portPx.y);
  await page.waitForTimeout(250);
  const m2 = await page.evaluate(() => ({ title: document.querySelector("#cm-title")?.textContent, sub: document.querySelector("#cm-sub")?.textContent, acts: [...document.querySelectorAll("#map-menu .tbtn")].map((b) => b.textContent) }));
  ok(/port/.test(m2.sub ?? "") && m2.acts.includes("WARP"), `tapping a port opens its menu (${m2.title} · ${m2.sub})`);
  await page.screenshot({ path: "/tmp/chart-port-menu.png" });
} else ok(false, "found a port glyph on the chart");

/* Contacts on the chart.
 *
 * This used to assert that every hull in the sky drew a chevron, which is
 * the behaviour that was removed: the chart is a sensor picture now, not a
 * transponder feed, and an unscanned sky is supposed to be empty. */
const cold = await page.evaluate(async () => {
  const { traffic } = await import("/js/npc/traffic.js");
  const { flow } = await import("/js/npc/flow.js");
  const { knownContacts } = await import("/js/contacts.js");
  const known = knownContacts();
  const hulls = [...traffic, ...flow];
  /* Every true hull name in the sky, and the ones the register has actually
   * identified. A level-2 track carries a CLASS in `name` (contacts.js), not
   * the hull's name, so the two sets are disjoint by construction unless the
   * chart is leaking. */
  const trueNames = new Set(hulls.map((v) => v.name).filter(Boolean));
  const resolvedNames = new Set(known.filter((c) => c.level >= 3).map((c) => c.name));
  const labels = [...document.querySelectorAll("#map-svg text")].map((t) => t.textContent);
  return {
    inSky: hulls.length,
    resolved: known.filter((c) => c.level >= 3).length,
    tracked: known.filter((c) => c.level >= 2).length,
    returns: known.length,
    chevrons: document.querySelectorAll("#map-svg path[d^='M0 -3.6']").length,
    blobs: document.querySelectorAll("#map-svg circle[stroke-dasharray='2 3']").length,
    /* labels that name a real hull but are not backed by an identification */
    leaked: labels.filter((t) => trueNames.has(t) && !resolvedNames.has(t)),
  };
});
const drawn = cold.chevrons + cold.blobs;
console.log("chart before scanning:", JSON.stringify(cold));
/* Not zero — the scanner runs while you fly, and the long-range track band
 * (SCAN.track_r) hands anything under drive a coarse blob on purpose, so a
 * fair fraction of the sky shows as uncertain returns early. The 10% floor
 * here dated from before two things: the coarse band, and 0.2.02 halving the
 * flow (the denominator). */
ok(drawn < cold.inSky * 0.35, `the chart shows ${drawn} of ${cold.inSky} hulls, not all of them`);
/* The old check was `chevrons < inSky * 0.05`, and it was the wrong contract
 * measured the wrong way. A chevron is not a name: map.js draws the arrow for
 * any contact the register has TRACKED (level 2), holding back only boats,
 * which stay a dot until they are identified. So the count it capped was the
 * track count, which the sensor legitimately fills close aboard — a port's own
 * traffic at a few hundred u resolves whether you have scanned or not — and
 * 8-13 arrows out of ~152 hulls (5-8%) sat right on the 5% line. It failed on
 * a coin flip on every tree back to 0.3, including before the docking and
 * freeze work, which is how it was caught.
 *
 * The behaviour that was actually removed in 0.2.x is the transponder feed:
 * the chart used to put every hull in the sky on the plate WITH ITS NAME. So
 * the contract is about names, and it is exact rather than statistical — the
 * chart may print a hull's true name only where the register says level 3.
 * A level-2 track prints its class instead, so any true name on the plate
 * without an identification behind it is the leak, and one is a failure. */
ok(cold.leaked.length === 0, `no hull is named on the chart without an identification (${cold.leaked.length ? cold.leaked.join(", ") : "none"}; ${cold.resolved} resolved of ${cold.tracked} tracked)`);
/* and the structural half: an arrow is only ever drawn over a tracked contact */
ok(cold.chevrons <= cold.tracked, `every chevron sits on a tracked contact (${cold.chevrons} drawn, ${cold.tracked} tracked)`);
ok(cold.resolved < cold.inSky * 0.2, `most of the sky is still unidentified (${cold.resolved} of ${cold.inSky})`);

/* WARP from the menu: nav takes the core and closes the chart */
await page.evaluate(() => [...document.querySelectorAll("#map-menu .tbtn")].find((b) => b.textContent === "WARP")?.click());
await page.waitForTimeout(400);
const ap = await page.evaluate(() => ({ mapOpen: !document.querySelector("#map").classList.contains("hidden"), on: window.__lg.autopilot?.autopilot.on, mode: window.__lg.autopilot?.autopilot.mode, notice: window.__lg.sim.notice }));
ok(ap.on && ap.mode === "warp" && !ap.mapOpen, `WARP hands the jump to nav and closes the chart (${ap.notice})`);
await page.evaluate(() => window.__lg.autopilot?.disengageAutopilot("test"));

/* ---- EXT camera: drag orbits, wheel zooms, nothing steers the nose ------- */
await page.click("#btn-cam");
await page.waitForTimeout(200);
const yaw0 = await page.evaluate(() => window.__lg.sim.ship.aimYaw);
const canvas = await page.evaluate(() => { const r = document.querySelector("#view").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await page.mouse.move(canvas.x, canvas.y);
await page.mouse.down();
await page.mouse.move(canvas.x + 120, canvas.y + 40, { steps: 6 });
await page.mouse.up();
await page.mouse.wheel(0, -600);
await page.waitForTimeout(300);
const yaw1 = await page.evaluate(() => window.__lg.sim.ship.aimYaw);
ok(Math.abs(yaw1 - yaw0) < 0.02, `an EXT drag orbits the camera without steering the nose (Δaim ${(yaw1 - yaw0).toFixed(3)})`);
await page.screenshot({ path: "/tmp/chart-ext.png" });
await page.click("#btn-cam");

/* ---- net: a static host answers 405/404; the client must go quiet -------- */
const s0 = { ...netHits };
await page.waitForTimeout(6000);
const s1 = { ...netHits };
const relay = await page.evaluate(() => window.__lg.net?.relay ?? "n/a");
console.log(`net after 6 s: sends +${s1.send - s0.send}, polls +${s1.poll - s0.poll}, relay=${relay}`);
if (relay === false) ok(s1.send - s0.send === 0 && s1.poll - s0.poll <= 1, "no relay: zero state posts, a poll every 30 s");
else ok(true, `relay present (${relay}) — the static-host back-off is exercised elsewhere`);


/* ---- and the other half of the contract: dwelling resolves -------------
 * Run last, because it moves the ship and opens and closes the chart, and
 * the assertions above care where both of those are. */
/* The chart may already be shut — an earlier WARP closes it. */
await page.evaluate(() => {
  const b = document.getElementById("btn-map-close");
  if (b && b.offsetParent !== null) b.click();
});
await page.waitForTimeout(400);
/* Wait for the RESOLVE, not for a stopwatch.
 *
 * This used to pin the ship beside a hull, sleep six seconds of wall clock and
 * then assert the contact had reached level 2. But the scanner integrates on
 * SIM time, which only advances when a frame runs, and headless swiftshader
 * runs at single-figure fps with real variance — so a slow run simply got
 * fewer seconds of scanning than a fast one and the assertion failed for
 * reasons that had nothing to do with the scanner. It came up level 1 about
 * one run in eight.
 *
 * So it polls the thing under test and stops as soon as it is true, with a
 * ceiling far above what it needs and the actual cost reported either way.
 * A slow machine now takes longer; it does not fail. */
const resolved = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { traffic } = await import("/js/npc/traffic.js");
  const { levelFor, knownContacts } = await import("/js/contacts.js");
  const n = traffic.find((v) => v.visible !== false);
  if (!n) return null;
  const hold = setInterval(() => {
    sim.ship.pos.x = n.x - 2500; sim.ship.pos.y = n.y; sim.ship.pos.z = n.z;
    sim.ship.vel.x = 0; sim.ship.vel.y = 0; sim.ship.vel.z = 0;
    sim.ship.yaw = sim.ship.aimYaw = -Math.PI / 2;
    sim.ship.pitch = sim.ship.aimPitch = 0;
  }, 40);
  const wall0 = performance.now();
  const sim0 = sim.time;
  let level = 0;
  /* 30 s of wall clock is the giving-up point; six seconds of SIM time is what
   * the scanner actually needs, and on a quick machine this returns in about
   * that. */
  while (performance.now() - wall0 < 30000) {
    await new Promise((r) => setTimeout(r, 100));
    level = levelFor(n.id);
    if (level >= 2) break;
  }
  clearInterval(hold);
  return {
    name: n.name, level, onChart: knownContacts().length,
    wall: Math.round(performance.now() - wall0), simSecs: Math.round((sim.time - sim0) * 10) / 10,
  };
});
console.log("after dwelling on one:", JSON.stringify(resolved));
ok(resolved && resolved.level >= 2,
  `dwelling on a hull resolves it (level ${resolved?.level ?? "none"} after ${resolved?.simSecs ?? "?"} s of sim time, ${resolved?.wall ?? "?"} ms of wall clock)`);
ok(resolved && resolved.onChart > 0, "a resolved contact reaches the chart");
await page.evaluate(() => document.getElementById("btn-map")?.click());
await page.waitForTimeout(1400);
const warm = await page.evaluate(() => document.querySelectorAll("#map-svg path[d^='M0 -3.6'], #map-svg circle[stroke-dasharray='2 3']").length);
ok(warm > 0, `${warm} contacts drawn once something is resolved`);

/* ---- nothing on the chart is cut off the right-hand edge -------------------
 *
 * The chart panel is `overflow: hidden`, so anything wider than it is silently
 * CLIPPED rather than scrolled: no error, no scrollbar, the content simply is
 * not there. A plain `1fr` grid column can never be narrower than its widest
 * item's min-content, so the head, the legend and the sheet's action row
 * pushed the column 20px past the panel and took the X button, the directory's
 * distance column and CENTRE off the right edge with them. Fixed in 0.3.08
 * with `minmax(0, 1fr)`; this is the guard.
 *
 * Measured with the directory open and a body picked, because that is when the
 * widest rows exist, and in both orientations — landscape has its own
 * two-column template with exactly the same trap in it.
 */
{
  const clipped = async (label) => {
    const r = await page.evaluate(() => {
      const panel = document.querySelector("#map .panel.chart");
      if (!panel) return { err: "no chart panel" };
      const cs = getComputedStyle(panel);
      const pr = panel.getBoundingClientRect();
      const right = pr.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth);
      const out = [];
      for (const e of panel.querySelectorAll("*")) {
        if (e.closest(".chart-plot")) continue;   /* the SVG is clipped on purpose */
        const b = e.getBoundingClientRect();
        if (b.width > 1 && b.right > right + 1.5) out.push(`${e.tagName}.${(e.className || "").toString().split(" ")[0]}`);
      }
      return { cols: cs.gridTemplateColumns, contentRight: Math.round(right), panelRight: Math.round(pr.right), n: out.length, first: out.slice(0, 4) };
    });
    ok(!r.err && r.n === 0, `${label}: nothing is cut off the right edge (${r.err ?? (r.n ? `${r.n} clipped — ${r.first.join(", ")}` : `track ${r.cols}`)})`);
  };

  /* the busiest the panel ever gets */
  await page.evaluate(async () => {
    const m = await import("/js/map.js");
    const { useGameStore } = await import("/js/store.js");
    const { BODIES } = await import("/js/bodies.js");
    m.openMapDirectory("ports");
    /* a world in the sheet, so the stats grid and the action row are drawn */
    const w = BODIES.find((x) => x.kind !== "star");
    if (w) useGameStore.getState().setSelected?.(w.id);
  });
  await page.waitForTimeout(700);
  await clipped("portrait");

  await page.setViewportSize({ width: 915, height: 412 });
  await page.waitForTimeout(700);
  await clipped("landscape");
  await page.setViewportSize({ width: 412, height: 915 });
  await page.waitForTimeout(700);
}

ok(errors.length === 0, `no page errors (${errors.length})`);
console.log(fails ? `smoke-chart: ${fails} FAILED` : "smoke-chart: all green");
await browser.close();
process.exit(fails ? 1 : 0);
