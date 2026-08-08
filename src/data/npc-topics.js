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
    lines: [
      ({ a, b, rel }) => known(rel)
        ? `${b.name}, ${a.name}. Still on station?`
        : `${b.name}, this is ${a.name}. Marking you on my board.`,
      ({ a, rel }) => known(rel)
        ? `Where I said I'd be. Nothing moving.`
        : `Copy ${a.name}. Logged.`
    ],
    filesFrom: { type: 'spoke-with', weight: 0.4 },
    filesTo:   { type: 'spoke-with', weight: 0.4 }
  },

  // ── work ───────────────────────────────────────────────────────────
  oreTip: {
    channel: 'trade', weight: 14, cooldown: 240,
    when: (a, b) => role(a, 'mine') && (role(b, 'mine') || role(b, 'haul') || role(b, 'trade')),
    lines: [
      ({ b }) => `${b.name} — face I'm on is running better than the survey said.`,
      ({ rel }) => known(rel)
        ? `You said that last time and you were right. Mark it for me.`
        : `Noted. I'll take a look when I'm through here.`
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
    lines: [
      ({ a }) => `Anyone hauling? ${a.name} has a hold filling faster than I can move it.`,
      ({ rel }) => known(rel)
        ? `Same terms as before. I'll swing by.`
        : `I've got space. What's the split?`
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
    lines: [
      ({ b }) => `${b.name}, watch the band. That independent hull has been busy.`,
      ({ rel }) => known(rel)
        ? `You've said. I'm not going near it alone either.`
        : `Understood. I'll keep my distance.`
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
    lines: [
      ({ a }) => `${a.name} taking fire. Anyone close?`,
      ({ rel }) => known(rel)
        ? `On my way. Hold what you've got.`
        : `Reading you. Coming about.`
    ],
    filesFrom: { type: 'asked-help', weight: 1.2 },
    filesTo:   { type: 'was-asked-help', weight: 1.2 }
  },

  thanks: {
    channel: 'local', weight: 8, cooldown: 300,
    when: (a, b, ctx) => same(a, b) && ctx.recallBetween(a, b, 'was-asked-help'),
    lines: [
      ({ b }) => `${b.name} — I owe you for that one.`,
      () => `Buy me something at the next station.`
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
    lines: [
      ({ b }) => `${b.name}. You're a long way from anywhere friendly.`,
      ({ rel }) => known(rel)
        ? `You again. Still talking.`
        : `Say that closer.`
    ],
    filesFrom: { type: 'traded-words', weight: 0.5 },
    filesTo:   { type: 'traded-words', weight: 0.5 }
  }
};

export const TOPIC_KEYS = Object.keys(TOPICS);

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
