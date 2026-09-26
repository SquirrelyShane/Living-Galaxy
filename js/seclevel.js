/* LIVING GALAXY — the security level: one diamond that says where you stand.
 *
 *   ◆ GREEN   Safe. The system's policing corporation (npc/security.js's
 *             Directorate) has you on its books. SOS calls a quick-reaction
 *             wing to wherever you are, on the same honest clock the NPCs get.
 *   ◆ YELLOW  In combat — shot at, or shooting, inside the last 20 seconds.
 *             The Directorate does not dispatch into a fight YOU picked: SOS
 *             is closed until it goes quiet. But a fight that picked you is
 *             another matter (0.3.56): rogue drones or pirates hitting you,
 *             and you have not gone after them yourself — no P-LOCK attack,
 *             no first shot; turrets returning fire is self-defence — and
 *             SOS stays open. A wing that arrives to find them still at it
 *             pays a bounty for the call, by what they found.
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
import { traffic, HOSTILE_ROLES, LAW_ROLES, vesselById } from "./npc/traffic.js";
import { adjustStanding, corpOfStation } from "./corps.js";
import { stationById } from "./stations.js";
import { contactById, contacts, fireRound } from "./turrets.js";

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
  /* 0.3.56 — a fight that picked you */
  defendWindow: 22,     // s after a hit in which firing back is self-defence
  pickedFor: 90,        // s a fight you picked keeps SOS closed
  bonusCap: 2500,       // cr the Directorate pays for one call, at most
  standingCap: 5,       // standing it gives for one call, at most
  wingRange: 2400,      // u: a wing hull this close to you fights what is on you
  wingReach: 1800,      // u: …and reaches this far from itself
  wingRate: 1.1,        // s between a wing hull's rounds
  wingDamage: 10,
};

/* What the Directorate pays when its wing finds the hostile still at you. */
export const BOUNTY = {
  drone: { cr: 120, standing: 0.5, label: "rogue drone" },
  holddrone: { cr: 160, standing: 0.5, label: "hold gun drone" },
  rogue: { cr: 200, standing: 1, label: "nest drone" },
  pirate: { cr: 350, standing: 1.5, label: "pirate", perHp: 1.5, max: 900 },
};
const HOSTILE_KINDS = new Set(Object.keys(BOUNTY));

export const LEVELS = {
  green: { id: "green", label: "SAFE", colour: "#5fe39a" },
  yellow: { id: "yellow", label: "IN COMBAT", colour: "#ffd166" },
  red: { id: "red", label: "WANTED", colour: "#ff5d6c" },
};

/** Live, per session. Heat itself is pilot.secHeat. */
export const secState = { lastFireAt: -1e9, sosAt: -1e9, sosId: null, sawHostile: false, level: "green", kills: [], authority: true, hitBy: new Map(), picked: new Map(), lastHitSeen: -1e9, wingCd: new Map() };
export const secHooks = { log: null, toast: null };

export function resetSecLevel() {
  secState.lastFireAt = -1e9; secState.sosAt = -1e9; secState.sosId = null; secState.sawHostile = false; secState.level = "green"; secState.kills = [];
  secState.hitBy.clear(); secState.picked.clear(); secState.lastHitSeen = -1e9; secState.wingCd.clear();
}

/* ---- 0.3.56: who started it ------------------------------------------------ */

/** What kind of hostile this id is, or null if it is not one the Directorate pays for. */
export function attackerKind(id) {
  if (!id) return null;
  const c = contactById(id);
  if (c?.kind === "drone") return c.corpDrone ? "holddrone" : "drone";
  const n = vesselById(id);
  if (n?.rogue || n?.role === "rogue") return "rogue";
  if (n && HOSTILE_ROLES.has(n.role)) return "pirate";
  if (c?.kind === "npc" && c.relation === "hostile" && HOSTILE_ROLES.has(c.role)) return "pirate";
  return null;
}

function alive(id) {
  const c = contactById(id);
  if (c) return c.hp > 0;
  const n = vesselById(id);
  return Boolean(n && n.job !== "down" && n.visible !== false);
}

/**
 * Your turrets fired at `target`. Self-defence — returning fire on something
 * that hit you inside SEC.defendWindow — is not picking a fight. A P-LOCK on
 * it is (you went after it by hand), and so is shooting first.
 */
export function noteShot(target, t, lockedId = null) {
  if (!target?.id) return null;
  const hit = secState.hitBy.get(target.id);
  const defending = hit != null && t - hit < SEC.defendWindow;
  if (lockedId && lockedId === target.id) { secState.picked.set(target.id, { t, why: "locked" }); return "locked"; }
  if (!defending) { secState.picked.set(target.id, { t, why: "first" }); return "first"; }
  return "defending";
}

/** Somebody hit you (stepSecLevel reads ship.lastHitBy; tests may call this). */
export function noteHitBy(id, t) { if (id) secState.hitBy.set(id, t); }

/**
 * Is this fight one that picked you? → { ok, why, attackers: [{ id, kind }] }
 * ok when everything that hit you inside the combat window is a hostile the
 * Directorate answers for, and you have not picked a fight with anything
 * still alive inside SEC.pickedFor.
 */
export function assault(ship, t) {
  const attackers = [];
  for (const [id, at] of secState.hitBy) {
    if (t - at > SEC.combatWindow) continue;
    attackers.push({ id, kind: attackerKind(id), at });
  }
  for (const [id, p] of secState.picked) {
    if (t - p.t > SEC.pickedFor) { secState.picked.delete(id); continue; }
    if (alive(id)) return { ok: false, why: p.why === "locked" ? "you went after them yourself — the Directorate does not answer for a fight you picked" : "you fired first — the Directorate does not answer for a fight you picked", attackers };
  }
  if (!attackers.length) return { ok: false, why: null, attackers };
  if (attackers.some((a) => !HOSTILE_KINDS.has(a.kind))) return { ok: false, why: null, attackers };
  return { ok: true, why: null, attackers };
}

/** What a wing finding these still at you would pay. */
export function bountyFor(list) {
  let cr = 0, standing = 0;
  for (const a of list) {
    const b = BOUNTY[a.kind];
    if (!b) continue;
    const hp = a.kind === "pirate" ? (contactById(a.id)?.hp ?? vesselById(a.id)?.hp ?? 120) : 0;
    cr += b.perHp ? Math.min(b.max, b.cr + hp * b.perHp) : b.cr;
    standing += b.standing;
  }
  return { cr: Math.round(Math.min(SEC.bonusCap, cr)), standing: Math.round(Math.min(SEC.standingCap, standing) * 10) / 10 };
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
  const under = combat ? assault(ship, t) : null;
  if (red) why = `${law?.name ?? "The Directorate"} does not answer for a wanted pilot`;
  else if (combat && !under.ok) why = under.why ?? "in combat — SOS closes once it has been quiet 20 s";
  else if (!law) why = "nobody polices this sky";
  else if (ship?.dockedAt) why = "docked — the port's own guns are your cover";
  else if (!secState.authority) why = "shared sky — the host's desk runs the Directorate; call from their side";
  else if (open && open.state !== "closed" && open.state !== "unanswered") why = "a wing is already on its way";
  else if (t - secState.sosAt < SEC.sosCooldown) why = `the desk will take another call in ${Math.ceil(SEC.sosCooldown - (t - secState.sosAt))} s`;
  return {
    ...lv, heat: h, corp: law?.name ?? null, canSOS: !why, why,
    fine: h > 0 ? Math.max(SEC.fineFloor, Math.round(h * SEC.finePerHeat)) : 0,
    cools: h > 0 ? Math.round(h * SEC.cool) : 0,
    sos: open && open.state !== "closed" && open.state !== "unanswered" ? { state: open.state, eta: etaOf(open, t), wing: open.wing.length } : null,
    /* 0.3.56: a fight that picked you — who, and what a wing finding them would pay */
    assault: under?.ok ? { kinds: under.attackers.map((a) => a.kind), bounty: bountyFor(under.attackers.filter((a) => alive(a.id))) } : null,
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
  /* a call nobody could answer is closed before a new one goes out — the bus
   * refreshes an open call rather than re-dispatching it */
  const prev = secState.sosId ? callById(secState.sosId) : null;
  if (prev && prev.state === "unanswered") { prev.state = "closed"; prev.closedAt = t; prev.outcome = "unanswered"; }
  /* 0.3.56: under attack, the call names who is on you — the newest attacker */
  const on = lv.assault ? [...secState.hitBy].filter(([id, at]) => t - at < SEC.combatWindow && alive(id)).sort((a, b) => b[1] - a[1])[0]?.[0] : null;
  const onC = on ? contactById(on) ?? vesselById(on) : null;
  const foe = onC ? { id: on, name: onC.name ?? "a hostile" } : nearestHostile(ship.pos);
  const me = { id: "self", name: ship.name ?? pilot.name ?? "your hull", role: "player", x: ship.pos.x, y: ship.pos.y, z: ship.pos.z };
  const call = callForHelp(me, foe ? { id: foe.id, name: foe.name } : null, t, "sos", { coverage: 1 });
  if (!call) return { ok: false, why: "the channel is busy — try again in a moment" };
  secState.sosAt = t;
  secState.sosId = call.id;
  secState.sawHostile = Boolean(foe);
  if (lv.assault) call.assault = { at: t, kinds: lv.assault.kinds };
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

/* ---- 0.3.56: the wing arrives ------------------------------------------------- */

/**
 * The wing is on scene for YOUR call. If what was on you is still at it, the
 * Directorate pays for the call — by what its hulls found — and remembers it.
 * Returns { cr, standing, found } or null when it was not your call.
 */
export function wingArrived(call, t, ship) {
  if (!call?.sos || call.id !== secState.sosId || call.rewarded) return null;
  call.rewarded = true;
  const found = [];
  const seen = new Set();
  const near = (o) => o && Math.hypot(o.x - ship.pos.x, o.y - ship.pos.y, o.z - ship.pos.z) < SEC.sosReach;
  for (const [id, at] of secState.hitBy) {
    if (t - at > 90 || seen.has(id) || !alive(id)) continue;
    const kind = attackerKind(id);
    if (!HOSTILE_KINDS.has(kind) || !near(contactById(id) ?? vesselById(id))) continue;
    seen.add(id); found.push({ id, kind });
  }
  if (call.attackerId && !seen.has(call.attackerId) && alive(call.attackerId)) {
    const kind = attackerKind(call.attackerId);
    if (HOSTILE_KINDS.has(kind) && near(contactById(call.attackerId) ?? vesselById(call.attackerId))) found.push({ id: call.attackerId, kind });
  }
  if (!found.length) return { cr: 0, standing: 0, found };
  secState.sawHostile = true;
  const pay = bountyFor(found);
  ship.credits = (ship.credits ?? 0) + pay.cr;
  const law = securityCorp();
  if (law && pay.standing) adjustStanding(law.id, pay.standing, "called the wing onto live hostiles");
  const what = [...new Set(found.map((f) => BOUNTY[f.kind].label))].join(" and ");
  secHooks.toast?.(`The wing found ${found.length === 1 ? `a ${what}` : `${found.length} hostiles (${what})`} still on you — ${law?.name ?? "the Directorate"} pays ${pay.cr.toLocaleString()} cr for the call${pay.standing ? `, +${pay.standing} standing` : ""}`);
  secHooks.log?.(`QRF on scene: ${found.length} ${what} still engaged — ${pay.cr.toLocaleString()} cr bounty for the call`, "combat");
  call.bounty = { ...pay, n: found.length };
  return { ...pay, found };
}

/** The wing fights what is on you: a turret drone the NPC fight never sees gets rounds too. */
function wingSupport(call, ship, t) {
  for (const id of call.wing) {
    const n = vesselById(id);
    if (!n || n.job === "down" || n.respondTo !== call.id) continue;
    if (Math.hypot(n.x - ship.pos.x, n.y - ship.pos.y, n.z - ship.pos.z) > SEC.wingRange) continue;
    if ((secState.wingCd.get(id) ?? -1e9) > t) continue;
    let best = null, bd = SEC.wingReach;
    for (const c of contacts) {
      if (c.kind !== "drone" || c.hp <= 0 || c.relation !== "hostile") continue;
      const d = Math.hypot(c.x - n.x, c.y - n.y, c.z - n.z);
      if (d < bd) { bd = d; best = c; }
    }
    if (!best) continue;
    secState.wingCd.set(id, t + SEC.wingRate);
    const lead = bd / 950;   // a picket leads its target the way your mounts do
    fireRound(n, { x: best.x + (best.vx ?? 0) * lead, y: best.y + (best.vy ?? 0) * lead, z: best.z + (best.vz ?? 0) * lead }, 950, SEC.wingDamage, n.id, "npc-law", null, best.id);
  }
}

/* ---- the tick -------------------------------------------------------------- */

export function stepSecLevel(ship, t, dt, { authority = true } = {}) {
  if (!ship) return secState.level;
  secState.authority = authority;
  selfPos = ship.pos;
  /* who has hit you, and when — self-defence is judged against this */
  if (ship.lastHitBy && ship.lastHitAt !== secState.lastHitSeen) { secState.lastHitSeen = ship.lastHitAt; noteHitBy(ship.lastHitBy, ship.lastHitAt); }
  for (const [id, at] of secState.hitBy) if (t - at > 180) secState.hitBy.delete(id);
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
    if (call.arrivedAt) wingSupport(call, ship, t);
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
