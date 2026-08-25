// Living Galaxy — the log.
//
// ── why this did not exist and now has to ────────────────────────────
// Every number in this game is a *snapshot*. Morale is 0.62. Fatigue is 0.31. Nothing
// anywhere records that morale was 0.91 an hour ago and fell during the third watch, or
// that it fell because nobody was fed. So:
//
//   - a player cannot see a trend, only a value
//   - nobody can diagnose a complaint like "my crew keep quitting"
//   - and ARIA cannot schedule anything, because scheduling means reasoning about what
//     happened on the last watch, and the last watch left no trace
//
// A log is therefore not a debugging convenience here. It is the substrate the crew work
// sits on, in the same way `npc-comms.js` was the substrate the social work sat on.
//
// ── shape ────────────────────────────────────────────────────────────
// Structured, not printf. An entry is `{ t, channel, level, msg, data }`, because the
// consumer is a panel and an assistant rather than a human reading a terminal — `data` is
// queryable and a formatted string is not.
//
// ── bounded, always, no exceptions ───────────────────────────────────
// A ring buffer with a hard cap. This runs on a phone in a browser tab that may be open for
// hours, and an unbounded array of every event in a long session is a memory leak wearing a
// feature's clothes. Old entries fall off the back; nothing is ever written to disk, and the
// log is deliberately *not* in the save payload — a diagnostic that survives a reload would
// have to be migrated forever for no gain.

import { S } from './state.js';

export const LOG_LEVELS = ['debug', 'info', 'notice', 'warn', 'error'];
const RANK = { debug: 0, info: 1, notice: 2, warn: 3, error: 4 };

/** Hard cap on entries held. Roughly an hour of ordinary play at typical rates. */
export const LOG_CAP = 600;

const state = () => {
  if (!S.log) S.log = { entries: [], seq: 1, counts: {}, dropped: 0, min: 'info' };
  return S.log;
};

export const logEntries = () => state().entries;

/**
 * Record something.
 *
 * Returns the entry so a caller can attach to it, and null when the level is below the
 * threshold — which is the cheap path, because `debug` is off by default and the argument
 * evaluation is the only cost paid.
 */
export function log(channel, level, msg, data = null) {
  const s = state();
  if ((RANK[level] ?? 1) < (RANK[s.min] ?? 1)) return null;

  const e = { id: s.seq++, t: S.time, channel, level, msg, data };
  s.entries.push(e);
  s.counts[channel] = (s.counts[channel] || 0) + 1;
  if (s.entries.length > LOG_CAP) { s.entries.shift(); s.dropped++; }
  return e;
}

export const logDebug  = (ch, m, d) => log(ch, 'debug', m, d);
export const logInfo   = (ch, m, d) => log(ch, 'info', m, d);
export const logNotice = (ch, m, d) => log(ch, 'notice', m, d);
export const logWarn   = (ch, m, d) => log(ch, 'warn', m, d);
export const logError  = (ch, m, d) => log(ch, 'error', m, d);

/** Raise or lower what gets recorded. `debug` is off by default and costs nothing when off. */
export function setLogLevel(level) {
  if (!LOG_LEVELS.includes(level)) return false;
  state().min = level;
  return true;
}
const logLevel = () => state().min;

/**
 * Query. Every filter is optional and they compose, because the two consumers want
 * different slices: a panel wants "the last 40 things on the crew channel", and ARIA wants
 * "everything at warn or above since the last watch".
 */
export function logQuery({ channel, level, since, subject, limit = 50 } = {}) {
  const min = RANK[level] ?? 0;
  const out = [];
  const list = state().entries;
  for (let i = list.length - 1; i >= 0 && out.length < limit; i--) {
    const e = list[i];
    if (channel && e.channel !== channel) continue;
    if ((RANK[e.level] ?? 1) < min) continue;
    if (since != null && e.t < since) continue;
    if (subject != null && (!e.data || e.data.id !== subject)) continue;
    out.push(e);
  }
  return out;
}

/**
 * A health snapshot rather than a history: what is currently wrong, counted.
 *
 * Deliberately reports the *dropped* count too. A diagnostic that silently discards the
 * thing you were looking for is worse than no diagnostic, so the panel can say "and 1,400
 * older entries have rolled off" rather than implying the log is complete.
 */
export function logDiagnostics() {
  const s = state();
  const byLevel = {};
  const byChannel = {};
  for (const e of s.entries) {
    byLevel[e.level] = (byLevel[e.level] || 0) + 1;
    byChannel[e.channel] = (byChannel[e.channel] || 0) + 1;
  }
  const recent = logQuery({ level: 'warn', limit: 8 });
  return {
    held: s.entries.length, cap: LOG_CAP, dropped: s.dropped,
    level: s.min, byLevel, byChannel,
    problems: recent.map(e => ({ t: e.t, channel: e.channel, msg: e.msg })),
    span: s.entries.length ? { from: s.entries[0].t, to: s.entries[s.entries.length - 1].t } : null
  };
}

export function clearLog() {
  const s = state();
  s.entries.length = 0;
  s.dropped = 0;
  s.counts = {};
  return true;
}
