/* LIVING GALAXY — the local server, and the promise it makes to every other test.
 *
 *   node --import ./test/three-register.mjs test/server.test.mjs
 *
 * 0.3.36 gave server.py a colour console: three live screens on a keyboard
 * loop. That is a lovely thing to have and a dangerous thing to add, because
 * EVERY browser smoke in this directory starts the server the same way —
 *
 *     python3 server.py 8124 > log 2>&1 &
 *
 * — and a console that read a key or repainted a screen in that process would
 * hang or scribble over the log, and take a dozen suites down with it. So the
 * console is opt-out BY DETECTION: it opens only when stdin and stdout are
 * both terminals, which a redirect makes false.
 *
 * This suite is the guard on that promise. It starts the server exactly as
 * the smokes do, and checks it comes up, serves, speaks the whole relay
 * protocol, and exits — plus the two new things worth pinning, that the chat
 * book reads a hail out of what js/chat.js actually sends, and that the
 * request log still gets written.
 */
import { spawn } from "node:child_process";
import { readFileSync, existsSync, rmSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = new URL("../", import.meta.url).pathname;
const PORT = 8137;
const BASE = `http://127.0.0.1:${PORT}`;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

const post = async (path, body) => {
  const r = await fetch(BASE + path, { method: "POST", body: JSON.stringify(body) });
  return { status: r.status, json: await r.json().catch(() => null) };
};
const get = async (path) => {
  const r = await fetch(BASE + path);
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* a static file */ }
  return { status: r.status, text, json };
};

const chatLog = ROOT + "logs/chat.log";
if (existsSync(chatLog)) rmSync(chatLog);

/* started the way every smoke starts it: stdio piped, so not a terminal */
const srv = spawn("python3", ["server.py", String(PORT)], {
  cwd: ROOT, stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, LOG_CHAT: "1" },
});
let banner = "";
srv.stdout.on("data", (b) => { banner += b.toString(); });
srv.stderr.on("data", (b) => { banner += b.toString(); });

let up = false;
for (let i = 0; i < 60 && !up; i++) {
  await sleep(250);
  try { up = (await fetch(BASE + "/index.html")).ok; } catch { /* not yet */ }
}

try {
  /* ---- 1. it came up headless, and said so in plain text ---------------- */
  ok(up, "the server answers on its port");
  /* If it never came up, everything below is a stack trace rather than a
   * result. The commonest cause is exactly what this suite guards: a console
   * that opened on a redirected stdio and died trying to read a key. Say so,
   * and stop. */
  if (!up) {
    console.error("  the server never answered — banner was:\n" + (banner.trim() || "(nothing)"));
    throw new Error("server did not start");
  }
  ok(/LIVING GALAXY/.test(banner), "it printed its banner to stdout");
  ok(/http:\/\/127\.0\.0\.1:/.test(banner), "…with a URL to open");
  ok(/Logs:/.test(banner), "…and where the log went");
  ok(!/\x1b\[/.test(banner), "NO ANSI ESCAPES in a redirected stdout — a console here would corrupt every smoke's log");
  ok(!/\x1b\[2J/.test(banner), "…and nothing ever tried to clear the screen");

  /* ---- 2. it still serves the game ------------------------------------- */
  const idx = await get("/index.html");
  ok(idx.status === 200 && /LIVING GALAXY/.test(idx.text), "index.html is served");
  const mod = await get("/js/sim.js");
  ok(mod.status === 200 && mod.text.length > 1000, `a module is served (${mod.text.length} bytes)`);
  const miss = await get("/no-such-file.js");
  ok(miss.status === 404, "a missing file is a 404, not a crash");

  /* ---- 3. the relay protocol, end to end ------------------------------- */
  {
    const st = await post("/net/send", { room: "t", from: "alice", kind: "state", data: { x: 1 } });
    ok(st.status === 200 && st.json.ok, "a state is accepted");
    const m1 = await post("/net/send", { room: "t", from: "alice", kind: "msg", data: { kind: "hail", text: "Requesting a berth." } });
    ok(m1.json.seq === 1, `a message takes the next sequence (${m1.json.seq})`);

    const poll = await get("/net/poll?room=t&self=bob&since=0");
    ok(poll.json.states.alice?.x === 1, "a poll carries the other pilot's state");
    ok(poll.json.msgs.length === 1 && poll.json.msgs[0].data.text === "Requesting a berth.", "…and the message");
    ok(poll.json.host === "alice", "the longest-present pilot is the host");
    ok(typeof poll.json.born === "number" && poll.json.born > 0, "the room carries its shared clock zero");

    const fresh = await get("/net/poll?room=t&self=carol&since=-1");
    ok(fresh.json.msgs.length === 0, "since=-1 is a fresh join: the ring is not replayed");

    const w = await post("/net/world", { room: "t", from: "alice", world: { rocks: 3 } });
    ok(w.json.wseq === 1, "the host can write the sky snapshot");
    const gw = await get("/net/world?room=t");
    ok(gw.json.world.rocks === 3 && gw.json.by === "alice", "…and a later joiner can read it");

    const bad = await post("/net/send", { room: "t", kind: "msg", data: {} });
    ok(bad.status === 400, "a message with no sender is refused");
    const nope = await post("/net/nothing", {});
    ok(nope.status === 404, "an unknown endpoint is a 404");
  }

  /* ---- 4. the cradle ledger -------------------------------------------- */
  {
    const put = await post("/cradle/put", { room: "t", record: { id: "srvtest1", name: "Test Hand", born: "t" } });
    ok(put.json.ok === true, "a ledger record is accepted");
    const all = await get("/cradle/all?room=t");
    ok(all.json.cradle === 1 && Array.isArray(all.json.records), "the ledger reads back for one sky");
    ok(all.json.records.some((r) => r.id === "srvtest1"), "…and it contains what was just written");
  }

  /* ---- 5. the chat book ------------------------------------------------- */
  {
    /* what js/chat.js actually sends: the text is under one of several keys,
     * and the kind under another. The book has to find both. */
    await post("/net/send", { room: "t", from: "control", kind: "msg", data: { channel: "comms", line: "Cleared for lane two." } });
    await post("/net/send", { room: "t", from: "beacon", kind: "msg", data: { kind: "beacon", body: "SURGE WARNING" } });
    await post("/net/send", { room: "t", from: "dana", kind: "msg", to: "alice", data: "a bare string" });
    /* a state is not chat and must never appear in the chat log */
    await post("/net/send", { room: "t", from: "alice", kind: "state", data: { x: 9 } });
    await sleep(400);

    ok(existsSync(chatLog), "LOG_CHAT=1 writes logs/chat.log");
    const lines = readFileSync(chatLog, "utf8").trim().split("\n");
    ok(lines.length >= 4, `every hail is a line (${lines.length})`);
    const all = lines.join("\n");
    ok(/Requesting a berth\./.test(all), "a `text` field is found");
    ok(/Cleared for lane two\./.test(all), "…a `line` field too");
    ok(/SURGE WARNING/.test(all), "…and a `body` field");
    ok(/a bare string/.test(all), "a message that is just a string still logs");
    ok(/\(comms\)/.test(all) && /\(beacon\)/.test(all), "the kind is carried through");
    ok(/dana -> alice/.test(all), "a directed hail records who it was for");
    ok(!/"x": ?9/.test(all) && !/\(state\)/.test(all), "a STATE is not chat — the screen would be useless full of position updates");
    ok(lines.every((l) => /^\d{4}-\d{2}-\d{2}T/.test(l)), "every line is timestamped");
  }

  /* ---- 6. the request log ----------------------------------------------- */
  {
    const latest = ROOT + "logs/latest.log";
    ok(existsSync(latest), "logs/latest.log points at this run");
    const name = readFileSync(latest, "utf8").trim();
    ok(/^run-\d{8}-\d{6}-[0-9a-f]{4}\.log$/.test(name), `…at a per-run file (${name})`);
    const body = readFileSync(ROOT + "logs/" + name, "utf8");
    ok(/SERVER START/.test(body), "the run log opens with a start line");
    ok(/target=\/index\.html/.test(body), "…and records what was fetched");
    ok(!/\x1b\[/.test(body), "no escape codes in the log file — colour belongs on the screen only");
  }
} catch (e) {
  fail++;
  console.error("  FAIL", e.message);
} finally {
  srv.kill("SIGTERM");
  await sleep(300);
  if (!srv.killed) srv.kill("SIGKILL");
}

console.log(`server: ${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
