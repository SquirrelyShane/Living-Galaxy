// robotgen/src/world.js — the planet a machine was built for.
//
// v1.7: a world also decides whether FLYING works at all. A rotor and a wing
// need air, so vacuum worlds zero them out and thin or dense atmospheres scale
// them; that is the same one-line bias every other draw goes through.
//
// A world does two things: it sets the gravity the animator runs under, and it
// biases every weighted draw in the spec generator. The draw COUNT never
// changes, so a world shifts the odds without desynchronising a seed.
import { generateRobot, makeRng, PALETTES } from './spec.js';

export const WORLDS = {
  earthlike: {
    key: 'earthlike', label: 'Earthlike', gravity: 9.81,
    blurb: 'Temperate, breathable, wet. The baseline everything else is compared against.',
    palettes: ['civic', 'industrial', 'security', 'chrome', 'medical', 'hazard'],
    loco: { rotor: 1, plane: 1 }
  },
  luna: {
    noAirDrive: 'hover',
    key: 'luna', label: 'Luna', gravity: 1.62, vacuum: true, dust: true, sealed: true,
    blurb: 'Vacuum and abrasive regolith. Tall, spindly frames; sealed joints; no smoke, flares instead.',
    sizeScale: 1.15,
    loco: { hover: 2.2, biped: 1.3, tripod: 1.4, wheeled: 0.6, tracked: 0.5, hexapod: 1.2, rotor: 0, plane: 0 },
    head: { array: 2, dome: 1.5, insect: 0.6 },
    palettes: ['chrome', 'glacier', 'civic', 'void'],
    shoulder: { smoke: 0, flare: 3, sensor: 2, dronebay: 1.6, floodlight: 1.8 },
    back: { radiator: 2.5, jetpack: 2.2, coolant: 0.4, satdish: 2 },
    armorStyle: { ablative: 2, carapace: 1.5, riot: 0.3 },
    limbs: { welder: 1.6, multitool: 1.8, drill: 1.5 }
  },
  mars: {
    key: 'mars', label: 'Mars', gravity: 3.72, dust: true, cold: true, thin: true, sealed: true,
    blurb: 'Thin cold air and planet-wide dust. Sealed drives, wide stances, dust skirts.',
    sizeScale: 1.08,
    loco: { hexapod: 1.8, octoped: 1.6, wheeled: 1.6, tracked: 1.4, hover: 0.5, biped: 0.9, rotor: 0.35, plane: 0.6 },
    palettes: ['rust', 'hazard', 'ferrite', 'industrial', 'ceramic'],
    shoulder: { sensor: 2, floodlight: 2, winch: 1.8, dronebay: 1.5 },
    back: { coolant: 0.5, radiator: 0.6, powerspine: 2, cargo: 1.8, satdish: 2 },
    armorStyle: { ablative: 1.6, plate: 1.4 },
    limbs: { drill: 2.2, multitool: 1.8, welder: 1.5 }
  },
  titan: {
    key: 'titan', label: 'Titan', gravity: 1.35, cold: true, dense: true, sealed: true,
    blurb: 'Cryogenic, thick, hydrocarbon haze. Insulated shells, heaters glowing, floodlights on.',
    sizeScale: 1.2,
    loco: { hover: 2.4, octoped: 1.8, hexapod: 1.6, tripod: 1.4, wheeled: 0.5, rotor: 2.2, plane: 1.6 },
    head: { array: 2, crown: 1.5 },
    palettes: ['biolume', 'glacier', 'verdigris', 'void'],
    shoulder: { floodlight: 3, sensor: 2.4, beam: 1.4, smoke: 0.3 },
    back: { powerspine: 2.4, coolant: 0.3, radiator: 0.3, satdish: 1.8 },
    armorStyle: { composite: 2, carapace: 1.8 },
    limbs: { harpoon: 2, multitool: 1.6 }
  },
  venusian: {
    key: 'venusian', label: 'Venusian', gravity: 8.87, hot: true, corrosive: true, dense: true, sealed: true,
    blurb: 'Furnace heat, crushing pressure, acid haze. Squat armoured hulls that shed heat hard.',
    sizeScale: 0.9,
    loco: { tracked: 2.4, octoped: 1.6, hexapod: 1.4, wheeled: 1.2, hover: 0.4, biped: 0.5, rotor: 0.5, plane: 0.4 },
    head: { turret: 2, periscope: 2, skull: 1.4, visor: 0.6 },
    palettes: ['ceramic', 'ferrite', 'verdigris', 'hazard'],
    extraArmor: 2,
    shoulder: { smoke: 1.6, sensor: 1.6, repairarm: 1.6, dronebay: 0.6 },
    back: { radiator: 3.5, coolant: 3, jetpack: 0.2 },
    armorStyle: { ablative: 3, carapace: 2, fieldemitter: 1.6, riot: 0.4 },
    limbs: { ram: 2, welder: 1.4, industrial: 1.8 }
  },
  belt: {
    noAirDrive: 'hover',
    key: 'belt', label: 'Belt station', gravity: 0.27, vacuum: true, sealed: true,
    blurb: 'Micro-gravity rock and rebar. Grapples, thrusters, and long thin limbs.',
    sizeScale: 1.25,
    loco: { hover: 3.5, octoped: 1.6, hexapod: 1.4, tripod: 1.2, wheeled: 0.2, tracked: 0.2, biped: 0.6, rotor: 0, plane: 0 },
    head: { array: 2.4, cluster: 1.6 },
    palettes: ['void', 'chrome', 'rust', 'ferrite'],
    shoulder: { winch: 3, dronebay: 2.4, flare: 2, smoke: 0, sensor: 1.8 },
    back: { jetpack: 3.5, cargo: 2, radiator: 1.6, coolant: 0.3 },
    armorStyle: { ablative: 1.6, composite: 1.4 },
    limbs: { harpoon: 3, multitool: 2, welder: 2, drill: 1.6 }
  },
  superearth: {
    key: 'superearth', label: 'Super-Earth', gravity: 18.5, dense: true,
    blurb: 'Heavy pull, thick air. Short wide frames, many legs, everything braced.',
    sizeScale: 0.78,
    loco: { octoped: 2.6, hexapod: 2.2, tracked: 2, quadruped: 1.8, wheeled: 1.2, hover: 0.15, biped: 0.4, rotor: 0.5, plane: 0.7 },
    head: { turret: 1.8, skull: 1.6, mandible: 1.6, crown: 0.6 },
    palettes: ['ferrite', 'military', 'industrial', 'void'],
    extraArmor: 1,
    torso: { segmented: 2, cage: 0.4, capsule: 0.6 },
    shoulder: { winch: 2, repairarm: 1.6, railgun: 1.4, jetpack: 0 },
    back: { powerspine: 2.4, cargo: 1.8, jetpack: 0.2 },
    armorStyle: { plate: 2, carapace: 2, reactive: 1.4 },
    limbs: { ram: 2.4, heavy: 2, industrial: 1.8 }
  },
  garden: {
    key: 'garden', label: 'Garden world', gravity: 7.4, wet: true,
    blurb: 'Warm, green, growing. Light civilian frames in soft liveries.',
    sizeScale: 1.02,
    loco: { biped: 1.6, wheeled: 1.4, quadruped: 1.4, hover: 1.2, tracked: 0.7, rotor: 1.4, plane: 1.3 },
    head: { dome: 1.6, visor: 1.4, crown: 1.4, skull: 0.4 },
    palettes: ['ceramic', 'civic', 'medical', 'verdigris', 'glacier'],
    shoulder: { cannon: 0.2, missiles: 0.1, railgun: 0.1, sensor: 2, floodlight: 1.6, repairarm: 2 },
    back: { cargo: 2, satdish: 1.6, shieldGen: 0.4 },
    armorStyle: { composite: 2, plate: 1.2, riot: 0.3 },
    limbs: { multitool: 2.4, welder: 1.6, blade: 0.2 }
  }
};
export const WORLD_KEYS = Object.keys(WORLDS);
export const FLIES = (world) => {
  const w = resolveWorld(world);
  return !w || !w.loco || (w.loco.rotor !== 0 || w.loco.plane !== 0);
};

/* ---------- settlements: who is actually on the ground ---------- */
export const SETTLEMENTS = {
  mining:   { label: 'Mining claim',     roles: { mining: 4, industrial: 3, salvage: 2.5, labor: 3, survey: 2, security: 1.5, utility: 1.5, loader: 1.5 } },
  research: { label: 'Research station', roles: { science: 4, survey: 3, drone: 3, medic: 2, service: 2, inspector: 1.5, security: 1 } },
  garrison: { label: 'Garrison',         roles: { war: 3, security: 4, sentry: 2, marksman: 1.5, medic: 1.5, courier: 1.5, comms: 1.5, eod: 1, carrier: 1 } },
  colony:   { label: 'Colony',           roles: { service: 4, labor: 3, courier: 3, medic: 2, security: 1.5, agri: 2, utility: 2, companion: 1.5, firefighter: 1 } },
  salvage:  { label: 'Salvage yard',     roles: { salvage: 5, labor: 3, industrial: 2, loader: 2, courier: 1.5, drone: 1.5, utility: 1.5 } },
  survey:   { label: 'Survey camp',      roles: { survey: 5, scout: 3, recon: 2.5, drone: 2.5, science: 2, medic: 1, labor: 1 } },
  port:     { label: 'Freight port',     roles: { loader: 4, courier: 4, labor: 3, utility: 2, security: 2, carrier: 1.5, service: 1.5 } },
  works:    { label: 'Construction works', roles: { construction: 4, labor: 3, loader: 2.5, utility: 2, industrial: 2, firefighter: 1, comms: 1 } },
  response: { label: 'Response post',    roles: { rescue: 4, firefighter: 3, medic: 3, hazmat: 2, eod: 1.5, comms: 1.5, drone: 1.5 } }
};
export const SETTLEMENT_KEYS = Object.keys(SETTLEMENTS);

export function resolveWorld(world) {
  if (!world) return null;
  return typeof world === 'string' ? (WORLDS[world] || null) : world;
}
export const gravityOf = (world) => {
  const w = resolveWorld(world);
  return w ? w.gravity : 9.81;
};

const FACTION_A = ['Halden', 'Novak', 'Ostara', 'Kessler', 'Bright', 'Corvid', 'Tenno', 'Mahara', 'Ferrous', 'Quiet'];
const FACTION_B = ['Reclamation', 'Freight', 'Survey Group', 'Works', 'Combine', 'Cooperative', 'Salvage', 'Holdings', 'Expedition', 'Authority'];

/**
 * A crowd that reads as one place: shared livery, shared designation prefix, a
 * role mix that suits the settlement, and every frame built for this gravity.
 */
export function generatePopulation(seed, worldKey, count = 6, opts = {}) {
  const world = resolveWorld(worldKey) || WORLDS.earthlike;
  const rng = makeRng(String(seed) + '|' + world.key + '|pop');
  const settlementKey = opts.settlement && SETTLEMENTS[opts.settlement]
    ? opts.settlement : rng.pick(SETTLEMENT_KEYS);
  const settlement = SETTLEMENTS[settlementKey];

  const pool = (world.palettes || ['civic']).filter(p => PALETTES[p]);
  const livery = opts.palette && PALETTES[opts.palette] ? opts.palette : rng.pick(pool);
  const faction = {
    name: `${rng.pick(FACTION_A)} ${rng.pick(FACTION_B)}`,
    livery,
    settlement: settlementKey,
    settlementLabel: settlement.label
  };

  const members = [];
  const onLivery = Math.ceil(count * 0.6);       // the crowd has to read as one place,
  for (let i = 0; i < count; i++) {              // so most of it wears the livery by quota
    let role = rng.weighted(settlement.roles);
    // an air career on an airless world would be built as a grounded frame the
    // moment its loco bias hits zero — pick it deliberately rather than by accident
    if (!FLIES(world) && (role === 'recon' || role === 'inspector' || role === 'interceptor')) role = 'survey';
    // the rest are contractors, salvage and hand-me-downs in their own colours
    const palette = (i < onLivery || rng.chance(0.5)) ? livery : undefined;
    const spec = generateRobot(`${seed}|${world.key}|${i}`, { world, role, palette });
    spec.faction = faction.name;
    spec.settlement = settlementKey;
    members.push(spec);
  }
  return { world, faction, settlement: settlementKey, settlementLabel: settlement.label, gravity: world.gravity, members };
}

export function describeWorld(world) {
  const w = resolveWorld(world) || WORLDS.earthlike;
  const tags = ['vacuum', 'dust', 'cold', 'hot', 'corrosive', 'dense', 'thin', 'wet'].filter(t => w[t]);
  return [
    `${w.label} — ${w.gravity} m/s²`,
    w.blurb,
    tags.length ? `Conditions: ${tags.join(', ')}` : 'Conditions: temperate'
  ];
}
