/* LIVING GALAXY — corporations.
 *
 * Sixteen per sky, grown from the system seed: five majors that hold the
 * charters, five alternates working the margins, five hostiles who stopped
 * pretending — and one Security Directorate, chartered to answer distress
 * calls and flying every patrol and picket hull in the sky. Every one is tied
 * to a sector, so who you trade with and who you shoot at moves the same
 * numbers.
 *
 * The directorate is the odd one out and deliberately so: it holds no ports
 * of its own, it is paid a retainer by the ports it covers, and its standing
 * is the single number that decides whether the cavalry comes when YOU put
 * out a call. See npc/security.js for what it actually does.
 */

import { SECTOR_IDS, SECTORS } from "./materials.js";
import { stations } from "./stations.js";
import { POWERS, powersOf, relationOf as powerRelation, relationLabel } from "./data/factions.js";
export { relationLabel };

/* Each tier of local outfit is chartered under one of the galactic blocs
 * (data/factions.js): majors hold Coalition paper, alternates signed nothing,
 * hostiles are Outer. The power a corp answers to gives it a charter and a
 * temper — and the power's wars are the corp's wars. */
const TIER_BLOC = { major: "coalition", alt: "independent", hostile: "pirate", law: "coalition" };

const MAJOR_HEADS = [
  "Halden", "Corrin", "Vesper", "Ostrand", "Marek", "Ashgrove", "Tolvan", "Beaumont",
  "Kessler", "Northwind", "Draycott", "Ellard", "Sable", "Ferris", "Lockridge", "Ammon",
];
const MAJOR_TAILS = [
  "Combine", "Holdings", "Consolidated", "Group", "Trust", "Union", "Concern", "Syndicate",
  "Charter", "Interstellar", "Industries", "Association",
];
const ALT_HEADS = [
  "Greylight", "Ninefold", "Cold Harbour", "Redshift", "Longacre", "Fairweather", "Tallow",
  "Hollowmark", "Brightwater", "Sixpenny", "Millstone", "Farholt", "Quicklime", "Ravel",
];
const ALT_TAILS = ["Cooperative", "Collective", "Mutual", "Partners", "Freight", "Yards", "Works", "Exchange", "Line"];
const HOSTILE_HEADS = [
  "Blackreach", "Carrion", "The Nail", "Sundered", "Widowmaker", "Ninth Cut", "Ashjaw",
  "Redhand", "Gallow", "Sable Crown", "Hookline", "The Quiet", "Rustfall", "Bonewell",
];
const HOSTILE_TAILS = ["Company", "Pack", "Crew", "Free Company", "Cartel", "Brotherhood", "Reach", "Fleet"];

const MAJOR_LINES = [
  "Holds the extraction charter for half this sky and behaves like it.",
  "Owns the docks, the scales, and the arbitration board that hears your complaint about the scales.",
  "Underwrites most of the hulls in the reach. They will find you.",
  "Legally a shipping concern. Practically the reason the lanes are patrolled.",
  "Older than the colony charters. Has outlived four governments that tried to audit it.",
  "Runs the refineries and sets the assay rate everybody else has to argue with.",
  "The only outfit licensed to certify life support in this system. Rates accordingly.",
];
const ALT_LINES = [
  "Started as a strike fund and never quite stopped being one.",
  "Undercuts the majors by twelve percent and skips the paperwork that costs the difference.",
  "Crewed shares, no shareholders. Slow to pay, honest about it.",
  "Buys what the majors will not touch and sells it two systems over.",
  "A yard cooperative with better welders than the charter holders and worse lawyers.",
  "Family boats flying under one flag for the insurance rate.",
];
const HOSTILE_LINES = [
  "Was a hauling outfit until the escort contract lapsed and nobody renewed it.",
  "Takes cargo, hulls, and the occasional crew. Returns none of them.",
  "Claims a stretch of the belt and enforces the claim with ordnance.",
  "Deserters from a patrol fleet that stopped being paid. Still fly in formation.",
  "Will sell you back your own cargo at a fair price, which is the insult.",
  "No demands, no hails. Just the run-up.",
];

/* The directorate names itself after the writ it flies under, not after a
 * founder — it is a chartered service, not a family firm. */
const LAW_HEADS = [
  "Aurelian", "Meridian", "Concord", "Sentinel", "Wardline", "Keelwatch",
  "Bastion", "Longwatch", "Ironmark", "Cordon", "Vigil", "Trellis",
];
const LAW_TAILS = [
  "Security Directorate", "Patrol Authority", "Escort Command", "Response Service",
  "Wardens", "Protective Bureau", "Lane Authority",
];
const LAW_LINES = [
  "Answers distress on the lane frequencies, and bills the ports that asked for it",
  "Holds the escort writ for the inner lanes; pickets everything the charter covers",
  "Keeps a response wing at every port paying the retainer, and publishes its times",
  "Runs the lane patrols. What it cannot reach in ten minutes it does not promise",
];

let seq = 1;
export const corps = [];

function pick(rnd, arr) {
  return arr[Math.floor(rnd() * arr.length)];
}

/* One family name per sky. Two outfits called Kessler read as a bug, not a
 * dynasty, so the head is what gets reserved — not the whole name. */
function nameFrom(rnd, heads, tails, used) {
  const free = heads.filter((h) => !used.has(h));
  const head = free.length ? pick(rnd, free) : `${pick(rnd, heads)} ${seq}`;
  used.add(head);
  return `${head} ${pick(rnd, tails)}`;
}

function make(rnd, tier, used, sector) {
  const heads = tier === "law" ? LAW_HEADS : tier === "major" ? MAJOR_HEADS : tier === "alt" ? ALT_HEADS : HOSTILE_HEADS;
  const tails = tier === "law" ? LAW_TAILS : tier === "major" ? MAJOR_TAILS : tier === "alt" ? ALT_TAILS : HOSTILE_TAILS;
  const lines = tier === "law" ? LAW_LINES : tier === "major" ? MAJOR_LINES : tier === "alt" ? ALT_LINES : HOSTILE_LINES;
  const sec = SECTORS[sector];
  return {
    id: `co${seq++}`,
    name: nameFrom(rnd, heads, tails, used),
    tier,
    sector,
    sectorName: sec?.name ?? sector,
    colour: tier === "hostile" ? "#c45c5c" : tier === "law" ? "#8fd6ff" : sec?.colour ?? "#9aa4b2",
    blurb: pick(rnd, lines),
    /* -100 .. +100. Majors start indifferent, alternates warm, hostiles are not.
     * The directorate starts correct rather than friendly: it has no opinion
     * about a pilot it has never had to come out for. */
    standing: tier === "major" ? 0 : tier === "alt" ? 10 : tier === "law" ? 5 : -60,
    /* what they pay above or below the sector rate */
    margin: tier === "major" ? 1.0 : tier === "alt" ? 1.06 : tier === "law" ? 1.0 : 0.85,
    ports: [],
    /* filled by charterCorps(): the galactic power this outfit answers to */
    bloc: TIER_BLOC[tier],
    power: null,
    charter: null,
    temper: null,
    /* local feuds on top of the powers' wars: corpId → shift */
    feuds: {},
  };
}

/** Hand every outfit a power of its bloc, and seed a few local feuds. */
function charterCorps(rnd) {
  for (const tier of ["major", "alt", "hostile", "law"]) {
    const list = corps.filter((c) => c.tier === tier);
    const pool = powersOf(TIER_BLOC[tier]);
    const order = pool.slice().sort(() => rnd() - 0.5);
    list.forEach((c, i) => {
      c.power = order[i % order.length];
      c.charter = POWERS[c.power]?.charter ?? "economic";
      c.temper = POWERS[c.power]?.temper ?? { gain: 1, loss: 1, memory: 0.6 };
      c.powerName = POWERS[c.power]?.short ?? c.power;
    });
  }
  /* a sky has its own quarrels: two or three pairs of honest outfits at odds, and one old alliance */
  const civil = corps.filter((c) => c.tier !== "hostile");
  const feud = (a, b, v) => { a.feuds[b.id] = (a.feuds[b.id] ?? 0) + v; b.feuds[a.id] = (b.feuds[a.id] ?? 0) + v; };
  for (let i = 0; i < 3 && civil.length > 3; i++) {
    const a = pick(rnd, civil), b = pick(rnd, civil.filter((c) => c !== a));
    feud(a, b, -(0.3 + rnd() * 0.4));
  }
  if (civil.length > 3) { const a = pick(rnd, civil), b = pick(rnd, civil.filter((c) => c !== a)); feud(a, b, 0.4); }
}

/** How corp `a` regards corp `b`, −1 (war) .. +1 (allied): the powers' history plus the sky's own feuds. */
export function corpRelation(a, b) {
  const A = typeof a === "string" ? corpById(a) : a;
  const B = typeof b === "string" ? corpById(b) : b;
  if (!A || !B) return 0;
  if (A === B) return 1;
  let v = A.power && B.power ? powerRelation(A.power, B.power) : 0;
  if (A.power && A.power === B.power) v = Math.max(v, 0.5);
  v += A.feuds?.[B.id] ?? 0;
  return Math.max(-1, Math.min(1, v));
}

/** Every pair of local outfits at war or hostile, worst first — the sky's live corp wars. */
export function corpWars() {
  const out = [];
  for (let i = 0; i < corps.length; i++) for (let j = i + 1; j < corps.length; j++) {
    const v = corpRelation(corps[i], corps[j]);
    if (v <= -0.5) out.push({ a: corps[i], b: corps[j], value: v, label: relationLabel(v) });
  }
  return out.sort((x, y) => x.value - y.value);
}

/**
 * Grows the roster for a system and hands each corporation the ports it runs.
 * Call after buildStations so there is something to hand out.
 */
export function buildCorps(rnd) {
  corps.length = 0;
  seq = 1;
  const used = new Set();

  /* Majors take one sector each, so the five cover the economy. */
  const order = [...SECTOR_IDS].sort(() => rnd() - 0.5);
  for (let i = 0; i < 5; i++) corps.push(make(rnd, "major", used, order[i % order.length]));
  for (let i = 0; i < 5; i++) corps.push(make(rnd, "alt", used, pick(rnd, SECTOR_IDS)));
  for (let i = 0; i < 5; i++) corps.push(make(rnd, "hostile", used, pick(rnd, SECTOR_IDS)));
  /* one directorate, chartered to the military sector whether or not this sky
   * has a military port — it is the writ that places it, not a berth */
  corps.push(make(rnd, "law", used, "military"));

  /* Hand out the ports. A port flies somebody's flag. */
  const majors = corps.filter((c) => c.tier === "major");
  const alts = corps.filter((c) => c.tier === "alt");
  const hostiles = corps.filter((c) => c.tier === "hostile");
  for (const st of stations) {
    let owner;
    if (st.sector === "pirate" || st.hostile) {
      owner = pick(rnd, hostiles);
    } else {
      const bySector = [...majors, ...alts].filter((c) => c.sector === st.sector);
      owner = bySector.length ? pick(rnd, bySector) : pick(rnd, rnd() < 0.6 ? majors : alts);
    }
    st.corpId = owner.id;
    owner.ports.push(st.id);
  }

  /* A charter holder with no berth is not a charter holder. Any major left
   * empty takes a port off whichever outfit is holding the most. */
  const byId = new Map(stations.map((s) => [s.id, s]));
  for (const m of majors) {
    if (m.ports.length) continue;
    const donors = corps
      .filter((c) => c !== m && c.tier !== "hostile" && c.tier !== "law" && c.ports.length > 1)
      .sort((a, b) => b.ports.length - a.ports.length);
    const from = donors[0];
    if (!from) break;
    const same = from.ports.find((pid) => byId.get(pid)?.sector === m.sector);
    const pid = same ?? from.ports[from.ports.length - 1];
    from.ports.splice(from.ports.indexOf(pid), 1);
    m.ports.push(pid);
    const st = byId.get(pid);
    if (st) st.corpId = m.id;
  }
  charterCorps(rnd);
  return corps;
}

/** The corporation a hull flies for: its own flag, else its home port's. */
export function corpOfVessel(n) {
  if (!n) return null;
  if (n.corpId) return corpById(n.corpId);
  const home = stations.find((s) => s.id === (n.from ?? n.port));
  return home ? corpOfStation(home) : null;
}

/** Shooting a hull is a standing event with its flag — and its flag's friends and enemies. */
export function blameKill(n, why = "destroyed their hull") {
  const c = corpOfVessel(n);
  if (!c) return null;
  const loss = c.tier === "hostile" ? -4 : -18;
  adjustStanding(c.id, loss, why);
  for (const o of corps) {
    if (o === c) continue;
    const r = corpRelation(o, c);
    if (r >= 0.5) adjustStanding(o.id, loss * 0.35, `${why} — an ally of theirs`);
    else if (r <= -0.5) adjustStanding(o.id, -loss * 0.4, `${why} — an enemy of theirs`);
  }
  return c;
}

export function corpById(id) {
  return corps.find((c) => c.id === id) ?? null;
}

export function corpOfStation(st) {
  return st?.corpId ? corpById(st.corpId) : null;
}

export function byTier(tier) {
  return corps.filter((c) => c.tier === tier);
}

/* Pilot modifiers that scale standing moves: `standing` for gains, `blame` for losses. */
let standingMods = { standing: 1, blame: 1 };
export function setStandingMods(m) {
  standingMods = m ?? { standing: 1, blame: 1 };
}

/** Moves standing and bleeds a little to whoever shares the sector. */
export function adjustStanding(id, delta, reason) {
  const c = corpById(id);
  if (!c) return null;
  delta = delta > 0 ? delta * (standingMods.standing ?? 1) : delta * (standingMods.blame ?? 1);
  /* the power's temper: a syndicate forgives quickly and forgets nothing, a bureau is the reverse */
  if (c.temper) delta *= delta > 0 ? c.temper.gain : c.temper.loss;
  c.standing = Math.max(-100, Math.min(100, c.standing + delta));
  for (const other of corps) {
    if (other === c || other.sector !== c.sector) continue;
    other.standing = Math.max(-100, Math.min(100, other.standing + delta * 0.25));
  }
  /* Hostiles enjoy what the majors do not. */
  if (c.tier !== "hostile" && delta < 0) {
    for (const h of corps.filter((x) => x.tier === "hostile")) {
      h.standing = Math.max(-100, Math.min(100, h.standing - delta * 0.15));
    }
  }
  c.lastReason = reason ?? c.lastReason;
  return c;
}

export function standingLabel(v) {
  if (v >= 70) return "trusted";
  if (v >= 35) return "favoured";
  if (v >= 10) return "friendly";
  if (v > -10) return "neutral";
  if (v > -35) return "watched";
  if (v > -70) return "unwelcome";
  return "hostile";
}

/** Price multiplier a corporation gives you at its ports, from standing. */
export function standingMargin(c) {
  if (!c) return 1;
  return c.margin * (1 + c.standing / 400);
}
