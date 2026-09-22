/* LIVING GALAXY — ARIA plays the game, in a terminal, with no renderer.
 *
 * 0.3.22. One terminal runs the world:
 *
 *     python3 server.py 8080
 *
 * and a terminal per pilot runs a career, in that same sky, in the same room:
 *
 *     node tools/aria-play.mjs --career mining    --minutes 20
 *     node tools/aria-play.mjs --career commerce  --minutes 20
 *     node tools/aria-play.mjs --career security  --minutes 20 --hull general_c
 *
 * Each instance boots the sky from its seed (generation is deterministic, so
 * every instance and every browser tab builds the SAME sky), flies a hull of
 * the career's own line, takes work off the contract desk, and learns which
 * kind of work pays — the brain is written to logs/aria-brain-<career>.json
 * and read back on the next run, so a career gets better the more it is run.
 * The hull is pushed to the relay, so a player in a browser on the same server
 * sees ARIA out there working.
 *
 *   --career   mining | commerce | logistics | security | salvage | …
 *   --hull     a ship id (default: the best of the career's line it can fly)
 *   --minutes  wall-clock minutes to run (default 10; 0 = until Ctrl-C)
 *   --speed    sky seconds per wall second (default 8)
 *   --room     the sky seed / relay room (default "sol")
 *   --server   where server.py is (default http://127.0.0.1:8080)
 *   --credits  starting purse (default 20000)
 *   --name     callsign (default ARIA-<career>)
 *   --quiet    one line per event instead of a status line
 *   --no-net   do not touch the relay at all
 */

import { register } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve as rpath } from "node:path";
import { fileURLToPath } from "node:url";

register(new URL("../test/three-loader.mjs", import.meta.url));

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = rpath(HERE, "..");

/* ---- arguments ------------------------------------------------------------------ */
const argv = process.argv.slice(2);
const flag = (k, d = null) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? (argv[i + 1]?.startsWith("--") ? true : argv[i + 1] ?? true) : d; };
const has = (k) => argv.includes(`--${k}`);
const CAREER = String(flag("career", "mining"));
const MINUTES = Number(flag("minutes", 10));
const SPEED = Math.max(1, Number(flag("speed", 8)));
const ROOM = String(flag("room", "sol"));
const SERVER = String(flag("server", "http://127.0.0.1:8080"));
const CREDITS = Number(flag("credits", 20000));
const NAME = String(flag("name", `ARIA-${CAREER}`));
const QUIET = has("quiet");
const NONET = has("no-net");
const HULL = flag("hull", null);

if (has("help") || has("h")) { console.log(readFileSync(new URL(import.meta.url)).toString().split("*/")[0].replace(/^\/\*|^ \*ance?/gm, "")); process.exit(0); }

/* ---- the shims a page would have ------------------------------------------------- */
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
globalThis.sessionStorage = globalThis.localStorage;

/* ---- the game --------------------------------------------------------------------- */
const { sim, launchSim, tickSim, shiftClock, applyWorldSnapshot } = await import("../js/sim.js");
const { makePilot, pilot } = await import("../js/pilot.js");
const { shipsForComplex, shipById, DEFAULT_SHIP_ID } = await import("../js/shipdb.js");
const { speedOf } = await import("../js/ship.js");
const { beginPlay, stepPlay, endPlay, playReport, brainReport, play, CAREER_DEPT } = await import("../js/ariaplay.js");
const { makeRelay } = await import("./aria-net.mjs");
const { makeScreen, colourFor, paint, dim, bold, bar, money } = await import("./aria-tty.mjs");

const BRAIN = rpath(ROOT, "logs", `aria-brain-${CAREER}.json`);
function loadBrain() {
  try { return JSON.parse(readFileSync(BRAIN, "utf8")); } catch { return null; }
}
function saveBrain(b) {
  try { mkdirSync(dirname(BRAIN), { recursive: true }); writeFileSync(BRAIN, JSON.stringify(b, null, 2)); return true; } catch { return false; }
}

makePilot(NAME, "terran", CAREER, null);
launchSim(NAME, ROOM);
sim.phase = "play";
sim.ship.credits = CREDITS;

/* the hull: what the career flies, the biggest of its line unless told otherwise */
const line = shipsForComplex(pilot.complexId ?? CAREER);
const want = HULL ? shipById(String(HULL)) : line[Math.min(1, line.length - 1)] ?? null;
sim.activeHullId = want?.id ?? DEFAULT_SHIP_ID;
const hull = shipById(sim.activeHullId);

const brain0 = loadBrain();
beginPlay({ career: CAREER, name: NAME, brain: brain0 });

const relay = NONET ? null : makeRelay({ server: SERVER, room: ROOM, name: NAME });

/* Join the sky somebody is already in before flying a metre of it: adopt the
 * room's shared clock and, if another pilot holds the sky, their snapshot of
 * it. Without this a bot boots a private copy of the same seed beside yours,
 * at a different hour, with its own rocks. */
let joined = { joined: false, clock: false, snapshot: false, peers: 0, host: null };
if (relay) {
  joined = await relay.join({ shiftClock, applyWorldSnapshot, simTime: () => sim.time });
  if (joined.joined) console.log(`  joined ${ROOM}: ${joined.peers} other hull${joined.peers === 1 ? "" : "s"}${joined.clock ? ", clock in step" : ""}${joined.snapshot ? `, sky from ${joined.host}` : joined.host ? ", holding the sky" : ""}`);
  else console.log(`  ${SERVER} is not answering — flying a private copy of "${ROOM}"`);
}

const screen = makeScreen({ career: CAREER, name: NAME, hull: hull?.name ?? sim.activeHullId, sky: ROOM, server: SERVER, minutes: MINUTES, speed: SPEED, tty: QUIET ? false : null });

if (!screen.live) {
  console.log(`${NAME} · ${CAREER} · sky ${ROOM} · hull ${hull?.name ?? sim.activeHullId} · ${CREDITS} cr · ${MINUTES || "∞"}m at ${SPEED}× · brain: ${play.brain.why}`);
}

/* ---- the loop ---------------------------------------------------------------------- */
const DT = 1 / 30;
const started = Date.now();
const until = MINUTES > 0 ? started + MINUTES * 60000 : Infinity;
let lastDraw = 0, lastNet = 0, lastNet2 = 0, lastSave = 0, seenLog = 0, stop = false, peers = 0;

process.on("SIGINT", () => { stop = true; });

function state() {
  const r = playReport();
  return { ...r, online: relay ? relay.state.online : null, peers, server: SERVER };
}

async function tick() {
  const wall = Date.now();
  /* 30 wall frames a second, each one SPEED/30 seconds of sky, stepped at the
   * frame size the game itself uses — the physics never sees a long dt */
  for (let i = 0; i < Math.max(1, Math.round(SPEED)); i++) { tickSim(DT); stepPlay(DT); }

  if (wall - lastDraw > (screen.live ? 120 : 2000)) { lastDraw = wall; screen.draw(state()); }
  /* piped output still gets the events, one line each — a log you can grep */
  if (!screen.live) for (; seenLog < play.log.length; seenLog++) console.log(`    · ${play.log[seenLog].text}`);
  else seenLog = play.log.length;
  if (relay && wall - lastNet > 220) {
    lastNet = wall;
    relay.pushShip(sim.ship, { hull: sim.activeHullId, speed: speedOf(sim.ship, sim.frameVel) });
  }
  if (relay && wall - lastNet2 > 3000) { lastNet2 = wall; relay.poll().then(() => { peers = relay.state.peers; }); }
  if (wall - lastSave > 20000) { lastSave = wall; saveBrain({ ...play.brain, career: CAREER, sky: ROOM }); }
  if (stop || wall >= until) return finish();
  setTimeout(tick, 1000 / 30);
}

function finish() {
  const out = endPlay();
  saveBrain({ ...out.brain, career: CAREER, sky: ROOM });
  const r = out.report;
  screen.end(state(), `${Math.round(r.secs / 60)} min of sky · ${r.done} done, ${r.failed} dropped`);
  const col = colourFor(CAREER);
  const L = [];
  L.push(`  ${money(CREDITS)} → ${bold(paint(col.fg, `${money(r.credits)} cr`))}   ${paint(r.net >= 0 ? 78 : 203, `${r.net >= 0 ? "+" : ""}${money(r.net)}`)}  ${dim(`(${r.perMin >= 0 ? "+" : ""}${money(r.perMin)}/min over ${Math.round(r.secs / 60)} min)`)}`);
  if (r.business) {
    const b = r.business;
    L.push(`  ${dim("the business:")} ${b.crew}/${b.berths} crew${b.payroll ? ` on ${money(b.payroll)} cr/cycle` : ""}${b.morale != null ? `, morale ${b.morale}` : ""}${b.company ? ` · ${bold(b.company)} (${b.charter}) · ${b.staff} settled ashore paying ${money(b.staffIncome)} cr/cycle · ${money(b.treasury)} cr banked` : " · no charter"}`);
  }
  L.push("");
  L.push(`  ${dim("WHAT PAYS, AS FAR AS SHE CAN TELL")}`);
  const best = brainReport();
  const top = Math.max(1, best[0]?.perMin ?? 1);
  for (const m of best.slice(0, 8)) {
    L.push(`    ${bar(Math.max(0, m.perMin / top), 16, col.fg)} ${String(money(m.perMin)).padStart(8)} cr/min  ${dim(`${m.key}  (${m.runs} run${m.runs === 1 ? "" : "s"}${m.fails ? `, ${m.fails} dropped` : ""})`)}`);
  }
  L.push("");
  L.push(`  ${dim(`brain → ${BRAIN}`)}`);
  console.log(L.join("\n"));
  process.exit(0);
}

tick();
