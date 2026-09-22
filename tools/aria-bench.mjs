/* LIVING GALAXY — the career bench: is a career worth flying?
 *
 * 0.3.24. `tools/aria-play.mjs` is one pilot in one terminal. This is the
 * instrument: every career flown from the same purse, in the same sky, off the
 * same seed, for the same minutes of sky time — so the numbers can be put next
 * to each other and mean something.
 *
 *     node tools/aria-bench.mjs --minutes 25 --room sol
 *     node tools/aria-bench.mjs --careers mining,commerce --minutes 40 --json before.json
 *     node tools/aria-bench.mjs --minutes 25 --compare before.json
 *
 * It is what "trading pays three times what mining pays" has to be measured
 * with before it can be called a balance problem, and what the fix has to be
 * measured with afterwards. `--json` writes the table so two runs can be
 * diffed; `--compare` prints the delta against an earlier one.
 *
 * A career is flown in a PROCESS OF ITS OWN. Nine sim relaunches inside one
 * process share a module graph — the mission executor, the autopilot, the
 * contract desk, the speech band — and the eighth career inherits whatever the
 * seventh left behind. The first version of this bench did exactly that and
 * reported eight of nine careers earning identical money without flying at
 * all, which is a fact about the harness and not about the game. A child per
 * career cannot lie that way.
 *
 *   --careers  comma list (default: one per department)
 *   --minutes  sky minutes per career (default 25)
 *   --jobs     careers flown at once (default 3)
 *   --room     sky seed (default sol)
 *   --credits  starting purse (default 20000)
 *   --seed     exploration seed, so a bench repeats (default "bench")
 *   --seeds    how many seeds per career; the median is reported (default 1)
 *   --json     write the result here     --compare  diff against an earlier one
 */

import { register } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const flag = (k, d = null) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] ?? d : d; };
const ONE = flag("one", null);
const MINUTES = Number(flag("minutes", 25));
const ROOM = String(flag("room", "sol"));
const CREDITS = Number(flag("credits", 20000));
const SEED = String(flag("seed", "bench"));
const JOBS = Math.max(1, Number(flag("jobs", 3)));
/* A single run of a career is one path through a stochastic game: which job was
 * on the desk when she looked, which way the exploration coin fell. Averaging a
 * few seeds is the difference between an instrument and an anecdote. */
const SEEDS = Math.max(1, Number(flag("seeds", 1)));
const OUT = flag("json", null);
const CMP = flag("compare", null);

const DEPTS = ["mining", "logistics", "commerce", "security", "salvage", "manufacturing", "energy", "research", "healthcare"];
const CAREERS = String(flag("careers", DEPTS.join(","))).split(",").map((s) => s.trim()).filter(Boolean);

register(new URL("../test/three-loader.mjs", import.meta.url));

const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.sessionStorage = globalThis.localStorage;

const { sim, launchSim, tickSim } = await import("../js/sim.js");
const { makePilot } = await import("../js/pilot.js");
const { shipsForComplex, shipById, DEFAULT_SHIP_ID } = await import("../js/shipdb.js");
const { beginPlay, stepPlay, endPlay, playReport, brainReport, CAREER_DEPT } = await import("../js/ariaplay.js");
const { tradeRoutes } = await import("../js/traderoutes.js");
const { rngFromSeed } = await import("../js/generate.js");
const { colourFor, paint, dim, bold, plain, pad } = await import("./aria-tty.mjs");

const money = (n) => Math.round(n).toLocaleString("en-US");
const right = (s, n) => " ".repeat(Math.max(0, n - plain(String(s)).length)) + s;

/* ---- the child: exactly one career, one line of JSON on stdout ------------------- */
if (ONE) {
  makePilot(`B-${ONE}`, "terran", ONE, null);
  launchSim(`Bench-${ONE}`, ROOM);
  sim.phase = "play";
  for (let i = 0; i < 120; i++) tickSim(1 / 60);
  const line = shipsForComplex(ONE);
  sim.activeHullId = (line[Math.min(1, line.length - 1)] ?? shipById(DEFAULT_SHIP_ID))?.id ?? DEFAULT_SHIP_ID;
  sim.ship.credits = CREDITS;
  for (const k of Object.keys(sim.ship.hold)) delete sim.ship.hold[k];
  beginPlay({ career: ONE, name: `B-${ONE}`, rng: rngFromSeed(`${SEED}:${ONE}`) });
  const ticks = Math.round(MINUTES * 60 * 60);
  for (let i = 0; i < ticks; i++) { tickSim(1 / 60); stepPlay(1 / 60); }
  const r = playReport();
  const best = brainReport();
  endPlay();
  console.log(JSON.stringify({
    career: ONE, dept: CAREER_DEPT[ONE] ?? "?", hull: shipById(sim.activeHullId)?.name ?? sim.activeHullId,
    net: r.net, perMin: r.perMin, purse: r.purse, done: r.done, failed: r.failed, decisions: r.decisions,
    crew: r.business?.crew ?? 0, payroll: r.business?.payroll ?? 0,
    company: r.business?.company ?? null, treasury: r.business?.treasury ?? 0,
    staff: r.business?.staff ?? 0, staffIncome: r.business?.staffIncome ?? 0,
    best: best.slice(0, 3).map((b) => ({ key: b.key, perMin: Math.round(b.perMin), runs: b.runs })),
  }));
  process.exit(0);
}

/* ---- the parent: fan the careers out, then summarise ----------------------------- */
console.log(`\n  ${bold("CAREER BENCH")}  ${dim(`sky ${ROOM} · ${MINUTES} min each · ${SEEDS} seed${SEEDS === 1 ? "" : "s"} · ${money(CREDITS)} cr start · "${SEED}" · ${JOBS} at a time`)}\n`);

const SELF = fileURLToPath(import.meta.url);
function flyOne(career, seed = SEED) {
  return new Promise((res) => {
    const args = [SELF, "--one", career, "--minutes", String(MINUTES), "--room", ROOM, "--credits", String(CREDITS), "--seed", seed];
    const ch = spawn(process.execPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let buf = "", err = "";
    ch.stdout.on("data", (d) => { buf += d; });
    ch.stderr.on("data", (d) => { err += d; });
    ch.on("close", () => {
      const line = buf.split("\n").reverse().find((l) => l.startsWith("{"));
      try { res(JSON.parse(line)); }
      catch { res({ career, dept: CAREER_DEPT[career] ?? "?", net: 0, perMin: 0, done: 0, failed: 0, decisions: 0, best: [], error: (err || buf).trim().split("\n").pop()?.slice(0, 90) || "no result" }); }
    });
  });
}

const runs = [];
const queue = CAREERS.flatMap((career) => Array.from({ length: SEEDS }, (_, i) => ({ career, seed: SEEDS === 1 ? SEED : `${SEED}#${i}` })));
await Promise.all(Array.from({ length: Math.min(JOBS, queue.length) }, async () => {
  while (queue.length) {
    const job = queue.shift();
    const r = await flyOne(job.career, job.seed);
    runs.push(r);
    /* stream as they land, so a long bench is something you can watch rather
     * than something you wait for */
    if (SEEDS > 1) console.log(`  ${dim(pad(`${r.career} ${job.seed.split("#")[1] ?? ""}`, 19))}${right(`${money(r.perMin)}/min`, 11)}   ${dim(`${r.done} done, ${r.failed} dropped${r.error ? ` · ${r.error}` : ""}`)}`);
  }
}));

/* fold the seeds back together: the median is the number, the spread is the honesty */
const rows = CAREERS.map((career) => {
  const mine = runs.filter((r) => r.career === career);
  const per = mine.map((r) => r.perMin).sort((a, b) => a - b);
  const mid = (xs) => (xs.length ? xs[Math.floor(xs.length / 2)] : 0);
  const keys = {};
  for (const r of mine) { const k = r.best?.[0]?.key; if (k) keys[k] = (keys[k] ?? 0) + 1; }
  const best = Object.entries(keys).sort((a, b) => b[1] - a[1])[0];
  return {
    career, dept: mine[0]?.dept ?? "?", hull: mine[0]?.hull ?? "?",
    perMin: mid(per), lo: per[0] ?? 0, hi: per[per.length - 1] ?? 0, seeds: mine.length,
    net: Math.round(mine.reduce((a, r) => a + r.net, 0) / Math.max(1, mine.length)),
    crew: Math.round(mine.reduce((a, r) => a + (r.crew ?? 0), 0) / Math.max(1, mine.length) * 10) / 10,
    treasury: Math.round(mine.reduce((a, r) => a + (r.treasury ?? 0), 0) / Math.max(1, mine.length)),
    staff: Math.round(mine.reduce((a, r) => a + (r.staff ?? 0), 0) / Math.max(1, mine.length) * 10) / 10,
    incorporated: mine.filter((r) => r.company).length,
    done: Math.round(mine.reduce((a, r) => a + r.done, 0) / Math.max(1, mine.length)),
    failed: Math.round(mine.reduce((a, r) => a + r.failed, 0) / Math.max(1, mine.length)),
    decisions: Math.round(mine.reduce((a, r) => a + r.decisions, 0) / Math.max(1, mine.length)),
    best: best ? [{ key: best[0], perMin: mid(per), runs: best[1] }] : [],
    error: mine.find((r) => r.error)?.error,
  };
});
if (SEEDS > 1) console.log("");
for (const r of rows) {
  const col = colourFor(r.career);
  const band = SEEDS > 1 ? dim(` [${money(r.lo)}–${money(r.hi)}]`) : "";
  const firm = r.incorporated ? dim(` · ${r.crew} crew, ${r.staff} ashore, ${money(r.treasury)} cr banked`) : dim(` · ${r.crew} crew, no charter`);
  console.log(`  ${paint(col.fg, pad(`▰ ${r.career}`, 17))}${right(`${r.net >= 0 ? "+" : ""}${money(r.net)}`, 10)} cr   ${right(`${money(r.perMin)}/min`, 12)}${band}   ${dim(`${r.done} done, ${r.failed} dropped`)}${firm}  ${dim(r.best?.[0] ? `best: ${r.best[0].key}` : r.error ?? "")}`);
}

/* the market's own ceiling, which is what a career is competing against */
launchSim("BenchMarket", ROOM);
sim.phase = "play";
for (let i = 0; i < 300; i++) tickSim(1 / 60);
sim.ship.credits = CREDITS;
const routes = tradeRoutes({ credits: CREDITS, n: 0 });
const ratios = routes.slice(0, 20).map((r) => r.sell / r.buy);
const market = {
  routes: routes.length,
  bestPerMin: Math.round(routes[0]?.perMin ?? 0),
  medianPerMin: Math.round(routes[Math.floor(routes.length / 2)]?.perMin ?? 0),
  topRatio: Number((ratios[0] ?? 0).toFixed(2)),
  meanRatio: Number((ratios.reduce((a, b) => a + b, 0) / Math.max(1, ratios.length)).toFixed(2)),
  bestProfit: Math.round(routes[0]?.profit ?? 0),
};
const live = rows.filter((r) => !r.error);
const perMins = live.map((r) => r.perMin).sort((a, b) => a - b);
const spread = {
  bestCareer: perMins[perMins.length - 1] ?? 0,
  worstCareer: perMins[0] ?? 0,
  medianCareer: perMins[Math.floor(perMins.length / 2)] ?? 0,
  flewNothing: rows.filter((r) => r.done === 0).map((r) => r.career),
};
spread.routeOverCareer = Number((market.bestPerMin / Math.max(1, spread.medianCareer)).toFixed(2));
spread.bestOverWorst = Number((spread.bestCareer / Math.max(1, spread.worstCareer)).toFixed(2));

const warn = (v, amber, red) => paint(v > red ? 203 : v > amber ? 214 : 78, String(v));
console.log(`\n  ${bold("THE MARKET THEY ARE COMPETING WITH")}`);
console.log(`  ${dim("profitable routes")} ${market.routes}   ${dim("best")} ${money(market.bestPerMin)}/min   ${dim("median")} ${money(market.medianPerMin)}/min   ${dim("best single run")} ${money(market.bestProfit)} cr`);
console.log(`  ${dim("sell ÷ buy, top 20 routes:")} mean ${warn(market.meanRatio, 1.35, 1.6)}×, top ${warn(market.topRatio, 1.6, 2.0)}×`);
console.log(`  ${dim("best route ÷ median career:")} ${warn(spread.routeOverCareer, 1.6, 2.5)}×   ${dim("best career ÷ worst career:")} ${warn(spread.bestOverWorst, 3, 6)}×`);
if (spread.flewNothing.length) console.log(`  ${paint(203, `flew nothing: ${spread.flewNothing.join(", ")}`)}`);
console.log("");

const result = { at: new Date().toISOString(), room: ROOM, minutes: MINUTES, seeds: SEEDS, credits: CREDITS, seed: SEED, rows, runs, market, spread };
if (OUT) { writeFileSync(OUT, JSON.stringify(result, null, 2)); console.log(`  ${dim(`→ ${OUT}`)}\n`); }

if (CMP) {
  const old = JSON.parse(readFileSync(CMP, "utf8"));
  const by = new Map(old.rows.map((r) => [r.career, r]));
  console.log(`  ${bold("AGAINST")} ${dim(CMP)}\n`);
  for (const r of rows) {
    const o = by.get(r.career);
    if (!o) continue;
    const d = r.perMin - o.perMin;
    console.log(`  ${paint(colourFor(r.career).fg, pad(`▰ ${r.career}`, 17))}${right(money(o.perMin), 9)} ${dim("→")} ${right(money(r.perMin), 9)} cr/min   ${paint(d >= 0 ? 78 : 203, `${d >= 0 ? "+" : ""}${money(d)}`)}`);
  }
  const dr = (a, b) => `${a} ${dim("→")} ${b}`;
  console.log(`\n  ${dim("route mean ratio")} ${dr(`${old.market.meanRatio}×`, `${result.market.meanRatio}×`)}   ${dim("best route")} ${dr(money(old.market.bestPerMin), money(result.market.bestPerMin))}/min`);
  console.log(`  ${dim("best route ÷ median career")} ${dr(`${old.spread.routeOverCareer}×`, `${result.spread.routeOverCareer}×`)}   ${dim("best ÷ worst career")} ${dr(`${old.spread.bestOverWorst ?? "—"}×`, `${result.spread.bestOverWorst}×`)}\n`);
}
