/* Headless smoke for 0.3.18: the desk as nested drop-downs, on the console and the deck.
 * door, release up the exit lane outside the tractor's reach, no re-lock and
 * no lane hail on the way out, the lane rig drawn only inside 5 km of it.
 *   node test/smoke-docking.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "DockSmoke");
await page.click("#btn-create");
await sleep(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await sleep(400);
await page.click("#create-next");
await sleep(300);
await page.evaluate(() => [...document.querySelectorAll("#create-body .pick")].find((b) => /mining/i.test(b.textContent))?.click() ?? document.querySelector("#create-body .pick")?.click());
await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
await page.click("#create-next");
await sleep(300);
await page.click("#create-next");
await sleep(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await sleep(1200);
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok ", m); } else { fail++; console.log("  FAIL", m); } };

const r = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const { sim } = await import("/js/sim.js");
  const { stations } = await import("/js/stations.js");
  const { renderDesk, renderHeld } = await import("/js/boardview.js");
  const { contracts } = await import("/js/contracts.js");
  const st = stations.find((s) => s.sector !== "pirate");
  sim.ship.dockedAt = st.id;
  const host = document.createElement("div");
  host.className = "term-sec";
  host.style.cssText = "position:fixed;left:0;top:0;width:412px;height:900px;overflow:auto;background:#0b0e14;z-index:99999";
  document.body.append(host);
  const mkBtn = (label, fn, on) => { const b = document.createElement("button"); b.className = `tbtn tiny${on ? " on" : ""}`; b.textContent = label; b.addEventListener("click", fn); return b; };
  const paint = () => { host.innerHTML = ""; const held = document.createElement("div"); renderHeld(held, st, { btn: mkBtn, onChange: paint }); host.append(held); renderDesk(host, st, { btn: mkBtn, onChange: paint }); };
  paint();
  const cats = [...host.querySelectorAll("details.bd-cat")];
  const out = { cats: cats.length, names: cats.map((d) => d.querySelector(".bd-cat-nm").textContent), opened: cats.filter((d) => d.open).map((d) => d.querySelector(".bd-cat-nm").textContent) };
  out.issuersInFirst = cats[0]?.querySelectorAll("details.bd-iss").length ?? 0;
  out.offers = host.querySelectorAll(".bd-offer").length;
  const closed = cats.find((d) => !d.open);
  if (closed) { closed.querySelector("summary").click(); await sleep(50); }
  out.openedAfter = [...host.querySelectorAll("details.bd-cat")].filter((d) => d.open).length;
  /* accept the first takeable offer: it moves to in hand, and the open drop-downs stay open */
  const acc = [...host.querySelectorAll(".bd-offer button")].find((b) => b.textContent === "ACCEPT" && !b.disabled);
  out.accepted = Boolean(acc);
  acc?.click(); await sleep(50);
  out.held = contracts.active.length;
  out.openedAfterAccept = [...host.querySelectorAll("details.bd-cat")].filter((d) => d.open).length;
  /* the filter chips */
  [...host.querySelectorAll(".bd-chip")].find((b) => /FITS/.test(b.textContent))?.click(); await sleep(50);
  out.fitOffers = host.querySelectorAll(".bd-offer").length;
  out.blockedInFit = [...host.querySelectorAll("details.bd-cat .bd-offer.blocked")].length;
  [...host.querySelectorAll(".bd-chip")].find((b) => /ALL/.test(b.textContent))?.click(); await sleep(50);
  out.overflow = host.scrollWidth > host.clientWidth + 1;
  return out;
});
console.log(JSON.stringify(r));
ok(r.cats >= 8, `the desk is ${r.cats} department drop-downs: ${r.names.join(", ")}`);
ok(r.issuersInFirst >= 1 && r.offers >= 18, `nested by issuer, ${r.offers} offers in all`);
ok(r.opened.length >= 1, `the pilot's own department opens by itself (${r.opened.join(", ")})`);
ok(r.openedAfter > r.opened.length, "tapping a department opens it");
ok(r.accepted && r.held === 1 && r.openedAfterAccept >= r.openedAfter, "accepting puts it in hand and keeps the drop-downs as they were");
ok(r.blockedInFit === 0, `FITS MY HULL shows only takeable work (${r.fitOffers})`);
ok(!r.overflow, "no sideways overflow at 412 px");
await page.screenshot({ path: "/tmp/desk-smoke.png" });
ok(errors.length === 0, `no page errors (${errors.length})`);
await browser.close();
console.log(`smoke desk: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
