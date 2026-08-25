// Living Galaxy — the self-training loop.
//
// `training-corpus.js` holds hand-written seed examples: known-good (input → expected)
// pairs, written by a person, that describe how a character should behave. This file is
// the other half — it turns what characters *actually did*, as recorded in the diagnostic
// log, into examples of the same shape, and merges the two into a batch ARIA can put in
// front of a model as few-shot context.
//
// The loop that closes here: `recordDiagnostic()` files what happened → `harvest()` turns
// salient events into examples → `buildBatch()` picks the best few for a purpose →
// `fewShotBlock()` renders them as prompt text → the assistant injects that block →
// characters behave more like the record and less like a blank model. The log persists
// with the save (schema 17), so the corpus survives the session that produced it.
//
// Two rules keep this from poisoning itself:
//
//   1. **Seeds outrank harvest.** A hand-written example is worth more than an observed
//      one, always, because the observed one is only evidence that something happened —
//      not that it was right. Harvested quality is capped below the seed floor.
//   2. **Nothing invents facts.** An example is assembled from fields the diagnostic
//      already carries. If the event does not say what the situation was, it does not
//      become an example.

import { S } from '../../core/state.js';
import { TRAINING_PURPOSES } from './schema.js';
import { TRAINING_SEED, examplesByPurpose } from './training-corpus.js';
import { recentDiagnostics } from './diagnostics.js';

/** Ceiling on a harvested example's quality. Every hand-written seed sits above this. */
export const HARVEST_QUALITY_CAP = 0.62;

/** Diagnostic kind → the training purpose an example built from it serves. */
const KIND_PURPOSE = {
  dialogue: 'dialogue',
  decision: 'decision',
  order: 'command',
  manager: 'decision',
  board: 'brief',
  performance: 'diagnostic',
  incident: 'diagnostic',
  contract: 'command'
};

/**
 * Turn one diagnostic into a training example, or null if it does not carry enough to
 * make one honestly.
 */
export function exampleFrom(d) {
  if (!d || !d.situation || !d.summary) return null;
  const purpose = KIND_PURPOSE[d.kind];
  if (!purpose || !TRAINING_PURPOSES.includes(purpose)) return null;

  // Salience is the only signal the log carries about whether an event mattered. Scale it
  // into the harvest band rather than trusting it as a quality score in its own right.
  const quality = Math.min(HARVEST_QUALITY_CAP,
                           0.25 + Math.max(0, Math.min(1, d.salience == null ? 0.5 : d.salience)) * 0.4);

  return {
    id: `hv-${d.id}`,
    purpose,
    quality: Math.round(quality * 100) / 100,
    harvested: true,
    t: d.t || 0,
    tags: ['harvest', d.kind].concat(Array.isArray(d.tags) ? d.tags.filter(Boolean) : []),
    input: {
      situation: d.situation,
      subject: d.subjectId || null,
      context: d.context || {}
    },
    expected: {
      example: d.summary,
      replyStyle: 'match the recorded outcome; do not add facts the record does not carry'
    }
  };
}

/**
 * Harvest the diagnostic log into examples, newest first, deduplicated by summary.
 *
 * Deduplication matters more than it looks: a patrol dispatched twenty times produces
 * twenty near-identical events, and a few-shot block made of the same sentence twenty
 * times teaches a model to repeat that sentence.
 */
export function harvest(opts = {}) {
  const window = opts.window || 160;
  const minSalience = opts.minSalience != null ? opts.minSalience : 0.3;
  const seen = new Set();
  const out = [];

  const events = recentDiagnostics(window).slice().reverse();
  for (const d of events) {
    if ((d.salience == null ? 0.5 : d.salience) < minSalience) continue;
    const ex = exampleFrom(d);
    if (!ex) continue;
    const key = ex.purpose + '|' + String(ex.expected.example).slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ex);
    if (opts.limit && out.length >= opts.limit) break;
  }
  return out;
}

/**
 * A few-shot batch for one purpose: the best seeds, then the best harvested examples,
 * capped at `size`.
 *
 * Seeds first is not a tie-break, it is the ordering. A model reading the block sees the
 * written-down standard before it sees the observed record.
 */
export function buildBatch(purpose, opts = {}) {
  const size = opts.size || 6;
  const seeds = examplesByPurpose(purpose)
    .slice()
    .sort((a, b) => (b.quality || 0) - (a.quality || 0));

  const observed = harvest({ limit: 60, minSalience: opts.minSalience })
    .filter(e => e.purpose === purpose)
    .sort((a, b) => (b.quality || 0) - (a.quality || 0) || (b.t || 0) - (a.t || 0));

  const picked = seeds.slice(0, Math.max(1, Math.ceil(size / 2)));
  for (const e of observed) {
    if (picked.length >= size) break;
    picked.push(e);
  }
  // If the log had nothing, fall back to more seeds rather than returning a short batch.
  for (const e of seeds.slice(picked.length)) {
    if (picked.length >= size) break;
    if (!picked.includes(e)) picked.push(e);
  }

  return {
    purpose,
    size: picked.length,
    seeds: picked.filter(e => !e.harvested).length,
    harvested: picked.filter(e => e.harvested).length,
    examples: picked
  };
}

/**
 * Render a batch as prompt text.
 *
 * Deliberately plain: labelled lines, no JSON, no markdown. The tier-3 model is a 360M
 * parameter model on a phone, and structure it has to parse is structure it gets wrong.
 */
export function fewShotBlock(purpose, opts = {}) {
  const batch = buildBatch(purpose, opts);
  if (!batch.examples.length) return '';
  const lines = [`Examples of good ${purpose}:`];
  for (const e of batch.examples) {
    const sit = (e.input && (e.input.situation || e.input.subject)) || purpose;
    const say = (e.expected && (e.expected.example || e.expected.replyStyle)) || '';
    if (!say) continue;
    lines.push(`- ${sit}: ${String(say).slice(0, 160)}`);
  }
  return lines.join('\n');
}

/**
 * What the loop has to work with right now. Used by the Ops panel and by ARIA's own
 * "how are you learning?" answer, so the pilot can see the corpus grow rather than being
 * told it exists.
 */
export function trainingStatus() {
  const observed = harvest({ limit: 400 });
  const byPurpose = {};
  for (const p of TRAINING_PURPOSES) {
    byPurpose[p] = {
      seeds: examplesByPurpose(p).length,
      harvested: observed.filter(e => e.purpose === p).length
    };
  }
  return {
    events: ((S.npcKb && S.npcKb.events) || []).length,
    seeds: TRAINING_SEED.length,
    harvested: observed.length,
    purposes: byPurpose,
    cap: HARVEST_QUALITY_CAP
  };
}

/** One line for ARIA. */
export function trainingBrief() {
  const t = trainingStatus();
  return `${t.seeds} written examples, ${t.harvested} harvested from ${t.events} recorded events. ` +
         `Harvested examples are capped at ${t.cap} quality — the written ones always outrank them.`;
}
