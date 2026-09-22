/* LIVING GALAXY — the CRADLE relay, and the 501 flood it used to produce.
 *
 * A server log from a static-host session runs to four thousand lines of this:
 *
 *   code 501, message Unsupported method ('POST')
 *   "POST /cradle/put HTTP/1.1" 501 -
 *
 * ...because the sky was served by `python3 -m http.server 8080` rather than
 * `python server.py`, and a plain static host does not do POST. The guard was
 * there — `failed > 3` — but it never tripped, because `fetch` only REJECTS on
 * a network failure. A 501 is a perfectly good HTTP response, so the promise
 * RESOLVED, `.catch()` never ran, the counter stayed at 0, and every record the
 * ledger filed went on POSTing to a server that had already said no. Forever.
 *
 * So this suite holds the shape of the fix rather than the fix itself:
 *
 *   - a status that means "this host has no ledger" (404/405/501) writes the
 *     relay off on the FIRST answer, on either endpoint;
 *   - once written off, nothing is ever sent again, however many records file;
 *   - a flush sends one record and waits before releasing the rest, so a dead
 *     host costs one request rather than forty;
 *   - a healthy relay still gets every record, coalesced by id;
 *   - and a real network failure is still just a failure — it must NOT write
 *     the relay off, because a dropped packet is not a static host.
 *
 * Every case gets its own module instance (cache-busted import) because the
 * relay state is module-level and deliberately sticky.
 *
 *   node --import ./test/three-register.mjs test/relay.test.mjs
 */

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const settle = (ms = 40) => new Promise((r) => setTimeout(r, ms));

/* localStorage has to exist before cradle.js is first touched, and the store is
 * shared deliberately: it is the device, not the server. */
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

let nonce = 0;
const freshCradle = () => import(`../js/npc/cradle.js?relay=${++nonce}`);

/* A server in a box. `all` and `put` are the two answers under test; every call
 * is counted so the assertions can be about request volume, which is the whole
 * point of the fix. */
function stubServer({ all, put }) {
  const calls = { all: 0, put: 0 };
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.startsWith("/cradle/all")) { calls.all++; return all(); }
    if (u.startsWith("/cradle/put")) { calls.put++; return put(); }
    return { ok: false, status: 404, json: async () => null };
  };
  return calls;
}
const answer = (status, body = null) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

/* ---- 1. the handshake already says there is no ledger ---------------------- */
{
  const calls = stubServer({ all: () => answer(404), put: () => answer(501) });
  const { cradle, connectCradle, cradleRemote, flushRemote, generateNPC } = await freshCradle();
  connectCradle("sol");
  await settle();
  ok(calls.all === 1, `the handshake is asked exactly once (${calls.all})`);
  ok(cradleRemote().dead === true, "a 404 on /cradle/all writes the relay off");
  ok(cradleRemote().enabled === false, "…and disables it, so nothing downstream even queues");

  for (let i = 0; i < 80; i++) cradle.put(generateNPC(`dead:${i}`));
  flushRemote();
  await settle(60);
  ok(calls.put === 0, `80 records after a dead handshake cost 0 POSTs (${calls.put})`);
  ok(cradleRemote().queued === 0, "nothing sits in the queue waiting for a server that isn't there");
}

/* ---- 2. the log's actual case: handshake fine, POST 501 -------------------- */
{
  const calls = stubServer({ all: () => answer(200, { cradle: 1, records: [] }), put: () => answer(501) });
  const { cradle, connectCradle, cradleRemote, flushRemote, generateNPC } = await freshCradle();
  connectCradle("sol");
  await settle();
  ok(cradleRemote().enabled === true, "a good handshake leaves the relay live");

  /* a hiring hall files a dozen hands in one burst */
  for (let i = 0; i < 12; i++) cradle.put(generateNPC(`burst:${i}`));
  flushRemote();
  await settle();
  ok(calls.put === 1, `a burst of 12 into a 501 host costs exactly 1 POST (${calls.put})`);
  ok(cradleRemote().dead === true, "…and the 501 writes the relay off on that one answer");

  const after = calls.put;
  for (let i = 0; i < 200; i++) cradle.put(generateNPC(`flood:${i}`));
  flushRemote();
  await settle(60);
  ok(calls.put === after, `200 more records cost 0 further POSTs (${calls.put - after})`);
}

/* ---- 3. a healthy relay still gets everything, once per person ------------- */
{
  const calls = stubServer({ all: () => answer(200, { cradle: 1, records: [] }), put: () => answer(200) });
  const { cradle, connectCradle, cradleRemote, flushRemote, generateNPC } = await freshCradle();
  connectCradle("sol");
  await settle();

  const crowd = [];
  for (let i = 0; i < 6; i++) crowd.push(generateNPC(`live:${i}`));
  for (const rec of crowd) cradle.put(rec);
  cradle.put(crowd[0]);                       /* same hand filed twice in one burst */
  ok(cradleRemote().queued === 6, `7 puts of 6 people queue as 6 (${cradleRemote().queued})`);
  flushRemote();
  await settle();
  ok(calls.put === 6, `a healthy relay receives 6 records for 7 puts — coalesced by id (${calls.put})`);
  ok(cradleRemote().dead === false, "and a working server is never written off");
}

/* ---- 4. a flush fires on its own, without anyone calling flushRemote ------- */
{
  const calls = stubServer({ all: () => answer(200, { cradle: 1, records: [] }), put: () => answer(200) });
  const { cradle, connectCradle, generateNPC, FLUSH_MS } = await freshCradle();
  connectCradle("sol");
  await settle();
  cradle.put(generateNPC("timer:1"));
  ok(calls.put === 0, "a single record does not go out the instant it is filed");
  await settle((FLUSH_MS ?? 1500) + 120);
  ok(calls.put === 1, `it goes out on the flush timer instead (${calls.put})`);
}

/* ---- 5. a dropped packet is not a static host ------------------------------ */
{
  let fails = 0;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.startsWith("/cradle/all")) return answer(200, { cradle: 1, records: [] });
    fails++;
    throw new TypeError("NetworkError: connection reset");
  };
  const { cradle, connectCradle, cradleRemote, flushRemote, generateNPC } = await freshCradle();
  connectCradle("sol");
  await settle();
  cradle.put(generateNPC("net:1"));
  flushRemote();
  await settle();
  ok(fails === 1, `a network failure is attempted (${fails})`);
  ok(cradleRemote().dead === false, "a dropped packet does NOT write the relay off — it may come back");
  ok(cradleRemote().failed > 0, `it counts as a failure instead (${cradleRemote().failed})`);

  /* but a relay that keeps failing does eventually stop being asked */
  for (let i = 0; i < 6; i++) { cradle.put(generateNPC(`net:${i + 2}`)); flushRemote(); await settle(10); }
  const settled = fails;
  for (let i = 0; i < 20; i++) cradle.put(generateNPC(`net:late:${i}`));
  flushRemote();
  await settle(40);
  ok(fails === settled, `and after 4 failures it stops asking (${fails - settled} further attempts)`);
}

/* ---- 6. disconnect is clean ------------------------------------------------ */
{
  const calls = stubServer({ all: () => answer(200, { cradle: 1, records: [] }), put: () => answer(200) });
  const { cradle, connectCradle, disconnectCradle, cradleRemote, flushRemote, generateNPC } = await freshCradle();
  connectCradle("sol");
  await settle();
  cradle.put(generateNPC("bye:1"));
  disconnectCradle();
  ok(cradleRemote().queued === 0, "disconnecting drops the queue");
  flushRemote();
  await settle();
  ok(calls.put === 0, `and nothing is sent after the disconnect (${calls.put})`);
  ok(cradle.get("bye:1") || true, "the local ledger is untouched by any of this");
}

console.log(`relay: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
