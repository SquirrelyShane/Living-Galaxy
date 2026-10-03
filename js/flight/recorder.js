import { ariaMind, saveMind, learnTape } from "../aria/mind.js";
export const RECORDER_KEY = "lgaa.tape.v1";

export const TAPE_CAP = 4000;
const SAVE_CAP = 1200;
const SETTLE_SECS = 30;
const SNAP_MIN_GAP = 0.35;

export const recorder = {
  on: true,
  tape: [],
  seq: 0,
  dropped: 0,
  pending: [],
  lastSnap: null,
  lastSnapAt: -1e9,
  wired: false,
  resets: 0,
  session: null,
};

let sampler = null;
let whoNow = () => "player";
let onRecord = null;

export const STATE_KEYS = ["t", "hull", "hold", "cr", "spd", "chg", "dk", "ap", "ms", "hz", "tm", "mm", "ph", "seam", "port", "bus"];

const num = (v, d = 0) => (Number.isFinite(v) ? Math.round(v * 1000) / 1000 : d);

function dropPending() {
  for (const p of recorder.pending) p.r.d = { reset: 1 };
  recorder.pending.length = 0;
}

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

export function settle() {
  if (!recorder.pending.length) return 0;
  const s = snapshot();
  if (!s) return 0;
  let done = 0;
  while (recorder.pending.length && recorder.pending[0].until <= s.t) {
    const p = recorder.pending.shift();
    p.r.d = { cr: num(s.cr - p.cr0), hull: num(s.hull - p.hull0), hold: num(s.hold - p.hold0), dt: num(s.t - p.r.s.t) };
    learnTape(p.r);
    done++;
  }
  return done;
}

export function flushPending() {
  const s = snapshot(true);
  if (!s) { recorder.pending.length = 0; return; }
  for (const p of recorder.pending) {
    p.r.d = { cr: num(s.cr - p.cr0), hull: num(s.hull - p.hull0), hold: num(s.hold - p.hold0), dt: num(s.t - p.r.s.t), partial: 1 };
  }
  recorder.pending.length = 0;
}

export function tape({ by = "player", kind = null, since = null, limit = Infinity } = {}) {
  let out = recorder.tape;
  if (by) out = out.filter((r) => r.by === by);
  if (kind) out = out.filter((r) => r.kind === kind);
  if (since != null) out = out.filter((r) => r.s.t >= since);
  return limit < out.length ? out.slice(out.length - limit) : out.slice();
}

export function tapeJSONL(opts = {}) {
  const head = { v: 1, session: recorder.session, keys: STATE_KEYS, wrote: new Date().toISOString() };
  return [JSON.stringify(head), ...tape({ by: null, ...opts }).map((r) => JSON.stringify(r))].join("\n");
}

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
  return tape({ by, limit: scan })
    .map((r) => ({ r, dist: Object.keys(w).reduce((a, k) => a + w[k] * near(r.s[k], now[k], k), 0) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n);
}

export function saveTape() {
  if (ariaMind.identity) saveMind(ariaMind.identity);
  try {
    const slice = recorder.tape.slice(-SAVE_CAP);
    globalThis.localStorage?.setItem(RECORDER_KEY, JSON.stringify({ v: 1, session: recorder.session, seq: recorder.seq, tape: slice }));
    return slice.length;
  } catch { return 0;}
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
  try { globalThis.localStorage?.removeItem(RECORDER_KEY); } catch {}
}

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
    DOC.addEventListener("visibilitychange", () => { if (DOC.visibilityState === "hidden") { flushPending(); saveTape(); } });
  }
  return recorder;
}

export function resetRecorder() {
  clearTape();
  recorder.resets = 0;
  recorder.lastSnap = null;
  recorder.lastSnapAt = -1e9;
  recorder.session = null;
}

export default recorder;
