/* Station archetypes: what the place is for, and therefore what it is
 * built of and shaped like.
 *
 *   hull      the hull grammar the builder grows (see builder/hull.js)
 *   style     the architecture it is built in (see data/styles.js)
 *   tier      default population tier
 *   doctrine  modules the archetype fits beyond the tier's habitation set,
 *             as "id" or "id×n"
 *   hangars   hangar mouths (each is an entry side + an exit side)
 *   palette   livery — hull is tinted further by the alloy the style rolls
 */
export const ARCHETYPES = {
  tradehub: {
    label: "Trade Hub", hull: "cross", style: "civic", tier: "II", hangars: 2,
    blurb: "A crossroads with a market at its heart: concourse, bonded warehouses, two hangar mouths and traffic control that never sleeps.",
    doctrine: ["cg.trading", "cg.warehouse×2", "cg.depot", "cmd.traffic", "dk.docking×2", "cd.comms", "cd.phased_slab", "sw.sensors", "pw.solar×2", "pw.storage", "sf.defense", "sf.pdc_cluster", "sf.shield", "mf.fab"],
    palette: { hull: "#b9bfc9", dark: "#3c434f", accent: "#e0b24a", glow: "#ffd27a", finish: "brushed" },
  },
  shipyard: {
    label: "Shipyard", hull: "lattice", style: "industrial", tier: "II", hangars: 2,
    blurb: "Open jigs on a lattice, a foundry at the dirty end, hangars big enough to swallow a cruiser.",
    doctrine: ["mf.shipyard×2", "mf.industrial", "mf.fab×2", "cg.warehouse", "cg.depot", "cmd.traffic", "dk.docking", "cd.comms", "sw.sensors", "pw.reactor", "pw.storage", "sf.defense", "sf.pdc_cluster", "sf.drone_bay"],
    palette: { hull: "#9aa3ad", dark: "#2f353d", accent: "#ff8a3d", glow: "#ffb070", finish: "weathered" },
  },
  industrial: {
    label: "Industrial Complex", hull: "spindle", style: "industrial", tier: "II", hangars: 1,
    blurb: "Refinery drums and furnaces stacked on a spine, radiators like sails, a hangar for the ore boats.",
    doctrine: ["mf.industrial×2", "mf.fab", "cg.warehouse", "cg.depot", "cmd.traffic", "dk.docking", "cd.comms", "sw.sensors", "pw.reactor", "pw.storage", "tc.radiators", "sf.pdc_cluster", "sf.armoury"],
    palette: { hull: "#8e9399", dark: "#2b2f35", accent: "#d9c23a", glow: "#fff0a0", finish: "weathered" },
  },
  agricultural: {
    label: "Agricultural Ring", hull: "torus", style: "agrarian", tier: "II", hangars: 1,
    blurb: "Greenhouses on a sunlit ring, algae farms at the hub, food going out on every lane.",
    doctrine: ["ag.farm×3", "ag.algae×2", "cg.trading", "cg.warehouse", "cmd.traffic", "dk.docking", "cd.comms", "sw.sensors", "pw.solar×2", "pw.solar_fan", "pw.storage", "sf.pdc_cluster"],
    palette: { hull: "#c6ccc4", dark: "#3a4a3e", accent: "#79c96a", glow: "#c8ff9a", finish: "ceramic" },
  },
  research: {
    label: "Research Station", hull: "cluster", style: "research", tier: "I", hangars: 1,
    blurb: "Lab spheres on a despun mast, an observatory in the shade, a small crew and a great deal of computing.",
    doctrine: ["sc.rnd×2", "sc.observatory", "cmd.traffic", "dk.docking", "cd.comms", "cd.big_dish", "sw.sensors", "pw.solar", "pw.concentrators", "pw.storage", "tc.radiators", "sf.pdc_cluster", "sf.shield"],
    palette: { hull: "#d7dde6", dark: "#3d4656", accent: "#6fc3ff", glow: "#a8dcff", finish: "ceramic" },
  },
  military: {
    label: "Military Bastion", hull: "bastion", style: "bastion", tier: "II", hangars: 2,
    blurb: "A star fort in sloped plate: batteries on every hard point, a spinal gun down the axis, a siege laser, shields, drone wings and blast doors on the hangars.",
    doctrine: ["sf.defense×4", "sf.pdc_cluster×4", "sf.laser_battery×2", "sf.missile_cells×2", "sf.spinal", "sf.siege_laser", "sf.shield×2", "sf.drone_bay×2", "sf.fire_control×2", "sf.armoury", "hb.brig", "cmd.traffic", "dk.docking×2", "cd.comms", "cd.phased_slab", "sw.sensors×2", "pw.reactor", "pw.storage×2", "mf.fab", "cg.warehouse", "cg.depot", "tc.radiators"],
    palette: { hull: "#6f7d8c", dark: "#232a33", accent: "#8fd6ff", glow: "#bfe9ff", finish: "matte" },
  },
  habitat: {
    label: "Habitat City", hull: "drum", style: "civic", tier: "III", hangars: 3,
    blurb: "A rotating drum with districts under a sky, farms in the light, three hangar mouths and a fusion plant a kilometre behind the shield.",
    doctrine: ["cg.trading×2", "cg.warehouse×2", "cmd.traffic×2", "dk.docking×3", "cd.comms×2", "cd.big_dish", "sw.sensors×2", "pw.fusion", "pw.solar×2", "pw.solar_sail", "pw.storage×2", "sf.defense×2", "sf.pdc_cluster×3", "sf.shield×2", "sf.drone_bay", "sc.rnd", "mf.fab×2", "tc.radiators×2"],
    palette: { hull: "#cfd4dc", dark: "#3b4250", accent: "#f0c78a", glow: "#ffe3b0", finish: "brushed" },
  },
  piratehold: {
    label: "Free Port", hull: "cluster", style: "frontier", tier: "I", hangars: 1,
    blurb: "A rock-anchored hold of welded hulls: guns up, one hangar, drones in the tubes, no customs office.",
    doctrine: ["sf.defense×3", "sf.pdc_cluster×2", "sf.missile_cells", "sf.drone_bay", "hb.brig", "cg.warehouse", "cg.depot", "dk.docking", "cd.comms", "sw.sensors", "pw.kilo_bank", "pw.storage", "mf.fab"],
    palette: { hull: "#7a6f66", dark: "#2a2420", accent: "#d4573a", glow: "#ff8a5a", finish: "weathered" },
  },
  relay: {
    label: "Relay Outpost", hull: "spindle", style: "research", tier: "I", hangars: 1,
    blurb: "A mast with a crew: dishes, lasers, one small hangar, enough farm to feed forty.",
    doctrine: ["cd.comms×2", "cd.big_dish", "cd.phased_slab", "sw.sensors", "cmd.traffic", "dk.docking", "pw.solar×2", "pw.storage", "tc.radiators", "sf.pdc_cluster"],
    palette: { hull: "#c9ced6", dark: "#3a3f48", accent: "#9be0d0", glow: "#c9fff0", finish: "brushed" },
  },
  sanctum: {
    label: "Pilgrim Sanctum", hull: "cathedral", style: "cathedral", tier: "II", hangars: 1,
    blurb: "A nave a kilometre long in bronze and glass: the great west door is the hangar, spires carry the comms, a rose window lights the approach, and the pilgrim guard keeps a shield up.",
    doctrine: ["hb.commons×2", "hb.medical", "ag.farm", "cg.trading", "cg.warehouse", "cmd.traffic", "dk.docking×2", "cd.comms×2", "cd.big_dish", "sw.sensors", "pw.solar×2", "pw.concentrators", "pw.storage", "sf.shield", "sf.pdc_cluster", "sf.drone_bay", "sc.observatory"],
    palette: { hull: "#b39a74", dark: "#3a2f26", accent: "#ffd9a0", glow: "#ffe9c0", finish: "brushed" },
  },
  foundry: {
    label: "Frontier Foundry", hull: "ziggurat", style: "frontier", tier: "I", hangars: 1,
    blurb: "A stepped hulk of welded holds and furnaces: it makes its own plate, its own drones and most of its own trouble.",
    doctrine: ["mf.industrial", "mf.fab", "sf.armoury", "cg.warehouse×2", "cg.depot", "cmd.traffic", "dk.docking", "cd.comms", "sw.sensors", "pw.kilo_bank×2", "pw.storage", "tc.radiators", "sf.defense", "sf.pdc_cluster×2", "sf.drone_bay"],
    palette: { hull: "#8b8078", dark: "#2a2622", accent: "#ff9d4a", glow: "#ffc48a", finish: "weathered" },
  },
};
export const ARCHETYPE_KEYS = Object.keys(ARCHETYPES);
