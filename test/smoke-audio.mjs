/* Headless smoke: the kit is audible, in balance, and nothing leaks.
 *
 * Audio is the one system where "it runs without throwing" proves almost
 * nothing — the thing being replaced ran fine and sounded like one loud
 * tone. So this renders every cue through an OfflineAudioContext and checks
 * the numbers that actually describe the problem: is anything silent, is
 * anything clipping, is the hierarchy the right way up (a tap quieter than
 * an alarm), and is the palette still dark.
 *
 *   node test/smoke-audio.mjs "$(npm root -g)/playwright/index.mjs"   (server on :8124)
 */

const pwPath = process.argv[2];
const { chromium } = await import(pwPath);

const errors = [];
const fail = (m) => { console.error("FAIL", m); errors.push(m); };
const ok = (cond, m) => { if (!cond) fail(m); };

const browser = await chromium.launch({ args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage();
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });

await page.goto("http://127.0.0.1:8124/tools/audio-lab.html", { waitUntil: "networkidle" });
await page.waitForFunction(() => typeof window.__bakeCue === "function", null, { timeout: 20000 });

const names = await page.evaluate(async () => {
  const cues = await import("../js/audio/cues.js");
  const amb = await import("../js/audio/ambience.js");
  return [...Object.keys(cues.CUES), ...amb.PLACE_IDS.map((p) => `bed.${p}`)];
});
console.log(`${names.length} cues and beds`);

/* Nine seconds, not four. The longest cue is a 3.2 s chord into a 4.6 s
 * reverb, and judging whether it decays from a four-second window says only
 * that it is longer than four seconds. */
const measured = {};
for (const name of names) {
  const seconds = name.startsWith("bed.") ? 5 : 9;
  measured[name] = await page.evaluate(([n, s]) => window.__bakeCue(n, s), [name, seconds]);
}

/* ---- nothing silent, nothing clipping ---------------------------------- */

const silent = names.filter((n) => measured[n].peak < 0.006);
const hot = names.filter((n) => measured[n].peak > 0.95);
console.log(`peaks ${Math.min(...names.map((n) => measured[n].peak)).toFixed(3)} .. ${Math.max(...names.map((n) => measured[n].peak)).toFixed(3)}`);
ok(silent.length === 0, `silent: ${silent.join(", ")}`);
ok(hot.length === 0, `clipping: ${hot.join(", ")}`);

/* ---- the hierarchy is the right way up ---------------------------------
 * This is the actual bug being fixed. A refusal and a hull breach used to be
 * the same sound; they must now be far apart, and in the right order. */

const p = (n) => measured[n].peak;
ok(p("warn.deny") < p("warn.caution"), `a refusal (${p("warn.deny").toFixed(3)}) is not quieter than a caution (${p("warn.caution").toFixed(3)})`);
ok(p("warn.caution") < p("warn.alarm"), "a caution is not quieter than an alarm");
ok(p("warn.alarm") <= p("warn.critical"), "an alarm is louder than the critical alarm");
ok(p("warn.critical") / p("warn.deny") > 3, `the loudest alert is only ${(p("warn.critical") / p("warn.deny")).toFixed(1)}x the softest refusal — they will still read as the same sound`);
ok(p("ui.tap") < p("warn.alarm") * 0.5, "a button tap is within half the level of an alarm");
ok(p("ui.tick") < p("ui.tap"), "the subliminal tick is louder than an ordinary tap");
ok(p("ui.tap") < p("ui.commit"), "a tap is louder than a commit");

/* ---- the bed sits under the cues ---------------------------------------
 * Measured on RMS, not peak: a bed is continuous, so it is its average level
 * that masks a transient, not its loudest sample. */
const beds = names.filter((n) => n.startsWith("bed."));
const cues = names.filter((n) => !n.startsWith("bed."));
const bedRms = Math.max(...beds.map((n) => measured[n].rms));
const bigCuePeak = Math.min(...["nav.jump", "ship.clamp", "warn.alarm"].map(p));
console.log(`loudest bed rms ${bedRms.toFixed(4)} · quietest big cue peak ${bigCuePeak.toFixed(3)}`);
ok(bedRms < bigCuePeak * 0.6, `the bed (rms ${bedRms.toFixed(4)}) will mask the events on top of it`);
for (const n of beds) ok(measured[n].length > 3, `${n} is not sustaining — a bed that stops is a glitch`);

/* ---- every cue actually ends -------------------------------------------
 * Measured on the energy left in the last half second, not on where the last
 * audible sample falls: a four-second reverb tail is the point of the
 * palette, and the first version of this check flagged two cues for having
 * one. What it must catch is a voice that was never released. */
const runaway = cues.filter((n) => measured[n].tailRms > measured[n].peak * 0.04);
for (const n of runaway) console.log(`  ${n}: tail rms ${measured[n].tailRms.toFixed(4)} vs peak ${measured[n].peak.toFixed(3)}`);
ok(runaway.length === 0, `cues still sounding at the end of the render: ${runaway.join(", ")}`);

/* ---- the palette is dark ----------------------------------------------- */
const bright = await page.evaluate(async () => {
  /* Re-render two cues and measure where their energy sits. A palette that
   * has drifted bright is one somebody has put a sine beep back into. */
  const out = {};
  for (const n of ["ui.tap", "warn.alarm", "ship.clamp", "nav.lock"]) {
    const r = await window.__bakeCue(n, 2);
    const bin = atob(r.wav);
    const view = new DataView(new ArrayBuffer(bin.length));
    for (let i = 0; i < bin.length; i++) view.setUint8(i, bin.charCodeAt(i));
    const n16 = (bin.length - 44) / 4;
    const d = new Float32Array(n16);
    for (let i = 0; i < n16; i++) d[i] = view.getInt16(44 + i * 4, true) / 32768;
    /* crude zero-crossing rate stands in for brightness and needs no fft */
    let zc = 0;
    for (let i = 1; i < d.length; i++) if ((d[i] >= 0) !== (d[i - 1] >= 0)) zc++;
    out[n] = zc / (d.length / 44100) / 2;
  }
  return out;
});
console.log("dominant frequency (zero-crossing):", JSON.stringify(Object.fromEntries(Object.entries(bright).map(([k, v]) => [k, Math.round(v)]))));
for (const [n, hz] of Object.entries(bright)) {
  ok(hz < 3200, `${n} has drifted bright (${Math.round(hz)} Hz) — the palette has no beeps in it`);
}

/* ---- the game itself ---------------------------------------------------- */

const game = await browser.newPage();
const gErrs = [];
game.on("pageerror", (e) => gErrs.push(e.message));
await game.goto("http://127.0.0.1:8124/", { waitUntil: "networkidle" });
await game.waitForTimeout(5000);
await game.fill("#callsign", "AudioSmoke");
await game.click("#btn-create");
await game.waitForTimeout(300);
await game.evaluate(() => document.querySelector("#create-body .pick")?.click());
await game.waitForTimeout(600);
await game.click("#create-next");
await game.waitForTimeout(300);
await game.evaluate(() => document.querySelector("#create-body .pick")?.click());
await game.waitForTimeout(600);
await game.click("#create-next");
await game.waitForTimeout(300);
await game.click("#create-next");
await game.waitForTimeout(300);
await game.click("#btn-sol");
await game.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await game.waitForTimeout(4000);

const live = await game.evaluate(async () => {
  const a = await import("/js/audio.js");
  return a.audioState();
});
console.log("in play:", JSON.stringify(live));
ok(live.running, "the ambient bed is not running in play");
ok(live.place && live.place !== "menu", `the bed is still on the menu place in flight (${live.place})`);
ok(live.levels && Object.keys(live.levels).length === 6, "the mixer does not have all six buses");

/* the voice cap has to actually hold, or a phone dies in a firefight */
const capped = await game.evaluate(async () => {
  const c = await import("/js/audio/cues.js");
  const g = await import("/js/audio/graph.js");
  for (let i = 0; i < 300; i++) c.cue("ui.tap");
  return g.audio.voices;
});
console.log("voices after 300 rapid cues:", capped);
ok(capped <= 40, `the voice cap did not hold (${capped} live)`);

await game.click("#btn-pause");
await game.waitForTimeout(600);
const mix = await game.evaluate(() => document.querySelectorAll("#mix-rows .mix-row").length);
ok(mix === 6, `the mixer shows ${mix} rows, expected 6`);
ok(gErrs.length === 0, `page errors in play: ${gErrs.slice(0, 3).join(" | ")}`);

await browser.close();

if (errors.length) { console.error(`\naudio smoke FAILED (${errors.length})`); process.exit(1); }
console.log("\naudio smoke OK");
