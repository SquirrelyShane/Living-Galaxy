// Living Galaxy — ARIA at the stick.
//
// ## What this is
//
// A toggle, a task, and a voice. Flip AP on and ARIA picks the most useful thing the ship
// could be doing right now, says why, and flies it — travel, arrival, the work itself, and
// the paperwork at the end. Flip it off, or touch anything, and she hands the stick back
// mid-sentence.
//
// ## Why it is a task chooser and not a script
//
// The obvious autopilot is a macro: "fly to the belt, mine, fly back, sell, repeat". That
// is a worse game and a worse program. It is worse as a game because it has one answer to
// every situation, including the situations where the answer is obviously wrong — a hull at
// 30% flying past a repair bay to go mining. It is worse as a program because the moment
// the world does something unexpected the script is off its rails with no way to notice.
//
// So: a **needs** model. Every few seconds ARIA scores what the ship could be doing against
// what it actually needs — a hurt hull wants a berth, a full hold wants a market, an empty
// one wants a seam — takes the winner, and re-checks. Nothing is scripted end to end, which
// means nothing can be halfway through a script when the situation changes.
//
// ## Why every task ends at a station
//
// Because the ask was specific and it is the right instinct: the interesting part of a
// twenty-minute ore run is the two minutes at either end. Docking is where the *decisions*
// are — what to repair, what to re-arm with, which of the board's jobs this hull is even
// cleared to take — and ARIA doing the boring middle so the player is present for the ends
// is the whole value proposition.
//
// ## The spending rule
//
// She spends on the hull and on nothing else: repair, ammunition, probes, and accepting
// work the board says this hull qualifies for. No hulls, no modules, no company contracts,
// no job with a gate on it she has not already cleared. That is the same line the tool layer
// has held since it was written — "nothing here can lose you anything" — raised by exactly
// one notch, to "nothing here can lose you anything you would not have spent anyway", and
// bounded by `AUTOPILOT.reserve` and `AUTOPILOT.spendShare` so she cannot strand you.

import { S, cargoFree, cargoMass, recalcStats } from '../../core/state.js';
import { AUTOPILOT, MINING } from '../../core/config.js';
import { fmtCr } from '../../core/utils.js';
import { setTarget } from '../flight/targeting.js';
import { startApproach, requestDocking, closeHail } from '../flight/approach.js';
import { toggleWarp, setCourse, inGravityWell, wellRadius } from '../flight/warp.js';
import { nearestMineable } from '../flight/contacts.js';
import { undock, sellAll, repair, repairQuote, ammoForSale, buyAmmo,
         ammoStackPrice, buyProbe, probeCost } from '../trade/economy.js';
import { AMMUNITION } from '../../data/crafting/ammo.js';
import { boardFor, acceptBlocker, acceptContract, activeContracts, payFor,
         deliverableAt, deliverConsignment } from '../trade/contracts.js';
import { fittedFeeds, magazineReport } from '../combat/magazine.js';
import { transmit } from './comms.js';
import { status } from '../../core/notify.js';
import { requestScreen } from '../../core/screens.js';
import { decide, explain } from './reasoner.js';
import { raise as raiseAdvisory } from './advisor.js';
import { deployPanels, stowPanels, panelState, warpBlocked } from '../industry/habitat.js';
import { sweep } from './sweep.js';
import { canWarp } from '../platform/preflight.js';
import { DOCTRINES, DOCTRINE_KEYS, DEFAULT_DOCTRINE, biasFor, floorFor, refuses }
  from '../../data/doctrine.js';

// ── the switch ───────────────────────────────────────────────────────

const ap = {
  on: false,
  task: null,          // key of the running task
  phase: 'plan',
  t: 0,                // seconds in the current phase
  review: 0,
  settle: 0,
  saidAt: -99,
  target: null,        // the station or rock this task is about
  line: 'Standing by',
  spent: 0,            // credits this docking has cost
  serviced: false,
  handoff: null,       // why she stopped, for the HUD
  brief: null,         // the last decision from the reasoner, with its trace
  holdFire: false,     // she has decided not to shoot — read by the trigger
  tookJob: false,      // she signed for something on this pad visit
  dry: 0,              // consecutive plans that found nothing to fly
  wellMark: null,      // the point outside a gravity well she is burning for
  padDry: -999         // when she last left a berth having achieved nothing there
};

// ── what kind of ship this is ────────────────────────────────────────
//
// The needs model knows what the ship needs. It has never known what the *player* wants,
// which is why two identical hulls in identical systems behaved identically no matter what
// their owners were trying to do. A doctrine is that missing input — see data/doctrine.js
// for why it weights the scorer rather than replacing it.
//
// Kept in `S.settings` rather than in `ap`, because it is a preference and not flight state:
// it should survive a save, a new hull and switching the autopilot off and on again.

export function doctrine() {
  const k = S.settings && S.settings.doctrine;
  return DOCTRINE_KEYS.includes(k) ? k : DEFAULT_DOCTRINE;
}

export function setDoctrine(key) {
  if (!DOCTRINE_KEYS.includes(key)) return doctrine();
  S.settings.doctrine = key;
  const d = DOCTRINES[key];
  // A change of doctrine invalidates the plan, not just the preference — carrying on to a
  // rock because the order to stop hunting arrived mid-flight is the wrong reading of it.
  failed.clear();
  ap.dry = 0;
  if (ap.on) {
    say(`${d.name}. ${d.blurb}`, true);
    releaseControls();
    enter('plan');
  } else status(`Doctrine — ${d.name}`);
  return key;
}

/** Is ARIA flying? */
export const autopilotOn = () => ap.on;

/** What she is doing, for the HUD switch and the suite. */
export const autopilotReport = () => ({
  on: ap.on, task: ap.task, phase: ap.phase, line: ap.line,
  target: ap.target && ap.target.userData ? ap.target.userData.name : null,
  // The reasoner's last word, so the HUD, ARIA's own answers and the suite all read the
  // same decision rather than three approximations of it.
  posture: ap.brief ? ap.brief.posture : null,
  holdFire: ap.holdFire,
  why: ap.brief ? explain(ap.brief) : null,
  path: ap.brief ? ap.brief.path.slice() : [],
  // What she has stopped trying, and how many plans in a row have come up empty. Both are
  // things a player watching an idle ship needs to be able to see without guessing.
  bench: autopilotBench(),
  dry: ap.dry || 0,
  doctrine: doctrine(),
  doctrineName: (DOCTRINES[doctrine()] || {}).name || null
});

/** Is she holding the trigger down? Read by the weapon path while she has the conn. */
export const autopilotHoldingFire = () => ap.on && ap.holdFire;

/**
 * Turn it on or off.
 *
 * Turning it *off* always succeeds and always stops immediately: an autopilot with a
 * condition on being switched off is a trap. Turning it on can be refused, and when it is
 * the refusal names a reason, because a switch that does nothing and says nothing is
 * indistinguishable from a broken switch.
 */
export function setAutopilot(on, reason) {
  const want = !!on;
  if (want === ap.on) return ap.on;

  if (want) {
    if (S.sim.disabled) { say('Drives are out. I cannot fly her like this.'); return false; }
    ap.on = true;
    ap.phase = 'plan';
    ap.t = 0; ap.review = 0; ap.settle = 0;
    ap.task = null; ap.target = null; ap.handoff = null;
    ap.line = 'Taking the stick';
    say('I have the stick. Working out what we need.');
    status('AUTOPILOT — ARIA has the conn');
  } else {
    ap.on = false;
    releaseControls();
    ap.line = reason || 'Standing by';
    ap.handoff = reason || null;
    say(reason ? `You have the stick — ${reason.toLowerCase()}.` : 'You have the stick.');
    status('Autopilot off — manual control');
  }
  return ap.on;
}

export const toggleAutopilot = () => setAutopilot(!ap.on);

/**
 * Hand the controls back without ceremony.
 *
 * Called by `ui/controls.js` the moment a finger lands on anything. Separate from
 * `setAutopilot(false)` only in that it is the *player's* doing, so it says so — and it is
 * a no-op when she was not flying, which is the common case and must cost nothing.
 */
export function yieldAutopilot() {
  if (!ap.on) return false;
  setAutopilot(false, 'manual input');
  return true;
}

function releaseControls() {
  // Whatever else this tears down, it comes off the trigger first. A handover that leaves
  // the guns firing is the single worst thing an autopilot can do on the way out.
  S.input.firing = false;
  S.approach = null;
  S.follow = null;
  S.input.mining = false;
  if (S.warp.state === 'spooling') toggleWarp();     // do not leave a hot core behind
}

// ── the voice ────────────────────────────────────────────────────────
//
// Everything ARIA does goes through here, on the company channel, rate-limited so a busy
// docking is a conversation rather than a wall of text. `ui/comms.js` types it out a
// character at a time — see `ui/typewriter.js` — so the pacing on screen is a person
// talking, which is the whole reason the dialogue is worth writing at all.

function say(text, force) {
  if (!force && S.time - ap.saidAt < AUTOPILOT.chatterGap) return false;
  ap.saidAt = S.time;
  ap.line = text;
  transmit({ from: 'ARIA', faction: 'friendly', channel: 'company', kind: 'chatter',
             speaker: 'aria', text });
  return true;
}

/** Say something *to* somebody — a berth, a miner, a patrol. Their name leads. */
function hailTo(who, text) {
  ap.saidAt = S.time;
  ap.line = text;
  transmit({ from: 'ARIA', faction: 'friendly', channel: 'local', kind: 'hail',
             speaker: 'aria', text: `${who}, ${text}` });
}

/** The line she uses on the way in, chosen by what the berth is for. */
const BERTH_LINE = {
  military:   n => `${n} control — inbound, weapons cold, requesting a service berth.`,
  industrial: n => `${n} traffic — inbound with ore to move and a hull that needs work.`,
  logistics:  n => `${n} dispatch — slot us between your freight runs, we will not be long.`,
  economic:   n => `${n} concierge — inbound. We are buying and selling, in that order.`,
  civilian:   n => `${n} approach — inbound for repair and resupply.`
};

// ── the needs model ──────────────────────────────────────────────────

/**
 * Score every task the ship could be doing.
 *
 * Scores are not probabilities and are not normalised; they are a priority order with room
 * between the entries so a small change in the world does not flip the decision. The
 * highest positive score wins, and a task that cannot be flown at all scores nothing rather
 * than being filtered out separately — "there is no field in range" and "mining is a bad
 * idea right now" are the same answer from the outside.
 */
export function scoreTasks() {
  const st = S.stats, p = S.player;
  const hullFrac = st.hullMax ? p.hull / st.hullMax : 1;
  const holdFrac = st.cargoCap ? cargoMass() / st.cargoCap : 0;
  const out = [];

  // Servicing. Outranks everything when the hull is hurt or the racks are empty, because
  // both of those are how a flight ends rather than how it goes badly.
  const dry = fittedFeeds().some(f => magazineReport(f).total === 0);
  const berth = nearestStation();
  if (berth) {
    // What a berth can do for us *that we can pay for*.
    //
    // This is the fix for the loop: repairs and rounds are things you buy, and a hull with
    // eight hundred credits cannot buy either. Scoring them anyway sent her to a pad, round
    // a checklist where every line was unaffordable, back out, and — because nothing about
    // the hull had changed — straight back in. Selling and delivering are the two that pay
    // *us*, so those still count when the account is empty; everything else is gated on
    // being able to settle the bill.
    const spare = Math.max(0, S.credits - AUTOPILOT.reserve);
    const owed = repairQuote();
    const canFix = hullFrac < AUTOPILOT.repairBelow && owed.cost > 0 && owed.cost <= spare;
    const canArm = dry && spare > AUTOPILOT.reserve * 0.5;
    const selling = holdFrac >= AUTOPILOT.sellAbove;
    const delivering = deliverableAt(berth).length > 0;
    // A pad visit that achieved nothing puts servicing on ice, unless there is now
    // something to sell or hand over — which is a change in the world rather than a
    // change of mind.
    const iced = S.time - ap.padDry < AUTOPILOT.padCooldown && !selling && !delivering;

    if (!iced && (canFix || canArm || selling || delivering || activeContracts().length === 0)) {
      let s = 10;
      if (canFix) s += (AUTOPILOT.repairBelow - hullFrac) * 260;
      if (canArm) s += 45;
      if (selling) s += 55;
      if (delivering) s += 70;
      out.push({ key: 'service', score: s, target: berth,
                 why: canFix ? 'the hull needs work'
                    : canArm ? 'the racks are empty'
                    : selling ? 'the hold is full'
                    : delivering ? 'we are carrying something that ends there'
                    : 'there is a board to read' });
    }
  }

  // Hunting. Scored low by default — she is not a warship and this is not what the hull is
  // for — and rises sharply when the account is empty, because at that point a bounty is
  // the only thing on the list that turns into credits without something to sell first.
  const mark = huntable();
  if (mark) {
    const broke = S.credits < AUTOPILOT.broke;
    const u = mark.userData || {};
    out.push({ key: 'hunt', score: (broke ? 58 : 18) + (u.bounty ? 22 : 0), target: mark,
               why: u.bounty ? `there is a price on ${u.name || 'that one'}`
                             : 'something hostile is inside reach and we are not' });
  }

  // Mining. Only when there is somewhere to put it and something to cut.
  const rock = nearestMineable();
  if (rock && cargoFree() > 50 && holdFrac < AUTOPILOT.sellAbove) {
    out.push({ key: 'mine', score: 30 + (1 - holdFrac) * 25, target: rock.obj,
               why: 'the hold has room and there is rock in range' });
  }

  // Delivering a consignment somewhere that is not here.
  const run = activeContracts().find(c => c.dest && (c.loaded || 0) > 0);
  if (run) {
    const to = stationNamed(run.dest);
    if (to && to !== berth) out.push({ key: 'deliver', score: 62, target: to,
                       why: `${run.title || 'a consignment'} is due at ${to.userData.name}` });
  }

  // ── the player's own preference, applied last ─────────────────────
  //
  // Last on purpose. Every score above is an answer to "what does this ship need"; the
  // doctrine is the answer to "what is this ship *for*", and the second only makes sense
  // applied on top of the first.
  //
  // A refused task drops out entirely. A floored one is lifted to at least its floor, which
  // is what stops a doctrine's speciality being edged out by a higher-scoring distraction —
  // it cannot *invent* one, because a task with no target is not something the ship can be
  // sent to do. See data/doctrine.js.
  const dk = doctrine();
  const weighted = out
    .filter(x => !refuses(dk, x.key))
    .map(x => ({ ...x,
                 score: Math.max(x.score * biasFor(dk, x.key), floorFor(dk, x.key)) }));

  // Bounty work is fussy in a way plain war is not: no price on it, no interest in it.
  const doc = DOCTRINES[dk];
  const final = doc && doc.bountyOnly
    ? weighted.filter(x => x.key !== 'hunt' ||
        (x.target && x.target.userData && x.target.userData.bounty))
    : weighted;

  final.sort((a, b) => b.score - a.score);
  return final;
}

// ── the reasoner, and what she does about it ─────────────────────────
//
// `scoreTasks()` answers *which berth, which rock, which consignment* — it resolves
// targets, and it is good at that. `reasoner.js` answers *what kind of thing should we be
// doing at all*, from twelve inputs the scorer never looked at: heat, sustain, closing
// rate, the state of the arrays.
//
// So they are not rivals and neither was deleted. The tree picks the task; the scorer
// picks the target for it. Where the tree has no opinion the scorer's own order stands,
// which is what keeps the old behaviour intact on a quiet map.

/* Tree task → the scorer's key. Several tree tasks resolve to the same flight: "sell" and
   "service" are both a berth, and which one she says out loud comes from the reason, not
   from a second code path. */
const TASK_FLIGHT = {
  service: 'service',
  sell:    'service',
  deliver: 'deliver',
  mine:    'mine',
  salvage: 'mine',
  hunt:    'hunt',
  // "Go and earn something" is a decision without a destination: which of mining, hunting
  // or reading a board is the answer depends on what is actually in range, and that is the
  // scorer's job. Undefined rather than null, so `plan()` falls through to the scorer's own
  // order instead of settling.
  charge:  null,        // handled entirely by directives — nowhere to fly
  run:     null,        // a posture, not a destination
  hold:    null
};

/**
 * Everything the tree decided that is not a place to fly.
 *
 * Run every frame rather than every review, because these are the fast ones — an array
 * that should be coming in should start coming in now, not in four seconds.
 */
function applyDirectives(d) {
  ap.brief = d;
  ap.holdFire = !!(d.holdFire || d.vent);

  // The arrays. `deployPanels` refuses under way and while the core is running, so this is
  // a request rather than a command and the habitat has the final word.
  if (d.stowPanels && panelState() !== 'stowed') stowPanels();
  else if (d.deployPanels && panelState() === 'stowed') deployPanels();

  // A cap, not a setting: she may slow down for a rule, never speed up for one.
  if (d.throttleCap !== null && Math.abs(S.player.throttle) > d.throttleCap) {
    S.player.throttle = Math.sign(S.player.throttle) * d.throttleCap;
  }

  // Money. Rate-limited and refused mid-fight inside `advisor.js`, so this is allowed to
  // ask every frame and will be told no almost every time.
  if (d.advise) raiseAdvisory(d.advise, d.trace);
}

/**
 * Is this crossing worth a spool?
 *
 * One place, because three callers used to decide it separately and one of them — the plan
 * step — was reading the sensor array, which is not a fact about the journey.
 */
function worthWarping(target) {
  if (!target || !target.position) return false;
  if (S.warp.state !== 'idle') return false;
  if (S.player.energy < AUTOPILOT.warpEnergy) return false;
  if (warpBlocked()) return false;              // arrays out — the core will not spool
  return target.position.distanceTo(S.player.position) > AUTOPILOT.warpBeyond;
}

/**
 * Lay the course and light it.
 *
 * ## Why this returns a *reason*, not a boolean
 *
 * The reported bug was "she still just approaches instead of warping", and the previous
 * fix — an absolute distance threshold — was necessary and not sufficient. The threshold
 * said *yes, warp*; the core then said *no*, silently, and the caller fell through to the
 * sublight approach with nothing said and nothing logged. From the cockpit that is
 * indistinguishable from an autopilot that never considered warping at all.
 *
 * The commonest `no` by far is the one the player will hit every single time: **stations
 * orbit planets**, so a ship sitting at a berth — or anywhere in the inner system — is
 * inside a gravity well, and the core will not hold inside one. That is not a refusal to
 * warp, it is a *precondition that has to be flown out of*, and nothing was flying it.
 *
 * @returns {string|null} null when the core took it, otherwise why it did not
 */
function spoolTo(target, name) {
  const clear = canWarp();
  if (!clear.ok) return clear.reason || 'the core will not spool';
  const well = inGravityWell(S.player.position, target);
  if (well) return 'well:' + ((well.userData && well.userData.name) || 'gravity');
  setCourse(target, name);
  toggleWarp();
  return S.warp.state !== 'idle' ? null : 'the core would not light';
}

/**
 * Burn out of the well we are sitting in, so the core will hold.
 *
 * Straight out from the body, at real power, until we are past its edge — then the caller
 * asks for the spool again. This is a short, boring, entirely mechanical manoeuvre and its
 * absence is why a fifteen-thousand-unit crossing was being flown at a quarter throttle.
 */
function clearTheWell(body) {
  const b = body || inGravityWell(S.player.position, ap.target);
  if (!b) return false;
  const u = b.userData || {};
  // A point just outside the well edge, on the far side from the body — which is roughly
  // where we already want to be going if the destination is elsewhere in the system.
  const out = S.player.position.clone().sub(b.position);
  if (out.lengthSq() < 1) out.set(1, 0, 0);
  out.normalize();
  const edge = (u.radius || 40) + wellRadius(u) * 1.12;
  ap.wellMark = { position: b.position.clone().addScaledVector(out, edge),
                  userData: { name: `clear of ${u.name || 'the well'}`, radius: 0 } };
  S.approach = null;
  setTarget(ap.wellMark, 'point', ap.wellMark.userData.name, 'neutral');
  if (!startApproach({ power: AUTOPILOT.wellClearPower })) return false;
  enter('clearwell');
  return true;
}

/** How far the *hull* is from a berth's hull, which is what every range here means. */
function gapTo(obj) {
  if (!obj || !obj.position) return Infinity;
  const r = (obj.userData && obj.userData.radius) || 0;
  return obj.position.distanceTo(S.player.position) - r;
}

/**
 * Can this hull go looking for a fight, and is there one to go and look at?
 *
 * Deliberately conservative. An autopilot that picks fights it cannot finish is worse than
 * one that never picks any: the first loses you a hull, the second only loses you time.
 */
function huntable() {
  const st = S.stats, p = S.player;
  if (!(st.mounts || []).filter(Boolean).length) return null;
  if (st.hullMax && p.hull / st.hullMax < AUTOPILOT.huntHull) return null;
  // A rack with a magazine and nothing in it will not win anything.
  const feeds = fittedFeeds();
  if (feeds.length && feeds.every(f => magazineReport(f).total === 0)) return null;
  const s = sweep();
  const near = s.hostiles[0];
  if (!near || near.d > AUTOPILOT.huntRange) return null;
  return near.obj || null;
}

function nearestStation() {
  let best = null, bd = Infinity;
  for (const st of S.world.stations) {
    const d = st.position.distanceToSquared(S.player.position);
    if (d < bd) { bd = d; best = st; }
  }
  return best;
}

function stationNamed(name) {
  if (!name) return null;
  const want = String(name).toLowerCase();
  return S.world.stations.find(s => (s.userData.name || '').toLowerCase() === want) || null;
}

// ── the loop ─────────────────────────────────────────────────────────

export function updateAutopilot(dt) {
  if (!ap.on) return;
  if (S.sim.disabled) { setAutopilot(false, 'drives are out'); return; }

  ap.t += dt;
  ap.review += dt;

  // The tree first, every frame. Its directives are the fast half of the decision —
  // arrays, throttle caps, trigger discipline — and they must not wait for a review tick.
  const brief = decide();
  applyDirectives(brief);

  // Anything the last phase left behind, before this one acts on a world it half-owns.
  if (orphanSweep()) return;

  switch (ap.phase) {
    case 'plan':    plan(dt); break;
    case 'travel':  travel(dt); break;
    case 'clearwell': clearwell(dt); break;
    case 'work':    work(dt); break;
    case 'berth':   berthing(dt); break;
    case 'docked':  onPad(dt); break;
    case 'settle':
      ap.settle -= dt;
      if (ap.settle <= 0) enter('plan');
      break;
  }

  // ── the second look ───────────────────────────────────────────────
  //
  // A task chooser that only chooses at the start of a task is a script with extra steps.
  // Every `AUTOPILOT.review` seconds she re-scores, and abandons what she is doing if
  // something has become *substantially* more urgent — a raider opening up on the hull
  // while she is halfway to a rock is the case this exists for.
  //
  // The margin is what stops it dithering. Without one, two tasks a point apart trade the
  // lead every three seconds and the ship never arrives anywhere.
  if (ap.review >= AUTOPILOT.review) {
    ap.review = 0;
    if (ap.phase === 'travel' || ap.phase === 'work') {
      // The tree's word first, and it does not need a margin: it only changes its mind when
      // a *named condition* changed, which is a real event rather than two scores crossing.
      const want = TASK_FLIGHT[brief.task];
      if (want !== undefined && want !== ap.task) {
        say(`Changing plan — ${brief.reason}.`, true);
        releaseControls();
        enter('plan');
        return;
      }
      // Below the tree, the scorer's own second look, margin and all. This is what handles
      // "the same kind of task, but somewhere better" — a nearer berth, a fatter rock.
      const best = scoreTasks()[0];
      const here = scoreTasks().find(x => x.key === ap.task);
      if (best && best.key !== ap.task && best.score > (here ? here.score : 0) + 40) {
        say(`Changing plan — ${best.why}.`, true);
        releaseControls();
        enter('plan');
        return;
      }
    }
  }

  // ── the stall watchdog ────────────────────────────────────────────
  //
  // Everything above can wait for the world; nothing above may wait for it forever.
  //
  // It used to stop there, and stopping there was the bug: it re-planned into a chooser
  // with no memory, which picked the same task and the same target and stalled again. The
  // watchdog now *writes the failure down* — see the ledger above — so the next plan is
  // choosing from a shorter list, and the one after that shorter still, until either
  // something works or there is nothing left and she says so.
  if (ap.phase !== 'settle' && ap.t > AUTOPILOT.stallAfter) {
    const done = markFailed(ap.task, ap.target, 'stalled');
    say(done ? `${labelFor(ap.task)} is not working. Leaving that one alone for a bit.`
             : 'That is not working. Trying something else.', true);
    releaseControls();
    enter('settle');
    ap.settle = AUTOPILOT.settle;
  }
}

const labelFor = k => k === 'mine' ? 'Cutting rock'
                    : k === 'service' ? 'That berth'
                    : k === 'deliver' ? 'That delivery'
                    : k === 'hunt' ? 'That contact'
                    : 'That';

// ── what did not work ────────────────────────────────────────────────
//
// The bug this exists for, in one sentence: the stall watchdog said "that is not working,
// trying something else" and then handed control to a planner with no memory of what had
// just failed, which chose the same task and the same target and stalled again — forever,
// until somebody touched the stick.
//
// A plan that fails is a *fact about the world*, not a hiccup. It gets written down.

const failed = new Map();          // 'task@target' → { n, at }

const ledgerKey = (task, target) =>
  `${task}@${(target && ((target.userData && target.userData.name) || target.name)) || '—'}`;

/** Record a failure, and say whether that was the last straw. */
function markFailed(task, target, why) {
  if (!task) return false;
  const k = ledgerKey(task, target);
  const e = failed.get(k) || { n: 0, at: 0 };
  e.n++;
  e.at = S.time;
  failed.set(k, e);
  // Bounded: a long session with a lot of rocks should not grow this without limit.
  if (failed.size > 64) {
    const oldest = [...failed.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) failed.delete(oldest[0]);
  }
  return e.n >= AUTOPILOT.benchAfter;
}

/** Is this task-and-target sitting out? */
function benched(task, target) {
  const e = failed.get(ledgerKey(task, target));
  if (!e) return false;
  if (S.time - e.at > AUTOPILOT.benchFor) { failed.delete(ledgerKey(task, target)); return false; }
  return e.n >= AUTOPILOT.benchAfter;
}

/** It worked. Forget the near-misses, or a berth that once refused is benched for ever. */
function markWorked(task, target) { failed.delete(ledgerKey(task, target)); }

/** For the report and the suite. */
export const autopilotBench = () =>
  [...failed.entries()].filter(([, e]) => e.n >= AUTOPILOT.benchAfter).map(([k]) => k);

// ── phases own things, and must let go of them ───────────────────────
//
// `enter()` used to set two fields. Everything a phase had started — an approach, a docking
// request, a held trigger — simply stayed running into the next one, and the orphan then
// fought whatever the new phase was doing. Each phase now declares what it is allowed to
// own, and the transition tears down the rest.

const PHASE_OWNS = {
  plan:   [],
  settle: [],
  travel: ['approach', 'warp'],
  clearwell: ['approach'],
  work:   ['approach', 'mining', 'firing'],
  berth:  ['docking', 'follow', 'approach'],
  docked: []
};

function enter(phase) {
  const keep = new Set(PHASE_OWNS[phase] || []);
  if (!keep.has('approach')) S.approach = null;
  if (!keep.has('follow')) S.follow = null;
  if (!keep.has('mining')) S.input.mining = false;
  if (!keep.has('firing')) S.input.firing = false;
  // A spooling core belongs to nobody once the plan changes: leaving one hot means the ship
  // jumps somewhere it decided against three seconds ago.
  if (!keep.has('warp') && S.warp.state === 'spooling') toggleWarp();
  ap.phase = phase;
  ap.t = 0;
}

/**
 * State and phase disagreeing is the other half of the same bug.
 *
 * A docking that completed while she was still in `berth`, an approach that ended without
 * anybody noticing, a pad she is standing on while the phase says `travel` — each of those
 * is a ship waiting for an event that already happened. Cheap to check, and it is the
 * difference between a stall that resolves itself and one that needs a thumb.
 */
function orphanSweep() {
  if (S.docked && ap.phase !== 'docked') { enter('docked'); return true; }
  if (!S.docked && ap.phase === 'docked') { enter('plan'); return true; }

  // Waiting on a berth that nothing is arranging any more.
  if (ap.phase === 'berth' && !S.docking && !S.follow && !S.docked &&
      ap.t > AUTOPILOT.orphanAfter) {
    markFailed(ap.task, ap.target, 'the berth never answered');
    say('Nobody is answering the pad. Trying something else.', true);
    enter('settle');
    ap.settle = AUTOPILOT.settle;
    return true;
  }

  // Travelling with nothing driving the ship: no approach, no warp, no tractor.
  if (ap.phase === 'travel' && !S.approach && !S.follow && !S.docking &&
      S.warp.state === 'idle' && ap.t > AUTOPILOT.orphanAfter) {
    // Not a failure yet — `travel` re-arms its own approach — but if it has been this long
    // the re-arm is not happening, and that is a failure.
    markFailed(ap.task, ap.target, 'nothing was flying the ship');
    enter('plan');
    return true;
  }

  // A beam or a trigger left on by a phase that has ended. Both in one pass, not one per
  // frame: returning after the first meant a ship that was mining *and* shooting took two
  // frames to stop doing either, and the second frame is one the phase below may have used
  // to act on a world it thought was quiet.
  let cleared = false;
  if (ap.phase !== 'work') {
    if (S.input.mining) { S.input.mining = false; cleared = true; }
    if (S.input.firing) { S.input.firing = false; cleared = true; }
  }
  return cleared;
}

function plan() {
  // Benched options are filtered here rather than inside `scoreTasks`, because the scorer is
  // also the honest answer to "what would you do", which ARIA is asked directly and which
  // should not quietly omit things. What she *would* do and what she is willing to try again
  // right now are two questions.
  const all = scoreTasks();
  const list = all.filter(x => !benched(x.key, x.target));

  // The tree's task, if the scorer can fly it. `TASK_FLIGHT[x] === null` is a decision with
  // nowhere to go — charging on the arrays, or running — and those settle rather than
  // launching a flight nobody asked for.
  const d = ap.brief || decide();
  const want = TASK_FLIGHT[d.task];
  if (want === null) {
    if (say(`${d.reason}.`)) ap.line = d.reason;
    ap.task = null;
    ap.dry = 0;                       // holding on purpose is not failing to find work
    enter('settle');
    ap.settle = AUTOPILOT.settle;
    return;
  }
  if (want) {
    const picked = list.find(x => x.key === want);
    if (picked) { commit(picked, d.reason); return; }
  }

  if (list.length) { commit(list[0]); return; }

  // ── nothing left to try ───────────────────────────────────────────
  //
  // Either there was never anything, or everything is benched. Both used to produce the same
  // thing: a settle, a re-plan, the same empty list, forever. Counted now, and the count is
  // what turns a loop into a decision — three dry plans and she gives the stick back, which
  // is the honest answer to "I cannot find anything to do".
  ap.dry = (ap.dry || 0) + 1;
  ap.task = null;
  if (ap.dry >= AUTOPILOT.giveUpAfter) {
    const why = all.length ? 'everything I can reach here has already refused us'
                           : 'there is nothing in reach worth flying to';
    setAutopilot(false, why);
    return;
  }
  if (say(all.length ? 'That did not work either. Looking for something else.'
                     : 'Nothing worth doing from here. Holding.')) {
    ap.line = 'Holding — no task';
  }
  enter('settle');
  ap.settle = AUTOPILOT.settle * 4;
}

/**
 * Fly a task the scorer resolved.
 *
 * @param {object} pick  from `scoreTasks()` — key, target and the scorer's own reason
 * @param {string} [why] the tree's reason, which wins when there is one: it is the sentence
 *   with the evidence behind it, and "the bank feeds this rack for four seconds" is worth
 *   more to a pilot than "the racks are empty".
 */
function commit(pick, why) {
  ap.dry = 0;
  ap.task = pick.key;
  ap.target = pick.target;
  ap.spent = 0;
  ap.serviced = false;
  const reason = why || pick.why;

  if (pick.key === 'mine') {
    const name = (pick.target && pick.target.name) || 'a rock';
    say(`Taking us to ${name} — ${reason}.`, true);
    setTarget(pick.target, 'asteroid', pick.target.name, 'rock');
    // Open the chart on the decision, exactly as the manual mining run does. She is not
    // allowed to do things the player cannot see her deciding.
    requestScreen('navmap', { pane: 'chart', only: 'belt', zoom: 6,
                              focus: { obj: pick.target, kind: 'asteroid', name: pick.target.name } });
    if (!startApproach({ power: 0.09 })) { enter('settle'); ap.settle = AUTOPILOT.settle; return; }
    enter('travel');
    return;
  }

  if (pick.key === 'hunt') {
    const u = pick.target.userData || {};
    say(`Going after ${u.name || 'that contact'} — ${reason}.`, true);
    setTarget(pick.target, 'ship', u.name, u.faction || 'hostile');
    // Never warped to. A hostile is a moving target and a spool takes long enough that she
    // would arrive where it used to be, which is the same reason the NPC tactics layer
    // closes sublight.
    if (!startApproach({ power: 0.22 })) { enter('settle'); ap.settle = AUTOPILOT.settle; return; }
    enter('travel');
    return;
  }

  const u = pick.target.userData || {};
  say(`${u.name} — ${reason}. Taking us in.`, true);
  setTarget(pick.target, 'station', u.name, 'neutral');
  // Warp when the crossing is long enough to be worth the charge, sublight when it is not.
  // See `worthWarping` for why that is a distance and not a multiple of the sensor array.
  if (worthWarping(pick.target)) {
    const no = spoolTo(pick.target, u.name);
    if (!no) { enter('travel'); return; }
    // Inside a well is the one refusal with an answer: fly out of it and ask again.
    if (no.startsWith('well:')) {
      say(`${no.slice(5)} is holding the core. Burning clear first.`);
      if (clearTheWell()) return;
    }
    if (!startApproach()) { enter('settle'); ap.settle = AUTOPILOT.settle; return; }
  } else if (!startApproach()) {
    enter('settle'); ap.settle = AUTOPILOT.settle; return;
  }
  enter('travel');
}

/**
 * Burning for the well edge, then spooling.
 *
 * Its own phase rather than a flag on `travel`, because it has its own success condition —
 * "the core will hold here" — and a phase whose exit condition is somebody else's is how
 * the orphans in this file happened in the first place.
 */
function clearwell(dt) {
  const t = ap.target;
  if (!t || !t.position) { enter('plan'); return; }

  // Out of the well: ask for the spool again. This is the whole point of the phase.
  if (!inGravityWell(S.player.position, t)) {
    const u = t.userData || {};
    ap.wellMark = null;
    const no = spoolTo(t, u.name || t.name);
    if (!no) { say('Clear. Spooling.'); enter('travel'); return; }
    // Out of the well and it still will not light — that is a different problem, and the
    // sublight approach is the honest fallback for it.
    say(`Still no core — ${no}. Taking us in on thrusters.`);
    S.approach = null;
    setTarget(t, 'station', u.name, 'neutral');
    startApproach();
    enter('travel');
    return;
  }

  // Long enough is long enough. A well we cannot leave in half a minute is a well we should
  // stop trying to leave, and fly the leg the slow way.
  if (ap.t > AUTOPILOT.wellClearFor) {
    const u = t.userData || {};
    ap.wellMark = null;
    say('That is taking too long. Flying it sublight.');
    S.approach = null;
    setTarget(t, 'station', u.name, 'neutral');
    if (!startApproach()) { markFailed(ap.task, t, 'could not clear the well');
                            enter('settle'); ap.settle = AUTOPILOT.settle; return; }
    enter('travel');
    return;
  }

  // Still burning. Re-arm the run if something cleared it out from under us.
  if (!S.approach && ap.wellMark) {
    setTarget(ap.wellMark, 'point', ap.wellMark.userData.name, 'neutral');
    if (!startApproach({ power: AUTOPILOT.wellClearPower })) { enter('plan'); }
  }
}

function travel(dt) {
  const t = ap.target;
  if (!t || !t.position) { enter('plan'); return; }

  // Still a long way out and not moving fast? Spool.
  //
  // This is the second half of the warp fix, and the half that matters in flight. Deciding
  // at plan time is not enough: the core is often on cooldown at the moment she chooses,
  // or she picks a target while the arrays are still coming in, and without this she then
  // flies the entire crossing sublight because the one moment the question was asked has
  // passed. Asked again every frame, answered by the same `worthWarping`.
  if (ap.task !== 'hunt' && !S.docking && worthWarping(t)) {
    const u = t.userData || {};
    const no = spoolTo(t, u.name || t.name);
    if (!no) { ap.t = 0; return; }
    // Same answer as at plan time: a well is a thing to fly out of, not a refusal.
    if (no.startsWith('well:') && clearTheWell()) {
      say(`${no.slice(5)} is holding the core. Burning clear first.`);
      return;
    }
  }

  // Warp finished, or never started: hand over to the sublight approach.
  if (S.warp.state === 'idle' && !S.approach && !S.follow && !S.docking) {
    const kind = ap.task === 'mine' ? 'asteroid' : ap.task === 'hunt' ? 'ship' : 'station';
    setTarget(t, kind, t.name || (t.userData && t.userData.name),
              kind === 'asteroid' ? 'rock' : kind === 'ship' ? 'hostile' : 'neutral');
    if (!startApproach({ power: ap.task === 'mine' ? 0.09 : ap.task === 'hunt' ? 0.22 : undefined })) {
      enter('settle'); ap.settle = AUTOPILOT.settle; return;
    }
    ap.t = 0;
  }

  const d = t.position.distanceTo(S.player.position);

  if (ap.task === 'mine') {
    if (d <= MINING.range * 0.95) { markWorked('mine', t); enter('work'); say('In range. Cutting.'); }
    return;
  }

  if (ap.task === 'hunt') {
    // Dead, despawned or run for it — either way there is nothing here to fly at.
    const u = t.userData || {};
    if (u.hp !== undefined && u.hp <= 0) { say('That one is finished.'); enter('settle');
      ap.settle = AUTOPILOT.settle; return; }
    if (d <= weaponReach() * AUTOPILOT.fireWithin) { markWorked('hunt', t); enter('work'); say('In range. Engaging.'); }
    return;
  }

  // A berth. Measured hull-to-hull like `DOCK.reach`, so the hail lands alongside the
  // station rather than a hundred kilometres short of it.
  if (gapTo(t) <= AUTOPILOT.dockReach || S.follow) {
    const u = t.userData || {};
    hailTo(u.name || 'Control', (BERTH_LINE[u.category] || BERTH_LINE.civilian)(u.name || 'Control')
      .replace(/^[^—]+— ?/, ''));
    closeHail();
    requestDocking(t);
    enter('berth');
  }
}

function berthing() {
  if (S.docked) { enter('docked'); ap.t = 0; return; }
  if (!S.docking && ap.t > 6) {
    // The tractor never took. Back to planning rather than sitting on the pad line.
    say('They did not take us. Coming round again.');
    enter('settle');
    ap.settle = AUTOPILOT.settle;
  }
}

/**
 * The best optimal range on the rack, or a sensible default for an unarmed hull.
 *
 * `S.stats.mounts` holds weapon *definitions*, not keys — see `mountedWeapons()` in
 * systems/industry/fitting.js. Worth saying out loud, because every other list of fitted
 * things in this project holds keys and the mistake reads as correct code.
 */
function weaponReach() {
  let best = 0;
  for (const w of (S.stats.mounts || [])) {
    if (w && w.optimal > best) best = w.optimal;
  }
  return best || 420;
}

function work(dt) {
  if (ap.task === 'hunt') { fight(dt); return; }
  const rock = ap.target;
  if (!rock || rock.ore <= 0 || cargoFree() < 5) {
    S.input.mining = false;
    const why = !rock || rock.ore <= 0 ? 'That one is finished.' : 'Hold is full.';
    say(why + ' Next.');
    enter('settle');
    ap.settle = AUTOPILOT.settle;
    return;
  }
  const d = rock.position.distanceTo(S.player.position);
  if (d > MINING.range) {
    // Drifted out. Re-approach rather than holding a trigger on nothing.
    S.input.mining = false;
    setTarget(rock, 'asteroid', rock.name, 'rock');
    startApproach({ power: 0.07 });
    enter('travel');
    return;
  }
  S.input.mining = true;
}

/**
 * Hold at weapons range and pull the trigger.
 *
 * The trigger is the new capability here, and it is deliberately the *only* new one: she
 * does not manoeuvre for a firing solution, she flies the ordinary approach — which points
 * the nose at the target, because that is what an approach does — and shoots when the nose
 * is pointed and the range is right.
 *
 * `holdFire` from the reasoner outranks all of it. A tree that has concluded the bank
 * cannot feed this rack, or that the racks are about to cut out on heat, must be able to
 * stop the shooting without having to also stop the flying.
 */
function fight(dt) {
  const mark = ap.target;
  const u = (mark && mark.userData) || {};

  if (!mark || !mark.position || (u.hp !== undefined && u.hp <= 0)) {
    S.input.firing = false;
    say('Splash. Coming off the trigger.');
    enter('settle');
    ap.settle = AUTOPILOT.settle;
    return;
  }

  // Breaking off is a decision, not a failure. Below the hull floor she stops being a
  // warship and goes back to being a working hull with a hole in it.
  const frac = S.stats.hullMax ? S.player.hull / S.stats.hullMax : 1;
  if (frac < AUTOPILOT.huntHull * 0.8) {
    S.input.firing = false;
    say('We are taking more than we are giving. Breaking off.', true);
    releaseControls();
    enter('settle');
    ap.settle = AUTOPILOT.settle * 2;
    return;
  }

  const d = mark.position.distanceTo(S.player.position);
  if (d > weaponReach()) {
    S.input.firing = false;
    if (!S.approach) { setTarget(mark, 'ship', u.name, u.faction || 'hostile');
                       startApproach({ power: 0.22 }); }
    enter('travel');
    return;
  }

  S.input.firing = !ap.holdFire && !S.player.overheat;
}

// ── the pad ──────────────────────────────────────────────────────────
//
// This is the part the whole feature exists for, and it runs as an ordered checklist rather
// than as a single pass: sell, repair, re-arm, resupply, read the board, leave. Ordered
// because each step pays for the next — selling first is what makes the repair affordable,
// and a checklist that repaired before it sold would strand a hull that could have afforded
// both.

function onPad(dt) {
  const st = S.docked;
  if (!st) { enter('plan'); return; }
  // We are standing on it, so whatever the ledger thinks about this berth is out of date.
  markWorked('service', st);
  markWorked('deliver', st);
  // One step per beat, so the log reads as somebody working through a list rather than as
  // a transaction dump. The pause is the chatter gap, which is what `say` already enforces.
  if (S.time - ap.saidAt < AUTOPILOT.chatterGap) return;

  const budget = Math.max(0, Math.min(S.credits - AUTOPILOT.reserve,
                                      S.credits * AUTOPILOT.spendShare) - ap.spent);

  // 1. deliver anything this berth is waiting for
  if (deliverableAt(st).length) {
    const before = S.credits;
    if (deliverConsignment(st)) {
      say(`Consignment signed for. ${fmtCr(S.credits - before)} in.`);
      return;
    }
  }

  // 2. sell the hold
  if (cargoMass() > 1) {
    const before = S.credits;
    sellAll(st);
    const got = S.credits - before;
    say(got > 0 ? `Hold cleared — ${fmtCr(got)}.` : 'They are not buying what we are carrying.');
    return;
  }

  // 3. repair
  const q = repairQuote();
  if (q && q.cost > 0 && q.cost <= budget) {
    if (repair()) { ap.spent += q.cost; say(`Hull patched — ${fmtCr(q.cost)}.`); return; }
  } else if (q && q.cost > budget && q.cost > 0 && !ap.saidRepair) {
    ap.saidRepair = true;
    say(`Yard wants ${fmtCr(q.cost)} for the hull. We are not paying that today.`);
    return;
  }

  // 4. re-arm — the emptiest feed first, and only what the budget covers.
  //
  // "Low" is a flat round count rather than a fraction of capacity, because a magazine has
  // no declared capacity to take a fraction of — `magazineReport` reports what is held, and
  // what a pilot means by "we are running dry" is a number of rounds, not a percentage of
  // a number nobody printed.
  const low = fittedFeeds()
    .map(f => ({ f, r: magazineReport(f) }))
    .filter(x => x.r.total < AUTOPILOT.rearmBelow)
    .sort((a, b) => a.r.total - b.r.total)[0];
  if (low) {
    // The best round this berth stocks that this feed can actually chamber, cheapest first
    // among the ones the budget covers. `ammoForSale` returns ids the station's tech tier
    // allows; which of them fit *this* rack is a property of the round, not of the shop.
    const fits = low.r.rounds.map(x => x.id);
    const offer = ammoForSale(st)
      .filter(id => fits.includes(id) || !fits.length)
      .filter(id => ammoStackPrice(id) <= budget)
      .sort((a, b) => ammoStackPrice(b) - ammoStackPrice(a))[0];
    if (offer) {
      const price = ammoStackPrice(offer);
      if (buyAmmo(offer, st)) {
        ap.spent += price;
        const name = (AMMUNITION[offer] && AMMUNITION[offer].name) || 'Rounds';
        say(`${name} aboard for the ${low.r.name} — ${fmtCr(price)}.`);
        return;
      }
    }
  }

  // 5. probes, if the hull carries a survey suite and is out
  if (S.probes < AUTOPILOT.probeFloor && probeCost() <= budget) {
    const c = probeCost();
    if (buyProbe(st)) { ap.spent += c; say(`Probe loaded — ${fmtCr(c)}.`); return; }
  }

  // 6. the board — the part of the ask that is actually about judgement
  if (!ap.serviced) {
    ap.serviced = true;
    readBoard(st);
    return;
  }

  // 7. leave
  //
  // A visit that spent nothing and signed nothing is *recorded*, not just ended. Without
  // that, the next plan step scores the same berth for the same unaffordable repair and
  // turns straight back round — which is the loop this slice exists to break. See
  // `AUTOPILOT.padCooldown` and the affordability gate in `scoreTasks`.
  const dryVisit = ap.spent === 0 && !ap.tookJob;
  if (dryVisit) {
    ap.padDry = S.time;
    say(S.credits < AUTOPILOT.broke
      ? `Nothing here we can pay for. We need to earn before a yard is any use — undocking.`
      : 'Nothing else here. Undocking.');
  } else {
    say(ap.spent > 0 ? `Done here — ${fmtCr(ap.spent)} spent. Undocking.`
                     : 'Signed and away. Undocking.');
  }
  ap.saidRepair = false;
  ap.tookJob = false;
  undock();
  recalcStats();
  enter('settle');
  ap.settle = AUTOPILOT.settle * 2;
}

/**
 * Read the local board, and take the best job this hull is actually cleared for.
 *
 * The hull restriction is not re-implemented here. `acceptBlocker()` already owns every gate
 * — standing, qualification, hold space, how many you are already holding — and it returns
 * the reason in the same words the board prints. So ARIA asks it, and reports the refusal
 * verbatim. A second copy of the eligibility rules living in the autopilot is the exact
 * shape of bug this project keeps writing comments about.
 */
export function readBoard(st) {
  const board = boardFor(st) || [];
  if (!board.length) { say('Board is empty. Nothing posted here.'); return null; }

  const open = [];
  const refused = [];
  for (const c of board) {
    const why = acceptBlocker(c);
    if (why) refused.push({ c, why });
    else open.push(c);
  }

  if (!open.length) {
    const first = refused[0];
    say(`${board.length} posting${board.length === 1 ? '' : 's'}, none of them ours — ` +
        `${first ? first.why.toLowerCase() : 'the hull is not cleared'}.`);
    return null;
  }

  // Best paying of the ones we can actually fly. Not the highest reward on the board —
  // the highest reward we are *cleared for*, which is a different and much shorter list.
  open.sort((a, b) => payFor(b) - payFor(a));
  const pick = open[0];
  const fee = payFor(pick);
  if (acceptContract(pick)) {
    ap.tookJob = true;
    say(`Signed for ${pick.title || 'work'} — ${fmtCr(fee)}. ` +
        (open.length > 1 ? `${open.length - 1} other${open.length === 2 ? '' : 's'} we could have taken.` : ''));
    return pick;
  }
  say('The board would not take our signature.');
  return null;
}

/** Reset — a new game, a load, a jump. */
export function resetAutopilot() {
  ap.padDry = -999;
  ap.tookJob = false;
  ap.dry = 0;
  ap.wellMark = null;
  failed.clear();
  ap.on = false;
  ap.task = null; ap.target = null; ap.phase = 'plan';
  ap.t = 0; ap.settle = 0; ap.saidAt = -99; ap.spent = 0;
  ap.line = 'Standing by';
}
