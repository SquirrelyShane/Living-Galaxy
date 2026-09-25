/* LIVING GALAXY 0.3.21 — chain contracts: work with more than one stage in it.
 *
 *   node --import ./test/three-register.mjs test/chains.test.mjs
 *
 * Every career has chains; every stage is a mechanic the game already owns;
 * a chain starts at ONE port in a sky; finishing a stage posts the next one
 * where the story says it goes; the closing stage pays the bonus and the
 * standing; and breaking one off takes it off the boards for a while.
 */

import { sim, launchSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations, stationById } from "../js/stations.js";
import { corps } from "../js/corps.js";
import { CHAINS, CHAIN_BY_ID, chains, chainOffersAt, chainReport, homePortOf, nextPortFrom, resetChains, chainBonus } from "../js/chains.js";
import { boardFor, acceptContract, abandonContract, deliverContracts, contracts, resetContracts, CATEGORIES, CATEGORY_ORDER, BOARD, acceptBlocker } from "../js/contracts.js";
import { stockOf } from "../js/economy.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };

makePilot("Chainer", "terran", "mining", null);
launchSim("ChainTest", "fixture");
sim.phase = "play";
const ship = sim.ship;
const honest = stations.filter((s) => !(s.hostile && !s.claimed) && s.sector !== "pirate");
for (const c of corps) c.standing = 100;

/* ---- the data ------------------------------------------------------------------- */
{
  ok(CHAINS.length >= 18, `${CHAINS.length} chains written`);
  const byCat = {};
  for (const c of CHAINS) byCat[c.cat] = (byCat[c.cat] ?? 0) + 1;
  ok(CATEGORY_ORDER.every((c) => byCat[c] >= 2), `every department runs at least two: ${CATEGORY_ORDER.map((c) => `${c} ${byCat[c] ?? 0}`).join(", ")}`);
  ok(CHAINS.every((c) => c.stages.length >= 3), `and every chain is at least three stages (${Math.min(...CHAINS.map((c) => c.stages.length))}–${Math.max(...CHAINS.map((c) => c.stages.length))})`);
  ok(CHAINS.every((c) => c.stages.every((s) => CATEGORIES[c.cat].kinds.includes(s.kind))), "every stage is a kind its own department already posts — a chain invents no mechanics");
  ok(CHAINS.every((c) => c.stages.every((s, i) => s.title && s.text?.length > 40 && (i === 0 ? !s.at : s.at === "same" || s.at === "next"))), "every stage after the first says where it is picked up");
  ok(CHAINS.every((c) => c.bonus > 0 && c.standing > 0) && new Set(CHAINS.map((c) => c.id)).size === CHAINS.length, "each pays a completion bonus and standing, and the ids are unique");
  const ids = new Set(CHAINS.map((c) => c.id));
  ok([...ids].every((i) => CHAIN_BY_ID[i]?.id === i), "the index matches the list");
}

/* ---- a chain starts in exactly one place ------------------------------------------ */
{
  resetChains();
  const homes = new Map();
  for (const c of CHAINS) {
    const h = homePortOf(c);
    ok(h && (!c.sectors || c.sectors.includes(h.sector) || !stations.some((s) => c.sectors.includes(s.sector))), `${c.id} opens at ${h?.name} (${h?.sector})`) ;
    homes.set(c.id, h.id);
  }
  ok(homePortOf(CHAINS[0]).id === homes.get(CHAINS[0].id), "and the home port is stable, not re-rolled every call");
  let posted = 0;
  for (const st of honest) posted += chainOffersAt(st, 0).length;
  ok(posted === CHAINS.length, `all ${CHAINS.length} chains are on a board somewhere and none of them twice (${posted})`);
  const nx = nextPortFrom(honest[0], CHAINS[0], 1);
  ok(nx && nx.id !== honest[0].id && nextPortFrom(honest[0], CHAINS[0], 1).id === nx.id, `an "at: next" stage picks a real neighbour, the same one every time (${nx?.name})`);
}

/* ---- the board posts them --------------------------------------------------------- */
{
  resetContracts();
  const home = homePortOf(CHAINS[0]);
  const offers = boardFor(home, 0).filter((o) => o.chain);
  ok(offers.length >= 1, `${home.name} posts ${offers.length} chain opener(s)`);
  const o = offers.find((x) => x.chain === CHAINS[0].id) ?? offers[0];
  const ch = CHAIN_BY_ID[o.chain];
  ok(o.chainIdx === 0 && o.tierName === `Stage 1 of ${ch.stages.length}` && o.chainOf === ch.stages.length, `the posting says which stage it is: "${o.title} · ${o.tierName}"`);
  ok(o.text.startsWith(ch.stages[0].text.slice(0, 40)) && o.cat === ch.cat && o.type === ch.stages[0].kind, "with the story's own words and the stage's own kind");
  ok(o.pay > 0 && Number.isFinite(o.pay) && o.chainBonus === chainBonus(ch), `priced from the live sky: ${o.pay.toLocaleString("en-US")} cr, ${o.chainBonus.toLocaleString("en-US")} cr on the end`);
  ok(boardFor(home, 0).filter((x) => x.chain === o.chain).length === 1, "and it is posted once, not once per outfit");
  /* rock stages still get a place to go */
  const rock = boardFor(home, 0).find((x) => x.chain && ["mine", "ice", "vein", "assay"].includes(x.type));
  if (rock) ok(rock.spot && /km out from/.test(rock.text), `a chain's mining stage still names a drift: ${rock.spot.name}`);
  else ok(true, "no rock stage on this board");
}

/* ---- run one end to end ------------------------------------------------------------ */
{
  resetContracts();
  ship.credits = 100000;
  /* a chain whose stages are all deliver/haul, so the test can close them at the desk */
  const runnable = CHAINS.find((c) => c.stages.every((s) => ["mine", "ice", "vein", "assay", "supply", "materials", "parts", "fuel", "reactor", "medical", "food", "procure", "resupply", "tender"].includes(s.kind)));
  ok(runnable, `flying ${runnable?.name} (${runnable?.stages.length} stages)`);
  let at = homePortOf(runnable);
  let stage = 0, paid = 0, seen = [];
  let co = null, st0 = 0;
  while (stage < runnable.stages.length) {
    const o = boardFor(at, sim.time).find((x) => x.chain === runnable.id);
    if (!o) { ok(false, `stage ${stage + 1} never posted at ${at.name}`); break; }
    ok(o.chainIdx === stage, `stage ${stage + 1}/${runnable.stages.length} posted at ${at.name}: "${o.title}"`);
    ok(acceptBlocker(o) === null, "  takeable");
    ship.dockedAt = at.id;
    acceptContract(o);
    if (stage === runnable.stages.length - 1) { co = corps.find((x) => x.id === o.corpId) ?? null; if (co) { co.standing = 50; st0 = 50; } }
    const a = contracts.active.find((x) => x.id === o.id);
    ok(chains.live.get(runnable.id)?.idx === stage, "  the chain knows it is running");
    ok(chainReport().some((r) => r.id === runnable.id && r.stage === stage + 1 && r.held), "  and the desk reports it in hand");
    /* do the work */
    if (a.good && a.qty) ship.hold[a.good] = (ship.hold[a.good] ?? 0) + a.qty;
    a.progress = 1;
    ship.dockedAt = a.mech === "haul" ? a.destId : a.stationId;
    const got = deliverContracts(ship.dockedAt);
    ok(got > 0, `  delivered for ${got.toLocaleString("en-US")} cr`);
    paid += got;
    seen.push(o.title);
    stage++;
    if (stage < runnable.stages.length) {
      const e = chains.live.get(runnable.id);
      ok(e && e.idx === stage && !e.held, `  the chain advanced to stage ${stage + 1}`);
      const want = runnable.stages[stage].at;
      const here = stationById(ship.dockedAt) ?? at;
      ok(want !== "same" || e.stationId === here.id || e.stationId === at.id, `  a "same" stage stays at the port (${stationById(e.stationId)?.name})`);
      at = stationById(e.stationId);
      sim.time += 30;
    }
  }
  ok(!chains.live.has(runnable.id) && chains.done.has(runnable.id), "the chain closes out");
  ok(paid >= chainBonus(runnable), `paid ${paid.toLocaleString("en-US")} cr all told — the ${chainBonus(runnable).toLocaleString("en-US")} cr bonus is in it`);
  if (co) ok(co.standing >= st0 + runnable.standing, `and ${co.name} thinks better of you for it: ${Math.round(st0)} → ${Math.round(co.standing)} (chain pays ${runnable.standing})`);
  else ok(true, "no charter holder at that port");
  ok(new Set(seen).size === seen.length && seen.length === runnable.stages.length, `${seen.length} different jobs, in order`);
  ok(!chainOffersAt(homePortOf(runnable), sim.time).some((s) => s.chain.id === runnable.id), "and a finished chain does not re-post");
}

/* ---- breaking one off ---------------------------------------------------------------- */
{
  resetContracts();
  const c = CHAINS.find((x) => !chains.done.has(x.id) && ["mine", "ice", "vein", "supply", "materials", "fuel", "medical", "food"].includes(x.stages[0].kind));
  const home = homePortOf(c);
  ship.dockedAt = home.id;
  const o = boardFor(home, sim.time).find((x) => x.chain === c.id);
  ok(o, `taking ${c.name} at ${home.name}`);
  acceptContract(o);
  ok(chains.live.has(c.id), "it is live");
  abandonContract(o.id);
  ok(!chains.live.has(c.id) && chains.cold.has(c.id), "abandoning a stage closes the whole file");
  ok(!chainOffersAt(home, sim.time).some((s) => s.chain.id === c.id), "and it is off the boards");
  ok(chainOffersAt(home, sim.time + 3000).some((s) => s.chain.id === c.id), "until the desk cools off, and then it is back");
}

/* ---- the desk still has its ordinary work ---------------------------------------------- */
{
  resetContracts();
  resetChains();
  for (const st of honest.slice(0, 4)) {
    const b = boardFor(st, sim.time + BOARD.refresh * 12);
    ok(b.length >= BOARD.offers - 2 && b.filter((o) => !o.chain).length >= 20, `${st.name}: ${b.length} postings, ${b.filter((o) => o.chain).length} of them chain stages`);
  }
}

console.log(`chains: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
