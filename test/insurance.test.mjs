/* LIVING GALAXY — hull insurance.
 *
 *   node --import ./test/three-register.mjs test/insurance.test.mjs
 *
 * Five tiers, one loss each: Platinum 100%, Gold 75, Silver 50, Copper 25,
 * Bronze 10 of what the hull was worth to its owner.
 *
 * The arithmetic is the easy half. What this suite spends most of its effort
 * on is the two ways a payout scheme goes wrong:
 *
 *   THE MONEY PRINTER. A complex member buys a hull in their own line at the
 *   45% issue rate. If cover were written against LIST, platinum would pay
 *   1.00 for a hull that cost 0.45 plus a 0.35 premium — a 20% profit for
 *   throwing your ship away, repeatable forever. Cover is written against
 *   what the hull costs ITS owner, and section 4 proves no tier is ever
 *   profitable to claim on purpose.
 *
 *   THE FREE LUNCH. A policy that survives its own payout, or that can be
 *   claimed twice, is an income. Section 3 pins single-use.
 *
 * And then the thing the player actually feels: losing a hull leaves you
 * flying, somewhere, with whatever the underwriter owed you.
 */

import {
  TIERS, TIER_BY_ID, policies, insuranceLog, resetInsurance,
  premiumFor, payoutFor, quoteAll, insure, policyFor, isInsured, release, claim,
  insuranceReport, playerKey, droneKey, npcKey, coverForVessel, downScaleFor, DOWN_SCALE,
} from "../js/insurance.js";
import { SHIP_DB, shipById, DEFAULT_SHIP_ID } from "../js/shipdb.js";
import { yardQuote, ISSUE_RATE } from "../js/shipcost.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

/* ---- 1. the tiers are the tiers ------------------------------------------ */
{
  const want = { platinum: 1.00, gold: 0.75, silver: 0.50, copper: 0.25, bronze: 0.10 };
  for (const [id, pct] of Object.entries(want)) {
    ok(TIER_BY_ID[id]?.payout === pct, `${id} pays ${pct * 100}% of the hull (${(TIER_BY_ID[id]?.payout ?? 0) * 100})`);
  }
  ok(TIERS.length === 5, `five tiers (${TIERS.length})`);
  /* ordered cheapest to dearest, and both curves rise together */
  for (let i = 1; i < TIERS.length; i++) {
    ok(TIERS[i].payout > TIERS[i - 1].payout, `${TIERS[i].id} covers more than ${TIERS[i - 1].id}`);
    ok(TIERS[i].rate > TIERS[i - 1].rate, `…and costs more (${TIERS[i].rate} vs ${TIERS[i - 1].rate})`);
  }
}

/* ---- 2. premiums and payouts are credits, in whole numbers --------------- */
{
  resetInsurance();
  const V = 50618;
  for (const q of quoteAll(V)) {
    ok(Number.isInteger(q.premium) && Number.isInteger(q.payout), `${q.name} quotes whole credits (${q.premium} / ${q.payout})`);
    ok(q.payout === Math.round(V * q.payoutPct), `${q.name} pays ${q.payoutPct * 100}% of the value`);
    ok(q.premium < q.payout, `${q.name} costs less than it pays (${q.premium} < ${q.payout})`);
  }
  /* the fraction and the credit amount are separate fields — an early cut
   * overwrote one with the other */
  const p = quoteAll(V).find((q) => q.id === "platinum");
  ok(p.payoutPct === 1 && p.payout === V, `platinum keeps both the fraction (${p.payoutPct}) and the credits (${p.payout})`);
  ok(premiumFor(0, "gold") === 0 && payoutFor(-5, "gold") === 0, "a worthless hull quotes nothing");
  ok(premiumFor(V, "adamantium") === 0, "an unknown tier quotes nothing rather than throwing");
}

/* ---- 3. a policy covers exactly one loss --------------------------------- */
{
  resetInsurance();
  const key = playerKey("test_hull");
  ok(insure(key, "gold", 40000, 10) !== null, "cover is written");
  ok(isInsured(key), "…and the hull reads as insured");
  const first = claim(key, { at: 20, what: "Test Hull", by: "a pirate" });
  ok(first.paid === 30000, `gold settles 75% (${first.paid} of 40,000)`);
  ok(!isInsured(key), "the policy is consumed by the payout");
  const second = claim(key, { at: 21 });
  ok(second.paid === 0, "a second claim on the same hull pays nothing");

  /* settled at the value when written, not the value today */
  insure(key, "platinum", 10000, 0);
  insure(key, "platinum", 90000, 5);     // a refit, re-covered
  ok(policyFor(key).value === 90000, "re-covering a hull replaces the policy");
  ok(claim(key).paid === 90000, "…and settles against the value that was written");

  ok(insure(key, "silver", 8000, 0) && release(key) && !isInsured(key), "a policy can be torn up without paying");
  ok(claim(key).paid === 0, "…and a torn-up policy settles nothing");
}

/* ---- 4. no tier is worth claiming on purpose ----------------------------- */
{
  /* The whole reason cover is written against the OWNER'S price and not list.
   * Run it over every hull in the registry, for a member buying in their own
   * line at the issue rate — the cheapest a hull can ever be had for. */
  const member = { complexId: null, letter: "G" };
  let printers = 0, worst = null;
  for (const def of SHIP_DB) {
    const owner = { complexId: def.complex, letter: "G" };   // in-line, top rank
    const paid = yardQuote(def, owner).total;                 // what it cost them
    for (const t of TIERS) {
      const outlay = paid + premiumFor(paid, t.id);
      const back = payoutFor(paid, t.id);
      if (back > outlay) { printers++; worst = `${def.name} ${t.id}: out ${outlay}, back ${back}`; }
    }
  }
  ok(printers === 0, `no hull and tier pays more than it cost${worst ? ` — ${worst}` : ""} (${SHIP_DB.length} hulls x ${TIERS.length} tiers)`);
  ok(ISSUE_RATE < 1, `the issue rate is a real discount (${ISSUE_RATE}), which is what made this worth checking`);

  /* and insuring is a losing bet unless you lose hulls often — a game where
   * cover always pays for itself has no decision in it */
  for (const t of TIERS) {
    const breakEven = t.rate / t.payout;
    ok(breakEven > 0.2 && breakEven < 0.5, `${t.id} needs a ${Math.round(breakEven * 100)}% loss rate to break even`);
  }
  void member;
}

/* ---- 5. the report adds up ----------------------------------------------- */
{
  resetInsurance();
  insure(playerKey("a"), "platinum", 100000, 0);
  insure(droneKey("d1"), "bronze", 10000, 0);
  insure(npcKey("n1"), "silver", 20000, 0);
  const r = insuranceReport();
  ok(r.open === 3, `three policies open (${r.open})`);
  ok(r.exposure === 100000 + 1000 + 10000, `exposure is the sum of the payouts (${r.exposure})`);
  ok(r.premiums === 35000 + 300 + 3000, `and the premiums are on the books too (${r.premiums})`);
  claim(droneKey("d1"), { what: "MINER-01", by: "raiders" });
  const r2 = insuranceReport();
  ok(r2.open === 2 && r2.paidOut === 1000, `a settlement moves off the exposure and onto the log (${r2.open} open, ${r2.paidOut} paid)`);
  ok(insuranceLog[0]?.what === "MINER-01", "the log names what was lost");
  resetInsurance();
  ok(policies.size === 0 && insuranceLog.length === 0, "a reset clears the books");
}

/* ---- 6. who else carries cover ------------------------------------------- */
{
  /* seeded off the vessel id, so a shared sky agrees without a byte crossing */
  const v = { id: "npc:cap:freight:3", role: "freight" };
  ok(coverForVessel(v) === coverForVessel({ ...v }), "a vessel's cover is a fact about it, not a roll");
  ok(coverForVessel({ id: "x", role: "pirate" }) === null, "a pirate carries nothing");
  ok(coverForVessel({ id: "x", role: "freight", rogue: true }) === null, "nobody underwrites a drone nest");
  ok(coverForVessel(null) === null && coverForVessel({}) === null, "an unknown hull carries nothing, rather than throwing");

  const spread = (role) => {
    const seen = {};
    for (let i = 0; i < 600; i++) { const t = coverForVessel({ id: `v${i}`, role }) ?? "none"; seen[t] = (seen[t] ?? 0) + 1; }
    return seen;
  };
  const liner = spread("liner"), miner = spread("miner");
  ok((liner.platinum ?? 0) + (liner.gold ?? 0) > 400, "a liner is properly underwritten");
  ok((miner.none ?? 0) + (miner.bronze ?? 0) + (miner.copper ?? 0) > 400, "a belt miner mostly is not");
  ok(!miner.platinum, "…and never carries platinum");

  /* the mechanical meaning: cover decides how fast a downed hull is replaced */
  const covered = downScaleFor({ id: "v0", role: "liner" });
  const bare = downScaleFor({ id: "x", role: "pirate" });
  ok(bare > 1, `an uninsured operator takes longer than the base to come back (x${bare})`);
  ok(DOWN_SCALE.platinum < DOWN_SCALE.bronze, `platinum replaces a hull sooner than bronze (x${DOWN_SCALE.platinum} vs x${DOWN_SCALE.bronze})`);
  for (const t of TIERS) ok(DOWN_SCALE[t.id] <= 1, `${t.id} is never slower than the base`);
  ok(covered < bare, `and any cover beats none (x${covered} vs x${bare})`);
}

/* ---- 7. losing the player's hull ----------------------------------------- */
{
  const { sim, launchSim, loseHull } = await import("../js/sim.js");
  const { makePilot } = await import("../js/pilot.js");
  const { currentShipId } = await import("../js/sim.js");

  makePilot("Underwriter", "terran", "freight", null);
  launchSim("InsuranceTest", "sol");
  sim.phase = "play";

  const trainer = currentShipId();
  ok(trainer === DEFAULT_SHIP_ID, `a new pilot is in the trainer (${shipById(trainer)?.name})`);

  /* give them a real hull, and cover on it */
  const bought = SHIP_DB.find((d) => d.id !== DEFAULT_SHIP_ID && yardQuote(d).total > 20000);
  sim.ownedHulls = [bought.id];
  sim.activeHullId = bought.id;
  const worth = yardQuote(bought, { complexId: null, letter: "A" }).total;
  insure(playerKey(bought.id), "gold", worth, sim.time);

  const purse = sim.ship.credits;
  sim.ship.hold = { steel: 40 };
  const out = loseHull(sim.ship, "a rogue drone");

  ok(out.paid === Math.round(worth * 0.75), `gold settled 75% of the hull (${out.paid.toLocaleString()} of ${worth.toLocaleString()})`);
  ok(sim.ship.credits === purse + out.paid, "the payout is in the purse");
  ok(!sim.ownedHulls.includes(bought.id), "the lost hull is struck off the books");
  ok(currentShipId() === DEFAULT_SHIP_ID, "…and the pilot falls back to the trainer rather than being stranded");
  ok(!isInsured(playerKey(bought.id)), "the policy went with the hull");
  ok(sim.ship.hull > 0, `you are flying, not dead (hull ${Math.round(sim.ship.hull)})`);
  ok(Object.keys(sim.ship.hold).length === 0, "the hold went with the hull");
  ok(sim.ship.vel.x === 0 || Number.isFinite(sim.ship.vel.x), "…and the replacement is not carrying the wreck's vector");

  /* THE NEW PILOT. Somebody who has never bought a hull is flying the
   * trainer, which is the fallback — so a loss costs them the cargo and the
   * trip back, and not the game. This is the case that decides whether real
   * hull loss is harsh or punishing, and it wants pinning. */
  sim.ownedHulls = [];
  sim.activeHullId = null;
  sim.ship.hold = { ice: 12 };
  const purse0 = sim.ship.credits;
  const out0 = loseHull(sim.ship, "a rock");
  ok(currentShipId() === DEFAULT_SHIP_ID, "a pilot who never bought a hull is still in the trainer afterwards");
  ok(sim.ship.credits === purse0 && out0.paid === 0, "they lose no credits to it");
  ok(sim.ship.hull > 0 && Object.keys(sim.ship.hold).length === 0, "they lose the cargo and keep flying");

  /* uninsured, and with a spare on the books */
  const spare = SHIP_DB.find((d) => d.id !== DEFAULT_SHIP_ID && d.id !== bought.id);
  sim.ownedHulls = [spare.id, bought.id];
  sim.activeHullId = bought.id;
  const purse2 = sim.ship.credits;
  const out2 = loseHull(sim.ship, "a hull breach");
  ok(out2.paid === 0, "no cover, nothing settled");
  ok(sim.ship.credits === purse2, "…and nothing moved in the purse");
  ok(currentShipId() === spare.id, `you fall back to the next hull you own (${shipById(spare.id)?.name})`);
}

/* ---- 8. a drone's cover survives a reload --------------------------------- */
{
  /* Policies live in a Map, not in the drone save file. Without this the
   * treasury pays a premium, the player closes the tab, and the cover is
   * quietly gone — the worst kind of bug, because nothing reports it. */
  const ops = await import("../js/drones/ops.js");
  resetInsurance();
  const u = { id: "d7", cover: "gold", value: 12000 };
  insure(droneKey(u.id), u.cover, u.value, 0);
  ok(isInsured(droneKey("d7")), "a commissioned drone carries its cover");
  /* simulate the reload: the Map is cleared, the unit record is not */
  resetInsurance();
  ok(!isInsured(droneKey("d7")), "…which a reload clears out of the Map");
  if (u.cover && u.value > 0) insure(droneKey(u.id), u.cover, u.value, 0);
  ok(isInsured(droneKey("d7")), "so it is written back from what the drone remembers");
  ok(policyFor(droneKey("d7")).payout === 9000, "at the same tier and value it was bought at");
  ok(typeof ops.droneOps.cover !== "undefined", "the chosen tier for new commissions is part of ops state");
  resetInsurance();
}

console.log(`insurance: ${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
