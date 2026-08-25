// Living Galaxy — the tutorial.
//
// Not a script. A sequence of *observations*.
//
// Every stage names a thing that has to become true in the world, and the world is
// checked on a slow cadence. Nothing is forced, nothing is modal, and no stage takes
// control of the ship. A pilot who was already mining when the mining stage opened
// completes it on the same tick it opens, which is exactly right: the tutorial should
// notice competence rather than interrupt it.
//
// It exists because the game's first five minutes silently assumed knowledge the player
// did not have — that a hardpoint has to be filled before the trigger does anything,
// that a station has to be hailed before it will hold a pad, that the belt is where the
// money is. Those are not hard ideas. They were simply never said.
//
// The end state is the part that matters. Finishing does not dump you back into a menu:
// it asks one question — carry on with what you were doing, or take what you have
// learned into a fresh start — and both answers are real. That is why `finish()` reports
// an outcome rather than doing anything itself.

import { S } from '../../core/state.js';
import { TUTORIAL } from '../../core/config.js';
import { interlockReport, armed } from './preflight.js';
import { transmit } from '../npc/comms.js';
import { toast, status } from '../../core/notify.js';
import { sfx } from './audio.js';

let checkT = 0;
const listeners = new Set();

const bag = () => (S.tutorial = S.tutorial || {
  active: false, stage: 0, base: null, stageT: 0, hinted: false,
  done: false, dismissed: false, completedAt: 0
});

export function onTutorial(fn) { listeners.add(fn); return () => listeners.delete(fn); }
const emit = () => { for (const fn of listeners) { try { fn(); } catch (e) { /* view fault */ } } };

// ── the stages ───────────────────────────────────────────────────────
//
// `base` snapshots the world when a stage opens, so "sell some ore" means *more* ore than
// you had, not a total you might already have satisfied. `hint` is the second line, shown
// only after TUTORIAL.hintDelay seconds — a player who gets it immediately never sees it.

const STAGES = [
  {
    id: 'arm',
    title: 'Bolt a gun on',
    body: 'Your hardpoints are what you shoot with. An empty mount is not a quiet weapon, ' +
          'it is no weapon — the trigger will tell you so. Open FIT and seat something.',
    hint: 'FIT is on the bottom row. Hardpoints tab, tap an empty slot, pick from the locker.',
    base: () => ({}),
    check: () => armed()
  },
  {
    id: 'fly',
    title: 'Get moving',
    body: 'Drag anywhere to steer, throttle on the bottom left. Space is big and mostly ' +
          'empty; the ship will not stop for you unless flight assist is on.',
    hint: 'Try 50% throttle and a slow turn. FA on the right column holds your nose where you put it.',
    base: () => ({ d: S.player.position.clone() }),
    check: b => S.player.position.distanceTo(b.d) > 900
  },
  {
    id: 'lock',
    title: 'Lock something up',
    body: 'Tap a contact in the list on the left, or hit the cycle button. A lock is what ' +
          'gives you range, a lead solution and — for launchers — anything to chase at all.',
    hint: 'Contacts panel, left side. Tap any line. The Locked panel appears under it.',
    base: () => ({}),
    check: () => !!S.target
  },
  {
    id: 'mine',
    title: 'Cut a rock',
    body: 'Find an asteroid, get inside beam range and hold MINE. Ore is the first money ' +
          'most pilots ever make, and the belt does not care who you are.',
    hint: 'Use the NAV chart to find a belt, warp to it, then close to a few hundred km.',
    base: () => ({ ore: S.cargo.ore }),
    check: b => S.cargo.ore > b.ore + 60
  },
  {
    id: 'sell',
    title: 'Sell it',
    body: 'Close on a station until it hails you, take the docking clearance, and trade. ' +
          'Prices differ between stations — that difference is a whole career for somebody.',
    hint: 'Slow down near a station and the dock prompt appears. Trade tab, sell all.',
    base: () => ({ cr: S.credits }),
    check: b => S.credits > b.cr + 400
  },
  {
    id: 'crew',
    title: 'Look at the people',
    body: 'The ship is not just you. Open CREW: a gunner who has been on watch is worth ' +
          'more than one who has not, and a tired crew is a slower ship.',
    hint: 'CREW on the bottom row. Roster tab. Post people where their speciality is.',
    base: () => ({}),
    check: () => !!bag().sawCrew
  },
  {
    id: 'threat',
    title: 'Know what is coming',
    body: 'You are visible. Standing, kills and credits all make you interesting to people ' +
          'you would rather not interest. Watch the threat line and the comms log.',
    hint: 'Open the comms log from the right column. Ships near you actually talk on it.',
    base: () => ({}),
    check: () => !!bag().sawComms
  }
];

export const stageCount = () => STAGES.length;
export const stages = () => STAGES.map(s => ({ id: s.id, title: s.title }));

// ── control ──────────────────────────────────────────────────────────

export function startTutorial() {
  const b = bag();
  b.active = true; b.done = false; b.dismissed = false;
  b.stage = 0; b.stageT = 0; b.hinted = false;
  b.base = STAGES[0].base();
  status('Flight training active');
  emit();
  return b;
}

/** Leave the training on but stop showing the card. It keeps tracking. */
export function dismissTutorial() { bag().dismissed = true; emit(); }
export function resumeTutorial() { bag().dismissed = false; emit(); }

/** Give up on it entirely. Never asked for again. */
export function skipTutorial() {
  const b = bag();
  b.active = false; b.done = true; b.skipped = true;
  status('Training skipped — you are on your own');
  emit();
}

export const tutorialActive = () => { const b = bag(); return b.active && !b.done; };
export const tutorialDone = () => !!bag().done;

export function tutorialState() {
  const b = bag();
  const st = STAGES[b.stage];
  return {
    active: b.active && !b.done,
    done: !!b.done,
    skipped: !!b.skipped,
    dismissed: !!b.dismissed,
    index: b.stage,
    total: STAGES.length,
    id: st ? st.id : null,
    title: st ? st.title : null,
    body: st ? st.body : null,
    hint: st && b.hinted ? st.hint : null
  };
}

// ── events the UI pushes in ──────────────────────────────────────────
// Two stages are about *looking at a panel*, which the world state cannot observe. They
// get an explicit event rather than a fake proxy condition.

export function tutorialEvent(kind) {
  const b = bag();
  if (kind === 'crew') b.sawCrew = true;
  else if (kind === 'comms') b.sawComms = true;
}

// ── the loop ─────────────────────────────────────────────────────────

export function updateTutorial(dt) {
  const b = bag();
  if (!b.active || b.done || !(dt > 0)) return;
  b.stageT += dt;

  if (!b.hinted && b.stageT > TUTORIAL.hintDelay) { b.hinted = true; emit(); }

  checkT += dt;
  if (checkT < TUTORIAL.checkInterval) return;
  checkT = 0;

  const st = STAGES[b.stage];
  if (!st) { finishStages(); return; }
  let passed = false;
  try { passed = !!st.check(b.base || {}); }
  catch (e) { passed = false; }               // a stage that throws must not stall training
  if (!passed) return;

  advance();
}

function advance() {
  const b = bag();
  const done = STAGES[b.stage];
  sfx.pickup();
  toast(`Training — ${done.title} ✓`, 2600);
  b.stage++;
  b.stageT = 0;
  b.hinted = false;
  if (b.stage >= STAGES.length) { finishStages(); return; }
  b.base = STAGES[b.stage].base();
  emit();
}

function finishStages() {
  const b = bag();
  b.done = true;
  b.completedAt = S.playtime;
  b.awaitingChoice = true;
  status('Flight training complete');
  transmit({ from: 'Flight Training', faction: 'coalition', channel: 'company', kind: 'system',
             text: 'Checklist closed. You have a gun bolted on, a hold you have filled and ' +
                   'emptied once, and a crew who know where they stand. The rest is yours.' });
  sfx.dock();
  emit();
}

/** Has the completion prompt been answered yet? */
export const awaitingChoice = () => !!bag().awaitingChoice;

/**
 * Answer the completion prompt.
 * @param {'continue'|'newgame'} choice
 * @returns {{outcome:string}} the caller (main.js) decides what a new game *means* —
 *   this module deliberately does not reach into the boot sequence.
 */
export function finish(choice) {
  const b = bag();
  b.awaitingChoice = false;
  b.active = false;
  emit();
  if (choice === 'newgame') {
    return { outcome: 'newgame' };
  }
  toast('Carry on. The board is at any station, and the belt is where it always was.', 4600);
  return { outcome: 'continue' };
}

// ── reporting & persistence ──────────────────────────────────────────

export function tutorialReport() {
  const b = bag();
  const il = interlockReport();
  return Object.assign(tutorialState(), {
    armed: il.armed,
    blockers: Object.keys(il).filter(k => il[k] && il[k].ok === false).map(k => `${k}:${il[k].code}`)
  });
}

export const serializeTutorial = () => {
  const b = bag();
  return { active: b.active, stage: b.stage, done: b.done, skipped: !!b.skipped,
           dismissed: !!b.dismissed, awaitingChoice: !!b.awaitingChoice,
           sawCrew: !!b.sawCrew, sawComms: !!b.sawComms, completedAt: b.completedAt || 0 };
};

export function restoreTutorial(data) {
  const b = bag();
  if (!data) { b.active = false; b.done = false; return false; }
  Object.assign(b, data);
  b.stage = Math.max(0, Math.min(STAGES.length, data.stage | 0));
  b.stageT = 0; b.hinted = false;
  // Rebase against the world as it is now, not as it was when the stage opened three
  // sessions ago — otherwise a saved "sell 400 more" baseline is either free or impossible.
  b.base = STAGES[b.stage] ? STAGES[b.stage].base() : null;
  return true;
}
