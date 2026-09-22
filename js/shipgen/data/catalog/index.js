/* Catalog assembly. One file per master-tree domain; add a domain by dropping
 * a file in this folder and listing it below. PARTS is the flat id → part index. */
import d00 from "./00-identity.js";
import d01 from "./01-propulsion.js";
import d02 from "./02-fluids.js";
import d03 from "./03-power.js";
import d04 from "./04-epds.js";
import d05 from "./05-structure.js";
import d06 from "./06-materials.js";
import d07 from "./07-thermal.js";
import d08 from "./08-computing.js";
import d09 from "./09-gnc.js";
import d10 from "./10-comms.js";
import d11 from "./11-sensors.js";
import d12 from "./12-atmosphere.js";
import d13 from "./13-water-waste-food.js";
import d14 from "./14-habitation.js";
import d15 from "./15-eva-docking.js";
import d16 from "./16-robotics.js";
import d17 from "./17-cargo.js";
import d18 from "./18-safety-defense.js";
import d19 from "./19-manufacturing.js";
import d20 from "./20-standards.js";

export const CATALOG = [d00, d01, d02, d03, d04, d05, d06, d07, d08, d09, d10, d11, d12, d13, d14, d15, d16, d17, d18, d19, d20];

export const PARTS = {};
for (const c of CATALOG) for (const g of c.groups) for (const p of g.parts) {
  if (PARTS[p.id]) throw new Error(`duplicate part id ${p.id} (${c.name})`);
  p.group = g.name; p.cat = c.name; p.domain = c.id;
  PARTS[p.id] = p;
}

/* weapon-family → catalog id, used by class doctrine */
export const WEAPON_PART = { railgun: "wp.rail", beam: "wp.beam", missile: "wp.vls", plasma: "wp.plasma", pdc: "wp.pdc", torpedo: "wp.torp",
  coil: "wp.coil", auto: "wp.auto", flak: "wp.flak", lance: "wp.lance", particle: "wp.particle", ciws: "wp.ciws", kkv: "wp.kkv", nuke: "wp.nuke", emp: "wp.emp", cluster: "wp.cluster" };
