// node --import ./test/three-register.mjs test/recorder.test.mjs — the tape (js/recorder.js)
//
// The recorder is a LEAF: no game imports, the world read is handed in. So the
// whole thing drives here with a fake ship and no browser, which is the point
// of building it that way — a logger you cannot test is a logger you cannot
// trust, and this one is meant to produce training data.
import assert from "node:assert/strict";

let pass = 0, fail = 0;
const t = async (name, fn) => {
  try { await fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.log(`FAIL  ${name}\n      ${e.stack ?? e.message}`); fail++; }
};

const {
  recorder, record, settle, snapshot, tape, tapeJSONL, recorderReport, neighbours,
  wireRecorder, resetRecorder, flushPending, describeTarget, STATE_KEYS, clearTape,
} = await import("../js/recorder.js");

/* a world we drive by hand */
const W = { t: 0, hull: 1, hold: 0, cr: 1000, spd: 0, chg: 1, dk: 0, ap: 0, ms: 0, hz: 0, tm: 0, mm: 0, ph: 1, seam: 120, port: 40, bus: 0.3 };
let who = "player";
wireRecorder({ sample: () => ({ ...W }), who: () => who, captureTaps: false });

await t("a record carries the whole feature vector, in a fixed order", () => {
  resetRecorder();
  W.t = 10;
  const r = record("order", "cutter", "closest");
  assert.ok(r, "a record came back");
  assert.deepEqual(Object.keys(r.s), STATE_KEYS, "state keys are the declared vector, in order");
  assert.equal(r.kind, "order");
  assert.equal(r.act, "cutter");
  assert.equal(r.arg, "closest");
  assert.equal(r.by, "player");
  for (const k of STATE_KEYS) assert.equal(typeof r.s[k], "number", `${k} is a number`);
});

await t("who acted is recorded, and the reader defaults to the pilot's own hands", () => {
  resetRecorder();
  W.t = 20; record("order", "throttle", "1.00");
  who = "aria";
  W.t = 21; record("order", "throttle", "0.00");
  who = "player";
  assert.equal(tape().length, 1, "tape() is the player's by default");
  assert.equal(tape({ by: "aria" }).length, 1, "ARIA's is kept, separately");
  assert.equal(tape({ by: null }).length, 2, "and both are there when asked for");
});

await t("an outcome is settled onto the record after its window", () => {
  resetRecorder();
  W.t = 100; W.cr = 1000; W.hull = 1;
  const r = record("mission", "SELL", "Kessler Reach");
  assert.equal(r.d, null, "not settled while the window is open");
  W.t = 115; W.cr = 1400;
  settle();
  assert.equal(r.d, null, "still open at 15 s");
  W.t = 131; W.cr = 1900; W.hull = 0.8;
  assert.equal(settle(), 1, "one record settled");
  assert.equal(r.d.cr, 900, "credits over the window");
  assert.ok(Math.abs(r.d.hull + 0.2) < 1e-6, "hull over the window");
  assert.ok(r.d.dt >= 30, "and how long it watched");
});

await t("a state read is reused inside the same instant and refreshed after it", () => {
  resetRecorder();
  W.t = 200; W.hold = 0.1;
  const a = record("tap", "btn-con");
  W.hold = 0.9;                      // same instant: the tape must not see this
  const b = record("tap", "btn-map");
  assert.equal(b.s.hold, a.s.hold, "two taps in one instant share one read");
  W.t = 201;
  const c = record("tap", "btn-cam");
  assert.equal(c.s.hold, 0.9, "the next instant reads the world again");
});

await t("the tape is a ring and never grows without bound", () => {
  resetRecorder();
  for (let i = 0; i < 4200; i++) { W.t = 300 + i; record("tap", `b${i}`); }
  assert.equal(recorder.tape.length, 4000, "capped");
  assert.ok(recorder.dropped >= 200, `${recorder.dropped} rolled off the front`);
  assert.equal(recorder.tape[recorder.tape.length - 1].act, "b4199", "the newest is kept");
});

await t("flush closes every open record where it stands", () => {
  resetRecorder();
  W.t = 500; W.cr = 100;
  record("order", "system", "lights");
  W.t = 505; W.cr = 160;
  flushPending();
  const r = tape()[0];
  assert.equal(r.d.cr, 60);
  assert.equal(r.d.partial, 1, "and says it was cut short");
  assert.equal(recorder.pending.length, 0);
});

await t("JSONL is a header line then one object per record", () => {
  resetRecorder();
  W.t = 600; record("order", "cutter", "off");
  W.t = 601; record("tap", "btn-map");
  const lines = tapeJSONL().split("\n");
  assert.equal(lines.length, 3, "header + two records");
  const head = JSON.parse(lines[0]);
  assert.deepEqual(head.keys, STATE_KEYS, "the header states the feature order");
  const one = JSON.parse(lines[1]);
  assert.equal(one.act, "cutter");
  for (const l of lines) assert.doesNotThrow(() => JSON.parse(l), "every line parses alone");
});

await t("nearest states are the ones a policy would call similar", () => {
  resetRecorder();
  /* three situations, each with the thing the pilot did in it */
  W.t = 700; W.hull = 1.0; W.hold = 0.05; W.dk = 0; W.seam = 20; W.hz = 0;
  record("order", "cutter", "closest");          // empty hold, seam close: cut
  W.t = 701; W.hull = 1.0; W.hold = 0.95; W.dk = 0; W.seam = 20;
  record("mission", "DOCK", "best-buyer");        // full hold: go sell
  W.t = 702; W.hull = 0.3; W.hold = 0.5; W.dk = 0; W.seam = 20;
  record("mission", "DOCK", "repair yard");       // hurt: go home

  const near = neighbours({ ...W, t: 800, hull: 1.0, hold: 0.02, dk: 0, seam: 25, hz: 0, port: 40, chg: 1 }, 1);
  assert.equal(near[0].r.act, "cutter", "an empty hold beside a seam looks like the time we cut");

  const hurt = neighbours({ ...W, t: 801, hull: 0.28, hold: 0.5, dk: 0, seam: 25, hz: 0, port: 40, chg: 1 }, 1);
  assert.equal(hurt[0].r.arg, "repair yard", "a hurt hull looks like the time we went home");
});

await t("the report separates the pilot from ARIA", () => {
  resetRecorder();
  W.t = 900; W.cr = 0;
  record("tap", "btn-con");
  record("order", "cutter", "closest");
  who = "aria";
  record("mission", "MINE", "a seam");
  who = "player";
  const r = recorderReport();
  assert.equal(r.mine, 2);
  assert.equal(r.aria, 1);
  assert.equal(r.total, 3);
  assert.equal(r.byKind.tap, 1);
  assert.equal(r.byKind.order, 1, "ARIA's mission is not counted in the pilot's kinds");
});

await t("recording off keeps what is there and stops adding", () => {
  resetRecorder();
  W.t = 1000; record("tap", "a");
  recorder.on = false;
  assert.equal(record("tap", "b"), null, "nothing filed while off");
  assert.equal(recorder.tape.length, 1, "and what was there is kept");
  recorder.on = true;
  W.t = 1001; record("tap", "c");
  assert.equal(recorder.tape.length, 2);
});

await t("a tap resolves to the control the pilot would name", () => {
  /* the smallest DOM this needs; describeTarget only walks parentElement */
  const mk = (tag, props = {}, parent = null) => {
    const el = {
      tagName: tag.toUpperCase(), id: props.id ?? "", textContent: props.text ?? "",
      classList: { contains: (c) => (props.cls ?? []).includes(c) },
      getAttribute: (a) => (a === "aria-label" ? props.label ?? null : a === "data-panel" ? props.panel ?? null : null),
      closest: (sel) => (sel === "[data-panel]" ? (props.panel ? el : null) : null),
      parentElement: parent,
    };
    return el;
  };
  const btn = mk("button", { id: "btn-aria", label: "ARIA takes the conn", panel: "work" });
  const hit = describeTarget(btn);
  assert.equal(hit.act, "btn-aria", "the id is the identity");
  assert.equal(hit.arg, "ARIA takes the conn", "with the label beside it");

  const span = mk("span", { text: "SELL" });
  const wrap = mk("button", { text: "SELL", cls: ["tbtn"] }, null);
  span.parentElement = wrap;
  assert.equal(describeTarget(span).act, "SELL", "a touch inside a button finds the button");

  assert.equal(describeTarget(mk("div", { text: "nothing" })), null, "a touch on nothing files nothing");
});

await t("the clock going backwards is a fresh read, not a frozen one", () => {
  /* sim.time is per-sky and starts again at zero on a launch. Caught by the
   * browser smoke on 0.3.06: with a plain `t - lastSnapAt < gap` test every
   * record filed after a sky launch carried one stale state from the sky
   * before it, for as long as it took the new clock to climb back. */
  resetRecorder();
  W.t = 900; W.hold = 0.1;
  const before = record("tap", "before-launch");
  assert.equal(before.s.hold, 0.1);

  W.t = 2; W.hold = 0.8;                 // a new sky: the clock restarts
  const after = record("tap", "after-launch");
  assert.equal(after.s.t, 2, "the new record is on the new clock");
  assert.equal(after.s.hold, 0.8, "and reads the world again rather than reusing the old state");
  assert.equal(recorder.resets, 1, "the reset is counted");

  assert.deepEqual(before.d, { reset: 1 }, "the record left open by the reset says its outcome was never seen");
  assert.notEqual(before.d.cr, 0, "which is not the same as reporting a zero outcome");
});

await t("an unwired recorder is inert rather than fatal", () => {
  clearTape();
  wireRecorder({ sample: () => null });
  assert.equal(record("tap", "x"), null, "no world read, no record");
  assert.equal(snapshot(), null);
  wireRecorder({ sample: () => ({ ...W }), who: () => who, captureTaps: false });
});

console.log(`\nrecorder: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
