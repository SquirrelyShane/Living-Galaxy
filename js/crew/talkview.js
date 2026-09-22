/* LIVING GALAXY — the talk view.
 *
 * One DOM for talking to a hand, mounted by CONSOLE › CREW › TALK and by the
 * interior deck (interior.js paintDialogue). Portrait line, trust tier +
 * morale, greeting, topic buttons (locked ones greyed with the unlock hint),
 * choice buttons after a line, a free-text line answered by talk.answerFreeText,
 * and the last six exchanges from memory. Contract: PLAN.md §4.2, §3 CREW › TALK.
 *
 * Uses the interior's `.in-talk-*` classes (interior.css) so it reads the same
 * on the deck and in the console; button classes are the caller's.
 */

import { crew, bondLine } from "../crew.js";
import { familyOf, trustOf } from "../family.js";
import { cradle, traitLine } from "../npc/cradle.js";
import { RACES } from "../races.js";
import { topicsFor, lockedTopicsFor, open, choose, answerFreeText, greet, talkLog, tierOf, TIER_NAMES } from "./talk.js";
import { beatsFor, playBeat, isRunning, advanceBeat } from "./beats.js";

const DOC = globalThis.document ?? null;

function mk(tag, cls, text) {
  const n = DOC.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function subLine(m) {
  const race = RACES.find((r) => r.id === m.raceId);
  const fam = familyOf(m);
  const bond = bondLine(m);
  const bits = [race?.name, m.title, m.robot ? null : `${m.complexName} ${m.letter}`, m.pronouns ? `${m.pronouns.subj}/${m.pronouns.obj}` : null];
  if (m.robot) bits.push(`condition ${Math.round(m.condition ?? 100)}%`, `${m.kw ?? 1} kW`);
  else bits.push(`morale ${Math.round(m.morale ?? 70)}`, `trust ${Math.round(trustOf(m))} · ${TIER_NAMES[tierOf(m)]}`);
  if (bond) bits.push(bond); else if (m.partner === "player") bits.push("with you");
  if (fam.children.length) bits.push(`${fam.children.length} child${fam.children.length > 1 ? "ren" : ""}`);
  bits.push(traitLine(cradle.get(m.id) ?? m));
  return bits.filter(Boolean).join(" · ");
}

/**
 * mountTalk(host, memberId, { onChange, extra, btnClass }) → refresher.
 * `extra` = [{ label, cls?, run() → string? }] appended after the topics (conn,
 * dismiss, close…); a returned string becomes the spoken line. `onChange()` fires after every exchange so the caller can
 * repaint whatever else it shows. The refresher re-paints the status line.
 */
export function mountTalk(host, memberId, { onChange = null, extra = [], btnClass = "tbtn" } = {}) {
  if (!host || !DOC) return () => {};
  const m = crew.aboard.find((x) => x.id === memberId);
  host.innerHTML = "";
  if (!m) { host.append(mk("div", "tempty", "Nobody selected. Pick a hand on the roster.")); return () => {}; }

  const view = { line: greet(m), choices: null, topic: null };
  const name = mk("div", "in-talk-nm", m.name);
  const sub = mk("div", "in-talk-sub", subLine(m));
  const line = mk("div", "in-talk-line", view.line);
  const barWrap = mk("div", "in-talk-beat");
  barWrap.hidden = true;
  const barLbl = mk("div", "in-talk-beat-lbl", "");
  const bar = mk("div", "in-talk-beat-track");
  const barFill = mk("div", "in-talk-beat-fill");
  bar.append(barFill);
  const barTag = mk("div", "in-talk-beat-tag", "");
  barWrap.append(barLbl, bar, barTag);
  const opts = mk("div", "in-talk-opts");
  const free = mk("div", "in-talk-opts");
  const log = mk("div", "in-talk-log");
  host.append(name, sub, line, barWrap, opts, free, log);

  const gone = () => !crew.aboard.includes(m);
  const btn = (label, fn, cls = "", disabled = false, title = "") => {
    const b = mk("button", `${btnClass} ${cls}`.trim(), label);
    b.type = "button";
    if (disabled) { b.disabled = true; b.classList.add("locked"); }
    if (title) b.title = title;
    b.addEventListener("click", fn);
    return b;
  };

  const paintLog = () => {
    log.innerHTML = "";
    const entries = talkLog(m, 6);
    if (!entries.length) { log.hidden = true; return; }
    log.hidden = false;
    for (const e of entries) log.append(mk("div", null, `${e.choice ? "↳ " : ""}${e.label ? `${e.label} — ` : ""}${e.line}`));
  };

  const after = () => {
    line.textContent = view.line;
    sub.textContent = gone() ? `${m.name} has left the ship.` : subLine(m);
    paintOpts();
    paintLog();
    onChange?.();
  };

  const paintOpts = () => {
    opts.innerHTML = "";
    if (gone()) { for (const x of extra) if (/close/i.test(x.label)) opts.append(btn(x.label, x.run, x.cls ?? "")); return; }
    if (isRunning(m.id) || view.beating) {
      /* 0.3.17: a scene waits on you — its answers, and a way out */
      for (const ch of view.beatChoices ?? []) opts.append(btn(ch.label, () => { advanceBeat(m.id, ch.id); }, "accent"));
      opts.append(btn("Let it drop", () => { view.stopBeat?.(); view.beating = false; view.stopBeat = null; view.beatChoices = null; barWrap.hidden = true; after(); }, "danger"));
      return;
    }
    if (view.choices?.length) {
      /* a line is waiting on an answer */
      for (const ch of view.choices) opts.append(btn(ch.label, () => {
        const r = choose(m, view.topic, ch.id);
        view.line = r.text;
        view.choices = r.choices?.length ? r.choices : null;
        if (!view.choices) view.topic = null;
        after();
      }, ch.cls ?? ""));
      opts.append(btn("Leave it", () => { view.choices = null; view.topic = null; after(); }));
      return;
    }
    for (const beat of beatsFor(m)) {
      /* ▶ marks a scene (several answers, a bar that moves as you answer) apart from a one-line topic */
      opts.append(btn(`▶ ${beat.label}`, () => {
        view.beating = true;
        barWrap.hidden = false;
        barFill.style.width = "0%";
        barFill.classList.remove("ok", "bad");
        barTag.textContent = "";
        barLbl.textContent = beat.label;
        view.stopBeat = playBeat(m, beat.id, {
          onStep: ({ frac, line: ln, tag, ok, choices, i, n }) => {
            barFill.style.width = `${Math.round(frac * 100)}%`;
            barFill.classList.toggle("ok", ok === true);
            barFill.classList.toggle("bad", ok === false);
            if (ln) view.line = ln;
            barTag.textContent = n && i < n ? `${tag ?? beat.label} · ${i + 1}/${n}` : (tag ?? beat.label);
            view.beatChoices = choices ?? null;
            line.textContent = view.line;
            /* the answers are buttons: repaint them for the new stage */
            if (view.beating && choices?.length) paintOpts();
          },
          onDone: (res) => {
            view.beating = false;
            view.beatChoices = null;
            view.stopBeat = null;
            view.line = res.line || view.line;
            barFill.style.width = "100%";
            barFill.classList.toggle("ok", res.ok === true);
            barFill.classList.toggle("bad", res.ok === false);
            barTag.textContent = res.cancelled ? "stopped" : (res.tag || (res.ok ? "buff" : "debuff"));
            after();
          },
        });
        after();
      }, beat.kind === "romance" ? "accent" : ""));
    }
    /* a beat that stages the same subject replaces the one-tap topic, so the
     * list does not carry two identical labels doing different things */
    const staged = new Set(beatsFor(m).map((b) => b.replaces).filter(Boolean));
    for (const tp of topicsFor(m)) {
      if (staged.has(tp.id)) continue;
      opts.append(btn(tp.label, () => {
        barWrap.hidden = true;                     // the last scene's bar is not this conversation's
        const r = open(m, tp.id);
        view.line = r.text || view.line;
        view.choices = r.choices.length ? r.choices : null;
        view.topic = r.choices.length ? tp.id : null;
        after();
      }, tp.cls ?? ""));
    }
    for (const tp of lockedTopicsFor(m)) opts.append(btn(`${tp.label} · ${tp.why}`, () => {}, "muted", true, tp.why));
    for (const x of extra) opts.append(btn(x.label, () => { const r = x.run(); if (typeof r === "string" && r) view.line = r; if (!gone() || r) after(); }, x.cls ?? ""));
  };

  /* free text */
  const input = mk("input", "tinput");
  input.type = "text";
  input.placeholder = m.robot ? "Query…" : `Say something to ${m.name.split(" ")[0]}…`;
  input.autocomplete = "off";
  input.style.flex = "1";
  const send = () => {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    view.line = answerFreeText(m, text);
    view.choices = null; view.topic = null;
    after();
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); send(); } });
  free.append(input, btn("SAY", send));

  paintOpts();
  paintLog();
  /* The refresher the console ticks, with a teardown hung off it: switching
   * hands or closing the sheet used to leave a beat running against a panel
   * that was no longer on screen. */
  const refresh = () => {
    if (gone()) { if (!/left the ship/.test(sub.textContent)) after(); return; }
    sub.textContent = subLine(m);
  };
  refresh.stop = () => { view.stopBeat?.(); view.stopBeat = null; view.beating = false; view.beatChoices = null; };
  return refresh;
}

export default mountTalk;
