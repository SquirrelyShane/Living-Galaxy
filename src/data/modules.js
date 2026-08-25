// Living Galaxy — fittable modules. Weapons live in data/weapons.js; these are the
// utility and core subsystems that go in the other hardpoints.
//
//   slot   'utility' = active kit, swapped often · 'core' = permanent subsystem
//   mods   aggregated by systems/fitting.js and folded into recalcStats()
//   power  continuous MW draw while fitted (shows up in the Draw readout)
//   cpu    flight-computer bandwidth. A second, independent budget — see BUDGET in
//          core/config.js. Power and CPU deliberately do not correlate perfectly, so a
//          fit can be power-comfortable and CPU-starved or the reverse, and "just fit
//          the biggest thing" stops being a strategy.
//
// Keep every mod key here in sync with the switch in fitting.js — an unknown key
// is silently ignored, which is the kind of bug that eats an evening.

export const MODULES = {
  // ── utility ────────────────────────────────────────────────────────
  afterburn: { name: 'Afterburner', slot: 'utility', price:7200, power: 1.4, cpu: 4.6,
    desc: 'Overfeeds the mains — more push, more heat',
    mods: { thrustMult: 0.18, speedMult: 0.10, energyRegenAdd: -0.6 } },

  shieldboost: { name: 'Shield booster', slot: 'utility', price:9300, power: 1.8, cpu: 5.5,
    desc: 'Capacitor bank spliced into the shield loop',
    mods: { shieldAdd: 28, shieldRegenAdd: 1.6 } },

  ecm: { name: 'ECM suite', slot: 'utility', price:13800, power: 2.2, cpu: 6.3,
    desc: 'Muddies hostile firing solutions — fewer rounds connect',
    mods: { pointDefAdd: 0.16, sensorMult: 0.10 } },

  surveydish: { name: 'Survey dish', slot: 'utility', price:10200, power: 1.1, cpu: 3.9,
    desc: 'One extra tier of scan resolution at any range',
    mods: { scanTierAdd: 1, sensorMult: 0.12 } },

  oreproc: { name: 'Ore processor', slot: 'utility', price:11700, power: 2.0, cpu: 5.9,
    desc: 'Slags tailings in the hold — faster fill, denser cargo',
    mods: { miningMult: 0.40, cargoAdd: 900 } },

  // ── the long-haul pair (v1.02.60) ────────────────────────────────
  // Both are *decisions*, not bonuses, which is why they carry no `mods` at all: an array
  // does nothing to a stat sheet and everything to how a voyage is planned. See
  // systems/industry/habitat.js.
  solararray: { name: 'Solar array', slot: 'utility', price:6400, power: 0.4, cpu: 2.1,
    desc: 'Unfolds to charge from the star — the drive is locked out while it is out',
    mods: {} },

  hydrobed: { name: 'Hydroponics bed', slot: 'utility', price:5900, power: 0.9, cpu: 2.6,
    desc: 'Grows provisions from water and light — enough beds and the crew feed themselves',
    mods: {} },

  tractor: { name: 'Salvage tractor', slot: 'utility', price:8700, power: 1.5, cpu: 4.8,
    desc: 'Reels in wrecks from further out',
    mods: { lootRangeAdd: 220, cargoAdd: 400 } },

  gunlink: { name: 'Gunnery uplink', slot: 'utility', price:15600, power: 1.9, cpu: 5.7,
    desc: 'Shared fire-control across every mount',
    mods: { weaponMult: 0.14 } },

  cloakfoil: { name: 'Ablative foil', slot: 'utility', price:6600, power: 0.5, cpu: 2.6,
    desc: 'Cheap stand-off plating, sheds on impact',
    mods: { armorAdd: 34, speedMult: -0.04 } },

  // ── core ───────────────────────────────────────────────────────────
  reactor2: { name: 'Fusion reactor Mk II', slot: 'core', price:19200, power: 0, cpu: 3.0,
    desc: 'Bigger bank, faster recharge — feeds everything else',
    mods: { energyCapAdd: 30, energyRegenAdd: 2.4 } },

  cargobay: { name: 'Expanded hold', slot: 'core', price:12300, power: 0.4, cpu: 3.9,
    desc: 'Structural bay conversion',
    mods: { cargoAdd: 2600 } },

  warpcoil: { name: 'Warp coil array', slot: 'core', price:22800, power: 0.9, cpu: 5.0,
    desc: 'Higher cruise, shorter spool — but a thirstier bubble',
    mods: { warpSpeedMult: 0.28, warpSpoolMult: -0.22, warpDrainMult: 0.22 } },

  // The counterpart: slower, but a crossing costs far less to hold. Freight hulls want
  // this and gunships do not, which is the point of it existing.
  fluxdamp: { name: 'Flux damper', slot: 'core', price:18600, power: 0.5, cpu: 4.1,
    desc: 'Stabilises the bubble — much cheaper cruise, slightly slower',
    mods: { warpDrainMult: -0.34, warpSpeedMult: -0.06, energyRegenAdd: 0.4 } },

  nanitebay: { name: 'Nanite bay', slot: 'core', price:20700, power: 1.2, cpu: 5.6,
    desc: 'Field repair of armor and structure out of combat',
    mods: { naniteArmorAdd: 1.1, naniteHullAdd: 0.5 } },

  sensorcore: { name: 'Deep sensor core', slot: 'core', price:17400, power: 1.6, cpu: 6.5,
    desc: 'Doubles the reach of the contact scan',
    mods: { sensorMult: 0.55, scanTierAdd: 1 } },

  spineplate: { name: 'Spinal plating', slot: 'core', price:15300, power: 0, cpu: 3.0,
    desc: 'Structural reinforcement through the keel',
    mods: { hullAdd: 30, armorAdd: 40, thrustMult: -0.06 } },

  // ── two the mod table already knew about (v1.02.60) ──────────────
  // `heatSinkAdd`, `heatVentMult` and `energyCapAdd` have been switch cases in
  // systems/industry/fitting.js since the budgets were written, and nothing in the game
  // produced them — so a thermal or capacitor problem was one a player could see on the
  // readouts and could not do anything about. Found while writing ARIA's advisory cases:
  // she wanted to recommend a fix for a bottleneck the catalogue had no answer to.
  heatsink: { name: 'Heat sink bank', slot: 'core', price:14200, power: 0.6, cpu: 3.4,
    desc: 'More thermal mass and more radiator — holds the trigger down longer',
    mods: { heatSinkAdd: 0.45, heatVentMult: 0.30, thrustMult: -0.04 } },

  capbank: { name: 'Capacitor bank', slot: 'core', price:16100, power: 0.5, cpu: 4.2,
    desc: 'Deep reserve spliced across the bus — a bigger bank and a faster refill',
    mods: { energyCapAdd: 40, energyRegenAdd: 0.7, cargoAdd: -300 } },

  gyros: { name: 'Gyro package', slot: 'core', price:10800, power: 0.7, cpu: 4.5,
    desc: 'Snappier yaw and pitch response',
    mods: { turnMult: 0.30 } }
};

export const MODULE_KEYS = Object.keys(MODULES);
const utilityKeys = () => MODULE_KEYS.filter(k => MODULES[k].slot === 'utility');
const coreKeys    = () => MODULE_KEYS.filter(k => MODULES[k].slot === 'core');
