// Living Galaxy — NPC Knowledge Base schema.
//
// Designed as the durable, machine-readable substrate for:
//   1. High-detail diagnostics that ARIA (and the executive command surface) can query.
//   2. Future self-training / few-shot / RAG corpora for the onboard model.
//   3. Per-NPC behavioural traces that outlive a single session.
//
// Everything here is plain data. No Workers, no promises, no Three.js objects.
// A profile or diagnostic record can be serialised, shipped, or fed into a training
// pipeline without the rest of the game.

/**
 * Canonical fields for a rich NPC profile.
 *
 * A profile is *not* the live persona (traits + memory ring). It is the static +
 * semi-static dossier that explains *why* this character behaves the way the live
 * persona does, and that ARIA can cite when the pilot asks "who is this?" or
 * "why did they refuse?".
 *
 * @typedef {object} NpcProfile
 * @property {string} id                 stable key (usually ship/character name)
 * @property {string} name
 * @property {string} role               game role: mine | haul | trade | merc | combat | build | official | …
 * @property {string} faction
 * @property {string} archetype          npc-avatar archetype key
 * @property {object} traits             six-axis 0..1 snapshot (or seed)
 * @property {string} voice              register tag for grammar / LLM
 * @property {string[]} speechPatterns   short examples of how they talk
 * @property {string[]} heuristics       decision rules in plain language
 * @property {object}  background        free-form but structured life facts
 * @property {string[]} loyalties        people / orgs / ideas they will not cross lightly
 * @property {string[]} softSpots        things that move them (price, crew safety, charter…)
 * @property {string[]} redLines         things that make them refuse or turn hostile
 * @property {object}  performance       optional KPIs when the NPC is managed / owned
 * @property {string[]} diagnosticTags   machine-friendly labels for filtering / training
 * @property {number}  [rev]             bumps when the dossier is deliberately updated
 */

/**
 * A single diagnostic event — the unit of a behavioural trace.
 *
 * These are what future self-training wants: situation → observation → decision →
 * outcome, with enough trait / memory / policy context that a model can learn *why*.
 *
 * @typedef {object} DiagnosticEvent
 * @property {string} id
 * @property {string} subjectId          the NPC the event is about
 * @property {number} t                  game time (seconds)
 * @property {string} kind               decision | dialogue | performance | incident | board
 * @property {string} situation          short machine key (e.g. "haul-offer-refused")
 * @property {string} summary            one-line human summary
 * @property {object} [context]          free structured snapshot (targets, cargo, standing…)
 * @property {object} [traitsAt]         trait snapshot at decision time
 * @property {string[]} [memoriesCited]  memory types that influenced the call
 * @property {string[]} [policiesFired]  manager / brain policies that ran
 * @property {string}  [outcome]         what happened after
 * @property {number}  [salience]        0..1 — how much this should weight training / recall
 * @property {string[]} tags
 */

/**
 * A training example ready for few-shot, synthetic fine-tune, or RAG.
 *
 * @typedef {object} TrainingExample
 * @property {string} id
 * @property {string} purpose            dialogue | decision | diagnostic | command
 * @property {object} input              what the model / ARIA would see
 * @property {object} expected           the desired output shape
 * @property {string[]} tags
 * @property {number}  quality           0..1 hand-curated weight
 */

export const PROFILE_REQUIRED = [
  'id', 'name', 'role', 'faction', 'archetype', 'traits', 'voice',
  'speechPatterns', 'heuristics', 'diagnosticTags'
];

export const DIAGNOSTIC_KINDS = [
  'decision', 'dialogue', 'performance', 'incident', 'board', 'order', 'manager',
  // v1.01.80: hulls signing, losing and leaving company contracts.
  'contract'
];

export const TRAINING_PURPOSES = [
  'dialogue', 'decision', 'diagnostic', 'command', 'brief'
];

/** Validate a profile lightly. Returns list of missing / bad fields, empty if ok. */
export function validateProfile(p) {
  const errs = [];
  if (!p || typeof p !== 'object') return ['not an object'];
  for (const k of PROFILE_REQUIRED) {
    if (p[k] == null) errs.push(`missing ${k}`);
  }
  if (p.traits && typeof p.traits === 'object') {
    for (const a of ['aggression', 'sociability', 'greed', 'loyalty', 'verbosity', 'formality']) {
      if (typeof p.traits[a] !== 'number') errs.push(`trait ${a} not numeric`);
    }
  }
  return errs;
}

/** Validate a diagnostic event. */
export function validateDiagnostic(d) {
  const errs = [];
  if (!d || typeof d !== 'object') return ['not an object'];
  if (!d.subjectId) errs.push('missing subjectId');
  if (!d.kind || !DIAGNOSTIC_KINDS.includes(d.kind)) errs.push('bad kind');
  if (!d.situation) errs.push('missing situation');
  if (!d.summary) errs.push('missing summary');
  return errs;
}
