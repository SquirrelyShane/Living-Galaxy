/* LIVING GALAXY — ARIA: the conn that learned from you.
 *
 * There has been a net in this game earlier — js/npc/brain.js — and a "house
 * core" that quietly watches how you fly whenever nobody else holds the conn
 * (captain.js, one imitation label every five seconds). It was only ever used
 * to seed NPC captains. It never flew your ship and it never touched your
 * autopilot, so the thing it learned went nowhere you could see.
 *
 * Three things here, all fed by the same idea — what you DO is the training
 * data, not what you say:
 *
 *   1. PREFERENCES. Every time you choose one port to sell at over the two
 *      that were closer, or cut a chromite rock and leave the silicate next to
 *      it, that is a labelled example. The autopilot's own scoring asks here
 *      before it picks, so it converges on your habits rather than on a
 *      formula. Counts, not a net: a tally is honest about how much it has
 *      seen, which a net is not, and "you have done this nine times" is
 *      something the panel can say out loud.
 *
 *   2. ADVISORIES. The assistant learns which kinds of advice you act on and
 *      which you swipe away, and stops surfacing the ones you ignore. Ignoring
 *      a kind four times running buries it; acting on it once digs it back up.
 *
 *   3. THE CONN. ARIA can take the ship the way a crew captain can, except
 *      the core it flies with is the one that has been watching you — so it
 *      flies the way you fly. It then trains on its OWN outcomes through the
 *      same learnOutcome path the NPC captains use, which means a long ARIA
 *      watch makes it better at being you than you were when it started.
 */

import { sim, logEvent } from "./sim.js";
import { captain, houseBrain, retakeCommand, ariaHooks } from "./npc/captain.js";
import { post } from "./chat.js";
import { beginAriaWatch, endAriaWatch, tickAriaPilot, wireAriaPilot, bindAriaPrefs, notePlayLabel, notePlayerJob, ariaPilot, jobHabits, planJob } from "./aria-pilot.js";

const KEY = () => `lgaa.aria.v1:${sim.skySeed}:${sim.callsign}`;
const SAVE_EVERY = 20;

export const aria = {
  /* kind → key → { n, last } : how often you chose this, and when */
  prefs: { port: {}, ore: {}, plan: {}, lane: {}, job: {} },
  /* advisory kind → { shown, acted, ignored, muted } */
  advice: {},
  /* ARIA's own watch */
  conn: { held: false, since: 0, decisions: 0, earned: 0, hullAt: 100, log: [] },
  dirty: 0,
};

export function resetAria() {
  aria.prefs = { port: {}, ore: {}, plan: {}, lane: {}, job: {} };
  bindAriaPrefs(aria.prefs);
  aria.advice = {};
  aria.conn = { held: false, since: 0, decisions: 0, earned: 0, hullAt: 100, log: [] };
}

/**
 * Is somebody other than the pilot flying?
 *
 * turrets.js is a leaf and must not import sim.js, so the flag lives on `sim`
 * and is read through here — the autopilot sets it every tick, and an NPC or
 * ARIA holding the conn sets it too. Nothing learns from a choice the player
 * did not make; a core trained on its own autopilot output converges on its
 * own habits and calls that your taste.
 */
export const handsOff = () => Boolean(sim.handsOff) || captain.holder !== "player";

/* ---- 1. preferences --------------------------------------------------------- */

/**
 * You did a thing. `kind` is the family of choice ("port", "ore", "plan"),
 * `key` the option you took, `weight` how much of a choice it was — selling a
 * full hold says more than dropping two units.
 */
export function notePlayerChoice(kind, key, weight = 1) {
  if (!key || !aria.prefs[kind]) return;
  const bag = aria.prefs[kind];
  bag[key] ??= { n: 0, last: 0 };
  bag[key].n += weight;
  bag[key].last = sim.time ?? 0;
  if (++aria.dirty >= SAVE_EVERY) saveAria();
}

/**
 * How much the autopilot should lean toward `key`, 0.75 … 1.45.
 *
 * Deliberately gentle. A preference is a thumb on the scale, not a rule: an
 * autopilot that only ever went where you had been before would never find you
 * the better price, and the whole point of the thing is that it flies while you
 * are doing something else.
 */
export function preferenceFor(kind, key) {
  const bag = aria.prefs[kind];
  if (!bag || !key) return 1;
  const mine = bag[key]?.n ?? 0;
  if (!mine) return 1;
  const total = Object.values(bag).reduce((a, v) => a + v.n, 0) || 1;
  const share = mine / total;
  const confidence = Math.min(1, total / 12);       // it has to have seen enough
  return 1 + (share - 1 / Math.max(1, Object.keys(bag).length)) * 0.9 * confidence;
}

/** What it thinks it knows, for the panel. */
export function preferenceReport(kind) {
  const bag = aria.prefs[kind] ?? {};
  const total = Object.values(bag).reduce((a, v) => a + v.n, 0) || 1;
  return Object.entries(bag)
    .map(([key, v]) => ({ key, n: Math.round(v.n), share: v.n / total, lean: preferenceFor(kind, key) }))
    .sort((a, b) => b.n - a.n);
}

/* ---- 2. advisories ---------------------------------------------------------- */

const MUTE_AT = 4;          // ignored this many times running and it stops asking

function adv(kind) {
  aria.advice[kind] ??= { shown: 0, acted: 0, ignored: 0, streak: 0, muted: false };
  return aria.advice[kind];
}

/** Should the assistant raise this kind of thing at all? */
export function shouldAdvise(kind) {
  return !adv(kind).muted;
}

/** It raised one. */
export function noteAdvice(kind) {
  const a = adv(kind);
  a.shown++;
  return a;
}

/**
 * You acted on it, or you did not. Acting on a kind once un-mutes it — people
 * change what they care about, and a core that learned "never mention the
 * battery" in an hour of belt work should not keep that forever.
 */
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

/* ---- 3. the conn ------------------------------------------------------------- */

/**
 * The synthetic who holds the conn.
 *
 * Not a crew member: ARIA has no berth, no wage and no morale, and giving it
 * one would put it on the crew ladder where it does not belong. It carries the
 * shape captain.js expects and nothing else.
 */
function ariaMember() {
  return {
    id: "aria", name: "ARIA", title: "Assistant core", robot: false, synthetic: true,
    complexName: "Ship's core", letter: "—", morale: 100, trust: 100,
    traits: { grit: 0.6, caution: 0.6, greed: 0.5, loyalty: 1, curiosity: 0.6 },
  };
}

/** Is ARIA flying? */
export const ariaHasConn = () => captain.holder === "aria";

/**
 * Hand ARIA the ship.
 *
 * It flies with the HOUSE CORE — the net that has been watching you fly since
 * the first time you took the stick — rather than with a personality of its
 * own. That is the whole point: an NPC captain flies like themselves, and ARIA
 * flies like you.
 */
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

/**
 * Called from tickCaptain while ARIA flies: book what its watch has produced,
 * so the panel can say whether letting it fly was worth it. The LEARNING is
 * already happening — captain.js scores every decision against what the hull,
 * the credits and the hold did next, and writes it into the same core.
 */
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
  };
}

/* ---- persistence -------------------------------------------------------------- */

export function saveAria() {
  aria.dirty = 0;
  try {
    globalThis.localStorage?.setItem(KEY(), JSON.stringify({ prefs: aria.prefs, advice: aria.advice }));
  } catch { /* quota, or no window */ }
}

export function loadAria() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY());
    if (!raw) return false;
    const o = JSON.parse(raw);
    if (o?.prefs) { aria.prefs = { port: {}, ore: {}, plan: {}, lane: {}, job: {}, ...o.prefs }; bindAriaPrefs(aria.prefs); }
    if (o?.advice) aria.advice = o.advice;
    return true;
  } catch { return false; }
}

/* This used to be a bare top-level assignment:
 *
 *     ariaHooks.onDecision = (action, rationale) => ariaNoteDecision(…);
 *
 * `ariaHooks` is an `export const` of js/npc/captain.js, and aria.js and
 * captain.js are in an import cycle (aria → captain → turrets → aria). A
 * top-level READ of a binding from a module that is still initialising is a
 * TDZ error, and whether it happens depends entirely on which side of the
 * cycle the loader enters first — today that is turrets.js, so aria.js is
 * already in progress when captain.js starts and the assignment is fine.
 *
 * It is fine BY ACCIDENT. Give any module that evaluates earlier than
 * turrets.js an import of npc/captain.js and the order flips: captain.js goes
 * first, aria.js runs to completion inside it, and the line throws
 * `ReferenceError: Cannot access 'ariaHooks' before initialization` at page
 * load — a white screen, with no game and nothing in the log that points here.
 *
 * So the wiring moves into a function, which is the pattern js/upgrades.js,
 * js/family.js, js/npc/battles.js and js/fleet.js all already use. main.js
 * calls it after the graph has finished loading, when nothing is in TDZ. */
export function wireAriaHooks() {
  ariaHooks.onDecision = (action, rationale) => ariaNoteDecision(action, rationale);
  wireAriaPilot(aria, (text) => post({ channel: "local", from: "ARIA", text, tone: "neutral" }));
  ariaHooks.pilot = () => {
    const earned = tickAriaPilot();
    aria.conn.earned = earned;
    if (ariaPilot.job && aria.conn.log[0]?.action !== ariaPilot.job) ariaNoteDecision(ariaPilot.job, ariaPilot.why);
  };
  ariaHooks.onPlayLabel = (label) => notePlayLabel(label);
  ariaHooks.onPlayerJob = (job, w) => { if (job && captain.holder === "player") notePlayerJob(job, w); };
  ariaHooks.onStick = () => { if (ariaHasConn()) { ariaRelease(); sim.notice = "You have the stick — ARIA stood down."; } };
}

export function wireAria() {
  wireAriaHooks();
  if (globalThis.window?.__lg) {
    window.__lg.aria = { aria, ariaTakeConn, ariaRelease, ariaHasConn, ariaWatchReport, preferenceFor, preferenceReport, notePlayerChoice, adviceReport, shouldAdvise, answerAdvice, ariaPilot, planJob, notePlayerJob };
  }
}
