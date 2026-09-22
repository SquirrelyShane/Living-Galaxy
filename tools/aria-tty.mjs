/* LIVING GALAXY — the pit screen: one ARIA instance, drawn in a terminal.
 *
 * 0.3.24. A scrolling log is a bad instrument. You cannot see at a glance
 * whether a career is making money, what it is doing right now, or how far
 * through the job it is — the numbers you want are always four screens up.
 *
 * So each instance holds a STATIC screen instead: a frame that repaints in
 * place, with the pilot's name and career in the career's own colour, the
 * purse and the rate, bars for the things that are fractions of something
 * (hold, charge, hull, job progress, the clock on the contract), the move in
 * hand, what the autopilot is doing about it, what the brain has learned so
 * far, and a short tail of events under it. Run four terminals side by side
 * and the four careers are legible at a glance — which is the whole point of
 * running four.
 *
 * Plain ANSI: no curses, no dependency, works over ssh and in Termux. It
 * writes to stderr-free stdout, restores the cursor on exit, and falls back to
 * appending lines when stdout is not a TTY (a pipe, a log file, CI), so
 * `node tools/aria-play.mjs … > run.log` still produces something readable.
 */

const ESC = "\u001b[";
export const sgr = (...n) => `${ESC}${n.join(";")}m`;
const RESET = sgr(0);

/* 256-colour, so it looks the same in Termux, xterm and whatever the phone is
 * running. One hue per career: you learn the colour, not the label. */
export const CAREER_COLOUR = {
  mining:        { fg: 214, name: "MINING",        rule: "▰" },   // ore orange
  commerce:      { fg: 220, name: "COMMERCE",      rule: "▰" },   // coin gold
  logistics:     { fg: 45,  name: "LOGISTICS",     rule: "▰" },   // lane cyan
  security:      { fg: 203, name: "SECURITY",      rule: "▰" },   // gun red
  salvage:       { fg: 130, name: "SALVAGE",       rule: "▰" },   // rust
  manufacturing: { fg: 111, name: "MANUFACTURING", rule: "▰" },   // steel blue
  construction:  { fg: 108, name: "CONSTRUCTION",  rule: "▰" },
  shipyard:      { fg: 146, name: "SHIPYARD",      rule: "▰" },
  energy:        { fg: 190, name: "ENERGY",        rule: "▰" },   // reactor lime
  research:      { fg: 141, name: "RESEARCH",      rule: "▰" },   // survey violet
  navigation:    { fg: 75,  name: "NAVIGATION",    rule: "▰" },
  terraforming:  { fg: 78,  name: "TERRAFORMING",  rule: "▰" },
  healthcare:    { fg: 218, name: "HEALTHCARE",    rule: "▰" },   // clinic pink
  education:     { fg: 152, name: "EDUCATION",     rule: "▰" },
  agriculture:   { fg: 114, name: "AGRICULTURE",   rule: "▰" },   // crop green
  communications:{ fg: 123, name: "COMMUNICATIONS",rule: "▰" },
};
const DEFAULT = { fg: 252, name: "PILOT", rule: "▰" };
export const colourFor = (career) => CAREER_COLOUR[career] ?? DEFAULT;

const c = (fg, s) => `${sgr(38, 5, fg)}${s}${RESET}`;
const dim = (s) => `${sgr(2)}${s}${RESET}`;
const bold = (s) => `${sgr(1)}${s}${RESET}`;

/** Visible width: strip the escapes before measuring, or every column is wrong. */
const plain = (s) => String(s).replace(/\u001b\[[0-9;]*m/g, "");
const width = (s) => [...plain(s)].length;
const pad = (s, n) => s + " ".repeat(Math.max(0, n - width(s)));
const clip = (s, n) => (width(s) <= n ? s : `${[...plain(s)].slice(0, Math.max(0, n - 1)).join("")}…`);

/**
 * A bar. `v` is 0…1. Colour shifts on the value when `warn` is set, so a
 * battery at 12% reads as a problem without anybody writing the word.
 */
export function bar(v, n = 18, fg = 250, { warn = false } = {}) {
  const f = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
  const on = Math.round(f * n);
  const hue = warn ? (f < 0.2 ? 203 : f < 0.45 ? 214 : 78) : fg;
  return `${c(hue, "█".repeat(on))}${dim("░".repeat(n - on))}`;
}

export const money = (n) => Math.round(n).toLocaleString("en-US");
const clock = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/**
 * The screen. `mk = makeScreen({ career, name, hull, sky, server, cols })`,
 * then `mk.draw(state)` as often as you like — it repaints in place.
 */
export function makeScreen({ career, name, hull, sky, server, minutes, speed, cols = 0, tty = null } = {}) {
  const out = process.stdout;
  const live = tty ?? Boolean(out.isTTY);
  const W = () => Math.max(56, Math.min(110, cols || out.columns || 80));
  const col = colourFor(career);
  let painted = 0;
  let lastPlain = "";

  const rule = (ch = "─") => dim(ch.repeat(W()));
  const title = () => {
    const left = `${bold(c(col.fg, ` ${col.rule} ${name} `))}${c(col.fg, col.name)}`;
    const right = dim(`${sky} · ${hull ?? "—"} · ${speed}×${minutes ? ` · ${minutes}m` : ""}`);
    return pad(left, W() - width(right)) + right;
  };

  /** One "label bar value" row. */
  const meter = (label, v, text, fg = col.fg, opts = {}) =>
    `  ${dim(pad(label, 9))}${bar(v, Math.max(10, Math.floor(W() * 0.28)), fg, opts)} ${pad(text, 22)}`;

  const kv = (label, value, fg = 252) => `  ${dim(pad(label, 9))}${c(fg, value)}`;

  function frame(s) {
    const w = W();
    const L = [];
    L.push(title());
    L.push(rule("═"));
    /* the money line: the whole point of the run */
    const net = s.net ?? 0;
    const netC = net > 0 ? 78 : net < 0 ? 203 : 250;
    L.push(`  ${dim(pad("PURSE", 9))}${bold(c(col.fg, `${money(s.credits ?? 0)} cr`))}   ${c(netC, `${net >= 0 ? "+" : ""}${money(net)}`)} ${dim("on the run")}   ${c(netC, `${s.perMin >= 0 ? "+" : ""}${money(s.perMin ?? 0)}/min`)}`);
    L.push(kv("SKY", `${clock(s.secs ?? 0)}  ${dim("·")}  ${s.done ?? 0} done  ${dim("·")}  ${s.failed ?? 0} dropped  ${dim("·")}  ${s.decisions ?? 0} calls`, 252));
    L.push("");
    /* the hull */
    L.push(meter("HOLD", s.hold ?? 0, `${Math.round((s.holdQty ?? 0))}/${Math.round(s.cargoCap ?? 0)} ${s.holdTop ? dim(`· ${s.holdTop}`) : ""}`, 111));
    L.push(meter("CHARGE", s.charge ?? 0, `${Math.round((s.charge ?? 0) * 100)}%`, 190, { warn: true }));
    L.push(meter("HULL", s.hull ?? 1, `${Math.round((s.hull ?? 1) * 100)}%`, 203, { warn: true }));
    L.push("");
    /* the job */
    L.push(`  ${dim(pad("MOVE", 9))}${s.move ? c(col.fg, clip(s.move, w - 12)) : dim("thinking…")}`);
    if (s.jobLine) L.push(`  ${dim(pad("JOB", 9))}${clip(s.jobLine, w - 12)}`);
    if (s.progress != null) L.push(meter("PROGRESS", s.progress, `${Math.round(s.progress * 100)}%`, col.fg));
    if (s.deadline != null) L.push(meter("CLOCK", s.deadline, clock(s.deadlineS ?? 0), 214, { warn: true }));
    L.push(`  ${dim(pad("HELM", 9))}${s.handling ? c(214, clip(`berth · ${s.handling}`, w - 12)) : s.task ? clip(s.task, w - 12) : dim("—")}`);
    if (s.chain) L.push(`  ${dim(pad("CHAIN", 9))}${c(col.fg, clip(s.chain, w - 12))}`);
    if (s.sees) L.push(`  ${dim(pad("SEES", 9))}${dim(clip(s.sees, w - 12))}`);
    if (s.biz) L.push(`  ${dim(pad("BRIDGE", 9))}${clip(s.biz, w - 12)}`);
    if (s.business?.board?.length) L.push(`  ${dim(pad("BOARD", 9))}${dim(s.business.board.map((b) => `${b.role} ${b.verdict}`).join(" · "))}  ${dim(`confidence ${Math.round((s.business.confidence ?? 0) * 100)}%`)}`);
    L.push("");
    /* what it has learned */
    L.push(`  ${dim("WHAT PAYS")}`);
    const best = (s.best ?? []).slice(0, 4);
    if (!best.length) L.push(dim("    nothing scored yet"));
    for (const b of best) {
      const share = Math.max(0, Math.min(1, b.perMin / Math.max(1, best[0].perMin)));
      L.push(`    ${bar(share, 14, col.fg)} ${pad(`${money(b.perMin)}/min`, 12)}${dim(pad(clip(b.key, 26), 27))}${dim(`${b.runs} run${b.runs === 1 ? "" : "s"}${b.fails ? `, ${b.fails} dropped` : ""}`)}`);
    }
    L.push("");
    L.push(rule());
    for (const e of (s.log ?? []).slice(-5)) L.push(`  ${dim(clock(e.t))} ${clip(e.text, w - 10)}`);
    const room = 5 - Math.min(5, (s.log ?? []).length);
    for (let i = 0; i < room; i++) L.push("");
    L.push(rule());
    L.push(`  ${s.online === null ? dim("relay off") : s.online ? c(78, `relay up · ${s.peers ?? 0} other hull${s.peers === 1 ? "" : "s"} in ${sky}`) : c(203, `relay down · ${server}`)}${dim("   ctrl-c to stop")}`);
    return L;
  }

  return {
    live,
    draw(s) {
      const L = frame(s);
      if (!live) {
        /* piped: one compact line, only when something changed */
        const line = `${name} ${clock(s.secs ?? 0)} ${money(s.credits ?? 0)}cr ${s.perMin >= 0 ? "+" : ""}${s.perMin}/min ${s.done}/${s.done + s.failed} ${s.move ?? "thinking"} ${s.task ?? ""}`;
        if (line !== lastPlain) { lastPlain = line; out.write(`${line}\n`); }
        return;
      }
      /* repaint in place: home the cursor, overwrite, clear each line's tail */
      out.write(painted ? `${ESC}${painted}A` : `${ESC}?25l`);
      for (const l of L) out.write(`\r${ESC}2K${l}\n`);
      painted = L.length;
    },
    /** A closing frame that stays on the screen, and the cursor back. */
    end(s, why = "") {
      if (live) { this.draw(s); process.stdout.write(`${ESC}?25h`); }
      const line = `\n  ${bold(c(colourFor(career).fg, `${name} · ${colourFor(career).name}`))} ${dim(why)}\n`;
      process.stdout.write(live ? line : `${plain(line)}`);
    },
    colour: col,
  };
}

/** For a bench table: the career's colour applied to a cell. */
export const tint = (career, s) => c(colourFor(career).fg, s);
export { c as paint, dim, bold, plain, pad, clip };
