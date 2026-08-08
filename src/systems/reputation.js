// Living Galaxy — who you are to whom.
//
// Until 0.5 "faction" was a string on an NPC that meant one of exactly two things: shoot
// at the player, or don't. There was no way for that to change, so nothing you did in the
// world had consequences that outlived the fight. Killing forty pirates and killing none
// left you in identical standing with everybody.
//
// Reputation is a number per faction, -100 to +100, moved by what you actually do. It
// gates station services, scales bounty payouts, and decides who shoots first. The matrix
// part is that factions have opinions about *each other* too: helping one costs you with
// its enemies, at a rate the matrix sets, so there is no strategy that farms goodwill from
// everyone at once.

import { S } from '../core/state.js';
import { REP } from '../core/config.js';
import { toast, status } from '../ui/toast.js';

export const FACTIONS = ['coalition', 'pirate', 'independent'];

/** NPC faction tags map onto the three political blocs. */
export function blocOf(faction) {
  if (faction === 'friendly') return 'coalition';
  if (faction === 'hostile') return 'pirate';
  if (faction === 'merc') return 'independent';
  return 'independent';                       // workers, miners, haulers
}

export function standing(faction) {
  const f = FACTIONS.includes(faction) ? faction : blocOf(faction);
  const v = S.reputation && S.reputation[f];
  return typeof v === 'number' ? v : 0;
}

/** -100..+100 → a word the UI can print. */
export function standingLabel(v) {
  for (const band of REP.bands) if (v >= band.min) return band.name;
  return REP.bands[REP.bands.length - 1].name;
}

/**
 * Move standing with `faction` by `delta`, and with everyone else by the matrix.
 * Returns the map of what actually changed, after clamping.
 */
export function adjust(faction, delta, reason) {
  const bloc = FACTIONS.includes(faction) ? faction : blocOf(faction);
  if (!S.reputation) S.reputation = {};
  const changed = {};

  for (const other of FACTIONS) {
    const coupling = other === bloc ? 1 : (REP.matrix[bloc] && REP.matrix[bloc][other]) || 0;
    if (!coupling) continue;
    const before = standing(other);
    const after = Math.max(REP.min, Math.min(REP.max, before + delta * coupling));
    if (after !== before) {
      S.reputation[other] = after;
      changed[other] = after - before;
      announce(other, before, after, reason);
    }
  }
  return changed;
}

/** Only speak up when a threshold is crossed — a running total is noise. */
function announce(faction, before, after, reason) {
  const b = standingLabel(before), a = standingLabel(after);
  if (b === a) return;
  const better = after > before;
  status(`${titleCase(faction)} standing: ${a}`);
  toast(`${titleCase(faction)} now regards you as ${a.toLowerCase()}${reason ? ' — ' + reason : ''}`,
        better ? 3200 : 4200);
}

const titleCase = s => s.charAt(0).toUpperCase() + s.slice(1);

// ── consequences ─────────────────────────────────────────────────────

/** Will this faction's ships open fire on sight? */
export function isHostileTo(faction) {
  return standing(faction) <= REP.hostileBelow;
}

/** Will a station of this faction let you dock at all? */
export function dockingAllowed(faction) {
  return standing(faction) > REP.dockingBelow;
}

/**
 * Bounty multiplier. A faction that likes you pays better for the work — which is what
 * turns "shoot pirates" from a flat income into a career with a slope.
 */
export function bountyScale(faction) {
  const v = standing(faction);
  return 1 + Math.max(0, v / REP.max) * REP.bountyBonus;
}

/** Trade markup/discount from standing, applied on top of the station's own book. */
export function tradeScale(faction) {
  const v = standing(faction);
  return 1 + (v / REP.max) * REP.tradeBonus;
}

/**
 * What a kill is worth in standing. Killing a pirate is Coalition work; killing a
 * Coalition patrol is not, and the matrix makes sure it costs you.
 */
export function creditKill(npcFaction) {
  const bloc = blocOf(npcFaction);
  const gain = REP.killValue[bloc];
  if (gain === undefined) return null;
  // A kill hurts the victim's own bloc and helps its enemies — one call, matrix does both.
  return adjust(bloc, -gain, `${bloc} casualty`);
}

export function resetReputation() {
  S.reputation = {};
  for (const f of FACTIONS) S.reputation[f] = REP.start[f] || 0;
  return S.reputation;
}

/** Everything the UI needs in one call. */
export function reputationReport() {
  return FACTIONS.map(f => ({
    faction: f,
    value: standing(f),
    label: standingLabel(standing(f)),
    hostile: isHostileTo(f),
    docking: dockingAllowed(f)
  }));
}
