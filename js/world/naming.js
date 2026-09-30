import { NameGenerator } from "../vendor/stellar-names/index.js";
import { CLASSIFIED_NAMES } from "../vendor/stellar-names/classified-names.js";

export const HUMAN_GIVEN_M = CLASSIFIED_NAMES.male;
export const HUMAN_GIVEN_F = CLASSIFIED_NAMES.female;
export const HUMAN_LAST = CLASSIFIED_NAMES.surname;

const SECTOR_WORDS = {
  military: ["Bastion", "Picket", "Redoubt", "Muster", "Garrison"],
  industrial: ["Forge", "Smelt", "Yard", "Kiln", "Foundry"],
  civilian: ["Haven", "Commons", "Terrace", "Quarter", "Landing"],
  agricultural: ["Grange", "Vat", "Furrow", "Harvest", "Green"],
  pirate: ["Hookfall", "Blackreach", "Sump", "The Nail", "Cutter's Rest"],
};
const SUFFIX = [
  "Station", "Platform", "Anchorage", "Ring", "Post", "Works", "Hold",
  "Orbital", "Exchange", "Shipyard", "Citadel", "Spindle", "Gateway",
  "Relay", "Depot", "Terminal", "Habitat", "Outpost",
];
const CORPORATE = { industrial: 0.3, civilian: 0.22, military: 0.1, agricultural: 0.12, pirate: 0 };

let namer = null;
let namerSeed = null;

export function openSkyNames(skySeed = "sky") {
  namerSeed = String(skySeed);
  namer = new NameGenerator({ seed: `${namerSeed}:ports` });
  return namer;
}

export function reserveNames(list) {
  if (namer && list?.length) namer.reserve(list.filter((s) => typeof s === "string" && s.trim()));
}

export function stationName(sector) {
  if (!namer) openSkyNames(namerSeed ?? "sky");
  const words = SECTOR_WORDS[sector] ?? SECTOR_WORDS.civilian;
  const corp = CORPORATE[sector] ?? 0.15;
  const rnd = () => namer.random();

  for (let attempt = 0; attempt < 40; attempt++) {
    const roll = rnd();
    let out;
    if (roll < corp) {
      const raw = namer.name("station", { style: "corporate", unique: false });
      out = `${raw.split(" ")[0]} ${pick(rnd, SUFFIX)}`;
    } else if (roll < corp + 0.16) {
      out = `${pick(rnd, words)} ${pick(rnd, SUFFIX)}`;
    } else {
      const word = pick(rnd, words);
      if (/^The\s|'s\s/.test(`${word} `)) out = `${word} ${pick(rnd, SUFFIX)}`;
      else out = `${pick(rnd, namer.data.frontier)} ${word} ${pick(rnd, SUFFIX)}`;
    }
    const key = out.toLocaleLowerCase("en-US");
    if (!namer.used.has(key)) { namer.used.add(key); return out; }
  }
  return `${pick(rnd, words)} ${pick(rnd, SUFFIX)} ${1 + Math.floor(rnd() * 99)}`;
}

function pick(rnd, arr) {
  return arr[Math.max(0, Math.min(arr.length - 1, Math.floor(rnd() * arr.length)))];
}

export function portNameSpace() {
  const adj = new NameGenerator({ seed: "count" }).data.frontier.length;
  const perSector = (w) => w * SUFFIX.length + adj * w * SUFFIX.length;
  let total = 0;
  for (const w of Object.values(SECTOR_WORDS)) total += perSector(w.length);
  return { adjectives: adj, suffixes: SUFFIX.length, total };
}
