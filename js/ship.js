import { defaultMods } from "./careers/effects.js";
import { bulkOf } from "./materials.js";

/* LIVING GALAXY — ship state, Newtonian flight model, and the power economy.
 *
 * Flight is momentum-first: nothing slows you down but your own thrusters.
 * The nose points where you look; the hull swings to that heading with real
 * angular inertia. Everything you switch on competes for the same reactor.
 */

import { BODIES } from "./bodies.js";
import { holeAccel, holes } from "./holes.js";
import { throughShield, throughArmour } from "./defence.js";

/* ---- authority ---------------------------------------------------------- */

export const MAIN_ACCEL = 88;      // u/s^2 at 100% throttle
export const REVERSE_ACCEL = 32;   // retro mains
export const RCS_ACCEL = 26;       // lateral / vertical / fine axial
export const BRAKE_ACCEL = 74;     // full retrograde burn
export const ANG_ACCEL = 8.2;      // rad/s^2 the attitude jets can deliver
export const ANG_MAX = 2.05;       // rad/s cap
export const PITCH_LIMIT = 1.45;
export const THROTTLE_MIN = -0.4;
export const THROTTLE_RATED = 1;
export const THROTTLE_MAX = 1.4;   // past 1.0 is overdrive: the red zone
export const ASSIST_STOP = 9;      // assist only nulls the last few u/s of run
export const HOLD_SPEED = 20;      // below this, assist switches to holding station

/* ---- reactor ------------------------------------------------------------ */

export const REACTOR_OUTPUT = 130; // units/s
export const BATTERY = 1600;

/* Refit upgrades (upgrades.js) reach the power model through this hook, so
 * ship.js stays a leaf: upgrades.js sets shipFx.fx = fx when it loads. */
export const shipFx = { fx: (key, dflt) => dflt };

/** The battery's true capacity: the base cells plus any bank bolted on at a yard. */
export function batteryCap(ship) {
  void ship;
  return BATTERY + shipFx.fx("battery", 0);
}

export const DRAW = {
  enginesIdle: 7,
  thrustCurve: 96,   // * throttle^2
  rcs: 22,           // * |rcs|
  brake: 40,
  shields: 28,
  shieldRegen: 16,
  turrets: 15,
  turretFire: 34,
  miningClosest: 24,
  miningOverdrive: 58,
  lifeSupport: 9,
  lifeSupportIdle: 1.5,
  gravity: 12,
  jumpCharge: 260,
  /* ops board */
  lights: 8,
  sentry: 5,
  salvage: 18,
  pulseCharge: 120,
};

/* Default order things get cut in when the battery bottoms out. The pilot can
 * reorder this from the terminal — it is per-ship state, not a constant. */
export const SHED_ORDER = ["ops", "mining", "overdrive", "shields", "turrets", "gravity", "lifeSupport"];

export const SHED_LABEL = {
  ops: "Ops board",
  mining: "Mining laser",
  overdrive: "Overdrive",
  shields: "Shields",
  turrets: "Turrets",
  gravity: "Local gravity",
  lifeSupport: "Life support",
};

/** Everything the pilot can trim by hand from the terminal. */
export function defaultTune() {
  return {
    panRate: 1.15,      // rad/s at full stick — look sensitivity
    panSmooth: 0.12,    // s — low-pass on the stick, kills the flick
    panExpo: 0.65,      // 0 linear .. 1 cubic — fine control near centre
    rcsGain: 1,         // 0.4 .. 1.4 thruster authority trim
    assistGain: 1,      // 0 .. 1.5 how hard flight assist trims drift
    throttleCap: 1.4,   // hard limiter on the slider
    reactorTrim: 1,     // 0.8 .. 1.25 output, strains the core above 1.0
    turretRange: 1500,  // 400 .. 2200
    turretRate: 1,      // 0.6 .. 1.5 cycle speed multiplier
    retaliateFor: 22,   // CASTLE memory, seconds
    minerRange: 1100,   // 500 .. 1600 (overdrive adds 800)
    o2Target: 100,      // life support setpoint
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

export function makeShip() {
  return {
    pos: { x: 0, y: 0, z: 0 },
    vel: { x: 0, y: 0, z: 0 },
    /* commanded view heading — panning drives this, the hull chases it */
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

    /* systems */
    engines: true,
    shields: true,
    turretsArmed: true,
    turretMode: "castle",
    miningMode: "off",
    pressurized: true,
    localGravity: true,
    assist: true,
    avoid: null,        // set by sim.js when the assist should dodge something
    braking: false,
    /* ops board */
    lights: false,
    sentry: true,
    salvage: false,
    matchLock: false,
    tune: defaultTune(),
    holding: false,
    shed: [...SHED_ORDER],
    strain: 0,

    /* state */
    charge: BATTERY,
    reactor: REACTOR_OUTPUT,
    load: 0,
    extraDraw: 0,     // robot crew on the bus (crew/robots.js writes it)
    benchDraw: 0,     // the ice works bench, on the mining bus (icework.js writes it)
    atmoDraw: 0,      // the atmosphere works, on the ops board (atmoworks.js writes it)
    patchDraw: 0,     // the hull-patch drone, on the ops board (repair.js writes it)
    brownoutLatch: false,
    draws: null,      // what each consumer carried last tick (stepPower writes it)
    o2: 100,
    hull: 100,
    hullMax: 100,      // both set from the flown hull by syncHullDefence() in sim.js
    shieldMax: 100,
    resists: null,
    shieldCharge: 100,
    /* The hold is keyed by material id now — see materials.js */
    hold: {},
    cargoCap: 400,
    baseCargo: 400,
    /* race × specialisation multipliers — see careers/effects.js for the contract */
    mods: defaultMods(),
    credits: 2500,
    dockedAt: null,

    /* derived each tick */
    powered: {
      ops: true,
      engines: true,
      shields: true,
      turrets: true,
      mining: true,
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

/**
 * Speed relative to the local frame — the world whose well you are in, which
 * is itself sweeping around its star at tens of units a second. This is the
 * number a pilot actually cares about.
 */
export function speedOf(ship, frame) {
  const f = frame ?? ZERO;
  return Math.hypot(ship.vel.x - f.x, ship.vel.y - f.y, ship.vel.z - f.z);
}

export function absSpeedOf(ship) {
  return Math.hypot(ship.vel.x, ship.vel.y, ship.vel.z);
}

/** Component of relative velocity along the nose. Negative = flying backwards. */
export function closingSpeed(ship, frame) {
  const fr = frame ?? ZERO;
  const f = forwardOf(ship.yaw, ship.pitch);
  return (ship.vel.x - fr.x) * f.x + (ship.vel.y - fr.y) * f.y + (ship.vel.z - fr.z) * f.z;
}

/* ---- gravity ------------------------------------------------------------ */

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

/**
 * Patched-conic gravity: you are always inside exactly one well — the deepest
 * sphere of influence containing you. Crossing a boundary cross-fades to the
 * parent so nothing snaps. Bigger world, bigger sphere, harder pull.
 */
export function gravityAt(pos, time, bodyPosition, out) {
  const r = gravityOfWorlds(pos, time, bodyPosition, out);
  /* a black hole falling through (js/holes.js) pulls on top of whatever well
   * you are in — it is not a sphere of influence, it is a passing mass */
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

  /* Hand over across the outer quarter of the sphere. */
  const t = clamp((primary.soi - primaryDist) / (primary.soi * 0.25), 0, 1);
  const host = primary.host ? BODIES.find((b) => b.id === primary.host) : star;
  const r = accelToward(primary, pos, time, bodyPosition, out, t);
  let hostR = null;
  if (host && t < 1) hostR = accelToward(host, pos, time, bodyPosition, out, 1 - t);
  if (t < 0.5 && host && hostR) return { body: host, mag: hostR.a, dist: hostR.d };
  return { body: primary, mag: r.a, dist: primaryDist };
}

/* ---- reactor tick ------------------------------------------------------- */

function pushDebuff(list, tag, text) {
  list.push({ tag, text });
}

/** Everything the reactor is being asked for this tick. */
export function buildDemand(ship, rcsMag, brakeOn, warpDraw = 0) {
  const t = Math.abs(ship.throttle);
  const overhead = DRAW.enginesIdle + rcsMag * DRAW.rcs + (brakeOn ? DRAW.brake : 0);
  const engines = ship.engines ? overhead + t * t * DRAW.thrustCurve : 0;
  /* What the mains would draw if overdrive were cut back to rated. */
  const rated = ship.engines
    ? overhead + Math.min(t, THROTTLE_RATED) ** 2 * DRAW.thrustCurve
    : 0;
  /* the atmosphere works seeds off the ops board (js/atmoworks.js writes atmoDraw) */
  const ops =
    (ship.lights ? DRAW.lights : 0) + (ship.sentry ? DRAW.sentry : 0) + (ship.salvage ? DRAW.salvage : 0) + (ship.atmoDraw ?? 0) + (ship.patchDraw ?? 0);
  /* The mining bus carries the cutter AND the ice works bench. 0.3 billed the
   * cutter's 24 kW whenever the bench was on, even with the laser stowed, and
   * the bench's own 16 kW came straight off the battery where nothing could
   * see it or shed it. Each is billed for what it is actually doing now. */
  const cutter = ship.miningMode === "overdrive" ? DRAW.miningOverdrive : ship.miningMode === "closest" ? DRAW.miningClosest : 0;
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
  };
}

/** Life support's draw, in one place — the bus, the shed and the ledger all read this. */
export function lifeDraw(ship, powered = true) {
  const life = ship.mods?.life ?? 1;
  if (!ship.pressurized) return DRAW.lifeSupportIdle * life;
  if (!powered) return DRAW.lifeSupportIdle * life;
  return DRAW.lifeSupport * life * (ship.o2 < ship.tune.o2Target - 0.5 ? 1 : 0.45);
}

/* A brownout latches until the battery holds this fraction of its capacity, so
 * the bus sheds once and recovers, instead of re-deciding every frame and
 * strobing shields and cutter on and off at 60 Hz with the battery pinned at 0. */
export const BROWNOUT_RECOVER = 0.05;

/**
 * Works out what the reactor can actually carry, sheds the rest in priority
 * order, and writes the resulting debuffs onto the ship.
 */
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
  p.gravity = ship.localGravity;
  p.lifeSupport = true;
  p.overdrive = true;
  p.ops = true;

  const lifeOn = lifeDraw(ship, true);
  const sumLoad = (engines) => {
    let l = demand.base + engines;
    if (p.ops) l += demand.ops;
    if (p.mining) l += demand.mining;
    if (p.shields) l += demand.shields;
    if (p.turrets) l += demand.turrets;
    if (p.gravity) l += DRAW.gravity;
    return l + (p.lifeSupport ? lifeOn : lifeDraw(ship, false));
  };
  let load = sumLoad(demand.engines);

  /* The battery absorbs overdraw until it is flat. Once it is, the bus can
   * only carry what the reactor makes, so load gets shed until it fits. */
  ship.brownout = false;
  /* the hull itself: a trainer skiff answers the stick, a colossus does not.
   * Kept apart from the derate — 0.3 overwrote this with the derate and then
   * billed the engines at hull-thrust × draw, so a 1.2× hull on a flat battery
   * read 131 kW against a 110 kW core and made power from nothing. */
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
    /* shed to a little UNDER the core, or a latched bus never refills */
    let over = load - ship.reactor * 0.92;
    const derateMains = () => {
      if (over <= 0.5 || demand.engines <= 0) return;
      /* Mains eat the shortfall before anyone stops breathing. */
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
    /* Recompute what the bus is actually carrying now — the same sums as above. */
    load = sumLoad(demand.engines * derate);
  }
  /* what each consumer is actually drawing this tick, for the ledger and the autopilot */
  ship.draws = {
    life: p.lifeSupport ? lifeOn : lifeDraw(ship, false),
    avionics: 6,
    engines: demand.engines * derate,
    shields: p.shields ? demand.shields : 0,
    turrets: p.turrets ? demand.turrets : 0,
    cutter: p.mining ? demand.cutter : 0,
    bench: p.mining ? demand.bench : 0,
    gravity: p.gravity ? DRAW.gravity : 0,
    ops: p.ops ? demand.ops : 0,
    robots: demand.robots,
    warp: demand.warp,
  };
  ship.charge = clamp(ship.charge + (ship.reactor - load) * dt, 0, batteryCap(ship));
  if (!p.overdrive && ship.throttle > THROTTLE_RATED) ship.throttle = THROTTLE_RATED;

  /* Core strain: pushing the reactor past rated slowly bakes the hull. */
  if (tune.reactorTrim > 1.001) {
    ship.strain = Math.min(1, ship.strain + (tune.reactorTrim - 1) * 1.6 * dt);
    if (ship.strain > 0.25) {
      ship.hull = Math.max(1, ship.hull - ((ship.strain - 0.25) * 1.7 * dt) / (ship.mods?.hull ?? 1));
      pushDebuff(d, "strain", `REACTOR STRAIN ${Math.round(ship.strain * 100)}%`);
    }
  } else {
    ship.strain = Math.max(0, ship.strain - 0.22 * dt);
  }

  /* Cabin atmosphere */
  if (ship.pressurized && p.lifeSupport) {
    ship.o2 = clamp(ship.o2 + 2.2 * dt, 0, tune.o2Target);
  } else if (ship.pressurized) {
    ship.o2 = clamp(ship.o2 - 1.7 * dt, 0, 100);
  }
  if (!ship.pressurized) {
    /* Crew in hardsuits: clumsier hands, tougher hull. */
    ship.rcsScale *= 0.84;
    pushDebuff(d, "suits", "HULL VENTED — SUIT OPS, RCS −16%");
  } else if (ship.o2 < 25) {
    ship.rcsScale *= 0.75;
    ship.thrustScale *= 0.85;
    pushDebuff(d, "o2", ship.o2 < 8 ? "O2 CRITICAL" : "O2 RESERVE LOW");
  }

  /* Nothing to brace against with the deck plates cold. */
  if (!p.gravity) ship.rcsScale *= 1.08;

  /* 0.3.34: a screen recharges to ITS OWN capacity. This was a hard 100 for
   * every hull in the game, which is the same bug as hullMax never being set —
   * a capital plant held exactly the same screen as a trainer's. Regen scales
   * with the pool too, so a bigger screen is not also a slower one. */
  const shMax = ship.shieldMax ?? 100;
  if (p.shields && ship.shieldCharge < shMax) {
    ship.shieldCharge = clamp(ship.shieldCharge + 5.5 * (shMax / 100) * shipFx.fx("shieldRegen", 1) * dt, 0, shMax);
  } else if (!p.shields) {
    ship.shieldCharge = clamp(ship.shieldCharge - 3 * dt, 0, shMax);
  }

  ship.load = load;
  return load;
}

/* ---- flight ------------------------------------------------------------- */

export function stepAttitude(ship, dt) {
  /* Attitude jets drive the hull toward the heading you are looking at:
   * snappy on small errors, weighty on a hard flick. */
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
  /* Bank into the turn: yawVel is negative when the nose swings to
   * starboard, and the hull should drop its starboard wing to match. */
  ship.roll += (clamp(ship.yawVel * 0.34, -0.5, 0.5) - ship.roll) * (1 - Math.exp(-5 * dt));
}

/**
 * Newtonian translation. `rcs` is body-relative: x = right, y = up,
 * z = fine axial. Nothing damps you but the assist and the brake.
 */
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

  /* Everything below works on velocity relative to the local frame, so
   * "stop" means station-keeping with the world you are at, not freezing in
   * a heliocentric frame the world is already leaving behind. */
  const rvx = ship.vel.x - fr.x;
  const rvy = ship.vel.y - fr.y;
  const rvz = ship.vel.z - fr.z;
  const sp = Math.hypot(rvx, rvy, rvz);
  const idle = Math.abs(ship.throttle) < 0.02 && rcs.x === 0 && rcs.y === 0 && rcs.z === 0;

  if (brakeOn && sp > 0.01 && live) {
    /* Full retrograde burn — the only thing that stops you fast. */
    const k = Math.min(BRAKE_ACCEL, sp / Math.max(dt, 1e-4));
    a.x -= (rvx / sp) * k;
    a.y -= (rvy / sp) * k;
    a.z -= (rvz / sp) * k;
  }

  /* Collision avoidance, ahead of the drift trim and independent of it: this
   * one fires whether or not your hands are on the controls, because the
   * whole failure it fixes is a hull flying into something at speed. sim.js
   * hands it down as a plain vector on the ship — the flight model does not
   * know what a station is. */
  if (ship.avoid && live && ship.tune.assistGain > 0.01) {
    const av = ship.avoid;
    const g = Math.min(2.4, ship.tune.assistGain * shipFx.fx("assist", 1));
    const push = RCS_ACCEL * (av.level >= 3 ? 1.15 : 0.7) * g;
    a.x += av.x * push;
    a.y += av.y * push;
    a.z += av.z * push;
    if (av.level >= 3 && sp > 0.01) {
      /* Out of room to turn. Shed speed as well — a slower hull needs less
       * space to miss by. */
      const k = Math.min(BRAKE_ACCEL * 0.8 * g, sp / Math.max(dt, 1e-4));
      a.x -= (rvx / sp) * k;
      a.y -= (rvy / sp) * k;
      a.z -= (rvz / sp) * k;
    }
  }

  if (!brakeOn && ship.assist && live && idle && ship.tune.assistGain > 0.01) {
    const g = ship.tune.assistGain;
    /* Hysteresis: once it has you it keeps you, so the mode does not chatter
     * right on the threshold. */
    if (hold && sp < (ship.holding ? HOLD_SPEED * 1.8 : HOLD_SPEED)) {
      /* Station keeping. Everything out here is moving — the world you are
       * beside is sweeping around its star and curving as it goes. Holding a
       * velocity is not holding a position, so once you are nearly stopped the
       * assist switches to flying the anchor point itself. That is what makes
       * "stopped" mean stopped relative to what is around you. */
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
      /* Still travelling: trim the drift you did not ask for, but leave the
       * run down the nose alone — momentum is yours to spend. */
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

/* ---- damage ------------------------------------------------------------- */

/**
 * Take a hit.
 *
 * `kind` is one of js/defence.js's KINDS — kinetic, thermal or em — and it
 * decides what the screen and the plate each make of it. It defaults to
 * kinetic, which is what a round is, so a caller that does not care keeps the
 * old behaviour.
 *
 * Order matters: the screen resists first and spends itself, and only what
 * comes through is offered to the armour. A shield shrugs off energy and is
 * poor against mass; plate is the reverse. That asymmetry is the whole point
 * — it is why a drone swarm goes through a screen that laughs at a laser, and
 * why the answer to a heavily plated hull is EM.
 */
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
    /* A vented hull has nothing to blow out. */
    ship.hull = Math.max(0, ship.hull - (left * (ship.pressurized ? 1 : 0.88)) / (ship.mods?.hull ?? 1));
  }
  /* only a contact opens the CASTLE window — scraping a surface must not extend it */
  if (from) {
    ship.lastHitBy = from;
    ship.lastHitAt = time;
  }
  return left;
}

/** Hold units in use (0.3.52: each good by its bulk — materials.js bulkOf). */
export function cargoTotal(ship) {
  let n = 0;
  for (const k in ship.hold) n += ship.hold[k] * bulkOf(k);
  return n;
}

/** How many ITEMS are aboard, whatever they take up. */
export function cargoCount(ship) {
  let n = 0;
  for (const k in ship.hold) n += ship.hold[k];
  return n;
}

/** Hold units still free. */
export function holdRoom(ship) {
  return Math.max(0, ship.cargoCap - cargoTotal(ship));
}

/** How many units of `id` still fit. Use this, not holdRoom, to size a buy or a job. */
export function roomFor(ship, id) {
  return Math.max(0, holdRoom(ship) / bulkOf(id));
}

/** Adds what will fit and returns how much actually went in. */
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
