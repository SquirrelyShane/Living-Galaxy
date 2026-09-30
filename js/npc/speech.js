import {
  CALIBRATION, PLAYER_PROMPTS, TOPICS, chooseTopic, createWorld, exchange, memoriesFrom, obligationFrom, registerOf,
} from "../speech/npc-speech.js";
import { traffic, HOSTILE_ROLES } from "./traffic.js";
import { flow } from "./flow.js";
import { stations } from "../station/stations.js";
import { corpOfStation, corpOfVessel, corpById, adjustStanding } from "../corp/corps.js";
import { shipById } from "../ships/shipdb.js";
import { baseValue } from "../economy/materials.js";
import { BODIES } from "../world/bodies.js";
import { RACES } from "../crew/races.js";
import { personName } from "../world/names.js";
import { catalogue } from "../corp/gdb.js";
import { PRONOUNS } from "./cradle.js";
import { mulberry } from "../ui/glyphs.js";
import { reports, answerFor } from "./reports.js";
import { placeOf, portCensus, underFire, threatsNear, claimSurvey, bearingTo, THREAT_R } from "./ground.js";
import { dressLine, dressReply, extraChips, loadChatRating } from "./chat.js";

export const SPEECH_SCALE = 60;
export const SPEECH_RANGE = 140000;
const TALK_R = 900;
const MAX_UNITS = 36;
const GAIN_COOLDOWN = 600;

reports.nameOf = (n) => voiceName(n.captain, n.name, n.id);

const DIALS = { lengthLift: 0.22, codaLift: 0.26, questionLift: 0.3 };

export const speech = {
  world: null,
  sky: null,
  units: [],
  byName: new Map(),
  byId: new Map(),
  lastRaised: new Map(),
  lastTopic: new Map(),
  lastLost: null,
  gains: new Map(),
  clock: 0,
  lines: 0,
};

export function resetSpeech(skySeed = "sky") {
  loadChatRating();
  if (!CALIBRATION.fittedFrom) Object.assign(CALIBRATION, DIALS, { fittedFrom: "lg:baked" });
  speech.units.length = 0;
  speech.byName.clear();
  speech.byId.clear();
  speech.lastRaised.clear();
  speech.lastTopic.clear();
  speech.gains.clear();
  speech.lastLost = null;
  speech.clock = 0;
  speech.lines = 0;
  speech.sky = String(skySeed);
  speech.world = createWorld({ seed: hash(speech.sky), units: speech.units, chattiness: 0, logCap: 200, ground: () => groundCtx() });
  groundTopics();
  return speech;
}

function ensure(skySeed) {
  if (!speech.world || (skySeed != null && String(skySeed) !== speech.sky)) resetSpeech(skySeed ?? "sky");
}

function advance(now) {
  const dt = Math.max(0, now - speech.clock);
  speech.clock = now;
  if (dt <= 0 || !speech.world) return;
  const keep = speech.units.splice(0, speech.units.length);
  speech.world.tick(dt);
  speech.units.push(...keep);
}

function hash(s) {
  let h = 0x811c9dc5;
  s = String(s);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
const frac = (s) => (hash(s) % 10007) / 10007;
const polar = (x) => (x < 0.4 ? x * 0.5 : x > 0.6 ? 1 - (1 - x) * 0.5 : x);

export function speechName(name) {
  const bits = String(name ?? "").trim().split(/\s+/);
  const tail = bits.length > 1 && /^\d+$/.test(bits[bits.length - 1]) ? bits.slice(-2).join(" ") : bits[bits.length - 1] ?? "Hull";
  return tail.replace(/-/g, " ").toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

const flowPilots = new Map();
function flowPilot(b) {
  let p = flowPilots.get(b.id);
  if (p) return p;
  const rnd = mulberry(`pilot:${b.id}`);
  const race = RACES[Math.floor(rnd() * RACES.length)] ?? { id: "terran" };
  const g = rnd();
  const gender = g < 0.55 ? "woman" : g < 0.95 ? "man" : "nonbinary";
  const person = catalogue({ id: `pilot:${b.id}`, seed: `pilot:${b.id}`, name: personName(race.id, gender, rnd).full, raceId: race.id, gender }, { kind: "pilot", place: b.from ?? null });
  p = { name: person.name, gender, pronouns: PRONOUNS[gender] };
  flowPilots.set(b.id, p);
  if (flowPilots.size > 400) flowPilots.delete(flowPilots.keys().next().value);
  return p;
}

export function voiceName(person, fallbackHull, id = null) {
  const full = String(person ?? "").trim();
  if (!full) return speechName(fallbackHull);
  const bits = full.split(/\s+/);
  const taken = (n) => { const u = speech.byName.get(n); return u && u.gameId !== id; };
  if (bits.length < 2) return full;
  if (!taken(bits[0])) return bits[0];
  const initial = `${bits[0]} ${bits[1][0]}.`;
  if (!taken(initial)) return initial;
  return full;
}

const ROLE = { trader: "trade", hauler: "haul", miner: "mine", patrol: "patrol", security: "patrol", pirate: "combat" };
const TASK = {
  docked: "idle", outbound: "transit", "in lane": "transit", approach: "transit", cutting: "mine",
  watch: "patrol", lurking: "idle", engaged: "engage", fleeing: "flee", responding: "transit", hold: "idle",
};

function factionOf(corp, hostile) {
  if (hostile) return "pirate";
  return corp?.power ?? corp?.bloc ?? "independent";
}

function tasteOf(key) {
  return {
    words: [7, 12, 17][hash(`${key}:w`) % 3],
    hedges: polar(frac(`${key}:h`)), ceremony: polar(frac(`${key}:c`)),
    naming: polar(frac(`${key}:n`)), deference: polar(frac(`${key}:d`)),
  };
}

function nearestPortName(p) {
  let best = null, bd = Infinity;
  for (const st of stations) {
    const d = Math.hypot(st.x - p.x, st.y - p.y, st.z - p.z);
    if (d < bd) { bd = d; best = st; }
  }
  return best?.name ?? null;
}

function unitFor(id, make) {
  let u = speech.byId.get(id);
  if (!u) { u = make(); speech.byId.set(id, u); }
  return u;
}

function place(u, p) {
  u.position.x = p.x / SPEECH_SCALE;
  u.position.y = p.z / SPEECH_SCALE;
  u.position.z = p.y / SPEECH_SCALE;
}

function vesselUnit(n) {
  const u = unitFor(n.id, () => ({
    gameId: n.id, kind: "vessel", ref: n, name: uniqueName(voiceName(n.captain, n.name, n.id), n.id),
    person: n.captain ?? null, gender: n.captainGender ?? null, pronouns: n.captainPronouns ?? null,
    hullName: speechName(n.name),
    taste: tasteOf(n.recId ?? n.id), position: { x: 0, y: 0, z: 0 }, maxHp: 100,
    oreGrade: null,
  }));
  const corp = corpOfVessel(n);
  const hostile = HOSTILE_ROLES.has(n.role);
  u.ref = n;
  u.role = ROLE[n.role] ?? "trade";
  u.faction = factionOf(corp, hostile);
  u.corpId = corp?.id ?? null;
  u.task = TASK[n.job] ?? "idle";
  u.docked = n.job === "docked";
  const fire = hostile ? null : underFire(n, speech.clock);
  u.underFire = Boolean(fire);
  u.fire = fire;
  u.inCombat = Boolean(fire) || n.job === "engaged";
  u.hp = n.hpMax ? Math.max(0, Math.min(100, (n.hp / n.hpMax) * 100)) : 100;
  const where = placeOf(n);
  u.where = where;
  u.oreGrade = n.role === "miner" && n.job === "cutting" ? Math.round(claimSurvey(n, speech.clock).grade * 100) / 100 : null;
  const held = n.carrying ?? n.cargo ?? null;
  const cap = shipById(n.ship)?.stats?.cargo ?? 60;
  u.cargoMax = cap;
  u.cargo = held ? Math.min(cap, held.qty ?? 0) : (n.role === "miner" && n.job === "cutting" ? cap * 0.5 : 0);
  const book = held ? baseValue(held.id) : 30;
  u.askPrice = Math.round(book * 11.5);
  u.bidPrice = Math.round(book * 9);
  u.nearestName = where.kind === "port" ? where.station.name : where.kind === "belt" ? where.name : null;
  place(u, n);
  return u;
}

function flowUnit(b) {
  const u = unitFor(b.id, () => {
    const p = flowPilot(b);
    return {
      gameId: b.id, kind: "flow", ref: b, name: uniqueName(voiceName(p.name, b.name, b.id), b.id),
      person: p.name, gender: p.gender, pronouns: p.pronouns, hullName: speechName(b.name),
      taste: tasteOf(b.id), position: { x: 0, y: 0, z: 0 }, maxHp: 100, hp: 100, role: "haul",
    };
  });
  const st = stations.find((s) => s.id === b.port);
  const corp = st ? corpOfStation(st) : null;
  u.ref = b;
  u.faction = factionOf(corp, st?.sector === "pirate");
  u.corpId = corp?.id ?? null;
  u.task = b.job === "docked" ? "idle" : "haul";
  u.docked = b.job === "docked";
  u.cargoMax = 60;
  u.cargo = b.inbound ? Math.min(60, b.qty ?? 30) : 6;
  const book = b.good ? baseValue(b.good) : 30;
  u.askPrice = Math.round(book * 11.5);
  u.bidPrice = Math.round(book * 9);
  { const where = placeOf(b); u.where = where; u.nearestName = where.kind === "port" ? where.station.name : null; }
  u.underFire = false;
  place(u, b);
  return u;
}

function stationUnit(st) {
  const u = unitFor(st.id, () => ({
    gameId: st.id, kind: "station", ref: st, name: uniqueName(st.name, st.id),
    taste: tasteOf(st.name), position: { x: 0, y: 0, z: 0 }, isStation: true, role: "fort",
    hp: 900, maxHp: 900, task: "idle",
  }));
  const corp = corpOfStation(st);
  u.ref = st;
  u.faction = factionOf(corp, st.sector === "pirate");
  u.corpId = corp?.id ?? null;
  u.nearestName = st.name;
  u.berths = Math.max(0, (st.gen?.stats?.hangars ?? 1) * 3 - ((st.dronesOut?.length ?? 0) > 0 ? 1 : 0));
  place(u, st);
  return u;
}

function uniqueName(want, id) {
  let name = want;
  for (let k = 2; speech.byName.has(name) && speech.byName.get(name).gameId !== id; k++) name = `${want} ${String.fromCharCode(64 + k)}`;
  return name;
}

export function syncBand(pos, skySeed = null) {
  ensure(skySeed);
  speech.playerPos = pos;
  const d = (o) => Math.hypot(o.x - pos.x, o.y - pos.y, o.z - pos.z);
  const pool = [];
  for (const n of traffic) if (n.visible !== false && n.job !== "down" && !n.rogue && d(n) < SPEECH_RANGE) pool.push([d(n), () => vesselUnit(n)]);
  for (const b of flow) if (b.visible !== false && d(b) < SPEECH_RANGE * 0.5) pool.push([d(b) * 1.6, () => flowUnit(b)]);
  pool.sort((a, b) => a[0] - b[0]);
  speech.units.length = 0;
  speech.byName.clear();
  for (const [, make] of pool.slice(0, MAX_UNITS)) {
    const u = make();
    speech.units.push(u);
    speech.byName.set(u.name, u);
  }
  return speech.units;
}

const LG_PLACE = /\b(Kessel Deep|Ostrava Ring|Ostrava|the Boneyard|Tessera Shallows|Cinder Reach|the Fallow Drift|Vachell Gap|Harrow Point)\b/g;
export function localise(text) {
  if (!text) return text;
  let out = text.replace(/\bthe second marker\b/g, "the second beacon");
  if (!LG_PLACE.test(out)) return out;
  LG_PLACE.lastIndex = 0;
  const pool = [...stations.map((s) => s.name), ...BODIES.filter((b) => b.kind !== "star").map((b) => b.name)];
  if (!pool.length) return out.replace(LG_PLACE, "the far side");
  return out.replace(LG_PLACE, (m) => pool[hash(`${speech.sky}:${m}`) % pool.length]);
}

const relKey = (a, b) => [a, b].sort().join("~");

function ctxFor(a, b) {
  const ctx = speech.world.ctxFor(a, b);
  ctx.lastRaised = (x, y, key) => {
    const at = speech.lastRaised.get(`${relKey(x.name, y.name)}:${key}`);
    return at == null ? null : speech.clock - at;
  };
  ctx.lastTopic = (x, y) => speech.lastTopic.get(relKey(x.name, y.name)) || null;
  Object.assign(ctx, groundCtx());
  return ctx;
}

function groundCtx() {
  const ctx = {};
  ctx.playerNear = (u) => !speech.playerPos || !u?.ref || Math.hypot(u.ref.x - speech.playerPos.x, u.ref.y - speech.playerPos.y, u.ref.z - speech.playerPos.z) < THREAT_R;
  ctx.lostHull = () => speech.lastLost;
  ctx.threatNear = (u) => Boolean(u?.ref) && threatsNear(u.ref, THREAT_R, u.ref).count > 0;
  ctx.threatCount = (u) => (u?.ref ? threatsNear(u.ref, THREAT_R, u.ref).count : 0);
  ctx.threatBearing = (u) => { const t = u?.ref ? threatsNear(u.ref, THREAT_R, u.ref).nearest : null; return t ? bearingTo(u.ref, t.n) : null; };
  ctx.trafficNear = (u) => (u?.where?.kind === "port" ? Math.max(0, portCensus(u.where.station).total - 1) : 0);
  ctx.tipWasGood = (u) => (u?.oreGrade ?? 0.5) >= 0.45;
  ctx.playerBearing = (u) => (u?.ref && speech.playerPos ? bearingTo(u.ref, speech.playerPos) : null);
  return ctx;
}

const GROUNDED = {
  askHelp:       (a, b) => a.underFire && !HOSTILE_ROLES.has(b.ref?.role),
  refuseHelp:    (a) => a.underFire,
  medicalAid:    (a) => !a.underFire,
  rescueReport:  (a, b) => !b.underFire,
  positionReport: (a) => Boolean(a.ref) && threatsNear(a.ref, THREAT_R, a.ref).count === 0,
  laneReport:    (a) => a.where?.kind === "port",
  routeAdvice:   () => false,
  oreTip:        (a) => a.oreGrade != null,
  gradeReport:   (a) => a.oreGrade != null,
  claimDispute:  (a, b) => a.oreGrade != null && b.oreGrade != null,
  smallTalk:     (a) => !(a.ref && threatsNear(a.ref, THREAT_R, a.ref).count),
};
function groundTopics() {
  for (const [k, extra] of Object.entries(GROUNDED)) {
    const T = TOPICS[k];
    if (!T || T.__grounded) continue;
    const when = T.when;
    T.when = (a, b, ctx) => (when ? when(a, b, ctx) : true) && extra(a, b, ctx);
    T.__grounded = true;
  }
}

function commit(key, ctx, script) {
  const w = speech.world;
  const pairK = relKey(ctx.a.name, ctx.b.name);
  speech.lastRaised.set(`${pairK}:${key}`, speech.clock);
  speech.lastTopic.set(pairK, key);
  const r = w.rel(ctx.a, ctx.b);
  r.exchanges++;
  for (const m of memoriesFrom(key, ctx)) {
    w.memories.push({
      holder: m.holder.name || m.holder,
      subject: m.subject === "player" ? "player" : (m.subject.name || m.subject),
      type: m.type, weight: m.weight, hearsay: m.hearsay, topic: m.topic, at: w.time,
    });
  }
  r.regard = (w.regardFor(ctx.a, ctx.b) + w.regardFor(ctx.b, ctx.a)) / 2;
  const ob = obligationFrom(key, ctx, true);
  if (ob) w.obligations.push({ kind: ob.kind, from: ob.from.name, to: ob.to.name, topic: key, at: w.time });
  for (const line of script) {
    w.log.push({
      at: w.time, channel: TOPICS[key].channel, topic: key, move: line.move, frame: line.frame,
      speaker: line.speaker.name, listener: line.listener.name, text: line.text, turn: line.turn,
      register: registerOf(line.speaker, TOPICS[key].mood),
    });
  }
  while (w.log.length > 200) w.log.shift();
}

const sd = (a, b) => Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y, (a.position.z || 0) - (b.position.z || 0));

export function chatter(pos, now, rnd = Math.random, { skySeed = null, forceSpeaker = null, prefer = null } = {}) {
  syncBand(pos, skySeed);
  advance(now);
  const U = speech.units.filter((u) => !u.isStation);
  if (U.length < 2) return null;
  for (let attempt = 0; attempt < 4; attempt++) {
    let a = forceSpeaker ? speech.byId.get(forceSpeaker) : null;
    if (a?.isStation) return null;
    if (!a) {
      const w = U.map((u, i) => 1 / (1 + i * 0.35));
      let draw = rnd() * w.reduce((s, x) => s + x, 0);
      a = U[U.length - 1];
      for (let i = 0; i < U.length; i++) { draw -= w[i]; if (draw <= 0) { a = U[i]; break; } }
    }
    const cands = U.filter((u) => u !== a && !u.isStation && sd(u, a) < TALK_R);
    if (!cands.length) { if (forceSpeaker) return null; continue; }
    let b = prefer ? cands.find((u) => u.gameId === prefer) : null;
    if (!b) {
      const cw = cands.map((u) => 1 / (1 + sd(u, a) / 300));
      let draw = rnd() * cw.reduce((s, x) => s + x, 0);
      b = cands[cands.length - 1];
      for (let i = 0; i < cands.length; i++) { draw -= cw[i]; if (draw <= 0) { b = cands[i]; break; } }
    }
    const ctx = ctxFor(a, b);
    const key = chooseTopic(a, b, ctx);
    if (!key) continue;
    const script = exchange(key, ctx);
    if (!script.length) continue;
    commit(key, ctx, script);
    speech.lines += script.length;
    const channel = TOPICS[key].channel;
    return {
      topic: key,
      channel,
      lines: script.map((l) => ({
        from: l.speaker,
        to: l.listener,
        move: l.move,
        text: dressLine({
          text: localise(l.text), channel: "open", engineChannel: channel, topic: key, move: l.move,
          frame: l.frame, turn: l.turn, speaker: l.speaker, listener: l.listener,
          role: l.speaker?.role ?? null, register: registerOf(l.speaker, TOPICS[key].mood),
          regard: speech.world.regardFor(l.speaker, l.listener), ref: l.speaker?.ref ?? null,
        }),
      })),
    };
  }
  return null;
}

export function unitOf(entity, kind = null) {
  ensure(null);
  if (!entity) return null;
  const k = kind ?? (entity.sector !== undefined && entity.radius !== undefined ? "station" : String(entity.id).startsWith("flow:") ? "flow" : "vessel");
  const u = k === "station" ? stationUnit(entity) : k === "flow" ? flowUnit(entity) : vesselUnit(entity);
  if (!speech.units.includes(u)) { speech.units.push(u); speech.byName.set(u.name, u); }
  return u;
}

export function talkTo(entity, text, now, kind = null) {
  const u = unitOf(entity, kind);
  if (!u) return null;
  advance(now);
  const reply = speech.world.talk(u, text);
  if (!reply) return null;
  if (u.kind === "vessel") {
    const intent = /\b(traffic|busy|queue|crowd)/i.test(text) ? "traffic" : reply.intent;
    const grounded = answerFor(u.ref, intent, now);
    if (grounded) reply.text = grounded;
  }
  let standing = 0;
  const delta = reply.regardDelta || 0;
  if (delta && u.corpId && corpById(u.corpId)) {
    const last = speech.gains.get(u.name) ?? -1e9;
    if (delta < 0 || now - last > GAIN_COOLDOWN) {
      standing = Math.round(delta * 10 * 10) / 10;
      adjustStanding(u.corpId, standing, `comms: ${reply.intent ?? "talk"}`);
      if (delta > 0) speech.gains.set(u.name, now);
    }
  }
  const dressed = dressReply({
    text: localise(reply.text), channel: "direct", topic: reply.intent ?? null, move: reply.move ?? "answer",
    speaker: u, listener: "player", role: u.role, register: registerOf(u),
    regard: speech.world.regardFor(u, "player"), ref: u.ref ?? null, said: text,
  });
  return { ...reply, text: dressed, standing, speaker: u.name, register: registerOf(u) };
}

export function regardOf(entity, kind = null) {
  const u = unitOf(entity, kind);
  if (!u) return { regard: 0, why: [] };
  return { regard: speech.world.regardFor(u, "player"), why: speech.world.whyRegard(u, "player").slice(0, 5) };
}

export function noteLost(entity) {
  if (!entity?.name) return;
  speech.lastLost = speechName(entity.name);
}

const CHIP = [
  { label: "HELLO", text: PLAYER_PROMPTS[0], roles: null },
  { label: "STATUS?", text: PLAYER_PROMPTS[1], roles: null },
  { label: "ORE?", text: PLAYER_PROMPTS[2], roles: ["mine", "fort", "haul"] },
  { label: "CARGO?", text: PLAYER_PROMPTS[3], roles: ["trade", "haul"] },
  { label: "LANE SAFE?", text: PLAYER_PROMPTS[4], roles: ["patrol", "fort", "trade", "haul"] },
  { label: "PRICE?", text: PLAYER_PROMPTS[5], roles: ["trade", "haul", "fort"] },
  { label: "NEED A HAND?", text: PLAYER_PROMPTS[6], roles: null },
  { label: "ABOUT ME?", text: PLAYER_PROMPTS[7], roles: null },
  { label: "GOSSIP?", text: PLAYER_PROMPTS[8], roles: null },
];

export function talkChips(entity, turn = 0, kind = null) {
  const u = unitOf(entity, kind);
  const fit = CHIP.filter((c) => !c.roles || c.roles.includes(u?.role));
  const out = [];
  for (let i = 0; i < 3 && i < fit.length; i++) out.push(fit[(turn * 3 + i + (hash(u?.name ?? "") % fit.length)) % fit.length]);
  const mine = out.filter((c, i, a) => a.indexOf(c) === i);
  return [...mine, ...extraChips(u, turn, "direct")].slice(0, 5);
}

export const SIGN_OFF = { label: "SIGN OFF", text: "Thanks for that. Signing off." };

export function speechStats() {
  const w = speech.world;
  return {
    sky: speech.sky, band: speech.units.length, lines: speech.lines, clock: Math.round(speech.clock),
    memories: w?.memories.length ?? 0, obligations: w?.obligations.length ?? 0, phrasings: w?.speech.size ?? 0,
    dials: { ...CALIBRATION },
  };
}
