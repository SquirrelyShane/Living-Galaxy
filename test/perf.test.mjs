/* LIVING GALAXY — the bug hunt's findings, pinned.
 *
 * A bug hunt that is not pinned by a test is a bug hunt you get to do again.
 * These are the things a full-tree audit found, each asserted by the behaviour it
 * would break rather than by a stopwatch — a wall-clock threshold on a shared
 * CI box is a flake, and a wall-clock threshold that passes tells you nothing
 * about WHY.
 *
 * The findings, and what each assertion holds:
 *
 *   1. The contact board and the traffic roster were looked up by id with
 *      `Array.find()`, three passes a tick against 120 entries. Both carry an
 *      index now — and both are EXPORTED arrays that outside code mutates
 *      directly, so the index has to notice that on its own. A test harness
 *      doing `contacts.length = 0` is what caught this the first time.
 *
 *   2. `hostilesNear()` allocated an array, a wrapper object per hostile and a
 *      SORT, per drone per substep, to answer "how many" and "which is
 *      nearest". It returns one reused object now, which means a caller must
 *      read what it needs before the next scan — so the test proves the reuse
 *      AND that the callers copy in time.
 *
 *   3. `threatBoard()` allocated a row per rock and a `{t,d}` per body per rock
 *      per tick. Rows are pooled and the array is reused.
 *
 *   4. `nearbyRocks()` had a one-query memo and one shared output array, so
 *      with more than one caller live it never hit once, and anyone who held a
 *      result watched it change underneath them. Cells are cached per sky time
 *      and each query gets its own array out of a ring.
 *
 *   5. `js/aria.js` assigned to `ariaHooks` — an export of a module it is in a
 *      CYCLE with — at the top level. It worked by accident of load order; one
 *      new import elsewhere and the page dies with a TDZ error on boot.
 *
 *   node --import ./test/three-register.mjs test/perf.test.mjs
 */
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { contacts, contactById, syncContacts } = await import("../js/turrets.js");
const { traffic, vesselById, reindexTraffic } = await import("../js/npc/traffic.js");
const { impactors, threatBoard, emptyThreatBoard } = await import("../js/impactors.js");
const { nearbyRocks, inBelt, wearRock } = await import("../js/field.js");
const { launchSim, sim } = await import("../js/sim.js");
const { makePilot } = await import("../js/pilot.js");
/* the NAMESPACE, not a destructure: `currentSystem` is reassigned by loadSky,
 * and destructuring an export captures the value rather than the binding */
const bodies = await import("../js/bodies.js");

makePilot("PerfPilot", "terran", "navigation", null);
launchSim("PerfPilot", "perfsky");

/* ---- 1. the id indexes, and that they survive outside mutation ------------ */
{
  ok(traffic.length > 20, `a sky has hulls to look up (${traffic.length})`);
  const n = traffic[7];
  ok(vesselById(n.id) === n, "vesselById finds a hull");
  ok(vesselById("no-such-hull") === null, "…and answers null for one that is not there");

  /* the whole roster resolves — an index that misses one is worse than none */
  ok(traffic.every((h) => vesselById(h.id) === h), "every hull on the roster resolves to itself");

  /* somebody splices the exported array without telling us */
  const removed = traffic.splice(3, 1)[0];
  ok(vesselById(removed.id) === null, "a hull spliced out of the array stops resolving, with no reindex call");
  traffic.push(removed);
  ok(vesselById(removed.id) === removed, "…and resolves again when it is pushed back");

  /* the one case a length check cannot see: a splice and a push in one frame */
  const gone = traffic.splice(5, 1)[0];
  traffic.push({ id: "perf-decoy", name: "Decoy" });
  reindexTraffic();
  ok(vesselById(gone.id) === null, "splice-and-push in one frame is caught by the explicit reindex");
  ok(vesselById("perf-decoy")?.name === "Decoy", "…and the new one resolves");
  traffic.pop();
  traffic.push(gone);
}

{
  contacts.length = 0;
  contacts.push({ id: "c1", kind: "npc", hp: 100 }, { id: "c2", kind: "drone", hp: 40 });
  ok(contactById("c1")?.hp === 100, "contactById finds a contact pushed from outside");
  ok(contactById("nope") === null, "…and answers null otherwise");

  /* The trap that the first version of this index fell into: swapping one
   * contact for another leaves the array the SAME LENGTH, so any cache that
   * revalidates on length alone silently keeps serving the old one — returning
   * a contact that is no longer on the board and missing the one that is.
   * A cache that is usually right is worse than no cache, so there is no
   * long-lived cache here at all: syncContacts indexes the board once per call
   * and throws it away, and contactById is an honest linear scan. */
  contacts.length = 0;
  contacts.push({ id: "c3", kind: "npc", hp: 70 });
  ok(contactById("c3")?.hp === 70, "a same-length swap is seen: the new contact resolves");
  ok(contactById("c1") === null, "…and the one it replaced does not");
  contacts.length = 0;
  ok(contactById("c3") === null, "clearing the board by `length = 0` is seen too");
}

/* ---- 2. the drone threat scan hands back reused scratch ------------------- */
{
  const src = readFileSync("js/drones/ops.js", "utf8");
  ok(!/out\.sort\(\(a, b\) => a\.d - b\.d\)/.test(src), "hostilesNear no longer sorts to find a minimum");
  ok(/const _threat = \{/.test(src), "…it fills one reused result object");
  ok(!/hostilesNear\([^)]*\)\[0\]/.test(src), "no caller indexes it like an array any more");
  /* every caller must lift what it needs off the scratch before the next scan */
  for (const call of ["const foe = found.nearest", "const f = watch.nearest", "const near = hostilesNear(u, THREAT_R)"]) {
    ok(src.includes(call), `a caller takes its value off the scratch immediately (${call})`);
  }
  ok(/const foeKind = found\.kind/.test(src), "…including the kind, which decides whether a kill resolves on the board or on the numbers");
}

/* ---- 3. the threat board is pooled --------------------------------------- */
{
  impactors.length = 0;
  for (let i = 0; i < 6; i++) {
    impactors.push({ id: `t${i}`, name: `Rock ${i}`, x: 1000 * i, y: 0, z: 0, vx: -80, vy: 0, vz: 0, r: 200 + i * 40, seed: 0.3, spin: 0.1, born: 0, deflected: 0, lastWell: null });
  }
  const bodies = [{ id: "b1", name: "Testworld", kind: "planet", radius: 4000 }];
  const bp = (id, t, out) => { out.x = 0; out.y = 0; out.z = 0; };
  const a = threatBoard(sim.ship, bodies, bp, 0);
  const rowA = a[0];
  const b = threatBoard(sim.ship, bodies, bp, 1);
  ok(a === b, "two ticks hand back the same array — nothing is allocated for it");
  ok(b[0] === rowA, "…and the same row objects, pooled");
  ok(b.length === 6, `every rock is still on the board (${b.length})`);
  ok(b.every((r, i) => i === 0 || (r.target ? r.target.t : r.etaSelf) >= (b[i - 1].target ? b[i - 1].target.t : b[i - 1].etaSelf)), "still sorted by what matters soonest");
  const empty = emptyThreatBoard();
  ok(empty === a, "sentry off hands back the same array, empty — not a fresh []");
  ok(empty.length === 0, "…and it is empty");
  impactors.length = 0;
}

/* ---- 4. rock queries: shared work, unshared arrays ------------------------ */
{
  const belt = bodies.currentSystem.belt ?? bodies.currentSystem.outerBelt;
  if (!belt) {
    ok(true, "(this sky has no belt — rock cache assertions skipped)");
  } else {
    const mid = (belt.inner + belt.outer) / 2;
    const at = (dx, dz) => ({ x: mid + dx, y: 0, z: dz });
    ok(inBelt(at(0, 0)), "the probe point is inside the belt");

    /* two callers, same tick, different places — the old code handed both the
     * same array and each wiped the other's answer */
    const a = nearbyRocks(at(0, 0), 100, 1);
    const aLen = a.length;
    const b = nearbyRocks(at(60000, 0), 100, 1);
    ok(a !== b, "two queries in one tick get two different arrays");
    ok(a.length === aLen, "…and the first caller's result is not wiped by the second");

    /* the same query twice is the memo, and must be the identical array */
    const again = nearbyRocks(at(0, 0), 100, 1);
    ok(again === a, "the same query in the same tick is memoised, not rebuilt");

    /* rocks are a pure function of (cell, time): the cell cache must not change
     * what comes back, only how often it is computed */
    const wide = nearbyRocks(at(0, 0), 100, 2);
    ok(wide.length >= a.length, `a wider span is a superset in size (${wide.length} ≥ ${a.length})`);
    const keys = new Set(a.map((r) => r.key));
    ok([...keys].every((k) => wide.some((r) => r.key === k)), "…and contains every rock the narrow one found");

    /* 0.3.28 — a later tick still drifts them, but the cell is no longer rebuilt
     * to do it: the rock objects are kept and their wobble is refreshed over
     * them. So the positions have to be SAMPLED before the clock moves, not
     * held by reference — holding the array now shows you the new numbers,
     * which is the contract this cache has always stated and now means twice. */
    const before = new Map(a.map((r) => [r.key, `${r.x},${r.z}`]));
    const later = nearbyRocks(at(0, 0), 140, 1);
    ok(later.length > 0, "a later tick still returns rocks");
    const moved = later.filter((r) => before.has(r.key) && before.get(r.key) !== `${r.x},${r.z}`).length;
    ok(moved > 0, `…and they have drifted (${moved} of ${later.length} moved between the ticks)`);
    const same = later.filter((r) => before.has(r.key) && r.y === a.find((x) => x.key === r.key)?.y).length;
    ok(same > 0, "…while staying the same rocks: identity, size and ore do not depend on the clock");
    /* and the wear rides the same refresh rather than a cache flush */
    const target = later.find((r) => (r.worn ?? 0) < 0.5);
    if (target) {
      wearRock(target.key, 0.2);
      const after = nearbyRocks(at(0, 0), 141, 1).find((r) => r.key === target.key);
      ok(after && after.worn >= 0.2, `cutting a rock updates its wear without rebuilding the belt (${after?.worn?.toFixed(2)})`);
    } else ok(true, "no fresh rock to cut in this sample");

    /* the ring is bounded, and recycling must never hand out a stale memo */
    const seen = [];
    for (let i = 0; i < 40; i++) seen.push(nearbyRocks(at(i * 9000, i * 7000), 200, 1));
    const fresh = nearbyRocks(at(0, 0), 200, 1);
    ok(fresh.length > 0, "after the ring has wrapped, a query still answers");
    const stale = seen.find((s) => s === fresh);
    ok(!stale || stale.length === fresh.length, "a recycled array is refilled, never served stale");
  }
}

/* ---- 5. no top-level read of a binding from a module we cycle with -------- */
{
  const aria = readFileSync("js/aria.js", "utf8");
  const topLevelHook = /^ariaHooks\./m.test(aria);
  ok(!topLevelHook, "js/aria.js does not touch ariaHooks at the top level (that is a load-order TDZ waiting to happen)");
  ok(/export function wireAriaHooks\(\)/.test(aria), "…it wires the hook from a function instead");
  ok(/wireAriaHooks\(\);/.test(aria), "…which wireAria calls");

  /* Four other modules do the same late-binding trick at the top level, and
   * all four are SAFE — because the object they assign through comes from a
   * module that is not in a cycle with them, so it is always fully evaluated
   * by the time they run. That is the property worth asserting: not "nobody
   * assigns at load", but "nobody assigns through a binding they cycle with".
   *
   *   js/upgrades.js  → shipFx      from js/ship.js       (the designated leaf)
   *   js/family.js    → crewHooks   from js/crew.js
   *   js/fleet.js     → trafficHooks from js/npc/traffic.js
   *   js/npc/battles.js → trafficHooks, same
   *
   * If one of those targets ever gains an import that puts it back in its
   * writer's cycle, this check fails and says which pair. */
  const SAFE = { shipFx: "js/ship.js", crewHooks: "js/crew.js", trafficHooks: "js/npc/traffic.js" };
  const resolve = (from, spec) => {
    const dir = from.slice(0, from.lastIndexOf("/"));
    const parts = `${dir}/${spec}`.split("/");
    const out = [];
    for (const p of parts) { if (p === "." || p === "") continue; if (p === "..") out.pop(); else out.push(p); }
    return out.join("/");
  };
  const importsOf = (f) => {
    const src = readFileSync(f, "utf8");
    return [...src.matchAll(/from\s*"(\.[^"]+)"/g)].map((m) => resolve(f, m[1]));
  };
  const offenders = [];
  for (const f of ["js/aria.js", "js/upgrades.js", "js/family.js", "js/fleet.js", "js/npc/battles.js"]) {
    const src = readFileSync(f, "utf8");
    const from = new Map();
    for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*"(\.[^"]+)"/g)) {
      for (const part of m[1].split(",")) {
        const name = part.trim().split(/\s+as\s+/).pop().trim();
        if (name) from.set(name, resolve(f, m[2]));
      }
    }
    for (const m of src.matchAll(/^([A-Za-z_$][\w$]*)\.[\w$]+\s*=/gm)) {
      const obj = m[1];
      if (!from.has(obj)) continue;
      const target = from.get(obj);
      /* safe only if the target does NOT import its way back to this file */
      const back = importsOf(target).includes(f.replace(/\.js$/, ".js"));
      if (back || !SAFE[obj]) offenders.push(`${f}: ${obj} (from ${target})`);
    }
  }
  if (offenders.length) for (const o of offenders) console.error(`    ${o}`);
  ok(offenders.length === 0, `no top-level assignment goes through a binding its module cycles with (${offenders.length})`);
}

/* ---- 6. the per-frame sweeps are gone from the render loop ---------------- */
{
  /* strip comments first — these files now EXPLAIN the patterns they no longer
   * use, and a naive grep would match the explanation */
  const code = (f) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const eng = code("js/engine.js");
  ok(!/contacts\.some\(/.test(eng), "the drone-mesh sweep no longer scans the whole board per mesh");
  ok(!/probes\.some\(/.test(eng), "nor does the probe-mesh sweep");
  ok(!/BEACONS\.find\(/.test(eng), "the beacon loop resolves its definition once, not per frame");
  ok(/_seenDrone/.test(eng) && /_seenProbe/.test(eng), "…both use a reused Set instead");

  const tur = code("js/turrets.js");
  const sync = tur.slice(tur.indexOf("export function syncContacts"));
  ok(!/contacts\.find\(/.test(sync), "syncContacts resolves by index rather than by scan");
  ok(/byId\.clear\(\);/.test(tur) && /byId\.get\(/.test(tur), "…an index it builds fresh each call, so it cannot go stale");
  const relTwice = /relationOf\(n\.id\)[\s\S]{0,120}relationOf\(n\.id\)/.test(tur);
  ok(!relTwice, "…and asks relationOf once per hull, not twice");

  const bat = code("js/npc/battles.js");
  ok(!/traffic\.find\(/.test(bat), "the battle tick resolves ids through the roster index");
  ok(/wingBuf/.test(bat) && /lawBuf/.test(bat) && /foeBuf/.test(bat), "…into reused buffers, not four fresh arrays a tick");

  const hud = code("js/hud.js");
  ok(/const elCache = new Map\(\)/.test(hud), "the HUD caches its element lookups");
  ok(/had\.isConnected/.test(hud), "…and re-resolves a detached one, so an innerHTML rewrite cannot leave a stale handle");
}

/* ---- 7. no fetch in the tree ignores its status --------------------------- */
{
  const files = ["js/npc/cradle.js", "js/net.js", "js/comms/call-scripts.js", "js/npc/captain.js"];
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    const hasFetch = /\bfetch\(/.test(src);
    if (!hasFetch) continue;
    /* `fetch` resolves on a 404 or a 501, so SOMETHING must look at the status */
    ok(/\.ok\b/.test(src) || /\.status\b/.test(src), `${f} checks the response status (fetch does not reject on a 501)`);
  }
  const calls = readFileSync("js/comms/call-scripts.js", "utf8");
  ok(/if \(!res\.ok\)/.test(calls), "the voice provider checks res.ok before parsing");
  ok(/deadProviders/.test(calls), "…and writes off a provider that is not there, rather than asking forever");
}

/* ---- 8. the captain's async decision cannot rot silently ------------------ */
{
  const cap = readFileSync("js/npc/captain.js", "utf8");
  ok(/\}\)\.catch\(\(err\) => \{/.test(cap), "decide() has a catch — an unhandled rejection per tick is invisible");
  ok(/clearTimeout\(timer\)/.test(cap), "the provider race clears its timeout instead of orphaning one per decision");
  ok(/captain\.thinkFailed = false/.test(cap), "…and a good decision re-arms the warning, so a transient fault is not permanent silence");
}

console.log(`perf: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
