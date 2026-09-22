/* LIVING GALAXY — pilot creation.
 *
 * Four steps between the callsign and the sky: race, career, corporation,
 * destination. The 3D backdrop keeps rendering the whole time, which is the
 * real reason this screen exists — every world's surface is being painted a
 * frame at a time while you read about the Vantari.
 */

import { RACES, raceById, traitLines, traitsOf } from "./races.js";
import { SKILLS } from "./careers/skills.js";
import { compileBlock } from "./ui/glyphs.js";
import { byTier, buildCorps, corps } from "./corps.js";
import { careerCatalog, makePilot } from "./pilot.js";
import { SECTORS } from "./materials.js";
import { startRun } from "./profile.js";
import { resetCompany } from "./company.js";
import { releaseEmployed } from "./npc/cradle.js";

const STEPS = ["race", "career", "corp", "sky"];

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function $(id) {
  return document.getElementById(id);
}

/**
 * @param opts.onLaunch  (seed) => void
 * @param opts.onSeed    (seed) => void   preview a sky without launching
 * @param opts.rollSeed  () => string
 * @param opts.textureProgress () => ({done, total})
 */
export function mountCreation(opts) {
  const root = $("create");
  const body = $("create-body");
  const stepsEl = $("create-steps");
  const sum = $("create-sum");
  const backBtn = $("create-back");
  const nextBtn = $("create-next");

  const choice = { raceId: null, complexId: null, corpId: null, seed: null };
  let step = 0;
  let open = false;
  const careers = careerCatalog();

  const setStep = (n) => {
    step = Math.max(0, Math.min(STEPS.length - 1, n));
    stepsEl.querySelectorAll("button").forEach((b, i) => {
      b.classList.toggle("on", i === step);
      b.classList.toggle("done", i < step && stepDone(i));
    });
    render();
  };

  const stepDone = (i) =>
    (i === 0 && choice.raceId) || (i === 1 && choice.complexId) || (i === 2 && choice.corpId !== null) || i === 3;

  stepsEl.querySelectorAll("button[data-step]").forEach((b, i) => {
    b.addEventListener("click", () => setStep(i));
  });
  backBtn.addEventListener("click", () => {
    if (step === 0) close();
    else setStep(step - 1);
  });
  nextBtn.addEventListener("click", () => setStep(step + 1));

  /* ---- panels ---- */

  function detail(title, ...kids) {
    const d = el("div", "detail");
    d.append(el("h4", null, title));
    d.append(...kids);
    return d;
  }

  function renderRace() {
    const grid = el("div", "pick-grid");
    for (const r of RACES) {
      const b = el("button", `pick ${choice.raceId === r.id ? "on" : ""}`);
      b.type = "button";
      b.style.setProperty("--dot", r.colour);
      const nm = el("b", null, r.name);
      b.append(nm, el("small", null, r.origin));
      b.addEventListener("click", () => {
        choice.raceId = r.id;
        render();
      });
      grid.append(b);
    }
    body.append(grid);

    if (choice.raceId) {
      const r = raceById(choice.raceId);
      body.append(detail(r.name, el("p", "lede", r.blurb), el("p", null, r.note)));
      const t = el("div", "traits");
      for (const line of traitLines(r.id)) {
        const row = el("div", line.good ? "up" : "down");
        row.append(el("span", null, line.label), el("b", null, line.value));
        t.append(row);
      }
      const d = el("div", "detail");
      d.append(el("h4", null, "What it does to the ship"), t);
      body.append(d);
    }
  }

  function renderCareer() {
    const grid = el("div", "pick-grid");
    for (const c of careers) {
      const b = el("button", `pick ${choice.complexId === c.id ? "on" : ""}`);
      b.type = "button";
      b.style.setProperty("--dot", "#7fb8c9");
      b.append(el("b", null, c.name.replace(/ Complex$/, "")), el("small", null, c.primary.slice(0, 2).join(" · ")));
      b.addEventListener("click", () => {
        choice.complexId = c.id;
        render();
      });
      grid.append(b);
    }
    body.append(grid);

    if (choice.complexId) {
      const c = careers.find((x) => x.id === choice.complexId);
      const d = el("div", "detail");
      d.append(el("h4", null, c.name));
      if (c.blurb) d.append(el("p", "lede", c.blurb));
      if (c.entry) {
        d.append(el("p", null, `You start at ${c.entry.letter} — ${c.entry.title}. ${c.entry.duties ?? ""}`));
      }
      body.append(d);

      const lad = el("div", "ladder");
      c.ladder.forEach((rank, i) => {
        const s = el("span", i === 0 ? "first" : null, rank);
        lad.append(s);
      });
      const d2 = el("div", "detail");
      d2.append(el("h4", null, "The spine, A to G"), lad);
      body.append(d2);

      if (c.specs.length) {
        const d3 = el("div", "detail");
        d3.append(el("h4", null, "Specialisations"), el("p", null, c.specs.join(" · ")));
        body.append(d3);
      }
      const d4 = el("div", "detail");
      d4.append(
        el("h4", null, "Skills that matter here"),
        el("p", null, c.primary.join(", ")),
      );
      body.append(d4);
    }
  }

  function renderCorp() {
    const note = el("div", "detail");
    note.append(
      el("h4", null, "Who you fly for"),
      el(
        "p",
        null,
        "Signing on puts you in good standing with one outfit and its sector. Fly independent and nobody owes you a berth, but nobody owns your manifest either.",
      ),
    );
    body.append(note);

    for (const [tier, label] of [["major", "Charter holders"], ["alt", "Alternates"], ["hostile", "Known hostiles"]]) {
      const list = byTier(tier);
      if (!list.length) continue;
      const head = el("div", "detail");
      head.append(el("h4", null, label));
      body.append(head);
      const grid = el("div", "pick-grid");
      for (const c of list) {
        const b = el("button", `pick ${choice.corpId === c.id ? "on" : ""}`);
        b.type = "button";
        b.style.setProperty("--dot", c.colour);
        b.append(el("b", null, c.name), el("small", null, `${c.sectorName} · ${c.ports.length} ${c.ports.length === 1 ? "port" : "ports"}`));
        if (tier === "hostile") {
          b.disabled = true;
          b.style.opacity = "0.45";
        } else {
          b.addEventListener("click", () => {
            choice.corpId = c.id;
            render();
          });
        }
        grid.append(b);
      }
      body.append(grid);
    }

    const indie = el("button", `pick ${choice.corpId === "" ? "on" : ""}`);
    indie.type = "button";
    indie.style.setProperty("--dot", "#8a8f9a");
    indie.append(el("b", null, "Independent"), el("small", null, "No flag, no favours, no obligations"));
    indie.addEventListener("click", () => {
      choice.corpId = "";
      render();
    });
    const wrap = el("div", "pick-grid");
    wrap.append(indie);
    body.append(wrap);

    if (choice.corpId) {
      const c = corps.find((x) => x.id === choice.corpId);
      if (c) body.append(detail(c.name, el("p", "lede", c.blurb), el("p", null, SECTORS[c.sector]?.blurb ?? "")));
    }
  }

  function renderSky() {
    const d = el("div", "detail");
    d.append(
      el("h4", null, "Where to"),
      el(
        "p",
        null,
        "Sol is the shared sky and it is already loaded. A random system grows its own star, worlds, belts and ports — and needs a moment to paint them.",
      ),
    );
    body.append(d);

    const picks = el("div", "sky-picks");
    const sol = el("button", "btn btn-accent", "Enter Sol");
    sol.type = "button";
    sol.id = "btn-sol";
    sol.addEventListener("click", () => finish("sol"));
    const rnd = el("button", "btn", "Roll a random system");
    rnd.type = "button";
    rnd.id = "btn-random";
    rnd.addEventListener("click", () => {
      choice.seed = opts.rollSeed();
      /* the fifteen outfits are grown from the seed — the one picked in step 3
       * does not exist in the new sky, so the flag goes back to Independent */
      choice.corpId = "";
      opts.onSeed(choice.seed);
      render();
    });
    picks.append(sol, rnd);
    body.append(picks);

    if (choice.seed) {
      const info = el("div", "detail");
      const line = el("p", "lede", opts.describe(choice.seed));
      line.id = "sys-line";
      info.append(el("h4", null, "Rolled"), line);
      body.append(info);
      const go = el("div", "sky-picks");
      const launch = el("button", "btn btn-accent", `Launch into ${opts.systemName(choice.seed)}`);
      launch.type = "button";
      launch.id = "btn-launch";
      launch.addEventListener("click", () => finish(choice.seed));
      go.append(launch);
      body.append(go);
    }

    const joinWrap = el("div", "detail");
    joinWrap.append(el("h4", null, "Join a named sky"));
    const row = el("div", "sky-row");
    const input = document.createElement("input");
    input.placeholder = "Type the same name as a friend";
    input.maxLength = 12;
    input.id = "code";
    const join = el("button", "btn", "Join");
    join.type = "button";
    join.id = "btn-join";
    join.addEventListener("click", () => {
      const v = input.value.trim();
      if (v) finish(v.toUpperCase());
    });
    row.append(input, join);
    joinWrap.append(row);
    body.append(joinWrap);
  }

  /* The record compiling as you choose: every pick adds rows, the bars fill
   * in the machine's own script, and the sigil settles when the bars do. */
  let compileKey = "";
  function renderCompile() {
    const rows = [];
    const seed = `${choice.raceId ?? "-"}:${choice.complexId ?? "-"}:${choice.corpId ?? "-"}`;
    if (choice.raceId) {
      const r = raceById(choice.raceId);
      for (const [sk, v] of Object.entries(r.affinity ?? {})) rows.push({ label: SKILLS[sk]?.name ?? sk, value: Math.min(1, v / 20), tone: "cyan", format: () => `+${v}` });
      const t = traitsOf(choice.raceId);
      for (const [k, label] of [["hold", "Hold"], ["reactor", "Reactor"], ["rcs", "RCS"], ["hull", "Hull"], ["scan", "Sensors"]]) {
        if (Math.abs((t[k] ?? 1) - 1) > 0.02) rows.push({ label, value: Math.min(1, Math.max(0.05, (t[k] - 0.6) / 0.8)), tone: t[k] >= 1 ? "ok" : "amber", format: () => `${t[k] >= 1 ? "+" : ""}${Math.round((t[k] - 1) * 100)}%` });
      }
    }
    if (choice.complexId) {
      const c = careers.find((x) => x.id === choice.complexId);
      for (const sk of (c?.primaryIds ?? []).slice(0, 4)) rows.push({ label: `${SKILLS[sk]?.name ?? sk} track`, value: 0.35, tone: "cyan", format: () => "ENTRY" });
      if (c?.entry) rows.push({ label: `${c.entry.title}`, value: 0.14, tone: "amber", format: () => c.entry.letter });
    }
    if (choice.corpId !== null && choice.corpId !== undefined) {
      rows.push({ label: choice.corpId ? "Standing" : "Independent", value: choice.corpId ? 0.62 : 0.5, tone: choice.corpId ? "ok" : "amber", format: () => (choice.corpId ? "+25" : "FREE") });
    }
    if (!rows.length) return;
    const key = `${seed}:${rows.length}`;
    if (!compileHost) compileHost = el("div", "compile");
    body.append(compileHost);
    if (key === compileKey) return; // same record: keep the animation running across re-renders
    compileKey = key;
    compileBlock(compileHost, { title: "PILOT RECORD · COMPILING", seed, rows, stagger: 110 });
  }
  let compileHost = null;

  function render() {
    body.innerHTML = "";
    body.scrollTop = 0;
    if (STEPS[step] === "race") renderRace();
    else if (STEPS[step] === "career") renderCareer();
    else if (STEPS[step] === "corp") renderCorp();
    else renderSky();
    if (STEPS[step] !== "sky") renderCompile();

    const race = choice.raceId ? raceById(choice.raceId).name : "—";
    const career = choice.complexId
      ? (careers.find((c) => c.id === choice.complexId)?.name ?? "").replace(/ Complex$/, "")
      : "—";
    const co =
      choice.corpId === "" ? "Independent" : choice.corpId ? corps.find((c) => c.id === choice.corpId)?.name ?? "—" : "—";
    sum.textContent = `${race} · ${career} · ${co}`;

    backBtn.textContent = step === 0 ? "Cancel" : "Back";
    nextBtn.classList.toggle("hidden", step === STEPS.length - 1);
    nextBtn.disabled = !stepDone(step);
    stepsEl.querySelectorAll("button").forEach((b, i) => {
      b.classList.toggle("done", i < step && stepDone(i));
    });
  }

  function finish(seed) {
    const target = opts.normalizeSeed ? opts.normalizeSeed(seed) : seed;
    if (opts.loadedSeed && target !== opts.loadedSeed()) choice.corpId = "";
    const callsign = $("callsign").value.trim() || "Pilot";

    /* A NEW PILOT IS A NEW RUN. This is the only place in the game that knows
     * that for certain, so it is the only place that can say it.
     *
     * Without this the last pilot's corporation was still on the books —
     * name, treasury, board and all — their fleet was still parked, their
     * callsign was still on the save, and their crew were still filed as
     * aboard a ship that no longer existed. A page refresh brought every bit
     * of it back, because all of it was in localStorage and nothing ever swept
     * it. js/profile.js holds the list of what is a run's and what is the
     * device's; this clears the first and leaves the second.
     *
     * Order matters: release the old crew BEFORE the storage sweep (the sweep
     * does not touch the CRADLE, but the in-memory reset below is what makes
     * the release stick), and start the run BEFORE makePilot, so nothing the
     * new pilot writes is swept out behind them. */
    releaseEmployed(null, "Paid off when their pilot retired");
    resetCompany();
    startRun(callsign);

    makePilot(callsign, choice.raceId, choice.complexId, choice.corpId || null);
    close();
    opts.onLaunch(seed);
  }

  function close() {
    open = false;
    root.classList.add("hidden");
    opts.onClose?.();
  }

  return {
    show() {
      open = true;
      root.classList.remove("hidden");
      $("create-title").textContent = $("callsign").value.trim() || "New pilot";
      /* Corporations belong to the sky that is loaded behind this screen. */
      if (!corps.length) buildCorps(Math.random);
      if (!choice.raceId) choice.raceId = "terran";
      if (!choice.complexId) choice.complexId = "navigation";
      /* Nobody starts owing a corporation anything. Independent is the honest
       * default so the step is never a dead end with a dead Next button. */
      if (choice.corpId === null) choice.corpId = "";
      setStep(0);
    },
    isOpen: () => open,
    /* Called from the HUD paint so the loader reads true. */
    progress(done, total) {
      if (!open) return;
      const pct = total > 0 ? (done / total) * 100 : 100;
      $("load-fill").style.width = `${pct}%`;
      $("load-text").textContent = total > 0 && done < total ? `surfaces ${done}/${total}` : "surfaces ready";
    },
  };
}
