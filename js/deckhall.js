/* LIVING GALAXY — the station deck's HALL (0.3.49).
 *
 * 0.3.45 thinned the deck's Crew tab to the hiring hall and sent everything
 * else to the console. Reported back: from the hall, reaching your own crew
 * threw you out of the station into the console's glass skin — the deck is
 * where you are, so the people you are standing next to belong on it, in its
 * style. And the company registrar had gone to the console with no way to
 * type a name.
 *
 * So the HALL is the port's people, all of them, drawn in the deck's own look:
 *
 *   YOUR CREW        everyone aboard, with TALK inline (the same talk view the
 *                    interior deck uses), and the two things only a port lets
 *                    you do with them — SETTLE here, or PAY OFF (both ask twice)
 *   HIRING HALL      the port's roster, as before
 *   ON THIS FLOOR    the company's own staff at this port: the company LINE
 *                    inline (js/staffline.js topics), and RECALL
 *   REGISTRAR        no company yet: a charter, a treasury, and a NAME you type
 *
 * Split out of stationdeck.js, which is on the project's 600-line gate.
 */

import { sim, crewCapacity } from "./sim.js";
import { radar, traitAxes } from "./ui/charts.js";
import { glyphBar, sigil } from "./ui/glyphs.js";
import { crew, crewWageTotal, hireCrew, hireTerms, stationRoster, wageFor } from "./crew.js";
import { cradle } from "./npc/cradle.js";
import { CHARTERS, CHARTER_KEYS, COMPANY, company, foundCompany, hasCompany, recallStaff, staffAt, suggestName } from "./company.js";
import { settleFamily, trustOf } from "./family.js";
import { mountTalk } from "./crew/talkview.js";
import { TOPICS, callTopic, lineLog, openAsk, regardOf, cutOf, topicById } from "./staffline.js";
import { incomeOf, roleAt } from "./stationlife.js";

const DOC = globalThis.document ?? null;
const el = (tag, cls, text) => { const e = DOC.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/* what is open on the hall, kept across repaints */
const hallView = { talk: null, line: null, arm: null, rosterCache: null, said: null };

function row(parent, label, hint) {
  const r = el("div", "sd-row"), l = el("div", "sd-lab"), v = el("div", "sd-val");
  l.append(el("b", null, label));
  if (hint) l.append(el("small", null, hint));
  r.append(l, v);
  parent.append(r);
  return v;
}
function btn(text, fn, cls = "") { const b = el("button", `sd-btn ${cls}`.trim(), text); b.type = "button"; b.addEventListener("click", fn); return b; }

/** A settled hand back as a hall candidate, at list wage, no bonus. */
function candidateFor(sRec) {
  return { id: sRec.id, name: sRec.name, complexId: sRec.complexId, letter: sRec.letter, title: sRec.title, wage: wageFor(sRec.complexId, sRec.letter), complexName: sRec.complexName ?? "", traits: sRec.traits, pronouns: sRec.pronouns, gender: sRec.gender, attractedTo: sRec.attractedTo };
}

/* two taps for anything you cannot take back */
function armed(key, label, fn, cls = "") {
  const on = hallView.arm === key;
  return btn(on ? `CONFIRM ${label}` : label, () => { if (on) { hallView.arm = null; fn(); } else { hallView.arm = key; fn.repaint?.(); } }, `${cls}${on ? " sd-danger" : ""}`);
}

function crewSection(st, repaint) {
  const cap = crewCapacity();
  const sec = el("div", "sd-sec");
  sec.append(el("h4", null, `YOUR CREW — berths ${crew.aboard.length}/${cap} · payroll ${crewWageTotal()} cr/cycle`));
  if (!crew.aboard.length) sec.append(el("p", "sd-empty", "No crew signed. The ship runs quiet — the hall below is who this port has."));
  for (const m of crew.aboard) {
    const hint = m.robot
      ? `${m.title ?? "robot"} · condition ${Math.round(m.condition ?? 100)}% · ${m.kw ?? 1} kW`
      : `${m.title ?? ""} · morale ${Math.round(m.morale ?? 70)} · trust ${Math.round(trustOf(m))} · ${m.wage ?? 0} cr/cyc${m.pronouns ? ` · ${m.pronouns.subj}/${m.pronouns.obj}` : ""}`;
    const v = row(sec, `${sigil(m.id)} ${m.name}`, hint);
    v.parentElement.dataset.crew = m.id;
    const open = hallView.talk === m.id;
    v.append(btn(open ? "CLOSE" : "TALK", () => { hallView.talk = open ? null : m.id; repaint(); }, open ? "sd-accent" : ""));
    if (!m.robot) {
      const settle = () => { const e = settleFamily(m.id, "staff"); sim.notice = e ?? `${m.name} settled at ${st.name} — on ${company.name}'s books.`; if (hallView.talk === m.id) hallView.talk = null; repaint(); };
      settle.repaint = repaint;
      const pay = () => { const e = settleFamily(m.id, "payoff"); sim.notice = e ?? `${m.name} paid off at ${st.name}. Address kept.`; if (hallView.talk === m.id) hallView.talk = null; repaint(); };
      pay.repaint = repaint;
      const sb = armed(`settle:${m.id}`, "SETTLE", settle);
      if (!hasCompany()) { sb.disabled = true; sb.title = "needs a company — the registrar is below"; }
      v.append(sb, armed(`pay:${m.id}`, "PAY OFF", pay));
    }
    if (open) {
      const host = el("div", "sd-talk in-talk-host");
      v.parentElement.after(host);
      /* a topic can settle or pay them off from inside the talk — redraw the hall when they are gone */
      mountTalk(host, m.id, { btnClass: "sd-btn", onChange: () => { if (!crew.aboard.some((x) => x.id === m.id)) { hallView.talk = null; repaint(); } } });
    }
  }
  return sec;
}

function hallSection(st, repaint) {
  const cap = crewCapacity();
  const hall = el("div", "sd-sec");
  hall.append(el("h4", null, `HIRING HALL — ${st.name}`));
  hallView.rosterCache = hallView.rosterCache?.st === st.id ? hallView.rosterCache : { st: st.id, list: stationRoster(st, 0, sim.skySeed) };
  let reveal = 0;
  for (const c of hallView.rosterCache.list) {
    if (crew.aboard.some((m) => m.id === c.id)) continue;
    const rs = cradle.get(c.id)?.status;
    if (rs === "staff" || rs === "captain" || rs === "dependant" || rs === "child") continue; // on somebody's books, or too young
    const v = row(hall, `${sigil(c.id)} ${c.name} · ${c.letter}`, `${c.title} — ${c.complexName}${c.pronouns ? ` · ${c.pronouns.subj}/${c.pronouns.obj}` : ""}`);
    const terms = hireTerms(c);
    const card = el("div", "sd-person");
    const rd = radar(el("div"), traitAxes(c).map((a) => ({ ...a, value: 0.04 })), { size: 64 });
    const g1 = el("div"), g2 = el("div");
    const b1 = glyphBar(g1, { label: "GRIT", value: 0, seed: `${c.id}:grit`, cells: 10, tone: "cyan", animate: false });
    const b2 = glyphBar(g2, { label: "LOYALTY", value: 0, seed: `${c.id}:loyalty`, cells: 10, tone: "amber", animate: false });
    card.append(rd.el, g1, g2);
    const delay = 120 * reveal++;
    setTimeout(() => { rd.update(traitAxes(c)); b1.set(c.traits?.grit ?? 0.5); b2.set(c.traits?.loyalty ?? 0.5); }, delay);
    v.parentElement.classList.add("sd-row-tight");
    v.append(el("span", "sd-cr", terms.firstHand ? `${terms.wage} cr/cyc · first hand` : `${c.wage} cr/cyc · ${terms.bonus} cr bonus`), btn("SIGN", () => {
      const why = hireCrew(c, sim.ship, cap);
      if (why) sim.notice = why;
      repaint();
    }, "sd-accent"));
    v.parentElement.after(card);
  }
  return hall;
}

/* the company line, drawn in the deck's style */
function lineCard(p, repaint) {
  const box = el("div", "sd-talk sd-line");
  box.append(el("p", "sd-note", `${roleAt(p.role).label} · ${p.cycles ?? 0} cycles · mood ${Math.round(p.mood ?? 74)} · regard ${Math.round(regardOf(p))} · ${Math.round(incomeOf(p) * cutOf(p))} cr/cycle`));
  for (const e of lineLog(p, 5).slice().reverse()) box.append(el("p", `sd-note ${e.who === "you" ? "sd-you" : "sd-them"}`, `${e.who === "you" ? "You" : p.name.split(" ")[0]}: ${e.text}`));
  if (hallView.said?.id === p.id && hallView.said.why) box.append(el("p", "sd-note sd-warn", hallView.said.why));
  const ask = openAsk(p);
  if (ask && !ask.lapsed) box.append(el("p", "sd-note sd-warn", `Asking: ${ask.asks.map((a) => topicById(a)?.label.toLowerCase()).join(", or ")}.`));
  const btns = el("div", "sd-btnrow");
  for (const t of TOPICS) {
    if (t.id === "sendfor") continue;    // they are already here
    const why = t.ok(p);
    let b;
    if (t.options) {
      const sel = el("select", "sd-select");
      const opts = t.options(p);
      sel.append(el("option", null, opts.length ? "MOVE TO…" : "no other port"));
      for (const o of opts) { const op = el("option", null, `${o.label} · ${o.hint}`); op.value = o.id; sel.append(op); }
      sel.disabled = Boolean(why) || !opts.length;
      sel.addEventListener("change", () => { if (!sel.value || sel.selectedIndex === 0) return; const r = callTopic(p.id, "move", sel.value); hallView.said = { id: p.id, why: r.ok ? null : r.why }; repaint(); });
      btns.append(sel);
      continue;
    }
    const run = () => { const r = callTopic(p.id, t.id); hallView.said = { id: p.id, why: r.ok ? null : r.why }; if (t.id === "release" && r.ok) hallView.line = null; repaint(); };
    run.repaint = repaint;
    b = t.confirm ? armed(`line:${p.id}:${t.id}`, t.label.toUpperCase(), run) : btn(t.label.toUpperCase(), run, ask && ask.asks.includes(t.id) && !ask.answered ? "sd-accent" : "");
    b.title = why ?? t.hint(p);
    if (why) b.disabled = true;
    btns.append(b);
  }
  box.append(btns);
  return box;
}

function floorSection(st, repaint) {
  const cap = crewCapacity();
  const sec = el("div", "sd-sec");
  const here = staffAt(st.id);
  sec.append(el("h4", null, `${company.name.toUpperCase()} — ON THIS FLOOR · ${here.length}`));
  if (!here.length) sec.append(el("p", "sd-empty", "Nobody of yours lives here. Settle a hand at this port and they earn the company a share every cycle."));
  for (const p of here) {
    const v = row(sec, `${sigil(p.id)} ${p.name}`, `${p.title}${p.pronouns ? ` · ${p.pronouns.subj}/${p.pronouns.obj}` : ""} · ${Math.round(incomeOf(p) * cutOf(p))} cr/cycle to the company${p.family?.length ? ` · household of ${p.family.length + 1}` : ""}`);
    v.parentElement.dataset.staff = p.id;
    const open = hallView.line === p.id;
    v.append(btn(open ? "CLOSE" : "LINE", () => { hallView.line = open ? null : p.id; repaint(); }, open || (openAsk(p) && !openAsk(p).lapsed) ? "sd-accent" : ""));
    v.append(btn("RECALL", () => {
      const sRec = recallStaff(p.id);
      if (!sRec) return;
      const why = hireCrew(candidateFor(sRec), sim.ship, cap);
      if (why) sim.notice = why;
      if (hallView.line === p.id) hallView.line = null;
      repaint();
    }));
    if (open) v.parentElement.after(lineCard(p, repaint));
  }
  return sec;
}

function registrarSection(st, repaint) {
  const sec = el("div", "sd-sec");
  sec.append(el("h4", null, "THE REGISTRAR"));
  sec.append(el("p", "sd-note", `A charter, a treasury, a board — ${COMPANY.registration.toLocaleString()} cr at ${st.name}. Settled hands, drones and company hulls all need one.`));
  if (st.hostile && !st.claimed) { sec.append(el("p", "sd-empty", "A free port keeps no registrar.")); return sec; }
  const form = el("div", "sd-form");
  const name = el("input", "sd-input");
  name.type = "text";
  name.maxLength = 28;
  name.placeholder = suggestName();
  name.setAttribute("aria-label", "Company name");
  name.autocomplete = "off";
  const sel = el("select", "sd-select");
  for (const k of CHARTER_KEYS) { const o = el("option", null, CHARTERS[k].name); o.value = k; if (k === (st.sector === "pirate" ? "civilian" : st.sector) || (k === "industrial" && !CHARTERS[st.sector])) o.selected = true; sel.append(o); }
  const go = btn("REGISTER", () => {
    const e = foundCompany(name.value.trim(), sel.value);
    sim.notice = e ?? `${company.name} is registered at ${st.name}.`;
    repaint();
  }, "sd-accent");
  form.append(name, sel, go);
  sec.append(form);
  return sec;
}

/** The HALL tab. `repaint` redraws the deck body. */
export function hallPanel(body, st, repaint) {
  body.append(crewSection(st, repaint), hallSection(st, repaint));
  body.append(hasCompany() ? floorSection(st, repaint) : registrarSection(st, repaint));
}

/** Forget the cached hall roster (a new dock). */
export function resetHall() { hallView.rosterCache = null; hallView.talk = null; hallView.line = null; hallView.arm = null; hallView.said = null; }
