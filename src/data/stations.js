// Living Galaxy — station classes and the modules that bolt onto them.
// A station has a fixed number of hardpoint slots; modules auto-attach to the next
// open slot as they finish construction, and each grants a concrete bonus once online.

export const STATION_MODULES = {
  reactor:    {name:'Fusion reactor',      power:+140, build:2400, time:26, cat:'core',
               desc:'Primary power plant — everything else draws from it'},
  solar:      {name:'Solar array',         power:+55,  build:900,  time:14, cat:'core',
               desc:'Supplemental power, falls off with distance from the star'},
  atmosphere: {name:'Atmosphere plant',    power:-28,  build:1400, time:18, cat:'life',
               desc:'Breathable volume — required before any crew module works'},
  gravity:    {name:'Gravity ring',        power:-34,  build:1800, time:20, cat:'life',
               desc:'Spin-gravity habitation; unlocks long-stay crew and services'},
  shield:     {name:'Deflector shield',    power:-46,  build:2600, time:24, cat:'defense',
               desc:'Stops solids, weapons fire and hard radiation alike'},
  radBaffle:  {name:'Radiation baffle',    power:-16,  build:1100, time:12, cat:'defense',
               desc:'Shadow shielding against solar and cosmic radiation'},
  turret:     {name:'Defense turret',      power:-22,  build:1900, time:16, cat:'defense',
               desc:'Point defense against raiders'},
  cargo:      {name:'Cargo container',     power:-6,   build:700,  time:10, cat:'logistics',
               desc:'Bulk storage — raises what the station will buy at once'},
  landingPad: {name:'Landing pad',         power:-12,  build:1200, time:14, cat:'logistics',
               desc:'Berths for drones, NPC haulers and player ships'},
  droneBay:   {name:'Drone bay',           power:-24,  build:1600, time:18, cat:'logistics',
               desc:'Launches mining and hauling drones that work the local field'},
  market:     {name:'Exchange floor',      power:-18,  build:2000, time:20, cat:'economy',
               desc:'Live commodity market — tighter spreads, better prices'},
  refinery:   {name:'Ore refinery',        power:-40,  build:2200, time:22, cat:'economy',
               desc:'Refines raw ore on site, paying a premium for it'},
  shipyard:   {name:'Shipyard',            power:-52,  build:3400, time:30, cat:'economy',
               desc:'Hull sales and refits'},
  sensor:     {name:'Sensor array',        power:-14,  build:1300, time:14, cat:'core',
               desc:'Extends station awareness and traffic control range'}
};

export const MODULE_KEYS = Object.keys(STATION_MODULES);

// Bonuses a completed module grants the station (and anyone docked).
export const MODULE_BONUS = {
  cargo:      s => { s.buyCap += 4000; },
  landingPad: s => { s.pads += 2; },
  droneBay:   s => { s.drones += 2; },
  market:     s => { s.spread *= 0.82; },
  refinery:   s => { s.orePremium += 0.18; },
  shipyard:   s => { s.hasShipyard = true; },
  shield:     s => { s.shieldMax += 900; s.radProtect += 0.5; },
  radBaffle:  s => { s.radProtect += 0.35; },
  turret:     s => { s.defense += 1; },
  gravity:    s => { s.crew = true; },
  atmosphere: s => { s.atmo = true; },
  sensor:     s => { s.sensorRange += 2200; }
};

export const STATION_TYPES = {
  tradeHub:  {name:'Trade hub',        cat:'economic',   slots:8, size:34,
              base:['reactor','atmosphere','gravity','market','cargo','landingPad']},
  fortress:  {name:'Fortress',         cat:'military',   slots:9, size:32,
              base:['reactor','atmosphere','shield','turret','turret','radBaffle','landingPad']},
  refinery:  {name:'Refinery complex', cat:'industrial', slots:8, size:38,
              base:['reactor','refinery','cargo','cargo','landingPad','droneBay']},
  foundry:   {name:'Foundry',          cat:'industrial', slots:9, size:40,
              base:['reactor','reactor','refinery','shipyard','cargo','landingPad']},
  depot:     {name:'Logistics depot',  cat:'logistics',  slots:8, size:30,
              base:['reactor','cargo','cargo','cargo','landingPad','landingPad','droneBay']},
  habitat:   {name:'Habitat ring',     cat:'civilian',   slots:9, size:48,
              base:['reactor','solar','atmosphere','gravity','radBaffle','market','landingPad']},
  relay:     {name:'Sensor relay',     cat:'civilian',   slots:6, size:22,
              base:['solar','sensor','atmosphere','landingPad']},
  bastion:   {name:'Pirate bastion',   cat:'pirate',     slots:7, size:30,
              base:['reactor','shield','turret','turret','cargo']}
};

/** Stations placed in Solaris at world-gen. */
export const SYSTEM_STATIONS = [
  {name:'Fortress Omega',    type:'fortress', orbit:3200,  color:0xff3344},
  {name:'Trade Platform',    type:'tradeHub', orbit:4200,  color:0xff66ff},
  {name:'Foundry Alpha',     type:'foundry',  orbit:5100,  color:0xffaa22},
  {name:'Refinery Complex',  type:'refinery', orbit:6800,  color:0xee9922},
  {name:'Transit Hub Gamma', type:'depot',    orbit:8600,  color:0x44ff66},
  {name:'Exchange Nexus',    type:'tradeHub', orbit:11200, color:0xff66ff},
  {name:'Cargo Depot 9',     type:'depot',    orbit:13400, color:0x55ee77},
  {name:'Habitat Ring-7',    type:'habitat',  orbit:15800, color:0x88ccff},
  {name:'Patrol Delta',      type:'fortress', orbit:18500, color:0xff4455},
  {name:'Rime Relay',        type:'relay',    orbit:27000, color:0x99ddff},
  {name:'Colony Habitat',    type:'habitat',  orbit:24000, color:0x99bbff}
];

/** Fresh service-state for a station, before modules are applied. */
export function baseServices(type) {
  return { power:0, buyCap:6000, pads:0, drones:0, spread:1, orePremium:0,
           hasShipyard:false, shieldMax:0, radProtect:0, defense:0,
           crew:false, atmo:false, sensorRange:1800 };
}
