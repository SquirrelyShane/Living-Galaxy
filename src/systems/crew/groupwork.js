// Living Galaxy — working alongside somebody.
//
// ## What it is
//
// Cut rock in the same seam as another crew and you both get better at it, faster. That is
// the whole mechanic. There is no party to join, no invite to send and nothing to manage:
// the qualification is **being there, doing the same kind of work**.
//
// ## Why proximity and not a group system
//
// A party system is a UI, a state machine, a save field and a set of edge cases about who
// leaves when. What it buys is a number going up. Proximity buys the same number going up
// and costs a distance check — and it buys something a party system cannot, which is a
// reason to fly somewhere specific.
//
// That second part is the actual design goal. The belt was a place you went alone. NPC
// miners were scenery: you flew past a Belt Miner working a seam and there was no reason to
// stop next to it rather than a hundred kilometres away. A bonus for proximity turns a
// worked seam into the *better* seam, which is how a real field crowds — people work where
// people are working, because that is where the equipment and the survey data already are.
//
// ## What counts as working
//
// Not "being near". A ship holding station is not working; a ship cutting rock, running a
// consignment, flying a patrol or sweeping a survey is. `GROUPWORK.activities` is the list,
// and the activity has to *match* — a patrol flying past a mining crew is not helping them
// mine, and both keep their own company.
//
// ## Who gets what
//
// The player earns real practice in the skill the activity trains, at `playerShare` of a
// normal tick per partner. NPCs accumulate proficiency in the same skill on their derived
// dossier, which is what the knowledge base reads when somebody asks how good they are —
// so a miner who has spent an hour in a crowded seam genuinely is a better miner than one
// who has not, and says so when you ask about them.

import { S } from '../../core/state.js';
import { GROUPWORK } from '../../core/config.js';
import { practice } from './character.js';
import { crewEvent } from './crew.js';
import { npcDossier, store } from '../company/dossier.js';
import { transmit } from '../npc/comms.js';

/**
 * Which skill an activity trains. One place, so the player and the NPCs agree.
 *
 * Keyed by `GROUPWORK.activities`, and the two are checked against each other below rather
 * than merely being written next to each other — a config that lists an activity this file
 * cannot train would silently award nothing, which is the quietest possible bug.
 */
const SKILL_FOR = {
  mine: 'extraction',
  haul: 'commerce',
  patrol: 'gunnery',
  survey: 'sensors'
};

/** Every activity the config declares has a skill behind it. Asserted, not assumed. */
export const activitiesCovered = () =>
  GROUPWORK.activities.every(a => !!SKILL_FOR[a]) &&
  Object.keys(SKILL_FOR).every(a => GROUPWORK.activities.includes(a));

let timer = 0, lastAnnounce = -999, lastPartners = 0;

/**
 * What this ship is doing right now, or null.
 *
 * Read off the state that already exists rather than requiring anything to declare itself:
 * an NPC's role and its current order are enough to say what it is doing, and a flag every
 * caller has to remember to set is a flag half of them will forget.
 */
export function activityOf(u) {
  if (!u || u.hp <= 0) return null;
  // Only activities the config admits. A role that is not on the list is somebody doing
  // something this system has no opinion about, which is a fine thing to be.
  const ok = a => (GROUPWORK.activities.includes(a) ? a : null);
  if (u.mining || u.cutting) return ok('mine');
  if (u.role === 'miner' || u.type === 'miner') return ok('mine');
  if ((u.loaded || 0) > 0 || u.runningIn || u.role === 'hauler' || u.type === 'hauler') return ok('haul');
  if (u.faction === 'friendly' || u.role === 'combat' || u.type === 'patrol') return ok('patrol');
  if (u.role === 'survey' || u.surveying) return ok('survey');
  return null;
}

/** What the player is doing right now, or null. */
export function playerActivity() {
  if (S.docked || !S.running) return null;
  if (S.input && S.input.mining) return 'mine';
  if (S.scan && S.scan.active) return 'survey';
  // A consignment aboard makes the flight a haul, whatever else is going on — which is the
  // honest reading: the work is the cargo getting where it is going.
  const holds = S.cargo && (S.cargo.consigned || 0) > 0;
  if (holds) return 'haul';
  if (S.input && S.input.firing) return 'patrol';
  return null;
}

/**
 * One review pass.
 *
 * Deliberately on a timer rather than per-frame. Nobody's experience is urgent to the
 * millisecond, and the check is O(ships) with a distance test per ship — at sixty hertz
 * that is a real cost for a number that changes by a hundredth.
 */
export function updateGroupwork(dt) {
  timer += dt;
  if (timer < GROUPWORK.interval) return 0;
  const span = timer;
  timer = 0;

  const ships = S.world.npcs || [];
  if (!ships.length) return 0;

  // ── the player's own crew ──
  const mine = playerActivity();
  let partners = 0;
  if (mine) {
    const r2 = GROUPWORK.range * GROUPWORK.range;
    for (const n of ships) {
      if (n.position.distanceToSquared(S.player.position) > r2) continue;
      if (activityOf(n.userData) !== mine) continue;
      // Somebody actively shooting at you is not a colleague, whatever their day job.
      if (n.userData.faction === 'hostile') continue;
      partners++;
      if (partners >= GROUPWORK.maxPartners) break;
    }
    if (partners > 0) {
      const skill = SKILL_FOR[mine];
      const bonus = GROUPWORK.playerShare * GROUPWORK.perPartner * partners * span;
      if (skill) practice(skill, bonus);
      // The crew feel it too — a busy seam is a better shift than an empty one.
      crewEvent('teamwork', null, 0.02 * partners * span);
      announce(mine, partners);
    }
  }
  lastPartners = partners;

  // ── everybody else's ──
  //
  // Bounded per pass rather than exhaustive. A hundred-ship system reviewed pairwise is ten
  // thousand distance tests; the sample below walks the roster in a rotating window so every
  // ship is reviewed within a few passes and no single pass is the expensive one.
  const step = Math.max(1, Math.ceil(ships.length / 24));
  for (let i = cursor % Math.max(1, step); i < ships.length; i += step) {
    const a = ships[i];
    const act = activityOf(a.userData);
    if (!act) continue;
    let near = 0;
    const r2 = GROUPWORK.range * GROUPWORK.range;
    for (const b of ships) {
      if (b === a) continue;
      if (b.position.distanceToSquared(a.position) > r2) continue;
      if (activityOf(b.userData) !== act) continue;
      near++;
      if (near >= GROUPWORK.maxPartners) break;
    }
    if (!near) continue;
    creditNpc(a.userData, act, near * GROUPWORK.npcRate * span);
  }
  cursor++;

  return partners;
}

let cursor = 0;

/**
 * Put proficiency on an NPC's record.
 *
 * Through `npcDossier`/`store` rather than onto `userData`, because that record is the one
 * the knowledge base reads when the player asks "who is that" — and because a number on
 * `userData` dies with the hull, which would mean an experienced miner who respawns is a
 * novice again. `store` promotes a derived dossier to a persisted one, which is exactly the
 * right moment: this is the first thing that has ever happened to them.
 */
function creditNpc(u, act, amount) {
  const skill = SKILL_FOR[act];
  if (!skill || !(amount > 0) || !u.name) return;
  const d = npcDossier(u.name, { faction: u.faction, role: u.role });
  if (!d || !d.proficiency) return;
  const before = d.proficiency[skill] || 0;
  if (before >= 1) return;
  d.proficiency[skill] = Math.min(1, before + amount);
  d.groupHours = (d.groupHours || 0) + amount;
  if (d.derived && d.groupHours > 0.05) store(d);
}

/**
 * ARIA mentions the company you are keeping, occasionally.
 *
 * Rate-limited hard: this is flavour that makes a mechanic legible, and flavour that fires
 * every four seconds is not flavour, it is a log.
 */
function announce(act, partners) {
  if (S.time - lastAnnounce < GROUPWORK.announceEvery) return;
  lastAnnounce = S.time;
  const what = act === 'mine' ? 'working this seam'
             : act === 'haul' ? 'running the same lane'
             : act === 'patrol' ? 'flying the same sweep'
             : 'surveying alongside us';
  transmit({
    from: 'ARIA', faction: 'friendly', channel: 'company', kind: 'chatter', speaker: 'aria',
    text: `${partners} other crew ${what}. Quotas are up — we all learn faster with company.`
  });
}

/** What the last review found. For the HUD, the suite and ARIA's status line. */
export const groupworkReport = () => ({
  activity: playerActivity(),
  partners: lastPartners,
  bonus: lastPartners ? GROUPWORK.playerShare * GROUPWORK.perPartner * lastPartners : 0
});

export function resetGroupwork() { timer = 0; lastAnnounce = -999; lastPartners = 0; cursor = 0; }
