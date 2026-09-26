/* 0.3.66 — a failed poll goes offline cleanly; the relay's replies carry no no-store.
 * node --import ./test/three-register.mjs test/netoffline.test.mjs
 *
 * 0.3.64's catch block read `j.worldRevision`, but `j` belongs to the try
 * block, so every failed poll threw a ReferenceError from inside its own error
 * handler: the room listeners never heard `offline`, `net.lastError` and the
 * back-off delay were never set, and the promise rejected unhandled. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
const store = new Map();
globalThis.localStorage = globalThis.sessionStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.document = { hidden: false, addEventListener() {} };
globalThis.window = globalThis;
const rejections = [];
process.on("unhandledRejection", (e) => rejections.push(e));
globalThis.fetch = async () => { throw new TypeError("network down"); };
const { net, connectNet, disconnectNet, onRoom } = await import("../js/net.js");
const heard = [];
onRoom((info) => heard.push(info));
connectNet("offline-test");
await new Promise((r) => setTimeout(r, 300));
disconnectNet();
let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; };
ok(rejections.length === 0, `no unhandled rejection (${rejections.map(String).join("; ")})`);
ok(heard.some((i) => i.offline === true && i.worldRevision === null), "room listeners told: offline");
ok(net.online === false && /network down/.test(net.lastError), `lastError recorded (${net.lastError})`);

/* the relay itself: JSON replies are no-cache (end_headers), never no-store */
import { get } from "node:http";
const port = 18000 + Math.floor(Math.random() * 2000);
const relay = spawn("python3", ["server.py", String(port)], { cwd: new URL("..", import.meta.url).pathname, env: { ...process.env, LG_HOST: "127.0.0.1", LG_MENU: "0", SOL_HOST_TOKEN: "" }, stdio: "ignore" });
const head = (path) => new Promise((res, rej) => get({ host: "127.0.0.1", port, path }, (r) => { r.resume(); res(r.headers); }).on("error", rej));
let h = null;
for (let i = 0; i < 80 && !h; i++) { try { h = await head("/net/poll?room=hdr&self=t&since=0"); } catch { await new Promise((r) => setTimeout(r, 100)); } }
relay.kill();
ok(h, "relay answered");
const cc = String(h["cache-control"] ?? "");
ok(/no-cache/.test(cc) && !/no-store/.test(cc), `poll reply Cache-Control is "${cc}"`);
console.log(`net offline: PASS — ${pass} assertions`);
