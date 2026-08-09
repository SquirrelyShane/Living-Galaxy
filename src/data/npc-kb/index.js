// Living Galaxy — NPC knowledge base public surface.
//
// Import from here rather than deep paths so call sites stay stable when the
// internal layout grows (more corpora, more role packs, etc.).

export {
  PROFILE_REQUIRED,
  DIAGNOSTIC_KINDS,
  TRAINING_PURPOSES,
  validateProfile,
  validateDiagnostic
} from './schema.js';

export {
  ROLE_ARCHETYPE,
  PROFILE_TEMPLATES,
  buildProfile,
  listRoles
} from './profiles.js';

export {
  recordDiagnostic,
  diagnosticsFor,
  recentDiagnostics,
  diagnose,
  recordManagerDecision,
  recordDialogue,
  diagnoseBoard
} from './diagnostics.js';

export {
  TRAINING_SEED,
  examplesWhere,
  examplesByPurpose,
  examplesByTag
} from './training-corpus.js';
