// Living Galaxy — whose hull is that.
//
// ## The question nobody could answer
//
// A contact list full of ships said `Bulk Hauler · 1.4 Mm` and nothing else. Every hull in
// the system was an anonymous member of a faction, and "faction" is four buckets —
// hostile, friendly, worker, merc — which is a *posture*, not an owner. So the screen could
// tell you that a ship would probably not shoot you and could not tell you who it flew for,
// whether it was one of yours, or whether the pirate closing on it was Kessler or Vosk.
//
// That mattered more once hulls became attackable (v1.02.57). Free fire without ownership
// is a screen where you cannot tell your own hauler from somebody else's before you pull
// the trigger, which is not a difficulty setting, it is a missing instrument.
//
// ## Derived, not stored
//
// An NPC's operator is **computed from its name and its faction**, not written onto it at
// spawn. That is the same rule the dossier system follows (`systems/company/dossier.js`
// derives a whole person from a name and only persists them once they have done something),
// and for the same three reasons: a save does not grow a field per ship, a hull that
// respawns comes back flying for the same outfit, and every surface that asks gets the same
// answer without anybody having to remember to copy it.
//
// A *player* hull is different: those are real records with real ids, so they are looked up
// rather than derived. The fleet roster is the authority on which of them the company owns
// and which the pilot took back — see `OWNER` in `systems/company/fleet.js`.

import { S } from '../../core/state.js';
import { POWERS, POWER_KEYS } from '../../data/factions.js';
import { blocOf } from './reputation.js';
import { fleetRoster, OWNER } from './fleet.js';

/** The kinds of ownership a contact can have. */
export const OWN = {
  NONE:    'none',      // ambient population with no relevance to you
  PLAYER:  'player',    // a hull you personally own
  COMPANY: 'company',   // a hull your company holds a contract on
  CORP:    'corp',      // somebody else's — an NPC power's hull
  PILOT:   'pilot'      // another human, over the link
};

/**
 * Colours, as CSS strings without the alpha, so both the canvas overlay and the DOM can use
 * them. Kept here rather than in each renderer because three surfaces draw ownership now
 * and three copies of a palette is three chances for them to disagree about what green means.
 */
export const OWN_COLOUR = {
  [OWN.PLAYER]:  'rgba(120,255,170,',
  [OWN.COMPANY]: 'rgba(120,255,170,',
  [OWN.PILOT]:   'rgba(180,150,255,',
  [OWN.CORP]:    'rgba(190,220,245,',
  [OWN.NONE]:    'rgba(190,220,245,'
};

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i); h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The powers that recruit out of a given bloc, cached — it is a filter over a constant. */
const byBloc = {};
function powersIn(bloc) {
  if (!byBloc[bloc]) byBloc[bloc] = POWER_KEYS.filter(k => POWERS[k].bloc === bloc);
  return byBloc[bloc].length ? byBloc[bloc] : POWER_KEYS;
}

/**
 * Which power an NPC hull flies for.
 *
 * From the ship's *name*, which is stable across a save and unique per hull, and its faction,
 * which decides the bloc. So a Coalition Patrol is always Aurelian or Halloway and never
 * Kessler, a raider always flies for one of the two Outer powers, and the same ship is
 * working for the same people every time you meet it.
 *
 * @returns {string|null} a POWERS key, or null for something with no employer at all
 */
export function operatorFor(u) {
  if (!u || !u.name) return null;
  const bloc = blocOf(u.faction);
  const pool = powersIn(bloc);
  // The world seed is in the hash so two galaxies do not hand the same names to the same
  // outfits — the ship names are generated per system, but the *pairing* should be a fact
  // about this galaxy rather than about the name table.
  return pool[hash(u.name + ':' + (S.seed >>> 0)) % pool.length] || null;
}

/** The display name of an NPC's operator, or null. */
export function operatorName(u) {
  const key = operatorFor(u);
  return key && POWERS[key] ? POWERS[key].short || POWERS[key].name : null;
}

/**
 * Who owns the hull behind this object.
 *
 * Takes the scene object (an NPC group, a remote pilot's group) rather than a contact
 * record, so it works from anywhere — the contact list, the chart, the canopy brackets and
 * the targeting reticle all hold different wrappers around the same object.
 *
 * @returns {{kind:string,key:string|null,label:string|null,colour:string,mine:boolean}}
 */
export function ownerOfHull(obj) {
  const u = (obj && obj.userData) || null;
  if (!u) return plain();

  // A remote human. `net.js` tags their group; nothing else in the world has `remoteId`.
  if (u.remoteId != null || u.kind === 'pilot') {
    return { kind: OWN.PILOT, key: String(u.remoteId != null ? u.remoteId : u.name),
             label: u.name || 'Pilot', colour: OWN_COLOUR[OWN.PILOT], mine: false };
  }

  if (u.kind !== 'ship') return plain();

  // One of ours? The roster is small — a dozen contracts at most — so a linear scan per
  // contact is cheaper than maintaining an index that can go stale when a hull dies.
  const mine = rosterFor(u.name);
  if (mine) {
    const player = mine.owner === OWNER.PLAYER;
    return {
      kind: player ? OWN.PLAYER : OWN.COMPANY,
      key: mine.id,
      label: player ? 'Your ship' : ((S.company && S.company.name) || 'Company'),
      colour: OWN_COLOUR[player ? OWN.PLAYER : OWN.COMPANY],
      mine: true
    };
  }

  const op = operatorFor(u);
  if (!op) return plain();
  return { kind: OWN.CORP, key: op, label: POWERS[op].short || POWERS[op].name,
           colour: OWN_COLOUR[OWN.CORP], mine: false };
}

function plain() {
  return { kind: OWN.NONE, key: null, label: null, colour: OWN_COLOUR[OWN.NONE], mine: false };
}

/**
 * Cached roster lookup by hull name.
 *
 * Rebuilt whenever the roster's length changes or a quarter of a second has passed. The
 * contact walk asks this once per ship, four times a second, and `fleetRoster()` rebuilds a
 * record per contract every time it is called — including reading each hull's manifest.
 */
let rosterMap = null, rosterT = -1, rosterN = -1;
function rosterFor(name) {
  const list = fleetRoster();
  const t = S.time || 0;
  if (!rosterMap || list.length !== rosterN || Math.abs(t - rosterT) > 0.25) {
    rosterMap = new Map();
    for (const c of list) rosterMap.set(c.name, c);
    rosterT = t; rosterN = list.length;
  }
  return rosterMap.get(name) || null;
}

/** Drop the cache. After a load, a jump, or anything that replaces the fleet. */
export function resetOwnership() { rosterMap = null; rosterT = -1; rosterN = -1; }

/**
 * Would shooting this be an attack on somebody who has done nothing?
 *
 * The one place that decides, because three callers need the same answer: the projectile
 * layer charges reputation for it, the HUD warns before it, and the NPC brains use it to
 * decide whether they have a grudge. A hostile is fair game, a hull already shooting at you
 * is fair game, and everything else costs standing.
 */
export function isInnocent(u) {
  if (!u || u.kind !== 'ship') return false;
  if (u.faction === 'hostile') return false;
  if (u.provoked) return false;               // it has already fired on you
  return true;
}
