/* Headless smoke for 0.3.40: the game served by the SITE at /play/, signed in
 * from CON › ACCOUNT, and the pilot carried to a second browser.
 *
 * Spawns lgsite.py (the site, ../site) on :8214 with the game's own server.py
 * on :8215 behind its relay pass-through, registers and verifies a user through
 * the site's forms, then drives two browser contexts:
 *
 *   A  creates a pilot at /play/, opens CON › CORP › ACCOUNT, signs in, and the
 *      pilot goes up as v1 — while the shared sky is ONLINE through /net/*.
 *   B  a fresh browser that is signed in on the site opens /play/ and, with
 *      nothing on the device, gets A's pilot loaded and the page reloaded:
 *      the callsign is already on the start card, no creation screen.
 *
 *   node test/smoke-account.mjs "$(npm root -g)/playwright/index.mjs"
 */
import { existsSync, mkdtempSync, writeFileSync, chmodSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok ", m); } else { fail++; console.log("  FAIL", m); } };

const GAME = process.cwd();
const SITE_DIR = join(GAME, "..", "site");
if (!existsSync(join(SITE_DIR, "lgsite.py"))) { console.log("../site/lgsite.py not found — nothing to smoke"); process.exit(0); }
const SPORT = 8214, RPORT = 8215;
const BASE = `http://127.0.0.1:${SPORT}`;
const dir = mkdtempSync(join(tmpdir(), "lgacct-smoke-"));
const envFile = join(SITE_DIR, "lgsite.env.test");
writeFileSync(envFile, ""); chmodSync(envFile, 0o600);

const relay = spawn("python3", ["server.py", String(RPORT)], { cwd: GAME, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, LG_MENU: "0" } });
const site = spawn("python3", ["lgsite.py"], {
  cwd: SITE_DIR, stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, LGSITE_PORT: String(SPORT), LGSITE_DATA: dir, SITE_URL: BASE, MAIL_BACKEND: "console", SECURE_COOKIES: "0", LGSITE_DEV: "1", GAME_DIR: GAME, LGSITE_INSECURE_OK: "1", RELAY_URL: `http://127.0.0.1:${RPORT}` },
});
let out = "";
site.stdout.on("data", (b) => { out += b; }); site.stderr.on("data", (b) => { out += b; });
let up = false;
for (let i = 0; i < 40 && !up; i++) { await sleep(250); try { up = (await fetch(BASE + "/health")).ok && (await fetch(`http://127.0.0.1:${RPORT}/net/ping`)).status < 500; } catch { /* not yet */ } }
ok(up, "site and relay are up");

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
try {
  /* ---- register + verify through the site ------------------------------- */
  const jar = new Map();
  const F = async (path, init = {}) => {
    const headers = { ...(init.headers ?? {}), Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") };
    const r = await fetch(BASE + path, { ...init, headers, redirect: "manual" });
    for (const c of r.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const [k, v] = kv.split("="); jar.set(k.trim(), v); }
    return r;
  };
  const form = (o) => new URLSearchParams(o).toString();
  const csrfOf = (t) => (t.match(/name="csrf" value="([^"]+)"/) ?? [])[1];
  const reg = await (await F("/register")).text();
  await F("/register", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ csrf: csrfOf(reg), username: "smoke_pilot", email: "smoke@example.test", password: "a fine long password" }) });
  const link = (out.match(/\/verify\?t=([A-Za-z0-9_-]+)/) ?? [])[1];
  ok(Boolean(link), "verification link came out of the console mailer");
  await F(`/verify?t=${link}`);

  /* ---- A: create a pilot at /play/, sign in from the console ------------ */
  const A = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const a = await A.newPage();
  const errors = [];
  a.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });
  await a.goto(`${BASE}/play/`, { waitUntil: "networkidle" });
  ok(await a.evaluate(() => Boolean(globalThis.__lgBooted)), "the game boots from /play/");
  await sleep(400);
  const line0 = await a.evaluate(() => { const el = document.getElementById("account-line"); return { hidden: el.hidden, text: el.textContent }; });
  ok(!line0.hidden && /Sign in/.test(line0.text), `the start card offers sign-in (${JSON.stringify(line0.text)})`);
  await a.fill("#callsign", "AcctSmoke");
  await a.click("#btn-create"); await sleep(300);
  await a.evaluate(() => document.querySelector("#create-body .pick")?.click()); await sleep(400);
  await a.click("#create-next"); await sleep(300);
  await a.evaluate(() => [...document.querySelectorAll("#create-body .pick")].find((b) => /mining/i.test(b.textContent))?.click() ?? document.querySelector("#create-body .pick")?.click());
  await a.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
  await a.click("#create-next"); await sleep(300); await a.click("#create-next"); await sleep(300);
  await a.click("#btn-sol");
  await a.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
  await sleep(2500);
  const net = await a.evaluate(async () => { const { net } = await import("/play/js/net.js"); return { relay: net.relay, online: net.online }; });
  ok(net.relay === true, `the shared sky is online through the site's /net/* pass-through (relay=${net.relay} online=${net.online})`);

  await a.evaluate(() => window.__lg.console.openConsole("corp", "account"));
  await sleep(500);
  const shown = await a.evaluate(() => ({ title: document.getElementById("con-title")?.textContent, sub: [...document.querySelectorAll("#con-subtabs button")].map((b) => b.textContent), status: document.querySelector("#con-body .trow .v")?.textContent, hasUser: Boolean(document.querySelector('#con-body input[autocomplete="username"]')), hasPass: Boolean(document.querySelector('#con-body input[type="password"]')) }));
  ok(shown.title === "CORP" && shown.sub.includes("ACCOUNT"), `CORP has an ACCOUNT tab (${shown.sub.join("/")})`);
  ok(shown.status === "Not signed in." && shown.hasUser && shown.hasPass, `the sign-in card is up (${shown.status})`);
  await a.fill('#con-body input[autocomplete="username"]', "smoke_pilot");
  await a.fill('#con-body input[type="password"]', "wrong password");
  await a.click('#con-body button:has-text("SIGN IN")');
  await sleep(800);
  const refused = await a.evaluate(() => document.querySelector("#con-body p.dim")?.textContent);
  ok(/wrong/i.test(refused ?? ""), `a wrong password is refused in the card (${refused})`);
  await a.fill('#con-body input[type="password"]', "a fine long password");
  await a.click('#con-body button:has-text("SIGN IN")');
  let st = null;
  for (let i = 0; i < 40; i++) { await sleep(250); st = await a.evaluate(() => { const { account } = window.__lg.account; return { status: account.status, version: account.version, user: account.user?.username, line: document.querySelector("#con-body .trow .v")?.textContent }; }); if (st.status === "synced" && st.version) break; }
  ok(st?.status === "synced" && st.version === 1 && st.user === "smoke_pilot", `signed in from the console and the pilot went up as v1 (${JSON.stringify(st)})`);
  ok(/synced v1/.test(st?.line ?? ""), `the status row says so (${st?.line})`);
  const card = await a.evaluate(() => [...document.querySelectorAll("#con-body .tbtn")].map((b) => b.textContent));
  ok(card.includes("SYNC NOW") && card.includes("SIGN OUT") && card.includes("ACCOUNT PAGE"), `the signed-in card has its buttons (${card.join("/")})`);

  /* the site's own session for the checks below (registering does not sign in) */
  const lp = await (await F("/login")).text();
  await F("/login", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ csrf: csrfOf(lp), username: "smoke_pilot", password: "a fine long password" }) });
  const list = await (await F("/api/save", { headers: { "X-Requested-With": "lgsite" } })).json();
  ok(list.saves?.[0]?.callsign === "AcctSmoke" && list.saves[0].version === 1, `the site lists the pilot the game sent (${JSON.stringify(list.saves?.[0])})`);
  ok(/Miner|miner|mining/i.test(list.saves?.[0]?.career ?? "") || list.saves?.[0]?.career, `…with a career (${list.saves?.[0]?.career})`);

  /* change something, SYNC NOW → v2 */
  await a.evaluate(() => { localStorage.setItem("lgaa-company", JSON.stringify({ founded: true, name: "Smoke Holdings", treasury: 777, book: [] })); });
  await a.click('#con-body button:has-text("SYNC NOW")');
  for (let i = 0; i < 40; i++) { await sleep(250); st = await a.evaluate(() => ({ version: window.__lg.account.account.version, status: window.__lg.account.account.status })); if (st.version === 2) break; }
  ok(st.version === 2 && st.status === "synced", `SYNC NOW after a change → v2 (${JSON.stringify(st)})`);

  /* ---- B: a signed-in browser with nothing on the device ---------------- */
  const B = await browser.newContext({ viewport: { width: 412, height: 915 } });
  await B.addCookies([...jar].map(([name, value]) => ({ name, value, url: BASE })));
  const b = await B.newPage();
  b.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR B", e.message); });
  await b.goto(`${BASE}/play/`, { waitUntil: "networkidle" });
  /* the boot probe finds the session, sees an empty device, restores and reloads */
  let got = null;
  for (let i = 0; i < 40; i++) { await sleep(250); got = await b.evaluate(() => ({ callsign: document.getElementById("callsign")?.value, save: localStorage.getItem("lgaa-save-v1"), company: localStorage.getItem("lgaa-company"), state: localStorage.getItem("lgaa.account.v1"), line: document.getElementById("account-line")?.textContent })).catch(() => null); if (got?.save && got?.callsign === "AcctSmoke") break; }
  ok(got?.save?.includes("AcctSmoke") && got?.company?.includes("Smoke Holdings"), "B got A's pilot without creating one");
  ok(got?.callsign === "AcctSmoke", `…and after the reload the start card already carries the callsign (${got?.callsign})`);
  ok(JSON.parse(got?.state ?? "{}").version === 2, `…tracking v2 (${got?.state})`);
  let line = got?.line ?? "";
  for (let i = 0; i < 20 && !/Signed in/.test(line); i++) { await sleep(250); line = await b.evaluate(() => document.getElementById("account-line")?.textContent ?? "").catch(() => ""); }
  ok(/Signed in as smoke_pilot/.test(line), `the start card names the account (${line})`);
  /* 0.3.42: and offers to fly on as the restored pilot — no creation screen */
  const cont = await b.evaluate(() => ({ hidden: document.getElementById("btn-continue")?.hidden, text: document.getElementById("btn-continue")?.textContent }));
  ok(cont.hidden === false && cont.text === "Fly as AcctSmoke", `…and offers FLY AS the restored pilot (${cont.text})`);
  await b.click("#btn-continue");
  await b.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
  await sleep(1500);
  const flown = await b.evaluate(async () => { const { pilot } = await import("/play/js/pilot.js"); return { name: pilot.name, restored: pilot.restored, complex: pilot.complexId, status: window.__lg.account.account.status, version: window.__lg.account.account.version }; });
  ok(flown.name === "AcctSmoke" && flown.restored && flown.complex === "mining", `B is flying A's pilot: ${flown.name}, ${flown.complex}`);
  ok(flown.status === "synced" && flown.version === 2, `…still synced at v2, nothing re-uploaded for a launch (${flown.status} v${flown.version})`);

  /* 0.3.43 — the TOP PILOTS card lists AcctSmoke; a published item lands on the desk with READ / DISCUSS */
  const ap = await (await F("/admin/news")).text();
  if (ap.includes('name="csrf"')) {
    /* smoke_pilot is not an admin: promote through the database as create-admin would */
  }
  const { spawnSync } = await import("node:child_process");
  spawnSync("python3", ["-c", `import sqlite3; c = sqlite3.connect(${JSON.stringify(join(dir, "lgsite.db"))}); c.execute("UPDATE users SET role='admin' WHERE username='smoke_pilot'"); c.commit()`]);
  const ap2 = await (await F("/admin/news")).text();
  const posted = await F("/admin/news", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ csrf: csrfOf(ap2), title: "Smoke bulletin", kind: "event", body: "Read me on the **site**.", publish: "1" }) });
  ok(posted.status === 303, `an admin published a bulletin (${posted.status})`);
  await b.evaluate(() => { window.__lg.account.account.news.fetched = false; return window.__lg.account.postNews(); });
  await sleep(300);
  await b.evaluate(() => window.__lg.console.openConsole("corp", "gnn"));
  await sleep(500);
  const desk = await b.evaluate(() => ({ titles: [...document.querySelectorAll("#con-body .trow .k")].map((x) => x.textContent), buttons: [...document.querySelectorAll("#con-body .tbtn")].map((x) => x.textContent) }));
  ok(desk.titles.some((t) => /Smoke bulletin/.test(t)), `the bulletin is on the GNN desk (${desk.titles.filter((t) => /Smoke/.test(t))})`);
  ok(desk.buttons.includes("READ") && desk.buttons.includes("DISCUSS"), `…with READ and DISCUSS (${desk.buttons.filter((x) => /READ|DISCUSS/.test(x))})`);
  const [popup] = await Promise.all([B.waitForEvent("page", { timeout: 10000 }).catch(() => null), b.click('#con-body .tbtn:has-text("DISCUSS")')]);
  ok(popup && /\/forum\/t\/\d+$/.test(popup.url()), `DISCUSS opened the site's thread in a new tab (${popup?.url()})`);
  if (popup) { await popup.waitForLoadState("domcontentloaded").catch(() => {}); ok(/Smoke bulletin/.test(await popup.content()), "…and the thread is the bulletin's own"); await popup.close(); }
  await b.evaluate(() => window.__lg.console.openConsole("corp", "account"));
  await sleep(800);
  const boardCard = await b.evaluate(() => ({ heads: [...document.querySelectorAll("#con-body .tcard .head b")].map((x) => x.textContent), rows: [...document.querySelectorAll("#con-body .trow .k")].map((x) => x.textContent) }));
  ok(boardCard.heads.includes("TOP PILOTS") && boardCard.rows.some((r) => /1\. AcctSmoke/.test(r)), `TOP PILOTS lists AcctSmoke first (${boardCard.rows.filter((r) => /AcctSmoke/.test(r))})`);
  ok(errors.length === 0, `no page errors (${errors.join(" | ")})`);
  await A.close(); await B.close();
} finally {
  await browser.close();
  site.kill(); relay.kill();
  rmSync(dir, { recursive: true, force: true });
  try { rmSync(envFile, { force: true }); } catch { /* fine */ }
}
console.log(`smoke-account: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
