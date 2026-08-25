// Living Galaxy — comms.
//
// The log used to be a place the game printed at you. This makes it a place people talk.
//
// Three things had to be true for it to be worth building:
//
//   **Traffic comes from the world, not from a timer.** Every ambient line is spoken by
//     a ship that actually exists, within COMMS.range of you, doing the thing the line is
//     about. A miner talks about ore because it is mining; a patrol talks about a pirate
//     because there is one. Nothing is generated for a ship that is not there.
//   **Other people answer each other.** A hail is not a two-hander between you and one
//     NPC. When somebody transmits, anyone else in range with an opinion may chime in —
//     and their opinion depends on faction, so a pirate taunt gets a patrol reply and a
//     distress call gets a volunteer or a vulture.
//   **Replying costs something.** Options are real choices with standing attached, they
//     expire (COMMS.replyWindow), and silence is always one of them. A reply menu where
//     every answer is free is a reply menu nobody reads.
//
// Deliberately not here: dialogue trees. A tree is a script with branches, and this is a
// radio. Exchanges are short, situational and disposable, which is what makes them
// bearable at the hundredth one.

import { S } from '../../core/state.js';
import { COMMS } from '../../core/config.js';
import { stream } from '../../core/rng.js';
import { adjust } from '../company/reputation.js';
import { sfx } from '../platform/audio.js';

let rng = null;
let chatterT = 0, nextChatter = 12;
let seq = 1;
const listeners = new Set();

const bag = () => (S.comms = S.comms || {
  log: [], unread: 0, pending: null, lastHail: {}, channel: 'local'
});

export const commsLog = () => bag().log;
export const unread = () => bag().unread;
export const pending = () => bag().pending;

/** UI subscribes; every append and every reply-window change fires it. */
export function onComms(fn) { listeners.add(fn); return () => listeners.delete(fn); }
const emit = () => { for (const fn of listeners) { try { fn(); } catch (e) { /* a bad view is not a bad radio */ } } };

// ── the log ──────────────────────────────────────────────────────────

/**
 * Append one transmission.
 * @param {object} m { from, faction, text, channel, kind }
 */
export function transmit(m) {
  const b = bag();
  const entry = {
    id: seq++,
    t: S.time,
    from: m.from || 'Unknown',
    faction: m.faction || 'neutral',
    channel: COMMS.channels.includes(m.channel) ? m.channel : 'local',
    kind: m.kind || 'chatter',        // chatter | hail | reply | you | system
    // The persona key for whoever spoke, when there is one. `from` is a display name and
    // could in principle be decorated later; this stays the exact lookup key so the UI
    // can open a speaker's mind from a log row without guessing.
    speaker: m.speaker || null,
    text: String(m.text || '').slice(0, 220)
  };
  b.log.push(entry);
  if (b.log.length > COMMS.maxLog) b.log.splice(0, b.log.length - COMMS.maxLog);
  if (entry.kind !== 'you') b.unread++;
  emit();
  return entry;
}

export function markRead() { bag().unread = 0; emit(); }
export function setChannel(ch) { if (COMMS.channels.includes(ch)) { bag().channel = ch; emit(); } }

// ── who is out there ─────────────────────────────────────────────────

/** Ships within voice range, with their userData already unpacked. */
export function inRange(max = COMMS.range) {
  const out = [];
  const p = S.player.position;
  for (const n of S.world.npcs) {
    const u = n.userData;
    if (!u || u.hp <= 0) continue;
    const d = n.position.distanceTo(p);
    if (d <= max) out.push({ npc: n, u, d });
  }
  out.sort((a, b) => a.d - b.d);
  return out;
}

// ── voices ───────────────────────────────────────────────────────────
// Lines are indexed by what the speaker *is* and what they are *doing*, so the same
// pirate says something different while mining than while hunting.

const LINES = {
  hostile: {
    idle:  ['Nothing on the band. Stay sharp.', 'Anyone got a read on that Coalition wing?',
            'Third dry sweep this shift. I hate this rock.'],
    hunt:  ['Got a fat one. Moving in.', 'Cut its engines, take the hold. Same as always.',
            'That hull is worth more than the cargo. Careful with it.'],
    mine:  ['Seam is good here. Do not tell the refinery.', 'Cutting. Watch the band.'],
    taunt: ['You are a long way from a docking clamp, friend.',
            'Drop the hold and nobody has to file anything.',
            'That is a lovely ship. It would look better under a different transponder.']
  },
  friendly: {
    idle:  ['Patrol nine, station-keeping, nothing to report.',
            'Traffic is light. Keep your transponder honest and we will not talk again.',
            'Coalition band is clear. Enjoy the quiet while it lasts.'],
    hunt:  ['Contact bearing marked. Engaging.', 'Wing, tighten up. Hostile in the belt shadow.'],
    escort:['Convoy is intact. Keep your distance and we stay friends.'],
    warn:  ['Unidentified, you are drifting into a claimed band. Correct your course.',
            'That was a weapons lock. Explain it or break off.']
  },
  neutral: {
    idle:  ['Anyone selling water at a sane price?', 'Long shift. Longer trip.',
            'Registry says this lane is safe. Registry has never flown it.'],
    mine:  ['Hold is half full. Two more rocks and I am done.',
            'Cutter is running hot. It always runs hot.'],
    trade: ['Refinery is paying under book again.',
            'Prices at the trade post moved. Somebody knows something.'],
    fear:  ['I have a hostile on me. Anyone. Please.',
            'Losing shields. If anybody is on this band, I am at the belt edge.']
  }
};

const REPLIES = {
  // Faction of the *responder* -> what they say to a given kind of transmission.
  hostile: { fear: ['Nobody is coming, hauler.', 'We heard you. That is the problem.'],
             warn: ['Noted, patrol. Filed under nothing.'],
             trade:['Prices move because we move them.'] },
  friendly:{ fear: ['Distress acknowledged. Vector inbound, hold your position.',
                    'We have you. Do not do anything clever.'],
             taunt:['That band is monitored. Say it again slowly.'],
             hunt: ['Confirmed hostile. All wings, weapons free.'] },
  neutral: { fear: ['I am too far out to help. I am sorry.', 'Somebody answer them.'],
             trade:['Same at the habitat. Everyone is under book.'],
             taunt:['...I am going to be somewhere else.'] }
};

function speakerFor(e) {
  const u = e.u;
  return { from: u.name || 'Unregistered', faction: u.faction || 'neutral' };
}

// ── the voice seam ───────────────────────────────────────────────────
//
// The LINES/REPLIES tables above are the floor, not the ceiling. systems/npc-brain.js
// registers a provider here at boot that generates each line from the speaker's actual
// persona instead — so two miners in the same belt say different things, and the one who
// has been robbed before says something different again.
//
// This is a registration hook rather than a plain import for one reason: npc-brain.js
// already imports this module, so importing it back would be a cycle. Dependency flows
// one way (brains know about the radio, the radio does not know about brains) and the
// provider is how the radio gets a better voice without learning what a persona is.
//
// With no provider registered, everything below falls back to the static tables and the
// game is exactly as it was — which is also what the tests assert.

let voice = null;

/**
 * @param {{line:(u:object,mood:string)=>string|null,
 *          reply:(u:object,mood:string)=>string|null}|null} provider
 */
export function setVoiceProvider(provider) { voice = provider || null; }
export const hasVoiceProvider = () => !!voice;

function moodOf(u) {
  if (u.role === 'mine') return 'mine';
  if (u.role === 'build') return 'idle';
  if (u.role === 'merc') return 'hunt';
  if (u.role === 'trade' || u.role === 'haul') return 'trade';
  if (u.hp > 0 && u.lastHit != null && S.time - u.lastHit < 8) return 'fear';
  if (u.hostileTo === 'player' || u.aggro) return 'hunt';
  return 'idle';
}

function pickLine(faction, mood, u) {
  if (voice) {
    // A provider that returns null (no persona could be made, unknown mood) is not an
    // error — it just means this particular speaker falls back to the table like before.
    try { const v = voice.line(u, mood); if (v) return v; }
    catch (e) { /* a broken voice must not silence the radio */ }
  }
  const set = LINES[faction] || LINES.neutral;
  const list = set[mood] || set.idle || LINES.neutral.idle;
  return list[Math.floor(rng.next() * list.length)];
}

function pickReply(faction, mood, u) {
  if (voice) {
    try { const v = voice.reply(u, mood); if (v) return v; }
    catch (e) { /* fall through to the table */ }
  }
  const table = REPLIES[faction] || REPLIES.neutral;
  const list = table[mood];
  if (!list) return null;
  return list[Math.floor(rng.next() * list.length)];
}

// ── ambient traffic ──────────────────────────────────────────────────

function ambient() {
  const near = inRange();
  if (!near.length) return;
  const e = near[Math.floor(rng.next() * Math.min(near.length, 6))];
  const who = speakerFor(e);
  const mood = moodOf(e.u);
  const channel = mood === 'fear' ? 'distress' : mood === 'trade' ? 'trade' : 'local';
  transmit({ from: who.from, faction: who.faction, channel, kind: 'chatter',
             text: pickLine(who.faction, mood, e.u), speaker: who.from });

  // ...and somebody else answers. This is the whole feature: a log with one voice in it
  // is a notification feed. Two voices is a place. With a voice provider registered both
  // halves of the exchange come from real personas, so who answers and how they answer
  // are both properties of that specific character rather than of their faction.
  const others = near.filter(o => o !== e);
  if (!others.length || rng.next() > 0.55) return;
  const r = others[Math.floor(rng.next() * Math.min(others.length, 5))];
  const rw = speakerFor(r);
  const text = pickReply(rw.faction, mood, r.u);
  if (!text) return;
  transmit({ from: rw.from, faction: rw.faction, channel, kind: 'reply',
             text, speaker: rw.from });
}

// ── hails aimed at you ───────────────────────────────────────────────

/**
 * Open a hail with reply options. Called from the world (a merc taking a contract, a
 * patrol warning you off claimed space, a hauler in trouble) rather than on a timer.
 */
export function hail({ from, faction = 'neutral', text, channel = 'local', options = [],
                       key = null, speaker = null }) {
  const b = bag();
  const id = key || from;
  const last = b.lastHail[id];
  if (last != null && S.time - last < COMMS.hailCooldown) return null;
  b.lastHail[id] = S.time;

  const entry = transmit({ from, faction, channel, kind: 'hail', text, speaker });
  b.pending = {
    from, faction, channel,
    opened: S.time,
    // The id of the log entry this hail's opening line landed as. A caller that enriches
    // the line after the fact (npc-brain.js's LLM tier) uses this to find and replace it
    // without having to re-scan the log or reason about entries added since.
    entryId: entry.id,
    options: options.slice(0, 4).map((o, i) => ({ i, label: o.label, say: o.say || o.label,
                                                   effect: o.effect || null }))
  };
  sfx.ui();
  emit();
  return b.pending;
}

/**
 * Replace a log entry's text in place, by id — the one-way door an async enrichment (a
 * language-model reply that lands after the grammar-tier line was already shown) needs
 * to swap the displayed line without disturbing anything else about the log. A no-op if
 * the entry has rolled off the end of the bounded log by the time the reply arrives.
 */
export function updateEntryText(id, text) {
  const e = bag().log.find(x => x.id === id);
  if (!e || !text) return false;
  e.text = String(text).slice(0, 220);
  emit();
  return true;
}

/** Answer the open hail. `index` of -1 is staying silent, which is always allowed. */
export function reply(index) {
  const b = bag();
  const p = b.pending;
  if (!p) return false;
  b.pending = null;

  if (index < 0 || !p.options[index]) {
    transmit({ from: 'You', faction: 'player', channel: p.channel, kind: 'you',
               text: '(you say nothing)' });
    emit();
    return true;
  }
  const opt = p.options[index];
  transmit({ from: 'You', faction: 'player', channel: p.channel, kind: 'you', text: opt.say });

  const fx = opt.effect;
  if (fx) {
    if (fx.standing) for (const bloc in fx.standing) adjust(bloc, fx.standing[bloc]);
    if (fx.credits) S.credits += fx.credits;
    if (fx.answer) {
      transmit({ from: p.from, faction: p.faction, channel: p.channel, kind: 'reply',
                 text: fx.answer });
    }
  }
  emit();
  return true;
}

/** Reply windows expire. A radio does not hold the line open for ever. */
function expire() {
  const b = bag();
  if (b.pending && S.time - b.pending.opened > COMMS.replyWindow) {
    const from = b.pending.from;
    b.pending = null;
    transmit({ from, faction: 'neutral', channel: 'local', kind: 'system',
               text: `${from} closed the channel.` });
  }
}

// ── lifecycle ────────────────────────────────────────────────────────

export function initCommsSystem() {
  rng = stream('comms');
  const b = bag();
  // A fresh world gets a fresh log. Boot order is initCommsSystem() then loadGame(), so a
  // restored flight has its archive put back over the top of this a moment later.
  b.log = [];
  b.unread = 0;
  b.lastHail = {};
  b.pending = null;
  chatterT = 0;
  nextChatter = COMMS.idleChatter[0];
  seq = b.log.reduce((a, e) => Math.max(a, e.id || 0), 0) + 1;
}

export function updateComms(dt) {
  if (!rng || !(dt > 0)) return;
  expire();
  chatterT += dt;
  if (chatterT < nextChatter) return;
  chatterT = 0;
  const [lo, hi] = COMMS.idleChatter;
  nextChatter = lo + rng.next() * (hi - lo);
  ambient();
}

// ── reporting & persistence ──────────────────────────────────────────

export const commsReport = () => {
  const b = bag();
  return {
    entries: b.log.length,
    unread: b.unread,
    channel: b.channel,
    pending: b.pending ? { from: b.pending.from, options: b.pending.options.map(o => o.label) } : null,
    inRange: inRange().length,
    recent: b.log.slice(-8).map(e => `${e.from}: ${e.text}`)
  };
};

export const serializeComms = () => {
  const b = bag();
  // The pending hail is deliberately not saved: resuming three days later into a live
  // reply window from a ship that no longer exists is worse than losing the exchange.
  return { log: b.log.slice(-40), unread: b.unread, channel: b.channel };
};

export function restoreComms(data) {
  const b = bag();
  b.log = Array.isArray(data && data.log) ? data.log.filter(e => e && e.text) : [];
  b.unread = (data && data.unread) || 0;
  b.channel = (data && COMMS.channels.includes(data.channel)) ? data.channel : 'local';
  b.pending = null;
  b.lastHail = {};
  seq = b.log.reduce((a, e) => Math.max(a, e.id || 0), 0) + 1;
  return true;
}
