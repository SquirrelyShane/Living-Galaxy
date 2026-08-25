// Living Galaxy — what NPCs talk to each other about.
//
// A topic is not a line of dialogue. It is a *reason two characters would open a channel*,
// the conditions under which that reason exists, and — the part that matters — what each of
// them still knows afterwards.
//
// That last clause is the whole design constraint. It would be easy to build NPC chat as a
// presentation feature: pick two ships in range, print a plausible line, done. That is a
// screensaver. A topic earns its place here only if the exchange leaves state behind that
// outlives it, so every entry declares `filesFrom` and `filesTo`: the memory each side
// carries away, with the *other character* as the subject.
//
// Declared as data for the same reason the ammunition feeds are: a table with a `when`
// clause beats a switch statement that has to be edited to add a kind of conversation.
//
// ── fields ───────────────────────────────────────────────────────────
//   channel    which comms band it goes out on — the player can overhear it there
//   weight     relative likelihood when several topics are available
//   cooldown   seconds before the same pair may raise the same topic again
//   when(a, b) both sides' userData; true if this exchange makes sense right now
//   lines      [openerFn, replyFn] — each gets { a, b, rel } and returns a string
//   filesFrom  memory the *speaker* keeps, subject = the other character
//   filesTo    memory the *listener* keeps, subject = the speaker
//
// `rel` is the relationship record from systems/npc-comms.js: how many times these two have
// spoken and what they think of each other. It is passed to the line functions so a
// hundredth exchange between two familiar ships does not read like a first contact — which
// is the difference between a radio and a tape loop.

import { realise, quantity, described, place, registerOf, chooseFrom } from './npc-grammar.js';

// ── from templates to meaning ────────────────────────────────────────
//
// Every topic used to carry `lines: [openerFn, replyFn]`, and each of those returned a
// fixed string with the names dropped in. Nine topics, eighteen sentences, and a pilot on
// the trade band heard the loop close inside ten minutes. Writing more of them was never
// the fix: a hand-written line has no axis to vary along, so the twentieth buys forty
// seconds and the problem is unchanged.
//
// A topic now declares `say: [openerFn, replyFn]` where each returns a *semantic record* —
// an act, and the facts it concerns — which `data/npc-grammar.js` realises into a sentence.
// The information is fixed and the wording is generated, so the same tip passed twice is
// the same tip in two different sentences.
//
// `lines` is still read as a fallback for any topic that has not been converted, so this
// is additive rather than a rewrite of every entry at once.

/**
 * A stable bucket for the anti-repetition memory: this speaker, on this topic.
 *
 * Speaker-scoped so a character does not repeat *itself*, which is the common case. It is
 * not enough on its own: the opener and the reply of one exchange are spoken by different
 * characters, so they draw from different buckets and can land on the same phrase back to
 * back. That produced this, verbatim, on the local channel:
 *
 *   NEXIS DRONE 08     ... that is a lot of hull for one gun. Keep your eyes open.
 *   COALITION PATROL 03  Still talking. Keep your eyes open.
 *
 * `pairBucket` is the fix — see `utter`, which shares one bucket across both turns of an
 * exchange for the phrase pools where an echo is audible.
 */
const bucketFor = (a, topicKey) => `${a && a.name}:${topicKey}`;
const pairBucket = (a, b, topicKey) =>
  `pair:${[a && a.name, b && b.name].sort().join('~')}:${topicKey}`;

const same = (a, b) => a.faction === b.faction;
const role = (u, r) => u.role === r;
const hurt = u => u.hp < u.maxHp * 0.6;
const armed = u => u.role === 'combat' || u.role === 'merc';

/** Short-hand for "these two have talked before" — the gate most familiarity reads on. */
const known = rel => (rel && rel.exchanges > 0);

export const TOPICS = {
  // ── routine ────────────────────────────────────────────────────────
  checkIn: {
    channel: 'local', weight: 10, cooldown: 90,
    when: (a, b) => same(a, b),
    say: [
      ({ a, b, rel, bucket }) => ({
        act: known(rel) ? 'ask' : 'inform',
        register: registerOf(a),
        subject: known(rel) ? 'you' : a.name,
        agr: known(rel) ? { person: 2, number: 'sg' } : { person: 3, number: 'sg' },
        verb: known(rel) ? 'hold' : 'mark',
        object: known(rel) ? null : `${b.name} on my board`,
        where: known(rel) ? place(null, { bucket }) : null,
        vocative: b.name
      }),
      // After the swap in exchange(), `a` is the responder and `b` is the original speaker.
      // Acknowledge the other party, not ourselves.
      ({ a, b, rel, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        object: known(rel)
          ? chooseFrom(['nothing moving', 'where I said I would be', 'all quiet on my scope'],
                       `${bucket}:checkReply`)
          : b.name,
        verb: 'hold'
      })
    ],
    filesFrom: { type: 'spoke-with', weight: 0.4 },
    filesTo:   { type: 'spoke-with', weight: 0.4 }
  },

  // ── work ───────────────────────────────────────────────────────────
  oreTip: {
    channel: 'trade', weight: 14, cooldown: 240,
    when: (a, b) => role(a, 'mine') && (role(b, 'mine') || role(b, 'haul') || role(b, 'trade')),
    say: [
      ({ a, b, bucket }) => ({
        act: 'tip',
        register: registerOf(a),
        subject: described('face', 'good', { bucket, det: 'def' }),
        verb: 'read',
        object: described('ore', 'good', { bucket, det: 'none' }),
        where: place(null, { bucket }),
        vocative: b.name
      }),
      ({ a, rel, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        object: known(rel) ? 'that' : null,
        verb: 'look'
      })
    ],
    // A tip is the smallest unit of the thing slice 11 turns into a tradeable good:
    // knowledge with a source attached. Filing who told you is what later lets a
    // character work out whose tips are worth anything.
    filesFrom: { type: 'gave-tip', weight: 0.8 },
    filesTo:   { type: 'got-tip', weight: 1.0 }
  },

  // The first topic that produces an *obligation* rather than only a memory. `offers` is
  // read by systems/npc-comms.js: if the topic fires and the listener accepts, a deal goes
  // on the ledger and the hauler flies it. That is the whole difference between a social
  // layer that is state and one that acts.
  haulOffer: {
    channel: 'trade', weight: 12, cooldown: 200,
    when: (a, b) => role(a, 'mine') && role(b, 'haul'),
    offers: 'haul',
    say: [
      ({ a, bucket }) => ({
        act: 'offer',
        register: registerOf(a),
        subject: a.name,
        verb: 'fill',
        object: quantity('hold', null, { bucket, det: 'indef' }),
        where: place(null, { bucket })
      }),
      ({ a, rel, bucket }) => ({
        act: known(rel) ? 'ack' : 'ask',
        register: registerOf(a),
        subject: 'I',
        agr: { person: 1, number: 'sg' },
        verb: 'have',
        object: quantity('hold', null, { bucket, det: 'indef' })
      })
    ],
    filesFrom: { type: 'offered-work', weight: 1.0 },
    filesTo:   { type: 'offered-work-to-me', weight: 1.0 }
  },

  // ── the player ─────────────────────────────────────────────────────
  //
  // The one that makes reputation travel at the speed of conversation instead of
  // teleporting into a global number. A character who has watched you kill its own passes
  // that on, and the listener files it as though they had seen it — which is how a belt
  // gets cold two stations away from anything you did.
  warnAboutPlayer: {
    channel: 'local', weight: 18, cooldown: 150,
    when: (a, b, ctx) => same(a, b) && ctx.warinessOf(a) >= ctx.gossipThreshold,
    say: [
      ({ a, b, bucket }) => ({
        act: 'warn',
        register: registerOf(a),
        object: chooseFrom(
          ['that independent hull has been busy',
           'there is an unflagged hull working this side',
           'somebody out here does not log their kills',
           'the independent has form'],
          `${bucket}:warn`),
        where: place(null, { bucket }),
        vocative: b.name
      }),
      ({ a, rel, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        object: known(rel) ? 'you have said' : null,
        verb: 'keep'
      })
    ],
    filesFrom: { type: 'warned-about-player', weight: 0.6 },
    // Second-hand, and weighted lighter than witnessing it: hearing about something is not
    // seeing it, and a rumour that carried the same weight as an eyewitness account would
    // make the whole faction hostile from one kill.
    filesTo:   { type: 'saw-kill-ours', subject: 'player', weight: 0.7 },
    hearsay: true
  },

  // ── trouble ────────────────────────────────────────────────────────
  askHelp: {
    channel: 'distress', weight: 22, cooldown: 60,
    when: (a, b) => same(a, b) && hurt(a) && armed(b),
    say: [
      ({ a, bucket }) => ({
        act: 'inform',
        register: registerOf(a),
        subject: a.name,
        // Progressive: a distress call is about something happening right now, and the
        // simple present ("takes fire") reads as a habit rather than an emergency.
        agr: { person: 3, number: 'sg', aspect: 'prog' },
        verb: 'take',
        object: chooseFrom(['fire', 'hits', 'more than I can hold', 'a working over'],
                           `${bucket}:distress`),
        where: place(null, { bucket })
      }),
      ({ a, bucket }) => ({
        act: 'ack',
        register: registerOf(a),
        verb: 'come',
        object: chooseFrom(['I am coming about', 'burning your way now', 'on my way'],
                           `${bucket}:reply`)
      })
    ],
    filesFrom: { type: 'asked-help', weight: 1.2 },
    filesTo:   { type: 'was-asked-help', weight: 1.2 }
  },

  thanks: {
    channel: 'local', weight: 8, cooldown: 300,
    when: (a, b, ctx) => same(a, b) && ctx.recallBetween(a, b, 'was-asked-help'),
    say: [
      ({ a, b, bucket }) => ({
        act: 'inform',
        register: registerOf(a),
        subject: 'I',
        agr: { person: 1, number: 'sg' },
        verb: 'owe',
        object: chooseFrom(['you for that one', 'you a favour', 'you one'],
                           `${bucket}:thanks`),
        vocative: b.name
      }),
      ({ a, bucket }) => ({
        act: 'inform',
        register: registerOf(a),
        object: chooseFrom(['buy me something at the next berth',
                            'settle it at the ring and we are square',
                            'you would have done the same'],
                           `${bucket}:thanksReply`)
      })
    ],
    // A favour owed, on both sides of the pair. Slice 10 reads exactly this to decide
    // whether a character will take a contract from somebody.
    filesFrom: { type: 'owes-favour', weight: 1.5 },
    filesTo:   { type: 'owed-favour', weight: 1.5 }
  },

  // ── the other side ─────────────────────────────────────────────────
  taunt: {
    channel: 'local', weight: 6, cooldown: 180,
    when: (a, b) => !same(a, b) && armed(a) && armed(b),
    say: [
      ({ a, b, bucket }) => ({
        act: 'warn',
        register: registerOf(a),
        object: chooseFrom(['you are a long way from anywhere friendly',
                            'nobody out here is going to come for you',
                            'that is a lot of hull for one gun'],
                           `${bucket}:taunt`),
        vocative: b.name
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
    filesTo:   { type: 'traded-words', weight: 0.5 }
  }
};

export const TOPIC_KEYS = Object.keys(TOPICS);

/**
 * Produce one side of an exchange.
 *
 * Prefers the generated path (`say`) and falls back to a topic's legacy `lines` if it has
 * not been converted, so a half-converted table still speaks.
 *
 * @param {string} key   topic key, used as part of the anti-repetition bucket
 * @param {number} turn  0 = opener, 1 = reply
 */
export function utter(key, turn, ctx) {
  const t = TOPICS[key];
  if (!t) return '';
  const bucket = bucketFor(ctx.a, key);
  // The phrase pools a topic draws from are shared across the exchange, so a reply cannot
  // echo the line it is answering. Frame and furniture choice stay speaker-scoped: two
  // people using the same sentence shape is how conversation sounds, and two people using
  // the same *words* is how a tape loop sounds.
  const pair = pairBucket(ctx.a, ctx.b, key);
  if (Array.isArray(t.say) && t.say[turn]) {
    const msg = t.say[turn](Object.assign({ bucket: pair }, ctx));
    if (msg) return realise(msg, { bucket, rng: ctx.rng, vocative: msg.vocative || null });
  }
  if (Array.isArray(t.lines) && t.lines[turn]) return t.lines[turn](ctx);
  return '';
}

/**
 * Topics these two could raise right now, with weights.
 * `ctx` carries the callbacks a `when` clause may need — see systems/npc-comms.js.
 */
export function availableTopics(a, b, ctx) {
  const out = [];
  for (const k of TOPIC_KEYS) {
    const t = TOPICS[k];
    try { if (t.when(a, b, ctx)) out.push(k); } catch (e) { /* a bad clause is not a crash */ }
  }
  return out;
}
