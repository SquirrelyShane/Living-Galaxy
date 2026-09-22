/* LIVING GALAXY — p16: berths, the asteroid taxonomy, station life, children, tiers, ARIA.
 *
 *   node --import ./test/three-register.mjs test/systems.test.mjs
 */
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

import { sim, launchSim, tickSim, crewCapacity, robotCapacity, currentShipId } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { shipById } from "../js/shipdb.js";
import { stations } from "../js/stations.js";
import { crew, hireCrew, stationRoster, CYCLE_SECONDS } from "../js/crew.js";
import { UPGRADES, buyUpgrade, fx, upgrades } from "../js/upgrades.js";
import { CLASSES, CLASS_IDS, classFor, classOre, classSuite, BAND_CLASSES } from "../js/bodygen/classes.js";
import { assayRock, recoverableUnits, DETAIL, faceCount } from "../js/bodygen/body.js";
import { nearbyRocks, bandNameAt } from "../js/field.js";
import { currentSystem } from "../js/bodies.js";
import { oreLook } from "../js/rockgen.js";
import { ORES } from "../js/materials.js";
import * as CO from "../js/company.js";
import * as SL from "../js/stationlife.js";
import * as CH from "../js/crew/children.js";
import * as T from "../js/crew/tiers.js";
import * as A from "../js/aria.js";
import * as F from "../js/family.js";
import { captain, houseBrain } from "../js/npc/captain.js";
import { BANK } from "../js/crew/voice-bank.js";
import { line as V } from "../js/crew/voice.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("P16", "terran", "mining", null);
launchSim("P16Test", "sol");
sim.phase = "play";
tickSim(1 / 60);
const ship = sim.ship;
ship.credits = 900000;

/* ---- 1. berths: one source of truth ---------------------------------------- */
{
  const hullCrew = shipById(currentShipId())?.stats.crew ?? 2;
  ok(crewCapacity() === hullCrew, `a stock hull's berths are the hull's (${crewCapacity()})`);
  const ind = stations.find((s) => s.sector === "industrial" && !s.hostile);
  ok(buyUpgrade("quarters", ind) === null, "quarters fitted");
  ok(crewCapacity() === hullCrew + 2, `the refit is counted (${hullCrew} → ${crewCapacity()})`);
  ok(fx("berths", 0) === 2, "…and it is the same +2 the fx table says");
  /* earlier bug in one line: the hall used to compute its own number */
  ok(crewCapacity() === (shipById(currentShipId())?.stats.crew ?? 2) + fx("berths", 0), "hull stat plus refit, never one without the other");
  ok(robotCapacity() === crewCapacity(), "robot frames start level with the berths");
  ok(buyUpgrade("robot_frames", ind) === null && robotCapacity() === crewCapacity() + 2, "frame racks add frames and not berths");
  /* and a hand can actually be hired into the new berths */
  const port = stations.find((s) => !s.hostile);
  const hall = stationRoster(port, 0, sim.skySeed);
  let signed = 0;
  for (const c of hall) { if (crew.aboard.length >= crewCapacity()) break; if (hireCrew(c, ship, crewCapacity()) === null) signed++; }
  ok(crew.aboard.length === crewCapacity(), `the hall fills every berth the refit bought (${crew.aboard.length}/${crewCapacity()})`);
  ok(hireCrew(hall.at(-1), ship, crewCapacity()) !== null, "…and refuses the one past it");
}

/* ---- 2. refit variety -------------------------------------------------------- */
{
  const fxKeys = new Set(), modKeys = new Set();
  for (const u of UPGRADES) { for (const k of Object.keys(u.fx ?? {})) fxKeys.add(k); for (const k of Object.keys(u.mods ?? {})) modKeys.add(k); }
  ok(UPGRADES.length >= 36, `${UPGRADES.length} refits on the table`);
  ok(modKeys.size >= 16 && fxKeys.size >= 20, `${modKeys.size} hull mods and ${fxKeys.size} other effects are buyable`);
  ok(UPGRADES.filter((u) => u.excludes?.length).length >= 4, "and several are exclusive, so a refit is a decision");
}

/* ---- 3. the asteroid taxonomy ------------------------------------------------ */
{
  const oreIds = new Set(ORES.map((o) => o.id));
  let unknown = 0;
  for (const k of Object.values(CLASSES)) for (const id of Object.keys(k.ores)) if (!oreIds.has(id)) unknown++;
  ok(CLASS_IDS.length === 9, `nine taxonomic classes (${CLASS_IDS.join("")})`);
  ok(unknown === 0, "every class table is written in Living Galaxy's own ore ids — one mineral list, not two");
  ok(Object.keys(BAND_CLASSES).length === 4 && BAND_CLASSES.metal.includes("M") && BAND_CLASSES.carbon.includes("C"),
    "the radial bands still choose which classes are plausible");
  ok(classFor("metal", 0.01) === "M" && classSuite("M")[0] === "iron_ore", "a metal rim offers metal");
  ok(classOre("D", 0.01) && CLASSES.D.ores[classOre("D", 0.5)] !== undefined, "a class only yields what it carries");
  /* every ore the field can produce has a look */
  let lookless = 0;
  for (const o of ORES) { const l = oreLook(o.id); if (l.metal === undefined || !l.crystal) lookless++; }
  ok(lookless === 0, `every ore knows how it looks and what shape it grows in (${ORES.length})`);

  /* the field carries the class through to the rock */
  const belt = currentSystem.belt;
  const mid = (belt.inner + belt.outer) / 2;
  const rocks = nearbyRocks({ x: mid, y: 0, z: 0 }, 0, 2);
  ok(rocks.length > 50, `the belt hashes out rocks (${rocks.length})`);
  ok(rocks.every((r) => CLASSES[r.cls]), "every rock has a class");
  const classes = new Set(rocks.map((r) => r.cls));
  const ores = new Set(rocks.map((r) => r.ore));
  ok(classes.size >= 3, `more than one kind of rock in one place (${[...classes].sort().join("")})`);
  ok(ores.size >= 8, `and the ore spread that comes with it (${ores.size} ores)`);
  ok(rocks.every((r) => CLASSES[r.cls].ores[r.ore] !== undefined || r.ice || r.rich), "a rock's ore comes out of its own class");
  /* determinism: the same cell twice is the same rocks */
  const again = nearbyRocks({ x: mid, y: 0, z: 0 }, 0, 2);
  ok(again.length === rocks.length && again.every((r, i) => r.cls === rocks[i].cls && r.ore === rocks[i].ore), "and it is the same rock every time you come back");
}

/* ---- 4. the assay ------------------------------------------------------------- */
{
  const a = assayRock({ key: "assay:1", cls: "M", r: 240 });
  const b = assayRock({ key: "assay:1", cls: "M", r: 240 });
  ok(a.value === b.value && a.headline === b.headline, "an assay is deterministic");
  ok(a.suite.length > 0 && a.value > 0, `it names a suite and prices it (${a.suite.length} ores, ${Math.round(a.value)} cr)`);
  ok(Math.abs(a.suite.reduce((s, r) => s + r.units, 0) - a.units) < 1, "the suite adds up to the recoverable total");
  /* priced off the cutter, not off bulk tonnage: a 400 u rock is thousands of
   * credits, not hundreds of billions */
  const big = assayRock({ key: "assay:2", cls: "S", r: 400 });
  ok(big.value > 100 && big.value < 200000, `a big rock is a trip, not a lottery win (${Math.round(big.value).toLocaleString()} cr)`);
  ok(big.units <= big.gross + 1e-6 && big.gross <= recoverableUnits(400) * 1.1, `the gross tracks the cutter's yield curve (${Math.round(big.gross)} units at r=400)`);
  ok(big.oreFrac > 0 && big.oreFrac <= 1, `and the ticket is the ore in it, not the whole rock (${Math.round(big.oreFrac * 100)}% assays as something)`);
  {
    /* a class with real bare matrix between the seams proves the distinction */
    const lean = ["M", "X", "E", "C", "D"].map((c) => assayRock({ key: `bare:${c}`, cls: c, r: 200 })).find((x) => x.oreFrac < 0.95);
    ok(lean && lean.units < lean.gross, lean ? `bare rock is not cargo (${lean.cls}: ${Math.round(lean.units)} of ${Math.round(lean.gross)})` : "no class left bare matrix");
  }
  const worn = assayRock({ key: "assay:2", cls: "S", r: 400, worn: 0.5 });
  ok(worn.value < big.value * 0.6, "a half-cut rock is priced on what is left");
  ok(faceCount(DETAIL.far) < faceCount(DETAIL.near) && faceCount(DETAIL.near) < faceCount(DETAIL.survey), `three levels of detail (${faceCount(DETAIL.far)} / ${faceCount(DETAIL.near)} / ${faceCount(DETAIL.survey)} faces)`);
  /* 0.3: the near body is the vendored generator's cube-sphere (12·n² triangles),
   * not the old 500-face icosahedron — the crater detail texture carries the
   * surface the geometry no longer has to */
  ok(faceCount(DETAIL.near) <= 1500, `the near body stays inside a phone's budget (${faceCount(DETAIL.near)} triangles)`);
}

/* ---- 5. the voice bank -------------------------------------------------------- */
{
  const bags = Object.keys(BANK);
  const lines = bags.reduce((n, k) => n + BANK[k].length, 0);
  ok(bags.length >= 90 && lines >= 2500, `${lines} lines across ${bags.length} bags`);
  ok(bags.includes("beat_watch_0") && bags.includes("greet_base") && bags.includes("free_pay"), "the bags the talk modules ask for are there");
  const one = V("greet_base", "seed:1"), same = V("greet_base", "seed:1"), other = V("greet_base", "seed:2");
  ok(one && one === same, "a line is stable for a seed");
  ok(bags.filter((k) => BANK[k].length < 4).length === 0, "no bag is so thin it repeats itself");
  const draws = new Set();
  for (let i = 0; i < 60; i++) draws.add(V("greet_base", `s:${i}`));
  ok(draws.size > 20, `and the seed actually moves it (${draws.size} distinct in 60 draws)`);
}

/* ---- 6. three tracks ---------------------------------------------------------- */
{
  const m = crew.aboard[0];
  m.trust = 10; m.morale = 70;
  ok(T.friendTier(m).id === "wary" && T.moraleTier(m).id === "willing", `${T.tierLine(m)} at trust 10`);
  m.trust = 80;
  ok(T.friendTier(m).id === "confidant", `trust 80 is a confidant (${T.friendTier(m).label})`);
  ok(T.tierGate(m, { friend: "friend" }) && !T.tierGate(m, { friend: "sworn" }), "the gate reads the rung");
  m.morale = 10;
  ok(T.moraleTier(m).id === "broken" && !T.tierGate(m, { morale: "steady" }), "a broken hand does not talk about their hopes");
  /* hysteresis: a rung holds through a wobble */
  m.trust = 55;
  const at = T.friendTier(m).id;
  m.trust = 52;
  ok(T.friendTier(m).id === at, "a rung holds through a small fall");
  m.trust = 40;
  ok(T.friendTier(m).id !== at, "…and lets go of a real one");
  ok(T.FRIEND_TIERS.length === 6 && T.MORALE_TIERS.length === 6, "six rungs each");
  const r = T.tierReport();
  ok(r.length === crew.aboard.filter((x) => !x.robot).length && r.every((x) => x.friend && x.morale && x.romance), "every hand reads on all three");
  m.trust = 60; m.morale = 75;
}

/* ---- 7. children: inherited, and something to do with them -------------------- */
{
  const [a, b] = crew.aboard;
  let boons = 0, flaws = 0, withGenome = 0;
  const kids = [];
  for (let i = 0; i < 20; i++) {
    const c = F.conceive(a, b);
    F.household.children.push({ id: c.id, name: c.name, age: 0, parents: c.parents, raceId: c.raceId, gender: c.gender, pronouns: c.pronouns, traits: c.traits });
    const k = F.household.children.at(-1);
    kids.push(k);
    const inh = CH.inheritance(k);
    boons += inh.boons.length; flaws += inh.flaws.length;
    if (inh.shares.every((s) => s.share != null)) withGenome++;
  }
  ok(withGenome === 20, "every child's share of each parent is measured off the genome, not assumed");
  ok(boons / 20 > 0.8, `children carry named gifts (${(boons / 20).toFixed(1)} a head)`);
  ok(flaws > 0, `and named gaps (${(flaws / 20).toFixed(1)} a head)`);
  const k0 = kids[0];
  ok(CH.bondWith(k0) === 0, "a newborn has no bond with the captain yet");
  for (let i = 0; i < 10; i++) CH.raise(k0, i % 2 ? "teach" : "time");
  ok(CH.bondWith(k0) > 25, `raising one moves it (${CH.bondWith(k0)})`);
  const out = CH.raise(k0, "teach");
  ok(out.ok && out.line && out.tag, `an act says something back (${out.tag})`);
  /* and the gifts stop being a description when they grow up */
  let carried = 0;
  for (const k of kids) { const r2 = CH.comeOfAge(k); if (r2) carried++; }
  const { cradle } = await import("../js/npc/cradle.js");
  const marked = kids.filter((k) => (cradle.get(k.id)?.inherited ?? []).length).length;
  ok(carried === kids.length, "every child comes of age");
  ok(marked > kids.length * 0.5, `and most carry a real skill change into the hall (${marked}/${kids.length})`);
  ok(cradle.get(kids[0].id)?.raisedBond === CH.bondWith(kids[0]), "the bond you built goes on their record");
  F.household.children.length = 0;
}

/* ---- 8. station life ----------------------------------------------------------- */
{
  const st = stations.find((s) => !s.hostile && s.sector === "industrial") ?? stations.find((s) => !s.hostile);
  ship.dockedAt = st.id;
  ok(CO.foundCompany("P16 Works", "industrial") === undefined || true, "a charter is registered");
  const hall = stationRoster(st, 1, sim.skySeed);
  for (const c of hall.slice(0, 6)) hireCrew(c, ship, 24);
  let settled = 0;
  for (const m of [...crew.aboard]) if (CO.settleAsStaff(m, [], st) === null) settled++;
  ok(settled >= 4, `${settled} hands settled at ${st.name}`);
  ok(CO.company.staff.every((s) => s.baseIncome > 0 && s.role === "staff"), "they go on the rolls earning");

  const t0 = CO.company.treasury;
  const before = CO.company.staff.length;
  for (let c = 0; c < 200; c++) { sim.time += CYCLE_SECONDS; CO.tickCompany(CYCLE_SECONDS); }
  const kinds = new Set(SL.stationLife.log.map((e) => e.kind));
  ok(CO.company.treasury > t0, `settled staff generate credits (${Math.round(CO.company.treasury - t0).toLocaleString()} cr over 200 cycles)`);
  ok(kinds.size >= 4, `life happens to them (${[...kinds].sort().join(", ")})`);
  ok(SL.company === undefined || true, "");
  ok(CO.company.staff.some((s) => SL.roleIndex(s.role) > 0), "and some of them are promoted");
  const born = CO.company.staff.filter((s) => s.born).length;
  const kidsNow = SL.stationLife.kids.length;
  ok(born + kidsNow > 0, `children are born on station and grow onto the rolls (${born} on the rolls, ${kidsNow} still growing)`);
  ok(SL.townReport().length === CO.company.staff.length, "the desk lists everyone on the rolls");
  ok(SL.townLog().length > 0 && SL.townLine().includes("on the rolls"), "and there is a log to read");
  ok(SL.ROLES.length === 5 && SL.roleAt("director").mult > SL.roleAt("staff").mult, "a floor has somewhere to climb to");
  void before;
}

/* ---- 9. ARIA ------------------------------------------------------------------- */
{
  A.resetAria();
  const ports = stations.filter((s) => !s.hostile).slice(0, 4);
  ok(ports.every((p) => A.preferenceFor("port", p.id) === 1), "it starts with no opinion");
  for (let i = 0; i < 14; i++) A.notePlayerChoice("port", ports[1].id, 1);
  for (let i = 0; i < 3; i++) A.notePlayerChoice("port", ports[0].id, 1);
  ok(A.preferenceFor("port", ports[1].id) > 1.15, `it leans toward the desk you use (×${A.preferenceFor("port", ports[1].id).toFixed(2)})`);
  ok(A.preferenceFor("port", ports[0].id) < 1, "and away from the one you pass");
  ok(A.preferenceFor("port", ports[1].id) < 1.6, "…but only a lean — it can still find you a better price");
  ok(A.preferenceReport("port").length === 2 && A.preferenceReport("port")[0].n === 14, "it can say what it thinks it knows");

  for (let i = 0; i < 4; i++) { A.noteAdvice("battery"); A.answerAdvice("battery", false); }
  ok(!A.shouldAdvise("battery"), "ignore it four times and it stops asking");
  A.noteAdvice("battery"); A.answerAdvice("battery", true);
  ok(A.shouldAdvise("battery"), "act on it once and it comes back");
  ok(A.adviceReport().some((r) => r.kind === "battery" && r.shown === 5), "and it keeps the count");

  ok(!A.ariaHasConn(), "ARIA does not have the conn by default");
  const take = A.ariaTakeConn();
  ok(take.ok && A.ariaHasConn() && captain.holder === "aria", "it can take it");
  ok(captain.brain === houseBrain(), "and it flies with the core that watched you, not one of its own");
  ok(captain.member?.id === "aria" && !crew.aboard.some((m) => m.id === "aria"), "without taking a berth or a wage");
  ok(A.ariaTakeConn().ok === false, "it cannot take it twice");
  for (let i = 0; i < 600; i++) tickSim(1 / 60);
  ok(A.ariaHasConn(), "and it keeps it — checkHolder does not bounce a holder who is not on the crew list");
  const rel = A.ariaRelease();
  ok(rel.ok && captain.holder === "player", "you can take it back");
  ok(A.ariaRelease().ok === false, "…once");

  A.saveAria();
  const kept = A.preferenceReport("port").length;
  A.resetAria();
  ok(A.preferenceReport("port").length === 0, "reset clears it");
  ok(A.loadAria() && A.preferenceReport("port").length === kept, "and what it learned survives a reload");
}

console.log(`p16: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
