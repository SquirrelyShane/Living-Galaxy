function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

let seedValue = 1337;
let world = mulberry32(seedValue);
const streams = new Map();

function seedWorld(seed) {
  seedValue = seed >>> 0;
  world = mulberry32(seedValue);
  streams.clear();
}

const wnext = () => world();
const wrand = (a, b) => a + world() * (b - a);

const worldSeed = () => seedValue;

function makeRng(seed) {
  const r = mulberry32(seed >>> 0);
  return {
    next: r,
    range: (a, b) => a + r() * (b - a),
    int: (a, b) => Math.floor(a + r() * (b - a + 1)),
    pick: arr => arr[Math.floor(r() * arr.length)],
    chance: p => r() < p
  };
}

function stream(name) {
  let s = streams.get(name);
  if (!s) {
    s = makeRng((hashString(name) ^ Math.imul(seedValue, 0x9E3779B1)) >>> 0);
    streams.set(name, s);
  }
  return s;
}

function resetStream(name) {
  streams.delete(name);
  return stream(name);
}

const streamNames = () => [...streams.keys()];

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

const INVARIANT_PLURAL = new Set([
  'aircraft', 'spacecraft', 'craft', 'series', 'species', 'means', 'offspring',
  'deer', 'sheep', 'fish', 'salmon', 'trout', 'swine', 'bison', 'moose',
  'headquarters', 'crossroads', 'barracks', 'corps', 'gallows', 'innings'
]);

const MASS_NOUNS = new Set([
  'ore', 'rock', 'fuel', 'water', 'ice', 'air', 'oxygen', 'plasma', 'gas',
  'dust', 'debris', 'wreckage', 'scrap', 'metal', 'alloy', 'traffic', 'weather',
  'information', 'intel', 'news', 'advice', 'work', 'freight',
  'money', 'credit', 'fire', 'cover', 'noise', 'interference', 'silence',
  'damage', 'trouble', 'company', 'attention', 'progress', 'evidence', 'equipment'
]);

export function plural(noun, n = 2) {
  if (!noun) return '';
  if (n === 1) return noun;
  const low = String(noun).toLowerCase();
  if (INVARIANT_PLURAL.has(low)) return noun;
  if (MASS_NOUNS.has(low)) return noun;
  if (IRREGULAR_PLURAL[low]) return matchCase(noun, IRREGULAR_PLURAL[low]);
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

function matchCase(src, out) {
  if (src === src.toUpperCase() && src.length > 1) return out.toUpperCase();
  if (/^[A-Z]/.test(src)) return out.charAt(0).toUpperCase() + out.slice(1);
  return out;
}

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

const PHRASAL = /^([a-z]+)((?:\s+(?:up|down|in|out|off|on|over|across|through|back|away|by|to|about|around|apart|aside|ahead|along))+)$/;

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

const PRE_INFLECTED = /^(am|is|are|was|were|can|could|will|would|shall|should|may|might|must|had better|used to)\b/;

const MODALS = new Set(['can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must']);

export function copula(agr = {}, tense = 'pres') {
  const { person = 3, number = 'sg' } = agr;
  if (tense === 'past') return (number === 'sg' && person !== 2) ? 'was' : 'were';
  if (number === 'pl' || person === 2) return 'are';
  if (person === 1) return 'am';
  return 'is';
}

export function conjugate(v, agr = {}) {
  if (!v) return '';
  if (PRE_INFLECTED.test(v)) return prefixedForm(v, agr);

  const {
    person = 3, number = 'sg', tense = 'pres', aspect = null,
    modal = null, negated = false, voice = 'active'
  } = agr;

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

export function infinitive(v) {
  if (!v) return '';
  if (PRE_INFLECTED.test(v)) return v.replace(PRE_INFLECTED, '').trim() || v;
  return `to ${v}`;
}

export function imperative(v, negated = false) {
  if (!v) return '';
  const base = PRE_INFLECTED.test(v) ? v.replace(PRE_INFLECTED, '').trim() : v;
  return negated ? `do not ${base}` : base;
}

const IRREGULAR_DEGREE = {
  good: ['better', 'best'], bad: ['worse', 'worst'], far: ['further', 'furthest'],
  little: ['less', 'least'], much: ['more', 'most'], many: ['more', 'most'],
  well: ['better', 'best']
};

const SYLLABLES = w => (String(w).toLowerCase().match(/[aeiouy]+/g) || []).length;

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

export function adverbise(adj) {
  const IRR = { good: 'well', fast: 'fast', hard: 'hard', late: 'late', early: 'early', straight: 'straight' };
  if (IRR[adj]) return IRR[adj];
  if (/\s/.test(adj)) return adj;
  if (/[^aeiou]y$/.test(adj)) return adj.slice(0, -1) + 'ily';
  if (/le$/.test(adj)) return adj.slice(0, -1) + 'y';
  if (/ic$/.test(adj)) return adj + 'ally';
  return adj + 'ly';
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

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

export function article(word) {
  const raw = String(word || '').trim().split(/\s+/)[0].replace(/^[^A-Za-z0-9]+/, '');
  const w = raw.toLowerCase();
  if (!w) return 'a';
  if (/^\d/.test(w)) {
    if (/^(8|11|18)/.test(w)) return 'an';
    return 'a';
  }
  if (raw.length <= 5 && raw === raw.toUpperCase() && /^[A-Z]+$/.test(raw)) {
    return /^[AEFHILMNORSX]/.test(raw) ? 'an' : 'a';
  }
  if (/^(hour|honest|honou?r|heir|herb)/.test(w)) return 'an';
  if (/^(uni|use|user|usual|euro|one|once|ubiq|utility|eulog)/.test(w)) return 'a';
  return /^[aeiou]/.test(w) ? 'an' : 'a';
}

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

export function pronoun(agr = {}, kase = 'subj') {
  const { person = 3, number = 'sg', gender = null } = agr;
  let key = `${person}${number}`;
  if (person === 3 && number === 'sg' && gender) key += gender === 'f' ? 'f' : 'm';
  const set = PRONOUN[key] || PRONOUN['3sg'];
  return set[kase] || set.subj;
}

export function agreeWith(subject, fallback = { person: 3, number: 'sg' }) {
  if (!subject) return fallback;
  const s = String(subject).trim().toLowerCase();
  if (s === 'i') return { person: 1, number: 'sg' };
  if (s === 'we') return { person: 1, number: 'pl' };
  if (s === 'you') return { person: 2, number: 'sg' };
  if (s === 'they' || s === 'these' || s === 'those') return { person: 3, number: 'pl' };
  if (/^(he|she|it|that|this)$/.test(s)) return { person: 3, number: 'sg' };
  if (/^(\d+|two|three|four|five|six|seven|eight|nine|ten|both|several|a few|a couple|a pair)\b/.test(s)) {
    return /^(1|one)\b/.test(s) ? { person: 3, number: 'sg' } : { person: 3, number: 'pl' };
  }
  if (/\b(and)\b/.test(s)) return { person: 3, number: 'pl' };
  const head = s.split(/\s+/).pop();
  if (/s$/.test(head) && !/(ss|us|is)$/.test(head) && !MASS_NOUNS.has(head)) {
    return { person: 3, number: 'pl' };
  }
  return fallback;
}

export function np(noun, opts = {}) {
  const {
    count = 1, det = 'indef', adj = null, owner = 'my',
    ofPhrase = null, spellNumber = false
  } = opts;
  const mass = opts.mass != null ? opts.mass : isMass(noun);
  const head = mass ? noun : plural(noun, count);
  const withAdj = adj && attributive(adj) ? `${adj} ${head}` : head;
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

export function possessive(name) {
  const s = String(name || '');
  if (!s) return '';
  return /s$/.test(s) ? `${s}'` : `${s}'s`;
}

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
  hail: {
    terse:    ['{b}.', '{b}, go.', '{b}, on you.'],
    plain:    ['{b}, this is {a}.', '{b}, {a}.', 'Channel up, {b}.'],
    warm:     ['{b}, it is {a}.', 'There you are, {b}.', '{b}! {a} here.'],
    formal:   ['{b}, {a} transmitting.', '{b}, this is {a} on local.', '{a} calling {b}.'],
    gruff:    ['{b}.', '{b}, listen up.'],
    wry:      ['{b}, your favourite voice.', '{b}, guess who.'],
    anxious:  ['{b}? {a} here.', '{b}, are you reading me?']
  },
  signoff: {
    terse:    ['Out.', 'Clear.', '{a} out.'],
    plain:    ['{a} out.', 'Clear on this end.', 'That is all I had.'],
    warm:     ['Safe burns.', 'Mind yourself out there.', 'See you at the ring.'],
    formal:   ['{a} clear.', 'Ending transmission.', 'Nothing further.'],
    gruff:    ['Out.', 'Done talking.'],
    wry:      ['Try not to explode.', 'Do keep in touch.'],
    anxious:  ['Okay. Out.', 'I will be on this band if you need me.']
  },
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

const NEXT = String.raw`(?=\s+[A-Za-z0-9])`;
const recase = (src, out) => (/^[A-Z]/.test(src) ? out.charAt(0).toUpperCase() + out.slice(1) : out);
const PERF_NEXT = String.raw`(?=\s+(?:got|been|already|never|not|just)\b|\s+[a-z]+(?:ed|en)\b)`;
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
  perf('I have', "I've"), perf('you have', "you've"), perf('we have', "we've"),
  aux('I will', "I'll"), aux('you will', "you'll"), aux('we will', "we'll"),
  aux('it will', "it'll"), aux('they will', "they'll"),
  [/\bdo not\b/g, "don't"], [/\bdoes not\b/g, "doesn't"], [/\bdid not\b/g, "didn't"],
  [/\bis not\b/g, "isn't"], [/\bare not\b/g, "aren't"], [/\bwas not\b/g, "wasn't"],
  [/\bwere not\b/g, "weren't"], [/\bhave not\b/g, "haven't"], [/\bhas not\b/g, "hasn't"],
  [/\bhad not\b/g, "hadn't"], [/\bcannot\b/g, "can't"], [/\bcan not\b/g, "can't"],
  [/\bcould not\b/g, "couldn't"], [/\bwould not\b/g, "wouldn't"],
  [/\bshould not\b/g, "shouldn't"], [/\bwill not\b/g, "won't"],
  [new RegExp(String.raw`\bI would\b(?!\s+(?:if|so|too|rather|not\b))` + NEXT, 'gi'), mm => recase(mm, "I'd")],
  aux('they are not', "they aren't")
];

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

export function profileFor(u, reg, ctx = {}) {
  const base = REGISTER_PROFILE[reg] || REGISTER_PROFILE.plain;
  const p = Object.assign({}, base);
  const name = String((u && u.name) || 'unknown');
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) { h ^= name.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  const jitter = (k) => (((h >>> (k * 3)) & 0xff) / 255 - 0.5) * 0.18;

  p.marker = clamp01(p.marker + jitter(1));
  p.hedge = clamp01(p.hedge + jitter(2));
  p.contract = clamp01(p.contract + jitter(3));
  p.dropSubject = clamp01(p.dropSubject + jitter(4));
  p.vocative = clamp01(p.vocative + jitter(5));

  if (ctx.urgent) {
    p.marker *= 0.3; p.hedge *= 0.2; p.signoff *= 0.2;
    p.dropSubject = clamp01(p.dropSubject + 0.25);
    p.maxWords = Math.max(6, Math.round(p.maxWords * 0.7));
  }
  if (ctx.familiarity > 3) { p.vocative *= 0.6; p.maxWords = Math.round(p.maxWords * 0.9); }
  if (ctx.familiarity > 10) { p.marker *= 0.8; p.contract = clamp01(p.contract + 0.1); }
  if (ctx.hostile) { p.hedge *= 0.3; p.vocative = clamp01(p.vocative + 0.15); }
  return p;
}

const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);

const recent = new Map();
const recentLines = [];
const RECENT_LINE_CAP = 24;

export function chooseFrom(list, bucket = 'default', rng = null) {
  if (!Array.isArray(list) || !list.length) return null;
  const seen = recent.get(bucket) || [];
  const fresh = list.filter(x => !seen.includes(keyOf(x)));
  const pool = fresh.length ? fresh : list;
  const draw = rng ? rng.next() : stream('npc-grammar').next();
  const pick = pool[Math.floor(draw * pool.length) % pool.length];

  const next = seen.concat([keyOf(pick)]);
  while (next.length > Math.max(1, list.length - 1)) next.shift();
  recent.set(bucket, next);
  return pick;
}

export function chooseWeighted(items, weightOf, bucket = 'default', rng = null) {
  if (!Array.isArray(items) || !items.length) return null;
  const seen = recent.get(bucket) || [];
  const scored = items.map(it => {
    let w = Math.max(0.0001, weightOf(it));
    if (seen.includes(keyOf(it))) w *= 0.12;
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

export function saidRecently(line) {
  const norm = normaliseForCompare(line);
  return recentLines.includes(norm);
}

function rememberLine(line) {
  recentLines.push(normaliseForCompare(line));
  while (recentLines.length > RECENT_LINE_CAP) recentLines.shift();
}

const normaliseForCompare = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

export function resetGrammarMemory() {
  recent.clear();
  recentLines.length = 0;
}

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

export function grammarStats() {
  return {
    buckets: recent.size,
    trackedLines: recentLines.length,
    frames: FRAMES.length,
    acts: [...new Set(FRAMES.flatMap(f => f.acts))].sort(),
    lexSenses: Object.keys(LEX.verb).length + Object.keys(LEX.noun).length + Object.keys(LEX.adj).length
  };
}

const DEICTIC = /^(that|this|it|them|those|these|you|one)\.?$/i;

const INTRANSITIVE_OK = /^(hold|wait|stand by|stand down|come|come about|look|listen|burn|turn|close|break off|hold station|sit tight|be there|come alongside|take a look|see to it|make station|watch out)$/i;

export const MOVES = ['statement', 'question', 'comment', 'accusation', 'denial',
  'directive', 'commitment', 'expressive'];

export const ACT_MOVE = {
  inform: 'statement', tip: 'statement', report: 'statement',
  ask: 'question', confirm: 'question',
  complain: 'comment', boast: 'comment', speculate: 'comment', warn: 'comment',
  accuse: 'accusation',
  refuse: 'denial', deny: 'denial',
  order: 'directive', request: 'directive',
  offer: 'commitment', accept: 'commitment', negotiate: 'commitment',
  admit: 'statement', answer: 'statement',
  ack: 'expressive', thank: 'expressive', apologise: 'expressive',
  greet: 'expressive', farewell: 'expressive'
};

const NEGATION = /\b(not|n't|never|no|nothing|nobody|none|hardly|refuse|decline|pass on|wrong|did not)\b/i;
const SECOND_PERSON = /\b(you|your|yours|yourself)\b/i;
const WH = /^(who|what|when|where|why|which|how)\b/i;
const AUX_FRONT = /^(is|are|was|were|am|do|does|did|can|could|will|would|should|have|has|had|any|anything|anybody|got)\b/i;
const IMPERATIVE_LEAD = /^(watch|hold|stand|break|keep|give|get|come|go|take|leave|clear|cover|mark|log|call|send|route|meet|match|fall|stay|say|do|don't|do not|sit|wait|check|pass|put|find|stop|turn|burn|cut|fill|load|drop|set|split|handle)\b/i;
const COMMIT_LEAD = /\b(I will|I'll|I can|I am coming|I'm coming|consider it|done|agreed|on my way|I have it|I take it|I'll take|yours if|it is yours|it's yours|come alongside|meet me|take it or leave it|that is my number|that's my number|my number)\b/i;
const EXPRESSIVE_LEAD = /\b(thanks|thank you|appreciated|cheers|sorry|my mistake|on me|copy|received|acknowledged|understood|noted|logged|heard|out\.|clear\.|safe burns|good to hear|there you are|still out here|back again|guess who|transmitting|calling|go\b|glad|any time|no trouble|fair enough|right you are|good of you|if you say so|duly noted|wonderful|lovely|of course it is)\b/i;

export function checkMove(text, move, msg = {}) {
  const whole = String(text || '').trim();
  if (!whole) return 'empty';
  const parts = whole.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (parts.length > 1) {
    let first = null;
    for (const part of parts) {
      const why = checkMove(part, move, msg);
      if (!why) return null;
      if (first == null) first = why;
    }
    return first;
  }
  const s = whole;
  const isQ = /\?$/.test(s);
  const first = s.replace(/^[^A-Za-z]+/, '');

  switch (move) {
    case 'question':
      if (!isQ) return 'a question that does not ask';
      if (!WH.test(first) && !AUX_FRONT.test(first) && !/[—-]\s*[a-z ]+\?$/.test(s) &&
          !/,\s*(is that right|right|yes|no|correct)\?$/i.test(s)) {
        return 'question mark on something that is not interrogative';
      }
      if (/^where\b/i.test(first) && msg.q && msg.q !== 'wh-where') return 'wh-word does not match the question asked';
      if (/^how many\b/i.test(first) && msg.object && agreeWith(msg.object).number !== 'pl') {
        return 'counting something uncountable';
      }
      return null;

    case 'statement':
      if (isQ) return 'a statement asking a question';
      if (!/[a-z]/i.test(s)) return 'no content';
      return null;

    case 'comment':
      if (isQ && !/^(who|what)\b/i.test(first)) return 'a comment phrased as a question';
      return null;

    case 'accusation':
      if (isQ && !/^(who|why|what)\b/i.test(first)) return 'an accusation phrased as a question';
      if (!SECOND_PERSON.test(s) && !(msg.target && s.includes(msg.target))) return 'accuses nobody';
      return null;

    case 'denial':
      if (!NEGATION.test(s) && !/\b(pass|wrong|hardly|I would if I could)\b/i.test(s)) {
        return 'a denial that denies nothing';
      }
      if (isQ) return 'a denial phrased as a question';
      return null;

    case 'directive':
      if (isQ && !/^(could|can|will|would|any)\b/i.test(first)) return 'a directive phrased as an open question';
      if (!IMPERATIVE_LEAD.test(first) && !/^(could|can|will|would|any|I need|I want|give|hold)\b/i.test(first) &&
          !/\b(now, if you can|if you can|as soon as you can)\b/i.test(s)) {
        return 'a directive that tells nobody to do anything';
      }
      return null;

    case 'commitment':
      if (isQ && !/^(any|want|anyone)\b/i.test(first)) return 'a commitment phrased as a question';
      if (!COMMIT_LEAD.test(s) && !/\b(I have|I've|if you want it|if you need it|yours)\b/i.test(s)) {
        return 'a commitment that commits to nothing';
      }
      return null;

    case 'expressive':
      return null;

    default:
      return null;
  }
}

export const FRAMES = [
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
    id: 'inform-existential', objectNP: true, acts: ['inform', 'tip', 'report'],
    needs: ['object'], wants: ['where'], avoid: ['verb'], weight: 0.85,
    build: (m, g) => `There ${m.count > 1 || agreeWith(m.object).number === 'pl' ? 'are' : 'is'} ${m.object}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'inform-verbless', acts: ['inform', 'tip', 'report'],
    needs: ['object'], wants: ['where'], avoid: ['verb'], weight: 0.8,
    regs: ['terse', 'gruff'],
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
    id: 'inform-cleft', objectNP: true, acts: ['inform', 'tip'],
    needs: ['object', 'subject', 'verb'], weight: 0.5, regs: ['plain', 'wry', 'formal'],
    build: (m, g) => (/^(i|we|you|they)$/i.test(String(m.subject).trim()) &&
      /^(have|hold|read|see|need|want|get|carry|know)$/.test(String(m.verb).trim())
      ? `What ${m.subject} ${conjugate(m.verb, m.agr)} is ${m.object}.` : '')
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

  {
    id: 'ask-polar', q: 'polar', acts: ['ask'],
    needs: ['verb'], wants: ['object', 'where'], weight: 1.0,
    build: (m, g) => {
      const second = m.agr && m.agr.person === 2;
      const subj = second ? 'you' : (m.subject || 'it');
      const be = second ? 'Are' : (agreeWith(subj).number === 'pl' ? 'Are' : 'Is');
      if (m.verb === 'have') {
        const aux = second || agreeWith(subj).number === 'pl' ? 'Do' : 'Does';
        return `${aux} ${subj} have${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}?`;
      }
      if (m.verb === 'be') {
        return `${be} ${subj}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}?`;
      }
      return `${be} ${subj} ${gerund(m.verb)}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}?`;
    }
  },
  {
    id: 'ask-do-support', q: 'polar', acts: ['ask'],
    needs: ['verb', 'subject'], wants: ['object'], weight: 0.8,
    build: (m, g) => {
      const a = m.agr || { person: 2, number: 'sg' };
      const aux = a.tense === 'past' ? 'Did' : (a.person === 3 && a.number === 'sg' ? 'Does' : 'Do');
      return `${aux} ${m.subject} ${m.verb}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}?`;
    }
  },
  {
    id: 'ask-wh-what', q: 'wh-what', acts: ['ask'],
    needs: [], wants: ['where'], weight: 0.85,
    build: (m, g) => `What have you got ${m.where || 'out there'}?`
  },
  {
    id: 'ask-wh-where', q: 'wh-where', objectNP: true, acts: ['ask'],
    needs: ['object'], weight: 0.7,
    build: (m, g) => `Where are you seeing ${m.object}?`
  },
  {
    id: 'ask-wh-how-many', q: 'wh-count', objectNP: true, acts: ['ask'],
    needs: ['object'], weight: 0.6,
    build: (m, g) => (agreeWith(m.object).number === 'pl'
      ? `How many ${m.object} are we talking about?` : '')
  },
  {
    id: 'ask-wh-when', q: 'wh-when', acts: ['ask'],
    needs: ['verb', 'object'], weight: 0.55,
    build: (m, g) => `When do you ${imperative(m.verb)}${m.object ? ' ' + m.object : ''}?`
  },
  {
    id: 'ask-embedded', q: 'embedded', acts: ['ask'], move: 'question',
    needs: ['object'], weight: 1.2,
    build: (m, g) => (looksClausal(m.object) || /^(who|what|where|when|why|how|whether|if)\b/i.test(String(m.object))
      ? `${g.pick(['Can you tell me', 'I want to know', 'Say again'], 'askEmbed') === 'Say again'
          ? 'Say again' : g.pick(['Can you tell me', 'Do you know'], 'askEmbed2')} ${m.object}?`
      : '')
  },
  {
    id: 'ask-tag', q: 'tag', objectNP: true, acts: ['ask'],
    needs: ['object'], wants: ['where'], weight: 0.9,
    build: (m, g) => `${g.cap(m.object)}${m.where ? ' ' + m.where : ''} — anything on it?`
  },
  {
    id: 'ask-confirm', q: 'tag', acts: ['ask', 'confirm'],
    needs: ['object'], weight: 0.7,
    build: (m, g) => `${g.cap(m.object)}, is that right?`
  },
  {
    id: 'ask-status', q: 'open', acts: ['ask'],
    needs: [], weight: 0.6, regs: ['terse', 'formal', 'gruff'],
    build: (m, g) => g.pick(['Status?', 'Say your state.', 'How are you sitting?', 'What is your condition?'], 'askStatus')
  },
  {
    id: 'ask-favour', q: 'favour', objectNP: true, acts: ['ask', 'request'],
    needs: ['object'], weight: 0.6, regs: ['warm', 'plain', 'anxious'],
    build: (m, g) => `Could you do something about ${m.object}?`
  },

  {
    id: 'offer-direct', objectNP: true, acts: ['offer'],
    needs: ['object'], wants: ['where'], weight: 1.0,
    build: (m, g) => `I have ${m.object}${m.where ? ' ' + m.where : ''} if you want it.`
  },
  {
    id: 'offer-question', objectNP: true, acts: ['offer'],
    needs: ['object'], wants: ['where'], weight: 0.85,
    build: (m, g) => `${g.cap(m.where ? m.where + ', anyone' : 'Anyone')} want ${m.object}?`
  },
  {
    id: 'offer-conditional', objectNP: true, acts: ['offer'],
    needs: ['object'], wants: ['condition'], weight: 0.7,
    build: (m, g) => `${m.condition ? g.cap(m.condition) + ', ' : 'If you are interested, '}${m.object} is yours.`
  },
  {
    id: 'offer-price', objectNP: true, acts: ['offer'],
    needs: ['object', 'price'], weight: 0.9,
    build: (m, g) => `${g.cap(m.object)}, ${m.price}. Take it or leave it.`
  },
  {
    id: 'offer-help', acts: ['offer'],
    needs: ['verb'], wants: ['where'], weight: 0.8, regs: ['warm', 'plain', 'formal'],
    build: (m, g) => `I can ${imperative(m.verb)}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''} if you need it.`
  },
  {
    id: 'request-need', objectNP: true, acts: ['request'],
    needs: ['object'], wants: ['where'], weight: 1.0,
    build: (m, g) => `I need ${m.object}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'request-polite', objectNP: true, acts: ['request'],
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
    build: (m, g) => (String(m.object).split(/\s+/).length < 4 ? '' :
      `${g.cap(m.object)}. Now, if you can.`)
  },

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

  {
    id: 'ack-bare', acts: ['ack'],
    needs: [], weight: 1.0,
    build: (m, g) => g.pick(LEX.ack[m.register] || LEX.ack.plain, 'ack')
  },
  {
    id: 'ack-echo', acts: ['ack'],
    needs: ['object'], weight: 0.95,
    build: (m, g) => (DEICTIC.test(m.object) ? '' :
      `${g.pick(LEX.ack[m.register] || LEX.ack.plain, 'ack')} ${g.cap(m.object)}.`)
  },
  {
    id: 'ack-commit', objectNP: true, acts: ['ack'],
    needs: [], wants: ['verb'], weight: 0.9,
    build: (m, g) => {
      const v = m.verb ? imperative(m.verb) : null;
      const standsAlone = v && INTRANSITIVE_OK.test(v);
      return `${g.pick(LEX.ack[m.register] || LEX.ack.plain, 'ack')} I will ${standsAlone ? v : 'take a look'}.`;
    }
  },
  {
    id: 'ack-thanks', acts: ['thank'],
    needs: [], weight: 0.6, regs: ['warm', 'plain', 'anxious'],
    build: (m, g) => `${g.pick(['Thanks for that.', 'Appreciated.', 'Good of you.', 'I owe you one.'], 'thanks')}${m.object ? ' ' + g.cap(m.object) + '.' : ''}`
  },
  {
    id: 'ack-qualified', acts: ['ack'],
    needs: ['object', 'doubtable'], weight: 0.6, regs: ['wry', 'gruff', 'terse'],
    build: (m, g) => (DEICTIC.test(m.object) ? '' :
      `${g.pick(LEX.ack[m.register] || LEX.ack.plain, 'ack')} ${g.cap(m.object)}, though I will believe it when I see it.`)
  },

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

  {
    id: 'negotiate-open', objectNP: true, acts: ['negotiate'],
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
    build: (m, g) => (m.price && !/\d/.test(m.price) ? '' : `${m.price ? g.cap(m.price) + ' or ' : ''}I take it to the next ring.`)
  },

  {
    id: 'boast-plain', acts: ['boast'],
    needs: ['object'], weight: 1.0,
    build: (m, g) => `${g.cap(m.object)}. Not bad for one pass.`
  },
  {
    id: 'boast-compare', objectNP: true, acts: ['boast'],
    needs: ['quality'], wants: ['than'], weight: 0.8,
    build: (m, g) => `Nobody out here runs ${comparative(m.quality)}${m.than ? ' than ' + m.than : ''}.`
  },
  {
    id: 'complain-plain', acts: ['complain'],
    needs: ['object'], wants: ['because'], weight: 1.0,
    build: (m, g) => `${g.cap(m.object)}${m.because ? ', and ' + m.because : ''}. Same as always.`
  },
  {
    id: 'complain-rhetorical', objectNP: true, acts: ['complain'],
    needs: ['object'], weight: 0.8, regs: ['wry', 'gruff'],
    build: (m, g) => `Who signs off on ${m.object}?`
  },
  {
    id: 'complain-tired', acts: ['complain'],
    needs: [], wants: ['object'], weight: 0.7, regs: ['warm', 'plain', 'anxious'],
    build: (m, g) => `${g.pick(['Long shift.', 'I have been at this since the last cycle.', 'This run is wearing thin.'], 'tired')}${m.object ? ' ' + g.cap(m.object) + '.' : ''}`
  },

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

  {
    id: 'accuse-direct', acts: ['accuse'], move: 'accusation',
    needs: ['object'], wants: ['where', 'when'], weight: 1.0,
    build: (m, g) => `${g.cap(m.object)}${m.where ? ' ' + m.where : ''}${m.when ? ' ' + m.when : ''}.`
  },
  {
    id: 'accuse-verbal', acts: ['accuse'], move: 'accusation',
    needs: ['verb'], wants: ['object', 'where'], weight: 0.95,
    build: (m, g) => `You ${conjugate(m.verb, { person: 2, number: 'sg', tense: m.tense || 'past' })}${m.object ? ' ' + m.object : ''}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'accuse-evidence', acts: ['accuse'], move: 'accusation',
    needs: ['object', 'evidence'], weight: 0.85,
    build: (m, g) => `${g.cap(m.evidence)}, and it puts you on ${m.object}.`
  },
  {
    id: 'accuse-softened', acts: ['accuse'], move: 'accusation', noTrim: true,
    needs: ['object'], weight: 0.7, regs: ['plain', 'warm', 'formal', 'anxious'],
    build: (m, g) => (/^you\b/i.test(String(m.object || '')) ?
      `Either ${m.object}, or somebody flying your registry did.` : '')
  },
  {
    id: 'deny-flat', acts: ['deny'], move: 'denial',
    needs: [], wants: ['verb'], avoid: ['object'], weight: 0.55,
    build: (m, g) => (m.verb
      ? `I did not ${imperative(m.verb)}${m.object ? ' ' + m.object : ''}.`
      : g.pick(['That was not me.', 'I did not do it.', 'Not a chance.', 'No.'], 'denyFlat'))
  },
  {
    id: 'deny-alibi', acts: ['deny'], move: 'denial',
    needs: ['where'], wants: ['when'], weight: 0.9,
    build: (m, g) => `Not me — I was ${m.where}${m.when ? ' ' + m.when : ''}.`
  },
  {
    id: 'deny-counter', acts: ['deny'], move: 'denial',
    needs: ['counter'], weight: 0.85, regs: ['gruff', 'wry', 'terse'],
    build: (m, g) => `That is rich from the hull that ${m.counter}. No.`
  },
  {
    id: 'deny-offended', acts: ['deny'], move: 'denial',
    needs: [], wants: ['object'], weight: 1.1,
    build: (m, g) => `${g.pick(['I have never worked that way.', 'You know better than that.',
      'That is not what happened.', 'No, and you know it.'], 'denyOff')}${m.object ? ' ' + g.cap(m.object) + '.' : ''}`
  },
  {
    id: 'admit-plain', acts: ['admit'], move: 'statement',
    needs: [], wants: ['object', 'because'], weight: 1.0,
    build: (m, g) => `${g.pick(['That was me.', 'It was me.', 'Fine — it was mine.'], 'admit')}${m.because ? ' ' + g.cap(m.because) + '.' : ''}`
  },
  {
    id: 'admit-partial', acts: ['admit'], move: 'statement',
    needs: ['object'], weight: 0.8,
    build: (m, g) => `${g.cap(m.object)}, and I am not going to pretend otherwise.`
  },
  {
    id: 'answer-yes', acts: ['answer'], move: 'statement',
    needs: [], wants: ['object'], weight: 1.0,
    build: (m, g) => (m.negated ? '' :
      `${g.pick(['Yes.', 'That is right.', 'Confirmed.', 'It is.'], 'ansYes')}${m.object ? ' ' + g.cap(m.object) + '.' : ''}`)
  },
  {
    id: 'answer-no', acts: ['answer'], move: 'denial',
    needs: ['negated'], wants: ['object'], weight: 1.0,
    build: (m, g) => `${g.pick(['No.', 'Nothing like it.', 'Not that I have seen.'], 'ansNo')}${m.object ? ' ' + g.cap(m.object) + '.' : ''}`
  },
  {
    id: 'answer-hedged', acts: ['answer'], move: 'statement',
    needs: ['object'], weight: 0.8,
    build: (m, g) => `As far as I can tell, ${m.object}.`
  },

  {
    id: 'report-state', acts: ['report'],
    needs: ['quality'], wants: ['subject'], weight: 0.9,
    build: (m, g) => `${g.cap(m.subject || 'we')} ${copula(m.subject ? agreeWith(m.subject) : { person: 1, number: 'pl' })} ${m.quality}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'report-number', objectNP: true, acts: ['report'],
    needs: ['object', 'number'], weight: 0.85,
    build: (m, g) => `${g.cap(String(m.number))} ${m.object}${m.where ? ' ' + m.where : ''}.`
  },
  {
    id: 'report-nothing', acts: ['report'],
    needs: ['negated'], weight: 0.7,
    build: (m, g) => g.pick(['Nothing to report.', 'Board is clear.', 'Nothing moving out here.', 'Quiet on my side.'], 'nothing')
  }
];

const FRAME_MOVE = {
  'warn-imperative': 'directive', 'warn-advice': 'directive', 'warn-conditional': 'comment',
  'warn-declarative': 'statement', 'warn-flat': 'statement',
  'refuse-counter': 'commitment', 'refuse-softened': 'denial',
  'inform-negated': 'denial', 'report-nothing': 'statement',
  'ask-favour': 'directive', 'ask-status': 'question',
  'offer-question': 'question', 'complain-rhetorical': 'comment',
  'speculate-doubt': 'comment', 'ack-commit': 'commitment', 'accept-conditional': 'commitment'
};

export function moveOf(msg, frame = null) {
  if (msg && msg.move) return msg.move;
  if (frame && (frame.move || FRAME_MOVE[frame.id])) return frame.move || FRAME_MOVE[frame.id];
  return ACT_MOVE[(msg && msg.act) || 'inform'] || 'statement';
}

const FRAMES_BY_ACT = (() => {
  const idx = new Map();
  for (const f of FRAMES) for (const a of f.acts) {
    if (!idx.has(a)) idx.set(a, []);
    idx.get(a).push(f);
  }
  return idx;
})();

export const framesFor = act => FRAMES_BY_ACT.get(act) || [];

export const PROOF_RULES = [
  {
    id: 'double-space',
    test: s => /\s{2,}/.test(s),
    fix: s => s.replace(/\s{2,}/g, ' ')
  },
  {
    id: 'space-before-punct',
    test: s => /\s+([.,;:!?])/.test(s),
    fix: s => s.replace(/\s+([.,;:!?])/g, '$1')
  },
  {
    id: 'double-punct',
    test: s => /([.,!?;:])\1+|[.?!],|,\s*\./.test(s),
    fix: s => s.replace(/([.!?;:])\1+/g, '$1').replace(/([.?!]),/g, '$1').replace(/,\s*\./g, '.')
  },
  {
    id: 'mixed-terminal',
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
    test: s => /\b(a)\s+(hour|honest|heir|honou?r)\b/i.test(s) || /\ban\s+([^aeiouAEIOU\s][a-z]*)\b/.test(s) && !/\ban\s+(hour|honest|heir|honou?r|[A-Z])/.test(s),
    fix: s => s.replace(/\b(a|an)\s+([A-Za-z][\w-]*)/g, (mm, det, w) => `${matchCase(det, article(w))} ${w}`)
  },
  {
    id: 'there-agreement',
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
    test: s => /\b(\w+)\s+\1\b/i.test(s),
    fix: s => s.replace(/\b(\w+)\s+\1\b/gi, '$1')
  },
  {
    id: 'stutter-phrase',
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
    test: s => /\b(and|but|or|because|so|if|than|with|for|of|to)\s*[.?!]?\s*$/i.test(s) &&
      !/\b(say|or|even|is|just|hardly|do)\s+(so|not)\s*[.?!]?\s*$/i.test(s),
    fatal: true
  },
  {
    id: 'orphan-determiner',
    test: s => /\b\w+\s+(the|a|an|some|any|no|my|your|our|their)\s*[.,?!]/i.test(s),
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

export function proof(text) {
  let out = String(text == null ? '' : text);
  const applied = [];
  for (let pass = 0; pass < 2; pass++) {
    for (const rule of PROOF_RULES) {
      let bad = false;
      try { bad = rule.test(out); } catch (e) { bad = false; }
      if (!bad) continue;
      if (rule.fatal) return { text: out, ok: false, applied, fatal: rule.id };
      try {
        const next = rule.fix(out);
        if (next !== out) { out = next; applied.push(rule.id); }
      } catch (e) {}
    }
  }
  return { text: out.trim(), ok: true, applied, fatal: null };
}

export function isWellFormed(text) { return proof(text).ok; }

const cap = s => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');

const fixI = s => String(s).replace(/(^|[\s,;(])i(?=[\s,.;!?)']|$)/g, '$1I');

const IMPERATIVE_START = /^(buy|settle|take|come|hold|watch|give|keep|put|stay|fall|match|split|route|file|forget|find|send|run|burn|break|meet|make|leave|get|go|say|call|log|mark|pass|fly|sit|wait|check|clear|cover|carry|consider|name|stop|try)\b/i;
const FINITE_VERB = /\b(is|are|was|were|am|has|have|had|will|would|can|could|should|must|does|do|did|reads|runs|sits|holds|owes|ran|went|took|came|said|got|made|left|lost|kept|gave|saw|told|paid|signed|delivered|cut|burned|filed|read)\b/i;

export function looksClausal(x) {
  if (typeof x !== 'string') return false;
  const s = x.trim();
  if (!s) return false;
  if (/^(i|we|you|they|he|she|it|nobody|somebody|everybody|there|that was|this was)\b/i.test(s)) return true;
  if (IMPERATIVE_START.test(s)) return true;
  if (FINITE_VERB.test(s)) return true;
  if (/\b(and|but|so|because|if|though)\b/i.test(s) && s.split(/\s+/).length > 5) return true;
  return false;
}

const SLOTS = ['subject', 'verb', 'object', 'where', 'when', 'quality', 'number',
  'price', 'condition', 'because', 'but', 'so', 'than', 'counter', 'target',
  'modal', 'negated', 'speaker'];

function scoreFrame(f, m, lengthPref = 0) {
  let s = (f.weight != null ? f.weight : 1);
  const wants = f.wants || [];
  const avoid = f.avoid || [];
  for (const w of wants) if (m[w] != null && m[w] !== '') s += 0.35;
  for (const a of avoid) if (m[a] != null && m[a] !== '') s -= 0.30;
  const uses = new Set([...(f.needs || []), ...wants]);
  for (const slot of SLOTS) {
    if (m[slot] == null || m[slot] === '') continue;
    if (!uses.has(slot)) s -= 0.08;
  }
  if (lengthPref) {
    const slots = (f.needs || []).length +
      (f.wants || []).filter(w => m[w] != null && m[w] !== '').length;
    s += lengthPref * (slots - 2) * 0.22;
  }
  if (f.regs && f.regs.includes(m.register)) s += 0.4;
  else if (f.regs) s -= 0.15;
  if (m.urgent && f.id.includes('flat')) s += 0.3;
  return Math.max(0.02, s);
}

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

  const pinned = Array.isArray(m.frames) && m.frames.length ? new Set(m.frames) : null;
  const clausal = looksClausal(m.object);
  const usable = f => (f.needs || []).every(k => m[k] != null && m[k] !== '') &&
    !(clausal && f.objectNP) && (!pinned || pinned.has(f.id)) &&
    (!m.q || !f.q || f.q === m.q) && (!m.q || f.q || ACT_MOVE[m.act] !== 'question') &&
    (!m.move || moveOf(m, f) === m.move);

  let fits = framesFor(m.act).filter(usable);
  if (!fits.length) fits = framesFor(FALLBACK_ACT[m.act] || 'ack').filter(usable);
  if (!fits.length) fits = framesFor('ack').filter(f => !(clausal && f.objectNP));
  if (!fits.length) fits = framesFor('ack').filter(f => !(f.needs || []).length);
  if (!fits.length) return '';

  let last = '';
  for (let attempt = 0; attempt < attempts; attempt++) {
    const bias = opts.learn && typeof opts.learn.bias === 'function'
      ? f => scoreFrame(f, m, opts.lengthPref || 0) * opts.learn.bias(f.id, m)
      : f => scoreFrame(f, m, opts.lengthPref || 0);
    const frame = chooseWeighted(fits, bias, `${bucket}:frame`, rng);
    if (frame && opts.learn && typeof opts.learn.choice === 'function') {
      try { opts.learn.choice(frame.id, fits.map(f => f.id)); } catch (e) {}
    }
    if (!frame) break;

    let body;
    try { body = frame.build(m, g); } catch (e) { continue; }
    if (!body) continue;
    body = String(body).replace(/\s+/g, ' ').trim();

    const feat = { marker: false, hedge: false, vocative: false, words: 0 };
    body = decorate(body, Object.assign({ noTrim: !!frame.noTrim }, m), opts, prof, g, roll, feat);
    const checked = proof(body);
    last = checked.text;
    if (!checked.ok) continue;

    const move = moveOf(m, frame);
    const wrong = checkMove(checked.text, move, m);
    if (wrong) { last = ''; continue; }
    if (saidRecently(checked.text) && attempt < attempts - 1) continue;
    rememberLine(checked.text);
    if (opts.onFrame) {
      feat.words = checked.text.split(/\s+/).length;
      try { opts.onFrame(frame.id, move, checked.text, feat); } catch (e) {}
    }
    return checked.text;
  }

  const wanted = moveOf(m);
  const safe = chooseFrom(MOVE_FALLBACK[wanted] || LEX.ack[m.register] || LEX.ack.plain,
                          `${bucket}:safe:${wanted}`, rng) || 'Copy.';
  if (opts.onFrame) {
    try { opts.onFrame('fallback-ack', 'expressive', safe); } catch (e) {}
  }
  return last && isWellFormed(last) && !checkMove(last, moveOf(m), m) ? last : safe;
}

const MOVE_FALLBACK = {
  statement:  ['Nothing more to add.', 'That is where it stands.', 'That is all I have.'],
  question:   ['Say again?', 'How do you read that?', 'What is your read?'],
  comment:    ['Hm.', 'That is one way to put it.', 'Noted.'],
  accusation: ['I am not letting that go.', 'That is on you and you know it.'],
  denial:     ['No.', 'That was not me.', 'Not how it happened.'],
  directive:  ['Stand by.', 'Hold what you have.'],
  commitment: ['I will see to it.', 'Consider it done.'],
  expressive: ['Copy.', 'Understood.', 'Noted.']
};

const FALLBACK_ACT = {
  tip: 'inform', report: 'inform', confirm: 'ask', order: 'request',
  negotiate: 'offer', boast: 'inform', complain: 'inform', speculate: 'inform',
  accept: 'ack', refuse: 'ack', thank: 'ack', apologise: 'ack',
  accuse: 'warn', deny: 'refuse', admit: 'inform', answer: 'inform',
  greet: 'ack', farewell: 'ack', warn: 'inform', offer: 'inform', request: 'ask'
};

function decorate(body, m, opts, prof, g, roll, feat = null) {
  const reg = m.register;
  const forceful = m.act === 'accuse' || m.act === 'deny' || m.act === 'order' || m.act === 'warn';
  const bare = forceful ||
    m.act === 'ack' || m.act === 'ask' || m.act === 'greet' || m.act === 'farewell';

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

  if (!bare && prof.dropSubject > 0 && roll() < prof.dropSubject) {
    const dropped = out.replace(/^(I|We)\s+(am|are|have|will)\s+/, (mm, s, aux) =>
      aux === 'am' || aux === 'are' ? '' : `${aux === 'have' ? '' : aux + ' '}`);
    if (dropped !== out && /^[a-z]/i.test(dropped) && dropped.split(' ').length >= 3) {
      out = cap(dropped);
    }
  }

  const slack = prof.maxWords < 12 ? 2 : 6;
  if (!m.noTrim && !/\?$/.test(out) && prof.maxWords && out.split(/\s+/).length > prof.maxWords + slack) {
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

  const stub = out.replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean).length < 5;

  const lengthPref = opts.lengthPref || 0;
  const fuller = lengthPref > 0 ? 1 + lengthPref * 0.8 : 1 + lengthPref * 0.5;

  if (opts.marker !== false && !bare && !stub && roll() < prof.marker * fuller) {
    const mk = g.pick(LEX.marker[reg] || LEX.marker.plain, 'marker');
    if (mk) {
      out = /[.!?]$/.test(mk) ? `${mk} ${cap(out)}` : `${mk} ${softLower(out)}`;
      if (feat) feat.marker = true;
    }
  }

  if (opts.hedge !== false && !bare && !stub && roll() < prof.hedge * fuller) {
    const h = g.pick(LEX.hedge[reg] || LEX.hedge.plain, 'hedge');
    if (h && /\.$/.test(out)) { out = out.replace(/\.$/, `, ${h}.`); if (feat) feat.hedge = true; }
  }

  const addressed = m.target != null && m.target !== '';
  const namesSomebody = /\b[A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|\d{2}))+\b/.test(out);
  if (opts.vocative && !addressed && !namesSomebody && !out.includes(opts.vocative) &&
      roll() < prof.vocative * fuller) {
    out = roll() < 0.5
      ? `${opts.vocative}, ${softLower(out)}`
      : out.replace(/\.$/, `, ${opts.vocative}.`);
    if (feat) feat.vocative = true;
  }

  out = contract(out, prof.contract, g.rng);

  if (opts.signoff && roll() < prof.signoff) {
    const so = g.pick(LEX.signoff[reg] || LEX.signoff.plain, 'signoff');
    if (so) {
      const filled = so.replace(/\{a\}/g, m.speaker || 'this hull')
                       .replace(/\{b\}/g, opts.vocative || 'you');
      out += ' ' + cap(filled);
    }
  }

  return fixI(cap(out));
}

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

const PREDICATIVE_ONLY = /^(worth\b|better\b|not\b|about done|no place|a long way|from last|in a bad way|good for it|light on|right on top|inside the|over the|below the|held together|one more|held\b|due\b|off the)/i;

export function attributive(adj) {
  return !!adj && !PREDICATIVE_ONLY.test(String(adj).trim());
}

export function described(kind, quality, opts = {}) {
  const noun = chooseFrom(LEX.noun[kind] || [kind], `${opts.bucket || 'd'}:${kind}`, opts.rng) || kind;
  const adjPool = (LEX.adj[quality] || [quality]).filter(attributive);
  const adj = chooseFrom(adjPool.length ? adjPool : [quality], `${opts.bucket || 'd'}:${quality}`, opts.rng) || quality;
  return np(noun, {
    det: opts.det || 'indef',
    adj,
    count: opts.count || 1,
    mass: opts.mass != null ? opts.mass : isMass(noun)
  });
}

export function place(name, opts = {}) {
  const forms = name
    ? [`at ${name}`, `off ${name}`, `out by ${name}`, `${name} side`, `close in on ${name}`]
    : ['out here', 'on this leg', 'where I am', 'on the board', 'this side of the marker'];
  return chooseFrom(forms, `${opts.bucket || 'p'}:place`, opts.rng) || forms[0];
}

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

export function phonetic(code) {
  return String(code || '').toUpperCase().split('').map(c => {
    if (PHONETIC[c]) return PHONETIC[c];
    if (/[0-9]/.test(c)) return ONES[+c];
    return null;
  }).filter(Boolean).join(' ');
}

export function shortName(name, familiarity = 0) {
  const s = String(name || '').trim();
  if (!s) return s;
  if (familiarity <= 1) return s;
  const parts = s.split(/\s+/);

  const TYPE_PREFIX = /^(nexis|bulk|coalition|tessera|charter|free|long|old|halcyon|meridian|kestrel|pale|deep|ostrava|harrow|cinder|writ|standing)$/i;
  const NUMBERED = /^\d+$/.test(parts[parts.length - 1]);

  if (familiarity >= 3 && parts.length > 2 && TYPE_PREFIX.test(parts[0])) {
    return parts.slice(1).join(' ');
  }
  if (familiarity >= 8 && NUMBERED && parts.length > 2) {
    return parts.slice(-2).join(' ');
  }
  return s;
}

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

export function realiseAll(records, opts = {}) {
  const out = [];
  for (const r of (records || [])) {
    if (!r) continue;
    const first = out.length === 0;
    const sub = Object.assign({}, opts, {
      bucket: `${opts.bucket || 'multi'}:${out.length}`,
      vocative: first ? opts.vocative : null,
      hedge: first ? opts.hedge : false,
      marker: first ? opts.marker : false,
      signoff: first ? false : opts.signoff
    });
    const line = realise(r, sub);
    if (line) out.push(line);
  }
  const joined = out.join(' ');
  const checked = proof(joined);
  return checked.ok ? checked.text : (out[0] || '');
}

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

const CASES = [
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

export function varietyOf(msg, n = 40, opts = {}) {
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    seen.add(realise(msg, Object.assign({ bucket: 'variety' }, opts)));
  }
  return { distinct: seen.size, of: n, ratio: seen.size / n, samples: [...seen].slice(0, 8) };
}

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

const bucketFor = (a, topicKey) => `${a && a.name}:${topicKey}`;
const pairBucket = (a, b, topicKey) =>
  `pair:${[a && a.name, b && b.name].sort().join('~')}:${topicKey}`;

const same = (a, b) => a.faction === b.faction;
const role = (u, r) => u.role === r;
const anyRole = (u, ...rs) => rs.includes(u.role);
const hurt = u => u.hp < u.maxHp * 0.6;
const badlyHurt = u => u.hp < u.maxHp * 0.3;
const healthy = u => u.hp >= u.maxHp * 0.9;
const armed = u => u.role === 'combat' || u.role === 'merc' || u.role === 'patrol';
const civilian = u => !armed(u) && u.role !== 'fort';

const laden = u => u.cargo != null && u.cargoMax > 0 && u.cargo >= u.cargoMax * 0.8;
const empty = u => u.cargo != null && u.cargoMax > 0 && u.cargo <= u.cargoMax * 0.15;
const partLaden = u => u.cargo != null && !laden(u) && !empty(u);

const lowFuel = u => u.fuel != null && u.fuelMax > 0 && u.fuel < u.fuelMax * 0.25;
const fatFuel = u => u.fuel != null && u.fuelMax > 0 && u.fuel > u.fuelMax * 0.7;

const working = u => u.task === 'work' || u.task === 'mine' || u.task === 'haul';
const idle = u => u.task === 'idle' || u.task == null;
const docked = u => !!u.docked;
const transiting = u => u.task === 'transit' || u.task === 'travel';
const fleeing = u => u.task === 'flee' || u.task === 'evade';
const engaged = u => u.task === 'attack' || u.task === 'engage' || !!u.inCombat;

function dist(a, b) {
  if (!a || !b || !a.position || !b.position) return 0;
  const dx = a.position.x - b.position.x;
  const dy = a.position.y - b.position.y;
  const dz = (a.position.z || 0) - (b.position.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
const near = (a, b, d = 400) => dist(a, b) <= d;
const far = (a, b, d = 1200) => dist(a, b) > d;

const known = rel => (rel && rel.exchanges > 0);
const familiar = rel => (rel && rel.exchanges >= 4);
const oldFriends = rel => (rel && rel.exchanges >= 12 && (rel.regard || 0) > 0.3);
const strangers = rel => !rel || !rel.exchanges;
const warm = rel => (rel && (rel.regard || 0) > 0.25);
const cold = rel => (rel && (rel.regard || 0) < -0.25);
const owes = (rel) => !!(rel && rel.owes);
const owed = (rel) => !!(rel && rel.owed);

const familiarity = rel => (rel ? (rel.exchanges || 0) : 0);

const nameFor = (u, rel) => shortName(u && u.name, familiarity(rel));

const has = (ctx, fn) => !!(ctx && typeof ctx[fn] === 'function');

function gradeFact(u, bucket) {
  const q = u.oreGrade != null ? u.oreGrade : 0.5;
  const quality = q > 0.7 ? 'good' : q < 0.35 ? 'bad' : 'quiet';
  return { quality, phrase: described('face', quality, { bucket, det: 'def' }) };
}

function holdFact(u, bucket) {
  if (u.cargo == null || !u.cargoMax) return quantity('hold', null, { bucket, det: 'indef' });
  const frac = u.cargo / u.cargoMax;
  if (frac >= 0.95) return chooseFrom(['a full hold', 'every bin closed out', 'all the hold will take'], `${bucket}:holdFull`);
  if (frac >= 0.6) return chooseFrom(['most of a hold', 'the better part of a load', 'a good three quarters'], `${bucket}:holdMost`);
  if (frac >= 0.2) return chooseFrom(['a part load', 'a few bins', 'not a full can'], `${bucket}:holdSome`);
  return chooseFrom(['an empty hold', 'nothing in the can', 'clean bins'], `${bucket}:holdEmpty`);
}

function priceFact(n, bucket) {
  if (n == null) return chooseFrom(['the posted rate', 'what it is worth', 'the going number'], `${bucket}:priceVague`);
  const r = Math.round(n);
  return chooseFrom([
    `${r.toLocaleString('en-US')} a unit`,
    `${r.toLocaleString('en-US')}`,
    `${vagueCount(r, { bucket })} a unit`
  ], `${bucket}:price`);
}

function whereFact(u, bucket) {
  const anchor = u.nearestName || u.sectorName || u.claimName || null;
  return place(anchor, { bucket });
}

function threatFact(n, bucket) {
  if (!n) return chooseFrom(['nothing on the board', 'a clear sweep', 'no returns'], `${bucket}:noThreat`);
  if (n === 1) return chooseFrom(['one contact', 'a single return', 'one hull I do not like'], `${bucket}:oneThreat`);
  const q = vagueCount(n, { bucket });
  const partitive = /^(a pair|a couple|a handful)$/.test(q);
  return `${q}${partitive ? ' of' : ''} contacts`;
}

function damageFact(u, bucket) {
  const frac = u.maxHp ? u.hp / u.maxHp : 1;
  if (frac > 0.85) return chooseFrom(['a few scratches', 'nothing that matters', 'paint damage'], `${bucket}:dmgLight`);
  if (frac > 0.5) return chooseFrom(['some holes', 'a bit chewed', 'more damage than I like'], `${bucket}:dmgMed`);
  if (frac > 0.25) return chooseFrom(['a bad beating', 'holed in three places', 'a working over'], `${bucket}:dmgHeavy`);
  return chooseFrom(['about done', 'held together with hope', 'one more hit from scrap'], `${bucket}:dmgCritical`);
}

function whenFact(seconds, bucket) {
  return timeRef(seconds, { bucket });
}

function headingFact(deg, bucket) {
  return deg == null ? place(null, { bucket }) : bearing(deg, { bucket });
}

function reasonFact(u, bucket) {
  const reasons = [];
  if (laden(u)) reasons.push('I am loaded out');
  if (empty(u)) reasons.push('I am running empty');
  if (lowFuel(u)) reasons.push('I am thin on reaction mass');
  if (hurt(u)) reasons.push('I have holes to see to');
  if (docked(u)) reasons.push('I am tied up at the ring');
  if (transiting(u)) reasons.push('I am mid-leg');
  if (engaged(u)) reasons.push('I have my hands full');
  if (working(u)) reasons.push('I am on the clock');
  if (!reasons.length) reasons.push('I have a schedule to keep', 'it is not my leg');
  return chooseFrom(reasons, `${bucket}:reason`);
}

function needFact(u, bucket) {
  if (lowFuel(u)) return chooseFrom(['reaction mass', 'a fuel top-off', 'anything I can burn'], `${bucket}:needFuel`);
  if (hurt(u)) return chooseFrom(['a patch', 'yard time', 'somebody with a welder'], `${bucket}:needRepair`);
  if (laden(u) && role(u, 'mine')) return chooseFrom(['a hauler', 'somebody with empty bins', 'a lift'], `${bucket}:needHaul`);
  if (empty(u) && role(u, 'haul')) return chooseFrom(['a load', 'work', 'something worth lifting'], `${bucket}:needWork`);
  if (civilian(u)) return chooseFrom(['cover', 'an escort', 'somebody armed on this leg'], `${bucket}:needEscort`);
  return chooseFrom(['a berth', 'a clear lane', 'a straight answer'], `${bucket}:needGeneric`);
}

export const TOPICS = {

  checkIn: {
    channel: 'local', weight: 10, cooldown: 90, priority: 1,
    when: (a, b) => same(a, b) && !engaged(a) && !engaged(b),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: known(rel) ? 'ask' : 'inform',
        register: registerOf(a),
        subject: known(rel) ? 'you' : 'I',
        agr: known(rel) ? { person: 2, number: 'sg' } : { person: 1, number: 'sg' },
        verb: known(rel) ? 'hold' : 'mark',
        object: known(rel) ? null : `${nameFor(b, rel)} on my board`,
        where: known(rel) ? whereFact(a, bucket) : null,
        vocative: nameFor(b, rel)
      }),
      ({ a, b, rel, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        object: known(rel)
          ? chooseFrom(['nothing moving', 'where I said I would be', 'all quiet on my scope'],
                       `${bucket}:checkReply`)
          : nameFor(b, rel),
        verb: 'hold'
      })
    ],
    filesFrom: { type: 'spoke-with', weight: 0.4 },
    filesTo:   { type: 'spoke-with', weight: 0.4 },
    chains: ['smallTalk', 'shiftComplaint']
  },

  smallTalk: {
    channel: 'local', weight: 7, cooldown: 300, priority: 0,
    when: (a, b, ctx) => same(a, b) && known(ctx.rel) && !engaged(a) && !engaged(b) && !hurt(a),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'inform',
        register: registerOf(a),
        object: chooseFrom([
          'this shift has been the long kind',
          'the belt is quiet enough to hear the hull tick',
          'I have not seen a fresh face out here in three cycles',
          'the coffee ran out somewhere around the second leg',
          'my board has been the same picture for an hour'
        ], `${bucket}:small`),
        vocative: warm(rel) ? nameFor(b, rel) : null
      }),
      ({ a, rel, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        object: chooseFrom([
          'same on this end',
          'you and me both',
          'that is the job',
          'better quiet than the other thing'
        ], `${bucket}:smallReply`)
      }),
      ({ a, b, rel, bucket }) => ({
        act: familiar(rel) ? 'inform' : 'farewell',
        register: registerOf(a),
        object: familiar(rel) ? chooseFrom([
          'I will be on this band if you get bored',
          'find me at the ring and the first round is mine',
          'give me a shout when you turn for home'
        ], `${bucket}:smallClose`) : null,
        speaker: a.name,
        target: nameFor(b, rel)
      })
    ],
    filesFrom: { type: 'spoke-with', weight: 0.5 },
    filesTo:   { type: 'spoke-with', weight: 0.5 },
    chains: ['shiftComplaint', 'shareRumour']
  },

  shiftComplaint: {
    channel: 'local', weight: 6, cooldown: 420, priority: 0,
    when: (a, b, ctx) => same(a, b) && known(ctx.rel) && (working(a) || hurt(a) || lowFuel(a)),
    say: [
      ({ a, bucket }) => ({
        act: 'complain',
        register: registerOf(a),
        object: chooseFrom([
          'the yard signed off on this drive two cycles ago',
          'whoever routed this leg has never flown it',
          'the posted rate has not moved since the last audit',
          'my scrubbers are due and nobody wants to hear it'
        ], `${bucket}:gripe`),
        because: reasonFact(a, bucket)
      }),
      ({ a, rel, bucket }) => ({
        act: cold(rel) ? 'ack' : 'inform',
        register: registerOf(a),
        object: chooseFrom([
          'take it up with the ring and see how far you get',
          'I stopped filing on that a long time back',
          'put it in the log and let somebody else read it',
          'we are all flying the same paperwork'
        ], `${bucket}:gripeReply`)
      })
    ],
    filesFrom: { type: 'spoke-with', weight: 0.3 },
    filesTo:   { type: 'spoke-with', weight: 0.3 }
  },

  positionReport: {
    channel: 'local', weight: 8, cooldown: 150, priority: 2,
    when: (a, b) => same(a, b) && (transiting(a) || working(a)) && !engaged(a),
    say: [
      ({ a, b, rel, bucket }) => ([
        {
          act: 'report',
          register: registerOf(a),
          subject: 'I',
          verb: transiting(a) ? 'run' : 'work',
          agr: { person: 1, number: 'sg', aspect: 'prog' },
          where: whereFact(a, bucket),
          vocative: nameFor(b, rel)
        },
        {
          act: 'inform',
          register: registerOf(a),
          object: chooseFrom(['board is clear this side', 'nothing on the sweep', 'no traffic worth calling'],
                             `${bucket}:posClear`)
        }
      ]),
      ({ a, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        verb: 'mark',
        object: chooseFrom(['you on my board', 'your track', 'the position'], `${bucket}:posAck`)
      })
    ],
    filesFrom: { type: 'reported-position', weight: 0.3 },
    filesTo:   { type: 'knows-position', weight: 0.5 }
  },

  oreTip: {
    channel: 'trade', weight: 14, cooldown: 240, priority: 3,
    when: (a, b) => role(a, 'mine') && anyRole(b, 'mine', 'haul', 'trade'),
    say: [
      ({ a, b, rel, bucket }) => {
        const grade = gradeFact(a, bucket);
        return {
          act: 'tip',
          register: registerOf(a),
          subject: grade.phrase,
          verb: 'read',
          object: described('ore', grade.quality, { bucket, det: 'none' }),
          where: whereFact(a, bucket),
          vocative: nameFor(b, rel)
        };
      },
      ({ a, rel, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        object: known(rel) ? chooseFrom(['worth a look', 'that is useful', 'I will swing that way'],
                                        `${bucket}:tipAck`) : null,
        verb: 'look'
      })
    ],
    filesFrom: { type: 'gave-tip', weight: 0.8 },
    filesTo:   { type: 'got-tip', weight: 1.0 },
    chains: ['tipFollowUp', 'haulOffer']
  },

  tipFollowUp: {
    channel: 'trade', weight: 11, cooldown: 300, priority: 3,
    when: (a, b, ctx) => has(ctx, 'recallBetween') && ctx.recallBetween(a, b, 'got-tip'),
    say: [
      ({ a, b, rel, bucket, ctx }) => {
        const good = has(ctx, 'tipWasGood') ? ctx.tipWasGood(a, b) : (a.oreGrade || 0.5) > 0.5;
        return {
          act: good ? 'thank' : 'complain',
          register: registerOf(a),
          object: good
            ? chooseFrom(['that face read exactly as you called it', 'the seam paid out',
                          'your line was good'], `${bucket}:tipGood`)
            : chooseFrom(['that face was picked over before I got there',
                          'I burned a leg for nothing', 'your line was cold'], `${bucket}:tipBad`),
          vocative: nameFor(b, rel)
        };
      },
      ({ a, b, rel, bucket, ctx }) => {
        const good = has(ctx, 'tipWasGood') ? ctx.tipWasGood(b, a) : true;
        return {
          act: good ? 'ack' : 'apologise',
          register: registerOf(a),
          object: good
            ? chooseFrom(['glad it paid', 'that is what it is for', 'I will send the next one your way'],
                         `${bucket}:tipGoodAck`)
            : chooseFrom(['it was reading clean when I left it', 'somebody got there ahead of us',
                          'I would not have passed it if I had known'], `${bucket}:tipBadAck`)
        };
      }
    ],
    filesFrom: { type: 'rated-source', weight: 1.4 },
    filesTo:   { type: 'was-rated', weight: 1.0 },
    chains: ['oreTip']
  },

  claimDispute: {
    channel: 'trade', weight: 7, cooldown: 600, priority: 4,
    when: (a, b, ctx) => role(a, 'mine') && role(b, 'mine') && !same(a, b) && near(a, b, 250),
    mood: 'gruff',
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'warn',
        register: 'gruff',
        object: chooseFrom([
          'you are cutting inside my marker',
          'that face is filed and it is filed to me',
          'there is a beacon on this claim and it is not yours'
        ], `${bucket}:claim`),
        where: whereFact(a, bucket),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => ({
        act: cold(rel) ? 'refuse' : 'speculate',
        register: registerOf(a),
        object: cold(rel)
          ? null
          : chooseFrom(['the filing office has us both on this rock',
                        'my chart puts the line two hundred out from here',
                        'somebody has been sloppy with the survey'], `${bucket}:claimReply`),
        because: cold(rel) ? chooseFrom(['I cut where the rock is', 'I do not read it that way'],
                                        `${bucket}:claimRefuse`) : null
      }),
      ({ a, rel, bucket }) => ({
        act: warm(rel) ? 'accept' : 'warn',
        register: registerOf(a),
        object: warm(rel)
          ? chooseFrom(['take the north face and I will work south', 'split it and nobody files anything',
                        'work it and we will sort the paper at the ring'], `${bucket}:claimSettle`)
          : chooseFrom(['I have your registry logged', 'this goes to the ring', 'we will do this properly then'],
                       `${bucket}:claimEscalate`)
      })
    ],
    filesFrom: { type: 'disputed-claim', weight: 1.1 },
    filesTo:   { type: 'was-disputed', weight: 1.1 },
    chains: ['grudge', 'apology']
  },

  gradeReport: {
    channel: 'trade', weight: 9, cooldown: 200, priority: 2,
    when: (a, b) => role(a, 'mine') && anyRole(b, 'mine', 'trade') && a.oreGrade != null,
    say: [
      ({ a, bucket }) => {
        const g = gradeFact(a, bucket);
        return {
          act: 'report',
          register: registerOf(a),
          subject: g.phrase,
          quality: chooseFrom(g.quality === 'good' ? ['running fat', 'better than the survey said', 'paying']
                            : g.quality === 'bad' ? ['thin', 'not paying the burn', 'about done']
                            : ['steady', 'about what was posted', 'nothing special'], `${bucket}:gradeQ`),
          where: whereFact(a, bucket)
        };
      },
      ({ a, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        object: chooseFrom(['logged', 'that matches my last sweep', 'noted against the survey'],
                           `${bucket}:gradeAck`)
      })
    ],
    filesFrom: { type: 'shared-survey', weight: 0.6 },
    filesTo:   { type: 'got-survey', weight: 0.7 }
  },

  haulOffer: {
    channel: 'trade', weight: 12, cooldown: 200, priority: 4,
    when: (a, b) => role(a, 'mine') && role(b, 'haul') && !laden(b),
    offers: 'haul',
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'offer',
        register: registerOf(a),
        subject: 'I',
        agr: { person: 1, number: 'sg' },
        verb: 'fill',
        object: holdFact(a, bucket),
        where: whereFact(a, bucket),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => ({
        act: known(rel) ? 'accept' : 'ask',
        register: registerOf(a),
        subject: 'I',
        agr: { person: 1, number: 'sg' },
        verb: 'have',
        object: holdFact(a, bucket),
        condition: known(rel) ? null : chooseFrom(['if the rate holds', 'if it is on my leg'],
                                                  `${bucket}:haulCond`)
      }),
      ({ a, b, rel, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        verb: 'come',
        object: chooseFrom(['I will be alongside inside the hour', 'burning your way now',
                            'hold what you have and I will take it'], `${bucket}:haulClose`)
      })
    ],
    filesFrom: { type: 'offered-work', weight: 1.0 },
    filesTo:   { type: 'offered-work-to-me', weight: 1.0 },
    chains: ['deliveryConfirm', 'priceHaggle']
  },

  priceHaggle: {
    channel: 'trade', weight: 10, cooldown: 260, priority: 4,
    when: (a, b) => anyRole(a, 'trade', 'mine') && anyRole(b, 'trade', 'haul') && !same(a, b),
    offers: 'trade',
    say: [
      ({ a, b, rel, bucket, ctx }) => ({
        act: 'negotiate',
        register: registerOf(a),
        object: holdFact(a, bucket),
        price: priceFact(has(ctx, 'askingPrice') ? ctx.askingPrice(a) : a.askPrice, bucket),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket, ctx }) => ({
        act: 'refuse',
        register: registerOf(a),
        counter: priceFact(has(ctx, 'counterPrice') ? ctx.counterPrice(a) : a.bidPrice, bucket),
        because: chooseFrom(['the posted rate is nowhere near that', 'I have to move it after I lift it',
                             'that is a yard price, not a belt price'], `${bucket}:haggleWhy`)
      }),
      ({ a, rel, bucket, ctx }) => {
        const close = warm(rel) || (has(ctx, 'dealCloses') ? ctx.dealCloses(a) : true);
        return {
          act: close ? 'accept' : 'refuse',
          register: registerOf(a),
          object: close ? chooseFrom(['split the difference and it is done', 'take it', 'that will do'],
                                     `${bucket}:haggleClose`) : null,
          because: close ? null : chooseFrom(['I will take it to the next ring', 'not at that number'],
                                             `${bucket}:haggleWalk`)
        };
      }
    ],
    filesFrom: { type: 'haggled-with', weight: 0.9 },
    filesTo:   { type: 'haggled-with', weight: 0.9 },
    chains: ['deliveryConfirm', 'grudge']
  },

  deliveryConfirm: {
    channel: 'trade', weight: 9, cooldown: 240, priority: 4,
    when: (a, b, ctx) => has(ctx, 'recallBetween') &&
      (ctx.recallBetween(a, b, 'offered-work-to-me') || ctx.recallBetween(a, b, 'haggled-with')),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'report',
        register: registerOf(a),
        subject: 'the load',
        quality: chooseFrom(['set down and signed for', 'across and logged', 'on the pad'],
                            `${bucket}:delivered`),
        where: whereFact(a, bucket),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => ({
        act: 'thank',
        register: registerOf(a),
        object: chooseFrom(['that was quick work', 'clean run', 'no complaints from this end'],
                           `${bucket}:deliveredAck`)
      })
    ],
    filesFrom: { type: 'completed-work', weight: 1.6 },
    filesTo:   { type: 'work-done-for-me', weight: 1.6 },
    chains: ['recommend', 'haulOffer']
  },

  laneReport: {
    channel: 'trade', weight: 11, cooldown: 180, priority: 3,
    when: (a, b) => anyRole(a, 'haul', 'trade', 'patrol') && !engaged(a),
    say: [
      ({ a, b, rel, bucket, ctx }) => {
        const contacts = has(ctx, 'trafficNear') ? ctx.trafficNear(a) : 0;
        const quiet = contacts < 2;
        return {
          act: 'tip',
          register: registerOf(a),
          subject: described('lane', quiet ? 'quiet' : 'busy', { bucket, det: 'def' }),
          verb: 'read',
          object: quiet
            ? chooseFrom(['clear all the way through', 'empty', 'nothing worth slowing for'], `${bucket}:laneQuiet`)
            : threatFact(contacts, bucket),
          where: whereFact(a, bucket),
          vocative: nameFor(b, rel)
        };
      },
      ({ a, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        object: chooseFrom(['that matches what I had', 'good to know before I commit',
                            'I was about to route through there'], `${bucket}:laneAck`)
      })
    ],
    filesFrom: { type: 'gave-tip', weight: 0.7 },
    filesTo:   { type: 'got-tip', weight: 0.8 },
    chains: ['tipFollowUp', 'escortRequest']
  },

  fuelBeg: {
    channel: 'local', weight: 13, cooldown: 300, priority: 6,
    when: (a, b) => lowFuel(a) && fatFuel(b) && near(a, b, 800),
    urgent: true,
    offers: 'fuel',
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'request',
        register: registerOf(a),
        object: needFact(a, bucket),
        where: whereFact(a, bucket),
        because: chooseFrom(['I misjudged the burn out of the last ring',
                             'the leg was longer than the chart said',
                             'I have been holding station longer than I planned'], `${bucket}:fuelWhy`),
        vocative: nameFor(b, rel),
        urgent: true
      }),
      ({ a, b, rel, bucket }) => ({
        act: warm(rel) || !cold(rel) ? 'accept' : 'refuse',
        register: registerOf(a),
        object: chooseFrom(['come alongside and I will pass you enough to make the ring',
                            'I can spare a quarter tank', 'match my burn and we will transfer'],
                           `${bucket}:fuelYes`),
        because: cold(rel) ? reasonFact(a, bucket) : null
      })
    ],
    filesFrom: { type: 'asked-help', weight: 1.1 },
    filesTo:   { type: 'was-asked-help', weight: 1.1 },
    chains: ['thanks', 'owesFavour']
  }
};

Object.assign(TOPICS, {

  askHelp: {
    channel: 'distress', weight: 22, cooldown: 60, priority: 9,
    when: (a, b) => same(a, b) && hurt(a) && armed(b),
    urgent: true,
    say: [
      ({ a, bucket }) => ({
        act: 'inform',
        register: registerOf(a),
        subject: a.name,
        agr: { person: 3, number: 'sg', aspect: 'prog' },
        verb: 'take',
        object: chooseFrom(['fire', 'hits', 'a working over', 'rounds through the hull'],
                           `${bucket}:distress`),
        frames: ['inform-progressive', 'inform-svo', 'inform-fronted'],
        where: whereFact(a, bucket),
        urgent: true
      }),
      ({ a, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        verb: 'come',
        object: chooseFrom(['I am coming about', 'burning your way now', 'on my way'],
                           `${bucket}:reply`),
        urgent: true
      }),
      ({ a, b, rel, bucket }) => ({
        act: 'request',
        register: registerOf(a),
        object: chooseFrom(['hold what you have and keep your nose to them',
                            'break off if you can and I will meet you halfway',
                            'give me a bearing and stay off the guns'], `${bucket}:distressGuide`),
        urgent: true,
        vocative: nameFor(b, rel)
      })
    ],
    filesFrom: { type: 'asked-help', weight: 1.2 },
    filesTo:   { type: 'was-asked-help', weight: 1.2 },
    chains: ['thanks', 'rescueReport', 'owesFavour']
  },

  refuseHelp: {
    channel: 'distress', weight: 9, cooldown: 240, priority: 8,
    when: (a, b) => hurt(a) && (civilian(b) || hurt(b) || lowFuel(b) || far(a, b, 1500)),
    urgent: true,
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'request',
        register: registerOf(a),
        object: chooseFrom(['anybody on this band', 'somebody with guns', 'any hull that can turn'],
                           `${bucket}:mayday`),
        where: whereFact(a, bucket),
        urgent: true,
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket }) => ({
        act: 'refuse',
        register: registerOf(a),
        because: reasonFact(a, bucket),
        object: chooseFrom(['I am no use to you', 'I would not get there in time',
                            'I have nothing that shoots'], `${bucket}:cannot`),
        urgent: true
      }),
      ({ a, bucket }) => ({
        act: 'inform',
        register: registerOf(a),
        object: chooseFrom(['I have pushed your position to the ring',
                            'I am relaying you on the coalition band',
                            'somebody armed will have heard that'], `${bucket}:relay`)
      })
    ],
    filesFrom: { type: 'asked-help', weight: 1.0 },
    filesTo:   { type: 'refused-help', weight: -1.2 },
    chains: ['grudge', 'apology']
  },

  rescueReport: {
    channel: 'distress', weight: 8, cooldown: 200, priority: 7,
    when: (a, b, ctx) => armed(a) && has(ctx, 'recallBetween') && ctx.recallBetween(a, b, 'asked-help'),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'report',
        register: registerOf(a),
        object: chooseFrom(['they have broken off', 'the board is clear where you are',
                            'whatever was on you has gone'], `${bucket}:rescued`),
        frames: ['inform-verbless', 'warn-declarative', 'inform-contrast'],
        where: whereFact(a, bucket),
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket }) => ({
        act: 'thank',
        register: registerOf(a),
        object: chooseFrom(['that was close', 'I was about done', 'you cut that fine and I am glad you did'],
                           `${bucket}:rescuedThanks`)
      })
    ],
    filesFrom: { type: 'gave-help', weight: 1.8 },
    filesTo:   { type: 'was-helped', weight: 1.8 },
    chains: ['thanks', 'owesFavour', 'recommend']
  },

  medicalAid: {
    channel: 'distress', weight: 7, cooldown: 400, priority: 7,
    when: (a, b) => badlyHurt(a) && !engaged(a) && anyRole(b, 'build', 'trade', 'haul', 'patrol'),
    urgent: true,
    say: [
      ({ a, bucket }) => ([
        {
          act: 'report',
          register: registerOf(a),
          subject: 'I',
          quality: damageFact(a, bucket),
          urgent: true
        },
        {
          act: 'request',
          register: registerOf(a),
          object: chooseFrom(['a berth I can limp to', 'somebody with a welder',
                              'a tow if you have the mass for it'], `${bucket}:aidNeed`),
          urgent: true
        }
      ]),
      ({ a, b, rel, bucket }) => ({
        act: 'offer',
        register: registerOf(a),
        object: chooseFrom(['the nearest ring inside your endurance', 'a hard point on my hull',
                            'yard time under my account'], `${bucket}:aidOffer`),
        where: whereFact(a, bucket),
        vocative: nameFor(b, rel)
      })
    ],
    filesFrom: { type: 'asked-help', weight: 1.3 },
    filesTo:   { type: 'was-asked-help', weight: 1.3 },
    chains: ['thanks', 'repairOffer']
  },

  repairOffer: {
    channel: 'local', weight: 8, cooldown: 300, priority: 5,
    when: (a, b) => hurt(b) && anyRole(a, 'build', 'salvage', 'trade') && near(a, b, 700),
    offers: 'repair',
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'offer',
        register: registerOf(a),
        verb: 'patch',
        object: chooseFrom(['that hull', 'the worst of it', 'what is leaking'], `${bucket}:repairWhat`),
        where: whereFact(a, bucket),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => ({
        act: warm(rel) || !cold(rel) ? 'accept' : 'refuse',
        register: registerOf(a),
        object: chooseFrom(['I will take that', 'name your rate and I will pay it',
                            'come alongside'], `${bucket}:repairYes`),
        because: cold(rel) ? chooseFrom(['I will see to it at the ring', 'I would rather not owe anybody'],
                                        `${bucket}:repairNo`) : null
      })
    ],
    filesFrom: { type: 'offered-work', weight: 0.9 },
    filesTo:   { type: 'offered-work-to-me', weight: 0.9 },
    chains: ['deliveryConfirm', 'thanks']
  },

  escortRequest: {
    channel: 'local', weight: 10, cooldown: 280, priority: 6,
    when: (a, b) => civilian(a) && armed(b) && (laden(a) || hurt(a) || transiting(a)),
    offers: 'escort',
    say: [
      ({ a, b, rel, bucket, ctx }) => ({
        act: 'request',
        register: registerOf(a),
        object: chooseFrom(['cover as far as the ring', 'a wing on this leg', 'somebody at my six'],
                           `${bucket}:escortAsk`),
        because: has(ctx, 'threatNear') && ctx.threatNear(a)
          ? chooseFrom(['there is something sitting the corridor', 'the lane has been ugly all shift'],
                       `${bucket}:escortWhy`)
          : (laden(a) ? 'I am carrying more than I want to lose' : null),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => ({
        act: warm(rel) || familiar(rel) ? 'accept' : 'negotiate',
        register: registerOf(a),
        object: warm(rel) || familiar(rel)
          ? chooseFrom(['fall in behind me', 'I will walk you in', 'stay on my wing and keep it steady'],
                       `${bucket}:escortYes`)
          : chooseFrom(['I can do it', 'that is a job, not a favour'], `${bucket}:escortTerms`),
        price: warm(rel) || familiar(rel) ? null : priceFact(null, bucket)
      })
    ],
    filesFrom: { type: 'asked-help', weight: 1.0 },
    filesTo:   { type: 'was-asked-help', weight: 1.0 },
    chains: ['escortComplete', 'priceHaggle']
  },

  escortComplete: {
    channel: 'local', weight: 7, cooldown: 400, priority: 4,
    when: (a, b, ctx) => has(ctx, 'recallBetween') && ctx.recallBetween(a, b, 'was-asked-help') && !hurt(b),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'inform',
        register: registerOf(a),
        object: chooseFrom(['that is you inside the marker', 'you are covered from here',
                            'the ring has you on approach'], `${bucket}:escortDone`),
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket }) => ({
        act: 'thank',
        register: registerOf(a),
        object: chooseFrom(['clean run', 'no trouble at all with you back there',
                            'I sleep better with a gun on the wing'], `${bucket}:escortThanks`)
      })
    ],
    filesFrom: { type: 'gave-help', weight: 1.4 },
    filesTo:   { type: 'was-helped', weight: 1.4 },
    chains: ['thanks', 'recommend']
  },

  thanks: {
    channel: 'local', weight: 8, cooldown: 300, priority: 3,
    when: (a, b, ctx) => same(a, b) && has(ctx, 'recallBetween') &&
      (ctx.recallBetween(a, b, 'was-asked-help') || ctx.recallBetween(a, b, 'was-helped')),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'inform',
        register: registerOf(a),
        subject: 'I',
        agr: { person: 1, number: 'sg' },
        verb: 'owe',
        object: chooseFrom(['you for that one', 'you a favour', 'you one'],
                           `${bucket}:thanks`),
        frames: ['inform-svo'],
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket }) => ({
        act: 'inform',
        register: registerOf(a),
        object: chooseFrom(['buy me something at the next berth',
                            'settle it at the ring and we are square',
                            'you would have done the same'],
                           `${bucket}:thanksReply`),
        frames: ['inform-verbless', 'inform-contrast']
      })
    ],
    filesFrom: { type: 'owes-favour', weight: 1.5 },
    filesTo:   { type: 'owed-favour', weight: 1.5 },
    chains: ['owesFavour', 'recommend']
  },

  owesFavour: {
    channel: 'local', weight: 9, cooldown: 500, priority: 5,
    when: (a, b, ctx) => has(ctx, 'recallBetween') && ctx.recallBetween(a, b, 'owed-favour'),
    offers: 'favour',
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'request',
        register: registerOf(a),
        object: needFact(a, bucket),
        because: chooseFrom(['you said to call it in', 'I am calling in that marker',
                             'you owe me one and I need it now'], `${bucket}:callFavour`),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => ({
        act: cold(rel) ? 'refuse' : 'accept',
        register: registerOf(a),
        object: cold(rel) ? null : chooseFrom(['fair is fair', 'I said I would and I will',
                                               'consider it settled'], `${bucket}:favourYes`),
        because: cold(rel) ? reasonFact(a, bucket) : null
      })
    ],
    filesFrom: { type: 'called-favour', weight: 1.2 },
    filesTo:   { type: 'favour-called', weight: 1.2 },
    chains: ['deliveryConfirm', 'grudge']
  },

  apology: {
    channel: 'local', weight: 6, cooldown: 600, priority: 3,
    when: (a, b, ctx) => has(ctx, 'recallBetween') &&
      (ctx.recallBetween(a, b, 'was-disputed') || ctx.recallBetween(a, b, 'refused-help')),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'apologise',
        register: registerOf(a),
        object: chooseFrom(['I was out of order on that band',
                            'I should have turned when you called',
                            'that claim business was mine to get wrong'], `${bucket}:sorry`),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => ({
        act: cold(rel) ? 'ack' : 'accept',
        register: registerOf(a),
        object: cold(rel)
          ? chooseFrom(['noted', 'we will see', 'words are cheap out here'], `${bucket}:sorryCold`)
          : chooseFrom(['forget it', 'it is done', 'we are square'], `${bucket}:sorryWarm`)
      })
    ],
    filesFrom: { type: 'apologised', weight: 0.8 },
    filesTo:   { type: 'was-apologised-to', weight: 1.0 },
    chains: ['smallTalk']
  }
});

Object.assign(TOPICS, {

  taunt: {
    channel: 'local', weight: 6, cooldown: 180, priority: 5,
    when: (a, b) => !same(a, b) && armed(a) && armed(b),
    mood: 'terse',
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'warn',
        register: registerOf(a),
        object: chooseFrom(['you are a long way from anywhere friendly',
                            'nobody out here is going to come for you',
                            'that is a lot of hull for one gun'],
                           `${bucket}:taunt`),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => ({
        act: 'warn',
        register: registerOf(a),
        object: known(rel)
          ? chooseFrom(['you again', 'still talking'], `${bucket}:tauntBack`)
          : chooseFrom(['say that closer', 'come and read it to me'], `${bucket}:tauntBack`)
      })
    ],
    filesFrom: { type: 'traded-words', weight: 0.5 },
    filesTo:   { type: 'traded-words', weight: 0.5 },
    chains: ['grudge', 'standoff']
  },

  standoff: {
    channel: 'local', weight: 8, cooldown: 220, priority: 7,
    when: (a, b) => !same(a, b) && armed(a) && armed(b) && near(a, b, 500) && !engaged(a),
    urgent: true,
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'order',
        register: registerOf(a),
        verb: chooseFrom(['hold', 'stand down', 'break off'], `${bucket}:standVerb`),
        where: whereFact(a, bucket),
        target: nameFor(b, rel),
        urgent: true
      }),
      ({ a, rel, bucket }) => ({
        act: cold(rel) ? 'refuse' : 'ask',
        register: registerOf(a),
        object: cold(rel) ? null : chooseFrom(['what is your intent', 'are we doing this',
                                               'state your business out here'], `${bucket}:standAsk`),
        because: cold(rel) ? chooseFrom(['I do not take orders on an open band',
                                         'you are not the authority out here'], `${bucket}:standRefuse`) : null,
        urgent: true
      }),
      ({ a, b, rel, bucket, ctx }) => {
        const backOff = !cold(rel) && (hurt(a) || civilian(b) || (has(ctx, 'wantsFight') ? !ctx.wantsFight(a) : true));
        return {
          act: backOff ? 'inform' : 'warn',
          register: registerOf(a),
          object: backOff
            ? chooseFrom(['I am turning out, nice and slow', 'no business with you today',
                          'we both fly out of here and nobody files anything'], `${bucket}:standDown`)
            : chooseFrom(['then we do it here', 'last chance to burn', 'guns up'], `${bucket}:standUp`),
          urgent: true
        };
      }
    ],
    filesFrom: { type: 'faced-off', weight: 1.0 },
    filesTo:   { type: 'faced-off', weight: 1.0 },
    chains: ['grudge', 'truce']
  },

  truce: {
    channel: 'local', weight: 5, cooldown: 900, priority: 4,
    when: (a, b, ctx) => !same(a, b) && has(ctx, 'recallBetween') && ctx.recallBetween(a, b, 'faced-off') &&
      !engaged(a) && !engaged(b),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'offer',
        register: registerOf(a),
        object: chooseFrom(['a clean pass, both ways', 'this lane wide enough for the pair of us',
                            'an understanding that costs neither of us anything'], `${bucket}:truce`),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => ({
        act: cold(rel) ? 'refuse' : 'accept',
        register: registerOf(a),
        object: cold(rel) ? null : chooseFrom(['agreed, and I will hold to it', 'that suits me',
                                               'you keep your side and I will keep mine'], `${bucket}:truceYes`),
        because: cold(rel) ? chooseFrom(['I remember the last time', 'your word is not currency out here'],
                                        `${bucket}:truceNo`) : null
      })
    ],
    filesFrom: { type: 'offered-truce', weight: 1.1 },
    filesTo:   { type: 'was-offered-truce', weight: 1.1 },
    chains: ['smallTalk', 'grudge']
  },

  grudge: {
    channel: 'local', weight: 7, cooldown: 500, priority: 4,
    when: (a, b, ctx) => cold(ctx.rel) && has(ctx, 'recallBetween') &&
      (ctx.recallBetween(a, b, 'traded-words') || ctx.recallBetween(a, b, 'was-disputed') ||
       ctx.recallBetween(a, b, 'refused-help')),
    mood: 'gruff',
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'complain',
        register: 'gruff',
        object: chooseFrom(['I have not forgotten the last time we shared a band',
                            'you and I have history and none of it is good',
                            'my log has your registry on it more than once'], `${bucket}:grudge`),
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket }) => ({
        act: chooseFrom(['refuse', 'warn'], `${bucket}:grudgeAct`),
        register: registerOf(a),
        object: chooseFrom(['carry it if you like, it weighs nothing to me',
                            'file it with somebody who cares',
                            'you keep bringing it up and it stays true'], `${bucket}:grudgeBack`)
      })
    ],
    filesFrom: { type: 'traded-words', weight: 0.7 },
    filesTo:   { type: 'traded-words', weight: 0.7 },
    chains: ['apology', 'standoff']
  },

  contactCall: {
    channel: 'local', weight: 15, cooldown: 100, priority: 8,
    when: (a, b, ctx) => same(a, b) && has(ctx, 'threatNear') && ctx.threatNear(a),
    urgent: true,
    say: [
      ({ a, b, rel, bucket, ctx }) => {
        const n = has(ctx, 'threatCount') ? ctx.threatCount(a) : 1;
        return [
          {
            act: 'warn',
            register: registerOf(a),
            object: threatFact(n, bucket),
            where: headingFact(has(ctx, 'threatBearing') ? ctx.threatBearing(a) : null, bucket),
            urgent: true,
            vocative: nameFor(b, rel)
          },
          {
            act: 'order',
            register: registerOf(a),
            verb: chooseFrom(['watch', 'hold', 'stand by'], `${bucket}:contactOrder`),
            object: chooseFrom(['your board', 'that side of the lane', 'the corridor'],
                               `${bucket}:contactWhat`),
            urgent: true
          }
        ];
      },
      ({ a, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        object: chooseFrom(['I have them', 'painted', 'on my board too'], `${bucket}:contactAck`),
        urgent: true
      }),
      ({ a, bucket }) => ({
        act: 'report',
        register: registerOf(a),
        object: chooseFrom(['they have not turned toward us yet', 'holding their track',
                            'closing, slow'], `${bucket}:contactUpdate`),
        urgent: true
      })
    ],
    filesFrom: { type: 'warned-about-threat', weight: 0.9 },
    filesTo:   { type: 'got-warning', weight: 1.0 },
    chains: ['askHelp', 'positionReport']
  },

  allClear: {
    channel: 'local', weight: 9, cooldown: 160, priority: 3,
    when: (a, b, ctx) => same(a, b) && has(ctx, 'recallBetween') && ctx.recallBetween(a, b, 'got-warning') &&
      !(has(ctx, 'threatNear') && ctx.threatNear(a)),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'report',
        register: registerOf(a),
        negated: true,
        object: chooseFrom(['nothing on the sweep now', 'they are off the board',
                            'whatever that was, it has gone'], `${bucket}:clear`),
        where: whereFact(a, bucket),
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        object: chooseFrom(['that is a relief', 'back to work then', 'logged'], `${bucket}:clearAck`)
      })
    ],
    filesFrom: { type: 'spoke-with', weight: 0.3 },
    filesTo:   { type: 'spoke-with', weight: 0.3 }
  },

  covenant: {
    channel: 'local', weight: 6, cooldown: 700, priority: 4,
    when: (a, b) => same(a, b) && armed(a) && armed(b) && healthy(a) && !engaged(a),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'offer',
        register: registerOf(a),
        object: chooseFrom(['a standing arrangement — you call, I come',
                            'my band open to you on this leg',
                            'first response on anything you raise'], `${bucket}:covenant`),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => ({
        act: warm(rel) || familiar(rel) ? 'accept' : 'ack',
        register: registerOf(a),
        object: chooseFrom(['and the same from me', 'that is worth more than the rate we get paid',
                            'I will hold you to it'], `${bucket}:covenantYes`)
      })
    ],
    offers: 'pact',
    filesFrom: { type: 'made-pact', weight: 1.7 },
    filesTo:   { type: 'made-pact', weight: 1.7 },
    chains: ['askHelp', 'smallTalk']
  }
});

Object.assign(TOPICS, {

  warnAboutPlayer: {
    channel: 'local', weight: 18, cooldown: 150, priority: 6,
    when: (a, b, ctx) => same(a, b) && has(ctx, 'warinessOf') && ctx.warinessOf(a) >= ctx.gossipThreshold,
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'warn',
        register: registerOf(a),
        object: chooseFrom(
          ['that independent hull has been busy',
           'there is an unflagged hull working this side',
           'somebody out here does not log their kills',
           'the independent has form'],
          `${bucket}:warn`),
        where: whereFact(a, bucket),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        object: known(rel) ? chooseFrom(['I have heard the same', 'that name has come up before'],
                                        `${bucket}:warnAck`) : null,
        verb: 'keep'
      })
    ],
    filesFrom: { type: 'warned-about-player', weight: 0.6 },
    filesTo:   { type: 'saw-kill-ours', subject: 'player', weight: 0.7 },
    hearsay: true,
    chains: ['playerSighting', 'shareRumour']
  },

  playerSighting: {
    channel: 'local', weight: 12, cooldown: 120, priority: 6,
    when: (a, b, ctx) => same(a, b) && has(ctx, 'playerNear') && ctx.playerNear(a) &&
      has(ctx, 'warinessOf') && ctx.warinessOf(a) > 0,
    urgent: true,
    say: [
      ({ a, b, rel, bucket, ctx }) => ({
        act: 'report',
        register: registerOf(a),
        object: chooseFrom(['that hull is on my board right now',
                            'the independent just came through',
                            'unflagged contact, close in'], `${bucket}:sighting`),
        where: headingFact(has(ctx, 'playerBearing') ? ctx.playerBearing(a) : null, bucket),
        urgent: true,
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket, ctx }) => {
        const wary = has(ctx, 'warinessOf') ? ctx.warinessOf(a) : 0;
        return {
          act: wary > 1.5 ? 'order' : 'ack',
          register: registerOf(a),
          verb: wary > 1.5 ? chooseFrom(['watch', 'hold', 'stand by'], `${bucket}:sightOrder`) : null,
          object: wary > 1.5 ? null : chooseFrom(['I see them', 'nothing from them yet',
                                                  'they have not squawked'], `${bucket}:sightAck`),
          urgent: true
        };
      }
    ],
    filesFrom: { type: 'saw-player', subject: 'player', weight: 0.5 },
    filesTo:   { type: 'heard-player-near', subject: 'player', weight: 0.4 },
    hearsay: true,
    chains: ['warnAboutPlayer', 'playerPraise']
  },

  playerPraise: {
    channel: 'local', weight: 10, cooldown: 200, priority: 4,
    when: (a, b, ctx) => same(a, b) && has(ctx, 'regardForPlayer') && ctx.regardForPlayer(a) > 0.4,
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'inform',
        register: registerOf(a),
        object: chooseFrom(['that independent turned up when nobody else would',
                            'the unflagged hull pulled one of ours out',
                            'whoever is flying that thing does not leave people'],
                           `${bucket}:praise`),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        object: chooseFrom(['good to hear it about somebody',
                            'I will keep the band open for them',
                            'that buys a lot out here'], `${bucket}:praiseAck`)
      })
    ],
    filesFrom: { type: 'praised-player', subject: 'player', weight: 0.6 },
    filesTo:   { type: 'heard-good-of-player', subject: 'player', weight: 0.7 },
    hearsay: true,
    chains: ['shareRumour']
  },

  playerHail: {
    channel: 'local', weight: 9, cooldown: 240, priority: 5,
    when: (a, b, ctx) => has(ctx, 'playerNear') && ctx.playerNear(a) &&
      has(ctx, 'regardForPlayer') && ctx.regardForPlayer(a) > 0.2 && civilian(a),
    say: [
      ({ a, bucket }) => ({
        act: 'greet',
        register: registerOf(a),
        target: 'the independent hull',
        speaker: a.name
      }),
      ({ a, bucket }) => ({
        act: 'offer',
        register: registerOf(a),
        object: chooseFrom(['a berth at my ring if you need one',
                            'the survey I pulled this shift',
                            'whatever is in my hold, at cost'], `${bucket}:playerOffer`)
      })
    ],
    filesFrom: { type: 'hailed-player', subject: 'player', weight: 0.5 },
    filesTo:   { type: 'spoke-with', weight: 0.3 }
  }
});

Object.assign(TOPICS, {

  dockRequest: {
    channel: 'station', weight: 13, cooldown: 120, priority: 5,
    when: (a, b) => role(b, 'fort') || b.isStation === true,
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'request',
        register: registerOf(a),
        object: chooseFrom(['a berth', 'clearance to come alongside', 'a pad on the inner ring'],
                           `${bucket}:dockAsk`),
        because: laden(a) ? 'I am carrying' : (hurt(a) ? 'I have damage to see to' : null),
        vocative: nameFor(b, rel)
      }),
      ({ a, b, rel, bucket, ctx }) => {
        const free = has(ctx, 'berthsFree') ? ctx.berthsFree(a) : 2;
        return free > 0
          ? {
              act: 'accept',
              register: 'formal',
              object: chooseFrom([`berth ${numberWord(1 + Math.floor(free))} is yours`,
                                  'come in on the marked approach',
                                  'cleared to the inner ring'], `${bucket}:dockYes`)
            }
          : {
              act: 'refuse',
              register: 'formal',
              because: chooseFrom(['every pad is committed this cycle',
                                   'we are stacked out to the far ring'], `${bucket}:dockNo`),
              object: chooseFrom(['hold at the marker', 'take a station orbit and wait'],
                                 `${bucket}:dockHold`)
            };
      },
      ({ a, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        object: chooseFrom(['coming in on the approach', 'holding at the marker', 'understood'],
                           `${bucket}:dockAck`)
      })
    ],
    filesFrom: { type: 'requested-berth', weight: 0.4 },
    filesTo:   { type: 'handled-traffic', weight: 0.3 },
    chains: ['dockGossip', 'priceHaggle']
  },

  dockGossip: {
    channel: 'station', weight: 8, cooldown: 400, priority: 1,
    when: (a, b) => docked(a) && docked(b) && !engaged(a),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'inform',
        register: registerOf(a),
        object: chooseFrom(['the yard has been quoting three days for a weld',
                            'they have moved the fuel line to the outer ring again',
                            'there is a queue on the assay office you would not believe',
                            'somebody parked a bulk hull across two pads and went to sleep'],
                           `${bucket}:dockGossip`),
        vocative: warm(rel) ? nameFor(b, rel) : null
      }),
      ({ a, bucket }) => ({
        act: 'complain',
        register: registerOf(a),
        object: chooseFrom(['and they wonder why nobody wants to berth here',
                            'that is this ring all over',
                            'I have been waiting since the shift turned'], `${bucket}:dockGripe`)
      })
    ],
    filesFrom: { type: 'spoke-with', weight: 0.3 },
    filesTo:   { type: 'spoke-with', weight: 0.3 },
    chains: ['shareRumour', 'smallTalk']
  },

  hazardWarning: {
    channel: 'trade', weight: 12, cooldown: 200, priority: 7,
    when: (a, b, ctx) => has(ctx, 'hazardNear') && ctx.hazardNear(a),
    urgent: true,
    say: [
      ({ a, b, rel, bucket, ctx }) => ({
        act: 'warn',
        register: registerOf(a),
        object: chooseFrom(['the flux has come up hard this side',
                            'there is debris across the whole width of the lane',
                            'the belt weather is turning',
                            'something out here is chewing through shielding'],
                           `${bucket}:hazard`),
        where: whereFact(a, bucket),
        urgent: true,
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket }) => ({
        act: 'request',
        register: registerOf(a),
        object: chooseFrom(['a way around it', 'the width of it', 'word on the far leg'],
                           `${bucket}:hazardAsk`),
        urgent: true
      }),
      ({ a, bucket }) => ({
        act: 'inform',
        register: registerOf(a),
        object: chooseFrom(['route under it and you will lose an hour, not a hull',
                            'the north edge was clean when I came through',
                            'I would sit it out at the ring'], `${bucket}:hazardAdvice`)
      })
    ],
    filesFrom: { type: 'gave-tip', weight: 1.0 },
    filesTo:   { type: 'got-tip', weight: 1.1 },
    chains: ['tipFollowUp', 'laneReport']
  },

  routeAdvice: {
    channel: 'trade', weight: 10, cooldown: 260, priority: 3,
    when: (a, b) => transiting(b) && anyRole(a, 'haul', 'trade', 'patrol') && !engaged(a),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'ask',
        register: registerOf(a),
        verb: 'run',
        agr: { person: 2, number: 'sg' },
        object: chooseFrom(['the inner leg or the long way', 'through the belt or around it'],
                           `${bucket}:routeAsk`),
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket }) => ({
        act: 'inform',
        register: registerOf(a),
        object: chooseFrom(['the inner leg, and I would not do it loaded',
                            'the long way, every time this cycle',
                            'whichever one has a patrol on it'], `${bucket}:routeAnswer`),
        because: chooseFrom(['the corridor has been busy', 'the beacon net is down past the second marker',
                             'that is where the traffic is'], `${bucket}:routeWhy`)
      }),
      ({ a, bucket }) => ({
        act: 'thank',
        register: registerOf(a),
        object: chooseFrom(['that saves me a leg', 'I will route it that way',
                            'good to know before I commit the burn'], `${bucket}:routeThanks`)
      })
    ],
    filesFrom: { type: 'gave-tip', weight: 0.7 },
    filesTo:   { type: 'got-tip', weight: 0.8 },
    chains: ['tipFollowUp']
  },

  beaconFault: {
    channel: 'station', weight: 7, cooldown: 500, priority: 4,
    when: (a, b, ctx) => has(ctx, 'beaconFault') && ctx.beaconFault(a) && anyRole(b, 'build', 'patrol', 'fort'),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'report',
        register: registerOf(a),
        subject: 'the marker',
        quality: chooseFrom(['dark', 'squawking nothing', 'off the net'], `${bucket}:beaconState`),
        where: whereFact(a, bucket),
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket }) => ({
        act: 'accept',
        register: registerOf(a),
        object: chooseFrom(['I will put a crew on it next pass', 'logged for the maintenance run',
                            'that is the third this cycle, but it is on the list'], `${bucket}:beaconAck`)
      })
    ],
    filesFrom: { type: 'reported-fault', weight: 0.6 },
    filesTo:   { type: 'took-report', weight: 0.6 },
    chains: ['repairOffer']
  },

  salvageClaim: {
    channel: 'trade', weight: 9, cooldown: 300, priority: 4,
    when: (a, b) => anyRole(a, 'salvage', 'scrap') && !same(a, b) && near(a, b, 600),
    mood: 'gruff',
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'inform',
        register: 'gruff',
        object: chooseFrom(['that wreck is worked and it is worked by me',
                            'I have a line on the hull and a beacon on it',
                            'first hands on it were mine'], `${bucket}:salvage`),
        where: whereFact(a, bucket),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => ({
        act: warm(rel) ? 'accept' : 'negotiate',
        register: registerOf(a),
        object: warm(rel)
          ? chooseFrom(['it is yours, I have my own', 'no argument from me'], `${bucket}:salvageYes`)
          : chooseFrom(['half of it', 'the drive section and nothing else'], `${bucket}:salvageSplit`),
        price: warm(rel) ? null : priceFact(null, bucket)
      })
    ],
    filesFrom: { type: 'disputed-claim', weight: 0.8 },
    filesTo:   { type: 'was-disputed', weight: 0.8 },
    chains: ['grudge', 'priceHaggle']
  },

  shareRumour: {
    channel: 'local', weight: 8, cooldown: 380, priority: 2,
    when: (a, b, ctx) => same(a, b) && known(ctx.rel) && has(ctx, 'thirdParty') && !!ctx.thirdParty(a, b),
    say: [
      ({ a, b, rel, bucket, ctx }) => {
        const c = ctx.thirdParty(a, b);
        const good = has(ctx, 'regardBetween') ? ctx.regardBetween(a, c) > 0 : true;
        return {
          act: good ? 'inform' : 'warn',
          register: registerOf(a),
          object: good
            ? `${c.name} ${chooseFrom(['has been straight with me every time',
                                       'came through when it counted',
                                       'is worth talking to if you need a hand'], `${bucket}:rumourGood`)}`
            : `${c.name} ${chooseFrom(['is light on the truth',
                                       'left somebody on a distress band last cycle',
                                       'does not settle what they owe'], `${bucket}:rumourBad`)}`,
          vocative: nameFor(b, rel)
        };
      },
      ({ a, rel, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        object: chooseFrom(['I will keep that in mind', 'that is not the first time I have heard it',
                            'my read as well', 'noted, for what a rumour is worth'],
                           `${bucket}:rumourAck`)
      })
    ],
    filesFrom: { type: 'passed-rumour', weight: 0.5 },
    filesTo:   { type: 'heard-rumour', weight: 0.6, aboutThirdParty: true },
    hearsay: true,
    chains: ['recommend', 'warnAboutPlayer']
  },

  recommend: {
    channel: 'trade', weight: 7, cooldown: 500, priority: 3,
    when: (a, b, ctx) => known(ctx.rel) && has(ctx, 'thirdParty') && !!ctx.thirdParty(a, b) &&
      has(ctx, 'recallBetween') && ctx.recallBetween(a, b, 'work-done-for-me'),
    say: [
      ({ a, b, rel, bucket, ctx }) => {
        const c = ctx.thirdParty(a, b);
        return {
          act: 'offer',
          register: registerOf(a),
          object: `${c.name}, if you need the work doing`,
          because: chooseFrom(['they have never missed a delivery on me',
                               'I have used them three cycles running',
                               'their rate is fair and their word is good'], `${bucket}:recWhy`),
          vocative: nameFor(b, rel)
        };
      },
      ({ a, bucket }) => ({
        act: 'thank',
        register: registerOf(a),
        object: chooseFrom(['I will raise them', 'that is worth having',
                            'a name from you beats a name from the board'], `${bucket}:recAck`)
      })
    ],
    filesFrom: { type: 'recommended', weight: 0.8 },
    filesTo:   { type: 'got-recommendation', weight: 0.9, aboutThirdParty: true },
    hearsay: true,
    chains: ['haulOffer', 'priceHaggle']
  },

  shiftChange: {
    channel: 'local', weight: 6, cooldown: 700, priority: 1,
    when: (a, b, ctx) => same(a, b) && known(ctx.rel) && (idle(a) || docked(a)),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'inform',
        register: registerOf(a),
        object: chooseFrom(['I am off the clock at the next marker',
                            'my relief is inbound',
                            'this is my last leg of the cycle'], `${bucket}:shiftEnd`),
        when: whenFact(900, bucket),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => ({
        act: warm(rel) ? 'farewell' : 'ack',
        register: registerOf(a),
        object: warm(rel) ? null : chooseFrom(['logged', 'I will pick up the band', 'understood'],
                                              `${bucket}:shiftAck`),
        speaker: a.name
      })
    ],
    filesFrom: { type: 'spoke-with', weight: 0.3 },
    filesTo:   { type: 'knows-schedule', weight: 0.5 }
  },

  boast: {
    channel: 'local', weight: 6, cooldown: 450, priority: 1,
    when: (a, b, ctx) => known(ctx.rel) && (laden(a) || (a.oreGrade || 0) > 0.75) && !hurt(a),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'boast',
        register: registerOf(a),
        object: chooseFrom([`${holdFact(a, bucket)} in one shift`,
                            'the fattest seam I have cut this cycle',
                            'a full can and half the shift still to run'], `${bucket}:boast`),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => ({
        act: cold(rel) ? 'complain' : 'ack',
        register: registerOf(a),
        object: cold(rel)
          ? chooseFrom(['some of us are working the rock nobody else wanted',
                        'good for you'], `${bucket}:boastCold`)
          : chooseFrom(['that is a shift worth logging', 'nicely done',
                        'you will be buying at the ring, then'], `${bucket}:boastWarm`)
      })
    ],
    filesFrom: { type: 'spoke-with', weight: 0.3 },
    filesTo:   { type: 'knows-yield', weight: 0.4 },
    chains: ['haulOffer', 'shareRumour']
  }
});

Object.assign(TOPICS, {

  skimAccusation: {
    channel: 'trade', weight: 8, cooldown: 700, priority: 6,
    when: (a, b, ctx) => has(ctx, 'recallBetween') && ctx.recallBetween(a, b, 'work-done-for-me') &&
      anyRole(b, 'haul', 'salvage', 'trade'),
    mood: 'gruff',
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'accuse', move: 'accusation',
        object: chooseFrom(['you signed for a full can and set down four bins light',
                            'the manifest and the mass do not agree',
                            'you came off my pad heavier than you went on'], `${bucket}:skim`),
        evidence: chooseFrom(['I have the load sheet in front of me',
                              'the ring weighed you both ways'], `${bucket}:skimEvidence`),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket, ctx }) => {
        const guilty = has(ctx, 'wasHonest') ? !ctx.wasHonest(a) : cold(rel);
        return guilty
          ? { act: 'admit', move: 'statement',
              because: chooseFrom(['I was short on the leg and I took the difference in ore',
                                   'the yard bill came due and nobody else was paying it'],
                                  `${bucket}:skimAdmit`) }
          : { act: 'deny', move: 'denial',
              where: chooseFrom(['tied up at the outer ring the whole shift',
                                 'two hundred out with my bays open'], `${bucket}:skimAlibi`),
              when: 'when your load closed out' };
      },
      ({ a, rel, bucket }) => ({
        act: cold(rel) ? 'warn' : 'negotiate',
        register: registerOf(a),
        object: cold(rel)
          ? chooseFrom(['this goes to the ring with your registry on it',
                        'nobody on this band lifts for you again'], `${bucket}:skimEscalate`)
          : chooseFrom(['make the count good on the next run and it never happened',
                        'I will take it off the rate and we say no more'], `${bucket}:skimSettle`)
      }),
      ({ a, rel, bucket }) => ({
        act: warm(rel) ? 'accept' : 'refuse',
        register: registerOf(a),
        object: warm(rel) ? chooseFrom(['that is fair', 'done, and I will make it right'],
                                       `${bucket}:skimClose`) : null,
        because: warm(rel) ? null : chooseFrom(['I have nothing to make good on',
                                                'file it and see who believes you'], `${bucket}:skimRefuse`)
      })
    ],
    filesFrom: { type: 'accused', weight: 1.0 },
    filesTo:   { type: 'was-accused', weight: -1.4 },
    chains: ['arbitration', 'grudge', 'blacklist', 'secondChance']
  },

  falseTipAccusation: {
    channel: 'trade', weight: 7, cooldown: 600, priority: 5,
    when: (a, b, ctx) => has(ctx, 'recallBetween') && ctx.recallBetween(a, b, 'got-tip') &&
      has(ctx, 'tipWasGood') && !ctx.tipWasGood(b, a),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'accuse', move: 'accusation',
        object: chooseFrom(['you sent me to a face that was stripped a cycle ago',
                            'you called that seam fat and it was bones',
                            'you knew that lane was closed when you routed me down it'],
                           `${bucket}:falseTip`),
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket, ctx }) => (has(ctx, 'wasHonest') && ctx.wasHonest(a)
        ? { act: 'deny', move: 'denial',
            object: chooseFrom(['it was reading clean when I left it',
                                'I passed you what my own board said'], `${bucket}:tipDeny`) }
        : { act: 'admit', move: 'statement',
            because: chooseFrom(['I wanted you off the north face and I got what I wanted',
                                 'the survey was old and I did not check it'], `${bucket}:tipAdmit`) }),
      ({ a, rel, bucket }) => ({
        act: cold(rel) ? 'warn' : 'apologise',
        register: registerOf(a),
        object: cold(rel)
          ? chooseFrom(['your name goes round this band tonight',
                        'I take nothing from you again'], `${bucket}:tipEscalate`)
          : chooseFrom(['the next one is free and it will be good',
                        'I will make the burn back to you'], `${bucket}:tipMakeGood`)
      })
    ],
    filesFrom: { type: 'accused', weight: 0.9 },
    filesTo:   { type: 'was-accused', weight: -1.2 },
    chains: ['blacklist', 'grudge', 'secondChance']
  },

  debtChase: {
    channel: 'trade', weight: 9, cooldown: 500, priority: 5,
    when: (a, b, ctx) => has(ctx, 'recallBetween') &&
      (ctx.recallBetween(a, b, 'owed-favour') || ctx.recallBetween(a, b, 'completed-work')),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'accuse', move: 'accusation',
        object: chooseFrom(['you have owed me since the second marker run',
                            'that account has been open three cycles',
                            'you keep flying past my ring with my money in your hold'],
                           `${bucket}:debt`),
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket }) => (lowFuel(a) || hurt(a)
        ? { act: 'admit', move: 'statement',
            object: chooseFrom(['I have it and I cannot pay it this cycle',
                                'the yard took everything I had'], `${bucket}:debtAdmit`) }
        : { act: 'deny', move: 'denial',
            counter: chooseFrom(['still has not paid for the tow off Cinder Reach',
                                 'took a full bin off me and called it breakage'],
                                `${bucket}:debtCounter`) }),
      ({ a, bucket }) => ({
        act: 'negotiate',
        object: chooseFrom(['half now and the rest at the ring', 'take it in ore at the posted rate',
                            'work it off on my next leg'], `${bucket}:debtTerms`),
        price: priceFact(null, bucket)
      }),
      ({ a, rel, bucket }) => ({
        act: warm(rel) || !cold(rel) ? 'accept' : 'refuse',
        object: chooseFrom(['that clears it', 'agreed, and it is written off',
                            'we are square from here'], `${bucket}:debtClose`),
        because: cold(rel) ? 'I do not take payment in promises' : null
      })
    ],
    filesFrom: { type: 'called-favour', weight: 0.9 },
    filesTo:   { type: 'favour-called', weight: 0.9 },
    chains: ['arbitration', 'grudge', 'deliveryConfirm']
  },

  rumourConfront: {
    channel: 'local', weight: 7, cooldown: 640, priority: 5,
    when: (a, b, ctx) => has(ctx, 'recallBetween') && ctx.recallBetween(a, b, 'heard-rumour'),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'accuse', move: 'accusation',
        object: chooseFrom(['you have been saying things about me on the open band',
                            'your name is on every version of that story I have heard',
                            'you told half this ring I left somebody on a distress call'],
                           `${bucket}:rumourAcc`),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => (cold(rel)
        ? { act: 'admit', move: 'statement',
            object: chooseFrom(['I said it and I would say it again',
                                'I told people what I saw'], `${bucket}:rumourOwn`) }
        : { act: 'deny', move: 'denial',
            object: chooseFrom(['I repeated what came over the band, not what I made up',
                                'I have never put your name to anything'], `${bucket}:rumourDeny`) }),
      ({ a, bucket }) => ({
        act: 'request',
        object: chooseFrom(['the truth of it, on the same band you spread the rest on',
                            'a correction, and we can both let it go'], `${bucket}:rumourAsk`)
      }),
      ({ a, rel, bucket }) => ({
        act: warm(rel) ? 'accept' : 'refuse',
        object: warm(rel) ? chooseFrom(['I will put it right tonight', 'that is fair, and I will say so'],
                                       `${bucket}:rumourFix`) : null,
        because: warm(rel) ? null : 'I stand by what I said'
      })
    ],
    filesFrom: { type: 'accused', weight: 0.8 },
    filesTo:   { type: 'was-accused', weight: -0.9 },
    chains: ['apology', 'grudge', 'secondChance']
  },

  blameForLoss: {
    channel: 'distress', weight: 7, cooldown: 900, priority: 7,
    when: (a, b, ctx) => has(ctx, 'recallBetween') && ctx.recallBetween(a, b, 'refused-help'),
    mood: 'gruff',
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'accuse', move: 'accusation',
        object: chooseFrom(['you were the closest hull and you kept burning',
                            'you heard that call as clearly as I did',
                            'you had the legs to reach them and you did not turn'],
                           `${bucket}:blame`),
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket }) => ({
        act: 'deny', move: 'denial',
        where: whereFact(a, bucket),
        object: chooseFrom(['I was not going to make it and neither were you',
                            'I had my own people to think about'], `${bucket}:blameDeny`)
      }),
      ({ a, bucket }) => ({
        act: 'complain', move: 'comment',
        register: registerOf(a),
        act2: null,
        object: chooseFrom(['that is going to sit with both of us',
                            'somebody is short a hull tonight either way',
                            'I would rather have burned the fuel and been wrong'],
                           `${bucket}:blameClose`)
      })
    ],
    filesFrom: { type: 'accused', weight: 1.1 },
    filesTo:   { type: 'was-accused', weight: -1.3 },
    chains: ['memorial', 'grudge', 'covenant']
  },

  arbitration: {
    channel: 'station', weight: 6, cooldown: 900, priority: 6,
    when: (a, b, ctx) => (role(a, 'fort') || a.isStation || role(a, 'patrol')) &&
      has(ctx, 'recallBetween') && ctx.recallBetween(b, a, 'was-accused'),
    mood: 'formal',
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'order', register: 'formal',
        verb: 'stand by',
        object: chooseFrom(['for a hearing on the record', 'while the ring reads both logs'],
                           `${bucket}:arbOpen`),
        target: nameFor(b, rel)
      }),
      ({ a, bucket }) => ({
        act: 'inform',
        object: chooseFrom(['my log is open and it says what I said',
                            'I will put my board up next to theirs',
                            'I have nothing to hide from a hearing'], `${bucket}:arbCase`),
        frames: ['inform-verbless', 'inform-contrast']
      }),
      ({ a, bucket, ctx }) => ({
        act: 'inform', register: 'formal',
        object: chooseFrom(['the ring finds for the complainant and the rate is adjusted',
                            'both logs agree and no fault is recorded',
                            'this is entered as a caution, nothing further'], `${bucket}:arbRuling`),
        frames: ['inform-verbless']
      }),
      ({ a, bucket }) => ({
        act: 'ack',
        object: chooseFrom(['the ruling stands with me', 'I will hold to that',
                            'noted, and I will not raise it again'], `${bucket}:arbAck`)
      })
    ],
    filesFrom: { type: 'took-report', weight: 0.7 },
    filesTo:   { type: 'was-arbitrated', weight: 0.4 },
    chains: ['secondChance', 'blacklist']
  },

  secondChance: {
    channel: 'local', weight: 6, cooldown: 1200, priority: 4,
    when: (a, b, ctx) => cold(ctx.rel) && has(ctx, 'recallBetween') &&
      (ctx.recallBetween(a, b, 'was-accused') || ctx.recallBetween(a, b, 'was-disputed')),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'offer',
        object: chooseFrom(['one run, on my rate, and you judge me on that',
                            'a clean slate that costs you nothing to try',
                            'the next lift for free, and no marker either way'],
                           `${bucket}:second`),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => ({
        act: (rel && (rel.regard || 0) > -0.6) ? 'accept' : 'refuse',
        object: chooseFrom(['one run', 'I will give it that much', 'we try it once'],
                           `${bucket}:secondYes`),
        because: chooseFrom(['I have a long memory and it is still full',
                             'twice is a habit, not a mistake'], `${bucket}:secondNo`)
      }),
      ({ a, bucket }) => ({
        act: 'offer', move: 'commitment',
        register: registerOf(a),
        object: chooseFrom(['I will be alongside when I said and not later',
                            'you will have no cause to raise it again'], `${bucket}:secondPromise`),
        frames: ['offer-direct', 'ack-commit', 'accept-plain']
      })
    ],
    filesFrom: { type: 'apologised', weight: 1.0 },
    filesTo:   { type: 'was-apologised-to', weight: 1.2 },
    chains: ['haulOffer', 'deliveryConfirm', 'smallTalk']
  },

  blacklist: {
    channel: 'trade', weight: 6, cooldown: 800, priority: 4,
    when: (a, b, ctx) => same(a, b) && has(ctx, 'thirdParty') && !!ctx.thirdParty(a, b) &&
      has(ctx, 'regardBetween') && ctx.regardBetween(a, ctx.thirdParty(a, b)) < -0.2,
    say: [
      ({ a, b, rel, bucket, ctx }) => {
        const c = ctx.thirdParty(a, b);
        return {
          act: 'warn',
          object: `${c.name} ${chooseFrom(['does not get another can off me',
                                           'signs for more than they set down',
                                           'is off my board for good'], `${bucket}:blOpen`)}`,
          vocative: nameFor(b, rel)
        };
      },
      ({ a, bucket }) => ({
        act: 'ask', q: 'polar',
        verb: 'have',
        subject: 'you',
        agr: { person: 2, number: 'sg' },
        object: 'proof of that',
        register: registerOf(a)
      }),
      ({ a, bucket }) => ({
        act: 'inform',
        object: chooseFrom(['the load sheets, and the ring has copies',
                            'two runs, both light, both signed',
                            'nothing on paper, but I know what I loaded'], `${bucket}:blProof`),
        frames: ['inform-verbless', 'inform-contrast']
      }),
      ({ a, bucket }) => ({
        act: 'ack',
        object: chooseFrom(['I will watch my counts with them',
                            'that is going in my own log',
                            'I will make my own mind up, but noted'], `${bucket}:blAck`)
      })
    ],
    filesFrom: { type: 'passed-rumour', weight: 0.6 },
    filesTo:   { type: 'heard-rumour', weight: -0.8, aboutThirdParty: true },
    hearsay: true,
    chains: ['recommend', 'shareRumour']
  },

  mentorship: {
    channel: 'local', weight: 7, cooldown: 700, priority: 2,
    when: (a, b, ctx) => same(a, b) && oldFriends(ctx.rel) === false && known(ctx.rel) &&
      anyRole(a, 'mine', 'haul', 'patrol') && anyRole(b, 'mine', 'haul') && healthy(a),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'inform',
        object: chooseFrom(['you have the look of a first season out here',
                            'you fly like the yard checked you out last cycle',
                            'I have not seen your registry on this band before'],
                           `${bucket}:mentorOpen`),
        frames: ['inform-verbless', 'inform-contrast'],
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket }) => ({
        act: 'answer',
        object: chooseFrom(['second cycle', 'long enough to know I do not know much',
                            'my first season out this far'], `${bucket}:mentorAns`)
      }),
      ({ a, bucket }) => ({
        act: 'tip',
        object: chooseFrom(['never take the inner leg loaded, whatever the chart says',
                            'log your burns even when nobody asks for them',
                            'the ring will hold a berth for you if you raise them early',
                            'anybody who will not give you their name will not give you a fair count'],
                           `${bucket}:mentorTip`),
        frames: ['inform-verbless', 'inform-contrast', 'warn-advice']
      }),
      ({ a, bucket }) => ({
        act: 'thank',
        object: chooseFrom(['I will hold on to that', 'nobody told me that at the yard',
                            'that is worth more than the induction packet'], `${bucket}:mentorThanks`)
      })
    ],
    filesFrom: { type: 'gave-tip', weight: 0.9 },
    filesTo:   { type: 'got-tip', weight: 1.1 },
    chains: ['smallTalk', 'covenant', 'recommend']
  },

  memorial: {
    channel: 'local', weight: 5, cooldown: 1400, priority: 3,
    when: (a, b, ctx) => same(a, b) && known(ctx.rel) && has(ctx, 'lostHull') && !!ctx.lostHull(),
    mood: 'plain',
    say: [
      ({ a, b, rel, bucket, ctx }) => ({
        act: 'inform',
        object: `${ctx.lostHull()} ${chooseFrom(['is off the board for good',
                                                 'did not come back through the marker',
                                                 'went dark somewhere past the second leg'],
                                                `${bucket}:memOpen`)}`,
        vocative: nameFor(b, rel),
        frames: ['inform-verbless', 'inform-contrast']
      }),
      ({ a, bucket }) => ({
        act: 'complain', move: 'comment',
        object: chooseFrom(['I bought them a drink at the ring last cycle',
                            'they walked me in when I was new out here',
                            'that hull was older than both of us'], `${bucket}:memRemember`),
        frames: ['inform-verbless', 'complain-plain']
      }),
      ({ a, bucket }) => ({
        act: 'complain', move: 'comment',
        object: chooseFrom(['we keep the band open on their frequency for a shift, then',
                            'somebody should tell the yard before the paperwork does',
                            'burn safe out there'], `${bucket}:memClose`),
        frames: ['inform-verbless', 'warn-advice']
      })
    ],
    filesFrom: { type: 'spoke-with', weight: 0.5 },
    filesTo:   { type: 'spoke-with', weight: 0.5 },
    chains: ['covenant', 'smallTalk']
  },

  retirement: {
    channel: 'local', weight: 5, cooldown: 1600, priority: 2,
    when: (a, b, ctx) => same(a, b) && oldFriends(ctx.rel) && !hurt(a),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'inform',
        object: chooseFrom(['this is my last season on the belt',
                            'I have a berth waiting dirtside and I am going to take it',
                            'the yard offered to buy the hull and I did not say no'],
                           `${bucket}:retire`),
        vocative: nameFor(b, rel),
        frames: ['inform-verbless', 'inform-contrast']
      }),
      ({ a, bucket }) => ({
        act: 'ask', q: 'polar',
        subject: 'you',
        agr: { person: 2, number: 'sg' },
        verb: 'mean',
        object: 'that this time'
      }),
      ({ a, bucket }) => ({
        act: 'answer',
        object: chooseFrom(['I mean it', 'I have said it before and I meant it then too',
                            'ask me again at the end of the cycle'], `${bucket}:retireAns`)
      }),
      ({ a, bucket }) => ({
        act: 'complain', move: 'comment',
        object: chooseFrom(['the belt will be quieter and worse for it',
                            'somebody has to teach the new ones now',
                            'leave me your frequency, at least'], `${bucket}:retireClose`),
        frames: ['inform-verbless', 'complain-plain', 'warn-advice']
      })
    ],
    filesFrom: { type: 'spoke-with', weight: 0.6 },
    filesTo:   { type: 'knows-schedule', weight: 0.7 },
    chains: ['mentorship', 'memorial', 'smallTalk']
  },

  crewPoaching: {
    channel: 'station', weight: 5, cooldown: 1000, priority: 3,
    when: (a, b, ctx) => !same(a, b) && anyRole(a, 'trade', 'build', 'haul') && docked(b),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'offer',
        object: chooseFrom(['a berth on my hull at better than your rate',
                            'work that does not run you eighteen hours a shift',
                            'a share instead of a wage'], `${bucket}:poach`),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => (warm(rel)
        ? { act: 'refuse', move: 'denial',
            because: chooseFrom(['I signed for this cycle and I hold to what I sign',
                                 'I have flown with these people too long'], `${bucket}:poachNo`) }
        : { act: 'ask', q: 'wh-what',
            where: 'on that offer', register: registerOf(a) }),
      ({ a, bucket }) => ({
        act: 'inform',
        object: chooseFrom(['the terms are on my board, come and read them',
                            'no obligation, and no hard feelings if you stay'], `${bucket}:poachTerms`),
        frames: ['inform-verbless', 'inform-contrast']
      })
    ],
    filesFrom: { type: 'offered-work', weight: 0.7 },
    filesTo:   { type: 'offered-work-to-me', weight: 0.7 },
    chains: ['priceHaggle', 'grudge']
  },

  cartel: {
    channel: 'trade', weight: 5, cooldown: 1100, priority: 3,
    when: (a, b, ctx) => role(a, 'trade') && anyRole(b, 'trade', 'mine') && known(ctx.rel) && !cold(ctx.rel),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'offer',
        object: chooseFrom(['both of us holding the same number until the ring blinks',
                            'a floor under the rate that neither of us goes below',
                            'nobody undercutting anybody until the next audit'],
                           `${bucket}:cartel`),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => (warm(rel)
        ? { act: 'accept', object: chooseFrom(['I can hold that number', 'agreed, and I will hold it'],
                                              `${bucket}:cartelYes`) }
        : { act: 'deny', move: 'denial',
            object: chooseFrom(['I am not putting my licence on that',
                                'the ring hangs people for less'], `${bucket}:cartelNo`) }),
      ({ a, bucket }) => ({
        act: 'warn',
        object: chooseFrom(['if you break it first, everybody hears about it',
                            'this stays on this band and nowhere else'], `${bucket}:cartelWarn`),
        frames: ['warn-declarative', 'warn-flat', 'inform-verbless']
      })
    ],
    offers: 'pact',
    filesFrom: { type: 'made-pact', weight: 0.9 },
    filesTo:   { type: 'made-pact', weight: 0.9 },
    chains: ['priceHaggle', 'blacklist', 'grudge']
  },

  beltLore: {
    channel: 'local', weight: 6, cooldown: 900, priority: 1,
    when: (a, b, ctx) => same(a, b) && known(ctx.rel) && idle(a) && !hurt(a),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'inform',
        object: chooseFrom(['there is a hull out past Cinder Reach that still answers a hail',
                            'the old hands will not cut on the third shift of a cycle',
                            'my first captain would not fly a lane without naming it first',
                            'they say the flux out there reads like a voice if you listen long enough'],
                           `${bucket}:lore`),
        vocative: nameFor(b, rel),
        frames: ['inform-verbless', 'inform-contrast']
      }),
      ({ a, rel, bucket }) => ({
        act: 'complain', move: 'comment',
        register: registerOf(a),
        object: chooseFrom(['I have heard that one with three different hull names in it',
                            'believe what you like, I still name the lane',
                            'the belt is old enough to have stories and young enough to make them'],
                           `${bucket}:loreReply`),
        frames: ['inform-verbless', 'complain-plain', 'speculate-doubt']
      }),
      ({ a, bucket }) => ({
        act: 'complain', move: 'comment',
        object: chooseFrom(['ask me again after a long shift and I will believe it too',
                            'it costs nothing to be careful about it'], `${bucket}:loreClose`),
        frames: ['inform-verbless', 'warn-advice']
      })
    ],
    filesFrom: { type: 'spoke-with', weight: 0.4 },
    filesTo:   { type: 'spoke-with', weight: 0.4 },
    chains: ['smallTalk', 'memorial', 'mentorship']
  },

  contractDispute: {
    channel: 'trade', weight: 7, cooldown: 700, priority: 5,
    when: (a, b, ctx) => has(ctx, 'recallBetween') && ctx.recallBetween(a, b, 'offered-work-to-me') &&
      !ctx.recallBetween(a, b, 'work-done-for-me'),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'accuse', move: 'accusation',
        object: chooseFrom(['you took the charter and the load is still sitting on my pad',
                            'you agreed a window and you have run past both ends of it',
                            'you are quoting me a rate we did not agree'], `${bucket}:contract`),
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket }) => ({
        act: 'deny', move: 'denial',
        object: chooseFrom(['the terms said when I could, not when you wanted',
                            'nobody told me the load was rated heavy'], `${bucket}:contractDeny`)
      }),
      ({ a, bucket }) => ({
        act: 'negotiate',
        object: chooseFrom(['lift it this cycle at the old rate and we forget the window',
                            'split the difference and I re-post the charter clean'],
                           `${bucket}:contractTerms`),
        price: priceFact(null, bucket)
      }),
      ({ a, rel, bucket }) => ({
        act: cold(rel) ? 'refuse' : 'accept',
        object: chooseFrom(['I can work with that', 'done, and it is off the board'],
                           `${bucket}:contractClose`),
        because: cold(rel) ? 'take it to the ring, then' : null
      })
    ],
    filesFrom: { type: 'accused', weight: 0.8 },
    filesTo:   { type: 'was-accused', weight: -1.0 },
    chains: ['arbitration', 'deliveryConfirm', 'grudge']
  }
});

Object.assign(TOPICS, {

  rememberWhen: {
    channel: 'local', weight: 6, cooldown: 900, priority: 2,
    when: (a, b, ctx) => familiar(ctx.rel) && has(ctx, 'recallDetail') && !!ctx.recallDetail(a, b),
    say: [
      ({ a, b, rel, bucket, ctx }) => {
        const m = ctx.recallDetail(a, b);
        return {
          act: 'inform', move: 'statement',
          register: registerOf(a),
          object: `${chooseFrom(['I still have', 'my log still carries', 'I never cleared'],
                                `${bucket}:rwHave`)} ${MEMORY_PHRASE[m.type] || 'that business'} ${whenFact(-m.ago, bucket)}`,
          frames: ['inform-verbless', 'inform-contrast'],
          vocative: nameFor(b, rel)
        };
      },
      ({ a, rel, bucket }) => ({
        act: warm(rel) ? 'ack' : 'admit', move: 'statement',
        register: registerOf(a),
        object: warm(rel)
          ? chooseFrom(['so do I, and it reads better than most of what is on there',
                        'I was going to say the same thing',
                        'that one comes back to me now and then'], `${bucket}:rwWarm`)
          : chooseFrom(['I wondered whether you had kept that',
                        'I would rather it had gone off the end of the log',
                        'nothing I can do about it now'], `${bucket}:rwCold`)
      }),
      ({ a, rel, bucket }) => ({
        act: warm(rel) ? 'offer' : 'ask', move: warm(rel) ? 'statement' : 'question',
        register: registerOf(a),
        object: warm(rel)
          ? chooseFrom(['the same again, next time you are short a hull',
                        'a berth beside mine whenever you are through',
                        'first call on anything I hear'], `${bucket}:rwOffer`)
          : chooseFrom(['whether we are past it', 'where that leaves the two of us'],
                       `${bucket}:rwAsk`)
      })
    ],
    filesFrom: { type: 'spoke-with', weight: 0.5 },
    filesTo:   { type: 'spoke-with', weight: 0.5 },
    chains: ['smallTalk', 'covenant', 'apology']
  },

  shortWeight: {
    channel: 'trade', weight: 8, cooldown: 700, priority: 5,
    when: (a, b, ctx) => anyRole(a, 'trade', 'build') && anyRole(b, 'haul', 'mine') &&
      has(ctx, 'recallBetween') && ctx.recallBetween(a, b, 'work-done-for-me'),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'accuse', move: 'accusation',
        register: registerOf(a),
        object: chooseFrom(['that load came in light and we both know by how much',
                            'the manifest says forty bins and the pad counted thirty-six',
                            'you signed for a full can and delivered most of one'],
                           `${bucket}:swAccuse`),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket, ctx, memo }) => {
        memo.guilty = memo.guilty != null ? memo.guilty
          : (cold(rel) || (ctx.rng ? ctx.rng.next() : Math.random()) < 0.35);
        return memo.guilty
          ? { act: 'deny', move: 'denial', register: registerOf(a),
              object: chooseFrom(['I lifted what was in front of me and nothing else',
                                  'that can was sealed when I took it'], `${bucket}:swDenyHard`) }
          : { act: 'deny', move: 'denial', register: registerOf(a),
              object: chooseFrom(['I loaded what the face gave me and the seals held the whole leg',
                                  'weigh it against my log — the numbers are the same at both ends'],
                                 `${bucket}:swDenySoft`) };
      },
      ({ a, bucket }) => ({
        act: 'inform', move: 'statement',
        register: registerOf(a),
        object: chooseFrom(['the pad has a mass reading and it does not match yours',
                            'I have the seal record and one of them was cut',
                            'the assay is four bins short and the assay does not lie'],
                           `${bucket}:swEvidence`),
        frames: ['inform-verbless', 'inform-contrast', 'inform-because']
      }),
      ({ a, bucket, memo }) => (memo.guilty
        ? { act: 'admit', move: 'statement', register: registerOf(a),
            object: chooseFrom(['four bins went over the side on the second burn and I did not log it',
                                'I took a hit in transit and made the number up rather than the report'],
                               `${bucket}:swAdmit`) }
        : { act: 'refuse', move: 'denial', register: registerOf(a),
            because: chooseFrom(['your pad has weighed light since the refit',
                                 'I will bring my own scale and we can do this properly'],
                                `${bucket}:swStand`) }),
      ({ a, bucket, memo }) => ({
        act: memo.guilty ? 'accept' : 'apologise', move: 'commitment',
        register: registerOf(a),
        object: memo.guilty
          ? chooseFrom(['take it off my next rate and we are done',
                        'I will make the four bins good on the return leg'], `${bucket}:swSettle`)
          : chooseFrom(['I will have the pad recalibrated before I invoice anybody else',
                        'that one is on my scale, not on your hull'], `${bucket}:swSorry`)
      })
    ],
    filesFrom: { type: 'disputed-claim', weight: 1.2 },
    filesTo:   { type: 'was-disputed', weight: 1.2 },
    chains: ['arbitration', 'apology', 'blacklist', 'grudge']
  },

  bandDiscipline: {
    channel: 'distress', weight: 7, cooldown: 800, priority: 6,
    when: (a, b, ctx) => (role(a, 'patrol') || role(a, 'fort') || a.isStation) &&
      !armed(b) && known(ctx.rel),
    mood: 'formal',
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'accuse', move: 'accusation',
        register: 'formal',
        object: chooseFrom(['that traffic belongs on local and you put it on the distress band',
                            'you have been talking across a channel somebody may need',
                            'this band is for hulls in trouble and you are not one'],
                           `${bucket}:bdAccuse`),
        vocative: nameFor(b, rel)
      }),
      ({ a, rel, bucket }) => (cold(rel)
        ? { act: 'deny', move: 'denial', register: registerOf(a),
            object: chooseFrom(['nobody else was using it',
                                'I raised you on local twice and got nothing back'],
                               `${bucket}:bdPush`) }
        : { act: 'apologise', move: 'expressive', register: registerOf(a),
            object: chooseFrom(['that is fair and it will not happen again',
                                'I had the band selector wrong'], `${bucket}:bdSorry`) }),
      ({ a, bucket }) => ({
        act: 'order', move: 'directive',
        register: 'formal',
        verb: 'keep',
        object: chooseFrom(['it on local from here', 'this channel clear'], `${bucket}:bdOrder`)
      })
    ],
    filesFrom: { type: 'took-report', weight: 0.5 },
    filesTo:   { type: 'was-disputed', weight: -0.6 },
    chains: ['apology', 'grudge', 'checkIn']
  },

  routeHandover: {
    channel: 'local', weight: 7, cooldown: 600, priority: 3,
    when: (a, b, ctx) => same(a, b) && (idle(a) || docked(a) || lowFuel(a)) &&
      !hurt(b) && known(ctx.rel),
    offers: 'cover',
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'offer', move: 'statement',
        register: registerOf(a),
        object: chooseFrom(['the rest of my leg', 'the corridor until my relief shows',
                            'the claim, seals and all'], `${bucket}:rhOffer`),
        because: reasonFact(a, bucket),
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket }) => ({
        act: 'ask', move: 'question',
        register: registerOf(a),
        object: chooseFrom(['what is still outstanding on it', 'who else is working that face',
                            'how long you need it held'], `${bucket}:rhAsk`)
      }),
      ({ a, bucket }) => ({
        act: 'inform', move: 'statement',
        register: registerOf(a),
        object: chooseFrom(['two bins to close out and a beacon that needs watching',
                            'nothing outstanding except the paperwork',
                            'one hull that has been sitting close in and not squawking'],
                           `${bucket}:rhBrief`),
        frames: ['inform-verbless', 'inform-contrast']
      }),
      ({ a, bucket }) => ({
        act: 'accept', move: 'commitment',
        register: registerOf(a),
        object: chooseFrom(['I have it until you are back through',
                            'consider it covered', 'it is mine until the shift turns'],
                           `${bucket}:rhTake`)
      })
    ],
    filesFrom: { type: 'offered-work', weight: 0.9 },
    filesTo:   { type: 'work-done-for-me', weight: 1.0 },
    chains: ['deliveryConfirm', 'thanks', 'shiftChange']
  },

  shoreLeave: {
    channel: 'local', weight: 5, cooldown: 1200, priority: 1,
    when: (a, b, ctx) => oldFriends(ctx.rel) && (docked(a) || idle(a)) && !engaged(a),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: 'inform', move: 'statement',
        register: registerOf(a),
        object: chooseFrom(['I have four days at the ring when this cycle closes',
                            'my sister has a berth on the inner ring and I have not seen it',
                            'I am taking the whole rotation off and sleeping through most of it'],
                           `${bucket}:slPlan`),
        frames: ['inform-verbless', 'inform-svo', 'inform-contrast'],
        vocative: nameFor(b, rel)
      }),
      ({ a, bucket }) => ({
        act: 'ask', move: 'question',
        register: registerOf(a),
        object: chooseFrom(['what you do with four days', 'whether you are staying dockside',
                            'if you are coming back at all'], `${bucket}:slAsk`)
      }),
      ({ a, bucket }) => ({
        act: 'answer', move: 'statement',
        register: registerOf(a),
        object: chooseFrom(['nothing, and I intend to do it thoroughly',
                            'the same as last time, which is to say too much of it',
                            'I will be back before the band notices'], `${bucket}:slAnswer`),
        frames: ['inform-verbless', 'inform-contrast']
      }),
      ({ a, b, rel, bucket }) => ({
        act: 'offer', move: 'commitment',
        register: registerOf(a),
        object: chooseFrom(['the first round, if you are there',
                            'a table at the ring end of the concourse',
                            'my berth number, so you can find me'], `${bucket}:slMeet`)
      })
    ],
    filesFrom: { type: 'spoke-with', weight: 0.8 },
    filesTo:   { type: 'spoke-with', weight: 0.8 },
    chains: ['smallTalk', 'covenant', 'rememberWhen']
  }
});

const MEMORY_PHRASE = {
  'gave-help': 'the time I came out to you',
  'was-helped': 'the time you came out to me',
  'gave-tip': 'that line I passed you',
  'got-tip': 'that line you passed me',
  'completed-work': 'that run I did for you',
  'work-done-for-me': 'that run you did for me',
  'owes-favour': 'the marker I owe you',
  'owed-favour': 'the marker you owe me',
  'was-disputed': 'the argument we had',
  'disputed-claim': 'the claim we argued over',
  'traded-words': 'what we said to each other',
  'made-pact': 'the arrangement we made',
  'refused-help': 'the call you did not answer',
  'asked-help': 'the call I made to you',
  'was-asked-help': 'the call you made to me',
  'faced-off': 'the day we sat nose to nose'
};

export const TOPIC_KEYS = Object.keys(TOPICS);

export const RESPONSE_OK = {
  question:   ['statement', 'denial', 'commitment', 'question'],
  statement:  ['expressive', 'comment', 'question', 'statement', 'denial', 'commitment', 'directive', 'accusation'],
  comment:    ['comment', 'expressive', 'statement', 'question', 'denial', 'directive', 'accusation', 'commitment'],
  accusation: ['denial', 'statement', 'expressive', 'accusation', 'comment', 'directive', 'question'],
  denial:     ['accusation', 'comment', 'statement', 'expressive', 'question', 'directive', 'commitment'],
  directive:  ['commitment', 'denial', 'expressive', 'question', 'comment', 'directive', 'statement'],
  commitment: ['expressive', 'commitment', 'denial', 'comment', 'question', 'statement', 'directive'],
  expressive: ['expressive', 'statement', 'comment', 'question', 'commitment', 'directive']
};

const COERCE_TO = {
  question:   { act: 'answer' },
  accusation: { act: 'deny' },
  directive:  { act: 'accept' },
  commitment: { act: 'ack' },
  denial:     { act: 'complain' },
  statement:  { act: 'ack' },
  comment:    { act: 'ack' },
  expressive: { act: 'ack' }
};

export function coerceResponse(prevMove, msg) {
  if (!prevMove || !msg) return msg;
  const move = ACT_MOVE[msg.act] || 'statement';
  if ((RESPONSE_OK[prevMove] || []).includes(move)) return msg;
  const fix = COERCE_TO[prevMove] || { act: 'ack' };
  const out = Object.assign({}, msg, fix);
  delete out.frames;
  delete out.move;
  delete out.q;
  return out;
}

const REACTION_VALUE = {
  commitment: 1.0,
  expressive: 0.6,
  statement: 0.3,
  comment: 0.0,
  question: -0.3,
  directive: -0.1,
  denial: -0.8,
  accusation: -1.1
};

const CONFUSION = /\b(say again|breaking up|did not (follow|catch)|what|repeat)\b/i;

function pushCurve(arr, v, cap) {
  arr.push(v);
  if (arr.length > cap) {
    for (let i = 0, j = 0; j < arr.length; i++, j += 2) arr[i] = arr[j];
    arr.length = Math.ceil(arr.length / 2);
  }
}

export function createSpeechMemory(opts = {}) {
  const rows = new Map();
  const priors = new Map();
  const pairs = new Map();
  const dials = new Map();
  const dialsOf = k => {
    let d = dials.get(k);
    if (!d) {
      d = { hedgeOn: { n: 0, s: 0 }, hedgeOff: { n: 0, s: 0 },
            markerOn: { n: 0, s: 0 }, markerOff: { n: 0, s: 0 },
            nameOn: { n: 0, s: 0 }, nameOff: { n: 0, s: 0 },
            short: { n: 0, s: 0 }, mid: { n: 0, s: 0 }, long: { n: 0, s: 0 }, pending: null };
      dials.set(k, d);
    }
    return d;
  };
  const dialMean = (a, b) => {
    if (a.n < 3 || b.n < 3) return 0;
    return (a.s / a.n) - (b.s / b.n);
  };
  const pairOf = k => {
    let p = pairs.get(k);
    if (!p) { p = { tries: 0, score: 0 }; pairs.set(k, p); }
    return p;
  };
  const cap = opts.cap || 20000;
  const priorWeight = opts.priorWeight || 4;
  const key = (sp, li, topic, frame) => `${sp}|${li}|${topic}|${frame}`;
  const priorKey = (sp, frame) => `${sp}||${frame}`;

  const prior = k => {
    if (!priors.has(k)) priors.set(k, { tries: 0, score: 0 });
    return priors.get(k);
  };

  const history = [];
  const felt = [];
  const choices = [];
  const advantages = [];
  const historyCap = opts.historyCap || 6000;

  const row = k => {
    if (rows.has(k)) return rows.get(k);
    if (rows.size >= cap) {
      let worstK = null, worst = Infinity;
      for (const [rk, rv] of rows) if (rv.tries < worst) { worst = rv.tries; worstK = rk; }
      if (worstK) rows.delete(worstK);
    }
    const fresh = { tries: 0, score: 0, last: 0 };
    rows.set(k, fresh);
    return fresh;
  };

  function bias(sp, li, topic, frame) {
    const r = rows.get(key(sp, li, topic, frame));
    const p = priors.get(priorKey(sp, frame));
    const pMean = p && p.tries ? p.score / p.tries : null;

    if ((!r || !r.tries) && pMean == null) return 1.08;

    const n = r ? r.tries : 0;
    const sum = r ? r.score : 0;
    const mean = (sum + priorWeight * (pMean == null ? 0 : pMean)) / (n + priorWeight);
    return Math.max(0.25, Math.min(2.6, 1 + mean * (opts.biasGain || 1.1)));
  }

  function priorOf(sp, frame) {
    const p = priors.get(priorKey(sp, frame));
    return p && p.tries ? { tries: p.tries, mean: p.score / p.tries } : null;
  }

  function note(sp, li, topic, frame, move, at, feat = null) {
    const k = key(sp, li, topic, frame);
    const r = row(k);
    r.tries++;
    r.last = at || 0;
    pairOf(`${sp}|${li}`).tries++;
    const p = prior(priorKey(sp, frame));
    if (p.tries >= 3) pushCurve(choices, p.score / p.tries, historyCap);
    p.tries++;
    if (feat) {
      const d = dialsOf(`${sp}|${li}`);
      d.pending = feat;
    }
    return { k, pk: priorKey(sp, frame), sp, li, topic, frame, move, at, feat };
  }

  function react(handle, reactionMove, reactionText, extra = 0) {
    if (!handle) return 0;
    let v = REACTION_VALUE[reactionMove] != null ? REACTION_VALUE[reactionMove] : 0;
    if (reactionText && CONFUSION.test(reactionText)) v -= 0.8;
    v += extra || 0;
    if (extra) pushCurve(felt, extra, historyCap);

    const r = rows.get(handle.k);
    if (r) r.score += v;
    if (handle.sp && handle.li) {
      pairOf(`${handle.sp}|${handle.li}`).score += v;
      const f = handle.feat;
      if (f && extra) {
        const d = dialsOf(`${handle.sp}|${handle.li}`);
        (f.hedge ? d.hedgeOn : d.hedgeOff).n++;
        (f.hedge ? d.hedgeOn : d.hedgeOff).s += extra;
        (f.marker ? d.markerOn : d.markerOff).n++;
        (f.marker ? d.markerOn : d.markerOff).s += extra;
        (f.vocative ? d.nameOn : d.nameOff).n++;
        (f.vocative ? d.nameOn : d.nameOff).s += extra;
        const band = f.words <= 9 ? d.short : f.words <= 16 ? d.mid : d.long;
        band.n++; band.s += extra;
      }
    }
    if (handle.pk) prior(handle.pk).score += v;

    history.push(v);
    if (history.length > historyCap) history.shift();
    return v;
  }

  const bucketMeans = (arr, buckets) => {
    if (arr.length < buckets * 4) return [];
    const size = Math.floor(arr.length / buckets);
    const out = [];
    for (let i = 0; i < buckets; i++) {
      const slice = arr.slice(i * size, (i + 1) * size);
      out.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    }
    return out;
  };

  function choice(sp, chosen, candidates, li = null, topic = null) {
    if (!candidates || candidates.length < 2) return 0;
    const meanOf = f => {
      if (li && topic) {
        const r = rows.get(key(sp, li, topic, f));
        if (r && r.tries >= 2) return r.score / r.tries;
      }
      const p = priors.get(priorKey(sp, f));
      return p && p.tries >= 2 ? p.score / p.tries : null;
    };
    const known = candidates.map(meanOf).filter(x => x != null);
    if (known.length < 2) return 0;
    const chosenMean = meanOf(chosen);
    if (chosenMean == null) return 0;
    const avg = known.reduce((a, b) => a + b, 0) / known.length;
    const adv = chosenMean - avg;
    pushCurve(advantages, adv, historyCap);

    return adv;
  }

  function curve(buckets = 8) { return bucketMeans(history, buckets); }

  function choiceCurve(buckets = 8) { return bucketMeans(choices, buckets); }

  function feltCurve(buckets = 8) { return bucketMeans(felt, buckets); }
  const feltMean = () => (felt.length ? felt.reduce((a, b) => a + b, 0) / felt.length : 0);

  function advantageCurve(buckets = 8) { return bucketMeans(advantages, buckets); }
  const advantageMean = () => (advantages.length
    ? advantages.reduce((a, b) => a + b, 0) / advantages.length : 0);

  function styleFor(sp, li) {
    const agg = pairs.get(`${sp}|${li}`);
    const tries = agg ? agg.tries : 0;
    const score = agg ? agg.score : 0;
    const d = dials.get(`${sp}|${li}`);
    if (!tries) return { hedgeMul: 1, markerMul: 1, wordsMul: 1, vocativeMul: 1,
                         targetWords: 0, lengthPref: 0, tries: 0, mean: 0 };
    const mean = score / tries;

    const dial = (on, off) => (d ? dialMean(d[on], d[off]) : 0);

    const bandMean = k => (d && d[k].n >= 4 ? d[k].s / d[k].n : null);
    let best = { words: 0, pref: 0 };
    if (d) {
      const bands = [
        { k: 'short', words: 8, pref: -1 },
        { k: 'mid', words: 14, pref: 0 },
        { k: 'long', words: 21, pref: 1 }
      ].map(x => ({ ...x, mean: bandMean(x.k) })).filter(x => x.mean != null);
      if (bands.length >= 2) {
        const top = bands.reduce((a, b) => (b.mean > a.mean ? b : a));
        const spread = Math.max(...bands.map(x => x.mean)) - Math.min(...bands.map(x => x.mean));
        if (spread > 0.06) best = { words: top.words, pref: top.pref };
      }
    }
    const scale = (diff, floor, ceil) =>
      Math.max(floor, Math.min(ceil, 1 + diff * 3.0));

    return {
      tries, mean,
      hedgeMul: scale(dial('hedgeOn', 'hedgeOff'), 0.05, 1.8),
      markerMul: scale(dial('markerOn', 'markerOff'), 0.05, 1.7),
      wordsMul: 1,
      targetWords: best.words,
      lengthPref: best.pref,
      vocativeMul: scale(dial('nameOn', 'nameOff'), 0.05, 1.7),
      dials: d ? {
        hedge: dial('hedgeOn', 'hedgeOff'),
        marker: dial('markerOn', 'markerOff'),
        length: best.pref, targetWords: best.words
      } : null
    };
  }

  function report(sp, limit = 8) {
    const out = [];
    for (const [k, r] of rows) {
      const [speaker, listener, topic, frame] = k.split('|');
      if (sp && speaker !== sp) continue;
      if (!r.tries) continue;
      out.push({ speaker, listener, topic, frame, tries: r.tries, mean: r.score / r.tries });
    }
    out.sort((a, b) => b.mean - a.mean || b.tries - a.tries);
    return { best: out.slice(0, limit), worst: out.slice(-limit).reverse(), rows: out.length };
  }

  const serialise = () => ({
    v: 2,
    rows: [...rows].slice(-2000).map(([k, r]) => [k, r.tries, Math.round(r.score * 100) / 100]),
    priors: [...priors].map(([k, r]) => [k, r.tries, Math.round(r.score * 100) / 100])
  });
  const restore = blob => {
    rows.clear(); priors.clear();
    for (const [k, tries, score] of ((blob && blob.rows) || [])) rows.set(k, { tries, score, last: 0 });
    for (const [k, tries, score] of ((blob && blob.priors) || [])) priors.set(k, { tries, score });
    return rows.size + priors.size;
  };

  return {
    bias, note, react, choice, styleFor, report, priorOf, dialsFor: (sp, li) => {
      const d = dials.get(`${sp}|${li}`);
      if (!d) return null;
      const band = k => (d[k].n >= 4 ? d[k].s / d[k].n : null);
      const bands = { short: band('short'), mid: band('mid'), long: band('long') };
      let prefers = null, bestMean = -Infinity;
      for (const k of ['short', 'mid', 'long']) {
        if (bands[k] != null && bands[k] > bestMean) { bestMean = bands[k]; prefers = k; }
      }
      return {
        hedge: dialMean(d.hedgeOn, d.hedgeOff),
        marker: dialMean(d.markerOn, d.markerOff),
        naming: dialMean(d.nameOn, d.nameOff),
        length: prefers, bands,
        n: d.hedgeOn.n + d.hedgeOff.n
      };
    },
    curve, choiceCurve, advantageCurve, advantageMean, feltCurve, feltMean, serialise, restore,
    get size() { return rows.size; },
    get priorCount() { return priors.size; },
    get reactions() { return history.length; }
  };
}

const CODA = {
  statement: [
    ({ a, b, rel, bucket }) => ({
      act: 'ask', move: 'question',
      object: chooseFrom(['how long that holds', 'where you had that from',
                          'what it means for my leg', 'whether anybody else has it'],
                         `${bucket}:codaAskStatement`)
    }),
    ({ a, bucket }) => ({
      act: 'ack', move: 'expressive',
      verb: 'hold',
      object: chooseFrom(['that on my board', 'it against the survey', 'the position'],
                         `${bucket}:codaAckStatement`)
    })
  ],
  question: [
    ({ a, bucket }) => ({
      act: 'answer', move: 'statement',
      object: chooseFrom(['as much as I can say on an open band',
                          'the same as it read an hour ago',
                          'nothing I would put money on'], `${bucket}:codaAnswer`),
      frames: ['inform-verbless', 'inform-contrast']
    })
  ],
  commitment: [
    ({ a, bucket }) => ({
      act: 'thank', move: 'expressive',
      object: chooseFrom(['that saves me a leg', 'I will not forget it',
                          'that is one I owe you'], `${bucket}:codaThanks`)
    }),
    ({ a, b, rel, bucket }) => ({
      act: 'request', move: 'directive',
      object: chooseFrom(['a shout when it is done', 'the numbers when you have them',
                          'word either way'], `${bucket}:codaFollowUp`)
    })
  ],
  denial: [
    ({ a, bucket }) => ({
      act: 'request', move: 'directive',
      object: chooseFrom(['the log entry, then', 'somebody who saw it, then',
                          'your side of it in writing'], `${bucket}:codaProof`)
    }),
    ({ a, bucket }) => ({
      act: 'refuse', move: 'comment',
      because: chooseFrom(['I have heard that answer before',
                           'we will leave it there for now'], `${bucket}:codaLetGo`)
    })
  ],
  accusation: [
    ({ a, bucket }) => ({
      act: 'deny', move: 'denial',
      object: chooseFrom(['that is not what my log says',
                          'you have the wrong hull and the wrong shift'], `${bucket}:codaDeny`)
    })
  ],
  directive: [
    ({ a, bucket }) => ({
      act: 'accept', move: 'commitment',
      object: chooseFrom(['it is done', 'I have it', 'consider it handled'],
                         `${bucket}:codaComply`)
    })
  ],
  comment: [
    ({ a, bucket }) => ({
      act: 'inform', move: 'statement',
      object: chooseFrom(['it is the same story every cycle out here',
                          'nobody at the ring wants to hear it either'],
                         `${bucket}:codaComment`),
      frames: ['inform-verbless', 'inform-contrast']
    })
  ],
  expressive: [
    ({ a, b, rel, bucket }) => ({
      act: 'farewell', move: 'expressive',
      speaker: a.name, target: nameFor(b, rel)
    })
  ]
};

function codaFor(prevMove, ctx, turn) {
  if (!prevMove || turn > 5) return null;
  const pool = CODA[prevMove];
  if (!pool || !pool.length) return null;
  const rng = ctx.rng;
  const draw = rng ? rng.next() : Math.random();

  let chance = 0.3 + (CALIBRATION.codaLift || 0) * 0.5;
  if (familiar(ctx.rel)) chance += 0.15;
  if (oldFriends(ctx.rel)) chance += 0.1;
  if (cold(ctx.rel)) chance -= 0.15;
  if (prevMove === 'question' || prevMove === 'accusation') chance = 0.9;
  chance -= turn * 0.12;
  if (draw > chance) return null;

  const asking = pool.filter(fn => /act: 'ask'/.test(String(fn)));
  const usePool = (asking.length && (CALIBRATION.questionLift || 0) > 0.1 &&
                   (rng ? rng.next() : Math.random()) < CALIBRATION.questionLift * 1.5) ? asking : pool;
  const pick = usePool[Math.floor((rng ? rng.next() : Math.random()) * usePool.length)];
  try { return pick(Object.assign({ bucket: `${ctx.a.name}:coda` }, ctx)); }
  catch (e) { return null; }
}

export function utter(key, turn, ctx) {
  const r = utterRecord(key, turn, ctx);
  return r ? r.text : '';
}

export function utterRecord(key, turn, ctx, prev = null) {
  const t = TOPICS[key];
  if (!t) return null;
  const bucket = bucketFor(ctx.a, key);
  const pair = pairBucket(ctx.a, ctx.b, key);

  if (Array.isArray(t.say) && t.say[turn]) {
    let msg;
    try { msg = t.say[turn](Object.assign({ bucket: pair, ctx }, ctx)); }
    catch (e) { return null; }
    if (!msg) return null;
    return utterFromRecord(key, msg, ctx, prev, turn);
  }

  if (Array.isArray(t.lines) && t.lines[turn]) {
    const text = t.lines[turn](ctx);
    return text ? { text, move: 'statement', frame: 'legacy', handle: null, turn } : null;
  }
  return null;
}

export function utterFromRecord(key, record, ctx, prev = null, turn = 0) {
  const t = TOPICS[key] || {};
  const bucket = bucketFor(ctx.a, key);
  const pair = pairBucket(ctx.a, ctx.b, key);
  {
    let msg = record;

    if (prev && prev.move) {
      if (Array.isArray(msg)) msg = msg.map((r, i) => (i === 0 ? coerceResponse(prev.move, r) : r));
      else msg = coerceResponse(prev.move, msg);
    }

    const first = Array.isArray(msg) ? msg[0] : msg;
    const register = (first && first.register) || registerOf(ctx.a, t.mood);
    const style = (ctx.speech && ctx.learning !== false)
      ? ctx.speech.styleFor(ctx.a.name, ctx.b.name) : null;
    const profile = profileFor(ctx.a, register, {
      urgent: !!t.urgent || !!(first && first.urgent),
      familiarity: familiarity(ctx.rel),
      hostile: !same(ctx.a, ctx.b) || cold(ctx.rel)
    });
    const lengthPref = Math.max(-1, Math.min(1,
      (style && style.tries ? (style.lengthPref || 0) : 0) + (CALIBRATION.lengthLift || 0)));
    if (style && style.tries) {
      profile.hedge *= style.hedgeMul;
      profile.marker *= style.markerMul;
      if (style.targetWords) profile.maxWords = style.targetWords;
      profile.vocative = Math.max(0, Math.min(1, profile.vocative * (style.vocativeMul || 1)));
    }

    let usedFrame = null, usedMove = null, usedFeat = null;
    const opts = {
      bucket, rng: ctx.rng, profile, lengthPref,
      vocative: (first && first.vocative) || null,
      signoff: turn > 0 && turn === (t.say.length - 1) && !t.urgent,
      onFrame: (id, move, text, feat) => { usedFrame = id; usedMove = move; usedFeat = feat || null; },
      learn: (ctx.speech && ctx.learning !== false) ? {
        bias: id => ctx.speech.bias(ctx.a.name, ctx.b.name, key, id),
        choice: (chosen, offered) => ctx.speech.choice(ctx.a.name, chosen, offered, ctx.b.name, key)
      } : null
    };
    const text = Array.isArray(msg) ? realiseAll(msg, opts) : realise(msg, opts);
    if (!text) return null;

    const move = usedMove || moveOf(first);
    const handle = ctx.speech
      ? ctx.speech.note(ctx.a.name, ctx.b.name, key, usedFrame || 'unknown', move,
                        ctx.now ? ctx.now() : 0, usedFeat)
      : null;

    if (prev && prev.handle && ctx.speech) {
      const felt = ctx.reception ? ctx.reception(ctx.a, prev.text, prev.move, prev.frame) : 0;
      ctx.speech.react(prev.handle, move, text, felt);
    }

    return { text, move, frame: usedFrame, handle, turn };
  }
}

export function turnsFor(key, ctx) {
  const t = TOPICS[key];
  if (!t || !Array.isArray(t.say)) return 2;
  const max = t.say.length;
  if (max <= 2) return max;
  const rng = ctx.rng || null;
  const draw = rng ? rng.next() : Math.random();
  let chance = 0.62 + (CALIBRATION.codaLift || 0) * 0.25;
  if (familiar(ctx.rel)) chance += 0.2;
  if (oldFriends(ctx.rel)) chance += 0.15;
  if (cold(ctx.rel)) chance -= 0.2;
  if (t.urgent) chance -= 0.15;
  if (t.offers) chance += 0.25;
  if ((t.say || []).some(fn => /accuse|deny|admit/.test(String(fn)))) chance += 0.3;
  return draw < chance ? max : 2;
}

export function exchange(key, ctx, opts = {}) {
  const t = TOPICS[key];
  if (!t) return [];
  const turns = Math.min(turnsFor(key, ctx), (t.say || t.lines || []).length);
  const out = [];
  let a = ctx.a, b = ctx.b;
  let prev = null;
  const memo = {};

  const maxTurns = Math.min(8, turns + 4);
  for (let i = 0; i < maxTurns; i++) {
    if (opts.stopIf && opts.stopIf(a, b, i)) break;
    const turnCtx = Object.assign({}, ctx, { a, b, memo });

    let res;
    if (i < turns) {
      res = utterRecord(key, i, turnCtx, prev);
    } else {
      const coda = codaFor(prev && prev.move, turnCtx, i);
      res = coda ? utterFromRecord(key, coda, turnCtx, prev, i) : null;
    }
    if (!res) break;
    out.push({ speaker: a, listener: b, text: res.text, turn: i, move: res.move, frame: res.frame });
    prev = res;
    const swap = a; a = b; b = swap;
  }

  if (prev && prev.handle && ctx.speech) {
    const felt = ctx.reception ? ctx.reception(b, prev.text, prev.move, prev.frame) : 0;
    ctx.speech.react(prev.handle, 'comment', null, felt);
  }
  return out;
}

export function availableTopics(a, b, ctx) {
  const out = [];
  for (const k of TOPIC_KEYS) {
    const t = TOPICS[k];
    try { if (t.when(a, b, ctx)) out.push(k); } catch (e) {}
  }
  return out;
}

export function scoreTopic(key, a, b, ctx) {
  const t = TOPICS[key];
  if (!t) return 0;
  let w = t.weight || 1;

  w *= 1 + (t.priority || 0) * 0.35;

  if (has(ctx, 'lastRaised')) {
    const since = ctx.lastRaised(a, b, key);
    if (since != null && since < (t.cooldown || 0)) return 0;
    if (since != null && since < (t.cooldown || 0) * 3) w *= 0.4;
  }

  if (has(ctx, 'lastTopic')) {
    const prev = ctx.lastTopic(a, b);
    const prevT = prev && TOPICS[prev];
    if (prevT && Array.isArray(prevT.chains) && prevT.chains.includes(key)) w *= 2.2;
    if (prev === key) w *= 0.15;
  }

  const rel = ctx.rel;
  if (strangers(rel)) {
    if (['shareRumour', 'recommend', 'owesFavour', 'smallTalk', 'boast'].includes(key)) w *= 0.25;
    if (['checkIn', 'dockRequest', 'laneReport'].includes(key)) w *= 1.4;
  }
  if (oldFriends(rel)) {
    if (['smallTalk', 'shareRumour', 'covenant', 'boast'].includes(key)) w *= 1.6;
    if (key === 'checkIn') w *= 0.6;
  }
  if (cold(rel) && ['smallTalk', 'covenant', 'recommend'].includes(key)) w *= 0.2;

  if (t.urgent && (hurt(a) || engaged(a) || (has(ctx, 'threatNear') && ctx.threatNear(a)))) w *= 2.5;

  return Math.max(0, w);
}

export function chooseTopic(a, b, ctx) {
  const options = availableTopics(a, b, ctx);
  if (!options.length) return null;
  const scored = options.map(k => ({ k, w: scoreTopic(k, a, b, ctx) })).filter(x => x.w > 0);
  if (!scored.length) return null;
  const total = scored.reduce((s, x) => s + x.w, 0);
  let draw = (ctx.rng ? ctx.rng.next() : Math.random()) * total;
  for (const s of scored) { draw -= s.w; if (draw <= 0) return s.k; }
  return scored[scored.length - 1].k;
}

export function memoriesFrom(key, ctx) {
  const t = TOPICS[key];
  if (!t) return [];
  const out = [];
  const third = has(ctx, 'thirdParty') ? ctx.thirdParty(ctx.a, ctx.b) : null;

  const build = (spec, holder, subject) => {
    if (!spec) return;
    out.push({
      holder,
      subject: spec.aboutThirdParty && third ? third
        : (spec.subject === 'player' ? 'player' : subject),
      type: spec.type,
      weight: spec.weight != null ? spec.weight : 1,
      hearsay: !!t.hearsay,
      topic: key,
      at: has(ctx, 'now') ? ctx.now() : null
    });
  };

  build(t.filesFrom, ctx.a, ctx.b);
  build(t.filesTo, ctx.b, ctx.a);
  return out;
}

export function obligationFrom(key, ctx, accepted = true) {
  const t = TOPICS[key];
  if (!t || !t.offers || !accepted) return null;
  return {
    kind: t.offers,
    from: ctx.a,
    to: ctx.b,
    topic: key,
    at: has(ctx, 'now') ? ctx.now() : null
  };
}

export const chainsOf = key => ((TOPICS[key] && TOPICS[key].chains) || []).slice();

export const CHANNELS = [...new Set(TOPIC_KEYS.map(k => TOPICS[k].channel))].sort();

export function topicStats() {
  const byChannel = {};
  let withObligations = 0, withChains = 0, multiTurn = 0;
  for (const k of TOPIC_KEYS) {
    const t = TOPICS[k];
    byChannel[t.channel] = (byChannel[t.channel] || 0) + 1;
    if (t.offers) withObligations++;
    if (t.chains) withChains++;
    if ((t.say || []).length > 2) multiTurn++;
  }
  return { topics: TOPIC_KEYS.length, byChannel, withObligations, withChains, multiTurn, channels: CHANNELS };
}

function fixtureUnits() {
  return [
    { name: 'Nexis Drone 08', faction: 'nexis', role: 'mine', hp: 100, maxHp: 100,
      cargo: 40, cargoMax: 50, fuel: 80, fuelMax: 100, oreGrade: 0.8, task: 'mine',
      position: { x: 0, y: 0, z: 0 }, nearestName: 'Kessel Deep' },
    { name: 'Bulk Hauler 02', faction: 'nexis', role: 'haul', hp: 62, maxHp: 100,
      cargo: 2, cargoMax: 200, fuel: 20, fuelMax: 100, task: 'transit',
      position: { x: 120, y: 0, z: 0 }, nearestName: 'Ostrava Ring' },
    { name: 'Coalition Patrol 03', faction: 'coalition', role: 'patrol', hp: 100, maxHp: 100,
      fuel: 90, fuelMax: 100, task: 'patrol', position: { x: 200, y: 40, z: 0 } },
    { name: 'Red Kite', faction: 'pirate', role: 'combat', hp: 85, maxHp: 100,
      task: 'idle', position: { x: 260, y: 10, z: 0 } },
    { name: 'Scrapper Vig', faction: 'independent', role: 'salvage', hp: 44, maxHp: 100,
      cargo: 120, cargoMax: 150, fuel: 60, fuelMax: 100, task: 'work',
      position: { x: 90, y: 30, z: 0 }, nearestName: 'the Boneyard' },
    { name: 'Ostrava Ring', faction: 'coalition', role: 'fort', hp: 900, maxHp: 900,
      isStation: true, position: { x: 300, y: 0, z: 0 } },
    { name: 'Tessera Yard 11', faction: 'nexis', role: 'build', hp: 100, maxHp: 100,
      docked: true, task: 'idle', position: { x: 20, y: 5, z: 0 } },
    { name: 'Wandering Marl', faction: 'independent', role: 'trade', hp: 96, maxHp: 100,
      cargo: 180, cargoMax: 200, fuel: 75, fuelMax: 100, task: 'transit', askPrice: 420, bidPrice: 360,
      position: { x: 150, y: 80, z: 0 }, nearestName: 'the second marker' },
    { name: 'Halcyon Merc 4', faction: 'independent', role: 'merc', hp: 22, maxHp: 100,
      fuel: 15, fuelMax: 100, task: 'idle', position: { x: 40, y: 60, z: 0 } },
    { name: 'Free Cutter Sil', faction: 'independent', role: 'mine', hp: 92, maxHp: 100,
      cargo: 10, cargoMax: 60, fuel: 70, fuelMax: 100, oreGrade: 0.3, task: 'mine',
      position: { x: 60, y: 20, z: 0 }, nearestName: 'Kessel Deep' },
    { name: 'Nexis Escort 1', faction: 'nexis', role: 'combat', hp: 100, maxHp: 100,
      fuel: 85, fuelMax: 100, task: 'patrol', position: { x: 30, y: 10, z: 0 } },
    { name: 'Nexis Escort 2', faction: 'nexis', role: 'combat', hp: 98, maxHp: 100,
      fuel: 80, fuelMax: 100, task: 'idle', position: { x: 35, y: 12, z: 0 } },
    { name: 'Tessera Yard 12', faction: 'nexis', role: 'build', hp: 100, maxHp: 100,
      docked: true, task: 'idle', position: { x: 22, y: 6, z: 0 } }
  ];
}

function fixtureCtx(a, b, over = {}) {
  const units = fixtureUnits();
  return Object.assign({
    a, b,
    rel: { exchanges: 5, regard: 0.4 },
    rng: null,
    gossipThreshold: 1,
    warinessOf: () => 1.6,
    regardForPlayer: () => 0.5,
    playerNear: () => true,
    playerBearing: () => 214,
    recallBetween: () => true,
    recallDetail: () => ({ type: 'gave-help', topic: 'rescueReport', weight: 1.8, ago: 4200 }),
    tipWasGood: () => true,
    wasHonest: () => true,
    lostHull: () => 'Ashfall 03',
    trafficNear: () => 3,
    threatNear: () => true,
    threatCount: () => 2,
    threatBearing: () => 88,
    hazardNear: () => true,
    beaconFault: () => true,
    berthsFree: () => 1,
    askingPrice: u => u.askPrice || 400,
    counterPrice: u => u.bidPrice || 350,
    dealCloses: () => true,
    wantsFight: () => false,
    thirdParty: (x, y) => units.find(u => u.name !== x.name && u.name !== y.name) || null,
    regardBetween: () => 0.5,
    lastRaised: () => 9999,
    lastTopic: () => null,
    now: () => 1000
  }, over);
}

function fixturePairs() {
  const u = fixtureUnits();
  const pairs = [];
  for (const a of u) for (const b of u) if (a !== b) pairs.push([a, b]);
  return pairs;
}

const RELS = [
  null,
  { exchanges: 0, regard: 0 },
  { exchanges: 1, regard: 0.1 },
  { exchanges: 6, regard: 0.5 },
  { exchanges: 20, regard: 0.8 },
  { exchanges: 9, regard: -0.6 },
  { exchanges: 3, regard: -0.9, owes: true },
  { exchanges: 14, regard: 0.35, owed: true }
];

export const lastSentence = text => {
  const parts = String(text || '').split(/(?<=[.!?])\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : String(text || '');
};

const KNOWN_FIELDS = new Set(['channel', 'weight', 'cooldown', 'when', 'say', 'lines',
  'filesFrom', 'filesTo', 'offers', 'chains', 'urgent', 'mood', 'hearsay', 'priority']);

function checkShape() {
  const bad = [];
  for (const k of TOPIC_KEYS) {
    const t = TOPICS[k];
    if (typeof t.when !== 'function') bad.push(`${k}: no when()`);
    if (!Array.isArray(t.say) && !Array.isArray(t.lines)) bad.push(`${k}: no say[] or lines[]`);
    if (Array.isArray(t.say) && t.say.length < 2) bad.push(`${k}: say[] shorter than an exchange`);
    if (!t.channel) bad.push(`${k}: no channel`);
    if (!t.filesFrom || !t.filesTo) bad.push(`${k}: does not file memory on both sides`);
    if (t.filesFrom && !t.filesFrom.type) bad.push(`${k}: filesFrom has no type`);
    if (t.filesTo && !t.filesTo.type) bad.push(`${k}: filesTo has no type`);
    for (const f of Object.keys(t)) if (!KNOWN_FIELDS.has(f)) bad.push(`${k}: unknown field "${f}"`);
    for (const c of (t.chains || [])) if (!TOPICS[c]) bad.push(`${k}: chains to missing topic "${c}"`);
  }
  return bad;
}

function checkWhenRobustness() {
  const bad = [];
  const bare = { a: null, b: null, rel: null, gossipThreshold: 1 };
  const units = fixtureUnits().concat([{ name: 'Stub', faction: 'x', role: 'y', hp: 1, maxHp: 1 }]);
  for (const k of TOPIC_KEYS) {
    for (const a of units) for (const b of units) {
      if (a === b) continue;
      try { TOPICS[k].when(a, b, Object.assign({}, bare, { a, b })); }
      catch (e) { bad.push(`${k}: when() threw on bare ctx — ${e.message}`); a === b; break; }
    }
  }
  return [...new Set(bad)];
}

function checkExchanges(limitPerTopic = 40) {
  const bad = [];
  const fired = new Set();
  const pairs = fixturePairs();
  let lines = 0;

  for (const k of TOPIC_KEYS) {
    let n = 0;
    let att = 0;
    for (const [a, b] of pairs) {
      for (const rel of RELS) {
        if (n >= limitPerTopic) break;
        const variant = att++ % 4;
        const over = { rel };
        if (variant === 1) Object.assign(over, { threatNear: () => false, hazardNear: () => false, playerNear: () => false });
        if (variant === 2) Object.assign(over, { tipWasGood: () => false, wasHonest: () => false });
        if (variant === 3) Object.assign(over, {
          threatNear: () => false,
          regardBetween: () => -0.7,
          recallBetween: (x, y, type) => type !== 'work-done-for-me'
        });
        const ctx = fixtureCtx(a, b, over);
        let ok = false;
        try { ok = TOPICS[k].when(a, b, ctx); } catch (e) { bad.push(`${k}: when() threw — ${e.message}`); break; }
        if (!ok) continue;
        n++;
        fired.add(k);
        const script = exchange(k, ctx);
        if (!script.length) { bad.push(`${k}: fired but produced no lines (${a.name} -> ${b.name})`); continue; }
        for (let i = 1; i < script.length; i++) {
          const prev = script[i - 1].move, here = script[i].move;
          if (prev && here && !(RESPONSE_OK[prev] || []).includes(here)) {
            bad.push(`${k}: ${here} does not answer ${prev} — ${JSON.stringify(script[i].text)}`);
          }
        }
        for (const line of script) {
          lines++;
          if (line.move) {
            const wrong = checkMove(line.text, line.move, {});
            if (wrong) bad.push(`${k} [${line.speaker.name}] ${line.move}: ${wrong} — ${JSON.stringify(line.text)}`);
          }
          const checked = proof(line.text);
          if (!checked.ok) bad.push(`${k} [${line.speaker.name}] ${checked.fatal}: ${JSON.stringify(line.text)}`);
          else if (checked.text !== line.text) bad.push(`${k} [${line.speaker.name}] unstable: ${JSON.stringify(line.text)}`);
          if (/\bundefined\b|\bNaN\b|\[object/.test(line.text)) bad.push(`${k}: leaked internals — ${line.text}`);
        }
        const mem = memoriesFrom(k, ctx);
        if (mem.length !== 2) bad.push(`${k}: filed ${mem.length} memories, expected 2`);
        for (const m of mem) {
          if (!m.holder || !m.subject) bad.push(`${k}: memory with no holder or subject`);
          if (typeof m.weight !== 'number') bad.push(`${k}: memory weight is not a number`);
        }
      }
      if (n >= limitPerTopic) break;
    }
  }

  const never = TOPIC_KEYS.filter(k => !fired.has(k));
  for (const k of never) bad.push(`${k}: never fired against any fixture pair — check its when()`);
  return { bad: [...new Set(bad)], lines, fired: fired.size };
}

function checkVariety(key = 'oreTip', n = 30) {
  const [a, b] = [fixtureUnits()[0], fixtureUnits()[1]];
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    const ctx = fixtureCtx(a, b, { rel: { exchanges: 5, regard: 0.4 } });
    seen.add(exchange(key, ctx).map(l => l.text).join(' | '));
  }
  return { distinct: seen.size, of: n, samples: [...seen].slice(0, 4) };
}

function checkSelection() {
  const bad = [];
  const u = fixtureUnits();
  const hurtMiner = Object.assign({}, u[0], { hp: 20 });
  const patrol = u.find(x => x.faction === hurtMiner.faction && (x.role === 'combat' || x.role === 'merc'));
  const ctx = fixtureCtx(hurtMiner, patrol, { rel: { exchanges: 5, regard: 0.4 } });
  const opts = availableTopics(hurtMiner, patrol, ctx);
  if (!opts.includes('askHelp')) bad.push('a badly hurt ship next to an armed friendly did not surface askHelp');
  const scores = Object.fromEntries(opts.map(k => [k, scoreTopic(k, hurtMiner, patrol, ctx)]));
  if (scores.askHelp != null && scores.smallTalk != null && scores.askHelp <= scores.smallTalk) {
    bad.push('askHelp did not outrank smallTalk while under fire');
  }
  const cd = fixtureCtx(u[0], u[1], { lastRaised: () => 1 });
  if (scoreTopic('oreTip', u[0], u[1], cd) !== 0) bad.push('cooldown did not suppress a recently raised topic');
  const base = scoreTopic('tipFollowUp', u[0], u[1], fixtureCtx(u[0], u[1], { lastTopic: () => null }));
  const chained = scoreTopic('tipFollowUp', u[0], u[1], fixtureCtx(u[0], u[1], { lastTopic: () => 'oreTip' }));
  if (!(chained > base)) bad.push('a chained topic was not boosted after its parent');
  return bad;
}

export function runTopicSelfTest(opts = {}) {
  const { verbose = true, perTopic = 40 } = opts;
  const failures = [];
  let pass = 0;

  const shape = checkShape();
  if (shape.length) failures.push(...shape); else pass++;

  const robust = checkWhenRobustness();
  if (robust.length) failures.push(...robust); else pass++;

  const ex = checkExchanges(perTopic);
  if (ex.bad.length) failures.push(...ex.bad); else pass++;

  const sel = checkSelection();
  if (sel.length) failures.push(...sel); else pass++;

  const v = checkVariety('oreTip', 30);
  if (v.distinct >= 5) pass++;
  else failures.push(`variety: oreTip produced only ${v.distinct} distinct transcripts in 30 runs`);

  const report = {
    pass, fail: failures.length, failures,
    linesChecked: ex.lines, topicsFired: ex.fired,
    variety: v, stats: topicStats()
  };
  if (verbose && typeof console !== 'undefined') {
    console.log(`npc-topics self-test: ${pass} groups passed, ${failures.length} failures, ${ex.lines} lines proofed`);
    for (const f of failures.slice(0, 30)) console.log('  ✗ ' + f);
    console.log(`  topics: ${report.stats.topics} across ${report.stats.channels.join(', ')}`);
    console.log(`  variety: ${v.distinct}/${v.of} distinct transcripts`);
  }
  return report;
}

export function sampleTraffic(n = 12, opts = {}) {
  const units = fixtureUnits();
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = units[(i * 3) % units.length];
    const b = units[(i * 5 + 1) % units.length];
    if (a === b) continue;
    const rel = RELS[i % RELS.length];
    const ctx = fixtureCtx(a, b, { rel });
    const key = chooseTopic(a, b, ctx);
    if (!key) continue;
    const script = exchange(key, ctx);
    if (!script.length) continue;
    out.push({ topic: key, channel: TOPICS[key].channel, script });
    if (opts.log !== false && typeof console !== 'undefined') {
      console.log(`\n[${TOPICS[key].channel}] ${key}`);
      for (const l of script) console.log(`  ${l.speaker.name.padEnd(20)} ${l.text}`);
    }
  }
  return out;
}

export const INTENTS = [
  {
    id: 'greet',
    match: /\b(hello|hi|hey|greetings|good (day|shift|cycle)|this is)\b/i,
    build: (npc, ctx) => ({
      act: 'greet', target: 'the independent hull', speaker: npc.name
    })
  },
  {
    id: 'farewell',
    match: /\b(bye|goodbye|see you|signing off|farewell|catch you later)\b|\bout\.?\s*$/i,
    build: (npc, ctx) => ({ act: 'farewell', speaker: npc.name })
  },
  {
    id: 'thank',
    match: /\b(thanks|thank you|cheers|appreciated|much obliged)\b/i,
    regard: +0.12,
    build: (npc, ctx) => ({
      act: 'ack',
      object: chooseFrom(['no trouble', 'any time', 'that is what the band is for'],
                         `${ctx.bucket}:pThank`)
    })
  },
  {
    id: 'apologise',
    match: /\b(sorry|my (bad|mistake|fault)|apolog)/i,
    regard: +0.15,
    build: (npc, ctx) => ({
      act: 'accept',
      object: chooseFrom(['forget it', 'we are square', 'it is done'], `${ctx.bucket}:pSorry`)
    })
  },
  {
    id: 'threaten',
    match: /\b(kill|destroy|blow|shoot|fire on|scrap you|hand over|or else|give me your)\b/i,
    regard: -0.55,
    hostile: true,
    build: (npc, ctx) => ({
      act: badlyHurt(npc) ? 'request' : 'warn',
      object: badlyHurt(npc)
        ? chooseFrom(['do not — I am carrying people', 'take the hold and leave the hull',
                      'I have nothing worth this'], `${ctx.bucket}:pThreatBeg`)
        : chooseFrom(['you are on an open band and everybody heard that',
                      'try it and see how far you get',
                      'I have your registry logged'], `${ctx.bucket}:pThreat`),
      urgent: true
    })
  },
  {
    id: 'insult',
    match: /\b(idiot|useless|shut up|coward|scum|worthless)\b/i,
    regard: -0.25,
    build: (npc, ctx) => ({
      act: 'complain',
      object: chooseFrom(['that is the band you want to use, is it',
                          'I have been called worse by better',
                          'noted, and logged'], `${ctx.bucket}:pInsult`)
    })
  },
  {
    id: 'status',
    match: /\b(status|how are you|you (ok|okay|alright)|condition|state)\b/i,
    build: (npc, ctx) => ({
      act: 'report',
      subject: 'I',
      agr: { person: 1, number: 'sg' },
      quality: hurt(npc) ? damageFact(npc, ctx.bucket)
        : chooseFrom(['sound', 'buttoned up', 'nothing broken'], `${ctx.bucket}:pFine`),
      where: whereFact(npc, ctx.bucket)
    })
  },
  {
    id: 'position',
    match: /\b(where are you|your position|what.s your (position|location)|where.s that)\b/i,
    build: (npc, ctx) => ({
      act: 'report',
      subject: 'I',
      agr: { person: 1, number: 'sg', aspect: 'prog' },
      verb: transiting(npc) ? 'run' : 'work',
      where: whereFact(npc, ctx.bucket)
    })
  },
  {
    id: 'ore',
    match: /\b(ore|rock|seam|face|grade|mine|mining|claim|yield)\b/i,
    topic: 'oreTip',
    build: (npc, ctx) => {
      const g = gradeFact(npc, ctx.bucket);
      return anyRole(npc, 'mine', 'haul', 'trade')
        ? { act: 'tip', subject: g.phrase, verb: 'read',
            object: described('ore', g.quality, { bucket: ctx.bucket, det: 'none' }),
            where: whereFact(npc, ctx.bucket) }
        : { act: 'refuse',
            because: chooseFrom(['I do not cut rock', 'that is not my trade'],
                                `${ctx.bucket}:pNotMiner`) };
    }
  },
  {
    id: 'trade',
    match: /\b(buy|sell|price|rate|deal|trade|how much|cost|credits?)\b/i,
    topic: 'priceHaggle',
    build: (npc, ctx) => ({
      act: 'negotiate',
      object: holdFact(npc, ctx.bucket),
      price: priceFact(npc.askPrice, ctx.bucket)
    })
  },
  {
    id: 'cargo',
    match: /\b(carrying|cargo|hold|load|hauling|freight)\b/i,
    build: (npc, ctx) => ({
      act: 'inform',
      subject: 'I',
      agr: { person: 1, number: 'sg' },
      verb: 'have',
      object: holdFact(npc, ctx.bucket),
      frames: ['inform-svo']
    })
  },
  {
    id: 'danger',
    match: /\b(danger|threat|hostile|pirate|raider|safe|trouble|contacts?)\b/i,
    topic: 'contactCall',
    build: (npc, ctx) => {
      const threat = ctx.threatNear && ctx.threatNear(npc);
      return threat
        ? { act: 'warn', object: threatFact((ctx.threatCount && ctx.threatCount(npc)) || 1, ctx.bucket),
            where: whereFact(npc, ctx.bucket), urgent: true }
        : { act: 'report', negated: true,
            object: chooseFrom(['nothing on my sweep', 'the board is clear this side',
                                'quiet, and long may it last'], `${ctx.bucket}:pNoThreat`) };
    }
  },
  {
    id: 'route',
    match: /\b(lane|route|corridor|heading|which way|shortcut|leg|jump)\b/i,
    topic: 'routeAdvice',
    build: (npc, ctx) => ({
      act: 'tip',
      object: chooseFrom(['the inner leg, and not loaded', 'the long way this cycle',
                          'whichever one has a patrol on it'], `${ctx.bucket}:pRoute`),
      because: chooseFrom(['the corridor has been busy', 'the beacon net is patchy past the marker'],
                          `${ctx.bucket}:pRouteWhy`),
      frames: ['inform-verbless', 'inform-because', 'inform-contrast']
    })
  },
  {
    id: 'dock',
    match: /\b(dock|berth|pad|clearance|come alongside|station|ring)\b/i,
    topic: 'dockRequest',
    build: (npc, ctx) => (npc.isStation || role(npc, 'fort')
      ? { act: 'accept', register: 'formal',
          object: chooseFrom(['a berth on the inner ring', 'the marked approach', 'pad two'],
                             `${ctx.bucket}:pDock`) }
      : { act: 'inform',
          object: chooseFrom(['the ring handles its own traffic, not me',
                              'raise the station on the station band'], `${ctx.bucket}:pNotStation`) })
  },
  {
    id: 'help',
    match: /\b(help|mayday|assist|distress|i am (hit|hurt|damaged)|need (fuel|repair|a tow))\b/i,
    topic: 'askHelp',
    regard: +0.05,
    build: (npc, ctx) => {
      const willing = (ctx.regardForPlayer ? ctx.regardForPlayer(npc) : 0) > -0.3 && !badlyHurt(npc);
      return willing
        ? { act: 'accept', urgent: true,
            object: chooseFrom(['give me a bearing and I will come',
                                'hold what you have, I am turning',
                                'I can be on you inside the hour'], `${ctx.bucket}:pHelpYes`) }
        : { act: 'refuse', urgent: true, because: reasonFact(npc, ctx.bucket) };
    }
  },
  {
    id: 'offerHelp',
    match: /\b(need (a hand|anything)|can i help|want a hand|anything i can do)\b/i,
    regard: +0.2,
    build: (npc, ctx) => (hurt(npc) || lowFuel(npc)
      ? { act: 'request', object: needFact(npc, ctx.bucket), because: reasonFact(npc, ctx.bucket) }
      : { act: 'ack', object: chooseFrom(['nothing I cannot handle', 'I am square, but thanks for asking'],
                                         `${ctx.bucket}:pNoNeed`) })
  },
  {
    id: 'about-me',
    match: /\b(what do you (think|make) of me|do you know me|heard of me|my reputation)\b/i,
    build: (npc, ctx) => {
      const r = ctx.regardForPlayer ? ctx.regardForPlayer(npc) : 0;
      return {
        act: r > 0.3 ? 'inform' : r < -0.3 ? 'warn' : 'speculate',
        frames: ['inform-verbless', 'inform-contrast', 'speculate-guess', 'warn-declarative'],
        object: r > 0.3
          ? chooseFrom(['you have a name out here and it is a good one',
                        'people say you turn up when it counts'], `${ctx.bucket}:pRepGood`)
          : r < -0.3
            ? chooseFrom(['word travels, and yours did', 'I have heard what you do to people who slow down'],
                         `${ctx.bucket}:pRepBad`)
            : chooseFrom(['you are a hull and a squawk to me so far', 'nobody has said anything either way'],
                         `${ctx.bucket}:pRepNone`)
      };
    }
  },
  {
    id: 'gossip',
    match: /\b(who is|what do you (think|know) (of|about)|heard about|know anything about|word on)\b/i,
    topic: 'shareRumour',
    build: (npc, ctx) => {
      const c = ctx.thirdParty && ctx.thirdParty(npc, { name: 'player' });
      if (!c) return { act: 'refuse', because: 'I do not talk about people on an open band' };
      const good = ctx.regardBetween ? ctx.regardBetween(npc, c) > 0 : true;
      return {
        act: good ? 'inform' : 'warn',
        object: `${c.name} ${good
          ? chooseFrom(['has been straight with me', 'is worth talking to'], `${ctx.bucket}:pGossipGood`)
          : chooseFrom(['is light on the truth', 'does not settle what they owe'], `${ctx.bucket}:pGossipBad`)}`
      };
    }
  },
  {
    id: 'work',
    match: /\b(work|job|contract|hire|charter|haul for|escort)\b/i,
    topic: 'haulOffer',
    build: (npc, ctx) => (laden(npc) || role(npc, 'mine')
      ? { act: 'offer', object: holdFact(npc, ctx.bucket), where: whereFact(npc, ctx.bucket) }
      : { act: 'ask', object: chooseFrom(['what you are offering', 'the rate', 'the leg'],
                                         `${ctx.bucket}:pWorkAsk`) })
  },
  {
    id: 'smalltalk',
    match: /\b(how.s (it going|the shift)|busy|quiet|long shift|weather|bored)\b/i,
    topic: 'smallTalk',
    build: (npc, ctx) => ({
      act: 'complain',
      object: chooseFrom(['this shift has been the long kind',
                          'the belt is quiet enough to hear the hull tick',
                          'same picture on my board for an hour'], `${ctx.bucket}:pSmall`)
    })
  }
];

function confused(npc, ctx) {
  return {
    act: chooseFrom(['ask', 'inform'], `${ctx.bucket}:pConfusedAct`),
    object: chooseFrom(['that again — you were breaking up',
                        'nothing I can do about that from here',
                        'say again, slower'], `${ctx.bucket}:pConfused`),
    frames: ['inform-verbless', 'ask-tag', 'request-polite']
  };
}

export function parsePlayerLine(text) {
  const s = String(text || '').trim();
  if (!s) return null;
  for (const it of INTENTS) if (it.match.test(s)) return it;
  if (/\?\s*$/.test(s)) return INTENTS.find(i => i.id === 'status') || null;
  return null;
}

export function talkToNpc(npc, text, ctx = {}) {
  const intent = parsePlayerLine(text);
  const bucket = `player:${npc && npc.name}:${intent ? intent.id : 'none'}`;
  const inner = Object.assign({ bucket }, ctx);
  const rel = ctx.playerRel || { exchanges: 0, regard: 0 };

  let msg;
  try { msg = intent ? intent.build(npc, inner) : confused(npc, inner); }
  catch (e) { msg = confused(npc, inner); }

  const register = msg.register || registerOf(npc, intent && intent.hostile ? 'gruff' : null);
  const profile = profileFor(npc, register, {
    urgent: !!msg.urgent,
    familiarity: rel.exchanges || 0,
    hostile: !!(intent && intent.hostile) || (rel.regard || 0) < -0.3
  });

  const line = realise(Object.assign({ register, speaker: npc.name }, msg), {
    bucket, profile, rng: ctx.rng,
    vocative: null,
    signoff: !!(intent && intent.id === 'farewell')
  });

  return {
    text: line,
    intent: intent ? intent.id : null,
    understood: !!intent,
    regardDelta: (intent && intent.regard) || 0
  };
}

export const PLAYER_PROMPTS = [
  'Hello — this is the independent hull.',
  'What is your status?',
  'Anything on the ore out there?',
  'What are you carrying?',
  'Is the lane safe?',
  'What is your price?',
  'Need a hand with anything?',
  'What do you think of me?',
  'Heard about anyone worth knowing?',
  'Thanks for that.'
];

export const TARGET = {
  wordsPerUtterance: 14.6,
  turnsPerDialogue: 7.9,
  questionRate: 0.19,
  openingEntropy: 4.2,
  typeTokenRatio: 0.42,
  adjacencyCompletion: 0.85,
  source: 'DailyDialog aggregates (Li et al. 2017) plus conventional conversational figures'
};

let target = Object.assign({}, TARGET);
export const currentTarget = () => Object.assign({}, target);
export function fitTarget(profile) {
  if (!profile) return currentTarget();
  target = Object.assign({}, target, {
    wordsPerUtterance: profile.wordsPerUtterance,
    turnsPerDialogue: profile.turnsPerDialogue,
    questionRate: profile.questionRate,
    openingEntropy: profile.openingEntropy,
    typeTokenRatio: profile.typeTokenRatio,
    source: profile.source || 'supplied transcript'
  });
  return currentTarget();
}

export function parseTranscript(text) {
  const raw = String(text || '');
  if (!raw.trim()) return [];
  const dialogues = [];

  if (raw.includes('__eou__')) {
    for (const line of raw.split(/\r?\n/)) {
      const turns = line.split('__eou__').map(x => x.trim()).filter(Boolean);
      if (turns.length > 1) {
        dialogues.push(turns.map((t, i) => ({ speaker: `S${i % 2}`, text: t })));
      }
    }
    return dialogues;
  }

  let current = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) { if (current.length) { dialogues.push(current); current = []; } continue; }
    const m = /^([A-Z][\w '.-]{0,40}?)\s*[:>]\s*(.+)$/.exec(trimmed);
    if (m) current.push({ speaker: m[1], text: m[2] });
    else current.push({ speaker: `S${current.length % 2}`, text: trimmed });
  }
  if (current.length) dialogues.push(current);
  return dialogues;
}

const WORDS = s => String(s).toLowerCase().match(/[a-z']+/g) || [];
const QUESTION = /\?\s*$/;

function entropy(counts) {
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (!total) return 0;
  let h = 0;
  for (const n of counts.values()) {
    const p = n / total;
    if (p > 0) h -= p * Math.log2(p);
  }
  return h;
}

export function profileOf(dialogues, opts = {}) {
  const turns = [];
  for (const d of dialogues || []) for (const t of d) if (t && t.text) turns.push(t);
  if (!turns.length) return null;

  let words = 0, questions = 0;
  const openings = new Map();
  const types = new Set();
  const trigrams = new Map();
  let tokens = 0;

  const window = opts.sample || 2000;
  let seen = 0;

  for (const t of turns) {
    const w = WORDS(t.text);
    words += w.length;
    if (QUESTION.test(t.text)) questions++;
    if (tokens < window) {
      seen++;
      const first = (w[0] || '').toLowerCase();
      if (first) openings.set(first, (openings.get(first) || 0) + 1);
      for (const x of w) { types.add(x); tokens++; }
      for (let i = 0; i + 2 < w.length; i++) {
        const g = `${w[i]} ${w[i + 1]} ${w[i + 2]}`;
        trigrams.set(g, (trigrams.get(g) || 0) + 1);
      }
    }
  }

  let owed = 0, met = 0;
  for (const d of dialogues || []) {
    for (let i = 1; i < d.length; i++) {
      const prev = d[i - 1] && d[i - 1].move;
      const here = d[i] && d[i].move;
      if (!prev || !here) continue;
      if (prev !== 'question' && prev !== 'accusation' && prev !== 'directive') continue;
      owed++;
      if ((RESPONSE_OK[prev] || []).includes(here)) met++;
    }
  }

  const once = [...trigrams.values()].filter(n => n === 1).length;
  return {
    utterances: turns.length,
    dialogues: (dialogues || []).length,
    wordsPerUtterance: words / turns.length,
    turnsPerDialogue: turns.length / Math.max(1, (dialogues || []).length),
    questionRate: questions / turns.length,
    openingEntropy: entropy(openings),
    distinctOpenings: openings.size,
    typeTokenRatio: tokens ? types.size / tokens : 0,
    hapaxTrigramShare: trigrams.size ? once / trigrams.size : 0,
    adjacencyCompletion: owed ? met / owed : null,
    topOpenings: [...openings.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([w, n]) => [w, n / Math.max(1, seen)]),
    sampledUtterances: seen,
    source: opts.source || 'generated'
  };
}

export function compareProfiles(mine, against = target) {
  if (!mine) return [];
  const rows = [
    ['words per utterance', mine.wordsPerUtterance, against.wordsPerUtterance, 0.25, 'both'],
    ['turns per exchange', mine.turnsPerDialogue, against.turnsPerDialogue, 0.35, 'both'],
    ['question rate', mine.questionRate, against.questionRate, 0.4, 'both'],
    ['opening variety (bits)', mine.openingEntropy, against.openingEntropy, 0.2, 'floor'],
    ['lexical variety', mine.typeTokenRatio, against.typeTokenRatio, 0.3, 'floor']
  ];
  if (mine.adjacencyCompletion != null) {
    rows.push(['adjacency completion', mine.adjacencyCompletion, against.adjacencyCompletion, 0.1, 'floor']);
  }
  return rows.map(([name, got, want, tol, side]) => {
    const gap = want ? (got - want) / want : 0;
    const ok = Math.abs(gap) <= tol || (side === 'floor' && gap > 0);
    return {
      metric: name, got, want, gap,
      verdict: ok ? 'close enough' : (gap < 0 ? 'too little' : 'too much')
    };
  }).sort((a, b) => (Math.abs(b.gap) * (b.verdict === 'close enough' ? 0 : 1)) -
                    (Math.abs(a.gap) * (a.verdict === 'close enough' ? 0 : 1)));
}

export const CALIBRATION = {
  lengthLift: 0,
  codaLift: 0,
  questionLift: 0,
  fittedFrom: null
};

export function calibrate(profile, against = target) {
  if (!profile) return CALIBRATION;
  const rel = (got, want) => (want ? (got - want) / want : 0);
  const clamp = x => Math.max(-1, Math.min(1, x));

  CALIBRATION.lengthLift = clamp(-rel(profile.wordsPerUtterance, against.wordsPerUtterance) * 0.6);
  CALIBRATION.codaLift = clamp(-rel(profile.turnsPerDialogue, against.turnsPerDialogue) * 0.4);
  CALIBRATION.questionLift = clamp(-rel(profile.questionRate, against.questionRate) * 0.5);
  CALIBRATION.fittedFrom = {
    utterances: profile.utterances,
    words: +profile.wordsPerUtterance.toFixed(2),
    turns: +profile.turnsPerDialogue.toFixed(2),
    questions: +profile.questionRate.toFixed(3)
  };
  return CALIBRATION;
}

export function resetCalibration() {
  CALIBRATION.lengthLift = 0;
  CALIBRATION.codaLift = 0;
  CALIBRATION.questionLift = 0;
  CALIBRATION.fittedFrom = null;
  return CALIBRATION;
}

const CREW_ROLES = [
  { role: 'mine', faction: 'nexis', w: 4 },
  { role: 'haul', faction: 'nexis', w: 3 },
  { role: 'trade', faction: 'independent', w: 3 },
  { role: 'patrol', faction: 'coalition', w: 2 },
  { role: 'combat', faction: 'nexis', w: 1 },
  { role: 'salvage', faction: 'independent', w: 2 },
  { role: 'build', faction: 'nexis', w: 1 },
  { role: 'merc', faction: 'independent', w: 1 },
  { role: 'combat', faction: 'pirate', w: 1 }
];

const HULL_NAMES = {
  nexis: ['Nexis Drone', 'Bulk Hauler', 'Tessera Yard', 'Nexis Escort', 'Deepcut',
    'Sokolov', 'Meridian Lift', 'Anvil', 'Pale Vector', 'Groundswell', 'Kestrel Works',
    'Vantage', 'Hollow Point', 'Longwall', 'Marrow'],
  coalition: ['Coalition Patrol', 'Ostrava Watch', 'Charter Cutter', 'Writ of Passage',
    'Bailiff', 'Cordon', 'Ledger', 'Standing Order', 'Assay Officer', 'Waypoint Nine'],
  independent: ['Wandering Marl', 'Scrapper Vig', 'Halcyon', 'Free Cutter', 'Long Sil',
    'Ketch', 'Bad Arithmetic', 'Second Thought', 'Tin Rosary', 'Quiet Deal', 'Duster',
    'Nell Vantry', 'Old Cassiopeia', 'Two Sparrows', 'Margin Call', 'Salt Wren'],
  pirate: ['Red Kite', 'Nine Teeth', 'Ashfall', 'Carrion Wheel', 'Split Lip',
    'No Fixed Berth', 'Gallows Humour']
};

const PLACES = ['Kessel Deep', 'Ostrava Ring', 'the Boneyard', 'the second marker',
  'Tessera Shallows', 'the outer belt', 'Cinder Reach', 'the Fallow Drift',
  'Vachell Gap', 'the inner shoals', 'Harrow Point', 'the slow lane'];

const ANCHORS = [
  { name: 'Ostrava Ring', x: 700, y: 450, pull: 0.45 },
  { name: 'Kessel Deep', x: 240, y: 220, pull: 0.30 },
  { name: 'the Boneyard', x: 1180, y: 700, pull: 0.20 },
  { name: 'Harrow Point', x: 300, y: 780, pull: 0.20 },
  { name: 'Cinder Reach', x: 1240, y: 180, pull: 0.25 }
];

const polarise = x => (x < 0.4 ? x * 0.5 : x > 0.6 ? 1 - (1 - x) * 0.5 : x);

export function makeCrew(n = 24, rng = null) {
  const r = rng || stream('npc-speech-crew');
  const pool = CREW_ROLES.flatMap(c => Array(c.w).fill(c));
  const used = new Map();
  const out = [];
  for (let i = 0; i < n; i++) {
    const spec = pool[Math.floor(r.next() * pool.length)];
    const names = HULL_NAMES[spec.faction];
    const base = names[Math.floor(r.next() * names.length)];
    const count = (used.get(base) || 0) + 1;
    used.set(base, count);
    const name = count > 1 || /Drone|Hauler|Patrol|Escort|Yard|Cutter|Lift|Works/.test(base)
      ? `${base} ${String(count).padStart(2, '0')}` : base;
    const station = spec.role === 'build' && r.next() < 0.5;
    const anchor = ANCHORS[Math.floor(r.next() * ANCHORS.length)];
    const spread = 120 + r.next() * 260;
    out.push({
      home: anchor.name,
      taste: {
        words: [7, 12, 17][Math.floor(r.next() * 3)],
        hedges: polarise(r.next()),
        ceremony: polarise(r.next()),
        naming: polarise(r.next()),
        deference: polarise(r.next())
      },
      name,
      faction: spec.faction,
      role: spec.role,
      hp: Math.round(45 + r.next() * 55), maxHp: 100,
      cargo: Math.round(r.next() * 60), cargoMax: 60 + Math.round(r.next() * 140),
      fuel: Math.round(20 + r.next() * 80), fuelMax: 100,
      oreGrade: spec.role === 'mine' ? Math.round(r.next() * 100) / 100 : null,
      askPrice: 300 + Math.round(r.next() * 300),
      bidPrice: 240 + Math.round(r.next() * 200),
      task: station ? 'idle' : ['mine', 'haul', 'transit', 'patrol', 'work', 'idle'][Math.floor(r.next() * 6)],
      docked: station,
      nearestName: r.next() < 0.6 ? anchor.name : PLACES[Math.floor(r.next() * PLACES.length)],
      position: {
        x: Math.max(0, Math.min(1400, anchor.x + (r.next() - 0.5) * spread * 2)),
        y: Math.max(0, Math.min(900, anchor.y + (r.next() - 0.5) * spread * 2)),
        z: 0
      }
    });
  }
  const rings = [
    { name: 'Ostrava Ring', x: 700, y: 450, berths: 4 },
    { name: 'Harrow Point Yard', x: 300, y: 780, berths: 3 },
    { name: 'Cinder Reach Platform', x: 1240, y: 180, berths: 2 }
  ];
  for (const ring of rings.slice(0, n >= 18 ? 3 : 1)) {
    out.push({
      name: ring.name, faction: 'coalition', role: 'fort', isStation: true,
      hp: 900, maxHp: 900, task: 'idle', nearestName: ring.name, home: ring.name,
      position: { x: ring.x, y: ring.y, z: 0 }, berths: ring.berths
    });
  }
  return out;
}

const relKey = (a, b) => [a, b].sort().join('~');

export function createMemoryStore(opts = {}) {
  const perPair = opts.perPair || 120;
  const halfLife = opts.halfLife || 3600;
  const buckets = new Map();
  let total = 0;

  const bucketOf = (holder, subject, make = false) => {
    const k = `${holder}|${subject}`;
    let bk = buckets.get(k);
    if (!bk && make) {
      bk = { rows: [], types: new Set(), cache: null, cacheAt: -1e9 };
      buckets.set(k, bk);
    }
    return bk;
  };

  function consolidate(bk) {
    const half = Math.floor(bk.rows.length / 2);
    if (half < 2) return;
    const old = bk.rows.slice(0, half);
    const keep = bk.rows.slice(half);
    let weight = 0, at = 0, hearsay = 0;
    for (const r of old) {
      weight += r.weight * (r.hearsay ? 0.45 : 1);
      at += (r.at || 0);
      if (r.hearsay) hearsay++;
    }
    const merged = {
      holder: old[0].holder, subject: old[0].subject,
      type: 'earlier-dealings', topic: 'consolidated',
      weight, hearsay: false, at: Math.round(at / old.length), consolidated: old.length
    };
    bk.rows = [merged].concat(keep);
    bk.types = new Set(bk.rows.map(r => r.type));
    bk.cache = null;
    total -= (old.length - 1);
  }

  function push(m) {
    const bk = bucketOf(m.holder, m.subject, true);
    bk.rows.push(m);
    bk.types.add(m.type);
    bk.cache = null;
    total++;
    if (bk.rows.length > perPair) consolidate(bk);
    return m;
  }

  const list = (holder, subject, type = null) => {
    const bk = bucketOf(holder, subject);
    if (!bk) return [];
    return type ? bk.rows.filter(r => r.type === type) : bk.rows;
  };

  const has = (holder, subject, type) => {
    const bk = bucketOf(holder, subject);
    if (!bk) return false;
    return type ? bk.types.has(type) : bk.rows.length > 0;
  };

  function regard(holder, subject, now) {
    const bk = bucketOf(holder, subject);
    if (!bk) return 0;
    if (bk.cache !== null && Math.abs(now - bk.cacheAt) < 120) return bk.cache;
    let sum = 0;
    for (const m of bk.rows) {
      const decay = Math.exp(-(now - (m.at || 0)) / halfLife);
      sum += m.weight * (m.hearsay ? 0.45 : 1) * decay;
    }
    const v = Math.max(-3, Math.min(3, sum)) / 3;
    bk.cache = v; bk.cacheAt = now;
    return v;
  }

  const flat = () => {
    const out = [];
    for (const bk of buckets.values()) out.push(...bk.rows);
    return out;
  };

  return {
    push, list, has, regard, flat,
    get length() { return total; },
    get pairs() { return buckets.size; },
    filter: fn => flat().filter(fn),
    forEach: fn => { for (const bk of buckets.values()) bk.rows.forEach(fn); },
    map: fn => flat().map(fn),
    slice: (a, b) => flat().slice(a, b),
    clear: () => { buckets.clear(); total = 0; }
  };
}

export function createWorld(opts = {}) {
  const seed = opts.seed != null ? opts.seed : 1337;
  seedWorld(seed);
  const rng = stream('npc-speech-world');
  const units = opts.units || makeCrew(opts.crewSize || 20, rng);
  const rels = new Map();
  const memories = createMemoryStore({
    perPair: opts.memoryPerPair || 120,
    halfLife: opts.memoryHalfLife || 3600
  });
  const speech = createSpeechMemory({
    cap: opts.speechCap || 40000,
    priorWeight: opts.priorWeight || 4,
    historyCap: opts.historyCap || 20000
  });
  const log = [];
  const lastRaisedAt = new Map();
  const lastTopicOf = new Map();
  const obligations = [];
  let logCap = opts.logCap || 300;
  let t = 0;

  const rel = (a, b) => {
    const k = relKey(a.name, b.name);
    if (!rels.has(k)) rels.set(k, { exchanges: 0, regard: 0, owes: false, owed: false });
    return rels.get(k);
  };

  let lastLost = null;

  const playerRels = new Map();
  const playerRel = u => {
    if (!playerRels.has(u.name)) playerRels.set(u.name, { exchanges: 0, regard: 0 });
    return playerRels.get(u.name);
  };

  const nameOf = x => (x && x.name) ? x.name : x;

  const recall = (holder, subject, type = null) =>
    memories.list(nameOf(holder), nameOf(subject), type);

  const regardFrom = (holder, subject) => memories.regard(nameOf(holder), nameOf(subject), t);

  const worldCtx = (a, b) => Object.assign(worldCtxStock(a, b), opts.ground ? opts.ground(a, b) : null);
  const worldCtxStock = (a, b) => ({
    a, b,
    rel: rel(a, b),
    rng,
    learning: opts.learning !== false,
    speech,
    now: () => t,
    gossipThreshold: 0.8,
    playerRel: playerRel(a),

    lastRaised: (x, y, key) => {
      const at = lastRaisedAt.get(`${relKey(x.name, y.name)}:${key}`);
      return at == null ? null : t - at;
    },
    lastTopic: (x, y) => lastTopicOf.get(relKey(x.name, y.name)) || null,
    recallBetween: (x, y, type) => memories.has(nameOf(x), nameOf(y), type),
    recallDetail: (x, y) => {
      const rows = recall(x, y).filter(m => m.type !== 'spoke-with');
      if (!rows.length) return null;
      const pick = rows.slice().sort((p, q) => Math.abs(q.weight) - Math.abs(p.weight))[0];
      return { type: pick.type, topic: pick.topic, weight: pick.weight, ago: t - (pick.at || 0) };
    },

    warinessOf: u => Math.max(0, -regardFrom(u, 'player') * 3),
    regardForPlayer: u => regardFrom(u, 'player'),
    regardBetween: (x, y) => regardFrom(x, y),
    playerNear: () => !!opts.playerPresent,
    playerBearing: () => Math.round(rng.next() * 360),

    threatNear: u => units.some(o => o !== u && o.faction === 'pirate' && dist(o, u) < 500),
    threatCount: u => units.filter(o => o !== u && o.faction === 'pirate' && dist(o, u) < 500).length,
    threatBearing: () => Math.round(rng.next() * 360),
    hazardNear: u => !!u.hazard,
    beaconFault: u => !!u.beaconFault,
    trafficNear: u => units.filter(o => o !== u && dist(o, u) < 600).length,
    berthsFree: (u) => {
      const rings = units.filter(x => x.isStation);
      if (!rings.length) return 0;
      const near = rings.slice().sort((p, q) => dist(p, u || a) - dist(q, u || a))[0];
      return near.berths || 0;
    },

    askingPrice: u => u.askPrice,
    counterPrice: u => u.bidPrice,
    dealCloses: u => rng.next() < 0.6,
    wantsFight: u => u.faction === 'pirate' && rng.next() < 0.5,
    tipWasGood: (x, y) => rng.next() < 0.65,
    wasHonest: u => u.faction !== 'pirate' && rng.next() < 0.7,
    lostHull: () => lastLost,

    reception: (listener, text, move, frame) => {
      if (!listener || !text) return 0;
      const taste = listener.taste ||
        { words: 12, hedges: 0.5, ceremony: 0.5, deference: 0.5, naming: 0.5 };
      const words = text.split(/\s+/).length;
      let d = 0;

      const miss = Math.max(0, Math.abs(words - taste.words) - 3);
      d -= Math.min(0.45, miss * 0.045);

      const hedged = /\b(I think|near enough|give or take|I reckon|allegedly|so they tell me|maybe|unless I am reading it wrong|approximately|nominally)\b/i.test(text);
      if (hedged) d += (taste.hedges - 0.5) * 0.9;

      const ceremonial = /^(Be advised|Advising|For the record|Note that|Here is the thing|Tell you what|Right then|Listen|Look)/i.test(text) ||
        /\b(out|clear)\.$/i.test(text);
      if (ceremonial) d += (taste.ceremony - 0.5) * 0.9;

      const named = /,\s+[A-Z][a-z]+( \d\d)?[.?!]$/.test(text) || /^[A-Z][a-z]+( \d\d)?,/.test(text);
      if (named) d += (taste.naming - 0.5) * 0.8;

      if (move === 'directive') d += (taste.deference - 0.5) * 0.8;
      if (move === 'accusation') d -= 0.3 + (1 - taste.deference) * 0.4;

      return Math.max(-1.2, Math.min(1.2, d));
    },

    thirdParty: (x, y) => {
      const pool = units.filter(u => u !== x && u !== y && !u.isStation);
      return pool.length ? pool[Math.floor(rng.next() * pool.length)] : null;
    }
  });

  function commit(key, ctx, script) {
    const pairK = relKey(ctx.a.name, ctx.b.name);
    lastRaisedAt.set(`${pairK}:${key}`, t);
    lastTopicOf.set(pairK, key);

    const r = rel(ctx.a, ctx.b);
    r.exchanges++;

    for (const m of memoriesFrom(key, ctx)) {
      memories.push({
        holder: m.holder.name || m.holder,
        subject: m.subject === 'player' ? 'player' : (m.subject.name || m.subject),
        type: m.type, weight: m.weight, hearsay: m.hearsay, topic: m.topic, at: t
      });
    }
    r.regard = (regardFrom(ctx.a, ctx.b) + regardFrom(ctx.b, ctx.a)) / 2;

    const ob = obligationFrom(key, ctx, true);
    if (ob) obligations.push({ kind: ob.kind, from: ob.from.name, to: ob.to.name, topic: key, at: t });

    for (const line of script) {
      log.push({
        at: t, channel: TOPICS[key].channel, topic: key, move: line.move, frame: line.frame,
        speaker: line.speaker.name, listener: line.listener.name,
        text: line.text, turn: line.turn,
        register: registerOf(line.speaker, TOPICS[key].mood)
      });
    }
    while (log.length > logCap) log.shift();
  }

  function drift() {
    for (const u of units) {
      if (u.isStation) { u.berths = Math.max(0, Math.min(4, (u.berths || 2) + (rng.next() < 0.2 ? 1 : -1) * (rng.next() < 0.5 ? 1 : 0))); continue; }
      if (u.position) {
        u.position.x = Math.max(0, Math.min(1400, u.position.x + (rng.next() - 0.5) * 70));
        u.position.y = Math.max(0, Math.min(900, u.position.y + (rng.next() - 0.5) * 70));
        const home = ANCHORS.find(an => an.name === u.home);
        if (home) {
          u.position.x += (home.x - u.position.x) * 0.04;
          u.position.y += (home.y - u.position.y) * 0.04;
        }
      }
      if (u.cargoMax) {
        const rate = u.role === 'mine' ? 3 : u.role === 'haul' ? -2 : 0;
        u.cargo = Math.max(0, Math.min(u.cargoMax, (u.cargo || 0) + rate * rng.next() * 2));
      }
      if (u.fuelMax) u.fuel = Math.max(0, Math.min(u.fuelMax, u.fuel - rng.next() * 0.6));
      if (u.oreGrade != null && rng.next() < 0.05) u.oreGrade = Math.round(rng.next() * 100) / 100;
      if (rng.next() < 0.02) u.hazard = !u.hazard;
      if (rng.next() < 0.01) u.beaconFault = !u.beaconFault;
      if (rng.next() < 0.03) u.hp = Math.max(8, Math.min(u.maxHp, u.hp + (rng.next() - 0.4) * 20));
      if (u.hp <= 9 && rng.next() < 0.03) { lastLost = u.name; u.hp = Math.round(u.maxHp * 0.4); }
      if (rng.next() < 0.04) u.task = ['mine', 'haul', 'transit', 'patrol', 'work', 'idle'][Math.floor(rng.next() * 6)];
      if (rng.next() < 0.02) u.nearestName = PLACES[Math.floor(rng.next() * PLACES.length)];
    }
  }

  function tick(dt = 1, force = false) {
    t += dt;
    drift();

    const attempts = Math.max(1, opts.pairsPerTick || Math.ceil(units.length / 8));
    const produced = [];

    for (let i = 0; i < attempts; i++) {
      if (!force && rng.next() > (opts.chattiness || 0.35)) continue;

      const a = units[Math.floor(rng.next() * units.length)];
      const candidates = units.filter(u => u !== a && dist(u, a) < 900);
      if (!candidates.length) continue;
      const weighted = candidates.map(u => ({ u, w: 1 / (1 + dist(u, a) / 300) }));
      const total = weighted.reduce((sum, x) => sum + x.w, 0);
      let draw = rng.next() * total;
      let b = weighted[weighted.length - 1].u;
      for (const x of weighted) { draw -= x.w; if (draw <= 0) { b = x.u; break; } }

      const ctx = worldCtx(a, b);
      const key = chooseTopic(a, b, ctx);
      if (!key) continue;
      const script = exchange(key, ctx);
      if (!script.length) continue;
      commit(key, ctx, script);
      produced.push(...log.slice(-script.length));
      if (force) break;
    }
    return produced;
  }

  function fastForward(ticks = 1000, dt = 3) {
    const before = speech.size;
    let lines = 0;
    for (let i = 0; i < ticks; i++) lines += tick(dt).length;
    return { ticks, lines, phrasingsBefore: before, phrasingsAfter: speech.size, time: t };
  }

  function train(targetLines = 4000, trainOpts = {}) {
    const budgetMs = trainOpts.budgetMs || Infinity;
    const started = Date.now();
    const before = speech.advantageMean ? speech.advantageMean() : 0;
    const beforeReactions = speech.reactions;
    const keepLog = logCap;
    let lines = 0, ticks = 0;

    logCap = trainOpts.keepLog || 40;
    while (lines < targetLines) {
      lines += tick(trainOpts.dt || 3).length;
      ticks++;
      if (ticks % 64 === 0 && Date.now() - started > budgetMs) break;
    }
    logCap = keepLog;

    const after = speech.advantageMean ? speech.advantageMean() : 0;
    return {
      lines, ticks, ms: Date.now() - started,
      reactions: speech.reactions - beforeReactions,
      before, after, gain: after - before,
      phrasings: speech.size, priors: speech.priorCount,
      done: lines >= targetLines
    };
  }

  function dialogues() {
    const byExchange = new Map();
    for (const l of log) {
      const k = `${l.topic}:${l.at}:${[l.speaker, l.listener].sort().join('~')}`;
      if (!byExchange.has(k)) byExchange.set(k, []);
      byExchange.get(k).push({ speaker: l.speaker, text: l.text, move: l.move });
    }
    return [...byExchange.values()];
  }

  const transcript = () => dialogues()
    .map(d => d.map(t => `${t.speaker}: ${t.text}`).join('\n')).join('\n\n');

  const profile = () => profileOf(dialogues(), { source: `world ${seed}` });

  function selfTrain(linesPerRound = 8000, rounds = 2) {
    const history = [];
    const keepLog = logCap;
    logCap = 20000;
    for (let i = 0; i < rounds; i++) {
      train(linesPerRound, { keepLog: 20000 });
      const p = profile();
      const before = compareProfiles(p);
      calibrate(p);
      history.push({
        round: i + 1,
        profile: p,
        gaps: before,
        dials: Object.assign({}, CALIBRATION)
      });
    }
    train(Math.round(linesPerRound / 2), { keepLog: 20000 });
    const after = profile();
    logCap = keepLog;
    while (log.length > logCap) log.shift();
    return { history, after, gaps: compareProfiles(after), dials: Object.assign({}, CALIBRATION) };
  }

  function talk(nameOrUnit, text) {
    const npc = typeof nameOrUnit === 'string'
      ? units.find(u => u.name === nameOrUnit) : nameOrUnit;
    if (!npc) return null;
    const ctx = Object.assign(worldCtx(npc, npc), { playerRel: playerRel(npc) });
    const reply = talkToNpc(npc, text, ctx);
    const pr = playerRel(npc);
    pr.exchanges++;

    if (reply.regardDelta) {
      memories.push({
        holder: npc.name, subject: 'player', type: reply.regardDelta > 0 ? 'player-was-decent' : 'player-was-trouble',
        weight: reply.regardDelta * 4, hearsay: false, topic: `talk:${reply.intent}`, at: t
      });
      pr.regard = regardFrom(npc, 'player');
    }
    log.push({
      at: t, channel: 'direct', topic: `talk:${reply.intent || 'unparsed'}`,
      speaker: 'You', listener: npc.name, text, turn: 0, register: 'plain'
    });
    log.push({
      at: t, channel: 'direct', topic: `talk:${reply.intent || 'unparsed'}`,
      speaker: npc.name, listener: 'You', text: reply.text, turn: 1,
      register: registerOf(npc)
    });
    while (log.length > logCap) log.shift();
    return reply;
  }

  function whyRegard(holder, subject) {
    const h = typeof holder === 'string' ? holder : holder.name;
    const s = subject === 'player' ? 'player' : (subject.name || subject);
    return recall({ name: h }, s).map(m => ({
      type: m.type, weight: m.weight, hearsay: m.hearsay, topic: m.topic, ago: t - m.at
    })).sort((x, y) => Math.abs(y.weight) - Math.abs(x.weight));
  }

  return {
    get time() { return t; },
    seed, units, log, memories, obligations,
    rel, playerRel, regardFor: regardFrom, whyRegard, recall, train,
    dialogues, transcript, profile, selfTrain,
    speech,
    speechReport: (name, limit) => speech.report(typeof name === 'string' ? name : name && name.name, limit),
    tick, fastForward, talk, ctxFor: worldCtx,
    channels: () => [...new Set(log.map(l => l.channel))],
    stats: () => ({
      time: t, units: units.length, lines: log.length, memories: memories.length,
      obligations: obligations.length, pairs: rels.size, phrasings: speech.size,
      topics: topicStats(), grammar: grammarStats()
    })
  };
}

const PLAYER_BATTERY = [
  'hello there', 'hi', 'what is your status?', 'where are you?',
  'anything on the ore?', 'what grade is that seam?', 'what are you carrying?',
  'what is your price?', 'i want to buy your cargo', 'is the lane safe?',
  'any pirates around?', 'which way to the ring?', 'requesting a berth',
  'i need help, i am hit', 'need a hand with anything?', 'thanks for that',
  'sorry about earlier', 'hand over your cargo or else', 'you are useless',
  'what do you think of me?', 'heard about anyone worth knowing?',
  'how is the shift going?', 'got any work?', 'signing off, out.',
  '', '???', 'zzzzz', 'the quick brown fox', 'SELECT * FROM ships',
  'ore ore ore ore', 'help', '¿dónde estás?', '👋'
];

function checkPlayerTalk() {
  const bad = [];
  const w = createWorld({ seed: 4242, crewSize: 8, chattiness: 0 });
  for (const u of w.units) {
    for (const line of PLAYER_BATTERY) {
      let reply;
      try { reply = w.talk(u.name, line); }
      catch (e) { bad.push(`talk threw on ${JSON.stringify(line)} — ${e.message}`); continue; }
      if (!reply) { bad.push(`talk returned nothing for ${JSON.stringify(line)}`); continue; }
      if (!reply.text) { bad.push(`empty reply to ${JSON.stringify(line)} from ${u.name}`); continue; }
      const p = proof(reply.text);
      if (!p.ok) bad.push(`${u.name} [${reply.intent}] ${p.fatal}: ${JSON.stringify(reply.text)}`);
      else if (p.text !== reply.text) bad.push(`${u.name} unstable reply: ${JSON.stringify(reply.text)}`);
    }
  }
  const victim = w.units[0];
  const before = w.regardFor(victim, 'player');
  w.talk(victim.name, 'hand over your cargo or else');
  const after = w.regardFor(victim, 'player');
  if (!(after < before)) bad.push('threatening a ship did not lower its regard for the player');
  if (!w.whyRegard(victim, 'player').length) bad.push('regard changed with nothing on file to explain it');
  return [...new Set(bad)];
}

function checkWorld(ticks = 1500) {
  const bad = [];
  const w = createWorld({ seed: 99, crewSize: 10, chattiness: 1 });
  let lines = 0;
  const topics = new Set();
  for (let i = 0; i < ticks; i++) {
    let out;
    try { out = w.tick(3); } catch (e) { bad.push(`tick threw — ${e.message}`); break; }
    for (const l of out) {
      lines++;
      topics.add(l.topic);
      const p = proof(l.text);
      if (!p.ok) bad.push(`${l.topic} [${l.speaker}] ${p.fatal}: ${JSON.stringify(l.text)}`);
      if (!l.channel || !l.speaker || !l.listener) bad.push(`${l.topic}: log line missing routing fields`);
    }
  }
  let prev = null;
  for (const l of w.log) {
    if (l.move) {
      const wrong = checkMove(l.text, l.move, {});
      if (wrong) bad.push(`${l.topic}: ${l.move} — ${wrong} — ${JSON.stringify(l.text)}`);
    }
    if (prev && prev.topic === l.topic && l.turn === prev.turn + 1 && prev.move && l.move &&
        !(RESPONSE_OK[prev.move] || []).includes(l.move)) {
      bad.push(`${l.topic}: ${l.move} does not answer ${prev.move}`);
    }
    prev = l;
  }

  const learned = w.speechReport(null, 400);
  if (!learned.rows) bad.push('nobody recorded a single phrasing');
  else if (!learned.best.some(r => r.mean !== 0)) bad.push('phrasings were recorded but no reaction was ever credited');
  else if (!learned.best.some(r => r.tries > 1)) bad.push('no phrasing was ever tried twice, so nothing can be learned from');

  if (!lines) bad.push('a world left running produced no traffic at all');
  if (topics.size < 8) bad.push(`only ${topics.size} distinct topics fired over ${ticks} ticks`);
  if (!w.memories.length) bad.push('conversations left no memory behind');
  const spread = w.units.map(u => Math.abs(w.regardFor(u, w.units[(w.units.indexOf(u) + 1) % w.units.length])));
  if (!spread.some(x => x > 0.01)) bad.push('no relationship developed any regard in either direction');
  const recent = w.log.slice(-40).map(l => l.topic);
  if (new Set(recent).size < 3) bad.push('the last forty transmissions covered fewer than three topics');
  return { bad: [...new Set(bad)], lines, topics: topics.size, memories: w.memories.length };
}

function checkLearning(seeds = [12, 44], lines = 25000) {
  const bad = [];
  const gains = [];
  for (const seed of seeds) {
    const arm = learning => {
      const w = createWorld({ seed, crewSize: 20, chattiness: 1, learning, logCap: 40 });
      w.train(lines);
      return w.speech.feltMean();
    };
    const control = arm(false);
    const learned = arm(true);
    gains.push(learned - control);
  }
  const mean = gains.reduce((a, b) => a + b, 0) / gains.length;
  const floor = lines >= 30000 ? 0.018 : 0.008;
  if (mean < floor) bad.push(`training barely improved delivery (mean gain ${mean.toFixed(4)}, floor ${floor})`);
  if (gains.some(g => g < -0.01)) bad.push(`training made delivery worse on at least one seed (${gains.map(g => g.toFixed(4)).join(', ')})`);
  return { bad, gains, mean };
}

function checkScale(crew = 32, lines = 12000) {
  const bad = [];
  const w = createWorld({ seed: 5150, crewSize: crew, chattiness: 1, logCap: 60 });
  const started = Date.now();
  const r = w.train(lines);
  const ms = Date.now() - started;
  if (!r.done) bad.push('the trainer did not reach its line target');
  if (ms / r.lines > 2) bad.push(`generation is too slow to train with: ${(ms / r.lines).toFixed(2)}ms per line`);

  let worst = 0;
  for (const u of w.units) for (const v of w.units) {
    if (u === v) continue;
    worst = Math.max(worst, w.recall(u, v).length);
  }
  if (worst > 200) bad.push(`a single pair holds ${worst} memories — consolidation is not firing`);
  const store = createMemoryStore({ perPair: 40, halfLife: 1e9 });
  let pushed = 0;
  for (let i = 0; i < 400; i++) {
    store.push({ holder: 'A', subject: 'B', type: 'gave-tip', weight: 0.5, hearsay: false, at: i });
    pushed += 0.5;
  }
  const held = store.list('A', 'B').length;
  if (held > 40) bad.push(`consolidation did not bound a pair: ${held} rows against a cap of 40`);
  if (!store.list('A', 'B').some(m => m.type === 'earlier-dealings')) bad.push('consolidation left no summary row');
  if (store.regard('A', 'B', 400) < 0.99) bad.push('consolidation lost the weight it was holding');
  if (store.has('A', 'B', 'gave-tip') !== true) bad.push('consolidation lost the type index');

  const speakers = new Set(w.log.map(l => l.speaker));
  if (speakers.size < 4) bad.push('a crew of thirty produced traffic from almost nobody');
  return { bad, ms, lines: r.lines, perLine: ms / r.lines, memories: w.memories.length, worstPair: worst };
}

function checkCorpus() {
  const bad = [];

  const named = parseTranscript('A: hello there\nB: hello yourself\n\nA: again\nB: again');
  if (named.length !== 2 || named[0].length !== 2) bad.push('named-speaker transcripts did not parse');
  const eou = parseTranscript('hello __eou__ hi __eou__ how are you __eou__');
  if (eou.length !== 1 || eou[0].length !== 3) bad.push('__eou__ transcripts did not parse');
  if (parseTranscript('').length) bad.push('an empty transcript produced dialogues');

  const short = profileOf(parseTranscript('A: one two three four\nB: five six seven eight'));
  if (!short || Math.abs(short.wordsPerUtterance - 4) > 0.01) bad.push('word counting is wrong');
  if (short.questionRate !== 0) bad.push('question detection fired on statements');
  const asked = profileOf(parseTranscript('A: are you there?\nB: yes'));
  if (Math.abs(asked.questionRate - 0.5) > 0.01) bad.push('question detection missed a question');

  const big = [], small = [];
  for (let i = 0; i < 400; i++) big.push([{ speaker: 'A', text: `line number ${i} of the log` }]);
  for (let i = 0; i < 40; i++) small.push([{ speaker: 'A', text: `line number ${i} of the log` }]);
  const pb = profileOf(big), ps = profileOf(small);
  if (Math.abs(pb.typeTokenRatio - ps.typeTokenRatio) > 0.25) {
    bad.push(`lexical variety is sample-size dependent: ${ps.typeTokenRatio.toFixed(2)} vs ${pb.typeTokenRatio.toFixed(2)}`);
  }

  resetCalibration();
  const w = createWorld({ seed: 808, crewSize: 16, chattiness: 1 });
  const r = w.selfTrain(4000, 2);
  const first = r.history[0].profile.turnsPerDialogue;
  const last = r.after.turnsPerDialogue;
  if (!(last > first)) bad.push(`calibration did not lengthen exchanges (${first.toFixed(2)} -> ${last.toFixed(2)})`);
  if (!CALIBRATION.fittedFrom) bad.push('calibration recorded nothing about what it was fitted from');
  resetCalibration();
  return bad;
}

export function runSpeechSelfTest(opts = {}) {
  const { verbose = true } = opts;
  const failures = [];
  let pass = 0;

  const g = runGrammarSelfTest({ verbose: false, iterations: opts.iterations || 1500 });
  if (g.fail) failures.push(...g.failures.map(f => `grammar: ${f}`)); else pass++;

  const t = runTopicSelfTest({ verbose: false, perTopic: opts.perTopic || 25 });
  if (t.fail) failures.push(...t.failures.map(f => `topics: ${f}`)); else pass++;

  const p = checkPlayerTalk();
  if (p.length) failures.push(...p.map(f => `player: ${f}`)); else pass++;

  const w = checkWorld(opts.ticks || 1500);
  if (w.bad.length) failures.push(...w.bad.map(f => `world: ${f}`)); else pass++;

  const sc = checkScale(opts.crew || 32, opts.scaleLines || 12000);
  if (sc.bad.length) failures.push(...sc.bad.map(f => `scale: ${f}`)); else pass++;

  const cp = checkCorpus();
  if (cp.length) failures.push(...cp.map(f => `corpus: ${f}`)); else pass++;

  const ln = opts.skipLearning ? { bad: [], gains: [], mean: 0 }
    : checkLearning(opts.learnSeeds || [12, 44], opts.learnLines || 25000);
  if (ln.bad.length) failures.push(...ln.bad.map(f => `learning: ${f}`)); else pass++;

  const report = {
    pass, fail: failures.length, failures,
    grammar: { pass: g.pass, fail: g.fail, variety: g.variety.distinct },
    topics: { pass: t.pass, fail: t.fail, lines: t.linesChecked },
    world: { lines: w.lines, topics: w.topics, memories: w.memories },
    scale: { lines: sc.lines, perLine: +sc.perLine.toFixed(3), memories: sc.memories, worstPair: sc.worstPair },
    learning: { gains: ln.gains.map(g => +g.toFixed(4)), mean: +ln.mean.toFixed(4) }
  };
  if (verbose && typeof console !== 'undefined') {
    console.log(`npc-speech self-test: ${pass}/7 groups passed, ${failures.length} failures`);
    for (const f of failures.slice(0, 25)) console.log('  ✗ ' + f);
    console.log(`  grammar ${g.pass} cases · topics ${t.linesChecked} lines · world ${w.lines} lines, ${w.topics} topics, ${w.memories} memories`);
    console.log(`  scale ${sc.lines} lines at ${sc.perLine.toFixed(2)}ms each, ${sc.memories} memories, worst pair ${sc.worstPair}`);
    console.log(`  learning gain vs control: ${ln.gains.map(x => (x > 0 ? '+' : '') + x.toFixed(4)).join(', ')} (mean ${ln.mean.toFixed(4)})`);
  }
  return report;
}

if (typeof window !== 'undefined') {
  window.npcSpeech = {
    realise, realiseAll, speak, proof, isWellFormed, LEX, FRAMES, REGISTERS,
    resetGrammarMemory, serialiseGrammarMemory, restoreGrammarMemory, grammarStats, varietyOf,
    quantity, described, place, timeRef, bearing, phonetic, shortName, listOf, combine,
    TOPICS, TOPIC_KEYS, CHANNELS, utter, exchange, availableTopics, chooseTopic, scoreTopic,
    memoriesFrom, obligationFrom, topicStats, sampleTraffic,
    talkToNpc, parsePlayerLine, INTENTS, PLAYER_PROMPTS, createWorld, makeCrew,
    parseTranscript, profileOf, compareProfiles, calibrate, fitTarget, currentTarget,
    resetCalibration, CALIBRATION, TARGET,
    runSpeechSelfTest, runGrammarSelfTest, runTopicSelfTest
  };
}
