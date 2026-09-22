/* LIVING GALAXY — first-hand reports on the open channel.
 *
 * 0.3.16. The speech engine is good at people talking; it is not a sensor.
 * These are the calls a pilot makes because of something that is actually
 * there — and every one is built from js/npc/ground.js at the moment it is
 * said, by a hull that is actually where the claim is:
 *
 *   MAYDAY   a hull that is really being shot (a fresh hit, an open distress
 *            call, or the victim of a live engagement) says who is shooting,
 *            how many, where it is, and its real hull integrity. A raider in
 *            the middle of its own attack does not get to call one.
 *   PORT     a hull inside a port's approaches says how busy it is there —
 *            the real count of hulls around that port, how many are on the
 *            entry lane, how many are in the bay — or that it is quiet. A
 *            hull forty kilometres off in open space says nothing about it.
 *   CLAIM    a miner on its claim says what the rock is: the ore it is
 *            cutting, the most valuable thing in reach and how much of it,
 *            against the common stuff — and whether there are raiders or
 *            rogue drones on the belt with it, how many, how far, and which
 *            nest the drones came out of if one is in reach.
 *   PICKET   a patrol or security hull says what its sweep actually shows.
 *
 * comms.js asks for an urgent one every chatter tick (a new mayday goes out
 * at once) and mixes the rest in with the speech engine's exchanges.
 */

import { traffic, vesselById, HOSTILE_ROLES, LAW_ROLES } from "./traffic.js";
import { goodName } from "../materials.js";
import { placeOf, placePhrase, portCensus, underFire, threatsNear, claimSurvey, unitsPhrase, countWord, bearingTo, PORT_R, BELT_THREAT_R } from "./ground.js";

export const REPORT_RANGE = 140000;       // who you can hear (matches the band)
const MAYDAY_REPEAT = 45;                  // s: a hull still under fire calls again
const PORT_REPEAT = 240;                   // s: per port
const CLAIM_REPEAT = 300;                  // s: per miner
const PICKET_REPEAT = 200;                 // s: per picket

/* `nameOf` is how a hull's pilot is named on the band; js/npc/speech.js sets it to its voiceName() */
export const reports = { said: new Map(), log: [], nameOf: (n) => n.captain || n.name };

export function resetReports() { reports.said.clear(); reports.log.length = 0; }

const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const km = (u) => Math.max(1, Math.round(u / 100));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function speakerOf(n) {
  return reports.nameOf(n);
}

function due(key, now, every) {
  const at = reports.said.get(key);
  return at == null || now - at >= every;
}
function mark(key, now) {
  reports.said.set(key, now);
  if (reports.said.size > 600) reports.said.delete(reports.said.keys().next().value);
}

function hullTag(n) {
  /* "Wayline Hauler AISAIL-53" → the hull a listener can find on the board */
  return n.name;
}

/* ---- MAYDAY ------------------------------------------------------------------ */

function maydayFor(n, now) {
  const f = underFire(n, now);
  if (!f) return null;
  if (HOSTILE_ROLES.has(n.role) || n.rogue) return null;        // raiders and drones do not call for help
  const pl = placeOf(n);
  const who = f.kind === "rogue" ? (f.count > 1 ? `${countWord(f.count)} rogue drones` : "a rogue drone")
    : f.kind === "player" ? "an independent — the pilot on my six"
    : f.kind === "pirate" ? (f.count > 1 ? `${countWord(f.count)} raiders` : `a raider${f.by ? `, ${f.by}` : ""}`)
    : f.by ? f.by : "somebody I can't see";
  const hull = f.hp != null ? ` Hull at ${f.hp} percent.` : "";
  const law = f.call?.state === "dispatched" && f.call?.eta ? ` Security says ${Math.max(0, Math.round(f.call.eta - now))} seconds.` : "";
  const ask = f.hp != null && f.hp < 35 ? "Anyone in range, I need you now." : "Any armed hull in range, I could use a hand.";
  const text = `Mayday, mayday — ${hullTag(n)}, taking fire from ${who} ${placePhrase(pl)}.${hull}${law} ${ask}`;
  return { kind: "mayday", urgent: true, n, text, facts: { hp: f.hp, count: f.count, by: f.by, place: pl.name, attackerKind: f.kind } };
}

/* ---- PORT ---------------------------------------------------------------------- */

function portFor(n, now) {
  if (n.rogue || HOSTILE_ROLES.has(n.role)) return null;
  const pl = placeOf(n);
  if (pl.kind !== "port") return null;                              // only a hull that is THERE
  const st = pl.station;
  if (!due(`port:${st.id}`, now, PORT_REPEAT)) return null;
  const c = portCensus(st);
  const others = c.total - 1;                                       // not counting the speaker
  let text;
  if (others >= 6) {
    const bits = [];
    if (c.inbound) bits.push(`${countWord(c.inbound)} on the entry lane`);
    if (c.bay) bits.push(`${countWord(c.bay)} in the bay`);
    if (c.outbound) bits.push(`${countWord(c.outbound)} going out`);
    text = `Traffic's thick around ${st.name} — ${countWord(others)} hulls inside ${km(PORT_R)} km${bits.length ? `, ${bits.join(", ")}` : ""}. Expect to wait on clamps.`;
  } else if (others >= 3) {
    text = `${st.name}'s approaches are working steady — ${countWord(others)} hulls about${c.inbound ? `, ${countWord(c.inbound)} inbound` : ""}. No queue to speak of.`;
  } else {
    text = `${cap(st.name)} is quiet — ${others <= 0 ? "nobody else on the approaches" : `${countWord(others)} other hull${others === 1 ? "" : "s"} about`}. Straight onto the clamps.`;
  }
  if (c.raiders) text += ` ${cap(countWord(c.raiders))} hostile${c.raiders === 1 ? "" : "s"} inside ${km(PORT_R)} km of the ring, mind.`;
  return { kind: "port", key: `port:${st.id}`, n, text, facts: { station: st.id, around: others, inbound: c.inbound, bay: c.bay, raiders: c.raiders } };
}

/* ---- CLAIM ---------------------------------------------------------------------- */

function claimFor(n, now) {
  if (n.role !== "miner" || n.job !== "cutting") return null;
  if (!due(`claim:${n.id}`, now, CLAIM_REPEAT)) return null;
  const s = claimSurvey(n, now);
  const th = threatsNear(n, BELT_THREAT_R, n);
  const pl = placeOf(n);
  const parts = [];
  if (s.rocks) {
    const cutting = s.pays ?? s.common;
    parts.push(`Cutting ${cutting.name.toLowerCase()} ${placePhrase(pl)}`);
    if (s.best && s.common && s.best.id !== s.common.id) {
      const x = s.common.value > 0 ? s.best.value / s.common.value : 1;
      const mult = x >= 1.9 ? ` — ${x >= 10 ? "better than ten" : countWord(Math.round(x))} times the price of the ${s.common.name.toLowerCase()}` : "";
      parts.push(`mostly ${s.common.name.toLowerCase()} (${unitsPhrase(s.common.units)}), but there's ${s.best.rich ? "a rich seam of " : ""}${s.best.name.toLowerCase()} in reach, ${unitsPhrase(s.best.units)}${mult}`);
    } else if (s.common) {
      parts.push(`it's all ${s.common.name.toLowerCase()} here, ${unitsPhrase(s.common.units)} in reach`);
    }
    const second = s.ores.find((e) => e.id !== s.best?.id && e.id !== s.common?.id && e.value >= (s.common?.value ?? 0) * 1.5);
    if (second) parts.push(`some ${second.name.toLowerCase()} too, ${unitsPhrase(second.units)}`);
  } else {
    parts.push(`This stretch ${placePhrase(pl)} is cut out — nothing left worth the cutter`);
  }
  let text = parts.join("; ") + ".";
  if (th.pirates.length) {
    const p = th.pirates[0];
    text += ` Heads up: ${th.pirates.length === 1 ? `a raider` : `${countWord(th.pirates.length)} raiders`} on the belt with me, nearest ${km(p.d)} km at bearing ${bearingTo(n, p.n)}.`;
  }
  if (th.rogues.length) {
    const r = th.rogues[0];
    text += ` ${cap(th.rogues.length === 1 ? "a rogue drone" : `${countWord(th.rogues.length)} rogue drones`)} working this side, ${km(r.d)} km off${th.nest ? ` — out of ${th.nest.name}` : ""}.`;
  } else if (th.nest) {
    text += ` ${cap(th.nest.name)} is within ${km(BELT_THREAT_R * 1.5)} km of the claim; no drones out of it yet.`;
  }
  if (!th.count && !th.nest && s.rocks) text += " No raiders or drones on my board.";
  return {
    kind: "claim", key: `claim:${n.id}`, n, text,
    facts: { ores: s.ores.map((e) => e.id), best: s.best?.id ?? null, bestUnits: s.best?.units ?? 0, common: s.common?.id ?? null, pirates: th.pirates.length, rogues: th.rogues.length, nest: th.nest?.id ?? null },
  };
}

/* ---- PICKET ---------------------------------------------------------------------- */

function picketFor(n, now) {
  if (!LAW_ROLES.has(n.role) || n.job === "docked") return null;
  if (!due(`picket:${n.id}`, now, PICKET_REPEAT)) return null;
  const th = threatsNear(n, BELT_THREAT_R, n);
  const pl = placeOf(n);
  let text;
  if (th.count) {
    const bits = [];
    if (th.pirates.length) bits.push(`${countWord(th.pirates.length)} raider${th.pirates.length === 1 ? "" : "s"}`);
    if (th.rogues.length) bits.push(`${countWord(th.rogues.length)} rogue drone${th.rogues.length === 1 ? "" : "s"}`);
    text = `Sweep ${placePhrase(pl)} shows ${bits.join(" and ")} inside ${km(BELT_THREAT_R)} km, nearest ${km(th.nearest.d)} km at bearing ${bearingTo(n, th.nearest.n)}. Working hulls, keep clear of that side.`;
  } else {
    text = `Sweep ${placePhrase(pl)} is clean — nothing hostile inside ${km(BELT_THREAT_R)} km.`;
  }
  return { kind: "picket", key: `picket:${n.id}`, n, text, facts: { pirates: th.pirates.length, rogues: th.rogues.length } };
}

/* ---- the desk ------------------------------------------------------------------ */

function heard(pos) {
  const out = [];
  for (const n of traffic) {
    if (n.visible === false || n.job === "down" || n.rogue) continue;
    if (d3(n, pos) > REPORT_RANGE) continue;
    out.push(n);
  }
  return out;
}

function shape(r, now) {
  if (r.key) mark(r.key, now);
  const line = { from: { name: speakerOf(r.n), x: r.n.x, y: r.n.y, z: r.n.z, sector: "traffic", ref: r.n }, to: { name: r.kind === "mayday" ? "all hulls" : "the band" }, text: r.text, kind: r.kind, facts: r.facts, urgent: Boolean(r.urgent) };
  reports.log.push({ at: now, kind: r.kind, speaker: line.from.name, hull: r.n.id, text: r.text });
  if (reports.log.length > 60) reports.log.shift();
  return line;
}

/** A mayday that has not gone out yet (or is due again), nearest first — or null. */
export function urgentReport(pos, now) {
  let best = null, bd = Infinity;
  for (const n of heard(pos)) {
    if (!due(`mayday:${n.id}`, now, MAYDAY_REPEAT)) continue;
    const r = maydayFor(n, now);
    if (!r) continue;
    const d = d3(n, pos);
    if (d < bd) { bd = d; best = r; }
  }
  if (!best) return null;
  mark(`mayday:${best.n.id}`, now);
  return shape(best, now);
}

/**
 * One first-hand report from somebody on the band, or null. Prefers the rarer,
 * more useful kinds: a claim report with a threat or a rich seam in it, then a
 * busy port, then a picket's sweep, then the rest. `rnd` breaks ties.
 */
export function groundedReport(pos, now, rnd = Math.random) {
  const urgent = urgentReport(pos, now);
  if (urgent) return urgent;
  const cands = [];
  for (const n of heard(pos)) {
    const c = claimFor(n, now) ?? portFor(n, now) ?? picketFor(n, now);
    if (!c) continue;
    let w = 1 / (1 + d3(n, pos) / 20000);
    if (c.kind === "claim") w *= 1.4 + (c.facts.pirates + c.facts.rogues) * 1.5 + (c.facts.best && c.facts.best !== c.facts.common ? 0.8 : 0);
    if (c.kind === "port") w *= c.facts.around >= 6 ? 1.6 : c.facts.raiders ? 1.5 : 0.7;
    if (c.kind === "picket") w *= c.facts.pirates + c.facts.rogues ? 1.8 : 0.12;   // a clean sweep is worth hearing now and then, not every time
    cands.push([w, c]);
  }
  if (!cands.length) return null;
  let draw = rnd() * cands.reduce((s, [w]) => s + w, 0);
  let pick = cands[cands.length - 1][1];
  for (const [w, c] of cands) { draw -= w; if (draw <= 0) { pick = c; break; } }
  return shape(pick, now);
}

/** What a hull says when it changes job near you (comms.js onVesselTransition), grounded. Null to stay quiet. */
export function transitionReport(n, job, now) {
  if (!n || n.rogue) return null;
  if (job === "cutting" && n.role === "miner") {
    const r = claimFor(n, now);
    return r ? shape(r, now) : null;
  }
  if (job === "approach") {
    const st = vesselById(n.id) && placeOf(n).kind === "port" ? placeOf(n).station : null;
    if (n.role === "miner" && n.carrying?.qty > 0) {
      return shape({ kind: "inbound", n, text: `Inbound to ${n.toName || st?.name || "port"} with ${Math.round(n.carrying.qty)} units of ${goodName(n.carrying.id).toLowerCase()} aboard, cut on my own claim.`, facts: { good: n.carrying.id, qty: n.carrying.qty } }, now);
    }
    return null;
  }
  return null;
}

/* ---- answering you -------------------------------------------------------------- */

/**
 * What a hull says when YOU ask it about ore, danger, the lanes or traffic —
 * from the sky, not the engine's stock lines. Null when the question is not
 * one of those (the engine answers it as before).
 */
export function answerFor(n, intent, now) {
  if (!n || n.rogue) return null;
  const pl = placeOf(n);
  if (intent === "ore") {
    if (n.role !== "miner") return "I don't cut rock — ask a miner on the belt.";
    if (n.job !== "cutting") {
      if (n.carrying?.qty > 0) return `Hauling ${Math.round(n.carrying.qty)} units of ${goodName(n.carrying.id).toLowerCase()} off my claim right now.`;
      return "Between claims just now — ask me when I'm on the rock.";
    }
    const s = claimSurvey(n, now);
    if (!s.rocks) return `This stretch ${placePhrase(pl)} is cut out.`;
    const top = s.ores.slice(0, 3).map((e) => `${e.name.toLowerCase()} ${unitsPhrase(e.units).replace("about ", "~")}`).join(", ");
    return `On the rock ${placePhrase(pl)}: ${top}. Best money is ${(s.pays ?? s.best).name.toLowerCase()}.`;
  }
  if (intent === "danger") {
    const th = threatsNear(n, BELT_THREAT_R, n);
    if (!th.count && !th.nest) return `Nothing hostile inside ${km(BELT_THREAT_R)} km of me ${placePhrase(pl)}.`;
    const bits = [];
    if (th.pirates.length) bits.push(`${countWord(th.pirates.length)} raider${th.pirates.length === 1 ? "" : "s"}`);
    if (th.rogues.length) bits.push(`${countWord(th.rogues.length)} rogue drone${th.rogues.length === 1 ? "" : "s"}`);
    let t = bits.length ? `I have ${bits.join(" and ")} on my board, nearest ${km(th.nearest.d)} km at bearing ${bearingTo(n, th.nearest.n)}.` : "";
    if (th.nest) t += `${t ? " " : ""}${cap(th.nest.name)} is out that way too.`;
    return t;
  }
  if (intent === "route" || intent === "traffic") {
    if (pl.kind !== "port") {
      const th = threatsNear(n, BELT_THREAT_R, n);
      return th.count ? `Out here the only thing I'd route around is ${countWord(th.count)} hostile${th.count === 1 ? "" : "s"} ${km(th.nearest.d)} km off.` : "Nothing out here to route around that I can see.";
    }
    const c = portCensus(pl.station);
    const others = Math.max(0, c.total - 1);
    return `${pl.station.name}: ${countWord(others)} hull${others === 1 ? "" : "s"} around the ring, ${countWord(c.inbound)} on the entry lane, ${countWord(c.bay)} in the bay.`;
  }
  return null;
}
