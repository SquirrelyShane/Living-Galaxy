// Living Galaxy — when ARIA thinks the fit is the problem.
//
// ## The rule this exists to keep
//
// The tool layer's founding line is that nothing ARIA does can lose you anything. The
// autopilot stretched that once, to "nothing you would not have spent anyway", bounded by a
// reserve. Buying a module is where it stops: a hull, a rack or a core is a real commitment
// with an opportunity cost only the player can weigh, and an assistant that spends nine
// thousand credits on a sensor core because a rule fired is an assistant nobody trusts with
// the throttle either.
//
// So she does not buy. She **opens a case**: what she thinks is the bottleneck, the reading
// that made her think so, what it would cost, and where to go. The player decides.
//
// ## Why the evidence travels with the recommendation
//
// Because a recommendation without it is indistinguishable from an upsell. "Fit a deep
// sensor core" is a shop; "the array reaches 1.9 Mm of the 4.6 Mm this hull is rated for,
// which is why we keep arriving at empty rock" is an argument, and it happens to be an
// argument the player can check against their own instruments.
//
// The evidence comes from `reasoner.js`'s trace, so the case she makes is literally the
// rule that fired — not a plausible sentence written next to it.

import { S } from '../../core/state.js';
import { ADVISOR } from '../../core/config.js';
import { fmtCr, fmtKm } from '../../core/utils.js';
import { MODULES } from '../../data/modules.js';
import { WEAPONS } from '../../core/config.js';
import { requestScreen } from '../../core/screens.js';
import { transmit } from './comms.js';
import { read } from './facts.js';
import { rackReport, magsReport } from './facts.js';

/**
 * The cases she knows how to make.
 *
 * Each one names the bottleneck, the modules that would fix it, and a `case` that reads the
 * live numbers back. Keyed by the `advise` directive the tree emits, so adding a rule that
 * concludes "power" needs no work here and adding a case needs no work in the tree.
 */
export const CASES = {
  weapons: {
    title: 'The rack is empty',
    urgency: 'high',
    fits: ['gauss', 'autocan', 'pulse'],
    kind: 'weapon',
    make: () => `We have no guns fitted. Anything that decides to press us gets to, and ` +
                `all I can do about it is run — which only works while the drive holds.`
  },

  ammunition: {
    title: 'Out of ammunition',
    urgency: 'high',
    fits: [],
    kind: 'ammo',
    make: () => {
      const m = magsReport();
      return `The racks are dry — ${m.feeds} feed${m.feeds === 1 ? '' : 's'} and nothing ` +
             `in any of them. A berth will sell rounds; I can buy them if you leave the conn with me.`;
    }
  },

  power: {
    title: 'The bank cannot feed this rack',
    urgency: 'medium',
    fits: ['capbank', 'fluxdamp', 'solararray'],
    kind: 'core',
    make: () => {
      const r = rackReport();
      const sustain = r.sustain === Infinity ? 'indefinitely' : `${r.sustain.toFixed(1)} s`;
      return `This fit draws ${r.drain.toFixed(1)} MW firing and the reactor makes ` +
             `${(S.stats.energyRegen || 0).toFixed(1)}. That is ${sustain} of continuous fire ` +
             `before the bank is flat, and a fight lasts longer than that.`;
    }
  },

  heat: {
    title: 'The radiators cannot keep up',
    urgency: 'medium',
    fits: ['heatsink'],
    kind: 'core',
    make: () => {
      const r = rackReport();
      const t = r.thermal === Infinity ? 'never' : `in ${r.thermal.toFixed(1)} s`;
      return `The rack trips the cutout ${t} of held fire. Every second past that is a ` +
             `second with no guns at all, which is worse than a slower gun that keeps working.`;
    }
  },

  sensors: {
    title: 'We cannot see far enough',
    urgency: 'low',
    fits: ['surveydish', 'sensorcore'],
    kind: 'core',
    make: () => {
      const have = read('sensor.range') || 0;
      const rated = S.stats.sensorRated || have;
      return `The array reaches ${fmtKm(have)} of the ${fmtKm(rated)} this hull is rated for, ` +
             `because nothing in the bays is a sensor. It is why we keep arriving somewhere ` +
             `and finding out what is there afterwards.`;
    }
  },

  cargo: {
    title: 'The hold is the bottleneck',
    urgency: 'low',
    fits: ['cargobay', 'oreproc'],
    kind: 'utility',
    make: () => `We fill up long before the field runs out, so every run is mostly travel. ` +
                `More hold is more ore per trip without flying a single extra kilometre.`
  },

  galley: {
    title: 'The crew are outrunning the galley',
    urgency: 'medium',
    fits: ['hydrobed'],
    kind: 'utility',
    make: () => {
      const days = read('farm.days');
      const net = read('farm.net') || 0;
      const left = days === Infinity ? 'indefinitely' : `${(days || 0).toFixed(1)} days`;
      return `Provisions last ${left} at the current headcount, and the farm is ` +
             (net >= 0 ? 'keeping up.' :
              `${Math.abs(net).toFixed(2)} kg an hour short. Beds close that gap permanently; ` +
              `buying stores closes it until the next time.`);
    }
  },

  hull: {
    title: 'This hull is the wrong hull',
    urgency: 'low',
    fits: [],
    kind: 'hull',
    make: () => `We are asking this class to do a job it was not built for. A yard would ` +
                `sell us something that is, and the difference would show up on every run after.`
  }
};

export const CASE_KEYS = Object.keys(CASES);

// ── raising one ──────────────────────────────────────────────────────

let lastAt = {};       // case key → S.time it was last raised

/** Everything she has ever raised this session, newest first. For the panel. */
const filed = [];
export const advisories = () => filed.slice().reverse();

/**
 * Should this case be raised right now?
 *
 * Rate-limited hard and per case. A recommendation repeated every three seconds is not a
 * recommendation, it is a nag, and the player learns to dismiss the channel rather than the
 * message. Once every few minutes at most, and never at all while something is shooting.
 */
export function canRaise(key) {
  if (!CASES[key]) return false;
  if (S.settings.advisories === false) return false;
  if ((read('threat.pressing') || 0) >= 1) return false;   // not mid-fight
  const at = lastAt[key];
  return at === undefined || (S.time - at) >= ADVISOR.cooldown;
}

/**
 * Build the case and put it in front of the player.
 *
 * @param {string} key      a CASES key
 * @param {object} [trace]  the reasoner clauses that led here, so the panel can show its work
 * @returns {object|null}   the advisory, or null when it was declined by the rate limit
 */
export function raise(key, trace) {
  if (!canRaise(key)) return null;
  const c = CASES[key];
  lastAt[key] = S.time;

  /* A fix can be a module or a gun, and the two live in different catalogues. Looked up in
     both rather than duplicated into one: `weapons` recommends a rack and `power` recommends
     a core, and neither should have to know which table the other reads. */
  const spare = Math.max(0, S.credits - ADVISOR.reserve);
  const options = (c.fits || [])
    .map(k => {
      const m = MODULES[k] || WEAPONS[k];
      return m ? { key: k, name: m.name, price: m.price || 0, desc: m.desc || '',
                   where: MODULES[k] ? 'fitting bay' : 'shipyard rack',
                   afford: (m.price || 0) <= spare } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.price - b.price);

  const adv = {
    key,
    at: S.time,
    title: c.title,
    urgency: c.urgency,
    kind: c.kind,
    body: safeMake(c),
    // The rule that fired, in the words the tree used. See the header for why this travels.
    evidence: (trace || []).slice(0, 4).map(t => ({
      fact: t.key, op: t.op, want: t.want, got: t.got
    })),
    options,
    credits: S.credits,
    spare
  };

  filed.push(adv);
  while (filed.length > ADVISOR.keep) filed.shift();

  // Said once on the radio and filed once in the panel. The radio is how you find out; the
  // panel is where it waits until you are somewhere you can act on it.
  transmit({ from: 'ARIA', faction: 'friendly', channel: 'company', kind: 'hail',
             speaker: 'aria', text: `${c.title}. ${adv.body}` });
  requestScreen('advisory', adv);
  return adv;
}

function safeMake(c) {
  try { return c.make(); } catch (e) { return c.title + '.'; }
}

/** Forget the rate limits and the file. A new game, a load, a new hull. */
export function resetAdvisor() { lastAt = {}; filed.length = 0; }

/** Diagnostics, and the suite. */
export const advisorReport = () => ({
  cases: CASE_KEYS.length,
  filed: filed.length,
  cooling: CASE_KEYS.filter(k => !canRaise(k))
});
