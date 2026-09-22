/* Bills of materials.
 *
 * partBom(part)  → { componentId: count }   functional components by rule, then structural fill
 *                                            (plates / frames / fasteners / harness) so Σ mass == part.mass
 * expandBom(bom) → { materialId: kg }        recursive roll-up to raw stock, plus fastener piece count
 * hullBom(dims)  → hull structure from surface area: skin plates, frames, Whipple layers, MLI, welds, bolts
 *
 * Rules are additive: every matching rule contributes. Counts may be numbers or fn(massKg). */
import { MATERIALS, COMPONENTS } from "./materials.js";

const kg = (p) => p.mass * 1000;
const per = (c, k) => (m) => Math.max(1, Math.round(m * k / COMPONENTS[c].kg));   // fraction k of mass in component c

/* ---- functional rules: [predicate, { component: count|fn }] --------------------------------- */
const R = [];
const rule = (pred, comps) => R.push([pred, comps]);
const id = (prefix) => (p) => p.id.startsWith(prefix);
const tag = (t) => (p) => p.tags.includes(t);
const pf = (k) => (p) => p.prefab === k;
const any = (...fs) => (p) => fs.some(f => f(p));

// every powered part has electronics + connectors; every exterior part has thermal hardware
rule((p) => p.pwr !== 0, { "c.pcb": (m) => 1 + Math.round(m / 400), "c.connector": (m) => 2 + Math.round(m / 300), "c.heater": 1 });
rule((p) => p.prefab && p.prefab !== "hatch", { "c.mli": (m) => Math.max(1, Math.round(m / 500)), "c.standoff": 1 });
rule(pf("hatch"), { "c.seal_oring": 1, "c.hinge": 1 });
rule(any(tag("deploy")), { "c.hinge": 2, "c.actuator": 1, "c.sep_bolt": 2 });
rule(any(tag("sensor"), tag("scanner")), { "c.pcb": 2, "c.harness": 1 });
rule((p) => p.lamp || p.window, { "c.lamp": 1 });
rule((p) => p.cold, { "c.cryocooler": 1, "c.mli": 2 });
rule((p) => p.hot || p.heat > 100, { "c.heatpipe": (m) => Math.max(2, Math.round(m / 250)), "c.coldplate": 1 });

// 01 propulsion
rule(id("prop.gridion"), { "c.cathode": 2, "c.grid_cc": 1, "c.cusp_magnet": 6, "c.anode": 1, "c.ppu": 1, "c.mfc": 2, "c.valve_latch": 4, "c.gimbal": 1 });
rule(id("prop.ion.cathode"), { "c.cathode": 2, "c.heater": 2 });
rule(id("prop.ion.anode"), { "c.anode": 1, "c.mfc": 1 });
rule(id("prop.ion.cusps"), { "c.cusp_magnet": 8 });
rule(id("prop.ion.grids"), { "c.grid_cc": 1 });
rule(id("prop.ion.ppu"), { "c.ppu": 1, "c.connector_hv": 3 });
rule(id("prop.ion.neut"), { "c.cathode": 1, "c.valve_latch": 1 });
rule(id("prop.hall"), { "c.bn_channel": 1, "c.cusp_magnet": 4, "c.cathode": 1, "c.anode": 1, "c.ppu": 1, "c.gimbal": 1 });
rule(id("prop.hall.channel"), { "c.bn_channel": 1 });
rule(id("prop.hall.mag"), { "c.cusp_magnet": 6, "c.transformer": 1 });
rule(any(id("prop.feep"), id("prop.colloid")), { "c.emitter_array": 12, "c.ppu": 1, "c.connector_hv": 4 });
rule(any(id("prop.mpd"), id("prop.vasimr")), { "c.rf_antenna": 2, "c.sc_coil": 4, "c.ppu": 3, "c.cathode": 2, "c.gimbal": 1 });
rule(id("prop.pit"), { "c.capacitor": 12, "c.power_switch": 8, "c.transformer": 2, "c.gimbal": 1 });
rule(id("prop.cluster"), { "c.gimbal": 2, "c.bracket": 8 });
rule(id("prop.biprop"), { "c.injector": 1, "c.chamber": 1, "c.nozzle": 1, "c.turbopump": 2, "c.igniter": 2, "c.valve_latch": 8, "c.gimbal": 1 });
rule(id("prop.turbopump"), { "c.turbopump": 1, "c.bearing": 4 });
rule(id("prop.feedsys"), { "c.valve_latch": 6, "c.valve_relief": 2, "c.filter": 2, "c.flex_hose": 4 });
rule(any(id("prop.srb"), id("prop.hybrid")), { "c.motor_case": 1, "c.solid_grain": per("c.solid_grain", 0.7), "c.nozzle": 1, "c.igniter": 1, "c.sep_bolt": 4 });
rule(any(id("prop.ullage"), id("acs.rcs")), { "c.rcs_thruster": 4, "c.valve_latch": 4, "c.regulator": 1 });
rule(id("prop.ntr"), { "c.fuel_cermet": per("c.fuel_cermet", 0.25), "c.reflector": 6, "c.control_drum": 8, "c.nozzle": 1, "c.turbopump": 1, "c.shadow_shield": 1 });
rule(id("prop.ntr.drums"), { "c.control_drum": 4 });
rule(id("prop.ntr.shield"), { "c.shadow_shield": 1 });
rule(id("prop.nep"), { "c.fuel_haleu": per("c.fuel_haleu", 0.2), "c.reflector": 4, "c.brayton": 1, "c.ppu": 2, "c.cathode": 2, "c.grid_cc": 2 });
rule(id("prop.fus"), { "c.tokamak_seg": per("c.tokamak_seg", 0.35), "c.first_wall": 4, "c.rebco_coil": 12, "c.ppu": 4, "c.cryocooler": 4 });
rule(id("prop.antimatter"), { "c.rebco_coil": 16, "c.sc_coil": 12, "c.capacitor": 20, "c.cryocooler": 6, "c.nozzle": 1 });
rule(id("prop.warp"), { "c.rebco_coil": 40, "c.capacitor": 60, "c.cryocooler": 8, "c.cpu_tmr": 4 });
rule(id("prop.sail"), { "c.sail_film": 8, "c.sail_boom": 8, "c.motor": 2 });
rule(id("prop.magsail"), { "c.sc_coil": 6, "c.cryocooler": 1 });
rule(id("acs.cmg"), { "c.cmg_rotor": 1, "c.pcb": 2 });
rule(id("acs.wheel"), { "c.wheel_rotor": 1 });
rule(id("acs.torquer"), { "c.torquer_rod": 1 });
// 02 fluids
rule(any(id("fl.lh2"), id("fl.lox"), id("fl.lch4"), id("fl.lxe")), { "c.dewar": per("c.dewar", 0.55), "c.pmd": 1, "c.valve_latch": 4, "c.valve_relief": 2, "c.mli": 6 });
rule(id("fl.lh2"), { "c.cryocooler": 1 });
rule(any(id("fl.xecopv"), id("fl.krcopv"), id("fl.he"), id("fl.gn2")), { "c.copv": per("c.copv", 0.7), "c.regulator": 1, "c.valve_latch": 2, "c.valve_relief": 1 });
rule(any(id("fl.water"), id("fl.nh3"), id("fl.n2")), { "c.copv": per("c.copv", 0.5), "c.valve_latch": 2, "c.pump": 1 });
rule(id("fl.manifold"), { "c.valve_latch": 8, "c.tube_steel": 6, "c.flex_hose": 4 });
rule(id("fl.filters"), { "c.filter": 6, "c.mfc": 2 });
rule(id("fl.pmd"), { "c.pmd": 1 });
rule(id("fl.autogen"), { "c.valve_latch": 2, "c.regulator": 1, "c.tube_steel": 2 });
rule(any(id("fl.umbilical"), id("fl.qd"), id("sd.qdfamily"), id("dk.umbilical"), id("rb.depotport")), { "c.qd": 6, "c.flex_hose": 4, "c.connector_hv": 2, "c.connector": 4 });
rule(id("fl.chill"), { "c.pump": 1, "c.heatpipe": 4, "c.valve_latch": 3 });
// 03 power
rule(id("pw.solar"), { "c.pv_blanket": per("c.pv_blanket", 0.5), "c.hinge": 4, "c.slip_ring": 1, "c.motor": 1 });
rule(id("pw.solar.conc"), { "c.pv_concentrator": 2 });
rule(id("pw.suntrack"), { "c.motor": 2, "c.slip_ring": 1, "c.gearbox": 1 });
rule(any(id("pw.rtg"), id("pw.asrg")), { "c.gphs": 8, "c.thermoelectric": 4 });
rule(id("pw.asrg"), { "c.stirling": 1 });
rule(id("pw.heatsource"), { "c.gphs": 6 });
rule(any(id("pw.kilo"), id("pw.mw")), { "c.fuel_haleu": per("c.fuel_haleu", 0.15), "c.reflector": 6, "c.control_drum": 6, "c.heatpipe_na": 12, "c.shadow_shield": 1, "c.stirling": 4 });
rule(id("pw.mw"), { "c.brayton": 2, "c.busbar": 10 });
rule(id("pw.namak"), { "c.pump": 2, "c.tube_steel": 12, "c.valve_latch": 4 });
rule(any(id("pw.tokamak"), id("pw.stellarator")), { "c.tokamak_seg": per("c.tokamak_seg", 0.3), "c.first_wall": 8, "c.blanket_mod": 6, "c.cryocooler": 8, "c.brayton": 4, "c.busbar": 20 });
rule(id("pw.icf"), { "c.laser_driver": 8, "c.capacitor": 40, "c.first_wall": 4, "c.brayton": 3 });
rule(id("pw.blanket"), { "c.blanket_mod": 2, "c.pump": 2, "c.vac_chamber": 1 });
rule(id("pw.rectenna"), { "c.rectenna": per("c.rectenna", 0.6), "c.converter": 4 });
rule(id("pw.laserrx"), { "c.optics": 1, "c.pv_blanket": 2, "c.actuator": 2, "c.cryocooler": 1 });
rule(id("pw.stirling"), { "c.stirling": 2 });
rule(id("pw.brayton"), { "c.brayton": 1 });
rule(id("pw.thermo"), { "c.thermoelectric": 6 });
rule(id("pw.mhd"), { "c.sc_coil": 6, "c.busbar": 8, "c.plate_steel": 4 });
// 04 epds
rule(id("ep.battery"), { "c.battery_cell": per("c.battery_cell", 0.7), "c.pcb": 4, "c.busbar": 2 });
rule(id("ep.supercap"), { "c.supercap": per("c.supercap", 0.7), "c.busbar": 2 });
rule(id("ep.flywheel"), { "c.wheel_rotor": 2, "c.motor": 2, "c.vac_chamber": 1 });
rule(id("ep.smes"), { "c.sc_coil": per("c.sc_coil", 0.5), "c.cryocooler": 2, "c.power_switch": 4 });
rule(any(id("ep.dcdc"), id("ep.inverter")), { "c.converter": 4, "c.power_switch": 6 });
rule(id("ep.ppu"), { "c.ppu": 1 });
rule(any(id("ep.hvdc"), id("ep.lvbus")), { "c.busbar": 4, "c.connector_hv": 6, "c.harness": 4 });
rule(id("ep.switchgear"), { "c.power_switch": 8, "c.busbar": 2 });
rule(id("ep.ground"), { "c.busbar": 1, "c.connector": 6 });
rule(id("ep.umbport"), { "c.connector_hv": 4, "c.latch": 2 });
rule(id("ep.wireless"), { "c.transformer": 2, "c.converter": 1 });
rule(any(id("ep.fault"), id("ep.arcfault"), id("ep.loadshed")), { "c.power_switch": 2, "c.pcb": 2 });
// 05 structure
rule(id("st.cnt"), { "c.truss_cnt": per("c.truss_cnt", 0.8), "c.metglass_joint": 4 });
rule(any(id("st.tiav"), id("id.keelseg"), id("prop.cluster"), id("cg.unpress"), id("rb.rail")), { "c.frame_ti": per("c.frame_ti", 0.6), "c.bracket": 4 });
rule(id("st.isogrid"), { "c.plate_al": per("c.plate_al", 0.8) });
rule(any(id("st.bulkhead"), id("st.deck"), id("id.spinebox")), { "c.plate_al": per("c.plate_al", 0.6), "c.frame_al": per("c.frame_al", 0.3) });
rule(id("st.plate"), { "c.plate_al": per("c.plate_al", 0.85) });
rule(any(id("st.whipple"), id("ion.shield")), { "c.whipple_layer": per("c.whipple_layer", 0.7), "c.standoff": 6 });
rule(id("st.fairing"), { "c.cfrp_panel": per("c.cfrp_panel", 0.8) });
rule(any(id("st.viewport"), id("ev.airlock"), id("ev.suitport")), { "c.window_sapphire": 1 });
rule(any(id("st.boom"), id("cg.interfero"), id("sci.interfero")), { "c.truss_cfrp": per("c.truss_cfrp", 0.6), "c.hinge": 2, "c.motor": 1 });
rule(id("st.hinge"), { "c.hinge": 6, "c.latch": 4 });
rule(any(id("st.sepbolt"), id("id.sepplane"), id("id.jettison")), { "c.sep_bolt": 12, "c.connector": 4 });
rule(id("st.rack"), { "c.rack_frame": 1, "c.insert": 4 });
rule(id("st.tray"), { "c.frame_al": 2, "c.harness": 3, "c.connector": 6, "c.standoff": 4 });
rule(id("st.standoff"), { "c.standoff": 8, "c.frame_al": 1 });
// 06 materials
rule(id("mt.polyshield"), { "c.pe_shield": per("c.pe_shield", 0.85) });
rule(any(id("mt.waterwall"), id("hull.waterwall")), { "c.copv": 4, "c.pump": 1, "c.plate_al": 6 });
rule(any(id("mt.boron"), id("hull.b4c")), { "c.b4c_tile": per("c.b4c_tile", 0.8) });
rule(id("mt.magcoil"), { "c.sc_coil": per("c.sc_coil", 0.5), "c.cryocooler": 1 });
rule(id("mt.tiles"), { "c.tps_tile": per("c.tps_tile", 0.8) });
rule(id("mt.ablator"), { "c.ablator": per("c.ablator", 0.85) });
rule(id("mt.hiecoat"), { "c.cfrp_panel": per("c.cfrp_panel", 0.6), "c.mli": 2 });
rule(id("mt.varem"), { "c.cfrp_panel": 2, "c.pcb": 2, "c.heater": 4 });
rule(id("mt.selfheal"), { "c.cfrp_panel": per("c.cfrp_panel", 0.7), "c.adhesive": 6 });
rule(id("mt.morph"), { "c.cfrp_panel": 2, "c.actuator": 4 });
rule(id("mt.living"), { "c.bio_vessel": 1, "c.cfrp_panel": 2, "c.led_grow": 2 });
rule(id("mt.crusher"), { "c.crusher_jaw": 2, "c.motor": 4, "c.conveyor": 3 });
rule(id("mt.mre"), { "c.mre_cell": per("c.mre_cell", 0.6), "c.busbar": 6, "c.heatpipe": 8 });
rule(id("mt.caster"), { "c.crucible": 1, "c.spindle": 1, "c.vac_chamber": 1 });
rule(id("mt.blender"), { "c.crucible": 1, "c.motor": 2 });
// 07 thermal
rule(any(id("tc.radwing"), id("tc.bodyrad"), id("tc.varem")), { "c.radiator_panel": per("c.radiator_panel", 0.75), "c.pump": 1, "c.heatpipe": 4 });
rule(id("tc.louver"), { "c.radiator_panel": per("c.radiator_panel", 0.5), "c.louver": 14 });
rule(id("tc.heatpipe"), { "c.heatpipe": per("c.heatpipe", 0.8) });
rule(id("tc.pumploop"), { "c.pump": 2, "c.heatpipe": 6, "c.valve_latch": 2, "c.coldplate": 4 });
rule(id("tc.coldplate"), { "c.coldplate": per("c.coldplate", 0.8) });
rule(any(id("tc.cryo"), id("tc.zbo")), { "c.cryocooler": (m) => Math.max(1, Math.round(m / 120)), "c.heatpipe": 2 });
rule(any(id("tc.vcs"), id("tc.mli")), { "c.mli": per("c.mli", 0.85) });
rule(id("tc.aerogel"), { "c.aerogel_panel": per("c.aerogel_panel", 0.8) });
rule(id("tc.pcm"), { "c.coldplate": 4, "c.plate_al": 2 });
// 08 computing
rule(any(id("cd.fc"), id("cd.rtos"), id("cd.autonomy"), id("cd.hm"), id("cd.predict"), id("cd.swarm")), { "c.cpu_tmr": 1, "c.memory": 1, "c.pcb": 2 });
rule(any(id("cd.fpga"), id("cd.spacewire"), id("cd.tte"), id("cd.riu")), { "c.fpga": 2, "c.pcb": 1, "c.connector": 8 });
rule(any(id("cd.neuro"), id("cd.quantum"), id("exp.upload")), { "c.fpga": 4, "c.cpu_tmr": 1, "c.cryocooler": 1 });
rule(id("cd.memory"), { "c.memory": 6 });
rule(id("cd.secure"), { "c.crypto": 2 });
// 09 gnc
rule(any(id("gn.fog"), id("gn.rlg")), { "c.fog": 1, "c.accel": 1 });
rule(id("gn.coldatom"), { "c.atom_cell": 1, "c.fog": 1 });
rule(any(id("gn.startrack"), id("gn.navcam"), id("sw.debriscam")), { "c.optics": 1, "c.ccd": 1, "c.window_sapphire": 1 });
rule(id("gn.sunsensor"), { "c.ccd": 2 });
rule(id("gn.pulsar"), { "c.xray_det": 2, "c.optics": 1 });
rule(id("gn.relproc"), { "c.cpu_tmr": 1 });
rule(id("gn.atomclock"), { "c.atom_cell": 1 });
rule(id("gn.gnss"), { "c.antenna_whip": 1, "c.pcb": 1 });
rule(id("gn.altimeter"), { "c.lidar_head": 1 });
rule(id("gn.formation"), { "c.antenna_whip": 2, "c.lamp": 2 });
// 10 comms
rule(id("cm.hga"), { "c.dish_cfrp": per("c.dish_cfrp", 0.4), "c.feedhorn": 1, "c.twta": 1, "c.motor": 2, "c.gearbox": 2, "c.slip_ring": 1 });
rule(any(id("cm.phased"), id("sw.sar"), id("nav.sar")), { "c.tr_module": per("c.tr_module", 0.5), "c.cfrp_panel": 1 });
rule(any(id("cm.omni"), id("cm.uhf")), { "c.antenna_whip": 1, "c.rf_switch": 1 });
rule(id("cm.radome"), { "c.radar_tile": 1, "c.cfrp_panel": 2, "c.twta": 1 });
rule(id("cm.laser"), { "c.laser_terminal": 1, "c.optics": 1, "c.cryocooler": 1 });
rule(id("cm.dtn"), { "c.memory": 4, "c.fpga": 1 });
rule(id("cm.mesh"), { "c.rf_switch": 2, "c.harness": 2 });
rule(id("cm.quantum"), { "c.laser_terminal": 1, "c.atom_cell": 1, "c.cryocooler": 1 });
rule(any(id("cm.relaybay"), id("rb.dronebay")), { "c.drone": 2, "c.actuator": 2, "c.latch": 4, "c.hinge": 4 });
rule(any(id("cm.beacon"), id("cm.blackbox")), { "c.antenna_whip": 1, "c.battery_cell": 1, "c.memory": 2, "c.sep_bolt": 1 });
// 11 sensors
rule(any(id("sw.lidar"), id("sf.debrisradar"), id("nav.lidar")), { "c.lidar_head": 1, "c.motor": 1 });
rule(any(id("sw.radar"), id("nav.radar")), { "c.radar_tile": 2, "c.motor": 1, "c.twta": 1 });
rule(any(id("sw.scanhead"), id("wp.tracker")), { "c.radar_tile": 1, "c.lidar_head": 1, "c.motor": 2, "c.bearing": 2 });
rule(any(id("sw.spectro"), id("sw.telescope"), id("sci.telescope")), { "c.optics": 2, "c.ccd": 2, "c.cryocooler": 1, "c.actuator": 2 });
rule(id("sw.dosimeter"), { "c.dosimeter": 4 });
rule(any(id("sw.plasma"), id("sw.ism"), id("nav.ism")), { "c.dosimeter": 2, "c.antenna_whip": 1, "c.truss_cfrp": 2 });
rule(id("sw.cabinair"), { "c.gas_sensor": 6 });
rule(id("sw.acoustic"), { "c.mic_array": 8 });
rule(id("sw.shm"), { "c.strain_net": 6 });
// 12 atmosphere
rule(id("at.electrolysis"), { "c.electrolysis_stack": 1, "c.pump": 2, "c.valve_latch": 6, "c.membrane": 1 });
rule(id("at.soxe"), { "c.sox_stack": 1, "c.heater": 6, "c.pump": 1 });
rule(id("at.emergo2"), { "c.copv": 2, "c.regulator": 4, "c.hepa": 4 });
rule(id("at.sieve"), { "c.sorbent_bed": 4, "c.valve_latch": 8, "c.fan": 1 });
rule(id("at.amine"), { "c.amine_bed": 2, "c.valve_latch": 4, "c.fan": 1 });
rule(any(id("at.sabatier"), id("at.bosch")), { "c.catalyst_reactor": 1, "c.pump": 1, "c.valve_latch": 4, "c.heater": 4 });
rule(id("at.tcc"), { "c.catalyst_reactor": 1, "c.hepa": 2, "c.fan": 1 });
rule(id("at.hepa"), { "c.hepa": 6 });
rule(id("at.fans"), { "c.fan": 4 });
rule(any(id("at.pressure"), id("at.n2makeup"), id("at.relief")), { "c.regulator": 2, "c.valve_relief": 3, "c.gas_sensor": 2 });
// 13 water / waste / food
rule(any(id("wf.urine"), id("wf.multifilt"), id("wf.condensate"), id("wf.brine")), { "c.membrane": 3, "c.pump": 2, "c.uv_reactor": 1, "c.valve_latch": 4 });
rule(id("wf.polish"), { "c.uv_reactor": 1, "c.membrane": 1 });
rule(any(id("wf.solids"), id("wf.pyro")), { "c.heater": 8, "c.fan": 2, "c.vac_chamber": 1 });
rule(any(id("wf.hydroponic"), id("hb.greenhouse")), { "c.grow_rack": (m) => Math.max(1, Math.round(m / 400)), "c.pump": 1, "c.led_grow": 4 });
rule(any(id("wf.algae"), id("cg.seedbank"), id("exp.seed")), { "c.bio_vessel": (m) => Math.max(1, Math.round(m / 500)), "c.pump": 1, "c.led_grow": 2 });
rule(any(id("wf.cellag"), id("fab.bio"), id("mf.biofab"), id("cg.livestock")), { "c.bio_vessel": 1, "c.bioprinter": 1, "c.cryocooler": 1 });
rule(any(id("wf.galley"), id("hb.wardroom")), { "c.galley": 1, "c.bunk": 1 });
rule(id("wf.nutrient"), { "c.membrane": 2, "c.pump": 1 });
// 14 habitation
rule(id("hb.cabins"), { "c.bunk": 4, "c.lamp": 6, "c.fan": 2 });
rule(id("hb.hygiene"), { "c.membrane": 1, "c.pump": 1, "c.fan": 1 });
rule(any(id("hb.medbay"), id("crew.medbay")), { "c.medical_kit": 1, "c.bioprinter": 1, "c.lamp": 4 });
rule(id("hb.exercise"), { "c.exercise": 1 });
rule(id("hb.circadian"), { "c.lamp": 12, "c.pcb": 1 });
rule(id("hb.acoustic"), { "c.standoff": 12, "c.mli": 4 });
rule(any(id("hb.gravring"), id("cg.genship")), { "c.bunk": 12, "c.slip_ring": 2, "c.bearing": 12, "c.motor": 4, "c.window_sapphire": 12, "c.grow_rack": 4 });
rule(id("hb.gravbearing"), { "c.bearing": 16, "c.slip_ring": 2, "c.motor": 2 });
rule(any(id("hb.shelter"), id("sf.safehaven")), { "c.pe_shield": (m) => Math.max(2, Math.round(m * 0.5 / 95)), "c.hatch": 1, "c.copv": 2 });
rule(any(id("hb.rec"), id("hb.culture")), { "c.lamp": 8, "c.memory": 4, "c.fpga": 2, "c.bunk": 2 });
// 15 eva / docking
rule(any(id("ev.airlock"), id("dk.tunnel")), { "c.hatch": 2, "c.pump": 1, "c.valve_latch": 4, "c.handrail": 4, "c.lamp": 2 });
rule(id("ev.suitport"), { "c.hatch": 2, "c.seal_oring": 8 });
rule(id("ev.pumpdown"), { "c.pump": 2, "c.copv": 1, "c.valve_latch": 4 });
rule(id("ev.suitrack"), { "c.suit_plss": 2, "c.rack_frame": 1 });
rule(id("ev.plss"), { "c.copv": 2, "c.battery_cell": 1, "c.regulator": 2 });
rule(any(id("dk.crew"), id("dk.cargo"), id("dk.hard"), id("st.capture")), { "c.dock_ring": 1, "c.latch": 4, "c.qd": 4, "c.connector_hv": 2, "c.lamp": 4 });
rule(id("dk.fuel"), { "c.dock_ring": 1, "c.qd": 8, "c.flex_hose": 6, "c.valve_latch": 6 });
rule(any(id("dk.berth"), id("rb.arm"), id("mine.grapple")), { "c.robot_joint": 6, "c.gripper": 1, "c.turret_ring": 1 });
// 16 robotics
rule(any(id("rb.freeflyer"), id("cg.invbot")), { "c.drone": 1, "c.latch": 2 });
rule(id("rb.nde"), { "c.ccd": 2, "c.strain_net": 2 });
rule(id("rb.crawler"), { "c.robot_joint": 4, "c.ccd": 2, "c.battery_cell": 0.5, "c.rail": 2 });
rule(any(id("rb.tools"), id("mf.spares")), { "c.rack_frame": 1, "c.gripper": 2 });
rule(any(id("rb.mru"), id("sd.mrucab"), id("sd.mru1u")), { "c.rack_frame": 1, "c.connector": 12, "c.latch": 4 });
rule(id("rb.blindmate"), { "c.connector": 20, "c.connector_hv": 4 });
// 17 cargo / mining
rule(any(id("cg.rack"), id("cg.printers")), { "c.rack_frame": 2, "c.latch": 4 });
rule(id("cg.container"), { "c.container_shell": (m) => Math.max(1, Math.round(m / 700)), "c.latch": 4 });
rule(id("cg.softstow"), { "c.rack_frame": 1, "c.hinge": 2, "c.actuator": 1 });
rule(id("cg.rfid"), { "c.rf_switch": 1, "c.ccd": 1 });
rule(id("cg.drill"), { "c.drill_bit": 1, "c.telescopic": 3, "c.motor": 2, "c.gearbox": 2, "c.laser_cavity": 1, "c.turret_ring": 1 });
rule(id("cg.intake"), { "c.conveyor": 4, "c.crusher_jaw": 1, "c.motor": 2 });
rule(any(id("cg.hopper"), id("mine.hopper")), { "c.plate_al": 6, "c.conveyor": 1, "c.hinge": 2 });
rule(any(id("cg.refinery"), id("ind.refinery")), { "c.crucible": 2, "c.mre_cell": 1, "c.motor": 4, "c.conveyor": 2 });
rule(any(id("cg.scilab"), id("sci.samplelab")), { "c.optics": 2, "c.ccd": 4, "c.vac_chamber": 1, "c.window_sapphire": 3 });
rule(id("cg.samplevault"), { "c.vac_chamber": 1, "c.cryocooler": 1, "c.seal_oring": 12 });
rule(any(id("cg.lander"), id("cg.gear")), { "c.actuator": 4, "c.latch": 4, "c.hinge": 4, "c.frame_ti": 6 });
// 18 safety / defense
rule(any(id("sf.smoke"), id("sf.avoid"), id("sf.watchdog")), { "c.gas_sensor": 4, "c.pcb": 2 });
rule(id("sf.suppress"), { "c.copv": 2, "c.valve_latch": 6, "c.tube_steel": 8 });
rule(id("sf.extinguish"), { "c.copv": 4 });
rule(id("sf.isolation"), { "c.valve_latch": 6, "c.actuator": 2 });
rule(id("sf.patch"), { "c.plate_al": 1, "c.adhesive": 6, "c.seal_oring": 4 });
rule(id("sf.emp"), { "c.plate_steel": 2, "c.busbar": 4 });
rule(id("sf.stealth"), { "c.cfrp_panel": per("c.cfrp_panel", 0.7) });
rule(any(id("wp.pdlaser"), id("wp.beam"), id("def.pdlaser")), { "c.laser_cavity": 1, "c.beam_director": 1, "c.capacitor": 4, "c.turret_ring": 1, "c.fire_control": 1, "c.cryocooler": 1 });
rule(any(id("wp.pdc"), id("wp.kinetic"), id("wp.auto"), id("wp.flak"), id("wp.ciws")), { "c.gun_barrel": 1, "c.ammo_feed": 1, "c.magazine": 1, "c.turret_ring": 1, "c.fire_control": 1 });
rule(id("wp.ciws"), { "c.pdc_radome": 1 });
rule(id("wp.rail"), { "c.rail_barrel": 1, "c.capacitor": 12, "c.magazine": 1, "c.turret_ring": 1, "c.fire_control": 1 });
rule(id("wp.coil"), { "c.coil_stack": 1, "c.capacitor": 8, "c.magazine": 1, "c.turret_ring": 1, "c.fire_control": 1 });
rule(any(id("wp.plasma"), id("wp.lance")), { "c.plasma_torus": 1, "c.rf_antenna": 2, "c.capacitor": 10, "c.turret_ring": 1, "c.fire_control": 1 });
rule(id("wp.particle"), { "c.accelerator_ring": 1, "c.cryocooler": 2, "c.beam_director": 1, "c.turret_ring": 1, "c.fire_control": 1 });
rule(any(id("wp.vls"), id("wp.kkv"), id("wp.nuke"), id("wp.emp"), id("wp.cluster")), { "c.vls_cell": 9, "c.fire_control": 1, "c.connector": 18 });
rule(id("wp.torp"), { "c.torp_tube": 2, "c.fire_control": 1 });
rule(id("wp.chaff"), { "c.chaff_tube": 8, "c.pcb": 1 });
rule(id("wp.mines"), { "c.mine_body": 4, "c.actuator": 2, "c.hinge": 2 });
rule(id("wp.ew"), { "c.ew_array": 1, "c.fire_control": 1 });
rule(any(id("wp.mag"), id("wp.ammo")), { "c.magazine": 1, "c.ammo_feed": 1 });
rule(id("wp.cap"), { "c.capacitor": per("c.capacitor", 0.6), "c.power_switch": 4, "c.busbar": 2 });
rule(id("wp.coolant"), { "c.pump": 2, "c.heatpipe": 6, "c.cryocooler": 1 });
rule(id("wp.fcs"), { "c.fire_control": 1, "c.cpu_tmr": 1 });
// 19 manufacturing
rule(any(id("mf.printer"), id("mf.wirearc")), { "c.print_head": 3, "c.spindle": 1, "c.vac_chamber": 1, "c.motor": 4 });
rule(id("mf.ebeam"), { "c.ebeam_gun": 1, "c.vac_chamber": 1, "c.connector_hv": 4, "c.motor": 3 });
rule(id("mf.vacnode"), { "c.print_head": 2, "c.robot_joint": 4, "c.truss_cfrp": 8 });
rule(any(id("mf.furnace"), id("ind.furnace")), { "c.crucible": 1, "c.ebeam_gun": 1, "c.vac_chamber": 1, "c.heatpipe": 8 });
rule(any(id("mf.cvd"), id("ind.cvd")), { "c.vac_chamber": 1, "c.heater": 8, "c.mfc": 6, "c.pump": 2 });
rule(any(id("mf.isotope"), id("ind.isotope")), { "c.vac_chamber": 1, "c.sc_coil": 2, "c.pump": 2, "c.motor": 2 });
rule(id("mf.atomizer"), { "c.crucible": 1, "c.spindle": 1, "c.motor": 3 });
rule(any(id("mf.optics"), id("fab.optics")), { "c.spindle": 1, "c.cmm_head": 1, "c.optics": 1 });
rule(any(id("mf.pickplace"), id("mf.mems"), id("fab.mems")), { "c.spindle": 1, "c.vac_chamber": 1, "c.ccd": 2, "c.motor": 4 });
rule(any(id("mf.scwire"), id("fab.scwire")), { "c.spindle": 1, "c.crucible": 1, "c.cryocooler": 1 });
rule(id("mf.cmm"), { "c.cmm_head": 1, "c.spindle": 1 });
rule(id("mf.qualstand"), { "c.vac_chamber": 1, "c.motor": 4, "c.strain_net": 4, "c.pump": 2 });
// 20 standards & 00 identity
rule(any(id("sd."), id("id.blockport")), { "c.connector": 4, "c.qd": 1, "c.insert": 2 });
rule(any(id("id.keelseg"), id("id.tankskirt")), { "c.frame_ti": 4, "c.metglass_joint": 2 });

/* ---- structural fill per prefab: how the remaining mass is spent ---------------------------- */
const FILL = {
  hatch:      { "c.plate_al": 0.55, "c.frame_al": 0.25, "c.bracket": 0.20 },
  module:     { "c.honeycomb": 0.45, "c.frame_al": 0.35, "c.bracket": 0.20 },
  coilBank:   { "c.frame_ti": 0.5, "c.plate_al": 0.3, "c.bracket": 0.2 },
  truss:      { "c.truss_cfrp": 0.7, "c.metglass_joint": 0.2, "c.bracket": 0.1 },
  whipple:    { "c.whipple_layer": 0.6, "c.plate_al": 0.25, "c.standoff": 0.15 },
  shield:     { "c.plate_ti": 0.5, "c.frame_ti": 0.3, "c.bracket": 0.2 },
  tank:       { "c.plate_al": 0.5, "c.frame_al": 0.3, "c.tube_steel": 0.2 },
  sphereTank: { "c.plate_al": 0.6, "c.frame_ti": 0.4 },
  drum:       { "c.plate_steel": 0.5, "c.frame_ti": 0.3, "c.bearing": 0.2 },
  reactor:    { "c.plate_steel": 0.5, "c.frame_ti": 0.35, "c.tube_steel": 0.15 },
  rtg:        { "c.plate_al": 0.5, "c.frame_ti": 0.3, "c.tube_steel": 0.2 },
  array:      { "c.cfrp_panel": 0.5, "c.frame_al": 0.3, "c.hinge": 0.2 },
  sail:       { "c.truss_cfrp": 0.6, "c.frame_ti": 0.4 },
  rcs:        { "c.plate_ti": 0.5, "c.tube_steel": 0.3, "c.bracket": 0.2 },
  cmg:        { "c.frame_ti": 0.6, "c.plate_al": 0.4 },
  torquer:    { "c.tube_ti": 0.7, "c.bracket": 0.3 },
  srb:        { "c.frame_ti": 0.5, "c.plate_al": 0.3, "c.bracket": 0.2 },
  dish:       { "c.frame_al": 0.5, "c.tube_ti": 0.3, "c.bracket": 0.2 },
  radome:     { "c.cfrp_panel": 0.5, "c.frame_al": 0.5 },
  mast:       { "c.tube_ti": 0.6, "c.bracket": 0.4 },
  optic:      { "c.frame_ti": 0.5, "c.plate_al": 0.3, "c.bracket": 0.2 },
  sensorPod:  { "c.plate_al": 0.5, "c.frame_al": 0.3, "c.bearing": 0.2 },
  scanner:    { "c.plate_al": 0.5, "c.frame_ti": 0.3, "c.bearing": 0.2 },
  bay:        { "c.honeycomb": 0.5, "c.frame_al": 0.3, "c.hinge": 0.2 },
  lab:        { "c.honeycomb": 0.5, "c.frame_al": 0.35, "c.bracket": 0.15 },
  landerClamp:{ "c.frame_ti": 0.6, "c.plate_ti": 0.25, "c.bracket": 0.15 },
  drill:      { "c.frame_ti": 0.5, "c.tube_ti": 0.3, "c.plate_ti": 0.2 },
  intake:     { "c.plate_steel": 0.5, "c.frame_ti": 0.3, "c.bracket": 0.2 },
  grapple:    { "c.frame_ti": 0.6, "c.tube_ti": 0.4 },
  dock:       { "c.plate_al": 0.5, "c.frame_ti": 0.35, "c.bracket": 0.15 },
  airlock:    { "c.plate_al": 0.55, "c.frame_al": 0.3, "c.handrail": 0.15 },
  umbilical:  { "c.plate_al": 0.5, "c.tube_steel": 0.3, "c.bracket": 0.2 },
  louver:     { "c.frame_al": 0.5, "c.plate_al": 0.5 },
  mli:        { "c.mli": 0.9, "c.standoff": 0.1 },
  beacon:     { "c.plate_al": 0.5, "c.cfrp_panel": 0.3, "c.bracket": 0.2 },
  container:  { "c.plate_al": 0.5, "c.frame_al": 0.35, "c.latch": 0.15 },
  tunnel:     { "c.plate_al": 0.55, "c.frame_al": 0.3, "c.seal_oring": 0.15 },
  crawler:    { "c.plate_al": 0.5, "c.frame_ti": 0.3, "c.rail": 0.2 },
  turret_beam:   { "c.plate_hea": 0.4, "c.frame_ti": 0.4, "c.bracket": 0.2 },
  turret_rail:   { "c.plate_hea": 0.4, "c.frame_ti": 0.4, "c.bracket": 0.2 },
  turret_plasma: { "c.plate_hea": 0.4, "c.frame_ti": 0.4, "c.bracket": 0.2 },
  turret_pdc:    { "c.plate_hea": 0.4, "c.frame_ti": 0.4, "c.bracket": 0.2 },
  vls:        { "c.plate_hea": 0.4, "c.frame_ti": 0.4, "c.bracket": 0.2 },
  torpedo:    { "c.plate_hea": 0.4, "c.frame_ti": 0.4, "c.bracket": 0.2 },
  _drive:     { "c.frame_ti": 0.4, "c.plate_ti": 0.4, "c.tube_steel": 0.2 }
};

export function partBom(p) {
  if (p.info) return {};
  const massKg = kg(p);
  const bom = {};
  const add = (c, q) => { if (!COMPONENTS[c]) throw new Error(`unknown component ${c} on ${p.id}`); bom[c] = (bom[c] || 0) + q; };
  for (const [pred, comps] of R) if (pred(p)) for (const [c, q] of Object.entries(comps)) add(c, typeof q === "function" ? q(massKg) : q);
  // if the functional set alone outweighs the part, scale it down proportionally (keep ≥1 of each)
  let functional = Object.entries(bom).reduce((s, [c, q]) => s + q * COMPONENTS[c].kg, 0);
  const cap = massKg * 0.82;
  if (functional > cap) { const k = cap / functional; for (const c of Object.keys(bom)) bom[c] = Math.max(1, Math.round(bom[c] * k)); functional = Object.entries(bom).reduce((s, [c, q]) => s + q * COMPONENTS[c].kg, 0); }
  // fasteners and wiring scale with the part, then structure takes the remainder
  const fast = Math.max(massKg * 0.03, 0.6);
  const fasteners = massKg > 2000 ? "c.bolt_m12" : massKg > 150 ? "c.bolt_m6" : "c.bolt_m4";
  add(fasteners, Math.max(2, Math.round(fast * 0.7 / COMPONENTS[fasteners].kg)));
  add("c.rivet", Math.max(1, Math.round(fast * 0.2 / COMPONENTS["c.rivet"].kg)));
  add("c.weld_wire", Math.max(1, Math.round(fast * 0.1 / COMPONENTS["c.weld_wire"].kg)));
  if (p.pwr !== 0 || p.lamp) add("c.harness", Math.max(1, Math.round(massKg * 0.03 / COMPONENTS["c.harness"].kg)));
  let used = Object.entries(bom).reduce((s, [c, q]) => s + q * COMPONENTS[c].kg, 0);
  const remain = Math.max(0, massKg - used);
  const fill = FILL[p.drive ? "_drive" : p.prefab] || FILL.module;
  for (const [c, share] of Object.entries(fill)) { const q = Math.round(remain * share / COMPONENTS[c].kg); if (q > 0) add(c, q); }
  // final trim: nudge the largest structural line so Σ lands within 2% of the declared mass
  used = Object.entries(bom).reduce((s, [c, q]) => s + q * COMPONENTS[c].kg, 0);
  const big = Object.keys(fill).sort((a, b) => COMPONENTS[b].kg - COMPONENTS[a].kg).find(c => bom[c]);
  if (big) { const diff = massKg - used; const step = COMPONENTS[big].kg; const n = Math.round(diff / step); if (n) bom[big] = Math.max(1, bom[big] + n); }
  return bom;
}

export function bomMass(bom) { return Object.entries(bom).reduce((s, [c, q]) => s + q * COMPONENTS[c].kg, 0); }

/* recursive roll-up to raw materials; also counts fastener pieces */
export function expandBom(bom, out = { materials: {}, fasteners: 0, components: {} }, mult = 1) {
  for (const [c, q] of Object.entries(bom)) {
    const comp = COMPONENTS[c];
    if (!comp) throw new Error(`unknown component ${c}`);
    out.components[c] = (out.components[c] || 0) + q * mult;
    if (c.startsWith("c.bolt") ) out.fasteners += q * mult * 50;
    if (c === "c.rivet") out.fasteners += q * mult * 200;
    if (c === "c.insert") out.fasteners += q * mult * 100;
    for (const [k, v] of Object.entries(comp.bom)) {
      if (MATERIALS[k]) out.materials[k] = (out.materials[k] || 0) + v * q * mult;
      else expandBom({ [k]: v }, out, q * mult);
    }
  }
  return out;
}

/* hull structure from the tracked volumes: skin area → plates, frames, bumper, MLI, welds, bolts */
export function hullBom(builder) {
  const bom = {};
  const add = (c, q) => { bom[c] = (bom[c] || 0) + Math.max(1, Math.round(q)); };
  let area = 0, length = 0;
  for (const v of builder.hullVols) { area += 2 * (v.w * v.h + v.w * v.d + v.h * v.d); length += v.d; }
  add("c.plate_al", area * 1.0);            // pressure skin
  add("c.whipple_layer", area * 0.6);       // outer bumper over 60% of the skin
  add("c.honeycomb", area * 0.3);           // internal decks
  add("c.frame_al", length * 6);            // longerons + frames
  add("c.frame_ti", length * 1.5);          // primary load path
  add("c.metglass_joint", length * 0.8);
  add("c.mli", area * 0.9);
  add("c.weld_wire", area * 0.35);
  add("c.bolt_m6", area * 0.6);             // ~30 bolts per m² of skin
  add("c.rivet", area * 0.25);
  add("c.insert", area * 0.15);
  add("c.seal_oring", area * 0.05);
  add("c.harness", length * 2);
  add("c.busbar", length * 0.6);
  add("c.tube_steel", length * 2.5);
  add("c.heatpipe", area * 0.15);
  add("c.hatch", 2 + Math.round(length / 12));
  add("c.window_sapphire", 6 + Math.round(area / 40));
  add("c.handrail", area * 0.1);
  add("c.standoff", area * 0.4);
  return { bom, area, length };
}

/* whole-ship roll-up: hull + every mounted part + the drive */
export function shipBom(builder, parts, drivePart) {
  const total = { materials: {}, fasteners: 0, components: {} };
  const hull = hullBom(builder);
  expandBom(hull.bom, total);
  for (const m of builder.mounted) expandBom(partBom(m.part), total);
  if (drivePart) expandBom(partBom(drivePart), total);
  const massKg = Object.values(total.materials).reduce((s, v) => s + v, 0);
  return { ...total, massKg, hullArea: hull.area };
}
