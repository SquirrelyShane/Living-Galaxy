import fs from "node:fs";
import { COMPLEX_IDS } from "../js/careers/index.js";
import { CAREER_ARCS, CAREER_STATUS, OPEN_GATE, careerStatus, isCareerOpen, openCareers } from "../js/careers/status.js";
import { careerCatalog, makePilot, pilot, transferOptions, tryTransfer } from "../js/flight/pilot.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => {
  if (cond) pass++;
  else { fail++; console.log(`  FAIL ${msg}`); }
};

ok(COMPLEX_IDS.every((id) => CAREER_STATUS[id]), "every complex has a status");
ok(Object.keys(CAREER_STATUS).every((id) => COMPLEX_IDS.includes(id)), "no status for a complex that does not exist");
ok(openCareers().join(",") === COMPLEX_IDS.join(","), "all sixteen careers are selectable");

for (const [id, s] of Object.entries(CAREER_STATUS)) {
  ok(s.has.every((g) => OPEN_GATE.includes(g)), `${id}: every 'has' is a gate item`);
  if (s.state === "open") ok(OPEN_GATE.every((g) => s.has.includes(g)), `${id}: complete career has the whole gate`);
  else {
    ok(Boolean(s.verb), `${id}: a planned career names its verb`);
    ok(Boolean(careerStatus(id).eta), `${id}: a planned career has an arc`);
    ok(careerStatus(id).missing.length > 0, `${id}: a planned career is missing something`);
  }
  ok(isCareerOpen(id) && careerStatus(id).open, `${id}: planned work does not lock pilot access`);
}

const inArcs = CAREER_ARCS.flatMap((a) => a.careers);
ok(new Set(inArcs).size === inArcs.length, "no career in two arcs");
ok(COMPLEX_IDS.filter((id) => CAREER_STATUS[id].state === "planned").every((id) => inArcs.includes(id)), "every planned career is in an arc");
const minors = CAREER_ARCS.map((a) => a.minor.split(".").map(Number));
ok(minors.every((m, i) => i === 0 || m[0] > minors[i - 1][0] || (m[0] === minors[i - 1][0] && m[1] > minors[i - 1][1])), "arcs are in version order");

const cat = careerCatalog();
ok(cat.length === COMPLEX_IDS.length, "the catalogue still lists all sixteen");
ok(cat.every((c) => c.open), "the catalogue makes every career selectable");
ok(cat.filter((c) => CAREER_STATUS[c.id].state === "planned").every((c) => c.eta && c.arc && c.verb), "roadmap details remain available");

makePilot("Test", "terran", "mining", null);
const xo = transferOptions();
ok(xo.length === COMPLEX_IDS.length - 1, "all other careers appear in transfers");
ok(xo.every((x) => !x.shut), "no transfer is shut by the roadmap");
const r = tryTransfer("salvage");
ok(!/opens in 0\.4/.test(r.error ?? ""), `salvage transfer is evaluated by normal eligibility (${r.error ?? "ok"})`);
ok(pilot.complexId === (r.ok ? "salvage" : "mining"), "transfer changes the active career only on success");

makePilot("Legacy", "terran", "commerce", null);
ok(pilot.complexId === "commerce", "makePilot still takes a planned career (saves, aria-play, aria-bench)");
const back = transferOptions().find((x) => x.id === "mining");
ok(back && !back.shut, "mining remains available from another career");

for (const id of COMPLEX_IDS) {
  makePilot("Access", "terran", id, null);
  ok(pilot.complexId === id && pilot.character.activeComplex === id, `${id}: can start a new pilot`);
}

const src = fs.readFileSync(new URL("../js/ui/creation.js", import.meta.url), "utf8");
ok(/choice\.complexId = "navigation"/.test(src), "creation defaults to navigation again");
ok(/isOpenCareer/.test(src), "creation checks that the chosen career exists");

console.log(`careerstatus: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
