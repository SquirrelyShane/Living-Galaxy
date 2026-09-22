/* robotgen/src/data/bom.js — spec → parts manifest → bill of materials.
 *
 *   robotParts(spec)  → [{ part, count, why }]      what the yard would pick
 *   partBom(part)     → { componentId: count }
 *   expandBom(bom)    → { materials: {id: kg}, components: {id: count}, fasteners }
 *   robotBom(spec)    → the whole unit rolled up: parts by domain, components,
 *                       materials by kind, mass, power, heat, cost
 *
 * Same algorithm as NEWSHIPGEN's expandBom (components recurse to raw stock and
 * mass is conserved) and the same two-step costing as STATIONGEN. Nothing here
 * touches THREE — it runs in node, a worker or the page. */
import { MATERIALS, COMPONENTS, materialCost } from './catalog.js';
import { PARTS, PART_DOMAINS } from './parts.js';

export { PARTS, PART_DOMAINS, MATERIALS, COMPONENTS };

export function partBom(part) { return part.bom; }
export function bomMass(bom) {
  let kg = 0;
  for (const [c, q] of Object.entries(bom)) kg += q * COMPONENTS[c].kg;
  return kg;
}

/* recursive roll-up to raw stock; fastener kits also report piece counts */
export function expandBom(bom, out = { materials: {}, components: {}, fasteners: 0 }, mult = 1) {
  for (const [c, q] of Object.entries(bom)) {
    const comp = COMPONENTS[c];
    if (!comp) throw new Error('unknown component ' + c);
    out.components[c] = (out.components[c] || 0) + q * mult;
    if (c.startsWith('c.bolt')) out.fasteners += q * mult * 50;
    if (c === 'c.rivet') out.fasteners += q * mult * 200;
    if (c === 'c.insert') out.fasteners += q * mult * 100;
    for (const [k, v] of Object.entries(comp.bom)) {
      if (MATERIALS[k]) out.materials[k] = (out.materials[k] || 0) + v * q * mult;
      else expandBom({ [k]: v }, out, q * mult);
    }
  }
  return out;
}

/* ---------- spec → parts ---------------------------------------------------- */
export const HAND_PART = { gripper: 'r.ee.gripper', claw: 'r.ee.claw', tool: 'r.ee.gripper', manipulator: 'r.ee.hand', weapon: 'r.wp.smallarm', pad: 'r.ee.tray' };
export const LIMB_PART = { heavy: 'r.ee.clamp', industrial: 'r.ee.clamp', blade: 'r.ee.blade', drill: 'r.ee.drill', beamfist: 'r.ee.beamfist', welder: 'r.ee.welder', saw: 'r.ee.saw', spray: 'r.ee.spray', vac: 'r.ee.vac', sampler: 'r.ee.sampler', auger: 'r.ee.auger', medkit: 'r.ee.medkit', tray: 'r.ee.tray', disruptor: 'r.ee.disruptor', winch: 'r.ee.winch',
  harpoon: 'r.ee.harpoon', multitool: 'r.ee.multitool', ram: 'r.ee.ram', shieldemitter: 'r.ar.shield_emitter' };
export const MOUNT_PART = {
  cannon: 'r.wp.autocannon', gatling: 'r.wp.gatling', missiles: 'r.wp.missiles', beam: 'r.wp.beam',
  mortar: 'r.wp.mortar', grenade: 'r.wp.grenade', smoke: 'r.wp.smoke', shield: 'r.ar.shield_riot',
  sensor: 'r.sn.mast', radar: 'r.sn.radar_sm', spotlight: 'r.sv.worklamp', dronebay: 'r.kt.drone_bay',
  jammer: 'r.wp.jammer', netgun: 'r.wp.netgun', taser: 'r.wp.taser', grapple: 'r.kt.grapple',
  toolarm: 'r.kt.toolboard', ammo: 'r.wp.magazine', relay: 'r.kt.relay_mast', hailer: 'r.kt.speaker',
  railgun: 'r.wp.railgun', winch: 'r.kt.winch_mount', floodlight: 'r.sv.floodlight',
  repairarm: 'r.ee.repair_arm', flare: 'r.wp.flare',
};
export const BACK_PART = {
  jetpack: 'r.kt.jetpack', coolant: 'r.th.liquid_loop', cargo: 'r.kt.cargo_rack', shieldGen: 'r.ar.shield_field',
  dronebay: 'r.kt.drone_bay', hosecoil: 'r.kt.hose_reel', hopper: 'r.kt.hopper', samples: 'r.kt.sample_rack',
  solarwing: 'r.pw.solar_wing', mast: 'r.kt.relay_mast', tank: 'r.kt.tank', generator: 'r.pw.fuel_cell',
  radiator: 'r.th.radiator', chute: 'r.fl.chute',
  powerspine: 'r.pw.powerspine', satdish: 'r.cd.satdish', dronerack: 'r.kt.dronerack',
};
export const KIT_PART = {
  cargo: 'r.kt.cargo_rack', forks: 'r.kt.forks', tank: 'r.kt.tank', hopper: 'r.kt.hopper',
  hose: 'r.kt.hose_reel', monitor: 'r.kt.fire_monitor', decon: 'r.kt.decon', dronebay: 'r.kt.drone_bay',
  relay: 'r.kt.relay_mast', samples: 'r.kt.sample_rack', jetpack: 'r.kt.jetpack', grapple: 'r.kt.grapple',
  stretcher: 'r.kt.stretcher', camera: 'r.kt.camera_ball', mapping: 'r.kt.mapping_pod',
  hailer: 'r.kt.speaker', display: 'r.kt.display', siren: 'r.kt.siren', toolboard: 'r.kt.toolboard',
  gpr: 'r.sn.gpr', xray: 'r.sn.xray', spectro: 'r.sn.spectro', chem: 'r.sn.chem', rad: 'r.sn.rad_probe',
  sonar: 'r.sn.sonar', medkit: 'r.ee.medkit', winch: 'r.ee.winch', welder: 'r.ee.welder',
  saw: 'r.ee.saw', auger: 'r.ee.auger', sampler: 'r.ee.sampler', spray: 'r.ee.spray', vac: 'r.ee.vac',
  drill: 'r.ee.drill', tray: 'r.ee.tray', seal: 'r.ar.seal_ip', radliner: 'r.ar.rad_liner',
  heater: 'r.th.heater', chute: 'r.fl.chute', isotope: 'r.pw.isotope', solar: 'r.pw.solar_wing',
  fuelcell: 'r.pw.fuel_cell', disruptor: 'r.ee.disruptor', recorder: 'r.cd.recorder',
  datalink: 'r.cd.datalink', dish: 'r.cd.dish', lidar: 'r.sn.lidar', thermal: 'r.sn.optic_thermal',
  munition: 'r.wp.missiles', jammer: 'r.wp.jammer', spotlight: 'r.sv.worklamp', radar: 'r.sn.radar_sm',
  taser: 'r.wp.taser', netgun: 'r.wp.netgun', smoke: 'r.wp.smoke', shield: 'r.ar.shield_riot',
  sensor: 'r.sn.mast', ammo: 'r.wp.magazine', hose: 'r.kt.hose_reel',
};


/* A 0.5 m inspection flyer is not a small starship: below a metre the yard
   builds from the micro tier, so the manifest weighs what the airframe weighs. */
export const MICRO_SWAP = {
  'r.fr.spine_light': 'r.fr.spine_micro', 'r.fr.spine_std': 'r.fr.spine_micro',
  'r.fr.shell_panel': 'r.fr.shell_micro', 'r.fr.hardpoint': 'r.fr.hardpoint_mi',
  'r.fr.chest_cavity': 'r.fr.shell_micro', 'r.fr.neck_column': 'r.ac.joint_micro',
  'r.fl.rotor_unit': 'r.fl.rotor_micro', 'r.fl.rotor_ducted': 'r.fl.rotor_micro_d',
  'r.fl.boom': 'r.fl.boom_micro', 'r.fl.wing_panel': 'r.fl.wing_micro',
  'r.fl.tail_group': 'r.fl.tail_micro', 'r.fl.control_surf': 'r.fl.surf_micro',
  'r.fl.pusher_prop': 'r.fl.prop_micro', 'r.fl.air_data': 'r.fl.airdata_micro',
  'r.fl.skid': 'r.fl.skid_micro', 'r.fl.chute': 'r.fl.chute_micro',
  'r.fl.tilt_nacelle': 'r.ac.joint_micro',
  'r.pw.pack_small': 'r.pw.pack_micro', 'r.pw.pack_std': 'r.pw.pack_micro',
  'r.pw.bus': 'r.pw.bus_micro', 'r.pw.charge_port': 'r.pw.charge_micro',
  'r.sn.optic_mono': 'r.sn.optic_micro', 'r.sn.optic_stereo': 'r.sn.optic_micro',
  'r.sn.optic_thermal': 'r.kt.thermal_micro', 'r.sn.imu': 'r.sn.imu_micro',
  'r.sn.gnss': 'r.sn.gnss_micro', 'r.sn.lidar': 'r.sn.lidar_micro',
  'r.sn.scanner_bar': 'r.sn.scan_micro',
  'r.cd.cpu_core': 'r.cd.cpu_micro', 'r.cd.autonomy': 'r.cd.autonomy_micro',
  'r.cd.safety': 'r.cd.safety_micro', 'r.cd.radio': 'r.cd.radio_micro',
  'r.cd.harness': 'r.cd.harness_micro', 'r.cd.datalink': 'r.kt.relay_micro',
  'r.ee.gripper': 'r.ee.gripper_micro', 'r.ee.claw': 'r.ee.gripper_micro',
  'r.th.fan_loop': 'r.th.fan_micro', 'r.th.liquid_loop': 'r.th.fan_micro',
  'r.sv.beacon': 'r.sv.beacon_micro', 'r.sv.id_plate': 'r.sv.id_micro',
  'r.sv.service_panel': 'r.sv.id_micro', 'r.sv.transponder': 'r.sv.id_micro',
  'r.sv.worklamp': 'r.kt.spot_micro',
  'r.kt.camera_ball': 'r.kt.camera_micro', 'r.kt.mapping_pod': 'r.kt.mapping_micro',
  'r.kt.relay_mast': 'r.kt.relay_micro', 'r.kt.tank': 'r.kt.tank_micro',
  'r.kt.cargo_rack': 'r.kt.cargo_micro', 'r.kt.speaker': 'r.kt.hailer_micro',
  'r.ac.joint_light': 'r.ac.joint_micro', 'r.ac.joint_std': 'r.ac.joint_micro',
  'r.dr.leg_light': 'r.dr.leg_micro',
  'r.dr.hover_fan': 'r.dr.hover_micro', 'r.dr.hover_skirt': 'r.dr.skirt_micro',
  'r.dr.thruster_vane': 'r.fl.surf_micro',
  'r.wp.missiles': 'r.wp.missiles_micro', 'r.wp.smallarm': 'r.wp.smallarm_micro',
  'r.wp.jammer': 'r.wp.jammer_micro', 'r.wp.magazine': 'r.wp.mag_micro',
  'r.wp.sight': 'r.wp.sight_micro', 'r.wp.laser_sight': 'r.wp.sight_micro',
  'r.ee.multitool': 'r.ee.tool_micro', 'r.sv.floodlight': 'r.kt.spot_micro',
  'r.ar.plate': 'r.ar.plate_micro', 'r.ar.composite': 'r.ar.composite_micro',
  'r.ar.ablative': 'r.ar.composite_micro', 'r.ar.riot': 'r.ar.plate_micro',
  'r.ee.claw': 'r.ee.gripper_micro', 'r.kt.camera_ball': 'r.kt.camera_micro',
  'r.sn.optic_thermal': 'r.kt.thermal_micro', 'r.kt.spot_micro': 'r.kt.spot_micro',
};
/* The micro tier is for airframes that fit in a backpack and for the smallest
   ground units. A metre-tall tracked frame is small, not micro — it still wants
   real wheels, real armour and a real battery. */
export function isMicro(spec) {
  return spec.flying ? spec.height <= 1.05 : spec.height <= 0.6;
}

const OPTIONAL = new Set(['wp', 'kt', 'ar', 'th', 'sv']);

export function robotParts(spec) {
  const list = [];
  const micro = isMicro(spec);
  const frameKg = Math.max(1, spec.stats.frameEstimateKg || spec.stats.massKg);
  const microCap = spec.flying ? 6 : 12;      // kg of optional kit a micro unit will carry
  const add = (rawId, count = 1, why = '') => {
    if (!count) return;
    const id = (micro && MICRO_SWAP[rawId] && PARTS[MICRO_SWAP[rawId]]) ? MICRO_SWAP[rawId] : rawId;
    const part = PARTS[id];
    // a sub-metre airframe cannot be handed a shield generator or a pallet fork
    // just because its career rolled one: optional kit heavier than a chunk of
    // the whole unit is left off the manifest rather than bolted on
    if (micro && part && OPTIONAL.has(part.domain) && part.mass > microCap) return;
    if (!part) throw new Error('unknown part ' + id);
    const found = list.find(e => e.part.id === id && e.why === why);
    if (found) found.count += count; else list.push({ part, count, why });
  };
  const L = spec.locomotion, A = spec.attachments || {};
  // sizing runs off the FRAME estimate, never off the mass the manifest itself
  // produced — otherwise re-quoting a unit would keep changing what it is made of
  const mass = spec.stats.frameEstimateKg || spec.stats.massKg;
  const flying = L.type === 'rotor' || L.type === 'plane';

  /* frame */
  add(mass > 400 ? 'r.fr.spine_heavy' : mass > 90 ? 'r.fr.spine_std' : 'r.fr.spine_light', 1, 'chassis');
  const surface = 2 * (spec.torso.width * spec.torso.height + spec.torso.width * spec.torso.depth + spec.torso.height * spec.torso.depth);
  add('r.fr.shell_panel', Math.max(1, Math.round(surface / 0.3)), 'body shell');
  add('r.fr.chest_cavity', 1, 'equipment bay');
  if (spec.torso.shoulderYoke) add('r.fr.shoulder_yoke', 1, 'yoke');
  if (L.legs) add('r.fr.hip_girdle', 1, 'hip girdle');
  if (spec.head.neck.type !== 'none') add('r.fr.neck_column', 1, 'neck');
  if (spec.role === 'service' || spec.role === 'courier' || spec.role === 'medic' || spec.role === 'companion') add('r.fr.bumper_ring', 1, 'people-safe bumper');
  add('r.fr.hardpoint', 2 + (A.shoulder ? (A.shoulder.L ? 1 : 0) + (A.shoulder.R ? 1 : 0) : 0), 'hardpoints');

  /* drive */
  if (L.legs) {
    const legPart = mass > 400 ? 'r.dr.leg_heavy' : mass > 110 ? 'r.dr.leg_std' : 'r.dr.leg_light';
    add(legPart, L.legs, `${L.legs}× ${L.style} leg`);
    if (L.footType === 'claw') add('r.dr.foot_claw', L.legs, 'claw feet');
  } else if (L.type === 'wheeled') {
    add('r.dr.wheel_unit', L.wheels, `${L.wheels}× driven wheel`);
    add('r.dr.suspension', L.wheels, L.suspension + ' suspension');
    if (L.gyro) add('r.dr.gyro_balance', 1, 'gyro balance');
  } else if (L.type === 'tracked') {
    add('r.dr.track_run', L.tracks, `${L.tracks}× track`);
    add('r.dr.track_drive', L.tracks, 'final drive');
    add('r.dr.roadwheel_set', L.tracks * L.roadWheels, 'road wheels');
  } else if (L.type === 'hover') {
    add('r.dr.hover_fan', L.thrusters, `${L.thrusters}× lift fan`);
    if (L.skirt !== 'none') add('r.dr.hover_skirt', 4, L.skirt + ' skirt');
    add('r.dr.thruster_vane', L.fins ? 4 : 2, 'attitude vanes');
  } else if (L.type === 'rotor') {
    add(L.ducted ? 'r.fl.rotor_ducted' : 'r.fl.rotor_unit', L.rotors, `${L.rotors}× rotor`);
    add('r.fl.boom', L.rotors, 'booms');
    if (L.tilt) add('r.fl.tilt_nacelle', Math.min(4, L.rotors), 'tilt nacelles');
    add('r.fl.air_data', 1, 'air data');
    if (L.gear !== 'none') add('r.fl.skid', L.gear === 'legs' ? 4 : 2, L.gear + ' gear');
  } else if (L.type === 'plane') {
    add('r.fl.wing_panel', Math.max(2, Math.round(L.span * 1.6)), L.wing + ' wing');
    add('r.fl.tail_group', 1, L.tail + ' tail');
    add('r.fl.control_surf', L.surfaces, 'control surfaces');
    if (L.propulsion === 'jet') add('r.fl.microjet', L.motors, 'turbofan');
    else add('r.fl.pusher_prop', L.motors, L.propulsion + ' drive');
    if (L.vtol) add(L.ducted ? 'r.fl.rotor_ducted' : 'r.fl.rotor_unit', L.liftRotors || 4, 'VTOL lift');
    add('r.fl.air_data', 1, 'air data');
    if (L.gear !== 'none') add('r.fl.skid', L.gear === 'tricycle' ? 3 : 2, L.gear + ' gear');
    if (L.chute) add('r.fl.chute', 1, 'recovery chute');
  }

  /* arms */
  if (spec.arms.count > 0) {
    const jointsPerArm = spec.arms.segments + 2;
    const joint = mass > 400 ? 'r.ac.joint_heavy' : mass > 110 ? 'r.ac.joint_std' : spec.height < 1.2 ? 'r.ac.joint_light' : 'r.ac.joint_std';
    add(joint, spec.arms.count * jointsPerArm, `${spec.arms.count}× arm`);
    if (spec.arms.hand === 'manipulator') add('r.ac.tendon_set', spec.arms.count, 'tendon hands');
    if (joint === 'r.ac.joint_heavy') add('r.ac.hydraulic_pack', 1, 'hydraulics');
    const limbs = A.limbs || {};
    for (const side of ['L', 'R']) {
      if (spec.arms.count === 1 && side === 'L') continue;
      const t = limbs[side];
      const id = (t && t !== 'stock' && LIMB_PART[t]) ? LIMB_PART[t] : HAND_PART[spec.arms.hand] || 'r.ee.gripper';
      add(id, 1, `${side} end effector`);
    }
    if (spec.arms.count >= 4) add(HAND_PART[spec.arms.hand] || 'r.ee.gripper', 2, 'lower pair');
  }

  /* head + sensors */
  const O = spec.head.optics;
  add('r.sn.optic_stereo', O.count >= 2 ? 1 : 0, 'stereo pair');
  add('r.sn.optic_mono', Math.max(0, O.count - (O.count >= 2 ? 2 : 0)), 'optics');
  if (O.count === 1) add('r.sn.optic_mono', 1, 'optics');
  if (O.scanBar) add('r.sn.scanner_bar', 1, 'scan bar');
  add('r.sn.imu', 1, 'IMU');
  add('r.sn.gnss', flying || spec.role === 'survey' || spec.role === 'scout' ? 1 : 0, 'GNSS');
  if (spec.head.earPods) add('r.sn.mic_array', 1, 'acoustic');
  if (spec.head.antenna.type === 'dish') add('r.cd.dish', 1, 'dish');

  /* compute + comms */
  add('r.cd.cpu_core', 1, 'controller');
  add('r.cd.autonomy', spec.behavior.curiosity > 0.5 || flying ? 1 : 1, 'autonomy');
  add('r.cd.safety', 1, 'safety chain');
  add('r.cd.radio', 1, 'radio');
  add('r.cd.harness', Math.max(1, Math.round(spec.height)), 'harness');

  /* armour */
  const panels = (A.armor || []).length;
  const style = panels ? A.armor[0].style : 'plate';
  const armPart = { plate: 'r.ar.plate', composite: 'r.ar.composite', ablative: 'r.ar.ablative', riot: 'r.ar.riot' }[style] || 'r.ar.plate';
  if (panels) add(armPart, panels, `${style} panels`);
  if (spec.stats.armor >= 2) add('r.ar.plate', spec.stats.armor, 'base armour');

  /* shoulder mounts + weapon mods */
  for (const side of ['L', 'R']) {
    const m = A.shoulder && A.shoulder[side];
    if (!m) continue;
    const id = MOUNT_PART[m.type];
    if (id) add(id, 1, `${side} shoulder ${m.type}`);
  }
  if (spec.arms.weapon) add('r.wp.smallarm', 1, 'arm weapon');
  const W = A.weaponMods;
  if (W) {
    if (W.sight !== 'none') add('r.wp.sight', 1, W.sight);
    if (W.laser) add('r.wp.laser_sight', 1, 'laser');
    if (W.muzzle !== 'none') add('r.wp.muzzle', 1, W.muzzle);
    if (W.magazine !== 'none') add('r.wp.magazine', 1, W.magazine);
    if (W.underbarrel !== 'none') add('r.wp.underbarrel', 1, W.underbarrel);
  }

  /* back unit + career kit */
  if (A.back && A.back !== 'none' && BACK_PART[A.back]) add(BACK_PART[A.back], 1, 'back unit');
  for (const k of (spec.kit || [])) if (KIT_PART[k]) add(KIT_PART[k], 1, 'career kit');
  for (const p of (A.payload || [])) if (KIT_PART[p.type]) add(KIT_PART[p.type], 1, 'payload');

  /* power — sized off the draw the manifest already committed to, not guessed:
     enough pack for a useful shift, capped so a scout does not fly a brick */
  let draw = 0;
  for (const { part, count } of list) draw += Math.min(0, part.pwr) * count;
  const drawKw = Math.abs(draw) / 1000;
  const packId = micro ? 'r.pw.pack_micro' : mass > 400 ? 'r.pw.pack_large' : mass > 90 ? 'r.pw.pack_std' : 'r.pw.pack_small';
  const packKwh = PARTS[packId].kwh || 0.5;
  const hours = flying ? 0.42 : 2.2;                       // the shift the yard sizes for
  const maxPacks = flying ? (micro ? 2 : 3) : 4;
  add(packId, Math.max(1, Math.min(maxPacks, Math.round(drawKw * hours / packKwh))), 'battery');
  add('r.pw.bus', 1, 'power bus');
  add('r.pw.charge_port', 1, 'charge port');
  if (spec.kit && spec.kit.includes('solar')) { /* handled by kit */ }

  /* thermal sized off the draw */
  add(draw < -2500 ? 'r.th.liquid_loop' : 'r.th.fan_loop', 1, 'cooling');
  if (draw < -6000) add('r.th.radiator', 2, 'radiators');
  if (spec.palette.name === 'hazard' || spec.role === 'hazmat' || spec.role === 'diver') add('r.th.dust_seal', 1, 'sealing');

  /* service + identity */
  if (A.hazardLights) add('r.sv.beacon', 1, 'hazard beacons');
  if (spec.attachments && spec.attachments.worklamps) add('r.sv.worklamp', 1, 'work lamps');
  add('r.sv.service_panel', 1, 'service access');
  add('r.sv.id_plate', 1, 'livery');
  add('r.sv.transponder', 1, 'transponder');
  return list;
}

/* ---------- roll-up ---------------------------------------------------------- */
export function robotBom(spec) {
  const manifest = robotParts(spec);
  const total = { materials: {}, components: {}, fasteners: 0 };
  const byDomain = {};
  let massKg = 0, pwrW = 0, heatW = 0, cr = 0, kwh = 0, drawW = 0, genW = 0, heatGenW = 0, coolW = 0;
  for (const { part, count, why } of manifest) {
    expandBom(part.bom, total, count);
    massKg += part.mass * count;
    pwrW += part.pwr * count;
    heatW += part.heat * count;
    if (part.pwr < 0) drawW += -part.pwr * count; else genW += part.pwr * count;
    if (part.heat > 0) heatGenW += part.heat * count; else coolW += -part.heat * count;
    kwh += (part.kwh || 0) * count;
    const d = byDomain[part.domain] || (byDomain[part.domain] = { id: part.domain, label: PART_DOMAINS[part.domain] || part.domain, parts: [], mass: 0, cr: 0 });
    const each = partCost(part);
    d.parts.push({ id: part.id, name: part.name, count, mass: part.mass, each, why });
    d.mass += part.mass * count;
    d.cr += each * count;
    cr += each * count;
  }
  for (const d of Object.values(byDomain)) d.parts.sort((a, b) => b.each * b.count - a.each * a.count);
  const byKind = {};
  let rawKg = 0;
  for (const [m, kg] of Object.entries(total.materials)) {
    const kind = MATERIALS[m].kind;
    byKind[kind] = (byKind[kind] || 0) + kg;
    rawKg += kg;
  }
  const labour = Math.round(cr * 0.22);
  return {
    manifest,
    parts: manifest.reduce((o, e) => (o[e.part.id] = (o[e.part.id] || 0) + e.count, o), {}),
    partCount: manifest.reduce((a, e) => a + e.count, 0),
    partKinds: new Set(manifest.map(e => e.part.id)).size,
    components: total.components, materials: total.materials, fasteners: Math.round(total.fasteners),
    byKind, byDomain: Object.values(byDomain).sort((a, b) => b.cr - a.cr),
    massKg: Math.round(massKg * 10) / 10,
    rawKg: Math.round(rawKg * 10) / 10,
    pwrW: Math.round(pwrW), heatW: Math.round(heatW), energyKwh: Math.round(kwh * 100) / 100,
    drawW: Math.round(drawW), genW: Math.round(genW), heatGenW: Math.round(heatGenW), coolW: Math.round(coolW),
    cr: Math.round(cr + labour), labour,
  };
}

export function partCost(part) {
  let cr = 0;
  const exp = expandBom(part.bom);
  for (const [m, kg] of Object.entries(exp.materials)) cr += materialCost(m, kg);
  cr += Math.abs(part.pwr) * 0.9 + Math.abs(part.heat) * 0.3;
  return Math.round(cr);
}

/* readable manifest, the same shape describe() gives for the spec sheet */
export function describeBom(spec, bom = robotBom(spec)) {
  const lines = [
    `${spec.designation} "${spec.nickname}" — ${spec.roleLabel} · parts manifest`,
    `Assemblies  ${bom.partCount} (${bom.partKinds} kinds) · components ${Math.round(Object.values(bom.components).reduce((a, b) => a + b, 0))} · fasteners ${bom.fasteners}`,
    `Mass        ${bom.massKg} kg of parts · ${bom.rawKg} kg raw stock`,
    `Load        ${(bom.drawW / 1000).toFixed(2)} kW draw${bom.genW ? ` · ${(bom.genW / 1000).toFixed(2)} kW generated` : ''} · ${(bom.heatGenW / 1000).toFixed(2)} kW heat vs ${(bom.coolW / 1000).toFixed(2)} kW cooling`,
    `Endurance   ${bom.energyKwh} kWh carried`,
    `Cost        ${bom.cr.toLocaleString()} cr (labour ${bom.labour.toLocaleString()})`,
    '',
  ];
  for (const d of bom.byDomain) {
    lines.push(`${d.label} — ${d.mass.toFixed(1)} kg · ${d.cr.toLocaleString()} cr`);
    for (const p of d.parts.slice(0, 6)) lines.push(`   ${String(p.count).padStart(3)}× ${p.name}${p.why ? '  (' + p.why + ')' : ''}`);
    if (d.parts.length > 6) lines.push(`   … ${d.parts.length - 6} more`);
  }
  const kinds = Object.entries(bom.byKind).sort((a, b) => b[1] - a[1]).slice(0, 8);
  lines.push('', 'Raw stock  ' + kinds.map(([k, kg]) => `${k} ${kg.toFixed(1)}kg`).join(' · '));
  return lines;
}
