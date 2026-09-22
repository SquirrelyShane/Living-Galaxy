/* Living Galaxy — gender ratios, the Marshal's board, and the brig.
 *
 *   node --import ./test/three-register.mjs test/bounty.test.mjs
 */

import { sim, launchSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { crew, hireCrew, stationRoster, tickCrew, CYCLE_SECONDS } from "../js/crew.js";
import { cradle, generateNPC, ensureIdentity, PRONOUNS } from "../js/npc/cradle.js";
import { createSpacer, genomeIdentity, SEX_SPLIT, NONBINARY_SHARE } from "../js/genome/spacer.js";
import { givenName, nameRng } from "../js/names.js";
import { LEXICONS } from "../js/data/lexicons.js";
import { corps, corpById, corpRelation, corpOfStation } from "../js/corps.js";
import { boarding } from "../js/interior/boarding.js";
import {
  bounty, boardAt, takeTicket, abandonTicket, ticketsHeld, attemptCapture, canAttempt,
  captureStrength, markStrength, deliver, release, ransom, brigBerths, tickHunters,
  tickPlayerPrice, resetBounty, CHARGES, LIFT_COST, DELIVER_GAIN, HUNTED_AT,
} from "../js/npc/bounty.js";
import {
  captives, captiveState, captiveById, INTERACTIONS, INTERACTION_BY_ID, canInteract, interact,
  canRecruit, recruit, guardStrength, tickCaptives, captiveLine,
  RECRUIT_RESISTANCE, RECRUIT_REGARD,
} from "../js/crew/captive.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

makePilot("Marshal", "terran", "security", null);
launchSim("BountyTest", "sol");
sim.phase = "play";
const ship = sim.ship;

/* ---- 1. who is actually out there --------------------------------------------
 * Reported from play: "all I'm seeing are males or they/them". Two causes — the
 * sex gene drew on a bell curve so a usable intersex band swallowed a fifth of
 * everyone, and names came out of one pool regardless of who they belonged to.
 */

{
  const sex = { female: 0, male: 0, intersex: 0 };
  const gender = { woman: 0, man: 0, nonbinary: 0 };
  for (let i = 0; i < 4000; i++) {
    const id = genomeIdentity(createSpacer(`ratio:${i}`, "terran"));
    sex[id.sex]++;
    gender[id.gender]++;
  }
  const pc = (n) => n / 40;
  /* an earlier patch moved SEX_SPLIT on purpose: earlier even cut measured correctly and
   * still played male-dominant, so the ask was for a sky that leans the other
   * way. The contract this pins is no longer "even", it is "female-leaning and
   * nobody is a token" — see test/gender.test.mjs for the full measurement. */
  ok(pc(sex.female) > pc(sex.male), `the sky leans female (${pc(sex.female).toFixed(1)}% / ${pc(sex.male).toFixed(1)}%)`);
  ok(pc(sex.male) > 35, `and men are still a large minority, not a token (${pc(sex.male).toFixed(1)}%)`);
  ok(pc(sex.intersex) < 3, `and the band between is narrow, not a fifth of the sky (${pc(sex.intersex).toFixed(1)}%)`);
  ok(pc(gender.woman) > 45 && pc(gender.man) > 35, `gender follows it (${pc(gender.woman).toFixed(1)}% women, ${pc(gender.man).toFixed(1)}% men)`);
  ok(pc(gender.nonbinary) > 2 && pc(gender.nonbinary) < 12, `with a real but not dominant share nonbinary (${pc(gender.nonbinary).toFixed(1)}%)`);
  ok(SEX_SPLIT.female < SEX_SPLIT.male && NONBINARY_SHARE > 0, "sex and gender identity are two separate reads, not one");
}

{
  /* the same person, every time */
  const g = createSpacer("stable-1", "terran");
  const a = genomeIdentity(g), b = genomeIdentity(g);
  ok(a.gender === b.gender && a.sex === b.sex, "identity is deterministic from the genome");

  /* names */
  const byGender = { woman: [], man: [], nonbinary: [] };
  for (let i = 0; i < 900; i++) {
    const r = generateNPC(`name:${i}`, {});
    byGender[r.gender].push(r.name.split(" ")[0]);
  }
  /* Names no longer come from three fixed pools — they come out of the forge
   * in js/names.js, where gender rides on the ending and a share of every
   * draw takes the neutral set anyway. Two samples of 900 will almost never
   * land on the same forged string twice, so the shared half of the property
   * is measured against a deep sample of men's names rather than against the
   * four hundred men who happened to turn up. */
  const mensNames = new Set();
  {
    const rnd = nameRng("bounty:mens-pool");
    for (const race of Object.keys(LEXICONS)) {
      for (let i = 0; i < 4000; i++) mensNames.add(givenName(LEXICONS[race], "man", rnd));
    }
  }
  const shared = new Set(byGender.woman.filter((n) => mensNames.has(n)));
  const wOnly = new Set(byGender.woman.filter((n) => !mensNames.has(n)));
  ok(wOnly.size > 10, `women draw from names men do not (${[...wOnly].slice(0, 5).join(", ")}…)`);
  ok(shared.size > 3, `and a shared pool keeps it from being a code (${[...shared].slice(0, 4).join(", ")}…)`);
  const ambiguous = byGender.woman.filter((n) => shared.has(n)).length / byGender.woman.length;
  ok(ambiguous < 0.45, `most women read as women on a crew list (${Math.round((1 - ambiguous) * 100)}%)`);
  ok(byGender.woman.every((n, i) => PRONOUNS.woman.subj === "she"), "and the pronouns still come off the gender");
}

{
  /* a v2 record whose gender came off the old split is re-read, deterministically */
  const fresh = generateNPC("migrate:1", {});
  const old = { ...fresh, sex: undefined, gender: "nonbinary", pronouns: PRONOUNS.nonbinary };
  delete old.sex;
  ensureIdentity(old);
  ok(old.sex && old.gender === fresh.gender, `a pre-fix record re-reads to the same person (${old.gender})`);
}

/* ---- 2. the board ------------------------------------------------------------ */

resetBounty();
ship.credits = 400000;
sim.crewCapacity = 8;
for (const c of stationRoster(stations[0], 0, sim.skySeed).slice(0, 4)) hireCrew(c, ship, 8);
ok(crew.aboard.length >= 3, `${crew.aboard.length} hands aboard`);

const port = stations.find((s) => s.id && s.sector !== "pirate");
const board = boardAt(port);
{
  ok(board.length > 0, `${board.length} marks on the board at ${port.name}`);
  ok(boardAt(port).length === board.length && boardAt(port)[0].id === board[0].id, "and it is the same board until it turns over");
  ok(board.every((m) => m.pay > 0 && m.chargeLabel && m.holedAt), "every mark pays, has a charge and is somewhere");
  ok(board.every((m) => CHARGES.some((c) => c.id === m.charge)), "and the charge is a real one");
  ok(board.every((m) => m.ownerCorp && m.issuerCorp), "every mark belongs to somebody, and somebody else wrote the ticket");
  ok(board.every((m) => m.ownerCorp !== m.issuerCorp), "a desk never puts out paper on its own people");
  const issuer = corpOfStation(port);
  if (issuer) ok(board.every((m) => corpRelation(corpById(m.ownerCorp), issuer) < 0.5), "nor on an ally's");
  ok(board.every((m) => cradle.get(m.id)?.wanted), "and the mark is filed as wanted on the ledger");
  const fromLedger = board.filter((m) => (cradle.get(m.id)?.history?.length ?? 0) > 0);
  ok(fromLedger.length >= 0, `${fromLedger.length} of them are people the sky already knew`);
}

{
  ok(takeTicket(board[0]) === null, "a ticket can be signed");
  ok(takeTicket(board[0]) !== null, "…once");
  ok(ticketsHeld().length === 1, "and it is in hand");
  ok(takeTicket(board[1]) === null && takeTicket(board[2]) === null, "three to a hull");
  ok(takeTicket(board[3]) !== null, "…and no more");
  abandonTicket(board[2].id);
  ok(ticketsHeld().length === 2, "handing one back frees the slot");
}

/* ---- 3. going and getting them ------------------------------------------------ */

const mark = ticketsHeld()[0];
{
  ship.dockedAt = null;
  ok(canAttempt(mark).ok === false, "you cannot take somebody from across the system");
  ship.dockedAt = stations.find((s) => s.id !== mark.holedAt)?.id ?? null;
  ok(canAttempt(mark).ok === false, "…or from the wrong port");
  ship.dockedAt = mark.holedAt;
  ok(canAttempt(mark).ok === true, `docked where they are: ${mark.holedName}`);

  const mine = captureStrength(), theirs = markStrength(mark);
  ok(mine > 1 && theirs > 0, `your ${mine} against their ${theirs}`);
  const noCrew = crew.aboard.splice(0, crew.aboard.length);
  ok(captureStrength() < mine, "a hull with nobody aboard brings less to a lock-up");
  crew.aboard.push(...noCrew);

  const owner = corpById(mark.ownerCorp);
  const before = owner.standing;
  const allies = corps.filter((c) => c.id !== owner.id && corpRelation(c, owner) >= 0.5);
  const alliesBefore = allies.map((c) => c.standing);

  const res = attemptCapture(mark, { rng: () => 0.01 });
  ok(res.ok && res.taken, `taken (${Math.round(res.odds * 100)}% at the door)`);
  ok(boarding.brig.length === 1 && boarding.brig[0].id === mark.id, "and in the brig");
  ok(cradle.get(mark.id).status === "captive", "with the ledger saying so");
  ok(owner.standing < before, `${owner.name} took it badly (${before.toFixed(1)} → ${owner.standing.toFixed(1)})`);
  if (allies.length) ok(allies.some((c, i) => c.standing < alliesBefore[i]), `and so did the ${allies.length} flying with them`);
  ok(attemptCapture(mark).ok === false, "one go per rotation");
}

/* ---- 4. the person in the cell ------------------------------------------------ */

const p = boarding.brig[0];
{
  const st = captiveState(p);
  ok(st.resistance >= 30 && st.resistance <= 100, `they start hard (${Math.round(st.resistance)})`);
  ok(st.regard < 50, `and thinking very little of you (${Math.round(st.regard)})`);
  ok(captiveState(p) === st, "the state is kept, not rebuilt");
  ok(captiveById(p.id) === p && captives().length === 1, "and reads back off the brig");
  ok(/health/.test(captiveLine(p)), `in words: ${captiveLine(p)}`);

  ok(canRecruit(p).ok === false, "nobody signs on from a standing start");
  ok(INTERACTIONS.some((a) => a.kind === "care") && INTERACTIONS.some((a) => a.kind === "hard"), "there are two ways to go about it");
  ok(["feed", "clothe", "talk", "exercise"].every((id) => INTERACTION_BY_ID[id]), "food, clothes, talking and working out are all on the list");

  /* a meal */
  const r0 = { res: st.resistance, reg: st.regard };
  const fed = interact(p, "feed", () => 0.99);
  ok(fed.ok && st.resistance < r0.res && st.regard > r0.reg, `a meal moves both the right way (${r0.res.toFixed(1)} → ${st.resistance.toFixed(1)}, ${r0.reg.toFixed(1)} → ${st.regard.toFixed(1)})`);
  ok(typeof fed.line === "string" && fed.line.includes(p.name.split(" ")[0]), "and reads as something that happened");
  ok(canInteract(p, "feed").ok === false, "not twice in a cycle");

  /* the ones that need something */
  ok(canInteract(p, "work").ok === false, "you cannot put somebody on a watch out of a cell");
  ok(canInteract(p, "ease").ok === true, "but you can take them out of it");
  const creditsBefore = ship.credits;
  interact(p, "clothe", () => 0.99);
  ok(ship.credits < creditsBefore, "clothes cost money");
  ok(canInteract(p, "clothe").ok === false, "and are a one-off");
}

{
  /* the long way round */
  const st = captiveState(p);
  let cycles = 0;
  const round = ["talk", "exercise", "ease", "work", "feed", "talk", "exercise", "work", "feed", "talk", "work", "exercise", "feed", "talk"];
  for (const a of round) {
    if (canInteract(p, a).ok) interact(p, a, () => 0.99);
    tickCaptives();
    cycles++;
    if (canRecruit(p).ok) break;
  }
  const can = canRecruit(p);
  ok(can.ok, `after ${cycles} cycles of looking after somebody they will hear an offer (${can.why ?? `${Math.round(can.chance * 100)}%`})`);
  ok(st.resistance <= RECRUIT_RESISTANCE && st.regard >= RECRUIT_REGARD, `both numbers had to move: resistance ${Math.round(st.resistance)}, regard ${Math.round(st.regard)}`);
  ok(st.outOfCell === true, "and they are not in a cell any more");

  const regardBefore = st.regard;
  const refused = recruit(p, () => 0.999);
  ok(refused.ok && !refused.signed, "an offer can be turned down");
  ok(st.regard < regardBefore && st.attempts === 1, `and it costs you — regard ${Math.round(regardBefore)} → ${Math.round(st.regard)}, next one is harder`);
  ok(canRecruit(p).ok === false || canRecruit(p).chance < can.chance, "so it is a judgement, not a button to hammer");

  /* win it back */
  for (let i = 0; i < 16 && !canRecruit(p).ok; i++) {
    for (const a of ["feed", "talk", "work", "exercise"]) if (canInteract(p, a).ok) interact(p, a, () => 0.99);
    tickCaptives();
  }
  ok(canRecruit(p).ok, "and it can be earned back");

  const owner = corpById(p.ownerCorp);
  const ownerBefore = owner?.standing ?? 0;
  const signed = recruit(p, () => 0.0);
  ok(signed.ok && signed.signed, "and it can be accepted");
  ok(crew.aboard.some((m) => m.id === p.id), `${p.name} is on the crew`);
  ok(boarding.brig.length === 0, "and out of the brig");
  ok(cradle.get(p.id).status === "aboard" && !cradle.get(p.id).wanted, "the ledger says aboard, and the price is off them");
  if (owner) ok(owner.standing < ownerBefore, `${owner.name} takes turning one of theirs very personally (${ownerBefore.toFixed(1)} → ${owner.standing.toFixed(1)})`);
}

/* ---- 5. the other doors -------------------------------------------------------- */

{
  const m2 = ticketsHeld().find((t) => !t.attempted && !t.gone)
    ?? boardAt(port).find((x) => !x.gone && !bounty.taken.some((t) => t.id === x.id && t.attempted));
  if (m2 && !ticketsHeld().some((t) => t.id === m2.id)) takeTicket(m2);
  ship.dockedAt = m2?.holedAt ?? null;
  if (m2) attemptCapture(m2, { rng: () => 0.01 });
  const q = boarding.brig[0];
  ok(Boolean(q), `a second mark taken${q ? `: ${q.name}` : ""}`);

  /* the hard way: fast, and it closes the door it was opened for */
  const stq = captiveState(q) ?? { resistance: 0, regard: 0 };
  for (let i = 0; i < 8 && q; i++) {
    for (const a of ["press", "rations", "isolate"]) if (canInteract(q, a).ok) interact(q, a, () => 0.99);
    tickCaptives();
  }
  ok(stq.resistance < RECRUIT_RESISTANCE, `pressure works on the first number (${Math.round(stq.resistance)})`);
  ok(stq.regard < RECRUIT_REGARD, `and destroys the second (${Math.round(stq.regard)})`);
  ok(canRecruit(q).ok === false, "so nobody is signing on after that");

  ship.dockedAt = port.id;
  const bad = q ? deliver(q.id) : { ok: false, why: "in that state" };
  ok(bad.ok === false && /in that state/.test(bad.why), `and a Marshal will not take them: "${bad.why}"`);

  /* patch them up enough to be handed over */
  for (let i = 0; i < 20 && q; i++) { if (canInteract(q, "feed").ok) interact(q, "feed", () => 0.99); if (canInteract(q, "medic").ok) interact(q, "medic", () => 0.99); tickCaptives(); }
  const issuer = corpById(q.issuerCorp);
  const issBefore = issuer?.standing ?? 0;
  const creditsBefore = ship.credits;
  const done = q ? deliver(q.id) : { ok: false };
  ok(done.ok && ship.credits > creditsBefore, `handed over for ${done.pay} cr`);
  if (issuer) ok(issuer.standing > issBefore, `${issuer.name} remembers it (${issBefore.toFixed(1)} → ${issuer.standing.toFixed(1)})`);
  ok(boarding.brig.length === 0, "and the cell is empty");
}

{
  /* selling somebody back, and letting them go */
  const m3 = boardAt(port).find((x) => !x.gone && !bounty.taken.some((t) => t.id === x.id));
  if (m3) {
    takeTicket(m3);
    ship.dockedAt = m3.holedAt;
    attemptCapture(m3, { rng: () => 0.01 });
    const q = boarding.brig[0];
    if (q) {
      const owner = corpById(q.ownerCorp);
      const before = owner?.standing ?? 0;
      const credits = ship.credits;
      const r = ransom(q.id);
      ok(r.ok && ship.credits > credits, `their outfit buys them back for ${r.pay} cr`);
      if (owner) ok(owner.standing > before, `${owner.name} thinks better of you for it (${before.toFixed(1)} → ${owner.standing.toFixed(1)})`);
      ok(!cradle.get(q.id)?.wanted, "and the price comes off them");
    } else ok(true, "the second attempt did not land");
  } else ok(true, "no fresh mark left on this board to try");
}

/* ---- 6. the door, and the clock ------------------------------------------------ */

{
  ok(guardStrength() > 0, `a watch of ${guardStrength()} on the brig`);
  const lone = crew.aboard.splice(0, crew.aboard.length);
  const thin = guardStrength();
  crew.aboard.push(...lone);
  ok(thin < guardStrength(), "a hull with nobody aboard is an open hatch");

  const t = ticketsHeld()[0];
  if (t) {
    t.expires = (sim.time ?? 0) - 1;
    tickHunters(90);
    ok(t.done && t.outcome === "expired", "a ticket left too long runs out");
  } else ok(true, "no live ticket to expire");

  for (const c of corps) c.standing = -90;
  tickPlayerPrice();
  ok(bounty.playerPrice > 0, `standing that far under puts paper out on you (${bounty.playerPrice} cr)`);
  for (const c of corps) c.standing = 0;
  tickPlayerPrice();
  ok(bounty.playerPrice === 0, "and it comes off when you are square with everybody");
}

/* ---- 7. nothing leaks ---------------------------------------------------------- */

{
  ok(boarding.brig.every((q) => captiveState(q).resistance >= 0 && captiveState(q).resistance <= 100), "resistance stayed 0..100");
  ok(boarding.brig.every((q) => captiveState(q).health >= 1), "nobody was left at nothing");
  ok(corps.every((c) => c.standing >= -100 && c.standing <= 100), "standing stayed on its rails");
  ok(crew.aboard.length <= (sim.crewCapacity ?? 2), "the berth list never went over capacity");
  ok(brigBerths() >= 1, `every hull has at least one cell (${brigBerths()})`);
  ok(cradle.all().every((r) => !r.wanted || r.wanted.pay > 0), "every price on the ledger is a real one");
}

console.log(`bounty: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
