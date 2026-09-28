/* LIVING GALAXY — the hangar: choose a system, then a pilot. (0.3.74)
 *
 * For a signed-in, verified account on living-galaxy.com the start card is
 * this, in this order:
 *
 *   1. THE SYSTEM — Sol (the live, shared sky), a random system, or a named one
 *      a friend gave you. The backdrop grows the system you pick.
 *   2. THE PILOTS the account keeps IN THAT SYSTEM — callsign, career, purse,
 *      when last flown — each with FLY. Only metadata is listed (GET /api/save,
 *      a few hundred bytes); the pilot you pick is the only one fetched.
 *   3. NEW PILOT — up to MAX_PILOTS an account; made in the system chosen above.
 *
 * Guests never see it: they fly in Sol and are not kept (js/account.js
 * eraseGuest). A page with no site behind it keeps the old FLY AS / CREATE.
 *
 * No DOM at import; mountHangar() builds into the element it is given.
 */

export const SOL_ALIASES = new Set(["sol", "public", ""]);
export const skyOf = (p) => (SOL_ALIASES.has(String(p?.sky ?? "").toLowerCase()) ? "sol" : String(p.sky));

/** Pilots grouped by the system they fly in: Map(sky → [pilot]). */
export function pilotsBySky(pilots) {
  const m = new Map();
  for (const p of pilots ?? []) {
    const k = skyOf(p);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(p);
  }
  return m;
}

const ago = (t) => {
  if (!t) return "";
  const s = Math.max(0, Date.now() / 1000 - t);
  if (s < 90) return "just now";
  if (s < 5400) return `${Math.round(s / 60)} min ago`;
  if (s < 129600) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
};

/**
 * @param opts.root       element to build into
 * @param opts.account    js/account.js `account`
 * @param opts.maxPilots  MAX_PILOTS
 * @param opts.system     () => current seed
 * @param opts.setSystem  (seed) => void   — also grows the backdrop
 * @param opts.rollSeed   () => seed
 * @param opts.clean      (text) => seed   — a typed sky name, sanitised
 * @param opts.describe   (seed) => one-line system summary
 * @param opts.name       (seed) => system name
 * @param opts.onFly      async (pilot, seed) => void
 * @param opts.onNew      (seed) => void
 * @param opts.onDelete   async (pilot) => boolean
 */
export function mountHangar(opts) {
  const root = opts.root;
  const doc = root.ownerDocument;
  const el = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, fn) => { const b = el("button", cls, text); b.type = "button"; b.addEventListener("click", fn); return b; };
  let busy = false;
  let note = "";

  function render() {
    root.innerHTML = "";
    const seed = opts.system();
    const pilots = opts.account.pilots ?? [];
    const groups = pilotsBySky(pilots);

    /* 1 · system */
    root.append(el("p", "hangar-step", "1 · System"));
    const chips = el("div", "hangar-chips");
    const sol = btn(`btn ${seed === "sol" ? "btn-accent" : ""}`, "Sol · live", () => pick("sol"));
    sol.id = "hangar-sol";
    const rnd = btn("btn", "Random", () => pick(opts.rollSeed()));
    rnd.id = "hangar-random";
    chips.append(sol, rnd);
    root.append(chips);
    const named = el("div", "hangar-named");
    const input = el("input");
    input.id = "hangar-sky";
    input.placeholder = "or a system's name";
    input.maxLength = 32;
    if (seed !== "sol") input.value = seed;
    const join = btn("btn", "Go", () => { const s = opts.clean(input.value); if (s) pick(s); });
    named.append(input, join);
    root.append(named);
    root.append(el("p", "sys-line hangar-sys", opts.describe(seed)));

    /* 2 · pilots here */
    const here = groups.get(seed) ?? [];
    const loading = opts.account.pilots == null;       // 0.3.75: the list is on its way
    root.append(el("p", "hangar-step", `2 · Pilots in ${opts.name(seed)}`));
    const list = el("div", "hangar-list");
    list.id = "hangar-list";
    if (loading) list.append(el("p", "hangar-empty hangar-loading", "Loading your pilots…"));
    else if (!here.length) list.append(el("p", "hangar-empty", "No pilot of yours flies here yet."));
    for (const p of here) {
      const card = el("div", "hangar-pilot");
      const who = el("div", "hangar-who");
      who.append(el("strong", null, p.callsign || p.slot), el("span", null, [p.career, `${(p.credits ?? 0).toLocaleString()} cr`, ago(p.updated_at)].filter(Boolean).join(" · ")));
      const fly = btn("btn btn-accent", "Fly", async () => {
        if (busy) return;
        busy = true; note = `Loading ${p.callsign || "pilot"}…`; render();
        try { await opts.onFly(p, seed); } finally { busy = false; }
      });
      fly.dataset.slot = p.slot;
      const del = btn("btn btn-ghost hangar-del", "✕", async () => {
        const sure = globalThis.confirm ? confirm(`Delete ${p.callsign || "this pilot"} from your account? There is no undo.`) : true;
        if (!sure || busy) return;
        busy = true;
        try { note = (await opts.onDelete(p)) ? `${p.callsign || "Pilot"} deleted.` : "Could not delete — try again."; } finally { busy = false; }
        render();
      });
      del.title = "Delete this pilot";
      card.append(who, fly, del);
      list.append(card);
    }
    root.append(list);

    /* elsewhere: a quick way over to the systems the other pilots fly in */
    const others = [...groups.entries()].filter(([k]) => k !== seed);
    if (others.length) {
      const o = el("div", "hangar-others");
      o.append(el("span", null, "Your pilots elsewhere: "));
      for (const [k, ps] of others) o.append(btn("btn btn-ghost", `${opts.name(k)} (${ps.length})`, () => pick(k)));
      root.append(o);
    }

    /* 3 · new pilot */
    const full = !loading && pilots.length >= opts.maxPilots;
    const make = btn(`btn ${here.length ? "btn-ghost" : "btn-accent"}`, full ? `${opts.maxPilots} of ${opts.maxPilots} pilots` : `New pilot in ${opts.name(seed)}`, () => { if (!full && !busy) opts.onNew(seed); });
    make.id = "hangar-new";
    make.disabled = full || loading;
    root.append(make);
    if (full) root.append(el("p", "hangar-empty", "Delete a pilot to make room for another."));
    if (note) root.append(el("p", "hangar-note", note));
  }

  function pick(seed) {
    if (busy) return;
    note = "";
    opts.setSystem(seed);
    render();
  }

  render();
  return { render, setNote: (t) => { note = t; render(); } };
}
