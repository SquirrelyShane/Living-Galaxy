import { defaultMods } from "../careers/effects.js";
import { bulkOf } from "../economy/materials.js";

import { BODIES } from "../world/bodies.js";
import { holeAccel, holes } from "../world/events/holes.js";
import { throughShield, throughArmour } from "./defence.js";

export const MAIN_ACCEL = 88;
export const REVERSE_ACCEL = 32;
export const RCS_ACCEL = 26;
export const BRAKE_ACCEL = 74;
export const ANG_ACCEL = 8.2;
export const ANG_MAX = 2.05;
export const PITCH_LIMIT = 1.45;
export const THROTTLE_MIN = -0.4;
export const THROTTLE_RATED = 1;
export const THROTTLE_MAX = 1.4;
export const ASSIST_STOP = 9;
export const HOLD_SPEED = 20;

export const REACTOR_OUTPUT = 130;
export const BATTERY = 1600;

export const shipFx = { fx: (key, dflt) => dflt };

export function batteryCap(ship) {
  void ship;
  return BATTERY + shipFx.fx("battery", 0);
}

export const DRAW = {
  enginesIdle: 7,
  thrustCurve: 96,
  rcs: 22,
  brake: 40,
  shields: 28,
  shieldRegen: 16,
  turrets: 15,
  turretFire: 34,
  miningClosest: 24,
  miningOverdrive: 58,
  rigIdle: 3,
  rigCut: 26,
  rigStrip: 40,
  lifeSupport: 9,
  lifeSupportIdle: 1.5,
  gravity: 12,
  jumpCharge: 260,
  lights: 8,
  sentry: 5,
  salvage: 18,
  pulseCharge: 120,
};

export const SHED_ORDER = ["ops", "mining", "rig", "overdrive", "shields", "turrets", "gravity", "lifeSupport"];

export const SHED_LABEL = {
  ops: "Ops board",
  mining: "Mining laser",
  rig: "Salvage rig",
  overdrive: "Overdrive",
  shields: "Shields",
  turrets: "Turrets",
  gravity: "Local gravity",
  lifeSupport: "Life support",
};

export function defaultTune() {
  return {
    panRate: 1.15,
    panSmooth: 0.12,
    panExpo: 0.65,
    rcsGain: 1,
    assistGain: 1,
    throttleCap: 1.4,
    reactorTrim: 1,
    turretRange: 1500,
    turretRate: 1,
    retaliateFor: 22,
    minerRange: 1100,
    rigRange: 600,
    o2Target: 100,
  };
}

export const TUNE_SPEC = [
  { key: "panRate", label: "Look sensitivity", min: 0.4, max: 3, step: 0.05, unit: " rad/s",
    hint: "How fast the stick swings the nose at full deflection." },
  { key: "panSmooth", label: "Look smoothing", min: 0.02, max: 0.35, step: 0.01, unit: " s",
    hint: "Ramps the stick in and out. Higher is heavier and smoother." },
  { key: "panExpo", label: "Look expo", min: 0, max: 1, step: 0.05, unit: "",
    hint: "Softens the centre so small thumb moves are precise. 0 is linear." },
  { key: "rcsGain", label: "RCS authority", min: 0.4, max: 1.4, step: 0.05, unit: "×",
    hint: "Thruster and attitude gain. Higher is twitchier and thirstier." },
  { key: "assistGain", label: "Assist strength", min: 0, max: 1.5, step: 0.05, unit: "×",
    hint: "How hard flight assist trims drift. Zero is pure momentum." },
  { key: "throttleCap", label: "Throttle limiter", min: 0.3, max: 1.4, step: 0.05, unit: "×",
    hint: "Caps the slider. Set to 1.00 to lock out overdrive." },
  { key: "reactorTrim", label: "Reactor output", min: 0.8, max: 1.25, step: 0.01, unit: "×",
    hint: "Above 1.00 the core strains and slowly cooks the hull." },
  { key: "turretRange", label: "Engagement range", min: 400, max: 2200, step: 50, unit: " u",
    hint: "Turrets hold fire beyond this." },
  { key: "turretRate", label: "Turret cycle", min: 0.6, max: 1.5, step: 0.05, unit: "×",
    hint: "Faster cycling costs more power per second." },
  { key: "retaliateFor", label: "Castle memory", min: 5, max: 60, step: 1, unit: " s",
    hint: "How long CASTLE keeps answering something that hit you." },
  { key: "minerRange", label: "Mining reach", min: 500, max: 1600, step: 50, unit: " u",
    hint: "Overdrive adds 800 on top." },
  { key: "rigRange", label: "Rig reach", min: 300, max: 900, step: 50, unit: " u",
    hint: "How far the salvage rig's arc carries to a hulk." },
  { key: "o2Target", label: "O2 setpoint", min: 40, max: 100, step: 5, unit: "%",
    hint: "Life support stops topping up here. Lower setpoint, lower draw." },
];

export const TURRET_MODES = [
  { id: "off", label: "OFF", hint: "Guns cold. No power draw." },
  { id: "castle", label: "CASTLE", hint: "Return fire only — anything that touches your shields or hull." },
  { id: "passive", label: "PASSIVE", hint: "Track and report. Never fire." },
  { id: "neutral", label: "NEUTRAL", hint: "Engage unaligned contacts." },
  { id: "enemies", label: "ENEMIES", hint: "Engage flagged hostiles." },
  { id: "allies", label: "ALLIES", hint: "Engage allied contacts. Think before you use this." },
  { id: "ffa", label: "FFA", hint: "Free fire. Everything in range." },
];

export const MINING_MODES = [
  { id: "off", label: "OFF", hint: "Laser stowed." },
  { id: "closest", label: "CLOSEST", hint: "Lock and cut the nearest rock in range." },
  { id: "overdrive", label: "OVERDRIVE", hint: "Longer reach, faster cut, heavy draw." },
];

export const RIG_MODES = [
  { id: "off", label: "OFF", hint: "Rig stowed." },
  { id: "cut", label: "CUT", hint: "Fast. Plate only — parts and the recorder in that section are lost." },
  { id: "strip", label: "STRIP", hint: "Slow and hungry. Plate, parts and the recorder come out whole." },
];

export function makeShip() {
  return {
    pos: { x: 0, y: 0, z: 0 },
    vel: { x: 0, y: 0, z: 0 },
    aimYaw: 0,
    aimPitch: 0,
    yaw: 0,
    pitch: 0,
    roll: 0,
    yawVel: 0,
    pitchVel: 0,
    throttle: 0,
    accel: { x: 0, y: 0, z: 0 },
    gAccel: { x: 0, y: 0, z: 0 },
    gLoad: 0,

    engines: true,
    shields: true,
    turretsArmed: true,
    turretMode: "castle",
    miningMode: "off",
    rigMode: "off",
    rigLive: false,
    pressurized: true,
    localGravity: true,
    assist: true,
    avoid: null,
    braking: false,
    lights: false,
    sentry: true,
    salvage: false,
    matchLock: false,
    tune: defaultTune(),
    holding: false,
    shed: [...SHED_ORDER],
    strain: 0,

    charge: BATTERY,
    reactor: REACTOR_OUTPUT,
    load: 0,
    extraDraw: 0,
    benchDraw: 0,
    atmoDraw: 0,
    patchDraw: 0,
    brownoutLatch: false,
    draws: null,
    o2: 100,
    hull: 100,
    hullMax: 100,
    shieldMax: 100,
    resists: null,
    shieldCharge: 100,
    hold: {},
    cargoCap: 400,
    baseCargo: 400,
    mods: defaultMods(),
    credits: 2500,
    dockedAt: null,

    powered: {
      ops: true,
      engines: true,
      shields: true,
      turrets: true,
      mining: true,
      rig: true,
      gravity: true,
      lifeSupport: true,
      overdrive: true,
    },
    debuffs: [],
    brownout: false,
    thrustScale: 1,
    rcsScale: 1,
    lastHitBy: null,
    lastHitAt: -999,
  };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function forwardOf(yaw, pitch) {
  const cp = Math.cos(pitch);
  return { x: -Math.sin(yaw) * cp, y: Math.sin(pitch), z: -Math.cos(yaw) * cp };
}

export function rightOf(yaw) {
  return { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) };
}

export function upOf(yaw, pitch) {
  const f = forwardOf(yaw, pitch);
  const r = rightOf(yaw);
  return {
    x: r.y * f.z - r.z * f.y,
    y: r.z * f.x - r.x * f.z,
    z: r.x * f.y - r.y * f.x,
  };
}

const ZERO = { x: 0, y: 0, z: 0 };

export function speedOf(ship, frame) {
  const f = frame ?? ZERO;
  return Math.hypot(ship.vel.x - f.x, ship.vel.y - f.y, ship.vel.z - f.z);
}

export function absSpeedOf(ship) {
  return Math.hypot(ship.vel.x, ship.vel.y, ship.vel.z);
}

export function closingSpeed(ship, frame) {
  const fr = frame ?? ZERO;
  const f = forwardOf(ship.yaw, ship.pitch);
  return (ship.vel.x - fr.x) * f.x + (ship.vel.y - fr.y) * f.y + (ship.vel.z - fr.z) * f.z;
}

const _bp = { x: 0, y: 0, z: 0 };

function accelToward(b, pos, time, bodyPosition, out, scale) {
  bodyPosition(b.id, time, _bp);
  const dx = _bp.x - pos.x;
  const dy = _bp.y - pos.y;
  const dz = _bp.z - pos.z;
  const d2 = Math.max(dx * dx + dy * dy + dz * dz, b.radius * b.radius * 0.25);
  const d = Math.sqrt(d2);
  const a = (b.mu / d2) * scale;
  const inv = a / Math.max(d, 1e-6);
  out.x += dx * inv;
  out.y += dy * inv;
  out.z += dz * inv;
  return { a, d };
}

export function gravityAt(pos, time, bodyPosition, out) {
  const r = gravityOfWorlds(pos, time, bodyPosition, out);
  if (holes.length) holeAccel(pos, out);
  return r;
}

function gravityOfWorlds(pos, time, bodyPosition, out) {
  out.x = 0;
  out.y = 0;
  out.z = 0;

  let primary = null;
  let primarySoi = Infinity;
  let primaryDist = 0;
  let star = null;
  for (const b of BODIES) {
    if (b.kind === "star") {
      star = b;
      continue;
    }
    bodyPosition(b.id, time, _bp);
    const d = Math.hypot(_bp.x - pos.x, _bp.y - pos.y, _bp.z - pos.z);
    if (d < b.soi && b.soi < primarySoi) {
      primary = b;
      primarySoi = b.soi;
      primaryDist = d;
    }
  }

  if (!primary) {
    if (!star) return { body: null, mag: 0, dist: 0 };
    const r = accelToward(star, pos, time, bodyPosition, out, 1);
    return { body: star, mag: r.a, dist: r.d };
  }

  const t = clamp((primary.soi - primaryDist) / (primary.soi * 0.25), 0, 1);
  const host = primary.host ? BODIES.find((b) => b.id === primary.host) : star;
  const r = accelToward(primary, pos, time, bodyPosition, out, t);
  let hostR = null;
  if (host && t < 1) hostR = accelToward(host, pos, time, bodyPosition, out, 1 - t);
  if (t < 0.5 && host && hostR) return { body: host, mag: hostR.a, dist: hostR.d };
  return { body: primary, mag: r.a, dist: primaryDist };
}

function pushDebuff(list, tag, text) {
  list.push({ tag, text });
}

export function buildDemand(ship, rcsMag, brakeOn, warpDraw = 0) {
  const t = Math.abs(ship.throttle);
  const overhead = DRAW.enginesIdle + rcsMag * DRAW.rcs + (brakeOn ? DRAW.brake : 0);
  const engines = ship.engines ? overhead + t * t * DRAW.thrustCurve : 0;
  const rated = ship.engines
    ? overhead + Math.min(t, THROTTLE_RATED) ** 2 * DRAW.thrustCurve
    : 0;
  const ops =
    (ship.lights ? DRAW.lights : 0) + (ship.sentry ? DRAW.sentry : 0) + (ship.salvage ? DRAW.salvage : 0) + (ship.atmoDraw ?? 0) + (ship.patchDraw ?? 0);
  const cutter = ship.miningMode === "overdrive" ? DRAW.miningOverdrive : ship.miningMode === "closest" ? DRAW.miningClosest : 0;
  const rig = !ship.rigMode || ship.rigMode === "off" ? 0 : !ship.rigLive ? DRAW.rigIdle : ship.rigMode === "strip" ? DRAW.rigStrip : DRAW.rigCut;
  return {
    base: 6 + warpDraw + (ship.extraDraw ?? 0),
    warp: warpDraw,
    robots: ship.extraDraw ?? 0,
    ops,
    engines,
    enginesRated: rated,
    shields: DRAW.shields + (ship.shieldCharge < 100 ? DRAW.shieldRegen : 0),
    turrets: DRAW.turrets,
    mining: cutter + (ship.benchDraw ?? 0),
    cutter,
    bench: ship.benchDraw ?? 0,
    rig,
  };
}

export function lifeDraw(ship, powered = true) {
  const life = ship.mods?.life ?? 1;
  if (!ship.pressurized) return DRAW.lifeSupportIdle * life;
  if (!powered) return DRAW.lifeSupportIdle * life;
  return DRAW.lifeSupport * life * (ship.o2 < ship.tune.o2Target - 0.5 ? 1 : 0.45);
}

export const BROWNOUT_RECOVER = 0.05;

export function stepPower(ship, dt, demand) {
  const d = ship.debuffs;
  d.length = 0;
  const tune = ship.tune;
  ship.reactor = REACTOR_OUTPUT * tune.reactorTrim * (ship.hullTune?.reactor ?? 1) * shipFx.fx("reactor", 1);
  const p = ship.powered;
  p.engines = ship.engines;
  p.shields = ship.shields;
  p.turrets = ship.turretsArmed && ship.turretMode !== "off";
  p.mining = demand.mining > 0 || ship.miningMode !== "off";
  p.rig = Boolean(ship.rigMode) && ship.rigMode !== "off";
  p.gravity = ship.localGravity;
  p.lifeSupport = true;
  p.overdrive = true;
  p.ops = true;

  const lifeOn = lifeDraw(ship, true);
  const sumLoad = (engines) => {
    let l = demand.base + engines;
    if (p.ops) l += demand.ops;
    if (p.mining) l += demand.mining;
    if (p.rig) l += demand.rig ?? 0;
    if (p.shields) l += demand.shields;
    if (p.turrets) l += demand.turrets;
    if (p.gravity) l += DRAW.gravity;
    return l + (p.lifeSupport ? lifeOn : lifeDraw(ship, false));
  };
  let load = sumLoad(demand.engines);

  ship.brownout = false;
  const hullThrust = (ship.hullTune?.thrust ?? 1) * shipFx.fx("thrust", 1);
  ship.thrustScale = hullThrust;
  ship.rcsScale = ship.hullTune?.turn ?? 1;
  let derate = 1;

  const cap = batteryCap(ship);
  const flatNow = ship.charge <= 0.001 || ship.charge + (ship.reactor - load) * dt <= 0;
  if (flatNow) ship.brownoutLatch = true;
  else if (ship.brownoutLatch && ship.charge >= cap * BROWNOUT_RECOVER) ship.brownoutLatch = false;
  if (ship.brownoutLatch && load > ship.reactor) {
    ship.brownout = true;
    let over = load - ship.reactor * 0.92;
    const derateMains = () => {
      if (over <= 0.5 || demand.engines <= 0) return;
      derate = clamp((demand.engines - over) / demand.engines, 0.12, 1);
      over -= demand.engines * (1 - derate);
      if (derate < 0.97) pushDebuff(d, "thrust", `THRUST DERATED ${Math.round(derate * 100)}%`);
    };
    for (const sys of ship.shed) {
      if (over <= 0) break;
      if (sys === "ops" && p.ops && demand.ops > 0) {
        p.ops = false;
        over -= demand.ops;
        pushDebuff(d, "ops", "OPS BOARD SHED");
      } else if (sys === "mining" && p.mining) {
        p.mining = false;
        over -= demand.mining;
        pushDebuff(d, "mining", "MINING LASER OFFLINE");
      } else if (sys === "rig" && p.rig) {
        p.rig = false;
        over -= demand.rig ?? 0;
        pushDebuff(d, "rig", "SALVAGE RIG OFFLINE");
      } else if (sys === "overdrive" && ship.throttle > THROTTLE_RATED) {
        p.overdrive = false;
        over -= demand.engines - demand.enginesRated;
        demand.engines = demand.enginesRated;
        pushDebuff(d, "overdrive", "OVERDRIVE CUT — RATED THRUST ONLY");
      } else if (sys === "shields" && p.shields) {
        p.shields = false;
        over -= demand.shields;
        pushDebuff(d, "shields", "SHIELDS DOWN — NO POWER");
      } else if (sys === "turrets" && p.turrets) {
        p.turrets = false;
        over -= demand.turrets;
        pushDebuff(d, "turrets", "TURRETS OFFLINE");
      } else if (sys === "gravity" && p.gravity) {
        p.gravity = false;
        over -= DRAW.gravity;
        pushDebuff(d, "gravity", "LOCAL GRAVITY LOST");
      } else if (sys === "lifeSupport" && p.lifeSupport) {
        derateMains();
        if (over <= 0.5) continue;
        p.lifeSupport = false;
        over -= lifeOn - lifeDraw(ship, false);
        pushDebuff(d, "life", "LIFE SUPPORT UNPOWERED");
      }
    }
    if (derate === 1) derateMains();
    ship.thrustScale = hullThrust * derate;
    load = sumLoad(demand.engines * derate);
  }
  ship.draws = {
    life: p.lifeSupport ? lifeOn : lifeDraw(ship, false),
    avionics: 6,
    engines: demand.engines * derate,
    shields: p.shields ? demand.shields : 0,
    turrets: p.turrets ? demand.turrets : 0,
    cutter: p.mining ? demand.cutter : 0,
    bench: p.mining ? demand.bench : 0,
    rig: p.rig ? demand.rig ?? 0 : 0,
    gravity: p.gravity ? DRAW.gravity : 0,
    ops: p.ops ? demand.ops : 0,
    robots: demand.robots,
    warp: demand.warp,
  };
  ship.charge = clamp(ship.charge + (ship.reactor - load) * dt, 0, batteryCap(ship));
  if (!p.overdrive && ship.throttle > THROTTLE_RATED) ship.throttle = THROTTLE_RATED;

  if (tune.reactorTrim > 1.001) {
    ship.strain = Math.min(1, ship.strain + (tune.reactorTrim - 1) * 1.6 * dt);
    if (ship.strain > 0.25) {
      ship.hull = Math.max(1, ship.hull - ((ship.strain - 0.25) * 1.7 * dt) / (ship.mods?.hull ?? 1));
      pushDebuff(d, "strain", `REACTOR STRAIN ${Math.round(ship.strain * 100)}%`);
    }
  } else {
    ship.strain = Math.max(0, ship.strain - 0.22 * dt);
  }

  if (ship.pressurized && p.lifeSupport) {
    ship.o2 = clamp(ship.o2 + 2.2 * dt, 0, tune.o2Target);
  } else if (ship.pressurized) {
    ship.o2 = clamp(ship.o2 - 1.7 * dt, 0, 100);
  }
  if (!ship.pressurized) {
    ship.rcsScale *= 0.84;
    pushDebuff(d, "suits", "HULL VENTED — SUIT OPS, RCS −16%");
  } else if (ship.o2 < 25) {
    ship.rcsScale *= 0.75;
    ship.thrustScale *= 0.85;
    pushDebuff(d, "o2", ship.o2 < 8 ? "O2 CRITICAL" : "O2 RESERVE LOW");
  }

  if (!p.gravity) ship.rcsScale *= 1.08;

  const shMax = ship.shieldMax ?? 100;
  if (p.shields && ship.shieldCharge < shMax) {
    ship.shieldCharge = clamp(ship.shieldCharge + 5.5 * (shMax / 100) * shipFx.fx("shieldRegen", 1) * dt, 0, shMax);
  } else if (!p.shields) {
    ship.shieldCharge = clamp(ship.shieldCharge - 3 * dt, 0, shMax);
  }

  ship.load = load;
  return load;
}

export function stepAttitude(ship, dt) {
  const g = ship.tune.rcsGain;
  const auth = ANG_ACCEL * ship.rcsScale * g * (ship.engines ? 1 : 0.35);
  const maxRate = ANG_MAX * ship.rcsScale * g;

  let ey = ship.aimYaw - ship.yaw;
  ey = Math.atan2(Math.sin(ey), Math.cos(ey));
  const ep = ship.aimPitch - ship.pitch;

  const targetYawVel = clamp(ey * 5.4, -maxRate, maxRate);
  const targetPitchVel = clamp(ep * 5.4, -maxRate, maxRate);
  ship.yawVel += clamp(targetYawVel - ship.yawVel, -auth * dt, auth * dt);
  ship.pitchVel += clamp(targetPitchVel - ship.pitchVel, -auth * dt, auth * dt);

  ship.yaw += ship.yawVel * dt;
  ship.pitch = clamp(ship.pitch + ship.pitchVel * dt, -PITCH_LIMIT, PITCH_LIMIT);
  ship.aimPitch = clamp(ship.aimPitch, -PITCH_LIMIT, PITCH_LIMIT);
  ship.roll += (clamp(ship.yawVel * 0.34, -0.5, 0.5) - ship.roll) * (1 - Math.exp(-5 * dt));
}

export function stepTranslation(ship, dt, rcs, brakeOn, frame, hold) {
  const fr = frame ?? ZERO;
  const f = forwardOf(ship.yaw, ship.pitch);
  const r = rightOf(ship.yaw);
  const u = upOf(ship.yaw, ship.pitch);
  const a = ship.accel;
  a.x = 0;
  a.y = 0;
  a.z = 0;

  const live = ship.engines && ship.powered.engines;

  if (live) {
    const t = ship.throttle;
    const scaled = (t >= 0 ? t * MAIN_ACCEL : t * REVERSE_ACCEL) * ship.thrustScale;
    a.x += f.x * scaled;
    a.y += f.y * scaled;
    a.z += f.z * scaled;

    const rs = RCS_ACCEL * ship.rcsScale * ship.tune.rcsGain;
    a.x += (r.x * rcs.x + u.x * rcs.y + f.x * rcs.z) * rs;
    a.y += (r.y * rcs.x + u.y * rcs.y + f.y * rcs.z) * rs;
    a.z += (r.z * rcs.x + u.z * rcs.y + f.z * rcs.z) * rs;
  }

  const rvx = ship.vel.x - fr.x;
  const rvy = ship.vel.y - fr.y;
  const rvz = ship.vel.z - fr.z;
  const sp = Math.hypot(rvx, rvy, rvz);
  const idle = Math.abs(ship.throttle) < 0.02 && rcs.x === 0 && rcs.y === 0 && rcs.z === 0;

  if (brakeOn && sp > 0.01 && live) {
    const k = Math.min(BRAKE_ACCEL, sp / Math.max(dt, 1e-4));
    a.x -= (rvx / sp) * k;
    a.y -= (rvy / sp) * k;
    a.z -= (rvz / sp) * k;
  }

  if (ship.avoid && live && ship.tune.assistGain > 0.01) {
    const av = ship.avoid;
    const g = Math.min(2.4, ship.tune.assistGain * shipFx.fx("assist", 1));
    const push = RCS_ACCEL * (av.level >= 3 ? 1.15 : 0.7) * g;
    a.x += av.x * push;
    a.y += av.y * push;
    a.z += av.z * push;
    if (av.level >= 3 && sp > 0.01) {
      const k = Math.min(BRAKE_ACCEL * 0.8 * g, sp / Math.max(dt, 1e-4));
      a.x -= (rvx / sp) * k;
      a.y -= (rvy / sp) * k;
      a.z -= (rvz / sp) * k;
    }
  }

  if (!brakeOn && ship.assist && live && idle && ship.tune.assistGain > 0.01) {
    const g = ship.tune.assistGain;
    if (hold && sp < (ship.holding ? HOLD_SPEED * 1.8 : HOLD_SPEED)) {
      ship.holding = true;
      const ex = hold.x - ship.pos.x;
      const ey = hold.y - ship.pos.y;
      const ez = hold.z - ship.pos.z;
      const err = Math.hypot(ex, ey, ez);
      let cx = 0;
      let cy = 0;
      let cz = 0;
      if (err > 0.05) {
        const close = Math.min(err * 0.55, 45);
        cx = (ex / err) * close;
        cy = (ey / err) * close;
        cz = (ez / err) * close;
      }
      const dvx = fr.x + cx - ship.vel.x;
      const dvy = fr.y + cy - ship.vel.y;
      const dvz = fr.z + cz - ship.vel.z;
      const dv = Math.hypot(dvx, dvy, dvz);
      if (dv > 0.002) {
        const k = Math.min(RCS_ACCEL * 0.95 * g, dv / Math.max(dt, 1e-4));
        a.x += (dvx / dv) * k;
        a.y += (dvy / dv) * k;
        a.z += (dvz / dv) * k;
      }
    } else {
      ship.holding = false;
      const along = rvx * f.x + rvy * f.y + rvz * f.z;
      const lx = rvx - f.x * along;
      const ly = rvy - f.y * along;
      const lz = rvz - f.z * along;
      const lat = Math.hypot(lx, ly, lz);
      if (lat > 0.01) {
        const k = Math.min(RCS_ACCEL * 0.8 * g, lat / Math.max(dt, 1e-4));
        a.x -= (lx / lat) * k;
        a.y -= (ly / lat) * k;
        a.z -= (lz / lat) * k;
      }
      if (Math.abs(along) > 0.01 && Math.abs(along) < ASSIST_STOP) {
        const k = Math.min(RCS_ACCEL * 0.35 * g, Math.abs(along) / Math.max(dt, 1e-4));
        const sgn = Math.sign(along);
        a.x -= f.x * sgn * k;
        a.y -= f.y * sgn * k;
        a.z -= f.z * sgn * k;
      }
    }
  } else {
    ship.holding = false;
  }

  a.x += ship.gAccel.x;
  a.y += ship.gAccel.y;
  a.z += ship.gAccel.z;

  ship.vel.x += a.x * dt;
  ship.vel.y += a.y * dt;
  ship.vel.z += a.z * dt;
  ship.pos.x += ship.vel.x * dt;
  ship.pos.y += ship.vel.y * dt;
  ship.pos.z += ship.vel.z * dt;

  ship.gLoad = Math.hypot(a.x, a.y, a.z) / 25;
}

export function applyDamage(ship, amount, from, time, kind = "kinetic") {
  const res = ship.resists ?? null;
  let left = amount;
  if (ship.powered.shields && ship.shieldCharge > 0) {
    left = res ? throughShield(left, kind, res) : left;
    const soak = Math.min(ship.shieldCharge, left * 1.6);
    ship.shieldCharge -= soak;
    left -= soak / 1.6;
  }
  if (left > 0) {
    if (res) left = throughArmour(left, kind, res);
    ship.hull = Math.max(0, ship.hull - (left * (ship.pressurized ? 1 : 0.88)) / (ship.mods?.hull ?? 1));
  }
  if (from) {
    ship.lastHitBy = from;
    ship.lastHitAt = time;
  }
  return left;
}

export function cargoTotal(ship) {
  let n = 0;
  for (const k in ship.hold) n += ship.hold[k] * bulkOf(k);
  return n;
}

export function cargoCount(ship) {
  let n = 0;
  for (const k in ship.hold) n += ship.hold[k];
  return n;
}

export function holdRoom(ship) {
  return Math.max(0, ship.cargoCap - cargoTotal(ship));
}

export function roomFor(ship, id) {
  return Math.max(0, holdRoom(ship) / bulkOf(id));
}

export function addCargo(ship, id, qty) {
  const take = Math.min(qty, roomFor(ship, id));
  if (take <= 0) return 0;
  ship.hold[id] = (ship.hold[id] ?? 0) + take;
  return take;
}

export function takeCargo(ship, id, qty) {
  const have = ship.hold[id] ?? 0;
  const give = Math.min(have, qty);
  if (give <= 0) return 0;
  ship.hold[id] = have - give;
  if (ship.hold[id] <= 1e-6) delete ship.hold[id];
  return give;
}
