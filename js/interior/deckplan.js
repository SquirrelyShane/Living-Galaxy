/* LIVING GALAXY experimental — hull deck plans.
 *
 * Every hull in the registry grows a deterministic interior from its def and
 * the pilot's seed: one to three decks on a central spine, rooms sized to the
 * hull's tier, and the industrial spaces its complex would actually carry.
 * The interior is scaled up from the exterior on purpose — a 24 m skiff has
 * a bridge you can stand in — because the deck plan is a place to be, not a
 * cutaway. `INTERIOR_SCALE` is the one knob.
 *
 * Rooms are laid out in grid cells (1 cell ≈ 3 m). Doors open onto the deck's
 * corridor band (y ∈ [0,1)); a lift shaft at `liftX` joins the decks. The
 * router in interior.js walks room → door → corridor → lift → … → room.
 */

import { COMPLEXES } from "../careers/complexes.js";
import { RANK_LETTERS } from "../careers/complexes.js";

export const INTERIOR_SCALE = 1.0;

function mulberry(seedStr) {
  let n = 0;
  for (let i = 0; i < seedStr.length; i++) n = Math.imul(n ^ seedStr.charCodeAt(i), 2654435761) >>> 0;
  let s = n || 7;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Industrial spaces per complex: [name, w, h, kind]. Tier decides how many ship. */
export const COMPLEX_ROOMS = {
  mining:         [["Ore Processing", 3, 2, "works"], ["Refinery", 3, 2, "works"], ["Core Store", 2, 1, "works"]],
  healthcare:     [["Ward", 3, 2, "med"], ["Surgery", 2, 2, "med"], ["Cryo Stack", 2, 1, "med"]],
  shipyard:       [["Fabrication Bay", 4, 2, "works"], ["Weld Shop", 2, 2, "works"], ["Frame Store", 2, 1, "works"]],
  manufacturing:  [["Assembly Line", 4, 2, "works"], ["Clean Room", 2, 2, "works"], ["Parts Store", 2, 1, "works"]],
  logistics:      [["Hold Annex", 4, 2, "cargo"], ["Manifest Office", 2, 1, "office"], ["Cold Store", 2, 1, "cargo"]],
  energy:         [["Reactor Hall", 3, 2, "eng"], ["Radiator Bay", 3, 1, "eng"], ["Cell Store", 2, 1, "eng"]],
  construction:   [["Printer Bay", 4, 2, "works"], ["Binder Store", 2, 1, "works"], ["Survey Office", 2, 1, "office"]],
  agriculture:    [["Hydroponics", 4, 2, "agri"], ["Vat Row", 3, 2, "agri"], ["Seed Store", 1, 1, "agri"]],
  research:       [["Lab", 3, 2, "lab"], ["Sample Store", 2, 1, "lab"], ["Observatory", 2, 2, "lab"]],
  security:       [["Armory", 2, 2, "sec"], ["Muster Hall", 3, 1, "sec"], ["Interrogation", 1, 1, "sec"]],
  navigation:     [["Chart Room", 2, 1, "office"], ["Sensor Suite", 2, 2, "sensor"], ["Tug Bay", 3, 2, "works"]],
  commerce:       [["Trade Office", 2, 1, "office"], ["Vault", 1, 1, "office"], ["Showroom", 3, 1, "office"]],
  communications: [["Comms Array", 2, 2, "sensor"], ["Cipher Room", 1, 1, "office"], ["Studio", 2, 1, "office"]],
  terraforming:   [["Atmo Plant", 4, 2, "works"], ["Culture Vats", 3, 2, "agri"], ["Mirror Bay", 2, 1, "works"]],
  salvage:        [["Cutting Bay", 4, 2, "works"], ["Scrap Hold", 3, 2, "cargo"], ["Claims Office", 2, 1, "office"]],
  education:      [["Sim Pit", 3, 2, "lab"], ["Lecture Hall", 3, 1, "office"], ["Library", 2, 1, "office"]],
  /* open-market hulls: a workshop, nothing more */
  general:        [["Workshop", 2, 2, "works"], ["Stores", 2, 1, "cargo"], ["Passenger Cabin", 2, 1, "office"]],
};

const DECK_NAMES = ["COMMAND", "HABITAT", "WORKS"];

/** Which deck a room kind lives on when the hull has that many decks. */
function deckFor(kind, decks) {
  if (decks === 1) return 0;
  const map2 = { bridge: 0, captain: 0, office: 0, sensor: 0, mess: 0, med: 0, brig: 0, quarters: 1, works: 1, eng: 1, cargo: 1, agri: 1, lab: 1, sec: 1, airlock: 1 };
  const map3 = { bridge: 0, captain: 0, office: 0, sensor: 0, brig: 0, quarters: 1, mess: 1, med: 1, lab: 2, works: 2, eng: 2, cargo: 2, agri: 2, sec: 2, airlock: 2 };
  return (decks === 2 ? map2 : map3)[kind] ?? decks - 1;
}

/**
 * Grow the deck plan for a hull def.
 * @param def   shipdb def ({ id, tier, complex, dims, stats, grammar })
 * @param seed  string — the pilot's callsign, so your hull is yours
 */
export function hullPlan(def, seed = "sol") {
  const rnd = mulberry(`${def.id}:${seed}:deck`);
  const tierIdx = Math.max(0, RANK_LETTERS.indexOf(def.tier ?? "B"));
  const decks = tierIdx <= 1 ? 1 : tierIdx <= 3 ? 2 : 3;
  const crewCap = def.stats?.crew ?? 2;
  const big = tierIdx >= 4;
  const sz = (w, h) => [Math.max(1, Math.round(w * (0.8 + tierIdx * 0.08) * INTERIOR_SCALE)), Math.max(1, Math.round(h * (0.85 + tierIdx * 0.05) * INTERIOR_SCALE))];

  /* rooms every hull carries */
  const spec = [];
  const add = (name, w, h, kind, extra = {}) => spec.push({ name, w, h, kind, ...extra });
  add("Bridge", ...sz(big ? 4 : 3, 2), "bridge", { fore: true });
  add("Captain's Quarters", ...sz(2, 1), "captain");
  /* berthing blocks: a G-tier flagship sleeps its hundred in six blocks, not thirty cabins */
  const qn = Math.min(6, Math.max(1, Math.ceil(crewCap / (big ? 8 : 2))));
  for (let i = 0; i < qn; i++) add(qn > 1 ? `Crew Quarters ${String.fromCharCode(65 + i)}` : "Crew Quarters", ...sz(2, big ? 2 : 1), "quarters");
  add(big ? "Dining Hall" : "Mess", ...sz(big ? 3 : 2, big ? 2 : 1), "mess");
  add("Engineering", ...sz(big ? 3 : 2, 2), "eng", { aft: true });
  add("Cargo Bay", ...sz(big ? 4 : 3, 2), "cargo", { aft: true });
  add("Airlock", 1, 1, "airlock");
  if (tierIdx >= 2 || def.complex === "security" || def.complex === "salvage") add("Brig", ...sz(1, 1), "brig");
  if (tierIdx >= 3 || def.complex === "healthcare") add("Medbay", ...sz(2, 1), "med");
  if (tierIdx >= 4) add("Observation Lounge", ...sz(2, 1), "office");

  /* the industry the hull was built for */
  const ind = COMPLEX_ROOMS[def.complex] ?? [];
  const n = Math.min(ind.length, tierIdx <= 1 ? 1 : tierIdx <= 3 ? 2 : 3);
  for (let i = 0; i < n; i++) {
    const [name, w, h, kind] = ind[i];
    add(name, ...sz(w, h), kind, { industrial: true });
  }

  /* lay each deck out on its own spine */
  const deckRooms = Array.from({ length: decks }, () => []);
  spec.forEach((r) => deckRooms[deckFor(r.kind, decks)].push(r));
  const rooms = [];
  const deckMeta = [];
  let id = 0;
  deckRooms.forEach((list, d) => {
    /* fore rooms first, aft rooms last, everything else shuffled deterministically */
    const fore = list.filter((r) => r.fore);
    const aft = list.filter((r) => r.aft);
    const mid = list.filter((r) => !r.fore && !r.aft).sort(() => rnd() - 0.5);
    const ordered = [...fore, ...mid, ...aft];
    let xTop = 0;
    let xBot = 0;
    ordered.forEach((r, i) => {
      const top = i % 2 === 0;
      const x = top ? xTop : xBot;
      const y = top ? -r.h : 1;
      rooms.push({
        id: id++, deck: d, name: r.name, kind: r.kind, x, y, w: r.w, h: r.h,
        industrial: Boolean(r.industrial),
        door: { x: x + r.w / 2, y: 0.5 },
        /* interior sensor nodes: one per room, two in big rooms */
        sensors: r.w * r.h >= 4 ? 2 : 1,
      });
      if (top) xTop += r.w + (rnd() < 0.35 ? 1 : 0);
      else xBot += r.w + (rnd() < 0.35 ? 1 : 0);
    });
    const width = Math.max(xTop, xBot, 3);
    deckMeta.push({ index: d, name: decks === 1 ? "MAIN DECK" : DECK_NAMES[d], width, top: -Math.max(...list.map((r) => r.h), 1), bottom: 1 + Math.max(...list.map((r) => r.h), 1) });
  });
  for (const r of rooms) r.door.x = Math.min(r.door.x, deckMeta[r.deck].width - 0.5);
  const liftX = Math.min(...deckMeta.map((d) => d.width)) - 0.5;

  const byKind = (k) => rooms.filter((r) => r.kind === k);
  return {
    hullId: def.id,
    hullName: def.name ?? def.id,
    tier: def.tier,
    complex: def.complex,
    decks: deckMeta,
    rooms,
    liftX,
    U: 60,
    crewCap,
    rnd,
    /* handy lookups */
    bridge: byKind("bridge")[0],
    captain: byKind("captain")[0],
    mess: byKind("mess")[0],
    quarters: byKind("quarters"),
    brig: byKind("brig")[0] ?? null,
    industrial: rooms.filter((r) => r.industrial),
    /* maintenance robotics the hull carries: scale with tier */
    robots: 1 + Math.floor(tierIdx / 2),
  };
}

/** Where a crew member works, from what they trained as. */
export function stationRoomFor(plan, member) {
  /* a duty the captain assigned (crew/roster.js setDuty) beats the trade they trained in */
  if (member.duty) {
    const rooms = plan.rooms.filter((x) => x.kind === member.duty);
    if (rooms.length) return rooms[Math.abs(hash(member.id)) % rooms.length];
  }
  const cx = member.complexId;
  if (cx === plan.complex && plan.industrial.length) return plan.industrial[Math.abs(hash(member.id)) % plan.industrial.length];
  const want = {
    healthcare: "med", security: "sec", energy: "eng", navigation: "bridge", communications: "sensor", research: "lab",
    commerce: "office", logistics: "cargo", agriculture: "agri", education: "office",
  }[cx];
  const r = want ? plan.rooms.find((x) => x.kind === want) : null;
  if (r) return r;
  const works = plan.rooms.filter((x) => x.industrial || x.kind === "eng" || x.kind === "cargo");
  return works[Math.abs(hash(member.id)) % works.length] ?? plan.bridge;
}

export function quartersFor(plan, member) {
  const q = plan.quarters;
  return q[Math.abs(hash(member.id)) % q.length] ?? plan.mess;
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (Math.imul(h, 31) + String(s).charCodeAt(i)) | 0;
  return h;
}

export { COMPLEXES };
