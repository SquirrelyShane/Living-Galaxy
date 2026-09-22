/* LIVING GALAXY — the tape: what the pilot actually did, and what it got them.
 *
 * ARIA learns from counts today (js/aria.js): you sold at Kessler nine times,
 * so it leans Kessler. That is honest and it is cheap, but it is a tally of
 * CHOICES with no record of the SITUATION the choice was made in, so it can
 * never answer the question a pilot actually wants answered — "what would he
 * have done HERE?" A count says you mine 60% of the time. It cannot say that
 * you mine when the hold is empty and the hull is fine, and that when the hull
 * is under half you break off and go home, which is the thing that separates
 * flying like the pilot from flying like the average of the pilot.
 *
 * So this is a tape of (state, action, outcome) triples — the shape every
 * behaviour-cloning or offline-RL setup wants:
 *
 *   state    a compact numeric read of the ship and the world at the instant
 *            the action was taken. Fixed key order, all plain numbers, so a
 *            row is a feature vector without further work.
 *   action   what was done: a tap with the control's identity, or a semantic
 *            order (throttle, cutter, guns, a mission started, a berth taken).
 *   outcome  what changed over the next while — credits, hull, hold — settled
 *            onto the record after the fact, so a row carries its own reward
 *            signal rather than needing the next row to be diffed against it.
 *
 * Three decisions worth keeping straight:
 *
 *   IT IS A LEAF. No game imports at all. The sampler is handed in at wire
 *   time (`wireRecorder`), which is what lets a node test drive the whole
 *   thing with a fake world and no browser, and means this file can never be
 *   half of an import cycle.
 *
 *   IT LABELS WHO ACTED. Every record carries `by`: "player", "aria" or
 *   "auto". aria.js is emphatic about this and it is right — a core trained on
 *   its own autopilot output converges on its own habits and calls that your
 *   taste. The tape keeps both, because ARIA's own outcomes are useful training
 *   data for ARIA; it just must never be mistaken for yours. Filtering is the
 *   reader's job and `tape({ by: "player" })` is the default.
 *
 *   TAPS ARE CAPTURED IN ONE PLACE. A single capture-phase pointerdown
 *   listener resolves whatever actionable element the touch landed on, rather
 *   than a call added to each of a few hundred handlers. It is passive and it
 *   never consumes the event.
 *
 * The tape is a ring: it never grows without bound and it never needs sweeping.
 */

/** Learned key — about the human at the controls, not the character. Filed in js/profile.js. */
export const RECORDER_KEY = "lgaa.tape.v1";

export const TAPE_CAP = 4000;      // records held in memory
const SAVE_CAP = 1200;             // the newest slice that goes to storage
const SETTLE_SECS = 30;            // how long an action's outcome is watched
const SNAP_MIN_GAP = 0.35;         // reuse a state read younger than this

export const recorder = {
  on: true,
  tape: [],          // the ring, oldest first
  seq: 0,
  dropped: 0,        // rolled off the end
  pending: [],       // records still collecting their outcome
  lastSnap: null,
  lastSnapAt: -1e9,
  wired: false,
  resets: 0,         // times the clock went backwards under us (a sky launch)
  session: null,     // a new id every load, so runs can be told apart
};

let sampler = null;          // () => raw world read
let whoNow = () => "player"; // () => "player" | "aria" | "auto"
let onRecord = null;         // optional hook (aria.js leans on it)

/* ---- the state read ------------------------------------------------------- */

/**
 * The feature vector. Fixed keys, fixed order, numbers only (booleans as 0/1,
 * the few modes as small integers) — a row of this is something you can hand
 * to a model without a schema negotiation. Short names because there are
 * thousands of these and they go to localStorage.
 *
 *   t    sim time            hull  0..1 of max        hold 0..1 of capacity
 *   cr   credits             spd   u/s                chg  battery 0..1
 *   dk   docked (0/1)        ap    autopilot (0/1)    ms   mission step index
 *   hz   hostiles inside 6km tm    turret mode 0..3   mm   cutter mode 0..2
 *   ph   phase               seam  km to the nearest seam (-1 none)
 *   port km to the nearest port (-1 none)             bus  demand / reactor
 */
export const STATE_KEYS = ["t", "hull", "hold", "cr", "spd", "chg", "dk", "ap", "ms", "hz", "tm", "mm", "ph", "seam", "port", "bus"];

const num = (v, d = 0) => (Number.isFinite(v) ? Math.round(v * 1000) / 1000 : d);

/**
 * Records still open when the clock resets. Their window was measured against a
 * time that no longer exists, so they can neither be settled honestly nor left
 * to settle against the new clock — a record whose `until` is 30 s into a sky
 * that has been thrown away would close on the first tick of the next one and
 * report that half a minute produced nothing. They are marked and dropped, and
 * a reader can throw them out: `d.reset` is the flag for "this one's outcome
 * was never observed", which is a different thing from "its outcome was zero".
 */
function dropPending() {
  for (const p of recorder.pending) p.r.d = { reset: 1 };
  recorder.pending.length = 0;
}

/**
 * Read the world, or reuse the last read if it is fresh enough to be the same
 * instant.
 *
 * The clock can go BACKWARDS. `sim.time` is per-sky and starts again at zero
 * when a sky is launched or the pilot goes back to the menu, so after a launch
 * the new time is BELOW the last one seen. Written as `t - lastSnapAt < gap`
 * that test is true for every read until the clock climbs back past where it
 * was, which for a fresh sky is minutes — and for all of those minutes every
 * record would be filed carrying one frozen state from the previous sky.
 * Silently wrong training data is worse than none, so a backwards step is
 * always a fresh read, and it takes the stale open records with it.
 */
export function snapshot(force = false) {
  if (!sampler) return null;
  const raw = sampler();
  if (!raw) return null;
  const t = num(raw.t);
  const back = t < recorder.lastSnapAt - 1e-6;
  if (!force && !back && recorder.lastSnap && t - recorder.lastSnapAt < SNAP_MIN_GAP) return recorder.lastSnap;
  const s = {};
  for (const k of STATE_KEYS) s[k] = num(raw[k], k === "seam" || k === "port" ? -1 : 0);
  recorder.lastSnap = s;
  recorder.lastSnapAt = t;
  if (back) { recorder.resets++; dropPending(); }
  return s;
}

/* ---- recording ------------------------------------------------------------ */

/**
 * File an action.
 *
 *   kind  the family: "tap" | "order" | "nav" | "trade" | "mission" | "life"
 *   act   what it was: a control id, an op name, a mode
 *   arg   whatever names the object of it — a port, an ore, a target
 *
 * → the record, or null when the tape is off or unwired.
 */
export function record(kind, act, arg = null, extra = null) {
  if (!recorder.on || !sampler) return null;
  const s = snapshot();
  if (!s) return null;
  const r = {
    i: ++recorder.seq,
    by: whoNow(),
    kind,
    act: String(act ?? "").slice(0, 48),
    arg: arg == null ? null : String(arg).slice(0, 64),
    s,
    d: null,
  };
  if (extra && typeof extra === "object") r.x = extra;
  recorder.tape.push(r);
  recorder.pending.push({ r, until: s.t + SETTLE_SECS, cr0: s.cr, hull0: s.hull, hold0: s.hold });
  while (recorder.tape.length > TAPE_CAP) { recorder.tape.shift(); recorder.dropped++; }
  onRecord?.(r);
  return r;
}

/**
 * Settle outcomes. Called from the sim tick; cheap — it only looks at records
 * whose window has closed, and the pending list is in time order.
 *
 * The delta is the honest one: what the numbers did over the following window,
 * whatever caused it. Attribution is a modelling problem, not a logging one,
 * and a logger that tries to be clever about it produces data you cannot trust.
 */
export function settle() {
  if (!recorder.pending.length) return 0;
  const s = snapshot();
  if (!s) return 0;
  let done = 0;
  while (recorder.pending.length && recorder.pending[0].until <= s.t) {
    const p = recorder.pending.shift();
    p.r.d = { cr: num(s.cr - p.cr0), hull: num(s.hull - p.hull0), hold: num(s.hold - p.hold0), dt: num(s.t - p.r.s.t) };
    done++;
  }
  return done;
}

/** Close every open record where it stands — on a save, a menu exit, a reload. */
export function flushPending() {
  const s = snapshot(true);
  if (!s) { recorder.pending.length = 0; return; }
  for (const p of recorder.pending) {
    p.r.d = { cr: num(s.cr - p.cr0), hull: num(s.hull - p.hull0), hold: num(s.hold - p.hold0), dt: num(s.t - p.r.s.t), partial: 1 };
  }
  recorder.pending.length = 0;
}

/* ---- reading it back ------------------------------------------------------ */

/** The tape, newest last. `by` defaults to the player's own hands. */
export function tape({ by = "player", kind = null, since = null, limit = Infinity } = {}) {
  let out = recorder.tape;
  if (by) out = out.filter((r) => r.by === by);
  if (kind) out = out.filter((r) => r.kind === kind);
  if (since != null) out = out.filter((r) => r.s.t >= since);
  return limit < out.length ? out.slice(out.length - limit) : out.slice();
}

/** One JSON object per line — what every training pipeline reads without help. */
export function tapeJSONL(opts = {}) {
  const head = { v: 1, session: recorder.session, keys: STATE_KEYS, wrote: new Date().toISOString() };
  return [JSON.stringify(head), ...tape({ by: null, ...opts }).map((r) => JSON.stringify(r))].join("\n");
}

/** What the panel says out loud. */
export function recorderReport() {
  const mine = tape({ by: "player" });
  const hers = tape({ by: "aria" });
  const byKind = {};
  for (const r of mine) byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
  const settled = mine.filter((r) => r.d);
  const earned = settled.reduce((a, r) => a + (r.d.cr > 0 ? r.d.cr : 0), 0);
  const span = mine.length ? mine[mine.length - 1].s.t - mine[0].s.t : 0;
  return {
    on: recorder.on,
    total: recorder.tape.length,
    mine: mine.length,
    aria: hers.length,
    dropped: recorder.dropped,
    pending: recorder.pending.length,
    settled: settled.length,
    byKind,
    earned: Math.round(earned),
    span: Math.round(span),
    top: Object.entries(byKind).sort((a, b) => b[1] - a[1]).slice(0, 5),
  };
}

/**
 * What the pilot tends to do, by kind of action, in situations like this one.
 * A first, honest use of the tape that does not need a model: find the records
 * whose state is nearest to now and report what was done from there.
 *
 * Distance is over the handful of features that actually separate decisions,
 * each scaled to roughly 0..1 so no one of them dominates by unit alone.
 */
export function neighbours(now = snapshot(), n = 12, { by = "player", scan = 1500 } = {}) {
  if (!now) return [];
  const w = { hull: 1.4, hold: 1.4, chg: 0.6, dk: 1.0, hz: 0.8, seam: 0.5, port: 0.5 };
  const near = (a, b, k) => {
    if (k === "seam" || k === "port") {
      const x = a < 0 ? 1 : Math.min(1, a / 400), y = b < 0 ? 1 : Math.min(1, b / 400);
      return Math.abs(x - y);
    }
    if (k === "hz") return Math.abs(Math.min(1, a) - Math.min(1, b));
    return Math.abs(a - b);
  };
  /* Only the newest `scan` records are considered. The ring holds 4,000 and
   * this runs on a phone: sorting all of them to show eight rows is work the
   * pilot pays for in frames, and the older half of a long tape is the pilot
   * they were several refits ago anyway. */
  return tape({ by, limit: scan })
    .map((r) => ({ r, dist: Object.keys(w).reduce((a, k) => a + w[k] * near(r.s[k], now[k], k), 0) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n);
}

/* ---- storage --------------------------------------------------------------- */

export function saveTape() {
  try {
    const slice = recorder.tape.slice(-SAVE_CAP);
    globalThis.localStorage?.setItem(RECORDER_KEY, JSON.stringify({ v: 1, session: recorder.session, seq: recorder.seq, tape: slice }));
    return slice.length;
  } catch { return 0; /* quota or private mode — the tape is best-effort */ }
}

export function loadTape() {
  try {
    const raw = globalThis.localStorage?.getItem(RECORDER_KEY);
    if (!raw) return 0;
    const j = JSON.parse(raw);
    if (!Array.isArray(j?.tape)) return 0;
    recorder.tape = j.tape.slice(-TAPE_CAP);
    recorder.seq = Number(j.seq) || recorder.tape.length;
    return recorder.tape.length;
  } catch { return 0; }
}

export function clearTape() {
  recorder.tape.length = 0;
  recorder.pending.length = 0;
  recorder.dropped = 0;
  recorder.seq = 0;
  try { globalThis.localStorage?.removeItem(RECORDER_KEY); } catch { /* fine */ }
}

/** Hand the pilot the file. Phone-safe: a Blob and an anchor, no server. */
export function downloadTape() {
  const DOC = globalThis.document;
  if (!DOC) return false;
  flushPending();
  const text = tapeJSONL();
  const url = URL.createObjectURL(new Blob([text], { type: "application/x-ndjson" }));
  const a = DOC.createElement("a");
  a.href = url;
  a.download = `adastrum-tape-${recorder.session ?? "run"}.jsonl`;
  DOC.body.appendChild(a);
  a.click();
  a.remove();
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}

/* ---- taps ------------------------------------------------------------------ */

/**
 * What did that touch land on? Walk up for the nearest thing a pilot can press
 * and describe it the way the pilot would recognise it — the control's id when
 * it has one, else its label. The panel it sits in is worth as much as the
 * control: "SELL" means something different on the market deck and the refit
 * yard.
 */
export function describeTarget(node) {
  let el = node;
  for (let i = 0; el && i < 8; i++) {
    const tag = el.tagName?.toLowerCase?.();
    if (tag === "button" || tag === "a" || el.getAttribute?.("role") === "button" || el.classList?.contains?.("tbtn") || el.classList?.contains?.("pick")) {
      const id = el.id || null;
      const label = (el.getAttribute?.("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
      const panel = el.closest?.("[data-panel]")?.getAttribute("data-panel")
        ?? el.closest?.("#map")?.id ?? el.closest?.("#console")?.id ?? el.closest?.("#station-deck")?.id ?? el.closest?.("#hud")?.id ?? null;
      return { act: id || label || tag, arg: id ? label : null, panel };
    }
    el = el.parentElement;
  }
  return null;
}

function onPointerDown(e) {
  if (!recorder.on) return;
  const hit = describeTarget(e.target);
  if (!hit) return;
  record("tap", hit.act, hit.arg, hit.panel ? { p: hit.panel } : null);
}

/* ---- wiring ----------------------------------------------------------------- */

/**
 * `sampler()` returns the raw world read (the STATE_KEYS, unrounded).
 * `who()` returns who is flying right now.
 * `hook(record)` is called for every record, if given.
 */
export function wireRecorder({ sample, who = null, hook = null, captureTaps = true } = {}) {
  sampler = sample ?? null;
  if (who) whoNow = who;
  onRecord = hook ?? null;
  recorder.session ??= `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`;
  if (recorder.wired) return recorder;
  recorder.wired = true;
  loadTape();
  const DOC = globalThis.document;
  if (DOC && captureTaps) {
    DOC.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
    /* A tab that is going away still has a tape worth keeping. */
    DOC.addEventListener("visibilitychange", () => { if (DOC.visibilityState === "hidden") { flushPending(); saveTape(); } });
  }
  return recorder;
}

/** Tests and a fresh run. */
export function resetRecorder() {
  clearTape();
  recorder.resets = 0;
  recorder.lastSnap = null;
  recorder.lastSnapAt = -1e9;
  recorder.session = null;
}

export default recorder;
