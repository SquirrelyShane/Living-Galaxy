/* Living Galaxy — CONSOLE › CREW: GENOME and LOG.
 *
 * Two views onto the part of a hand that was always there and never shown.
 *
 *   GENOME — the body on file: the fingerprint that follows them between
 *            skies, what you can see across a mess, what they were built to
 *            be good at, the nine needs they are carrying right now, and who
 *            aboard they are related to.
 *   LOG    — the decision record. Every watch, what they chose, how well they
 *            did it, the chain of reasoning that got them there, what else
 *            they nearly did instead, and what it cost. Exportable whole.
 *
 */

import { el, section, note, row, button, group, chips, setBar, card, pct } from "../kit.js";
import { crew, firstName, genderMark, relatedTo } from "../../crew.js";
import { sim } from "../../sim.js";
import { cradle, looksLine } from "../../npc/cradle.js";
import { kinLabel, KIN_BLOCK } from "../../genome/spacer.js";
import { bodyOf, needsOf, buildContext } from "../../crew/deckmind.js";
import { NEED_KEYS } from "../../crew/deckacts.js";
import { journal, exportJournals, habitsOf } from "../../crew/journal.js";
import { habitsLearned, learnedLine, confidenceOf, trainingCorpus, DECK_KINDS } from "../../crew/learn.js";
import { heritageLine, learningBonus, houseSkills } from "../../crew/heritage.js";
import { SKILLS } from "../../careers/skills.js";

const view = { geneId: null, logId: null, logOpen: null, logAll: false };

const TRAIT_LABEL = { grit: "Grit", caution: "Caution", greed: "Greed", loyalty: "Loyalty", curiosity: "Curiosity" };
const NEED_LABEL = {
  fatigue: "Tiredness", hunger: "Hunger", social: "Company", stress: "Strain", intimacy: "Closeness",
  play: "Something to do", grievance: "Grievance", purpose: "Purpose", upkeep: "Work outstanding",
};
const NEED_TONE = (v) => (v > 0.8 ? "hot" : v > 0.55 ? "warn" : "ok");

function picker(sec, key, onPick) {
  if (!crew.aboard.some((m) => m.id === view[key])) view[key] = crew.aboard[0]?.id ?? null;
  const p = chips(crew.aboard.map((m) => ({ id: m.id, label: firstName(m), hint: m.title })),
    { value: view[key], onPick: (id) => { view[key] = id; onPick(); } });
  sec.append(p.row);
  return p;
}

const memberOf = (id) => crew.aboard.find((m) => m.id === id) ?? null;

/* The learned prior is situational, so it is read against the situation this
 * hand is actually in. Cheap enough to build on a repaint; guarded because a
 * member who has just left the deck has no context to build. */
function ctxOf(m) {
  try { return buildContext(m); } catch { return null; }
}

/* ---- GENOME -------------------------------------------------------------- */

export function mountGenome(root, ctx) {
  const sec = section("GENOME");
  if (!crew.aboard.length) { sec.append(el("div", "tempty", "No hands aboard. The ledger still has everyone you ever signed.")); root.append(sec); return; }
  note(sec, "The body on file. It came from a seed, it breeds true, and it followed them here.");
  const body = el("div");
  picker(sec, "geneId", () => { key = ""; paint(); });
  sec.append(body);
  root.append(sec);

  let key = "";
  const paint = () => {
    const m = memberOf(view.geneId);
    if (!m) { body.innerHTML = ""; return; }
    const b = bodyOf(m);
    const rec = cradle.get(m.id);
    const k = `${m.id}:${Math.round(m.morale ?? m.condition ?? 0)}:${Math.round((needsOf(m).fatigue ?? 0) * 20)}`;
    if (k === key) return;
    key = k;
    body.innerHTML = "";
    if (!b) { body.append(el("div", "tempty", "No genome on file for this hand.")); return; }

    /* — the body — */
    const id = card(m.name, `${`${rec?.complexName ?? m.complexName ?? ""} ${m.letter ?? ""}`.trim()}${genderMark(rec ?? m)}`);
    row(id.body, "Genome", { value: rec?.fingerprint ?? "—", hint: b.typeId === "synth" ? "synthetic frame" : "spacer" });
    row(id.body, "Looks", { value: "", hint: looksLine(rec ?? m) || "—" });
    row(id.body, "Origin", { value: "", hint: rec?.origin ?? "—" });
    row(id.body, "Resting pulse", { value: `${rec?.pulse ?? "—"} bpm` });
    const caps = Object.entries(b.caps.scores ?? {}).filter(([, v]) => v > 0.25).sort((a, x) => x[1] - a[1]).slice(0, 6);
    row(id.body, "Tier", { value: b.caps.tier, hint: caps.map(([c, v]) => `${c} ${pct(v)}`).join(" · ") });
    if (rec?.parents?.length) {
      const names = rec.parents.map((p) => cradle.get(p)?.name ?? p).join(" and ");
      row(id.body, "Born to", { value: "", hint: names });
    }
    body.append(id.card);

    /* — temperament — */
    const tr = section("TEMPERAMENT");
    note(tr, "Grown from the genes, not rolled. A child inherits these because they inherit what makes them.");
    for (const [axis, label] of Object.entries(TRAIT_LABEL)) {
      const v = b.traits[axis] ?? 0.5;
      const r = row(tr, label, { value: v.toFixed(2), bar: true });
      setBar(r.bar, v, "ok");
    }
    body.append(tr);

    /* — what they were built for — */
    const ap = section("APTITUDE");
    note(ap, "The ceiling the body sets. What they have actually learned is the paler number.");
    const top = Object.entries(b.apt).sort((a, x) => x[1] - a[1]).slice(0, 8);
    for (const [skill, v] of top) {
      const have = (m.skills?.[skill] ?? 0) / 100;
      const r = row(ap, SKILLS[skill]?.name ?? skill, { value: `${pct(v)} · learned ${pct(have)}`, bar: true });
      setBar(r.bar, v, v > 0.7 ? "ok" : v > 0.45 ? "warn" : "hot");
    }
    body.append(ap);

    /* — what they need — */
    const nd = section("CARRYING");
    note(nd, "Nine needs. They rise on their own and only come down when something is done about them.");
    const needs = needsOf(m);
    for (const n of NEED_KEYS) {
      const v = needs[n] ?? 0;
      const r = row(nd, NEED_LABEL[n] ?? n, { value: v.toFixed(2), bar: true });
      setBar(r.bar, v, NEED_TONE(v));
    }
    body.append(nd);

    /* — what the house gave them — */
    const h = rec?.heritage;
    if (h) {
      const hs = section("THE HOUSE");
      note(hs, heritageLine(rec));
      row(hs, "Line", { value: h.complexName, hint: h.secondName ? `${h.secondName} on the other side` : "both sides of the family" });
      row(hs, "Generation", { value: String(h.generation), hint: "how long the house has worked it" });
      row(hs, "Raised to it", { value: `×${(h.learn?.[houseSkills(rec)[0]] ?? 1).toFixed(2)}`, hint: "how fast the trade's skills go in" });
      if (h.parents?.some(Boolean)) row(hs, "Taught by", { value: "", hint: h.parents.filter(Boolean).join(" and ") });
      for (const [skill, v] of Object.entries(h.taught ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
        const r = row(hs, SKILLS[skill]?.name ?? skill, { value: `${v} from the cradle · ×${learningBonus(rec, skill).toFixed(2)}`, bar: true });
        setBar(r.bar, Math.min(1, v / 70), "ok");
      }
      body.append(hs);
    }

    /* — what they have worked out for themselves — */
    const lr = section("LEARNED");
    note(lr, "Not designed and not inherited: this is what their own filed watches have taught them pays.");
    const conf = confidenceOf(m);
    row(lr, "Settled", { value: pct(conf), hint: conf < 0.1 ? "too new to have learned anything yet" : "how much of a life there is behind this" });
    if (conf >= 0.1) {
      note(lr, learnedLine(m));
      const learned = habitsLearned(m, ctxOf(m)).slice(0, 5);
      for (const h of learned) {
        const r = row(lr, h.kind, { value: h.p.toFixed(3), bar: true });
        setBar(r.bar, Math.min(1, h.p * DECK_KINDS.length / 2), h.p * DECK_KINDS.length > 1.15 ? "ok" : h.p * DECK_KINDS.length < 0.85 ? "hot" : "warn");
      }
    }
    body.append(lr);

    /* — kin — */
    const kin = section("KIN ABOARD");
    let any = false;
    for (const o of crew.aboard) {
      if (o.id === m.id || o.robot) continue;
      const rel = relatedTo(m, o);
      if (rel < 0.05) continue;
      any = true;
      row(kin, o.name, { value: rel.toFixed(2), hint: `${kinLabel(rel)}${rel >= KIN_BLOCK ? " · will not pair off" : ""}` });
    }
    if (!any) note(kin, "Nobody aboard is blood.");
    body.append(kin);

    /* — the string itself — */
    const raw = section("ON THE RECORD");
    note(raw, "The packed genome, as CRADLE stores it. Same string on every device, and it decodes the same person.");
    const pre = el("div", "tmono", rec?.genome ?? "—");
    pre.style.wordBreak = "break-all";
    raw.append(pre);
    body.append(raw);
  };
  ctx.push(paint);
}

/* ---- LOG ----------------------------------------------------------------- */

function recordCard(r) {
  const c = card(`C${r.cycle} · ${r.action.label}`, `${r.observedSurroundings.room}${r.action.targetName ? ` · ${r.action.targetName}` : ""}`);
  c.card.classList.add("tlogcard");
  const eff = row(c.body, "How well", { value: r.action.efficacy.toFixed(2), bar: true, hint: r.action.blocked ? `blocked — ${r.action.blockedReason}` : r.action.kind });
  setBar(eff.bar, r.action.efficacy, r.action.efficacy > 0.6 ? "ok" : r.action.efficacy > 0.35 ? "warn" : "hot");
  row(c.body, "Driven by", { value: r.observedSelf.dominantDrive, hint: r.observedSelf.limitingFactor ? `limited by: ${r.observedSelf.limitingFactor}` : `${r.observedSelf.phase} · ${r.observedSelf.tier}` });

  const why = el("div", "twhy");
  why.append(el("div", "tlabel", "WHY"));
  const ol = el("ol", "treason");
  for (const line of r.whatMadeMeActThis.reasoning) ol.append(el("li", null, line));
  why.append(ol);
  why.append(el("div", "tpath", r.whatMadeMeActThis.path.join(" › ")));
  c.body.append(why);

  const alts = r.whatMadeMeActThis.alternativesConsidered;
  if (alts.length > 1) {
    const a = el("div", "twhy");
    a.append(el("div", "tlabel", "NEARLY"));
    const ul = el("ul", "tlog");
    for (const o of alts.slice(0, 5)) {
      const li = el("li");
      li.append(el("i", null, pct(o.probability)), el("span", null, o.rationale ?? o.option));
      ul.append(li);
    }
    a.append(ul);
    c.body.append(a);
  }

  const fx = [];
  if (r.effectOnSelf) fx.push(`on them: ${Object.entries(r.effectOnSelf).map(([k, v]) => `${NEED_LABEL[k] ?? k} ${v.delta > 0 ? "+" : ""}${v.delta}`).join(", ")}`);
  if (r.effectOnOthers) fx.push(`on others: ${r.effectOnOthers.map((e) => `${firstName({ name: e.name })} (${e.relation}) ${Object.entries(e.changes).map(([k, v]) => `${k} ${v.delta > 0 ? "+" : ""}${v.delta}`).join(", ")}`).join("; ")}`);
  if (r.affectedShip && r.effectOnShip) fx.push(`on the hull: ${r.effectOnShip.interpretation.join("; ")}`);
  if (fx.length) c.body.append(el("div", "tfx", fx.join("  ·  ")));
  return c.card;
}

export function mountLog(root, ctx) {
  const sec = section("LOG");
  if (!crew.aboard.length) { sec.append(el("div", "tempty", "No hands aboard.")); root.append(sec); return; }
  note(sec, "Every decision, and what made it. The ledger keeps the last twelve; this session keeps all of them.");
  picker(sec, "logId", () => { key = ""; paint(); });
  const habits = el("div");
  const list = el("div");
  sec.append(habits, list);

  const tools = section("FLIGHT RECORDER");
  note(tools, "Everyone on the ledger, with their genome, lineage and filed records.");
  const out = el("div", "tmono");
  out.style.display = "none";
  out.style.wordBreak = "break-all";
  out.style.maxHeight = "9rem";
  out.style.overflow = "auto";
  tools.append(group(
    button("CORPUS", () => {
      const jsonl = trainingCorpus(journal.all());
      out.textContent = jsonl;
      out.style.display = "";
      sim.notice = `Training corpus: ${journal.size} decisions, ${Math.round(jsonl.length / 1024)} KB of JSONL.`;
      try { globalThis.navigator?.clipboard?.writeText?.(jsonl).catch(() => {}); } catch { /* no clipboard here */ }
    }),
    button("EXPORT", () => {
      const json = exportJournals();
      out.textContent = json;
      out.style.display = "";
      sim.notice = `Flight recorder: ${Math.round(json.length / 1024)} KB — select and copy.`;
      try {
        globalThis.navigator?.clipboard?.writeText?.(json).then(() => { sim.notice = `Flight recorder copied — ${Math.round(json.length / 1024)} KB.`; }).catch(() => {});
      } catch { /* no clipboard on this device; the text is on screen */ }
    }, "accent"),
    button("HIDE", () => { out.style.display = "none"; out.textContent = ""; }),
  ), out);
  root.append(sec, tools);

  let key = "";
  const paint = () => {
    const m = memberOf(view.logId);
    if (!m) return;
    const rows = journal.of(m.id, 12);
    const k = `${m.id}:${rows.length}:${rows[0]?.cycle ?? -1}`;
    if (k === key) return;
    key = k;
    habits.innerHTML = "";
    list.innerHTML = "";
    const h = habitsOf(m.id).slice(0, 4);
    if (h.length) habits.append(el("div", "tfx", `Habits: ${h.map((x) => `${x.label} ×${x.n}`).join("  ·  ")}`));
    if (!rows.length) { list.append(el("div", "tempty", "Nothing filed yet — the book fills a line per pay cycle.")); return; }
    for (const r of rows) list.append(recordCard(r));
  };
  ctx.push(paint);
}

export { view as geneView };
