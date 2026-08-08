// Living Galaxy — the people aboard. Roles are departments; a crewman assigned to a
// department earns experience whenever that department is doing work, and levels
// into a passive bonus. This is the idle layer: it ticks while you fly, while you
// haul, and while you sit docked doing nothing at all.
//
// crewBonuses() is deliberately pure — state.js imports it, so it must not import
// state back or the module graph knots.

import { FATIGUE, CREW } from '../core/config.js';

export const CREW_ROLES = {
  engineer: { name: 'Engineer', dept: 'Engineering', icon: '⚡',
    desc: 'Reactor and shield loop — recharge rates',
    per: { energyRegenAdd: 0.34, shieldRegenAdd: 0.22 } },

  gunner: { name: 'Gunner', dept: 'Gunnery', icon: '✦',
    desc: 'Fire control — weapon damage',
    per: { weaponMult: 0.038 } },

  helm: { name: 'Helm', dept: 'Helm', icon: '⌖',
    desc: 'Flight control — thrust and handling',
    per: { thrustMult: 0.028, turnMult: 0.040 } },

  rigger: { name: 'Rig tech', dept: 'Extraction', icon: '⛏',
    desc: 'Mining rig — extraction rate',
    per: { miningMult: 0.062 } },

  survey: { name: 'Survey officer', dept: 'Survey', icon: '◎',
    desc: 'Sensors and assay — scan reach and resolution',
    per: { sensorMult: 0.036, scanRate: 0.09 } },

  medic: { name: 'Damage control', dept: 'Damage control', icon: '✚',
    desc: 'Field repair — armor and hull recovery',
    per: { naniteArmorAdd: 0.24, naniteHullAdd: 0.11 } },

  purser: { name: 'Quartermaster', dept: 'Hold', icon: '⚖',
    desc: 'Stowage and haggling — capacity and prices',
    per: { cargoPct: 0.030, tradeBonus: 0.016 } }
};

export const ROLE_KEYS = Object.keys(CREW_ROLES);

// Traits are rolled at hire. They multiply that crewman's contribution and their
// learning speed, so two level-4 gunners are never quite the same hire.
// Traits carry four numbers and a temperament. `will` is the multiplier on a crewman's own
// willpower roll — how hard they are to talk into something, in either direction.
//
// The spread is deliberate: a Zealot cannot be persuaded by you *or* by a Nexis influence
// net, and a Drifter can be persuaded by anyone who asks nicely. Neither is strictly
// better, which is the test every trait here has to pass.
export const CREW_TRAITS = {
  steady:   { name: 'Steady',      out: 1.00, learn: 1.00, wage: 1.00, will: 1.00, needs: 1.00,
              flavour: 'Does the job, does it the same way every time.' },
  quick:    { name: 'Quick study', out: 0.94, learn: 1.35, wage: 1.05, will: 0.90, needs: 1.00,
              flavour: 'Picks things up fast. Talks themselves into things fast too.' },
  veteran:  { name: 'Veteran',     out: 1.22, learn: 0.78, wage: 1.30, will: 1.25, needs: 0.90,
              flavour: 'Has seen it. Will tell you they have seen it.' },
  cheap:    { name: 'Green',       out: 0.82, learn: 1.15, wage: 0.62, will: 0.75, needs: 1.10,
              flavour: 'Cheap, eager, and has never been shot at.' },
  obsessive:{ name: 'Obsessive',   out: 1.14, learn: 1.05, wage: 1.18, will: 1.15, needs: 1.15,
              flavour: 'Will not leave a fault alone. Will not leave anything alone.' },
  drifter:  { name: 'Drifter',     out: 1.05, learn: 0.95, wage: 0.80, will: 0.70, needs: 0.85,
              flavour: 'Been on eleven ships. Not attached to this one either.' },

  // ── v1.00.30 ──────────────────────────────────────────────────────
  zealot:   { name: 'Zealot',      out: 1.08, learn: 0.90, wage: 0.95, will: 1.60, needs: 0.80,
              flavour: 'Believes something. Cannot be talked out of it, by you or anyone.' },
  hollow:   { name: 'Hollow',      out: 0.98, learn: 1.10, wage: 0.72, will: 0.45, needs: 0.95,
              flavour: 'Nexis got to them once. Whatever came back is suggestible.' },
  ironNerve:{ name: 'Iron nerve',  out: 1.02, learn: 0.95, wage: 1.12, will: 1.45, needs: 1.00,
              flavour: 'Unmoved by shouting, gunfire or the sound of a hull failing.' },
  glutton:  { name: 'Glutton',     out: 1.16, learn: 1.00, wage: 0.90, will: 0.95, needs: 1.45,
              flavour: 'Works like two people. Eats like three.' },
  ascetic:  { name: 'Ascetic',     out: 0.92, learn: 1.05, wage: 0.85, will: 1.20, needs: 0.55,
              flavour: 'Needs almost nothing. Gives almost nothing away either.' },
  natural:  { name: 'Natural',     out: 1.10, learn: 1.20, wage: 1.45, will: 1.00, needs: 1.00,
              flavour: 'Rare, expensive, and worth it.' }
};
export const TRAIT_KEYS = Object.keys(CREW_TRAITS);

const FIRST = ['Ka', 'Vel', 'Ori', 'Sten', 'Mira', 'Dax', 'Ilse', 'Toma', 'Rhen', 'Jun',
  'Ash', 'Nem', 'Cora', 'Bex', 'Halo', 'Sev', 'Yara', 'Pell', 'Odi', 'Wren'];
const LAST = ['Vantt', 'Okoro', 'Brandt', 'Silje', 'Marek', 'Ndiaye', 'Halvorsen', 'Quint',
  'Farrow', 'Ozdemir', 'Lund', 'Reyes', 'Achebe', 'Stroud', 'Kaur', 'Nyholm'];

/** Deterministic when handed a seeded rng; random otherwise. */
export function crewName(rng) {
  const r = rng ? () => rng.next() : Math.random;
  return FIRST[Math.floor(r() * FIRST.length)] + ' ' + LAST[Math.floor(r() * LAST.length)];
}

/**
 * How hard this person is to talk into something. Their own roll, scaled by temperament.
 *
 * Used in both directions on purpose. It is the chance you fail to persuade them to take a
 * post they hate — and the chance an enemy influence attempt bounces off. A crew of
 * pliable people does what you ask and also does what the boarding party's negotiator asks.
 */
export function willpowerOf(c) {
  const t = CREW_TRAITS[c.trait] || CREW_TRAITS.steady;
  return Math.max(0.05, Math.min(0.99, (c.will ?? 0.5) * (t.will || 1)));
}

/** Multiplier on this person's consumption of food, water and life support. */
export function needsOf(c) {
  const t = CREW_TRAITS[c.trait] || CREW_TRAITS.steady;
  return (t.needs || 1);
}

/** Where a crewman is standing right now. Falls back to their specialty. */
export const postOf = c => c.post || c.role;

/** What they trained as. `role` is the pre-1.00.10 field name, kept for old saves. */
export const specialtyOf = c => c.role;

/** Posted somewhere other than what they trained for? */
export const isCross = c => postOf(c) !== specialtyOf(c);

/** On watch? Absent field means yes — every pre-1.00.10 crewman was always on duty. */
export const onDuty = c => c.onDuty !== false;

/**
 * Effective output of one crewman: level, trait, morale, fatigue, injury and whether
 * they are standing somewhere they were trained for.
 *
 * Every multiplier here is bounded away from zero except being off duty, which is the one
 * case where contributing nothing is the *point*. Fatigue floors at FATIGUE.floor and
 * injury at CREW.injuryOutput, because a system that can zero out a department turns a
 * long run into a hard stop — a punishment rather than a tradeoff.
 */
export function crewOutput(c) {
  // On watch but on a break is still not at the station. Gating this only inside the
  // update loop would have meant a crewman on a break kept contributing their department
  // bonus while not, by any other measure, being there.
  if (!onDuty(c) || c.onBreak) return 0;
  const t = CREW_TRAITS[c.trait] || CREW_TRAITS.steady;
  const tired = 1 - (1 - FATIGUE.floor) * Math.max(0, Math.min(1, c.fatigue || 0));
  const hurt = 1 - CREW.injuryOutput * Math.max(0, Math.min(1, c.injury || 0));
  const cross = isCross(c) ? CREW.crossPenalty : 1;
  // Hunger and thirst, taken together as the worse of the two — a crewman who has eaten
  // but not drunk is not half as badly off as one who has done neither.
  const want = Math.max(c.hunger || 0, c.thirst || 0);
  const fed = 1 - CREW.needs.hungerOutput * Math.min(1, want);
  const boss = c.overseer ? 0 : 1;   // an overseer runs the ship; they do not man a post
  return boss * (c.level || 1) * t.out * (0.45 + 0.55 * (c.morale ?? 1)) *
         tired * hurt * cross * fed;
}

/**
 * Sum every crewman's contribution, credited to the post they are *standing at* rather
 * than the one they trained for. Pure — safe for state.js to call.
 */
export function crewBonuses(list) {
  const b = {};
  if (!list || !list.length) return b;
  for (const c of list) {
    const role = CREW_ROLES[postOf(c)];
    if (!role) continue;
    const out = crewOutput(c);
    if (out <= 0) continue;
    for (const k in role.per) b[k] = (b[k] || 0) + role.per[k] * out;
  }
  return b;
}

/** Who is standing at each post right now. */
export function manning(list) {
  const out = {};
  for (const k of ROLE_KEYS) out[k] = [];
  for (const c of (list || [])) {
    if (!onDuty(c)) continue;
    const p = postOf(c);
    if (out[p]) out[p].push(c);
  }
  return out;
}

/** One-line condition for the roster: the worst thing currently true of them. */
export function condition(c) {
  if (c.overseer) return 'overseeing';
  if (!onDuty(c)) return 'off watch';
  if ((c.thirst || 0) > CREW.needs.warnAt) return 'parched';
  if ((c.hunger || 0) > CREW.needs.warnAt) return 'hungry';
  if (c.onBreak) return 'on a break';
  if ((c.injury || 0) > 0.6) return 'badly hurt';
  if ((c.injury || 0) > 0.15) return 'injured';
  if ((c.fatigue || 0) >= FATIGUE.warnAt) return 'exhausted';
  if (isCross(c)) return 'off speciality';
  if ((c.morale ?? 1) < 0.5) return 'unhappy';
  if ((c.fatigue || 0) > 0.4) return 'tiring';
  return 'ready';
}

export function wageOf(c) {
  const t = CREW_TRAITS[c.trait] || CREW_TRAITS.steady;
  return Math.round((34 + 26 * ((c.level || 1) - 1)) * t.wage);
}
