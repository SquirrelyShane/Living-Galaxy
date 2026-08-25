// Living Galaxy — single source of truth. Everything else reads and writes this.

import { SHIP_CLASSES, UPGRADES, WEAPONS, SPAWN, WORLD_SEED, PROBE, START_CLASS, ADVANCED, HEAT, ORDNANCE, ORBIT_SCALE, SCAN } from './config.js';
import { clamp } from './utils.js';
import { WEAPON_MODULES } from '../data/weapons.js';
import { normalizeFit, fitBonuses, mountedWeapons, budgetLoad } from '../systems/industry/fitting.js';
import { crewBonuses } from '../data/crew.js';

export const S = {
  time: 0,          // seconds of simulation since this session booted
  playtime: 0,      // seconds flown across all sessions — persisted in the save
  running: false,
  seed: WORLD_SEED,
  // Where in the galaxy this flight is (v1.02.44). `seed` above is the *system* seed and is
  // still the thing every generator reads; this is what it is derived from and where it sits.
  // Two integers — see world/galaxy.js on why fifty thousand systems cost no more than that.
  galaxy: { seed: WORLD_SEED, node: 0 },

  player: {
    classKey: START_CLASS,
    position: new THREE.Vector3(SPAWN.x, SPAWN.y, SPAWN.z),
    velocity: new THREE.Vector3(),
    yaw: 0, pitch: 0, throttle: 0,
    energy: 100, shield: 120, armor: 90, hull: 100,
    twr: 0, accel: 0, expend: 0,
    speed: 0, drift: 0, slip: 1,      // handling telemetry, written each frame
    lastHit: -99, lastShot: -99, autoLevel: false, kills: 0,
    heat: 0, overheat: false
  },

  credits: 1500,
  cargo: { ore: 0, salvage: 0, data: 0 },
  probes: PROBE.start,
  survey: {},
  upgrades: { shield: 0, armor: 0, cargo: 0, thrust: 0, weapon: 0, mining: 0,
              regenField: 0, overclock: 0, deepScan: 0, warpTuner: 0, autoRepair: 0, pointDef: 0 },
  ownedHulls: { [START_CLASS]: true },
  weapon: null,              // legacy: primary weapon key (mirrors fit.weapon[0])
  ownedWeapons: {},
  ownedModules: {},          // utility/core modules bought at a shipyard
  fit: null,                 // { weapon:[], utility:[], core:[] } — see systems/fitting.js
  crew: [],                  // shipboard crew, see systems/crew.js
  crewPayT: 0,               // seconds since the last payroll run
  scans: {},                 // name -> highest scan tier ever resolved
  reputation: {},            // bloc -> standing, -100..100. See systems/reputation.js
  character: null,           // the pilot. See systems/character.js
  licences: {},              // hull key -> true. Career grants one; the rest are earned
  missions: null,            // agent chain progress. See systems/missions.js
  contracts: null,           // the generated board. See systems/contracts.js
  recruits: null,            // station name -> { at, list }. See systems/crew.js
  stock: null,               // material id -> units. See systems/crafting.js
  jobs: null,                // manufacturing queue
  locker: null,              // built modules/weapons/kit awaiting fitting
  ammo: Object.assign({}, ORDNANCE.startingRounds),   // ammo id -> rounds
  loadout: null,             // feed key -> chambered ammo id. See systems/ordnance.js
  groups: null,              // hardpoint -> weapon group, plus which is live. See systems/groups.js
  npcComms: null,            // pair cooldowns for NPC-to-NPC exchanges. See systems/npc-comms.js
  deals: null,               // open obligations between characters. See systems/deals.js
  log: null,                 // bounded structured log. See core/log.js — never saved
  crewLog: null,             // rolling crew samples. See systems/crew-log.js — never saved
  comfort: null,             // quarters / galley / infirmary levels. See systems/welfare.js
  research: null,            // findings, completed projects, the active one. See systems/research.js
  sites: null,               // planetary sites. See systems/planetary.js
  orders: null,              // standing orders out in the field. See systems/orders.js
  assay: null,               // world name -> permanent survey bonus
  anomalies: null,           // Lagrange site key -> worked. See systems/lagrange.js
  market: null,
  tutorial: null,            // onboarding progress. See systems/tutorial.js
  comms: null,               // the interactive log. See systems/comms.js
  company: null,             // executive start. See systems/company.js
  managers: null,            // experimental site managers. See systems/managers.js
  // `typewriter` and `systemsDetail` are interface preferences rather than simulation state,
  // and they live here because everything in `S.settings` is persisted by one line in
  // `save.js`. Defaults: dialogue is spoken (see ui/typewriter.js), the systems drawer is
  // closed — the six bars above it are the glanceable part, the five text lines are not.
  settings: { assist: true, audio: true, chase: false, experimental: false,
              typewriter: true, systemsDetail: false,
              // The autopilot handoff sequence, and whether this save has
              // watched it once. The long version is a first-time thing;
              // see CONN in core/config/npc.js.
              connSeq: true, connSeen: false },

  input: { turning: false, dragging: false, firing: false, mining: false },

  // `standoff` is how big a gap the pilot asked the jump to leave on arrival, in units.
  // null is WARP TO — as close as the geometry allows. See systems/flight/warp.js.
  warp: { state: 'idle', charge: 0, timer: 0, dest: null, avoid: null, avoidSide: null,
          standoff: null },
  approach: null,    // { active, prevAssist, obj, prev } while the autopilot flies
  orbit: null,       // { body, r, y, angle } while holding a stable orbit
  docking: null,     // { station, t, from } while the tractor has the ship
  follow: null,      // { obj, offset } while velocity-matched (station-keeping)
  dockCooldown: 0,
  sim: { disabled: null, boarding: null, sites: [], claims: [],
         contractT: 0, fortTimer: 0, playerContract: null },

  // Solar arrays and hydroponics. Shape lives in systems/industry/habitat.js — this is
  // only the default, so a hull that has never deployed anything still reads cleanly.
  habitat: null,

  target: null,        // { obj, kind, name, faction }
  docked: null,        // station group while docked
  dockCandidate: null, // station in range
  viewOutside: false,  // true while docked and looking at the exterior (space view)

  world: { bodies: [], stations: [], asteroids: [], npcs: [], loot: [], belts: [], decoys: [] },

  // The system this save is in, as data. Produced by world/genesis.js from the seed before
  // anything is built, and read by createSystem() and createAsteroids() instead of the two
  // hardcoded tables they used to walk. Null until the world comes up; `layout` on it says
  // whether it was generated or is the authored Solaris a pre-v1.02.33 save was written in.
  systemPlan: null,

  // One record per individual — player and NPC alike. Standing per power, proficiency per
  // skill, earned qualifications, career rung, seeded traits. See systems/dossier.js: this
  // is what replaced "which of the six are you" as the thing gates ask.
  dossiers: null,

  stats: null
};

/**
 * Effective hull stats = class baseline x refits x fitted modules x crew.
 *
 * `weaponDef` is now strictly "the gun in hardpoint one", and it is **null** when there
 * is nothing in hardpoint one. It used to fall back to the pilot's legacy primary key
 * and then to the hull class's default weapon, which meant an empty fit still produced a
 * perfectly good weapon definition — and weapons.js fired it. A ship with no gun bolted
 * on could shoot. The fallback was the bug; removing it is the fix, and systems/preflight
 * turns the resulting empty state into a sentence the pilot can act on.
 *
 * The legacy `S.weapon` key survives as *ownership*, not as armament: it says which
 * emitter you have in the locker, and creation/economy seat it into the fit explicitly.
 */
function resolveWeapon() {
  const mounted = mountedWeapons(S.fit);
  return mounted.length ? mounted[0] : null;
}

/** The weapon key a hull would be issued at a yard — used when seating a starting fit. */
export function defaultWeaponKey(classKey) {
  const c = SHIP_CLASSES[classKey] || SHIP_CLASSES[START_CLASS];
  const key = c && c.weapon;
  return (key && (WEAPON_MODULES[key] || WEAPONS[key])) ? key : null;
}

/**
 * Bolt a weapon into the first free hardpoint. Returns the slot index, or -1 if the
 * hull has no room. This is the only sanctioned way for a system to arm a ship: it
 * cannot be done by assigning S.weapon, which is exactly the mistake that let an unarmed
 * hull fire.
 */
export function seatWeapon(key) {
  if (!key || !WEAPON_MODULES[key]) return -1;
  S.fit = normalizeFit(S.fit, S.player.classKey);
  const slots = S.fit.weapon;
  for (let i = 0; i < slots.length; i++) {
    if (!slots[i]) { slots[i] = key; recalcStats(); return i; }
  }
  return -1;
}

// systems/character.js registers itself here at import time. state.js cannot import it
// directly — character.js calls recalcStats(), and a static cycle between the two would
// leave one of them half-initialised depending on which the entry point loaded first.
let characterBonusesRef = null;
let characterSkillRef = null;
export function registerCharacterBonuses(fn, skillFn) {
  characterBonusesRef = fn;
  characterSkillRef = skillFn || null;
}

// Research registers the same way and for the same reason — `research.js` calls
// `recalcStats()` when a project completes, so a static import here would be a cycle.
// A fourth source of bonuses in the same shape as the other three: nothing downstream has
// to know whether a number came from a module, the crew, the pilot or a finished project.
let researchBonusesRef = null;
export function registerResearchBonuses(fn) { researchBonusesRef = fn; }

// systems/wear.js registers the condition table the same way, and for the same reason: it
// imports state.js for the fit it describes, so a static edge back would be a cycle. When
// nothing has registered — a suite exercising the fitting arithmetic on its own — every
// module reads yard-fresh, which is the honest default for a ship nobody has flown.
let wearConditionsRef = null;
export function registerWearConditions(fn) { wearConditionsRef = fn; }
const conditionTable = () => (wearConditionsRef ? wearConditionsRef() : null);

export function recalcStats() {
  const c = SHIP_CLASSES[S.player.classKey];
  const u = S.upgrades;
  const adv = u;   // advanced levels (0..max)

  // Slots follow the hull, so a swap re-seats (and may drop) what was fitted.
  S.fit = normalizeFit(S.fit, S.player.classKey);
  const cond = conditionTable();
  const f = fitBonuses(S.fit, cond);
  const w = crewBonuses(S.crew);
  // The pilot is a third source of bonuses alongside the fit and the crew, deliberately
  // in the same shape so nothing downstream has to know which one a number came from.
  // Imported lazily to keep core/state free of a cycle: character.js calls recalcStats.
  const ch = characterBonusesRef ? characterBonusesRef() : {};
  const rs = researchBonusesRef ? researchBonusesRef() : {};
  const add = (k) => (f[k] || 0) + (w[k] || 0) + (ch[k] || 0) + (rs[k] || 0);

  const cargoBase = c.cargoCap * (1 + UPGRADES.cargo.step * u.cargo) + add('cargoAdd');

  // The scanner tier the fit carries, and what fraction of the hull's *rated* array that
  // buys. Computed before the stat block rather than inside it because `sensor` needs it and
  // an object literal cannot read its own fields — see `SCAN.tierReach` for the argument.
  const scanTier = Math.round(add('scanTierAdd'));
  const reach = SCAN.tierReach[Math.max(0, Math.min(SCAN.tierReach.length - 1, scanTier))];

  S.stats = Object.assign({}, c, {
    key: S.player.classKey,
    maxThrust: c.maxThrust * (1 + UPGRADES.thrust.step * u.thrust) * (1 + add('thrustMult')),
    maxSpeed:  c.maxSpeed * (1 + add('speedMult')),
    turnRate:  c.turnRate * (1 + add('turnMult')),
    pitchRate: c.pitchRate * (1 + add('turnMult')),
    cargoCap:  cargoBase * (1 + add('cargoPct')),
    shieldMax: c.shieldMax * (1 + UPGRADES.shield.step * u.shield) + add('shieldAdd'),
    armorMax:  c.armorMax  * (1 + UPGRADES.armor.step  * u.armor) + add('armorAdd'),
    hullMax:   c.hullMax + add('hullAdd'),
    weaponMult: c.weaponMult * (1 + UPGRADES.weapon.step * u.weapon) * (1 + add('weaponMult')),
    miningMult: c.miningMult * (1 + UPGRADES.mining.step * u.mining) * (1 + add('miningMult')),
    weaponDef: resolveWeapon(),
    mounts: mountedWeapons(S.fit),
    // -- advanced modules --
    sensor:      Math.max(SCAN.reachFloor,
                          c.sensor * reach * (1 + 0.60 * adv.deepScan) * (1 + add('sensorMult'))),
    // The rated figure, kept so the fitting screen and the chart can say what the hull
    // *would* reach with its bays full — "1.9 Mm of 4.6 Mm rated" is a sentence that makes
    // the next module purchase obvious, and "1.9 Mm" on its own is not.
    sensorRated: c.sensor,
    // Warp speed scales with the system. A hop is energy-limited, not distance-limited —
    // one charge buys a fixed number of *seconds* in the bubble — so widening Solaris
    // without touching this would have meant the same eight-hop crossing turning into
    // sixteen, and an outer planet becoming an afternoon rather than a trip. The spacing
    // is meant to change what you can *see* from one place, not how long the game takes.
    warpSpeed:   c.warpSpeed * ORBIT_SCALE * (1 + 0.35 * adv.warpTuner) * (1 + add('warpSpeedMult')),
    warpSpool:   (1 / (1 + 0.30 * adv.warpTuner)) * (1 + add('warpSpoolMult')),
    warpDrain:   add('warpDrainMult'),
    energyCap:   c.energyCap * (1 + 0.25 * adv.overclock) + add('energyCapAdd'),
    energyRegen: c.energyRegen * (1 + 0.40 * adv.overclock) * (1 + 0.10 * adv.overclock) + add('energyRegenAdd'),
    shieldRegen: c.shieldRegen * (1 + 1.4 * adv.regenField) + add('shieldRegenAdd'),
    shieldDelay: adv.regenField > 0 ? 5 - 2 * adv.regenField : 5, // seconds before shields recover
    naniteArmor: ADVANCED.naniteArmorPerSec * adv.autoRepair + add('naniteArmorAdd'),
    naniteHull:  ADVANCED.naniteHullPerSec  * adv.autoRepair + add('naniteHullAdd'),
    pointDef:    Math.min(0.85, ADVANCED.pointDefChance * adv.pointDef + add('pointDefAdd')),
    scanTier,
    scanRate:    1 + add('scanRate'),
    tradeBonus:  add('tradeBonus'),
    // Both of these were summed by `characterBonuses()` and then never copied here, so a
    // corporation perk that promised "staff rates on refits" and "Coalition pads" changed
    // no number in the game. See systems/economy.js for where they are now spent.
    upgradeDiscount: add('upgradeDiscount'),
    dockDiscount:    add('dockDiscount'),
    lootRange:   add('lootRangeAdd'),
    // Heat capacity scales with dry mass — a big hull soaks more before it has to stop
    // shooting, for the same reason a big hull is slow. `heatSinkAdd` lets a fit buy
    // headroom the hull did not come with.
    heatCap:     Math.max(HEAT.capFloor, (c.heatCap || HEAT.capFloor) * (1 + add('heatSinkAdd'))),
    heatVent:    HEAT.ventRate * (1 + add('heatVentMult')),
    fitPower:    f.power || 0,
    fitCpu:      f.cpu || 0
  });

  // ── overload ───────────────────────────────────────────────────────
  // Applied after everything else, because it degrades the *result* of a fit rather
  // than any one module. Power starves the electrical systems; CPU starves the ones
  // that need to think. Neither can take a ship below BUDGET.maxPenalty of nominal —
  // a fit you cannot fly home is a soft-lock, not a tradeoff.
  const load = budgetLoad(S.fit, S.player.classKey,
                         characterSkillRef ? characterSkillRef('engineering') : 0, cond);
  S.stats.budget = load;
  if (load.powerPenalty > 0) {
    const k = 1 - load.powerPenalty;
    S.stats.shieldRegen *= k;
    S.stats.energyRegen *= k;
    S.stats.energyCap *= (1 - load.powerPenalty * 0.4);
  }
  if (load.cpuPenalty > 0) {
    const k = 1 - load.cpuPenalty;
    S.stats.sensor *= k;
    S.stats.scanRate *= k;
    S.stats.weaponMult *= (1 - load.cpuPenalty * 0.5);   // tracking, not power
    S.stats.pointDef *= k;
  }
  // Nothing may end up worse than a bare hull in the ways that would soft-lock a
  // flight: a negative-thrust or zero-cargo fit is a bug, not a build choice.
  S.stats.maxThrust = Math.max(S.stats.maxThrust, c.maxThrust * 0.35);
  S.stats.maxSpeed  = Math.max(S.stats.maxSpeed,  c.maxSpeed * 0.4);
  S.stats.cargoCap  = Math.max(S.stats.cargoCap, 100);

  const p = S.player;
  p.shield = clamp(p.shield, 0, S.stats.shieldMax);
  p.armor  = clamp(p.armor,  0, S.stats.armorMax);
  p.hull   = clamp(p.hull,   0, S.stats.hullMax);
  p.energy = clamp(p.energy, 0, S.stats.energyCap);
  p.heat   = clamp(p.heat || 0, 0, S.stats.heatCap);
  return S.stats;
}

export const cargoMass = () => S.cargo.ore + S.cargo.salvage + S.cargo.data;
export const cargoFree = () => Math.max(0, S.stats.cargoCap - cargoMass());
export const totalMass = () => S.stats.dryMass + cargoMass();

/** 0.6–1.0 — a beaten-up hull pushes less and recharges slower. */
export const hullFactor = () => 0.6 + 0.4 * (S.player.hull / S.stats.hullMax);
