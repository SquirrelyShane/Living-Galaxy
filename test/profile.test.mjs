/* LIVING GALAXY — a new pilot is a new run, and the last one does not come back.
 *
 * The symptom: old corporation names and old player names persisted across a
 * page refresh, and across a restart of the relay server.
 *
 * They did, in three separate places, and each needed its own fix:
 *
 *   1. localStorage. The corporation, the fleet, the callsign and sky
 *      progress, refits, robots, missions, drones — a flat pile of keys that
 *      nothing ever swept. Make a new pilot and you inherited the last one's
 *      company, name and all. js/profile.js now says which key belongs to a
 *      RUN, which to the DEVICE, and which to the human at the controls, and
 *      creation.js clears the first group when a pilot is made.
 *
 *   2. The CRADLE. Employment (`status: aboard`, `employer: <callsign>`) is a
 *      fact about one run, and the ledger outlives runs by design. So a
 *      retired pilot's crew stayed filed as crewing a ship that no longer
 *      existed — which thinned the hiring halls, because they draw from the
 *      pool, and printed the old callsign beside every one of them.
 *
 *   3. The relay. cradle.json is THE thing that survives a server restart, so
 *      storing those flags there made the leak permanent and shared it with
 *      every other client. The server strips them on put now, and the client
 *      refuses to adopt them on import. That half is asserted in server.py's
 *      own check below.
 *
 * The load-bearing assertion in here is the LAST one: every localStorage key
 * in the tree must be classified in js/profile.js. That is what stops the next
 * feature from quietly adding a twelfth way for a dead pilot to come back.
 *
 *   node --import ./test/three-register.mjs test/profile.test.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

/* a Storage that is index-enumerable, like the real one — the sweep needs
 * length/key() to find the callsign-suffixed families */
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  get length() { return store.size; },
  key: (i) => [...store.keys()][i] ?? null,
};

const P = await import("../js/profile.js");
const { cradle, generateNPC, releaseEmployed, employedCount, importLedger } = await import("../js/npc/cradle.js");

/* ---- 1. the three groups are a partition, not three overlapping guesses --- */
{
  const all = [...P.RUN_KEYS, ...P.DEVICE_KEYS, ...P.LEARNED_KEYS];
  ok(new Set(all).size === all.length, "no key is filed in two groups at once");
  ok(P.RUN_KEYS.length + P.RUN_PREFIXES.length > 10, `the run group is not a token list (${P.RUN_KEYS.length} keys + ${P.RUN_PREFIXES.length} families)`);
  ok(P.RUN_PREFIXES.every((p) => p.endsWith(":")), "every prefix ends at a separator, so it cannot swallow a neighbour");
  ok(P.RUN_KEYS.includes("lgaa-company"), "the corporation belongs to a run — this is the corp name that used to persist");
  ok(P.RUN_KEYS.includes("lgaa-save-v1"), "so is the save that carries the callsign");
  ok(P.DEVICE_KEYS.includes("lgaa.audio.mix"), "the mixer is the device's, not the pilot's");
  ok(P.LEARNED_KEYS.includes("lgaa.aria.v1"), "ARIA's preference net follows the human, not the character");
  ok(!all.includes("lgaa.cradle.v1"), "the CRADLE is in none of them — it is the sky's population");
}

/* ---- 2. a run clears exactly its own ------------------------------------- */
{
  store.clear();
  for (const k of [...P.RUN_KEYS, ...P.DEVICE_KEYS, ...P.LEARNED_KEYS]) store.set(k, "{}");
  store.set("lgaa.cradle.v1", "[]");
  /* the suffixed families, for three skies and two callsigns — the shape the
   * real thing takes after a couple of sessions */
  const suffixed = [];
  for (const p of P.RUN_PREFIXES) {
    for (const sky of ["APBFT", "sol"]) {
      for (const who of ["Aurelia Vex", "Nowaroll"]) {
        const k = `${p}${sky}:${who}`;
        suffixed.push(k); store.set(k, "{}");
      }
    }
  }
  /* and one near-miss that must survive: a different key that merely starts the same way */
  store.set("lgaa.missions.v1b", "{}");

  const run = P.startRun("Second Pilot");
  ok(P.RUN_KEYS.every((k) => !store.has(k)), "every run key is gone");
  ok(suffixed.every((k) => !store.has(k)), `every callsign-suffixed key is gone too (${suffixed.length} of them)`);
  ok(store.has("lgaa.missions.v1b"), "a key that only shares a prefix is left alone");
  ok(P.DEVICE_KEYS.every((k) => store.has(k)), "every device key survives");
  ok(P.LEARNED_KEYS.every((k) => store.has(k)), "every learned net survives");
  ok(store.has("lgaa.cradle.v1"), "and the ledger is not touched");
  ok(run.cleared.length === P.RUN_KEYS.length + suffixed.length, `it reports what it actually cleared (${run.cleared.length})`);
  ok(P.runCallsign() === "Second Pilot", "the run knows whose it is");
  ok(P.runId().length > 6, `and carries an id (${P.runId()})`);
}

/* ---- 3. two runs are two runs -------------------------------------------- */
{
  store.clear();
  const a = P.startRun("Aurelia Vex");
  store.set("lgaa-company", JSON.stringify({ founded: true, name: "Vex Holdings" }));
  const b = P.startRun("Second Pilot");
  ok(a.id !== b.id, "a second pilot is a different run");
  ok(b.previousCallsign === "Aurelia Vex", `the new run remembers who it replaced (${b.previousCallsign})`);
  ok(!store.has("lgaa-company"), "and Vex Holdings is not on the new pilot's books");
  /* the refresh: a fresh read of the same storage sees the new run, not the old */
  ok(P.profile().callsign === "Second Pilot", "a page refresh reads the current pilot");
  ok(P.profile().id === b.id, "…and the current run");
}

/* ---- 4. employment is released, the sky's own captains are not ------------ */
{
  store.clear();
  cradle.clear();
  /* fifty-five NPCs commanding their own hulls: employer IS their own name */
  for (let i = 0; i < 55; i++) {
    const r = generateNPC(`hull:${i}`);
    r.status = "captain"; r.employer = r.name;
    cradle.put(r);
  }
  /* twelve hands signed on with the player, and one given the con */
  const mine = [];
  for (let i = 0; i < 12; i++) {
    const r = generateNPC(`hand:${i}`);
    r.status = i === 0 ? "captain" : "aboard"; r.employer = "Aurelia Vex";
    cradle.put(r); mine.push(r.id);
  }
  /* and one dismissed, one dead — facts about the sky, not about the run */
  const gone = generateNPC("gone:1"); gone.status = "dismissed"; gone.employer = null; cradle.put(gone);
  const dead = generateNPC("dead:1"); dead.status = "dead"; dead.employer = null; cradle.put(dead);
  /* generateNPC seeds a record; the id is its own, so hold on to it */

  ok(employedCount() === 12, `only the player's twelve read as crewing (${employedCount()})`);
  ok(employedCount("Aurelia Vex") === 12, "and they are all hers");

  const n = releaseEmployed(null, "Paid off when their pilot retired");
  ok(n === 12, `a new run releases exactly those twelve (${n})`);
  ok(employedCount() === 0, "nobody is left crewing a ship that does not exist");
  ok(cradle.all().filter((r) => r.status === "captain").length === 55, "the sky's own captains keep their hulls");
  ok(mine.every((id) => cradle.get(id).status === "pool"), "the released hands are back in the pool");
  ok(mine.every((id) => cradle.get(id).employer === null), "…with no old callsign on them");
  ok(cradle.get(mine[1]).history.at(-1).text.includes("retired"), "and the ledger says why");
  ok(cradle.get(gone.id).status === "dismissed", "a dismissed hand stays dismissed");
  ok(cradle.get(dead.id).status === "dead", "and the dead stay dead");
  ok(cradle.pool().length >= 12 + 1, `the hiring halls fill again (${cradle.pool().length} in the pool)`);
}

/* ---- 5. employment never arrives from somewhere else ---------------------- */
{
  store.clear();
  cradle.clear();
  /* what a shared cradle.json used to hand every client: other people's crew */
  const theirs = [];
  for (let i = 0; i < 8; i++) {
    const r = generateNPC(`remote:${i}`);
    r.status = "aboard"; r.employer = "Somebody Else";
    theirs.push(r);
  }
  const ownCaptain = generateNPC("remote:cap");
  ownCaptain.status = "captain"; ownCaptain.employer = ownCaptain.name;
  importLedger({ cradle: 2, records: [...theirs, ownCaptain] });
  ok(cradle.size === 9, `the people are adopted (${cradle.size})`);
  ok(employedCount() === 0, "the jobs are not");
  ok(theirs.every((r) => cradle.get(r.id).employer === null), "no other pilot's callsign comes with them");
  ok(cradle.get(ownCaptain.id).status === "captain", "but an NPC's own command travels intact");

  /* and our own crew are not demoted by a record arriving about them */
  const ours = generateNPC("ours:1");
  ours.status = "aboard"; ours.employer = "Aurelia Vex";
  cradle.put(ours);
  importLedger({ cradle: 2, records: [{ ...ours, history: [...(ours.history ?? []), { at: 1, text: "seen elsewhere" }], status: "aboard", employer: "Somebody Else" }] });
  ok(cradle.get(ours.id).employer === "Aurelia Vex", "a hand of ours stays ours when the relay disagrees");
}

/* ---- 6. every localStorage key in the tree is classified ------------------ */
{
  const roots = ["js"];
  const files = [];
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const f = join(d, n);
      if (statSync(f).isDirectory()) walk(f);
      else if (n.endsWith(".js")) files.push(f);
    }
  };
  for (const r of roots) walk(r);

  /* Two `lgaa-`/`lg-` strings in the tree are not storage at all, and saying so
   * here is cheaper than a cleverer regex that would go wrong later. */
  const NOT_STORAGE = new Map([
    ["lg-rockbody", "js/bodygen/body.js — a three.js shader program cache key"],
    ["lgaa-net-id", "js/net.js — sessionStorage, one tab, dies with the tab"],
  ]);
  const known = new Set([...P.RUN_KEYS, ...P.DEVICE_KEYS, ...P.LEARNED_KEYS, ...P.SKY_KEYS, "lgaa.profile.v1"]);
  const found = new Map();                // key (or prefix stem) → the file that owns it
  const stems = P.RUN_PREFIXES.map((p) => p.slice(0, -1));
  for (const f of files) {
    if (f.endsWith("js/profile.js")) continue;
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/["'`]((?:lgaa|lg)[-.][A-Za-z0-9._-]+)["'`:]/g)) {
      if (!found.has(m[1])) found.set(m[1], f);
    }
    /* the suffixed families are written as `lgaa.x.v1:${…}` — catch the stem */
    for (const m of src.matchAll(/`((?:lgaa|lg)[-.][A-Za-z0-9._-]+):\$\{/g)) {
      if (!found.has(m[1])) found.set(m[1], f);
    }
  }
  const unclassified = [...found].filter(([k]) => !known.has(k) && !stems.includes(k) && !NOT_STORAGE.has(k));
  if (unclassified.length) for (const [k, f] of unclassified) console.error(`    ${k}  (${f})`);
  ok(unclassified.length === 0, `every storage key is filed in js/profile.js (${unclassified.length} unfiled)`);
  ok(found.size >= 15, `…and the sweep actually found the keys (${found.size})`);
  /* the reverse: nothing classified has been deleted out from under us */
  const orphans = [...P.RUN_KEYS, ...stems].filter((k) => !found.has(k) && k !== "lgaa-save-v0");
  ok(orphans.length === 0, `no run key names a module that no longer writes it (${orphans.join(", ")})`);
  /* and the trap that started this: a prefix family must NOT also be listed as
   * a bare key, because removeItem on the bare name is a no-op that reads as a
   * successful sweep */
  ok(stems.every((k) => !P.RUN_KEYS.includes(k)), "no suffixed family is also filed as a fixed key");
}

/* ---- 7. the server side keeps the same rule ------------------------------- */
{
  const py = readFileSync("server.py", "utf8");
  ok(/_unemploy/.test(py), "server.py strips employment before it writes the shared ledger");
  ok(/rec = self\._unemploy\(rec\)/.test(py), "…on every put");
  ok(/employer != rec\.get\("name"\)/.test(py), "…by the same rule the client uses: employed by someone not yourself");
  ok(/released \{freed\} stale crew record/.test(py), "and an existing cradle.json is cleaned on load, not abandoned");
  ok(!/run-%Y%m%d\.log/.test(py.split("It used to be")[1] ?? ""), "the day-rotated log name is gone from the live code");
  ok(/self\.run_id/.test(py) && /LOG\.begin\(/.test(py), "logs are opened per run");
  ok(/LOG_KEEP/.test(py), "…with a retention cap, so a file per run is not a leak");
}

/* ---- 8. creation wires it up --------------------------------------------- */
{
  const src = readFileSync("js/creation.js", "utf8");
  ok(/releaseEmployed\(null,/.test(src), "creation releases the last pilot's crew");
  ok(/resetCompany\(\)/.test(src), "…clears the corporation in memory");
  ok(/startRun\(callsign\)/.test(src), "…and starts a new run before the pilot is built");
  const order = ["releaseEmployed(", "resetCompany()", "startRun(callsign)", "makePilot("].map((s) => src.indexOf(s));
  ok(order.every((n, i) => n > 0 && (i === 0 || n > order[i - 1])), "in that order — a sweep after makePilot would eat the new pilot");
}

console.log(`profile: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
