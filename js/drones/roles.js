/* LIVING GALAXY — the drone roles.
 *
 * Pure data: what each kind of work drone is, where it can be built, what the
 * robot generator grows for it, and what it asks you once it rolls off the
 * line. The behaviour lives in ops.js; the machine in droneforge.js.
 *
 * One role per industry the careers already name, so a drone is the robot
 * version of a job a captain or a crew hand could hold:
 *
 *   miner      mining            cuts rock at a site, stashes ore at home
 *   hauler     logistics         shuttles for your miners, or runs NPC freight
 *   combat     security          defends home, guards a slot, or patrols a route
 *   salvager   salvage           tractors wreck and debris, stashes the scrap
 *   surveyor   research          sweeps an area, assays, marks the rich veins
 *   harvester  energy            ice off the frost pockets, or gas off a giant
 *   courier    commerce          buys low at one port, sells high at another
 *   relay      communications    parks on a point; an early-warning picket
 *   repair     shipyard          follows a ship, drone or port and patches it
 *
 * Drones are the small end of the board: a third to half the hold of the
 * crewed hull doing the same job, a little faster on the legs and quicker on
 * the clamps, and they never stop to eat. A company fields them — yours or an
 * NPC corporation's — and they share one work board (board.js) with the
 * crewed hulls, so a freight slot a drone takes is a slot a captain does not.
 *
 * Numbers are in world units (1 u = 10 m) and sim seconds.
 */

export const DRONE_CAP = 10;          // drones a company may field in one sky
export const LANE_SPEED = 36000;      // u/s: a drone's micro-warp across a belt or between neighbours (a crewed hull warps at 30k)
export const JUMP_SPEED = 55000;      // u/s: cross-system legs ride the same warp you do
export const NEAR_SPEED = 640;        // u/s: working pace near a site (crewed hulls close at ~500)
export const LANE_OVER = 16000;       // legs longer than this take the micro-warp
export const JUMP_OVER = 800000;      // legs longer than this take the warp
export const DOCK_SECS = 4;           // clamps, stash, undock — no crew to walk off the ramp
export const PRICE_K = 0.1;           // robotgen parts cost → credits (a starter miner lands near 3k)

/* who can build what: a port's sector decides its drone lines */
const IND = ["industrial"];
const LOG = ["logistic"];
const MIL = ["military"];
const CIV = ["civilian"];
const AGR = ["agricultural"];

export const DRONE_ROLES = {
  miner: {
    id: "miner", label: "Miner", complex: "mining", sectors: [...IND, "pirate"],
    blurb: "Cuts rock at a site you choose and brings the ore home to your locker.",
    robot: { role: "mining", locomotion: "hover", len: 10 },
    hold: 36, hp: 90, rate: 1.6, buildSecs: 60,
    modes: null,
    asks: ["home", "site"],
  },
  hauler: {
    id: "hauler", label: "Hauler", complex: "logistics", sectors: [...LOG, ...IND],
    blurb: "Shuttles ore for your miners, or takes freight between NPC ports for a fee.",
    robot: { role: "loader", locomotion: "hover", len: 11 },
    hold: 80, hp: 110, buildSecs: 70,
    modes: { passive: "Passive haul — find its own work", manual: "Manual — you pick the slot" },
    defaultMode: "passive",
    asks: ["home", "mode"],
  },
  combat: {
    id: "combat", label: "Combat", complex: "security", sectors: [...MIL, "pirate"],
    blurb: "Defends home, guards a ship, drone, port or mark, or flies a patrol route.",
    robot: { role: "interceptor", locomotion: "plane", len: 9 },
    hold: 0, hp: 160, dps: 7, range: 3500, buildSecs: 80,
    modes: { defend: "Passive defend — hold around home", guard: "Guard a slot", patrol: "Patrol between points" },
    defaultMode: "defend",
    asks: ["home", "mode"],
  },
  salvager: {
    id: "salvager", label: "Salvager", complex: "salvage", sectors: [...IND, "pirate"],
    blurb: "Tractors wreck and debris near a site — or chases fresh wreckage — and stashes it.",
    robot: { role: "salvage", locomotion: "hover", len: 10 },
    hold: 48, hp: 100, buildSecs: 60,
    modes: { site: "Work one site", chase: "Chase fresh wreckage" },
    defaultMode: "chase",
    asks: ["home", "mode"],
  },
  surveyor: {
    id: "surveyor", label: "Surveyor", complex: "research", sectors: [...CIV, ...LOG],
    blurb: "Sweeps an area, assays what it passes, and marks rich veins on your chart.",
    robot: { role: "survey", locomotion: "plane", len: 6 },
    hold: 0, hp: 60, sweepR: 12000, buildSecs: 45,
    modes: null,
    asks: ["home", "site"],
  },
  harvester: {
    id: "harvester", label: "Harvester", complex: "energy", sectors: [...AGR, ...IND],
    blurb: "Melts ice off the frost pockets, or skims gas off a giant, and brings it home.",
    robot: { role: "industrial", locomotion: "hover", len: 10 },
    hold: 42, hp: 90, rate: 1.3, buildSecs: 65,
    modes: { ice: "Ice — frost pockets and icy rock", gas: "Gas — skim a giant's upper air" },
    defaultMode: "ice",
    asks: ["home", "mode", "site"],
  },
  courier: {
    id: "courier", label: "Courier", complex: "commerce", sectors: [...LOG, ...CIV],
    blurb: "Trades on your account: buys where a good is cheap and sells where it is short.",
    robot: { role: "courier", locomotion: "plane", len: 7 },
    hold: 30, hp: 70, budget: 1500, buildSecs: 50,
    modes: { auto: "Auto — best margin near home", route: "Fixed route — you pick the pair" },
    defaultMode: "auto",
    asks: ["home", "mode"],
  },
  relay: {
    id: "relay", label: "Relay", complex: "communications", sectors: [...CIV, ...LOG, ...MIL],
    blurb: "Parks on a point and watches 30 km around it; warns you and your guns of raiders.",
    robot: { role: "comms", locomotion: "hover", len: 8 },
    hold: 0, hp: 70, watchR: 30000, buildSecs: 40,
    modes: null,
    asks: ["home", "site"],
  },
  repair: {
    id: "repair", label: "Repair", complex: "shipyard", sectors: [...IND, ...MIL],
    blurb: "Follows a ship, drone or port and patches its hull from a charge it refills at home.",
    robot: { role: "utility", locomotion: "hover", len: 8 },
    hold: 0, hp: 80, charge: 300, rate: 1.5, buildSecs: 55,
    modes: null,
    asks: ["home", "guard"],
  },
};

export const ROLE_IDS = Object.keys(DRONE_ROLES);

/** Roles a port's lines can build (a claimed free port builds its sector's too). */
export function rolesAt(st) {
  if (!st) return [];
  if (st.hostile && !st.claimed) return [];
  return ROLE_IDS.filter((id) => DRONE_ROLES[id].sectors.includes(st.sector));
}

/** What each setup question is called on the deck. */
export const ASK_LABEL = {
  home: "Home port",
  site: "Start location",
  mode: "Orders",
  guard: "Who to look after",
};
