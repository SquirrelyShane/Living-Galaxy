// Living Galaxy — your agent, and the three jobs that teach you the game.
//
// A new pilot used to be dropped into a fully simulated system with a throttle and no
// reason to go anywhere. The tutorial was the README. An agent fixes that without a
// tutorial existing: someone who knows your career hands you a small job, then a second
// one that needs what the first taught you, then a third that pays properly.
//
// This is deliberately *not* the contract board — that is slice 5b, and it is a live
// market of expiring offers with standing at stake. This is a fixed, hand-written chain
// per career, which is a different thing and wants different code. Sharing an engine
// between "the one story we wrote" and "the thousand jobs we generate" would have made
// both worse.
//
// Credit thresholds were rescaled in 1.0 alongside the economy. They had been written
// when a full industrial hold sold for six figures, which made "bank 6,000 credits" a
// step you completed by accident before reading it.
//
// A step is complete when its `check` returns true. Checks are polled, not evented, so a
// step can be satisfied by any route the player finds — including one we did not think
// of. Killing the pirate with a mine you left an hour ago still counts.

import { S } from '../core/state.js';
import { CAREERS, agentFor } from '../data/origins.js';
import { addXp, practice } from './character.js';
import { adjust } from './reputation.js';
import { toast, status } from '../ui/toast.js';
import { sfx } from './audio.js';

// ── the chains ───────────────────────────────────────────────────────
// Each step: what it says, how it is judged, what it pays. `snapshot` captures a baseline
// at the moment the step opens, so "sell 400 kg" means 400 more than you had, not 400
// total — otherwise a pilot who happened to be carrying some already gets it free.

const CHAINS = {
  enforcer: [
    { id: 'enf1', title: 'Draw first blood',
      brief: 'Find something hostile and destroy it. The board does not care which.',
      snapshot: () => ({ kills: S.player.kills }),
      check: b => S.player.kills >= b.kills + 1,
      reward: { credits: 1200, xp: 90, standing: ['coalition', 3] } },
    { id: 'enf2', title: 'Clear a nest',
      brief: 'Three more. Consecutive is fine, careful is better — bring the hull back.',
      snapshot: () => ({ kills: S.player.kills }),
      check: b => S.player.kills >= b.kills + 3,
      reward: { credits: 3200, xp: 220, standing: ['coalition', 6], skill: ['gunnery', 40] } },
    { id: 'enf3', title: 'Bank it',
      brief: 'Dock somewhere Coalition and put 18,000 credits on the books. ' +
             'Dead pirates are not an income until you have landed.',
      snapshot: () => ({ credits: S.credits }),
      check: b => S.credits >= b.credits + 18000,
      reward: { credits: 2500, xp: 260, standing: ['coalition', 8] } }
  ],

  prospector: [
    { id: 'pro1', title: 'First cut',
      brief: 'Take 900 kg of ore out of the Meridian field.',
      snapshot: () => ({ ore: S.cargo.ore, sold: S.credits }),
      check: b => S.cargo.ore >= b.ore + 900 || S.credits >= b.sold + 2400,
      reward: { credits: 900, xp: 80, skill: ['extraction', 30] } },
    { id: 'pro2', title: 'Fill the hold',
      brief: 'Bring a hold worth having back to a refinery and sell it.',
      snapshot: () => ({ credits: S.credits }),
      check: b => S.credits >= b.credits + 12000,
      reward: { credits: 5500, xp: 200, standing: ['independent', 6] } },
    { id: 'pro3', title: 'Know the rock',
      brief: 'Survey two bodies. You cannot price a field you have never looked at.',
      snapshot: () => ({ scans: Object.keys(S.scans || {}).length }),
      check: b => Object.keys(S.scans || {}).length >= b.scans + 2,
      reward: { credits: 2600, xp: 240, standing: ['independent', 8], skill: ['sensors', 30] } }
  ],

  hauler: [
    { id: 'hau1', title: 'Make the crossing',
      brief: 'Warp somewhere. Anywhere. Get used to the spool.',
      snapshot: () => ({ t: S.playtime }),
      check: () => S.warp.state === 'cooldown' || S.warp.state === 'warping',
      reward: { credits: 700, xp: 70, skill: ['navigation', 25] } },
    { id: 'hau2', title: 'Run the route',
      brief: 'Dock at two different stations. Learn the pads before you learn the freight.',
      snapshot: () => ({ seen: [] }),
      check: b => { trackDock(b); return b.seen.length >= 2; },
      reward: { credits: 1800, xp: 170, standing: ['independent', 5] } },
    { id: 'hau3', title: 'Turn a load',
      brief: 'Clear 15,000 credits of freight. Margins are thin; volume is the answer.',
      snapshot: () => ({ credits: S.credits }),
      check: b => S.credits >= b.credits + 15000,
      reward: { credits: 3000, xp: 250, standing: ['independent', 8] } }
  ],

  broker: [
    { id: 'bro1', title: 'Read the book',
      brief: 'Dock and sell anything at all. Watch what the price does when you do.',
      snapshot: () => ({ credits: S.credits }),
      check: b => S.credits >= b.credits + 1200,
      reward: { credits: 800, xp: 80, skill: ['commerce', 30] } },
    { id: 'bro2', title: 'Work the spread',
      brief: 'Turn 12,000 credits of profit across any two stations.',
      snapshot: () => ({ credits: S.credits }),
      check: b => S.credits >= b.credits + 12000,
      reward: { credits: 6000, xp: 210, standing: ['independent', 6] } },
    { id: 'bro3', title: 'Buy your way up',
      brief: 'Hold 60,000 credits at once. A factor with no float is a spectator.',
      snapshot: () => ({}),
      check: () => S.credits >= 60000,
      reward: { credits: 3500, xp: 280, standing: ['coalition', 4], skill: ['commerce', 45] } }
  ],

  pathfinder: [
    { id: 'pat1', title: 'Look at something',
      brief: 'Scan any body. Properly — get close enough for it to mean anything.',
      snapshot: () => ({ scans: Object.keys(S.scans || {}).length }),
      check: b => Object.keys(S.scans || {}).length >= b.scans + 1,
      reward: { credits: 800, xp: 90, skill: ['sensors', 35] } },
    { id: 'pat2', title: 'Drop a probe',
      brief: 'Establish an orbit and put a probe down. Telemetry is worth more than a photo.',
      snapshot: () => ({ surveys: Object.keys(S.survey || {}).length }),
      check: b => Object.keys(S.survey || {}).length >= b.surveys + 1,
      reward: { credits: 2000, xp: 200, standing: ['independent', 6] } },
    { id: 'pat3', title: 'Go out to the rim',
      brief: 'Get 34,000 km from Solaris Prime and come back with the hull attached.',
      snapshot: () => ({}),
      check: () => S.player.position.length() > 34000,
      reward: { credits: 3200, xp: 300, standing: ['independent', 8], skill: ['navigation', 40] } }
  ],

  // The executive chain is the only one judged on the company's books rather than on the
  // pilot's hull. That is the whole point of the start: your first three jobs are to
  // prove the charter is not a piece of paper.
  executive: [
    { id: 'exe1', title: 'Capitalise the venture',
      brief: 'Put 4,000 credits of your own money into the treasury. The registry wants ' +
             'to see the founder exposed before anybody else is.',
      snapshot: () => ({ t: (S.company && S.company.treasury) || 0 }),
      check: b => !!S.company && S.company.treasury >= b.t + 4000,
      reward: { credits: 0, xp: 120, skill: ['commerce', 40] } },
    { id: 'exe2', title: 'Book revenue',
      brief: 'Turn a profit through the company, not through your wallet. Sell something, ' +
             'run a contract, work a spread — the ledger does not care which.',
      snapshot: () => ({ r: (S.company && S.company.revenue) || 0 }),
      check: b => !!S.company && S.company.revenue >= b.r + 6000,
      reward: { credits: 2400, xp: 220, standing: ['coalition', 5] } },
    { id: 'exe3', title: 'Put someone on the ground',
      brief: 'A charter that owns nothing is a letterhead. Found a planetary site, or ' +
             'install a manager on one you already hold.',
      snapshot: () => ({ n: (S.sites || []).length, m: Object.keys(S.managers || {}).length }),
      check: b => (S.sites || []).length > b.n || Object.keys(S.managers || {}).length > b.m,
      reward: { credits: 4200, xp: 340, standing: ['coalition', 6], skill: ['engineering', 40] } }
  ]
};

/** Stations visited, for the hauler's route step. */
function trackDock(b) {
  const st = S.docked;
  if (!st) return;
  const name = st.userData && st.userData.name;
  if (name && !b.seen.includes(name)) b.seen.push(name);
}

// ── lifecycle ────────────────────────────────────────────────────────

export function beginAgentChain() {
  const ch = S.character;
  if (!ch || !ch.created) return null;
  const chain = CHAINS[ch.career];
  if (!chain || !chain.length) return null;
  S.missions = { chain: ch.career, step: 0, base: chain[0].snapshot(), done: [] };
  return currentMission();
}

export function currentMission() {
  const m = S.missions;
  if (!m || m.step < 0) return null;
  const chain = CHAINS[m.chain];
  if (!chain || m.step >= chain.length) return null;
  const step = chain[m.step];
  return { id: step.id, title: step.title, brief: step.brief,
           index: m.step + 1, total: chain.length, reward: step.reward };
}

export const missionsComplete = () => {
  const m = S.missions;
  if (!m) return false;
  const chain = CHAINS[m.chain];
  return !!chain && m.step >= chain.length;
};

export function agentBriefing() {
  const ch = S.character;
  if (!ch || !ch.created) return null;
  const a = agentFor(ch.career, ch.lineage);
  if (!a) return null;
  return { agent: a, career: CAREERS[ch.career], mission: currentMission(),
           complete: missionsComplete() };
}

/** Polled from the frame loop. Cheap: one predicate on the active step. */
export function updateMissions() {
  const m = S.missions;
  if (!m) return;
  const chain = CHAINS[m.chain];
  if (!chain || m.step >= chain.length) return;
  const step = chain[m.step];

  let done = false;
  try { done = !!step.check(m.base); }
  catch (e) { done = false; }        // a malformed step must not take the loop with it
  if (!done) return;

  completeStep(step);
  m.done.push(step.id);
  m.step++;
  if (m.step < chain.length) {
    m.base = chain[m.step].snapshot();
    const next = chain[m.step];
    toast(`New assignment — ${next.title}`, 4200);
    status(next.title);
  } else {
    const a = agentFor(S.character.career, S.character.lineage);
    toast(`${a ? a.name : 'Your agent'} has nothing else for you. Fly your own way.`, 6000);
    status('Agent chain complete');
  }
}

function completeStep(step) {
  const r = step.reward || {};
  if (r.credits) S.credits += r.credits;
  if (r.xp) addXp(r.xp);
  if (r.skill) practice(r.skill[0], r.skill[1]);
  if (r.standing) adjust(r.standing[0], r.standing[1], 'contract completed');
  sfx.pickup();
  toast(`${step.title} — complete${r.credits ? ` · +${r.credits} cr` : ''}`, 4200);
}

export function serializeMissions() {
  const m = S.missions;
  if (!m) return null;
  // `base` holds live snapshot values and a `seen` array; it is plain data by design so
  // it round-trips without needing a custom serialiser per step.
  return { chain: m.chain, step: m.step, base: m.base, done: m.done.slice() };
}

export function restoreMissions(data) {
  if (!data || !CHAINS[data.chain]) return false;
  S.missions = { chain: data.chain, step: data.step || 0,
                 base: data.base || {}, done: (data.done || []).slice() };
  return true;
}

export const chainFor = career => CHAINS[career] || null;
