// Living Galaxy — NPC brains.
//
// The adapter between this game's world and the portable NPC_Avatar engine in
// src/npc-avatar/. Everything game-specific lives here; nothing in npc-avatar/ knows
// what a Mastermind, a bastion or a claim is, which is the point — the engine is meant
// to drop into another project unchanged.
//
// What this file owns:
//
//   **Who gets a mind.** Not everyone. A persona is created lazily, the first time a
//     character is individually relevant — a hail, a distress call, a warning — and
//     cached from then on by name. A belt full of silent contacts never allocates one.
//   **What kind of mind.** `archetypeFor()` reads the role and faction the world
//     already assigns and maps them onto the engine's six-axis archetypes. A miner
//     is a laborer, a merc is a criminal, a patrol is a patrol.
//   **What they can say.** The three hails the world fires (mercenary contract, claim
//     warning, distress) used to be fixed strings in comms.js. They are now grammars,
//     so the same situation reads differently depending on who is in it and whether
//     they have met you before.
//   **When it is worth asking a model.** `worthy()` — see the router's gate. Ambient
//     chatter never is. A hail with a reply menu attached always is: the player is
//     stopped, reading, and about to make a decision, which is the one moment in this
//     game where waiting a second for a better line is free.
//
// Determinism: personas are seeded off the NPC's name via the world's own stream, so a
// given character in a given galaxy is always the same person. That matters more here
// than in a single-player-only game — two clients in a shared Solaris must agree about
// who Rask is.

import { S } from '../../core/state.js';
import { AVATAR } from '../../core/config.js';
import { stream, makeRng, hashString } from '../../core/rng.js';
import { hail, transmit, updateEntryText, setVoiceProvider, inRange } from './comms.js';
import { createPersona, rememberEvent, say, brief,
         serializePersona, restorePersona } from '../../npc-avatar/core/persona.js';
import { createRouter, requestLine, routerReport } from '../../npc-avatar/core/router.js';
import { createBridge } from '../../npc-avatar/llm/bridge.js';
import { DEFAULT_MODEL } from '../../npc-avatar/llm/models.js';

let router = null;
let bridge = null;

const bag = () => (S.brains = S.brains || { personas: {} });

// ── who is who ───────────────────────────────────────────────────────

/**
 * Map this game's roles and factions onto the engine's archetypes. Role wins where it
 * is set, because what somebody *does* says more about them than who they fly for — a
 * pirate hauler is still a hauler in the way they talk.
 */
export function archetypeFor(u) {
  if (!u) return 'drifter';
  switch (u.role) {
    case 'mine':  return 'laborer';
    case 'build': return 'laborer';
    case 'merc':  return 'criminal';
    case 'trade': return 'merchant';
    case 'haul':  return 'merchant';
    default: break;
  }
  if (u.faction === 'hostile') return 'criminal';
  if (u.faction === 'friendly' || u.faction === 'coalition') return 'patrol';
  return 'drifter';
}

/**
 * The persona for an NPC, created on first use. `u` is the NPC's userData. Keyed by
 * name because that is the only identifier this game guarantees is stable across a
 * save/load — object references are rebuilt on every boot.
 */
export function personaFor(u) {
  if (!u || !u.name) return null;
  const b = bag();
  const existing = b.personas[u.name];
  if (existing) return existing;
  if (Object.keys(b.personas).length >= AVATAR.maxPersonas) {
    // Hard bound. A long session that hails hundreds of different ships should not grow
    // an unbounded table; the least interesting personas (no memories at all) go first.
    const cullable = Object.keys(b.personas).filter(k => !b.personas[k].memory.facts.length);
    for (const k of cullable.slice(0, 16)) delete b.personas[k];
    if (Object.keys(b.personas).length >= AVATAR.maxPersonas) return null;
  }
  // Seeded off the name so the same character is the same person in every session, and
  // on every client sharing this world seed.
  const rng = makeRng(hashString('persona:' + u.name));
  const p = createPersona({
    id: u.name, name: u.name,
    archetype: archetypeFor(u),
    faction: u.faction || 'neutral',
    rng,
    memoryCap: AVATAR.memoryCap
  });
  b.personas[u.name] = p;
  return p;
}

/** File something the player did to or with this character. */
export function noteEvent(u, fact, opts) {
  const p = personaFor(u);
  if (!p) return null;
  rememberEvent(p, fact, S.time, opts);
  return p;
}

export const knownPersonas = () => Object.keys(bag().personas);

// ── what the world does to people ────────────────────────────────────
//
// The hooks the rest of the game calls. Everything here is deliberately about *witnesses*
// rather than about the victim: the miner you shot does not get to remember it, because
// they no longer exist. The four ships who watched you do it are the ones whose opinion
// of you should change, and they are why the belt gets colder the longer you work it
// carelessly.
//
// All of these are cheap — a bounded loop over ships already inside comms range, filing
// one fact each — and all of them are no-ops when the witness list is empty.

/** Everyone within voice range who could plausibly have seen something. */
function witnesses(exclude) {
  return inRange(AVATAR.witnessRange)
    .filter(e => e.u && e.u.name && e.u !== exclude && e.u.hp > 0)
    .slice(0, AVATAR.maxWitnesses);
}

/**
 * The player destroyed a ship. Everyone in earshot files it, and how they file it depends
 * on whose side the dead ship was on: a patrol watching you kill a pirate remembers a
 * favour, a pirate watching you kill a pirate remembers a threat.
 */
export function witnessKill(victimUserData) {
  const vf = (victimUserData && victimUserData.faction) || 'neutral';
  let filed = 0;
  for (const w of witnesses(victimUserData)) {
    const same = w.u.faction === vf;
    noteEvent(w.u, {
      type: same ? 'saw-kill-ours' : 'saw-kill-theirs',
      subject: 'player',
      weight: same ? 2 : 1,
      meta: { victim: victimUserData && victimUserData.name }
    }, same ? { driftAxis: 'aggression', driftAmount: 0.04 }
            : { driftAxis: 'loyalty', driftAmount: 0.02 });
    filed++;
  }
  return filed;
}

/**
 * The player traded at a station. The purser they dealt with remembers the size of it —
 * this is the one hook whose subject is a place rather than a ship, and it is why a
 * station controller can greet a regular differently from a stranger.
 */
export function witnessTrade(stationName, value) {
  if (!stationName || !(value > 0)) return null;
  return noteEvent({ name: stationName, faction: 'neutral', role: 'trade' },
                   { type: 'traded', subject: 'player',
                     weight: Math.min(3, 0.5 + value / 12000),
                     meta: { value: Math.round(value) } },
                   { driftAxis: 'sociability', driftAmount: 0.01 });
}

/**
 * The player cut a rock somebody else was already working. Small, petty, and exactly the
 * kind of thing a laborer holds on to — it feeds the `mine` grammar's "somebody worked
 * this face already" line back at you later.
 */
export function witnessClaimJump(minerUserData) {
  if (!minerUserData || !minerUserData.name) return null;
  return noteEvent(minerUserData,
                   { type: 'claim-jumped', subject: 'player', weight: 1.5 },
                   { driftAxis: 'sociability', driftAmount: -0.03 });
}

// ── grammars ─────────────────────────────────────────────────────────
//
// `ctx.met` is the shared shorthand every grammar below gates on: has this character
// dealt with the player before? It is what turns a generic line into a specific one, and
// it is why these are grammars rather than strings.

const met = ctx => ctx.recall({ subject: 'player' }, 1).length > 0;
const t = ctx => ctx.traits;

export const HAIL_GRAMMARS = {
  // ── a mercenary who has taken the contract on you ──────────────────
  merc_contract: [
    { text: () => 'Somebody bought your name off the board. Nothing personal — I am told ' +
                  'to bring the hull in, not the pieces. Easier for both of us if you cut throttle.',
      weight: 2 },
    { text: () => 'Your name came up on the board this morning and I was the one holding ' +
                  'the slip. Cut your engines and this stays professional.',
      weight: 2, when: ctx => t(ctx).formality > 0.4 },
    { text: () => 'Board says bring you in breathing. Board does not say unmarked. ' +
                  'Throttle down.',
      weight: 3, when: ctx => t(ctx).aggression > 0.6 },
    { text: () => 'You again. I told myself if your name came up a second time I would ' +
                  'stop being polite about it. Cut throttle.',
      weight: 4, when: met }
  ],

  // ── a patrol warning you out of a claim ────────────────────────────
  claim_warning: [
    { text: () => 'Unidentified, you are inside a claimed band. Turn out or be logged as hostile.',
      weight: 2 },
    { text: () => 'You are in somebody else\u2019s sky. Come about, and we will both pretend ' +
                  'this was a navigation error.',
      weight: 2, when: ctx => t(ctx).aggression < 0.5 },
    { text: () => 'Claimed band. You have about ten seconds before this stops being a warning.',
      weight: 3, when: ctx => t(ctx).aggression > 0.6 },
    { text: () => 'This is the second time I have had to say this to you. Turn out.',
      weight: 4, when: met }
  ],

  // ── somebody losing a fight in earshot ─────────────────────────────
  distress: [
    { text: () => 'Anyone on this band — I have hostiles on me and no guns worth the name. ' +
                  'I will pay whatever I have left.',
      weight: 2 },
    { text: () => 'Mayday, mayday. Hull is opening up. Anyone. Please.',
      weight: 3, when: ctx => t(ctx).verbosity < 0.4 },
    { text: () => 'This is a registered hauler under attack, requesting immediate assistance ' +
                  'from any vessel in range. I am broadcasting my position.',
      weight: 2, when: ctx => t(ctx).formality > 0.55 },
    { text: () => 'You — I know your transponder. You helped once. I am asking again.',
      weight: 4, when: met }
  ]
};

// ── ambient traffic ──────────────────────────────────────────────────
//
// The belt chatter used to come from a per-faction string table, which meant every
// hostile in Solaris shared three sentences. These are the same moods the radio already
// classifies (`moodOf` in comms.js), rebuilt as grammars so the speaker's own traits and
// history pick the line.
//
// Nothing here ever reaches a language model — `worthy()` refuses ambient situations, and
// that refusal is the reason this tier has to be good on its own. There are dozens of
// these a minute and nobody is waiting on any of them.

export const AMBIENT_GRAMMARS = {
  idle: [
    { text: () => 'Nothing on the band. Stay sharp.', weight: 2 },
    { text: () => 'Long shift. Longer trip.', weight: 2 },
    { text: () => 'Registry says this lane is safe. Registry has never flown it.', weight: 2 },
    { text: () => 'Station-keeping. Nothing to report.', weight: 3, when: ctx => t(ctx).formality > 0.6 },
    { text: () => 'Anyone selling water at a sane price?', weight: 3, when: ctx => t(ctx).sociability > 0.55 },
    { text: () => '...', weight: 2, when: ctx => t(ctx).verbosity < 0.25 },
    { text: () => 'Third dry sweep this shift. I hate this rock.', weight: 3, when: ctx => t(ctx).aggression > 0.55 }
  ],
  mine: [
    { text: () => 'Cutting. Watch the band.', weight: 2 },
    { text: () => 'Hold is half full. Two more rocks and I am done.', weight: 2 },
    { text: () => 'Cutter is running hot. It always runs hot.', weight: 2 },
    { text: () => 'Seam is good here. Do not tell the refinery.', weight: 3, when: ctx => t(ctx).greed > 0.55 },
    { text: () => 'Somebody worked this face already. Recently.', weight: 3,
      when: ctx => ctx.recall({ type: 'claim-jumped' }, 1).length > 0 }
  ],
  build: [
    { text: () => 'Frame is up. Pressure test in six hours.', weight: 2 },
    { text: () => 'Short two crates of alloy. Somebody miscounted dirtside.', weight: 2 },
    { text: () => 'Slow work. Good work. Pick one.', weight: 2, when: ctx => t(ctx).verbosity < 0.4 }
  ],
  trade: [
    { text: () => 'Refinery is paying under book again.', weight: 2 },
    { text: () => 'Prices at the trade post moved. Somebody knows something.', weight: 2 },
    { text: () => 'I will not take that spread. Tell them I said so.', weight: 3, when: ctx => t(ctx).greed > 0.6 },
    { text: () => 'Manifest is clean, schedule is not. Story of the lane.', weight: 2,
      when: ctx => t(ctx).formality > 0.5 },
    { text: () => 'That pilot pays. I will say that much for them.', weight: 3,
      when: ctx => ctx.recall({ type: 'traded', subject: 'player' }, 1).length > 0 }
  ],
  hunt: [
    { text: () => 'Contact bearing marked. Moving in.', weight: 2 },
    { text: () => 'Got a fat one. Cut its engines, take the hold.', weight: 3, when: ctx => t(ctx).greed > 0.55 },
    { text: () => 'That hull is worth more than the cargo. Careful with it.', weight: 2 },
    { text: () => 'Wing, tighten up. Hostile in the belt shadow.', weight: 3, when: ctx => t(ctx).loyalty > 0.6 },
    { text: () => 'I know that transponder. This one is personal.', weight: 4,
      when: ctx => ctx.recall({ subject: 'player' }, 1).length > 0 }
  ],
  fear: [
    { text: () => 'I have a hostile on me. Anyone. Please.', weight: 3 },
    { text: () => 'Losing shields. If anybody is on this band, I am at the belt edge.', weight: 2 },
    { text: () => 'Mayday. Mayday.', weight: 3, when: ctx => t(ctx).verbosity < 0.35 },
    { text: () => 'This is a registered vessel under attack requesting immediate assistance.',
      weight: 2, when: ctx => t(ctx).formality > 0.55 }
  ],
  taunt: [
    { text: () => 'You are a long way from a docking clamp, friend.', weight: 2 },
    { text: () => 'Drop the hold and nobody has to file anything.', weight: 2 },
    { text: () => 'That is a lovely ship. It would look better under a different transponder.', weight: 2 }
  ],
  warn: [
    { text: () => 'Unidentified, you are drifting into a claimed band. Correct your course.', weight: 2 },
    { text: () => 'That was a weapons lock. Explain it or break off.', weight: 3, when: ctx => t(ctx).aggression > 0.5 }
  ],
  escort: [
    { text: () => 'Convoy is intact. Keep your distance and we stay friends.', weight: 2 }
  ]
};

/**
 * What a *different* character says back. Keyed by the mood of the transmission being
 * answered — so the responder's own personality decides whether a distress call gets a
 * volunteer, an apology or a vulture.
 */
export const REPLY_GRAMMARS = {
  fear: [
    { text: () => 'I am too far out to help. I am sorry.', weight: 2 },
    { text: () => 'Somebody answer them.', weight: 2 },
    { text: () => 'Distress acknowledged. Vector inbound, hold your position.', weight: 4,
      when: ctx => t(ctx).loyalty > 0.6 },
    { text: () => 'Nobody is coming. That is the arrangement.', weight: 4,
      when: ctx => t(ctx).aggression > 0.6 && t(ctx).loyalty < 0.35 },
    { text: () => 'What is the salvage worth?', weight: 3, when: ctx => t(ctx).greed > 0.7 }
  ],
  trade: [
    { text: () => 'Same at the habitat. Everyone is under book.', weight: 2 },
    { text: () => 'Prices move because we move them.', weight: 3, when: ctx => t(ctx).greed > 0.6 },
    { text: () => 'Take it up with the registry. That is what it is for.', weight: 2,
      when: ctx => t(ctx).formality > 0.6 }
  ],
  taunt: [
    { text: () => 'That band is monitored. Say it again slowly.', weight: 3, when: ctx => t(ctx).loyalty > 0.55 },
    { text: () => '...I am going to be somewhere else.', weight: 3, when: ctx => t(ctx).aggression < 0.35 },
    { text: () => 'Big words for a hull that size.', weight: 2, when: ctx => t(ctx).aggression > 0.55 }
  ],
  hunt: [
    { text: () => 'Confirmed hostile. All wings, weapons free.', weight: 3, when: ctx => t(ctx).loyalty > 0.55 },
    { text: () => 'Leave some of it.', weight: 2, when: ctx => t(ctx).greed > 0.55 },
    { text: () => 'Not my fight.', weight: 2, when: ctx => t(ctx).loyalty < 0.3 }
  ],
  warn: [
    { text: () => 'Noted, patrol. Filed under nothing.', weight: 2, when: ctx => t(ctx).loyalty < 0.4 },
    { text: () => 'Copy that. Coming about.', weight: 2, when: ctx => t(ctx).loyalty >= 0.4 }
  ],
  mine: [
    { text: () => 'Leave some for the rest of us.', weight: 2 },
    { text: () => 'Which face? I will work the other one.', weight: 2, when: ctx => t(ctx).sociability > 0.5 }
  ],
  idle: [
    { text: () => 'Copy.', weight: 2, when: ctx => t(ctx).verbosity < 0.4 },
    { text: () => 'Heard. Fly safe.', weight: 2, when: ctx => t(ctx).sociability > 0.45 }
  ]
};

/**
 * The provider comms.js calls. Returns null rather than throwing whenever it cannot do
 * better than the static table — an unnamed ship, an unknown mood, a full persona table.
 * comms.js treats null as "use the old line", so the radio never goes quiet.
 */
function ambientLine(u, mood) {
  if (!AMBIENT_GRAMMARS[mood]) return null;
  const p = personaFor(u);
  if (!p) return null;
  return say(p, AMBIENT_GRAMMARS, mood, {}, stream('npc-voice'), S.time);
}

function ambientReply(u, mood) {
  if (!REPLY_GRAMMARS[mood]) return null;
  const p = personaFor(u);
  if (!p) return null;
  return say(p, REPLY_GRAMMARS, mood, {}, stream('npc-voice'), S.time);
}

// ── the hails the world fires ────────────────────────────────────────
//
// Same signatures as the old comms.js versions, so worldsim.js's call sites did not
// change. What changed is that the line now comes from a persona, and may be upgraded
// by a language model after the fact.

/** A mercenary has taken the contract on you and wants you to know it. */
export function hailMercContract(npc) {
  const u = (npc && npc.userData) || {};
  return speak(u, 'merc_contract', {
    key: 'merc-contract',
    channel: 'local',
    faction: u.faction || 'hostile',
    options: [
      { label: 'Who paid?', say: 'Who posted it?',
        effect: { answer: 'Not my business, and not yours until you are aboard.' } },
      { label: 'Buy them off', say: 'Name a price to lose me.',
        effect: { credits: -2500, standing: { pirate: 3 },
                  answer: 'Credited. I never had a lock on you. Do not make me a liar twice.' } },
      { label: 'Refuse', say: 'Come and take it.',
        effect: { standing: { independent: 2 }, answer: 'That is the answer I was hoping for.' } }
    ],
    // Being hunted is formative. The mercenary remembers you, and gets harder about it.
    remember: { type: 'contract', subject: 'player', weight: 2 },
    drift: { driftAxis: 'aggression', driftAmount: 0.05 }
  });
}

/** A patrol noticing you inside claimed space. */
export function hailClaimWarning(name) {
  const u = { name: name || 'Bastion control', faction: 'friendly', role: null };
  return speak(u, 'claim_warning', {
    key: 'claim-warning',
    channel: 'local',
    faction: 'friendly',
    options: [
      { label: 'Complying', say: 'Coming about now.',
        effect: { standing: { coalition: 2 }, answer: 'Logged. Fly safe.' } },
      { label: 'Ask why', say: 'Whose claim, and filed when?',
        effect: { answer: 'Filed by a bastion with more guns than you. That is whose.' } },
      { label: 'Ignore', say: 'I heard you.',
        effect: { standing: { coalition: -3 }, answer: 'Then you know what happens next.' } }
    ],
    remember: { type: 'trespass', subject: 'player', weight: 1 }
  });
}

/** Somebody in trouble asking anyone at all. */
export function hailDistress(npc) {
  const u = (npc && npc.userData) || {};
  return speak(u, 'distress', {
    key: 'distress-' + (u.name || 'x'),
    channel: 'distress',
    faction: u.faction || 'neutral',
    options: [
      { label: 'On my way', say: 'Hold on. I am coming.',
        effect: { standing: { independent: 4, coalition: 2 },
                  answer: 'Thank you. I will keep the transponder up.' } },
      { label: 'Sorry, no', say: 'I cannot make that in time.',
        effect: { answer: 'Understood. Somebody had to say it.' } },
      { label: 'Name a number', say: 'What is it worth?',
        effect: { standing: { independent: -2 },
                  answer: 'Everything I have. Which right now is not very much.' } }
    ],
    remember: { type: 'distress', subject: 'player', weight: 1 }
  });
}

/**
 * The shared path: build the line from the persona, open the hail, and — if this moment
 * clears the router's gate — ask a model for a better version and swap it in when it
 * lands. The player sees the grammar line immediately either way; the upgrade is pure
 * profit or it never arrives.
 */
function speak(u, situation, spec) {
  const persona = personaFor(u);
  const rng = stream('npc-voice');
  const name = u.name || spec.from || 'Unregistered';

  const line = persona
    ? say(persona, HAIL_GRAMMARS, situation, {}, rng, S.time)
    : firstText(situation);

  const pending = hail({
    from: name, faction: spec.faction, channel: spec.channel,
    key: spec.key, text: line, options: spec.options, speaker: name
  });
  if (!pending) return null;              // on cooldown — nothing was said, so nothing to enrich

  if (persona && spec.remember) rememberEvent(persona, spec.remember, S.time, spec.drift || {});

  // The Tier-3 upgrade. Everything about this is best-effort: no bridge, no WebGPU, a
  // timeout, a thrown error, or the log entry having already rolled off all resolve to
  // "the player keeps the line they already had".
  if (persona && router && bridge) {
    const entryId = pending.entryId;
    const res = requestLine(router, {
      persona, grammar: HAIL_GRAMMARS, situation,
      ctx: {}, rng, now: S.time, bridge,
      llmRequest: promptFor(persona, situation, line)
    });
    if (res.upgrade) {
      res.upgrade.then(better => {
        if (better && entryId != null) updateEntryText(entryId, sanitize(better));
      });
    }
  }
  return pending;
}

const firstText = situation => {
  const rules = HAIL_GRAMMARS[situation] || [];
  const base = rules.find(r => !r.when);
  return base ? base.text({}) : '...';
};

/**
 * A small model handed six raw floats writes worse dialogue than one handed three
 * adjectives, so the prompt is built from `brief()` — words, not numbers — plus the
 * grammar line as a worked example of the register we want back.
 */
function promptFor(persona, situation, line) {
  const b = brief(persona, S.time, { memoryLines: 2 });
  const traits = b.descriptors.length ? b.descriptors.join(', ') : 'unremarkable';
  const history = b.recent.length
    ? ` You have dealt with this pilot before: ${b.recent.map(r => r.type).join(', ')}.`
    : '';
  return {
    system: `You are ${b.name}, a ${b.archetype} in a hard-science space setting, ` +
            `flying for the ${b.faction} bloc. You are ${traits}.${history} ` +
            `Reply with ONE short spoken sentence, in character. No narration, no ` +
            `asterisks, no quotation marks, no preamble.`,
    prompt: `Situation: ${situation.replace(/_/g, ' ')}. ` +
            `A plain version of the line: "${line}" — say it in your own voice.`,
    maxTokens: AVATAR.maxTokens,
    temperature: AVATAR.temperature
  };
}

/**
 * Small models like to wrap dialogue in quotes, prefix it with the character's name, or
 * bolt a stage direction on. Strip the common ones and hard-cap the length — a model
 * that ignored "one sentence" must not be able to blow out the comms panel.
 */
export function sanitize(text) {
  let s = String(text || '').trim();
  s = s.replace(/\*[^*]*\*/g, '');                 // *leans forward*
  // Whitespace is collapsed BEFORE the anchored strips below, or a single leading space
  // left behind by a stage direction defeats every one of them.
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/^["'\u201c\u2018]+|["'\u201d\u2019]+$/g, '').trim();
  s = s.replace(/^[A-Z][\w .'-]{0,24}:\s*/, '');   // "Rask: ..." speaker prefix
  s = s.replace(/^["'\u201c\u2018]+|["'\u201d\u2019]+$/g, '').trim();
  if (s.length > AVATAR.maxChars) {
    const cut = s.slice(0, AVATAR.maxChars);
    const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    s = stop > 40 ? cut.slice(0, stop + 1) : cut.trim() + '\u2026';
  }
  return s;
}

// ── lifecycle ────────────────────────────────────────────────────────

export function initBrains() {
  bag();
  router = createRouter({
    maxConcurrent: AVATAR.maxConcurrent,
    cooldown: AVATAR.cooldown,
    // A hail is the only moment worth a model: the player is stopped, reading a reply
    // menu, and about to make a decision. Ambient belt chatter is not — there are dozens
    // of those a minute and nobody is waiting on any of them.
    worthy: situation => !!HAIL_GRAMMARS[situation]
  });
  // Give the radio a real voice. Ambient chatter and NPC-to-NPC replies now come from
  // whoever is actually speaking rather than from a per-faction string table.
  setVoiceProvider({ line: ambientLine, reply: ambientReply });
  if (!AVATAR.enabled) { bridge = null; return; }
  bridge = createBridge({
    model: AVATAR.model,
    timeoutMs: AVATAR.timeoutMs,
    onStatus: s => { S.brains.llm = s; }
  });
}

/**
 * Start loading the model. Deliberately NOT called from boot: a several-hundred-megabyte
 * download is a thing a player opts into, not something that happens to them while the
 * game is trying to build a galaxy. The Lab settings tab calls this.
 */
export function loadBrainModel() {
  if (!bridge) { initBrains(); }
  if (!bridge) return false;
  bridge.load();
  return true;
}

export function setBrainsEnabled(on) {
  AVATAR.enabled = !!on;
  S.settings.npcBrains = !!on;
  if (!on && bridge) { bridge.dispose(); bridge = null; }
  else if (on && !bridge) initBrains();
  return AVATAR.enabled;
}

export const brainsReport = () => ({
  enabled: !!AVATAR.enabled,
  model: AVATAR.model,
  personas: knownPersonas().length,
  llm: bridge ? bridge.statusReport() : { status: 'off' },
  router: router ? routerReport(router) : null
});

/** Everything one character currently is — for the debug overlay and the tests. */
export function personaReport(name) {
  const p = bag().personas[name];
  if (!p) return null;
  return Object.assign(brief(p, S.time, { memoryLines: 5 }), {
    traits: p.traits, memories: p.memory.facts.length
  });
}

// ── persistence ──────────────────────────────────────────────────────
//
// Only personas that have actually accumulated memory are saved. A character the player
// merely heard once is fully reconstructible from their name and the world seed, so
// storing them would be paying bytes for something free.

export const serializeBrains = () => {
  const out = [];
  const ps = bag().personas;
  for (const k in ps) if (ps[k].memory.facts.length) out.push(serializePersona(ps[k]));
  return out.length ? out : null;
};

export function restoreBrains(data) {
  S.brains = { personas: {} };
  if (!Array.isArray(data)) return false;
  for (const d of data) {
    const p = restorePersona(d, AVATAR.memoryCap);
    if (p) S.brains.personas[p.id] = p;
  }
  return true;
}
