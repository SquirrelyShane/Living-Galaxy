/* LIVING GALAXY 0.3.74 — the hangar: list the account's pilots, fly one, make one, delete one; guests are not kept.
 *
 *   node --import ./test/three-register.mjs test/hangar.test.mjs [path/to/lgsite.py]
 *
 * Runs js/account.js against the REAL lgsite.py when one is found (an argument,
 * $LGSITE_PY, or ../site/lgsite.py) and against a small fake otherwise.
 *
 * Reported: signing in reloaded the page three times, recalling a pilot took an
 * extremely long time, and there was no way to choose a pilot — the account's
 * one copy was pulled whole and written over the device on every boot. */

import { existsSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawn, execFileSync } from "node:child_process";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function device() {
  const m = new Map();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null };
}
globalThis.localStorage = device();
globalThis.document = undefined;

const A = await import("../js/account.js");
const { account, probe, push, listPilots, flyPilot, newPilotSlot, deletePilot, eraseGuest, MAX_PILOTS } = A;
const { pilotsBySky, skyOf } = await import("../js/hangar.js");
const { useGameStore } = await import("../js/store.js");

const pilotOn = (ls, callsign) => {
  ls.setItem("lgaa-save-v1", JSON.stringify({ version: 2, callsign, skies: {} }));
  ls.setItem("lgaa.profile.v1", JSON.stringify({ id: "r-" + callsign, callsign }));
};
function reset(fetchFn, ls = device()) {
  globalThis.localStorage = ls;
  Object.assign(account, { site: null, user: null, status: "idle", error: "", version: 0, hash: "", lastSync: 0, lastTry: 0, conflict: null, newer: null, busy: false, pilots: null, guest: false, slot: "default", meta: null, flushers: [] });
  account.fetch = fetchFn;
  account.reloads = 0;
  account.reload = () => { account.reloads++; };
  let t = 1e6; account.now = () => (t += 20000);
  return ls;
}

/* ---- grouping ----------------------------------------------------------------- */
ok(skyOf({ sky: "public" }) === "sol" && skyOf({ sky: "" }) === "sol" && skyOf({ sky: "kx9q3" }) === "kx9q3", "Sol's old names group as Sol");
const g = pilotsBySky([{ sky: "sol" }, { sky: "public" }, { sky: "kx9q3" }]);
ok(g.get("sol").length === 2 && g.get("kx9q3").length === 1, "pilots grouped by the system they fly in");

/* ---- against the real site ----------------------------------------------------- */
const SITE = [process.argv[2], process.env.LGSITE_PY, join(process.cwd(), "..", "site", "lgsite.py")].find((p) => p && existsSync(p));
if (!SITE) {
  console.log("  (no lgsite.py found — pass its path, or set LGSITE_PY; the live half is skipped)");
} else {
  const data = mkdtempSync(join(tmpdir(), "lghangar-"));
  execFileSync("python3", ["-c", `
import os, sys, importlib.util, time
os.environ["LGSITE_DATA"] = sys.argv[1]
spec = importlib.util.spec_from_file_location("lg", sys.argv[2]); lg = importlib.util.module_from_spec(spec); spec.loader.exec_module(lg)
lg.DBI.migrate()
lg.DBI.x("INSERT INTO users(username, email, pw, verified_at, created_at) VALUES(?,?,?,?,?)", ("pilot", "p@x.test", lg.hash_password("correct horse battery"), time.time(), time.time()))
`, data, SITE]);
  const PORT = 8460 + Math.floor(Math.random() * 60);
  const BASE = `http://127.0.0.1:${PORT}`;
  const srv = spawn("python3", [SITE], { cwd: dirname(SITE), stdio: "ignore", env: { ...process.env, LGSITE_PORT: String(PORT), LGSITE_DATA: data, SECURE_COOKIES: "0", GAME_DIR: process.cwd(), RELAY_URL: "" } });
  const jar = new Map();
  const F = async (path, init = {}) => {
    const headers = { ...(init.headers ?? {}), Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") };
    const r = await fetch(BASE + path, { ...init, headers, redirect: "manual" });
    for (const c of r.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const i = kv.indexOf("="); jar.set(kv.slice(0, i).trim(), kv.slice(i + 1)); }
    return r;
  };
  try {
    for (let i = 0; i < 60; i++) { try { await fetch(BASE + "/health"); break; } catch { await sleep(100); } }

    /* a guest on the site: the last guest's pilot is gone before this one flies */
    let ls = reset(F);
    pilotOn(ls, "OldGuest");
    await probe();
    ok(account.site === true && account.guest === true, "signed out on the site: a guest");
    ok(eraseGuest() >= 0 && !ls.getItem("lgaa-save-v1") && !ls.getItem("lgaa.profile.v1"), "the guest's leftover pilot is erased");

    /* sign in (the site's JSON login, as the game's own form does), then three pilots */
    const li = await F("/api/login", { method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "lgsite" }, body: JSON.stringify({ username: "pilot", password: "correct horse battery" }) });
    ok(li.status === 200, "signed in");
    const up = async (name, sky) => {
      ls = reset(F);
      await probe();
      await listPilots();
      const slot = newPilotSlot();
      pilotOn(ls, name);
      account.meta = () => ({ callsign: name, career: "Miner", sky, credits: 100 });
      const r = await push({ force: true });
      return { slot, r };
    };
    const a = await up("Ada", "sol"), b = await up("Bex", "kx9q3"), c = await up("Cy", "sol");
    ok(a.r && b.r && c.r && new Set([a.slot, b.slot, c.slot]).size === 3, `three pilots saved in three slots (${a.slot}, ${b.slot}, ${c.slot})`);
    ls = reset(F);
    await probe();
    await listPilots();
    ok(account.pilots.length === 3 && account.pilots.every((p) => p.callsign && p.sky), "listPilots: all three, with callsign and system");
    ok(newPilotSlot() === null, `a fourth is refused (MAX_PILOTS ${MAX_PILOTS})`);
    const bySky = pilotsBySky(account.pilots);
    ok(bySky.get("sol")?.length === 2 && bySky.get("kx9q3")?.length === 1, "two in Sol, one in the named system");

    /* boot on a device that holds someone else: NOTHING is pulled, restored or reloaded */
    ls = reset(F);
    pilotOn(ls, "Leftover");
    useGameStore.setState({ phase: "menu" });
    const stop = A.mountAccount({ meta: () => ({}), flushers: [] });
    await sleep(300);
    ok(account.reloads === 0 && JSON.parse(ls.getItem("lgaa-save-v1")).callsign === "Leftover", "boot signed in: no restore, no reload — the hangar decides");
    ok(account.pilots?.length === 3, "…and the hangar has the list");
    stop();

    /* fly one: only that pilot comes down, no reload, and it is the one that syncs */
    const bex = account.pilots.find((p) => p.callsign === "Bex");
    ok(await flyPilot(bex.slot), "FLY Bex");
    ok(JSON.parse(ls.getItem("lgaa-save-v1")).callsign === "Bex" && account.reloads === 0, "Bex is on the device, without a reload");
    ok(account.slot === bex.slot && account.version === bex.version, `…and syncs to Bex's slot (${account.slot} v${account.version})`);
    ls.setItem("lgaa-company", JSON.stringify({ founded: true, name: "Bex Co", treasury: 5 }));
    account.meta = () => ({ callsign: "Bex", career: "Miner", sky: "kx9q3", credits: 5 });
    ok(await push(), "a change goes up");
    await listPilots();
    const after = Object.fromEntries(account.pilots.map((p) => [p.callsign, p.version]));
    ok(after.Bex === 2 && after.Ada === 1 && after.Cy === 1, `…to Bex only (${JSON.stringify(after)})`);

    /* delete one: the account has room again */
    ok(await deletePilot(account.pilots.find((p) => p.callsign === "Cy").slot), "delete Cy");
    await listPilots();
    ok(account.pilots.length === 2 && !account.pilots.some((p) => p.callsign === "Cy"), "Cy is gone from the account");
    ok(newPilotSlot() !== null, "…and a new pilot has a slot again");
  } finally { srv.kill(); }
}

console.log(`hangar: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
