/* LIVING GALAXY — bake the attract scene to a still.
 *
 * The menu shot is live, so the game never needs this file to run. It exists
 * because a store page, a README header or a social card wants one frame at a
 * size no phone will ever render, and the honest way to make that picture is
 * to photograph the game rather than to paint something the game cannot do.
 *
 * Serve the tree first (python3 server.py 8124), then:
 *
 *   node tools/keyart.mjs "$(npm root -g)/playwright/index.mjs"
 *   node tools/keyart.mjs "<playwright>" --out art/keyart.png --size 2560x1440
 *   node tools/keyart.mjs "<playwright>" --seed kesune --shots 6
 *
 * --shots N re-rolls the sky N times and writes keyart-1.png … keyart-N.png,
 * which is the fastest way to find a frame worth keeping: the composition is
 * seeded, so a sky you like can be reproduced from its seed forever.
 */

import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const argv = process.argv.slice(2);
const pwPath = argv[0];
if (!pwPath || pwPath.startsWith("--")) {
  console.error("usage: node tools/keyart.mjs <path-to-playwright/index.mjs> [--out F] [--size WxH] [--seed S] [--shots N] [--url U] [--ui]");
  process.exit(2);
}
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};
const has = (name) => argv.includes(`--${name}`);

const out = flag("out", "art/keyart.png");
const [W, H] = flag("size", "2560x1440").split("x").map(Number);
const seed = flag("seed", "");
const shots = Number(flag("shots", "1"));
const url = flag("url", "http://127.0.0.1:8124/");
const settle = Number(flag("settle", "11000"));

const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });

await mkdir(dirname(out) || ".", { recursive: true });

for (let n = 1; n <= shots; n++) {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));

  /* Force the best quality regardless of what this machine looks like to the
   * device heuristic — a render farm is not a phone. */
  const room = seed || (shots > 1 ? `keyart-${n}` : "");
  await page.addInitScript((s) => {
    try {
      localStorage.setItem("lgaa.attract", "high");
      if (s) localStorage.setItem("lgaa.seed", s);
    } catch { /* private mode: the defaults are fine */ }
  }, room);

  await page.goto(url, { waitUntil: "networkidle" });
  /* Surfaces stream in one per frame, so the wait is not decoration: leave
   * too early and the hero world is still a flat colour. */
  await page.waitForTimeout(settle);

  const info = await page.evaluate(() => {
    const a = window.__lgAttract;
    const gl = window.__lgGL;
    return {
      hero: a?.hero ?? null,
      active: a?.active ?? false,
      draws: gl?.renderer?.info?.render?.calls ?? 0,
      tris: gl?.renderer?.info?.render?.triangles ?? 0,
      sky: window.__lgSystemName ?? null,
    };
  });

  if (!has("ui")) {
    /* The picture is the scene, not the menu. */
    /* display:none, not opacity — the shot measures the start card's rectangle
     * to decide where it may compose, and an invisible card still has one. */
    await page.addStyleTag({ content: "#start,#hud,#create,#tutor,#chatbar{display:none!important}" });
    await page.waitForTimeout(900);   // let the shot recompose without the card
  }

  const file = shots > 1 ? out.replace(/(\.png)?$/i, `-${n}.png`) : out;
  await page.screenshot({ path: file });
  console.log(`${file}  ${W}x${H}  hero=${info.hero}  draws=${info.draws}  tris=${info.tris}`);
  await page.close();
}

await browser.close();
