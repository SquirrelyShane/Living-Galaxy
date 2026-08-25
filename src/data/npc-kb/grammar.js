// Living Galaxy — how an NPC says a thing, as opposed to what it says.
//
// Until v1.01.91 every line in `data/npc-kb/topics.js` was a template literal with the names
// substituted in. Nine topics, one or two phrasings each, so a pilot listening to the
// trade band for ten minutes heard the same eighteen sentences on a loop. Adding a
// twentieth hand-written line would have bought about forty more seconds before the loop
// closed again — the problem is not the number of lines, it is that a fixed line has no
// axis to vary along.
//
// So this file does not hold sentences. It holds the pieces a sentence is made of, the
// rules for putting them together so the result is grammatical, and a chooser that
// remembers what it has already said. A topic now declares *meaning* — an act, and the
// facts it is about — and the realiser builds an utterance from that. Two ships trading
// the same tip twice produce two different sentences carrying the same information,
// because the wording is generated and the content is not.
//
// ── the three layers ─────────────────────────────────────────────────
//
//   lexicon    words, with the morphology needed to inflect them correctly
//   syntax     frames — ordered slot lists that realise into clauses
//   discourse  register, vocatives, hedges, and the anti-repetition memory
//
// Everything is seeded through `core/rng.js`, so the same world produces the same radio
// chatter and a replay does not diverge on dialogue.

import { stream } from '../../core/rng.js';

// ── morphology ───────────────────────────────────────────────────────
//
// Small, honest, and rule-based rather than a table of every form. English regular
// inflection covers almost everything a working ship says on the radio; the irregulars
// that matter here are few enough to list.

const IRREGULAR_PLURAL = {
  cargo: 'cargoes', wharf: 'wharves', shelf: 'shelves', life: 'lives',
  datum: 'data', analysis: 'analyses', crisis: 'crises', person: 'people'
};

/** Regular English pluralisation, with the sibilant and -y rules applied properly. */
export function plural(noun, n = 2) {
  if (n === 1) return noun;
  if (IRREGULAR_PLURAL[noun]) return IRREGULAR_PLURAL[noun];
  if (/(s|x|z|ch|sh)$/.test(noun)) return noun + 'es';
  if (/[^aeiou]y$/.test(noun)) return noun.slice(0, -1) + 'ies';
  if (/[^f]fe$/.test(noun)) return noun.slice(0, -2) + 'ves';
  return noun + 's';
}

const IRREGULAR_VERB = {
  be:    { s: 'is',    past: 'was',    part: 'been',   ing: 'being' },
  have:  { s: 'has',   past: 'had',    part: 'had',    ing: 'having' },
  do:    { s: 'does',  past: 'did',    part: 'done',   ing: 'doing' },
  go:    { s: 'goes',  past: 'went',   part: 'gone',   ing: 'going' },
  run:   { s: 'runs',  past: 'ran',    part: 'run',    ing: 'running' },
  cut:   { s: 'cuts',  past: 'cut',    part: 'cut',    ing: 'cutting' },
  hold:  { s: 'holds', past: 'held',   part: 'held',   ing: 'holding' },
  sit:   { s: 'sits',  past: 'sat',    part: 'sat',    ing: 'sitting' },
  see:   { s: 'sees',  past: 'saw',    part: 'seen',   ing: 'seeing' },
  take:  { s: 'takes', past: 'took',   part: 'taken',  ing: 'taking' },
  get:   { s: 'gets',  past: 'got',    part: 'got',    ing: 'getting' },
  leave: { s: 'leaves',past: 'left',   part: 'left',   ing: 'leaving' },
  lose:  { s: 'loses', past: 'lost',   part: 'lost',   ing: 'losing' },
  come:  { s: 'comes', past: 'came',   part: 'come',   ing: 'coming' },
  send:  { s: 'sends', past: 'sent',   part: 'sent',   ing: 'sending' },
  put:   { s: 'puts',  past: 'put',    part: 'put',    ing: 'putting' },
  pay:   { s: 'pays',  past: 'paid',   part: 'paid',   ing: 'paying' },
  say:   { s: 'says',  past: 'said',   part: 'said',   ing: 'saying' },
  read:  { s: 'reads', past: 'read',   part: 'read',   ing: 'reading' }
};

/** -ing with the consonant-doubling and silent-e rules that make it read as English. */
function gerund(v) {
  if (IRREGULAR_VERB[v]) return IRREGULAR_VERB[v].ing;
  if (/[^aeiou]e$/.test(v)) return v.slice(0, -1) + 'ing';
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(v)) return v + v.slice(-1) + 'ing';
  return v + 'ing';
}

/**
 * Conjugate.
 *
 * @param {string} v      base form
 * @param {object} agr    { person: 1|2|3, number: 'sg'|'pl', tense: 'pres'|'past', aspect }
 */
export function conjugate(v, agr = {}) {
  const { person = 3, number = 'sg', tense = 'pres', aspect = null } = agr;
  const irr = IRREGULAR_VERB[v];

  if (aspect === 'prog') {
    const be = tense === 'past'
      ? (number === 'sg' && person !== 2 ? 'was' : 'were')
      : (person === 1 && number === 'sg' ? 'am'
        : number === 'pl' || person === 2 ? 'are' : 'is');
    return `${be} ${gerund(v)}`;
  }
  if (aspect === 'perf') {
    const have = tense === 'past' ? 'had'
      : (person === 3 && number === 'sg' ? 'has' : 'have');
    return `${have} ${irr ? irr.part : regularPast(v)}`;
  }
  if (tense === 'past') return irr ? irr.past : regularPast(v);
  if (person === 3 && number === 'sg') return irr ? irr.s : third(v);
  return v;
}

function regularPast(v) {
  if (/e$/.test(v)) return v + 'd';
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ied';
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(v)) return v + v.slice(-1) + 'ed';
  return v + 'ed';
}

function third(v) {
  if (/(s|x|z|ch|sh|o)$/.test(v)) return v + 'es';
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies';
  return v + 's';
}

/**
 * a / an, decided on the *sound* rather than the letter.
 *
 * "an hour" and "a union" are the cases a letter test gets wrong, and a radio line that
 * says "a hour" is the kind of thing that reads as broken rather than as terse.
 */
export function article(word) {
  const w = String(word).toLowerCase();
  if (/^(hour|honest|honou?r|heir)/.test(w)) return 'an';
  if (/^(uni|use|user|euro|one|once|ubiq)/.test(w)) return 'a';
  return /^[aeiou]/.test(w) ? 'an' : 'a';
}

/** Determiner + noun, agreeing in number, with the count/mass distinction respected. */
export function np(noun, opts = {}) {
  const { count = 1, det = 'indef', mass = false, adj = null } = opts;
  const head = mass ? noun : plural(noun, count);
  const withAdj = adj ? `${adj} ${head}` : head;
  if (det === 'none') return withAdj;
  if (det === 'def') return `the ${withAdj}`;
  if (det === 'poss') return `${opts.owner || 'my'} ${withAdj}`;
  if (mass) return withAdj;
  if (count > 1) return `${count} ${withAdj}`;
  return `${article(adj || head)} ${withAdj}`;
}

// ── the lexicon ──────────────────────────────────────────────────────
//
// Synonym sets, not single words. Every entry is a set the realiser draws from, which is
// where most of the variety comes from: the same frame with a different verb choice reads
// as a different sentence, and no sentence has to be written twice.

const LEX = {
  verb: {
    work:    ['work', 'run', 'cut', 'push'],
    move:    ['move', 'shift', 'run', 'shuttle'],
    watch:   ['watch', 'cover', 'hold', 'mind'],
    find:    ['find', 'read', 'pick up', 'catch'],
    give:    ['pass', 'send', 'hand', 'put across'],
    need:    ['need', 'want', 'could use', 'am short'],
    report:  ['read', 'show', 'log', 'mark'],
    leave:   ['leave', 'clear', 'break off', 'stand down']
  },
  noun: {
    ore:     ['ore', 'rock', 'grade', 'cut'],
    face:    ['face', 'seam', 'rock', 'claim'],
    hold:    ['hold', 'bay', 'can'],
    lane:    ['lane', 'corridor', 'run', 'transit'],
    contact: ['contact', 'return', 'signature', 'blip'],
    berth:   ['berth', 'dock', 'ring', 'pad'],
    trouble: ['trouble', 'company', 'a problem', 'attention'],
    work:    ['work', 'a job', 'a run', 'a charter']
  },
  adj: {
    good:    ['good', 'clean', 'fat', 'better than posted'],
    bad:     ['thin', 'poor', 'picked over', 'not worth the burn'],
    quiet:   ['quiet', 'clear', 'dead', 'empty'],
    busy:    ['busy', 'crowded', 'lit up', 'noisy']
  },
  // Discourse markers, split by register. A terse ship does not say "as it happens".
  // A *marker* leads a clause and the clause continues in lower case: "Look, the face reads
  // well." `LEX.ack` below is the other thing — whole sentences, used as the body of an
  // acknowledgement, not as furniture in front of one. Terse register had `Right.` and
  // `Copy.` filed here as markers, which is what produced "Copy. are you holding?" on the
  // radio: a full stop followed by a lowercased word, on every terse line, for four slices.
  marker: {
    terse:   ['', '', '', 'Right,'],
    plain:   ['', 'Look,', 'Listen,', 'For what it is worth,'],
    warm:    ['', 'Hey,', 'Right then,', 'Tell you what,'],
    formal:  ['', 'Be advised,', 'For the record,', 'Note that']
  },
  hedge: {
    terse:   ['', ''],
    plain:   ['', 'I think', 'near enough', 'give or take'],
    warm:    ['', 'if you ask me', 'near enough', 'I reckon'],
    formal:  ['', 'approximately', 'to a first pass', 'nominally']
  },
  ack: {
    terse:   ['Copy.', 'Received.', 'Acknowledged.', 'Logged.'],
    plain:   ['Copy that.', 'Understood.', 'Got it.', 'Noted.'],
    warm:    ['Got you.', 'Fair enough.', 'Right you are.', 'Cheers.'],
    formal:  ['Acknowledged.', 'Received and logged.', 'Understood.', 'Noted for the record.']
  }
};

// ── register ─────────────────────────────────────────────────────────
//
// Which register a ship speaks in is a property of the ship, not of the line, so the same
// character sounds like itself across every topic it ever raises. Derived from role and
// faction rather than stored, so it needs no migration and cannot drift out of step.

export function registerOf(u) {
  if (!u) return 'plain';
  if (u.faction === 'hostile' || u.faction === 'pirate') return 'terse';
  if (u.faction === 'coalition' || u.role === 'fort') return 'formal';
  if (u.role === 'mine' || u.role === 'haul' || u.role === 'build') return 'warm';
  if (u.role === 'combat' || u.role === 'merc') return 'terse';
  return 'plain';
}

// ── choosing without repeating ───────────────────────────────────────
//
// The anti-repetition memory. Keyed by a caller-supplied bucket — usually speaker + topic —
// it refuses to hand back anything used recently in that bucket until the pool would be
// exhausted, at which point it forgets the oldest and carries on. That is what stops the
// radio being a tape loop without needing an enormous corpus: n frames give n distinct
// utterances in a row rather than a coin flip that lands on the same one twice.

const recent = new Map();   // bucket -> array of recently used keys, newest last

export function chooseFrom(list, bucket = 'default', rng = null) {
  if (!Array.isArray(list) || !list.length) return null;
  const seen = recent.get(bucket) || [];
  const fresh = list.filter(x => !seen.includes(keyOf(x)));
  const pool = fresh.length ? fresh : list;
  const draw = rng ? rng.next() : stream('npc-grammar').next();
  const pick = pool[Math.floor(draw * pool.length) % pool.length];

  const next = seen.concat([keyOf(pick)]);
  // Remember at most one short of the pool, so there is always something fresh to pick.
  while (next.length > Math.max(1, list.length - 1)) next.shift();
  recent.set(bucket, next);
  return pick;
}

const keyOf = x => (typeof x === 'string' ? x : (x && (x.id || x.frame)) || JSON.stringify(x));

/** Wipe the repetition memory. Called on a new game; also useful in tests. */
export function resetGrammarMemory() { recent.clear(); }

// ── syntax frames ────────────────────────────────────────────────────
//
// A frame is a function of the semantic record, not a string with holes in it. That is the
// difference that matters: a frame can decide *not* to mention a fact it was not given,
// reorder to put the important thing first, or drop the subject entirely the way real
// radio does — none of which a template can do.
//
// Every frame is tagged with the acts it can express. `realise()` picks among the frames
// that fit the act and the facts actually present.

// ── typed slots ──────────────────────────────────────────────────────
//
// The defect this exists to end, and it produced most of the bad radio the game shipped:
//
//     There is you a favour.
//     There is buy me something at the next berth.
//     You a favour.
//     Watch on the board — the independent has form.
//     Is I having a can?
//
// Every one is the same fault. A frame declared *which* slots it needed and nothing about
// what kind of thing belonged in them, so `object` could be a noun phrase ("a fat seam"), a
// full clause ("you a favour"), or an imperative ("buy me something at the next berth"), and
// a frame written for the first happily accepted the other two. `inform-existential` reads
// "There is ${object}", which is correct English for a noun phrase and gibberish for a
// clause — and nothing anywhere could tell the difference.
//
// So a slot carries its type. `np()`, `place()`, `described()` and `quantity()` tag what
// they return, a frame declares what it can take, and `realise()` filters on both. A clause
// landing in an existential is not merely unlikely now — it is unrepresentable, which is the
// same rule the world catalogue uses to keep an ice world out of an inferno orbit.
//
// The tag rides on a String subclass rather than a wrapper object so that every existing
// `${m.object}` interpolation keeps working untouched. An untagged plain string is treated
// as `np`, which is what the callers that predate this were assuming anyway.

/**
 * Verbs with no natural progressive or perfect in this register.
 *
 * English mostly forbids the progressive on statives — "I am owing you a favour" is wrong in
 * a way a native speaker hears immediately — and the aspect frames were selecting freely
 * across every verb the topics use.
 */
export const STATIVE = new Set(['owe', 'have', 'need', 'want', 'know', 'mean', 'hold', 'read']);

/** The kinds of thing a slot can hold. */
export const SLOT = {
  NP: 'np',               // a noun phrase: "a fat seam", "2 contacts", "Ore Runner 12"
  CLAUSE: 'clause',       // a finite clause: "you a favour", "the independent has form"
  IMPERATIVE: 'imp',      // a command: "buy me something at the next berth"
  ADVERBIAL: 'adv',       // a place or manner phrase: "out here", "at Meridian"
  PROPER: 'proper',       // a name, which must never be lowercased
  // A complement is the last piece of this taxonomy and the subtlest. "you a favour" is not
  // a clause — it cannot stand alone — and it is not a noun phrase either; it is the double
  // object of a specific verb and it is only a sentence with that verb in front of it.
  // Without its own type it was tagged as a clause and `inform-clause` rendered it bare:
  // "You one."
  COMPLEMENT: 'comp'
};

class Slot extends String {
  constructor(text, kind) { super(text); this.kind = kind; }
}

/** Tag a string with what kind of constituent it is. */
export const slot = (text, kind) => new Slot(String(text == null ? '' : text), kind);

export const npSlot   = t => slot(t, SLOT.NP);
export const clause   = t => slot(t, SLOT.CLAUSE);
export const imperative = t => slot(t, SLOT.IMPERATIVE);
export const adverbial = t => slot(t, SLOT.ADVERBIAL);
export const proper   = t => slot(t, SLOT.PROPER);
export const complement = t => slot(t, SLOT.COMPLEMENT);

/** What kind is this value? Untagged strings are noun phrases, which is the old assumption. */
export const kindOf = v =>
  (v && typeof v === 'object' && v.kind) ? v.kind : (v == null || v === '' ? null : SLOT.NP);

/**
 * Does a value fit a slot's declared types?
 *
 * `accepts` is a list; an omitted entry means the frame does not care, which is right for
 * slots like `subject` where every producer already yields a noun phrase.
 */
const fits = (v, allowed) => !allowed || allowed.includes(kindOf(v));

export const FRAMES = [
  // ── informing ──
  {
    id: 'inform-svo', acts: ['inform', 'tip'],
    needs: ['subject', 'verb'],
    build: (m, g) => `${g.cap(m.subject)} ${conjugate(m.verb, m.agr)}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'inform-fronted', acts: ['inform', 'tip'],
    needs: ['where', 'subject', 'verb'],
    build: (m, g) => `${g.cap(m.where)}, ${m.subject} ${conjugate(m.verb, m.agr)}${m.object ? ' ' + m.object : ''}.`
  },
  {
    id: 'inform-existential', acts: ['inform', 'tip'],
    needs: ['object'],
    // Noun phrases only. "There is" takes an NP and nothing else, which is why this frame
    // was the single largest source of nonsense before slots were typed.
    takes: { object: [SLOT.NP], where: [SLOT.ADVERBIAL] },
    // Number agreement comes off the NP rather than off `m.count`, which no topic ever set —
    // so this said "There is 2 contacts" for the whole life of the feature.
    build: (m, g) => `There ${isPlural(m.object) ? 'are' : 'is'} ${m.object}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'inform-verbless', acts: ['inform', 'tip'],
    needs: ['object', 'where'],
    // Radio drops the copula constantly. "Two contacts, on the lane."
    //
    // Two constraints, both learned the hard way. **NP only**, or a clause object turns into
    // the bare fragment "You a favour." And **`where` is required**, because without it this
    // reduces to a lone noun phrase with a full stop — "Fat ore." — which is not a dropped
    // copula, it is a missing sentence.
    takes: { object: [SLOT.NP], where: [SLOT.ADVERBIAL] },
    build: (m, g) => `${g.cap(m.object)}, ${m.where}.`
  },
  {
    id: 'inform-clause', acts: ['inform', 'tip'],
    needs: ['object'],
    // A clause or a command is already a sentence; it needs a frame that simply lets it be
    // one. Without this every clause-objected record fell through to the acknowledgement
    // frames, and "Settle it at the ring and we are square" came out as "Copy."
    takes: { object: [SLOT.CLAUSE, SLOT.IMPERATIVE] },
    build: (m, g) => `${g.cap(m.object)}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'inform-svo-clause', acts: ['inform', 'tip'],
    needs: ['subject', 'verb', 'object'],
    // Subject, verb, then a clausal complement — "I owe you a favour". The plain SVO frame
    // handles this too, but this one exists so a clause object does not force the record
    // into a subjectless frame and lose who is speaking.
    takes: { object: [SLOT.CLAUSE, SLOT.COMPLEMENT] },
    build: (m, g) => `${g.cap(m.subject)} ${conjugate(m.verb, m.agr)} ${m.object}.`
  },
  {
    id: 'inform-perfect', acts: ['inform'],
    needs: ['subject', 'verb'],
    // Stative verbs have no natural perfect or progressive here. "I have owed you one" and
    // "I am owing you a favour" are both things no operator has ever said on a radio.
    when: m => !STATIVE.has(String(m.verb)),
    build: (m, g) => `${g.cap(m.subject)} ${conjugate(m.verb, Object.assign({}, m.agr, { aspect: 'perf' }))}${m.object ? ' ' + m.object : ''}.`
  },
  {
    id: 'inform-progressive', acts: ['inform'],
    needs: ['subject', 'verb'],
    when: m => !STATIVE.has(String(m.verb)),
    build: (m, g) => `${g.cap(m.subject)} ${conjugate(m.verb, Object.assign({}, m.agr, { aspect: 'prog' }))}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}.`
  },

  // ── asking ──
  {
    id: 'ask-polar', acts: ['ask'],
    needs: ['subject', 'verb'],
    takes: { object: [SLOT.NP] },
    // Agreement for every person, not just the second. This hardcoded "Is " for anything
    // that was not `person: 2`, and `haulOffer`'s reply sends `subject: 'I', person: 1` —
    // so half of that topic's replies went out as "Is I having a can?"
    // `have` does not take the progressive in this sense — "Are you having a hold?" asks
    // about an experience, not a possession. English uses the perfect instead.
    build: (m, g) => (String(m.verb) === 'have'
      ? `${haveFor(m)} got${m.object ? ' ' + m.object : ''}?`
      : `${beFor(m)} ${gerund(m.verb)}${m.object ? ' ' + m.object : ''}?`)
  },
  {
    id: 'ask-wh', acts: ['ask'],
    needs: ['object'],
    build: (m, g) => `What have you got ${m.where || 'out there'}?`
  },
  {
    id: 'ask-tag', acts: ['ask'],
    needs: ['object'],
    takes: { object: [SLOT.NP], where: [SLOT.ADVERBIAL] },
    build: (m, g) => `${g.cap(m.object)}${m.where ? ' ' + m.where : ''} — anything on it?`
  },

  // ── offering and requesting ──
  {
    id: 'offer-direct', acts: ['offer'],
    needs: ['object'],
    takes: { object: [SLOT.NP], where: [SLOT.ADVERBIAL] },
    build: (m, g) => `I have ${m.object}${m.where ? ' ' + m.where : ''} if you want it.`
  },
  {
    id: 'offer-question', acts: ['offer'],
    needs: ['object'],
    takes: { object: [SLOT.NP], where: [SLOT.ADVERBIAL] },
    // The place rides inside the question. Trailing it as its own sentence gave
    // "Anyone want a bay? On this leg." — two fragments where one sentence was meant.
    build: (m, g) => `Anyone want ${m.object}${m.where ? ' ' + m.where : ''}?`
  },
  {
    id: 'request-need', acts: ['request'],
    needs: ['object'],
    takes: { object: [SLOT.NP], where: [SLOT.ADVERBIAL] },
    build: (m, g) => `I need ${m.object}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'request-polite', acts: ['request'],
    needs: ['object'],
    takes: { object: [SLOT.NP], where: [SLOT.ADVERBIAL] },
    build: (m, g) => `Any chance of ${m.object}${m.where ? ' ' + m.where : ''}?`
  },

  // ── warning ──
  {
    id: 'warn-imperative', acts: ['warn'],
    needs: ['object'],
    // `Watch` takes an object. It was being handed `where` — a place adverbial — which gave
    // "Watch on the board — the independent has form" and "Watch where I am — ...". The
    // adverbial belongs to the warning, not to the verb.
    takes: { where: [SLOT.ADVERBIAL] },
    build: (m, g) => `Watch yourself${m.where ? ' ' + m.where : ''} — ${softStart(m.object)}.`
  },
  {
    id: 'warn-declarative', acts: ['warn'],
    needs: ['object'],
    takes: { object: [SLOT.NP, SLOT.CLAUSE], where: [SLOT.ADVERBIAL] },
    build: (m, g) => `${g.cap(m.object)}${m.where ? ' ' + m.where : ''}. Keep your eyes open.`
  },

  // ── acknowledging ──
  {
    id: 'ack-bare', acts: ['ack'],
    needs: [],
    build: (m, g) => g.pick(LEX.ack[m.register] || LEX.ack.plain, 'ack')
  },
  {
    id: 'ack-echo', acts: ['ack'],
    needs: ['object'],
    takes: { object: [SLOT.NP, SLOT.CLAUSE] },
    build: (m, g) => `${g.pick(LEX.ack[m.register] || LEX.ack.plain, 'ack')} ${g.cap(m.object)}.`
  },
  {
    id: 'ack-commit', acts: ['ack'],
    // A commitment needs something to commit *to*. With a bare transitive verb this said
    // "Copy that. I will keep." — `warnAboutPlayer`'s reply passes `verb: 'keep'` and there
    // is no object anywhere in the record. Intransitive-safe verbs only, and anything else
    // falls back to a phrase that is complete on its own.
    needs: [],
    build: (m, g) => `${g.pick(LEX.ack[m.register] || LEX.ack.plain, 'ack')} I will ${commitPhrase(m.verb)}.`
  }
];

// ── frame helpers ────────────────────────────────────────────────────

/**
 * Is this noun phrase plural?
 *
 * Used for existential agreement, which used to read `m.count > 1` — a field no topic in the
 * project has ever set, so the frame said "There is" unconditionally and "There is 2
 * contacts on the lane" went out on the radio. Reading the NP itself cannot fall out of step
 * with the NP the way a parallel counter can.
 */
export function isPlural(np) {
  const t = String(np || '').trim();
  if (!t) return false;
  const lead = t.match(/^(\d[\d,]*)\s/);
  if (lead) return parseInt(lead[1].replace(/,/g, ''), 10) !== 1;
  if (/^(a|an|one)\s/i.test(t)) return false;
  return /(?:[^s]s|es)$/.test(t.split(' ').pop());
}

/** The right form of *have* for a record's agreement, for the possessive question. */
export function haveFor(m) {
  const agr = m.agr || {};
  const p = agr.person || 3;
  if (p === 1) return agr.number === 'pl' ? 'Have we' : 'Have I';
  if (p === 2) return 'Have you';
  return `${isPlural(m.subject) ? 'Have' : 'Has'} ${m.subject}`;
}

/** The right form of *be* for a record's agreement. */
export function beFor(m) {
  const agr = m.agr || {};
  const p = agr.person || 3;
  if (p === 1) return agr.number === 'pl' ? 'Are we' : 'Am I';
  if (p === 2) return 'Are you';
  return `${isPlural(m.subject) ? 'Are' : 'Is'} ${m.subject}`;
}

/**
 * A verb phrase that can stand alone after "I will".
 *
 * `LEX.verb` is full of transitives — keep, work, cut, move — and a commitment built from one
 * with no object is a sentence that stops early. Verbs that are complete on their own pass
 * through; everything else gets a stock phrase, which is what a real operator says anyway.
 */
const INTRANSITIVE_OK = new Set([
  'look', 'come', 'hold', 'wait', 'stand down', 'break off', 'clear', 'listen', 'go'
]);
export function commitPhrase(verb) {
  if (!verb) return 'take a look';
  const v = String(verb);
  return INTRANSITIVE_OK.has(v) ? v : 'take a look';
}

/** Lowercase a clause's first letter when it is being embedded mid-sentence. */
export const softStart = t => {
  const str = String(t || '');
  if (!str) return str;
  if (str.startsWith('I ') || str === 'I') return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
};

// ── realisation ──────────────────────────────────────────────────────

const cap = s => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');

// "I" is the one English pronoun that is always capitalised wherever it lands.
const fixI = s => String(s).replace(/(^|[\s,;(])i(?=[\s,.;!?)']|$)/g, '$1I');

/**
 * Turn a semantic record into a sentence.
 *
 * @param {object} msg
 *   act       'inform' | 'ask' | 'offer' | 'request' | 'warn' | 'ack'
 *   subject   already-realised NP, or omitted for a subjectless radio fragment
 *   verb      base form
 *   object    already-realised NP
 *   where     a PP or adverbial
 *   agr       agreement for the verb
 *   register  'terse' | 'plain' | 'warm' | 'formal'
 *   count     for existential agreement
 * @param {object} opts { bucket, rng, vocative, marker, hedge }
 */
export function realise(msg, opts = {}) {
  const m = Object.assign({ act: 'inform', register: 'plain', agr: { person: 3, number: 'sg' } }, msg);
  const bucket = opts.bucket || 'default';
  const rng = opts.rng || null;
  const g = {
    cap,
    pick: (list, sub) => chooseFrom(list, `${bucket}:${sub}`, rng) || (list && list[0]) || ''
  };

  // Two gates, not one. `needs` is what the frame cannot build without; `takes` is what kind
  // of constituent each slot may hold. The second is the one that ends the whole family of
  // "There is you a favour" faults — a clause simply cannot be selected into a frame that
  // declares it wants a noun phrase.
  const usable = FRAMES.filter(f => {
    if (!f.acts.includes(m.act)) return false;
    if (!(f.needs || []).every(k => m[k] != null && String(m[k]) !== '')) return false;
    const t = f.takes;
    if (t) for (const k of Object.keys(t)) {
      if (m[k] != null && String(m[k]) !== '' && !fits(m[k], t[k])) return false;
    }
    // A frame may also refuse a record outright — an aspect that the verb cannot carry, for
    // instance. Cheaper than encoding it as another slot type, and it keeps the reason next
    // to the frame it belongs to.
    if (f.when && !f.when(m)) return false;
    return true;
  });
  const frame = chooseFrom(usable.length ? usable : FRAMES.filter(f => f.acts.includes('ack')),
                           `${bucket}:frame`, rng);
  if (!frame) return '';

  let body = frame.build(m, g).replace(/\s+/g, ' ').trim();

  // Proper nouns must survive being moved out of sentence-initial position. A discourse
  // marker in front of a clause lowercases the first word — correct for "The face reads
  // well", wrong for "Bulk Hauler 02", and very wrong for "I". Collect the names this
  // record actually mentions and refuse to touch them.
  const propers = [m.subject, m.object, opts.vocative, m.where]
    .filter(x => typeof x === 'string')
    .filter(x => /[A-Z]/.test(x.slice(1)) || /^[A-Z][a-z]+ [A-Z0-9]/.test(x));
  const softLower = t => {
    const first = t.split(' ')[0];
    if (first === 'I') return t;
    if (propers.some(pn => t.startsWith(pn))) return t;
    return t.charAt(0).toLowerCase() + t.slice(1);
  };

  // Discourse furniture, applied after the clause so it never breaks agreement inside it.
  //
  // Two rules learned from reading the comms log rather than the code:
  //
  //   1. An acknowledgement in front of an acknowledgement says nothing twice. "Copy.
  //      acknowledged." and "Right. received." were both real transmissions. A clause that
  //      is *itself* an ack gets no furniture in front of it.
  //   2. A prefix ending in a full stop ends a sentence, so the next word keeps its capital.
  //      Only a clause-leading marker lowercases what follows it.
  //   3. A clause-leading marker takes a declarative. "Look, the face reads well" is speech;
  //      "Note that are you holding?" is not English at all, and formal-register questions
  //      were producing it. Questions get no furniture.
  const reg = m.register;
  const bare = m.act === 'ack' || m.act === 'ask';
  if (opts.marker !== false && !bare) {
    const mk = g.pick(LEX.marker[reg] || LEX.marker.plain, 'marker');
    if (mk) body = /[.!?]$/.test(mk) ? `${mk} ${cap(body)}` : `${mk} ${softLower(body)}`;
  }
  if (opts.hedge) {
    const h = g.pick(LEX.hedge[reg] || LEX.hedge.plain, 'hedge');
    if (h) body = body.replace(/\.$/, `, ${h}.`);
  }
  // Do not address someone twice in one sentence. A topic that already names the listener
  // in the clause ("marking Bulk Hauler 02 on my board") does not also need a vocative.
  if (opts.vocative && !body.includes(opts.vocative)) {
    // Vocative position varies in real speech; front for a call, tail for an aside.
    body = (rng ? rng.next() : stream('npc-grammar').next()) < 0.5
      ? `${opts.vocative}, ${softLower(body)}`
      : body.replace(/\.$/, `, ${opts.vocative}.`);
  }
  return fixI(cap(body));
}

/**
 * Build the object NP for a quantity of something, choosing a synonym and inflecting it.
 * This is where "information constructing" happens: the number is real, and the words
 * around it are chosen fresh each time.
 */
export function quantity(kind, n, opts = {}) {
  const words = LEX.noun[kind] || [kind];
  const word = chooseFrom(words, `${opts.bucket || 'q'}:${kind}`, opts.rng) || kind;
  if (n == null) return npSlot(np(word, { det: opts.det || 'indef', mass: opts.mass }));
  const rounded = Math.round(n);
  if (opts.unit) return npSlot(`${rounded.toLocaleString('en-US')} ${opts.unit} of ${word}`);
  return npSlot(`${rounded.toLocaleString('en-US')} ${plural(word, rounded)}`);
}

/** A descriptive NP — "a fat seam", "picked-over rock". */
export function described(kind, quality, opts = {}) {
  // `avoid` keeps a sentence from using the same head noun twice. `LEX.noun.face` and
  // `LEX.noun.ore` both contain "rock", and the anti-repetition memory is per-bucket — so
  // the subject and the object drew independently and "the good rock reads fat rock" went
  // out. Recency cannot see across two different lexical sets; the caller can.
  const avoid = opts.avoid ? [].concat(opts.avoid).map(String) : null;
  let pool = LEX.noun[kind] || [kind];
  if (avoid) {
    const trimmed = pool.filter(w => !avoid.some(x => x.includes(String(w))));
    if (trimmed.length) pool = trimmed;
  }
  const noun = chooseFrom(pool, `${opts.bucket || 'd'}:${kind}`, opts.rng) || kind;
  // Attributive adjectives only. `LEX.adj` also holds predicate *phrases* — "better than
  // posted", "not worth the burn" — which are correct after a copula and wrong in front of a
  // noun: `np()` just prefixes them, giving "the better than posted seam" and "a not worth
  // the burn rock". Split at the source so the two can never be confused again.
  const adjPool = (LEX.adj[quality] || [quality]).filter(isAttributive);
  const adj = chooseFrom(adjPool.length ? adjPool : [quality], `${opts.bucket || 'd'}:${quality}`, opts.rng) || quality;
  return npSlot(np(noun, { det: opts.det || 'indef', adj, mass: !!opts.mass }));
}

/**
 * Can this adjective sit in front of a noun?
 *
 * A single word can. A phrase with a preposition, a comparative or a negation is a predicate
 * — it goes after "is", not before a noun — and `described()` is the only consumer that
 * cares, because it is the only one that builds an attributive NP.
 */
export const isAttributive = a => {
  const t = String(a || '').trim();
  return !!t && !/\s/.test(t);
};

/** A place adverbial, varied. */
export function place(name, opts = {}) {
  const forms = name
    ? [`at ${name}`, `off ${name}`, `out by ${name}`, `${name} side`]
    : ['out here', 'on this leg', 'where I am', 'on the board'];
  return adverbial(chooseFrom(forms, `${opts.bucket || 'p'}:place`, opts.rng) || forms[0]);
}
