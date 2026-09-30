import { crew, crewHooks, rapportBetween } from "./ledger.js";
import { cradle, drawnTo, generateNPC, genomeOf, looksLine, GENDERS, PRONOUNS, TRAIT_AXES } from "../npc/cradle.js";
import { file as gdbFile } from "../corp/gdb.js";
import { childFamily, nameRng } from "../world/names.js";
import { breed, packGenome, fingerprint, genomeTraits, genomeIdentity, genomePulse, genomeTells, skillAptitude, SPACER, kinship } from "../genome/spacer.js";
import { heritageFor, applyHeritage, heritageLine, startingLetter } from "./heritage.js";
import { COMPLEXES } from "../careers/complexes.js";
import { comeOfAge } from "./children.js";
import { carryPregnancyAshore } from "../station/stationlife.js";
import { line as voiceLine, wrap as voiceWrap } from "./voice.js";
import { company, hasCompany, settleAsStaff, payOffAndRecord } from "../corp/company.js";
import { logEvent, sim } from "../sim/sim.js";
import { pilot } from "../flight/pilot.js";
import { RACES } from "./races.js";
import { stationById } from "../station/stations.js";

export const social = {
  gender: "man",
  attractedTo: ["woman"],
  romance: "all",
  family: true,
  adult: false,
  contraception: true,
  name: "",
};
const SAVE_KEY = "lgaa-social";
let loaded = false;
export function loadSocial() {
  if (loaded) return;
  loaded = true;
  try { const raw = globalThis.localStorage?.getItem(SAVE_KEY); if (raw) Object.assign(social, JSON.parse(raw)); } catch {}
}
function saveSocial() {
  try { globalThis.localStorage?.setItem(SAVE_KEY, JSON.stringify(social)); } catch {}
}
export function setSocial(patch) {
  loadSocial();
  Object.assign(social, patch);
  if (!GENDERS.includes(social.gender)) social.gender = "nonbinary";
  social.attractedTo = (social.attractedTo ?? []).filter((g) => GENDERS.includes(g));
  social.adult = Boolean(social.adult);
  social.contraception = Boolean(social.contraception);
  if (social.romance === "off") social.adult = false;
  saveSocial();
  return social;
}
export const playerPronouns = () => PRONOUNS[social.gender] ?? PRONOUNS.nonbinary;
export function playerAsPerson() {
  loadSocial();
  return { id: "player", name: social.name || pilot.name || "the captain", gender: social.gender, pronouns: playerPronouns(), attractedTo: social.attractedTo, raceId: pilot.raceId ?? "terran", traits: { grit: 0.6, caution: 0.5, greed: 0.4, loyalty: 0.6, curiosity: 0.6 }, morale: 70 };
}

export const household = {
  children: [],
  pregnancies: [],
  bonds: {},
  log: [],
};
const PREGNANCY_CYCLES = 6;
const ADULT_CYCLES = 24;
const CONCEIVE_CHANCE = 0.05;

export function note(msg) {
  household.log.unshift({ t: Date.now(), msg });
  household.log.length = Math.min(household.log.length, 30);
  crew.log.unshift({ t: Date.now(), msg });
  crew.log.length = Math.min(crew.log.length, 30);
}

export function berthsUsed() {
  return crew.aboard.length + Math.ceil(household.children.length / 2);
}
export function overBerths(capacity) {
  return berthsUsed() > capacity;
}

export function personById(id) {
  if (id === "player") return playerAsPerson();
  return crew.aboard.find((m) => m.id === id) ?? null;
}

export function canConceive(a, b) {
  if (!a || !b || a.id === b.id) return false;
  const role = (p) => {
    if (p.synthetic) return null;
    if (p.gender === "woman") return "carry";
    if (p.gender === "man") return "sire";
    const rec = cradle.get(p.id);
    const seed = String(rec?.seed ?? p.id ?? "x");
    let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return h % 2 ? "carry" : "sire";
  };
  const ra = role(a), rb = role(b);
  return Boolean(ra && rb && ra !== rb);
}

function partnerOf(m) {
  return m.partner ? personById(m.partner) : null;
}

function genomeForParent(p) {
  if (!p) return null;
  const rec = cradle.get(p.id);
  if (rec) return genomeOf(rec);
  const stand = generateNPC(`parent:${p.id}:${p.raceId ?? "terran"}`, { raceId: p.raceId ?? "terran" });
  return genomeOf(stand);
}

export function conceive(carrier, sire) {
  const seed = `${carrier.id}:${sire.id}:${sim.time.toFixed(0)}:${household.children.length}`;
  const raceId = (seed.length % 2 ? carrier : sire).raceId ?? carrier.raceId;
  const gA = genomeForParent(carrier), gB = genomeForParent(sire);
  const genome = gA && gB ? breed(gA, gB, seed, SPACER) : null;
  const child = generateNPC(`child:${seed}`, { raceId, letter: "F", genome: genome ?? undefined, parents: [carrier.id, sire.id], newborn: true });
  child.parents = [carrier.id, sire.id];
  child.status = "child";
  child.age = 0;
  child.title = "Child";
  child.complexName = "—";
  child.letter = "—";
  if (genome) {
    child.genome = packGenome(genome, SPACER);
    child.genomeType = SPACER;
    child.fingerprint = fingerprint(genome, SPACER);
    child.traits = genomeTraits(genome);
    child.aptitude = skillAptitude(genome);
    child.tells = genomeTells(genome);
    child.pulse = genomePulse(genome);
    const ident = genomeIdentity(genome);
    child.gender = ident.gender;
    child.pronouns = PRONOUNS[ident.gender];
    child.attractedTo = ident.attractedTo;
    child.kinship = { toCarrier: Math.round(kinship(genome, gA) * 100) / 100, toSire: Math.round(kinship(genome, gB) * 100) / 100 };
  } else {
    const t = {};
    for (const a of TRAIT_AXES) {
      const pa = carrier.traits?.[a] ?? 0.5, pb = sire.traits?.[a] ?? 0.5;
      t[a] = Math.round(Math.max(0, Math.min(1, (pa + pb) / 2 + ((child.traits?.[a] ?? 0.5) - 0.5) * 0.4)) * 100) / 100;
    }
    child.traits = t;
  }
  const heritage = heritageFor(carrier, sire, { aptitude: child.aptitude ?? skillAptitude(genome ?? genomeOf(child)), seed });
  if (heritage) applyHeritage(child, heritage);

  const surname = childFamily(sire, carrier, child.gender, child.raceId ?? raceId, nameRng(`name:${seed}`));
  child.name = surname ? `${child.name.split(" ")[0]} ${surname}` : child.name.split(" ")[0];
  gdbFile(child, { kind: "born", group: [carrier, sire, ...crew.aboard, ...household.children] });
  cradle.note(child.id, `Born aboard ${crew.employer ?? "a ship"} to ${carrier.name} and ${sire.name}`);
  const look = looksLine(child);
  if (look) cradle.note(child.id, `On the record at birth: ${look}`);
  if (heritage) cradle.note(child.id, heritageLine(child));
  return child;
}

export function tickHousehold() {
  loadSocial();
  for (const p of [...household.pregnancies]) {
    p.cycles++;
    const carrier = personById(p.carrier);
    const sire = personById(p.sire) ?? { id: p.sire, name: p.sireName, raceId: p.sireRace, traits: {} };
    if (!carrier) { household.pregnancies.splice(household.pregnancies.indexOf(p), 1); continue; }
    if (p.cycles >= PREGNANCY_CYCLES) {
      household.pregnancies.splice(household.pregnancies.indexOf(p), 1);
      if (p.twins) {
        const twin = conceive(carrier, sire);
        household.children.push({ id: twin.id, name: twin.name, age: 0, parents: twin.parents, raceId: twin.raceId, gender: twin.gender, pronouns: twin.pronouns, traits: twin.traits });
        note(`${twin.name} was the first of two.`);
      }
      const child = conceive(carrier, sire);
      household.children.push({ id: child.id, name: child.name, age: 0, parents: child.parents, raceId: child.raceId, gender: child.gender, pronouns: child.pronouns, traits: child.traits });
      for (const q of [carrier, sire]) if (q.morale != null) q.morale = Math.min(100, q.morale + 10);
      note(`${child.name} was born aboard — ${carrier.name} and ${sire.name}'s. ${berthsRoom()}`);
      logEvent(`${child.name} born aboard to ${carrier.name} and ${sire.name}`, "crew");
      if (carrier.id !== "player") { const rec = cradle.get(carrier.id); if (rec) cradle.note(rec.id, `Had ${child.name} aboard ${crew.employer ?? "a ship"}`); }
      if (sire.id !== "player") { const rec = cradle.get(sire.id); if (rec) cradle.note(rec.id, `${child.name} born — ${sire.pronouns?.pos ?? "their"} child with ${carrier.name}`); }
    }
  }
  for (const c of [...household.children]) {
    c.age++;
    if (c.age >= ADULT_CYCLES) {
      const rec = cradle.get(c.id);
      if (rec) {
        rec.status = "pool"; rec.age = c.age; rec.ageCycles = 200;
        const h = rec.heritage;
        rec.letter = h ? startingLetter(h) : "F";
        const cx = h ? COMPLEXES[h.complexId] : null;
        rec.title = cx?.ranks?.find((r) => r.letter === rec.letter)?.title ?? "Hand"; cradle.note(rec.id, `Came of age aboard ${crew.employer ?? "a ship"} — looking for a berth of ${rec.pronouns?.pos ?? "their"} own`); }
      const raised = comeOfAge(c);
      household.children.splice(household.children.indexOf(c), 1);
      if (raised?.welcome) {
        note(`${c.name} is grown — and says the berth they want is this one. The halls will list ${c.pronouns?.obj ?? "them"}, but ${c.pronouns?.subj ?? "they"} would sign here on a word.`);
        logEvent(`${c.name} came of age aboard — raised by you`, "crew");
      } else note(`${c.name} is grown. ${c.pronouns?.subj === "they" ? "They have" : `${c.pronouns?.subj[0].toUpperCase()}${c.pronouns?.subj.slice(1)} has`} gone to find a berth — the halls will have ${c.pronouns?.obj ?? "them"}.`);
    }
  }
  if (!social.family || social.adult) return;
  const seen = new Set();
  const pairs = [];
  for (const m of crew.aboard) {
    if (!m.partner || seen.has(m.id) || m.robot) continue;
    const p = partnerOf(m);
    if (!p || p.robot) continue;
    seen.add(m.id); seen.add(p.id);
    pairs.push([m, p]);
  }
  for (const [a, b] of pairs) {
    if (household.pregnancies.some((p) => p.carrier === a.id || p.carrier === b.id)) continue;
    if ((a.morale ?? 70) < 55 || (b.morale ?? 70) < 55) continue;
    if (!canConceive(a, b)) continue;
    const roll = hashRoll(`${a.id}:${b.id}:${a.cyclesAboard ?? 0}:${sim.time.toFixed(0)}`);
    if (roll < CONCEIVE_CHANCE) {
      const carrier = a.gender === "woman" || (a.gender === "nonbinary" && b.gender !== "woman") ? a : b;
      const sire = carrier === a ? b : a;
      household.pregnancies.push({ carrier: carrier.id, sire: sire.id, sireName: sire.name, sireRace: sire.raceId, cycles: 0, due: PREGNANCY_CYCLES });
      note(`${carrier.name} is expecting — ${sire.id === "player" ? "yours" : `${sire.name}'s`}. Six cycles.`);
      logEvent(`${carrier.name} is expecting a child with ${sire.name}`, "crew");
      if (carrier.id !== "player") { const rec = cradle.get(carrier.id); if (rec) cradle.note(rec.id, `Expecting, with ${sire.name}`); }
    }
  }
}

function hashRoll(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

function berthsRoom() {
  const cap = sim.crewCapacity ?? 2;
  return overBerths(cap) ? `The hull is over its berths (${berthsUsed()}/${cap}) — settle a family at a port.` : `Berths ${berthsUsed()}/${cap}.`;
}

export function familyOf(m) {
  const kids = household.children.filter((c) => c.parents?.includes(m.id));
  const partner = m.partner && m.partner !== "player" ? crew.aboard.find((x) => x.id === m.partner) : null;
  return { partner, children: kids };
}

export function settleFamily(id, mode = "staff") {
  const m = crew.aboard.find((x) => x.id === id);
  if (!m) return "Not aboard";
  const st = stationById(sim.ship.dockedAt);
  if (!st) return "Dock at a port first";
  const fam = familyOf(m);
  const going = [m, ...(fam.partner ? [fam.partner] : [])];
  const kids = fam.children;
  const family = [...(fam.partner ? [fam.partner] : []), ...kids];
  const err = mode === "staff" ? settleAsStaff(m, family, st) : payOffAndRecord(m, family, mode === "payoff" ? "paid off and released" : "settled", st);
  if (err) return err;
  for (const g of going) {
    const i = crew.aboard.indexOf(g);
    if (i >= 0) crew.aboard.splice(i, 1);
    if (g.partner === "player") g.partner = null;
    const rec = cradle.get(g.id);
    if (rec) { rec.station = st.id; }
  }
  for (const k of kids) {
    const i = household.children.indexOf(k);
    if (i >= 0) household.children.splice(i, 1);
    const rec = cradle.get(k.id);
    if (rec) { rec.status = "dependant"; rec.station = st.id; cradle.put(rec); }
  }
  for (const p of [...household.pregnancies]) {
    if (!going.some((g) => g.id === p.carrier)) continue;
    household.pregnancies.splice(household.pregnancies.indexOf(p), 1);
    if (mode === "staff") {
      const msg = carryPregnancyAshore(p.carrier, p.sire, Math.max(1, (p.due ?? 6) - (p.cycles ?? 0)), st.id);
      if (msg) note(msg);
    }
  }
  const who = going.map((g) => g.name).join(" and ");
  note(mode === "staff"
    ? `${who}${kids.length ? ` and ${kids.length} ${kids.length === 1 ? "child" : "children"}` : ""} settled at ${st.name} — on ${company.name}'s books.`
    : `${who}${kids.length ? ` and ${kids.length} ${kids.length === 1 ? "child" : "children"}` : ""} paid off at ${st.name}. Address kept.`);
  return null;
}

const first = (m) => m.name.split(" ")[0];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

export function trustOf(m) { return m.trust ?? 40; }
export function adjustTrust(m, d) { m.trust = Math.max(0, Math.min(100, trustOf(m) + d)); return m.trust; }
export function adjustMorale(m, d) { if (m.robot) return m.morale; m.morale = Math.max(1, Math.min(100, (m.morale ?? 70) + d)); return m.morale; }
export const bumpTrust = adjustTrust;
export const bumpMorale = adjustMorale;

export function pairWithPlayer(m) {
  if (!m || m.robot) return { ok: false, why: "not somebody you can" };
  const can = couldCourt(m);
  if (!can.ok) return can;
  m.partner = "player";
  bumpMorale(m, 10);
  bumpTrust(m, 10);
  const rec = cradle.get(m.id);
  if (rec) { rec.partner = "player"; cradle.put(rec); cradle.note(rec.id, `Together with ${playerAsPerson().name}, the captain`); }
  note(`${m.name} and the captain have been taking the same mess shift. It's official aboard.`);
  return { ok: true };
}

export function couldCourt(m) {
  loadSocial();
  if (m.robot) return { ok: false, why: "it is a machine" };
  if (social.romance !== "all") return { ok: false, why: "romance is set to crew-only" };
  if (m.partner) return { ok: false, why: `${first(m)} is with someone` };
  const me = playerAsPerson();
  if (!drawnTo(m, me)) return { ok: false, why: `${first(m)} is not drawn to ${me.gender === "nonbinary" ? "people like you" : `${me.gender === "woman" ? "women" : "men"}`}` };
  if (!drawnTo(me, m)) return { ok: false, why: `you are not drawn to ${m.gender === "nonbinary" ? "them" : `${m.gender === "woman" ? "women" : "men"}`}` };
  if (trustOf(m) < 55) return { ok: false, why: "not yet — earn more of their trust" };
  return { ok: true };
}

export function crewTopics(m, ctx = {}) {
  loadSocial();
  const f = first(m);
  const t = m.traits ?? {};
  const pr = m.pronouns ?? PRONOUNS.nonbinary;
  const fam = familyOf(m);
  const partner = partnerOf(m);
  const docked = Boolean(sim.ship.dockedAt);
  const topics = [];

  topics.push({ id: "watch", label: "How's the watch?", run: () => {
    if ((m.morale ?? 70) >= 70) return `${f}: "Quiet. Pay's on time. I'd sail with this crew again."`;
    if ((m.morale ?? 70) >= 40) return `${f}: "Holding. The mess could use a cook."`;
    return `${f}: "You want the honest answer? People are talking about the payroll."`;
  } });

  topics.push({ id: "about", label: "Tell me about yourself", run: () => {
    const rec = cradle.get(m.id);
    const race = RACES.find((r) => r.id === m.raceId)?.name ?? "";
    const drawn = !m.attractedTo?.length ? "I don't go in for any of that" : m.attractedTo.length === 3 ? "anyone who's kind, honestly" : m.attractedTo.map((g) => g === "woman" ? "women" : g === "man" ? "men" : "people outside all that").join(" and ");
    bumpTrust(m, 2);
    return `${f}: "${race ? `${race}, ` : ""}${rec?.origin ? `from ${rec.origin}. ` : ""}${cap(pr.subj)}/${pr.obj}, if you're asking. I'm drawn to ${drawn}. ${voiceLine("about", `${m.id}:about:${Math.round(sim.time ?? 0)}`)}"`;
  } });

  topics.push({ id: "praise", label: "Good work out there", run: () => {
    if (t.greed > 0.7) { bumpTrust(m, 1); bumpMorale(m, 2); return `${voiceWrap(f, voiceLine("praise_ok", `${m.id}:p:${Math.round(sim.time ?? 0)}`))} (${pr.subj} means it)`; }
    bumpTrust(m, 4); bumpMorale(m, 5);
    return `${voiceWrap(f, voiceLine("praise_ok", `${m.id}:p2:${Math.round(sim.time ?? 0)}`))} (trust up)`;
  } });

  topics.push({ id: "bonus", label: "Bonus — 100 cr", run: () => {
    if (sim.ship.credits < 100) return `${f}: "…with what, captain?"`;
    sim.ship.credits -= 100;
    bumpTrust(m, 6); bumpMorale(m, 8);
    logEvent(`Bonus of 100 cr to ${m.name}`, "crew");
    return `${voiceWrap(f, voiceLine("wage_yes", `${m.id}:bon:${Math.round(sim.time ?? 0)}`))} (trust and morale up)`;
  } });

  topics.push({ id: "chew", label: "Sharpen up", cls: "danger", run: () => {
    if (t.grit > 0.6) { bumpTrust(m, -2); bumpMorale(m, -3); return `${voiceWrap(f, voiceLine("chew", `${m.id}:c1:${Math.round(sim.time ?? 0)}`))} (${pr.subj} takes it square)`; }
    bumpTrust(m, -8); bumpMorale(m, -10);
    if (partner && partner.id !== "player") bumpMorale(partner, -4);
    return `${voiceWrap(f, voiceLine("chew", `${m.id}:c2:${Math.round(sim.time ?? 0)}`))} (${pr.subj} goes quiet${partner && partner.id !== "player" ? `; ${first(partner)} noticed` : ""})`;
  } });

  if (partner) {
    topics.push({ id: "partner", label: `About ${partner.id === "player" ? "us" : first(partner)}`, run: () => {
      if (partner.id === "player") return `${f}: "${t.caution > 0.6 ? "I keep it off the deck. Doesn't mean it isn't there." : "You know where I sleep, captain."}"`;
      const r = rapportBetween(m, partner);
      return `${f}: "${first(partner)}? ${r > 80 ? `${cap(partner.pronouns?.subj ?? "they")}'s the reason I stay.` : "We're good. Mostly."}${fam.children.length ? ` The kid${fam.children.length > 1 ? "s" : ""} keep us honest.` : ""}"`;
    } });
  }
  if (fam.children.length) {
    topics.push({ id: "kids", label: "The children", run: () => {
      const k = fam.children.map((c) => `${c.name.split(" ")[0]} (${c.age} cycles)`).join(", ");
      return `${f}: "${k}. ${overBerths(sim.crewCapacity ?? 2) ? "We're stacked three to a berth, captain. They need a deck that doesn't move." : "Growing faster than the hull."}"`;
    } });
  }
  const preg = household.pregnancies.find((p) => p.carrier === m.id);
  if (preg) topics.push({ id: "expecting", label: "How are you feeling?", run: () => `${f}: "${preg.due - preg.cycles} cycles to go. ${t.caution > 0.6 ? "I'd take a quiet run, if you're offering." : "Don't fuss."}"` });

  if (!partner) {
    const c = couldCourt(m);
    topics.push({ id: "court", label: "Ask them to dinner", cls: c.ok ? "accent" : "", run: () => {
      if (!c.ok) {
        bumpTrust(m, social.romance === "all" ? -1 : 0);
        return social.romance !== "all" ? `(Romance with the crew is switched off in HOUSE.)` : voiceWrap(f, voiceLine("court_block", `${m.id}:nob:${c.why}`, "That's kind. No."));
      }
      const roll = hashRoll(`${m.id}:court:${sim.time.toFixed(0)}`);
      if (roll < 0.35 + trustOf(m) / 200) {
        pairWithPlayer(m);
        return `${voiceWrap(f, voiceLine("court_yes", `${m.id}:yes:${Math.round(sim.time ?? 0)}`, "Yes."))} (${pr.subj} doesn't look away)`;
      }
      bumpTrust(m, -3);
      return `${voiceWrap(f, voiceLine("court_no", `${m.id}:no:${Math.round(sim.time ?? 0)}`, "Not tonight."))} (${pr.subj} doesn't close the door on it)`;
    } });
  } else if (partner.id === "player") {
    topics.push({ id: "breakup", label: "End it", cls: "danger", run: () => {
      m.partner = null; bumpMorale(m, -20); bumpTrust(m, -15);
      const rec = cradle.get(m.id); if (rec) { rec.partner = null; cradle.note(rec.id, "The captain ended it"); }
      note(`${m.name} and the captain have called it off. The mess is quiet.`);
      return `${f}: "Understood." (${pr.subj} leaves the room)`;
    } });
  }

  if (docked) {
    topics.push({ id: "leave", label: "Shore leave — 60 cr", run: () => {
      if (sim.ship.credits < 60) return `${f}: "Leave's cheap, captain. Not free."`;
      sim.ship.credits -= 60; bumpMorale(m, 12); bumpTrust(m, 2);
      return `${f}: "Back by the next watch." (morale up)`;
    } });
    topics.push({ id: "settleStaff", label: hasCompany() ? `Settle here — ${company.name} staff` : "Settle here (needs a company)", cls: hasCompany() ? "accent" : "", run: () => {
      const e = settleFamily(m.id, "staff");
      return e ? `(${e})` : `${f}: "A deck that doesn't move. We'll keep the books straight for you." (settled — passive income to ${company.name})`;
    } });
    topics.push({ id: "settlePay", label: "Pay off and release", cls: "danger", run: () => {
      const e = settleFamily(m.id, "payoff");
      return e ? `(${e})` : `${f}: "No hard feelings, captain. You know where to find us." (paid off — address kept)`;
    } });
  }
  return topics;
}

export function greetLine(m) {
  const f = first(m);
  const t = m.traits ?? {};
  const seed = `${m.id}:greet:${Math.round((sim.time ?? 0) / 90)}`;
  if (m.robot) return `${f}: "Captain. Unit ${m.designation ?? m.id} at ${Math.round(m.condition ?? 100)}% condition. Awaiting directive."`;
  if ((m.morale ?? 70) < 35) return `${voiceWrap(f, voiceLine("greet_low", seed, "Captain."))} (does not look up)`;
  if (m.partner === "player") return voiceWrap(f, voiceLine("greet_partner", seed, "Captain."));
  if (trustOf(m) >= 75) return voiceWrap(f, voiceLine("greet_trust", seed, "Captain. Say the word."));
  const bag = t.curiosity > 0.7 ? "greet_curiosity" : t.grit > 0.7 ? "greet_grit" : t.caution > 0.7 ? "greet_caution"
    : t.greed > 0.7 ? "greet_greed" : t.loyalty > 0.7 ? "greet_loyalty" : "greet_base";
  return voiceWrap(f, voiceLine(bag, seed, "Captain."));
}

crewHooks.onCycle = tickHousehold;

export function resetHousehold() {
  household.children.length = 0;
  household.pregnancies.length = 0;
  household.log.length = 0;
}

export function wireFamily() {
  if (globalThis.window?.__lg) window.__lg.family = { social, setSocial, household, crewTopics, couldCourt, settleFamily, familyOf, tickHousehold, canConceive, berthsUsed, overBerths };
}
