/* Living Galaxy — the genome, the deck graph, and the journal.
 *
 *   node --import ./test/three-register.mjs test/genome.test.mjs
 */

import { sim, launchSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import * as G from "../js/genome/genome-256.js";
import {
  SPACER, SYNTH, SPACER_RANGES, createSpacer, packGenome, unpackGenome, fingerprint,
  capabilities, genomeTraits, genomeIdentity, genomeTells, skillAptitude, genomeCompat,
  breed, kinship, raceProfile, tellLine, phenotype, createContext,
} from "../js/genome/spacer.js";
import { deckGraph, ACTION_META } from "../js/crew/deckgraph.js";
import { decide } from "../js/genome/behavior-graph.js";
import { crew, hireCrew, stationRoster, tickCrew, compat, relatedTo, CYCLE_SECONDS } from "../js/crew.js";
import { cradle, generateNPC, ensureGenome, genomeOf, looksLine, CRADLE_VERSION } from "../js/npc/cradle.js";
import { deckmind, runDeckCycle, stepHand, buildContext, bodyOf, ACTIONS, NEED_KEYS, deckReport } from "../js/crew/deckmind.js";
import { journal, exportJournals, importJournals, habitsOf, JOURNAL_KEEP } from "../js/crew/journal.js";
import { setSocial, household, tickHousehold, conceive, adjustTrust } from "../js/family.js";
import { topicsFor, open, choose } from "../js/crew/talk.js";
import { duties } from "../js/crew/duties.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("Gene", "terran", "mining", null);
launchSim("GenomeTest", "sol");
sim.phase = "play";
const ship = sim.ship;

/* ---- 1. the spacer entity type ---------------------------------------------- */

const spacerType = G.getEntityType(SPACER);
const synthType = G.getEntityType(SYNTH);
ok(spacerType && spacerType.geneCount > 90 && spacerType.geneCount < 140,
  `spacer activates ${spacerType.geneCount} of the 256 gene slots`);
ok(synthType.geneCount < spacerType.geneCount, `synth is narrower still (${synthType.geneCount})`);

{
  const mask = G.activeMask(SPACER);
  const off = ["MANA_POOL", "SHADOW_AFFINITY", "PHOTOSYNTHESIS", "VENOM_POTENCY", "WING_SPAN", "VOID_TAINT", "DIVINE_SPARK"];
  ok(off.every((n) => !mask[G.GENES[n]]), "no magic, no venom, no wings, no corruption — those slots stay null");
  const on = ["STRENGTH_A", "LOGICAL_IQ", "COOPERATION", "CIRCADIAN_PHASE", "SPATIAL_MAPPING", "GENDER"];
  ok(on.every((n) => mask[G.GENES[n]]), "every gene the sim reads is active");
  const covered = SPACER_RANGES.reduce((a, [x, y]) => a + (y - x + 1), 0);
  ok(covered === spacerType.geneCount, "the declared ranges and the derived count agree");
}

/* ---- 2. determinism and the codec ------------------------------------------- */

{
  const a = createSpacer("hand-7", "eridian");
  const b = createSpacer("hand-7", "eridian");
  ok(a.every((v, i) => v === b[i]), "the same seed and race is the same body, every time");
  const c = createSpacer("hand-7", "korrash");
  ok(!c.every((v, i) => v === a[i]), "a different race is a different body from the same seed");

  const packed = packGenome(a);
  ok(packed.length < 200 && packed.startsWith("p1:spacer:"), `packed to ${packed.length} chars (the engine's own form is 359)`);
  const back = unpackGenome(packed).genome;
  let worst = 0;
  for (let i = 0; i < 256; i++) worst = Math.max(worst, Math.abs(back[i] - a[i]));
  ok(worst <= 1 / 255, `round-trips inside one byte of quantisation (worst ${worst.toFixed(5)})`);
  ok(fingerprint(back) === fingerprint(a), "and comes back with the same fingerprint");

  let threw = false;
  try { unpackGenome(packed.slice(0, -3) + "AAA"); } catch { threw = true; }
  ok(threw, "an edited payload is refused by the checksum, not silently decoded");

  const seen = new Set();
  for (let i = 0; i < 500; i++) seen.add(fingerprint(createSpacer(`n${i}`, "terran")));
  ok(seen.size === 500, "500 genomes, 500 distinct fingerprints");
}

/* ---- 3. race bias lands on something the sim simulates ----------------------- */

{
  const nav = [], com = [];
  for (let i = 0; i < 60; i++) {
    nav.push(skillAptitude(createSpacer(`e${i}`, "eridian")).navigation);
    com.push(skillAptitude(createSpacer(`s${i}`, "sef")).commerce);
  }
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const eridianNav = mean(nav);
  const sefCom = mean(com);
  const baseNav = mean(Array.from({ length: 60 }, (_, i) => skillAptitude(createSpacer(`t${i}`, "terran")).navigation));
  ok(eridianNav > baseNav + 0.05, `Eridians are genetically navigators (${eridianNav.toFixed(2)} vs Terran ${baseNav.toFixed(2)})`);
  ok(sefCom > 0.55, `Sef read a market from the genes up (${sefCom.toFixed(2)})`);
  ok(Object.keys(raceProfile("tsynth")).length > 5, "the foundry lines get their own bias, tighter spread and all");
}

/* ---- 4. capabilities gate branches, not roles -------------------------------- */

{
  const g = createSpacer("cap-1", "terran");
  const c = capabilities(g, SPACER);
  ok(c.tier === "cultural", "a spacer reaches the cultural tier — hands, speech and abstraction");
  ok(c.arcane === false && c.armed === false && c.photic === false, "and can never reach the branches a spacer has no genes for");
  const s = capabilities(createSpacer("cap-1", "tsynth", SYNTH), SYNTH);
  ok(s.fertile === false && s.metabolic === false, "a synthetic hand is never fertile and never hungry");
  ok(s.sapient && s.dexterous, "…but still thinks and still has hands");
}

/* ---- 5. heredity ------------------------------------------------------------- */

{
  const mum = createSpacer("mum", "terran");
  const dad = createSpacer("dad", "korrash");
  const kid = breed(mum, dad, "kid-1");
  const kid2 = breed(mum, dad, "kid-1");
  ok(kid.every((v, i) => v === kid2[i]), "the same parents and seed make the same child");
  const stranger = createSpacer("stranger", "terran");
  ok(kinship(kid, mum) > kinship(kid, stranger) && kinship(kid, dad) > kinship(kid, stranger),
    `a child is closer to both parents (${kinship(kid, mum).toFixed(2)}/${kinship(kid, dad).toFixed(2)}) than to a stranger (${kinship(kid, stranger).toFixed(2)})`);
  const sib = breed(mum, dad, "kid-2");
  ok(kinship(kid, sib) > kinship(kid, stranger), "siblings read as siblings");
  const mask = G.activeMask(SPACER);
  ok(kid.every((v, i) => (mask[i] ? v >= 0 && v <= 1 : v === 0)), "no inactive slot picks up a value in the cross");
}

/* ---- 6. CRADLE carries it ---------------------------------------------------- */

{
  const rec = generateNPC("ledger-1", { raceId: "vantari" });
  ok(rec.v === CRADLE_VERSION && rec.genome && rec.fingerprint, "a new record is born with its genome on it");
  ok(NEED_KEYS.length === 9, "nine needs");
  ok(Object.keys(rec.traits).length === 5 && Object.values(rec.traits).every((v) => v >= 0 && v <= 1),
    "the five trait axes still read 0..1 — they are grown, not rolled");
  ok(rec.pulse > 40 && rec.pulse < 110, `resting pulse off the metabolism genes (${rec.pulse})`);
  ok(/cm,/.test(looksLine(rec)), `visible tells: ${looksLine(rec)}`);

  /* a v1 record, genome-less, grows the body it always had */
  const old = { id: rec.id + "_old", seed: "ledger-1", raceId: "vantari", traits: {}, history: [], v: 1 };
  ensureGenome(old);
  ok(old.fingerprint === rec.fingerprint, "a pre-genome record migrates to the exact same body, deterministically");
  ok(old.v === CRADLE_VERSION, "…and is stamped v2 on the way through");
}

/* ---- 7. the deck graph ------------------------------------------------------- */

{
  const r = deckGraph.report;
  ok(r.errors.length === 0, `the graph validates clean (${r.nodeCount} nodes, ${r.edgeCount} edges)`);
  ok(r.reachable === r.nodeCount, "every node is reachable from root");
  ok(r.sharedNodes.length > 10, `${r.sharedNodes.length} nodes are entered from more than one branch — it is a graph, not a tree`);
  const acts = Object.keys(deckGraph.nodes).filter((k) => deckGraph.nodes[k].type === "action").map((k) => deckGraph.nodes[k].act);
  ok(acts.every((a) => ACTIONS[a]), "every action in the graph has an implementation");
  ok(Object.keys(ACTIONS).every((a) => acts.includes(a)), "every implementation has a node in the graph");
  ok(acts.every((a) => ACTION_META[a]), "every action has a label and a category for the journal");
}

/* ---- 8. a hand takes a watch -------------------------------------------------- */

const st = stations.find((s) => s.kind !== "beacon") ?? stations[0];
ship.credits = 400000;
sim.crewCapacity = 8;
setSocial({ romance: "crew", family: true, gender: "woman", attractedTo: ["man", "woman"] });

const hall = stationRoster(st, 0, sim.skySeed);
for (const cand of hall.slice(0, 5)) hireCrew(cand, ship, 8);
ok(crew.aboard.length >= 4, `${crew.aboard.length} hands signed on`);
ok(crew.aboard.every((m) => m.genome && m.fingerprint), "every hand carries their genome from the hiring hall");

{
  const m = crew.aboard[0];
  const body = bodyOf(m);
  ok(body?.genome && body.caps && body.apt, "deckmind decodes a body once and keeps it");
  const ctx = buildContext(m);
  ok(NEED_KEYS.every((k) => typeof ctx.needs[k] === "number"), "context carries all nine needs");
  ok(ctx.pheno.stage && ctx.pheno.alertness >= 0, `contextual phenotype: ${ctx.pheno.stage}, alertness ${ctx.pheno.alertness.toFixed(2)}`);
  const out = decide(deckGraph, ctx, { rng: () => 0.5 });
  ok(out.action && out.path[0] === "root", `a decision lands on ${out.action} via ${out.path.length} hops`);
}

/* ---- 9. the record ------------------------------------------------------------ */

{
  const m = crew.aboard[0];
  const rec = stepHand(m);
  ok(rec.agent.id === m.id && rec.action.id, `${m.name}: ${rec.action.label}`);
  ok(rec.observedSurroundings.room && typeof rec.observedSurroundings.perceptionClarity === "number",
    "the record observes the room it happened in");
  ok(Object.keys(rec.observedSelf.needs).length === 9 && rec.observedSelf.tier, "…and the self that was standing in it");
  ok(rec.whatMadeMeActThis.reasoning.length >= 2 && rec.whatMadeMeActThis.path.length >= 2,
    `…and why: "${rec.whatMadeMeActThis.reasoning[rec.whatMadeMeActThis.reasoning.length - 1]}"`);
  ok(rec.whatMadeMeActThis.path.every((n) => deckGraph.nodes[n]), "every node on the path is a real node");
  ok(rec.effectOnSelf === null || Object.values(rec.effectOnSelf).every((d) => "from" in d && "to" in d && "delta" in d),
    "effects are {from,to,delta} on the keys that moved, and nothing else");
  ok(typeof rec.summary === "string" && rec.summary.length > 60, "the whole thing reads as one sentence");
  ok(rec.affectedOthers === (rec.effectOnOthers !== null), "the affectedOthers flag and the payload agree");
  const dp = JSON.stringify(rec).match(/\d+\.\d{4,}/g);
  ok(!dp, "every number is rounded at write time");
}

/* ---- 10. a cycle of deck life ------------------------------------------------- */

{
  const before = journal.size;
  duties.wear = 0.5;
  const recs = runDeckCycle();
  ok(recs.length === crew.aboard.length, `${recs.length} hands each took a decision`);
  ok(journal.size === before + recs.length, "every decision was filed");
  const ids = new Set(recs.map((r) => r.action.id));
  ok(ids.size > 1, `they did not all do the same thing (${[...ids].join(", ")})`);

  for (let i = 0; i < 29; i++) { sim.time += CYCLE_SECONDS; runDeckCycle(); }
  const kinds = deckReport(journal.all());
  const distinct = new Set(journal.all().map((r) => r.action.id));
  ok(kinds.length >= 4, `over 30 cycles the deck does ${kinds.length} kinds of thing: ${kinds.map((k) => `${k.kind}×${k.n}`).join(" ")}`);
  ok(distinct.size >= 10, `${distinct.size} distinct actions were actually taken`);
  ok(crew.aboard.every((m) => NEED_KEYS.every((k) => m.need[k] < 0.999)),
    "no need pinned at the ceiling — a saturated need can still lose an argument");

  const m = crew.aboard[0];
  const h = habitsOf(m.id);
  ok(h.length >= 2 && h[0].n >= 2, `${m.name}'s habits: ${h.slice(0, 3).map((x) => `${x.action}×${x.n}`).join(", ")}`);
  const led = cradle.get(m.id);
  ok(led.journal.length === JOURNAL_KEEP, `the ledger keeps the last ${JOURNAL_KEEP} in full and drops the rest`);
  ok(journal.of(m.id, 100).length > JOURNAL_KEEP, "while the session keeps the lot");

  const engWork = journal.all().some((r) => r.action.id === "PATCH_HULL" || r.action.id === "TINKER" || r.action.id === "EMERGENCY_PATCH");
  ok(engWork || duties.wear <= 0.5, "somebody did something about the backlog, or nobody could");
}

/* ---- 11. it changes the ship and the people ----------------------------------- */

{
  const withShip = journal.all().filter((r) => r.affectedShip && r.effectOnShip?.changes && Object.keys(r.effectOnShip.changes).length);
  ok(withShip.length > 0, `${withShip.length} decisions left a mark on the hull`);
  const withOthers = journal.all().filter((r) => r.affectedOthers);
  ok(withOthers.length > 0, `${withOthers.length} of them landed on somebody else`);
  const alt = journal.all().find((r) => r.whatMadeMeActThis.alternativesConsidered.length > 1);
  ok(alt, `the alternatives are on file too: ${alt?.whatMadeMeActThis.alternativesConsidered.slice(0, 2).map((a) => `${a.option} ${(a.probability * 100) | 0}%`).join(", ")}`);
  ok(alt.whatMadeMeActThis.alternativesConsidered.every((a) => a.probability > 0 && a.probability <= 1), "with real probabilities");
}

/* ---- 12. compat and kin ------------------------------------------------------- */

{
  const [a, b] = crew.aboard;
  const c = compat(a, b);
  ok(c >= -5 && c <= 5, `genome-weighted compatibility stays on the old scale (${c.toFixed(2)})`);
  ok(relatedTo(a, b) < 0.22, `two hands off the same hall are not kin (${relatedTo(a, b)})`);

  const carrier = { ...a, gender: "woman", id: a.id };
  const sire = { ...b, gender: "man", id: b.id };
  const child = conceive(carrier, sire);
  ok(child.genome && child.parents?.length === 2, `${child.name} is on the ledger with a genome and two parents`);
  const stranger = crew.aboard[2] ?? crew.aboard[1];
  const cgx = genomeOf(child);
  const toStranger = relatedTo({ id: child.id }, stranger);
  ok(child.kinship.toCarrier > 0.25 && child.kinship.toSire > 0.25,
    `and reads as theirs (${child.kinship.toCarrier} / ${child.kinship.toSire}) — lower across races, as it should be`);
  ok(Math.min(child.kinship.toCarrier, child.kinship.toSire) > toStranger + 0.15,
    `…and far closer to them than to a shipmate (${toStranger})`);
  const cg = genomeOf(child);
  ok(cg && fingerprint(cg) === child.fingerprint, "the child's stored genome decodes to the child's fingerprint");
  ok(child.status === "child", "a minor is filed as a child, so the hiring halls never offer them");
}

/* ---- 12b. the topics a hand brings to you ------------------------------------ */

{
  const m = crew.aboard[0];
  adjustTrust(m, 60);
  const stages = new Set(journal.all().map((r) => r.observedSelf.stage));
  ok(!stages.has("infant") && !stages.has("juvenile"), `hired hands are grown adults (${[...stages].join(", ")})`);

  const rooms = new Set(journal.all().map((r) => r.observedSurroundings.room));
  ok(rooms.has("the mess") || rooms.has("their quarters"), "off watch, the record puts them where the rota does");

  const w = open(m, "watch");
  ok(/"/.test(w.text) && w.choices.length === 3, `TALK reads the last decision back: ${w.text.slice(0, 72)}…`);
  const more = choose(m, "watch", "more");
  ok(more.text.length > 10, `…and what else they nearly did: ${more.text.slice(0, 60)}…`);

  m.wants = { kind: "grievance", at: Date.now(), cycle: deckmind.cycle };
  crew.lastPay = { total: 100, paid: 0, shortfall: 140 };
  const labels = topicsFor(m).map((t) => t.label);
  ok(labels[0].includes("want a word"), "a flagged grievance is the first thing on the list, not the last");
  const g = open(m, "wants");
  ok(/140/.test(g.text) && g.choices.some((ch) => ch.id === "settle"), "the grievance names the number and offers to settle it");
  const creditsBefore = ship.credits;
  choose(m, "wants", "settle");
  ok(m.wants === null && ship.credits === creditsBefore - 140, "settling clears the flag and costs the money");
  ok(topicsFor(m).every((t) => !t.label.includes("want a word")), "and takes the topic off the board");
}

/* ---- 13. serialization -------------------------------------------------------- */

{
  const json = exportJournals();
  const parsed = JSON.parse(json);
  ok(parsed.cradleJournal === 1 && parsed.records.length > 0, `export carries ${parsed.records.length} people`);
  ok(parsed.records.every((r) => !r.journal.length || r.genome), "anybody with a journal has the genome that wrote it");
  ok(parsed.counts.filed > 0 && parsed.session.length > 0, `${parsed.counts.filed} filed records, ${parsed.session.length} this session`);

  const m = crew.aboard[0];
  const led = cradle.get(m.id);
  const keep = led.journal.slice();
  led.journal = [];
  const n = importJournals(parsed);
  ok(n > 0 && cradle.get(m.id).journal.length === keep.length, "a journal comes back off an export intact");
  const size = Math.round(json.length / 1024);
  ok(size < 900, `the whole flight recorder is ${size} KB`);
}

/* ---- 14. nothing leaks -------------------------------------------------------- */

{
  ok(crew.aboard.every((m) => (m.morale ?? 70) >= 0 && m.morale <= 100), "morale stayed on its rails through 25 cycles");
  ok(duties.wear >= 0 && duties.wear <= 1, `hull wear stayed 0..1 (${duties.wear.toFixed(2)})`);
  ok(ship.hull <= 100, "nobody repaired the hull past new");
  ok(journal.all().every((r) => r.cycle >= 0 && r.agent.name), "every filed record is well-formed");
  const cap = crew.aboard.every((m) => NEED_KEYS.every((k) => m.need[k] >= 0 && m.need[k] <= 1));
  ok(cap, "every need stayed 0..1");
}

console.log(`genome: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
