/* LIVING GALAXY — the children.
 *
 * A child has had a real crossover genome earlier: `breed()` in
 * genome/spacer.js crosses both parents, and heritage.js teaches them the
 * house trade. What was missing is that none of it was ever SHOWN. A child was
 * a name and an age on the bonds tab; you could not see what they had got from
 * whom, whether it was a gift or a burden, and you could not do anything with
 * them for the forty-eight cycles before they came of age and walked off.
 *
 * So, three things:
 *
 *   inheritance(child) — what they got, named, measured against the parents
 *                        they got it from, as boons and flaws
 *   childActs(child)   — what a captain can do about it
 *   raise(child, act)  — doing it, which moves their ledger and their skills
 *
 * The measurement is the honest part: a boon is not "the genome rolled high",
 * it is "this is better than BOTH the people it came from", which is the only
 * comparison a parent would actually make.
 */

import { cradle, genomeOf } from "../npc/cradle.js";
import { skillAptitude, genomeTraits, kinship } from "../genome/spacer.js";
import { household, personById, note } from "../family.js";
import { crew, firstName } from "../crew.js";
import { logEvent, sim } from "../sim.js";
import { COMPLEXES } from "../careers/complexes.js";
import { line as V, wrap as voiceWrap } from "./voice.js";

/* How far above or below both parents a reading has to be before it is worth
 * a word. Below this it is just a number. */
const BOON = 0.07;

const APT_LABEL = {
  piloting: "a pilot's hands", navigation: "a head for the lane", engineering: "an engineer's ear",
  mining: "a driller's patience", security: "a steady trigger", medicine: "a medic's calm",
  commerce: "a trader's nose", dataOps: "a data hand", lifeSupport: "a careful breath",
  salvage: "a salvager's eye", hazardOps: "a hard head for hazard", energySystems: "a feel for the bus",
  science: "a scientist's doubt", agriculture: "a grower's hands", fabrication: "a fabricator's eye",
  command: "the deck presence to be listened to",
};

const TRAIT_LABEL = {
  grit: ["takes a knock without blinking", "flinches, and knows it"],
  caution: ["checks the seal twice", "will walk into it to see what happens"],
  greed: ["counts what is owed", "does not think about the number"],
  loyalty: ["stays", "keeps one eye on the hatch"],
  curiosity: ["wants to know what is past it", "content with the deck in front of them"],
};

function parentsOf(child) {
  /* the ledger first: a crew member object carries a name and a mood, the
   * CRADLE record carries the genome, and the genome is the whole question */
  return (child?.parents ?? []).map((id) => (id === "player" ? null : cradle.get(id) ?? personById(id))).filter(Boolean);
}

/**
 * What this child got, and from whom.
 *
 * Returns { boons, flaws, shares, kin, complex } — `shares` is how much of
 * each parent is measurably in them, which is the thing people actually want
 * to know and which kinship() can answer honestly.
 */
export function inheritance(child) {
  const rec = cradle.get(child?.id) ?? child;
  const g = genomeOf(rec);
  if (!g) return { boons: [], flaws: [], shares: [], kin: [], complex: null, apt: {} };
  const apt = rec.aptitude ?? skillAptitude(g);
  const traits = rec.traits ?? genomeTraits(g);
  const parents = parentsOf(child);
  const pApt = parents.map((p) => {
    const pg = genomeOf(p);
    return pg ? (p.aptitude ?? skillAptitude(pg)) : null;
  }).filter(Boolean);

  const boons = [], flaws = [];
  for (const [k, v] of Object.entries(apt)) {
    if (!APT_LABEL[k]) continue;
    if (!pApt.length) continue;
    const best = Math.max(...pApt.map((a) => a[k] ?? 0.5));
    const worst = Math.min(...pApt.map((a) => a[k] ?? 0.5));
    if (v >= best + BOON) boons.push({ kind: "apt", key: k, label: APT_LABEL[k], delta: v - best, value: v, note: `better at this than either of them (${Math.round((v - best) * 100)} over the best of the two)` });
    else if (v <= worst - BOON) flaws.push({ kind: "apt", key: k, label: APT_LABEL[k], delta: v - worst, value: v, note: `weaker here than either of them (${Math.round((worst - v) * 100)} under the worse of the two)` });
  }
  for (const [k, pair] of Object.entries(TRAIT_LABEL)) {
    const v = traits[k] ?? 0.5;
    if (v > 0.70) boons.push({ kind: "trait", key: k, label: pair[0], value: v, note: "how they are, not what they were taught" });
    else if (v < 0.32) flaws.push({ kind: "trait", key: k, label: pair[1], value: v, note: "how they are, not what they were taught" });
  }
  boons.sort((a, b) => (b.delta ?? b.value) - (a.delta ?? a.value));
  flaws.sort((a, b) => (a.delta ?? -a.value) - (b.delta ?? -b.value));

  const shares = parents.map((p) => {
    const pg = genomeOf(p);
    return { id: p.id, name: p.name, share: pg ? Math.round(kinship(g, pg) * 100) : null };
  });
  const kin = [];
  for (const o of [...crew.aboard, ...household.children]) {
    if (!o || o.id === child.id) continue;
    const og = genomeOf(cradle.get(o.id) ?? o);
    if (!og) continue;
    const r = kinship(g, og);
    if (r >= 0.12) kin.push({ id: o.id, name: o.name, r: Math.round(r * 100) / 100 });
  }
  kin.sort((a, b) => b.r - a.r);

  const h = rec.heritage;
  return {
    boons: boons.slice(0, 5), flaws: flaws.slice(0, 4), shares, kin: kin.slice(0, 6), apt,
    complex: h ? { id: h.complexId, name: (COMPLEXES[h.complexId]?.name ?? h.complexId).replace(/ Complex$/, ""), generation: h.generation ?? 1, learn: h.learn ?? 1 } : null,
  };
}

/* ---- raising them ----------------------------------------------------------
 *
 * Forty-eight cycles is a long time to watch a name tick up. These are the
 * four things a captain on a working ship can actually do, and each one bends
 * something real: the child's bond with you, which follows them into the
 * hiring hall, and what they will be good at when they get there.
 */
export const CHILD_ACTS = [
  { id: "time", label: "Spend the watch with them", bond: 5, apt: null, why: "somebody being there is most of it" },
  { id: "teach", label: "Teach them the trade", bond: 2, apt: "house", why: "the house trade, hands-on, years early" },
  { id: "books", label: "Put them on the terminal", bond: 1, apt: "dataOps", why: "reading, charts, and the ledger" },
  { id: "deck", label: "Let them shadow a watch", bond: 3, apt: "piloting", why: "a child on the bridge learns the bridge" },
];

const bondKey = (id) => `bond:${id}`;

export function bondWith(child) {
  return Math.max(0, Math.min(100, household.bonds?.[bondKey(child?.id)] ?? 0));
}

/**
 * Do one of them. Returns { ok, line, tag } the way a beat does, so the panel
 * can render it with the same shape it already knows.
 */
export function raise(child, actId) {
  const act = CHILD_ACTS.find((a) => a.id === actId);
  const rec = cradle.get(child?.id);
  if (!act || !rec) return { ok: false, line: "Not somebody on the books.", tag: "" };
  household.bonds ??= {};
  const was = bondWith(child);
  household.bonds[bondKey(child.id)] = Math.min(100, was + act.bond);

  let taught = null;
  if (act.apt) {
    const h = rec.heritage;
    const key = act.apt === "house" ? (COMPLEXES[h?.complexId]?.primarySkills ?? [])[0] : act.apt;
    if (key) {
      rec.skills ??= {};
      /* capped by what the body can carry: teaching does not beat aptitude,
       * it just gets there sooner — the same rule heritage.js uses */
      const ceiling = Math.round(28 + (rec.aptitude?.[key] ?? 0.5) * 42);
      const before = rec.skills[key] ?? 0;
      rec.skills[key] = Math.min(ceiling, before + 2);
      taught = rec.skills[key] > before ? key : null;
    }
  }
  cradle.put(rec);
  const seed = `${child.id}:raise:${actId}:${Math.round(sim.time ?? 0)}`;
  const f = firstName(child);
  const line = voiceWrap(f, V(bondWith(child) > 55 ? "greet_trust" : "greet_base", seed, "…"));
  const bits = [`+${act.bond} bond`];
  if (taught) bits.push(`+2 ${taught}`);
  if (was < 40 && bondWith(child) >= 40) {
    note(`${child.name} has started waiting by the hatch when your watch ends.`);
    logEvent(`${child.name} looks for you now`, "crew");
  }
  return { ok: true, line, tag: bits.join(" · "), bond: bondWith(child) };
}

/**
 * What a grown child carries out of the door.
 *
 * Called by family.js when they come of age. A child who was raised — time
 * spent, trade taught — leaves with the captain's name on their record and a
 * standing offer; one who was not is a stranger in a hall like anyone else.
 */
export function comeOfAge(child) {
  const rec = cradle.get(child?.id);
  if (!rec) return null;
  const bond = bondWith(child);

  /* The boons and flaws stop being a description and start being a number.
   * An aptitude that beat both parents is worth a head start in that skill
   * when they walk into a hall; one that came in under both is a gap they
   * will have to work out of. The heritage cap still applies — a gift gets
   * you there sooner, it does not get you past what the body can carry. */
  const inh = inheritance(child);
  rec.skills ??= {};
  const marks = [];
  for (const b of inh.boons) {
    if (b.kind !== "apt") { marks.push({ kind: "trait", label: b.label, good: true }); continue; }
    const ceiling = Math.round(28 + (rec.aptitude?.[b.key] ?? 0.5) * 42);
    rec.skills[b.key] = Math.min(ceiling, (rec.skills[b.key] ?? 0) + 4);
    marks.push({ kind: "apt", key: b.key, label: b.label, good: true, delta: 4 });
  }
  for (const f of inh.flaws) {
    if (f.kind !== "apt") { marks.push({ kind: "trait", label: f.label, good: false }); continue; }
    rec.skills[f.key] = Math.max(0, (rec.skills[f.key] ?? 0) - 3);
    marks.push({ kind: "apt", key: f.key, label: f.label, good: false, delta: -3 });
  }
  rec.inherited = marks;
  if (marks.length) cradle.note(rec.id, `Carries ${marks.filter((m) => m.good).length} of the family's gifts and ${marks.filter((m) => !m.good).length} of its gaps`);
  rec.raisedBy = bond >= 25 ? (sim.callsign || "the captain") : null;
  rec.raisedBond = bond;
  if (bond >= 55) {
    cradle.note(rec.id, `Raised aboard ${crew.employer ?? "a ship"} by ${rec.raisedBy} — would sign again on a word`);
    return { welcome: true, bond };
  }
  if (bond >= 25) {
    cradle.note(rec.id, `Grew up aboard ${crew.employer ?? "a ship"} — remembers ${rec.raisedBy}`);
    return { welcome: false, bond };
  }
  return { welcome: false, bond };
}

/** Children currently aboard, with everything a panel needs. */
export function childrenAboard() {
  return household.children.map((c) => ({
    c,
    rec: cradle.get(c.id),
    bond: bondWith(c),
    parents: parentsOf(c).map((p) => p.name),
    inherit: inheritance(c),
  }));
}
