// Living Galaxy — Station Forge.
//
// The station generator. One canonical layout graph per station: decks, compartments,
// corridors and the ports that join them. Nothing here touches the DOM or three.js —
// this file decides what a station *is*; world/station-mesh.js decides how it looks and
// world/system.js decides where it sits. That split is deliberate: the same graph feeds
// the 3D hull, the deck-plan overlay, docking, boarding and mission targeting, and any
// one of those can change without the others re-deriving geometry and getting it subtly
// wrong.
//
// Ported from the standalone Orbital Forge prototype (index-1.html). The IIFE became a
// module, `generateStation` became `generateLayout`, and `exportForGame` became
// `exportLayout`.
//
// A layout is pure data and deterministic in its seed string, so every client seeded the
// same builds the identical station — which is the whole reason multiplayer never has to
// send a station over the wire.
//
// v1.01.99: the prototype carried its own `mulberry32` and `hashSeed`. core/rng.js has both,
// and a second generator is a second thing that has to stay in step across clients for that
// guarantee to hold. It now draws from the one in core, which **changes which station a
// given seed produces** — a one-time break, taken deliberately while nothing persists a
// layout, and locked afterwards by the golden signatures in test/forge.mjs.
//
// The editor verbs (place, move, remove, cycle) live in world/station-edit.js. Nothing in
// the game calls them yet; keeping them out of this file keeps the boot graph honest about
// what is actually reachable.

import { mulberry32, hashString, worldSeed } from '../core/rng.js';

const TAU = Math.PI * 2;
const DECK_H = 26;         // metres between deck floors (decks must read as separate levels)
const ROOM_H = 6.0;        // internal compartment height

// ---------- category palette (drives blueprint + 3D tint) ----------
const CATS = {
  command:  { label: 'Command',    hex: '#ff5c7a' },
  hab:      { label: 'Habitation', hex: '#b48cff' },
  science:  { label: 'Science',    hex: '#00e5ff' },
  industry: { label: 'Industry',   hex: '#3dff9a' },
  cargo:    { label: 'Cargo',      hex: '#ffc857' },
  defense:  { label: 'Defense',    hex: '#ff6432' },
  docking:  { label: 'Docking',    hex: '#6fa8ff' },
  power:    { label: 'Power',      hex: '#ffe066' },
  life:     { label: 'Life Sup.',  hex: '#4fd6b8' },
  transit:  { label: 'Transit',    hex: '#8fa2bd' },
  void:     { label: 'Breached',   hex: '#46506a' }
};

// ---------- names ----------
const PREFIXES = [
  "Aether","Nova","Iron","Stellar","Void","Eclipse","Helios","Orion","Cygnus",
  "Rigel","Vega","Pulsar","Quasar","Nebula","Astra","Titan","Prometheus","Icarus",
  "Hyperion","Eos","Selene","Kronos","Atlas","Nexus","Apex","Zenith","Horizon",
  "Cobalt","Obsidian","Crimson","Aurora","Solace","Vanguard","Frontier","Exile",
  "Fortress","Omega","Solaris","Meridian","Tessera"
];
const SUFFIXES = [
  "Station","Hub","Outpost","Platform","Forge","Spire","Citadel","Array",
  "Nexus","Prime","Alpha","Beta","Gamma","Delta","Omega","One","Seven","Nine",
  "Reach","Point","Gate","Dock","Ring","Core","Anchor","Haven","Bastion"
];
const GREEK = ["Alpha","Beta","Gamma","Delta","Epsilon","Zeta","Eta","Theta","Iota","Kappa"];

// ---------- archetypes ----------
// layout: which structural generator builds the deck plan
const ARCHETYPES = {
  military: {
    label: "Military Fortress", className: "type-military",
    color: 0xff4d6d, hex: "#ff4d6d", layout: "grid",
    cfg: { key:'bastion', decks:[2,3,3,4,4], hubR:17, trunks:4, wings:[3,4], wingR:46, roomD:[16,22], tanW:[16,26], inner:[1,2], sats:[1,3], spur:[45,90],  satSize:[28,40], subs:[1,3], diamond:0.6,  chaos:0.02 },
    factions: ["Solar Defense Force","Outer Rim Fleet","Corporate Security","Independent Militia"],
    adjectives: ["heavily fortified","battle-scarred","angular","imposing","militarised"],
    deckNames: ["Magazine Deck","Barracks Deck","Operations Deck","Command Deck","Battery Deck"],
    rooms: [
      { n:"Command Bridge",   c:"command",  a:3, pri:0 },
      { n:"Combat Info Centre",c:"command", a:3, pri:0 },
      { n:"Reactor Hall",     c:"power",    a:3, pri:0 },
      { n:"Main Hangar",      c:"docking",  a:3, pri:0 },
      { n:"Shield Generator", c:"power",    a:2, pri:1 },
      { n:"Primary Armoury",  c:"defense",  a:2, pri:1 },
      { n:"Barracks Block",   c:"hab",      a:2, pri:1 },
      { n:"Officer Quarters", c:"hab",      a:1, pri:1 },
      { n:"Missile Magazine", c:"defense",  a:2, pri:1 },
      { n:"Sensor Suite",     c:"science",  a:1, pri:1 },
      { n:"Medbay",           c:"life",     a:1, pri:1 },
      { n:"Mess Hall",        c:"hab",      a:2, pri:1 },
      { n:"Brig",             c:"defense",  a:1, pri:2 },
      { n:"Comms Relay",      c:"command",  a:1, pri:2 },
      { n:"Drone Bay",        c:"docking",  a:2, pri:2 },
      { n:"Point-Defence Control", c:"defense", a:1, pri:2 },
      { n:"Fabrication Shop", c:"industry", a:2, pri:2 },
      { n:"Cryo Reserve",     c:"hab",      a:1, pri:2 },
      { n:"Fuel Bunker",      c:"cargo",    a:2, pri:2 },
      { n:"Training Cage",    c:"hab",      a:1, pri:2 }
    ],
    filler: [["Ammunition Locker","cargo"],["Squad Bunk","hab"],["Gun Servicing Bay","defense"],["Supply Store","cargo"]]
  },
  trade: {
    label: "Trade Hub", className: "type-trade",
    color: 0xffc857, hex: "#ffc857", layout: "spine",
    cfg: { key:'exchange', decks:[2,3,3,3,4], hubR:16, trunks:4, wings:[1,3], wingR:44, roomD:[18,26], tanW:[20,32], inner:[1,2], sats:[2,4], spur:[60,120], satSize:[30,46], subs:[1,3], diamond:0.3,  chaos:0.05 },
    factions: ["Free Traders Guild","Merchant Combine","Independent Cartel","Colonial Exchange"],
    adjectives: ["bustling","multi-dock","neon-lit","crowded","opportunistic"],
    deckNames: ["Freight Deck","Concourse","Promenade","Control Deck"],
    rooms: [
      { n:"Trade Floor",       c:"command",  a:3, pri:0 },
      { n:"Grand Concourse",   c:"hab",      a:3, pri:0 },
      { n:"Primary Cargo Bay", c:"cargo",    a:3, pri:0 },
      { n:"Traffic Control",   c:"command",  a:2, pri:0 },
      { n:"Customs Hall",      c:"command",  a:2, pri:1 },
      { n:"Bonded Warehouse",  c:"cargo",    a:3, pri:1 },
      { n:"Currency Exchange", c:"command",  a:1, pri:1 },
      { n:"Cantina",           c:"hab",      a:2, pri:1 },
      { n:"Transient Quarters",c:"hab",      a:2, pri:1 },
      { n:"Reactor Room",      c:"power",    a:2, pri:1 },
      { n:"Freight Elevator",  c:"transit",  a:1, pri:1 },
      { n:"Broker Offices",    c:"command",  a:1, pri:2 },
      { n:"Cold Storage",      c:"cargo",    a:2, pri:2 },
      { n:"Repair Berth",      c:"industry", a:2, pri:2 },
      { n:"Security Checkpoint",c:"defense", a:1, pri:2 },
      { n:"Luxury Suites",     c:"hab",      a:2, pri:2 },
      { n:"Hydroponic Larder", c:"life",     a:1, pri:2 },
      { n:"Auction Ring",      c:"command",  a:2, pri:2 },
      { n:"Courier Lockers",   c:"cargo",    a:1, pri:2 },
      { n:"Medbay",            c:"life",     a:1, pri:2 }
    ],
    filler: [["Container Stack","cargo"],["Trader Stall Row","hab"],["Manifest Office","command"],["Pallet Store","cargo"]]
  },
  research: {
    label: "Research Laboratory", className: "type-research",
    color: 0x00e5ff, hex: "#00e5ff", layout: "lattice",
    cfg: { key:'lattice', decks:[1,2,2,3,3], hubR:15, trunks:4, wings:[1,2], wingR:42, roomD:[14,20], tanW:[16,24], inner:[0,1], sats:[2,4], spur:[70,130], satSize:[26,40], subs:[1,2], diamond:0.2,  chaos:0.04 },
    factions: ["Institute of Stellar Sciences","Xenoarchaeology Guild","Corporate R&D","Independent Scholars"],
    adjectives: ["sterile","antenna-laden","quiet","high-security","experimental"],
    deckNames: ["Support Deck","Laboratory Deck","Observation Deck"],
    rooms: [
      { n:"Central Data Core",  c:"science",  a:3, pri:0 },
      { n:"Primary Laboratory", c:"science",  a:3, pri:0 },
      { n:"Observatory",        c:"science",  a:2, pri:0 },
      { n:"Fusion Plant",       c:"power",    a:2, pri:0 },
      { n:"Clean Room",         c:"science",  a:2, pri:1 },
      { n:"Specimen Vault",     c:"science",  a:2, pri:1 },
      { n:"Server Farm",        c:"science",  a:2, pri:1 },
      { n:"Zero-G Chamber",     c:"science",  a:2, pri:1 },
      { n:"Hydroponics",        c:"life",     a:2, pri:1 },
      { n:"Researcher Quarters",c:"hab",      a:2, pri:1 },
      { n:"Archive",            c:"science",  a:1, pri:1 },
      { n:"Isolation Ward",     c:"life",     a:1, pri:2 },
      { n:"Antenna Control",    c:"command",  a:1, pri:2 },
      { n:"Sample Airlock",     c:"docking",  a:1, pri:2 },
      { n:"Cryogenics",         c:"science",  a:1, pri:2 },
      { n:"Fabrication Lab",    c:"industry", a:2, pri:2 },
      { n:"Commissary",         c:"hab",      a:1, pri:2 },
      { n:"Medbay",             c:"life",     a:1, pri:2 },
      { n:"Shuttle Dock",       c:"docking",  a:2, pri:2 },
      { n:"Reactor Shielding",  c:"power",    a:1, pri:2 }
    ],
    filler: [["Annex Lab","science"],["Sample Store","science"],["Equipment Cache","cargo"],["Study Cell","hab"]]
  },
  mining: {
    label: "Mining Platform", className: "type-mining",
    color: 0x3dff9a, hex: "#3dff9a", layout: "rig",
    cfg: { key:'rig', decks:[2,2,3,3,3], hubR:18, trunks:3, wings:[1,2], wingR:40, roomD:[18,28], tanW:[20,30], inner:[1,2], sats:[2,4], spur:[50,100], satSize:[28,44], subs:[1,3], diamond:0.1,  chaos:0.06, rock:true },
    factions: ["Deep Rock Consortium","Asteroid Miners Union","Corporate Extraction","Independent Prospectors"],
    adjectives: ["industrial","grimy","resource-rich","utilitarian","dust-caked"],
    deckNames: ["Drill Deck","Process Deck","Ops Deck"],
    rooms: [
      { n:"Ore Processor",     c:"industry", a:3, pri:0 },
      { n:"Smelter Hall",      c:"industry", a:3, pri:0 },
      { n:"Drill Control",     c:"command",  a:2, pri:0 },
      { n:"Reactor Stack",     c:"power",    a:2, pri:0 },
      { n:"Refinery",          c:"industry", a:3, pri:1 },
      { n:"Ore Silo",          c:"cargo",    a:2, pri:1 },
      { n:"Crew Quarters",     c:"hab",      a:2, pri:1 },
      { n:"Maintenance Bay",   c:"industry", a:2, pri:1 },
      { n:"Fuel Depot",        c:"cargo",    a:2, pri:1 },
      { n:"Conveyor Hub",      c:"transit",  a:2, pri:1 },
      { n:"Assay Office",      c:"science",  a:1, pri:1 },
      { n:"Mess & Wash",       c:"hab",      a:1, pri:2 },
      { n:"Slag Ejector",      c:"industry", a:1, pri:2 },
      { n:"Tool Crib",         c:"cargo",    a:1, pri:2 },
      { n:"Medbay",            c:"life",     a:1, pri:2 },
      { n:"Scrubber Plant",    c:"life",     a:2, pri:2 },
      { n:"Hauler Berth",      c:"docking",  a:2, pri:2 },
      { n:"Foreman's Office",  c:"command",  a:1, pri:2 },
      { n:"Charge Magazine",   c:"defense",  a:1, pri:2 },
      { n:"Rock Sorting Line", c:"industry", a:2, pri:2 }
    ],
    filler: [["Ore Hopper","cargo"],["Spoil Bay","industry"],["Parts Store","cargo"],["Shift Bunk","hab"]]
  },
  habitat: {
    label: "Civilian Habitat", className: "type-habitat",
    color: 0xb48cff, hex: "#b48cff", layout: "ring",
    cfg: { key:'ring', decks:[2,2,3,3,4], hubR:16, trunks:4, wings:[3,4], wingR:48, roomD:[14,20], tanW:[14,22], inner:[1,2], sats:[1,3], spur:[50,95],  satSize:[26,38], subs:[1,2], diamond:0.25, chaos:0.02 },
    factions: ["Colonial Authority","Habitat Cooperative","Corporate Township","Independent Settlement"],
    adjectives: ["sprawling","green-tinged","community-focused","well-lit","peaceful"],
    deckNames: ["Utility Ring","Residential Ring","Garden Ring","Upper Ring"],
    rooms: [
      { n:"Habitat Commons",   c:"hab",      a:3, pri:0 },
      { n:"Park Sector",       c:"life",     a:3, pri:0 },
      { n:"Administration",    c:"command",  a:2, pri:0 },
      { n:"Main Power Core",   c:"power",    a:2, pri:0 },
      { n:"Residential Block", c:"hab",      a:3, pri:1 },
      { n:"Marketplace",       c:"cargo",    a:2, pri:1 },
      { n:"Medical Centre",    c:"life",     a:2, pri:1 },
      { n:"School",            c:"hab",      a:2, pri:1 },
      { n:"Water Reclamation", c:"life",     a:2, pri:1 },
      { n:"Recreation Deck",   c:"hab",      a:2, pri:1 },
      { n:"Shuttle Port",      c:"docking",  a:2, pri:1 },
      { n:"Air Plant",         c:"life",     a:2, pri:1 },
      { n:"Constabulary",      c:"defense",  a:1, pri:2 },
      { n:"Chapel",            c:"hab",      a:1, pri:2 },
      { n:"Workshops",         c:"industry", a:2, pri:2 },
      { n:"Foundry Co-op",     c:"industry", a:1, pri:2 },
      { n:"Archive & Library", c:"science",  a:1, pri:2 },
      { n:"Creche",            c:"hab",      a:1, pri:2 },
      { n:"Granary",           c:"cargo",    a:2, pri:2 },
      { n:"Observation Lounge",c:"hab",      a:1, pri:2 }
    ],
    filler: [["Dwelling Row","hab"],["Allotment","life"],["Utility Space","industry"],["Storage Locker","cargo"]]
  },
  pirate: {
    label: "Pirate Haven", className: "type-pirate",
    color: 0xff6432, hex: "#ff6432", layout: "hive",
    cfg: { key:'hive', decks:[2,2,3,3,3], hubR:14, trunks:3, wings:[1,2], wingR:36, roomD:[12,22], tanW:[12,26], inner:[1,2], sats:[2,5], spur:[40,110], satSize:[22,40], subs:[1,3], diamond:0.35, chaos:0.18 },
    factions: ["Red Claw Syndicate","Void Reavers","Black Flag Collective","Independent Corsairs"],
    adjectives: ["ragged","jury-rigged","dangerous","shadowy","heavily armed"],
    deckNames: ["Bilge","Main Sprawl","Roost"],
    rooms: [
      { n:"Black Market",     c:"cargo",    a:3, pri:0 },
      { n:"Captured Bridge",  c:"command",  a:2, pri:0 },
      { n:"Hidden Hangar",    c:"docking",  a:3, pri:0 },
      { n:"Scav Reactor",     c:"power",    a:2, pri:0 },
      { n:"Chop Shop",        c:"industry", a:2, pri:1 },
      { n:"Fight Pit",        c:"hab",      a:2, pri:1 },
      { n:"Smuggler Hold",    c:"cargo",    a:2, pri:1 },
      { n:"Cantina",          c:"hab",      a:2, pri:1 },
      { n:"Armoury",          c:"defense",  a:1, pri:1 },
      { n:"Crew Warren",      c:"hab",      a:2, pri:1 },
      { n:"Fence's Office",   c:"command",  a:1, pri:1 },
      { n:"Holding Cells",    c:"defense",  a:1, pri:2 },
      { n:"Lookout Nest",     c:"command",  a:1, pri:2 },
      { n:"Escape Pod Rack",  c:"docking",  a:1, pri:2 },
      { n:"Still & Brewery",  c:"life",     a:1, pri:2 },
      { n:"Sawbones",         c:"life",     a:1, pri:2 },
      { n:"Trophy Hold",      c:"cargo",    a:1, pri:2 },
      { n:"Jammer Array",     c:"defense",  a:1, pri:2 },
      { n:"Fuel Siphon",      c:"industry", a:2, pri:2 },
      { n:"Salvage Yard",     c:"industry", a:2, pri:2 }
    ],
    filler: [["Welded Hold","cargo"],["Bunk Nest","hab"],["Scrap Pile","industry"],["Stash","cargo"]]
  },
  derelict: {
    label: "Derelict / Abandoned", className: "type-derelict",
    color: 0x9aa0b0, hex: "#9aa0b0", layout: "any",
    cfg: { key:'wreck', decks:[2,3,3,3,4], hubR:16, trunks:4, wings:[2,3], wingR:44, roomD:[16,24], tanW:[16,26], inner:[1,2], sats:[1,3], spur:[55,110], satSize:[26,42], subs:[1,3], diamond:0.3,  chaos:0.08 },
    factions: ["None (Abandoned)","Scavenger Claim","Unknown Previous Owners","Corporate Write-off"],
    adjectives: ["silent","drifting","half-ruined","dark","haunted"],
    deckNames: ["Flooded Deck","Main Deck","Upper Deck","Wreck Deck"],
    rooms: [
      { n:"Silent Bridge",       c:"command",  a:3, pri:0 },
      { n:"Dead Reactor",        c:"power",    a:3, pri:0 },
      { n:"Collapsed Concourse", c:"hab",      a:3, pri:0 },
      { n:"Empty Hangar",        c:"docking",  a:3, pri:0 },
      { n:"Ruined Laboratory",   c:"science",  a:2, pri:1 },
      { n:"Overgrown Hydroponics",c:"life",    a:2, pri:1 },
      { n:"Sealed Ward",         c:"life",     a:1, pri:1 },
      { n:"Corroded Dock",       c:"docking",  a:2, pri:1 },
      { n:"Stripped Quarters",   c:"hab",      a:2, pri:1 },
      { n:"Ghost Comms",         c:"command",  a:1, pri:1 },
      { n:"Debris Field",        c:"void",     a:2, pri:1 },
      { n:"Breach Seal",         c:"void",     a:1, pri:2 },
      { n:"Flooded Sublevel",    c:"void",     a:2, pri:2 },
      { n:"Frozen Mess Hall",    c:"hab",      a:1, pri:2 },
      { n:"Looted Armoury",      c:"defense",  a:1, pri:2 },
      { n:"Cargo Graveyard",     c:"cargo",    a:2, pri:2 },
      { n:"Silent Machine Shop", c:"industry", a:2, pri:2 },
      { n:"Escape Pod Bay",      c:"docking",  a:1, pri:2 },
      { n:"Drifting Archive",    c:"science",  a:1, pri:2 },
      { n:"Vacuum Corridor",     c:"void",     a:1, pri:2 }
    ],
    filler: [["Collapsed Space","void"],["Ruined Bay","void"],["Sealed Section","void"],["Dark Hold","cargo"]]
  }
};

const HOOK_TEMPLATES = [
  "A distress beacon from {room} has been broadcasting for {days} cycles — no one answers.",
  "Rumour says a prototype weapon is locked inside {room} on {deck}.",
  "The station AI is issuing contradictory orders to crews working {deck}.",
  "A high-value prisoner is being moved through {room} within the week.",
  "Radiation spikes bloom out of {room} every 17 hours, on the hour.",
  "A rival faction has agents embedded in the maintenance crew on {deck}.",
  "The last supply freighter never arrived; {room} is already rationing.",
  "An uncharted rock is on a slow intercept with the outer docking ring.",
  "Someone is siphoning fuel and routing it through {room}.",
  "A sealed cryo-pod of unknown origin turned up in {room}.",
  "Ownership of the station is being contested in interstellar court.",
  "Local corsairs have started demanding protection payments at the docks.",
  "A rich mineral vein was found nearby — the station wants exclusive rights.",
  "{room} was locked down after an unexplained biological incident.",
  "A celebrity xenologist arrives next cycle for a classified experiment in {room}.",
  "Deck plans for {deck} were sold on the black market three days ago.",
  "The pressure door to {room} has been welded shut from the inside."
];


function makeDecks(names, count) {
  const decks = [];
  for (let i = 0; i < count; i++) {
    decks.push({
      index: i,
      name: names[Math.min(i, names.length - 1)] + (i >= names.length ? ' ' + (i + 1) : ''),
      y: (i - (count - 1) / 2) * DECK_H
    });
  }
  return decks;
}

function generateName(rng) {
  const pick = a => a[Math.floor(rng() * a.length)];
  const r = rng();
  if (r < 0.3) return pick(PREFIXES) + " " + pick(SUFFIXES);
  if (r < 0.55) return pick(PREFIXES) + "-" + Math.floor(rng() * 9 + 1) + Math.floor(rng() * 9);
  if (r < 0.75) return pick(SUFFIXES) + " " + pick(GREEK);
  if (r < 0.9) return pick(PREFIXES) + " " + pick(GREEK);
  return "The " + pick(PREFIXES) + " " + pick(SUFFIXES);
}
// ============================================================
// MODULE CATALOG
//
// Every piece of a station is a module with explicit PORTS.
// A port is a connection point in module-local space:
//   { x, z, a }   a = outward normal angle (radians)
// Two modules join by aligning one port against another so the
// normals oppose and the points coincide. Nothing is ever drawn
// "freehand" — if two things look connected, they ARE connected
// through a port pair, and the validator proves it.
// ============================================================

const PORT_EPS = 0.35;        // metres — port coincidence tolerance

// ---- footprint shapes ----
// rect  : w x d box
// oct   : box with cut corners (drawn), rect for collision
// round : diameter = w
// arc   : curved corridor, r + sweep + hand

function defRoom(name, cat, cls) {
  const dim = [[14, 12], [20, 17], [29, 23]][cls - 1];
  const [w, d] = dim;
  const ports = [{ x: 0, z: -d / 2, a: -Math.PI / 2 }];
  if (cls >= 2) ports.push({ x: 0, z: d / 2, a: Math.PI / 2 });
  if (cls >= 3) { ports.push({ x: -w / 2, z: 0, a: Math.PI }); ports.push({ x: w / 2, z: 0, a: 0 }); }
  return { name, cat, kind: 'room', shape: 'oct', w, d, ports, cls };
}

function arcPorts(r, sweep, hand) {
  const s = hand;
  const th0 = -s * Math.PI / 2;
  const th1 = th0 + s * sweep;
  const cz = s * r;
  const p1 = { x: Math.cos(th1) * r, z: cz + Math.sin(th1) * r };
  // tangent at each end, pointing outward from the module
  const t1 = { x: -Math.sin(th1) * s, z: Math.cos(th1) * s };
  return {
    centre: { x: 0, z: cz }, th0, th1,
    ports: [
      { x: 0, z: 0, a: Math.atan2(-Math.sin(th0) * s, -Math.cos(th0) * s) },
      { x: p1.x, z: p1.z, a: Math.atan2(t1.z, t1.x) }
    ]
  };
}

function defArc(key, r, sweep, hand) {
  const A = arcPorts(r, sweep, hand);
  return {
    name: 'Curved Corridor', cat: 'transit', kind: 'corridor', shape: 'arc',
    r, sweep, hand, arcCentre: A.centre, th0: A.th0, th1: A.th1,
    w: 5.2, d: 5.2, ports: A.ports, structural: true
  };
}

const STRUCT_DEFS = {
  'core-hub': {
    name: 'Control Room', cat: 'command', kind: 'junction', shape: 'oct',
    w: 26, d: 26, structural: true, core: true,
    ports: [0, 1, 2, 3, 4, 5].map(i => {
      const a = i * TAU / 6;
      return { x: Math.cos(a) * 13, z: Math.sin(a) * 13, a };
    })
  },
  'junction-cross': {
    name: 'Corridor Junction', cat: 'transit', kind: 'junction', shape: 'oct',
    w: 11, d: 11, structural: true,
    ports: [0, 1, 2, 3].map(i => {
      const a = i * TAU / 4;
      return { x: Math.cos(a) * 5.5, z: Math.sin(a) * 5.5, a };
    })
  },
  'junction-tee': {
    name: 'Corridor Tee', cat: 'transit', kind: 'junction', shape: 'oct',
    w: 10, d: 10, structural: true,
    ports: [0, 1, 2].map(i => {
      const a = i * TAU / 4;
      return { x: Math.cos(a) * 5, z: Math.sin(a) * 5, a };
    })
  },
  'elevator': {
    name: 'Elevator', cat: 'transit', kind: 'node', shape: 'oct',
    w: 12, d: 12, structural: true, spansDecks: true,
    ports: [0, 1, 2, 3].map(i => {
      const a = i * TAU / 4 + Math.PI / 4;
      return { x: Math.cos(a) * 6, z: Math.sin(a) * 6, a };
    })
  },
  'corridor-short': {
    name: 'Corridor', cat: 'transit', kind: 'corridor', shape: 'rect',
    w: 16, d: 5.2, structural: true,
    ports: [{ x: -8, z: 0, a: Math.PI }, { x: 8, z: 0, a: 0 }]
  },
  'corridor-long': {
    name: 'Corridor Run', cat: 'transit', kind: 'corridor', shape: 'rect',
    w: 34, d: 5.2, structural: true,
    ports: [{ x: -17, z: 0, a: Math.PI }, { x: 17, z: 0, a: 0 }]
  },
  'corridor-trunk': {
    name: 'Access Trunk', cat: 'transit', kind: 'corridor', shape: 'rect',
    w: 56, d: 6.0, structural: true, spur: true,
    ports: [{ x: -28, z: 0, a: Math.PI }, { x: 28, z: 0, a: 0 }]
  },
  'elbow-left': {
    name: 'Corridor Bend', cat: 'transit', kind: 'corridor', shape: 'rect',
    w: 9, d: 9, structural: true,
    ports: [{ x: -4.5, z: 0, a: Math.PI }, { x: 0, z: -4.5, a: -Math.PI / 2 }]
  },
  'elbow-right': {
    name: 'Corridor Bend', cat: 'transit', kind: 'corridor', shape: 'rect',
    w: 9, d: 9, structural: true,
    ports: [{ x: -4.5, z: 0, a: Math.PI }, { x: 0, z: 4.5, a: Math.PI / 2 }]
  },
  'arc-left': defArc('arc-left', 44, 0.62, 1),
  'arc-right': defArc('arc-right', 44, 0.62, -1),
  'airlock': {
    name: 'Airlock', cat: 'docking', kind: 'corridor', shape: 'oct',
    w: 9, d: 7, structural: true,
    ports: [{ x: -4.5, z: 0, a: Math.PI }, { x: 4.5, z: 0, a: 0 }]
  },
  'dock-arm': {
    name: 'Docking Arm', cat: 'docking', kind: 'room', shape: 'rect',
    w: 18, d: 9, structural: true, terminal: true,
    ports: [{ x: -9, z: 0, a: Math.PI }]
  },
  'cap-plate': {
    name: 'Bulkhead Cap', cat: 'transit', kind: 'cap', shape: 'rect',
    w: 5.6, d: 6.4, structural: true, terminal: true, cap: true,
    ports: [{ x: -2.8, z: 0, a: Math.PI }]
  },
  'cap-blister': {
    name: 'Observation Blister', cat: 'hab', kind: 'cap', shape: 'round',
    w: 10, d: 10, structural: true, terminal: true, cap: true,
    ports: [{ x: -5, z: 0, a: Math.PI }]
  },
  'cap-sensor': {
    name: 'Sensor Mast', cat: 'science', kind: 'cap', shape: 'round',
    w: 8, d: 8, structural: true, terminal: true, cap: true,
    ports: [{ x: -4, z: 0, a: Math.PI }]
  },
  'cap-battery': {
    name: 'Point-Defence Turret', cat: 'defense', kind: 'cap', shape: 'oct',
    w: 9, d: 9, structural: true, terminal: true, cap: true,
    ports: [{ x: -4.5, z: 0, a: Math.PI }]
  },
  'cap-vent': {
    name: 'Heat Radiator', cat: 'power', kind: 'cap', shape: 'rect',
    w: 7, d: 14, structural: true, terminal: true, cap: true,
    ports: [{ x: -3.5, z: 0, a: Math.PI }]
  }
};

const CAP_KEYS = ['cap-plate', 'cap-plate', 'cap-blister', 'cap-sensor', 'cap-battery', 'cap-vent'];
const CONNECTOR_KEYS = ['corridor-short', 'corridor-long', 'elbow-left', 'elbow-right',
                        'arc-left', 'arc-right', 'junction-cross', 'junction-tee', 'airlock'];

// build the full catalog: structural + every archetype's rooms
const MODULES = Object.assign({}, STRUCT_DEFS);
Object.keys(ARCHETYPES).forEach(tk => {
  const arch = ARCHETYPES[tk];
  arch.roomKeys = [];
  arch.rooms.forEach(r => {
    const key = tk + ':' + r.n.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    MODULES[key] = defRoom(r.n, r.c, Math.max(1, Math.min(3, r.a)));
    MODULES[key].pri = r.pri;
    MODULES[key].archetype = tk;
    arch.roomKeys.push(key);
  });
  arch.fillerKeys = [];
  arch.filler.forEach((f, i) => {
    const key = tk + ':filler-' + i;
    MODULES[key] = defRoom(f[0], f[1], 1 + (i % 2));
    MODULES[key].pri = 3;
    MODULES[key].filler = true;
    MODULES[key].archetype = tk;
    arch.fillerKeys.push(key);
  });
});

// ============================================================
// GEOMETRY — placement, ports in world space, collision
// ============================================================

function rot2(x, z, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: x * c - z * s, z: x * s + z * c };
}

// world-space port p of placed module m
function worldPort(m, i) {
  const def = MODULES[m.key];
  const p = def.ports[i];
  const r = rot2(p.x, p.z, m.rot);
  return { x: m.x + r.x, z: m.z + r.z, a: normAng(p.a + m.rot), deck: m.deck };
}
function normAng(a) {
  a = a % TAU;
  if (a > Math.PI) a -= TAU;
  if (a < -Math.PI) a += TAU;
  return a;
}

// Where must a module sit so its port `ci` meets world port `wp`?
function solvePlacement(key, ci, wp, deck) {
  const def = MODULES[key];
  const cp = def.ports[ci];
  const rot = normAng(wp.a + Math.PI - cp.a);
  const r = rot2(cp.x, cp.z, rot);
  return { key, deck, x: wp.x - r.x, z: wp.z - r.z, rot };
}

// collision hulls: list of oriented boxes covering the module
// Cached on the pose it was computed for. `collides` used to recompute this for every
// already-placed module on every test — 56,860 calls per layout for 84 modules, and the
// single largest cost in generation. During growth a placed module never moves; the editor
// verbs do move them, and the pose check catches that without them having to remember to
// invalidate anything.
function hulls(m) {
  if (m.__hull !== undefined && m.__hx === m.x && m.__hz === m.z && m.__hr === m.rot) return m.__hull;
  const out = hullsRaw(m);
  m.__hx = m.x; m.__hz = m.z; m.__hr = m.rot; m.__hull = out;
  return out;
}

function hullsRaw(m) {
  const def = MODULES[m.key];
  if (def.shape === 'arc') {
    // sample the sweep as a few boxes
    const out = [];
    const steps = 3;
    for (let i = 0; i < steps; i++) {
      const t0 = def.th0 + (def.th1 - def.th0) * (i / steps);
      const t1 = def.th0 + (def.th1 - def.th0) * ((i + 1) / steps);
      const mid = (t0 + t1) / 2;
      const lx = def.arcCentre.x + Math.cos(mid) * def.r;
      const lz = def.arcCentre.z + Math.sin(mid) * def.r;
      const w = Math.abs(def.r * (t1 - t0)) + 1.5;
      const p = rot2(lx, lz, m.rot);
      out.push({ x: m.x + p.x, z: m.z + p.z, w, d: def.d, rot: m.rot + mid + Math.PI / 2 });
    }
    return out;
  }
  return [{ x: m.x, z: m.z, w: def.w, d: def.d, rot: m.rot }];
}

// Corners as a flat [x,z, x,z, x,z, x,z], cached on the box for the shrink it was asked
// for. The test below runs ~34,000 times per layout and used to allocate four point objects
// and an array on each side of every call.
function boxCorners(b, s) {
  if (b.__cs === s) return b.__c;
  const hw = b.w * s / 2, hd = b.d * s / 2;
  const c = Math.cos(b.rot), sn = Math.sin(b.rot);
  const out = [
    b.x + (-hw * c + hd * sn), b.z + (-hw * sn - hd * c),
    b.x + (hw * c + hd * sn),  b.z + (hw * sn - hd * c),
    b.x + (hw * c - hd * sn),  b.z + (hw * sn + hd * c),
    b.x + (-hw * c - hd * sn), b.z + (-hw * sn + hd * c)
  ];
  b.__cs = s; b.__c = out;
  return out;
}

// separating-axis test with a shrink factor so touching neighbours pass
function boxOverlap(a, b, shrink) {
  const s = shrink == null ? 0.88 : shrink;
  const A = boxCorners(a, s), B = boxCorners(b, s);
  const H = Math.PI / 2;
  for (let k = 0; k < 4; k++) {
    const ang = k < 2 ? a.rot + k * H : b.rot + (k - 2) * H;
    const nx = Math.cos(ang), nz = Math.sin(ang);
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (let i = 0; i < 8; i += 2) {
      const v = A[i] * nx + A[i + 1] * nz;
      if (v < a0) a0 = v;
      if (v > a1) a1 = v;
      const w = B[i] * nx + B[i + 1] * nz;
      if (w < b0) b0 = w;
      if (w > b1) b1 = w;
    }
    if (a1 <= b0 || b1 <= a0) return false;
  }
  return true;
}

function modulesOverlap(m1, m2, shrink) {
  const h1 = hulls(m1), h2 = hulls(m2);
  for (const a of h1) for (const b of h2) if (boxOverlap(a, b, shrink)) return true;
  return false;
}

function collides(placed, cand, ignoreId) {
  for (let i = 0; i < placed.length; i++) {
    const o = placed[i];
    if (o.deck !== cand.deck) continue;
    if (o.id === ignoreId || o.id === cand.id) continue;
    // quick reject
    const dr = (MODULES[o.key].w + MODULES[o.key].d + MODULES[cand.key].w + MODULES[cand.key].d) * 0.75;
    if (Math.hypot(o.x - cand.x, o.z - cand.z) > dr + 40) continue;
    if (modulesOverlap(o, cand)) return o;
  }
  return null;
}

function moduleRadius(key) {
  const def = MODULES[key];
  if (def.shape === 'arc') return def.r * Math.abs(def.sweep) * 0.6 + def.d;
  return Math.hypot(def.w, def.d) / 2;
}
// ============================================================
// ASSEMBLER
//
// Growth is a BFS over OPEN PORTS. A module can only enter the
// station by being solved onto an existing open port, so the
// graph is connected by construction — there is no code path
// that can produce a floating room or a corridor to nowhere.
// ============================================================

function newStationGraph() {
  return { modules: [], links: [], nextId: 1 };
}

function addModule(G, spec) {
  const m = {
    id: G.nextId++, key: spec.key, deck: spec.deck,
    x: spec.x, z: spec.z, rot: spec.rot,
    links: MODULES[spec.key].ports.map(() => null),
    owned: !!spec.owned, locked: !!spec.locked
  };
  G.modules.push(m);
  return m;
}

function linkPorts(G, aId, ai, bId, bi) {
  const a = G.modules.find(m => m.id === aId), b = G.modules.find(m => m.id === bId);
  if (!a || !b) return false;
  a.links[ai] = { id: bId, port: bi };
  b.links[bi] = { id: aId, port: ai };
  G.links.push({ a: aId, ap: ai, b: bId, bp: bi });
  return true;
}

function unlinkAll(G, id) {
  const m = G.modules.find(x => x.id === id);
  if (!m) return;
  m.links.forEach((l, i) => {
    if (!l) return;
    const o = G.modules.find(x => x.id === l.id);
    if (o) o.links[l.port] = null;
    m.links[i] = null;
  });
  G.links = G.links.filter(l => l.a !== id && l.b !== id);
}

// World-space port positions, cached per module pose. `openPorts` runs once per growth
// iteration — a few thousand times per layout — and used to allocate a fresh point for
// every port of every module on each pass. That was most of the generator's GC pressure.
function portCache(m) {
  if (m.__wp !== undefined && m.__wx === m.x && m.__wz === m.z && m.__wr === m.rot) return m.__wp;
  const out = MODULES[m.key].ports.map((p, i) => worldPort(m, i));
  m.__wx = m.x; m.__wz = m.z; m.__wr = m.rot; m.__wp = out;
  return out;
}

// The assembler picks from this array with the seeded rng, so its **order is part of the
// seed contract** — module order, then port index. Any rewrite must preserve both or the
// same seed builds a different station.
function openPorts(G, deck) {
  const out = [];
  const mods = G.modules;
  for (let k = 0; k < mods.length; k++) {
    const m = mods[k];
    if (deck != null && m.deck !== deck) continue;
    const wps = portCache(m);
    for (let i = 0; i < m.links.length; i++) {
      if (!m.links[i]) out.push({ mod: m, port: i, wp: wps[i] });
    }
  }
  return out;
}

// try to attach `key` to open port `op`; returns the module or null
function tryAttach(G, key, op, opts) {
  const def = MODULES[key];
  const o = opts || {};
  const order = [];
  for (let i = 0; i < def.ports.length; i++) order.push(i);
  if (o.rng) for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(o.rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]];
  }
  for (const ci of order) {
    const spec = solvePlacement(key, ci, op.wp, op.mod.deck);
    if (!isFinite(spec.x) || !isFinite(spec.z) || !isFinite(spec.rot)) continue;
    const probe = { id: -1, key, deck: op.mod.deck, x: spec.x, z: spec.z, rot: spec.rot };
    if (collides(G.modules, probe, op.mod.id)) continue;
    const m = addModule(G, { key, deck: op.mod.deck, x: spec.x, z: spec.z, rot: spec.rot, owned: o.owned });
    linkPorts(G, op.mod.id, op.port, m.id, ci);
    return m;
  }
  return null;
}

// ---- weighted pick helper ----
function wpick(rng, table) {
  let total = 0;
  for (const k in table) total += table[k];
  let r = rng() * total;
  for (const k in table) { r -= table[k]; if (r <= 0) return k; }
  return Object.keys(table)[0];
}

function buildStation(P) {
  const { rng, size, arch, typeKey } = P;
  const cfg = arch.cfg;
  const rand = (a, b) => a + rng() * (b - a);
  const pick = a => a[Math.floor(rng() * a.length)];

  const deckCount = cfg.decks[size - 1];
  const decks = makeDecks(arch.deckNames, deckCount);
  const G = newStationGraph();

  // budget of non-structural rooms per deck
  const roomBudget = Math.round((6 + size * 4) * (cfg.dense || 1));

  // ---------- deck 0: core ----------
  const core = addModule(G, { key: 'core-hub', deck: 0, x: 0, z: 0, rot: rng() * TAU, locked: true });

  const roomPool = arch.roomKeys.slice();
  let poolI = 0, fillI = 0;
  const nextRoomKey = () => {
    if (poolI < roomPool.length) return roomPool[poolI++];
    const k = arch.fillerKeys[fillI % arch.fillerKeys.length]; fillI++;
    return k;
  };

  const elevatorSeeds = [];   // {x,z,rot} shared down the stack

  function growDeck(deck, budget, seeds) {
    let placedRooms = 0;
    // frontier of open ports, seeded from the deck's roots
    let guard = 0;
    const maxIter = budget * 26 + 400;

    while (placedRooms < budget && guard++ < maxIter) {
      const open = openPorts(G, deck);
      if (!open.length) break;

      // prefer ports on transit modules — rooms hang off circulation
      const transit = open.filter(o => MODULES[o.mod.key].kind !== 'room' && !MODULES[o.mod.key].cap);
      const pool = transit.length ? transit : open;
      const op = pool[Math.floor(rng() * pool.length)];
      const parentDef = MODULES[op.mod.key];

      let key;
      if (parentDef.kind === 'room') {
        // rooms only ever extend into circulation
        key = wpick(rng, { 'corridor-short': 4, 'junction-tee': 1, 'airlock': 1 });
      } else {
        const table = Object.assign({
          room: 8,
          'corridor-short': 3,
          'corridor-long': 1.5,
          'junction-cross': 1.2,
          'junction-tee': 1.6,
          'elbow-left': 0.8, 'elbow-right': 0.8,
          'arc-left': cfg.arcs || 0.6, 'arc-right': cfg.arcs || 0.6,
          elevator: (deck === 0 && elevatorSeeds.length < cfg.trunks) ? 2.2 : 0,
          'corridor-trunk': cfg.spurs || 0.8,
          'dock-arm': 0.5
        }, {});
        // don't chain corridors forever
        if (parentDef.kind === 'corridor') { table.room = 12; table['corridor-short'] = 1; table['corridor-long'] = 0.5; }
        key = wpick(rng, table);
      }

      if (key === 'room') key = nextRoomKey();

      const m = tryAttach(G, key, op, { rng });
      if (!m) {
        // couldn't fit — cap this port so it never dangles
        if (rng() < 0.35) tryAttach(G, pick(CAP_KEYS), op, { rng });
        continue;
      }
      if (MODULES[m.key].kind === 'room') placedRooms++;
      if (MODULES[m.key].spansDecks && deck === 0) elevatorSeeds.push({ x: m.x, z: m.z, rot: m.rot });
    }
    return placedRooms;
  }

  growDeck(0, roomBudget, [core]);

  // ---------- upper/lower decks rooted on the elevator stack ----------
  if (elevatorSeeds.length === 0) {
    // guarantee at least one vertical connection
    const open = openPorts(G, 0);
    for (const op of open) {
      const m = tryAttach(G, 'elevator', op, { rng });
      if (m) { elevatorSeeds.push({ x: m.x, z: m.z, rot: m.rot }); break; }
    }
  }

  for (let d = 1; d < deckCount; d++) {
    const seeds = [];
    elevatorSeeds.forEach(s => {
      const probe = { id: -1, key: 'elevator', deck: d, x: s.x, z: s.z, rot: s.rot };
      if (collides(G.modules, probe)) return;
      const m = addModule(G, { key: 'elevator', deck: d, x: s.x, z: s.z, rot: s.rot, locked: true });
      m.stack = true;
      seeds.push(m);
    });
    if (!seeds.length) break;
    growDeck(d, Math.round(roomBudget * (1 - d * 0.12)), seeds);
  }

  // ---------- cap every remaining open port ----------
  let dangling = openPorts(G);
  let capGuard = 0;
  while (dangling.length && capGuard++ < 800) {
    const op = dangling[0];
    const parentDef = MODULES[op.mod.key];
    // a corridor stub gets a bulkhead; a room edge can get something nicer
    const key = parentDef.kind === 'room' ? pick(CAP_KEYS) : (rng() < 0.72 ? 'cap-plate' : pick(CAP_KEYS));
    if (!tryAttach(G, key, op, { rng })) {
      if (!tryAttach(G, 'cap-plate', op, { rng })) {
        // nowhere to put a cap: mark the port sealed so nothing renders as open
        op.mod.links[op.port] = { sealed: true };
      }
    }
    dangling = openPorts(G);
  }

  return { G, decks, elevatorSeeds };
}

// ============================================================
// VALIDATOR
// Runs on every generated AND every edited station. Anything it
// reports is a bug, not a style choice.
// ============================================================

function validate(G, decks) {
  const errors = [], warnings = [];
  const byId = {};
  G.modules.forEach(m => { byId[m.id] = m; });

  // 1. geometry sanity
  G.modules.forEach(m => {
    if (!MODULES[m.key]) errors.push({ code: 'unknown-module', id: m.id, msg: 'unknown key ' + m.key });
    if (!isFinite(m.x) || !isFinite(m.z) || !isFinite(m.rot))
      errors.push({ code: 'nan-transform', id: m.id, msg: 'non-finite transform' });
    if (decks && !decks[m.deck]) errors.push({ code: 'bad-deck', id: m.id, msg: 'module on missing deck' });
  });

  // 2. link symmetry + port coincidence
  G.modules.forEach(m => {
    m.links.forEach((l, i) => {
      if (!l || l.sealed) return;
      const o = byId[l.id];
      if (!o) { errors.push({ code: 'broken-link', id: m.id, msg: 'links to missing module' }); return; }
      const back = o.links[l.port];
      if (!back || back.id !== m.id || back.port !== i)
        errors.push({ code: 'asymmetric-link', id: m.id, msg: 'link not mirrored by neighbour' });
      if (o.deck !== m.deck)
        errors.push({ code: 'cross-deck-link', id: m.id, msg: 'lateral link spans decks' });
      const p1 = worldPort(m, i), p2 = worldPort(o, l.port);
      const gap = Math.hypot(p1.x - p2.x, p1.z - p2.z);
      if (gap > PORT_EPS)
        errors.push({ code: 'port-gap', id: m.id, msg: 'ports ' + gap.toFixed(2) + ' m apart' });
    });
  });

  // 3. no dangling ports
  G.modules.forEach(m => {
    m.links.forEach((l, i) => {
      if (l === null) errors.push({ code: 'open-port', id: m.id, msg: 'port ' + i + ' leads nowhere' });
    });
  });

  // 4. overlap
  const byDeck = {};
  G.modules.forEach(m => { (byDeck[m.deck] = byDeck[m.deck] || []).push(m); });
  Object.values(byDeck).forEach(list => {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (a.links.some(l => l && l.id === b.id)) continue;      // neighbours touch by design
        if (Math.hypot(a.x - b.x, a.z - b.z) > moduleRadius(a.key) + moduleRadius(b.key) + 4) continue;
        if (modulesOverlap(a, b, 0.8))
          errors.push({ code: 'overlap', id: a.id, other: b.id, msg: MODULES[a.key].name + ' overlaps ' + MODULES[b.key].name });
      }
    }
  });

  // 5. reachability — flood fill from the core across links and elevator stacks
  const core = G.modules.find(m => MODULES[m.key].core) || G.modules[0];
  const seen = new Set();
  if (core) {
    const stackAt = {};
    G.modules.filter(m => MODULES[m.key].spansDecks).forEach(m => {
      const k = Math.round(m.x) + '/' + Math.round(m.z);
      (stackAt[k] = stackAt[k] || []).push(m);
    });
    const q = [core.id];
    seen.add(core.id);
    while (q.length) {
      const m = byId[q.shift()];
      if (!m) continue;
      m.links.forEach(l => {
        if (l && !l.sealed && byId[l.id] && !seen.has(l.id)) { seen.add(l.id); q.push(l.id); }
      });
      if (MODULES[m.key].spansDecks) {
        const k = Math.round(m.x) + '/' + Math.round(m.z);
        (stackAt[k] || []).forEach(o => { if (!seen.has(o.id)) { seen.add(o.id); q.push(o.id); } });
      }
    }
  }
  G.modules.forEach(m => {
    if (!seen.has(m.id))
      errors.push({ code: 'unreachable', id: m.id, msg: MODULES[m.key].name + ' cannot be reached from the core' });
  });

  // 6. soft checks
  decks && decks.forEach(d => {
    const n = G.modules.filter(m => m.deck === d.index).length;
    if (!n) warnings.push({ code: 'empty-deck', msg: d.name + ' has no modules' });
  });

  return { ok: errors.length === 0, errors, warnings, reachable: seen.size, total: G.modules.length };
}

// Repair pass — used after edits and as a generation safety net.
function repair(G, decks) {
  let changed = 0;
  // seal any open port
  G.modules.forEach(m => {
    m.links.forEach((l, i) => {
      if (l === null) { m.links[i] = { sealed: true }; changed++; }
    });
  });
  // drop modules unreachable from the core
  const v = validate(G, decks);
  const bad = new Set(v.errors.filter(e => e.code === 'unreachable').map(e => e.id));
  if (bad.size) {
    G.modules.filter(m => bad.has(m.id)).forEach(m => unlinkAll(G, m.id));
    G.modules = G.modules.filter(m => !bad.has(m.id));
    changed += bad.size;
  }
  return changed;
}
// ============================================================
// PRESENTATION VIEW
// Renderers consume this: every module carries its own drawable
// footprint plus its world-space ports, so nothing downstream
// has to re-derive geometry (and get it subtly wrong).
// ============================================================

function moduleView(m, nameOverride) {
  const def = MODULES[m.key];
  const v = {
    id: m.id, key: m.key, kind: def.kind, shape: def.shape,
    name: nameOverride || def.name, cat: m.breached ? 'void' : def.cat, baseCat: def.cat,
    deck: m.deck, x: m.x, z: m.z, rot: m.rot,
    w: def.w, d: def.d, structural: !!def.structural, cap: !!def.cap,
    spansDecks: !!def.spansDecks, core: !!def.core,
    owned: !!m.owned, locked: !!m.locked, breached: !!m.breached,
    pressurised: !m.breached,
    ports: def.ports.map((p, i) => {
      const wp = worldPort(m, i);
      return { x: wp.x, z: wp.z, a: wp.a, open: m.links[i] === null, sealed: !!(m.links[i] && m.links[i].sealed) };
    }),
    links: m.links.map(l => (l && !l.sealed ? l.id : null))
  };
  if (def.shape === 'arc') {
    v.r = def.r; v.sweep = def.sweep; v.hand = def.hand;
    v.arcCentre = def.arcCentre; v.th0 = def.th0; v.th1 = def.th1;
    v.area = Math.abs(def.r * def.sweep) * def.d;
    v.span = def.r * Math.abs(def.sweep);
  } else {
    v.area = def.w * def.d;
    v.span = Math.hypot(def.w, def.d);
  }
  v.crew = def.kind === 'room' ? Math.max(1, Math.round(v.area / 18)) : 0;
  return v;
}

// ============================================================
// MAIN ENTRY
// ============================================================
function generateLayout(opts) {
  const seedStr = opts.seed || Math.random().toString(36).slice(2, 10).toUpperCase();
  const size = Math.max(1, Math.min(5, opts.size || 3));
  const density = Math.max(0.2, Math.min(1.4, (opts.density == null ? 85 : opts.density) / 100));
  let decay = Math.max(0, Math.min(1, (opts.decay || 0) / 100));

  const rng = mulberry32(hashString(seedStr + '|' + size + '|' + (opts.type || 'any') + '|' + Math.round(density * 100)));
  const pick = a => a[Math.floor(rng() * a.length)];
  const rand = (a, b) => a + rng() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));

  const typeKey = (!opts.type || opts.type === 'any') ? pick(Object.keys(ARCHETYPES)) : opts.type;
  const arch = ARCHETYPES[typeKey];
  const cfg = Object.assign({ dense: 1, arcs: 0.6, spurs: 0.8, trunks: 4 }, arch.cfg);
  cfg.dense = (arch.cfg.dense || 1) * density;

  if (typeKey === 'derelict') decay = Math.max(decay, 0.5 + rng() * 0.3);

  const built = buildStation({ rng, size, arch: Object.assign({}, arch, { cfg }), typeKey });
  const G = built.G, decks = built.decks;

  // ---- decay: breach compartments, never disconnect the graph ----
  if (decay > 0) {
    G.modules.forEach(m => {
      const def = MODULES[m.key];
      if (def.core || def.spansDecks) return;
      if (def.kind === 'room' && rng() < decay * 0.55) m.breached = true;
      else if (def.cap && rng() < decay * 0.3) m.breached = true;
    });
  }

  repair(G, decks);
  const report = validate(G, decks);

  // ---- unique display names ----
  const used = {};
  const views = G.modules.map(m => {
    const base = MODULES[m.key].name;
    let name = base;
    if (MODULES[m.key].kind === 'room') {
      used[base] = (used[base] || 0) + 1;
      if (used[base] > 1) name = base + ' ' + String(used[base]).padStart(2, '0');
    }
    return moduleView(m, name);
  });
  views.sort((p, q) => (p.deck - q.deck) || (Math.atan2(p.z, p.x) - Math.atan2(q.z, q.x)));

  // name the long access trunks after where they lead
  views.filter(v => v.key === 'corridor-trunk').forEach(v => {
    const dests = v.links.map(id => views.find(o => o.id === id)).filter(o => o && o.kind === 'room');
    if (dests.length) v.label = 'Airlock to ' + dests[dests.length - 1].name;
  });

  const rooms = views.filter(v => v.kind === 'room');
  let maxR = 30;
  views.forEach(v => { maxR = Math.max(maxR, Math.hypot(v.x, v.z) + v.span * 0.5); });

  // World-gen reads its roster from data/stations.js and already has a canonical name for
  // each station, so it passes one in. The draw happens either way, so the rest of the
  // layout is identical whether the name was rolled or supplied.
  const rolled = generateName(rng);
  const name = opts.name || rolled;
  const faction = opts.faction || pick(arch.factions);
  const adj = pick(arch.adjectives);

  const OCC = { hab: 1 / 14, command: 1 / 45, science: 1 / 50, life: 1 / 90, industry: 1 / 70,
                cargo: 1 / 300, docking: 1 / 120, defense: 1 / 80, power: 1 / 200, transit: 1 / 400, void: 0 };
  const population = Math.max(0, Math.round(
    rooms.reduce((t, r) => t + (r.pressurised ? r.area * (OCC[r.cat] || 1 / 200) : 0), 0) *
    (decay > 0.5 ? 0.05 : 1) * rand(0.85, 1.2)));
  const power = Math.round(Math.max(0, (1 - decay) * randInt(55, 100)));
  const defense = Math.round((1 - decay * 0.9) * (typeKey === 'military' ? randInt(60, 95) : typeKey === 'pirate' ? randInt(40, 75) : randInt(15, 55)));
  const tech = typeKey === 'research' ? randInt(6, 10) : decay > 0.6 ? randInt(1, 4) : randInt(3, 8);
  const totalArea = Math.round(views.reduce((t, v) => t + v.area, 0));

  const sizeWords = ["compact", "modest", "sprawling", "massive", "colossal"];
  const desc =
    `${name} is a ${adj} ${arch.label.toLowerCase()} grown outward from a central control room. ` +
    `Operated by ${faction}, the ${sizeWords[size - 1]} structure spans ${decks.length} decks and ` +
    `${views.length} modules — ${rooms.length} of them habitable compartments — totalling roughly ${totalArea.toLocaleString()} m². ` +
    (decay > 0.45
      ? `Pressure has failed across ${views.filter(v => v.breached).length} sections; the corridor network still holds.`
      : `Power generation sits at ${power}% of rated output; local defence is assessed at ${defense}.`);

  const hooks = [];
  const pool = [...HOOK_TEMPLATES].sort(() => rng() - 0.5);
  for (let i = 0; i < 2 + Math.floor(size / 2); i++) {
    const s = rooms.length ? pick(rooms) : null;
    hooks.push(pool[i % pool.length]
      .replace('{room}', s ? s.name : 'the control room')
      .replace('{deck}', s ? decks[s.deck].name : 'the main deck')
      .replace('{days}', randInt(3, 40)));
  }

  const station = {
    seed: seedStr, name, typeKey, typeLabel: arch.label, className: arch.className,
    color: arch.color, hex: arch.hex, faction, size,
    density: Math.round(density * 100), decay: Math.round(decay * 100),
    layout: 'port-graph', population, power, defense, tech, totalArea,
    decks, modules: views, rooms, bounds: { r: maxR * 1.12, inner: 0 },
    deckHeight: DECK_H, validation: report,
    graph: G,                                  // live graph, for the editor
    // No wall-clock stamp: a layout is a pure function of its seed, and a timestamp in
    // here would make two clients' identical stations compare unequal.
    description: desc, hooks
  };

  // A station with nowhere to dock is not a station anyone can use. Bigger stations get
  // more berths; a derelict gets one, and that one is the way in.
  if (opts.berths !== 0) ensureBerths(station, opts.berths || Math.max(1, Math.round(size / 2)));

  return station;
}

// ============================================================
// EDITOR API
// Every mutation goes through here, and every mutation is
// followed by a validate() so a bad edit can be refused rather
// than silently corrupting the station.
// ============================================================

function refreshLayout(station) {
  const used = {};
  const views = station.graph.modules.map(m => {
    const base = MODULES[m.key].name;
    let name = base;
    if (MODULES[m.key].kind === 'room') {
      used[base] = (used[base] || 0) + 1;
      if (used[base] > 1) name = base + ' ' + String(used[base]).padStart(2, '0');
    }
    return moduleView(m, name);
  });
  views.sort((p, q) => (p.deck - q.deck) || (Math.atan2(p.z, p.x) - Math.atan2(q.z, q.x)));
  views.filter(v => v.key === 'corridor-trunk').forEach(v => {
    const dests = v.links.map(id => views.find(o => o.id === id)).filter(o => o && o.kind === 'room');
    if (dests.length) v.label = 'Airlock to ' + dests[dests.length - 1].name;
  });
  station.modules = views;
  station.rooms = views.filter(v => v.kind === 'room');
  station.totalArea = Math.round(views.reduce((t, v) => t + v.area, 0));
  let maxR = 30;
  views.forEach(v => { maxR = Math.max(maxR, Math.hypot(v.x, v.z) + v.span * 0.5); });
  station.bounds = { r: maxR * 1.12, inner: 0 };
  station.validation = validate(station.graph, station.decks);
  return station;
}

// list of every open (uncapped or sealed-but-free) port a new module could use
function attachPoints(station, deck) {
  const G = station.graph, out = [];
  const byId = {};
  G.modules.forEach(m => { byId[m.id] = m; });
  G.modules.forEach(m => {
    if (deck != null && m.deck !== deck) return;
    m.links.forEach((l, i) => {
      const wp = worldPort(m, i);
      if (l === null || l.sealed) {
        out.push({ modId: m.id, port: i, x: wp.x, z: wp.z, a: wp.a, deck: m.deck, sealed: !!(l && l.sealed) });
        return;
      }
      // a port closed off by an end piece is still a usable build site —
      // end pieces are placeholders, not permanent structure
      const nb = byId[l.id];
      if (nb && MODULES[nb.key].cap && !nb.locked) {
        out.push({ modId: m.id, port: i, x: wp.x, z: wp.z, a: wp.a, deck: m.deck, capId: nb.id, capName: MODULES[nb.key].name });
      }
    });
  });
  // mark which points can actually take something, so the UI can
  // show dead ends as dead ends instead of teasing the player
  const probes = ['cap-plate', 'corridor-short', 'junction-tee'];
  out.forEach(ap => { ap.usable = probes.some(k => canPlace(station, k, ap) >= 0); });
  return out;
}

function freePort(G, modId, port) {
  const m = G.modules.find(x => x.id === modId);
  if (!m) return false;
  const l = m.links[port];
  if (l && l.sealed) { m.links[port] = null; return true; }
  return l === null;
}

// Non-mutating: could `key` be attached at `ap`? Returns the
// orientation index that works, or -1. Used to filter the build
// palette so the player is never offered something that can't fit.
function canPlace(station, key, ap) {
  const def = MODULES[key];
  if (!def) return -1;
  const G = station.graph;
  const host = G.modules.find(m => m.id === ap.modId);
  if (!host) return -1;
  const wp = worldPort(host, ap.port);
  const ignore = new Set([host.id]);
  if (ap.capId != null) ignore.add(ap.capId);
  const others = G.modules.filter(m => !ignore.has(m.id));
  for (let ci = 0; ci < def.ports.length; ci++) {
    const spec = solvePlacement(key, ci, wp, host.deck);
    if (!isFinite(spec.x) || !isFinite(spec.z) || !isFinite(spec.rot)) continue;
    const probe = { id: -1, key, deck: host.deck, x: spec.x, z: spec.z, rot: spec.rot };
    if (!collides(others, probe)) return ci;
  }
  return -1;
}

// every catalog key that fits at this attach point
function fittingKeys(station, ap, keys) {
  const list = keys || Object.keys(MODULES);
  return list.filter(k => !MODULES[k].core && canPlace(station, k, ap) >= 0);
}

// place a module onto a specific attach point
function placeModule(station, key, ap) {
  if (!MODULES[key]) return { ok: false, reason: 'Unknown module type' };
  const G = station.graph;
  const host = G.modules.find(m => m.id === ap.modId);
  if (!host) return { ok: false, reason: 'Attachment point no longer exists' };

  // clear an end piece out of the way first, restoring it if the new module won't fit
  let removedCap = null;
  if (ap.capId != null) {
    const cap = G.modules.find(m => m.id === ap.capId);
    if (cap) {
      removedCap = { key: cap.key, port: ap.port };
      unlinkAll(G, cap.id);
      G.modules = G.modules.filter(m => m.id !== cap.id);
      host.links[ap.port] = null;
    }
  }
  const restoreCap = () => {
    if (!removedCap) return;
    host.links[ap.port] = null;
    tryAttach(G, removedCap.key, { mod: host, port: ap.port, wp: worldPort(host, ap.port) }, {});
    if (host.links[ap.port] === null) host.links[ap.port] = { sealed: true };
  };

  const wasSealed = host.links[ap.port] && host.links[ap.port].sealed;
  freePort(G, ap.modId, ap.port);
  const op = { mod: host, port: ap.port, wp: worldPort(host, ap.port) };
  const m = tryAttach(G, key, op, {});
  if (!m) {
    if (removedCap) restoreCap();
    else if (wasSealed) host.links[ap.port] = { sealed: true };
    refreshLayout(station);
    return { ok: false, reason: 'No orientation of that module fits in that space' };
  }
  m.owned = true;
  // seal the new module's own leftover ports
  m.links.forEach((l, i) => { if (l === null) m.links[i] = { sealed: true }; });
  refreshLayout(station);
  return { ok: true, id: m.id };
}

// detach a module (and anything only reachable through it) then re-seal
function removeModule(station, id) {
  const G = station.graph;
  const m = G.modules.find(x => x.id === id);
  if (!m) return { ok: false, reason: 'Module not found' };
  if (MODULES[m.key].core) return { ok: false, reason: 'The control room is the root of the station' };
  if (m.locked) return { ok: false, reason: 'That module is structural and cannot be removed' };

  const neighbours = m.links.filter(l => l && !l.sealed).map(l => ({ id: l.id, port: l.port }));
  unlinkAll(G, id);
  G.modules = G.modules.filter(x => x.id !== id);
  neighbours.forEach(n => {
    const o = G.modules.find(x => x.id === n.id);
    if (!o) return;
    o.links[n.port] = null;
    if (!tryAttach(G, 'cap-plate', { mod: o, port: n.port, wp: worldPort(o, n.port) }, {}))
      o.links[n.port] = { sealed: true };
  });
  const orphans = repair(G, station.decks);
  refreshLayout(station);
  return { ok: true, orphansRemoved: Math.max(0, orphans - 1) };
}

// move an existing module to a different attach point
function moveModule(station, id, ap) {
  const G = station.graph;
  const m = G.modules.find(x => x.id === id);
  if (!m) return { ok: false, reason: 'Module not found' };
  if (MODULES[m.key].core) return { ok: false, reason: 'The control room cannot be moved' };
  if (m.locked) return { ok: false, reason: 'That module is structural and cannot be moved' };
  if (ap.modId === id) return { ok: false, reason: 'A module cannot attach to itself' };

  const snapshot = snapshotGraph(G);
  const key = m.key, wasOwned = m.owned;
  const rm = removeModule(station, id);
  if (!rm.ok) return rm;
  const host = station.graph.modules.find(x => x.id === ap.modId);
  if (!host) { restoreGraph(station.graph, snapshot); refreshLayout(station); return { ok: false, reason: 'Target no longer exists' }; }
  const res = placeModule(station, key, ap);
  if (!res.ok) { restoreGraph(station.graph, snapshot); refreshLayout(station); return res; }
  const moved = station.graph.modules.find(x => x.id === res.id);
  if (moved) moved.owned = wasOwned || true;
  refreshLayout(station);
  return { ok: true, id: res.id };
}

// rotate a module about its connected port (tries its other ports)
function cycleModulePort(station, id) {
  const G = station.graph;
  const m = G.modules.find(x => x.id === id);
  if (!m || MODULES[m.key].core || m.locked) return { ok: false, reason: 'That module cannot be reoriented' };
  const conn = m.links.map((l, i) => (l && !l.sealed ? { i, l } : null)).filter(Boolean);
  if (conn.length !== 1) return { ok: false, reason: 'Only modules on a single connection can be reoriented' };
  const def = MODULES[m.key];
  if (def.ports.length < 2) return { ok: false, reason: 'That module has only one connection point' };

  const host = G.modules.find(x => x.id === conn[0].l.id);
  const hostPort = conn[0].l.port;
  const wp = worldPort(host, hostPort);
  const snapshot = snapshotGraph(G);
  const start = conn[0].i;
  for (let k = 1; k <= def.ports.length; k++) {
    const ci = (start + k) % def.ports.length;
    const spec = solvePlacement(m.key, ci, wp, m.deck);
    const probe = { id: m.id, key: m.key, deck: m.deck, x: spec.x, z: spec.z, rot: spec.rot };
    if (collides(G.modules, probe, host.id)) continue;
    unlinkAll(G, m.id);
    m.x = spec.x; m.z = spec.z; m.rot = spec.rot;
    m.links = def.ports.map(() => null);
    host.links[hostPort] = null;
    linkPorts(G, host.id, hostPort, m.id, ci);
    m.links.forEach((l, i) => { if (l === null) m.links[i] = { sealed: true }; });
    const v = validate(G, station.decks);
    if (v.errors.some(e => e.code === 'overlap' || e.code === 'unreachable')) { restoreGraph(G, snapshot); continue; }
    refreshLayout(station);
    return { ok: true };
  }
  restoreGraph(G, snapshot);
  return { ok: false, reason: 'No other orientation fits in that space' };
}

function snapshotGraph(G) {
  return JSON.stringify({ modules: G.modules, links: G.links, nextId: G.nextId });
}
function restoreGraph(G, snap) {
  const s = JSON.parse(snap);
  G.modules = s.modules; G.links = s.links; G.nextId = s.nextId;
}

/**
 * Guarantee a station can be docked with.
 *
 * The generator grows docking arms opportunistically, which is right for a prototype and
 * wrong for a world: roll a habitat or a bastion and you can get a hundred-compartment
 * station with nowhere to put a ship. Rather than tax every archetype's room table, this
 * bolts arms onto free perimeter ports after the fact, walking attach points in graph
 * order so the result stays a pure function of the seed. Placement goes through the same
 * editor path a player build does, so an arm can never end up inside a wall.
 */
function ensureBerths(station, min) {
  const want = Math.max(1, min || 1);
  const count = () => station.modules.filter(m => m.key === 'dock-arm').length;
  if (count() >= want) return station;

  for (let deck = 0; deck < station.decks.length && count() < want; deck++) {
    for (const ap of attachPoints(station, deck)) {
      if (count() >= want) break;
      if (canPlace(station, 'dock-arm', ap) < 0) continue;
      const res = placeModule(station, 'dock-arm', ap);
      if (!res.ok) continue;
      // placeModule is the editor path, which flags what it builds as player-owned.
      // A berth the station was born with belongs to the station.
      const built = station.graph.modules.find(m => m.id === res.id);
      if (built) built.owned = false;
      refreshLayout(station);
    }
  }
  return station;
}

// ---- flat export ----
// Flat, engine-friendly: no nested graph, ports resolved to world
// space, docking arms and airlocks flagged for approach logic.

function exportLayout(station) {
  return {
    schema: 'station-forge/layout@2',
    id: station.seed,
    name: station.name,
    archetype: station.typeKey,
    faction: station.faction,
    stats: { population: station.population, power: station.power, defense: station.defense, tech: station.tech },
    deckHeight: station.deckHeight,
    radius: Math.round(station.bounds.r),
    decks: station.decks.map(d => ({ index: d.index, name: d.name, y: d.y })),
    modules: station.modules.map(m => ({
      id: m.id, key: m.key, name: m.name, kind: m.kind, category: m.cat,
      deck: m.deck, pos: [+m.x.toFixed(2), station.decks[m.deck].y, +m.z.toFixed(2)],
      rot: +m.rot.toFixed(4), size: [m.w, m.d], area: Math.round(m.area),
      crew: m.crew, pressurised: m.pressurised, owned: m.owned,
      dockable: m.key === 'dock-arm' || m.key === 'airlock',
      neighbours: m.links.filter(x => x != null)
    })),
    graph: station.modules.map(m => ({ id: m.id, to: m.links.filter(x => x != null) })),
    validation: { ok: station.validation.ok, errors: station.validation.errors.length }
  };
}

/**
 * The layout a given station in the world roster should have.
 *
 * The one seam world-gen will use, kept here so the call site does not have to know how a
 * seed string is built. Seeded from the world seed and the station's own name, so every
 * client generates the same station without anything crossing the wire, and so adding a
 * station to the roster cannot change the layout of the ones already in it — the same
 * property core/rng.js named streams were added for.
 *
 * Pass `seed` to override, which is what the tests do.
 */
function layoutForStation(st, type, opts) {
  const o = opts || {};
  return generateLayout({
    seed: o.seed || ('station|' + st.name + '|' + (worldSeed() >>> 0).toString(36)),
    type: o.type || type.forge || 'trade',
    size: o.size || type.forgeSize || 3,
    name: st.name,
    density: o.density,
    decay: o.decay,
    berths: o.berths
  });
}

// ── public surface ───────────────────────────────────────────────────
//
// What the rest of the game may import. The list is short on purpose: world-gen needs a
// layout and the palette that paints it, and nothing else.
export {
  generateLayout, layoutForStation, exportLayout,
  ARCHETYPES, CATS, MODULES, DECK_H, ROOM_H
};

// ── layout editing ───────────────────────────────────────────────────
//
// A first attempt at v1.01.99 moved these into a separate world/station-edit.js on the
// grounds that nothing in the game calls them. That was wrong, and the code said so
// immediately: `generateLayout` calls `ensureBerths`, which calls `attachPoints`,
// `canPlace`, `placeModule` and `refreshLayout`. They are not an unused editor — they are
// the placement machinery generation itself runs on, and a station is guaranteed its
// docking berths by the same path a player would extend one.
//
// So they stay here, and the honest statement is narrower: of the verbs below, the ones no
// caller can reach are `moveModule`, `removeModule`, `cycleModulePort`, `fittingKeys`,
// `snapshotGraph` and `restoreGraph` — the *player's* half. They are tracked in the BACKLOG
// of test/reachability.mjs rather than deleted, because they are what a player extending a
// station they own would need, and rebuilding them later from the generator's internals
// would be strictly harder than keeping them beside it.
//
// One thing to settle before any of them gets a door: an edited layout is no longer
// derivable from its seed, so it becomes save state and the schema moves.
export {
  refreshLayout, ensureBerths, attachPoints, canPlace, placeModule,
  moveModule, removeModule, cycleModulePort, fittingKeys,
  snapshotGraph, restoreGraph,
  validate, repair, worldPort, moduleRadius
};
