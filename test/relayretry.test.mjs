/* LIVING GALAXY — 0.3.44: the shared ledger survives a relay outage.
 *
 * js/npc/cradle.js pulled the server's records exactly once, at connect, and
 * switched pushes off for the session after four failures. A relay that was
 * down for the few seconds of a launch — a cloudflared restart, `--update`
 * bouncing lg-relay, the site's pass-through answering 503 — meant that
 * session never saw the sky's people and never shared its own, until a
 * reload. This drives the module with a fake fetch and fake timers: the pull
 * backs off and comes back, the push gate reopens, a static host is still
 * written off exactly once.
 *
 *   node --import ./test/three-register.mjs test/relayretry.test.mjs
 */
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), get length() { return store.size; }, key: (i) => [...store.keys()][i] ?? null };

/* fake timers: setTimeout records; tick(ms) fires what is due */
const timers = [];
let clock = 0;
globalThis.setTimeout = (fn, ms) => { const t = { fn, at: clock + ms, id: timers.length + 1 }; timers.push(t); return t.id; };
globalThis.clearTimeout = (id) => { const i = timers.findIndex((t) => t.id === id); if (i >= 0) timers.splice(i, 1); };
const tick = async (ms) => { clock += ms; for (const t of timers.splice(0).filter((t) => t.at <= clock ? true : (timers.push(t), false))) { t.fn(); await Promise.resolve(); await Promise.resolve(); } await new Promise((r) => process.nextTick(r)); };
Date.now = () => 1700000000000 + clock;

/* fake relay */
const R = { status: 503, calls: [], records: [] };
globalThis.fetch = async (url, init = {}) => {
  R.calls.push({ url: String(url), method: init.method ?? "GET" });
  if (R.status !== 200) return { status: R.status, ok: false, json: async () => ({ error: "relay unreachable" }) };
  if (String(url).startsWith("/cradle/all")) return { status: 200, ok: true, json: async () => ({ records: R.records }) };
  return { status: 200, ok: true, json: async () => ({ ok: true }) };
};

const C = await import("../js/npc/cradle.js");
const { connectCradle, cradleRemote, flushRemote, generateNPC, cradle, PULL_RETRY_MS, PULL_RETRY_STEADY_MS, PUSH_RETRY_MS } = C;
let n = 0;
const fileOne = () => cradle.put(generateNPC(`retry-${n++}`));
const pulls = () => R.calls.filter((c) => c.url.startsWith("/cradle/all")).length;
const puts = () => R.calls.filter((c) => c.url.startsWith("/cradle/put")).length;

/* ---- 1. the pull backs off and comes back ------------------------------- */
{
  R.status = 503;
  connectCradle("sol");
  await tick(0);
  ok(pulls() === 1 && cradleRemote().failed === 1 && !cradleRemote().pulled, "a 503 at connect: one failed pull, the ledger not pulled");
  ok(cradleRemote().dead === false, "…and the relay is NOT written off (503 is 'try again', not 'no relay')");
  await tick(PULL_RETRY_MS[0]);
  ok(pulls() === 2, `…retried after ${PULL_RETRY_MS[0] / 1000} s`);
  await tick(PULL_RETRY_MS[1]);
  ok(pulls() === 3, `…and after ${PULL_RETRY_MS[1] / 1000} s`);
  await tick(PULL_RETRY_MS[2]);
  ok(pulls() === 4, `…and after ${PULL_RETRY_MS[2] / 1000} s`);
  await tick(PULL_RETRY_STEADY_MS);
  ok(pulls() === 5, `…then every ${PULL_RETRY_STEADY_MS / 1000} s`);
  /* the relay returns */
  R.status = 200;
  R.records = [{ id: "npc-1", name: "Someone", born: 1, room: "sol" }];
  await tick(PULL_RETRY_STEADY_MS);
  ok(pulls() === 6 && cradleRemote().pulled === true && cradleRemote().failed === 0, "the relay is back: the pull lands, the count resets");
  await tick(PULL_RETRY_STEADY_MS * 3);
  ok(pulls() === 6, "…and no more pulls once it has landed");
}

/* ---- 2. the push gate reopens ------------------------------------------- */
{
  R.calls.length = 0;
  R.status = 503;
  /* four flushes fail → the old code stopped forever */
  const trace = [];
  for (let i = 0; i < 4; i++) { fileOne(); flushRemote(); await tick(0); trace.push(`${cradleRemote().failed}/${puts()}`); }
  const failedAfter = cradleRemote().failed;
  ok(failedAfter >= 4, `four failed flushes (${failedAfter})`);
  const before = puts();
  fileOne(); flushRemote(); await tick(0);
  ok(puts() === before, "the gate is shut: a fifth record is not sent yet");
  await tick(PUSH_RETRY_MS + 1);
  fileOne(); flushRemote(); await tick(0);
  ok(puts() === before + 1, `…but after ${PUSH_RETRY_MS / 1000} s one more try goes out`);
  ok(cradleRemote().failed >= 4, "…it failed too, so the gate shuts again");
  R.status = 200;
  await tick(PUSH_RETRY_MS + 1);
  fileOne(); flushRemote(); await tick(0);
  ok(cradleRemote().failed === 0 && puts() === before + 2, "the relay is back: the try succeeds and the count resets");
  fileOne(); flushRemote(); await tick(0);
  ok(puts() === before + 3, "…and pushes flow again");
}

/* ---- 3. a static host is still written off, exactly once ---------------- */
{
  R.calls.length = 0;
  R.status = 404;
  connectCradle("sol");
  await tick(0);
  ok(cradleRemote().dead === true, "a 404 means no ledger here: dead");
  await tick(PULL_RETRY_STEADY_MS * 5);
  ok(pulls() === 1, "…and it is never asked again");
}

console.log(`relayretry: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
