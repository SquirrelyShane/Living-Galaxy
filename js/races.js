/* LIVING GALAXY — races.
 *
 * Every trait here lands on something the sim already simulates. A race that
 * "runs cold" really does draw less life support; one that "reads the well"
 * really does lock faster. Nothing is flavour-only.
 *
 * traits are multipliers unless noted:
 *   rcs      attitude and thruster authority
 *   life     life-support draw (lower is better)
 *   hull     hull integrity
 *   reactor  reactor output
 *   hold     cargo capacity
 *   lock     signature-lock speed
 *   gTol     tolerance to acceleration and impact shake (lower shake is better)
 *   heat     resistance to solar and re-entry heating (lower damage is better)
 *   scan     survey range
 *   credits  flat starting credits
 */

import { RACE_EFFECTS, effectLines } from "./careers/effects.js";

export const RACES = [
  {
    id: "terran",
    name: "Terran",
    origin: "Sol, and every rock Sol ever shipped people to",
    blurb:
      "Unremarkable in every direction, which turns out to be the point. Terrans hold up under conditions that specialists would refuse, and there is a Terran on every dock in the reach.",
    colour: "#6b9ac4",
    traits: { rcs: 1, life: 1, hull: 1.05, reactor: 1, hold: 1.05, lock: 1, gTol: 1, heat: 1, scan: 1, credits: 600 },
    affinity: { piloting: 8, supplyChain: 8, command: 6 },
    note: "No weakness worth naming. Extra hull and hold, and more scrip to start.",
  },
  {
    id: "tsynth",
    name: "T-Synth",
    origin: "Foundry-born, mostly from the Ceres and Tethys lines",
    blurb:
      "Grown to a specification and aware of it. A T-Synth does not breathe so much as maintain, which makes the cabin cheap to run and the crew unnerving to share it with.",
    colour: "#9ec4e6",
    traits: { rcs: 1.12, life: 0.35, hull: 1, reactor: 1.08, hold: 0.95, lock: 1.15, gTol: 0.7, heat: 1, scan: 1, credits: 300 },
    affinity: { electronics: 14, dataOps: 12, precisionFab: 8 },
    note: "Barely needs air, takes hard g without flinching, and locks fast. Light hold.",
  },
  {
    id: "eridian",
    name: "Eridian",
    origin: "Epsilon Eridani deep-orbit habitats",
    blurb:
      "Raised in spin gravity a third of standard and a sky full of nothing. Eridians read a gravity well the way other people read a room, and they are miserable at the bottom of one.",
    colour: "#7fb8c9",
    traits: { rcs: 1.2, life: 0.9, hull: 0.88, reactor: 1, hold: 1, lock: 1.25, gTol: 1.35, heat: 1.1, scan: 1.2, credits: 450 },
    affinity: { navigation: 14, geology: 8, research: 8 },
    note: "Best pilots and surveyors alive. Thin hulls and they bruise under acceleration.",
  },
  {
    id: "vantari",
    name: "Vantari",
    origin: "The Vant deep-cold drift colonies",
    blurb:
      "Long-limbed, slow-pulsed and patient past the point most species call reasonable. They mine ice for centuries and consider that a career, not a sentence.",
    colour: "#a8d8e4",
    traits: { rcs: 0.9, life: 0.55, hull: 1.1, reactor: 0.95, hold: 1.2, lock: 0.9, gTol: 1.1, heat: 1.35, scan: 1.05, credits: 400 },
    affinity: { geology: 12, hazardOps: 10, terraforming: 8 },
    note: "Enormous hold, sips air, but they cook near a star and turn slowly.",
  },
  {
    id: "korrash",
    name: "Korrash",
    origin: "High-gravity worlds on the inner rim",
    blurb:
      "Built dense for 2.4 g and unimpressed by anything less. A Korrash walks off a burn that would put a Terran in the medbay.",
    colour: "#c4a07a",
    traits: { rcs: 0.85, life: 1.25, hull: 1.3, reactor: 1, hold: 1.1, lock: 0.95, gTol: 0.5, heat: 0.9, scan: 0.9, credits: 350 },
    affinity: { heavyOps: 14, construction: 10, security: 8 },
    note: "Ignores acceleration, heavy hull. Thirsty for air and slow on the sticks.",
  },
  {
    id: "sef",
    name: "Sef",
    origin: "Nomad hulls with no registered homeworld",
    blurb:
      "Born, married and buried aboard. The Sef have never held a charter and consider the question rude, which is why every port knows their prices and no port knows their names.",
    colour: "#c9a05c",
    traits: { rcs: 1.05, life: 0.85, hull: 0.95, reactor: 1, hold: 1.35, lock: 1, gTol: 1, heat: 1, scan: 1, credits: 1400 },
    affinity: { commerce: 16, supplyChain: 12, law: 6 },
    note: "The biggest hold and the deepest pockets. Nothing else stands out.",
  },
  {
    id: "ashwalker",
    name: "Ashwalker",
    origin: "The cinder belts of dead inner systems",
    blurb:
      "Their ancestors worked photosphere tugs and the ones who survived passed on the shielding. They take contracts nobody else will read twice.",
    colour: "#ff8f5c",
    traits: { rcs: 1, life: 1.1, hull: 1.15, reactor: 1.12, hold: 0.95, lock: 1, gTol: 0.85, heat: 0.35, scan: 0.95, credits: 400 },
    affinity: { energySystems: 14, hazardOps: 12, materials: 6 },
    note: "Flies close to stars and inside atmospheres. Hot reactor, hungry cabin.",
  },
  {
    id: "myrrin",
    name: "Myrrin",
    origin: "Ring-farm collectives around the gas giants",
    blurb:
      "Growers. They feed three systems and hold the patents on most of what you have eaten this year, and they will tell you about it.",
    colour: "#7d9a7e",
    traits: { rcs: 0.95, life: 0.5, hull: 1, reactor: 0.95, hold: 1.25, lock: 0.95, gTol: 1.05, heat: 1.05, scan: 1, credits: 700 },
    affinity: { agriculture: 16, lifeSupport: 12, genetics: 8 },
    note: "Closed-loop cabin, big hold. Not built for a fight.",
  },
  {
    id: "delvath",
    name: "Delvath",
    origin: "Subsurface warrens of tide-locked worlds",
    blurb:
      "Grew up under kilometres of rock with a lamp and a hand on the wall. Give a Delvath a shaft and a week and they will hand you a map of everything under it.",
    colour: "#9a8f84",
    traits: { rcs: 0.95, life: 0.8, hull: 1.2, reactor: 1, hold: 1.15, lock: 1.1, gTol: 0.9, heat: 1.1, scan: 1.3, credits: 350 },
    affinity: { geology: 16, heavyOps: 10, hazardOps: 8 },
    note: "Longest survey range in the reach, tough hull, and they find the good rock.",
  },
  {
    id: "oberlin",
    name: "Oberlin",
    origin: "Corporate crèche worlds, raised on contract",
    blurb:
      "Bred by the majors for administration and quietly very good at it. An Oberlin arrives with a line of credit and three people who owe them favours.",
    colour: "#b7c6d8",
    traits: { rcs: 1, life: 1, hull: 0.95, reactor: 1.05, hold: 1, lock: 1.05, gTol: 1, heat: 1, scan: 1, credits: 2200 },
    affinity: { law: 14, commerce: 12, command: 10 },
    note: "Starts rich and well-connected. Standing with the majors opens higher.",
  },
  {
    id: "haask",
    name: "Haask",
    origin: "The shatter-fields, wherever those are this decade",
    blurb:
      "Wreck-cutters. They can tell you what a hull was worth before it broke and what it is worth now, and the second number is usually higher.",
    colour: "#8a8178",
    traits: { rcs: 1.05, life: 0.95, hull: 1.1, reactor: 1, hold: 1.3, lock: 1.1, gTol: 0.95, heat: 1, scan: 1.1, credits: 500 },
    affinity: { salvage: 18, hullcraft: 10, materials: 6 },
    note: "Built for debris fields. Big hold, good eyes, tough enough for the work.",
  },
  {
    id: "veyd",
    name: "Veyd",
    origin: "Nobody agrees, and the Veyd have not clarified",
    blurb:
      "Small, quiet, and better at electronics than anything has a right to be. A Veyd-tuned array will hold a lock through a solar flare.",
    colour: "#a8b4c8",
    traits: { rcs: 1.15, life: 0.7, hull: 0.85, reactor: 1.15, hold: 0.9, lock: 1.45, gTol: 1.1, heat: 1.1, scan: 1.25, credits: 400 },
    affinity: { electronics: 16, dataOps: 14, research: 8 },
    note: "The finest sensors and the strongest reactor. Fragile, and a small hold.",
  },
  {
    id: "brann",
    name: "Brann",
    origin: "Shipyard clans of the outer docks",
    blurb:
      "Four generations to a hull and they will tell you which of them laid which plate. A Brann repairs underway what other crews would abandon.",
    colour: "#c9d2dc",
    traits: { rcs: 1, life: 1, hull: 1.35, reactor: 1.05, hold: 1.05, lock: 0.95, gTol: 0.95, heat: 0.95, scan: 0.95, credits: 550 },
    affinity: { hullcraft: 16, propulsion: 12, precisionFab: 8 },
    note: "The toughest hull flying, and they keep it that way.",
  },
  {
    id: "sirrah",
    name: "Sirrah",
    origin: "Medical orders out of the old core worlds",
    blurb:
      "An order more than a people. They go where the casualties are, hold no territory, and are welcome in ports that shoot at everyone else.",
    colour: "#dfe6e2",
    traits: { rcs: 1, life: 0.75, hull: 1, reactor: 1, hold: 1.1, lock: 1, gTol: 1.15, heat: 1, scan: 1.05, credits: 800 },
    affinity: { firstAid: 16, surgery: 12, xenomed: 10 },
    note: "Neutral everywhere. Efficient cabin, and hostiles think twice.",
  },
  {
    id: "kethran",
    name: "Kethran",
    origin: "Border fleets that never stood down",
    blurb:
      "Disciplined to the point of superstition. The Kethran kept flying patrol routes for eighty years after the charter that ordered them lapsed.",
    colour: "#c45c5c",
    traits: { rcs: 1.1, life: 1.05, hull: 1.2, reactor: 1.05, hold: 0.85, lock: 1.2, gTol: 0.75, heat: 1, scan: 1.1, credits: 400 },
    affinity: { security: 16, command: 12, law: 6 },
    note: "A warship crew in a civilian hull. Small hold, everything else sharp.",
  },
];

export const RACE_IDS = RACES.map((r) => r.id);

export function raceById(id) {
  return RACES.find((r) => r.id === id) ?? RACES[0];
}

const DEFAULT_TRAITS = {
  rcs: 1, life: 1, hull: 1, reactor: 1, hold: 1, lock: 1, gTol: 1, heat: 1, scan: 1, credits: 0,
};

export function traitsOf(id) {
  return { ...DEFAULT_TRAITS, ...(raceById(id).traits ?? {}) };
}

/** Human-readable deltas, for the creation screen. */
export function traitLines(id) {
  const t = traitsOf(id);
  const out = [];
  /* Always show the raw change; `higherIsBetter` decides how it reads. */
  const add = (label, v, higherIsBetter) => {
    if (Math.abs(v - 1) <= 0.02) return;
    const d = Math.round((v - 1) * 100);
    out.push({ label, value: `${d >= 0 ? "+" : ""}${d}%`, good: higherIsBetter ? d > 0 : d < 0 });
  };
  add("Attitude authority", t.rcs, true);
  add("Life support draw", t.life, false);
  add("Hull integrity", t.hull, true);
  add("Reactor output", t.reactor, true);
  add("Cargo capacity", t.hold, true);
  add("Lock speed", t.lock, true);
  add("Impact shake", t.gTol, false);
  add("Heat damage", t.heat, false);
  add("Survey range", t.scan, true);
  if (t.credits) out.push({ label: "Starting scrip", value: `${t.credits} cr`, good: true });
  for (const e of effectLines(RACE_EFFECTS[id])) out.push(e);
  return out;
}
