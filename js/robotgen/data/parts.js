/* robotgen/src/data/parts.js — the robot parts catalogue.
 *
 * Same shape as STATIONGEN's parts list and NEWSHIPGEN's part catalogue: an id,
 * a name, a mass, net power and heat, and a bill of materials — here written as
 * counts of catalogue COMPONENTS (`c.*`), which roll up to raw `m.*` stock the
 * same way a ship part does. So a yard can quote a robot, a shuttle and a
 * station module off one manifest.
 *
 *   mass  kg           pwr  W (+ generates, − draws)      heat  W to reject
 *   bom   { componentId: count }   fractional counts are fine (half a harness run)
 *
 * A part is an ASSEMBLY, not a mesh: `bom.js` picks parts from the spec and
 * counts them, so the parts list and the geometry stay independently editable. */
import { COMPONENTS } from './catalog.js';

export const PART_DOMAINS = {
  fr: 'Frame & structure',
  ac: 'Actuation & joints',
  dr: 'Drive & locomotion',
  fl: 'Flight systems',
  pw: 'Power & distribution',
  sn: 'Sensors & head',
  cd: 'Computing, autonomy & comms',
  ee: 'End effectors & tools',
  ar: 'Armour & protection',
  wp: 'Weapons',
  kt: 'Career kit & payload',
  th: 'Thermal & environment',
  sv: 'Service, safety & interface',
};

export const PARTS = {};
const P = (id, name, o) => {
  if (PARTS[id]) throw new Error('duplicate part ' + id);
  const p = { id, name, mass: 1, pwr: 0, heat: 0, bom: {}, ...o };
  p.domain = id.split('.')[1];
  for (const k of Object.keys(p.bom)) if (!COMPONENTS[k]) throw new Error(`part ${id} lists unknown component ${k}`);
  PARTS[id] = p;
  return p;
};

/* ---- frame & structure ---------------------------------------------------- */
P('r.fr.spine_light',   'Light spine / core frame',        { mass: 3.2,  bom: { 'c.frame_rib': 3, 'c.frame_tube': 4, 'c.bolt_m4': 3, 'c.insert': 1 } });
P('r.fr.spine_std',     'Standard spine / core frame',     { mass: 9.0,  bom: { 'c.frame_rib': 6, 'c.frame_tube': 8, 'c.frame_al': 0.6, 'c.bolt_m6': 3, 'c.insert': 2 } });
P('r.fr.spine_heavy',   'Heavy spine / load frame',        { mass: 26.0, bom: { 'c.frame_rib': 10, 'c.frame_ti': 2.2, 'c.frame_al': 1.6, 'c.bolt_m6': 6, 'c.insert': 4 } });
P('r.fr.shell_panel',   'Body shell panel set',            { mass: 1.4,  bom: { 'c.shell_panel': 3, 'c.adhesive': 0.3, 'c.rivet': 0.4 } });
P('r.fr.chest_cavity',  'Chest cavity + equipment rack',   { mass: 4.0,  bom: { 'c.frame_rib': 2, 'c.honeycomb': 0.3, 'c.insert': 1, 'c.harness': 1 } });
P('r.fr.shoulder_yoke', 'Shoulder yoke / hardpoint beam',  { mass: 3.4,  bom: { 'c.frame_ti': 0.4, 'c.insert': 1.5, 'c.bolt_m6': 1 } });
P('r.fr.hip_girdle',    'Hip girdle + splay hardpoints',   { mass: 5.5,  bom: { 'c.frame_ti': 0.6, 'c.frame_rib': 2, 'c.bearing': 2 } });
P('r.fr.neck_column',   'Neck column + slip ring',         { mass: 1.6,  pwr: -4, bom: { 'c.servo_joint': 1, 'c.slip_ring': 0.2, 'c.bearing': 1 } });
P('r.fr.bumper_ring',   'Compliant bumper ring',           { mass: 1.1,  bom: { 'c.bumper_foam': 4, 'c.strain_net': 0.4 } });
P('r.fr.hardpoint',     'Universal hardpoint / rail',      { mass: 0.6,  bom: { 'c.insert': 0.4, 'c.connector': 1, 'c.bolt_m4': 0.5 } });

/* ---- actuation ------------------------------------------------------------ */
P('r.ac.joint_micro',   'Micro servo joint',               { mass: 0.15, pwr: -8,   bom: { 'c.servo_micro': 1, 'c.esc': 0.4 } });
P('r.ac.joint_light',   'Light servo joint',               { mass: 1.1,  pwr: -45,  heat: 12, bom: { 'c.servo_joint': 1, 'c.esc': 1, 'c.harness': 0.1 } });
P('r.ac.joint_std',     'Harmonic limb joint',             { mass: 3.2,  pwr: -160, heat: 40, bom: { 'c.hd_joint': 1, 'c.esc': 1, 'c.brake_park': 1, 'c.harness': 0.15 } });
P('r.ac.joint_heavy',   'Heavy hydraulic joint',           { mass: 8.5,  pwr: -420, heat: 130, bom: { 'c.hydraulic_ram': 2, 'c.hd_joint': 0.4, 'c.esc': 1, 'c.brake_park': 1 } });
P('r.ac.tendon_set',    'Tendon drive set',                { mass: 0.9,  pwr: -30,  bom: { 'c.tendon_drive': 1, 'c.servo_micro': 4 } });
P('r.ac.hydraulic_pack','Hydraulic power pack',            { mass: 11.0, pwr: -900, heat: 320, bom: { 'c.pump': 2, 'c.tank_liquid': 0.5, 'c.valve_latch': 6, 'c.coldplate': 1 } });

/* ---- drive & locomotion --------------------------------------------------- */
P('r.dr.leg_light',     'Light walking leg',               { mass: 4.6,  pwr: -180, heat: 45, bom: { 'c.hd_joint': 1, 'c.servo_joint': 2, 'c.frame_tube': 2, 'c.foot_pad': 1, 'c.esc': 2 } });
P('r.dr.leg_std',       'Standard walking leg',            { mass: 12.0, pwr: -420, heat: 110, bom: { 'c.hd_joint': 3, 'c.frame_tube': 3, 'c.foot_pad': 1, 'c.esc': 3, 'c.harness': 0.4 } });
P('r.dr.leg_heavy',     'Heavy load-bearing leg',          { mass: 31.0, pwr: -1100, heat: 300, bom: { 'c.hydraulic_ram': 3, 'c.hd_joint': 2, 'c.frame_ti': 1.2, 'c.foot_pad': 2, 'c.esc': 3 } });
P('r.dr.foot_claw',     'Gripping claw foot',              { mass: 1.5,  pwr: -25, bom: { 'c.servo_joint': 1, 'c.foot_pad': 1, 'c.tendon_drive': 0.5 } });
P('r.dr.wheel_unit',    'Driven wheel unit',               { mass: 5.4,  pwr: -260, heat: 70, bom: { 'c.wheel_hub': 1, 'c.tyre': 1, 'c.esc': 1, 'c.brake_park': 1 } });
P('r.dr.suspension',    'Suspension corner',               { mass: 3.0,  bom: { 'c.actuator': 0.6, 'c.bearing': 2, 'c.frame_tube': 1 } });
P('r.dr.gyro_balance',  'Balancing gyro pair',             { mass: 6.0,  pwr: -140, heat: 40, bom: { 'c.wheel_rotor': 0.8, 'c.imu_mems': 2, 'c.esc': 2 } });
P('r.dr.track_run',     'Track run (links + belt)',        { mass: 14.0, bom: { 'c.track_link': 34, 'c.tendon_drive': 1 } });
P('r.dr.track_drive',   'Sprocket + final drive',          { mass: 7.5,  pwr: -380, heat: 100, bom: { 'c.sprocket': 1, 'c.motor': 1, 'c.esc': 1, 'c.brake_park': 1 } });
P('r.dr.roadwheel_set', 'Road wheel + torsion arm',        { mass: 2.0,  bom: { 'c.roadwheel': 1 } });
P('r.dr.hover_fan',     'Hover lift fan',                  { mass: 2.6,  pwr: -800, heat: 180, bom: { 'c.lift_fan': 1, 'c.esc': 1, 'c.duct_ring': 1 } });
P('r.dr.hover_skirt',   'Hover skirt section',             { mass: 1.0,  bom: { 'c.skirt_seg': 2 } });
P('r.dr.thruster_vane', 'Vector vane + attitude jet',      { mass: 1.2,  pwr: -60, bom: { 'c.servo_joint': 1, 'c.control_surf': 1 } });

/* ---- flight --------------------------------------------------------------- */
P('r.fl.rotor_unit',    'Rotor unit (motor + blades)',     { mass: 1.5,  pwr: -700, heat: 90,  bom: { 'c.motor': 1, 'c.rotor_hub': 1, 'c.rotor_blade': 2, 'c.esc': 1 } });
P('r.fl.rotor_ducted',  'Ducted rotor unit',               { mass: 2.4,  pwr: -820, heat: 110, bom: { 'c.motor': 1, 'c.rotor_hub': 1, 'c.rotor_blade': 3, 'c.duct_ring': 1, 'c.esc': 1 } });
P('r.fl.boom',          'Rotor boom + wiring',             { mass: 0.5,  bom: { 'c.boom_arm': 1.5, 'c.harness': 0.15 } });
P('r.fl.tilt_nacelle',  'Tilt-rotor nacelle',              { mass: 1.9,  pwr: -80, bom: { 'c.servo_joint': 1, 'c.bearing': 1, 'c.frame_tube': 0.5 } });
P('r.fl.wing_panel',    'Wing panel + spar',               { mass: 1.3,  bom: { 'c.wing_panel': 1.4, 'c.frame_tube': 0.8 } });
P('r.fl.tail_group',    'Tail group + surfaces',           { mass: 0.9,  pwr: -20, bom: { 'c.wing_panel': 0.5, 'c.control_surf': 2 } });
P('r.fl.control_surf',  'Control surface + servo',         { mass: 0.35, pwr: -14, bom: { 'c.control_surf': 1 } });
P('r.fl.pusher_prop',   'Prop drive (motor + prop)',       { mass: 1.4,  pwr: -900, heat: 110, bom: { 'c.motor': 1, 'c.prop_disc': 1, 'c.esc': 1 } });
// a turbofan burns its own fuel: the tank is booked as stored energy and the
// pod's shaft power as draw, so endurance falls out of the same sum as a battery
P('r.fl.microjet',      'Micro turbofan pod',              { mass: 6.0,  pwr: -2600, heat: 900, kwh: 1.8, bom: { 'c.microjet': 1, 'c.tank_liquid': 0.4, 'c.valve_latch': 2 } });
P('r.fl.air_data',      'Air-data + flight IMU set',       { mass: 0.5,  pwr: -6, bom: { 'c.pitot': 1, 'c.imu_mems': 2, 'c.gnss_ant': 1 } });
P('r.fl.skid',          'Landing skid / gear leg',         { mass: 0.7,  bom: { 'c.landing_skid': 1 } });
P('r.fl.chute',         'Recovery parachute',              { mass: 1.0,  bom: { 'c.parachute': 1, 'c.sep_bolt': 1 } });

/* ---- power ---------------------------------------------------------------- */
P('r.pw.pack_small',    'Battery pack (0.5 kWh)',          { kwh: 0.5, mass: 2.6,  bom: { 'c.lipo_pack': 1, 'c.pdb': 0.5 } });
P('r.pw.pack_std',      'Battery pack (2 kWh)',            { kwh: 2.0, mass: 9.6,  bom: { 'c.lipo_pack': 4, 'c.pdb': 1 } });
P('r.pw.pack_large',    'Battery bank (6 kWh)',            { kwh: 6.0, mass: 28.0, bom: { 'c.lipo_pack': 11, 'c.pdb': 2, 'c.coldplate': 1 } });
P('r.pw.fuel_cell',     'Fuel-cell range extender',        { mass: 8.5,  pwr: 1000, heat: 900, bom: { 'c.fuel_cell_sm': 1, 'c.tank_liquid': 1, 'c.regulator': 1 } });
P('r.pw.solar_wing',    'Folding solar wing',              { mass: 1.6,  pwr: 120, bom: { 'c.solar_wing_sm': 1.5, 'c.hinge': 1, 'c.pdb': 0.3 } });
P('r.pw.isotope',       'Isotope trickle charger',         { mass: 3.6,  pwr: 25, heat: 180, bom: { 'c.rtg_pellet': 1, 'c.thermoelectric': 0.5 } });
P('r.pw.bus',           'Power bus + protection',          { mass: 1.2,  pwr: -8, bom: { 'c.pdb': 1, 'c.converter': 0.3, 'c.harness': 1 } });
P('r.pw.charge_port',   'Dock / charge interface',         { mass: 0.8,  bom: { 'c.charge_port': 1, 'c.connector': 2 } });

/* ---- sensors & head ------------------------------------------------------- */
P('r.sn.optic_mono',    'Optic pod (mono)',                { mass: 0.35, pwr: -6,  bom: { 'c.cam_module': 1, 'c.glazing_sm': 1, 'c.pcb': 0.5 } });
P('r.sn.optic_stereo',  'Optic pod (stereo depth)',        { mass: 0.6,  pwr: -12, bom: { 'c.depth_pair': 1, 'c.glazing_sm': 2 } });
P('r.sn.optic_thermal', 'Thermal optic pod',               { mass: 0.5,  pwr: -9,  bom: { 'c.thermal_cam': 1, 'c.glazing_sm': 1 } });
P('r.sn.lidar',         'Spinning lidar head',             { mass: 1.1,  pwr: -18, heat: 12, bom: { 'c.lidar_puck': 1, 'c.pcb': 0.5 } });
P('r.sn.scanner_bar',   'Scan bar / structured light',     { mass: 0.4,  pwr: -10, bom: { 'c.lidar_head': 0.2, 'c.pcb': 0.6, 'c.glazing_sm': 1 } });
P('r.sn.radar_sm',      'Compact radar tile',              { mass: 1.6,  pwr: -40, heat: 25, bom: { 'c.radar_tile': 0.3, 'c.pcb': 1 } });
P('r.sn.sonar',         'Sonar / ultrasonic ring',         { mass: 0.7,  pwr: -8,  bom: { 'c.sonar_head': 1.5, 'c.pcb': 0.4 } });
P('r.sn.mic_array',     'Acoustic array',                  { mass: 0.3,  pwr: -4,  bom: { 'c.mic_array': 1, 'c.pcb': 0.4 } });
P('r.sn.imu',           'Navigation IMU + odometry',       { mass: 0.4,  pwr: -5,  bom: { 'c.imu_mems': 2, 'c.fog': 0.15, 'c.pcb': 0.5 } });
P('r.sn.gnss',          'GNSS + compass',                  { mass: 0.3,  pwr: -3,  bom: { 'c.gnss_ant': 1, 'c.pcb': 0.4 } });
P('r.sn.chem',          'Chemical sniffer',                { mass: 0.7,  pwr: -12, bom: { 'c.chem_sniffer': 1 } });
P('r.sn.rad_probe',     'Radiation probe',                 { mass: 0.4,  pwr: -3,  bom: { 'c.geiger': 1 } });
P('r.sn.gpr',           'Ground-penetrating radar',        { mass: 2.6,  pwr: -60, heat: 30, bom: { 'c.gpr_array': 1 } });
P('r.sn.spectro',       'Spectrometer head',               { mass: 1.3,  pwr: -20, bom: { 'c.spectro_head': 1 } });
P('r.sn.xray',          'Backscatter X-ray head',          { mass: 7.0,  pwr: -220, heat: 160, bom: { 'c.xray_backsc': 1 } });
P('r.sn.mast',          'Sensor mast + rotator',           { mass: 2.2,  pwr: -25, bom: { 'c.telescopic': 0.3, 'c.motor': 1, 'c.lidar_puck': 0.5 } });

/* ---- compute, autonomy, comms --------------------------------------------- */
P('r.cd.cpu_core',      'Flight / motion controller',      { mass: 0.6,  pwr: -25, heat: 20, bom: { 'c.cpu_tmr': 1, 'c.pcb': 2, 'c.connector': 3 } });
P('r.cd.autonomy',      'Autonomy stack (inference)',      { mass: 1.4,  pwr: -120, heat: 110, bom: { 'c.nn_module': 2, 'c.pcb': 2, 'c.coldplate': 0.3 } });
P('r.cd.safety',        'Safety controller + E-stop',      { mass: 1.0,  pwr: -8,  bom: { 'c.safety_plc': 1, 'c.estop': 1, 'c.harness': 0.4 } });
P('r.cd.radio',         'Mesh radio + antennas',           { mass: 0.6,  pwr: -18, bom: { 'c.mesh_radio': 1, 'c.antenna_whip': 2 } });
P('r.cd.datalink',      'Long-range datalink',             { mass: 1.8,  pwr: -55, heat: 30, bom: { 'c.fpga': 1, 'c.rf_switch': 1, 'c.twta': 0.3, 'c.feedhorn': 1 } });
P('r.cd.dish',          'Steerable dish / relay head',     { mass: 2.4,  pwr: -30, bom: { 'c.feedhorn': 1, 'c.motor': 2, 'c.dish_cfrp': 0.2 } });
P('r.cd.harness',       'Internal harness run',            { mass: 1.0,  bom: { 'c.harness': 0.5, 'c.connector': 4 } });
P('r.cd.recorder',      'Mission recorder / evidence log', { mass: 0.5,  pwr: -6, bom: { 'c.pcb': 1, 'c.memory': 0.3 } });

/* ---- end effectors & tools ------------------------------------------------ */
P('r.ee.gripper',       'Two-finger gripper',              { mass: 1.6,  pwr: -40, bom: { 'c.gripper_2f': 1, 'c.tool_changer': 0.4 } });
P('r.ee.hand',          'Dexterous five-finger hand',      { mass: 3.1,  pwr: -70, heat: 20, bom: { 'c.hand_5f': 1, 'c.pcb': 1 } });
P('r.ee.claw',          'Utility claw',                    { mass: 2.0,  pwr: -45, bom: { 'c.gripper_2f': 1, 'c.servo_joint': 1 } });
P('r.ee.clamp',         'Heavy industrial clamp',          { mass: 10.5, pwr: -300, heat: 60, bom: { 'c.clamp_heavy': 1, 'c.tool_changer': 0.5 } });
P('r.ee.drill',         'Rotary drill / core head',        { mass: 7.0,  pwr: -1400, heat: 400, bom: { 'c.drill_head': 1, 'c.tool_changer': 0.5 } });
P('r.ee.blade',         'Monofilament blade',              { mass: 2.6,  pwr: -20, bom: { 'c.mono_blade': 1, 'c.tool_changer': 0.4 } });
P('r.ee.beamfist',      'Projector fist',                  { mass: 5.2,  pwr: -1800, heat: 900, bom: { 'c.laser_sm': 0.3, 'c.capacitor': 3 } });
P('r.ee.welder',        'Weld / cut torch head',           { mass: 3.8,  pwr: -2200, heat: 1200, bom: { 'c.welder_head': 1, 'c.tool_changer': 0.4 } });
P('r.ee.saw',           'Saw head',                        { mass: 4.4,  pwr: -1600, heat: 350, bom: { 'c.saw_head': 1, 'c.tool_changer': 0.4 } });
P('r.ee.spray',         'Spray boom + nozzles',            { mass: 1.4,  pwr: -80, bom: { 'c.spray_head': 1, 'c.pump': 0.2 } });
P('r.ee.vac',           'Vacuum / decon head',             { mass: 2.5,  pwr: -600, heat: 120, bom: { 'c.vac_head': 1 } });
P('r.ee.sampler',       'Sample scoop + vial rack',        { mass: 2.1,  pwr: -25, bom: { 'c.sampler_arm': 1 } });
P('r.ee.auger',         'Soil auger / probe',              { mass: 3.4,  pwr: -900, heat: 200, bom: { 'c.auger_head': 1 } });
P('r.ee.tray',          'Service tray + stabiliser',       { mass: 1.6,  pwr: -15, bom: { 'c.tray_service': 1 } });
P('r.ee.medkit',        'Field medical pack + arm',        { mass: 7.0,  pwr: -40, bom: { 'c.med_pack': 1, 'c.servo_joint': 1 } });
P('r.ee.winch',         'Cable winch',                     { mass: 6.2,  pwr: -700, heat: 150, bom: { 'c.winch': 1 } });
P('r.ee.disruptor',     'EOD disruptor',                   { mass: 8.2,  pwr: -30, bom: { 'c.disruptor': 1 } });

/* ---- armour & protection --------------------------------------------------- */
P('r.ar.plate',         'Armour plate section',            { mass: 2.0,  bom: { 'c.armor_tile': 1, 'c.bolt_m6': 0.3 } });
P('r.ar.composite',     'Composite panel section',         { mass: 1.3,  bom: { 'c.armor_tile': 0.6, 'c.honeycomb': 0.2, 'c.adhesive': 0.2 } });
P('r.ar.ablative',      'Ablative panel section',          { mass: 1.1,  bom: { 'c.ablative_tile': 1, 'c.adhesive': 0.2 } });
P('r.ar.riot',          'Riot panel section',              { mass: 1.8,  bom: { 'c.riot_shield': 0.4, 'c.bumper_foam': 1 } });
P('r.ar.shield_riot',   'Riot shield + arm',               { mass: 6.0,  bom: { 'c.riot_shield': 1, 'c.frame_tube': 2, 'c.actuator': 0.3 } });
P('r.ar.shield_field',  'Field emitter ring',              { mass: 12.0, pwr: -3000, heat: 1400, bom: { 'c.shield_emit': 1, 'c.capacitor': 4 } });
P('r.ar.seal_ip',       'Sealed / washdown enclosure kit', { mass: 1.5,  bom: { 'c.seal_oring': 4, 'c.filter': 2, 'c.fan': 0.3 } });
P('r.ar.rad_liner',     'Radiation liner',                 { mass: 5.0,  bom: { 'c.pe_shield': 0.5, 'c.b4c_tile': 0.4 } });

/* ---- weapons --------------------------------------------------------------- */
P('r.wp.smallarm',      'Integrated small-arm',            { mass: 6.5,  pwr: -20, bom: { 'c.gun_barrel': 0.15, 'c.ammo_feed': 0.15, 'c.fire_control': 0.2 } });
P('r.wp.autocannon',    'Light autocannon mount',          { mass: 44.0, pwr: -120, heat: 80, bom: { 'c.autocannon_sm': 1, 'c.turret_ring': 0.2, 'c.fire_control': 0.3 } });
P('r.wp.gatling',       'Rotary cannon mount',             { mass: 21.0, pwr: -900, heat: 300, bom: { 'c.gatling_sm': 1, 'c.turret_ring': 0.15 } });
P('r.wp.grenade',       'Grenade launcher mount',          { mass: 14.0, pwr: -40, bom: { 'c.grenade_lchr': 1, 'c.fire_control': 0.2 } });
P('r.wp.missiles',      'Missile rack',                    { mass: 13.0, pwr: -60, bom: { 'c.missile_rack': 1, 'c.fire_control': 0.3 } });
P('r.wp.beam',          'Beam projector mount',            { mass: 18.0, pwr: -6000, heat: 4200, bom: { 'c.laser_sm': 1, 'c.capacitor': 6, 'c.coldplate': 2 } });
P('r.wp.mortar',        'Light mortar',                    { mass: 11.0, pwr: -25, bom: { 'c.mortar_sm': 1, 'c.fire_control': 0.2 } });
P('r.wp.smoke',         'Smoke / obscurant bank',          { mass: 3.0,  pwr: -10, bom: { 'c.smoke_tube': 4, 'c.pcb': 0.4 } });
P('r.wp.taser',         'Less-lethal stunner',             { mass: 1.8,  pwr: -200, bom: { 'c.taser_head': 1 } });
P('r.wp.netgun',        'Capture-net launcher',            { mass: 2.8,  pwr: -15, bom: { 'c.net_launcher': 1 } });
P('r.wp.jammer',        'EW / jammer pod',                 { mass: 4.2,  pwr: -800, heat: 500, bom: { 'c.jammer_pod': 1 } });
P('r.wp.sight',         'Sight / optic mod',               { mass: 0.5,  pwr: -4, bom: { 'c.cam_module': 1, 'c.glazing_sm': 1 } });
P('r.wp.laser_sight',   'Laser designator',                { mass: 0.3,  pwr: -8, bom: { 'c.pcb': 0.5, 'c.glazing_sm': 1 } });
P('r.wp.muzzle',        'Muzzle device',                   { mass: 0.6,  bom: { 'c.gun_barrel': 0.02 } });
P('r.wp.magazine',      'Magazine / cell',                 { mass: 2.4,  bom: { 'c.magazine': 0.06, 'c.ammo_feed': 0.05 } });
P('r.wp.underbarrel',   'Underbarrel module',              { mass: 1.4,  pwr: -6, bom: { 'c.grenade_lchr': 0.08, 'c.work_lamp': 0.5 } });

/* ---- career kit & payload --------------------------------------------------- */
P('r.kt.cargo_rack',    'Cargo rack + bins',               { mass: 6.0,  bom: { 'c.cargo_bin': 1.5, 'c.rack_frame': 0.2, 'c.latch': 2 } });
P('r.kt.forks',         'Pallet fork set',                 { mass: 16.0, pwr: -400, heat: 90, bom: { 'c.pallet_fork': 1, 'c.hydraulic_ram': 0.5 } });
P('r.kt.tank',          'Liquid payload tank',             { mass: 3.0,  bom: { 'c.tank_liquid': 1, 'c.pump': 0.3 } });
P('r.kt.hopper',        'Seed / granule hopper',           { mass: 4.2,  pwr: -60, bom: { 'c.seed_hopper': 1 } });
P('r.kt.hose_reel',     'Hose reel + line',                { mass: 9.0,  pwr: -120, bom: { 'c.hose_reel': 1 } });
P('r.kt.fire_monitor',  'Fire monitor nozzle',             { mass: 5.2,  pwr: -80, bom: { 'c.fire_nozzle': 1 } });
P('r.kt.decon',         'Decon foam kit',                  { mass: 4.4,  pwr: -70, bom: { 'c.decon_kit': 1 } });
P('r.kt.drone_bay',     'Micro-drone bay',                 { mass: 5.4,  pwr: -90, heat: 40, bom: { 'c.drone_bay': 1 } });
P('r.kt.relay_mast',    'Deployable relay mast',           { mass: 3.4,  pwr: -35, bom: { 'c.relay_mast': 1 } });
P('r.kt.sample_rack',   'Sealed sample rack',              { mass: 2.6,  pwr: -20, bom: { 'c.sampler_arm': 0.6, 'c.cargo_bin': 0.4 } });
P('r.kt.jetpack',       'Jump / assist jetpack',           { mass: 12.0, pwr: -200, heat: 800, bom: { 'c.rcs_thruster': 4, 'c.tank_liquid': 1.5, 'c.valve_latch': 4 } });
P('r.kt.grapple',       'Grapple / line launcher',         { mass: 4.0,  pwr: -60, bom: { 'c.grapple': 1 } });
P('r.kt.stretcher',     'Rescue stretcher cradle',         { mass: 7.5,  bom: { 'c.frame_tube': 6, 'c.rack_frame': 0.2 } });
P('r.kt.camera_ball',   'Gimbal camera ball',              { mass: 1.2,  pwr: -25, bom: { 'c.cam_module': 2, 'c.thermal_cam': 1, 'c.servo_micro': 3, 'c.gimbal': 0.02 } });
P('r.kt.mapping_pod',   'Survey / mapping pod',            { mass: 2.8,  pwr: -60, heat: 25, bom: { 'c.lidar_puck': 1, 'c.cam_module': 2, 'c.gnss_ant': 1, 'c.pcb': 2 } });
P('r.kt.speaker',       'Hailer / loudspeaker',            { mass: 1.0,  pwr: -60, bom: { 'c.speaker': 2 } });
P('r.kt.display',       'Status / face display',           { mass: 0.7,  pwr: -15, bom: { 'c.display_pan': 1.5 } });
P('r.kt.siren',         'Siren + light bar',               { mass: 1.6,  pwr: -70, bom: { 'c.siren': 1 } });
P('r.kt.toolboard',     'Tool board / changer rack',       { mass: 3.2,  bom: { 'c.tool_changer': 2, 'c.rack_frame': 0.1 } });

/* ---- thermal & environment --------------------------------------------------- */
P('r.th.fan_loop',      'Forced-air cooling loop',         { mass: 1.4,  pwr: -45, heat: -600, bom: { 'c.fan': 1, 'c.filter': 1, 'c.coldplate': 0.3 } });
P('r.th.liquid_loop',   'Pumped liquid cooling loop',      { mass: 4.0,  pwr: -90, heat: -2400, bom: { 'c.pump': 1, 'c.coldplate': 2, 'c.heatpipe': 2, 'c.radiator_panel': 0.4 } });
P('r.th.radiator',      'Body radiator panel',             { mass: 1.8,  heat: -700, bom: { 'c.radiator_panel': 0.4, 'c.heatpipe': 1 } });
P('r.th.heater',        'Survival heater set',             { mass: 0.5,  pwr: -60, bom: { 'c.heater': 4 } });
P('r.th.dust_seal',     'Dust / splash sealing',           { mass: 0.8,  bom: { 'c.seal_oring': 3, 'c.filter': 1 } });

/* ---- service, safety, interface --------------------------------------------- */
P('r.sv.beacon',        'Hazard beacon set',               { mass: 0.4,  pwr: -18, bom: { 'c.beacon_led': 3 } });
P('r.sv.worklamp',      'Work lamp set',                   { mass: 0.7,  pwr: -55, bom: { 'c.work_lamp': 2 } });
P('r.sv.service_panel', 'Service hatch + diagnostics port',{ mass: 1.1,  bom: { 'c.hatch': 0.05, 'c.connector': 3, 'c.pcb': 0.3 } });
P('r.sv.id_plate',      'Designation plate + livery',      { mass: 0.2,  bom: { 'c.shell_panel': 0.3, 'c.adhesive': 0.2 } });
P('r.sv.transponder',   'Identify / transponder',          { mass: 0.3,  pwr: -5, bom: { 'c.uwb_tag': 2, 'c.pcb': 0.4 } });

/* ---- micro tier — sub-metre scouts and inspection flyers ------------------- */
P('r.fr.spine_micro',   'Micro airframe plate stack',      { mass: 0.25, bom: { 'c.frame_micro': 3, 'c.bolt_m4': 0.2 } });
P('r.fr.shell_micro',   'Micro shell / canopy',            { mass: 0.10, bom: { 'c.shell_micro': 2 } });
P('r.fr.hardpoint_mi',  'Micro payload rail',              { mass: 0.05, bom: { 'c.frame_micro': 0.5, 'c.connector': 0.1 } });
P('r.fl.rotor_micro',   'Micro rotor unit',                { mass: 0.14, pwr: -170, heat: 22, bom: { 'c.motor_micro': 1, 'c.hub_micro': 1, 'c.blade_micro': 2, 'c.esc_micro': 1 } });
P('r.fl.rotor_micro_d', 'Micro ducted rotor unit',         { mass: 0.20, pwr: -195, heat: 26, bom: { 'c.motor_micro': 1, 'c.hub_micro': 1, 'c.blade_micro': 3, 'c.duct_micro': 1, 'c.esc_micro': 1 } });
P('r.fl.boom_micro',    'Micro boom + wiring',             { mass: 0.05, bom: { 'c.boom_micro': 1.4 } });
P('r.fl.wing_micro',    'Micro wing panel',                { mass: 0.12, bom: { 'c.wing_micro': 1.2 } });
P('r.fl.tail_micro',    'Micro tail group',                { mass: 0.09, pwr: -4, bom: { 'c.wing_micro': 0.5, 'c.surf_micro': 1.5 } });
P('r.fl.surf_micro',    'Micro control surface',           { mass: 0.03, pwr: -3, bom: { 'c.surf_micro': 1 } });
P('r.fl.prop_micro',    'Micro prop drive',                { mass: 0.12, pwr: -190, heat: 20, bom: { 'c.motor_micro': 1.4, 'c.prop_micro': 1, 'c.esc_micro': 1 } });
P('r.fl.airdata_micro', 'Micro air-data + IMU',            { mass: 0.09, pwr: -2, bom: { 'c.imu_mems': 1, 'c.gnss_micro': 1, 'c.pcb_sm': 0.5 } });
P('r.fl.skid_micro',    'Micro landing skid',              { mass: 0.05, bom: { 'c.skid_micro': 1 } });
P('r.fl.chute_micro',   'Micro recovery chute',            { mass: 0.15, bom: { 'c.chute_micro': 1 } });
P('r.pw.pack_micro',    'Micro flight battery',            { kwh: 0.08, mass: 0.32, bom: { 'c.batt_micro': 1, 'c.pcb_sm': 0.5 } });
P('r.pw.bus_micro',     'Micro power board',               { mass: 0.08, pwr: -1, bom: { 'c.pcb_sm': 1, 'c.connector': 0.4 } });
P('r.pw.charge_micro',  'Micro charge contacts',           { mass: 0.05, bom: { 'c.connector': 1, 'c.pcb_sm': 0.2 } });
P('r.sn.optic_micro',   'Micro optic',                     { mass: 0.06, pwr: -1.5, bom: { 'c.cam_micro': 1, 'c.glazing_sm': 0.2 } });
P('r.sn.imu_micro',     'Micro IMU',                       { mass: 0.07, pwr: -1, bom: { 'c.imu_mems': 1, 'c.pcb_sm': 0.3 } });
P('r.sn.gnss_micro',    'Micro GNSS',                      { mass: 0.05, pwr: -0.8, bom: { 'c.gnss_micro': 1 } });
P('r.sn.lidar_micro',   'Micro ranging lidar',             { mass: 0.16, pwr: -4, bom: { 'c.lidar_micro': 1 } });
P('r.sn.scan_micro',    'Micro scan bar',                  { mass: 0.07, pwr: -2, bom: { 'c.lidar_micro': 0.4, 'c.pcb_sm': 0.4 } });
P('r.cd.cpu_micro',     'Micro flight controller',         { mass: 0.08, pwr: -6, heat: 4, bom: { 'c.pcb_sm': 1.2, 'c.connector': 0.6 } });
P('r.cd.autonomy_micro','Micro inference module',          { mass: 0.12, pwr: -28, heat: 24, bom: { 'c.nn_module': 0.2, 'c.pcb_sm': 0.6 } });
P('r.cd.safety_micro',  'Micro failsafe + geofence',       { mass: 0.06, pwr: -1, bom: { 'c.pcb_sm': 0.8 } });
P('r.cd.radio_micro',   'Micro datalink',                  { mass: 0.06, pwr: -4, bom: { 'c.radio_micro': 1, 'c.antenna_whip': 0.05 } });
P('r.cd.harness_micro', 'Micro harness',                   { mass: 0.05, bom: { 'c.harness': 0.02, 'c.connector': 0.4 } });
P('r.ee.gripper_micro', 'Micro gripper',                   { mass: 0.12, pwr: -5, bom: { 'c.gripper_micro': 1 } });
P('r.th.fan_micro',     'Micro cooling fan',               { mass: 0.06, pwr: -3, heat: -60, bom: { 'c.pcb_sm': 0.2, 'c.motor_micro': 0.4 } });
P('r.kt.camera_micro',  'Micro gimbal camera',             { mass: 0.16, pwr: -5, bom: { 'c.gimbal_micro': 1, 'c.cam_micro': 2 } });
P('r.kt.mapping_micro', 'Micro survey pod',                { mass: 0.36, pwr: -14, bom: { 'c.lidar_micro': 1.5, 'c.cam_micro': 2, 'c.gnss_micro': 1, 'c.pcb_sm': 1 } });
P('r.kt.thermal_micro', 'Micro thermal pod',               { mass: 0.14, pwr: -4, bom: { 'c.thermal_cam': 0.35, 'c.pcb_sm': 0.3 } });
P('r.kt.relay_micro',   'Micro relay pod',                 { mass: 0.20, pwr: -7, bom: { 'c.radio_micro': 2, 'c.antenna_whip': 0.3, 'c.pcb_sm': 0.5 } });
P('r.kt.tank_micro',    'Micro payload tank',              { mass: 0.30, pwr: -6, bom: { 'c.tank_micro': 1.5, 'c.spray_head': 0.1 } });
P('r.kt.cargo_micro',   'Micro cargo bin / hook',          { mass: 0.26, bom: { 'c.bin_micro': 1.5, 'c.latch': 0.1 } });
P('r.kt.hailer_micro',  'Micro hailer',                    { mass: 0.12, pwr: -9, bom: { 'c.speaker_micro': 1.2 } });
P('r.kt.spot_micro',    'Micro searchlight',               { mass: 0.10, pwr: -12, bom: { 'c.work_lamp': 0.25, 'c.pcb_sm': 0.3 } });
P('r.sv.beacon_micro',  'Micro nav strobes',               { mass: 0.05, pwr: -2, bom: { 'c.led_micro': 2 } });
P('r.sv.id_micro',      'Micro ident plate + tag',         { mass: 0.03, pwr: -0.5, bom: { 'c.uwb_tag': 0.4, 'c.shell_micro': 0.1 } });
P('r.dr.leg_micro',     'Micro walking leg',               { mass: 0.35, pwr: -22, heat: 5, bom: { 'c.servo_micro': 3, 'c.boom_micro': 2, 'c.esc_micro': 1 } });

/* ---- mass reconciliation -----------------------------------------------------
 * The components decide. Where a part's listed components already weigh more
 * than the part was pencilled in at, the part's mass is raised to what it is
 * actually made of; where they weigh less, the difference is filled with the
 * structure a real assembly carries anyway — frame, shell, fasteners — exactly
 * the way NEWSHIPGEN fills a part out to its mass. After this pass every part
 * satisfies  Σ(component mass) == part.mass,  so the manifest cannot quietly
 * invent or lose kilograms on the way down to raw stock. */
const FILL_STD = [['c.frame_rib', 0.55], ['c.shell_panel', 0.35], ['c.bolt_m4', 0.10]];
const FILL_MICRO = [['c.frame_micro', 0.55], ['c.shell_micro', 0.35], ['c.bolt_m4', 0.10]];
function bomKg(bom) {
  let kg = 0;
  for (const [c, q] of Object.entries(bom)) kg += q * COMPONENTS[c].kg;
  return kg;
}
export function reconcileParts() {
  const report = { raised: [], filled: 0 };
  for (const p of Object.values(PARTS)) {
    const have = bomKg(p.bom);
    if (have > p.mass) {
      report.raised.push({ id: p.id, from: p.mass, to: Math.round(have * 1000) / 1000 });
      p.mass = Math.round(have * 1000) / 1000;
      p.massSource = 'components';
      continue;
    }
    const gap = p.mass - have;
    if (gap <= 1e-6) { p.massSource = 'exact'; continue; }
    const fill = p.mass < 0.5 ? FILL_MICRO : FILL_STD;
    for (const [c, share] of fill) {
      const q = (gap * share) / COMPONENTS[c].kg;
      if (q > 1e-9) p.bom[c] = (p.bom[c] || 0) + Math.round(q * 10000) / 10000;
    }
    p.massSource = 'filled';
    report.filled++;
  }
  return report;
}

/* ---- micro-tier stores: what a sub-metre airframe is actually allowed to carry -- */
P('r.wp.missiles_micro','Micro munition rail (2 tube)',    { mass: 2.0,  pwr: -8, bom: { 'c.smoke_tube': 1.6, 'c.pcb_sm': 2, 'c.sep_bolt': 1 } });
P('r.wp.smallarm_micro','Micro weapon pod',                { mass: 0.9,  pwr: -6, bom: { 'c.gun_barrel': 0.015, 'c.pcb_sm': 1, 'c.frame_micro': 2 } });
P('r.wp.jammer_micro',  'Micro EW pod',                    { mass: 0.7,  pwr: -120, heat: 90, bom: { 'c.tr_module': 1, 'c.pcb_sm': 2 } });
P('r.wp.mag_micro',     'Micro magazine',                  { mass: 0.25, bom: { 'c.frame_micro': 2, 'c.pcb_sm': 0.4 } });
P('r.ar.plate_micro',   'Micro armour patch',              { mass: 0.35, bom: { 'c.armor_tile': 0.2 } });
P('r.ar.composite_micro','Micro composite patch',          { mass: 0.25, bom: { 'c.armor_tile': 0.12, 'c.shell_micro': 0.5 } });
P('r.wp.sight_micro',   'Micro sight',                     { mass: 0.09, pwr: -2, bom: { 'c.cam_micro': 1.5, 'c.pcb_sm': 0.4 } });
P('r.ee.tool_micro',    'Micro tool head',                 { mass: 0.14, pwr: -6, bom: { 'c.gripper_micro': 1, 'c.pcb_sm': 0.3 } });

P('r.dr.hover_micro',   'Micro lift fan',                  { mass: 0.30, pwr: -240, heat: 40, bom: { 'c.motor_micro': 2, 'c.duct_micro': 1, 'c.esc_micro': 1 } });
P('r.dr.skirt_micro',   'Micro hover skirt section',       { mass: 0.09, bom: { 'c.skirt_seg': 0.16 } });


/* ---- v1.7: the hardware the taxonomy grew ---------------------------------- */
P('r.wp.railgun',       'Shoulder railgun',                { mass: 52.0, pwr: -9000, heat: 5200, bom: { 'c.rail_barrel': 0.32, 'c.capacitor': 6, 'c.power_switch': 8, 'c.turret_ring': 0.2 } });
P('r.kt.winch_mount',   'Shoulder winch + cable',          { mass: 7.4,  pwr: -800, heat: 160, bom: { 'c.winch': 1, 'c.frame_rib': 2 } });
P('r.sv.floodlight',    'Floodlight head',                 { mass: 2.2,  pwr: -220, heat: 120, bom: { 'c.work_lamp': 3, 'c.servo_joint': 1, 'c.pcb': 0.5 } });
P('r.ee.repair_arm',    'Repair arm (welder head)',        { mass: 9.0,  pwr: -1800, heat: 900, bom: { 'c.hd_joint': 2, 'c.welder_head': 1, 'c.cam_module': 1 } });
P('r.wp.flare',         'Flare / decoy rack',              { mass: 2.6,  pwr: -12, bom: { 'c.chaff_tube': 1, 'c.smoke_tube': 1.5, 'c.pcb': 0.4 } });
P('r.pw.powerspine',    'Power spine (capacitor bank)',    { mass: 14.0, pwr: -40, heat: 200, kwh: 1.2, bom: { 'c.supercap': 0.5, 'c.busbar': 2, 'c.pdb': 2, 'c.harness': 1 } });
P('r.cd.satdish',       'Back sat-comm dish',              { mass: 5.0,  pwr: -60, heat: 25, bom: { 'c.dish_cfrp': 0.4, 'c.feedhorn': 1, 'c.motor': 1, 'c.twta': 0.4 } });
P('r.kt.dronerack',     'Drone rack (3 bays)',             { mass: 6.6,  pwr: -110, heat: 45, bom: { 'c.drone_bay': 1, 'c.drone': 0.2, 'c.pcb': 1 } });
P('r.ee.harpoon',       'Harpoon / line thrower',          { mass: 5.0,  pwr: -40, bom: { 'c.grapple': 1, 'c.tool_changer': 0.4 } });
P('r.ee.multitool',     'Multitool head (4 bit)',          { mass: 3.6,  pwr: -420, heat: 90, bom: { 'c.tool_changer': 1, 'c.motor': 1, 'c.gripper_2f': 0.4 } });
P('r.ee.ram',           'Hydraulic ram fist',              { mass: 11.0, pwr: -1300, heat: 260, bom: { 'c.hydraulic_ram': 2, 'c.clamp_heavy': 0.3 } });
P('r.ar.shield_emitter','Arm field emitter',               { mass: 7.5,  pwr: -2200, heat: 1100, bom: { 'c.shield_emit': 0.6, 'c.capacitor': 2 } });

export const RECONCILE = reconcileParts();
