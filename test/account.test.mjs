/* LIVING GALAXY — js/account.js: the pilot that follows you between devices.
 *
 * Two halves. The first runs the module against an in-memory stand-in for the
 * site's API (the same status codes and shapes lgsite.py answers with) so
 * every branch — first sign-in on an empty account, on an empty device, on a
 * device with a different pilot, a 409 from a second device, a newer copy
 * found at boot, the news feed — is pinned without a server. The second half
 * runs the SAME module against the real lgsite.py when it is beside this tree
 * (../site), registering a user, verifying by the console mail, and playing two
 * devices against one account. It is skipped, and says so, when the site is
 * not there.
 *
 *   node --import ./test/three-register.mjs test/account.test.mjs
 */

import { existsSync, mkdtempSync, writeFileSync, chmodSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- a device: index-enumerable Storage, like the real one ---------------- */
function device() {
  const m = new Map();
  return {
    m,
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    get length() { return m.size; },
    key: (i) => [...m.keys()][i] ?? null,
  };
}
globalThis.localStorage = device();
globalThis.document = undefined;

const A = await import("../js/account.js");
const { account, snapshot, hashOf, restore, probe, signIn, signOut, push, resolve, sync, checkRemote, takeNewer, postNews, plainText, SCOPE, STATE_KEY, NEWS_SEEN_KEY, describe } = A;
const P = await import("../js/profile.js");
const { chat } = await import("../js/chat.js");
const { gnn, resetGnn } = await import("../js/gnn.js");
const { useGameStore } = await import("../js/store.js");

/* ---- the stand-in site ----------------------------------------------------- */
function fakeSite() {
  const S = { users: { shane: { password: "password123", verified: true }, newbie: { password: "password123", verified: false } }, saves: {}, news: [], calls: [], signedIn: null, down: false };
  const res = (status, json = null) => ({ status, ok: status < 300, headers: { get: () => (json == null ? "text/plain" : "application/json") }, json: async () => json });
  S.fetch = async (path, init = {}) => {
    S.calls.push({ path, method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null, keepalive: Boolean(init.keepalive), xrw: init.headers?.["X-Requested-With"] });
    if (S.down) return res(404);
    const [p, q] = path.split("?");
    const qs = Object.fromEntries(new URLSearchParams(q ?? ""));
    const u = S.signedIn ? { id: 1, username: S.signedIn, verified: S.users[S.signedIn].verified, role: "user" } : null;
    if (p === "/api/me") return res(200, { user: u });
    if (p === "/api/login") {
      const b = JSON.parse(init.body);
      const acct = S.users[b.username];
      if (!acct || acct.password !== b.password) return res(401, { error: "wrong username or password" });
      S.signedIn = b.username;
      return res(200, { ok: true, user: { id: 1, username: b.username, verified: acct.verified } });
    }
    if (p === "/api/logout") { S.signedIn = null; return res(200, { ok: true }); }
    if (p === "/api/news") return res(200, { news: S.news });
    if (p === "/api/save") {
      if (!u) return res(401, { error: "sign in" });
      if (!u.verified) return res(403, { error: "verify your email first" });
      if ((init.method ?? "GET") === "GET") {
        if (qs.slot) { const row = S.saves[qs.slot]; return row ? res(200, { slot: qs.slot, version: row.version, updated_at: row.at, data: row.data }) : res(404, { error: "no such save" }); }
        return res(200, { saves: Object.entries(S.saves).map(([slot, r]) => ({ slot, version: r.version, updated_at: r.at, callsign: r.meta?.callsign ?? "" })) });
      }
      const b = JSON.parse(init.body);
      const have = S.saves[b.slot];
      const sha = JSON.stringify(b.data);
      if (have && b.base_version && have.version !== b.base_version && have.sha !== sha) return res(409, { error: `server has version ${have.version}, you sent base ${b.base_version}` });
      const ver = have ? have.version + 1 : 1;
      S.saves[b.slot] = { version: ver, data: b.data, sha, meta: b.meta ?? have?.meta ?? null, at: 1700000000 + ver };
      return res(200, { ok: true, version: ver, bytes: sha.length });
    }
    return res(404);
  };
  return S;
}

function resetAccount(site, ls = device()) {
  globalThis.localStorage = ls;
  Object.assign(account, { site: null, user: null, status: "idle", error: "", version: 0, hash: "", lastSync: 0, lastTry: 0, conflict: null, newer: null, busy: false, news: { fetched: false, posted: 0 }, board: null, meta: null, flushers: [] });
  account.fetch = site.fetch;
  account.reloads = 0;
  account.reload = () => { account.reloads++; };
  let t = 1000000;
  account.now = () => (t += 20000);   // every call is 20 s later: MIN_GAP never blocks unless a test says so
  return ls;
}

const pilotOn = (ls, callsign = "Vex", extra = {}) => {
  ls.setItem("lgaa-save-v1", JSON.stringify({ version: 2, callsign, skies: {} }));
  ls.setItem("lgaa.profile.v1", JSON.stringify({ id: "r1", callsign }));
  ls.setItem("lgaa-company", JSON.stringify({ founded: true, name: `${callsign} Holdings`, treasury: 4200 }));
  ls.setItem(`lgaa.upgrades.v1:sky:${callsign}`, JSON.stringify(["plating"]));
  ls.setItem("lgaa.aria.v1", JSON.stringify({ w: [0.1] }));
  ls.setItem("lgaa.audio.mix", JSON.stringify({ master: 0.5 }));   // device: never travels
  ls.setItem("lgaa.cradle.v1", "[]");                              // the sky's: never travels
  for (const [k, v] of Object.entries(extra)) ls.setItem(k, v);
};

/* ---- 1. scope: what travels and what stays ------------------------------- */
{
  ok(P.RUN_KEYS.every((k) => SCOPE.keys.includes(k)), "every run key travels with the account");
  ok(P.LEARNED_KEYS.every((k) => SCOPE.keys.includes(k)), "so do the learned nets — ARIA follows the human");
  ok(SCOPE.keys.includes(P.PROFILE_KEY), "and the profile record");
  ok(P.DEVICE_KEYS.every((k) => !SCOPE.keys.includes(k)), "no device key travels");
  ok(!SCOPE.keys.includes("lgaa.cradle.v1"), "the cradle stays with the sky");
  ok(P.DEVICE_KEYS.includes(STATE_KEY) && P.DEVICE_KEYS.includes(NEWS_SEEN_KEY), "the module's own two keys are filed as the device's");
  ok(P.RUN_PREFIXES.every((p) => SCOPE.prefixes.includes(p)), "the callsign-suffixed families travel by prefix");
}

/* ---- 2. snapshot, hash, restore -------------------------------------------- */
{
  const site = fakeSite();
  const ls = resetAccount(site);
  pilotOn(ls);
  let flushed = 0;
  account.flushers = [() => { flushed++; }, () => { throw new Error("bad flusher"); }];
  const s = snapshot();
  ok(flushed === 1, "flushers run before the snapshot, and one that throws does not stop it");
  ok("lgaa-save-v1" in s.keys && "lgaa.profile.v1" in s.keys && "lgaa-company" in s.keys && "lgaa.aria.v1" in s.keys, "fixed keys are in");
  ok("lgaa.upgrades.v1:sky:Vex" in s.keys, "the suffixed family is found by enumeration");
  ok(!("lgaa.audio.mix" in s.keys) && !("lgaa.cradle.v1" in s.keys), "the mixer and the cradle are not");
  const h1 = hashOf(s);
  ok(/^[0-9a-f]{8}$/.test(h1) && hashOf(snapshot()) === h1, "the hash is stable across two snapshots of the same device");
  ls.setItem("lgaa-company", JSON.stringify({ founded: true, name: "Vex Holdings", treasury: 4300 }));
  ok(hashOf(snapshot()) !== h1, "…and changes when a key changes");
  const d = describe(s);
  ok(d.callsign === "Vex" && d.corp === "Vex Holdings" && d.credits === 4200 && d.purse === null, `describe() reads the callsign, corp and treasury off the blob (${JSON.stringify(d)})`);
  ls.setItem("lgaa-save-v1", JSON.stringify({ version: 2, callsign: "Vex", credits: 777, skies: {} }));
  ok(describe(snapshot()).purse === 777, "…and the wallet, when the save carries one (0.3.41)");

  const ls2 = resetAccount(site);
  ls2.setItem("lgaa-save-v1", JSON.stringify({ callsign: "Old" }));
  ls2.setItem("lgaa.robots.v1:sky:Old", "[1]");
  ls2.setItem("lgaa.audio.mix", "{}");
  const n = restore({ v: 1, keys: { ...s.keys, "lgaa.audio.mix": "evil", "lgaa.cradle.v1": "evil", "totally-other": "evil" } });
  ok(ls2.getItem("lgaa-save-v1").includes("Vex") && ls2.getItem("lgaa.upgrades.v1:sky:Vex"), "restore writes the account's keys");
  ok(ls2.getItem("lgaa.robots.v1:sky:Old") == null, "…and clears the previous pilot's family keys first");
  ok(ls2.getItem("lgaa.audio.mix") === "{}" && ls2.getItem("lgaa.cradle.v1") == null && ls2.getItem("totally-other") == null, "…and never writes outside its scope, whatever the blob says");
  ok(n === Object.keys(s.keys).length, `restore reports the keys that landed (${n})`);
  ok(restore(null) === 0 && restore({ keys: "nope" }) === 0, "a bad blob restores nothing");
}

/* ---- 3. probe: no site behind this origin -------------------------------- */
{
  const site = fakeSite();
  site.down = true;
  resetAccount(site);
  ok((await probe()) === false && account.site === false && account.status === "offline", "a 404 on /api/me means no site: offline");
  ok((await signIn("shane", "password123")) === false, "…and sign-in refuses without a network call");
  ok(site.calls.length === 1, "one probe, nothing else");
  ok((await push()) === false && (await sync()) === false && (await postNews()) === 0, "push/sync/news do nothing offline");
  const nerr = fakeSite();
  nerr.fetch = async () => { throw new TypeError("Failed to fetch"); };
  resetAccount(nerr);
  ok((await probe()) === false && account.status === "offline", "a network error at probe is offline too, not a crash");
}

/* ---- 4. first sign-in: empty account, pilot on the device ---------------- */
{
  const site = fakeSite();
  const ls = resetAccount(site);
  pilotOn(ls);
  account.meta = () => ({ callsign: "Vex", career: "Miner II", sky: "public", credits: 1234 });
  await probe();
  ok(account.site === true && account.user === null && account.status === "signed-out", "the site is there; nobody is signed in");
  ok((await signIn("shane", "wrong")) === false && /wrong/.test(account.error), "a wrong password is refused with the server's words");
  ok((await signIn("shane", "password123")) === true, "the right one signs in");
  ok(account.user?.username === "shane" && account.status === "synced" && account.version === 1, `…and the device's pilot went up as v1 (${account.status} v${account.version})`);
  const up = site.calls.find((c) => c.path === "/api/save" && c.method === "POST");
  ok(up && up.body.base_version === 0 && up.body.slot === "default", "the first upload carries base 0");
  ok(up.xrw === "lgsite", "every call carries the X-Requested-With the site treats as CSRF proof");
  ok(up.body.meta.callsign === "Vex" && up.body.meta.career === "Miner II" && up.body.meta.credits === 1234, "meta comes from the game's live state");
  ok(up.body.data.keys["lgaa-company"] && !up.body.data.keys["lgaa.audio.mix"], "the blob is the scope, nothing more");
  const st = JSON.parse(ls.getItem(STATE_KEY));
  ok(st.version === 1 && st.user === "shane" && st.hash === account.hash, "the device remembers which version it synced to");

  /* unchanged → no upload; changed → upload with the last version as base */
  const n0 = site.calls.length;
  ok((await sync()) === true && site.calls.length === n0, "an unchanged device does not upload");
  ls.setItem("lgaa-company", JSON.stringify({ founded: true, name: "Vex Holdings", treasury: 9000 }));
  ok((await sync()) === true && account.version === 2, "a changed one does, and moves to v2");
  ok(site.calls.at(-1).body.base_version === 1, "…with base 1");

  /* rate gap */
  const keep = account.now;
  let t = 5000000;
  account.now = () => (t += 1000);
  ls.setItem("lgaa-company", JSON.stringify({ founded: true, name: "Vex Holdings", treasury: 9001 }));
  await sync();
  const n1 = site.calls.length;
  ls.setItem("lgaa-company", JSON.stringify({ founded: true, name: "Vex Holdings", treasury: 9002 }));
  ok((await sync()) === false && site.calls.length === n1, "two syncs inside MIN_GAP_MS: the second waits");
  ok((await sync({ force: true })) === true, "…unless forced (the panel's SYNC NOW, the hidden-tab flush)");
  account.now = keep;

  /* sign out clears the device record but not the pilot */
  await signOut();
  ok(account.user === null && account.status === "signed-out" && ls.getItem(STATE_KEY) == null, "sign-out forgets the sync record");
  ok(ls.getItem("lgaa-save-v1"), "…and leaves the pilot on the device");
}

/* ---- 5. first sign-in: pilot on the account, empty device ---------------- */
{
  const site = fakeSite();
  site.saves.default = { version: 3, data: { v: 1, keys: { "lgaa-save-v1": JSON.stringify({ callsign: "Cloud" }), "lgaa.profile.v1": JSON.stringify({ callsign: "Cloud" }), "lgaa.drones.v1:sky:Cloud": "[]" } }, sha: "x", meta: { callsign: "Cloud" }, at: 1700000003 };
  const ls = resetAccount(site);
  ls.setItem("lgaa.audio.mix", JSON.stringify({ master: 0.2 }));
  await probe();
  ok((await signIn("shane", "password123")) === true, "signs in");
  ok(account.reloads === 1 && account.status === "restoring", "an empty device takes the account copy and reloads");
  ok(ls.getItem("lgaa-save-v1")?.includes("Cloud") && ls.getItem("lgaa.drones.v1:sky:Cloud") === "[]", "…the pilot is on the device");
  ok(ls.getItem("lgaa.audio.mix")?.includes("0.2"), "…and the mixer was not touched");
  ok(account.version === 3 && JSON.parse(ls.getItem(STATE_KEY)).version === 3, "the device now tracks v3");
  ok(!site.calls.some((c) => c.method === "POST" && c.path === "/api/save"), "nothing was uploaded — the account's copy was the only pilot");
}

/* ---- 6. first sign-in: a pilot on both → ask ----------------------------- */
{
  const site = fakeSite();
  site.saves.default = { version: 2, data: { v: 1, keys: { "lgaa-save-v1": JSON.stringify({ callsign: "Cloud" }), "lgaa-company": JSON.stringify({ founded: true, name: "Cloud Co", treasury: 77 }) } }, sha: "x", meta: { callsign: "Cloud" }, at: 1700000002 };
  const ls = resetAccount(site);
  pilotOn(ls, "Vex");
  await probe();
  await signIn("shane", "password123");
  ok(account.status === "conflict" && account.conflict, "two different pilots: a conflict, nothing done yet");
  ok(account.conflict.local.callsign === "Vex" && account.conflict.server.callsign === "Cloud" && account.conflict.server.version === 2, "the card has both sides");
  ok(account.conflict.server.corp === "Cloud Co" && account.conflict.server.credits === 77, "…with corp and treasury");
  ok(ls.getItem("lgaa-save-v1").includes("Vex") && site.saves.default.data.keys["lgaa-save-v1"].includes("Cloud"), "neither copy has moved");
  ok((await sync({ force: true })) === false, "sync is blocked while the question is open");
  ok((await resolve("nonsense")) === false && account.conflict, "an unknown answer changes nothing");

  /* keep the device */
  ok((await resolve("device")) === true && account.conflict === null && account.status === "synced", "KEEP THIS DEVICE uploads");
  ok(site.saves.default.version === 3 && site.saves.default.data.keys["lgaa-save-v1"].includes("Vex"), "…the account now holds Vex as v3");
  ok(site.calls.at(-1).body.base_version === 2, "…sent with the server's version as base, so it is not itself a stale write");
  ok(account.reloads === 0, "no reload: the device keeps running");

  /* the other way */
  const site2 = fakeSite();
  site2.saves.default = { ...site.saves.default, version: 2, data: { v: 1, keys: { "lgaa-save-v1": JSON.stringify({ callsign: "Cloud" }) } } };
  const ls2 = resetAccount(site2);
  pilotOn(ls2, "Vex");
  await probe();
  await signIn("shane", "password123");
  ok(account.status === "conflict", "conflict again");
  ok((await resolve("account")) === true && account.reloads === 1, "USE THE ACCOUNT COPY restores and reloads");
  ok(ls2.getItem("lgaa-save-v1").includes("Cloud") && ls2.getItem("lgaa.upgrades.v1:sky:Vex") == null, "…Vex is gone from the device, refits and all");
  ok(site2.saves.default.version === 2, "…and the account was not written");
}

/* ---- 7. a second device writes in between: 409 --------------------------- */
{
  const site = fakeSite();
  const ls = resetAccount(site);
  pilotOn(ls, "Vex");
  await probe();
  await signIn("shane", "password123");
  ok(account.version === 1, "device A synced v1");
  /* device B writes v2 behind A's back */
  site.saves.default = { version: 2, data: { v: 1, keys: { "lgaa-save-v1": JSON.stringify({ callsign: "Vex" }), "lgaa-company": JSON.stringify({ founded: true, name: "Vex Holdings", treasury: 1 }) } }, sha: "b", meta: null, at: 1700000002 };
  ls.setItem("lgaa-company", JSON.stringify({ founded: true, name: "Vex Holdings", treasury: 5555 }));
  ok((await sync({ force: true })) === false && account.status === "conflict", "A's next upload is refused: a conflict");
  ok(site.saves.default.version === 2 && site.saves.default.data.keys["lgaa-company"].includes('"treasury":1'), "B's copy is untouched");
  ok(account.conflict.server.version === 2 && account.conflict.local.credits === 5555, "the card shows B's version and A's treasury");
  await resolve("device");
  ok(site.saves.default.version === 3 && site.saves.default.data.keys["lgaa-company"].includes("5555"), "KEEP THIS DEVICE wins with base 2 → v3");

  /* a dead session on the server: the device drops to signed-out, no crash */
  site.signedIn = null;
  ls.setItem("lgaa-company", JSON.stringify({ founded: true, name: "Vex Holdings", treasury: 6 }));
  ok((await sync({ force: true })) === false && account.status === "signed-out" && account.user === null, "a 401 on upload means the cookie died: signed out");
}

/* ---- 8. boot on a signed-in device: a newer copy ------------------------- */
{
  const site = fakeSite();
  site.signedIn = "shane";
  const ls = resetAccount(site);
  pilotOn(ls, "Vex");
  /* pretend this device synced v1 earlier: the state record matches the current bytes */
  const snap0 = snapshot();
  ls.setItem(STATE_KEY, JSON.stringify({ version: 1, hash: hashOf(snap0), user: "shane", at: 1 }));
  site.saves.default = { version: 1, data: snap0, sha: "a", meta: null, at: 1700000001 };
  await probe();
  ok(account.user?.username === "shane" && account.version === 1 && account.hash === hashOf(snap0), "the cookie is still good: signed in, tracking v1");
  ok((await checkRemote()) === false && account.reloads === 0, "nothing newer: nothing happens");
  /* another device writes v2 */
  site.saves.default = { version: 2, data: { v: 1, keys: { ...snap0.keys, "lgaa-company": JSON.stringify({ founded: true, name: "Vex Holdings", treasury: 8888 }) } }, sha: "b", meta: { callsign: "Vex" }, at: 1700000002 };
  ok((await checkRemote({ auto: false })) === true && account.newer?.version === 2 && account.reloads === 0, "while flying: a newer copy is only reported");
  ok(/newer copy/.test(A.accountLine()), "…and the status line says so");
  ok((await takeNewer()) === true && account.reloads === 1 && ls.getItem("lgaa-company").includes("8888") && account.version === 2, "TAKE THE NEWER COPY restores and reloads");
  /* at the menu: taken automatically when this device has not changed */
  site.saves.default = { version: 3, data: { v: 1, keys: { ...snap0.keys, "lgaa-company": JSON.stringify({ founded: true, name: "Vex Holdings", treasury: 9999 }) } }, sha: "c", meta: null, at: 1700000003 };
  ok((await checkRemote()) === true && account.reloads === 2 && ls.getItem("lgaa-company").includes("9999") && account.version === 3, "at the menu: taken automatically");
  /* both changed: a conflict, never a silent overwrite */
  site.saves.default = { version: 4, data: { v: 1, keys: { ...snap0.keys } }, sha: "d", meta: null, at: 1700000004 };
  ls.setItem("lgaa-company", JSON.stringify({ founded: true, name: "Vex Holdings", treasury: 1 }));
  ok((await checkRemote()) === true && account.status === "conflict" && account.reloads === 2, "both moved: the question, not a reload");
}

/* ---- 9. an unverified account signs in but cannot sync ------------------- */
{
  const site = fakeSite();
  const ls = resetAccount(site);
  pilotOn(ls);
  await probe();
  ok((await signIn("newbie", "password123")) === true && account.status === "unverified", "signed in, unverified");
  ok((await sync({ force: true })) === false && !site.calls.some((c) => c.method === "POST" && c.path === "/api/save"), "…no upload is attempted");
  ok(/verify your email/.test(A.accountLine()), "the line says what to do");
}

/* ---- 10. news → the GNN desk ------------------------------------------------ */
{
  const site = fakeSite();
  site.news = [
    { id: 5, title: "0.3.40 is out", kind: "patch", at: 5, by: "shane", text: "**Accounts** and `sync`.\n\n> quoted\n- list" },
    { id: 4, title: "Weekend event", kind: "event", at: 4, by: "shane", text: "Double bounties." },
    { id: 3, title: "Plain news", kind: "news", at: 3, by: "shane", text: "Hello." },
    { id: 2, title: "Old 2", kind: "update", at: 2, by: "shane", text: "x" },
    { id: 1, title: "Old 1", kind: "update", at: 1, by: "shane", text: "x" },
    { id: 0, title: "Older still", kind: "news", at: 0, by: "shane", text: "x" },
  ];
  const ls = resetAccount(site);
  resetGnn(); chat.log.length = 0;
  await probe();
  ok(plainText("**Accounts** and `sync`.\n\n> quoted\n- list") === "Accounts and sync. quoted - list", "site markup is stripped for the desk");
  ok((await postNews()) === 5, "the five newest unseen items are posted");
  ok(gnn.posts.length === 5 && gnn.posts[0].title === "UPDATE · Old 1" && gnn.posts[4].title === "PATCH NOTES · 0.3.40 is out", "…oldest first, tagged by kind");
  ok(gnn.posts[3].title === "EVENT · Weekend event" && gnn.posts[2].title === "Plain news", "news carries no tag; events and patches do");
  ok(gnn.posts[4].body === "Accounts and sync. quoted - list", "the body is plain text");
  ok(chat.log.length === 5 && chat.log.every((m) => m.channel === "gnn"), "each is a GNN bulletin in chat");
  ok(JSON.parse(ls.getItem(NEWS_SEEN_KEY)).length === 6, "every id in the feed is marked seen, including the one over the cap");
  account.news.fetched = false;
  ok((await postNews()) === 0 && gnn.posts.length === 5, "a second read posts nothing");
  site.news.unshift({ id: 6, title: "Fresh", kind: "news", at: 6, by: "shane", text: "y" });
  account.news.fetched = false;
  ok((await postNews()) === 1 && gnn.posts.at(-1).title === "Fresh", "…until something new is published");
  /* the seen-set is the device's: a new pilot does not re-read the patch notes */
  P.clearRun();
  ok(ls.getItem(NEWS_SEEN_KEY), "a new run keeps the seen-set");
}

/* ---- 10b. 0.3.43: bulletins link back to the site; the pilots board ------ */
{
  const site = fakeSite();
  site.news = [
    { id: 9, title: "Linked", kind: "news", at: 9, by: "s", text: "t", url: "/news/9", discuss: "/forum/t/4", replies: 3 },
    { id: 8, title: "Unlinked", kind: "news", at: 8, by: "s", text: "t" },
    { id: 7, title: "Hostile", kind: "news", at: 7, by: "s", text: "t", url: "https://evil.example/x", discuss: "//evil.example/y", replies: 0 },
    { id: 6, title: "Quiet", kind: "news", at: 6, by: "s", text: "t", url: "/news/6", discuss: "/forum/t/2", replies: 0 },
  ];
  const ls = resetAccount(site);
  resetGnn(); chat.log.length = 0;
  const opened = [];
  account.open = (u) => opened.push(u);
  await probe();
  ok((await postNews()) === 4, "four bulletins");
  const byTitle = (t) => gnn.posts.find((p) => p.title === t);
  const linked = byTitle("Linked");
  ok(linked.actions.map((a) => a.label).join("|") === "Read|Discuss (3)", `a linked item carries READ and DISCUSS with the reply count (${linked.actions.map((a) => a.label)})`);
  ok(byTitle("Unlinked").actions.length === 0, "an item from a 0.1.0 site carries no buttons");
  ok(byTitle("Hostile").actions.length === 0, "a scheme or a //host in the feed is never turned into a button");
  ok(byTitle("Quiet").actions[1].label === "Discuss", "no replies: plain DISCUSS");
  const { runAction } = await import("../js/gnn.js");
  ok(runAction(linked, 1) === true && opened.at(-1) === "/forum/t/4", "DISCUSS opens the thread");
  ok(runAction(linked, 1) === true && opened.length === 2, "…and again — a link is not done after one tap");
  ok(runAction(linked, 0) === true && opened.at(-1) === "/news/9", "READ opens the item");
  ok(runAction(linked, 0) === true && opened.length === 4 && !linked.actions[0].done, "…and READ repeats too");
  ok(chat.log.find((m) => /Linked/.test(m.text)).links.length === 3, "the chat line carries the desk link plus both buttons");
  void ls;

  /* the board */
  let boardHits = 0;
  site.fetch = ((orig) => async (path, init) => {
    if (path === "/api/leaderboard") { boardHits++; return { status: 200, ok: true, headers: { get: () => "application/json" }, json: async () => ({ pilots: Array.from({ length: 12 }, (_, i) => ({ rank: i + 1, callsign: `P${i}`, career: "Miner", sky: "sol", credits: 1000 - i, at: 1 })), total: 40 }) }; }
    return orig(path, init);
  })(site.fetch);
  account.fetch = site.fetch;
  const b = await A.loadBoard();
  ok(b && b.pilots.length === 10 && b.pilots[0].callsign === "P0" && b.total === 40, `the board holds the top ten of ${b?.total}`);
  await A.loadBoard();
  ok(boardHits === 1, "…and is not fetched again inside a minute (the card repaints every frame)");
  await A.loadBoard({ force: true });
  ok(boardHits === 2, "…unless forced");
  const site0 = fakeSite();          // a 0.1.0 site: no /api/leaderboard → 404
  resetAccount(site0);
  await probe();
  ok((await A.loadBoard()) === null && account.board === null, "a site without the board: null, no error");
}

/* ---- 11. mountAccount wires without a window and posts news on play ------ */
{
  const site = fakeSite();
  site.news = [{ id: 1, title: "Boot news", kind: "news", at: 1, by: "s", text: "z" }];
  resetAccount(site);
  resetGnn();
  useGameStore.setState({ phase: "menu" });
  const stop = A.mountAccount({ meta: () => ({ callsign: "Q" }), flushers: [] });
  await sleep(20);
  ok(account.site === true && gnn.posts.length === 0, "mounted: probed, but the feed waits for the pilot to fly");
  useGameStore.setState({ phase: "play" });
  await sleep(20);
  ok(gnn.posts.length === 1 && gnn.posts[0].title === "Boot news", "…and lands once the phase is play");
  stop();
  useGameStore.setState({ phase: "menu" });
}

/* ---- 12. the same module against the real lgsite.py ---------------------- */
const SITE = join(process.cwd(), "..", "site", "lgsite.py");
if (!existsSync(SITE)) {
  console.log("  (../site/lgsite.py not beside this tree — the live-site half is skipped)");
} else {
  const PORT = 8213;
  const BASE = `http://127.0.0.1:${PORT}`;
  const dir = mkdtempSync(join(tmpdir(), "lgacct-"));
  const envFile = join(process.cwd(), "..", "site", "lgsite.env.test");
  writeFileSync(envFile, ""); chmodSync(envFile, 0o600);
  const srv = spawn("python3", ["lgsite.py"], {
    cwd: join(process.cwd(), "..", "site"), stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, LGSITE_PORT: String(PORT), LGSITE_DATA: dir, SITE_URL: BASE, MAIL_BACKEND: "console", SECURE_COOKIES: "0", LGSITE_DEV: "1", GAME_DIR: process.cwd(), LGSITE_INSECURE_OK: "1", RELAY_URL: "" },
  });
  let out = "";
  srv.stdout.on("data", (b) => { out += b; }); srv.stderr.on("data", (b) => { out += b; });
  let up = false;
  for (let i = 0; i < 40 && !up; i++) { await sleep(250); try { up = (await fetch(BASE + "/health")).ok; } catch { /* not yet */ } }
  ok(up, "the real site answers");
  try {
    /* a cookie jar per "device": the browser would do this; node's fetch does not */
    const jarFetch = () => {
      const jar = new Map();
      return async (path, init = {}) => {
        const headers = { ...(init.headers ?? {}), Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") };
        const r = await fetch(BASE + path, { ...init, headers, redirect: "manual" });
        for (const c of r.headers.getSetCookie?.() ?? []) { const [kv, ...rest] = c.split(";"); const [k, v] = kv.split("="); if (rest.some((x) => /max-age=0/i.test(x))) jar.delete(k.trim()); else jar.set(k.trim(), v); }
        return r;
      };
    };
    /* register + verify through the site's own forms */
    const F = jarFetch();
    const home = await (await F("/register")).text();
    const csrf = (home.match(/name="csrf" value="([^"]+)"/) ?? [])[1];
    const form = (o) => new URLSearchParams(o).toString();
    await F("/register", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ csrf, username: "pilot_one", email: "one@example.test", password: "a fine long password" }) });
    const link = (out.match(/\/verify\?t=([A-Za-z0-9_-]+)/) ?? [])[1];
    ok(Boolean(link), "the console mailer printed a verification link");
    await F(`/verify?t=${link}`);

    /* device A: the game module signs in and uploads */
    const site = { fetch: jarFetch() };
    const lsA = resetAccount(site);
    pilotOn(lsA, "Ada");
    account.meta = () => ({ callsign: "Ada", career: "Courier", sky: "public", credits: 321 });
    await probe();
    ok(account.site === true && account.status === "signed-out", "probe against the real /api/me");
    ok((await signIn("pilot_one", "a fine long password")) === true && account.version === 1 && account.status === "synced", `real sign-in and first upload (${account.status} v${account.version} ${account.error})`);
    const hashA = account.hash;

    /* device B: empty, same account → takes the copy */
    const siteB = { fetch: jarFetch() };
    const lsB = resetAccount(siteB);
    await probe();
    ok((await signIn("pilot_one", "a fine long password")) === true && account.reloads === 1 && lsB.getItem("lgaa-save-v1")?.includes("Ada"), "device B pulls Ada down and reloads");
    ok(account.version === 1 && account.hash === hashA, "…tracking the same version and bytes");
    /* B changes and syncs → v2 */
    lsB.setItem("lgaa-company", JSON.stringify({ founded: true, name: "Ada Holdings", treasury: 100 }));
    ok((await sync({ force: true })) === true && account.version === 2, "B's change goes up as v2");

    /* device A changes too → 409 → keeps its own → v3 */
    resetAccount(site, lsA);
    account.user = { id: 1, username: "pilot_one", verified: true }; account.site = true; account.version = 1; account.hash = hashA;
    account.meta = () => ({ callsign: "Ada", career: "Courier", sky: "public", credits: 321 });
    lsA.setItem("lgaa-company", JSON.stringify({ founded: true, name: "Ada Holdings", treasury: 200 }));
    ok((await sync({ force: true })) === false && account.status === "conflict" && account.conflict.server.version === 2, "A's stale write is refused by the real server: conflict");
    ok(account.conflict.server.credits === 100 && account.conflict.local.credits === 200, "the real card shows both treasuries");
    ok((await resolve("device")) === true && account.version === 3, "A keeps its device: v3");

    /* the account page lists the pilot by the meta the game sent (the site's
     * own session: registering does not sign in, so sign in by the form) */
    const lp = await (await F("/login")).text();
    const csrfL = (lp.match(/name="csrf" value="([^"]+)"/) ?? [])[1];
    await F("/login", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ csrf: csrfL, username: "pilot_one", password: "a fine long password" }) });
    const acct = await (await F("/account")).text();
    ok(/Ada/.test(acct) && /Courier/.test(acct), "the site's account page shows the callsign and career the game sent");

    /* news published on the site reaches the desk */
    /* promote through the database, as the runbook's create-admin would (it is interactive) */
    const admin = spawn("python3", ["-c", `import sqlite3; c = sqlite3.connect(${JSON.stringify(join(dir, "lgsite.db"))}); c.execute("UPDATE users SET role='admin' WHERE username='pilot_one'"); c.commit()`]);
    await new Promise((r) => admin.on("exit", r));
    const ap = await (await F("/admin/news")).text();
    const csrf2 = (ap.match(/name="csrf" value="([^"]+)"/) ?? [])[1];
    const posted = await F("/admin/news", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ csrf: csrf2, title: "Live bulletin", kind: "update", body: "From the **site**.", publish: "1" }) });
    ok(posted.status === 303 || posted.status === 200, `an admin can publish news (${posted.status})`);
    resetGnn();
    account.news.fetched = false;
    const n = await postNews();
    ok(n === 1 && gnn.posts[0].title === "UPDATE · Live bulletin" && gnn.posts[0].body === "From the site.", `…and the game puts it on the desk (${n}: ${gnn.posts[0]?.title})`);
    /* 0.3.43 against site 0.1.1: the bulletin links to its page and thread; the board lists Ada */
    const labels = gnn.posts[0].actions.map((a) => a.label);
    ok(labels[0] === "Read" && labels[1] === "Discuss", `the live bulletin carries READ and DISCUSS (${labels})`);
    const opened = [];
    account.open = (u) => opened.push(u);
    const { runAction } = await import("../js/gnn.js");
    runAction(gnn.posts[0], 1);
    ok(/^\/forum\/t\/\d+$/.test(opened[0] ?? ""), `DISCUSS opens the site's thread (${opened[0]})`);
    const thread = await (await F(opened[0])).text();
    ok(/Live bulletin/.test(thread) && /From the/.test(thread), "…which exists, opened with the item's text");
    const board = await A.loadBoard({ force: true });
    ok(board && board.pilots[0]?.callsign === "Ada" && board.total === 1, `the live board lists Ada by purse (${JSON.stringify(board?.pilots?.[0])})`);
  } finally {
    srv.kill();
    rmSync(dir, { recursive: true, force: true });
    try { rmSync(envFile, { force: true }); } catch { /* fine */ }
  }
}

console.log(`account: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
