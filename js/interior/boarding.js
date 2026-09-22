/* LIVING GALAXY experimental — boarding actions.
 *
 * Refuse a pirate toll inside pod range and the watch sends a breach team:
 * a pod crosses (you can outrun it), clamps on at the airlock, and intruders
 * are on your deck — red on the plan, counted by the interior sensors, felt
 * in the sim whether the deck plan is open or not.
 *
 * The fight is the crew's, resolved a round every five seconds:
 *   defense = Σ over hands  (security skill + grit) × morale, doubled for
 *             security-complex crew, + the maintenance robotics, + the
 *             sensor net (a watched corridor is a killing floor), + a
 *             docked port's own security if you make the clamps.
 * Intruders sabotage while they live — the hull bleeds a little every round
 * they hold a deck — and hands take morale hits (a nurse in a gunfight is
 * not having a good cycle). Beaten intruders are captured if the hull has a
 * BRIG, otherwise spaced; brigged prisoners turn into a Marshal's bounty the
 * next time you dock anywhere that is not hostile.
 *
 * `startBoarding(n, from)` is also the console/test hook — anything (a
 * derelict, a bad passenger, a story) can put intruders on the deck.
 */

import { sim, logEvent } from "../sim.js";
import { applyDamage } from "../ship.js";
import { crew } from "../crew.js";
import { cradle, generateNPC } from "../npc/cradle.js";

export const boarding = {
  pods: [],        // inbound: { eta, n, from }
  intruders: [],   // aboard: { id, name, hp, skill }
  brig: [],        // captured, awaiting a Marshal
  round: 0,
  lastRound: 0,
  log: [],
};

function note(text, kind = "combat") {
  boarding.log.unshift({ t: sim.time, text });
  boarding.log.length = Math.min(boarding.log.length, 30);
  logEvent(text, kind);
  sim.toast = text;
  sim.lastToastAt = sim.time;
}

export const POD_RANGE = 7000;   // refuse inside this and the pod launches
const POD_SPEED = 220;           // u/s — slow enough to run from
const ROUND_S = 5;
const SABOTAGE_HULL = 1.2;       // hull per living intruder per round
const BOUNTY = 400;              // cr per prisoner, at the Marshal's window

/** A pirate port answers a refusal with a breach team. */
export function launchPod(st, n = 0) {
  const d = Math.hypot(st.x - sim.ship.pos.x, st.y - sim.ship.pos.y, st.z - sim.ship.pos.z);
  if (d > POD_RANGE) return false;
  const count = n || 1 + Math.floor(Math.random() * 2) + (sim.ship.cargoCap > 600 ? 1 : 0);
  boarding.pods.push({ eta: sim.time + d / POD_SPEED + 6, n: count, from: st.name, fromId: st.id, x: st.x, y: st.y, z: st.z });
  note(`${st.name} has a breach pod in the black — ${Math.round(d / POD_SPEED + 6)} s to your airlock. Run, or meet them.`);
  return true;
}

/** Put intruders on the deck directly (pod arrival, console, future stories). */
export function startBoarding(n, from = "a breach pod") {
  for (let i = 0; i < n; i++) {
    const rec = generateNPC(`boarder:${sim.skySeed}:${sim.time.toFixed(0)}:${i}`, { complexId: "security", sky: sim.skySeed });
    boarding.intruders.push({ id: rec.id, name: rec.name, hp: 100, skill: 20 + Math.floor(Math.random() * 30), rec });
  }
  syncSensors();
  note(`BREACH — ${n} intruder${n > 1 ? "s" : ""} through the airlock (${from}). The crew is on it.`);
}

/** The deck's defense per round. Exported so the test can price a crew. */
export function defensePower() {
  let p = 0;
  for (const m of crew.aboard) {
    const rec = cradle.get(m.id);
    const sec = rec?.skills?.security ?? 0;
    const grit = (rec?.traits?.grit ?? m.traits?.grit ?? 0.5) * 30;
    const morale = Math.max(0.3, Math.min(100, m.morale) / 100);
    const trade = m.complexId === "security" ? 2 : 1;
    p += (8 + sec + grit) * morale * trade;
  }
  p += (sim.interior?.robots ?? 0) * 5;
  p += (sim.interior?.sensors ?? 0) * 0.6; // a watched corridor
  if (sim.ship.dockedAt) p += 40;          // port security storms aboard
  return p;
}

function syncSensors() {
  if (sim.interior) sim.interior.intruders = boarding.intruders;
}

/** Called from the sim tick (sim seconds). */
export function tickBoarding(dt) {
  /* pods in the black */
  for (const pod of [...boarding.pods]) {
    const d = Math.hypot(pod.x - sim.ship.pos.x, pod.y - sim.ship.pos.y, pod.z - sim.ship.pos.z);
    if (d > POD_RANGE * 2.2) {
      boarding.pods.splice(boarding.pods.indexOf(pod), 1);
      note(`The breach pod falls away — ${pod.from} could not hold the intercept.`);
      continue;
    }
    if (sim.time >= pod.eta) {
      boarding.pods.splice(boarding.pods.indexOf(pod), 1);
      startBoarding(pod.n, pod.from);
    }
  }
  /* Prisoners used to be swept off the ship for a flat fee the moment you
   * docked anywhere. They are people now (crew/captive.js): who you hand over,
   * who you sell back, who you let go and who you end up crewing with are all
   * decisions, and a hatch that empties itself takes every one of them away.
   * Boarders you have not spoken to still go quietly — anybody you have
   * actually dealt with, or who came off a ticket, stays for you to decide. */
  if (sim.ship.dockedAt && boarding.brig.length) {
    const quiet = boarding.brig.filter((p) => !p.fromTicket && !p.state);
    if (quiet.length) {
      const pay = quiet.length * BOUNTY;
      sim.ship.credits += pay;
      note(`Marshal's office takes ${quiet.length} prisoner${quiet.length > 1 ? "s" : ""} off your hands — ${pay} cr.`);
      for (const p of quiet) {
        const i = boarding.brig.indexOf(p);
        if (i >= 0) boarding.brig.splice(i, 1);
        const rec = p.rec ?? cradle.get(p.id);
        if (rec) { rec.status = "held"; cradle.note(rec.id, "Handed to the Marshal"); cradle.put(rec); }
      }
    }
  }
  if (!boarding.intruders.length) return;
  if (sim.time - boarding.lastRound < ROUND_S) return;
  boarding.lastRound = sim.time;
  boarding.round++;

  /* sabotage while they hold the deck */
  applyDamage(sim.ship, SABOTAGE_HULL * boarding.intruders.length, null, sim.time);

  const def = defensePower();
  const atk = boarding.intruders.reduce((a, i) => a + i.skill, 0);
  /* the crew works the intruders down; the intruders work the crew's nerve */
  for (const i of boarding.intruders) i.hp -= (def / boarding.intruders.length) * (0.6 + Math.random() * 0.6) * 0.25;
  for (const m of crew.aboard) {
    if (Math.random() < Math.min(0.5, atk / 400)) m.morale = Math.max(5, m.morale - 4);
  }
  const down = boarding.intruders.filter((i) => i.hp <= 0);
  for (const i of down) {
    boarding.intruders.splice(boarding.intruders.indexOf(i), 1);
    const hasBrig = Boolean(sim.interior?.hasBrig);
    if (hasBrig) {
      boarding.brig.push(i);
      i.rec.status = "captive"; // off the hiring pools; the record keeps the story
      cradle.put(i.rec);
      cradle.note(i.rec.id, `Captured boarding ${sim.callsign ?? "a hull"}'s ship — held in the brig`);
      note(`${i.name} is down and dragged to the brig.`);
    } else {
      note(`${i.name} is down. No brig aboard — spaced.`);
    }
  }
  if (!boarding.intruders.length && boarding.round > 0) {
    note(`Deck clear. ${boarding.brig.length ? `${boarding.brig.length} in the brig for the Marshal.` : "The crew stands down."}`);
    boarding.round = 0;
    for (const m of crew.aboard) m.morale = Math.min(100, m.morale + 6); // won the day
  }
  syncSensors();
}

export function resetBoarding() {
  boarding.pods.length = 0;
  boarding.intruders.length = 0;
  boarding.brig.length = 0;
  boarding.round = 0;
  boarding.lastRound = 0;
  syncSensors();
}
