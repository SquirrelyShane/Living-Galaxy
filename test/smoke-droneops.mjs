/* Browser smoke: the GNN station is on the board, a bulletin lands in chat (no ringing call),
 * the port deck's Drones tab builds a miner, and the CONSOLE › WORK › DRONES setup opens on its questions.
 *   node test/smoke-droneops.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124) */
const { chromium } = await import(process.argv[2]);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok ", m); } else { fail++; console.error("  FAIL", m); } };
await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "DroneSmoke"); await page.click("#btn-create"); await sleep(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click()); await sleep(400);
await page.click("#create-next"); await sleep(300);
await page.evaluate(() => [...document.querySelectorAll("#create-body .pick")].find((b) => /mining/i.test(b.textContent))?.click() ?? document.querySelector("#create-body .pick")?.click());
await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
await page.click("#create-next"); await sleep(300); await page.click("#create-next"); await sleep(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 }); await sleep(1200);

const g = await page.evaluate(async () => {
  const { gnnStation, gnnPost } = await import("/js/gnn.js");
  const { recent } = await import("/js/chat.js");
  const { comms } = window.__lg.comms;
  const st = gnnStation();
  /* A bulletin must land as a CHAT LINE and must not open a call — that is
   * the whole point of the GNN desk being a desk rather than a caller.
   *
   * This used to assert `!comms.session?.isRinging`, which is a different
   * claim: that NOTHING is ringing. Port control hails a hull that has just
   * arrived, so on most runs a perfectly correct call from
   * "<port> CONTROL" was ringing at that moment and the check failed — four
   * runs in four, latterly, and about half of them before that. It never had
   * anything to do with the bulletin.
   *
   * So: snapshot the session before, post, and compare. A call that was
   * already ringing stays ringing and is none of this test's business; what
   * must not happen is a NEW one, or one from the news desk. */
  const before = comms.session ? { peer: comms.session.peerName, ringing: Boolean(comms.session.isRinging) } : null;
  gnnPost({ desk: "markets", title: "Smoke shortage", body: "Water is short.", actions: [{ label: "Mark buyer", run: () => {} }] });
  const m = recent(1, "gnn")[0];
  const after = comms.session ? { peer: comms.session.peerName, ringing: Boolean(comms.session.isRinging) } : null;
  return {
    st: st?.name, gen: Boolean(st?.gen), chat: m?.text, links: m?.links.map((l) => l.label),
    startedCall: Boolean(after && (!before || after.peer !== before.peer)),
    gnnCalling: Boolean(after?.ringing && /GNN/i.test(after.peer ?? "")),
    ringingWith: after?.ringing ? after.peer : null,
  };
});
console.log("gnn:", JSON.stringify(g));
ok(g.st && g.gen, `GNN station grown in this sky (${g.st})`);
ok(/Smoke shortage/.test(g.chat) && g.links[0].includes("GNN desk"), "bulletin lands in chat with a desk link");
ok(!g.startedCall && !g.gnnCalling,
   `…and rings nobody${g.ringingWith ? ` (an unrelated call from ${g.ringingWith} was already up, which is not this test's business)` : ""}`);

/* dock at an industrial port and build a miner from the deck */
const dock = await page.evaluate(async () => {
  const { sim, stations, toggleDock } = window.__lg;
  const { rolesAt } = await import("/js/drones/roles.js");
  const st = stations.find((s) => rolesAt(s).includes("miner"));
  sim.ship.pos.x = st.x + 30; sim.ship.pos.y = st.y; sim.ship.pos.z = st.z;
  sim.ship.vel.x = st.vx; sim.ship.vel.y = st.vy; sim.ship.vel.z = st.vz;
  sim.ship.dockedAt = st.id;
  sim.ship.credits = 50000;
  const { foundCompany, transfer, company } = await import("/js/company.js");
  const gate = (await import("/js/drones/ops.js")).buildOptions(st).map((o) => o.blocker);
  foundCompany("Smoke Co", "industrial");
  transfer(20000);
  return { name: st.name, gate, treasury: company.treasury, pocket: window.__lg.sim.ship.credits };
});
console.log("dock:", JSON.stringify(dock));
ok(dock.gate.every((b) => /company/.test(b)), "no company → lines blocked");
await sleep(800);
await page.evaluate(() => document.querySelector('#sd-tabs button[data-sd="drones"]')?.click()); await sleep(300);
const deck = await page.evaluate(() => ({ open: !document.getElementById("station-deck").classList.contains("hidden"), lines: [...document.querySelectorAll("#sd-body .sd-row .sd-lab b")].map((b) => b.textContent), build: [...document.querySelectorAll("#sd-body button")].filter((b) => b.textContent === "BUILD").length }));
console.log("deck:", JSON.stringify(deck));
ok(deck.open && deck.build >= 1 && deck.lines.some((l) => /Miner/.test(l)), `Drones tab lists the port's lines (${deck.lines.length})`);
await page.evaluate(() => [...document.querySelectorAll("#sd-body .sd-row")].find((r) => /Miner/.test(r.textContent))?.querySelector("button")?.click());
await sleep(300);
const q = await page.evaluate(async () => { const { droneOps } = await import("/js/drones/ops.js"); const { company } = await import("/js/company.js"); return { queue: droneOps.queue.length, treasury: company.treasury, credits: window.__lg.sim.ship.credits }; });
ok(q.queue === 1 && q.treasury < 20000 && q.treasury > 0, `miner on the line, treasury billed (${q.treasury} cr left)`);
/* the chatbox: the band, GNN and drone lines with links; a typed line goes out and gets an answer */
const cb = await page.evaluate(async () => {
  const folded = { folded: document.getElementById("chatbox").classList.contains("folded"), badge: document.getElementById("cb-unread-n").textContent };
  window.__lg.chatbox.setSize(1);       // it starts folded to the input with the unread badge; open it
  const rows = [...document.querySelectorAll("#cb-log .cb-row")];
  if (!folded.folded || Number(folded.badge) < 2) return { visible: false, rows: -1, folded };
  return { visible: !document.getElementById("chatbox").classList.contains("hidden"), rows: rows.length, gnnLink: Boolean(document.querySelector("#cb-log .cb-row.gnn .cb-link")), stickHidden: document.getElementById("stick").classList.contains("hidden"), tabs: [...document.querySelectorAll("#cb-tabs .cb-tab")].map((t) => t.textContent) };
});
console.log("chatbox:", JSON.stringify(cb));
ok(cb.visible && cb.rows >= 2 && cb.gnnLink && cb.stickHidden, `chatbox live where the stick was (${cb.rows} rows, tabs ${cb.tabs.join("/")})`);
await page.fill("#cb-in", "what is your status?");
await page.evaluate(() => document.getElementById("cb-send").click());
await sleep(2800);
/* The last two rows are not reliably [player, answer]: the band is busy, and
 * if two hands answer inside the wait the player's own line has already been
 * pushed up. Find the player's line wherever it landed and require an answer
 * after it — which is what the assertion was always trying to say. */
const talk = await page.evaluate(() => [...document.querySelectorAll("#cb-log .cb-row")].map((r) => `${r.className}|${r.querySelector(".cb-text").textContent}`));
const mine = talk.findLastIndex((r) => /\byou\b/.test(r.split("|")[0]));
const answer = mine >= 0 ? talk.slice(mine + 1).find((r) => /local|sys/.test(r.split("|")[0]) && r.split("|")[1].length > 2) : null;
console.log("talk:", JSON.stringify([talk[mine] ?? null, answer ?? null]));
ok(mine >= 0 && Boolean(answer), `a typed line goes out on the band and gets an answer (${talk.length} rows, mine at ${mine})`);
/* fast-forward the line */
await page.evaluate(async () => { const { droneOps } = await import("/js/drones/ops.js"); droneOps.queue[0].done = window.__lg.sim.time - 1; });
await sleep(700);
const built = await page.evaluate(async () => {
  const { droneOps } = await import("/js/drones/ops.js");
  const { recent } = await import("/js/chat.js");
  const con = document.getElementById("console");
  const open = con && !con.classList.contains("hidden");
  const tab = document.querySelector("#con-tabs .on")?.textContent ?? "";
  const sub = document.querySelector("#con-subtabs .on")?.textContent ?? "";
  const u = droneOps.units[0];
  const card = u && con ? con.querySelector(`[data-focus="${u.id}"]`) : null;
  const rows = card ? [...card.querySelectorAll("button, .tlab, .tchip, .k")].map((r) => r.textContent) : [];
  return { units: droneOps.units.map((u) => `${u.name}:${u.state}`), asked: recent(3, "drones").some((m) => /confirm/.test(m.text)), cmdOpen: open, crumbs: `${tab} › ${sub}`, rows };
});
console.log("built:", JSON.stringify(built));
ok(built.units.length === 1 && /MINER-01:setup/.test(built.units[0]), "miner rolled off into setup");
ok(built.asked, "it asked for its orders in chat");
ok(built.cmdOpen && /WORK › DRONES/i.test(built.crumbs) && built.rows.some((r) => /BEGIN/.test(r)) && built.rows.some((r) => /start location/i.test(r)), `CONSOLE › WORK › DRONES opened on its setup (${built.crumbs}; ${built.rows.length} controls)`);
await page.screenshot({ path: "/tmp/smoke-droneops.png" });
ok(errors.length === 0, `no page errors (${errors.length})`);
console.log(`smoke droneops: ${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
