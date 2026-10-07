import { flushPending } from "../flight/recorder.js";
import { ariaMind, resetMind, saveMind, loadMind, mindKey, bindPeopleLookup, explanationPacket, bindPacketExtras, calibReport } from "./mind.js";
import { wakeSave, wakeLoad, wakeReset } from "./wake.js";
import { footprintReport, footprintLine } from "./footprint.js";
import { beliefReport } from "./belief.js";
import { perceive } from "./senses.js";
import { entryOf } from "../corp/gdb.js";
import { sim, logEvent } from "../sim/sim.js";
import { captain, houseBrain, retakeCommand, ariaHooks } from "../npc/captain.js";
import { post } from "../comms/chat.js";
import { beginAriaWatch, endAriaWatch, tickAriaPilot, wireAriaPilot, bindAriaPrefs, notePlayLabel, notePlayerJob, ariaPilot, jobHabits, planJob } from "./pilot.js";

const KEY = () => `lgaa.aria.v1:${sim.skySeed}:${sim.callsign}`;
const SAVE_EVERY = 20;

export const aria = {
  prefs: ariaMind.prefs,
  advice: {},
  conn: { held: false, since: 0, decisions: 0, earned: 0, hullAt: 100, log: [] },
  dirty: 0,
};

export function resetAria() {
  resetMind(mindKey(sim.skySeed, sim.callsign));
  aria.prefs = ariaMind.prefs;
  bindAriaPrefs(aria.prefs);
  aria.advice = {};
  aria.conn = { held: false, since: 0, decisions: 0, earned: 0, hullAt: 100, log: [] };
  wakeReset();
}

export const handsOff = () => Boolean(sim.handsOff) || captain.holder !== "player";

export function notePlayerChoice(kind, key, weight = 1) {
  if (!key || !aria.prefs[kind]) return;
  const bag = aria.prefs[kind];
  bag[key] ??= { n: 0, last: 0 };
  bag[key].n += weight;
  bag[key].last = sim.time ?? 0;
  if (++aria.dirty >= SAVE_EVERY) saveAria();
}

export function preferenceFor(kind, key) {
  const bag = aria.prefs[kind];
  if (!bag || !key) return 1;
  const mine = bag[key]?.n ?? 0;
  if (!mine) return 1;
  const total = Object.values(bag).reduce((a, v) => a + v.n, 0) || 1;
  const share = mine / total;
  const confidence = Math.min(1, total / 12);
  return 1 + (share - 1 / Math.max(1, Object.keys(bag).length)) * 0.9 * confidence;
}

export function preferenceReport(kind) {
  const bag = aria.prefs[kind] ?? {};
  const total = Object.values(bag).reduce((a, v) => a + v.n, 0) || 1;
  return Object.entries(bag)
    .map(([key, v]) => ({ key, n: Math.round(v.n), share: v.n / total, lean: preferenceFor(kind, key) }))
    .sort((a, b) => b.n - a.n);
}

const MUTE_AT = 4;

function adv(kind) {
  aria.advice[kind] ??= { shown: 0, acted: 0, ignored: 0, streak: 0, muted: false };
  return aria.advice[kind];
}

export function shouldAdvise(kind) {
  return !adv(kind).muted;
}

export function noteAdvice(kind) {
  const a = adv(kind);
  a.shown++;
  return a;
}

export function answerAdvice(kind, acted) {
  const a = adv(kind);
  if (acted) { a.acted++; a.streak = 0; a.muted = false; }
  else { a.ignored++; a.streak++; if (a.streak >= MUTE_AT) a.muted = true; }
  if (++aria.dirty >= SAVE_EVERY) saveAria();
  return a;
}

export function adviceReport() {
  return Object.entries(aria.advice).map(([kind, a]) => ({
    kind, ...a, rate: a.shown ? a.acted / a.shown : 0,
  })).sort((x, y) => y.shown - x.shown);
}

function ariaMember() {
  return {
    id: "aria", name: "ARIA", title: "Assistant core", robot: false, synthetic: true,
    complexName: "Ship's core", letter: "—", morale: 100, trust: 100,
    traits: { grit: 0.6, caution: 0.6, greed: 0.5, loyalty: 1, curiosity: 0.6 },
  };
}

export const ariaHasConn = () => captain.holder === "aria";

export function ariaTakeConn() {
  if (captain.holder === "aria") return { ok: false, error: "ARIA already has the conn." };
  if (captain.holder !== "player") return { ok: false, error: `${captain.member?.name ?? "The conn"} has the ship — take it back first.` };
  const brain = houseBrain();
  captain.holder = "aria";
  captain.member = ariaMember();
  captain.brain = brain;
  captain.goal = null;
  captain.decision = null;
  captain.lastThink = 0;
  aria.conn = { held: true, since: sim.time, decisions: 0, earned: 0, hullAt: sim.ship?.hull ?? 100, log: [] };
  beginAriaWatch();
  const seen = brain.steps ?? 0;
  const habits = jobHabits();
  sim.notice = `ARIA has the conn — ${habits.total >= 3 ? `flying your jobs off ${Math.round(habits.total)} of your own` : "not much of you to go on yet"}. Touch the stick to take it back.`;
  post({ channel: "local", from: "ARIA", text: `I have the conn. I will work the ship the way you do; where I do not know what you would do, I will tell you.`, tone: "neutral" });
  logEvent(`ARIA took the conn (${seen} observations)`, "nav");
  return { ok: true, observations: seen };
}

export function ariaRelease() {
  if (captain.holder !== "aria") return { ok: false, error: "ARIA does not have the conn." };
  const held = Math.round(sim.time - aria.conn.since);
  aria.conn.held = false;
  endAriaWatch();
  const r = retakeCommand();
  saveAria();
  post({ channel: "local", from: "ARIA", text: `You have the conn. ${aria.conn.decisions} decisions over ${held}s${aria.conn.earned ? `, ${Math.round(aria.conn.earned)} cr` : ""}. I kept the trace.`, tone: "neutral" });
  return { ok: r.ok !== false, held, decisions: aria.conn.decisions };
}

export function ariaNoteDecision(action, rationale) {
  if (!ariaHasConn()) return;
  aria.conn.decisions++;
  aria.conn.log.unshift({ at: sim.time, action, rationale });
  if (aria.conn.log.length > 24) aria.conn.log.length = 24;
}

export function ariaWatchReport() {
  const brain = houseBrain();
  return {
    flying: ariaHasConn(),
    observations: brain.steps ?? 0,
    outcomes: brain.outcomes ?? 0,
    decisions: aria.conn.decisions,
    heldFor: aria.conn.held ? Math.round(sim.time - aria.conn.since) : 0,
    earned: Math.round(aria.conn.earned),
    log: aria.conn.log.slice(0, 8),
    job: ariaPilot.job,
    why: ariaPilot.why,
    jobs: ariaPilot.jobs,
    habits: jobHabits(),
    scene: ariaMind.scene,
    shift: ariaMind.shift,
    wake: footprintLine(),
    calibration: calibReport(),
  };
}

export function saveAria() {
  aria.dirty = 0;
  wakeSave();
  saveMind(mindKey(sim.skySeed, sim.callsign));
  try {
    globalThis.localStorage?.setItem(KEY(), JSON.stringify({ prefs: aria.prefs, advice: aria.advice }));
  } catch {}
}

export function loadAria() {
  const loaded = loadMind(mindKey(sim.skySeed, sim.callsign));
  wakeLoad();
  aria.prefs = ariaMind.prefs;
  bindAriaPrefs(aria.prefs);
  try {
    const raw = globalThis.localStorage?.getItem(KEY());
    if (!raw) return loaded;
    const o = JSON.parse(raw);
    if (!loaded && o?.prefs) { Object.assign(ariaMind.prefs, o.prefs); aria.prefs = ariaMind.prefs; bindAriaPrefs(aria.prefs); }
    if (o?.advice) aria.advice = o.advice;
    return true;
  } catch { return false; }
}

export function wireAriaHooks() {
  ariaHooks.onBeforeLaunch = () => { flushPending(); saveAria(); };
  ariaHooks.onLaunch = () => { loadAria(); aria.lastMindSave = -1e9; };
  ariaHooks.onDecision = (action, rationale) => ariaNoteDecision(action, rationale);
  wireAriaPilot(aria, (text) => post({ channel: "local", from: "ARIA", text, tone: "neutral" }));
  ariaHooks.pilot = () => {
    const earned = tickAriaPilot();
    if (sim.time - (aria.lastMindSave ?? -1e9) >= 20) { aria.lastMindSave = sim.time; saveAria(); }
    aria.conn.earned = earned;
    if (ariaPilot.job && aria.conn.log[0]?.action !== ariaPilot.job) ariaNoteDecision(ariaPilot.job, ariaPilot.why);
  };
  ariaHooks.onPlayLabel = (label) => notePlayLabel(label);
  ariaHooks.onPlayerJob = (job, w) => { if (job && captain.holder === "player") notePlayerJob(job, w); };
  ariaHooks.onStick = () => { if (ariaHasConn()) { ariaRelease(); sim.notice = "You have the stick — ARIA stood down."; } };
}

export function wireAria() {
  bindPeopleLookup(entryOf);
  bindPacketExtras(() => {
    const w = footprintReport();
    return { wake: { line: footprintLine(), totals: w.totals, lines: w.lines, ports: w.ports.slice(0, 3), corps: w.corps.slice(0, 3), recent: w.events.slice(0, 4) } };
  });
  wireAriaHooks();
  if (globalThis.window?.__lg) {
    window.__lg.aria = { ariaMind, explanationPacket, perceive, footprintReport, beliefReport, calibReport, aria, ariaTakeConn, ariaRelease, ariaHasConn, ariaWatchReport, preferenceFor, preferenceReport, notePlayerChoice, adviceReport, shouldAdvise, answerAdvice, ariaPilot, planJob, notePlayerJob };
  }
}
