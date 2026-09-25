/* 0.3.48 — the security ◆ in a real browser: green on a clean start, the card
 * opens on tap with SOS open, a call dispatches a wing, a hit turns it yellow
 * and closes SOS, heat turns it red with PAY FINE at a port. Portrait phone.
 *   node test/smoke-seclevel.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
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
await page.fill("#callsign", "GemSmoke");
await page.click("#btn-create");
await sleep(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await sleep(400);
await page.click("#create-next"); await sleep(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
await page.click("#create-next"); await sleep(300);
await page.click("#create-next"); await sleep(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await sleep(1500);
/* undock if the start put us in a berth, so SOS is a real option */
await page.evaluate(async () => { const { sim } = await import("/js/sim.js"); sim.ship.dockedAt = null; sim.ship.lastHitBy = null; sim.ship.lastFireAt = -1e9; });
await sleep(600);

const badge = await page.evaluate(() => { const b = document.querySelector("#sec-badge"); const r = b?.getBoundingClientRect(); return { present: Boolean(b), level: b?.dataset.level, text: b?.textContent, visible: Boolean(r && r.width > 10 && r.top >= 0 && r.bottom < innerHeight) }; });
ok(badge.present && badge.visible, "the diamond is on the HUD");
ok(badge.level === "green" && /SAFE/.test(badge.text), `a clean start is GREEN · SAFE (${badge.level})`);

await page.click("#sec-badge");
await sleep(400);
const card = await page.evaluate(() => { const c = document.querySelector("#sec-card"); const s = c?.querySelector(".sec-sos"); return { open: c && !c.classList.contains("hidden"), text: c?.textContent ?? "", sos: Boolean(s), sosOn: s && !s.disabled }; });
ok(card.open, "tapping it opens the card");
ok(/Protected by/.test(card.text), "the card names who is protecting you");
ok(card.sos && card.sosOn, "SOS is open when green");
await page.screenshot({ path: "/tmp/sec-green.png" });

await page.evaluate(() => document.querySelector("#sec-card .sec-sos")?.click());
await sleep(700);
const called = await page.evaluate(async () => { const S = await import("/js/seclevel.js"); const { distress } = await import("/js/npc/security.js"); const c = distress.find((x) => x.victimId === "self"); return { call: Boolean(c), state: c?.state, text: document.querySelector("#sec-card")?.textContent ?? "", sosOff: document.querySelector("#sec-card .sec-sos")?.disabled, id: S.secState.sosId }; });
ok(called.call && called.id, `SOS puts the player's call on the bus (${called.state})`);
ok(called.sosOff, "and closes the button while a wing is coming");

/* a hit: yellow */
await page.evaluate(async () => { const { sim } = await import("/js/sim.js"); sim.ship.lastHitBy = "smoke"; sim.ship.lastHitAt = sim.time; });
await sleep(700);
const yellow = await page.evaluate(() => ({ level: document.querySelector("#sec-badge")?.dataset.level, text: document.querySelector("#sec-card")?.textContent ?? "" }));
ok(yellow.level === "yellow" && /IN COMBAT/.test(yellow.text), "shot at: YELLOW · IN COMBAT");
ok(/SOS closed: in combat/.test(yellow.text), "with SOS closed and the reason given");
await page.screenshot({ path: "/tmp/sec-yellow.png" });

/* heat: red, and the fine at a port */
await page.evaluate(async () => { const { sim } = await import("/js/sim.js"); const { pilot } = await import("/js/pilot.js"); const { stations } = await import("/js/stations.js"); pilot.secHeat = 3.5; sim.ship.lastHitBy = null; sim.ship.credits = 20000; sim.ship.dockedAt = stations.find((s) => !s.hostile && s.sector !== "pirate").id; });
await sleep(700);
const red = await page.evaluate(() => { const d = document.querySelector("#sec-badge-deck"); const r = d?.getBoundingClientRect(); return { level: document.querySelector("#sec-badge")?.dataset.level, deck: d?.dataset.level, deckVisible: Boolean(r && r.width > 10 && r.top >= 0 && r.bottom < innerHeight), text: document.querySelector("#sec-card")?.textContent ?? "", fine: Boolean(document.querySelector("#sec-card .sec-fine")) }; });
ok(red.deck === "red" && red.deckVisible, "docked, the deck carries the diamond too — where PAY FINE is needed");
ok(red.level === "red" && /WANTED/.test(red.text), "heat 3.5: RED · WANTED");
ok(red.fine, "PAY FINE is offered at an honest port");
await page.screenshot({ path: "/tmp/sec-red.png" });
await page.evaluate(() => document.querySelector("#sec-card .sec-fine")?.click());
await sleep(700);
const paid = await page.evaluate(async () => { const { pilot } = await import("/js/pilot.js"); return { heat: pilot.secHeat, level: document.querySelector("#sec-badge")?.dataset.level }; });
ok(paid.heat === 0 && paid.level !== "red", `paying clears the heat (${paid.level})`);

const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
ok(!overflow, "no horizontal overflow at 412 px");
ok(!errors.length, `no page errors (${errors.length})`);
await browser.close();
const bad = checks.filter(([c]) => !c);
if (bad.length) { console.error(`smoke-seclevel: ${bad.length} failed`); process.exit(1); }
console.log("smoke-seclevel: all green");
