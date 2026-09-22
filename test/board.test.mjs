/* LIVING GALAXY — the contract board and the company fleet.
 *
 *   node --import ./test/three-register.mjs test/board.test.mjs
 */
import { sim, launchSim, tickSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations, stepStations } from "../js/stations.js";
import { corps, corpOfStation, corpRelation } from "../js/corps.js";
import { boardFor, acceptBlocker, acceptContract, abandonContract, deliverableAt, deliverContracts, contracts, tickContracts, BOARD, issuersAt } from "../js/contracts.js";
import { company, foundCompany, transfer, resetCompany, settleAsStaff, staffAt } from "../js/company.js";
import { fleet, commissionOptions, commissionHull, commissionBlocker, fleetReport, tickFleet, decommissionHull } from "../js/fleet.js";
import { traffic, stepTraffic } from "../js/npc/traffic.js";
import { crew, hireCrew, stationRoster, CYCLE_SECONDS } from "../js/crew.js";
import { currentSystem } from "../js/bodies.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("Board", "terran", "mining", null);
/* A PINNED FIXTURE SKY. The board asserts on generated hulls and their
 * timetables — which hulls exist and what claims sit on their legs is the
 * sky's business, so pin one rather than inheriting the public room's. */
launchSim("BoardTest", "fixture");
sim.phase = "play";
const ship = sim.ship;

/* ---- the board ------------------------------------------------------------ */
{
  const honest = stations.filter((s) => !(s.hostile && !s.claimed));
  let total = 0;
  const types = new Set();
  for (const st of honest) { const b = boardFor(st); total += b.length; for (const c of b) types.add(c.type); }
  ok(total >= honest.length * 2, `${total} offers across ${honest.length} ports (${[...types].join(", ")})`);
  ok(types.size >= 3, "more than one family posted — desks differ by charter");
  const withMine = honest.find((st) => boardFor(st).some((c) => c.type === "mine" && !acceptBlocker(c)));
  ok(withMine, "some desk posts mining work you can take");
  const st = withMine ?? honest.find((s) => boardFor(s).some((x) => !acceptBlocker(x)));
  const c = boardFor(st).find((x) => x.type === "mine" && !acceptBlocker(x)) ?? boardFor(st).find((x) => !acceptBlocker(x));
  /* 0.3.18: the port posts for its landlord and its tenant outfits; the issuer is who pays and who remembers */
  const co = corps.find((x) => x.id === c.corpId);
  ok(co && issuersAt(st).includes(co) && c.corpName === co.name, `posted on behalf of ${co?.name} (${c.tenant ? "tenant" : "landlord"} at ${st.name})`);
  const sealed = honest.flatMap((s) => boardFor(s)).find((x) => x.tier === "high");
  if (sealed) ok(/standing/.test(acceptBlocker(sealed) ?? ""), `sealed work is gated on standing (${acceptBlocker(sealed)})`);
  ok(acceptContract(c) === null && contracts.active.length === 1, `accepted ${c.title} (${c.tierName})`);
  ok(boardFor(st).every((x) => x.id !== c.id), "an accepted offer leaves the board");
  /* deliver it */
  ship.dockedAt = st.id;
  ok(deliverableAt(st.id).length === 0, "not deliverable without the cargo");
  ship.hold[c.good] = (ship.hold[c.good] ?? 0) + c.qty;
  ok(deliverableAt(st.id).length === 1, "…deliverable with it aboard");
  const cr0 = ship.credits, s0 = co.standing;
  const enemy = corps.find((o) => o !== co && corpRelation(o, co) <= -0.5);
  const e0 = enemy?.standing;
  const paid = deliverContracts(st.id);
  ok(paid === c.pay && ship.credits === cr0 + c.pay && contracts.active.length === 0, `paid ${paid} cr`);
  ok(co.standing > s0, `${co.name} standing up (${s0} → ${co.standing})`);
  if (enemy) ok(enemy.standing < e0, `…and ${enemy.name}, at war with them, took it badly`);
  /* abandon costs */
  const c2 = boardFor(st).find((x) => !acceptBlocker(x));
  if (c2) {
    acceptContract(c2);
    /* 0.3.18: the issuer may be a tenant outfit, not the landlord — it is the issuer that remembers */
    const issuer = corps.find((x) => x.id === c2.corpId) ?? corpOfStation(st);
    const s1 = issuer.standing;
    abandonContract(c2.id);
    ok(issuer.standing < s1 && contracts.failed === 1, `abandoning costs standing with ${issuer.name}`);
  }
  /* expiry */
  const c3 = boardFor(st).find((x) => !acceptBlocker(x) && x.type !== "haul");
  if (c3) {
    acceptContract(c3);
    sim.time += BOARD.deadline + 1;
    tickContracts(0.1);
    ok(contracts.active.length === 0 && contracts.failed === 2, "an overdue contract expires and is remembered");
  }
  /* a haul loads on accept */
  const hauler = honest.find((s) => boardFor(s).some((x) => x.type === "haul"));
  if (hauler) {
    ship.dockedAt = hauler.id;
    const h = boardFor(hauler).find((x) => x.type === "haul");
    const before = ship.hold[h.good] ?? 0;
    const why = acceptBlocker(h);
    if (!why) {
      acceptContract(h);
      ok((ship.hold[h.good] ?? 0) > before, `the consignment is aboard (${Math.round((ship.hold[h.good] ?? 0) - before)} ${h.good})`);
      abandonContract(h.id);
      ok((ship.hold[h.good] ?? 0) <= before + 1e-6, "abandoning a haul takes the consignment back");
    } else ok(true, `haul not takeable here: ${why}`);
  }
  ship.dockedAt = null;
}

/* ---- the fleet ---------------------------------------------------------------- */
{
  resetCompany();
  const yard = stations.find((s) => s.sector === "industrial" && !s.hostile) ?? stations.find((s) => s.sector === "military" && !s.hostile);
  ok(yard, "the sky has a yard");
  ship.dockedAt = yard.id;
  ship.credits = 200000;
  ok(foundCompany("Fleet Test", "industrial") === null, "company registered");
  const opts = commissionOptions("extract");
  ok(opts.length >= 1 && opts.every((o) => o.price > 0), `yard offers ${opts.map((o) => `${o.name} ${o.price}`).join(", ")}`);
  ok(/staff/.test(commissionBlocker(opts[0].id, "nobody") ?? ""), "needs a member of staff at the yard");
  /* settle a hand here */
  crew.employer = "Board";
  const cand = stationRoster(yard, 0, "sol")[0];
  ok(hireCrew(cand, ship, 8) === null, `${cand.name} signed on`);
  const m = crew.aboard[0];
  ok(settleAsStaff(m, [], yard) === null, "…and settled at the yard as staff");
  crew.aboard.length = 0;
  transfer(opts[0].price + 5000);
  const t0 = company.treasury;
  ok(commissionHull(opts[0].id, m.id, "extract", yard) === null && fleet.hulls.length === 1, `commissioned ${fleet.hulls[0]?.name}`);
  ok(company.treasury === t0 - opts[0].price, "the yard was paid from the treasury");
  const v = traffic.find((n) => n.id === fleet.hulls[0].id);
  ok(v && v.company && v.role === "miner" && v.legs?.some((l) => l.kind === "cut"), "the hull is on the board with a belt claim on its timetable");
  ok(staffAt(yard.id).find((s) => s.id === m.id)?.role === "captain", "the hand is its captain");
  /* run the sky forward until it brings a load home */
  const runsBefore = fleet.hulls[0].runs;
  let n = 0;
  /* (0.3.15: the ports move while the sky runs — a hull creeping into a bay is flying at a moving door) */
  while (n++ < 20000 && fleet.hulls[0].runs === runsBefore) { sim.time += 1; stepStations(sim.time); stepTraffic(sim.time, 1, stations, currentSystem); tickFleet(1); }
  ok(fleet.hulls[0].runs > runsBefore, `it delivered ore after ${n} s — earned ${fleet.hulls[0].earned} cr, spent ${fleet.hulls[0].spent} cr`);
  ok(company.book.some((e) => e.kind === "fleet" && e.delta > 0), "the delivery is in the book");
  const r = fleetReport()[0];
  ok(typeof r.net === "number" && r.cyclesOut >= 1, `report: ${r.name} net ${r.net} cr over ${r.cyclesOut} cycles`);
  ok(decommissionHull(fleet.hulls[0].id) === null && fleet.hulls.length === 0 && !traffic.some((x) => x.id === v.id), "sold back to the yard, off the board");
  ship.dockedAt = null;
}

console.log(`board: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
