/* LIVING GALAXY — nothing on any surface is cut off where the pilot cannot get it.
 *
 *   python server.py 8124 &
 *   node test/smoke-clipping.mjs "$(npm root -g)/playwright/index.mjs"
 *
 * The bug class this exists for has now bitten three times in three patches and
 * never once looked like a bug:
 *
 *   0.3.07  the DOCK and HAIL side keys sat under the 3D canvas — laid out
 *           correctly, painted their live status, took no taps at all.
 *   0.3.07  the tool strip overran the box reserved for it and covered the
 *           bottom row of the RCS pad.
 *   0.3.08  a `1fr` grid column could not go below its widest child's
 *           min-content, so the chart panel's column was 20px wider than the
 *           panel and `overflow: hidden` quietly ate the X button, the
 *           directory's distance column and CENTRE.
 *
 * None of them threw. None of them showed up in a screenshot unless you knew
 * to look at the right edge. So this walks every surface the game has and
 * measures the geometry directly.
 *
 * The distinction that matters is CLIPPED versus SCROLLABLE:
 *
 *   - past an ancestor that is `overflow: hidden` or `clip` → the content is
 *     GONE. There is no gesture that reveals it. That is a failure.
 *   - past an ancestor that is `auto` or `scroll` → the pilot can swipe to it.
 *     Reported, never failed: it is a design question, not a defect.
 *
 * Scrollable is still worth printing, because "reachable by a swipe with no
 * affordance saying so" is how CREW's HOUSE tab and CORP's GNN tab were
 * invisible on a phone until 0.3.09 made that row wrap.
 */
const pwPath = process.argv[2];
const port = process.argv[3] || "8124";
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });

let fails = 0;
const ok = (c, m) => { console.log(`${c ? "ok  " : "FAIL"} ${m}`); if (!c) fails++; };

/* ---- the detector, injected once and run per surface ---------------------- */
const DETECT = () => {
  const manages = (o) => o === "hidden" || o === "clip" || o === "auto" || o === "scroll";
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll("body *")) {
    /* the canvas and the chart's SVG are clipped on purpose — a starfield and a
     * system plot are meant to run past their frame */
    if (el.tagName === "CANVAS" || el.closest("canvas") || el.closest("svg") || el.closest(".chart-plot")) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    let a = el.parentElement, host = null, ov = "";
    while (a && a !== document.body) {
      const o = getComputedStyle(a).overflowX;
      if (manages(o)) { host = a; ov = o; break; }
      a = a.parentElement;
    }
    if (!host) continue;
    const cs = getComputedStyle(host);
    const hr = host.getBoundingClientRect();
    const left = hr.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft) - host.scrollLeft;
    const right = hr.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight) - host.scrollLeft;
    const over = Math.max(r.right - right, left - r.left);
    if (over <= 1.5) continue;
    const key = `${host.id || host.className}|${el.tagName}.${(el.className || "").toString().split(" ")[0]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      lost: ov === "hidden" || ov === "clip",
      host: `${host.tagName}${host.id ? "#" + host.id : ""}.${(host.className || "").toString().split(" ")[0]}`,
      el: `${el.tagName}.${(el.className || "").toString().split(" ").slice(0, 2).join(".")}`,
      over: Math.round(over),
      text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24),
    });
  }
  return out;
};

const lostTotal = [];
const scrollTotal = [];
const sweep = async (name, setup) => {
  if (setup) { try { await setup(); } catch (e) { console.log(`  (skipped ${name}: ${String(e.message).slice(0, 60)})`); return; } }
  await page.waitForTimeout(550);
  const hits = await page.evaluate(DETECT);
  const lost = hits.filter((h) => h.lost);
  const scroll = hits.filter((h) => !h.lost);
  for (const h of lost) lostTotal.push(`${name}: ${h.host} clips ${h.el} by ${h.over}px ("${h.text}")`);
  for (const h of scroll) scrollTotal.push(`${name}: ${h.el} is ${h.over}px past ${h.host} (swipe reaches it)`);
  console.log(`   ${name}${lost.length ? ` — ${lost.length} CLIPPED` : scroll.length ? ` — ${scroll.length} scrollable` : " — clean"}`);
};

/* ---- launch ---------------------------------------------------------------- */
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
await page.fill("#callsign", "ClipSweep");
await page.click("#btn-create");
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await page.waitForTimeout(400);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.evaluate(() => [...document.querySelectorAll("#create-body .pick")].find((x) => /mining/i.test(x.textContent))?.click() ?? document.querySelector("#create-body .pick")?.click());
await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await page.waitForTimeout(1800);

console.log("\n-- in flight --");
await sweep("HUD");

console.log("\n-- console: every panel and sub-tab --");
const panels = await page.evaluate(async () => {
  const { console: con } = await import("/js/console/console.js");
  return [...con.panels.values()].map((p) => ({ id: p.id, subs: (p.subtabs ?? []).map((s) => s.id) }));
});
ok(panels.length === 6, `six console panels to walk (${panels.map((p) => p.id).join(", ")})`);
await page.evaluate(async () => (await import("/js/sim.js")).setTerminal(true));
for (const p of panels) {
  for (const sub of p.subs.length ? p.subs : [null]) {
    await sweep(`CON › ${p.id}${sub ? ` › ${sub}` : ""}`, () =>
      page.evaluate(async ([pid, sid]) => (await import("/js/console/console.js")).jumpTo(sid ? `${pid}/${sid}` : pid), [p.id, sub]));
  }
}
/* every sub-tab must be ON SCREEN, not merely reachable by a swipe */
const offscreen = await page.evaluate(async () => {
  const { console: con, jumpTo } = await import("/js/console/console.js");
  const bad = [];
  for (const p of [...con.panels.values()]) {
    jumpTo(p.id);
    await new Promise((r) => setTimeout(r, 260));
    const row = document.querySelector(".con-subtabs");
    if (!row) continue;
    const rr = row.getBoundingClientRect();
    for (const c of row.children) {
      const k = c.getBoundingClientRect();
      if (k.right > rr.right + 1 || k.left < rr.left - 1) bad.push(`${p.id}/${c.textContent.trim()}`);
    }
  }
  return bad;
});
ok(offscreen.length === 0, `every console sub-tab is on screen at 412px (${offscreen.length ? offscreen.join(", ") : "all of them"})`);
await page.evaluate(async () => (await import("/js/sim.js")).setTerminal(false));

console.log("\n-- the chart --");
await sweep("MAP", () => page.evaluate(() => document.getElementById("btn-map").click()));
await sweep("MAP + directory + sheet", () => page.evaluate(async () => {
  const m = await import("/js/map.js");
  const { useGameStore } = await import("/js/store.js");
  const { BODIES } = await import("/js/bodies.js");
  m.openMapDirectory("ports");
  const w = BODIES.find((x) => x.kind !== "star");
  if (w) useGameStore.getState().setSelected?.(w.id);
}));
await page.evaluate(() => { const b = document.getElementById("btn-map-close"); if (b && b.offsetParent !== null) b.click(); });
await page.waitForTimeout(400);

console.log("\n-- the station deck --");
const docked = await page.evaluate(async () => {
  const { sim, toggleDock } = await import("/js/sim.js");
  const { stations } = await import("/js/stations.js");
  const st = stations.find((s) => s.sector === "industrial") ?? stations.find((s) => s.sector !== "pirate");
  const m = st.hangars[0];
  sim.ship.pos.x = st.x + m.x + m.dir.x * 60; sim.ship.pos.y = st.y + m.y + m.dir.y * 60; sim.ship.pos.z = st.z + m.z + m.dir.z * 60;
  sim.ship.vel.x = st.vx; sim.ship.vel.y = st.vy; sim.ship.vel.z = st.vz;
  await new Promise((r) => setTimeout(r, 300));
  toggleDock();
  for (let i = 0; i < 150 && sim.ship.dockedAt !== st.id; i++) await new Promise((r) => setTimeout(r, 500));
  await new Promise((r) => setTimeout(r, 1000));
  return { docked: sim.ship.dockedAt === st.id, port: st.name };
});
ok(docked.docked, `docked at ${docked.port} to walk the deck`);
if (docked.docked) {
  const tabs = await page.evaluate(() => [...document.querySelectorAll("#sd-tabs button")].map((b) => b.dataset.sd).filter(Boolean));
  ok(tabs.length > 3, `${tabs.length} deck tabs to walk (${tabs.join(", ")})`);
  for (const t of tabs) {
    await sweep(`DECK › ${t}`, () => page.evaluate((id) => document.querySelector(`#sd-tabs button[data-sd="${id}"]`)?.click(), t));
  }
}

/* ---- the verdict ------------------------------------------------------------ */
console.log("");
if (scrollTotal.length) {
  console.log(`note: ${scrollTotal.length} place(s) reachable only by swiping sideways —`);
  for (const s of scrollTotal.slice(0, 10)) console.log(`   ${s}`);
}
if (lostTotal.length) for (const l of lostTotal) console.log(`   ${l}`);
ok(lostTotal.length === 0, `nothing is clipped away on any surface (${lostTotal.length} lost, ${scrollTotal.length} scrollable)`);
ok(errors.length === 0, `no page errors (${errors.length})`);
console.log(fails ? `smoke-clipping: ${fails} FAILED` : "smoke-clipping: all green");
await browser.close();
process.exit(fails ? 1 : 0);
