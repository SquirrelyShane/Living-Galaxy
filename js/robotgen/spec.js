// robotgen/src/spec.js — deterministic robotic NPC spec generator.
// Pure data: no THREE, no DOM. Safe to run in Node, a worker, or the page.
//
// Mass and cost are NOT guessed: once the spec is drawn, `data/bom.js` picks the
// unit out of the shared parts catalogue (the same one NEWSHIPGEN and STATIONGEN
// quote from) and the manifest's own mass becomes `spec.stats.massKg`. The old
// volume estimate survives as `stats.frameEstimateKg` — it is what sizes the
// parts (a heavy frame gets heavy legs), and the parts then weigh themselves.
import { robotBom } from './data/bom.js';

export const SPEC_VERSION = '1.7.0';

/* ---------- rng ---------- */
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function makeRng(seed) {
  const key = String(seed);
  const r = mulberry32(xmur3(key)());
  return {
    key,
    f: () => r(),
    range: (a, b) => a + (b - a) * r(),
    int: (a, b) => a + Math.floor((b - a + 1) * r()),
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    chance: (p) => r() < p,
    weighted: (table) => {
      const keys = Object.keys(table);
      let total = 0;
      for (const k of keys) total += table[k];
      let x = r() * total;
      for (const k of keys) { x -= table[k]; if (x <= 0) return k; }
      return keys[keys.length - 1];
    },
    some: (arr, n) => {                       // n distinct picks, order-stable
      const pool = arr.slice(), out = [];
      for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
      return out;
    },
    gauss: (mu, sd) => {
      const u = Math.max(1e-9, r()), v = r();
      return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
  };
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const r3 = (v) => Math.round(v * 1000) / 1000;

/* ---------- taxonomy ---------- */
export const LOCOMOTION = ['biped', 'quadruped', 'hexapod', 'octoped', 'tripod', 'tracked', 'wheeled', 'hover', 'rotor', 'plane'];
export const LEGGED = new Set(['biped', 'quadruped', 'hexapod', 'octoped', 'tripod']);
export const FLYING = new Set(['rotor', 'plane']);
export const HEAD_TYPES = ['dome', 'box', 'visor', 'cluster', 'insect', 'turret', 'periscope',
  'mandible', 'crown', 'skull', 'array', 'ball', 'wedge'];
export const TORSO_SHAPES = ['box', 'tapered', 'barrel', 'hexplate', 'segmented', 'cage', 'capsule', 'pod'];
export const INSIGNIA = ['none', 'ring', 'triangle', 'bars', 'chevrons'];
export const OPTIC_LAYOUTS = ['cyclops', 'stereo', 'triad', 'band', 'cluster'];
export const ANTENNA_TYPES = ['whip', 'twin', 'dish', 'blade', 'ring', 'stub'];
export const HANDS = ['gripper', 'claw', 'tool', 'manipulator', 'weapon', 'pad'];

/* --- attachments --- */
export const SHOULDER_MOUNTS = ['none', 'cannon', 'gatling', 'missiles', 'beam', 'mortar', 'grenade', 'smoke',
  'sensor', 'radar', 'shield', 'spotlight', 'dronebay', 'jammer', 'netgun', 'taser', 'grapple', 'toolarm', 'ammo', 'relay', 'hailer',
  'railgun', 'winch', 'floodlight', 'repairarm', 'flare'];
export const ARMOR_SLOTS = ['chest', 'back', 'pauldronL', 'pauldronR', 'thigh', 'shin', 'forearm', 'skirt', 'collar', 'flank', 'knee', 'spine'];
export const ARMOR_STYLES = ['plate', 'composite', 'ablative', 'riot', 'segmented', 'mesh', 'reactive', 'carapace', 'fieldemitter'];
export const LIMB_TYPES = ['stock', 'heavy', 'industrial', 'blade', 'drill', 'beamfist',
  'welder', 'saw', 'spray', 'vac', 'sampler', 'auger', 'medkit', 'tray', 'disruptor', 'winch',
  'harpoon', 'multitool', 'ram', 'shieldemitter'];
export const BACK_UNITS = ['none', 'jetpack', 'coolant', 'cargo', 'shieldGen', 'dronebay', 'hosecoil',
  'hopper', 'samples', 'solarwing', 'mast', 'tank', 'generator', 'radiator', 'chute',
  'powerspine', 'satdish', 'dronerack'];
export const CHEST_MODULES = ['none', 'winch', 'tooltray', 'screen', 'sirenbar', 'hatch', 'refill', 'cradle'];
export const HIP_MODULES = ['holster', 'pouch', 'rail', 'canister', 'coil'];
export const PAYLOADS = ['camera', 'mapping', 'thermal', 'relay', 'tank', 'cargo', 'munition', 'hailer',
  'chute', 'sampler', 'chem', 'rad', 'gpr', 'jammer', 'dronebay', 'spotlight'];
export const SIGHTS = ['none', 'reflex', 'scope', 'thermal', 'holo', 'painter'];
export const MUZZLES = ['none', 'brake', 'suppressor', 'flash', 'coil', 'plasma'];
export const MAGS = ['none', 'box', 'drum', 'cell', 'belt', 'hopper', 'coilpack'];
export const UNDERBARREL = ['none', 'grenade', 'grip', 'lamp', 'bayonet', 'shieldrail'];

export const PALETTES = {
  industrial: { base: '#c8a227', secondary: '#3b3b40', trim: '#1a1a1d', accent: '#ffb200', wear: 0.65 },
  military:   { base: '#4d5340', secondary: '#2b2f26', trim: '#15170f', accent: '#8fe36a', wear: 0.55 },
  security:   { base: '#23262b', secondary: '#3a3f47', trim: '#0e0f12', accent: '#ff3b30', wear: 0.30 },
  medical:    { base: '#e6ecef', secondary: '#b9c6cc', trim: '#5d6f77', accent: '#3ad1ff', wear: 0.12 },
  civic:      { base: '#dfe3e8', secondary: '#7b8794', trim: '#2f3640', accent: '#4d8cff', wear: 0.25 },
  rust:       { base: '#8a5a3b', secondary: '#5a4030', trim: '#2a1e18', accent: '#ff8a3d', wear: 0.92 },
  recon:      { base: '#2f3b45', secondary: '#55707d', trim: '#161d22', accent: '#a0ffe0', wear: 0.35 },
  chrome:     { base: '#b6bcc4', secondary: '#8a9099', trim: '#3c4148', accent: '#ffffff', wear: 0.10 },
  hazard:     { base: '#ff7a00', secondary: '#232323', trim: '#0f0f0f', accent: '#ffd400', wear: 0.50 },
  rescue:     { base: '#e03a2f', secondary: '#f2f2f0', trim: '#2a2a2c', accent: '#ffd400', wear: 0.28 },
  agri:       { base: '#5f8b3a', secondary: '#3b4a2c', trim: '#20281a', accent: '#d9f24d', wear: 0.60 },
  survey:     { base: '#f0e4c8', secondary: '#8d7f63', trim: '#3a3325', accent: '#00c2ff', wear: 0.40 },
  subsea:     { base: '#f6c12b', secondary: '#12333f', trim: '#08161c', accent: '#00e5ff', wear: 0.45 },
  stealth:    { base: '#1a1c20', secondary: '#25282e', trim: '#0a0b0d', accent: '#6f7cff', wear: 0.20 },
  void:       { base: '#14161c', secondary: '#20242e', trim: '#080a0e', accent: '#2ff5e0', wear: 0.20 },
  ceramic:    { base: '#efe7d8', secondary: '#cbbfa8', trim: '#6b6152', accent: '#ff8f4d', wear: 0.18 },
  verdigris:  { base: '#5f8f7d', secondary: '#8a6a3f', trim: '#243530', accent: '#ffd98a', wear: 0.70 },
  glacier:    { base: '#cfe3ee', secondary: '#7fa3b8', trim: '#25333d', accent: '#7fe3ff', wear: 0.22 },
  biolume:    { base: '#2b2340', secondary: '#4a3c68', trim: '#120e1c', accent: '#c46bff', wear: 0.28 },
  ferrite:    { base: '#6d6f74', secondary: '#494b50', trim: '#1d1e21', accent: '#ff6a2b', wear: 0.60 },
};

/* ---------- careers ----------
   Each role is a career path: what the unit is built for, what it is allowed to
   carry, and which chassis families the yard puts it on. `kit` is the career
   equipment pool the generator draws from — that is what makes a firefighter
   read as a firefighter rather than a repainted labourer. */
export const ROLES = {
  labor:       { label: 'Labor',        cls: 'ground', duty: 'lift and carry',            loco: { tracked: 4, biped: 3, wheeled: 3, quadruped: 1 , octoped: 0.5},                 size: [1.7, 2.9], arms: [2, 2], armor: [0, 1], weapon: 0.03, pal: ['industrial', 'hazard', 'rust', 'ferrite'],  kit: ['cargo', 'toolboard', 'winch'], kitN: [1, 2] },
  industrial:  { label: 'Industrial',   cls: 'heavy',  duty: 'shop floor and foundry',    loco: { tracked: 6, wheeled: 3, quadruped: 2, biped: 1 , octoped: 1.5},                 size: [2.1, 3.4], arms: [2, 4], armor: [1, 2], weapon: 0.05, pal: ['industrial', 'hazard', 'rust', 'ferrite'],  kit: ['toolboard', 'welder', 'drill', 'cargo'], kitN: [1, 3] },
  security:    { label: 'Security',     cls: 'ground', duty: 'patrol and control',        loco: { biped: 6, quadruped: 3, tracked: 1, hover: 1, wheeled: 1 },       size: [1.7, 2.6], arms: [2, 2], armor: [1, 3], weapon: 0.85, pal: ['security', 'military', 'void'],          kit: ['siren', 'recorder', 'hailer'], kitN: [1, 2] },
  war:         { label: 'Warframe',     cls: 'heavy',  duty: 'line combat',               loco: { biped: 6, quadruped: 3, hexapod: 2, tracked: 2 , octoped: 1},                 size: [2.2, 3.4], arms: [2, 4], armor: [2, 3], weapon: 1.00, pal: ['military', 'security', 'stealth', 'void', 'ferrite'], kit: ['datalink', 'radliner'], kitN: [0, 2] },
  scout:       { label: 'Scout',        cls: 'ground', duty: 'forward observation',       loco: { hover: 4, hexapod: 3, biped: 2, wheeled: 3, tripod: 2, rotor: 2 , octoped: 1}, size: [0.9, 1.6], arms: [0, 2], armor: [0, 1], weapon: 0.25, pal: ['recon', 'civic', 'chrome', 'stealth', 'glacier'], kit: ['camera', 'datalink', 'thermal'], kitN: [1, 2] },
  courier:     { label: 'Courier',      cls: 'ground', duty: 'last-mile delivery',        loco: { wheeled: 6, hover: 3, biped: 2, tracked: 1, rotor: 2 },           size: [1.1, 2.0], arms: [1, 2], armor: [0, 1], weapon: 0.02, pal: ['civic', 'chrome', 'hazard', 'ceramic'],     kit: ['cargo', 'display'], kitN: [1, 2] },
  medic:       { label: 'Medical',      cls: 'ground', duty: 'triage and transport',      loco: { wheeled: 4, hover: 3, biped: 3, tripod: 1 },                      size: [1.4, 2.2], arms: [2, 4], armor: [0, 1], weapon: 0.00, pal: ['medical', 'civic', 'rescue', 'ceramic', 'glacier'],    kit: ['medkit', 'display', 'stretcher'], kitN: [1, 3] },
  salvage:     { label: 'Salvage',      cls: 'ground', duty: 'strip and recover',         loco: { tracked: 5, hexapod: 3, quadruped: 2, wheeled: 2 , octoped: 2},               size: [1.6, 3.0], arms: [2, 4], armor: [0, 2], weapon: 0.15, pal: ['rust', 'industrial', 'verdigris', 'ferrite'],            kit: ['winch', 'saw', 'cargo', 'welder'], kitN: [1, 3] },
  service:     { label: 'Service',      cls: 'ground', duty: 'front of house',            loco: { wheeled: 5, biped: 3, tripod: 2, hover: 2 },                      size: [1.2, 1.9], arms: [2, 2], armor: [0, 0], weapon: 0.00, pal: ['civic', 'chrome', 'medical', 'ceramic'],    kit: ['tray', 'display', 'hailer'], kitN: [1, 2] },

  recon:       { label: 'Air Recon',    cls: 'air',    duty: 'eyes over the ridge',       loco: { rotor: 6, plane: 5, hover: 1 },                                   size: [0.5, 1.2], arms: [0, 0], armor: [0, 0], weapon: 0.10, pal: ['recon', 'stealth', 'military', 'void'],  kit: ['camera', 'datalink', 'thermal'], kitN: [2, 3] },
  survey:      { label: 'Survey',       cls: 'air',    duty: 'map and measure',           loco: { plane: 5, rotor: 5, wheeled: 2, hexapod: 1 , octoped: 3},                     size: [0.6, 1.4], arms: [0, 1], armor: [0, 0], weapon: 0.00, pal: ['survey', 'civic', 'recon', 'glacier', 'biolume'],      kit: ['mapping', 'lidar', 'gpr', 'sampler'], kitN: [2, 3] },
  inspector:   { label: 'Inspection',   cls: 'air',    duty: 'crawl the infrastructure',  loco: { rotor: 6, hover: 2, hexapod: 2, plane: 1 },                       size: [0.35, 0.9], arms: [0, 1], armor: [0, 0], weapon: 0.00, pal: ['civic', 'hazard', 'survey', 'ceramic'],    kit: ['camera', 'thermal', 'recorder'], kitN: [2, 3] },
  interceptor: { label: 'Interceptor',  cls: 'air',    duty: 'deny the airspace',         loco: { plane: 6, rotor: 3 },                                             size: [0.8, 1.8], arms: [0, 0], armor: [0, 1], weapon: 0.90, pal: ['military', 'stealth', 'security', 'void'], kit: ['datalink', 'thermal'], kitN: [1, 2] },
  carrier:     { label: 'Drone Carrier',cls: 'heavy',  duty: 'launch and recover a flight', loco: { tracked: 5, wheeled: 4, hexapod: 2, hover: 1 , octoped: 2},                 size: [2.0, 3.2], arms: [1, 2], armor: [1, 2], weapon: 0.35, pal: ['military', 'industrial', 'civic', 'void'], kit: ['dronebay', 'relay', 'datalink'], kitN: [2, 3] },

  mining:      { label: 'Mining',       cls: 'heavy',  duty: 'cut and haul rock',         loco: { tracked: 6, hexapod: 3, wheeled: 2, quadruped: 1 , octoped: 2.5},               size: [2.0, 3.4], arms: [2, 4], armor: [1, 2], weapon: 0.02, pal: ['industrial', 'rust', 'hazard', 'ferrite'],   kit: ['drill', 'auger', 'cargo', 'gpr'], kitN: [2, 3] },
  construction:{ label: 'Construction', cls: 'heavy',  duty: 'place and fix structure',   loco: { tracked: 5, wheeled: 3, quadruped: 2, biped: 2, octoped: 1 },                 size: [1.9, 3.2], arms: [2, 4], armor: [0, 2], weapon: 0.02, pal: ['hazard', 'industrial', 'civic', 'ferrite'],  kit: ['welder', 'winch', 'toolboard', 'forks'], kitN: [2, 3] },
  agri:        { label: 'Agricultural', cls: 'ground', duty: 'tend the rows',             loco: { wheeled: 5, hexapod: 3, tracked: 3, rotor: 2, quadruped: 1 , octoped: 1.5},     size: [1.2, 2.6], arms: [1, 2], armor: [0, 0], weapon: 0.00, pal: ['agri', 'industrial', 'hazard', 'verdigris'],   kit: ['hopper', 'spray', 'sampler', 'auger'], kitN: [2, 3] },
  firefighter: { label: 'Fire & Rescue',cls: 'heavy',  duty: 'push into the fire',        loco: { tracked: 5, wheeled: 3, quadruped: 2, hover: 1 },                 size: [1.8, 3.0], arms: [2, 2], armor: [2, 3], weapon: 0.00, pal: ['rescue', 'hazard', 'ceramic'],               kit: ['monitor', 'hose', 'thermal', 'stretcher'], kitN: [2, 3] },
  hazmat:      { label: 'Hazmat',       cls: 'ground', duty: 'contain and decontaminate', loco: { wheeled: 4, tracked: 4, quadruped: 2, biped: 2 , octoped: 1},                 size: [1.5, 2.4], arms: [2, 2], armor: [1, 2], weapon: 0.00, pal: ['hazard', 'medical', 'rescue', 'ceramic'],    kit: ['decon', 'chem', 'rad', 'seal'], kitN: [2, 4] },
  eod:         { label: 'EOD',          cls: 'ground', duty: 'render safe',               loco: { tracked: 6, wheeled: 3, hexapod: 2 , octoped: 1},                             size: [1.0, 2.0], arms: [1, 2], armor: [1, 3], weapon: 0.20, pal: ['security', 'hazard', 'military', 'void'], kit: ['disruptor', 'xray', 'camera', 'recorder'], kitN: [2, 4] },
  sentry:      { label: 'Sentry',       cls: 'ground', duty: 'hold one position',         loco: { tripod: 5, tracked: 2, hexapod: 2, wheeled: 1 , octoped: 2},                  size: [1.4, 2.6], arms: [0, 2], armor: [2, 3], weapon: 0.95, pal: ['security', 'military', 'stealth', 'void'], kit: ['radar', 'datalink', 'recorder'], kitN: [1, 2] },
  marksman:    { label: 'Marksman',     cls: 'ground', duty: 'precision overwatch',       loco: { biped: 5, quadruped: 3, tripod: 2, hexapod: 1 },                  size: [1.6, 2.4], arms: [2, 2], armor: [1, 2], weapon: 1.00, pal: ['stealth', 'military', 'recon', 'void'],   kit: ['thermal', 'datalink'], kitN: [1, 2] },
  comms:       { label: 'Signals',      cls: 'ground', duty: 'keep the link up',          loco: { wheeled: 4, tracked: 3, hexapod: 2, biped: 2, rotor: 1 },         size: [1.3, 2.4], arms: [1, 2], armor: [0, 1], weapon: 0.05, pal: ['military', 'civic', 'recon', 'glacier'],    kit: ['relay', 'dish', 'datalink'], kitN: [2, 3] },
  science:     { label: 'Field Science',cls: 'ground', duty: 'sample and analyse',        loco: { hexapod: 4, wheeled: 4, quadruped: 2, tripod: 2, rotor: 1 , octoped: 2},      size: [1.0, 2.0], arms: [2, 4], armor: [0, 1], weapon: 0.00, pal: ['survey', 'medical', 'civic', 'glacier', 'biolume'],    kit: ['sampler', 'spectro', 'samples', 'chem'], kitN: [2, 4] },
  diver:       { label: 'Subsea',       cls: 'ground', duty: 'work under the surface',    loco: { hover: 5, hexapod: 3, tracked: 2, quadruped: 1 , octoped: 2},                 size: [1.2, 2.4], arms: [2, 4], armor: [1, 2], weapon: 0.02, pal: ['subsea', 'rescue', 'industrial', 'verdigris', 'glacier'], kit: ['sonar', 'seal', 'winch', 'camera'], kitN: [2, 4] },
  loader:      { label: 'Cargo Loader', cls: 'heavy',  duty: 'move the pallet',           loco: { wheeled: 5, tracked: 4, quadruped: 1 },                           size: [2.0, 3.4], arms: [2, 2], armor: [0, 1], weapon: 0.00, pal: ['industrial', 'hazard', 'civic', 'ferrite'],  kit: ['forks', 'cargo', 'winch'], kitN: [2, 3] },
  utility:     { label: 'Maintenance',  cls: 'ground', duty: 'fix what broke',            loco: { wheeled: 4, biped: 3, hexapod: 3, tracked: 2, rotor: 1 },         size: [1.2, 2.2], arms: [2, 4], armor: [0, 1], weapon: 0.00, pal: ['civic', 'industrial', 'hazard', 'ferrite'],  kit: ['toolboard', 'welder', 'camera', 'winch'], kitN: [2, 3] },
  rescue:      { label: 'Search & Rescue', cls: 'ground', duty: 'find and extract',       loco: { quadruped: 4, tracked: 3, hexapod: 2, rotor: 2, wheeled: 2 , octoped: 1.5},     size: [1.3, 2.6], arms: [2, 2], armor: [1, 2], weapon: 0.00, pal: ['rescue', 'hazard', 'medical', 'ceramic'],    kit: ['thermal', 'stretcher', 'winch', 'hailer'], kitN: [2, 3] },
  drone:       { label: 'Drone',        cls: 'micro',  duty: 'go where a body cannot', loco: { hover: 6, rotor: 5, tripod: 1, wheeled: 1 },                      size: [0.5, 1.3], arms: [0, 2], armor: [0, 1], weapon: 0.20, pal: ['void', 'recon', 'chrome', 'biolume', 'stealth'], kit: ['camera', 'thermal', 'relay', 'recorder'], kitN: [1, 3] },
  companion:   { label: 'Companion',    cls: 'ground', duty: 'keep people company',       loco: { biped: 4, wheeled: 4, tripod: 2, hover: 1 },                      size: [0.8, 1.7], arms: [2, 2], armor: [0, 0], weapon: 0.00, pal: ['civic', 'chrome', 'medical', 'ceramic'],    kit: ['display', 'hailer'], kitN: [1, 2] },
};
export const ROLE_KEYS = Object.keys(ROLES);
export const CAREER_CLASSES = { ground: 'Ground unit', heavy: 'Heavy frame', air: 'Air unit', micro: 'Micro unit' };

const PREFIX = ['KV', 'MX', 'TR', 'AD', 'ZN', 'HB', 'QL', 'SV', 'NR', 'DX', 'PB', 'GK', 'OM', 'VT', 'AE', 'CR', 'JT', 'WF'];
const NICK_A = ['Rust', 'Cinder', 'Bolt', 'Grim', 'Hollow', 'Pale', 'Iron', 'Quiet', 'Long', 'Half', 'Dead', 'Old', 'Blue', 'Slack', 'Broad', 'Thin', 'Bright', 'Low'];
const NICK_B = ['jack', 'hand', 'wire', 'foot', 'eye', 'gear', 'shard', 'step', 'ratchet', 'spool', 'lamp', 'pin', 'clamp', 'drum', 'vane', 'kite', 'wing', 'lark'];

/* blend a weight table with a bias map — the draw COUNT never changes, so a
   world only shifts the odds, it does not desynchronise a seed */
export function bias(table, mults) {
  if (!mults) return table;
  const out = {};
  for (const k of Object.keys(table)) out[k] = table[k] * (mults[k] === undefined ? 1 : mults[k]);
  let any = false;
  for (const k of Object.keys(out)) if (out[k] > 0) any = true;
  return any ? out : table;
}

/* ---------- generation ---------- */
export function generateRobot(seed, opts = {}) {
  const rng = makeRng(seed);
  const W = opts.world || null;          // see src/world.js

  const role = opts.role && ROLES[opts.role] ? opts.role : rng.weighted(
    ROLE_KEYS.reduce((o, k) => (o[k] = 1, o), {})
  );
  const R = ROLES[role];

  let loco = opts.locomotion && LOCOMOTION.includes(opts.locomotion)
    ? opts.locomotion : rng.weighted(bias(R.loco, W && W.loco));
  // a rotor or a wing needs air. On a vacuum world the bias zeroes both, and an
  // air career whose whole table zeroed out would otherwise fall back to it —
  // so the frame is rebuilt on the world's own substitute drive instead.
  if (W && W.loco && FLYING.has(loco) && !W.loco[loco]) loco = W.noAirDrive || 'hover';
  const flying = FLYING.has(loco);

  // an airframe is small even when the career normally is not
  const sizeK = W && W.sizeScale ? W.sizeScale : 1;
  const sizeLo = (flying ? Math.min(R.size[0], 1.0) : R.size[0]) * sizeK;
  const sizeHi = (flying ? Math.min(R.size[1], 1.8) : R.size[1]) * sizeK;
  const height = r3(clamp(rng.range(sizeLo, sizeHi), 0.3, 4.4));
  const palPool = W && W.palettes && W.palettes.length ? W.palettes : R.pal;
  const palName = opts.palette && PALETTES[opts.palette] ? opts.palette : rng.pick(palPool);
  const P = PALETTES[palName];
  const wear = r3(clamp(P.wear * rng.range(0.6, 1.25), 0, 1));

  const wheeledFamily = (loco === 'tracked' || loco === 'wheeled' || loco === 'hover');
  const bulk = flying ? rng.range(0.7, 0.95) : wheeledFamily ? rng.range(1.15, 1.55) : rng.range(0.85, 1.1);

  /* torso — on a flyer this is the fuselage / airframe pod */
  const torsoShape = opts.torso && TORSO_SHAPES.includes(opts.torso) ? opts.torso : rng.weighted(bias(
    flying ? { pod: 4, tapered: 3, box: 2, barrel: 2, hexplate: 1, capsule: 2 }
      : wheeledFamily ? { barrel: 3, hexplate: 3, box: 3, tapered: 1, segmented: 2, capsule: 2, cage: 1 }
      : { box: 3, tapered: 3, barrel: 2, hexplate: 2, segmented: 2, capsule: 1.5, cage: 1.5 },
    W && W.torso));
  const torsoH = r3(height * (flying ? rng.range(0.24, 0.34) : wheeledFamily ? rng.range(0.34, 0.46) : rng.range(0.28, 0.36)));
  const torsoW = r3(torsoH * rng.range(0.75, 1.15) * bulk);
  const torsoD = r3(torsoW * (loco === 'plane' ? rng.range(1.8, 3.0) : rng.range(0.55, 0.85)));
  const armorTier = flying ? Math.min(1, rng.int(R.armor[0], R.armor[1])) : rng.int(R.armor[0], R.armor[1]);

  const torso = {
    shape: torsoShape,
    width: torsoW, depth: torsoD, height: torsoH,
    armorTier,
    chestPlate: !flying && (armorTier > 0 || rng.chance(0.6)),
    coreLamp: rng.chance(0.72),
    coreShape: rng.pick(['disc', 'slot', 'cross']),
    vents: flying ? rng.int(0, 2) : rng.int(0, 4),
    ribs: rng.int(0, 3),
    shoulderYoke: !flying && (!wheeledFamily || rng.chance(0.4)),
    backpack: flying ? 'none' : rng.weighted({ none: 3, tank: 3, rack: 2, reactor: 2, drum: 1 }),
    hipSkirt: LEGGED.has(loco) && rng.chance(0.45),
    sealed: W ? !!W.sealed : rng.chance(0.25),
    decal: rng.chance(0.55) ? rng.pick(['stripe', 'chevron', 'block', 'number', 'roundel']) : 'none'
  };

  /* head */
  const headType = opts.head && HEAD_TYPES.includes(opts.head) ? opts.head : rng.weighted(bias(
    flying
      ? { ball: 4, wedge: 3, dome: 2, cluster: 2, box: 1, turret: 1, visor: 1, insect: 1, periscope: 0.5, array: 2 }
      : wheeledFamily
      ? { turret: 3, periscope: 3, dome: 2, box: 2, cluster: 2, visor: 1, insect: 1, ball: 1, wedge: 1, array: 2, crown: 1.5, skull: 1, mandible: 1 }
      : { dome: 3, box: 3, visor: 3, cluster: 2, insect: 2, turret: 1, periscope: 1, ball: 1, wedge: 1, mandible: 2, crown: 2, skull: 1.5, array: 1.5 },
    W && W.head));
  const headSize = r3(torsoH * rng.range(0.36, 0.6));
  const opticCount = rng.weighted({ 1: 4, 2: 6, 3: 2, 4: 2, 5: 1 }) | 0;
  const layout = opticCount === 1 ? 'cyclops'
    : opticCount === 2 ? (rng.chance(0.2) ? 'band' : 'stereo')
    : opticCount === 3 ? (rng.chance(0.5) ? 'triad' : 'cluster')
    : rng.pick(['cluster', 'band']);

  const head = {
    type: headType,
    size: headSize,
    neck: {
      type: headType === 'periscope' ? 'stalk' : flying ? rng.weighted({ none: 4, ball: 2 }) : rng.weighted({ ball: 4, stalk: 2, none: 1 }),
      length: r3(headSize * rng.range(0.15, 0.85))
    },
    optics: {
      count: opticCount,
      layout,
      radius: r3(headSize * rng.range(0.10, 0.22)),
      color: rng.weighted({ '#ff3b30': 3, '#3ad1ff': 4, '#8fe36a': 3, '#ffb200': 2, '#ffffff': 2, '#c46bff': 1 }),
      shutter: rng.chance(0.35),
      scanBar: rng.chance(0.4),
      sweep: r3(rng.range(0.2, 1.0))
    },
    antenna: {
      type: rng.weighted({ whip: 4, twin: 2, dish: 2, blade: 2, ring: 1, stub: 2 }),
      length: r3(headSize * rng.range(0.6, 2.2)),
      mount: rng.pick(['top', 'left', 'right', 'back']),
      beacon: rng.chance(0.5),
      beaconColor: rng.weighted({ '#ff3b30': 3, '#ffb200': 2, '#4d8cff': 2, '#8fe36a': 1 })
    },
    grill: rng.chance(0.5),
    earPods: rng.chance(0.45),
    crest: rng.chance(0.3),
    modules: {
      lamp: rng.chance(role === 'utility' || role === 'mining' || role === 'rescue' ? 0.8 : 0.3),
      thermalPod: rng.chance(role === 'firefighter' || role === 'rescue' || role === 'marksman' ? 0.75 : 0.2),
      scannerRing: rng.chance(role === 'survey' || role === 'science' || role === 'inspector' ? 0.7 : 0.15),
      dustCover: rng.chance(role === 'mining' || role === 'agri' || role === 'hazmat' ? 0.55 : 0.12)
    }
  };

  /* arms */
  let armCount = flying ? (rng.chance(0.15) ? 1 : 0) : rng.int(R.arms[0], R.arms[1]);
  if (armCount === 3) armCount = 2;
  const armLen = r3(height * rng.range(0.28, 0.42));
  const arms = {
    count: armCount,
    length: armLen,
    thickness: r3(torsoW * rng.range(0.13, 0.22)),
    segments: rng.weighted({ 2: 6, 3: 2 }) | 0,
    mount: rng.pick(['shoulder', 'side', 'high']),
    hand: armCount ? rng.weighted(
      role === 'medic' || role === 'science' ? { manipulator: 4, tool: 3, gripper: 3, pad: 1 }
        : role === 'war' || role === 'security' || role === 'marksman' ? { weapon: 4, claw: 3, gripper: 2, tool: 1 }
        : role === 'service' || role === 'companion' ? { pad: 3, manipulator: 3, gripper: 3 }
        : { gripper: 4, claw: 2, tool: 3, manipulator: 2, pad: 1 }
    ) : 'pad',
    piston: rng.chance(0.6)
  };
  const hasWeapon = arms.count > 0 && rng.f() < R.weapon;
  arms.weapon = hasWeapon ? {
    type: rng.weighted({ barrel: 4, launcher: 2, emitter: 2, cutter: 2 }),
    side: rng.pick(['left', 'right']),
    length: r3(armLen * rng.range(0.4, 0.8))
  } : null;

  /* locomotion */
  const L = { type: loco };
  if (LEGGED.has(loco)) {
    L.legs = loco === 'biped' ? 2 : loco === 'tripod' ? 3 : loco === 'quadruped' ? 4
      : loco === 'octoped' ? 8 : 6;
    L.legLength = r3(height * (loco === 'biped' ? rng.range(0.40, 0.52) : rng.range(0.26, 0.40)));
    L.thickness = r3(torsoW * rng.range(0.10, 0.18));
    L.rows = loco === 'octoped' ? 4 : loco === 'hexapod' ? 3 : 2;
    L.style = loco === 'biped'
      ? rng.weighted({ digitigrade: 3, straight: 3, piston: 2 })
      : rng.weighted({ digitigrade: 4, splayed: 3, piston: 1 });
    L.footType = rng.weighted({ flat: 4, claw: 2, pad: 2, hoof: 1 });
    L.splay = r3(rng.range(0.15, 0.55));
    L.hipWidth = r3(torsoW * rng.range(0.45, 0.85));
  } else if (loco === 'tracked') {
    L.tracks = rng.chance(0.12) ? 4 : 2;
    L.length = r3(torsoW * rng.range(1.5, 2.2));
    L.height = r3(height * rng.range(0.20, 0.32));
    L.width = r3(torsoW * rng.range(0.28, 0.42));
    L.roadWheels = rng.int(3, 6);
    L.skirt = rng.chance(0.5);
    L.grouser = rng.int(10, 20);
  } else if (loco === 'wheeled') {
    L.wheels = rng.weighted({ 2: 4, 3: 2, 4: 4, 6: 1 }) | 0;
    L.radius = r3(height * rng.range(0.10, 0.20));
    L.width = r3(torsoW * rng.range(0.16, 0.30));
    L.suspension = rng.weighted({ strut: 3, arm: 3, fork: 2 });
    L.gyro = L.wheels <= 2;
    L.spokes = rng.int(0, 6);
    L.hubLamp = rng.chance(0.4);
  } else if (loco === 'hover') {
    L.skirt = rng.weighted({ ring: 3, plate: 2, none: 1 });
    L.thrusters = rng.weighted({ 3: 2, 4: 4, 6: 2 }) | 0;
    L.hoverHeight = r3(height * rng.range(0.10, 0.22));
    L.plumeColor = rng.weighted({ '#4d8cff': 4, '#a0ffe0': 2, '#ffb200': 2, '#c46bff': 1 });
    L.fins = rng.chance(0.5);
  } else if (loco === 'rotor') {
    /* multirotor scout: booms out of the pod, rotors on top of them */
    L.rotors = rng.weighted({ 3: 1, 4: 6, 6: 2, 8: 1 }) | 0;
    L.ducted = rng.chance(0.4);
    L.coaxial = L.rotors <= 4 && rng.chance(0.25);
    L.tilt = rng.chance(0.22);
    L.rotorRadius = r3(height * rng.range(0.16, 0.30));
    L.boom = r3(height * rng.range(0.34, 0.60));
    L.boomRake = r3(rng.range(-0.12, 0.22));
    L.gear = rng.weighted({ skid: 4, legs: 2, none: 2 });
    L.gearDrop = r3(height * rng.range(0.10, 0.22));
    L.flightHeight = r3(height * rng.range(0.30, 0.75));
    L.navLights = rng.chance(0.8);
    L.plumeColor = rng.weighted({ '#4d8cff': 3, '#a0ffe0': 3, '#ffb200': 2 });
    L.foldable = rng.chance(0.35);
    L.guard = L.ducted ? false : rng.chance(0.3);
  } else if (loco === 'plane') {
    /* small fixed-wing scout: a fuselage, a wing, a tail and one or two motors */
    L.wing = rng.weighted({ straight: 3, swept: 3, delta: 2, blended: 2, canard: 1 });
    L.span = r3(height * rng.range(1.7, 3.2));
    L.chord = r3(torsoD * rng.range(0.28, 0.48));
    L.dihedral = r3(rng.range(0.0, 0.16));
    L.propulsion = rng.weighted({ prop: 4, ducted: 2, jet: 1.2 });
    L.motors = rng.weighted({ 1: 5, 2: 3 }) | 0;
    L.pusher = rng.chance(0.45);
    L.tail = rng.weighted({ conventional: 3, v: 3, twin: 2, none: 1 });
    L.vtol = rng.chance(0.35);
    L.liftRotors = L.vtol ? (rng.chance(0.3) ? 2 : 4) : 0;
    L.ducted = L.propulsion === 'ducted';
    L.gear = rng.weighted({ skid: 3, tricycle: 2, none: 3 });
    L.gearDrop = r3(height * rng.range(0.12, 0.26));
    L.surfaces = 4 + (L.tail === 'twin' ? 2 : 0) + (L.wing === 'canard' ? 2 : 0);
    L.chute = rng.chance(0.4);
    L.flightHeight = r3(height * rng.range(0.35, 0.8));
    L.navLights = rng.chance(0.85);
    L.plumeColor = rng.weighted({ '#4d8cff': 3, '#ffb200': 3, '#ff6a2b': 2 });
    L.winglets = rng.chance(0.5);
    L.sensorBall = rng.chance(0.6);
  }

  /* career kit — drawn before the derived stats so mass can include it */
  const kitN = R.kitN ? rng.int(R.kitN[0], Math.min(R.kitN[1], R.kit.length)) : 1;
  const kit = rng.some(R.kit, kitN);

  /* derived stats (no rng past this point except designation) */
  const volume = torsoW * torsoD * torsoH * (1 + armorTier * 0.18);
  const legMass = LEGGED.has(loco) ? L.legs * L.legLength * L.thickness * 900 : 0;
  const driveMass = loco === 'tracked' ? L.length * L.height * L.width * 2400
    : loco === 'wheeled' ? L.wheels * L.radius * L.radius * L.width * 3000
    : loco === 'hover' ? 40 * L.thrusters
    : loco === 'rotor' ? L.rotors * (2.0 + L.rotorRadius * 6)
    : loco === 'plane' ? L.span * L.chord * 14 + L.motors * (L.propulsion === 'jet' ? 8 : 2.5) + (L.liftRotors || 0) * 2.2
    : 0;
  const density = flying ? 380 : 1600;
  const massKg = Math.max(1, Math.round(volume * density + legMass + driveMass + arms.count * armLen * 55 + head.size * 40 + kit.length * (flying ? 1.2 : 6)));
  const topSpeed = r3(({ biped: 2.2, quadruped: 3.4, hexapod: 2.6, octoped: 2.4, tripod: 1.6, tracked: 1.9, wheeled: 5.6, hover: 6.4, rotor: 14.0, plane: 32.0 }[loco])
    * (1.25 - armorTier * 0.12) * (1 + (height - (flying ? 1.0 : 2.0)) * (flying ? -0.12 : 0.08)));

  const spec = {
    version: SPEC_VERSION,
    seed: String(seed),
    role, roleLabel: R.label,
    career: { path: role, label: R.label, duty: R.duty, cls: R.cls, className: CAREER_CLASSES[R.cls], tier: 1 + armorTier },
    designation: `${PREFIX[Math.floor(rng.f() * PREFIX.length)]}-${rng.int(10, 99)}${rng.chance(0.4) ? String.fromCharCode(65 + rng.int(0, 25)) : ''}`,
    nickname: `${rng.pick(NICK_A)}${rng.pick(NICK_B)}`,
    height,
    flying,
    kit,
    palette: {
      name: palName,
      base: P.base, secondary: P.secondary, trim: P.trim, accent: P.accent,
      wear, metalness: r3(clamp(0.85 - wear * 0.5, 0.05, 0.95)), roughness: r3(clamp(0.25 + wear * 0.6, 0.1, 0.98))
    },
    torso, head, arms,
    locomotion: L,
    stats: {
      massKg,
      topSpeedMs: Math.max(0.4, topSpeed),
      powerKw: r3(massKg * 0.012 + head.optics.count * 0.4 + arms.count * 1.2 + (flying ? massKg * 0.09 : 0)),
      sensorRangeM: Math.round(30 + head.optics.count * 22 + head.optics.radius * 400 + (head.antenna.type === 'dish' ? 120 : 0) + (flying ? 260 : 0)),
      armor: armorTier,
      durability: Math.round(60 + armorTier * 45 + massKg * 0.02),
      enduranceMin: Math.round(flying ? 18 + massKg * 0.6 : 90 + massKg * 0.4)
    },
    // hooks for NPC_Avatar / dialogue layers
    behavior: {
      aggression: r3(clamp((R.weapon * 0.6) + rng.range(-0.15, 0.35), 0, 1)),
      curiosity: r3(rng.range(0.05, 0.95)),
      chatter: r3(rng.range(0.05, 0.95)),
      discipline: r3(rng.range(0.05, 0.95)),
      voiceHz: Math.round(70 + (1 / Math.max(0.4, height)) * 180 + rng.range(-20, 20))
    }
  };
  spec.world = opts.world ? (opts.world.key || 'custom') : null;
  spec.attachments = genAttachments(rng, spec, W);
  spec.finish = genFinish(rng, spec);
  applyPartsMass(spec);
  return spec;
}

/* Re-weigh the unit from the parts manifest. No rng here: same spec in, same
   numbers out, and the sheet, the physics and the yard all agree. */
export function applyPartsMass(spec) {
  let bom;
  try { bom = robotBom(spec); } catch (e) { spec.stats.bomError = e.message; return spec; }
  const S = spec.stats;
  S.frameEstimateKg = S.massKg;
  S.massKg = Math.max(1, Math.round(bom.massKg));
  S.costCr = bom.cr;
  S.partCount = bom.partCount;
  S.partKinds = bom.partKinds;
  S.drawKw = r3(Math.abs(Math.min(0, bom.pwrW)) / 1000);
  S.heatKw = r3(Math.max(0, bom.heatW) / 1000);
  S.powerKw = r3(Math.max(S.drawKw, S.massKg * 0.012 + spec.head.optics.count * 0.4 + spec.arms.count * 1.2));
  S.durability = Math.round(60 + S.armor * 45 + S.massKg * 0.02);
  // endurance is the pack the manifest actually carries divided by the draw the
  // manifest actually pulls, at 85% usable — not a number picked to sound right
  S.energyKwh = bom.energyKwh;
  const gen = Math.max(0, bom.pwrW) / 1000;                    // fuel cell / solar / isotope
  // a wing or an isotope trickle can stretch a shift, but nothing on a flyer
  // pays for its own rotors: the net draw never falls below a third of the load
  const floor = Math.max(0.02, spec.flying ? S.drawKw * 0.35 : 0);
  const net = Math.max(floor, S.drawKw - gen);
  S.enduranceMin = Math.max(4, Math.round((bom.energyKwh * 0.85 / net) * 60 * (spec.flying ? 1 : 1.6)));
  return spec;
}

/* ---------- attachments ----------
   Drawn after the base spec so an existing seed keeps the robot it had. */
function biasTable(table, mults) {
  if (!mults) return table;
  const out = {};
  for (const k of Object.keys(table)) out[k] = table[k] * (mults[k] === undefined ? 1 : mults[k]);
  return out;
}
function genAttachments(rng, spec, W) {
  const role = spec.role, tier = spec.stats.armor;
  const combat = role === 'war' || role === 'security' || role === 'sentry' || role === 'marksman' || role === 'interceptor';
  const worker = role === 'labor' || role === 'industrial' || role === 'salvage' || role === 'mining'
    || role === 'construction' || role === 'loader' || role === 'utility';
  const responder = role === 'firefighter' || role === 'rescue' || role === 'medic' || role === 'hazmat' || role === 'eod';
  const accent = spec.palette.accent;

  /* --- flying units carry pods, not shoulder cannon --- */
  if (spec.flying) {
    const pool = {
      camera: role === 'recon' || role === 'inspector' ? 5 : 2,
      mapping: role === 'survey' ? 5 : 1,
      thermal: role === 'recon' || role === 'rescue' || role === 'inspector' ? 3 : 1,
      relay: role === 'comms' ? 5 : 1,
      tank: role === 'agri' ? 4 : 0.3,
      cargo: role === 'courier' ? 5 : 0.5,
      munition: combat ? 4 : 0.15,
      hailer: role === 'security' || role === 'rescue' ? 2 : 0.4,
      chute: 1.5,
      sampler: role === 'science' || role === 'survey' ? 2 : 0.3,
      chem: role === 'hazmat' ? 3 : 0.3,
      rad: role === 'hazmat' ? 2 : 0.2,
      gpr: role === 'survey' ? 1.5 : 0.2,
      jammer: role === 'interceptor' ? 2 : 0.2,
      dronebay: role === 'carrier' ? 3 : 0.15,
      spotlight: role === 'rescue' || role === 'security' ? 2 : 0.5,
    };
    const pool2 = biasTable(pool, W && W.payload);
    for (const k of Object.keys(pool2)) pool[k] = pool2[k];
    const want = rng.int(1, 3);
    const chosen = [];
    for (let i = 0; i < want; i++) {
      const t = rng.weighted(pool);
      if (chosen.some(p => p.type === t)) continue;
      chosen.push({
        type: t,
        size: r3(rng.range(0.8, 1.25)),
        station: chosen.length === 0 ? 'belly' : rng.pick(['wingL', 'wingR', 'belly', 'dorsal']),
        color: rng.chance(0.6) ? accent : '#ff6a2b',
        tubes: t === 'munition' ? rng.int(2, 4) : 0
      });
      pool[t] = 0;
    }
    // wing stores come in pairs on a plane that has wings to hang them from
    if (spec.locomotion.type === 'plane') {
      for (const p of chosen.slice()) {
        if (p.station === 'wingL' && rng.chance(0.7)) chosen.push({ ...p, station: 'wingR' });
        else if (p.station === 'wingR' && rng.chance(0.7)) chosen.push({ ...p, station: 'wingL' });
      }
    }
    const airArmed = spec.arms.count > 0 && (spec.arms.weapon || spec.arms.hand === 'weapon');
    return {
      shoulder: { L: null, R: null },
      armor: tier ? [{ slot: 'chest', style: 'composite', thickness: r3(rng.range(0.015, 0.03)), stripe: rng.chance(0.4) }] : [],
      weaponMods: !airArmed ? null : {
        sight: rng.weighted({ none: 1, reflex: 2, scope: 2, thermal: 3 }),
        laser: rng.chance(0.6),
        laserColor: rng.weighted({ '#ff3b30': 3, '#8fe36a': 2, '#3ad1ff': 2 }),
        muzzle: rng.weighted({ none: 3, brake: 2, suppressor: 1, flash: 1 }),
        magazine: rng.weighted({ none: 2, box: 2, cell: 3, drum: 1, belt: 1 }),
        underbarrel: rng.weighted({ none: 5, lamp: 2, grip: 1, grenade: 0.6 })
      },
      limbs: { L: 'stock', R: 'stock' },
      back: 'none',
      chest: 'none',
      hip: [],
      payload: chosen,
      hazardLights: rng.chance(0.5),
      worklamps: chosen.some(p => p.type === 'spotlight'),
      liveryStripe: rng.chance(0.5)
    };
  }

  /* --- ground / heavy frames --- */
  const survey = role === 'survey' || role === 'scout' || role === 'recon' || role === 'inspector' || role === 'drone';
  const pickShoulder = () => rng.weighted(biasTable({
    none: combat ? 2 : 6,
    cannon: combat ? 3.5 : 0.4,
    gatling: combat ? 2 : 0.2,
    missiles: combat ? 2.5 : 0.3,
    beam: combat ? 2 : 0.4,
    mortar: role === 'war' || role === 'sentry' ? 1.5 : 0.15,
    grenade: combat ? 1.5 : 0.2,
    smoke: combat ? 2 : 0.5,
    sensor: role === 'scout' || role === 'medic' || role === 'science' || role === 'survey' ? 3 : 1.0,
    radar: role === 'sentry' || role === 'comms' || role === 'carrier' ? 2.5 : 0.4,
    shield: role === 'security' || role === 'eod' ? 2 : worker ? 1 : 0.4,
    spotlight: responder || role === 'utility' ? 2.5 : 0.6,
    dronebay: role === 'carrier' ? 4 : 0.3,
    jammer: role === 'war' || role === 'comms' ? 1.2 : 0.15,
    netgun: role === 'security' ? 1.5 : 0.2,
    taser: role === 'security' ? 1.5 : 0.15,
    grapple: role === 'rescue' || role === 'salvage' ? 2 : 0.3,
    toolarm: worker || role === 'utility' ? 2.5 : 0.3,
    ammo: combat ? 1.5 : 0.1,
    relay: role === 'comms' ? 3 : 0.3,
    hailer: role === 'security' || role === 'rescue' || role === 'service' ? 1.5 : 0.3,
    railgun: combat ? 2.5 : 0.3,
    winch: worker ? 2.5 : 0.4,
    floodlight: worker || survey || responder ? 2 : 0.7,
    repairarm: worker || role === 'medic' || role === 'utility' ? 2.5 : 0.4,
    flare: survey || responder ? 1.5 : 0.8,
  }, W && W.shoulder));
  const mount = (type) => type === 'none' ? null : {
    type,
    size: r3(rng.range(0.8, 1.25)),
    color: rng.chance(0.6) ? accent : '#ff6a2b',
    tubes: type === 'missiles' ? rng.int(4, 8) : type === 'smoke' ? rng.int(3, 5) : type === 'mortar' ? rng.int(1, 2) : 0,
    tracking: rng.chance(0.7)
  };
  const shoulder = { L: mount(pickShoulder()), R: mount(pickShoulder()) };
  if (shoulder.L && shoulder.R && rng.chance(0.45)) shoulder.R = null;   // asymmetry reads better

  // additive armor: more panels the higher the tier, plus a wildcard or two
  const panels = [];
  const wanted = Math.min(9, tier * 2 + rng.int(0, 3) + (W && W.extraArmor ? W.extraArmor : 0));
  const pool = ARMOR_SLOTS.slice();
  const style = rng.weighted(biasTable({
    plate: 4, composite: 3, ablative: responder ? 3 : 2,
    riot: role === 'security' || role === 'eod' ? 3 : 1,
    segmented: worker ? 2 : 1, mesh: role === 'scout' || role === 'utility' ? 1.5 : 0.6,
    reactive: combat ? 3 : 0.6, carapace: 2, fieldemitter: combat || survey ? 1.5 : 0.5
  }, W && W.armorStyle));
  for (let i = 0; i < wanted && pool.length; i++) {
    const slot = pool.splice(Math.floor(rng.f() * pool.length), 1)[0];
    panels.push({ slot, style, thickness: r3(rng.range(0.02, 0.05)), stripe: rng.chance(0.4) });
  }

  const armed = spec.arms.count > 0 && (spec.arms.weapon || spec.arms.hand === 'weapon');
  const weaponMods = !armed ? null : {
    sight: rng.weighted({ none: 2, reflex: 3, scope: combat ? 3 : 1, thermal: combat ? 2 : 0.5, holo: 2.5, painter: combat ? 2 : 0.6 }),
    laser: rng.chance(combat ? 0.75 : 0.45),
    laserColor: rng.weighted({ '#ff3b30': 4, '#8fe36a': 2, '#3ad1ff': 2, '#c46bff': 1, '#ffb200': 1 }),
    muzzle: rng.weighted({ none: 2, brake: 3, suppressor: role === 'marksman' ? 4 : 2, flash: 2, coil: combat ? 2.5 : 1, plasma: combat ? 2 : 0.8 }),
    magazine: rng.weighted({ none: 1, box: 3, drum: 2, cell: 3, belt: 1, hopper: worker ? 2 : 0.6, coilpack: 2 }),
    underbarrel: rng.weighted({ none: 4, grenade: combat ? 2 : 0.4, grip: 2, lamp: 1.5, bayonet: combat ? 2 : 0.4, shieldrail: combat ? 1.5 : 0.5 })
  };

  // limb replacements now include the career tools, so a welder reads as a welder
  const limbPick = () => rng.weighted(biasTable({
    stock: 6,
    heavy: combat ? 3 : 1,
    industrial: worker ? 3 : 0.6,
    blade: combat ? 2 : 0.3,
    drill: role === 'salvage' || role === 'industrial' || role === 'mining' ? 3 : 0.3,
    beamfist: combat ? 1.2 : 0.4,
    welder: role === 'construction' || role === 'utility' || role === 'industrial' ? 3 : 0.2,
    saw: role === 'salvage' || role === 'rescue' ? 2.5 : 0.2,
    spray: role === 'agri' || role === 'hazmat' ? 3 : 0.15,
    vac: role === 'hazmat' || role === 'utility' ? 2 : 0.15,
    sampler: role === 'science' || role === 'survey' ? 3 : 0.15,
    auger: role === 'agri' || role === 'mining' ? 2.5 : 0.15,
    medkit: role === 'medic' || role === 'rescue' ? 3 : 0.1,
    tray: role === 'service' || role === 'companion' ? 3 : 0.1,
    disruptor: role === 'eod' ? 3 : 0.05,
    winch: role === 'rescue' || role === 'salvage' || role === 'loader' ? 2 : 0.2,
    harpoon: survey || worker || role === 'diver' ? 1.6 : 0.5,
    multitool: worker || role === 'medic' || role === 'utility' || survey ? 2.5 : 0.6,
    ram: worker || combat ? 1.8 : 0.4,
    shieldemitter: combat || role === 'security' ? 1.8 : 0.5,
  }, W && W.limbs));
  const limbs = { L: 'stock', R: 'stock' };
  if (spec.arms.count > 0) {
    limbs.R = limbPick();
    limbs.L = rng.chance(0.5) ? limbs.R : limbPick();
  }

  const back = rng.weighted(biasTable({
    none: 4,
    jetpack: combat ? 2 : 0.5,
    coolant: 2,
    cargo: worker || role === 'courier' ? 3 : 0.5,
    shieldGen: combat ? 2 : 0.4,
    dronebay: role === 'carrier' ? 4 : 0.2,
    hosecoil: role === 'firefighter' ? 4 : 0.1,
    hopper: role === 'agri' ? 4 : 0.1,
    samples: role === 'science' || role === 'survey' ? 3 : 0.1,
    solarwing: role === 'survey' || role === 'science' || role === 'agri' ? 2 : 0.4,
    mast: role === 'comms' ? 4 : 0.3,
    tank: role === 'hazmat' || role === 'diver' || role === 'firefighter' ? 3 : 0.3,
    generator: worker ? 1.5 : 0.4,
    radiator: 1.0,
    chute: 0.1,
    powerspine: 2,
    satdish: survey || role === 'comms' ? 2.5 : 0.8,
    dronerack: survey || role === 'carrier' ? 2 : 0.7,
  }, W && W.back));

  const chest = rng.weighted({
    none: 5,
    winch: role === 'rescue' || role === 'salvage' ? 3 : 0.4,
    tooltray: worker || role === 'utility' ? 3 : 0.3,
    screen: role === 'service' || role === 'companion' || role === 'medic' ? 3 : 0.4,
    sirenbar: role === 'security' || responder ? 3 : 0.2,
    hatch: 1.2,
    refill: role === 'agri' || role === 'hazmat' ? 2 : 0.3,
    cradle: role === 'medic' || role === 'rescue' ? 2 : 0.2,
  });

  const hip = rng.some(HIP_MODULES, rng.int(0, 2));

  return {
    shoulder, armor: panels, weaponMods, limbs, back, chest, hip,
    payload: [],
    hazardLights: rng.chance(worker || responder ? 0.75 : 0.3),
    worklamps: rng.chance(worker || responder || role === 'utility' ? 0.7 : 0.2),
    liveryStripe: rng.chance(0.5)
  };
}

/* ---------- finish ----------
   Surface treatment, drawn last so it never disturbs anything above it. */
function genFinish(rng, spec) {
  const P = spec.palette;
  return {
    glowSeams: rng.chance(0.55),
    seamColor: rng.chance(0.7) ? P.accent : rng.weighted({ '#3ad1ff': 3, '#c46bff': 2, '#8fe36a': 2, '#ff6a2b': 2 }),
    seamGlow: r3(rng.range(0.35, 1.3)),
    panelLines: rng.chance(0.6),
    insignia: rng.chance(0.5) ? rng.pick(['ring', 'triangle', 'bars', 'chevrons']) : 'none',
    insigniaOn: rng.pick(['chest', 'pauldron', 'back']),
    scorch: r3(P.wear > 0.5 ? rng.range(0.2, 0.9) : rng.range(0, 0.35)),
    iridescent: rng.chance(0.22),
    unitNumber: rng.int(1, 899)
  };
}

/* ---------- readable sheet ---------- */
export function describe(spec) {
  const L = spec.locomotion;
  const drive = LEGGED.has(L.type) ? `${L.legs}× ${L.style} legs (${L.footType})`
    : L.type === 'tracked' ? `${L.tracks}× tracks, ${L.roadWheels} road wheels`
    : L.type === 'wheeled' ? `${L.wheels}× wheels (${L.suspension})${L.gyro ? ', gyro-balanced' : ''}`
    : L.type === 'hover' ? `hover, ${L.thrusters}× thrusters, ${L.skirt} skirt`
    : L.type === 'rotor' ? `${L.rotors}× ${L.ducted ? 'ducted ' : ''}rotors${L.tilt ? ', tilting' : ''}, ${L.gear} gear`
    : `${L.wing} wing ${L.span} m span · ${L.motors}× ${L.propulsion}${L.vtol ? ' + VTOL lift' : ''}, ${L.tail} tail`;
  return [
    `${spec.designation} "${spec.nickname}" — ${spec.roleLabel}`,
    `Career    ${spec.career.className} · ${spec.career.duty} · tier ${spec.career.tier}`,
    `Frame     ${spec.height} m · ${spec.stats.massKg} kg · armor T${spec.stats.armor}`,
    `Head      ${spec.head.type} · ${spec.head.optics.count}× optic (${spec.head.optics.layout}) · ${spec.head.antenna.type} antenna`,
    `Chest     ${spec.torso.shape}${spec.torso.chestPlate ? ' + plate' : ''}${spec.torso.coreLamp ? ' + core lamp' : ''} · pack: ${spec.torso.backpack}`,
    `Arms      ${spec.arms.count}× ${spec.arms.segments}-seg · ${spec.arms.hand}${spec.arms.weapon ? ` · ${spec.arms.weapon.type} (${spec.arms.weapon.side})` : ''}`,
    `Drive     ${drive}`,
    `Perf      ${spec.stats.topSpeedMs} m/s · ${spec.stats.powerKw} kW · sensors ${spec.stats.sensorRangeM} m · ${spec.stats.enduranceMin} min`,
    `Yard      ${spec.stats.partCount} parts (${spec.stats.partKinds} kinds) · ${(spec.stats.costCr || 0).toLocaleString()} cr`,
    `Kit       ${kitLine(spec)}`,
    `Career kit ${spec.kit.length ? spec.kit.join(', ') : 'none'}`,
    `Livery    ${spec.palette.name} · wear ${Math.round(spec.palette.wear * 100)}%${spec.finish && spec.finish.insignia !== 'none' ? ' · ' + spec.finish.insignia + ' insignia' : ''}${spec.finish && spec.finish.glowSeams ? ' · lit seams' : ''}`,
    `Built for ${spec.world ? spec.world : 'no world set'}${spec.torso.sealed ? ' · sealed' : ''}`,
    `Behavior  agg ${spec.behavior.aggression} · cur ${spec.behavior.curiosity} · chat ${spec.behavior.chatter} · disc ${spec.behavior.discipline}`
  ];
}

function kitLine(spec) {
  const A = spec.attachments;
  if (!A) return 'none';
  const bits = [];
  for (const side of ['L', 'R']) if (A.shoulder[side]) bits.push(`${side}-shoulder ${A.shoulder[side].type}`);
  for (const p of (A.payload || [])) bits.push(`${p.station} ${p.type}`);
  if (A.armor.length) bits.push(`${A.armor.length}× ${A.armor[0].style} panels`);
  if (A.weaponMods) {
    const w = [];
    if (A.weaponMods.sight !== 'none') w.push(A.weaponMods.sight);
    if (A.weaponMods.laser) w.push('laser');
    if (A.weaponMods.muzzle !== 'none') w.push(A.weaponMods.muzzle);
    if (A.weaponMods.magazine !== 'none') w.push(A.weaponMods.magazine + ' mag');
    if (w.length) bits.push(w.join('+'));
  }
  const limbs = [A.limbs.L, A.limbs.R].filter(l => l !== 'stock');
  if (limbs.length) bits.push(`${[...new Set(limbs)].join('/')} limb${limbs.length > 1 ? 's' : ''}`);
  if (A.back && A.back !== 'none') bits.push(A.back);
  if (A.chest && A.chest !== 'none') bits.push(A.chest);
  return bits.length ? bits.join(' · ') : 'none';
}

export function randomSeed() {
  return Math.floor(Math.random() * 0xffffffff).toString(36).toUpperCase();
}
