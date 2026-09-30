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
ok(openCareers().join(",") === "mining", `only mining is open (got ${openCareers().join(",")})`);

for (const [id, s] of Object.entries(CAREER_STATUS)) {
  ok(s.has.every((g) => OPEN_GATE.includes(g)), `${id}: every 'has' is a gate item`);
  if (s.state === "open") ok(OPEN_GATE.every((g) => s.has.includes(g)), `${id}: open only with the whole gate`);
  else {
    ok(Boolean(s.verb), `${id}: a planned career names its verb`);
    ok(Boolean(careerStatus(id).eta), `${id}: a planned career has an arc`);
    ok(careerStatus(id).missing.length > 0, `${id}: a planned career is missing something`);
  }
}

const inArcs = CAREER_ARCS.flatMap((a) => a.careers);
ok(new Set(inArcs).size === inArcs.length, "no career in two arcs");
ok(COMPLEX_IDS.filter((id) => !isCareerOpen(id)).every((id) => inArcs.includes(id)), "every planned career is in an arc");
const minors = CAREER_ARCS.map((a) => a.minor.split(".").map(Number));
ok(minors.every((m, i) => i === 0 || m[0] > minors[i - 1][0] || (m[0] === minors[i - 1][0] && m[1] > minors[i - 1][1])), "arcs are in version order");

const cat = careerCatalog();
ok(cat.length === COMPLEX_IDS.length, "the catalogue still lists all sixteen");
ok(cat.filter((c) => c.open).map((c) => c.id).join(",") === "mining", "the catalogue marks only mining open");
ok(cat.filter((c) => !c.open).every((c) => c.eta && c.arc && c.verb), "every shut card carries eta, arc and verb");

makePilot("Test", "terran", "mining", null);
const xo = transferOptions();
ok(xo.filter((x) => x.shut).length === 15, "fifteen planned careers show as shut in transfers");
ok(xo.every((x) => !x.shut || !x.ok), "a shut transfer is never ok");
const r = tryTransfer("salvage");
ok(!r.ok && /opens in 0\.4/.test(r.error ?? ""), `transfer into a planned career is refused (${r.error})`);
ok(pilot.complexId === "mining", "a refused transfer leaves the pilot where they were");

makePilot("Legacy", "terran", "commerce", null);
ok(pilot.complexId === "commerce", "makePilot still takes a planned career (saves, aria-play, aria-bench)");
const back = transferOptions().find((x) => x.id === "mining");
ok(back && !back.shut, "mining is never shut to a pilot in a planned career");

const src = fs.readFileSync(new URL("../js/ui/creation.js", import.meta.url), "utf8");
ok(!/choice\.complexId = "navigation"/.test(src), "creation no longer defaults to a planned career");
ok(/aria-disabled/.test(src) && /isOpenCareer/.test(src), "creation greys shut cards and gates the step");

console.log(`careerstatus: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
