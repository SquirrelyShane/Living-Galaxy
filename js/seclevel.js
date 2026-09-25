/* LIVING GALAXY — the security level: one diamond that says where you stand.
 *
 *   ◆ GREEN   Safe. The system's policing corporation (npc/security.js's
 *             Directorate) has you on its books. SOS calls a quick-reaction
 *             wing to wherever you are, on the same honest clock the NPCs get.
 *   ◆ YELLOW  In combat — shot at, or shooting, inside the last 20 seconds.
 *             The Directorate does not dispatch into a fight already running
 *             on your say-so: SOS is closed until it goes quiet. Call early.
 *   ◆ RED     Wanted. You have killed enough honest hulls — and pilots — for
 *             the Directorate to lower your standing with it to nothing: no
 *             SOS, its patrols read you as hostile and open fire, and it
 *             stays that way until the heat cools or you pay the fine at an
 *             honest port.
 *
 * HEAT is the number under it. Every honest hull you destroy adds to it, a
 * Directorate hull more, another pilot most of all; opening fire on an honest
 * hull that then calls for help adds a little. It cools on its own, slowly,
 * and it rides the pilot record (pilot.secHeat), so a reload is not an
 * amnesty. Red is heat ≥ SEC.red; pay the fine and it is zero.
 *
 * Leaf-ish: no DOM, no sim import. sim.js calls stepSecLevel() once a tick
 * with the ship and wires `secHooks` for the log and the toasts.
 */

import { pilot } from "./pilot.js";
import { callForHelp, callById, securityCorp, etaOf } from "./npc/security.js";
import { traffic, HOSTILE_ROLES, LAW_ROLES } from "./npc/traffic.js";
import { adjustStanding, corpOfStation } from "./corps.js";
import { stationById } from "./stations.js";

export const SEC = {
  combatWindow: 20,     // s since a hit taken or a round fired that still counts as "in combat"
  red: 3,               // heat at which you are wanted
  cool: 360,            // s of quiet for one point of heat to go
  honestKill: 1,        // an honest hull destroyed
  lawKill: 2,           // a Directorate hull destroyed
  playerKill: 2,        // another pilot destroyed
  honestHit: 0.2,       // opening fire on an honest hull that then calls for help
  finePerHeat: 1200,    // cr a point at the Directorate's counter
  fineFloor: 800,
  sosCooldown: 150,     // s between SOS calls
  sosReach: 9000,       // u: a hostile inside this of you is what the wing comes for
  falseAlarm: -1,       // standing with the Directorate for a wing that found nothing
};

export const LEVELS = {
  green: { id: "green", label: "SAFE", colour: "#5fe39a" },
  yellow: { id: "yellow", label: "IN COMBAT", colour: "#ffd166" },
  red: { id: "red", label: "WANTED", colour: "#ff5d6c" },
};

/** Live, per session. Heat itself is pilot.secHeat. */
export const secState = { lastFireAt: -1e9, sosAt: -1e9, sosId: null, sawHostile: false, level: "green", kills: [], authority: true };
export const secHooks = { log: null, toast: null };

export function resetSecLevel() {
  secState.lastFireAt = -1e9; secState.sosAt = -1e9; secState.sosId = null; secState.sawHostile = false; secState.level = "green"; secState.kills = [];
}

export const heat = () => Math.max(0, Number(pilot.secHeat) || 0);
function addHeat(n, why, t) {
  const was = heat();
  pilot.secHeat = was + n;
  pilot.dirty = true;
  secState.kills.unshift({ at: t ?? 0, why, n });
  if (secState.kills.length > 12) secState.kills.length = 12;
  if (was < SEC.red && heat() >= SEC.red) {
    const law = securityCorp();
    if (law) adjustStanding(law.id, -15, "posted you as wanted");
    secHooks.toast?.(`WANTED — ${law?.name ?? "the Directorate"} has posted you. No SOS; its patrols will fire.`);
    secHooks.log?.(`${law?.name ?? "The Directorate"} posted you as wanted (${why})`, "combat");
  }
}

/* ---- what raises it ------------------------------------------------------- */

/** You destroyed a hull. `n` is the traffic record (or null for a peer), `peer` a remote pilot. */
export function noteKillBySelf({ n = null, peer = false, t = 0 } = {}) {
  if (peer) return addHeat(SEC.playerKill, "destroyed another pilot", t);
  if (!n || HOSTILE_ROLES.has(n.role) || n.rogue) return null;   // pirates and rogues are the job
  if (LAW_ROLES.has(n.role)) return addHeat(SEC.lawKill, `destroyed ${n.name ?? "a Directorate hull"}`, t);
  return addHeat(SEC.honestKill, `destroyed ${n.name ?? "an honest hull"}`, t);
}

/** An honest hull you opened fire on called for help. */
export function noteHonestHit(call, t = 0) {
  if (!call?.byPlayer || call.victimId === "self") return null;
  return addHeat(SEC.honestHit, `fired on ${call.victimName}`, t);
}

/** You fired a round (turrets.js marks ship.lastFireAt; this is the fallback). */
export function noteFired(t) { secState.lastFireAt = t; }

/* ---- the level ------------------------------------------------------------- */

function inCombat(ship, t) {
  const hitAt = ship?.lastHitBy ? ship.lastHitAt ?? -1e9 : -1e9;
  const fireAt = Math.max(secState.lastFireAt, ship?.lastFireAt ?? -1e9);
  return t - hitAt < SEC.combatWindow || t - fireAt < SEC.combatWindow;
}

/**
 * → { id, label, colour, heat, corp, canSOS, why, fine, cools }
 * `why` is the reason SOS is closed, or null when it is open.
 */
export function secLevel(ship, t) {
  const h = heat();
  const law = securityCorp();
  const red = h >= SEC.red;
  const combat = inCombat(ship, t);
  const lv = red ? LEVELS.red : combat ? LEVELS.yellow : LEVELS.green;
  let why = null;
  const open = secState.sosId ? callById(secState.sosId) : null;
  if (red) why = `${law?.name ?? "The Directorate"} does not answer for a wanted pilot`;
  else if (combat) why = "in combat — SOS closes once it has been quiet 20 s";
  else if (!law) why = "nobody polices this sky";
  else if (ship?.dockedAt) why = "docked — the port's own guns are your cover";
  else if (!secState.authority) why = "shared sky — the host's desk runs the Directorate; call from their side";
  else if (open && open.state !== "closed") why = "a wing is already on its way";
  else if (t - secState.sosAt < SEC.sosCooldown) why = `the desk will take another call in ${Math.ceil(SEC.sosCooldown - (t - secState.sosAt))} s`;
  return {
    ...lv, heat: h, corp: law?.name ?? null, canSOS: !why, why,
    fine: h > 0 ? Math.max(SEC.fineFloor, Math.round(h * SEC.finePerHeat)) : 0,
    cools: h > 0 ? Math.round(h * SEC.cool) : 0,
    sos: open && open.state !== "closed" ? { state: open.state, eta: etaOf(open, t), wing: open.wing.length } : null,
  };
}

/* ---- SOS ------------------------------------------------------------------- */

function nearestHostile(pos) {
  let best = null, bestD = SEC.sosReach;
  for (const n of traffic) {
    if (n.job === "down" || !(HOSTILE_ROLES.has(n.role) || n.rogue)) continue;
    const d = Math.hypot(n.x - pos.x, n.y - pos.y, n.z - pos.z);
    if (d < bestD) { best = n; bestD = d; }
  }
  return best;
}

/** Call the quick-reaction wing to where you are. Returns { ok, why, call }. */
export function callSOS(ship, t) {
  const lv = secLevel(ship, t);
  if (!lv.canSOS) return { ok: false, why: lv.why };
  const foe = nearestHostile(ship.pos);
  const me = { id: "self", name: ship.name ?? pilot.name ?? "your hull", role: "player", x: ship.pos.x, y: ship.pos.y, z: ship.pos.z };
  const call = callForHelp(me, foe ? { id: foe.id, name: foe.name } : null, t, "sos", { coverage: 1 });
  if (!call) return { ok: false, why: "the channel is busy — try again in a moment" };
  secState.sosAt = t;
  secState.sosId = call.id;
  secState.sawHostile = Boolean(foe);
  const eta = etaOf(call, t);
  secHooks.log?.(`SOS — ${lv.corp ?? "Security"} ${eta == null ? "has nobody to send" : `dispatched, ${Math.round(eta)} s out`}`, "comms");
  return { ok: true, call, eta, why: eta == null ? "nobody free to send" : null };
}

/** Where the player's own call is (npc/security.js asks this for victim "self"). */
let selfPos = null;
export function selfVictim() {
  return selfPos ? { id: "self", x: selfPos.x, y: selfPos.y, z: selfPos.z, job: "flying" } : null;
}

/* ---- the fine ------------------------------------------------------------- */

/** Clear the heat at an honest port's Directorate counter. Returns null or why not. */
export function payFine(ship) {
  const h = heat();
  if (h <= 0) return "Nothing on file";
  const st = stationById(ship?.dockedAt);
  if (!st) return "Pay at a port — dock first";
  if (st.hostile && !st.claimed || st.sector === "pirate") return "A free port keeps no Directorate counter";
  const fine = Math.max(SEC.fineFloor, Math.round(h * SEC.finePerHeat));
  if ((ship.credits ?? 0) < fine) return `The fine is ${fine.toLocaleString()} cr`;
  ship.credits -= fine;
  pilot.secHeat = 0;
  pilot.dirty = true;
  const law = securityCorp();
  if (law) adjustStanding(law.id, 8, "paid a fine in full");
  const host = corpOfStation(st);
  if (host && host !== law) adjustStanding(host.id, 2, "settled with the Directorate at their port");
  secHooks.log?.(`Paid ${fine.toLocaleString()} cr to ${law?.name ?? "the Directorate"} at ${st.name} — the file is closed`, "combat");
  return null;
}

/* ---- the tick -------------------------------------------------------------- */

export function stepSecLevel(ship, t, dt, { authority = true } = {}) {
  if (!ship) return secState.level;
  secState.authority = authority;
  selfPos = ship.pos;
  /* heat cools with time, not with docking or reloading */
  if (heat() > 0) {
    pilot.secHeat = Math.max(0, heat() - dt / SEC.cool);
    if (heat() === 0) pilot.dirty = true;
  }
  /* the player's own call: keep it pointed at the fight, keep it open while you are hit */
  const call = secState.sosId ? callById(secState.sosId) : null;
  if (call && call.state !== "closed") {
    const foe = nearestHostile(ship.pos);
    if (foe) {
      secState.sawHostile = true;
      if (!call.attackerId || !traffic.some((n) => n.id === call.attackerId && n.job !== "down")) { call.attackerId = foe.id; call.attackerName = foe.name; }
      call.lastHitAt = t;
    }
    if (ship.lastHitBy && (ship.lastHitAt ?? -1e9) > (call.lastHitAt ?? -1e9)) call.lastHitAt = ship.lastHitAt;
  } else if (call && call.state === "closed" && secState.sosId) {
    if (!secState.sawHostile && call.arrivedAt) {
      const law = securityCorp();
      if (law) adjustStanding(law.id, SEC.falseAlarm, "answered your SOS and found nothing");
      secHooks.toast?.("The wing found nothing out there. The Directorate noted it.");
    }
    secState.sosId = null;
  }
  const lv = secLevel(ship, t);
  if (lv.id !== secState.level) {
    secHooks.log?.(`Security ◆ ${lv.label}${lv.id === "red" ? ` — heat ${lv.heat.toFixed(1)}` : ""}`, "combat");
    secState.level = lv.id;
  }
  /* the patrols read a wanted pilot as hostile (turrets.js keys off this) */
  ship.outlaw = lv.id === "red";
  return lv.id;
}
