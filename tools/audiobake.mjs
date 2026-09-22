/* LIVING GALAXY — render every cue to a wav, and measure it.
 *
 * The game needs none of this: every sound is synthesised live. This exists
 * so the kit can be *listened to* without launching the game and flying to
 * the situation that triggers each cue, and so the suite has numbers to
 * check rather than a promise that it sounds nice.
 *
 * It drives tools/audio-lab.html, which renders each cue through an
 * OfflineAudioContext — the same code path the game uses, just faster than
 * real time and into a buffer instead of a speaker.
 *
 *   python3 server.py 8124 &
 *   node tools/audiobake.mjs "$(npm root -g)/playwright/index.mjs"
 *   node tools/audiobake.mjs "<playwright>" --out art/audio --only warn,nav
 */

import { mkdir, writeFile } from "node:fs/promises";

const argv = process.argv.slice(2);
const pwPath = argv[0];
if (!pwPath || pwPath.startsWith("--")) {
  console.error("usage: node tools/audiobake.mjs <path-to-playwright/index.mjs> [--out DIR] [--only a,b] [--url U]");
  process.exit(2);
}
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const out = flag("out", "art/audio");
const only = flag("only", "").split(",").filter(Boolean);
const url = flag("url", "http://127.0.0.1:8124/tools/audio-lab.html");

const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForFunction(() => typeof window.__bakeCue === "function", null, { timeout: 15000 });

await mkdir(out, { recursive: true });

const names = await page.evaluate(async () => {
  const cues = await import("../js/audio/cues.js");
  const amb = await import("../js/audio/ambience.js");
  return [...Object.keys(cues.CUES), ...amb.PLACE_IDS.map((p) => `bed.${p}`)];
});

const wanted = only.length ? names.filter((n) => only.some((o) => n.startsWith(o))) : names;
console.log(`baking ${wanted.length} of ${names.length}\n`);

const rows = [];
let hot = 0, silent = 0;
for (const name of wanted) {
  /* beds are held voices — give them long enough to settle before the grab */
  const seconds = name.startsWith("bed.") ? 6 : name === "nav.spool" ? 5 : 4;
  const r = await page.evaluate(([n, s]) => window.__bakeCue(n, s), [name, seconds]);
  const file = `${out}/${name.replace(/\./g, "-")}.wav`;
  await writeFile(file, Buffer.from(r.wav, "base64"));
  const flags = [];
  if (r.peak > 0.98) { flags.push("CLIPPING"); hot++; }
  if (r.peak < 0.004) { flags.push("SILENT"); silent++; }
  rows.push({ name, peak: r.peak, rms: r.rms, length: r.length, flags });
  console.log(`${name.padEnd(18)} peak ${r.peak.toFixed(3)}  rms ${r.rms.toFixed(4)}  ${r.length.toFixed(2)}s  ${flags.join(" ")}`);
}

await browser.close();

console.log(`\n${rows.length} written to ${out}/`);
if (hot) console.log(`${hot} clipping`);
if (silent) console.log(`${silent} silent`);
process.exit(hot || silent ? 1 : 0);
