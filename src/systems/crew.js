// Living Galaxy — the crew sim. Runs every frame but does almost nothing per tick:
// each crewman accrues experience, and the only real events are a level-up and the
// payroll run. Everything a crewman contributes flows through recalcStats().
//
// The design intent is an idle layer that rewards *how you fly*: shoot a lot and
// your gunners outpace your riggers, haul ore and the opposite happens. Sitting
// docked still earns the baseline trickle, so a long break isn't wasted time.

import { S, recalcStats } from '../core/state.js';
import { CREW, SHIP_CLASSES, HULL_SLOTS, FATIGUE, CRAFT } from '../core/config.js';
import { CREW_ROLES, ROLE_KEYS, CREW_TRAITS, TRAIT_KEYS, crewName, crewOutput, wageOf,
         postOf, specialtyOf, isCross, onDuty, manning, condition,
         willpowerOf, needsOf } from '../data/crew.js';
import { makeRng } from '../core/rng.js';
import { toast, status } from '../ui/toast.js';
import { noteCrew, sampleCrew } from './crew-log.js';
import { comfortEffects, updateWelfare, onShore, inTraining, comfortUpkeep } from './welfare.js';
import { held, takeMaterial } from './crafting.js';
import { sfx } from './audio.js';
import { registerEngineerCheck } from './wear.js';

let nextId = 1;

export const berths = () => {
  const slots = HULL_SLOTS[S.player.classKey] || HULL_SLOTS.civilian;
  return CREW.maxBase + Math.floor(slots.core * CREW.berthPerSlot);
};

export const xpNeeded = level => Math.round(CREW.xpCurve * Math.pow(CREW.xpScale, level - 1));

export function makeCrew(role, rng, level = 1) {
  const r = rng || makeRng((S.seed ^ (nextId * 2654435761)) >>> 0);
  return {
    id: nextId++,
    name: crewName(r),
    role: role || ROLE_KEYS[Math.floor(r.next() * ROLE_KEYS.length)],
    trait: TRAIT_KEYS[Math.floor(r.next() * TRAIT_KEYS.length)],
    level, xp: 0, morale: 1, fatigue: 0,
    // `role` is what they trained as; `post` is where they stand. They start the same.
    post: null, onDuty: true, injury: 0, served: 0,
    // v1.00.30: people, not counters.
    // Willpower is rolled per person, then scaled by temperament in willpowerOf(). Two
    // Veterans are not identically stubborn, which is most of what makes a roster feel
    // like people rather than a table.
    will: CREW.willpower[0] + r.next() * (CREW.willpower[1] - CREW.willpower[0]),
    hunger: 0, thirst: 0, onBreak: false, breakT: 0, dutyT: 0, overseer: false
  };
}

/** Seed the starting crew. Deterministic from the world seed. */
export function initCrew() {
  if (S.crew && S.crew.length) { nextId = Math.max(nextId, ...S.crew.map(c => c.id + 1)); return; }
  const rng = makeRng((S.seed ^ 0x5eed) >>> 0);
  S.crew = [makeCrew('engineer', rng), makeCrew('helm', rng)];
  S.crewPayT = 0;
}

// ── needs ────────────────────────────────────────────────────────────
// Provisions are ordinary materials from the crafting catalogue, drawn from the ship's
// stock. That is deliberate: a crew that eats is one more thing the industrial layer feeds,
// rather than an abstract "supplies" bar with its own economy bolted on beside it.
const FOOD = 'BIO-008';      // nutrient solution concentrate
const WATER = 'RAW-011';     // water ice

/** Who is drawing rations right now — everyone aboard, overseer included. */
export const mouths = () => (S.crew || []).length;

/**
 * Consume provisions and let hunger and thirst rise when there are none.
 *
 * Hunger is a rate, not a switch. A ship that runs out of food does not stop; its crew
 * gets progressively worse at everything over hours, which is legible from the roster and
 * fixable by docking. A hard failure would just be a death timer.
 */
function feedCrew(dt, hours) {
  const crew = S.crew || [];
  if (!crew.length) return;
  const boss = overseer();
  const eff = boss ? (1 - CREW.overseerNeeds) : 1;

  for (const c of crew) {
    const scale = needsOf(c) * eff;
    const wantFood = CREW.needs.foodPerHour * hours * scale;
    const wantWater = CREW.needs.waterPerHour * hours * scale;

    if (takeMaterial(FOOD, wantFood)) c.hunger = Math.max(0, (c.hunger || 0) - CREW.needs.hungerRate * dt * 3);
    else c.hunger = Math.min(1, (c.hunger || 0) + CREW.needs.hungerRate * dt * scale);

    if (takeMaterial(WATER, wantWater)) c.thirst = Math.max(0, (c.thirst || 0) - CREW.needs.thirstRate * dt * 3);
    else c.thirst = Math.min(1, (c.thirst || 0) + CREW.needs.thirstRate * dt * scale);
  }
}

/** Life support draw, which the power budget should see. */
export const lifeSupportDraw = () => mouths() * CREW.needs.powerPerCrew;

/** Provisions left, in game hours at the current headcount. */
export function provisionHours() {
  const n = mouths();
  if (!n) return Infinity;
  const food = held(FOOD) / (CREW.needs.foodPerHour * n);
  const water = held(WATER) / (CREW.needs.waterPerHour * n);
  return Math.min(food, water);
}

// ── breaks ───────────────────────────────────────────────────────────
// Distinct from a watch rotation. A break is short, taken on watch, and gives back a
// little of everything; a rotation is a shift change. Conflating them would mean the only
// way to let someone catch their breath was to lose their station for ten minutes.

function runBreaks(dt) {
  for (const c of (S.crew || [])) {
    if (!onDuty(c) || c.overseer) { c.dutyT = 0; c.onBreak = false; continue; }
    if (c.onBreak) {
      c.breakT -= dt;
      if (c.breakT <= 0) {
        c.onBreak = false;
        c.dutyT = 0;
        const fWas = c.fatigue || 0, mWas = c.morale ?? 1;
        c.fatigue = Math.max(0, fWas - CREW.breakRecover);
        c.morale = Math.min(1, mWas + CREW.breakRecover * 0.2);
        noteCrew(c, 'stood down for a break', { stat: 'fatigue', delta: c.fatigue - fWas });
        noteCrew(c, 'stood down for a break', { stat: 'morale', delta: c.morale - mWas });
      }
      continue;
    }
    c.dutyT = (c.dutyT || 0) + dt;
    if (c.dutyT >= CREW.breakInterval) {
      c.onBreak = true;
      c.breakT = CREW.breakLength;
    }
  }
}

// ── promotion ────────────────────────────────────────────────────────

export const overseer = () => (S.crew || []).find(c => c.overseer) || null;

/**
 * Promote someone to run the ship rather than a station.
 *
 * An overseer stops contributing at a post — that is the cost, and it is a real one, since
 * you are giving up your best crewman's department bonus. In exchange everyone else works
 * better, learns faster and eats less, because somebody competent is finally running the
 * watch bill and the stores.
 *
 * One at a time. Two people in charge is the same as none.
 */
export function promote(id) {
  const c = (S.crew || []).find(x => x.id === id);
  if (!c) return false;
  if (c.level < CREW.overseerMinLevel) {
    toast(`${c.name} needs level ${CREW.overseerMinLevel} to take charge`); sfx.deny(); return false;
  }
  const current = overseer();
  if (current === c) return false;
  if (current) current.overseer = false;
  c.overseer = true;
  c.onBreak = false;
  recalcStats();
  sfx.pickup();
  toast(`${c.name} promoted \u2014 overseeing operations`, 4200);
  status('Overseer appointed');
  return true;
}

export function demote(id) {
  const c = (S.crew || []).find(x => x.id === id);
  if (!c || !c.overseer) return false;
  c.overseer = false;
  recalcStats();
  toast(`${c.name} returns to the ${CREW_ROLES[postOf(c)].name} station`);
  return true;
}

/** The multiplier an overseer puts on everyone else. */
export const overseerBonus = () => {
  const boss = overseer();
  if (!boss) return 1;
  // Scaled by how good they are: a level-5 chief is not a level-10 chief.
  return 1 + CREW.overseerBonus * (boss.level / CREW.levelMax);
};

// ── persuasion ───────────────────────────────────────────────────────

/**
 * Talk someone into something they would rather not do.
 *
 * The roll is against their willpower, so it is the *same* roll an enemy influence attempt
 * makes — a pliable crew does what you ask and also what a boarding party's negotiator
 * asks. Succeeding still costs morale: getting your way and being liked for it are
 * different things.
 */
export function persuade(id, what = 'the order') {
  const c = (S.crew || []).find(x => x.id === id);
  if (!c) return false;
  const chance = CREW.persuadeBase * (1 - willpowerOf(c)) + 0.15 * (c.morale ?? 1);
  const won = Math.random() < chance;
  {
    const was = c.morale ?? 1;
    c.morale = Math.max(CREW.moraleFloor, was - CREW.persuadeMoraleCost * (won ? 1 : 0.5));
    noteCrew(c, won ? 'talked round' : 'refused an order', {
      stat: 'morale', delta: c.morale - was, level: won ? 'info' : 'notice' });
  }
  toast(won ? `${c.name} agrees to ${what}` : `${c.name} refuses \u2014 ${what} is not happening`,
        3600);
  if (!won) sfx.deny();
  return won;
}

/**
 * An outside attempt to influence the crew — a Nexis illusion net, a pirate negotiator.
 * @returns {Array} the crewmen who were affected.
 */
export function influenceAttempt(strength = 1) {
  const hit = [];
  for (const c of (S.crew || [])) {
    const resist = willpowerOf(c);
    if (Math.random() < CREW.illusionBase * strength * (1 - resist)) {
      {
        const was = c.morale ?? 1;
        c.morale = Math.max(CREW.moraleFloor, was - 0.18);
        noteCrew(c, 'hostile influence', { stat: 'morale', delta: c.morale - was, level: 'warn' });
      }
      c.onDuty = false;                 // they walk off station for a while
      c.dutyT = 0;
      hit.push(c);
    }
  }
  if (hit.length) {
    toast(`Influence net \u2014 ${hit.map(c => c.name).join(', ')} left their posts`, 5200);
    recalcStats();
  } else if ((S.crew || []).length) {
    status('Influence attempt \u2014 the crew held');
  }
  return hit;
}

/** Is damage control manned and on watch? Injuries heal much faster if so. */
export function hasMedic() {
  return (S.crew || []).some(c => onDuty(c) && postOf(c) === 'medic' && (c.injury || 0) < 0.8);
}

/** Which departments are earning right now. */
function activeDepts() {
  const p = S.player, a = {};
  if (S.input.firing) a.gunner = 1;
  if (S.input.mining) a.rigger = 1;
  if (Math.abs(p.throttle) > 0.05 || S.approach || S.warp.state !== 'idle') a.helm = 1;
  if (p.expend > 6) a.engineer = 1;
  if (S.scan && S.scan.active) a.survey = 1;
  if (S.orbit) a.survey = 1;
  if (p.hull < S.stats.hullMax - 0.5 || p.armor < S.stats.armorMax - 0.5) a.medic = 1;
  if (S.docked) { a.purser = 1; a.engineer = 1; }
  else if (S.cargo.ore + S.cargo.salvage + S.cargo.data > 0) a.purser = 1;
  return a;
}

export function updateCrew(dt) {
  if (!S.crew || !S.crew.length) return;
  const act = activeDepts();
  const medic = hasMedic();
  let dirty = false;

  // Provisions and breaks. Both run on the same clock as everything else here; the hours
  // conversion is the one from CRAFT so the galley and the factory floor agree on time.
  // Read once per tick rather than per crewman: a fitting cannot mean one thing in the
  // fatigue branch and something slightly different in the healing branch.
  const comf = comfortEffects();
  updateWelfare(dt);

  feedCrew(dt, dt * CRAFT.gameHoursPerSecond);
  runBreaks(dt);
  // A trend, not a recording — the cadence is what makes keeping one affordable.
  sampleCrew();

  for (const c of S.crew) {
    // Somebody ashore or on a course is not aboard. They do not stand a watch, wear down,
    // learn from what the ship is doing, or eat the ship's provisions — which is exactly
    // the cost that makes both worth thinking about.
    if (onShore(c) || inTraining(c)) { c.served = (c.served || 0) + dt; continue; }

    const trait = CREW_TRAITS[c.trait] || CREW_TRAITS.steady;
    const post = postOf(c);
    const duty = onDuty(c);
    c.served = (c.served || 0) + dt;

    // ── fatigue ───────────────────────────────────────────────────
    // Tracked against the *post*, not the ship and not the specialty: a rigger standing
    // at the guns is worn down by the shooting they are actually doing. Off-watch crew
    // recover at the docked rate wherever the ship is, which is the entire point of
    // running a rotation.
    // An overseer is not at a station and a crewman on a break is not at theirs.
    const working = duty && !c.overseer && !c.onBreak && !!act[post];
    const before = c.fatigue || 0;
    if (working && !S.docked) c.fatigue = Math.min(1, before + FATIGUE.rate * dt);
    else {
      // Quarters pay here. A bunk with a door that shuts is the difference between
      // off-watch time being a pause and off-watch time being rest — and it is the
      // fitting that makes a rotation worth running rather than just worth having.
      const rest = (S.docked ? FATIGUE.dockedRecover
                 : duty ? FATIGUE.recover
                        : FATIGUE.recover * CREW.offDutyRecover) * comf.restMult;
      c.fatigue = Math.max(0, before - rest * dt);
    }
    if (before < FATIGUE.warnAt && c.fatigue >= FATIGUE.warnAt) {
      toast(`${c.name} is running on empty — rotate them off watch`, 3600);
      noteCrew(c, 'worn out on watch', { stat: 'fatigue', delta: c.fatigue - before, level: 'warn' });
      dirty = true;
    }
    // Crossing a tenth changes the derived stats enough to be worth a recalc, and not
    // so often that we do one every frame.
    if (Math.floor(before * 10) !== Math.floor(c.fatigue * 10)) dirty = true;

    // ── injury ────────────────────────────────────────────────────
    const hurt = c.injury || 0;
    if (hurt > 0) {
      const heal = (S.docked ? CREW.healDocked : CREW.healRate) *
                   (medic ? CREW.healMedic : 1) * comf.healMult;
      c.injury = Math.max(0, hurt - heal * dt);
      if (hurt >= 0.05 && c.injury < 0.05) {
        toast(`${c.name} is fit for duty again`, 2600);
        dirty = true;
      }
      if (Math.floor(hurt * 10) !== Math.floor(c.injury * 10)) dirty = true;
    }

    // ── experience ────────────────────────────────────────────────
    // Progress is always credited to the *specialty*, whatever post they are standing at,
    // because that is what they are actually becoming better at. Standing somewhere else
    // slows it: covering a gap costs you the career you were building.
    if (duty) {
      const spec = specialtyOf(c);
      const base = act[post] ? CREW.xpActive : CREW.xpIdle;
      const focus = isCross(c) ? CREW.crossLearn : 1;
      const rate = base * focus * trait.learn * (0.5 + 0.5 * c.morale) *
                   (c.overseer ? CREW.overseerXp : 1) * overseerBonus();
      if (c.level < CREW.levelMax) {
        c.xp += rate * dt;
        while (c.level < CREW.levelMax && c.xp >= xpNeeded(c.level)) {
          c.xp -= xpNeeded(c.level);
          c.level++;
          dirty = true;
          toast(`${c.name} → ${CREW_ROLES[spec].name} L${c.level}`, 2600);
          sfx.pickup();
        }
      } else c.xp = 0;
    } else {
      // Off watch still earns the idle trickle, at a quarter. Resting is not a punishment.
      if (c.level < CREW.levelMax) c.xp += CREW.xpIdle * 0.25 * trait.learn * dt;
    }
  }

  if (S.settings.autoRotate !== false && rotateWatch()) dirty = true;

  // ── payroll ──────────────────────────────────────────────────────
  S.crewPayT += dt;
  if (S.crewPayT >= CREW.wageInterval) {
    S.crewPayT = 0;
    const due = payroll();
    if (due <= 0) return;
    const paid = S.credits >= due;
    if (paid) S.credits -= due;

    // Morale had exactly one driver — pay — which meant a crew that had been on shift for
    // six hours, watched two of their number die and been posted to a job they were not
    // trained for was as cheerful as one that had not. It is a sum now.
    const avgFatigue = S.crew.reduce((a, c) => a + (c.fatigue || 0), 0) / S.crew.length;
    for (const c of S.crew) {
      // Each term is recorded against its own cause rather than as one net movement. The
      // net number tells a player their gunner is unhappy; the terms tell them it is the
      // empty galley and not the pay, which is the only version they can act on. See
      // systems/crew-log.js — `crewDiagnosis()` ranks exactly these.
      const terms = [];
      let d = 0;
      if (paid) { d += CREW.moraleDrift; terms.push(['paid', CREW.moraleDrift]); }
      else { d -= CREW.moraleUnpaid; terms.push(['wages missed', -CREW.moraleUnpaid]); }
      if (avgFatigue > FATIGUE.warnAt) { d -= CREW.moraleTired; terms.push(['crew worn out', -CREW.moraleTired]); }
      if (isCross(c)) { d -= CREW.moraleCross; terms.push(['posted off speciality', -CREW.moraleCross]); }
      if (Math.max(c.hunger || 0, c.thirst || 0) > CREW.needs.warnAt) {
        // A galley does not conjure provisions — it makes running low hurt less, which is
        // the honest thing a cook can do about an empty hold.
        const bite = CREW.needs.hungerMorale * (1 - comf.rationRelief);
        d -= bite; terms.push(['short rations', -bite]);
      }
      if (comf.galleyMorale > 0) { d += comf.galleyMorale; terms.push(['a decent galley', comf.galleyMorale]); }
      if (S.docked) { d += CREW.moraleShore; terms.push(['shore leave', CREW.moraleShore]); }

      const was = c.morale;
      c.morale = Math.max(CREW.moraleFloor, Math.min(1, c.morale + d));
      // Attribute against what actually landed, not what was asked for: at the floor or the
      // ceiling the terms are notional, and a diagnosis that sums to more than the observed
      // change is a diagnosis that lies.
      const scale = d ? (c.morale - was) / d : 0;
      for (const [cause, amount] of terms) {
        noteCrew(c, cause, { stat: 'morale', delta: amount * scale,
                             level: amount < -0.05 ? 'notice' : 'info' });
      }
    }
    // Fittings bill on the same clock as wages: they are a standing cost of carrying
    // people, and hiding them somewhere else would let a player buy a level-3 galley and
    // never notice it was the thing draining the account.
    const upkeep = comfortUpkeep();
    if (upkeep > 0) S.credits = Math.max(0, S.credits - upkeep);

    if (paid) status(`Payroll — ${due} cr to ${S.crew.length} crew`);
    else { toast('Payroll missed — morale falling', 3000); }
    dirty = true;
  }

  if (dirty) recalcStats();
}

// ── posts and watches ────────────────────────────────────────────────

/**
 * Move a crewman to a post. Free, and reversible — this is the tactical control. Standing
 * off-specialty costs output and slows their own progression, and those costs are enough;
 * charging for the move as well would mean nobody ever did it, which is what the old
 * `reassign` achieved by halving their experience.
 */
export function assignPost(id, post) {
  const c = (S.crew || []).find(x => x.id === id);
  if (!c || !CREW_ROLES[post]) return false;
  if (postOf(c) === post) return false;
  c.post = post === specialtyOf(c) ? null : post;
  recalcStats();
  sfx.ui();
  status(`${c.name} → ${CREW_ROLES[post].name}${isCross(c) ? ' (off speciality)' : ''}`);
  return true;
}

/** Send a crewman back to what they trained for. */
export const clearPost = id => assignPost(id, specialtyOf(
  (S.crew || []).find(x => x.id === id) || {}));

/**
 * Permanently retrain. This is the expensive one: it changes what they *are*, so it
 * costs most of their accumulated progress toward the next level and some morale.
 * Nobody enjoys being told their career was a mistake.
 */
export function retrain(id, role) {
  const c = (S.crew || []).find(x => x.id === id);
  if (!c || !CREW_ROLES[role] || specialtyOf(c) === role) return false;
  c.role = role;
  c.post = null;
  c.xp *= (1 - CREW.retrainCost);
  {
    const was = c.morale;
    c.morale = Math.max(CREW.moraleFloor, c.morale - CREW.retrainMorale);
    noteCrew(c, 'retraining', { stat: 'morale', delta: c.morale - was, level: 'notice' });
  }
  recalcStats();
  sfx.ui();
  toast(`${c.name} retrained as ${CREW_ROLES[role].name}`);
  return true;
}

export function setDuty(id, on) {
  const c = (S.crew || []).find(x => x.id === id);
  if (!c) return false;
  const want = !!on;
  if (onDuty(c) === want) return false;
  c.onDuty = want;
  recalcStats();
  sfx.ui();
  return true;
}

export const toggleDuty = id => {
  const c = (S.crew || []).find(x => x.id === id);
  return c ? setDuty(id, !onDuty(c)) : false;
};

/**
 * Automatic watch rotation. Swaps an exhausted crewman out and a rested one in.
 *
 * The rule that keeps it from thrashing: a crewman only comes *back* below
 * rotateBackAt, well under the level that sent them away. Rotating on one threshold
 * means a crewman who recovers a single percent immediately goes back to work, tires
 * out, and rotates again — a ship where nobody ever settles into a watch.
 *
 * And it never empties a manned post. Rotating the last gunner out mid-fight to spare
 * them a headache is not help.
 */
export function rotateWatch() {
  const crew = S.crew || [];
  if (crew.length < 2) return false;
  let changed = false;

  for (const c of crew) {
    if (!onDuty(c)) continue;
    if ((c.fatigue || 0) < CREW.rotateAt) continue;

    const post = postOf(c);
    const stillManned = crew.filter(
      x => x !== c && onDuty(x) && postOf(x) === post).length;

    // A relief who is rested and either trained for this post or at least idle.
    const relief = crew.find(x => !onDuty(x) && (x.fatigue || 0) <= CREW.rotateBackAt &&
                                  (x.injury || 0) < 0.5);
    if (relief) {
      relief.onDuty = true;
      relief.post = specialtyOf(relief) === post ? null : post;
      c.onDuty = false;
      status(`${relief.name} relieves ${c.name} at ${CREW_ROLES[post].name}`);
      changed = true;
    } else if (stillManned >= CREW.minOnDuty) {
      c.onDuty = false;
      status(`${c.name} stood down — exhausted`);
      changed = true;
    }
    // No relief and the last one at the post: they stay, and they keep degrading. The
    // ship is short-handed, and the game should say that with the numbers rather than
    // by quietly fixing it.
  }
  return changed;
}

// ── casualties ───────────────────────────────────────────────────────

/**
 * A hull breach hurts somebody. Called from combat when a hit reaches structure.
 *
 * Only crew actually on watch can be hurt: whatever the realism, a game that injures the
 * people you deliberately sent to rest is punishing the player for using the system it
 * just gave them. Death requires an *already* badly injured crewman, so losing a level-8
 * veteran is the end of a bad run rather than one unlucky frame.
 */
export function crewCasualty(hullDamage) {
  const crew = S.crew || [];
  if (!crew.length || !S.stats.hullMax) return null;
  if (hullDamage < S.stats.hullMax * CREW.injuryHullFrac) return null;

  const onWatch = crew.filter(onDuty);
  if (!onWatch.length) return null;
  if (Math.random() >= CREW.injuryChance) return null;

  const c = onWatch[Math.floor(Math.random() * onWatch.length)];
  const [lo, hi] = CREW.injuryAmount;
  const before = c.injury || 0;
  c.injury = Math.min(1, before + lo + Math.random() * (hi - lo));

  if (before >= CREW.deathAbove && Math.random() < CREW.deathChance) {
    const i = crew.indexOf(c);
    crew.splice(i, 1);
    for (const other of crew) {
      const was = other.morale;
      other.morale = Math.max(CREW.moraleFloor, was - CREW.moraleDeath);
      noteCrew(other, `${c.name} was killed aboard`, {
        stat: 'morale', delta: other.morale - was, level: 'warn' });
    }
    toast(`${c.name} was killed at the ${CREW_ROLES[postOf(c)].name} station`, 6000);
    status('Casualty aboard');
    sfx.deny();
    recalcStats();
    return { crew: c, died: true };
  }

  toast(`${c.name} injured — ${CREW_ROLES[postOf(c)].name} station`, 3600);
  recalcStats();
  return { crew: c, died: false };
}

/** Pay a station's infirmary to patch everyone up at once. */
export function medicalQuote() {
  const hurt = (S.crew || []).filter(c => (c.injury || 0) > 0.02);
  return { crew: hurt.length, cost: Math.round(hurt.reduce((a, c) => a + c.injury * 900, 0)) };
}

export function treatCrew() {
  if (!S.docked) { toast('Medical care is a station service'); sfx.deny(); return false; }
  const q = medicalQuote();
  if (!q.crew) { toast('Nobody aboard needs treatment'); return false; }
  if (S.credits < q.cost) { toast(`Treatment costs ${q.cost} cr`); sfx.deny(); return false; }
  S.credits -= q.cost;
  for (const c of S.crew) c.injury = 0;
  recalcStats();
  sfx.pickup();
  toast(`${q.crew} crew treated`);
  return true;
}

/**
 * Award experience for something that actually happened.
 *
 * This is where the bulk of a crew's progression now comes from. The idle trickle was cut
 * by twenty in v1.00.30 because it levelled a crew to the cap while the ship sat docked
 * doing nothing — sitting in a chair should not make you a better gunner.
 *
 * Most of an event goes to the department that did the work and the rest is split across
 * everyone aboard, because a fight teaches the whole ship something even if only the
 * gunners pulled a trigger.
 */
export function crewEvent(kind, post = null, scale = 1) {
  const crew = S.crew || [];
  if (!crew.length) return 0;

  // Winning lifts the room. `CREW.moraleWin` has been in config since v1.00.30 and nothing
  // read it — the crew could be worn down by unpaid wages, bad rations and long watches, and
  // had no way at all to be cheered up by the thing they are actually aboard for. Only the
  // crew on watch feel it: somebody asleep in a bunk did not win anything.
  if (kind === 'kill') {
    const lift = CREW.moraleWin * scale;
    for (const c of crew) {
      if (!onDuty(c)) continue;
      const was = c.morale ?? 1;
      c.morale = Math.min(1, was + lift);
      if (c.morale !== was) noteCrew(c, 'a kill on their watch', { stat: 'morale', delta: c.morale - was });
    }
  }

  const base = (CREW.xpEvent[kind] || 0) * scale;
  if (base <= 0) return 0;

  const boss = overseerBonus();
  const onWatch = crew.filter(c => onDuty(c) && !c.overseer);
  const focused = post ? onWatch.filter(c => postOf(c) === post) : [];
  const spreadPool = onWatch.length ? onWatch : crew;

  let given = 0;
  const award = (c, amount) => {
    if (c.level >= CREW.levelMax) return;
    const trait = CREW_TRAITS[c.trait] || CREW_TRAITS.steady;
    const gain = amount * trait.learn * boss * (0.6 + 0.4 * (c.morale ?? 1));
    c.xp += gain;
    given += gain;
    while (c.level < CREW.levelMax && c.xp >= xpNeeded(c.level)) {
      c.xp -= xpNeeded(c.level);
      c.level++;
      toast(`${c.name} \u2192 ${CREW_ROLES[specialtyOf(c)].name} L${c.level}`, 2600);
      sfx.pickup();
      recalcStats();
    }
  };

  if (focused.length) {
    const share = (base * CREW.xpEventFocus) / focused.length;
    for (const c of focused) award(c, share);
  }
  const rest = base * (focused.length ? CREW.xpEventSpread : 1);
  if (spreadPool.length) {
    const share = rest / spreadPool.length;
    for (const c of spreadPool) award(c, share);
  }
  return given;
}

export const payroll = () => (S.crew || []).reduce((s, c) => s + wageOf(c), 0);

export function hireCost(c) {
  return Math.round(CREW.hireBase + CREW.hirePerLevel * (c.level - 1) *
    ((CREW_TRAITS[c.trait] || CREW_TRAITS.steady).wage));
}

/**
 * The recruits on offer at the docked station.
 *
 * These used to be cached on the station's `userData` and generated once, forever: the
 * same four people stood in the same bar for the entire life of a save, and because
 * `userData` is not persisted, a reload silently produced four *different* people who
 * were then also permanent. The pool now lives in state, is saved, and turns over on a
 * timer like every other board in the game.
 */
export function recruitPool() {
  if (!S.docked) return [];
  const name = S.docked.userData.name;
  if (!S.recruits) S.recruits = {};
  const entry = S.recruits[name];
  if (entry && S.time - entry.at < CREW.recruitRefresh) return entry.list;
  return refreshRecruits(name);
}

export function refreshRecruits(name) {
  if (!S.recruits) S.recruits = {};
  // Seeded on the station *and* on which refresh cycle this is, so the pool is
  // deterministic for a given seed and moment rather than merely random.
  const cycle = Math.floor(S.time / CREW.recruitRefresh);
  const rng = makeRng((S.seed ^ hashName(name) ^ Math.imul(cycle + 1, 0x9E3779B1)) >>> 0);
  const n = CREW.recruitMin + Math.floor(rng.next() * (CREW.recruitMax - CREW.recruitMin + 1));
  const list = [];
  for (let i = 0; i < n; i++) list.push(makeCrew(null, rng, 1 + Math.floor(rng.next() * 4)));
  S.recruits[name] = { at: S.time, list };
  return list;
}

function hashName(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function hire(c) {
  if (!S.docked) { toast('Hiring happens at a station'); sfx.deny(); return false; }
  if (S.crew.length >= berths()) { toast(`No free berth — ${berths()} aboard this hull`); sfx.deny(); return false; }
  const cost = hireCost(c);
  if (S.credits < cost) { toast(`${c.name} wants ${cost} cr up front`); sfx.deny(); return false; }
  S.credits -= cost;
  c.id = nextId++;
  c.morale = 1;
  c.post = null;
  c.onDuty = true;
  c.injury = 0;
  c.served = 0;
  S.crew.push(c);
  const name = S.docked.userData.name;
  const entry = S.recruits && S.recruits[name];
  if (entry) entry.list = entry.list.filter(x => x !== c);
  recalcStats();
  sfx.pickup();
  toast(`${c.name} signed on as ${CREW_ROLES[c.role].name}`);
  return true;
}

export function dismiss(id) {
  const i = S.crew.findIndex(c => c.id === id);
  if (i < 0) return false;
  const c = S.crew[i];
  S.crew.splice(i, 1);
  recalcStats();
  toast(`${c.name} paid off`);
  sfx.ui();
  return true;
}

/**
 * Pre-1.00.10 name for changing what a crewman *is*. Kept as an alias so nothing that
 * called it breaks, but the interesting operation is now `assignPost`, which is free.
 */
export const reassign = (id, role) => retrain(id, role);

export const crewSummary = () => (S.crew || []).map(c => ({
  id: c.id, name: c.name,
  specialty: specialtyOf(c), post: postOf(c), cross: isCross(c),
  onDuty: onDuty(c), level: c.level, morale: c.morale,
  fatigue: c.fatigue || 0, injury: c.injury || 0,
  condition: condition(c), out: crewOutput(c), wage: wageOf(c)
}));

/** Per-post picture for the crew screen: who is there and what it is worth. */
export function postReport() {
  const man = manning(S.crew);
  return ROLE_KEYS.map(k => ({
    post: k,
    name: CREW_ROLES[k].name,
    icon: CREW_ROLES[k].icon,
    desc: CREW_ROLES[k].desc,
    manned: man[k].length,
    output: man[k].reduce((a, c) => a + crewOutput(c), 0),
    crew: man[k].map(c => ({ id: c.id, name: c.name, cross: isCross(c) }))
  }));
}

export { postOf, specialtyOf, isCross, onDuty, condition, manning };


// ── module wear (v1.01.70) ───────────────────────────────────────────
// An engineer on watch slows the rate at which fitted kit wears out. Registered rather than
// imported the other way round, because wear.js must not depend on the crew simulation to
// work — a ship with nobody aboard still wears its modules, it simply wears them faster.
//
// This is the answer to a question the crew slices left open: what is an engineer *for*
// outside a fight? Damage control is reactive. This is the post paying for itself while
// nothing at all is happening, which is what a real engineering watch does.
registerEngineerCheck(() => (S.crew || []).some(c => onDuty(c) && postOf(c) === 'engineer' &&
                                                     !c.onBreak && (c.injury || 0) < 0.8));
