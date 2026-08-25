// Living Galaxy — the ship talking to itself.
//
// ## What this is for
//
// `data/crew-dialogue.js` is the corpus. This is the part that decides *whether anybody
// should say anything at all*, which is the harder half and the one that decides whether
// the feature is atmosphere or noise.
//
// The rule it is built around: **a crew line has to be caused by something**. Every
// utterance here is triggered by a condition that is true of the ship right now — the hold
// filled, the arrays went out, the galley got thin, somebody got hurt — and a line that
// fires when nothing has happened is filed under `quiet`, which has the longest gap of any
// situation for exactly that reason. A radio that talks because a timer expired is a radio
// the player learns to stop hearing inside twenty minutes.
//
// ## How it picks
//
// 1. **What is happening.** `situationNow()` walks `SITUATION_ORDER` and takes the first
//    condition that holds. Same shape as `reasoner.js`: ordered, first match wins, and the
//    ordering *is* the priority.
// 2. **Has it settled.** A situation has to hold for `CREW_TALK.settle` seconds before
//    anybody remarks on it, so a contact that clips the sensor edge does not get a line.
// 3. **Is anybody due.** One global floor plus a per-situation gap, both in `crewEvent`
//    time rather than frames.
// 4. **Who speaks.** Weighted toward the post that has something to say about it — the
//    gunner talks about the fight, the quartermaster about the hold — and away from
//    whoever spoke last, because two lines in a row from one person reads as a monologue.
// 5. **Which line.** `poolFor()` picks the narrowest pool that applies, and `chooseFrom()`
//    — the same anti-repetition memory the NPC radio uses — picks within it.
//
// ## Exchanges
//
// When the ship carries both posts an exchange names, the answer is queued rather than
// transmitted: the reply lands `CREW_TALK.replyDelay` seconds later, which is what makes
// two lines read as a conversation instead of a paste. One pending reply at a time, and it
// is dropped rather than delayed if something urgent happens in between — a crew that
// finishes a joke about the galley while boarders are aboard is a crew nobody believes in.

import { S } from '../../core/state.js';
import { CREW_TALK, CREW } from '../../core/config.js';
import { SITUATION_ORDER, SITUATIONS, poolFor, exchangesFor, corpusSize }
  from '../../data/crew-dialogue.js';
import { chooseFrom } from '../../data/npc-kb/grammar.js';
import { transmit } from '../npc/comms.js';
import { sweep } from '../npc/sweep.js';
import { habitatReport } from '../industry/habitat.js';
import { heatFraction } from '../combat/weapons.js';
import { activeContracts } from '../trade/contracts.js';
import { cargoMass } from '../../core/state.js';
import { stream } from '../../core/rng.js';
import { noteFresh, resetCrewNotes } from './crew-note.js';

/* Everything mutable about this module in one place, so `resetCrewTalk` is a single
   assignment and a new game cannot inherit a pending reply from the last one. */
let talk = blank();

function blank() {
  return {
    t: 0,                 // seconds since boot, for the quiet window
    since: 0,             // seconds the current situation has held
    sit: null,            // the situation currently holding
    lastAt: -999,         // when anybody last spoke
    lastBy: null,         // ...and who, so they do not go twice
    saidAt: {},           // situation → when it was last remarked on
    pending: null,        // { at, from, post, text } — an exchange's reply, in flight
    sinceDock: 0,         // seconds since the clamps last came off a station
    // Events the rest of the game pushes in live in `crew-note.js`, not here — see that
    // file's header for why the mailbox is a separate module with nothing under it.
  };
}

const rng = () => stream('crew-talk');

/* Announced events, from `crew-note.js`. A note for a situation this corpus has no lines
   for is ignored rather than trusted — the mailbox is deliberately dumb about what a valid
   situation is, so the check belongs here where the corpus is. */
const flagged = k => SITUATIONS[k] && noteFresh(k);

// ── what is happening ────────────────────────────────────────────────

/**
 * The first situation that holds.
 *
 * Reads the same sources everything else does — the sweep for the tactical picture, the
 * habitat report for the arrays and the farm — rather than keeping its own opinion about
 * whether the ship is in trouble. Two systems with separate ideas about "under fire" is
 * exactly the bug this project keeps writing comments about.
 */
export function situationNow() {
  const p = S.player, st = S.stats;
  const s = sweep();
  const hab = habitatReport();
  const hullFrac = st.hullMax ? p.hull / st.hullMax : 1;
  const holdFrac = st.cargoCap ? cargoMass() / st.cargoCap : 0;
  const mood = moodOf();

  for (const key of SITUATION_ORDER) {
    if (flagged(key)) return key;
    switch (key) {
      case 'boarding':   if (S.sim && S.sim.boarding) return key; break;
      case 'underfire':  if (s.pressingCount >= 1) return key; break;
      case 'hullcrit':   if (hullFrac <= 0.28) return key; break;
      case 'overheat':   if (p.overheat || heatFraction() >= 0.86) return key; break;
      case 'threatnear': if (s.threatCount >= 1) return key; break;
      case 'warpin':     if (S.warp.state === 'spooling') return key; break;
      case 'warpout':    if (S.warp.state === 'cooldown') return key; break;
      case 'docked':     if (S.docked) return key; break;
      case 'mining':     if (S.input.mining) return key; break;
      case 'oreful':     if (holdFrac >= 0.94) return key; break;
      case 'hauling':    if (activeContracts().some(c => (c.loaded || 0) > 0)) return key; break;
      case 'panelsout':  if (hab.pct > 0 && hab.panels !== 'deployed') return key; break;
      case 'charging':   if (hab.panels === 'deployed') return key; break;
      case 'farmgood':   if (hab.beds && hab.selfSufficient) return key; break;
      case 'hungry':     if (hab.crew && (hab.low || hab.starving)) return key; break;
      case 'wreck':      if (s.insideWreck) return key; break;
      // Sensed rather than flagged: "a long time out" is a fact about the clock, and a
      // flag would have to be set by whoever happened to notice.
      case 'longhaul':   if (talk.sinceDock >= CREW_TALK.longHaulAfter) return key; break;
      // `rotateAt` is the fatigue the watch rotation itself calls tired. One threshold,
      // two readers — the crew notice the same moment the roster does.
      case 'tired':      if (worst('fatigue') >= CREW.rotateAt) return key; break;
      case 'lowmorale':  if (mood === 'low') return key; break;
      case 'goodmorale': if (mood === 'high') return key; break;
      case 'quiet':      return key;
      default: break;    // the rest are flag-only: casualty, payday, refit, newhire...
    }
  }
  return 'quiet';
}

/** The crew's average morale as a band, or null in the middle where nobody remarks on it. */
function moodOf() {
  const c = S.crew || [];
  if (!c.length) return null;
  const avg = c.reduce((a, x) => a + (x.morale ?? 1), 0) / c.length;
  return avg <= CREW_TALK.lowMood ? 'low' : avg >= CREW_TALK.highMood ? 'high' : null;
}

const worst = field => (S.crew || []).reduce((a, c) => Math.max(a, c[field] || 0), 0);

// ── who says it ──────────────────────────────────────────────────────

/* Which post is most likely to have an opinion, per situation. Not exclusive — anybody
   aboard can speak — it only weights the draw, so a ship with no gunner still has somebody
   with something to say about being shot at. */
const VOICE_OF = {
  underfire: 'gunner', hullcrit: 'medic', overheat: 'engineer', firstblood: 'gunner',
  threatnear: 'survey', boarding: 'medic', casualty: 'medic',
  warpin: 'engineer', warpout: 'helm', docked: 'purser', undocked: 'helm',
  mining: 'rigger', oreful: 'purser', hauling: 'purser', wreck: 'survey',
  panelsout: 'engineer', charging: 'engineer', farmgood: 'purser', hungry: 'purser',
  payday: 'purser', broke: 'purser', repaired: 'engineer', refit: 'engineer',
  tired: 'medic', lowmorale: 'medic', goodmorale: null, longhaul: 'survey',
  newhire: 'purser', promotion: null, quiet: null
};

function speakerFor(sit) {
  const crew = (S.crew || []).filter(c => c && c.name);
  if (!crew.length) return null;
  const want = VOICE_OF[sit];
  const r = rng();

  // The department that owns the situation gets first refusal, most of the time. Not
  // always: a ship where only the gunner ever talks about a fight is a ship with one
  // person on it and six stat blocks.
  if (want && r.next() < 0.62) {
    const pool = crew.filter(c => c.role === want && c !== talk.lastBy);
    if (pool.length) return pool[Math.floor(r.next() * pool.length)];
  }
  const pool = crew.filter(c => c !== talk.lastBy);
  const from = pool.length ? pool : crew;
  return from[Math.floor(r.next() * from.length)];
}

// ── saying it ────────────────────────────────────────────────────────

function say(crewman, text) {
  if (!crewman || !text) return null;
  talk.lastAt = S.time || 0;
  talk.lastBy = crewman;
  // The company channel, not local: this is the ship's own intercom, and it should not be
  // mixed in with traffic control and other people's distress calls.
  return transmit({ from: crewman.name, faction: 'friendly', channel: 'company',
                    kind: 'chatter', speaker: null, text });
}

function speak(sit) {
  const posts = new Set((S.crew || []).map(c => c.role));
  const r = rng();

  // A two-hander, when the ship carries both halves of one.
  const two = exchangesFor(sit, posts);
  if (two.length && r.next() < CREW_TALK.exchangeShare) {
    const x = chooseFrom(two.map((e, i) => ({ id: sit + ':' + i, e })), 'crew-x:' + sit, r);
    const ex = x && x.e;
    if (ex) {
      const opener = pick(ex.from === 'veteranAny' ? null : ex.from);
      const answer = pick(ex.to, opener);
      if (opener && answer) {
        say(opener, ex.open);
        const [lo, hi] = CREW_TALK.replyDelay;
        talk.pending = { at: (S.time || 0) + lo + r.next() * (hi - lo),
                         who: answer, text: ex.reply, sit };
        return true;
      }
    }
  }

  const who = speakerFor(sit);
  if (!who) return false;
  const pool = poolFor(sit, who.role, who.trait, moodOf());
  if (!pool.length) return false;
  // Bucketed per situation *and* per speaker, so two people can independently arrive at
  // the same observation — which real crews do — without one of them repeating themselves.
  const line = chooseFrom(pool, 'crew:' + sit + ':' + who.role, rng());
  return !!say(who, line);
}

/** Somebody in a post, who is not `not`. */
function pick(role, not) {
  const crew = (S.crew || []).filter(c => c && c !== not && (!role || c.role === role));
  if (!crew.length) return null;
  return crew[Math.floor(rng().next() * crew.length)];
}

// ── the tick ─────────────────────────────────────────────────────────

export function updateCrewTalk(dt) {
  talk.t += dt;
  if (S.docked) talk.sinceDock = 0; else talk.sinceDock += dt;
  const now = S.time || 0;

  // A queued reply, first. Dropped rather than delayed if the situation has become
  // something urgent in the meantime.
  if (talk.pending) {
    const p = talk.pending;
    const urgency = SITUATIONS[situationNow()];
    if (urgency && urgency.urgency >= 3 && SITUATIONS[p.sit].urgency < 3) {
      talk.pending = null;
    } else if (now >= p.at) {
      talk.pending = null;
      say(p.who, p.text);
      return;
    }
  }

  if (talk.t < CREW_TALK.bootQuiet) return;
  if (!(S.crew || []).length) return;
  // Docked with nobody aboard to overhear is the one case where silence is correct: the
  // crew are on the concourse and the pilot is not in the ship either.
  if (S.docked && S.viewOutside) return;

  const sit = situationNow();
  if (sit !== talk.sit) { talk.sit = sit; talk.since = 0; return; }
  talk.since += dt;
  if (talk.since < CREW_TALK.settle) return;

  // The two gaps: one global, so the ship has a maximum talkativeness whatever is going
  // on, and one per situation, so the quiet ones stay quiet.
  const floor = CREW_TALK.floor + rng().next() * CREW_TALK.jitter;
  if (now - talk.lastAt < floor) return;
  const gap = (SITUATIONS[sit] && SITUATIONS[sit].gap) || 60;
  if (now - (talk.saidAt[sit] || -999) < gap) return;

  if (speak(sit)) talk.saidAt[sit] = now;
}

// ── diagnostics ──────────────────────────────────────────────────────

export function crewTalkReport() {
  return {
    situation: talk.sit,
    sinceDock: Math.round(talk.sinceDock),
    since: +talk.since.toFixed(1),
    lastBy: talk.lastBy ? talk.lastBy.name : null,
    sinceSpoke: +((S.time || 0) - talk.lastAt).toFixed(1),
    pending: !!talk.pending,
    corpus: corpusSize(),
    situations: SITUATION_ORDER.length
  };
}

export function resetCrewTalk() { talk = blank(); resetCrewNotes(); }
