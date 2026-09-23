/* LIVING GALAXY — the HUD dock cannot outgrow its own box.
 *
 *   node --import ./test/three-register.mjs test/hudlayout.test.mjs
 *
 * The right-hand chip column is bottom-anchored and grows upward; the RCS pad
 * and the dash are stacked on top of it by --g-dock. That offset has now gone
 * stale twice — 0.3.06 added the fullscreen chip, 0.3.29 added HOLD, and both
 * times the column grew past its box and painted ARIA over AFT, DN and SCAN.
 * They laid out correctly and could not be tapped, which on a phone means the
 * thrusters are gone.
 *
 * 0.3.31 makes hud.js measure the column, so the live layout is right whatever
 * is in it. This suite guards the three things measuring cannot:
 *
 *   1. the --g-tools fallback in css/glass.css still matches the markup, for
 *      the frames before hud.js runs and for a browser with no ResizeObserver
 *   2. the comms puck's fallback still clears the systems strip it shares the
 *      right edge with in portrait — the same bug one rail over, which had the
 *      puck's pulse ring sitting on ASST and its left edge on CUT
 *   3. every control that lives inside a pointer-events:none card opts back in
 *
 * All three are read off the source, so they fail the moment a chip is added
 * without the fallback following it. What the live layout actually does is
 * hit-tested in test/smoke-immersive.mjs, in a real browser.
 */
import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url).pathname;
const read = (p) => readFileSync(ROOT + p, "utf8");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

const html = read("index.html");
const glass = read("css/glass.css");
const style = read("css/style.css");

/* ---- 1. the fallback chip count matches the markup ----------------------- */
{
  const block = html.match(/<div class="hud-tools">([\s\S]*?)<\/div>/);
  ok(!!block, "the tools column is in the markup");
  const buttons = [...block[1].matchAll(/<button[^>]*>/g)].map((m) => m[0]);
  ok(buttons.length > 0, `the column has chips (${buttons.length} in the markup)`);

  /* a chip carrying `hidden` is not laid out, so it is not in the stack height */
  const visible = buttons.filter((b) => !/\bclass="[^"]*\bhidden\b/.test(b));
  const idOf = (b) => (b.match(/id="([^"]+)"/) ?? [, "?"])[1];
  const declared = Number((glass.match(/--g-tools:\s*(\d+)/) ?? [])[1]);

  ok(Number.isFinite(declared), `--g-tools is declared (${declared})`);
  ok(
    declared === visible.length,
    `the --g-tools fallback matches the markup — ${declared} declared, ${visible.length} visible chips (${visible.map(idOf).join(", ")}). ` +
    "Add a chip, raise --g-tools by one.",
  );

  /* the derivation itself must still be in terms of the count and the chip
   * metrics, or correcting the count fixes nothing */
  const dock = glass.match(/--g-dock:\s*calc\(([^;]+)\);/);
  ok(!!dock && /--g-tools/.test(dock[1]) && /--g-tool-h/.test(dock[1]) && /--g-tool-gap/.test(dock[1]),
    "--g-dock is still derived from the count, the chip height and the gap");
  ok(/#hud \.rcs\s*{[^}]*var\(--g-dock\)/.test(glass), "the RCS pad is still stacked on --g-dock");
  ok(/#hud \.dash\s*{[^}]*var\(--g-dock\)/.test(glass), "…and so is the dash");
}

/* ---- 2. hud.js measures, rather than trusting the count ------------------ */
{
  const hud = read("js/hud.js");
  ok(/function measureDock\(/.test(hud), "hud.js measures the column");
  ok(/setProperty\("--g-dock"/.test(hud), "…and publishes it as --g-dock");
  ok(/ResizeObserver/.test(hud), "…and watches the box, so a chip that merely unhides is caught");
  ok(/getBoundingClientRect\(\)\.height/.test(hud), "…from the column's real height, not from a count");
  /* the guard that stops a hidden column collapsing the pad onto the chips */
  ok(/if \(h > 0\)/.test(hud), "a zero height is ignored rather than published");
}

/* ---- 3. the comms puck clears the switches it shares a rail with --------- */
{
  const hud = read("js/hud.js");
  const comms = read("css/comms.css");
  ok(/function measureRail\(/.test(hud), "hud.js measures the systems strip");
  ok(/setProperty\("--g-rail-top"/.test(hud), "…and publishes it as --g-rail-top");
  ok(/--cx-rail-top:\s*var\(--g-rail-top,/.test(comms), "the puck takes the measured rail, with a fallback");

  /* the measured rail is only safe where the puck clears the dash: on a short
   * screen the dash already rides up over the strip, and dropping the puck
   * below the strip there lands it on the throttle instead */
  ok(/removeProperty\("--g-rail-top"\)/.test(hud), "…and unsets it where there is no room, rather than publishing a worse position");
  ok(/PUCK_H/.test(hud) && /PUCK_W/.test(hud), "the search knows the puck's own size, so a slot is tested as a box and not a point");

  /* which means the fallback must stay the conservative one — if it moved with
   * the measurement, unsetting the variable would change nothing */
  const fb = comms.match(/--cx-rail-top:\s*var\(--g-rail-top,\s*calc\(var\(--pad-t\)\s*\+\s*(\d+)px\)\)/);
  ok(!!fb, "the portrait fallback is a pad-t offset we can check");
  const stripTop = Number((read("css/glass.css").match(/\.sys-strip\s*{[^}]*top:\s*calc\(var\(--pad-t\)\s*\+\s*(\d+)px\)/) ?? [])[1]);
  ok(Number.isFinite(stripTop), `the strip's own offset is readable (${stripTop}px below pad-t)`);
  ok(
    Number(fb[1]) < stripTop + 98,
    `the fallback is the conservative position, not the measured one (${fb[1]}px) — ` +
    "a fallback equal to the measurement makes the room check a no-op",
  );
}

/* ---- 4. the puck is placed by search, not by a number -------------------- */
{
  const hud = read("js/hud.js");
  const comms = read("css/comms.css");
  ok(/PUCK_AVOID/.test(hud), "there is a list of what the puck must not sit on");
  ok(/#hud button/.test(hud) && /\.rcs-btn/.test(hud),
    "…and it is CONTROLS, not cards — avoiding whole panels leaves no free slot in landscape at all");
  ok(/const cands = \[/.test(hud) && /for \(const c of cands\)/.test(hud),
    "the puck tries several slots and takes the first that collides with nothing");
  ok(/--g-rail-right/.test(hud) && /--g-rail-right/.test(comms),
    "a free slot may not be on the right rail, so the column is published too");
  ok(/removeProperty\("--g-rail-top"\)/.test(hud), "…and a screen where nothing fits keeps the CSS fallback");

  /* THE ANSWER BUTTONS MOVE WITH IT.
   * 0.3.37 placed the puck alone and forgot .cx-answer hangs off it at a
   * LARGER offset from the right edge — so a left-edge slot pushed the
   * accept/reject pair off screen and a ringing call could not be answered
   * without going fullscreen. Reported, and the reason for 0.3.38. */
  ok(/ANSWER_W/.test(hud) && /ANSWER_GAP/.test(hud), "the search knows the answer row's size, not just the puck's");
  ok(/--g-answer-right/.test(hud) && /--g-answer-right/.test(comms), "…and publishes where that row goes");
  ok(/c\.answer\.left < 0 \|\| c\.answer\.right > vw/.test(hud),
    "a slot that would put the answer buttons off screen is rejected outright — they must be tappable");
  const ansRules = [...comms.matchAll(/\.cx-answer \{[^}]*\}/g)].map((m) => m[0]);
  ok(ansRules.length >= 1, "the answer row is positioned in css");
  ok(ansRules.every((r) => !/right:\s*calc\(var\(--cx-rail-right\)/.test(r) || /var\(--g-answer-right/.test(r)),
    "every .cx-answer rule takes the measured offset, including the coarse-pointer one — that is the phone");

  /* and in portrait it stays where the pilot expects it */
  ok(/vw > vh/.test(hud), "the far side is a landscape-only option: in portrait the puck stays on its own rail");
  ok(/overlapArea/.test(hud), "candidates are scored by how much they cover, not just accepted or rejected");

  /* an invisible decoration must never take a tap */
  const ring = comms.match(/\.cx-puck__ring\s*\{([^}]*)\}/);
  ok(!!ring, ".cx-puck__ring is styled");
  ok(/pointer-events:\s*none/.test(ring[1]),
    "the pulse rings are pointer-events:none — they sit at opacity 0 and 2px proud of the puck, and were eating taps nobody could see");
}

/* ---- 5. rows that must be allowed to shrink ------------------------------ */
{
  const glass = read("css/glass.css");
  const dash = glass.match(/#hud \.dash \{[^}]*\}/)?.[0] ?? "";
  ok(/grid-template-rows:\s*minmax\(0, ?1fr\)/.test(dash),
    "the dash's flexible row is minmax(0,1fr) — a bare 1fr keeps an implicit min-height:auto and overflowed the WARP row onto the throttle's MAX button at 150px");
  const thr = glass.match(/#hud \.thr \{[^}]*\}/)?.[0] ?? "";
  ok(/minmax\(0, ?1fr\)/.test(thr), "…and so is the throttle's own");
}

/* ---- 6. the systems strip does not reserve space for a hidden card ------- */
{
  const style = read("css/style.css");
  /* the breakpoint that hides the gauges must also move the strip up: it sits
   * at pad-t + 100px to clear them, and reserving that for a card that is not
   * drawn is what pushed the dash over the strip on the shortest screen */
  /* there is more than one block at this breakpoint, so check them together */
  const blocks = [...style.matchAll(/@media \(max-height: 640px\)[\s\S]*?\n\}/g)].map((m) => m[0]).join("\n");
  ok(blocks.length > 0, "the short-screen breakpoint exists");
  ok(/\.gauges \{ display: none/.test(blocks), "…and still hides the gauges there");
  ok(/\.sys-strip \{ top:/.test(blocks), "…and moves the systems strip up to take back the space they left");
}

/* ---- 7. controls inside a pointer-events:none card opt back in ----------- */
{
  /* .gauges lets drags through to the canopy, so a gauge that is a button has
   * to take its own events back or every tap lands on the canvas behind it */
  ok(/\.gauges\s*{[^}]*pointer-events:\s*none/.test(style), "the gauges card still lets the canopy through");
  const btn = style.match(/\.gauge-btn\s*{([^}]*)}/);
  ok(!!btn, ".gauge-btn is styled");
  ok(/pointer-events:\s*auto/.test(btn[1]), "…and takes its pointer events back, so the CGO gauge is tappable");

  /* every id the markup wires as a gauge button must actually carry the class */
  const gaugeBtns = [...html.matchAll(/<button[^>]*class="[^"]*\bgauge-btn\b[^"]*"[^>]*>/g)];
  ok(gaugeBtns.length > 0, `the markup has gauge buttons (${gaugeBtns.length})`);
  for (const m of gaugeBtns) {
    const id = (m[0].match(/id="([^"]+)"/) ?? [, "?"])[1];
    ok(/class="[^"]*\bgauge\b/.test(m[0]), `${id} is a gauge as well as a button, so it keeps the gauge's own layout`);
  }
}

console.log(`hudlayout: ${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
