import { COMPLEX_IDS } from "./complexes.js";

export const OPEN_GATE = [
  "verb",
  "site",
  "board",
  "feeds",
  "tutorial",
  "hull",
  "aria",
  "bench",
  "smoke",
];

export const CAREER_ARCS = [
  { minor: "", name: "Dead Hulls", careers: ["salvage"] },
  { minor: "", name: "The Watch", careers: ["security"] },
  { minor: "", name: "The Floor", careers: ["commerce", "logistics"] },
  { minor: "", name: "The Line", careers: ["manufacturing", "construction", "shipyard"] },
  { minor: "", name: "Heat and Weather", careers: ["energy", "terraforming"] },
  { minor: "", name: "Charted", careers: ["research", "navigation"] },
  { minor: "", name: "The Town", careers: ["healthcare", "agriculture", "education", "communications"] },
];

export const CAREER_STATUS = {
  mining: { state: "open", has: [...OPEN_GATE] },
  salvage: { state: "planned", has: ["verb", "site", "board", "feeds", "tutorial", "hull"], verb: "cut a dead hull apart for plate, parts and its black box" },
  security: { state: "planned", has: ["board", "feeds", "hull"], verb: "fly a picket wing, disable a mark and board it" },
  commerce: { state: "planned", has: ["board", "feeds"], verb: "post and fill orders on a port's book" },
  logistics: { state: "planned", has: ["board", "feeds"], verb: "run bonded freight on a manifest with a clock and a convoy" },
  manufacturing: { state: "planned", has: ["board"], verb: "run a leased fabrication line from ore to parts" },
  construction: { state: "planned", has: ["board"], verb: "lift and set sections on a build site in orbit" },
  shipyard: { state: "planned", has: ["board"], verb: "assemble and refit hulls on a yard slip" },
  energy: { state: "planned", has: ["board"], verb: "bunker fuel and bring a failing port reactor back" },
  terraforming: { state: "planned", has: ["board", "verb"], verb: "park on a world and move its sky, project by project" },
  research: { state: "planned", has: ["board", "feeds"], verb: "work an anomaly from far scan to sample to paper" },
  navigation: { state: "planned", has: ["board", "feeds"], verb: "chart a lane beacon by beacon and sell the chart" },
  healthcare: { state: "planned", has: [], verb: "run a sick bay for crew, settlers and pulled survivors" },
  agriculture: { state: "planned", has: [], verb: "grow a hydroponic bay that feeds the hull and the port" },
  education: { state: "planned", has: [], verb: "train crew and raise children into the rolls" },
  communications: { state: "planned", has: [], verb: "keep relays lit and sell what comes over them" },
};

const arcOf = new Map(CAREER_ARCS.flatMap((a) => a.careers.map((id) => [id, a])));

export function careerStatus(id) {
  const s = CAREER_STATUS[id];
  if (!s) return { id, state: "planned", open: false, has: [], verb: "", arc: null, eta: "", missing: [...OPEN_GATE] };
  const arc = arcOf.get(id) ?? null;
  return { id, ...s, open: s.state === "open" && OPEN_GATE.every((g) => s.has.includes(g)), arc, eta: "", missing: OPEN_GATE.filter((g) => !s.has.includes(g)) };
}

export const isCareerOpen = (id) => careerStatus(id).open;

export const openCareers = () => COMPLEX_IDS.filter(isCareerOpen);
