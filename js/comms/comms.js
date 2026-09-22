/* LIVING GALAXY — the comms director.
 *
 * Four kinds of traffic run through one channel overlay:
 *
 *   NPC → you     a port sees you on approach, a free port makes a demand,
 *                 a guard warns you off. They ring the puck; you answer or not.
 *   you → NPC     HAIL on the AUX page calls whatever is locked, the port you
 *                 are clamped to, or the nearest port. Scripted dialogue with
 *                 real consequences — clearances open clamps, tolls cost credits,
 *                 refusals cost standing.
 *   NPC ↔ NPC     the open channels: ports talking to each other. Overheard on
 *                 the ticker when LISTEN is on, logged to the flight log.
 *   you ↔ pilot   another human on the same server (js/net.js). Live call:
 *                 free text both ways, light-lag from real range, no script.
 *
 * Scripted calls run on sim time, so TIME and pause govern them. Live calls
 * run on the wall clock — the other pilot's clock is not yours to compress.
 */

import { CallSession, CallState } from "./call-session.js";
import { CallUI } from "./call-ui.js";
import { approachScript, guardScript, laneScript, marketScript, newsScript, pirateScript, portScript, trafficLines, undockScript, vesselScript } from "./call-scripts.js";
import { traffic, trafficHooks, vesselById, vesselStatus, captainLine } from "../npc/traffic.js";
import { fightCentre } from "../npc/battles.js";
import { cradle, traitLine } from "../npc/cradle.js";
import { addBodyWaypoint, addWaypointAt, logEvent, selectBody, sim, takeSalvageContract, toggleDock, portWants } from "../sim.js";
import { BODIES, bodyTempK } from "../bodies.js";
import { nearestStation, stationById, stations } from "../stations.js";
import { contacts } from "../turrets.js";
import { requestDock, hasDockRequest } from "../stationworks.js";
import { adjustStanding, corpOfStation, corpOfVessel, standingLabel } from "../corps.js";
import { baseValue } from "../materials.js";
import { shortagesOf } from "../economy.js";
import { pilot } from "../pilot.js";
import { launchPod } from "../interior/boarding.js";
import { net, onMessage } from "../net.js";
import { WARN, CREW } from "../audio.js";
import { rngFromSeed } from "../generate.js";
import { post as chatPost } from "../chat.js";
import { gnnPost } from "../gnn.js";
import { groundedReport, urgentReport, transitionReport, resetReports } from "../npc/reports.js";
import { SIGN_OFF, chatter as speechChatter, noteLost, resetSpeech, speechStats, talkChips, talkTo, regardOf } from "../npc/speech.js";

const APPROACH_RANGE = 9000;
const PIRATE_RANGE = 12000;
const HAIL_RANGE = 60000;
const CARRIER_RANGE = 240000; // beyond this the lag is minutes: no carrier
const CHATTER_RANGE = 140000;
const MS_PER_UNIT = 0.02; // 9000 u → 180 ms; 60000 u → 1.2 s
const COOLDOWN = { approach: 320, pirate: 420, chatter: [28, 75] };

export const comms = {
  ui: null,
  session: null,
  listen: true,
  peerId: null, // live call: who is on the other end
  cooldown: new Map(),
  chatter: { next: 0, queue: [], at: 0, rnd: Math.random },
  lastSim: 0,
  lastWallMs: null,
  sky: null,
};

const $ = (id) => document.getElementById(id);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const quality = (d) => clamp(1 - d / 80000, 0.3, 1);
const busy = () => Boolean(comms.session && (comms.session.isRinging || comms.session.isLive));

/* ---- consequences a script can reach for ---------------------------------- */
function stationCtx(st) {
  const corp = corpOfStation(st);
  return {
    range: () => d3(st, sim.ship.pos),
    flagged: () => Boolean(pilot.corpId && corp && corp.id === pilot.corpId),
    /* what the port is short of right now, by how far over book it pays (economy.js) */
    wants: () => portWants(st, 3).filter((w) => w.over > 1.05).map((w) => `${w.name} (${w.pays} cr)`),
    credits: () => sim.ship.credits,
    pay: (n, why) => {
      sim.ship.credits = Math.max(0, sim.ship.credits - n);
      logEvent(`Paid ${n} cr — ${why}`, "trade");
    },
    undock: () => {
      if (sim.ship.dockedAt === st.id) toggleDock();
    },
    /* a berth: from here on the entry lane and the mouth hand you to the tractor */
    request: () => { requestDock(st, sim.time); logEvent(`Berth granted at ${st.name}`, "port"); },
    requested: () => hasDockRequest(st, sim.time),
    standing: (delta, why) => corp && adjustStanding(corp.id, delta, why),
    /* a refused toll inside pod range gets a breach team, not just the guns */
    board: () => launchPod(st),
    cargoValue: () => Object.entries(sim.ship.hold).reduce((s, [id, q]) => s + q * baseValue(id), 0),
    /* the guns of a free port answer to the watch — not to relation flags */
    provoke: () => {
      st.truceUntil = -1;
      for (const c of contacts) if (c.stationId === st.id) c.truceUntil = -1;
      logEvent(`${st.name} guns hot`, "combat");
    },
    truce: () => {
      st.truceUntil = sim.time + 900;
      for (const c of contacts) if (c.stationId === st.id) c.truceUntil = st.truceUntil;
      logEvent(`${st.name} standing down — toll paid`, "port");
    },
  };
}

/* ---- session plumbing ----------------------------------------------------- */
function attach(session, { wall = false } = {}) {
  if (comms.session && comms.session !== session) comms.session.end("superseded");
  comms.session = session;
  session.wall = wall;
  session.on("node", (node) => {
    if (typeof node?.effect === "function") node.effect(session);
  });
  session.on("choice", (opt) => {
    if (typeof opt?.effect === "function") opt.effect(session);
  });
  session.on("closed", ({ reason }) => {
    if (reason === "missed") logEvent(`Missed call — ${session.peerName}`, "comms");
    else if (reason === "unreachable") logEvent(`${session.peerName} — no reply`, "comms");
    else if (session.lines.length) logEvent(`Channel closed — ${session.peerName}`, "comms");
    if (session.kind === "peer" && reason !== "remote") sendPeer({ op: reason === "rejected" ? "reject" : "end" }, session.peer?.id);
    if (comms.session === session) {
      comms.peerId = null;
      paintAux();
    }
  });
  session.on("state", () => paintAux());
  session.on("line", (l) => {
    if (l.speaker !== "sys") logEvent(`${l.speaker === "self" ? "TX" : "RX"} ${l.name}: ${l.text}`, "comms");
  });
  comms.ui.hideChatter(); // the open channels drop out when you are on one
  comms.ui.attach(session);
  paintAux();
  return session;
}

function npcSession(o) {
  return new CallSession({
    selfName: sim.callsign || "YOU",
    msPerUnit: MS_PER_UNIT,
    seed: (Math.random() * 1e9) | 0,
    ...o,
  });
}

function cooled(key, secs) {
  const t = comms.cooldown.get(key) ?? -1e9;
  return sim.time - t > secs;
}
function cool(key) {
  comms.cooldown.set(key, sim.time);
}

/* ---- NPC → you ------------------------------------------------------------- */
function stationCall(st, script, { incoming, hostile = false, ringTimeoutMs, talk = null } = {}) {
  const d = d3(st, sim.ship.pos);
  const s = npcSession({
    ...(talk ?? {}),
    peerName: `${st.name.toUpperCase()} ${hostile ? "WATCH" : "CONTROL"}`,
    channel: `CH ${1 + (st.id.charCodeAt(st.id.length - 1) % 9)}`,
    rangeU: d,
    quality: quality(d),
    script,
    hostile,
    peer: st,
    kind: "npc",
    ringTimeoutMs: ringTimeoutMs ?? (hostile ? 11000 : 16000),
  });
  attach(s);
  s.hail({ incoming });
  if (incoming && hostile) WARN.alarm();
  else if (incoming) CREW.hail();
  logEvent(`${incoming ? "Incoming hail" : "Hailing"} — ${st.name}`, "comms");
  return s;
}

function findBodyByName(name) {
  for (const b of BODIES) if (b.name === name) return b;
  return null;
}

/* the news desk: a major strike anywhere in the sky goes out as a bulletin.
 * GNN is auto-accepted: it lands in chat (with the desk link and the actions),
 * never rings the puck. The script text is the same the old call read. */
function stepNews() {
  const hit = sim.lastImpact;
  if (!hit || hit.sev < 0.05) return;
  if (hit.at <= (comms.newsAt ?? -1)) return;
  if (!cooled(`news:${hit.body}`, 120)) return;
  comms.newsAt = hit.at;
  cool(`news:${hit.body}`);
  const b = findBodyByName(hit.body);
  if (!b) return;
  const contractRate = Math.round(8 + hit.sev * 20);
  const report = {
    body: b.name,
    rock: hit.rock,
    tier: hit.sev < 0.18 ? "major" : "cataclysm",
    tempK: bodyTempK(b),
    integrity: Math.max(0, b.integrity ?? 1),
    shattered: Boolean(b.shattered),
    speed: 400 + hit.sev * 800,
    blast: hit.blast ?? null,
    contractRate,
  };
  const script = newsScript(report, {});
  gnnPost({
    desk: "news",
    title: script.nodes.lede.text.replace(/^GNN BULLETIN — /, ""),
    body: script.nodes.detail.text,
    actions: [
      { label: "Mark impact site", run: () => { selectBody(b.id); addBodyWaypoint(b.id); } },
      ...(report.shattered ? [{ label: `Salvage contract · ${contractRate} cr/u`, run: () => takeSalvageContract(b.id, contractRate) }] : []),
    ],
  });
  logEvent(`GNN bulletin — ${b.name}`, "comms");
}

/* the markets desk: droughts and terraform bonds read out on the same channel */
function stepMarkets() {
  const d = sim.market?.drought;
  if (d && comms.droughtAt !== d.until && cooled("news:drought", 60)) {
    comms.droughtAt = d.until;
    cool("news:drought");
    const buyers = stations.filter((st) => d.sectors.includes(st.sector));
    const named = (d.ports ?? buyers.map((b) => b.name)).slice(0, 3).join(", ");
    broadcast(marketScript(
      `Drought declaration. ${named || "Thirsty ports"} paying ${d.mult}× for water for the duration. Tankers, you know what to do.`,
      buyers.length
        ? {
            label: "MARK NEAREST BUYER",
            text: "Mark the nearest buyer on my chart.",
            reply: "Nearest buyer is on your chart. Fly safe, fly wet. GNN, clear.",
            effect: () => {
              const ship = sim.ship;
              const st = buyers.sort((a, b) => d3(a, ship.pos) - d3(b, ship.pos))[0];
              selectBody(st.id);
              const wp = addWaypointAt(st.name, st.x, st.y, st.z);
            },
          }
        : null,
    ));
    return;
  }
  const bonds = sim.terraBonds?.size ?? 0;
  if (bonds > (comms.bondsSeen ?? 0)) {
    comms.bondsSeen = bonds;
    if (cooled("news:bond", 60)) {
      cool("news:bond");
      broadcast(marketScript(`A terraform bond has been certified in this system. The charters are calling it "the neighbourhood improving." Standing follows the paper.`));
    }
  }
  /* the markets desk proper: a port whose lines are stalled on something is a bulletin, and a job */
  /* the probe itself is throttled on its own clock: it walks every port's ledger, and mostly finds nothing */
  if (sim.time > 240 && cooled("news:short", 420) && cooled("news:short:probe", 15)) {
    cool("news:short:probe");
    const short = stations
      .filter((st) => !st.hostile)
      .flatMap((st) => shortagesOf(st).filter((x) => x.mult >= 1.45).map((x) => ({ st, ...x })))
      .sort((a, b) => b.mult - a.mult)[0];
    if (short) {
      cool("news:short");
      const { st } = short;
      broadcast(marketScript(
        `Markets desk. ${st.name} reports its lines stalled for want of ${short.name} — the port is paying ${short.pays} credits a unit, ${short.mult.toFixed(1)} times book, until the shelves fill.`,
        {
          label: "MARK BUYER",
          text: "Mark it on my chart.",
          reply: `${st.name} is on your chart. Bring them ${short.name}. GNN, clear.`,
          effect: () => { selectBody(st.id); addWaypointAt(st.name, st.x, st.y, st.z); },
        },
      ));
    }
  }
}

/* a markets/security read-out, auto-accepted: marketScript's text, its action as a link */
function broadcast(script, desk = "markets") {
  const read = script.nodes.read;
  const text = read.text.replace(/^GNN MARKETS — /, "");
  const [title, ...rest] = text.split(/(?<=\.)\s+/);
  const act = read.options.find((o) => o.next === "acted");
  gnnPost({
    desk,
    title: title.replace(/\.$/, ""),
    body: rest.join(" "),
    actions: act ? [{ label: act.label.charAt(0) + act.label.slice(1).toLowerCase(), run: () => script.nodes.acted.effect?.() }] : [],
  });
  logEvent("GNN on the wire", "comms");
  return null;
}

/* the security desk: a firefight goes out on the same channel, with a mark */
function stepBattles() {
  const e = sim.engagement;
  if (!e) return;
  if (comms.engAt !== e.id && sim.time < e.end - 15) {
    if (!cooled("news:eng", 30)) return;
    comms.engAt = e.id;
    cool("news:eng");
    const fc = { ...fightCentre(e) };
    const near = nearestStation(fc);
    const where = near ? `${Math.round(near.dist / 100)} km off ${near.station.name}` : "on the belt approaches";
    const km = Math.round(Math.hypot(fc.x - sim.ship.pos.x, fc.y - sim.ship.pos.y, fc.z - sim.ship.pos.z) / 100);
    broadcast(marketScript(
      `${e.victimName} under attack by ${e.wing.length} pirate hulls ${where}, ${km} km from your position. Security is responding. Bounty stands on every pirate hull; get inside fourteen kilometres and you are in it.`,
      {
        label: "MARK THE FIGHT",
        text: "Mark the engagement on my chart.",
        reply: "Engagement is on your chart. Watch your six going in. GNN, clear.",
        effect: () => { const c = fightCentre(e); addWaypointAt(`Engagement — ${e.victimName}`, c.x, c.y, c.z); },
      },
    ), "security");
    logEvent(`Engagement: ${e.victimName} vs ${e.wing.length} pirates`, "combat");
    return;
  }
  if (e.applied && comms.engEndAt !== e.id) {
    comms.engEndAt = e.id;
    const line = e.playerSaved ? `${e.victimName} saved — the pirates broke off after ${sim.callsign} put one down.`
      : e.outcome === "repelled" ? `${e.victimName} is clear — security put a pirate hull down and the rest ran.`
      : e.outcome === "lost" ? `${e.victimName} lost with all hands. The pirates are back on the belt.`
      : `${e.victimName} broke contact. Both sides ran; nobody died today.`;
    logEvent(line, "combat");
    sim.toast = line;
    sim.lastToastAt = sim.time;
    gnnPost({ desk: "security", title: e.playerSaved ? `${e.victimName} saved` : e.outcome === "lost" ? `${e.victimName} lost` : `${e.victimName} clear`, body: line });
  }
}

function stepIncoming() {
  stepNews();
  stepMarkets();
  stepBattles();
  if (busy() || sim.ship.dockedAt || sim.time < (comms.quietUntil ?? 0)) return;
  /* on a port's entry lane or in its mouth with no berth asked for: control wants a word */
  const ap = sim.approach;
  if (ap && cooled(`ln:${ap.st.id}`, 90)) {
    cool(`ln:${ap.st.id}`);
    stationCall(ap.st, laneScript(ap.st, stationCtx(ap.st), ap.where), { incoming: true });
    return;
  }
  const near = nearestStation(sim.ship.pos, APPROACH_RANGE);
  if (near && !near.station.hostile && cooled(`ap:${near.station.id}`, COOLDOWN.approach)) {
    cool(`ap:${near.station.id}`);
    stationCall(near.station, approachScript(near.station, stationCtx(near.station)), { incoming: true });
    return;
  }
  for (const st of stations) {
    if (!st.hostile || st.claimed || st.guards <= 0) continue;
    if ((st.truceUntil ?? -1) > sim.time) continue;
    if (d3(st, sim.ship.pos) > PIRATE_RANGE * (sim.ship.mods?.menace ?? 1)) continue;
    if (!cooled(`pi:${st.id}`, COOLDOWN.pirate)) continue;
    cool(`pi:${st.id}`);
    stationCall(st, pirateScript(st, stationCtx(st)), { incoming: true, hostile: true });
    return;
  }
}

/* ---- you → NPC / pilot ----------------------------------------------------- */
export function hail() {
  const s = comms.session;
  if (s && s.isRinging) {
    if (s.state === CallState.RINGING_IN) s.accept();
    else s.end("cancelled");
    return;
  }
  if (s && s.isLive) {
    comms.ui.toggleMinimized();
    return;
  }
  const ship = sim.ship;

  if (ship.dockedAt) {
    const st = stationById(ship.dockedAt);
    if (st) {
      cool(`ap:${st.id}`);
      stationCall(st, undockScript(st, stationCtx(st)), { incoming: false });
      return;
    }
  }

  const lock = sim.lock;
  if (lock.id && lock.kind === "station") {
    const st = stationById(lock.id);
    if (st) return hailStation(st);
  }
  if (lock.id && lock.kind === "contact") {
    const c = contacts.find((x) => x.id === lock.id);
    if (c) return hailContact(c);
  }
  const near = nearestStation(ship.pos, HAIL_RANGE);
  if (near) return hailStation(near.station);
  const peer = nearestPeer(HAIL_RANGE);
  if (peer) return hailContact(peer);
  sim.notice = "No one on the channel. Lock a port or a ship and hail again.";
  WARN.deny();
}

/* ---- free talk (npc/speech.js) ---------------------------------------------
 * A hailed hull or port keeps its scripted options (the ones with consequences) and
 * gains TALK: quick lines or free text, answered in character by the speech engine,
 * filed as memory, with the regard it earns handed back as standing. */
function withTalk(script, entity, kind) {
  if (!script?.nodes || !script.start) return { script, talk: null };
  const start = script.nodes[script.start];
  if (!start || start.end) return { script, talk: null };
  let turn = 0;
  const chips = () => {
    const out = talkChips(entity, turn++, kind).map((c) => ({ label: c.label, text: c.text, next: "__talk", tone: "friendly" }));
    out.push({ label: "BACK", text: "One more thing —", next: script.start });
    out.push({ label: SIGN_OFF.label, text: SIGN_OFF.text, next: "__bye" });
    return out;
  };
  start.options = [...(start.options ?? []), { label: "TALK", text: "Got a minute?", next: "__talk", tone: "friendly" }];
  script.nodes.__talk = { text: "Go ahead.", options: chips() };
  script.nodes.__bye = { text: "Out.", end: true };
  const provider = ({ history, node }) => {
    if (node.id !== "__talk" && node.id !== "__bye") return null;
    const said = [...history].reverse().find((l) => l.speaker === "self")?.text ?? "hello";
    const r = talkTo(entity, said, sim.time, kind);
    if (!r?.text) return null;
    if (r.standing) {
      const corp = kind === "station" ? corpOfStation(entity) : corpOfVessel(entity);
      if (corp) logEvent(`${corp.name} ${r.standing > 0 ? "warms to you" : "marks you down"} (${r.standing > 0 ? "+" : ""}${r.standing}) — ${r.intent ?? "talk"}`, "comms");
    }
    return node.id === "__bye" ? { text: r.text } : { text: r.text, options: chips() };
  };
  return { script, talk: { provider, providerTimeoutMs: 1500, talkNode: "__talk" } };
}

function hailStation(st) {
  if (d3(st, sim.ship.pos) > CARRIER_RANGE) {
    sim.notice = `${st.name} is beyond carrier range. Close to under ${Math.round(CARRIER_RANGE / 1000)}k units.`;
    WARN.deny();
    return null;
  }
  cool(`ap:${st.id}`);
  const hostile = st.hostile && !st.claimed && st.guards > 0;
  if (hostile) cool(`pi:${st.id}`);
  if (hostile) return stationCall(st, pirateScript(st, stationCtx(st)), { incoming: false, hostile });
  const { script, talk } = withTalk(portScript(st, stationCtx(st)), st, "station");
  return stationCall(st, script, { incoming: false, hostile, talk });
}

function hailContact(c) {
  const d = d3(c, sim.ship.pos);
  if (d > CARRIER_RANGE) {
    sim.notice = `${c.name} is beyond carrier range.`;
    WARN.deny();
    return null;
  }
  if (c.kind === "peer") return hailPeer(c);
  const guard = Boolean(c.stationId);
  const n = c.kind === "npc" ? vesselById(c.id) : null;
  let script = guard ? guardScript(c) : { start: null, nodes: {} };
  if (n) {
    const rec = cradle.get(n.recId);
    const drought = sim.market?.drought && sim.time < sim.market.drought.until ? sim.market.drought : null;
    script = vesselScript(n, vesselStatus(n), {
      market: drought
        ? `Water. ${(drought.ports ?? []).slice(0, 3).join(", ") || "the thirsty ports"} paying ${drought.mult}× on the drought — get there before it lifts.`
        : `Nothing wild. ${nearestStation(sim.ship.pos, Infinity)?.station?.name ?? "The nearest port"} pays book for what its sector is short of. Check the directory.`,
      crewLine: `${n.captain} commanding, ${n.title}${corpOfVessel(n) ? `, flying for ${corpOfVessel(n).name} (${corpOfVessel(n).powerName ?? corpOfVessel(n).bloc}; ${standingLabel(corpOfVessel(n).standing)} toward you)` : ""}.${rec?.pronouns ? ` ${rec.pronouns.subj[0].toUpperCase()}${rec.pronouns.subj.slice(1)} ${traitLine(rec)}.` : ""}${rec?.origin ? ` From ${rec.origin}.` : ""}`,
    });
  }
  const talked = n && c.relation !== "hostile" ? withTalk(script, n, "vessel") : { script, talk: null };
  script = talked.script;
  const s = npcSession({
    ...(talked.talk ?? {}),
    peerName: c.name.toUpperCase(),
    channel: n ? "CH 2" : "CH 0",
    rangeU: d,
    quality: quality(d),
    script,
    hostile: c.relation === "hostile",
    peer: c,
    answerMs: guard || n ? undefined : Infinity, // a rogue drone has no radio
    ringTimeoutMs: 7000,
  });
  attach(s);
  s.hail({ incoming: false });
  logEvent(`Hailing — ${c.name}`, "comms");
  return s;
}

/* ---- you ↔ pilot (live, over the relay) ------------------------------------ */
function nearestPeer(range) {
  let best = null;
  let bd = range;
  for (const c of contacts) {
    if (c.kind !== "peer") continue;
    const d = d3(c, sim.ship.pos);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  return best;
}

function sendPeer(d, to) {
  if (!to) return;
  sim.send({ t: "cx", name: sim.callsign, ...d }, to);
}

function peerSession(c, incoming) {
  const d = d3(c, sim.ship.pos);
  const s = new CallSession({
    peerName: (c.name || "PILOT").toUpperCase(),
    selfName: sim.callsign || "YOU",
    channel: "CH P",
    rangeU: d,
    msPerUnit: MS_PER_UNIT,
    quality: quality(d),
    live: true,
    peer: c,
    kind: "peer",
    ringTimeoutMs: 20000,
  });
  s.on("say", (text) => sendPeer({ op: "line", text }, c.id));
  attach(s, { wall: true });
  comms.peerId = c.id;
  s.hail({ incoming });
  return s;
}

function hailPeer(c) {
  if (!net.online) {
    sim.notice = "No relay. Pilots need the same server to talk.";
    WARN.deny();
    return null;
  }
  logEvent(`Hailing — ${c.name}`, "comms");
  const s = peerSession(c, false);
  sendPeer({ op: "hail" }, c.id);
  return s;
}

function onPeerMessage(from, d) {
  if (d?.t !== "cx") return;
  const s = comms.session;
  const mine = s && s.kind === "peer" && comms.peerId === from;
  switch (d.op) {
    case "hail": {
      if (busy()) return sendPeer({ op: "reject", why: "busy" }, from);
      const c = contacts.find((x) => x.id === from) ?? { id: from, kind: "peer", name: d.name || "PILOT", x: sim.ship.pos.x, y: sim.ship.pos.y, z: sim.ship.pos.z };
      logEvent(`Incoming hail — ${c.name}`, "comms");
      const sess = peerSession(c, true);
      /* our accept/reject goes back over the wire */
      const off = sess.on("state", (st) => {
        if (st === CallState.CONNECTING) {
          sendPeer({ op: "accept" }, from);
          sess.connect();
          off();
        }
      });
      return;
    }
    case "accept":
      if (mine) s.connect();
      return;
    case "reject":
      if (mine) {
        s.system(d.why === "busy" ? "Channel busy." : "Hail refused.");
        s.end("remote");
      }
      return;
    case "line":
      if (mine) s.receive(d.text, d.name);
      return;
    case "end":
      if (mine) s.end("remote");
      return;
    default:
  }
}

/* ---- NPC ↔ NPC: the open channels ----------------------------------------- */
function stepChatter(dtSim) {
  const ch = comms.chatter;
  if (ch.queue.length) {
    ch.at += dtSim;
    if (ch.at >= 0) {
      const line = ch.queue.shift();
      const d = d3(line.from, sim.ship.pos);
      const q = quality(d);
      const text = q < 0.999 ? garble(line.text, q, ch.rnd) : line.text;
      /* the band lives in the chatbox now (ui/chatbox.js over chat.js); the ticker is for calls */
      if (comms.listen) logEvent(`${line.from.name} › ${line.to.name}: ${text}`, "comms");
      chatPost({ channel: "local", from: line.from.name, text, tone: line.from.sector === "pirate" ? "hostile" : line.urgent ? "alert" : "neutral", meta: { to: line.to?.name ?? null } });
      ch.at = -(3.2 + line.text.length / 26);
    }
    return;
  }
  /* 0.3.16: a hull that is actually being shot calls it at once, whatever the band is doing */
  if (sim.time >= (ch.urgentAt ?? 0)) {
    ch.urgentAt = sim.time + 2;
    const may = urgentReport(sim.ship.pos, sim.time);
    if (may) { ch.queue = [may]; ch.at = 0; return; }
  }
  if (sim.time < ch.next) return;
  ch.next = sim.time + COOLDOWN.chatter[0] + ch.rnd() * (COOLDOWN.chatter[1] - COOLDOWN.chatter[0]);
  noteShootDowns();
  /* first-hand reports — a port's real traffic from a hull that is there, a
   * miner's real seam and the real threats on its belt, a picket's real sweep
   * (npc/reports.js) — share the band with the speech engine's exchanges */
  if (ch.rnd() < 0.5) {
    const rep = groundedReport(sim.ship.pos, sim.time, ch.rnd);
    if (rep) { ch.queue = [rep]; ch.at = 0; return; }
  }
  /* The band is pilots. It used to be three parts speech engine to one part
   * port-to-port shop talk between two buildings a hundred thousand units
   * apart, which is the thing that made the channel read as machinery rather
   * than as a system with people in it. Ports keep every line they actually
   * need — the approach hail, the lane, clearance, the pirate demand — and
   * those are calls on the puck, not gossip on the open channel. */
  const ex = speechChatter(sim.ship.pos, sim.time, ch.rnd, { skySeed: sim.skySeed });
  if (ex) { ch.queue = ex.lines.map(bandLine); ch.at = 0; }
}

/* speech-engine line → the ticker's shape: range and colour from the real hull or port */
function bandLine(l) {
  const at = (u) => u.ref ?? u;
  const f = at(l.from);
  const sector = l.from.faction === "pirate" ? "pirate" : f.sector ?? "traffic";
  return { from: { name: l.from.name, x: f.x, y: f.y, z: f.z, sector }, to: { name: l.to.name }, text: l.text };
}

/* hulls that went off the board since the last look: the band remembers the last one lost */
const downSeen = new Set();
function noteShootDowns() {
  for (const n of traffic) {
    if (n.job === "down") { if (!downSeen.has(n.id)) { downSeen.add(n.id); if (d3(n, sim.ship.pos) < CHATTER_RANGE) noteLost(n); } }
    else downSeen.delete(n.id);
  }
}

const GARBLE = "#%/\\*~+";
function garble(text, q, rnd) {
  const loss = Math.min(0.42, (1 - q) * 0.55);
  let out = "";
  for (const c of text) out += c === " " || rnd() > loss ? c : GARBLE[(rnd() * GARBLE.length) | 0];
  return out;
}

/* ---- HUD wiring ------------------------------------------------------------ */
function paintAux() {
  const s = comms.session;
  const st = $("aux-hail-st");
  const bus = $("aux-comms-st");
  if (!st || !bus) return;
  let hailText = "—";
  let busText = net.online ? `RELAY · ${net.peers} PILOT${net.peers === 1 ? "" : "S"}` : "LOCAL";
  if (s && s.state === CallState.RINGING_IN) hailText = "ANSWER";
  else if (s && s.state === CallState.RINGING_OUT) hailText = "CANCEL";
  else if (s && s.isLive) hailText = "TOGGLE";
  else if (sim.ship.dockedAt) hailText = "CLEARANCE";
  else if (sim.lock.id && (sim.lock.kind === "station" || sim.lock.kind === "contact")) hailText = sim.lock.name.split(" ")[0].toUpperCase().slice(0, 8);
  else {
    const near = nearestStation(sim.ship.pos, HAIL_RANGE);
    hailText = near ? near.station.name.split(" ")[0].toUpperCase().slice(0, 8) : "NO RANGE";
  }
  if (s && (s.isRinging || s.isLive)) busText = `${s.state.replace("_", " ").toUpperCase()} · ${s.peerName.split(" ")[0]}`;
  st.textContent = hailText;
  bus.textContent = busText;
  $("aux-hail")?.classList.toggle("hot", Boolean(s && s.isRinging));
  $("aux-comms")?.classList.toggle("hot", Boolean(s && s.isLive));
  $("aux-listen-st").textContent = comms.listen ? "ON" : "OFF";
  $("aux-listen")?.classList.toggle("on", comms.listen);
}

/** Traffic on the open channel: a hull changing job near you says so, and the port answers. */
function onVesselTransition(n, from, job) {
  const d = d3(n, sim.ship.pos);
  if (d > CHATTER_RANGE) return;
  const ch = comms.chatter;
  if (ch.queue.length > 4) return;
  const port = stations.find((st) => st.name === n.toName) ?? nearestStation(n, Infinity)?.station;
  /* 0.3.16: a miner starting on its claim says what is in the rock and who is on the belt;
   * one coming in says what it actually cut. From the sky, not the stock lines. */
  const rep = transitionReport(n, job, sim.time);
  if (rep) { ch.queue.push(rep); if (ch.at > 0) ch.at = 0; return; }
  if (n.role === "miner" && (job === "cutting" || job === "approach")) return;   // the stock lines would invent it
  /* the hull that changed job opens, to the port it is dealing with if it can reach it */
  if (job && ch.rnd() < 0.7) {
    const ex = speechChatter(sim.ship.pos, sim.time, ch.rnd, { skySeed: sim.skySeed, forceSpeaker: n.id, prefer: port?.id ?? null });
    if (ex) { ch.queue.push(...ex.lines.slice(0, 4).map(bandLine)); if (ch.at > 0) ch.at = 0; return; }
  }
  const lines = trafficLines(n, job, ch.rnd);
  if (!lines) return;
  if (!port) return;
  /* the hull calls the port and the port does NOT answer on the open channel —
   * a berth is granted on the puck, by name, or it is not granted */
  ch.queue.push({ from: { name: captainLine(n).split(" · ")[0] || n.name, x: n.x, y: n.y, z: n.z, sector: "traffic" }, to: { name: port.name }, text: lines[0] });
  if (ch.at > 0) ch.at = 0;
}

export function mountComms() {
  trafficHooks.onTransition = onVesselTransition;
  if (comms.ui) return comms;
  /* On <body>, not in #hud: the HUD is a stacking context that sits under the
   * station deck and the terminal, and a call has to reach you on the deck. */
  comms.ui = new CallUI({ mount: document.body });
  comms.ui.root.hidden = true;
  $("aux-hail")?.addEventListener("click", () => hail());
  $("aux-listen")?.addEventListener("click", () => {
    comms.listen = !comms.listen;
    if (!comms.listen) comms.ui.hideChatter();
    paintAux();
  });
  $("aux-comms")?.addEventListener("click", () => {
    if (comms.session && comms.session.isLive) comms.ui.toggleMinimized();
  });
  onMessage(onPeerMessage);
  comms.lastSim = sim.time;

  /* Keyboard: H hails / answers, Escape is already pause — leave it alone. */
  window.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    if (e.code === "KeyH" && sim.phase === "play") hail();
  });

  let frame = 0;
  const loop = () => {
    frame = requestAnimationFrame(loop);
    step();
  };
  frame = requestAnimationFrame(loop);
  comms.stop = () => cancelAnimationFrame(frame);
  return comms;
}

function step() {
  const dtSim = Math.max(0, sim.time - comms.lastSim);
  /* sim.wall stops on pause; a live call runs on the other pilot's clock, so use the real one */
  const nowMs = performance.now();
  const dtWall = comms.lastWallMs == null ? 0 : Math.min(0.5, Math.max(0, (nowMs - comms.lastWallMs) / 1000));
  comms.lastSim = sim.time;
  comms.lastWallMs = nowMs;

  if (sim.phase === "menu") {
    if (comms.session) {
      comms.session.end("left sky");
      comms.ui.detach();
      comms.session = null;
    }
    comms.ui.hideChatter();
    comms.chatter.queue.length = 0;
    return;
  }
  if (comms.sky !== sim.skySeed) {
    comms.sky = sim.skySeed;
    comms.cooldown.clear();
    comms.chatter.rnd = rngFromSeed(`${sim.skySeed}:chatter`);
    comms.chatter.next = sim.time + 12;
    resetSpeech(sim.skySeed);
    resetReports();
    downSeen.clear();
    comms.quietUntil = sim.time + 8; // let the canopy clear before anyone calls
  }
  comms.ui.root.hidden = sim.phase !== "play"; // the pause screen owns the canopy
  if (sim.phase !== "play") {
    /* pause freezes scripted calls (sim time) but not a live one — the other pilot keeps talking */
    if (comms.session?.wall) comms.ui.tick(dtWall * 1000);
    return;
  }

  const s = comms.session;
  if (s) {
    /* range and signal follow the world while the channel is open */
    const p = s.peer;
    if (p && Number.isFinite(p.x)) {
      s.rangeU = d3(p, sim.ship.pos);
      s.quality = quality(s.rangeU);
    }
    if (s.kind === "peer" && s.peer && !contacts.some((c) => c.id === s.peer.id) && s.isLive) s.end("signal lost");
  }
  /* a live call keeps the other pilot's clock; everything NPC keeps the sim's */
  comms.ui.tick((s && s.wall ? dtWall : dtSim) * 1000);
  stepChatter(dtSim);
  stepIncoming();
  if (sim.wall - (comms.painted ?? -1) > 0.25) {
    comms.painted = sim.wall;
    paintAux();
  }
}

/* console access */
export function wireCommsTest() {
  if (!window.__lg) return;
  window.__lg.comms = {
    comms,
    hail,
    CallState,
    hailStation: (id) => {
      const st = stationById(id);
      return st ? hailStation(st) : null;
    },
    hailContact: (id) => {
      const c = contacts.find((x) => x.id === id);
      return c ? hailContact(c) : null;
    },
    net,
    speech: speechStats,
    regardOf,
  };
}
