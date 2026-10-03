/* LIVING GALAXY 0.3.86 — Dead Hulls: the hulk.
 *
 *   node --import ./test/three-register.mjs test/hulks.test.mjs
 *
 * A destroyed hull leaves something behind: a hulk, in sections, each holding
 * plate and parts, one holding the flight recorder, the hold holding whatever
 * cargo survived. This suite guards the entity (pure, no sim) and then the
 * wiring: every way a hull dies leaves one, it can be locked, anchored,
 * assayed and matched, and a new sky starts with none.
 *
 * Nothing cuts a hulk yet — that is the rig, the next slice.
 */
import fs from "node:fs";
import { sim, launchSim, tickSim, lockCandidates, acquireLock, clearLock, targetPosition, targetVelocity, leaveHulk, requestScan, loadSky, publishHud } from "../js/sim/sim.js";
import { makePilot } from "../js/flight/pilot.js";
import { forwardOf } from "../js/flight/ship.js";
import { HULK, HULK_PARTS, HULK_SECTIONS, hulks, spawnHulk, stepHulks, resetHulks, bindHulks, hulkById, nearHulks, removeHulk, hulkManifest, hulkVelocity, sectionCount } from "../js/world/hulks.js";
import { good, baseValue } from "../js/economy/materials.js";
import { SHIP_DB, shipById } from "../js/ships/shipdb.js";
import { BODIES, bodyPosition, bodyVelocity, currentSystem } from "../js/world/bodies.js";
import { resolveAnchor } from "../js/world/anchors.js";
import { traffic, vesselById } from "../js/npc/traffic.js";
import { contacts, fireRound } from "../js/flight/turrets.js";
import { damageHull } from "../js/npc/combat.js";
import { engagementAt, stepBattles, ENG_SLOT } from "../js/npc/battles.js";
import { stations } from "../js/station/stations.js";
import { useGameStore } from "../js/core/store.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };
const sumParts = (h) => h.sections.reduce((a, s) => a + Object.values(s.parts).reduce((x, y) => x + y, 0), 0);
const sumPlate = (h) => h.sections.reduce((a, s) => a + s.plate, 0);
const FAR = { x: 5e7, y: 0, z: 5e7 };
const dead = (id, ship, over = {}) => ({ id, name: `Test ${id}`, ship, role: "hauler", ...FAR, ...over });

/* ---- 1. the entity, with no sim behind it ----------------------------------- */
const clock = { time: 1000 };
resetHulks();
bindHulks(clock);
{
  const h = spawnHulk(dead("v1", "general_b", { cargo: { id: "water", qty: 100 } }));
  ok(h && hulks.length === 1 && hulkById(h.id) === h, "a dead hull leaves one hulk, findable by id");
  ok(h.ship === "general_b" && h.tier === "B" && h.vessel === "v1" && /hulk$/.test(h.name), `it remembers what it was (${h.name}, ${h.hullName}, tier ${h.tier})`);
  ok(h.sections.length === 3 && h.sections.map((s) => s.name).join() === HULK_SECTIONS.slice(0, 3).join(), `a B hull breaks into three named sections (${h.sections.map((s) => s.name).join(", ")})`);
  ok(h.sections.filter((s) => s.box).length === 1 && h.sections[0].box && h.sections[0].name === "bridge", "exactly one section carries the recorder, and it is the bridge");
  ok(h.sections.every((s) => s.plate >= 1 && s.plate === s.plate0 && s.cut === 0 && s.intact >= HULK.intact[0] && s.intact <= HULK.intact[1]), "every section has plate, is uncut, and took damage inside the band");
  const hold = h.sections.find((s) => s.name === "hold");
  ok(hold.cargo?.id === "water" && hold.cargo.qty >= 15 && hold.cargo.qty <= 60, `the hold keeps a fraction of what it carried (${hold.cargo?.qty}/100 water)`);
  ok(h.sections.filter((s) => s.cargo).length === 1, "and only the hold carries it");

  const m = hulkManifest(h);
  const byHand = sumPlate(h) * baseValue(HULK.plate) + h.sections.reduce((a, s) => a + Object.entries(s.parts).reduce((x, [id, q]) => x + q * baseValue(id), 0), 0) + hold.cargo.qty * baseValue("water");
  ok(m.plate === sumPlate(h) && m.partCount === sumParts(h) && m.cargo.water === hold.cargo.qty && m.sections === 3 && m.left === 3 && m.box, "the manifest adds the sections up");
  ok(m.value === Math.round(byHand) && m.value > 0, `and prices them off the goods table (${m.value} cr)`);

  const twin = (() => { resetHulks(); return spawnHulk(dead("v1", "general_b", { cargo: { id: "water", qty: 100 } })); })();
  ok(JSON.stringify(twin.sections) === JSON.stringify(h.sections) && twin.spin === h.spin, "the same death at the same second makes the same hulk (seeded, not random)");
}

/* ---- 2. every part is a real good, and size follows the hull ---------------- */
{
  const ids = new Set(Object.values(HULK_PARTS).flat());
  ok([...ids].every((id) => good(id)), `every part a hulk can hold is on the goods table (${[...ids].filter((id) => !good(id)).join(", ") || "all"})`);
  ok(good(HULK.plate), `and so is its plate (${HULK.plate})`);
  ok(HULK_SECTIONS.every((n) => HULK_PARTS[n]?.length), "every section name has a parts pool");
  resetHulks();
  const rows = [];
  for (const t of "ABCDEFG") {
    const def = SHIP_DB.find((d) => d.tier === t);
    const h = spawnHulk(dead(`t${t}`, def.id), { intact: 1 });
    rows.push({ t, n: h.sections.length, plate: sumPlate(h), parts: sumParts(h), want: HULK.plateK * Math.pow(def.stats.massT, HULK.plateExp) });
  }
  ok(rows.map((r) => r.n).join() === "2,3,4,5,6,7,8" && rows.every((r) => r.n === sectionCount(r.t)), `sections run two to eight with the tier (${rows.map((r) => `${r.t}${r.n}`).join(" ")})`);
  ok(rows.every((r, i) => i === 0 || (r.plate > rows[i - 1].plate && r.parts > rows[i - 1].parts)), `a bigger hull is more plate and more parts (${rows.map((r) => `${r.t} ${r.plate}/${r.parts}`).join(", ")})`);
  ok(rows.every((r) => Math.abs(r.plate - r.want) <= r.n), "an intact hull's plate is the mass rule, to rounding");
  ok(spawnHulk({ id: "bad", ship: "general_a", x: NaN, y: 0, z: 0 }) === null && spawnHulk(null) === null, "a hull with no position leaves nothing");
  ok(spawnHulk(dead("odd", "no_such_ship")).ship === "general_a", "an unknown hull falls back to the default one rather than throwing");
}

/* ---- 3. one death, one hulk; and the sky does not fill up -------------------- */
{
  resetHulks();
  clock.time = 2000;
  const a = spawnHulk(dead("twice", "general_a"));
  ok(spawnHulk(dead("twice", "general_a")) === a && hulks.length === 1, "two reports of the same death are one hulk");
  clock.time += HULK.again + 1;
  ok(spawnHulk(dead("twice", "general_a")) !== a && hulks.length === 2, "the same hull dying again later is another");

  resetHulks();
  const keep = spawnHulk(dead("pinned", "general_a"), { pinned: true });
  for (let i = 0; i < HULK.max + 6; i++) spawnHulk(dead(`c${i}`, "general_a"));
  ok(hulks.length === HULK.max, `the sky holds ${HULK.max} hulks and no more`);
  ok(hulks.includes(keep) && !hulkById("hk2") && hulks[hulks.length - 1].vessel === `c${HULK.max + 5}`, "the oldest goes first, a pinned one stays");
  ok(new Set(hulks.map((h) => h.id)).size === hulks.length, "ids stay unique through it");

  resetHulks();
  const old = spawnHulk(dead("old", "general_a"));
  const held = spawnHulk(dead("held", "general_a"), { pinned: true });
  stepHulks(HULK.life - 1);
  ok(hulks.length === 2, "a hulk lasts its life");
  stepHulks(2);
  ok(!hulks.includes(old) && old.dead && hulks.includes(held), "then it is gone — unless something has it pinned");
  removeHulk(held);
  ok(hulks.length === 0 && held.dead, "and removing one is clean");
}

/* ---- 4. drift, and the frame it lies in -------------------------------------- */
{
  resetHulks();
  clock.time = 5000;
  const fast = spawnHulk(dead("fast", "general_b", { vx: 90000, vy: 0, vz: -40000 }));
  const sp = Math.hypot(fast.vx, fast.vy, fast.vz);
  ok(Math.abs(sp - HULK.driftMax) < 1e-6, `a hull killed at cruise does not leave at cruise (${sp.toFixed(1)} u/s, cap ${HULK.driftMax})`);
  ok(fast.parent === null, "out between worlds it lies in the star's frame");
  const x0 = fast.x;
  for (let i = 0; i < 600; i++) { clock.time += 1; stepHulks(1); }
  const moved = Math.abs(fast.x - x0);
  ok(fast.vx === 0 && fast.vz === 0, "the drift dies away");
  ok(moved > 100 && moved < HULK.driftMax * HULK.driftTau * 1.2, `and it comes to rest near where it died (${Math.round(moved)} u on)`);
  const there = { x: fast.x, z: fast.z };
  for (let i = 0; i < 60; i++) { clock.time += 1; stepHulks(1); }
  ok(fast.x === there.x && fast.z === there.z && fast.tumble !== 0, "at rest it stays put, still tumbling");

  const earth = BODIES.find((b) => b.id === "earth");
  const moon = BODIES.find((b) => b.id === "moon");
  const p = bodyPosition("earth", clock.time, {});
  const near = spawnHulk(dead("near", "general_b", { x: p.x + earth.radius * 4, y: p.y + 200, z: p.z }));
  ok(near.parent === "earth", "inside a world's sphere of influence it lies in that world's frame");
  const pm = bodyPosition("moon", clock.time, {});
  const lunar = spawnHulk(dead("lunar", "general_b", { x: pm.x + moon.radius * 3, y: pm.y, z: pm.z }));
  ok(lunar.parent === "moon", "and the innermost sphere wins (a moon over its planet)");
  const toMoon = { x: pm.x - p.x, y: pm.y - p.y, z: pm.z - p.z };
  const em = Math.hypot(toMoon.x, toMoon.y, toMoon.z);
  const k = (em - moon.soi * 1.5) / em;
  const between = spawnHulk(dead("between", "general_b", { x: p.x + toMoon.x * k, y: p.y + toMoon.y * k, z: p.z + toMoon.z * k }));
  ok(moon.soi * 1.5 < moon.well && between.parent === "earth", "the frame is the sphere of influence the ship itself flies by, not the wider gravity well (0.3.86: a hulk off Earth was riding the Moon)");
  clock.time += 3000;
  stepHulks(1);
  const p2 = bodyPosition("earth", clock.time, {});
  ok(Math.abs(near.x - (p2.x + earth.radius * 4)) < 1e-3 && Math.abs(near.y - (p2.y + 200)) < 1e-3 && Math.hypot(p2.x - p.x, p2.z - p.z) > 1000, `fifty minutes on it has gone round with the planet (${Math.round(Math.hypot(p2.x - p.x, p2.z - p.z))} u) and kept its place over it`);
  const hv = hulkVelocity(near, {});
  const bv = bodyVelocity("earth", clock.time, {});
  ok(Math.hypot(hv.x - bv.x, hv.y - bv.y, hv.z - bv.z) < 1e-6 && Math.hypot(bv.x, bv.z) > 1, "and its velocity is the planet's, so MATCH can hold on it");
  ok(hulkVelocity(fast, {}).x === 0, "a hulk at rest in open space has none");

  const list = nearHulks({ x: near.x, y: near.y, z: near.z }, earth.well);
  ok(list[0].h === near && list[0].d === 0 && list.every((e, i) => i === 0 || e.d >= list[i - 1].d), "nearHulks finds what is in range, nearest first");

  earth.shattered = true;
  stepHulks(1);
  ok(near.parent === null && Math.abs(near.x - (p2.x + earth.radius * 4)) < 50, "a hulk whose world breaks up is cut loose where it was");
  earth.shattered = false;

  const doomed = spawnHulk(dead("doomed", "general_a", { x: p2.x + earth.radius * 0.5, y: p2.y, z: p2.z }));
  stepHulks(HULK.sweep + 0.1);
  ok(!hulks.includes(doomed) && doomed.dead, "and one that ends up inside a world is gone");
}

/* ---- 5. the module stays out of the sim's import cycle ----------------------- */
{
  const src = fs.readFileSync(new URL("../js/world/hulks.js", import.meta.url), "utf8");
  ok(!/sim\/sim\.js|from "\.\.\/sim\//.test(src), "world/hulks.js does not import the sim (it is bound, like debris)");
}

/* ---- 6. in the sky: every way a hull dies leaves one ------------------------- */
makePilot("Hulks", "terran", "salvage", null);
launchSim("HulkTest", "fixture");
sim.phase = "play";
for (let i = 0; i < 120; i++) tickSim(1 / 60);
const ship = sim.ship;
ship.dockedAt = null;
{
  ok(hulks.length === 0, "a new sky starts with no hulks (and the sim has rebound the store)");
  const up = traffic.filter((n) => n.visible !== false && n.job !== "down" && n.job !== "docked");
  ok(up.length > 6, `there is traffic to lose (${up.length} hulls flying)`);

  /* a. the plain call the kill paths share */
  const a = up[0];
  const ha = leaveHulk({ id: a.id, kind: "npc", x: a.x, y: a.y, z: a.z }, "test");
  ok(ha && ha.ship === shipById(a.ship).id && ha.vessel === a.id && ha.source === "test" && ha.born === sim.time, `leaveHulk turns a downed vessel into its own hull's hulk (${ha?.name})`);
  ok(leaveHulk({ id: "nobody", kind: "npc", x: 0, y: 0, z: 0 }) === null && leaveHulk({ id: a.id, kind: "drone", x: 0, y: 0, z: 0 }) === null, "a drone, a station gun or a stranger leaves none");

  /* b. hull against hull, with nobody watching */
  const b = up[1];
  const before = hulks.length;
  damageHull(b, 1e6, up[2].id, sim.time);
  const hb = hulks.find((h) => h.vessel === b.id);
  ok(b.job === "down" && hulks.length === before + 1 && hb?.source === "combat", `a hull lost to another hull leaves a hulk (${hb?.name})`);

  /* c. the pilot's own guns */
  const speed = (n) => Math.hypot(n.vx ?? 0, n.vy ?? 0, n.vz ?? 0);
  const c = up.filter((n) => n !== a && n !== b && n !== up[2]).sort((x, y) => speed(x) - speed(y))[0];
  ok(speed(c) < 200, `there is a hull slow enough to shoot (${c.role}, ${c.job}, ${Math.round(speed(c))} u/s)`);
  ship.pos.x = c.x + 240; ship.pos.y = c.y; ship.pos.z = c.z;
  ship.vel.x = ship.vel.y = ship.vel.z = 0;
  tickSim(1 / 60);
  const cc = contacts.find((k) => k.id === c.id);
  ok(Boolean(cc), "the mark is on the contact board");
  if (cc) {
    cc.hp = 1; cc.shield = 0; c.hp = 1; c.shield = 0;
    fireRound({ x: cc.x + 60, y: cc.y, z: cc.z }, cc, 900, 500, "self", "friendly");
    for (let i = 0; i < 30 && c.job !== "down"; i++) tickSim(1 / 60);
  }
  const hc = hulks.find((h) => h.vessel === c.id);
  ok(c.job === "down" && hc?.source === "kill", `a hull the pilot destroys leaves a hulk (${hc?.name})`);
  ok(hc && Math.hypot(hc.x - ship.pos.x, hc.y - ship.pos.y, hc.z - ship.pos.z) < 2000, "right where it died");

  /* d. locked, anchored, matched, assayed */
  if (hc) {
    const cand = lockCandidates().find((k) => k.kind === "hulk" && k.id === hc.id);
    ok(cand && cand.name === hc.name && cand.sig >= 14, "a hulk is something P-LOCK can take");
    clearLock();
    acquireLock({ kind: "hulk", id: hc.id });
    ok(sim.lock.kind === "hulk" && sim.lock.id === hc.id && sim.lock.name === hc.name, "and takes");
    const tp = targetPosition("hulk", hc.id, {});
    ok(tp && tp.x === hc.x && tp.z === hc.z, "the lock tracks where it is");
    const tv = targetVelocity("hulk", hc.id, {});
    ok(Number.isFinite(tv.x) && Number.isFinite(tv.y) && Number.isFinite(tv.z), "and how it is moving");
    const ap = resolveAnchor({ kind: "hulk", id: hc.id }, sim.time);
    ok(ap && ap.x === hc.x, "a waypoint can be anchored to it");
    ok(resolveAnchor({ kind: "hulk", id: "hk-none" }, sim.time) === null, "and one anchored to a hulk that is gone resolves to nothing");

    const f = { x: hc.x - ship.pos.x, y: hc.y - ship.pos.y, z: hc.z - ship.pos.z };
    const fl = Math.hypot(f.x, f.y, f.z) || 1;
    ship.yaw = ship.aimYaw = Math.atan2(-f.x, -f.z);
    ship.pitch = ship.aimPitch = Math.asin(f.y / fl);
    const nose = forwardOf(ship.yaw, ship.pitch);
    ok((f.x * nose.x + f.y * nose.y + f.z * nose.z) / fl > 0.99, "nose on the hulk");
    sim.notice = "";
    requestScan();
    tickSim(1 / 60);
    ok(/Hulk assay/.test(sim.notice) && sim.notice.includes(hc.vesselName) && /sections uncut/.test(sim.notice), `SCAN on a hulk reads its manifest ("${String(sim.notice).slice(0, 90)}…")`);
    ok(hc.assayed === true, "and marks it assayed, so a second look teaches nothing new");

    removeHulk(hc);
    for (let i = 0; i < 3; i++) tickSim(1 / 60);
    ok(sim.lock.id === null, "a lock on a hulk that is gone lets go");
  }

  /* e. a staged ambush that ends badly for somebody */
  {
    let lost = null;
    for (let slot = 0; slot < 60 && !lost; slot++) {
      for (let t = slot * ENG_SLOT; t < (slot + 1) * ENG_SLOT; t += 10) {
        const e = engagementAt(t, stations, currentSystem);
        if (e && e.downId && !e.applied && vesselById(e.downId) && !hulks.some((h) => h.vessel === e.downId)) { lost = e; break; }
      }
    }
    ok(Boolean(lost), `an ambush with a loss rolls in the first sixty slots (${lost?.id}, ${lost?.outcome})`);
    if (lost) {
      const n = hulks.length;
      stepBattles(lost.downAt + 0.05, 1 / 30, ship.pos, () => {}, stations, currentSystem);
      const hd = hulks.find((h) => h.vessel === lost.downId);
      ok(lost.applied && hulks.length === n + 1 && hd?.source === "battle" && hd.born === lost.downAt + 0.05, `and the hull that loses it leaves a hulk (${hd?.name})`);
    }
  }

  /* f. the count reaches the HUD store, and a new sky clears it */
  publishHud();
  ok(useGameStore.getState().hulks === hulks.length && hulks.length >= 2, `the HUD store carries the count (${hulks.length})`);
  loadSky("fixture-2");
  ok(hulks.length === 0, "a new sky starts clean");
  loadSky("fixture");
}

console.log(`hulks: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
