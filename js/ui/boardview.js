import { pilot } from "../flight/pilot.js";
import { corps, standingLabel } from "../corp/corps.js";
import { sim } from "../sim/sim.js";
import { acceptBlocker, acceptContract, boardByCategory, hullFit, CATEGORIES, jobStatus, markTarget, timeLeft, abandonContract, deliverContracts, deliverableAt, contracts, BOARD } from "../economy/contracts.js";
import { engageMiningLoop } from "../flight/autopilot.js";
import { siteById } from "../economy/sites.js";
import { chainReport } from "../economy/chains.js";

const DOC = globalThis.document ?? null;
const openState = new Map();
let filter = "all";

function mk(tag, cls, text) {
  const n = DOC.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function details(key, dflt, summaryKids, cls) {
  const d = mk("details", cls);
  d.open = openState.has(key) ? openState.get(key) : dflt;
  d.addEventListener("toggle", () => openState.set(key, d.open));
  const s = mk("summary");
  s.append(...summaryKids);
  d.append(s);
  return d;
}

const myCareer = () => pilot?.complexId ?? null;
const catFor = (cat) => CATEGORIES[cat]?.careers?.includes(myCareer());

export function renderDesk(host, st, { btn, onChange = null } = {}) {
  if (!DOC || !host || !st) return;
  const fit = hullFit();
  const cats = boardByCategory(st);
  const total = cats.reduce((a, c) => a + c.offers, 0);
  const outfits = new Set(cats.flatMap((c) => c.issuers.map((i) => i.corpId))).size;

  const head = mk("div", "bd-head");
  head.append(mk("div", "bd-sum", `${total} jobs from ${outfits} outfit${outfits === 1 ? "" : "s"} · ${fit.hull}: hold ${fit.cap}, ${fit.armed ? `${fit.turrets} gun${fit.turrets === 1 ? "" : "s"}` : "unarmed"}`));
  const chips = mk("div", "bd-chips");
  for (const [id, label] of [["all", "ALL"], ["fit", "FITS MY HULL"], ["career", "MY CAREER"]]) {
    const b = btn(label, () => { filter = id; onChange?.(); }, filter === id);
    b.classList.add("bd-chip");
    chips.append(b);
  }
  head.append(chips);
  host.append(head);
  const running = chainReport();
  if (running.length) {
    const strip = mk("div", "bd-runs");
    for (const r of running) strip.append(mk("div", `bd-run${r.stationId === st.id ? " here" : ""}`, `${r.name} · stage ${r.stage}/${r.of} · ${r.held ? "in hand" : r.stationId === st.id ? "posted here" : `next at ${r.stationName}`}`));
    host.append(strip);
  }

  let shown = 0;
  for (const c of cats) {
    if (filter === "career" && !catFor(c.cat)) continue;
    const key = `${st.id}:${c.cat}`;
    const mine = catFor(c.cat);
    const sumKids = [
      mk("span", "bd-cat-nm", c.name),
      mk("span", "bd-cat-meta", `${c.offers} job${c.offers === 1 ? "" : "s"} · ${c.open} open · best ${c.best.toLocaleString("en-US")} cr${mine ? " · your career" : ""}`),
    ];
    const d = details(key, mine, sumKids, `bd-cat${mine ? " mine" : ""}`);
    let inCat = 0;
    for (const g of c.issuers) {
      const offers = filter === "fit" ? g.offers.filter((o) => !acceptBlocker(o)) : g.offers;
      if (!offers.length) continue;
      const co = g.corpId ? corps.find((x) => x.id === g.corpId) : null;
      const ik = `${key}:${g.corpId ?? "port"}`;
      const di = details(ik, true, [mk("span", "bd-iss-nm", g.corpName), mk("span", "bd-iss-meta", `${g.tenant ? "tenant office" : "port charter"}${co ? ` · ${standingLabel(co.standing)}` : ""}`)], "bd-iss");
      for (const o of offers) {
        const why = acceptBlocker(o);
        const r = mk("div", `bd-offer${why ? " blocked" : ""}`);
        const k = mk("div", "bd-k");
        const ttl = mk("div", "bd-title", `${o.title} · ${o.tierName}`);
        if (o.chain) { const tag = mk("span", "bd-chain", o.chainIdx === 0 ? `${o.chainName} · ${o.chainOf} stages` : o.chainName); ttl.prepend(tag); }
        k.append(ttl);
        k.append(mk("small", null, `${o.chain && o.chainIdx === 0 ? `${o.chainBlurb} ` : ""}${o.text}${o.chain && o.chainLast ? ` Closing stage — ${o.chainBonus.toLocaleString("en-US")} cr bonus on top.` : ""}${why ? ` — ${why}` : ""}`));
        const v = mk("div", "bd-v");
        v.append(mk("span", "bd-pay", `${o.pay.toLocaleString("en-US")} cr`));
        const b = btn("ACCEPT", () => { const e = acceptContract(o); if (e) sim.notice = e; onChange?.(); }, !why);
        b.disabled = Boolean(why);
        v.append(b);
        r.append(k, v);
        di.append(r);
        inCat++;
      }
      d.append(di);
    }
    if (!inCat) continue;
    host.append(d);
    shown++;
  }
  if (!shown) host.append(mk("p", "bd-empty", filter === "fit" ? `Nothing on this desk fits ${fit.hull} right now. ALL shows what a bigger hold or guns would open.` : filter === "career" ? "Nothing in your career's departments on this desk right now. It re-posts every eight minutes." : "The desk has nothing posted right now. It re-posts every eight minutes."));
}

export function renderHeld(host, st, { btn, onChange = null, rowCls = "bd-offer" } = {}) {
  if (!DOC || !host) return;
  const due = st ? deliverableAt(st.id) : [];
  if (!contracts.active.length) { host.append(mk("p", "bd-empty", "Nothing accepted.")); return; }
  for (const a of contracts.active) {
    const r = mk("div", rowCls);
    r.dataset.focus = `contract-${a.id}`;
    const k = mk("div", "bd-k");
    const ttl = mk("div", "bd-title", `${a.title} · ${a.tierName}`);
    if (a.chain) ttl.prepend(mk("span", "bd-chain", a.chainName));
    k.append(ttl);
    k.append(mk("small", null, `${a.corpName} · ${Math.round(timeLeft(a) / 60)} min left · ${jobStatus(a)}`));
    const v = mk("div", "bd-v");
    v.append(mk("span", "bd-pay", `${a.pay.toLocaleString("en-US")} cr`));
    if (due.includes(a)) v.append(btn("DELIVER", () => { deliverContracts(st.id); onChange?.(); }, true));
    if ((a.targets?.length && (a.progress ?? 0) < 1) || a.markId || a.boatId || a.nestId) v.append(btn("MARK", () => { const wp = markTarget(a); sim.notice = wp ? `Waypoint: ${wp.name}` : "No fix on that target."; onChange?.(); }, false));
    if (a.spot && siteById(a.id) && (sim.ship.hold[a.good] ?? 0) < a.qty) v.append(btn("MINE IT", () => { engageMiningLoop({ x: a.spot.x, y: a.spot.y, z: a.spot.z, name: a.spot.name, site: String(a.id) }); sim.notice = `Mining loop set for ${a.spot.name}.`; onChange?.(); }, true));
    v.append(btn("ABANDON", () => { abandonContract(a.id); onChange?.(); }, false, true));
    r.append(k, v);
    host.append(r);
  }
}

export { BOARD };
