// Living Galaxy — opening a channel, and what comes back.
//
// ## What this is
//
// The runtime under `data/dialogue.js`. It answers three questions and nothing else:
//
//   1. **Who is this, and what do they think of me?** — disposition, from bloc standing,
//      faction hostility and whether you have ever spoken before.
//   2. **Which doors are open?** — conversation always, war when they already want you dead,
//      persuasion when there is something worth persuading them of, station services when it
//      is a berth.
//   3. **What happens when I pick one?** — including the ones that can go badly.
//
// ## Why persuasion can fail
//
// Because a negotiation you always win is a cutscene. The roll is `commerce` plus standing
// against the attempt's own difficulty, and losing costs you standing with their bloc — not
// much, but enough that trying every option on every hull is a strategy with a price. The
// draw comes from a seeded stream keyed on *who* and *what*, so reloading a save and asking
// the same question gets the same answer: a dialogue you can scum is a dialogue with no
// stakes.
//
// ## Why the station scan is three steps and not a boolean
//
// A berth deciding whether to deal with you is the most interesting gate in the game and it
// was a single `dockingAllowed()` call. Reading the transponder, scanning the hold and
// pulling the record are three different ways to fail, they fail for different reasons, and
// the pilot should be able to tell *which* — because "we do not like your bloc" and "you are
// carrying salvage stripped off one of ours" have completely different remedies.
//
// Nothing in this file draws anything. `ui/contact.js` is the panel.

import { S } from '../../core/state.js';
import { makeRng, hashString } from '../../core/rng.js';
import { toast, status } from '../../core/notify.js';
import { OPENERS, CONVERSATION, WAR, PERSUASION, SERVICE_STEPS, SERVICE_VERDICT,
         CONTRABAND, CONTRABAND_FLOOR, DISPOSITION } from '../../data/dialogue.js';
import { standing, blocOf, isHostileTo, dockingAllowed, adjust } from '../company/reputation.js';
import { skill } from '../crew/character.js';
import { personaFor, noteEvent } from './npc-brain.js';
import { transmit } from './comms.js';
import { PARLEY } from '../../core/config.js';

/* Who has been spoken to, so "first contact" means something. Keyed by name, which is the
   same key `npc-brain.js` uses for personas — one identity per name across the session. */
let met = new Set();
let session = null;

export const parleySession = () => session;
export const parleyOpen = () => !!session;

/**
 * Can this be hailed at all?
 *
 * A rock cannot hold a conversation and neither can a Lagrange point. Everything with a
 * name and a hull can, including things that will only ever tell you to go away — being
 * told to go away is information.
 */
export function contactable(obj) {
  if (!obj) return false;
  const u = obj.userData || obj;
  if (!u || !u.name) return false;
  if (u.kind === 'asteroid' || u.kind === 'belt' || u.kind === 'lagrange') return false;
  if (u.kind === 'planet' || u.kind === 'moon' || u.kind === 'star') return false;
  return true;
}

/** Station, ship, or something that is not answering. */
export function subjectKind(obj) {
  const u = (obj && (obj.userData || obj)) || {};
  if (u.category || u.slots || u.forge) return 'station';
  if (u.hp !== undefined && u.hp <= 0) return 'derelict';
  if (u.kind === 'station') return 'station';
  return 'ship';
}

/**
 * How they feel about you.
 *
 * Standing is the spine of it; open hostility overrides everything above `cold`, because a
 * faction that is shooting at you does not get to be `warm` on the strength of paperwork.
 */
export function dispositionOf(obj) {
  const u = (obj && (obj.userData || obj)) || {};
  const faction = u.faction || 'independent';
  if (isHostileTo(faction)) return 'hostile';
  const v = standing(faction);
  if (v <= PARLEY.hostileBelow) return 'hostile';
  if (v <= PARLEY.coldBelow) return 'cold';
  if (v <= PARLEY.waryBelow) return 'wary';
  if (v >= PARLEY.alliedAbove) return 'allied';
  if (v >= PARLEY.warmAbove) return 'warm';
  return 'neutral';
}

/** Open a channel. Returns the session, or null if there is nothing there to answer. */
export function openParley(obj) {
  if (!contactable(obj)) return null;
  const u = obj.userData || obj;
  const kind = subjectKind(obj);
  const disp = kind === 'derelict' ? 'neutral' : dispositionOf(obj);
  const first = !met.has(u.name);
  met.add(u.name);

  session = {
    obj,
    name: u.name,
    faction: u.faction || 'independent',
    bloc: blocOf(u.faction || 'independent'),
    kind,
    disp,
    first,
    // What has been said, so a branch cannot be farmed by reopening the same menu.
    used: new Set(),
    // Station services runs once and its verdict sticks for the call.
    service: null,
    log: []
  };

  const table = OPENERS[kind] || OPENERS.ship;
  const set = table[first ? 'first' : 'known'] || table.known;
  const line = (set[disp] || set.neutral || (n => `${n} is on the channel.`))(u.name);
  push(line);

  // The persona remembers being spoken to, which is what makes the *next* call different.
  const p = personaFor(u);
  if (p) noteEvent(u, first ? 'we spoke for the first time' : 'we spoke again', { weight: 1 });
  return session;
}

export function closeParley() {
  session = null;
}

function push(text, who) {
  if (!session) return;
  session.log.push({ who: who || session.name, text });
  if (session.log.length > PARLEY.logKeep) session.log.shift();
  return text;
}

/** Everything said this call, oldest first. */
export const parleyLog = () => (session ? session.log.slice() : []);

// ── what is on offer ─────────────────────────────────────────────────

/**
 * The branches, in the order they should be shown.
 *
 * War first when they are hostile. That ordering is the whole reason this returns a list
 * rather than an object: a menu is a sequence, and which item is at the top is a design
 * decision, not an accident of key order.
 */
export function branchesFor(s = session) {
  if (!s) return [];
  const out = [];

  if (s.kind === 'derelict') {
    out.push({ id: 'conversation', label: 'Listen', options: [
      { id: 'part', label: 'Close the channel' }
    ] });
    return out;
  }

  if (s.disp === 'hostile') {
    out.push({ id: 'war', label: 'War', urgent: true, options: Object.keys(WAR)
      .map(id => ({ id, label: WAR[id].label })) });
  }

  out.push({ id: 'conversation', label: 'Conversation', options:
    Object.keys(CONVERSATION)
      .filter(id => !(CONVERSATION[id].once && !s.first))
      .filter(id => !s.used.has('conversation:' + id) || id === 'part')
      .map(id => ({ id, label: CONVERSATION[id].label })) });

  const persuade = Object.keys(PERSUASION)
    .filter(id => PERSUASION[id].subject === (s.kind === 'station' ? 'station' : 'ship'))
    .filter(id => !s.used.has('persuasion:' + id))
    .map(id => ({ id, label: PERSUASION[id].label, chance: chanceOf(id, s) }));
  if (persuade.length) out.push({ id: 'persuasion', label: 'Persuasion', options: persuade });

  if (s.kind === 'station') {
    out.push({ id: 'services', label: 'Station services', options: [
      { id: 'request', label: s.service ? 'Review the scan' : 'Request clearance' },
      ...(s.service && s.service.ok ? [{ id: 'dock', label: 'Request docking' }] : [])
    ] });
  }
  return out;
}

/**
 * Odds of talking somebody round, 0..1.
 *
 * Exposed because the panel shows it. A negotiation where you cannot see the odds is a coin
 * flip with extra clicks — and knowing you are at one in five is what makes taking the
 * chance a decision rather than a reflex.
 */
export function chanceOf(id, s = session) {
  const P = PERSUASION[id];
  if (!P || !s) return 0;
  const rep = standing(s.faction) / 100;                       // -1..1, roughly
  const talk = skill('commerce') * PARLEY.perCommerce;
  const mood = PARLEY.dispositionBonus[s.disp] || 0;
  const raw = (1 - P.difficulty) + talk + mood + rep * PARLEY.perStanding;
  return Math.max(PARLEY.floor, Math.min(PARLEY.ceiling, raw));
}

// ── choosing ─────────────────────────────────────────────────────────

/**
 * Take a branch.
 *
 * @returns {{text:string, kind:string, ok:boolean}|null} what came back
 */
export function choose(branch, id) {
  if (!session) return null;
  const s = session;
  s.used.add(branch + ':' + id);

  if (branch === 'conversation') return talk(s, id);
  if (branch === 'war') return war(s, id);
  if (branch === 'persuasion') return persuade(s, id);
  if (branch === 'services') return services(s, id);
  return null;
}

function talk(s, id) {
  const C = CONVERSATION[id];
  if (!C) return null;
  const text = C.lines[s.disp] || C.lines.neutral;
  push(text);
  if (C.standing && C.standing[s.disp]) adjust(s.faction, C.standing[s.disp], 'made an introduction');
  if (id === 'part') { relay(text); closeParley(); return { text, kind: 'end', ok: true }; }
  relay(text);
  return { text, kind: 'talk', ok: true };
}

function war(s, id) {
  const W = WAR[id];
  if (!W) return null;
  const text = W.lines[s.disp] || W.lines.hostile;
  push(text);
  relay(text);

  if (id === 'declare') {
    // Nothing subtle: mark them, point the ship, and let combat do the rest.
    S.target = { obj: s.obj, kind: 'ship', name: s.name, faction: s.faction };
    adjust(s.faction, PARLEY.declareStanding, 'declared on them');
    status(`Engaging ${s.name}`);
    closeParley();
    return { text, kind: 'fight', ok: true };
  }
  if (id === 'tribute') {
    const price = tributePrice(s);
    if (S.credits < price) {
      const no = 'You do not have it. We can see the hull you are flying.';
      push(no); return { text: no, kind: 'refused', ok: false };
    }
    S.credits -= price;
    adjust(s.faction, PARLEY.tributeStanding, 'paid them off');
    const out = 'Paid. We were never here.';
    push(out); relay(out);
    closeParley();
    return { text: out, kind: 'paid', ok: true, price };
  }
  return { text, kind: 'war', ok: true };
}

/** What a hostile wants to leave you alone. Scales with what you are carrying. */
export function tributePrice(s = session) {
  const hold = (S.cargo.ore || 0) + (S.cargo.salvage || 0) + (S.cargo.data || 0);
  return Math.max(PARLEY.tributeFloor,
                  Math.round(PARLEY.tributeFloor + hold * PARLEY.tributePerKg));
}

function persuade(s, id) {
  const P = PERSUASION[id];
  if (!P) return null;
  push(P.ask, 'You');
  const chance = chanceOf(id, s);
  // Seeded per subject and attempt, so a save reloaded gives the same answer. A dialogue you
  // can scum by reloading is a dialogue with no stakes.
  const rng = makeRng(hashString(`parley:${s.name}:${id}:${Math.floor(S.time / 60)}`));
  const won = rng.next() < chance;
  const text = won ? P.win : P.lose;
  push(text);
  relay(text);
  adjust(s.faction, won ? PARLEY.winStanding : PARLEY.loseStanding,
         won ? 'talked them round' : 'pushed their patience');
  if (won) applyPersuasion(s, id);
  return { text, kind: won ? 'won' : 'lost', ok: won, chance };
}

/**
 * What winning actually buys.
 *
 * Deliberately small and concrete. A persuasion system whose rewards are abstract — "they
 * like you more" — is one the player stops using, because the payoff never shows up anywhere
 * they can see.
 */
function applyPersuasion(s, id) {
  if (id === 'discount') {
    s.discount = true;
    toast(`${s.name} will shade the rate this visit`);
  } else if (id === 'passage') {
    s.bribed = true;
    if (s.service) { s.service.contraband = false; s.service.ok = s.service.identOk && s.service.recordOk; }
    toast(`${s.name} has developed scanner trouble`);
  } else if (id === 'standdown') {
    const u = s.obj.userData;
    if (u) { u.fleeing = true; u.nerve = 0; }
    toast(`${s.name} is breaking off`);
  } else if (id === 'hire' || id === 'contract') {
    s.offer = id;
    toast(`${s.name} is willing — settle it at a berth`);
  }
}

// ── the berth's side of it ───────────────────────────────────────────

/**
 * Run the three checks, or read back the verdict already reached.
 *
 * Each check is separable on purpose: "we do not deal with your bloc", "you are carrying
 * something we would have to confiscate" and "we looked up what you have been shooting" are
 * three different problems with three different fixes, and a single yes/no throws all of
 * that away.
 */
function services(s, id) {
  if (id === 'dock') {
    if (!s.service || !s.service.ok) {
      const no = 'Clearance first.';
      push(no); return { text: no, kind: 'refused', ok: false };
    }
    closeParley();
    return { text: 'Come alongside.', kind: 'dock', ok: true };
  }

  if (!s.service) s.service = runScan(s);
  const v = s.service;

  for (const step of SERVICE_STEPS) push(step.line(s.name), s.name);

  let text;
  if (!v.identOk) {
    text = (SERVICE_VERDICT.refused[s.disp] || SERVICE_VERDICT.refused.cold)(s.name);
  } else if (v.contraband) {
    text = SERVICE_VERDICT.contraband(s.name);
  } else if (v.bribed) {
    text = SERVICE_VERDICT.bribed(s.name);
  } else if (!v.recordOk) {
    text = (SERVICE_VERDICT.refused[s.disp] || SERVICE_VERDICT.refused.cold)(s.name);
  } else {
    text = (SERVICE_VERDICT.clear[s.disp] || SERVICE_VERDICT.clear.neutral)(s.name);
  }
  push(text);
  relay(text);
  return { text, kind: v.ok ? 'cleared' : 'refused', ok: v.ok, scan: v };
}

/** The scan itself, as data — so the panel can show what failed and why. */
export function runScan(s = session) {
  const disp = s.disp;
  const identOk = disp !== 'hostile';
  const recordOk = dockingAllowed(s.faction);

  // Contraband is relative to the berth's own bloc — see CONTRABAND in data/dialogue.js.
  const banned = CONTRABAND[s.bloc] || [];
  let load = 0;
  for (const k of banned) load += (S.cargo && S.cargo[k]) || 0;
  const contraband = !s.bribed && load > CONTRABAND_FLOOR;

  return {
    identOk, recordOk, contraband, bribed: !!s.bribed,
    banned, load: Math.round(load),
    ok: identOk && recordOk && !contraband
  };
}

/** Put it on the radio too, so the comms log carries the whole exchange. */
function relay(text) {
  if (!session) return;
  transmit({ from: session.name, faction: session.faction, channel: 'local',
             kind: 'hail', speaker: session.name, text });
}

/** Diagnostics, and the suite. */
export const parleyReport = () => (session ? {
  name: session.name, kind: session.kind, disp: session.disp, first: session.first,
  branches: branchesFor(session).map(b => b.id),
  scan: session.service || null,
  discount: !!session.discount, bribed: !!session.bribed, offer: session.offer || null,
  lines: session.log.length
} : null);

export function resetParley() { met = new Set(); session = null; }

/** Have we ever spoken to this one? For the suite and for the contact list. */
export const haveMet = name => met.has(name);
export { DISPOSITION };
