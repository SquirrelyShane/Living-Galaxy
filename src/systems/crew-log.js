// Living Galaxy — crew telemetry.
//
// The crew simulation has been detailed since v1.00.30 — morale, fatigue, hunger, thirst,
// injury, willpower, traits, watches — and completely opaque. Every one of those is a live
// number with no history, so a player could watch morale sitting at 0.48 and had no way to
// find out whether it was climbing back from 0.30 or on its way down from 0.90, or what did
// it. "My crew keep quitting" was not a diagnosable complaint.
//
// This file gives the roster a memory of itself, in two parts that answer two different
// questions:
//
//   **samples** — "what has this been doing?" A rolling time series per crew member, taken
//     on a cadence rather than per frame. Enough for a trend and a sparkline; not enough to
//     reconstruct every moment, which nobody needs.
//
//   **events** — "what happened, and why?" Discrete, attributed entries on the shared log
//     channel, so a fall in morale can be lined up against the missed meal that caused it.
//
// Both are bounded. See core/log.js — a session lasting hours on a phone cannot hold an
// unbounded history of sixteen people, and a diagnostic that leaks memory is a bug with a
// nice UI.
//
// ── attribution is the whole point ───────────────────────────────────
// `noteCrew()` takes a *cause*. Recording that morale changed is nearly worthless; recording
// that it changed because the galley ran dry is the thing a player can act on and the thing
// ARIA will need to schedule around. Every mutation site in crew.js that moves a number a
// player cares about calls through here.

import { S } from '../core/state.js';
import { CREWLOG } from '../core/config.js';
import { log, logQuery } from '../core/log.js';

const CH = 'crew';

const store = () => {
  if (!S.crewLog) S.crewLog = { samples: {}, lastSample: -1e9 };
  return S.crewLog;
};

/** The tracked axes, in the order a panel should show them. */
export const TRACKED = ['morale', 'fatigue', 'hunger', 'thirst', 'injury'];

/**
 * Record a discrete thing that happened to somebody, with what caused it.
 *
 * `delta` is optional and signed — a panel can render "morale −0.18 · retraining" without
 * the caller formatting anything, and ARIA can sum causes over a watch to say which one is
 * actually hurting.
 */
export function noteCrew(c, cause, { stat = null, delta = 0, level = 'info', msg = null } = {}) {
  if (!c) return null;
  return log(CH, level, msg || `${c.name}: ${cause}`, {
    id: c.id, name: c.name, cause, stat, delta: +delta.toFixed(4),
    post: c.post || c.role, level: c.level
  });
}

/**
 * Take a sample of everybody, on a cadence.
 *
 * Called from `updateCrew()`. The cadence is the reason this is affordable: sixteen people
 * sampled every few seconds over an hour is a few thousand small records, and sampling per
 * frame would be a hundred times that for a curve nobody could see the difference in.
 */
export function sampleCrew(force = false) {
  const s = store();
  if (!force && S.time - s.lastSample < CREWLOG.sampleEvery) return 0;
  s.lastSample = S.time;

  let n = 0;
  for (const c of (S.crew || [])) {
    const row = s.samples[c.id] || (s.samples[c.id] = []);
    row.push({
      t: S.time,
      morale: +(c.morale ?? 1).toFixed(3),
      fatigue: +(c.fatigue || 0).toFixed(3),
      hunger: +(c.hunger || 0).toFixed(3),
      thirst: +(c.thirst || 0).toFixed(3),
      injury: +(c.injury || 0).toFixed(3),
      duty: c.onDuty !== false
    });
    if (row.length > CREWLOG.samplesPerCrew) row.shift();
    n++;
  }

  // Anybody who left the roster stops being sampled and their history goes with them. A
  // dismissed crewman's curve is not useful and it would otherwise accumulate forever,
  // which is exactly the leak the cap on each row was meant to prevent.
  const live = new Set((S.crew || []).map(c => c.id));
  for (const id of Object.keys(s.samples)) {
    if (!live.has(Number(id))) delete s.samples[id];
  }
  return n;
}

/** The raw series for one crew member, oldest first. */
export const crewSeries = id => (store().samples[id] || []).slice();

/**
 * Trend on one axis: where it is, where it was, and which way it is going.
 *
 * `direction` is quantised against a dead band rather than reported as a raw slope. A number
 * that is technically rising by 0.0001 should read as steady, or every readout flickers
 * between "improving" and "falling" and the player learns to ignore it.
 */
export function crewTrend(id, stat = 'morale', window = CREWLOG.trendWindow) {
  const row = store().samples[id] || [];
  if (!row.length) return { now: null, then: null, delta: 0, direction: 'unknown', samples: 0 };

  const now = row[row.length - 1];
  const cutoff = now.t - window;
  let then = row[0];
  for (const s of row) { if (s.t <= cutoff) then = s; else break; }

  const delta = (now[stat] ?? 0) - (then[stat] ?? 0);
  const dir = Math.abs(delta) < CREWLOG.deadBand ? 'steady' : delta > 0 ? 'rising' : 'falling';
  return { now: now[stat], then: then[stat], delta: +delta.toFixed(3), direction: dir, samples: row.length };
}

/** Every event recorded against one crew member, most recent first. */
export const crewHistory = (id, limit = 20) => logQuery({ channel: CH, subject: id, limit });

/**
 * What is actually dragging somebody down, by cause, over a window.
 *
 * This is the diagnosis. A player asking "why is my gunner miserable" gets *causes ranked by
 * how much they cost*, not a list of everything that happened — which is the difference
 * between a log and an answer.
 */
export function crewDiagnosis(id, stat = 'morale', window = CREWLOG.diagWindow) {
  const since = S.time - window;
  const events = logQuery({ channel: CH, subject: id, since, limit: 200 });
  const causes = {};
  for (const e of events) {
    const d = e.data || {};
    if (d.stat && d.stat !== stat) continue;
    if (!d.cause || !d.delta) continue;
    causes[d.cause] = (causes[d.cause] || 0) + d.delta;
  }
  const ranked = Object.keys(causes)
    .map(k => ({ cause: k, delta: +causes[k].toFixed(3) }))
    .sort((a, b) => a.delta - b.delta);
  return {
    stat,
    trend: crewTrend(id, stat),
    worst: ranked.filter(r => r.delta < 0).slice(0, 4),
    best: ranked.filter(r => r.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 3),
    events: events.length
  };
}

/**
 * The whole roster at a glance, sorted by who needs attention first.
 *
 * "Needs attention" is a single number so the list has an order a player can trust — and it
 * weights *falling* worse than *low*: somebody at 0.4 and climbing is being handled, and
 * somebody at 0.6 in freefall is the one about to become a problem.
 */
export function watchReport() {
  const rows = (S.crew || []).map(c => {
    const morale = crewTrend(c.id, 'morale');
    const fatigue = crewTrend(c.id, 'fatigue');
    const concern =
      (1 - (c.morale ?? 1)) * CREWLOG.weightMorale +
      (c.fatigue || 0) * CREWLOG.weightFatigue +
      (c.injury || 0) * CREWLOG.weightInjury +
      (morale.direction === 'falling' ? CREWLOG.weightFalling : 0) +
      (fatigue.direction === 'rising' ? CREWLOG.weightFalling * 0.5 : 0);
    return {
      id: c.id, name: c.name, post: c.post || c.role, onDuty: c.onDuty !== false,
      morale: c.morale ?? 1, fatigue: c.fatigue || 0, injury: c.injury || 0,
      moraleTrend: morale.direction, fatigueTrend: fatigue.direction,
      concern: +concern.toFixed(3)
    };
  });
  rows.sort((a, b) => b.concern - a.concern);
  return rows;
}

/** Roster-wide numbers, for the header line and for ARIA. */
export function crewVitals() {
  const crew = S.crew || [];
  if (!crew.length) return { count: 0, morale: 1, fatigue: 0, onDuty: 0, atRisk: 0 };
  const avg = k => crew.reduce((s, c) => s + (c[k] ?? (k === 'morale' ? 1 : 0)), 0) / crew.length;
  const rows = watchReport();
  return {
    count: crew.length,
    morale: +avg('morale').toFixed(3),
    fatigue: +avg('fatigue').toFixed(3),
    onDuty: crew.filter(c => c.onDuty !== false).length,
    atRisk: rows.filter(r => r.concern >= CREWLOG.riskAt).length,
    worst: rows[0] || null
  };
}

export const clearCrewLog = () => { S.crewLog = { samples: {}, lastSample: -1e9 }; return true; };
