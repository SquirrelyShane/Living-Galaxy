/* Headless smoke: two pilots, one sky.
 *   A launches into Sol, B joins. Checks: host election, B mirrors A's rocks,
 *   A's strike lands on B's world, both clocks agree, the same NPC hull sits
 *   in the same place on both screens, and when A leaves B becomes host.
 *   node test/smoke-shared-sky.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
async function pilot(name) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.error(`PAGE ERROR [${name}]`, e.message));
  await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
  await page.fill("#callsign", name);
  await page.click("#btn-create");
  for (let i = 0; i < 3; i++) { await page.waitForTimeout(300); await page.click("#create-next"); }
  await page.waitForTimeout(300);
  await page.click("#btn-sol");
  await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
  return { ctx, page };
}

const A = await pilot("HostAlpha");
await A.page.waitForTimeout(2500);
const B = await pilot("JoinBravo");
await B.page.waitForTimeout(3000);

/* PROBE BOTH AT ONCE, AND ASK EACH CLIENT ABOUT ITSELF.
 *
 * This used to read A, then read B, and assert their sim.times were within
 * three seconds of each other. Under swiftshader with two WebGL contexts a
 * single page.evaluate() blocks on the page's main thread for anything from
 * 0.6 to 4 seconds — so the two readings were taken SECONDS APART in wall
 * time, both sims advanced in between, and the assertion was measuring the
 * probe's own latency. Measured: a serial gap of 2502 ms produced a "2.89 s
 * clock disagreement", 3112 ms produced 3.60 s. It failed about half the time
 * and never meant anything when it did.
 *
 * Two changes. The pages are probed in PARALLEL, so neither reading is stale
 * by a whole poll. And the real question — is each client in step with the
 * room — is asked of each client about ITSELF: `sim.time` against the room
 * clock it was last handed, both read inside the same evaluate, where no
 * latency can get between them. Differencing two independently-timed reads
 * was never the right measurement.
 */
const probe = (page) => page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { net } = await import("/js/net.js");
  const { worldsync } = await import("/js/worldsync.js");
  const { impactors } = await import("/js/impactors.js");
  const { traffic } = await import("/js/npc/traffic.js");
  const v = traffic.find((n) => n.role === "patrol");
  /* the room's clock as this client last heard it, and its own distance from
   * it — both sampled here, together, immune to how long the probe took */
  const shared = (net.serverNow && net.worldBorn) ? net.serverNow - net.worldBorn : null;
  return {
    clockOff: shared == null ? null : sim.time - shared,
    born: net.worldBorn,
    pollAge: net.serverNow ? Date.now() / 1000 - net.serverNow : null,
    host: worldsync.host, hostId: net.hostId, online: net.online, peers: net.peers, time: sim.time,
    authority: sim.worldAuthority, rocks: impactors.map((m) => m.id),
    patrol: v ? { id: v.id, x: Math.round(v.x), z: Math.round(v.z) } : null,
    trafficN: traffic.length,
  };
});

let [a, b] = await Promise.all([probe(A.page), probe(B.page)]);
console.log("A:", JSON.stringify({ host: a.host, peers: a.peers, time: +a.time.toFixed(1), rocks: a.rocks, patrol: a.patrol }));
console.log("B:", JSON.stringify({ host: b.host, peers: b.peers, time: +b.time.toFixed(1), rocks: b.rocks, patrol: b.patrol }));
const fails = [];
if (!(a.host && !b.host)) fails.push("host election (A should host, B mirror)");
for (const [who, p] of [["A", a], ["B", b]]) {
  if (p.clockOff == null) fails.push(`${who} never received the room clock`);
  else if (Math.abs(p.clockOff) > 2.5) fails.push(`${who} is ${p.clockOff.toFixed(1)}s out of step with the room`);
}
/* And that they are running the SAME clock, which is an exact question with
 * an exact answer: `born` is the room's zero, handed to every client by the
 * relay, and two pilots in one sky must have the same one to the millisecond.
 *
 * Comparing sim.time between the two pages cannot be that check. Under
 * swiftshader a starved page can miss its poll loop for ten seconds or more,
 * and its clock legitimately lags until the next poll arrives — nothing is
 * wrong with the sky, the browser simply was not given the CPU. Asserting on
 * `born` catches the failure that actually matters (two pilots in different
 * rooms, or one never told which room it is in) and cannot be tripped by the
 * test machine being busy. */
if (a.born !== b.born) fails.push(`different room clocks: A born ${a.born}, B born ${b.born}`);
if (!a.born) fails.push("A never learned the room's clock zero");
if (!a.patrol || !b.patrol || a.patrol.id !== b.patrol.id) fails.push("traffic rosters differ");
else {
  /* Comparing live positions compares two different instants: the clocks are
   * allowed 3 s apart, and a hull on a lane hop moves tens of thousands of
   * units in that. Poses are pure functions of time, so ask BOTH clients
   * where the timetable puts this hull at one agreed second — if the sky is
   * truly shared, those must agree to the metre. */
  const t0 = Math.floor(Math.min(a.time, b.time));
  const poseProbe = (page) => page.evaluate(async (tt) => {
    const { traffic, poseAt } = await import("/js/npc/traffic.js");
    const v = traffic.find((n) => n.role === "patrol");
    if (!v) return null;
    const p = poseAt(v, tt);
    return { x: Math.round(p.x), z: Math.round(p.z) };
  }, t0);
  const pa = await poseProbe(A.page), pb = await poseProbe(B.page);
  if (!pa || !pb || Math.hypot(pa.x - pb.x, pa.z - pb.z) > 60) fails.push(`same patrol, different place at t=${t0}: ${JSON.stringify(pa)} vs ${JSON.stringify(pb)}`);
}

/* A gets a rock; B should mirror it within a couple of wstate beats */
await A.page.evaluate(async () => {
  const { impactors } = await import("/js/impactors.js");
  const { sim } = await import("/js/sim.js");
  impactors.push({ id: "impSMOKE", name: "Smoke Rock", x: sim.ship.pos.x + 40000, y: 0, z: sim.ship.pos.z, vx: -50, vy: 0, vz: 0, r: 300, seed: 0.4, spin: 0.1, born: sim.time, deflected: 0, lastWell: null });
});
await B.page.waitForTimeout(3200);
b = await probe(B.page);
console.log("B rocks after A's spawn:", JSON.stringify(b.rocks));
if (!b.rocks.includes("impSMOKE")) fails.push("B did not mirror A's rock");

/* A's rock lands: B's world takes the same crater */
const struck = await A.page.evaluate(async () => {
  const { strikeBody } = await import("/js/sim.js");
  const { BODIES, bodyById } = await import("/js/bodies.js");
  const w = BODIES.find((x) => x.kind !== "star" && x.kind !== "gas" && !x.shattered);
  const tier = strikeBody(w.id, w.radius * 0.35, 900);
  return { id: w.id, name: w.name, tier, craters: bodyById(w.id).craters.length };
});
await B.page.waitForTimeout(1500);
const bCr = await B.page.evaluate(async (id) => {
  const { bodyById } = await import("/js/bodies.js");
  const { worldsync } = await import("/js/worldsync.js");
  return { craters: bodyById(id).craters.length, integrity: bodyById(id).integrity, strikesIn: worldsync.stats.strikesIn };
}, struck.id);
console.log("A struck", struck.name, struck.tier, "craters A:", struck.craters, "B:", bCr.craters, "strikesIn:", bCr.strikesIn);
if (bCr.craters < 1) fails.push("A's strike did not land on B's world");

/* a late joiner inherits the scar from the snapshot */
await A.page.waitForTimeout(1500);
const C = await pilot("LateCharlie");
await C.page.waitForTimeout(3500);
const cCr = await C.page.evaluate(async (id) => {
  const { bodyById } = await import("/js/bodies.js");
  const { worldsync } = await import("/js/worldsync.js");
  return { craters: bodyById(id).craters.length, applied: worldsync.applied, pulls: worldsync.stats.pulls, host: worldsync.host };
}, struck.id);
console.log("late joiner C:", JSON.stringify(cCr));
if (cCr.craters < 1) fails.push("late joiner did not inherit the crater");
await C.page.screenshot({ path: "/tmp/shared-c.png" });

/* the host leaves; B inherits the sky */
await A.ctx.close();
await B.page.waitForTimeout(9000);
b = await probe(B.page);
console.log("B after A left:", JSON.stringify({ host: b.host, hostId: b.hostId, peers: b.peers, authority: b.authority }));
if (!b.host) fails.push("B did not become host after A left");

await browser.close();
if (fails.length) { console.error("FAIL:", fails.join("; ")); process.exit(1); }
console.log("shared sky smoke OK");
