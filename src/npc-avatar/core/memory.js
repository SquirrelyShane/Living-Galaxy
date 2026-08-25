// NPC_Avatar — memory.
//
// A tag-indexed, decaying fact list. Deliberately not a vector database: at the scale of
// one background character's experience — a few dozen things that have happened to them
// — a vector store buys nothing a plain weighted list doesn't, and it costs an embedding
// model per NPC. Recall here is "things of this type, about this subject, ranked by how
// much they still matter" — exact-match filtering plus a decay curve, which is the part
// that actually produces the feel people mean by "remembers": recent and emotionally
// weighted things dominate, old small things fade, nothing is kept forever.
//
// A fact is `{ type, subject, weight, t, meta }`. `type` is the kind of thing (e.g.
// 'threatened', 'traded', 'helped'), `subject` is who or what it was about (a player id,
// a faction, another NPC's id), `weight` is how much it mattered when it happened, `t` is
// the game-time it happened, `meta` is a free bag for anything a caller wants to carry
// through to a grammar or LLM context (an amount, a location name).
//
// Two facts with the same (type, subject) merge rather than stack — telling the same NPC
// off five times should read as "you have told this person off before, emphatically," not
// as five separate memories crowding out everything else.

/** A fresh, empty memory. `cap` bounds how many distinct facts a character can hold. */
export function createMemory(cap = 24) {
  return { facts: [], cap };
}

const key = f => f.type + '\u0001' + f.subject;

/**
 * Salience right now: weight decayed by a half-life in game-seconds. A fact with weight
 * 1 at exactly one half-life old reads as 0.5 — half as vivid as the moment it happened.
 */
export function salience(fact, now, halfLife = 1800) {
  const age = Math.max(0, now - fact.t);
  return fact.weight * Math.pow(0.5, age / Math.max(1, halfLife));
}

/**
 * File a fact. If the same (type, subject) already exists, reinforce it — bump the
 * weight (capped) and refresh the timestamp — rather than adding a duplicate entry.
 * Over `cap`, the least salient existing fact is evicted to make room.
 */
export function remember(mem, fact, now = fact.t, weightCap = 4) {
  const k = key(fact);
  const existing = mem.facts.find(f => key(f) === k);
  if (existing) {
    existing.weight = Math.min(weightCap, existing.weight + fact.weight);
    existing.t = fact.t;
    if (fact.meta) existing.meta = Object.assign({}, existing.meta, fact.meta);
    return existing;
  }
  const entry = { type: fact.type, subject: fact.subject, weight: fact.weight,
                   t: fact.t, meta: fact.meta || null };
  mem.facts.push(entry);
  if (mem.facts.length > mem.cap) {
    let worst = 0, worstV = Infinity;
    for (let i = 0; i < mem.facts.length; i++) {
      const s = salience(mem.facts[i], now);
      if (s < worstV) { worstV = s; worst = i; }
    }
    mem.facts.splice(worst, 1);
  }
  return entry;
}

/**
 * Top `n` facts by current salience, optionally filtered by type and/or subject.
 * Salience-zero facts (fully decayed) are never returned even if `forgetStale` has not
 * run recently — recall is always honest about what still matters.
 */
export function recall(mem, query = {}, n = 3, now = 0, halfLife = 1800) {
  let pool = mem.facts;
  if (query.type != null) pool = pool.filter(f => f.type === query.type);
  if (query.subject != null) pool = pool.filter(f => f.subject === query.subject);
  return pool
    .map(f => ({ fact: f, s: salience(f, now, halfLife) }))
    .filter(x => x.s > 0.02)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map(x => x.fact);
}

/** Prune facts whose salience has decayed below `floor`. Call occasionally, not per-tick. */
export function forgetStale(mem, now, halfLife = 1800, floor = 0.04) {
  const before = mem.facts.length;
  mem.facts = mem.facts.filter(f => salience(f, now, halfLife) >= floor);
  return before - mem.facts.length;
}

/** Strongest single fact about a subject, or null. Handy for a one-line "how do I feel". */
export function strongestAbout(mem, subject, now, halfLife = 1800) {
  const r = recall(mem, { subject }, 1, now, halfLife);
  return r[0] || null;
}

export const serializeMemory = mem => mem.facts.slice();
export function restoreMemory(data, cap = 24) {
  const facts = Array.isArray(data) ? data.filter(f => f && f.type && f.subject != null) : [];
  return { facts: facts.slice(-cap), cap };
}
