/* LIVING GALAXY 0.3.91 — Dead Hulls: hulks on the wire.
 *
 *   node --import ./test/three-register.mjs test/hulkwire.test.mjs
 *
 * A hulk was made where a kill was simulated and seen by whoever simulated it.
 * In a held sky the kills are the host's, so a pilot who joined Sol found two
 * hulks in ten minutes, or none, and ARIA at the conn of a salvor went mining.
 * The host now sends its hulks and a mirror keeps the same ones. Pinned here:
 *
 *   1. a row carries the whole hulk: a mirror that adopts it has the same
 *      vessel in the same place with the same plate, parts, hold and recorder;
 *      a contract wreck is the signing pilot's and is not sent;
 *   2. adopting twice changes nothing; the mirror's own ids stay put;
 *   3. cutting only takes away: a section the wire says is cut is cut here, a
 *      section cut here stays cut whatever a stale packet says;
 *   4. a shared hulk the host no longer names is gone — unless somebody here
 *      is flying to it or has a rig on it;
 *   5. a hulk cut up here is not brought back by the packet that was already
 *      on its way;
 *   6. the host's side: a reported section is cut for everyone, and a hulk
 *      with nothing left goes;
 *   7. a mirror that saw the same hull die keeps one hulk, not two;
 *   8. the cap does not throw away a hulk that belongs to the host;
 *   9. a host takes its own hulks back out of a checkpoint as its own;
 *  10. wired: a pilot's reported kill leaves a hulk on the host, a finished
 *      section of a shared hulk is reported, and the hulk packet has its own
 *      cadence in world sync and in the Sol host.
 */
import fs from "node:fs";

const store = new Map();
globalThis.localStorage ??= { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { HULK, hulks, spawnHulk, resetHulks, bindHulks, removeHulk, hulkManifest, hulkKey, hulkWire, adoptHulkWire, applyHulkCut, stepHulks } = await import("../js/world/hulks.js");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const FAR = { x: 5e7, y: 1200, z: 5e7 };
const dead = (id, ship, over = {}) => ({ id, name: `Test ${id}`, ship, role: "hauler", ...FAR, ...over });
const wireCopy = () => JSON.parse(JSON.stringify(hulkWire()));
const cutSection = (s) => { s.plate = 0; s.cut = 1; s.parts = {}; s.cargo = null; s.box = false; };

const clock = { time: 1000 };
resetHulks();
bindHulks(clock);

/* ---- 1. a row is the whole hulk ---------------------------------------------- */
let rows;
{
  const a = spawnHulk(dead("v:a", "general_c", { cargo: { id: "water", qty: 80 } }), { source: "combat", owner: "co1", at: 1000 });
  const b = spawnHulk(dead("v:b", "mining_b", { x: FAR.x + 9000 }), { source: "battle", at: 1000 });
  const w = spawnHulk(dead("wreck:9", "general_b", { x: FAR.x - 9000 }), { source: "contract", pinned: true, intact: 1, at: 1000 });
  rows = wireCopy();
  ok(rows.length === 2 && !rows.some((r) => r[1] === "wreck:9"), `the wire carries the sky's hulks and not a contract wreck (${rows.length} of ${hulks.length})`);
  ok(rows[0][0] === hulkKey(a) && /^v:a@\d+$/.test(rows[0][0]), `the key is the dead vessel and when it died (${rows[0][0]})`);
  const before = { a: hulkManifest(a), b: hulkManifest(b), ax: a.x, az: a.z, ar: a.r, ayaw: a.yaw, n: a.sections.length };
  resetHulks();
  clock.time = 1012;
  const r = adoptHulkWire(rows, { time: clock.time });
  ok(r.added === 2 && hulks.length === 2, `a mirror with no hulks takes both (${r.added})`);
  const ma = hulks.find((h) => h.vessel === "v:a"), mb = hulks.find((h) => h.vessel === "v:b");
  const A = hulkManifest(ma), B = hulkManifest(mb);
  ok(ma.shared === true && ma.key === rows[0][0] && ma.owner === "co1" && ma.source === "combat", "it is marked as the host's, with its key, owner and source");
  ok(ma.sections.length === before.n && Math.abs(A.plate - before.a.plate) < 0.02 && A.partCount === before.a.partCount && A.cargoCount === before.a.cargoCount && A.box === before.a.box && A.value === before.a.value,
    `the same plate, parts, hold and recorder (${A.plate} plate, ${A.partCount} parts, ${A.cargoCount} water, ${A.value} cr)`);
  ok(JSON.stringify(A.parts) === JSON.stringify(before.a.parts) && JSON.stringify(B.parts) === JSON.stringify(before.b.parts), "part for part");
  ok(Math.abs(ma.x - before.ax) < 1 && Math.abs(ma.z - before.az) < 1 && ma.r === before.ar && Math.abs(ma.yaw - before.ayaw) < 0.01, "in the same place, the same size, lying the same way");
  ok(ma.name === "Test v:a hulk" && ma.hullName && ma.tier && ma.len > 0, `named, classed and sized (${ma.name}, ${ma.hullName} ${ma.tier}, ${ma.len} u long)`);
  ok(Math.abs(ma.age - 12) < 0.01 && ma.life === HULK.life, `as old as it is on the host (${ma.age}s)`);
  void w;
}

/* ---- 2. adopting twice changes nothing ---------------------------------------- */
{
  const ids = hulks.map((h) => h.id).join();
  const r = adoptHulkWire(rows, { time: clock.time });
  ok(r.added === 0 && r.kept === 2 && hulks.length === 2 && hulks.map((h) => h.id).join() === ids, "the same packet again adds nothing and keeps the mirror's own ids");
}

/* ---- 3. cutting only takes away ----------------------------------------------- */
{
  const h = hulks.find((x) => x.vessel === "v:a");
  const last = h.sections.length - 1;
  cutSection(h.sections[last]);
  h.sections[0].plate = h.sections[0].plate0 / 2; h.sections[0].cut = 0.5;
  adoptHulkWire(rows, { time: clock.time });
  ok(h.sections[last].cut === 1 && h.sections[last].plate === 0, "a section cut here stays cut though the packet still shows it whole");
  ok(h.sections[0].cut === 0.5 && h.sections[0].plate === h.sections[0].plate0 / 2, "and a half-cut section keeps the pilot's progress");
  const cutOnHost = JSON.parse(JSON.stringify(rows));
  cutOnHost[0][18][1][2] = 1;
  adoptHulkWire(cutOnHost, { time: clock.time });
  ok(h.sections[1].cut === 1 && h.sections[1].plate === 0 && Object.keys(h.sections[1].parts).length === 0 && !h.sections[1].cargo, "a section the host says somebody else cut is cut here, parts and hold with it");
}

/* ---- 4. gone from the host is gone here, unless it is being worked ------------- */
{
  const onlyA = rows.filter((r) => r[1] === "v:a");
  const b = hulks.find((x) => x.vessel === "v:b");
  b.busyUntil = clock.time + 30;
  let r = adoptHulkWire(onlyA, { time: clock.time });
  ok(r.removed === 0 && hulks.includes(b), "a hulk the host has retired stays while somebody is flying to it");
  b.busyUntil = clock.time - 1;
  r = adoptHulkWire(onlyA, { time: clock.time });
  ok(r.removed === 1 && !hulks.includes(b) && b.dead, "and goes when they are not");
  const mine = spawnHulk(dead("v:mine", "general_a", { x: FAR.x + 20000 }), { source: "kill", at: clock.time });
  adoptHulkWire(onlyA, { time: clock.time });
  ok(hulks.includes(mine) && !mine.shared, "a hulk this pilot made is not the host's to retire");
  removeHulk(mine);
}

/* ---- 5. cut up here, it does not come back -------------------------------------- */
{
  const h = hulks.find((x) => x.vessel === "v:a");
  removeHulk(h);
  adoptHulkWire(rows.filter((r) => r[1] === "v:a"), { time: clock.time });
  ok(!hulks.some((x) => x.vessel === "v:a"), "the packet already on its way does not bring back a hulk that was just cut up");
  clock.time += HULK.goneFor + 1;
  adoptHulkWire(rows.filter((r) => r[1] === "v:a"), { time: clock.time });
  ok(hulks.some((x) => x.vessel === "v:a"), `only a host that still names it ${HULK.goneFor}s later does`);
  const spentRow = JSON.parse(JSON.stringify(rows.filter((r) => r[1] === "v:b")));
  for (const s of spentRow[0][18]) s[2] = 1;
  const n = hulks.length;
  adoptHulkWire([...rows.filter((r) => r[1] === "v:a"), ...spentRow], { time: clock.time });
  ok(hulks.length === n && !hulks.some((x) => x.vessel === "v:b"), "a hulk with every section cut is not built at all");
}

/* ---- 6. the host's side ----------------------------------------------------------- */
{
  resetHulks();
  clock.time = 2000;
  const h = spawnHulk(dead("v:h", "general_b"), { source: "combat", at: 2000 });
  const key = hulkKey(h);
  ok(applyHulkCut(key, 0) && h.sections[0].cut === 1 && h.sections[0].plate === 0 && h.sections[0].box === false, "a reported section is cut on the host, recorder and all");
  ok(!applyHulkCut("nobody@1", 0) && !applyHulkCut(key, 99), "a report for a hulk or a section that is not there does nothing");
  ok(hulkWire()[0][18][0][2] === 1, "and the next packet says so");
  for (let i = 1; i < h.sections.length; i++) applyHulkCut(key, i);
  ok(!hulks.includes(h) && h.dead, "the last section takes the hulk with it");
}

/* ---- 7. one hull, one hulk -------------------------------------------------------- */
{
  resetHulks();
  clock.time = 3000;
  const hostSide = spawnHulk(dead("v:same", "general_c"), { source: "combat", at: 3000 });
  const row = wireCopy();
  const hostPlate = hulkManifest(hostSide).plate;
  resetHulks();
  clock.time = 3004;
  const local = spawnHulk(dead("v:same", "general_c", { x: FAR.x + 300 }), { source: "combat", at: 3004 });
  const id = local.id;
  const r = adoptHulkWire(row, { time: clock.time });
  ok(r.added === 0 && hulks.length === 1 && hulks[0].id === id, "a mirror that saw the same hull die keeps its one hulk");
  ok(local.shared && local.key === row[0][0] && Math.abs(hulkManifest(local).plate - hostPlate) < 0.02 && Math.abs(local.x - FAR.x) < 1, "and it becomes the host's: its metal, its place");
  resetHulks();
  const worked = spawnHulk(dead("v:same", "general_c"), { source: "combat", at: 3004 });
  worked.sections[worked.sections.length - 1].cut = 0.4;
  const mineBefore = worked.sections.map((s) => s.plate0).join();
  adoptHulkWire(row, { time: clock.time });
  ok(worked.shared && worked.sections.map((s) => s.plate0).join() === mineBefore, "unless the pilot already has a rig on it, in which case the metal under the beam is not swapped");
}

/* ---- 8. the cap leaves the host's hulks alone -------------------------------------- */
{
  resetHulks();
  clock.time = 4000;
  for (let i = 0; i < HULK.max; i++) spawnHulk(dead(`v:c${i}`, "general_a", { x: FAR.x + i * 500 }), { source: "combat", at: 4000 });
  const full = wireCopy();
  resetHulks();
  adoptHulkWire(full, { time: clock.time });
  ok(hulks.length === HULK.max && hulks.every((h) => h.shared), `a mirror holds the host's ${HULK.max}`);
  const own = spawnHulk(dead("v:own", "general_a", { x: FAR.x - 5000 }), { source: "kill", at: 4000 });
  ok(hulks.includes(own) && hulks.filter((h) => h.shared).length === HULK.max, "and a kill of its own does not push one of them out");
  const own2 = spawnHulk(dead("v:own2", "general_a", { x: FAR.x - 9000 }), { source: "kill", at: 4000 });
  ok(hulks.includes(own2) && !hulks.includes(own) && hulks.filter((h) => h.shared).length === HULK.max, "the next one pushes out the mirror's own oldest");
}

/* ---- 9. out of a checkpoint, the host's hulks are its own ---------------------------- */
{
  resetHulks();
  clock.time = 5000;
  spawnHulk(dead("v:k1", "general_b"), { source: "combat", at: 5000 });
  spawnHulk(dead("v:k2", "general_c", { x: FAR.x + 4000 }), { source: "battle", at: 5000 });
  const saved = wireCopy();
  resetHulks();
  clock.time = 5300;
  const stay = spawnHulk(dead("v:new", "general_a", { x: FAR.x - 4000 }), { source: "combat", at: 5300 });
  const r = adoptHulkWire(saved, { time: clock.time, mirror: false });
  ok(r.added === 2 && hulks.length === 3 && hulks.includes(stay), "a restart takes its hulks back and loses none it has made since");
  ok(hulks.every((h) => !h.shared), "none of them marked as somebody else's");
  ok(hulkWire().length === 3, "and they all go back out on the wire");
  const aged = hulks.find((h) => h.vessel === "v:k1");
  ok(Math.abs(aged.age - 300) < 0.01, "the time it was down is on their clock");
  stepHulks(1);
  ok(hulks.length === 3, "and they step like any other");
  ok(adoptHulkWire("junk").added === 0 && adoptHulkWire([["k", 1], null, [1, 2, 3]]).added === 0, "a packet that is not hulks adopts nothing");
}

/* ---- 10. wired ------------------------------------------------------------------------- */
{
  const { sim, launchSim, tickSim } = await import("../js/sim/sim.js");
  const { makePilot } = await import("../js/flight/pilot.js");
  const { traffic } = await import("../js/npc/traffic.js");
  const { hostVesselDown, HULK_EVERY, worldsync } = await import("../js/net/worldsync.js");
  const { rigHooks } = await import("../js/flight/rig.js");
  makePilot("Wire", "terran", "salvage", null);
  launchSim("HulkWire", "sol");
  sim.phase = "play";
  for (let i = 0; i < 30; i++) tickSim(1 / 30);
  resetHulks();
  const n = traffic.find((x) => x.job !== "down" && Number.isFinite(x.x));
  hostVesselDown(n.id);
  ok(hulks.length === 1 && hulks[0].vessel === n.id, `a kill a pilot reports leaves its hulk on the host (${hulks[0]?.name})`);
  hostVesselDown("npc:no-such-hull");
  ok(hulks.length === 1, "a report about a hull the host does not know leaves nothing");

  const sent = [];
  const send0 = sim.send;
  sim.send = (d) => sent.push(d);
  const h = hulks[0];
  rigHooks.onSection(h, h.sections[0], { strip: true, plate: 3, parts: 0, lost: 0, cargo: null, recorder: null });
  ok(!sent.some((d) => d.t === "hcut"), "a section off a hulk that is only this pilot's is nobody else's news");
  h.shared = true;
  rigHooks.onSection(h, h.sections[1] ?? h.sections[0], { strip: true, plate: 3, parts: 0, lost: 0, cargo: null, recorder: null });
  const cut = sent.find((d) => d.t === "hcut");
  ok(cut && cut.k === hulkKey(h) && Number.isInteger(cut.i), `a section off a shared hulk is reported (${JSON.stringify(cut)})`);
  sim.send = send0;

  ok(HULK_EVERY >= 4000 && "hulksIn" in worldsync.stats && "hulksOut" in worldsync.stats, `hulks ride their own packet every ${HULK_EVERY / 1000}s`);
  const ws = fs.readFileSync(new URL("../js/net/worldsync.js", import.meta.url), "utf8");
  ok(/d\.t === "hstate"[\s\S]{0,80}if \(worldsync\.host\) return;[\s\S]{0,80}adoptHulkWire\(d\.hulks/.test(ws), "a mirror adopts the host's hulk packet and a host ignores one");
  ok(/d\.t === "hcut"[\s\S]{0,80}if \(!worldsync\.host\) return;[\s\S]{0,120}applyHulkCut\(/.test(ws), "a host applies a cut report and a mirror ignores one");
  ok(/if \(worldsync\.host\) hostVesselDown\(d\.id\);\s*markVesselDown/.test(ws), "a host leaves the hulk before it marks the vessel down");
  const host = fs.readFileSync(new URL("../host/sol-host.mjs", import.meta.url), "utf8");
  ok(/t:'hstate'[^\n]*hulks:hulkWire\(\)/.test(host) && /hostVesselDown\(d\.id\);markVesselDown/.test(host) && /applyHulkCut\(d\.k/.test(host), "the Sol host sends its hulks, leaves one on a reported kill and applies cut reports");
  ok(/hulks:hulkWire\(\)/.test(host.match(/function checkpoint\(\)[^\n]*/)?.[0] ?? "") && /adoptHulkWire\(saved\.hostState\.hulks,\{time:sim\.time,mirror:false\}\)/.test(host), "and keeps them across a restart in its checkpoint");
  ok(/version=\$\{VERSION\}/.test(host) && /version:VERSION/.test(host), "it says which build it is running, in the journal and the status file");
}

console.log(`hulkwire: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
