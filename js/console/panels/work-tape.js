/* LIVING GALAXY — CONSOLE › WORK › TAPE: what the pilot did, and what it paid.
 *
 * The readout for js/recorder.js. Three things, in the order a pilot wants
 * them:
 *
 *   1. What is on the tape right now — how many of the records are the pilot's
 *      own hands versus ARIA's watch, what kinds of action they are, and how
 *      long a stretch of flying that covers. The player/ARIA split is the
 *      number that matters: a tape that is nine-tenths ARIA is ARIA's tape,
 *      not training data for imitating a human, and the panel says so out loud
 *      rather than letting a chart imply otherwise.
 *
 *   2. WHAT WOULD I DO HERE — the nearest states on the tape to the one the
 *      ship is in this second, and what was done from them. This is the tape
 *      being useful without a model attached: it is a k-nearest lookup over
 *      the same feature vector a trained policy would read, so if it returns
 *      nonsense the features are wrong and no amount of training will fix it.
 *      Better to find that out from a panel than from a bad ARIA.
 *
 *   3. EXPORT — the whole thing as JSONL, through a Blob, because the pilot is
 *      on a phone and there is no server to POST to.
 *
 * Nothing here writes to the tape except CLEAR. Opening a panel about the
 * recording must not change the recording, beyond the tap that opened it.
 */

import { el, section, note, row, button, chips } from "../kit.js";
import { sim } from "../../sim.js";
import { recorder, recorderReport, neighbours, snapshot, downloadTape, clearTape, saveTape, tape } from "../../recorder.js";

const DOC = globalThis.document ?? null;
void DOC;

const tell = (msg) => { if (msg) { sim.notice = msg; sim.noticeAt = sim.wall; } };
const pct = (v) => `${Math.round(v * 100)}%`;
const secs = (n) => (n >= 3600 ? `${(n / 3600).toFixed(1)} h` : n >= 60 ? `${Math.round(n / 60)} min` : `${Math.round(n)} s`);

/* ---- 1. the tape ---------------------------------------------------------- */

function statusSection(render) {
  const r = recorderReport();
  const s = section(`TAPE — ${r.total.toLocaleString()} record${r.total === 1 ? "" : "s"}`);

  if (!r.total) {
    note(s, "Nothing recorded yet. Every control you touch, every order you give and every mission you start goes on the tape with the state of the ship at that instant and what changed over the half-minute after it — which is the shape a policy is trained from.");
  } else {
    row(s, "Your own hands", { value: r.mine.toLocaleString(), hint: `over ${secs(r.span)} of flying${r.mine ? ` · ${r.settled} settled` : ""}` });
    row(s, "ARIA's watch", { value: r.aria.toLocaleString(), hint: r.aria ? "kept and labelled separately — a core trained on its own output learns its own habits, not yours" : "ARIA has not held the conn yet" });
    if (r.dropped) row(s, "Rolled off", { value: r.dropped.toLocaleString(), hint: `the tape is a ring of ${recorder.tape.length + r.dropped >= 4000 ? "4,000" : "4,000"} — the oldest go first` });
    if (r.top.length) {
      const bits = r.top.map(([k, n]) => `${k} ${n}`).join(" · ");
      note(s, `What is on it: ${bits}.`);
    }
    if (r.mine && r.settled) note(s, `Credits earned inside the half-minute after one of your actions: ${r.earned.toLocaleString()} cr across ${r.settled} settled records.`);
  }

  const on = row(s, "Recording", { value: "", hint: "off keeps what is already on the tape and stops adding to it" });
  on.value.append(chips([{ id: "on", label: "ON" }, { id: "off", label: "OFF" }], {
    value: recorder.on ? "on" : "off",
    onPick: (id) => { recorder.on = id === "on"; render(); },
  }).row);
  return s;
}

/* ---- 2. what would I do here ---------------------------------------------- */

function neighbourSection() {
  const s = section("WHAT WOULD I DO HERE");
  const now = snapshot(true);
  if (!now) { note(s, "No read of the ship yet."); return s; }
  const near = neighbours(now, 8, { by: "player" });
  if (!near.length) {
    note(s, "Nothing of yours on the tape to compare this to yet. Fly a while.");
    return s;
  }
  note(s, `Now: hull ${pct(now.hull)} · hold ${pct(now.hold)} · ${now.dk ? "docked" : now.seam >= 0 ? `seam ${Math.round(now.seam)} km` : "open space"}${now.hz ? ` · ${now.hz} hostile` : ""}.`);
  /* Group the near neighbours by what was actually done, so the answer is
   * "you cut, mostly" rather than eight rows the pilot has to read. */
  const votes = new Map();
  for (const n of near) {
    const k = `${n.r.kind}:${n.r.act}${n.r.arg ? ` ${n.r.arg}` : ""}`;
    const v = votes.get(k) ?? { n: 0, best: n.dist, cr: 0 };
    v.n++;
    v.best = Math.min(v.best, n.dist);
    v.cr += n.r.d?.cr ?? 0;
    votes.set(k, v);
  }
  for (const [k, v] of [...votes].sort((a, b) => b[1].n - a[1].n || a[1].best - b[1].best).slice(0, 6)) {
    row(s, k, { value: `${v.n}/${near.length}`, hint: `closest match ${v.best.toFixed(2)}${v.cr ? ` · ${Math.round(v.cr).toLocaleString()} cr after` : ""}` });
  }
  return s;
}

/* ---- 3. off the phone ------------------------------------------------------ */

function exportSection(render) {
  const s = section("EXPORT");
  const r = recorderReport();
  note(s, "One JSON object per line: a header with the feature order, then every record with its state, the action, and what the numbers did after it. Readable by anything that reads JSONL.");
  const rr = row(s, "Download", { value: "", hint: r.total ? `${r.total.toLocaleString()} records · roughly ${Math.max(1, Math.round(r.total * 0.22))} KB` : "nothing to write yet" });
  const dl = button("TAPE.JSONL", () => {
    if (!recorderReport().total) { tell("Nothing on the tape yet."); return; }
    downloadTape();
    tell("Tape written to your downloads.");
  }, "accent");
  dl.disabled = !r.total;
  rr.value.append(dl);

  const sv = row(s, "Keep across reloads", { value: "", hint: "the newest 1,200 records are written to this device on their own; this forces it now" });
  sv.value.append(button("SAVE NOW", () => { tell(`${saveTape().toLocaleString()} records kept on this device.`); }, "tiny"));

  const cl = row(s, "Start over", { value: "", hint: "throws away the tape on this device — there is no undo" });
  cl.value.append(button("CLEAR", () => { clearTape(); tell("Tape cleared."); render(); }, "danger tiny"));
  return s;
}

/* ---- the panel -------------------------------------------------------------- */

export default {
  id: "work-tape",
  title: "TAPE",
  order: 40,
  subtabs: [],
  mount(root, ctx) {
    const host = el("div", "ttape");
    root.append(host);
    let sig = "";
    /* Repaint when the tape actually moved, not every frame: this panel reads
     * the whole ring to build its report and the console paints at frame rate. */
    const signature = () => `${recorder.seq}|${recorder.on ? 1 : 0}|${Math.floor((sim.time ?? 0) / 4)}`;
    const render = () => {
      sig = signature();
      host.replaceChildren(statusSection(render), neighbourSection(), exportSection(render));
    };
    render();
    ctx?.push?.(() => { if (signature() !== sig) render(); });
    return null;
  },
  paint() {},
  unmount() {},
  search() {
    return [
      { label: "Export the tape", hint: "your actions as JSONL training data", sub: "tape", keywords: "tape telemetry export training data log actions jsonl", run: () => downloadTape() },
      { label: "Tape", hint: `${tape({ by: "player" }).length} of your own actions recorded`, sub: "tape", keywords: "tape log actions recording training" },
    ];
  },
};
