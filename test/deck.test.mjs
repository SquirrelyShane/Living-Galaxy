/* 0.3.45 — the station deck carries only what a port has.
 *
 * The deck used to repeat the console: a crew roster, the company register,
 * the treasury, the fleet and a port "log" that was the flight log. Pinned
 * here: every tab in index.html has a panel and every panel a tab; none of
 * the console's own pages is back on the deck; the hall still jumps to the
 * console for the roster.
 */
import { readFileSync } from "node:fs";
import { deckTabs } from "../js/stationdeck.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("  FAIL", m); } };

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const row = html.slice(html.indexOf('id="sd-tabs"'), html.indexOf("</nav>", html.indexOf('id="sd-tabs"')));
const inHtml = [...row.matchAll(/data-sd="([a-z]+)"/g)].map((m) => m[1]);
const panels = deckTabs();

ok(inHtml.length >= 8, `the tab row parsed (${inHtml.length})`);
for (const t of inHtml) ok(panels.includes(t), `tab "${t}" has a panel`);
for (const p of panels) ok(inHtml.includes(p), `panel "${p}" has a tab`);
for (const gone of ["log", "crew"]) ok(!inHtml.includes(gone) && !panels.includes(gone), `"${gone}" is the console's, not the deck's`);
for (const kept of ["market", "shipyard", "board", "hall", "works", "drones", "robots", "refit", "blueprint"]) ok(inHtml.includes(kept), `the port keeps "${kept}"`);

const src = readFileSync(new URL("../js/stationdeck.js", import.meta.url), "utf8");
ok(!/foundCompany|commissionHull|transfer\(|fleetReport/.test(src), "no register, treasury or fleet on the deck");
ok(/hallPanel/.test(src), "the hall is drawn by js/deckhall.js");
ok(!/openConsole\("corp", "company"\)/.test(src), "the registrar is on the deck, not a jump to CON");

/* 0.3.49: the hall keeps you on the deck */
const hall = readFileSync(new URL("../js/deckhall.js", import.meta.url), "utf8");
ok(!/openConsole/.test(hall), "nothing in the hall throws you into the console");
ok(/mountTalk\(/.test(hall) && /settleFamily\(m\.id, "staff"\)/.test(hall) && /settleFamily\(m\.id, "payoff"\)/.test(hall), "your crew: TALK, SETTLE and PAY OFF inline");
ok(/el\("input", "sd-input"\)/.test(hall) && /foundCompany\(name\.value/.test(hall), "the registrar takes a typed name");
ok(/callTopic\(p\.id/.test(hall), "the company line runs inline for staff on this floor");

console.log(`deck: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
