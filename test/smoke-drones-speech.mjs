/* Headless smoke for robot drones + the speech band, in a real browser:
 * a free port's gun drones and a port's interceptor render as robotgen machines
 * (not the old tetra/cone), a probe in flight is drawn, the open channel carries
 * speech-engine exchanges, and a hailed hull answers TALK chips and typed lines.
 *   node test/smoke-drones-speech.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });
page.on("console", (m) => { if (m.type() === "error") console.error("console:", m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok ", m); } else { fail++; console.error("  FAIL", m); } };

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "BotSmoke");
await page.click("#btn-create");
await sleep(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await sleep(400);
await page.click("#create-next");
await sleep(300);
await page.evaluate(() => [...document.querySelectorAll("#create-body .pick")].find((b) => /commerce/i.test(b.textContent))?.click() ?? document.querySelector("#create-body .pick")?.click());
await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
await page.click("#create-next");
await sleep(300);
await page.click("#create-next");
await sleep(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await sleep(1500);

/* ---- drones: park beside a free port so its gun drones launch; add an interceptor and a probe */
const setup = await page.evaluate(async () => {
  const { sim, stations, contacts } = window.__lg;
  const hold = stations.find((s) => s.sector === "pirate" && s.guards > 0);
  const civ = stations.find((s) => s.sector !== "pirate");
  const at = hold ?? civ;
  sim.ship.pos.x = at.x + at.radius * 6; sim.ship.pos.y = at.y; sim.ship.pos.z = at.z + at.radius * 6;
  sim.ship.vel.x = at.vx ?? 0; sim.ship.vel.y = at.vy ?? 0; sim.ship.vel.z = at.vz ?? 0;
  const p = sim.ship.pos;
  contacts.push({ id: "sdrone-smoke-1", kind: "sdrone", name: `${civ.name} interceptor`, relation: "ally", stationId: civ.id, x: p.x + 30, y: p.y + 4, z: p.z - 40, vx: 0, vy: 0, vz: 0, hp: 40, shield: 0, radius: 3, yaw: 0.6, pitch: 0, cooldown: 99, born: sim.time });
  const { launchProbe } = await import("/js/probes.js");
  launchProbe(p.x + 900000, p.y, p.z + 900000, "Smoke probe");
  sim.cameraMode = 1;
  return { hold: hold?.name ?? null, guards: hold?.guards ?? 0, civ: civ.name };
});
console.log("setup:", JSON.stringify(setup));
/* 0.3.59: a probe flies 9,000 u/s and leaves draw range inside a couple of
 * seconds on a slow headless frame — watch for it through the wait rather than
 * only at the end of it */
let seenProbe = false;
for (let i = 0; i < 25; i++) {
  await sleep(100);
  seenProbe ||= await page.evaluate(() => window.__lgGL.scene.children.some((c) => /^drone:probe/.test(c.name)));
}
const drones = await page.evaluate(() => {
  const { scene } = window.__lgGL;
  const bots = scene.children.filter((c) => /^drone:/.test(c.name));
  const kinds = {};
  for (const b of bots) { const k = b.name.split(":")[1]; kinds[k] = (kinds[k] ?? 0) + 1; }
  const tetra = scene.children.filter((c) => c.isMesh && c.geometry?.type === "TetrahedronGeometry").length;
  const draws = bots.map((b) => { let n = 0; b.traverse((o) => { if (o.isMesh) n++; }); return n; });
  const guards = window.__lg.contacts.filter((c) => c.kind === "drone").length;
  return { kinds, tetra, draws, guards, names: bots.slice(0, 4).map((b) => b.name) };
});
console.log("drones:", JSON.stringify(drones));
ok((drones.kinds.sdrone ?? 0) >= 1, "the interceptor is a robotgen machine");
if (setup.hold && drones.guards) ok((drones.kinds.guard ?? 0) >= 1 && drones.tetra === 0, `gun drones are robots, no placeholders left (${drones.kinds.guard}/${drones.guards})`);
else ok(true, "no free port with guns in this sky (guard render skipped)");
ok((drones.kinds.probe ?? 0) >= 1 || seenProbe, "the probe in flight is drawn");
ok(drones.draws.every((n) => n <= 6), `drones stay cheap (${drones.draws.join(",")} meshes each)`);
/* look at the interceptor from the external camera and grab a frame */
await page.evaluate(() => { const { sim } = window.__lg; sim.ship.yaw = Math.atan2(30, -40) + Math.PI; });
await sleep(500);
await page.screenshot({ path: "/tmp/smoke-drones.png" });

/* ---- deck works tab tag (data only) */
const tag = await page.evaluate(async () => {
  const { droneSummary } = await import("/js/dronespec.js");
  const civ = window.__lg.stations.find((s) => s.sector !== "pirate");
  return droneSummary("sdrone", civ.name, civ.sector);
});
ok(tag.designation && tag.parts > 10, `drone line tag: ${tag.designation} ${tag.career} ${tag.massKg} kg ${tag.parts} parts`);

/* ---- the open channel: force a few chatter slots near a busy port */
const band = await page.evaluate(async () => {
  const { sim, stations } = window.__lg;
  const port = stations.filter((s) => s.sector !== "pirate").sort((a, b) => (b.gen?.stats?.hangars ?? 0) - (a.gen?.stats?.hangars ?? 0))[0];
  sim.ship.pos.x = port.x + 600; sim.ship.pos.y = port.y; sim.ship.pos.z = port.z + 600;
  const { comms } = window.__lg.comms;
  const seen = [];
  for (let i = 0; i < 8; i++) {
    comms.chatter.queue.length = 0;
    comms.chatter.next = 0;
    await new Promise((r) => setTimeout(r, 120));
    seen.push(...comms.chatter.queue.map((l) => `${l.from.name} › ${l.to.name}: ${l.text}`));
  }
  return { port: port.name, seen, stats: window.__lg.comms.speech() };
});
console.log("band:", band.port, JSON.stringify(band.stats));
for (const l of band.seen.slice(0, 6)) console.log("   ", l);
ok(band.stats.band >= 3 && band.stats.lines > 0, `speech band live (${band.stats.band} voices, ${band.stats.lines} lines, ${band.stats.memories} memories)`);

/* ---- TALK: hail a hull on the contact list and talk to it */
const hailed = await page.evaluate(async () => {
  const { sim, contacts } = window.__lg;
  const { traffic } = await import("/js/npc/traffic.js");
  const n = traffic.find((x) => x.visible !== false && x.role !== "pirate" && x.job !== "down");
  sim.ship.pos.x = n.x + 200; sim.ship.pos.y = n.y; sim.ship.pos.z = n.z + 200;
  await new Promise((r) => setTimeout(r, 900));
  const c = contacts.find((x) => x.id === n.id);
  if (!c) return { ok: false, why: "not on contacts" };
  window.__lg.comms.hailContact(c.id);
  return { ok: true, name: n.name };
});
console.log("hail:", JSON.stringify(hailed));
ok(hailed.ok, "a hull to hail");
if (hailed.ok) {
  await page.waitForSelector(".cx-chip", { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => document.querySelector(".cx-log")?.click());
  await sleep(300);
  const chips = await page.evaluate(() => [...document.querySelectorAll(".cx-chip")].map((c) => c.textContent));
  ok(chips.includes("TALK"), `TALK on the hail (${chips.join(" | ")})`);
  await page.evaluate(() => [...document.querySelectorAll(".cx-chip")].find((c) => c.textContent === "TALK")?.click());
  await sleep(2500);
  await page.evaluate(() => document.querySelector(".cx-log")?.click());
  await sleep(300);
  const after = await page.evaluate(() => ({
    rows: [...document.querySelectorAll(".cx-row__txt")].map((r) => r.textContent),
    chips: [...document.querySelectorAll(".cx-chip")].map((c) => c.textContent),
    input: !document.querySelector(".cx-say")?.hidden,
  }));
  console.log("   talk:", JSON.stringify(after.rows.slice(-3)));
  ok(after.rows.length >= 3 && after.rows[after.rows.length - 1] !== "Go ahead.", "the hull answers the TALK line from the engine");
  ok(after.chips.includes("SIGN OFF") && after.chips.length >= 4, `quick lines offered (${after.chips.join(" | ")})`);
  ok(after.input, "free-text input shown on a scripted call");
  await page.fill(".cx-say input", "what are you carrying?");
  await page.evaluate(() => document.querySelector(".cx-say button")?.click());
  await sleep(2500);
  await page.evaluate(() => document.querySelector(".cx-log")?.click());
  await sleep(300);
  const typed = await page.evaluate(() => [...document.querySelectorAll(".cx-row__txt")].map((r) => r.textContent).slice(-2));
  console.log("   typed:", JSON.stringify(typed));
  ok(typed[0] === "what are you carrying?" && typed[1] && typed[1].length > 3, "a typed line gets an in-character answer");
  await page.screenshot({ path: "/tmp/smoke-talk.png" });
}

ok(errors.length === 0, `no page errors (${errors.length})`);
console.log(`smoke drones+speech: ${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
