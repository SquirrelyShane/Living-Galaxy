/* robotgen/src/data/catalog.js — the shared build parts list.
 *
 * `catalog-base.js` is a VERBATIM copy of NEWSHIPGEN/src/data/materials.js, so a
 * robot, a ship and a station are all quoted out of the same stock: the same
 * material ids (`m.*`) and the same manufactured components (`c.*`), with the
 * same unit masses. Nothing here rewrites a shared id — this file only ADDS the
 * small, robot-scale hardware the ship catalogue has no reason to carry
 * (servos, harmonic joints, rotor blades, tyres, track links, hand tools).
 *
 * MATERIALS   raw stock                    { name, kind }
 * COMPONENTS  manufactured items           { name, kg, bom }   bom: kg of a material, or count of a sub-component
 * KIND_PRICE  book price per kg by kind, and FAB_RATE over stock — the same
 *             two-step costing STATIONGEN uses, so estimates are comparable.
 *
 * STATION_ALIAS maps STATIONGEN's bare material ids onto the prefixed ones, so a
 * station BOM and a robot BOM can be summed without a translation pass.
 */
import { MATERIALS as SHIP_MATERIALS, COMPONENTS as SHIP_COMPONENTS } from './catalog-base.js';

const C = (name, kg, bom) => ({ name, kg, bom });

/* ---- robot-scale materials the ship list does not stock ------------------ */
const ROBOT_MATERIALS = {
  'm.abs':        { name: 'ABS / PA12 printed polymer', kind: 'polymer' },
  'm.tpu':        { name: 'TPU elastomer',              kind: 'polymer' },
  'm.rubber':     { name: 'Filled rubber compound',     kind: 'polymer' },
  'm.uhmwpe':     { name: 'UHMWPE fibre',               kind: 'composite' },
  'm.foam_eva':   { name: 'Closed-cell EVA foam',       kind: 'polymer' },
  'm.mg_az31':    { name: 'AZ31 magnesium sheet',       kind: 'light metal' },
  'm.balsa_core': { name: 'Structural core (balsa/PET)',kind: 'composite' },
  'm.pmma':       { name: 'PMMA / polycarbonate glazing', kind: 'glass' },
  'm.ndfeb_sm':   { name: 'Sintered NdFeB (small arc)', kind: 'magnet' },
  'm.foam_meta':  { name: 'RF metamaterial foam',       kind: 'insulation' },
  'm.agent_afff': { name: 'Fire-suppressant concentrate', kind: 'consumable' },
  'm.agent_decon':{ name: 'Decontamination agent',      kind: 'consumable' },
  'm.seed_stock': { name: 'Seed / inoculant stock',     kind: 'bio' },
  'm.fert':       { name: 'Fertiliser concentrate',     kind: 'bio' },
};

/* ---- robot-scale components --------------------------------------------- */
const ROBOT_COMPONENTS = {
  /* micro-scale hardware — a 0.5 m scout is not a small starship */
  'c.motor_micro':  C('Micro BLDC motor',                  0.055,{ 'm.cu': 0.02, 'm.ndfeb_sm': 0.01, 'm.al6061': 0.025 }),
  'c.esc_micro':    C('Micro ESC',                         0.020,{ 'c.pcb_sm': 0.33 }),
  'c.pcb_sm':       C('Small PCB assembly',                0.060,{ 'm.si': 0.005, 'm.cu': 0.02, 'm.fused_si': 0.02, 'm.solder': 0.015 }),
  'c.blade_micro':  C('Micro rotor blade',                 0.012,{ 'm.cfrp': 0.012 }),
  'c.hub_micro':    C('Micro rotor hub',                   0.020,{ 'm.al6061': 0.02 }),
  'c.boom_micro':   C('Micro boom arm',                    0.030,{ 'm.cfrp': 0.03 }),
  'c.duct_micro':   C('Micro fan shroud',                  0.045,{ 'm.abs': 0.03, 'm.cfrp': 0.015 }),
  'c.frame_micro':  C('Micro frame plate',                 0.060,{ 'm.cfrp': 0.04, 'm.abs': 0.02 }),
  'c.shell_micro':  C('Micro shell / canopy',              0.050,{ 'm.abs': 0.04, 'm.pmma': 0.01 }),
  'c.batt_micro':   C('Micro flight battery (80 Wh)',      0.280,{ 'm.li': 0.2, 'm.abs': 0.05, 'm.cu': 0.03 }),
  'c.cam_micro':    C('Micro camera module',               0.035,{ 'c.pcb_sm': 0.4, 'c.glazing_sm': 0.07 }),
  'c.gimbal_micro': C('Micro 3-axis gimbal',               0.080,{ 'c.servo_micro': 0.5, 'm.abs': 0.03 }),
  'c.radio_micro':  C('Micro datalink + antenna',          0.040,{ 'c.pcb_sm': 0.5, 'm.cu': 0.01 }),
  'c.gnss_micro':   C('Micro GNSS patch',                  0.030,{ 'c.pcb_sm': 0.4, 'm.al6061': 0.005 }),
  'c.lidar_micro':  C('Micro ranging lidar',               0.120,{ 'c.pcb_sm': 1, 'c.glazing_sm': 0.25, 'm.al6061': 0.02 }),
  'c.wing_micro':   C('Micro wing panel 0.05 m²',          0.090,{ 'm.cfrp': 0.05, 'm.balsa_core': 0.03, 'm.epoxy': 0.01 }),
  'c.surf_micro':   C('Micro control surface + servo',     0.030,{ 'c.servo_micro': 0.22, 'm.cfrp': 0.01 }),
  'c.prop_micro':   C('Micro propeller + spinner',         0.020,{ 'm.cfrp': 0.015, 'm.abs': 0.005 }),
  'c.skid_micro':   C('Micro landing skid',                0.040,{ 'm.cfrp': 0.03, 'm.tpu': 0.01 }),
  'c.chute_micro':  C('Micro recovery chute',              0.120,{ 'm.uhmwpe': 0.08, 'm.abs': 0.03, 'c.sep_bolt': 0.02 }),
  'c.tank_micro':   C('Micro payload tank 2 L',            0.150,{ 'm.abs': 0.12, 'm.al6061': 0.03 }),
  'c.bin_micro':    C('Micro cargo bin',                   0.140,{ 'm.abs': 0.12, 'c.latch': 0.02 }),
  'c.speaker_micro':C('Micro hailer',                      0.080,{ 'm.ndfeb_sm': 0.02, 'm.abs': 0.03, 'c.pcb_sm': 0.5 }),
  'c.led_micro':    C('Micro strobe / nav light',          0.020,{ 'm.gan': 0.002, 'c.pcb_sm': 0.2, 'm.pmma': 0.005 }),
  'c.gripper_micro':C('Micro gripper',                     0.100,{ 'c.servo_micro': 0.8, 'm.abs': 0.02 }),
  /* structure */
  'c.frame_rib':    C('Robot frame rib / bulkhead',        0.45, { 'm.al6061': 0.3, 'm.cfrp': 0.15 }),
  'c.frame_tube':   C('Structural tube 0.5 m',             0.30, { 'm.cfrp': 0.22, 'm.al6061': 0.08 }),
  'c.shell_panel':  C('Moulded shell panel 0.1 m²',        0.35, { 'm.abs': 0.2, 'm.cfrp': 0.15 }),
  'c.armor_tile':   C('Ceramic/aramid armour tile 0.1 m²', 1.60, { 'm.b4c': 0.9, 'm.uhmwpe': 0.5, 'm.epoxy': 0.2 }),
  'c.ablative_tile':C('Ablative sacrificial tile 0.1 m²',  0.90, { 'm.pe': 0.5, 'm.epoxy': 0.2, 'm.alumina': 0.2 }),
  'c.riot_shield':  C('Riot shield panel',                 4.20, { 'm.pmma': 2.6, 'm.uhmwpe': 1.2, 'm.al6061': 0.4 }),
  'c.bumper_foam':  C('Compliant bumper section',          0.25, { 'm.foam_eva': 0.15, 'm.tpu': 0.1 }),
  'c.glazing_sm':   C('Small glazing / lens cover',        0.15, { 'm.pmma': 0.12, 'm.al6061': 0.03 }),
  /* actuation */
  'c.servo_micro':  C('Micro servo (2 Nm)',                0.09, { 'm.abs': 0.03, 'm.cu': 0.02, 'm.ndfeb_sm': 0.01, 'c.pcb': 0.06 }),
  'c.servo_joint':  C('Servo joint (25 Nm)',               0.85, { 'm.al6061': 0.35, 'm.cu': 0.2, 'm.ndfeb_sm': 0.08, 'c.pcb': 0.3, 'c.bearing': 0.15 }),
  'c.hd_joint':     C('Harmonic-drive limb joint',         2.60, { 'c.motor': 1, 'c.gearbox': 0.5, 'c.pcb': 0.4, 'm.ti64': 0.3 }),
  'c.hydraulic_ram':C('Hydraulic ram + line',              3.40, { 'm.steel304': 2.4, 'c.pump': 0.2, 'm.fkm': 0.15, 'm.ptfe': 0.1 }),
  'c.tendon_drive': C('Tendon / cable drive set',          0.55, { 'm.uhmwpe': 0.2, 'm.steel304': 0.2, 'c.bearing': 0.2 }),
  'c.esc':          C('Motor controller / ESC',            0.22, { 'c.pcb': 0.3, 'm.al6061': 0.06 }),
  'c.brake_park':   C('Fail-safe parking brake',           0.40, { 'm.steel304': 0.3, 'c.pcb': 0.1, 'm.ndfeb_sm': 0.02 }),
  /* drives */
  'c.wheel_hub':    C('Hub-motor wheel unit',              2.80, { 'c.motor': 1, 'm.al6061': 0.9, 'c.bearing': 0.6 }),
  'c.tyre':         C('Tyre / non-pneumatic wheel',        1.40, { 'm.rubber': 1.1, 'm.uhmwpe': 0.3 }),
  'c.track_link':   C('Track link + pin',                  0.35, { 'm.steel304': 0.25, 'm.rubber': 0.1 }),
  'c.roadwheel':    C('Road wheel + torsion arm',          1.80, { 'm.steel304': 1.1, 'm.rubber': 0.4, 'c.bearing': 0.3 }),
  'c.sprocket':     C('Drive sprocket + final drive',      3.20, { 'm.steel304': 2.0, 'c.gearbox': 0.7, 'c.bearing': 0.5 }),
  'c.foot_pad':     C('Compliant foot pad + load cell',    0.60, { 'm.tpu': 0.3, 'm.al6061': 0.15, 'c.pcb': 0.15 }),
  'c.lift_fan':     C('Ducted lift fan',                   1.90, { 'c.motor': 1, 'm.cfrp': 0.3, 'm.abs': 0.15 }),
  'c.skirt_seg':    C('Hover skirt segment',               0.50, { 'm.tpu': 0.35, 'm.uhmwpe': 0.15 }),
  /* flight */
  'c.rotor_blade':  C('Composite rotor blade',             0.18, { 'm.cfrp': 0.14, 'm.epoxy': 0.04 }),
  'c.rotor_hub':    C('Rotor hub + pitch link',            0.45, { 'm.al6061': 0.3, 'c.bearing': 0.15 }),
  'c.prop_disc':    C('Tractor propeller + spinner',       0.30, { 'm.cfrp': 0.22, 'm.al6061': 0.08 }),
  'c.boom_arm':     C('Rotor boom arm 0.3 m',              0.22, { 'm.cfrp': 0.18, 'm.al6061': 0.04 }),
  'c.duct_ring':    C('Fan duct / shroud ring',            0.40, { 'm.cfrp': 0.25, 'm.abs': 0.15 }),
  'c.wing_panel':   C('Wing panel 0.25 m²',                0.70, { 'm.cfrp': 0.4, 'm.balsa_core': 0.2, 'm.epoxy': 0.1 }),
  'c.control_surf': C('Control surface + servo',           0.28, { 'm.cfrp': 0.15, 'c.servo_micro': 1.4 }),
  'c.microjet':     C('Micro turbofan (250 N)',            4.20, { 'm.inconel': 2.2, 'm.ti64': 1.3, 'c.bearing': 0.4, 'c.pcb': 0.3 }),
  'c.landing_skid': C('Landing skid / leg set',            0.55, { 'm.cfrp': 0.35, 'm.tpu': 0.1, 'm.al6061': 0.1 }),
  'c.parachute':    C('Ballistic recovery chute',          0.85, { 'm.uhmwpe': 0.5, 'm.abs': 0.2, 'c.sep_bolt': 0.4 }),
  'c.pitot':        C('Air-data boom (pitot + vanes)',     0.20, { 'm.steel304': 0.1, 'c.pcb': 0.2 }),
  /* power */
  'c.lipo_pack':    C('High-rate battery pack (0.5 kWh)',  2.40, { 'm.li': 1.7, 'm.al6061': 0.5, 'm.cu': 0.2 }),
  'c.fuel_cell_sm': C('PEM fuel-cell stack (1 kW)',        5.00, { 'm.nafion': 0.4, 'm.pt': 0.02, 'm.steel304': 2.6, 'm.ti64': 1.5, 'c.pcb': 0.8 }),
  'c.solar_wing_sm':C('Folding solar wing 0.5 m²',         0.90, { 'm.gaas': 0.1, 'm.cfrp': 0.5, 'm.kapton': 0.3 }),
  'c.pdb':          C('Power distribution board',          0.35, { 'c.pcb': 0.5, 'm.cu': 0.1 }),
  'c.charge_port':  C('Docking / charge contact set',      0.45, { 'm.cu': 0.25, 'm.al6061': 0.15, 'm.ptfe': 0.05 }),
  'c.rtg_pellet':   C('Isotope trickle-charger',           3.00, { 'm.w': 1.6, 'm.steel304': 1.0, 'm.pu238': 0.05, 'm.alumina': 0.35 }),
  /* sensing + compute */
  'c.cam_module':   C('Machine-vision camera module',      0.18, { 'c.pcb_sm': 1.5, 'c.glazing_sm': 0.4, 'm.al6061': 0.03 }),
  'c.thermal_cam':  C('LWIR thermal camera',               0.35, { 'm.si': 0.05, 'm.ge': 0.08, 'c.pcb': 0.4, 'm.al6061': 0.08 }),
  'c.lidar_puck':   C('Spinning lidar puck',                0.85, { 'c.lidar_head': 0.12, 'c.motor_micro': 2, 'c.pcb': 0.6, 'm.al6061': 0.1 }),
  'c.depth_pair':   C('Stereo depth head',                  0.30, { 'c.cam_module': 1.2, 'c.pcb_sm': 1.4 }),
  'c.imu_mems':     C('MEMS IMU + magnetometer',           0.06, { 'm.si': 0.01, 'c.pcb': 0.1 }),
  'c.gnss_ant':     C('GNSS antenna + receiver',           0.15, { 'm.cfrp': 0.05, 'c.pcb': 0.25 }),
  'c.mesh_radio':   C('Mesh radio + diversity antenna',     0.28, { 'c.pcb_sm': 2, 'c.antenna_whip': 0.4, 'm.al6061': 0.02 }),
  'c.uwb_tag':      C('UWB ranging tag',                   0.05, { 'c.pcb': 0.1 }),
  'c.sonar_head':   C('Sonar / ultrasonic head',           0.40, { 'm.alumina': 0.15, 'c.pcb': 0.4, 'm.al6061': 0.1 }),
  'c.chem_sniffer': C('Chemical sniffer / PID head',       0.55, { 'c.gas_sensor': 1, 'c.pump': 0.05, 'c.pcb': 0.4 }),
  'c.geiger':       C('Radiation probe',                    0.30, { 'c.dosimeter': 0.5, 'c.pcb_sm': 1, 'm.al6061': 0.04 }),
  'c.gpr_array':    C('Ground-penetrating radar array',    2.20, { 'c.tr_module': 3, 'c.pcb': 1.2, 'm.cfrp': 0.6 }),
  'c.xray_backsc':  C('Backscatter X-ray head',            6.50, { 'c.xray_det': 1.5, 'm.w': 2.0, 'c.pcb': 2 }),
  'c.spectro_head': C('Handheld spectrometer head',        1.10, { 'c.optics': 0.1, 'c.ccd': 0.5, 'c.pcb': 0.6 }),
  'c.nn_module':    C('Neural inference module',           0.45, { 'm.si': 0.1, 'c.pcb': 0.7, 'm.al6061': 0.1 }),
  'c.safety_plc':   C('Safety controller (dual channel)',  0.50, { 'c.pcb': 0.8, 'm.al6061': 0.1 }),
  'c.estop':        C('E-stop + contactor set',            0.35, { 'm.steel304': 0.2, 'c.pcb': 0.2 }),
  /* signalling / human interface */
  'c.beacon_led':   C('Beacon / strobe head',              0.12, { 'm.gan': 0.01, 'c.pcb': 0.2, 'm.pmma': 0.04 }),
  'c.work_lamp':    C('Work lamp head',                    0.30, { 'm.gan': 0.02, 'm.al6061': 0.2, 'c.pcb': 0.2 }),
  'c.speaker':      C('Speaker / hailer',                  0.45, { 'm.ndfeb_sm': 0.1, 'm.abs': 0.2, 'c.pcb': 0.25 }),
  'c.display_pan':  C('Face / status display',             0.40, { 'm.pmma': 0.15, 'm.si': 0.03, 'c.pcb': 0.45 }),
  'c.siren':        C('Siren + light bar',                 1.20, { 'c.beacon_led': 4, 'c.speaker': 1, 'm.al6061': 0.2 }),
  /* end effectors + tools */
  'c.gripper_2f':   C('Two-finger gripper',                1.20, { 'c.servo_joint': 1, 'm.al6061': 0.3, 'm.tpu': 0.05 }),
  'c.hand_5f':      C('Five-finger dexterous hand',        2.60, { 'c.servo_micro': 12, 'c.tendon_drive': 1, 'm.al6061': 0.3, 'c.pcb': 0.4 }),
  'c.clamp_heavy':  C('Heavy industrial clamp',            9.00, { 'c.hydraulic_ram': 2, 'm.steel304': 2.0, 'c.bearing': 0.3 }),
  'c.drill_head':   C('Rotary drill / core head',          6.00, { 'c.motor': 2, 'm.w': 1.8, 'm.steel304': 1.0 }),
  'c.mono_blade':   C('Monofilament blade',                2.20, { 'm.hea': 1.4, 'm.w': 0.5, 'm.cfrp': 0.3 }),
  'c.welder_head':  C('Welding / cutting torch head',      3.10, { 'm.cu': 1.2, 'm.steel304': 1.0, 'c.pcb': 0.6, 'c.valve_latch': 0.3 }),
  'c.spray_head':   C('Spray / boom nozzle set',           0.90, { 'm.steel304': 0.5, 'c.pump': 0.1, 'c.valve_latch': 0.3 }),
  'c.fire_nozzle':  C('Fire monitor nozzle',               4.50, { 'm.al6061': 2.4, 'c.valve_latch': 1, 'c.actuator': 0.5 }),
  'c.hose_reel':    C('Hose reel + 20 m line',             8.00, { 'm.rubber': 4.5, 'm.uhmwpe': 1.5, 'c.motor': 1, 'm.al6061': 1.0 }),
  'c.winch':        C('Cable winch + load cell',           5.50, { 'c.motor': 1.5, 'm.steel304': 2.2, 'c.gearbox': 1, 'c.pcb': 0.2 }),
  'c.saw_head':     C('Disc / chain saw head',             3.80, { 'c.motor': 1.2, 'm.steel304': 1.8, 'm.hea': 0.5 }),
  'c.auger_head':   C('Auger / soil probe head',           2.90, { 'c.motor': 1, 'm.steel304': 1.6 }),
  'c.vac_head':     C('Vacuum / decon head',               2.10, { 'c.fan': 1, 'c.filter': 2, 'm.abs': 0.4 }),
  'c.sampler_arm':  C('Sample scoop + sealed vial rack',   1.70, { 'c.servo_joint': 1, 'm.ti64': 0.5, 'm.abs': 0.3 }),
  'c.med_pack':     C('Field medical pack',                6.00, { 'c.medical_kit': 0.2, 'm.abs': 0.6, 'c.pcb': 0.6 }),
  'c.tray_service': C('Service tray + stabiliser',         1.30, { 'm.al6061': 0.8, 'c.servo_joint': 0.5 }),
  'c.tool_changer': C('Quick tool changer',                1.10, { 'm.ti64': 0.7, 'c.actuator': 0.15, 'c.connector': 0.5 }),
  /* payload bays and career kit */
  'c.cargo_bin':    C('Cargo bin / locker',                3.20, { 'm.abs': 1.8, 'm.al6061': 1.2, 'c.latch': 0.2 }),
  'c.pallet_fork':  C('Fork / pallet lift set',           14.00, { 'm.steel304': 11.0, 'c.hydraulic_ram': 0.8 }),
  'c.tank_liquid':  C('Liquid payload tank 20 L',          2.40, { 'm.abs': 1.4, 'm.al6061': 0.8, 'c.valve_latch': 0.4 }),
  'c.seed_hopper':  C('Seed / granule hopper',             3.60, { 'm.abs': 2.4, 'm.al6061': 0.9, 'c.motor': 0.2 }),
  'c.drone_bay':    C('Micro-drone launch bay',            4.50, { 'c.drone': 0.2, 'm.al6061': 1.0, 'c.actuator': 0.3, 'c.pcb': 0.6 }),
  'c.relay_mast':   C('Deployable comms relay mast',       2.80, { 'c.telescopic': 0.3, 'c.mesh_radio': 2, 'c.antenna_whip': 2 }),
  'c.jammer_pod':   C('EW / jammer pod',                   3.50, { 'c.ew_array': 0.2, 'c.pcb': 1.5, 'm.al6061': 0.5 }),
  'c.smoke_tube':   C('Smoke / obscurant tube',            0.70, { 'm.al6061': 0.35, 'm.htpb': 0.3, 'c.sep_bolt': 0.15 }),
  'c.net_launcher': C('Capture-net launcher',              2.30, { 'm.uhmwpe': 0.8, 'm.al6061': 1.0, 'c.sep_bolt': 0.5 }),
  'c.taser_head':   C('Contact / dart stunner',            1.40, { 'c.capacitor': 0.25, 'c.pcb': 0.6, 'm.abs': 0.3 }),
  'c.disruptor':    C('EOD disruptor + aiming stand',      7.50, { 'm.steel304': 5.0, 'c.actuator': 1, 'c.pcb': 0.5 }),
  'c.autocannon_sm':C('Light autocannon (20 mm)',         38.00, { 'c.gun_barrel': 0.6, 'c.ammo_feed': 0.5, 'm.steel304': 6.0 }),
  'c.gatling_sm':   C('Rotary cannon (7.62 mm)',          16.00, { 'c.gun_barrel': 0.25, 'c.motor': 2, 'c.ammo_feed': 0.3 }),
  'c.grenade_lchr': C('Automatic grenade launcher',       12.00, { 'c.gun_barrel': 0.2, 'm.steel304': 4.0, 'c.ammo_feed': 0.2 }),
  'c.missile_rack': C('Light missile rack (4 cell)',      11.00, { 'c.vls_cell': 0.25, 'm.al_li': 3.0, 'c.pcb': 2 }),
  'c.laser_sm':     C('Compact beam projector',            14.00, { 'c.laser_cavity': 0.22, 'c.beam_director': 0.08, 'c.capacitor': 0.8 }),
  'c.mortar_sm':    C('Light mortar tube',                 9.00, { 'm.steel304': 7.0, 'c.actuator': 0.5, 'c.pcb': 0.3 }),
  'c.grapple':      C('Grapple / line launcher',           3.40, { 'm.uhmwpe': 0.9, 'm.steel304': 1.6, 'c.sep_bolt': 0.5, 'c.motor': 0.3 }),
  'c.shield_emit':  C('Field emitter ring',                10.00, { 'c.sc_coil': 0.2, 'c.capacitor': 2, 'c.pcb': 2 }),
  'c.decon_kit':    C('Decon foam applicator',             3.90, { 'c.tank_liquid': 1, 'c.spray_head': 1, 'c.pump': 0.2 }),
};

/* the ship list stocks no Ge optics and no lead: add them rather than fake them */
const EXTRA_MATERIALS = {
  'm.ge': { name: 'Germanium optic',        kind: 'glass' },
  'm.pb': { name: 'Lead / bismuth shielding', kind: 'alloy' },
};

export const MATERIALS = { ...SHIP_MATERIALS, ...ROBOT_MATERIALS, ...EXTRA_MATERIALS };
export const COMPONENTS = { ...SHIP_COMPONENTS, ...ROBOT_COMPONENTS };
export const ROBOT_ONLY = Object.keys(ROBOT_COMPONENTS);

/* STATIONGEN's bare ids → this catalogue, so the three manifests can be summed. */
export const STATION_ALIAS = {
  al_li: 'm.al_li', al6061: 'm.al6061', ti64: 'm.ti64', steel304: 'm.steel304', inconel: 'm.inconel',
  cu: 'm.cu', w: 'm.w', cfrp: 'm.cfrp', cnt: 'm.cnt', kevlar: 'm.kevlar', kapton: 'm.kapton',
  pe: 'm.pe', ptfe: 'm.ptfe', epoxy: 'm.epoxy', aerogel: 'm.aerogel', alumina: 'm.alumina',
  sic: 'm.sic', b4c: 'm.b4c', sapphire: 'm.sapphire', fused_si: 'm.fused_si', si: 'm.si',
  gaas: 'm.gaas', ndfeb: 'm.ndfeb', rebco: 'm.rebco', li: 'm.li', zeolite: 'm.zeolite',
  amine: 'm.amine', pt: 'm.pt', nafion: 'm.nafion', water: 'm.water', nh3: 'm.nh3',
  lh2: 'm.lh2', lox: 'm.lox', xe: 'm.xe', hale: 'm.hale', pb: 'm.pb', regolith: 'm.regolith',
};

/* Book price per kg of raw stock by kind, and what fabrication adds on top —
   the same two-step estimate STATIONGEN uses, in the same credits. */
export const KIND_PRICE = {
  alloy: 3.0, refractory: 20.0, 'light metal': 9.0, composite: 18.0, polymer: 4.0,
  insulation: 30.0, ceramic: 8.0, glass: 12.0, semiconductor: 140.0, magnet: 60.0,
  superconductor: 300.0, electrochem: 45.0, sorbent: 3.0, catalyst: 3000.0, filter: 6.0,
  fluid: 0.4, propellant: 1.2, bio: 1.0, nuclear: 8000.0, isru: 0.05, consumable: 5.0,
  explosive: 40.0, textile: 20.0, other: 10.0,
};
export const FAB_RATE = {
  alloy: 2.4, refractory: 3.2, 'light metal': 2.6, composite: 3.0, polymer: 1.8, insulation: 1.6,
  ceramic: 2.6, glass: 2.2, semiconductor: 4.0, magnet: 2.0, superconductor: 3.5, electrochem: 2.0,
  sorbent: 1.5, catalyst: 1.3, filter: 1.6, fluid: 1.05, propellant: 1.05, bio: 1.2, nuclear: 2.5,
  isru: 1.2, consumable: 1.2, explosive: 2.0, textile: 2.2, other: 2.0,
};

export function materialCost(id, kg) {
  const m = MATERIALS[id];
  if (!m) throw new Error('unknown material ' + id);
  return kg * (KIND_PRICE[m.kind] ?? KIND_PRICE.other) * (FAB_RATE[m.kind] ?? 2);
}
export function componentMass(id) {
  const c = COMPONENTS[id];
  if (!c) throw new Error('unknown component ' + id);
  return c.kg;
}
