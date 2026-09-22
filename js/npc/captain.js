/* LIVING GALAXY experimental — the conn.
 *
 * Whoever holds command flies the hull. By default that is you. Hand it to a
 * crew member from the deck plan and they fly it: every second they assemble
 * a snapshot of the hull and everything inside scan range (contacts, ports,
 * rocks, threats, and the deck itself — who is aboard, what is synthetic,
 * what is a drone, what the interior sensors see), ask the neural core for a
 * reflex, roll every candidate goal sixty seconds forward with the
 * forecaster, and take the goal with the best expected outcome. Then they
 * steer through the same input path you do — injected pan and throttle — so
 * the hull obeys them exactly the way it obeys you.
 *
 * Pluggable: `captain.provider = async (snapshot, candidates) => ({ action,
 * rationale })` lets a local SLM make the call instead (with the forecaster's
 * numbers in the prompt). It falls back to the core on timeout.
 *
 * While you hold the conn, the core watches you and learns.
 */

import { DROPOUT_ODDS, plotRoute, sim, sellPriceAt, stationStatus, toggleDock, setThrottle, setMiningMode, setTurretMode, requestJump, acquireLock, logEvent, selectBody } from "../sim.js";
import { tractor, inDeparture } from "../stationworks.js";
import { stationById } from "../stations.js";
import { setInjectedPan, touch } from "../input.js";
import { contacts, mining, turretAim } from "../turrets.js";
import { nearestStation } from "../stations.js";
import { BODIES, bodyPosition, scanRadius } from "../bodies.js";
import { inBelt, nearbyRocks } from "../field.js";
import { benchValue, iceworkFit } from "../icework.js";
import { impactors } from "../impactors.js";
import { forwardOf, cargoTotal, batteryCap } from "../ship.js";
import { corpOfStation } from "../corps.js";
import { crew } from "../crew.js";
import { cradle } from "./cradle.js";
import { ACTIONS, N_FEATURES, createBrain, features, labelFromPlay, learnImitation, learnOutcome, think } from "./brain.js";

/* a one-key bus so aria.js can hear about decisions without captain.js
 * importing it — aria.js imports captain.js, and the cycle would bite */
export const ariaHooks = { onDecision: null, pilot: null, onPlayLabel: null, onStick: null, onPlayerJob: null };

export const captain = {
  holder: "player",      // "player" | crew member id
  member: null,          // the crew record holding the conn
  brain: null,
  goal: null,            // { action, target, since, rationale, forecast }
  log: [],               // last decisions, newest first
  provider: null,        // optional SLM bridge
  providerBusy: false,
  lastThink: 0,
  lastLearn: 0,
  decideGen: 0,          // bumps per decide(); a late result from an older tick is dropped
  lastSnapshot: null,
  /* outcome learning: the state the last decision was made in */
  decision: null,        // { x, action, at, hull, credits, cargo }
};

const _p = { x: 0, y: 0, z: 0 };

function note(text, kind = "conn") {
  captain.log.unshift({ t: sim.time, text });
  captain.log.length = Math.min(captain.log.length, 40);
  logEvent(text, kind);
}

/* ---- command ------------------------------------------------------------- */

export function holderName() {
  return captain.holder === "player" ? sim.callsign || "you" : captain.member?.name ?? "the conn";
}

export function transferCommand(memberId) {
  const m = crew.aboard.find((x) => x.id === memberId);
  if (!m) return { ok: false, error: "Not aboard" };
  if (m.robot) return { ok: false, error: "A robot cannot hold the conn." };
  if (m.morale < 30) return { ok: false, error: `${m.name} will not take the conn in this mood.` };
  const rec = cradle.get(m.id);
  captain.holder = m.id;
  captain.member = m;
  /* a first-time captain inherits the house core — everything it learned from you — with their own temperament laid over it */
  captain.brain = rec?.brain && isSane(rec.brain) ? rec.brain : inheritBrain(m);
  captain.goal = null;
  captain.decision = null;
  captain.lastThink = 0;
  if (rec) {
    rec.status = "captain";
    rec.commandsHeld = (rec.commandsHeld ?? 0) + 1;
    rec.brain = captain.brain;
    cradle.note(rec.id, `Took the conn of ${sim.callsign ?? "a hull"}'s ship`);
  }
  sim.notice = `${m.name} has the conn.`;
  note(`${m.name} has the conn. ${sim.callsign ?? "Pilot"} stands down to first officer.`);
  return { ok: true };
}

export function retakeCommand() {
  if (captain.holder === "player") return { ok: false, error: "You already have the conn." };
  const m = captain.member;
  const rec = m && m.id !== "aria" ? cradle.get(m.id) : null;
  if (rec) {
    rec.status = "aboard";
    rec.brain = captain.brain;
    cradle.note(rec.id, `Handed the conn back after ${captain.log.length} decisions`);
  }
  captain.holder = "player";
  captain.member = null;
  captain.goal = null;
  captain.decision = null;
  setInjectedPan(null);
  touch.brake = false;
  setThrottle(0); // the holder's last burn is not yours — 0.3 handed back a hull still at full mains
  sim.notice = "You have the conn.";
  note(`${m?.name ?? "The conn"} stands down. You have the ship.`);
  return { ok: true };
}

/** If the holder walks or is dismissed, the conn falls back to you. */
function checkHolder() {
  /* ARIA is not on the crew list and never will be — it has no berth, no wage
   * and no morale. It is still a legitimate holder of the conn. */
  if (captain.holder === "aria") return;
  if (captain.holder !== "player" && !crew.aboard.some((x) => x.id === captain.holder)) retakeCommand();
}

/* ---- the snapshot ------------------------------------------------------- */

/**
 * Everything the captain reasons over, in one plain object. Also what the
 * interior sensors report — the deck plan's crew, synthetics, robotics —
 * so a captain knows who is aboard when they decide to run or fight.
 */
export function snapshot() {
  const ship = sim.ship;
  const near = nearestStation(ship.pos, 60000);
  const st = near?.station ?? null;
  let port = null;
  if (st) {
    const d = Math.hypot(st.x - ship.pos.x, st.y - ship.pos.y, st.z - ship.pos.z);
    const co = corpOfStation(st);
    port = { id: st.id, name: st.name, dist: d, hostile: Boolean(st.hostile && !st.claimed && st.guards > 0), standing: co?.standing ?? 0, sector: st.sector, x: st.x, y: st.y, z: st.z };
  }
  const scan = (ship.mods?.scan ?? 1) * 12000;
  const seen = contacts.filter((c) => c.hp > 0 && Math.hypot(c.x - ship.pos.x, c.y - ship.pos.y, c.z - ship.pos.z) <= scan);
  const hostileList = seen.filter((c) => c.relation === "hostile");
  let nearestHostile = Infinity;
  for (const c of hostileList) nearestHostile = Math.min(nearestHostile, Math.hypot(c.x - ship.pos.x, c.y - ship.pos.y, c.z - ship.pos.z));
  /* nearest unsurveyed world */
  let unsurveyed = null;
  let unsurveyedD = Infinity;
  for (const b of BODIES) {
    if (b.kind === "star" || sim.scanned.has(b.id)) continue;
    bodyPosition(b.id, sim.time, _p);
    const d = Math.hypot(_p.x - ship.pos.x, _p.y - ship.pos.y, _p.z - ship.pos.z) - scanRadius(b);
    if (d < unsurveyedD) { unsurveyedD = d; unsurveyed = b; }
  }
  const rocks = inBelt(ship.pos) ? nearbyRocks(ship.pos, sim.time) : [];
  /* what a unit cut here is worth to THIS ship: veins rich, ice at the bench's melted value */
  let rockValue = 0;
  let iceShare = 0;
  if (rocks.length) {
    for (const r of rocks) {
      rockValue += benchValue(r.ore) * (r.rich ? 1.6 : 1);
      if (r.ice) iceShare++;
    }
    rockValue /= rocks.length;
    iceShare /= rocks.length;
  }
  const threat = sim.threats?.[0] ?? null;
  return {
    t: sim.time,
    hull: ship.hull, o2: ship.o2, battery: ship.charge / batteryCap(ship), heat: sim.heat,
    cargoFill: cargoTotal(ship) / Math.max(1, ship.cargoCap), credits: ship.credits,
    docked: Boolean(ship.dockedAt), throttle: ship.throttle,
    mining: mining.active, firing: turretAim.firing, warping: sim.warp.state !== "idle",
    lockKind: sim.lock.kind, lockId: sim.lock.id,
    port,
    scanRange: scan,
    contacts: seen.map((c) => ({ id: c.id, name: c.name, kind: c.kind, relation: c.relation, dist: Math.hypot(c.x - ship.pos.x, c.y - ship.pos.y, c.z - ship.pos.z) })),
    hostiles: hostileList.length,
    nearestHostile: Number.isFinite(nearestHostile) ? nearestHostile : null,
    inBelt: rocks.length > 0,
    rocks: rocks.length,
    rockValue,
    iceShare,
    benchFit: iceworkFit().ok,
    drought: Boolean(sim.market?.drought && sim.time < sim.market.drought.until),
    unsurveyed: unsurveyed ? Math.max(0, unsurveyedD) : null,
    unsurveyedId: unsurveyed?.id ?? null,
    unsurveyedName: unsurveyed?.name ?? null,
    threatEta: threat?.etaSelf ?? null,
    threatName: threat?.name ?? null,
    /* the deck: what the interior sensors report */
    interior: interiorReport(),
  };
}

/** Who and what is inside the hull, as the sensors classify it. */
export function interiorReport() {
  const allied = crew.aboard.filter((m) => !m.synthetic).length;
  const synthetic = crew.aboard.filter((m) => m.synthetic).length;
  const robotics = sim.interior?.robots ?? 0;
  const intruders = sim.interior?.intruders?.length ?? 0;
  const sensors = sim.interior?.sensors ?? 0;
  const lowMorale = crew.aboard.filter((m) => m.morale < 35).map((m) => m.name);
  return { aboard: crew.aboard.length, allied, synthetic, robotics, intruders, sensors, lowMorale };
}

/* ---- the forecaster ------------------------------------------------------ */

/**
 * Roll a goal 60 s forward with a coarse model and return an expected score.
 * Not the sim — arithmetic on the snapshot: closure rates, damage rates,
 * yield rates, the things a captain estimates in their head.
 */
export function forecast(s, action) {
  const T = 60;
  /* cruise closure: what the hull is doing now, floored at a working estimate */
  const cur = Math.hypot(sim.ship.vel.x, sim.ship.vel.y, sim.ship.vel.z);
  const speed = Math.max(80, cur);
  const intruders = s.interior?.intruders ?? 0;
  let hull = s.hull, credits = 0, cargo = s.cargoFill, risk = 0, why = "";
  const hostileDmg = s.hostiles ? 0.35 * s.hostiles * (s.nearestHostile ? Math.max(0.2, 1 - s.nearestHostile / 12000) : 0.5) : 0;
  switch (action) {
    case "hold":
      hull -= hostileDmg * T * 0.8;
      hull -= s.heat * 12;
      why = s.hostiles ? "sitting under guns" : "station-keeping, nothing gained";
      break;
    case "dock":
      if (!s.port) { risk = 1; why = "no port in range"; break; }
      if (s.port.hostile) { hull -= 40; risk = 0.8; why = `${s.port.name} would shoot`; break; }
      { const eta = s.port.dist / speed;
        hull -= hostileDmg * Math.min(T, eta);
        credits += holdValueAt(s.port.id); // what THIS port actually pays
        credits += s.hull < 60 ? 200 : 0; // repairs are worth something
        credits += intruders ? 300 : 0;   // port security ends a boarding fast
        risk = s.port.standing < -35 ? 0.5 : 0;
        why = `dock ${s.port.name} in ${Math.round(eta)} s, sell the hold${s.drought && (sim.ship.hold?.water ?? 0) > 1 ? " — drought pays" : ""}`; }
      break;
    case "mine":
      if (!s.inBelt) { risk = 0.6; why = "no rocks in reach"; break; }
      if (cargo > 0.95) { why = "hold is full"; break; }
      { const gain = Math.min(0.12, 1 - cargo);
        cargo += gain;
        /* per-unit value of THIS field — veins rich, ice at melted value when the bench is fitted */
        const unit = s.rockValue > 0 ? s.rockValue : 6;
        credits += gain * (sim.ship.cargoCap ?? 400) * unit * 0.25; // a minute cuts a quarter of that gain's book
        hull -= hostileDmg * T;
        why = `cut ${s.rocks} rocks at ~${unit.toFixed(1)} cr/u${s.iceShare > 0.5 ? (s.benchFit ? " (melting the field)" : " (ice — no bench)") : ""}`; }
      break;
    case "survey":
      if (s.unsurveyed == null) { risk = 0.5; why = "sky is logged"; break; }
      { const eta = s.unsurveyed / (speed * 4); // warp closes faster
        credits += eta < T ? 350 : 120;
        hull -= hostileDmg * Math.min(T, eta);
        why = `survey ${s.unsurveyedName} (${Math.round(s.unsurveyed / 1000)}k u)`; }
      break;
    case "evade":
      if (!s.hostiles && !s.threatEta) { risk = 0.3; why = "nothing to run from"; break; }
      hull -= hostileDmg * T * 0.3;
      credits -= 20;
      why = s.threatEta ? `clear ${s.threatName} track` : "open the range";
      break;
    case "engage":
      if (!s.hostiles) { risk = 0.5; why = "no target"; break; }
      hull -= hostileDmg * T * 1.4;
      credits += s.hostiles * 150;
      risk = s.hull < 50 ? 0.7 : 0.2;
      why = `fight ${s.hostiles} contact${s.hostiles > 1 ? "s" : ""} at ${Math.round(s.nearestHostile ?? 0)} u`;
      break;
  }
  /* a deck fight makes everything but docking and running worse */
  if (intruders && (action === "mine" || action === "survey" || action === "hold")) { risk += 0.8; why += "; intruders aboard"; }
  const hullLoss = s.hull - hull;
  /* score: hull is worth more the less you have; credits scaled; risk is a flat penalty */
  const score = credits / 400 - hullLoss * (s.hull < 40 ? 0.12 : 0.05) - risk * 2 + (action === "dock" && s.hull < 35 && s.port && !s.port.hostile ? 3 : 0);
  return { action, score, hull: Math.max(0, hull), credits, cargo, risk, why };
}

/** What the hold would fetch at a given port, through the real price path. */
export function holdValueAt(portId) {
  const st = stationById(portId);
  if (!st) return 0;
  let v = 0;
  for (const [id, q] of Object.entries(sim.ship.hold ?? {})) v += q * sellPriceAt(st, id);
  return v;
}

/* ---- deciding ----------------------------------------------------------- */

async function decide(s) {
  const x = features(s);
  const reflex = think(captain.brain, x);
  const forecasts = ACTIONS.map((a) => forecast(s, a));
  /* blend: forecaster score + reflex prior scaled by how much the core has learned */
  const trust = Math.min(1, (captain.brain.steps + captain.brain.outcomes) / 200);
  const traits = captain.member?.traits ?? {};
  const ranked = forecasts.map((f) => {
    const r = reflex.find((k) => k.action === f.action)?.p ?? 0;
    let v = f.score + (r - 1 / ACTIONS.length) * 6 * (0.35 + trust * 0.65);
    /* personality on top of the numbers */
    if (f.action === "engage") v += ((traits.grit ?? 0.5) - 0.5) * 1.5 - ((traits.caution ?? 0.5) - 0.5) * 1.5;
    if (f.action === "evade") v += ((traits.caution ?? 0.5) - 0.5) * 1.5;
    if (f.action === "mine" || f.action === "dock") v += ((traits.greed ?? 0.5) - 0.5) * 0.8;
    if (f.action === "survey") v += ((traits.curiosity ?? 0.5) - 0.5) * 1.2;
    /* stickiness: do not flip goals every second */
    if (captain.goal?.action === f.action) v += 0.6;
    return { ...f, value: v, reflex: r };
  }).sort((a, b) => b.value - a.value);

  let pick = ranked[0];
  let rationale = `${pick.why}; core ${Math.round(pick.reflex * 100)}%`;
  if (captain.provider && !captain.providerBusy) {
    captain.providerBusy = true;
    /* The timer used to run to completion whoever won the race, holding its
     * closure — and the race's reject — alive for four seconds and then firing
     * at an already-settled promise. One decision per captain per cadence is
     * one orphan timer per decision. Clear it in `finally`. */
    let timer = 0;
    try {
      const res = await Promise.race([
        captain.provider(s, ranked),
        new Promise((_, rej) => { timer = setTimeout(() => rej(new Error("provider timeout")), 4000); }),
      ]);
      const chosen = res?.action && ranked.find((r) => r.action === res.action);
      if (chosen) { pick = chosen; rationale = res.rationale || rationale; }
    } catch { /* fall back to the core */ } finally {
      if (timer) clearTimeout(timer);
    }
    captain.providerBusy = false;
  }
  return { pick, rationale, x, ranked };
}

/* ---- flying ------------------------------------------------------------- */

function steerToward(tx, ty, tz, throttle) {
  const ship = sim.ship;
  const dx = tx - ship.pos.x, dy = ty - ship.pos.y, dz = tz - ship.pos.z;
  const d = Math.hypot(dx, dy, dz) || 1;
  const wantYaw = Math.atan2(-dx / d, -dz / d);
  const wantPitch = Math.asin(Math.max(-1, Math.min(1, dy / d)));
  let ey = wantYaw - ship.yaw;
  while (ey > Math.PI) ey -= Math.PI * 2;
  while (ey < -Math.PI) ey += Math.PI * 2;
  const ep = wantPitch - ship.pitch;
  const f = forwardOf(ship.yaw, ship.pitch);
  const facing = (dx * f.x + dy * f.y + dz * f.z) / d;
  /* stick-right REDUCES yaw in the flight model — the error goes in negated */
  setInjectedPan({ x: Math.max(-1, Math.min(1, -ey * 1.6)), y: Math.max(-1, Math.min(1, ep * 1.6)) });
  setThrottle(facing > 0.8 ? throttle : facing > 0.3 ? throttle * 0.4 : 0.1);
  return d;
}

function steerAway(fx, fy, fz) {
  const ship = sim.ship;
  steerToward(ship.pos.x * 2 - fx, ship.pos.y * 2 - fy, ship.pos.z * 2 - fz, 1.2);
}

function execute(goal, s) {
  const ship = sim.ship;
  if (goal.action !== "dock") touch.brake = false;
  switch (goal.action) {
    case "hold":
      setInjectedPan({ x: 0, y: 0 });
      setThrottle(0);
      if (mining.active || ship.miningMode !== "off") setMiningMode("off");
      break;
    case "dock": {
      if (!s.port) break;
      if (ship.dockedAt) { setThrottle(0); break; }
      /* control has the helm (a pull or the push out), or we are fresh off the push: no DOCK from the conn */
      if (tractor.active) { setThrottle(0); break; }
      const st = stationStatus();
      if (st && inDeparture(st.station, ship, sim.time)) { setThrottle(0.3); break; }
      const range = st?.range ?? 600;
      const d = steerToward(s.port.x, s.port.y, s.port.z, d3(s.port) > 6000 ? 1.0 : d3(s.port) > range * 3 ? 0.35 : 0);
      touch.brake = Boolean(st && d < range * 3 && st.rel > 8);
      if (st && st.ok && st.station.id === s.port.id) { touch.brake = false; toggleDock(); }
      break;
    }
    case "mine":
      if (ship.miningMode === "off") setMiningMode("closest");
      if (!ship.powered?.mining) sim.notice = `${holderName()}: mining bus is cold.`;
      setInjectedPan({ x: 0, y: 0 });
      setThrottle(mining.active ? 0 : 0.2);
      break;
    case "survey":
      if (s.unsurveyedId) {
        if (sim.selected !== s.unsurveyedId) selectBody(s.unsurveyedId);
        if (sim.lock.id !== s.unsurveyedId) acquireLock({ kind: "body", id: s.unsurveyedId });
        bodyPosition(s.unsurveyedId, sim.time, _p);
        const d = steerToward(_p.x, _p.y, _p.z, 1.0);
        /* the nav computer wants the nose on the lane — same rule the pilot flies under.
         * A cautious captain also reads the dropout odds: a graze is a 90% coin
         * they will not flip; a careless one will. */
        const route = d > 40000 && sim.warp.state === "idle" ? plotRoute(s.unsurveyedId) : null;
        if (route && route.aligned && !route.impact && !sim.wantJump) {
          const caution = captain.member?.traits?.caution ?? 0.5;
          const worst = Math.max(0, ...route.hazards.map((h) => DROPOUT_ODDS[h.kind] ?? 0));
          if (worst * caution > 0.4) {
            if (captain.goal) captain.goal.rationale = `holding for a cleaner lane — ${Math.round(worst * 100)}% dropout in the plot`;
          } else {
            requestJump();
          }
        }
        if (s.unsurveyed != null && s.unsurveyed <= 0) sim.wantScan = true;
      }
      break;
    case "evade": {
      const h = contacts.find((c) => c.relation === "hostile" && c.hp > 0);
      if (h) steerAway(h.x, h.y, h.z);
      else if (s.threatName) { const m = impactors.find((i) => i.name === s.threatName); if (m) steerAway(m.x, m.y, m.z); }
      else setThrottle(0.6);
      if (ship.turretMode === "off") setTurretMode("castle");
      break;
    }
    case "engage": {
      const h = contacts.filter((c) => c.relation === "hostile" && c.hp > 0).sort((a, b) => d3(a) - d3(b))[0];
      if (h) {
        if (ship.turretMode !== "enemies") setTurretMode("enemies");
        if (sim.lock.id !== h.id) acquireLock({ kind: "contact", id: h.id });
        const d = steerToward(h.x, h.y, h.z, d3(h) > 1800 ? 0.8 : 0.15);
        if (d < 700) setThrottle(0);
      }
      break;
    }
  }
}

function d3(o) {
  const p = sim.ship.pos;
  return Math.hypot(o.x - p.x, o.y - p.y, o.z - p.z);
}

/* ---- tick ---------------------------------------------------------------- */

/** Called from the sim every frame (dt in sim seconds). */
export function tickCaptain(dt) {
  checkHolder();
  const s = sim.phase === "play" && sim.time - captain.lastThink >= 1 ? snapshot() : null;
  if (s) { captain.lastSnapshot = s; captain.lastThink = sim.time; }

  if (captain.holder === "player") {
    /* learn from the way you fly — one label every 5 s, from the core of whoever last held the conn or a shared house brain */
    if (s && sim.time - captain.lastLearn >= 5) {
      captain.lastLearn = sim.time;
      const b = houseBrain();
      const label = labelFromPlay(s);
      learnImitation(b, features(s), label);
      if (!sim.handsOff) ariaHooks.onPlayLabel?.(label);
    }
    return;
  }
  /* ARIA plans jobs for the autopilot instead of steering the stick (js/aria-pilot.js) */
  if (captain.holder === "aria" && ariaHooks.pilot) { ariaHooks.pilot(dt); return; }
  if (!s) { if (captain.goal) execute(captain.goal, captain.lastSnapshot); return; }

  /* score the last decision by what happened since */
  if (captain.decision && sim.time - captain.decision.at >= 20) {
    const d = captain.decision;
    const reward = (sim.ship.hull - d.hull) * 0.03 + (sim.ship.credits - d.credits) / 800 + (cargoTotal(sim.ship) / Math.max(1, sim.ship.cargoCap) - d.cargo) * 1.5;
    learnOutcome(captain.brain, d.x, d.action, reward);
    captain.decision = null;
  }

  const gen = ++captain.decideGen;
  /* `decide` is async and runs every tick a captain holds the conn. Without a
   * catch, one malformed brain or one undefined field in forecast() produces an
   * unhandled rejection PER TICK — invisible unless devtools is open — while
   * execute() keeps flying the last goal it managed to set. Better to hand the
   * conn back and say so once. */
  decide(s).then(({ pick, rationale, x }) => {
    /* the conn may have changed hands, or a newer tick may have landed first */
    if (gen !== captain.decideGen || captain.holder === "player" || !captain.member) return;
    captain.thinkFailed = false;      // a good decision re-arms the warning
    const changed = captain.goal?.action !== pick.action;
    captain.goal = { action: pick.action, since: changed ? sim.time : captain.goal.since, rationale, forecast: pick };
    if (changed) {
      note(`${captain.member.name}: ${pick.action.toUpperCase()} — ${rationale}`);
      if (captain.holder === "aria") ariaHooks.onDecision?.(pick.action, rationale);
      captain.decision = { x, action: pick.action, at: sim.time, hull: sim.ship.hull, credits: sim.ship.credits, cargo: cargoTotal(sim.ship) / Math.max(1, sim.ship.cargoCap) };
    }
  }).catch((err) => {
    if (gen !== captain.decideGen) return;
    if (!captain.thinkFailed) {
      captain.thinkFailed = true;
      console.warn("[captain] decision failed — handing the conn back:", err?.message ?? err);
      note(`${captain.member?.name ?? "The captain"}: I've lost the plot. You have the conn.`);
    }
    captain.goal = null;
  });
  if (captain.goal) execute(captain.goal, s);
}

function isSane(b) {
  return Array.isArray(b?.W1) && b.W1.length === N_FEATURES * 12 && [...b.W1, ...b.W2, ...b.b1, ...b.b2].every(Number.isFinite);
}

function inheritBrain(m) {
  const house = houseBrain();
  const own = createBrain(m.id, m.traits);
  const b = JSON.parse(JSON.stringify(house));
  b.seed = m.id;
  b.outcomes = 0;
  for (let i = 0; i < b.b2.length; i++) b.b2[i] += own.b2[i];
  return b;
}

/* the ship's own core: learns from you whenever nobody else holds the conn, and seeds new captains */
let _house = null;
export function houseBrain() {
  if (!_house) {
    try { const raw = globalThis.localStorage?.getItem("lgaa.housebrain.v1"); if (raw) _house = JSON.parse(raw); } catch { /* none */ }
    if (!_house || !isSane(_house)) _house = createBrain("house");
  }
  if ((_house.steps & 15) === 0) { try { globalThis.localStorage?.setItem("lgaa.housebrain.v1", JSON.stringify(_house)); } catch { /* full */ } }
  return _house;
}

/* ---- the SLM socket ------------------------------------------------------- */

/** The prompt an SLM sees: the snapshot in a captain's words, then the forecaster's ranked options as letters. */
export function captainPrompt(s, ranked) {
  const m = captain.member ?? { name: "THE CONN", title: "Hand", traits: {} };
  const letters = "ABCDEF";
  const opts = ranked.map((r, i) => `  ${letters[i]}) ${r.action.padEnd(7)} ${(r.value >= 0 ? "+" : "") + r.value.toFixed(1)}   ${r.why}`).join("\n");
  const rec = cradle.get(m.id);
  const recent = captain.log.slice(0, 2).map((e) => e.text).join(" / ") || "none";
  return [
    `You are ${m.name.toUpperCase()}, ${m.title}, holding the conn of a ${sim.interior?.hull ?? "ship"}.`,
    `Temperament: ${rec ? traitWords(rec) : "steady"}. Morale ${Math.round(m.morale ?? 70)}.`,
    `HULL ${Math.round(s.hull)}%  O2 ${Math.round(s.o2)}%  BATT ${Math.round(s.battery * 100)}%  HOLD ${Math.round(s.cargoFill * 100)}%  HEAT ${s.heat.toFixed(1)}  CREDITS ${Math.round(s.credits)}`,
    s.port ? `PORT ${s.port.name} ${Math.round(s.port.dist)} u  ${s.port.hostile ? "HOSTILE" : "friendly"}  standing ${s.port.standing >= 0 ? "+" : ""}${Math.round(s.port.standing)}` : "PORT none inside 60,000 u",
    `CONTACTS ${s.contacts.length ? s.contacts.slice(0, 4).map((c) => `${c.name} ${c.relation} ${Math.round(c.dist)} u`).join(", ") : "none"} inside ${Math.round(s.scanRange)} u.  BELT ${s.inBelt ? `yes, ${s.rocks} rocks` : "no"}.  UNSURVEYED ${s.unsurveyedName ? `${s.unsurveyedName} ${Math.round(s.unsurveyed)} u` : "none"}.`,
    `ABOARD ${s.interior.allied} allied, ${s.interior.synthetic} synthetic, ${s.interior.robotics} robot${s.interior.robotics === 1 ? "" : "s"}, ${s.interior.intruders ? `${s.interior.intruders} INTRUDERS` : "sensors clear"}.${s.interior.lowMorale.length ? ` Unsettled: ${s.interior.lowMorale.join(", ")}.` : ""}`,
    `RECENT: ${recent}`,
    `OPTIONS (forecaster):`,
    opts,
    `Answer with the letter, then one sentence in character.`,
  ].join("\n");
}

function traitWords(rec) {
  const t = rec.traits ?? {};
  const w = [];
  if (t.grit > 0.6) w.push("does not rattle"); if (t.caution > 0.6) w.push("cautious"); if (t.caution < 0.4) w.push("runs hot");
  if (t.greed > 0.6) w.push("counts the cut"); if (t.curiosity > 0.6) w.push("asks questions"); if (t.loyalty > 0.6) w.push("stays");
  return w.join(", ") || "steady";
}

/**
 * A provider for a local llama.cpp server (`llama-server -m model.gguf --port 8081 --cors`).
 *   captain.provider = llamaCaptainProvider("http://127.0.0.1:8081/completion");
 * The model answers with a letter; anything else is discarded and the core's pick stands.
 */
export function llamaCaptainProvider(url = "/llm/proxy", opts = {}) {
  return async (s, ranked) => {
    const prompt = captainPrompt(s, ranked);
    const body = { prompt, n_predict: opts.n_predict ?? 48, temperature: opts.temperature ?? 0.4, stop: ["\n\n", "OPTIONS"] };
    if (url === "/llm/proxy") { body._port = opts.port ?? 8081; body._path = opts.path ?? "/completion"; }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`llm ${res.status}`);
    const j = await res.json();
    const text = String(j.content ?? j.completion ?? j.choices?.[0]?.text ?? "").trim();
    const m = /^\s*\(?([A-F])\)?[\s.:)-]*(.*)$/s.exec(text);
    if (!m) throw new Error("no letter");
    const pick = ranked["ABCDEF".indexOf(m[1])];
    if (!pick) throw new Error("bad letter");
    return { action: pick.action, rationale: (m[2] || pick.why).split("\n")[0].slice(0, 160) };
  };
}

/** Console/test access. */
export function wireCaptainTest() {
  if (!globalThis.window?.__lg) return;
  window.__lg.captain = {
    captain, transferCommand, retakeCommand, snapshot, forecast, houseBrain, touch, captainPrompt,
    useLlama: (url) => { captain.provider = url === false ? null : llamaCaptainProvider(url || "/llm/proxy"); return captain.provider ? "llama provider armed" : "provider off"; },
  };
}
