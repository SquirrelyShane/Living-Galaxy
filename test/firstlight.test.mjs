/* LIVING GALAXY 0.3.61 — "First light": the start card to the seat.
 *
 *   node --import ./test/three-register.mjs test/firstlight.test.mjs
 *
 * Reported: signed in, PLAY, and up to ten seconds of the sky rendering behind
 * the card before FLY AS could be used. Measured causes, each pinned here:
 *   - the module graph loaded one level per round trip (34 deep) → a preload
 *     list in index.html that must match the graph (tools/preload.mjs --check)
 *   - FLY AS waited for every module → painted from storage by an inline
 *     script, a tap held until the game is up
 *   - the menu grew the sky as a backdrop and FLY AS grew the same sky again:
 *     every port rebuilt (the station builder is most of loadSky) → held
 *     across a reload of the same sky, released on a different one
 *   - a returning pilot's backdrop was Sol even when FLY AS goes elsewhere
 */
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const mem = new Map();
globalThis.localStorage ??= { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };

/* ---- the preload list is the graph -------------------------------------------------- */
{
  const { graph, block, current } = await import("../tools/preload.mjs");
  const g = graph();
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  ok(g.length > 200 && g.includes("./js/sim.js") && g.includes("./vendor/three.module.min.js"), `the walk finds the graph, three included (${g.length} modules)`);
  ok(g.includes("./vendor/three.core.min.js"), "and follows the import map into three's own core");
  ok(current(html) === block(g), "index.html's preload block is the graph as it stands");
  let clean = true;
  try { execFileSync(process.execPath, [new URL("../tools/preload.mjs", import.meta.url).pathname, "--check"], { stdio: "pipe" }); } catch { clean = false; }
  ok(clean, "tools/preload.mjs --check agrees");
  ok(!/modulepreload" href="\.\/js\/main\.js"/.test(html), "the entry is not preloaded twice");
  ok(html.indexOf("preload:begin") < html.indexOf("</head>") && html.indexOf("importmap") < html.indexOf("preload:begin"), "the preloads sit in the head, after the import map");
}

/* ---- FLY AS is on the first paint --------------------------------------------------- */
{
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const card = html.indexOf('id="btn-continue"'), early = html.indexOf("__lgFlyQueued"), mod = html.indexOf('src="./js/main.js"');
  ok(card > 0 && early > card && early < mod, "the early painter runs after the button exists and before the game module");
  ok(/lgaa-save-v1/.test(html) && /lgaa\.pilot\.v1/.test(html), "it reads the same two records FLY AS does");
  const { PILOT_KEY } = await import("../js/pilot.js");
  ok(PILOT_KEY === "lgaa.pilot.v1", "and the pilot key has not moved under it");
  const hud = fs.readFileSync(new URL("../js/hud.js", import.meta.url), "utf8");
  ok(/__lgFlyQueued/.test(hud), "the HUD honours a tap held from before boot");
  ok(/if \(window\.__lgBooted\) return;/.test(html), "and the early handler stands down once the game is up");
}

/* ---- the same sky twice holds its ports --------------------------------------------- */
{
  const { sim, loadSky } = await import("../js/sim.js");
  const { stations } = await import("../js/stations.js");
  const { carriedCount } = await import("../js/stationyard.js");

  let t = performance.now();
  loadSky("Vesiaphou");
  const cold = performance.now() - t;
  const first = stations.map((s) => ({ id: s.id, root: s.gen.root, radius: s.radius, port: JSON.stringify(s.portLocal), hangars: s.hangarsLocal.length }));

  /* as the engine holds them: each hull hung off a holder out in the scene */
  const THREE = await import("three");
  for (const s of stations) { const h = new THREE.Group(); h.position.set(1e5, -4e4, 7e4); h.add(s.gen.root); h.updateMatrixWorld(true); }

  t = performance.now();
  loadSky("Vesiaphou");
  const warm = performance.now() - t;
  const again = stations.map((s) => ({ id: s.id, root: s.gen.root, radius: s.radius, port: JSON.stringify(s.portLocal), hangars: s.hangarsLocal.length }));

  ok(first.length > 3 && first.length === again.length, `the roster is the same size (${first.length})`);
  ok(first.every((a, i) => a.root === again[i].root), "every port is the same hull, not a rebuild");
  ok(first.every((a, i) => a.id === again[i].id && a.radius === again[i].radius && a.port === again[i].port && a.hangars === again[i].hangars), "and the port frames, radii and mouths read identically — measured in the hull's frame, not the scene's");
  ok(stations.every((s) => s.gen.root.parent === null), "a held hull comes off its old holder before it is measured");
  ok(carriedCount() === 0, "nothing is left held after the reload");
  ok(warm < cold * 0.6, `the reload is cheaper than the cold build (${cold.toFixed(0)} → ${warm.toFixed(0)} ms)`);

  loadSky("sol");
  ok(stations.every((s) => !first.some((a) => a.root === s.gen.root)), "a different sky grows its own ports");
  ok(carriedCount() === 0, "and the last sky's hulls are released, not held");
  ok(sim.skySeed === "sol", "the sky is the one asked for");
}

/* ---- a returning pilot's backdrop is the sky they fly into -------------------------- */
{
  const hud = fs.readFileSync(new URL("../js/hud.js", import.meta.url), "utf8");
  ok(/sv0\.lastSky && sv0\.callsign && loadPilot\(\)/.test(hud), "the menu previews lastSky when FLY AS is on offer");
}

/* ---- the engine keeps a sky's skins across its rebuild ------------------------------ */
{
  const eng = fs.readFileSync(new URL("../js/engine.js", import.meta.url), "utf8");
  ok(/texCacheFor\(sim\.skySeed\)/.test(eng) && /map\.userData\.keep = true/.test(eng), "painted skins are cached per sky and marked keep");
}

console.log(`firstlight: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
