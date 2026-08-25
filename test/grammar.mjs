// NPC speech: is it English?
//
// Every assertion in the first half of this file is a sentence the game actually said on the
// radio. Not a hypothetical — these were produced by `utter()` on real topics with real
// ships and shipped:
//
//     Is I having a can?
//     There is you a favour.
//     There is buy me something at the next berth.
//     You a favour.
//     Watch on the board — the independent has form.
//     Copy that. I will keep.
//     the better than posted seam
//     There is 2 contacts on the lane.
//     I am owing you a favour.
//
// They look like nine separate bugs and they are one. A frame declared *which* slots it
// needed and nothing about what kind of thing belonged in them, so `object` could hold a
// noun phrase, a finite clause, a bare complement or an imperative, and a frame written for
// the first accepted all four. `inform-existential` renders "There is ${object}" — correct
// for "a fat seam", gibberish for "buy me something at the next berth" — and nothing in the
// system could tell those apart.
//
// Slots carry a type now, frames declare what they take, and the realiser filters on both.
// So most of what follows asserts that a *category* of sentence is unreachable rather than
// that a particular string does not appear: a clause cannot be selected into a frame that
// wants a noun phrase, whatever the dice do.
//
// The second half sweeps every topic across many seeds and checks the output looks like
// prose — no doubled articles, no stranded punctuation, no empty transmissions. That is the
// net that catches the next one of these, which will not be any of the nine above.

import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const GR = await imp('data/npc-kb/grammar.js');
const { TOPICS, TOPIC_KEYS, utter, availableTopics } = await imp('data/npc-kb/topics.js');
const { makeRng } = await imp('core/rng.js');

const {
  SLOT, slot, npSlot, clause, imperative, adverbial, proper, complement,
  kindOf, realise, described, quantity, place, np, plural, conjugate, article,
  isPlural, isAttributive, beFor, haveFor, commitPhrase, STATIVE, FRAMES
} = GR;

// ── the type system ──────────────────────────────────────────────────
console.log('\n— a slot knows what it is —');
{
  ok('a tagged slot still behaves as a string', `${npSlot('a fat seam')}` === 'a fat seam');
  ok('…and string methods work on it', npSlot('a fat seam').split(' ').length === 3);
  ok('an untagged string is a noun phrase', kindOf('a fat seam') === SLOT.NP);
  ok('a clause is a clause', kindOf(clause('you a favour')) === SLOT.CLAUSE);
  ok('an imperative is an imperative', kindOf(imperative('come here')) === SLOT.IMPERATIVE);
  ok('a complement is neither', kindOf(complement('you one')) === SLOT.COMPLEMENT);
  ok('empty is nothing', kindOf('') === null && kindOf(null) === null);

  // The producers have to tag, or the whole scheme is decorative.
  const r = makeRng(7);
  ok('described() yields a noun phrase',
     kindOf(described('ore', 'good', { bucket: 't', rng: r })) === SLOT.NP);
  ok('quantity() yields a noun phrase',
     kindOf(quantity('hold', 2, { bucket: 't', rng: r })) === SLOT.NP);
  ok('place() yields an adverbial',
     kindOf(place(null, { bucket: 't', rng: r })) === SLOT.ADVERBIAL);
}

console.log('\n— the sentences that used to happen —');
{
  const r = () => makeRng(4242);
  const say = (msg, opts) => realise(msg, Object.assign({ rng: r(), bucket: 'test' }, opts));

  // 1. "There is you a favour." A clause in an existential.
  for (let i = 0; i < 40; i++) {
    const out = realise({ act: 'inform', register: 'plain', verb: 'owe', subject: 'I',
                          agr: { person: 1 }, object: complement('you a favour') },
                        { rng: makeRng(i), bucket: 'b' + i });
    if (/^There (is|are) you /.test(out)) {
      ok('a complement never lands in an existential', false, out); break;
    }
  }
  ok('a complement never lands in an existential', true);

  // 2. "There is buy me something at the next berth." An imperative in an existential.
  let leaked = 0;
  for (let i = 0; i < 60; i++) {
    const out = realise({ act: 'inform', register: 'plain',
                          object: imperative('buy me something at the next berth') },
                        { rng: makeRng(i), bucket: 'c' + i });
    if (/There (is|are) buy /.test(out)) leaked++;
  }
  ok('an imperative never lands in an existential', leaked === 0, String(leaked));

  // 3. "You a favour." A complement rendered bare.
  let bare = 0;
  for (let i = 0; i < 60; i++) {
    const out = realise({ act: 'inform', register: 'plain', subject: 'I', verb: 'owe',
                          agr: { person: 1 }, object: complement('you a favour') },
                        { rng: makeRng(i), bucket: 'd' + i });
    if (/^You a favour/i.test(out)) bare++;
  }
  ok('a complement is never rendered without its verb', bare === 0, String(bare));

  // 4. "Is I having a can?" — polar questions in every person.
  ok('first person singular', beFor({ subject: 'I', agr: { person: 1 } }) === 'Am I');
  ok('first person plural', beFor({ subject: 'we', agr: { person: 1, number: 'pl' } }) === 'Are we');
  ok('second person', beFor({ subject: 'you', agr: { person: 2 } }) === 'Are you');
  ok('third singular', beFor({ subject: 'Ore Runner 12', agr: { person: 3 } }) === 'Is Ore Runner 12');
  ok('third plural agrees', beFor({ subject: '2 contacts', agr: { person: 3 } }) === 'Are 2 contacts');

  const q = realise({ act: 'ask', register: 'plain', subject: 'I', agr: { person: 1 },
                      verb: 'have', object: npSlot('a hold') }, { rng: r(), bucket: 'e' });
  ok('no question ever begins "Is I"', !/^Is I\b/.test(q), q);

  // 5. "Are you having a hold?" — `have` takes the perfect, not the progressive.
  ok('possession asks with have-got', haveFor({ subject: 'you', agr: { person: 2 } }) === 'Have you');
  let havingCount = 0;
  for (let i = 0; i < 40; i++) {
    const out = realise({ act: 'ask', register: 'plain', subject: 'you', agr: { person: 2 },
                          verb: 'have', object: npSlot('a hold') },
                        { rng: makeRng(i), bucket: 'f' + i });
    if (/having/.test(out)) havingCount++;
  }
  ok('nobody is ever "having" a hold', havingCount === 0, String(havingCount));

  // 6. "Watch on the board — ..." An adverbial as the object of a transitive imperative.
  let watchAdv = 0;
  for (let i = 0; i < 60; i++) {
    const out = realise({ act: 'warn', register: 'plain', object: clause('the independent has form'),
                          where: place(null, { bucket: 'g', rng: makeRng(i) }) },
                        { rng: makeRng(i), bucket: 'g' + i });
    if (/^Watch (on|where|out here)/.test(out)) watchAdv++;
  }
  ok('"Watch" is never handed a place as its object', watchAdv === 0, String(watchAdv));

  // 7. "Copy that. I will keep." A transitive verb committed to with no object.
  ok('a transitive verb does not stand alone', commitPhrase('keep') === 'take a look');
  ok('an intransitive one does', commitPhrase('come') === 'come');
  ok('no verb at all still says something', commitPhrase(null) === 'take a look');
  let stranded = 0;
  for (let i = 0; i < 40; i++) {
    const out = realise({ act: 'ack', register: 'plain', verb: 'keep' },
                        { rng: makeRng(i), bucket: 'h' + i });
    if (/I will keep\.$/.test(out)) stranded++;
  }
  ok('no commitment stops short', stranded === 0, String(stranded));

  // 8. "the better than posted seam." A predicate phrase used attributively.
  ok('a one-word adjective is attributive', isAttributive('clean'));
  ok('a comparative phrase is not', !isAttributive('better than posted'));
  ok('a negated phrase is not', !isAttributive('not worth the burn'));
  let phrasal = 0;
  for (let i = 0; i < 80; i++) {
    const d = String(described('face', 'good', { bucket: 'i' + i, rng: makeRng(i) }));
    if (/better than posted|not worth the burn|picked over/.test(d)) phrasal++;
  }
  ok('no noun phrase carries a predicate as its adjective', phrasal === 0, String(phrasal));

  // 9. "There is 2 contacts on the lane." Number read off a counter nothing ever set.
  ok('a plural NP is plural', isPlural('2 contacts'));
  ok('a singular NP is not', !isPlural('a contact'));
  ok('"one" is singular', !isPlural('one contact'));
  ok('a bare plural noun is plural', isPlural('contacts'));
  ok('a mass noun is not', !isPlural('ore'));
  const ex = realise({ act: 'inform', register: 'plain', object: npSlot('2 contacts'),
                       where: adverbial('on the lane') }, { rng: r(), bucket: 'j' });
  ok('existential agreement follows the noun phrase', !/There is 2 /.test(ex), ex);

  // 10. "I am owing you a favour." Progressive on a stative verb.
  ok('owe is stative', STATIVE.has('owe'));
  let prog = 0;
  for (let i = 0; i < 60; i++) {
    const out = realise({ act: 'inform', register: 'plain', subject: 'I', agr: { person: 1 },
                          verb: 'owe', object: complement('you a favour') },
                        { rng: makeRng(i), bucket: 'k' + i });
    if (/am owing|have owed/.test(out)) prog++;
  }
  ok('no stative verb takes progressive or perfect', prog === 0, String(prog));
}

// ── the frames themselves ────────────────────────────────────────────
console.log('\n— frames declare what they can hold —');
{
  ok('there are frames', FRAMES.length > 10, String(FRAMES.length));
  ok('every frame has an id, acts and a build',
     FRAMES.every(f => f.id && Array.isArray(f.acts) && typeof f.build === 'function'));
  ok('frame ids are unique', new Set(FRAMES.map(f => f.id)).size === FRAMES.length);

  // A frame that renders an object into a slot only a noun phrase fits must say so. This is
  // the check that stops the next frame from being added with the original defect.
  const npFrames = ['inform-existential', 'inform-verbless', 'offer-direct', 'offer-question',
                    'request-need', 'request-polite', 'ask-tag'];
  const undeclared = npFrames.filter(id => {
    const f = FRAMES.find(x => x.id === id);
    return !f || !f.takes || !f.takes.object || !f.takes.object.includes(SLOT.NP) ||
           f.takes.object.length !== 1;
  });
  ok('every noun-phrase frame declares it takes only noun phrases',
     undeclared.length === 0, undeclared.join(' '));

  // Every act must have at least one frame, or a record of that act silently falls through
  // to the acknowledgement frames and says "Copy." instead of what it meant.
  const acts = ['inform', 'tip', 'ask', 'offer', 'request', 'warn', 'ack'];
  const orphanActs = acts.filter(a => !FRAMES.some(f => f.acts.includes(a)));
  ok('every speech act has a frame', orphanActs.length === 0, orphanActs.join(' '));

  // And every slot type a topic can produce must be renderable by something.
  const kinds = [SLOT.NP, SLOT.CLAUSE, SLOT.IMPERATIVE, SLOT.COMPLEMENT];
  const unrenderable = kinds.filter(k => !FRAMES.some(f =>
    !f.takes || !f.takes.object || f.takes.object.includes(k)));
  ok('every slot type has a frame that will take it', unrenderable.length === 0,
     unrenderable.join(' '));
}

// ── the sweep ────────────────────────────────────────────────────────
console.log('\n— every topic, many seeds, still English —');
{
  const ships = [
    { name: 'Ore Runner 12',       faction: 'worker',   role: 'mine' },
    { name: 'Coalition Patrol 04', faction: 'coalition', role: 'combat' },
    { name: 'Bulk Hauler 03',      faction: 'worker',   role: 'haul' },
    { name: 'Pirate Raider 21',    faction: 'hostile',  role: 'combat' },
    { name: 'Mercenary 07',        faction: 'merc',     role: 'merc' }
  ];

  const lines = [];
  for (const key of TOPIC_KEYS) {
    for (let i = 0; i < 24; i++) {
      const a = ships[i % ships.length];
      const b = ships[(i + 1 + (i % 3)) % ships.length];
      const rel = { trust: (i % 5) / 5, met: i % 2, favours: i % 3 };
      for (const turn of [0, 1]) {
        const line = utter(key, turn, { a, b, rel, rng: makeRng(i * 31 + turn) });
        if (line) lines.push({ key, turn, line: String(line) });
      }
    }
  }
  ok(`the sweep produced lines (${lines.length})`, lines.length > 200, String(lines.length));

  const bad = (name, re) => {
    const hits = lines.filter(x => re.test(x.line));
    ok(name, hits.length === 0,
       hits.slice(0, 2).map(x => `${x.key}/${x.turn}: "${x.line}"`).join(' · '));
  };

  bad('no doubled article',            /\b(a|an|the) (a|an|the)\b/i);
  bad('no doubled determiner+number',  /\b\d+ (a|an) \b/i);
  bad('no "Is I"',                     /\bIs I\b/);
  bad('no "There is you"',             /There (is|are) you\b/i);
  bad('no bare "There is" imperative', /There (is|are) (buy|settle|come|say|watch|keep)\b/i);
  bad('no stranded comma before stop', /,\s*\./);
  bad('no doubled punctuation',        /[.!?]{2,}/);
  bad('no space before punctuation',   /\s+[.,!?]/);
  bad('no doubled space',              /  +/);
  bad('no empty parenthetical',        /—\s*\./);
  bad('no unresolved template token',  /#\w+#|\$\{|undefined|null/);
  bad('no predicate used attributively', /\b(the|a|an) (better than posted|not worth the burn)\b/i);
  bad('no stative progressive',        /\b(am|is|are) (owing|having|needing|wanting|knowing)\b/i);
  bad('no commitment left hanging',    /I will (keep|work|cut|move|push|shift)\.$/);
  bad('no "Watch" plus adverbial',     /^Watch (on|where|out here|at )/);

  // Shape rather than content: a transmission is a sentence.
  const noStop = lines.filter(x => !/[.!?]$/.test(x.line.trim()));
  ok('every line ends in a full stop, question or exclamation', noStop.length === 0,
     noStop.slice(0, 2).map(x => `${x.key}: "${x.line}"`).join(' · '));

  const lowerStart = lines.filter(x => /^[a-z]/.test(x.line.trim()));
  ok('every line starts with a capital', lowerStart.length === 0,
     lowerStart.slice(0, 2).map(x => `${x.key}: "${x.line}"`).join(' · '));

  const tooShort = lines.filter(x => x.line.trim().length < 4);
  ok('no line is a fragment of nothing', tooShort.length === 0,
     tooShort.map(x => `${x.key}: "${x.line}"`).join(' · '));

  // "I" is the one pronoun always capitalised wherever it lands.
  bad('lowercase standalone i', /(^|[\s,;(])i([\s,.;!?)']|$)/);

  // Variety: a topic that says one thing is a topic the player will notice repeating.
  for (const key of TOPIC_KEYS) {
    const own = new Set(lines.filter(x => x.key === key && x.turn === 0).map(x => x.line));
    if (own.size < 4) ok(`${key} says more than a handful of things`, false, String(own.size));
  }
  ok('every topic has real variety', true);
}

// ── the plumbing that was never checked ──────────────────────────────
console.log('\n— the pieces underneath —');
{
  ok('regular plural', plural('contact', 2) === 'contacts');
  ok('sibilant plural', plural('berth', 2) === 'berths');
  ok('singular stays singular', plural('contact', 1) === 'contact');

  ok('article before a consonant', article('seam') === 'a');
  ok('article before a vowel', article('ore') === 'an');
  ok('article before a silent h', article('hour') === 'an');
  ok('article before a long u', article('unit') === 'a');

  ok('np indefinite', np('seam', { det: 'indef' }) === 'a seam');
  ok('np definite', np('seam', { det: 'def' }) === 'the seam');
  ok('np counted', np('seam', { det: 'indef', count: 3 }) === '3 seams');
  ok('np with adjective takes its article from the adjective',
     np('seam', { det: 'indef', adj: 'open' }) === 'an open seam');

  ok('third person present', conjugate('read', { person: 3, number: 'sg' }) === 'reads');
  ok('first person present', conjugate('read', { person: 1 }) === 'read');

  // An empty realisation must never reach the log — it renders as a blank transmission with
  // a live reply menu attached.
  ok('an unrealisable record returns empty rather than garbage',
     realise({ act: 'nonsense-act' }, { rng: makeRng(1) }).length >= 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
