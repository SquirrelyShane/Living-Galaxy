// NPC_Avatar — traits.
//
// Six axes, 0..1, no hidden ones. That constraint is deliberate: a trait system with
// twenty axes is unauditable — nobody can look at a character and say which number
// explains the behaviour they just saw. Six is few enough that a designer can hold the
// whole personality in their head, and every downstream tier (grammar selection, memory
// weighting, the LLM system prompt) reads the same six numbers, so a personality is
// portable between all of them rather than defined three different ways.
//
//   aggression   — how readily this character escalates, threatens, or fights
//   sociability  — how much this character volunteers, chats, or answers unprompted
//   greed        — how much price, payment and self-interest colour a decision
//   loyalty      — attachment to faction/employer over self-interest
//   verbosity    — how many words it takes this character to say something
//   formality    — register: clipped and official vs loose and colloquial
//
// Archetypes are starting points, not categories a character is stuck in. `driftTrait`
// exists so memory can nudge a trait over time (a merchant who gets robbed twice trusts
// less) without a designer having to hand-author every possible personality change.

export const AXES = ['aggression', 'sociability', 'greed', 'loyalty', 'verbosity', 'formality'];

/**
 * Starting points. `voice` is a free-text tag the grammar layer and the LLM system
 * prompt both read to pick a register — it is not consumed by anything in this file.
 */
export const ARCHETYPES = {
  merchant: { aggression: 0.15, sociability: 0.75, greed: 0.70, loyalty: 0.40, verbosity: 0.60, formality: 0.50, voice: 'trade' },
  guard:    { aggression: 0.55, sociability: 0.30, greed: 0.20, loyalty: 0.80, verbosity: 0.25, formality: 0.70, voice: 'official' },
  laborer:  { aggression: 0.25, sociability: 0.45, greed: 0.35, loyalty: 0.45, verbosity: 0.35, formality: 0.20, voice: 'plain' },
  criminal: { aggression: 0.65, sociability: 0.35, greed: 0.75, loyalty: 0.20, verbosity: 0.30, formality: 0.10, voice: 'rough' },
  patrol:   { aggression: 0.50, sociability: 0.25, greed: 0.10, loyalty: 0.85, verbosity: 0.20, formality: 0.75, voice: 'official' },
  official: { aggression: 0.20, sociability: 0.40, greed: 0.15, loyalty: 0.70, verbosity: 0.55, formality: 0.85, voice: 'formal' },
  drifter:  { aggression: 0.35, sociability: 0.55, greed: 0.40, loyalty: 0.15, verbosity: 0.45, formality: 0.15, voice: 'plain' },
  scholar:  { aggression: 0.10, sociability: 0.50, greed: 0.10, loyalty: 0.30, verbosity: 0.80, formality: 0.60, voice: 'formal' }
};
export const ARCHETYPE_KEYS = Object.keys(ARCHETYPES);

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Build a traits object from an archetype, jittered so two guards are not identical.
 * `rng` is any object exposing `.next()` in [0,1) — pass a seeded stream (this project's
 * host game almost certainly already has one) so a given NPC id always jitters the same
 * way rather than re-rolling on every load.
 */
export function makeTraits(archetypeKey, overrides = {}, rng = Math.random, jitter = 0.12) {
  const base = ARCHETYPES[archetypeKey] || ARCHETYPES.drifter;
  const next = typeof rng === 'function' ? rng : () => rng.next();
  const out = { voice: base.voice };
  for (const axis of AXES) {
    const seed = overrides[axis] != null ? overrides[axis] : base[axis];
    const spread = (next() * 2 - 1) * jitter;
    out[axis] = clamp01(seed + spread);
  }
  if (overrides.voice) out.voice = overrides.voice;
  return out;
}

/** Nudge one axis by a bounded amount. Used by memory-driven personality drift. */
export function driftTrait(traits, axis, delta) {
  if (!AXES.includes(axis)) return traits;
  traits[axis] = clamp01((traits[axis] || 0) + delta);
  return traits;
}

/**
 * A short human-readable read on a trait set — for debugging overlays and for feeding a
 * compact personality summary into an LLM system prompt without dumping six raw floats
 * at it. Every threshold is a plain midpoint split; this is meant to be legible, not
 * clever.
 */
const DESCRIPTORS = {
  aggression: ['placid', 'even-tempered', 'quick to escalate'],
  sociability: ['withdrawn', 'even-tempered', 'talkative'],
  greed: ['generous', 'fair', 'grasping'],
  loyalty: ['self-interested', 'reliable', 'devoted'],
  verbosity: ['terse', 'even-tempered', 'wordy'],
  formality: ['loose', 'even-tempered', 'formal']
};
export function describeTraits(traits) {
  const out = [];
  for (const axis of AXES) {
    const v = traits[axis];
    if (v == null) continue;
    const bucket = v < 0.35 ? 0 : v > 0.65 ? 2 : 1;
    if (bucket !== 1) out.push(DESCRIPTORS[axis][bucket]);   // skip the bland middle
  }
  return out;
}
