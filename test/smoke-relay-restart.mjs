/* Headless smoke for 0.3.44: the shared sky survives the relay restarting
 * underneath it — through the SITE's pass-through, which is what a real
 * outage looks like at living-galaxy.com (cloudflared bounce, `--update`
 * restarting lg-relay, a reboot).
 *
 *   A and B launch into sol through lgsite (:8214) → relay (:8215) and see
 *   each other. The relay is killed: both go offline on 503s, neither writes
 *   the relay off (that is a 404/405/501 thing). The relay comes back as a
 *   NEW process — ring and cursor at zero, a new `born` — and both must come
 *   back online AND a message B sends after the restart must reach A. Before
 *   0.3.44 A kept its old cursor and never heard another word.
 *
 *   node test/smoke-relay-restart.mjs "$(npm root -g)/playwright/index.mjs"
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
const dir = mkdtempSync(join(tmpdir(), "lgrestart-"));
const envFile = join(SITE_DIR, "lgsite.env.test");
writeFileSync(envFile, ""); chmodSync(envFile, 0o600);
const relayDir = mkdtempSync(join(tmpdir(), "lgrelay-"));      // the relay's own folder, like /srv/living-galaxy/relay
spawn("cp", [join(GAME, "server.py"), relayDir]).on("exit", () => {});
await sleep(300);

const startRelay = () => spawn("python3", ["server.py", String(RPORT)], { cwd: relayDir, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, LG_MENU: "0", LG_HOST: "127.0.0.1" } });
let relay = startRelay();
const site = spawn("python3", ["lgsite.py"], {
  cwd: SITE_DIR, stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, LGSITE_PORT: String(SPORT), LGSITE_DATA: dir, SITE_URL: BASE, MAIL_BACKEND: "console", SECURE_COOKIES: "0", LGSITE_DEV: "1", GAME_DIR: GAME, LGSITE_INSECURE_OK: "1", RELAY_URL: `http://127.0.0.1:${RPORT}`, RELAY_TIMEOUT: "2" },
});
const upAt = async (url) => { for (let i = 0; i < 40; i++) { try { if ((await fetch(url)).status < 500) return true; } catch { /* not yet */ } await sleep(250); } return false; };
ok(await upAt(BASE + "/health") && await upAt(`http://127.0.0.1:${RPORT}/net/ping`), "site and relay are up");

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const errors = [];
const launch = async (name) => {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => { errors.push(`${name}: ${e.message}`); });
  await p.goto(`${BASE}/play/`, { waitUntil: "networkidle" });
  await p.fill("#callsign", name);
  await p.click("#btn-create"); await sleep(300);
  await p.evaluate(() => document.querySelector("#create-body .pick")?.click()); await sleep(400);
  await p.click("#create-next"); await sleep(300);
  await p.evaluate(() => document.querySelector("#create-body .pick")?.click());
  await p.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
  await p.click("#create-next"); await sleep(300); await p.click("#create-next"); await sleep(300);
  await p.click("#btn-sol");
  await p.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
  /* a listener for reliable messages, and a plain counter the test can read */
  await p.evaluate(async () => { const { onMessage } = await import("/play/js/net.js"); window.__heard = []; onMessage((from, d) => { if (d.t === "smoke") window.__heard.push(d.n); }); });
  return p;
};
const netOf = (p) => p.evaluate(async () => { const { net } = await import("/play/js/net.js"); const { cradleRemote } = await import("/play/js/npc/cradle.js"); return { online: net.online, relay: net.relay, peers: net.peers, seq: net.seq, err: net.lastError, rebirths: net.rebirths ?? 0, cradle: cradleRemote() }; });
const until = async (p, pred, ms = 20000) => { const t0 = Date.now(); let n; do { n = await netOf(p); if (pred(n)) return n; await sleep(400); } while (Date.now() - t0 < ms); return n; };

try {
  const A = await launch("RestartA");
  const B = await launch("RestartB");
  let a = await until(A, (n) => n.online && n.peers >= 1);
  let b = await until(B, (n) => n.online && n.peers >= 1);
  ok(a.online && b.online && a.peers >= 1 && b.peers >= 1, `both online through the pass-through and see each other (A peers ${a.peers}, B peers ${b.peers})`);
  ok(a.cradle.pulled === true && b.cradle.pulled === true, "both pulled the shared ledger");
  /* a message before the outage, as a control */
  await B.evaluate(() => window.__lg.sim.send({ t: "smoke", n: 1 }));
  await sleep(1500);
  ok((await A.evaluate(() => window.__heard)).includes(1), "a message from B reaches A before the outage (control)");
  const seqBefore = (await netOf(A)).seq;

  /* ---- the relay dies ------------------------------------------------- */
  relay.kill("SIGKILL");
  await sleep(500);
  a = await until(A, (n) => !n.online, 15000);
  b = await until(B, (n) => !n.online, 15000);
  ok(!a.online && !b.online, "relay killed: both go offline");
  ok(/503/.test(a.err) || /503/.test(b.err), `…on a 503 from the site's pass-through (${a.err || b.err})`);
  ok(a.relay === true && b.relay === true, "…and neither writes the relay off (a 503 is 'try again', not 'no relay')");
  /* a message sent during the outage is lost — that is expected; it is what happens AFTER that matters */

  /* ---- the relay comes back, new process: ring and cursor at zero ------ */
  relay = startRelay();
  ok(await upAt(`http://127.0.0.1:${RPORT}/net/ping`), "relay restarted (fresh process)");
  a = await until(A, (n) => n.online, 25000);
  b = await until(B, (n) => n.online, 25000);
  ok(a.online && b.online, `both back online (A after ${a.rebirths} rebirth, B after ${b.rebirths})`);
  ok(a.rebirths >= 1 && b.rebirths >= 1, "…and both noticed the room was reborn");
  ok(a.seq < seqBefore || a.seq <= 5, `A's cursor was reset to the new ring (${seqBefore} → ${a.seq})`);
  a = await until(A, (n) => n.peers >= 1, 20000);
  ok(a.peers >= 1, `A sees B again (${a.peers})`);
  /* THE test: a message after the restart must arrive */
  await B.evaluate(() => window.__lg.sim.send({ t: "smoke", n: 2 }));
  let heard = [];
  for (let i = 0; i < 30; i++) { await sleep(400); heard = await A.evaluate(() => window.__heard); if (heard.includes(2)) break; }
  ok(heard.includes(2), `a message from B reaches A AFTER the relay restart (heard ${JSON.stringify(heard)})`);
  await A.evaluate(() => window.__lg.sim.send({ t: "smoke", n: 3 }));
  let heardB = [];
  for (let i = 0; i < 30; i++) { await sleep(400); heardB = await B.evaluate(() => window.__heard); if (heardB.includes(3)) break; }
  ok(heardB.includes(3), `…and the other way (${JSON.stringify(heardB)})`);
  ok(errors.length === 0, `no page errors (${errors.join(" | ")})`);
} finally {
  await browser.close();
  site.kill(); relay.kill("SIGKILL");
  rmSync(dir, { recursive: true, force: true }); rmSync(relayDir, { recursive: true, force: true });
  try { rmSync(envFile, { force: true }); } catch { /* fine */ }
}
console.log(`smoke-relay-restart: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
