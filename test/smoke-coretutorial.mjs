/* Headless smoke: 0.3.14 — the presets fly without a Mission core, and the
 * refusal that used to be a dead end now opens the walkthrough.
 *
 * The thing being proved is the SEAM between three modules that a node suite
 * cannot reach: a real tap on a real chip in a real console overlay has to
 * reach the tutorial card, which lives on the HUD *behind* that overlay. That
 * is where the 0.3.12 bug lived, and it is where this one could live too.
 *
 *   node test/smoke-coretutorial.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */
const pwPath = process.argv[2];
const { chromium } = await import(pwPath);

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
page.on("pageerror", (e) => { errs.push(e.message); console.error("PAGE ERROR", e.message); });

await page.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await page.fill("#callsign", "CoreSmoke");
await page.click("#btn-create");
await page.waitForTimeout(400);
for (let i = 0; i < 3; i++) { await page.click("#create-next"); await page.waitForTimeout(350); }
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await page.waitForTimeout(1500);

/* the intro card is in the way of everything; end it as a player would */
await page.evaluate(() => document.querySelector("#tutor-skip")?.click());
await page.waitForTimeout(300);

const fails = [];
const check = (c, m) => { if (!c) fails.push(m); };

/* ---- 1. no core aboard, and a preset still flies --------------------------- */
const one = await page.evaluate(async () => {
  const { openConsole } = await import("/js/console/console.js");
  const { missionCore } = await import("/js/mission/script.js");
  openConsole("work", "mission");
  await new Promise((f) => setTimeout(f, 500));
  const core = missionCore();
  const rows = [...document.querySelectorAll("#con-body .trow")];
  const mine = rows.find((r) => /MINE LOOP/.test(r.textContent || ""));
  const run = [...(mine?.querySelectorAll("button") ?? [])].find((b) => b.textContent.trim() === "RUN");
  run?.click();
  await new Promise((f) => setTimeout(f, 600));
  const { mission } = await import("/js/mission/run.js");
  return { core, foundRow: Boolean(mine), foundRun: Boolean(run), active: Boolean(mission.active), steps: mission.active?.steps?.length ?? 0, name: mission.active?.name ?? null };
});
console.log("preset:", JSON.stringify(one));
check(one.core === false, "a fresh pilot has no Mission core");
check(one.foundRow && one.foundRun, "MINE LOOP has its own RUN button");
check(one.active && one.steps > 1, "and it flies a multi-step plan with no core fitted");

/* ---- 2. a loop the pilot sets is still refused, and now explains itself ----- */
const two = await page.evaluate(async () => {
  const { openConsole } = await import("/js/console/console.js");
  const { stopMission } = await import("/js/mission/run.js");
  stopMission("smoke");
  openConsole("work", "mission");
  await new Promise((f) => setTimeout(f, 500));
  /* the loop row's ×N chip: the gate the pilot walks into */
  const chip = [...document.querySelectorAll("#con-body button")].find((b) => b.textContent.trim() === "×N");
  chip?.click();
  await new Promise((f) => setTimeout(f, 500));
  const body = document.querySelector("#con-body")?.textContent ?? "";
  const show = [...document.querySelectorAll("#con-body button")].find((b) => /SHOW ME HOW/.test(b.textContent || ""));
  const { tutorial } = await import("/js/tutorial.js");
  return {
    foundChip: Boolean(chip),
    blocked: /MISSION CORE NEEDED/.test(body),
    explains: /7,500 cr/.test(body) && /presets above fly without it/.test(body),
    showMe: Boolean(show),
    autoStarted: tutorial.active && tutorial.track === "core",
  };
});
console.log("gate:", JSON.stringify(two));
check(two.foundChip, "the loop chip is there to tap");
check(two.blocked, "tapping it says MISSION CORE NEEDED in the panel");
check(two.explains, "and explains what a core is and what it costs");
check(two.showMe, "and offers SHOW ME HOW");
check(two.autoStarted, "and starts the walkthrough on the first refusal");

/* ---- 3. SHOW ME HOW: the console gets out of the way, the card comes up ----- */
const three = await page.evaluate(async () => {
  const show = [...document.querySelectorAll("#con-body button")].find((b) => /SHOW ME HOW/.test(b.textContent || ""));
  show?.click();
  await new Promise((f) => setTimeout(f, 700));
  const { sim } = await import("/js/sim.js");
  const card = document.getElementById("tutor");
  const rect = card?.getBoundingClientRect();
  return {
    consoleOpen: sim.terminalOpen,
    cardUp: Boolean(card) && !card.hidden,
    core: card?.classList.contains("tutor-core") ?? false,
    title: card?.querySelector("#tutor-title")?.textContent ?? "",
    text: card?.querySelector("#tutor-text")?.textContent ?? "",
    onScreen: Boolean(rect && rect.width > 40 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1 && rect.left >= -1),
    next: !(card?.querySelector("#tutor-next")?.hidden ?? true),
  };
});
console.log("card:", JSON.stringify({ ...three, text: three.text.slice(0, 70) }));
check(three.consoleOpen === false, "SHOW ME HOW shuts the console");
check(three.cardUp && three.core, "the MISSION CORE card is up and styled as the interrupt");
check(/MISSION CORE/.test(three.title), "titled for the track");
check(three.onScreen, "and it is fully on screen, not clipped off the edge");
check(three.next, "phase one has NEXT — there is nothing to measure yet");

/* ---- 4. the phases advance on the sky, one control lit at a time ----------- */
/* Polled, never slept on. The tutorial re-reads the sky twice a second and the
 * HUD paints on its own clock, so a fixed wait after a teleport is a coin toss
 * — this asks for the phase it expects and gives it up to three seconds to
 * arrive, which is a real assertion rather than a timing hope. */
const four = await page.evaluate(async () => {
  const { sim } = await import("/js/sim.js");
  const { tutorialEvaluate, tutorial } = await import("/js/tutorial.js");
  const { coreYard } = await import("/js/tutorial-core.js");
  const wait = (ms) => new Promise((f) => setTimeout(f, ms));
  const lit = () => [...document.querySelectorAll("[data-tutor-hi]")].map((e) => e.id);
  const step = () => tutorialEvaluate().step;
  /* → the phase it settled on, whether or not that is the one asked for */
  const until = async (want, ms = 3000) => {
    for (let t = 0; t < ms; t += 100) { if (step() === want) break; await wait(100); }
    await wait(120);   /* let the card paint the phase it just moved to */
    return { step: step(), lit: lit(), len: (document.querySelector("#tutor-text")?.textContent ?? "").length };
  };
  /* park the ship dead still at an offset from the yard, reading the yard's
     position fresh each time — stations orbit */
  const park = (mult, extra = 0) => {
    const y = coreYard(sim.ship.pos);
    sim.ship.pos.x = y.st.x + y.st.radius * mult + extra;
    sim.ship.pos.y = y.st.y;
    sim.ship.pos.z = y.st.z;
    sim.ship.vel.x = sim.ship.vel.y = sim.ship.vel.z = 0;
    return y;
  };
  const out = { seen: {} };

  document.querySelector("#tutor-next")?.click();
  out.seen.yard = await until("core-find");
  const card = document.getElementById("tutor");
  out.action = card.querySelector("#tutor-act")?.hidden ? null : card.querySelector("#tutor-act").textContent;
  out.alt = card.querySelector("#tutor-alt")?.hidden ? null : card.querySelector("#tutor-alt").textContent;
  out.nextOnYard = !(card.querySelector("#tutor-next")?.hidden ?? true);

  /* SET COURSE is what clears the yard phase — there is no NEXT to skip WARP with */
  card.querySelector("#tutor-act").click();
  out.lockName = sim.lock.name;
  out.seen.warp = await until("core-warp");

  /* inside the core's arrival radius: where a warp would have put you */
  const y = park(6, 900);
  out.yard = y.st.name;
  out.seen.approach = await until("core-approach");

  /* inside the berthing ring */
  park(2);
  out.seen.dock = await until("core-dock");

  sim.ship.dockedAt = coreYard(sim.ship.pos).st.id;
  out.seen.refit = await until("core-fit");

  const { upgrades } = await import("/js/upgrades.js");
  upgrades.owned.push("nav_core");
  for (let t = 0; t < 3000 && tutorial.active; t += 100) await wait(100);
  out.ended = { active: tutorial.active, track: tutorial.track, lit: lit() };
  return out;
});
const at = (tag) => four.seen[tag] ?? {};
console.log("walk:", JSON.stringify(Object.entries(four.seen).map(([k, v]) => `${k}=${v.step}[${v.lit.join(",")}]`)));
console.log("course:", JSON.stringify({ action: four.action, alt: four.alt, nextOnYard: four.nextOnYard, yard: four.yard, locked: four.lockName }));
console.log("ended:", JSON.stringify(four.ended));
check(four.action === "SET COURSE" && four.alt === "AUTO FLY", "the yard phase offers both a course and the autopilot");
check(four.nextOnYard === false, "and no NEXT beside them — the course is the thing that advances it");
check(at("yard").step === "core-find", "NEXT off phase one lands on the yard");
check(four.lockName && at("warp").step === "core-warp", `SET COURSE locks the yard (${four.lockName}) and that is what advances it`);
check(at("warp").lit.join() === "btn-warp", `WARP is lit while the warp phase is up (${at("warp").lit.join()})`);
check(at("approach").step === "core-approach" && at("approach").lit.join() === "btn-approach", `closing on the yard hands over to APPR, lit (${at("approach").step} ${at("approach").lit.join()})`);
check(at("dock").step === "core-dock" && at("dock").lit.join() === "op-dock", `inside the ring it points at the DOCK switch (${at("dock").step} ${at("dock").lit.join()})`);
check(at("refit").step === "core-fit" && at("refit").lit.join() === "aux-deck", `docked, it points at DECK for the refit desk (${at("refit").step})`);
check(Object.values(four.seen).every((v) => v.lit.length <= 1 && v.len > 40), "one control lit at a time, and every phase says something");
check(four.ended && !four.ended.active && four.ended.lit.length === 0, "the core aboard ends the track and puts the lights out");

if (errs.length) fails.push(`page errors: ${errs.join(" | ")}`);
await browser.close();
if (fails.length) { console.error("core tutorial smoke FAILED:"); for (const f of fails) console.error("  -", f); process.exit(1); }
console.log("core tutorial smoke OK");
