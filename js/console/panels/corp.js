/* LIVING GALAXY — CONSOLE › CORP: COMPANY · BOARD · PILOT · STANDING · GNN
 *
 * The company (treasury, book, people, the register desk when docked), the
 * contract desk (in hand always, offers when docked), the pilot's record
 * (rank, specialisations, transfer, skills, live modifiers), standing with
 * every corporation, and the GNN desks with their bulletins' actions.
 */

import { button, el, group, note, row, section, setBar } from "../kit.js";
import { mountMarshal } from "./corp-marshal.js";
import { mountAccount } from "./corp-account.js";
import { account, accountLine } from "../../account.js";
import { ticketsHeld } from "../../npc/bounty.js";
import { certSheet, corp, pilot, rankStatus, skillSheet, specEffectLines, specOptions, standingSheet, title, transferOptions, tryPromote, trySpecialize, tryTransfer } from "../../pilot.js";
import { MOD_LABELS } from "../../careers/effects.js";
import { SKILLS, studySkills } from "../../careers/index.js";
import { raceById, traitLines } from "../../races.js";
import { standingLabel, corpOfStation } from "../../corps.js";
import { sigil } from "../../ui/glyphs.js";
import { sim } from "../../sim.js";
import { stationById } from "../../stations.js";
import { CHARTERS, CHARTER_KEYS, COMPANY, boardBrief, company, contacts, foundCompany, hasCompany, staffAt, transfer } from "../../company.js";
import { boardFor, contracts, timeLeft, BOARD } from "../../contracts.js";
import { renderDesk, renderHeld } from "../../boardview.js";
import { DESKS, gnn, gnnStation, runAction } from "../../gnn.js";
import { addWaypointAt } from "../../sim.js";
import { townReport, townLog, townLine } from "../../stationlife.js";

const DOC = globalThis.document ?? null;
const docked = () => (sim.ship?.dockedAt ? stationById(sim.ship.dockedAt) : null);
const fmtAgo = (at) => { const s = Math.max(0, Math.round(sim.time - at)); return s < 90 ? `${s}s ago` : `${Math.round(s / 60)}m ago`; };

/* ---- COMPANY --------------------------------------------------------------- */

function mountCompany(root, push) {
  const host = el("div");
  root.append(host);
  let key = "";
  const rebuild = () => { key = ""; };
  push(() => {
    const st = docked();
    const b = hasCompany() ? boardBrief() : null;
    const k = hasCompany()
      ? `co:${company.name}:${Math.round(company.treasury)}:${company.staff.length}:${company.book.length}:${st?.id ?? ""}:${b.seats.map((x) => x.verdict).join("")}`
      : `none:${st?.id ?? ""}:${Math.round(sim.ship.credits)}`;
    if (k === key) return;
    key = k;
    host.innerHTML = "";
    if (!hasCompany()) {
      const sec = section("Company");
      note(sec, `A charter, a treasury, a board. Drones and company hulls are company property; settled hands earn it a wage share every cycle. ${COMPANY.registration} cr at any port's registrar.`);
      if (st) {
        const v = row(sec, "Register a company", { hint: `${COMPANY.registration} cr at ${st.name}` });
        const sel = el("select", "tinput");
        for (const c of CHARTER_KEYS) { const o = el("option", null, CHARTERS[c].name); o.value = c; if (c === (st.sector === "pirate" ? "civilian" : st.sector) || (c === "industrial" && !CHARTERS[st.sector])) o.selected = true; sel.append(o); }
        v.value.replaceChildren(group(sel, button("REGISTER", () => { const e = foundCompany("", sel.value); if (e) sim.notice = e; rebuild(); }, "on")));
      } else sec.append(el("div", "tempty", "Dock to register."));
      host.append(sec);
      return;
    }
    const head = section(company.name.toUpperCase());
    note(head, `${CHARTERS[company.charter].name} · office ${stationById(company.hq)?.name ?? "—"} · ${company.staff.length} staff earning ${b.staffIncome} cr/cycle · board ${b.seats.map((x) => `${x.role.toLowerCase()} ${x.verdict}`).join(", ")}`);
    const tr = row(head, "Treasury", { value: `${Math.round(company.treasury).toLocaleString()} cr` });
    tr.value.replaceChildren(group(el("span", "v good", `${Math.round(company.treasury).toLocaleString()} cr`),
      button("DRAW 500", () => { const e = transfer(-500); if (e) sim.notice = e; rebuild(); }, "tiny"),
      button("FUND 500", () => { const e = transfer(500); if (e) sim.notice = e; rebuild(); }, "tiny")));
    host.append(head);
    const book = section("Book");
    if (!company.book.length) book.append(el("div", "tempty", "Nothing booked yet."));
    for (const e of company.book.slice(0, 8)) row(book, e.text, { value: e.delta ? `${e.delta > 0 ? "+" : ""}${Math.round(e.delta)} cr` : "" }).value.className = `v ${e.delta > 0 ? "good" : e.delta < 0 ? "hot" : ""}`;
    host.append(book);
    const people = section("People");
    const here = st ? staffAt(st.id) : [];
    for (const p of here) row(people, `${sigil(p.id)} ${p.name}`, { hint: `${p.title} · staff here · ${p.income} cr/cycle to the company${p.family?.length ? ` · household of ${p.family.length + 1}` : ""}`, value: "HERE" }).value.className = "v good";
    const others = contacts().filter((c) => !here.some((h) => h.id === c.id));
    if (!here.length && !others.length) people.append(el("div", "tempty", "Nobody on the books yet. Settle a hand at a port and they earn the company a wage share every cycle."));
    for (const c of others.slice(0, 10)) row(people, c.name, { hint: `${c.kind === "staff" ? "staff" : c.why ?? "paid off"} · ${c.where}${c.kind === "alumni" ? " · in the hall there" : ""}` });
    if (here.length) note(people, "Recall staff from the port deck's hiring hall.");
    host.append(people);
  });
}

/* ---- BOARD ----------------------------------------------------------------- */

function mountBoard(root, push) {
  const host = el("div");
  root.append(host);
  let key = "";
  const rebuild = () => { key = ""; };
  /* 0.3.18: the desk is drawn by js/boardview.js — departments → issuers → offers, as drop-downs */
  const cbtn = (label, fn, on = false, danger = false) => button(label, fn, `tiny${on ? " on" : ""}${danger ? " danger" : ""}`);
  push(() => {
    const st = docked();
    const list = st ? boardFor(st) : [];
    const k = `${contracts.active.map((a) => `${a.id}:${Math.round(timeLeft(a) / 60)}:${Math.round((a.progress ?? 0) * 10)}:${a.leg ?? 0}`).join(",")}|${st?.id ?? ""}|${list.map((c) => c.id).join(",")}|${Math.round(sim.ship.credits / 100)}|${Math.round(sim.ship.cargoCap)}`;
    if (k === key) return;
    key = k;
    host.innerHTML = "";
    const held = section(`In hand — ${contracts.active.length}/${BOARD.maxActive}`);
    renderHeld(held, st, { btn: cbtn, onChange: rebuild });
    host.append(held);
    const co = st ? corpOfStation(st) : null;
    const offers = section(st ? `Offers — ${st.name}${co ? ` · ${co.name} ${standingLabel(co.standing)}` : ""}` : "Offers");
    if (!st) offers.append(el("div", "tempty", "Dock to read a port's desk. Refusing is free; abandoning is not."));
    else {
      note(offers, `Posted by ${co?.name ?? "the port"}${co?.powerName ? ` under ${co.powerName}` : ""} and the outfits with offices on the ring. An accepted job is a promise with a deadline and a standing penalty.`);
      renderDesk(offers, st, { btn: cbtn, onChange: rebuild });
    }
    host.append(offers);
  });
}

/* ---- PILOT ----------------------------------------------------------------- */

/** "tug_lease" → "Tug Lease" */
const humanId = (id) => String(id).split("_").map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1))).join(" ");
const skillName = (id) => SKILLS[id]?.name ?? humanId(id);

function mountPilot(root, push) {
  const idSec = section("Record");
  row(idSec, "Name", { value: `${sigil(`${pilot.name}:${pilot.raceId}:${pilot.complexId}`)}  ${pilot.name}` });
  const titleRow = row(idSec, "Standing title");
  row(idSec, "Race", { value: raceById(pilot.raceId).name });
  const corpRow = row(idSec, "Flying for");
  root.append(idSec);

  const rankSec = section("Rank");
  const complexRow = row(rankSec, "Complex");
  const gradeRow = row(rankSec, "Grade");
  const dutyRow = row(rankSec, "Duties");
  const cycRow = row(rankSec, "Cycles served");
  const payRow = row(rankSec, "Rate");
  const unlockRow = row(rankSec, "Grade privileges");
  const studyRow = row(rankSec, "Studying");
  const gateRow = row(rankSec, "Next grade");
  const promoteBtn = button("PROMOTE", () => { const r = tryPromote(); sim.notice = r.ok ? `Promoted — ${title()}` : "Not eligible for promotion yet."; });
  gateRow.value.replaceChildren(group(promoteBtn));
  const missBody = el("div");
  rankSec.append(missBody);
  const certRow = row(rankSec, "Certificates", { hint: "the record of the climb — awarded with each grade" });
  root.append(rankSec);

  const specSec = section("Specialisations");
  const specBody = el("div");
  specSec.append(specBody);
  root.append(specSec);

  const xferSec = section("Lateral transfer");
  const xferBody = el("div");
  xferSec.append(el("div", "tempty", "Cycles served carry over. The new ladder starts at A — B if the complexes share pipelines and you are senior."));
  xferSec.append(xferBody);
  root.append(xferSec);

  const skillSec = section("Skills");
  const skillBody = el("div");
  skillSec.append(skillBody);
  root.append(skillSec);

  /* Everything the race and the specialisation are doing to the hull right now — the composed truth, not the brochure. */
  const modSec = section("Live modifiers");
  const modBody = el("div");
  modSec.append(modBody);
  root.append(modSec);

  let skillKey = "", missKey = "", specKey = "", modKey = "", xferKey = "", certKey = "";
  push(() => {
    const st = rankStatus();
    titleRow.value.textContent = title();
    const co = corp();
    corpRow.value.textContent = co ? `${co.name} · ${standingLabel(co.standing)}` : "Independent";
    if (!st) return;
    complexRow.value.textContent = st.complex;
    gradeRow.value.textContent = `${st.letter} — ${st.title}`;
    dutyRow.value.textContent = st.duties ? "" : "—";
    if (st.duties && dutyRow.row.dataset.d !== st.duties) {
      dutyRow.row.dataset.d = st.duties;
      dutyRow.key.querySelector("small")?.remove();
      dutyRow.key.append(el("small", null, st.duties));
    } else if (!st.duties) { dutyRow.key.querySelector("small")?.remove(); delete dutyRow.row.dataset.d; }
    cycRow.value.textContent = `${st.cycles}`;
    payRow.value.textContent = `${st.take} cr / cycle take (book ${st.pay})${st.probation ? " · PROBATIONARY" : ""}`;
    payRow.value.className = `v ${st.probation ? "hot" : ""}`;
    unlockRow.value.textContent = st.unlocks?.length ? st.unlocks.map(humanId).join(" · ") : "—";
    const study = pilot.character ? studySkills(pilot.character, pilot.complexId) : [];
    studyRow.value.textContent = study.length ? study.map(skillName).join(", ") : "—";
    promoteBtn.disabled = !st.ready;
    promoteBtn.textContent = st.ready ? "PROMOTE" : st.next ? `TO ${st.next}` : "TOP GRADE";

    const certs = certSheet();
    const ck = certs.map((c) => c.id).join(",");
    if (ck !== certKey) { certKey = ck; certRow.value.textContent = certs.length ? certs.map((c) => c.name).join(" · ") : "—"; }

    const miss = Array.isArray(st.missing) ? st.missing : [];
    const mk = JSON.stringify(miss) + st.ready;
    if (mk !== missKey) {
      missKey = mk;
      missBody.innerHTML = "";
      if (st.ready) missBody.append(el("div", "tempty", "Requirements met. Take the grade."));
      else if (!miss.length) missBody.append(el("div", "tempty", typeof st.missing === "string" ? st.missing : "—"));
      else for (const m of miss) {
        const label = m.type === "skill" ? `${m.name ?? m.id ?? m.skill}` : m.type === "cycles" ? "Time in grade" : m.type ?? "requirement";
        const val = m.have != null && m.need != null ? `${Math.round(m.have)} / ${m.need}` : m.need != null ? `need ${m.need}` : "—";
        row(missBody, label, { value: val }).value.className = "v hot";
      }
    }

    const specs = specOptions();
    const sk = specs.map((x) => `${x.id}:${x.check?.ok}`).join(",");
    if (sk !== specKey) {
      specKey = sk;
      specBody.innerHTML = "";
      if (!specs.length) specBody.append(el("div", "tempty", "None in this complex."));
      const held = pilot.character?.careers?.[pilot.complexId]?.specialization ?? null;
      for (const sp of specs) {
        const fx = (sp.effects ?? []).map((e) => `${e.label} ${e.value}`).join(", ");
        const r = row(specBody, sp.name, { hint: `${sp.blurb ?? sp.flavor ?? ""} opens at ${sp.fromRank}${fx ? ` · ${fx}` : ""}` });
        if (held === sp.id) { r.value.textContent = "HELD"; r.value.className = "v good"; continue; }
        const b = button(sp.check?.ok ? "TAKE" : "LOCKED", () => { const res = trySpecialize(sp.id); sim.notice = res.ok ? `${sp.name} — logged.` : "Not eligible for that specialisation."; specKey = ""; modKey = ""; }, sp.check?.ok ? "" : "tiny");
        b.disabled = !sp.check?.ok;
        r.value.replaceChildren(b);
      }
    }

    const xo = transferOptions();
    const xk = xo.map((x) => `${x.id}:${x.start}:${x.ok}`).join(",");
    if (xk !== xferKey) {
      xferKey = xk;
      xferBody.innerHTML = "";
      for (const x of xo) {
        const r = row(xferBody, x.name, { hint: x.resume ? `held · resume at ${x.start}` : x.related ? `related · starts at ${x.start}` : `unrelated · starts at ${x.start}` });
        const b = button(x.resume ? `RESUME ${x.start}` : `TO ${x.start}`, () => { const res = tryTransfer(x.id); sim.notice = res.ok ? `Transferred — ${title()}` : res.error ?? "Transfer refused."; xferKey = ""; specKey = ""; missKey = ""; modKey = ""; }, "tiny");
        b.disabled = !x.ok;
        r.value.replaceChildren(b);
      }
    }

    const mods = sim.ship?.mods;
    const mk2 = mods ? Object.values(mods).map((v) => v.toFixed(3)).join(",") : "";
    if (mk2 !== modKey) {
      modKey = mk2;
      modBody.innerHTML = "";
      const held = specEffectLines();
      const live = Object.entries(mods ?? {}).filter(([, v]) => Math.abs(v - 1) > 0.005);
      if (!live.length) modBody.append(el("div", "tempty", "Factory standard. Nothing is trimming the hull."));
      for (const [k, v] of live) {
        const L = MOD_LABELS[k];
        if (!L) continue;
        const d = Math.round((v - 1) * 100);
        row(modBody, L.label, { value: `${d >= 0 ? "+" : ""}${d}%` }).value.className = `v ${(L.up ? d > 0 : d < 0) ? "good" : "hot"}`;
      }
      /* the race's own lines fold in here rather than as a brochure of their own */
      for (const line of traitLines(pilot.raceId)) row(modBody, line.label, { hint: raceById(pilot.raceId).name, value: line.value }).value.className = `v ${line.good ? "good" : "hot"}`;
      if (held.length) modBody.append(el("div", "tempty", `Specialisation: ${held.map((e) => `${e.label} ${e.value}`).join(", ")}`));
    }

    const sheet = skillSheet();
    const skk = sheet.map((x) => `${x.id}:${x.value}`).join(",");
    if (skk !== skillKey) {
      skillKey = skk;
      skillBody.innerHTML = "";
      if (!sheet.length) skillBody.append(el("div", "tempty", "Nothing logged yet. Go and do the work."));
      for (const s of sheet) { const r = row(skillBody, s.name, { hint: s.domain, bar: true, value: `${s.value}` }); setBar(r.bar, s.value / 100, s.value > 60 ? "ok" : null); }
    }
  });
}

/* ---- STANDING -------------------------------------------------------------- */

function mountStanding(root, push) {
  const sec = section("Corporate standing");
  const body = el("div");
  sec.append(body);
  root.append(sec);
  let key = "";
  push(() => {
    const sh = standingSheet();
    const k = sh.map((x) => `${x.id}:${x.standing}`).join(",");
    if (k === key) return;
    key = k;
    body.innerHTML = "";
    for (const c of sh) {
      const r = row(body, c.name, { hint: `${c.tier} · ${c.sector}`, value: `${c.standing >= 0 ? "+" : ""}${c.standing} ${standingLabel(c.standing)}` });
      r.row.dataset.focus = `corp-${c.id}`;
      r.value.className = `v ${c.standing >= 10 ? "good" : c.standing <= -10 ? "hot" : ""}`;
    }
  });
}

/* ---- GNN ------------------------------------------------------------------- */

function mountGnn(root, push) {
  const host = el("div");
  root.append(host);
  let key = "";
  const rebuild = () => { key = ""; };
  push(() => {
    const st = gnnStation();
    const k = `${st?.id ?? ""}|${gnn.posts.map((p) => `${p.id}:${p.actions.map((a) => (a.done ? 1 : 0)).join("")}`).join(",")}`;
    if (k === key) return;
    key = k;
    host.innerHTML = "";
    if (st) {
      const head = section("Galactic News Network");
      const r = row(head, st.name, { hint: "this sky's GNN station — dock for the full desk" });
      r.value.replaceChildren(button("MARK", () => { addWaypointAt(st.name, st.x, st.y, st.z); sim.notice = `${st.name} marked on your chart.`; }, "tiny"));
      host.append(head);
    }
    for (const [desk, info] of Object.entries(DESKS)) {
      const posts = gnn.posts.filter((p) => p.desk === desk).slice().reverse();
      const sec = section(`${info.label} · ${posts.length}`);
      if (!posts.length) sec.append(el("div", "tempty", "Nothing on this desk yet."));
      for (const b of posts.slice(0, 12)) {
        const r = row(sec, b.title || info.tag, { hint: `${b.body || ""} · ${fmtAgo(b.at)}` });
        r.row.dataset.focus = b.id;
        r.row.classList.add("wide");
        const acts = b.actions.map((a, i) => { const x = button(a.done ? "DONE" : a.label.toUpperCase(), () => { runAction(b, i); rebuild(); }, "tiny"); x.disabled = Boolean(a.done); return x; });
        r.value.replaceChildren(group(...acts));
      }
      host.append(sec);
    }
  });
}

/* ---- the panel ------------------------------------------------------------- */

/* the panels here take (root, push, ctx); crew-side panels take (root, ctx) */
/* ---- TOWN ------------------------------------------------------------------
 *
 * What the people you settled are doing now. They used to be a row that made
 * a number; they work, climb, marry, have children who grow up onto the rolls,
 * fall out, walk off and occasionally do not come home — and all of it moves
 * the treasury, the standing or the board. The point of the desk is that you
 * can see the ones who are about to leave before they do.
 */
function mountTown(root) {
  const rows = townReport();
  const head = section("COMPANY TOWNS");
  if (!hasCompany()) { note(head, "Register a charter and settle a hand at a port — that is how a company gets a town."); root.append(head); return; }
  note(head, townLine());
  root.append(head);

  if (!rows.length) {
    const e = section("ON THE ROLLS");
    note(e, "Nobody settled yet. CONSOLE › CREW, or a port deck, to settle a hand and whoever is theirs.");
    root.append(e);
  }
  const byPort = new Map();
  for (const r of rows) { if (!byPort.has(r.station)) byPort.set(r.station, []); byPort.get(r.station).push(r); }
  for (const [port, list] of byPort) {
    const s = section(`${port.toUpperCase()} — ${list.length} on the rolls · ${list.reduce((a, r) => a + r.income, 0)} cr/cycle`);
    for (const r of list) {
      const bits = [r.role.label, `${r.cycles} cycles served`];
      if (r.partner) bits.push(`with ${r.partner}`);
      if (r.children.length) bits.push(`${r.children.length} child${r.children.length === 1 ? "" : "ren"}: ${r.children.join(", ")}`);
      if (r.expecting != null) bits.push(`expecting in ${r.expecting}`);
      if (r.risk) bits.push(r.risk);
      const row2 = row(s, `${r.s.name}${r.s.born ? " ·" : ""}`, { value: `${r.income} cr`, bar: true, hint: bits.join(" · ") });
      setBar?.(row2, r.mood / 100);
    }
    root.append(s);
  }

  const lg = section("THE TOWN LOG");
  const log = townLog(null, 16);
  if (!log.length) note(lg, "Quiet so far.");
  for (const e of log) row(lg, e.kind.replace(/-/g, " "), { hint: e.text, value: e.delta ? `${e.delta > 0 ? "+" : ""}${Math.round(e.delta)} cr` : "" });
  root.append(lg);
}

const SUBS = {
  company: mountCompany, town: mountTown, board: mountBoard, pilot: mountPilot, standing: mountStanding, gnn: mountGnn,
  marshal: (root, push, ctx) => mountMarshal(root, ctx ?? { push }),
  account: (root, push, ctx) => mountAccount(root, ctx ?? { push }),
};

export default {
  id: "corp",
  title: "CORP",
  order: 60,
  subtabs: [{ id: "company", label: "COMPANY" }, { id: "town", label: "TOWN" }, { id: "board", label: "BOARD" }, { id: "marshal", label: "MARSHAL" }, { id: "pilot", label: "PILOT" }, { id: "standing", label: "STANDING" }, { id: "gnn", label: "GNN" }, { id: "account", label: "ACCOUNT" }],
  mount(root, ctx) { (SUBS[ctx.sub] ?? mountCompany)(root, ctx.push, ctx); },
  paint() {},
  unmount() {},
  search() {
    const out = [
      { label: "Pilot record", hint: "rank, promotion, skills", sub: "pilot", keywords: "rank promote career skills" },
      { label: "Specialisations", hint: "take one when the grade allows", sub: "pilot", keywords: "career" },
      { label: "Company treasury", hint: hasCompany() ? `${Math.round(company.treasury).toLocaleString()} cr` : "register at a port", sub: "company", keywords: "company charter fund draw" },
      { label: "Contracts", hint: `${contracts.active.length} in hand`, sub: "board", keywords: "board desk jobs offers" },
      { label: "GNN desk", hint: `${gnn.posts.length} bulletins`, sub: "gnn", keywords: "news bulletins" },
      { label: "Marshal's board", hint: `${ticketsHeld().length} ticket${ticketsHeld().length === 1 ? "" : "s"} signed`, sub: "marshal", keywords: "bounty marks wanted capture brig marshal" },
      { label: "Account", hint: accountLine(), sub: "account", keywords: "account sign in login sync save cloud site password", status: () => (account.user ? `● ${account.user.username}` : account.site ? "SIGNED OUT" : "OFFLINE") },
    ];
    for (const c of standingSheet()) out.push({ label: c.name, hint: `${c.tier} · ${c.sector} · ${standingLabel(c.standing)}`, sub: "standing", focus: `corp-${c.id}`, keywords: "corporation standing" });
    for (const a of contracts.active) out.push({ label: a.title, hint: `${a.corpName} · in hand`, sub: "board", focus: `contract-${a.id}`, keywords: "contract" });
    for (const b of gnn.posts.slice(-20)) out.push({ label: b.title || DESKS[b.desk]?.tag || "bulletin", hint: fmtAgo(b.at), sub: "gnn", focus: b.id, keywords: "gnn news" });
    void DOC;
    return out;
  },
};
