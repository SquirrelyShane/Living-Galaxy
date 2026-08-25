// Living Galaxy — how an NPC says a thing, as opposed to what it says.
//
// Until v1.01.91 every line in `data/npc-topics.js` was a template literal with the names
// substituted in. Nine topics, one or two phrasings each, so a pilot listening to the
// trade band for ten minutes heard the same eighteen sentences on a loop. Adding a
// twentieth hand-written line would have bought about forty more seconds before the loop
// closed again — the problem is not the number of lines, it is that a fixed line has no
// axis to vary along.
//
// So this file does not hold sentences. It holds the pieces a sentence is made of, the
// rules for putting them together so the result is grammatical, and a chooser that
// remembers what it has already said. A topic declares *meaning* — an act, and the facts
// it is about — and the realiser builds an utterance from that. Two ships trading the same
// tip twice produce two different sentences carrying the same information, because the
// wording is generated and the content is not.
//
// ── the five layers ──────────────────────────────────────────────────
//
//   morphology   inflection: plurals, tense, aspect, mood, degree, number-words
//   lexicon      synonym sets, with the features the syntax needs to use them correctly
//   syntax       frames — functions of a semantic record that realise into clauses
//   discourse    register, vocatives, hedges, markers, sign-offs, anti-repetition memory
//   proofing     a validator that reads the finished string and repairs what it can
//
// The proofing layer is new in v1.02.10 and is the reason this file grew. Generation that
// is *almost* grammatical is worse than a template, because a template is at least wrong
// in the same way every time and can be fixed by hand. A generator needs to be able to
// look at its own output and reject "a hour", "there is 3 contacts", "Copy. are you
// holding?" and "Watch yourself — watch yourself." before they reach the comms log. Every
// rule in PROOF_RULES below is there because the log produced the bad string at least once.
//
// Everything is seeded through `core/rng.js`, so the same world produces the same radio
// chatter and a replay does not diverge on dialogue.

import { stream } from '../core/rng.js';

// ═════════════════════════════════════════════════════════════════════
//  1. MORPHOLOGY
// ═════════════════════════════════════════════════════════════════════
//
// Rule-based rather than a table of every form, with the irregulars that actually occur in
// working radio traffic listed out. English regular inflection covers most of what a ship
// says; the exceptions are few enough to enumerate and cheap enough to look up.

const IRREGULAR_PLURAL = {
  cargo: 'cargoes', wharf: 'wharves', shelf: 'shelves', life: 'lives',
  datum: 'data', analysis: 'analyses', crisis: 'crises', person: 'people',
  half: 'halves', leaf: 'leaves', thief: 'thieves', loaf: 'loaves',
  knife: 'knives', wife: 'wives', calf: 'calves', self: 'selves',
  man: 'men', woman: 'women', child: 'children', foot: 'feet',
  tooth: 'teeth', goose: 'geese', mouse: 'mice', louse: 'lice',
  ox: 'oxen', die: 'dice', index: 'indices', appendix: 'appendices',
  matrix: 'matrices', vertex: 'vertices', axis: 'axes', basis: 'bases',
  thesis: 'theses', hypothesis: 'hypotheses', diagnosis: 'diagnoses',
  criterion: 'criteria', phenomenon: 'phenomena', medium: 'media',
  stratum: 'strata', bacterium: 'bacteria', curriculum: 'curricula',
  formula: 'formulae', antenna: 'antennae', nucleus: 'nuclei',
  radius: 'radii', stimulus: 'stimuli', fungus: 'fungi', cactus: 'cacti',
  echo: 'echoes', hero: 'heroes', potato: 'potatoes', tomato: 'tomatoes',
  torpedo: 'torpedoes', veto: 'vetoes', embargo: 'embargoes'
};

// Nouns that do not inflect for number at all. Radio is full of them — "two craft",
// "three series", "aircraft inbound" — and pluralising them is the sort of error that
// makes generated speech read as machine output rather than as a tired pilot.
const INVARIANT_PLURAL = new Set([
  'aircraft', 'spacecraft', 'craft', 'series', 'species', 'means', 'offspring',
  'deer', 'sheep', 'fish', 'salmon', 'trout', 'swine', 'bison', 'moose',
  'headquarters', 'crossroads', 'barracks', 'corps', 'gallows', 'innings'
]);

// Mass nouns. These take no plural and no numeral, and the realiser routes them through a
// partitive ("a load of ore") rather than a count when a quantity is wanted.
const MASS_NOUNS = new Set([
  'ore', 'rock', 'fuel', 'water', 'ice', 'air', 'oxygen', 'plasma', 'gas',
  'dust', 'debris', 'wreckage', 'scrap', 'metal', 'alloy', 'traffic', 'weather',
  'information', 'intel', 'news', 'advice', 'work', 'freight',
  'money', 'credit', 'fire', 'cover', 'noise', 'interference', 'silence',
  'damage', 'trouble', 'company', 'attention', 'progress', 'evidence', 'equipment'
]);

/**
 * Regular English pluralisation, with the sibilant, -y, -f/-fe, -o and invariant rules
 * applied properly. `n` is the count the noun is agreeing with: 1 leaves it alone.
 */
export function plural(noun, n = 2) {
  if (!noun) return '';
  if (n === 1) return noun;
  const low = String(noun).toLowerCase();
  if (INVARIANT_PLURAL.has(low)) return noun;
  if (MASS_NOUNS.has(low)) return noun;
  if (IRREGULAR_PLURAL[low]) return matchCase(noun, IRREGULAR_PLURAL[low]);
  // Compounds pluralise their head, which for hyphenated forms is usually the first word.
  if (/-/.test(noun)) {
    const parts = noun.split('-');
    if (/^(in|out|by|on|off|up|down)$/.test(parts[parts.length - 1])) {
      parts[0] = plural(parts[0], n);
      return parts.join('-');
    }
  }
  if (/(s|x|z|ch|sh)$/.test(low)) return noun + 'es';
  if (/[^aeiou]y$/.test(low)) return noun.slice(0, -1) + 'ies';
  if (/[^f]fe$/.test(low)) return noun.slice(0, -2) + 'ves';
  if (/[^aeiou]o$/.test(low) && low.length > 3) return noun + 'es';
  return noun + 's';
}

/** Keep the casing of the source word when swapping in an irregular form. */
function matchCase(src, out) {
  if (src === src.toUpperCase() && src.length > 1) return out.toUpperCase();
  if (/^[A-Z]/.test(src)) return out.charAt(0).toUpperCase() + out.slice(1);
  return out;
}

/** Is this noun countable in the sense the realiser cares about? */
export function isMass(noun) {
  return MASS_NOUNS.has(String(noun || '').toLowerCase());
}

const IRREGULAR_VERB = {
  be:      { s: 'is',      past: 'was',      part: 'been',      ing: 'being' },
  have:    { s: 'has',     past: 'had',      part: 'had',       ing: 'having' },
  do:      { s: 'does',    past: 'did',      part: 'done',      ing: 'doing' },
  go:      { s: 'goes',    past: 'went',     part: 'gone',      ing: 'going' },
  run:     { s: 'runs',    past: 'ran',      part: 'run',       ing: 'running' },
  cut:     { s: 'cuts',    past: 'cut',      part: 'cut',       ing: 'cutting' },
  hold:    { s: 'holds',   past: 'held',     part: 'held',      ing: 'holding' },
  sit:     { s: 'sits',    past: 'sat',      part: 'sat',       ing: 'sitting' },
  see:     { s: 'sees',    past: 'saw',      part: 'seen',      ing: 'seeing' },
  take:    { s: 'takes',   past: 'took',     part: 'taken',     ing: 'taking' },
  get:     { s: 'gets',    past: 'got',      part: 'got',       ing: 'getting' },
  leave:   { s: 'leaves',  past: 'left',     part: 'left',      ing: 'leaving' },
  lose:    { s: 'loses',   past: 'lost',     part: 'lost',      ing: 'losing' },
  come:    { s: 'comes',   past: 'came',     part: 'come',      ing: 'coming' },
  send:    { s: 'sends',   past: 'sent',     part: 'sent',      ing: 'sending' },
  put:     { s: 'puts',    past: 'put',      part: 'put',       ing: 'putting' },
  pay:     { s: 'pays',    past: 'paid',     part: 'paid',      ing: 'paying' },
  say:     { s: 'says',    past: 'said',     part: 'said',      ing: 'saying' },
  read:    { s: 'reads',   past: 'read',     part: 'read',      ing: 'reading' },
  make:    { s: 'makes',   past: 'made',     part: 'made',      ing: 'making' },
  find:    { s: 'finds',   past: 'found',    part: 'found',     ing: 'finding' },
  keep:    { s: 'keeps',   past: 'kept',     part: 'kept',      ing: 'keeping' },
  feel:    { s: 'feels',   past: 'felt',     part: 'felt',      ing: 'feeling' },
  hear:    { s: 'hears',   past: 'heard',    part: 'heard',     ing: 'hearing' },
  tell:    { s: 'tells',   past: 'told',     part: 'told',      ing: 'telling' },
  sell:    { s: 'sells',   past: 'sold',     part: 'sold',      ing: 'selling' },
  buy:     { s: 'buys',    past: 'bought',   part: 'bought',    ing: 'buying' },
  bring:   { s: 'brings',  past: 'brought',  part: 'brought',   ing: 'bringing' },
  think:   { s: 'thinks',  past: 'thought',  part: 'thought',   ing: 'thinking' },
  catch:   { s: 'catches', past: 'caught',   part: 'caught',    ing: 'catching' },
  teach:   { s: 'teaches', past: 'taught',   part: 'taught',    ing: 'teaching' },
  fight:   { s: 'fights',  past: 'fought',   part: 'fought',    ing: 'fighting' },
  build:   { s: 'builds',  past: 'built',    part: 'built',     ing: 'building' },
  burn:    { s: 'burns',   past: 'burned',   part: 'burned',    ing: 'burning' },
  break:   { s: 'breaks',  past: 'broke',    part: 'broken',    ing: 'breaking' },
  speak:   { s: 'speaks',  past: 'spoke',    part: 'spoken',    ing: 'speaking' },
  wake:    { s: 'wakes',   past: 'woke',     part: 'woken',     ing: 'waking' },
  drive:   { s: 'drives',  past: 'drove',    part: 'driven',    ing: 'driving' },
  ride:    { s: 'rides',   past: 'rode',     part: 'ridden',    ing: 'riding' },
  rise:    { s: 'rises',   past: 'rose',     part: 'risen',     ing: 'rising' },
  write:   { s: 'writes',  past: 'wrote',    part: 'written',   ing: 'writing' },
  fly:     { s: 'flies',   past: 'flew',     part: 'flown',     ing: 'flying' },
  draw:    { s: 'draws',   past: 'drew',     part: 'drawn',     ing: 'drawing' },
  throw:   { s: 'throws',  past: 'threw',    part: 'thrown',    ing: 'throwing' },
  blow:    { s: 'blows',   past: 'blew',     part: 'blown',     ing: 'blowing' },
  grow:    { s: 'grows',   past: 'grew',     part: 'grown',     ing: 'growing' },
  know:    { s: 'knows',   past: 'knew',     part: 'known',     ing: 'knowing' },
  show:    { s: 'shows',   past: 'showed',   part: 'shown',     ing: 'showing' },
  give:    { s: 'gives',   past: 'gave',     part: 'given',     ing: 'giving' },
  forgive: { s: 'forgives',past: 'forgave',  part: 'forgiven',  ing: 'forgiving' },
  eat:     { s: 'eats',    past: 'ate',      part: 'eaten',     ing: 'eating' },
  fall:    { s: 'falls',   past: 'fell',     part: 'fallen',    ing: 'falling' },
  drink:   { s: 'drinks',  past: 'drank',    part: 'drunk',     ing: 'drinking' },
  sink:    { s: 'sinks',   past: 'sank',     part: 'sunk',      ing: 'sinking' },
  shrink:  { s: 'shrinks', past: 'shrank',   part: 'shrunk',    ing: 'shrinking' },
  begin:   { s: 'begins',  past: 'began',    part: 'begun',     ing: 'beginning' },
  swim:    { s: 'swims',   past: 'swam',     part: 'swum',      ing: 'swimming' },
  ring:    { s: 'rings',   past: 'rang',     part: 'rung',      ing: 'ringing' },
  sing:    { s: 'sings',   past: 'sang',     part: 'sung',      ing: 'singing' },
  spring:  { s: 'springs', past: 'sprang',   part: 'sprung',    ing: 'springing' },
  stick:   { s: 'sticks',  past: 'stuck',    part: 'stuck',     ing: 'sticking' },
  strike:  { s: 'strikes', past: 'struck',   part: 'struck',    ing: 'striking' },
  dig:     { s: 'digs',    past: 'dug',      part: 'dug',       ing: 'digging' },
  win:     { s: 'wins',    past: 'won',      part: 'won',       ing: 'winning' },
  spin:    { s: 'spins',   past: 'spun',     part: 'spun',      ing: 'spinning' },
  hang:    { s: 'hangs',   past: 'hung',     part: 'hung',      ing: 'hanging' },
  swing:   { s: 'swings',  past: 'swung',    part: 'swung',     ing: 'swinging' },
  cling:   { s: 'clings',  past: 'clung',    part: 'clung',     ing: 'clinging' },
  bend:    { s: 'bends',   past: 'bent',     part: 'bent',      ing: 'bending' },
  lend:    { s: 'lends',   past: 'lent',     part: 'lent',      ing: 'lending' },
  spend:   { s: 'spends',  past: 'spent',    part: 'spent',     ing: 'spending' },
  build2:  { s: 'builds',  past: 'built',    part: 'built',     ing: 'building' },
  sleep:   { s: 'sleeps',  past: 'slept',    part: 'slept',     ing: 'sleeping' },
  sweep:   { s: 'sweeps',  past: 'swept',    part: 'swept',     ing: 'sweeping' },
  creep:   { s: 'creeps',  past: 'crept',    part: 'crept',     ing: 'creeping' },
  meet:    { s: 'meets',   past: 'met',      part: 'met',       ing: 'meeting' },
  feed:    { s: 'feeds',   past: 'fed',      part: 'fed',       ing: 'feeding' },
  lead:    { s: 'leads',   past: 'led',      part: 'led',       ing: 'leading' },
  bleed:   { s: 'bleeds',  past: 'bled',     part: 'bled',      ing: 'bleeding' },
  breed:   { s: 'breeds',  past: 'bred',     part: 'bred',      ing: 'breeding' },
  hit:     { s: 'hits',    past: 'hit',      part: 'hit',       ing: 'hitting' },
  quit:    { s: 'quits',   past: 'quit',     part: 'quit',      ing: 'quitting' },
  split:   { s: 'splits',  past: 'split',    part: 'split',     ing: 'splitting' },
  shut:    { s: 'shuts',   past: 'shut',     part: 'shut',      ing: 'shutting' },
  set:     { s: 'sets',    past: 'set',      part: 'set',       ing: 'setting' },
  let:     { s: 'lets',    past: 'let',      part: 'let',       ing: 'letting' },
  cost:    { s: 'costs',   past: 'cost',     part: 'cost',      ing: 'costing' },
  hurt:    { s: 'hurts',   past: 'hurt',     part: 'hurt',      ing: 'hurting' },
  burst:   { s: 'bursts',  past: 'burst',    part: 'burst',     ing: 'bursting' },
  cast:    { s: 'casts',   past: 'cast',     part: 'cast',      ing: 'casting' },
  stand:   { s: 'stands',  past: 'stood',    part: 'stood',     ing: 'standing' },
  understand: { s: 'understands', past: 'understood', part: 'understood', ing: 'understanding' },
  withdraw:{ s: 'withdraws', past: 'withdrew', part: 'withdrawn', ing: 'withdrawing' },
  overhear:{ s: 'overhears', past: 'overheard', part: 'overheard', ing: 'overhearing' },
  rebuild: { s: 'rebuilds', past: 'rebuilt', part: 'rebuilt',   ing: 'rebuilding' },
  outrun:  { s: 'outruns', past: 'outran',   part: 'outrun',    ing: 'outrunning' },
  shoot:   { s: 'shoots',  past: 'shot',     part: 'shot',      ing: 'shooting' },
  choose:  { s: 'chooses', past: 'chose',    part: 'chosen',    ing: 'choosing' },
  freeze:  { s: 'freezes', past: 'froze',    part: 'frozen',    ing: 'freezing' },
  steal:   { s: 'steals',  past: 'stole',    part: 'stolen',    ing: 'stealing' },
  tear:    { s: 'tears',   past: 'tore',     part: 'torn',      ing: 'tearing' },
  wear:    { s: 'wears',   past: 'wore',     part: 'worn',      ing: 'wearing' },
  bear:    { s: 'bears',   past: 'bore',     part: 'borne',     ing: 'bearing' },
  swear:   { s: 'swears',  past: 'swore',    part: 'sworn',     ing: 'swearing' },
  lie:     { s: 'lies',    past: 'lay',      part: 'lain',      ing: 'lying' },
  lay:     { s: 'lays',    past: 'laid',     part: 'laid',      ing: 'laying' },
  flee:    { s: 'flees',   past: 'fled',     part: 'fled',      ing: 'fleeing' },
  deal:    { s: 'deals',   past: 'dealt',    part: 'dealt',     ing: 'dealing' },
  mean:    { s: 'means',   past: 'meant',    part: 'meant',     ing: 'meaning' },
  learn:   { s: 'learns',  past: 'learned',  part: 'learned',   ing: 'learning' },
  light:   { s: 'lights',  past: 'lit',      part: 'lit',       ing: 'lighting' },
  slide:   { s: 'slides',  past: 'slid',     part: 'slid',      ing: 'sliding' },
  hide:    { s: 'hides',   past: 'hid',      part: 'hidden',    ing: 'hiding' },
  bind:    { s: 'binds',   past: 'bound',    part: 'bound',     ing: 'binding' },
  wind:    { s: 'winds',   past: 'wound',    part: 'wound',     ing: 'winding' },
  grind:   { s: 'grinds',  past: 'ground',   part: 'ground',    ing: 'grinding' },
  shake:   { s: 'shakes',  past: 'shook',    part: 'shaken',    ing: 'shaking' },
  mistake: { s: 'mistakes',past: 'mistook',  part: 'mistaken',  ing: 'mistaking' },
  forget:  { s: 'forgets', past: 'forgot',   part: 'forgotten', ing: 'forgetting' },
  forbid:  { s: 'forbids', past: 'forbade',  part: 'forbidden', ing: 'forbidding' }
};

// Multi-word verbs. The particle has to survive inflection — "puts across", "picked up",
// "standing down" — which a single-token conjugator gets wrong by inflecting the particle.
const PHRASAL = /^([a-z]+)((?:\s+(?:up|down|in|out|off|on|over|across|through|back|away|by|to|about|around|apart|aside|ahead|along))+)$/;

/** -ing with the consonant-doubling and silent-e rules that make it read as English. */
export function gerund(v) {
  const ph = PHRASAL.exec(v);
  if (ph) return gerund(ph[1]) + ph[2];
  if (IRREGULAR_VERB[v]) return IRREGULAR_VERB[v].ing;
  if (/ie$/.test(v)) return v.slice(0, -2) + 'ying';
  if (/[^aeiou]e$/.test(v)) return v.slice(0, -1) + 'ing';
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(v)) return v + v.slice(-1) + 'ing';
  return v + 'ing';
}

export function regularPast(v) {
  if (/e$/.test(v)) return v + 'd';
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ied';
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(v)) return v + v.slice(-1) + 'ed';
  return v + 'ed';
}

export function third(v) {
  const ph = PHRASAL.exec(v);
  if (ph) return third(ph[1]) + ph[2];
  if (IRREGULAR_VERB[v]) return IRREGULAR_VERB[v].s;
  if (/(s|x|z|ch|sh|o)$/.test(v)) return v + 'es';
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies';
  return v + 's';
}

export function participle(v) {
  const ph = PHRASAL.exec(v);
  if (ph) return participle(ph[1]) + ph[2];
  return IRREGULAR_VERB[v] ? IRREGULAR_VERB[v].part : regularPast(v);
}

export function pastOf(v) {
  const ph = PHRASAL.exec(v);
  if (ph) return pastOf(ph[1]) + ph[2];
  return IRREGULAR_VERB[v] ? IRREGULAR_VERB[v].past : regularPast(v);
}

// Some "verbs" in the lexicon are really predicates that already carry their own copula or
// modal — "could use", "am short". Conjugating them again produces "could uses". The
// realiser detects them and passes them through, rewriting only the copula if it must.
const PRE_INFLECTED = /^(am|is|are|was|were|can|could|will|would|shall|should|may|might|must|had better|used to)\b/;

const MODALS = new Set(['can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must']);

/**
 * The copula, agreeing properly. Split out because five different code paths need it and
 * every one of them used to reimplement it slightly differently.
 */
export function copula(agr = {}, tense = 'pres') {
  const { person = 3, number = 'sg' } = agr;
  if (tense === 'past') return (number === 'sg' && person !== 2) ? 'was' : 'were';
  if (number === 'pl' || person === 2) return 'are';
  if (person === 1) return 'am';
  return 'is';
}

/**
 * Conjugate a verb for a semantic record.
 *
 * @param {string} v      base form, possibly phrasal ("stand down")
 * @param {object} agr
 *   person   1 | 2 | 3
 *   number   'sg' | 'pl'
 *   tense    'pres' | 'past' | 'fut'
 *   aspect   null | 'prog' | 'perf' | 'perfprog'
 *   modal    'can' | 'could' | 'will' | 'should' | 'must' | ...
 *   negated  true to insert not / -n't at the right depth
 *   voice    'active' | 'passive'
 */
export function conjugate(v, agr = {}) {
  if (!v) return '';
  if (PRE_INFLECTED.test(v)) return prefixedForm(v, agr);

  const {
    person = 3, number = 'sg', tense = 'pres', aspect = null,
    modal = null, negated = false, voice = 'active'
  } = agr;

  // Build the auxiliary chain outside-in: modal > perfect > progressive > passive > verb.
  const chain = [];
  let finiteDone = false;

  const finite = (word, pastWord) => {
    finiteDone = true;
    return tense === 'past' && pastWord ? pastWord : word;
  };

  if (modal && MODALS.has(modal)) {
    chain.push(modal);
    if (negated) chain.push('not');
    finiteDone = true;
  }

  if (aspect === 'perf' || aspect === 'perfprog') {
    const have = finiteDone ? 'have'
      : finite(person === 3 && number === 'sg' ? 'has' : 'have', 'had');
    chain.push(have);
    if (negated && !modal) chain.push('not');
    if (aspect === 'perfprog') chain.push('been');
  }

  if (aspect === 'prog' || aspect === 'perfprog') {
    if (aspect === 'prog') {
      const be = finiteDone ? 'be' : finite(copula({ person, number }), copula({ person, number }, 'past'));
      chain.push(be);
      if (negated && !modal) chain.push('not');
    }
    if (voice === 'passive') {
      chain.push('being', participle(v));
      return chain.join(' ');
    }
    chain.push(gerund(v));
    return chain.join(' ');
  }

  if (voice === 'passive') {
    const be = finiteDone || aspect === 'perf' ? (aspect === 'perf' ? 'been' : 'be')
      : finite(copula({ person, number }), copula({ person, number }, 'past'));
    chain.push(be);
    if (negated && !modal && !aspect) chain.push('not');
    chain.push(participle(v));
    return chain.join(' ');
  }

  if (aspect === 'perf') {
    chain.push(participle(v));
    return chain.join(' ');
  }

  if (modal) { chain.push(v); return chain.join(' '); }

  if (tense === 'fut') {
    chain.push('will');
    if (negated) chain.push('not');
    chain.push(v);
    return chain.join(' ');
  }

  // Simple tenses. Negation needs do-support, which is the one place English makes the
  // generator work for a living: "does not read", not "reads not".
  if (negated) {
    if (v === 'be') return `${copula({ person, number }, tense)} not`;
    if (v === 'have') return tense === 'past' ? 'did not have'
      : (person === 3 && number === 'sg' ? 'does not have' : 'do not have');
    if (tense === 'past') return `did not ${v}`;
    return `${person === 3 && number === 'sg' ? 'does' : 'do'} not ${v}`;
  }

  if (tense === 'past') return pastOf(v);
  if (person === 3 && number === 'sg') return third(v);
  return v;
}

/**
 * Verbs that already carry a modal or copula. "could use" stays "could use" in every
 * person; "am short" has to re-agree, because a topic writes it for a first-person speaker
 * and the realiser may put it in a third-person frame.
 */
function prefixedForm(v, agr = {}) {
  const m = /^(am|is|are|was|were)\b(.*)$/.exec(v);
  if (m) {
    const past = m[1] === 'was' || m[1] === 'were';
    return copula(agr, past || agr.tense === 'past' ? 'past' : 'pres') + m[2];
  }
  if (agr.negated) {
    const parts = v.split(' ');
    return [parts[0], 'not', ...parts.slice(1)].join(' ');
  }
  return v;
}

/** The infinitive with "to", handling the pre-inflected forms sensibly. */
export function infinitive(v) {
  if (!v) return '';
  if (PRE_INFLECTED.test(v)) return v.replace(PRE_INFLECTED, '').trim() || v;
  return `to ${v}`;
}

/** Imperative — the base form, which is also where negation is simplest. */
export function imperative(v, negated = false) {
  if (!v) return '';
  const base = PRE_INFLECTED.test(v) ? v.replace(PRE_INFLECTED, '').trim() : v;
  return negated ? `do not ${base}` : base;
}

// ── degree ───────────────────────────────────────────────────────────

const IRREGULAR_DEGREE = {
  good: ['better', 'best'], bad: ['worse', 'worst'], far: ['further', 'furthest'],
  little: ['less', 'least'], much: ['more', 'most'], many: ['more', 'most'],
  well: ['better', 'best']
};

const SYLLABLES = w => (String(w).toLowerCase().match(/[aeiouy]+/g) || []).length;

/** Comparative, choosing between -er and "more" the way a speaker does: by length. */
export function comparative(adj) {
  if (!adj) return '';
  if (IRREGULAR_DEGREE[adj]) return IRREGULAR_DEGREE[adj][0];
  if (/\s/.test(adj)) return `more ${adj}`;
  if (SYLLABLES(adj) >= 3) return `more ${adj}`;
  if (/e$/.test(adj)) return adj + 'r';
  if (/[^aeiou]y$/.test(adj)) return adj.slice(0, -1) + 'ier';
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(adj)) return adj + adj.slice(-1) + 'er';
  return adj + 'er';
}

export function superlative(adj) {
  if (!adj) return '';
  if (IRREGULAR_DEGREE[adj]) return `the ${IRREGULAR_DEGREE[adj][1]}`;
  if (/\s/.test(adj) || SYLLABLES(adj) >= 3) return `the most ${adj}`;
  if (/e$/.test(adj)) return `the ${adj}st`;
  if (/[^aeiou]y$/.test(adj)) return `the ${adj.slice(0, -1)}iest`;
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(adj)) return `the ${adj}${adj.slice(-1)}est`;
  return `the ${adj}est`;
}

/** Adverb from adjective, for the frames that want a manner slot. */
export function adverbise(adj) {
  const IRR = { good: 'well', fast: 'fast', hard: 'hard', late: 'late', early: 'early', straight: 'straight' };
  if (IRR[adj]) return IRR[adj];
  if (/\s/.test(adj)) return adj;
  if (/[^aeiou]y$/.test(adj)) return adj.slice(0, -1) + 'ily';
  if (/le$/.test(adj)) return adj.slice(0, -1) + 'y';
  if (/ic$/.test(adj)) return adj + 'ally';
  return adj + 'ly';
}

// ── number words ─────────────────────────────────────────────────────
//
// Radio says "a couple of contacts" far more often than "2 contacts", and the digits are
// what make generated speech read as a HUD readout rather than a voice. The realiser keeps
// the exact figure when precision matters (a price, a bearing, a hold count in a deal) and
// spells or vagues it when it does not.

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** Spell a whole number out to ninety-nine; above that, digits read better anyway. */
export function numberWord(n) {
  const i = Math.round(Number(n));
  if (!isFinite(i) || i < 0) return String(n);
  if (i < 20) return ONES[i];
  if (i < 100) {
    const t = TENS[Math.floor(i / 10)];
    const o = i % 10;
    return o ? `${t}-${ONES[o]}` : t;
  }
  if (i < 1000 && i % 100 === 0) return `${numberWord(i / 100)} hundred`;
  return i.toLocaleString('en-US');
}

const ORDINALS = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth',
  'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];

export function ordinal(n) {
  const i = Math.round(Number(n));
  if (i >= 0 && i < ORDINALS.length) return ORDINALS[i];
  const rem100 = i % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${i}th`;
  switch (i % 10) {
    case 1: return `${i}st`;
    case 2: return `${i}nd`;
    case 3: return `${i}rd`;
    default: return `${i}th`;
  }
}

/**
 * A vague quantity. Speech is imprecise on purpose: a pilot who says "eleven thousand two
 * hundred and forty units" is reading a screen aloud, and a pilot who says "the better part
 * of twelve thousand" is talking.
 */
export function vagueCount(n, opts = {}) {
  const { bucket = 'vague', rng = null } = opts;
  const i = Math.round(Number(n));
  if (!isFinite(i)) return String(n);
  if (i === 0) return chooseFrom(['nothing', 'none', 'not a thing'], `${bucket}:zero`, rng);
  if (i === 1) return chooseFrom(['one', 'a single one', 'just the one'], `${bucket}:one`, rng);
  if (i === 2) return chooseFrom(['two', 'a pair', 'a couple'], `${bucket}:two`, rng);
  if (i <= 4) return chooseFrom([numberWord(i), 'a few', 'three or four'], `${bucket}:few`, rng);
  if (i <= 9) return chooseFrom([numberWord(i), 'a handful', 'half a dozen or so'], `${bucket}:several`, rng);
  if (i <= 30) return chooseFrom([String(i), 'a dozen or two', 'a couple of dozen'], `${bucket}:many`, rng);
  if (i < 1000) return chooseFrom([String(i), `about ${Math.round(i / 10) * 10}`, `north of ${Math.floor(i / 100) * 100}`], `${bucket}:hundreds`, rng);
  const k = i / 1000;
  return chooseFrom([
    i.toLocaleString('en-US'),
    `${k >= 10 ? Math.round(k) : k.toFixed(1)}k`,
    `the better part of ${Math.ceil(k)} thousand`
  ], `${bucket}:thousands`, rng);
}

/**
 * a / an, decided on the *sound* rather than the letter.
 *
 * "an hour" and "a union" are the cases a letter test gets wrong, and a radio line that
 * says "a hour" is the kind of thing that reads as broken rather than as terse. Acronyms
 * spoken letter-by-letter take the article their letter *name* wants: "an S-class", "an
 * MHD tap", "a UN charter".
 */
export function article(word) {
  const raw = String(word || '').trim().split(/\s+/)[0].replace(/^[^A-Za-z0-9]+/, '');
  const w = raw.toLowerCase();
  if (!w) return 'a';
  if (/^\d/.test(w)) {
    // Numerals take the article of the word they are read as: "an 8", "a 1", "an 11".
    if (/^(8|11|18)/.test(w)) return 'an';
    return 'a';
  }
  // An all-caps token is read out as letters unless it is a pronounceable acronym.
  if (raw.length <= 5 && raw === raw.toUpperCase() && /^[A-Z]+$/.test(raw)) {
    return /^[AEFHILMNORSX]/.test(raw) ? 'an' : 'a';
  }
  if (/^(hour|honest|honou?r|heir|herb)/.test(w)) return 'an';
  if (/^(uni|use|user|usual|euro|one|once|ubiq|utility|eulog)/.test(w)) return 'a';
  return /^[aeiou]/.test(w) ? 'an' : 'a';
}

// ── pronouns ─────────────────────────────────────────────────────────
//
// A frame that wants to refer back to something it already mentioned needs the right case,
// and the difference between "gave it to I" and "gave it to me" is the difference between
// generated speech and speech.

const PRONOUN = {
  '1sg': { subj: 'I', obj: 'me', poss: 'my', possN: 'mine', refl: 'myself' },
  '1pl': { subj: 'we', obj: 'us', poss: 'our', possN: 'ours', refl: 'ourselves' },
  '2sg': { subj: 'you', obj: 'you', poss: 'your', possN: 'yours', refl: 'yourself' },
  '2pl': { subj: 'you', obj: 'you', poss: 'your', possN: 'yours', refl: 'yourselves' },
  '3sg': { subj: 'it', obj: 'it', poss: 'its', possN: 'its', refl: 'itself' },
  '3sgm': { subj: 'he', obj: 'him', poss: 'his', possN: 'his', refl: 'himself' },
  '3sgf': { subj: 'she', obj: 'her', poss: 'her', possN: 'hers', refl: 'herself' },
  '3pl': { subj: 'they', obj: 'them', poss: 'their', possN: 'theirs', refl: 'themselves' }
};

/** Pronoun lookup by agreement record and case. */
export function pronoun(agr = {}, kase = 'subj') {
  const { person = 3, number = 'sg', gender = null } = agr;
  let key = `${person}${number}`;
  if (person === 3 && number === 'sg' && gender) key += gender === 'f' ? 'f' : 'm';
  const set = PRONOUN[key] || PRONOUN['3sg'];
  return set[kase] || set.subj;
}

/** Agreement record for an already-realised subject string. Used by the frames. */
export function agreeWith(subject, fallback = { person: 3, number: 'sg' }) {
  if (!subject) return fallback;
  const s = String(subject).trim().toLowerCase();
  if (s === 'i') return { person: 1, number: 'sg' };
  if (s === 'we') return { person: 1, number: 'pl' };
  if (s === 'you') return { person: 2, number: 'sg' };
  if (s === 'they' || s === 'these' || s === 'those') return { person: 3, number: 'pl' };
  if (/^(he|she|it|that|this)$/.test(s)) return { person: 3, number: 'sg' };
  // "two contacts", "a pair of returns", "three of them" — leading numeral wins.
  if (/^(\d+|two|three|four|five|six|seven|eight|nine|ten|both|several|a few|a couple|a pair)\b/.test(s)) {
    return /^(1|one)\b/.test(s) ? { person: 3, number: 'sg' } : { person: 3, number: 'pl' };
  }
  if (/\b(and)\b/.test(s)) return { person: 3, number: 'pl' };
  // A bare plural head noun. Crude, but wrong far less often than assuming singular.
  const head = s.split(/\s+/).pop();
  if (/s$/.test(head) && !/(ss|us|is)$/.test(head) && !MASS_NOUNS.has(head)) {
    return { person: 3, number: 'pl' };
  }
  return fallback;
}

/**
 * Determiner + noun, agreeing in number, with the count/mass distinction respected.
 *
 * det: 'indef' | 'def' | 'none' | 'poss' | 'dem' | 'some' | 'any' | 'no' | 'partitive'
 */
export function np(noun, opts = {}) {
  const {
    count = 1, det = 'indef', adj = null, owner = 'my',
    ofPhrase = null, spellNumber = false
  } = opts;
  const mass = opts.mass != null ? opts.mass : isMass(noun);
  const head = mass ? noun : plural(noun, count);
  const withAdj = adj ? `${adj} ${head}` : head;
  const tail = ofPhrase ? ` ${ofPhrase}` : '';

  switch (det) {
    case 'none':
      return withAdj + tail;
    case 'def':
      return `the ${withAdj}${tail}`;
    case 'poss':
      return `${owner} ${withAdj}${tail}`;
    case 'dem':
      return `${count > 1 && !mass ? 'those' : 'that'} ${withAdj}${tail}`;
    case 'some':
      return `some ${withAdj}${tail}`;
    case 'any':
      return `any ${withAdj}${tail}`;
    case 'no':
      return `no ${withAdj}${tail}`;
    case 'partitive':
      return `${article('load')} load of ${withAdj}${tail}`;
    default:
      break;
  }
  if (mass) return `${withAdj}${tail}`;
  if (count > 1) {
    const num = spellNumber ? numberWord(count) : String(count);
    return `${num} ${withAdj}${tail}`;
  }
  return `${article(adj || head)} ${withAdj}${tail}`;
}

/** Possessive of a proper name — "Bulk Hauler 02's board", "Atlas's berth". */
export function possessive(name) {
  const s = String(name || '');
  if (!s) return '';
  return /s$/.test(s) ? `${s}'` : `${s}'s`;
}

/**
 * Join a list the way a person reads one out. Two items take "and"; more take commas and
 * a final "and"; a long list gets truncated, because nobody reads nine things over comms.
 */
export function listOf(items, opts = {}) {
  const arr = (items || []).filter(Boolean).map(String);
  const { conj = 'and', max = 3, more = 'a few others' } = opts;
  if (!arr.length) return '';
  if (arr.length === 1) return arr[0];
  if (arr.length > max) {
    const shown = arr.slice(0, max);
    return `${shown.join(', ')} ${conj} ${more}`;
  }
  if (arr.length === 2) return `${arr[0]} ${conj} ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')} ${conj} ${arr[arr.length - 1]}`;
}

// ═════════════════════════════════════════════════════════════════════
//  2. THE LEXICON
// ═════════════════════════════════════════════════════════════════════
//
// Synonym sets, not single words. Every entry is a set the realiser draws from, which is
// where most of the variety comes from: the same frame with a different verb choice reads
// as a different sentence, and no sentence has to be written twice.
//
// The sets are keyed by *sense*, not by word, so a topic asks for `verb.move` and never has
// to know which of four words it will get. That indirection is what lets the vocabulary
// grow without touching a single topic.

export const LEX = {
  verb: {
    work:     ['work', 'run', 'cut', 'push', 'chew'],
    move:     ['move', 'shift', 'run', 'shuttle', 'ferry'],
    watch:    ['watch', 'cover', 'hold', 'mind', 'keep eyes on'],
    find:     ['find', 'read', 'pick up', 'catch', 'paint'],
    give:     ['pass', 'send', 'hand', 'put across', 'relay'],
    need:     ['need', 'want', 'could use', 'am short'],
    report:   ['read', 'show', 'log', 'mark', 'call'],
    leave:    ['leave', 'clear', 'break off', 'stand down', 'peel off'],
    arrive:   ['arrive', 'come in', 'make station', 'come alongside', 'close'],
    wait:     ['wait', 'hold', 'sit tight', 'stand by', 'hold station'],
    fight:    ['fight', 'engage', 'trade fire', 'go to guns', 'push back'],
    flee:     ['run', 'burn out', 'break contact', 'get clear', 'cut and go'],
    help:     ['help', 'lend a hand', 'cover', 'back up', 'assist'],
    repair:   ['patch', 'fix', 'weld', 'nurse', 'put right'],
    scan:     ['sweep', 'ping', 'paint', 'run a scan on', 'look over'],
    dock:     ['dock', 'put in', 'tie up', 'come alongside', 'take a berth'],
    load:     ['load', 'fill', 'top off', 'take on', 'stow'],
    unload:   ['unload', 'break bulk', 'drop', 'set down', 'discharge'],
    sell:     ['sell', 'move', 'shift', 'let go of', 'off-load'],
    buy:      ['buy', 'take', 'pick up', 'lift', 'clear'],
    pay:      ['pay', 'settle', 'square', 'cover', 'make good on'],
    owe:      ['owe', 'am into you for', 'carry a debt on', 'have a marker with'],
    promise:  ['promise', 'give my word on', 'stand behind', 'guarantee'],
    refuse:   ['pass on', 'sit out', 'want no part of', 'decline'],
    agree:    ['agree', 'go along with', 'take it', 'sign for'],
    warn:     ['warn', 'flag', 'call out', 'put out word on'],
    lie:      ['spin it', 'sell a story', 'shade the truth', 'dress it up'],
    know:     ['know', 'have heard', 'have a line on', 'have read'],
    think:    ['think', 'reckon', 'figure', 'read it that'],
    remember: ['remember', 'have logged', 'have not forgotten', 'carry'],
    forget:   ['forget', 'let go', 'drop', 'wipe'],
    mine:     ['cut', 'work', 'pull', 'strip', 'break'],
    haul:     ['haul', 'run', 'lift', 'carry', 'move'],
    build:    ['build', 'lay', 'put up', 'raise', 'stand up'],
    patrol:   ['patrol', 'sweep', 'walk the lane', 'sit the corridor', 'cover the leg'],
    trade:    ['trade', 'deal', 'do business', 'swap', 'barter'],
    escort:   ['escort', 'ride along with', 'shepherd', 'walk in'],
    drift:    ['drift', 'coast', 'hang', 'float', 'sit'],
    burn:     ['burn', 'push throttle', 'light the drive', 'run hot'],
    fail:     ['fail', 'give out', 'pack in', 'die on me', 'let go'],
    hold:     ['hold', 'keep', 'sit on', 'maintain'],
    lose:     ['lose', 'drop', 'let slip', 'give up'],
    ask:      ['ask', 'raise', 'put it to', 'sound out'],
    answer:   ['answer', 'come back', 'reply', 'get back to']
  },

  noun: {
    ore:      ['ore', 'rock', 'grade', 'cut', 'material'],
    face:     ['face', 'seam', 'rock', 'claim', 'cut'],
    hold:     ['hold', 'bay', 'can', 'bin'],
    lane:     ['lane', 'corridor', 'run', 'transit', 'leg'],
    contact:  ['contact', 'return', 'signature', 'blip', 'track'],
    berth:    ['berth', 'dock', 'ring', 'pad', 'cradle'],
    trouble:  ['trouble', 'company', 'a problem', 'attention', 'grief'],
    work:     ['work', 'a job', 'a run', 'a charter', 'a contract'],
    ship:     ['ship', 'hull', 'boat', 'bird', 'can'],
    crew:     ['crew', 'hands', 'people', 'watch'],
    station:  ['station', 'ring', 'the yard', 'the platform'],
    price:    ['price', 'number', 'rate', 'ask', 'figure'],
    profit:   ['margin', 'spread', 'cut', 'take'],
    loss:     ['loss', 'hit', 'shortfall', 'write-off'],
    fuel:     ['fuel', 'reaction mass', 'propellant', 'burn'],
    damage:   ['damage', 'holes', 'a beating', 'a working over'],
    repair:   ['a patch', 'a weld', 'yard time', 'a refit'],
    threat:   ['a threat', 'guns', 'hostiles', 'raiders'],
    friend:   ['a friend', 'a neighbour', 'somebody decent', 'one of ours'],
    stranger: ['a stranger', 'an unflagged hull', 'somebody new', 'an independent'],
    rumour:   ['word', 'a rumour', 'talk', 'chatter', 'a story'],
    tip:      ['a tip', 'a line', 'something worth knowing', 'a lead'],
    favour:   ['a favour', 'a marker', 'one', 'a debt'],
    scanner:  ['the scope', 'the board', 'the sweep', 'the array'],
    weather:  ['the weather', 'the flux', 'the storm front', 'the belt weather'],
    debris:   ['debris', 'wreckage', 'scrap', 'junk'],
    escort:   ['an escort', 'cover', 'a wing', 'a shadow'],
    delay:    ['a delay', 'a hold', 'a wait', 'slack'],
    route:    ['a route', 'a heading', 'a track', 'a course'],
    beacon:   ['the beacon', 'the marker', 'the buoy', 'the light'],
    signal:   ['a signal', 'a carrier', 'a squawk', 'a tone'],
    deal:     ['a deal', 'terms', 'an arrangement', 'a handshake'],
    warning:  ['a warning', 'a heads up', 'notice', 'a flag']
  },

  adj: {
    good:     ['good', 'clean', 'fat', 'better than posted', 'worth the burn'],
    bad:      ['thin', 'poor', 'picked over', 'not worth the burn', 'rough'],
    quiet:    ['quiet', 'clear', 'dead', 'empty', 'still'],
    busy:     ['busy', 'crowded', 'lit up', 'noisy', 'stacked'],
    fast:     ['fast', 'quick', 'hot', 'hard-burning'],
    slow:     ['slow', 'heavy', 'sluggish', 'loaded down'],
    safe:     ['safe', 'covered', 'clean', 'buttoned up'],
    dangerous:['dangerous', 'hot', 'ugly', 'no place to sit'],
    cheap:    ['cheap', 'soft', 'down', 'below the posted'],
    expensive:['dear', 'steep', 'up', 'over the posted'],
    damaged:  ['holed', 'chewed up', 'leaking', 'in a bad way'],
    new:      ['new', 'fresh', 'just in', 'unlogged'],
    old:      ['old', 'stale', 'from last cycle', 'long in the tooth'],
    reliable: ['solid', 'straight', 'good for it', 'sound'],
    shifty:   ['slippery', 'light on the truth', 'not to be trusted', 'crooked'],
    tired:    ['tired', 'run down', 'about done', 'out on my feet'],
    ready:    ['ready', 'buttoned up', 'good to go', 'squared away'],
    close:    ['close', 'right on top of us', 'inside the marker', 'near'],
    distant:  ['a long way out', 'off the edge of the board', 'well out', 'distant']
  },

  adv: {
    now:      ['now', 'right now', 'this minute', 'as we speak'],
    soon:     ['soon', 'shortly', 'inside the hour', 'before long'],
    later:    ['later', 'next pass', 'when I am back through', 'down the line'],
    always:   ['always', 'every time', 'without fail'],
    never:    ['never', 'not once', 'not in my log'],
    quickly:  ['quick', 'fast', 'in a hurry', 'without hanging about'],
    carefully:['careful', 'easy', 'slow and clean', 'by the book'],
    barely:   ['barely', 'only just', 'by a hair', 'not by much'],
    badly:    ['badly', 'hard', 'more than I like']
  },

  prep: {
    at:       ['at', 'off', 'out by', 'over at'],
    toward:   ['toward', 'on to', 'inbound for', 'headed for'],
    from:     ['from', 'out of', 'away from', 'off'],
    near:     ['near', 'close to', 'a short burn from', 'just off'],
    inside:   ['inside', 'within', 'in under'],
    beyond:   ['past', 'beyond', 'the far side of', 'out past']
  },

  // Discourse markers, split by register. A terse ship does not say "as it happens".
  // A *marker* leads a clause and the clause continues in lower case: "Look, the face reads
  // well." `LEX.ack` below is the other thing — whole sentences, used as the body of an
  // acknowledgement, not as furniture in front of one. Terse register had `Right.` and
  // `Copy.` filed here as markers, which is what produced "Copy. are you holding?" on the
  // radio: a full stop followed by a lowercased word, on every terse line, for four slices.
  marker: {
    terse:    ['', '', '', 'Right,', 'Listen,'],
    plain:    ['', 'Look,', 'Listen,', 'For what it is worth,', 'Thing is,'],
    warm:     ['', 'Hey,', 'Right then,', 'Tell you what,', 'Here is the thing,'],
    formal:   ['', 'Be advised,', 'For the record,', 'Note that', 'Advising,'],
    gruff:    ['', '', 'Look,', 'I will say it once,'],
    wry:      ['', 'Funnily enough,', 'Would you believe it,', 'Naturally,'],
    anxious:  ['', 'Look,', 'I do not want to make a thing of it, but', 'Quick one,']
  },
  hedge: {
    terse:    ['', ''],
    plain:    ['', 'I think', 'near enough', 'give or take'],
    warm:     ['', 'if you ask me', 'near enough', 'I reckon'],
    formal:   ['', 'approximately', 'to a first pass', 'nominally'],
    gruff:    ['', 'or thereabouts'],
    wry:      ['', 'allegedly', 'so they tell me', 'in theory'],
    anxious:  ['', 'I think', 'unless I am reading it wrong', 'maybe']
  },
  ack: {
    terse:    ['Copy.', 'Received.', 'Acknowledged.', 'Logged.'],
    plain:    ['Copy that.', 'Understood.', 'Got it.', 'Noted.'],
    warm:     ['Got you.', 'Fair enough.', 'Right you are.', 'Cheers.'],
    formal:   ['Acknowledged.', 'Received and logged.', 'Understood.', 'Noted for the record.'],
    gruff:    ['Heard.', 'Fine.', 'If you say so.', 'Noted.'],
    wry:      ['Wonderful.', 'Duly noted.', 'Of course it is.', 'Lovely.'],
    anxious:  ['Okay.', 'Right, okay.', 'Understood.', 'Copy, copy.']
  },
  // Openers used when a channel is being opened cold, before anything has been said.
  hail: {
    terse:    ['{b}.', '{b}, go.', '{b}, on you.'],
    plain:    ['{b}, this is {a}.', '{b}, {a}.', 'Channel up, {b}.'],
    warm:     ['{b}, it is {a}.', 'There you are, {b}.', '{b}! {a} here.'],
    formal:   ['{b}, {a} transmitting.', '{b}, this is {a} on local.', '{a} calling {b}.'],
    gruff:    ['{b}.', '{b}, listen up.'],
    wry:      ['{b}, your favourite voice.', '{b}, guess who.'],
    anxious:  ['{b}? {a} here.', '{b}, are you reading me?']
  },
  // Sign-offs, used to close an exchange rather than to answer anything in it.
  signoff: {
    terse:    ['Out.', 'Clear.', '{a} out.'],
    plain:    ['{a} out.', 'Clear on this end.', 'That is all I had.'],
    warm:     ['Safe burns.', 'Mind yourself out there.', 'See you at the ring.'],
    formal:   ['{a} clear.', 'Ending transmission.', 'Nothing further.'],
    gruff:    ['Out.', 'Done talking.'],
    wry:      ['Try not to explode.', 'Do keep in touch.'],
    anxious:  ['Okay. Out.', 'I will be on this band if you need me.']
  },
  // Interjections. Used sparingly — one per exchange at most, enforced downstream.
  interject: {
    terse:    [''],
    plain:    ['', 'Well.', 'Right.'],
    warm:     ['', 'Ha.', 'Oh, good.', 'Nice one.'],
    formal:   [''],
    gruff:    ['', 'Hm.'],
    wry:      ['', 'Ha.', 'Oh, marvellous.'],
    anxious:  ['', 'Uh.', 'Right.']
  }
};

// Contractions, applied late so the frames can stay written in full forms and stay legible.
// Register decides how often they fire — a coalition officer speaks in full forms on an
// open band, and a belt miner does not.
// The auxiliary contractions carry a lookahead: a clause-final auxiliary cannot contract,
// because the contracted form is not a word anybody can end a sentence on. "Right you are."
// contracted to "Right you're." — a real transmission, and the reason the lookahead exists.
// Matched case-insensitively and re-cased on the way out: the same clause can appear
// sentence-initial ("You are burning hot") or mid-clause ("Look, you are burning hot"), and
// a case-sensitive table silently contracts only half of them.
const NEXT = String.raw`(?=\s+[A-Za-z0-9])`;
const recase = (src, out) => (/^[A-Z]/.test(src) ? out.charAt(0).toUpperCase() + out.slice(1) : out);
// The perfect auxiliary: only ahead of a participle, "got", or "been".
const PERF_NEXT = String.raw`(?=\s+(?:got|been|already|never|not)\b|\s+[a-z]+(?:ed|en|un|ne|ad|ft|pt|ld|me|it|st)\b)`;
const perf = (phrase, short) => [
  new RegExp(String.raw`\b${phrase}\b` + PERF_NEXT, 'gi'),
  mm => recase(mm, short)
];
const aux = (phrase, short) => [
  new RegExp(String.raw`\b${phrase}\b` + NEXT, 'gi'),
  mm => recase(mm, short)
];

const CONTRACTIONS = [
  aux('I am', "I'm"), aux('you are', "you're"), aux('we are', "we're"),
  aux('they are', "they're"), aux('it is', "it's"), aux('that is', "that's"),
  aux('there is', "there's"), aux('what is', "what's"), aux('here is', "here's"),
  // "have" only contracts as an auxiliary. "I've a full hold" is not what a working ship
  // says — "I have a full hold" is — so the perfect-aspect lookahead is required here.
  perf('I have', "I've"), perf('you have', "you've"), perf('we have', "we've"),
  aux('I will', "I'll"), aux('you will', "you'll"), aux('we will', "we'll"),
  aux('it will', "it'll"), aux('they will', "they'll"),
  [/\bdo not\b/g, "don't"], [/\bdoes not\b/g, "doesn't"], [/\bdid not\b/g, "didn't"],
  [/\bis not\b/g, "isn't"], [/\bare not\b/g, "aren't"], [/\bwas not\b/g, "wasn't"],
  [/\bwere not\b/g, "weren't"], [/\bhave not\b/g, "haven't"], [/\bhas not\b/g, "hasn't"],
  [/\bhad not\b/g, "hadn't"], [/\bcannot\b/g, "can't"], [/\bcan not\b/g, "can't"],
  [/\bcould not\b/g, "couldn't"], [/\bwould not\b/g, "wouldn't"],
  [/\bshould not\b/g, "shouldn't"], [/\bwill not\b/g, "won't"],
  [/\bI would\b/g, "I'd"], [/\bthey are not\b/g, "they aren't"]
];

/** Apply contractions at a probability set by register. */
export function contract(text, rate = 0.5, rng = null) {
  if (!text || rate <= 0) return text;
  let out = text;
  for (const [re, sub] of CONTRACTIONS) {
    if (!re.test(out)) { re.lastIndex = 0; continue; }
    re.lastIndex = 0;
    const draw = rng ? rng.next() : stream('npc-grammar-contract').next();
    if (draw < rate) out = out.replace(re, sub);
  }
  return out;
}

// ═════════════════════════════════════════════════════════════════════
//  3. REGISTER
// ═════════════════════════════════════════════════════════════════════
//
// Which register a ship speaks in is a property of the ship, not of the line, so the same
// character sounds like itself across every topic it ever raises. Derived from role and
// faction rather than stored, so it needs no migration and cannot drift out of step with
// the unit it describes.
//
// v1.02.10 adds three registers and, more usefully, a *profile* per register: the numeric
// dials the realiser reads. Two ships in the same register still differ, because the
// profile is perturbed by a per-ship hash — a stable idiolect that costs no save space.

export const REGISTERS = ['terse', 'plain', 'warm', 'formal', 'gruff', 'wry', 'anxious'];

export const REGISTER_PROFILE = {
  terse:   { marker: 0.18, hedge: 0.05, contract: 0.30, dropSubject: 0.55, vocative: 0.25, maxWords: 9,  signoff: 0.20, interject: 0.02 },
  plain:   { marker: 0.45, hedge: 0.30, contract: 0.55, dropSubject: 0.25, vocative: 0.40, maxWords: 16, signoff: 0.12, interject: 0.10 },
  warm:    { marker: 0.60, hedge: 0.40, contract: 0.75, dropSubject: 0.15, vocative: 0.60, maxWords: 20, signoff: 0.25, interject: 0.20 },
  formal:  { marker: 0.55, hedge: 0.25, contract: 0.05, dropSubject: 0.05, vocative: 0.55, maxWords: 22, signoff: 0.30, interject: 0.00 },
  gruff:   { marker: 0.25, hedge: 0.10, contract: 0.60, dropSubject: 0.45, vocative: 0.20, maxWords: 11, signoff: 0.15, interject: 0.08 },
  wry:     { marker: 0.50, hedge: 0.35, contract: 0.70, dropSubject: 0.20, vocative: 0.35, maxWords: 18, signoff: 0.18, interject: 0.25 },
  anxious: { marker: 0.55, hedge: 0.55, contract: 0.65, dropSubject: 0.10, vocative: 0.50, maxWords: 17, signoff: 0.10, interject: 0.22 }
};

/**
 * Register for a unit, read off what the unit already is.
 *
 * Order matters: the most specific condition wins, and stress is checked before role
 * because a holed miner does not sound like a working one. The `mood` override lets
 * systems/npc-comms.js push a character into a register for one exchange — a taunt from a
 * normally formal patrol, for instance — without mutating the unit.
 */
export function registerOf(u, mood = null) {
  if (!u) return 'plain';
  if (mood && REGISTER_PROFILE[mood]) return mood;
  if (u.register && REGISTER_PROFILE[u.register]) return u.register;

  const hp = (u.maxHp ? u.hp / u.maxHp : 1);
  if (hp < 0.35) return 'anxious';

  if (u.faction === 'hostile' || u.faction === 'pirate') {
    return u.rank === 'captain' || u.role === 'boss' ? 'wry' : 'terse';
  }
  if (u.faction === 'coalition' || u.role === 'fort' || u.role === 'patrol') return 'formal';
  if (u.faction === 'independent' && u.role === 'trade') return 'wry';
  if (u.role === 'mine' || u.role === 'haul' || u.role === 'build') return 'warm';
  if (u.role === 'combat' || u.role === 'merc') return 'terse';
  if (u.role === 'salvage' || u.role === 'scrap') return 'gruff';
  return 'plain';
}

/**
 * The dials for a speaker: the register profile, nudged by a stable per-ship hash so two
 * warm miners are not identical, and by the situation the line is spoken in.
 *
 * @param {object} u      the speaker unit
 * @param {string} reg    resolved register
 * @param {object} ctx    { urgent, hp, familiarity, hostile }
 */
export function profileFor(u, reg, ctx = {}) {
  const base = REGISTER_PROFILE[reg] || REGISTER_PROFILE.plain;
  const p = Object.assign({}, base);
  const name = String((u && u.name) || 'unknown');
  // FNV-ish, inline so this file does not need to import the hash from core.
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) { h ^= name.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  const jitter = (k) => (((h >>> (k * 3)) & 0xff) / 255 - 0.5) * 0.18;

  p.marker = clamp01(p.marker + jitter(1));
  p.hedge = clamp01(p.hedge + jitter(2));
  p.contract = clamp01(p.contract + jitter(3));
  p.dropSubject = clamp01(p.dropSubject + jitter(4));
  p.vocative = clamp01(p.vocative + jitter(5));

  // Urgency strips furniture. Nobody says "for what it is worth" while being shot at.
  if (ctx.urgent) {
    p.marker *= 0.3; p.hedge *= 0.2; p.signoff *= 0.2;
    p.dropSubject = clamp01(p.dropSubject + 0.25);
    p.maxWords = Math.max(6, Math.round(p.maxWords * 0.7));
  }
  // Familiarity shortens. People who talk daily stop introducing themselves.
  if (ctx.familiarity > 3) { p.vocative *= 0.6; p.maxWords = Math.round(p.maxWords * 0.9); }
  if (ctx.familiarity > 10) { p.marker *= 0.8; p.contract = clamp01(p.contract + 0.1); }
  // Hostility hardens: fewer hedges, more vocatives (you name someone to needle them).
  if (ctx.hostile) { p.hedge *= 0.3; p.vocative = clamp01(p.vocative + 0.15); }
  return p;
}

const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);

// ═════════════════════════════════════════════════════════════════════
//  4. CHOOSING WITHOUT REPEATING
// ═════════════════════════════════════════════════════════════════════
//
// The anti-repetition memory. Keyed by a caller-supplied bucket — usually speaker + topic —
// it refuses to hand back anything used recently in that bucket until the pool would be
// exhausted, at which point it forgets the oldest and carries on. That is what stops the
// radio being a tape loop without needing an enormous corpus: n frames give n distinct
// utterances in a row rather than a coin flip that lands on the same one twice.
//
// v1.02.10 adds a global recent-string window on top. Bucket memory stops a *speaker*
// repeating itself; it does nothing about six different ships reaching for the same good
// phrase inside a minute, which is what the comms log actually looked like. The window is
// small, cheap, and checked at the end of `realise` rather than inside the chooser, because
// the thing that repeats audibly is the finished sentence and not the word it was built on.

const recent = new Map();   // bucket -> array of recently used keys, newest last
const recentLines = [];     // finished utterances, newest last
const RECENT_LINE_CAP = 24;

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

/**
 * Weighted variant. Some frames are better than others for a given record — a frame that
 * uses every fact present beats one that throws half of them away — and the realiser wants
 * to prefer without ever becoming deterministic.
 */
export function chooseWeighted(items, weightOf, bucket = 'default', rng = null) {
  if (!Array.isArray(items) || !items.length) return null;
  const seen = recent.get(bucket) || [];
  const scored = items.map(it => {
    let w = Math.max(0.0001, weightOf(it));
    if (seen.includes(keyOf(it))) w *= 0.12;        // strongly discouraged, not forbidden
    return { it, w };
  });
  const total = scored.reduce((s, x) => s + x.w, 0);
  let draw = (rng ? rng.next() : stream('npc-grammar').next()) * total;
  let pick = scored[scored.length - 1].it;
  for (const s of scored) { draw -= s.w; if (draw <= 0) { pick = s.it; break; } }

  const next = seen.concat([keyOf(pick)]);
  while (next.length > Math.max(1, items.length - 1)) next.shift();
  recent.set(bucket, next);
  return pick;
}

const keyOf = x => (typeof x === 'string' ? x : (x && (x.id || x.frame)) || JSON.stringify(x));

/** Has this exact sentence gone out over comms in the last two dozen transmissions? */
export function saidRecently(line) {
  const norm = normaliseForCompare(line);
  return recentLines.includes(norm);
}

function rememberLine(line) {
  recentLines.push(normaliseForCompare(line));
  while (recentLines.length > RECENT_LINE_CAP) recentLines.shift();
}

const normaliseForCompare = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

/** Wipe the repetition memory. Called on a new game; also useful in tests. */
export function resetGrammarMemory() {
  recent.clear();
  recentLines.length = 0;
}

/**
 * Serialise the repetition memory so a save reloads into the same conversational state.
 * Bounded on purpose: the point is to avoid an immediate repeat after a load, not to
 * reconstruct the whole history of the galaxy's small talk.
 */
export function serialiseGrammarMemory(maxBuckets = 200) {
  const buckets = {};
  let n = 0;
  for (const [k, v] of recent) {
    if (n++ >= maxBuckets) break;
    buckets[k] = v.slice(-3);
  }
  return { v: 1, buckets, lines: recentLines.slice(-12) };
}

export function restoreGrammarMemory(blob) {
  resetGrammarMemory();
  if (!blob || typeof blob !== 'object') return false;
  const b = blob.buckets || {};
  for (const k of Object.keys(b)) if (Array.isArray(b[k])) recent.set(k, b[k].slice(-8));
  if (Array.isArray(blob.lines)) for (const l of blob.lines) recentLines.push(l);
  return true;
}

/** Diagnostics for the debug overlay: how much variety is the radio actually producing? */
export function grammarStats() {
  return {
    buckets: recent.size,
    trackedLines: recentLines.length,
    frames: FRAMES.length,
    acts: [...new Set(FRAMES.flatMap(f => f.acts))].sort(),
    lexSenses: Object.keys(LEX.verb).length + Object.keys(LEX.noun).length + Object.keys(LEX.adj).length
  };
}

// ═════════════════════════════════════════════════════════════════════
//  5. SYNTAX FRAMES
// ═════════════════════════════════════════════════════════════════════
//
// A frame is a function of the semantic record, not a string with holes in it. That is the
// difference that matters: a frame can decide *not* to mention a fact it was not given,
// reorder to put the important thing first, or drop the subject entirely the way real radio
// does — none of which a template can do.
//
// Fields:
//   id        stable, used by the repetition memory and by tests
//   acts      the speech acts this frame can express
//   needs     slots that must be present, or the frame is not a candidate at all
//   wants     slots that are not required but that this frame uses well; each one present
//             raises the frame's score, so a record carrying a place adverbial prefers a
//             frame that says where over one that throws it away
//   avoid     slots this frame cannot express; each one present lowers the score, because
//             choosing it silently discards information the topic wanted said
//   regs      registers this frame suits; a match is a bonus, not a filter
//   weight    baseline preference
//   build     (m, g) -> string
//
// `g` is the realiser's helper bag: cap, pick, lex, num, rng.

// Words that carry no content of their own. A frame that would repeat one back has nothing
// to say and should stand aside for one that does.
const DEICTIC = /^(that|this|it|them|those|these|you|one)\.?$/i;

export const FRAMES = [
  // ── informing ──────────────────────────────────────────────────────
  {
    id: 'inform-svo', acts: ['inform', 'tip', 'report'],
    needs: ['subject', 'verb'], wants: ['object', 'where'], weight: 1.0,
    build: (m, g) => `${g.cap(m.subject)} ${conjugate(m.verb, m.agr)}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'inform-fronted', acts: ['inform', 'tip', 'report'],
    needs: ['where', 'subject', 'verb'], wants: ['object'], weight: 0.9,
    build: (m, g) => `${g.cap(m.where)}, ${m.subject} ${conjugate(m.verb, m.agr)}${m.object ? ' ' + m.object : ''}.`
  },
  {
    id: 'inform-existential', acts: ['inform', 'tip', 'report'],
    needs: ['object'], wants: ['where'], avoid: ['verb'], weight: 0.85,
    build: (m, g) => `There ${m.count > 1 || agreeWith(m.object).number === 'pl' ? 'are' : 'is'} ${m.object}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'inform-verbless', acts: ['inform', 'tip', 'report'],
    needs: ['object'], wants: ['where'], avoid: ['verb'], weight: 0.8,
    regs: ['terse', 'gruff'],
    // Radio drops the copula constantly. "Two contacts, bearing on the lane."
    build: (m, g) => `${g.cap(m.object)}${m.where ? ', ' + m.where : ''}.`
  },
  {
    id: 'inform-perfect', acts: ['inform', 'report'],
    needs: ['subject', 'verb'], wants: ['object'], weight: 0.7,
    build: (m, g) => `${g.cap(m.subject)} ${conjugate(m.verb, Object.assign({}, m.agr, { aspect: 'perf' }))}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'inform-progressive', acts: ['inform', 'report'],
    needs: ['subject', 'verb'], wants: ['object', 'where'], weight: 0.85,
    build: (m, g) => `${g.cap(m.subject)} ${conjugate(m.verb, Object.assign({}, m.agr, { aspect: 'prog' }))}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'inform-cleft', acts: ['inform', 'tip'],
    needs: ['object', 'subject', 'verb'], weight: 0.5, regs: ['plain', 'wry', 'formal'],
    // "What I have is a full hold." Puts the new information at the end, where speech
    // naturally puts it.
    build: (m, g) => `What ${m.subject} ${conjugate(m.verb, m.agr)} is ${m.object}.`
  },
  {
    id: 'inform-modal', acts: ['inform', 'tip'],
    needs: ['subject', 'verb', 'modal'], wants: ['object', 'where'], weight: 0.6,
    build: (m, g) => `${g.cap(m.subject)} ${conjugate(m.verb, Object.assign({}, m.agr, { modal: m.modal }))}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'inform-negated', acts: ['inform', 'report'],
    needs: ['subject', 'verb', 'negated'], wants: ['object'], weight: 0.7,
    build: (m, g) => `${g.cap(m.subject)} ${conjugate(m.verb, Object.assign({}, m.agr, { negated: true }))}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'inform-because', acts: ['inform', 'report'],
    needs: ['subject', 'verb', 'because'], wants: ['object'], weight: 0.55,
    build: (m, g) => `${g.cap(m.subject)} ${conjugate(m.verb, m.agr)}${m.object ? ' ' + m.object : ''} because ${m.because}.`
  },
  {
    id: 'inform-contrast', acts: ['inform', 'report', 'tip'],
    needs: ['object', 'but'], weight: 0.5,
    build: (m, g) => `${g.cap(m.object)}, but ${m.but}.`
  },
  {
    id: 'inform-comparative', acts: ['inform', 'tip'],
    needs: ['subject', 'quality'], wants: ['than'], weight: 0.55,
    build: (m, g) => `${g.cap(m.subject)} is ${comparative(m.quality)}${m.than ? ' than ' + m.than : ' than it was'}.`
  },
  {
    id: 'inform-time', acts: ['inform', 'report'],
    needs: ['subject', 'verb', 'when'], wants: ['object'], weight: 0.6,
    build: (m, g) => `${g.cap(m.when)} ${m.subject} ${conjugate(m.verb, m.agr)}${m.object ? ' ' + m.object : ''}.`
  },
  {
    id: 'inform-result', acts: ['inform', 'report'],
    needs: ['object', 'so'], weight: 0.5,
    build: (m, g) => `${g.cap(m.object)}, so ${m.so}.`
  },

  // ── asking ─────────────────────────────────────────────────────────
  {
    id: 'ask-polar', acts: ['ask'],
    needs: ['verb'], wants: ['object', 'where'], weight: 1.0,
    build: (m, g) => {
      const second = m.agr && m.agr.person === 2;
      const subj = second ? 'you' : (m.subject || 'it');
      const be = second ? 'Are' : (agreeWith(subj).number === 'pl' ? 'Are' : 'Is');
      return `${be} ${subj} ${gerund(m.verb)}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}?`;
    }
  },
  {
    id: 'ask-do-support', acts: ['ask'],
    needs: ['verb', 'subject'], wants: ['object'], weight: 0.8,
    build: (m, g) => {
      const a = m.agr || { person: 2, number: 'sg' };
      const aux = a.tense === 'past' ? 'Did' : (a.person === 3 && a.number === 'sg' ? 'Does' : 'Do');
      return `${aux} ${m.subject} ${m.verb}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}?`;
    }
  },
  {
    id: 'ask-wh-what', acts: ['ask'],
    needs: [], wants: ['where'], weight: 0.85,
    build: (m, g) => `What have you got ${m.where || 'out there'}?`
  },
  {
    id: 'ask-wh-where', acts: ['ask'],
    needs: ['object'], weight: 0.7,
    build: (m, g) => `Where are you seeing ${m.object}?`
  },
  {
    id: 'ask-wh-how-many', acts: ['ask'],
    needs: ['object'], weight: 0.6,
    build: (m, g) => `How many ${m.object} are we talking about?`
  },
  {
    id: 'ask-wh-when', acts: ['ask'],
    needs: ['verb'], wants: ['object'], weight: 0.55,
    build: (m, g) => `When do you ${imperative(m.verb)}${m.object ? ' ' + m.object : ''}?`
  },
  {
    id: 'ask-tag', acts: ['ask'],
    needs: ['object'], wants: ['where'], weight: 0.9,
    build: (m, g) => `${g.cap(m.object)}${m.where ? ' ' + m.where : ''} — anything on it?`
  },
  {
    id: 'ask-confirm', acts: ['ask', 'confirm'],
    needs: ['object'], weight: 0.7,
    build: (m, g) => `${g.cap(m.object)}, is that right?`
  },
  {
    id: 'ask-status', acts: ['ask'],
    needs: [], weight: 0.6, regs: ['terse', 'formal', 'gruff'],
    build: (m, g) => g.pick(['Status?', 'Say your state.', 'How are you sitting?', 'What is your condition?'], 'askStatus')
  },
  {
    id: 'ask-favour', acts: ['ask', 'request'],
    needs: ['object'], weight: 0.6, regs: ['warm', 'plain', 'anxious'],
    build: (m, g) => `Could you do something about ${m.object}?`
  },

  // ── offering and requesting ────────────────────────────────────────
  {
    id: 'offer-direct', acts: ['offer'],
    needs: ['object'], wants: ['where'], weight: 1.0,
    build: (m, g) => `I have ${m.object}${m.where ? ' ' + m.where : ''} if you want it.`
  },
  {
    id: 'offer-question', acts: ['offer'],
    needs: ['object'], wants: ['where'], weight: 0.85,
    build: (m, g) => `${g.cap(m.where ? m.where + ', anyone' : 'Anyone')} want ${m.object}?`
  },
  {
    id: 'offer-conditional', acts: ['offer'],
    needs: ['object'], wants: ['condition'], weight: 0.7,
    build: (m, g) => `${m.condition ? g.cap(m.condition) + ', ' : 'If you are interested, '}${m.object} is yours.`
  },
  {
    id: 'offer-price', acts: ['offer'],
    needs: ['object', 'price'], weight: 0.9,
    build: (m, g) => `${g.cap(m.object)}, ${m.price}. Take it or leave it.`
  },
  {
    id: 'offer-help', acts: ['offer'],
    needs: ['verb'], wants: ['where'], weight: 0.8, regs: ['warm', 'plain', 'formal'],
    build: (m, g) => `I can ${imperative(m.verb)}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''} if you need it.`
  },
  {
    id: 'request-need', acts: ['request'],
    needs: ['object'], wants: ['where'], weight: 1.0,
    build: (m, g) => `I need ${m.object}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'request-polite', acts: ['request'],
    needs: ['object'], wants: ['where'], weight: 0.9,
    build: (m, g) => `Any chance of ${m.object}${m.where ? ' ' + m.where : ''}?`
  },
  {
    id: 'request-imperative', acts: ['request', 'order'],
    needs: ['verb'], wants: ['object', 'where'], weight: 0.8, regs: ['terse', 'gruff', 'formal'],
    build: (m, g) => `${g.cap(imperative(m.verb))}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'request-modal', acts: ['request'],
    needs: ['verb'], wants: ['object'], weight: 0.7,
    build: (m, g) => `Could you ${imperative(m.verb)}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}?`
  },
  {
    id: 'request-urgent', acts: ['request'],
    needs: ['object'], weight: 0.75, regs: ['anxious', 'terse'],
    build: (m, g) => `${g.cap(m.object)}. Now, if you can.`
  },

  // ── ordering ───────────────────────────────────────────────────────
  {
    id: 'order-plain', acts: ['order'],
    needs: ['verb'], wants: ['object', 'where'], weight: 1.0,
    build: (m, g) => `${g.cap(imperative(m.verb))}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'order-addressed', acts: ['order'],
    needs: ['verb', 'target'], wants: ['where'], weight: 0.9,
    build: (m, g) => `${m.target}, ${imperative(m.verb)}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'order-negative', acts: ['order'],
    needs: ['verb', 'negated'], weight: 0.7,
    build: (m, g) => `${g.cap(imperative(m.verb, true))}${m.object ? ' ' + m.object : ''}.`
  },

  // ── warning ────────────────────────────────────────────────────────
  {
    id: 'warn-imperative', acts: ['warn'],
    needs: ['object'], wants: ['where'], weight: 1.0,
    build: (m, g) => `Watch ${m.where || 'yourself'} — ${m.object}.`
  },
  {
    id: 'warn-declarative', acts: ['warn'],
    needs: ['object'], wants: ['where'], weight: 0.95,
    build: (m, g) => `${g.cap(m.object)}${m.where ? ' ' + m.where : ''}. Keep your eyes open.`
  },
  {
    id: 'warn-conditional', acts: ['warn'],
    needs: ['object', 'condition'], weight: 0.7,
    build: (m, g) => `${g.cap(m.condition)}, ${m.object}.`
  },
  {
    id: 'warn-advice', acts: ['warn'],
    needs: ['object'], wants: ['verb'], weight: 0.75,
    build: (m, g) => `I would not ${m.verb ? imperative(m.verb) : 'sit there'} — ${m.object}.`
  },
  {
    id: 'warn-flat', acts: ['warn'],
    needs: ['object'], weight: 0.8, regs: ['terse', 'gruff'],
    build: (m, g) => `${g.cap(m.object)}.`
  },

  // ── acknowledging ──────────────────────────────────────────────────
  {
    id: 'ack-bare', acts: ['ack'],
    needs: [], weight: 1.0,
    build: (m, g) => g.pick(LEX.ack[m.register] || LEX.ack.plain, 'ack')
  },
  {
    id: 'ack-echo', acts: ['ack'],
    needs: ['object'], weight: 0.95,
    // An echo repeats what was heard, so there has to be something worth repeating. Echoing
    // a bare deictic produces "Copy that. That." — the frame declines and the realiser picks
    // another rather than shipping it.
    build: (m, g) => (DEICTIC.test(m.object) ? '' :
      `${g.pick(LEX.ack[m.register] || LEX.ack.plain, 'ack')} ${g.cap(m.object)}.`)
  },
  {
    id: 'ack-commit', acts: ['ack'],
    needs: [], wants: ['verb'], weight: 0.9,
    build: (m, g) => `${g.pick(LEX.ack[m.register] || LEX.ack.plain, 'ack')} I will ${m.verb ? imperative(m.verb) : 'take a look'}${m.object ? ' ' + m.object : ''}.`
  },
  {
    id: 'ack-thanks', acts: ['thank'],
    needs: [], weight: 0.6, regs: ['warm', 'plain', 'anxious'],
    build: (m, g) => `${g.pick(['Thanks for that.', 'Appreciated.', 'Good of you.', 'I owe you one.'], 'thanks')}${m.object ? ' ' + g.cap(m.object) + '.' : ''}`
  },
  {
    id: 'ack-qualified', acts: ['ack'],
    needs: ['object'], weight: 0.6, regs: ['wry', 'gruff', 'terse'],
    build: (m, g) => (DEICTIC.test(m.object) ? '' :
      `${g.pick(LEX.ack[m.register] || LEX.ack.plain, 'ack')} ${g.cap(m.object)}, though I will believe it when I see it.`)
  },

  // ── accepting and refusing ─────────────────────────────────────────
  {
    id: 'accept-plain', acts: ['accept'],
    needs: [], wants: ['object'], weight: 1.0,
    build: (m, g) => `${g.pick(['Agreed.', 'That works.', 'Done.', 'I will take it.'], 'accept')}${m.object ? ' ' + g.cap(m.object) + '.' : ''}`
  },
  {
    id: 'accept-conditional', acts: ['accept'],
    needs: ['condition'], wants: ['object'], weight: 0.8,
    build: (m, g) => `I will take it${m.condition ? ', ' + m.condition : ''}.`
  },
  {
    id: 'refuse-plain', acts: ['refuse'],
    needs: [], wants: ['because'], weight: 1.0,
    build: (m, g) => `${g.pick(['No.', 'Not this time.', 'I will pass.', 'Not for me.'], 'refuse')}${m.because ? ' ' + g.cap(m.because) + '.' : ''}`
  },
  {
    id: 'refuse-softened', acts: ['refuse'],
    needs: [], wants: ['because', 'object'], weight: 0.85, regs: ['warm', 'plain', 'formal'],
    build: (m, g) => `I would if I could, but ${m.because || 'I am committed elsewhere'}.`
  },
  {
    id: 'refuse-counter', acts: ['refuse', 'negotiate'],
    needs: ['counter'], weight: 0.8,
    build: (m, g) => `Not at that. ${g.cap(m.counter)} and we can talk.`
  },

  // ── negotiating ────────────────────────────────────────────────────
  {
    id: 'negotiate-open', acts: ['negotiate'],
    needs: ['object', 'price'], weight: 1.0,
    build: (m, g) => `${g.cap(m.object)} for ${m.price}. That is my number.`
  },
  {
    id: 'negotiate-split', acts: ['negotiate'],
    needs: ['price'], weight: 0.8,
    build: (m, g) => `Meet me at ${m.price} and it is done.`
  },
  {
    id: 'negotiate-walk', acts: ['negotiate'],
    needs: [], wants: ['price'], weight: 0.6,
    build: (m, g) => `${m.price ? g.cap(m.price) + ' or ' : ''}I take it to the next ring.`
  },

  // ── boasting and complaining ───────────────────────────────────────
  {
    id: 'boast-plain', acts: ['boast'],
    needs: ['object'], weight: 1.0,
    build: (m, g) => `${g.cap(m.object)}. Not bad for one pass.`
  },
  {
    id: 'boast-compare', acts: ['boast'],
    needs: ['quality'], wants: ['than'], weight: 0.8,
    build: (m, g) => `Nobody out here runs ${comparative(m.quality)}${m.than ? ' than ' + m.than : ''}.`
  },
  {
    id: 'complain-plain', acts: ['complain'],
    needs: ['object'], wants: ['because'], weight: 1.0,
    build: (m, g) => `${g.cap(m.object)}${m.because ? ', and ' + m.because : ''}. Same as always.`
  },
  {
    id: 'complain-rhetorical', acts: ['complain'],
    needs: ['object'], weight: 0.8, regs: ['wry', 'gruff'],
    build: (m, g) => `Who signs off on ${m.object}?`
  },
  {
    id: 'complain-tired', acts: ['complain'],
    needs: [], wants: ['object'], weight: 0.7, regs: ['warm', 'plain', 'anxious'],
    build: (m, g) => `${g.pick(['Long shift.', 'I have been at this since the last cycle.', 'This run is wearing thin.'], 'tired')}${m.object ? ' ' + g.cap(m.object) + '.' : ''}`
  },

  // ── greeting and parting ───────────────────────────────────────────
  {
    id: 'greet-hail', acts: ['greet'],
    needs: ['target'], weight: 1.0,
    build: (m, g) => (g.pick(LEX.hail[m.register] || LEX.hail.plain, 'hail') || '{b}.')
      .replace(/\{b\}/g, m.target).replace(/\{a\}/g, m.speaker || 'this hull')
  },
  {
    id: 'greet-familiar', acts: ['greet'],
    needs: ['target'], weight: 0.8, regs: ['warm', 'wry', 'plain'],
    build: (m, g) => `${g.pick(['Good to hear you,', 'Still out here, then,', 'Back again,'], 'greetFam')} ${m.target}.`
  },
  {
    id: 'farewell-plain', acts: ['farewell'],
    needs: [], weight: 1.0,
    build: (m, g) => (g.pick(LEX.signoff[m.register] || LEX.signoff.plain, 'signoff') || 'Out.')
      .replace(/\{a\}/g, m.speaker || 'this hull').replace(/\{b\}/g, m.target || 'you')
  },

  // ── speculating ────────────────────────────────────────────────────
  {
    id: 'speculate-guess', acts: ['speculate'],
    needs: ['object'], weight: 1.0,
    build: (m, g) => `${g.pick(['My guess is', 'Could be', 'Reads to me like', 'If I had to call it,'], 'guess')} ${m.object}.`
  },
  {
    id: 'speculate-conditional', acts: ['speculate'],
    needs: ['condition', 'object'], weight: 0.85,
    build: (m, g) => `If ${m.condition}, ${m.object}.`
  },
  {
    id: 'speculate-doubt', acts: ['speculate'],
    needs: ['object'], weight: 0.7, regs: ['wry', 'gruff', 'terse'],
    build: (m, g) => `${g.cap(m.object)}? I doubt it.`
  },

  // ── apologising and thanking ───────────────────────────────────────
  {
    id: 'apologise-plain', acts: ['apologise'],
    needs: [], wants: ['object'], weight: 1.0,
    build: (m, g) => `${g.pick(['That one is on me.', 'My mistake.', 'I got that wrong.', 'Sorry about that.'], 'sorry')}${m.object ? ' ' + g.cap(m.object) + '.' : ''}`
  },
  {
    id: 'thank-plain', acts: ['thank'],
    needs: [], wants: ['object'], weight: 1.0,
    build: (m, g) => `${g.pick(['Thanks.', 'Appreciated.', 'I owe you.', 'Good of you.'], 'thank')}${m.object ? ' ' + g.cap(m.object) + '.' : ''}`
  },

  // ── reporting a state ──────────────────────────────────────────────
  {
    id: 'report-state', acts: ['report'],
    needs: ['quality'], wants: ['subject'], weight: 0.9,
    build: (m, g) => `${g.cap(m.subject || 'we')} ${copula(m.subject ? agreeWith(m.subject) : { person: 1, number: 'pl' })} ${m.quality}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'report-number', acts: ['report'],
    needs: ['object', 'number'], weight: 0.85,
    build: (m, g) => `${g.cap(String(m.number))} ${m.object}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'report-nothing', acts: ['report'],
    needs: ['negated'], weight: 0.7,
    build: (m, g) => g.pick(['Nothing to report.', 'Board is clear.', 'Nothing moving out here.', 'Quiet on my side.'], 'nothing')
  }
];

/** Frames indexed by act, built once. Selection is hot and runs on every line spoken. */
const FRAMES_BY_ACT = (() => {
  const idx = new Map();
  for (const f of FRAMES) for (const a of f.acts) {
    if (!idx.has(a)) idx.set(a, []);
    idx.get(a).push(f);
  }
  return idx;
})();

export const framesFor = act => FRAMES_BY_ACT.get(act) || [];

// ═════════════════════════════════════════════════════════════════════
//  6. PROOFING
// ═════════════════════════════════════════════════════════════════════
//
// The layer that reads the finished string and fixes it. Every rule here exists because the
// comms log produced the bad output at least once; the comment on each says what.
//
// A rule is { id, test, fix, fatal }. `fix` repairs in place where a repair is unambiguous.
// `fatal` marks a fault no rewrite can save — the realiser throws that candidate away and
// builds the line again from a different frame, which is cheaper and much better than
// shipping a broken sentence.

export const PROOF_RULES = [
  {
    id: 'double-space',
    test: s => /\s{2,}/.test(s),
    fix: s => s.replace(/\s{2,}/g, ' ')
  },
  {
    id: 'space-before-punct',
    // "the lane ." — produced whenever an empty optional slot left its leading space behind.
    test: s => /\s+([.,;:!?])/.test(s),
    fix: s => s.replace(/\s+([.,;:!?])/g, '$1')
  },
  {
    id: 'double-punct',
    // "Copy that.." and "anything on it?." — a frame that ends in punctuation, plus the
    // full stop the realiser used to append unconditionally.
    test: s => /([.,!?;:])\1+|[.?!],|,\s*\./.test(s),
    fix: s => s.replace(/([.!?;:])\1+/g, '$1').replace(/([.?!]),/g, '$1').replace(/,\s*\./g, '.')
  },
  {
    id: 'mixed-terminal',
    // "Is the face reading well?." — question frame plus appended stop.
    test: s => /[?!]\s*\.$/.test(s),
    fix: s => s.replace(/([?!])\s*\.$/, '$1')
  },
  {
    id: 'comma-dash',
    test: s => /,\s*—|—\s*,/.test(s),
    fix: s => s.replace(/,\s*—/g, ' —').replace(/—\s*,/g, ' —')
  },
  {
    id: 'leading-punct',
    test: s => /^\s*[,;:—-]/.test(s),
    fix: s => s.replace(/^\s*[,;:—-]\s*/, '')
  },
  {
    id: 'bad-article',
    // "a hour", "an ship" — an article chosen before a synonym swap changed the noun.
    test: s => /\b(a)\s+(hour|honest|heir|honou?r)\b/i.test(s) || /\ban\s+([^aeiouAEIOU\s][a-z]*)\b/.test(s) && !/\ban\s+(hour|honest|heir|honou?r|[A-Z])/.test(s),
    fix: s => s.replace(/\b(a|an)\s+([A-Za-z][\w-]*)/g, (mm, det, w) => `${matchCase(det, article(w))} ${w}`)
  },
  {
    id: 'there-agreement',
    // "There is 3 contacts" — existential frame with a plural object.
    test: s => /\bthere is\s+(?!one\b|a\b|an\b|the\b)(\d+|two|three|four|five|six|seven|eight|nine|ten|several|a few|a couple)\b/i.test(s),
    fix: s => s.replace(/\bthere is\b/gi, mm => (mm[0] === 'T' ? 'There are' : 'there are'))
  },
  {
    id: 'lowercase-i',
    test: s => /(^|[\s,;(])i(?=[\s,.;!?)']|$)/.test(s),
    fix: s => s.replace(/(^|[\s,;(])i(?=[\s,.;!?)']|$)/g, '$1I')
  },
  {
    id: 'repeat-word',
    // "the the lane", "on on my board" — two slots that both supplied a preposition.
    test: s => /\b(\w+)\s+\1\b/i.test(s),
    fix: s => s.replace(/\b(\w+)\s+\1\b/gi, '$1')
  },
  {
    id: 'stutter-phrase',
    // "Keep your eyes open. Keep your eyes open." — an opener and a reply reaching for the
    // same closing phrase in the same exchange. Fatal: repairing it would change meaning.
    test: s => {
      const parts = s.split(/(?<=[.!?])\s+/).map(normaliseForCompare).filter(Boolean);
      return new Set(parts).size !== parts.length;
    },
    fatal: true
  },
  {
    id: 'empty',
    test: s => !s || !/[a-z0-9]/i.test(s),
    fatal: true
  },
  {
    id: 'dangling-conjunction',
    test: s => /\b(and|but|or|because|so|if|than|with|for|of|to)\s*[.?!]?\s*$/i.test(s),
    fatal: true
  },
  {
    id: 'orphan-determiner',
    // "I have the ." — a frame that built an NP from a slot that turned out empty.
    test: s => /\b(the|a|an|some|any|no|my|your|our|their)\s*[.,?!]/i.test(s),
    fatal: true
  },
  {
    id: 'unbalanced-quote',
    test: s => (s.match(/"/g) || []).length % 2 === 1,
    fix: s => s.replace(/"/g, '')
  },
  {
    id: 'unbalanced-paren',
    test: s => (s.match(/\(/g) || []).length !== (s.match(/\)/g) || []).length,
    fix: s => s.replace(/[()]/g, '')
  },
  {
    id: 'placeholder-left',
    // "{b}, this is {a}." with no substitution done. Always a bug upstream; fatal so the
    // test suite catches it rather than the player.
    test: s => /\{[a-z]\}/i.test(s),
    fatal: true
  },
  {
    id: 'undefined-leak',
    test: s => /\b(undefined|null|NaN|\[object Object\])\b/.test(s),
    fatal: true
  },
  {
    id: 'no-terminal',
    test: s => !/[.?!…]$/.test(s.trim()),
    fix: s => s.trim() + '.'
  },
  {
    id: 'lower-initial',
    test: s => /^[a-z]/.test(s),
    fix: s => s.charAt(0).toUpperCase() + s.slice(1)
  }
];

/**
 * Run the proofing pass.
 *
 * @returns {{ text: string, ok: boolean, applied: string[], fatal: string|null }}
 */
export function proof(text) {
  let out = String(text == null ? '' : text);
  const applied = [];
  // Two passes: a fix can expose a fault the first pass could not see — removing a doubled
  // word can leave a doubled space, and repairing an article can leave a lowercase initial.
  for (let pass = 0; pass < 2; pass++) {
    for (const rule of PROOF_RULES) {
      let bad = false;
      try { bad = rule.test(out); } catch (e) { bad = false; }
      if (!bad) continue;
      if (rule.fatal) return { text: out, ok: false, applied, fatal: rule.id };
      try {
        const next = rule.fix(out);
        if (next !== out) { out = next; applied.push(rule.id); }
      } catch (e) { /* a rule that throws is a bug, not a reason to drop the line */ }
    }
  }
  return { text: out.trim(), ok: true, applied, fatal: null };
}

/** Convenience for tests and for the debug overlay. */
export function isWellFormed(text) { return proof(text).ok; }

// ═════════════════════════════════════════════════════════════════════
//  7. REALISATION
// ═════════════════════════════════════════════════════════════════════

const cap = s => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');

// "I" is the one English pronoun that is always capitalised wherever it lands.
const fixI = s => String(s).replace(/(^|[\s,;(])i(?=[\s,.;!?)']|$)/g, '$1I');

/** Slots a frame could conceivably use. Anything outside this list is metadata. */
const SLOTS = ['subject', 'verb', 'object', 'where', 'when', 'quality', 'number',
  'price', 'condition', 'because', 'but', 'so', 'than', 'counter', 'target',
  'modal', 'negated', 'speaker'];

/**
 * Score a frame against a record. Higher is better.
 *
 * The scoring is what turns a pile of frames into a chooser with taste: a frame that uses
 * the facts present is preferred, a frame that would throw a fact away is penalised, and a
 * frame that suits the speaker's register gets a nudge. Randomness still decides between
 * near-equals, so the same record twice does not always take the same shape.
 */
function scoreFrame(f, m) {
  let s = (f.weight != null ? f.weight : 1);
  const wants = f.wants || [];
  const avoid = f.avoid || [];
  for (const w of wants) if (m[w] != null && m[w] !== '') s += 0.35;
  for (const a of avoid) if (m[a] != null && m[a] !== '') s -= 0.30;
  // A slot the record carries that the frame can express neither via needs nor wants is
  // information about to be dropped on the floor.
  const uses = new Set([...(f.needs || []), ...wants]);
  for (const slot of SLOTS) {
    if (m[slot] == null || m[slot] === '') continue;
    if (!uses.has(slot)) s -= 0.08;
  }
  if (f.regs && f.regs.includes(m.register)) s += 0.4;
  else if (f.regs) s -= 0.15;
  if (m.urgent && f.id.includes('flat')) s += 0.3;
  return Math.max(0.02, s);
}

/**
 * Turn a semantic record into a sentence.
 *
 * @param {object} msg
 *   act        'inform' | 'tip' | 'report' | 'ask' | 'offer' | 'request' | 'order' |
 *              'warn' | 'ack' | 'accept' | 'refuse' | 'negotiate' | 'boast' | 'complain' |
 *              'greet' | 'farewell' | 'speculate' | 'apologise' | 'thank' | 'confirm'
 *   subject    already-realised NP, or omitted for a subjectless radio fragment
 *   verb       base form
 *   object     already-realised NP
 *   where      a PP or adverbial
 *   when       a temporal adverbial
 *   agr        agreement for the verb
 *   register   one of REGISTERS
 *   count      for existential agreement
 *   urgent     strips discourse furniture and shortens
 *   ...        the optional slots listed in SLOTS above
 *
 * @param {object} opts
 *   bucket     anti-repetition bucket, usually speaker + topic
 *   rng        seeded generator; falls back to the shared npc-grammar stream
 *   vocative   who is being addressed
 *   marker     false to suppress discourse markers
 *   hedge      true to allow a hedge
 *   profile    dials from profileFor(); defaults to the register profile
 *   attempts   how many times to rebuild on a fatal proofing fault (default 4)
 */
export function realise(msg, opts = {}) {
  const m = Object.assign({
    act: 'inform', register: 'plain', agr: { person: 3, number: 'sg' }
  }, msg);
  if (!REGISTER_PROFILE[m.register]) m.register = 'plain';

  const bucket = opts.bucket || 'default';
  const rng = opts.rng || null;
  const prof = opts.profile || REGISTER_PROFILE[m.register];
  const attempts = Math.max(1, opts.attempts || 4);
  const roll = () => (rng ? rng.next() : stream('npc-grammar').next());

  const g = {
    cap,
    rng,
    pick: (list, sub) => chooseFrom(list, `${bucket}:${sub}`, rng) || (list && list[0]) || '',
    lex: (kind, sense) => chooseFrom((LEX[kind] || {})[sense] || [sense], `${bucket}:${kind}:${sense}`, rng),
    num: n => vagueCount(n, { bucket, rng })
  };

  // Candidate frames: those whose act matches and whose required slots are all present.
  let fits = framesFor(m.act).filter(f =>
    (f.needs || []).every(k => m[k] != null && m[k] !== ''));
  // Nothing fits — fall back through act families rather than emitting nothing. An
  // unanswerable record should still produce a plausible noise on the channel.
  if (!fits.length) fits = framesFor(FALLBACK_ACT[m.act] || 'ack')
    .filter(f => (f.needs || []).every(k => m[k] != null && m[k] !== ''));
  if (!fits.length) fits = framesFor('ack');
  if (!fits.length) return '';

  let last = '';
  for (let attempt = 0; attempt < attempts; attempt++) {
    const frame = chooseWeighted(fits, f => scoreFrame(f, m), `${bucket}:frame`, rng);
    if (!frame) break;

    let body;
    try { body = frame.build(m, g); } catch (e) { continue; }
    if (!body) continue;
    body = String(body).replace(/\s+/g, ' ').trim();

    body = decorate(body, m, opts, prof, g, roll);
    const checked = proof(body);
    last = checked.text;
    if (!checked.ok) continue;
    // A line that just went out over the same channel is not worth sending again, even if
    // it is perfectly grammatical.
    if (saidRecently(checked.text) && attempt < attempts - 1) continue;
    rememberLine(checked.text);
    return checked.text;
  }

  // Everything we built was faulty. Emit the safest thing in the language rather than a
  // broken sentence: a bare acknowledgement is always well-formed and always in character.
  const safe = chooseFrom(LEX.ack[m.register] || LEX.ack.plain, `${bucket}:ackSafe`, rng) || 'Copy.';
  return last && isWellFormed(last) ? last : safe;
}

// Which act to try when a record's own act has no usable frame. Chosen so the fallback
// still carries roughly the speaker's intent rather than collapsing everything to an ack.
const FALLBACK_ACT = {
  tip: 'inform', report: 'inform', confirm: 'ask', order: 'request',
  negotiate: 'offer', boast: 'inform', complain: 'inform', speculate: 'inform',
  accept: 'ack', refuse: 'ack', thank: 'ack', apologise: 'ack',
  greet: 'ack', farewell: 'ack', warn: 'inform', offer: 'inform', request: 'ask'
};

/**
 * Discourse furniture, applied after the clause so it never breaks agreement inside it.
 *
 * Rules learned from reading the comms log rather than the code:
 *
 *   1. An acknowledgement in front of an acknowledgement says nothing twice. "Copy.
 *      acknowledged." and "Right. received." were both real transmissions. A clause that
 *      is *itself* an ack gets no furniture in front of it.
 *   2. A prefix ending in a full stop ends a sentence, so the next word keeps its capital.
 *      Only a clause-leading marker lowercases what follows it.
 *   3. A clause-leading marker takes a declarative. "Look, the face reads well" is speech;
 *      "Note that are you holding?" is not English at all, and formal-register questions
 *      were producing it. Questions get no furniture.
 *   4. Furniture is probabilistic, not constant. A marker on every single line is its own
 *      kind of tape loop — the log had four consecutive "For the record," from the same
 *      patrol. The register profile decides how often, and the anti-repetition memory
 *      decides which.
 */
function decorate(body, m, opts, prof, g, roll) {
  const reg = m.register;
  const bare = m.act === 'ack' || m.act === 'ask' || m.act === 'greet' || m.act === 'farewell';

  // Proper nouns must survive being moved out of sentence-initial position. A discourse
  // marker in front of a clause lowercases the first word — correct for "The face reads
  // well", wrong for "Bulk Hauler 02", and very wrong for "I".
  const propers = [m.subject, m.object, m.target, m.speaker, opts.vocative, m.where]
    .filter(x => typeof x === 'string')
    .filter(x => /[A-Z]/.test(x.slice(1)) || /^[A-Z][a-z]+ [A-Z0-9]/.test(x));
  const softLower = t => {
    const first = t.split(' ')[0];
    if (first === 'I') return t;
    if (propers.some(pn => t.startsWith(pn))) return t;
    if (/^[A-Z]{2,}/.test(first)) return t;
    return t.charAt(0).toLowerCase() + t.slice(1);
  };

  let out = body;

  // Subject dropping. Radio does this constantly — "Holding at the ring", "Reading a fat
  // seam" — and it is the single cheapest way to make a line sound spoken rather than
  // written. Only ever drop a first-person subject: dropping "Bulk Hauler 02" loses the
  // information the sentence was for.
  if (!bare && prof.dropSubject > 0 && roll() < prof.dropSubject) {
    const dropped = out.replace(/^(I|We)\s+(am|are|have|will)\s+/, (mm, s, aux) =>
      aux === 'am' || aux === 'are' ? '' : `${aux === 'have' ? '' : aux + ' '}`);
    if (dropped !== out && /^[a-z]/i.test(dropped) && dropped.split(' ').length >= 3) {
      out = cap(dropped);
    }
  }

  // Length control, applied to the clause *before* any furniture goes on it. Trimming last
  // meant a long marker could survive a trim that removed everything it was attached to:
  // "I do not want to make a thing of it." went out on the trade band as a complete
  // transmission, with the offer it was hedging cut off behind it.
  if (prof.maxWords && out.split(/\s+/).length > prof.maxWords + 6) {
    const clause = out.split(/(?<=,)\s+/);
    if (clause.length > 1) {
      let acc = clause[0];
      for (let i = 1; i < clause.length; i++) {
        if ((acc + ' ' + clause[i]).split(/\s+/).length > prof.maxWords) break;
        acc += ' ' + clause[i];
      }
      const trimmed = acc.replace(/,$/, '').trim();
      if (trimmed.split(/\s+/).length >= 3) out = /[.?!]$/.test(trimmed) ? trimmed : trimmed + '.';
    }
  }

  if (opts.marker !== false && !bare && roll() < prof.marker) {
    const mk = g.pick(LEX.marker[reg] || LEX.marker.plain, 'marker');
    if (mk) out = /[.!?]$/.test(mk) ? `${mk} ${cap(out)}` : `${mk} ${softLower(out)}`;
  }

  if (opts.hedge !== false && !bare && roll() < prof.hedge) {
    const h = g.pick(LEX.hedge[reg] || LEX.hedge.plain, 'hedge');
    if (h && /\.$/.test(out)) out = out.replace(/\.$/, `, ${h}.`);
  }

  // Do not address someone twice in one sentence. A topic that already names the listener
  // in the clause ("marking Bulk Hauler 02 on my board") does not also need a vocative.
  // A greeting or an order carries its addressee in the clause itself, so a vocative on top
  // of it names the same ship twice in one breath — worse still when the topic passed a
  // different name for each, which reads as two conversations spliced together.
  const addressed = m.target != null && m.target !== '';
  if (opts.vocative && !addressed && !out.includes(opts.vocative) && roll() < prof.vocative) {
    // Vocative position varies in real speech; front for a call, tail for an aside.
    out = roll() < 0.5
      ? `${opts.vocative}, ${softLower(out)}`
      : out.replace(/\.$/, `, ${opts.vocative}.`);
  }

  out = contract(out, prof.contract, g.rng);

  // A sign-off closes a channel; only ever on a line that already ends a thought.
  if (opts.signoff && roll() < prof.signoff) {
    const so = g.pick(LEX.signoff[reg] || LEX.signoff.plain, 'signoff');
    if (so) out += ' ' + so.replace(/\{a\}/g, m.speaker || 'this hull').replace(/\{b\}/g, opts.vocative || 'you');
  }

  return fixI(cap(out));
}

// ═════════════════════════════════════════════════════════════════════
//  8. CONTENT HELPERS
// ═════════════════════════════════════════════════════════════════════
//
// The functions a topic calls to turn a *fact* into an already-realised phrase. They are
// the boundary between the two files: `npc-topics.js` knows what is true, this file knows
// how to say it, and neither has to know the other's business.

/**
 * Build the object NP for a quantity of something, choosing a synonym and inflecting it.
 * This is where "information constructing" happens: the number is real, and the words
 * around it are chosen fresh each time.
 */
export function quantity(kind, n, opts = {}) {
  const words = LEX.noun[kind] || [kind];
  const word = chooseFrom(words, `${opts.bucket || 'q'}:${kind}`, opts.rng) || kind;
  const mass = opts.mass != null ? opts.mass : isMass(word);
  if (n == null) return np(word, { det: opts.det || 'indef', mass });
  const rounded = Math.round(n);
  if (opts.unit) {
    const u = rounded === 1 ? opts.unit : plural(opts.unit, rounded);
    return `${opts.vague ? vagueCount(rounded, opts) : rounded.toLocaleString('en-US')} ${u} of ${word}`;
  }
  if (mass) return `${opts.vague ? vagueCount(rounded, opts) : rounded.toLocaleString('en-US')} of ${word}`;
  if (opts.vague) return `${vagueCount(rounded, opts)} ${plural(word, rounded === 1 ? 1 : 2)}`;
  return `${rounded.toLocaleString('en-US')} ${plural(word, rounded)}`;
}

/** A descriptive NP — "a fat seam", "picked-over rock". */
export function described(kind, quality, opts = {}) {
  const noun = chooseFrom(LEX.noun[kind] || [kind], `${opts.bucket || 'd'}:${kind}`, opts.rng) || kind;
  const adj = chooseFrom(LEX.adj[quality] || [quality], `${opts.bucket || 'd'}:${quality}`, opts.rng) || quality;
  return np(noun, {
    det: opts.det || 'indef',
    adj,
    count: opts.count || 1,
    mass: opts.mass != null ? opts.mass : isMass(noun)
  });
}

/** A place adverbial, varied. */
export function place(name, opts = {}) {
  const forms = name
    ? [`at ${name}`, `off ${name}`, `out by ${name}`, `${name} side`, `close in on ${name}`]
    : ['out here', 'on this leg', 'where I am', 'on the board', 'this side of the marker'];
  return chooseFrom(forms, `${opts.bucket || 'p'}:place`, opts.rng) || forms[0];
}

/**
 * A temporal adverbial from seconds. Speech does not say "in 214 seconds"; it says "in
 * about four minutes", and past a certain distance it stops counting at all.
 */
export function timeRef(seconds, opts = {}) {
  const s = Number(seconds);
  const b = `${opts.bucket || 't'}:time`;
  if (!isFinite(s)) return chooseFrom(['at some point', 'eventually', 'when it happens'], b, opts.rng);
  const past = s < 0;
  const a = Math.abs(s);
  let core;
  if (a < 45) core = past ? 'just now' : 'any second';
  else if (a < 150) core = past ? 'a minute ago' : 'in a minute';
  else if (a < 900) core = `${past ? '' : 'in '}${Math.round(a / 60)} minutes${past ? ' back' : ''}`;
  else if (a < 5400) core = past ? 'about an hour ago' : 'inside the hour';
  else if (a < 86400) core = past ? 'earlier in the shift' : 'later in the shift';
  else core = past ? 'last cycle' : 'next cycle';
  const dressed = past
    ? [core, `${core}, near enough`, `not long ago`]
    : [core, `${core} or so`, `soon enough`];
  return chooseFrom(dressed, b, opts.rng) || core;
}

/** A bearing, spoken. "Two seven zero" reads as radio; "270°" reads as a HUD. */
export function bearing(deg, opts = {}) {
  const d = ((Math.round(Number(deg)) % 360) + 360) % 360;
  const digits = String(d).padStart(3, '0').split('')
    .map(c => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][+c])
    .join(' ');
  const compass = ['high', 'high and to starboard', 'starboard', 'low and to starboard',
    'low', 'low and to port', 'port', 'high and to port'][Math.round(d / 45) % 8];
  return chooseFrom([
    `bearing ${digits}`, `at ${digits}`, `off my ${compass}`, `${compass} of me`
  ], `${opts.bucket || 'b'}:bearing`, opts.rng) || `bearing ${digits}`;
}

const PHONETIC = {
  A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot', G: 'Golf',
  H: 'Hotel', I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November',
  O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango', U: 'Uniform',
  V: 'Victor', W: 'Whiskey', X: 'X-ray', Y: 'Yankee', Z: 'Zulu'
};

/**
 * Spell a hull code phonetically. Used when a channel is noisy or a name has to be read
 * back exactly — a repair, a docking clearance, a contract number.
 */
export function phonetic(code) {
  return String(code || '').toUpperCase().split('').map(c => {
    if (PHONETIC[c]) return PHONETIC[c];
    if (/[0-9]/.test(c)) return ONES[+c];
    return null;
  }).filter(Boolean).join(' ');
}

/**
 * Shorten a hull name the way a familiar voice does. "Bulk Hauler 02" becomes "Hauler 02"
 * to somebody who talks to it every shift, and "02" to somebody who flies with it.
 */
export function shortName(name, familiarity = 0) {
  const s = String(name || '').trim();
  if (!s) return s;
  if (familiarity <= 1) return s;
  const parts = s.split(/\s+/);
  if (familiarity < 6 && parts.length > 2) return parts.slice(1).join(' ');
  if (familiarity >= 6 && parts.length > 1) {
    const tail = parts[parts.length - 1];
    return /^\d+$/.test(tail) ? `${parts[parts.length - 2]} ${tail}` : tail;
  }
  return s;
}

/**
 * Join two realised clauses into one sentence. Speech coordinates constantly, and a
 * conversation made only of single-clause utterances sounds like a menu.
 */
export function combine(a, b, opts = {}) {
  const { relation = 'and', bucket = 'c', rng = null } = opts;
  const left = String(a || '').trim().replace(/[.]$/, '');
  const right = String(b || '').trim();
  if (!left) return right;
  if (!right) return left + '.';
  const lower = right.charAt(0).toLowerCase() + right.slice(1);
  const joiners = {
    and: ['and', 'plus'],
    but: ['but', 'though'],
    so: ['so', 'which means'],
    because: ['because', 'seeing as'],
    then: ['then', 'after that'],
    or: ['or', 'failing that']
  };
  const j = chooseFrom(joiners[relation] || joiners.and, `${bucket}:join`, rng) || 'and';
  return `${left} ${j} ${lower}`;
}

/**
 * Realise several records as one turn of speech. A character who has three things to say
 * says them in one transmission, not three; the sentences are proofed together so a
 * repeated phrase across them is caught.
 */
export function realiseAll(records, opts = {}) {
  const out = [];
  for (const r of (records || [])) {
    if (!r) continue;
    const line = realise(r, Object.assign({}, opts, { bucket: `${opts.bucket || 'multi'}:${out.length}` }));
    if (line) out.push(line);
  }
  const joined = out.join(' ');
  const checked = proof(joined);
  // A fatal fault across the join is almost always the stutter rule: two records reached
  // for the same phrase. Drop the later one rather than the whole turn.
  return checked.ok ? checked.text : (out[0] || '');
}

/**
 * The one-call convenience the topics table uses most: build a record, realise it, and
 * carry the speaker's profile through in one step.
 */
export function speak(unit, msg, opts = {}) {
  const reg = msg.register || registerOf(unit, opts.mood);
  const prof = profileFor(unit, reg, {
    urgent: !!msg.urgent,
    familiarity: opts.familiarity || 0,
    hostile: !!opts.hostile
  });
  return realise(Object.assign({ register: reg, speaker: unit && unit.name }, msg),
    Object.assign({ profile: prof }, opts));
}

// ═════════════════════════════════════════════════════════════════════
//  9. SELF-TEST
// ═════════════════════════════════════════════════════════════════════
//
// Runnable headless (`node --input-type=module`) or from the in-game debug console. A
// generator that cannot check its own output is a generator nobody can safely extend: the
// point of these cases is that adding a frame or a lexicon entry next month either keeps
// them passing or tells you exactly what it broke.

const CASES = [
  // morphology
  () => [plural('cargo', 2), 'cargoes'],
  () => [plural('analysis', 3), 'analyses'],
  () => [plural('craft', 4), 'craft'],
  () => [plural('berth', 2), 'berths'],
  () => [plural('claim', 1), 'claim'],
  () => [plural('body', 2), 'bodies'],
  () => [plural('ore', 5), 'ore'],
  () => [conjugate('read', { person: 3, number: 'sg' }), 'reads'],
  () => [conjugate('read', { tense: 'past' }), 'read'],
  () => [conjugate('take', { aspect: 'prog', person: 3, number: 'sg' }), 'is taking'],
  () => [conjugate('take', { aspect: 'prog', person: 1, number: 'sg' }), 'am taking'],
  () => [conjugate('hold', { aspect: 'perf', person: 3, number: 'sg' }), 'has held'],
  () => [conjugate('run', { modal: 'can' }), 'can run'],
  () => [conjugate('run', { negated: true, person: 3, number: 'sg' }), 'does not run'],
  () => [conjugate('be', { negated: true, person: 1, number: 'sg' }), 'am not'],
  () => [conjugate('stand down', { person: 3, number: 'sg' }), 'stands down'],
  () => [conjugate('put across', { aspect: 'prog', person: 2 }), 'are putting across'],
  () => [conjugate('cut', { tense: 'fut' }), 'will cut'],
  () => [conjugate('load', { voice: 'passive', person: 3, number: 'pl' }), 'are loaded'],
  () => [gerund('sit'), 'sitting'],
  () => [gerund('leave'), 'leaving'],
  () => [gerund('lie'), 'lying'],
  () => [article('hour'), 'an'],
  () => [article('union'), 'a'],
  () => [article('ore'), 'an'],
  () => [article('SRV'), 'an'],
  () => [article('berth'), 'a'],
  () => [comparative('good'), 'better'],
  () => [comparative('quiet'), 'quieter'],
  () => [comparative('dangerous'), 'more dangerous'],
  () => [superlative('fat'), 'the fattest'],
  () => [adverbise('careful'), 'carefully'],
  () => [numberWord(42), 'forty-two'],
  () => [ordinal(3), 'third'],
  () => [ordinal(21), '21st'],
  () => [np('contact', { count: 3 }), '3 contacts'],
  () => [np('ore', { det: 'def' }), 'the ore'],
  () => [np('berth', { det: 'indef' }), 'a berth'],
  () => [np('hold', { det: 'poss', owner: 'your' }), 'your hold'],
  () => [possessive('Atlas'), "Atlas'"],
  () => [possessive('Bulk Hauler 02'), "Bulk Hauler 02's"],
  () => [listOf(['ore', 'fuel', 'water']), 'ore, fuel and water'],
  () => [agreeWith('two contacts').number, 'pl'],
  () => [agreeWith('I').person, 1],
  () => [pronoun({ person: 1, number: 'sg' }, 'obj'), 'me'],

  // proofing
  () => [proof('the lane .').text, 'The lane.'],
  () => [proof('Copy that..').text, 'Copy that.'],
  () => [proof('anything on it?.').text, 'Anything on it?'],
  () => [proof('a hour out.').text, 'An hour out.'],
  () => [proof('There is 3 contacts.').text, 'There are 3 contacts.'],
  () => [proof('the the lane is clear.').text, 'The lane is clear.'],
  () => [proof('holding at the ring').text, 'Holding at the ring.'],
  () => [proof('Keep your eyes open. Keep your eyes open.').ok, false],
  () => [proof('I have the .').ok, false],
  () => [proof('{b}, this is {a}.').ok, false],
  () => [proof('Reading undefined on the board.').ok, false],
  () => [proof('I will run it and').ok, false],
  () => [proof('').ok, false]
];

/**
 * Property test: hammer the realiser with every act and register and assert that nothing
 * it emits fails proofing. This is the check that actually protects the comms log, because
 * it exercises combinations no hand-written case would think to try.
 */
function fuzz(iterations = 600) {
  const acts = [...new Set(FRAMES.flatMap(f => f.acts))];
  const subjects = ['I', 'we', 'the face', 'Bulk Hauler 02', 'two contacts', 'the lane', null];
  const objects = ['a full hold', 'clean ore', '3 contacts', 'trouble', 'nothing moving', null];
  const verbs = ['read', 'hold', 'run', 'take', 'stand down', 'could use', 'be', null];
  const wheres = ['at the ring', 'out here', 'off the marker', null];
  const bad = [];
  const rng = stream('npc-grammar-fuzz');
  const pickOf = arr => arr[Math.floor(rng.next() * arr.length)];

  for (let i = 0; i < iterations; i++) {
    const act = pickOf(acts);
    const register = pickOf(REGISTERS);
    const msg = {
      act, register,
      subject: pickOf(subjects),
      object: pickOf(objects),
      verb: pickOf(verbs),
      where: pickOf(wheres),
      target: rng.next() < 0.4 ? 'Coalition Patrol 03' : null,
      speaker: 'Nexis Drone 08',
      quality: rng.next() < 0.3 ? 'quiet' : null,
      price: rng.next() < 0.2 ? '400 a unit' : null,
      condition: rng.next() < 0.2 ? 'if you are burning that way' : null,
      because: rng.next() < 0.2 ? 'the lane is stacked' : null,
      number: rng.next() < 0.2 ? 4 : null,
      negated: rng.next() < 0.15 ? true : null,
      modal: rng.next() < 0.15 ? 'should' : null,
      urgent: rng.next() < 0.2,
      agr: { person: pickOf([1, 2, 3]), number: pickOf(['sg', 'pl']) }
    };
    for (const k of Object.keys(msg)) if (msg[k] == null) delete msg[k];

    const line = realise(msg, {
      bucket: `fuzz:${i % 17}`,
      rng,
      vocative: rng.next() < 0.4 ? 'Coalition Patrol 03' : null,
      hedge: rng.next() < 0.5
    });
    const check = proof(line);
    if (!line || !check.ok || check.text !== line) {
      bad.push({ i, act, register, line, fatal: check.fatal });
      if (bad.length > 8) break;
    }
  }
  return bad;
}

/** Variety check: how many distinct sentences does one record produce over N draws? */
export function varietyOf(msg, n = 40, opts = {}) {
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    seen.add(realise(msg, Object.assign({ bucket: 'variety' }, opts)));
  }
  return { distinct: seen.size, of: n, ratio: seen.size / n, samples: [...seen].slice(0, 8) };
}

/**
 * Run everything. Returns { pass, fail, failures } and logs a readable report.
 * `resetGrammarMemory()` first so a test run is reproducible whatever the game did before.
 */
export function runGrammarSelfTest(opts = {}) {
  const { verbose = true, iterations = 600 } = opts;
  resetGrammarMemory();
  const failures = [];
  let pass = 0;

  CASES.forEach((c, i) => {
    let got, want;
    try { [got, want] = c(); } catch (e) { failures.push(`case ${i}: threw ${e.message}`); return; }
    if (got === want) pass++;
    else failures.push(`case ${i}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  });

  const fuzzBad = fuzz(iterations);
  if (fuzzBad.length) {
    for (const b of fuzzBad) failures.push(`fuzz ${b.i} [${b.act}/${b.register}] ${b.fatal || 'unstable'}: ${JSON.stringify(b.line)}`);
  } else pass++;

  // Variety floor. One record must not collapse to one sentence — that is the whole reason
  // this file exists, so it is a test and not a hope.
  resetGrammarMemory();
  const v = varietyOf({
    act: 'tip', register: 'plain', subject: 'the face', verb: 'read',
    object: 'clean ore', where: 'out here', agr: { person: 3, number: 'sg' }
  }, 40);
  if (v.distinct >= 6) pass++;
  else failures.push(`variety: only ${v.distinct} distinct forms in 40 draws`);

  const report = { pass, fail: failures.length, failures, variety: v, stats: grammarStats() };
  if (verbose && typeof console !== 'undefined') {
    console.log(`npc-grammar self-test: ${pass} passed, ${failures.length} failed`);
    for (const f of failures) console.log('  ✗ ' + f);
    console.log(`  variety: ${v.distinct}/${v.of} distinct — e.g. ${JSON.stringify(v.samples.slice(0, 3))}`);
  }
  return report;
}

// Exposed for the in-game debug console: `npcGrammar.runGrammarSelfTest()`.
if (typeof window !== 'undefined') {
  window.npcGrammar = {
    realise, speak, proof, runGrammarSelfTest, varietyOf, grammarStats,
    resetGrammarMemory, LEX, FRAMES, REGISTERS
  };
}
