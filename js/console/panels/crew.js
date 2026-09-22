/* LIVING GALAXY — CONSOLE › CREW: ROSTER · TALK · BONDS · HOUSE.
 *
 * The one place to manage everyone aboard: who is posted where and how well
 * it is going (roster.js + duties.js), talking to them (talkview.js), who
 * gets on with whom (bonds.js + family.household), and the house rules
 * (family.social). Built on the console kit; contract PLAN.md §3 CREW, §2.3.
 */

import { el, section, note, row, button, group, chips, setBar, card } from "../kit.js";
import { crew, crewWageTotal, firstName, genderMark } from "../../crew.js";
import { childrenAboard, CHILD_ACTS, raise } from "../../crew/children.js";
import { tiersOf } from "../../crew/tiers.js";
import { sim } from "../../sim.js";
import { social, setSocial, loadSocial, household, settleFamily, berthsUsed, trustOf } from "../../family.js";
import { ladderReport, STAGE_LABEL, stageIndex, conceptionOdds, fertilityOf, privacyAboard, kinBetween } from "../../crew/romance.js";
import { GENDERS } from "../../npc/cradle.js";
import { captain, transferCommand, retakeCommand } from "../../npc/captain.js";
import { hasCompany, company } from "../../company.js";
import { roster, ROSTER_SORTS, ROSTER_FILTERS, dutyOptions, setDuty, PHASE_LABEL, KIND_LABEL } from "../../crew/roster.js";
import { bondsReport } from "../../crew/bonds.js";
import { duties, dutyReport } from "../../crew/duties.js";
import { mountTalk } from "../../crew/talkview.js";
import { journal } from "../../crew/journal.js";
import { tierOf, TIER_NAMES } from "../../crew/talk.js";
import { mountGenome, mountLog } from "./crew-gene.js";
import { mountSky } from "./crew-sky.js";
import { mountBrig } from "./crew-brig.js";
import { runHooks } from "../../crew/hooks.js";
import { stopAllBeats } from "../../crew/beats.js";

const view = { sort: "name", filter: "all", dutyOpen: null, talkId: null, ctx: null };
const TIE_GLYPH = { couple: "♥", friend: "◈", rival: "✕" };
const SORT_LABEL = { name: "NAME", career: "CAREER", station: "STATION", morale: "MORALE", trust: "TRUST", wage: "WAGE", kind: "KIND" };
const FILTER_LABEL = { all: "ALL", human: "HUMAN", robot: "ROBOT", on: "ON SHIFT", off: "OFF SHIFT", unsettled: "UNSETTLED" };
const moraleGlyph = (v) => (v >= 70 ? "▲" : v >= 40 ? "■" : "▼");
const fmtTime = (t) => (t ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

function logList(parent, entries, empty) {
  const ul = el("ul", "tlog");
  if (!entries.length) parent.append(el("div", "tempty", empty));
  for (const e of entries.slice(0, 20)) { const li = el("li"); li.append(el("i", null, fmtTime(e.t)), el("span", null, e.msg)); ul.append(li); }
  parent.append(ul);
}

/* ---- ROSTER ------------------------------------------------------------- */

function mountRoster(root, ctx) {
  const head = section("ABOARD");
  const berths = row(head, "Berths", { value: "—" });
  const pay = row(head, "Payroll", { value: "—", hint: "per cycle" });
  const last = row(head, "Last pay", { value: "—" });
  const wear = row(head, "Maintenance backlog", { value: "—", bar: true, hint: "somebody on Engineering works it off" });
  root.append(head);
  ctx.push(() => {
    berths.value.textContent = `${berthsUsed()} / ${sim.crewCapacity ?? 2}`;
    pay.value.textContent = `${crewWageTotal()} cr`;
    const lp = crew.lastPay;
    last.value.textContent = lp ? `${lp.paid} cr paid${lp.shortfall ? ` · ${lp.shortfall} short` : ""}` : "—";
    wear.value.textContent = `${Math.round(duties.wear * 100)}%`;
    setBar(wear.bar, duties.wear, duties.wear > 0.6 ? "hot" : duties.wear > 0.3 ? "warn" : "ok");
  });

  const ctl = section("ROSTER");
  const rebuild = () => { listKey = ""; paintList(); };
  ctl.append(chips(ROSTER_SORTS.map((id) => ({ id, label: SORT_LABEL[id] })), { value: view.sort, onPick: (id) => { view.sort = id; view.dutyOpen = null; rebuild(); } }).row);
  ctl.append(chips(ROSTER_FILTERS.map((id) => ({ id, label: FILTER_LABEL[id] })), { value: view.filter, onPick: (id) => { view.filter = id; view.dutyOpen = null; rebuild(); } }).row);
  const list = el("div");
  ctl.append(list);
  root.append(ctl);

  let listKey = "";
  const live = [];
  const paintList = () => {
    const rows = roster({ sort: view.sort, filter: view.filter });
    const docked = Boolean(sim.ship.dockedAt);
    const key = rows.map((r) => `${r.m.id}:${r.station?.id}:${r.phase}:${r.m.duty ?? ""}:${r.ties.map((t) => t.kind + t.with).join("")}:${captain.holder === r.m.id}:${Boolean(r.m.idle)}`).join("|") + `|${docked}|${view.dutyOpen}`;
    if (key === listKey) return;
    listKey = key;
    live.length = 0;
    list.innerHTML = "";
    if (!rows.length) { list.append(el("div", "tempty", crew.aboard.length ? "Nobody matches that filter." : "No hands aboard. Dock and open the HIRING HALL on the port deck.")); return; }
    for (const r of rows) list.append(rosterCard(r, docked, ctx, rebuild, live));
  };
  ctx.push(() => { paintList(); for (const fn of live) fn(); });
}

function rosterCard(r, docked, ctx, rebuild, live) {
  const m = r.m;
  const ties = r.ties.map((t) => `${TIE_GLYPH[t.kind]} ${firstName({ name: t.name })}`).join("  ");
  const c = card(`${captain.holder === m.id ? "★ " : ""}${m.name}`, `${m.title}${m.robot ? " · robot" : ` · ${m.complexName} ${m.letter}`}${genderMark(m)}${ties ? ` · ${ties}` : ""}`);
  /* three tracks, named. A number is a readout of a relationship, not one. */
  if (!m.robot) {
    const tr = tiersOf(m);
    row(c.body, "Standing", { value: tr.friend.label, hint: tr.friend.note });
    row(c.body, "Spirits", { value: tr.morale.label, hint: tr.morale.note });
    if (tr.romance.id !== "strangers") row(c.body, "Between you", { value: tr.romance.label, hint: tr.romance.note });
  }
  c.card.dataset.id = m.id;
  const post = row(c.body, "Station", { value: "—", hint: m.duty ? `assigned: ${KIND_LABEL[m.duty] ?? m.duty}` : "by trade" });
  const mood = m.robot ? row(c.body, "Condition", { value: "—", bar: true }) : row(c.body, "Morale", { value: "—", bar: true });
  const trust = m.robot ? null : row(c.body, "Trust", { value: "—" });
  const wage = row(c.body, "Wage", { value: m.robot ? `no wage · ${m.kw ?? 1} kW` : `${m.wage} cr/cycle${m.firstHand ? " · first hand" : ""}` });
  const wants = row(c.body, "On their mind", { value: "—", hint: "what they last decided, and why" });
  const wantsHint = wants.key.querySelector("small");
  live.push(() => {
    const rep = dutyReport().find((d) => d.id === m.id);
    post.value.textContent = `${r.station?.name ?? "—"} · ${m.robot ? (m.idle ? "NEEDS SERVICE" : "every watch") : PHASE_LABEL[r.phase]}${rep?.working ? ` · ${rep.task}` : ""}`;
    if (m.robot) { const cnd = m.condition ?? 100; mood.value.textContent = `${Math.round(cnd)}%`; setBar(mood.bar, cnd / 100, cnd < 30 ? "hot" : cnd < 60 ? "warn" : "ok"); }
    else { const mo = m.morale ?? 70; mood.value.textContent = `${moraleGlyph(mo)} ${Math.round(mo)}`; setBar(mood.bar, mo / 100, mo < 35 ? "hot" : mo < 60 ? "warn" : "ok"); }
    if (trust) trust.value.textContent = `${Math.round(trustOf(m))} · ${TIER_NAMES[tierOf(m)]}`;
    if (!m.robot) wage.value.textContent = `${m.wage} cr/cycle${m.firstHand ? " · first hand" : ""}`;
    const last = journal.last(m.id);
    wants.value.textContent = m.wants ? (m.wants.kind === "grievance" ? "wants a word — grievance" : "wants a word") : (last ? last.action.label : "—");
    /* the last line of a trace is the commitment; the one before it is the reason */
    const chain = last?.whatMadeMeActThis.reasoning ?? [];
    if (wantsHint) wantsHint.textContent = chain.length ? (chain[chain.length - 2] ?? chain[chain.length - 1]) : "nothing filed yet";
  });
  /* actions */
  const acts = [button("TALK", () => { view.talkId = m.id; ctx.setSub("talk"); }, "accent")];
  acts.push(button(view.dutyOpen === m.id ? "DUTY ▾" : "DUTY", () => { view.dutyOpen = view.dutyOpen === m.id ? null : m.id; rebuild(); }));
  if (!m.robot) {
    if (captain.holder === "player") acts.push(button("CONN", () => { const x = transferCommand(m.id); sim.notice = x.ok ? `${m.name} has the conn.` : x.error; rebuild(); }));
    else if (captain.holder === m.id) acts.push(button("STAND DOWN", () => { retakeCommand(); rebuild(); }, "danger"));
    if (docked) {
      acts.push(button(hasCompany() ? "SETTLE" : "SETTLE (co.)", () => { const e = settleFamily(m.id, "staff"); sim.notice = e ?? `${m.name} settled — ${company.name} staff`; rebuild(); }, hasCompany() ? "accent" : ""));
      acts.push(button("PAY OFF", () => { const e = settleFamily(m.id, "payoff"); sim.notice = e ?? `${m.name} paid off`; rebuild(); }, "danger"));
    }
  }
  c.body.append(group(...acts));
  if (view.dutyOpen === m.id) {
    const opts = [{ id: "", label: "BY TRADE" }, ...dutyOptions().map((o) => ({ id: o.kind, label: o.label.toUpperCase() }))];
    c.body.append(chips(opts, { value: m.duty ?? "", onPick: (id) => { const e = setDuty(m.id, id || null); if (e) sim.notice = e; view.dutyOpen = null; rebuild(); } }).row);
  }
  return c.card;
}

/* ---- TALK --------------------------------------------------------------- */

function mountTalkSub(root, ctx) {
  const sec = section("TALK");
  if (!crew.aboard.length) { sec.append(el("div", "tempty", "No hands aboard to talk to.")); root.append(sec); return; }
  if (ctx.focus && crew.aboard.some((m) => m.id === ctx.focus)) view.talkId = ctx.focus;
  if (!crew.aboard.some((m) => m.id === view.talkId)) view.talkId = crew.aboard[0].id;
  const host = el("div", "in-talk-host");
  let refresh = () => {};
  const remount = () => { refresh?.stop?.(); refresh = mountTalk(host, view.talkId, { onChange: () => {} }); };
  const picker = chips(crew.aboard.map((m) => ({ id: m.id, label: firstName(m), hint: m.title })), { value: view.talkId, onPick: (id) => { view.talkId = id; remount(); } });
  sec.append(picker.row, host);
  root.append(sec);
  remount();
  ctx.push(() => { if (!crew.aboard.some((m) => m.id === view.talkId)) { if (crew.aboard.length) { view.talkId = crew.aboard[0].id; picker.set(view.talkId); remount(); } } else refresh(); });
}

/**
 * One child, and what to do about them.
 *
 * The genome was always there — an earlier build crossed both parents properly — it was just
 * never shown, and there was nothing to do with a child for the forty-eight
 * cycles before they walked off to a hiring hall. What they got from whom, what
 * it cost them, and four things a captain on a working ship can actually do.
 */
function childCard(root, k, rebuild) {
  const { c, bond, parents, inherit } = k;
  const cd = card(c.name, `${c.age} cycles${parents.length ? ` · ${parents.join(" & ")}` : ""}${c.pronouns ? ` · ${c.pronouns.subj}/${c.pronouns.obj}` : ""}`);
  cd.card.dataset.id = c.id;
  row(cd.body, "Bond", { value: `${bond}`, bar: true, hint: bond >= 55 ? "would sign on here the day they can" : bond >= 25 ? "knows you" : "you are the person who signs the wages" });
  if (inherit.complex) row(cd.body, "House", { value: inherit.complex.name, hint: `generation ${inherit.complex.generation} · learns this trade ×${inherit.complex.learn.toFixed(2)}` });
  for (const sh of inherit.shares) if (sh.share != null) row(cd.body, `From ${firstName(sh)}`, { value: `${sh.share}%`, hint: "measured, not assumed" });
  for (const b of inherit.boons) row(cd.body, `▲ ${b.label}`, { value: b.kind === "apt" ? `+${Math.round(b.delta * 100)}` : "", hint: b.note });
  for (const f of inherit.flaws) row(cd.body, `▼ ${f.label}`, { value: f.kind === "apt" ? `${Math.round(f.delta * 100)}` : "", hint: f.note });
  if (!inherit.boons.length && !inherit.flaws.length) note(cd.body, "Nothing yet that either parent would not recognise.");
  if (inherit.kin.length) row(cd.body, "Kin aboard", { value: "", hint: inherit.kin.map((x) => `${firstName(x)} ${x.r.toFixed(2)}`).join(" · ") });

  const said = el("div", "tfx", "");
  for (const act of CHILD_ACTS) {
    const r = row(cd.body, act.label, { hint: act.why });
    r.value.append(button("DO", () => {
      const out = raise(c, act.id);
      said.textContent = `${out.line} (${out.tag})`;
      rebuild?.();
    }, "tiny"));
  }
  cd.body.append(said);
  root.append(cd.card);
}

/* ---- BONDS -------------------------------------------------------------- */

function mountBonds(root, ctx) {
  /* the ladder first: it is the part that moves, and the part people look for */
  const lad = section("THE LADDER");
  note(lad, "Strangers, noticed, interested, courting, together, bonded. Every rung needs both of them to want it.");
  const ladBody = el("div");
  lad.append(ladBody);
  root.append(lad);
  let ladKey = "";
  ctx.push(() => {
    const rows = ladderReport();
    const k = rows.map((r) => `${r.a.id}:${r.b.id}:${r.stage}:${Math.round(r.spark)}`).join("|");
    if (k === ladKey) return;
    ladKey = k;
    ladBody.innerHTML = "";
    if (!rows.length) { ladBody.append(el("div", "tempty", "Nobody aboard has noticed anybody yet.")); return; }
    for (const r of rows.slice(0, 10)) {
      const c = card(`${firstName(r.a)} · ${firstName(r.b)}`, r.platonic ? "are close, and that is all it is" : (STAGE_LABEL[r.stage] ?? r.stage));
      const sp = row(c.body, "Spark", { value: String(Math.round(r.spark)), bar: true, hint: `draw ${Math.round(r.attraction * 100)}%` });
      setBar(sp.bar, Math.min(1, Math.max(0, r.spark) / 130), r.platonic ? "warn" : stageIndex(r.stage) >= 4 ? "ok" : stageIndex(r.stage) >= 2 ? "warn" : "hot");
      const kin = kinBetween(r.a, r.b);
      if (kin >= 0.1) row(c.body, "Related", { value: kin.toFixed(2), hint: "the ladder will not start between family" });
      if (stageIndex(r.stage) >= 4) {
        const odds = conceptionOdds(r.a, r.b);
        row(c.body, "A child", { value: odds.chance ? `${Math.round(odds.chance * 100)}% a night` : "—", hint: odds.chance ? `fertility ${fertilityOf(r.a)} · ${fertilityOf(r.b)}` : (odds.why ?? "") });
        if (r.nights) row(c.body, "Evenings together", { value: String(r.nights) });
      }
      ladBody.append(c.card);
    }
  });

  const sec = section("TIES");
  const pairs = el("div");
  sec.append(pairs);
  root.append(sec);
  let key = "";
  ctx.push(() => {
    const rep = bondsReport();
    const k = rep.map((p) => `${p.a.id}${p.b.id}${Math.round(p.rapport)}${p.kind}`).join("|");
    if (k === key) return;
    key = k;
    pairs.innerHTML = "";
    if (!rep.length) { pairs.append(el("div", "tempty", crew.aboard.length < 2 ? "Ties take two. Sign a second hand." : "—")); return; }
    for (const p of rep) {
      const r = row(pairs, `${firstName(p.a)} · ${firstName(p.b)}`, { value: p.kind ? `${TIE_GLYPH[p.kind]} ${p.kind}` : "—", bar: true, hint: `rapport ${Math.round(p.rapport)}` });
      setBar(r.bar, p.rapport / 100, p.kind === "rival" ? "hot" : p.kind ? "ok" : undefined);
    }
  });

  const house = section("HOUSEHOLD");
  const hbody = el("div");
  house.append(hbody);
  root.append(house);
  let hkey = "";
  ctx.push(() => {
    const k = `${household.children.map((c) => `${c.id}:${c.age}`).join(",")}|${household.pregnancies.map((p) => `${p.carrier}:${p.cycles}`).join(",")}`;
    if (k === hkey) return;
    hkey = k;
    hbody.innerHTML = "";
    if (!household.children.length && !household.pregnancies.length) { hbody.append(el("div", "tempty", social.family ? "No children aboard." : "Families are switched off (HOUSE).")); return; }
    for (const p of household.pregnancies) {
      const who = crew.aboard.find((m) => m.id === p.carrier);
      row(hbody, `${who ? firstName(who) : "Someone"} is expecting`, { value: `${Math.max(0, p.due - p.cycles)} cycles`, hint: p.sire === "player" ? "yours" : `with ${p.sireName}` });
    }
    for (const k of childrenAboard()) childCard(hbody, k, () => { hkey = ""; });
  });

  const logSec = section("CREW LOG");
  const lbody = el("div");
  logSec.append(lbody);
  root.append(logSec);
  let lkey = -1;
  ctx.push(() => {
    const k = crew.log.length ? `${crew.log.length}:${crew.log[0].t}` : "0";
    if (k === lkey) return;
    lkey = k;
    lbody.innerHTML = "";
    logList(lbody, crew.log, "Nothing in the book yet.");
  });
}

/* ---- HOUSE -------------------------------------------------------------- */

function mountHouse(root) {
  loadSocial();
  const sec = section("YOU");
  note(sec, "How the crew see you, and the house rules for what happens aboard.");
  const name = el("input", "tinput");
  name.type = "text"; name.placeholder = "What the crew call you"; name.value = social.name ?? ""; name.autocomplete = "off";
  name.addEventListener("change", () => setSocial({ name: name.value.trim() }));
  sec.append(group(name));
  row(sec, "Gender", { value: "" });
  sec.append(chips(GENDERS.map((g) => ({ id: g, label: g.toUpperCase() })), { value: social.gender, onPick: (g) => setSocial({ gender: g }) }).row);
  row(sec, "Drawn to", { value: "", hint: "tap to toggle" });
  const drawn = chips(GENDERS.map((g) => ({ id: g, label: g.toUpperCase() })), { value: null, onPick: (g) => {
    const set = new Set(social.attractedTo ?? []);
    if (set.has(g)) set.delete(g); else set.add(g);
    setSocial({ attractedTo: [...set] });
    paintDrawn();
  } });
  const paintDrawn = () => { for (const b of drawn.row.querySelectorAll("button")) b.classList.toggle("on", (social.attractedTo ?? []).includes(b.dataset.id)); };
  paintDrawn();
  sec.append(drawn.row);
  root.append(sec);

  const rules = section("HOUSE RULES");
  row(rules, "Romance", { value: "", hint: "off · crew pair off with each other · including you" });
  rules.append(chips([{ id: "off", label: "OFF" }, { id: "crew", label: "CREW" }, { id: "all", label: "ALL" }], { value: social.romance, onPick: (v) => { setSocial({ romance: v }); repaintRules(); } }).row);
  row(rules, "Families", { value: "", hint: "whether anyone conceives aboard" });
  rules.append(chips([{ id: "on", label: "ON" }, { id: "off", label: "OFF" }], { value: social.family ? "on" : "off", onPick: (v) => { setSocial({ family: v === "on" }); repaintRules(); } }).row);

  row(rules, "Private evenings", { value: "", hint: "fade to black — a spare berth, then a child can come of it" });
  const adultRow = chips([{ id: "off", label: "OFF" }, { id: "on", label: "ON" }], { value: social.adult ? "on" : "off", onPick: (v) => { setSocial({ adult: v === "on" }); repaintRules(); } });
  rules.append(adultRow.row);
  const careful = row(rules, "Trying for a child", { value: "", hint: "off · they are being careful" });
  const carefulRow = chips([{ id: "no", label: "NO" }, { id: "yes", label: "YES" }], { value: social.contraception ? "no" : "yes", onPick: (v) => { setSocial({ contraception: v === "no" }); repaintRules(); } });
  rules.append(carefulRow.row);
  const berths = row(rules, "Berths with a door", { value: "—", hint: "an evening to themselves needs one spare" });
  root.append(rules);

  const repaintRules = () => {
    loadSocial();
    const p = privacyAboard();
    berths.value.textContent = `${p.spare} spare of ${p.berths}`;
    carefulRow.row.style.display = social.adult && social.family ? "" : "none";
    careful.row.style.display = social.adult && social.family ? "" : "none";
    adultRow.row.style.display = social.romance === "off" ? "none" : "";
  };
  repaintRules();

  /* the kit as hooks.js documents it, so an addon can build a row that looks
   * like every other row instead of hand-rolling its own markup */
  runHooks("houseRules", rules, { el, section, note, row, button, group, chips, setBar, social, setSocial, loadSocial, repaint: repaintRules });
}

/* ---- panel -------------------------------------------------------------- */

export default {
  id: "crew",
  title: "CREW",
  order: 30,
  subtabs: [{ id: "roster", label: "ROSTER" }, { id: "talk", label: "TALK" }, { id: "bonds", label: "BONDS" }, { id: "genome", label: "GENOME" }, { id: "log", label: "LOG" }, { id: "sky", label: "SKY" }, { id: "brig", label: "BRIG" }, { id: "house", label: "HOUSE" }],
  mount(root, ctx) {
    view.ctx = ctx;
    const sub = ctx.sub ?? "roster";
    if (sub === "talk") mountTalkSub(root, ctx);
    else if (sub === "bonds") mountBonds(root, ctx);
    else if (sub === "genome") mountGenome(root, ctx);
    else if (sub === "log") mountLog(root, ctx);
    else if (sub === "sky") mountSky(root, ctx);
    else if (sub === "brig") mountBrig(root, ctx);
    else if (sub === "house") mountHouse(root, ctx);
    else mountRoster(root, ctx);
    if (ctx.focus && sub === "roster") root.querySelector(`[data-id="${ctx.focus}"]`)?.scrollIntoView?.({ block: "center" });
  },
  paint() { /* refreshers pushed via ctx.push do the work */ },
  unmount() { view.dutyOpen = null; stopAllBeats(); },
  /** one hit per hand */
  search() {
    return crew.aboard.map((m) => ({
      id: `crew:${m.id}`, label: m.name, hint: `${m.title} · ${m.robot ? "robot" : `morale ${Math.round(m.morale ?? 70)}`}`,
      sub: "talk", focus: m.id, path: `crew/talk#${m.id}`, keywords: `${m.complexName ?? ""} ${m.title} crew talk`,
      run: () => { view.talkId = m.id; view.ctx?.openConsole?.("crew", "talk", { focus: m.id }); },
    }));
  },
};
