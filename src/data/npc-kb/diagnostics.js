// Living Galaxy — high-level diagnostic reports for individual NPCs / managers / board.
//
// These reports are the primary feed ARIA uses when the pilot asks "why did X do that?"
// or "how is my Foreman performing?". They are also the natural unit for a future
// self-training corpus: each report can be turned into (context, question, answer)
// triples without inventing facts.

import { S } from '../../core/state.js';
import { buildProfile } from './profiles.js';
import { validateDiagnostic } from './schema.js';

// The log lives on `S`, not on `globalThis`.
//
// It used to be `globalThis.__LG_DIAG__`, which had two consequences nobody wanted: it was
// absent from the save payload, so every diagnostic a session accumulated was gone on
// reload; and it survived a new game started in the same page load, so a fresh save
// inherited the previous world's record of who did what. Both matter more now that the
// training corpus (./training.js) reads this log as a corpus.
const log = () => (S.npcKb = S.npcKb || { seq: 1, events: [], bySubject: {} });

/**
 * Record a diagnostic event. Returns the event or null if invalid.
 * Kept in a bounded ring so long sessions do not grow without limit.
 */
export function recordDiagnostic(partial) {
  const store = log();
  const d = Object.assign({
    id: `dx-${store.seq++}`,
    t: partial.t != null ? partial.t : 0,
    salience: 0.5,
    tags: []
  }, partial);
  const errs = validateDiagnostic(d);
  if (errs.length) return null;

  store.events.push(d);
  if (store.events.length > 400) store.events.splice(0, store.events.length - 400);

  const list = store.bySubject[d.subjectId] || (store.bySubject[d.subjectId] = []);
  list.push(d);
  if (list.length > 48) list.splice(0, list.length - 48);
  return d;
}

export function diagnosticsFor(subjectId, limit = 12) {
  const list = log().bySubject[subjectId] || [];
  return list.slice(-limit);
}

export function recentDiagnostics(limit = 20) {
  return log().events.slice(-limit);
}

/**
 * Produce a high-level human + machine report for one subject.
 * Suitable for ARIA context injection or the executive ops panel.
 *
 * @param {object} live   live persona / userData / manager record
 * @param {object} [opts]
 * @returns {object} report
 */
export function diagnose(live, opts = {}) {
  const profile = buildProfile(live, opts.overrides || {});
  const events = diagnosticsFor(profile.id, opts.eventLimit || 8);

  const traitSummary = summariseTraits(profile.traits);
  const recent = events.map(e => ({
    t: e.t,
    kind: e.kind,
    situation: e.situation,
    summary: e.summary,
    outcome: e.outcome || null,
    salience: e.salience
  }));

  const alerts = [];
  const perf = profile.performance || {};
  const thresholds = perf.alertThresholds || {};
  for (const [k, v] of Object.entries(thresholds)) {
    const cur = perf[k];
    if (typeof cur === 'number' && typeof v === 'number') {
      if (k.toLowerCase().includes('delta') || k.toLowerCase().includes('confidence')) {
        if (cur < v) alerts.push(`${k} at ${cur.toFixed(2)} (threshold ${v})`);
      } else if (cur >= v) {
        alerts.push(`${k} at ${cur} (threshold ${v})`);
      }
    }
  }

  return {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    faction: profile.faction,
    archetype: profile.archetype,
    voice: profile.voice,
    traitSummary,
    traits: profile.traits,
    heuristics: profile.heuristics,
    loyalties: profile.loyalties,
    softSpots: profile.softSpots,
    redLines: profile.redLines,
    speechPatterns: profile.speechPatterns,
    recentEvents: recent,
    alerts,
    diagnosticTags: profile.diagnosticTags,
    // Compact paragraph ARIA can drop into a reply without further processing.
    brief: buildBriefParagraph(profile, recent, alerts)
  };
}

function summariseTraits(t) {
  if (!t) return 'unknown temperament';
  const parts = [];
  if (t.aggression > 0.6) parts.push('aggressive');
  else if (t.aggression < 0.25) parts.push('restrained');
  if (t.sociability > 0.6) parts.push('talkative');
  else if (t.sociability < 0.3) parts.push('taciturn');
  if (t.greed > 0.6) parts.push('self-interested');
  if (t.loyalty > 0.65) parts.push('loyal');
  else if (t.loyalty < 0.25) parts.push('unattached');
  if (t.formality > 0.65) parts.push('formal');
  else if (t.formality < 0.25) parts.push('colloquial');
  if (t.verbosity > 0.65) parts.push('verbose');
  else if (t.verbosity < 0.3) parts.push('terse');
  return parts.length ? parts.join(', ') : 'balanced';
}

function buildBriefParagraph(profile, recent, alerts) {
  const lines = [];
  lines.push(`${profile.name} (${profile.role}, ${profile.faction}) — ${summariseTraits(profile.traits)}.`);
  if (profile.heuristics && profile.heuristics[0]) {
    lines.push(`Primary heuristic: ${profile.heuristics[0]}`);
  }
  if (recent.length) {
    const last = recent[recent.length - 1];
    lines.push(`Latest: ${last.summary}${last.outcome ? ' → ' + last.outcome : ''}.`);
  }
  if (alerts.length) lines.push(`Alerts: ${alerts.join('; ')}.`);
  return lines.join(' ');
}

/**
 * Convenience: record a manager policy fire as a diagnostic.
 */
export function recordManagerDecision(managerId, policy, context, outcome, t) {
  return recordDiagnostic({
    subjectId: managerId,
    t: t || 0,
    kind: 'manager',
    situation: `policy:${policy}`,
    summary: `${managerId} applied ${policy}`,
    context: context || {},
    policiesFired: [policy],
    outcome: outcome || null,
    salience: 0.6,
    tags: ['manager', policy]
  });
}

/**
 * Convenience: record an NPC dialogue exchange for training / later brief.
 */
export function recordDialogue(subjectId, situation, summary, traitsAt, memoriesCited, t) {
  return recordDiagnostic({
    subjectId,
    t: t || 0,
    kind: 'dialogue',
    situation,
    summary,
    traitsAt: traitsAt || null,
    memoriesCited: memoriesCited || [],
    salience: 0.45,
    tags: ['dialogue', situation]
  });
}

/**
 * Board-level diagnostic for the executive company view.
 */
export function diagnoseBoard(company, boardSeats = []) {
  if (!company || !company.founded) return null;
  const conf = company.confidence != null ? company.confidence : 0.5;
  const total = (company.inCharter || 0) + (company.outCharter || 0);
  const focus = total > 0 ? company.inCharter / total : 0.6;

  const seats = boardSeats.map(s => ({
    key: s.key,
    name: s.name,
    role: s.role,
    wants: s.wants,
    line: s.line
  }));

  const alerts = [];
  if (conf < 0.35) alerts.push('Board confidence critically low');
  if (company.treasury < 5000) alerts.push('Treasury near floor');
  if (focus < 0.4) alerts.push('Activity drifting outside charter');

  return {
    id: 'board:' + (company.name || 'company'),
    name: company.name,
    charter: company.charter,
    treasury: company.treasury,
    confidence: conf,
    focus,
    revenue: company.revenue,
    spend: company.spend,
    managers: company.managers,
    seats,
    alerts,
    brief: `${company.name} (${company.charter} charter). Confidence ${(conf * 100).toFixed(0)}%, ` +
           `treasury ${Math.round(company.treasury)}, in-charter focus ${(focus * 100).toFixed(0)}%.` +
           (alerts.length ? ' Alerts: ' + alerts.join('; ') + '.' : '')
  };
}

// ── persistence ──────────────────────────────────────────────────────
// Bounded on the way out as well as on the way in: a save should not carry 400 events
// when the last 160 are the ones anything reads, and the training corpus prefers salient
// events over merely recent ones.

export function serializeDiagnostics() {
  const store = log();
  const keep = store.events.slice(-160);
  return { seq: store.seq || 1, events: keep };
}

export function restoreDiagnostics(data) {
  const events = (data && Array.isArray(data.events) ? data.events : [])
    .filter(d => validateDiagnostic(d).length === 0);
  const bySubject = {};
  for (const d of events) (bySubject[d.subjectId] || (bySubject[d.subjectId] = [])).push(d);
  for (const k of Object.keys(bySubject)) {
    const l = bySubject[k];
    if (l.length > 48) l.splice(0, l.length - 48);
  }
  let seq = (data && data.seq) || 1;
  for (const d of events) {
    const m = /^dx-(\d+)$/.exec(d.id || '');
    if (m) seq = Math.max(seq, parseInt(m[1], 10) + 1);
  }
  S.npcKb = { seq, events, bySubject };
  return true;
}

/** Wipe the log. Called when a new game starts in a page that already ran one. */
export function resetDiagnostics() {
  S.npcKb = { seq: 1, events: [], bySubject: {} };
}
