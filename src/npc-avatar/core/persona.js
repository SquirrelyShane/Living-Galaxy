// NPC_Avatar — persona.
//
// One object per character that actually has a mind, not per character that exists. A
// starfield of six hundred silent asteroid-belt contacts does not need a persona; the
// mercenary who just took a contract on you does. `createPersona` is meant to be called
// lazily, the first moment a character becomes individually relevant — a hail, a named
// mission-giver, a station controller — and cached from then on (this project's host
// game should key that cache by whatever stable id it already assigns the NPC).
//
// A persona is: identity + traits (core/traits.js) + memory (core/memory.js). It does
// NOT include a Tier-3 model connection — that is deliberately external (see
// llm/bridge.js) so a persona is plain, serializable data with no worker, no promise, no
// network reference living inside it. Save/load is therefore just JSON.

import { AXES, makeTraits, driftTrait, describeTraits } from './traits.js';
import { createMemory, remember, recall, forgetStale, strongestAbout,
         serializeMemory, restoreMemory } from './memory.js';
import { expand } from './grammar.js';

/**
 * @param {object} opts
 * @param {string} opts.id          stable identity — reuse the host game's NPC id
 * @param {string} [opts.name]
 * @param {string} [opts.archetype] key into traits.ARCHETYPES
 * @param {string} [opts.faction]
 * @param {object} [opts.traits]    explicit trait overrides, or a full trait object
 * @param {*} [opts.rng]            seeded stream for jitter — see traits.makeTraits
 * @param {number} [opts.memoryCap]
 */
export function createPersona(opts = {}) {
  const traits = opts.traits && AXES.every(a => opts.traits[a] != null)
    ? opts.traits
    : makeTraits(opts.archetype, opts.traits || {}, opts.rng);
  return {
    id: opts.id,
    name: opts.name || opts.id,
    archetype: opts.archetype || 'drifter',
    faction: opts.faction || 'neutral',
    traits,
    memory: createMemory(opts.memoryCap || 24),
    // Bumped whenever a fact lands. Cheap dirty-flag a caller can use to know "this
    // persona has something new to say about itself" without re-scanning memory.
    rev: 0
  };
}

/**
 * File something that happened to this persona, and let it nudge the personality a
 * little. `driftAxis`/`driftAmount` are optional — most facts should not move a trait;
 * a few formative ones (robbed, saved, betrayed) should.
 */
export function rememberEvent(persona, fact, now, opts = {}) {
  remember(persona.memory, Object.assign({ t: now }, fact), now);
  if (opts.driftAxis) driftTrait(persona.traits, opts.driftAxis, opts.driftAmount || 0);
  persona.rev++;
}

export function forgetOldMemories(persona, now, halfLife, floor) {
  return forgetStale(persona.memory, now, halfLife, floor);
}

/** What this persona is prepared to say about a subject, if it has an opinion at all. */
export function opinionOf(persona, subject, now, halfLife) {
  return strongestAbout(persona.memory, subject, now, halfLife);
}

/**
 * The guaranteed line. Synchronous, zero-cost, always returns something — this is the
 * baseline every NPC has whether or not a language model is anywhere in the picture.
 * `situation` is a grammar symbol name; `ctx` is merged with traits/memory/descriptors so
 * grammar authors can gate on either without threading them through by hand.
 */
export function say(persona, grammar, situation, ctx = {}, rng = Math.random, now = 0) {
  const full = Object.assign({
    id: persona.id, name: persona.name, faction: persona.faction,
    traits: persona.traits, descriptors: describeTraits(persona.traits),
    recall: (query, n) => recall(persona.memory, query, n, now)
  }, ctx);
  return expand(grammar, situation, full, rng);
}

/**
 * A compact briefing for a Tier-3 model — traits reduced to words, a handful of the most
 * salient memories, nothing else. This is what should go in an LLM system prompt, never
 * the raw traits object or the full memory list: a model asked to roleplay six decimals
 * writes worse dialogue than one asked to roleplay "guarded, terse, holds a grudge."
 */
export function brief(persona, now, opts = {}) {
  const mems = recall(persona.memory, {}, opts.memoryLines || 3, now);
  return {
    name: persona.name,
    faction: persona.faction,
    archetype: persona.archetype,
    descriptors: describeTraits(persona.traits),
    recent: mems.map(f => ({ type: f.type, subject: f.subject, meta: f.meta || null }))
  };
}

export function serializePersona(persona) {
  return {
    id: persona.id, name: persona.name, archetype: persona.archetype, faction: persona.faction,
    traits: persona.traits, memory: serializeMemory(persona.memory)
  };
}

export function restorePersona(data, memoryCap = 24) {
  if (!data || !data.id) return null;
  return {
    id: data.id, name: data.name || data.id, archetype: data.archetype || 'drifter',
    faction: data.faction || 'neutral',
    traits: data.traits || {}, memory: restoreMemory(data.memory, memoryCap), rev: 0
  };
}
